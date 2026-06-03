---
title: 'fastlane scan hangs with parallel testing'
description: 'fastlane scan (or xcodebuild) hangs when parallel testing spins up multiple simulator clones that contend for CoreSimulator. Quick checks and where XCSteward may help.'
symptom: 'fastlane scan or xcodebuild hangs once parallel testing spins up multiple simulator clones that contend for the simulator subsystem.'
failureClass: 'parallel clone contention / CoreSimulator overload'
fit: partial
fitNote: 'Partial fit'
category: state
queries:
  - 'fastlane scan parallel testing hang'
  - 'xcodebuild parallel-testing-enabled hangs'
  - 'parallel simulator clones stuck'
  - 'concurrent destinations simulator hang'
related:
  - 'multiple-xcodebuild-processes-same-mac'
  - 'fastlane-scan-hangs-after-tests'
  - 'coresimulatorservice-deadlock'
order: 58
updated: 2026-06-03
---

## Symptom

A single run that uses **parallel testing** (multiple simulator clones, or
multiple `-destination` devices) hangs. One serial simulator would have been
fine; spinning up several at once wedges.

## What it usually looks like

- `fastlane scan` with `parallel_testing` / `concurrent_simulators`, or
  `xcodebuild` with `-parallel-testing-enabled YES`, stalls after cloning starts.
- Several cloned devices appear in `Booting`, and one or more never progress.
- The run sits with no test output while clones are being brought up or torn
  down.
- It is worse on a busy or lower-resource machine.
- A single-device (non-parallel) run of the same suite completes.

## Why it happens / likely failure classes

Parallel testing multiplies simulator lifecycle work through one shared
subsystem:

- **Clone boot storms.** Several clones boot at once and contend for
  CoreSimulator, slowing or wedging some of them. See
  [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- **Resource pressure.** Multiple booted simulators exhaust CPU/RAM, so boots or
  test hosts stall.
- **Teardown contention.** Cloned devices have to be cleaned up; if one wedges,
  the run waits. See [fastlane scan hangs after tests](/failures/fastlane-scan-hangs-after-tests/).
- **Other activity on the same Mac** stacked on top of the parallel run. See
  [multiple xcodebuild processes on one Mac](/failures/multiple-xcodebuild-processes-same-mac/).
- Note: this is about *execution* contention, not whether your tests are
  parallel-safe.

## Quick checks

```sh
# How many clones / devices are booting at once during the hang?
xcrun simctl list devices | grep -i 'boot\|clone'

# Is the subsystem responsive under the parallel load?
time xcrun simctl list devices available

# Does a single-device run of the same suite complete?
xcodebuild test -scheme YourScheme \
  -destination "platform=iOS Simulator,id=<UDID>"
```

If the serial run is reliable and only the parallel run hangs, the problem is
contention from concurrency, not the tests.

## Manual mitigations

- **Lower the degree of parallelism** so fewer clones boot at once
  (`concurrent_simulators` in scan, or fewer `-destination` entries).
- **Add a teardown timeout** around the whole run so a wedged clone fails fast:

  ```sh
  gtimeout 1800 bundle exec fastlane scan || echo "scan timed out"
  ```

- **Make sure nothing else** is using simulators during the parallel run.
- **Reset cloned/unavailable devices** between runs:

  ```sh
  xcrun simctl shutdown all
  xcrun simctl delete unavailable
  ```

## When XCSteward may help

This is a partial fit — XCSteward focuses on the execution and lifecycle side:

- **Serializing simulator work into one controlled lane** so boots and teardowns
  do not pile up and wedge the subsystem — at the cost of less parallelism.
- **Readiness checks and timeouts** so a clone that will not boot becomes a fast
  failure with recovery, not an open hang.
- **Deterministic cleanup** of clones/devices between runs.

Worth testing against this class of failure when the hang is in clone
boot/teardown rather than in `scan`'s reporting. Note the trade-off: XCSteward
favors predictable serialized execution over maximum parallel throughput.

## When XCSteward probably will not help

- If you specifically **need high parallel throughput** on one machine,
  serializing reduces collisions but also reduces parallelism — that is a
  deliberate trade-off, not a free win.
- If the hang is inside **`fastlane scan`'s own reporting** rather than the
  simulators, that is `scan`'s domain.
- It does not fix **tests that are not parallel-safe** or a runtime defect.
