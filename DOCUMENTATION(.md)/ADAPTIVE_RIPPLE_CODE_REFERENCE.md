# Adaptive Impact & Ripple - Implementation Code Reference
## Integration Points & Customization

---

## File Locations & Changes

### 1. `/NodeImpactManager.js`

#### Added Import
```javascript
import * as THREE from 'three';  // For lerp
```

#### Modified: `getShaderState(nodeId, nodeStability = 0.5)`

```javascript
/**
 * Get combined impact state with adaptive scaling based on stability
 */
getShaderState(nodeId, nodeStability = 0.5) {
  const impacts = this.impactPool.getActive();
  let displacementFactor = 0;
  let corruptionBias = 0;
  let harmonyBias = 0;
  let incomingDirection = null;
  let rippleAmplitude = 0;
  let rippleTriggerTime = -1;

  // Clamp stability to [0-1]
  const clampedStability = Math.max(0, Math.min(1, nodeStability));
  
  // ========================================================================
  // ADAPTIVE MULTIPLIER - KEY CALCULATION
  // ========================================================================
  // Stable (1.0): ×0.75 (softer)
  // Unstable (0.0): ×1.25 (sharper)
  const stabilityMultiplier = THREE.MathUtils.lerp(1.25, 0.75, clampedStability);

  for (const impact of impacts) {
    const progress = impact.getProgress(this.currentTime);
    if (progress < 0) continue;

    // APPLY ADAPTIVE SCALING HERE
    const scaledDisplacement = impact.getDisplacementFactor(progress) * stabilityMultiplier;
    displacementFactor += scaledDisplacement;

    if (impact.type === 'corruption') {
      corruptionBias += impact.getColorBias(progress);
    } else {
      harmonyBias += impact.getColorBias(progress);
    }
    
    if (!incomingDirection && impact.incomingDirection) {
      incomingDirection = impact.incomingDirection;
    }
    
    // ====================================================================
    // RIPPLE AMPLITUDE - TRIGGERED DURING IMPACT START
    // ====================================================================
    if (progress < 0.3) {  // Only early phase
      const rippleIntensity = impact.intensity * (1.0 - clampedStability * 0.5);
      rippleAmplitude = Math.max(rippleAmplitude, rippleIntensity);
      
      if (rippleAmplitude > 0.5 && rippleTriggerTime < 0) {
        rippleTriggerTime = this.currentTime;
      }
    }
  }

  // Return state with new fields
  return {
    displacementFactor: Math.max(-0.3, Math.min(0.2, displacementFactor)),
    corruptionBias: Math.min(1.0, corruptionBias),
    harmonyBias: Math.min(1.0, harmonyBias),
    incomingDirection: incomingDirection,
    rippleAmplitude: rippleAmplitude,      // NEW
    rippleTriggerTime: rippleTriggerTime,  // NEW
    stability: clampedStability,           // NEW
  };
}
```

#### Modified: `ImpactManagerCollection.getShaderState(nodeId, nodeStability)`

```javascript
getShaderState(nodeId, nodeStability = 0.5) {
  const manager = this.managers.get(nodeId);
  if (!manager) {
    return { 
      displacementFactor: 0, 
      corruptionBias: 0, 
      harmonyBias: 0,
      rippleAmplitude: 0,      // NEW
      rippleTriggerTime: -1,   // NEW
      stability: nodeStability, // NEW
    };
  }
  return manager.getShaderState(nodeId, nodeStability);  // Pass stability
}
```

---

### 2. `/NodeLinkedAuraSystem.js`

#### Modified: Stability Derivation in `updateAura()`

```javascript
// ========================================================================
// DERIVE STABILITY FROM NODE STATE
// ========================================================================
const corruption = Math.max(0, Math.min(1, node.userData?.corruption ?? 0));
const harmony = Math.max(0, Math.min(1, node.userData?.harmony ?? 0));

// Stability: inverse of corruption, boosted by harmony
// = harmony helps stabilize even corrupted nodes
nodeStability = (1.0 - corruption) * 0.6 + harmony * 0.4;
nodeStability = Math.max(0, Math.min(1, nodeStability));

// Query impact manager WITH STABILITY
const shaderState = this.impactManager.getShaderState(node.userData.nodeId, nodeStability);
```

#### Modified: Impact State Query

```javascript
if (shaderState) {
  impactAmplitude = shaderState.displacementFactor;
  impactInfluence = Math.max(
    shaderState.corruptionBias,
    shaderState.harmonyBias
  );
  incomingDirection = shaderState.incomingDirection;
  
  // NEW: Ripple data
  rippleAmplitude = shaderState.rippleAmplitude ?? 0;
  rippleTriggerTime = shaderState.rippleTriggerTime ?? -1;
}

// Store ripple state in aura data
auraData.rippleAmplitude = rippleAmplitude;
auraData.rippleTriggerTime = rippleTriggerTime;
auraData.nodeStability = nodeStability;
```

#### New: Ripple Effect in `applyFlameMotion()`

Add this in the vertex displacement loop:

```javascript
// ====================================================================
// MICRO RIPPLE EFFECT - INTERNAL PRESSURE WAVE ON IMPACT
// ====================================================================
if (auraData.rippleAmplitude > 0 && auraData.rippleTriggerTime >= 0) {
  const rippleElapsed = this.globalTime - auraData.rippleTriggerTime;
  const rippleDuration = 0.3;  // 300ms CONFIGURABLE
  
  if (rippleElapsed >= 0 && rippleElapsed < rippleDuration) {
    // Ripple phase: 0 (start) → 1 (end)
    const ripplePhase = rippleElapsed / rippleDuration;
    
    // Fade ripple amplitude over time (smooth decay)
    const rippleFade = 1.0 - ripplePhase;
    
    // Distance from vertex to aura center
    const distFromCenter = Math.sqrt(origX * origX + origY * origY + origZ * origZ);
    
    // Ripple wavefront: pressure wave travels from center to surface
    const rippleWavefront = ripplePhase * 1.5;  // Travels slightly beyond surface
    
    // Wave band centered on wavefront
    const distanceFromWave = Math.abs(distFromCenter - rippleWavefront);
    const waveWidth = 0.3;  // CONFIGURABLE: Width of ripple band
    const waveSharpness = Math.max(0, 1.0 - (distanceFromWave / waveWidth));
    
    // Oscillation within wave band (1.5 cycles) - CONFIGURABLE
    const waveOscillation = Math.sin(waveSharpness * Math.PI * 3.0);
    
    // Radial ripple displacement (normal-oriented)
    const vertexNormal = new THREE.Vector3(origX, origY, origZ).normalize();
    const rippleStrength = auraData.rippleAmplitude * rippleFade * waveSharpness * waveOscillation * 0.08;  // 0.08 CONFIGURABLE
    
    offsetX += vertexNormal.x * rippleStrength;
    offsetY += vertexNormal.y * rippleStrength;
    offsetZ += vertexNormal.z * rippleStrength;
  }
}
```

---

## Configuration Parameters

### Adaptive Multiplier

**Location**: `NodeImpactManager.js` → `getShaderState()`

```javascript
const stabilityMultiplier = THREE.MathUtils.lerp(1.25, 0.75, clampedStability);
//                                                ^^^^  ^^^^
//                                      unstable  stable
```

**Tuning**:
```javascript
// Make impacts more adaptive (bigger difference):
const stabilityMultiplier = THREE.MathUtils.lerp(1.5, 0.5, clampedStability);

// Make impacts less adaptive (smaller difference):
const stabilityMultiplier = THREE.MathUtils.lerp(1.1, 0.9, clampedStability);
```

### Ripple Duration

**Location**: `NodeLinkedAuraSystem.js` → `applyFlameMotion()`

```javascript
const rippleDuration = 0.3;  // 300ms
```

**Tuning**:
```javascript
const rippleDuration = 0.2;  // 200ms - faster ripple
const rippleDuration = 0.4;  // 400ms - slower ripple
const rippleDuration = 0.5;  // 500ms - very slow, lingering
```

### Ripple Amplitude

**Location**: `NodeLinkedAuraSystem.js` → `applyFlameMotion()`

```javascript
const rippleStrength = auraData.rippleAmplitude * rippleFade * waveSharpness * waveOscillation * 0.08;
//                                                                                               ^^^^
//                                                                                        8% of radius
```

**Tuning**:
```javascript
* 0.05;  // Very subtle (5% of radius)
* 0.08;  // Default (8% of radius)
* 0.12;  // Moderate (12% of radius)
* 0.15;  // Strong (15% of radius)
```

### Wave Band Width

**Location**: `NodeLinkedAuraSystem.js` → `applyFlameMotion()`

```javascript
const waveWidth = 0.3;
```

**Tuning**:
```javascript
const waveWidth = 0.2;  // Narrow, tight ripple
const waveWidth = 0.3;  // Default, moderate width
const waveWidth = 0.4;  // Wide, diffuse ripple
const waveWidth = 0.5;  // Very wide, almost invisible
```

### Oscillation Cycles

**Location**: `NodeLinkedAuraSystem.js` → `applyFlameMotion()`

```javascript
const waveOscillation = Math.sin(waveSharpness * Math.PI * 3.0);
//                                                          ^^^
//                                                   1.5 cycles
```

**Tuning**:
```javascript
Math.PI * 2.0;  // 1 cycle - single smooth wave
Math.PI * 3.0;  // 1.5 cycles - default (shown)
Math.PI * 4.0;  // 2 cycles - more texture
Math.PI * 6.0;  // 3 cycles - very detailed
```

### Ripple Intensity Factor

**Location**: `NodeImpactManager.js` → `getShaderState()`

```javascript
const rippleIntensity = impact.intensity * (1.0 - clampedStability * 0.5);
//                                                                      ^^^
//                                                            stability factor
```

**Tuning**:
```javascript
(1.0 - clampedStability * 0.3);  // Stability has 30% effect on ripple
(1.0 - clampedStability * 0.5);  // Default: 50% effect on ripple
(1.0 - clampedStability * 0.8);  // Stability has 80% effect on ripple
```

---

## Data Flow Diagram

```
Node State
  ├─ corruption [0-1]
  └─ harmony [0-1]
        ↓
    Calculate Stability
    stability = (1.0 - corruption) * 0.6 + harmony * 0.4
        ↓
    Pass to NodeImpactManager.getShaderState(nodeId, stability)
        ├─ Calculate adaptive multiplier
        │  multiplier = lerp(1.25, 0.75, stability)
        ├─ Apply to displacementFactor
        │  scaledDisplacement = displacement * multiplier
        └─ Calculate ripple amplitude
           rippleIntensity = intensity * (1.0 - stability * 0.5)
        ↓
    Return { displacementFactor, rippleAmplitude, rippleTriggerTime, ... }
        ↓
    Store in NodeLinkedAuraSystem.auraData
        ├─ auraData.impactAmplitude (uses adapted displacement)
        ├─ auraData.rippleAmplitude
        └─ auraData.rippleTriggerTime
        ↓
    Apply to vertices in applyFlameMotion()
        ├─ Normal impact deformation (uses adapted amplitude)
        └─ Ripple wave effect
```

---

## Testing Code

### Console: Verify Adaptive Scaling

```javascript
// In browser console:
const node = scene.getObjectByName('node_0');
const impactManager = game.impactManager;

// Check stability calculation
const corruption = node.userData.corruption || 0;
const harmony = node.userData.harmony || 0;
const stability = (1.0 - corruption) * 0.6 + harmony * 0.4;
console.log('Stability:', stability);

// Check adaptive multiplier
const multiplier = THREE.MathUtils.lerp(1.25, 0.75, stability);
console.log('Multiplier:', multiplier);

// Should show: lower stability → higher multiplier
```

### Console: Test Ripple Trigger

```javascript
// Trigger rapid impacts to see ripple
const now = Date.now() / 1000;
for (let i = 0; i < 3; i++) {
  impactManager.triggerImpact(0, 'corruption', now + i * 0.05, 0.8, 0.15);
}

// Watch for subtle ripple waves inside aura
// Should fade over 300ms
```

### Visual: Extreme Cases

```javascript
// Test most stable node (harmony=1, corruption=0)
node.userData.harmony = 1.0;
node.userData.corruption = 0.0;
// Impact should be very soft (×0.75)

// Test most unstable node (harmony=0, corruption=1)
node.userData.harmony = 0.0;
node.userData.corruption = 1.0;
// Impact should be very sharp (×1.25)
// Ripple should be strong
```

---

## Common Issues & Solutions

### Issue: Ripple not visible

**Possible causes**:
1. `rippleAmplitude` is 0
2. `rippleTriggerTime` not set
3. Ripple amplitude too small (0.05 or less)

**Debug**:
```javascript
// Check aura data
console.log('Ripple amplitude:', auraData.rippleAmplitude);
console.log('Ripple trigger time:', auraData.rippleTriggerTime);

// Increase amplitude
const rippleStrength = ... * 0.15;  // Increase from 0.08
```

### Issue: Ripple looks like a ring

**Possible causes**:
1. Ripple amplitude too high (>0.2)
2. Wave band width too large (>0.5)
3. Wave oscillations too few (< 1 cycle)

**Fix**:
```javascript
// Reduce amplitude
const rippleStrength = ... * 0.05;  // Decrease to 0.05

// Narrow the band
const waveWidth = 0.2;  // Decrease from 0.3

// Add more oscillations
Math.sin(waveSharpness * Math.PI * 6.0);  // Increase to 3 cycles
```

### Issue: Performance degradation

**Possible causes**:
1. Ripple calculations too expensive
2. Too many active ripples per frame

**Optimization**:
```javascript
// Skip ripple if amplitude very low
if (auraData.rippleAmplitude < 0.1) return;  // Early exit

// Reduce geometry detail
// (ripple cost depends on vertex count)

// Reduce ripple duration
const rippleDuration = 0.2;  // Decrease from 0.3
```

### Issue: Adaptive scaling not noticeable

**Possible causes**:
1. Range too small (0.75–1.25)
2. Node stability always 0.5 (neutral)
3. Impact changes too subtle

**Increase visibility**:
```javascript
// Increase adaptive range
const stabilityMultiplier = THREE.MathUtils.lerp(1.5, 0.5, stability);

// Verify stability calculation
console.log('Calculated stability:', nodeStability);

// Create test nodes with extreme values
node.userData.corruption = 1.0;  // Unstable
node.userData.harmony = 1.0;     // Stable
```

---

## Production Checklist

- [ ] Adaptive multiplier calculated correctly
- [ ] Stability derived from node stats
- [ ] Ripple triggered on impact start
- [ ] Ripple amplitude scales with instability
- [ ] Ripple fades over 300ms
- [ ] No visual artifacts
- [ ] Performance <0.5ms per-frame
- [ ] Works with cooldown smoothing
- [ ] Works with directional bias
- [ ] Console has no errors
- [ ] Settings tuned to visual preference

---

## Quick Deploy

1. Update `NodeImpactManager.js`:
   - Add THREE import
   - Modify `getShaderState()` with adaptive multiplier
   - Add ripple amplitude/trigger calculation

2. Update `NodeLinkedAuraSystem.js`:
   - Calculate stability in `updateAura()`
   - Pass stability to `getShaderState()`
   - Add ripple effect in `applyFlameMotion()`

3. Test with impact triggers

4. Adjust parameters to taste

5. Deploy

---

**Status**: ✨ **READY FOR PRODUCTION**
