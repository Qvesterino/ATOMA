# LinkTrailEmitter Debug Test

**Date:** 2026-03-06  
**Purpose:** Test if LinkTrailEmitter is being created and called

---

## Console Debug Commands

After ATOMA starts, test in console:

### 1. Check if LinkTrailParticleSystem exists
```javascript
window.game.linkTrailParticles
```

### 2. Check if LinkTrailEmitter is being created
```javascript
// Check console for this log:
// [LinkRendererConduit] LinkTrailEmitter created for link: XXX
```

### 3. Check if LinkTrailEmitter is being updated
```javascript
// Add to LinkRendererConduit.js update() method:
if (linkTrailEmitter) {
    console.log('[LinkTrailEmitter] Update called for link:', link.id);
    console.log('[LinkTrailEmitter] Curve exists:', !!link.curve);
    console.log('[LinkTrailEmitter] Particles:', window.game.linkTrailParticles.active);
}
```

### 4. Manual emit test
```javascript
// Find first link
const link = window.game.linkingSystem.links[0];
if (link && link.curve && window.game.linkTrailParticles) {
    console.log('[TEST] Manual emit test');
    const linkDirection = new THREE.Vector3()
        .subVectors(link.target.position, link.source.position)
        .normalize();
    
    window.game.linkTrailParticles.emitAlongLink(
        link, 
        link.curve, 
        linkDirection,
        100,  // emission rate
        window.game.time,
        0.5,  // harmony
        0.2   // corruption
    );
}
```

### 5. Check particle pool
```javascript
// Check if particles exist
const pool = window.game.linkTrailParticles;
console.log('Pool size:', pool.particles.length);
console.log('Active particles:', pool.active);

// Check if particles are visible
pool.particles.forEach((p, i) => {
    if (p.active && i < 5) {
        console.log(`Particle ${i}: active=${p.active}, visible=${p.mesh.visible}, scale=${p.mesh.scale.x}`);
    }
});
```

### 6. Check curve
```javascript
// Check if link has curve
const link = window.game.linkingSystem.links[0];
if (link) {
    console.log('Link curve exists:', !!link.curve);
    console.log('Link curve type:', typeof link.curve);
    console.log('Link curve methods:', Object.getOwnPropertyNames(link.curve || {}));
}
```

---

## Expected Results

### If working correctly:
1. `[LinkRendererConduit] LinkTrailEmitter created for link: XXX` should appear
2. `[LinkTrailEmitter] Update called for link: XXX` should appear every frame
3. Manual emit should create visible particles
4. Active particle count should increase after emit
5. Particles should be visible with mesh.visible = true

### If not working:
1. LinkTrailEmitter creation log should not appear
2. Update should not be called
3. Manual emit should have no effect
4. Active particle count should remain 0

---

## Fix Priorities

1. **Fix LinkTrailEmitter creation** in LinkRendererConduit.createLinkVisuals()
2. **Fix LinkTrailEmitter update** in LinkRendererConduit.update()
3. **Fix particle visibility** - check mesh.visible and scale
4. **Fix particle emission** - check emitAlongLink() parameters

---

## Quick Code Injection Test

Add to LinkRendererConduit.js for debugging:

```javascript
// In createLinkVisuals(), after LinkTrailEmitter creation:
if (linkTrailEmitter) {
    console.log('[LinkRendererConduit] LinkTrailEmitter SUCCESSFULLY created for link:', link.id);
    console.log('[LinkRendererConduit] LinkTrailParticles available:', !!window.game?.linkTrailParticles);
    console.log('[LinkRendererConduit] Curve exists:', !!link.curve);
}

// In update(), before LinkTrailEmitter update:
if (linkTrailEmitter && !mainCurve) {
    console.warn('[LinkRendererConduit] LinkTrailEmitter update SKIPPED - no curve for link:', link.id);
}
```

---

## Implementation Notes

The LinkTrailEmitter should be stored in `state.trails` for consistency with other subsystems:

```javascript
// In createLinkVisuals():
if (linkTrailEmitter) {
    state.trails = linkTrailEmitter;  // Store in state
    console.log('[LinkRendererConduit] LinkTrailEmitter stored in state.trails for link:', link.id);
}

// In update():
if (state.trails && mainCurve) {
    state.trails.update(visualDelta, visualTime, mainCurve, linkDirection, stats.harmony, stats.corruption);
    console.log('[LinkRendererConduit] LinkTrailEmitter update called for link:', link.id);
}
```

This follows the same pattern as:
- `state.sparks.update(...)`
- `state.beads.update(...)`
- `state.rings.update(...)`

---

## Manual Fix Steps

1. **Store LinkTrailEmitter in state.trails**
2. **Call state.trails.update()** in update()
3. **Add debug logging** to track calls
4. **Test with manual emit** to verify functionality
5. **Check particle visibility** and scaling