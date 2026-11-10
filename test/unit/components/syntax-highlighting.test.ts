import { describe, it, expect } from 'vitest';
import { renderCodeBlock, renderRichText } from '../../../src/components/editorial/rich-text';
import { renderMarkdown } from '../../../src/components/editorial/safe-markdown';

describe('CMS code syntax highlighting', () => {
  it.each([
    ['ts', 'const answer: number = 42;', 'typescript'],
    ['json', '{"ok": true}', 'json'],
    ['shell', 'echo "$HOME"', 'bash'],
  ])('highlights %s on the server', (language, code, canonical) => {
    const html = renderCodeBlock(code, language);
    expect(html).toContain(`language-${canonical}`);
    expect(html).toContain('hljs-');
    expect(html).toContain('tabindex="0"');
  });
  it('preserves whitespace and escapes executable markup in both fallbacks and highlighted code', () => {
    const source = '<img src=x onerror=alert(1)>\n  <script>run()</script>';
    for (const language of ['typescript', 'unknown-language', '" onclick="run()']) {
      const html = renderCodeBlock(source, language);
      expect(html).not.toMatch(/<(?:img|script)\b/);
      expect(html).not.toContain('onclick=');
      expect(html).toContain('\n  ');
    }
  });
  it('renders only the native Code block and keeps inline code inline', () => {
    const html = renderRichText({
      root: {
        type: 'root',
        children: [
          { type: 'block', fields: { blockType: 'Code', language: 'ts', code: 'const x = 1;' } },
          { type: 'block', fields: { blockType: 'Custom', code: 'secret' } },
          { type: 'paragraph', children: [{ type: 'text', format: 16, text: 'inline' }] },
        ],
      },
    });
    expect(html).toContain('language-typescript');
    expect(html).not.toContain('secret');
    expect(html).toContain('<p><code>inline</code></p>');
  });
  it('uses the same highlighting for Markdown fences', () => {
    const html = renderMarkdown('```json\n{"ok": true}\n```');
    expect(html).toContain('language-json');
    expect(html).toContain('hljs-attr');
  });
});
