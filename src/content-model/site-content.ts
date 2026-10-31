/**
 * Expected Payload structure for the editable website sections (schema owner: kieksme/kieks.me.datahub,
 * branch feat/markdown-editor-mcp-drafts, docs/editorial/website-schema.md). Only these fields are requested, validated and rendered.
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
  sortOrder?: number;
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
/** `team` — public team members. `slug` (`andre`, `thomas`) selects a bundled portrait until media is wired. */
export interface CmsTeamMember extends CmsBase {
  slug: string;
  name: string;
  /** Shown as role under the portrait. */
  position?: string;
  accent?: PopAccent;
}
/** `faqs` — plain-text question/answer pairs. Only `placement: home` is shown on the home page. */
export interface CmsFaq extends CmsBase {
  question: string;
  answer: string;
  placement?: 'home' | 'general';
  accent?: PopAccent;
}
/** `mcp-projects` — `mcp-server` documents are MCP servers; `skill`, `tool` and `product` are other projects. */
export interface CmsMcpProject extends CmsBase {
  kind?: 'mcp-server' | 'skill' | 'tool' | 'product';
  name: string;
  summary: string;
  repositoryUrl: string;
  documentationUrl?: string;
  license?: string;
  npmPackages?: { name: string }[];
  accent?: PopAccent;
}
interface CmsLink {
  label: string;
  href?: string;
}
/** `navigation` — one document per placement: `key` is `header` or `footer`. */
export interface CmsNavigation extends CmsBase {
  key: 'header' | 'footer';
  /** Header: a link, or a group when `children` is set. Footer: one column per entry (`label` + `children`). */
  links?: (CmsLink & { children?: (CmsLink & { href: string })[] })[];
  /** Footer legal links. */
  secondaryLinks?: (CmsLink & { href: string })[];
}
export interface CmsSiteDocuments {
  services?: CmsService[];
  team?: CmsTeamMember[];
  faqs?: CmsFaq[];
  'mcp-projects'?: CmsMcpProject[];
  navigation?: CmsNavigation[];
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
