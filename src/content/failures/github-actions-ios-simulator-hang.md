---
title: 'GitHub Actions iOS simulator job hangs'
description: 'An iOS test job on a GitHub Actions macOS runner hangs at simulator boot or destination resolution until it times out. Quick checks and where XCSteward may and may not help.'
symptom: 'An iOS test job on a macOS runner hangs at simulator boot or destination resolution and eventually hits the job timeout.'
failureClass: 'runner simulator boot/resolution stall'
fit: partial
fitNote: 'Partial fit'
category: ci
queries:
  - 'github actions ios simulator hang'
  - 'github actions xcodebuild stuck booting simulator'
  - 'macos runner simulator timeout'
  - 'github actions ios test job hangs'
related:
  - 'no-devices-found-ios-simulator-ci'
  - 'xcodebuild-timed-out-waiting-for-simulator'
  - 'unable-to-boot-the-simulator'
order: 72
updated: 2026-06-03
---

## Symptom

An iOS test job on a hosted macOS runner hangs. It does not error quickly — it
sits at simulator boot or destination resolution and runs until the job's
overall timeout kills it.

## What it usually looks like

- The log stops after a destination/boot line and produces nothing until the job
  is cancelled at the time limit.
- It passes on a developer machine but stalls on the runner.
- Re-running the job sometimes succeeds, which makes it look random.
- The failure is in *bringing up the simulator*, before any test output appears.

This is the same underlying failure class as
[xcodebuild timed out waiting for the simulator](/failures/xcodebuild-timed-out-waiting-for-simulator/)
and [unable to boot the simulator](/failures/unable-to-boot-the-simulator/),
seen inside a runner.

## Why it happens / likely failure classes

Hosted runners are clean, headless, and resource-bounded, which stresses
simulator bring-up:

- **Cold boots with no warm state** — the first boot on a fresh runner pays full
  cost and can exceed timeouts.
- **Limited resources** (CPU/RAM/disk) slowing boot or readiness.
- **Destination assumptions** that do not match the runner image — which can
  manifest as a stall while Xcode searches. See
  [no devices found in CI](/failures/no-devices-found-ios-simulator-ci/).
- **CoreSimulator slow or wedged** under the runner's constraints. See
  [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- This is not a flaw in GitHub Actions itself — it is the generic local
  simulator bring-up problem, running in a constrained environment.

## Quick checks

Add diagnostic steps to the job before the test step:

```sh
# What does the runner actually have?
xcode-select -p
xcrun simctl list runtimes
xcrun simctl list devices available

# Boot explicitly and wait, so a stall is visible and bounded
xcrun simctl boot "<UDID-or-name>"
xcrun simctl bootstatus "<UDID-or-name>" -b
```

If the explicit boot is what hangs, the problem is simulator readiness on the
runner — not your test target.

## Manual mitigations

- **Pin Xcode and a concrete device** the image actually has; resolve a UDID
  rather than trusting a by-name destination.
- **Boot and wait for readiness** as an explicit step before `xcodebuild`, so a
  stall is bounded and logged.
- **Add a step-level timeout** so a hang fails fast instead of burning the whole
  job budget.
- **Reduce parallelism** if the job spins up multiple simulators on a constrained
  runner. See [fastlane scan parallel testing hang](/failures/fastlane-scan-parallel-testing-hang/).

## When XCSteward may help

XCSteward runs on a Mac — including a CI Mac runner — and targets the
operational bring-up that tends to stall here:

- **Deterministic boot + readiness checks** before handing off, so a not-ready
  device fails fast instead of hanging to the job timeout.
- **Bounded timeouts with recovery** around boot/resolution.
- **Isolated artifacts and cleanup** so retries start clean.

Worth testing against this class of failure on self-hosted or
provision-controlled Mac runners where you can install it.

## When XCSteward probably will not help

- On **fully managed/ephemeral runners** you may not be able to install or
  persist a helper between jobs.
- If the runner **lacks the runtime** or the image has a bug, that is a
  provisioning/vendor issue — XCSteward cannot install runtimes or patch images.
- It does not address code signing, missing toolchains, or broken tests.
