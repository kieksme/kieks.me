// Builds the Pop-Art website WITHOUT any CMS credentials into preview/site-dist (private, never public).
import { spawnSync } from 'node:child_process';
import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// The private preview intentionally renders the design notes (open points); the marker gate only guards public builds.
const env = { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', PUBLIC_SHOW_NOTES: 'true' };
for (const key of ['PAYLOAD_URL', 'PAYLOAD_BUILD_API_KEY', 'DATAHUB_PREVIEW_SECRET', 'COOLIFY_TOKEN']) delete env[key];
const result = spawnSync(process.execPath, ['node_modules/astro/astro.js', 'build'], {
  cwd: root,
  env,
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);
const target = path.join(root, 'preview/site-dist');
await rm(target, { recursive: true, force: true });
await cp(path.join(root, 'dist'), target, { recursive: true });
await rm(path.join(target, '_headers'), { force: true });
console.log('site preview copied to preview/site-dist');
