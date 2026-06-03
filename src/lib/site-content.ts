/**
 * Shared marketing copy used in more than one place (landing + /beta/).
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
    body: 'Per-run DerivedData, result bundles, and logs, so runs do not overwrite each other.',
  },
  {
    title: 'Timeouts and cleanup',
    body: 'Bound each phase so a wedge becomes a fast, legible failure, and tear down devices and processes deterministically afterward.',
  },
  {
    title: 'Guardrails around concurrency',
    body: 'Stop unsafe simultaneous Xcode/Simulator activity from deadlocking CoreSimulator in the first place.',
  },
];

/** The feedback that is most valuable for the alpha. */
export const VALUABLE_FEEDBACK: string[] = [
  'Real logs — actual output, a sample/spindump, or a gist beats a paraphrase.',
  'Real setups — your exact Xcode/macOS/simulator combination and command.',
  'Real failure modes — reproducible pain, not hypotheticals.',
  'Cases where XCSteward does not help — those tell us where the scope really ends.',
];
