// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// IMPORTANT: update `site` to the real production domain before deploying.
// It is used for canonical URLs, Open Graph tags, and the sitemap.
// Override at build time with: SITE_URL=https://example.com pnpm build
const SITE_URL = process.env.SITE_URL ?? 'https://xcsteward.com';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    // Emit /failures/foo/index.html so pretty URLs work on any static host.
    format: 'directory',
  },
});
