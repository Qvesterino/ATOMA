# VFX Systems Incomplete Diagnosis — Deep Dive Audit

**Date:** 2026-04-15
**Scope:** All VFX systems listed in `MEMORY.md` → `## VFX Systems Catalog`
**Method:** Automated search for primitive geometries, TODO/FIXME/TEMP markers, stub functions, dead code, disabled features, and placeholder implementations.

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 CRITICAL | 2 | Entire systems are stubs with zero implementation |
| 🟠 HIGH | 4 | Dead code, disabled safeguards, debug logs left in production |
| 🟡 MEDIUM | 8 | Incomplete implementations, placeholder logic, missing visual output |
| 🔵 LOW | 3 | Debug artifacts, temporary flags |
| ⚪ PRIMITIVE | 13 | VFX systems using raw primitive geometries as primary visual output |

---

## 🔴 CRITICAL — Stub/Placeholder Systems (No Implementation)

### 1. `InfluenceAttenuationAbsorptionSystem_Session128.js`
**Status:** ENTIRE SYSTEM IS A STUB

- File explicitly states: `Status: PLACEHOLDER (Session 128)` (line 19)
- `setup()` → no-op (line 56-58)
- `update()` → no-op (line 65-68)
- `dispose()` → no-op (line 74-76)
- Has full config object (lines 40-49) but zero visual output
- Created only to "restore the ES module import contract"
- **Impact:** System is imported and instantiated but does absolutely nothing. Wires exist but no visuals are produced.

### 2. `MegaGlyphSystem.js` — 13 Unimplemented Animation Methods
**Status:** All glyph animation update methods are empty TODO stubs (lines 595-607)

```javascript
updateAiConsciousnessGlyph() { /* TODO */ }
updateMythicSeedGlyph() { /* TODO */ }
updateAscendedNodeGlyph() { /* TODO */ }
updateEvolutionStage1Glyph() { /* TODO */ }
updateEvolutionStage2Glyph() { /* TODO */ }
updateEvolutionStage3Glyph() { /* TODO */ }
updatePersonalityHarmonyGlyph() { /* TODO */ }
updatePersonalityStabilityGlyph() { /* TODO */ }
updatePersonalityCorruptionGlyph() { /* TODO */ }
updatePersonalitySynergyGlyph() { /* TODO */ }
updateEventMythicRitualGlyph() { /* TODO */ }
updateEventClusterSurgeGlyph() { /* TODO */ }
updateEventWorldEventGlyph() { /* TODO */ }
```

- `updateGlyphAnimation()` (line 585) delegates to these methods via dynamic dispatch
- All 13 glyph types animate with zero visual change
- **Impact:** All mega glyph visuals are static — no animation, no pulsing, no state-driven visual feedback

---

## 🟠 HIGH — Dead Code / Disabled Functionality

### 3. `AINodes.js` — Dead Code in `createActivationPulse()`
**Location:** Line 3266

```javascript
createActivationPulse(node) {
    return null;  // ← Early return kills everything below
    const pulseGeometry = new THREE.RingGeometry(0.5, 0.6, 32);  // DEAD CODE
    // ... 15+ more lines of unreachable RingGeometry pulse code
}
```

- The entire activation pulse visual is dead code
- Node activation produces no visual pulse effect
- **Fix:** Either remove the dead code or restore the pulse with proper orchestrator integration

### 4. `CascadeParticleSystem_Session120.js` — Disabled Intensity Gating
**Location:** Lines 1625-1626, 1776-1777

```javascript
// TEMPORARILY DISABLED: intensity gating to debug spawn issues
// if (clampedIntensity < this.config.minimumVisibleIntensity) return;
```

```javascript
// TEMPORARILY DISABLED: isRelevant gating to debug spawn issues
// if (!linkState?.isRelevant) return;
```

- Two critical performance safeguards are disabled
- Results in excessive particle spawning (no minimum intensity filter)
- Results in particles on irrelevant links (no relevance filter)
- **Impact:** Performance degradation, visual noise from irrelevant link emissions

### 5. `LinkCorruptionTransmission_v1.js` — 5 Temporary Debug Logs
**Locations:** Lines 1941, 1973, 2422, 2546, 2676

```javascript
// TEMPORARY DEBUG LOG (marked for removal)
if (Math.random() < 0.01) { console.log(...) }
```

- 5 debug logs scattered across the system
- All marked "for removal" but still present
- Random 1% sampling causes non-deterministic console output
- **Impact:** Console pollution in production, slight performance overhead from random checks

### 6. `main.js` — Disabled Systems
**Locations:** Lines 43-44, 81-82, 6614-6620

```javascript
// TEMP DISABLED: SphereCreatorTrace blocking spawn pipeline
// TEMP DISABLED: VisualSpherePolicy blocking spawn pipeline (Object3D.add)
```

- `SphereCreatorTrace` — completely disabled (import commented out)
- `VisualSpherePolicy` — completely disabled (import commented out)
- Both are confirmed disabled at runtime too (lines 6614-6620)
- **Impact:** No sphere geometry policing in the scene, no tracing of sphere creators

---

## 🟡 MEDIUM — Incomplete Implementations

### 7. `CascadingRuptureSystem.js` — Missing Standing Wave Query
**Location:** Line 369

```javascript
const standingWaveEnergy = 0.0; // TODO: query standing wave system
```

- Standing wave energy is hardcoded to 0.0
- Factor 4 in rupture probability calculation never contributes
- Standing wave systems exist (`StandingWaveOscillationTrapSystem_Session130.js`, `WaveInterferenceEngine_v1.js`)
- **Impact:** Rupture probability is incomplete — standing wave tension never triggers ruptures

### 8. `HarmonicHealingVisualSystem_Session134.js` — Missing Arrival Event
**Location:** Line 77

```javascript
// TODO: Trigger arrival event (healing impact)
```

- Healing projectile reaches target but produces no visual feedback on arrival
- No impact burst, no glow flash, no healing wave
- **Impact:** Healing feels incomplete — projectile travels but "disappears" silently

### 9. `InfluenceReflectionBackPressureSystem_Session129.js` — Deferred Visual Effects
**Location:** Lines 515-521

```javascript
_applyVisualEffects() {
    // Visual-only: this method would apply effects to link materials, node shells, etc.
    // For this stub, we defer full implementation to next iteration
}
```

- System has data structures (pressure zones, reflection pulses, surface ripples)
- But `_applyVisualEffects()` is completely empty
- No link thickness modulation, no wave compression, no color shifts, no surface ripple meshes
- **Impact:** System computes state but produces zero visual output

### 10. `NodeVisualStateBinder.js` — Placeholder Link Arc FX
**Location:** Lines 361-368

```javascript
function createLinkArcFX(node, options = {}) {
    // This is a placeholder for the visual arc
    // In actual implementation, create a Bezier curve mesh
    return null;
}
```

- Link arc visual effect returns null
- No Bezier curve mesh, no glow/emission material
- **Impact:** No visual arc connecting linked nodes from this system

### 11. `LinkCascadePulseManager.js` — Placeholder Quality Computation
**Location:** Line 307

```javascript
const quality = current.quality * 0.9; // Slight quality loss per hop
// (This is a placeholder; could be computed from link harmony/synergy)
```

- Quality decay is a flat 0.9 multiplier per hop
- Should derive from actual link metrics (harmony/synergy)
- **Impact:** Cascade pulse propagation doesn't reflect actual link health

### 12. `ComputeSynergyScore2_1.js` — Placeholder Enhancement Hooks
**Location:** Lines 71-74

```javascript
applyEnergyFactor: options.applyEnergyFactor ?? false,
applyHarmonyBoost: options.applyHarmonyBoost ?? false,
applyChaosPenalty: options.applyChaosPenalty ?? false,
```

- Three enhancement hooks exist but default to `false`
- Hooks are referenced in computation (line 211+) but never activated
- **Impact:** Synergy score is simpler than designed — no energy, harmony boost, or chaos factors

### 13. `main.js` — Stub Systems for Conflict and Resonance
**Location:** Lines 11391-11403

```javascript
this.conflictSystem = {
    getConflictState: () => ({ intensity: 0, active: false })
};
this.resonanceSystem = {
    getResonanceState: () => ({ intensity: 0, active: false })
};
```

- If real systems aren't available, stubs always return zero intensity / inactive
- `ResonanceCascadeVisualization_Session117B` receives these stubs
- **Impact:** Cascade visualization has no real conflict/resonance data when stubs are used

### 14. `FresnelAuraIntegrationPatch.js` — Camera Placeholder
**Location:** Lines 239-241

```javascript
// NOTE: Camera object must be in scope; update this with actual camera instance
// This is a placeholder - integrate with your camera instance
// uniforms.uCameraPosition.value.copy(camera.position);
```

- Fresnel rim light effect requires camera position for view-dependent rendering
- Camera position update is commented out / placeholder
- **Impact:** Fresnel aura doesn't track camera — rim lighting is static instead of view-dependent

---

## 🔵 LOW — Debug Artifacts

### 15. `AINodes.js` — 4 TEMP DEBUG Flags
**Locations:** Lines 431, 1903, 3887, 4382

- `ATOMA_DEBUG_SPHERE_SCAN` — scene sphere scanning (line 431)
- `spawnVisualAudit` — spawn visual audit logging (line 1903)
- `frustumCulled = false` — prevents frustum culling on ALL spawned nodes (line 3887)
- Bounding sphere radius logging (line 4382)

**Note:** The `frustumCulled = false` on line 3887 is particularly concerning — it forces ALL spawned nodes to render even when off-screen, which impacts performance.

### 16. `FresnelAuraIntegrationPatch.js` — TEMP DEBUG Visibility
**Location:** Line 138-139

```javascript
// TEMP DEBUG: disable halo sphere to identify visual artifact source.
aura.visible = true;
```

- Debug flag left at `true` with comment suggesting it was meant to be toggled

### 17. `CascadeParticleSystem_Session120.js` — Debug Visualization
**Location:** Lines 2345-2347

```javascript
const particleGeo = new THREE.SphereGeometry(0.22, 8, 8);
const endpointGeo = new THREE.SphereGeometry(0.3, 10, 10);
```

- Debug visualization spheres for cascade particles — large, visible, not production quality

---

## ⚪ PRIMITIVE GEOMETRY — VFX Systems Using Raw Primitives as Primary Visuals

These systems use raw `SphereGeometry`, `IcosahedronGeometry`, `BoxGeometry`, `RingGeometry`, or `TorusGeometry` as their **primary visual output** rather than as building blocks for complex composite geometry. This results in visually primitive effects that don't meet the "2026+ quality bar" target.

### Particle Systems Using Raw Spheres

| # | System | Location | Geometry | Notes |
|---|--------|----------|----------|-------|
| 18 | `MetricReactiveWorldEvents.js` | Lines 928, 957, 994, 1083, 1145, 1364 | `SphereGeometry(0.08-0.15, 4-8)` | 6+ locations with raw sphere particles |
| 19 | `EvolutionRegistry.js` | Line 480 | `SphereGeometry(0.08, 8, 8)` | Raw sphere particles for evolution |
| 20 | `AIConsciousnessLayer.js` | Line 886 | `SphereGeometry(0.12, 10, 8)` | Raw sphere for consciousness pulses |
| 21 | `AINodes.js` | Line 2273 | `SphereGeometry(0.08, 8, 8)` | Raw sphere particles in fractal projection |

### VFX Systems Using Raw Primitives for Core Visuals

| # | System | Location | Geometry | Notes |
|---|--------|----------|----------|-------|
| 22 | `ColonyVFXManager.js` | Lines 687, 727, 836 | `IcosahedronGeometry`, `SphereGeometry` | Raw orbitals and glow spheres |
| 23 | `ArchetypeVisualDifferentiationSystem_v1.js` | Lines 383, 396, 414 | `SphereGeometry`, `TorusGeometry` | Raw glow sphere + torus rim for archetype visuals |
| 24 | `AnimatedLinkFlow.js` | Line 252 | `IcosahedronGeometry(packetSize, 2)` | Raw icosahedron for data packets |
| 25 | `ControlNodeGeometries_v1.js` | Line 71 | `SphereGeometry` | Raw sphere for control node cores |
| 26 | `HarmonicResonanceCoupling_v1.js` | Lines 263, 279 | `SphereGeometry`, `TorusGeometry` | Raw sphere orb + torus halo |
| 27 | `HarmonicInfluencePropagationSystem_Session127.js` | Lines 191, 197 | `IcosahedronGeometry` | Raw icosahedron for influence aura |
| 28 | `HarmonicResonanceFeedbackSystem.js` | Line 1204 | `SphereGeometry(1, 16, 16)` | Debug field visualization |
| 29 | `HarmonicTopologyLearningSystem.js` | Lines 678, 690 | `SphereGeometry` | Debug markers |
| 30 | `HealingParticleSystem_Session136.js` | Lines 320, 331 | `BoxGeometry(80)`, `SphereGeometry` | Debug cube + probe |

### Event Systems Using Raw Rings/Torus

| # | System | Location | Geometry | Notes |
|---|--------|----------|----------|-------|
| 31 | `ColonyVFXManager.js` | Lines 1331, 1353, 1374, 1398, 1420, 1440, 1459, 1478 | `TorusGeometry`, `SphereGeometry`, `RingGeometry` | All colony events use raw primitives |
| 32 | `EchoRippleSystem_Session125.js` | Lines 127-129 | `RingGeometry`, `CircleGeometry` | Raw ring + circle for echo ripples |
| 33 | `CognitiveHorizonPlane.js` | Lines 1071, 1141, 1241 | `RingGeometry`, `TorusGeometry` | Raw rings for horizon effects |

---

## Category-by-Category Assessment

### Link Visual Systems (35+)
- **Overall:** Mostly complete. Main gap is `createLinkArcFX()` returning null in `NodeVisualStateBinder.js`.
- **Primitive concern:** `AnimatedLinkFlow.js` uses raw icosahedron for data packets.

### Resonance Systems (9)
- **Overall:** Functional but `HarmonicResonanceFeedbackSystem.js` uses raw SphereGeometry for debug field.
- **Gap:** `HarmonicResonanceCoupling_v1.js` uses raw sphere+torus for core visuals.

### Cascade Systems (16)
- **Overall:** Critical issue: `CascadeParticleSystem_Session120.js` has disabled intensity gating.
- **Gap:** `CascadingRuptureSystem.js` has hardcoded `standingWaveEnergy = 0.0`.

### Wave Systems (8)
- **Overall:** Complete. Standing wave systems exist but aren't wired to rupture system.

### Particle Systems (13)
- **Overall:** Functional. Debug visualization spheres in `CascadeParticleSystem_Session120.js` (line 2345-2347) should be removed.

### Synergy VFX (9)
- **Overall:** `ComputeSynergyScore2_1.js` has placeholder enhancement hooks that are never activated.

### Harmony Systems (9)
- **Overall:** `HarmonicHealingVisualSystem_Session134.js` missing arrival event.
- **Gap:** `HarmonicInfluencePropagationSystem_Session127.js` uses raw icosahedron for aura.

### Corruption VFX (5)
- **Overall:** Complete. `LinkCorruptionTransmission_v1.js` has 5 debug logs marked for removal.

### Glyph Systems (15+)
- **Overall:** `MegaGlyphSystem.js` has 13 completely unimplemented animation methods — all glyphs are static.

### Node Visual Systems (13)
- **Overall:** `AINodes.js` has dead code in `createActivationPulse()` and `frustumCulled = false` on all nodes.

### Environmental VFX (6)
- **Overall:** `MetricReactiveWorldEvents.js` uses raw SphereGeometry for all particles (6+ locations).

### Colony VFX (1)
- **Overall:** `ColonyVFXManager.js` uses raw primitives for all event visuals (birth, collapse, growth, merge, split, transformation).

---

## Recommended Fix Priority

### Immediate (Performance & Correctness)
1. **Re-enable intensity gating** in `CascadeParticleSystem_Session120.js` (lines 1625, 1776)
2. **Remove `frustumCulled = false`** from `AINodes.js` (line 3887) — forces all nodes to render always
3. **Remove 5 debug logs** from `LinkCorruptionTransmission_v1.js`

### Short Term (Visual Quality)
4. **Implement `InfluenceAttenuationAbsorptionSystem_Session128.js`** or remove from imports
5. **Implement 13 glyph animation methods** in `MegaGlyphSystem.js`
6. **Add healing arrival event** in `HarmonicHealingVisualSystem_Session134.js`
7. **Implement `_applyVisualEffects()`** in `InfluenceReflectionBackPressureSystem_Session129.js`
8. **Wire standing wave query** in `CascadingRuptureSystem.js`

### Medium Term (Visual Polish)
9. **Replace raw sphere particles** in `MetricReactiveWorldEvents.js` with GPU particle system
10. **Replace raw primitives** in `ColonyVFXManager.js` events with composite geometry
11. **Implement `createLinkArcFX()`** in `NodeVisualStateBinder.js`
12. **Wire camera position** in `FresnelAuraIntegrationPatch.js`
13. **Clean up dead code** in `AINodes.js` `createActivationPulse()`
14. **Derive quality from metrics** in `LinkCascadePulseManager.js`

### Long Term (Architecture)
15. **Activate enhancement hooks** in `ComputeSynergyScore2_1.js`
16. **Replace stub systems** in `main.js` with real implementations or graceful degradation
17. **Upgrade primitive geometries** across all VFX systems to composite/deformed geometry
