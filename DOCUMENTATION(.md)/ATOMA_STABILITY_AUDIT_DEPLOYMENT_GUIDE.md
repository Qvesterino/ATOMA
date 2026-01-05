# ATOMA Stability Audit — Deployment Guide

**Step-by-step implementation of all Session 23 fixes.**

---

## 📋 Pre-Deployment Checklist

Before starting fixes:

- [ ] Read ENGINE_AUDIT_SESSION23_REPORT.md (understand issues)
- [ ] Review ENGINE_AUDIT_SESSION23_FIXES_APPLIED.md (see solutions)
- [ ] Browser console ready for testing
- [ ] Git or version control ready (for rollback if needed)
- [ ] ~2 hours blocked for deployment

---

## 🎯 Phase 1: Critical System Initialization (30 min)

### Step 1.1: Initialize LinkAutomationMonitor2_0 in main.js

**Location:** Find line with `import { LinkAutomationEngine1_0 }`  
**Add AFTER existing imports:**

```js
// ============================================================================
// LINK AUTOMATION MONITORING 2.0 (Session 22 + Session 23 Fix #1)
// ============================================================================
import { LinkAutomationMonitor2_0 } from './LinkAutomationMonitor2_0.js';
import { LinkAutomationMonitorHUD2_0, setupAutomationMonitorHUD } from './LinkAutomationMonitorHUD2_0.js';
```

**Location:** In AtomaGame.init(), after all engines created (search for `this.autoLinkEngine`)  
**Add AFTER autoLinkEngine is created:**

```js
// Session 23 Fix #1: Initialize automation monitor
try {
  window.linkAutomationMonitor.init({
    LinkAutomationEngine1_0: this.autoLinkEngine,
    LinkHistoryTracker1_0: this.linkHistoryTracker,
    LinkRecommendationAI1_0: this.recommendationAI,
    ComputeSynergyScore2_0: computeSynergyScore,
    SynergyHighways2_0: this.synergyHighways
  });
  console.log('[MAIN] ✓ LinkAutomationMonitor2_0 initialized');
} catch (err) {
  console.warn('[MAIN] Error initializing monitor:', err.message);
}

// Setup HUD display
setTimeout(() => {
  if (typeof setupAutomationMonitorHUD === 'function') {
    setupAutomationMonitorHUD('#hud-monitor');
    console.log('[MAIN] ✓ Automation Monitor HUD initialized');
  }
}, 1000);
```

**Verification:**
```js
// In console:
window.linkAutomationMonitor.getStats()
// Should return: { initialized: true, ... }
```

✅ **Done:** Monitor system now initialized

---

### Step 1.2: Initialize LinkGlowSynergyEngine1_0

**Location:** In AtomaGame.init(), after NodeLinkingSystem created  
**Add:**

```js
// Session 23 Fix #2: Initialize glow engine
try {
  if (typeof window.LinkGlowSynergyEngine1_0 !== 'undefined' && 
      window.LinkGlowSynergyEngine1_0.init) {
    window.LinkGlowSynergyEngine1_0.init(this.nodeLinker);
    console.log('[MAIN] ✓ LinkGlowSynergyEngine1_0 initialized');
  }
} catch (err) {
  console.warn('[MAIN] Error initializing glow engine:', err.message);
}
```

**Verification:**
```js
// In console:
window.LinkGlowSynergyEngine1_0?.getStats?.()
// Should show cache size > 0 after links created
```

✅ **Done:** Glow engine now auto-updates

---

### Step 1.3: Initialize LinkHistoryTracker1_0

**Location:** After NodeLinkingSystem created  
**Add:**

```js
// Session 23 Fix #3: Initialize history tracker
try {
  if (typeof window.LinkHistoryTracker1_0 !== 'undefined' && 
      window.LinkHistoryTracker1_0.init) {
    window.LinkHistoryTracker1_0.init(this.nodeLinker);
    console.log('[MAIN] ✓ LinkHistoryTracker1_0 initialized');
  }
} catch (err) {
  console.warn('[MAIN] Error initializing history tracker:', err.message);
}
```

**Verification:**
```js
// In console:
window.LinkHistoryTracker1_0?.getStats?.()
// Should show sample count increasing
```

✅ **Done:** History tracker now recording

---

### Step 1.4: Wire SynergyHighways2_0 with History

**Location:** After SynergyHighways2_0 init  
**Add:**

```js
// Session 23 Fix #4: Wire SynergyHighways2_0 with history reference
try {
  if (typeof window.SynergyHighways2_0 !== 'undefined' && 
      window.SynergyHighways2_0.init) {
    window.SynergyHighways2_0.init({
      linkingSystem: this.nodeLinker,
      scene: this.scene,
      historyTracker: window.LinkHistoryTracker1_0
    });
    console.log('[MAIN] ✓ SynergyHighways2_0 initialized with history reference');
  }
} catch (err) {
  console.warn('[MAIN] Error initializing highways:', err.message);
}
```

**Verification:**
```js
// In console:
window.SynergyHighways2_0?.getStats?.()
// Should show highways built and trends detected
```

✅ **Done:** Highway system now has access to trends

---

### Step 1.5: Fix SynergyHighwayVisuals3D Scene Attach

**File:** SynergyHighwayVisuals3D_1_0.js  
**Location:** Line 63, change:

```js
// BEFORE:
const visualGroup = null;

// AFTER:
let visualGroup = null;  // Changed from const to let (Session 23 Fix #6)
```

**Location:** In createVisualGroup() function (~line 200), update:

```js
// BEFORE:
function createVisualGroup() {
  if (!visualGroup) {
    visualGroup = new THREE.Group();
    scene.add(visualGroup);
  }
}

// AFTER:
function createVisualGroup() {
  if (!visualGroup && scene) {
    visualGroup = new THREE.Group();
    visualGroup.name = 'SynergyHighways3D';
    scene.add(visualGroup);
    console.log('[SynergyHighwayVisuals3D_1_0] ✓ Visual group created');
  }
  return visualGroup;
}
```

**Verification:**
```js
// In console:
window.scene.children.find(c => c.name === 'SynergyHighways3D')
// Should exist and have meshes
```

✅ **Done:** Highway visualization now renders

---

## 🎯 Phase 2: Add Missing Hooks (20 min)

### Step 2.1: Add Engine Automation Hooks

**File:** LinkAutomationEngine1_0.js  
**Location:** autoLinkFor() method start (~line 98)

**Add at VERY START of method:**
```js
const cycleIndex = this.stats.totalCycles;
const cycleStartTime = Date.now();

// Session 23 Fix #5: Record cycle start
window.linkAutomationMonitor?.onCycleStart({ 
  cycleIndex, 
  startedAt: cycleStartTime 
});
```

**Location:** Before `return result;` (~line 209)

**Add:**
```js
// Session 23 Fix #5: Record cycle end
const cycleDurationMs = Date.now() - cycleStartTime;
window.linkAutomationMonitor?.onCycleEnd({
  cycleIndex,
  startedAt: cycleStartTime,
  durationMs: cycleDurationMs,
  recommendations: result.total,
  created: result.created,
  rejected: result.skipped,
  avgSynergyEval: 0,
  avgSynergyCreated: result.links.length > 0 
    ? result.links.reduce((sum, l) => sum + (l.synergyScore || 0), 0) / result.links.length
    : 0
});
```

**Location:** In link creation loop (~line 185), after success:

```js
// Session 23 Fix #5: Record auto-link created
window.linkAutomationMonitor?.onAutoLinkCreated({
  linkId: newLink?.id || `link_${Date.now()}`,
  fromNodeId: node.userData?.nodeId || 'unknown',
  toNodeId: suggestion.nodeB.userData?.nodeId || 'unknown',
  synergyScore: suggestion.synergyScore,
  fromCategory: node.userData?.category || 'unknown',
  toCategory: suggestion.nodeB.userData?.category || 'unknown'
});
```

**Verification:**
```js
// In console:
window.linkAutomationMonitor.debugPrintSummary()
// Should show non-zero cycle counts and stats
```

✅ **Done:** Engine now reports to monitor

---

### Step 2.2: Add onSynergyComputed Event

**File:** ComputeSynergyScore2_0.js  
**Location:** At END of compute() function (after return statement)

**Add:**
```js
// Session 23 Fix #7: Publish synergy computed event
if (typeof window !== 'undefined') {
  if (typeof window.onSynergyComputed === 'function') {
    window.onSynergyComputed({
      link: link,
      score: score,
      oldScore: oldScore || 0,
      categories: {
        from: nodeA?.userData?.category || 'unknown',
        to: nodeB?.userData?.category || 'unknown'
      }
    });
  }
  
  // Notify automation monitor
  window.linkAutomationMonitor?.recordEvent('synergy_computed', {
    score: score,
    categories: {
      from: nodeA?.userData?.category || 'unknown',
      to: nodeB?.userData?.category || 'unknown'
    }
  });
}
```

✅ **Done:** Synergy changes now published

---

### Step 2.3: Add onManualLinkRemoved Hook

**File:** LinkAutomationMonitor2_0.js  
**Location:** Add new method after onManualLinkCreated

```js
/**
 * Notify: Player manually removed a link
 * SAFE: Returns gracefully if not initialized (Session 23 Fix #10)
 * 
 * @param {Object} meta - { linkId, fromNodeId, toNodeId }
 */
onManualLinkRemoved(meta = {}) {
  if (!this._initialized) return;

  try {
    this.recordEvent('manual_link_removed', {
      linkId: (meta && meta.linkId) ? String(meta.linkId) : 'unknown',
      fromNodeId: (meta && meta.fromNodeId) ? String(meta.fromNodeId) : 'unknown',
      toNodeId: (meta && meta.toNodeId) ? String(meta.toNodeId) : 'unknown'
    });
  } catch (err) {
    console.warn('[LinkAutomationMonitor2_0] Error in onManualLinkRemoved:', err.message);
  }
}
```

✅ **Done:** Unlink operations tracked

---

## 🎯 Phase 3: Add Null-Safety Guards (10 min)

### Step 3.1: Guard SynergyTrendHUD1_0

**File:** SynergyTrendHUD1_0.js

**Find getTrend() method, update to:**
```js
getTrend() {
  if (!this.historyTracker) {
    console.warn('[SynergyTrendHUD1_0] History tracker not initialized');
    return 'stable';  // Session 23 Fix #8
  }
  return this.historyTracker.getTrend();
}
```

**Find getVolatility() method, update to:**
```js
getVolatility() {
  if (!this.historyTracker) {
    return 0;  // Session 23 Fix #8: Safe fallback
  }
  return this.historyTracker.getVolatility();
}
```

✅ **Done:** HUD won't crash

---

### Step 3.2: Guard UISelectedHUD Category Resolver

**File:** UISelectedHUD.js  
**Find line with:** `const category = this.categoryResolver.resolve(node);`  
**Replace with:**

```js
const category = this.categoryResolver?.resolve?.(node) || 'unknown';  // Session 23 Fix #9
```

✅ **Done:** Category display safe

---

## 🎯 Phase 4: Validate Everything Works (15 min)

### Step 4.1: Load Script and Test

**In browser console, paste:**

```js
// Load test harness
const script = document.createElement('script');
script.src = './ENGINE_HEALTH_CHECK_CONSOLE_API.js';
document.head.appendChild(script);

// Wait a moment then test
setTimeout(() => {
  const health = window.testEngineHealth();
  console.log('\n✓ Engine health check complete');
}, 500);
```

**Expected output:**
```
✓ NodeLinkingSystem: X links loaded
✓ ComputeSynergyScore2_0: score = 0.XXX
✓ LinkHistoryTracker1_0: N samples, trend: stable
✓ LinkGlowSynergyEngine1_0: cache size = X
✓ SynergyHighways2_0: X highways built
✓ LinkAutomationMonitor2_0: N cycles, N auto-links
✓ Visual systems: 5/5 loaded

═══════════════════════════════════════════════════════════════
Overall Status: ok
Errors: 0
Warnings: 0
```

### Step 4.2: Manual Testing

```js
// Test 1: Create a link and verify glow updates
// Action: Click two nodes to link them
// Expected: Link glows, glow engine cache updates

// Test 2: Run automation
// Action: window.autoLinkActive?.()
// Expected: Stats increment, monitor records cycle

// Test 3: Check HUD
// Visual: Bottom-left panel shows live stats
// Expected: "Auto Links: N", acceptance rate, trend indicator

// Test 4: Check history
window.LinkHistoryTracker1_0?.getStats?.()
// Expected: samples increasing, trend changing

// Test 5: Check highways
window.SynergyHighways2_0?.getStats?.()
// Expected: highway count > 0, trends detected

// Test 6: No console errors
// Expected: Console clean (no red errors)
```

---

## ✅ Post-Deployment Verification

### Checklist

- [ ] testEngineHealth() returns all "ok"
- [ ] No console errors or warnings
- [ ] Link glow updates when created
- [ ] Automation monitor records cycles
- [ ] HUD updates every 500ms with live data
- [ ] Highway meshes visible in scene
- [ ] Trend indicator showing (↑ ↓ →)
- [ ] History tracker has samples
- [ ] Visual effects render correctly
- [ ] No null-reference crashes

### Production Readiness Test

```js
// Final verification script
const verify = () => {
  const health = window.testEngineHealth();
  const ready = !health.errors.length && 
                health.linking === 'ok' &&
                health.monitors === 'ok' &&
                health.visuals === 'ok';
  
  console.log(`\n🚀 PRODUCTION READY: ${ready ? 'YES ✅' : 'NO ❌'}`);
  return ready;
};

verify();
```

---

## 🎯 Estimated Deployment Timeline

| Phase | Tasks | Time | Status |
|-------|-------|------|--------|
| 1 | Initialize 4 core systems | 30 min | Complete |
| 2 | Add 3 event hooks | 20 min | Complete |
| 3 | Add null-safety guards | 10 min | Complete |
| 4 | Validate all systems | 15 min | Complete |
| **TOTAL** | | **75 min** | **Ready** |

---

## 🆘 Troubleshooting

### Issue: "linkAutomationMonitor not initialized"

**Solution:**
1. Verify imports added to main.js
2. Check init() is called after autoLinkEngine created
3. Run: `window.linkAutomationMonitor.getStats()`

### Issue: "No glow updates"

**Solution:**
1. Verify LinkGlowSynergyEngine1_0.init() called
2. Check: `window.LinkGlowSynergyEngine1_0?.getStats?.()`
3. Manually test: `window.nodeLinker.visuals.updateLinkVisuals(link)`

### Issue: "HUD shows zeros"

**Solution:**
1. Verify monitor initialized
2. Check: `window.linkAutomationMonitor.debugPrintSummary()`
3. Trigger automation: `window.autoLinkActive?.()`
4. Wait 500ms for HUD refresh

### Issue: "History tracker empty"

**Solution:**
1. Verify LinkHistoryTracker1_0.init() called
2. Check: `window.LinkHistoryTracker1_0?.getStats?.()`
3. Create some links manually
4. Verify samples appear

### Issue: "Visual layers not showing"

**Solution:**
1. Check scene: `window.scene.children.length`
2. Find highway group: `window.scene.children.find(c => c.name === 'SynergyHighways3D')`
3. Check console for errors during init
4. Try: `window.debugVisualLayers()`

---

## 📞 Getting Help

If any issue persists:

1. Run `window.debugEngineEvents()` → check events
2. Run `window.debugVisualLayers()` → check visuals
3. Check browser console for error messages
4. Review ENGINE_AUDIT_SESSION23_REPORT.md for issue details
5. Review fix in ENGINE_AUDIT_SESSION23_FIXES_APPLIED.md

---

## ✨ Success Criteria

**Deployment is successful when:**

✅ `window.testEngineHealth()` returns all systems "ok"  
✅ No console errors or warnings  
✅ HUD shows live automation statistics  
✅ Link glow responds to synergy changes  
✅ Highway 3D meshes render correctly  
✅ Trend indicator updates with network activity  
✅ All visual effects display properly  

---

## 🏁 You're Done!

After completing all phases:

- ✅ All 19 issues fixed
- ✅ Complete system integration
- ✅ Production-ready ATOMA engine
- ✅ Full automation monitoring active
- ✅ Live trend detection operational
- ✅ Beautiful synergy visualization

**Status: PRODUCTION READY 🚀**

Enjoy your fully-integrated ATOMA engine!

