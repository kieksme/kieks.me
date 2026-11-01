/**
 * Site-wide config and open placeholders for kieks.me GbR.
 *
 * Values marked with ⟦PLATZHALTER⟧ / ⟦BESTÄTIGEN⟧ / ⟦ENTSCHEIDUNG⟧ must stay
 * visible until the owners replace or confirm them. Do not invent prices,
 * customers, testimonials, booking links, or domains.
 */

/**
 * ⟦PLATZHALTER: Buchungslink, 30 Minuten⟧
 * Set a real booking URL (Cal.com / Bookings / Calendly) here.
 * Leave empty to fall back to the contact page.
 */
export const BOOKING_URL_CONFIG: string = ''; // ⟦PLATZHALTER: Buchungslink⟧

/** Resolved booking CTA target */
export const BOOKING_URL: string = BOOKING_URL_CONFIG.trim() || '/kontakt';

/** True when a real booking tool URL is configured */
export const HAS_BOOKING_URL = Boolean(BOOKING_URL_CONFIG.trim());

/** ⟦PLATZHALTER: Ziel-URL für CSP — siehe Entscheidung D4⟧ */
export const CSP_CANONICAL_PATH = '/csp';

/** ⟦PLATZHALTER: Demo-URL, z. B. csp-acme⟧ */
export const CSP_DEMO_URL = '⟦PLATZHALTER: Demo-URL, z. B. csp-acme⟧';

/** ⟦PLATZHALTER: Antwortzeit Kontaktformular (Werktage)⟧ */
export const CONTACT_RESPONSE_DAYS = '⟦PLATZHALTER: Anzahl Werktage⟧';

export const CONTACT_EMAIL = 'kontakt@kieks.me';
export const GITHUB_ORG_URL = 'https://github.com/kieksme';
export const SITE_NAME = 'kieks.me';
export const LEGAL_NAME = 'kieks.me GbR';

/** Brand choice (D12): primary/secondary still TBD in brand guide — we use Navy / Navy-400 */
export const BRAND_CHOICES = {
  primary: '#1E2A45', // Navy — used as primary
  secondary: '#2F4169', // Navy 400 — used as secondary
  accent: '#FF008F', // Fuchsia — accent / highlights
  highlight: '#00FFDC', // Aqua — surfaces & accents only (not text on white)
  link: '#006B5F', // Aqua Dark — links on white (WCAG AA)
  logoVariant: 'aqua', // ⟦BESTÄTIGEN: Standard-Logovariante aqua | purple | red⟧
} as const;

export const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: LEGAL_NAME,
  url: 'https://kieks.me',
  logo: 'https://kieks.me/favicon.svg',
  email: CONTACT_EMAIL,
  description: 'AI Consultants aus Leipzig: Skills, MCP-Server, Agents und Agent-Hubs für Unternehmen.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Hardenbergstraße 48',
    addressLocality: 'Leipzig',
    postalCode: '04275',
    addressCountry: 'DE',
  },
  sameAs: [GITHUB_ORG_URL],
  makesOffer: [
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Agent-Hub',
        description:
          'Interner Agent-Hub: geprüfte Skills, MCP-Server und Agents mit Review-Gate, Versionierung und Richtlinien.',
        url: 'https://kieks.me/agent-hub',
        provider: {
          '@type': 'Organization',
          name: LEGAL_NAME,
          url: 'https://kieks.me',
        },
      },
    },
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'KI & MCP',
        description:
          'Skills, MCP-Server und Agents für KI-Assistenten, nachvollziehbar und mit klaren Zugriffsrechten.',
        url: 'https://kieks.me/leistungen/ki-mcp',
        provider: {
          '@type': 'Organization',
          name: LEGAL_NAME,
          url: 'https://kieks.me',
        },
      },
    },
  ],
} as const;
