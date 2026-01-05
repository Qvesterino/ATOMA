# Setup LinkAutomationMonitor2_0 — Step-by-Step Checklist

**Copy this checklist and follow each step to integrate the monitoring system.**

---

## ✅ Pre-Integration (Verify Files Exist)

- [ ] `/LinkAutomationMonitor2_0.js` exists (650 lines)
- [ ] `/LinkAutomationMonitorHUD2_0.js` exists (350 lines)
- [ ] `/LINK_AUTOMATION_MONITOR_QUICKREF.md` exists
- [ ] `/LINK_AUTOMATION_MONITOR_INTEGRATION.md` exists

**Location:** All files should be in project root directory

---

## ✅ Step 1: Update main.js (5 minutes)

### 1.1 Add Imports (Find the synergy section, ~line 86-100)

```js
// ============================================================================
// LINK AUTOMATION MONITORING 2.0 (Session 22)
// ============================================================================
import { LinkAutomationMonitor2_0 } from './LinkAutomationMonitor2_0.js';
import { LinkAutomationMonitorHUD2_0, setupAutomationMonitorHUD } from './LinkAutomationMonitorHUD2_0.js';
```

**Location:** After existing `import { LinkAutomationEngine1_0 }` line

- [ ] Imports added

### 1.2 Initialize Monitor (Find where systems are created, ~line 600-700)

```js
// Initialize monitoring system
window.linkAutomationMonitor.init({
  LinkAutomationEngine1_0: autoLinkEngine,
  LinkHistoryTracker1_0: linkHistoryTracker,
  LinkRecommendationAI1_0: recommendationAI,
  ComputeSynergyScore2_0: computeSynergyScore,
  SynergyHighways2_0: synergyHighways
});

console.log('[MAIN] LinkAutomationMonitor2_0 initialized');
```

**Location:** After `autoLinkEngine`, `linkHistoryTracker`, etc. are created

- [ ] Monitor initialized

### 1.3 Setup HUD (Find where UI is ready, ~line 750+)

```js
// Setup automation monitor HUD (after HUD resolver or UI ready)
setTimeout(() => {
  setupAutomationMonitorHUD('#hud-monitor');
}, 1000);
```

**Location:** Once UI container is ready (adjust selector to match your HUD container)

- [ ] HUD setup call added

---

## ✅ Step 2: Patch LinkAutomationEngine1_0.js (5-10 minutes)

### 2.1 Add Engine Toggle Events

**Location:** In `enable()` method (~line 303)

```js
enable() {
  this.enabled = true;
  window.linkAutomationMonitor?.onEngineToggled({ enabled: true, reason: 'enable()' });
  console.log('[LinkAutomationEngine] ✓ Enabled');
}
```

**Location:** In `disable()` method (~line 311)

```js
disable() {
  this.enabled = false;
  window.linkAutomationMonitor?.onEngineToggled({ enabled: false, reason: 'disable()' });
  console.log('[LinkAutomationEngine] ✓ Disabled');
}
```

- [ ] Engine toggle hooks added

### 2.2 Add Cycle Start/End Events

**Location:** In `autoLinkFor()` method (~line 98)

**Before:**
```js
autoLinkFor(node) {
  // ... validation ...
  const startTime = performance.now();
  const result = { ... };
```

**After:**
```js
autoLinkFor(node) {
  // ... validation ...
  const startTime = performance.now();
  const cycleIndex = this.stats.totalCycles;
  
  // MONITOR: Cycle started
  window.linkAutomationMonitor?.onCycleStart({ cycleIndex, startedAt: Date.now() });
  
  const result = { ... };
```

- [ ] Cycle start hook added

**Location:** Before `return result;` (~line 209)

**Add:**
```js
  // MONITOR: Cycle ended
  window.linkAutomationMonitor?.onCycleEnd({
    cycleIndex,
    startedAt: startTime,
    durationMs: Math.round(performance.now() - startTime),
    recommendations: result.total,
    created: result.created,
    rejected: result.skipped,
    avgSynergyEval: 0, // or calculate if available
    avgSynergyCreated: 0  // or calculate if available
  });
```

- [ ] Cycle end hook added

### 2.3 Add Auto-Link Created Event

**Location:** In the link creation loop (~line 175)

**Before:**
```js
try {
  this.nodeLinker.createLink(node, suggestion.nodeB);
  result.created++;
  result.links.push({ ... });
  this._triggerOnAutoLinkCreated(node, suggestion.nodeB, suggestion.synergyScore);
} catch (err) { ... }
```

**After:**
```js
try {
  const newLink = this.nodeLinker.createLink(node, suggestion.nodeB);
  result.created++;
  result.links.push({ ... });
  this._triggerOnAutoLinkCreated(node, suggestion.nodeB, suggestion.synergyScore);
  
  // MONITOR: Record auto-link creation
  window.linkAutomationMonitor?.onAutoLinkCreated({
    linkId: newLink?.id || `link_${Date.now()}`,
    fromNodeId: node.userData?.nodeId || 'unknown',
    toNodeId: suggestion.nodeB.userData?.nodeId || 'unknown',
    synergyScore: suggestion.synergyScore,
    fromCategory: node.userData?.category || 'unknown',
    toCategory: suggestion.nodeB.userData?.category || 'unknown'
  });
  
} catch (err) { ... }
```

- [ ] Auto-link created hook added

---

## ✅ Step 3: Patch NodeLinkingSystem.js (2 minutes)

### 3.1 Add Manual Link Created Event

**Location:** In `createLink()` method (~line 300-400, depends on your code)

**Find:**
```js
createLink(nodeA, nodeB) {
  // ... validation ...
  // ... link creation ...
  return link;
}
```

**Update signature and add monitor call:**
```js
createLink(nodeA, nodeB, isAutomatic = false) {
  // ... validation ...
  const link = new LinkData(nodeA, nodeB);
  // ... rest of creation ...
  
  // MONITOR: Record manual link creation (if not from automation)
  if (!isAutomatic && window.linkAutomationMonitor) {
    // Optional: compute synergy if not available
    const synergyScore = 0.5; // or use your synergy computation
    window.linkAutomationMonitor.onManualLinkCreated({
      fromNodeId: nodeA.userData?.nodeId || 'unknown',
      toNodeId: nodeB.userData?.nodeId || 'unknown',
      synergyScore: synergyScore
    });
  }
  
  return link;
}
```

**Update LinkAutomationEngine call:**

Change:
```js
this.nodeLinker.createLink(node, suggestion.nodeB);
```

To:
```js
this.nodeLinker.createLink(node, suggestion.nodeB, true); // true = automatic
```

- [ ] Manual link created hook added
- [ ] Automation engine passes `isAutomatic: true`

---

## ✅ Step 4: Optional - Patch LinkRecommendationAI1_0.js (2 minutes)

### 4.1 Add Batch Scoring Event (Optional)

**Location:** After scoring recommendations

**Add:**
```js
// MONITOR: Record batch scoring
if (results && results.length > 0) {
  const avgScore = results.reduce((sum, r) => sum + (r.synergyScore || 0), 0) / results.length;
  const maxScore = Math.max(...results.map(r => r.synergyScore || 0));
  window.linkAutomationMonitor?.onRecommendationEvaluated({
    size: results.length,
    avgScore: avgScore,
    maxScore: maxScore
  });
}
```

- [ ] Batch scoring hook added (optional)

---

## ✅ Step 5: Patch SafeWorldReset (1 minute)

### 5.1 Add World Reset Cleanup

**Location:** In world reset function (~wherever `SafeWorldResetFix1_0` or similar is)

**Add:**
```js
// Clear monitor history for new world
window.linkAutomationMonitor?.onWorldReset();
```

**Location:** At the end of reset function, before or after other cleanup

- [ ] World reset hook added

---

## ✅ Step 6: Test & Verify (5 minutes)

### 6.1 Verify Attachment

**In browser console, run:**
```js
window.linkAutomationMonitor
```

**Expected:** Shows object with methods like `init`, `getStats`, `debugPrintSummary`, etc.

- [ ] Monitor is attached to window

### 6.2 Test Initialization

**In console:**
```js
window.linkAutomationMonitor.getStats()
```

**Expected:** Returns object with `initialized: true`

- [ ] Stats are accessible

### 6.3 Test HUD

**In console:**
```js
window.automationMonitorHUD
```

**Expected:** Shows HUD instance with methods like `start`, `stop`, `refresh`

- [ ] HUD is available

### 6.4 Check HUD Visibility

**In page:**
- Look for neon cyan box in bottom-left corner
- Should have title "⚙️ AUTOMATION MONITOR"
- Should show 4 sections: Top Recommendations, Engine Status, Statistics, Trend

- [ ] HUD visible in bottom-left

### 6.5 Test Debug Commands

**In console:**
```js
window.linkAutomationMonitor.debugPrintSummary()
```

**Expected:** Prints formatted box with metrics

- [ ] Debug commands work

### 6.6 Trigger Automation

**In game or console:**
```js
window.autoLinkActive?.()
```

**Watch console:**
- Should see `[LinkAutomationMonitor2_0] ✓ Cycle started/ended`
- HUD stats should update
- No errors should appear

- [ ] Automation triggers monitoring

---

## ✅ Step 7: Final Verification

### 7.1 Check Stats Increment

After running automation, verify in console:
```js
const stats = window.linkAutomationMonitor.getStats()
console.table({
  totalCycles: stats.totalCycles,
  totalAutoLinksCreated: stats.totalAutoLinksCreated,
  acceptanceRate: stats.acceptanceRate + '%',
  trend: stats.trend,
  volatility: stats.volatility
})
```

**Expected:** Numbers incrementing, trend showing, no errors

- [ ] Stats incrementing correctly

### 7.2 Check for Console Errors

- [ ] No `[LinkAutomationMonitor2_0]` errors in console
- [ ] No undefined reference errors
- [ ] No "Cannot read property of null" errors

### 7.3 Run All Debug Commands

```js
window.linkAutomationMonitor.debugPrintSummary()
window.linkAutomationMonitor.debugPrintCycles()
window.linkAutomationMonitor.debugPrintEvents()
```

- [ ] All debug commands work
- [ ] Output is meaningful

### 7.4 Check HUD Updates

- [ ] HUD refreshes every ~500ms
- [ ] Stats numbers update
- [ ] Top Recommendations section shows current best link
- [ ] Trend indicator shows (↑ ↓ →)

- [ ] HUD fully functional

---

## 🎯 Integration Complete!

### Summary of Changes

| File | Changes | LOC |
|------|---------|-----|
| main.js | Add imports, init, HUD setup | 15 |
| LinkAutomationEngine1_0.js | Add 4 hook calls | 30 |
| NodeLinkingSystem.js | Add 1 hook call | 5 |
| LinkRecommendationAI1_0.js | Add 1 hook call (optional) | 5 |
| SafeWorldReset | Add 1 hook call | 1 |
| **TOTAL** | | **56** |

---

## 📞 Troubleshooting

**Q: HUD not showing?**
- Check: `window.automationMonitorHUD` exists
- Check: `#hud-monitor` selector matches your UI container
- Try: `window.automationMonitorHUD.refresh()`

**Q: Stats stuck at 0?**
- Check: `window.linkAutomationMonitor.getStats().initialized` is true
- Check: Automation engine is calling `onCycleEnd()`
- Check: Console for errors starting with `[LinkAutomationMonitor2_0]`

**Q: Errors in console?**
- Check: All imports are correct
- Check: File paths match your project structure
- Read: Error message and check INTEGRATION.md

**Q: HUD position wrong?**
- Edit: LinkAutomationMonitorHUD2_0.js CSS (search for "max-width: 350px")
- Or: Adjust `#hud-monitor` selector in main.js

---

## ✅ Completion Checklist

When all items below are checked, integration is complete:

- [ ] Files exist in project
- [ ] main.js imports added
- [ ] Monitor initialized
- [ ] HUD setup called
- [ ] LinkAutomationEngine1_0 hooks added
- [ ] NodeLinkingSystem hook added
- [ ] SafeWorldReset hook added
- [ ] Console: `window.linkAutomationMonitor` returns object
- [ ] Console: `window.linkAutomationMonitor.getStats()` returns stats
- [ ] Console: `window.automationMonitorHUD` exists
- [ ] HUD visible in bottom-left corner
- [ ] HUD shows "⚙️ AUTOMATION MONITOR"
- [ ] HUD has 4 sections
- [ ] Debug commands work
- [ ] Automation triggers monitoring
- [ ] Stats increment after automation
- [ ] No console errors
- [ ] HUD updates every ~500ms
- [ ] Trend/volatility show after 5+ cycles
- [ ] All verification tests pass

**Total checks: 21** — When all 21 are checked ✓, deployment is complete!

---

## 🚀 Success!

When all items are checked, your LinkAutomationMonitor2_0 system is:

✅ Fully integrated
✅ Actively monitoring automation
✅ Displaying live metrics in HUD
✅ Ready for gameplay

Enjoy your new automation observability system!

