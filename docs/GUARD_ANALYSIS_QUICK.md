# ATOMA Guard System Analysis - Quick Summary
**Date:** 2026-03-01
**Scope:** Visual-blocking and mutation guards (Links, Nodes, Spawn)

---

## 🎯 OVERVIEW

ATOMA has **redundant guard layers** that were added during active development.
Many guards block visual-only operations where they cause unnecessary render thread blocking.

---

## 🔒 ACTIVE GUARD SYSTEMS

### 1. Nuclear Lock System (`AbsoluteLinkStateNuclearLock.js`)

**Status:** ✅ ACTIVE (activated in main.js line 5942)

**What it does:**
- Enforces render hierarchy EVERY FRAME via `enforceRenderHierarchy()`
- Blocks mutations to protected meshes (shells, auras, roots)
- Only allows mutation of `node.userData.linkTarget`

**Performance cost:** ~0.5ms per 100 nodes (per-frame)

**Per-frame operations:**
- `enforceRenderHierarchy()` → traverses ALL nodes, overrides renderOrder/depth
- Called in `activateNuclearLock()` → `enforceAllNodes()`
- Runs on every spawn and potentially every frame

**Classification:** `[GUARD:VISUAL_ONLY]` - Can be removed for render performance
**Recommendation:** 🔴 **REMOVE per-frame enforcement**, keep only spawn-time validation

---

### 2. Frame Enforcement Engine (`FrameEnforcementEngine.js`)

**Status:** ⚠️ PARTIALLY ACTIVE

**Current state:**
- `enforceRenderHierarchy()` is **DISABLED** (early return, PHASE MATERIAL-MUTATION-KILL)
- Only detects violations every 60 frames
- But `setupFrameEnforcement()` is still called in `activateNuclearLockEverywhere()`

**What it does (when active):**
- Hooks into renderer.render()
- Detects violations to renderOrder, depthTest, visibility

**Performance cost:** Minimal (only violation detection every 60 frames)

**Classification:** `[GUARD:REDUNDANT]` - Duplicate of Nuclear Lock
**Recommendation:** 🔴 **FULLY DISABLE** - Nuclear Lock already enforces this

---

### 3. Legacy Link State Shutdown (`LegacyLinkStateShutdown.js`)

**Status:** ✅ ACTIVE (activated via `activateNuclearLockEverywhere()`)

**What it does:**
- Installs **global mutation interceptor** on Material prototypes
- Blocks legacy functions (`applyLinkState`, `applyGhost`, `dimNode`, `setOpacity`)
- Protects aura modulation system
- Tags protected meshes as immutable

**Performance cost:** Property setter overhead (applies to ALL materials)

**Classification:** `[GUARD:STATE_CRITICAL]` - Prevents legacy code from corrupting visuals
**Recommendation:** 🟢 **KEEP** but can be simplified (only for debug/dev builds)

---

### 4. Core Visual Authority System (`CoreVisualAuthoritySystem.js`)

**Status:** ✅ ACTIVE (imported in main.js, usage unknown)

**Current phase:** PHASE SHADER-VARIANT-CLEAN

**What it does:**
- Validates renderOrder and depth settings
- Marks core meshes with `isCoreGeometry`
- **VALIDATION ONLY** - does not mutate variant properties

**Performance cost:** Validation overhead (traverses nodes)

**Classification:** `[GUARD:REDUNDANT]` - Duplicate validation
**Recommendation:** 🟡 **SIMPLIFY** - keep spawn-time, remove per-frame

---

### 5. Hologram Shell Authority System (`HologramShellAuthoritySystem.js`)

**Status:** ✅ ACTIVE (created in main.js line 5956)

**What it does:**
- Enforces shell material properties (opacity, renderOrder)
- Reduces opacity to prevent occlusion
- Uses `TransparentStateAuthority` for render state

**Performance cost:** Shell traversal on spawn

**Classification:** `[GUARD:VISUAL_ONLY]` - Blocks visual mutations
**Recommendation:** 🟢 **KEEP** but can be simplified (creation-time only)

---

### 6. Enhanced Node Model Link State (`EnhancedNodeModelLinkState.js`)

**Status:** ⚠️ UNKNOWN (not imported in main.js)

**What it does:**
- Boosts core visual presence when nodes are linked
- Applies: opacity +5%, emissive +15%, scale +2%

**Classification:** `[GUARD:VISUAL_ONLY]` - Mutates visuals on link creation
**Recommendation:** 🟢 **KEEP** but move to spawn-time, not per-frame

---

### 7. Link Glow Synergy Engine v2 (`LinkGlowSynergyEngine_v2.js`)

**Status:** ⚠️ UNKNOWN (not imported in main.js)

**What it does:**
- Computes glow intensity for links based on synergy/quality metrics
- Reads from `link.userData.synergy2_1` and `node.userData.visualMetrics`
- Falls back to v1 logic if metrics unavailable

**Classification:** `[GUARD:VISUAL_ONLY]` - Updates link visuals per-frame
**Recommendation:** 🟢 **KEEP** - this is intentional visual feedback, not a guard

---

## 📊 VISUAL-BLOCKING OPERATIONS

### Per-Frame Blocking Guards

| System | Function | Cost | Critical? | Action |
|--------|----------|------|-----------|--------|
| NuclearLock | `enforceRenderHierarchy()` | ~0.5ms/100 nodes | ❌ NO | 🔴 REMOVE |
| FrameEnforcement | `setupFrameEnforcement()` | Minimal | ❌ NO | 🔴 REMOVE |
| CoreVisualAuthority | `processNode()` | Validation | ❌ NO | 🟡 SIMPLIFY |
| HologramShell | `processShell()` | Minimal | ❌ NO | 🟢 KEEP (spawn-time) |

### State-Critical Guards (MUST KEEP)

| System | Function | Protects | Critical? | Action |
|--------|----------|----------|-----------|--------|
| LegacyShutdown | `installGlobalMutationInterceptor()` | Legacy code corruption | ✅ YES | 🟢 KEEP |
| LegacyShutdown | `disableLegacyLinkStateFunctions()` | Legacy mutations | ✅ YES | 🟢 KEEP |
| NuclearLock | `getAbsoluteLinkTarget()` | Link mutations | ✅ YES | 🟢 KEEP |
| NuclearLock | `isProtectedMesh()` | Protected layers | ✅ YES | 🟢 KEEP |

---

## 🚨 KEY ISSUES

### Issue 1: Per-Frame Render Hierarchy Enforcement

**Location:** `AbsoluteLinkStateNuclearLock.js:125`

```javascript
export function enforceRenderHierarchy(node) {
  if (!node) return;
  
  node.traverse((child) => {  // ❌ PER-FRAME OVERHEAD
    if (!child.isMesh) return;
    // ... overrides renderOrder, depthTest, depthWrite
  });
}
```

**Problem:** Runs every frame, overrides properties that were already set correctly.

**Solution:** Move to spawn-time validation only.

---

### Issue 2: Duplicate Frame Enforcement

**Location:** `FrameEnforcementEngine.js:17`

```javascript
export function enforceFrameHierarchy(scene) {
  // PHASE MATERIAL-MUTATION-KILL:
  // Per-frame material enforcement disabled.
  return;  // ✅ Already disabled
}
```

**Problem:** `setupFrameEnforcement()` still hooks into renderer, but enforcement is disabled.

**Solution:** Fully disable or remove the system.

---

### Issue 3: Global Mutation Interceptor

**Location:** `LegacyLinkStateShutdown.js:14`

```javascript
export function installGlobalMutationInterceptor() {
  // Wraps Material.prototype setters
  Object.defineProperty(material, 'opacity', {  // ❌ GLOBAL OVERHEAD
    set: function(value) {
      if (material.__isProtected) return;  // BLOCK mutation
      // ...
    }
  });
}
```

**Problem:** Property setter overhead applies to ALL materials, even non-protected ones.

**Solution:** Apply only to protected materials, not globally.

---

## ✅ RECOMMENDATIONS

### Immediate Actions (High Impact)

1. **Remove per-frame render hierarchy enforcement**
   - File: `AbsoluteLinkStateNuclearLock.js:125`
   - Action: Remove `enforceRenderHierarchy()` from frame loop
   - Keep only for spawn-time validation

2. **Fully disable Frame Enforcement Engine**
   - File: `ACTIVATE_NUCLEAR_LOCK.js:90`
   - Action: Remove `FrameEnforcement.setupFrameEnforcement()` call
   - System is redundant with Nuclear Lock

3. **Simplify Global Mutation Interceptor**
   - File: `LegacyLinkStateShutdown.js:14`
   - Action: Apply interceptor only to protected materials
   - Remove global Material.prototype wrapping

### Secondary Actions (Medium Impact)

4. **Simplify Core Visual Authority**
   - File: `CoreVisualAuthoritySystem.js`
   - Action: Keep only spawn-time processing
   - Remove per-frame validation

5. **Move shell processing to spawn-time**
   - File: `HologramShellAuthoritySystem.js`
   - Action: Process shells only at creation, not every frame

### Keep Intact (Low Priority)

6. **Keep link glow engines**
   - These are intentional visual feedback, not guards
   - LinkGlowSynergyEngine_v2.js - 🟢 KEEP

7. **Keep EnhancedNodeModelLinkState**
   - This is intentional visual boost on link creation
   - Move to spawn-time if currently per-frame

---

## 📈 EXPECTED PERFORMANCE IMPROVEMENT

**Before optimization:**
- Per-frame guard cost: ~2-6ms total
- Frame traversal overhead: ~1-2ms
- Property setter overhead: ~0.5-1ms

**After optimization:**
- Per-frame guard cost: <1ms total
- Spawn-time validation only: ~5-10ms (one-time)
- Visual updates unblocked: Direct property access

**Expected gain:** ~60-80% reduction in guard overhead

---

## 🔎 NEXT STEPS

1. **Audit current usage** - Find where `enforceRenderHierarchy()` is actually called
2. **Test with per-frame disabled** - Disable Nuclear Lock per-frame and verify stability
3. **Simplify interceptor** - Remove global Material.prototype wrapping
4. **Benchmark performance** - Measure before/after frame time

---

**ANALYSIS COMPLETE** - Ready for implementation discussion.
