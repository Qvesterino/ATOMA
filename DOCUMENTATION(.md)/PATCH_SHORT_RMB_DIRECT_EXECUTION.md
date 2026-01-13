# PATCH: SHORT RMB DIRECT EXECUTION FIX for _NodeLinking2_3.js

## Problem
Selection was being cleared between the mouseup event and when `unlinkSelectedNode()` was called, resulting in no node being available for unlinking.

## Root Cause
The flag-based deferred approach (setting `_rmbShortClickFlag` in mouseup, checking in contextmenu) was too late. By the time contextmenu fired, selection was already cleared by something else in the event chain.

## Solution
**Execute `unlinkSelectedNode()` DIRECTLY in the mouseup event handler** while selection is still guaranteed to be active. This is the earliest point where we have valid duration data and can act on it.

---

## EXACT CHANGES

### File: `_NodeLinking2_3.js`

#### 1. Constructor (Line 44-46) - Removed Flag
**BEFORE:**
```javascript
this._rmbDownTime = 0;
this._rmbLongHoldTriggered = false;
this._rmbShortClickFlag = false;  // ← REMOVED
```

**AFTER:**
```javascript
this._rmbDownTime = 0;
this._rmbLongHoldTriggered = false;
```

---

#### 2. Mouseup Handler (Lines 65-88) - Direct Execution
**BEFORE:**
```javascript
this._onMouseUpCapture = (e) => {
  if (!this.enabled) return;
  if (e.button === 2) {
    const now = performance.now();
    const duration = now - (this._rmbDownTime || now);
    
    if (duration >= 300) {
      this._rmbLongHoldTriggered = true;
      console.log('[RMB-UP] Long hold detected (' + duration.toFixed(0) + 'ms)');
    } else if (duration < 220) {
      console.log('[RMB-UP] Short click detected (' + duration.toFixed(0) + 'ms)');
      this._rmbShortClickFlag = true;  // ← FLAG SET
    }
    this._rmbDownTime = 0;
  }
};
```

**AFTER:**
```javascript
this._onMouseUpCapture = (e) => {
  if (!this.enabled) return;
  if (e.button === 2) {
    const now = performance.now();
    const duration = now - (this._rmbDownTime || now);
    
    // ================================================================
    // SHORT RMB CLICK (< 220ms) - UNLINK FIRST (before deselection)
    // ================================================================
    if (duration < 220) {
      console.log('[RMB-UP] Short click detected (' + duration.toFixed(0) + 'ms)');
      this.unlinkSelectedNode();  // ← DIRECT EXECUTION (IMMEDIATE)
    }
    // ================================================================
    // LONG RMB HOLD (>= 300ms) - trigger Ghost Mode
    // ================================================================
    else if (duration >= 300) {
      this._rmbLongHoldTriggered = true;
      console.log('[RMB-UP] Long hold detected (' + duration.toFixed(0) + 'ms)');
    }
    // else: 220-300ms range - do nothing, let it be ignored
    
    this._rmbDownTime = 0;
  }
};
```

**Key Change:**
- Replaced `this._rmbShortClickFlag = true;` with `this.unlinkSelectedNode();`
- Moved the unlink execution to happen IMMEDIATELY in mouseup
- Ensures selection is definitely still active

---

#### 3. _onRightClick Handler (Lines 195-213) - Simplified
**BEFORE:**
```javascript
_onRightClick(e) {
  if (!this.enabled) return;

  const selectedNode = this.selectionCore?.getSelected();

  // ===============================================
  // SHORT RMB CLICK (< 220ms) - Unlink FIRST
  // ===============================================
  if (this._rmbShortClickFlag) {
    console.log('[RMB-SHORT] Processing short click unlink');
    this.unlinkSelectedNode();
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

**AFTER:**
```javascript
_onRightClick(e) {
  if (!this.enabled) return;

  const selectedNode = this.selectionCore?.getSelected();

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

**Key Changes:**
- Removed short RMB flag checking (no longer needed)
- Only handles ghost mode (long RMB)
- Short RMB unlink now happens in mouseup, not contextmenu

---

## Event Execution Timeline - CORRECTED

### Short RMB (<220ms)
```
1. mousedown (button===2)
   └─ _onMouseDownCapture fires
      └─ Record _rmbDownTime
      
2. mouseup (button===2) ← EXECUTION POINT
   └─ _onMouseUpCapture fires
      ├─ Calculate duration
      ├─ If duration < 220ms:
      │  ├─ Get selectedNode (STILL ACTIVE)
      │  ├─ Call unlinkSelectedNode()  ✓ RUNS HERE
      │  │  ├─ Find all links from node
      │  │  ├─ Remove each link
      │  │  ├─ Deselect node
      │  │  └─ Log: "[RMB-UNLINK] Removed X links..."
      │  └─ Return (early exit)
      
3. contextmenu event (no longer processes short RMB)
   └─ Prevented from interfering
```

### Long RMB (>=300ms)
```
1. mousedown (button===2)
   └─ _onMouseDownCapture fires
      
2. mouseup (button===2)
   └─ _onMouseUpCapture fires
      ├─ Calculate duration
      ├─ If duration >= 300ms:
      │  └─ Set _rmbLongHoldTriggered = true
      
3. contextmenu event
   └─ _onRightClick(e) fires
      └─ Check _rmbLongHoldTriggered
         └─ Call handleGhostMode()  ✓ GHOST MODE
```

---

## Why This Works

✅ **Selection Guaranteed Active** - Unlink runs in mouseup, before any deselection can occur  
✅ **No Race Conditions** - Direct execution eliminates timing issues  
✅ **Earliest Point** - Mouseup is when duration data is first available  
✅ **Clean Separation** - Short and long RMB have independent execution paths  
✅ **Ghost Mode Untouched** - Long RMB continues to work via contextmenu  
✅ **LMB Unaffected** - No changes to selection/linking logic  

---

## Console Output - EXPECTED

**Short RMB with links:**
```
[RMB-UP] Short click detected (185ms)
[RMB-UNLINK] Removed 3 links from node Alpha
[RMB-UNLINK] Deselected node Alpha
```

**Long RMB:**
```
[RMB-UP] Long hold detected (450ms)
[RMB-GHOST] Activating ghost mode
[GHOST] Muting link flow for node Alpha
```

---

## Files Modified
- `_NodeLinking2_3.js` (3 sections)

## Files NOT Modified
- ✅ NodeSelectionCore3_4.js
- ✅ LinkingSystem
- ✅ Ghost mode logic
- ✅ LMB handler
- ✅ AI layers

---

## Testing Checklist

- [ ] Short RMB (<220ms) on selected node with links → Links removed immediately
- [ ] Short RMB (<220ms) on selected node with 0 links → Node deselected
- [ ] Console shows: `[RMB-UP] Short click detected (XXms)`
- [ ] Console shows: `[RMB-UNLINK] Removed X links from node`
- [ ] Long RMB (>=300ms) → Ghost mode activates (unchanged)
- [ ] LMB selection → Works normally
- [ ] 220-300ms range → No action
- [ ] No console errors

---

**Status: ✅ READY FOR TESTING**

The fix executes `unlinkSelectedNode()` in the mouseup event handler - the earliest possible point where we have duration data and guaranteed active selection. This eliminates all timing issues between mouseup and contextmenu events.
