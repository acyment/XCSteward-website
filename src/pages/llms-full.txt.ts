import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config';
import {
  HUMAN_CLI_EXAMPLE,
  AGENT_CLI_EXAMPLE,
  FAILURE_INSPECTION_EXAMPLE,
} from '../lib/site-content';

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
  out.push('## Current CLI guidance for agents and humans');
  out.push('');
  out.push(
    'XCSteward is a local CLI and JSON contract, not a dashboard, SaaS, MCP layer, or hosted service.',
  );
  out.push('');
  out.push(
    'Human UX: plain `submit --wait` prints the queued job id, status/log/watch/follow commands, job directory, and compact wait updates. `status <job-id> --watch [--interval <seconds>]` polls until the job is terminal. `logs <job-id> --follow` streams the combined log until terminal.',
  );
  out.push('');
  out.push('```bash');
  out.push(HUMAN_CLI_EXAMPLE);
  out.push('```');
  out.push('');
  out.push(
    'Machine contract: agents and automation should keep using `--json`, parse stdout, and branch on `state`, `result_class`, and exit code. Long-running JSON waits can add `--progress` for JSON-lines events on stderr. When command events are available, progress events add `phase` and `phase_elapsed_seconds`. `status <job-id> --watch --json` emits newline-delimited full `JobSummary` objects on stdout.',
  );
  out.push('');
  out.push('```bash');
  out.push(AGENT_CLI_EXAMPLE);
  out.push('```');
  out.push('');
  out.push(
    "Useful agent commands: `projects --json`, `profile show <name> --json`, `profile init --detect --json`, `explain <job-id> --json`, repeatable `submit --metadata key=value`, `--label`, repeatable `submit --env KEY=VALUE`, and `cleanup --caches`. Env overrides apply to that job's `xcodebuild` invocation only, and XCSteward records override keys, not sensitive values.",
  );
  out.push('');
  out.push(
    '`runner_bootstrap_failure` means runner or environment setup failed before XCTest attached. XCSteward classifies pre-XCTest CoreSimulator, destination, launch session, artifact, or runner setup failures separately from real test failures, preserves the underlying detail, and may suggest a bounded next action such as shutting down or erasing the selected simulator before retrying once.',
  );
  out.push('');
  out.push(
    '`pre_xctest_timeout` means the test command hit its timeout before XCSteward observed XCTest attach/test execution evidence. The summary says `XCTest did not attach before the test command timed out`, and terminal JSON may include phase, timeout seconds, evidence paths, and a capped diagnostic excerpt.',
  );
  out.push('');
  out.push(
    'Failure inspection path:',
  );
  out.push('');
  out.push('```bash');
  out.push(FAILURE_INSPECTION_EXAMPLE);
  out.push('```');
  out.push('');
  out.push(
    'If a job is queued or still in simulator/bootstrap setup and `logs/combined.log` does not exist yet, `logs <job-id>` reports that the combined log is pending and points back to `status <job-id> --watch`.',
  );
  out.push('');
  out.push(
    'Doctor preflight stays bounded: if `.xctestrun` integrity checking times out during a cold or long build, the warning now says no compiler error was observed before timeout rather than implying an unlimited wait.',
  );
  out.push('');
  out.push(
    `Reusable generic agent skill: ${SITE.repo}/blob/main/Examples/agents/skills/xcsteward/SKILL.md`,
  );
  out.push(`Authoritative JSON contract: ${SITE.repo}/blob/main/CONTRACT.md`);
  out.push('');
  out.push('---');
  out.push('');

  for (const e of entries) {
    out.push(`# ${e.data.title}`);
    out.push('');
    out.push(`URL: ${base}/failures/${e.id}/`);
    out.push(`Fit: ${e.data.fitNote} · Likely class: ${e.data.failureClass}`);
    out.push(`Searches: ${e.data.queries.join('; ')}`);
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
