import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  HUMAN_CLI_EXAMPLE,
  AGENT_CLI_EXAMPLE,
  FAILURE_INSPECTION_EXAMPLE,
} from '../lib/site-content';
import type { Category } from '../content.config';

/**
 * /llms.txt — a curated, machine-readable map of the site for LLMs and agents
 * (https://llmstxt.org). Generated from the failures collection so it never
 * drifts. Full page text lives at /llms-full.txt.
 */
export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://xcsteward.com')).origin;
  const entries = (await getCollection('failures', ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order,
  );

  const lines: string[] = [];
  lines.push('# XCSteward');
  lines.push('');
  lines.push(`> ${SITE.description}`);
  lines.push('');
  lines.push(
    'XCSteward is an open-source, local-first macOS CLI that gives XCTest / ' +
      'xcodebuild / iOS Simulator test runs a controlled local execution lane: a ' +
      'queue, readiness checks, isolated per-run artifacts, timeouts, and cleanup. ' +
      'Single-run Xcode/Simulator fragility is the baseline problem; coding agents, ' +
      'scripts, and local CI-like workflows on one Mac amplify it. It is not a ' +
      'generic "fix XCTest flakiness" tool, and does not address broken tests, code ' +
      'signing, missing runtimes, or vendor image bugs.',
  );
  lines.push('');
  lines.push('## Current CLI guidance');
  lines.push('');
  lines.push(
    '- Humans: `submit --wait` prints the queued job id, status/log/watch/follow ' +
      'commands, job directory, and compact wait updates. `status <job-id> --watch ' +
      '[--interval <seconds>]` polls until terminal. `logs <job-id> --follow` ' +
      'streams the combined log until the job is terminal.',
  );
  lines.push('- Human path:');
  lines.push('');
  lines.push('```bash');
  lines.push(HUMAN_CLI_EXAMPLE);
  lines.push('```');
  lines.push('');
  lines.push(
    '- Agents and automation: always prefer `--json`; parse stdout and do not ' +
      'scrape human text. For long-running JSON waits, add `--progress` to receive ' +
      'JSON-lines events on stderr. When command events are available, progress ' +
      'events add `phase` and `phase_elapsed_seconds`. `status <job-id> --watch ' +
      '--json` emits newline-delimited full `JobSummary` objects on stdout.',
  );
  lines.push('- Agent path:');
  lines.push('');
  lines.push('```bash');
  lines.push(AGENT_CLI_EXAMPLE);
  lines.push('```');
  lines.push('');
  lines.push(
    '- Agent DevX: use `projects --json`, `profile show <name> --json`, ' +
      '`profile init --detect --json`, `explain <job-id> --json`, repeatable ' +
      '`submit --metadata key=value`, `--label`, repeatable `submit --env ' +
      'KEY=VALUE`, and `cleanup --caches` as needed. Env overrides apply to that ' +
      "job's `xcodebuild` invocation only, and XCSteward records override keys, " +
      'not sensitive values.',
  );
  lines.push(
    '- Bootstrap diagnosis: `runner_bootstrap_failure` means runner or environment ' +
      'setup failed before XCTest attached. XCSteward classifies pre-XCTest ' +
      'CoreSimulator, destination, launch session, artifact, or runner setup ' +
      'failures separately from real test failures and preserves the underlying detail.',
  );
  lines.push(
    '- Timeout-before-attach diagnosis: `pre_xctest_timeout` means the test ' +
      'command hit its timeout before XCSteward observed XCTest attach/test ' +
      'execution evidence. The summary says `XCTest did not attach before the ' +
      'test command timed out`, and terminal JSON may include phase, timeout ' +
      'seconds, evidence paths, and a capped diagnostic excerpt.',
  );
  lines.push(
    '- Pending logs: when a queued/bootstrap job has no `logs/combined.log` yet, ' +
      '`logs <job-id>` reports that the combined log is pending and points back to ' +
      '`status <job-id> --watch`.',
  );
  lines.push(
    '- Doctor preflight stays bounded: if `.xctestrun` integrity checking times ' +
      'out during a cold or long build, the warning now says no compiler error ' +
      'was observed before timeout rather than implying an unlimited wait.',
  );
  lines.push('- Failure inspection path:');
  lines.push('');
  lines.push('```bash');
  lines.push(FAILURE_INSPECTION_EXAMPLE);
  lines.push('```');
  lines.push('');
  lines.push(
    `- Reusable generic agent skill: ${SITE.repo}/blob/main/Examples/agents/skills/xcsteward/SKILL.md`,
  );
  lines.push(
    `- Authoritative JSON contract: ${SITE.repo}/blob/main/CONTRACT.md`,
  );
  lines.push('');
  lines.push('## Key pages');
  lines.push('');
  lines.push(`- [Home](${base}/): what XCSteward is, who it is and is not for`);
  lines.push(
    `- [Why XCSteward exists](${base}/why/): origin story — why coding agents ` +
      `expose fragile iOS simulator/XCTest execution, and how XCSteward differs from MCPs`,
  );
  lines.push(`- [Failure-mode library](${base}/failures/): symptom-first writeups`);
  lines.push(`- [Try the alpha](${base}/try/): how to try it and report a failure mode`);
  lines.push(`- [Source on GitHub](${SITE.repo})`);
  lines.push('');

  for (const cat of CATEGORY_ORDER as Category[]) {
    const inCat = entries.filter((e) => e.data.category === cat);
    if (!inCat.length) continue;
    lines.push(`## ${CATEGORY_META[cat].label}`);
    lines.push('');
    for (const e of inCat) {
      lines.push(
        `- [${e.data.title}](${base}/failures/${e.id}/): ${e.data.symptom} ` +
          `Searches: ${e.data.queries.join('; ')}`,
      );
    }
    lines.push('');
  }

  lines.push('## Full text');
  lines.push('');
  lines.push(`- [All failure pages as Markdown](${base}/llms-full.txt)`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
