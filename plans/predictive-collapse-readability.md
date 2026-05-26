# Predictive Collapse Readability — Implementation Plan

## Problem Statement

Collapse currently reads as "something broke" rather than "a situation I should have solved." The systems that detect failure (`CriticalNodeFailureSystem`, `CascadingRuptureSystem`, `HarmonicHubCollapseController`) operate in parallel and never converge into a single player-facing readability layer. The player sees visual stress, hears audio warnings, and receives generic soft-failure hints — but never gets a clear predictive signal that says:

- **Which** corridor is the problem
- **Why** it is the problem
- **What** they can do about it

## Goal

Make collapse a readable, solvable gameplay problem by introducing a unified 3-state predictive model and a lightweight contextual prompt system that reuses existing HUD/hint infrastructure.

---

## 1. Three-State Collapse Model

| State | Threshold | Player Signal | Action Window |
|-------|-----------|---------------|---------------|
| **strained** | Link quality < 0.4 OR node stability < 0.35 | Subtle visual pulse + ambient audio shift | Preventive: improve link quality, add redundancy |
| **critical** | Link quality < 0.2 OR node stability < 0.2 OR corruption > 0.6 | HUD prompt + localized FX + audio warning | Urgent: reroute load, reinforce chokepoint, break corruption chain |
| **fracturing** | Countdown active (`failureCountdown` = true) OR cascade propagation detected | Full-screen edge tint + explicit action prompt + countdown timer | Emergency: sever bad link, isolate node, or accept loss and reroute |

**Design principle:** Each state maps to a *verb* the player can execute, not just a noun describing damage.

---

## 2. System Architecture

### 2.1 CollapseReadabilityDirector (new file)

**Location:** `src/collapse/CollapseReadabilityDirector.js`

**Responsibilities:**
- Subscribe to existing systems via semantic bus (no polling)
- Classify links/nodes into `strained | critical | fracturing`
- Maintain a priority-ranked list of "top threats" (max 3)
- Emit readable events for HUD and hint layer consumption
- Provide debug snapshot for QA

**Event subscriptions:**
```
topology.rupture      → CascadingRuptureSystem
node.failure.warning  → CriticalNodeFailureSystem (new event)
link.corruption.high  → LinkCorruptionTransmission_v1
hub.overload          → HarmonicHubCollapseController
```

**Classification logic:**
```javascript
function classifyLinkThreat(link, metrics) {
  const quality = link.userData?.quality?.score ?? 1.0;
  const corruption = link.userData?.corruption ?? 0;
  const isCountdown = link.source?.userData?.failureCountdown || link.target?.userData?.failureCountdown;
  const isCascade = link.userData?.cascadeAffected;

  if (isCountdown || isCascade) return { state: 'fracturing', reason: resolveFracturingReason(link) };
  if (quality < 0.2 || corruption > 0.6) return { state: 'critical', reason: resolveCriticalReason(link) };
  if (quality < 0.4) return { state: 'strained', reason: resolveStrainedReason(link) };
  return null;
}
```

**Reason resolution (consistent semantic treatment):**
```javascript
const REASON_REGISTRY = {
  'quality-degraded': { text: 'Link quality degraded', action: 'Reinforce or reroute' },
  'corruption-spike': { text: 'Corruption spike detected', action: 'Break chain or isolate' },
  'chokepoint-overload': { text: 'Chokepoint overloaded', action: 'Add alternate route' },
  'node-countdown': { text: 'Node structural failure imminent', action: 'Sever or brace' },
  'cascade-propagating': { text: 'Cascade propagating through corridor', action: 'Isolate rupture zone' }
};
```

### 2.2 CriticalNodeFailureSystem — Add Warning Event

**Change:** Before starting the 3-second countdown, emit a `node.failure.warning` event on the semantic bus.

**Location:** `CriticalNodeFailureSystem.js`, in the detection loop before `startCountdown()`.

```javascript
this.semanticBus?.emit?.('node.failure.warning', {
  nodeId: node.id,
  node,
  reason: 'stability-critical',
  stability: nodeMetrics.stability,
  corruption: nodeMetrics.corruption,
  countdownDuration: CONFIG.FAILURE_COUNTDOWN_DURATION
});
```

This gives the readability director a 3-second predictive window before the actual sever.

### 2.3 HarmonicHubCollapseController — Emit Overload Event

**Change:** When `isInOverload` transitions from false → true, emit `hub.overload` event.

**Location:** `harmonic/HarmonicHubCollapseController.js`, in `update()`.

```javascript
const wasInOverload = this._wasInOverload;
this._wasInOverload = this.isInOverload;
if (!wasInOverload && this.isInOverload && this.semanticBus) {
  this.semanticBus.emit('hub.overload', {
    node: this.harmonicController?.node,
    collapseFactor: this.collapseFactor,
    phaseVariance: this.phaseVariance
  });
}
```

### 2.4 GameplayHintLayer — Add Collapse-State Hints

**Location:** `HUD/GameplayHintLayer.js`

**New hint keys:**
```javascript
function resolveCollapseReadabilityHint(context = {}) {
  const { state, reason, action } = context;
  if (state === 'fracturing') {
    if (reason === 'node-countdown') return `Structural failure in ${context.nodeLabel || 'corridor'}. ${action} now or lose the chain.`;
    if (reason === 'cascade-propagating') return `Cascade tearing through ${context.corridorLabel || 'network'}. ${action}.`;
    return `Fracturing detected. ${action} immediately.`;
  }
  if (state === 'critical') {
    if (reason === 'chokepoint-overload') return `Critical chokepoint: ${action} or lose chain.`;
    if (reason === 'corruption-spike') return `Corruption link unstable under hold: ${action}.`;
    return `Critical corridor: ${action}.`;
  }
  if (state === 'strained') {
    return `${context.corridorLabel || 'Corridor'} strained. ${action} before it hardens.`;
  }
  return null;
}
```

**Integration:** The `CollapseReadabilityDirector` calls `gameplayHintLayer.show('collapse-readability', context)` when a new top threat appears or an existing threat escalates state.

### 2.5 HUD — Minimal Threat Indicator

**Location:** `HUD/CoreMetricsHUD.js` or new `HUD/CollapseThreatIndicator.js`

**Design constraint:** No new dense panel. Reuse the existing hint layer or add a single-line threat bar above the core metrics overlay.

**Proposed minimal UI:**
- A thin horizontal bar (3 segments) above the metrics overlay
- Each segment = one top threat
- Color: amber (strained) → red (critical) → crimson pulse (fracturing)
- Text on hover: "Corridor A: corruption spike — Break chain or isolate"
- Click: camera pans to the threatened link/node

### 2.6 FX Family Consistency

**Location:** `LinkCorruptionParticleSystem.js`, `ColonyVFXManager.js`, `AtomaAudioSystem.js`

**Mapping:**

| State | FX Family | Audio | Debug Label |
|-------|-----------|-------|-------------|
| strained | `link-strain-pulse` (slow, amber) | `collapse:warning` (distant, low) | `strained:{reason}` |
| critical | `link-critical-glow` (fast, red) | `collapse:critical` (rising, metallic) | `critical:{reason}` |
| fracturing | `link-fracture-burst` (rapid, crimson) | `collapse:final` (sharp, immediate) | `fracturing:{reason}` |

**Rule:** The `CollapseReadabilityDirector` is the single source of truth for which FX family to trigger. Existing systems (`CascadingRuptureSystem`, `CriticalNodeFailureSystem`) continue to emit their own visuals, but the director ensures the *semantic label* (reason text) is consistent across HUD, debug, and FX.

---

## 3. Implementation Order

### Phase 1: Foundation (1 session)
1. Create `CollapseReadabilityDirector.js` with event subscription scaffold
2. Add `node.failure.warning` event to `CriticalNodeFailureSystem.js`
3. Add `hub.overload` event to `HarmonicHubCollapseController.js`
4. Wire director into `main.js` initialization (after `metricsRuntime_v1` init)

### Phase 2: Classification + Prompts (1 session)
5. Implement `classifyLinkThreat()` and `classifyNodeThreat()`
6. Add `resolveCollapseReadabilityHint()` to `GameplayHintLayer.js`
7. Wire director → hint layer calls
8. Add debug snapshot: `window.__ATOMA_COLLAPSE_READABILITY__()`

### Phase 3: FX + HUD Consistency (1 session)
9. Map FX families to states in director
10. Add minimal threat indicator bar (or reuse hint layer exclusively)
11. Ensure `LinkCorruptionParticleSystem` respects director's semantic labels
12. Audio system already has 3 phases — verify mapping matches new states

### Phase 4: Polish + QA (1 session)
13. Tune thresholds per world (Quantum = faster cascade, Desert = slower chokepoint)
14. Verify no duplicate prompts (cooldown per threat ID)
15. Test with `CriticalNodeFailureSystem` enabled/disabled

---

## 4. Files to Create / Modify

| File | Action | Lines (est.) |
|------|--------|--------------|
| `src/collapse/CollapseReadabilityDirector.js` | Create | ~250 |
| `CriticalNodeFailureSystem.js` | Add warning event | ~15 |
| `harmonic/HarmonicHubCollapseController.js` | Add overload event | ~15 |
| `HUD/GameplayHintLayer.js` | Add collapse hint resolver | ~40 |
| `main.js` | Init director, wire to semantic bus | ~10 |
| `LinkCorruptionParticleSystem.js` | Accept semantic label from director | ~10 |
| `HUD/CoreMetricsHUD.js` | Add threat indicator bar (optional) | ~60 |

---

## 5. Success Criteria

- [ ] Player can identify the top 3 threatened corridors without opening debug
- [ ] Each threat state maps to a clear verb: "reinforce," "reroute," "isolate," "brace"
- [ ] Debug console, HUD text, and FX all use the same reason string for the same threat
- [ ] `fracturing` state gives ≥2 seconds of warning before sever (via `node.failure.warning`)
- [ ] No new dense panels — readability fits in existing hint layer or a single-line bar
- [ ] World-specific tuning: Quantum cascades faster, Desert chokepoints slower but harder

---

## 6. Why This Is High-Leverage

This does not add new mechanics. It **reads existing mechanics better**.

The player already has:
- Links that degrade (`LinkCorruptionTransmission_v1`)
- Nodes that fail (`CriticalNodeFailureSystem`)
- Cascades that propagate (`CascadingRuptureSystem`)
- Hubs that overload (`HarmonicHubCollapseController`)

What they lack is a **single readable narrative** that says: "This specific corridor is about to break, here is why, and here is what you can do."

Once this readability exists, the doctrine layer (schools, mutators, crisis cards) becomes meaningful because the player can *see* the problem the doctrine is meant to solve.
