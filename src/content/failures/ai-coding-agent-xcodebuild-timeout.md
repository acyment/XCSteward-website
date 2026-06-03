---
title: 'AI coding agent hits xcodebuild timeouts'
description: 'A coding agent running iOS tests repeatedly hits xcodebuild timeouts or hangs, often because it collides with other simulator activity. Quick checks and where XCSteward may help.'
symptom: 'A coding agent running iOS tests keeps hitting xcodebuild timeouts or hangs — frequently because its runs collide with other simulator activity.'
failureClass: 'agent-driven contention / unbounded runs'
fit: strong
fitNote: 'Strong fit'
category: agents
queries:
  - 'ai coding agent xcodebuild timeout'
  - 'coding agent ios tests hang'
  - 'agent xcodebuild stuck simulator'
  - 'claude cursor xcodebuild timeout simulator'
related:
  - 'coding-agents-ios-simulator-tests'
  - 'multiple-xcodebuild-processes-same-mac'
  - 'xcodebuild-timed-out-waiting-for-simulator'
order: 92
updated: 2026-06-03
---

## Symptom

A coding agent that runs iOS tests as part of its loop keeps hitting
`xcodebuild` timeouts or hangs. It retries, which can make things worse, and the
failures are hard to reproduce by hand.

## What it usually looks like

- The agent invokes `xcodebuild`, the call stalls at boot/resolution, and the
  agent's own timeout fires.
- The agent **retries automatically**, launching another `xcodebuild` while the
  first is still wedged — compounding the contention.
- Multiple agents (or an agent plus your manual run) touch simulators at once.
- The agent scrapes long, ambiguous output and cannot tell "still booting" from
  "stuck". 
- Failures spike when the Mac is busy and vanish when it is idle.

## Why it happens / likely failure classes

Agents make the underlying local simulator fragility frequent and hard to reason
about:

- **Uncoordinated concurrency.** An agent driving `xcodebuild` directly competes
  with other runs over one CoreSimulatorService. See
  [multiple xcodebuild processes on one Mac](/failures/multiple-xcodebuild-processes-same-mac/)
  and [coding agents running iOS simulator tests](/failures/coding-agents-ios-simulator-tests/).
- **Retry storms.** Automatic retries start new runs on an already-wedged
  subsystem instead of recovering it.
- **No readiness contract.** The agent cannot reliably tell when a device is
  actually ready, so it races boots — see
  [xcodebuild timed out waiting for the simulator](/failures/xcodebuild-timed-out-waiting-for-simulator/).
- **Single-run fragility too.** Even one agent on an idle Mac hits boot,
  resolution, and readiness stalls — concurrency just amplifies it.
- **Output scraping** instead of a structured result makes timeouts ambiguous.

## Quick checks

```sh
# Is the agent's xcodebuild colliding with other simulator activity?
pgrep -lf 'xcodebuild|simctl|Simulator'

# Are stale runs from earlier agent attempts still alive?
pgrep -lf 'xcodebuild|XCTest|testmanagerd'

# Does the same command run cleanly by hand on an idle machine?
time xcodebuild test -scheme YourScheme \
  -destination "platform=iOS Simulator,id=<UDID>"
```

If the command is reliable by hand but fails under the agent's loop, the problem
is coordination and retries, not your tests.

## Manual mitigations

- **Serialize the agent's simulator runs** behind a lock so retries queue
  instead of stacking:

  ```sh
  (
    flock -w 1800 9 || exit 1
    xcodebuild test -scheme YourScheme \
      -destination "platform=iOS Simulator,id=<UDID>"
  ) 9>/tmp/xcsim.lock
  ```

- **Pin a concrete device by UDID** and **isolate artifacts** per attempt.
- **Bound each run with a timeout and recover** (shutdown/erase) before retrying,
  rather than launching another run on a wedged subsystem.
- **Give the agent a structured pass/fail signal** instead of having it scrape
  console output.

## When XCSteward may help

This is one of the situations XCSteward is most directly designed for:

- A **queue / single execution lane** so an agent's runs (and retries) are
  serialized instead of colliding with each other or with you.
- A **stable CLI contract with structured results**, so an agent gets a clear
  pass/fail/timeout instead of scraping walls of text.
- **Readiness checks, bounded timeouts, and deterministic recovery** so a wedged
  run fails fast and the next attempt starts clean.
- **Isolated artifacts** per run so concurrent attempts do not corrupt each
  other.

A strong candidate to test against this class of failure if agents drive your
iOS test runs.

## When XCSteward probably will not help

- It does not make a **flaky or genuinely broken test** pass — it makes
  execution more predictable, not the test logic correct.
- It is **not an agent framework** and does not change how your agent decides to
  retry; it gives those runs a safer lane to execute in.
- It does not address code signing, missing runtimes, or vendor image bugs.
