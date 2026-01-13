# Emergency Hotfix: Quick Reference Card

## 📋 Copy-Paste Integration (main.js)

```javascript
// ============================================
// HOTFIX: Emergency Visual Stabilization
// ============================================

import { setupEmergencyVisualStabilization } from './HOTFIX_EmergencyVisualStabilization_v1.js';

// In initialization (after scene/renderer setup):
const stabilization = await setupEmergencyVisualStabilization({ scene });
window.__stabilization__ = stabilization;

// In createNode() function:
function createNode(data) {
  const node = new SigmaNode(data);
  stabilization.registerNode(node.group);  // ← ADD THIS
  return node;
}

// In render loop:
function animate() {
  stabilization.update();  // ← ADD THIS
  
  // rest of rendering...
  renderer.render(scene, camera);
}
```

---

## 🎮 Console Commands

```javascript
// Check everything
window.__stabilization__.getReport();

// Emergency aura removal
window.__stabilization__.immediateAuraSweep();

// Full system reset
window.__stabilization__.fullReset();

// Check individual systems
window.__stabilization__.auraKillSwitch.getStats();
window.__stabilization__.opaqueNodeSystem.getStats();
window.__stabilization__.spawnerDetector.getReport();

// Disable if needed
window.__stabilization__.auraKillSwitch.enabled = false;
window.__stabilization__.opaqueNodeSystem.enabled = false;

// Restore materials (rollback)
window.__stabilization__.opaqueNodeSystem.restore();
```

---

## ✅ Verification Checklist

- [ ] No discs around nodes (visually)
- [ ] Node cores readable
- [ ] Nodes are solid (not see-through)
- [ ] `getReport()` shows stats
- [ ] Spawn works
- [ ] Link works
- [ ] No console errors
- [ ] FPS stable

---

## 🔴 Problems & Fixes

| Problem | Check | Fix |
|---------|-------|-----|
| Auras still visible | `getReport().aura` | `immediateAuraSweep()` |
| Nodes transparent | `getReport().opacity` | Verify `registerNode()` called |
| Spawning broken | `getReport().spawners` | Check authoritative spawner |
| High CPU | Monitor FPS | Check `update()` isn't in loop twice |

---

## 📁 Files Deployed

```
EmergencyAuraKillSwitch_v1.js
ForceNodeOpaqueBodySystem_v1.js  
SpawnerConsolidationDetector_v1.js
HOTFIX_EmergencyVisualStabilization_v1.js
```

---

## ⏱️ Integration Time

- **Import + Init**: 2 minutes
- **Register nodes**: 1 minute
- **Add to render loop**: 1 minute
- **Test & verify**: 1 minute
- **Total**: ~5 minutes

---

## 🎯 Expected Result

✅ Clean nodes (no discs)  
✅ Solid bodies (not transparent)  
✅ Readable geometry  
✅ Normal gameplay  
✅ Stable FPS  

---

## 📞 Support

**Full guide**: `HOTFIX_EMERGENCY_STABILIZATION_IMPLEMENTATION.md`  
**Deployment**: `HOTFIX_DEPLOYMENT_CHECKLIST.md`  
**Summary**: `SESSION_99_EMERGENCY_HOTFIX_SUMMARY.md`

---

**Status**: 🟢 Ready to deploy  
**Time to fix**: <5 minutes  
**Impact**: Immediate visual clarity  
**Risk**: Minimal (fully reversible)
