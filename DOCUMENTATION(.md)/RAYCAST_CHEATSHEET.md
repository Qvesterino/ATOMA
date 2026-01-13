# Raycast Engine: Quick Cheat Sheet

---

## IMPORT
```javascript
import { RaycastSanitizationEngine } from './RaycastSanitizationEngine_v1.js';
```

---

## SANITIZE (One-time at startup)
```javascript
// After creating scene and nodes
RaycastSanitizationEngine.sanitizeGeometryForRaycasting(scene);
```

---

## VALIDATE (One-time at startup)
```javascript
// Check geometry health
const report = RaycastSanitizationEngine.validateGeometryHealth(scene);
// Should show: ✅ All geometry health checks PASSED
```

---

## RAYCAST (Every raycasting operation)
```javascript
// Get safe raycastables
const raycastables = RaycastSanitizationEngine.getInteractiveRaycastables(scene);

// Perform raycasting
const hits = raycaster.intersectObjects(raycastables, true);
```

---

## DISABLE FX (When creating non-interactive meshes)
```javascript
// Create FX mesh
const auraMesh = new THREE.Mesh(geometry, material);
scene.add(auraMesh);

// Disable raycasting on FX
RaycastSanitizationEngine.disableRaycastOnMesh(auraMesh);
```

---

## DISABLE GROUP (When creating FX groups)
```javascript
const fxGroup = new THREE.Group();
// ... add FX meshes to group ...
scene.add(fxGroup);

// Disable raycasting on entire group
RaycastSanitizationEngine.disableRaycastOnGroup(fxGroup);
```

---

## RE-ENABLE (If needed later)
```javascript
RaycastSanitizationEngine.enableRaycastOnMesh(mesh);
```

---

## MARK CANONICAL (For immutable geometries)
```javascript
geometry = RaycastSanitizationEngine.markCanonicalGeometry(geometry);
// Sets: userData.canonical = true, userData.immutableTopology = true
```

---

## CHECK STATS (For debugging)
```javascript
const stats = RaycastSanitizationEngine.getRaycastStatistics(scene);
console.log(stats);
// Shows: total, interactive, disabled, no_geometry, invisible
```

---

## SANITIZE SINGLE (Force-sanitize one mesh)
```javascript
RaycastSanitizationEngine.sanitizeMesh(problemMesh);
```

---

## COMMON INTEGRATION POINTS

### main.js - Scene Init
```javascript
function initScene() {
  // ... create scene ...
  RaycastSanitizationEngine.sanitizeGeometryForRaycasting(scene);
  
  const report = RaycastSanitizationEngine.validateGeometryHealth(scene);
  return report.errors.length === 0;
}
```

### NodeLinkingSystem - Raycasting
```javascript
updateCrosshairTargeting(camera, mouse) {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  const raycastables = RaycastSanitizationEngine.getInteractiveRaycastables(scene);
  const hits = raycaster.intersectObjects(raycastables, true);
  
  // ... process hits ...
}
```

### FX Creation
```javascript
function createAura(node, scene) {
  const auraMesh = new THREE.Mesh(geometry, material);
  scene.add(auraMesh);
  
  RaycastSanitizationEngine.disableRaycastOnMesh(auraMesh);
  return auraMesh;
}
```

---

## DO'S & DON'TS

### ✅ DO
- Call `sanitizeGeometryForRaycasting()` after adding meshes
- Use `getInteractiveRaycastables()` for raycasting
- Disable FX with `disableRaycastOnMesh()`
- Validate once at startup with `validateGeometryHealth()`
- Mark canonical geometries with `markCanonicalGeometry()`

### ❌ DON'T
- Use `Object.freeze()` on geometries
- Raycast directly against `scene.children`
- Call `computeBoundingSphere()` on frozen geometries
- Forget to sanitize after spawning nodes
- Validate every frame (only once at startup)

---

## TROUBLESHOOTING

### Error: "Cannot assign to read only property 'boundingSphere'"
→ Call `sanitizeGeometryForRaycasting(scene)` after adding mesh

### Raycasting misses nodes
→ Use `getInteractiveRaycastables(scene)` instead of raw arrays

### FX interferes with raycasting
→ Call `disableRaycastOnMesh(fxMesh)` on non-interactive meshes

### Performance spike
→ Don't validate every frame, only at startup

### Validation shows errors
→ Check error details in report, fix specific meshes

---

## API SUMMARY

| Method | Purpose | Called |
|--------|---------|--------|
| `sanitizeGeometryForRaycasting()` | Fix all geometry | After creating/spawning meshes |
| `getInteractiveRaycastables()` | Get safe meshes | Before raycasting |
| `disableRaycastOnMesh()` | Disable FX raycast | When creating FX |
| `disableRaycastOnGroup()` | Disable group raycast | When creating FX group |
| `enableRaycastOnMesh()` | Re-enable raycast | If needed |
| `markCanonicalGeometry()` | Mark immutable | On canonical geometries |
| `validateGeometryHealth()` | Check health | Once at startup |
| `getRaycastStatistics()` | Get stats | For debugging |
| `sanitizeMesh()` | Fix one mesh | For specific issues |

---

## QUICK REFERENCE

**Problem**: Raycast crashes on "Cannot assign to read only property"

**Solution**:
1. Import engine
2. Call `sanitizeGeometryForRaycasting(scene)`
3. Call `validateGeometryHealth(scene)`
4. Use `getInteractiveRaycastables(scene)` for raycasting
5. Disable FX with `disableRaycastOnMesh()`

**Result**: ✅ Zero crashes, reliable raycasting

---

## INTEGRATION TIME

| Task | Time |
|------|------|
| Read quickstart | 5 min |
| Import engine | 1 min |
| Add sanitize call | 2 min |
| Update raycasting | 3 min |
| Disable FX | 2 min |
| Test & verify | 2 min |
| **Total** | **~15 min** |

---

## PRODUCTION STATUS

✅ **Production-Ready**
- No crashes
- Full diagnostics
- Complete documentation
- Easy integration

🚀 **Ready to Deploy**

---
