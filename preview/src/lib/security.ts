import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
export const PREVIEW_PATH = '/internal/preview';
export const MAX_BODY = 256 * 1024;
export const COLLECTIONS = ['pages', 'services', 'team', 'faqs', 'mcp-projects', 'navigation'] as const;
export type PreviewCollection = (typeof COLLECTIONS)[number];
export interface PreviewEnvelope {
  collection: PreviewCollection;
  id: string | number;
  document: Record<string, unknown>;
}
export class PreviewError extends Error {
  constructor(public status: number) {
    super('Preview unavailable');
  }
}
export function signature(timestamp: string, rawBody: string | Uint8Array, secret: string) {
  return createHmac('sha256', secret)
    .update(`${timestamp}\nPOST\n${PREVIEW_PATH}\n${createHash('sha256').update(rawBody).digest('hex')}`)
    .digest('hex');
}
export async function verifyRequest(
  request: Request,
  secret: string | undefined,
  now = Date.now()
): Promise<PreviewEnvelope> {
  if (!secret || secret.length < 32) throw new PreviewError(503);
  if (
    request.method !== 'POST' ||
    new URL(request.url).pathname !== PREVIEW_PATH ||
    Boolean(new URL(request.url).search)
  )
    throw new PreviewError(404);
  if (!(request.headers.get('content-type') || '').startsWith('application/json')) throw new PreviewError(415);
  const timestamp = request.headers.get('x-preview-timestamp') || '';
  const supplied = request.headers.get('x-preview-signature') || '';
  if (!/^\d{10}$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 60 || !/^[a-f0-9]{64}$/.test(supplied))
    throw new PreviewError(401);
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY)) throw new PreviewError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new PreviewError(400);
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > MAX_BODY) {
      await reader.cancel();
      throw new PreviewError(413);
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  let raw: string;
  try {
    raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new PreviewError(400);
  }
  if (!timingSafeEqual(Buffer.from(signature(timestamp, bytes, secret), 'hex'), Buffer.from(supplied, 'hex')))
    throw new PreviewError(401);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new PreviewError(400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PreviewError(400);
  const { collection, id, document } = body as PreviewEnvelope;
  if (
    !COLLECTIONS.includes(collection) ||
    !['string', 'number'].includes(typeof id) ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(String(id)) ||
    !document ||
    typeof document !== 'object' ||
    Array.isArray(document)
  )
    throw new PreviewError(400);
  return { collection, id, document };
}
export const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};
