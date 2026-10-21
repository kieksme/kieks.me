import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';
import typographyPlugin from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,json,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--aw-color-primary)',
        secondary: 'var(--aw-color-secondary)',
        accent: 'var(--aw-color-accent)',
        default: 'var(--aw-color-text-default)',
        muted: 'var(--aw-color-text-muted)',
        aqua: {
          DEFAULT: '#00FFDC',
          50: '#E6FFFC',
          100: '#B3FFF5',
          500: '#00FFDC',
          600: '#00BFA5',
          700: '#006B5F',
        },
        navy: {
          DEFAULT: '#1E2A45',
          50: '#F0F2F5',
          100: '#E1E5EB',
          300: '#5A6B8C',
          400: '#2F4169',
          500: '#1E2A45',
        },
        fuchsia: {
          DEFAULT: '#FF008F',
          50: '#FFE6F5',
          100: '#FFCCEB',
          500: '#FF008F',
          600: '#BF006B',
          700: '#800047',
        },
        yellow: {
          DEFAULT: '#FFD60A',
          50: '#FFF8D6',
          500: '#FFD60A',
        },
        purple: {
          DEFAULT: '#9747FF',
          deep: '#7B2FF7',
          500: '#9747FF',
        },
        red: {
          DEFAULT: '#E8202A',
          500: '#E8202A',
        },
        pop: {
          page: 'var(--pop-page-bg)',
          surface: 'var(--pop-surface)',
          hero: 'var(--pop-hero-bg)',
          band: 'var(--pop-band-bg)',
          footer: 'var(--pop-footer-bg)',
          ink: 'var(--pop-ink)',
        },
      },
      fontFamily: {
        sans: ['var(--aw-font-sans, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
        serif: ['var(--aw-font-serif, ui-serif)', ...defaultTheme.fontFamily.serif],
        heading: ['var(--aw-font-heading, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
      },

      animation: {
        fade: 'fadeInUp 1s both',
        'fade-in': 'fadeIn 0.8s both',
        'slide-up': 'slideUp 0.7s both',
      },

      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(2rem)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(1rem)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    typographyPlugin,
    plugin(({ addVariant }) => {
      addVariant('intersect', '&:not([no-intersect])');
    }),
  ],
  darkMode: 'class',
};
