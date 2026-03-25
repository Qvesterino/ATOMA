## VFX Systems Analysis: Waves, Particle Waves, Cascade Resonance

### 1. **WaveParticleEmitter_v1.js** - Wave-Reactive Particle FX

**Type:** GPU-Batched Particle System (5 systems, ~2000 particles each)

**Wiring to Scene:**
- ✅ **Connected to scene** - `init()` creates THREE.Points objects and adds them to scene
- 5 particle systems registered: `constructiveBurst`, `constructiveBurstVariantB`, `constructiveBurstVariantC`, `destructiveChaos`, `standingWaveRipple`
- Render order: `VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES')`
- Uses additive blending for glow effects

**FrameScheduler Registration:**
```javascript
'visual.waveParticleEmitter' -> this.particleEmitter.update(dt, nodes, links, waveInterferenceEngine)
```

**Trigger Events:**
- **Primary Trigger:** Wave field calculations from `waveInterferenceEngine`
- **Wave Field Metrics Required:**
  - `amplitude` / `totalAmplitude` - Overall wave intensity
  - `constructive` / `constructivePower` - Constructive interference
  - `destructive` / `destructivePower` - Destructive interference
  - `standing` / `standingWaveFactor` - Standing wave factor

- **Emission Thresholds:**
  - Constructive Burst: `constructive >= 0.15` (threshold config)
  - Destructive Chaos: `destructive >= 0.20`
  - Standing Wave Ripple: `standing >= 0.25`

- **Emission Gates:** Temporal throttling per node/link
  - Constructive: 0.18s cooldown
  - Destructive: 0.22s cooldown
  - Standing: 0.35s cooldown

- **Sources:**
  - `waveEngine.getNodeWaveField(nodeId, node)` for nodes
  - `waveEngine.getLinkWaveField(linkId, link)` for links
  - Fallback: `node.userData.waveField` or `link.userData.waveField`

**Visual Output:**
- 3 constructive variants (lattice seed, harmonic cell, helical trinity)
- Destructive chaos (orange-red erratic shards)
- Standing wave ripples (blue harmonic expansion)
- LOD scaling (0% at LOD 3+, 60% at LOD 1, 100% at LOD 0)

---

### 2. **CascadeParticleSystem_Session120.js** - Semantic Particle Encoding

**Type:** GPU-Batched Particle System with Texture Atlas (3000 particles)

**Wiring to Scene:**
- ✅ **Connected to scene** - `init()` creates THREE.Points with texture atlas and adds to scene
- Render order: `VisualHierarchyRegistry.getRenderOrder('LINK_CASCADE')`
- Uses shader with 4 distinct shapes (arcs, forks, shards, blobs)

**FrameScheduler Registration:**
```javascript
'visual.cascadeParticleSystem' -> this.cascadeParticleSystem.update(dt, time)
```

**Trigger Events:**
- **Primary Trigger:** `semanticBus.on('cascade.hop', handler)`
- **Cascade.hop Payload:**
  ```javascript
  {
    link: linkObject,
    linkId: string,
    sourceId: string,
    targetId: string,
    position: {x, y, z}, // midpoint
    intensity: 0-1,
    conflictType: 'destructive'|'specialization_drift'|'corruption'|'oscillatory_balance'|'fatigue_yield'|'resolved_harmony'|'neutral',
    timestamp: number
  }
  ```

- **Internal Cascade.hop Emission:**
  - System also EMITS `cascade.hop` events (for CascadeResonanceWaveVisualization)
  - Cooldown: 0.3s per link to prevent spam
  - Triggered when: `link.userData.flowState.intensity >= 0.1`

- **Conflict Type → Shape Mapping:**
  - Destructive → 0 (Arcs - Phase conflict)
  - Specialization Drift → 1 (Forks - Polarity conflict)
  - Corruption → 2 (Shards - Structural damage)
  - Oscillatory Balance → 3 (Blobs - Unreliable environment)
  - Fatigue Yield → 0 (Arcs - default)
  - Resolved Harmony → 0 (Arcs - default)
  - Neutral → 0 (Arcs - default)

- **Data Sources:**
  - `link.userData.flowState.intensity` - Cascade intensity
  - `link.userData.cascadeConflictType` - Conflict type
  - `link.userData.particleDensityMultiplier` - Density clustering
  - `link.userData.particleClusterCohesion` - Cohesion tightness
  - `link.userData.particleClusterRadius` - Cluster radius

**Visual Output:**
- Particles travel along links with semantic velocity encoding
- Forward flow, backflow, or oscillatory motion based on conflict type
- Shape encodes conflict semantics
- Clustering and density encode urgency/intensity

---

### 3. **CascadeResonanceWaveVisualization_Session146.js** - Ghost-Level Resonance

**Type:** Pure Temporal Modulation (NO visible objects)

**Wiring to Scene:**
- ❌ **No direct scene objects** - Pure parameter modulation
- Modifies existing visual systems indirectly:
  - `linkResonanceSystem.linkMetadata` - Adds `_wavePhaseCompression`, `_wavePhase`
  - `harmonicHubSystem.hubs` - Adds `_waveInfluence`, `_waveNoiseReduction`

**FrameScheduler Registration:**
```javascript
'visual.cascadeResonanceWaveVisualization' -> this.cascadeResonanceWaveVisualization.update(dt)
```

**Trigger Events:**
- **Primary Trigger:** `semanticBus.on('cascade.hop', handler)`
- **Same cascade.hop payload as CascadeParticleSystem**

- **Wave Lifecycle:**
  - Spawned on cascade.hop event
  - Auto-decays over time: `influence *= 0.88^deltaTime`
  - Dissolves completely when `influence < 0.05`
  - Wave phase oscillates at 3s period

- **Wave Application:**
  - **Links:** `metadata._wavePhaseCompression = influence * 0.06`
  - **Hubs:** `hub._waveInfluence += influence`, `hub._waveNoiseReduction = influence * 0.04`
  - **Influence Range:** 3-8% (barely perceptible)

- **Constraints (IMPORTANT):**
  - ❌ NO glow, color modulation, particles, rings, ripples
  - ❌ NO camera effects, visible "wavefront"
  - ❌ NO new geometry or mesh objects
  - ❌ NO gameplay state changes
  - ❌ NO actual energy transfer

**Visual Output:**
- Extremely subtle temporal modulation only
- Slight "pressure" sensation along links
- Brief aura tightening as wave passes
- No direct visual representation

---

## System Integration Summary

### Event Flow Chain:
```
Cascade Event (harmonyCascade, cascadeSystem, etc.)
    ↓
cascade.hop event emitted via semanticBus
    ↓
┌─────────────────────────────────────┐
│ CascadeParticleSystem               │ → Emits visual particles (shapes on links)
│ CascadeResonanceWaveVisualization  │ → Modulates existing visuals (subtle timing)
└─────────────────────────────────────┘
```

### Wave Flow Chain:
```
WaveInterferenceEngine (independent system)
    ↓
Computes wave fields for nodes/links
    ↓
WaveParticleEmitter.update()
    ↓
Emits particles based on wave field thresholds
```

### Key Integration Points:
1. **FrameScheduler** - All three systems registered in 'visual' lane
2. **SemanticBus** - Cascade systems subscribe to 'cascade.hop' events
3. **WaveEngine** - WaveParticleEmitter reads wave fields
4. **Scene Graph** - Only WaveParticleEmitter and CascadeParticleSystem add objects
5. **Link Metadata** - CascadeResonanceWave writes modulation params

### Wiring Verification:
- ✅ **WaveParticleEmitter**: Connected to scene, active per-frame
- ✅ **CascadeParticleSystem**: Connected to scene, event-driven
- ✅ **CascadeResonanceWave**: No scene objects (intentional), pure modulation

### Trigger Event Sources:
- **cascade.hop**: HarmonicCascadeAmplification_Session145, CascadeParticleSystem
- **wave fields**: WaveInterferenceEngine_v1
- **link state**: link.userData.flowState, link.userData.metrics