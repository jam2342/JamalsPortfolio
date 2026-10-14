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

/**
 * The site used to be multi-page. Every old URL now lands on the matching node
 * of the map, so links already out there (résumé, applications) keep working.
 */
const redirects = {
  '/work': '/',
  '/work/frcmob': '/#frcmob',
  '/work/hardening': '/#hardening',
  '/work/cryptography': '/#crypto',
  '/work/eaglets': '/#eaglets',
  '/work/frc5417': '/#frc5417',
  '/work/notetaker': '/#notetaker',
  '/work/avmac': '/#avmac',
  '/research': '/#ee',
  '/experience': '/#about',
  '/about': '/#about',
  '/contact': '/#contact',
};

// https://astro.build/config
export default defineConfig({
  site,
  base,
  redirects,
  integrations: [sitemap()],
});
