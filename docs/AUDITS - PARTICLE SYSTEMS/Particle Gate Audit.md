# ATOMA Particle Gates Audit Report
## READ-ONLY ANALYSIS — NO CHANGES MADE

---

## COMPREHENSIVE GATE TABLE

| GateName | FilePath | Exact Condition | Affected Systems | Severity | How to Temporarily Bypass Safely |
|-----------|-----------|-----------------|------------------|----------|----------------------------------|
| **Enabled Flag** | HealingParticleSystem_Session136.js | `if (!this.enabled) return;` (line 135) | HealingParticleSystem (scar sparkles, trails) | hard-off | Set `system.enabled = true` in console: `world.healingParticles.enabled = true` |
| **Enabled Flag** | CascadeParticleSystem_Session120.js | `if (!this.config.enabled) return;` (line 195) | CascadeParticleSystem (link cascade particles) | hard-off | `world.cascadeParticles.config.enabled = true` |
| **Enabled Flag** | WaveParticleEmitter_v1.js | No explicit enabled flag in update, depends on init | WaveParticleEmitter (constructive, destructive, ripple particles) | hard-off | Ensure `init()` was called with valid scene/renderer |
| **Scene/Mesh Null Check** | HealingParticleSystem_Session136.js | `if (!this.enabled \|\| !this.mesh) return;` (line 135) | HealingParticleSystem | hard-off | Verify scene attachment: `scene.add(system.mesh)` |
| **LOD Distance Gate** | HealingParticleSystem_Session136.js | `if (dist > this.config.lodDistance) return;` (line 165) | HealingParticleSystem (scar sparkles) | cull | Set `system.config.lodDistance = 99999` or disable LOD |
| **Mesh Visibility Check** | HealingParticleSystem_Session136.js | `if (!scar.mesh \|\| !scar.mesh.mesh.visible) return;` (line 158) | HealingParticleSystem (scar sparkles) | hard-off | Force visible: `scar.mesh.mesh.visible = true` |
| **Frustum Culling** | HealingParticleSystem_Session136.js | `this.mesh.frustumCulled = false;` (line 107) | HealingParticleSystem | cull | Already disabled (good), but verify render order |
| **Pool Exhaustion** | WaveParticleEmitter_v1.js | `return null;` when pool full (line ~650) | WaveParticleEmitter (all 3 families) | budget | Increase `maxParticlesPerFamily` in config |
| **Emission Gate (Per-Node)** | WaveParticleEmitter_v1.js | `if (now - lastEmission < gateDelay) return;` (line ~380, ~420, ~460) | WaveParticleEmitter (constructive, destructive, ripples) | perf | Set `gateDelays` to 0 or very low values |
| **Wave Field Missing** | WaveParticleEmitter_v1.js | `if (!waveField) return;` (line ~340) | WaveParticleEmitter (all emission triggers) | hard-off | Ensure waveEngine is connected and nodes have waveField data |
| **Threshold Gates** | WaveParticleEmitter_v1.js | `if (constructive > 0.7)` / `if (destructive > 0.7)` / `if (standing > 0.65)` (lines ~350-370) | WaveParticleEmitter (all particle types) | gameplay | Lower thresholds: `system.config.constructiveThreshold = 0.1` |
| **Mesh Visibility** | LinkSparkSystem.js | `if (!this.points.visible) return;` (line ~120) | LinkSparkSystem (link sparks) | hard-off | `system.points.visible = true` |
| **Frustum Culling** | LinkSparkSystem.js | `this.points.frustumCulled = false;` (line ~45) | LinkSparkSystem | cull | Already disabled, verify renderOrder is correct |
| **Max Particles** | LinkBeadTrailSystem.js | Circular buffer with `this.maxParticles` (line 20) | LinkBeadTrailSystem (bead trails) | budget | Increase maxParticles in constructor |
| **Config Enabled** | CascadeParticleEmissionBoost_Session118.js | `this.enabled = false;` (line ~60) | CascadeParticleEmissionBoost | hard-off | `system.enabled = true` |
| **Config Enabled** | CascadeParticleColorTinting_Session119.js | `this.enabled = false;` (line ~50) | CascadeParticleColorTinting | hard-off | `system.enabled = true` |
| **LowFX Mode** | FXPerformanceController_v1.js | `lowFXMultipliers.vfxIntensity = 0.3` (line ~60) | All VFX when LowFX ON | perf | `perfCtrl.setLowFX(false)` |
| **LowFX Mode** | FXPerformanceController_v1.js | `lowFXMultipliers.shaderIntensity = 0.25` (line ~60) | All shader-based particles when LowFX ON | perf | `perfCtrl.setLowFX(false)` |
| **Aura LOD Culling** | AuraLODCulling.js | `if (distance > threshold) { aura.visible = false; }` (line ~85) | Node auras (not particles directly, but affects scene) | cull | `window.debugAuraLOD.setThreshold(999)` |
| **Instability Suppression** | LinkDirectionalStreaks.js | `if (streaks.suppressed[i]) opacity = 0;` (line ~180) | LinkDirectionalStreaks | gameplay | Set instability to 0 or disable suppression |
| **FrameScheduler Gate** | Multiple systems | `if (!this.frameScheduler?.shouldRunVisual?.()) return;` | Harmonic systems (HubAura, InfluencePropagation, ResonanceCoupling) | perf | Temporarily disable: `frameScheduler.forceRun = true` |

---

## TOP 5 CRITICAL GATES (Most Likely to Cause Invisible Particles)

### 1. **FXPerformanceController LowFX Mode** 🚨 CRITICAL
**File:** `FXPerformanceController_v1.js`  
**Line:** 57-62  
**Condition:** When `lowFX = true`, `vfxIntensity` is reduced to **0.3 (70% reduction)** and `shaderIntensity` to **0.25 (75% reduction)**  
**Why:** This is a **global multiplier** that affects ALL particle systems. When activated, particles may appear extremely dim or invisible.  
**Call Chain:** `main.js` → `FXPerformanceController` → `FXPerformanceScaler` → Individual particle systems  
**Bypass:** 
```javascript
perfCtrl.setLowFX(false);  // Full quality
// Or verify current state:
console.log('LowFX Active:', perfCtrl.isLowFX());
console.log('VFX Multiplier:', perfCtrl.getMultiplier('vfxIntensity'));
```

---

### 2. **HealingParticleSystem LOD Gate** 🚨 CRITICAL
**File:** `HealingParticleSystem_Session136.js`  
**Line:** 158-165  
**Conditions:**
```javascript
if (!scar.mesh || !scar.mesh.mesh.visible) return;  // Line 158
const dist = camera.position.distanceTo(scar.mesh.mesh.position);
if (dist > this.config.lodDistance) return;  // Line 165
```
**Default LOD:** 100 units  
**Why:** This system emits sparkles from resonance scars. If scars are invisible OR camera is far away, **no particles spawn at all**.  
**Call Chain:** `FrameScheduler` → `HealingParticleSystem.update()` → `_processScars()` → LOD check → `_emitScarSparkle()`  
**Bypass:**
```javascript
// Disable LOD
world.healingParticles.config.lodDistance = 99999;
// Force scar meshes visible
world.resonanceRupture.resonanceScars.forEach(scar => {
  if (scar.mesh) scar.mesh.mesh.visible = true;
});
```

---

### 3. **WaveParticleEmitter Emission Gates** 🚨 CRITICAL
**File:** `WaveParticleEmitter_v1.js`  
**Lines:** 340-370, 380-470  
**Conditions:**
1. **Wave field missing:** `if (!waveField) return;` (line ~340)
2. **Threshold gates:** 
   - `constructive > 0.7` (constructive bursts)
   - `destructive > 0.7` (chaos sparks)
   - `standing > 0.65` (ripple rings)
3. **Per-node emission delays:** 60-120ms per gate
**Why:** This is the **main particle system** for wave-reactive effects. If wave data is missing OR thresholds are too high, **zero particles emit**.  
**Call Chain:** `FrameScheduler` → `WaveParticleEmitter.update()` → `_processNodeWaveEvents()` → threshold checks → emission  
**Bypass:**
```javascript
// Lower thresholds to 0
world.waveEmitter.config.constructiveThreshold = 0;
world.waveEmitter.config.destructiveThreshold = 0;
world.waveEmitter.config.standingWaveThreshold = 0;
// Remove emission delays
Object.values(world.waveEmitter.gateDelays).forEach((delay, key) => {
  world.waveEmitter.gateDelays[key] = 0;
});
```

---

### 4. **CascadeParticleSystem Enabled Flag** 🚨 CRITICAL
**File:** `CascadeParticleSystem_Session120.js`  
**Line:** 195  
**Condition:** `if (!this.config.enabled) return;`  
**Why:** This is a **hard-off gate**. If enabled is false, the entire update loop exits immediately. The system must be explicitly enabled during initialization.  
**Call Chain:** `FrameScheduler` → `CascadeParticleSystem.update()` → enabled check → particle update  
**Bypass:**
```javascript
world.cascadeParticles.config.enabled = true;
// Also verify init was called:
console.log('Mesh exists:', !!world.cascadeParticles.mesh);
console.log('Scene has mesh:', world.scene.children.includes(world.cascadeParticles.mesh));
```

---

### 5. **LinkSparkSystem Mesh Visibility** 🚨 CRITICAL
**File:** `LinkSparkSystem.js`  
**Line:** ~120  
**Condition:** `if (!this.points.visible) return;`  
**Why:** Spark particles use `THREE.Points`. Even if the system is active and particles are spawned, **if the mesh is not visible, nothing renders**. This is a common issue after scene reloads or system restarts.  
**Call Chain:** `FrameScheduler` → `LinkSparkSystem.update()` → visible check → render  
**Bypass:**
```javascript
world.linkSparkSystem.points.visible = true;
// Verify frustum culling is disabled:
console.log('Frustum culled:', world.linkSparkSystem.points.frustumCulled);
// Verify render order:
console.log('Render order:', world.linkSparkSystem.points.renderOrder);
```

---

## ADDITIONAL FINDINGS

### Silent Suppress Patterns (No Error Logs)

1. **Pool Exhaustion** (`WaveParticleEmitter_v1.js` line ~650)
   - When particle pool is full, `_allocateParticle()` returns null
   - System logs warning in debug mode only
   - Effect: Particles silently stop spawning

2. **Emission Rate Throttling** (`HealingParticleSystem_Session136.js` line ~142)
   - `emissionRate = sparkleRate * (1.0 + harmony * 0.5) * (1.0 - corruption)`
   - High corruption can reduce emission rate to near-zero
   - Effect: Particles appear sparse or missing

3. **LOD Opacity Suppression** (Multiple harmonic systems)
   - `HarmonicHubAuraSystem_Session126`: `opacity *= this.config.lodOpacitySuppression` (default 0.5)
   - `HarmonicInfluencePropagationSystem_Session127`: Similar suppression
   - Effect: Particles render but are very dim (50% opacity or less)

### Global Visual Kill Switches Found

1. **FXPerformanceController** - Reduces all VFX to 30% when LowFX ON
2. **EventVisualSuppression_v1** - Redirects event intensity to aura modulation
3. **AuraLODCulling** - Can hide all auras (affects overall scene visibility)
4. **FrameScheduler** - `shouldRunVisual()` can skip visual updates entirely

### Missing Gates (Not Found)

- No explicit `ENABLE_PARTICLES` or `ENABLE_SPARKS` config flags
- No global `DISABLE_FX` constant
- No `FX_BUDGET` enforcement at global level (per-system only)
- No `VISUAL_LOCK` system specifically for particles

---

## RECOMMENDED DIAGNOSTIC SEQUENCE

If particles are not visible, check in this order:

1. **Check LowFX mode:**
   ```javascript
   perfCtrl.isLowFX()
   perfCtrl.getMultiplier('vfxIntensity')
   ```

2. **Check system enabled flags:**
   ```javascript
   world.healingParticles.enabled
   world.cascadeParticles.config.enabled
   world.waveEmitter.mesh  // Should not be null
   ```

3. **Check LOD distances:**
   ```javascript
   world.healingParticles.config.lodDistance
   window.debugAuraLOD?.getConfig()?.distanceThreshold
   ```

4. **Check mesh visibility:**
   ```javascript
   world.healingParticles.mesh.visible
   world.linkSparkSystem.points.visible
   world.cascadeParticles.mesh.visible
   ```

5. **Check particle pool status:**
   ```javascript
   world.waveEmitter.activeCount.constructiveBurst
   world.waveEmitter.activeCount.destructiveChaos
   world.waveEmitter.activeCount.standingWaveRipple
   ```

6. **Check thresholds (for wave emitter):**
   ```javascript
   world.waveEmitter.config.constructiveThreshold
   world.waveEmitter.config.destructiveThreshold
   world.waveEmitter.config.standingWaveThreshold
   ```

---

## END OF REPORT

**Scope:** Particle/spark/trail/healing/corruption/cascade/wave emitter systems and their init/update paths  
**Method:** Read-only code audit, no changes made  
**Date:** 2026-03-05  
**Mode:** ACT MODE