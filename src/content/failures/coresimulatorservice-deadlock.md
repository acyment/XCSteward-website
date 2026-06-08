---
title: 'CoreSimulatorService deadlock and unresponsive simulators'
description: 'CoreSimulatorService stops responding and every simctl, Simulator, and xcodebuild call wedges. Why it deadlocks, how to recover safely, and where XCSteward may help.'
symptom: 'CoreSimulatorService stops responding and the whole simulator subsystem wedges — simctl, Simulator.app, and xcodebuild all block at once.'
failureClass: 'CoreSimulatorService deadlock / shared-state contention'
fit: strong
fitNote: 'Strong fit'
queries:
  - 'CoreSimulatorService deadlock'
  - 'CoreSimulatorService not responding'
  - 'com.apple.CoreSimulator.CoreSimulatorService hung'
  - 'CoreSimulatorService connection invalid'
  - 'simulator subsystem hung macos'
  - 'CoreSimulator service stuck'
category: lifecycle
related:
  - 'simctl-commands-not-responding'
  - 'killing-simulator-does-not-fix-xcodebuild'
  - 'multiple-xcodebuild-processes-same-mac'
  - 'coding-agents-ios-simulator-tests'
order: 32
featured: true
updated: 2026-06-08
---

## Symptom

The simulator subsystem as a whole stops responding. It is not one command —
`simctl`, `Simulator.app`, and `xcodebuild` all stall at the same time, because
they all depend on the same daemon: `CoreSimulatorService`.

## What it usually looks like

- Several tools hang simultaneously: a test run, a manual `simctl list`, and the
  Simulator UI are all stuck.
- Devices are frozen in a transitional state (`Booting`, `Shutting Down`) and
  will not move.
- Console/log noise mentioning `CoreSimulatorService`, XPC timeouts, or
  "failed to send" / "connection invalid" style messages.
- The Mac is otherwise fine — CPU is idle — which makes it look like a deadlock
  rather than overload.
- It frequently appears after a burst of **parallel** simulator activity.

## Why it happens / likely failure classes

`CoreSimulatorService` mediates essentially all simulator state for your user
session. It serializes a lot of operations internally. A deadlock or
unresponsive state typically traces to:

- **Concurrent operations contending for shared locks.** Two or more callers
  (test runs, `simctl boot`/`shutdown`, Simulator launches) racing on the same
  devices or on global service state can wedge it. This is the single biggest
  amplifier — see
  [coding agents running iOS simulator tests](/failures/coding-agents-ios-simulator-tests/).
- **A half-finished operation that never released its lock** (a boot/shutdown
  that was killed mid-flight, a crashed client).
- **Version skew** between the `CoreSimulator` framework in the selected Xcode
  and the already-running service after an Xcode switch/update.
- **Stale or corrupt device state** that the service keeps trying to reconcile.
- **Resource pressure** (disk space, file descriptors) degrading the service
  until it stops answering.

> The baseline fragility exists even for a single run. Concurrency does not
> *cause* it so much as it dramatically raises the odds of hitting it.

## Quick checks

```sh
# Is the service alive, and how long has it been running?
pgrep -lf CoreSimulatorService

# Who else is touching the subsystem right now?
pgrep -lf 'xcodebuild|simctl|Simulator'

# Selected Xcode vs. running service — mismatch is a known trigger
xcode-select -p

# A bounded probe — if this hangs too, the service is wedged
xcrun simctl list devices
```

A spike of crash logs for `com.apple.CoreSimulator.CoreSimulatorService` in
Console (or `~/Library/Logs/CoreSimulator/`) is a strong tell.

## Manual mitigations

```sh
# 1) Try a clean shutdown first (may itself hang if fully deadlocked)
xcrun simctl shutdown all

# 2) Quit Simulator.app, then restart the daemon. launchd relaunches it.
killall Simulator 2>/dev/null || true
killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true

# 3) Re-point Xcode if you switched versions
sudo xcode-select -s /Applications/Xcode.app

# 4) Verify recovery
xcrun simctl list devices

# 5) Prune state once responsive
xcrun simctl delete unavailable
```

If it wedges again within minutes, suspect **concurrent callers** and stop them
before retrying. Logging out (the daemon is per-user) or rebooting clears the
most stubborn states.

## When XCSteward may help

Preventing and recovering from this class of wedge is a core design goal:

- A **single controlled execution lane** so simulator operations do not run
  concurrently and contend for the service's locks — the most effective way to
  avoid the deadlock at all.
- **Readiness checks** that confirm the service is responsive before a run, and
  **timeouts** that turn a wedge into a fast failure instead of an open hang.
- A **deterministic recovery routine** (shutdown → restart service → re-verify)
  so you are not reconstructing the right kill sequence under pressure.
- **Cleanup** between runs so half-finished state does not accumulate.

This is a strong candidate to test XCSteward against, particularly if the wedge
shows up under parallel or agent-driven activity.

## When XCSteward probably will not help

- If the deadlock is caused by an actual **bug in a specific CoreSimulator /
  Xcode build**, serialization can reduce how often you hit it but cannot fix the
  underlying defect.
- It will not resolve **disk-full or other host-level resource problems** that
  starve the service.
- It does not repair an already-corrupt simulator installation; you may still
  need to reset runtimes.
