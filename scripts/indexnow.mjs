#!/usr/bin/env node
/**
 * Submit the built site's URLs to IndexNow (Bing, Yandex, and others — this is
 * what feeds Bing-backed answer engines like ChatGPT Search / Copilot).
 *
 * Reads the URL list from ./dist/sitemap-0.xml and the key from the hosted key
 * file in ./public (named <key>.txt, content = key). Run AFTER a production
 * build/deploy of the real domain:
 *   SITE_URL=https://xcsteward.com pnpm build && pnpm indexnow
 *
 * No-ops with a clear message if dist or the key file is missing.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const sitemap = join(ROOT, 'dist', 'sitemap-0.xml');
const publicDir = join(ROOT, 'public');

if (!existsSync(sitemap)) {
  console.error('✗ dist/sitemap-0.xml not found. Run `pnpm build` first.');
  process.exit(1);
}

const keyFile = readdirSync(publicDir).find((f) => /^[a-f0-9]{8,128}\.txt$/.test(f));
if (!keyFile) {
  console.error('✗ No IndexNow key file (public/<hex>.txt) found.');
  process.exit(1);
}
const key = keyFile.replace(/\.txt$/, '');

const xml = readFileSync(sitemap, 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) {
  console.error('✗ No <loc> URLs in sitemap.');
  process.exit(1);
}

const host = new URL(urlList[0]).host;
const keyLocation = `https://${host}/${keyFile}`;

if (host.endsWith('xcsteward.dev') || host.includes('example')) {
  console.error(
    `✗ Refusing to submit ${host} — build with the real SITE_URL first ` +
      '(SITE_URL=https://xcsteward.com pnpm build).',
  );
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});

console.log(`IndexNow: submitted ${urlList.length} URLs for ${host} → HTTP ${res.status}`);
// 200 = accepted, 202 = accepted/pending. Anything else is worth a look.
if (res.status !== 200 && res.status !== 202) {
  console.error(`✗ Unexpected status. Body: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
console.log('✓ Done.');
