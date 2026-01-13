# Harmonic Cascade Amplification — Quick Reference

## What It Does

Nearby harmonic hubs (within 24 units) detect each other and form **cascades**—zones where their resonance effects amplify each other (1.0x to 2.5x), phases synchronize, and visual waves propagate between them.

## Key Concepts

| Concept | Meaning |
|---------|---------|
| **Cascade** | 2+ nearby hubs with harmonic alignment forming an ensemble |
| **Phase Lock** | Hub pulse cycles gradually align to shared cascade tempo |
| **Breathing Sync** | Individual hub breathing modulated by cascade phase |
| **Cascade Wave** | Cyan tube traveling between hubs, emitted every 2 seconds |
| **Amplification Factor** | 1.0x (base) to 2.5x (max) multiplier on visual effects |
| **Synergy-Gated** | Cascades only form across links with synergy > 0.4 |

## Visual Indicators

| Visual | Meaning |
|--------|---------|
| Cyan overlay sphere between hubs | Cascade field (strength = amplification factor) |
| Synchronized hub breathing | Phase lock (pulses aligned) |
| Cyan tubes traveling between hubs | Cascade waves propagating |
| Brighter overlay at high synergy | Cascade strength increasing |
| Dimmer overlay with corruption | Cascade being dampened |
| Color shift toward magenta | High synergy alignment |

## Console Commands

```javascript
// Status & debugging
cascade_info()                        // Print cascade statistics
cascade_toggleDebug(true/false)      // Enable/disable debug visualization

// Configuration tuning
cascade_tune('paramName', value)     // Adjust any config parameter

// Global access
window.CASCADE_CONFIG                 // All tunable parameters
window.CASCADE_STATS                  // Current frame statistics
window.CASCADE_HUBS                   // Map of active cascades
```

## Key Parameters to Tune

```javascript
// Formation & Proximity
cascade_tune('maxCascadeDistance', 24.0)           // How far apart hubs can be
cascade_tune('minSynergyForAmplification', 0.4)    // Min synergy to connect

// Phase Synchronization
cascade_tune('cascadePhaseLockSpeed', 2.2)         // How fast phases converge
cascade_tune('cascadePhaseLockTightness', 0.92)    // Tightness of sync

// Breathing Sync
cascade_tune('cascadePulseEntrainment', 0.3)       // How much pulses sync

// Wave Propagation
cascade_tune('cascadeWaveSpeed', 8.0)              // Units/sec
cascade_tune('cascadeWaveFrequency', 2.0)          // Seconds between emissions

// Amplification
cascade_tune('synergyAmplificationMult', 0.5)      // Synergy contribution
cascade_tune('harmonyMagnification', 0.2)          // Extra harmony boost

// Corruption Damping
cascade_tune('corruptionCascadeDamping', 0.4)      // How much corruption weakens cascade
```

## Performance

| Metric | Value |
|--------|-------|
| Per-Frame Time (typical) | <1.5ms |
| Per-Frame Time (8 hubs, 3 cascades) | ~0.8ms |
| Memory Base | ~200 KB |
| Memory Per Cascade | ~30 KB |
| **Budget at 60 FPS** | 1.5ms = 9% of 16.7ms |

## Integration

### Initialization (automatic in main.js)
```javascript
// In setupHarmonicCascadeAmplification():
this.harmonicCascadeAmplification = new HarmonicCascadeAmplification_Session145(
    scene, world, harmonicHubSystem, linkResonanceSystem, { ... }
);
```

### Update Loop (automatic)
```javascript
// In animation loop (5502-5505):
if (this.harmonicCascadeAmplification) {
    this.harmonicCascadeAmplification.update(deltaTime);
}
```

## Debugging Checklist

- [ ] Cascades forming? → `cascade_info()` shows Active Cascades > 0
- [ ] Hubs have harmony? → Verify `harmony > corruption` on hubs
- [ ] Links have synergy? → Check links between hubs have synergy > 0.4
- [ ] Phase locks visible? → Hubs should breathe in sync
- [ ] Waves propagating? → Cyan tubes should appear between hubs
- [ ] Performance OK? → cascade_info() reports time metrics

## Quick Tuning Scenarios

### Cascades Too Rare
```javascript
cascade_tune('maxCascadeDistance', 30.0);           // Extend range
cascade_tune('minSynergyForAmplification', 0.3);    // Lower threshold
```

### Phases Not Syncing Well
```javascript
cascade_tune('cascadePhaseLockSpeed', 3.0);         // Faster convergence
cascade_tune('cascadePhaseLockTightness', 0.95);    // Tighter alignment
```

### Waves Not Visible
```javascript
cascade_tune('cascadeWaveSpeed', 12.0);             // Faster waves
cascade_tune('cascadeWaveFrequency', 1.0);          // More frequent
```

### Corruption Killing Cascades
```javascript
cascade_tune('corruptionCascadeDamping', 0.2);      // Reduce damping
cascade_tune('harmonyMagnification', 0.4);          // Boost harmony effect
```

### Performance Issues
```javascript
cascade_tune('cascadeWaveFrequency', 3.0);          // Fewer waves
cascade_tune('maxActiveCascades', 8);               // Limit cascades
```

## Architecture Overview

```
HarmonicCascadeAmplification_Session145
├─ Cascade Detection (_detectCascades)
│  ├─ Proximity detection (hub-hub distance < 24 units)
│  ├─ Synergy checking (links > 0.4 synergy)
│  └─ Cascade formation (BFS grouping)
│
├─ Phase Lock (_updateCascadePhaseLock)
│  └─ Elastic convergence to cascade base phase
│
├─ Breathing Sync (_synchronizePulses)
│  └─ Modulate individual hub breathing by cascade phase
│
├─ Wave Propagation (_updateCascadeWaves)
│  ├─ Emit waves every 2 seconds
│  └─ Travel between hubs at 8 units/sec
│
└─ Rendering (_updateCascadeOverlays)
   └─ Cyan overlay sphere at cascade center

Statistics:
  activeCascades, totalAmplification, phaseLocked, activeWaves, ...
```

## Statistics Interpretation

From `cascade_info()`:

| Stat | Meaning | Healthy Value |
|------|---------|---------------|
| Active Cascades | Number of active cascade groups | 1-8 (typical) |
| Total Amplification | Sum of all cascade amp factors | 3-20 (typical) |
| Avg Cascade Strength | Average cascade synergy×amp | 1.0-2.5 |
| Phase Locked Nodes | Nodes in cascades experiencing phase lock | 4-24 (typical) |
| Active Waves | Currently traveling cascade waves | 2-6 (typical) |
| Cascades Created | Cumulative cascades formed (session) | > 0 |

## Integration with Other Systems

**Reads From**:
- HarmonicHubAuraSystem (hub positions, harmony, corruption, synergy)
- LinkResonanceSystem (for future wave interactions)
- NodeAuraSystem (individual aura data)

**Feeds To**:
- Scene rendering (cascade overlay meshes, wave geometry)
- Console debugging (statistics and tuning)

**Does NOT Modify**:
- Any gameplay state
- Node properties
- Hub data
- Link structure

## File Locations

| File | Purpose |
|------|---------|
| `HarmonicCascadeAmplification_Session145.js` | Core system implementation (~600 lines) |
| `HARMONIC_CASCADE_AMPLIFICATION_GUIDE.md` | Full technical documentation |
| `CASCADE_QUICK_REFERENCE.md` | This quick reference |
| `main.js` (line 365) | Import statement |
| `main.js` (line 1208) | Property initialization |
| `main.js` (line 1605) | Setup call |
| `main.js` (line 5502-5505) | Update loop call |

## Example: Analyzing a Cascade

```javascript
// Get a cascade from the system
const cascade = Array.from(window.CASCADE_HUBS.values())[0];

// Print its properties
console.log(`
Cascade ID: ${cascade.cascadeId}
Hub Count: ${cascade.hubs.length}
Amplification: ${cascade.amplificationFactor.toFixed(2)}x
Cascade Strength: ${cascade.cascadeStrength.toFixed(2)}
Avg Harmony: ${cascade.avgHarmony.toFixed(2)}
Avg Corruption: ${cascade.avgCorruption.toFixed(2)}
Avg Synergy: ${cascade.avgSynergy.toFixed(2)}
Life: ${cascade.life.toFixed(1)}s
`);

// Check which hubs are involved
console.log('Hubs in cascade:');
for (const hub of cascade.hubs) {
  console.log(`  - ${hub.primaryNode.id} (harmony: ${hub.harmony.toFixed(2)})`);
}
```

## Visual Hierarchy

**Network Intelligence Layers** (bottom to top):
1. Individual nodes (core entities)
2. Node auras (individual state feedback)
3. Links (connections between nodes)
4. Link resonance (synergy visualization)
5. **← YOU ARE HERE: Harmonic hubs** (local harmony zones)
6. **← YOU ARE HERE: Cascades** (emergent collective consciousness)
7. Post-processing effects (chromatic aberration, bloom)

Cascades represent the highest level of emergent visual intelligence—where the network itself becomes conscious through collective resonance.
