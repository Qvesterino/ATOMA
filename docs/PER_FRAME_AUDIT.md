# ATOMA Per-Frame Operations Audit
**Date:** 2026-03-01
**Scope:** Identify per-frame overhead for further optimization
**Status:** In Progress

---

## 🎯 OBJECTIVE

Identify ALL per-frame operations in ATOMA that contribute to frame time overhead.

**Target:** Find operations that can be:
- Throttled (e.g., run at 10Hz instead of 60Hz)
- Removed (e.g., redundant or unnecessary)
- Moved to spawn-time (e.g., one-time initialization)
- Optimized (e.g., cached, batched)

---

## 📊 DISCOVERED PER-FRAME SYSTEMS

### 1. AINodes.update()

**Location:** `AINodes.js` (main update loop)

**Per-frame operations:**
```javascript
update(deltaTime, time) {
  // 1. Spawn visual queue
  this._drainSpawnVisualQueue();

  // 2. Per-node loop (ALL nodes)
  nodes.forEach((node) => {
    // 2a. Visual readiness check
    this._checkVisualReadiness(node);

    // 2b. Visual bootstrap monitoring
    this.visualBootstrap.updateMonitoring(node);

    // 2c. Distance to player check
    const distance = node.position.distanceTo(playerPos);

    // 2d. Activation/deactivation logic
    // (hysteresis, targetActivation, activationLevel)

    // 2e. Visual updates
    this.updateNodeVisuals(node, data, time, deltaTime);
  });
}
```

**Estimated cost:** ~1-3ms per frame (depends on node count)

**Optimization opportunities:**
- ✅ ~~Visual readiness check~~ - already optimized (spawn-time check)
- ✅ ~~Visual bootstrap monitoring~~ - already optimized (only 1-2 frames after spawn)
- ❓ Distance check - can be throttled (10Hz instead of 60Hz)
- ❓ Activation logic - can be throttled (10Hz instead of 60Hz)
- ❓ `updateNodeVisuals()` - needs audit (what exactly does it update?)

---

### 2. AmbientEntityManager.update()

**Location:** `_AmbientEntityManager.js`

**Per-frame operations:**
```javascript
update(deltaTime) {
  // 1. Ambient interpretation throttled to 4Hz
  if (interpretationAccumulator >= interpretationInterval) {
    refreshAmbientInterpretation();
    interpretationAccumulator = 0;
  }

  // 2. Entity updates (per entity)
  entities.forEach((entity) => {
    // 2a. Position update
    entity.update(deltaTime);

    // 2b. Particle update
    if (entity.particles) {
      entity.particles.forEach((particle) => {
        particle.update(deltaTime);
      });
    }
  });

  // 3. Spawning
  if (Date.now() - lastSpawnTime > spawnCooldown) {
    if (Math.random() < spawnChance) {
      spawnEntity();
    }
  }
}
```

**Estimated cost:** ~0.5-1ms per frame

**Optimization opportunities:**
- ✅ Ambient interpretation - ALREADY THROTTLED (4Hz)
- ✅ Spawning - ALREADY COOLDOWN (100ms)
- ❓ Entity position updates - can be throttled? (needs investigation)
- ❓ Particle updates - can be throttled? (needs investigation)

**Status:** Already well-optimized

---

### 3. AtomaGlyphSystem3_0.update()

**Location:** `_AtomaGlyphSystem3_0.js`

**Per-frame operations:**
```javascript
update(deltaTime) {
  // 1. Fade-out animations
  fadingOut.forEach((glyph) => {
    glyph.opacity -= deltaTime * fadeSpeed;
    if (glyph.opacity <= 0) {
      removeGlyph(glyph);
    }
  });

  // 2. Visual updates (per glyph)
  glyphs.forEach((glyph) => {
    if (glyph.needsUpdate) {
      glyph.update(deltaTime);
    }
  });

  // 3. Sync with node positions
  glyphs.forEach((glyph) => {
    glyph.position.copy(glyph.node.position);
  });
}
```

**Estimated cost:** ~0.2-0.5ms per frame

**Optimization opportunities:**
- ❓ Position sync - can be throttled (30Hz instead of 60Hz)
- ❓ Visual updates - can be optimized? (needs investigation)

**Status:** Moderate overhead, can be optimized

---

### 4. Link Visual Systems

**Locations:**
- `_EvolvingLinkFX2_0.js`
- `LinkAuraSystem_v1.js`
- `LinkGlowSynergyEngine_v2.js`

**Per-frame operations:**
```javascript
// Per-link updates
links.forEach((link) => {
  // 1. Glow intensity update
  link.glowIntensity = computeGlow(link);

  // 2. Thickness update
  link.thickness = computeThickness(link);

  // 3. Color update
  link.color = computeColor(link);

  // 4. Shader uniform update
  link.material.uniforms.glow.value = link.glowIntensity;
  link.material.uniforms.thickness.value = link.thickness;
  link.material.uniforms.color.value = link.color;
});
```

**Estimated cost:** ~0.5-1ms per frame (depends on link count)

**Optimization opportunities:**
- ❓ Glow intensity - can be throttled (30Hz instead of 60Hz)
- ❓ Thickness - can be throttled (10Hz instead of 60Hz)
- ❓ Color - can be throttled (10Hz instead of 60Hz)
- ❓ Shader uniforms - can be batched (only update dirty)

**Status:** Needs optimization

---

### 5. Shader Uniform Updates

**Locations:**
- `shaders/*.js` (all shader systems)

**Per-frame operations:**
```javascript
// Per shader update
shaders.forEach((shader) => {
  // 1. Time uniform
  shader.uniforms.time.value = time;

  // 2. Pulse uniform
  shader.uniforms.pulse.value = Math.sin(time * 3) * 0.5 + 0.5;

  // 3. Other uniforms...
});
```

**Estimated cost:** ~0.1-0.3ms per frame (depends on shader count)

**Optimization opportunities:**
- ❓ Time uniform - REQUIRED per frame (cannot optimize)
- ❓ Pulse uniform - can be precomputed (10Hz instead of 60Hz)

**Status:** Minimal overhead, time uniform is required

---

### 6. UI Updates

**Locations:**
- `_AtomaUIUpdate3_0.js`
- `ui/hud/*.js`

**Per-frame operations:**
```javascript
update(deltaTime) {
  // 1. HUD updates
  hud.update(deltaTime);

  // 2. Selection indicator update
  selectionIndicator.update(deltaTime);

  // 3. Tooltip updates
  tooltips.forEach((tooltip) => {
    tooltip.update(deltaTime);
  });
}
```

**Estimated cost:** ~0.2-0.5ms per frame

**Optimization opportunities:**
- ❓ HUD updates - can be throttled (30Hz instead of 60Hz)
- ❓ Selection indicator - can be optimized (only update when selection changes)
- ❓ Tooltips - can be optimized (only update when visible)

**Status:** Can be optimized

---

### 7. Debug/Diagnostic Systems

**Locations:**
- `Engine/Debug/*.js`
- `scripts/*.js`

**Per-frame operations:**
```javascript
// Debug guards
if (debugMode) {
  debugGuards.forEach((guard) => {
    guard.check();
  });
}

// Performance profiling
if (profileMode) {
  profileSample('systemX', performance.now() - start);
}
```

**Estimated cost:** ~0.1-0.2ms per frame (only when debug mode is on)

**Optimization opportunities:**
- ✅ Debug guards - ALREADY CONDITIONAL (only in debug mode)
- ✅ Performance profiling - ALREADY CONDITIONAL (only when enabled)

**Status:** Already optimized (conditional)

---

## 📈 SUMMARY

### Total Estimated Per-Frame Cost
```
AINodes.update():                ~1-3ms
AmbientEntityManager.update():    ~0.5-1ms
AtomaGlyphSystem3_0.update():    ~0.2-0.5ms
Link Visual Systems:             ~0.5-1ms
Shader Uniform Updates:           ~0.1-0.3ms
UI Updates:                      ~0.2-0.5ms
Debug/Diagnostic Systems:        ~0.1-0.2ms (conditional)
-------------------------------------------------
TOTAL:                           ~2.6-6.5ms
```

### High-Priority Optimization Targets

1. **AINodes.update()** - ~1-3ms (38% of total)
   - Throttle distance check to 10Hz
   - Throttle activation logic to 10Hz
   - Audit `updateNodeVisuals()` for redundant operations

2. **Link Visual Systems** - ~0.5-1ms (15% of total)
   - Throttle glow/thickness/color to 30Hz
   - Batch shader uniform updates (only dirty)

3. **AtomaGlyphSystem3_0.update()** - ~0.2-0.5ms (8% of total)
   - Throttle position sync to 30Hz

4. **UI Updates** - ~0.2-0.5ms (8% of total)
   - Throttle HUD to 30Hz
   - Optimize selection indicator (only update on change)

### Low-Priority (Already Optimized)

5. **AmbientEntityManager.update()** - Already throttled (4Hz interpretation, 100ms spawn cooldown)
6. **Shader Uniform Updates** - Time uniform is required per frame
7. **Debug/Diagnostic Systems** - Already conditional (debug mode only)

---

## 🎯 OPTIMIZATION PLAN

### Phase 1: AINodes.update() Throttling (High Impact)

**Expected savings:** ~0.5-1ms per frame

**Actions:**
1. Throttle distance check to 10Hz (every 100ms)
2. Throttle activation logic to 10Hz (every 100ms)
3. Audit `updateNodeVisuals()` for redundant operations

### Phase 2: Link Visual Systems Throttling (Medium Impact)

**Expected savings:** ~0.3-0.5ms per frame

**Actions:**
1. Throttle glow intensity to 30Hz (every 33ms)
2. Throttle thickness to 10Hz (every 100ms)
3. Throttle color to 10Hz (every 100ms)
4. Batch shader uniform updates (only dirty)

### Phase 3: Glyph System Throttling (Low Impact)

**Expected savings:** ~0.1-0.2ms per frame

**Actions:**
1. Throttle position sync to 30Hz (every 33ms)

### Phase 4: UI Updates Throttling (Low Impact)

**Expected savings:** ~0.1-0.2ms per frame

**Actions:**
1. Throttle HUD to 30Hz (every 33ms)
2. Optimize selection indicator (only update on change)

---

## 📊 EXPECTED TOTAL IMPROVEMENT

**Before:** ~2.6-6.5ms per frame (per-frame operations)
**After Phase 1:** ~2.1-5.5ms per frame (~20% improvement)
**After Phase 2:** ~1.8-5.0ms per frame (~30% improvement)
**After Phase 3:** ~1.7-4.8ms per frame (~35% improvement)
**After Phase 4:** ~1.6-4.6ms per frame (~38% improvement)

**Combined with Guard Optimization:** ~80% total reduction in per-frame overhead

---

## 🔄 NEXT STEPS

1. **Audit AINodes.updateNodeVisuals()** - Identify redundant operations
2. **Implement Phase 1 throttling** - Throttle distance/activation to 10Hz
3. **Implement Phase 2 throttling** - Throttle link visuals to 30Hz/10Hz
4. **Implement Phase 3 throttling** - Throttle glyph position sync to 30Hz
5. **Implement Phase 4 throttling** - Throttle HUD to 30Hz

---

**AUDIT IN PROGRESS** - Ready for Phase 1 implementation
