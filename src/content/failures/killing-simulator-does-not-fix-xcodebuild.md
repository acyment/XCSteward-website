---
title: 'Killing the Simulator app does not fix xcodebuild'
description: 'Quitting Simulator.app does not unstick xcodebuild because CoreSimulatorService is the real culprit. What to restart instead, and where XCSteward may help.'
symptom: 'You quit or force-kill Simulator.app, but xcodebuild and simctl stay wedged — the hang survives killing the app.'
failureClass: 'wrong process killed / CoreSimulatorService persistence'
fit: strong
fitNote: 'Strong fit'
category: lifecycle
queries:
  - 'killing simulator does not fix xcodebuild'
  - 'quit simulator still hangs xcodebuild'
  - 'force quit simulator app not working'
  - 'simulator killed but xcodebuild still stuck'
related:
  - 'coresimulatorservice-deadlock'
  - 'simctl-commands-not-responding'
  - 'simulator-fails-after-previous-run'
order: 36
updated: 2026-06-03
---

## Symptom

The usual reflex — quit or force-kill **Simulator.app** — does not help. After
killing the app, `xcodebuild` and `simctl` are still stuck, and a new run wedges
the same way.

## What it usually looks like

- You `killall Simulator` (or quit it from the Dock), relaunch, and the hang is
  exactly as before.
- `xcrun simctl list` still hangs even with no Simulator window open.
- Devices remain stuck in `Booting` / `Shutting Down` regardless of the app.
- Only a logout or reboot seems to clear it — which is heavier than it should be.

## Why it happens / likely failure classes

You are killing the wrong process. **Simulator.app is just a UI client.** The
state and lifecycle live in the daemon:

- **`com.apple.CoreSimulator.CoreSimulatorService`** is the per-user daemon that
  actually owns device state, boots, and IPC. If it is wedged, killing the app
  changes nothing. See
  [CoreSimulatorService deadlock](/failures/coresimulatorservice-deadlock/).
- **A device stuck mid-transition** holds a lock inside the service that the app
  has no control over.
- **`launchd` relaunches the service** on the next `simctl` call, so a wedged
  service keeps coming back in the same bad state until it is actually reset.
- The app and the service are different layers — the visible window is not where
  the hang lives.

## Quick checks

```sh
# Confirm the hang persists with no Simulator app running
killall Simulator 2>/dev/null
xcrun simctl list devices        # if this still hangs, it's the daemon

# Is the daemon present (and how long has it been up)?
pgrep -lf CoreSimulatorService

# Any devices stuck mid-transition?
xcrun simctl list devices | grep -i 'boot\|shutting'
```

## Manual mitigations

Restart the **service**, not just the app:

```sh
# 1) Quit the UI client
killall Simulator 2>/dev/null || true

# 2) Try a clean shutdown of all devices (may hang if fully wedged)
xcrun simctl shutdown all 2>/dev/null || true

# 3) Restart the actual culprit — launchd respawns it on next use
killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true

# 4) Verify recovery
xcrun simctl list devices

# 5) Clear stale state once responsive
xcrun simctl delete unavailable
```

If it re-wedges within minutes, suspect concurrent callers and stop them before
retrying. Logging out (the daemon is per-user) clears the most stubborn states
without a full reboot.

## When XCSteward may help

Knowing *what* to reset, and doing it deterministically, is part of XCSteward's
design:

- A **defined recovery routine** that targets CoreSimulatorService — not just
  the app — so you are not guessing which process to kill under pressure.
- **Readiness checks and timeouts** that catch a wedged service before a run
  and turn it into a fast failure plus recovery.
- A **single execution lane** so the service is not being wedged by concurrent
  callers in the first place.

Worth testing against this class of failure if "kill the app and retry" has
become part of your ritual.

## When XCSteward probably will not help

- If the wedge is caused by a **bug in a specific CoreSimulator/Xcode build**,
  restarting the service is a workaround, not a fix.
- It cannot resolve **host-level resource exhaustion** that keeps re-wedging the
  daemon.
- It does not repair a corrupt simulator installation.
