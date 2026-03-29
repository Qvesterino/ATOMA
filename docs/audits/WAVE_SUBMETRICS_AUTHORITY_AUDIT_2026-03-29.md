# Wave Submetrics Authority Audit

Generated: 2026-03-29

## Scope

This audit focuses on the wave / cascade / resonance area where metric-like fields are currently mixed together:

- canonical metrics
- derived runtime effect state
- internal subsystem state
- semantic event payloads
- legacy aliases

The current problem is not only "too many fields".
The deeper problem is that different data classes are treated as if they were the same thing.

---

## Executive Summary

The current wave area is not cleanly governed.

Main issues:

1. `waveField.*` is not a single authority.
   It is written by multiple systems:
   - [`WaveInterferenceEngine_v1.js`](/D:/ATOMA_CLEAN/WaveInterferenceEngine_v1.js)
   - [`CascadingHarmonicResonanceAmplification.js`](/D:/ATOMA_CLEAN/CascadingHarmonicResonanceAmplification.js)
   - [`StandingWaveOscillationTrapSystem_Session130.js`](/D:/ATOMA_CLEAN/StandingWaveOscillationTrapSystem_Session130.js)
   - fallback path in [`CascadeToWaveBridge_v1.js`](/D:/ATOMA_CLEAN/CascadeToWaveBridge_v1.js)

2. `waveField.*` contains duplicate names for the same concepts.
   Current duplicate pairs:
   - `totalAmplitude` / `amplitude`
   - `constructivePower` / `constructive`
   - `destructivePower` / `destructive`
   - `standingWaveFactor` / `standing`
   - `travelPhase` / `phase`

3. `phase` semantics are inconsistent.
   - `travelPhase` is normalized `0..1` in [`WaveInterferenceEngine_v1.js`](/D:/ATOMA_CLEAN/WaveInterferenceEngine_v1.js)
   - `phase` is often radians `0..2π` in standing-wave writers such as [`StandingWaveOscillationTrapSystem_Session130.js`](/D:/ATOMA_CLEAN/StandingWaveOscillationTrapSystem_Session130.js)

4. Several fields listed in the older audit are not canonical metrics at all.
   They are internal state or event payloads:
   - `hub.harmonicPhase`
   - `pair.proximityStrength`
   - `event.intensity`

5. Canonical metrics are already fairly well-defined.
   Stable authority remains:
   - `node.userData.metrics.synergy`
   - `node.userData.metrics.harmony`
   - `node.userData.metrics.stability`
   - `node.userData.metrics.corruption`
   - `node.userData.metrics.loadPressure`

Conclusion:
`waveField.*` should be demoted from "metric layer" to "effect snapshot layer", and aggressively reduced.

---

## Data Classes

### 1. Canonical metrics

These are true metrics and should remain the primary VFX inputs:

- `node.userData.metrics.synergy`
- `node.userData.metrics.harmony`
- `node.userData.metrics.stability`
- `node.userData.metrics.corruption`
- `node.userData.metrics.loadPressure`
- same family on links when present: `link.userData.metrics.*`

Primary runtime authority:
- [`src/metrics/NodeMetricEngine.js`](/D:/ATOMA_CLEAN/src/metrics/NodeMetricEngine.js)
- [`HarmonyStabilizationSystem_v1.js`](/D:/ATOMA_CLEAN/HarmonyStabilizationSystem_v1.js) for harmony sync consumers currently depend on

### 2. Derived effect snapshot

These are not canonical metrics.
They are effect-facing presentation state:

- `entity.userData.waveField.*`
- `node.userData.resonance`

These should be treated as optional derived runtime state for wave-specific visuals only.

### 3. Internal subsystem state

These are local subsystem variables, not shared metrics:

- `hub.harmonicPhase`
- `trap.phase`
- `trap.amplitude`
- `pair.proximityStrength`
- `pair.combinedHarmony`

### 4. Event payloads

These are semantic bus payload fields, not persistent metrics:

- `event.intensity`
- `event.linkId`
- `event.fromId`
- `event.toId`

---

## Actual Writers

### Canonical metrics writers

`node.userData.metrics.*`

- [`src/metrics/NodeMetricEngine.js#L515`](/D:/ATOMA_CLEAN/src/metrics/NodeMetricEngine.js#L515)
  Writes via `writeMetric(...)`
- [`src/metrics/NodeMetricEngine.js#L522`](/D:/ATOMA_CLEAN/src/metrics/NodeMetricEngine.js#L522)
  Derives `synergy`
- [`src/metrics/NodeMetricEngine.js#L578`](/D:/ATOMA_CLEAN/src/metrics/NodeMetricEngine.js#L578)
  Applies cross-metric interactions
- [`src/metrics/NodeMetricEngine.js#L580`](/D:/ATOMA_CLEAN/src/metrics/NodeMetricEngine.js#L580)
  Writes `harmony`, `stability`, `corruption`, `loadPressure`
- [`HarmonyStabilizationSystem_v1.js:142`](/D:/ATOMA_CLEAN/HarmonyStabilizationSystem_v1.js#L142)
  Syncs node harmony
- [`HarmonyStabilizationSystem_v1.js:654`](/D:/ATOMA_CLEAN/HarmonyStabilizationSystem_v1.js#L654)
  Syncs node harmony again during update path

Observation:
canonical metrics already have a much better authority story than wave submetrics.

### `waveField.*` writers

#### 1. Wave engine snapshot writer

- [`WaveInterferenceEngine_v1.js:234`](/D:/ATOMA_CLEAN/WaveInterferenceEngine_v1.js#L234)
- [`WaveInterferenceEngine_v1.js:282`](/D:/ATOMA_CLEAN/WaveInterferenceEngine_v1.js#L282)
- [`WaveInterferenceEngine_v1.js:724`](/D:/ATOMA_CLEAN/WaveInterferenceEngine_v1.js#L724)

Writes the expanded alias-heavy shape:

- `totalAmplitude`
- `constructivePower`
- `destructivePower`
- `interferenceIndex`
- `standingWaveFactor`
- `travelPhase`
- plus aliases `amplitude`, `constructive`, `destructive`, `standing`, `phase`

#### 2. Cascade amplification writer

- [`CascadingHarmonicResonanceAmplification.js:566`](/D:/ATOMA_CLEAN/CascadingHarmonicResonanceAmplification.js#L566)
- [`CascadingHarmonicResonanceAmplification.js:582`](/D:/ATOMA_CLEAN/CascadingHarmonicResonanceAmplification.js#L582)

Writes directly onto `node.userData.waveField`:

- `constructive`
- `destructive`
- `standing`
- `amplitude`
- `phase`
- `sourceCount`

#### 3. Standing-wave trap writer

- [`StandingWaveOscillationTrapSystem_Session130.js:703`](/D:/ATOMA_CLEAN/StandingWaveOscillationTrapSystem_Session130.js#L703)
- [`StandingWaveOscillationTrapSystem_Session130.js:730`](/D:/ATOMA_CLEAN/StandingWaveOscillationTrapSystem_Session130.js#L730)

Writes:

- `waveField.amplitude`
- `waveField.phase`
- `waveField.source = 'standing'`
- `node.userData.resonance`

#### 4. Cascade fallback writer

- [`CascadeToWaveBridge_v1.js:211`](/D:/ATOMA_CLEAN/CascadeToWaveBridge_v1.js#L211)

Fallback direct writes when wave engine is unavailable:

- link `waveField.amplitude`
- link `waveField.constructive`
- link `waveField.destructive`
- link `waveField.standing`
- link `waveField.phase`
- same reduced shape mirrored to source and target nodes

Result:
`waveField.*` is currently multi-writer and non-canonical.

---

## Actual Readers

### Wave shader bridge

- [`WaveShaderBridge_v1.js:429`](/D:/ATOMA_CLEAN/WaveShaderBridge_v1.js#L429)
- [`WaveShaderBridge_v1.js:533`](/D:/ATOMA_CLEAN/WaveShaderBridge_v1.js#L533)
- [`WaveShaderBridge_v1.js:550`](/D:/ATOMA_CLEAN/WaveShaderBridge_v1.js#L550)

Important finding:
`WaveShaderBridge_v1` explicitly supports both names in each alias pair.
That is a direct reason the namespace keeps expanding instead of converging.

### Standing wave renderer

- [`StandingWaveVisualRenderer_Session131.js:412`](/D:/ATOMA_CLEAN/StandingWaveVisualRenderer_Session131.js#L412)
- [`StandingWaveVisualRenderer_Session131.js:803`](/D:/ATOMA_CLEAN/StandingWaveVisualRenderer_Session131.js#L803)
- [`StandingWaveVisualRenderer_Session131.js:1274`](/D:/ATOMA_CLEAN/StandingWaveVisualRenderer_Session131.js#L1274)

Important finding:
This renderer primarily reads `standingWaveTrapSystem.oscillationTraps`.
It is trap-driven.
The older wave audit overstates its dependency on `node.userData.metrics.*` and `waveField.*`.

### Cascade resonance wave visualization

- [`CascadeResonanceWaveVisualization_Session146.js:343`](/D:/ATOMA_CLEAN/CascadeResonanceWaveVisualization_Session146.js#L343)
- [`CascadeResonanceWaveVisualization_Session146.js:359`](/D:/ATOMA_CLEAN/CascadeResonanceWaveVisualization_Session146.js#L359)
- [`CascadeResonanceWaveVisualization_Session146.js:440`](/D:/ATOMA_CLEAN/CascadeResonanceWaveVisualization_Session146.js#L440)

Important finding:
This system is mostly event-driven and local-state-driven.
It does not look like a primary `hub.harmonicPhase` consumer in the way the earlier audit implies.

### Link resonance flow

- [`LinkResonanceFlowSystem_Session124.js:147`](/D:/ATOMA_CLEAN/LinkResonanceFlowSystem_Session124.js#L147)
- [`LinkResonanceFlowSystem_Session124.js:327`](/D:/ATOMA_CLEAN/LinkResonanceFlowSystem_Session124.js#L327)

This is the cleanest model in this area.
It reads canonical link metrics only:

- `loadPressure`
- `corruption`
- `synergy`
- `stability`

### Resonance echo trail

- [`ResonanceEchoTrailSystem.js:510`](/D:/ATOMA_CLEAN/ResonanceEchoTrailSystem.js#L510)
- [`ResonanceEchoTrailSystem.js:564`](/D:/ATOMA_CLEAN/ResonanceEchoTrailSystem.js#L564)

Also relatively clean.
It resolves from canonical-like composite metrics plus event intensity.

---

## Field-by-Field Classification

### Keep as canonical

- `node.userData.metrics.harmony`
- `node.userData.metrics.synergy`
- `node.userData.metrics.stability`
- `node.userData.metrics.corruption`
- `node.userData.metrics.loadPressure`
- link equivalents where those exist

### Keep as internal subsystem state

- `hub.harmonicPhase`
- `pair.proximityStrength`
- `pair.combinedHarmony`
- `trap.phase`
- `trap.amplitude`

Rule:
these fields should stay private to the owning subsystem and should not be treated as general-purpose metrics.

### Keep as event payload only

- `event.intensity`

Rule:
valid as semantic event contract field, but not as persistent state.

### Keep only if wave snapshot layer survives

Recommended minimal snapshot shape:

- `waveField.amplitude`
- `waveField.phase`
- `waveField.standing`
- `waveField.sourceCount`

Optional:
- `waveField.source`

Why these:

- `amplitude` gives overall strength
- `phase` gives temporal motion
- `standing` distinguishes standing-wave behavior when really needed
- `sourceCount` helps density normalization if shader logic still needs it

### Remove or deprecate

- `waveField.totalAmplitude`
- `waveField.constructivePower`
- `waveField.destructivePower`
- `waveField.interferenceIndex`
- `waveField.standingWaveFactor`
- `waveField.travelPhase`
- duplicate alias support where both names are accepted forever

Reason:
these inflate the namespace and several are derivable from:

- canonical regime choice
- amplitude
- phase
- standing

---

## Critical Problems

### 1. `phase` unit mismatch

Current mismatch:

- normalized `0..1` in wave-engine travel phase
- radians `0..2π` in standing-wave paths

This is the most dangerous wave-submetric issue because the field name looks shared while semantics are not.

Recommendation:

- use `waveField.phase` only in radians `0..2π`
- if a normalized phase is needed internally, keep it local and do not publish it as shared `waveField`

### 2. Alias support prolongs debt

[`WaveShaderBridge_v1.js:550`](/D:/ATOMA_CLEAN/WaveShaderBridge_v1.js#L550) explicitly accepts both old and new names.

This is good for migration safety, but bad as a permanent state.

Recommendation:

- define one accepted public snapshot shape
- mark all other names as migration-only
- remove fallback alias reads after migration

### 3. Multi-writer `waveField`

`waveField` is currently written by unrelated systems for unrelated reasons.

That means:

- ownership is unclear
- values can stomp each other
- semantics drift over time

Recommendation:

- either make `WaveInterferenceEngine_v1` the only shared wave snapshot authority
- or keep `waveField` strictly local and let most VFX read canonical metrics directly

---

## Recommended Governance Rules

### Rule 1

Canonical metrics are the default input layer for VFX:

- `synergy`
- `harmony`
- `stability`
- `corruption`
- `loadPressure`

### Rule 2

Wave-specific shared fields are allowed only when canonical metrics cannot express the needed temporal behavior.

### Rule 3

A shared submetric namespace must have:

- one owner
- one write path
- one unit definition
- one documented range

If any of those is missing, it should not be promoted to shared state.

### Rule 4

Internal subsystem state must not be presented as canonical or shared metrics.

This applies to:

- `hub.harmonicPhase`
- `pair.proximityStrength`
- trap-local fields

### Rule 5

Event payloads are contracts, not storage.

This applies to:

- `cascade.start`
- `cascade.hop`
- `cascade.end`
- `event.intensity`

---

## Recommended Reduction Plan

### Phase A: Governance only

No runtime behavior change yet.

1. Define `waveField` as `effect snapshot`, not metric authority
2. Define allowed minimal public keys
3. Mark all alias keys as deprecated
4. Document phase unit as radians

### Phase B: Reader cleanup

1. Update `WaveShaderBridge_v1` to prefer one shape only
2. Remove permanent alias reads after migration window
3. Keep local conversion inside bridge only during transition

### Phase C: Writer cleanup

1. Stop direct writes from fallback systems where possible
2. Route shared wave snapshots through one authority
3. Push nonessential visuals back onto canonical metrics

### Phase D: Effect simplification

Prefer:

- waves / cascade / glyph / resonance driven by canonical metrics
- especially `stability` and `loadPressure` for secondary atmospheric effects

Use wave snapshot fields only when the effect genuinely needs:

- propagation phase
- standing-wave state
- local amplitude envelope

---

## Documentation Drift Detected

The existing report [`WAVES_SYSTEM_AUDIT_REPORT.md`](/D:/ATOMA_CLEAN/docs/audits/WAVES_SYSTEM_AUDIT_REPORT.md) is useful as a broad inventory, but it blurs:

- canonical metrics
- internal runtime state
- event payloads
- fallback alias fields

It also overstates some reader dependencies, especially around standing-wave and cascade visualization paths.

Smallest repair:

1. keep the old report as inventory
2. use this audit as the authority/ownership companion
3. later update the old report so it stops calling internal state "submetrics"

---

## Final Recommendation

For ATOMA, the cleanest long-term rule is:

- primary VFX inputs = canonical metrics
- semantic triggers = events
- wave-specific shared state = minimal snapshot only
- everything else = private subsystem state

If we keep any shared wave snapshot namespace, it should be reduced to at most:

- `waveField.amplitude`
- `waveField.phase`
- `waveField.standing`
- `waveField.sourceCount`

Everything beyond that should need a strong reason.
