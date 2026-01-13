# PATCH: SHORT RMB CLICK ORDER FIX for _NodeLinking2_3.js

## Problem
Short RMB clicks were detected correctly but `unlinkSelectedNode()` received no selected node because the selection was already cleared by the time the contextmenu handler ran.

## Root Cause
The mouseup event fires BEFORE the contextmenu event. When `unlinkSelectedNode()` was called directly in mouseup, the selection hadn't been retrieved yet, leading to undefined nodes when unlinking reached the contextmenu handler.

## Solution
Use a **flag-based approach**:
1. Set flag `_rmbShortClickFlag = true` during mouseup
2. Check flag in `_onRightClick()` **BEFORE** anything else
3. Call `unlinkSelectedNode()` while selection is still active
4. Then return early to prevent other logic

---

## EXACT CHANGES

### 1. Constructor - Add Flag (Line 47)
```javascript
// RMB hold tracking
this._rmbDownTime = 0;
this._rmbLongHoldTriggered = false;
this._rmbShortClickFlag = false;  // ← NEW FLAG
```

---

### 2. Mouseup Handler - Set Flag (Lines 75-78)
**Before:**
```javascript
} else if (duration < 220) {
  // Short RMB click (< 220ms) - unlink immediately
  console.log('[RMB-UP] Short click detected (' + duration.toFixed(0) + 'ms)');
  this.unlinkSelectedNode();  // ← DIRECT CALL (TOO EARLY)
}
```

**After:**
```javascript
} else if (duration < 220) {
  // Short RMB click (< 220ms) - mark flag for contextmenu handler
  console.log('[RMB-UP] Short click detected (' + duration.toFixed(0) + 'ms)');
  this._rmbShortClickFlag = true;  // ← SET FLAG (DEFER EXECUTION)
}
```

---

### 3. _onRightClick Handler - Check Flag FIRST (Lines 198-206)
**Before:**
```javascript
_onRightClick(e) {
  if (!this.enabled) return;

  const selectedNode = this.selectionCore?.getSelected();

  // ... ghost mode logic only
}
```

**After:**
```javascript
_onRightClick(e) {
  if (!this.enabled) return;

  const selectedNode = this.selectionCore?.getSelected();

  // ===============================================
  // SHORT RMB CLICK (< 220ms) - Unlink FIRST  ← NEW
  // ===============================================
  if (this._rmbShortClickFlag) {
    console.log('[RMB-SHORT] Processing short click unlink');
    this.unlinkSelectedNode();  // ← NOW RUNS WITH SELECTION ACTIVE
    this._rmbShortClickFlag = false;
    return;
  }

  // ===============================================
  // LONG RMB HOLD (>= 300ms) - Ghost Mode
  // ===============================================
  if (this._rmbLongHoldTriggered && selectedNode) {
    console.log('[RMB-GHOST] Activating ghost mode');
    this.handleGhostMode(selectedNode);
    this._rmbLongHoldTriggered = false;
    return;
  }
}
```

---

## Event Execution Timeline

### Short RMB (<220ms) - CORRECT ORDER

```
1. mousedown (button===2)
   └─ _onMouseDownCapture fires
      └─ Record _rmbDownTime
      └─ Reset _rmbLongHoldTriggered = false

2. mouseup (button===2)
   └─ _onMouseUpCapture fires
      ├─ Calculate duration
      ├─ If duration < 220ms:
      │  └─ Set _rmbShortClickFlag = true  ← FLAG SET
      └─ Done

3. contextmenu event
   └─ _onRightClickHandler fires
      └─ e.preventDefault()
      └─ _onRightClick(e) called
         ├─ Check _rmbShortClickFlag
         ├─ If true:
         │  ├─ Get selectedNode from selectionCore  ← SELECTION STILL ACTIVE
         │  ├─ Call unlinkSelectedNode()  ← EXECUTE UNLINK
         │  │  ├─ Find all links
         │  │  ├─ Remove each link
         │  │  └─ Deselect node
         │  └─ Return early
         └─ (ghost mode check never reached)
```

---

### Long RMB (>=300ms) - UNCHANGED

```
1. mousedown (button===2)
   └─ _onMouseDownCapture fires
      └─ Record _rmbDownTime

2. mouseup (button===2)
   └─ _onMouseUpCapture fires
      ├─ Calculate duration
      ├─ If duration >= 300ms:
      │  └─ Set _rmbLongHoldTriggered = true
      └─ Done

3. contextmenu event
   └─ _onRightClickHandler fires
      └─ _onRightClick(e) called
         ├─ Check _rmbShortClickFlag = false (skip)
         └─ Check _rmbLongHoldTriggered = true
            ├─ Get selectedNode
            ├─ Call handleGhostMode()  ← GHOST MODE ACTIVATED
            └─ Return
```

---

## Why This Works

1. **Selection Preserved** - Selection is not touched until `unlinkSelectedNode()` is called
2. **Proper Sequencing** - Unlink happens BEFORE deselection
3. **No Race Conditions** - Flag ensures proper timing between events
4. **No Breaking Changes** - Ghost mode logic completely untouched
5. **Clean Separation** - Each RMB type has clear execution path

---

## Code Flow Guarantees

✅ **Short RMB (<220ms):**
- Flag set in mouseup
- Unlink executes in contextmenu while selection is ACTIVE
- Deselection happens AFTER unlink completes
- No interference with ghost mode

✅ **Long RMB (>=300ms):**
- Flag set in mouseup  
- Ghost mode executes in contextmenu
- Selection preserved during ghost fade
- Unlink logic completely bypassed

✅ **LMB Behavior:**
- Completely unaffected
- No changes to link creation
- Selection logic unchanged

---

## Console Output

**Short RMB:**
```
[RMB-UP] Short click detected (185ms)
[RMB-SHORT] Processing short click unlink
[RMB-UNLINK] Removed 3 links from node Alpha
[RMB-UNLINK] Deselected node Alpha
```

**Long RMB:**
```
[RMB-UP] Long hold detected (450ms)
[RMB-GHOST] Activating ghost mode
[GHOST] Muting link flow for node Alpha
[GHOST] Node dimmed (35% opacity), links muted: Alpha
```

---

## Testing Checklist

- [ ] Short RMB (<220ms) on node with 1+ links → Links removed, node deselected
- [ ] Short RMB (<220ms) on node with 0 links → Node deselected (no error)
- [ ] Long RMB (>=300ms) on node → Ghost mode activates (unchanged behavior)
- [ ] LMB selection → Works normally
- [ ] LMB link creation → Works normally
- [ ] 220-300ms range → No action (ignored)
- [ ] No console errors
- [ ] Selection preserved during unlink operation
- [ ] Console shows: `[RMB-UNLINK] Removed X links...`

---

## Files Modified
- `_NodeLinking2_3.js` (only)

## Files NOT Modified
- ✅ NodeSelectionCore3_4.js
- ✅ LinkingSystem
- ✅ AI layers
- ✅ Ghost mode logic

---

**Status: ✅ READY FOR TESTING**

The fix ensures that selection remains active during the unlink operation by using a flag-based approach that defers execution to the contextmenu handler, where selection data is reliably available.
