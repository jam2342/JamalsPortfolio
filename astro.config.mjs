// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

/**
 * Two deploy targets from one codebase.
 *
 * Vercel builds with no env vars set and serves from the domain root.
 * GitHub Pages serves from /<repo>/, so the Pages workflow sets BASE_PATH
 * and SITE_URL. Leaving base undefined (rather than '/') keeps Vercel's
 * output byte-identical to before.
 */
const base = process.env.BASE_PATH || undefined;
const site = process.env.SITE_URL || 'https://portfolio-wine-three-iox2jn0bx6.vercel.app';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [sitemap()],
});
