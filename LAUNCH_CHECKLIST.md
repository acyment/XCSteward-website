# Launch checklist

Concise, ordered steps to take the site live and start beta recruitment.

## Build & verify

- [ ] Decide the production domain.
- [ ] Set `SITE_URL=https://REAL_DOMAIN` (host env var, or inline on the build).
- [ ] `pnpm verify` — check + build + internal-link audit all pass.
- [ ] `pnpm og` — only if `scripts/og-image.svg` (text/logo) changed; commit `public/og.png`.
- [ ] `SITE_URL=https://REAL_DOMAIN pnpm build` — production build.
- [ ] `pnpm preview` — review the built `./dist` locally.

## Local smoke (in `pnpm preview`)

- [ ] `/` loads and looks right (light + dark).
- [ ] `/failures/` lists all six cards.
- [ ] One failure page reads correctly (e.g. `/failures/coresimulatorservice-deadlock/`).
- [ ] `/sitemap-index.xml` → `/sitemap-0.xml` lists every page.
- [ ] `/robots.txt` `Sitemap:` line uses the real domain.
- [ ] `/favicon.svg` and `/og.png` serve.

## Deploy

- [ ] Deploy `./dist` to the static host (build cmd `pnpm build`, output `dist`, `SITE_URL` set).
- [ ] On the live site, view-source `/`: `<link rel="canonical">` and `og:image` use the **real** domain (not `xcsteward.dev`).
- [ ] Open the live `/og.png` and confirm the share image renders.

## Index & promote

- [ ] Submit `https://REAL_DOMAIN/sitemap-index.xml` to Google Search Console.
- [ ] Post the LinkedIn launch / beta ask (link to `/` or `/beta/`).
- [ ] Use the failure pages + `/beta/` in targeted outreach (DMs, GitHub, Reddit).
