---
title: 'No devices found for the iOS simulator in CI'
description: 'A CI or CI-like Mac run fails with no matching iOS simulator devices found. Why runner environments differ, quick checks, and where XCSteward may and may not help.'
symptom: 'A CI or CI-like Mac job fails with no iOS simulator devices found for the destination, even though it works on a developer machine.'
failureClass: 'destination availability in runner environments'
fit: partial
fitNote: 'Partial fit'
category: ci
queries:
  - 'no devices found ios simulator ci'
  - 'no simulator devices on ci runner'
  - 'xcodebuild no destinations ci'
  - 'ci simulator runtime not available'
related:
  - 'xcodebuild-destination-unavailable'
  - 'github-actions-ios-simulator-hang'
  - 'unable-to-boot-the-simulator'
order: 70
updated: 2026-06-03
---

## Symptom

The same command that runs locally fails on a CI (or CI-like) Mac: no iOS
simulator devices match the destination, so testing never starts. The runner's
device set is not what your command assumes.

## What it usually looks like

- `Unable to find a device matching the provided destination specifier` on the
  runner, but not on your laptop.
- `-showdestinations` on the runner lists a different set of devices/OS versions
  than you expected.
- A by-name destination (`name=iPhone 16`) that exists locally is missing on the
  runner image.
- The selected Xcode on the runner is not the one whose simulators you assumed.

## Why it happens / likely failure classes

Runner environments are provisioned differently from a developer Mac:

- **Different installed runtimes.** The runner image ships specific iOS
  runtimes; the device/OS you target may not be present. If so, this is a
  provisioning gap, not an execution one — see
  [xcodebuild destination unavailable](/failures/xcodebuild-destination-unavailable/).
- **Different (or multiple) Xcode versions** selected via `xcode-select`, each
  with its own simulators.
- **A clean/ephemeral environment** with no pre-created devices matching your
  by-name specifier.
- **Devices in an unavailable state** on the image, filtered out of eligibility.
- This is about destination *availability* — distinct from a destination that
  exists but is slow to boot.

## Quick checks

Run these **on the runner** (add them as a CI step):

```sh
# What Xcode is selected, and what does it actually have?
xcode-select -p
xcrun simctl list runtimes
xcrun simctl list devices available

# What destinations does the runner consider valid?
xcodebuild -showdestinations -scheme YourScheme -workspace YourApp.xcworkspace
```

If the runtime you target is absent from `simctl list runtimes`, the device
cannot exist — fix provisioning first.

## Manual mitigations

- **Select the right Xcode** explicitly on the runner before building:

  ```sh
  sudo xcode-select -s /Applications/Xcode_16.2.app
  ```

- **Create the device you need** from a runtime the image has:

  ```sh
  xcrun simctl create "ci-iPhone" "iPhone 16" "iOS18.2"
  ```

- **Resolve to a UDID at runtime** instead of hardcoding a device name that may
  not exist on the image.
- **Install the runtime** if your CI provider supports it (recent Xcode:
  `xcodebuild -downloadPlatform iOS`).

## When XCSteward may help

This is a partial fit. XCSteward is designed to run against a **concrete,
verified destination**, so on a Mac runner it can:

- Run a **readiness/preflight check** that confirms a usable device exists before
  the job proceeds, turning "no devices found" into an early, clear failure with
  the actual device list — instead of a confusing mid-pipeline error.
- **Resolve and pin a UDID** from what the runner actually has, rather than
  trusting a by-name specifier.

It is most useful for the **operational** side once a suitable runtime exists on
the runner.

## When XCSteward probably will not help

- If the runner **lacks the runtime entirely**, that is a provisioning problem —
  XCSteward cannot install OS runtimes for you.
- It does not manage your CI image, Xcode installation, or provider
  configuration.
- It does not fix code signing, missing toolchains, or vendor image bugs.
