---
title: 'Simulator fails after a previous test run'
description: 'The first iOS test run passes but the next one fails or hangs because simulator state leaked between runs. Quick checks, cleanup steps, and where XCSteward may help.'
symptom: 'The first run is fine, but the next test run on the same simulator fails or hangs — state from the previous run leaked into this one.'
failureClass: 'stale device state between runs'
fit: strong
fitNote: 'Strong fit'
category: state
queries:
  - 'simulator fails after previous run'
  - 'second xcodebuild test run hangs'
  - 'simulator works first time then fails'
  - 'reset simulator between test runs'
related:
  - 'killing-simulator-does-not-fix-xcodebuild'
  - 'deriveddata-contamination-between-ios-test-runs'
  - 'unable-to-boot-the-simulator'
order: 52
updated: 2026-06-03
---

## Symptom

A run works once. The next run against the same simulator behaves differently —
it hangs, fails to launch, or errors in a way the first run did not. Something
from the previous run is still around.

## What it usually looks like

- First invocation passes; the second stalls at boot, install, or launch.
- The device is left `Booted` (or half-shut-down) from the previous run.
- Leftover app installs, processes, or a stale test session interfere with the
  new run.
- A full reset (erase or reboot) makes it work again — for one run.
- In a loop of runs, failures appear after the first and then intermittently.

## Why it happens / likely failure classes

The simulator carries state forward, and incomplete teardown leaves it dirty:

- **The previous run did not tear down cleanly** — the device stayed booted, an
  app stayed installed, or a process lingered.
- **A half-finished shutdown** left the device in a transitional state the next
  boot trips over. See
  [unable to boot the simulator](/failures/unable-to-boot-the-simulator/).
- **Accumulated data** (installed apps, caches, keychain, defaults) changes
  behavior between runs.
- **A lingering connection or test host** from the prior run interferes with the
  new session.
- Killing Simulator.app does not clear this — the state lives in CoreSimulator.
  See [killing the Simulator app does not fix xcodebuild](/failures/killing-simulator-does-not-fix-xcodebuild/).

## Quick checks

```sh
# After a run, what state is the device left in?
xcrun simctl list devices | grep -i 'boot\|shutting'

# Anything left running that belongs to the previous run?
pgrep -lf 'YourAppName|XCTest|testmanagerd'

# Does a clean erase between runs make the second run reliable?
xcrun simctl shutdown <UDID>; xcrun simctl erase <UDID>
```

If erasing between runs reliably fixes the second run, you have a state-leak
problem, not a test bug.

## Manual mitigations

- **Reset to a known-good state before each run:**

  ```sh
  xcrun simctl shutdown <UDID> 2>/dev/null || true
  xcrun simctl erase <UDID>
  xcrun simctl boot <UDID>
  xcrun simctl bootstatus <UDID> -b
  ```

- **Tear down explicitly after each run** rather than relying on implicit
  cleanup — shut the device down and confirm it reached `Shutdown`.
- **Use a fresh device per run** (create/boot/erase/delete) when isolation
  matters more than speed.
- Make sure no **leftover processes** from the previous run are still alive.

## When XCSteward may help

Starting each run from a known, clean state is central to XCSteward's design:

- **Deterministic cleanup between runs** — devices and processes torn down to a
  known state so the next run does not inherit the last one's mess.
- A **single execution lane** so runs do not overlap and leave each other dirty.
- **Readiness checks** that refuse to start on a device left in a bad state.
- **Isolated artifacts** so even on-disk outputs do not carry over. See
  [DerivedData contamination](/failures/deriveddata-contamination-between-ios-test-runs/).

A strong candidate to test against this class of failure.

## When XCSteward probably will not help

- If your **tests depend on order or shared external state** by design, that is
  a test-design issue, not an execution one.
- It does not repair a device whose **runtime is corrupt** — that needs a
  recreate/reinstall.
- It will not fix app behavior that genuinely changes based on prior data your
  test left behind on purpose.
