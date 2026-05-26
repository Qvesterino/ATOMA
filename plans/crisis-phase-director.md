# Crisis Phase Director — Implementation Plan

## Overview

The existing [`DoctrineRuntime`](src/doctrine/DoctrineRuntime.js:27) acts as a simple trigger authority: it checks metrics every 2s and emits `crisis:start` / `crisis:tick` / `crisis:end`. The **CrisisPhaseDirector** subscribes to these events and manages a rich phased lifecycle with player agency, world-specific grammar, and outcome-based rewards.

## Architecture

```
DoctrineRuntime          CrisisPhaseDirector              Existing Systems
     |                         |                                  |
     |-- crisis:start -------->|-- phase:INTRO (2-3s signal)     |
     |                         |-- phase:SURGE (active pressure) |
     |                         |-- phase:PEAK (max pressure)      |
     |                         |-- phase:DECAY (evaluate)         |
     |-- crisis:end ---------->|-- phase:RESOLVED (reward/fail)    |
     |                         |                                  |
     |                         |-- modifies NetworkTensionRuntime  |
     |                         |-- modifies VisualNetworkTimeScore |
     |                         |-- drives GameplayHintLayer        |
     |                         |-- drives CollapseReadabilityDir   |
```

## Phase Lifecycle

Each crisis has 5 phases with configurable durations per world:

| Phase | Purpose | Player Agency |
|-------|---------|---------------|
| **INTRO** | Signal/warning — HUD shows incoming crisis | Prepare, no mechanical change yet |
| **SURGE** | Active pressure window — metrics shift | Reinforce, reroute, abandon, build links |
| **PEAK** | Maximum pressure — shortest window | Last-chance actions, stabilize or brace |
| **DECAY** | Pressure falls — evaluate response | None (evaluation window) |
| **RESOLVED** | Outcome determined — apply reward/fail | None (consequence applied) |

## World-Specific Crisis Grammar

### Quantum Island (burst-oriented)
- Fast phases: intro 1.5s, surge 3s, peak 2s, decay 2s
- Sharp asymmetries: loadPressure spikes on one side of network
- Strong reroute payoff: creating a new link during surge gives 2x relief
- Split-window: during peak, player has 2s to choose between two actions
- Crisis types favored: `resonance_surge`, `pressure_rupture`

### Dream Desert (slow-burn)
- Slow phases: intro 3s, surge 6s, peak 4s, decay 3s
- Longer choke windows: chokepoint scores build gradually
- Reinforce/anchor discipline: reinforce duration 1.3x longer, stability cost 0.8x
- Crisis types favored: `anchor_collapse`, `integrity_fracture`

## Player Agency Tracking

During SURGE and PEAK, the director tracks:

| Action | Score Impact | Threshold |
|--------|-------------|-----------|
| Reinforce threatened corridor | +2 | Must be on hotspot link |
| Reroute (create link relieving hotspot) | +3 | Must match `network:hotspotRelieved` |
| Abandon threatened corridor | +1 | Must match `network:corridorAbandoned` |
| Create any new link | +0.5 | Any link during active crisis |
| Relieve hotspot via other means | +1 | `network:tensionRecovered` event |
| Stabilize node (stability > 0.6) | +0.5 | Per node stabilized during crisis |
| Let collapse happen | -1 | `network:fractureResidueCreated` |

**Outcome thresholds:**
- `responseScore >= 4` → **SURVIVED** — temporary buff + crisis mastery +1
- `responseScore >= 2` → **PARTIAL** — no buff, no penalty
- `responseScore < 2` → **FAILED** — temporary corruption bloom + world mutation unlock

## Crisis Mastery Progression

Per-crisis-type tracking:
- `survivedCount`: times survived this crisis type
- `failedCount`: times failed this crisis type
- `bestResponseScore`: highest response score achieved

Effects:
- Each survived crisis makes the next trigger of that type slightly harder (threshold +0.02)
- Each survived crisis improves reward quality (+0.05 temporary synergy buff)
- Failed crises unlock "world mutations" (positive framing: the world teaches you)

## Reward / Consequence System

### Survived
- Temporary `crisisSurgeBuff`: +0.08 synergy, +0.05 stability for 10s
- If mastery >= 3: buff duration extends to 15s
- Emit `crisis:survived` with `{ crisisId, responseScore, masteryLevel }`

### Failed
- Temporary `crisisAftershock`: +0.06 corruption spread for 8s
- Unlock "world mutation" — positive framing, not punishment
- Emit `crisis:failed` with `{ crisisId, responseScore, unlockedMutation }`

## Files to Create / Modify

### NEW: `CrisisPhaseDirector.js`
Core system. Subscribes to `doctrine.crisis:start`, `doctrine.crisis:end`, `doctrine.crisis:tick` via semantic bus. Manages phase lifecycle, tracks player agency, evaluates outcomes, emits phase events.

Key API:
- `constructor({ semanticBus, networkTensionRuntime, visualNetworkTimeScore, gameplayHintLayer })`
- `update(dt)` — tick phase timer, evaluate transitions
- `getActiveCrisis()` → `{ crisisId, phase, timeInPhase, timeRemaining, intensity }`
- `getCrisisMastery(crisisId)` → `{ survivedCount, failedCount, bestResponseScore }`
- `getDebugSnapshot()`

### MODIFY: `NetworkTensionRuntime_v1.js`
- Add `setCrisisPhaseDirector(director)` method
- In `update()`, if crisis is active, apply crisis profile overrides:
  - Quantum: `tickPressureScale *= 1.3`, `rerouteReliefScale *= 1.4`
  - Desert: `reinforceDurationMs *= 1.3`, `reinforceStabilityCost *= 0.8`
- Emit `network:crisisPressure` event during peak phase

### MODIFY: `VisualNetworkTimeElasticity_v1.js`
- Add crisis gate impact: during active crisis PEAK phase, rewind synergy threshold temporarily raised by +0.05
- Add `_crisisGateOverrideUntil` field
- Listen for `crisis:phaseChanged` events

### MODIFY: `src/collapse/CollapseReadabilityDirector.js`
- Add `_onCrisisPhaseChanged(payload)` handler
- During crisis SURGE/PEAK, elevate all threat states by one level (strained → critical, critical → fracturing)
- Add crisis-specific threat reasons to REASON_REGISTRY

### MODIFY: `HUD/GameplayHintLayer.js`
- Add crisis phase hints:
  - `crisisIntro`: "{crisisLabel} incoming. Prepare your network."
  - `crisisSurge`: "{crisisLabel} active. Reinforce, reroute, or abandon threatened corridors."
  - `crisisPeak`: "{crisisLabel} peaking. Last chance to stabilize."
  - `crisisSurvived`: "Crisis survived. Network stabilizes with renewed strength."
  - `crisisFailed`: "Crisis overwhelmed the lattice. The world mutates in response."
- World-specific variants for Quantum and Desert

### MODIFY: `main.js`
- Instantiate `CrisisPhaseDirector` after `doctrineRuntime`
- Wire semantic bus subscriptions
- Pass `networkTensionRuntime_v1` and `visualNetworkTimeElasticity` references
- Add `crisisPhaseDirector.update(dt)` to appropriate scheduler tick

### MODIFY: `tests/GameplayLoopChecks.js`
- Add tests:
  1. CrisisPhaseDirector transitions through all 5 phases
  2. Player agency tracking scores reinforce/reroute/abandon correctly
  3. Quantum crisis has shorter phase durations than Desert
  4. Survived crisis grants temporary buff
  5. Failed crisis applies aftershock and unlocks mutation
  6. Crisis mastery progression increases threshold

## Event Contract

The CrisisPhaseDirector emits these semantic bus events:

| Event | Payload | When |
|-------|---------|------|
| `crisis:phaseChanged` | `{ crisisId, previousPhase, phase, intensity }` | Phase transition |
| `crisis:survived` | `{ crisisId, responseScore, masteryLevel, buffDuration }` | Crisis resolved successfully |
| `crisis:failed` | `{ crisisId, responseScore, aftershockDuration, unlockedMutation }` | Crisis resolved with failure |
| `crisis:playerAction` | `{ crisisId, action, scoreDelta }` | Player takes scored action |
| `crisis:intensity` | `{ crisisId, intensity }` | Intensity changes (0..1) |

And listens to:

| Event | Handler |
|-------|---------|
| `doctrine.crisis:start` | Start phased lifecycle |
| `doctrine.crisis:end` | Force resolve (if doctrine ends early) |
| `doctrine.crisis:tick` | Sync remaining time |
| `network:corridorReinforced` | +2 response score |
| `network:hotspotRelieved` | +3 response score |
| `network:corridorAbandoned` | +1 response score |
| `network:fractureResidueCreated` | -1 response score |
| `network:tensionRecovered` | +1 response score |
| `link.created` | +0.5 response score |

## Implementation Order

1. Write `CrisisPhaseDirector.js` (core system)
2. Modify `NetworkTensionRuntime_v1.js` (crisis profile overrides)
3. Modify `VisualNetworkTimeElasticity_v1.js` (crisis gate impact)
4. Modify `CollapseReadabilityDirector.js` (crisis threat elevation)
5. Modify `GameplayHintLayer.js` (crisis hints)
6. Modify `main.js` (instantiation and wiring)
7. Add tests to `GameplayLoopChecks.js`
8. Verify with `node --check`
9. Commit
