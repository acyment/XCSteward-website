import type { APIRoute } from 'astro';

/**
 * robots.txt generated from the configured `site` (driven by SITE_URL), so the
 * Sitemap line always matches the deploy domain instead of a hardcoded guess.
 *
 * AI / answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot,
 * Google-Extended, …) are intentionally ALLOWED via the `*` rule — we want this
 * content discoverable and citable by LLMs and agents (the actual audience).
 * To opt out later, add per-bot `User-agent` / `Disallow` blocks here.
 */
export const GET: APIRoute = ({ site }) => {
  // `site` is set in astro.config.mjs; fall back defensively just in case.
  const base = site ?? new URL('https://xcsteward.com');
  const sitemapUrl = new URL('sitemap-index.xml', base).href;

  const body = `# AI and answer-engine crawlers are welcome (see src/pages/robots.txt.ts).
User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
