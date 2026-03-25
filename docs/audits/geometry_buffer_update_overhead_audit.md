# GEOMETRY/BUFFER UPDATE OVERHEAD AUDIT

**Audit Date:** 2026-03-25  
**Scope:** Static analysis of geometry and shader attribute updates  
**Objective:** Identify systems that perform unconditional `.needsUpdate = true` on geometry attributes every frame without dirty flags or change detection

---

## EXECUTIVE SUMMARY

**Total Systems Analyzed:** 9  
**Systems with Problems:** 6  
**Critical Issues:** 6  
**Systems with Proper Dirty Flags:** 3

**Impact Assessment:**
- Multiple systems upload entire buffers to GPU every frame (60Hz)
- No change detection means buffers are re-uploaded even when unchanged
- This creates unnecessary GPU bandwidth usage and CPU overhead
- Estimated performance impact: Significant on systems with many active particles

---

## PROBLEMATIC SYSTEMS

### 1. CascadeParticleSystem_Session120.js ⚠️ CRITICAL

**Type:** Points  
**Geometry Type:** BufferGeometry (cascade particles)

**Issues Found:**
```javascript
// Line ~1200+ in _updateParticleSystem()
geometry.attributes.position.needsUpdate = true;
geometry.attributes.velocity.needsUpdate = true;
geometry.attributes.color.needsUpdate = true;
geometry.attributes.alpha.needsUpdate = true;
geometry.attributes.size.needsUpdate = true;
```

**Problem:**
- All attributes updated **unconditionally** every frame
- No dirty flag or change detection
- Called inside update() loop running at simulation frequency
- Buffer size: 2000-4000 particles per system
- Multiple particle families (constructive, destructive, standing wave)

**Severity:** HIGH - Updates every frame even when no particles are active or changed

---

### 2. LinkRendererConduit.js ⚠️ CRITICAL

**Type:** Multiple particle systems (Points, InstancedMesh)  
**Geometry Type:** BufferGeometry

**Issues Found:**
Multiple particle systems with same pattern:

```javascript
// System 1: Cascade particles
geometry.attributes.position.needsUpdate = true;
geometry.attributes.color.needsUpdate = true;
geometry.attributes.alpha.needsUpdate = true;
geometry.attributes.size.needsUpdate = true;

// System 2: Corruption particles
geometry.attributes.position.needsUpdate = true;
geometry.attributes.color.needsUpdate = true;
geometry.attributes.alpha.needsUpdate = true;
geometry.attributes.size.needsUpdate = true;

// System 3: Healing particles
geometry.attributes.position.needsUpdate = true;
geometry.attributes.color.needsUpdate = true;
geometry.attributes.alpha.needsUpdate = true;
geometry.attributes.size.needsUpdate = true;
```

**Problem:**
- 3 separate particle systems all updating unconditionally
- No dirty flags
- Called every frame in update() loop
- Each system has 500-2000 particles
- Total potential: 6000+ particles updated every frame

**Severity:** HIGH - Multiple systems, high particle count, unconditional updates

---

### 3. LinkCorruptionParticleSystem.js ⚠️ CRITICAL

**Type:** Points  
**Geometry Type:** BufferGeometry

**Issues Found:**
```javascript
// In update() loop
geometry.attributes.position.needsUpdate = true;
geometry.attributes.velocity.needsUpdate = true;
geometry.attributes.color.needsUpdate = true;
geometry.attributes.alpha.needsUpdate = true;
geometry.attributes.size.needsUpdate = true;
```

**Problem:**
- All attributes updated unconditionally every frame
- No dirty flag or change detection
- Called inside per-frame update loop
- Buffer size: 500-1000 particles

**Severity:** HIGH - Unconditional updates every frame

---

### 4. LinkHealingParticleSystem.js ⚠️ CRITICAL

**Type:** Points  
**Geometry Type:** BufferGeometry

**Issues Found:**
```javascript
// In update() loop
geometry.attributes.position.needsUpdate = true;
geometry.attributes.velocity.needsUpdate = true;
geometry.attributes.color.needsUpdate = true;
geometry.attributes.alpha.needsUpdate = true;
geometry.attributes.size.needsUpdate = true;
```

**Problem:**
- All attributes updated unconditionally every frame
- No dirty flag or change detection
- Called inside per-frame update loop
- Buffer size: 500-1000 particles

**Severity:** HIGH - Unconditional updates every frame

---

### 5. WaveParticleEmitter_v1.js ⚠️ CRITICAL

**Type:** Points  
**Geometry Type:** BufferGeometry

**Issues Found:**
```javascript
// Line ~1050+ in _updateParticleSystem()
geometry.attributes.position.needsUpdate = true;
geometry.attributes.color.needsUpdate = true;
geometry.attributes.alpha.needsUpdate = true;
geometry.attributes.scale.needsUpdate = true;
```

**Problem:**
- All attributes updated unconditionally every frame
- No dirty flag or change detection
- Called inside per-frame update loop for 5 separate particle systems:
  - constructiveBurst
  - constructiveBurstVariantB
  - constructiveBurstVariantC
  - destructiveChaos
  - standingWaveRipple
- Each system: 2000 particles
- Total: 10,000 particles updated every frame

**Severity:** CRITICAL - Highest particle count, 5 systems, all updating unconditionally

---

### 6. HealingParticleSystem_Session136.js ⚠️ CRITICAL

**Type:** Points  
**Geometry Type:** BufferGeometry

**Issues Found:**
```javascript
// In spawnParticle() - called multiple times per frame
this.geometry.attributes.position.needsUpdate = true;
this.geometry.attributes.velocity.needsUpdate = true;
this.geometry.attributes.color.needsUpdate = true;
this.geometry.attributes.birthTime.needsUpdate = true;
this.geometry.attributes.lifetime.needsUpdate = true;
this.geometry.attributes.size.needsUpdate = true;
```

**Problem:**
- All attributes updated on **every spawn**
- spawnParticle() can be called multiple times per frame (up to 20 particles per burst)
- No dirty flag or accumulation
- Each spawn triggers full buffer upload
- Buffer size: 5000 particles

**Severity:** HIGH - Multiple uploads per frame

---

## SYSTEMS WITH PROPER IMPLEMENTATION ✅

### 7. LinkBeadTrailSystem.js ✅ GOOD

**Implementation:**
```javascript
let updateStart = -1;
let updateEnd = -1;

// Only set if particles were spawned
if (updateStart !== -1) {
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.aVelocity.needsUpdate = true;
    this.mesh.geometry.attributes.aDir.needsUpdate = true;
    this.mesh.geometry.attributes.aColor.needsUpdate = true;
    this.mesh.geometry.attributes.aInfo.needsUpdate = true;
}
```

**Verdict:** Proper dirty flag implementation - only updates when particles spawned

---

### 8. LinkSparkSystem.js ✅ GOOD

**Implementation:**
```javascript
// Only updates in spawnBurst() method
// Not called every frame, only when spawning
aSpawnTime.needsUpdate = true;
aLifeTime.needsUpdate = true;
aT.needsUpdate = true;
aAngle.needsUpdate = true;
aSpeed.needsUpdate = true;
aSize.needsUpdate = true;
geo.attributes.position.needsUpdate = true;
```

**Verdict:** Updates only when spawning, not unconditional per-frame

---

### 9. LinkPulseDustEmitter.js ✅ GOOD

**Implementation:**
```javascript
let touched = false;

// Only set if particles were spawned
if (touched) {
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.aVelocity.needsUpdate = true;
    this.mesh.geometry.attributes.aColor.needsUpdate = true;
    this.mesh.geometry.attributes.aInfo.needsUpdate = true;
}
```

**Verdict:** Proper dirty flag implementation - only updates when particles spawned

---

## RECOMMENDATIONS

### Immediate Actions (High Priority)

1. **Implement Dirty Flags Pattern**
   - Add boolean flags for each attribute: `positionDirty`, `colorDirty`, etc.
   - Only set `needsUpdate = true` when actual changes occurred
   - Reset dirty flags after GPU upload

2. **Change Detection**
   - Compare previous and current values before marking dirty
   - Use `needsUpdate = true` only when buffer actually changed

3. **Optimize WaveParticleEmitter_v1**
   - Highest priority (5 systems, 10,000 particles)
   - Implement per-system dirty flags
   - Consider batch updates across systems

### Example Fix Pattern

```javascript
// BAD (current)
_updateParticleSystem() {
    // ... update particles ...
    geometry.attributes.position.needsUpdate = true; // Always true
    geometry.attributes.color.needsUpdate = true;    // Always true
}

// GOOD (recommended)
_updateParticleSystem() {
    let positionDirty = false;
    let colorDirty = false;
    
    // ... update particles ...
    for (let i = 0; i < activeCount; i++) {
        // Only mark dirty if actually changed
        if (positionsChanged) {
            positions[i] = newPosition;
            positionDirty = true;
        }
        if (colorsChanged) {
            colors[i] = newColor;
            colorDirty = true;
        }
    }
    
    // Only upload if dirty
    if (positionDirty) geometry.attributes.position.needsUpdate = true;
    if (colorDirty) geometry.attributes.color.needsUpdate = true;
}
```

### Performance Impact Estimate

**Current State (Problematic Systems):**
- 6 systems × 60 Hz = 360 buffer uploads per second
- Total particles: ~15,000+
- Estimated GPU bandwidth: 100-200 MB/s wasted

**With Optimizations:**
- Only upload when particles spawn or change
- Estimated reduction: 80-95% fewer uploads
- Significant CPU-GPU bandwidth savings

---

## SUMMARY TABLE

| System | Geometry Type | Particles | Updates | Dirty Flag | Severity |
|--------|---------------|-----------|---------|------------|----------|
| CascadeParticleSystem_Session120.js | Points | 2000-4000 | Every frame | ❌ No | HIGH |
| LinkRendererConduit.js | Points (3×) | 6000+ | Every frame | ❌ No | HIGH |
| LinkCorruptionParticleSystem.js | Points | 500-1000 | Every frame | ❌ No | HIGH |
| LinkHealingParticleSystem.js | Points | 500-1000 | Every frame | ❌ No | HIGH |
| WaveParticleEmitter_v1.js | Points (5×) | 10,000 | Every frame | ❌ No | CRITICAL |
| HealingParticleSystem_Session136.js | Points | 5000 | Every spawn | ❌ No | HIGH |
| LinkBeadTrailSystem.js | Points | 600 | On spawn | ✅ Yes | GOOD |
| LinkSparkSystem.js | Points | 60 | On spawn | ✅ Yes | GOOD |
| LinkPulseDustEmitter.js | Points | 160 | On spawn | ✅ Yes | GOOD |

---

## CONCLUSION

**6 out of 9 systems have critical buffer update overhead issues.**

The pattern is clear: systems are updating entire buffers to GPU every frame (60Hz) without checking if data actually changed. This creates unnecessary CPU-GPU bandwidth usage and can impact performance, especially on lower-end hardware.

**Priority Order for Fixes:**
1. WaveParticleEmitter_v1.js (CRITICAL - highest particle count)
2. LinkRendererConduit.js (HIGH - multiple systems)
3. CascadeParticleSystem_Session120.js (HIGH)
4. LinkCorruptionParticleSystem.js (HIGH)
5. LinkHealingParticleSystem.js (HIGH)
6. HealingParticleSystem_Session136.js (HIGH - multiple spawns per frame)

**Pattern to Follow:**
- LinkBeadTrailSystem.js
- LinkSparkSystem.js
- LinkPulseDustEmitter.js

These three systems demonstrate proper implementation with dirty flags and conditional updates.