import { getLocaleFromPath, locales, type Locale } from './locales';

type RouteKey =
  | 'home'
  | 'agentHub'
  | 'csp'
  | 'consulting'
  | 'cloudDevops'
  | 'development'
  | 'aiMcp'
  | 'mcpServers'
  | 'contact'
  | 'contactSuccess'
  | 'legalNotice'
  | 'privacy'
  | 'terms'
  | 'blog';

interface LocalizedRoute {
  paths: Record<Locale, string>;
  published: Record<Locale, boolean>;
}

const published = { de: true, en: true } as const;
const germanOnly = { de: true, en: false } as const;

export const localizedRoutes = {
  home: { paths: { de: '/', en: '/en' }, published },
  agentHub: { paths: { de: '/agent-hub', en: '/en/agent-hub' }, published },
  csp: { paths: { de: '/csp', en: '/en/csp' }, published },
  consulting: {
    paths: { de: '/leistungen/beratung', en: '/en/services/consulting' },
    published,
  },
  cloudDevops: {
    paths: { de: '/leistungen/cloud-devops', en: '/en/services/cloud-devops' },
    published,
  },
  development: {
    paths: { de: '/leistungen/entwicklung', en: '/en/services/development' },
    published,
  },
  aiMcp: { paths: { de: '/leistungen/ki-mcp', en: '/en/services/ai-mcp' }, published },
  mcpServers: {
    paths: { de: '/projekte/mcp-server', en: '/en/projects/mcp-server' },
    published,
  },
  contact: { paths: { de: '/kontakt', en: '/en/contact' }, published },
  contactSuccess: {
    paths: { de: '/kontakt-erfolgreich', en: '/en/contact/success' },
    published,
  },
  legalNotice: { paths: { de: '/impressum', en: '/en/legal-notice' }, published: germanOnly },
  privacy: { paths: { de: '/datenschutz', en: '/en/privacy' }, published: germanOnly },
  terms: { paths: { de: '/agb', en: '/en/terms' }, published: germanOnly },
  blog: { paths: { de: '/blog', en: '/en/blog' }, published: germanOnly },
} as const satisfies Record<RouteKey, LocalizedRoute>;

export const routeKeys = Object.keys(localizedRoutes) as RouteKey[];

const normalizePath = (pathname: string) => {
  const clean = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '');
  return clean || '/';
};

function findRoute(pathname: string) {
  const normalized = normalizePath(pathname);
  return routeKeys.find((key) =>
    locales.some((locale) => normalizePath(localizedRoutes[key].paths[locale]) === normalized)
  );
}

export function getLocalizedPath(pathname: string, targetLocale: Locale): string {
  const key = findRoute(pathname);
  if (!key || !localizedRoutes[key].published[targetLocale]) {
    return localizedRoutes.home.paths[targetLocale];
  }
  return localizedRoutes[key].paths[targetLocale];
}

export interface LanguageSwitchLink {
  locale: Locale;
  label: 'DE' | 'EN';
  href: string;
  active: boolean;
}

export function getLanguageSwitchLinks(pathname: string): LanguageSwitchLink[] {
  const currentLocale = getLocaleFromPath(pathname);
  return locales.map((locale) => ({
    locale,
    label: locale.toUpperCase() as 'DE' | 'EN',
    href: getLocalizedPath(pathname, locale),
    active: locale === currentLocale,
  }));
}
