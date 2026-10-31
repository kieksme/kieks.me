import { describe, expect, it } from 'vitest';
import { basePath, candidateFiles, contentSecurityPolicy, rewriteHtml } from '../../../preview/src/lib/site';

describe('protected whole-site preview helpers', () => {
  it('rewrites internal URLs only, drops canonical/analytics and forces noindex', () => {
    const { html, scriptHashes } = rewriteHtml(
      '<html><head><meta name="robots" content="index,follow"><link rel="canonical" href="https://kieks.me/x">' +
        '<script src="https://swetrix.org/swetrix.js" defer></script><script>window.swetrix.init("p")</script>' +
        '<script>document.title="x"</script></head><body><a href="/agb">a</a><a href="//evil.example/x">b</a>' +
        '<a href="https://example.com/">c</a><img srcset="/a.png 1x, /b.png 2x" src="/a.png"><div style="background:url(/_astro/x.png)"></div>' +
        '<form action="/kontakt-erfolgreich"></form></body></html>',
      '/preview/site'
    );
    expect(html).toContain('href="/preview/site/agb"');
    expect(html).toContain('href="//evil.example/x"');
    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain('srcset="/preview/site/a.png 1x, /preview/site/b.png 2x"');
    expect(html).toContain('url(/preview/site/_astro/x.png)');
    expect(html).toContain('action="/preview/site/kontakt-erfolgreich"');
    expect(html).not.toMatch(/canonical|swetrix|index,follow/);
    expect(html).toContain('content="noindex,nofollow,noarchive"');
    expect(scriptHashes).toHaveLength(1);
    expect(contentSecurityPolicy(scriptHashes)).toMatch(/form-action 'none'.*|script-src 'self' 'sha256-/);
  });

  it('maps only plain static paths and rejects traversal-like input', () => {
    expect(candidateFiles('/site')).toEqual(['index.html']);
    expect(candidateFiles('/site/')).toEqual(['index.html']);
    expect(candidateFiles('/site/agb/')).toEqual(['agb/index.html']);
    expect(candidateFiles('/site/agb')).toEqual(['agb/index.html', 'agb.html']);
    expect(candidateFiles('/site/_astro/a.b.css')).toEqual(['_astro/a.b.css']);
    for (const bad of [
      '/site/../x',
      '/site/%2e%2e/x',
      '/site//x',
      '/site/.env',
      '/site/_headers',
      '/site/a.map',
      '/site/a b',
      '/site/a\\b',
      '/other',
    ])
      expect(() => candidateFiles(bad), bad).toThrow();
  });

  it('validates the public base path', () => {
    expect(basePath('/preview/site')).toBe('/preview/site');
    for (const bad of ['', 'preview', '/a//b', '/a/', '/a b', 'https://x.invalid'])
      expect(() => basePath(bad)).toThrow();
  });
});
