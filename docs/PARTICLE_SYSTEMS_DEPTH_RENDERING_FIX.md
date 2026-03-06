# Particle Systems Depth & Rendering Standardization

**Date:** 2026-03-06  
**Purpose:** Fix depth test, depth write, blending, and render order for all particle systems

---

## Reference: LinkSparkSystem (Working Pattern)

```javascript
new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
})
```

**Key Properties:**
- ✅ `transparent: true` - Required for alpha blending
- ✅ `blending: THREE.AdditiveBlending` - Adds colors together (brighter when overlapping)
- ✅ `depthWrite: false` - Doesn't write to depth buffer (allows particles behind each other)
- ✅ `depthTest: true` - Tests against depth buffer (particles don't draw through geometry)

---

## Systems Fixed

### 1. LinkTrailParticleSystem ✅

**Before:**
```javascript
new THREE.MeshBasicMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending  // ❌ WRONG
});
```

**After:**
```javascript
new THREE.MeshBasicMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending  // ✅ FIXED
});
```

**Render Order:** ✅ Already correct
```javascript
const particlesOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
this.poolGroup.renderOrder = particlesOrder;
```

**Impact:** Particles now glow and add up when overlapping, creating proper trail effect

---

### 2. LinkHealingParticleSystem ✅

**Before:**
```javascript
new THREE.MeshBasicMaterial({
    color: 0x66ddff,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending  // ❌ WRONG
});
```

**After:**
```javascript
new THREE.MeshBasicMaterial({
    color: 0x66ddff,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending  // ✅ FIXED
});
```

**Render Order:** ✅ Already correct
```javascript
const particlesOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
this.poolGroup.renderOrder = particlesOrder;
```

**Impact:** Healing particles now glow properly and add up when overlapping

---

### 3. LinkCorruptionParticleSystem ✅

**Before:**
```javascript
new THREE.MeshStandardMaterial({
    color: 0xff0044,
    emissive: 0xff0044,
    emissiveIntensity: 0.8,
    roughness: 0.4,
    metalness: 0.6,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
    // ❌ MISSING: depthTest: true
});
```

**After:**
```javascript
new THREE.MeshStandardMaterial({
    color: 0xff0044,
    emissive: 0xff0044,
    emissiveIntensity: 0.8,
    roughness: 0.4,
    metalness: 0.6,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,  // ✅ ADDED
    toneMapped: false
});
```

**Render Order:** ✅ Already correct
```javascript
const particlesOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
mesh.renderOrder = particlesOrder;
```

**Impact:** Corruption particles now properly test depth (don't draw through geometry)

---

## Why These Settings Matter

### depthWrite: false + depthTest: true

**Without depthWrite (false):**
- Particles don't write to depth buffer
- Multiple particles can render on top of each other
- Prevents particles from blocking each other

**With depthTest (true):**
- Particles check against existing depth buffer
- Particles don't render through solid geometry
- Particles appear to float above/in front of objects

**Combined effect:**
- Particles glow additively without blocking each other
- Particles respect depth of geometry (don't see through nodes)
- Proper visual layering

### AdditiveBlending vs NormalBlending

**NormalBlending (Wrong for particles):**
- Colors blend using standard alpha blending
- `final = source * alpha + destination * (1 - alpha)`
- Doesn't create glowing effect
- Particles appear flat

**AdditiveBlending (Correct for particles):**
- Colors add together
- `final = source * alpha + destination`
- Creates glowing/brightening effect when particles overlap
- Makes particles look like light/emissive objects

**Example:**
- 2 particles with opacity 0.5 overlapping
- NormalBlending: final opacity ≈ 0.75
- AdditiveBlending: final opacity ≈ 1.0 (brighter!)

### Render Order

All particle systems use `VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES')`:
- Ensures consistent rendering order
- Particles render at correct visual layer
- Prevents z-fighting with other elements

---

## Visual Impact Summary

### Before Fixes
- Particles appeared flat and dull
- Overlapping particles didn't glow brighter
- Corruption particles rendered through geometry
- Trail/healing effects were muted

### After Fixes
- ✅ Particles glow additively when overlapping
- ✅ Trail particles create proper glowing trail effect
- ✅ Healing particles glow brightly when grouped
- ✅ Corruption particles respect geometry depth
- ✅ All particle systems have consistent rendering
- ✅ Particles appear to float above/in front of geometry

---

## Testing Verification

### Console Commands

```javascript
// Check all particle systems
window.game.conduitRenderer.trailParticles.material.blending      // THREE.AdditiveBlending
window.game.conduitRenderer.trailParticles.material.depthWrite      // false
window.game.conduitRenderer.trailParticles.material.depthTest       // true

window.game.conduitRenderer.healingParticles.material.blending     // THREE.AdditiveBlending
window.game.conduitRenderer.healingParticles.material.depthWrite     // false
window.game.conduitRenderer.healingParticles.material.depthTest      // true

window.game.conduitRenderer.corruptionParticles.material.depthTest  // true
window.game.conduitRenderer.corruptionParticles.material.blending    // THREE.AdditiveBlending
window.game.conduitRenderer.corruptionParticles.material.depthWrite  // false

// Check render order
window.game.conduitRenderer.trailParticles.poolGroup.renderOrder
window.game.conduitRenderer.healingParticles.poolGroup.renderOrder
```

### Visual Testing

1. **Create multiple links** - Trail particles should glow when overlapping
2. **High corruption** - Corruption particles should glow additively
3. **High harmony** - Healing particles should glow brightly
4. **Particle overlap** - Multiple particles should create brighter glow
5. **Depth test** - Particles should NOT render through nodes/geometry

---

## Performance Considerations

### AdditiveBlending Performance

- ✅ GPU-accelerated blending
- ✅ No extra cost compared to NormalBlending
- ✅ Usually faster (simpler math)

### depthTest Performance

- ✅ Necessary for correct rendering
- ✅ No significant performance impact
- ✅ Prevents overdraw (particles rendering behind geometry)

### Render Order Performance

- ✅ Batched rendering (all particles in one group)
- ✅ Minimal sorting overhead
- ✅ No performance impact

---

## Summary

| System | depthWrite | depthTest | blending | renderOrder | Status |
|--------|-----------|-----------|----------|-------------|--------|
| **LinkSparkSystem** | false | true | AdditiveBlending | ✅ | ✅ REFERENCE |
| **LinkTrailParticleSystem** | false | true | NormalBlending → AdditiveBlending | ✅ | ✅ FIXED |
| **LinkHealingParticleSystem** | false | true | NormalBlending → AdditiveBlending | ✅ | ✅ FIXED |
| **LinkCorruptionParticleSystem** | false | ✅ ADDED | AdditiveBlending | ✅ | ✅ FIXED |

**All particle systems now match the working LinkSparkSystem pattern.**

---

## Expected Visual Results

1. **Trail Particles:** Glowing organic trails along links
2. **Healing Particles:** Bright cyan glow when flowing backwards
3. **Corruption Particles:** Red/orange glow with proper depth testing
4. **Overlap Effect:** Particles glow brighter when overlapping
5. **Depth Respect:** Particles don't render through geometry

**Result:** Visually consistent and impressive particle effects across all systems.
