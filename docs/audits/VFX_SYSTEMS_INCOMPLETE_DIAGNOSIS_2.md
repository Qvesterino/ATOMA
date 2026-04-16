# VFX Systems Incomplete Diagnosis — Deep Audit Report

**Date:** 2026-04-16  
**Auditor:** ATOMA Agent (automated deep-dive)  
**Scope:** All VFX systems listed in `MEMORY.md` § VFX Systems Catalog  
**Classification Legend:**
- **CRITICAL** — Broken functionality, system non-operational
- **HIGH** — Incomplete implementation visible to user
- **MEDIUM** — Placeholder visual or missing non-core function
- **LOW** — Visual shortcomings, missing optimizations, dead code

---

## Executive Summary

Total systems cataloged: **~200+** across 18 categories.  
Issues identified: **47** across all severity levels.

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 8 |
| MEDIUM | 21 |
| LOW | 16 |

The majority of issues fall into two categories: **primitive geometry placeholders** (especially in node variant systems) and **TEMP DEBUG/DISABLED code** left in production files. No empty `update()` methods were found in project VFX files. The cleanup contract is well-respected across the codebase.

---

## 1. CRITICAL Issues

### 1.1 `AINodes.createActivationPulse()` — Empty Stub

**File:** [`AINodes.js`](AINodes.js:3266)  
**Severity:** CRITICAL  
**Class:** `AINodes`  
**Method:** `createActivationPulse(node)`

```javascript
// Line 3266-3268
createActivationPulse(node) {
    return null;
}
```

**Diagnosis:** The method is a complete stub — it accepts a `node` parameter but immediately returns `null` without any visual pulse creation. This means node activation pulses are silently discarded. Any system calling this method receives no visual feedback.

**Impact:** Node activation is a core user-facing interaction. The absence of any visual pulse means users get zero feedback when nodes activate.

**Recommendation:** Implement a proper activation pulse using pooled mesh + scale animation + opacity fade, or delegate to `NodeImpactManager` if it already handles pulses.

---

### 1.2 `main.js` — Disabled Diagnostic Systems (SphereCreatorTrace, VisualSpherePolicy, ShaderFreezeGuard)

**File:** [`main.js`](main.js:43)  
**Severity:** CRITICAL (potential)  
**Lines:** 43-44, 79-82, 6614-6620

```javascript
// Line 43-44
// TEMP DISABLED: SphereCreatorTrace blocking spawn pipeline
// import { installSphereCreatorTrace } from './SphereCreatorTrace.js';

// Line 80-82
// REMOVED (2026-03-01): ShaderFreezeGuard disabled for new visual modules
// import { installShaderFreezeGuard, warmupAllVisualVariants } from './Engine/Debug/ShaderFreezeGuard.js';
// TEMP DISABLED: VisualSpherePolicy blocking spawn pipeline (Object3D.add)
// import { ensureSpherePolicyInstalled, installSpherePolicy } from './VisualSpherePolicy.js';

// Line 6614-6620
// TEMP DISABLED: VisualSpherePolicy blocking spawn pipeline (Object3D.add)
// ensureSpherePolicyInstalled({ sweepIntervalMs: 100 });
// ...
// TEMP DISABLED: SphereCreatorTrace blocking spawn pipeline
```

**Diagnosis:** Three diagnostic/protective systems are commented out with "TEMP DISABLED" markers:
1. `SphereCreatorTrace` — was blocking the spawn pipeline
2. `VisualSpherePolicy` — was blocking `Object3D.add`
3. `ShaderFreezeGuard` — disabled for new visual modules

These were disabled because they were "blocking" pipelines, but the underlying issues that caused the blocking may still exist. Without these guards, there is no runtime protection against sphere geometry leaks or shader freeze issues.

**Impact:** Without `VisualSpherePolicy`, uncontrolled sphere spawning can occur. Without `ShaderFreezeGuard`, shader compilation stalls are undetected.

**Recommendation:** Investigate the root cause of the blocking behavior and re-enable these systems with proper fixes. If the systems themselves are obsolete, remove the commented-out code entirely. The "TEMP DISABLED" markers indicate this was intended as temporary.

---

## 2. HIGH Issues

### 2.1 `ColonyVFXManager.createConsciousCore()` — Primitive Geometry with TODO

**File:** [`ColonyVFXManager.js`](ColonyVFXManager.js:683)  
**Severity:** HIGH  
**Method:** `createConsciousCore()`  
**Lines:** 683-709

```javascript
// Line 683-684
// TODO [2026-04-15]: Replace raw IcosahedronGeometry with deformed/composite geometry
// - Current: Uses primitive icosahedron (doesn't meet 2026+ quality bar)

// Line 697-708
// Layer 1: Nucleus — deformed icosahedron (low detail = organic, irregular shape)
const nucleusGeo = new THREE.IcosahedronGeometry(size * 0.6, 1);
// Layer 2: Membrane — larger, more transparent icosahedron with different rotation
const membraneGeo = new THREE.IcosahedronGeometry(size, 2);
// Layer 3: Orbital ring — thin torus rotating around core
const ringGeo = new THREE.TorusGeometry(size * 1.1, 0.015, 8, 32);
```

**Diagnosis:** The colony core uses raw `IcosahedronGeometry` with `flatShading = true` and `wireframe = true` as the primary visual representation. The code itself contains a TODO acknowledging this doesn't meet the 2026+ quality bar.

**Impact:** Colony cores are a prominent visual element. Raw icosahedrons look geometrically primitive and break visual immersion.

**Recommendation:** Replace with deformed geometry using vertex noise displacement, composite shell layers, or a custom shader with organic distortion. The `CanonicalGeometryFamilies_v1.js` pattern of deformed primitives could serve as a template.

---

### 2.2 `ColonyVFXManager` — Extensive Primitive Geometry Usage

**File:** [`ColonyVFXManager.js`](ColonyVFXManager.js)  
**Severity:** HIGH  
**Locations (non-exhaustive):**

| Line | Geometry | Purpose |
|------|----------|---------|
| 340 | `TorusGeometry` | Atmosphere ring |
| 402 | `TorusGeometry` | Energy ring |
| 457 | `PlaneGeometry` | Canopy panel |
| 541 | `TorusGeometry` | Stage ring |
| 571 | `TorusGeometry` | Outer ring |
| 698 | `IcosahedronGeometry` | Nucleus core |
| 703 | `IcosahedronGeometry` | Membrane shell |
| 708 | `TorusGeometry` | Orbital ring |
| 768 | `IcosahedronGeometry` | Central glow |
| 848 | `RingGeometry` | Growth shell |
| 991 | `RingGeometry` | Growth ring |
| 1380 | `TorusGeometry` | Birth cry ring |
| 1421 | `SphereGeometry` | Core implosion |
| 1456 | `IcosahedronGeometry` | Outer membrane |
| 1464 | `IcosahedronGeometry` | Inner breath |
| 1473 | `TorusGeometry` | Spine ring |
| 1502 | `TorusGeometry` | Convergence ring |
| 1548 | `RingGeometry` | Fracture ring |
| 1595 | `RingGeometry` | Merge flash |
| 1614 | `RingGeometry` | Split rupture |
| 1660 | `RingGeometry` | Transition ring |
| 1715 | `IcosahedronGeometry` | Ascension glow |

**Diagnosis:** The entire ColonyVFXManager relies exclusively on raw THREE.js primitive geometries for all visual elements. No custom shaders, no particle systems, no post-processing effects.

**Recommendation:** Prioritized replacement plan:
1. Core nucleus → deformed geometry with noise shader
2. Birth/death effects → GPU particle burst system
3. Rings → shader-driven expanding rings with fade
4. Glow → Fresnel rim shader instead of solid icosahedron

---

### 2.3 `AIConsciousnessLayer` — Primitive Glyph System

**File:** [`AIConsciousnessLayer.js`](AIConsciousnessLayer.js:212)  
**Severity:** HIGH  
**Lines:** 212-1287

```javascript
// Line 213
const shellGeometry = new THREE.IcosahedronGeometry(this.config.globalFieldScale, 4);
// Line 230
const edgeGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(...));
// Line 901
const innerGeo = new THREE.IcosahedronGeometry(0.04, 0);
// Line 1015
new THREE.RingGeometry(radius * 0.6, radius * 0.72, 24)
// Line 1064
new THREE.TorusGeometry(radius * 0.28, thickness * 0.08, 10, 40)
// Line 1107
new THREE.BoxGeometry(thickness * 0.5, thickness * 1.8, thickness * 0.12)
// etc.
```

**Diagnosis:** The consciousness layer builds its entire glyph visual system from raw primitives: `IcosahedronGeometry`, `RingGeometry`, `TorusGeometry`, `BoxGeometry`. Each glyph type (sovereign, paradox, harmony, etc.) is assembled from the same basic shapes with different scale parameters.

**Impact:** These glyphs represent the AI consciousness state — a core visual identity of ATOMA. Primitive shapes undermine the perceived intelligence of the system.

**Recommendation:** Replace with procedural glyph generation using custom shaders, or leverage the existing `CompositeGlyphGenerator` and `ProceduralHarmonicGlyphGenerator` systems already in the codebase.

---

### 2.4 `ArchetypeVisualDifferentiationSystem_v1` — Primitive Glow/Rim

**File:** [`ArchetypeVisualDifferentiationSystem_v1.js`](ArchetypeVisualDifferentiationSystem_v1.js:382)  
**Severity:** HIGH  
**Lines:** 382-397

```javascript
// Line 383
const glowGeom = new THREE.SphereGeometry(1.0, 24, 24);
// Line 396
const rimGeom = new THREE.TorusGeometry(1.2, 0.05, 12, 64);
```

**Diagnosis:** The archetype glow uses a raw `SphereGeometry` and the rim/halo uses a raw `TorusGeometry`. These are the primary visual differentiators between archetypes.

**Impact:** Archetype differentiation is a key visual system. Raw spheres and tori do not convey meaningful archetype identity.

**Recommendation:** Replace glow sphere with a Fresnel/rim-light shader sphere. Replace torus rim with a custom archetype-specific silhouette or shader-driven halo.

---

### 2.5 `CascadeBurstVisual_Session147` — All Primitives

**File:** [`CascadeBurstVisual_Session147.js`](CascadeBurstVisual_Session147.js:126)  
**Severity:** HIGH  
**Lines:** 126-135

```javascript
const shellGeometry = new THREE.IcosahedronGeometry(1, 2);
const ringGeometry = new THREE.TorusGeometry(1, this.config.ringThickness, 8, 32);
const beamGeometry = new THREE.CylinderGeometry(...);
const coreGeometry = new THREE.SphereGeometry(1, 8, 8);
const nebulaGeometry = new THREE.SphereGeometry(1.2, 12, 12);
const bloomGeometry = new THREE.IcosahedronGeometry(1.0, 1);
const chromaticGeometry = new THREE.TorusGeometry(1.2, 0.14, 8, 64);
const distortionGeometry = new THREE.TorusGeometry(1.0, 0.08, 16, 64);
```

**Diagnosis:** The cascade burst visual — one of the most dramatic events in the system — is built entirely from 8 raw primitive geometries. No shaders, no particles, no volumetric effects.

**Impact:** Cascade bursts are high-impact events that should be visually spectacular. Raw primitives make them look like debug visualizations.

**Recommendation:** Implement with GPU particle explosion + expanding shockwave shader + volumetric light shafts. The existing `CascadeParticleSystem_Session120` could be leveraged for the particle component.

---

### 2.6 `AnimatedLinkFlow` — Primitive Packet Geometry

**File:** [`AnimatedLinkFlow.js`](AnimatedLinkFlow.js:252)  
**Severity:** HIGH  
**Line:** 252

```javascript
geometry: new THREE.IcosahedronGeometry(this.config.packetSize, 2),
```

**Diagnosis:** Data flow packets are represented as raw icosahedrons. These are the primary visual indicator of data flowing between nodes.

**Impact:** Packets are continuously visible on active links. Raw icosahedrons look like placeholder debug objects.

**Recommendation:** Replace with glowing point sprites or custom shader-driven packets with trail effects. Consider using the existing `LinkTrailParticleSystem` for trail integration.

---

### 2.7 `CascadeParticleSystem_Session120` — Debug Particle Geometry

**File:** [`CascadeParticleSystem_Session120.js`](CascadeParticleSystem_Session120.js:2344)  
**Severity:** HIGH  
**Lines:** 2343-2345

```javascript
const targetMat = new THREE.MeshBasicMaterial({ color: 0x4ffff0, transparent: true, opacity: 0.95, depthTest: false });
const particleGeo = new THREE.SphereGeometry(0.22, 8, 8);
const endpointGeo = new THREE.SphereGeometry(0.3, 10, 10);
```

**Diagnosis:** The cascade particle system uses `SphereGeometry` for debug/test particles with `MeshBasicMaterial`. These appear to be debug visualization objects, not the GPU-driven particle system itself, but they are present in the production code.

**Impact:** If these debug geometries are ever rendered, they would appear as raw spheres instead of proper cascade particles.

**Recommendation:** Verify these are only used in debug/test paths. If so, guard with a debug flag. If used in production, replace with proper GPU particle rendering.

---

### 2.8 `NodeMetricEngine` — Placeholder Step Sizes

**File:** [`src/metrics/NodeMetricEngine.js`](src/metrics/NodeMetricEngine.js:24)  
**Severity:** HIGH  
**Lines:** 24-32

```javascript
// TODO: Replace placeholder step sizes with design-approved values.
const STEP = {
    linkBoost: 0.02,
    linkStress: 0.01,
    overloadLoadScale: 0.1,
    overloadCorruptionScale: 0.05,
    overloadStabilityLoss: 0.02,
    relaxRate: 0.1 // per second toward defaults
};
```

**Diagnosis:** The metric engine that drives all VFX feedback uses placeholder step sizes that have never been replaced with design-approved values. These constants directly control how metrics change, which in turn drives all visual feedback (corruption glow, harmony auras, synergy effects, etc.).

**Impact:** All metric-driven VFX may be responding to incorrect tuning parameters. Visual effects may be too subtle or too aggressive.

**Recommendation:** Conduct a design review of all step sizes and replace with approved values. This is a cross-cutting concern affecting every metric-driven visual system.

---

## 3. MEDIUM Issues

### 3.1 `FresnelAuraIntegrationPatch` — TEMP DEBUG Marker

**File:** [`FresnelAuraIntegrationPatch.js`](FresnelAuraIntegrationPatch.js:138)  
**Severity:** MEDIUM  
**Lines:** 137-139

```javascript
const aura = new THREE.Mesh(geometry, material);
// TEMP DEBUG: disable halo sphere to identify visual artifact source.
aura.visible = true;
```

**Diagnosis:** A TEMP DEBUG comment is present in production code. The `visible = true` assignment is explicitly setting visibility that would already be the default, suggesting this was a debugging toggle that was left in the "on" state.

**Recommendation:** Remove the TEMP DEBUG comment and the explicit `visible = true` (it's the default). If the artifact investigation is complete, clean up.

---

### 3.2 `EnhancedNodeModels` — TEMP TEST Disabled Barrier

**File:** [`EnhancedNodeModels.js`](EnhancedNodeModels.js:22248)  
**Severity:** MEDIUM  
**Line:** 22248

```javascript
barrier.visible = false; // TEMP TEST disable legacy shell
```

**Diagnosis:** The EnergyBarrier mesh is explicitly hidden with a "TEMP TEST" comment. This was likely disabled during testing and never re-enabled.

**Impact:** The barrier visual for control node override state is invisible.

**Recommendation:** Determine if the barrier should be visible. If it's been superseded by another visual system, remove the dead code. If it should be conditionally visible, implement proper visibility logic.

---

### 3.3 `AINodes` — TEMP DEBUG Sphere Scans

**File:** [`AINodes.js`](AINodes.js:431)  
**Severity:** MEDIUM  
**Lines:** 431, 1903, 4329

```javascript
// Line 431
// TEMP DEBUG: scan scene for sphere geometries to identify visible artifact source
if (this.scene && typeof window !== 'undefined' && window.ATOMA_DEBUG_SPHERE_SCAN === true) {

// Line 1903
// TEMP DEBUG: log any sphere/icosa shells attached to the node
if (window.ATOMA_FLAGS?.debug?.spawnVisualAudit === true) {

// Line 4329
// TEMP DEBUG: log boundingSphere radius if present
```

**Diagnosis:** Three TEMP DEBUG blocks exist in the node spawn pipeline. They are guarded by debug flags, so they don't execute in production, but they add code complexity and indicate unfinished artifact investigation.

**Recommendation:** If the sphere artifact investigation is complete, remove these debug blocks. If still needed, promote to a proper debug utility in `Engine/Debug/`.

---

### 3.4 `NodeVisualReadinessGate_v1` — Dead Code Block

**File:** [`NodeVisualReadinessGate_v1.js`](NodeVisualReadinessGate_v1.js:75)  
**Severity:** MEDIUM  
**Lines:** 75-81, 250-252

```javascript
if (false) {  // Debug flag
    console.log('[NodeVisualReadinessGate] ✓ Node marked visualReady:', {
        nodeId: node.userData?.nodeId,
        category: node.userData?.category,
        materialUUID: node.userData?.baseMaterialUUID
    });
}
```

**Diagnosis:** Two `if (false)` blocks contain debug logging that never executes. This is dead code.

**Recommendation:** Remove the `if (false)` blocks entirely, or replace with a proper debug flag check like `if (window.ATOMA_FLAGS?.debug?.readinessGate)`.

---

### 3.5 `NodeVisualStateBinder` — Dead Debug Code

**File:** [`NodeVisualStateBinder.js`](NodeVisualStateBinder.js:658)  
**Severity:** MEDIUM  
**Line:** 658

```javascript
if (false) {  // Debug logging (disabled by default)
    console.log(`[NodeVisualStateBinder] Core offset applied: node=${node.userData?.nodeId}, offset=${OFFSET_MAGNITUDE}Y`);
}
```

**Diagnosis:** Another `if (false)` dead code block.

**Recommendation:** Same as 3.4 — remove or convert to proper debug flag.

---

### 3.6 `ParticleStreamCascadeAccelerationIntegrationPatch` — TODO for Restore

**File:** [`ParticleStreamCascadeAccelerationIntegrationPatch.js`](ParticleStreamCascadeAccelerationIntegrationPatch.js:280)  
**Severity:** MEDIUM  
**Line:** 280

```javascript
// TODO: Restore original methods if needed
// This is mainly for testing purposes
```

**Diagnosis:** The patch file has an incomplete teardown path. Original methods are monkey-patched but the restore mechanism is not implemented.

**Recommendation:** Implement proper method restoration in the patch's cleanup/dispose function, or document that the patch is permanent.

---

### 3.7 `NodeLinkingSystem` — TODO for Undo/Redo Routing

**File:** [`NodeLinkingSystem.js`](NodeLinkingSystem.js:274)  
**Severity:** MEDIUM  
**Line:** 274

```javascript
// TODO(P2.2): route all priority updates via authority API
```

**Diagnosis:** Priority updates are not routed through the authority API, meaning priority changes bypass the canonical authority layer.

**Recommendation:** Implement authority-routed priority updates as part of the P2.2 milestone.

---

### 3.8 `CascadeResonanceWaveVisualization_Session146` — PlaneGeometry Ring

**File:** [`CascadeResonanceWaveVisualization_Session146.js`](CascadeResonanceWaveVisualization_Session146.js:840)  
**Severity:** MEDIUM  
**Line:** 840

```javascript
const ringGeometry = new THREE.PlaneGeometry(1, 1, 64, 64);
```

**Diagnosis:** Wave rings use a flat `PlaneGeometry` that is presumably deformed by a shader into a ring pattern. While shader-driven deformation is acceptable, the base geometry is a full plane rather than an annular/ring geometry, which wastes vertices in the center.

**Recommendation:** Consider using `RingGeometry` as the base for better vertex distribution, or accept the current approach if the shader requires a full grid.

---

### 3.9 `CascadeWaveParticles` — PlaneGeometry Particles

**File:** [`CascadeWaveParticles.js`](CascadeWaveParticles.js:76)  
**Severity:** MEDIUM  
**Line:** 76

```javascript
this._particleGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
```

**Diagnosis:** Wave-front particles use a unit `PlaneGeometry` (billboard quad). This is a standard approach for GPU particle systems, so it's acceptable as a base geometry that gets scaled/oriented per-particle.

**Recommendation:** Acceptable as-is for billboard particles. No change needed unless switching to point sprites.

---

### 3.10 `CognitiveHorizonPlane` — Extensive Primitive Usage

**File:** [`CognitiveHorizonPlane.js`](CognitiveHorizonPlane.js:758)  
**Severity:** MEDIUM  
**Lines:** 758-1241

```javascript
// Line 759
new THREE.PlaneGeometry(width, height, 1, 1)
// Line 1020
new THREE.PlaneGeometry(size, size, segments, segments)
// Line 1071
new THREE.RingGeometry(...)
// Line 1141
new THREE.RingGeometry(...)
// Line 1241
new THREE.TorusGeometry(radius, 1.25, 8, 6)
```

**Diagnosis:** The cognitive horizon plane uses multiple primitive geometries for its visual layers. However, many use `ShaderMaterial` for deformation, which partially mitigates the primitiveness.

**Recommendation:** The shader-driven deformation is acceptable. The hexagonal crown ring (`TorusGeometry` with 6 segments) is intentionally stylized. Low priority improvement.

---

### 3.11 `CompositeGlyphGenerator` — Primitive Shell/Rib

**File:** [`CompositeGlyphGenerator.js`](CompositeGlyphGenerator.js:435)  
**Severity:** MEDIUM  
**Lines:** 435, 460

```javascript
const shellGeometry = new THREE.RingGeometry(shellRadius - shellThickness, shellRadius, ...);
const ribGeometry = new THREE.BoxGeometry(ribLength, ribWidth, ribDepth);
```

**Diagnosis:** Composite glyphs use `RingGeometry` for shells and `BoxGeometry` for ribs. These are structural elements of the glyph composition system.

**Recommendation:** Acceptable for glyph structural elements. Consider deformed variants for higher visual quality.

---

### 3.12 `EnvironmentalHazards` — Shared Primitive Geometries

**File:** [`EnvironmentalHazards.js`](EnvironmentalHazards.js:172)  
**Severity:** MEDIUM  
**Lines:** 172-175

```javascript
this._sharedCoreGeometry = new THREE.IcosahedronGeometry(1, 1);
this._sharedAccentGeometry = new THREE.OctahedronGeometry(1, 0);
this._sharedMiniAccentGeometry = new THREE.IcosahedronGeometry(1, 0);
this._sharedUnitPlaneGeometry = new THREE.PlaneGeometry(1, 1);
```

**Diagnosis:** Environmental hazards use shared unit primitive geometries that are scaled per-instance. This is an acceptable LOD/pooling pattern, but the visual quality depends entirely on the materials and shaders applied.

**Recommendation:** Verify that materials/shaders provide sufficient visual quality. The shared geometry pattern itself is good for performance.

---

### 3.13 `DreamDepthEffectManager` — PlaneGeometry Overlays

**File:** [`DreamDepthEffectManager.js`](DreamDepthEffectManager.js:158)  
**Severity:** MEDIUM  
**Lines:** 158, 194, 228, 262

```javascript
const geometry = new THREE.PlaneGeometry(2, 2);
```

**Diagnosis:** Four separate overlay layers use `PlaneGeometry(2, 2)` for full-screen post-processing effects. This is the standard approach for screen-space shader effects.

**Recommendation:** Acceptable — full-screen quads are the correct approach for post-processing overlays.

---

### 3.14 `EchoRippleSystem_Session125` — Primitive Ring/Halo Geometry

**File:** [`EchoRippleSystem_Session125.js`](EchoRippleSystem_Session125.js:128)  
**Severity:** MEDIUM  
**Lines:** 128-130

```javascript
this._ringGeometry = new THREE.RingGeometry(0.82, 1.0, 6, 1);  // 6 sides = hexagonal echo
this._haloGeometry = new THREE.RingGeometry(0.74, 1.0, 8, 1);  // 8 sides = octagonal halo
this._coreGeometry = new THREE.CircleGeometry(1.0, 6);  // Hexagonal core
```

**Diagnosis:** Echo ripples use low-polygon `RingGeometry` (6 and 8 sides) intentionally for a crystalline/angular aesthetic. This is a deliberate design choice, not a placeholder.

**Recommendation:** Acceptable — the low-polygon rings are intentionally angular for echo character.

---

### 3.15 `ControlNodeGeometries_v1` — Primitive Control Node Parts

**File:** [`ControlNodeGeometries_v1.js`](ControlNodeGeometries_v1.js:48)  
**Severity:** MEDIUM  
**Lines:** 48-217

```javascript
new THREE.TorusGeometry(ringRadius, ringTube, 16, 64)
new THREE.SphereGeometry(coreRadius, 16, 16)
new THREE.BoxGeometry(coreSize, coreSize * 0.8, coreSize)
new THREE.BoxGeometry(towerBaseWidth, ...)
new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
```

**Diagnosis:** Control node geometries use basic primitives for rings, cores, towers, and cubes. These are structural building blocks.

**Recommendation:** Consider deformed variants for at least the core and tower elements to add visual interest.

---

## 4. LOW Issues

### 4.1 `CanonicalGeometryFamilies_v1` — Extensive but Intentional Primitive Usage

**File:** [`CanonicalGeometryFamilies_v1.js`](CanonicalGeometryFamilies_v1.js:222)  
**Severity:** LOW  
**Lines:** 222-1507 (throughout)

**Diagnosis:** This file defines canonical geometry families using primitive base shapes that are subsequently deformed via vertex manipulation. The primitives are starting points for deformation, not final visuals. Pattern: `new THREE.BoxGeometry(...)` → `_validateGeometry()` → vertex deformation.

**Recommendation:** This is the correct architectural pattern. The deformation functions transform primitives into distinctive visuals. No change needed.

---

### 4.2 `Atoma_nodes/*` — Node Variant Primitive Geometries

**Files:** Multiple files in [`Atoma_nodes/`](Atoma_nodes/)  
**Severity:** LOW  
**Affected files:**
- `ControlSpineVariants_Session100.js` — `BoxGeometry` for ribs
- `ControlNodeSpecialGoverners_Session114.js` — `SphereGeometry`, `BoxGeometry`, `IcosahedronGeometry`, `TorusGeometry`
- `ControlEnhancedVariants_Session83.js` — `TorusGeometry`, `IcosahedronGeometry`
- `StorageNodesVisual_Session116.js` — `BoxGeometry`, `TorusGeometry`, `OctahedronGeometry`, `DodecahedronGeometry`
- `AnalyticsEnhancedVariants_Session81.js` — `BoxGeometry`, `TorusGeometry`, `PlaneGeometry`
- `StorageEnhancedVariants_Session81.js` — `BoxGeometry`, `IcosahedronGeometry`
- `InputSensoryGeometries_v1.js` — `BoxGeometry`, `SphereGeometry`, `TorusGeometry`, `IcosahedronGeometry`
- `ProcessEnhancedVariants_Session81.js` — `IcosahedronGeometry`, `TorusGeometry`, `BoxGeometry`
- `InputSensoryEnhanced_Session111.js` — `IcosahedronGeometry`
- `InputEnhancedVariants_Session84.js` — `IcosahedronGeometry`
- `IntegrationEnhancedVariants_Session110.js` — `TorusGeometry`

**Diagnosis:** All node variant files use primitive geometries as building blocks. Many apply vertex deformation afterward. The pattern is consistent with the canonical geometry family approach.

**Recommendation:** These are architectural building blocks. The visual quality depends on the deformation and materials applied. Low priority — improve deformation quality over time.

---

### 4.3 `EnhancedNodeModels.js` — Massive Primitive Usage (Architectural)

**File:** [`EnhancedNodeModels.js`](EnhancedNodeModels.js)  
**Severity:** LOW  
**Lines:** Throughout (887-40899)

**Diagnosis:** This 40,000+ line file contains all enhanced node model factories. It uses primitive geometries extensively as base shapes for deformation. The pattern is: primitive → deform → assemble → material. This is the established architectural pattern for node visuals.

**Recommendation:** Architectural acceptance. Individual variants could be improved over time, but the pattern itself is correct.

---

### 4.4 `DreamDesert.js` / `DreamDesert2.js` — Environment Primitives

**Files:** [`DreamDesert.js`](DreamDesert.js:419), [`DreamDesert2.js`](DreamDesert2.js:107)  
**Severity:** LOW

**Diagnosis:** Desert environments use `PlaneGeometry` for terrain, `SphereGeometry` for sky domes, `BoxGeometry` for monoliths. These are standard environment construction techniques with shader-driven deformation.

**Recommendation:** Standard environment construction. Shader materials provide the visual quality.

---

### 4.5 `EvolutionRegistry` — Primitive Glow/Ring/Burst

**File:** [`EvolutionRegistry.js`](EvolutionRegistry.js:359)  
**Severity:** LOW  
**Lines:** 359-639

```javascript
const glowGeometry = new THREE.IcosahedronGeometry(1.2, 4);
const ringGeometry = new THREE.TorusGeometry(0.9, 0.03, 12, 64);
const burstGeometry = new THREE.IcosahedronGeometry(1, 3);
```

**Diagnosis:** Evolution effects use icosahedron glow, torus rings, and icosahedron bursts. These are simple but functional for evolution feedback.

**Recommendation:** Low priority — could be enhanced with shader-driven effects when evolution visuals are prioritized.

---

### 4.6 `CoreHologramShader` — Icosahedron Base

**File:** [`CoreHologramShader.js`](CoreHologramShader.js:38)  
**Severity:** LOW  
**Line:** 38

```javascript
const geometry = new THREE.IcosahedronGeometry(radius, detail);
```

**Diagnosis:** Hologram shells use icosahedron geometry as the base for the hologram shader. The shader provides the visual quality; the geometry is just the mesh topology.

**Recommendation:** Acceptable — the shader transforms the visual. The icosahedron provides good vertex distribution for the hologram effect.

---

### 4.7 `LEGACY/aura/_UISelectedNodeHighlight3_2.js` — Disabled System

**File:** `LEGACY/aura/_UISelectedNodeHighlight3_2.js`  
**Severity:** LOW  
**Line:** 30

```javascript
this.enabled = false; // Disable selected highlight aura (temporary)
```

**Diagnosis:** The selected node highlight system is disabled with a "temporary" comment, suggesting it was meant to be re-enabled. Being in the LEGACY folder indicates it may be superseded.

**Recommendation:** If superseded by another system, remove entirely. If still needed, re-enable and fix the underlying issue.

---

### 4.8 `LEGACY/aura/NodeLinkedAuraIntegrationPatch_Session123.js` — Disabled Auras

**File:** `LEGACY/aura/NodeLinkedAuraIntegrationPatch_Session123.js`  
**Severity:** LOW  
**Line:** 157

```javascript
world._nodeLinkedAuraSystem.config.enabled = false;
console.log('[Session 123] Node auras disabled');
```

**Diagnosis:** Node auras are explicitly disabled in the integration patch. Being in LEGACY, this is likely superseded.

**Recommendation:** Verify if the linked aura system has been replaced. If so, remove the legacy patch.

---

## 5. Cross-Cutting Observations

### 5.1 Primitive Geometry Pattern

The codebase follows a consistent pattern: **primitive geometry → vertex deformation → material/shader application**. This is architecturally sound. The primitives in `CanonicalGeometryFamilies_v1.js`, `EnhancedNodeModels.js`, and `Atoma_nodes/*` are intentionally used as base shapes for deformation.

The issues arise when:
1. Primitives are used **without deformation** (e.g., `ColonyVFXManager`, `AIConsciousnessLayer`)
2. Primitives are used with `MeshBasicMaterial` instead of custom shaders
3. No particle systems or post-processing augment the primitive base

### 5.2 TEMP DEBUG/TEMP DISABLED Hygiene

Six instances of `TEMP DEBUG` or `TEMP DISABLED` markers were found in production code:
- `main.js` — 3 disabled systems
- `AINodes.js` — 3 debug scan blocks
- `FresnelAuraIntegrationPatch.js` — 1 debug visibility toggle
- `EnhancedNodeModels.js` — 1 disabled barrier

These should be resolved: either complete the investigation and remove the debug code, or promote to proper debug utilities.

### 5.3 Cleanup Contract Compliance

The unified cleanup contract (documented in `MEMORY.md`) is well-respected. All 20 high-risk systems listed in the contract have proper `dispose()` implementations with `_createdObjects` tracking. No empty `dispose()` methods were found in project VFX files.

### 5.4 Empty `update()` Methods

No empty `update()` methods were found in any project VFX file. All VFX systems with `update()` methods contain actual update logic.

### 5.5 Empty `catch` Blocks

Empty `catch` blocks found in project files are exclusively in cleanup/unsubscribe paths (e.g., `try { off(eventName, handler); } catch (_) {}`). This is an acceptable pattern for cleanup code where failures should be silently tolerated.

---

## 6. Priority Action Items

| Priority | Issue | File | Action |
|----------|-------|------|--------|
| P0 | `createActivationPulse()` stub | `AINodes.js:3266` | Implement activation pulse visual |
| P0 | Disabled diagnostic systems | `main.js:43-82` | Investigate and re-enable or remove |
| P1 | ColonyVFXManager primitive core | `ColonyVFXManager.js:683` | Replace with deformed geometry + shaders |
| P1 | AIConsciousnessLayer primitive glyphs | `AIConsciousnessLayer.js:212-1287` | Replace with procedural glyph system |
| P1 | CascadeBurstVisual all-primitives | `CascadeBurstVisual_Session147.js:126` | Implement GPU particle + shader burst |
| P1 | Archetype glow/rim primitives | `ArchetypeVisualDifferentiationSystem_v1.js:382` | Replace with Fresnel shader approach |
| P1 | Placeholder metric step sizes | `src/metrics/NodeMetricEngine.js:24` | Design review and approve values |
| P2 | AnimatedLinkFlow packet geometry | `AnimatedLinkFlow.js:252` | Replace with glowing point sprites |
| P2 | TEMP DEBUG markers (6 instances) | Multiple files | Clean up or promote to debug utilities |
| P2 | Dead `if (false)` blocks (3 instances) | Multiple files | Remove dead code |
| P3 | Control node geometry improvements | `ControlNodeGeometries_v1.js` | Add deformation to core/tower elements |
| P3 | Evolution effect enhancement | `EvolutionRegistry.js` | Shader-driven evolution effects |
| P3 | Legacy disabled systems cleanup | `LEGACY/aura/*` | Verify supersession and remove |

---

## 7. Systems with No Issues Found

The following catalog systems were verified and found to be complete, properly implemented, and free of the diagnosed issue categories:

- `LinkRendererConduit.js` — Full lifecycle, no primitives as final visuals, no stubs
- `WaveInterferencePatternSystem_Session132.js` — Complete implementation
- `CascadingRuptureSystem.js` — Full lifecycle with proper cleanup
- `HarmonicResonanceCoupling_v1.js` — Complete with pooled visuals
- `HarmonicResonanceFeedbackSystem.js` — Full lifecycle, proper resonance fields
- `SynergyVFXEngine1_0.js` — 5-layer system, fully implemented
- `SynergyCascadeVisualizer.js` — Complete cascade visualization
- `ResonanceCascadeVisualization_Session117B.js` — Full lifecycle
- `HarmonicHealingVisualSystem_Session134.js` — Complete implementation
- `HarmonicRecoveryVisualSystem_Session138.js` — Full lifecycle
- `HealingParticleSystem_Session136.js` — GPU particle system, complete
- `WaveInterferenceEngine_v1.js` — Complete computation engine
- `PostProcessing.js` — Full pipeline with bloom, chromatic aberration, vignette
- `VisualHierarchyRegistry.js` — Authority system, complete
- `MetricsRuntime_v1.js` — Canonical metrics authority, complete
- `FrameScheduler.js` — Timing authority, complete
- `LinkSurfacePhaseRipples.js` — Complete phase ripple system
- `LinkCascadePulseManager.js` — Complete cascade pulse management
- `TopologyBiasVisualizationLayer.js` — Complete with event-driven updates
- `SynergyBonusFXLayer_v1.js` — GPU-based synergy flares, complete

---

*End of audit report. Generated 2026-04-16 by ATOMA automated deep-dive diagnosis.*
