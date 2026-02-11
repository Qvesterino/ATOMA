# Integration Spawning Pipeline Audit Report

## Call Path Traced

```
updateSpawning() [AINodes.js:3542]
  └─> checkNetworkDensityAndSpawn() [AINodes.js:3602]
      └─> getRuntimeSpawnCategoryIntent() [AINodes.js:3279]
          └─> spawnNode() [AINodes.js:3335]
              └─> createNode() [AINodes.js:815]
                  └─> EnhancedNodeModels.create() [EnhancedNodeModels.js:268]
                      └─> createIntegrationNode() [EnhancedNodeModels.js:2276]
                          └─> [IntegrationEnhancedVariants factories]
                              └─> createIntegrationEnhanced_SignalKnot() [IntegrationEnhancedVariants_Session110.js:26]
                              └─> createIntegrationEnhanced_ProtocolTangle() [IntegrationEnhancedVariants_Session110.js:111]
                              └─> createIntegrationEnhanced_ContinuityBinder() [IntegrationEnhancedVariants_Session110.js:208]
                              └─> createIntegrationEnhanced_TrefoilEnhanced() [IntegrationEnhancedVariants_Session82.js:50]
                              └─> createIntegrationEnhanced_InterwovenLoops() [IntegrationEnhancedVariants_Session82.js:130]
                              └─> createIntegrationEnhanced_KnotSingularity() [IntegrationEnhancedVariants_Session82.js:222]
              └─> _finalizeSpawnedNode() [AINodes.js:3463]
```

## Early-Return/Null Exit Table (Integration-Specific)

| File | Line | Function | Condition | Returns |
|------|------|----------|-----------|---------|
| **AINodes.js** | 3614 | `checkNetworkDensityAndSpawn()` | `category === 'integration'` AND analytics cooldown active | null (early return) |
| AINodes.js | 3620 | `getRuntimeSpawnCategoryIntent()` | No valid category found in spawn cycle | null |
| AINodes.js | 3090 | `validateCategory()` | Category not in SAFE_CATEGORIES | Returns `'input'` as fallback |
| AINodes.js | 3335 | `spawnNode()` | Registry key exists (duplicate check) | Returns existing node (no spawn) |
| AINodes.js | 3373 | `spawnNode()` | `spawnAuthorityComplianceGate.validateSpawnRequest()` returns null | null |
| AINodes.js | 3415 | `spawnNode()` | Registry empty (no canonical visual) | null |
| AINodes.js | 3534 | `spawnNode()` | `createNode()` returns null | null |
| AINodes.js | 3540 | `spawnNode()` | `_finalizeSpawnedNode()` returns null | null |
| **EnhancedNodeModels.js** | 268 | `create()` | `!THREE || !THREE.Group` | null |
| EnhancedNodeModels.js | 276 | `create()` | `!this._isRegistryValid()` | null |
| EnhancedNodeModels.js | 2276 | `createIntegrationNode()` | All factories in variants loop return null | null (after loop) |
| EnhancedNodeModels.js | 2300-2305 | `createIntegrationNode()` | `if (variants.length === 0)` | null |

## _finalizeSpawnedNode() Rejection Criteria Audit

### Mesh Counting in Groups

**Current Implementation (AINodes.js:3463-3475):**
```javascript
let renderableCount = 0;
node.traverse((obj) => {
  if (!obj || obj.isObject3D !== true) return;
  if (obj.isMesh === true || obj.isLine === true || obj.isPoints === true) {
    renderableCount++;
    // ... bounds checking ...
  }
});
```

**Verdict:** ✅ **CORRECT** - `traverse()` visits ALL descendants, including nested children in Groups.

### Integrity/Policy Checks

| Check | Condition | Rejects if... | Status |
|-------|-----------|-----------------|--------|
| Node validity | `!node || !(node instanceof THREE.Object3D)` | Invalid input | ✅ Safe |
| Renderables | `renderableCount === 0` | No meshes/lines/points | ✅ Safe |
| Bad bounds | `!Number.isFinite(finalRadius) || finalRadius <= 0` | NaN or zero radius | ⚠️ May reject valid nodes |
| Layer mask | `node.layers.mask === 0` | No render layers | ⚠️ May reject nodes |
| Scale check | `!Number.isFinite(node.scale.x)` | Non-finite scale | ✅ Safe |
| Empty root | `!node.children || node.children.length === 0` | No children | ✅ Safe |

### Integration Factory Mesh Output

All IntegrationEnhancedVariants factories return Groups with multiple Mesh children:

| Factory | Mesh Count | Materials | Geometries |
|---------|------------|------------|-------------|
| createIntegrationEnhanced_SignalKnot | 9 strands + 6 packets = 15 | All have materials | TubeGeometry, OctahedronGeometry |
| createIntegrationEnhanced_ProtocolTangle | 5 strands + 4 friction = 9 | All have materials | TubeGeometry, TetrahedronGeometry |
| createIntegrationEnhanced_ContinuityBinder | 2 loops + 1 anchor = 3 | All have materials | TubeGeometry, TorusGeometry |
| createIntegrationEnhanced_TrefoilEnhanced | 6 braids = 6 | All have materials | BufferGeometry (custom) |
| createIntegrationEnhanced_InterwovenLoops | 3 loops = 3 | All have materials | BufferGeometry (custom) |
| createIntegrationEnhanced_KnotSingularity | 4 spirals + 1 core = 5 | All have materials | BufferGeometry (custom), OctahedronGeometry |

**Verdict:** ✅ All factories properly populate groups with meshes.

## Integrity/Policy Checks That Can Reject Integration Shapes

1. **NaN Bounding Sphere Radius**
   - Location: AINodes.js:3471-3474
   - Condition: `!Number.isFinite(finalRadius) || finalRadius <= 0`
   - Can reject integration if: `geometry.boundingSphere.radius` is NaN or ≤ 0
   - Root cause: Parametric curve generation produces NaN values

2. **Missing BoundingSphere**
   - Location: AINodes.js:3455-3462
   - Condition: `!geometry.boundingSphere || !Number.isFinite(radius) || radius <= 0`
   - Can reject integration if: Geometry lacks boundingSphere or computeBoundingSphere fails
   - Root cause: Geometry not initialized or `computeBoundingSphere()` throws

3. **Zero Layer Mask**
   - Location: AINodes.js:3476-3478
   - Condition: `node.layers.mask === 0`
   - Can reject integration if: Node has no render layers assigned
   - Root cause: Three.js Group default or explicit assignment

4. **Non-Finite Scale**
   - Location: AINodes.js:3435-3437
   - Condition: `!Number.isFinite(node.scale.x/y/z) || scale <= 0`
   - Can reject integration if: Scale is NaN, Infinity, or ≤ 0
   - Root cause: External mutation or uninitialized state

## Minimal Code Change Options

### Option 1: Fix NaN Bounds Detection (Recommended)
**File:** AINodes.js (around line 3470)
**Change:**
```javascript
// BEFORE:
if (!Number.isFinite(finalRadius) || finalRadius <= 0) {
  const ud = ensureUserDataObject(obj);
  if (ud) ud.__badBounds = true;
  badBoundsCount++;
}

// AFTER:
if (!Number.isFinite(finalRadius) || finalRadius <= 0) {
  // Fix: Re-try bounds computation once before marking bad
  if (typeof geometry.computeBoundingSphere === 'function') {
    try {
      geometry.computeBoundingSphere();
      const retryRadius = geometry.boundingSphere?.radius;
      if (Number.isFinite(retryRadius) && retryRadius > 0) {
        return; // Successfully computed - don't mark bad
      }
    } catch (e) {
      // Still invalid - mark bad below
    }
  }
  const ud = ensureUserDataObject(obj);
  if (ud) ud.__badBounds = true;
  badBoundsCount++;
}
```
**Impact:** Catches transient NaN bounds without global safety weakening.

### Option 2: Allow Zero Layer Mask with Fallback
**File:** AINodes.js (around line 3476)
**Change:**
```javascript
// BEFORE:
if (node.layers && node.layers.mask === 0) {
  try {
    node.layers.mask = 1;
  } catch (e) {}
}

// AFTER:
if (node.layers && node.layers.mask === 0) {
  try {
    node.layers.mask = 1; // Default to layer 0
  } catch (e) {
    // Keep original if immutable
  }
}
```
**Impact:** Already implemented - just ensuring execution path is clear.

### Option 3: Ensure Integration Factories Always Return Mesh
**File:** IntegrationEnhancedVariants_Session*.js
**Change:** Add fallback mesh to each factory:
```javascript
// At end of each factory, before return:
if (group.children.length === 0) {
  // Fallback: ensure at least one mesh exists
  const fallbackGeo = new THREE.OctahedronGeometry(0.1, 0);
  const fallbackMat = new THREE.MeshStandardMaterial({ color: color });
  const fallback = new THREE.Mesh(fallbackGeo, fallbackMat);
  fallback.userData.fallbackMesh = true;
  group.add(fallback);
}
```
**Impact:** Guarantees each factory returns at least one mesh.

### Option 4: Make Bad Bounds Non-Fatal
**File:** AINodes.js (around line 3476)
**Change:**
```javascript
// BEFORE:
if (issues.length > 0) {
  console.warn(`[SpawnFinalize] visibility-risk id=${node.uuid} ...`);
}
if (renderableCount === 0) return null;

// AFTER:
if (issues.length > 0) {
  console.warn(`[SpawnFinalize] visibility-risk id=${node.uuid} ...`);
}
// Allow nodes with bad bounds to spawn if they have renderables
if (renderableCount === 0) return null;
// Bad bounds are now advisory, not fatal
```
**Impact:** Reduces rejections while maintaining visibility for debugging.

## Most Likely Root Cause

**NaN Bounding Sphere from Parametric Curves**

Integration node factories (especially knots) use parametric curve generation (TubeGeometry from CatmullRomCurve3). If curve points contain NaN values (due to mathematical edge cases in parametric functions), the resulting geometry's boundingSphere will have NaN radius, causing rejection at AINodes.js:3471.

**Evidence:**
- SignalKnot uses `Math.sin()` and `Math.cos()` with complex phase calculations
- Parametric functions may produce NaN with invalid angle calculations
- TubeGeometry inherits NaN from curve points
- BoundingSphere computation preserves NaN values

**Recommended Fix:** Option 1 (Retry bounds computation) or Option 3 (Factory fallback mesh).