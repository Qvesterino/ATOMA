# ATOMA SAFE CLEANUP 2.0 — VERIFICATION & BEHAVIOR TESTS

**Objective:** Verify that SAFE CLEANUP 2.0 has successfully disabled legacy systems while maintaining all core functionality.

**Status:** READY FOR BEHAVIOR TESTING

---

## TEST EXECUTION FRAMEWORK

### Test Environment

- **Game Mode:** Any dream world (Fractal Valley recommended for testing)
- **Node Count:** 15+ nodes active
- **Run Duration:** 2–3 minutes per test
- **Key Tools:** Console (F12) for diagnostics

### Test Log Format

For each test, record:
- **Test Name:** [TEST_NAME]
- **Duration:** [seconds]
- **Expected Result:** [what should happen]
- **Actual Result:** [what did happen]
- **Status:** [OK] or [ISSUE]
- **Notes:** [any observations]

---

## BEHAVIOR TEST SUITE

### TEST 1: Selection (LMB Single Click)

**Objective:** Verify that LMB click selects a node and shows all 4 UI feedback layers.

**Setup:**
1. Enter any dream world
2. Wait for 3+ nodes to be visible
3. Open browser console (F12) — watch for no legacy warnings

**Test Steps:**
1. Position camera to look at a node (centered on screen)
2. LMB click on the node
3. Observe visual feedback

**Expected Result:**
- ✅ Node gets visible neon highlight (UISelectedNodeHighlight3_2)
- ✅ Small badge appears under crosshair with code (UISelectedNodeBadge3_2)
- ✅ Floating [SELECTED] label appears above node (UISelectedNodeLabel3_3)
- ✅ Top HUD bar shows "SELECTED: [CODE]" (UISelectedNodeTopBar3_4)
- ✅ Console shows NO warnings about legacy systems

**Test Execution:**
- [ ] Highlight visible
- [ ] Badge visible under crosshair
- [ ] Floating label visible above node
- [ ] Top HUD bar shows selected info
- [ ] Console clean (no legacy warnings)

**Status:** _______
**Notes:** _____________________________________________________________________

---

### TEST 2: Deselection (LMB on Empty Space)

**Objective:** Verify that LMB click on empty space clears selection and hides all UI feedback.

**Setup:**
1. From TEST 1, node should still be selected
2. Identify empty space on screen (no nodes)

**Test Steps:**
1. LMB click on empty space (sky, ground, no nodes)
2. Observe all UI feedback disappears

**Expected Result:**
- ✅ Node highlight disappears
- ✅ Badge disappears
- ✅ Floating label disappears
- ✅ Top HUD bar shows "SELECTED: NONE"
- ✅ Console shows NO warnings

**Test Execution:**
- [ ] All UI feedback cleared
- [ ] TopBar shows "SELECTED: NONE"
- [ ] Console clean

**Status:** _______
**Notes:** _____________________________________________________________________

---

### TEST 3: Linking (LMB with First Node Selected)

**Objective:** Verify that selecting node A, then clicking node B creates a link A→B.

**Setup:**
1. Clear all existing links (or start fresh world)
2. Ensure 3+ nodes visible

**Test Steps:**
1. LMB click on node A (first node selected)
   - Verify A shows all feedback (highlight, badge, label, topbar)
2. LMB click on node B (second, different node)
   - Expected: Link created from A → B, B becomes selected
3. Observe visual changes

**Expected Result:**
- ✅ Node A shows feedback while being selected
- ✅ Node B gets selected after LMB
- ✅ A new glowing link appears between A and B
- ✅ Node B now shows all 4 UI feedback layers
- ✅ Node A's feedback is gone (only B selected now)
- ✅ Console shows NO warnings

**Test Execution:**
- [ ] A gets selected correctly
- [ ] B becomes selected after LMB
- [ ] Link appears between A and B
- [ ] All feedback transfers to B
- [ ] Console clean

**Status:** _______
**Notes:** _____________________________________________________________________

---

### TEST 4: RMB Unlink (Remove All Links)

**Objective:** Verify that RMB on a selected node with links removes all links.

**Setup:**
1. From TEST 3, node B should be selected with at least one link
2. Verify the link A→B is visible

**Test Steps:**
1. LMB on node B to select it (if not already selected)
   - Verify it shows all feedback
2. RMB click on node B
   - Expected: All links connected to B are removed

**Expected Result:**
- ✅ Node B stays selected (highlight, badge, label, topbar still visible)
- ✅ All links connected to B (incoming and outgoing) disappear from screen
- ✅ The link visually fades/removes
- ✅ Node B remains selected (no feedback change)
- ✅ Console shows NO warnings

**Alternative: RMB on Node with No Links**

**Setup:**
1. Select a node that has NO links connected

**Test Steps:**
1. RMB click on that node
   - Expected: Node briefly highlights (feedback blink only)

**Expected Result:**
- ✅ Node shows brief visual blink (optional highlight pulse)
- ✅ No links removed (there are none)
- ✅ Node stays selected
- ✅ Console shows NO warnings

**Test Execution:**
- [ ] Links removed with RMB on linked node
- [ ] Node stays selected after RMB
- [ ] Optional blink on unlinked node
- [ ] Console clean

**Status:** _______
**Notes:** _____________________________________________________________________

---

### TEST 5: Double-Click Primary Node (New Feature 3.7)

**Objective:** Verify that double-clicking a node sets it as PRIMARY with aura + HUD.

**Setup:**
1. Clear all selections and state
2. Identify a clear node to double-click

**Test Steps:**
1. Position camera on a node
2. **Double-click LMB on that node within 250ms**
   - Expected: Node becomes PRIMARY (not just selected)
3. Observe new visual feedback:
   - Rotating neon aura ring around node
   - New "PRIMARY: [CODE]" HUD bar (magenta color)
4. Now LMB click on a DIFFERENT node B
   - Expected: Link created from PRIMARY → B, then B becomes selected

**Expected Result:**
- ✅ Double-click creates rotating aura around node (UIPrimaryNodeAura3_7)
- ✅ Magenta "PRIMARY: [CODE]" bar appears (UIPrimaryNodeTopBar3_7)
- ✅ Node A stays as primary even after LMB on node B
- ✅ Link created from A → B
- ✅ Node B becomes selected (gets 4-layer feedback)
- ✅ Node A keeps primary aura + topbar visible
- ✅ Console shows NO warnings

**Alternative: Double-Click Same Primary Again**

**Setup:**
1. From previous step, node A is PRIMARY
2. Double-click the same node A again

**Expected Result:**
- ✅ Primary toggles OFF (aura and primary topbar disappear)
- ✅ OR: Primary state refreshes (aura continues, works normally)
- ✅ No crash or error
- ✅ Console shows NO warnings

**Test Execution:**
- [ ] Aura appears on double-click
- [ ] Primary HUD bar appears
- [ ] Link created from primary to clicked node
- [ ] Selected node shows all feedback
- [ ] Primary aura persists
- [ ] Double-click same node toggles or refreshes
- [ ] Console clean

**Status:** _______
**Notes:** _____________________________________________________________________

---

### TEST 6: No Legacy Interference (Critical)

**Objective:** Verify that NO legacy auto-detect or hover tooltips activate.

**Setup:**
1. Enable browser console (F12)
2. Search console for any of these messages:
   - "⊘ Node Auto-Detection 3.1 DISABLED"
   - "⊘ Node Hover Tooltip 3.1 DISABLED"
   - "⊘ Node Linking 2.0/2.1 DISABLED"
   - Any mention of "UINodeAutoDetect" or "UINodeHoverTooltip"

**Test Steps:**
1. Run the game for 30 seconds normally
2. Walk around nodes without clicking
3. Look at nodes from various distances (2m, 5m, 10m+)
4. Check console for legacy messages

**Expected Result:**
- ✅ NO auto-detect cone appears when looking at nodes
- ✅ NO hover tooltip pops up on crosshair
- ✅ NO mysterious panels or UI elements appear without clicking
- ✅ Console shows NO legacy system warnings
- ✅ Only NodeLinking2_3 update messages (if any)

**Test Execution:**
- [ ] No auto-detect cone visible
- [ ] No hover tooltips
- [ ] No unexpected UI elements
- [ ] Console clean of legacy messages

**Status:** _______
**Notes:** _____________________________________________________________________

---

### TEST 7: Context Menu (E Key)

**Objective:** Verify that E key opens context menu for selected node.

**Setup:**
1. Select a node (LMB click)
2. Verify node shows all feedback

**Test Steps:**
1. Press E key
2. Observe context menu appears (if implemented)

**Expected Result:**
- ✅ Context menu appears near selected node
- ✅ Menu shows node options or closes cleanly
- ✅ ESC closes the menu
- ✅ No errors in console

**Test Execution:**
- [ ] Context menu responds to E key
- [ ] Menu can be closed
- [ ] Console clean

**Status:** _______
**Notes:** _____________________________________________________________________

---

### TEST 8: ESC Key (Close UI & Deselect)

**Objective:** Verify that ESC closes all UI and deselects node.

**Setup:**
1. Select a node (LMB click)
2. Optionally open context menu (E key)

**Test Steps:**
1. Press ESC key
2. Observe all UI closes and node is deselected

**Expected Result:**
- ✅ Context menu closes (if open)
- ✅ Inspect panel closes
- ✅ All 4-layer feedback disappears (highlight, badge, label, topbar)
- ✅ Primary aura/topbar PERSIST (primary survives ESC)
- ✅ Console shows NO warnings

**Test Execution:**
- [ ] UI closes with ESC
- [ ] Selection cleared
- [ ] Primary state persists
- [ ] Console clean

**Status:** _______
**Notes:** _____________________________________________________________________

---

## CONSOLE DIAGNOSTIC CHECKLIST

During all tests, monitor the browser console (F12) for:

### Expected Messages (OK):
- ✅ `✓ Selection Core 3.4 initialized`
- ✅ `✓ Selected Node Top Bar 3.4 initialized`
- ✅ `✓ Primary Node System 3.7 initialized`
- ✅ `✓ Category Legend 3.1 initialized`
- ✅ `✓ Emotional Feed 3.1 initialized`
- ✅ Any WebGL or render messages

### Unexpected Messages (ALERT):
- ❌ `UINodeAutoDetect3_1` (or any mention of)
- ❌ `UINodeHoverTooltip3_1` (or any mention of)
- ❌ `NodeLinking2_0`, `NodeLinking2_1`, `NodeLinking2_2`
- ❌ `setupNodeAutoDetect()` called
- ❌ `setupHoverTooltip()` called
- ❌ Any unhandled exception about selection/linking

### Performance Check:
- ⚡ Frame rate stays 60+ FPS
- ⚡ No frame drops during selection/linking
- ⚡ No memory leaks (memory stable over 5+ minutes)

---

## FINAL VERIFICATION SUMMARY

Complete this checklist after all tests:

### Functionality Tests:
- [ ] TEST 1: Selection works
- [ ] TEST 2: Deselection works
- [ ] TEST 3: Linking works
- [ ] TEST 4: RMB unlink works
- [ ] TEST 5: Double-click primary works
- [ ] TEST 6: No legacy interference
- [ ] TEST 7: E key context menu works
- [ ] TEST 8: ESC key deselects + closes UI

### Console Health:
- [ ] No legacy system warnings
- [ ] No unhandled errors
- [ ] Performance stable (60+ FPS)

### Overall Status:
- [ ] ALL TESTS PASS → ✅ CLEANUP SUCCESSFUL
- [ ] 1–2 Tests FAIL → ⚠️  MINOR ISSUES (document in report)
- [ ] 3+ Tests FAIL → ❌ CRITICAL ISSUES (stop and investigate)

---

## TROUBLESHOOTING

If a test fails:

1. **Check console for errors** — Look for specific error messages
2. **Restart the game** — Reload page, try test again
3. **Check network** — Verify assets loaded correctly
4. **Document findings** — Record what didn't work
5. **Do NOT modify code** — Document issue only

Common issues:
- "Node not clickable" → Raycaster issue, verify 3D position
- "UI doesn't appear" → DOM issue, check HTML elements exist
- "Links not visible" → LinkingSystem issue, check link data
- "Legacy messages appear" → Legacy setup still being called, check main.js

---

## TEST REPORT TEMPLATE

```
═══════════════════════════════════════════════════════════
ATOMA SAFE CLEANUP 2.0 — BEHAVIOR TEST REPORT
═══════════════════════════════════════════════════════════

TEST DATE: [DATE]
TEST DURATION: [TIME]
TESTER: [NAME]
ENVIRONMENT: [BROWSER/DEVICE]

───────────────────────────────────────────────────────────
OVERALL RESULTS
───────────────────────────────────────────────────────────

✓ Selection:               [OK/ISSUE]
✓ Deselection:            [OK/ISSUE]
✓ Linking:                [OK/ISSUE]
✓ RMB Unlink:             [OK/ISSUE]
✓ Double-Click Primary:   [OK/ISSUE]
✓ Legacy Interference:    [OK/ISSUE]
✓ Context Menu:           [OK/ISSUE]
✓ ESC Key:                [OK/ISSUE]

───────────────────────────────────────────────────────────
CONSOLE HEALTH
───────────────────────────────────────────────────────────

Legacy Warnings:          [0/FOUND]
Unhandled Errors:         [0/FOUND]
Performance (FPS):        [60+/DEGRADED]

───────────────────────────────────────────────────────────
OVERALL VERDICT
───────────────────────────────────────────────────────────

Status: [✅ PASS / ⚠️  MINOR / ❌ FAIL]

Key Findings:
- [Finding 1]
- [Finding 2]
- [Finding 3]

Recommended Actions:
- [Action 1]
- [Action 2]

═══════════════════════════════════════════════════════════
```

---

**Prepared by:** Rosie (Senior AI Engineer)  
**Date:** ATOMA SAFE CLEANUP 2.0 Session  
**Status:** READY FOR PHASE 3 EXECUTION
