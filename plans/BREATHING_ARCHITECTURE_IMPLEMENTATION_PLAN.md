# Breathing Architecture — Implementation Plan

**Date:** 2026-04-20  
**Status:** READY FOR IMPLEMENTATION  
**Scope:** MEDIUM — extends existing shader infrastructure  
**Task Budget:** MEDIUM

---

## What Already Exists

The infrastructure is already partially in place:

1. **[`PersonalityShaderAdvancedFX_v1.js`](PersonalityShaderAdvancedFX_v1.js)** — Has displacement functions:
   - `chaosDistortion(position, intensity, time)` — noise-based chaos
   - `resonanceBands(position, harmony, time)` — harmonic band displacement
   - `focusWarp(position, stability, time)` — stability-driven warp
   - `corruptionFracture(position, corruption, time)` — fracturing
   - `energyRipple(position, synergy, time)` — ripple displacement

2. **[`PersonalityShaderBridge_v1.js`](PersonalityShaderBridge_v1.js)** — Injects per-node uniforms:
   - `uHarmony`, `uCorruption`, `uStability`, `uLoadPressure`, `uSynergy`
   - `uQuality`, `uEnergy`

3. **[`TIER4_CorruptionFeedbackVisuals_v1.js`](TIER4_CorruptionFeedbackVisuals_v1.js)** — Already does vertex displacement based on corruption (scale changes on seed meshes)

4. **[`NodeAuraShader.js`](shaders/NodeAuraShader.js)** — Has `harmonyDampen` and `corruptionEnhance` motion factors

## What Needs to Change

The existing displacement is subtle and only affects aura/overlay layers. Breathing Architecture needs to:

1. **Amplify displacement on CORE node geometry** — make the shape change visible
2. **Add harmony-driven swelling** — nodes become rounder/softer with high harmony
3. **Add corruption-driven contraction** — nodes become angular/crystalline with high corruption
4. **Add stability-driven geometry** — nodes become more geometrically perfect with high stability
5. **Add load-driven flattening** — nodes compress under high load pressure

---

## Implementation Steps

### Step 1: Create `BreathingArchitectureShader_v1.js`

New shader module that provides the breathing displacement GLSL functions:

```glsl
// Harmony: swell outward, smooth normals, organic rounding
vec3 harmonySwell(vec3 pos, vec3 normal, float harmony, float time) {
  float swell = harmony * 0.15; // max 15% expansion
  float organicNoise = sin(pos.x * 3.0 + time * 0.5) * sin(pos.y * 4.0 + time * 0.3) * 0.02 * harmony;
  return pos + normal * (swell + organicNoise);
}

// Corruption: contract inward, angular faceting, crystalline
vec3 corruptionCrystallize(vec3 pos, vec3 normal, float corruption, float time) {
  float contraction = corruption * 0.08; // max 8% contraction
  // Facet effect: snap to nearest flat face
  float facets = 6.0; // hexagonal faceting
  vec3 faceted = floor(pos * facets + 0.5) / facets;
  float facetMix = corruption * 0.3;
  vec3 result = mix(pos - normal * contraction, faceted, facetMix);
  return result;
}

// Stability: perfect geometry, smooth toward ideal shape
vec3 stabilityPerfect(vec3 pos, vec3 normal, float stability) {
  // Push toward unit sphere surface (perfect geometry)
  float idealRadius = 1.0;
  float currentRadius = length(pos);
  float correction = (idealRadius - currentRadius) * stability * 0.1;
  return pos + normalize(pos) * correction;
}

// Load: flatten along Y axis
vec3 loadFlatten(vec3 pos, float loadPressure) {
  float flattenFactor = 1.0 - loadPressure * 0.25; // max 25% compression
  pos.y *= flattenFactor;
  return pos;
}

// Combined breathing displacement
vec3 breathingDisplacement(vec3 pos, vec3 normal, float harmony, float corruption, float stability, float loadPressure, float synergy, float time) {
  vec3 result = pos;
  
  // Harmony swell (organic expansion)
  result = harmonySwell(result, normal, harmony, time);
  
  // Corruption crystallize (angular contraction)
  result = corruptionCrystallize(result, normal, corruption, time);
  
  // Stability perfection (geometric correction)
  result = stabilityPerfect(result, normal, stability);
  
  // Load flattening (compression)
  result = loadFlatten(result, loadPressure);
  
  // Synergy: subtle internal complexity (fractal hint)
  float synergyDetail = sin(pos.x * 8.0 + time) * sin(pos.y * 8.0 - time * 0.7) * sin(pos.z * 8.0 + time * 0.3);
  result += normal * synergyDetail * synergy * 0.02;
  
  return result;
}
```

### Step 2: Integrate into `PersonalityShaderAdvancedFX_v1.js`

Add a new distortion mode `'breathing'` that uses the breathing displacement:

- In `_getDistortionLogic()`, add case `'breathing'`
- The breathing displacement combines harmony swell + corruption crystallize + stability perfect + load flatten
- Mix factor controlled by `uQuality` uniform (existing)

### Step 3: Register breathing mode per archetype

In archetype configuration, assign the `'breathing'` distortion mode to node categories:

- `INPUT` → breathing mode with resonance bias
- `PROCESS` → breathing mode with chaos bias
- `STORAGE` → breathing mode with focus bias
- `CONTROL` → breathing mode with focus bias
- `INTEGRATION` → breathing mode with link_flux bias

### Step 4: Add archetype-aware displacement scaling

Each archetype gets different displacement intensities:

- `INPUT` nodes: harmony swell is stronger (data flows in, expansion)
- `PROCESS` nodes: load flatten is stronger (processing pressure)
- `STORAGE` nodes: stability perfect is stronger (data integrity)
- `CONTROL` nodes: all effects balanced (command authority)
- `INTEGRATION` nodes: synergy detail is stronger (connection complexity)

### Step 5: Add LOD-aware displacement

- LOD 0: full breathing displacement
- LOD 1: 50% displacement amplitude
- LOD 2: 20% displacement amplitude
- LOD 3+: no displacement (static geometry)

Uses existing `DistanceLODController` for LOD levels.

### Step 6: Smooth transitions

- All displacement values are smoothed using exponential decay
- No sudden shape changes — transitions take ~0.5 seconds
- Uses existing `uStabilityFactor` / `uInertia` from `PersonalityShaderStabilizedFX_v1.js`

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `BreathingArchitectureShader_v1.js` | CREATE | GLSL functions for metric-driven shape morphing |
| `PersonalityShaderAdvancedFX_v1.js` | MODIFY | Add `'breathing'` distortion mode |
| `PersonalityShaderBridge_v1.js` | MODIFY | Ensure all metric uniforms are injected for breathing |
| `ArchetypeVisualProfiles_v1.js` | MODIFY | Add breathing displacement config per archetype |

## Performance Budget

- Zero extra draw calls — modifies existing vertex shader
- ~20 extra ALU instructions per vertex in vertex shader
- Only active when `uQuality > 0` (existing guard)
- LOD-aware: displacement off at distance
- Estimated GPU cost: negligible (vertex-bound, not fragment-bound)

## Visual Guarantees

- Node silhouette remains readable at all metric combinations
- Displacement amplitude capped at 15% of node radius
- Corruption contraction capped at 8%
- Load flattening capped at 25%
- All transitions smooth (no popping)
- Category color remains dominant (shape is secondary signal)
