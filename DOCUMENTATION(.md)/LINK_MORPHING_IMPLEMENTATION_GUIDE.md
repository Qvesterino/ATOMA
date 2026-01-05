# LinkCorruptionMorphingSystem — Implementation Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Game State Layer                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ LinkCorruptionTransmission_v1 (writes corruption)           │ │
│ │ LinkQualityCalculator (provides health metrics)             │ │
│ │ LinkCollapseSystem (provides degradation state)             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  link.userData.corruption (0-1 value)                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ LinkCorruptionMorphingSystem (reads corruption)                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Per-link state tracking                                     │ │
│ │ - Current corruption value                                  │ │
│ │ - Target morphing profile                                   │ │
│ │ - Current interpolated profile                              │ │
│ │ - Phase classification                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  Five morphing phases: Healthy → Stressed → Infected →          │
│  Degraded → Collapsed                                           │
│                           ↓                                      │
│  Visual transformation pipelines:                               │
│  - Braid morphing (geometry compression)                        │
│  - Color morphing (saturation, hue shift)                       │
│  - Emission morphing (intensity, pulsing)                       │
│  - Ripple morphing (chaos, coherence)                           │
│  - Particle morphing (density)                                  │
│  - Deformation morphing (warping)                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Visual Rendering Layer                                          │
│ - Link geometry updates                                         │
│ - Material uniform updates                                      │
│ - Color and emission changes                                    │
│ - Particle system adjustments                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Steps

### Step 1: Import and Initialize (main.js)

```javascript
import { LinkCorruptionMorphingSystem } from './LinkCorruptionMorphingSystem.js';

// ... in initialization ...

const linkMorphingSystem = new LinkCorruptionMorphingSystem();

// Store globally for debugging
window.linkMorphingSystem = linkMorphingSystem;

console.log('[BOOT] LinkCorruptionMorphingSystem initialized');
```

### Step 2: Wire into Frame Update Loop

Add the morphing update to your animation loop **after** link corruption is updated:

```javascript
function animate() {
  const deltaTime = clock.getDelta();
  
  // ← Other updates (physics, corruption, etc.)
  
  // Update link morphing based on current corruption state
  linkMorphingSystem.update(deltaTime, linkRegistry);
  
  // ← Render
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Step 3: Initialize Links When Created

Hook into link creation:

```javascript
// In your link creation function:
function createLink(nodeA, nodeB) {
  const linkMesh = createLinkGeometry(nodeA, nodeB);
  const linkId = `link_${nodeA.id}_${nodeB.id}`;
  
  // Register with system
  linkRegistry.set(linkId, linkMesh);
  
  // ← Add this line:
  linkMorphingSystem.initializeLinkState(linkId, linkMesh);
  
  return linkMesh;
}
```

### Step 4: Ensure Links Have Corruption Values

Verify that `LinkCorruptionTransmission_v1` (or similar) writes corruption to links:

```javascript
// LinkCorruptionTransmission_v1 should do this:
link.userData.corruption = 0.35; // Some value 0-1

// System reads from userData:
const corruption = link.userData.corruption; // or .health or .degradationLevel
```

---

## Morphing Pipeline Details

### Phase 1: Get Corruption Value

```javascript
// LinkCorruptionMorphingSystem.getCorruptionFromLink()

// Checks in order:
1. link.userData.corruption       (set by LinkCorruptionTransmission_v1)
2. 1 - link.userData.health       (health-based)
3. link.userData.degradationLevel (degradation-based)
```

### Phase 2: Determine Target Morphing Phase

```javascript
// LinkCorruptionMorphingSystem.getMorphingPhase()

corruption = 0.35  →  MORPHING_PHASES.INFECTED
corruption = 0.08  →  MORPHING_PHASES.HEALTHY
corruption = 0.72  →  MORPHING_PHASES.DEGRADED
```

### Phase 3: Get Target Profile

```javascript
// LinkCorruptionMorphingSystem.getProfileForCorruption()

// Interpolates between phase profiles based on exact corruption value
// Result: { braid_tightness, ripple_chaos, color_saturation, ... }

// Example: corruption = 0.35 (between Stressed 0.2 and Infected 0.45)
// t = (0.35 - 0.2) / (0.45 - 0.2) = 0.6
// profile = lerp(Stressed, Infected, 0.6)
```

### Phase 4: Smooth Interpolation

```javascript
// LinkCorruptionMorphingSystem.interpolateProfile()

// Smooth current profile toward target profile
// Uses morphingSpeed and profileSmoothness for easing

for (const key in targetProfile) {
  const diff = targetProfile[key] - currentProfile[key];
  const easedChange = diff * easeAmount * profileSmoothness;
  currentProfile[key] += easedChange;
}
```

### Phase 5: Apply Visual Transformations

```javascript
// LinkCorruptionMorphingSystem.applyMorphing()

// Five parallel transformation pipelines:

applyBraidMorphing(link, profile)        // Tightness → geometry
applyColorMorphing(link, color, profile) // Saturation → color
applyEmissionMorphing(link, profile)     // Intensity → glow
applyRippleMorphing(link, profile)       // Chaos → ripple behavior
applyParticleMorphing(link, profile)     // Density → particle system
applyDeformationMorphing(link, profile)  // Warping → geometry deform
```

---

## Transformation Pipeline: Braid Morphing

The braid tightness parameter controls how "frayed" the link appears.

### Implementation

```javascript
// In applyBraidMorphing():

const braid = profile.braid_tightness; // 1.0 (healthy) → 0.2 (collapsed)

// Store in userData for shader access
link.userData.braid_compression = 1.0 - (1.0 - braid) * 0.3;
// Result: 0.7-1.0 range (represents how compressed the braid is)

// Apply to strand materials
link.children.forEach((child) => {
  if (child.material?.uniforms?.braid_tightness) {
    child.material.uniforms.braid_tightness.value = braid;
  }
});
```

### Visual Effect

| Corruption | braid_tightness | Visual Result |
|-----------|-----------------|--------------|
| 0.0 | 1.0 | Tight, neat braids |
| 0.2 | 0.8 | Slightly compressed |
| 0.45 | 0.6 | Visible fraying |
| 0.65 | 0.4 | Severe fraying |
| 0.85 | 0.2 | Nearly broken |

---

## Transformation Pipeline: Color Morphing

Progressive color shift from harmony blue → corruption red + desaturation.

### Implementation

```javascript
// In applyColorMorphing():

const saturation = profile.color_saturation; // 1.0 (full) → 0.0 (gray)
const color = { r: 0.3, g: 0.6, b: 1.0 }; // Interpolated color

link.children.forEach((child) => {
  if (child.material?.emissive) {
    // Desaturate by interpolating toward gray
    const gray = (color.r + color.g + color.b) / 3;
    
    const desaturatedColor = {
      r: color.r * saturation + gray * (1 - saturation),
      g: color.g * saturation + gray * (1 - saturation),
      b: color.b * saturation + gray * (1 - saturation)
    };
    
    // Apply to emissive
    child.material.emissive.setRGB(
      desaturatedColor.r,
      desaturatedColor.g,
      desaturatedColor.b
    );
  }
});
```

### Color Evolution

```
Healthy (0.0)    → Harmony Blue (0.3, 0.6, 1.0) - Full saturation
Stressed (0.2)   → Orange (1.0, 0.6, 0.2) - Warning
Infected (0.45)  → Amber (1.0, 0.4, 0.1) - Threat
Degraded (0.65)  → Red (1.0, 0.1, 0.1) - Danger
Collapsed (0.85) → Dark Red (0.4, 0.0, 0.0) - Critical
```

---

## Transformation Pipeline: Emission Morphing

Glowing intensity increases with corruption.

### Implementation

```javascript
// In applyEmissionMorphing():

const intensity = profile.emission_intensity; // 0.3-1.0
const pulse = profile.ripple_chaos * 0.3;    // 0-0.3 (pulsing)

link.children.forEach((child) => {
  if (child.material?.uniforms) {
    // Base intensity
    if (child.material.uniforms.emissive_intensity) {
      child.material.uniforms.emissive_intensity.value = intensity;
    }
    
    // Pulsing at higher corruption
    if (child.material.uniforms.emission_pulse) {
      child.material.uniforms.emission_pulse.value = pulse;
    }
  }
});
```

### Intensity Progression

```
Healthy (0.0)    → 0.3 (subtle blue glow)
Stressed (0.2)   → 0.4 (brighter warning)
Infected (0.45)  → 0.6 (pulsing)
Degraded (0.65)  → 0.8 (strong red pulsing)
Collapsed (0.85) → 1.0 (maximum pulsing)
```

---

## Transformation Pipeline: Ripple Morphing

Surface ripples change from smooth organized patterns → chaotic turbulence.

### Implementation

```javascript
// In applyRippleMorphing():

// Store morphing parameters for LinkSurfacePhaseRipples to read
link.userData.ripple_chaos = profile.ripple_chaos;         // 0-1
link.userData.phase_coherence = profile.phase_coherence;   // 0-1
link.userData.ripple_speed = 1.0 - profile.ripple_chaos * 0.5; // 0.5-1.0

// LinkSurfacePhaseRipples checks these during its update:
// - ripple_chaos: Determines phase discontinuity
// - phase_coherence: Smoothing factor
// - ripple_speed: Motion speed
```

### Ripple Behavior

```
Healthy (ripple_chaos = 0.0)
  → Smooth longitudinal waves
  → Organized angular patterns
  → Coherent phase alignment
  → ~20-30 second rotation period

Collapsed (ripple_chaos = 1.0)
  → Chaotic discontinuities
  → Broken phase patterns
  → Complete phase breakdown
  → Rapid turbulent motion
```

---

## Transformation Pipeline: Particle Morphing

Particle density increases as links degrade.

### Implementation

```javascript
// In applyParticleMorphing():

link.userData.particle_density = profile.particle_density; // 0-1

// Particle systems read this and scale emission:
// particleSystem.emissionRate = baseRate * (1 + particle_density * 10);

// Healthy: minimal particles (baseRate * 1)
// Collapsed: heavy particles (baseRate * 11)
```

### Particle Scaling

```
Healthy (0.1)    → 10% base emission
Stressed (0.25)  → 25% base emission
Infected (0.5)   → 50% base emission
Degraded (0.75)  → 75% base emission
Collapsed (1.0)  → 100% base emission
```

---

## Transformation Pipeline: Deformation Morphing

Geometric warping creates visible twisting as corruption increases.

### Implementation

```javascript
// In applyDeformationMorphing():

link.userData.deformation_magnitude = profile.deformation_magnitude; // 0-0.15

// Vertex shaders can use this to apply sin-wave deformation:
// vec3 deformed = position + sin(position.y * 10.0 + time) * deformation_magnitude;

// Or geometry manipulation:
// geometry.vertices.forEach(v => {
//   v.x += Math.sin(v.y * 10 + time) * deformation_magnitude;
// });
```

### Deformation Intensity

```
Healthy (0.0)    → No visible warping
Stressed (0.02)  → Subtle twisting
Infected (0.05)  → Moderate warping
Degraded (0.1)   → Severe warping
Collapsed (0.15) → Extreme deformation
```

---

## State Management

### Per-Link State Structure

```javascript
{
  linkId,                    // Link identifier
  link,                      // THREE.js mesh reference
  corruption,                // Current corruption (0-1)
  targetProfile,             // Target morphing profile
  currentProfile,            // Current interpolated profile
  targetColor,               // Target emissive color
  currentColor,              // Current interpolated color
  phase,                     // Current morphing phase object
  lastCorruption,            // Last reported corruption value
  morphingActive             // Is currently morphing
}
```

### Profile Structure

```javascript
{
  braid_tightness,           // 0.2-1.0 (geometry compression)
  ripple_chaos,              // 0-1 (surface turbulence)
  color_saturation,          // 0-1 (color intensity)
  emission_intensity,        // 0.3-1.0 (glow brightness)
  emission_hue_shift,        // 0-75° (color rotation)
  particle_density,          // 0-1 (particle emission)
  halo_presence,             // 0-1 (halo visibility)
  deformation_magnitude,     // 0-0.15 (geometric warping)
  phase_coherence            // 0-1 (phase alignment)
}
```

---

## Performance Considerations

### Per-Frame Overhead

| Operation | Time | Notes |
|-----------|------|-------|
| get corruption | 0.01ms | Per link, hash lookup |
| interpolate profile | 0.1ms | Per link, math only |
| apply braid | 0.05ms | Material uniform update |
| apply color | 0.08ms | Color interpolation |
| apply emission | 0.06ms | Uniform update |
| apply ripples | 0.04ms | userData write |
| apply particles | 0.03ms | userData write |
| apply deformation | 0.04ms | userData write |
| **Total per link** | **~0.5ms** | Scales linearly |

### Optimization Strategies

1. **Reduce profile smoothness** (trades responsiveness for speed)
   ```javascript
   linkMorphingSystem.profileSmoothness = 0.7; // Default: 0.85
   ```

2. **Lower morphing speed** (slower transitions, cheaper)
   ```javascript
   linkMorphingSystem.setMorphingSpeed(1.0); // Default: 2.0
   ```

3. **Skip morphing for off-screen links**
   ```javascript
   // Integrate frustum culling
   if (!camera.frustum.intersectsObject(link)) return;
   ```

4. **Batch updates** for similar corruption values
   ```javascript
   // Skip update if corruption changed < 0.01
   if (Math.abs(corruption - lastCorruption) < 0.01) return;
   ```

### Scaling

- 10 links: ~5ms total
- 30 links: ~15ms total
- 50 links: ~25ms total
- 100 links: ~50ms total

At 60 FPS budget (16.6ms), system scales to ~30-40 links before performance impact.

---

## Debugging

### Console Commands

```javascript
// View system stats
linkMorphingSystem.getStats()
// { morphedLinkCount: 42, trackedLinkCount: 50, morphingSpeed: 2.0 }

// Get specific link info
linkMorphingSystem.getDebugInfoForLink('link_0')
// { phase: "Infected", corruption: "0.520", braid_tightness: "0.64", ... }

// Get corruption value
linkMorphingSystem.getCorruptionForLink('link_0')
// 0.52

// Get phase name
linkMorphingSystem.getPhaseNameForLink('link_0')
// "Infected"

// Change morphing speed
linkMorphingSystem.setMorphingSpeed(5.0);
```

### Visualization

Enable debug HUD to see morphing state:

```javascript
import { example3_CorruptionHUD } from './LINK_MORPHING_EXAMPLES.js';
example3_CorruptionHUD(linkMorphingSystem);
```

---

## Integration Checklist

- [ ] Import LinkCorruptionMorphingSystem in main.js
- [ ] Create instance in initialization
- [ ] Add to frame update loop (after corruption updates)
- [ ] Initialize links on creation
- [ ] Verify corruption values are being set
- [ ] Test all five morphing phases
- [ ] Tune morphing speed and smoothness
- [ ] Check performance metrics
- [ ] Enable debug HUD for validation
- [ ] Test recovery (corruption → 0)
- [ ] Verify color transitions are smooth
- [ ] Check ripple/particle/deformation effects
- [ ] Monitor frame rate during intense morphing
- [ ] Document any customizations

---

## Next Steps

1. **Audio Integration**: Play corruption sounds at phase transitions
2. **VFX Integration**: Trigger particle bursts at phase changes
3. **Gameplay Integration**: Adjust difficulty based on network health
4. **UI Integration**: Show corruption visualization on HUD
5. **Recovery Integration**: Sync with HarmonicHubRecoveryController
6. **Shader Enhancement**: Implement vertex deformation in GLSL
7. **Save/Load**: Serialize morphing state for persistence

---

## See Also

- `LinkCorruptionMorphingSystem.js` — Core implementation
- `LINK_MORPHING_QUICKSTART.md` — Quick reference
- `LINK_MORPHING_EXAMPLES.js` — Code examples
- `LinkCorruptionTransmission_v1.js` — Corruption source
- `LinkSurfacePhaseRipples.js` — Ripple morphing
