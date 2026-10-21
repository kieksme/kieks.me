import { getPermalink } from './utils/permalinks';
import { BOOKING_URL, GITHUB_ORG_URL } from './config/site';

export const headerData = {
  links: [
    {
      text: 'Leistungen',
      links: [
        { text: 'KI & MCP', href: getPermalink('/leistungen/ki-mcp') },
        { text: 'Cloud & DevOps', href: getPermalink('/leistungen/cloud-devops') },
        { text: 'Web- & Softwareentwicklung', href: getPermalink('/leistungen/entwicklung') },
        { text: 'Beratung & Workshops', href: getPermalink('/leistungen/beratung') },
      ],
    },
    { text: 'MCP-Server', href: getPermalink('/projekte/mcp-server') },
    { text: 'CSP', href: getPermalink('/csp') },
    { text: 'Kontakt', href: getPermalink('/kontakt') },
  ],
  actions: [{ text: 'Erstgespräch buchen', href: BOOKING_URL }],
};

export const footerData = {
  links: [
    {
      title: 'Leistungen',
      links: [
        { text: 'KI & MCP', href: getPermalink('/leistungen/ki-mcp') },
        { text: 'Cloud & DevOps', href: getPermalink('/leistungen/cloud-devops') },
        { text: 'Web- & Softwareentwicklung', href: getPermalink('/leistungen/entwicklung') },
        { text: 'Beratung & Workshops', href: getPermalink('/leistungen/beratung') },
      ],
    },
    {
      title: 'Projekte',
      links: [
        { text: 'MCP-Server', href: getPermalink('/projekte/mcp-server') },
        { text: 'Open Source auf GitHub', href: GITHUB_ORG_URL },
      ],
    },
    {
      title: 'Produkt',
      links: [{ text: 'CSP', href: getPermalink('/csp') }],
    },
    {
      title: 'Unternehmen',
      links: [
        { text: 'Kontakt', href: getPermalink('/kontakt') },
        { text: 'Erstgespräch buchen', href: BOOKING_URL },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Datenschutzerklärung', href: getPermalink('/datenschutz') },
    { text: 'AGB', href: getPermalink('/agb') },
    { text: 'Impressum', href: getPermalink('/impressum') },
  ],
  socialLinks: [{ ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: GITHUB_ORG_URL }],
  footNote: `© ${new Date().getFullYear()} kieks.me GbR · Leipzig`,
};
