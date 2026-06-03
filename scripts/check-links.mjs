#!/usr/bin/env node
/**
 * Internal link checker for the built site.
 *
 * Scans every .html file in ./dist, collects internal links (href / src that
 * start with "/"), and verifies each one resolves to a real file in dist. When
 * a link has a #fragment, it also checks the target page has a matching id.
 *
 * Usage: pnpm build && pnpm lint:links
 * Exits non-zero if any internal link is broken.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error('✗ dist/ not found. Run `pnpm build` first.');
  process.exit(1);
}

/** Recursively list files under a directory. */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => {
      const full = join(dir, e.name);
      return e.isDirectory() ? walk(full) : Promise.resolve([full]);
    }),
  );
  return files.flat();
}

/** Map a URL pathname to the file that should serve it, or null if none. */
function resolvePath(pathname) {
  const clean = decodeURIComponent(pathname).replace(/\/+$/, '') || '/';
  const candidates =
    clean === '/'
      ? ['index.html']
      : [
          `${clean}/index.html`,
          `${clean}.html`,
          clean, // exact file, e.g. /robots.txt, /favicon.svg
        ];
  for (const rel of candidates) {
    const file = join(DIST, rel.replace(/^\//, ''));
    if (existsSync(file)) return file;
  }
  return null;
}

const HREF_RE = /(?:href|src)\s*=\s*"([^"]+)"/gi;
const ID_RE = /\sid\s*=\s*"([^"]+)"/gi;

// Cache of ids per resolved file so we only parse each page once.
const idCache = new Map();
async function idsFor(file) {
  if (idCache.has(file)) return idCache.get(file);
  const html = await readFile(file, 'utf8');
  const ids = new Set();
  for (const m of html.matchAll(ID_RE)) ids.add(m[1]);
  idCache.set(file, ids);
  return ids;
}

const htmlFiles = (await walk(DIST)).filter((f) => f.endsWith('.html'));
const problems = [];
let linkCount = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = file.slice(DIST.length);
  for (const m of html.matchAll(HREF_RE)) {
    const raw = m[1].trim();
    // Only internal absolute paths. Skip external, anchors, and protocols.
    if (!raw.startsWith('/') || raw.startsWith('//')) continue;
    linkCount++;
    const [path, fragment] = raw.split('#');
    const target = resolvePath(path);
    if (!target) {
      problems.push(`${rel}: → ${raw} (no file for ${path})`);
      continue;
    }
    if (fragment && target.endsWith('.html')) {
      const ids = await idsFor(target);
      if (!ids.has(fragment)) {
        problems.push(`${rel}: → ${raw} (no #${fragment} on target page)`);
      }
    }
  }
}

console.log(
  `Checked ${linkCount} internal link(s) across ${htmlFiles.length} page(s).`,
);
if (problems.length) {
  console.error(`\n✗ ${problems.length} broken internal link(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('✓ No broken internal links.');
