# Harmonic Cascade Amplification — Usage Examples

## Basic Status Checking

### Example 1: Check if Cascades Are Active
```javascript
// Open browser console and run:
cascade_info();

// Output:
// === HARMONIC CASCADE STATUS ===
// Active Cascades: 2
// Total Amplification: 3.45
// Avg Cascade Strength: 1.73
// Phase Locked Nodes: 8
// Active Waves: 4
// Cascades Created: 5
```

### Example 2: Access Raw Statistics
```javascript
// Check current frame stats
console.log(window.CASCADE_STATS);

// Output:
// {
//   activeCascades: 2,
//   cascadesCreated: 5,
//   totalAmplification: 3.45,
//   phaseLocked: 8,
//   activeWaves: 4,
//   avgCascadeStrength: 1.73,
// }
```

## Visual Debugging

### Example 3: Enable Debug Visualization
```javascript
// Show cascade debug meshes (wireframes, centers, connections)
cascade_toggleDebug(true);

// You should see:
// - Bright spheres at cascade centers
// - Wireframe meshes connecting hubs
// - Phase lock intensity gradients
// - Wave propagation paths

// Disable when done:
cascade_toggleDebug(false);
```

## Parameter Tuning

### Example 4: Make Cascades Form More Easily
```javascript
// Extend detection range
cascade_tune('maxCascadeDistance', 35.0);  // Default: 24.0

// Lower synergy requirement
cascade_tune('minSynergyForAmplification', 0.3);  // Default: 0.4

// Verify
cascade_info();
// Should see more Active Cascades if hubs exist
```

### Example 5: Increase Synchronization Strength
```javascript
// Make phases lock faster
cascade_tune('cascadePhaseLockSpeed', 3.0);  // Default: 2.2

// Make phases tighter
cascade_tune('cascadePhaseLockTightness', 0.95);  // Default: 0.92

// Increase pulse entrainment
cascade_tune('cascadePulseEntrainment', 0.5);  // Default: 0.3

// Result: Hub breathing becomes very synchronized
```

### Example 6: Make Waves More Visible
```javascript
// Speed up wave propagation
cascade_tune('cascadeWaveSpeed', 12.0);  // Default: 8.0

// Emit waves more frequently
cascade_tune('cascadeWaveFrequency', 1.0);  // Default: 2.0

// Increase wave amplitude
cascade_tune('cascadeWaveAmplitude', 0.25);  // Default: 0.15

// Result: More frequent, faster-moving cyan tubes between hubs
```

### Example 7: Weaken Corruption's Effect
```javascript
// Let corrupted hubs stay in cascades
cascade_tune('corruptionCascadeDamping', 0.2);  // Default: 0.4

// Boost harmony's effect
cascade_tune('harmonyMagnification', 0.4);  // Default: 0.2

// Result: Corruption doesn't kill cascades as easily
```

## Analyzing Cascades

### Example 8: Inspect Individual Cascades
```javascript
// Get all active cascades
const cascades = window.CASCADE_HUBS;

// Iterate through them
for (const [cascadeId, cascade] of cascades) {
  if (!cascade.active) continue;
  
  console.log(`\n=== ${cascadeId} ===`);
  console.log(`Hubs: ${cascade.hubs.length}`);
  console.log(`Amplification: ${cascade.amplificationFactor.toFixed(2)}x`);
  console.log(`Strength: ${cascade.cascadeStrength.toFixed(2)}`);
  console.log(`Harmony: ${cascade.avgHarmony.toFixed(2)}`);
  console.log(`Corruption: ${cascade.avgCorruption.toFixed(2)}`);
  console.log(`Synergy: ${cascade.avgSynergy.toFixed(2)}`);
  console.log(`Life: ${cascade.life.toFixed(1)}s`);
}
```

### Example 9: Get Strongest Cascade
```javascript
// Find cascade with highest amplification
let strongest = null;
let maxAmp = 1.0;

for (const cascade of window.CASCADE_HUBS.values()) {
  if (cascade.active && cascade.amplificationFactor > maxAmp) {
    strongest = cascade;
    maxAmp = cascade.amplificationFactor;
  }
}

if (strongest) {
  console.log(`Strongest cascade: ${strongest.cascadeId}`);
  console.log(`Amplification: ${maxAmp.toFixed(2)}x`);
  console.log(`Contains ${strongest.hubs.length} hubs`);
}
```

### Example 10: List All Hubs in Cascades
```javascript
// Find which hubs are in cascades (vs isolated)
const hubsInCascades = new Set();

for (const cascade of window.CASCADE_HUBS.values()) {
  if (cascade.active) {
    for (const hub of cascade.hubs) {
      hubsInCascades.add(hub.hubId);
    }
  }
}

console.log(`${hubsInCascades.size} hubs are in active cascades`);
```

## Live Tuning Scenarios

### Scenario 1: Peaceful Network Showcase
```javascript
// Tune system for harmony-dominant gameplay

// Maximize synchronization
cascade_tune('cascadePulseEntrainment', 0.7);
cascade_tune('cascadePhaseLockTightness', 0.96);

// Let harmony shine
cascade_tune('corruptionCascadeDamping', 0.1);
cascade_tune('harmonyMagnification', 0.5);

// Add more waves for beauty
cascade_tune('cascadeWaveFrequency', 1.0);
cascade_tune('cascadeWaveSpeed', 10.0);

// Enable debug to see effect
cascade_toggleDebug(true);

// Check result
cascade_info();
```

### Scenario 2: Chaotic Network Showcase
```javascript
// Tune system for corruption-rich gameplay

// Reduce synchronization
cascade_tune('cascadePulseEntrainment', 0.1);
cascade_tune('cascadePhaseLockTightness', 0.80);

// Let corruption matter
cascade_tune('corruptionCascadeDamping', 0.7);
cascade_tune('harmonyMagnification', 0.1);

// Fewer, slower waves
cascade_tune('cascadeWaveFrequency', 4.0);
cascade_tune('cascadeWaveSpeed', 5.0);

// Extend cascade range (harder to maintain)
cascade_tune('maxCascadeDistance', 20.0);

// Check result
cascade_info();
```

### Scenario 3: Extreme Showcase (Testing)
```javascript
// Maximum cascade effects for visual demo

cascade_tune('maxCascadeDistance', 40.0);          // Far-away hubs cascade
cascade_tune('minSynergyForAmplification', 0.2);   // Lower threshold
cascade_tune('cascadePulseEntrainment', 0.8);      // Very strong sync
cascade_tune('cascadePhaseLockSpeed', 4.0);        // Instant lock
cascade_tune('cascadeWaveSpeed', 15.0);            // Fast waves
cascade_tune('cascadeWaveFrequency', 0.5);         // Very frequent
cascade_tune('harmonyMagnification', 0.6);         // Strong harmony boost

// Enable debug
cascade_toggleDebug(true);

// Watch cascades form dramatically
cascade_info();
```

## Performance Monitoring

### Example 11: Monitor Cascade Performance Impact
```javascript
// Create reusable performance check
window.checkCascadePerf = () => {
  // Get stats before and after would require frame measurement
  // For now, just check if system is active
  
  const cascades = window.CASCADE_HUBS;
  const stats = window.CASCADE_STATS;
  
  console.log('=== CASCADE PERFORMANCE ===');
  console.log(`Active Cascades: ${stats.activeCascades}`);
  console.log(`Active Waves: ${stats.activeWaves}`);
  console.log(`Phase Locked: ${stats.phaseLocked}`);
  console.log(`Memory estimate: ~${(200 + stats.activeCascades * 30) / 1024}KB`);
  console.log('Expected time budget: <1.5ms per frame');
};

// Run it
checkCascadePerf();
```

### Example 12: Scale Testing
```javascript
// Manually test scaling behavior

// Small network (simulate)
console.log('Testing small network...');
cascade_tune('maxCascadeDistance', 12.0);
cascade_tune('minHubsForCascade', 3);
setTimeout(() => cascade_info(), 100);

// Medium network (simulate)
console.log('Testing medium network...');
cascade_tune('maxCascadeDistance', 24.0);
cascade_tune('minHubsForCascade', 2);
setTimeout(() => cascade_info(), 100);

// Large network (simulate)
console.log('Testing large network...');
cascade_tune('maxCascadeDistance', 35.0);
cascade_tune('minHubsForCascade', 2);
setTimeout(() => cascade_info(), 100);
```

## Programmatic Access

### Example 13: Get Amplification Factor for Hub
```javascript
// Access through game instance if needed
const cascadeSystem = window.game.harmonicCascadeAmplification;

// Get amplification for a specific hub
const hubId = 'some-hub-id';
const amplification = cascadeSystem.getHubAmplification(hubId);

console.log(`Hub ${hubId} amplification: ${amplification.toFixed(2)}x`);
```

### Example 14: Get Cascade for Hub
```javascript
// Find which cascade a hub belongs to
const cascadeSystem = window.game.harmonicCascadeAmplification;
const hubId = 'some-hub-id';

const cascade = cascadeSystem.getCascadeForHub(hubId);

if (cascade) {
  console.log(`Hub is in cascade: ${cascade.cascadeId}`);
  console.log(`Cascade size: ${cascade.hubs.length} hubs`);
  console.log(`Cascade strength: ${cascade.cascadeStrength.toFixed(2)}`);
} else {
  console.log('Hub is not in any cascade (isolated)');
}
```

## Configuration Snapshots

### Example 15: Save & Restore Configuration
```javascript
// Save current configuration
const savedConfig = { ...window.CASCADE_CONFIG };

// Make experimental changes
cascade_tune('cascadePulseEntrainment', 0.9);
cascade_tune('cascadeWaveFrequency', 0.5);

// Test...
cascade_info();

// Restore original
for (const [key, value] of Object.entries(savedConfig)) {
  cascade_tune(key, value);
}

console.log('Configuration restored');
```

### Example 16: Create Named Presets
```javascript
// Define presets
const CASCADE_PRESETS = {
  peaceful: {
    cascadePulseEntrainment: 0.7,
    corruptionCascadeDamping: 0.1,
    harmonyMagnification: 0.5,
    cascadeWaveFrequency: 1.0,
  },
  chaotic: {
    cascadePulseEntrainment: 0.1,
    corruptionCascadeDamping: 0.7,
    harmonyMagnification: 0.1,
    cascadeWaveFrequency: 4.0,
  },
  extreme: {
    cascadePulseEntrainment: 0.8,
    cascadeWaveFrequency: 0.5,
    cascadeWaveSpeed: 15.0,
    maxCascadeDistance: 40.0,
  },
};

// Apply preset
function applyPreset(name) {
  const preset = CASCADE_PRESETS[name];
  if (!preset) {
    console.warn(`Unknown preset: ${name}`);
    return;
  }
  
  for (const [key, value] of Object.entries(preset)) {
    cascade_tune(key, value);
  }
  
  console.log(`Applied preset: ${name}`);
  cascade_info();
}

// Usage:
// applyPreset('peaceful');
// applyPreset('chaotic');
// applyPreset('extreme');
```

## Troubleshooting Examples

### Example 17: Cascades Not Forming
```javascript
// Check prerequisites
console.log('=== CASCADE FORMATION TROUBLESHOOTING ===');

const cascadeSystem = window.game.harmonicCascadeAmplification;
const stats = window.CASCADE_STATS;

console.log(`1. System enabled? ${cascadeSystem.config.enabled}`);
console.log(`2. Active cascades: ${stats.activeCascades}`);
console.log(`3. Hub system exists? ${!!window.game.harmonicHubAuraSystem}`);
console.log(`4. Max distance: ${cascadeSystem.config.maxCascadeDistance}`);
console.log(`5. Min synergy: ${cascadeSystem.config.minSynergyForAmplification}`);

// Try solutions
if (stats.activeCascades === 0) {
  console.log('\nTrying to enable cascades...');
  cascade_tune('maxCascadeDistance', 35.0);
  cascade_tune('minSynergyForAmplification', 0.3);
  cascade_info();
}
```

### Example 18: Phases Not Locking
```javascript
// Check phase lock parameters
console.log('=== PHASE LOCK TROUBLESHOOTING ===');

const config = window.CASCADE_CONFIG;

console.log(`Phase lock speed: ${config.cascadePhaseLockSpeed}`);
console.log(`Phase lock tightness: ${config.cascadePhaseLockTightness}`);
console.log(`Pulse entrainment: ${config.cascadePulseEntrainment}`);

// Try increasing lock strength
console.log('\nIncreasing phase lock...');
cascade_tune('cascadePhaseLockSpeed', 4.0);
cascade_tune('cascadePhaseLockTightness', 0.98);
cascade_tune('cascadePulseEntrainment', 0.7);

cascade_info();
```

## Advanced: Custom Analysis

### Example 19: Cascade Topology Analysis
```javascript
// Analyze cascade network topology
function analyzeCascadeTopology() {
  console.log('=== CASCADE TOPOLOGY ANALYSIS ===');
  
  const cascades = window.CASCADE_HUBS;
  
  // Count by size
  const sizeDistribution = {};
  for (const cascade of cascades.values()) {
    if (!cascade.active) continue;
    const size = cascade.hubs.length;
    sizeDistribution[size] = (sizeDistribution[size] || 0) + 1;
  }
  
  console.log('Cascade sizes:');
  for (const [size, count] of Object.entries(sizeDistribution)) {
    console.log(`  ${size} hubs: ${count} cascades`);
  }
  
  // Find strongest & weakest
  let strongest = null, weakest = null;
  for (const cascade of cascades.values()) {
    if (!cascade.active) continue;
    if (!strongest || cascade.amplificationFactor > strongest.amplificationFactor) {
      strongest = cascade;
    }
    if (!weakest || cascade.amplificationFactor < weakest.amplificationFactor) {
      weakest = cascade;
    }
  }
  
  if (strongest) {
    console.log(`\nStrongest: ${strongest.cascadeId} (${strongest.amplificationFactor.toFixed(2)}x)`);
  }
  if (weakest) {
    console.log(`Weakest: ${weakest.cascadeId} (${weakest.amplificationFactor.toFixed(2)}x)`);
  }
}

// Run it
analyzeCascadeTopology();
```

## Summary

These examples demonstrate:
- ✅ **Status checking** — Verify cascade system is active
- ✅ **Visual debugging** — See cascade formations in real-time
- ✅ **Parameter tuning** — Live adjust cascade behavior
- ✅ **Analysis** — Inspect cascade internals
- ✅ **Performance monitoring** — Track system overhead
- ✅ **Presets** — Save & restore configurations
- ✅ **Troubleshooting** — Diagnose common issues
- ✅ **Advanced access** — Programmatic integration

Start with `cascade_info()` for quick status, then use `cascade_toggleDebug(true)` to visualize cascades, and `cascade_tune()` to experiment with different effects.
