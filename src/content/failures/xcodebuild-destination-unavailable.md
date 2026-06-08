---
title: 'xcodebuild destination unavailable or ineligible'
description: 'xcodebuild fails with "Unable to find a device matching the destination" or lists ineligible destinations before tests run. Causes, quick checks, and where XCSteward may help.'
symptom: 'xcodebuild errors out that the destination is unavailable or ineligible — no device matches the specifier — instead of running tests.'
failureClass: 'destination matching / device eligibility'
fit: partial
fitNote: 'Partial fit'
category: readiness
queries:
  - 'xcodebuild unable to find a device matching the destination'
  - 'xcodebuild ineligible destinations'
  - 'xcodebuild destination unavailable'
  - 'Ineligible destinations for scheme'
  - 'Unable to find a destination matching the provided destination specifier'
  - 'requested device could not be found simulator'
related:
  - 'xcodebuild-hangs-resolving-simulator-destination'
  - 'no-devices-found-ios-simulator-ci'
  - 'unable-to-boot-the-simulator'
order: 12
updated: 2026-06-08
---

## Symptom

`xcodebuild` does not hang — it fails fast with a destination error and never
starts testing. The message says it cannot find a device matching your
`-destination`, or it lists your intended device under "Ineligible
destinations".

## What it usually looks like

Common messages:

- `xcodebuild: error: Unable to find a device matching the provided destination
  specifier:` followed by your specifier.
- `The requested device could not be found because no available devices matched
  the request.`
- An `Ineligible destinations for the "<scheme>" scheme:` block listing a device
  with a reason (missing runtime, wrong platform, unavailable).
- It works on one machine and fails on another with the "same" Xcode.

This is different from
[xcodebuild hanging while resolving a destination](/failures/xcodebuild-hangs-resolving-simulator-destination/):
here you get a clear error rather than an open-ended stall.

## Why it happens / likely failure classes

The destination specifier did not match a usable device. Typical causes:

- **The named device does not exist** in this Xcode's device set (different
  device name, or it was deleted).
- **The runtime is missing or not installed** for that device — common after an
  Xcode update or on a fresh machine. (If the runtime is genuinely absent, this
  is an environment problem, not an execution one.)
- **Wrong or ambiguous specifier** — a typo, a stale UDID, or `OS=` pinned to a
  version you do not have installed.
- **The device is in an unavailable state** (corrupt, or its runtime was
  removed) so it is filtered out of the eligible set.
- **`xcode-select` points at a different Xcode** than the one whose simulators
  you expect.

## Quick checks

```sh
# What devices and runtimes actually exist for the selected Xcode?
xcrun simctl list devices available
xcrun simctl list runtimes

# What does Xcode consider a valid destination for your scheme?
xcodebuild -showdestinations -scheme YourScheme -workspace YourApp.xcworkspace

# Are you pointed at the Xcode you think you are?
xcode-select -p
```

If `simctl list runtimes` does not include the OS you are targeting, the
destination is unavailable because the **runtime** is missing — install it
before anything else.

## Manual mitigations

- **Target a concrete device by UDID** that you confirmed is available:

  ```sh
  xcrun simctl list devices available     # copy a UDID
  xcodebuild test -scheme YourScheme \
    -destination "platform=iOS Simulator,id=<UDID>"
  ```

- **Create the device** if the name/runtime combo you want is missing:

  ```sh
  xcrun simctl create "iPhone 16" "iPhone 16" "iOS18.2"
  ```

- **Install the missing runtime** (recent Xcode):

  ```sh
  xcodebuild -downloadPlatform iOS
  ```

- **Prune unavailable devices** so eligibility is computed against a clean set:

  ```sh
  xcrun simctl delete unavailable
  ```

## When XCSteward may help

This is a partial fit. XCSteward is designed to run against a **concrete,
verified destination**, so it can:

- Resolve and **pin a known-available device** up front, and surface a clear
  "this destination is not available" result before a run, rather than letting
  an implicit specifier fail mid-pipeline.
- Run a **readiness check** that confirms the chosen device exists and is
  bootable, so eligibility problems show up as an early, legible failure.

It is worth testing against this class of failure when the destination *exists
but keeps getting selected inconsistently* across runs.

## When XCSteward probably will not help

- If the **runtime is simply not installed**, you need to install it —
  XCSteward will tell you the destination is unavailable sooner, but it cannot
  download a runtime for you.
- If your specifier targets a device/OS that does not exist in your setup, that
  is a configuration fix, not an execution one.
- It does not change Xcode's eligibility rules or repair a corrupt install.
