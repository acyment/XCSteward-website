---
title: 'fastlane scan hangs after tests finish'
description: 'fastlane scan (and xcodebuild) complete all tests but the process never exits — it hangs at teardown, result bundle, or simulator shutdown. Causes and where XCSteward may help.'
symptom: 'All tests pass, but fastlane scan never exits — it hangs after the last test during teardown, result-bundle writing, or simulator shutdown.'
failureClass: 'post-test teardown / result-bundle / simulator shutdown stall'
fit: partial
fitNote: 'Partial fit'
queries:
  - 'fastlane scan hangs after tests'
  - 'fastlane scan never exits'
  - 'xcodebuild test hangs after tests pass'
  - 'scan stuck after test run complete'
related:
  - 'simulator-booted-tests-never-start'
  - 'coresimulatorservice-deadlock'
  - 'simctl-commands-not-responding'
order: 40
updated: 2026-06-03
---

## Symptom

The tests themselves finish — you can see all of them pass in the log — but
`fastlane scan` (which drives `xcodebuild`) never returns control. The process
sits there after the last test, and eventually a CI-like job times out or you
cancel it manually.

## What it usually looks like

- Log shows `Test Suite '...' passed`, then nothing for a long time.
- The hang is during **teardown**: writing the `.xcresult` bundle, collecting
  coverage/logs, or shutting the simulator down.
- `scan` may print that it is generating the report or be silent entirely.
- Exit is delayed by exactly your timeout, or never happens.
- Adding more devices / parallel testing makes it worse.

## Why it happens / likely failure classes

The tests passing tells you the *test execution* path is fine. The stall is in
what happens **after**:

- **Result bundle / report generation.** Large `.xcresult` bundles, coverage
  processing, or `scan`'s own report formatters can stall, especially with lots
  of attachments or screenshots.
- **Simulator shutdown / cleanup.** `xcodebuild` (or `scan`) tries to shut down
  or clean up the simulator and blocks on an unresponsive
  `CoreSimulatorService`. See
  [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- **A child process that never exits.** The app under test, a spawned helper, or
  a lingering `simctl` keeps the run from completing.
- **`-parallel-testing` cloning teardown.** Parallel test clones have to be torn
  down; if one clone wedges, the whole run waits.
- **Output buffering / no TTY** in CI-like contexts occasionally makes a finished
  run look hung when it is really flushing.

## Quick checks

```sh
# Watch what the run is actually doing while it "hangs"
sample $(pgrep -n xcodebuild) 5 -mayDie 2>/dev/null

# Are simulators stuck mid-shutdown?
xcrun simctl list devices | grep -i 'booting\|shutting'

# Lingering test/helper processes after "completion"?
pgrep -lf 'xcodebuild|simctl|Simulator|YourAppName'
```

Try the same scheme with `xcodebuild` directly (no `scan`) to learn whether the
stall is in `xcodebuild`/CoreSimulator or in `scan`'s post-processing:

```sh
xcodebuild test -scheme YourScheme \
  -destination "platform=iOS Simulator,id=<UDID>" \
  -resultBundlePath /tmp/run.xcresult
```

## Manual mitigations

- **Add a hard timeout** around the whole invocation so a teardown stall fails
  fast instead of hanging your pipeline:

  ```sh
  # GNU coreutils timeout (brew install coreutils → gtimeout)
  gtimeout 1200 bundle exec fastlane scan || echo "scan timed out"
  ```

- **Shut the simulator down explicitly after the run** rather than relying on
  teardown:

  ```sh
  xcrun simctl shutdown all
  ```

- **Reduce result-bundle weight** — fewer screenshots/attachments, trim coverage
  scope — if report generation is the slow part.
- **Run on one device at a time** to rule out parallel-clone teardown.
- **Restart CoreSimulatorService** before the next run if shutdown wedged (see
  [simctl not responding](/failures/simctl-commands-not-responding/)).

## When XCSteward may help

This is a partial fit — XCSteward focuses on the **execution and
simulator-lifecycle** parts of the problem, which is where many of these stalls
actually live:

- A **bounded teardown/shutdown** step with a timeout, so a post-test simulator
  shutdown that wedges becomes a clean failure and recovery instead of an open
  hang.
- **Deterministic cleanup** of simulators and lingering processes after a run, so
  the next run starts from a known-good state.
- A **single execution lane** so parallel runs are not fighting over
  CoreSimulator during teardown.
- **Isolated artifacts** per run so result bundles do not collide.

It is worth testing against this class of failure when the hang is in simulator
shutdown or process cleanup.

## When XCSteward probably will not help

- If the stall is **inside `fastlane scan`'s own report generation** (its Ruby
  formatters, not the simulator), that is `scan`'s domain — XCSteward does not
  reimplement it.
- It does not fix a **test or app that never terminates a thread/process** by
  design; that is an app-level bug.
- It is not a replacement for `fastlane`; it governs how the run is executed and
  cleaned up around it.
