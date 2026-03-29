# CASCADE SYSTEM AUDIT REPORT

**Date:** March 29, 2026  
**Purpose:** Map CASCADE systems, their visual impact, and geometry/mesh creation

---

## SUMMARY

Found **6 CASCADE-related systems** in ATOMA codebase:

1. **SynergyCascadeVisualizer** - Main visual system (PARTICLES + RIPPLES)
2. **CascadeParticleSystem_Session120** - Particle emission system (GPU geometry)
3. **CascadingHarmonicResonanceAmplification** - Data computation only (NO visuals)
4. **CascadeResonanceWaveVisualization_Session146** - Ghost-level temporal mod (NO geometry)
5. **CascadingRuptureSystem** - Rupture cascade system (visual effects on links/nodes)
6. **CascadeToWaveBridge_v1** - Event bridge (NO visuals)

---

## CASCADE SYSTEMS TABLE

| System Name | File | Adds Geometry/Mesh? | Visual Type | Real Visual? |
|-------------|------|-------------------|-------------|--------------|
| **SynergyCascadeVisualizer** | `SynergyCascadeVisualizer.js` | ✅ YES | Particles, Ripple rings | ✅ YES |
| **CascadeParticleSystem** | `CascadeParticleSystem_Session120.js` | ✅ YES | GPU particles | ✅ YES |
| **CascadingHarmonicResonance** | `CascadingHarmonicResonanceAmplification.js` | ❌ NO | Data computation | ❌ NO |
| **CascadeResonanceWaveViz** | `CascadeResonanceWaveVisualization_Session146.js` | ❌ NO | Temporal modulation | ❌ NO |
| **CascadingRuptureSystem** | `CascadingRuptureSystem.js` | ⚠️ MODIFIES | Link/node effects | ⚠️ MODIFIES |
| **CascadeToWaveBridge** | `CascadeToWaveBridge_v1.js` | ❌ NO | Event bridge | ❌ NO |

---

## SYSTEM DETAILS

### 1. SYNERGY CASCADE VISUALIZER
**File:** `SynergyCascadeVisualizer.js`

**Adds Real Geometry:** ✅ YES

**Visual Elements Created:**
- **Flow Particles:** `THREE.Mesh` (SphereGeometry) - Directional particles along cascade paths
  - Pool size: 500 particles
  - Geometry: `new THREE.SphereGeometry(0.06, 6, 6)`
  - Material: `MeshBasicMaterial` with additive blending
  - Added to scene: `this.scene.add(mesh)`

- **Ripple Effects:** `THREE.Line` (BufferGeometry) - Expanding rings from cascade sources
  - Geometry: Dynamic `BufferGeometry` with 32 segments
  - Material: `LineBasicMaterial` with transparency
  - Added to scene: `this.scene.add(rippleLine)`

**Visual Types:**
1. Wave Front - Animated pulse along links
2. Cascade Glow - Progressive brightness intensification
3. Flow Particles - Directional particles following cascade paths
4. Burst Particles - Compact burst at cascade start/hop
5. Ripple Effect - Concentric rings expanding from cascade source
6. Harmonic Shimmer - Oscillating color bands along links

**Data Source:** Reads `cascade.hop` events from semanticBus

**Performance:**
- Particles: 500 max pool size
- Update frequency: Every frame (skippable via config)
- Typical runtime: <3ms per frame

---

### 2. CASCADE PARTICLE SYSTEM (Session 120)
**File:** `CascadeParticleSystem_Session120.js`

**Adds Real Geometry:** ✅ YES

**Visual Elements Created:**
- **GPU Particle System:** `THREE.Points` - Semantic particle encoding
  - Pool size: 3000 particles
  - Geometry attributes: `positions[3]`, `colors[3]`, `sizes[1]`, `shapeIndices[1]`, `angles[1]`
  - CPU-driven motion with shader-driven shape selection
  - Texture atlas for shapes (arcs, forks, shards, blobs)

**Shape Encoding (Conflict Types):**
- Phase Conflict (0) → Arcs/Crescents (Out of sync)
- Polarity Conflict (1) → Forked/Split (Opposing intent)
- Corruption Conflict (2) → Fractured Shards (Structural damage)
- Stability Conflict (3) → Irregular Blobs (Unreliable)

**Velocity Encoding:**
- Forward Flow → Dominant propagation
- Backflow → Resistance/Absorption
- Oscillatory → Stalemate/Negotiation

**Data Source:** Listens to `cascade.hop` events via semanticBus

**Performance:**
- Single GPU draw call
- Zero per-frame allocations
- Object pooling

---

### 3. CASCADING HARMONIC RESONANCE AMPLIFICATION
**File:** `CascadingHarmonicResonanceAmplification.js`

**Adds Real Geometry:** ❌ NO

**Purpose:** Pure data computation system

**What It Does:**
- Computes cascade strength across network layers
- Amplifies harmonic state through topology
- Stores computed values in `node.userData`
- Emits `cascade.start` events

**Outputs (No Geometry):**
```javascript
node._cascadeLayer        // Layer number
node._cascadeStrength     // Combined strength (0-1)
node._cascadeAmplitude    // Max resonance amplitude
node._cascadePhase        // Combined phase
node.userData.cascadeStrength
node.userData.cascadeAmplitude
node.userData.cascadePhase
node.userData.waveField   // For wave shaders/particles
```

**Visual Impact:** Indirect - other systems read this data to render visuals

**Performance:** ~0.8ms for 50-node network, ~2ms for 100-node network

---

### 4. CASCADE RESONANCE WAVE VISUALIZATION (Session 146)
**File:** `CascadeResonanceWaveVisualization_Session146.js`

**Adds Real Geometry:** ❌ NO

**Purpose:** Ghost-level temporal modulation only

**Design Philosophy:**
"Pure temporal modulation — no visible objects, no particles, no energy transfer"

**What It Does:**
- Computes virtual wave phase per hub pair (0-1, normalized)
- Slow oscillation (2-4 second period)
- Temporal modulation only (affects animation timing, not brightness)
- Influence: 5-8% of baseline parameters (barely perceptible)

**Constraints (Explicit):**
❌ NO glow, color modulation, particles, rings, ripples
❌ NO camera effects, visible "wavefront"
❌ NO new geometry or mesh objects
❌ NO gameplay state changes
❌ NO actual energy transfer

**Manifestation (Extremely Subtle):**
- Links: Slight temporal phase drift compression
- Auras: Brief tightening as wave passes (NO opacity/color change)

**Visual Impact:** Near-invisible - only subtle timing changes

---

### 5. CASCADING RUPTURE SYSTEM
**File:** `CascadingRuptureSystem.js`

**Adds Real Geometry:** ⚠️ MODIFIES EXISTING

**Purpose:** Visualizes rupture energy propagating across network regions

**What It Does:**
- Detects cascade opportunities based on corruption/stability
- Propagates rupture energy through network hops
- Triggers visual effects on links and nodes

**Visual Effects (Modifies Existing):**
1. **Tear** - Phase destabilization along links
   - `link.userData.visualTear` - Phase destabilization
   - Modifies link material properties
   
2. **Destabilize** - Phase destabilization on nodes
   - `node.userData.visualDestabilization` - Stability disruption
   
3. **Coherence Loss** - Sudden coherence loss
   - `link.userData.visualCoherenceLoss` - Link dimming/flicker

**Visual Impact:** Modifies existing link/node materials, does not create new geometry

**Performance:**
- Max active cascades: 8
- Visual pool size: 32 pre-allocated effects

---

### 6. CASCADE TO WAVE BRIDGE (v1)
**File:** `CascadeToWaveBridge_v1.js`

**Adds Real Geometry:** ❌ NO

**Purpose:** Event-driven bridge only

**What It Does:**
- Listens to `cascade.hop` events
- Forwards burst intents to wave interference engine
- No renderer, no scheduler, no visual logic

**Visual Impact:** None - pure event routing

---

## VISUAL SYSTEMS COMPARISON

### Systems That Add Geometry to Scene:
| System | Geometry Type | Max Count | Scene Add Method |
|--------|--------------|----------|------------------|
| SynergyCascadeVisualizer | THREE.Mesh (Sphere) | 500 | `scene.add(mesh)` |
| SynergyCascadeVisualizer | THREE.Line (Ring) | Dynamic | `scene.add(rippleLine)` |
| CascadeParticleSystem | THREE.Points | 3000 | (Single draw call) |

### Systems That Modify Existing Geometry:
| System | Target | Modification Method |
|--------|--------|---------------------|
| CascadingRuptureSystem | Links | Material property changes |
| CascadingRuptureSystem | Nodes | userData visual flags |
| SynergyCascadeVisualizer | Links | Emissive/color modulation |

### Systems With No Visual Output:
| System | Output Type |
|--------|-------------|
| CascadingHarmonicResonanceAmplification | Data values (userData) |
| CascadeResonanceWaveVisualization | Temporal modulation only |
| CascadeToWaveBridge | Event emission only |

---

## DATA FLOW

```
[CascadingHarmonicResonanceAmplification]
    ↓ (Computes cascade data)
    ↓ (Emits 'cascade.start' events)
    
[SynergyCascadeVisualizer]
    ↓ (Listens to 'cascade.hop' events)
    ↓ (Creates particles & ripples)
    ✅ ADDS GEOMETRY TO SCENE
    
[CascadeParticleSystem]
    ↓ (Listens to 'cascade.hop' events)
    ↓ (Spawns GPU particles)
    ✅ ADDS GEOMETRY TO SCENE
    
[CascadingRuptureSystem]
    ↓ (Propagates rupture energy)
    ↓ (Modifies link/node materials)
    ⚠️ MODIFIES EXISTING GEOMETRY
    
[CascadeResonanceWaveVisualization]
    ↓ (Computes virtual waves)
    ↓ (Applies temporal modulation)
    ❌ NO GEOMETRY
```

---

## CONFIGURATION SUMMARY

### SynergyCascadeVisualizer
```javascript
maxPoolSize: 500           // Particle pool size
particleCount: 14          // Particles per cascade
hopLifetime: 0.7           // Seconds per hop visual
propagationSpeed: 2.0       // Units/second
```

### CascadeParticleSystem
```javascript
maxParticles: 3000         // Particle pool size
hopDecay: 0.82             // 18% decay per hop
emissionRate: 1.0          // Base emission rate
```

### CascadingHarmonicResonance
```javascript
layerDecayFactor: 0.6      // 60% decay per layer
maxCascadeLayers: 5        // Max propagation depth
secondaryHubThreshold: 0.7 // Strength to become secondary hub
```

### CascadingRuptureSystem
```javascript
MAX_ACTIVE_CASCADES: 8     // Max simultaneous cascades
VISUAL_POOL_SIZE: 32       // Pre-allocated effects
ENERGY_DECAY_PER_HOP: 0.35 // 35% loss per hop
```

### CascadeResonanceWaveVisualization
```javascript
waveOscillationPeriod: 3.0 // Seconds
waveInfluenceMin: 0.65     // Debug-visible minimum
waveInfluenceMax: 1.0      // Debug-visible maximum
```

---

## RECOMMENDATIONS

### 1. Visual Hierarchy
- **Primary visual systems:** SynergyCascadeVisualizer, CascadeParticleSystem
- **Secondary visual systems:** CascadingRuptureSystem (modifier only)
- **Data systems:** CascadingHarmonicResonanceAmplification, CascadeResonanceWaveVisualization

### 2. Performance Monitoring
- Track particle pool usage (max 500 for SynergyCascadeVisualizer)
- Monitor THREE.Points count (max 3000 for CascadeParticleSystem)
- Watch ripple cleanup (prevent memory leaks)

### 3. Debug Console API
```javascript
// SynergyCascadeVisualizer
window.cascadeDebug.stats()        // Show performance
window.cascadeDebug.toggle()       // Enable/disable
window.cascadeDebug.clear()        // Clear all cascades

// CascadingHarmonicResonance
window.CascadeAPI.stats()           // Show cascade stats
window.CascadeAPI.dump(10)         // Dump cascade state

// CascadingRuptureSystem
game.cascadeStatus()                // Show cascade status
game.enableCascades()               // Enable cascade propagation
```

---

## CONCLUSION

**Real Visual Systems (2):**
1. SynergyCascadeVisualizer - Particles + Ripples ✅
2. CascadeParticleSystem - GPU particles ✅

**Modifier Systems (1):**
1. CascadingRuptureSystem - Modifies existing link/node materials ⚠️

**Data-Only Systems (3):**
1. CascadingHarmonicResonanceAmplification - Computation ❌
2. CascadeResonanceWaveVisualization - Temporal modulation ❌
3. CascadeToWaveBridge - Event routing ❌

**Key Finding:** Only 2 out of 6 CASCADE systems add actual geometry to the scene. The rest either modify existing visuals or provide data for other systems to consume.

---

**END OF AUDIT**