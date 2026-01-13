# Patch 3.2 HYBRID — Test Scenarios & Verification

**Purpose:** Comprehensive testing plan to verify hybrid system functionality  
**Scope:** Cache, sync, validation, performance, compatibility  

---

## Test Overview

**Total Tests:** 12 scenarios  
**Quick Tests (1-3 min each):** Tests 1-6  
**Extended Tests (5+ min each):** Tests 7-12  
**Total Time:** ~45 minutes for full suite  

---

## Quick Tests (1-3 minutes each)

### Test 1: Instant Cache Read (✓ Cache Tier)

**Objective:** Verify cache provides instant reads without 1-frame delay

**Setup:**
- Open game, create 2+ nodes
- Create link between them
- Open browser console (F12)

**Steps:**
1. Select node with link
2. Check HUD immediately
3. Deselect (click empty space)
4. Reselect node
5. Watch console

**Expected Results:**
```
Console shows:
[Hybrid Cache] Got 1 categories instantly (no delay)
    ↓ MULTIPLE TIMES on each selection

HUD shows:
[NODE] [TYPE] → LINKED: CATEGORY (instant, no flicker)
```

**✅ PASS if:**
- Console shows "instantly" message
- HUD updates immediately without lag
- No 1-frame flicker observed

**Console markers:**
```
✓ [Hybrid Cache] Got N categories instantly
✓ [SelectedHUD] ✓ Extracted N categories
```

---

### Test 2: Cache Invalidation on Link Create (✓ Sync)

**Objective:** Verify cache clears when link created

**Setup:**
- Create node A (no links initially)
- Select node A, confirm LINKED: NONE

**Steps:**
1. Create node B (different type)
2. Create link A → B
3. Watch console during and after
4. Deselect/reselect A
5. Check HUD

**Expected Results:**
```
Console shows:
[Hybrid Cache] Got 0 categories instantly (no links yet)
[Hybrid Cache] Got 1 categories instantly (after link created)

HUD shows:
LINKED: NONE → (link created) → LINKED: STORAGE
```

**✅ PASS if:**
- Cache invalidated on link creation
- HUD updates immediately
- New link reflected in cache

---

### Test 3: Cache Invalidation on Link Remove (✓ Sync)

**Objective:** Verify cache clears when link removed

**Setup:**
- Create link A → B
- Select A, confirm LINKED: STORAGE

**Steps:**
1. Right-click link, delete
2. Watch console
3. Check HUD immediately
4. Deselect/reselect A
5. Confirm no stale data

**Expected Results:**
```
Console shows:
[Hybrid Cache] Got 1 categories... (link existed)
[Hybrid Cache] Got 0 categories... (link removed)

HUD shows:
LINKED: STORAGE → (link deleted) → LINKED: NONE
```

**✅ PASS if:**
- Cache cleared on link removal
- HUD updates immediately
- No stale categories shown

---

### Test 4: Periodic Sync Detection (✓ Auto-Healing)

**Objective:** Verify periodic sync runs and reports findings

**Setup:**
- Create 3+ links
- Leave game running, watch console

**Steps:**
1. Observe console every 500ms
2. Look for sync messages
3. Check if healing messages appear
4. Verify no crashes

**Expected Results:**
```
Console shows (every ~500ms):
[Hybrid] Sync detected and healed 0/0 issues
  OR
[Hybrid] Auto-healed N dead links

These appear regularly in background
```

**✅ PASS if:**
- Sync messages appear (not necessarily healing needed)
- No errors or crashes
- System continues normally

**Note:** Healing messages may not appear if all links are valid.

---

### Test 5: Backward Compatibility - Old API (✓ Compat)

**Objective:** Verify old getNodeLinks() still works

**Setup:**
- Create link A → B

**Steps:**
1. Open console (F12)
2. Get link system: `const ls = game.linkingSystem;`
3. Select a node: `const n = ls.selectedNode;`
4. Call old method: `const links = ls.getNodeLinks(n);`
5. Check results: `console.log(links);`

**Expected Results:**
```
Console shows:
Array(1) [Link Object]  ← Should return links

Can also call:
ls.getLinksForNode(n);  ← Should work too
```

**✅ PASS if:**
- Old methods still return data
- No errors thrown
- Results consistent with new methods

---

### Test 6: HUD Accuracy After World Transition (✓ Disposal)

**Objective:** Verify cache properly cleared on world transition

**Setup:**
- Create links in World 1
- HUD shows correct categories

**Steps:**
1. Press M to transition
2. Wait for new world to load
3. Create new link in World 2
4. Select node, check HUD
5. Deselect/reselect

**Expected Results:**
```
World 1: HUD shows categories from World 1
  ↓ (Transition)
World 2: HUD shows NONE initially
  ↓ (Create link)
World 2: HUD shows new categories

No stale data from World 1
```

**✅ PASS if:**
- Cache cleared on transition
- No World 1 data leaks into World 2
- New world links work correctly

---

## Extended Tests (5+ minutes each)

### Test 7: Cache Validity Window (✓ Timing)

**Objective:** Verify cache expires and rebuilds correctly

**Setup:**
- Create link A → B
- Select A (cache should populate)

**Steps:**
1. Select node A (t=0)
2. Wait 50ms
3. Check console: should still show "instantly"
4. Wait another 50ms (total ~100ms, past 83ms window)
5. Select different node B, then back to A
6. Check console: should rebuild cache

**Expected Results:**
```
First selection (t=0):
[Hybrid Cache] Got... instantly

After 100ms+ (cache expired):
[Hybrid Cache] Got... instantly (rebuilt)
```

**✅ PASS if:**
- Cache serves for ~83ms window
- Rebuilds after expiration
- Always returns correct data

---

### Test 8: Rapid Link Create/Remove (✓ Consistency)

**Objective:** Verify consistency under rapid changes

**Setup:**
- Create nodes A, B, C

**Steps:**
1. Rapidly create/remove links A↔B, A↔C
2. Every 3-5 seconds, check HUD for A
3. Monitor console for corruption
4. Continue for 30-60 seconds

**Expected Results:**
```
Console shows:
[Hybrid Cache] Got X categories instantly  (updates as links change)
No errors or corruption messages
HUD always shows correct current state
```

**✅ PASS if:**
- Cache keeps up with rapid changes
- No stale data shown
- No crashes or warnings

---

### Test 9: Heavy Load Test (✓ Performance)

**Objective:** Verify performance with many links

**Setup:**
- Create 5+ nodes
- Create 10+ links between them

**Steps:**
1. Rapidly select all nodes (10+ times)
2. Create/remove additional links while selecting
3. Monitor HUD for accuracy
4. Check console for performance

**Expected Results:**
```
HUD selections: responsive, no lag
Console: cache working, minimal warnings
No significant slowdown
```

**✅ PASS if:**
- Fast responsiveness throughout
- No frame rate drops
- All HUD reads accurate

---

### Test 10: World Transition Stress (✓ Dispose Safety)

**Objective:** Verify cache cleared safely under stress

**Setup:**
- Create many links in World 1

**Steps:**
1. Press M repeatedly (5-10 times rapidly)
2. Allow transitions to complete
3. Check console for disposal messages
4. Create links in World 2
5. Verify everything works

**Expected Results:**
```
Console shows:
[NodeLinkingSystem] dispose() completed safely ✓  (multiple)
[Hybrid Cache] Got... (new world)

No crashes during transitions
New world clean, no old data
```

**✅ PASS if:**
- Transitions complete safely
- Cache disposed properly
- New world links work correctly

---

### Test 11: Sync Recovery from Corruption (✓ Auto-Healing)

**Objective:** Verify sync heals corrupted state (optional advanced test)

**Setup:**
- Create several links
- (Advanced) Manually corrupt state if possible

**Steps:**
1. If corrupted: observe sync messages
2. Watch for "[Hybrid] Auto-healed X" messages
3. Verify links still work after healing
4. Check HUD accuracy

**Expected Results:**
```
If corruption detected:
[Hybrid] Auto-healed N dead links
[Hybrid] Auto-healed M orphaned entries

Links continue to work
No permanent damage
```

**✅ PASS if:**
- Corruption detected by sync
- Auto-healing works
- System recovers gracefully

**Note:** This test requires intentional corruption, optional advanced test.

---

### Test 12: Integration Test (✓ Full System)

**Objective:** Verify all components work together

**Setup:**
- Fresh game session

**Steps:**
1. Create multiple nodes (5+)
2. Create multiple links (10+)
3. Rapidly select nodes
4. Create/remove links while selecting
5. Transition worlds (press M)
6. Create new links in new world
7. Repeat steps 3-6 in new world
8. Monitor console throughout
9. Total time: ~10 minutes

**Expected Results:**
```
No crashes at any point
HUD always accurate
Console shows normal operation:
  - Cache hits
  - Periodic sync (no corruption)
  - Smooth transitions
All previous tests pass
```

**✅ PASS if:**
- Complete 10-minute test without issues
- All console markers correct
- HUD never shows incorrect data

---

## Pass/Fail Criteria

### Individual Test Results

**Each test: PASS if all checks under "✅ PASS if:" section met**

| Test | Pass Condition |
|------|----------------|
| 1 | Cache provides instant reads |
| 2 | Cache invalidated on create |
| 3 | Cache invalidated on remove |
| 4 | Sync messages appear regularly |
| 5 | Old APIs work unchanged |
| 6 | Cache cleared on transition |
| 7 | Cache expires at 83ms |
| 8 | Rapid changes handled correctly |
| 9 | Performance maintained under load |
| 10 | World transitions safe |
| 11 | Corruption auto-healed (opt) |
| 12 | Full system integration works |

### Overall Test Suite Result

**PASS if:**
- ✅ All Quick Tests (1-6) pass
- ✅ At least 8 of 12 total tests pass
- ✅ No red console errors
- ✅ No crashes
- ✅ HUD always accurate

**FAIL if:**
- ❌ Any critical test fails (1, 5, 6)
- ❌ Crashes occur
- ❌ Red errors in console
- ❌ Stale data shown in HUD

---

## Console Markers Reference

### Success Indicators (Expected)

```
✓ [Hybrid Cache] Got N categories instantly (no delay)
✓ [Hybrid] Sync detected and healed 0/0 issues
✓ [Hybrid] Auto-healed N dead links
✓ [SelectedHUD] ✓ Extracted N categories
```

### Warning Indicators (Usually OK)

```
⚠️ [Hybrid] Sync detected and healed N/M issues  (means fixing worked)
⚠️ [Hybrid] Auto-healed N dead links            (means detected and fixed)
⚠️ [Hybrid] Auto-healed N orphaned entries      (means fixed)
```

### Error Indicators (Should Not Appear)

```
❌ TypeError: Cannot read properties
❌ ReferenceError: undefined
❌ Uncaught exception
❌ dispose() crashed
```

---

## Debugging Tips

### If Test Fails

1. **Check console for errors**
   ```
   Red text = real error
   Yellow text = warnings (often fine)
   Gray text = debug info
   ```

2. **Check timing**
   ```
   Cache window is 83ms (5 frames @ 60fps)
   Sync runs every 500ms
   Might see delays if system slow
   ```

3. **Try individual operations**
   ```
   // Check if method exists
   console.log(typeof linkingSystem.getLinkedCategories);  // → 'function'
   
   // Get sync state
   console.log(linkingSystem._syncState);
   
   // Run manual sync
   const report = linkingSystem._syncIndexWithRuntime();
   console.log(report);
   ```

### Performance Analysis

```
Frame time: Monitor with DevTools Performance tab
HUD update: Should be <2ms (cache hit) or <5ms (miss)
Sync check: Every 500ms, ~5-10ms duration
Memory: Should not grow unbounded
```

---

## Test Success Summary

**When all tests pass, you can confirm:**

✅ Hybrid cache working (instant HUD reads)  
✅ Invalidation working (no stale data)  
✅ Auto-sync working (periodic consistency check)  
✅ Auto-healing working (corruption detected and fixed)  
✅ Backward compatibility working (old APIs still work)  
✅ Performance improved (cache provides speedup)  
✅ Safety preserved (no crashes, proper cleanup)  

---

## Next Steps After Testing

**If all tests pass:**
1. ✅ Mark Patch 3.2 HYBRID as verified
2. ✅ Deploy to production
3. ✅ Monitor console for 24 hours
4. ✅ Check performance metrics
5. ✅ Complete!

**If any test fails:**
1. ❌ Check console output carefully
2. ❌ Review diagnostic report
3. ❌ Try to reproduce issue
4. ❌ Report with full console log
5. ❌ Do NOT deploy until fixed

---

## Test Report Template

When reporting results, include:

```
Test Suite: Patch 3.2 HYBRID
Date: [date]
Environment: [browser, OS]
Game Version: [version]

Quick Tests (1-6):
  Test 1 (Cache Read): PASS / FAIL
  Test 2 (Create Invalidation): PASS / FAIL
  Test 3 (Remove Invalidation): PASS / FAIL
  Test 4 (Periodic Sync): PASS / FAIL
  Test 5 (Backward Compat): PASS / FAIL
  Test 6 (World Transition): PASS / FAIL

Extended Tests (7-12):
  Test 7 (Cache Validity): PASS / FAIL
  Test 8 (Rapid Changes): PASS / FAIL
  Test 9 (Heavy Load): PASS / FAIL
  Test 10 (Transition Stress): PASS / FAIL
  Test 11 (Corruption Recovery): PASS / FAIL / SKIPPED
  Test 12 (Integration): PASS / FAIL

Overall Result: PASS / FAIL

Notes:
[Any observations, errors, or issues]
```

---

**Status: 🟢 TEST SCENARIOS READY**

*Run these tests to verify Patch 3.2 HYBRID is working correctly.* 💜
