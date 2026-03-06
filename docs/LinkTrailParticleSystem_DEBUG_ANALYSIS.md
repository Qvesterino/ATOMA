# LinkTrailParticleSystem Visibility Issue

**Date:** 2026-03-06  
**Status:** DIAGNOSIS COMPLETE - FIX REQUIRED

---

## Problem Statement

LinkTrailParticleSystem is marked as **ACTIVE** in PARTICLE_SYSTEMS_DISCOVERY_AUDIT.md:
- **Create Site:** main.js:~3632
- **Update Site:** main.js:~3315 (FrameScheduler.visual 30Hz)
- **Runtime Used:** LIVE - Active in FrameScheduler.visual.layer

**BUT** particles are **NOT VISIBLE** in runtime.

---

## Architecture Overview

```
main.js
  ↓ creates
LinkTrailParticleSystem (poolSize 200)
  ↓
FrameScheduler.visual.linkTrailParticles (30Hz)
  ↓ calls
linkTrailParticles.update(dt, time)
  ↓

main.js (hook on createLink)
  ↓ creates
LinkTrailEmitter (per link)
  ↓
FrameScheduler.visual.linkTrailEmitters (30Hz)
  ↓ calls
trailEmitter.update(dt, time, curve, linkDirection, harmony, corruption)
  ↓ calls
linkTrailParticles.emitAlongLink(link, curve, linkDirection, rate, time, harmony, corruption)
  ↓ spawns particles
TrailParticle (pooled meshes in poolGroup)
```

---

## Root Cause Analysis

### Issue 1: LinkTrailEmitter Creation Timing ⚠️

**Location:** main.js (link creation hook)

```javascript
const originalCreateLink = this.linkingSystem.createLink.bind(this.linkingSystem);
this.linkingSystem.createLink = (sourceNode, targetNode) => {
    const result = originalCreateLink(sourceNode, targetNode);
    
    // Create LinkTrailEmitter for each link
    if (result && !this.linkTrailEmitters) {
        this.linkTrailEmitters = new Map();
    }
    if (result && this.linkTrailEmitters && this.linkTrailParticles) {
        const trailEmitter = new LinkTrailEmitter(result, this.linkTrailParticles);
        this.linkTrailEmitters.set(result.userData.id, trailEmitter);
        console.log('[main.js] LinkTrailEmitter created for link:', result.userData.id);
    }
    
    return result;
};
```

**Problem:** `result.link` object structure:

```javascript
const link = {
    source: sourceNode,
    target: targetNode,
    sourceNodeId: ...,
    targetNodeId: ...,
    group: null,
    active: true,
    traffic: { ... },
    animation: { ... },
    id: linkId,
    vfxEnabled: true,
    extremeMode: false,
    createdAt: performance.now(),
    visualState: 'pending'
};
```

**Missing Property:** `link.curve` is **NOT** in initial object!

`link.curve` is set **LATER** in NodeLinkingSystem.updateLinkCurve():

```javascript
// In NodeLinkingSystem.updateLinkCurve():
link.curve = curve;  // ← Set later, not in createLink()
```

### Issue 2: FrameScheduler Guard Condition ⚠️

**Location:** main.js (FrameScheduler.update)

```javascript
// Update all LinkTrailEmitters
if (this.linkTrailEmitters && this.linkingSystem?.links) {
    for (const link of this.linkingSystem.links) {
        const trailEmitter = this.linkTrailEmitters.get(link.userData?.id);
        if (trailEmitter && link.curve && link.source && link.target) {
            // ← link.curve guard prevents emission
            const curve = link.curve;
            // ...
            trailEmitter.update(dt, this.time, curve, linkDirection, stats.harmony, stats.corruption);
        }
    }
}, 'visual.linkTrailEmitters');
```

**Problem:** `link.curve` check:
- If `link.curve` is `undefined`, emission is **SKIPPED**
- `link.curve` is only set after first `NodeLinkingSystem.update()` frame
- **Race condition:** FrameScheduler runs BEFORE `updateLinkCurve()`

### Issue 3: LinkState Data ⚠️

**Location:** main.js (FrameScheduler.update)

```javascript
// Get link state from NeonLinkVisuals (has harmony, corruption)
const linkState = this.linkingSystem?.visuals?.linkStates?.get(link.userData?.id);
const stats = linkState?.stats || {};
```

**Problem:** If `linkState` is missing or `stats` is empty:
- `stats.harmony = undefined`
- `stats.corruption = undefined`
- Passed to LinkTrailEmitter.update() with defaults (harmony=0.5, corruption=0.2)
- This is **OK** (defaults exist)

---

## Diagnosis Summary

| Issue | Severity | Impact |
|-------|----------|---------|
| **link.curve not set in createLink()** | HIGH | Particles never emit initially |
| **FrameScheduler guard skips if curve missing** | HIGH | Emission blocked until first update frame |
| **LinkState.stats missing** | LOW | Uses defaults (OK) |

---

## Why LinkSparkSystem Works (for comparison)

**LinkSparkSystem** architecture:
- Created **PER-LINK** with dedicated mesh
- Managed by **LinkRendererConduit** (not FrameScheduler)
- Curve passed directly in update: `update(time, deltaTime, curve, stats, color)`
- **NO race condition** - curve always available in update()

**LinkTrailParticleSystem** architecture:
- Created **ONCE** with shared particle pool (200 particles)
- Managed by **FrameScheduler** (global layer)
- Requires `link.curve` property to exist
- **RACE CONDITION** - curve not set when hook runs

---

## Recommended Fixes

### Fix 1: Initialize link.curve in createLink() (RECOMMENDED)

**Location:** NodeLinkingSystem.js - createLink() method

**Change:**
```javascript
createLink(sourceNode, targetNode) {
    // ... existing code ...
    
    const link = {
        // ... existing properties ...
        curve: null,  // ← ADD: Initialize curve property
        // ... rest of properties
    };
    
    // ... rest of createLink() code
}
```

**Benefits:**
- Eliminates race condition
- Clear property initialization
- Consistent with other properties (group=null, etc.)

### Fix 2: Defer LinkTrailEmitter creation (ALTERNATIVE)

**Location:** main.js (link creation hook)

**Change:**
```javascript
// Instead of creating in createLink hook:
const originalCreateLink = this.linkingSystem.createLink.bind(this.linkingSystem);
this.linkingSystem.createLink = (sourceNode, targetNode) => {
    const result = originalCreateLink(sourceNode, targetNode);
    
    // Defer LinkTrailEmitter creation until curve exists
    // Will be handled by FrameScheduler guard: trailEmitter && link.curve
    // LinkTrailEmitter can be created later on-demand
    
    return result;
};

// Add FrameScheduler logic to create emitters lazily:
this.frameScheduler.register('visual', (dt) => {
    if (this.linkTrailEmitters && this.linkingSystem?.links) {
        for (const link of this.linkingSystem.links) {
            const linkId = link.userData?.id;
            
            // Create emitter on-demand if curve exists
            if (link.curve && !this.linkTrailEmitters.has(linkId)) {
                const trailEmitter = new LinkTrailEmitter(link, this.linkTrailParticles);
                this.linkTrailEmitters.set(linkId, trailEmitter);
                console.log('[main.js] LinkTrailEmitter created (lazy) for link:', linkId);
            }
            
            const trailEmitter = this.linkTrailEmitters.get(linkId);
            if (trailEmitter && link.curve && link.source && link.target) {
                // Update emitter...
            }
        }
    }
}, 'visual.linkTrailEmitters');
```

**Benefits:**
- No changes to NodeLinkingSystem
- Lazy creation only when curve exists
- Robust to timing changes

**Drawbacks:**
- More complex logic
- Per-frame check for emitter existence

### Fix 3: Remove FrameScheduler curve guard (QUICK FIX)

**Location:** main.js (FrameScheduler.update)

**Change:**
```javascript
// Remove link.curve guard, handle in update()
for (const link of this.linkingSystem.links) {
    const trailEmitter = this.linkTrailEmitters.get(link.userData?.id);
    if (trailEmitter) {  // ← Remove curve check
        const curve = link.curve || link._createCurve?.();  // Fallback
        if (curve && link.source && link.target) {
            trailEmitter.update(dt, this.time, curve, linkDirection, stats.harmony, stats.corruption);
        }
    }
}
```

**Benefits:**
- Simple, minimal change
- Fallback if curve missing

**Drawbacks:**
- Still requires curve to exist
- Doesn't fix root cause

---

## Recommended Solution

**FIX 1: Initialize link.curve in createLink()**

This is the cleanest solution that eliminates the race condition at the source.

**Implementation:**
1. Add `curve: null` to link object in NodeLinkingSystem.createLink()
2. NodeLinkingSystem.updateLinkCurve() will populate it
3. LinkTrailEmitter creation hook will work correctly
4. FrameScheduler guard will pass on first frame

**Testing:**
1. Create link
2. Check console: "LinkTrailEmitter created for link: XXX"
3. Wait 1-2 frames
4. Observe particles along link

---

## Additional Debugging

### Console Debug Commands

After fix, verify particle system is working:

```javascript
// Check particle system exists
window.game.linkTrailParticles

// Check particle pool
window.game.linkTrailParticles.particles

// Check active particles
window.game.linkTrailParticles.active

// Force emit test
const link = window.game.linkingSystem.links[0];
if (link?.curve) {
    window.game.linkTrailParticles.emitAlongLink(
        link, 
        link.curve, 
        new THREE.Vector3().subVectors(link.target.position, link.source.position).normalize(),
        100,  // emission rate
        window.game.time
    );
}
```

### Visual Debugging

Enable particle visibility debugging:

```javascript
// In LinkTrailParticleSystem.js, find particle mesh initialization
this.geometry = new THREE.IcosahedronGeometry(0.05, 2);

// Temporarily increase size for visibility:
this.geometry = new THREE.IcosahedronGeometry(0.15, 2);  // 3x larger
```

---

## Performance Notes

- **Particle Pool:** 200 particles (configured in main.js)
- **Emission Rate:** 40 particles/second (LinkTrailEmitter)
- **Per Link:** Variable based on harmony/corruption
- **Estimated Load:** ~100-300 particles active at any time
- **Performance Impact:** <1ms for update loop (designed)

---

## Conclusion

LinkTrailParticleSystem is correctly initialized and registered, but **race condition** between link creation and curve initialization prevents particle emission.

**Recommended Fix:** Initialize `link.curve: null` in NodeLinkingSystem.createLink()

**Alternative Fix:** Lazy LinkTrailEmitter creation in FrameScheduler when curve exists

**Result:** Particles should become visible immediately after link creation.

---

## Next Steps

1. Apply Fix 1 to NodeLinkingSystem.js
2. Test particle visibility
3. Verify emission rate and visual quality
4. Document any tuning needed (size, color, emission rate)
