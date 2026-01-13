# LinkAutomationMonitor2_0 — Integration Guide

**Exact patches needed to wire monitoring into existing systems.**

---

## Overview

This guide shows **exactly where and how** to add monitoring hooks to existing code. All changes are minimal, non-breaking, and can be reverted without affecting core functionality.

---

## 1. main.js — Initialize Systems

**Location:** After all system initialization, around line 600–700.

```js
// ============================================================================
// LINK AUTOMATION MONITORING (Session 22)
// ============================================================================
import { LinkAutomationMonitor2_0 } from './LinkAutomationMonitor2_0.js';
import { LinkAutomationMonitorHUD2_0, setupAutomationMonitorHUD } from './LinkAutomationMonitorHUD2_0.js';

// ... later, after autoLinkEngine, linkHistoryTracker, etc. are created ...

// Initialize monitoring system
window.linkAutomationMonitor.init({
  LinkAutomationEngine1_0: autoLinkEngine,
  LinkHistoryTracker1_0: linkHistoryTracker,
  LinkRecommendationAI1_0: recommendationAI,
  ComputeSynergyScore2_0: computeSynergyScore,
  SynergyHighways2_0: synergyHighways
});

// Setup HUD (when UI is ready, e.g., after HUD resolver)
setTimeout(() => {
  setupAutomationMonitorHUD('#hud-monitor'); // Adjust selector as needed
}, 1000);

console.log('[MAIN] LinkAutomationMonitor2_0 initialized');
```

---

## 2. LinkAutomationEngine1_0.js — Record Events

### Patch 1: On Engine Toggle (in `enable()` / `disable()` / `toggle()`)

**Location:** Around lines 303–322

**Before:**
```js
enable() {
  this.enabled = true;
  console.log('[LinkAutomationEngine] ✓ Enabled');
}

disable() {
  this.enabled = false;
  console.log('[LinkAutomationEngine] ✓ Disabled');
}
```

**After:**
```js
enable() {
  this.enabled = true;
  window.linkAutomationMonitor?.onEngineToggled({ enabled: true, reason: 'enable()' });
  console.log('[LinkAutomationEngine] ✓ Enabled');
}

disable() {
  this.enabled = false;
  window.linkAutomationMonitor?.onEngineToggled({ enabled: false, reason: 'disable()' });
  console.log('[LinkAutomationEngine] ✓ Disabled');
}
```

### Patch 2: Cycle Start/End (in `autoLinkFor()` method)

**Location:** Around lines 98–210

**Before:**
```js
autoLinkFor(node) {
  if (!this.enabled && this.config.requireUserTrigger) { }
  if (!node) { /* ... */ }

  const startTime = performance.now();
  const result = {
    created: 0,
    skipped: 0,
    total: 0,
    reason: 'ok',
    links: []
  };

  // ... process links ...

  // Update statistics
  this.stats.totalAutoLinksCreated += result.created;
  this.stats.lastCycleCreated = result.created;
  // ...
  
  return result;
}
```

**After:**
```js
autoLinkFor(node) {
  if (!this.enabled && this.config.requireUserTrigger) { }
  if (!node) { /* ... */ }

  const startTime = performance.now();
  const cycleIndex = this.stats.totalCycles;
  
  // MONITOR: Cycle started
  window.linkAutomationMonitor?.onCycleStart({ cycleIndex, startedAt: Date.now() });

  const result = {
    created: 0,
    skipped: 0,
    total: 0,
    reason: 'ok',
    links: []
  };

  // ... process links ...

  // Update statistics
  this.stats.totalAutoLinksCreated += result.created;
  this.stats.lastCycleCreated = result.created;
  const durationMs = performance.now() - startTime;
  
  // MONITOR: Cycle ended
  window.linkAutomationMonitor?.onCycleEnd({
    cycleIndex,
    startedAt: startTime,
    durationMs: Math.round(durationMs),
    recommendations: result.total,
    created: result.created,
    rejected: result.skipped,
    avgSynergyEval: this._calculateAvgSynergyEvaluated(result),
    avgSynergyCreated: this._calculateAvgSynergyCreated(result)
  });

  // ... existing stats ...
  
  return result;
}

// Helper (add to class)
_calculateAvgSynergyEvaluated(result) {
  // Return average synergy of all recommendations in this cycle
  // If not available, return 0
  return result.avgSynergyEval || 0;
}

_calculateAvgSynergyCreated(result) {
  // Return average synergy of created links in this cycle
  if (result.links.length === 0) return 0;
  const total = result.links.reduce((sum, link) => sum + (link.synergyScore || 0), 0);
  return total / result.links.length;
}
```

### Patch 3: Link Created Event (in `autoLinkFor()` loop)

**Location:** Around lines 173–188

**Before:**
```js
// Attempt to create the link
try {
  this.nodeLinker.createLink(node, suggestion.nodeB);
  result.created++;
  result.links.push({
    sourceCategory: node.userData?.category || 'unknown',
    targetCategory: suggestion.nodeB.userData?.category || 'unknown',
    synergyScore: suggestion.synergyScore
  });
  
  // Trigger callbacks for UI feedback
  this._triggerOnAutoLinkCreated(node, suggestion.nodeB, suggestion.synergyScore);
} catch (err) {
  console.warn(`[LinkAutomationEngine] Failed to create link: ${err.message}`);
  result.skipped++;
}
```

**After:**
```js
// Attempt to create the link
try {
  const newLink = this.nodeLinker.createLink(node, suggestion.nodeB);
  result.created++;
  
  const linkData = {
    sourceCategory: node.userData?.category || 'unknown',
    targetCategory: suggestion.nodeB.userData?.category || 'unknown',
    synergyScore: suggestion.synergyScore
  };
  result.links.push(linkData);
  
  // Trigger callbacks for UI feedback
  this._triggerOnAutoLinkCreated(node, suggestion.nodeB, suggestion.synergyScore);
  
  // MONITOR: Record auto-link creation
  window.linkAutomationMonitor?.onAutoLinkCreated({
    linkId: newLink?.id || `link_${Date.now()}`,
    fromNodeId: node.userData?.nodeId || 'unknown',
    toNodeId: suggestion.nodeB.userData?.nodeId || 'unknown',
    synergyScore: suggestion.synergyScore,
    fromCategory: linkData.sourceCategory,
    toCategory: linkData.targetCategory
  });
  
} catch (err) {
  console.warn(`[LinkAutomationEngine] Failed to create link: ${err.message}`);
  result.skipped++;
  
  // MONITOR: Record rejection/error
  window.linkAutomationMonitor?.onAutoLinkRejected({
    reason: 'error',
    synergyScore: suggestion.synergyScore || 0,
    fromCategory: node.userData?.category || 'unknown',
    toCategory: suggestion.nodeB?.userData?.category || 'unknown'
  });
}
```

### Patch 4: Config Changes (optional, if config is mutable)

**Location:** In any method that changes config (if applicable)

```js
// When quality threshold changes
setQualityThreshold(value) {
  this.config.automationThreshold = value;
  window.linkAutomationMonitor?.onConfigChanged({
    threshold: value,
    cooldown: this.config.safetyCooldownMs
  });
}

// When cooldown changes
setSafetyCooldown(ms) {
  this.config.safetyCooldownMs = ms;
  window.linkAutomationMonitor?.onConfigChanged({
    threshold: this.config.automationThreshold,
    cooldown: ms
  });
}
```

---

## 3. NodeLinkingSystem.js — Manual Link Creation

**Location:** In `createLink()` or wherever manual links are created

**Before:**
```js
createLink(nodeA, nodeB) {
  // ... validation and link creation logic ...
  const link = new LinkData(nodeA, nodeB);
  this.links.push(link);
  // ... emit events ...
  return link;
}
```

**After:**
```js
createLink(nodeA, nodeB, isAutomatic = false) {
  // ... validation and link creation logic ...
  const link = new LinkData(nodeA, nodeB);
  this.links.push(link);
  
  // MONITOR: Record manual link creation (if not from automation)
  if (!isAutomatic && window.linkAutomationMonitor) {
    const synergyScore = computeSynergyScore(nodeA, nodeB); // Use existing scorer
    window.linkAutomationMonitor.onManualLinkCreated({
      fromNodeId: nodeA.userData?.nodeId || 'unknown',
      toNodeId: nodeB.userData?.nodeId || 'unknown',
      synergyScore: synergyScore
    });
  }
  
  // ... emit events ...
  return link;
}
```

**Note:** When LinkAutomationEngine calls `createLink()`, pass `isAutomatic: true` to avoid double-recording.

---

## 4. LinkRecommendationAI1_0.js — Batch Scoring (Optional)

**Location:** When recommendations are evaluated

```js
// In whatever method generates/scores recommendations
_scoreBatch(recommendations) {
  const results = recommendations.map(rec => ({
    nodeB: rec.node,
    synergyScore: computeSynergyScore(this.targetNode, rec.node),
    reasons: rec.reasons
  }));
  
  // MONITOR: Record batch scoring
  if (results.length > 0) {
    const avgScore = results.reduce((sum, r) => sum + r.synergyScore, 0) / results.length;
    const maxScore = Math.max(...results.map(r => r.synergyScore));
    window.linkAutomationMonitor?.onRecommendationEvaluated({
      size: results.length,
      avgScore: avgScore,
      maxScore: maxScore
    });
  }
  
  return results;
}
```

---

## 5. SafeWorldReset — Cleanup on Transitions

**Location:** In your world reset handler (e.g., `SafeWorldResetFix1_0.js`)

```js
// Add to existing reset logic
onWorldReset() {
  // ... existing reset code ...
  
  // MONITOR: Clear history for new world (keep session stats)
  window.linkAutomationMonitor?.onWorldReset();
  
  // ... rest of cleanup ...
}
```

---

## Integration Checklist

- [ ] Import LinkAutomationMonitor2_0 in main.js
- [ ] Call `window.linkAutomationMonitor.init()` with all system references
- [ ] Import LinkAutomationMonitorHUD2_0 in main.js
- [ ] Call `setupAutomationMonitorHUD()` once UI is ready
- [ ] Add `onEngineToggled()` calls to enable/disable methods
- [ ] Add `onCycleStart()` and `onCycleEnd()` to autoLinkFor() 
- [ ] Add `onAutoLinkCreated()` to successful link creation
- [ ] Add `onAutoLinkRejected()` to rejected suggestions (optional)
- [ ] Add `onManualLinkCreated()` to NodeLinkingSystem.createLink()
- [ ] Test with console: `window.linkAutomationMonitor.debugPrintSummary()`
- [ ] Verify HUD updates every 500ms
- [ ] Test world reset clears event history

---

## Testing the Integration

```js
// Quick verification in console:

// 1. Check initialization
window.linkAutomationMonitor.getStats()

// 2. Trigger automation
window.autoLinkActive?.()

// 3. Check event recording
window.linkAutomationMonitor.debugPrintSummary()

// 4. View HUD
window.automationMonitorHUD

// 5. Check recent events
window.linkAutomationMonitor.getRecentEvents(5)
```

---

## Troubleshooting

**Q: HUD shows no data**
- A: Check that `init()` was called with engine reference
- A: Verify `setupAutomationMonitorHUD()` was called with correct selector

**Q: Stats not incrementing**
- A: Confirm `onCycleEnd()` is being called from engine
- A: Check browser console for errors

**Q: HUD position wrong**
- A: Adjust CSS in LinkAutomationMonitorHUD2_0 or container selector

