#!/usr/bin/env node
/**
 * Regenerate public/og.png from scripts/og-image.svg.
 *
 * Uses `rsvg-convert` (librsvg) — a small, dependency-free system tool — to keep
 * the OG image out of the npm dependency tree. Install it once if missing:
 *   macOS:        brew install librsvg
 *   Debian/Ubuntu: apt-get install librsvg2-bin
 *
 * Usage: pnpm og
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = `${ROOT}scripts/og-image.svg`;
const OUT = `${ROOT}public/og.png`;
const WIDTH = 1200;
const HEIGHT = 630;

if (!existsSync(SRC)) {
  console.error(`✗ Missing source SVG: ${SRC}`);
  process.exit(1);
}

const result = spawnSync(
  'rsvg-convert',
  ['-w', String(WIDTH), '-h', String(HEIGHT), SRC, '-o', OUT],
  { stdio: ['ignore', 'inherit', 'inherit'] },
);

if (result.error?.code === 'ENOENT') {
  console.error(
    '✗ `rsvg-convert` not found. Install librsvg, then re-run `pnpm og`:\n' +
      '    macOS:         brew install librsvg\n' +
      '    Debian/Ubuntu: sudo apt-get install librsvg2-bin',
  );
  process.exit(1);
}
if (result.status !== 0) {
  console.error('✗ rsvg-convert failed.');
  process.exit(result.status ?? 1);
}

console.log(`✓ Wrote ${OUT} (${WIDTH}x${HEIGHT}) from ${SRC}`);
