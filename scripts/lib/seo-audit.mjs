// Static SEO audit of a built `dist` directory. Pure Node, no dependencies, synthetic or public content only.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const ORIGIN = 'https://kieks.me';
const NOINDEX = [/^404\.html$/, /^kontakt-erfolgreich\//, /^docs\//];

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z:-]+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) out[m[1]] = m[2] ?? m[3] ?? m[4];
  return out;
}
const decode = (value = '') =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

export function parseHead(html) {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const byName = (name) => metas.filter((m) => m.name === name).map((m) => decode(m.content));
  const byProperty = (property) => metas.filter((m) => m.property === property).map((m) => decode(m.content));
  const canonicals = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0])).filter((l) => l.rel === 'canonical');
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1])
  );
  const types = jsonLd.flatMap((d) => (d['@graph'] ? d['@graph'] : [d])).map((node) => node);
  return {
    title: decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]),
    description: byName('description'),
    robots: byName('robots'),
    canonicals: canonicals.map((l) => l.href),
    og: byProperty,
    twitter: byName,
    nodes: types,
    metas,
  };
}

async function walk(dir, base = dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full, base)));
    else if (entry.name.endsWith('.html')) files.push(path.relative(base, full));
  }
  return files.sort();
}

/** @returns list of audited page paths. Throws an AssertionError on the first violation. */
export async function auditSeo(dist, { expectTypes = {} } = {}) {
  const pages = await walk(dist);
  const sitemap = await readFile(path.join(dist, 'sitemap-0.xml'), 'utf8').catch(() => '');
  assert.ok(pages.length >= 10, 'expected the full Pop-Art page set');
  for (const file of pages) {
    const html = await readFile(path.join(dist, file), 'utf8');
    // Astro redirect stubs (meta refresh) are not content pages.
    if (/http-equiv="?refresh/i.test(html)) continue;
    const seo = parseHead(html);
    const url = file === '404.html' ? '/404' : '/' + file.replace(/index\.html$/, '').replace(/\/$/, '');
    const noindex = NOINDEX.some((rule) => rule.test(file));
    const label = `${file}:`;
    assert.ok(seo.title && seo.title.length <= 120, `${label} title missing or too long`);
    assert.equal(seo.robots.length, 1, `${label} exactly one robots meta`);
    if (noindex) {
      assert.match(seo.robots[0], /noindex/, `${label} must be noindex`);
      assert.ok(!sitemap.includes(`${ORIGIN}${url}`), `${label} noindex page must not be in the sitemap`);
    } else {
      assert.equal(seo.robots[0], 'index,follow', `${label} must be indexable`);
      assert.ok(seo.description.length === 1 && seo.description[0].length >= 20, `${label} needs one description`);
      assert.ok(seo.description[0].length <= 320, `${label} description too long`);
      assert.equal(seo.canonicals.length, 1, `${label} exactly one canonical`);
      const canonical = new URL(seo.canonicals[0]);
      assert.equal(canonical.origin, ORIGIN, `${label} canonical origin`);
      assert.equal(canonical.pathname.replace(/\/$/, ''), url === '/' ? '' : url, `${label} canonical path`);
      assert.ok(!canonical.search && !canonical.hash, `${label} canonical must be clean`);
      for (const property of [
        'og:title',
        'og:description',
        'og:url',
        'og:type',
        'og:image',
        'og:site_name',
        'og:locale',
      ])
        assert.equal(seo.og(property).length, 1, `${label} ${property}`);
      assert.equal(seo.og('og:url')[0], seo.canonicals[0], `${label} og:url equals canonical`);
      assert.match(seo.og('og:image')[0], /^https:\/\//, `${label} og:image must be absolute https`);
      for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'])
        assert.equal(seo.twitter(name).length, 1, `${label} ${name}`);
      assert.match(seo.twitter('twitter:card')[0], /^summary(_large_image)?$/, `${label} twitter:card value`);
      assert.match(seo.twitter('twitter:image')[0], /^https:\/\//, `${label} twitter:image must be absolute https`);
    }
    // JSON-LD: valid JSON (parseHead throws otherwise), escaped delimiters, Organization + WebSite everywhere.
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))
      assert.ok(!/[<>]/.test(m[1]), `${label} JSON-LD must escape HTML delimiters`);
    const kinds = seo.nodes.map((node) => node['@type']);
    assert.ok(kinds.includes('Organization') && kinds.includes('WebSite'), `${label} Organization + WebSite JSON-LD`);
    for (const node of seo.nodes.filter((n) => n['@type'] === 'BreadcrumbList')) {
      assert.ok(node.itemListElement.length >= 2, `${label} breadcrumb needs 2+ items`);
      node.itemListElement.forEach((item, index) => {
        assert.equal(item.position, index + 1, `${label} breadcrumb positions`);
        assert.ok(item.item.startsWith(ORIGIN), `${label} breadcrumb URLs are absolute`);
      });
    }
    for (const [pattern, required] of Object.entries(expectTypes))
      if (new RegExp(pattern).test(file))
        for (const type of required) assert.ok(kinds.includes(type), `${label} expected JSON-LD ${type}`);
  }
  return pages;
}
