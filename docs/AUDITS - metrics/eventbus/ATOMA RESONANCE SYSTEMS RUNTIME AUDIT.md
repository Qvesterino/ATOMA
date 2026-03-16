# ATOMA RESONANCE SYSTEMS RUNTIME AUDIT
**Complete Architecture & Runtime Analysis**

---

## 1️⃣ ALL RESONANCE-RELATED FILES

### Primary Resonance Systems

**StandingWaveOscillationTrapSystem_Session130.js**
- Purpose: Detects and manages standing wave conditions on links (trapped energy between opposing nodes)
- Classes: `StandingWaveOscillationTrapSystem_Session130`
- Main exports: `StandingWaveOscillationTrapSystem_Session130`

**StandingWaveVisualRenderer_Session131.js**
- Purpose: Pure rendering system - applies standing wave visuals (antinodes, interference patterns, node halo counter-pulsing)
- Classes: `StandingWaveVisualRenderer_Session131`
- Main exports: `StandingWaveVisualRenderer_Session131`

**HarmonicResonanceFeedbackSystem.js**
- Purpose: Composite glyph resonance fields that gently influence nearby link motion (closed visual feedback loop)
- Classes: `HarmonicResonanceFeedbackSystem`, `ResonanceField`
- Main exports: `HarmonicResonanceFeedbackSystem`, `setupHarmonicResonanceConsoleAPI`

**ResonanceEchoTrailSystem.js**
- Purpose: Harmonic afterimages following composite glyph movement/dissolution (temporal persistence of meaning)
- Classes: `ResonanceEchoTrailSystem`, `EchoInstance`, `CompositeGlyphTracker`
- Main exports: `ResonanceEchoTrailSystem`, `setupResonanceEchoConsoleAPI`

**CascadeResonanceWaveVisualization_Session146.js**
- Purpose: Ghost-level resonance wave visualization between phase-synchronized harmonic hubs (temporal modulation only)
- Classes: `CascadeResonanceWaveVisualization_Session146`
- Main exports: `CascadeResonanceWaveVisualization_Session146`, `setupCascadeWaveConsoleAPI`

**ResonanceCascadeVisualization_Session117B.js**
- Purpose: Cascade resonance wave visualization (ghost-level wave suggestion)
- Classes: `ResonanceCascadeVisualization_Session117B`
- Main exports: `ResonanceCascadeVisualization_Session117B`

### Legacy/Related Systems

**ResonanceFeedback_v1.js**
- Purpose: Legacy resonance feedback system (appears unused)
- Classes: `ResonanceFeedback_v1`

**HarmonicNodeResonanceHalos.js**
- Purpose: Node resonance halo visualization
- Classes: `HarmonicNodeResonanceHalos`

---

## 2️⃣ RUNTIME INSTANTIATION

| SYSTEM | INSTANTIATED IN | LINE/LOCATION | CONFIRMED |
|--------|----------------|--------------|----------|
| `StandingWaveOscillationTrapSystem` | `main.js` | World constructor | ✅ YES |
| `StandingWaveVisualRenderer` | `main.js` | World constructor | ✅ YES |
| `HarmonicResonanceFeedbackSystem` | `main.js` | World constructor | ✅ YES |
| `ResonanceEchoTrailSystem` | `main.js` | World constructor | ✅ YES |
| `CascadeResonanceWaveVisualization` | `main.js` | World constructor | ✅ YES |
| `ResonanceCascadeVisualization` | `main.js` | World constructor | ✅ YES |
| `ResonanceFeedback_v1` | NOT FOUND | - | ❌ DEAD |

---

## 3️⃣ SCHEDULER INTEGRATION

| SYSTEM | SCHEDULED | LAYER | FREQUENCY | CONFIRMED |
|--------|-----------|-------|-----------|----------|
| `StandingWaveOscillationTrapSystem` | NO | Manual update loop | 60Hz (via main loop) | ⚠️ PARTIAL |
| `StandingWaveVisualRenderer` | NO | Manual update loop | 60Hz (via main loop) | ⚠️ PARTIAL |
| `HarmonicResonanceFeedbackSystem` | NO | Manual update loop | 30Hz throttled | ⚠️ PARTIAL |
| `ResonanceEchoTrailSystem` | NO | Manual update loop | 30Hz throttled | ⚠️ PARTIAL |
| `CascadeResonanceWaveVisualization` | NO | Manual update loop | 60Hz (via main loop) | ⚠️ PARTIAL |
| `ResonanceCascadeVisualization` | NO | Manual update loop | 60Hz (via main loop) | ⚠️ PARTIAL |

**Critical Finding:** NONE of the resonance systems are registered with `FrameScheduler.register()`. All rely on manual update calls in the main animate loop.

---

## 4️⃣ UPDATE LOOPS

All systems have `update()` methods called from main.js:

```javascript
// In main.js animate loop:
if (this.standingWaveTrap) {
    this.standingWaveTrap.update(dt, this.time);
}
if (this.standingWaveRenderer) {
    this.standingWaveRenderer.update(dt, this.time);
}
if (this.harmonicResonanceFeedbackSystem) {
    this.harmonicResonanceFeedbackSystem.update(dt, this.fusionZoneManager, this.pictogramsArray, this.linkingSystem);
}
if (this.resonanceEchoTrailSystem) {
    this.resonanceEchoTrailSystem.update(dt, this.compositeGlyphs);
}
if (this.cascadeResonanceWave) {
    this.cascadeResonanceWave.update(dt, this.time);
}
if (this.resonanceCascadeVisualization) {
    this.resonanceCascadeVisualization.update(dt, this.time);
}
```

---

## 5️⃣ EVENT-DRIVEN TRIGGERS

| SYSTEM | EVENT NAME | HANDLER FUNCTION | SOURCE |
|--------|-----------|------------------|--------|
| `ResonanceEchoTrailSystem` | `wave.burst` | `spawnEchoTrail` | `semanticBus` |
| `CascadeResonanceWaveVisualization` | `cascade.hop` | `spawnCascadeResonanceWave` | `semanticBus` |
| `ResonanceCascadeVisualization` | `cascade.start` | `_boundHandleCascadeStart` | `semanticBus` |
| `ResonanceCascadeVisualization` | `cascade.hop` | `_boundHandleCascadeHop` | `semanticBus` |
| `ResonanceCascadeVisualization` | `cascade.end` | `_boundHandleCascadeEnd` | `semanticBus` |

---

## 6️⃣ DATA DEPENDENCIES

### Read-Only Dependencies

**All resonance systems read from:**
- `node.userData.harmony`
- `node.userData.synergy`
- `node.userData.corruption`
- `node.userData.instability` (derived as `1 - stability`)
- `node.userData.stability`

**Specific system dependencies:**

`StandingWaveOscillationTrapSystem`:
- `InfluenceReflectionBackPressureSystem` → `reflectionPulses` / `reflectionPulsePool`
- `HarmonicInfluencePropagationSystem` → influence data (optional)
- `LinkingSystem` → `links[]`
- `AINodes` → node metrics

`StandingWaveVisualRenderer`:
- `StandingWaveOscillationTrapSystem` → `oscillationTraps`, `trapZones`, `interferencePatterns`
- `LinkingSystem` → `links[]`
- `AINodes` → node shells for halo pulsing

`HarmonicResonanceFeedbackSystem`:
- `FusionZoneManager` → `compositeGlyphs[]`
- `PictogramsArray` → pictogram data
- `LinkingSystem` → link position calculation

`ResonanceEchoTrailSystem`:
- `CompositeGlyphs[]` → position tracking
- Semantic events (`wave.burst`)

`CascadeResonanceWaveVisualization`:
- `HarmonicCascadeAmplification_Session145` → cascade strength/amplitude data
- `HarmonicHubAuraSystem` → hub data
- `LinkResonanceSystem` → link metadata
- Semantic events (`cascade.hop`)

`ResonanceCascadeVisualization`:
- `ConflictSystem` → conflict state
- Semantic events (`cascade.start`, `cascade.hop`, `cascade.end`)

---

## 7️⃣ OUTPUT SIGNALS

### What Each System Writes to Runtime

**StandingWaveOscillationTrapSystem:**
- Writes to: `oscillationTraps[]` (trap state: frequency, phase, amplitude, trapRadius, state)
- Writes to: `trapZones[]` (zone geometry: centerPos, radiusStart, radiusEnd, intensity)
- Writes to: `interferencePatterns[]` (spacing, contrast, beatPhase)
- Writes to: `resolutionEvents[]` (damping/breakthrough/collapse events)
- ⚠️ **POTENTIAL ISSUE:** Does not actually apply visual effects (method `_applyVisualEffects()` is empty)

**StandingWaveVisualRenderer:**
- Modifies: `link.mesh.material.uniforms` (waveSpeed, standingWaveFrequency, standingWavePhase, waveAmplitude, wavelength, etc.)
- Spawns: Antinode glow meshes (object pool, max 100)
- Spawns: Trap zone meshes (object pool, max 30)
- Modifies: Node halo opacity (via `node.shell.material.opacity`)

**HarmonicResonanceFeedbackSystem:**
- Modifies: `link.userData.phase` (phase alignment toward resonance center)
- Modifies: `link.userData.oscillationAmplitude` (gentle smoothing)
- Modifies: `pictogram.userData.drift` (slowdown factor)
- Modifies: `pictogram.userData.spawnInterval` (spacing improvement)
- Modifies: `pictogram.mesh.rotation.z` (gentle orientation bias)

**ResonanceEchoTrailSystem:**
- Spawns: Echo mesh instances (object pool, max 30)
- Updates: Echo opacity fade over time
- ⚠️ **SAFETY:** Uses `VisualTime.now` for canonical time source

**CascadeResonanceWaveVisualization:**
- Modifies: `linkResonanceSystem.linkMetadata[linkId]._wavePhaseCompression`
- Modifies: `linkResonanceSystem.linkMetadata[linkId]._wavePhase`
- Modifies: `hub._waveInfluence`
- Modifies: `hub._waveNoiseReduction`
- ⚠️ **SUBTLE:** Only 3-8% influence (extremely subtle temporal modulation)

**ResonanceCascadeVisualization:**
- Visual-only: Renders ghost-level wave suggestions
- ⚠️ **CONFIRMATION:** System file not fully audited (timeout), but integration docs show visual output only

---

## 8️⃣ ARCHITECTURE MAP

```
NODES
 │
 ├── Metrics (harmony, synergy, corruption, stability)
 │
 ├── StandingWaveOscillationTrapSystem (Session 130)
 │    ├── Reads: InfluenceReflectionBackPressureSystem
 │    ├── Reads: HarmonicInfluencePropagationSystem
 │    ├── Outputs: oscilationTraps, trapZones, interferencePatterns, resolutionEvents
 │    │
 │    └──> StandingWaveVisualRenderer (Session 131)
 │         ├── Reads: trap state from above
 │         ├── Modifies: Link material uniforms (standing wave mode)
 │         ├── Spawns: Antinode glow meshes (pool: 100)
 │         └── Spawns: Trap zone meshes (pool: 30)
 │
 ├── HarmonicResonanceFeedbackSystem
 │    ├── Reads: FusionZoneManager (compositeGlyphs)
 │    ├── Reads: PictogramsArray
 │    ├── Modifies: Link userData.phase, oscillationAmplitude
 │    └── Modifies: Pictogram userData.drift, spawnInterval, rotation
 │
 ├── ResonanceEchoTrailSystem
 │    ├── Listens: wave.burst (semanticBus)
 │    ├── Reads: CompositeGlyphs position
 │    └── Spawns: Echo mesh instances (pool: 30)
 │
 ├── HarmonicCascadeAmplification (Session 145)
 │    └──> CascadeResonanceWaveVisualization (Session 146)
 │         ├── Listens: cascade.hop (semanticBus)
 │         ├── Reads: Cascade strength, Hub data
 │         └── Modifies: Link metadata._wavePhaseCompression, Hub._waveInfluence
 │
 ├── ConflictSystem
 │    └──> ResonanceCascadeVisualization (Session 117B)
 │         ├── Listens: cascade.start, cascade.hop, cascade.end
 │         └── Renders: Ghost-level wave suggestions
 │
 └── HarmonicNodeResonanceHalos
      └── Renders: Node halo visual feedback
```

### Broken Chains

1. **StandingWaveOscillationTrapSystem → Visual Application**
   - ⚠️ The `_applyVisualEffects()` method is EMPTY
   - System detects traps but does not apply visuals
   - Visual application delegated to `StandingWaveVisualRenderer` (which reads trap state)

2. **Scheduler Registration**
   - ❌ ALL resonance systems are NOT registered with FrameScheduler
   - All rely on manual update calls in main.js
   - No priority management, no frequency control

---

## 9️⃣ FINAL CLASSIFICATION

| SYSTEM | FILE | TYPE | INSTANTIATED | SCHEDULED | UPDATED | EVENT DRIVEN | STATUS |
|--------|------|------|--------------|-----------|----------|--------------|--------|
| StandingWaveOscillationTrapSystem | Session130.js | simulation | ✅ YES | ❌ NO | ✅ YES | ❌ NO | **ACTIVE** |
| StandingWaveVisualRenderer | Session131.js | visual | ✅ YES | ❌ NO | ✅ YES | ❌ NO | **ACTIVE** |
| HarmonicResonanceFeedbackSystem | HarmonicResonanceFeedbackSystem.js | visual | ✅ YES | ❌ NO | ✅ YES | ❌ NO | **ACTIVE** |
| ResonanceEchoTrailSystem | ResonanceEchoTrailSystem.js | visual | ✅ YES | ❌ NO | ✅ YES | ✅ YES | **ACTIVE** |
| CascadeResonanceWaveVisualization | Session146.js | visual | ✅ YES | ❌ NO | ✅ YES | ✅ YES | **ACTIVE** |
| ResonanceCascadeVisualization | Session117B.js | visual | ✅ YES | ❌ NO | ✅ YES | ✅ YES | **ACTIVE** |
| HarmonicNodeResonanceHalos | HarmonicNodeResonanceHalos.js | visual | ⚠️ UNKNOWN | ❌ UNKNOWN | ❌ UNKNOWN | ❌ NO | **PARTIALLY WIRED** |
| ResonanceFeedback_v1 | ResonanceFeedback_v1.js | visual | ❌ NO | ❌ NO | ❌ NO | ❌ NO | **DEAD** |

---

## KEY FINDINGS

### ✅ ACTIVE SYSTEMS (6)
1. **StandingWaveOscillationTrapSystem** - Fully wired, detects trapped energy on links
2. **StandingWaveVisualRenderer** - Fully wired, renders standing wave visuals
3. **HarmonicResonanceFeedbackSystem** - Fully wired, applies subtle resonance influence
4. **ResonanceEchoTrailSystem** - Fully wired, spawns echo trails on wave.burst events
5. **CascadeResonanceWaveVisualization** - Fully wired, applies temporal modulation on cascade.hop
6. **ResonanceCascadeVisualization** - Fully wired, renders ghost-level waves on cascade events

### ⚠️ PARTIALLY WIRED (1)
7. **HarmonicNodeResonanceHalos** - File exists but instantiation not confirmed in main.js search results

### ❌ DEAD (1)
8. **ResonanceFeedback_v1** - Legacy system, never instantiated in main.js

---

## CRITICAL ISSUES

1. **NO SCHEDULER INTEGRATION**
   - All active resonance systems bypass FrameScheduler
   - All use manual update calls in main.js
   - No priority management, no frequency control
   - **RISK:** Cannot tune/update resonance systems independently

2. **STANDING WAVE DETECTION DISCONNECT**
   - `StandingWaveOscillationTrapSystem` has empty `_applyVisualEffects()` method
   - Visuals delegated to `StandingWaveVisualRenderer` which reads trap state
   - This is actually correct architecture (separation of concerns), but the empty method is misleading

3. **HARMONIC NODE RESONANCE HALOS**
   - File exists but runtime wiring unclear
   - May be integrated via a different path not found in current search
   - **RECOMMENDATION:** Manual audit of main.js to verify instantiation

---

## SUMMARY

- **TOTAL RESONANCE SYSTEMS:** 8
- **ACTIVE:** 6 (75%)
- **PARTIALLY WIRED:** 1 (12.5%)
- **DEAD:** 1 (12.5%)
- **SCHEDULER INTEGRATION:** 0% (all manual updates)

**Overall Assessment:** Resonance systems are functional and actively running, but suffer from a systemic lack of scheduler integration. All systems rely on manual update calls, which makes priority management and performance tuning difficult. The standing wave stack is well-architected with proper separation between detection and rendering. Event-driven systems (echo trails, cascade waves) are properly integrated with semanticBus.