---
title: 'xcodebuild hangs resolving the simulator destination'
description: 'xcodebuild test stalls at "Resolving destination" or destination lookup before any test runs. Likely causes, quick checks, manual mitigations, and where XCSteward may help.'
symptom: 'xcodebuild stalls while resolving or selecting a simulator destination — sometimes for minutes — before a single test runs.'
failureClass: 'destination resolution / CoreSimulator enumeration'
fit: strong
fitNote: 'Strong fit'
queries:
  - 'xcodebuild hangs resolving simulator destination'
  - 'xcodebuild stuck resolving destination'
  - 'xcodebuild test hangs before tests start'
  - 'xcodebuild stuck before Testing started'
  - 'xcodebuild hangs at Resolving destination specifier'
  - 'xcodebuild generic/platform=iOS Simulator slow'
category: readiness
related:
  - 'xcodebuild-destination-unavailable'
  - 'xcodebuild-timed-out-waiting-for-simulator'
  - 'simctl-commands-not-responding'
  - 'simulator-booted-tests-never-start'
order: 10
featured: true
updated: 2026-06-08
---

## Symptom

You run `xcodebuild test` (or `build-for-testing` / `test-without-building`) and
the command sits at destination resolution for a long time — sometimes seconds,
sometimes minutes — without ever starting a test. The terminal looks alive but
nothing is happening.

## What it usually looks like

Common signatures:

- A long pause after a line like `Resolving destination specifier` or right
  before `Testing started`.
- The build itself finished, but the run never progresses to launching the app.
- An eventual error such as
  `Unable to find a destination matching the provided destination specifier`,
  or it simply hangs until you cancel.
- Using `-destination 'generic/platform=iOS Simulator'` and watching Xcode pick
  "some" device that may not be booted or even downloaded.
- Re-running immediately sometimes works, which makes it feel random.

## Why it happens / likely failure classes

This is usually **destination resolution**, not your tests. `xcodebuild` has to
turn your `-destination` string into a concrete, usable simulator. To do that it
talks to CoreSimulator and enumerates devices and runtimes. Several things can
make that slow or stuck:

- **Ambiguous or generic destinations.** `generic/platform=iOS Simulator` or a
  by-name match (`name=iPhone 15`) forces Xcode to search and choose. If many
  devices match, or the matching device is in a bad state, selection drags.
- **CoreSimulator enumeration is slow or wedged.** A large pile of stale devices,
  a `simctl`/`CoreSimulatorService` process in a bad state, or a runtime that is
  mid-download can make device listing crawl. See
  [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- **First-run / cold tooling.** After an Xcode update, a Simulator runtime
  install, or a reboot, the first resolution pays a one-time cost.
- **A "matching" device that cannot actually boot** (missing runtime, corrupt
  device) — Xcode keeps trying.
- **Concurrent activity.** Another `xcodebuild`, a Simulator.app launch, or a
  script calling `simctl` at the same moment can serialize behind shared
  CoreSimulator state and stretch resolution into a hang.

## Quick checks

Run these in a clean terminal to see whether the simulator subsystem is healthy:

```sh
# Does device enumeration itself return promptly?
time xcrun simctl list devices available

# What does Xcode think your destinations are? (slow here ≈ resolution problem)
xcodebuild -showdestinations -scheme YourScheme -workspace YourApp.xcworkspace

# Is anything already holding the simulator subsystem busy?
pgrep -lf CoreSimulator
pgrep -lf 'xcodebuild|simctl|Simulator'
```

If `simctl list` is itself slow, the problem is below `xcodebuild` — treat it as
a CoreSimulator/`simctl` issue first.

## Manual mitigations

- **Pin a specific, known-good destination by UDID** instead of a generic or
  by-name specifier:

  ```sh
  xcrun simctl list devices available   # copy the UDID
  xcodebuild test -scheme YourScheme \
    -destination "platform=iOS Simulator,id=<UDID>"
  ```

- **Boot the device first and wait for it** before invoking `xcodebuild`, rather
  than letting resolution boot it implicitly:

  ```sh
  xcrun simctl boot <UDID>
  xcrun simctl bootstatus <UDID> -b   # blocks until booted
  ```

- **Prune stale devices** so enumeration has less to scan:

  ```sh
  xcrun simctl delete unavailable
  ```

- **Reset the subsystem** when it is clearly wedged (kills running sims):

  ```sh
  xcrun simctl shutdown all
  killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true
  ```

- **Serialize.** Make sure no other test run, agent, or Simulator launch is
  touching the simulators at the same time.

## When XCSteward may help

This is one of the failure classes XCSteward is designed for. It can:

- Resolve to a **concrete, pinned destination** up front and verify it is
  bootable, instead of leaving Xcode to pick during the run.
- Run a **readiness check** (device booted, runtime present, subsystem
  responsive) before handing off to `xcodebuild`, so a slow or stuck resolution
  surfaces as a clear failure rather than an open-ended hang.
- Apply a **timeout** to the resolution/boot phase and recover, rather than
  blocking your terminal or CI-like job indefinitely.
- Provide a **single execution lane** so two runs do not collide inside
  CoreSimulator and turn a slow resolution into a deadlock.

It is worth testing against this class of failure if your hangs happen *before*
tests start.

## When XCSteward probably will not help

- If resolution succeeds quickly and the hang is *after* launch (app won't start,
  tests never begin), that is a different problem — see
  [simulator booted but tests never start](/failures/simulator-booted-tests-never-start/).
- If the destination genuinely does not exist (missing runtime you never
  installed), you need to install the runtime; XCSteward will only tell you
  sooner, not create it.
- It does not fix a corrupt Xcode/Simulator install or a vendor runtime bug.
