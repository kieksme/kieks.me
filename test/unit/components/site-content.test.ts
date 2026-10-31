import { describe, expect, it, vi } from 'vitest';
import { fetchCmsBuildContent } from '../../../src/utils/payload-build';
import { resolveSiteContent, safeHref } from '../../../src/utils/site-content';
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
        { ...published, id: 2, order: 2, title: 'B', summary: 'b', href: '/b', linkText: 'Mehr B', accent: 'purple' },
        { ...published, id: 1, order: 1, title: 'A', summary: 'a', href: '/a', linkText: 'Mehr A', accent: 'nope' },
      ],
      faqs: [1, 2, 3].map((id) => ({ ...published, id, order: id, question: `Q${id}`, answer: `A${id}` })),
      navigation: [
        { ...published, id: 1, order: 1, placement: 'header', label: 'Start', href: '/' },
        { ...published, id: 2, order: 2, placement: 'header', label: 'Eins', href: '/eins', group: 'Leistungen' },
        { ...published, id: 3, order: 3, placement: 'header', label: 'Zwei', href: '/zwei', group: 'Leistungen' },
        { ...published, id: 4, order: 4, placement: 'legal', label: 'Impressum', href: '/impressum' },
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
    expect(content.legalLinks).toEqual([{ text: 'Impressum', href: '/impressum' }]);
    expect(content.footerColumns).toEqual(footerData.links);
    expect(content.team).toEqual(resolveSiteContent().team);
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
    expect(() =>
      resolveSiteContent({ navigation: [{ ...published, id: 1, placement: 'x', label: 'a', href: '/' }] })
    ).toThrow();
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
  });
});
