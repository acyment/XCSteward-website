# AGENTS.md

Conventions for AI agents and contributors working in this repo. This mirrors the
essentials; [`CLAUDE.md`](./CLAUDE.md) is the fuller version and they should stay
in sync.

## Tooling

- **pnpm only** (never npm/yarn). Version is pinned via `packageManager`. Commit
  `pnpm-lock.yaml`.
- **uv** for Python, *if* Python is ever added (none today).

## The gate before "done"

```sh
pnpm verify   # = astro check + astro build + internal link check
```

Expect `astro check` to report 0 errors / 0 warnings / 0 hints. Do not commit a
broken build.

## Project shape

- Astro 5 + TypeScript, **static output, no client-side JS** unless strictly
  needed. No UI framework, no CMS, no analytics, no login.
- Failure-mode pages are Markdown in `src/content/failures/`, validated by the
  schema in `src/content.config.ts`. Filename = URL slug.
- Shared copy lives in `src/lib/site-content.ts`; report fields in
  `src/lib/report.ts`. Keep single sources of truth — don't duplicate the lists.

## Positioning & voice (important)

- XCSteward is **not only a concurrency tool.** Single-run Xcode/Simulator
  fragility is real on its own; coding agents, scripts, and local CI-like
  workflows **amplify** it. Keep both halves of that framing.
- Cautious language only: "may help", "can reduce", "is worth testing against".
  Never claim it "fixes"/"solves"/"eliminates", and never claim it handles broken
  tests, code signing, missing runtimes, or vendor image bugs.
- Every failure page keeps an honest "When XCSteward probably will not help"
  section. Don't make the copy more salesy.

## Don't

- Add many templated pSEO pages (the library is hand-written and curated).
- Add a backend, form service, login, CMS, analytics (unless a documented TODO),
  or heavy dependencies.
- Hardcode the production domain anywhere — it comes from `SITE_URL`.
