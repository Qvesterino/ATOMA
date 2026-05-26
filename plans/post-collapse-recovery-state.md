# Post-Collapse Recovery State — Implementation Plan

## Goal
Collapse must leave a lasting consequence. After a link collapses, a short-lived **fracture residue / dead corridor state** remains:
- The zone stays risky.
- Re-linking the same nodes is not free — it requires a deliberate choice between two recovery modes.
- The collapse changes the player's decision map for the next 10–20 seconds.

## Why
Only when collapse leaves a scar does the player start perceiving the network as a **spatial territory** rather than a list of connections.

---

## Existing Infrastructure Analysis

| System | Relevant Capability |
|--------|---------------------|
| `LinkCollapseSystem` | Emits `link.collapse.collapse` → enqueues collapse request → `NodeLinkingSystem` executes unlink and emits `link:collapsed` |
| `NodeLinkingSystem` | Has `_addRecoveryCandidate()` / `runRecoveryArbiter()` / `requestRecoveryLink()` — passive condition checks only |
| `LinkCorruptionTransmission_v1` | Has `rebuildCollapsedLink()` with harmony/synergy/stress gates and escalating costs |
| `EnvironmentalHazards` | Already has `_spawnResidueScar()` visual pattern — we can reuse the visual language |
| `CriticalNodeFailureSystem` | Shows post-failure isolated state, collapsed aura, dimmed core — visual precedent |

**Gap:** No active "dead corridor" residue zone exists. Recovery is just a passive timer. There is no spatial scar that affects gameplay.

---

## Architecture

### New System: `PostCollapseResidueSystem.js`

Responsibility: Own the lifecycle of fracture residue zones.

**Data Model — `ResidueZone`:**
```
{
  id: `${sourceId}-${targetId}-${collapsedAt}`,
  sourceNodeId,
  targetNodeId,
  position: Vector3(midpoint),
  createdAt: timestamp,
  expiresAt: timestamp,          // createdAt + RESIDUE_DURATION_MS
  riskLevel: 0.0-1.0,            // starts at 1.0, decays to 0.0
  stage: 'fresh' | 'cooling' | 'fading',  // visual + gameplay stage
  recoveryModes: {
    cleanRebuild: { available: boolean, cost: {...} },
    dangerousReconnect: { available: boolean, cost: {...} }
  },
  visualRef: null,               // THREE.Group reference
}
```

**Lifecycle:**
1. `link:collapsed` → spawn residue zone
2. Every tick → decay riskLevel, update visual, check expiry
3. Expiry → remove visual, emit `network:fractureResidueExpired`
4. `link.created` between same node pair → check residue, apply recovery mode

**Config:**
```javascript
RESIDUE_DURATION_MS: 16000,        // 16s total lifetime
FRESH_DURATION_MS: 6000,           // first 6s = high risk
COOLING_DURATION_MS: 6000,         // next 6s = moderate risk
FADING_DURATION_MS: 4000,          // last 4s = low risk
CLEAN_REBUILD_CORRUPTION_PENALTY: 0.12,
CLEAN_REBUILD_STABILITY_PENALTY: 0.08,
DANGEROUS_RECONNECT_CORRUPTION_PENALTY: 0.38,
DANGEROUS_RECONNECT_STABILITY_PENALTY: 0.22,
DANGEROUS_RECONNECT_IMMEDIATE_STRAIN: 0.45,
```

**Visual Language (reuses EnvironmentalHazards scar style):**
- Fresh: dim fracture ring, slow pulse, faint red glow, small particle drift
- Cooling: ring shrinks, pulse slows, color shifts toward amber
- Fading: nearly invisible, only a faint seam remains

**Semantic Events Emitted:**
- `network:fractureResidueCreated` — payload: residue zone, sourceId, targetId
- `network:fractureResidueExpired` — payload: residue zone
- `network:fractureResidueRiskChanged` — payload: residue zone, oldRisk, newRisk
- `network:recoveryModeChosen` — payload: mode ('cleanRebuild' | 'dangerousReconnect'), residue zone

---

## Integration Points

### 1. NodeLinkingSystem.js — Recovery Mode Selection

**Change:** In `createLink()`, before realizing visuals, check if a residue zone exists for this node pair.

**Logic:**
```javascript
const residue = this.postCollapseResidueSystem?.getResidueForPair(sourceNodeId, targetNodeId);
if (residue && residue.riskLevel > 0.2) {
  // Player must choose recovery mode
  // For now: auto-select based on conditions (AI can later expose UI)
  const canCleanRebuild = this._canCleanRebuild(sourceNode, targetNode, residue);
  if (canCleanRebuild) {
    link.userData.recoveryMode = 'cleanRebuild';
    link.userData.corruptionPenalty = residue.config.CLEAN_REBUILD_CORRUPTION_PENALTY * residue.riskLevel;
    link.userData.stabilityPenalty = residue.config.CLEAN_REBUILD_STABILITY_PENALTY * residue.riskLevel;
  } else {
    link.userData.recoveryMode = 'dangerousReconnect';
    link.userData.corruptionPenalty = residue.config.DANGEROUS_RECONNECT_CORRUPTION_PENALTY * residue.riskLevel;
    link.userData.stabilityPenalty = residue.config.DANGEROUS_RECONNECT_STABILITY_PENALTY * residue.riskLevel;
    link.userData.immediateStrain = residue.config.DANGEROUS_RECONNECT_IMMEDIATE_STRAIN * residue.riskLevel;
  }
  // Emit event so other systems know
  this.semanticBus?.emit('network:recoveryModeChosen', { mode: link.userData.recoveryMode, residue });
}
```

**Also:** In `_executeCollapseDecision()`, after emitting `link:collapsed`, notify `postCollapseResidueSystem` to spawn residue.

### 2. NetworkTensionRuntime_v1.js — Residue Zone Bias

**Change:** In `_analyzeLinks()`, if a link's node pair has an active residue zone, add tension bias.

**Logic:**
```javascript
const residue = this.postCollapseResidueSystem?.getResidueForPair(sourceId, targetId);
if (residue) {
  strain *= (1 + residue.riskLevel * 0.35);
  overloadRisk *= (1 + residue.riskLevel * 0.22);
}
```

This makes the area around a recent collapse inherently riskier, reinforcing the "spatial scar" feeling.

### 3. VisualNetworkTimeElasticity_v1.js — Residue Gate Impact

**Change:** In `_evaluateRewindGate()`, if the player is in a residue zone, adjust gate thresholds.

**Logic:**
```javascript
// If any residue zone is nearby and fresh, make rewind gate slightly harder
const nearbyResidue = this.postCollapseResidueSystem?.getResiduesNear(position, radius);
const maxNearbyRisk = Math.max(0, ...nearbyResidue.map(r => r.riskLevel));
if (maxNearbyRisk > 0.5) {
  effectiveCorruptionThreshold *= (1 - maxNearbyRisk * 0.12);
}
```

### 4. CollapseReadabilityDirector.js — Residue Threat Handlers

**Change:** Add `_onFractureResidueCreated()` and `_onFractureResidueExpired()`.

**Logic:**
```javascript
_onFractureResidueCreated(payload) {
  const { sourceNodeId, targetNodeId, riskLevel } = payload;
  const id = `residue-${sourceNodeId}-${targetNodeId}`;
  this.threats.set(id, {
    id,
    type: 'fracture-residue',
    state: riskLevel > 0.7 ? 'critical' : riskLevel > 0.3 ? 'warning' : 'stable',
    reason: 'fracture-residue-active',
    label: `Fracture residue (${(riskLevel * 100).toFixed(0)}%)`,
    action: riskLevel > 0.7 ? 'Wait or dangerous reconnect' : 'Clean rebuild available',
    fxFamily: 'link-fracture-burst',
    sourceNodeId,
    targetNodeId,
    riskLevel,
  });
  this._recomputeTopThreats();
}
```

### 5. HUD/GameplayHintLayer.js — Recovery Hints

**New hints:**
```javascript
fractureResidueCreated: {
  text: (ctx) => `Corridor collapsed. Fracture residue fading in ${(ctx.secondsRemaining || 16).toFixed(0)}s.`,
  durationMs: 4200,
  priority: 12,
  variant: 'warning'
},
cleanRebuildAvailable: {
  text: 'Clean rebuild possible. Corruption and stability penalties apply.',
  durationMs: 3800,
  priority: 13,
  variant: 'default'
},
dangerousReconnectWarning: {
  text: 'Dangerous reconnect: immediate strain spike. Use only if urgent.',
  durationMs: 4200,
  priority: 14,
  variant: 'danger'
},
residueExpired: {
  text: 'Fracture residue dissipated. Zone is safe to rebuild.',
  durationMs: 3200,
  priority: 11,
  variant: 'default'
}
```

### 6. main.js — Wiring

**In `initGame()` or `initLinkSystems()`:**
```javascript
this.postCollapseResidueSystem = new PostCollapseResidueSystem({
  scene: this.scene,
  semanticBus: this.semanticBus,
  linkingSystem: this.linkingSystem,
  config: {
    residueDurationMs: 16000,
    freshDurationMs: 6000,
    coolingDurationMs: 6000,
    fadingDurationMs: 4000,
  }
});
```

**Event wiring:**
```javascript
this.semanticBus.on('link:collapsed', (payload) => {
  this.postCollapseResidueSystem?.onLinkCollapsed?.(payload);
});

this.semanticBus.on('network:fractureResidueCreated', (payload) => {
  this.collapseReadabilityDirector?._onFractureResidueCreated?.(payload);
  this.visualNetworkTimeElasticity?.onFractureResidueCreated?.(payload);
});

this.semanticBus.on('network:fractureResidueExpired', (payload) => {
  this.collapseReadabilityDirector?._onFractureResidueExpired?.(payload);
});
```

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `PostCollapseResidueSystem.js` | **NEW** | Core system: residue zone lifecycle, visual spawning, risk decay, recovery mode logic |
| `NodeLinkingSystem.js` | MODIFY | Intercept `createLink` for residue-affected pairs; notify residue system on collapse |
| `NetworkTensionRuntime_v1.js` | MODIFY | Add residue bias in `_analyzeLinks` |
| `VisualNetworkTimeElasticity_v1.js` | MODIFY | Add residue-aware gate adjustment |
| `CollapseReadabilityDirector.js` | MODIFY | Add `_onFractureResidueCreated/Expired` handlers |
| `GameplayHintLayer.js` | MODIFY | Add 4 new recovery-related hints |
| `main.js` | MODIFY | Instantiate `PostCollapseResidueSystem`, wire semantic events |
| `tests/GameplayLoopChecks.js` | MODIFY | Add tests for residue creation, decay, recovery mode selection |
| `plans/post-collapse-recovery-state.md` | **NEW** | This plan |

---

## Test Plan

1. **Residue creation on collapse** — simulate `link:collapsed` → verify residue zone exists with correct position, riskLevel = 1.0
2. **Risk decay over time** — advance time by 8s → verify riskLevel dropped, stage = 'cooling'
3. **Recovery mode selection** — simulate `createLink` between same nodes while residue active → verify `link.userData.recoveryMode` is set and penalties applied
4. **Residue expiry** — advance time by 16s → verify residue removed, visual disposed, event emitted
5. **Tension bias** — verify `_analyzeLinks` increases strain when residue is active

---

## Performance Notes

- Residue zones are lightweight: one `THREE.Group` with a ring + a few particles.
- Max concurrent residues: bounded by max links that can collapse in 16s. In practice < 10.
- No per-frame geometry rebuild. Visual updates only scale/opacity/position.
- Distance-based LOD: if camera is far, reduce particle count and disable pulse.

---

## Compatibility

- Does NOT break existing `LinkCollapseSystem` flow.
- Does NOT break existing `LinkCorruptionTransmission_v1` rebuild API.
- Recovery candidates in `NodeLinkingSystem` remain intact; `PostCollapseResidueSystem` is a parallel layer that adds spatial + gameplay consequence.
- All changes are additive. No existing APIs are removed.
