# Cascade Particle Systems Analysis

**Date:** 2026-03-06  
**Purpose:** Analyze and reactivate cascade particle systems

---

## Cascade Systems Overview

### 1. CascadeParticleSystem_Session120 ✅ LIVE

**Status:** ACTIVE in FrameScheduler.visual (30Hz)
**Integration:** `this.cascadeParticles = new CascadeParticleSystem(this.scene)`
**Update:** `this.cascadeParticles.update(dt, this.time)`

**Material Settings:** ✅ CORRECT
```javascript
new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
})
```

**Features:**
- GPU-based particles with shader
- Texture atlas with 4 shapes (arcs, forks, shards, blobs)
- CPU-driven motion
- 3000 particle pool
- Conflict type visualization (destructive, specialization, corruption, stability, fatigue)

**Status:** ✅ Working correctly

---

### 2. CascadingRuptureSystem ⚠️ DEAD

**Status:** Not instantiated, no integration
**Type:** Computation + Visual cascade effects
**Capabilities:**
- Detects cascade conditions (corruption, stability, standing waves)
- Triggers rupture cascades across regions
- Visual effects: tear, destabilize, coherence_loss
- Propagation with energy decay

**Cleanup:** ✅ Has dispose()
```javascript
dispose() {
    this.activeCascades.forEach(c => c.reset());
    this.visualEffects.forEach(e => e.reset());
    this.ruptureHistory.clear();
    this.healingHistory.clear();
    console.log('[CascadingRuptureSystem] Disposed');
}
```

**Needs:**
- ✅ Import in main.js
- ✅ Constructor initialization
- ✅ Update loop registration
- ✅ Integration with corruption/rupture events

**Reactivation Priority:** HIGH (adds cascade mechanics)

---

### 3. CascadeResonanceWaveVisualization_Session146 ❌ DEAD

**Status:** Not instantiated, no integration
**Type:** Computation-only (NO visual objects)
**Capabilities:**
- Virtual wave phase per hub pair
- Slow oscillation (2-4 second period)
- Temporal modulation only (affects animation timing)
- Zero per-frame allocations

**No visual objects** → No depthTest/blending needed

**Needs:**
- ✅ Import in main.js
- ✅ Constructor initialization with cascade/harmonic systems
- ✅ Update loop registration
- ✅ Integration with harmonic hub system

**Reactivation Priority:** MEDIUM (adds subtle wave effects)

---

### 4. ResonanceCascadeVisualization_Session117B ❌ DEAD

**Status:** Not instantiated, no integration
**Type:** Computation-only (NO visual objects)
**Capabilities:**
- Visualizes resonance cascades from conflict zones
- Radial and link-based propagation
- Node illumination based on cascade intensity
- Link distortion effects
- Ripple interference

**No visual objects** → No depthTest/blending needed

**Needs:**
- ✅ Import in main.js
- ✅ Constructor initialization
- ✅ Update loop registration
- ✅ Integration with conflict/resonance systems

**Reactivation Priority:** MEDIUM (adds cascade propagation visuals)

---

## Reactivation Plan

### Phase 1: CascadingRuptureSystem (HIGH PRIORITY)

**Integration Points:**
1. **Import:** `import { CascadingRuptureSystem } from './CascadingRuptureSystem.js';`
2. **Constructor:** `this.cascadingRuptureSystem = new CascadingRuptureSystem(...);`
3. **Update Loop:** `this.cascadingRuptureSystem.update(dt, this.time);`
4. **Integration:** Connect to corruption/rubure events

**Dependencies:**
- `this.linkingSystem` - Network topology
- `this.nodes` - Node states
- Corruption/resonance metrics

**Expected Effect:**
- Rupture cascades across regions
- Visual tear/destabilization effects
- Energy propagation with decay

---

### Phase 2: CascadeResonanceWaveVisualization_Session146 (MEDIUM PRIORITY)

**Integration Points:**
1. **Import:** `import { CascadeResonanceWaveVisualization_Session146 } from './CascadeResonanceWaveVisualization_Session146.js';`
2. **Constructor:** `this.cascadeResonanceWave = new CascadeResonanceWaveVisualization_Session146(...);`
3. **Update Loop:** `this.cascadeResonanceWave.update(dt, this.time);`
4. **Integration:** Connect to harmonic hub system

**Dependencies:**
- Harmonic cascade system (Session145)
- Harmonic hub aura system
- Link resonance system

**Expected Effect:**
- Subtle ghost-level waves between synchronized hubs
- Temporal modulation of animation timing
- Barely perceptible wave pressure

---

### Phase 3: ResonanceCascadeVisualization_Session117B (MEDIUM PRIORITY)

**Integration Points:**
1. **Import:** `import { ResonanceCascadeVisualization_Session117B } from './ResonanceCascadeVisualization_Session117B.js';`
2. **Constructor:** `this.resonanceCascade = new ResonanceCascadeVisualization_Session117B(...);`
3. **Update Loop:** `this.resonanceCascade.update(dt, this.time);`
4. **Integration:** Connect to conflict/resonance systems

**Dependencies:**
- Conflict system
- Resonance system
- Node/link metrics

**Expected Effect:**
- Radial cascade waves from conflict zones
- Node illumination based on cascade intensity
- Link ripple/kink effects

---

## Integration Pattern

```javascript
// main.js

// 1. Import all cascade systems
import { CascadeParticleSystem_Session120 } from './CascadeParticleSystem_Session120.js';
import { CascadingRuptureSystem } from './CascadingRuptureSystem.js';
import { CascadeResonanceWaveVisualization_Session146 } from './CascadeResonanceWaveVisualization_Session146.js';
import { ResonanceCascadeVisualization_Session117B } from './ResonanceCascadeVisualization_Session117B.js';

// 2. Constructor initialization
constructor() {
    // ... existing code ...

    // Cascade particle system (already exists)
    this.cascadeParticles = new CascadeParticleSystem_Session120(this.scene);

    // NEW: CascadingRuptureSystem
    this.cascadingRuptureSystem = new CascadingRuptureSystem(
        this.scene,
        this.linkingSystem,
        this.nodes
    );

    // NEW: CascadeResonanceWaveVisualization
    this.cascadeResonanceWave = new CascadeResonanceWaveVisualization_Session146(
        cascadeSystem,
        harmonicHubSystem,
        linkResonanceSystem
    );

    // NEW: ResonanceCascadeVisualization
    this.resonanceCascade = new ResonanceCascadeVisualization_Session117B(
        conflictSystem,
        resonanceSystem
    );
}

// 3. Update loop registration
this.frameScheduler.register('visual', (dt) => {
    // Cascade particle system (already exists)
    this.cascadeParticles.update(dt, this.time);

    // NEW: CascadingRuptureSystem
    this.cascadingRuptureSystem.update(dt, this.time);

    // NEW: CascadeResonanceWaveVisualization
    this.cascadeResonanceWave.update(dt, this.time);

    // NEW: ResonanceCascadeVisualization
    this.resonanceCascade.update(dt, this.time);
}, 'visual.cascadeSystems');
```

---

## Debug Verification

```javascript
// Check if cascade systems are initialized
window.game.cascadeParticles  // CascadeParticleSystem_Session120 (exists)
window.game.cascadingRuptureSystem  // CascadingRuptureSystem (NEW)
window.game.cascadeResonanceWave  // CascadeResonanceWaveVisualization (NEW)
window.game.resonanceCascade  // ResonanceCascadeVisualization (NEW)

// Check if cascade systems are updating
// Should see cascade particles flowing along links

// Trigger rupture cascade (if available)
window.game.cascadingRuptureSystem?.triggerRupture(corruptedNodeId);
```

---

## Summary

| System | Status | Visual Objects | Depth/Blending | Reactivation Priority |
|--------|--------|---------------|-----------------|---------------------|
| **CascadeParticleSystem_Session120** | ✅ LIVE | YES | ✅ AdditiveBlending | N/A |
| **CascadingRuptureSystem** | ⚠️ DEAD | YES | ✅ (check) | HIGH |
| **CascadeResonanceWaveVisualization_Session146** | ❌ DEAD | NO | N/A | MEDIUM |
| **ResonanceCascadeVisualization_Session117B** | ❌ DEAD | NO | N/A | MEDIUM |

**Next Steps:**
1. Check CascadingRuptureSystem visual settings (if needed)
2. Integrate CascadingRuptureSystem (HIGH PRIORITY)
3. Integrate CascadeResonanceWaveVisualization (MEDIUM PRIORITY)
4. Integrate ResonanceCascadeVisualization (MEDIUM PRIORITY)
