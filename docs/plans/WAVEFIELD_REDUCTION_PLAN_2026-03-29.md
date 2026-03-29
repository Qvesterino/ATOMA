# WaveField Reduction Plan

Date: 2026-03-29

## Goal

Reduce `waveField.*` from an unbounded pseudo-metric namespace into a small, explicit effect snapshot layer.

Primary goals:

- remove alias chaos
- define one public shape
- separate canonical metrics from wave effect state
- reduce multi-writer ambiguity
- keep migration safe

---

## Target Model

### Canonical layer

Primary inputs for VFX remain:

- `node.userData.metrics.synergy`
- `node.userData.metrics.harmony`
- `node.userData.metrics.stability`
- `node.userData.metrics.corruption`
- `node.userData.metrics.loadPressure`
- link equivalents where present

### Event layer

Semantic triggers remain:

- `cascade.start`
- `cascade.hop`
- `cascade.end`
- `wave.burst.lifecycle`

### Wave snapshot layer

`waveField.*` remains allowed only as a shared effect snapshot for wave-specific temporal behavior.

Target public shape:

- `waveField.amplitude`
- `waveField.phase`
- `waveField.standing`
- `waveField.sourceCount`

Optional:

- `waveField.source`

Rule:
anything outside this shape is deprecated.

---

## Final Naming Contract

### Keep

- `amplitude`
- `phase`
- `standing`
- `sourceCount`

### Deprecate

- `totalAmplitude`
- `constructivePower`
- `destructivePower`
- `interferenceIndex`
- `standingWaveFactor`
- `travelPhase`
- `constructive`
- `destructive`
- `harmonicLevel`
- `destructiveInterference`

Reason:

- `constructive`
- `destructive`
- `interferenceIndex`

look informative, but they are not stable shared truths.
They are effect-specific decompositions and should stay local to the writer or shader bridge if still needed.

---

## Ownership Rules

### Rule 1

`waveField.*` is not a canonical metric container.

### Rule 2

There should be only one shared writer authority for public `waveField.*`.

Target authority:

- [`WaveInterferenceEngine_v1.js`](/D:/ATOMA_CLEAN/WaveInterferenceEngine_v1.js)

### Rule 3

Other systems may keep internal wave state, but should not publish extra shared `waveField.*` keys.

### Rule 4

If a system needs custom decomposition like constructive vs destructive, keep it:

- internal to that subsystem
- in local runtime objects
- or in shader-local derived uniforms

not in shared entity `userData.waveField`.

---

## Phase Unit Contract

Final rule:

- `waveField.phase` must be radians in range `0..2π`

Do not publish normalized travel phase as shared `waveField.phase`.

If a subsystem needs normalized phase:

- compute it locally
- do not store it as shared `waveField.phase`

This is mandatory because the current `0..1` vs `0..2π` split is the most dangerous inconsistency in the namespace.

---

## Reduction Strategy

## Phase 1: Freeze the Contract

Scope: low risk

Actions:

1. document target `waveField` shape
2. mark all alias fields as deprecated
3. document `phase` unit as radians
4. state that `waveField` is effect snapshot, not metric authority

Files:

- [`docs/audits/WAVE_SUBMETRICS_AUTHORITY_AUDIT_2026-03-29.md`](/D:/ATOMA_CLEAN/docs/audits/WAVE_SUBMETRICS_AUTHORITY_AUDIT_2026-03-29.md)
- future follow-up in [`docs/audits/WAVES_SYSTEM_AUDIT_REPORT.md`](/D:/ATOMA_CLEAN/docs/audits/WAVES_SYSTEM_AUDIT_REPORT.md)

Success criteria:

- one documented public shape exists
- no new wave keys are introduced casually

---

## Phase 2: Reader Consolidation

Scope: medium risk

Goal:
all readers accept the final shape first, aliases second, then log or mark deprecated usage.

### 2A. Normalize `WaveShaderBridge_v1`

Current issue:
[`WaveShaderBridge_v1.js`](/D:/ATOMA_CLEAN/WaveShaderBridge_v1.js) is the main reason alias sprawl survives.

Actions:

1. centralize fallback conversion in one helper
2. convert incoming alias-heavy shapes into the final compact shape:
   - `amplitude`
   - `phase`
   - `standing`
   - `sourceCount`
3. derive bridge-local values from compact shape instead of reading many aliases everywhere
4. stop treating all alias keys as equally valid public input

Important:

- if constructive/destructive remain visually useful in shaders, derive them locally from:
  - event type
  - amplitude
  - standing
  - canonical metrics

not from shared `waveField.constructive*` state

### 2B. Normalize `WaveParticleEmitter_v1`

Actions:

1. same compact-shape normalization at the input boundary
2. derive any extra particle tuning locally
3. stop depending on duplicate key pairs

Success criteria:

- bridge and particle emitter can operate from the compact shape
- alias support exists only in one migration adapter layer

---

## Phase 3: Writer Consolidation

Scope: medium risk

Goal:
stop publishing a broad `waveField` from multiple systems.

### 3A. `WaveInterferenceEngine_v1`

Target:
becomes the primary shared writer for wave snapshots.

Actions:

1. keep output, but collapse public shape to compact keys
2. if extra decomposition is needed, keep it internal to engine snapshots or local helper structs
3. write `phase` in radians only

Target public output:

- `amplitude`
- `phase`
- `standing`
- `sourceCount`

### 3B. `StandingWaveOscillationTrapSystem_Session130`

Current writes are relatively small already.

Plan:

1. keep:
   - `waveField.amplitude`
   - `waveField.phase`
2. optionally write:
   - `waveField.standing`
3. remove the idea that this system is publishing a broad shared wave decomposition

Note:
this system may remain a secondary writer during migration if standing-wave visuals depend on it, but only using the compact shape.

### 3C. `CascadingHarmonicResonanceAmplification`

Current issue:
publishes `constructive`, `destructive`, `standing`, `amplitude`, `phase`, `sourceCount`.

Plan:

1. keep:
   - `amplitude`
   - `phase`
   - `standing`
   - `sourceCount`
2. remove:
   - `constructive`
   - `destructive`
3. if the system still needs them internally, keep them off the shared `waveField`

### 3D. `CascadeToWaveBridge_v1` fallback

Current issue:
fallback writes broad link/node `waveField`.

Plan:

1. reduce fallback writes to compact shape only
2. never publish `constructive` / `destructive`
3. if wave engine is available, do not write `waveField` directly

Success criteria:

- no system publishes deprecated keys anymore
- public waveField writer set is reduced and obvious

---

## Phase 4: Alias Removal

Scope: medium risk

After readers and writers are migrated:

1. remove alias reads from `WaveShaderBridge_v1`
2. remove alias reads from `WaveParticleEmitter_v1`
3. remove deprecated writes from all writers
4. remove docs that present deprecated keys as active contract

Success criteria:

- public `waveField` shape is compact only
- codebase no longer depends on old names

---

## Concrete File Plan

### Pass 1

- [`WaveShaderBridge_v1.js`](/D:/ATOMA_CLEAN/WaveShaderBridge_v1.js)
- [`WaveParticleEmitter_v1.js`](/D:/ATOMA_CLEAN/WaveParticleEmitter_v1.js)

Work:

- add compact-shape adapter
- isolate alias compatibility to one function per file

### Pass 2

- [`WaveInterferenceEngine_v1.js`](/D:/ATOMA_CLEAN/WaveInterferenceEngine_v1.js)
- [`CascadingHarmonicResonanceAmplification.js`](/D:/ATOMA_CLEAN/CascadingHarmonicResonanceAmplification.js)
- [`StandingWaveOscillationTrapSystem_Session130.js`](/D:/ATOMA_CLEAN/StandingWaveOscillationTrapSystem_Session130.js)
- [`CascadeToWaveBridge_v1.js`](/D:/ATOMA_CLEAN/CascadeToWaveBridge_v1.js)

Work:

- collapse writes to compact shape
- enforce radians for `phase`

### Pass 3

- [`docs/audits/WAVES_SYSTEM_AUDIT_REPORT.md`](/D:/ATOMA_CLEAN/docs/audits/WAVES_SYSTEM_AUDIT_REPORT.md)
- any related wave/cascade audits that still list deprecated keys as current contract

Work:

- align docs with the compact public shape

---

## What Should Move Back to Canonical Metrics

These systems should default to canonical metrics and only use wave snapshot if temporal wave state is truly required:

- cascade atmosphere
- glyph ambient reaction
- resonance intensity coloring
- secondary wave-like overlays

Preferred canonical drivers:

- `stability`
- `loadPressure`
- `harmony`
- `synergy`
- `corruption`

Guidance:

- `stability` and `loadPressure` are good for passive environmental modulation
- `synergy`, `harmony`, `corruption` remain strong threshold/intensity drivers
- wave snapshot should be reserved for propagation timing and standing-wave behavior

---

## What Must Stay Local

Do not promote these into canonical or shared metric space:

- `hub.harmonicPhase`
- `pair.proximityStrength`
- `pair.combinedHarmony`
- `trap.phase`
- `trap.amplitude`
- `event.intensity`

Reason:
these are subsystem state or event contract fields, not general shared metrics.

---

## Risk Notes

### Risk 1: Visual regression in wave shaders

If shaders visually depend on constructive/destructive split, removing it from shared state too early may flatten the look.

Mitigation:

- keep local derivation inside bridge/shader layer until visuals are rebalanced

### Risk 2: Standing-wave regressions

Standing-wave systems already use radians heavily.
If migration mixes normalized and radian phase paths, behavior will break subtly.

Mitigation:

- convert shared `waveField.phase` to radians first
- only then remove normalized aliases

### Risk 3: Hidden readers

There are likely dormant or undocumented readers of old keys.

Mitigation:

- temporary compatibility adapter
- temporary warnings in dev mode for deprecated keys

---

## Definition of Done

The reduction is complete when all of this is true:

1. `waveField.*` has one documented public shape
2. `waveField.phase` is always radians
3. alias keys are no longer written
4. alias keys are no longer read outside migration adapters
5. most nonessential wave/cascade effects read canonical metrics directly
6. internal subsystem state is no longer described as shared submetrics in docs

---

## Recommended Execution Order

1. reader consolidation
2. writer consolidation
3. alias removal
4. docs cleanup

Reason:
reader-first migration is the safest path because it preserves compatibility while shrinking the contract.
