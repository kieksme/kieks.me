import { spawnSync, spawn } from 'node:child_process';
if (process.env.STAGING_CMS_PREVIEW === 'true') {
  const result = spawnSync(process.execPath, ['preview/scripts/build-site.mjs'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const server = spawn(process.execPath, ['preview/dist/server/entry.mjs'], { stdio: 'inherit', env: process.env });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code ?? 1));
