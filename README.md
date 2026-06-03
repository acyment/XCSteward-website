# XCSteward website

The public static site for [XCSteward](https://github.com/acyment/XCSteward) — an
open-source, local-first macOS tool for making XCTest / `xcodebuild` / iOS
Simulator test execution more predictable.

It is a small, fast, static [Astro](https://astro.build/) site:

- a landing page that is honest about what XCSteward does and does not do, and
- a hand-written **failure-mode library** of real, symptom-based writeups.

## Stack

- **Astro 5** with **TypeScript** (strict), static output.
- **Content collections** (`src/content/failures/*.md`) with typed, validated
  frontmatter (`src/content.config.ts`).
- Plain, hand-written **CSS** (`src/styles/global.css`) — no UI framework, no
  client-side JS. Dark mode via `prefers-color-scheme`.
- `@astrojs/sitemap` for `sitemap-index.xml`.

## Prerequisites

- Node.js 20+ (built with Node 22).
- npm 10+.

## Commands

```sh
npm install        # install dependencies

npm run dev        # local dev server with HMR (http://localhost:4321)
npm run build      # type-sync + production build into ./dist
npm run preview    # serve the built ./dist locally to verify the static output
npm run check      # astro check — TypeScript + template diagnostics (0 errors expected)
```

There is no separate test suite yet; `npm run check` (type/template validation)
and a clean `npm run build` are the gate for "does this work".

## Configuration

The production domain is used for canonical URLs, Open Graph tags, the sitemap,
and `robots.txt`. **Update it before deploying.**

- Edit `site` in [`astro.config.mjs`](./astro.config.mjs), or override per build:

  ```sh
  SITE_URL=https://your-domain.example npm run build
  ```

- Update the `Sitemap:` line in [`public/robots.txt`](./public/robots.txt) to match.

Site-wide constants (repo URL, issue link, author) live in
[`src/config.ts`](./src/config.ts).

## Project layout

```text
src/
  config.ts                 # site-wide constants (repo URL, nav, author)
  content.config.ts         # failures collection + typed frontmatter schema
  content/failures/*.md     # one file per failure-mode page
  layouts/BaseLayout.astro  # head, header, footer, skip link
  components/               # Seo, Hero, Button, Cta, FailureCard, FitList,
                            #   FitBadge, Callout — small and boring on purpose
  pages/
    index.astro             # landing page
    failures/index.astro    # failure-mode library index
    failures/[...slug].astro# renders each failure page from the collection
  styles/global.css         # all styling (CSS custom properties + light/dark)
public/
  favicon.svg
  robots.txt
```

## Adding a failure-mode page

1. Create `src/content/failures/<slug>.md`. The file name becomes the URL
   (`/failures/<slug>/`).
2. Fill in the frontmatter — it is validated against the schema in
   `src/content.config.ts`, so the build fails fast if a field is missing or the
   wrong shape:

   ```yaml
   ---
   title: '...'              # 10–70 chars; page <title> and H1
   description: '...'        # 50–200 chars; meta + OG description
   symptom: '...'            # 20–200 chars; card + page lede
   failureClass: '...'       # short label shown on cards
   fit: strong               # strong | partial | out-of-scope
   fitNote: 'Strong fit'     # human label for the fit badge
   queries: ['...']          # real, symptom-based search phrases
   related: ['other-slug']   # internal links to related failures
   order: 70                 # sort order in the library index
   updated: 2026-06-03
   draft: false              # set true to hide without deleting
   ---
   ```

3. Write the body as Markdown using the standard sections: **Symptom**, **What it
   usually looks like**, **Why it happens / likely failure classes**, **Quick
   checks**, **Manual mitigations**, **When XCSteward may help**, **When
   XCSteward probably will not help**. The "Related failure modes" section and
   the call-to-action are rendered automatically from frontmatter.
4. Keep the language cautious — prefer *"may help"*, *"can reduce"*, *"is worth
   testing against"*. Avoid *"fixes"*, *"solves"*, *"eliminates"* unless proven.
5. Run `npm run check && npm run build`.

## Deployment

`npm run build` emits a fully static `./dist` (pretty directory URLs) that can be
served by any static host (GitHub Pages, Cloudflare Pages, Netlify, etc.). Set
`SITE_URL` to the real domain at build time.
