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

> Remember: every env var is **build-time**. Changing `SITE_URL`, analytics, or
> the verification token means rebuild + redeploy.

## Deploy

- [ ] Deploy `./dist` to the static host (build cmd `pnpm build`, output `dist`,
      `SITE_URL` + any analytics vars set in the host env).

## Live smoke (after deploy)

- [ ] `/` (homepage) loads.
- [ ] `/beta/` loads.
- [ ] `/failures/` loads.
- [ ] One failure page loads.
- [ ] Canonical URL uses the **real** domain (view-source `/`).
- [ ] `og:image` uses the **real** domain (view-source `/`).
- [ ] `/sitemap-index.xml` loads.
- [ ] `/robots.txt` `Sitemap:` line points at the real sitemap.
- [ ] `/og.png` loads.
- [ ] `/favicon.svg` loads.
- [ ] Analytics pageview arrives in the provider dashboard.
- [ ] (Plausible/Umami) GitHub CTA fires `github_repo_click`.
- [ ] (Plausible/Umami) "Report a failure mode" fires `report_failure_click`.
- [ ] (If analytics enabled) provider is in its cookieless mode.

## Search Console

- [ ] Verify the property — prefer **DNS**, or **URL-prefix** via the
      `PUBLIC_GOOGLE_SITE_VERIFICATION` meta tag (rebuild + redeploy after setting).
- [ ] Submit `https://REAL_DOMAIN/sitemap-index.xml`.
- [ ] URL-inspect the homepage, `/failures/`, and 2–3 failure pages; request indexing.
- [ ] After a few days: check indexing (Coverage / Indexing — no errors).
- [ ] Review **Performance** ~weekly: queries, impressions, clicks, CTR, average
      position, top pages (which failure-mode pages earn clicks).

## Discoverability (SEO / AEO)

- [ ] After deploy, `pnpm indexnow` (submits sitemap URLs to Bing/IndexNow).
      Re-run after meaningful content changes.
- [ ] Spot-check `/llms.txt`, `/llms-full.txt`, and the IndexNow key file
      (`/<hex>.txt`) load on the live domain.
- [ ] Confirm JSON-LD is present (view-source: `application/ld+json`).
- [ ] Periodically prompt-test target queries in ChatGPT/Claude/Perplexity to
      see if XCSteward is surfaced; watch Umami referrers for AI engines.

## Before heavy outreach (non-blocking)

- [ ] Install a `failure-mode-report` issue template in the main XCSteward repo
      (`acyment/XCSteward`) — see [`proposals/issue-templates/`](./proposals/issue-templates/).
      Reporting already works without it (pre-filled body), so this does not block launch.

## Promote

Share these URLs (no tracking params by default):

- Homepage `https://REAL_DOMAIN/`
- Alpha / reporting guide `https://REAL_DOMAIN/beta/`
- Failure-mode library `https://REAL_DOMAIN/failures/`
- 2–3 relevant failure pages for the person you're contacting

- [ ] Post the LinkedIn launch / beta ask (link to `/` or `/beta/`).
- [ ] Use the failure pages + `/beta/` in targeted outreach (DMs, GitHub, Reddit).
