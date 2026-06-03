---
title: 'Multiple xcodebuild processes on the same Mac'
description: 'Several xcodebuild or simctl processes run at once on one Mac and collide over simulators and build state. Quick checks, serialization tips, and where XCSteward may help.'
symptom: 'Several xcodebuild/simctl processes run at once on one Mac and start colliding over simulators, destinations, and build state.'
failureClass: 'concurrent process contention / shared-state collisions'
fit: strong
fitNote: 'Strong fit'
category: state
queries:
  - 'multiple xcodebuild processes same mac'
  - 'two xcodebuild runs at once conflict'
  - 'concurrent xcodebuild simulator collision'
  - 'serialize xcodebuild jobs macos'
related:
  - 'coding-agents-ios-simulator-tests'
  - 'fastlane-scan-parallel-testing-hang'
  - 'deriveddata-contamination-between-ios-test-runs'
order: 54
updated: 2026-06-03
---

## Symptom

More than one `xcodebuild` (or `simctl`) process is running at the same time on
one Mac, and they start interfering — runs hang, grab the same device, or
corrupt each other's output.

## What it usually looks like

- A Makefile target, a script, a watcher, and a manual run all fire `xcodebuild`
  concurrently.
- Two runs land on the **same simulator** (because both used a generic or
  by-name destination) and fight over it.
- One run boots or erases a device out from under another.
- `simctl`/CoreSimulator wedges right when several runs overlap. See
  [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- Failures correlate with how many runs are active, not with any one test.

## Why it happens / likely failure classes

The simulator subsystem and default build paths are **shared per user**, and
nothing coordinates independent callers:

- **One CoreSimulatorService** mediates all simulator work; uncoordinated
  concurrent operations contend for its locks.
- **Devices are global state** — one run's boot/erase/shutdown affects any other
  run using that device.
- **Implicit destinations collide** when two runs resolve `generic/platform=iOS
  Simulator` or the same device by name. See
  [xcodebuild hangs resolving the destination](/failures/xcodebuild-hangs-resolving-simulator-destination/).
- **Shared `DerivedData` / result paths** overwrite each other. See
  [DerivedData contamination](/failures/deriveddata-contamination-between-ios-test-runs/).
- **No backpressure** — nothing stops the Nth run from starting on a saturated
  host.

## Quick checks

```sh
# How many simulator-related processes are running right now?
pgrep -lf 'xcodebuild|simctl|Simulator'

# Are multiple runs sharing one booted device?
xcrun simctl list devices | grep -i booted

# Is the subsystem still responsive under the load?
time xcrun simctl list devices available
```

If failures cluster when several of these are active at once, this is
contention, not flaky tests.

## Manual mitigations

- **Serialize simulator work** so one job runs at a time — e.g. a file lock so
  others queue instead of colliding:

  ```sh
  (
    flock -w 1800 9 || { echo "another run holds the lock"; exit 1; }
    xcodebuild test -scheme YourScheme \
      -destination "platform=iOS Simulator,id=<UDID>"
  ) 9>/tmp/xcsim.lock
  ```

- **Pin each run to its own device by UDID** — never a generic/by-name
  destination shared across runs.
- **Isolate artifacts** per run (`-derivedDataPath`, `-resultBundlePath`).
- **Cap concurrency** so the host is not saturated, and clean up between runs.

These work but become a pile of glue to maintain — which is the gap XCSteward
aims to fill.

## When XCSteward may help

Coordinating concurrent work on one Mac is a core design goal:

- A **single controlled execution lane with a queue**, so independent callers
  submit jobs that run in a coordinated order instead of colliding.
- **Guardrails** that stop two runs from grabbing the same device or hammering
  CoreSimulator at once.
- **Isolated artifacts** and **deterministic cleanup** so overlapping runs do
  not corrupt each other.

A strong candidate to test against this class of failure.

## When XCSteward probably will not help

- It does not make your **tests themselves** parallel-safe — shared backends or
  fixtures are your responsibility.
- It is **not a distributed grid**; it coordinates work on one Mac, it does not
  add machines.
- It will not fix genuinely **broken tests** that fail on their own.
