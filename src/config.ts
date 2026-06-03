/** Site-wide constants. Keep marketing copy out of here; this is just data. */
export const SITE = {
  name: 'XCSteward',
  tagline: 'Predictable local XCTest and Simulator runs',
  /** Used for the default OG description and footer. */
  description:
    'XCSteward is an open-source, local-first macOS tool that makes XCTest, ' +
    'xcodebuild, and iOS Simulator test execution more predictable — ' +
    'especially when coding agents and scripts share one Mac.',
  repo: 'https://github.com/acyment/XCSteward',
  issues: 'https://github.com/acyment/XCSteward/issues/new',
  discussions: 'https://github.com/acyment/XCSteward/discussions',
  author: 'Alan Cyment',
} as const;

export const NAV = [
  { label: 'Failure modes', href: '/failures/' },
  { label: 'Try the alpha', href: '/beta/', event: 'beta_cta_click' },
  { label: 'GitHub', href: SITE.repo, external: true, event: 'github_repo_click' },
] as const;
