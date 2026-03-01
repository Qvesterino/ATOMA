# ATOMA Optimization Phase 1 - Implementation Plan
**Date:** 2026-03-01
**Objective:** Optimize per-frame operations in AINodes.update()
**Target:** Save ~0.5-1ms per frame

---

## 📊 CURRENT STATE

### Good News (Already Optimized)
1. ✅ **Guard optimization complete** - ~60-80% overhead removed (previous task)
2. ✅ **Early return in updateNodeVisuals()** - skips inactive nodes
3. ✅ **Activity model throttling** - SEMI_ACTIVE nodes throttled to ~10Hz
4. ✅ **Early return in EnhancedNodeModels.animate()** - skips inactive nodes
5. ✅ **AmbientEntityManager throttled** - interpretation at 4Hz, spawn cooldown 100ms

### Problems Identified

1. ❌ **Child traversal in EnhancedNodeModels.animate()**
   - Every frame: searches children for `innerRing`, `segmentedRing`, `spire`
   - Traversal cost: O(n) where n = child count
   - Solution: Cache references at spawn time

2. ❌ **Per-frame shell material updates**
   - `updateHologramShellMaterial()` called every frame
   - Updates shader uniforms even when not needed
   - Solution: Only update dirty materials

3. ❌ **Ring rotation loops**
   - Each node's rings are iterated and rotated per frame
   - Quaternion multiplication for each ring
   - Solution: Batch rotations or throttle to 30Hz

4. ❌ **Particle updates**
   - Each node's particles are updated per frame
   - Orbit angle calculation for each particle
   - Solution: Throttle to 30Hz

---

## 🎯 OPTIMIZATION PLAN

### OPTIMIZATION 1: Cache CONTROL_V2 References

**Problem:**
```javascript
// EnhancedNodeModels.animate() - EVERY FRAME
const coreGroup = controlV2Root.children.find(c => c.name === 'CORE_GROUP');  // TRAVERSE
const dominionGroup = controlV2Root.children.find(c => c.name === 'DOMINION_GROUP');  // TRAVERSE
if (!spire && coreGroup) {
  spire = coreGroup.children.find(c => c.name === 'AuthoritySpire');  // TRAVERSE
}
if (!innerRing && dominionGroup) {
  innerRing = dominionGroup.children.find(c => c.name === 'InnerRigidRing');  // TRAVERSE
}
if (!segmentedRing && dominionGroup) {
  segmentedRing = dominionGroup.children.find(c => c.name === 'OuterSegmentedRing');  // TRAVERSE
}
```

**Solution:**
Cache all references at spawn time:
```javascript
// At node creation (ONE TIME)
node.userData.controlV2InnerRing = coreGroup.children.find(c => c.name === 'InnerRigidRing');
node.userData.controlV2SegmentedRing = dominionGroup.children.find(c => c.name === 'OuterSegmentedRing');
node.userData.controlV2Spire = coreGroup.children.find(c => c.name === 'AuthoritySpire');

// In animate() (EVERY FRAME)
const innerRing = controlV2Root.userData.controlV2InnerRing;  // DIRECT ACCESS
const segmentedRing = controlV2Root.userData.controlV2SegmentedRing;  // DIRECT ACCESS
const spire = controlV2Root.userData.controlV2Spire;  // DIRECT ACCESS
```

**Expected savings:** ~0.2-0.3ms per frame (no traversal)

**Risk:** Low - references are stable

---

### OPTIMIZATION 2: Throttle Shell Material Updates

**Problem:**
```javascript
// updateNodeVisuals() - EVERY FRAME
node.traverse((child) => {
  if (child.isMesh && child.material.isShaderMaterial && child.userData.visualLayer === 'CORE_SHELL') {
    updateHologramShellMaterial(child.material, deltaTime);  // UPDATE EVERY FRAME
  }
});
```

**Solution:**
Only update dirty materials or throttle to 10Hz:
```javascript
// Track last update time
if (!child.userData.__lastShellUpdate) {
  child.userData.__lastShellUpdate = 0;
}

// Only update every 100ms (10Hz)
if (time * 1000 - child.userData.__lastShellUpdate >= 100) {
  updateHologramShellMaterial(child.material, deltaTime);
  child.userData.__lastShellUpdate = time * 1000;
}
```

**Expected savings:** ~0.1-0.2ms per frame

**Risk:** Low - shell material changes are subtle

---

### OPTIMIZATION 3: Throttle Ring Rotations

**Problem:**
```javascript
// updateNodeVisuals() - EVERY FRAME
data.vfxRings.forEach((ring) => {
  const quaternion = new THREE.Quaternion();  // ALLOCATION!
  quaternion.setFromAxisAngle(axis, rotAmount);
  ring.quaternion.multiplyQuaternions(quaternion, ring.quaternion);  // MULTIPLICATION
});
```

**Solution:**
Throttle to 30Hz:
```javascript
// Track last update time
if (!data.__lastRingUpdate) {
  data.__lastRingUpdate = 0;
}

// Only update every 33ms (30Hz)
if (time * 1000 - data.__lastRingUpdate >= 33) {
  data.vfxRings.forEach((ring) => {
    // Update ring rotation
  });
  data.__lastRingUpdate = time * 1000;
}
```

**Expected savings:** ~0.1-0.2ms per frame

**Risk:** Medium - ring rotation is visible, 30Hz should be smooth enough

---

### OPTIMIZATION 4: Throttle Particle Updates

**Problem:**
```javascript
// updateNodeVisuals() - EVERY FRAME
data.particles.forEach((particle) => {
  pData.orbitAngle += pData.orbitSpeed * deltaTime * orbitSpeedMod;  // CALCULATION
  // Update particle position...
});
```

**Solution:**
Throttle to 30Hz:
```javascript
// Track last update time
if (!data.__lastParticleUpdate) {
  data.__lastParticleUpdate = 0;
}

// Only update every 33ms (30Hz)
if (time * 1000 - data.__lastParticleUpdate >= 33) {
  data.particles.forEach((particle) => {
    // Update particle
  });
  data.__lastParticleUpdate = time * 1000;
}
```

**Expected savings:** ~0.1-0.2ms per frame

**Risk:** Low - particle motion is subtle, 30Hz should be fine

---

## 📈 EXPECTED TOTAL IMPROVEMENT

**Before Phase 1:** ~1-3ms per frame (AINodes.update())
**After Phase 1:** ~0.4-1.8ms per frame

**Total savings:** ~0.6-1.2ms per frame
**Improvement:** ~40-60% reduction in AINodes overhead

**Combined with guard optimization:** ~70-85% total reduction in per-frame overhead

---

## 🔄 IMPLEMENTATION STEPS

### Step 1: Cache CONTROL_V2 References
- File: `EnhancedNodeModels.js`
- Location: In node creation code (not animate())
- Action: Add reference caching to userData
- Risk: Low

### Step 2: Throttle Shell Material Updates
- File: `AINodes.js`
- Location: In `updateNodeVisuals()`
- Action: Add throttle check before `updateHologramShellMaterial()`
- Risk: Low

### Step 3: Throttle Ring Rotations
- File: `AINodes.js`
- Location: In `updateNodeVisuals()`
- Action: Add throttle check before ring rotation loop
- Risk: Medium

### Step 4: Throttle Particle Updates
- File: `AINodes.js`
- Location: In `updateNodeVisuals()`
- Action: Add throttle check before particle loop
- Risk: Low

---

## 🧪 TESTING PLAN

### Before Implementation
1. **Benchmark frame time** - measure AINodes.update() time
2. **Test visual quality** - verify rotations are smooth
3. **Test particle motion** - verify particles move smoothly

### After Implementation
1. **Benchmark frame time** - verify ~40-60% improvement
2. **Test visual quality** - verify no stutter at 30Hz
3. **Test particle motion** - verify no jitter at 30Hz
4. **Regressions check** - verify no visual glitches

---

## 🚀 READY TO IMPLEMENT

All optimizations identified and planned.
Ready for Phase 1 implementation.

**Proceed?** [YES] / [NO]
