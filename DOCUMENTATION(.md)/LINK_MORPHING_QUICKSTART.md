# LinkCorruptionMorphingSystem — Quick Start

## Overview

Dynamic link morphing based on corruption flow state. Links visually degrade as corruption spreads through the network, creating a powerful narrative of network health.

**Five morphing phases:**
- **Healthy** (0.0-0.2): Clean braids, harmony blue glow
- **Stressed** (0.2-0.45): Tighter braids, desaturated color, warning orange
- **Infected** (0.45-0.65): Fraying starts, dark pulses, amber corruption
- **Degraded** (0.65-0.85): Severe warping, pulsing red, broken coherence
- **Collapsed** (0.85-1.0): Complete breakdown, chaotic ripples, dark red

---

## Integration

### 1. Import in `main.js`

```javascript
import { LinkCorruptionMorphingSystem } from './LinkCorruptionMorphingSystem.js';

// In initialization:
const linkMorphingSystem = new LinkCorruptionMorphingSystem();
```

### 2. Wire into frame update loop

```javascript
// In your animation loop (after link update, before render):
function animate() {
  const deltaTime = clock.getDelta();
  
  // ... other updates ...
  
  // Update link morphing based on corruption state
  linkMorphingSystem.update(deltaTime, linkRegistry);
  
  // ... render ...
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### 3. Initialize links as they're created

```javascript
// When creating/adding a link:
linkMorphingSystem.initializeLinkState(linkId, linkMesh);
```

---

## How It Works

### Corruption Source

The system reads corruption from link `userData`:
1. `link.userData.corruption` — Set by LinkCorruptionTransmission_v1
2. `link.userData.health` — Inverse: `corruption = 1 - health`
3. `link.userData.degradationLevel` — Direct degradation value

### Visual Morphing

As corruption increases:

**Braid Morphing** (braid_tightness)
- Healthy: 1.0 (normal)
- Collapsed: 0.2 (frayed)
- Applied to strand geometry compression

**Color Morphing** (color_saturation)
- Healthy: 1.0 (full saturation, blue)
- Collapsed: 0.0 (gray/desaturated, dark red)
- Smooth color transition through phases

**Emission Morphing** (emission_intensity)
- Healthy: 0.3 (subtle harmony glow)
- Collapsed: 1.0 (pulsing corruption)
- Intensity increases as corruption spreads

**Ripple Morphing** (ripple_chaos)
- Healthy: 0.0 (smooth, organized ripples)
- Collapsed: 1.0 (chaotic, turbulent patterns)
- Stored in `link.userData.ripple_chaos`

**Particle Morphing** (particle_density)
- Healthy: 0.1 (minimal particles)
- Collapsed: 1.0 (heavy particle streams)
- Used by particle systems to scale emission

**Deformation Morphing** (deformation_magnitude)
- Healthy: 0.0 (no warping)
- Collapsed: 0.15 (severe twisting)
- Applied via shader or geometry manipulation

### Smooth Transitions

All transitions are eased using:
- `morphingSpeed` — How fast links morph (default: 2.0 units/sec)
- `profileSmoothness` — Easing factor (default: 0.85)

Adjust for snappier or slower morphing:
```javascript
linkMorphingSystem.setMorphingSpeed(3.0); // Faster morphing
```

---

## Usage Examples

### Basic Setup

```javascript
const morphingSystem = new LinkCorruptionMorphingSystem();

// In animation loop:
function animate() {
  const dt = clock.getDelta();
  morphingSystem.update(dt, linkRegistry);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Get Link Phase

```javascript
const phaseName = morphingSystem.getPhaseNameForLink(linkId);
console.log(`Link is: ${phaseName}`);
// Output: "Healthy", "Stressed", "Infected", "Degraded", or "Collapsed"
```

### Get Link Corruption

```javascript
const corruption = morphingSystem.getCorruptionForLink(linkId);
console.log(`Corruption level: ${(corruption * 100).toFixed(1)}%`);
```

### Debug Info

```javascript
const debugInfo = morphingSystem.getDebugInfoForLink(linkId);
console.log(JSON.stringify(debugInfo, null, 2));
// {
//   linkId: "link_123",
//   phase: "Infected",
//   corruption: "0.520",
//   braid_tightness: "0.64",
//   ripple_chaos: "0.45",
//   color_saturation: "0.50",
//   emission_intensity: "0.60",
//   morphingActive: true
// }
```

### System Stats

```javascript
const stats = morphingSystem.getStats();
console.log(`Morphing ${stats.morphedLinkCount}/${stats.trackedLinkCount} links`);
// Morphing 42/50 links
```

---

## Corruption Flow Integration

The system expects corruption values from **LinkCorruptionTransmission_v1**:

```javascript
// LinkCorruptionTransmission_v1 writes to link:
link.userData.corruption = 0.45; // Infected phase

// LinkCorruptionMorphingSystem reads and morphs:
morphingSystem.update(dt, linkRegistry);
// Link visuals now show infected state: frayed, pulsing, dark
```

### Corruption Phases in Game

| Corruption | Phase | Game Meaning |
|-----------|-------|--------------|
| 0.0-0.2 | Healthy | Clean network, no threat |
| 0.2-0.45 | Stressed | Early warning signs visible |
| 0.45-0.65 | Infected | Active corruption spreading |
| 0.65-0.85 | Degraded | Severe degradation, link near failure |
| 0.85-1.0 | Collapsed | Complete structural failure |

---

## Performance

- **Per-link overhead**: ~0.5ms
- **Per-frame allocations**: 0 (fully cached state)
- **Scales to 50+ links** without noticeable impact

### Optimization Tips

- Set `morphingSpeed` lower for less responsive but cheaper morphing
- Use the system only for visible links (frustum culling friendly)
- Reuse profiles across similar corruption levels

---

## Customization

### Adjust Morphing Speed

```javascript
// Snappier response
morphingSystem.setMorphingSpeed(3.0);

// Slower, more gradual morphing
morphingSystem.setMorphingSpeed(1.0);
```

### Customize Phase Profiles

Modify `PHASE_PROFILES` in the file:

```javascript
PHASE_PROFILES.Stressed = {
  braid_tightness: 0.85,  // Tighter = less fraying
  ripple_chaos: 0.1,      // Smoother ripples
  color_saturation: 0.85, // More color retained
  // ... other properties
};
```

### Add Custom Morphing Logic

Extend the system:

```javascript
class MyCustomMorphing extends LinkCorruptionMorphingSystem {
  applyMorphing(link, state) {
    super.applyMorphing(link, state);
    // Add custom effects here
    this.applyCustomGlow(link, state);
  }
  
  applyCustomGlow(link, state) {
    // Your custom logic
  }
}
```

---

## API Reference

### Constructor

```javascript
new LinkCorruptionMorphingSystem()
```

### Methods

#### `update(deltaTime, linkRegistry)`
Main frame update. Call once per frame with delta time and link registry.

#### `initializeLinkState(linkId, link)`
Initialize morphing state for a new link.

#### `getPhaseNameForLink(linkId)`
Returns phase name: "Healthy", "Stressed", "Infected", "Degraded", or "Collapsed"

#### `getCorruptionForLink(linkId)`
Returns corruption value (0-1).

#### `getDebugInfoForLink(linkId)`
Returns debug info object for inspection.

#### `getStats()`
Returns system stats: morphedLinkCount, trackedLinkCount, morphingSpeed.

#### `setMorphingSpeed(speed)`
Set morphing speed (default: 2.0).

#### `dispose()`
Clear all state (cleanup/reset).

---

## Console API

```javascript
// Check what's happening
window.linkMorphingSystem = linkMorphingSystem;

// In console:
linkMorphingSystem.getStats();
linkMorphingSystem.getDebugInfoForLink('link_0');
linkMorphingSystem.setMorphingSpeed(5.0);
```

---

## Visual Impact

### Player Experience

As corruption spreads:
1. **Early**: Links look normal → player doesn't notice
2. **Spreading**: Links get orange warnings → player sees threat
3. **Infection**: Links break apart → player sees urgency
4. **Degradation**: Links warp severely → player sees danger
5. **Collapse**: Links completely fail → player experiences failure

This creates **intuitive visual feedback** without UI text.

### Network Health Visualization

A healthy network = clean, flowing, blue-glowing links
A corrupted network = twisted, pulsing, red-dark links

This is **immediately readable** to the player.

---

## Troubleshooting

### Links not morphing?

1. Check that `linkRegistry` is passed to `update()`
2. Verify `link.userData.corruption` is being set
3. Check console for errors

```javascript
// Debug:
const state = linkMorphingSystem.linkStates.get(linkId);
console.log('State:', state);
console.log('Corruption:', state.corruption);
```

### Morphing too slow/fast?

Adjust `morphingSpeed`:
```javascript
linkMorphingSystem.setMorphingSpeed(1.5); // Slower
linkMorphingSystem.setMorphingSpeed(5.0); // Faster
```

### Colors not changing?

Verify link materials support emissive color changes:
```javascript
link.children.forEach(child => {
  if (child.material) {
    child.material.emissive = new THREE.Color();
    child.material.needsUpdate = true;
  }
});
```

---

## Next Steps

1. **Integrate with corruption transmission**: Wire LinkCorruptionTransmission_v1 values
2. **Tune visual parameters**: Adjust PHASE_PROFILES for your aesthetic
3. **Add audio feedback**: Play corruption sounds at phase transitions
4. **Test with recovery**: Watch links recover as corruption decreases
5. **Monitor performance**: Check stats with `getStats()`

---

## See Also

- `LinkCorruptionTransmission_v1.js` — Corruption source
- `LinkSurfacePhaseRipples.js` — Ripple morphing integration
- `LinkQualityCalculator.js` — Health metric source
- `LinkDegradationSystem.js` — Degradation state
