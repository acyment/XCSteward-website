import type { APIRoute } from 'astro';

/**
 * robots.txt generated from the configured `site` (driven by SITE_URL), so the
 * Sitemap line always matches the deploy domain instead of a hardcoded guess.
 */
export const GET: APIRoute = ({ site }) => {
  // `site` is set in astro.config.mjs; fall back defensively just in case.
  const base = site ?? new URL('https://xcsteward.dev');
  const sitemapUrl = new URL('sitemap-index.xml', base).href;

  const body = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
