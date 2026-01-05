# Critical Stabilization - Deployment Checklist

## Pre-Deployment (Do This First)

- [ ] **Backup current codebase** - Just in case
- [ ] **Read** `/CRITICAL_STABILIZATION_DEPLOYMENT_SUMMARY.md` - Understand what was done
- [ ] **Review** `/VisualAuthorityLock.js` - Check the new authority system

---

## Files to Update (Systematic Order)

### 1. Add New Authority System
- [ ] Copy `/VisualAuthorityLock.js` to project
- [ ] Verify file imports correctly: `import VisualAuthorityLock from './VisualAuthorityLock.js'`

### 2. Update Configuration
- [ ] Update `/config.js`:
  - [ ] Add new `visuals` section with 5 flags
  - [ ] All flags set to `true`
  - [ ] Verify syntax is valid

### 3. Update NeonLinkVisuals
- [ ] Update `/NeonLinkVisuals.js`:
  - [ ] Add import: `import VisualAuthorityLock from './VisualAuthorityLock.js'`
  - [ ] Update `_getParticleLateralOffset()` - verify added
  - [ ] Update `_getNodeProximityFade()` - verify added
  - [ ] Update `updateParticles()` - verify guards added (lines 1082-1179)
  - [ ] Update `animateCurveByPriority()` - verify guard added (line 1159)
  - [ ] Update `applyPriorityEffects()` - verify guard added (line 1213)
  - [ ] Update `createDataFlowParticles()` - verify bounds metadata added
  - [ ] Update `_createSynergyFlowParticles()` - verify metadata added

### 4. Update NodeLinkingSystem
- [ ] Update `/NodeLinkingSystem.js`:
  - [ ] Add import: `import VisualAuthorityLock from './VisualAuthorityLock.js'`
  - [ ] Update `getNodeAtPosition()` - verify guard added (line 1461)
  - [ ] Add new method `_getNodeAtPositionFromProxies()` (lines 1586-1619)

---

## Syntax Verification

### Quick Checks (No Build Required)
- [ ] `/VisualAuthorityLock.js` loads without errors
- [ ] `CONFIG.visuals` section is valid JavaScript object
- [ ] All import statements use correct paths
- [ ] No duplicate method names
- [ ] All opening braces have matching closing braces

### In Browser Console (Optional)
```javascript
// Should work:
CONFIG.visuals.LOCK_NODE_VISUALS === true
VisualAuthorityLock.canModifyNode()
VisualAuthorityLock.getStatus()
```

---

## Functional Verification

### Startup Check
- [ ] Application loads without console errors
- [ ] See log: `[VisualAuthority] Node & Link visuals locked successfully.`
- [ ] No repeated warning messages
- [ ] No crashes during initialization

### Visual Check
- [ ] Nodes visible and appear normal
- [ ] Links render as curves
- [ ] No broken visual elements
- [ ] Scene renders smoothly

### Interaction Check
- [ ] Click on blue node → Works
- [ ] Click on cyan node → Works
- [ ] Click on orange node → Works
- [ ] Click on other nodes → Works
- [ ] No dead zones (unclickable areas)
- [ ] Click-to-link system responsive

### Stability Check
- [ ] Link a node → Node appearance unchanged
- [ ] Link another node → All nodes appear stable
- [ ] Multiple links → Visual consistency maintained
- [ ] No unexpected visual mutations

### Particle Check
- [ ] Particles near link curves (not drifting)
- [ ] Particles fade at node boundaries
- [ ] No orphaned particles visible
- [ ] Particle count stable over time

---

## Performance Verification

### Baseline (Before Deployment)
- [ ] Note FPS at baseline (if needed)
- [ ] Test with multiple links active
- [ ] Monitor for stutters or drops

### After Deployment
- [ ] FPS unchanged or slightly improved
- [ ] No new stutters or frame drops
- [ ] Raycasting responsive (no lag on clicks)
- [ ] Scene renders smoothly

---

## Console Verification

### Expected Output
```
[VisialAuthority] Node & Link visuals locked successfully.
```

### NOT Expected (if seen, investigate)
- [ ] Multiple initialization logs
- [ ] Warnings about blocked mutations
- [ ] Material undefined errors
- [ ] Null reference errors
- [ ] Type errors

---

## Rollback Procedure (If Needed)

If something goes wrong:

### Option 1: Simple Disable (Instant, No Reload)
```javascript
// In browser console:
CONFIG.visuals.LOCK_NODE_VISUALS = false;
CONFIG.visuals.LOCK_LINK_VISUALS = false;
CONFIG.visuals.LOCK_INTERACTION = false;
CONFIG.visuals.PARTICLE_BOUNDS_CHECK = false;
CONFIG.visuals.FREEZE_MODE_SAFE = false;
```

### Option 2: Full Rollback (If Needed)
1. Restore previous `/config.js`
2. Restore previous `/NeonLinkVisuals.js`
3. Restore previous `/NodeLinkingSystem.js`
4. Delete `/VisualAuthorityLock.js`
5. Reload page

---

## Testing Scenarios

### Scenario 1: Basic Linking
1. [ ] Select node A (blue)
2. [ ] Click node B (cyan)
3. [ ] Verify: Node A appearance unchanged
4. [ ] Verify: Node B appearance unchanged
5. [ ] Verify: Link renders cleanly

### Scenario 2: Multiple Links
1. [ ] Create link A→B
2. [ ] Create link A→C
3. [ ] Create link B→C
4. [ ] Verify: All nodes maintain appearance
5. [ ] Verify: All links render cleanly
6. [ ] Verify: No visual overlap issues

### Scenario 3: Click Reliability
1. [ ] Click 5 different nodes rapidly
2. [ ] Verify: All clicks register
3. [ ] Verify: No selection failures
4. [ ] Verify: Interaction is smooth

### Scenario 4: Visual Stability
1. [ ] Create a complex graph (8+ nodes, 10+ links)
2. [ ] Verify: Node appearances stable
3. [ ] Verify: Link geometry stable
4. [ ] Verify: Particles bounded
5. [ ] Verify: No visual artifacts

---

## Documentation

- [ ] Keep `/CRITICAL_STABILIZATION_DEPLOYMENT_SUMMARY.md` for reference
- [ ] Keep `/CRITICAL_STABILIZATION_QUICKREF.md` for quick lookup
- [ ] Keep `/CRITICAL_STABILIZATION_VERIFICATION.md` for verification
- [ ] Keep this checklist for future deployments

---

## Sign-Off

### Pre-Deployment Sign-Off
- [ ] All files reviewed
- [ ] All changes understood
- [ ] Rollback plan clear
- [ ] Ready to deploy

### Post-Deployment Sign-Off
- [ ] All checks passed
- [ ] No console errors
- [ ] Visual stability confirmed
- [ ] Interaction reliable
- [ ] Performance acceptable
- [ ] Deployment successful ✓

---

## Quick Reference During Deployment

**Files to update**:
1. Add `VisualAuthorityLock.js` (NEW)
2. Update `config.js` (add visuals section)
3. Update `NeonLinkVisuals.js` (add guards)
4. Update `NodeLinkingSystem.js` (add interaction authority)

**Expected startup message**:
```
[VisualAuthority] Node & Link visuals locked successfully.
```

**If anything breaks**:
```javascript
CONFIG.visuals.LOCK_NODE_VISUALS = false;
// (set all 5 flags to false)
```

**Deployment Time**: ~5-10 minutes

---

## Final Verification

After deployment, verify this status:

```javascript
VisualAuthorityLock.getStatus()
// Should show:
// {
//   nodeVisuals: true,
//   linkVisuals: true,
//   interaction: true,
//   particleBounds: true,
//   freezeModeSafe: true,
//   timestamp: <current time>
// }
```

---

## Support

If you encounter issues:

1. Check `/CRITICAL_STABILIZATION_VERIFICATION.md` for detailed implementation
2. Check browser console for specific error messages
3. Use `VisualAuthorityLock.getStatus()` to verify lock state
4. Review guard checks in respective files
5. Verify config flags are all `true`

---

## Completion

- [x] Files prepared
- [x] Code reviewed
- [x] Documentation complete
- [x] Ready for deployment

**Status**: READY FOR PRODUCTION DEPLOYMENT

---

**Next Step**: Execute the file updates in the order listed above, then run the Functional Verification checks.
