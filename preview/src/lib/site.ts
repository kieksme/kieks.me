// Protected whole-site preview: serves the prebuilt Pop-Art website from a private directory.
// Every request must be signed by the authenticated Datahub bridge. No CMS access, no secrets in output.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { PreviewError, privateHeaders } from './security';

export const SITE_PREFIX = '/site';
export const NONCE_TTL_SECONDS = 120;
const EMPTY_BODY_HASH = createHash('sha256').update('').digest('hex');
const seenNonces = new Map<string, number>();
const MAX_NONCES = 20000;

const types: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  webmanifest: 'application/manifest+json; charset=utf-8',
  woff2: 'font/woff2',
  woff: 'font/woff',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
};

/** Base path under which the authenticated bridge exposes the preview, e.g. `/preview/site`. */
export function basePath(value = process.env.PREVIEW_SITE_BASE_PATH || '/preview/site'): string {
  if (!/^\/[a-z0-9_/-]*[a-z0-9_-]$/.test(value) || value.includes('//')) throw new PreviewError(503);
  return value;
}

export function siteSignature(timestamp: string, pathname: string, nonce: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}\nGET\n${pathname}\n${EMPTY_BODY_HASH}\n${nonce}`)
    .digest('hex');
}

/** Verifies a signed GET (timestamp ±60 s, one-time nonce, exact path, no query, no body). */
export function verifySiteRequest(request: Request, secret: string | undefined, now = Date.now()): string {
  if (!secret || secret.length < 32) throw new PreviewError(503);
  const url = new URL(request.url);
  if (request.method !== 'GET' || (url.pathname !== SITE_PREFIX && !url.pathname.startsWith(`${SITE_PREFIX}/`)))
    throw new PreviewError(404);
  if (url.search || url.hash) throw new PreviewError(404);
  const timestamp = request.headers.get('x-preview-timestamp') || '';
  const supplied = request.headers.get('x-preview-signature') || '';
  const nonce = request.headers.get('x-preview-nonce') || '';
  if (
    !/^\d{10}$/.test(timestamp) ||
    Math.abs(now / 1000 - Number(timestamp)) > 60 ||
    !/^[a-f0-9]{64}$/.test(supplied) ||
    !/^[a-f0-9]{16,64}$/.test(nonce)
  )
    throw new PreviewError(401);
  // The signed value is the raw request path so encoded traversal cannot be signed by accident.
  const expected = siteSignature(timestamp, url.pathname, nonce, secret);
  if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(supplied, 'hex'))) throw new PreviewError(401);
  const seconds = Math.floor(now / 1000);
  for (const [key, expires] of seenNonces) if (expires < seconds) seenNonces.delete(key);
  if (seenNonces.has(nonce)) throw new PreviewError(401);
  if (seenNonces.size >= MAX_NONCES) throw new PreviewError(503);
  seenNonces.set(nonce, seconds + NONCE_TTL_SECONDS + 1);
  return url.pathname;
}

/** Maps a verified request path to candidate relative files. Rejects anything but plain static-site paths. */
export function candidateFiles(pathname: string): string[] {
  if (!/^\/site(?:\/[A-Za-z0-9._~-]+)*\/?$/.test(pathname)) throw new PreviewError(404);
  const rest = pathname.slice(SITE_PREFIX.length).replace(/^\//, '');
  const segments = rest.split('/').filter(Boolean);
  if (segments.some((segment) => segment.startsWith('.') || segment === '_headers')) throw new PreviewError(404);
  if (segments.length === 0 || pathname.endsWith('/')) return [path.posix.join(...segments, 'index.html')];
  const last = segments[segments.length - 1];
  if (last.includes('.')) {
    const extension = last.split('.').pop() as string;
    if (!Object.hasOwn(types, extension)) throw new PreviewError(404);
    return [segments.join('/')];
  }
  return [`${segments.join('/')}/index.html`, `${segments.join('/')}.html`];
}

const prefixed = (value: string, base: string) => (/^\/(?!\/)/.test(value) ? base + value : value);

export function rewriteHtml(html: string, base: string): { html: string; scriptHashes: string[] } {
  const scriptHashes: string[] = [];
  let out = html
    // No analytics, beacons or third-party scripts in a private preview.
    .replace(/<script\b[^>]*\bsrc=["']https?:\/\/[^"']*["'][^>]*><\/script>/gi, '')
    .replace(/<script\b(?![^>]*\bsrc=)[^>]*>(?:(?!<\/script>)[\s\S])*swetrix(?:(?!<\/script>)[\s\S])*<\/script>/gi, '')
    .replace(/<noscript>(?:(?!<\/noscript>)[\s\S])*swetrix(?:(?!<\/noscript>)[\s\S])*<\/noscript>/gi, '')
    .replace(/<link\b[^>]*\brel=["'](?:canonical|sitemap)["'][^>]*>/gi, '')
    .replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>/gi, '')
    .replace(
      /(\s(?:href|src|action|poster)=)(["'])(\/[^"']*)\2/gi,
      (_m, attr, quote, value) => `${attr}${quote}${prefixed(value, base)}${quote}`
    )
    .replace(/(\ssrcset=)(["'])([^"']*)\2/gi, (_m, attr, quote, value: string) => {
      const items = value.split(',').map((item) => {
        const trimmed = item.trim();
        return prefixed(trimmed, base);
      });
      return `${attr}${quote}${items.join(', ')}${quote}`;
    })
    .replace(/url\((["']?)\/(?!\/)/g, (_m, quote) => `url(${quote}${base}/`)
    .replace(/<head(\s[^>]*)?>/i, (m) => `${m}<meta name="robots" content="noindex,nofollow,noarchive">`);
  out = out.replace(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, (match, body: string) => {
    scriptHashes.push(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
    return match;
  });
  const banner =
    '<div role="note" style="position:fixed;left:8px;bottom:8px;z-index:2147483647;pointer-events:none;background:#ffe600;color:#111;border:2px solid #111;padding:4px 8px;font:700 12px/1.2 system-ui,sans-serif">Interne Vorschau · nicht veröffentlicht</div>';
  out = out.replace(/<\/body>/i, `${banner}</body>`);
  return { html: out, scriptHashes };
}

export function contentSecurityPolicy(scriptHashes: string[]): string {
  return [
    "default-src 'none'",
    `script-src 'self' ${scriptHashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'self'",
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ].join('; ');
}

export async function serveSite(pathname: string, siteDirectory = process.env.PREVIEW_SITE_DIR): Promise<Response> {
  const root = await realpath(path.resolve(siteDirectory || path.join(process.cwd(), 'preview/site-dist'))).catch(
    () => {
      throw new PreviewError(503);
    }
  );
  const base = basePath();
  for (const candidate of candidateFiles(pathname)) {
    const resolved = path.resolve(root, candidate);
    if (!resolved.startsWith(root + path.sep)) continue;
    let real: string;
    try {
      real = await realpath(resolved);
      if (!real.startsWith(root + path.sep) || !(await stat(real)).isFile()) continue;
    } catch {
      continue;
    }
    const extension = real.split('.').pop() as string;
    const type = types[extension];
    if (!type) continue;
    const headers: Record<string, string> = { ...privateHeaders, 'Content-Type': type };
    if (extension === 'html') {
      const { html, scriptHashes } = rewriteHtml(await readFile(real, 'utf8'), base);
      headers['Content-Security-Policy'] = contentSecurityPolicy(scriptHashes);
      return new Response(html, { status: 200, headers });
    }
    if (extension === 'css')
      return new Response(
        (await readFile(real, 'utf8')).replace(/url\((["']?)\/(?!\/)/g, (_m, q) => `url(${q}${base}/`),
        {
          headers,
        }
      );
    if (extension === 'js' || extension === 'mjs')
      return new Response((await readFile(real, 'utf8')).replace(/(["'`])\/(_astro|_cms-media)\//g, `$1${base}/$2/`), {
        headers,
      });
    return new Response(await readFile(real), { headers });
  }
  throw new PreviewError(404);
}
