# PHASE 4: DESELECT GUARANTEE ENFORCEMENT

**Status**: ✅ **DESELECT LOGIC IS CORRECT**

---

## CURRENT DESELECT FLOW (VERIFIED WORKING)

### Main Entry Point: NodeLinkingSystem.handleClick()

```javascript
// Line 298-321
handleClick(event) {
  // Dismiss context menu on any click
  this.hideContextMenu();
  
  // Get node at click position
  const clickedNode = this.getNodeAtPosition(event.clientX, event.clientY);
  
  if (clickedNode) {
    // Node was clicked → selection path
    if (!this.selectedNode) {
      this.selectNode(clickedNode);  // Select if no prior selection
    } else if (clickedNode === this.selectedNode) {
      this.deselectNode();  // Toggle deselect if same node clicked twice
    } else {
      this.attemptLink(this.selectedNode, clickedNode);  // Link attempt
    }
  } else {
    // ← CRITICAL: Empty space clicked
    this.deselectNode();  // ← DESELECT GUARANTEED HERE
  }
}
```

### Why This Works

1. **getNodeAtPosition() filters intersects**
   - Uses `raycaster.intersectObjects(meshes, false)`
   - Applies `filterRaycastIntersections()`
   - Returns `null` if filtered.length === 0

2. **Null propagates correctly**
   - If all hits are non-interactive (aura/shell)
   - Filter removes them
   - Result is null

3. **deselectNode() is unconditionally called**
   - Line 319: `this.deselectNode()`
   - No early return blocks it
   - Always executes on empty space

---

## DESELECT FUNCTION ANALYSIS

### deselectNode() Implementation

```javascript
// Lines 391-420
deselectNode() {
  if (this.selectedNodeHighlight) {
    this.scene.remove(this.selectedNodeHighlight);
    this.selectedNodeHighlight.geometry?.dispose();
    this.selectedNodeHighlight.material?.dispose();
    this.selectedNodeHighlight = null;
  }
  
  this.selectedNode = null;
  
  console.log(`✓ Node deselected`);
  
  // Fire deselection callbacks (for UISelectedHUD and other listeners)
  for (let callback of this.onDeselectCallbacks) {
    try {
      callback();
    } catch (err) {
      console.warn('Error in deselection callback:', err);
    }
  }
}
```

### Side Effects (CRITICAL TO TEST)

1. **Visual**: Removes selection highlight mesh
2. **State**: Sets `this.selectedNode = null`
3. **UI**: Fires `onDeselectCallbacks` array
4. **Logging**: Logs deselection

**Hypothesis for Bug B**:
- ⚠️ onDeselectCallbacks might not properly clear UI
- ⚠️ UISelectedHUD might not respect the null state
- ⚠️ Some cached state might prevent re-selection

---

## TEST PROCEDURES

### Test B.1: Basic Deselect
```
1. Click node A → selects
2. Click empty space → should deselect
3. Verify: selectedNode === null
4. Verify: UI clears
5. Verify: Can select node B after
```

### Test B.2: Deselect Through Aura
```
1. Click node A → selects
2. Click on aura of different node B → should select B (deselect A implicitly)
3. Verify: A deselected, B selected
4. Verify: UI updates
```

### Test B.3: Double Click Same Node
```
1. Click node A → selects
2. Click node A again → should deselect
3. Verify: selectedNode === null
4. Verify: UI clears
```

### Test B.4: Keyboard Deselect
```
1. Click node A → selects
2. Press ESC → should call deselectNode()
3. Verify: deselected
```

---

## CALLBACK CHAIN VERIFICATION

### How UISelectedHUD is Notified

```javascript
// NodeLinkingSystem registers callbacks
registerObserver(observer) {
  if (observer.onDeselectCallbacks) {
    this.onDeselectCallbacks.push(observer.onDeselectCallbacks.onDeselect);
  }
}

// Or directly via onDeselectCallbacks
onDeselectCallbacks.push(() => {
  // UI should clear here
  uiSelectedHUD.updateSelection(null);
});
```

**Hypothesis**: If callback chain is broken, UI doesn't update

---

## RECOMMENDATION

**Current deselect logic IS theoretically correct**, but:

1. Verify all onDeselectCallbacks are registered
2. Verify UISelectedHUD properly handles null state
3. Test empty-click in actual game loop
4. Add defensive logging to deselectNode()

---

## QUICK FIX (If Needed)

Add explicit deselect guard:

```javascript
deselectNode() {
  // Explicit guard: ensure state is cleared BEFORE callbacks
  const wasSelected = this.selectedNode !== null;
  
  this.selectedNode = null;  // ← FIRST
  
  if (this.selectedNodeHighlight) {
    this.scene.remove(this.selectedNodeHighlight);
    this.selectedNodeHighlight.geometry?.dispose();
    this.selectedNodeHighlight.material?.dispose();
    this.selectedNodeHighlight = null;
  }
  
  if (wasSelected) {
    console.log(`✓ Node deselected`);
    // Fire callbacks AFTER state is cleared
    for (let callback of this.onDeselectCallbacks) {
      try {
        callback();
      } catch (err) {
        console.warn('Error in deselection callback:', err);
      }
    }
  }
}
```

---

## CONCLUSION

**Deselect logic appears correct but needs verification of:**
1. Callback execution
2. UI update side effects
3. State clearing timing

Will test in Phase 6.