---
title: 'xcodebuild timed out waiting for the simulator'
description: 'xcodebuild fails with a timeout waiting for the simulator to boot or become ready. Likely causes, quick checks, manual mitigations, and where XCSteward may help.'
symptom: 'xcodebuild aborts with a timeout waiting for the simulator to boot or to be ready, instead of running the tests.'
failureClass: 'boot/readiness timeout'
fit: strong
fitNote: 'Strong fit'
category: readiness
queries:
  - 'xcodebuild timed out waiting for simulator'
  - 'timed out waiting for the simulator to boot'
  - 'timed out waiting for simulator to be ready'
  - 'xcodebuild failed to boot simulator timeout'
  - 'xcodebuild simulator boot timeout'
  - 'failed to background test runner timeout simulator'
related:
  - 'unable-to-boot-the-simulator'
  - 'simulator-booted-tests-never-start'
  - 'xcodebuild-hangs-resolving-simulator-destination'
order: 14
updated: 2026-06-09
---

## Symptom

The run gets far enough to start bringing up a simulator, then `xcodebuild`
gives up with a **timeout** — it waited for the device to boot or become ready
and the deadline passed before that happened.

## What it usually looks like

- Errors mentioning a timeout: `Timed out waiting for ... to boot`, `Timed out
  waiting for the simulator to be ready`, or a test-runner launch that times out.
- The device may be left in `Booting` and never reaches `Booted`.
- It is intermittent — slower on the first run after a reboot, Xcode update, or
  runtime install, and more likely when the machine is busy.
- Bumping a launch/boot timeout sometimes "fixes" it, which is a sign the device
  was just slow to become ready, not broken.

## Why it happens / likely failure classes

A boot or readiness step did not finish inside the allotted time:

- **Cold start cost.** First boot after a reboot/update warms a lot of state and
  can exceed a default timeout.
- **Device never finishes booting** — stuck in `Booting`, often because the
  subsystem underneath is slow or wedged. See
  [unable to boot the simulator](/failures/unable-to-boot-the-simulator/).
- **CoreSimulator under load or contention.** Other simulator work happening at
  the same time stretches boot/readiness past the deadline. See
  [multiple xcodebuild processes on one Mac](/failures/multiple-xcodebuild-processes-same-mac/).
- **Resource pressure** (CPU, RAM, disk) slowing the boot enough to trip the
  timeout.
- **Implicit boot during the run** — letting `xcodebuild` boot the device as
  part of the run gives it less slack than booting ahead of time.

## Quick checks

```sh
# Boot it yourself and time how long it actually takes to be ready
time (xcrun simctl boot <UDID>; xcrun simctl bootstatus <UDID> -b)

# Is it stuck in Booting, or does it reach Booted?
xcrun simctl list devices | grep -i 'boot'

# Anything else hammering the subsystem while you boot?
pgrep -lf 'xcodebuild|simctl|Simulator'
```

If a manual boot takes longer than the timeout your run allows, the device is
simply slow to become ready — that is the thing to address.

## Manual mitigations

- **Boot ahead of time and block on readiness**, then run against the already
  booted device:

  ```sh
  xcrun simctl boot <UDID>
  xcrun simctl bootstatus <UDID> -b      # waits until boot completes
  xcodebuild test-without-building \
    -scheme YourScheme \
    -destination "platform=iOS Simulator,id=<UDID>"
  ```

- **Warm the device** with a throwaway launch so the test run is not paying the
  cold-start cost.
- **Run one simulator job at a time** so boot is not competing for the subsystem.
- **Free up resources** (close other simulators, check disk space) before a run.
- If the device repeatedly will not finish booting, erase and recreate it.

## When XCSteward may help

Bounding and verifying the boot/readiness window is a core design goal:

- **Deterministic boot + readiness checks** that wait for the device to be
  genuinely ready before handing off to `xcodebuild`, rather than racing an
  implicit boot against a timeout.
- A **single execution lane** so a boot is not slowed by other simulator
  activity, which is a common reason readiness misses the deadline.
- Clear **timeouts with recovery** so a device that truly will not boot fails
  fast and is reset, instead of repeatedly timing out mid-run.
- Compact **wait/watch output** for humans, plus `--json`, `--progress`,
  `status <job-id> --watch --json`, and `explain <job-id> --json` for agents
  that need a stable outcome and evidence path.

Worth testing against this class of failure, especially if timeouts cluster
under load or after cold starts.

## When XCSteward probably will not help

- If a device is **genuinely broken or its runtime is corrupt**, you may need to
  erase/recreate it or reinstall the runtime.
- It cannot make an underpowered or disk-starved machine boot faster beyond
  removing contention.
- It does not change `xcodebuild`'s own internal timeouts or fix a defect in a
  specific simulator runtime.
