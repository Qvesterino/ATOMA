# SHADER VARIANT CLEAN - REMAINING WORK

**Phase:** SHADER-VARIANT-CLEAN  
**Status:** 75% Complete  
**Date:** 2025-02-09

---

## ✅ COMPLETED REFACTORING

The following systems have been successfully refactored to validation-only:

1. **TransparentStateAuthority.js** - Now validator-only, no mutations
2. **VisualAuthority.js** - autoRepair disabled for variant props
3. **CoreVisualAuthoritySystem.js** - Validation-only mode with debug logging

---

## ❌ FILES STILL NEEDING REFACTORING

### 1. _VisualRootAutoRegister.js

**Current Runtime Mutations:**
```javascript
visualRoot.material.transparent = true;
visualRoot.material.depthTest = false;
visualRoot.material.depthWrite = false;
```

**Action Required:**
- Remove runtime flag mutations
- Ensure materials are pre-created with correct flags
- Convert to validation-only pattern

**Priority:** HIGH

---

### 2. NodeSurfaceDominanceRule_v1.js

**Current Runtime Mutations:**
```javascript
node.material.depthWrite = this.rules.enableNodeDepthWrite;
node.material.depthTest = this.rules.forceNodeDepthTest;
auraMesh.material.depthWrite = false;
```

**Action Required:**
- Convert to validation-only system
- Follow pattern from CoreVisualAuthoritySystem.js
- Log violations in debug mode, don't mutate

**Priority:** HIGH

---

### 3. EXTREMENormalization.js

**Current Runtime Mutations:**
```javascript
container.material.depthTest = false;
container.material.depthWrite = false;
```

**Action Required:**
- Ensure materials are created with correct flags initially
- Remove runtime mutations
- Consider if normalization is still needed

**Priority:** MEDIUM

---

## 📊 CURRENT STATE

### Safe Operations (Keep As-Is)

✅ **Material Creation** - Setting flags during `new THREE.Material()`  
✅ **needsUpdate** - Not a shader variant property, safe to use  
✅ **Read-Only Checks** - Validation/audit code that only reads properties  

### Runtime Mutations Found: 101 Total

- **0** critical systems (refactored)
- **3** files still need refactoring
- **98** safe operations (creation, needsUpdate, read-only)

---

## 🎯 EXPECTED FINAL STATE

After completing remaining refactoring:

```
Total Runtime Variant Mutations: 0
├── transparent: 0
├── depthWrite: 0
├── depthTest: 0
├── blending: 0
├── side: 0
└── needsUpdate: (allowed, not a variant property)
```

**Result:** `renderer.info.programs.length` will stabilize at runtime.

---

## 🔧 REFACTORING PATTERN

### Before (Mutation)
```javascript
if (mesh.material.transparent !== expected) {
  mesh.material.transparent = expected;  // ❌ Causes shader recompile
}
```

### After (Validation)
```javascript
if (mesh.material.transparent !== expected) {
  if (DEBUG_MODE) {
    console.warn('Material flag incorrect', {
      property: 'transparent',
      actual: mesh.material.transparent,
      expected: expected
    });
  }
  // ✅ No mutation - material must be created correctly
}
```

---

## 📋 VERIFICATION CHECKLIST

Before considering phase complete:

- [ ] Refactor _VisualRootAutoRegister.js
- [ ] Refactor NodeSurfaceDominanceRule_v1.js
- [ ] Refactor EXTREMENormalization.js
- [ ] Run codebase search for remaining mutations
- [ ] Verify renderer.info.programs.length stabilizes
- [ ] Test with debug logging enabled

---

## 📁 RELATED DOCUMENTATION

- **Full Report:** `docs/SHADER_VARIANT_CLEAN_REPORT.md`
- **Variant Properties:** transparent, depthWrite, depthTest, blending, side
- **Safe Properties:** needsUpdate, opacity, emissiveIntensity, color, uniforms

---

**Last Updated:** 2025-02-09  
**Next Review:** After completing remaining 3 files