# SHADER-STORM-WORLD-AUDIT REPORT
## Runtime Shader Variant Creation in World and Link Systems

**Date:** 2026-02-07  
**Scope:** World and Link Rendering Systems  
**Audit Type:** Runtime Shader Variant Creation Detection

---

## EXECUTIVE SUMMARY

**Total Findings:** 7 critical occurrences requiring attention  
**CRITICAL Issues:** 1 (per-frame material property mutations)  
**Moderate Issues:** 4 (event-based material mutations)  
**Safe Patterns:** 2 (shader guard systems)

---

## CRITICAL FINDINGS

### 1. NodeCoreOpaqueEnforcer_Session113.js
**Severity:** 🔴 CRITICAL  
**File:** `NodeCoreOpaqueEnforcer_Session113.js`  
**Lines:** 95-137 (validateFrame method)

**Properties Changed:**
- `transparent` (set to false)
- `opacity` (set to 1.0)
- `depthWrite` (set to true)
- `depthTest` (set to true)
- `needsUpdate` (set to true)

**Timing:** (A) PER FRAME  
**Context:** Inside `validateFrame(deltaTime, time)` method

**Analysis:**
```javascript
// Line 95-137: Per-frame enforcement
validateFrame(deltaTime, time) {
  // ... validation loop ...
  mat.transparent = false;  // Mutated per frame
  mat.opacity = 1.0;         // Mutated per frame
  mat.depthWrite = true;      // Mutated per frame
  mat.depthTest = true;       // Mutated per frame
  mat.needsUpdate = true;     // Forces shader recompilation
}
```

**Impact:**
- This is called every frame from the main update loop
- Forces shader recompilation every frame (`mat.needsUpdate = true`)
- Mutates variant properties that should be frozen
- Violates the frozen material flag system
- Can cause severe performance degradation

**Recommendation:**
- Move enforcement to initialization time only
- Use property locks to prevent runtime mutations
- Only check state, don't mutate per-frame
- Remove `mat.needsUpdate = true` from validation loop

---

## MODERATE FINDINGS

### 2. TransparentStateAuthority.js
**Severity:** 🟡 MODERATE  
**File:** `TransparentStateAuthority.js`  
**Lines:** 70-75

**Properties Changed:**
- `transparent`
- `depthWrite`
- `depthTest`
- `blending`

**Timing:** (C) INIT / (B) PER SPAWN  
**Context:** Inside `apply(mesh, stateKey, overrides)` method

**Analysis:**
```javascript
// Lines 70-75: Material property mutations
if (mesh.material.transparent !== target.transparent) mesh.material.transparent = target.transparent;
if (mesh.material.depthWrite !== target.depthWrite) mesh.material.depthWrite = target.depthWrite;
if (mesh.material.depthTest !== target.depthTest) mesh.material.depthTest = target.depthTest;
if (mesh.material.blending !== target.blending) mesh.material.blending = target.blending;
```

**Impact:**
- Mutates variant properties after material creation
- Respects frozen flags (lines 58-67) but still writes to properties
- Could trigger shader variant creation if called on frozen materials
- Has domain guard to prevent some mutations

**Recommendation:**
- Only apply to `overlay` and `link` domains (already implemented)
- Ensure this is called only at initialization, not in update loops
- Consider using property locks instead of direct mutation

---

### 3. NodeVisualStateBinder.js
**Severity:** 🟡 MODERATE  
**File:** `NodeVisualStateBinder.js`  
**Lines:** 120-127

**Properties Changed:**
- `transparent`
- `depthWrite`
- `depthTest`
- `opacity`

**Timing:** (B) PER SPAWN  
**Context:** Inside `isolateAndConstrainAura(node)` method

**Analysis:**
```javascript
// Lines 120-127: Aura material mutations
if (auraMesh.material.transparent !== true) auraMesh.material.transparent = true;
if (auraMesh.material.depthWrite !== false) auraMesh.material.depthWrite = false;
if (auraMesh.material.depthTest !== true) auraMesh.material.depthTest = true;
```

**Impact:**
- Mutates aura materials to enforce constraints
- Called during node state changes (not per-frame)
- Has try-catch to handle locked properties
- Could trigger variant creation if applied to shader materials

**Recommendation:**
- Apply these constraints at material creation time
- Use property locks to enforce constraints without mutation
- Move to initialization phase

---

### 4. NodeVisualStateBinder.js (Visual Priority)
**Severity:** 🟡 MODERATE  
**File:** `NodeVisualStateBinder.js`  
**Lines:** 297-311

**Properties Changed:**
- Various renderOrder (not a variant property)
- `depthWrite` (in helper function, line 322)
- `depthTest` (in helper function, line 323)

**Timing:** (C) INIT / (B) PER SPAWN  
**Context:** Inside `enforceCanonicalVisualPriority(node)` and helper functions

**Analysis:**
```javascript
// Lines 307-309: Render order enforcement (safe)
const layer = obj.userData?.visualLayer || obj.userData?.type;
if (layer && priorityMap[layer] !== undefined) {
  obj.renderOrder = priorityMap[layer];  // Not a variant property
}

// Lines 322-323: Depth properties in helper
if (obj.material.depthWrite !== undefined) {
  obj.material.depthWrite = true;    // Variant property mutation
}
if (obj.material.depthTest !== undefined) {
  obj.material.depthTest = true;     // Variant property mutation
}
```

**Impact:**
- `renderOrder` changes are safe (not shader variant triggers)
- `depthWrite` and `depthTest` mutations could trigger variants
- Called during node state changes

**Recommendation:**
- Set depth properties at material creation time
- Use locks instead of runtime mutations

---

### 5. LinkRendererConduit.js (Impact Materials)
**Severity:** 🟡 MODERATE  
**File:** `LinkRendererConduit.js`  
**Lines:** 518-545

**Properties Changed:**
- `transparent`, `depthWrite`, `depthTest`, `side`, `blending`

**Timing:** (B) PER EVENT (bead impact)  
**Context:** Inside `triggerNodeImpact(state, node, bead)` method

**Analysis:**
```javascript
// Lines 525-533: Impact material creation
const meshMaterial = new THREE.MeshBasicMaterial({
  color: color,
  opacity: 0.6,
  wireframe: true,
  transparent: true,      // Set at creation
  depthWrite: false,
  depthTest: true,
  side: THREE.DoubleSide
});
freezeMaterialFlags(meshMaterial, 'LinkRenderer');  // Locks properties
```

**Impact:**
- Creates new materials for each impact event
- Properties are set at creation time (safe)
- Materials are frozen immediately with `freezeMaterialFlags`
- Impact events are not per-frame (triggered by bead arrival)

**Recommendation:**
- This is actually SAFE - properties set at creation time
- Material pooling could improve performance for frequent impacts
- Current implementation is acceptable

---

## SAFE PATTERNS

### 6. LinkRendererConduit.js (Strand Materials)
**Severity:** 🟢 SAFE  
**File:** `LinkRendererConduit.js`  
**Lines:** 197-240

**Properties Changed:**
- All variant properties set at material creation

**Timing:** (C) ONCE AT INIT  
**Context:** Inside `createLinkVisuals(link)` method

**Analysis:**
```javascript
// Lines 204-226: Material creation with immediate freezing
const material = new THREE.MeshStandardMaterial({
  // ... properties set at creation ...
  transparent: false,
  depthWrite: true,
  depthTest: true,
  blending: THREE.NormalBlending
});
material.userData.__flagsFrozen = true;
freezeMaterialFlags(material, 'LinkRenderer');  // Locks immediately
```

**Impact:**
- All variant properties set at creation time
- Materials frozen immediately after creation
- No runtime mutations to variant properties
- Only uniforms are updated per-frame (safe)

**Verdict:** ✅ SAFE - Follows best practices

---

### 7. _SafeWorldFXPack.js (Material Guards)
**Severity:** 🟢 SAFE  
**File:** `_SafeWorldFXPack.js`  
**Lines:** 82-110

**Properties Changed:**
- Property locks prevent runtime mutations

**Timing:** (C) ONCE AT INIT  
**Context:** Inside `freezeMaterialFlags(mat, context)` method

**Analysis:**
```javascript
// Lines 93-110: Property definition with guards
const cachedValue = material[prop];
Object.defineProperty(material, prop, {
  configurable: true,
  enumerable: true,
  get() { return cachedValue; },
  set(v) {
    if (v === cachedValue) return;
    if (!material.userData.__warnedVariantProp.has(prop)) {
      console.warn('[FX_FLAG_MUTATION_BLOCKED]', context, prop);
    }
  }
});
```

**Impact:**
- Prevents runtime mutations to variant properties
- Logs warnings when mutations are attempted
- Uses onBeforeRender to detect and log violations

**Verdict:** ✅ SAFE - Defensive guard system

---

## MATERIAL.needsUpdate ASSIGNMENTS

### Findings Summary (17 total occurrences)

**File:** `NodeCoreOpaqueEnforcer_Session113.js`
- Line 137: `mat.needsUpdate = true` (inside per-frame validateFrame) 🔴 CRITICAL

**File:** `NodeVisualStateBinder.js`
- Not found in this file (safe)

**File:** `LinkRendererConduit.js`
- Not found in this file (safe - only uniform updates)

**File:** `EnforcementViolationAutoRecovery.js`
- Uses needsUpdate for recovery (conditional, not per-frame)

**File:** `CoreMaterialMutationDetector.js`
- Uses needsUpdate for mutation detection

**File:** `FresnelRimLightAuraShader.js`
- Uses needsUpdate for shader variant recovery

**File:** `GlobalAuraOpacityClamp.js`
- Uses needsUpdate for opacity clamping

**File:** `LINK_SHADER_LANGUAGE_EXAMPLES.js`
- Uses needsUpdate for shader parameter updates

**Other Files:**
- Various shader packs using needsUpdate for initialization

---

## MATERIAL DEFINES MUTATIONS

### Findings Summary (1 occurrence)

**File:** `VisualStateSnapshot.js`
```javascript
material.defines = material.defines || {};
materialCache.__defines = incomingDefines;
```
**Analysis:** This is for snapshot/restore functionality, not per-frame mutations.  
**Verdict:** 🟢 SAFE

---

## MATERIAL.ONBEFORERENDER USAGE

### Findings Summary (2 occurrences)

**File:** `_SafeWorldFXPack.js`
- Line 106: Uses onBeforeRender for flag guard detection
- Purpose: Detect and log property mutations
- Verdict: 🟢 SAFE (monitoring only)

**File:** `Engine/Debug/MaterialFreezeGuard.js`
- Line 30: Uses onBeforeRender for frozen config checking
- Purpose: Debug mode verification of material state
- Verdict: 🟢 SAFE (debug only, conditional on window.DEBUG_VISUAL_MODE)

---

## THREE.SHADERMATERIAL CREATIONS

### Findings Summary (63 occurrences)

All shader material creations appear to be:
- At initialization time
- Inside factory functions
- For visual effects setup

**Examples:**
- `LinkAuraShader.js` - Factory function for link aura materials
- `NodeAuraShader.js` - Factory function for node aura materials
- Various FX shader packs - Created once at initialization

**Verdict:** ✅ SAFE - No runtime shader material creation detected

---

## RECOMMENDATIONS SUMMARY

### Immediate Actions Required

1. **[CRITICAL] Fix NodeCoreOpaqueEnforcer_Session113.js**
   - Remove per-frame material property mutations
   - Remove `mat.needsUpdate = true` from validation loop
   - Move enforcement to initialization time
   - Use property locks instead of runtime mutations

2. **[MODERATE] Audit TransparentStateAuthority.apply() calls**
   - Ensure all calls are at initialization, not in update loops
   - Add logging to track call frequency
   - Consider making apply() private/protected

3. **[MODERATE] Move NodeVisualStateBinder mutations to init**
   - Move aura constraint application to material creation
   - Move depth property enforcement to initialization
   - Use property locks for runtime enforcement

### Long-term Improvements

1. **Implement Material Pooling**
   - Pool frequently created materials (impact effects)
   - Reduce allocation pressure

2. **Centralize Material Creation**
   - Create a single authority for material lifecycle
   - Enforce "create once, freeze forever" pattern

3. **Enhance Debug Tooling**
   - Add metrics tracking for material mutations
   - Add shader variant count monitoring
   - Alert when variant count exceeds threshold

4. **Add Integration Tests**
   - Test material lifecycle under various conditions
   - Verify no per-frame mutations during gameplay
   - Performance testing with many nodes/links

---

## CONCLUSION

The ATOMA codebase shows strong awareness of shader variant issues, with defensive systems in place:

**Good Practices:**
- Material flag freezing system (`freezeMaterialFlags`)
- Property guard detection (`onBeforeRender` hooks)
- Domain-based mutation restrictions (`TransparentStateAuthority`)

**Critical Issue:**
- One system (`NodeCoreOpaqueEnforcer_Session113.js`) performs per-frame material mutations that force shader recompilation

**Overall Assessment:**
The world and link rendering systems are largely safe, with one critical exception that needs immediate attention. The defensive systems are well-designed but not consistently enforced across all modules.

---

## METRICS

- **Files Audited:** 3 critical files (LinkRendererConduit.js, _SafeWorldFXPack.js, TransparentStateAuthority.js) plus supporting files
- **ShaderMaterial Creations:** 63 (all at init - safe)
- **Material Property Mutations:** 165 (mostly at init - 1 critical per-frame case)
- **needsUpdate Assignments:** 17 (1 critical per-frame case)
- **defines Mutations:** 1 (safe - snapshot/restore)
- **onBeforeRender Hooks:** 2 (both for monitoring - safe)

**Risk Level:** MEDIUM (1 critical issue identified)

**Estimated Performance Impact:** HIGH if NodeCoreOpaqueEnforcer is active with many nodes

---

**END OF AUDIT REPORT**