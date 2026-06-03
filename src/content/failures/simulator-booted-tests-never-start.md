---
title: 'iOS simulator booted but tests never start'
description: 'The simulator boots and shows the home screen, but xcodebuild never launches the app or begins testing. Likely causes, quick checks, and where XCSteward may help.'
symptom: 'The simulator boots and reaches the home screen, but the app never launches and testing never begins — the run just sits there.'
failureClass: 'post-boot readiness / app launch / test bundle install stall'
fit: strong
fitNote: 'Strong fit'
queries:
  - 'ios simulator booted but tests never start'
  - 'simulator boots but app does not launch'
  - 'xcodebuild test stuck after simulator boot'
  - 'simulator booted tests not running'
related:
  - 'xcodebuild-hangs-resolving-simulator-destination'
  - 'coresimulatorservice-deadlock'
  - 'fastlane-scan-hangs-after-tests'
order: 50
updated: 2026-06-03
---

## Symptom

The simulator boots fine — you can even see the home screen — but the run never
moves on to launching the app or starting tests. `xcodebuild` reports the device
as booted and then just waits.

## What it usually looks like

- Log shows the device reaching `Booted`, then a long pause with no
  `Testing started` / app launch.
- The app icon may install (or not), but it never opens.
- Occasionally an eventual error about launching the app, installing the test
  runner, or a timeout — but often just silence.
- First run after boot is worst; a warm device is sometimes fine.
- It feels like the device "isn't really ready" even though it says it is.

## Why it happens / likely failure classes

`Booted` is not the same as **ready to run tests**. There is a window after boot
where the simulator is still bringing up services. Stalls here usually come from:

- **Boot reported, services not up.** `SpringBoard` and other internal services
  are still initializing; an install/launch issued too early stalls.
- **Test bundle / runner install hangs.** Installing the app or the XCTest runner
  onto the device wedges (often CoreSimulator contention underneath). See
  [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- **The app launches but the test host never attaches** — the runner waits for a
  connection that does not come.
- **A modal/system prompt or first-launch dialog** blocks the UI on a fresh
  device.
- **Concurrency.** Another run or `simctl` call installing/launching on the same
  device at the same moment interferes with this one.
- **Cold-start cost** after a reboot, Xcode update, or runtime install.

## Quick checks

```sh
# Don't trust "Booted" — wait for boot to actually complete
xcrun simctl bootstatus <UDID> -b

# Can the device launch ANY app right now? (e.g. Mobile Safari)
xcrun simctl launch <UDID> com.apple.mobilesafari

# Is an install/launch already in flight from another caller?
pgrep -lf 'xcodebuild|simctl|launchd_sim'

# Inspect what the run is doing during the stall
sample $(pgrep -n xcodebuild) 5 2>/dev/null
```

If `simctl launch` of a stock app also hangs, the device is not truly ready (or
the subsystem is wedged) — that is the real problem, not your test target.

## Manual mitigations

- **Boot and block on readiness before testing**, then reuse the booted device:

  ```sh
  xcrun simctl boot <UDID>
  xcrun simctl bootstatus <UDID> -b      # wait for boot to complete
  xcodebuild test-without-building \
    -scheme YourScheme \
    -destination "platform=iOS Simulator,id=<UDID>"
  ```

- **Warm the device** with a throwaway launch so the test run is not the first
  thing to touch a cold simulator.
- **Run one thing at a time** on a given device — no parallel installs/launches.
- **Reset a flaky device** that repeatedly stalls at launch:

  ```sh
  xcrun simctl shutdown <UDID>
  xcrun simctl erase <UDID>
  ```

- If installs hang broadly, restart CoreSimulatorService (see
  [simctl not responding](/failures/simctl-commands-not-responding/)).

## When XCSteward may help

This gap between "booted" and "actually ready" is exactly what XCSteward's
readiness model is designed for:

- **Readiness checks** that go beyond `Booted` — confirming the device can
  install and launch before handing off to `xcodebuild`, so a not-ready device
  fails fast instead of hanging.
- **Timeouts** on the install/launch/attach phase, turning an open-ended stall
  into a recoverable failure.
- A **single execution lane** so no other run is installing or launching on the
  same device concurrently.
- **Deterministic boot + warm-up** as part of the run, instead of relying on
  implicit boot during resolution.

Worth testing against this class of failure when boot succeeds but the run never
progresses to tests.

## When XCSteward probably will not help

- If your **app crashes on launch** or a test's `setUp` hangs, that is an
  app/test bug — XCSteward gets the device ready but cannot make broken code run.
- A **first-launch system dialog** that needs dismissing is app/test
  responsibility (handle it in your UI test setup).
- It does not fix a missing/corrupt runtime that cannot host the app at all.
