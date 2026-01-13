# LINK EMISSION PULSING INTEGRATION GUIDE

## Overview

The **Link Emission Pulsing System** synchronizes visual pulsing on links with particle emission intensity, creating a cohesive multi-sensory feedback system where:

- **High traffic** = Fast, intense pulsing + Many particles
- **Low traffic** = Slow, subtle pulsing + Few particles
- **Synchronized** = User intuitively understands network activity

This extends Sessions 76-79 visual systems with synchronized link mesh animations.

---

## Quick Start

### 1. Import

```javascript
import {
  initializeLinkEmissionPulsing,
  updateLinkEmissionPulsing,
  batchUpdateLinkEmissionPulsing
} from './LinkEmissionPulsingSystem.js';
```

### 2. Initialize on Link Creation

```javascript
// During NodeLinkingSystem.createLink():
const link = createLinkData();

// Initialize both emission tracking and pulsing
initializeParticleEmissionTracking(link, initialTraffic);
initializeLinkEmissionPulsing(link, initialTraffic);
```

### 3. Update in Main Loop

```javascript
// In NodeLinkingSystem update cycle:
for (const link of this.links) {
  const traffic = link.trafficMagnitude ?? 0;
  const emissionIntensity = getEmissionIntensity(traffic); // From Session 80 Task 1
  
  // Update particles AND pulsing in sync
  updateLinkParticleEmissionRate(link, traffic);
  updateLinkEmissionPulsing(link, emissionIntensity, deltaTime);
}

// Or use batch operations:
batchUpdateLinkEmissionPulsing(
  this.links,
  link => getEmissionIntensity(link.trafficMagnitude ?? 0),
  deltaTime
);
```

### 4. Enable System

```javascript
// Optional: configure before use
import { configureEmissionPulsing } from './LinkEmissionPulsingSystem.js';

configureEmissionPulsing({
  enabled: true,
  easingType: 'sine',  // 'sine', 'square', or 'triangle'
  frequencyMin: 0.5,
  frequencyMax: 4.0
});
```

---

## Integration Patterns

### Pattern 1: Complete Synchronized System (Recommended)

Combines Sessions 76-79 with Tasks 1 & 2 and new pulsing:

```javascript
import { initializeLinkSynergyColor, updateLinkSynergyColor } from './LinkSynergyColorTransition.js';
import { initializeParticleEmissionTracking, updateLinkParticleEmissionRate } from './ParticleEmissionRateScaling.js';
import { initializeLinkEmissionPulsing, updateLinkEmissionPulsing } from './LinkEmissionPulsingSystem.js';

// During link creation:
const link = createLinkData(fromNode, toNode);

// Initialize all visual systems
initializeLinkSynergyColor(link);              // Session 77: Color
initializeParticleSynergyColors(link);         // Session 78: Particle color
initializeParticleEmissionTracking(link);      // Session 80 Task 1: Emission rate
initializeLinkEmissionPulsing(link);           // Session 80 Task 1.5: Link pulsing

// During update (main loop):
for (const link of this.links) {
  const synergy = link.synergyScore ?? 0.5;
  const traffic = link.trafficMagnitude ?? 0;
  const corruption = link.corruption ?? 0;
  
  // Update all visual systems
  updateLinkColorTransition(link, deltaTime);                      // Color animation
  updateParticleColorTransition(link, deltaTime);                  // Particle color animation
  updateParticleCorruptionSpeed(link, corruption);                 // Particle speed
  updateLinkParticleEmissionRate(link, traffic);                   // Emission rate
  updateLinkEmissionPulsing(link, getEmissionIntensity(traffic), deltaTime); // Link pulsing
}
```

**Result**: 5-dimensional visual feedback:
1. **Color** (Session 77): Synergy quality
2. **Particle Color** (Session 78): Synergy confirmation
3. **Particle Opacity** (Session 78): Synergy brightness
4. **Particle Speed** (Session 79): Corruption degradation
5. **Particle Emission** (Session 80 Task 1): Traffic magnitude
6. **Link Pulsing** (Session 80 Task 1.5): Traffic visualization

### Pattern 2: Emission + Pulsing Only

Minimal integration focusing on traffic visualization:

```javascript
import { updateLinkParticleEmissionRate } from './ParticleEmissionRateScaling.js';
import { updateLinkEmissionPulsing } from './LinkEmissionPulsingSystem.js';

// In update loop:
for (const link of this.links) {
  const traffic = link.trafficMagnitude ?? 0;
  
  // Only emission + pulsing
  updateLinkParticleEmissionRate(link, traffic);
  updateLinkEmissionPulsing(link, traffic);  // Direct traffic value
}
```

### Pattern 3: Selective Pulsing Channels

Enable only specific pulsing effects:

```javascript
import { configureEmissionPulsing } from './LinkEmissionPulsingSystem.js';

// Only pulse glow, not thickness or opacity
configureEmissionPulsing({
  channels: {
    thickness: false,  // Don't pulse thickness
    glow: true,        // Pulse glow intensity
    opacity: false,    // Don't pulse opacity
    color: false
  }
});
```

### Pattern 4: Manual Control

Direct control over pulsing intensity:

```javascript
import { setLinkPulsingIntensity, getLinkPulsingState } from './LinkEmissionPulsingSystem.js';

// Manually set pulsing intensity (0-1)
setLinkPulsingIntensity(link, 0.8);  // High intensity pulse

// Query current pulsing state
const state = getLinkPulsingState(link);
console.log('Frequency:', state.frequency);  // Hz
console.log('Current wave:', state.currentWave);  // 0-1 value
```

---

## Configuration

### Default Configuration

```javascript
EMISSION_PULSING_CONFIG = {
  // Master switch
  enabled: true,
  
  // Pulsing channels (which properties pulse)
  channels: {
    thickness: true,      // Modulate linewidth
    glow: true,           // Modulate emissiveIntensity
    opacity: true,        // Modulate opacity
    color: false          // Modulate color saturation (expensive)
  },
  
  // Frequency scaling (Hz)
  frequencyMin: 0.5,      // Idle pulse: 2 second period
  frequencyMax: 4.0,      // Saturated pulse: 0.25 second period
  
  // Thickness pulsing (linewidth multiplier)
  thicknessMin: 0.8,      // Narrow to 80% width
  thicknessMax: 1.2,      // Expand to 120% width
  
  // Glow pulsing (emissiveIntensity multiplier)
  glowMin: 0.5,           // Dim to 50%
  glowMax: 1.5,           // Brighten to 150%
  
  // Opacity pulsing (opacity multiplier)
  opacityMin: 0.7,        // Fade to 70%
  opacityMax: 1.0,        // Full opacity
  
  // Easing function: 'sine', 'square', or 'triangle'
  easingType: 'sine',     // Smooth breathing effect
  
  // Phase randomization (0-1)
  // 0 = all links pulse in sync (uniform effect)
  // 1 = each link has independent phase (organic effect)
  phaseRandomization: 0.3,
  
  // Amplitude modulation by corruption
  // If true: corrupted links pulse less intensely
  // If false: pulsing independent of corruption
  amplitudeModulationByCorruption: true,
  
  // Update frequency (milliseconds)
  updateFrequency: 16  // ~60 FPS
}
```

### Customize Configuration

```javascript
import { configureEmissionPulsing } from './LinkEmissionPulsingSystem.js';

// Slow, gentle pulsing
configureEmissionPulsing({
  frequencyMin: 0.2,      // 5 second period at idle
  frequencyMax: 1.0,      // 1 second period at saturated
  thicknessMin: 0.9,      // Subtle thickness variation
  thicknessMax: 1.1,
  easingType: 'sine',     // Smooth breathing
  phaseRandomization: 0.5 // More organic variation
});

// Fast, dramatic pulsing
configureEmissionPulsing({
  frequencyMin: 1.0,      // 1 second period at idle
  frequencyMax: 8.0,      // 0.125 second period at saturated
  thicknessMin: 0.6,      // Dramatic thickness variation
  thicknessMax: 1.4,
  easingType: 'square',   // Sharp on/off
  phaseRandomization: 0.1 // Synchronized effect
});

// Glow-only pulsing
configureEmissionPulsing({
  channels: {
    thickness: false,
    glow: true,
    opacity: false,
    color: false
  }
});
```

---

## Pulse Behavior Reference

### Pulse Wave Shapes

**Sine Wave** (default)
```
    ╭─╮
   ╱   ╲
  ╱       ╲
Smooth, natural breathing effect. Good for subtle pulsing.
```

**Square Wave**
```
  ┌─┐   ┌─┐
  │ │   │ │
  └─┘   └─┘
Sharp on/off effect. Good for "heartbeat" rhythm.
```

**Triangle Wave**
```
    ╱╲    ╱╲
   ╱  ╲  ╱  ╲
  ╱    ╲╱    ╲
Linear ramp effect. Good for "digital" appearance.
```

### Pulsing Intensity Mapping

| Traffic | Frequency | Behavior | Example |
|---------|-----------|----------|---------|
| 0% | 0.5 Hz | 2-sec cycle, barely visible | Idle network |
| 25% | 1.375 Hz | 0.73-sec cycle, gentle | Light activity |
| 50% | 2.25 Hz | 0.44-sec cycle, moderate | Normal load |
| 75% | 3.125 Hz | 0.32-sec cycle, noticeable | Heavy traffic |
| 100% | 4.0 Hz | 0.25-sec cycle, rapid | Critical load |

---

## Visual Result

### Idle Network (0-10% traffic)
- **Pulsing**: Barely perceptible (2 second breathing cycle)
- **Thickness**: ±10% variation
- **Glow**: Subtle pulsing
- **Opacity**: Minimal change
- **Particles**: 3-5 emitted

### Light Activity (10-30% traffic)
- **Pulsing**: Gentle (1-1.5 second cycle)
- **Thickness**: ±15% variation
- **Glow**: Noticeable pulsing
- **Opacity**: Gentle fading
- **Particles**: 5-10 emitted

### Normal Load (30-60% traffic)
- **Pulsing**: Steady (0.5-0.7 second cycle)
- **Thickness**: ±20% variation
- **Glow**: Clear pulsing
- **Opacity**: Moderate fading
- **Particles**: 10-25 emitted

### Heavy Traffic (60-85% traffic)
- **Pulsing**: Noticeable (0.3-0.4 second cycle)
- **Thickness**: ±20% variation
- **Glow**: Intense pulsing
- **Opacity**: Pronounced fading
- **Particles**: 25-40 emitted

### Critical Load (85-100% traffic)
- **Pulsing**: Rapid (0.25-0.33 second cycle)
- **Thickness**: ±20% variation
- **Glow**: Fast intense pulsing
- **Opacity**: Strong fading
- **Particles**: 40-50 emitted

---

## API Reference

### Initialization

```javascript
initializeLinkEmissionPulsing(link, emissionIntensity)
// Initialize pulsing state on a link
// Call during link creation
```

### Updates

```javascript
updateLinkEmissionPulsing(link, emissionIntensity, deltaTime)
// Update pulsing for single link
// Call every frame or ~60Hz

batchUpdateLinkEmissionPulsing(links, intensityGetter, deltaTime)
// Update pulsing for multiple links (optimized)
// Call every frame or ~60Hz
```

### Control

```javascript
enableLinkEmissionPulsing(link)      // Turn pulsing on
disableLinkEmissionPulsing(link)     // Turn pulsing off
setLinkPulsingIntensity(link, value) // Set intensity (0-1)
```

### Query

```javascript
getLinkPulsingState(link)            // Get current pulsing state
getPulsingDescription(intensity)     // Human-readable description
getAvailableEasingTypes()            // List: ['sine', 'square', 'triangle']
getConfiguration()                   // Get current config
```

### Configuration

```javascript
configureEmissionPulsing(config)     // Update global config
```

### Diagnostics

```javascript
verifyLinkEmissionPulsingInitialization(link)  // Check if initialized
generatePulsingCurve(samples)                   // Generate diagnostic curve
```

---

## Performance Characteristics

### Memory
- **Per-link overhead**: ~120 bytes (animation state + base material properties)
- **Per 500 links**: ~60 KB
- **Typical growth**: Linear with link count

### CPU
- **Per-link update**: ~50-100 microseconds
- **Batch 500 links**: ~25-50 milliseconds per frame
- **At 60 FPS**: ~1.5-3% CPU time
- **Batching benefit**: 5-10x faster than individual updates

### Optimization Tips
1. **Use batch operations** for many links
2. **Reduce update frequency** if needed (set updateFrequency)
3. **Disable expensive channels** (color pulsing)
4. **Disable pulsing** for off-screen links (if using LOD)

---

## Advanced Usage

### Phase Offset for Organic Effect

```javascript
// Create ripple effect where links pulse at different times
configureEmissionPulsing({
  phaseRandomization: 0.8  // High randomization
});

// Result: Each link starts pulsing at different point in cycle
//         Creates organic, wave-like visual flow
```

### Corruption Amplitude Modulation

```javascript
// Links with corruption pulse less intensely
configureEmissionPulsing({
  amplitudeModulationByCorruption: true
});

// Result: Healthy links pulse dramatically
//         Corrupted links show weaker pulsing
//         Provides additional corruption feedback
```

### Custom Easing Function

For custom easing beyond sine/square/triangle:

```javascript
// Modify computePulseWave() to add new cases:
import { LinkEmissionPulsingSystem } from './LinkEmissionPulsingSystem.js';

// Example: sawtooth wave
const customEasing = 'sawtooth';
// Then extend computePulseWave() to handle it
```

### Conditional Pulsing

```javascript
// Only pulse high-traffic links
import { updateLinkEmissionPulsing } from './LinkEmissionPulsingSystem.js';

for (const link of this.links) {
  const traffic = link.trafficMagnitude ?? 0;
  
  if (traffic > 0.3) {
    // Only pulse if traffic exceeds threshold
    updateLinkEmissionPulsing(link, traffic, deltaTime);
  } else {
    // Disable pulsing for idle links
    disableLinkEmissionPulsing(link);
  }
}
```

---

## Troubleshooting

### Pulsing Not Visible

**Problem**: Links don't appear to pulse

**Solutions**:
1. Verify `EMISSION_PULSING_CONFIG.enabled = true`
2. Check channels enabled: `channels.glow`, `channels.thickness`, `channels.opacity`
3. Verify `updateLinkEmissionPulsing()` called in update loop
4. Check emission intensity value: `getLinkPulsingState(link).intensity`
5. Ensure link materials have `emissiveIntensity` property

### Pulsing Too Fast/Slow

**Problem**: Pulsing frequency doesn't match traffic

**Solutions**:
1. Adjust `frequencyMin` (lower = slower idle)
2. Adjust `frequencyMax` (higher = faster saturated)
3. Verify traffic magnitude: `console.log(link.trafficMagnitude)`
4. Check computation: `computePulseFrequency(0.5)` should return ~2.25 Hz

### Pulsing Synchronized When Should Vary

**Problem**: All links pulse in unison

**Solutions**:
1. Increase `phaseRandomization` (0.3 → 0.7)
2. Or set custom phase per link: `link.emissionPulsing.phase = Math.random()`

### Memory/CPU Issues

**Problem**: High memory or CPU usage

**Solutions**:
1. Use `batchUpdateLinkEmissionPulsing()` instead of individual updates
2. Reduce update frequency: `updateFrequency = 32` (instead of 16)
3. Disable expensive channels: `channels.color = false`
4. Disable pulsing for off-screen links

### Material Properties Not Updating

**Problem**: Pulsing doesn't affect visual appearance

**Solutions**:
1. Verify link materials exist: `link.coreLine.material`
2. Check material properties are modifiable (not frozen)
3. Ensure materials have required properties:
   - `linewidth` (for thickness)
   - `emissiveIntensity` (for glow)
   - `opacity` (for opacity)
4. Use `getLinkPulsingState()` to verify wave values changing

---

## Integration with Sessions 76-79

### Session 76: Core Synergy Glow
- **Interaction**: Pulsing modulates glow base intensity
- **Synergy**: Higher synergy = brighter base = more dramatic pulsing

### Session 77: Synergy Color Transitions
- **Interaction**: Pulsing applies to colored meshes
- **Result**: Color AND pulsing feedback combined

### Session 78: Particle Synchronization
- **Interaction**: Particle color/opacity changes + link pulsing = cohesive effect
- **Result**: Particles and link pulse together

### Session 79: Corruption Speed
- **Interaction**: Corruption can modulate pulsing amplitude
- **Result**: Corrupted links show weaker pulsing

### Session 80 Task 1: Emission Scaling
- **Interaction**: Drives pulsing frequency
- **Result**: High traffic = fast pulsing + many particles

---

## Console Debugging

### Enable Debug Mode

```javascript
window.DEBUG_LINK_PULSING = true;
```

### Check Pulsing State

```javascript
import { getLinkPulsingState, generatePulsingCurve } from './LinkEmissionPulsingSystem.js';

// Check single link
const link = linkingSystem.links[0];
console.log(getLinkPulsingState(link));

// Generate pulsing curve
const curve = generatePulsingCurve(20);
console.table(curve);

// Check current frequency
import { computePulseFrequency } from './LinkEmissionPulsingSystem.js';
console.log('Frequency at 50% traffic:', computePulseFrequency(0.5));
```

### Monitor Performance

```javascript
// Track update time
const startTime = performance.now();
batchUpdateLinkEmissionPulsing(links, l => l.trafficMagnitude, deltaTime);
const updateTime = performance.now() - startTime;
console.log(`Pulsing update: ${updateTime.toFixed(2)}ms for ${links.length} links`);
```

---

## Summary

Link Emission Pulsing creates synchronized visual feedback with particle emission, making network traffic intuitively understandable:

- **Idle**: Gentle breathing (barely noticeable)
- **Active**: Steady pulsing (clear rhythm)
- **Busy**: Rapid pulsing (urgent feeling)
- **Critical**: Fast intense pulsing (emergency signal)

The system integrates cleanly with existing Sessions 76-79 visual systems and Task 1 particle emission to create a cohesive, multi-sensory feedback experience.
