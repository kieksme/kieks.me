# Static Payload content

The public website stays an Astro static build. No browser request uses a Payload API key. Blog articles, public author profiles, legal pages and their metadata are resolved at build time.

## Configuration and publication

Set `PAYLOAD_URL=https://datahub.kieks.me` and `PAYLOAD_BUILD_API_KEY` only in the build runner's private environment/GitHub Actions secrets. The key belongs to a narrow `website-build` service user. Never use a `PUBLIC_` prefix or put credentials in URLs. Without both settings configured, existing local legal Markdown renders unchanged and `/blog` shows an empty index. A partially configured integration fails clearly.

The build client has a fixed `pages`, `posts`, `authors`, `media` endpoint allowlist. Queries always use `draft=false`, explicit published filters, depth zero, bounded pagination and selected fields. Returned drafts, invalid pagination, duplicate IDs or post references to unpublished authors abort the build. Pages are limited to legal content. Existing legal source bodies remain in `src/content/legal/`; CMS legal documents use the slugs `impressum`, `datenschutz`, `agb`. Missing published CMS legal documents fall back individually to the original source. Operators import drafts separately and explicitly publish after review.

Blog URLs are `/blog/<slug>`, author profiles `/blog/autoren/<slug>`. Existing category/tag routes and blog components are reused. Author profiles contain their published articles and optionally an author contact form. A missing publication date is displayed without a fabricated date and omitted from BlogPosting JSON-LD. Author relations are published DTOs; private recipient addresses are never requested or rendered.

## Images and metadata

Only media with `websitePublished=true` are eligible. Downloads use the configured origin's authenticated `/api/media/file/` route, forbid redirects/foreign origins and validate bounded image bytes against MIME/signature. Raster formats PNG/JPEG/WebP/AVIF/GIF are supported; SVG/HTML and unpublished references fail closed. Generated content-hash files go into ignored `public/_cms-media/` and are copied into static output. Each build clears the directory so previously revoked files do not persist. Publish this generated directory with the rest of the new site atomically; retire old deployment artifacts separately if assets were publicly available before revocation.

SEO maps title, description, canonical, robots, full Open Graph and Twitter fields, including static social images. JSON-LD is automatic for Organization/WebSite, BlogPosting, Person and page breadcrumbs where applicable. Script serialization escapes HTML delimiters; only public fields are included. Rich text uses the existing closed renderer and rewrites approved media references to static files. Legal Markdown uses the shared safe Markdown renderer; the trusted local fallback retains its original Astro Markdown rendering.

## Components

`AuthorContact` accepts `authorSlug`, `authorName`, optional `isDemo` (default false). Its native POST action avoids personal data in query strings; JavaScript sends JSON to the intentional public author-contact endpoint. It includes an empty website honeypot, field bounds, submission status and a privacy-policy link. No CMS credential or private recipient address is present. The backend controls origin validation, limits and private inquiry storage; this form does not send email. Use `isDemo` in documentation and never send real test inquiries.

`StructuredData` accepts `items: Record<string, unknown>[]`. It renders one escaped JSON-LD graph. `Metadata` supports per-channel titles/descriptions and image alt text; `Image` serves generated CMS image paths directly without credentialed optimization requests. Existing blog components preserve their layout while linking the article author to the public profile. See `/docs/cms-content` for non-submitting examples and `/docs/editorial-preview` for the separate private editor preview.

## Verification

Run `pnpm check`, `pnpm exec vitest --run`, and `pnpm build`. `cms-content.test.ts` covers endpoint scope, pagination, draft rejection, public image checks, SEO mapping, author visibility, JSON-LD escaping and non-submitting form demos. The private SSR preview remains a separate application; enabling this public build integration does not deploy either website or CMS.
