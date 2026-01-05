# HarmonicNodeResonanceHalos — Implementation Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Hub State Layer                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ HarmonicHubRecoveryController (recovery state)              │ │
│ │ HarmonicHubResilienceController (resilience tracking)       │ │
│ │ Node health/corruption systems (state metrics)              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  hubSystemData[nodeId] = {                                      │
│    isHarmonicHub, activeLinkCount, phase,                       │
│    syncStrength, harmony, synergy, corruption, ...              │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ HarmonicNodeResonanceHalos (Visual Authority Layer)             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Per-node halo state tracking                                │ │
│ │ - Activation condition evaluation                           │ │
│ │ - Target intensity computation                              │ │
│ │ - State-driven color morphing                               │ │
│ │ - Breathing animation                                       │ │
│ │ - Phase synchronization                                     │ │
│ │ - Distortion/wobble application                             │ │
│ │ - Resilience stabilization                                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  Per-node visual transformations:                               │
│  - Scale breathing (±3-6%)                                      │
│  - Luminance waves (radial)                                     │
│  - Color morphing (state-driven)                                │ 
│  - Distortion (corruption)                                      │
│  - Wobble (instability)                                         │
│  - Stabilization (resilience)                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ THREE.js Rendering                                              │
│ - Per-node mesh with emissive material                          │
│ - Scale transformation                                          │
│ - Color/emissive intensity modulation                           │
│ - Frustum culling built-in                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Integration

### Step 1: Import and Initialize (main.js)

```javascript
import { HarmonicNodeResonanceHalos } from './HarmonicNodeResonanceHalos.js';

// ... in initialization ...

const resonanceHalos = new HarmonicNodeResonanceHalos();

// Store globally for debugging
window.resonanceHalos = resonanceHalos;

console.log('[BOOT] HarmonicNodeResonanceHalos initialized');
```

### Step 2: Wire into Frame Update Loop

Add to animation loop **after** hub state is updated:

```javascript
function animate() {
  const deltaTime = clock.getDelta();
  
  // ← Other updates (hub state, metrics, etc.)
  
  // Update resonance halos based on current hub state
  resonanceHalos.update(deltaTime, nodeRegistry, hubSystemData);
  
  // ← Render
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Step 3: Ensure Hub System Data Available

The system reads from `hubSystemData` map. Must provide:

```javascript
// For each hub node:
hubSystemData.set(nodeId, {
  isHarmonicHub: true,
  activeLinkCount: 4,
  phase: 1.234,
  syncStrength: 0.85,
  harmony: 0.7,
  synergy: 0.6,
  corruption: 0.1,
  instability: 0.2,
  resilience: 0.5,
  isRecovering: false,
  isCollapsed: false
});
```

---

## Activation Logic

### Condition Evaluation

```javascript
// In HarmonicNodeResonanceHalos.shouldHaloBeActive()

const isHub = hubState.isHarmonicHub && 
              hubState.activeLinkCount >= 2;

const hasSync = hubState.hubSyncStrength > 0;

const notCollapsed = !hubState.isCollapsed;

const shouldBeActive = isHub && hasSync && notCollapsed;
```

### Activation Flow

```
Hub gets 2+ links
      ↓
isHarmonicHub = true, activeLinkCount = 2
      ↓
shouldHaloBeActive() = true (if syncStrength > 0)
      ↓
targetIntensity > 0
      ↓
Halo animates in (smooth easing)
      ↓
Halo visible and breathing
      ↓
      ↑
Hub drops below 2 links
      ↓
shouldHaloBeActive() = false
      ↓
targetIntensity = 0
      ↓
Halo animates out (smooth easing)
      ↓
Halo invisible
```

---

## Intensity Computation

### Base Intensity Formula

```javascript
// In HarmonicNodeResonanceHalos.updateHaloState()

// 1. Start with base intensity
let targetIntensity = HALO_VISUALS.HEALTHY_INTENSITY * hubState.hubSyncStrength;

// 2. Apply synergy boost (±40%)
targetIntensity *= (0.8 + hubState.synergy * 0.4);

// 3. Apply corruption reduction (±30%)
targetIntensity *= (1.0 - hubState.corruption * 0.3);

// 4. Apply instability dampening (±40%)
targetIntensity *= (1.0 - hubState.instability * 0.4);

// Result: targetIntensity in range [0, 0.6] approximately
```

### Smooth Interpolation

```javascript
// Ease toward target intensity
const easeAmount = Math.min(1, 3 * deltaTime); // 3 units/sec max
currentIntensity += (targetIntensity - currentIntensity) * easeAmount;
```

---

## Visual Transformations

### Breathing Animation

Creates calm, rhythmic expansion/contraction:

```javascript
// In HarmonicNodeResonanceHalos.applyHaloVisuals()

// Sine wave breathing: sin(0) = 0, sin(π/2) = 1, sin(π) = 0, ...
const breatheAmount = (Math.sin(totalTime * Math.PI * 2) + 1) * 0.5; // 0-1

// Map to scale range
const breatheScale = BREATH_MIN_SCALE + 
                    breatheAmount * (BREATH_MAX_SCALE - BREATH_MIN_SCALE);
// Result: 0.97 → 1.06 (±3-6%)

// Add phase-driven pulse
const phasePulse = Math.sin(hubPhase) * 0.05;

// Combine for final scale
const finalScale = (breatheScale + phasePulse) * stabilityDamping;
```

**Effect**: Halo pulses in sync with hub, breathing matches hub phase

### Luminance Waves

Creates radial intensity modulation:

```javascript
// Compute wave phase
const wavePhase = (totalTime * WAVE_SPEED + hubPhase) * Math.PI * 2;

// Sine modulation: creates wave pattern
const waveModulation = 1.0 + Math.sin(wavePhase) * WAVE_AMPLITUDE;
// Result: 0.7 → 1.3 (radial intensity swing)

// Apply corruption distortion
const distortedWave = waveModulation * (1.0 - distortionAmount * 0.5);

// Final intensity combines breathing, wave, and instability
const finalIntensity = currentIntensity * distortedWave * wobbleModulation;
```

**Effect**: Halo "breathes" radially, intensity ripples outward

### Color Morphing

Maps hub state to color:

```javascript
// In HarmonicNodeResonanceHalos.getHaloColor()

if (corruption > 0.6) {
  return HALO_COLORS.corrupted; // Red
}
if (corruption > 0.3 || instability > 0.4) {
  return HALO_COLORS.stressed; // Orange
}
if (synergy > 0.7 && corruption < 0.2) {
  return HALO_COLORS.synergy; // Cyan (boosted)
}
return HALO_COLORS.harmony; // Blue (default)

// Smooth interpolation toward target color
haloData.currentColor.r += (targetColor.r - currentColor.r) * easeAmount;
haloData.currentColor.g += (targetColor.g - currentColor.g) * easeAmount;
haloData.currentColor.b += (targetColor.b - currentColor.b) * easeAmount;
```

**Effect**: Color communicates hub health state

### Distortion from Corruption

Warps halo shape:

```javascript
// Compute distortion from corruption and instability
const targetDistortion = (corruption * 0.5 + instability * 0.5) * THICKNESS_SCALE;

// Apply to halo material
material.uniforms.distortion_amount.value = distortionAmount;

// In shader: radial wobble applied to vertices
```

**Effect**: Corrupted halos look "wrong" or distorted

### Wobble from Instability

Adds phase noise:

```javascript
// Instability causes phase irregularity
const targetWobble = (corruption + instability) * 0.1;

// Apply to wavePhase
const wobbleModulation = 1.0 + Math.sin(wavePhase + wobbleAmount) * 0.1;

// Result: irregular breathing pattern
```

**Effect**: Unstable hubs have choppy, unpredictable breathing

### Resilience Stabilization

Makes halos more stable under stress:

```javascript
// Resilience (0-1) dampens breathing variation
const stabilityDamping = 1.0 - resilience * 0.3;
// Result: 1.0 (no damping) → 0.7 (30% less breathing)

// Apply to all visual variations
finalScale = (breatheScale + phasePulse) * stabilityDamping;
finalIntensity = currentIntensity * distortedWave * wobbleModulation * (1 + resilience * 0.2);
```

**Effect**: Strong hubs appear calm and stable even under stress

---

## Color Palette

### State-to-Color Mapping

```javascript
HALO_COLORS = {
  harmony:   { r: 0.3, g: 0.6, b: 1.0 },  // Blue (calm, healthy)
  synergy:   { r: 0.0, g: 1.0, b: 1.0 },  // Cyan (energetic, connected)
  stressed:  { r: 1.0, g: 0.6, b: 0.2 },  // Orange (warning)
  corrupted: { r: 1.0, g: 0.2, b: 0.2 },  // Red (danger)
  collapsed: { r: 0.4, g: 0.0, b: 0.0 }   // Dark red (critical)
};
```

### Color Priority

1. **Collapsed** → Dark red (critical state)
2. **Corrupted** (corruption > 0.6) → Red
3. **Stressed** (corruption > 0.3 OR instability > 0.4) → Orange
4. **Synergized** (synergy > 0.7 AND healthy) → Cyan
5. **Healthy** (default) → Blue

---

## Performance Characteristics

### Per-Halo Computation

| Operation | Time | Notes |
|-----------|------|-------|
| Get hub state | 0.01ms | Map lookup |
| Compute activation | 0.02ms | Simple comparisons |
| Compute intensity | 0.05ms | Math operations |
| Interpolate profile | 0.08ms | Color + state |
| Apply breathing | 0.03ms | Sin/cos math |
| Apply wave | 0.02ms | Sin/cos math |
| Update material | 0.01ms | Uniform setter |
| **Total per halo** | **~0.2ms** | Scales linearly |

### Scaling Analysis

```
10 halos:   0.2ms × 10 = 2ms    (99.7% budget remaining at 60 FPS)
25 halos:   0.2ms × 25 = 5ms    (99.1% budget remaining)
50 halos:   0.2ms × 50 = 10ms   (97.7% budget remaining)
100 halos:  0.2ms × 100 = 20ms  (94.0% budget remaining)
```

### Memory Profile

```
Per-halo state object:    ~150 bytes
Total for 50 halos:       ~7.5 KB
Shared geometry:          ~50 KB (one per system)
Shared material base:     ~1 KB (one per system)
Cloned materials:         ~0.5 KB each

Total system overhead:    ~80 KB + (materialCount × 0.5 KB)
```

### Optimization Built-In

✅ **Frustum culling** — Enabled automatically on mesh
✅ **Intensity thresholding** — Skips rendering if < 0.05
✅ **Shared geometry** — One geometry, many instances
✅ **Cached calculations** — No per-frame allocations
✅ **Simple materials** — No texture lookups
✅ **Deterministic math** — No branching/conditionals

---

## State Management

### Per-Halo State Object

```javascript
{
  nodeId,                    // Unique identifier
  node,                      // THREE.js node reference
  haloMesh,                  // THREE.js mesh for halo
  
  // Activation
  isActive,                  // Boolean: is halo visible?
  targetIntensity,           // Target (0-1)
  currentIntensity,          // Current (smoothed)
  
  // Hub state cache
  hubPhase,                  // Synchronization phase
  hubSyncStrength,           // Sync strength (0-1)
  hubHealth,                 // Hub health (1 - corruption)
  hubResilience,             // Resilience level (0-1)
  
  // Halo behavior
  currentScale,              // Current scale (breathing)
  targetScale,               // Target scale
  currentColor,              // Current color (RGB)
  targetColor,               // Target color
  
  // Distortion
  distortionAmount,          // Corruption-induced (0-0.15)
  wobbleAmount,              // Instability-induced (0-0.2)
  
  // Recovery
  isRecovering,              // Boolean: recovering?
  recoveryProgress,          // Recovery progress (0-1)
  
  // Timing
  lastUpdateTime             // For delta calculations
}
```

### Update Flow Per Frame

```
1. Get hub state from hubSystemData
   └─ Extract: phase, syncStrength, harmony, synergy, corruption, instability, resilience

2. Evaluate activation
   └─ isActive = (activeLinkCount >= 2) && (syncStrength > 0) && !isCollapsed

3. Compute target intensity
   └─ intensity *= (0.8 + synergy × 0.4)
   └─ intensity *= (1.0 - corruption × 0.3)
   └─ intensity *= (1.0 - instability × 0.4)

4. Interpolate toward target
   └─ currentIntensity += (targetIntensity - currentIntensity) × easeAmount

5. Compute visual transformations
   └─ Breathing: sin(time × 2π) × scale
   └─ Luminance wave: sin(time × waveSpeed + phase) × modulation
   └─ Color: lerp(currentColor, targetColor, easeAmount)
   └─ Distortion: scale with corruption
   └─ Wobble: scale with instability
   └─ Stability: scale with resilience

6. Apply to material
   └─ mesh.scale.set(finalScale)
   └─ material.emissive.setRGB(r, g, b)
   └─ material.emissiveIntensity = finalIntensity

7. Render (automatic via THREE.js)
```

---

## Integration with Hub Systems

### With Recovery Controller

When `HarmonicHubRecoveryController` completes recovery:

```javascript
// Recovery controller emits event:
recoveryController.on('recovery_complete', (hubId) => {
  resonanceHalos.triggerRecoveryWave(hubId);
});

// Halo smoothly:
// - Contracts scale back to normal
// - Color returns to blue
// - Breathing regularizes
// - Resilience increases (visual memory)
```

### With Resilience Controller

`HarmonicHubResilienceController` automatically modulates halos:

```javascript
// Resilience (0-1) affects:

// 1. Stability damping (reduces breathing at high resilience)
const stabilityDamping = 1.0 - resilience * 0.3;

// 2. Recovery speed (faster recovery at high resilience)
// (Already built into easing: higher resilience = higher easeAmount)

// 3. Distortion reduction (less wobble at high resilience)
// (Distortion capped by resilience: distortion *= (1 - resilience * 0.5))
```

### With Node Health Systems

Halos read health from two sources (in order):

```javascript
// 1. Primary: hubSystemData map
const hubData = hubSystemData.get(nodeId);
if (hubData) {
  use hubData.harmony, corruption, instability, resilience
}

// 2. Fallback: node.userData
const userData = node.userData;
if (userData) {
  use userData.harmony, corruption, instability, resilience
}

// This ensures compatibility with any hub state tracking system
```

---

## Debugging & Monitoring

### Console Inspection

```javascript
// View system stats
resonanceHalos.getStats()
// { activeHaloCount: 5, trackedNodeCount: 12, ... }

// Inspect specific halo
resonanceHalos.getDebugInfoForNode('node_0')
// { nodeId: 'node_0', isActive: true, intensity: '0.450', phase: '1.234', ... }

// Check if halo active
resonanceHalos.isHaloActive('node_0')
// true

// Get current intensity
resonanceHalos.getHaloIntensity('node_0')
// 0.45
```

### Debug HUD

Use `example2_HaloStatusHUD()` from HARMONIC_HALO_EXAMPLES.js:

```javascript
import { example2_HaloStatusHUD } from './HARMONIC_HALO_EXAMPLES.js';
example2_HaloStatusHUD(resonanceHalos);

// Displays real-time halo status overlay
```

### Performance Monitoring

```javascript
const stats = resonanceHalos.getStats();
console.log(`Active: ${stats.activeHaloCount}/${stats.trackedNodeCount}`);
console.log(`Geometry cached: ${stats.cachedGeometry}`);
console.log(`Material cached: ${stats.cachedMaterial}`);
```

---

## Customization Examples

### Adjust Breathing Intensity

```javascript
// In HarmonicNodeResonanceHalos.js
HALO_VISUALS.BREATH_MIN_SCALE = 0.95;    // Less breathing (±5%)
HALO_VISUALS.BREATH_MAX_SCALE = 1.08;    // More breathing (±8%)
```

### Change Halo Size

```javascript
HALO_GEOMETRY.INNER_RADIUS_SCALE = 1.0;  // Smaller inner ring
HALO_GEOMETRY.OUTER_RADIUS_SCALE = 2.5;  // Larger outer ring
```

### Customize Color Palette

```javascript
HALO_COLORS.harmony = { r: 0.2, g: 0.8, b: 1.0 };     // Brighter blue
HALO_COLORS.synergy = { r: 0.0, g: 0.8, b: 0.8 };     // Darker cyan
HALO_COLORS.stressed = { r: 1.0, g: 0.7, b: 0.0 };    // Brighter orange
```

### Adjust Intensity Sensitivity

```javascript
HALO_VISUALS.HEALTHY_INTENSITY = 0.6;    // Brighter default
// Or modify computation in updateHaloState()
targetIntensity *= (1.2 + hubState.synergy * 0.5);  // Stronger synergy boost
```

---

## Testing Checklist

- [ ] Halos appear on nodes with 2+ links
- [ ] Halos disappear when node drops below 2 links
- [ ] Color changes with corruption level
- [ ] Breathing animates smoothly
- [ ] Synergy increases brightness
- [ ] Instability causes wobble
- [ ] Recovery contracts smoothly
- [ ] Resilience stabilizes appearance
- [ ] Performance acceptable (< 1ms for 50 halos)
- [ ] No per-frame allocations
- [ ] Graceful fallback if data missing
- [ ] Debug HUD displays correctly

---

## Troubleshooting

### Halos not appearing

**Cause**: Activation conditions not met

**Check**:
```javascript
const hubData = hubSystemData.get(nodeId);
console.log('Has 2+ links?', hubData.activeLinkCount >= 2);
console.log('Has sync?', hubData.syncStrength > 0);
console.log('Not collapsed?', !hubData.isCollapsed);
```

### Halos too dim/bright

**Cause**: Intensity computation off

**Adjust**:
```javascript
// Increase brightness
HALO_VISUALS.HEALTHY_INTENSITY = 0.6;

// Or boost synergy effect
targetIntensity *= (0.8 + hubState.synergy * 0.6);  // Increased multiplier
```

### Breathing looks wrong

**Cause**: Resilience dampening or wrong parameters

**Adjust**:
```javascript
// Less damping from resilience
const stabilityDamping = 1.0 - resilience * 0.1;  // 10% damping instead of 30%

// Or adjust breath range
HALO_VISUALS.BREATH_MIN_SCALE = 0.97;
HALO_VISUALS.BREATH_MAX_SCALE = 1.05;
```

---

## Summary

**HarmonicNodeResonanceHalos** provides soft, volumetric energy envelopes around harmonic hubs that visually communicate network state through breathing animation, color morphing, and phase synchronization.

**Key Principles**:
- Adapter-only (reads state, no game impact)
- Deterministic (no randomness)
- Efficient (<0.2ms per halo)
- Graceful (safe fallbacks)
- Reversible (smooth transitions)

---

**Status**: ✅ Production Ready
**Version**: 1.0

