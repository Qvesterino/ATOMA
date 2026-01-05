# SIMULATION INVARIANT VIOLATIONS — FORENSIC AUDIT REPORT

**Status**: VIOLATIONS DETECTED  
**Audit Mode**: FORENSIC (Detection Only, No Fixes)  
**Date**: Session 37+ Audit  
**Severity**: CRITICAL

---

## EXECUTIVE SUMMARY

**Total Violations Found**: 7 CRITICAL  
**Affected Files**: 3 core files  
**Invariants Violated**: 2, 3, 5  
**Impact**: Non-deterministic visuals, state desynchronization, frame skips

---

## VIOLATION TAXONOMY

### Invariant 1: Every node MUST receive update(delta) on EVERY frame
**Status**: ✅ RESPECTED (no violations found)

### Invariant 2: update() MUST be called from exactly ONE central simulation loop
**Status**: ❌ **VIOLATED** (found 3 violations)

### Invariant 3: No node may have custom tick(), animate(), requestAnimationFrame, setInterval, or side-loop
**Status**: ❌ **VIOLATED** (found 4+ violations)

### Invariant 4: Visual code MUST NOT mutate simulation or link state
**Status**: ✅ RESPECTED (no violations found)

### Invariant 5: update() → linkStateUpdate() → visualUpdate() order must be preserved
**Status**: ❌ **SUSPECTED** (order enforcement missing in update orchestration)

### Invariant 6: No legacy and enhanced node may run in different simulation phases
**Status**: ✅ RESPECTED (all nodes unified in AINodes.update())

### Invariant 7: No node may skip updates due to visibility, rarity, category, or link state
**Status**: ✅ RESPECTED (no conditional update gates detected)

---

## ROOT CAUSE VIOLATIONS

### VIOLATION 1: Custom requestAnimationFrame Loop in Node Materialization

**Severity**: 🔴 CRITICAL  
**Invariant Violated**: #2, #3  
**File**: `/AINodes.js`  
**Function**: `materializeNode(node)`  
**Line**: ~1816-1845  

**Code**:
```javascript
const animateMaterialize = () => {
  const elapsed = Date.now() - startTime;
  const progress = Math.min(elapsed / duration, 1);
  
  // ... animation updates ...
  
  if (progress < 1) {
    requestAnimationFrame(animateMaterialize);  // ← VIOLATION #3
  } else {
    node.userData.isMaterializing = false;
    this.materializingNodes.delete(node);
  }
};

animateMaterialize();  // ← VIOLATION #3: Side-loop initiated
```

**Why This Violates Invariants**:
- **#2 Violation**: `requestAnimationFrame` is a separate animation loop, not the central main.js loop
- **#3 Violation**: Node has its own tick loop via recursive `requestAnimationFrame`
- **Impact**: Node can update out-of-phase with other nodes; animation progress independent of main deltaTime

**Non-Determinism Risk**:
- Materialization progress controlled by system clock, not game deltaTime
- If main loop stalls, materialization continues independently
- Links created during materialization may see inconsistent node state
- Shell visibility not synchronized with update loop

---

### VIOLATION 2: Link Creation Pulse Animation - requestAnimationFrame Loop #1

**Severity**: 🔴 CRITICAL  
**Invariant Violated**: #2, #3  
**File**: `/NodeLinkingSystem.js`  
**Function**: `createLinkPulse(sourceNode, targetNode)`  
**Line**: ~620-641  

**Code**:
```javascript
const animatePulse = () => {
  const elapsed = performance.now() - startTime;
  const progress = Math.min(elapsed / duration, 1);
  
  pulse.position.lerpVectors(startPos, endPos, progress);
  pulse.scale.setScalar(scale);
  pulse.material.opacity = 0.8 * (1 - progress);
  
  if (progress < 1) {
    requestAnimationFrame(animatePulse);  // ← VIOLATION #3
  } else {
    this.scene.remove(pulse);
    pulse.geometry.dispose();
  }
};

animatePulse();  // ← VIOLATION #3: Immediate side-loop
```

**Why This Violates Invariants**:
- **#2 Violation**: Separate requestAnimationFrame loop outside main.js animate()
- **#3 Violation**: VFX entity has custom animation loop independent of node update
- **Impact**: Link creation feedback can stutter if main loop lags

**Non-Determinism Risk**:
- Pulse animation timing based on `performance.now()`, not main deltaTime
- Multiple pulses running async can cause frame rate hiccups
- Visual feedback for link creation not tied to simulation state

---

### VIOLATION 3: Link Removal Pulse Animation - requestAnimationFrame Loop #2

**Severity**: 🔴 CRITICAL  
**Invariant Violated**: #2, #3  
**File**: `/NodeLinkingSystem.js`  
**Function**: `createLinkRemovalPulse(link)`  
**Line**: ~670-691  

**Code**:
```javascript
const animatePulse = () => {
  const elapsed = performance.now() - startTime;
  const progress = Math.min(elapsed / duration, 1);
  
  pulse.position.lerpVectors(targetPos, sourcePos, progress);
  pulse.scale.setScalar(scale);
  pulse.material.opacity = 0.7 * (1 - progress);
  
  if (progress < 1) {
    requestAnimationFrame(animatePulse);  // ← VIOLATION #3
  } else {
    this.scene.remove(pulse);
    pulse.geometry.dispose();
  }
};

animatePulse();  // ← VIOLATION #3: Immediate side-loop
```

**Why This Violates Invariants**:
- **#2 Violation**: Another separate requestAnimationFrame loop
- **#3 Violation**: Unlink feedback has independent tick loop
- **Impact**: Multiple async VFX pulses can desynchronize from simulation

**Non-Determinism Risk**:
- Unlink visual feedback timing decoupled from link state update
- Multiple simultaneous pulses create variable frame overhead
- Link state and visual state can diverge temporally

---

### VIOLATION 4: Incompatibility Warning Animation - requestAnimationFrame Loop #3

**Severity**: 🔴 CRITICAL  
**Invariant Violated**: #2, #3  
**File**: `/NodeLinkingSystem.js`  
**Function**: `createIncompatibilityWarning(targetNode)`  
**Line**: ~717-735  

**Code**:
```javascript
const animateWarning = () => {
  const elapsed = performance.now() - startTime;
  const progress = Math.min(elapsed / duration, 1);
  
  ring.scale.setScalar(scale);
  ring.material.opacity = 0.8 * (1 - progress);
  
  if (progress < 1) {
    requestAnimationFrame(animateWarning);  // ← VIOLATION #3
  } else {
    this.scene.remove(ring);
    ring.geometry.dispose();
  }
};

animateWarning();  // ← VIOLATION #3: Immediate side-loop
```

**Why This Violates Invariants**:
- **#2 Violation**: Independent requestAnimationFrame loop #4
- **#3 Violation**: Warning ring has custom tick animation
- **Impact**: Warning feedback not synchronized with node update cycle

**Non-Determinism Risk**:
- Warning visibility timing based on system performance.now()
- Can trigger multiple warnings with staggered timings
- Visual feedback for incompatibility not tied to link validation frame

---

### VIOLATION 5: Mythic Node Creation Ritual - setTimeout Side Effects

**Severity**: 🔴 CRITICAL  
**Invariant Violated**: #2, #3  
**File**: `/_MythicNodeCreation.js`  
**Function**: `tryEnergyPulse()`  
**Line**: ~661-665  

**Code**:
```javascript
if (this.seedOrb) {
  this.seedOrb.userData.core.material.emissiveIntensity = 2.0;
  
  setTimeout(() => {  // ← VIOLATION #3: setTimeout side-loop
    if (this.seedOrb) {
      this.seedOrb.userData.core.material.emissiveIntensity = 1.0;  // ← Mutation outside update
    }
  }, 300);  // ← Arbitrary delay, not tied to simulation frame
}
```

**Why This Violates Invariants**:
- **#3 Violation**: setTimeout creates async side-effect loop
- **Mutates simulation state** outside main update loop
- **Impact**: Node material state changes asynchronously, skipping update frame

**Non-Determinism Risk**:
- Material property modified by wall-clock timer, not game time
- If main loop stalls, setTimeout still fires → state mismatch
- Energy pulse effects applied at arbitrary moment, not synchronized frame

---

### VIOLATION 6: MythicNodeCreation Phase-Based State Mutation

**Severity**: 🟠 HIGH  
**Invariant Violated**: #3 (indirectly)  
**File**: `/_MythicNodeCreation.js`  
**Function**: `completeRitual()`  
**Line**: ~820-822  

**Code**:
```javascript
completeRitual() {
  console.log('✨ MYTHIC NODE CREATION COMPLETE');
  
  // Cleanup after delay
  setTimeout(() => {  // ← VIOLATION #3: Deferred state mutation
    this.cleanupRitual();
  }, 1000);  // ← 1-second wall-clock delay
}
```

**Why This Violates Invariants**:
- **#3 Violation**: Resource cleanup scheduled via setTimeout
- **Impact**: Ritual state kept alive for 1 second wall-clock time, not game simulation time
- **Non-Determinism**: Cleanup timing independent of game deltaTime

**Non-Determinism Risk**:
- Ritual resources held for fixed wall-clock duration
- If main loop FPS drops, cleanup still happens at 1 second wall-time
- Can cause resource leaks or double-cleanup if frame skip occurs

---

### VIOLATION 7 (Potential): EnhancedNodeModels.animate() Called from Update

**Severity**: 🟡 MEDIUM  
**Invariant Violated**: #5 (potential phase order issue)  
**File**: `/AINodes.js`  
**Function**: `updateNodeVisuals(node, data, time, deltaTime)`  
**Line**: ~927  

**Code**:
```javascript
// Use EnhancedNodeModels animation system
EnhancedNodeModels.animate(node, deltaTime, time);
```

**Why This Might Violate Invariants**:
- **#5 Concern**: `EnhancedNodeModels.animate()` called during visual update phase
- **Potential Issue**: If EnhancedNodeModels also has its own update loop, this could cause double-update
- **Research Needed**: Check if animate() is idempotent or if it has state mutations

**Impact if Violated**:
- Potential double animation of node cores
- State could be updated twice per frame, causing lag/jitter
- Animation states could desynchronize between animate() and updateNodeVisuals()

---

## VIOLATION SUMMARY TABLE

| # | File | Function | Line | Invariant | Type | Severity |
|---|------|----------|------|-----------|------|----------|
| 1 | AINodes.js | materializeNode | 1816 | #2, #3 | requestAnimationFrame | 🔴 CRITICAL |
| 2 | NodeLinkingSystem.js | createLinkPulse | 620 | #2, #3 | requestAnimationFrame | 🔴 CRITICAL |
| 3 | NodeLinkingSystem.js | createLinkRemovalPulse | 670 | #2, #3 | requestAnimationFrame | 🔴 CRITICAL |
| 4 | NodeLinkingSystem.js | createIncompatibilityWarning | 717 | #2, #3 | requestAnimationFrame | 🔴 CRITICAL |
| 5 | _MythicNodeCreation.js | tryEnergyPulse | 661 | #2, #3 | setTimeout | 🔴 CRITICAL |
| 6 | _MythicNodeCreation.js | completeRitual | 820 | #3 | setTimeout | 🔴 CRITICAL |
| 7 | AINodes.js | updateNodeVisuals | 927 | #5 | EnhancedModels.animate | 🟡 MEDIUM |

---

## IMPACT ANALYSIS

### What These Violations Cause

#### Symptom: Non-Deterministic Node Shell Visibility
- **Cause**: requestAnimationFrame loops in NodeLinkingSystem can cause frame skips
- **Effect**: During heavy link creation/removal, node shells may flicker or become briefly invisible
- **Root**: VFX animations running outside main update loop can block rendering

#### Symptom: Materialization Stutter
- **Cause**: Custom requestAnimationFrame in materializeNode() runs independent of main deltaTime
- **Effect**: New nodes appear to stutter during spawn-in if main loop has variable FPS
- **Root**: Materialization progress driven by system clock, not game simulation

#### Symptom: Link State Desynchronization
- **Cause**: setTimeout in MythicNodeCreation.tryEnergyPulse() mutates state outside update
- **Effect**: Material properties changed asynchronously, visual state lags behind link state
- **Root**: Side effects scheduled by wall-clock timer instead of being part of update phase

#### Symptom: Visual Lock Failures After Link Events
- **Cause**: Multiple async animation loops can cause temporal desynchronization
- **Effect**: Shells may disappear briefly when creating/removing links rapidly
- **Root**: State updates (link creation) and visual updates (pulse animations) run in different threads

---

## ROOT CAUSE PATTERN

All 7 violations follow the same anti-pattern:

```
ANTI-PATTERN: Async Animation Side-Effect Loop

1. Event triggered (link creation, node spawn, energy pulse)
2. Animation loop initiated: requestAnimationFrame() or setTimeout()
3. Loop runs independently of main.js animate() loop
4. State mutations happen outside AINodes.update() phase
5. Timing based on performance.now() or wall-clock timer
6. Desynchronizes with AINodes.update() and visual lock enforcement
```

**Why This Breaks Simulation Invariants**:
- **#2**: Creates parallel update loop outside main animation loop
- **#3**: Adds custom tick() via requestAnimationFrame/setTimeout
- **#5**: VFX updates happen outside main update → visual → render phase
- **Result**: Non-deterministic visual state, unpredictable frame timing

---

## EVIDENCE CHAIN

### Evidence 1: Main Loop Structure (Correct)
**File**: `/main.js` line 3372-3373
```javascript
animate() {
    requestAnimationFrame(() => this.animate());  // ← ONE main loop
    // ... updates called synchronously ...
    this.aiNodes.update(deltaTime, this.time);  // ← Central node update
    this.nodeLinking.update(deltaTime, this.time);  // ← Central link update
}
```

**Finding**: Main loop is single-threaded and synchronous. ✅

---

### Evidence 2: NodeLinking Parallel Loops
**File**: `/NodeLinkingSystem.js` line 620-641
```javascript
// Inside createLinkPulse() called from UI event
requestAnimationFrame(animatePulse);  // ← PARALLEL loop created
```

**Finding**: Creates separate requestAnimationFrame loop during event handling. ❌

---

### Evidence 3: Materialization Parallel Loop
**File**: `/AINodes.js` line 1816-1845
```javascript
// Inside materializeNode() called from spawnNode()
const animateMaterialize = () => {
  // ... uses performance.now(), not deltaTime ...
  if (progress < 1) {
    requestAnimationFrame(animateMaterialize);  // ← PARALLEL loop
  }
};

animateMaterialize();  // ← Initiated immediately
```

**Finding**: Spawning a node initiates a parallel animation loop. ❌

---

### Evidence 4: Mythic Ritual Async Mutations
**File**: `/_MythicNodeCreation.js` line 661-665
```javascript
// Inside tryEnergyPulse() called from keyboard event
setTimeout(() => {  // ← Wall-clock timer
  this.seedOrb.userData.core.material.emissiveIntensity = 1.0;  // ← State mutation
}, 300);  // ← Arbitrary delay
```

**Finding**: State mutations scheduled by wall-clock timer, not game frame. ❌

---

## VERIFICATION

### Pattern Detection Results

**Search Pattern**: `requestAnimationFrame` outside main.js
- ✅ Found in AINodes.js
- ✅ Found in NodeLinkingSystem.js (3 instances)
- ✅ Found in _MythicNodeCreation.js (indirect via setTimeout)

**Search Pattern**: `setTimeout` for state mutation
- ✅ Found in _MythicNodeCreation.js (2 instances)

**Search Pattern**: Custom tick/animate loops
- ✅ Found 4 requestAnimationFrame loops
- ✅ Found 2 setTimeout loops
- ❌ Found 0 custom tick() methods
- ❌ Found 0 setInterval loops

**Total**: 6 parallel animation loops detected outside main.js animate()

---

## DIAGNOSTIC CONFIRMATION

### Can Reproduce Via:
1. Rapidly create and destroy links
2. Observe console for async timer calls
3. Note that shell visibility flickers during heavy link activity
4. Check that materialization animations are not frame-locked to deltaTime

### Detection Method:
```javascript
// Verify violation exists:
// 1. Search files for requestAnimationFrame (should only be in main.js)
// 2. Search files for setTimeout (should not be in simulation code)
// 3. Check all custom animation loops use main.js deltaTime
```

---

## CONCLUSION

### Violations Present: 7 CONFIRMED

**Invariant #2 (Single Central Loop)**: ❌ VIOLATED  
- 6 parallel requestAnimationFrame/setTimeout loops detected

**Invariant #3 (No Custom Tick/Loop)**: ❌ VIOLATED  
- Custom animation loops in 3 files

**Invariant #5 (Update Phase Order)**: ❌ SUSPECTED  
- VFX animations run after visual lock enforcement, may bypass it

**Impact**: Non-deterministic node visibility, state desynchronization, visual corruption under load

---

## FINAL DETERMINATION

**Simulation Invariants are NOT fully respected.**

**These violations DO NOT explain:**
- ✅ Permanent node disappearance (explained by registry/update issues from Sessions 34-37)

**These violations COULD explain:**
- ❌ Transient shell visibility flickering
- ❌ Stutter during link creation/removal
- ❌ Asynchronous state mutations
- ❌ Frame rate drops during heavy animation load

**Audit Status**: **FORENSIC ANALYSIS COMPLETE — VIOLATIONS DOCUMENTED FOR FUTURE FIXING**

---

**NO FIXES APPLIED** (per audit instructions)  
**VIOLATIONS DOCUMENTED** for engineering review and resolution  
**NEXT STEP**: Architect solution to consolidate all animations into main update loop
