# LINK ML RECOMMENDATION ENGINE 1.0 — INTEGRATION GUIDE

**Status:** Production Ready (v1.0)  
**Module:** LinkMLRecommendationEngine1_0.js  
**Lines of Code:** 900+  
**Performance Target:** <2ms per cycle  
**Integration Time:** 1 hour

---

## Overview

The **LinkMLRecommendationEngine1_0** provides ML-inspired link quality prediction using feature engineering over all existing ATOMA telemetry systems (LinkHistoryTracker1_0, ComputeSynergyScore2_0, SynergyHighways2_0, NodeLinkingSystem).

Generates high-confidence link recommendations without external ML libraries — pure JavaScript with weighted feature scoring and logistic transformation.

---

## Part 1: Initialization

### 1.1 Import & Setup

In **main.js** (after existing synergy imports):

```javascript
import LinkMLRecommendationEngine1_0 from './LinkMLRecommendationEngine1_0.js';

// After LinkAutomationMonitor2_0 and other systems are initialized:

LinkMLRecommendationEngine1_0.init({
  LinkHistoryTracker1_0: window.LinkHistoryTracker1_0,
  ComputeSynergyScore2_0: window.ComputeSynergyScore2_0,
  SynergyHighways2_0: window.SynergyHighways2_0,
  NodeLinkingSystem: window.nodeLinkingSystem,
  AINodes: window.aiNodes,
  LinkAutomationMonitor2_0: window.linkAutomationMonitor,
});

console.log('✅ ML Recommendation Engine ready');
```

### 1.2 Timing

Initialize **after all these systems are ready:**
- NodeLinkingSystem (has existing links)
- AINodes (has node data)
- ComputeSynergyScore2_0 (scoring available)
- LinkHistoryTracker1_0 (historical data available)
- SynergyHighways2_0 (highway routes available)

**Recommended location in main.js:** After line where LinkAutomationMonitor2_0 initializes (around line 500).

---

## Part 2: Integration with LinkAutomationEngine1_0

### 2.1 Feed Auto-Link Candidates

In **LinkAutomationEngine1_0.js**, modify the `run()` method (~line 250):

**Before (existing code):**
```javascript
run(cycle) {
  // ... existing code ...
  
  // Random candidate generation (old approach)
  const candidates = this._generateRandomCandidates(maxLinks);
  
  for (const candidate of candidates) {
    // Process candidate
  }
}
```

**After (with ML engine):**
```javascript
run(cycle) {
  // ... existing code ...
  
  // Use ML engine for high-quality candidates
  const mlRecs = window.LinkMLRecommendationEngine1_0?.getAutoLinkBatch?.(maxLinks);
  const candidates = mlRecs?.length > 0
    ? mlRecs.map(rec => ({
        sourceNode: this.nodeSystem.getNodeById(rec.sourceNodeId),
        targetNode: this.nodeSystem.getNodeById(rec.targetNodeId),
        quality: rec.quality,
      }))
    : this._generateRandomCandidates(maxLinks); // Fallback
  
  for (const candidate of candidates) {
    // Process candidate
  }
}
```

### 2.2 Record Link Outcomes

When a link is successfully created or removed, notify the ML engine for continuous learning:

**In LinkAutomationEngine1_0.js** (or LinkAutomationMonitor2_0.js):

```javascript
// After successful auto-link creation
window.LinkMLRecommendationEngine1_0?.recordLinkSuccess?.({
  sourceId: link.sourceNode.id,
  targetId: link.targetNode.id,
  quality: link.quality,
  synergyScore: synergyScore,
});

// Note: This data is already captured by LinkHistoryTracker1_0,
// so explicit recording is optional but recommended for context.
```

---

## Part 3: Integration with NodeLinkingSystem

### 3.1 Record Outcomes

In **NodeLinkingSystem.js**, after link events:

**After `linkNodes()` succeeds (~line 300):**
```javascript
this.links.push(link);

// Optional: Notify ML engine of new link
window.LinkMLRecommendationEngine1_0?.recordLinkCreated?.({
  linkId: link.id,
  sourceId: link.sourceNode.id,
  targetId: link.targetNode.id,
  quality: link.quality,
});
```

**After `unlinkNodes()` (~line 380):**
```javascript
this.links.splice(linkIndex, 1);

// Optional: Notify ML engine of link removal
window.LinkMLRecommendationEngine1_0?.recordLinkRemoved?.({
  linkId: link.id,
  sourceId: link.sourceNode.id,
  targetId: link.targetNode.id,
});
```

---

## Part 4: Console API Reference

### Quick Commands

```javascript
// Get top 10 recommendations globally
window.testMLRecommendations()

// Get recommendations for a specific node
window.testMLRecommendationsFor('node-123')

// Switch weight preset
window.tuneMLWeights('balanced')             // 'balanced', 'history_heavy', 'structure_first'

// Print statistics
window.printMLStats()

// Get debug information
window.getMLDebugInfo()
```

### Programmatic API

```javascript
// Get top N recommendations
const recs = LinkMLRecommendationEngine1_0.getTopRecommendations(10);
// Returns: [{fromNodeId, toNodeId, predictedQuality, reasons, ...}, ...]

// Get recommendations for a node
const nodeRecs = LinkMLRecommendationEngine1_0.getRecommendationsForNode('node-1', 5);

// Get high-quality auto-link batch
const autoLinks = LinkMLRecommendationEngine1_0.getAutoLinkBatch(5);
// Returns: [{sourceNodeId, targetNodeId, quality, ...}, ...]

// Get statistics
const stats = LinkMLRecommendationEngine1_0.getStats();

// Switch weight preset
LinkMLRecommendationEngine1_0.setWeightPreset('history_heavy');

// Set custom weights
LinkMLRecommendationEngine1_0.setCustomWeights({
  synergyWeight: 0.4,
  historyWeight: 0.3,
  // ... other weights
});

// Get current weights
const weights = LinkMLRecommendationEngine1_0.getCurrentWeights();
```

---

## Part 5: Feature Vector Explanation

Each recommendation includes a raw feature vector for debugging:

```javascript
const rec = recommendations[0];

rec.features = {
  categoryPair: 'input,process',
  categoryBonus: 0.9,
  synergy: 0.78,
  historyScore: 0.65,
  historicalVolatility: 0.8,              // 1.0 = stable
  historicalTrend: 'rising',              // 'rising' | 'stable' | 'falling'
  distance: 0.25,                         // Normalized 0–1
  distanceDecay: 0.87,                    // Exponential decay
  fromNodeDegree: 3,                      // Links from source node
  toNodeDegree: 2,                        // Links to target node
  degreeBalance: 0.9,                     // Preference for balanced topology
  highwayRouteId: 'highway-5' || null,    // If on synergy highway
  highwayBonus: 1.0 || 0.0,               // 1.0 if on highway
  automationHealth: 0.85,                 // Health of automation engine
}
```

---

## Part 6: Scoring Formula

The ML prediction uses weighted feature scoring:

```
score = Σ (w_i * feature_i)

Then applies logistic transformation:
quality = 1 / (1 + e^(-2*score))

Clamped to [0, 1]
```

**Default weights (balanced preset):**
```javascript
{
  categoryBonus: 0.3,        // Proper category progression
  synergyWeight: 0.35,       // Highest: synergy potential
  historyWeight: 0.2,        // Past link quality
  distanceWeight: 0.15,      // Proximity bonus
  trendWeight: 0.15,         // Historical trend
  degreeBalance: 0.1,        // Network topology balance
  highwayRouteBonus: 0.25,   // Synergy highway alignment
  automationHealth: 0.05,    // Engine context
}
```

---

## Part 7: Configuration

### Default Configuration

```javascript
{
  minQualityThreshold: 0.65,              // Minimum recommended quality
  highQualityThreshold: 0.8,              // High-quality threshold
  maxCandidatesPerTick: 100,              // Candidate pool size
  maxRecommendationsPerNode: 10,          // Cached per-node recommendations
  maxWorldDistance: 100,                  // Normalized distance constraint
  useHistoryWeight: 0.25,                 // Config (for reference)
  useDistanceWeight: 0.15,
  useTrendWeight: 0.2,
  throttleMs: 500,                        // Rebuild candidates at most every 500ms
}
```

### Custom Configuration

```javascript
LinkMLRecommendationEngine1_0.init({
  // ... system references ...
  minQualityThreshold: 0.7,
  highQualityThreshold: 0.85,
  maxCandidatesPerTick: 150,
  throttleMs: 1000,
});
```

---

## Part 8: Weight Presets

### Preset: "balanced" (Default)

Best general-purpose recommendations. Balances all factors equally.

```javascript
window.tuneMLWeights('balanced')
```

**Use when:** You want diverse, well-rounded recommendations.

### Preset: "history_heavy"

Strongly weights historical performance. Recommends links that have worked well before.

```javascript
window.tuneMLWeights('history_heavy')
```

**Characteristics:**
- `historyWeight: 0.4` (doubled)
- `trendWeight: 0.25` (high)
- Lower weights for other factors

**Use when:**
- You want to reinforce proven connections
- Network is stable and patterns are established
- Maximizing consistency over exploration

### Preset: "structure_first"

Prioritizes network topology and synergy highway alignment. Prefers proper layer progression.

```javascript
window.tuneMLWeights('structure_first')
```

**Characteristics:**
- `categoryBonus: 0.4` (high)
- `highwayRouteBonus: 0.4` (high)
- `degreeBalance: 0.2` (high)
- Lower weights for history

**Use when:**
- Network needs structural refinement
- Building proper layer hierarchies
- Aligning with synergy highways
- Early network construction

---

## Part 9: Performance & Monitoring

### Expected Performance

| Operation | Time | Frequency |
|-----------|------|-----------|
| Candidate rebuild | <2ms | Every 500ms (throttled) |
| Score all candidates | <1ms | Per query |
| Query top-N | <0.1ms | On demand |
| Per-node recommendations | <0.2ms | On demand (cached 1s) |

**Total overhead:** <0.1% of frame budget when called once per second.

### Monitoring

```javascript
// Check engine health
window.printMLStats()

// Get detailed stats
const stats = window.getMLDebugInfo();
console.log(`Total candidates: ${stats.stats.totalCandidatesEvaluated}`);
console.log(`Avg quality: ${(stats.stats.avgPredictedQuality * 100).toFixed(1)}%`);
```

---

## Part 10: Integration Checklist

### Pre-Integration
- [ ] Review LinkMLRecommendationEngine1_0.js
- [ ] Understand feature vector structure
- [ ] Plan weight preset for your use case

### During Integration
- [ ] Import module in main.js
- [ ] Initialize with system references (6 required)
- [ ] Test: `window.testMLRecommendations()`
- [ ] Verify: `window.printMLStats()`

### With LinkAutomationEngine1_0
- [ ] Modify `run()` method to use `getAutoLinkBatch()`
- [ ] Add fallback to random candidates
- [ ] Test automation with ML-guided links

### Deployment
- [ ] Verify recommendations make sense
- [ ] Monitor performance (<2ms per cycle)
- [ ] Test different weight presets
- [ ] Commit and deploy

---

## Part 11: Troubleshooting

### No Recommendations Generated

```javascript
// Check initialization
window.LinkMLRecommendationEngine1_0._initialized    // Should be true

// Check system references
const engine = window.LinkMLRecommendationEngine1_0;
console.log('AINodes:', !!engine._systemReferences.AINodes);
console.log('NodeLinkingSystem:', !!engine._systemReferences.NodeLinkingSystem);
```

### Low Quality Scores

```javascript
// Check preset
window.tuneMLWeights('balanced')

// Inspect feature vectors
const recs = window.testMLRecommendations();
// Look at feature vector for low-scoring recommendations
```

### High Memory Usage

```javascript
// Reduce candidate pool
LinkMLRecommendationEngine1_0._config.maxCandidatesPerTick = 50;

// Increase throttle time
LinkMLRecommendationEngine1_0._config.throttleMs = 1000;
```

---

## Part 12: Advanced Usage

### Custom Weight Tuning

```javascript
// Try custom weights
LinkMLRecommendationEngine1_0.setCustomWeights({
  synergyWeight: 0.5,       // Increase synergy importance
  historyWeight: 0.1,       // Reduce history weight
  highwayRouteBonus: 0.3,   // Custom highway weight
});

// Test with new weights
window.testMLRecommendations();

// If you like it, save for later
const myWeights = LinkMLRecommendationEngine1_0.getCurrentWeights();
// Store in config or as preset
```

### Integration with Visualization Dashboard

In **NetworkVisualizationDashboard1_0.js**, add a section for ML recommendations:

```javascript
// Display top recommendation in dashboard
const topRec = LinkMLRecommendationEngine1_0.getTopRecommendations(1)[0];
if (topRec) {
  dashboard.emit('mlRecommendation', {
    from: topRec.fromNodeId,
    to: topRec.toNodeId,
    quality: topRec.predictedQuality,
  });
}
```

---

## Summary

**LinkMLRecommendationEngine1_0 integration:**

1. **Import & Initialize** (5 min)
   - Add import to main.js
   - Call `init()` with system references

2. **Integrate with AutomationEngine** (20 min)
   - Modify `run()` to use `getAutoLinkBatch()`
   - Add fallback handling

3. **Configure & Test** (15 min)
   - Choose weight preset
   - Run console tests
   - Verify performance

4. **Deploy** (20 min)
   - Monitor recommendations
   - Adjust weights if needed
   - Commit changes

**Total integration time:** ~1 hour

**Status:** ✅ Production Ready

---

**Related Files:**
- `/LINK_ML_RECOMMENDATION_QUICKREF.md` — Quick start
- `/LINK_ML_RECOMMENDATION_IMPLEMENTATION.md` — Technical deep dive
- `/LINK_ML_RECOMMENDATION_SUMMARY.md` — Complete summary
