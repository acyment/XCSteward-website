import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config';

/**
 * /llms-full.txt — the full Markdown of every failure-mode page, concatenated,
 * for LLMs/agents that want the complete corpus in one fetch. Generated from
 * the collection (raw Markdown bodies), so it stays in sync automatically.
 */
export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://xcsteward.com')).origin;
  const entries = (await getCollection('failures', ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order,
  );

  const out: string[] = [];
  out.push('# XCSteward — failure-mode library (full text)');
  out.push('');
  out.push(`> ${SITE.description}`);
  out.push('');
  out.push(`Source: ${base}/  ·  Repo: ${SITE.repo}`);
  out.push('');
  out.push('---');
  out.push('');

  for (const e of entries) {
    out.push(`# ${e.data.title}`);
    out.push('');
    out.push(`URL: ${base}/failures/${e.id}/`);
    out.push(`Fit: ${e.data.fitNote} · Likely class: ${e.data.failureClass}`);
    out.push('');
    out.push((e.body ?? '').trim());
    out.push('');
    out.push('---');
    out.push('');
  }

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
