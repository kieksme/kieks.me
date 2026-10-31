// Server/build only. Never import this module from a client script.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { MetaData } from '../types';

export type CmsDocument = Record<string, unknown>;
export interface CmsBuildContent {
  enabled: boolean;
  posts: CmsDocument[];
  pages: CmsDocument[];
  authors: CmsDocument[];
  media: Record<string, { url: string; alt: string; width?: number; height?: number }>;
}
const empty = (): CmsBuildContent => ({ enabled: false, posts: [], pages: [], authors: [], media: {} });
const fields = {
  pages: ['id', '_status', 'title', 'slug', 'pageKind', 'contentMarkdown', 'seo'],
  posts: [
    'id',
    '_status',
    'title',
    'slug',
    'excerpt',
    'publishedAt',
    'updatedAt',
    'author',
    'authorName',
    'category',
    'tags',
    'heroImage',
    'contentRichText',
    'seo',
  ],
  authors: ['id', '_status', 'name', 'slug', 'bioRichText', 'avatar', 'seo', 'contactEnabled'],
  media: ['id', 'websitePublished', 'url', 'mimeType', 'alt', 'width', 'height'],
} as const;
type Collection = keyof typeof fields;
const imageTypes: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};
export const text = (value: unknown): string => (typeof value === 'string' ? value : '');
export function publicSlug(value: unknown): string {
  const slug = text(value);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180)
    throw new Error('CMS contains an invalid public slug');
  return slug;
}
export const relationId = (value: unknown): string =>
  String(value && typeof value === 'object' ? (value as CmsDocument).id : (value ?? ''));
const object = (value: unknown): CmsDocument =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as CmsDocument) : {};
const pick = (value: CmsDocument, keys: readonly string[]) =>
  Object.fromEntries(keys.filter((key) => key in value).map((key) => [key, value[key]]));

export async function fetchCmsBuildContent(
  options: { url?: string; apiKey?: string; fetcher?: typeof fetch; mediaDirectory?: string } = {}
): Promise<CmsBuildContent> {
  if (!options.url && !options.apiKey) return empty();
  if (!options.url || !options.apiKey) throw new Error('Both PAYLOAD_URL and PAYLOAD_BUILD_API_KEY are required');
  let origin: URL;
  try {
    origin = new URL(options.url);
  } catch {
    throw new Error('Invalid PAYLOAD_URL');
  }
  if (
    origin.protocol !== 'https:' ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== '/'
  )
    throw new Error('PAYLOAD_URL must be an HTTPS origin');
  const fetcher = options.fetcher ?? fetch;
  const headers = { Authorization: `users API-Key ${options.apiKey}` };
  async function request(url: URL): Promise<Response> {
    try {
      const response = await fetcher(url, { headers, redirect: 'error', signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error('upstream');
      return response;
    } catch {
      throw new Error('CMS build request failed; no response payload logged');
    }
  }
  async function collection(slug: Collection): Promise<CmsDocument[]> {
    const docs: CmsDocument[] = [];
    const seen = new Set<string>();
    let expectedPages: number | undefined;
    for (let page = 1; page <= 200; page++) {
      const url = new URL(`/api/${slug}`, origin);
      url.searchParams.set('draft', 'false');
      url.searchParams.set('depth', '0');
      url.searchParams.set('limit', '100');
      url.searchParams.set('page', String(page));
      url.searchParams.set('sort', 'id');
      for (const field of fields[slug]) url.searchParams.set(`select[${field}]`, 'true');
      if (slug === 'media') url.searchParams.set('where[websitePublished][equals]', 'true');
      else {
        url.searchParams.set('where[_status][equals]', 'published');
        if (slug === 'pages') url.searchParams.set('where[pageKind][equals]', 'legal');
      }
      const response = await request(url);
      let body: CmsDocument;
      try {
        body = object(await response.json());
      } catch {
        throw new Error(`CMS ${slug} returned an invalid or unavailable JSON response`);
      }
      if (
        !Array.isArray(body.docs) ||
        !Number.isInteger(body.totalPages) ||
        Number(body.totalPages) < 1 ||
        Number(body.totalPages) > 200 ||
        (body.page !== undefined && body.page !== page)
      )
        throw new Error(`Invalid CMS pagination for ${slug}`);
      if (expectedPages !== undefined && expectedPages !== body.totalPages)
        throw new Error(`CMS pagination changed during ${slug} build`);
      expectedPages = Number(body.totalPages);
      for (const raw of body.docs) {
        const doc = object(raw),
          id = relationId(doc.id);
        if (!id || seen.has(id)) throw new Error(`Duplicate or missing CMS id in ${slug}`);
        seen.add(id);
        if (slug === 'media' ? doc.websitePublished !== true : doc._status !== 'published')
          throw new Error(`Unpublished CMS ${slug} rejected`);
        if (slug === 'pages' && doc.pageKind !== 'legal') throw new Error('Non-legal CMS page rejected');
        docs.push(pick(doc, fields[slug]));
      }
      if (page === body.totalPages) {
        if (body.totalDocs !== undefined && (!Number.isInteger(body.totalDocs) || body.totalDocs !== docs.length))
          throw new Error(`Incomplete CMS pagination for ${slug}`);
        return docs;
      }
      if (body.docs.length === 0) throw new Error(`Incomplete CMS pagination for ${slug}`);
    }
    throw new Error('CMS pagination exceeded safety limit');
  }
  const [posts, pages, authors, mediaRecords] = await Promise.all([
    collection('posts'),
    collection('pages'),
    collection('authors'),
    collection('media'),
  ]);
  const result: CmsBuildContent = { enabled: true, posts, pages, authors, media: {} };
  const directory = options.mediaDirectory ?? path.resolve('public/_cms-media');
  await mkdir(directory, { recursive: true });
  for (const media of mediaRecords) {
    const mime = text(media.mimeType),
      extension = imageTypes[mime];
    if (!extension) throw new Error('Published CMS media has an unsupported image type');
    let url: URL;
    try {
      url = new URL(text(media.url), origin);
    } catch {
      throw new Error('Invalid CMS media URL');
    }
    const prefix = '/api/media/file/';
    let filename = '';
    try {
      filename = decodeURIComponent(url.pathname.slice(prefix.length));
    } catch {
      /* rejected below */
    }
    if (
      url.origin !== origin.origin ||
      !url.pathname.startsWith(prefix) ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      !filename ||
      [...filename].some((char) => '/\\?#'.includes(char) || char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
      filename === '.' ||
      filename === '..'
    )
      throw new Error('CMS media must use its own authenticated file endpoint');
    const response = await request(url);
    if (response.headers.get('content-type')?.split(';')[0] !== mime) throw new Error('CMS media MIME mismatch');
    const limit = 20 * 1024 * 1024;
    if (Number(response.headers.get('content-length')) > limit) throw new Error('CMS media is too large');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('CMS media body missing');
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new Error('CMS media is too large');
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    const signature =
      extension === 'png'
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : extension === 'jpg'
          ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
          : extension === 'gif'
            ? /^GIF8[79]a/.test(bytes.subarray(0, 6).toString())
            : extension === 'webp'
              ? bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
              : bytes.subarray(4, 8).toString() === 'ftyp' && /avif|avis/.test(bytes.subarray(8, 32).toString());
    if (!signature) throw new Error('CMS media signature mismatch');
    const name = `${createHash('sha256').update(bytes).digest('hex')}.${extension}`;
    await writeFile(path.join(directory, name), bytes);
    result.media[relationId(media.id)] = {
      url: `/_cms-media/${name}`,
      alt: text(media.alt),
      width: typeof media.width === 'number' ? media.width : undefined,
      height: typeof media.height === 'number' ? media.height : undefined,
    };
  }
  return result;
}

export function resolvePublicMedia(content: CmsBuildContent, value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const media = content.media[relationId(value)];
  if (!media) throw new Error('Content references media without website publication permission');
  return media;
}
export function mapCmsMetadata(value: unknown, content: CmsBuildContent): MetaData {
  const seo = object(value),
    og = object(seo.openGraph),
    twitter = object(seo.twitter),
    robots = object(seo.robots);
  const canonical = text(seo.canonical);
  if (canonical) {
    let url: URL;
    try {
      url = new URL(canonical);
    } catch {
      throw new Error('Invalid CMS canonical URL');
    }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid CMS canonical URL');
  }
  const image = resolvePublicMedia(content, og.image),
    twitterImage = resolvePublicMedia(content, twitter.image);
  return {
    title: text(seo.title) || undefined,
    description: text(seo.description) || undefined,
    canonical: canonical || undefined,
    robots: {
      index: typeof robots.index === 'boolean' ? robots.index : undefined,
      follow: typeof robots.follow === 'boolean' ? robots.follow : undefined,
    },
    openGraph: {
      title: text(og.title) || undefined,
      description: text(og.description) || undefined,
      type: ['website', 'article'].includes(text(og.type)) ? text(og.type) : undefined,
      images: image ? [{ ...image, alt: text(og.imageAlt) || image.alt }] : undefined,
    },
    twitter: {
      title: text(twitter.title) || undefined,
      description: text(twitter.description) || undefined,
      cardType: ['summary', 'summary_large_image'].includes(text(twitter.card)) ? text(twitter.card) : undefined,
      image: twitterImage?.url,
    },
  };
}

const snapshot = path.resolve('.runtime/payload-build.json');
const configuration = () => ({
  url: process.env.PAYLOAD_URL ?? import.meta.env?.PAYLOAD_URL,
  apiKey: process.env.PAYLOAD_BUILD_API_KEY ?? import.meta.env?.PAYLOAD_BUILD_API_KEY,
});
export async function prepareCmsBuild() {
  await rm(path.resolve('public/_cms-media'), { recursive: true, force: true });
  const content = await fetchCmsBuildContent(configuration());
  await mkdir(path.dirname(snapshot), { recursive: true });
  await writeFile(snapshot, JSON.stringify(content), { mode: 0o600 });
}
let cached: Promise<CmsBuildContent> | undefined;
export async function loadCmsBuildContent(): Promise<CmsBuildContent> {
  return (cached ??= (async () => {
    try {
      return JSON.parse(await readFile(snapshot, 'utf8')) as CmsBuildContent;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      return fetchCmsBuildContent(configuration());
    }
  })());
}
export const finishCmsBuild = () => rm(snapshot, { force: true });
