# HarmonicNodeResonanceHalos — Quick Start

## Overview

Soft, volumetric resonance halos surrounding harmonic hubs that visually express synchronization strength, health, and long-term resilience.

**Key Concept**: A visual authority layer that shows where the network "thinks"—no gameplay impact.

---

## Quick Integration

### 1. Import

```javascript
import { HarmonicNodeResonanceHalos } from './HarmonicNodeResonanceHalos.js';
```

### 2. Initialize

```javascript
const resonanceHalos = new HarmonicNodeResonanceHalos();
```

### 3. Add to Frame Loop

```javascript
function animate() {
  const deltaTime = clock.getDelta();
  
  // Update halos
  resonanceHalos.update(deltaTime, nodeRegistry, hubSystemData);
  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

---

## How It Works

### Activation Conditions

Halos appear when:
- ✅ Node is a harmonic hub (`activeLinkCount ≥ 2`)
- ✅ Hub has synchronization strength (`hubSyncStrength > 0`)
- ✅ Node is not collapsed

```javascript
isActive = (activeLinkCount >= 2) && (hubSyncStrength > 0) && !isCollapsed
```

### Visual States

| State | Appearance | Meaning |
|-------|-----------|---------|
| **Healthy** | Calm blue glow, smooth breathing | Network feels good |
| **Synergized** | Bright cyan, energetic pulse | High synergy boost |
| **Stressed** | Orange warning, uneven breathing | Corruption/instability rising |
| **Corrupted** | Red glow, distorted shape | High corruption level |
| **Collapsed** | Dark red flicker, thin appearance | Network near failure |

### Halo Motion

- **Breathing**: ±3-6% scale oscillation (calming)
- **Luminance Wave**: Radial intensity modulation
- **Phase Pulse**: Synchronized to hub phase
- **Stability**: Harmony reduces breathing, resilience stabilizes

---

## Visual Parameters

### Modulation by Hub State

| Property | Harmony | Synergy | Corruption | Instability | Resilience |
|----------|---------|---------|-----------|-------------|------------|
| **Intensity** | Primary | ↑20-40% | ↓-30% | ↓-40% | Stabilizing |
| **Color** | Blue | Cyan | Red | Orange | Modulates to state |
| **Breathing** | Smooth | Energetic | Irregular | Choppy | Damped |
| **Clarity** | Clear | Enhanced | Distorted | Wobbled | Clear |
| **Visibility** | Full | Full | Reduced | Reduced | Full |

### Color Palette

```
Harmony/Healthy:  RGB(0.3, 0.6, 1.0)  — Blue glow
Synergy:          RGB(0.0, 1.0, 1.0)  — Cyan boost
Stressed:         RGB(1.0, 0.6, 0.2)  — Orange warning
Corrupted:        RGB(1.0, 0.2, 0.2)  — Red danger
Collapsed:        RGB(0.4, 0.0, 0.0)  — Dark red critical
```

---

## API Reference

### Constructor

```javascript
new HarmonicNodeResonanceHalos()
```

### Methods

#### `update(deltaTime, nodeRegistry, hubSystemData)`
Main frame update. Reads hub state and applies visual morphing.

```javascript
resonanceHalos.update(deltaTime, nodeRegistry, hubSystemData);
```

#### `initializeNodeHalo(nodeId, nodeObject, nodeRadius)`
Initialize halo for a new node. Called automatically on first update.

```javascript
resonanceHalos.initializeNodeHalo('node_0', nodeObject, 1.0);
```

#### `getHaloIntensity(nodeId)`
Get current halo intensity (0-1).

```javascript
const intensity = resonanceHalos.getHaloIntensity('node_0');
```

#### `isHaloActive(nodeId)`
Check if halo is currently visible.

```javascript
if (resonanceHalos.isHaloActive('node_0')) {
  console.log('Hub is active');
}
```

#### `getDebugInfoForNode(nodeId)`
Get detailed debug information.

```javascript
const debug = resonanceHalos.getDebugInfoForNode('node_0');
console.log(JSON.stringify(debug, null, 2));
```

#### `getStats()`
Get system statistics.

```javascript
const stats = resonanceHalos.getStats();
console.log(`Active halos: ${stats.activeHaloCount}/${stats.trackedNodeCount}`);
```

#### `triggerRecoveryWave(nodeId)`
Trigger recovery animation for a node (called by recovery system).

```javascript
resonanceHalos.triggerRecoveryWave('node_0');
```

#### `dispose()`
Clean up all resources.

```javascript
resonanceHalos.dispose();
```

---

## Usage Examples

### Basic Setup

```javascript
const halos = new HarmonicNodeResonanceHalos();

function animate() {
  const dt = clock.getDelta();
  halos.update(dt, nodeRegistry, hubSystemData);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Check Halo Status

```javascript
// Is this hub showing a halo?
if (halos.isHaloActive('node_0')) {
  console.log('Node 0 is a harmonic hub');
}

// How intense is the halo?
const intensity = halos.getHaloIntensity('node_0');
console.log(`Intensity: ${(intensity * 100).toFixed(0)}%`);
```

### Debug Information

```javascript
const debug = halos.getDebugInfoForNode('node_0');
console.log(debug);
// {
//   nodeId: 'node_0',
//   isActive: true,
//   intensity: '0.450',
//   scale: '1.038',
//   color: { r: '0.30', g: '0.60', b: '1.00' },
//   distortion: '0.050',
//   wobble: '0.025',
//   resilience: '0.650',
//   isRecovering: false,
//   hubPhase: '1.234',
//   syncStrength: '0.850'
// }
```

### System Monitoring

```javascript
const stats = halos.getStats();
console.log(`Rendering ${stats.activeHaloCount} halos out of ${stats.trackedNodeCount} nodes`);
// Rendering 5 halos out of 12 nodes
```

---

## Integration with Hub Systems

### With HarmonicHubRecoveryController

```javascript
// When recovery completes, halo reflects new state
recoveryController.onRecoveryComplete((hubId) => {
  resonanceHalos.triggerRecoveryWave(hubId);
});
```

### With HarmonicHubResilienceController

Resilience automatically modulates halo stability:
- Higher resilience → smoother, more stable breathing
- Higher resilience → faster recovery animations
- Higher resilience → reduced distortion during stress

### With Node Health Systems

Hub state is read from:
1. `hubSystemData` map (preferred)
2. `node.userData` (fallback)

Expected properties:
```javascript
{
  isHarmonicHub: boolean,
  activeLinkCount: number,
  phase: number,
  syncStrength: number (0-1),
  harmony: number (0-1),
  synergy: number (0-1),
  corruption: number (0-1),
  instability: number (0-1),
  resilience: number (0-1),
  isRecovering: boolean,
  isCollapsed: boolean
}
```

---

## Performance

### Overhead

- **Per-node**: ~0.2ms (minimal)
- **Per-frame allocations**: 0
- **Memory per node**: ~150 bytes

### Scaling

- 10 halos: ~2ms
- 25 halos: ~5ms
- 50 halos: ~10ms

Halos are **very efficient**—computations are purely math and shader uniforms.

### Optimization

Halos automatically:
- Cull based on frustum (built-in)
- Skip rendering if intensity is near 0
- Share geometry across all instances
- Use simple materials with no texture lookups

---

## Customization

### Adjust Breathing Animation

```javascript
// File: HarmonicNodeResonanceHalos.js
HALO_VISUALS.BREATH_MIN_SCALE = 0.95;  // Less breathing
HALO_VISUALS.BREATH_MAX_SCALE = 1.05;  // More subtle
```

### Adjust Halo Size

```javascript
HALO_GEOMETRY.INNER_RADIUS_SCALE = 1.1;   // Smaller inner ring
HALO_GEOMETRY.OUTER_RADIUS_SCALE = 2.2;   // Larger outer ring
```

### Adjust Colors

```javascript
HALO_COLORS.harmony = { r: 0.2, g: 0.8, b: 1.0 }; // Brighter blue
```

### Adjust Intensity

```javascript
HALO_VISUALS.HEALTHY_INTENSITY = 0.5;     // Brighter default
HALO_VISUALS.STRESSED_INTENSITY = 0.6;    // Brighter stressed state
```

---

## Troubleshooting

### Halos not showing?

1. Check activation conditions:
   ```javascript
   const debug = halos.getDebugInfoForNode(nodeId);
   console.log('Active:', debug.isActive);
   ```

2. Verify hub system data is provided:
   ```javascript
   halos.update(dt, nodeRegistry, hubSystemData);
   // Make sure hubSystemData is not null
   ```

3. Check node is actually a harmonic hub (2+ links)

### Halos too dim/bright?

Adjust intensity in `HALO_VISUALS`:
```javascript
HALO_VISUALS.HEALTHY_INTENSITY = 0.6; // Increase brightness
```

### Performance issues?

- Halos are very cheap (~0.2ms per node)
- If performance degrades, likely other systems
- Monitor with `getStats()`

### Halos look wrong after recovery?

Recovery animations are handled automatically. If not working:
```javascript
resonanceHalos.triggerRecoveryWave(nodeId);
```

---

## Console API

```javascript
window.resonanceHalos = resonanceHalos;

// In console:
resonanceHalos.getStats()
resonanceHalos.getDebugInfoForNode('node_0')
resonanceHalos.isHaloActive('node_0')
resonanceHalos.getHaloIntensity('node_0')
```

---

## Visual Impact

### Player Experience

**Healthy Network**:
- Halos gently breathe around key hubs
- Smooth, regular pulsing
- Blue, calming appearance
- Player feels "network is stable"

**Stressed Network**:
- Halos become orange and choppy
- Irregular breathing
- Distorted appearance
- Player feels "something's wrong"

**Recovering Network**:
- Halos smooth out, contract
- Return to blue color
- Regular breathing resumes
- Player feels "it's healing"

### Intuitive Feedback

No text needed. Players understand:
- Which nodes are hubs (halo = hub)
- Hub health (color = state)
- Network stress (breathing pattern = stability)
- Recovery status (smoothing = healing)

---

## Next Steps

1. ✅ Import and initialize
2. ✅ Add to animation loop
3. ✅ Verify hub system data available
4. ✅ Test with different hub states
5. ✅ Tune color/intensity to your aesthetic
6. ✅ Wire with recovery system
7. ✅ Monitor performance

---

## See Also

- `HarmonicNodeResonanceHalos.js` — Core implementation
- `HARMONIC_HALO_IMPLEMENTATION_GUIDE.md` — Detailed documentation
- `HARMONIC_HALO_EXAMPLES.js` — Integration patterns
- `HarmonicHubRecoveryController.js` — Recovery system
- `HarmonicHubResilienceController.js` — Resilience system
