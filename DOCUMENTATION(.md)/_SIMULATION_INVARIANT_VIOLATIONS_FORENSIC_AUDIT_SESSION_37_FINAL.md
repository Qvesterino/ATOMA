# SIMULATION INVARIANT VIOLATIONS - FORENSIC AUDIT & FIX STATUS
## Session 37+ Production Deployment

---

## EXECUTIVE SUMMARY

**Status**: ⚠️ CRITICAL - Post Session 37 audit reveals ADDITIONAL violations beyond initial fixes

**Root Cause**: Session 37 fixed materialization effects but overlooked:
1. **AINodes.js**: Node pulse animation still uses `requestAnimationFrame` 
2. **NodeLinkingSystem.js**: Two animation functions still use `requestAnimationFrame`
3. **MythicNodeCreation.js**: One `setTimeout` still present in DOM operation

**Impact**: Random "hologram lost after link" glitches due to asynchronous state mutations outside main loop

**Fix Approach**: Surgical conversion of remaining side-loops to orchestrator-driven state machines (no architecture rewrite)

---

## VIOLATIONS FOUND

### ❌ VIOLATION #1: NODE PULSE ANIMATION (ACTIVE RAFI LOOP)

**File**: `/AINodes.js`  
**Function**: Implicit in `createVisualPulse()` method  
**Line Range**: ~2050-2075 (approximate)  
**Severity**: 🔴 CRITICAL - Affects node feedback after linking

**Code**:
```javascript
const animatePulse = () => {
  const elapsed = performance.now() - pulse.userData.startTime;
  const progress = Math.min(elapsed / pulse.userData.duration, 1);
  
  if (progress < 1) {
    const scale = pulse.userData.startScale + 
      (pulse.userData.endScale - pulse.userData.startScale) * progress;
    pulse.scale.set(scale, scale, 1);
    pulse.material.opacity = 0.8 * (1 - progress);
    
    requestAnimationFrame(animatePulse);  // ⚠️ VIOLATION
  } else {
    this.scene.remove(pulse);
    pulse.geometry.dispose();
    pulse.material.dispose();
  }
};

animatePulse();
```

**Why It Violates Invariants**:
- Uses `requestAnimationFrame` (side-loop outside main loop)
- Uses `performance.now()` instead of `deltaTime` (wall-clock timing)
- Runs in parallel with main update loop (frame decoupling)
- **Invariant #2**: Timing not synchronized to game deltaTime
- **Invariant #3**: Animation runs outside simulation phase

**Symptom**: After linking nodes, visual pulses flicker or become invisible when zooming rapidly

---

### ❌ VIOLATION #2: PARTICLE ANIMATION (ACTIVE RAFI LOOP)

**File**: `/NodeLinkingSystem.js`  
**Function**: Inside `triggerCrosshairPulse()` (particle loop)  
**Line Range**: ~850-875 (approximate - particle creation section)  
**Severity**: 🔴 CRITICAL - Affects link feedback

**Code**:
```javascript
const startTime = performance.now();
const animate = () => {
  const elapsed = (performance.now() - startTime) / 1000;
  const progress = Math.min(elapsed / particle.userData.life, 1);
  
  if (progress < 1) {
    particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
    particle.material.opacity = 0.9 * (1 - progress);
    requestAnimationFrame(animate);  // ⚠️ VIOLATION
  } else {
    this.scene.remove(particle);
    particle.geometry.dispose();
    particle.material.dispose();
  }
};

animate();
```

**Why It Violates Invariants**:
- Uses `requestAnimationFrame` (parallel loop)
- Hard-coded `0.016` delta instead of actual frame delta
- Uses `performance.now()` (wall-clock, not game time)
- **Invariant #2**: No deltaTime synchronization
- **Invariant #3**: Runs outside main simulation phase

---

### ❌ VIOLATION #3: ERROR FEEDBACK PULSE (ACTIVE RAFI LOOP)

**File**: `/NodeLinkingSystem.js`  
**Function**: `createErrorFeedback(node, errorType)`  
**Line Range**: ~920-955 (approximate)  
**Severity**: 🟡 HIGH - Affects error/conflict indication

**Code**:
```javascript
const startTime = performance.now();
const duration = errorType === 'conflict' ? 1000 : 500;

const animate = () => {
  const elapsed = performance.now() - startTime;
  const progress = Math.min(elapsed / duration, 1);
  
  if (errorType === 'conflict') {
    const oscillation = Math.sin(progress * Math.PI * 4);
    pulse.scale.setScalar(1 + oscillation * 0.2);
    pulse.material.opacity = 0.8 * (1 - progress * 0.5);
  } else {
    pulse.scale.setScalar(1 + progress * 0.3);
    pulse.material.opacity = 0.8 * (1 - progress);
  }
  
  if (progress < 1) {
    requestAnimationFrame(animate);  // ⚠️ VIOLATION
  } else {
    this.scene.remove(pulse);
    pulse.geometry.dispose();
    pulse.material.dispose();
  }
};

this.scene.add(pulse);
animate();
```

**Why It Violates Invariants**:
- Uses `requestAnimationFrame` (parallel loop)
- Uses `performance.now()` (wall-clock timing)
- **Invariant #2**: Timing decoupled from game deltaTime
- **Invariant #3**: Outside main simulation phase

---

### ⚠️ VIOLATION #4: MYTHIC RITUAL DOM TIMEOUT

**File**: `/_MythicNodeCreation.js`  
**Function**: `showRitualHUD()`  
**Line Range**: ~550-560 (approximate)  
**Severity**: 🟡 HIGH - Affects HUD visibility timing

**Code**:
```javascript
this.ritualHUD.style.opacity = '1';

// Auto-hide after 2s
setTimeout(() => {
  if (this.ritualPhase !== 'RESOLUTION') {
    this.ritualHUD.style.opacity = '0';
  }
}, 2000);  // ⚠️ VIOLATION
```

**Why It Violates Invariants**:
- Uses `setTimeout` (side-timer, not game-time driven)
- Independent from game deltaTime accumulation
- **Invariant #2**: Timing not synchronized to game clock
- **Invariant #3**: State mutation (HUD opacity) outside main phase

**Note**: This is DOM/UI state mutation (less critical than node/material state), but should still be converted to game-time driven

---

## SESSION 37 INCOMPLETENESS

Session 37 fixed:
- ✅ Materialization animation (redirected to orchestrator)
- ✅ Link creation pulse (redirected to orchestrator)
- ✅ Link removal pulse (redirected to orchestrator)
- ✅ Incompatibility warning (redirected to orchestrator)
- ✅ Mythic energy pulse (converted to timer accumulation)
- ✅ Mythic ritual cleanup (converted to timer accumulation)

But **MISSED**:
- ❌ Node pulse animation (still has `requestAnimationFrame`)
- ❌ Particle animation in crosshair (still has `requestAnimationFrame`)
- ❌ Error feedback pulse (still has `requestAnimationFrame`)
- ❌ Ritual HUD timeout (still has `setTimeout`)

---

## FIX PLAN

### C1: Fix AINodes.js Node Pulse Animation

**Approach**: Register pulse with orchestrator instead of rAF loop

**Changes**:
1. Modify `createVisualPulse()` to create effect object
2. Register with `this.effectOrchestrator` 
3. Use `elapsed += deltaTime` for animation progress
4. Return `done: true` when complete

**Expected Result**: Node pulses frame-locked to main loop, deterministic timing

---

### C2: Fix NodeLinkingSystem.js Particle Animation

**Approach**: Convert particle loop to orchestrator effect

**Changes**:
1. Extract particle animation into orchestrator-compatible effect
2. Replace hard-coded `0.016` delta with actual `deltaTime`
3. Use accumulated game time, not wall-clock

**Expected Result**: Particle feedback synchronized to main loop

---

### C3: Fix NodeLinkingSystem.js Error Feedback Pulse

**Approach**: Convert error pulse to orchestrator effect

**Changes**:
1. Create effect object with duration-based timing
2. Register with orchestrator
3. Use game deltaTime for all calculations

**Expected Result**: Error pulses deterministic and frame-locked

---

### C4: Fix MythicNodeCreation.js DOM Timeout

**Approach**: Convert DOM timer to game-time driven state machine

**Changes**:
1. Add `hudHideTimer` to ritual state
2. Update in main `update()` loop
3. Trigger HUD opacity change when timer expires

**Expected Result**: HUD visibility synchronized to game time

---

## VERIFICATION CHECKLIST

After fixes applied:

```
✓ Spawn 20 nodes (mix of standard + rare if available)
✓ Link/unlink 20+ operations
✓ Zoom in/out extreme distance
✓ Trigger Mythic Node Creation (press R key)
✓ Verify ZERO "requestAnimationFrame" outside main.js
✓ Verify ZERO "setTimeout" outside UI/DOM operations  
✓ Check console for no orphaned animation loops
✓ Confirm: no node loses hologram after linking
✓ Confirm: rare nodes rotate/animate smoothly
✓ Confirm: all pulses/particles appear and disappear correctly
```

---

## DEPLOYMENT SEQUENCE

1. **Phase 1**: Deploy Session 37 RareNodeSpawner fix (already done, needs verification)
2. **Phase 2**: Fix AINodes pulse animation (this session)
3. **Phase 3**: Fix NodeLinkingSystem animations (this session)
4. **Phase 4**: Fix MythicNodeCreation timeout (this session)
5. **Phase 5**: Comprehensive test suite execution
6. **Phase 6**: Production release with full guarantee

---

## FINAL GUARANTEES (After Fixes)

✅ **100% Spawn-Time Registration**: All nodes in aiNodes.nodes registry  
✅ **100% Per-Frame Updates**: Every node updated every frame  
✅ **Zero Asynchronous Mutations**: No setTimeout/setInterval outside UI  
✅ **Zero Parallel Loops**: All animations frame-locked to deltaTime  
✅ **Deterministic Timing**: All effects synchronized to game clock  
✅ **Shells Never Culled**: Holographic shells visible under all conditions  

---

**Generated**: Session 37+ Final Audit  
**Status**: Ready for surgical fix deployment
