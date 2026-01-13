# HOTFIX Deployment Checklist

## 🔴 EMERGENCY VISUAL STABILIZATION HOTFIX
**Deployed**: Session 99  
**Priority**: CRITICAL  
**Expected Impact**: Immediate visual clarity restoration

---

## PRE-DEPLOYMENT (5 min)

- [ ] Review HOTFIX_EMERGENCY_STABILIZATION_IMPLEMENTATION.md
- [ ] Locate main.js in project
- [ ] Backup current main.js (safety)
- [ ] Verify scene + renderer + camera are initialized

---

## DEPLOYMENT (5 min)

### Step 1: Import Systems
```javascript
// Add to top of main.js
import { setupEmergencyVisualStabilization } from './HOTFIX_EmergencyVisualStabilization_v1.js';
```

### Step 2: Initialize (in startup code)
```javascript
// After scene/renderer/camera setup
const stabilization = await setupEmergencyVisualStabilization({
  scene: this.scene,
  debugMode: true
});

// Expose for console access
window.__stabilization__ = stabilization;
```

### Step 3: Register Nodes (in node creation function)
```javascript
// In createNode() or spawn function
stabilization.registerNode(newNode.group);
```

### Step 4: Update Loop (in render/animate)
```javascript
// At START of render loop
stabilization.update();

// Then rest of rendering...
renderer.render(scene, camera);
```

### Step 5: Optional - Register Spawners
```javascript
// Wrap main spawner
this.spawnNode = stabilization.registerSpawner('MainSpawner', this.spawnNode);
```

---

## VERIFICATION (2 min)

### Visual Check
- [ ] Launch game
- [ ] Look for large translucent spheres around nodes
- [ ] Expected: NONE (nodes should look clean)
- [ ] Expected: Node cores fully readable
- [ ] Expected: No see-through node bodies

### Console Check
```javascript
// In browser console:
window.__stabilization__.getReport();

// Should show:
// - aura.intercepted > 0 (auras blocked)
// - opacity.nodesProcessed > 0 (nodes registered)
// - spawners.authoritative set to a spawner name
```

### Gameplay Check
- [ ] Spawn a node (manually)
- [ ] Node appears as solid, readable geometry
- [ ] Can select/link nodes normally
- [ ] No crashes or errors

---

## SUCCESS INDICATORS ✅

| Indicator | Expected | Check |
|-----------|----------|-------|
| Visual clarity | Improved 100% | Nodes look clean |
| Aura discs | Removed | `getReport().aura.intercepted > 0` |
| Node opacity | Solid (1.0) | `getReport().opacity.nodesProcessed > 0` |
| Spawning | Works normally | Spawn node → appears as solid |
| Console | Clean | No errors when running |
| Performance | <2ms overhead | FPS stable |

---

## PROBLEM INDICATORS 🔴

| Problem | Check | Fix |
|---------|-------|-----|
| Auras still visible | `auraKillSwitch.getStats()` | Call `immediateAuraSweep()` |
| Nodes see-through | `opaqueNodeSystem.getStats()` | Verify `registerNode()` called |
| Spawning broken | `spawnerDetector.getReport()` | Check if wrong spawner consolidated |
| High CPU | Monitor FPS | Disable `stabilization.update()` call |
| Crashes | Check console | Verify scene object passed correctly |

---

## ROLLBACK (2 min)

If issues occur:

### Quick Disable
```javascript
// In console:
window.__stabilization__.auraKillSwitch.enabled = false;
window.__stabilization__.opaqueNodeSystem.enabled = false;
```

### Full Restore
```javascript
// In console:
window.__stabilization__.opaqueNodeSystem.restore();

// In main.js:
// Comment out: stabilization.update();
// Comment out: stabilization.registerNode(...);
// Comment out: setupEmergencyVisualStabilization(...);
```

---

## MONITORING (Post-Deploy)

### First Hour
- [ ] Check console for errors
- [ ] Monitor performance (FPS steady?)
- [ ] Test node creation (works normally?)
- [ ] Test linking (works normally?)

### Daily
- [ ] Visual stability maintained
- [ ] No visual regression
- [ ] Spawning/linking unaffected
- [ ] Performance remains stable

### Weekly
- [ ] Document any issues found
- [ ] Plan permanent fix
- [ ] Review architecture for improvements

---

## POST-DEPLOYMENT TASKS

### Week 1
- [ ] Gather visual feedback from team
- [ ] Document observations in console logs
- [ ] Identify edge cases
- [ ] Create bug list (if any)

### Week 2+
- [ ] Design hierarchical aura system (if re-enabling later)
- [ ] Plan material system hardening
- [ ] Architecture cleanup
- [ ] Permanent fix implementation

---

## Files Deployed

✅ EmergencyAuraKillSwitch_v1.js  
✅ ForceNodeOpaqueBodySystem_v1.js  
✅ SpawnerConsolidationDetector_v1.js  
✅ HOTFIX_EmergencyVisualStabilization_v1.js  
✅ HOTFIX_EMERGENCY_STABILIZATION_IMPLEMENTATION.md  
✅ HOTFIX_DEPLOYMENT_CHECKLIST.md  

**Total**: 6 files (~1100 lines of hotfix code)

---

## Console Commands Quick Reference

```javascript
// Check status
window.__stabilization__.getReport();

// Immediate aura sweep
window.__stabilization__.immediateAuraSweep();

// Full reset
window.__stabilization__.fullReset();

// Get aura stats
window.__stabilization__.auraKillSwitch.getStats();

// Get opaque stats
window.__stabilization__.opaqueNodeSystem.getStats();

// Get spawner status
window.__stabilization__.spawnerDetector.getReport();

// Toggle systems
window.__stabilization__.auraKillSwitch.enabled = false;
window.__stabilization__.opaqueNodeSystem.enabled = false;

// Restore materials
window.__stabilization__.opaqueNodeSystem.restore();
```

---

## Expected Outcome

### Visuals
- ✅ No large translucent discs around nodes
- ✅ Node cores fully readable
- ✅ Node bodies never transparent
- ✅ Scene looks "clean" and organized

### Gameplay
- ✅ Spawning works normally
- ✅ Linking works normally
- ✅ Selection/interaction unchanged
- ✅ No crashes

### Performance
- ✅ <2ms per frame overhead
- ✅ FPS stable
- ✅ No memory leaks

---

## Support

**Questions?** Check HOTFIX_EMERGENCY_STABILIZATION_IMPLEMENTATION.md  
**Issues?** Check troubleshooting section in implementation guide  
**Console debugging?** Use commands in Quick Reference above  

---

## Sign-Off

**Deployed By**: [Name]  
**Date**: [Date]  
**Status**: 🟢 **ACTIVE**  
**Next Review**: [Date + 1 week]

---

**This hotfix stabilizes visuals immediately.**  
**Architecture cleanup and permanent fixes can resume after verification.**

---

**Generated**: Session 99 HOTFIX  
**Mode**: Emergency Stabilization  
**Status**: READY FOR DEPLOYMENT
