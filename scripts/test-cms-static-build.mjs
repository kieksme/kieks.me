// Complete static-build regression with a synthetic in-process CMS fetch fixture.
// It does not query or mutate a real CMS and does not submit any contact form.
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { auditSeo, parseHead } from './lib/seo-audit.mjs';
const temporary = await mkdtemp(path.join(tmpdir(), 'cms-static-fixture-'));
const secret = 'synthetic-static-build-key-never-public-49271';
const hook = path.join(temporary, 'fixture.mjs');
try {
  await writeFile(
    hook,
    `
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==','base64');
const rich = { root: { type:'root', children:[{type:'paragraph',children:[{type:'text',text:'Synthetic published body <script>not executable</script>'}]}] } };
const records = {
  posts:[{id:1,_status:'published',title:'Synthetic CMS Article',slug:'synthetic-cms-article',publishedAt:'2026-10-30T12:00:00Z',updatedAt:'2026-10-31T12:00:00Z',author:2,category:'Engineering',tags:[{tag:'Testing'}],heroImage:7,contentRichText:rich,seo:{title:'Synthetic SEO title',openGraph:{title:'Synthetic OG title',description:'Synthetic OG description',image:7,imageAlt:'Synthetic OG alt',type:'article'},twitter:{title:'Synthetic Twitter title',description:'Synthetic Twitter description',image:7,card:'summary_large_image'}}}],
  authors:[{id:2,_status:'published',name:'Synthetic Author',slug:'synthetic-author',bioRichText:rich,avatar:7,contactEnabled:true,privateRecipient:'PRIVATE_RECIPIENT_MUST_NOT_RENDER'}],
  pages:[{id:3,_status:'published',pageKind:'legal',title:'Synthetic Legal',slug:'impressum',contentMarkdown:'## Synthetic legal text\\n\\n<address>Example address<br>Example city</address>',seo:{description:'Synthetic legal description'}},{id:21,_status:'published',pageKind:'home',slug:'startseite',title:'Synthetic Home',hero:{eyebrow:'Synthetic Eyebrow',headline:'Synthetic headline one\\nSynthetic headline two',lead:'Synthetic hero lead',primaryCta:{label:'Synthetic CTA',href:'/kontakt'},editorialNotes:'PRIVATE_NOTE_MUST_NOT_RENDER'}}],
  services:[{id:11,_status:'published',sortOrder:1,slug:'cloud-devops',highlights:[{title:'Synthetic Highlight',description:'Synthetic highlight text'}],title:'Synthetic Service',summary:'Synthetic service summary',href:'/leistungen/ki-mcp',linkText:'Synthetic more',accent:'yellow',editorialNotes:'PRIVATE_NOTE_MUST_NOT_RENDER'}],
  faqs:[{id:12,_status:'published',sortOrder:1,placement:'home',question:'Synthetic FAQ question?',answer:'Synthetic FAQ answer <b>plain</b>',accent:'aqua'}],
  team:[{id:13,_status:'published',sortOrder:1,slug:'andre',name:'Synthetic Teammate',position:'Synthetic role'}],
  'mcp-projects':[{id:14,_status:'published',sortOrder:1,kind:'mcp-server',name:'Synthetic MCP',summary:'Synthetic MCP summary',repositoryUrl:'https://github.com/example-synthetic/mcp',npmPackages:[{name:'@example/synthetic'}],license:'MIT'}],
  navigation:[{id:15,_status:'published',key:'header',links:[{label:'Synthetic Nav',href:'/blog'}]},{id:16,_status:'published',key:'footer',secondaryLinks:[{label:'Synthetic Legal Link',href:'/impressum'}]}],
  media:[{id:7,websitePublished:true,url:'/api/media/file/synthetic.png',mimeType:'image/png',alt:'Synthetic public image',width:1,height:1}]
};
globalThis.fetch = async (input,init) => {
 const url=new URL(String(input));
 if(url.origin!=='https://cms-fixture.invalid'||init?.headers?.Authorization!=='users API-Key ${secret}'||init?.redirect!=='error')throw Error('Fixture request escaped its boundary');
 if(url.pathname==='/api/media/file/synthetic.png')return new Response(png,{headers:{'content-type':'image/png'}});
 const slug=url.pathname.split('/').pop();
 if(!Object.hasOwn(records,slug)||url.searchParams.get('draft')!=='false')throw Error('Unexpected fixture collection');
 return Response.json({docs:records[slug],totalPages:1,page:1});
};
`
  );
  const result = spawnSync(process.execPath, ['node_modules/astro/astro.js', 'build'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    env: {
      ...process.env,
      PAYLOAD_URL: 'https://cms-fixture.invalid',
      PAYLOAD_BUILD_API_KEY: secret,
      PAYLOAD_SITE_CONTENT: 'true',
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --import=${pathToFileURL(hook).href}`,
      ASTRO_TELEMETRY_DISABLED: '1',
    },
  });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error('Synthetic CMS static build failed');
  }
  const article = await readFile('dist/blog/synthetic-cms-article/index.html', 'utf8');
  const author = await readFile('dist/blog/autoren/synthetic-author/index.html', 'utf8');
  const legal = await readFile('dist/impressum/index.html', 'utf8');
  assert.match(article, /Synthetic CMS Article/);
  assert.match(article, /Synthetic OG title/);
  assert.match(article, /Synthetic Twitter title/);
  assert.match(article, /Synthetic OG alt/);
  assert.match(article, /BlogPosting/);
  assert.match(article, /&lt;script&gt;not executable&lt;\/script&gt;/);
  assert.match(author, /Synthetic Author/);
  assert.match(author, /Synthetic CMS Article/);
  assert.match(author, /\/api\/author-contact\/synthetic-author/);
  assert.match(author, /"@type":"Person"/);
  assert.match(legal, /Synthetic legal text/);
  assert.match(legal, /Example address/);
  // Editable site sections come from the (synthetic) CMS and replace the static fallback per section.
  const home = await readFile('dist/index.html', 'utf8');
  assert.match(home, /Synthetic Service/);
  assert.match(home, /Synthetic FAQ question\?/);
  assert.match(home, /Synthetic FAQ answer &lt;b&gt;plain&lt;\/b&gt;/, 'CMS text is escaped, never HTML');
  assert.match(home, /Synthetic Teammate/);
  assert.match(home, /Synthetic Nav/);
  assert.match(home, /Synthetic Legal Link/);
  assert.match(await readFile('dist/projekte/mcp-server/index.html', 'utf8'), /Synthetic MCP summary/);
  assert.ok(!home.includes('PRIVATE_NOTE_MUST_NOT_RENDER'), 'non-allowlisted CMS field leaked');
  // SEO of the whole CMS-driven output, including Article / Person / BreadcrumbList.
  await auditSeo('dist', {
    expectTypes: {
      '^blog/synthetic-cms-article/': ['BlogPosting', 'BreadcrumbList'],
      '^blog/autoren/synthetic-author/': ['Person', 'BreadcrumbList'],
      '^(impressum|datenschutz|agb)/': ['BreadcrumbList'],
    },
  });
  const articleSeo = parseHead(article);
  assert.equal(articleSeo.canonicals[0], 'https://kieks.me/blog/synthetic-cms-article');
  assert.equal(articleSeo.og('og:type')[0], 'article');
  assert.equal(articleSeo.twitter('twitter:title')[0], 'Synthetic Twitter title');
  assert.equal(articleSeo.twitter('twitter:card')[0], 'summary_large_image');
  const blogIndex = await readFile('dist/blog/index.html', 'utf8');
  assert.match(blogIndex, /Synthetic CMS Article/);
  assert.match(blogIndex, /\/blog\/synthetic-cms-article/);
  const personNode = parseHead(author).nodes.find((n) => n['@type'] === 'Person');
  assert.equal(personNode.name, 'Synthetic Author');
  assert.ok(!JSON.stringify(personNode).includes('PRIVATE_RECIPIENT'));
  const articleNode = articleSeo.nodes.find((n) => n['@type'] === 'BlogPosting');
  assert.equal(articleNode.author.name, 'Synthetic Author');
  assert.equal(articleNode.datePublished, '2026-10-30T12:00:00.000Z');
  // Author contact form: native POST, honeypot, bounded fields, no private recipient.
  assert.match(author, /name="website"/);
  assert.match(author, /maxlength=/);
  assert.match(author, /method="post"/i);
  assert.ok(!/action="[^"]*\?/.test(author), 'author form must not put data into a query string');
  const homeHtml = await readFile('dist/index.html', 'utf8');
  for (const expected of [
    'Synthetic Eyebrow',
    'Synthetic headline one',
    'Synthetic headline two',
    'Synthetic hero lead',
    'Synthetic CTA',
  ])
    assert.ok(homeHtml.includes(expected), `Home hero must render ${expected}`);
  const cloud = await readFile('dist/leistungen/cloud-devops/index.html', 'utf8');
  assert.ok(
    cloud.includes('Synthetic Highlight') && cloud.includes('Synthetic highlight text'),
    'Service highlights must render'
  );
  const files = await readdir('dist/_cms-media');
  assert.equal(files.length, 1);
  assert.match(files[0], /^[a-f0-9]{64}\.png$/);
  async function audit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await audit(filename);
      else if (/\.(html|js|json|xml|txt)$/.test(entry.name)) {
        const body = await readFile(filename, 'utf8');
        assert.ok(!body.includes(secret), 'Build credential leaked into static output');
        assert.ok(!body.includes('PRIVATE_RECIPIENT_MUST_NOT_RENDER'), 'Private author field leaked');
        assert.ok(!body.includes('cms-fixture.invalid'), 'CMS origin leaked into public output');
        assert.ok(!body.includes('/api/media/file/'), 'Private CMS media path leaked');
      }
    }
  }
  await audit('dist');
  const fallbackEnv = { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' };
  delete fallbackEnv.PAYLOAD_URL;
  delete fallbackEnv.PAYLOAD_BUILD_API_KEY;
  const fallback = spawnSync(process.execPath, ['node_modules/astro/astro.js', 'build'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    env: fallbackEnv,
  });
  if (fallback.status !== 0) {
    console.error(fallback.stdout);
    console.error(fallback.stderr);
    throw new Error('No-CMS fallback static build failed');
  }
  assert.match(await readFile('dist/blog/index.html', 'utf8'), /Hier erscheinen bald unsere ersten Beiträge/);
  assert.match(await readFile('dist/impressum/index.html', 'utf8'), /Hardenbergstraße 48/);
  assert.ok(!(await readFile('dist/impressum/index.html', 'utf8')).includes('Synthetic Legal'));
  for (const slug of ['impressum', 'datenschutz', 'agb']) {
    const html = await readFile(`dist/${slug}/index.html`, 'utf8');
    assert.equal((html.match(/<html\b/g) || []).length, 1, 'Legal fallback nested a second page layout');
    assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Legal fallback duplicated the page heading');
  }
  // Synthetic test data must not survive into a build without CMS access.
  async function scan(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await scan(filename);
      else if (/\.(html|js|json|xml|txt)$/.test(entry.name)) {
        const body = await readFile(filename, 'utf8');
        assert.ok(
          !/Synthetic (?:CMS|Author|Service|Teammate|MCP|Nav|FAQ|Legal|Highlight|highlight|headline|hero|Eyebrow|CTA)|PRIVATE_/.test(
            body
          ),
          `${filename}: test data published`
        );
      }
    }
  }
  await scan('dist');
  await auditSeo('dist');
  for (const directory of ['public/_cms-media', 'dist/_cms-media']) {
    const remaining = await readdir(directory).catch((error) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    assert.equal(remaining.length, 0, 'Previously exported CMS images survived a build without publication access');
  }
  console.log(
    'Synthetic CMS static build passed: article, author, legal, site sections, SEO audit (Article/Person/Breadcrumb), static media, no leaked test data and credential isolation'
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
