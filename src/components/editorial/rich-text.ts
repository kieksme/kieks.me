/** Small, closed Lexical renderer: no raw HTML, styles, arbitrary tags or scripts. */
export const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
export function safeHref(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2000 || [...value].some((c) => c.charCodeAt(0) <= 32 || c === '\\'))
    return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    return ['https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export interface PreviewMedia {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}
export function safeMedia(value: unknown): PreviewMedia | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (typeof item.url !== 'string' || !item.url.startsWith('/api/media/file/') || item.url.length > 500) return null;
  let filename: string;
  try {
    filename = decodeURIComponent(item.url.slice('/api/media/file/'.length));
  } catch {
    return null;
  }
  if (
    !filename ||
    [...filename].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 || '/\\?#'.includes(c)) ||
    filename === '.' ||
    filename === '..'
  )
    return null;
  if (typeof item.mimeType !== 'string' || !/^image\/(?:png|jpeg|webp|avif|gif)$/.test(item.mimeType)) return null;
  const dimension = (n: unknown) =>
    typeof n === 'number' && Number.isInteger(n) && n > 0 && n <= 20000 ? n : undefined;
  return {
    url: `/api/media/file/${encodeURIComponent(filename)}`,
    alt: typeof item.alt === 'string' ? item.alt.slice(0, 1000) : '',
    width: dimension(item.width),
    height: dimension(item.height),
  };
}
export function mediaHtml(value: unknown): string {
  const media = safeMedia(value);
  return media
    ? `<figure><img src="${escapeHtml(media.url)}" alt="${escapeHtml(media.alt)}"${media.width ? ` width="${media.width}"` : ''}${media.height ? ` height="${media.height}"` : ''} loading="lazy" decoding="async"></figure>`
    : '';
}
export function renderRichText(value: unknown): string {
  let budget = 5000;
  function node(input: unknown, depth = 0): string {
    if (!input || typeof input !== 'object' || depth > 24 || --budget < 0) return '';
    const n = input as Record<string, unknown>;
    const children = () => (Array.isArray(n.children) ? n.children.map((c) => node(c, depth + 1)).join('') : '');
    if (n.type === 'text') {
      let text = escapeHtml(typeof n.text === 'string' ? n.text.slice(0, 100000) : '');
      const format = typeof n.format === 'number' ? n.format : 0;
      for (const [flag, tag] of [
        [1, 'strong'],
        [2, 'em'],
        [4, 's'],
        [8, 'u'],
        [16, 'code'],
        [32, 'sub'],
        [64, 'sup'],
      ] as const)
        if (format & flag) text = `<${tag}>${text}</${tag}>`;
      return text;
    }
    if (n.type === 'linebreak') return '<br>';
    if (n.type === 'upload' && n.relationTo === 'media') return mediaHtml(n.value);
    if (n.type === 'link' || n.type === 'autolink') {
      const fields = n.fields && typeof n.fields === 'object' ? (n.fields as Record<string, unknown>) : {};
      const href = safeHref(fields.url ?? n.url);
      return href ? `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${children()}</a>` : children();
    }
    if (n.type === 'heading') {
      const tag = typeof n.tag === 'string' && ['h2', 'h3', 'h4'].includes(n.tag) ? n.tag : 'h2';
      return `<${tag}>${children()}</${tag}>`;
    }
    if (n.type === 'paragraph') return `<p>${children()}</p>`;
    if (n.type === 'quote') return `<blockquote>${children()}</blockquote>`;
    if (n.type === 'list') {
      const tag = n.listType === 'number' ? 'ol' : 'ul';
      return `<${tag}>${children()}</${tag}>`;
    }
    if (n.type === 'listitem') return `<li>${children()}</li>`;
    if (n.type === 'horizontalrule') return '<hr>';
    // Unknown nodes are ignored completely, including embedded HTML and blocks.
    if (n.type === 'root') return children();
    return '';
  }
  if (!value || typeof value !== 'object') return '';
  return node((value as Record<string, unknown>).root);
}
export const plainText = (value: unknown): string => (typeof value === 'string' ? value.slice(0, 100000) : '');
