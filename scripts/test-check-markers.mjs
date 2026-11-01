// Positive and negative tests for the production marker gate, using temporary synthetic output only.
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const gate = path.resolve('scripts/check-markers.mjs');
const run = async (files, env = {}) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'marker-gate-'));
  try {
    for (const [name, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(dir, name)), { recursive: true });
      await writeFile(path.join(dir, name), body);
    }
    const e = { ...process.env, ...env };
    if (!('PUBLIC_SHOW_NOTES' in env)) delete e.PUBLIC_SHOW_NOTES;
    return spawnSync(process.execPath, [gate, dir], { encoding: 'utf8', env: e });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};
assert.equal((await run({ 'index.html': '<p>Sauberer Text</p>' })).status, 0, 'clean output passes');
for (const marker of ['⟦PLATZHALTER D1⟧', '⟦BESTÄTIGEN: Preis⟧', '⟦rechtlich prüfen⟧']) {
  const r = await run({ 'a/index.html': `<p>x ${marker}</p>` });
  assert.equal(r.status, 1, `${marker} must fail`);
  assert.match(r.stderr, /a\/index\.html/);
}
const vat = await run({ 'impressum/index.html': '<p>USt-IdNr. DE123456789</p>' });
assert.equal(vat.status, 1, 'dummy VAT ID must fail');
assert.equal((await run({ 'x.html': '<p>DE1234567890123</p>' })).status, 0, 'longer numbers are not the dummy');
assert.equal((await run({ 'index.html': '⟦X⟧ DE123456789' }, { PUBLIC_SHOW_NOTES: 'true' })).status, 0, 'preview skip');
assert.equal((await run({ 'index.html': '⟦X⟧' }, { PUBLIC_SHOW_NOTES: 'false' })).status, 1, 'only "true" skips');
assert.equal(spawnSync(process.execPath, [gate, '/nonexistent-dist-dir'], { encoding: 'utf8' }).status, 2);
console.log('Marker gate tests passed (clean, markers, dummy VAT, preview skip, missing dist)');
