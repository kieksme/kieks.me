import { BOOKING_URL, GITHUB_ORG_URL } from '../config/site';
import type { Locale } from './locales';
import { getLocalizedPath, localizedRoutes } from './routes';

const bookingUrl = (locale: Locale) =>
  BOOKING_URL.startsWith('/') ? getLocalizedPath(BOOKING_URL, locale) : BOOKING_URL;

const navigation = {
  de: {
    header: {
      links: [
        {
          text: 'Leistungen',
          links: [
            { text: 'Agent-Hub', href: localizedRoutes.agentHub.paths.de },
            { text: 'KI & MCP', href: localizedRoutes.aiMcp.paths.de },
            { text: 'Cloud & DevOps', href: localizedRoutes.cloudDevops.paths.de },
            { text: 'Web- & Softwareentwicklung', href: localizedRoutes.development.paths.de },
            { text: 'Beratung & Workshops', href: localizedRoutes.consulting.paths.de },
          ],
        },
        { text: 'MCP-Server', href: localizedRoutes.mcpServers.paths.de },
        { text: 'CSP', href: localizedRoutes.csp.paths.de },
        { text: 'Blog', href: localizedRoutes.blog.paths.de },
        { text: 'Kontakt', href: localizedRoutes.contact.paths.de },
      ],
      actions: [{ variant: 'primary' as const, text: 'Erstgespräch buchen', href: bookingUrl('de') }],
    },
    footer: {
      links: [
        {
          title: 'Leistungen',
          links: [
            { text: 'Agent-Hub', href: localizedRoutes.agentHub.paths.de },
            { text: 'KI & MCP', href: localizedRoutes.aiMcp.paths.de },
            { text: 'Cloud & DevOps', href: localizedRoutes.cloudDevops.paths.de },
            { text: 'Web- & Softwareentwicklung', href: localizedRoutes.development.paths.de },
            { text: 'Beratung & Workshops', href: localizedRoutes.consulting.paths.de },
          ],
        },
        {
          title: 'Projekte',
          links: [
            { text: 'MCP-Server', href: localizedRoutes.mcpServers.paths.de },
            { text: 'Open Source auf GitHub', href: GITHUB_ORG_URL },
          ],
        },
        { title: 'Produkt', links: [{ text: 'CSP', href: localizedRoutes.csp.paths.de }] },
        {
          title: 'Unternehmen',
          links: [
            { text: 'Kontakt', href: localizedRoutes.contact.paths.de },
            { text: 'Erstgespräch buchen', href: bookingUrl('de') },
          ],
        },
      ],
      secondaryLinks: [
        { text: 'Datenschutzerklärung', href: localizedRoutes.privacy.paths.de },
        { text: 'AGB', href: localizedRoutes.terms.paths.de },
        { text: 'Impressum', href: localizedRoutes.legalNotice.paths.de },
      ],
      socialLinks: [{ text: 'GitHub', icon: 'tabler:brand-github', href: GITHUB_ORG_URL }],
      footNote: `© ${new Date().getFullYear()} kieks.me GbR · Leipzig`,
    },
  },
  en: {
    header: {
      links: [
        {
          text: 'Services',
          links: [
            { text: 'Agent Hub', href: localizedRoutes.agentHub.paths.en },
            { text: 'AI & MCP', href: localizedRoutes.aiMcp.paths.en },
            { text: 'Cloud & DevOps', href: localizedRoutes.cloudDevops.paths.en },
            { text: 'Web & Software Development', href: localizedRoutes.development.paths.en },
            { text: 'Consulting & Workshops', href: localizedRoutes.consulting.paths.en },
          ],
        },
        { text: 'MCP Servers', href: localizedRoutes.mcpServers.paths.en },
        { text: 'CSP', href: localizedRoutes.csp.paths.en },
        { text: 'Contact', href: localizedRoutes.contact.paths.en },
      ],
      actions: [{ variant: 'primary' as const, text: 'Book a consultation', href: bookingUrl('en') }],
    },
    footer: {
      links: [
        {
          title: 'Services',
          links: [
            { text: 'Agent Hub', href: localizedRoutes.agentHub.paths.en },
            { text: 'AI & MCP', href: localizedRoutes.aiMcp.paths.en },
            { text: 'Cloud & DevOps', href: localizedRoutes.cloudDevops.paths.en },
            { text: 'Web & Software Development', href: localizedRoutes.development.paths.en },
            { text: 'Consulting & Workshops', href: localizedRoutes.consulting.paths.en },
          ],
        },
        {
          title: 'Projects',
          links: [
            { text: 'MCP Servers', href: localizedRoutes.mcpServers.paths.en },
            { text: 'Open source on GitHub', href: GITHUB_ORG_URL },
          ],
        },
        { title: 'Product', links: [{ text: 'CSP', href: localizedRoutes.csp.paths.en }] },
        {
          title: 'Company',
          links: [
            { text: 'Contact', href: localizedRoutes.contact.paths.en },
            { text: 'Book a consultation', href: bookingUrl('en') },
          ],
        },
      ],
      secondaryLinks: [],
      socialLinks: [{ text: 'GitHub', icon: 'tabler:brand-github', href: GITHUB_ORG_URL }],
      footNote: `© ${new Date().getFullYear()} kieks.me GbR · Leipzig, Germany`,
    },
  },
} as const;

export function getNavigation(locale: Locale) {
  return navigation[locale];
}
