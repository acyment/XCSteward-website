# Backlog

Deferred work and deliberate non-goals. Kept short and honest.

## Before / around launch

- [ ] **Set `SITE_URL`** to the real production domain in the host's build env.
      Until then builds use the documented placeholder `https://xcsteward.dev`.
- [ ] **Install the issue-form templates** in the tool repo
      (`acyment/XCSteward`) from [`proposals/issue-templates/`](./proposals/issue-templates/).
      Reporting already works without them (pre-filled issue body); the templates
      just add the nicer GitHub form UI. If installed, optionally switch
      `buildReportIssueUrl()` to pass `template=failure-mode.yml`.
- [ ] Add an OG/social share image (`og:image`) once branding exists. `Seo.astro`
      currently ships `summary` Twitter cards without an image.

## Possible later (not now)

- [ ] **Analytics** — intentionally NOT added. If added later, prefer a
      privacy-friendly, no-cookie option and document it. Placeholder only.
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
