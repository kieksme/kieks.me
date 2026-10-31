import { describe, expect, it, vi } from 'vitest';
import { fetchCmsBuildContent } from '../../../src/utils/payload-build';
import { resolveSiteContent, safeHref, withHighlights } from '../../../src/utils/site-content';
import { fallbackFaqsLeft, fallbackMcpServers, fallbackServices } from '../../../src/content-model/fallback';
import { footerData, headerData } from '../../../src/navigation';

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
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const slug = url.pathname.split('/').pop()!;
      requested.push(slug);
      expect(url.searchParams.get('draft')).toBe('false');
      expect(url.searchParams.get('where[_status][equals]') ?? 'media').toMatch(/published|media/);
      const docs = slug === 'faqs' ? [{ ...published, id: 1, question: 'Q', answer: 'A', editorialNotes: 'X' }] : [];
      return Response.json({ docs, totalPages: docs.length ? 1 : 0, totalDocs: docs.length, page: 1 });
    }) as unknown as typeof fetch;
    await fetchCmsBuildContent({ url: origin, apiKey: 'k'.repeat(40), fetcher, mediaDirectory: '/tmp/none-site-test' });
    expect(requested.sort()).toEqual(['authors', 'media', 'pages', 'posts']);
    requested.length = 0;
    const withSite = await fetchCmsBuildContent({
      url: origin,
      apiKey: 'k'.repeat(40),
      fetcher,
      siteContent: true,
      mediaDirectory: '/tmp/none-site-test',
    });
    expect(requested).toEqual(expect.arrayContaining(['services', 'team', 'faqs', 'mcp-projects', 'navigation']));
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
});
