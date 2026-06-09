---
title: 'Unable to boot the iOS simulator'
description: 'simctl boot or Xcode fails with "Unable to boot device" or the simulator stays stuck in Booting. Likely causes, safe recovery steps, and where XCSteward may help.'
symptom: 'Booting a simulator fails outright ("Unable to boot device") or the device sits in Booting forever and never reaches Booted.'
failureClass: 'simulator boot failure'
fit: strong
fitNote: 'Strong fit'
category: readiness
queries:
  - 'unable to boot the simulator'
  - 'simctl unable to boot device'
  - 'Unable to boot device in current state Booted'
  - 'unable to boot device runtime bundle'
  - 'ios simulator stuck booting'
  - 'simulator will not boot macos'
related:
  - 'xcodebuild-timed-out-waiting-for-simulator'
  - 'simulator-booted-tests-never-start'
  - 'unable-to-connect-to-simulator'
order: 16
updated: 2026-06-09
---

## Symptom

Booting a device fails. Either `xcrun simctl boot` (or Simulator.app, or
`xcodebuild`) returns an error like `Unable to boot device`, or the device
enters `Booting` and stays there indefinitely without ever reaching `Booted`.

## What it usually looks like

- `Unable to boot device in current state: Booted` (it thinks it is already
  booted) or `Unable to boot device because we cannot determine the runtime
  bundle`.
- A device wedged at `Booting` in `xcrun simctl list devices`.
- `An error was encountered processing the command (domain=...
  NSPOSIXErrorDomain...)` from `simctl boot`.
- `launchd failed to respond`, `Failed to start launchd_sim`, or similar
  pre-test runner/bootstrap errors before XCTest attaches.
- A reboot temporarily fixes it; it comes back under load or after many runs.

## Why it happens / likely failure classes

The boot transition could not complete:

- **A previous boot/shutdown was interrupted**, leaving the device in a state it
  cannot boot out of. See
  [simulator fails after a previous run](/failures/simulator-fails-after-previous-run/).
- **CoreSimulatorService is unhealthy** — the daemon that performs the boot is
  slow or wedged, so the boot stalls. See
  [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- **Runtime problems** — a missing, partially downloaded, or mismatched runtime
  bundle (often after an Xcode update or version switch).
- **Too many booted devices / resource exhaustion** — disk or memory pressure
  causing the boot to fail.
- **Concurrent boots of the same device** from different callers racing each
  other.

When this happens before XCTest attaches, XCSteward classifies the job as
`runner_bootstrap_failure`, meaning runner or environment setup failed before
XCTest attached. That classification is separate from `test_failure`, because no
test execution really started.

## Quick checks

```sh
# Boot explicitly and wait — does it error, or hang in Booting?
xcrun simctl boot <UDID>
xcrun simctl bootstatus <UDID> -b

# Is the runtime actually present and not "unavailable"?
xcrun simctl list runtimes
xcrun simctl list devices | grep -i unavailable

# Is the subsystem responsive at all?
pgrep -lf CoreSimulatorService
```

If other `simctl` commands also hang, treat this as a subsystem problem first —
see [simctl not responding](/failures/simctl-commands-not-responding/).

## Manual mitigations

Escalate from least to most disruptive:

1. **Shut down and re-boot the device cleanly:**

   ```sh
   xcrun simctl shutdown <UDID>
   xcrun simctl boot <UDID>
   xcrun simctl bootstatus <UDID> -b
   ```

2. **Erase a device stuck in a bad state:**

   ```sh
   xcrun simctl shutdown <UDID> 2>/dev/null
   xcrun simctl erase <UDID>
   ```

3. **Restart CoreSimulatorService** if boots fail broadly (quit Simulator.app
   first):

   ```sh
   killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true
   ```

4. **Recreate the device** if it is corrupt:

   ```sh
   xcrun simctl delete <UDID>
   xcrun simctl create "iPhone 16" "iPhone 16" "iOS18.2"
   ```

## When XCSteward may help

Getting to a reliably booted device is exactly what XCSteward's readiness model
targets:

- A **deterministic boot step with readiness verification** (wait for `Booted`,
  confirm the device responds) before handing off, instead of an implicit boot
  that may fail without useful context.
- **Timeouts and recovery** so a device that will not boot is shut down/erased
  and retried, rather than leaving a half-booted device behind.
- A **single execution lane** so two runs do not try to boot the same device at
  once.
- **Cleanup between runs** so an interrupted boot does not poison the next one.
- **Watch/follow commands** so a long boot or cleanup phase can stay visible to
  a human, while agents keep using `--json`, `--progress`, and
  `explain <job-id> --json`.
- **Bootstrap failure classification** that preserves errors such as
  `Unable to boot the Simulator`, `NSPOSIXErrorDomain code=60`, or
  `Failed to start launchd_sim` with artifacts and a bounded remediation hint,
  such as shutting down or erasing the selected simulator before retrying once.
- **Pending-log handling** so `logs <job-id>` can say the combined log is still
  pending during queued/bootstrap setup instead of turning that state into an
  opaque missing-file error.

A strong candidate to test against this class of failure.

## When XCSteward probably will not help

- If the **runtime bundle is missing or corrupt**, you need to (re)install it —
  XCSteward cannot synthesize a runtime.
- It does not fix a genuinely **corrupt Xcode/Simulator installation** or a bug
  in a specific runtime image.
- Host-level **disk-full or memory** problems are outside its scope beyond
  reducing contention.
