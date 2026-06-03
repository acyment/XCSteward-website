---
title: 'DerivedData contamination between iOS test runs'
description: 'iOS test runs interfere through shared DerivedData, result bundles, or logs — stale builds and overwritten artifacts. Quick checks, isolation tips, and where XCSteward may help.'
symptom: 'Test runs interfere through shared DerivedData, result bundles, or logs — you get stale builds, overwritten .xcresult, or results from the wrong run.'
failureClass: 'shared artifacts / DerivedData contamination'
fit: strong
fitNote: 'Strong fit'
category: state
queries:
  - 'deriveddata contamination between test runs'
  - 'xcodebuild stale deriveddata test results'
  - 'xcresult overwritten parallel runs'
  - 'isolate deriveddata per test run'
related:
  - 'multiple-xcodebuild-processes-same-mac'
  - 'simulator-fails-after-previous-run'
  - 'fastlane-scan-hangs-after-tests'
order: 50
updated: 2026-06-03
---

## Symptom

Runs interfere through shared on-disk state. You see stale builds, an
`.xcresult` that belongs to a different run, missing or clobbered logs, or
results that do not match the code you just changed.

## What it usually looks like

- Two runs writing to the **same `DerivedData`** step on each other; one fails to
  build or picks up stale products.
- A shared `-resultBundlePath` gets **overwritten**, so the bundle you open is
  from the wrong run.
- Coverage or logs are missing/partial because another run truncated them.
- "It passed locally" but the artifact you inspect tells a different story.
- Symptoms get worse the more runs happen in parallel on one Mac.

## Why it happens / likely failure classes

The default paths are **shared and global**, which is fine for one run at a time
and fragile otherwise:

- **Default `DerivedData`** (`~/Library/Developer/Xcode/DerivedData`) is shared
  across invocations unless you override it. Concurrent builds collide there.
- **Fixed result-bundle / log paths** mean a second run overwrites the first.
- **Incremental build state** carried between unrelated runs produces stale
  products.
- **Concurrency** turns all of the above from "rare" into "frequent". See
  [multiple xcodebuild processes on one Mac](/failures/multiple-xcodebuild-processes-same-mac/).
- This is an artifact/state problem, **not** a test-correctness problem — the
  tests themselves may be fine.

## Quick checks

```sh
# Are multiple runs sharing the default DerivedData right now?
ls -la ~/Library/Developer/Xcode/DerivedData
pgrep -lf xcodebuild

# Confirm each run can take its own DerivedData + result bundle
xcodebuild test -scheme YourScheme \
  -destination "platform=iOS Simulator,id=<UDID>" \
  -derivedDataPath "/tmp/dd-$RUN_ID" \
  -resultBundlePath "/tmp/result-$RUN_ID.xcresult"
```

## Manual mitigations

- **Give every run its own DerivedData and artifact paths:**

  ```sh
  RUN_ID=$(date +%s)-$$
  xcodebuild test -scheme YourScheme \
    -destination "platform=iOS Simulator,id=<UDID>" \
    -derivedDataPath "/tmp/dd-$RUN_ID" \
    -resultBundlePath "/tmp/result-$RUN_ID.xcresult"
  ```

- **Never point two concurrent runs at the same output paths.**
- **Clean up** per-run directories afterward so disk does not fill.
- If you must share `DerivedData`, **serialize** the runs so only one writes at a
  time.

## When XCSteward may help

Per-run isolation of artifacts is one of XCSteward's core design goals:

- **Isolated DerivedData, logs, `.xcresult`, and JSON summaries per job**, so
  runs cannot overwrite or read each other's state.
- A **single execution lane / queue** so concurrent runs do not contend for
  shared build state in the first place.
- **Deterministic cleanup** of per-run directories after a job completes.

A strong candidate to test against this class of failure, particularly when
several runs share one Mac.

## When XCSteward probably will not help

- If your **tests share external state** (a backend, a database, fixtures on
  disk outside DerivedData) that collides across runs, that is your
  responsibility to isolate.
- It does not fix **incorrect build settings** that produce stale products on
  their own.
- It is not a build-cache product; it isolates and cleans up paths, it does not
  speed up compilation.
