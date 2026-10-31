import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { fetchCmsBuildContent, mapCmsMetadata, resolvePublicMedia } from '../../../src/utils/payload-build';
import type { CmsBuildContent } from '../../../src/utils/payload-build';
import { cmsPosts, renderPublicRichText } from '../../../src/utils/cms-content';
import { articleData, personData, serializeStructuredData } from '../../../src/utils/structured-data';
import StructuredData from '../../../src/components/common/StructuredData.astro';
import AuthorContact from '../../../src/components/blog/AuthorContact.astro';
const origin = 'https://cms.example.invalid';
const secret = 'synthetic-build-api-key-must-never-appear-in-public-output';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==',
  'base64'
);
const folders: string[] = [];
afterEach(async () => {
  await Promise.all(folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })));
});
async function directory() {
  const folder = await mkdtemp(path.join(tmpdir(), 'cms-build-test-'));
  folders.push(folder);
  return folder;
}
const empty = (): CmsBuildContent => ({ enabled: true, pages: [], posts: [], authors: [], media: {}, site: {} });
function server(
  overrides: Record<string, unknown[]> = {},
  transform?: (body: Record<string, unknown>, url: URL) => void
) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    expect(url.origin).toBe(origin);
    expect(url.href).not.toContain(secret);
    expect(init?.headers).toEqual({ Authorization: `users API-Key ${secret}` });
    expect(init?.redirect).toBe('error');
    if (url.pathname.startsWith('/api/media/file/'))
      return new Response(png, { headers: { 'Content-Type': 'image/png' } });
    const slug = url.pathname.split('/').pop()!;
    expect(['pages', 'posts', 'authors', 'media']).toContain(slug);
    expect(url.searchParams.get('draft')).toBe('false');
    expect(url.searchParams.get('depth')).toBe('0');
    const body: Record<string, unknown> = {
      docs: overrides[slug] ?? [],
      totalPages: 1,
      page: Number(url.searchParams.get('page')),
    };
    transform?.(body, url);
    return Response.json(body);
  });
}
describe('server-only static CMS build', () => {
  it('works without CMS configuration and requires both settings when enabled', async () => {
    const fetcher = vi.fn();
    expect((await fetchCmsBuildContent({ fetcher })).enabled).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
    await expect(fetchCmsBuildContent({ url: origin, fetcher })).rejects.toThrow('Both');
    await expect(fetchCmsBuildContent({ url: 'http://unsafe.invalid', apiKey: secret, fetcher })).rejects.toThrow(
      'HTTPS'
    );
  });
  it('fetches all pages using only the published website allowlist with narrow selects', async () => {
    const fetcher = server({}, (body, url) => {
      if (url.pathname === '/api/posts') {
        const page = Number(url.searchParams.get('page'));
        body.totalPages = 2;
        body.docs = [{ id: page, _status: 'published', title: 'Public', privateCustomerData: 'DO_NOT_KEEP' }];
      }
    });
    const result = await fetchCmsBuildContent({
      url: origin,
      apiKey: secret,
      fetcher,
      mediaDirectory: await directory(),
    });
    expect(result.posts.map((doc) => doc.id)).toEqual([1, 2]);
    expect(result.posts[0]).not.toHaveProperty('privateCustomerData');
    expect(fetcher.mock.calls.map((call) => new URL(String(call[0])).pathname)).not.toContain('/api/customers');
    expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get('select[title]')).toBe('true');
  });
  it('fails closed if the server returns drafts or incomplete/duplicate pagination', async () => {
    await expect(
      fetchCmsBuildContent({
        url: origin,
        apiKey: secret,
        fetcher: server({ posts: [{ id: 1, _status: 'draft' }] }),
        mediaDirectory: await directory(),
      })
    ).rejects.toThrow('Unpublished');
    await expect(
      fetchCmsBuildContent({
        url: origin,
        apiKey: secret,
        fetcher: server({}, (body) => {
          body.totalPages = 201;
        }),
        mediaDirectory: await directory(),
      })
    ).rejects.toThrow('pagination');
    await expect(
      fetchCmsBuildContent({
        url: origin,
        apiKey: secret,
        fetcher: server({
          posts: [
            { id: 1, _status: 'published' },
            { id: 1, _status: 'published' },
          ],
        }),
        mediaDirectory: await directory(),
      })
    ).rejects.toThrow('Duplicate');
  });
  it('accepts the native SQL empty-result pagination shape with zero total pages', async () => {
    const result = await fetchCmsBuildContent({
      url: origin,
      apiKey: secret,
      mediaDirectory: await directory(),
      fetcher: server({}, (body) => {
        body.totalPages = 0;
        body.totalDocs = 0;
        body.hasNextPage = false;
      }),
    });
    expect(result.posts).toEqual([]);
    expect(result.authors).toEqual([]);
  });
  it('exports only explicitly website-published same-origin image files by content hash', async () => {
    const folder = await directory();
    const fetcher = server({
      media: [
        {
          id: 7,
          websitePublished: true,
          url: '/api/media/file/original.png',
          mimeType: 'image/png',
          alt: 'Public image',
        },
      ],
    });
    const result = await fetchCmsBuildContent({ url: origin, apiKey: secret, fetcher, mediaDirectory: folder });
    expect(result.media['7'].url).toMatch(/^\/_cms-media\/[a-f0-9]{64}\.png$/);
    expect(await readFile(path.join(folder, path.basename(result.media['7'].url)))).toEqual(png);
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(() => resolvePublicMedia(result, 99)).toThrow('publication permission');
    for (const media of [
      { websitePublished: false, url: '/api/media/file/a.png' },
      { websitePublished: true, url: 'https://external.invalid/a.png' },
      { websitePublished: true, url: '/api/media/file/%2e%2e%2fsecret.png' },
    ]) {
      await expect(
        fetchCmsBuildContent({
          url: origin,
          apiKey: secret,
          fetcher: server({ media: [{ id: 1, mimeType: 'image/png', ...media }] }),
          mediaDirectory: await directory(),
        })
      ).rejects.toThrow();
    }
  });
  it('rejects upstream redirects/failures without echoing response bodies or credentials', async () => {
    const fetcher = vi.fn(async () => new Response(secret, { status: 403 }));
    await expect(
      fetchCmsBuildContent({ url: origin, apiKey: secret, fetcher, mediaDirectory: await directory() })
    ).rejects.toThrow('no response payload logged');
  });
  it('maps complete SEO and static social images without arbitrary URL execution', () => {
    const content = empty();
    content.media['7'] = { url: '/_cms-media/hash.png', alt: 'Fallback alt' };
    const metadata = mapCmsMetadata(
      {
        title: 'Title',
        description: 'Description',
        canonical: 'https://kieks.me/blog/demo',
        robots: { index: false, follow: true },
        openGraph: { title: 'OG', description: 'OG description', image: 7, imageAlt: 'OG alt', type: 'article' },
        twitter: { card: 'summary_large_image', title: 'X title', description: 'X description', image: 7 },
      },
      content
    );
    expect(metadata.openGraph).toMatchObject({
      title: 'OG',
      description: 'OG description',
      images: [{ url: '/_cms-media/hash.png', alt: 'OG alt' }],
    });
    expect(metadata.twitter).toMatchObject({
      title: 'X title',
      image: '/_cms-media/hash.png',
      cardType: 'summary_large_image',
    });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(() => mapCmsMetadata({ canonical: 'javascript:alert(1)' }, content)).toThrow('canonical');
  });
  it('uses only published author DTOs and static media in rendered blog content', () => {
    const content = empty();
    content.media['7'] = { url: '/_cms-media/hash.png', alt: 'Image' };
    content.authors = [{ id: 2, name: 'Public Name', slug: 'public-name', email: 'PRIVATE_EMAIL' }];
    content.posts = [{ id: 1, title: 'Article', slug: 'article', publishedAt: '2026-10-30T12:00:00Z', author: 2 }];
    const [post] = cmsPosts(content);
    expect(post.authorProfile?.url).toBe('/blog/autoren/public-name');
    expect(JSON.stringify(personData(post.authorProfile!))).not.toContain('PRIVATE_EMAIL');
    expect(articleData(post)).toMatchObject({ '@type': 'BlogPosting', url: 'https://kieks.me/blog/article' });
    expect(
      renderPublicRichText(
        {
          root: {
            type: 'root',
            children: [
              { type: 'upload', relationTo: 'media', value: 7 },
              { type: 'text', text: '<script>bad()</script>' },
            ],
          },
        },
        content
      )
    ).toContain('src="/_cms-media/hash.png"');
    content.posts[0].author = 999;
    expect(() => cmsPosts(content)).toThrow('unpublished');
  });
});
describe('public CMS components', () => {
  it('serializes JSON-LD without closing the script or leaking private author fields', async () => {
    const malicious = '</script><script>alert(1)</script>';
    expect(serializeStructuredData({ name: malicious })).not.toContain('<');
    const container = await AstroContainer.create();
    const html = await container.renderToString(StructuredData, {
      props: { items: [{ '@type': 'Person', name: malicious }] },
    });
    expect(html).toContain('application/ld+json');
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(JSON.parse(html.match(/>(.*?)<\/script>/s)![1])['@graph'][0].name).toBe(malicious);
  });
  it('renders a disabled form demo and never puts a CMS key in HTML or an email in its endpoint', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(AuthorContact, {
      props: { authorSlug: 'public-name', authorName: 'Public Name', isDemo: true },
    });
    expect(html).toContain('method="post"');
    expect(html).toContain('/api/author-contact/public-name');
    expect(html).toContain('disabled');
    expect(html).toContain('name="website"');
    expect(html).not.toContain(secret);
    expect(html).not.toContain('API-Key');
  });
});
