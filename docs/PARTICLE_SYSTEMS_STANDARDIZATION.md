# Particle Systems Standardization Architecture

**Date:** 2026-03-06  
**Purpose:** Document working pattern from LinkSparkSystem and apply to all particle systems

---

## Working Pattern: LinkSparkSystem ✅

### Architecture
**Type:** GPU-based particle system (THREE.Points + ShaderMaterial)

### Pattern

#### 1. Constructor
```javascript
export class LinkSparkSystem {
    constructor(scene, maxSparks = 60) {
        this.scene = scene;
        this.maxSparks = maxSparks;
        
        // Configuration
        this.config = {
            baseColor: new THREE.Color(0xffaa00),
            baseOpacity: 0.0,
            thickness: 0.05
        };
        
        // Initialize
        this.initSystem();
    }
}
```

#### 2. initSystem()
```javascript
initSystem() {
    // Attributes
    const spawnTimes = new Float32Array(this.maxSparks);
    const lifeTimes = new Float32Array(this.maxSparks);
    const tValues = new Float32Array(this.maxSparks);
    const angles = new Float32Array(this.maxSparks);
    const speeds = new Float32Array(this.maxSparks);
    const sizes = new Float32Array(this.maxSparks);
    
    // Initialize with negative spawn times (inactive)
    for(let i=0; i<this.maxSparks; i++) {
        spawnTimes[i] = -100.0;
    }
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxSparks * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    geometry.setAttribute('aSpawnTime', new THREE.BufferAttribute(spawnTimes, 1));
    geometry.setAttribute('aLifeTime', new THREE.BufferAttribute(lifeTimes, 1));
    geometry.setAttribute('aT', new THREE.BufferAttribute(tValues, 1));
    geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    
    this.geometry = geometry;
    
    // Uniforms
    this.uniforms = {
        uTime: { value: 0 },
        uStart: { value: new THREE.Vector3() },
        uMid: { value: new THREE.Vector3() },
        uEnd: { value: new THREE.Vector3() },
        uThickness: { value: 0.6 },
        uPulse: { value: 0 },
        uColor: { value: new THREE.Color(0xffaa00) },
        uOpacity: { value: 0.0 }
    };
    
    // ShaderMaterial
    const material = new THREE.ShaderMaterial({
        vertexShader: SPARK_VS,
        fragmentShader: SPARK_FS,
        uniforms: this.uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
    });
    
    this.material = material;
    
    // Create mesh
    this.mesh = new THREE.Points(geometry, material);
    this.scene.add(this.mesh);
}
```

#### 3. update()
```javascript
update(time, deltaTime, curve, params, color) {
    // Update uniforms
    this.uniforms.uTime.value = time;
    this.uniforms.uStart.value.copy(curve.getPoint(0));
    this.uniforms.uMid.value.copy(curve.getPoint(0.5));
    this.uniforms.uEnd.value.copy(curve.getPoint(1));
    this.uniforms.uColor.value.copy(color);
    this.uniforms.uOpacity.value = params.intensity;
    
    // Emit particles based on params
    this._emitParticles(deltaTime, params.synergy, params.traffic);
}
```

#### 4. dispose()
```javascript
dispose() {
    if (this.mesh) {
        this.scene.remove(this.mesh);
    }
    if (this.geometry) {
        this.geometry.dispose();
    }
    if (this.material) {
        this.material.dispose();
    }
}
```

#### 5. getMesh()
```javascript
getMesh() {
    return this.mesh;
}
```

---

## Standard Pattern for All Systems

### Phase 1: Construction

```javascript
export class ParticleSystem {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { /* defaults */ };
        this.initSystem();
    }
}
```

### Phase 2: Initialization

```javascript
initSystem() {
    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    
    // Create material
    this.material = new THREE.Material({ /* config */ });
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
    
    // Store uniform references for fast updates
    this.uniforms = material.uniforms || {};
}
```

### Phase 3: Update

```javascript
update(time, deltaTime, curve, params, color) {
    // Update uniforms
    this.uniforms.uTime.value = time;
    this.uniforms.uColor.value.copy(color);
    
    // Emit/update particles
    this._updateParticles(deltaTime, curve, params);
}
```

### Phase 4: Cleanup

```javascript
dispose() {
    if (this.mesh?.parent) {
        this.mesh.parent.remove(this.mesh);
    }
    this.geometry?.dispose();
    this.material?.dispose();
}

getMesh() {
    return this.mesh;
}
```

---

## Integration Pattern for LinkRendererConduit

### 1. Initialize System in Constructor

```javascript
constructor(scene, camera, renderer, selectionCore = null, linkingSystem = null, allNodes = null) {
    this.scene = scene;
    this.camera = camera;
    
    // Particle systems
    this.sparks = null;
    this.trails = null;
    this.healing = null;
    this.corruption = null;
}
```

### 2. Enable/Disable Modules

```javascript
this.modules = {
    thickness: true,
    flow: true,
    beads: true,
    sparks: true,
    trails: true,      // ← ADD THIS
    healingFX: true,  // ← EXISTS
    corruptionFX: true  // ← ADD THIS
};
```

### 3. Create in createLinkVisuals()

```javascript
createLinkVisuals(link) {
    const group = new THREE.Group();
    const state = group.userData.conduitState = {};
    
    // ... existing code ...
    
    // ADD: Trail particles
    if (LinkTrailParticleSystem && !this.trails) {
        this.trails = new LinkTrailParticleSystem(this.scene, 200);
        console.log('[LinkRendererConduit] LinkTrailParticleSystem created');
    }
    
    // ADD: Healing particles
    if (LinkHealingParticleSystem && !this.healing) {
        this.healing = new LinkHealingParticleSystem(this.scene, 250);
        console.log('[LinkRendererConduit] LinkHealingParticleSystem created');
    }
    
    // ADD: Corruption particles
    if (LinkCorruptionParticleSystem && !this.corruption) {
        this.corruption = new LinkCorruptionParticleSystem(this.scene);
        console.log('[LinkRendererConduit] LinkCorruptionParticleSystem created');
    }
    
    // ADD: Create emitters for this link
    if (this.trails) {
        state.trails = new LinkTrailEmitter(link, this.trails);
        console.log('[LinkRendererConduit] LinkTrailEmitter created for link:', link.id);
    }
    
    if (this.healing) {
        state.healing = new LinkHealingEmitter(link, this.healing);
        console.log('[LinkRendererConduit] LinkHealingEmitter created for link:', link.id);
    }
    
    if (this.corruption) {
        state.corruption = this.corruption.create(link, link.curve);
        console.log('[LinkRendererConduit] LinkCorruption created for link:', link.id);
    }
    
    return group;
}
```

### 4. Update in update()

```javascript
update(link, deltaTime, time, frameStateOverride = null) {
    const visualTime = frameStateOverride?.time?.visualTime ?? VisualTime.now;
    const visualDelta = frameStateOverride?.time?.visualDelta ?? VisualTime.delta;
    const metrics = frameStateOverride?.metrics ?? this._readLinkMetrics(link);
    const frameState = frameStateOverride || {
        time: { visualTime, visualDelta, deltaTime, time },
        metrics
    };
    
    const state = link.group.userData.conduitState;
    if (!state) {
        return;
    }
    
    // ... existing code ...
    
    // ADD: Update trail particles
    if (state.trails && this.modules.trails && mainCurve) {
        const stats = {
            harmony: vfx.harmony ?? 0.5,
            corruption: vfx.corruption ?? 0.2
        };
        state.trails.update(visualDelta, visualTime, mainCurve, linkDirection, stats.harmony, stats.corruption);
    }
    
    // ADD: Update healing particles
    if (state.healing && this.modules.healingFX && mainCurve) {
        const linkHarmony = metrics.harmony ?? 0.5;
        const linkCorruption = metrics.corruption ?? 0.2;
        state.healing.update(visualDelta, visualTime, mainCurve, linkDirection, linkHarmony, linkCorruption);
    }
    
    // ADD: Update corruption particles
    if (state.corruption && this.modules.corruptionFX && mainCurve) {
        const corruptionLevel = metrics.corruption ?? 0.2;
        this.corruption.update(link, visualDelta, time, corruptionLevel);
    }
}
```

### 5. Dispose in disposeLinkVisuals()

```javascript
disposeLinkVisuals(linkGroup, link = null) {
    const state = linkGroup?.userData?.conduitState;
    if (!state) return;
    
    // ... existing disposal ...
    
    // ADD: Dispose emitters
    if (state.trails) {
        state.trails.disable();
    }
    
    if (state.healing) {
        state.healing.disable();
    }
    
    if (state.corruption) {
        this.corruption.disposeLink(link);
    }
}
```

---

## System-Specific Notes

### LinkTrailParticleSystem (Existing)
- **Pattern:** CPU-based particle pool + per-link emitter
- **API:** `emitAlongLink(link, curve, linkDirection, emissionRate, time, harmony, corruption)`
- **Update:** `LinkTrailEmitter.update(deltaTime, time, curve, linkDirection, harmony, corruption)`

### LinkHealingParticleSystem (Existing)
- **Pattern:** CPU-based particle pool + per-link emitter (backwards flow)
- **API:** `emitBackwardsAlongLink(link, curve, linkDirection, emissionRate, time, harmony)`
- **Update:** `LinkHealingEmitter.update(deltaTime, time, curve, linkDirection, harmony, corruption)`

### LinkCorruptionParticleSystem (Needs Standardization)
- **Pattern:** CPU-based per-link state management
- **Current API:** `create(link, corruptionLevel)` + `update(link, deltaTime, corruptionLevel)`
- **Needs:** Standard emitter pattern or conform to existing API

---

## Implementation Checklist

- [ ] Add `trails: true` to `this.modules`
- [ ] Add `corruptionFX: true` to `this.modules`
- [ ] Initialize LinkTrailParticleSystem in constructor
- [ ] Initialize LinkCorruptionParticleSystem in constructor
- [ ] Create LinkTrailEmitter in `createLinkVisuals()`
- [ ] Create LinkHealingEmitter in `createLinkVisuals()`
- [ ] Create LinkCorruption state in `createLinkVisuals()`
- [ ] Update LinkTrailEmitter in `update()`
- [ ] Update LinkHealingEmitter in `update()`
- [ ] Update LinkCorruption in `update()`
- [ ] Dispose LinkTrailEmitter in `disposeLinkVisuals()`
- [ ] Dispose LinkHealingEmitter in `disposeLinkVisuals()`
- [ ] Dispose LinkCorruption in `disposeLinkVisuals()`
- [ ] Test particle visibility for all three systems

---

## Success Criteria

### LinkTrailParticleSystem
- ✅ Particles visible on all links
- ✅ Particles flow along curves
- ✅ Emission rate modulated by harmony/corruption
- ✅ Particles fade in/out smoothly
- ✅ Memory efficient (particle pool reuse)

### LinkHealingParticleSystem
- ✅ Particles visible when harmony > threshold
- ✅ Particles flow backwards (target → source)
- ✅ Blue/cyan healing colors
- ✅ Emission rate modulated by harmony
- ✅ Particles fade in/out smoothly

### LinkCorruptionParticleSystem
- ✅ Particles visible when corruption > threshold
- ✅ Particles flow forward (source → target)
- ✅ Red/orange corruption colors
- ✅ Emission rate modulated by corruption
- ✅ Particles fade in/out smoothly

---

## Debug Commands

```javascript
// Check all systems are initialized
window.game.conduitRenderer.trails    // Should be LinkTrailParticleSystem
window.game.conduitRenderer.healing  // Should be LinkHealingParticleSystem
window.game.conduitRenderer.corruption // Should be LinkCorruptionParticleSystem

// Check modules are enabled
window.game.conduitRenderer.modules.trails       // Should be true
window.game.conduitRenderer.modules.healingFX   // Should be true
window.game.conduitRenderer.modules.corruptionFX // Should be true

// Check emitters for a link
const link = window.game.linkingSystem.links[0];
const state = link.group.userData.conduitState;
state.trails      // Should be LinkTrailEmitter
state.healing     // Should be LinkHealingEmitter
state.corruption   // Should be corruption state object

// Test manual emission
state.trails?.update(0.016, window.game.time, link.curve, linkDir, 0.5, 0.2);
state.healing?.update(0.016, window.game.time, link.curve, linkDir, 0.8, 0.1);
```

---

## Summary

This architecture provides:
1. **Consistent pattern** across all particle systems
2. **GPU or CPU** choice based on system needs
3. **Per-link or global** management based on emission pattern
4. **Module toggles** for easy debugging
5. **Standardized API** for integration with LinkRendererConduit

**Key Principle:** Follow the LinkSparkSystem working pattern for all systems.
