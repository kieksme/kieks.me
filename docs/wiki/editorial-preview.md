# Private editorial preview

`EditorialContent` renders the website collections `pages`, `services`, `team`, `faqs`, `mcp-projects`, plus navigation. Props are `collection: string` and `document: Record<string, unknown>`. The component reuses the existing Pop-Art Heading, Lead and FAQ components, the same fonts and tokens, and the unchanged original circular logo. It does not fetch CMS data. The synthetic live component demo lives at `/docs/editorial-preview` and contains no drafts or customer information.

## Separate static and preview builds

The existing `astro.config.ts`, root package dependencies and public static routing remain unchanged. The private SSR application lives entirely under `preview/`, with its own pinned Astro 5.18.2 / Node adapter 9.5.5 dependencies and lockfile. Install the root dependencies (shared source/fonts/Tailwind configuration), then:

```sh
pnpm --dir preview install --frozen-lockfile
pnpm --dir preview build
HOST=127.0.0.1 PORT=4330 node preview/dist/server/entry.mjs
node preview/scripts/smoke.mjs
```

In deployment, the renderer may bind `0.0.0.0` **only inside a private Docker network**, with no published host ports, public domain or reverse-proxy exposure. Set `DATAHUB_PREVIEW_SECRET` to the shared server-only random secret (at least 32 characters). The renderer needs no Payload API key, database credentials or business data. Do not put the shared secret in any client variable or URL.

The private `GET /health` probe returns only `{ "status": "ok" }` with HTTP 200 when the shared secret is configured with at least 32 characters; otherwise it returns HTTP 503 and `{ "status": "unavailable" }`. It includes the same private/no-store/noindex headers and makes no CMS request. Do not expose or proxy this probe publicly.

Only the authenticated Next bridge is public-facing. `GET /preview/[collection]/[id]` and POST at the same path check the active human staff session. Anonymous, inactive and website-build service users cannot preview. The bridge loads the authorized website draft and allowlists fields, resolves permitted media relationships, signs the resulting DTO and forwards it privately. Those checks belong to the Datahub app, not this renderer.

## Signed internal contract

`POST /internal/preview`, `Content-Type: application/json`, maximum 256 KiB, UTF-8 JSON envelope `{ collection, id, document }`. Collection is one of the website collection names listed above. Document IDs are limited to safe alphanumeric/hyphen/underscore values. No CRM collections, editorial notes, users or credentials are part of the DTO.

Headers:

- `x-preview-timestamp`: Unix timestamp in seconds, accepted within 60 seconds of renderer time (past or future).
- `x-preview-signature`: lower-case hex HMAC-SHA256 of the following exact UTF-8 string, using `DATAHUB_PREVIEW_SECRET`:

```text
<timestamp>\nPOST\n/internal/preview\n<sha256-of-exact-raw-body-hex>
```

The endpoint rejects other methods, paths, query strings, malformed JSON, invalid signatures and oversized streamed bodies. It compares HMAC values in constant time, returns generic errors and never logs document bodies. A valid signed request can be replayed within its 60-second window on the private network; it is a read-only render operation, with no writes or access beyond the supplied allowlisted DTO. TLS/session authorization on the public bridge and private network isolation remain necessary.

Rendered HTML and error responses carry `private, no-store`, `noindex, nofollow, noarchive` and `nosniff`. The Next proxy must preserve these restrictions and enforce a CSP allowing same-origin fonts/scripts/images and `style-src 'self' 'unsafe-inline'` for the existing trusted Pop-Art token/style attributes, `frame-ancestors 'self'`, no objects or external connections. No analytics or website client-router code is loaded in the private renderer.

Compiled asset URLs use `/preview-assets/_astro/<flat-filename>`. The authenticated Next asset proxy strips `/preview-assets` and forwards only safe hashed CSS/JS/font/image paths to the fixed private renderer origin; no query strings, arbitrary URLs, forwarded user cookies or redirects. Static assets are private infrastructure even though they contain no draft data. The public Astro build does not include `/internal/preview` or these preview routes.

## Unsaved changes and safe content

The iframe announces Payload's `payload-live-preview` ready message to its same-origin parent. It accepts document updates only from that parent window, the exact iframe origin and matching collection. It debounces updates, aborts obsolete requests and POSTs `{ document }` to the fixed authenticated Next bridge route. The bridge must sanitize all incoming unsaved values again; the postMessage check is not authorization.

Only the returned `#preview-content` nodes replace the current content; the listener stays mounted and no scripts are executed from a replacement response. This preserves the Payload ready handshake without an infinite reload loop. No general Payload API endpoint or service key is exposed in the client.

Rich text is rendered using a small closed Lexical-node allowlist. Text and attributes are escaped; arbitrary HTML, embedded blocks, scripts, unsupported nodes and styles are dropped. Supported content includes paragraphs, headings, bold/italic/underline/strike/code, lists, links, blockquotes and image uploads. Links accept HTTPS, relative internal paths, mailto and tel; script/data/protocol-relative URLs are rejected. Media accepts only private same-origin `/api/media/file/<filename>` paths and raster image MIME types; traversal, external URLs, query strings and SVG uploads are rejected. File requests still go through the native authorized Payload media route. Plain existing text is retained as the fallback when no supported rich text is present.

## Verification

```sh
./node_modules/.bin/vitest run test/unit/components/editorial-preview.test.ts
./node_modules/.bin/astro check
./node_modules/.bin/astro build
pnpm --dir preview build
node preview/scripts/smoke.mjs
```

Unit tests cover HMAC/TTL/body/path/size constraints, origin/source/collection checking, safe rich text/media, the five content shapes and internal-field omission. The native compiled-renderer smoke test starts a loopback-only child process, sends synthetic signed/expired/tampered requests, checks cache/index headers, escaping and private asset resolution, then stops its own process. Parent-level checks must additionally prove the deployed Next session/CSRF/ACL and proxy behavior, real unsaved changes in the admin iframe, and the unchanged public static build.
