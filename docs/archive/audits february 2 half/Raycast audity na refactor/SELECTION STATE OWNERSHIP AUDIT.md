# ATOMA – SELECTION STATE OWNERSHIP AUDIT
## PHASE: SELECTION STATE OWNERSHIP ANALYSIS
**Date:** 2026-02-15
**Type:** STATIC CODE ANALYSIS (No execution, no modification)

---

## EXECUTIVE SUMMARY

**CRITICAL FINDING:** Selection state is **FRAGMENTED** across multiple systems with **NO SINGLE CANONICAL AUTHORITY**.

- **Primary Node Selection:** Owned by `NodeLinkingSystem.js` (lines ~244, ~816)
- **Hover State:** Owned by `NodeLinkingSystem.js` (`hoveredNodeForSelection`)
- **Multi-Select State:** Owned by `NodeLinkingSystem.js` (`selectedNodes` Set)
- **Inspection State:** Fragmented across 6+ UI components (`currentNode` duplication)
- **Legacy Selection Core:** `_NodeSelectionCore3_4.js` exists but appears **NOT WIRED** to main system

**Risk Level:** HIGH - Multiple systems can create conflicting selection states simultaneously.

---

## SECTION 1 — SELECTION VARIABLE MAP

### 1.1 Primary Selection Variables

| File | Line | Variable Name | Owner System | Write Locations | Read Locations | Reset Locations | Single Authority? |
|------|------|----------------|---------------|-----------------|-----------------|-------------------|
| `NodeLinkingSystem.js` | ~244 | `this.selectedNode` | NodeLinkingSystem | UISelectedHUD, multiple UI systems | clearPrimaryNode(), clearMultiSelect() | N (duplicated) |
| `NodeLinkingSystem.js` | ~246 | `this.primaryNode` | NodeLinkingSystem | UISelectedHUD, multiple UI systems | clearPrimaryNode(), clearMultiSelect() | N (sync with selectedNode) |
| `_NodeSelectionCore3_4.js` | ~38 | `this.selectedNode` | NodeSelectionCore3_4 | **NO READERS FOUND** | deselectNode(), reset() | **N (unwired)** |
| `NodeLinkingSystem.js` | ~254 | `this.selectedNodes` (Set) | NodeLinkingSystem (multi-select) | NodeLinkingSystem (multi-select) | clearMultiSelect() | Y (for multi-select) |
| `NodeLinkingSystem.js` | ~260 | `this.multiSelectHighlights` (Map) | NodeLinkingSystem | NodeLinkingSystem (visual updates) | clearMultiSelect() | Y (visual state only) |

### 1.2 Hover State Variables

| File | Line | Variable Name | Owner System | Write Locations | Read Locations | Reset Locations | Single Authority? |
|------|------|----------------|---------------|-----------------|-----------------|-------------------|
| `NodeLinkingSystem.js` | ~305 | `this.hoveredNodeForSelection` | NodeLinkingSystem (updateNodeHoverStates) | NodeLinkingSystem (hover state checks) | updateNodeHoverStates (clears previous) | Y |
| `NodeLinkingSystem.js` | ~303 | `this.nodeSelectionGlows` (Map) | NodeLinkingSystem (add/remove) | NodeLinkingSystem (visual updates) | clearAllNodeSelectionGlows() | Y (visual state only) |

### 1.3 Inspection State Variables (FRAGMENTED)

| File | Line | Variable Name | Owner System | Write Locations | Read Locations | Reset Locations | Single Authority? |
|------|------|----------------|---------------|-----------------|-----------------|-------------------|
| `UINodeInspectPanel.js` | ~? | `this.currentNode` | UINodeInspectPanel | UINodeInspectPanel | hidePanel() | N (duplicated) |
| `_UIPrimaryNodeTopBar3_7.js` | ~? | `this.currentNode` | UIPrimaryNodeTopBar | UIPrimaryNodeTopBar | hidePanel() | N (duplicated) |
| `_UISelectedNodeTopBar3_4.js` | ~? | `this.currentNode` | UISelectedNodeTopBar | UISelectedNodeTopBar | hidePanel() | N (duplicated) |
| `_NodeInspectLinguisticOverlay.js` | ~? | `this.currentNode` | NodeInspectLinguisticOverlay | NodeInspectLinguisticOverlay | hideOverlay() | N (duplicated) |
| `NodeInspectOverlay1_0.js` | ~? | `this.currentNode` | NodeInspectOverlay1 | NodeInspectOverlay1 | hideOverlay() | N (duplicated) |
| `NodeInspectOverlay3_0.js` | ~? | `this.currentNode` | NodeInspectOverlay3 | NodeInspectOverlay3 | hideOverlay() | N (duplicated) |

### 1.4 Linking State Variables

| File | Line | Variable Name | Owner System | Write Locations | Read Locations | Reset Locations | Single Authority? |
|------|------|----------------|---------------|-----------------|-----------------|-------------------|
| `NodeLinkingSystem.js` | ~248 | `this.activeLink` | **NO WRITERS FOUND** | NodeLinkingSystem (legacy) | N (unused) |
| `NodeLinkingSystem.js` | ~247 | `this.ghostLinks` | NodeLinkingSystem | NodeLinkingSystem | N (linking system) |
| `_NodeLinking2_3.js` | ~? | RMB hold state | NodeLinking2_3 | NodeLinking2_3 | N (separate system) |

### 1.5 Crosshair/Targeting State Variables

| File | Line | Variable Name | Owner System | Write Locations | Read Locations | Reset Locations | Single Authority? |
|------|------|----------------|---------------|-----------------|-----------------|-------------------|
| `NodeLinkingSystem.js` | ~? | `window.__crosshairRaycastState` | NodeLinkingSystem (updateCrosshairNodeTargeting) | Global (multiple systems) | updateCrosshairNodeTargeting | **N (global)** |

---

## SECTION 2 — WRITE AUTHORITY MAP

### 2.1 Primary Node Selection Write Locations

**NodeLinkingSystem.js:**
- `setPrimaryNode(node)` - Line ~816
  - Sets `this.primaryNode`
  - Syncs to `this.selectedNode` for legacy compatibility
  - Creates visual highlight
  - Fires `_fireSelectCallbacks()`

- `clearPrimaryNode()` - Line ~926
  - Clears `this.primaryNode`
  - Clears `this.selectedNode`
  - Removes visual highlight
  - Fires `_fireDeselectCallbacks()`

- `selectNode(node)` - Line ~1067 (legacy wrapper)
  - Delegates to `setPrimaryNode()`

- `handleClick(event)` - Line ~698
  - Calls `setPrimaryNode()` or `clearPrimaryNode()` based on click state
  - Calls `toggleMultiSelect()` for Ctrl+Click

### 2.2 Multi-Select Write Locations

**NodeLinkingSystem.js:**
- `toggleMultiSelect(node)` - Line ~946
  - Adds or removes node from `this.selectedNodes` Set
  - Converts primary node to multi-select on first multi-select

- `addToMultiSelect(node)` - Line ~960
  - Adds node to `this.selectedNodes` Set
  - Creates visual highlight (orange)
  - Starts pulse animation

- `removeFromMultiSelect(node)` - Line ~1000
  - Removes node from `this.selectedNodes` Set
  - Cleans up highlight and animation

- `clearMultiSelect()` - Line ~1018
  - Clears all nodes from `this.selectedNodes` Set
  - Removes all highlights and animations
  - Exits multi-select mode

### 2.3 Box Selection Write Locations

**NodeLinkingSystem.js:**
- `completeBoxSelection(additive)` - Line ~1152
  - Selects all nodes within screen-space box
  - Adds to existing selection if additive=true
  - Converts primary node to multi-select
  - Triggers pulse animations

### 2.4 Inspection State Write Locations

**FRAGMENTED - Each UI component owns its own state:**
- `UINodeInspectPanel.showPanel(node)` - Sets `this.currentNode`
- `UIPrimaryNodeTopBar3_7.showPanel(node)` - Sets `this.currentNode`
- `UISelectedNodeTopBar3_4.showPanel(node)` - Sets `this.currentNode`
- `NodeInspectLinguisticOverlay.showOverlay(node)` - Sets `this.currentNode`
- `NodeInspectOverlay1_0.showOverlay(node)` - Sets `this.currentNode`
- `NodeInspectOverlay3_0.showOverlay(node)` - Sets `this.currentNode`

**NO CENTRAL AUTHORITY** - Each component maintains independent state.

---

## SECTION 3 — EVENT OWNERSHIP MAP

### 3.1 Mouse/Pointer Event Handlers

| Event | DOM Listener | Owner System | Handler Method | Primary Action |
|-------|--------------|---------------|-----------------|-----------------|
| `mousedown` | `renderer.domElement` | NodeLinkingSystem | `handleMouseDown()` - RMB hold tracking, box selection start |
| `mouseup` | `renderer.domElement` | NodeLinkingSystem | `handleMouseUp()` - RMB hold completion, box selection end |
| `mousemove` | `renderer.domElement` | NodeLinkingSystem | `handleMouseMove()` - Box selection visual update |
| `click` | `renderer.domElement` | NodeLinkingSystem | `handleClick()` - Primary node selection, multi-select toggle, double-click detection |
| `contextmenu` | `renderer.domElement` | NodeLinkingSystem | `onContextMenu` - Clear selection |
| `keydown` | `document` | NodeLinkingSystem | `handleKeyDown()` - ESC to clear selection |

### 3.2 Touch Event Handlers

| Event | DOM Listener | Owner System | Handler Method | Primary Action |
|-------|--------------|---------------|-----------------|-----------------|
| `touchend` | `renderer.domElement` | NodeLinkingSystem | Inline handler - Convert to click |
| `mousedown/touchstart` | `jumpButton` | rosieMobileControls | handleJumpStart - Mobile jump |
| `mouseup/touchend` | `jumpButton` | rosieMobileControls | handleJumpEnd - Mobile jump |
| `click` | `renderer.domElement` | rosieMobileControls | onClick - Mobile interaction |

### 3.3 Capture Phase Listeners

**_NodeLinking2_3.js:**
- `document.addEventListener('mousedown', this._onMouseDownCapture, true)` - Line ~?
- `document.addEventListener('mouseup', this._onMouseUpCapture, true)` - Line ~?
- **Purpose:** RMB hold detection for unlink all links

**main.js:**
- `document.addEventListener("pointerdown", handler("handleMouseDown"))`
- `document.addEventListener("pointerup", handler("handleMouseUp"))`

### 3.4 Raycast Event Flow

**Crosshair Raycasting (NodeLinkingSystem):**
- `updateCrosshairNodeTargeting()` - Line ~?
- Writes to: `window.__crosshairRaycastState`
- Fields: `{ node, proxyHit, source, timestamp }`
- **CRITICAL:** Global state object shared by multiple systems

**Hover State Updates (NodeLinkingSystem):**
- `updateNodeHoverStates()` - Line ~?
- Reads from: `window.__crosshairRaycastState.node`
- Writes to: `this.hoveredNodeForSelection`
- Manages: `this.nodeSelectionGlows` (visual highlights)

---

## SECTION 4 — SELECTION STATE MACHINE RECONSTRUCTION

### 4.1 Primary Node Selection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER CLICK                             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  handleClick()   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         Empty Space?      Node Clicked?   Ctrl+Click?
              │              │              │
              ▼              ▼              ▼
    ┌──────────┐   ┌────────────┐  ┌──────────────┐
    │De-select  │   │ Set/Clear  │  │ Toggle       │
    │Primary    │   │ Primary     │  │ Multi-Select │
    └──────────┘   └────────────┘  └──────────────┘
         │               │               │
         │          ┌────┴────┐         │
         │          │         │         │
         │          ▼         ▼         │
         │    [Primary   [Primary    │
         │     Exists?]   = Clicked?]│
         │          │         │         │
         │    ┌─────┴─┐   │   ┌─────┴─┐
         │    │        │   │   │        │
         │    ▼        ▼   │   ▼        ▼
         │ [Clear]  [Set] │ [Add to]  [Remove]
         │ Primary   Primary│ Multi     from
         │          &      │ Select    Multi
         │          Link  │    │      Select
         │               │    └────┬────┘
         │               │         │
         │               │         ▼
         │               │    [Create Links from]
         │               │     All Multi-Selected]
         │               │         │
         │               │         ▼
         │               │   [Clear Multi-Select]
         │               │         │
         └───────────────┴─────────┘
```

### 4.2 Double-Click Detection Flow

```
User Click Node
      │
      ▼
handleClick()
      │
      ├─► Check timeSinceLastClick < DOUBLE_CLICK_THRESHOLD (300ms)
      │   │
      │   └─► YES: Double-click detected
      │       │
      │       ├─► Clear single-click timer
      │       ├─► Reset click state
      │       └─► setPrimaryNode(clickedNode) - New primary node
      │
      └─► NO: Potential single-click
          │
          ├─► Clear existing single-click timer
          ├─► Set new single-click timer (300ms delay)
          └─► Update click state (time, node)
              │
              ▼ (after 300ms)
          handleSingleClick()
              │
              ├─► Check multi-select mode
              │   │
              │   ├─► YES: Create links from multi-selected → target
              │   │         └─► Clear multi-select
              │   │
              │   └─► NO: Check primary node exists
              │       │
              │       ├─► NO: setPrimaryNode(clickedNode)
              │       │
              │       └─► YES: clickedNode === primaryNode?
              │           │
              │           ├─► YES: Do nothing (no deselect on single click)
              │           │
              │           └─► NO: attemptLink(primaryNode, clickedNode)
```

### 4.3 Multi-Select Flow

```
Ctrl+Click Node
      │
      ▼
toggleMultiSelect(node)
      │
      ├─► Node already selected?
      │   │
      │   ├─► YES: removeFromMultiSelect(node)
      │   │         └─► Check: selectedNodes.size === 0?
      │   │             └─► YES: Exit multi-select mode
      │   │
      │   └─► NO: addToMultiSelect(node)
      │           │
      │           ├─► First multi-select node?
      │           │   └─► YES: Convert primaryNode → multi-select
      │           │         └─► clearPrimaryNodeHighlight()
      │           │
      │           ├─► Add to selectedNodes Set
      │           ├─► Create orange highlight
      │           └─► Start pulse animation
```

### 4.4 Box Selection Flow

```
MouseDown (LMB) on Empty Space
      │
      ├─► Record start position
      ├─► Set startedOnEmpty = true
      └─► Return
          
MouseMove with startedOnEmpty
      │
      ├─► Update current position
      ├─► Calculate drag distance
      ├─► Check: distance > dragThreshold (5px)
      │   │
      │   └─► YES: Set isActive = true
      │           └─► Update visual box element
          
MouseUp (LMB) with isActive
      │
      ▼
completeBoxSelection(additive)
      │
      ├─► Get nodes in screen-space box
      ├─► Check: additive mode?
      │   │
      │   ├─► NO: Clear existing selection
      │   │       └─► Clear primary node if exists
      │   │
      │   └─► Add all box nodes to multi-select
      ├─► Trigger staggered pulse animations
      └─► Reset box selection state
```

### 4.5 RMB Hold Unlink Flow

```
MouseDown (RMB)
      │
      ├─► Track hovered node
      ├─► Set isHolding = true
      └─► Record hold start time
          
MouseUp (RMB)
      │
      ├─► Calculate hold duration
      ├─► Check: duration >= HOLD_THRESHOLD (350ms)
      │   │
      │   ├─► YES: holdThresholdMet = true
      │   │   │
      │   │   ├─► Check: multi-select mode?
      │   │   │   │
      │   │   │   ├─► YES: removeLinksFromMultiSelected()
      │   │   │   │       └─► Remove all links from all selected nodes
      │   │   │   │
      │   │   │   └─► NO: hoveredNode exists?
      │   │   │       └─► YES: removeAllLinksFromNode(hoveredNode)
      │   │   │
      │   │   └─► NO: Short RMB click (context menu)
      │   │       └─► Clear selection (onContextMenu)
      │   │
      │   └─► Reset RMB state after 50ms
```

---

## SECTION 5 — FRAGMENTATION ASSESSMENT

### 5.1 Critical Anti-Patterns Detected

#### ANTI-PATTERN 1: Duplicate Selection Variables

**Location:** `NodeLinkingSystem.js` Lines ~244, ~246

```javascript
this.selectedNode = null;  // Legacy selection
this.primaryNode = null;  // New primary node system
```

**Problem:** Two variables track "current selection" with sync points scattered throughout code:
- Line ~821: `this.selectedNode = node;` (sync in setPrimaryNode)
- Line ~927: `this.selectedNode = null;` (sync in clearPrimaryNode)
- Line ~1010: `this.primaryNode = null; this.selectedNode = null;` (sync in clearMultiSelect)

**Risk:** Inconsistent state if sync points missed.

#### ANTI-PATTERN 2: Unwired Selection Core

**Location:** `_NodeSelectionCore3_4.js`

**Problem:** Comprehensive selection system exists but is **NOT INTEGRATED**:
- `NodeSelectionCore3_4` class provides clean API: `selectNode()`, `deselectNode()`, `toggleSelect()`
- No instantiation found in main code
- No usage found in NodeLinkingSystem
- Appears to be dead code or abandoned refactoring attempt

**Risk:** Future developers may accidentally use this system, creating parallel selection state.

#### ANTI-PATTERN 3: Fragmented Inspection State

**Location:** 6+ UI components with independent `currentNode` variables

**Components:**
1. `UINodeInspectPanel.js` - `this.currentNode`
2. `_UIPrimaryNodeTopBar3_7.js` - `this.currentNode`
3. `_UISelectedNodeTopBar3_4.js` - `this.currentNode`
4. `_NodeInspectLinguisticOverlay.js` - `this.currentNode`
5. `NodeInspectOverlay1_0.js` - `this.currentNode`
6. `NodeInspectOverlay3_0.js` - `this.currentNode`

**Problem:** Each UI component maintains its own inspection state with no synchronization:
- No central inspection authority
- No way to know which component has the "current" inspected node
- Potential for multiple components showing different nodes simultaneously

**Risk:** Confusing user experience with inconsistent inspection state.

#### ANTI-PATTERN 4: Global State Pollution

**Location:** `window.__crosshairRaycastState`

**Problem:** Selection/targeting state stored in global window object:
- Any system can read/write to this state
- No single authority controls mutations
- Race conditions possible between systems

**Current Writers:**
- `NodeLinkingSystem.updateCrosshairNodeTargeting()`

**Current Readers:** (multiple systems via global access)
- NodeLinkingSystem (hover updates)
- Other systems (undocumented)

**Risk:** State corruption from uncoordinated writes.

#### ANTI-PATTERN 5: Multi-Select State Scattered

**Location:** `NodeLinkingSystem.js`

**State Variables:**
- `this.multiSelectMode` - Boolean flag
- `this.selectedNodes` - Set of node references
- `this.multiSelectHighlights` - Map of node → highlight mesh
- `this.selectionPulseAnimations` - Map of node → animation state

**Problem:** State scattered across 4 variables with manual synchronization:
- Clear multi-select requires clearing all 4 variables
- Add/remove requires updating multiple variables
- No atomic operations

**Risk:** Inconsistent state during complex operations.

### 5.2 Selection Authority Analysis

#### QUESTION: Is there a canonical InteractionAuthority?

**Answer: PARTIALLY - NodeLinkingSystem is DE FACTO authority but incomplete.**

**Evidence:**
1. ✅ `NodeLinkingSystem` owns primary selection (`primaryNode`, `selectedNode`)
2. ✅ `NodeLinkingSystem` owns hover state (`hoveredNodeForSelection`)
3. ✅ `NodeLinkingSystem` owns multi-select (`selectedNodes`, `multiSelectMode`)
4. ❌ Inspection state is **NOT** owned by `NodeLinkingSystem` (fragmented across UI components)
5. ❌ Crosshair state is in **GLOBAL** `window.__crosshairRaycastState`
6. ❌ Unwired `NodeSelectionCore3_4` exists as alternative authority

**Conclusion:** NodeLinkingSystem is the primary authority but **NOT CANONICAL** due to:
- Fragmented inspection state
- Global crosshair state
- Unwired selection core alternative

### 5.3 Multiple Systems Writing State

#### DUAL SELECTION SYSTEMS DETECTED

**System 1: NodeLinkingSystem (ACTIVE)**
- Primary selection: `primaryNode`, `selectedNode`
- Multi-select: `selectedNodes`
- Hover: `hoveredNodeForSelection`

**System 2: NodeSelectionCore3_4 (INACTIVE/UNWIRED)**
- Primary selection: `selectedNode`
- Primary node: `primaryNode`
- Double-click detection: `lastClickTime`, `lastClickedNode`

**Risk:** If System 2 is ever instantiated, it will create conflicting selection state.

### 5.4 State Mutated From Outside Owning Class

**DETECTED: Global crosshair state mutations**

**Location:** `window.__crosshairRaycastState`

**Owner:** NodeLinkingSystem writes this, but:
- **NO ENFORCEMENT** prevents other systems from writing
- Any system with window access can mutate
- No validation or authority checks

**Example:**
```javascript
// NodeLinkingSystem.js - updateCrosshairNodeTargeting()
crosshairState.node = resolvedNode;
crosshairState.proxyHit = true;
crosshairState.source = 'proxy';
crosshairState.timestamp = Date.now();
```

**Other systems CAN write:**
```javascript
// ANYWHERE in codebase
window.__crosshairRaycastState.node = someNode; // No protection
```

**Risk:** State corruption from uncoordinated writes.

### 5.5 Selection Reset During World Switch

**SEARCHED FOR:** World switch selection reset logic

**FOUND:** `NodeLinkingSystem.setWorldReady(ready)` - Line ~?

```javascript
setWorldReady(ready) {
  this.worldReady = ready;
  if (!ready) {
    // Mark all existing links as "just created" on world reset
    this.links.forEach(link => {
      link._justCreated = true;
    });
  }
}
```

**ANALYSIS:**
- ✅ World ready flag exists
- ❌ **NO selection reset** during world switch
- ❌ **NO cleanup** of `primaryNode`, `selectedNode`, `selectedNodes`
- ❌ **NO cleanup** of hover state `hoveredNodeForSelection`

**Risk:** Selection state persists across world switches, potentially referencing destroyed nodes.

### 5.6 Input Event Fragmentation

**MULTIPLE EVENT HANDLERS DETECTED:**

**System 1: NodeLinkingSystem.js**
- `mousedown` on `renderer.domElement`
- `mousemove` on `renderer.domElement`
- `mouseup` on `renderer.domElement`
- `click` on `renderer.domElement`
- `contextmenu` on `renderer.domElement`
- `keydown` on `document`

**System 2: _NodeLinking2_3.js**
- `mousedown` on `document` (capture phase)
- `mouseup` on `document` (capture phase)
- **Purpose:** RMB hold detection for unlink

**System 3: main.js**
- `pointerdown` on `document`
- `pointerup` on `document`

**System 4: rosie/controls/rosieMobileControls.js**
- `mousedown/touchstart` on `jumpButton`
- `mouseup/touchend` on `jumpButton`
- `click` on `renderer.domElement`

**Problem:** Multiple systems listening to same events with overlapping purposes:
- RMB click handling: System 1 (contextmenu) AND System 2 (RMB hold)
- Mouse tracking: System 1 AND System 2
- Priority order undefined

**Risk:** Event handling conflicts, duplicate processing, unpredictable behavior.

---

## RECOMMENDATIONS (FOR FUTURE PHASE)

### R1: Consolidate Selection Authority

**Action:** Designate `NodeLinkingSystem` as **CANONICAL SELECTION AUTHORITY**

**Implementation:**
1. Move `selectedNode`, `primaryNode` to be **THE ONLY** selection variables
2. Remove sync points - use single source of truth
3. Delete or deprecate `_NodeSelectionCore3_4.js` if unused
4. Document: "All selection state MUST be queried/modified via NodeLinkingSystem"

### R2: Centralize Inspection State

**Action:** Move inspection authority to `NodeLinkingSystem` or dedicated `InspectionAuthority`

**Implementation:**
1. Add `this.inspectedNode` to NodeLinkingSystem
2. Add API: `setInspectedNode(node)`, `getInspectedNode()`, `clearInspectedNode()`
3. Refactor all UI components to use this API
4. Remove duplicate `currentNode` variables from UI components

### R3: Encapsulate Crosshair State

**Action:** Move `window.__crosshairRaycastState` into NodeLinkingSystem

**Implementation:**
1. Add private property: `this._crosshairState = { node, proxyHit, source, timestamp }`
2. Add getter: `getCrosshairState()` for read-only access
3. Update all readers to use `linkingSystem.getCrosshairState()`
4. Remove global window pollution

### R4: Unify Multi-Select State

**Action:** Consolidate multi-select state into single object

**Implementation:**
```javascript
this.multiSelectState = {
  mode: false,
  nodes: new Set(),
  highlights: new Map(),
  animations: new Map()
};
```

5. Add methods:
- `toggleMultiSelect(node)`
- `addToMultiSelect(node)`
- `removeFromMultiSelect(node)`
- `clearMultiSelect()`

### R5: Add World Switch Selection Reset

**Action:** Clear selection during world switch

**Implementation:**
```javascript
setWorldReady(ready) {
  this.worldReady = ready;
  if (!ready) {
    // Clear all selection state
    this.clearPrimaryNode();
    this.clearMultiSelect();
    this.hoveredNodeForSelection = null;
    this.clearAllNodeSelectionGlows();
  }
}
```

### R6: Unify Event Handling

**Action:** Consolidate input event listeners

**Implementation:**
1. Designate `NodeLinkingSystem` as **CANONICAL INPUT AUTHORITY**
2. Remove duplicate listeners from `_NodeLinking2_3.js`
3. Move RMB hold logic into NodeLinkingSystem
4. Document: "All mouse/keyboard events MUST be handled by NodeLinkingSystem"
5. Coordinate with mobile controls (rosie) via callbacks, not duplicate listeners

---

## CONCLUSION

**Selection State Ownership Status:** FRAGMENTED

**Critical Issues:**
1. ✗ No single canonical authority
2. ✗ Duplicate selection variables (`selectedNode` vs `primaryNode`)
3. ✗ Unwired alternative system (`NodeSelectionCore3_4`)
4. ✗ Fragmented inspection state (6+ independent components)
5. ✗ Global state pollution (`window.__crosshairRaycastState`)
6. ✗ Scattered multi-select state (4 variables)
7. ✗ No world switch selection reset
8. ✗ Duplicate event handlers

**De Facto Authority:** `NodeLinkingSystem` (incomplete)

**Risk Level:** HIGH

**Stability Impact:** MEDIUM - Current system works but is fragile and prone to state corruption during complex interactions.

**Maintainability Impact:** HIGH - Multiple systems creating/conflicting selection state makes bugs difficult to trace and fix.

---

**END OF AUDIT**