/**
 * Expected Payload structure for the editable website sections (schema owner: kieksme/kieks.me.datahub,
 * branch feat/markdown-editor-mcp-drafts). Only these fields are requested, validated and rendered.
 * Every collection is optional: without CMS access, or without published documents, the static fallback
 * in `fallback.ts` renders unchanged. Collection slugs: services, team, faqs, mcp-projects, navigation.
 */
export type PopAccent = 'aqua' | 'fuchsia' | 'yellow' | 'purple';
export const POP_ACCENTS: readonly PopAccent[] = ['aqua', 'fuchsia', 'yellow', 'purple'];

/** Fields shared by all website collections. `_status` must be `published` for the static build. */
interface CmsBase {
  id: string | number;
  _status: 'published';
  /** Ascending display order (integer, default 0). */
  order?: number;
}
/** `services` — home page cards and navigation targets. */
export interface CmsService extends CmsBase {
  title: string;
  summary: string;
  /** Internal path (`/leistungen/...`) or https URL. */
  href: string;
  linkText: string;
  accent?: PopAccent;
}
/** `team` — public team members. `slug` matches a bundled portrait (andre, thomas) until media is wired. */
export interface CmsTeamMember extends CmsBase {
  slug: string;
  name: string;
  /** Lower-case display label under the portrait. */
  label?: string;
  role?: string;
  imageAlt?: string;
}
/** `faqs` — plain-text question/answer pairs, displayed in two columns in order. */
export interface CmsFaq extends CmsBase {
  question: string;
  answer: string;
  accent?: PopAccent;
}
/** `mcp-projects` — MCP servers (`kind: server`) and other open-source projects (`kind: project`). */
export interface CmsMcpProject extends CmsBase {
  kind: 'server' | 'project';
  name: string;
  summary: string;
  url: string;
  npm?: string;
  license?: string;
  docsUrl?: string;
  /** Internal page for `kind: project`, e.g. `/csp`. */
  page?: string;
  /** Show as chip on the home page (servers only). */
  featured?: boolean;
  /** Home chip label, defaults to `mcp-server · <name>`. */
  chipLabel?: string;
  accent?: PopAccent;
}
/** `navigation` — one document per link. `group` makes a link part of a header dropdown / footer column. */
export interface CmsNavigationLink extends CmsBase {
  placement: 'header' | 'footer' | 'legal';
  label: string;
  href: string;
  group?: string;
}
export interface CmsSiteDocuments {
  services?: CmsService[];
  team?: CmsTeamMember[];
  faqs?: CmsFaq[];
  'mcp-projects'?: CmsMcpProject[];
  navigation?: CmsNavigationLink[];
}

/** View models consumed by the Astro pages (identical shape for CMS and fallback). */
export interface SiteServiceView {
  num: string;
  title: string;
  description: string;
  href: string;
  linkText: string;
  headColor: PopAccent;
  shadow: 'ink' | 'fuchsia';
  numShadow: 'fuchsia' | 'aqua';
  numColor?: string;
}
export interface SiteFaqView {
  title: string;
  body: string;
  color: PopAccent;
}
export interface SiteTeamView {
  slug: string;
  name: string;
  label: string;
  role?: string;
  imageAlt: string;
}
export interface SiteMcpServerView {
  name: string;
  description: string;
  npm: string;
  license: string;
  url: string;
}
export interface SiteOtherProjectView {
  name: string;
  description: string;
  url: string;
  extra?: string;
  page?: string;
}
export interface SiteNavLink {
  text: string;
  href: string;
}
export interface SiteNavGroup {
  text: string;
  links: SiteNavLink[];
}
export interface SiteContent {
  services: SiteServiceView[];
  faqsLeft: SiteFaqView[];
  faqsRight: SiteFaqView[];
  team: SiteTeamView[];
  homeProjects: { name: string; href: string; color: PopAccent }[];
  mcpServers: SiteMcpServerView[];
  otherProjects: SiteOtherProjectView[];
  header: (SiteNavLink | SiteNavGroup)[];
  footerColumns: { title: string; links: SiteNavLink[] }[];
  legalLinks: SiteNavLink[];
  /** Which sections came from the CMS (empty = static fallback everywhere). */
  fromCms: string[];
}
