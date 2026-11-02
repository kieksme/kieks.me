import type { Locale } from './locales';

const messages = {
  de: {
    navigation: {
      main: 'Hauptnavigation',
      home: 'kieks.me Startseite',
      menu: 'Menü',
      languages: 'Sprachauswahl',
      social: 'Soziale Netzwerke',
    },
    theme: { toggle: 'Farbschema wechseln' },
  },
  en: {
    navigation: {
      main: 'Main navigation',
      home: 'kieks.me home',
      menu: 'menu',
      languages: 'Language selection',
      social: 'Social networks',
    },
    theme: { toggle: 'Toggle color scheme' },
  },
} as const;

export type Messages = (typeof messages)[Locale];

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
