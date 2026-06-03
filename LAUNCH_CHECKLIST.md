# Launch checklist

Concise, ordered steps to take the site live and start beta recruitment.

## Build & verify

- [ ] Decide the production domain.
- [ ] Set `SITE_URL=https://REAL_DOMAIN` (host env var, or inline on the build).
- [ ] (Optional) Set analytics env vars — pick one provider; see `.env.example`.
      Cookieless only. Plausible/Umami get CTA events; Cloudflare is pageview-only.
- [ ] (Optional) Set `PUBLIC_GOOGLE_SITE_VERIFICATION` if using the meta-tag
      verification method (DNS verification needs no env var).
- [ ] `pnpm verify` — check + build + internal-link audit all pass.
- [ ] `pnpm og` — only if `scripts/og-image.svg` (text/logo) changed; commit `public/og.png`.
- [ ] `SITE_URL=https://REAL_DOMAIN [analytics vars…] pnpm build` — production build.
- [ ] `pnpm preview` — review the built `./dist` locally.

## Local smoke (in `pnpm preview`)

- [ ] `/` loads and looks right (light + dark).
- [ ] `/failures/` lists all 18 pages grouped by category; jump-nav works.
- [ ] One failure page reads correctly (e.g. `/failures/coresimulatorservice-deadlock/`).
- [ ] `/sitemap-index.xml` → `/sitemap-0.xml` lists every page.
- [ ] `/robots.txt` `Sitemap:` line uses the real domain.
- [ ] `/favicon.svg` and `/og.png` serve.
- [ ] If analytics vars were set: the provider script is present in `/` source.
      If not set: confirm **no** analytics script is emitted.

## Deploy

- [ ] Deploy `./dist` to the static host (build cmd `pnpm build`, output `dist`,
      `SITE_URL` + any analytics vars set in the host env).
- [ ] On the live site, view-source `/`: `<link rel="canonical">` and `og:image`
      use the **real** domain (not `xcsteward.dev`).
- [ ] Open the live `/og.png` and confirm the share image renders.

## Analytics smoke (if enabled)

- [ ] Provider dashboard records a pageview from a live visit.
- [ ] (Plausible/Umami) Click a "View on GitHub" and a "Report a failure mode"
      CTA; confirm `github_repo_click` / `report_failure_click` arrive.
- [ ] Confirm the provider is in its cookieless mode.

## Search Console

- [ ] Add the property — prefer **DNS** verification, or **URL-prefix** via the
      `PUBLIC_GOOGLE_SITE_VERIFICATION` meta tag (rebuild + redeploy after setting).
- [ ] Submit `https://REAL_DOMAIN/sitemap-index.xml`.
- [ ] Check **Coverage / Indexing** — no errors; pages getting indexed.
- [ ] Review **Performance** ~weekly: queries, impressions, clicks, CTR, average
      position, top pages (which failure-mode pages earn clicks).

## Promote

- [ ] Post the LinkedIn launch / beta ask (link to `/` or `/beta/`).
- [ ] Use the failure pages + `/beta/` in targeted outreach (DMs, GitHub, Reddit).
