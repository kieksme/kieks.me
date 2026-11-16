export type Locale = 'de' | 'en';

/**
 * Leitet die Sprache aus dem URL-Pfad ab: `/en` und `/en/...` sind Englisch,
 * alles andere Deutsch (Default-Sprache der Seite).
 */
export const localeFromPath = (pathname: string): Locale =>
  pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'de';
