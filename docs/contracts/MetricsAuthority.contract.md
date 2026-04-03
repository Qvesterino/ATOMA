# Metrics Authority Contract v2

Status: ACTIVE (authoritative)
Scope: Node canonical metrics, derived metrics, network/global aggregation, semantic tier event surfaces.

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

Live global publish policy:

- when no active links exist, live global publish must resolve to zeroes
- when active links exist, live global publish should use the active-linked network slice, not dormant isolated nodes
- HUD-facing globals may smooth display values, but the published target remains derived from the live network slice

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

## 10. Semantic Metric Event Contract (current runtime surface)

The runtime uses short scoped tier event names for public consumer wiring.
These names are the preferred surface for HUD, VFX, and gameplay listeners.

### 10.1 Official scoped tier events

Scope first, then metric, then tier:

- `node.synergy.low`
- `node.synergy.mid`
- `node.synergy.high`
- `node.harmony.low`
- `node.harmony.mid`
- `node.harmony.high`
- `node.stability.low`
- `node.stability.mid`
- `node.stability.high`
- `node.corruption.low`
- `node.corruption.mid`
- `node.corruption.high`
- `node.loadPressure.low`
- `node.loadPressure.mid`
- `node.loadPressure.high`

Equivalent scoped surfaces also exist for derived network consumers:

- `global.<metric>.<tier>`
- `link.<metric>.<tier>`
- `hub.<metric>.<tier>`

These use the same canonical metric names:

- `synergy`
- `harmony`
- `stability`
- `corruption`
- `loadPressure`

### 10.2 Threshold tiers

Current tier classifier values:

- `low`: `0.25`
- `high`: `0.75`
- `lowExit`: `0.32`
- `highExit`: `0.68`

Meaning:

- `0.00 - 0.25` -> `low`
- `0.25 - 0.75` -> `mid`
- `0.75 - 1.00` -> `high`

The hysteresis window prevents tier flapping around the boundary.

### 10.3 Internal and legacy bus events

These are not the preferred public wiring surface, but they remain relevant for tooling and compatibility:

- `metric.tier.changed` = internal debug/tooling hook
- `metric.phase.changed` = legacy compatibility bridge only
- `node.metric.updated` = canonical raw node metric update feed

Legacy threshold aliases may still exist as bridge inputs for older consumers, but they are not the preferred new wiring surface:

- `metric:synergySpike`
- `metric:harmonyPeak`
- `metric:stabilityDrop`
- `metric:corruptionRise`
- `metric:loadPressureHigh`

### 10.4 Payload contract

Scoped tier events use a shared payload shape:

```js
{
  scope: 'node' | 'global' | 'link' | 'hub',
  metric: 'synergy' | 'harmony' | 'stability' | 'corruption' | 'loadPressure',
  tier: 'low' | 'mid' | 'high',
  previousTier: 'low' | 'mid' | 'high' | null,
  value: number,
  nodeId?: string | null,
  nodeCount?: number,
  linkCount?: number,
  timestamp?: number,
  source: 'NodeMetricEngine' | 'MetricsRuntime_v1' | 'LinkQualityCalculator' | 'HarmonicHubAuraSystem_Session126'
}
```

### 10.5 Authority rule

- Canonical node metrics are still owned by `NodeMetricEngine`.
- `MetricsRuntime_v1` owns aggregation, publish, and global/network mirroring.
- `link.*` and `hub.*` are scoped semantic/visual layers, not new canonical state writers.
- `metric.tier.changed` must remain internal/debug only.
- `metric.phase.changed` must remain compatibility-only.

## 11. Runtime Data Flow (current working contract)

Current stable chain:

1. `NodeLinkingSystem.attemptLink()` creates or removes links.
2. `NodeMetricEngine` mutates node metrics and emits `node.metric.updated`.
3. `MetricsRuntime_v1` aggregates active-linked nodes and publishes:
   - `window.__ATOMA_LIVE_METRICS__`
   - `window.world.metrics.global`
   - `window.globalMetrics`
4. `CoreMetricsHUD` is a read-only consumer and may smooth display values, but it does not write canonical metrics.
5. `NodeInspectOverlay1_0` is a read-only hover/snapshot consumer and should recover after link creation instead of staying permanently hidden.

## 12. Runtime Validation Entry Points

Confirmed local validation targets:

- static runtime: `http://127.0.0.1:5500/index.html`
- Vite dev runtime: `http://localhost:5173/`
- Python server: `http://localhost:8080/`

Manual browser smoke on this workspace is currently done in Microsoft Edge.

## 13. Runtime Contract Groups (2026-03-23)

Status: LOCKED (runtime field grouping and authority reference)

This section groups runtime fields into three buckets:

1. Canonical metrics
2. Compact visual bridge fields
3. Deprecated / compatibility fields

If any file conflicts with this grouping, this section wins.

### 13.1 Canonical Metrics

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

### 13.2 Compact Visual Bridge Fields

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

### 13.3 Deprecated / Compatibility Fields

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

### 13.4 Read Order (mandatory)

Readers must use this order:

1. Canonical metric path (`node.userData.metrics.*` where defined)
2. Compact visual bridge field
3. Deprecated / compatibility fallback
4. Neutral default (`0`, `'neutral'`, or configured default color`)

### 13.5 Stamp Policy (mandatory)

Every authority write above must stamp:

`userData.__canonicalWriteAt['<fieldKey>'] = Date.now()`

Flat keys are required for dotted fields:

- `waveField.amplitude`
- `waveField.phase`

Nested stamp objects are forbidden.

### 13.6 Ambiguity Resolution

- Canonical semantics owner for node base metrics remains `NodeMetricEngine`.
- `MetricsRuntime_v1` owns canonical fallback/mirror safety and auditability.
- Visual systems may mirror values for rendering convenience, but that does not change canonical ownership.

## 14. Metric Event Keep / Bridge / Drop Audit

This audit covers metric-family events only. It does not classify generic gameplay events such as `link.created`, `node.selection`, or `node.spawned`.

### 14.1 KEEP

These are the stable public or canonical metric surfaces:

- `node.metric.updated` - canonical raw node metric update feed
- `node.synergy.low`
- `node.synergy.mid`
- `node.synergy.high`
- `node.harmony.low`
- `node.harmony.mid`
- `node.harmony.high`
- `node.stability.low`
- `node.stability.mid`
- `node.stability.high`
- `node.corruption.low`
- `node.corruption.mid`
- `node.corruption.high`
- `node.loadPressure.low`
- `node.loadPressure.mid`
- `node.loadPressure.high`
- `global.synergy.low`
- `global.synergy.mid`
- `global.synergy.high`
- `global.harmony.low`
- `global.harmony.mid`
- `global.harmony.high`
- `global.stability.low`
- `global.stability.mid`
- `global.stability.high`
- `global.corruption.low`
- `global.corruption.mid`
- `global.corruption.high`
- `global.loadPressure.low`
- `global.loadPressure.mid`
- `global.loadPressure.high`
- `link.synergy.low`
- `link.synergy.mid`
- `link.synergy.high`
- `link.harmony.low`
- `link.harmony.mid`
- `link.harmony.high`
- `link.stability.low`
- `link.stability.mid`
- `link.stability.high`
- `link.corruption.low`
- `link.corruption.mid`
- `link.corruption.high`
- `link.loadPressure.low`
- `link.loadPressure.mid`
- `link.loadPressure.high`
- `hub.synergy.low`
- `hub.synergy.mid`
- `hub.synergy.high`
- `hub.harmony.low`
- `hub.harmony.mid`
- `hub.harmony.high`
- `hub.stability.low`
- `hub.stability.mid`
- `hub.stability.high`
- `hub.corruption.low`
- `hub.corruption.mid`
- `hub.corruption.high`
- `hub.loadPressure.low`
- `hub.loadPressure.mid`
- `hub.loadPressure.high`
- `link.corruption.spread` - active link-state propagation signal with current consumer usage

### 14.2 BRIDGE

These are compatibility or internal transition events. They should not be the first choice for new feature wiring.

- `metric.tier.changed` - internal debug/tooling hook
- `metric.phase.changed` - legacy compatibility bridge only
- `metric:synergySpike` -> `node.synergy.high`
- `metric:harmonyPeak` -> `node.harmony.high`
- `metric:stabilityDrop` -> `node.stability.low`
- `metric:corruptionRise` -> `node.corruption.high`
- `metric:loadPressureHigh` -> `global.loadPressure.high`
- `metric.synergy.burst` -> `node.synergy.high`
- `metric.corruption.spike` -> `node.corruption.high`
- `metric.corruption.spread` -> `link.corruption.spread` only if a legacy link-spread bridge is temporarily required

### 14.3 DROP

These are orphaned, redundant, or docs-only metric names and should not receive new consumers.

- `metric.corruption.spread` - no active canonical consumer; prefer `link.corruption.spread` when a link-state spread signal is needed
- `metric:harmonyResonance`
- `metric:stress.rise`
- `metric:stability.drop`
- `metric:loadPressure.rise`
- `metric:ability.drop`

### 14.4 Decision Rule

- If the event is a short scoped tier event, keep it.
- If the event is a legacy alias for a scoped tier event or an internal transition hook, bridge it.
- If the event has no active canonical consumer and only survives in docs, drop it.

## 15. Current Consumer Map

This is the short runtime consumer audit for the scoped metric surface.

### 15.1 `node.*`

Active consumers:

- `CascadeEventBridge_v1` - `node.synergy.high`, `node.corruption.high`
- `HarmonicNodeResonanceHalos` - `node.harmony.low`, `node.harmony.mid`, `node.harmony.high`
- `LinkMicroImpulseAdapter_v1` - `node.synergy.high`, `node.harmony.high`, `node.corruption.high`
- `NeonLinkVisuals` - `node.synergy.high`
- `ResonanceRuptureVisualSystem_Session133` - `node.corruption.high`
- `T2_CorruptionVisualIntegration_v1` - `node.corruption.high`
- `WaveBurstRouter_v1` - `node.synergy.high`, `node.harmony.high`, `node.corruption.high`

Currently no active consumers were found for:

- `node.stability.low|mid|high`
- `node.loadPressure.low|mid|high`
- `node.synergy.low|mid`
- `node.corruption.low|mid`

### 15.2 `global.*`

Active consumers:

- `ResonanceCascadeVisualization_Session117B` - `global.loadPressure.high`
- `ResonanceRuptureVisualSystem_Session133` - `global.stability.low`, `global.loadPressure.high`
- `WaveBurstRouter_v1` - `global.stability.low`, `global.loadPressure.high`

Currently no active consumers were found for:

- `global.synergy.low|mid|high`
- `global.harmony.low|mid|high`
- `global.corruption.low|mid|high`
- `global.stability.mid|high`
- `global.loadPressure.low|mid`

### 15.3 `link.*`

Active consumers:

- `HarmonicHealingVisualSystem_Session134` - `link.harmony.low`, `link.harmony.mid`, `link.harmony.high`
- `HarmonicRecoveryVisualSystem_Session138` - `link.harmony.low`, `link.harmony.mid`, `link.harmony.high`
- `LinkCorruptionParticleSystem` - `link.corruption.spread`

Currently no active consumers were found for:

- `link.synergy.low|mid|high`
- `link.stability.low|mid|high`
- `link.loadPressure.low|mid|high`

### 15.4 `hub.*`

Active consumers:

- `HarmonicHubAuraSystem_Session126` - `hub.harmony.low`, `hub.harmony.mid`, `hub.harmony.high`

Currently no active consumers were found for:

- `hub.synergy.*`
- `hub.stability.*`
- `hub.corruption.*`
- `hub.loadPressure.*`
