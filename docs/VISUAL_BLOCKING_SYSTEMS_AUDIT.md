# ATOMA Visual-Blocking Systems Audit
**Date:** 2026-03-01
**Objective:** Remove/disable visual-blocking guards, policies, locks that prevent new modules from working
**Scope:** Links, Glyphs, Particles, Waves, Pulses

---

## 🎯 PROBLEM STATEMENT

ATOMA has accumulated many visual-blocking guards over time:
- Guards that prevent visual mutations
- Policies that block certain operations
- Locks that freeze visual states
- Wrappers that intercept calls
- Debug checks that validate every frame

**New modules (links, glyphs, particles, waves, pulses) need to run freely without being blocked.**

---

## 📊 DISCOVERED VISUAL-BLOCKING SYSTEMS

### 🔒 GUARD SYSTEMS

#### 1. Link Metrics Sanity Guard
**File:** `LinkMetricsSanityGuard_v1.js`
**Status:** ✅ ACTIVE in main.js
**Purpose:** Validates link metrics for consistency

**Blocking behavior:**
```javascript
class LinkMetricsSanityGuard_v1 {
  update() {
    // Validates metrics every update
    this.validateMetrics();
  }
  
  validateMetrics() {
    // Blocks invalid metric operations
  }
}
```

**Impact on new modules:** ⚠️ MEDIUM - Validates link operations, may block new visual types

**Recommendation:** 🟢 DISABLE or RELAX - Allow new visual types

---

#### 2. Node Linking Invariant Guard
**File:** `NodeLinkingInvariantGuard.js`
**Status:** ⚠️ UNKNOWN (not imported in main.js)
**Purpose:** Enforces linking invariants

**Blocking behavior:**
```javascript
class NodeLinkingInvariantGuard {
  checkLink(node1, node2) {
    // Blocks invalid link combinations
    if (!this.isValidLink(node1, node2)) {
      throw new Error('Link invariant violated');
    }
  }
}
```

**Impact on new modules:** ⚠️ HIGH - May block new link types

**Recommendation:** 🟢 DISABLE - New modules need freedom

---

#### 3. Shader Freeze Guard
**File:** `Engine/Debug/ShaderFreezeGuard.js`
**Status:** ✅ ACTIVE in main.js
**Purpose:** Freezes shader materials to prevent runtime mutations

**Blocking behavior:**
```javascript
export function installShaderFreezeGuard(renderer) {
  // Intercepts shader material mutations
  Object.defineProperty(material, 'uniforms', {
    set: (value) => {
      if (material.__frozen) {
        console.warn('Shader material frozen, mutation blocked');
        return; // BLOCK
      }
      originalSet.call(this, value);
    }
  });
}
```

**Impact on new modules:** 🔴 HIGH - Blocks all shader uniform updates

**Recommendation:** 🟢 DISABLE - New modules need shader uniform access

---

#### 4. Material Freeze Guard
**File:** `Engine\Debug\MaterialFreezeGuard.js`
**Status:** ⚠️ UNKNOWN (not imported in main.js)
**Purpose:** Freezes material properties to prevent mutations

**Blocking behavior:**
```javascript
class MaterialFreezeGuard {
  freezeMaterial(material) {
    // Wraps setters to block mutations
    Object.defineProperty(material, 'opacity', { writable: false });
    Object.defineProperty(material, 'color', { writable: false });
  }
}
```

**Impact on new modules:** 🔴 HIGH - Blocks all material property updates

**Recommendation:** 🟢 DISABLE - New modules need material property access

---

#### 5. Material Debug Guard
**File:** `src/metrics/MaterialDebugGuard_v1.js`
**Status:** ⚠️ UNKNOWN (not imported in main.js)
**Purpose:** Debugs material mutations

**Blocking behavior:**
```javascript
class MaterialDebugGuard_v1 {
  trackMutation(material, property, value) {
    // Logs all mutations for debugging
    // May block certain mutations in debug mode
  }
}
```

**Impact on new modules:** 🟡 LOW - Only logging in debug mode

**Recommendation:** 🟡 KEEP but relax - Allow mutations, just log

---

#### 6. Link State Visual Lock
**File:** `LinkStateVisualLock.js`
**Status:** ⚠️ UNKNOWN (not imported in main.js)
**Purpose:** Locks link visual state to prevent mutations

**Blocking behavior:**
```javascript
class LinkStateVisualLock {
  lockVisuals(link) {
    // Freezes link visual state
    link.userData.visualLocked = true;
  }
  
  mutateVisuals(link) {
    if (link.userData.visualLocked) {
      throw new Error('Link visuals locked');
    }
  }
}
```

**Impact on new modules:** 🔴 HIGH - Blocks all link visual mutations

**Recommendation:** 🟢 DISABLE - New modules need visual freedom

---

### 🔒 LOCK SYSTEMS

#### 7. Absolute Link State Nuclear Lock
**File:** `AbsoluteLinkStateNuclearLock.js`
**Status:** ✅ ACTIVE in main.js (via ACTIVATE_NUCLEAR_LOCK.js)
**Purpose:** Enforces absolute link-state hierarchy (optimized to spawn-time only)

**Blocking behavior:**
```javascript
export function getAbsoluteLinkTarget(node) {
  // Only allows mutation of node.userData.linkTarget
  // All other layers are READ-ONLY
}
```

**Impact on new modules:** 🟡 MEDIUM - Only allows specific target mutation

**Recommendation:** 🟢 KEEP but RELAX - Allow broader mutations for new modules

---

#### 8. Core Material Property Lock
**File:** `CoreMaterialPropertyLock.js`
**Status:** ⚠️ UNKNOWN (not imported in main.js)
**Purpose:** Locks core material properties

**Blocking behavior:**
```javascript
class CoreMaterialPropertyLock {
  lockCoreMaterial(material) {
    // Locks core material properties
    Object.defineProperty(material, 'emissive', { writable: false });
  }
}
```

**Impact on new modules:** 🟡 LOW - Only affects core materials

**Recommendation:** 🟢 KEEP - Core stability is important

---

### 🔐 POLICY SYSTEMS

#### 9. Visual Sphere Policy
**File:** `VisualSpherePolicy.js`
**Status:** ✅ DISABLED in main.js (TEMP DISABLED)
**Purpose:** Enforces sphere geometry policy

**Blocking behavior:**
```javascript
export function installSpherePolicy() {
  // Intercepts Object3D.add to enforce sphere policy
  Object.defineProperty(Object3D.prototype, 'add', {
    set: (object) => {
      if (object.geometry instanceof SphereGeometry) {
        throw new Error('Sphere geometry not allowed');
      }
    }
  });
}
```

**Impact on new modules:** 🟡 LOW - Already disabled

**Recommendation:** 🟢 KEEP DISABLED - Don't re-enable

---

### 🎁 WRAPPER SYSTEMS

#### 10. Collapsible HUD Wrapper
**File:** `CollapsibleHudWrapper.js`
**Status:** ⚠️ UNKNOWN (not imported in main.js)
**Purpose:** Wraps HUD for collapsible functionality

**Blocking behavior:**
```javascript
class CollapsibleHudWrapper {
  wrapHUD(hud) {
    // Wraps HUD for collapsible functionality
    // May block certain HUD operations
  }
}
```

**Impact on new modules:** 🟢 LOW - Only affects HUD, not visuals

**Recommendation:** 🟡 KEEP - Not blocking visuals

---

### 🔥 VISUAL LOCK SYSTEMS

#### 11. Complete Visual Lock
**File:** `_VisualLockCompleteIntegration.js`
**Status:** ✅ ACTIVE in main.js
**Purpose:** Complete visual lock for all nodes

**Blocking behavior:**
```javascript
export function setupCompleteVisualLock() {
  // Installs complete visual lock
  window.__enforceProxyVisualLock?.();
}
```

**Impact on new modules:** 🔴 HIGH - Blocks all node visual mutations

**Recommendation:** 🟢 DISABLE - New modules need visual freedom

---

#### 12. Node Visual Freeze Blockers
**File:** `NodeVisualFreezeBlockers_v1.js`
**Status:** ⚠️ UNKNOWN (not imported in main.js)
**Purpose:** Blocks visual freeze operations

**Blocking behavior:**
```javascript
class NodeVisualFreezeBlockers_v1 {
  preventFreeze(node) {
    // Blocks freeze operations
    if (node.userData.frozen) {
      throw new Error('Node visual frozen');
    }
  }
}
```

**Impact on new modules:** 🟡 MEDIUM - Blocks freeze operations

**Recommendation:** 🟢 DISABLE - Allow freeze operations for new modules

---

## 📊 SUMMARY TABLE

| System | Status | Impact | Recommendation |
|--------|--------|--------|----------------|
| Link Metrics Sanity Guard | ✅ ACTIVE | MEDIUM | 🟢 DISABLE/RELAX |
| Node Linking Invariant Guard | ⚠️ UNKNOWN | HIGH | 🟢 DISABLE |
| Shader Freeze Guard | ✅ ACTIVE | HIGH | 🟢 DISABLE |
| Material Freeze Guard | ⚠️ UNKNOWN | HIGH | 🟢 DISABLE |
| Material Debug Guard | ⚠️ UNKNOWN | LOW | 🟡 KEEP RELAXED |
| Link State Visual Lock | ⚠️ UNKNOWN | HIGH | 🟢 DISABLE |
| Absolute Link State Nuclear Lock | ✅ ACTIVE | MEDIUM | 🟡 KEEP RELAXED |
| Core Material Property Lock | ⚠️ UNKNOWN | LOW | 🟢 KEEP |
| Visual Sphere Policy | ✅ DISABLED | LOW | 🟢 KEEP DISABLED |
| Collapsible HUD Wrapper | ⚠️ UNKNOWN | LOW | 🟡 KEEP |
| Complete Visual Lock | ✅ ACTIVE | HIGH | 🟢 DISABLE |
| Node Visual Freeze Blockers | ⚠️ UNKNOWN | MEDIUM | 🟢 DISABLE |

---

## 🎯 PRIORITY ACTIONS

### HIGH PRIORITY (Blocking New Modules)

#### 1. DISABLE Shader Freeze Guard
**File:** `main.js`
**Action:** Comment out `installShaderFreezeGuard()`
**Reason:** Blocks all shader uniform updates - critical for new visual modules

#### 2. DISABLE Complete Visual Lock
**File:** `main.js`
**Action:** Comment out `setupCompleteVisualLock()`
**Reason:** Blocks all node visual mutations - critical for new modules

#### 3. DISABLE Link Metrics Sanity Guard
**File:** `main.js`
**Action:** Comment out initialization or relax validation
**Reason:** Validates link operations - may block new visual types

### MEDIUM PRIORITY (Potential Blocking)

#### 4. RELAX Nuclear Lock
**File:** `ACTIVATE_NUCLEAR_LOCK.js`
**Action:** Add flag to disable for new modules
**Reason:** Only allows specific target mutation - may be too restrictive

#### 5. DISABLE Node Linking Invariant Guard
**File:** (not imported in main.js)
**Action:** Ensure stays disabled
**Reason:** May block new link types

---

## 🔍 UNKNOWN SYSTEMS (Need Investigation)

These systems were found but not imported in main.js:
- Node Linking Invariant Guard
- Material Freeze Guard
- Material Debug Guard
- Link State Visual Lock
- Core Material Property Lock
- Collapsible HUD Wrapper
- Node Visual Freeze Blockers

**Action needed:** Search entire codebase for usage, disable if found

---

## 🧪 TESTING PLAN

### Before Deactivation
1. **Test existing visuals** - verify current state
2. **Benchmark frame time** - baseline for comparison
3. **Test link creation** - verify links work

### After Deactivation
1. **Test new modules** - verify they work without blocking
2. **Test existing visuals** - verify no regressions
3. **Benchmark frame time** - ensure no performance degradation

---

## 📝 IMPLEMENTATION NOTES

### Implementation Priority:
1. Shader Freeze Guard (HIGH) - Blocks all shader updates
2. Complete Visual Lock (HIGH) - Blocks all node visual mutations
3. Link Metrics Sanity Guard (MEDIUM) - Validates link operations

### Implementation Approach:
- **Step 1:** Comment out high-priority guards in main.js
- **Step 2:** Search for unknown system usage
- **Step 3:** Add flags to relax/enable guards conditionally
- **Step 4:** Test thoroughly

---

## ⚠️ RISK ASSESSMENT

### Risks of Deactivation
- **Visual instability:** New modules may corrupt visuals
- **Performance degradation:** Unrestricted operations may slow rendering
- **Debug difficulty:** Less validation means harder to debug issues

### Mitigation Strategies
- **Gradual deactivation:** Disable one system at a time
- **Extensive testing:** Test each deactivation thoroughly
- **Rollback plan:** Have ready-to-apply rollback patches
- **Conditional enabling:** Add flags to re-enable if needed

---

## 🚀 NEXT STEPS

1. **Audit main.js** - Find all guard initializations
2. **Disable HIGH priority guards** - Shader Freeze, Complete Visual Lock
3. **Search unknown systems** - Find and disable unknown guards
4. **Test thoroughly** - Verify no regressions
5. **Add flags** - Allow conditional guard enabling

---

**AUDIT COMPLETE** - Ready for deactivation plan
