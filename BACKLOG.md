# Backlog

Deferred work and deliberate non-goals. Kept short and honest.

## Before / around launch

See [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md) for the full ordered list. Key
items:

- [x] **Production domain** decided: `xcsteward.com` (built-in `SITE_URL`
      default; overridable). Hosted on the Hetzner VPS via `cyment-infra`.
- [ ] **Install the issue-form templates** in the tool repo
      (`acyment/XCSteward`) from [`proposals/issue-templates/`](./proposals/issue-templates/).
      Reporting already works without them (pre-filled issue body); the templates
      just add the nicer GitHub form UI. If installed, optionally switch
      `buildReportIssueUrl()` to pass `template=failure-mode.yml`.
- [x] OG/social share image — `public/og.png` ships and `Seo.astro` emits a
      `summary_large_image` card. Regenerate with `pnpm og` after editing
      `scripts/og-image.svg`.

## Possible later (not now)

- [x] **Analytics** — optional, privacy-friendly support added
      (`src/components/Analytics.astro`): Plausible / Umami / Cloudflare via
      `PUBLIC_*` env vars, prod-only, cookieless, off by default. See README.
- [ ] A short "install / quickstart" section once the alpha has stable install
      steps, linking from `/beta/`.
- [ ] More failure-mode pages **only** when backed by real, recurring search
      language and a genuinely useful writeup — never templated/doorway pages.

## Non-goals (on purpose)

- No mass pSEO expansion, no doorway pages.
- No login, no CMS, no backend, no form service.
- No heavy UI framework or client-side JS without a strong reason.
- No claims that XCSteward fixes flaky tests, code signing, missing runtimes, or
  vendor image bugs.
