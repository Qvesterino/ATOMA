# Diagnostic Plan: Origin (0,0,0) Visual Glitch

**Date:** 2026-05-01  
**Task:** Identify and fix the visual glitch at position 0,0,0 that changes appearance based on player distance  
**Classification:** MEDIUM scope, STRUCTURED FLOW

---

## Symptom Description

An object at the map center (0,0,0) exhibits distance-dependent visual behavior resembling a broken LOD system:

| Distance | Appearance |
|----------|-----------|
| Close | Plane geometry with circle/ring |
| Medium | Blue fragments |
| Far | Larger cyan fragments |
| Very far | Merges into a sphere |

The object has **high opacity** and **incorrect depth write/transparency settings**, causing it to **render through all environment geometry**.

---

## Root Cause: AIConsciousnessLayer Global Field Shell

**File:** [`AIConsciousnessLayer.js`](AIConsciousnessLayer.js:878)  
**Confidence:** HIGH (95%)

The `AIConsciousnessLayer._createGlobalField()` creates a **SphereGeometry with radius 15** centered at the `consciousnessGroup` position, which is **never explicitly set** — defaulting to `(0, 0, 0)`.

### CONFIRMED Evidence Chain

1. **Position:** `consciousnessGroup` is added to `scene` at line 191 with no position offset — defaults to `(0,0,0)`

2. **Geometry:** `new THREE.SphereGeometry(this.config.globalFieldScale, 48, 32)` where `globalFieldScale = 15` — a **large sphere** at origin

3. **Material:** [`RitualShaderPack.createFieldShellMaterial()`](RitualShaderPack.js:443) confirmed:
   - `transparent: true`
   - `depthWrite: false` — NEVER writes to depth buffer
   - `depthTest: true` (default) — respects depth but still renders on top in transparent pass
   - `blending: THREE.AdditiveBlending` — ADDS light on top of everything
   - `side: THREE.DoubleSide` — renders BOTH front and back faces
   - `fog: false` — never fades with distance

4. **Shader alpha:** [`FieldShellFragment`](RitualShaderPack.js:316) computes `alpha = (0.03 + fresnel * 0.08 + ripple * 0.04) * uIntensity * (0.8 + breath * 0.2)`, clamped to 0.25. With `uIntensity = 0.6`, max single-face alpha = 0.15. BUT DoubleSide + AdditiveBlending means front+back faces accumulate.

5. **5 overlapping objects at same position, ALL additive:**
   - `globalFieldMesh` — SphereGeometry(15) shell, alpha up to 0.15 per face
   - `globalFieldEdge` — EdgesGeometry(IcosahedronGeometry(16.2, 4)), opacity 0.09
   - `globalFieldChoir` — 3 LineSegments loops, opacity 0.06
   - `ritualFieldVeil` — OctahedronGeometry(12.9, 3), opacity 0 (invisible unless activated)
   - `ritualFieldWitness` — 144 Points on sphere, opacity 0 (invisible unless activated)

### Why It Matches ALL Symptoms

- **Close = plane with circle:** Camera is INSIDE the sphere (radius 15). The shell's fresnel shader makes edges bright and center dim, creating a ring/circle appearance. DoubleSide renders back faces as a plane-like surface behind the viewer.
- **Medium = blue fragments:** The `EdgesGeometry` icosahedron wireframe (opacity 0.09, additive) produces angular blue/cyan fragment patterns at medium distance.
- **Far = larger cyan fragments:** At distance, the choir LineSegments (3 loops, opacity 0.06, additive) collapse into fewer pixels, appearing as larger cyan fragments.
- **Very far = sphere:** At extreme distance, the entire consciousnessGroup collapses into a single spherical silhouette due to the dominant SphereGeometry shell.
- **Renders through everything:** `depthWrite: false` + `AdditiveBlending` means ALL 5 objects add their light on top of every opaque object in the scene, regardless of depth ordering in the transparent pass.
- **High apparent opacity:** Cumulative additive accumulation of shell (0.15 x 2 faces) + edges (0.09) + choir (0.06 x 3 loops) = ~0.45 effective additive contribution. With breathing pulse and fresnel peaks, this can appear much brighter.

---

## Secondary Suspects

### NeuralConvergenceSingularity Pool (GlyphFusionZone)

**File:** [`GlyphFusionZone.js`](GlyphFusionZone.js:432)  
**Confidence:** MEDIUM (40%)

The `GlyphFusionZone.initializeCompositeGlyphPool()` creates `CONFIG.POOL_SIZE` instances of `NeuralConvergenceSingularity`. These are initially hidden (`singularity.group.visible = false`), but if a singularity is activated with a default/zero position, it would appear at origin. The container `root.visible = false` at line 430 provides a safety net, but individual activation bugs could leak.

### QuantumIsland Fallback Ground

**File:** [`main.js`](main.js:7367)  
**Confidence:** LOW (15%)

`createQuantumIslandFallbackGround()` creates a `CircleGeometry(40, 64)` at `y=0` — a flat disk at origin. Only created when QuantumIsland class fails to load. Uses `MeshStandardMaterial` (opaque), so it would NOT render through other geometry. Unlikely to be the primary cause.

### CognitiveHorizonPlane — RULED OUT

**File:** [`CognitiveHorizonPlane.js`](CognitiveHorizonPlane.js:704)  
Uses `depthWrite: false`, `depthTest: true`, `AdditiveBlending`, positioned at `surfaceY` (not 0,0,0). Does not match the distance-dependent morphing behavior.

---

## Diagnostic Verification (Browser Runtime)

```javascript
// 1. Confirm AIConsciousnessLayer global field is the culprit
const cl = window.game?.consciousnessLayer;
console.log('Consciousness Layer:', cl);
console.log('Global field mesh:', cl?.globalFieldMesh);
console.log('Global field position:', cl?.consciousnessGroup?.position);
console.log('Global field visible:', cl?.globalFieldMesh?.visible);
console.log('Global field scale:', cl?.config?.globalFieldScale);

// 2. Temporarily hide the global field to confirm
if (cl?.globalFieldMesh) {
  cl.globalFieldMesh.visible = false;
  cl.globalFieldEdge.visible = false;
  cl.globalFieldChoir.visible = false;
  cl.ritualFieldVeil.visible = false;
  cl.ritualFieldWitness.visible = false;
  // Check if glitch disappears
}

// 3. Check RitualShaderPack field shell material properties
const mat = cl?.globalFieldMesh?.material;
console.log('Material transparent:', mat?.transparent);
console.log('Material depthWrite:', mat?.depthWrite);
console.log('Material depthTest:', mat?.depthTest);
console.log('Material blending:', mat?.blending);
console.log('Material side:', mat?.side);

// 4. Check GlyphFusionZone singularities
const gfz = window.game?.glyphFusionZone;
console.log('GlyphFusionZone:', gfz);
console.log('Pool size:', gfz?.compositeGlyphs?.length);
gfz?.compositeGlyphs?.forEach((g, i) => {
  if (g.active) console.log(`Active singularity ${i}:`, g.mesh?.position);
});

// 5. Scene traverse for objects at origin
window.game?.scene?.traverse(obj => {
  if (obj.position && obj.position.length() < 0.01 && obj.visible !== false) {
    const geo = obj.geometry?.constructor?.name;
    if (geo && !['BufferGeometry'].includes(geo)) {
      console.log(`Object at origin: ${obj.name} (${geo}) visible=${obj.visible} opacity=${obj.material?.opacity}`);
    }
  }
});
```

---

## Fix Proposal

### Fix 1 (P0): AIConsciousnessLayer Global Field — Depth and Visibility Correction

**Target:** [`AIConsciousnessLayer.js`](AIConsciousnessLayer.js:878) and [`RitualShaderPack.js`](RitualShaderPack.js:443)

The global field shell should NOT render through opaque environment geometry. The fix:

1. **Enable `depthWrite: true`** on the field shell material — this is the most critical fix. The sphere must write to the depth buffer so opaque objects behind it are properly occluded.
2. **Change `side: THREE.FrontSide`** instead of `DoubleSide` — when the camera is inside the sphere, back faces should not be rendered. This eliminates the "plane with circle" appearance.
3. **Add camera-distance-based fade** — when the camera is inside or very close to the global field sphere (distance < `globalFieldScale`), fade the shell opacity to near-zero. This prevents the "close-up plane" appearance.
4. **Reduce `uIntensity`** from 0.6 to 0.3 for the global field — the cumulative additive effect of 5 overlapping objects is too strong.
5. **Add `fog: true`** so the field fades with distance instead of being visible at extreme range.

### Fix 2 (P1): GlyphFusionZone NCS Pool — Origin Position Guard

**Target:** [`GlyphFusionZone.js`](GlyphFusionZone.js:432)

Add a guard to prevent singularities from being visible at origin when not properly positioned:

1. In `CompositeGlyphInstance.spawn()`, validate that `position` is not `(0,0,0)` or very close to it before making the singularity visible
2. Ensure `container.visible = false` is maintained when no fusion zones are active

### Fix 3 (P2): AINodes Activation Pulse — Depth Test Fix

**Target:** [`AINodes.js`](AINodes.js:3533)

The `createActivationPulse()` material has `depthTest: false` and `depthWrite: false` with `opacity: 0.72`. While this is a transient effect (520ms), it should use `depthTest: true` to avoid rendering through terrain during the pulse animation.

---

## Implementation Priority

| Priority | Fix | Impact |
|----------|-----|--------|
| P0 | AIConsciousnessLayer global field depth/opacity/side fix | Eliminates the primary origin glitch |
| P1 | GlyphFusionZone NCS pool origin guard | Prevents secondary origin leak |
| P2 | AINodes activation pulse depthTest fix | Prevents transient depth violations |

---

## Architecture Diagram

```mermaid
graph TD
    A[Player Camera] -->|Distance check| B{Camera Distance to Origin}
    B -->|Close less than 15| C[Inside Global Field Shell]
    B -->|Medium 15 to 30| D[Edge of Global Field Shell]
    B -->|Far 30 to 100| E[Global Field as Fragment Cluster]
    B -->|Very Far greater than 100| F[Global Field as Sphere Silhouette]
    
    C -->|Sees| G[Plane + Circle Appearance - DoubleSide back faces]
    D -->|Sees| H[Blue Fragments from EdgesGeometry]
    E -->|Sees| I[Cyan Fragments from Choir Lines]
    F -->|Sees| J[Sphere Silhouette from Shell]
    
    K[AIConsciousnessLayer] -->|Creates| L[GlobalFieldMesh - SphereGeometry r=15]
    K -->|Creates| M[GlobalFieldEdge - IcosahedronGeometry]
    K -->|Creates| N[GlobalFieldChoir - LineSegments]
    K -->|Creates| O[RitualFieldVeil - OctahedronGeometry]
    K -->|Creates| P[RitualFieldWitness - Points]
    
    L -->|depthWrite: false + AdditiveBlending + DoubleSide| Q[Renders Through Everything]
    M -->|AdditiveBlending opacity 0.09| Q
    N -->|AdditiveBlending opacity 0.06| Q