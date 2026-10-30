# Private Astro editorial renderer

This is a separate server application. The public website's root package and Astro configuration stay unchanged. No paid service or external preview provider is required.

## Container build

Build from the repository root, using `preview/Dockerfile` (the adjacent `Dockerfile.dockerignore` applies to that root context). Node 24.22.1 is digest-pinned. pnpm 9.15.4 installs both root and isolated preview dependencies with their frozen lockfiles, then runs `pnpm --dir preview build`. No live service connection or secret is required during build. Local symlinked dependencies, environment files and caches are excluded.

The runtime is an unprivileged Node process:

```sh
HOST=0.0.0.0 PORT=4330 node preview/dist/server/entry.mjs
```

Only compiled preview output and its dependencies are copied into runtime. No persistent storage or database is needed; previews must not be written to a shared volume.

## Runtime secrets and routing

- `DATAHUB_PREVIEW_SECRET`: strong secret shared privately with the Payload signing endpoint, runtime-only. Never a build argument or browser variable.
- `DATAHUB_URL=https://datahub.kieks.me`: operator context; the renderer currently makes no Payload requests and does not require this value.
- Do not provide any Payload administrator/build/sync key or Papierkram key to this renderer.

The request body comes from the authenticated Payload backend, not arbitrary browser callers. The renderer accepts signed POST requests at `/internal/preview`; unsigned GET requests return 404; unsigned POST requests fail authentication (401). Missing or invalid secret configuration returns 503. Signature validation, allowed media URL paths, and timestamp expiry tests belong to the renderer tests. The 60-second timestamp window is not a one-time nonce guarantee. The operator must verify these against the built image before connecting it to Payload.

The image healthcheck uses GET `/health` on port **4330**. Configure Coolify to expect **200**. The endpoint returns 503 when the shared secret is missing or too short and exposes no CMS data. The render endpoint remains protected independently of liveness.

Create a dedicated Coolify GitHub application using the existing kieksme installation, `feat/payload-editorial-preview` branch, build pack `dockerfile`, base directory `/`, Dockerfile `/preview/Dockerfile`, internal exposed port `4330`, and `instant_deploy=false`. Use the existing kieks.me project/production environment on kube-3. Omit domains/FQDN and host port mappings. Join only the private Docker network needed by Payload. Root supplies runtime secrets after creation; no image build secrets.

Set Payload's server-only `DATAHUB_PREVIEW_URL` to `http://kieks-me-editorial-preview:4330/internal/preview`, using that stable private network alias. Both services receive the same `DATAHUB_PREVIEW_SECRET`. Payload authenticates the editor and proxies the renderer response; the renderer has no public hostname.

## Verification and operations

Run the preview unit tests and `node preview/scripts/smoke.mjs` after compilation. Verify signed HTML renders, assets load through the authenticated proxy, expired/tampered/unsigned requests fail, previews carry no-store/noindex, and no secret appears in client scripts. Confirm public static output still builds independently. Do not enable real email delivery.

Roll out only after the isolated Payload v4 database migration rehearsal passes. Roll back this stateless renderer by selecting its previous image/commit; database rollback belongs to the separate Payload migration runbook. No DNS or persistent volume migration is necessary for the private renderer.
