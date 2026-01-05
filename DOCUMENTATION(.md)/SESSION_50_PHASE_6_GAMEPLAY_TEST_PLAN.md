# SESSION 50: PHASE 6 GAMEPLAY TESTING - COMPREHENSIVE TEST PLAN

**Status**: Ready for execution  
**Objective**: Verify all visibility & selection bugs are resolved  
**Expected Duration**: 30-45 minutes  
**Success Criteria**: ALL 8 tests PASS

---

## TEST OVERVIEW

This test plan validates that sessions 47-50 have completely resolved:
- Node disappearance issues
- Node occlusion issues
- Inconsistent selection behavior
- Raycast crashes ("r.raycast is not a function")

---

## PREREQUISITE CHECKLIST

Before starting tests:
- [ ] Game fully loaded in browser
- [ ] Scene has 10+ nodes (mix of node types)
- [ ] Browser console open (F12)
- [ ] No network errors visible
- [ ] Camera controlled (WASD + mouse)

---

## TEST 1: BASIC NODE SELECTION

**Objective**: Verify clicking a node selects its core (not overlay)

**Steps**:
1. Locate a cyan input node on screen
2. Position camera so node is clearly visible
3. Click directly on the node's center
4. Observe inspector panel on left side

**Expected Results**:
- [ ] Node is selected (UI shows selection)
- [ ] Inspector panel appears with node stats
- [ ] Core remains fully visible (not hidden)
- [ ] No console errors

**Pass/Fail**: _______________

**Notes**:
```
If core disappears after selection:
  → Session 50 fix incomplete, investigate CoreVisualAuthoritySystem

If wrong node selected:
  → Raycast filtering issue, check CanonicalInteractionFilter

If no inspector:
  → Selection event not firing, check NodeLinkingSystem
```

---

## TEST 2: AURA/SHELL RAYCAST FILTERING

**Objective**: Verify clicking aura/shell selects core (not overlay)

**Steps**:
1. Locate a node with visible aura (brightness/glow)
2. Identify the semi-transparent shell around core
3. Click on the aura/shell area (NOT the bright core)
4. Observe which node is selected

**Expected Results**:
- [ ] Core node is selected (not the overlay)
- [ ] Inspector shows selected node's stats
- [ ] Shell remains visible (not hidden)
- [ ] No console errors
- [ ] Selection deterministic (same click → same result)

**Pass/Fail**: _______________

**Notes**:
```
If shell/aura is selected instead of core:
  → CanonicalInteractionFilter not working
  → Check userData.isHologramShell = true in CoreHologramShader
  → Check userData.isAura = true in NodeAuraSystem_v1

If core disappears when aura clicked:
  → Check GlobalAuraOpacityClamp (should be ≤0.06)
  → Check raycast filtering (should exclude aura)
```

---

## TEST 3: EMPTY SPACE CLICK DESELECTION

**Objective**: Verify clicking empty space deselects current node

**Steps**:
1. Select a node (from Test 1)
2. Observe inspector panel shows selection
3. Click on empty space (no node there)
4. Observe inspector panel

**Expected Results**:
- [ ] Inspector panel closes/clears
- [ ] Node is deselected
- [ ] Node remains visible (core still visible)
- [ ] No console errors
- [ ] Deselection is immediate

**Pass/Fail**: _______________

**Notes**:
```
If node remains selected:
  → DeselectGuaranteePatch may not be working
  → Check NodeLinkingSystem.js deselection callback

If core disappears on deselect:
  → Core material not restored properly
  → Check CoreMaterialAuthority.js

If selection persists for >1 second:
  → Deselection timing issue
  → Check Selection event propagation
```

---

## TEST 4: LINK CREATION PRESERVES VISIBILITY

**Objective**: Verify creating links doesn't hide node cores

**Steps**:
1. Select first node (e.g., cyan input)
2. Observe core is clearly visible
3. Right-click to open link menu
4. Select "Create Link" → pick target node
5. Observe both nodes remain visible

**Expected Results**:
- [ ] Both nodes remain fully visible
- [ ] Neither core is occluded by aura
- [ ] Link line appears between nodes
- [ ] No console errors
- [ ] Node cores are still selectable

**Pass/Fail**: _______________

**Notes**:
```
If either node disappears after linking:
  → Check EnhancedNodeModelLinkState
  → Verify GlobalAuraOpacityClamp is enforced

If node core is occluded by aura:
  → Aura opacity too high
  → Should be ≤0.06 (check GlobalAuraOpacityClamp)

If link line hides core:
  → Check LINK_VISUAL renderOrder
  → Should be < NODE_CORE renderOrder
```

---

## TEST 5: CROSSHAIR TARGETING STABILITY

**Objective**: Verify crosshair (if enabled) targets cores consistently

**Steps**:
1. Enable crosshair (if available in UI)
2. Look at different nodes (cyan, green, violet, etc.)
3. Point crosshair at each node's center
4. Observe what the crosshair targets
5. Move crosshair to edge of node (onto aura)

**Expected Results**:
- [ ] Crosshair targets node cores
- [ ] Targeting is stable (no flickering)
- [ ] Aura doesn't interfere with crosshair
- [ ] All node types work (enhanced, legacy, quantum)
- [ ] No console errors

**Pass/Fail**: _______________

**Notes**:
```
If crosshair targets aura instead of core:
  → Check crosshair raycast implementation
  → Should use CanonicalInteractionFilter

If targeting is unstable/flickering:
  → Check distance modulation in NodeAuraSystem_v1
  → May need aura distance tuning

If some node types don't work:
  → Verify all node creators use createCoreIdentityMaterial
  → Check AINodeModel.js for legacy nodes
```

---

## TEST 6: CONSOLE ERROR CHECK

**Objective**: Verify no crashes or raycast errors

**Steps**:
1. Open browser console (F12)
2. Filter for "ERROR" level messages
3. Play normally: select nodes, create links, click around
4. Watch for any errors appearing

**Expected Errors**: None

**Unacceptable Errors**:
- [ ] "r.raycast is not a function"
- [ ] "Cannot read property 'raycast' of undefined"
- [ ] Any "TypeError" from intersection code
- [ ] "NodeAura opacity override"

**Pass/Fail**: _______________

**Notes**:
```
If "r.raycast is not a function" appears:
  → CRITICAL: CanonicalInteractionFilter NOT working
  → Session 48 filter injection failed
  → Check all 13 raycaster callsites

If material errors appear:
  → Check CoreMaterialAuthority
  → Verify material properties locked

If other errors:
  → Document error + callstack
  → May indicate other system issues
```

---

## TEST 7: MULTI-NODE SELECTION DETERMINISM

**Objective**: Verify multi-node operations are deterministic

**Steps**:
1. Select Node A (record result)
2. Deselect Node A
3. Select Node A again (should be identical)
4. Select Node B (record result)
5. Create link A→B
6. Restart scene
7. Repeat steps 1-5 (should produce identical results)

**Expected Results**:
- [ ] Same selections produce same visual results
- [ ] Order doesn't matter
- [ ] After restart, behavior repeats
- [ ] No random variations
- [ ] No timing-dependent behavior

**Pass/Fail**: _______________

**Notes**:
```
If selections vary:
  → Non-determinism detected
  → May indicate DeselectGuaranteePatch issue
  → Check state clearing order (should be BEFORE callbacks)

If behavior changes after restart:
  → Persistent state issue
  → Check node registration
  → Verify AINodes.js validates userData on spawn

If visual result differs but selection same:
  → May be normal (aura intensity varies by signal)
  → Check consistency within reasonable bounds
```

---

## TEST 8: RESTART AND REPEAT

**Objective**: Verify behavior is reproducible across sessions

**Steps**:
1. Perform all previous tests (1-7)
2. Document all results
3. Refresh browser (F5)
4. Wait for scene to fully load
5. Repeat all tests (1-7) again

**Expected Results**:
- [ ] All results identical to first run
- [ ] No new failures introduced
- [ ] Same nodes available
- [ ] Same selection behavior
- [ ] Same visual appearance
- [ ] No accumulation of issues

**Pass/Fail**: _______________

**Notes**:
```
If results differ after restart:
  → State not properly reset
  → Check SafeWorldResetFix1_0
  → Verify node spawn validation (AINodes.js)

If performance degrades:
  → Memory leak possible
  → Check aura disposal
  → Verify effect cleanup

If scene doesn't fully load:
  → May indicate import issue
  → Check main.js import list
  → Verify no missing files
```

---

## EDGE CASES (OPTIONAL EXTRA TESTS)

### Edge Case A: Rapid Select/Deselect Cycling
**Steps**: Click same node 10 times rapidly, then different node, repeat

**Expected**: No crashes, deterministic behavior

### Edge Case B: Multiple Overlapping Auras
**Steps**: Link several nodes in star pattern (one hub, many spokes)

**Expected**: All cores visible, none occluded

### Edge Case C: Close-Up Camera View
**Steps**: Move camera very close to node (inside visual bounds)

**Expected**: Core still visible and selectable

### Edge Case D: Mixed Node Types
**Steps**: Select/link combination of enhanced, legacy, and quantum nodes

**Expected**: All behave identically, no type discrimination

### Edge Case E: Rapid Link Creation
**Steps**: Create 10 links in succession quickly

**Expected**: No crashes, all cores remain visible

---

## SCORING RUBRIC

| Test | Result | Weight | Score |
|---|---|---|---|
| Test 1: Basic Selection | _____ | 1.0 | ____ |
| Test 2: Aura Filtering | _____ | 1.0 | ____ |
| Test 3: Empty Click | _____ | 1.0 | ____ |
| Test 4: Link Creation | _____ | 1.0 | ____ |
| Test 5: Crosshair | _____ | 1.0 | ____ |
| Test 6: Console Errors | _____ | 1.5 | ____ |
| Test 7: Determinism | _____ | 1.5 | ____ |
| Test 8: Restart/Repeat | _____ | 1.0 | ____ |
| **TOTAL** | | **8.0** | **____** |

**Passing Score**: 7.0 / 8.0 (87.5%)

**PASS Threshold**: ALL 8 tests must show ✅

---

## SIGN-OFF SECTION

**Tester Name**: ___________________________

**Date**: ___________________________

**Time Spent**: ___________________________

**Environment**: 
- Browser: ___________________________
- Resolution: ___________________________
- GPU: ___________________________
- FPS (average): ___________________________

**Overall Result**:
- [ ] ✅ ALL TESTS PASSED - Ready for production
- [ ] ⚠️  Some tests failed - Needs investigation
- [ ] ❌ Critical failures - Do not deploy

**Issues Found** (if any):
```
1. 
2. 
3. 
```

**Recommendations**:
```
1. 
2. 
3. 
```

**Signature**: ___________________________

---

## WHAT TO DO IF TESTS FAIL

### Failure in Test 1 (Basic Selection)
→ Check CanonicalInteractionFilter.js  
→ Verify raycaster filtering applied to NodeEditor.js  
→ Check node.userData.interactive = true  

### Failure in Test 2 (Aura Filtering)
→ Check GlobalAuraOpacityClamp.js (should clamp to ≤0.06)  
→ Verify shell marked with userData.isHologramShell = true  
→ Check aura marked with userData.isAura = true  

### Failure in Test 3 (Deselection)
→ Check DeselectGuaranteePatch.js (state cleared BEFORE callbacks)  
→ Verify deselection callback in NodeLinkingSystem.js  
→ Check selectedNode = null properly cleared  

### Failure in Test 4 (Link Visibility)
→ Check EnhancedNodeModelLinkState.js (core visibility boosted)  
→ Verify GlobalAuraOpacityClamp enforced after linking  
→ Check core material not mutated  

### Failure in Test 5 (Crosshair)
→ Check crosshair raycaster filtering  
→ Verify crosshair uses CanonicalInteractionFilter  
→ Check distance modulation not interfering  

### Failure in Test 6 (Console Errors)
→ If "r.raycast" error: Check Session 48 filter injection  
→ If material error: Check CoreMaterialAuthority  
→ Check main.js for import errors  

### Failure in Test 7 (Determinism)
→ Check DeselectGuaranteePatch (timing issue)  
→ Verify node registration (AINodes.js)  
→ Check state clearing order  

### Failure in Test 8 (Restart)
→ Check SafeWorldResetFix1_0.js  
→ Verify AINodes.js validation on spawn  
→ Check memory leaks (aura disposal)  

---

## SUCCESS MESSAGE

If all 8 tests pass:

```
✅ SESSION 50 GAMEPLAY TESTING: COMPLETE
✅ All visibility issues resolved
✅ All selection issues resolved
✅ All raycast crashes prevented
✅ System is deterministic and reliable
✅ READY FOR PRODUCTION DEPLOYMENT

Next Steps:
1. Document test results
2. Archive test logs
3. Deploy to production
4. Monitor user feedback
```

---

**END TEST PLAN**

Generated: Session 50  
Type: Comprehensive Gameplay Testing  
Expected Duration: 30-45 minutes  
Pass Rate Needed: 100% (all 8 tests must pass)
