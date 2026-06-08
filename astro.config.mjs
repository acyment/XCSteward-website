// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Production domain. Override at build time: SITE_URL=https://staging pnpm build
const SITE_URL = process.env.SITE_URL ?? 'https://xcsteward.com';

// Build a map of /failures/<slug>/ -> ISO date from each page's `updated`
// frontmatter, so the sitemap carries accurate per-page lastmod (a freshness
// signal for crawlers and answer engines). Falls back to the newest date for
// pages without their own frontmatter (home, /beta/, /failures/).
const failuresDir = fileURLToPath(new URL('./src/content/failures', import.meta.url));
const lastmodByPath = new Map();
let newestIso = new Date(0).toISOString();
for (const file of readdirSync(failuresDir)) {
  if (!file.endsWith('.md')) continue;
  const raw = readFileSync(`${failuresDir}/${file}`, 'utf8');
  const m = raw.match(/^updated:\s*(.+)$/m);
  if (!m) continue;
  const iso = new Date(m[1].trim()).toISOString();
  lastmodByPath.set(`/failures/${file.replace(/\.md$/, '')}/`, iso);
  if (iso > newestIso) newestIso = iso;
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'ignore',
  // The alpha/reporting page lives at /try/ (stage-agnostic, evergreen). The
  // old /beta/ URL is kept alive as a redirect so shared links never 404.
  redirects: {
    '/beta': '/try',
    '/beta/': '/try/',
  },
  integrations: [
    sitemap({
      // Keep the /beta redirect stub out of the sitemap; /try/ is canonical.
      filter: (page) => !/\/beta\/?$/.test(new URL(page).pathname),
      serialize(item) {
        const { pathname } = new URL(item.url);
        item.lastmod = lastmodByPath.get(pathname) ?? newestIso;
        return item;
      },
    }),
  ],
  build: {
    // Emit /failures/foo/index.html so pretty URLs work on any static host.
    format: 'directory',
  },
});
