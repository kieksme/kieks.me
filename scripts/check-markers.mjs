#!/usr/bin/env node
/**
 * Build gate: fail if open-point markers (⟦PLATZHALTER⟧, ⟦BESTÄTIGEN⟧, ⟦ENTSCHEIDUNG⟧ …)
 * ended up in the built site.
 *
 * Skipped when PUBLIC_SHOW_NOTES=true (e.g. Netlify deploy previews), because
 * the preview intentionally renders the design notes.
 *
 * Usage: node scripts/check-markers.mjs [distDir]
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const MARKER = /⟦[^⟧]*⟧/g;
// Dummy VAT ID that must never reach production (the real one is an open user decision).
const DUMMY_VAT = /DE123456789(?!\d)/g;
const TEXT_EXT = new Set(['.html', '.xml', '.txt', '.json', '.js', '.mjs', '.css', '.svg', '.webmanifest', '.md']);
const distDir = process.argv[2] ?? 'dist';

if (process.env.PUBLIC_SHOW_NOTES === 'true') {
  console.log('[check-markers] PUBLIC_SHOW_NOTES=true, preview build: gate skipped.');
  process.exit(0);
}

if (!existsSync(distDir)) {
  console.error(`[check-markers] "${distDir}" not found. Run the build first.`);
  process.exit(2);
}

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const hits = [];
for (const file of walk(distDir)) {
  if (!TEXT_EXT.has(extname(file))) continue;
  const body = readFileSync(file, 'utf8');
  const matches = [...(body.match(MARKER) ?? []), ...(body.match(DUMMY_VAT) ?? [])];
  if (matches.length) hits.push({ file: relative(process.cwd(), file), matches });
}

if (hits.length > 0) {
  console.error('[check-markers] Open-point markers or dummy VAT ID found in build output:\n');
  for (const { file, matches } of hits) {
    console.error(`  ${file}`);
    for (const m of matches) console.error(`    ${m.length > 100 ? m.slice(0, 97) + '…⟧' : m}`);
  }
  console.error(
    `\n${hits.reduce((n, h) => n + h.matches.length, 0)} marker(s) in ${hits.length} file(s). ` +
      'Confirm or replace the content in the source, or move it into a <Note> (hidden in production).'
  );
  process.exit(1);
}

console.log('[check-markers] OK, no ⟦…⟧ markers in build output.');
