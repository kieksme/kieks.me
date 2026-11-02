import { describe, expect, it, vi } from 'vitest';
import { fetchCmsBuildContent } from '../../../src/utils/payload-build';
import { resolveSiteContent, safeHref, withHighlights } from '../../../src/utils/site-content';
import { fallbackFaqsLeft, fallbackMcpServers, fallbackServices } from '../../../src/content-model/fallback';
import { footerData, headerData } from '../../../src/navigation';
import { getNavigation } from '../../../src/i18n/navigation';

const published = { _status: 'published' as const };
describe('editable site sections with static fallback', () => {
  it('returns the unchanged static fallback without CMS data or with empty collections', () => {
    for (const input of [undefined, {}, { services: [], faqs: [], team: [], 'mcp-projects': [], navigation: [] }]) {
      const content = resolveSiteContent(input);
      expect(content.fromCms).toEqual([]);
      expect(content.services).toBe(fallbackServices);
      expect(content.faqsLeft).toBe(fallbackFaqsLeft);
      expect(content.mcpServers).toBe(fallbackMcpServers);
      expect(content.header).toEqual(headerData.links);
      expect(content.footerColumns).toEqual(footerData.links);
      expect(content.legalLinks).toEqual(footerData.secondaryLinks);
    }
  });

  it('uses English static navigation when its CMS locale has no values and never falls back to German CMS fields', () => {
    const english = getNavigation('en');
    const emptyEnglish = resolveSiteContent(undefined, undefined, 'en');
    expect(emptyEnglish.header).toEqual(english.header.links);
    expect(emptyEnglish.footerColumns).toEqual(english.footer.links);
    expect(emptyEnglish.legalLinks).toEqual([]);
    expect(emptyEnglish).toMatchObject({
      services: [],
      faqsLeft: [],
      faqsRight: [],
      team: [],
      homeProjects: [],
      mcpServers: [],
      otherProjects: [],
      serviceHighlights: {},
      serviceDetails: {},
    });
    expect(emptyEnglish.hero).toBeUndefined();
    for (const german of ['Leistungen', 'Datenschutz', 'Gesellschafter', 'Warum kieks.me', 'Mehr zu'])
      expect(JSON.stringify(emptyEnglish)).not.toContain(german);

    const localized = resolveSiteContent(
      {
        navigation: [
          {
            ...published,
            id: 1,
            key: 'header',
            links: [{ label: 'CMS Services', href: '/en/services' }],
          },
        ],
      },
      undefined,
      'en'
    );
    expect(localized.header).toEqual([{ text: 'CMS Services', href: '/en/services' }]);
    expect(localized.footerColumns).toEqual(english.footer.links);
    expect(JSON.stringify(localized)).not.toContain('Leistungen');
  });

  it('ignores null untranslated English documents and keeps translated neighbors isolated', () => {
    const content = resolveSiteContent(
      {
        services: [
          {
            ...published,
            id: 'service-de',
            slug: 'de-service',
            title: null,
            summary: 'DE SERVICE',
            href: '/leistungen/de',
            linkText: 'Mehr',
          },
          {
            ...published,
            id: 'service-en',
            slug: 'english-service',
            title: 'English service',
            summary: 'English summary',
            href: '/en/services/english',
            linkText: 'Learn more',
            highlights: null,
          },
        ],
        faqs: [
          { ...published, id: 'faq-de', placement: 'home', question: null, answer: 'DE FAQ' },
          { ...published, id: 'faq-en', placement: 'home', question: 'English question', answer: 'English answer' },
        ],
        team: [
          { ...published, id: 'team-de', slug: 'de-person', name: null, position: 'DE TEAM' },
          { ...published, id: 'team-en', slug: 'alice', name: 'Alice Example', position: 'Partner' },
        ],
        'mcp-projects': [
          {
            ...published,
            id: 'project-de',
            kind: 'mcp-server',
            name: 'DE PROJECT',
            summary: null,
            repositoryUrl: 'https://github.com/kieksme/de',
          },
          {
            ...published,
            id: 'project-en',
            kind: 'mcp-server',
            name: 'English MCP',
            summary: 'English project',
            repositoryUrl: 'https://github.com/kieksme/en',
          },
        ],
        navigation: [
          {
            ...published,
            id: 'nav-de',
            key: 'header',
            links: [{ label: null, href: '/leistungen/de' }],
          },
        ],
        home: [
          {
            ...published,
            id: 'home-de',
            slug: 'startseite',
            hero: { eyebrow: 'DE HERO', headline: null, lead: 'DE LEAD' },
          },
        ],
      },
      undefined,
      'en'
    );

    expect(content.services.map((item) => item.title)).toEqual(['English service']);
    expect(content.serviceHighlights).toEqual({});
    expect([...content.faqsLeft, ...content.faqsRight].map((item) => item.title)).toEqual(['English question']);
    expect(content.team).toEqual([
      {
        slug: 'alice',
        name: 'Alice Example',
        label: 'alice',
        role: 'Partner',
        imageAlt: 'Alice Example, Partner at kieks.me GbR',
      },
    ]);
    expect(content.mcpServers.map((item) => item.name)).toEqual(['English MCP']);
    expect(content.homeProjects.map((item) => item.name)).toEqual(['mcp-server · english']);
    expect(content.header).toEqual(getNavigation('en').header.links);
    expect(content.hero).toBeUndefined();
    for (const german of ['DE SERVICE', 'DE FAQ', 'DE TEAM', 'DE PROJECT', 'DE HERO', 'DE LEAD', 'Gesellschafter'])
      expect(JSON.stringify(content)).not.toContain(german);
  });

  it('keeps translated English sections when only optional localized fields are null', () => {
    const content = resolveSiteContent(
      {
        navigation: [
          {
            ...published,
            id: 'header-en',
            key: 'header',
            links: [
              {
                label: 'CMS Services',
                href: null,
                children: [{ label: 'CMS Service', href: '/en/services/cms' }],
              },
            ],
            actions: null,
          },
        ],
        home: [
          {
            ...published,
            id: 'home-en',
            slug: 'startseite',
            title: 'Home',
            hero: {
              eyebrow: null,
              headline: 'English headline',
              lead: null,
              primaryCta: null,
              secondaryCta: null,
            },
          },
        ],
      },
      undefined,
      'en'
    );

    expect(content.header).toEqual([
      {
        text: 'CMS Services',
        links: [{ text: 'CMS Service', href: '/en/services/cms' }],
      },
    ]);
    expect(content.headerActions).toEqual(getNavigation('en').header.actions);
    expect(content.hero).toEqual({
      eyebrow: '',
      headlineLines: ['English headline'],
      lead: '',
      primaryCta: undefined,
      secondaryCta: undefined,
    });
  });

  it('still fails closed for null German fields and malformed non-null English fields', () => {
    const service = {
      ...published,
      id: 1,
      slug: 'service',
      summary: 'Summary',
      href: '/en/services/service',
      linkText: 'Learn more',
    };
    expect(() => resolveSiteContent({ services: [{ ...service, title: null }] })).toThrow('missing text');
    expect(() =>
      resolveSiteContent({ services: [{ ...service, title: { translated: false } }] }, undefined, 'en')
    ).toThrow('missing text');
    expect(() =>
      resolveSiteContent(
        {
          navigation: [{ ...published, id: 1, key: 'header', links: [{ label: 42, href: '/en/services' }] }],
        },
        undefined,
        'en'
      )
    ).toThrow('missing text');
    expect(() =>
      resolveSiteContent(
        { home: [{ ...published, id: 1, slug: 'startseite', title: 'Home', hero: 'not-an-object' }] },
        undefined,
        'en'
      )
    ).toThrow('invalid home hero');
  });

  it('maps validated published documents in order and keeps untouched sections on fallback', () => {
    const content = resolveSiteContent({
      services: [
        {
          ...published,
          id: 2,
          sortOrder: 20,
          title: 'B',
          summary: 'b',
          href: '/b',
          linkText: 'Mehr B',
          accent: 'purple',
        },
        {
          ...published,
          id: 1,
          sortOrder: 10,
          title: 'A',
          summary: 'a',
          href: '/a',
          linkText: 'Mehr A',
          accent: 'nope',
        },
      ],
      faqs: [
        ...[1, 2, 3].map((id) => ({
          ...published,
          id,
          sortOrder: id,
          placement: 'home',
          question: `Q${id}`,
          answer: `A${id}`,
        })),
        { ...published, id: 9, sortOrder: 0, placement: 'general', question: 'Not on home', answer: 'x' },
      ],
      navigation: [
        {
          ...published,
          id: 1,
          key: 'header',
          links: [
            { label: 'Start', href: '/' },
            {
              label: 'Leistungen',
              href: '',
              children: [
                { label: 'Eins', href: '/eins' },
                { label: 'Zwei', href: '/zwei' },
              ],
            },
          ],
          actions: [{ label: 'Ignored', href: '/kontakt' }],
        },
        {
          ...published,
          id: 2,
          key: 'footer',
          links: [{ label: 'Projekte', children: [{ label: 'MCP', href: '/projekte/mcp-server' }] }],
          secondaryLinks: [{ label: 'Impressum', href: '/impressum' }],
        },
      ],
    });
    expect(content.fromCms).toEqual(['services', 'faqs', 'navigation']);
    expect(content.services.map((s) => [s.num, s.title, s.headColor])).toEqual([
      ['01', 'A', 'aqua'],
      ['02', 'B', 'purple'],
    ]);
    expect(content.faqsLeft.map((f) => f.title)).toEqual(['Q1', 'Q2']);
    expect(content.faqsRight.map((f) => f.title)).toEqual(['Q3']);
    expect(content.header).toEqual([
      { text: 'Start', href: '/' },
      {
        text: 'Leistungen',
        links: [
          { text: 'Eins', href: '/eins' },
          { text: 'Zwei', href: '/zwei' },
        ],
      },
    ]);
    expect(content.footerColumns).toEqual([
      { title: 'Projekte', links: [{ text: 'MCP', href: '/projekte/mcp-server' }] },
    ]);
    expect(content.legalLinks).toEqual([{ text: 'Impressum', href: '/impressum' }]);
    expect(content.team).toEqual(resolveSiteContent().team);
  });

  it('maps Datahub team and MCP project documents', () => {
    const content = resolveSiteContent({
      team: [{ ...published, id: 1, slug: 'andre', name: 'André Lademann', position: 'Gesellschafter' }],
      'mcp-projects': [
        {
          ...published,
          id: 1,
          sortOrder: 10,
          kind: 'mcp-server',
          name: 'Contabo MCP',
          summary: 's',
          repositoryUrl: 'https://github.com/kieksme/mcp-contabo',
          license: 'GPL-3.0',
          npmPackages: [{ name: '@kieksme/contabo-mcp' }, { name: '@kieksme/x' }],
        },
        {
          ...published,
          id: 2,
          sortOrder: 20,
          kind: 'tool',
          name: 'HTTP Kit',
          summary: 't',
          repositoryUrl: 'https://github.com/kieksme/mcp-http-kit',
          documentationUrl: 'https://github.com/kieksme/mcp-http-kit#readme',
        },
      ],
    });
    expect(content.team).toEqual([
      {
        slug: 'andre',
        name: 'André Lademann',
        label: 'andré',
        role: 'Gesellschafter',
        imageAlt: 'André Lademann, Gesellschafter der kieks.me GbR',
      },
    ]);
    expect(content.mcpServers).toEqual([
      {
        name: 'Contabo MCP',
        description: 's',
        npm: '@kieksme/contabo-mcp, @kieksme/x',
        license: 'GPL-3.0',
        url: 'https://github.com/kieksme/mcp-contabo',
      },
    ]);
    expect(content.homeProjects.map((p) => p.name)).toEqual(['mcp-server · contabo']);
    expect(content.otherProjects).toEqual([
      {
        name: 'HTTP Kit',
        description: 't',
        url: 'https://github.com/kieksme/mcp-http-kit',
        extra: 'https://github.com/kieksme/mcp-http-kit#readme',
        page: undefined,
      },
    ]);
  });

  it('maps the home hero and service highlights, keeping decoration by position', () => {
    const content = resolveSiteContent({
      home: [
        {
          ...published,
          id: 1,
          slug: 'startseite',
          hero: {
            eyebrow: 'E',
            headline: 'eins\nzwei\n',
            lead: 'L',
            primaryCta: { label: 'Los', href: '/kontakt' },
            secondaryCta: { label: 'Weiter', href: '#leistungen' },
          },
        },
        { ...published, id: 2, slug: 'andere', hero: { headline: 'ignoriert' } },
      ],
      services: [
        {
          ...published,
          id: 1,
          slug: 'cloud-devops',
          title: 'A',
          summary: 'a',
          href: '/a',
          linkText: 'x',
          highlights: [{ title: 'H1', description: 'D1' }, { title: 'H2' }],
        },
      ],
    });
    expect(content.hero).toEqual({
      eyebrow: 'E',
      headlineLines: ['eins', 'zwei'],
      lead: 'L',
      primaryCta: { text: 'Los', href: '/kontakt' },
      secondaryCta: { text: 'Weiter', href: '#leistungen' },
    });
    expect(content.fromCms).toContain('home');
    expect(content.serviceHighlights['cloud-devops']).toEqual([
      { title: 'H1', description: 'D1' },
      { title: 'H2', description: '' },
    ]);
    const base = [
      { title: 'a', description: 'b', icon: 'i1' },
      { title: 'c', description: 'd', icon: 'i2' },
    ];
    expect(withHighlights(undefined, base)).toBe(base);
    expect(withHighlights([], base)).toBe(base);
    expect(withHighlights(content.serviceHighlights['cloud-devops'], base)).toEqual([
      { title: 'H1', description: 'D1', icon: 'i1' },
      { title: 'H2', description: '', icon: 'i2' },
    ]);
    expect(resolveSiteContent().hero).toBeUndefined();
    expect(resolveSiteContent().serviceHighlights).toEqual({});
  });

  it('rejects unsafe hero links and malformed highlights', () => {
    const home = (hero: unknown) => ({ home: [{ ...published, id: 1, slug: 'startseite', hero }] });
    expect(() =>
      resolveSiteContent(home({ headline: 'x', primaryCta: { label: 'x', href: 'javascript:alert(1)' } }))
    ).toThrow('unsafe');
    expect(() => resolveSiteContent(home({ headline: 'a\u0000b' }))).toThrow('control');
    const service = { ...published, id: 1, slug: 'x', title: 'A', summary: 'a', href: '/a', linkText: 'x' };
    expect(() =>
      resolveSiteContent({ services: [{ ...service, highlights: [{ description: 'no title' }] }] })
    ).toThrow();
    expect(() => resolveSiteContent({ services: [{ ...service, slug: '../x', highlights: [] }] })).toThrow('slug');
    expect(() =>
      resolveSiteContent({ services: [{ ...service, highlights: Array.from({ length: 13 }, () => ({ title: 't' })) }] })
    ).toThrow('highlights');
  });

  it('maps header actions, social links and the foot note, escaping footer text', () => {
    const content = resolveSiteContent({
      navigation: [
        {
          ...published,
          id: 1,
          key: 'header',
          links: [{ label: 'Kontakt', href: '/kontakt' }],
          actions: [
            { label: 'Buchen', href: '/kontakt', variant: 'secondary' },
            { label: 'Los', href: 'https://example.invalid/x' },
          ],
        },
        {
          ...published,
          id: 2,
          key: 'footer',
          links: [{ label: 'Projekte', children: [{ label: 'A & <b>B</b>', href: '/projekte/mcp-server' }] }],
          secondaryLinks: [{ label: 'AGB <i>x</i>', href: '/agb' }],
          socialLinks: [{ label: 'GitHub', href: 'https://github.com/kieksme', icon: 'tabler:brand-github' }],
          footNote: 'kieks.me <script>x</script> & Co',
        },
      ],
    });
    expect(content.headerActions).toEqual([
      { text: 'Buchen', href: '/kontakt', variant: 'secondary' },
      { text: 'Los', href: 'https://example.invalid/x', variant: 'primary' },
    ]);
    expect(content.socialLinks).toEqual([
      { text: 'GitHub', href: 'https://github.com/kieksme', icon: 'tabler:brand-github' },
    ]);
    expect(content.footNote).toBe('kieks.me &lt;script&gt;x&lt;/script&gt; &amp; Co');
    expect(content.footerColumns[0].links[0].text).toBe('A &amp; &lt;b&gt;B&lt;/b&gt;');
    expect(content.legalLinks[0].text).toBe('AGB &lt;i&gt;x&lt;/i&gt;');
    expect(content.header).toEqual([{ text: 'Kontakt', href: '/kontakt' }]);
    const empty = resolveSiteContent();
    expect(empty.headerActions).toBeUndefined();
    expect(empty.socialLinks).toEqual([]);
    expect(empty.footNote).toBeUndefined();
  });

  it('rejects unsupported icons, unsafe action links, bad variants and oversized lists', () => {
    const nav = (key: string, extra: Record<string, unknown>) => ({
      navigation: [{ ...published, id: key, key, ...extra }],
    });
    const social = (icon: unknown, href = 'https://github.com/kieksme') => ({ label: 'x', href, icon });
    expect(() => resolveSiteContent(nav('footer', { socialLinks: [social('tabler:evil')] }))).toThrow('icon');
    expect(() => resolveSiteContent(nav('footer', { socialLinks: [social(undefined)] }))).toThrow('icon');
    expect(() => resolveSiteContent(nav('footer', { socialLinks: [social('tabler:mail', 'javascript:1')] }))).toThrow(
      'unsafe'
    );
    expect(() =>
      resolveSiteContent(nav('footer', { socialLinks: Array.from({ length: 9 }, () => social('tabler:mail')) }))
    ).toThrow('social');
    expect(() =>
      resolveSiteContent(nav('header', { actions: [{ label: 'x', href: '/a', variant: 'tertiary' }] }))
    ).toThrow('variant');
    expect(() => resolveSiteContent(nav('header', { actions: [{ label: 'x', href: '//evil.invalid' }] }))).toThrow(
      'unsafe'
    );
    expect(() =>
      resolveSiteContent(nav('header', { actions: Array.from({ length: 4 }, () => ({ label: 'x', href: '/a' })) }))
    ).toThrow('actions');
  });

  it('renders rich-text answers and descriptions to sanitized HTML and keeps plain text as fallback', () => {
    const rich = (text: string, extra: unknown[] = []) => ({
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text, format: 1 }, ...extra],
          },
          { type: 'html', html: '<script>alert(1)</script>' },
        ],
      },
    });
    const link = (url: string) => ({ type: 'link', fields: { url }, children: [{ type: 'text', text: 'Link' }] });
    const content = resolveSiteContent({
      faqs: [
        {
          ...published,
          id: 1,
          placement: 'home',
          question: 'Q1',
          answer: 'Plain 1',
          answerRichText: rich('Fett <b>x</b>', [link('https://example.invalid/a'), link('javascript:alert(1)')]),
        },
        { ...published, id: 2, placement: 'home', question: 'Q2', answer: 'Plain 2' },
      ],
      'mcp-projects': [
        {
          ...published,
          id: 1,
          kind: 'mcp-server',
          name: 'S MCP',
          summary: 'plain s',
          repositoryUrl: 'https://github.com/kieksme/s',
          descriptionRichText: rich('Server rich'),
        },
        {
          ...published,
          id: 2,
          kind: 'tool',
          name: 'T',
          summary: 'plain t',
          repositoryUrl: 'https://github.com/kieksme/t',
          descriptionRichText: { root: { type: 'root', children: [] } },
        },
      ],
    });
    const [first, second] = [...content.faqsLeft, ...content.faqsRight];
    expect(first.bodyHtml).toContain('<strong>Fett &lt;b&gt;x&lt;/b&gt;</strong>');
    expect(first.bodyHtml).toContain('href="https://example.invalid/a"');
    expect(first.bodyHtml).not.toContain('javascript:');
    expect(first.bodyHtml).not.toContain('<script');
    expect(first.body).toBe('Plain 1');
    expect(second.bodyHtml).toBeUndefined();
    expect(content.mcpServers[0].descriptionHtml).toBe('<p><strong>Server rich</strong></p>');
    expect(content.otherProjects[0].descriptionHtml).toBeUndefined();
    expect(content.otherProjects[0].description).toBe('plain t');
    const custom = resolveSiteContent(
      { faqs: [{ ...published, id: 1, placement: 'home', question: 'Q', answer: 'A', answerRichText: { x: 1 } }] },
      (value) => `custom:${JSON.stringify(value)}`
    );
    expect(custom.faqsLeft[0].bodyHtml).toBe('custom:{"x":1}');
  });

  it('maps team biographies and service detail text to sanitized HTML with plain fallbacks', () => {
    const rich = (text: string) => ({
      root: {
        type: 'root',
        children: [
          { type: 'paragraph', children: [{ type: 'text', text, format: 1 }] },
          { type: 'html', html: '<script>alert(1)</script>' },
        ],
      },
    });
    const content = resolveSiteContent({
      team: [
        {
          ...published,
          id: 1,
          sortOrder: 1,
          slug: 'andre',
          name: 'André Lademann',
          bioRichText: rich('Bio <b>rich</b>'),
          bio: 'Plain 1',
        },
        { ...published, id: 2, sortOrder: 2, slug: 'thomas', name: 'Thomas Schöne', bio: 'Plain 2' },
        { ...published, id: 3, sortOrder: 3, slug: 'dritte', name: 'Dritte Person' },
      ],
      services: [
        {
          ...published,
          id: 1,
          slug: 'cloud-devops',
          title: 'A',
          summary: 'a',
          href: '/a',
          linkText: 'x',
          descriptionRichText: rich('Detail'),
        },
        { ...published, id: 2, slug: 'entwicklung', title: 'B', summary: 'b', href: '/b', linkText: 'x' },
        {
          ...published,
          id: 3,
          slug: 'beratung',
          title: 'C',
          summary: 'c',
          href: '/c',
          linkText: 'x',
          descriptionRichText: { root: { type: 'root', children: [] } },
        },
      ],
    });
    expect(content.team[0].bioHtml).toBe('<p><strong>Bio &lt;b&gt;rich&lt;/b&gt;</strong></p>');
    expect(content.team[0].bio).toBe('Plain 1');
    expect(content.team[1].bioHtml).toBeUndefined();
    expect(content.team[1].bio).toBe('Plain 2');
    expect(content.team[2].bio).toBeUndefined();
    expect(content.serviceDetails).toEqual({ 'cloud-devops': '<p><strong>Detail</strong></p>' });
    expect(JSON.stringify(content)).not.toContain('<script');
    expect(resolveSiteContent().serviceDetails).toEqual({});
    const withoutSlug = {
      ...published,
      id: 1,
      title: 'A',
      summary: 'a',
      href: '/a',
      linkText: 'x',
      descriptionRichText: rich('D'),
    };
    expect(() => resolveSiteContent({ services: [withoutSlug] })).toThrow();
    expect(() => resolveSiteContent({ services: [{ ...withoutSlug, slug: '../x' }] })).toThrow('slug');
  });

  it('rejects drafts, duplicates, unsafe links, control characters and oversized input', () => {
    const service = { ...published, id: 1, title: 'A', summary: 'a', href: '/a', linkText: 'x' };
    expect(() => resolveSiteContent({ services: [{ ...service, _status: 'draft' }] })).toThrow('unpublished');
    expect(() => resolveSiteContent({ services: [service, service] })).toThrow('duplicate');
    for (const href of [
      'javascript:alert(1)',
      'data:text/html,x',
      '//evil.example',
      '/api/users',
      'http://x.example',
      'https://datahub.kieks.me/api/x',
    ])
      expect(() => resolveSiteContent({ services: [{ ...service, href }] })).toThrow();
    expect(() => resolveSiteContent({ services: [{ ...service, title: 'a\u0000b' }] })).toThrow('control');
    expect(() => resolveSiteContent({ services: [{ ...service, title: '' }] })).toThrow();
    expect(() =>
      resolveSiteContent({ services: Array.from({ length: 51 }, (_, id) => ({ ...service, id })) })
    ).toThrow();
    expect(() => resolveSiteContent({ team: [{ ...published, id: 1, slug: '../x', name: 'N' }] })).toThrow('slug');
    expect(() => resolveSiteContent({ navigation: [{ ...published, id: 1, key: 'sidebar' }] })).toThrow();
    const nav = { ...published, id: 1, key: 'header' };
    expect(() =>
      resolveSiteContent({ navigation: [{ ...nav, links: [{ label: 'x', href: 'javascript:1' }] }] })
    ).toThrow('unsafe');
    expect(() => resolveSiteContent({ navigation: [nav, { ...nav, id: 2 }] })).toThrow('key');
    expect(() =>
      resolveSiteContent({
        'mcp-projects': [{ ...published, id: 1, name: 'n', summary: 's', repositoryUrl: 'http://x.example' }],
      })
    ).toThrow('unsafe');
    expect(() =>
      resolveSiteContent({
        'mcp-projects': [
          { ...published, id: 1, kind: 'server', name: 'n', summary: 's', repositoryUrl: 'https://github.com/a/b' },
        ],
      })
    ).toThrow('kind');
    expect(() =>
      resolveSiteContent({
        'mcp-projects': [
          {
            ...published,
            id: 1,
            kind: 'mcp-server',
            name: 'n',
            summary: 's',
            repositoryUrl: 'https://github.com/a/b',
            npmPackages: [{ name: 'Bad Name' }],
          },
        ],
      })
    ).toThrow('npm');
    expect(safeHref('mailto:kontakt@example.invalid')).toBe('mailto:kontakt@example.invalid');
    expect(safeHref('/leistungen/ki-mcp')).toBe('/leistungen/ki-mcp');
  });

  it('only requests the five site collections when explicitly enabled, published and field-allowlisted', async () => {
    const origin = 'https://cms.example.invalid';
    const requested: string[] = [];
    const mediaSelects: (string | null)[] = [];
    const requestedLocales: (string | null)[] = [];
    const requestedFallbacks: (string | null)[] = [];
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const slug = url.pathname.split('/').pop()!;
      requested.push(slug);
      requestedLocales.push(url.searchParams.get('locale'));
      requestedFallbacks.push(url.searchParams.get('fallback-locale'));
      if (slug === 'media') mediaSelects.push(url.searchParams.get('select[filename]'));
      expect(url.searchParams.get('draft')).toBe('false');
      expect(url.searchParams.get('where[_status][equals]') ?? 'media').toMatch(/published|media/);
      const docs = slug === 'faqs' ? [{ ...published, id: 1, question: 'Q', answer: 'A', editorialNotes: 'X' }] : [];
      return Response.json({ docs, totalPages: docs.length ? 1 : 0, totalDocs: docs.length, page: 1 });
    }) as unknown as typeof fetch;
    await fetchCmsBuildContent({ url: origin, apiKey: 'k'.repeat(40), fetcher, mediaDirectory: '/tmp/none-site-test' });
    expect(requested.sort()).toEqual(['authors', 'media', 'pages', 'posts']);
    expect(requestedLocales).toEqual(['de', 'de', 'de', 'de']);
    expect(requestedFallbacks).toEqual(['none', 'none', 'none', 'none']);
    requested.length = 0;
    requestedLocales.length = 0;
    requestedFallbacks.length = 0;
    const withSite = await fetchCmsBuildContent({
      url: origin,
      apiKey: 'k'.repeat(40),
      fetcher,
      siteContent: true,
      locale: 'en',
      mediaDirectory: '/tmp/none-site-test',
    });
    expect(requested).toEqual(expect.arrayContaining(['services', 'team', 'faqs', 'mcp-projects', 'navigation']));
    expect(requestedLocales.every((locale) => locale === 'en')).toBe(true);
    expect(requestedFallbacks.every((fallback) => fallback === 'none')).toBe(true);
    expect(mediaSelects).toContain('true');
    expect(withSite.site.faqs).toEqual([{ id: 1, _status: 'published', question: 'Q', answer: 'A' }]);
    expect(withSite.site.navigation).toEqual([]);
  });
  it('requests the home page only with site content enabled and never accepts other page kinds', async () => {
    const origin = 'https://cms.example.invalid';
    const kinds: (string | null)[] = [];
    const make = (pageKind: string) =>
      (async (input: string | URL | Request) => {
        const url = new URL(String(input));
        const slug = url.pathname.split('/').pop()!;
        if (slug !== 'pages') return Response.json({ docs: [], totalPages: 0, totalDocs: 0, page: 1 });
        kinds.push(url.searchParams.get('where[pageKind][equals]') ?? url.searchParams.get('where[pageKind][in]'));
        expect(url.searchParams.get('select[hero]')).toBe('true');
        const docs = [{ ...published, id: 1, slug: 'startseite', pageKind, title: 'Start' }];
        return Response.json({ docs, totalPages: 1, totalDocs: 1, page: 1 });
      }) as unknown as typeof fetch;
    const base = { url: origin, apiKey: 'k'.repeat(40), mediaDirectory: '/tmp/none-site-test' };
    await expect(fetchCmsBuildContent({ ...base, fetcher: make('home') })).rejects.toThrow();
    expect(kinds).toEqual(['legal']);
    const withSite = await fetchCmsBuildContent({ ...base, siteContent: true, fetcher: make('home') });
    expect(kinds[1]).toBe('legal,home');
    expect(withSite.pages).toHaveLength(1);
    await expect(fetchCmsBuildContent({ ...base, siteContent: true, fetcher: make('standard') })).rejects.toThrow(
      'page kind'
    );
  });

  it('keeps the team placeholder hint only while no real role or biography exists', async () => {
    const { readFile } = await import('node:fs/promises');
    const page = await readFile(new URL('../../../src/pages/index.astro', import.meta.url), 'utf8');
    expect(page).toContain('teamTextsMissing &&');
    // Fallback team roles are placeholders, so the hint is shown without CMS texts.
    const fallback = resolveSiteContent().team;
    expect(fallback.every((m) => !m.bio && !m.bioHtml && (m.role ?? '').includes('⟦'))).toBe(true);
    const cms = resolveSiteContent({
      team: [{ ...published, id: 1, slug: 'andre', name: 'André Lademann', position: 'Gesellschafter' }],
    }).team;
    expect(cms.some((m) => m.bio || m.bioHtml || (m.role && !m.role.includes('⟦')))).toBe(true);
  });

  it('loads locale-specific site content in PageLayout for both public locales', async () => {
    const { readFile } = await import('node:fs/promises');
    const layout = await readFile(new URL('../../../src/layouts/PageLayout.astro', import.meta.url), 'utf8');
    expect(layout).toContain('await getSiteContent(locale)');
    expect(layout).not.toContain("locale === 'de' ? await getSiteContent()");
  });
});
