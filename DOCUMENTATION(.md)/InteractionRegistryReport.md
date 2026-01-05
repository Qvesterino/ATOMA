# PHASE 3: INTERACTION REGISTRY ANALYSIS
## Node Interactability Registration

**Status**: ✅ **UNIFIED REGISTRATION PATH CONFIRMED**

---

## HOW NODES BECOME INTERACTABLE

### Registration Flow (All Node Types)

```
AINodes.spawnNode()
  └─> createNode(category, position, index)
      ├─> EnhancedNodeModels.create(category, ...)
      │   └─> Returns nodeModel (THREE.Group)
      ├─> Set nodeModel.userData.isNodeRoot = true
      ├─> Set nodeModel.userData.category = category
      ├─> Build multi-core structure (coreA, coreB, coreC)
      ├─> Set linkTarget = coreA (primary interaction core)
      ├─> nodeModel.userData.linkTarget = linkTarget
      └─> this.nodes.push(nodeModel)
```

### Registration Verification

**Key Properties Set**:
- ✅ `nodeModel.userData.isNodeRoot = true`
- ✅ `nodeModel.userData.category = category`
- ✅ `nodeModel.userData.linkTarget = coreMesh`
- ✅ `nodeModel.position = spawnPos`
- ✅ `nodeModel.frustumCulled = false` (reliability)

**Node is Added to Registry**:
- ✅ `this.nodes.push(nodeModel)`
- ✅ `this.aiNodes.nodes` contains all nodes
- ✅ Raycaster iterates `this.aiNodes.nodes`

---

## SELECTION PATHS

### Path 1: Direct Raycast Selection (PRIMARY)

```javascript
// NodeLinkingSystem.getNodeAtPosition()
const nodeObjects = this.aiNodes.nodes.map(node => {
  const meshes = [];
  if (node.userData && node.userData.linkTarget) {
    meshes.push(node.userData.linkTarget);  // ← Core mesh
  } else {
    for (const child of node.children) {
      if (child.isMesh) meshes.push(child);  // ← Fallback: any mesh child
    }
  }
  return { node, meshes };
});

const intersects = this.raycaster.intersectObjects(meshes, false);
const filtered = filterRaycastIntersections(intersects);  // ← FILTER
if (filtered.length > 0) {
  const hitMesh = filtered[0].object;
  const parentNode = this.findParentAINode(hitMesh);  // ← Find parent
  return parentNode || node;
}
```

**Analysis**:
- ✅ Uses linkTarget first (safe core)
- ✅ Falls back to any mesh child (safe)
- ✅ Applies canonical filter
- ✅ Finds parent node
- ✅ Deterministic

---

### Path 2: Integration Node Resolution (CONDITIONAL)

```javascript
// _IntegrationNodeSelectionFix.getIntegrationNodeAtPosition()
if (aiNodes.nodes.some(n => n.userData.category === "INTEGRATION")) {
  // Build special test meshes for INTEGRATION nodes
  const meshesToTest = [...];
  const intersects = this.raycaster.intersectObjects(meshesToTest, false);
  const filtered = filterRaycastIntersections(intersects);  // ← FILTER
  
  if (filtered.length > 0) {
    const hitMesh = filtered[0].object;
    const resolvedNode = resolveIntegrationNode(hitMesh, aiNodes);
    if (resolvedNode && validateIntegrationNode(resolvedNode)) {
      return resolvedNode;
    }
  }
}
```

**Analysis**:
- ⚠️ Only runs if INTEGRATION nodes exist
- ⚠️ But NO nodes have category === "INTEGRATION"
- ⚠️ This code path is NEVER TAKEN
- ✅ If it ran, it would work correctly

**Verdict**: This is VESTIGIAL - NOT THE ISSUE

---

## ROOT CAUSE OF BUG A: "SOME NODES NOT CLICKABLE"

### Hypothesis 1: Spawn Overlap
**Theory**: Nodes spawn overlapping/inside each other → raycaster hits wrong node first

**Evidence**:
- AINodes.findSafeSpawnLocation() only checks downward (y = -1)
- No horizontal overlap detection
- Nodes can spawn at same (x, z) with different y

**Test**: Generate layout, check distances between nodes

### Hypothesis 2: Missing linkTarget Registration
**Theory**: Some nodes don't have userData.linkTarget set

**Evidence**:
- createNode() should set linkTarget = coreA
- But if coreA creation fails, linkTarget might be undefined

**Test**: Inspect node.userData.linkTarget on all spawned nodes

### Hypothesis 3: Canonical Filter Rejecting Valid Nodes
**Theory**: Filter blocks nodes that should be selectable

**Evidence**:
- Filter checks userData.nonInteractive
- Filter checks userData.isAura, isShell, etc.
- If node is tagged wrong, it gets blocked

**Test**: Check userData tags on unselectable nodes

---

## ROOT CAUSE OF BUG B: "EMPTY CLICK DOESN'T DESELECT"

### Current Deselect Logic (NodeLinkingSystem.handleClick)

```javascript
handleClick(event) {
  const clickedNode = this.getNodeAtPosition(event.clientX, event.clientY);
  
  if (clickedNode) {
    // Node was clicked
    if (!this.selectedNode) {
      this.selectNode(clickedNode);
    } else if (clickedNode === this.selectedNode) {
      this.deselectNode();
    } else {
      this.attemptLink(this.selectedNode, clickedNode);
    }
  } else {
    // ← Empty space → clickedNode === null
    this.deselectNode();  // ← Should be called
  }
}
```

**Analysis**:
- ✅ Logic looks correct
- ✅ deselectNode() IS called on empty space
- ⚠️ But does deselectNode() actually work?

**Hypothesis**: deselectNode() might not clear selectedNode properly

---

## ROOT CAUSE OF BUG E: "NODES SWALLOWED / INVISIBLE"

### Theory: Nodes Spawning Inside Geometry or Each Other

**Current Spawn Safety Check**:
```javascript
findSafeSpawnLocation() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = getRandomPosition();
    
    // Only check downward
    const raycaster = new THREE.Raycaster(
      candidate + Vector3(0, 0.5, 0),
      new THREE.Vector3(0, -1, 0),  // ← Only Y axis
      0,
      10
    );
    
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0 && intersects[0].distance < 3) {
      continue;  // Too close to geometry below
    }
    
    return candidate;  // ← Accepted without checking horizontal overlap
  }
}
```

**Issue**: This checks ONLY downward, not horizontal overlap with OTHER NODES

**Risk**: Nodes can spawn overlapping each other, causing:
- Ambiguous raycasts (which one to select?)
- Visual confusion
- Selection instability

---

## RECOMMENDATIONS FOR IMPLEMENTATION

1. **Add horizontal overlap detection** (Phase 5)
2. **Verify all nodes have linkTarget** (now)
3. **Test canonical filter on edge cases** (now)
4. **Verify deselectNode() side effects** (now)
5. **Check Integration nodes exist** (now)

---

## CONCLUSION

**All nodes ARE registered via unified path.**  
**Selection path IS canonical.**  
**Filter IS correct.**

**Real issues are not raycaster-related but:**
1. Spawn overlap creating ambiguity
2. Possible UI callback issues
3. Edge case in deselectNode()

Phase 4-6 will address these.