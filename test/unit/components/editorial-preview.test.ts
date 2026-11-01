import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import EditorialContent from '../../../src/components/editorial/EditorialContent.astro';
import { renderMarkdown } from '../../../src/components/editorial/safe-markdown';
import { renderRichText, safeMedia, safeHref } from '../../../src/components/editorial/rich-text';
import { verifyRequest, signature, PREVIEW_PATH, MAX_BODY } from '../../../preview/src/lib/security';
import { GET as healthProbe } from '../../../preview/src/pages/health';
import { isPreviewMessage } from '../../../preview/src/lib/client';
const secret = 'synthetic-only-preview-secret-at-least-32-characters';
const now = 1900000000000;
const lexical = (text: string) => ({
  root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text, format: 1 }] }] },
});
function request(
  body: unknown = { collection: 'pages', id: 1, document: { title: 'Synthetic' } },
  overrides: Record<string, string> = {},
  url = PREVIEW_PATH
) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body),
    timestamp = String(now / 1000);
  return new Request(`https://renderer.invalid${url}`, {
    method: 'POST',
    body: raw,
    headers: {
      'content-type': 'application/json',
      'x-preview-timestamp': timestamp,
      'x-preview-signature': signature(timestamp, raw, secret),
      ...overrides,
    },
  });
}
describe('private renderer boundary', () => {
  it('health exposes only configured status and fails closed without the secret', async () => {
    const previous = process.env.DATAHUB_PREVIEW_SECRET;
    try {
      delete process.env.DATAHUB_PREVIEW_SECRET;
      const unavailable = healthProbe();
      expect(unavailable.status).toBe(503);
      expect(await unavailable.json()).toEqual({ status: 'unavailable' });
      process.env.DATAHUB_PREVIEW_SECRET = secret;
      const ready = healthProbe();
      expect(ready.status).toBe(200);
      expect(await ready.json()).toEqual({ status: 'ok' });
      expect(ready.headers.get('cache-control')).toContain('no-store');
      expect(ready.headers.get('x-robots-tag')).toContain('noindex');
    } finally {
      if (previous === undefined) delete process.env.DATAHUB_PREVIEW_SECRET;
      else process.env.DATAHUB_PREVIEW_SECRET = previous;
    }
  });
  it('accepts only a correctly signed short-lived website envelope', async () => {
    expect((await verifyRequest(request(), secret, now)).collection).toBe('pages');
    await expect(verifyRequest(request(), undefined, now)).rejects.toMatchObject({ status: 503 });
    await expect(verifyRequest(request(), secret, now + 61000)).rejects.toMatchObject({ status: 401 });
    await expect(verifyRequest(request(), secret, now - 61000)).rejects.toMatchObject({ status: 401 });
    await expect(
      verifyRequest(request({}, { 'x-preview-signature': '0'.repeat(64) }), secret, now)
    ).rejects.toMatchObject({ status: 401 });
  });
  it('rejects anonymous, business collections, foreign paths and over-limit streamed body', async () => {
    await expect(
      verifyRequest(new Request('https://renderer.invalid/internal/preview'), secret, now)
    ).rejects.toMatchObject({ status: 404 });
    await expect(verifyRequest(request({}, { 'x-preview-timestamp': '' }), secret, now)).rejects.toMatchObject({
      status: 401,
    });
    await expect(
      verifyRequest(request({ collection: 'customers', id: 1, document: { name: 'Private' } }), secret, now)
    ).rejects.toMatchObject({ status: 400 });
    await expect(verifyRequest(request(undefined, {}, '/other'), secret, now)).rejects.toMatchObject({ status: 404 });
    await expect(verifyRequest(request('x'.repeat(MAX_BODY + 1)), secret, now)).rejects.toMatchObject({ status: 413 });
    await expect(
      verifyRequest(request({}, { 'content-length': String(MAX_BODY + 1) }), secret, now)
    ).rejects.toMatchObject({ status: 413 });
  });
  it('detects a body changed after signing and never includes request contents in errors', async () => {
    const original = request();
    const headers = Object.fromEntries(original.headers.entries());
    await expect(
      verifyRequest(request({ collection: 'pages', id: 1, document: { title: 'Changed' } }, headers), secret, now)
    ).rejects.toMatchObject({ status: 401, message: 'Preview unavailable' });
  });
  it('binds the HMAC to exact UTF-8 bytes including a prepended BOM', async () => {
    const original = request();
    const headers = Object.fromEntries(original.headers.entries());
    const raw = await original.text();
    const changed = new Request('https://renderer.invalid/internal/preview', {
      method: 'POST',
      headers,
      body: new Uint8Array([239, 187, 191, ...new TextEncoder().encode(raw)]),
    });
    await expect(verifyRequest(changed, secret, now)).rejects.toMatchObject({ status: 401 });
  });
  it('requires matching origin, parent source and collection before requesting unsaved preview', () => {
    const parent = {} as Window;
    const event = {
      origin: 'https://datahub.invalid',
      source: parent,
      data: { type: 'payload-live-preview', collectionSlug: 'pages', data: { title: 'Unsaved' } },
    } as unknown as MessageEvent;
    expect(isPreviewMessage(event, event.origin, parent, 'pages')).toBeTruthy();
    expect(
      isPreviewMessage({ ...event, origin: 'https://attacker.invalid' } as MessageEvent, event.origin, parent, 'pages')
    ).toBeFalsy();
    expect(isPreviewMessage({ ...event, source: {} } as MessageEvent, event.origin, parent, 'pages')).toBeFalsy();
    expect(isPreviewMessage(event, event.origin, parent, 'team')).toBeFalsy();
  });
});
describe('safe editorial rendering', () => {
  it('renders Lexical text formatting but escapes scripts and ignores HTML nodes', () => {
    expect(renderRichText(lexical('<script>alert(1)</script>'))).toBe(
      '<p><strong>&lt;script&gt;alert(1)&lt;/script&gt;</strong></p>'
    );
    expect(
      renderRichText({ root: { type: 'root', children: [{ type: 'html', html: '<img onerror=alert(1)>' }] } })
    ).toBe('');
    expect(
      renderRichText({
        root: {
          type: 'root',
          children: [
            { type: 'link', fields: { url: 'javascript:alert(1)' }, children: [{ type: 'text', text: 'Safe' }] },
          ],
        },
      })
    ).toBe('Safe');
  });
  it('allows only guarded same-origin raster media URLs and rejects traversal/schemes', () => {
    expect(safeMedia({ url: '/api/media/file/demo.png', mimeType: 'image/png', alt: 'Demo' })?.url).toBe(
      '/api/media/file/demo.png'
    );
    for (const url of [
      'https://attacker.invalid/a.png',
      '//attacker.invalid/a.png',
      '/api/media/file/..%2Fsecret',
      '/api/media/file/a.png?key=bad',
      '/api/media/file/%00a.png',
    ])
      expect(safeMedia({ url, mimeType: 'image/png' })).toBeNull();
    expect(safeMedia({ url: '/api/media/file/a.svg', mimeType: 'image/svg+xml' })).toBeNull();
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('//attacker.invalid')).toBeNull();
  });
  it('renders the five website content shapes with original components and omits internal fields', async () => {
    const container = await AstroContainer.create();
    for (const collection of ['pages', 'services', 'team', 'faqs', 'mcp-projects']) {
      const html = await container.renderToString(EditorialContent, {
        props: {
          collection,
          document: {
            title: 'Synthetic title',
            name: 'Synthetic title',
            question: 'Synthetic title',
            summary: 'Summary',
            descriptionRichText: lexical('Rich content'),
            editorialNotes: 'INTERNAL_MUST_NOT_APPEAR',
            customer: { name: 'CRM_MUST_NOT_APPEAR' },
          },
        },
      });
      expect(html).toContain('Synthetic title');
      expect(html).toContain('Rich content');
      expect(html).not.toContain('INTERNAL_MUST_NOT_APPEAR');
      expect(html).not.toContain('CRM_MUST_NOT_APPEAR');
    }
  });
  it('renders the structured Datahub fields: home hero, service highlights, FAQ placement, npm packages, navigation tree', async () => {
    const container = await AstroContainer.create();
    const render = (collection: string, document: Record<string, unknown>) =>
      container.renderToString(EditorialContent, { props: { collection, document } });
    const home = await render('pages', {
      title: 'Startseite',
      pageKind: 'home',
      hero: {
        eyebrow: 'kieks.me GbR',
        headline: 'zeile eins\nzeile <b>zwei</b>',
        lead: 'Einleitung',
        primaryCta: { label: 'Los', href: '/kontakt' },
        secondaryCta: { label: 'Bad', href: 'javascript:alert(1)' },
        secret: 'INTERNAL_MUST_NOT_APPEAR',
      },
    });
    expect(home).toContain('zeile eins');
    expect(home).toContain('zeile &lt;b&gt;zwei&lt;/b&gt;');
    expect(home).toContain('href="/kontakt"');
    expect(home).not.toContain('javascript:');
    expect(home).not.toContain('INTERNAL_MUST_NOT_APPEAR');
    expect(home.match(/<h1/g)).toHaveLength(1);
    const service = await render('services', {
      title: 'Agent-Hub',
      number: '01',
      accent: 'aqua',
      linkText: 'Mehr',
      href: '/agent-hub',
      highlights: [{ title: 'Hub-Design', description: 'Struktur', x: 'INTERNAL_MUST_NOT_APPEAR' }],
    });
    expect(service).toContain('01 · aqua');
    expect(service).toContain('Hub-Design');
    expect(service).toContain('href="/agent-hub"');
    expect(service).not.toContain('INTERNAL_MUST_NOT_APPEAR');
    expect(await render('faqs', { question: 'Q?', answer: 'A', placement: 'home' })).toContain('Startseite');
    const mcp = await render('mcp-projects', {
      name: 'Contabo MCP',
      repositoryUrl: 'https://github.com/kieksme/mcp-contabo',
      npmPackages: [{ name: '@kieksme/contabo-mcp' }],
    });
    expect(mcp).toContain('@kieksme/contabo-mcp');
    const nav = await render('navigation', {
      title: 'Hauptnavigation',
      key: 'header',
      links: [
        {
          label: 'Leistungen',
          href: '',
          children: [
            { label: 'KI', href: '/leistungen/ki-mcp' },
            { label: 'Bad', href: '//evil.invalid' },
          ],
        },
        { label: 'Kontakt', href: '/kontakt' },
      ],
      actions: [{ label: 'Buchen', href: '/kontakt' }],
      secondaryLinks: [{ label: 'Impressum', href: '/impressum' }],
      socialLinks: [{ label: 'GitHub', href: 'https://github.com/kieksme' }],
      footNote: 'kieks.me GbR · Leipzig',
    });
    for (const expected of [
      'Kopfbereich',
      'Leistungen',
      'href="/leistungen/ki-mcp"',
      'Buchen',
      'Impressum',
      'GitHub',
      'Leipzig',
    ])
      expect(nav).toContain(expected);
    expect(nav).not.toContain('evil.invalid');
  });
  it('renders sections and media alt text through escaped attributes', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(EditorialContent, {
      props: {
        collection: 'pages',
        document: {
          title: 'Demo',
          sections: [
            {
              heading: 'Section',
              richText: lexical('Body'),
              media: { url: '/api/media/file/demo.png', mimeType: 'image/png', alt: '" onerror="alert(1)' },
            },
          ],
        },
      },
    });
    expect(html).toContain('Section');
    expect(html).toContain('Body');
    expect(html).not.toContain('alt="" onerror=');
    expect(html).toContain('/api/media/file/demo.png');
  });
});

describe('blog, legal and author previews', () => {
  it('keeps legacy legal address and autolinks while refusing executable HTML', () => {
    const html = renderMarkdown(
      '# Legal\n\n<address>\nExample company<br>\nDemo Street 1<br>\n</address>\n\nMail: <demo@example.invalid><br>\n\n[Unsafe](javascript:alert%281%29)\n\n<script>alert(1)</script>'
    );
    expect(html).toContain('<address>Example company<br>');
    expect(html).toContain('Demo Street 1');
    expect(html).toContain('href="mailto:demo@example.invalid"');
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(renderMarkdown('```html\n<address>literal<br></address>\n```')).toContain(
      '&lt;address&gt;literal&lt;br&gt;&lt;/address&gt;'
    );
  });
  it('renders complete long Markdown and fails explicitly above its limit', () => {
    expect(renderMarkdown('a'.repeat(100010) + 'END_MARKER')).toContain('END_MARKER');
    expect(() => renderMarkdown('a'.repeat(256 * 1024 + 1))).toThrow(RangeError);
  });
  it('uses Markdown when an untouched rich-text editor has only an empty paragraph', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(EditorialContent, {
      props: {
        collection: 'pages',
        document: {
          title: 'Legal',
          pageKind: 'legal',
          contentRichText: lexical(''),
          contentMarkdown: '## Retained legal heading\n\nRetained legal words.',
        },
      },
    });
    expect(html).toContain('Retained legal heading');
    expect(html).toContain('Retained legal words.');
  });
  it('renders an article with author relation, stable date, excerpt and escaped tags', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(EditorialContent, {
      props: {
        collection: 'posts',
        document: {
          title: 'Synthetic article',
          excerpt: 'Article excerpt',
          publishedAt: '2026-10-31T00:00:00.000Z',
          authorName: 'Legacy author',
          author: { id: 11, name: 'Demo author', email: 'PRIVATE_NOT_RENDERED' },
          category: 'Engineering',
          tags: [{ tag: 'Astro' }, { tag: '<script>bad</script>' }],
          contentRichText: lexical('Article body'),
        },
      },
    });
    expect(html).toContain('31. Oktober 2026');
    expect(html).toContain('datetime="2026-10-31T00:00:00.000Z"');
    expect(html).toContain('/preview/authors/11');
    expect(html).toContain('Demo author');
    expect(html).not.toContain('Legacy author');
    expect(html).toContain('Article excerpt');
    expect(html).toContain('Article body');
    expect(html).toContain('Astro');
    expect(html).not.toContain('<script>bad</script>');
    expect(html).not.toContain('PRIVATE_NOT_RENDERED');
  });
  it('shows published article briefs supplied by the author DTO and an inert contact form', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(EditorialContent, {
      props: {
        collection: 'authors',
        document: {
          name: 'Demo author',
          bioRichText: lexical('Author bio'),
          contactEnabled: true,
          posts: [{ id: 21, title: 'Published article', excerpt: 'Published excerpt' }],
          email: 'PRIVATE_NOT_RENDERED',
        },
      },
    });
    expect(html).toContain('Author bio');
    expect(html).toContain('Published article');
    expect(html).toContain('/preview/posts/21');
    expect(html).toContain('<fieldset disabled');
    expect(html).toContain('type="button" disabled');
    expect(html).not.toContain('action=');
    expect(html).toContain('Nachrichten können hier nicht gesendet werden');
    expect(html).not.toContain('PRIVATE_NOT_RENDERED');
    const withoutContact = await container.renderToString(EditorialContent, {
      props: { collection: 'authors', document: { name: 'Demo author', contactEnabled: false } },
    });
    expect(withoutContact).not.toContain('<form');
  });
});
