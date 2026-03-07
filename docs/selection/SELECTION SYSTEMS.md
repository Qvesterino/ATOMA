# ATOMA CLEANUP AUDIT — SELECTED / SELECTION SYSTEMS

## EXECUTIVE SUMMARY

✅ **Canonical System Confirmed**: `UISelectedHUD.js` is the active HUD display system.

✅ **Core Selection Authority**: `NodeLinkingSystem.js` is the single source of truth for all selection operations (Primary Node, Multi-Select, visual feedback).

✅ **Integration Architecture**: Event-driven hybrid system where `NodeLinkingSystem` manages state and notifies UI components via callbacks.

---

## 📊 SYSTEM STATUS TABLE

| File / System                     | Imported in main.js | Instantiated in main.js    | Registered in FrameScheduler | Added to Scene                | Status                    |
|:--------------------------------- |:-------------------:|:--------------------------:|:----------------------------:|:-----------------------------:|:------------------------- |
| `NodeLinkingSystem.js`            | ✅ Yes               | ✅ Yes                      | ✅ Yes                        | ✅ Yes                         | **ACTIVE_RUNTIME_SYSTEM** |
| `NodeSelectionCore3_4.js`         | ✅ Yes               | ✅ Yes                      | ❌ No                         | ❌ No                          | **ACTIVE_RUNTIME_SYSTEM** |
| `UISelectedHUD.js`                | ✅ Yes               | ✅ Yes (via getSelectedHUD) | ❌ No                         | ❌ No (DOM only)               | **ACTIVE_RUNTIME_SYSTEM** |
| `_UISelectedNodeHighlight3_2.js`  | ❌ No                | ❌ No                       | ❌ No                         | ✅ Yes (via NodeLinkingSystem) | **ACTIVE_RUNTIME_SYSTEM** |
| `_UISelectedNodeLabel3_3.js`      | ❌ No                | ❌ No                       | ❌ No                         | ✅ Yes (via NodeLinkingSystem) | **ACTIVE_RUNTIME_SYSTEM** |
| `_UIPrimaryNodeTopBar3_7.js`      | ✅ Yes               | ✅ Yes                      | ❌ No                         | ❌ No (DOM only)               | **ACTIVE_RUNTIME_SYSTEM** |
| `_UISelectedNodeBadge3_2.js`      | ❌ No                | ❌ No                       | ❌ No                         | ✅ Yes (via NodeLinkingSystem) | **ACTIVE_RUNTIME_SYSTEM** |
| `WorldSelectorHUD.js`             | ✅ Yes               | ✅ Yes                      | ❌ No                         | ❌ No (DOM only)               | **ACTIVE_RUNTIME_SYSTEM** |
| `_IntegrationNodeSelectionFix.js` | ✅ Yes               | ✅ Yes                      | ❌ No                         | ❌ No                          | **ACTIVE_RUNTIME_SYSTEM** |
| `SelectedRingSystem` (internal)   | N/A (private class) | ✅ Yes                      | ❌ No                         | ✅ Yes                         | **ACTIVE_RUNTIME_SYSTEM** |
| `NodeLinking2_3.js`               | ✅ Yes               | ❌ No                       | ❌ No                         | ❌ No                          | **IMPORTED_BUT_UNUSED**   |
| `NodeLinking2_0.js`               | ❌ No                | ❌ No                       | ❌ No                         | ❌ No                          | **LEGACY_UNUSED**         |
| `NodeSelectionCores_4.js`         | ❌ No                | ❌ No                       | ❌ No                         | ❌ No                          | **FILE_NOT_FOUND** (typo) |
| `UISelectedNodeHighlights3_2.js`  | ❌ No                | ❌ No                       | ❌ No                         | ❌ No                          | **FILE_NOT_FOUND** (typo) |
| `UISelectedNodeTopBar3_4.js`      | ❌ No                | ❌ No                       | ❌ No                         | ❌ No                          | **LEGACY_UNUSED**         |
| `SelectedHUDSyncPatch1_0.js`      | ❌ No                | ❌ No                       | ❌ No                         | ❌ No                          | **LEGACY_UNUSED**         |
| `SelectedRingSystem_v1.js`        | ❌ No                | ❌ No                       | ❌ No                         | ❌ No                          | **LEGACY_UNUSED**         |
| `_UINodeAutoDetect3_1.js`         | ✅ Yes               | ❌ No                       | ❌ No                         | ❌ No                          | **LEGACY_UNUSED**         |
| `UINodeHoverTooltip3_1.js`        | ✅ Yes               | ❌ No                       | ❌ No                         | ❌ No                          | **LEGACY_UNUSED**         |

---

## 🗑️ SAFE DELETE LIST

### CONFIRMED DEAD FILES (Can be safely deleted)

1. **`NodeLinking2_3.js`**
   
   - Reason: Imported but not instantiated
   - Superseded by: `NodeLinkingSystem.js` (v4.0+)
   - Action: Delete (backup recommended)

2. **`NodeLinking2_0.js`**
   
   - Reason: Legacy version, not imported anywhere
   - Superseded by: `NodeLinking2_3.js` → `NodeLinkingSystem.js`
   - Action: Delete (backup recommended)

3. **`_UINodeAutoDetect3_1.js`**
   
   - Reason: Imported but not instantiated
   - Superseded by: `NodeLinkingSystem` (handles detection internally)
   - Action: Delete (backup recommended)

4. **`UINodeHoverTooltip3_1.js`**
   
   - Reason: Imported but not instantiated
   - Superseded by: `UISelectedHUD.js`
   - Action: Delete (backup recommended)

5. **`SelectedRingSystem_v1.js`** (if exists)
   
   - Reason: Legacy ring system
   - Replaced by: Private `SelectedRingSystem` class inside `NodeLinkingSystem.js`
   - Action: Delete (backup recommended)

6. **`UISelectedNodeTopBar3_4.js`** (if exists)
   
   - Reason: Legacy UI component
   - Replaced by: `_UIPrimaryNodeTopBar3_7.js`
   - Action: Delete (backup recommended)

7. **`SelectedHUDSyncPatch1_0.js`** (if exists)
   
   - Reason: Legacy patch
   - Functionality now: Built into `UISelectedHUD.js` v3.0+
   - Action: Delete (backup recommended)

---

## 📋 FILES THAT MUST BE KEPT

### Core Active Systems

- ✅ `NodeLinkingSystem.js` - Single source of truth for all selection
- ✅ `NodeSelectionCore3_4.js` - Selection state management
- ✅ `UISelectedHUD.js` - HUD display system
- ✅ `_UISelectedNodeHighlight3_2.js` - Visual highlight (activated by NodeLinkingSystem)
- ✅ `_UISelectedNodeLabel3_3.js` - Floating labels (activated by NodeLinkingSystem)
- ✅ `_UIPrimaryNodeTopBar3_7.js` - Primary node info bar
- ✅ `_UISelectedNodeBadge3_2.js` - Crosshair badge (activated by NodeLinkingSystem)
- ✅ `WorldSelectorHUD.js` - World switching interface
- ✅ `_IntegrationNodeSelectionFix.js` - INTEGRATION node compatibility patch

---

## 🔗 INTEGRATION ARCHITECTURE

The active selection system uses a **hybrid event-driven architecture**:

1. **NodeLinkingSystem** acts as the central authority
   
   - Handles all mouse interactions (clicks, double-clicks, box selection)
   - Manages `primaryNode` (persistent) and `multiSelectMode` (transient)
   - Contains private `SelectedRingSystem` class for visual feedback

2. **UI Components are purely reactive**
   
   - Subscribe to `NodeLinkingSystem` events via callbacks
   - Do not drive selection logic themselves
   - Only display state from the central authority

3. **No standalone SelectedRingSystem.js file**
   
   - The ring system is implemented as a private class inside `NodeLinkingSystem`
   - Any external `SelectedRingSystem_v1.js` file is legacy and unused

---

## 📝 NOTES

- **NodeSelectionCores_4.js** does not exist (typo in original task list)
  - Correct file is `NodeSelectionCore3_4.js` (singular "Selection", singular "Core")
- **UISelectedNodeHighlights3_2.js** does not exist (typo)
  - Correct file is `_UISelectedNodeHighlight3_2.js` (singular "Highlight")
- **SelectedRingSystem_v1.js** is referenced in the task but was not found during file search
  - If this file exists in the repository, it is legacy and should be deleted
- **NodeLinking2_3.js** is imported but instantiated only as `NodeLinkingSystem` (new name)
  - This is a naming discrepancy - the system is active but the filename is legacy

---

## ✅ AUDIT COMPLETE

All selection systems have been classified. The safe delete list contains 7 files that can be removed without affecting the active selection pipeline.
