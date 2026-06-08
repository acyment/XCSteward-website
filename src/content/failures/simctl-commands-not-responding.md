---
title: 'simctl commands not responding or hanging'
description: 'xcrun simctl list, boot, or shutdown hangs and never returns. Likely CoreSimulator causes, quick checks, safe recovery steps, and where XCSteward may help.'
symptom: 'xcrun simctl commands (list, boot, shutdown, spawn) hang indefinitely and never return — even simple ones like simctl list.'
failureClass: 'CoreSimulatorService unresponsive / simctl IPC stall'
fit: strong
fitNote: 'Strong fit'
queries:
  - 'simctl commands not responding'
  - 'xcrun simctl list hangs'
  - 'simctl boot hangs forever'
  - 'xcrun simctl shutdown all hangs'
  - 'simctl list devices never returns'
  - 'simctl not responding macos'
category: lifecycle
related:
  - 'coresimulatorservice-deadlock'
  - 'killing-simulator-does-not-fix-xcodebuild'
  - 'unable-to-connect-to-simulator'
  - 'xcodebuild-hangs-resolving-simulator-destination'
order: 30
featured: true
updated: 2026-06-08
---

## Symptom

A `simctl` command that should return almost instantly — often
`xcrun simctl list` — just hangs. No output, no error, no prompt. Boot and
shutdown commands stall the same way, and Ctrl-C may or may not get your shell
back.

## What it usually looks like

- `xcrun simctl list devices` produces nothing and never returns.
- `xcrun simctl boot <UDID>` hangs; the device may show as `Booting` forever in
  another `list` call (if that one even responds).
- `xcrun simctl shutdown all` hangs, so you cannot cleanly reset.
- The Simulator app may be open but frozen, or refuse to launch a device.
- Killing the command and retrying does nothing — the *next* `simctl` also hangs,
  which tells you the problem is the shared service, not your one command.

## Why it happens / likely failure classes

`simctl` is a thin client. The real work happens in
**`com.apple.CoreSimulator.CoreSimulatorService`**, a per-user daemon. When
`simctl` hangs, it is almost always blocked waiting on that service:

- **The service is wedged or deadlocked.** A previous operation left it in a bad
  state and it stops answering new requests. See
  [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- **Version mismatch.** The `CoreSimulator` framework and the running service
  disagree after an Xcode update or after switching Xcode versions with
  `xcode-select`. The service often logs a "running ... but ... is installed"
  style message before things get unreliable.
- **A device stuck mid-transition** (`Booting`, `Shutting Down`) holds a lock
  that later commands wait on.
- **Resource exhaustion / too many devices** make enumeration crawl to the point
  it looks hung.
- **Concurrent callers.** Multiple scripts, agents, or test runs hitting `simctl`
  at once can serialize behind the service and starve each other.

## Quick checks

```sh
# Is the service running, and is it the version you expect?
pgrep -lf CoreSimulatorService

# Which Xcode is selected? A mismatch here is a classic cause.
xcode-select -p
xcrun --find simctl

# Does a bounded call return, or truly hang?
#   (run in a fresh terminal; if THIS hangs, the service is the problem)
xcrun simctl list devices
```

If `xcode-select -p` points at a different Xcode than the one whose Simulator is
running, that mismatch alone can explain the stall.

## Manual mitigations

Escalate gently — try the least destructive step first.

1. **Shut everything down cleanly (if it responds):**

   ```sh
   xcrun simctl shutdown all
   ```

2. **Restart the CoreSimulator service.** This is the most common fix when
   `simctl` itself is hung. Quit Simulator.app first, then:

   ```sh
   killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true
   # launchd relaunches it on the next simctl call
   xcrun simctl list devices
   ```

3. **Make sure the selected Xcode matches the running service:**

   ```sh
   sudo xcode-select -s /Applications/Xcode.app
   ```

4. **Clear stale devices** once the service responds again:

   ```sh
   xcrun simctl delete unavailable
   ```

5. **Last resort:** log out and back in (the daemon is per-user) or reboot.

## When XCSteward may help

This is squarely the kind of operational fragility XCSteward targets. It can:

- Wrap `simctl` interactions with **timeouts**, so a hang becomes a fast, legible
  failure instead of a stuck terminal or job.
- Run a **readiness/health check** on the simulator subsystem before a test run
  and refuse to start if the service is not answering.
- **Serialize** simulator operations through one lane so concurrent agents and
  scripts do not wedge the shared service in the first place.
- Drive a **deterministic recovery** (shutdown → restart service → re-verify)
  instead of relying on you to remember the right `killall`.

Worth testing against this class of failure, especially if it happens under
concurrent or agent-driven workloads.

## When XCSteward probably will not help

- If a single, isolated `simctl` call hangs because the **runtime itself is
  broken or mid-download**, you still need a working runtime.
- It does not patch bugs inside CoreSimulator or a specific Xcode build.
- If your environment hangs only because of a hardware/disk problem, that is
  outside its scope.
