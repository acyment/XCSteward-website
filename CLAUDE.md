# CLAUDE.md

Guidance for working in this repository.

## What this is

The public static website for **XCSteward** — an Astro 5 + TypeScript site with a
landing page and a hand-written failure-mode library. Static output, no
client-side JS, hand-written CSS.

## Tooling — read this first

### Package manager: pnpm (never npm or yarn)

This project uses **pnpm exclusively**. The version is pinned via the
`packageManager` field in `package.json`.

- Install deps: `pnpm install`
- Run scripts: `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm check`
- Add a dependency: `pnpm add <pkg>` (or `pnpm add -D <pkg>` for dev)
- **Do not** run `npm install` / `yarn` or create `package-lock.json` /
  `yarn.lock`. The only lockfile is `pnpm-lock.yaml` — commit it.
- If pnpm prompts about ignored build scripts, the allow-list lives under
  `pnpm.onlyBuiltDependencies` in `package.json`.

### Python: use uv (only if Python is ever added)

There is no Python in this repo today. **If** Python is introduced, use
[`uv`](https://github.com/astral-sh/uv) for everything — never bare `pip`,
`venv`, `poetry`, or `pipenv`.

- Run: `uv run <script>` / `uv run python ...`
- Add deps: `uv add <pkg>`
- Sync env: `uv sync`
- Commit `pyproject.toml` and `uv.lock`.

## Verifying changes

There is no separate test suite. Before considering a change done:

```sh
pnpm check    # astro check — expect 0 errors / 0 warnings / 0 hints
pnpm build    # must complete cleanly into ./dist
```

## Conventions

- **Content** lives in `src/content/failures/*.md` with frontmatter validated by
  the schema in `src/content.config.ts`. The filename is the URL slug.
- **Copy is cautious by design.** Prefer "may help", "can reduce", "is worth
  testing against". Avoid "fixes", "solves", "eliminates" unless proven. Every
  failure page keeps an honest "When XCSteward probably will not help" section.
- Keep components small and boring. No UI framework, no client-side JS unless
  there is a strong reason.
- The production domain is configurable (`site` in `astro.config.mjs` /
  `SITE_URL` env var); keep `public/robots.txt`'s `Sitemap:` line in sync.
