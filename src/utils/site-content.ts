// Pure, build-time resolver: validated CMS documents (when present) over the static fallback.
import {
  fallbackFaqsLeft,
  fallbackFaqsRight,
  fallbackHomeProjects,
  fallbackMcpServers,
  fallbackOtherProjects,
  fallbackServices,
  fallbackTeam,
} from '../content-model/fallback';
import { POP_ACCENTS } from '../content-model/site-content';
import type { PopAccent, SiteContent, SiteNavGroup, SiteNavLink, SiteServiceView } from '../content-model/site-content';
import { footerData, headerData } from '../navigation';
import { loadCmsBuildContent } from './payload-build';

type Doc = Record<string, unknown>;
const MAX_ITEMS = 50;
const str = (value: unknown, max: number, required = false): string => {
  if (typeof value !== 'string') {
    if (required) throw new Error('CMS site content: missing text field');
    return '';
  }
  const trimmed = value.trim();
  if (required && !trimmed) throw new Error('CMS site content: empty text field');
  if (
    trimmed.length > max ||
    [...trimmed].some((char) => {
      const code = char.charCodeAt(0);
      return (code < 32 && ![9, 10, 13].includes(code)) || code === 127;
    })
  )
    throw new Error('CMS site content: text field is too long or contains control characters');
  return trimmed;
};
/** Internal absolute path or https/mailto URL; everything else (javascript:, data:, //host, private CMS paths) fails. */
export function safeHref(value: unknown, allowFragment = true): string {
  const href = str(value, 500, true);
  if (/^\/(?![/\\])/.test(href) && !href.startsWith('/api/') && !/[\s\\]/.test(href)) return href;
  if (allowFragment && /^#[A-Za-z0-9_-]+$/.test(href)) return href;
  if (/^mailto:[^\s<>]+$/.test(href)) return href;
  try {
    const url = new URL(href);
    if (url.protocol === 'https:' && !url.username && !url.password && url.hostname !== 'datahub.kieks.me') return href;
  } catch {
    /* rejected below */
  }
  throw new Error('CMS site content: unsafe link');
}
const accent = (value: unknown, fallback: PopAccent): PopAccent =>
  POP_ACCENTS.includes(value as PopAccent) ? (value as PopAccent) : fallback;
const list = (value: unknown): Doc[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ITEMS) throw new Error('CMS site content: invalid collection');
  const seen = new Set<string>();
  const docs = value.map((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('CMS site content: invalid document');
    const doc = raw as Doc;
    if (doc._status !== 'published') throw new Error('CMS site content: unpublished document rejected');
    const id = String(doc.id ?? '');
    if (!id || seen.has(id)) throw new Error('CMS site content: duplicate or missing id');
    seen.add(id);
    return doc;
  });
  return docs.sort(
    (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || String(a.id).localeCompare(String(b.id))
  );
};
const SERVICE_STYLE: Record<PopAccent, Pick<SiteServiceView, 'shadow' | 'numShadow' | 'numColor'>> = {
  aqua: { shadow: 'ink', numShadow: 'fuchsia' },
  fuchsia: { shadow: 'ink', numShadow: 'aqua' },
  purple: { shadow: 'ink', numShadow: 'fuchsia', numColor: '#fff' },
  yellow: { shadow: 'fuchsia', numShadow: 'fuchsia' },
};

export function resolveSiteContent(site?: Record<string, unknown>): SiteContent {
  const fromCms: string[] = [];
  const result: SiteContent = {
    services: fallbackServices,
    faqsLeft: fallbackFaqsLeft,
    faqsRight: fallbackFaqsRight,
    team: fallbackTeam,
    homeProjects: fallbackHomeProjects,
    mcpServers: fallbackMcpServers,
    otherProjects: fallbackOtherProjects,
    header: headerData.links as SiteContent['header'],
    footerColumns: footerData.links as SiteContent['footerColumns'],
    legalLinks: footerData.secondaryLinks,
    fromCms,
  };
  if (!site) return result;
  const services = list(site.services);
  if (services.length) {
    fromCms.push('services');
    result.services = services.map((doc, index) => {
      const color = accent(doc.accent, 'aqua');
      return {
        num: String(index + 1).padStart(2, '0'),
        title: str(doc.title, 120, true),
        description: str(doc.summary, 600, true),
        href: safeHref(doc.href, false),
        linkText: str(doc.linkText, 120, true),
        headColor: color,
        ...SERVICE_STYLE[color],
      };
    });
  }
  const faqs = list(site.faqs);
  if (faqs.length) {
    fromCms.push('faqs');
    const views = faqs.map((doc, index) => ({
      title: str(doc.question, 240, true),
      body: str(doc.answer, 2000, true),
      color: accent(doc.accent, POP_ACCENTS[index % POP_ACCENTS.length]),
    }));
    const half = Math.ceil(views.length / 2);
    result.faqsLeft = views.slice(0, half);
    result.faqsRight = views.slice(half);
  }
  const team = list(site.team);
  if (team.length) {
    fromCms.push('team');
    result.team = team.map((doc) => {
      const slug = str(doc.slug, 80, true);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('CMS site content: invalid team slug');
      const name = str(doc.name, 120, true);
      return {
        slug,
        name,
        label: str(doc.label, 60) || name.split(' ')[0],
        role: str(doc.role, 400) || undefined,
        imageAlt: str(doc.imageAlt, 200) || `${name}, Gesellschafter der kieks.me GbR`,
      };
    });
  }
  const projects = list(site['mcp-projects']);
  if (projects.length) {
    fromCms.push('mcp-projects');
    const servers = projects.filter((doc) => doc.kind === 'server');
    const others = projects.filter((doc) => doc.kind === 'project');
    if (servers.length + others.length !== projects.length) throw new Error('CMS site content: invalid project kind');
    if (servers.length) {
      result.mcpServers = servers.map((doc) => ({
        name: str(doc.name, 120, true),
        description: str(doc.summary, 800, true),
        npm: str(doc.npm, 300),
        license: str(doc.license, 120) || '–',
        url: safeHref(doc.url, false),
      }));
      const featured = servers.filter((doc) => doc.featured === true).slice(0, 8);
      if (featured.length)
        result.homeProjects = featured.map((doc, index) => ({
          name:
            str(doc.chipLabel, 80) ||
            `mcp-server · ${str(doc.name, 120, true)
              .replace(/\s*MCP$/i, '')
              .toLowerCase()}`,
          href: safeHref(doc.url, false),
          color: accent(doc.accent, POP_ACCENTS[index % POP_ACCENTS.length]),
        }));
    }
    if (others.length)
      result.otherProjects = others.map((doc) => ({
        name: str(doc.name, 120, true),
        description: str(doc.summary, 800, true),
        url: safeHref(doc.url, false),
        extra: doc.docsUrl ? safeHref(doc.docsUrl, false) : undefined,
        page: doc.page ? safeHref(doc.page, false) : undefined,
      }));
  }
  const navigation = list(site.navigation);
  if (navigation.length) {
    fromCms.push('navigation');
    const link = (doc: Doc): SiteNavLink => ({ text: str(doc.label, 80, true), href: safeHref(doc.href) });
    const placement = (name: string) => navigation.filter((doc) => doc.placement === name);
    if (navigation.some((doc) => !['header', 'footer', 'legal'].includes(String(doc.placement))))
      throw new Error('CMS site content: invalid navigation placement');
    const header = placement('header');
    if (header.length) {
      const items: (SiteNavLink | SiteNavGroup)[] = [];
      const groups = new Map<string, SiteNavGroup>();
      for (const doc of header) {
        const group = str(doc.group, 80);
        if (!group) items.push(link(doc));
        else {
          let entry = groups.get(group);
          if (!entry) {
            entry = { text: group, links: [] };
            groups.set(group, entry);
            items.push(entry);
          }
          entry.links.push(link(doc));
        }
      }
      result.header = items;
    }
    const footer = placement('footer');
    if (footer.length) {
      const columns = new Map<string, { title: string; links: SiteNavLink[] }>();
      for (const doc of footer) {
        const title = str(doc.group, 80) || 'Links';
        if (!columns.has(title)) columns.set(title, { title, links: [] });
        columns.get(title)!.links.push(link(doc));
      }
      result.footerColumns = [...columns.values()];
    }
    const legal = placement('legal');
    if (legal.length) result.legalLinks = legal.map(link);
  }
  return result;
}

/** Build-time entry point for pages: published CMS sections (if enabled) over the static fallback. */
export async function getSiteContent(): Promise<SiteContent> {
  const content = await loadCmsBuildContent();
  return resolveSiteContent(content.enabled && Object.keys(content.site ?? {}).length ? content.site : undefined);
}
