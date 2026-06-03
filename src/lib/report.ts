import { SITE } from '../config';

/** One concrete piece of information we ask for in a failure report. */
export interface ReportField {
  /** Short label shown in the on-page checklist. */
  label: string;
  /** What good input looks like. */
  hint: string;
}

/**
 * The concrete data a useful failure report should include. This is the single
 * source of truth: the on-page checklist and the pre-filled GitHub issue body
 * are both generated from it, so they never drift.
 */
export const REPORT_FIELDS: ReportField[] = [
  { label: 'macOS version', hint: 'e.g. 14.5 (23F79)' },
  { label: 'Xcode version', hint: 'e.g. 16.2 (16C5032a) — and the selected one (xcode-select -p)' },
  { label: 'Command you ran', hint: 'the exact xcodebuild / xcrun simctl / fastlane invocation' },
  { label: 'Where it ran', hint: 'local, CI-like on a Mac, or hosted CI' },
  { label: 'Were coding agents involved?', hint: 'was an AI/coding agent driving the run?' },
  {
    label: 'Could tooling be shared?',
    hint: 'could multiple agents, scripts, humans, or jobs touch Xcode tooling at the same time?',
  },
  { label: 'Simulator destination / runtime', hint: 'e.g. iPhone 15, iOS 17.5 — UDID if you have it' },
  { label: 'Did the simulator appear booted?', hint: 'yes / no / stuck in Booting' },
  {
    label: 'What hung or failed',
    hint: 'xcodebuild, simctl, Simulator.app, the test runner, or cleanup',
  },
  { label: 'Logs / snippets', hint: 'relevant output, a sample/spindump, or a gist link' },
  {
    label: 'Did manual cleanup help?',
    hint: 'e.g. killing CoreSimulatorService, simctl shutdown all, erase',
  },
];

/**
 * Render a Markdown issue body from REPORT_FIELDS. Used to pre-fill a GitHub
 * "new issue" so reporters land in a structured form even before the tool repo
 * has issue templates installed.
 */
export function buildIssueBody(context?: string): string {
  const lines: string[] = [];
  lines.push(
    'Thanks for reporting a real failure mode. Concrete detail is what makes a report useful — fill in what you can; partial reports are still welcome.',
  );
  lines.push('');
  if (context) {
    lines.push(`> Failure mode this relates to: **${context}**`);
    lines.push('');
  }
  lines.push('## What happened');
  lines.push('');
  lines.push('<!-- one or two sentences: what you expected vs. what hung or failed -->');
  lines.push('');
  lines.push('## Environment & details');
  lines.push('');
  for (const field of REPORT_FIELDS) {
    lines.push(`- **${field.label}:** <!-- ${field.hint} -->`);
  }
  lines.push('');
  lines.push('## Anything else');
  lines.push('');
  lines.push('<!-- workarounds tried, how reproducible it is, related issues -->');
  lines.push('');
  return lines.join('\n');
}

/**
 * Build a GitHub "new issue" URL pre-filled with a title and the structured
 * body. Deliberately omits `labels`/`template` params so issue creation never
 * breaks in a repo that does not yet have that label or template — the body is
 * always honored. See .github/ISSUE_TEMPLATE for the proposed form template.
 */
export function buildReportIssueUrl(opts: { title?: string; context?: string } = {}): string {
  const params = new URLSearchParams();
  if (opts.title) params.set('title', opts.title);
  params.set('body', buildIssueBody(opts.context));
  return `${SITE.issues}?${params.toString()}`;
}
