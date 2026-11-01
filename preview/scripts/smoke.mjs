import { spawn } from 'node:child_process';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
// Native HTTP smoke test against the compiled private renderer; synthetic input only.
const secret = randomBytes(32).toString('hex'),
  port = process.env.PREVIEW_TEST_PORT || '14330';
const child = spawn(process.execPath, [fileURLToPath(new URL('../dist/server/entry.mjs', import.meta.url))], {
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: port,
    DATAHUB_PREVIEW_SECRET: secret,
    PREVIEW_SITE_DIR: fileURLToPath(new URL('../site-dist', import.meta.url)),
    PREVIEW_SITE_BASE_PATH: '/preview/site',
  },
  stdio: 'ignore',
});
const base = `http://127.0.0.1:${port}`;
let exited = false;
child.once('exit', () => {
  exited = true;
});
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (exited) throw Error('renderer_start_failed');
    try {
      await fetch(base + '/internal/preview');
      ready = true;
      break;
    } catch {
      await delay(100);
    }
  }
  assert.ok(ready, 'renderer did not start');
  const health = await fetch(base + '/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
  assert.match(health.headers.get('cache-control'), /no-store/);
  assert.equal((await fetch(base + '/internal/preview')).status, 404);
  const post = async (document, offset = 0, tamper = false, collection = 'pages') => {
    const body = JSON.stringify({ collection, id: 1, document }),
      timestamp = String(Math.floor(Date.now() / 1000) + offset);
    const sig = createHmac('sha256', secret)
      .update(`${timestamp}\nPOST\n/internal/preview\n${createHash('sha256').update(body).digest('hex')}`)
      .digest('hex');
    return fetch(base + '/internal/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-preview-timestamp': timestamp,
        'x-preview-signature': tamper ? '0'.repeat(64) : sig,
      },
      body,
    });
  };
  assert.equal((await post({ title: 'Demo' }, -120)).status, 401);
  assert.equal((await post({ title: 'Demo' }, 0, true)).status, 401);
  const response = await post({
    title: 'SYNTHETIC_DRAFT_ONLY',
    editorialNotes: 'INTERNAL_NOT_RENDERED',
    contentRichText: {
      root: {
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'text', text: '<script>evil()</script>' }] }],
      },
    },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(response.headers.get('x-robots-tag'), /noindex/);
  const html = await response.text();
  assert.ok(html.includes('SYNTHETIC_DRAFT_ONLY'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('INTERNAL_NOT_RENDERED'));
  assert.ok(html.includes('kieks.me-single-circle'));
  assert.ok(html.includes('/preview-assets/_astro/'));
  const assets = [...html.matchAll(/(?:src|href)="(\/preview-assets\/_astro\/[^" ]+)"/g)].map((m) => m[1]);
  assert.ok(
    assets.some((a) => a.endsWith('.js')),
    'client must be external for script-src self CSP'
  );
  for (const asset of assets) {
    const assetResponse = await fetch(base + asset.replace('/preview-assets', ''));
    assert.equal(assetResponse.status, 200);
    if (asset.endsWith('.css')) {
      const css = await assetResponse.text();
      assert.ok(css.includes('.font-heading'), 'shared Pop-Art utility classes must be compiled');
      assert.ok(css.includes('Hanken Grotesk'), 'original heading font must remain');
    }
  }
  const legal = await post({
    title: 'SYNTHETIC_LEGAL',
    contentMarkdown: '<address>\nSynthetic company<br>\nDemo Street 1<br>\n</address>\n\n<script>must-not-run</script>',
  });
  assert.equal(legal.status, 200);
  const legalHtml = await legal.text();
  assert.ok(legalHtml.includes('<address>Synthetic company<br>'));
  assert.ok(legalHtml.includes('Demo Street 1'));
  assert.ok(!legalHtml.includes('<script>must-not-run</script>'));
  for (const collection of ['posts', 'authors']) {
    const response = await post(
      {
        title: 'SYNTHETIC_EXTENDED_PREVIEW',
        name: 'SYNTHETIC_EXTENDED_PREVIEW',
        author: { id: 2, name: 'Demo author' },
        contactEnabled: true,
      },
      0,
      false,
      collection
    );
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes('SYNTHETIC_EXTENDED_PREVIEW'));
  }
  // ---- Whole-site preview (signed GET, raw paths so traversal attempts are not normalised away) ----
  const emptyHash = createHash('sha256').update('').digest('hex');
  const rawGet = (rawPath, { headers = {}, method = 'GET' } = {}) =>
    new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path: rawPath, method, headers }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      });
      req.on('error', reject);
      req.end();
    });
  const signedGet = (
    rawPath,
    { offset = 0, nonce = randomBytes(16).toString('hex'), signPath = rawPath, tamper = false } = {}
  ) => {
    const ts = String(Math.floor(Date.now() / 1000) + offset);
    const sig = createHmac('sha256', secret)
      .update(`${ts}\nGET\n${signPath.split('?')[0]}\n${emptyHash}\n${nonce}`)
      .digest('hex');
    return rawGet(rawPath, {
      headers: {
        'x-preview-timestamp': ts,
        'x-preview-signature': tamper ? 'f'.repeat(64) : sig,
        'x-preview-nonce': nonce,
      },
    });
  };
  assert.equal((await rawGet('/site/')).status, 401, 'unsigned site request must fail');
  assert.equal((await signedGet('/site/', { offset: -120 })).status, 401, 'expired site request must fail');
  assert.equal((await signedGet('/site/', { tamper: true })).status, 401, 'bad signature must fail');
  assert.equal((await signedGet('/site/agb', { signPath: '/site/' })).status, 401, 'signature is bound to the path');
  const nonce = randomBytes(16).toString('hex');
  const home = await signedGet('/site/', { nonce });
  assert.equal(home.status, 200);
  assert.equal((await signedGet('/site/', { nonce })).status, 401, 'replayed nonce must fail');
  assert.match(home.headers['cache-control'], /no-store/);
  assert.match(home.headers['x-robots-tag'], /noindex/);
  assert.match(home.headers['content-security-policy'], /form-action 'none'/);
  assert.match(home.headers['content-security-policy'], /frame-ancestors 'self'/);
  const homeHtml = home.body.toString('utf8');
  assert.match(homeHtml, /<meta name="robots" content="noindex,nofollow,noarchive">/);
  assert.ok(!/rel="canonical"/.test(homeHtml), 'preview must not carry a canonical link');
  assert.ok(!homeHtml.includes(secret), 'secret must never be rendered');
  assert.match(
    homeHtml,
    /<img alt="kieks\.me" src="data:image\/svg\+xml,[^"]*circle%20cx='249\.5'%20cy='275\.5'%20r='221\.5'/,
    'original circle logo preserved'
  );
  assert.ok(homeHtml.includes('Interne Vorschau'));
  // Manipulated paths are rejected even with a valid signature over the raw path.
  for (const evil of [
    '/site/%2e%2e/%2e%2e/package.json',
    '/site/..%2fpackage.json',
    '/site/_astro/..%5c..%5cpackage.json',
    '/site/%252e%252e/package.json',
    '/site//etc/passwd',
    '/site/.env',
    '/site/_headers',
    '/site/_astro/x.map',
    '/site/agb/..',
    '/site/agb?x=1',
    '/site/index.html%00.png',
    '/site/' + 'a/'.repeat(50) + 'x.css',
  ]) {
    const r = await signedGet(evil);
    assert.ok([404, 400, 401].includes(r.status), `${evil} -> ${r.status}`);
    assert.ok(!r.body.toString().includes('"name": "@kieksme'), 'package.json must not leak');
  }
  assert.equal((await rawGet('/site/', { method: 'POST' })).status, 404);
  assert.equal((await signedGet('/preview-site/')).status, 404);
  // Crawl: every internal link and asset of the whole draft resolves through signed requests.
  const pages = new Set(),
    assetsSeen = new Set(),
    queue = ['/site/'];
  while (queue.length) {
    const current = queue.shift();
    if (pages.has(current)) continue;
    pages.add(current);
    const r = await signedGet(current);
    assert.equal(r.status, 200, `page ${current} -> ${r.status}`);
    assert.match(r.headers['content-type'], /text\/html/);
    const body = r.body.toString('utf8');
    assert.ok(
      !/href="\/(?!preview\/site)[a-z]/i.test(body.replace(/<script[\s\S]*?<\/script>/g, '')),
      `${current}: unprefixed internal link`
    );
    for (const m of body.matchAll(/(?:href|src)="(\/preview\/site\/[^"#?]*)/g)) {
      const target = m[1].replace('/preview/site', '/site');
      if (/\.[a-z0-9]+$/.test(target)) assetsSeen.add(target);
      else if (!pages.has(target.replace(/\/?$/, '/')) && !pages.has(target))
        queue.push(target.replace(/([^/])$/, '$1'));
    }
  }
  const expectedPages = [
    '',
    'leistungen/ki-mcp/',
    'agent-hub/',
    'csp/',
    'kontakt/',
    'impressum/',
    'datenschutz/',
    'agb/',
    'blog/',
    'projekte/mcp-server/',
    'leistungen/beratung/',
    'leistungen/cloud-devops/',
    'leistungen/entwicklung/',
  ];
  for (const page of expectedPages)
    assert.ok(
      [...pages].some((p) => p.replace(/\/?$/, '/') === `/site/${page}`.replace(/\/+$/, '/')),
      `crawl missed ${page}`
    );
  assert.ok(pages.size >= 13, `crawled only ${pages.size} pages`);
  for (const asset of assetsSeen) {
    const r = await signedGet(asset);
    assert.equal(r.status, 200, `asset ${asset} -> ${r.status}`);
    if (asset.endsWith('.css')) assert.ok(!/url\(\/(?!preview\/site)/.test(r.body.toString()), 'css urls prefixed');
  }
  const unsignedAsset = [...assetsSeen][0];
  assert.equal((await rawGet(unsignedAsset)).status, 401, 'assets require signatures');
  const kontakt = (await signedGet('/site/kontakt/')).body.toString();
  assert.match(kontakt, /<form[^>]*action="\/preview\/site\/kontakt-erfolgreich"/);
  assert.ok(!kontakt.includes('PAYLOAD_BUILD_API_KEY'));
  console.log(
    JSON.stringify({
      status: 'passed',
      checks: [
        'health-configured',
        'legal-markdown-preserved-and-escaped',
        'posts-preview',
        'authors-preview',
        'anonymous-denied',
        'expired-denied',
        'tamper-denied',
        'signed-render',
        'no-store-noindex',
        'rich-text-escaped',
        'notes-omitted',
        'original-circle-logo',
        'private-assets-resolve',
        'shared-pop-art-typography',
        'external-client-script',
        'site-unsigned-expired-tamper-path-bound-replay-denied',
        'site-traversal-and-manipulated-paths-denied',
        'site-crawl-internal-navigation-and-assets',
        'site-noindex-csp-no-form-submission',
      ],
    })
  );
} finally {
  child.kill('SIGTERM');
  if (!exited) await new Promise((resolve) => child.once('exit', resolve));
}
