# Metrics Authority Contract v2

Status: ACTIVE (authoritative)
Scope: Node canonical metrics, derived metrics, network/global aggregation.

## 1. Canonical Node Metrics

All node metrics are stored in:

`node.userData.metrics`

Required keys (all float 0.0..1.0):

- `stability`
- `corruption`
- `loadPressure`
- `harmony`
- `synergy`

Meaning:

- `stability`: resistance to instability and collapse.
- `corruption`: entropy/risk level.
- `loadPressure`: operational/network pressure on the node.
- `harmony`: coherence with network state.
- `synergy`: quality of node cooperation (derived metric).

## 2. Architecture Layers (official)

### Base layer (authoritative state)

- `stability`
- `corruption`
- `loadPressure`
- `harmony`

These are canonical state variables and may be written only by authorized writers.

### Derived layer

- `synergy`

`synergy` is strictly derived from base metrics.
It is not an independent canonical writer target.

Required rule:

`synergy = f(harmony, stability, corruption, loadPressure)`

No direct manual writes to `node.userData.metrics.synergy` outside authorized derivation step.

### Network/global layer

Aggregated from node/link truth:

- `networkSynergy`
- `harmonyFlow`
- `networkStress`
- `corruptionLevel`
- `loadPressure`

## 3. Write Authority Matrix

### Allowed writers

- `SafeMetricsDNAIntegration*`:
  - spawn snapshot only (initial values only, no runtime ownership)
- `NodeMetricEngine`:
  - canonical runtime writer for node metrics (event impulses + fixed tick integration)
- `MetricsRuntime_v1`:
  - orchestration/scheduling/sanitization + global aggregation/publish
  - NOT the long-term canonical writer of node metric dynamics

### Long-term authority decision

Node metric dynamics belong to `NodeMetricEngine`.
`MetricsRuntime_v1` should coordinate and publish, not own metric semantics.

## 4. Forbidden

- Per-frame ad-hoc writes from random systems to `node.userData.metrics.*`
- Legacy writes to `node.userData.synergy/harmony/stability/corruption/loadPressure`
- Mixed scales (0..100 or percentages) in canonical storage
- Independent direct writes to `synergy` without derivation path

## 5. Interaction Rules (official semantics)

- Higher `harmony` tends to increase `synergy`.
- Higher `corruption` reduces `harmony` and `synergy`.
- Higher `loadPressure` increases `corruption`.
- Higher `loadPressure` decreases `harmony`.
- Lower `stability` amplifies corruption growth.
- Higher `stability` damps noise/instability propagation.

## 6. Mandatory Runtime Behavior

### Event-driven impulses (fast path)

Event systems can apply impulses through `NodeMetricEngine.applyMetricImpulse(...)`.

### Fixed tick integration (stable path)

At fixed tick (recommended 10 Hz):

1. Integrate base metric interactions (`stability`, `corruption`, `loadPressure`, `harmony`)
2. Recompute derived metric `synergy`
3. Clamp all metrics to `0..1`

### Global publish path

`MetricsRuntime_v1` aggregates and publishes global metrics after node truth is updated.

## 7. Integrated Notes (from review)

### 7.1 Synergy must not be canonical independent writer

Accepted and locked:

- `synergy` is a derived metric only.
- Runtime systems must not treat `synergy` as an independent source-of-truth input writer.

### 7.2 Stability must be functionally stronger

`stability` must actively influence:

- corruption growth damping/amplification
- event noise damping
- link jitter suppression/amplification

Simple baseline relaxation alone is not enough for final design.

### 7.3 LoadPressure must be active, not passive

`loadPressure` must be a live driver in:

- node/link traffic dynamics
- corruption pressure growth
- harmony/synergy degradation under stress
- integration points in linking/packet/bead traffic subsystems

## 8. Current Codebase Direction

If code paths conflict with this contract, this contract is normative.
Migration target:

1. Keep node truth in `NodeMetricEngine`
2. Keep orchestration and publish in `MetricsRuntime_v1`
3. Keep global metrics as aggregated outputs, not independent truth

## 9. Runtime Contract Groups (2026-03-23)

Status: LOCKED (runtime field grouping and authority reference)

This section groups runtime fields into three buckets:

1. Canonical metrics
2. Compact visual bridge fields
3. Deprecated / compatibility fields

If any file conflicts with this grouping, this section wins.

### 9.1 Canonical Metrics

Canonical metrics remain the node-authoritative `node.userData.metrics.*` surface:

- `stability`
- `corruption`
- `loadPressure`
- `harmony`
- `synergy`
- `clusterMembershipID`
- `hubId`
- `activeLinkCount`

Global aggregation outputs:

- `networkSynergy`
- `harmonyFlow`
- `networkStress`
- `corruptionLevel`
- `loadPressure`

These fields are authored by `NodeMetricEngine` and coordinated/published by `MetricsRuntime_v1`.

### 9.2 Compact Visual Bridge Fields

These fields are not canonical metrics. They are compact runtime bridges for visual systems and should stay small, direct, and stable.

| Field (reader key) | Canonical path | Authority writer | Cadence |
|---|---|---|---|
| `resonance` | `node.userData.resonance` | `StandingWaveOscillationTrapSystem_Session130` | visual per-frame |
| `waveField.amplitude` | `node.userData.waveField.amplitude` | `StandingWaveOscillationTrapSystem_Session130` | visual per-frame |
| `waveField.phase` | `node.userData.waveField.phase` | `StandingWaveOscillationTrapSystem_Session130` | visual per-frame |
| `waveField.standing` | `node.userData.waveField.standing` | `StandingWaveOscillationTrapSystem_Session130` | visual per-frame |
| `waveField.sourceCount` | `node.userData.waveField.sourceCount` | `StandingWaveOscillationTrapSystem_Session130` | visual per-frame |
| `waveDirection` | `link.userData.waveDirection` | `LinkRendererConduit._canonicalWriteLinkWaveMetrics` | visual per-frame |
| `waveLength` | `link.userData.waveLength` | `LinkRendererConduit._canonicalWriteLinkWaveMetrics` | visual per-frame |
| `wavePhaseOffset` | `link.userData.wavePhaseOffset` | `LinkRendererConduit._canonicalWriteLinkWaveMetrics` | visual per-frame |
| `cascadeIntensity` | `link.userData.cascadeIntensity` | `CascadeEventBridge_v1._decayUpdate` | visual per-frame |
| `cascadeConflictType` | `link.userData.cascadeConflictType` | `CascadeEventBridge_v1._decayUpdate` | visual per-frame |
| `conflictIntensity` | `link.userData.conflictIntensity` | `CascadeEventBridge_v1._decayUpdate` | visual per-frame |
| `synergyCollapse` | `link.userData.synergyCollapse` | `CascadeEventBridge_v1._decayUpdate` | visual per-frame |
| `synergyCascadeTime` | `link.userData.synergyCascadeTime` | `CascadeEventBridge_v1._decayUpdate` | edge-triggered value (`false -> true`), stamped per-frame |
| `particleIntensity` | `link.userData.particleIntensity` | `ParticleSemanticDensityAdapter_Session121.update` | visual per-frame |
| `particleUrgency` | `link.userData.particleUrgency` | `ParticleSemanticDensityAdapter_Session121.update` | visual per-frame |
| `flowState.intensity` | `link.userData.flowState.intensity` | `CascadeEventBridge_v1` / semantic cascade writers | visual per-frame |
| `flowState.energy` | `link.userData.flowState.energy` | `CascadeEventBridge_v1` / semantic cascade writers | visual per-frame |
| `visualTear` | `link.userData.visualTear` | `ResonanceRuptureVisualSystem_Session133._writeRuptureCanonical` | visual per-frame |
| `visualCoherenceLoss` | `link.userData.visualCoherenceLoss` | `ResonanceRuptureVisualSystem_Session133._writeRuptureCanonical` | visual per-frame |

### 9.3 Deprecated / Compatibility Fields

These fields are compatibility-only or legacy mirrors. They should not gain new consumers.

Canonical metric mirrors:

- `node.userData.harmony`
- `node.userData.harmonyLevel`
- `node.userData.corruption`
- `node.userData.corruptionLevel`
- `node.userData.instability`
- `node.userData.harmonyStabilized`
- `node.userData.harmonyDampingFactor`

Legacy wave aliases:

- `waveField.totalAmplitude`
- `waveField.constructivePower`
- `waveField.destructivePower`
- `waveField.interferenceIndex`
- `waveField.standingWaveFactor`
- `waveField.travelPhase`
- `waveField.constructive`
- `waveField.destructive`

Compatibility-only phase bridge:

- `cascadePhase`

### 9.4 Read Order (mandatory)

Readers must use this order:

1. Canonical metric path (`node.userData.metrics.*` where defined)
2. Compact visual bridge field
3. Deprecated / compatibility fallback
4. Neutral default (`0`, `'neutral'`, or configured default color`)

### 9.5 Stamp Policy (mandatory)

Every authority write above must stamp:

`userData.__canonicalWriteAt['<fieldKey>'] = Date.now()`

Flat keys are required for dotted fields:

- `waveField.amplitude`
- `waveField.phase`

Nested stamp objects are forbidden.

### 9.6 Ambiguity Resolution

- Canonical semantics owner for node base metrics remains `NodeMetricEngine`.
- `MetricsRuntime_v1` owns canonical fallback/mirror safety and auditability.
- Visual systems may mirror values for rendering convenience, but that does not change canonical ownership.
