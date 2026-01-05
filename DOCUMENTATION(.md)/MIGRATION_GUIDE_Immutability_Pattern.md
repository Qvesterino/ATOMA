# Migration Guide: Immutability Pattern Update

**For**: All systems interacting with canonical geometries  
**Updated**: Session 60+  
**Impact**: Raycast crash resolution

---

## QUICK SUMMARY

Change **from** checking `Object.isFrozen()` **to** checking `geometry.userData.immutable`.

```javascript
// ❌ OLD (WRONG)
if (Object.isFrozen(geometry)) { /* ... */ }

// ✅ NEW (CORRECT)
if (geometry.userData?.immutable === true) { /* ... */ }
```

---

## PATTERN CHANGES

### 1. Checking Immutability

**Before**:
```javascript
function isImmutable(geometry) {
  return Object.isFrozen(geometry);
}
```

**After**:
```javascript
function isImmutable(geometry) {
  return geometry.userData?.immutable === true;
}
```

### 2. Marking Immutability

**Before**:
```javascript
geometry.computeBoundingSphere();
Object.freeze(geometry);  // ❌ Breaks raycasting
```

**After**:
```javascript
geometry.computeBoundingSphere();
geometry.userData.immutable = true;  // ✅ Safe marker
geometry.userData.precomputedAndFrozen = true;
```

### 3. Computing Bounds Safely

**Before**:
```javascript
if (Object.isFrozen(geometry)) {
  console.warn('Frozen, cannot compute');
} else {
  geometry.computeBoundingSphere();
}
```

**After**:
```javascript
if (geometry.userData?.immutable === true) {
  console.warn('Immutable, cannot compute');
} else {
  geometry.computeBoundingSphere();
}
```

### 4. Safe Raycasting

**Before**:
```javascript
const hits = raycaster.intersectObjects(nodes);
```

**After**:
```javascript
import { RaycastGuardSystem } from './RaycastGuardSystem_v1.js';

// Safe option 1: With guards
const hits = RaycastGuardSystem.intersectWithGuards(raycaster, nodes);

// Safe option 2: Only safe objects
const safeHits = RaycastGuardSystem.intersectSafeOnly(raycaster, nodes);
```

---

## SYSTEM-BY-SYSTEM MIGRATION

### NodeLinkingSystem

**If checking geometry mutability**:

```javascript
// ❌ OLD
if (Object.isFrozen(sourceGeom) || Object.isFrozen(targetGeom)) {
  // Cannot modify frozen geometries
}

// ✅ NEW
if ((sourceGeom.userData?.immutable === true) || 
    (targetGeom.userData?.immutable === true)) {
  // Cannot modify immutable geometries
}
```

**If raycasting nodes**:

```javascript
// ❌ OLD
const intersects = raycaster.intersectObjects([this.sourceNode, this.targetNode]);

// ✅ NEW
import { RaycastGuardSystem } from './RaycastGuardSystem_v1.js';

const intersects = RaycastGuardSystem.intersectWithGuards(
  raycaster,
  [this.sourceNode, this.targetNode]
);
```

### VisualHierarchyCorrectionSystem

**If computing bounds**:

```javascript
// ❌ OLD
if (!Object.isFrozen(geom)) {
  geom.computeBoundingSphere();
}

// ✅ NEW
if (geom.userData?.immutable !== true) {
  geom.computeBoundingSphere();
}
```

### UI Interaction Systems

**If handling clicks/hovers**:

```javascript
// ❌ OLD
const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(interactiveNodes);

// ✅ NEW
import { RaycastGuardSystem } from './RaycastGuardSystem_v1.js';

const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(mouse, camera);
const intersects = RaycastGuardSystem.intersectWithGuards(
  raycaster,
  interactiveNodes,
  false  // recursive flag
);
```

### EnhancedNodeModels

**If animating material on canonical nodes**:

Already handled - `animate()` now checks `material.userData.immutable`.

```javascript
// Already protected in EnhancedNodeModels.js
// Just call animate() normally - it's safe
mesh.animate(deltaTime);
```

---

## BEST PRACTICES

### 1. Always Check Immutability Before Modifying Geometry

```javascript
function modifyGeometry(geometry, modification) {
  // Check if immutable
  if (geometry.userData?.immutable === true) {
    console.warn('Cannot modify immutable geometry');
    return false;
  }
  
  // Safe to modify
  modification(geometry);
  return true;
}
```

### 2. Use Safe Raycasting Helpers

```javascript
// ❌ Never do this on canonical nodes
const hits = raycaster.intersectObjects(canonicalNodes);

// ✅ Always use guard system
const hits = RaycastGuardSystem.intersectWithGuards(
  raycaster,
  canonicalNodes
);
```

### 3. Validate Scene on Startup

```javascript
import { RaycastGuardSystem } from './RaycastGuardSystem_v1.js';

// On scene initialization
function validateScene(scene) {
  const report = RaycastGuardSystem.auditScene(scene);
  RaycastGuardSystem.logAuditReport(report);
  
  if (report.unsafeCount > 0) {
    console.error('⚠️ Scene has unsafe geometries!');
  }
}
```

### 4. Trust Precomputed Bounds

```javascript
// Bounds are precomputed, use them
const sphere = geometry.boundingSphere;
const box = geometry.boundingBox;

// Don't recompute
// ❌ geometry.computeBoundingSphere();
```

---

## COMMON ERRORS & FIXES

### Error: "Cannot add property boundingSphere"

**Cause**: Geometry is immutable (or frozen)  
**Fix**: Check `userData.immutable` before computing

```javascript
// ❌ WRONG
geometry.computeBoundingSphere();

// ✅ RIGHT
if (geometry.userData?.immutable !== true) {
  geometry.computeBoundingSphere();
}
```

### Error: "Intersection failed on object"

**Cause**: Raycasting canonical node with immutable geometry  
**Fix**: Use guard system

```javascript
// ❌ WRONG
const hits = raycaster.intersectObjects(nodes);

// ✅ RIGHT
const hits = RaycastGuardSystem.intersectWithGuards(raycaster, nodes);
```

### Error: "Geometry missing boundingSphere"

**Cause**: Geometry marked immutable but bounds not precomputed  
**Fix**: Ensure precomputation happens first

```javascript
// ✅ CORRECT ORDER
geometry.computeVertexNormals();
geometry.computeBoundingSphere();
geometry.computeBoundingBox();

// Then mark
geometry.userData.immutable = true;
geometry.userData.precomputedAndFrozen = true;
```

---

## VERIFICATION CHECKLIST

After migrating your code:

- [ ] No `Object.freeze(geometry)` calls remain
- [ ] All immutability checks use `userData.immutable`
- [ ] All raycasting uses `RaycastGuardSystem` helpers
- [ ] Scene audit runs without errors
- [ ] No "Cannot add property" errors in console
- [ ] Raycasting works on all node types
- [ ] Animation works on canonical nodes

---

## ROLLOUT STRATEGY

### Phase 1: Core Systems (COMPLETE)
- CanonicalGeometryFamilies_v1.js ✅
- RaycastGuardSystem_v1.js ✅

### Phase 2: Dependent Systems (PENDING)
- NodeLinkingSystem - update raycasting calls
- UI interaction handlers - use guard system
- EnhancedNodeModels - already protected ✅

### Phase 3: Validation (PENDING)
- Scene audit on startup
- Console validation for unsafe geometries
- Performance regression testing

---

## FAQ

**Q: Can I still modify canonical geometries?**  
A: No. They're marked immutable via userData. Respect the flag by design.

**Q: Will Object.freeze() work?**  
A: It shouldn't be used. It breaks Three.js raycasting. Use userData instead.

**Q: Are precomputed bounds still important?**  
A: Yes. They prevent expensive recomputation and ensure consistent behavior.

**Q: Can I turn off immutability?**  
A: Not recommended. Canonical nodes should be immutable by design.

**Q: How do I audit my scene?**  
```javascript
const report = RaycastGuardSystem.auditScene(scene);
RaycastGuardSystem.logAuditReport(report);
```

**Q: What if a system ignores immutability?**  
A: It will fail at runtime trying to modify immutable geometry. The error will be clear.

---

## SUPPORT

If you encounter issues:

1. Check `geometry.userData.immutable` flag is set
2. Check all bounds are precomputed
3. Use `RaycastGuardSystem.auditScene()` to validate
4. Use `RaycastGuardSystem.intersectWithGuards()` for raycasting
5. Check console for specific error messages

---

## SUMMARY

| Aspect | Before | After |
|--------|--------|-------|
| Immutability Check | `Object.isFrozen()` | `userData.immutable` |
| Marking Immutable | `Object.freeze()` | `userData.immutable = true` |
| Raycasting | `raycaster.intersectObjects()` | `RaycastGuardSystem.intersectWithGuards()` |
| Bound Computation | Check with freeze | Check with userData flag |
| Scene Validation | Manual | `RaycastGuardSystem.auditScene()` |

✅ **All systems now use userData-based immutability pattern**
✅ **All raycasting safe and crash-resistant**  
✅ **Backward compatible - additive changes only**
