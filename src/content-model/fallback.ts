// Static fallback content. This is the single source for the Pop-Art pages when the CMS is not configured
// (or a collection has no published documents). Text is kept verbatim from the previous page-local arrays.
import type { SiteServiceView, SiteFaqView, SiteMcpServerView, SiteOtherProjectView } from './site-content';

export const fallbackServices: SiteServiceView[] = [
  {
    num: '01',
    title: 'Agent-Hub',
    description:
      'Ein zentraler, geprüfter Ort für alle Skills, MCP-Server und Agents in Ihrem Unternehmen. Mit Review-Prozess, Versionierung und klaren Regeln, was auf Entwicklerrechner gelangt.',
    href: '/agent-hub',
    linkText: 'Mehr zum Agent-Hub',
    headColor: 'aqua' as const,
    shadow: 'ink' as const,
    numShadow: 'fuchsia' as const,
  },
  {
    num: '02',
    title: 'KI & MCP',
    description:
      'Skills, MCP-Server und Agents: Wir binden KI-Assistenten an Ihre Systeme und Daten an, nachvollziehbar und mit klaren Zugriffsrechten.',
    href: '/leistungen/ki-mcp',
    linkText: 'Mehr zu KI & MCP',
    headColor: 'fuchsia' as const,
    shadow: 'ink' as const,
    numShadow: 'aqua' as const,
  },
  {
    num: '03',
    title: 'Cloud & DevOps',
    description: 'Infrastruktur als Code, automatisierte Builds und Deployments, verlässlicher Betrieb.',
    href: '/leistungen/cloud-devops',
    linkText: 'Mehr zu Cloud & DevOps',
    headColor: 'purple' as const,
    shadow: 'ink' as const,
    numShadow: 'fuchsia' as const,
    numColor: '#fff',
  },
  {
    num: '04',
    title: 'Web- & Softwareentwicklung',
    description: 'Websites, Webanwendungen und Schnittstellen, neu entwickelt oder gezielt weiterentwickelt.',
    href: '/leistungen/entwicklung',
    linkText: 'Mehr zur Entwicklung',
    headColor: 'yellow' as const,
    shadow: 'fuchsia' as const,
    numShadow: 'fuchsia' as const,
  },
  {
    num: '05',
    title: 'Beratung & Workshops',
    description: 'Gemeinsam klären, was sich lohnt, bevor die erste Zeile Code entsteht.',
    href: '/leistungen/beratung',
    linkText: 'Mehr zu Beratung',
    headColor: 'aqua' as const,
    shadow: 'ink' as const,
    numShadow: 'fuchsia' as const,
  },
];

export const fallbackHomeProjects = [
  { name: 'mcp-server · contabo', href: 'https://github.com/kieksme', color: 'aqua' as const },
  { name: 'mcp-server · swetrix', href: 'https://github.com/kieksme', color: 'fuchsia' as const },
  { name: 'mcp-server · listmonk', href: 'https://github.com/kieksme', color: 'yellow' as const },
  { name: 'mcp-server · balena', href: 'https://github.com/kieksme', color: 'purple' as const },
];

export const fallbackFaqsLeft: SiteFaqView[] = [
  {
    title: 'Warum kieks.me und nicht eine andere Agentur?',
    body: 'Bei uns arbeiten Sie direkt mit den Gesellschaftern, ohne Zwischenstationen. Offenheit, Ehrlichkeit und Transparenz sind für uns keine Schlagworte: Wir sagen Ihnen auch, wenn sich etwas nicht lohnt. Und Sie erhalten am Ende Code und Dokumentation, mit denen Ihr Team oder ein anderer Dienstleister weiterarbeiten kann.',
    color: 'aqua' as const,
  },
  {
    title: 'Für welche Unternehmen arbeiten Sie?',
    body: 'Vor allem für mittelständische Unternehmen und IT-Dienstleister, die ihre Software, ihre Systemlandschaft oder ihren Support pragmatisch verbessern möchten. ⟦BESTÄTIGEN: Zielgruppe⟧',
    color: 'fuchsia' as const,
  },
  {
    title: 'Was brauchen Sie von uns für den Start?',
    body: 'Ein Ziel, eine Ansprechperson und Zugang zu den Informationen, um die es geht: Systeme, Abläufe, Zielgruppe. Den Rest klären wir im Erstgespräch.',
    color: 'yellow' as const,
  },
  {
    title: 'Wie lange dauert ein Projekt?',
    body: 'Das hängt vom Umfang ab. Eine Website setzen wir in der Regel in 4 bis 8 Wochen um ⟦BESTÄTIGEN: bisherige Angabe⟧. Für größere Vorhaben nennen wir Ihnen nach dem Erstgespräch einen realistischen Zeitrahmen.',
    color: 'purple' as const,
  },
];

export const fallbackFaqsRight: SiteFaqView[] = [
  {
    title: 'Was kostet das?',
    body: 'Auch das hängt vom Umfang ab. Sie erhalten ein schriftliches Angebot, bevor Kosten entstehen. Eine Website kostet in der Regel zwischen 1.000 und 10.000 Euro ⟦BESTÄTIGEN: bisherige Angabe, noch aktuell?⟧. Alle Preise verstehen sich netto zuzüglich der gesetzlichen Umsatzsteuer.',
    color: 'aqua' as const,
  },
  {
    title: 'Wer pflegt die Lösung danach?',
    body: 'Ganz wie Sie möchten. Sie können selbst weitermachen, wir schulen Ihr Team dafür. Oder wir übernehmen die Pflege im Rahmen eines Wartungsvertrags ⟦BESTÄTIGEN: Wartungsangebot existiert⟧.',
    color: 'fuchsia' as const,
  },
  {
    title: 'Was passiert, wenn Sie nicht zufrieden sind?',
    body: 'Dann sprechen wir offen darüber und bessern im vereinbarten Umfang nach. Damit es gar nicht so weit kommt, stimmen wir Zwischenstände regelmäßig mit Ihnen ab. ⟦BESTÄTIGEN: Einschränkung gegenüber unbegrenztem Nachbesserungsversprechen⟧',
    color: 'yellow' as const,
  },
];

export const fallbackMcpServers: SiteMcpServerView[] = [
  {
    name: 'Contabo MCP',
    description:
      'Contabo per MCP-Client verwalten: VPS/VDS, Images, Snapshots, Firewalls, private Netze, DNS, S3-kompatibler Object Storage, Secrets, Domains und Tags.',
    npm: '@kieksme/contabo-mcp',
    license: 'GPL-3.0',
    url: 'https://github.com/kieksme/mcp-contabo',
  },
  {
    name: 'Swetrix MCP',
    description:
      'MCP-Server für die Analyseplattform Swetrix. KI-Assistenten fragen Analysedaten ab, erfassen Ereignisse und verwalten Projekte direkt über die Swetrix-API. Drei Pakete: Statistik, Events und Admin.',
    npm: '@kieksme/swetrix-statistics-mcp, @kieksme/swetrix-events-mcp, @kieksme/swetrix-admin-mcp',
    license: 'GPL-3.0',
    url: 'https://github.com/kieksme/mcp-swetrix',
  },
  {
    name: 'Hashnode MCP',
    description:
      'MCP-Server für die Hashnode-GraphQL-API: Entwürfe anlegen, Beiträge veröffentlichen, den eigenen Blog verwalten. Hinweis laut README: Die Hashnode-API erfordert seit Mai 2026 einen Pro-Plan.',
    npm: '@kieksme/hashnode-mcp',
    license: '⟦PLATZHALTER: auf GitHub keine Lizenz hinterlegt⟧',
    url: 'https://github.com/kieksme/mcp-hashnode',
  },
  {
    name: 'Listmonk MCP',
    description:
      'Deckt die vollständige REST-API des Newsletter-Systems Listmonk ab, laut README 72 Werkzeuge in 14 Kategorien. Lokal über stdio oder als Remote-Server über Streamable HTTP.',
    npm: '@kieksme/listmonk-mcp',
    license: 'MIT',
    url: 'https://github.com/kieksme/mcp-listmonk',
  },
  {
    name: 'Balena MCP',
    description:
      'Balena-Flotten und -Geräte verwalten: Releases, Variablen, Tags, Teams und Organisationen. Lokal über stdio oder remote über tokengeschütztes Streamable HTTP.',
    npm: '@kieksme/balena-mcp',
    license: 'GPL-3.0',
    url: 'https://github.com/kieksme/mcp-balena',
  },
  {
    name: 'Enhancv MCP',
    description:
      'Enhancv-Lebensläufe aus jedem MCP-Client verwalten: auflisten, lesen, anlegen, hochladen, als PDF exportieren, duplizieren und löschen.',
    npm: '@kieksme/enhancv-mcp',
    license: 'GPL-3.0',
    url: 'https://github.com/kieksme/mcp-enhancv',
  },
  {
    name: 'MCP HTTP Kit',
    description:
      'Gemeinsame Basis für unsere MCP-Server: Streamable-HTTP-Transport, Authentifizierung (Bearer-Token und OAuth-2.1-Resource-Server) und Deploy-Werkzeuge.',
    npm: '@kieksme/mcp-http-kit',
    license: 'MIT',
    url: 'https://github.com/kieksme/mcp-http-kit',
  },
];

export const fallbackOtherProjects: SiteOtherProjectView[] = [
  {
    name: 'Agent Skills',
    description:
      'Katalog von Agent-Skills der kieks.me GbR, z. B. als Plugin-Bundles für Claude Code (Frontend, Plattform, Daten).',
    url: 'https://github.com/kieksme/skills',
    extra: 'https://kieksme.github.io/skills/',
  },
  {
    name: 'Astro Analytics',
    description: 'VS-Code-Erweiterung, die GA4-Kennzahlen direkt an Astro- und Markdown-Dateien anzeigt.',
    url: 'https://github.com/kieksme/astro-analytics',
  },
  {
    name: 'CSP',
    description: 'Customer Service Portal, Open Source unter MIT',
    url: 'https://github.com/kieksme/csp',
    page: '/csp',
  },
];

export const fallbackTeam = [
  {
    slug: 'andre',
    name: 'André Lademann',
    label: 'andré',
    imageAlt: 'André Lademann, Gesellschafter der kieks.me GbR',
    role: '⟦PLATZHALTER D10: Rolle und 1–2 Sätze, selbst formuliert⟧',
  },
  {
    slug: 'thomas',
    name: 'Thomas Schöne',
    label: 'thomas',
    imageAlt: 'Thomas Schöne, Gesellschafter der kieks.me GbR',
    role: '⟦PLATZHALTER D10: Rolle und 1–2 Sätze, selbst formuliert⟧',
  },
];
