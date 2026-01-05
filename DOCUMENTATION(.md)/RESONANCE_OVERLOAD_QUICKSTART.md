# Resonance Overload & Phase Collapse
## Quick Start Guide

**Status**: ✅ Production Ready  
**Impact**: Visual-only, zero gameplay impact  
**Performance**: ~0.05ms per hub

---

## What You're Getting

Visual breakdown effects when harmonic hubs enter **resonance overload**:

- 🟢 **Healthy** — Harmonic patterns flowing smoothly
- 🟡 **Strained** — Subtle phase variance, halo oscillation  
- 🔴 **Overloading** — Visible breakdown, shockwaves, chaos
- ⚫ **Collapsed** — Full desynchronization, independent pulses

---

## When Overload Activates

Hub enters overload when **ALL** are true:

✓ `corruption > harmony`  
✓ `synergy > 0.5` (energy keeps flowing)  
✓ `instability > 0.5` (soft threshold)

---

## Core Classes

### HarmonicHubCollapseController

Main controller managing resonance overload state.

**Creation**:
```javascript
import { HarmonicHubCollapseController } from './HarmonicHubCollapseController.js';

const collapseController = new HarmonicHubCollapseController(harmonicSyncController);
```

**Key Methods**:

```javascript
// Update collapse state (call every frame)
collapseController.update(harmony, corruption, synergy, instability, deltaTime);

// Get collapse effect for a link
const effect = collapseController.getPhaseCollapseEffect(linkIndex, linkCount, time);

// Get shockwave effect at position along link
const shockwave = collapseController.getShockwaveEffect(position, linkIndex, linkCount);

// Get halo effect for node visualization
const halo = collapseController.getHaloEffect();

// Debug information
const debug = collapseController.getDebugInfo();

// Get state description
const state = collapseController.getCollapseDescription(); // 'Healthy', 'Strained', etc.
```

---

## Integration (3 Steps)

### Step 1: Create Controller with Hub

```javascript
const hub = node.harmonicController;
const collapseController = new HarmonicHubCollapseController(hub);
node.collapseController = collapseController;
```

### Step 2: Update Every Frame

```javascript
// In your main update loop
collapseController.update(
    harmony,
    corruption,
    synergy,
    instability,
    deltaTime
);
```

### Step 3: Apply Effects to Visuals

```javascript
// In LinkPulsePhaseSync.update() for each link:
if (syncState.hasCollapseController) {
    phaseSync.applyCollapseEffects(syncState, linkIndex, linkCount, time);
}

// In visual rendering:
const collapseEffect = collapseController.getPhaseCollapseEffect(...);
// Apply destabilization to visual subsystems

const shockEffect = collapseController.getShockwaveEffect(...);
// Boost intensity/brightness at shockwave position

const haloEffect = collapseController.getHaloEffect();
// Render halo with brightness and amplitude
```

---

## Testing in Console

### Test 1: Check Overload State

```javascript
const collapseController = hub.collapseController;
const debug = collapseController.getDebugInfo();

console.log(`Overload: ${debug.isInOverload ? '✓' : '✗'}`);
console.log(`Collapse: ${(debug.collapseFactor * 100).toFixed(0)}%`);
console.log(`State: ${collapseController.getCollapseDescription()}`);
```

### Test 2: Simulate Progression

```javascript
// Simulate overload progression
for (let c = 0; c <= 1; c += 0.1) {
    collapseController.update(0.2, c, 0.6, 0.3, 0.016);
    const debug = collapseController.getDebugInfo();
    console.log(`Corruption ${c.toFixed(1)}: Collapse ${debug.collapseFactor.toFixed(2)}`);
}
```

### Test 3: Watch Real-Time

```javascript
setInterval(() => {
    const debug = collapseController.getDebugInfo();
    const desc = collapseController.getCollapseDescription();
    console.log(`[${desc}] ${(debug.collapseFactor * 100).toFixed(0)}% - Shockwaves: ${debug.activeShockwaves}`);
}, 500);
```

### Test 4: Get Effects

```javascript
const time = performance.now() * 0.001;

// Phase collapse effect
const collapseEffect = collapseController.getPhaseCollapseEffect(0, 5, time);
console.log(`Phase deviation: ${(collapseEffect.phaseDeviation * 180 / Math.PI).toFixed(1)}°`);

// Shockwave effect
const shockEffect = collapseController.getShockwaveEffect(0.5, 0, 5);
console.log(`Shockwave intensity: ${shockEffect.toFixed(3)}`);

// Halo effect
const haloEffect = collapseController.getHaloEffect();
console.log(`Halo brightness: ${haloEffect.brightness.toFixed(2)}`);
```

---

## Configuration

### Adjust Activation Threshold

Make overload harder to trigger:
```javascript
collapseController.setConfig({
    corruptionThreshold: 0.8,      // Default: 0.6
    instabilityThreshold: 0.7,     // Default: 0.5
});
```

### Adjust Visual Intensity

Make effects more dramatic:
```javascript
collapseController.setConfig({
    baseVarianceScale: 0.5,        // Default: 0.3 (more chaos)
    shockwaveAmplitude: 0.25,      // Default: 0.15 (stronger waves)
    haloBaseAmplitude: 0.1,        // Default: 0.05 (brighter halo)
});
```

### Speed Up Transitions

```javascript
collapseController.setConfig({
    collapseSmoothingRate: 0.12,   // Default: 0.06 (faster collapse)
});
```

---

## Visual Breakdown Stages

### Stage 1: Healthy (Factor: 0.0-0.2)
- Harmonic patterns visible
- No collapse effects
- Network appears stable

### Stage 2: Strained (Factor: 0.2-0.5)
- Slight phase variance
- Halo subtly oscillates
- Network appears uncertain

### Stage 3: Overloading (Factor: 0.5-0.8)
- Visible shockwaves
- Phase desynchronization apparent
- Directional streaks lose coherence
- Network appears failing

### Stage 4: Collapsed (Factor: > 0.8)
- All effects at maximum
- Links pulse independently
- No harmonic coordination
- Network appears broken

---

## Performance Impact

| Aspect | Value |
|--------|-------|
| CPU per hub | ~0.05ms |
| Memory per hub | ~500 bytes |
| Allocations | Zero |
| Shockwaves | ~8 concurrent |

---

## Common Issues & Fixes

### "Overload effects not visible"

Check if activated:
```javascript
console.log(collapseController.isInOverload);       // Should be true
console.log(collapseController.collapseFactor > 0); // Should be true
```

Ensure conditions met:
```javascript
// corruption > harmony?
// synergy > 0.5?
// instability > 0.5?
```

### "Overload triggers too easily"

Increase thresholds:
```javascript
collapseController.setConfig({
    corruptionThreshold: 0.8,
    instabilityThreshold: 0.7,
});
```

### "Effects not applied to visuals"

Register controller with phase sync:
```javascript
phaseSync.registerHubNode(
    node,
    harmonicController,
    collapseController,  // Pass this!
    connectedLinks
);
```

Apply effects in visual code:
```javascript
phaseSync.applyCollapseEffects(syncState, linkIndex, linkCount, time);
```

### "Performance is poor"

Check shockwave count:
```javascript
console.log(collapseController.shockwaveQueue.length); // Should be < 8
```

Reduce collision frequency:
```javascript
collapseController.setConfig({
    shockwaveIntervalMin: 1.0,     // Default: 0.5 (fewer waves)
    shockwaveIntervalMax: 3.0,     // Default: 2.0
});
```

---

## State Transitions

### Entering Overload
```
Healthy (0.0)
   ↓ (corruption increases)
Strained (0.2)
   ↓
Overloading (0.5)
   ↓
Collapsed (>0.8)
```

Smooth transition over seconds (based on smoothing rate).

### Recovering from Overload
```
Collapsed (>0.8)
   ↓ (corruption decreases)
Overloading (0.5)
   ↓
Strained (0.2)
   ↓
Healthy (0.0)
```

Also smooth — creates sense of network healing.

---

## Debug Utilities

### Get State Description

```javascript
console.log(collapseController.getCollapseDescription());
// Returns: 'Healthy' | 'Strained' | 'Overloading' | 'Collapsed'
```

### Get Full Debug Info

```javascript
const debug = collapseController.getDebugInfo();
console.log(debug);
// {
//   isInOverload: boolean,
//   collapseFactor: 0-1,
//   phaseVariance: radians,
//   phaseVarianceDegrees: 0-180,
//   haloAmplitude: 0-1,
//   activeShockwaves: 0-8,
//   overloadAge: seconds
// }
```

### Monitor Progression

```javascript
let lastFactor = -1;

const monitor = setInterval(() => {
    const factor = collapseController.collapseFactor;
    
    if (Math.abs(factor - lastFactor) > 0.05) {
        console.log(`Collapse: ${(factor * 100).toFixed(0)}%`);
        lastFactor = factor;
    }
}, 100);

// Stop monitoring when done
// clearInterval(monitor);
```

---

## Expected Behavior

### Healthy Hub
- ✓ Harmonic pattern clearly visible
- ✓ Pulses synchronized
- ✓ No special effects active

### Overloaded Hub
- ⚠ Harmonic pattern fragments
- ⚠ Shockwaves visible
- ⚠ Halo oscillating
- ⚠ Phase variance obvious

### Recovering Hub
- ← All effects fade smoothly
- ← Pattern re-emerges gradually
- ← Network appears healing

---

## API Quick Reference

```javascript
// Update state
controller.update(harmony, corruption, synergy, instability, deltaTime);

// Get effects
controller.getPhaseCollapseEffect(linkIndex, linkCount, time);
controller.getShockwaveEffect(position, linkIndex, linkCount);
controller.getHaloEffect();

// Get info
controller.getDebugInfo();
controller.getCollapseDescription();
controller.isInOverload;
controller.collapseFactor;

// Configure
controller.setConfig({ ...overrides });
```

---

## What's Next

1. **Visual Integration**: Apply effects to braided strands, streaks, etc.
2. **Audio Sync**: Map shockwaves to sound effects
3. **UI Debug Overlay**: Show collapse state visually
4. **Gameplay Coupling**: Trigger mechanics at collapse thresholds
5. **Multi-Hub Effects**: Cascading failures between hubs
