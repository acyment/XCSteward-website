---
title: 'Unable to connect to the iOS simulator'
description: 'Tests fail to attach with "Unable to connect to" the simulator or the test runner never connects. Likely CoreSimulator causes, quick checks, and where XCSteward may help.'
symptom: 'The device is up but the run cannot connect to it — the test runner never attaches, or you see "Unable to connect to" / lost-connection errors.'
failureClass: 'test-runner / CoreSimulator connection failure'
fit: partial
fitNote: 'Partial fit'
category: lifecycle
queries:
  - 'unable to connect to simulator'
  - 'lost connection to test manager simulator'
  - 'Lost connection to the test manager service'
  - 'test runner never connects simulator'
  - 'xcodebuild test runner never attaches'
  - 'could not connect to simulator xcodebuild'
related:
  - 'simulator-booted-tests-never-start'
  - 'coresimulatorservice-deadlock'
  - 'simctl-commands-not-responding'
order: 34
updated: 2026-06-09
---

## Symptom

The device appears up, but the run cannot establish a connection to it. The
XCTest runner never attaches, or you get a connection / lost-connection error
partway through bringing up the tests.

## What it usually looks like

- Errors like `Unable to connect to "<device>"`, `Lost connection to the test
  manager service`, or the runner reporting it could not reach the test host.
- The app may install and even launch, but the test session never establishes.
- The device shows `Booted`, which makes it look like a test problem rather than
  a connection one.
- You see testmanagerd connection loss before XCTest attaches, so the run never
  reaches real test execution.
- Re-running sometimes connects; under load it fails more often.

## Why it happens / likely failure classes

Something between `xcodebuild`/the test host and the simulator's services did
not connect:

- **Booted but not actually ready.** Internal services (the bridge,
  `launchd_sim`) are still coming up, so the connection attempt is premature.
  See [simulator booted but tests never start](/failures/simulator-booted-tests-never-start/).
- **CoreSimulator is degraded.** The daemon that brokers these connections is
  slow or wedged. See [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- **A stale connection from a previous run** was not torn down and is
  interfering.
- **Contention.** Another run or `simctl` operation on the same device disrupts
  the connection handshake.
- **Device in a half-booted / inconsistent state** after an interrupted run.

XCSteward treats connection failures before XCTest attaches as
`runner_bootstrap_failure`: runner or environment setup failed before XCTest
attached. That keeps testmanagerd or launch-session failures separate from
actual test assertions and app-code regressions.

## Quick checks

```sh
# Wait for the device to be genuinely ready before expecting a connection
xcrun simctl bootstatus <UDID> -b

# Can the device launch a stock app at all right now?
xcrun simctl launch <UDID> com.apple.mobilesafari

# Is the subsystem healthy / is anything else touching this device?
pgrep -lf 'CoreSimulator|xcodebuild|simctl|launchd_sim'
```

If launching a stock app also fails, the device is not truly ready (or the
subsystem is wedged) — that is the real issue, not your test target.

## Manual mitigations

- **Wait for full readiness, then run** against the already-up device:

  ```sh
  xcrun simctl bootstatus <UDID> -b
  xcodebuild test-without-building -scheme YourScheme \
    -destination "platform=iOS Simulator,id=<UDID>"
  ```

- **Reset the device** to clear stale connection state:

  ```sh
  xcrun simctl shutdown <UDID>
  xcrun simctl boot <UDID>
  xcrun simctl bootstatus <UDID> -b
  ```

- **Run one thing at a time** against a given device — no concurrent launches or
  `simctl` calls during the handshake.
- If connections fail broadly, restart CoreSimulatorService (see
  [simctl not responding](/failures/simctl-commands-not-responding/)).

## When XCSteward may help

The gap between "booted" and "actually connectable" is part of what XCSteward's
readiness model targets:

- **Readiness checks** that confirm the device can launch and respond before the
  test session is expected to attach, so a premature connection is avoided.
- A **single execution lane** so no other run disrupts the connection handshake.
- **Timeouts and clean teardown** so a stale or failed connection is reset
  rather than left to interfere with the next run.
- **Structured inspection** through `status <job-id> --watch`,
  `explain <job-id> --json`, and `logs <job-id>`, so humans and agents can see
  whether the runner failed before XCTest attached. If the combined log is still
  pending during queued/bootstrap setup, `logs <job-id>` points back to
  `status <job-id> --watch` instead of failing as an opaque missing file.
- If the wait eventually times out before XCSteward observes XCTest attach/test
  execution evidence, the subtype is `pre_xctest_timeout` rather than a plain
  timed-out test case.

Worth testing against this class of failure when the connection problem tracks
with device readiness or contention rather than your test code.

## When XCSteward probably will not help

- If your **test host crashes or the app exits** before the session can attach,
  that is an app/test problem.
- It does not fix a defect in the simulator runtime or the test manager service
  itself.
- Connection failures caused by a **broken Xcode toolchain** need a toolchain
  repair, not orchestration.
