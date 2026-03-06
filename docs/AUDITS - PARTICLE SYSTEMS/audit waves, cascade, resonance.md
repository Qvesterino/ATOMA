# COMPLETE INVENTORY: PARTICLE/SPARK/TRAIL/EMITTER/WAVE/CASCADE/RESONANCE SYSTEMS

## MASTER TABLE

| File | Particle Type | Spawn Type | Buffer/Mesh | scene.add Usage | Pooling | Status |
|------|---------------|------------|-------------|-----------------|---------|--------|
| **LinkSparkSystem.js** | spark | Ring buffer (spawnBurst) | THREE.BufferGeometry (Points) | Yes via `getMesh()` | **YES** (maxSparks=60) | **ACTIVE** |
| **LinkTrailParticleSystem.js** | trail | Managed pool | THREE.BufferGeometry (Points) | Yes in constructor | **YES** (managed pool) | **ACTIVE** |
| **LinkHealingParticleSystem.js** | healing | Unknown | THREE.BufferGeometry (Points) | Yes in constructor | Unknown | **LEGACY** |
| **LinkCorruptionParticleSystem.js** | corruption | Unknown | THREE.BufferGeometry (Points) | Yes in constructor | Unknown | **DEAD** |
| **HealingParticleSystem_Session136.js** | healing | Circular buffer index | THREE.BufferGeometry (Points) | Yes in constructor | **YES** (maxParticles=5000) | **ACTIVE** |
| **CascadeParticleSystem_Session120.js** | cascade | Linear pool search | THREE.BufferGeometry (Points) | Yes in constructor | **YES** (maxParticles=3000) | **ACTIVE** |
| **WaveParticleEmitter_v1.js** | wave/emitter | Unknown | THREE.BufferGeometry (Points) | Yes via `init(renderer, scene)` | **YES** (maxParticlesPerFamily=2000) | **UNKNOWN** |
| **CascadeParticleEmissionBoost_Session118.js** | cascade-boost | None | None | None visible | No | **DEAD** |
| **CascadeParticleColorTinting_Session119.js** | cascade-tint | None | None | None visible | No | **DEAD** |
| **ParticleSemanticDensityAdapter_Session121.js** | density | None | None | None | No | **DEAD** |
| **ParticleCascadeFlowDeflection.js** | deflection | None | None | None | No | **DEAD** |
| **ParticleStreamCascadeAcceleration.js** | acceleration | None | None | None | No | **DEAD** |
| **ParticleTrailSystem_Session122.js** | trail | Unknown | THREE.BufferGeometry (Points) | Yes in constructor | Unknown | **DEAD** |
| **ParticleEmissionScaler.js** | scaler | None | None | None | No | **DEAD** |
| **CascadingRuptureSystem.js** | rupture | Unknown | Unknown | Unknown | Unknown | **DEAD** |
| **ResonanceCascadeVisualization_Session117B.js** | cascade-wave | Unknown | Unknown | Unknown | Unknown | **DEAD** |
| **CascadeResonanceWaveVisualization_Session146.js** | cascade-wave | None | None | None (pure temporal modulation) | No | **DEAD** |
| **CascadingHarmonicResonanceAmplification.js** | resonance | None | None | None (pure data computation) | No | **UNKNOWN** |
| **LinkBeadSystem.js** | bead | Per-link | Unknown | Yes per bead | Unknown | **ACTIVE** |
| **LinkBeadTrailSystem.js** | bead-trail | Unknown | Unknown | Unknown | Unknown | **DEAD** |
| **EnergyOrb.js** | orb | Unknown | Unknown | Unknown | Unknown | **DEAD** |
| **StressBasedParticleScaler_v1.js** | scaler | None | None | None | No | **DEAD** |
| **VisualEchoTrails_v1_Shader.js** | echo-trail | None | THREE.ShaderMaterial | Applied to line geometries | No | **ACTIVE** |

---

## SUMMARY BY CATEGORY

### PARTICLE SYSTEMS (GPU-based points)
- **Active:** CascadeParticleSystem_Session120, HealingParticleSystem_Session136
- **Dead/Legacy:** LinkCorruptionParticleSystem, ParticleTrailSystem_Session122

### SPARK SYSTEMS
- **Active:** LinkSparkSystem
- **Dead:** None

### TRAIL SYSTEMS
- **Active:** LinkTrailParticleSystem, VisualEchoTrails_v1 (shader-based)
- **Dead:** ParticleTrailSystem_Session122, LinkBeadTrailSystem

### EMITTER SYSTEMS
- **Active:** WaveParticleEmitter_v1 (status uncertain)
- **Dead:** None

### CASCADE SYSTEMS
- **Active:** CascadeParticleSystem_Session120
- **Dead:** ResonanceCascadeVisualization_Session117B, CascadeResonanceWaveVisualization_Session146, CascadeParticleEmissionBoost_Session118, CascadeParticleColorTinting_Session119

### RESONANCE SYSTEMS
- **Unknown:** CascadingHarmonicResonanceAmplification (pure data, no visuals)
- **Dead:** None

### AUXILIARY SYSTEMS
- **Active:** LinkBeadSystem
- **Dead:** EnergyOrb, StressBasedParticleScaler_v1, ParticleEmissionScaler

---

## ACTIVE SYSTEMS BREAKDOWN

### 1. LinkSparkSystem.js
- **Type:** spark
- **Spawn:** Ring buffer via `spawnBurst(count, time, intensity)`
- **Buffer:** THREE.BufferGeometry with attributes: position, aSpawnTime, aLifeTime, aT, aAngle, aSpeed, aSize
- **Mesh:** THREE.Points
- **scene.add:** Yes, via `getMesh()` method
- **Pooling:** YES (maxSparks=60, round-robin)
- **Status:** **ACTIVE** - Per-link system in LinkRendererConduit
- **Update:** LinkRendererConduit.js:490 (per-link update)
- **RenderOrder:** LINK_SPARKS (261)

### 2. LinkTrailParticleSystem.js
- **Type:** trail
- **Spawn:** Managed pool
- **Buffer:** THREE.BufferGeometry (Points)
- **Mesh:** THREE.Points
- **scene.add:** Yes in constructor (`scene.add(poolGroup)`)
- **Pooling:** YES (managed pool)
- **Status:** **ACTIVE** - FrameScheduler.visual layer (30Hz)
- **Update:** main.js:3315
- **RenderOrder:** LINK_PARTICLES (260)

### 3. HealingParticleSystem_Session136.js
- **Type:** healing (sparkles + trails)
- **Spawn:** Circular buffer index (particleIndex % maxParticles)
- **Buffer:** THREE.BufferGeometry with attributes: position, velocity, color, birthTime, lifetime, size
- **Mesh:** THREE.Points
- **scene.add:** Yes in constructor
- **Pooling:** YES (maxParticles=5000, circular buffer)
- **Status:** **ACTIVE** - FrameScheduler.visual layer (30Hz)
- **Update:** main.js:3327
- **RenderOrder:** FX (via VisualHierarchyRegistry)

### 4. CascadeParticleSystem_Session120.js
- **Type:** cascade (semantic particle encoding)
- **Spawn:** Linear pool search (simple allocation)
- **Buffer:** THREE.BufferGeometry with attributes: position, color, size, shapeIndex, angle
- **Mesh:** THREE.Points
- **scene.add:** Yes in constructor
- **Pooling:** YES (maxParticles=3000, object pool)
- **Status:** **ACTIVE** - FrameScheduler.visual layer (30Hz)
- **Update:** main.js:3297
- **RenderOrder:** LINK_PARTICLES (260)
- **Special:** Texture atlas for shape switching (4 semantic shapes)

### 5. WaveParticleEmitter_v1.js
- **Type:** wave/emitter
- **Spawn:** Unknown
- **Buffer:** THREE.BufferGeometry (Points)
- **Mesh:** THREE.Points
- **scene.add:** Yes via `init(renderer, scene)`
- **Pooling:** YES (maxParticlesPerFamily=2000)
- **Status:** **UNKNOWN** - Initialized but no update() found in main.js

### 6. VisualEchoTrails_v1_Shader.js
- **Type:** echo-trail (shader-only)
- **Spawn:** None (pure shader effect)
- **Buffer:** None (material-level)
- **Mesh:** Applied to existing line geometries
- **scene.add:** No (applied via material)
- **Pooling:** No
- **Status:** **ACTIVE** - Shader-level visual enhancement
- **Special:** Pure fragment shader with echo trails, no new geometry

### 7. LinkBeadSystem.js
- **Type:** bead
- **Spawn:** Per-link instantiation
- **Buffer:** Unknown
- **Mesh:** Unknown
- **scene.add:** Yes per bead
- **Pooling:** Unknown
- **Status:** **ACTIVE** - Embedded in LinkRendererConduit
- **Update:** LinkRendererConduit.js:350 (per-link)

---

## POOLING STATISTICS

| Pooling Type | Count | Systems |
|--------------|-------|---------|
| **Fixed-size pool + ring buffer** | 2 | LinkSparkSystem, HealingParticleSystem_Session136 |
| **Managed pool** | 1 | LinkTrailParticleSystem |
| **Object pool with linear search** | 1 | CascadeParticleSystem_Session120 |
| **No pooling** | 1 | VisualEchoTrails_v1 (shader-only) |
| **Unknown** | 2 | WaveParticleEmitter_v1, LinkBeadSystem |

---

## DEAD/LEGACY SYSTEMS (16 total)

### Never Instantiated (14)
1. LinkCorruptionParticleSystem.js
2. LinkHealingParticleSystem.js (legacy)
3. CascadeParticleEmissionBoost_Session118.js
4. CascadeParticleColorTinting_Session119.js
5. ParticleSemanticDensityAdapter_Session121.js
6. ParticleCascadeFlowDeflection.js
7. ParticleStreamCascadeAcceleration.js
8. ParticleTrailSystem_Session122.js
9. ParticleEmissionScaler.js
10. ResonanceCascadeVisualization_Session117B.js
11. CascadeResonanceWaveVisualization_Session146.js
12. LinkBeadTrailSystem.js
13. EnergyOrb.js
14. StressBasedParticleScaler_v1.js

### Uncertain Status (2)
1. CascadingHarmonicResonanceAmplification.js (pure data, no visuals)
2. WaveParticleEmitter_v1.js (initialized, no update found)

---

## KEY PATTERNS

### Common Attributes
- **position**: All GPU particle systems
- **time/lifetime**: All active systems
- **size**: All active systems
- **color**: All active systems
- **velocity/motion**: HealingParticleSystem_Session136
- **shapeIndex**: CascadeParticleSystem_Session120 (texture atlas)
- **curve parameters**: LinkSparkSystem (Bezier control points)

### Common Techniques
- **Ring buffer/circular index**: LinkSparkSystem, HealingParticleSystem_Session136
- **Negative sentinel for dead particles**: LinkSparkSystem, HealingParticleSystem_Session136
- **GPU-side motion**: All active systems (shader-based)
- **Additive blending**: All active systems
- **Frustum culling disabled**: All active systems (for tiny sprites)

### Render Order Hierarchy
- **LINK_PICTO**: 258
- **LINK_IMPACTS**: 250
- **LINK_PARTICLES**: 260
- **LINK_SPARKS**: 261
- **FX**: Variable

---

## CONCLUSION

**Total Systems:** 22  
**Active:** 7  
**Unknown Status:** 2  
**Dead/Legacy:** 13

The codebase has a significant graveyard of particle systems (13 dead), but 7 systems are actively running:
- 5 confirmed active (FrameScheduler visual layer + per-link systems)
- 1 uncertain (WaveParticleEmitter_v1)
- 1 pure data system (CascadingHarmonicResonanceAmplification)