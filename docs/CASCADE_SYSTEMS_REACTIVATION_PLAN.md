# Cascade Systems Reactivation - Complete Implementation Plan

**Date:** 2026-03-06  
**Purpose:** Reactivate and integrate all cascade particle systems into ATOMA

---

## Executive Summary

4 cascade systems exist:
- ✅ **CascadeParticleSystem_Session120** - ACTIVE (working correctly)
- ⚠️ **CascadingRuptureSystem** - ORPHAN (reactivate)
- ❌ **CascadeResonanceWaveVisualization_Session146** - ORPHAN (reactivate)
- ❌ **ResonanceCascadeVisualization_Session117B** - ORPHAN (reactivate)

**Goal:** Integrate all cascade systems into main.js with proper update loops and cleanup.

---

## Phase 1: Import and Constructor Initialization

### main.js - Add Imports

```javascript
// Cascade Particle Systems
import { CascadeParticleSystem_Session120 } from './CascadeParticleSystem_Session120.js';
import { CascadingRuptureSystem } from './CascadingRuptureSystem.js';
import { CascadeResonanceWaveVisualization_Session146 } from './CascadeResonanceWaveVisualization_Session146.js';
import { ResonanceCascadeVisualization_Session117B } from './ResonanceCascadeVisualization_Session117B.js';
```

### main.js - Constructor Initialization

```javascript
// In Game class constructor

// Cascade Particle Systems (ALREADY EXISTS)
this.cascadeParticles = new CascadeParticleSystem_Session120(this.scene, {
    maxParticles: 3000,
    baseSize: 4.0,
    emissionRate: 1.0,
    enabled: true,
    debugMode: true
});
console.log('[main.js] CascadeParticleSystem_Session120 initialized');

// NEW: CascadingRuptureSystem
this.cascadingRuptureSystem = new CascadingRuptureSystem({
    scene: this.scene,
    linkingSystem: this.linkingSystem,
    nodes: this.nodes,
    enabled: true
});
console.log('[main.js] CascadingRuptureSystem initialized');

// NEW: CascadeResonanceWaveVisualization
if (this.harmonicHubSystem) {
    this.cascadeResonanceWave = new CascadeResonanceWaveVisualization_Session146(
        this.cascadeSystem,  // Reference to HarmonicCascadeAmplification_Session145
        this.harmonicHubSystem,
        this.linkResonanceSystem,
        {
            enabled: true,
            debugMode: false
        }
    );
    console.log('[main.js] CascadeResonanceWaveVisualization_Session146 initialized');
} else {
    console.warn('[main.js] HarmonicHubSystem not available, skipping CascadeResonanceWaveVisualization');
}

// NEW: ResonanceCascadeVisualization
if (this.conflictSystem && this.resonanceSystem) {
    this.resonanceCascade = new ResonanceCascadeVisualization_Session117B({
        conflictSystem: this.conflictSystem,
        resonanceSystem: this.resonanceSystem,
        linkingSystem: this.linkingSystem,
        enabled: true
    });
    console.log('[main.js] ResonanceCascadeVisualization_Session117B initialized');
} else {
    console.warn('[main.js] Conflict/Resonance systems not available, skipping ResonanceCascadeVisualization');
}

// Module toggle (for debugging)
this.cascadeModules = {
    cascadeParticles: true,      // CascadeParticleSystem_Session120
    cascadingRupture: true,      // CascadingRuptureSystem
    cascadeResonanceWave: true,  // CascadeResonanceWaveVisualization_Session146
    resonanceCascade: true       // ResonanceCascadeVisualization_Session117B
};
```

---

## Phase 2: Update Loop Integration

### main.js - FrameScheduler Registration

```javascript
// Register cascade systems in FrameScheduler
this.frameScheduler.register('visual', (dt) => {
    // CascadeParticleSystem_Session120 (ALREADY EXISTS)
    if (this.cascadeModules.cascadeParticles && this.cascadeParticles) {
        this.cascadeParticles.update(dt, this.time);
    }
    
    // NEW: CascadingRuptureSystem
    if (this.cascadeModules.cascadingRupture && this.cascadingRuptureSystem) {
        this.cascadingRuptureSystem.update(dt, this.time, this.ruptureSystem, this.harmonySystem);
    }
    
    // NEW: CascadeResonanceWaveVisualization
    if (this.cascadeModules.cascadeResonanceWave && this.cascadeResonanceWave) {
        this.cascadeResonanceWave.update(dt, this.time);
    }
    
    // NEW: ResonanceCascadeVisualization
    if (this.cascadeModules.resonanceCascade && this.resonanceCascade) {
        this.resonanceCascade.update(dt, this.time);
    }
}, 'visual.cascadeSystems');
```

---

## Phase 3: Dependencies Resolution

### Required Dependencies

**CascadingRuptureSystem needs:**
- ✅ `this.scene` - THREE.Scene
- ✅ `this.linkingSystem` - Network topology
- ✅ `this.nodes` - Node states
- ⚠️ `this.ruptureSystem` - May not exist, create stub
- ⚠️ `this.harmonySystem` - May not exist, create stub

**CascadeResonanceWaveVisualization needs:**
- ⚠️ `this.cascadeSystem` - HarmonicCascadeAmplification_Session145
- ⚠️ `this.harmonicHubSystem` - HarmonicHubAuraSystem
- ⚠️ `this.linkResonanceSystem` - LinkResonanceSystem

**ResonanceCascadeVisualization needs:**
- ⚠️ `this.conflictSystem` - Conflict detection system
- ⚠️ `this.resonanceSystem` - Resonance detection system

### Stub Creation (if systems don't exist)

```javascript
// Stub for missing systems
if (!this.ruptureSystem) {
    this.ruptureSystem = {
        getRuptureState: (nodeId) => ({ intensity: 0, active: false })
    };
    console.warn('[main.js] RuptureSystem stub created');
}

if (!this.harmonySystem) {
    this.harmonySystem = {
        getHarmonyState: (nodeId) => ({ intensity: 0.5, stability: 0.5 })
    };
    console.warn('[main.js] HarmonySystem stub created');
}

if (!this.cascadeSystem) {
    this.cascadeSystem = {
        getCascadeAmplification: (nodeId) => ({ intensity: 0, active: false })
    };
    console.warn('[main.js] CascadeSystem stub created');
}
```

---

## Phase 4: Cleanup and Disposal

### main.js - dispose() Method

```javascript
// In dispose() method
if (this.cascadeParticles) {
    this.cascadeParticles.dispose();
    console.log('[main.js] CascadeParticleSystem_Session120 disposed');
}

if (this.cascadingRuptureSystem) {
    this.cascadingRuptureSystem.dispose();
    console.log('[main.js] CascadingRuptureSystem disposed');
}

if (this.cascadeResonanceWave) {
    this.cascadeResonanceWave.dispose();
    console.log('[main.js] CascadeResonanceWaveVisualization disposed');
}

if (this.resonanceCascade) {
    this.resonanceCascade.dispose();
    console.log('[main.js] ResonanceCascadeVisualization disposed');
}
```

---

## Phase 5: Debug and Verification

### Console Debug Commands

```javascript
// Check if cascade systems are initialized
window.game.cascadeParticles  // CascadeParticleSystem_Session120
window.game.cascadingRuptureSystem  // CascadingRuptureSystem (NEW)
window.game.cascadeResonanceWave  // CascadeResonanceWaveVisualization (NEW)
window.game.resonanceCascade  // ResonanceCascadeVisualization (NEW)

// Check module toggles
window.game.cascadeModules  // All should be true

// Check cascade particles
window.game.cascadeParticles.active  // Active particle count
window.game.cascadeParticles.emissionCount  // Total emitted

// Trigger rupture cascade (if available)
window.game.cascadingRuptureSystem?.triggerRupture('node-id');

// Check cascade waves
window.game.cascadeResonanceWave?.activeWaves.size;

// Check resonance cascades
window.game.resonanceCascade?.activeWaves.length;
```

---

## Implementation Checklist

- [ ] Add imports for all 4 cascade systems
- [ ] Initialize CascadeParticleSystem_Session120 (already exists)
- [ ] Initialize CascadingRuptureSystem
- [ ] Initialize CascadeResonanceWaveVisualization (with stubs if needed)
- [ ] Initialize ResonanceCascadeVisualization (with stubs if needed)
- [ ] Create module toggles
- [ ] Register update loop for all cascade systems
- [ ] Add cleanup in dispose() method
- [ ] Test cascade particles visibility
- [ ] Test rupture cascade triggering
- [ ] Test resonance wave propagation
- [ ] Test node illumination from cascades

---

## Expected Visual Results

### CascadeParticleSystem_Session120 ✅
- **Already visible:** Particles flowing along links
- **Conflict types:** Destructive (arcs), Specialization (forks), Corruption (shards), Stability (blobs)
- **Emission:** Based on conflict intensity
- **Performance:** ~3000 particles

### CascadingRuptureSystem (NEW) ⚠️
- **Rupture cascades:** Visual tear effects across regions
- **Propagation:** Energy spreads from high-corruption regions
- **Effects:** Spatial tearing, phase destabilization, coherence loss
- **Triggering:** Automatic (based on corruption/stability)

### CascadeResonanceWaveVisualization (NEW) ⚠️
- **Subtle waves:** Ghost-level wave propagation
- **Oscillation:** Slow 2-4 second periods
- **Targets:** Synchronized harmonic hubs
- **Visibility:** Extremely subtle (barely perceptible)

### ResonanceCascadeVisualization (NEW) ⚠️
- **Radial waves:** Cascade expansion from conflict zones
- **Node illumination:** Glows based on cascade intensity
- **Link effects:** Ripple/kink distortion
- **Interference:** Standing wave interference patterns

---

## Performance Considerations

### Cascade Systems Impact

| System | Visual Objects | Memory | CPU | GPU |
|--------|---------------|--------|-----|-----|
| **CascadeParticleSystem_Session120** | ~3000 particles | Medium | Medium | Low |
| **CascadingRuptureSystem** | ~32 visual effects | Low | Low | Low |
| **CascadeResonanceWaveVisualization** | 0 (computation) | Low | Low | None |
| **ResonanceCascadeVisualization** | 0 (computation) | Low | Low | None |

**Total Impact:** ~3000 particles + 32 effects = Acceptable (<5% frame time)

---

## Integration Priority

1. **CascadingRuptureSystem** (HIGH) - Adds cascade mechanics
2. **ResonanceCascadeVisualization** (MEDIUM) - Adds cascade propagation visuals
3. **CascadeResonanceWaveVisualization** (MEDIUM) - Adds subtle wave effects

**CascadeParticleSystem_Session120** already active, no changes needed.

---

## Troubleshooting

### Problem: Cascade particles not visible

**Solution:**
```javascript
// Check module toggle
window.game.cascadeModules.cascadeParticles  // Should be true

// Check particle count
window.game.cascadeParticles.active  // Should be > 0

// Check if update is running
// Look for frame scheduler registration
```

### Problem: CascadingRuptureSystem not triggering

**Solution:**
```javascript
// Check if enabled
window.game.cascadingRuptureSystem.config.enabled  // Should be true

// Check corruption/stability thresholds
window.game.cascadingRuptureSystem.config.CORRUPTION_THRESHOLD  // 0.6
window.game.cascadingRuptureSystem.config.STABILITY_THRESHOLD  // 0.4

// Trigger manually
window.game.cascadingRuptureSystem.triggerRupture('node-id');
```

### Problem: CascadeResonanceWaveVisualization not working

**Solution:**
```javascript
// Check dependencies
window.game.cascadeSystem  // Should exist (or stub)
window.game.harmonicHubSystem  // Should exist
window.game.linkResonanceSystem  // Should exist

// Check active waves
window.game.cascadeResonanceWave.activeWaves.size  // Should be > 0
```

---

## Summary

| System | Status | Action Required |
|--------|--------|-----------------|
| **CascadeParticleSystem_Session120** | ✅ ACTIVE | None (already working) |
| **CascadingRuptureSystem** | ⚠️ ORPHAN | Integrate + dependencies |
| **CascadeResonanceWaveVisualization** | ❌ ORPHAN | Integrate + stubs if needed |
| **ResonanceCascadeVisualization** | ❌ ORPHAN | Integrate + stubs if needed |

**Expected Outcome:** All 4 cascade systems active and integrated with proper cleanup and module toggles.

**Next Steps:**
1. Apply Phase 1-4 changes to main.js
2. Test each system individually
3. Verify integration with existing systems
4. Performance test with all systems active
