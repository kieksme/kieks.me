// Audits the already built public site (run `pnpm build` first). Content is public static output only.
import { auditSeo } from './lib/seo-audit.mjs';
const pages = await auditSeo('dist', { expectTypes: { '^(impressum|datenschutz|agb)/': ['BreadcrumbList'] } });
console.log(`SEO audit passed for ${pages.length} pages`);
// Contact form: honeypot, required fields, no secrets, no query-string submission.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const kontakt = await readFile('dist/kontakt/index.html', 'utf8');
assert.match(kontakt, /netlify-honeypot="bot-field"/);
assert.match(kontakt, /<form[^>]*method="POST"/i);
assert.ok(!/<form[^>]*action="[^"]*\?/.test(kontakt));
assert.ok((kontakt.match(/\brequired\b/g) || []).length >= 3, 'contact form needs required fields');
console.log('Contact form checks passed');
