# ATOMA PARTICLE CASCADE AUDIT A

## READ ONLY ANALYSIS COMPLETE

---

## SYSTEM 1: CascadeParticleSystem_Session120.js

**PARTICLE TYPE**: Semantic cascade particles (shape-encoded)

- Arcs/Crescents (Phase conflict)
- Forked/Split (Polarity conflict)
- Fractured Shards (Corruption conflict)
- Irregular Blobs (Stability conflict)

**SPAWN RATE**: Variable, probabilistic emission

- Base: `emissionRate * 10 * boost * intensity * densityMultiplier`
- Calculated per-frame per link
- Includes random jitter: `Math.floor(rate * deltaTime + Math.random())`

**POOLING USED**: YES

- Object pool with `maxParticles` (default: 3000)
- Linear allocation: `this._allocateParticle()` searches for inactive particles
- Pre-allocated Float32Array buffers for GPU attributes

**SCENE ADD**: YES

- Adds `THREE.Points` mesh to scene during `init()`
- Render order: `VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES')`
- Frustum culling disabled for always-visible rendering
- Cleanup: `dispose()` removes mesh and disposes resources

**EMITTER**: `_spawnParticles()` → `_emit(count, ...)`

- Iterates over links with cascade activity
- Spawns particles along link curve paths
- Respects clustering parameters from Session 121

**LIFETIME LOGIC**:

- Random lifetime: `0.5 + Math.random() * 0.5` (0.5-1.0s)
- Age-based deactivation: `if (age >= p.maxLifetime) p.active = false`
- Size fade: `Math.sin(lifeRatio * Math.PI)` for smooth arc

---

## SYSTEM 2: CascadeParticleEmissionBoost_Session118.js

**PARTICLE TYPE**: None (pure adapter)

**SPAWN RATE**: N/A (computes multipliers only)

**POOLING USED**: NO

**SCENE ADD**: NO

**NOTES**:

- Reads cascade intensity from cascade system
- Writes `link.userData.cascadeParticleEmissionBoost` (1.0-5.0x multiplier)
- Implements burst modulation with sinusoidal pulsing
- Cleanup: Removes inactive boosters after 5s timeout

---

## SYSTEM 3: CascadeParticleColorTinting_Session119.js

**PARTICLE TYPE**: None (pure adapter)

**SPAWN RATE**: N/A

**POOLING USED**: NO

**SCENE ADD**: NO

**NOTES**:

- Reads conflict type and intensity
- Writes to `link.userData.cascadeParticleColor`, `.cascadeParticleColorRGB`, `.cascadeParticleColorHex`
- Implements color palettes for 6 conflict types + neutral
- EMA smoothing: alpha 0.15 for smooth color transitions
- Defer THREE initialization until available

---

## SYSTEM 4: ParticleStreamCascadeAcceleration.js

**PARTICLE TYPE**: None (computes acceleration vectors)

**SPAWN RATE**: N/A

**POOLING USED**: NO

**SCENE ADD**: NO

**NOTES**:

- Computes acceleration multipliers based on cascade layer depth
- Formula: `AccelMult = 1 + (1 - cascadeStrength) × layerDepthCurve × stateMod`
- Caches results with 50ms validity window
- Modulated by harmony (damping), synergy (amplification), corruption (turbulence)
- Exported to console API: `window.cascadeAccelConsole`

---

## SYSTEM 5: ParticleTrailSystem_Session122.js

**PARTICLE TYPE**: Motion trail particles

**SPAWN RATE**: Probabilistic

- `trailEmissionRate`: 0.5 (50% of Forward flow particles)
- Only spawns trails for particles with `flowType === 0` (Forward)

**POOLING USED**: YES

- Object pool with `maxTrailParticles` (default: 1000)
- Circular buffer reuse when pool full
- Pre-allocated Float32Array buffers

**SCENE ADD**: YES

- Adds `THREE.Points` mesh named 'ParticleTrails_Session122'
- Custom shader material with age-based fade
- Cleanup: `dispose()` removes mesh and clears history map

**EMITTER**: `_spawnTrail(position, color, parentSize)`

- Triggered by Forward flow particles
- Calculates velocity from position history (2-frame tracking)
- Lifetime: `trailLifetime` (default: 0.1s = 100ms)

**LIFETIME LOGIC**:

- Very short lifetime (100ms default)
- Exponential fade in shader: `exp(-ageFraction * uTrailFadeRate)`
- Trail length scales with speed: `speed * trailLengthFactor`

---

## SYSTEM 6: ParticleSemanticDensityAdapter_Session121.js

**PARTICLE TYPE**: None (computes density/clustering parameters)

**SPAWN RATE**: N/A

**POOLING USED**: NO

**SCENE ADD**: NO

**NOTES**:

- Computes `particleDensityMultiplier` (1.0-4.0x)
- Computes `particleClusterCohesion` (0-1) and `particleClusterRadius` (0.1-2.0)
- Intensity mapping: quadratic curve (`intensity * intensity`)
- Urgency sources: cascade changes, conflict persistence, oscillation, fatigue
- EMA smoothing: alpha 0.2 (intensity), 0.15 (urgency)
- Writes to `link.userData` for downstream consumption

---

## SYSTEM 7: ParticleCascadeFlowDeflection.js

**PARTICLE TYPE**: None (computes deflection vectors)

**SPAWN RATE**: N/A

**POOLING USED**: NO

**SCENE ADD**: NO

**NOTES**:

- Computes deflection vectors for particle velocity alignment
- Hub (layer 0): radial outward flow
- Layer 1-2+: flow away from cascade source
- Topology-aware: uses neighbor relationships
- Corruption adds perpendicular turbulence
- Caches flow directions and strength
- Console API: `window.cascadeFlowDeflection`

---

## SUMMARY

### Total Particle Emitters: 2

1. **CascadeParticleSystem_Session120** - Main cascade particles (max 3000)
2. **ParticleTrailSystem_Session122** - Motion trails (max 1000)

### Total Adapters: 5

1. **CascadeParticleEmissionBoost_Session118** - Emission multiplier
2. **CascadeParticleColorTinting_Session119** - Color tinting
3. **ParticleStreamCascadeAcceleration** - Acceleration vectors
4. **ParticleSemanticDensityAdapter_Session121** - Density/clustering
5. **ParticleCascadeFlowDeflection** - Flow deflection

### Object Pooling

- Both emitter systems use object pooling (zero allocations during runtime)
- Pre-allocated GPU buffers (Float32Array)
- Linear pool search for allocation

### Scene Mutations

- 2 systems add THREE.Points meshes to scene
- 5 systems write to link.userData (pure visual adapters)
- All systems respect enable/disable flags
- Cleanup methods present for resource disposal

### Lifetime Logic

- Main particles: 0.5-1.0s with sine-based fade
- Trail particles: 0.1s (100ms) with exponential fade
- Deactivation checks in update loops

### Integration Pattern

- Adapter systems read cascade/conflict state
- Write computed values to link.userData
- Main particle system reads userData for emission parameters
- Console debug APIs provided for all systems

### Performance Characteristics

- Zero per-frame allocations (verified)
- Cache invalidation strategies (50ms-5s timeouts)
- EMA smoothing for temporal stability
- Deterministic pseudo-random for corruption noise
