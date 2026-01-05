# Linking System Stabilization Pack 2.0 — TESTING GUIDE (Phase C)

**Status:** Ready for Verification  
**Testing Scope:** Manual + Console Observation

---

## ✅ Test Protocol

### Setup
```javascript
// Console access (F12 in browser)
// Keep console open during all tests
// Watch for [Stab2] debug messages
```

---

## 🧪 Test Suite (4 Scenarios)

### TEST 1: Basic Link Persistence ⭐ CRITICAL

**Objective:** Verify links persist after deselect/reselect cycle

**Steps:**
1. Spawn 2 nodes (A and B) - let them settle in scene
2. Click on node A
   - Look at console:
     ```
     ✓ Node selected: [category]
     [Stab2] Selected nodeId: uuid-xxx, links found: 0
     ```
3. Click on node B to link
   - Should see:
     ```
     ✓ Link created: [A] → [B]
     [SelectedHUD] Link created: ...
     ```
   - HUD should show: `LINKED: [B's category]`

4. Click empty space to deselect
   - HUD should show: `LINKED: NONE`
   - Console shows: Node deselected

5. Click on node A again
   - Console should show:
     ```
     ✓ Node selected: [category]
     [Stab2] Selected nodeId: uuid-xxx (SAME ID!), links found: 1
     ```
   - **CRITICAL:** HUD should show: `LINKED: [B's category]` ✅

**Expected Result:** Links persist, HUD updates correctly

**Fail Condition:** HUD shows "LINKED: NONE" after reselection

---

### TEST 2: Multiple Links

**Objective:** Verify HUD handles 3+ linked nodes

**Steps:**
1. Spawn 4 nodes (A, B, C, D)
2. Create links: A→B, A→C, A→D
   - Console for each:
     ```
     ✓ Link created: A → [target]
     [Stab2] ...links found: 1
     [Stab2] ...links found: 2
     [Stab2] ...links found: 3
     ```
3. Click A (while selected)
   - HUD shows: `LINKED: B, C, D` (or some order)
4. Deselect (click empty)
5. Reselect A
   - Console:
     ```
     [Stab2] Selected nodeId: uuid-A, links found: 3
     ```
   - HUD shows: Same categories as before ✅

**Expected Result:** All 3 links persist, count stays consistent

**Fail Condition:** Link count changes, categories disappear

---

### TEST 3: Link Removal

**Objective:** Verify removing link updates HUD

**Steps:**
1. Create 3 links: A→B, A→C, A→D (same as TEST 2)
2. With A selected, HUD shows: `LINKED: B, C, D`
3. Right-click on link A→B, select "Delete Link"
   - Console:
     ```
     ✓ Link removed: A → B
     [SelectedHUD] Link removed: ...
     [SelectedHUD] ✓ Updated display for link removal
     ```
4. HUD updates to: `LINKED: C, D` ✅
5. Deselect and reselect A
   - Console:
     ```
     [Stab2] Selected nodeId: uuid-A, links found: 2
     ```
   - HUD shows: `LINKED: C, D` (still 2 links) ✅

**Expected Result:** Link removal reflected in HUD, persists on reselection

**Fail Condition:** HUD doesn't update, wrong count after reselection

---

### TEST 4: World Transitions

**Objective:** Verify clean transitions between worlds

**Steps:**
1. Create links in current world: A→B, A→C
2. Switch to another dream world / reset
   - Console should show cleanup
   - Links disposed from scene
3. Return to first world (or load fresh)
   - Old links gone ✓
4. Spawn new nodes, create new links
   - New nodeIds assigned
   - Links work normally ✅

**Expected Result:** World transition clean, no crashes, no stale links

**Fail Condition:** Old links visible, console errors, HUD broken

---

### TEST 5: Stress Test (BONUS)

**Objective:** Rapid selection cycles don't break system

**Steps:**
1. Create 2 linked nodes A↔B
2. Click A, click empty, click A, click empty... (10 times rapidly)
   - Console should show repeated:
     ```
     ✓ Node selected: ...
     [Stab2] Selected nodeId: uuid-A, links found: 1
     ```
3. No console errors ✓
4. HUD shows "LINKED: B" every time A selected ✅

**Expected Result:** System handles rapid cycles smoothly

**Fail Condition:** Errors, HUD confusion, missing links

---

## 📊 Expected Console Output Pattern

### Successful Test Sequence:
```
✓ Node selected: input
[Stab2] Selected nodeId: 8a7c9f2e-123a-4b56-89cd-abc123def456, links found: 0

✓ Node selected: process
[SelectedHUD] Link created: input → process
✓ Link created: input → process [NORMAL synergy] [SAFE VFX PACK ACTIVE]
[Stab2] Selected nodeId: 9b8d0g3f-234b-5c67-90de-bcd234efg567, links found: 1
[SelectedHUD] ✓ Updated display for link creation

✓ Node deselected
[SelectedHUD] Callback fired - node deselected

✓ Node selected: input
[Stab2] Selected nodeId: 8a7c9f2e-123a-4b56-89cd-abc123def456, links found: 1
[SelectedHUD] ✓ Updated display for link creation
```

### Key Indicators ✓
- `[Stab2]` messages appear on selection
- `links found: N` shows count
- Same `nodeId` after deselect/reselect
- Count matches expected links

### Red Flags ❌
- `links found: 0` when expecting links
- Different `nodeId` for same node
- Console errors
- HUD not updating

---

## 🔍 Debug Commands

```javascript
// In console, after selecting a node:

// Get node references
const node = window.game.linkingSystem.selectedNode;
const nodeId = window.game.linkingSystem.getNodeId(node);
const links = window.game.linkingSystem.getNodeLinks(node);

// Check map state
console.log(window.game.linkingSystem.nodeIdToLinks);

// Verify specific link
links.forEach((link, i) => {
  console.log(`Link ${i}:`, {
    source: link.source.userData.category,
    target: link.target.userData.category,
    sourceNodeId: link.sourceNodeId,
    targetNodeId: link.targetNodeId,
    active: link.active,
    valid: window.game.linkingSystem.isLinkValid(link)
  });
});
```

---

## ✅ Acceptance Criteria

### MUST PASS:
- [ ] TEST 1: Basic link persistence (CRITICAL)
- [ ] TEST 2: Multiple links handled correctly
- [ ] TEST 3: Link removal updates HUD
- [ ] TEST 4: World transitions clean

### SHOULD PASS:
- [ ] TEST 5: Rapid selection cycles stable
- [ ] Debug commands show correct data
- [ ] No console errors in any test
- [ ] [Stab2] logs show consistent nodeId

### Sign-Off:
**When all MUST PASS tests succeed:**
- ✅ Linking System Stabilization 2.0 is VERIFIED
- ✅ Safe for production deployment
- ✅ HUD shows linked categories reliably

---

## 📝 Failure Response

If TEST 1 fails (critical):

1. Check console for error messages
2. Run debug commands above
3. Verify nodeId is consistent
4. Check if links still in nodeIdToLinks map
5. Report with:
   - Exact error message
   - Which test step failed
   - Console output
   - nodeIdToLinks map state

---

## 🚀 After Verification

When all tests pass:

1. Keep [Stab2] logs for 1-2 more sessions (production monitoring)
2. If stable, remove DEBUG logs in future update
3. Document as: "Linking System Stabilization 2.0 - VERIFIED"
4. Consider for similar fixes in other systems

---

**Test Protocol Ready — Start with TEST 1 🎯**
