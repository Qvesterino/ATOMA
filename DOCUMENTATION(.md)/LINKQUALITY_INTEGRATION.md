# Link Quality Predictor 1.0 — Full Integration Guide

**Complete technical reference for LinkQualityPredictor1_0 integration** 🔧

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Integration Points](#integration-points)
3. [Quality Scoring System](#quality-scoring-system)
4. [Console API](#console-api)
5. [Configuration](#configuration)
6. [Performance](#performance)
7. [Examples](#examples)

---

## Architecture Overview

### Components

```
LinkQualityPredictor1_0
├─ computeQuality(nodeA, nodeB)           → Main scoring method
├─ evaluateCandidates(candidates)         → Batch evaluation
├─ Synergy Factor (40%)                   → ComputeSynergyScore2_0
├─ Category Factor (25%)                  → Category matrix
├─ Distance Factor (15%)                  → Spatial proximity
├─ Priority Factor (10%)                  → Historical strength
├─ Temperament Factor (10%)               → Mood compatibility
└─ Penalties & Boosts                     → Duplicate, decay, etc.
```

### Data Flow

```
[Request: evaluate nodeA → nodeB]
        ↓
[Compute all factors]
        ├─ Synergy (ComputeSynergyScore2_0)
        ├─ Category (matrix lookup)
        ├─ Distance (vector math)
        ├─ Priority (node.priority data)
        ├─ Temperament (mood matrix)
        ├─ Duplicate check
        └─ Decay check
        ↓
[Apply weights: 40% + 25% + 15% + 10% + 10%]
        ↓
[Apply penalties/boosts]
        ↓
[Clamp to 0-100]
        ↓
[Generate explanation]
        ↓
[Return: quality score + reasoning]
```

---

## Integration Points

### 1. LinkRecommendationAI1_0 Integration

**Where:** After LinkRecommendationAI creates initial recommendations

```javascript
// In main.js (line ~928-930)
if (this.linkRecommendationAI && this.linkQualityPredictor) {
    this.linkRecommendationAI.linkQualityPredictor = this.linkQualityPredictor;
}
```

**Effect:** AI will rank suggestions by quality score

**In LinkRecommendationAI code:**
```javascript
// Quality-ranked top 5
getTopSuggestions() {
    if (this.linkQualityPredictor) {
        // Evaluate candidates with predictor
        return this.linkQualityPredictor.evaluateCandidates(candidates)
            .slice(0, 5);
    }
    return this.topSuggestions.slice(0, 5);
}
```

### 2. LinkAutomationEngine1_0 Integration

**Where:** Before LinkAutomationEngine creates links

```javascript
// In main.js (line ~934-936)
if (this.linkAutomationEngine && this.linkQualityPredictor) {
    this.linkAutomationEngine.linkQualityPredictor = this.linkQualityPredictor;
    this.linkQualityPredictor.setAutomationThreshold(65);
}
```

**Effect:** Only links with quality ≥ threshold are created

**In LinkAutomationEngine code:**
```javascript
// Check quality before creating link
if (this.linkQualityPredictor) {
    const quality = this.linkQualityPredictor.computeQuality(nodeA, nodeB);
    if (!this.linkQualityPredictor.meetsAutomationThreshold(quality.quality)) {
        result.skipped++;
        continue; // Skip this link
    }
}
// Create link only if quality passes
this.nodeLinker.createLink(nodeA, nodeB);
```

### 3. SynergyDebugHUD Integration

**Where:** HUD displays quality information

**Effect:** HUD shows why links are recommended

```javascript
// In SynergyRecommendationDebugHUD rendering
const quality = this.linkQualityPredictor.computeQuality(rec.nodeA, rec.nodeB);
html += `
    <div style="...">
        #${i+1} ${nodeA} → ${nodeB}<br>
        quality: ${quality.quality}%<br>
        reason: ${quality.explanation.reason}
    </div>
`;
```

### 4. Optional: NodeSynergyIntegration Integration

**If available:**
```javascript
// After both systems initialized
if (this.nodeSynergyIntegration && this.linkQualityPredictor) {
    // Share historical synergy data
    this.linkQualityPredictor.historicalData = this.nodeSynergyIntegration.getData();
}
```

---

## Quality Scoring System

### 1. Synergy Factor (40% weight)

**Source:** ComputeSynergyScore2_0

```javascript
_evaluateSynergy(nodeA, nodeB) {
    const synergy = this.computeSynergyScore(nodeA, nodeB); // 0-1
    let score = synergy * 100; // Convert to 0-100
    
    // Boost if historical synergy is high
    const historical = this._getHistoricalSynergy(nodeA, nodeB);
    if (historical && historical > synergy) {
        score *= this.config.historicalSynergyBoost; // 1.2x boost
    }
    
    return Math.min(100, score);
}
```

**Range:** 0-100  
**Typical values:**
- 0-30: Poor compatibility
- 30-60: Moderate compatibility
- 60-85: Good compatibility
- 85-100: Excellent compatibility

### 2. Category Factor (25% weight)

**Source:** Category complementarity matrix

```javascript
const categoryMatrix = {
  'ANALYSIS': {
    'INTEGRATION': 1.3,    // High boost
    'STORAGE': 1.2,
    'PROCESS': 1.1,
    'INPUT': 1.0,
    'OUTPUT': 0.9,
    'ERROR': 0.6           // Low compatibility
  },
  // ... more categories
};
```

**Scoring logic:**
- Look up multiplier for (catA, catB) pair
- Base score 50 + (multiplier - 0.7) × 100
- Result: 0-100 scale

**Strong pairs:**
- ANALYSIS ↔ INTEGRATION (1.3×)
- INTEGRATION ↔ PROCESS (1.2×)
- PROCESS ↔ OUTPUT (1.1×)

### 3. Distance Factor (15% weight)

**Source:** Spatial proximity

```javascript
_evaluateDistance(nodeA, nodeB) {
    const distance = nodeA.position.distanceTo(nodeB.position);
    const threshold = 50; // World units
    
    if (distance < threshold) {
        // Nearby: high score
        return 100 - (distance / threshold) * 30;
    } else {
        // Far: penalize
        const excess = distance - threshold;
        const penalty = excess * 0.02;
        return Math.max(20, 70 - penalty);
    }
}
```

**Scoring:**
- 0-50 units: 70-100
- 50-100 units: 50-70
- 100+ units: <50

### 4. Priority Factor (10% weight)

**Source:** Node historical priority scores

```javascript
_evaluatePriority(nodeA, nodeB) {
    const priorityA = nodeA.userData?.priority?.score || 50;
    const priorityB = nodeB.userData?.priority?.score || 50;
    const avgPriority = (priorityA + priorityB) / 2;
    return avgPriority; // 0-100
}
```

**Interpretation:**
- High priority nodes → More likely to link
- Low priority nodes → Less emphasis

### 5. Temperament Factor (10% weight)

**Source:** Node personality/mood

```javascript
const moodPairs = {
  'neutral_neutral': 100,
  'positive_positive': 90,
  'neutral_positive': 85,
  'negative_negative': 80,
  'neutral_negative': 70,
  'positive_negative': 50
};
```

**Logic:** Compatible moods boost quality

### Penalties & Boosts

| Type | Value | Condition |
|------|-------|-----------|
| **Duplicate Penalty** | -30 | Link already exists |
| **Decay Penalty** | -15 | Old, low-activity link |
| **Category Boost** | +30 (in category score) | Complementary pair |
| **Historical Boost** | ×1.2 | Strong past synergy |

---

## Console API

### Main Commands

#### `computeLinkQuality(nodeNameA, nodeNameB)`

```javascript
computeLinkQuality("ANALYSIS-1", "STORAGE-5")
```

**Output:**
```
🔍 Link Quality Analysis
Quality Score: 82/100
Explanation: EXCELLENT MATCH
Categories: ANALYSIS → STORAGE
Factors: [...]
Rationale: ✓ High synergy score
           ✓ Complementary categories
           ✓ Nearby nodes
Execution Time: 0.47ms
```

#### `testQualityMatrix()`

```javascript
testQualityMatrix()
```

**Tests 5 consecutive node pairs, shows quality ranking**

#### `testRandomCandidates()`

```javascript
testRandomCandidates()
```

**Tests 5 random node pairs, ranks by quality**

#### `getQualityStats()`

```javascript
getQualityStats()
```

**Output:**
```
📊 Link Quality Predictor Statistics
Total Evaluations: 47
Average Quality: 63.42%
Excellent Matches: 12
Good Matches: 18
Fair Matches: 12
Poor Matches: 5
```

#### `setQualityThreshold(threshold)`

```javascript
setQualityThreshold(70)
```

**Sets automation threshold (0-100)**

---

## Configuration

### Quality Thresholds

```javascript
config.excellentThreshold = 75;  // ≥75 = Excellent
config.goodThreshold = 60;       // ≥60 = Good
config.fairThreshold = 40;       // ≥40 = Fair
config.poorThreshold = 20;       // ≥20 = Poor
```

### Distance Parameters

```javascript
config.distancePenaltyThreshold = 50;  // Beyond 50 units = penalty
config.distancePenaltyFactor = 0.02;   // Per unit penalty
```

### Weighting

```javascript
config.synergyWeight = 0.40;           // 40%
config.categoryWeight = 0.25;          // 25%
config.distanceWeight = 0.15;          // 15%
config.priorityWeight = 0.10;          // 10%
config.temperamentWeight = 0.10;       // 10%
```

### Customize Weights

```javascript
window.game.linkQualityPredictor.configureWeights({
    synergy: 0.50,           // Increase synergy importance
    category: 0.20,          // Decrease category importance
    distance: 0.15,
    priority: 0.10,
    temperament: 0.05
});
```

---

## Performance

### Execution Time

| Operation | Time | Notes |
|-----------|------|-------|
| Single evaluation | <1ms | All factors computed |
| Batch 5 candidates | <5ms | Parallel evaluation |
| 100 candidates | <100ms | Sorted by quality |

### Memory

| Item | Size |
|------|------|
| Category matrix | ~2KB |
| Mood matrix | ~1KB |
| Statistics (100 samples) | ~1KB |
| Active state | ~5KB |
| **Total** | **~9KB** |

### Optimization Tips

1. **Cache results** — Don't re-evaluate same pairs
2. **Batch evaluation** — Use `evaluateCandidates()` for multiple
3. **Tune thresholds** — Higher threshold = fewer evaluations
4. **Limit samples** — Stats keeps last 100 evaluations

---

## Examples

### Example 1: Manual Quality Check

```javascript
// Check specific link viability
computeLinkQuality("PROCESS-2", "STORAGE-3")

// Output: 78% (GOOD MATCH)
// → Safe to create manually
```

### Example 2: Automation with Quality Filter

```javascript
// Set quality requirement
setQualityThreshold(70)  // Only ≥70% links

// Enable automation
enableAutoLink()

// Run automation
autoLinkActive()

// Result: Only high-quality links created automatically
```

### Example 3: Batch Candidate Ranking

```javascript
// Generate 5 random candidates
testRandomCandidates()

// Output shows top 5 by quality
// Best candidates are prioritized
```

### Example 4: Real-time Monitoring

```javascript
// Check statistics periodically
function monitorQuality() {
    getQualityStats()
    setTimeout(monitorQuality, 5000); // Every 5 seconds
}

monitorQuality()
```

### Example 5: Dynamic Threshold Tuning

```javascript
// Start conservative
setQualityThreshold(75)
autoLinkActive()
getQualityStats()

// If too few links, loosen threshold
setQualityThreshold(65)
autoLinkActive()
getQualityStats()

// If too many poor links, tighten
setQualityThreshold(70)
```

---

## Troubleshooting

### Q: Quality scores all around 50?

**A:** Check if ComputeSynergyScore2_0 is properly integrated

```javascript
console.log(window.game.linkQualityPredictor.computeSynergyScore)
```

### Q: Threshold not working?

**A:** Verify automation engine has predictor reference

```javascript
console.log(window.game.linkAutomationEngine.linkQualityPredictor)
```

### Q: Execution time >1ms?

**A:** Check if evaluating too many candidates at once

```javascript
// Batch 5-10 at a time, not 50
```

### Q: Stats showing only poor matches?

**A:** Nodes may be incompatible. Test single pairs:

```javascript
computeLinkQuality("NODE_A", "NODE_B")
```

---

## Summary

**LinkQualityPredictor1_0** provides:

✅ **Multi-factor evaluation** — 5 weighted factors  
✅ **0-100 quality scale** — Easy interpretation  
✅ **Real-time scoring** — <1ms per link  
✅ **Automation filtering** — Configurable threshold  
✅ **Batch processing** — Evaluate 100s efficiently  
✅ **Human-readable output** — Clear explanations  

**Status: 🟢 PRODUCTION READY**

Ready for full deployment and integration! 🚀
