# SESSION 47: TECHNICAL AUDIT DETAILS
## Comprehensive Three.js Raycaster Analysis

---

## OVERVIEW

This is a detailed technical breakdown of the ATOMA raycaster selection system audit. It explains the mechanics, the problems, and the solutions at a code level.

---

## THREE.JS RAYCASTER MECHANICS

### How Raycasting Works (Overview)

```javascript
// 1. Create raycaster
const raycaster = new THREE.Raycaster();

// 2. Set ray from camera through mouse
raycaster.setFromCamera(mousePosition, camera);

// 3. Cast ray and find intersections
const intersections = raycaster.intersectObjects(objectsArray, recursive);

// 4. intersections is an array of hits, sorted by distance:
// [
//   { object: firstMesh, distance: 5.2, point: Vector3, ... },
//   { object: secondMesh, distance: 6.1, point: Vector3, ... },
//   ...
// ]

// 5. Take first hit (closest to camera)
if (intersections.length > 0) {
  const hitObject = intersections[0].object;
}
```

### The Mesh.raycast() Function

Each THREE.Mesh has a `.raycast()` function:

```javascript
// Default implementation (THREE.Mesh.prototype.raycast)
mesh.raycast(raycaster, intersects) {
  // Internal THREE.js logic:
  // 1. Check if ray intersects mesh's bounding sphere
  // 2. If yes, do precise triangle/ray intersection test
  // 3. If hit found, push intersection object to 'intersects' array
}
```

**Critical**: Raycaster calls `mesh.raycast()` on EVERY mesh in the objects array.

---

## THE PROBLEM

### Scenario: Node with Visible Aura

**Scene Structure**:
```
nodeGroup
  ├─ coreMesh (solid blue octahedron)
  ├─ auraMesh (transparent glowing sphere, larger)
  ├─ glyphMesh (transparent rotating symbol)
  └─ particleEmitter (non-interactive FX)
```

**What Raycaster Sees**:
- ALL children of nodeGroup are potential targets
- No distinction between "core" and "visual overlay"
- Intersection test runs on EVERY mesh

**Visual Layout (Side View)**:
```
Camera
  └─ Ray shoots through mouse point
       ├─ Hits auraMesh first (distance: 5.0) ← OUTER LAYER
       └─ Hits coreMesh second (distance: 5.5) ← INNER LAYER

intersectObjects() returns: [auraMesh, coreMesh]  (sorted by distance)
```

### Current Broken Code (NodeLinkingSystem.js:1286)

```javascript
const nodeObjects = this.aiNodes.nodes.map(node => {
  const meshes = [];
  node.traverse(child => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);  // ← Pushes EVERY mesh: core, aura, glyph, particles
    }
  });
  return { node, meshes };
});

// Check direct intersections first (highest precision)
for (const { node, meshes } of nodeObjects) {
  const intersects = this.raycaster.intersectObjects(meshes, false);
  if (intersects.length > 0) {
    // ❌ PROBLEM: intersects[0] might be auraMesh, not coreMesh
    const sortedHits = this.sortRaycastHits(intersects);
    const hitMesh = sortedHits[0].object;  // ← Could be any mesh
    const parentNode = this.findParentAINode(hitMesh);
    if (parentNode) {
      return parentNode;  // ← Might select wrong node if aura hit
    }
    return node;
  }
}
```

**Why This Fails**:
1. `meshes` array contains: [coreMesh, auraMesh, glyphMesh, particleEmitter]
2. `intersectObjects()` returns ALL hits in distance order
3. If aura is visible and closer to camera, it's hit first
4. Code takes `sortedHits[0]` = auraMesh
5. Trying to select auraMesh (non-interactive) → FAILS

---

## THE ROOT CAUSE CHAIN

### Root Cause #1: No Filtering on Raycaster Results

**Missing Code**:
```javascript
const intersects = this.raycaster.intersectObjects(meshes, false);
// ← NO FILTERING! Includes non-interactive visuals

// Should be:
intersects = filterRaycastIntersections(intersects);  // ← MISSING
```

### Root Cause #2: Visual Layers Not Excluded from Raycast

**Current Behavior**:
- ALL meshes in nodeGroup participate in raycasting
- Auras, glyphs, particles, FX are all raycastable
- No mechanism to mark meshes as "visual-only, don't raycast"

**Expected Behavior**:
- Only coreMesh participates in raycasting
- Auras, glyphs, particles should not be raycastable
- Or, if they are raycast, filter them out

### Root Cause #3: Intersection Distance Not Considered for Visual Vs Core

**The Aura Problem**:
```
Camera at (0, 0, -20)
  coreMesh at (0, 0, 0)
  auraMesh at (0, 0, 0) but LARGER radius

Ray shoots from camera through mouse
  Distance to auraMesh surface: ~4.0 units
  Distance to coreMesh surface: ~0.7 units (much closer)

intersectObjects() sorts by distance to SURFACE:
  1. auraMesh surface hit at 4.0 ✗ (visual layer)
  2. coreMesh surface hit at 0.7 ✓ (core, but second in list!)
```

Result: Code takes first hit (aura), not the closer core.

---

## WHY V1.0 FAILED (THE RAYCAST = NULL APPROACH)

### V1.0 Code (Deprecated)

```javascript
// VisualInteractionIsolationPatch.js:337
_disableInteractionOnVisuals(nodeGroup, coreMesh) {
  traverse(obj => {
    if (isVisualOnly(obj)) {
      obj.raycast = null;  // ❌ DANGEROUS
    }
  });
}
```

### Why This Causes THREE.js Errors

**Raycaster Code (THREE.js Internal)**:
```javascript
intersectObjects(objects, recursive) {
  for (const object of objects) {
    if (object.raycast) {
      object.raycast(this, this._array);  // ← Calls raycast
    }
  }
}
```

**What Happens When raycast = null**:
```javascript
null(raycaster, array);  // ← Tries to call null as function
// TypeError: null is not a function ❌
```

Or if check exists:
```javascript
if (object.raycast !== undefined && object.raycast !== null) {
  object.raycast(this, this._array);
}
```

Some THREE.js versions do have the check, others don't. **Unreliable and dangerous.**

---

## WHY V2.0 WORKS (THE FILTERING APPROACH)

### V2.0 Code (Safe)

```javascript
// VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js:263
_markVisualOnlyMeshes(nodeGroup, coreMesh) {
  traverse(obj => {
    if (isVisualOnly(obj)) {
      // ✅ SAFE: Restore default raycast
      obj.raycast = THREE.Mesh.prototype.raycast;
      
      // Mark as non-interactive
      obj.userData.nonInteractive = true;
      
      // Disable from interaction layer
      obj.layers.disable(INTERACTION_LAYER);
    }
  });
}
```

### Why This Is Safe

**All meshes still raycasted**:
```javascript
raycaster.intersectObjects(meshes, false);
// ✓ auraMesh raycast called (returns valid hit)
// ✓ coreMesh raycast called (returns valid hit)
// ✓ NO THREE.js errors (all raycast functions valid)
```

**Filter Applied in Selection Code**:
```javascript
const intersects = raycaster.intersectObjects(meshes, false);
// intersects = [auraMesh hit, coreMesh hit]

intersects = filterRaycastIntersections(intersects);
// Filters based on userData.nonInteractive
// Result: [coreMesh hit] ← Only core remains

if (intersects.length > 0) {
  selectNode(intersects[0].object);  // ✓ Always selects core
}
```

**Advantages**:
- ✅ No THREE.js errors (valid raycast functions)
- ✅ All visuals still participate in raycasting (correct physics)
- ✅ Selection code filters out non-interactive hits
- ✅ Deterministic behavior
- ✅ Easy to debug and test

---

## THE CANONICAL FILTER

### CanonicalInteractionFilter.js Structure

```javascript
export function isInteractiveObject(obj) {
  // Explicit interactive marker
  if (obj.userData?.interactive === true) {
    if (obj.userData?.nonInteractive === true) return false;
    return true;
  }

  // Reject if marked as visual-only
  if (obj.userData?.nonInteractive === true ||
      obj.userData?.isAura === true ||
      obj.userData?.isShell === true ||
      obj.userData?.isHologramShell === true ||
      obj.userData?.isFX === true ||
      obj.userData?.isParticle === true ||
      obj.userData?.isGlyph === true ||
      obj.userData?.isLinkVisual === true ||
      obj.userData?.isLinkGlow === true ||
      obj.userData?.isNeuralCurve === true ||
      obj.userData?.isHarmonyField === true ||
      obj.userData?.isIntegrationField === true ||
      obj.userData?.visualLayer === 'AURA' ||
      obj.userData?.visualLayer === 'SHELL' ||
      obj.userData?.visualLayer === 'VISUAL_ONLY') {
    return false;
  }

  // Material-based detection
  const material = obj.material;
  if (material &&
      material.transparent === true &&
      material.blending === THREE.AdditiveBlending &&
      material.depthWrite === false) {
    return false;  // Likely visual-only
  }

  return true;  // Default: accept
}

export function filterRaycastIntersections(intersections) {
  if (!intersections || !Array.isArray(intersections)) {
    return [];
  }

  return intersections.filter(intersection => {
    return isInteractiveObject(intersection.object);
  });
}
```

### Filter Logic Flow

**For Each Intersection**:
1. Check if object has `userData.nonInteractive === true` → REJECT
2. Check if object has `userData.isAura === true` → REJECT
3. Check if object has `userData.isShell === true` → REJECT
4. Check if object has visual material properties → REJECT
5. Otherwise → ACCEPT

**Result**: Only interactive core meshes pass through.

---

## MISSING INTEGRATION POINTS

### Location 1: NodeLinkingSystem.js:1286

```javascript
// CURRENT (BROKEN):
const intersects = this.raycaster.intersectObjects(meshes, false);
if (intersects.length > 0) {
  const sortedHits = this.sortRaycastHits(intersects);
  // ❌ Could hit aura instead of core
}

// FIXED:
import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';
// ...
const intersects = this.raycaster.intersectObjects(meshes, false);
intersects = filterRaycastIntersections(intersects);  // ← ADD
if (intersects.length > 0) {
  const sortedHits = this.sortRaycastHits(intersects);
  // ✅ Always hits core
}
```

### Location 2: NodeLinkingSystem.js:1378

```javascript
// CURRENT (BROKEN):
const intersects = this.raycaster.intersectObjects(arrowMeshes, false);
if (intersects.length > 0) {
  // Could select link glow instead of arrow
}

// FIXED:
intersects = filterRaycastIntersections(intersects);  // ← ADD
if (intersects.length > 0) {
  // Always selects actual arrow
}
```

### Location 3: NodeEditor.js:230

```javascript
// CURRENT (BROKEN):
updateNodeHover() {
  const intersects = this.raycaster.intersectObjects(
    this.nodes.map(n => n.mesh)
  );
  // Could hover over glyph instead of node
}

// FIXED:
import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';
// ...
updateNodeHover() {
  const intersects = this.raycaster.intersectObjects(
    this.nodes.map(n => n.mesh)
  );
  intersects = filterRaycastIntersections(intersects);  // ← ADD
  // Always hovers over node core
}
```

---

## IMPACT ANALYSIS

### Before Fixes

**Symptom**: Nodes not selectable through auras
**User Experience**: Click on node with aura → selection fails → click again → success

**Mechanism**:
1. Ray hits aura (distance 4.0)
2. Raycaster returns [auraHit, coreHit]
3. No filtering
4. Code takes auraHit
5. Tries to select aura (non-interactive)
6. Selection fails

### After Fixes

**Symptom**: Eliminated
**User Experience**: Click on node with aura → always selects core on first click

**Mechanism**:
1. Ray hits aura (distance 4.0) and core (distance 0.7)
2. Raycaster returns [auraHit, coreHit]
3. Filter applied: filterRaycastIntersections([auraHit, coreHit])
4. auraMesh has userData.nonInteractive = true → filtered out
5. Result: [coreHit]
6. Code takes coreHit
7. Selects core (interactive) ✓

---

## DESELECT GUARANTEE

### Current Problem

```javascript
// Deselect logic (somewhere in NodeLinkingSystem)
if (mouseClicked && intersections.length === 0) {
  deselectNode();
}
```

**Problem Scenario**:
1. Click on empty space
2. Ray hits node's aura (not filtered)
3. intersections = [auraHit]
4. intersections.length > 0 → STAYS SELECTED
5. Node doesn't deselect ❌

### After Fixes

```javascript
// Deselect logic (with filtering)
if (mouseClicked) {
  const intersects = raycaster.intersectObjects(scene.children, true);
  intersects = filterRaycastIntersections(intersects);
  
  if (intersects.length === 0) {
    deselectNode();  // ✓ Works correctly
  }
}
```

**Fixed Scenario**:
1. Click on empty space
2. Ray hits nothing
3. intersections = []
4. Filter: [] (no change)
5. intersections.length === 0 → DESELECTS ✓

---

## TESTING CHECKLIST

### Test 1: Basic Selection Through Aura
```
1. Spawn node with visible aura
2. Click on aura region (not core)
3. Verify: Node is selected
4. Expected: ✅ Selected on first click
```

### Test 2: Deselection on Empty Click
```
1. Click on node (select it)
2. Click on empty space (no nodes)
3. Verify: Node is deselected
4. Expected: ✅ Deselected immediately
```

### Test 3: Deselection Through Aura
```
1. Click on node (select it)
2. Click on another node's aura region
3. Verify: Previous node deselected, new node selected
4. Expected: ✅ Correct node selected
```

### Test 4: Link Creation Through Aura
```
1. Drag from one node's aura to another node's aura
2. Verify: Link created between correct nodes
3. Expected: ✅ Link created, nodes selected correctly
```

### Test 5: No THREE.js Errors
```
1. Perform 100+ clicks on nodes with auras
2. Check browser console for errors
3. Verify: No "r.raycast is not a function" errors
4. Expected: ✅ Clean console, no errors
```

---

## CONCLUSION

The audit reveals a simple but critical missing step: **filtering raycaster results**. The infrastructure (v2.0 engine, canonical filter, visual layer marking) is complete and correct. Only 8 intersectObjects calls need the one-line filter addition.

Once applied, selection will be deterministic, robust, and production-ready.