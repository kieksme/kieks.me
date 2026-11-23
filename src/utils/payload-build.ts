// Server/build only. Never import this module from a client script.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { MetaData } from '../types';

export type CmsDocument = Record<string, unknown>;
export interface CmsBuildContent {
  locale?: 'de' | 'en';
  enabled: boolean;
  posts: CmsDocument[];
  pages: CmsDocument[];
  authors: CmsDocument[];
  media: Record<string, { url: string; alt: string; width?: number; height?: number }>;
  /** Optional editable site sections (services, team, faqs, mcp-projects, navigation). Empty unless enabled. */
  site: Record<string, CmsDocument[]>;
}
const empty = (): CmsBuildContent => ({ enabled: false, posts: [], pages: [], authors: [], media: {}, site: {} });
const fields = {
  pages: [
    'id',
    '_status',
    'title',
    'slug',
    'pageKind',
    'contentMarkdown',
    'contentRichText',
    'sections',
    'hero',
    'seo',
  ],
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
  // `filename` is required: Payload derives `url` from it and returns `url: null` when it is not selected.
  media: ['id', 'websitePublished', 'filename', 'url', 'mimeType', 'alt', 'width', 'height'],
  // Editable website sections; shape documented in src/content-model/site-content.ts and
  // mirrored by kieksme/kieks.me.datahub (docs/editorial/website-schema.md).
  services: [
    'id',
    '_status',
    'sortOrder',
    'slug',
    'title',
    'summary',
    'href',
    'linkText',
    'accent',
    'highlights',
    'descriptionRichText',
  ],
  team: ['id', '_status', 'sortOrder', 'slug', 'name', 'position', 'bio', 'bioRichText', 'accent'],
  faqs: ['id', '_status', 'sortOrder', 'slug', 'question', 'answer', 'answerRichText', 'placement', 'accent'],
  'mcp-projects': [
    'id',
    'slug',
    '_status',
    'sortOrder',
    'slug',
    'kind',
    'name',
    'summary',
    'repositoryUrl',
    'documentationUrl',
    'license',
    'npmPackages',
    'descriptionRichText',
    'accent',
  ],
  trainings: [
    'id',
    '_status',
    'sortOrder',
    'title',
    'slug',
    'summary',
    'description',
    'descriptionRichText',
    'duration',
    'format',
    'deliveryLanguages',
    'trainers',
    'requestUrl',
    'seo',
  ],
  // Courses have no draft status: the Datahub shares only teaser fields of courses flagged `publicOnWebsite`.
  courses: ['id', 'publicOnWebsite', 'slug', 'title', 'description', 'modules'],
  navigation: ['id', '_status', 'key', 'links', 'actions', 'secondaryLinks', 'socialLinks', 'footNote'],
} as const;
export const SITE_COLLECTIONS = ['services', 'team', 'faqs', 'mcp-projects', 'navigation'] as const;
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
  options: {
    url?: string;
    apiKey?: string;
    fetcher?: typeof fetch;
    mediaDirectory?: string;
    /** Opt in to editable site sections. Off by default so builds never request unknown collections. */
    siteContent?: boolean;
    /** Enable only after the additive Datahub trainings migrations have shipped. */
    trainings?: boolean;
    /** Enable only after the Datahub `course_public_flag` migration has shipped. */
    courses?: boolean;
    locale?: 'de' | 'en';
    /** Only for the explicitly opted-in private Docker staging preview. */
    privateHttp?: boolean;
  } = {}
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
    (origin.protocol !== 'https:' &&
      !(options.privateHttp && origin.protocol === 'http:' && /^[a-z0-9-]+$/.test(origin.hostname))) ||
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
      url.searchParams.set('locale', options.locale ?? 'de');
      url.searchParams.set('fallback-locale', 'none');
      url.searchParams.set('depth', '0');
      url.searchParams.set('limit', '100');
      url.searchParams.set('page', String(page));
      url.searchParams.set('sort', 'id');
      for (const field of fields[slug]) url.searchParams.set(`select[${field}]`, 'true');
      if (slug !== 'media') url.searchParams.set('select[pathSlug]', 'true');
      if (slug === 'media') url.searchParams.set('where[websitePublished][equals]', 'true');
      else if (slug === 'courses') url.searchParams.set('where[publicOnWebsite][equals]', 'true');
      else {
        url.searchParams.set('where[_status][equals]', 'published');
        if (slug === 'pages') {
          // The home page is only requested when editable site sections are enabled.
          if (options.siteContent)
            url.searchParams.set('where[pageKind][in]', options.trainings ? 'legal,home,standard' : 'legal,home');
          else url.searchParams.set('where[pageKind][equals]', 'legal');
        }
      }
      const response = await request(url);
      let body: CmsDocument;
      try {
        body = object(await response.json());
      } catch {
        throw new Error(`CMS ${slug} returned an invalid or unavailable JSON response`);
      }
      // Payload's SQL distinct-query path reports zero pages for an empty result.
      if (
        page === 1 &&
        body.totalPages === 0 &&
        body.totalDocs === 0 &&
        Array.isArray(body.docs) &&
        body.docs.length === 0 &&
        body.hasNextPage !== true &&
        (body.page === undefined || body.page === 1)
      )
        return [];
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
        if (
          slug === 'media'
            ? doc.websitePublished !== true
            : slug === 'courses'
              ? doc.publicOnWebsite !== true
              : doc._status !== 'published'
        )
          throw new Error(`Unpublished CMS ${slug} rejected`);
        if (
          slug === 'pages' &&
          doc.pageKind !== 'legal' &&
          !(options.siteContent && (doc.pageKind === 'home' || (options.trainings && doc.pageKind === 'standard')))
        )
          throw new Error('Unexpected CMS page kind rejected');
        docs.push({
          ...pick(doc, fields[slug]),
          // Defense in depth: course body text must never enter the build snapshot,
          // even if the Datahub field access were misconfigured.
          ...(slug === 'courses'
            ? {
                modules: (Array.isArray(doc.modules) ? doc.modules : []).map((module) =>
                  pick(object(module), ['title', 'duration', 'objectives'])
                ),
              }
            : {}),
          ...(typeof doc.pathSlug === 'string' ? { pathSlug: doc.pathSlug } : {}),
        });
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
  const site: Record<string, CmsDocument[]> = {};
  if (options.siteContent) {
    const loaded = await Promise.all(SITE_COLLECTIONS.map((slug) => collection(slug)));
    SITE_COLLECTIONS.forEach((slug, index) => {
      site[slug] = loaded[index];
    });
  }
  if (options.trainings) site.trainings = await collection('trainings');
  if (options.courses) site.courses = await collection('courses');
  const result: CmsBuildContent = {
    enabled: true,
    locale: options.locale ?? 'de',
    posts,
    pages,
    authors,
    media: {},
    site,
  };
  const directory = options.mediaDirectory ?? path.resolve('public/_cms-media');
  await mkdir(directory, { recursive: true });
  for (const media of mediaRecords) {
    if (options.locale === 'en' && !text(media.alt).trim()) continue;
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

const snapshot = (locale: 'de' | 'en') => path.resolve(`.runtime/payload-build${locale === 'de' ? '' : '-en'}.json`);
const configuration = (locale: 'de' | 'en' = 'de') => ({
  locale,
  privateHttp: process.env.STAGING_CMS_PREVIEW === 'true' && process.env.PAYLOAD_ALLOW_PRIVATE_HTTP === 'true',
  url: process.env.PAYLOAD_URL ?? import.meta.env?.PAYLOAD_URL,
  apiKey: process.env.PAYLOAD_BUILD_API_KEY ?? import.meta.env?.PAYLOAD_BUILD_API_KEY,
  trainings: (process.env.PAYLOAD_TRAININGS ?? import.meta.env?.PAYLOAD_TRAININGS) === 'true',
  courses: (process.env.PAYLOAD_COURSES ?? import.meta.env?.PAYLOAD_COURSES) === 'true',
  siteContent: (process.env.PAYLOAD_SITE_CONTENT ?? import.meta.env?.PAYLOAD_SITE_CONTENT) === 'true',
});
export async function prepareCmsBuild() {
  await rm(path.resolve('public/_cms-media'), { recursive: true, force: true });
  await mkdir(path.dirname(snapshot('de')), { recursive: true });
  for (const locale of ['de', 'en'] as const) {
    const content =
      locale === 'en' && process.env.PAYLOAD_I18N !== 'true'
        ? empty()
        : await fetchCmsBuildContent(configuration(locale));
    await writeFile(snapshot(locale), JSON.stringify(content), { mode: 0o600 });
  }
}
const cached = new Map<string, Promise<CmsBuildContent>>();
export async function loadCmsBuildContent(locale: 'de' | 'en' = 'de'): Promise<CmsBuildContent> {
  if (!cached.has(locale))
    cached.set(
      locale,
      (async () => {
        try {
          return JSON.parse(await readFile(snapshot(locale), 'utf8')) as CmsBuildContent;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          return locale === 'en' && process.env.PAYLOAD_I18N !== 'true'
            ? empty()
            : fetchCmsBuildContent(configuration(locale));
        }
      })()
    );
  return cached.get(locale)!;
}
export const finishCmsBuild = () =>
  Promise.all(['de', 'en'].map((locale) => rm(snapshot(locale as 'de' | 'en'), { force: true })));
