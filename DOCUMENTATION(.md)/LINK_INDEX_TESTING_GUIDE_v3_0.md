# Stabilization Pack 3.0 — Testing Guide

**Purpose:** Verify that the persistent link index fixes HUD "LINKED: NONE" after deselect/reselect cycles

**Prerequisites:**
- ATOMA running with NodeLinkingSystem v8.2+ and LinkIndex v3.0
- Browser console open (F12 or Cmd+Option+I)
- At least 2 different node types available (e.g., input, storage, analytics)

---

## Quick Smoke Test (30 seconds)

**Goal:** Verify the fix works in the basic case

### Steps:
1. Spawn Node A (any type, e.g., INPUT)
2. Spawn Node B (different type, e.g., STORAGE)
3. Click Node A to select it
4. Click Node B to create link A → B
5. Verify HUD shows: `SELECTED: ... [INPUT] → LINKED: STORAGE`
6. Click empty space to deselect
7. Click Node A again to reselect
8. **Verify HUD STILL shows** `LINKED: STORAGE` (not "LINKED: NONE")

**Expected Console Output:**
```
[LinkIndex] ✓ Added link to index: <id> ↔ <id>
[SelectedHUD] [LinkIndex] Got 1 links via persistent index
[SelectedHUD] ✓ Extracted 1 unique categories: storage
```

**Result:**
- ✅ If HUD shows `LINKED: STORAGE` after reselect: **PASS**
- ❌ If HUD shows `LINKED: NONE` after reselect: **FAIL** (index not working)

---

## Test 1: Basic Link Persistence (2-3 minutes)

**Goal:** Verify links survive deselect/reselect cycle

### Preparation
- Spawn nodes: A (INPUT), B (STORAGE)
- Create link: A → B

### Execution
1. Select Node A
   - Check HUD: should show `[INPUT] → LINKED: STORAGE`
   - Check console: should see `[LinkIndex] Got 1 links via persistent index`

2. Deselect (click empty space)
   - HUD should show `SELECTED: NONE`

3. Reselect Node A
   - HUD should show `[INPUT] → LINKED: STORAGE` (same as before)
   - Check console: should see `[LinkIndex] Got 1 links via persistent index` again

4. Repeat deselect/reselect 5 times
   - Each reselect should show same categories

### Validation Checklist
- [ ] HUD shows correct category after first selection
- [ ] HUD shows same category after every reselection
- [ ] Console shows `[LinkIndex]` markers on every query
- [ ] No crashes or errors
- [ ] No stale data or flickering

### Expected Result
✅ HUD correctly remembers link through all cycles

---

## Test 2: Multi-Link Node (3-5 minutes)

**Goal:** Verify multiple links on one node stay consistent

### Preparation
- Spawn nodes: A (INPUT), B (STORAGE), C (ANALYTICS), D (PROCESS)
- Create links: A → B, A → C, A → D

### Execution
1. Select Node A
   - HUD should show: `[INPUT] → LINKED: ANALYTICS, PROCESS, STORAGE`
   - (Categories in alphabetical order)

2. Deselect, then reselect Node A
   - HUD should show: `[INPUT] → LINKED: ANALYTICS, PROCESS, STORAGE`

3. Rapid cycle (deselect → reselect → deselect → reselect)
   - 5 times rapidly
   - HUD should show same categories every time

4. Check console
   - Should see `[LinkIndex] Got 3 links via persistent index` every query
   - No fallback messages

### Validation Checklist
- [ ] All 3 linked categories appear in HUD
- [ ] Categories are in alphabetical order (ANALYTICS before PROCESS before STORAGE)
- [ ] Order is consistent through all reselections
- [ ] Console shows correct link count (3)
- [ ] No duplicate categories shown

### Expected Result
✅ Multi-link consistency maintained across cycles

---

## Test 3: Link Removal Updates HUD (3-5 minutes)

**Goal:** Verify HUD updates when links are removed

### Preparation
- Spawn nodes: A (INPUT), B (STORAGE), C (ANALYTICS)
- Create links: A → B, A → C

### Execution
1. Select Node A
   - HUD shows: `[INPUT] → LINKED: ANALYTICS, STORAGE`

2. Right-click on one link (e.g., A → B)
   - Context menu appears
   - Click "Delete Link"
   - Link removed with visual effect

3. HUD should immediately update
   - Now shows: `[INPUT] → LINKED: ANALYTICS`
   - (Only C remains)

4. Deselect and reselect Node A
   - HUD should still show: `[INPUT] → LINKED: ANALYTICS`
   - Not: `LINKED: STORAGE` (which was removed)

5. Check console
   - Should see `[LinkIndex] ✓ Removed link from index: <id> ↔ <id>`
   - After reselect, should see `[LinkIndex] Got 1 links via persistent index`

### Validation Checklist
- [ ] HUD immediately shows updated categories after removal
- [ ] Removed category disappears (no stale data)
- [ ] Remaining links persist through reselection
- [ ] Console shows removal and updated count
- [ ] No crashes

### Expected Result
✅ Link removal properly updates index and HUD

---

## Test 4: World Transition Cleanup (5-7 minutes)

**Goal:** Verify index is safely cleared during world transitions

### Preparation
- Spawn nodes and create multiple links (e.g., 3-4 links)
- Select a node (HUD shows categories)

### Execution
1. Create links in World 1
   - Verify HUD shows linked categories correctly

2. Trigger world transition/reset
   - Method depends on ATOMA setup (button, command, etc.)
   - Watch console for messages

3. Observe
   - No crashes during transition
   - Console should show cleanup (if logging available)
   - Index should be cleared (size goes to 0)

4. After transition, create new links in World 2
   - Should work normally
   - HUD should function correctly

5. Select nodes with links
   - HUD should show categories from new world links
   - Not from old world (which should be cleared)

### Validation Checklist
- [ ] No crashes during world transition
- [ ] No "undefined" errors in console
- [ ] Index size resets to 0 after cleanup
- [ ] New links work correctly after transition
- [ ] Old links don't leak into new world
- [ ] HUD shows correct categories for new world nodes

### Expected Result
✅ World transitions are clean and safe; index properly resets

---

## Test 5: Rapid Selection Stress Test (3-5 minutes)

**Goal:** Verify index handles rapid selection changes without errors

### Preparation
- Spawn nodes: A (INPUT), B (STORAGE), C (ANALYTICS)
- Create mixed links (e.g., A→B, A→C, B→A)

### Execution
1. Rapidly click between nodes
   - Select A → Select B → Select A → Select C → Select B
   - Continue for 10-15 rapid clicks

2. Watch HUD
   - Categories should update instantly
   - No flickering or delays
   - Correct categories shown for each node

3. Watch console
   - Should see continuous `[LinkIndex] Got N links` messages
   - No errors or exceptions
   - No "undefined" warnings

4. Check browser performance
   - No frame drops
   - No memory spikes
   - Console should be clean (no red errors)

### Validation Checklist
- [ ] HUD updates instantly without lag
- [ ] All selections show correct categories
- [ ] No console errors
- [ ] No crashes
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] Frame rate stable (60fps)

### Expected Result
✅ Rapid selection handled smoothly; index performant

---

## Test 6: Fallback Mechanism (Backward Compat) (2-3 minutes)

**Goal:** Verify fallback works if index fails (should rarely happen)

### Scenario A: Simulate Missing Index Method
1. Open browser console
2. Type: `game.linkingSystem.linksByNode.clear()` (manually clear index)
3. Reselect a node with links
4. Watch console

**Expected:**
```
[SelectedHUD] [LinkIndex] Got 0 links via persistent index  // Index is empty
[SelectedHUD] [Fallback] Got 1 links via reference lookup   // Fallback kicks in
[SelectedHUD] ✓ Extracted 1 unique categories: ...
```

HUD should still work even though index is empty—fallback provides safety net.

### Validation Checklist
- [ ] Fallback mechanism activates when index is empty
- [ ] HUD still shows correct categories
- [ ] Console shows both attempts (index then fallback)
- [ ] No crashes

### Expected Result
✅ Backward compatibility and safety maintained

---

## Test 7: Edge Cases (5-10 minutes)

### Edge Case 7a: Single Link (Minimal)
- Nodes: A (INPUT), B (STORAGE)
- Link: A → B only
- Reselect cycles: should show `LINKED: STORAGE` consistently

### Edge Case 7b: Self-Link (Should Be Prevented)
- Select Node A
- Try to click same node again
- Should be denied (self-link not allowed)
- HUD unchanged

### Edge Case 7c: Bidirectional Links
- Nodes: A (INPUT), B (STORAGE)
- Create: A → B and B → A
- Select A: should show `LINKED: STORAGE`
- Select B: should show `LINKED: INPUT`
- Reselect both: categories should persist

### Edge Case 7d: Node with Many Links
- Node A with 10+ connections to different categories
- Reselect multiple times
- HUD should show all categories
- Categories should remain in alphabetical order
- No performance degradation

### Validation Checklist
- [ ] Single link works consistently
- [ ] Self-links properly denied
- [ ] Bidirectional links show correctly for each node
- [ ] Many links handled smoothly
- [ ] Alphabetical ordering maintained
- [ ] No crashes on edge cases

### Expected Result
✅ Edge cases handled gracefully

---

## Console Analysis

### What to Look For (Good Signs)

```
✓ [LinkIndex] ✓ Added link to index: abc123 ↔ def456
✓ [SelectedHUD] [LinkIndex] Got 1 links via persistent index
✓ [SelectedHUD] ✓ Extracted 1 unique categories: storage
✓ [LinkIndex] ✓ Removed link from index: abc123 ↔ def456
```

### Red Flags (Issues to Report)

```
✗ [SelectedHUD] [LinkIndex] Got 0 links via persistent index
  [SelectedHUD] [Fallback] Got 1 links via reference lookup
  (Fallback shouldn't be needed in normal operation)

✗ [SelectedHUD] Error updating linked categories: ...
  (Exception thrown; check browser console for full error)

✗ Uncaught TypeError: Cannot read property 'slice' of undefined
  (Link array is not properly initialized)

✗ [LinkIndex] Skipping link with invalid node IDs
  (Multiple times - indicates nodes being destroyed without cleanup)
```

---

## Pass/Fail Criteria

### PASS ✅
- HUD shows correct linked categories after deselect/reselect
- Categories remain consistent through multiple cycles
- Console shows `[LinkIndex]` markers
- No crashes or errors
- No stale data
- Link removal updates HUD immediately

### FAIL ❌
- HUD shows "LINKED: NONE" after reselect when links exist
- Categories change between selections
- Console shows errors
- Crashes or freezes
- Fallback is needed for normal operations
- Stale or incorrect categories displayed

---

## Performance Benchmarks

After implementing Stabilization Pack 3.0, these metrics should be maintained:

| Metric | Target |
|--------|--------|
| Link lookup time | < 1ms |
| HUD update latency | < 10ms |
| Index memory per node | < 100 bytes |
| Frame rate during rapid selection | 60fps (no drops) |
| Crash rate | 0 |

---

## Reporting Results

When testing, note:
1. **Date/Time:** When you ran the tests
2. **ATOMA Version:** Should be v8.2+
3. **Tests Passed:** Which tests succeeded
4. **Tests Failed:** Which tests failed (if any)
5. **Console Output:** Paste relevant `[LinkIndex]` and `[SelectedHUD]` lines
6. **Crashes:** Any errors or exceptions encountered

---

## Troubleshooting Guide

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| HUD shows LINKED: NONE after reselect | Index not being used or cleared | Verify `getLinksForNode()` is called; check console for markers |
| No console `[LinkIndex]` markers | Method not being called | Verify HUD is using `getLinksForNode()` not old method |
| Fallback being used constantly | Index isn't working | Check if `linksByNode` is being populated in `_addLinkToIndex()` |
| Crashes when removing links | `_removeLinkFromIndex()` error | Check for null/undefined in removal logic |
| Categories not alphabetical | Sorting issue | Verify `Array.from(categories).sort()` in HUD |
| Stale categories after link removal | HUD not refreshing | Verify `refreshDisplay()` is called after link changes |

---

## Success Criteria Summary

✅ **Stabilization Pack 3.0 is working correctly when:**

1. Deselect/Reselect cycles show persistent linked categories (never "LINKED: NONE")
2. Console consistently shows `[LinkIndex]` markers (index is active)
3. Link removal immediately updates HUD (no stale data)
4. Rapid selection cycles are smooth (no lag or crashes)
5. World transitions are clean (index properly resets)
6. Fallback mechanism works if needed (backward compat maintained)
7. All edge cases handled gracefully (no crashes)

---

**Expected Overall Result: 🟢 ALL TESTS PASS — Persistent Link Index Working Correctly**

---

## Next Steps After Testing

If all tests pass:
1. Document any performance metrics observed
2. Note any platform-specific behaviors (mobile, desktop, etc.)
3. Run for 2-3 sessions to confirm stability
4. If clean, remove `console.debug()` statements (optional optimization)

If any tests fail:
1. Capture full console output
2. Note exact reproduction steps
3. Check if issue is environmental or code-related
4. Report to development team with details

---

**Duration:** 30-60 minutes for comprehensive testing  
**Difficulty:** Beginner (just clicking and watching HUD)  
**Tools Needed:** Browser console (F12)

**Good luck! 💜 You're helping ensure ATOMA's links are truly persistent.**
