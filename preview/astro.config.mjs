import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  publicDir: './empty-public',
  server: { host: '127.0.0.1', port: 4330 },
  build: { assetsPrefix: '/preview-assets' },
  integrations: [
    tailwind({ applyBaseStyles: false, configFile: fileURLToPath(new URL('./tailwind.config.mjs', import.meta.url)) }),
  ],
  vite: {
    build: { assetsInlineLimit: 0 },
    resolve: { alias: { '~': fileURLToPath(new URL('../src', import.meta.url)) } },
  },
  security: { checkOrigin: false }, // This internal endpoint authenticates raw signed requests, never browser cookies.
});
