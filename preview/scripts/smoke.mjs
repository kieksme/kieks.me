import { spawn } from 'node:child_process';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
// Native HTTP smoke test against the compiled private renderer; synthetic input only.
const secret = randomBytes(32).toString('hex'),
  port = process.env.PREVIEW_TEST_PORT || '14330';
const child = spawn(process.execPath, [fileURLToPath(new URL('../dist/server/entry.mjs', import.meta.url))], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: port, DATAHUB_PREVIEW_SECRET: secret },
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
      ],
    })
  );
} finally {
  child.kill('SIGTERM');
  if (!exited) await new Promise((resolve) => child.once('exit', resolve));
}
