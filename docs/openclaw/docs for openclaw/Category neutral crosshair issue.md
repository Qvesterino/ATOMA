# AUDIT REPORT: Category "Neutral" Crosshair Issue

## Executive Summary

**Finding:** The category label is likely lost or incorrectly propagated during the **Raycast → Hit Resolution → HUD Display** pipeline.
- **Symptom:** Crosshair shows "neutral".
- **Actual State:** Node has a different category (e.g., 'process', 'integration') confirmed on click/select.
- **Root Cause:** The HUD (or Crosshair system) is reading category data from an object that does not have an updated `category` field, or the lookup chain is broken before reaching the canonical node.

## Detailed Analysis

### 1. Data Sources & Flow

| Source | Data | `userData.category`? |
| :--- | :--- | :--- |
| :--- | :--- | :--- |
| `AINodes` (createNode) | **Canonical Node Object** | **YES** (Set on spawn) |
| `HitProxySystem` | Hit Proxy Mesh | **UNKNOWN** (Must be copied from Node) |
| `NodeLinkingSystem` (raycast) | Raycast Hit | **UNKNOWN** (Must resolve to Node) |
| `NodeLinkingSystem` (resolve) | `resolvedNode` (Node) | **YES** (via `aiNodes.nodes`) |
| `HUD / Crosshair` | UI Display | **DEPENDENT** (Reads from Node) |

### 2. Critical Code Path Analysis

#### A. The Raycast & Resolution (`NodeLinkingSystem.js`)

**File:** `NodeLinkingSystem.js`
**Function:** `getNodeAtPosition(clientX, clientY, callsite = 'unknown')`

1. **Raycasting:**
   ```javascript
   // Line ~4568
   this.raycaster.intersectObjects(coreMeshes, false);
   ```
   The raycaster is configured to hit `coreMeshes`. `coreMeshes` are collected by iterating `this.aiNodes.nodes`.

2. **Node Resolution:**
   ```javascript
   // Line ~4615
   const hitMesh = intersects[0].object;
   let parentNode = hitMesh;
   while (parentNode) {
     if (this.aiNodes.nodes.includes(parentNode)) {
       // ... logging ...
       return parentNode;
     }
     parentNode = parentNode.parent;
   }
   ```
   The code attempts to find parent `AINode` object.

3. **Validation:**
   The code returns `parentNode` object found in step 2.

#### B. The Crosshair Update (`NodeLinkingSystem.js`)

**File:** `NodeLinkingSystem.js`
**Function:** `updateCrosshairNodeTargeting()`

1. **Raycasting (via Proxies):**
   The function calls `window.hitProxySystem.raycast()`.

2. **Resolution:**
   ```javascript
   // Line ~4913
   const nodeId = proxyHits[0].nodeId || proxyHits[0].object?.userData?.targetNodeId;
   const hitNode = this.aiNodes.nodes.find(n => ...);
   ```
   It resolves `hitNode` from `this.aiNodes.nodes`.

3. **State Update:**
   ```javascript
   // Line ~4925
   crosshairState.node = resolvedNode;
   ```

#### C. The Category Display (HUD / UI)

**Inferred Logic (HUD files not fully loaded, but standard pattern):**

The HUD (e.g., `UISelectedHUD` or `SelectedHUD`) listens to `window.__crosshairRaycastState`.

```javascript
// INFERRED CODE in HUD
const state = window.__crosshairRaycastState;
if (state && state.node) {
  const category = state.node.userData.category;
  if (category) {
    show(category);
  } else {
    show("neutral"); // <--- FALLBACK TRIGGER POINT
  }
} else {
  show("neutral");
}
```

### 3. The Discrepancy

**Scenario:**
1. User spawns node (e.g., 'integration').
   * `AINodes` sets `node.userData.category = 'integration'`.
2. User hovers over node.
   * `NodeLinkingSystem` performs raycast.
   * Raycast hits a Hit Proxy (or child mesh).
   * `NodeLinkingSystem` resolves parent node (`AINode`).
   * `NodeLinkingSystem` updates `crosshairState.node = resolvedNode`.
   * HUD reads `state.node.userData.category`.
   * **Result:** Should show 'integration'. **Shows:** "neutral".

**Why "neutral"?**
*   The fallback `show("neutral")` is triggered.
*   This implies `state.node.userData.category` is `undefined`, `null`, or missing.
*   Since `AINodes` sets it, the node object itself should have it.
*   **Hypothesis:** The `state.node` reference in `__crosshairRaycastState` is pointing to an object *other than* the `AINodes` node object, OR the `AINodes` node object's `userData` is being wiped/corrupted after raycast.

### 4. Specific Code Review (`NodeLinkingSystem.js`)

#### A. `createLink` method

```javascript
// Line ~3118
const sourceCategory = link.source.userData.category;
```
This confirms that `link.source` (the node) is expected to have `userData.category`.

#### B. `findParentAINode` method

```javascript
// Line ~4525
findParentAINode(mesh) {
  let current = mesh;
  while (current) {
    if (this.aiNodes.nodes.includes(current)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}
```
This method simply traverses up the scene graph to find an object in `aiNodes.nodes`.

**Crucial:** It does *not* check or validate `userData.category`. It trusts the node object in `aiNodes.nodes` to have correct data.

#### C. `getNodeAtPosition` (Raycast path)

```javascript
// Line ~4731
getNodeAtPosition(clientX, clientY, callsite = 'unknown') {
  // ...
  // Line ~4913
  const resolvedNode = this.aiNodes.nodes.find(n => {
    const identity = (typeof window !== 'undefined' && window.getNodeIdentity)
      ? window.getNodeIdentity(n)
      : (n.userData?.id || n.userData?.nodeId || n.uuid);
    return identity === nodeId || n.userData?.id === nodeId || n.userData?.nodeId === nodeId;
  });
  // ...
  return resolvedNode;
}
```
This method finds node in `aiNodes.nodes` that matches ID.

**Crucial:** It returns *node reference* from `aiNodes.nodes`.

### 5. The "Neutral" Default

Since "neutral" is not found in `NodeLinkingSystem.js`, the default "neutral" logic resides in the HUD/UI layer.

**Common patterns causing this:**
1. `node.userData` is not initialized.
2. `node.userData.category` is `undefined`.
3. `node.userData.category` is `null`.
4. `node.userData` is overwritten as `{}` (wipes `category`).

## Diagnostic Recommendations

### 1. Immediate Verification (Runtime)

Execute this in the browser console during the bug:

```javascript
// 1. Check crosshair state
console.log("Crosshair State:", window.__crosshairRaycastState);
const node = window.__crosshairRaycastState?.node;
if (node) {
  console.log("Node Ref:", node);
  console.log("Node userData:", node.userData);
  console.log("Node category:", node.userData?.category);
  console.log("Node in aiNodes.nodes:", window.game?.aiNodes?.nodes?.includes(node));
} else {
  console.log("No node in crosshair state!");
}

// 2. Check AINodes reference
if (window.game && window.game.aiNodes) {
  console.log("AINodes nodes count:", window.game.aiNodes.nodes.length);
  window.game.aiNodes.nodes.forEach((n, i) => {
    if (i < 5) {
      console.log(`AINode[${i}] id=${n.userData?.id} category=${n.userData?.category}`);
    }
  });
}
```

### 2. Code Fix Candidates

**Fix 1: Ensure Node Data Integrity**
If `AINodes.createNode` is not setting `userData.category`, fix it there.
*   *Location:* `AINodes.js` (createNode method).

**Fix 2: Ensure Proxy Data Integrity**
If `HitProxySystem` creates proxies without `userData` context, fix it there.
*   *Location:* `_HitProxyIntegrationPatch.js`.

**Fix 3: Ensure HUD Logic Fallback**
If HUD falls back to "neutral" too aggressively, add a check:
```javascript
// HUD PSEUDOCODE
const category = node?.userData?.category;
if (category && category !== 'undefined' && category !== 'null') {
  show(category);
} else {
  // Keep "neutral" or log warning
  show("neutral");
}
```

## Conclusion

The issue is a **data propagation failure** between Canonical Node (`aiNodes.nodes`), Raycast Target (Hit Proxy/Child Mesh), and HUD Display.

1.  **Raycast** hits a mesh.
2.  **Resolution** finds parent `AINode` object.
3.  **CrosshairState** updates `node` with the `AINode` reference.
4.  **HUD** reads `node.userData.category`.

If step 4 fails, it's because `node.userData.category` is missing. This can happen if:
*   The `node` reference in step 3 is **not** the canonical node from `aiNodes.nodes` (e.g., a wrapper, group, or non-canonical object).
*   The canonical node object in `aiNodes.nodes` had its `userData.category` overwritten or cleared.

**Primary Suspect:** `AINodes.js` (Node creation/corruption) or `HitProxySystem` (Proxy creation).

**Action:** Inspect `AINodes.js` and `_HitProxyIntegrationPatch.js` to verify `userData.category` is correctly set and preserved.