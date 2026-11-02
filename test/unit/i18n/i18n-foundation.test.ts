import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import { getLocaleFromPath, isLocale, locales } from '../../../src/i18n/locales';
import { getLanguageSwitchLinks, getLocalizedPath, localizedRoutes, routeKeys } from '../../../src/i18n/routes';
import { getNavigation } from '../../../src/i18n/navigation';
import { getMessages } from '../../../src/i18n/messages';
import { englishPages } from '../../../src/i18n/english-pages';

describe('locale parsing', () => {
  it('recognizes supported locales and keeps German as the unprefixed default', () => {
    expect(locales).toEqual(['de', 'en']);
    expect(isLocale('de')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(getLocaleFromPath('/')).toBe('de');
    expect(getLocaleFromPath('/leistungen/beratung')).toBe('de');
    expect(getLocaleFromPath('/en')).toBe('en');
    expect(getLocaleFromPath('/en/services/consulting')).toBe('en');
    expect(getLocaleFromPath('/english')).toBe('de');
  });
});

describe('localized route equivalence', () => {
  it('defines every approved German and English route pair', () => {
    expect(routeKeys).toEqual([
      'home',
      'agentHub',
      'csp',
      'consulting',
      'cloudDevops',
      'development',
      'aiMcp',
      'mcpServers',
      'contact',
      'contactSuccess',
      'legalNotice',
      'privacy',
      'terms',
      'blog',
    ]);
    expect(localizedRoutes.consulting.paths).toEqual({
      de: '/leistungen/beratung',
      en: '/en/services/consulting',
    });
    expect(localizedRoutes.development.paths.en).toBe('/en/services/development');
    expect(localizedRoutes.aiMcp.paths.en).toBe('/en/services/ai-mcp');
    expect(localizedRoutes.mcpServers.paths.en).toBe('/en/projects/mcp-server');
    expect(localizedRoutes.contactSuccess.paths.en).toBe('/en/contact/success');
    expect(localizedRoutes.legalNotice.paths.en).toBe('/en/legal-notice');
    expect(localizedRoutes.privacy.paths.en).toBe('/en/privacy');
    expect(localizedRoutes.terms.paths.en).toBe('/en/terms');
  });

  it('falls back to the locale home when a translation is not published', () => {
    expect(getLocalizedPath('/leistungen/beratung', 'en')).toBe('/en/services/consulting');
    expect(getLocalizedPath('/en/services/consulting', 'de')).toBe('/leistungen/beratung');
    expect(getLocalizedPath('/datenschutz', 'en')).toBe('/en');
    expect(getLocalizedPath('/blog', 'en')).toBe('/en');
    expect(getLocalizedPath('/en/privacy', 'de')).toBe('/datenschutz');
    expect(getLocalizedPath('/unknown', 'en')).toBe('/en');
  });

  it('builds explicit switcher links for the current equivalent route', () => {
    expect(getLanguageSwitchLinks('/en/contact')).toEqual([
      { locale: 'de', label: 'DE', href: '/kontakt', active: false },
      { locale: 'en', label: 'EN', href: '/en/contact', active: true },
    ]);
    expect(getLanguageSwitchLinks('/agb')[1]).toEqual({
      locale: 'en',
      label: 'EN',
      href: '/en',
      active: false,
    });
  });
});

describe('localized static navigation and interface messages', () => {
  it('uses translated English slugs and excludes unpublished English legal and blog links', () => {
    const de = getNavigation('de');
    const en = getNavigation('en');

    expect(de.header.links.at(-1)).toEqual({ text: 'Kontakt', href: '/kontakt' });
    expect(en.header.links).toContainEqual({ text: 'Contact', href: '/en/contact' });
    expect(JSON.stringify(en)).toContain('/en/services/consulting');
    expect(JSON.stringify(en)).not.toContain('/en/blog');
    expect(en.footer.secondaryLinks).toEqual([]);
  });

  it('localizes shared accessibility labels', () => {
    expect(getMessages('de').navigation.main).toBe('Hauptnavigation');
    expect(getMessages('en').navigation.main).toBe('Main navigation');
    expect(getMessages('en').navigation.home).toBe('kieks.me home');
    expect(getMessages('en').navigation.menu).toBe('menu');
    expect(getMessages('en').theme.toggle).toMatch(/color scheme/i);
  });

  it('wires the header to locale-aware labels and switcher props', async () => {
    const source = await readFile(
      new URL('../../../src/components/ui/organisms/Header.astro', import.meta.url),
      'utf8'
    );
    expect(source).toContain('getLanguageSwitchLinks');
    expect(source).toContain('messages.navigation.main');
    expect(source).toContain('aria-current');
    expect(source).toContain('hreflang');
  });
});

describe('English route files', () => {
  it('provides complete English metadata and marketing copy for every published marketing route', () => {
    expect(Object.keys(englishPages)).toEqual([
      'home',
      'agentHub',
      'csp',
      'consulting',
      'cloudDevops',
      'development',
      'aiMcp',
      'mcpServers',
    ]);
    for (const page of Object.values(englishPages)) {
      expect(page.metadata.title.length).toBeGreaterThan(20);
      expect(page.metadata.description.length).toBeGreaterThan(70);
      expect(page.lead.length).toBeGreaterThan(80);
      expect(page.sections.length).toBeGreaterThanOrEqual(2);
      expect(page.sections.every((section) => section.items.length >= 3)).toBe(true);
    }
    expect(englishPages.consulting.title).toContain('Understand first');
    expect(englishPages.aiMcp.primary.href).toBe('/en/contact');
    expect(englishPages.mcpServers.secondary?.href).toBe('https://github.com/kieksme');
  });

  it.each([
    'index.astro',
    'agent-hub.astro',
    'csp.astro',
    'services/consulting.astro',
    'services/cloud-devops.astro',
    'services/development.astro',
    'services/ai-mcp.astro',
    'projects/mcp-server.astro',
    'contact.astro',
    'contact/success.astro',
  ])('publishes /en/%s', async (path) => {
    await expect(readFile(new URL(`../../../src/pages/en/${path}`, import.meta.url), 'utf8')).resolves.toContain(
      'locale="en"'
    );
  });

  it.each(['legal-notice.astro', 'privacy.astro', 'terms.astro', 'blog.astro'])(
    'does not publish /en/%s yet',
    async (path) => {
      await expect(readFile(new URL(`../../../src/pages/en/${path}`, import.meta.url), 'utf8')).rejects.toThrow();
    }
  );
});
