---
title: 'Coding agents running iOS simulator tests on one Mac'
description: 'When coding agents run iOS/macOS tests across multiple apps on one Mac, simulator runs collide and wedge. Why concurrency amplifies fragility, and where XCSteward may help.'
symptom: 'Coding agents and scripts run xcodebuild/Simulator tests concurrently on one Mac, and runs start colliding, wedging, and failing unpredictably.'
failureClass: 'concurrent simulator contention / shared-state collisions'
fit: strong
fitNote: 'Strong fit'
queries:
  - 'coding agents running ios simulator tests'
  - 'multiple xcodebuild runs same mac conflict'
  - 'ai agents ios tests simulator collisions'
  - 'parallel simulator tests wedge mac'
category: agents
related:
  - 'ai-coding-agent-xcodebuild-timeout'
  - 'multiple-xcodebuild-processes-same-mac'
  - 'coresimulatorservice-deadlock'
  - 'simctl-commands-not-responding'
order: 90
featured: true
updated: 2026-06-03
---

## Symptom

You have one or more coding agents (plus your own terminals, scripts, and maybe
a local CI-like job) running iOS/macOS tests on the same Mac. Individually each
run might be fine. Together they start colliding: runs hang, simulators wedge,
and failures stop being reproducible.

## What it usually looks like

- Two agents kick off `xcodebuild test` for **different apps** at the same time,
  and one or both stall.
- Devices end up in odd states — booted by one run, erased by another, shut down
  mid-test.
- `simctl` or the whole subsystem wedges right when activity peaks. See
  [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- Result bundles, logs, or `DerivedData` from different runs overwrite each
  other.
- Failures correlate with **how busy the Mac is**, not with any one test — the
  hallmark of a contention problem rather than a code problem.

## Why it happens / likely failure classes

This is the situation XCSteward was born from. The simulator subsystem is
**largely shared, per-user, and not designed for several uncoordinated drivers
at once**:

- **One CoreSimulatorService for the whole user session.** Every agent, script,
  and Simulator window funnels through it. Uncoordinated concurrent operations
  contend for its locks and can deadlock it.
- **Devices are shared global state.** One run booting, erasing, or shutting down
  a device can pull it out from under another run that assumed it was stable.
- **Implicit destinations collide.** Two runs using `generic/platform=iOS
  Simulator` or the same device by name can land on the *same* device. See
  [xcodebuild hangs resolving the destination](/failures/xcodebuild-hangs-resolving-simulator-destination/).
- **Shared artifact paths.** `DerivedData`, result bundles, and temp dirs collide
  when runs are not isolated.
- **No backpressure.** Nothing stops a fifth run from starting when the host is
  already saturated.

> Concurrency is an **amplifier**, not the sole cause. Each of these failures can
> happen in a single run — but multiple agents on one Mac make them frequent and
> hard to reason about.

## Quick checks

```sh
# How many simulator-related processes are running right now?
pgrep -lf 'xcodebuild|simctl|Simulator'

# Are multiple runs targeting the same device?
xcrun simctl list devices | grep -i booted

# Is the subsystem still responsive under load?
time xcrun simctl list devices available
```

If failures cluster when several of these are active at once, treat it as
contention, not flaky tests.

## Manual mitigations

- **Serialize simulator work.** Run one `xcodebuild`/simulator job at a time —
  e.g. a shell lock so agents queue instead of colliding:

  ```sh
  # crude global mutex around simulator runs
  (
    flock -w 1800 9 || { echo "another run holds the lock"; exit 1; }
    xcodebuild test -scheme YourScheme \
      -destination "platform=iOS Simulator,id=<UDID>"
  ) 9>/tmp/xcsim.lock
  ```

- **Give each run its own device by UDID**, never a generic/by-name destination.
- **Isolate artifacts** per run:

  ```sh
  xcodebuild test -scheme YourScheme \
    -destination "platform=iOS Simulator,id=<UDID>" \
    -derivedDataPath "/tmp/dd-$RUN_ID" \
    -resultBundlePath "/tmp/result-$RUN_ID.xcresult"
  ```

- **Cap concurrency** so the host is not saturated, and **clean up** devices and
  processes between runs.

These work, but they turn into a pile of glue you have to maintain — which is the
gap XCSteward aims to fill.

## When XCSteward may help

This is the central use case XCSteward is designed for:

- A **single controlled execution lane** with a **scheduler/queue**, so multiple
  agents and scripts submit runs that execute in a coordinated order instead of
  fighting over the subsystem.
- **Guardrails around unsafe concurrent activity** — preventing two runs from
  grabbing the same device or hammering CoreSimulator at once.
- **Readiness checks, timeouts, and deterministic cleanup** so one bad run does
  not poison the next.
- **Isolated artifacts** per run so logs and result bundles never collide.

If your pain shows up specifically when agents share a Mac, this is the class of
failure XCSteward most wants to be tested against.

## When XCSteward probably will not help

- It does not make your **tests themselves** parallel-safe — shared app state,
  fixtures, or backend data that collide across runs are your responsibility.
- It is not a distributed test grid; it coordinates work **on one Mac**, it does
  not add machines.
- It will not fix genuinely **broken or flaky tests** that fail on their own —
  see the [failure-mode library](/failures/) for where it does and does not fit.
