import shared from '../tailwind.config.js';
import { fileURLToPath } from 'node:url';
// Resolve shared component classes from this subproject instead of cwd/src only.
export default {
  ...shared,
  content: [
    `${fileURLToPath(new URL('../src', import.meta.url))}/**/*.{astro,html,js,jsx,ts,tsx}`,
    `${fileURLToPath(new URL('./src', import.meta.url))}/**/*.{astro,html,js,jsx,ts,tsx}`,
  ],
};
