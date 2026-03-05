# ATOMA Particle & Spark Systems Discovery Audit

**Date:** 2026-03-05  
**Scope:** READ-ONLY audit of all particle/spark systems  
**Goal:** Identify creation sites, update chains, runtime usage, and determine active vs dead systems

---

## MASTER TABLE: ALL PARTICLE/SPARK SYSTEMS

| SystemName | FilePath | Type | Create Site | Update Site | Scene Attach | Pooling | Gating | renderOrder | Runtime Used? |
|------------|----------|------|-------------|-------------|--------------|---------|--------|-------------|---------------|
| **LinkSparkSystem** | `LinkSparkSystem.js` | spark | `main.js:~2467` (per-link `new LinkSparkSystem`) | `LinkRendererConduit.js:~490` (per-link update) | `scene.add(mesh)` via `LinkSparkSystem.getMesh()` | Yes (maxSparks=60, round-robin) | `window.__DEBUG_LINK_PARTICLES__` | LINK_SPARKS (261) | **LIVE** - Per-link system in LinkRendererConduit |
| **LinkTrailParticleSystem** | `LinkTrailParticleSystem.js` | trail | `main.js:~3632` (`new LinkTrailParticleSystem`) | `main.js:~3315` (FrameScheduler.visual 30Hz) | `scene.add(poolGroup)` in constructor | Yes (managed pool) | None visible | LINK_PARTICLES (260) | **LIVE** - FrameScheduler.visual.layer |
| **LinkHealingParticleSystem** | `LinkHealingParticleSystem.js` | healing | NOT FOUND in main.js (legacy?) | `LinkRendererConduit.js:~520` (inline update) | `scene.add(poolGroup)` in constructor | Yes | None visible | LINK_PARTICLES (260) | **LIKELY DEAD** - Not in main.js |
| **LinkCorruptionParticleSystem** | `LinkCorruptionParticleSystem.js` | corruption | NOT FOUND in main.js | NOT FOUND in main.js | `scene.add(mesh)` in constructor | Unknown | None | LINK_PARTICLES (260) | **DEAD** - No instantiation |
| **HealingParticleSystem_Session136** | `HealingParticleSystem_Session136.js` | healing | `main.js:~3626` (`new HealingParticleSystem_Session136`) | `main.js:~3327` (FrameScheduler.visual 30Hz) | `scene.add(mesh)` in constructor | Unknown | None | Unknown | **LIVE** - FrameScheduler.visual.layer |
| **CascadeParticleSystem_Session120** | `CascadeParticleSystem_Session120.js` | cascade | `main.js:~3611` via `setupCascadeParticleSystem()` | `main.js:~3297` (FrameScheduler.visual 30Hz) | `scene.add(mesh)` in constructor | Unknown | `config.enabled` | LINK_PARTICLES (260) | **LIVE** - FrameScheduler.visual.layer |
| **WaveParticleEmitter_v1** | `WaveParticleEmitter_v1.js` | wave/emitter | `main.js:~3570` (`new WaveParticleEmitter_v1`) | NOT FOUND in main.js search | `init(renderer, scene)` adds to scene | Yes (maxParticlesPerFamily=2000) | None | Unknown | **UNKNOWN** - No update() found |
| **CascadeParticleEmissionBoost_Session118** | `CascadeParticleEmissionBoost_Session118.js` | cascade-boost | `main.js:~3522` via `setupCascadeParticleEmissionBoost()` | NOT FOUND in main.js | None visible | No | None | N/A | **LIKELY DEAD** - No update chain |
| **CascadeParticleColorTinting_Session119** | `CascadeParticleColorTinting_Session119.js` | cascade-tint | `main.js:~3539` via `setupCascadeParticleColorTinting()` | NOT FOUND in main.js | None visible | No | None | N/A | **LIKELY DEAD** - No update chain |
| **ParticleSemanticDensityAdapter_Session121** | `ParticleSemanticDensityAdapter_Session121.js` | density | NOT FOUND in main.js | NOT FOUND in main.js | None visible | No | None | N/A | **DEAD** - No instantiation |
| **ParticleCascadeFlowDeflection** | `ParticleCascadeFlowDeflection.js` | deflection | NOT FOUND in main.js | NOT FOUND in main.js | None visible | No | None | N/A | **DEAD** - No instantiation |
| **ParticleStreamCascadeAcceleration** | `ParticleStreamCascadeAcceleration.js` | acceleration | NOT FOUND in main.js | NOT FOUND in main.js | None visible | No | None | N/A | **DEAD** - No instantiation |
| **ParticleTrailSystem_Session122** | `ParticleTrailSystem_Session122.js` | trail | NOT FOUND in main.js | NOT FOUND in main.js | `scene.add(mesh)` in constructor | Unknown | None | Unknown | **DEAD** - No instantiation |
| **ParticleEmissionScaler** | `ParticleEmissionScaler.js` | scaler | NOT FOUND in main.js | NOT FOUND in main.js | None visible | No | None | N/A | **DEAD** - No instantiation |
| **CascadingRuptureSystem** | `CascadingRuptureSystem.js` | rupture | NOT FOUND in main.js | `CascadingRuptureSystem.js:~95` (visualEffects.forEach) | Unknown | Unknown | None | Unknown | **LIKELY DEAD** - No integration |
| **ResonanceCascadeVisualization_Session117B** | `ResonanceCascadeVisualization_Session117B.js` | cascade-wave | NOT FOUND in main.js | NOT FOUND in main.js | Unknown | Unknown | `config.enabled` | Unknown | **DEAD** - No instantiation |
| **CascadeResonanceWaveVisualization_Session146** | `CascadeResonanceWaveVisualization_Session146.js` | cascade-wave | NOT FOUND in main.js | NOT FOUND in main.js | Unknown | Unknown | Unknown | Unknown | **DEAD** - No instantiation |
| **LinkBeadSystem** | `LinkBeadSystem.js` | bead | NOT FOUND in main.js (legacy?) | `LinkRendererConduit.js:~350` (per-link update) | `scene.add()` per bead? | Unknown | `window.__DEBUG_LINK_PARTICLES__` | Unknown | **LIVE** - Via LinkRendererConduit |
| **LinkBeadTrailSystem** | `LinkBeadTrailSystem.js` | bead-trail | NOT FOUND in main.js | NOT FOUND in main.js | Unknown | Unknown | Unknown | Unknown | **DEAD** - No integration |
| **EnergyOrb** | `EnergyOrb.js` | orb | NOT FOUND in main.js | NOT FOUND in main.js | Unknown | Unknown | Unknown | Unknown | **DEAD** - No integration |
| **StressBasedParticleScaler_v1** | `StressBasedParticleScaler_v1.js` | scaler | NOT FOUND in main.js | NOT FOUND in main.js | None | No | None | N/A | **DEAD** - No integration |

---

## TOP 10 LIVE SYSTEMS (Visual Test Priority)

### 1. **CascadeParticleSystem_Session120** (Highest Priority)
**Call Chain:**
```
main.js:3611  → setupCascadeParticleSystem()
             → return new CascadeParticleSystem_Session120(...)
main.js:3297  → frameScheduler.register('visual', (dt) => {
                 this.cascadeParticleSystem.update(dt, this.time);
               }, 'visual.cascadeParticleSystem')
main.js:3875  → frameScheduler.tick(dt)  [30Hz visual layer]
```
**Status:** ✅ LIVE - Active in FrameScheduler.visual layer (30Hz)

### 2. **HealingParticleSystem_Session136**
**Call Chain:**
```
main.js:3626  → this.healingParticles = new HealingParticleSystem_Session136(...)
main.js:3327  → frameScheduler.register('visual', (dt) => {
                 this.healingParticles.update(dt, this.time, this.networkState, this.camera);
               }, 'visual.healingParticles')
main.js:3875  → frameScheduler.tick(dt)  [30Hz visual layer]
```
**Status:** ✅ LIVE - Active in FrameScheduler.visual layer (30Hz)

### 3. **LinkTrailParticleSystem**
**Call Chain:**
```
main.js:3632  → this.linkTrailParticles = new LinkTrailParticleSystem(...)
main.js:3315  → frameScheduler.register('visual', (dt) => {
                 this.linkTrailParticles.update(dt, this.time);
               }, 'visual.linkTrailParticles')
main.js:3875  → frameScheduler.tick(dt)  [30Hz visual layer]
```
**Status:** ✅ LIVE - Active in FrameScheduler.visual layer (30Hz)

### 4. **LinkSparkSystem** (Per-Link, Distributed)
**Call Chain:**
```
main.js:2467  → new LinkSparkSystem(this.scene, 60)
              → this.linkSparkSystems.set(result.userData.id, sparkSystem)
main.js:2472  → sparkSystem.getMesh()
              → this.scene.add(mesh)  [per-link]
LinkRendererConduit.js:490  → sparkSystem.update(time, deltaTime, curve, stats, color)
                               [called per-link in updateAll()]
main.js:~2511  → LinkRendererConduit.updateAll(links, deltaTime, time)
                  [called in runRenderTick()]
```
**Status:** ✅ LIVE - Per-link system, updated via LinkRendererConduit

### 5. **LinkBeadSystem** (Embedded in LinkRendererConduit)
**Call Chain:**
```
LinkRendererConduit.js:350  → bead.update(deltaTime, curveLength)
                              [called per-link in updateAll()]
main.js:~2511  → LinkRendererConduit.updateAll(links, deltaTime, time)
                  [called in runRenderTick()]
```
**Status:** ✅ LIVE - Embedded per-link system

### 6. **WaveParticleEmitter_v1** (Uncertain Status)
**Call Chain:**
```
main.js:3570  → this.particleEmitter = new WaveParticleEmitter_v1({...})
main.js:3575  → this.particleEmitter?.init?.(this.renderer, this.scene)
⚠️ NO UPDATE() FOUND IN MAIN.JS
```
**Status:** ⚠️ UNCERTAIN - Initialized but no update() call found (may be manually triggered or dead)

### 7-10. **No Additional Confirmed Live Systems**
The remaining 6 systems are either dead or not integrated.

---

## PROBABLY DEAD / LEGACY / SNIPPET-ONLY SYSTEMS

### Definitely Dead (No instantiation in main.js)
1. **LinkCorruptionParticleSystem** - File exists, never instantiated
2. **LinkHealingParticleSystem** - Legacy version, replaced by Session136
3. **CascadeParticleEmissionBoost_Session118** - Created but no update() found
4. **CascadeParticleColorTinting_Session119** - Created but no update() found
5. **ParticleSemanticDensityAdapter_Session121** - Never instantiated
6. **ParticleCascadeFlowDeflection** - Never instantiated
7. **ParticleStreamCascadeAcceleration** - Never instantiated
8. **ParticleTrailSystem_Session122** - Never instantiated
9. **ParticleEmissionScaler** - Never instantiated
10. **ResonanceCascadeVisualization_Session117B** - Never instantiated
11. **CascadeResonanceWaveVisualization_Session146** - Never instantiated
12. **LinkBeadTrailSystem** - Never instantiated
13. **EnergyOrb** - Never instantiated
14. **StressBasedParticleScaler_v1** - Never instantiated

### Legacy Systems (Replaced by newer versions)
1. **LinkHealingParticleSystem** - Replaced by `HealingParticleSystem_Session136`
2. **ResonanceCascadeVisualization_Session117B** - May be replaced by Session146

---

## GLOBAL PARTICLE GUARDS & CONFIGS

### CONFIG-Based Guards
```javascript
// config.js
CONFIG.visuals.PARTICLE_BOUNDS_CHECK = false;  // Disabled by default
```

### Debug Guards
```javascript
// Used in multiple systems:
window.__DEBUG_LINK_PARTICLES__  // Controls debug logging in:
                                 // - LinkSparkSystem.js
                                 // - LinkBeadSystem.js
                                 // - LinkRendererConduit.js
                                 // - LinkSemanticPictogramSystem_Enhanced.js
```

### Visual Authority Guards
```javascript
// Via VisualHierarchyRegistry
VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES')  // 260
VisualHierarchyRegistry.getRenderOrder('LINK_SPARKS')    // 261
VisualHierarchyRegistry.getRenderOrder('LINK_PICTO')     // 258
VisualHierarchyRegistry.getRenderOrder('LINK_IMPACTS')   // 250
```

### Performance Guards
```javascript
// Throttled updates in AINodes.js
PARTICLE_UPDATE_INTERVAL = 0.033;  // 30Hz throttling
data.__particleUpdateAccumulator += deltaTime;
if (data.__particleUpdateAccumulator >= PARTICLE_UPDATE_INTERVAL) {
  // Update particles
}
```

### Config-Based Gating
```javascript
// NodeLinkingSystem.js
this.hoverGlowEnabled = CONFIG.visuals?.enableNodeHoverGlow === true;
if (!CONFIG.visuals?.enableNodeHoverGlow) return;
```

---

## FRAME SCHEDULER INTEGRATION

### Visual Layer (30Hz) - Confirmed Active
```javascript
frameScheduler.register('visual', (dt) => {
  this.cascadeParticleSystem.update(dt, this.time);
}, 'visual.cascadeParticleSystem');

frameScheduler.register('visual', (dt) => {
  this.healingParticles.update(dt, this.time, ...);
}, 'visual.healingParticles');

frameScheduler.register('visual', (dt) => {
  this.linkTrailParticles.update(dt, this.time);
}, 'visual.linkTrailParticles');
```

### Per-Link Update (Not FrameScheduler)
```javascript
// LinkRendererConduit handles per-link updates manually
LinkRendererConduit.updateAll(links, deltaTime, time) {
  for (const link of links) {
    sparkSystem.update(...);
    bead.update(...);
    // etc.
  }
}
```

---

## SUMMARY STATISTICS

| Metric | Count |
|--------|-------|
| **Total Systems Found** | 22 |
| **Confirmed Live** | 5 |
| **Uncertain Status** | 1 |
| **Dead/Legacy** | 16 |
| **FrameScheduler.visual (30Hz)** | 3 |
| **Per-Link (Manual)** | 2 |
| **With Pooling** | 4 |
| **With Debug Guards** | 4 |
| **Known renderOrder** | 3 |

---

## RECOMMENDATIONS FOR VISUAL TESTING

### Priority 1 (Must Test)
1. **CascadeParticleSystem_Session120** - Should show cascade particles on stressed links
2. **HealingParticleSystem_Session136** - Should show healing particles on harmonious links
3. **LinkTrailParticleSystem** - Should show organic trail particles

### Priority 2 (Should Test)
4. **LinkSparkSystem** - Should show sparks on high-traffic/synergy links (per-link)
5. **LinkBeadSystem** - Should show beads traveling along links

### Priority 3 (Investigate)
6. **WaveParticleEmitter_v1** - Check if actually working (no update() found)

---

## KEY FINDINGS

1. **FrameScheduler.visual is the primary driver** for 3 out of 5 live systems
2. **Per-link systems** (LinkSparkSystem, LinkBeadSystem) are updated via LinkRendererConduit
3. **Massive graveyard**: 16 out of 22 systems are dead or legacy
4. **No corruption particles** - LinkCorruptionParticleSystem is dead
5. **Debug guard is active**: `window.__DEBUG_LINK_PARTICLES__` exists in multiple systems
6. **Config guard is disabled**: `CONFIG.visuals.PARTICLE_BOUNDS_CHECK = false`
7. **Visual hierarchy is well-organized**: Clear renderOrder layers (250-261)

---

## AUDIT LIMITATIONS

- This is a static code analysis - some systems may be dynamically loaded
- Some systems may be manually triggered (not per-frame)
- WaveParticleEmitter_v1 update chain is unclear - may be event-driven
- Legacy systems may be referenced but not actively called