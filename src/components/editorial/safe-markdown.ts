import { fromMarkdown } from 'mdast-util-from-markdown';
import { escapeHtml, safeHref } from './rich-text';
interface MarkdownNode {
  type: string;
  value?: string;
  depth?: number;
  url?: string;
  ordered?: boolean;
  start?: number;
  identifier?: string;
  children?: MarkdownNode[];
}
/** Parse CommonMark into a closed HTML allowlist; raw HTML is never passed through. */
export function renderMarkdown(value: unknown): string {
  const source = typeof value === 'string' ? value : '';
  if (new TextEncoder().encode(source).length > 256 * 1024)
    throw new RangeError('Markdown exceeds renderer size limit');
  if (!source) return '';
  const tree = fromMarkdown(source) as MarkdownNode;
  const definitions = new Map<string, string>();
  for (const item of tree.children || [])
    if (item.type === 'definition' && item.identifier && item.url) definitions.set(item.identifier, item.url);
  let budget = 5000;
  const render = (item: MarkdownNode, depth = 0): string => {
    if (depth > 24 || --budget < 0) throw new RangeError('Markdown exceeds renderer structure limit');
    const children = () => (item.children || []).map((child) => render(child, depth + 1)).join('');
    switch (item.type) {
      case 'root':
        return children();
      case 'text':
        return escapeHtml(item.value);
      case 'paragraph':
        return `<p>${children()}</p>`;
      case 'heading': {
        const level = Math.max(2, Math.min(4, item.depth || 2));
        return `<h${level}>${children()}</h${level}>`;
      }
      case 'strong':
        return `<strong>${children()}</strong>`;
      case 'emphasis':
        return `<em>${children()}</em>`;
      case 'inlineCode':
        return `<code>${escapeHtml(item.value)}</code>`;
      case 'code':
        return `<pre><code>${escapeHtml(item.value)}</code></pre>`;
      case 'blockquote':
        return `<blockquote>${children()}</blockquote>`;
      case 'list': {
        const tag = item.ordered ? 'ol' : 'ul';
        return `<${tag}>${children()}</${tag}>`;
      }
      case 'listItem':
        return `<li>${children()}</li>`;
      case 'break':
        return '<br>';
      case 'thematicBreak':
        return '<hr>';
      case 'link':
      case 'linkReference': {
        const href = safeHref(item.type === 'link' ? item.url : definitions.get(item.identifier || ''));
        return href ? `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${children()}</a>` : children();
      }
      // Legal Markdown needs no remote image loading or HTML/MDX execution.
      case 'image':
      case 'imageReference':
        return '';
      case 'html': {
        const html = item.value || '';
        // Keep source TODOs as HTML comments; never render them as visible text.
        if (/^<!--[\s\S]*-->$/.test(html.trim())) return '';
        if (/^<br\s*\/?>$/i.test(html.trim())) return '<br>';
        const address = html.match(/^\s*<address>\s*([\s\S]*?)\s*<\/address>\s*$/i);
        if (address)
          return `<address>${address[1]
            .split(/<br\s*\/?>/i)
            .map(escapeHtml)
            .join('<br>')}</address>`;
        return escapeHtml(html);
      }
      case 'definition':
        return '';
      default:
        return '';
    }
  };
  return render(tree);
}
