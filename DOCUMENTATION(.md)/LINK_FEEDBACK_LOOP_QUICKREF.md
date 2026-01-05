# Link Quality Feedback Loop — Quick Reference

## 5-Minute Setup

### 1. Import the Modules

```javascript
import LinkQualityFeedbackLoop1_0 from './LinkQualityFeedbackLoop1_0.js';
import UserAcceptanceTracker1_0 from './UserAcceptanceTracker1_0.js';
import LinkFeedbackHUD1_0 from './LinkFeedbackHUD1_0.js';
```

### 2. Initialize in main.js

```javascript
// After all systems are created (NodeLinkingSystem, ComputeSynergyScore2_0, etc.)

LinkQualityFeedbackLoop1_0.init({
  LinkHistoryTracker1_0: window.linkHistoryTracker,
  ComputeSynergyScore2_0: window.ComputeSynergyScore2_0,
  LinkMLRecommendationEngine1_0: window.LinkMLRecommendationEngine1_0,
  UserAcceptanceTracker1_0: UserAcceptanceTracker1_0,
  NodeLinkingSystem: window.nodeLinker,
  LinkAutomationEngine1_0: window.linkAutomationEngine,
  SynergyHighways2_0: window.SynergyHighways2_0,
});

UserAcceptanceTracker1_0.init({
  LinkQualityFeedbackLoop1_0,
  LinkAutomationEngine1_0: window.linkAutomationEngine,
  NodeLinkingSystem: window.nodeLinker,
});

LinkFeedbackHUD1_0.init({
  LinkQualityFeedbackLoop1_0,
  UserAcceptanceTracker1_0,
  LinkMLRecommendationEngine1_0: window.LinkMLRecommendationEngine1_0,
  containerElement: document.body,
});

LinkFeedbackHUD1_0.start();

// Periodic flush
setInterval(() => {
  LinkQualityFeedbackLoop1_0.flushPending();
}, 5000);
```

### 3. Add Hooks to NodeLinkingSystem.js

**After link creation:**
```javascript
try {
  window.LinkQualityFeedbackLoop1_0?.onLinkCreated?.({
    linkId: link.id,
    sourceNodeId: sourceNode?.id,
    targetNodeId: targetNode?.id,
    categories: [sourceNode?.category, targetNode?.category].filter(Boolean),
    createdByAutomation: false,
    createdManually: true,
  });
  window.UserAcceptanceTracker1_0?.recordManualLinkCreated?.(link.id, {
    categories: [sourceNode?.category, targetNode?.category].filter(Boolean),
  });
} catch (e) {}
```

**After link deletion:**
```javascript
try {
  window.LinkQualityFeedbackLoop1_0?.onLinkRemoved?.({
    linkId: link.id,
    removedByPlayer: true,
    autoRemoved: false,
  });
  window.UserAcceptanceTracker1_0?.recordManualLinkRemoved?.(link.id, {
    reason: 'player_delete',
  });
} catch (e) {}
```

### 4. Add Hooks to LinkAutomationEngine1_0.js

**After automation creates link:**
```javascript
try {
  window.LinkQualityFeedbackLoop1_0?.registerPrediction?.(createdLink.id, {
    quality: recommendation.predictedQuality,
    preset: recommendation.preset || 'balanced',
  });
  window.LinkQualityFeedbackLoop1_0?.onLinkCreated?.({
    linkId: createdLink.id,
    sourceNodeId: sourceNode?.id,
    targetNodeId: targetNode?.id,
    categories: [sourceNode?.category, targetNode?.category].filter(Boolean),
    createdByAutomation: true,
    createdManually: false,
  });
  window.UserAcceptanceTracker1_0?.recordAutomationLinkCreated?.(createdLink.id, {
    predictedQuality: recommendation.predictedQuality,
    categories: [sourceNode?.category, targetNode?.category].filter(Boolean),
    preset: recommendation.preset,
  });
} catch (e) {}
```

---

## Console API

### Feedback Loop

```javascript
window.testLinkFeedbackLoop()      // Full system test
window.flushFeedback()              // Process pending records
window.getFeedbackStats()           // Get all statistics
window.debugFeedback(count)         // Print last N records
```

### User Acceptance

```javascript
window.getAcceptanceStats()         // Global acceptance rate
window.getAcceptancePerCategory()   // Per-category breakdown
window.debugAcceptance()            // Verbose dump
```

### ML Learning

```javascript
// Check learning state
window.LinkMLRecommendationEngine1_0?.getLearningState()

// Reset weights to defaults
window.LinkMLRecommendationEngine1_0?.resetLearningState()
```

### HUD Control

```javascript
window.feedbackHUD.start()          // Start refresh
window.feedbackHUD.stop()           // Stop refresh
window.feedbackHUD.refresh()        // Manual refresh
```

---

## Key Concepts

### Feedback Record

Every link generates one feedback record when removed:

```javascript
{
  linkId: 'link-123',
  sourceNodeId: 'node-1',
  targetNodeId: 'node-2',
  categories: ['input', 'process'],
  predictedQuality: 0.78,           // From ML engine, if available
  synergyAtCreation: 0.82,
  synergyAfterDelay: 0.75,
  averageLifetimeSynergy: 0.79,
  createdByAutomation: true,
  createdManually: false,
  removedByPlayer: false,
  autoRemoved: false,
  lifetimeMs: 45000,
  outcomeScore: 0.62,               // -1.0 to +1.0
  timestamp: 1699564800000,
  tags: { highway: true, unstable: false, shortLived: false, ... }
}
```

### Outcome Score

Range: **-1.0 to +1.0**

- **+1.0 to +0.7** — Excellent: Long-lived, high synergy, stable
- **+0.7 to +0.3** — Good: Survived well, decent synergy
- **+0.3 to -0.3** — Neutral: Acceptable but mixed signals
- **-0.3 to -0.7** — Poor: Quickly deleted or unstable
- **-0.7 to -1.0** — Failed: Strongly rejected by player

### Acceptance Rate

**Percentage of automation-created links that player keeps**

- High (>80%) — ML predictions are good, user trusts automation
- Medium (50-80%) — Balanced acceptance, some misses
- Low (<50%) — ML predictions miss the mark, needs tuning

---

## What Gets Tracked

### Link Lifecycle

- ✅ Manual link creation by player
- ✅ Automation link creation by ML engine
- ✅ Link removal by player
- ✅ Link removal by automation
- ✅ Synergy evolution over time

### Metrics

- ✅ Global acceptance rate
- ✅ Per-category acceptance breakdown
- ✅ Average outcome score
- ✅ Outcome distribution (excellent/good/neutral/poor/failed)
- ✅ ML prediction accuracy

### ML Learning

- ✅ Feedback-driven weight adaptation
- ✅ Feature importance learning
- ✅ Per-preset learning state
- ✅ Weight clamping to prevent collapse

---

## Configuration

### LinkQualityFeedbackLoop1_0

```javascript
LinkQualityFeedbackLoop1_0.init({
  maxFeedbackRecords: 1000,         // Ring buffer size
  queryDelayMs: 30000,              // Wait 30s for outcome measurement
  flushIntervalMs: 5000,            // Process every 5s
  enableLogging: false,             // Verbose console output
});
```

### UserAcceptanceTracker1_0

```javascript
UserAcceptanceTracker1_0.init({
  maxRecords: 500,                  // Ring buffer size
  enableLogging: false,
});
```

### LinkFeedbackHUD1_0

```javascript
LinkFeedbackHUD1_0.init({
  updateIntervalMs: 1000,           // Refresh every 1s
  maxEventLog: 5,                   // Show last 5 events
  position: 'bottom-right',         // Or 'bottom-left'
  opacity: 0.92,
  enabled: true,
});
```

---

## Enabling/Disabling Learning

### Enable ML Learning (Default)

```javascript
LinkMLRecommendationEngine1_0._learningState.enabled = true
```

### Disable ML Learning

```javascript
LinkMLRecommendationEngine1_0._learningState.enabled = false
```

### Adjust Learning Rate

```javascript
LinkMLRecommendationEngine1_0._learningState.learningRate = 0.1  // More aggressive
LinkMLRecommendationEngine1_0._learningState.learningRate = 0.01 // More conservative
```

---

## Example Workflow

1. **Setup:** Run initialization in main.js
2. **Gameplay:** Player creates and deletes links normally
3. **Automation:** ML engine creates links based on recommendations
4. **Feedback:** When automation links are deleted, system records outcome
5. **Learning:** ML weights adjust based on success/failure patterns
6. **HUD:** Real-time metrics display in corner
7. **Tuning:** Monitor acceptance rate, adjust if needed

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| HUD doesn't show | Check containerElement passed to init() |
| Stats are all 0 | Wait 30s+ for first feedback records to finalize |
| ML not learning | Check _learningState.enabled = true |
| No acceptance rate | Create automation links first (manual links ignored) |
| Performance lag | Reduce updateIntervalMs, disable logging |

---

## File Reference

- **LinkQualityFeedbackLoop1_0.js** — Core feedback collection
- **UserAcceptanceTracker1_0.js** — Acceptance metrics
- **LinkFeedbackHUD1_0.js** — Metrics display
- **LinkMLRecommendationEngine1_0.js** — Extended with learning
- **LINK_FEEDBACK_LOOP_INTEGRATION.md** — Full integration guide
- **LINK_FEEDBACK_LOOP_IMPLEMENTATION.md** — Technical details

---

**Status:** ✅ Ready to deploy. All systems safe, backward-compatible, zero breaking changes.
