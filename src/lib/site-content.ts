/**
 * Shared marketing copy used in more than one place (landing + /try/).
 * Kept here so the lists do not drift between pages.
 */

import type { Category } from '../content.config';

/** Display order, label, and one-line blurb for each failure-class category. */
export const CATEGORY_META: Record<
  Category,
  { order: number; label: string; blurb: string }
> = {
  readiness: {
    order: 1,
    label: 'Destination & simulator readiness',
    blurb:
      'Resolving a destination, booting a device, and getting it actually ready before tests start.',
  },
  lifecycle: {
    order: 2,
    label: 'CoreSimulator / simctl lifecycle',
    blurb:
      'The simctl client and CoreSimulatorService daemon becoming unresponsive, wedged, or deadlocked.',
  },
  state: {
    order: 3,
    label: 'Shared state & cleanup',
    blurb:
      'Stale device state, contaminated artifacts, and concurrent processes colliding over shared tooling.',
  },
  ci: {
    order: 4,
    label: 'CI-like workflow failures',
    blurb:
      'Symptoms specific to CI and CI-like runner environments on a Mac.',
  },
  agents: {
    order: 5,
    label: 'Coding-agent amplified failures',
    blurb:
      'Failures that surface or worsen when coding agents drive test runs on a shared Mac.',
  },
};

/** Categories in display order. */
export const CATEGORY_ORDER = (
  Object.keys(CATEGORY_META) as Category[]
).sort((a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order);

/** Symptoms XCSteward is built for. */
export const GOOD_FIT: string[] = [
  'Local simulator test runs that hang before tests start.',
  'xcodebuild getting stuck resolving or booting destinations.',
  'simctl or CoreSimulator getting wedged or deadlocked.',
  'Cleanup and preboot scripts that have crept into your test ritual.',
  'Local, CI-like test workflows running on a Mac.',
  'Coding agents — or several scripts, jobs, and humans — touching Xcode tooling.',
];

/** Things XCSteward deliberately does not address. */
export const NOT_FIT: string[] = [
  'Broken tests that fail on their own logic.',
  'App-level UI test flakiness and timing bugs in your test code.',
  'Code signing and provisioning problems.',
  'Missing or un-downloaded Xcode runtimes.',
  'Bugs inside a specific simulator runtime / vendor image.',
  'Network, backend, or mock-server instability.',
];

/** What XCSteward does, framed as how it governs execution. */
export const HELPS: { title: string; body: string }[] = [
  {
    title: 'A controlled local execution lane',
    body: 'Run tests through one predictable path instead of ad-hoc xcodebuild invocations scattered across scripts and agents.',
  },
  {
    title: 'A scheduler / queue',
    body: 'Submit runs from multiple agents and scripts; they execute in a coordinated order rather than colliding on shared state.',
  },
  {
    title: 'Readiness checks',
    body: 'Confirm the simulator subsystem and device are actually ready — not just "Booted" — before handing off to xcodebuild.',
  },
  {
    title: 'Isolated artifacts',
    body: 'Per-run DerivedData, result bundles, logs, and structured summaries, so runs do not overwrite each other.',
  },
  {
    title: 'Timeouts and cleanup',
    body: 'Bound each phase so a wedge becomes a fast, legible failure, and tear down devices and processes deterministically afterward.',
  },
  {
    title: 'Observable CLI runs',
    body: 'Plain waits print the job id, job directory, watch/follow commands, and compact progress instead of disappearing into a silent command.',
  },
  {
    title: 'Explicit bootstrap diagnosis',
    body: 'Pre-XCTest runner or environment setup failures are classified separately from real test failures, with the simulator detail and artifacts preserved.',
  },
  {
    title: 'A JSON contract for automation',
    body: 'Agents and scripts can use JSON summaries, phase-aware progress events, profile discovery, metadata, per-run env injection, and bounded explanations instead of scraping human text.',
  },
];

/** Concise examples used by human-facing pages and machine-readable guidance. */
export const HUMAN_CLI_EXAMPLE = `xcsteward submit --project app --wait --wait-timeout 900
xcsteward status <job-id> --watch
xcsteward logs <job-id> --follow`;

export const AGENT_CLI_EXAMPLE = `xcsteward profile init --detect --json
xcsteward submit --project app --wait --wait-timeout 900 --json --progress --env API_BASE_URL=http://127.0.0.1:8080
xcsteward explain <job-id> --json`;

export const FAILURE_INSPECTION_EXAMPLE = `xcsteward status <job-id> --watch
xcsteward explain <job-id> --json
xcsteward logs <job-id>`;

/** The feedback that is most valuable for the alpha. */
export const VALUABLE_FEEDBACK: string[] = [
  'Real logs — actual output, a sample/spindump, or a gist beats a paraphrase.',
  'Real setups — your exact Xcode/macOS/simulator combination and command.',
  'Real failure modes — reproducible pain, not hypotheticals.',
  'Cases where XCSteward does not help — those tell us where the scope really ends.',
];
