# Session 21 Phase 2 — Verification Checklist

**Purpose**: Verify that visual authority guards and spawn collision safety are working correctly.

**Time Required**: ~15 minutes

---

## ✅ PRE-VERIFICATION

- [ ] Project loads without errors
- [ ] Browser console shows no JavaScript errors
- [ ] Nodes render in the 3D view
- [ ] Existing gameplay works (linking, events, interactions)

---

## 🔍 VERIFICATION TESTS

### TEST 1: Single Node Spawn (Baseline)

**Action**:
1. Reload project
2. Observe first few nodes appear

**Expected Result**:
- ✅ Nodes appear normally
- ✅ Auras visible (NodeAuraSystem)
- ✅ Core geometry visible
- ✅ No visual delay or pop-in

**Pass Criteria**: 
- [ ] All visuals appear immediately
- [ ] Auras are positioned around core
- [ ] No console errors

---

### TEST 2: Rapid Multi-Node Spawn (Collision Test)

**Action**:
1. Run in console: `for(let i=0; i<10; i++) window.aiNodes.spawnNode();`
2. Observe nodes spawning rapidly
3. Look for overlapping auras or stacked visuals

**Expected Result**:
- ✅ Multiple nodes spawn
- ✅ Some nodes may have delayed aura activation
- ✅ NO overlapping auras or massive discs
- ✅ Auras don't merge or stack

**Pass Criteria**:
- [ ] Nodes spawn without overlapping visuals
- [ ] Each node maintains distinct aura
- [ ] No massive semi-transparent discs
- [ ] No visual noise or explosion

**Optional Debug**:
```javascript
// In console, check visualReady flag
window.aiNodes.nodes.forEach((n, i) => {
  console.log(`Node ${i}: visualReady=${n.userData.visualReady}`);
});
```

---

### TEST 3: Node Linking with Evolution Trigger (Visual Authority Test)

**Action**:
1. Spawn 2–3 nodes
2. Wait for nodes to be active (in camera distance)
3. Create link between two nodes by clicking
4. Observe evolution visual activation

**Expected Result**:
- ✅ Link created successfully
- ✅ Evolution energy increases on both nodes
- ✅ Evolution overlays appear cleanly (NOT immediately, wait 150ms if spawn collision occurred)
- ✅ Aura remains visible behind evolution overlay
- ✅ Core geometry still visible

**Pass Criteria**:
- [ ] Evolution visuals don't appear before node is ready
- [ ] No sudden visual pop-in or overlap
- [ ] Visual hierarchy maintained (core > evolution > aura)
- [ ] Link animation smooth, no glitches

---

### TEST 4: Zoom In / Zoom Out (Visual Persistence Test)

**Action**:
1. Spawn a node
2. Zoom in close to node (camera within 5 units)
3. Observe aura and evolution visuals
4. Zoom out (camera > 100 units away)
5. Observe visual scaling

**Expected Result**:
- ✅ Core geometry always visible and readable
- ✅ Aura doesn't obscure core even at close zoom
- ✅ Evolution overlays scale appropriately
- ✅ No clipping or visual artifacts
- ✅ Smooth distance modulation (aura fades at distance per NodeAuraSystem logic)

**Pass Criteria**:
- [ ] Core never hidden by aura
- [ ] Visual hierarchy maintained at all zoom levels
- [ ] No rendering glitches
- [ ] Distance modulation smooth (if implemented)

---

### TEST 5: Rapid Linking Under Collision Scenario (Stress Test)

**Action**:
1. Spawn 5 nodes rapidly: `for(let i=0; i<5; i++) window.aiNodes.spawnNode();`
2. Immediately create links between them
3. Observe evolution energy cascade

**Expected Result**:
- ✅ Links succeed
- ✅ Evolution visuals appear cleanly (may be delayed per collision logic)
- ✅ NO visual explosions or massive discs
- ✅ NO flickering or pop-in artifacts
- ✅ Core geometries remain readable

**Pass Criteria**:
- [ ] No overlapping evolution overlays
- [ ] No massive stacked auras
- [ ] Visual activation timeline clear
- [ ] No console errors
- [ ] FPS remains stable (>30 FPS)

---

## 🐛 DEBUG COMMANDS

### Check Visual Authority Metadata

```javascript
// List all nodes and their visual state
window.aiNodes.nodes.forEach((node, i) => {
  const d = node.userData;
  console.log(`Node ${i}:`, {
    visualOwner: d.visualOwner,
    hasPrimaryVisual: d.hasPrimaryVisual,
    visualReady: d.visualReady,
    visualActivationDelay: d.visualActivationDelay,
    spawnTime: d.spawnTime ? `${Date.now() - d.spawnTime}ms ago` : 'N/A'
  });
});
```

### Check Aura State

```javascript
// List all active auras
if (window.nodeAuraSystem && window.nodeAuraSystem.auras) {
  let count = 0;
  window.nodeAuraSystem.auras.forEach(aura => {
    count++;
    console.log(`Aura ${count}:`, {
      nodeReady: aura.node.userData.visualReady,
      intensity: aura.currentIntensity,
      radius: aura.radius,
      layer: aura.mesh.userData.visualLayer
    });
  });
  console.log(`Total auras: ${count}`);
}
```

### Check Evolution VFX State

```javascript
// List evolution visuals
if (window.evolutionManager && window.evolutionManager.vfxMeshes) {
  for (const nodeId in window.evolutionManager.vfxMeshes) {
    const vfx = window.evolutionManager.vfxMeshes[nodeId];
    console.log(`Evolution VFX for ${nodeId}:`, {
      glowActive: !!vfx.glowSphere,
      coreActive: !!vfx.coreHologram,
      ringsActive: vfx.orbitRings.length
    });
  }
}
```

### Force Visual Readiness Check

```javascript
// Manually trigger readiness check
window.aiNodes.nodes.forEach(node => {
  window.aiNodes._checkVisualReadiness(node);
});
console.log('Visual readiness checked');
```

---

## ❌ KNOWN ISSUES TO WATCH FOR

### Issue 1: Aura Not Appearing
**Symptom**: Some nodes don't have halos visible  
**Root Cause**: visualReady flag still false (spawn collision delay active)  
**Expected**: Aura should appear after ~150ms  
**Action**: Wait 200ms and check again, or use debug commands above

### Issue 2: Overlapping Auras Visible
**Symptom**: Two halos merged into one large disc  
**Root Cause**: Spawn collision guard may not be working  
**Action**: Check console for errors, verify guard code is present in NodeAuraSystem_v1.js

### Issue 3: Evolution Visual Never Appears
**Symptom**: Link created but evolution overlay doesn't show  
**Root Cause**: visualReady flag issue or evolution energy too low  
**Action**: Link more nodes to increase energy, check metadata with debug commands

### Issue 4: Performance Degradation
**Symptom**: FPS drops when spawning many nodes  
**Root Cause**: Likely unrelated to Phase 2 (collision check is <0.001ms)  
**Action**: Check existing performance issues, run profiler

---

## ✅ PASS/FAIL CRITERIA

### Automatic Pass ✅
All tests 1–5 pass without issues → **Phase 2 is working correctly**

### Automatic Fail ❌
- Overlapping auras visible after test 2
- Evolution visual never appears (test 3, after 500ms wait)
- Core geometry hidden by aura (test 4)
- Visual explosion during rapid linking (test 5)
- Console JavaScript errors related to visual systems

### Manual Judgment ⚠️
- "Something looks odd" → Capture screenshot, compare with test expectations
- Performance slightly lower → Profile to isolate cause
- Occasional glitches → May be existing system, investigate with git history

---

## 📋 TEST EXECUTION LOG

**Date**: ________________  
**Tester**: ________________  
**Project Version**: ________________

### Test Results

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| 1: Single Spawn | [ ] | [ ] | |
| 2: Rapid Spawn | [ ] | [ ] | |
| 3: Linking Evolution | [ ] | [ ] | |
| 4: Zoom In/Out | [ ] | [ ] | |
| 5: Stress Test | [ ] | [ ] | |

### Overall Result

- [ ] **PASS** — All tests passed, Phase 2 working correctly
- [ ] **PASS WITH NOTES** — Mostly working, minor issues noted
- [ ] **FAIL** — Critical issues detected, needs investigation

### Notes / Issues Found

```
[Write any observations or issues here]

```

---

## 🎯 SUCCESS CRITERIA SUMMARY

**Phase 2 is successful if:**

✅ Nodes spawn without overlapping visuals  
✅ Evolution visuals appear cleanly without pop-in  
✅ Aura halos remain distinct (don't merge)  
✅ Core geometry always visible  
✅ No visual explosions on rapid spawn/link  
✅ All existing gameplay continues to work  
✅ No new console errors  
✅ Performance remains stable (>30 FPS)

---

## 📞 TROUBLESHOOTING

### Aura Overlap Issue
```javascript
// Check occupancyRadius and delay
console.log('Occupancy check at spawn:');
window.aiNodes.nodes.slice(-3).forEach(n => {
  console.log(`Node visualReady: ${n.userData.visualReady}, delay: ${n.userData.visualActivationDelay}ms`);
});
```

### Evolution Not Showing
```javascript
// Force evolution energy on a node
const node = window.aiNodes.nodes[0];
if (window.evolutionManager) {
  const nodeId = node.uuid;
  window.evolutionManager.registry[nodeId].energy = 30; // Force stage 3+
  window.evolutionManager.registry[nodeId].stage = 3;
}
```

### General Debug
```javascript
// Full visual system state dump
console.log('=== VISUAL SYSTEM STATE ===');
console.log('Nodes:', window.aiNodes.nodes.length);
console.log('Auras:', window.nodeAuraSystem?.auras?.size || 0);
console.log('Active:', window.aiNodes.nodes.filter(n => n.userData.visualReady).length);
console.log('Delayed:', window.aiNodes.nodes.filter(n => !n.userData.visualReady).length);
```

---

## 📚 REFERENCE DOCS

- Implementation: `/SESSION_21_PHASE2_INTEGRATION_SUMMARY.md`
- Previous Phase: `/SESSION_21_RULE1_IMPLEMENTATION_SUMMARY.md`
- Visual Hierarchy: `/VISUAL_HIERARCHY_REGISTRY_GUIDE.md`
- Audit Context: `/BRUTAL_NODE_VISUAL_SPAWN_AUDIT_SESSION21.md`

---

**Verification Checklist v1.0**  
**Status**: Ready for testing  
**Last Updated**: Session 21 Phase 2

