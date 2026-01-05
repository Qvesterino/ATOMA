# Node-Driven Pulse Waves for Directional Energy Streaks

## Overview

The pulse wave system adds rhythmic energy pulses originating from nodes that travel along connected links' directional energy streaks. This creates a visual "heartbeat" effect that communicates network activity and energy flow.

## Key Features

- ✅ **Activation Threshold**: Directional streaks now activate at ≥2 active links (was 3)
- ✅ **Node Pulses**: Nodes emit periodic energy waves based on their activity
- ✅ **Visual Effects**: Brightness boost, thickness expansion, color saturation when pulse intersects streaks
- ✅ **State-Aware**: Pulse behavior scales with synergy, harmony, corruption, and instability
- ✅ **Zero Gameplay Impact**: Pure visual layer, read-only from node/link state

## Usage

### Basic Pulse Emission (from your game loop)

```javascript
// In your update loop, periodically emit pulses from active nodes
const time = performance.now() / 1000; // Current time in seconds

for (const node of activeNodes) {
    // Get connected links
    const connectedLinks = networkGraph.getLinksFor(node);
    
    // Check if enough active links to warrant pulse
    if (connectedLinks.length >= 2) {  // Activation threshold
        // Emit pulse (deterministic timing based on node energy/activity)
        const nodeEnergy = node.energy ?? node.activityLevel ?? 0.5;
        const pulseInterval = 1.5 / (0.5 + nodeEnergy); // Faster pulse with more energy
        
        if (Math.floor((time - node.lastPulseTime) / pulseInterval) > 0) {
            linkRenderer.emitNodePulse(node, connectedLinks, time);
            node.lastPulseTime = time;
        }
    }
}
```

### Node State Properties (Read-Only)

The pulse system reads from these node properties:
- `node.energy` - Pulse amplitude and speed scaling (0-1)
- `node.activityLevel` - Alternative energy metric
- `node.synergy` - Fallback if energy/activity missing

If all are missing, defaults to neutral pulse (0.5).

### Visual Effects Explained

#### When a pulse intersects a directional streak:

- **Emissive Intensity**: Temporary +1.5x boost (state-modulated)
- **Thickness**: Subtle expansion (1.3x at peak, scales with harmony)
- **Alpha**: +0.4x opacity boost during pulse (scales with instability)
- **Color Saturation**: +0.3x saturation (from node energy)

#### State-Aware Modulation

- **Synergy**: Increases pulse speed (0.6x → 1.6x) and lifetime extension
- **Harmony**: Widens pulse influence, smooths wavefront
- **Corruption**: Adds phase wobble (mild temporal jitter, no reversal)
- **Instability**: Dampens amplitude (0.3x → 1.0x of base)

### Configuration

Edit `/LinkPulseWaveInjector.js` config object:

```javascript
this.config = {
    pulseIntervalBase: 2.0,         // Base seconds between pulses
    pulseDurationBase: 0.8,         // Pulse wave duration (seconds)
    
    pulseSpeedBase: 2.0,            // Units per second base speed
    pulseTaperWidth: 0.15,          // Pulse width as fraction of link
    
    intensityAmplification: 1.5,    // Emissive intensity multiplier
    thicknessAmplification: 1.3,    // Streak width multiplier
    colorSaturation: 0.3,           // Additional saturation
    alphaBoost: 0.4,                // Alpha multiplier boost
    
    // State modulation
    synergySpeedMultiplier: 2.0,    // Max speed boost from synergy
    harmonyWidth: 1.2,              // Width boost from harmony
    corruptionPhaseShift: 0.3,      // Phase wobble from corruption
    instabilityAmplitude: 0.6,      // Amplitude damping from instability
};
```

## Architecture

### LinkPulseWaveInjector
- Per-link pulse tracking (age, duration, strength)
- State-driven effect computation
- Pulse position sampling along link curve
- Gaussian falloff around pulse position

### Integration Points

1. **Initialization** (in `LinkRendererConduit.createLinkVisuals`):
   ```javascript
   directionalStreaks.initialize(group, linkIdHash, link);
   ```

2. **Update** (in `LinkRendererConduit.update`):
   ```javascript
   this.directionalStreaks.update(
       link.group, mainCurve, deltaTime,
       synergyLevel, harmonyLevel, corruptionLevel, instability,
       sourceColor, targetColor, link
   );
   ```

3. **Pulse Emission** (from game loop):
   ```javascript
   linkRenderer.emitNodePulse(sourceNode, connectedLinks, time);
   ```

## Visual Behavior

### Low Synergy Network
- Slow pulse propagation
- Few visible pulses
- Intermittent energy flow appearance

### High Synergy Network
- Fast pulse propagation
- Many simultaneous pulses
- Continuous flowing appearance

### High Harmony Network
- Wide, clean pulse wavefronts
- Smooth transitions
- Musical rhythm feel

### Corrupted Network
- Phase-shifted, wobbly pulses
- Slightly muted appearance
- Unstable energy flow

### Unstable Network
- Weak pulses, frequently suppressed
- Broken, intermittent appearance
- Choppy energy transfer

## Next Steps

1. **Harmonic Hub Synchronization**: Pulse phase alignment across connected links
2. **Audio Sync**: Pulse timing → audio frequency/tempo mapping
3. **LOD System**: Scale visual complexity for large networks
4. **Statistics Dashboard**: Real-time pulse activity visualization

---

**Note**: All pulse systems are pure visual adapters. They read-only from game state and never modify gameplay data or node/link properties.
