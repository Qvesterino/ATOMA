# NodeLinker2_RepairLayer1_0 — Deployment Checklist

## Pre-Deployment (5 minutes)

### Preparation
- [ ] Read NODELINKER2_QUICKREF.md
- [ ] Review NODELINKER2_SUMMARY.md
- [ ] Have NodeLinker2_RepairLayer1_0.js file ready
- [ ] Know where main.js is located

### Code Review
- [ ] Verify NodeLinkingSystem exists in codebase
- [ ] Verify AINodes exists and has `.nodes` array
- [ ] Locate where to add initialization code

---

## Installation (2 minutes)

### Step 1: Copy File
- [ ] Copy `NodeLinker2_RepairLayer1_0.js` to project root

### Step 2: Import
- [ ] Open `main.js`
- [ ] Add import at top:
  ```javascript
  import NodeLinker2_RepairLayer1_0 from './NodeLinker2_RepairLayer1_0.js';
  ```

### Step 3: Create Instance
- [ ] Locate where `NodeLinkingSystem` is created
- [ ] Add after that section:
  ```javascript
  const repairLayer = new NodeLinker2_RepairLayer1_0(
    window.nodeLinker,
    window.aiNodes
  );
  repairLayer.init();
  repairLayer.runFullRepair();
  window.repairLayer = repairLayer;
  ```

### Step 4: Add Periodic Repair
- [ ] Add to main.js (or where appropriate):
  ```javascript
  setInterval(() => {
    if (window.repairLayer) {
      window.repairLayer.runFullRepair();
    }
  }, 10000);  // Every 10 seconds
  ```

---

## Verification (3 minutes)

### Run Tests
- [ ] Open browser console
- [ ] Run: `window.repairLayerDebug.integrity()`
- [ ] Should see report with statistics
- [ ] Verify "Repair Layer: ✓ ACTIVE"

### Check Status
- [ ] Run: `window.repairLayerDebug.sync()`
- [ ] Should show "Consistency: ✓ CONSISTENT"
- [ ] Verify runtime links match indexed links

### Verify HUD Works
- [ ] Click on a node in the scene
- [ ] Verify HUD displays without crashing
- [ ] Should show: SELECTED: [node name]
- [ ] Should show: LINKED: [categories]

### Check Statistics
- [ ] Run: `window.repairLayerDebug.stats()`
- [ ] Should see repair count increasing
- [ ] Valid links should match runtime
- [ ] No broken links should be found

---

## Functional Testing (5 minutes)

### Test Link Creation
- [ ] Create a new link (click two nodes)
- [ ] Verify link appears
- [ ] Run `window.repairLayerDebug.sync()`
- [ ] Verify consistency maintained

### Test Link Deletion
- [ ] Delete a link
- [ ] Verify link disappears
- [ ] Run `window.repairLayerDebug.sync()`
- [ ] Verify no orphans

### Test Repair Trigger
- [ ] Run: `window.repairLayerDebug.repair()`
- [ ] Should see small time value (<5ms)
- [ ] Run stats again, verify no changes

### Test History
- [ ] Run: `window.repairLayerDebug.history()`
- [ ] Should see recent events
- [ ] Should include full_repair events

---

## Integration Verification (2 minutes)

### Check Hooks
- [ ] Create multiple links
- [ ] Verify each auto-repairs (check stats)
- [ ] Delete link
- [ ] Verify auto-repairs (check stats)

### Verify No Breaking Changes
- [ ] Run existing gameplay normally
- [ ] Create/delete links as usual
- [ ] No crashes or errors
- [ ] Performance normal

### Monitor Console
- [ ] Should see no errors or warnings
- [ ] Should see init message at startup
- [ ] Should see repair progress

---

## Performance Testing (2 minutes)

### Check Repair Speed
- [ ] Run: `window.repairLayerDebug.stats()`
- [ ] Note `lastRepairMs` value
- [ ] Should be <5ms
- [ ] If >10ms, investigate

### Monitor Frame Rate
- [ ] Check FPS counter
- [ ] Should remain stable (no drops)
- [ ] No stuttering when repairs run

### Check Memory
- [ ] Open DevTools Memory tab
- [ ] Monitor memory trend
- [ ] Should be stable (no growth)
- [ ] No memory leaks

---

## Stress Testing (3 minutes)

### Create Many Links
- [ ] Create 50+ links quickly
- [ ] Verify HUD still works
- [ ] Run `window.repairLayerDebug.integrity()`
- [ ] All should be valid

### Delete Many Links
- [ ] Delete 50+ links
- [ ] Verify system stable
- [ ] Run `window.repairLayerDebug.sync()`
- [ ] Should show consistent

### Check After Repairs
- [ ] Let system run for 30s
- [ ] Multiple repairs should run
- [ ] Stats should be stable
- [ ] No orphans or broken links

---

## Documentation Review (1 minute)

- [ ] Read NODELINKER2_QUICKREF.md
- [ ] Read NODELINKER2_INTEGRATION.md
- [ ] Understand repair cycle phases
- [ ] Know console debug commands

---

## Final Verification (1 minute)

- [ ] All tests passed
- [ ] No errors in console
- [ ] HUD works
- [ ] Links sync correctly
- [ ] Performance acceptable
- [ ] Documentation understood

---

## Pre-Production Sign-Off

- [ ] Technical review: ✓ Pass
- [ ] Integration complete: ✓ Pass
- [ ] Testing complete: ✓ Pass
- [ ] Documentation complete: ✓ Pass
- [ ] Performance acceptable: ✓ Pass
- [ ] Ready for deployment: ✓ YES

---

## Deployment to Production

### Step 1: Commit
```bash
git add NodeLinker2_RepairLayer1_0.js
git add main.js (with changes)
git commit -m "Add NodeLinker2_RepairLayer1_0 self-healing validation layer"
```

### Step 2: Deploy
```bash
git push origin main
# Deploy to production as normal
```

### Step 3: Monitor
- [ ] Watch server logs
- [ ] Monitor console errors
- [ ] Check repair statistics
- [ ] Verify HUD functionality

---

## Post-Deployment (1 minute)

### Verify Live
- [ ] Access production instance
- [ ] Click nodes (HUD works)
- [ ] Create/delete links (system stable)
- [ ] Run: `window.repairLayerDebug.integrity()`

### Document Results
- [ ] Record initial stats
- [ ] Set baseline for monitoring
- [ ] Create alert if repair frequency spikes

### Notify Team
- [ ] Link system is now self-healing
- [ ] HUD is stable
- [ ] ML gets clean data
- [ ] Links always valid

---

## Ongoing Monitoring (Daily)

### Daily Checks
- [ ] Check repair statistics
- [ ] Verify consistency maintained
- [ ] Monitor for any errors
- [ ] Check performance impact

### Weekly Checks
- [ ] Review repair history
- [ ] Look for patterns
- [ ] Adjust repair frequency if needed
- [ ] Update statistics baseline

---

## Troubleshooting During Deployment

### If Tests Fail

| Issue | Solution |
|-------|----------|
| `window.repairLayerDebug` undefined | Verify init() was called |
| "Consistency: ✗ MISMATCH" | Run `window.repairLayerDebug.repair()` |
| HUD crashes | Increase repair frequency to 5s |
| Stats not updating | Check if `setInterval` is running |

### If Performance Slow

| Issue | Solution |
|-------|----------|
| Repair takes >10ms | Reduce link count or check for corruption |
| FPS dropping | Reduce repair frequency to 20s |
| Memory growing | Check for memory leaks elsewhere |

### If Links Keep Disappearing

| Issue | Solution |
|-------|----------|
| Nodes deleted without cleanup | Add hook in node deletion |
| Repair too aggressive | Increase repair interval |
| Other systems deleting links | Audit link deletion code |

---

## Success Criteria

✅ **All of the following must be true:**

- [ ] `window.repairLayerDebug.integrity()` shows valid links
- [ ] `window.repairLayerDebug.sync()` shows consistent
- [ ] HUD works on first click
- [ ] No console errors
- [ ] Repair time <5ms
- [ ] Performance stable
- [ ] Memory stable
- [ ] No broken links
- [ ] Index synced
- [ ] All tests passing

---

## Rollback Plan

If issues arise:

1. Remove repair layer initialization from main.js
2. Remove setInterval for periodic repairs
3. Keep import (won't hurt)
4. Redeploy
5. System returns to previous behavior

---

## Support Contacts

- **Quick ref:** NODELINKER2_QUICKREF.md
- **Integration:** NODELINKER2_INTEGRATION.md
- **Debug:** `window.repairLayerDebug.*`
- **Console:** `window.nodeLinker2`

---

## Sign-Off

- [ ] Developer: Name _____________ Date _______
- [ ] QA: Name _____________ Date _______
- [ ] Deployment: Name _____________ Date _______

---

**Status: ✅ READY FOR DEPLOYMENT**

Estimated time: **5 minutes**

Risk level: **LOW** (hooks only, backward compatible)

---
