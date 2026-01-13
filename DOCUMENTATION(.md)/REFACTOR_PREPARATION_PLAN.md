# PHASE 3b VFX METRICS REFACTOR PREPARATION PLAN

**Status:** READY FOR IMPLEMENTATION  
**Duration Estimate:** 3–4 weeks  
**Team Allocation:** 1 senior engineer  
**Risk Level:** Medium (refactor, not rewrite)  

---

## EXECUTIVE SUMMARY

The Phase 3 metrics foundation (NodeDynamicMetrics, LinkQualityCalculator, NodeQualityCalculator) is production-ready. This plan outlines how to integrate all VFX systems with the new unified metrics architecture.

**Key Outcome:** Single source of truth for all metrics → eliminates redundancy, fixes visual inconsistencies, enables advanced integrations.

---

## PART 1: NEW VISUAL METRICS MODEL

### Architecture Overview

```
BEFORE (fragmented):
  CoreMetricsCalculator → Produces: synergy%, harmony%, etc.
  ComputeSynergyScore2_0 → Produces: synergyScore (0–1)
  LinkGlowSynergyEngine → Reads: link.synergyScore (fallback chain)
  VFX Systems → Read: various sources, inconsistent values
  
AFTER (unified):
  NodeDynamicMetrics → Produces: 11 per-node metrics (0–100 or 0–1)
  LinkQualityCalculator → Produces: per-link score (0–100)
  NodeQualityCalculator → Produces: per-node quality (0–100)
  CoreMetricsCalculator → REFACTORED: Reads above 3, aggregates
  All VFX Systems → Read: ONLY CoreMetricsCalculator, NodeQualityCalculator, LinkQualityCalculator
```

### New Metric Hierarchy

```
TIER 1: Per-Node Metrics (Foundation)
├── NodeDynamicMetrics.js
│   ├── stability (0–100)
│   ├── harmony (0–100)
│   ├── clarity (0–100)
│   ├── energy (0–120 absolute, energyNorm 0–1)
│   ├── loadRatio (0–1)
│   ├── corruption (0–100)
│   ├── instability (0–100)
│   ├── linkCount (integer)
│   ├── lastActiveTime (timestamp)
│   ├── createdAt (timestamp)
│   └── temperatureTrend (time-based)

TIER 2: Per-Link Metrics (Foundation)
├── LinkQualityCalculator.js
│   ├── score (0–100) [SINGLE AUTHORITATIVE QUALITY]
│   ├── level (High, Medium, Low, Critical)
│   ├── metrics breakdown (8 components)
│   └── updatedAt (timestamp)

TIER 3: Per-Node Quality (Unified)
├── NodeQualityCalculator.js
│   ├── score (0–100) [UNIFIED NODE QUALITY]
│   ├── level (Prime, Stable, Weak, Critical)
│   ├── metrics breakdown (8 components)
│   └── updatedAt (timestamp)

TIER 4: Network Aggregates (Derived)
├── CoreMetricsCalculator.js (REFACTORED)
│   ├── avgNodeQuality (average of all node.userData.quality.score)
│   ├── avgStability (average of all node.userData.metrics.stability)
│   ├── avgHarmony (average of all node.userData.metrics.harmony)
│   ├── avgInstability (average of all node.userData.metrics.instability)
│   ├── avgCorruption (average of all node.userData.metrics.corruption)
│   ├── networkLoad (average of all node.userData.metrics.loadRatio * 100)
│   ├── qualityDistribution (count by Prime/Stable/Weak/Critical)
│   └── linkQualityStats (avg, min, max of all links)
```

### Scale Normalization Rules

**All metrics must follow these rules:**

```
RULE 1: Node Internal Metrics
  Range: 0–100 (percentage scale)
  Normalized: divide by 100 to get 0–1
  Application: Direct use in formulas as-is
  Example: stability = 75 (meaning 75%), or 0.75 when normalized

RULE 2: Energy Metrics
  Absolute: 0–120 (energy units)
  Normalized: divide by 120 to get 0–1
  Application: Absolute for internal tracking, normalized for visuals
  Example: energy = 90 units, energyNorm = 0.75

RULE 3: Load/Ratio Metrics
  Range: 0–1 (already normalized)
  Percentage: multiply by 100 to display as %
  Application: Use as-is in calculations, multiply for display
  Example: loadRatio = 0.6 (60% load)

RULE 4: Quality Scores (NEW)
  Node Quality: 0–100 (percentage)
  Link Quality: 0–100 (percentage)
  Normalized: divide by 100 when needed
  Application: Use in comparisons as-is, divide for 0–1 range
  Example: quality >= 70 (70% good quality)

RULE 5: Personality Modifiers (LEGACY)
  Range: -1 to +1 (delta modifier)
  Application: Scale by factor to apply to 0–100 metrics
  Example: personality.harmony = 0.5, apply as +5 points to stability
  Formula: adjusted = base + (modifier * scaleFactor)
           where scaleFactor = 10 for 0–100 metrics

RULE 6: Aggregates
  Network-level: 0–100 (average of node metrics)
  Percentages: Multiply by 100 for display
  Formulas: Use all nodes/links to compute (see below)
```

### Network-Level Metric Computation

```javascript
// TEMPLATE: How to compute network aggregates
function computeNetworkMetrics(aiNodes, linkingSystem) {
  const metrics = {};
  
  // 1. Node Quality Average
  const nodeQualityScores = aiNodes.nodes
    .map(n => n.userData?.quality?.score ?? 50)
    .filter(s => s !== null);
  metrics.avgNodeQuality = average(nodeQualityScores);
  
  // 2. Component Metrics Average
  metrics.avgStability = average(
    aiNodes.nodes.map(n => n.userData?.metrics?.stability ?? 50)
  );
  metrics.avgHarmony = average(
    aiNodes.nodes.map(n => n.userData?.metrics?.harmony ?? 50)
  );
  metrics.avgInstability = average(
    aiNodes.nodes.map(n => n.userData?.metrics?.instability ?? 50)
  );
  metrics.avgCorruption = average(
    aiNodes.nodes.map(n => n.userData?.metrics?.corruption ?? 0)
  );
  
  // 3. Load Calculation
  const nodeLoadRatios = aiNodes.nodes
    .map(n => n.userData?.metrics?.loadRatio ?? 0.5);
  metrics.networkLoad = average(nodeLoadRatios) * 100;
  
  // 4. Link Quality Statistics
  const linkScores = linkingSystem.links
    .map(l => l.userData?.quality?.score ?? 50)
    .filter(s => s !== null);
  metrics.linkQualityAvg = average(linkScores);
  metrics.linkQualityMin = Math.min(...linkScores);
  metrics.linkQualityMax = Math.max(...linkScores);
  
  // 5. Quality Distribution
  const distribution = { Prime: 0, Stable: 0, Weak: 0, Critical: 0 };
  aiNodes.nodes.forEach(n => {
    const level = n.userData?.quality?.level ?? 'Weak';
    distribution[level]++;
  });
  metrics.qualityDistribution = distribution;
  
  return metrics;
}

// Helper: Simple average
function average(values) {
  if (!values || values.length === 0) return 50;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
```

---

## PART 2: METRIC SOURCE HIERARCHY

### Reading Metrics (Priority Order)

**For Node Metrics:**
```javascript
function getNodeMetric(node, metricName) {
  // 1. First check NodeDynamicMetrics output (source of truth)
  if (node.userData?.metrics?.[metricName] !== undefined) {
    return node.userData.metrics[metricName];
  }
  
  // 2. Check NodeQualityCalculator if asking for quality
  if (metricName === 'quality' && node.userData?.quality) {
    return node.userData.quality;
  }
  
  // 3. Compute from personality modifiers (legacy integration)
  if (node.userData?.personality?.temperament) {
    const base = node.userData.metrics?.[metricName] ?? 50;
    const modifier = node.userData.personality.temperament[metricName];
    if (modifier !== undefined) {
      return base + (modifier * 10);  // Scale factor 10
    }
  }
  
  // 4. Fallback to safe default
  return 50;  // Middle value for 0–100 metrics
}

// Usage
const stability = getNodeMetric(node, 'stability');
const quality = getNodeMetric(node, 'quality');
```

**For Link Metrics:**
```javascript
function getLinkMetric(link, metricName) {
  // 1. LinkQualityCalculator is only source for link quality
  if (metricName === 'quality' || metricName === 'score') {
    return link.userData?.quality?.score ?? 50;
  }
  
  // 2. Fallback
  return 50;
}

// Usage
const linkQuality = getLinkMetric(link, 'quality');
```

**For Network Metrics:**
```javascript
// Use CoreMetricsCalculator (refactored)
const networkMetrics = window.game.coreMetricsCalculator.getMetrics();
const avgQuality = networkMetrics.avgNodeQuality;
const networkLoad = networkMetrics.networkLoad;
```

---

## PART 3: STEP-BY-STEP REFACTOR PLAN

### Phase 3b Week 1: Critical Path (Synergy Systems)

**Objective:** Migrate synergy/link quality to use LinkQualityCalculator exclusively

#### Day 1–2: ComputeSynergyScore2_0 Wrapper

**File:** ComputeSynergyScore2_0.js  
**Changes:** Create backward-compatible wrapper

```javascript
// ADD THIS WRAPPER FUNCTION (keep existing ComputeSynergyScore2_0 intact)
export function computeSynergyScore(link, systemsConfig = {}) {
  // NEW: Use LinkQualityCalculator as source of truth
  const quality = link.userData?.quality?.score ?? 50;
  const qualityNorm = quality / 100;  // Convert to 0–1 for backward compat
  
  // Map new quality to old tier system
  let tier = 'low';
  if (quality >= 85) tier = 'critical';
  else if (quality >= 65) tier = 'high';
  else if (quality >= 40) tier = 'medium';
  
  // Provide backward-compatible components (approximately)
  return {
    score: qualityNorm,      // 0–1 (backward compat)
    tier: tier,
    components: {
      type: 0.35 * qualityNorm,
      priority: 0.25 * qualityNorm,
      traffic: 0.20 * qualityNorm,
      decay: 0.10 * qualityNorm,
      topology: 0.10 * qualityNorm
    }
  };
}

// KEEP: Old implementation as computeSynergyScoreLegacy() for reference
```

**Testing:**
```javascript
// Test backward compatibility
for (const link of linkingSystem.links) {
  const oldScore = computeSynergyScoreLegacy(link, systems);
  const newScore = computeSynergyScore(link, systems);
  
  // Verify new score produces reasonable values
  assert(newScore.score >= 0 && newScore.score <= 1);
  assert(['low', 'medium', 'high', 'critical'].includes(newScore.tier));
  console.log(`Link ${link.id}: quality=${link.userData.quality.score} → tier=${newScore.tier}`);
}
```

#### Day 2–3: LinkGlowSynergyEngine Refactor

**File:** LinkGlowSynergyEngine1_0.js  
**Changes:** Replace fallback chain with single source

```javascript
// BEFORE: Complex fallback chain
function getSynergyScore(link) {
  if (typeof link.synergyScore === 'number') {
    return Math.max(0, Math.min(1, link.synergyScore));
  }
  if (link.linkData?.synergyScore) {
    return Math.max(0, Math.min(1, link.linkData.synergyScore));
  }
  if (link.synergy?.score) {
    return Math.max(0, Math.min(1, link.synergy.score));
  }
  if (link.traffic?.load) {  // WRONG SCALE!
    return Math.max(0, Math.min(1, link.traffic.load));
  }
  return 0.5;
}

// AFTER: Single, clean source
function getSynergyScore(link) {
  // LinkQualityCalculator is the single source of truth
  const quality = link.userData?.quality?.score ?? 50;
  return quality / 100;  // Always 0–1 range
}
```

**Testing:**
```javascript
// Verify all links use new source
for (const link of linkingSystem.links) {
  const score = getSynergyScore(link);
  assert(score >= 0 && score <= 1);
  
  // Verify visual updates happen
  updateLinkGlow(link, score);
  assert(link material updated);
}
```

#### Day 3–4: Update All ComputeSynergyScore2_0 Consumers

**Modules to check:**
- [ ] SynergyVFXEngine1_0.js (if using ComputeSynergyScore2_0)
- [ ] LinkAutomationMonitor (if using ComputeSynergyScore2_0)
- [ ] Debug HUDs that display synergy

**Change template:**
```javascript
// BEFORE
const synergyData = computeSynergyScore(link, systems);
const synergyScore = synergyData.score;

// AFTER
const linkQuality = link.userData?.quality?.score ?? 50;
const synergyScore = linkQuality / 100;  // Convert to 0–1 if needed
```

#### Day 4–5: Integration Testing

**Checklist:**
- [ ] All links have link.userData.quality populated
- [ ] LinkGlowSynergyEngine reads from new source
- [ ] ComputeSynergyScore2_0 wrapper works
- [ ] All consumers of synergy data working
- [ ] Visual effects rendered correctly with new values
- [ ] Performance metrics unchanged or improved
- [ ] No console errors related to synergy

---

### Phase 3b Week 2: High Priority (Metrics Calculator & VFX)

**Objective:** Refactor CoreMetricsCalculator and update SynergyVFX systems

#### Day 1–2: CoreMetricsCalculator Refactor

**File:** CoreMetricsCalculator.js  
**Strategy:** Replace all metric computations with aggregations from Phase 3 sources

```javascript
// NEW IMPLEMENTATION TEMPLATE
export class CoreMetricsCalculator {
  update(deltaTime, aiNodes, linkingSystem, nodeEvolution, nodeArchetypes) {
    // Update at low frequency (kept as-is: 2x/second)
    this.lastCalculationTime += deltaTime;
    if (this.lastCalculationTime < this.calculationInterval) {
      return false;
    }
    this.lastCalculationTime = 0;
    
    try {
      // CHANGE: Read from Phase 3 sources instead of computing
      this.aggregateMetrics(aiNodes, linkingSystem);
      return true;
    } catch (error) {
      console.warn('Error aggregating metrics:', error);
      return false;
    }
  }
  
  aggregateMetrics(aiNodes, linkingSystem) {
    if (!aiNodes || !aiNodes.nodes) return;
    
    // Aggregate node metrics
    const nodeQualities = aiNodes.nodes
      .map(n => n.userData?.quality?.score ?? 50);
    const stabilities = aiNodes.nodes
      .map(n => n.userData?.metrics?.stability ?? 50);
    const harmonies = aiNodes.nodes
      .map(n => n.userData?.metrics?.harmony ?? 50);
    const instabilities = aiNodes.nodes
      .map(n => n.userData?.metrics?.instability ?? 50);
    const corruptions = aiNodes.nodes
      .map(n => n.userData?.metrics?.corruption ?? 0);
    const loadRatios = aiNodes.nodes
      .map(n => n.userData?.metrics?.loadRatio ?? 0.5);
    
    // Compute aggregates
    this.metrics.synergy = this.average(nodeQualities);     // Now: avg quality
    this.metrics.stability = this.average(stabilities);
    this.metrics.harmony = this.average(harmonies);
    this.metrics.instability = this.average(instabilities);
    this.metrics.corruption = this.average(corruptions);
    this.metrics.networkLoad = this.average(loadRatios) * 100;
    
    // Link statistics
    if (linkingSystem && linkingSystem.links) {
      const linkScores = linkingSystem.links
        .map(l => l.userData?.quality?.score ?? 50);
      this.metrics.linkQualityAvg = this.average(linkScores);
      this.metrics.linkQualityMin = Math.min(...linkScores);
    }
    
    // Quality distribution
    const distribution = { Prime: 0, Stable: 0, Weak: 0, Critical: 0 };
    aiNodes.nodes.forEach(n => {
      const level = n.userData?.quality?.level ?? 'Weak';
      distribution[level] = (distribution[level] ?? 0) + 1;
    });
    this.metrics.qualityDistribution = distribution;
  }
  
  average(values) {
    if (!values || values.length === 0) return 50;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}
```

**Migration checklist:**
- [ ] Remove all legacy metric calculation formulas
- [ ] Add aggregation methods
- [ ] Maintain output format for backward compatibility
- [ ] Test with large node counts (100+)
- [ ] Verify performance improvement

#### Day 2–3: SynergyVFX Systems Update

**Files:** SynergyVFX1_0.js, SynergyHighways1_0.js, SynergyHighways2_0.js  
**Changes:** Update metric sources

```javascript
// CHANGE TEMPLATE FOR SYNERGY VFX SYSTEMS

// OLD: Implicit synergyStrength
registerLink(link, linkId) {
  const synergyStrength = link.synergyStrength || 0.5;
  // ... use synergyStrength
}

// NEW: Explicit LinkQualityCalculator source
registerLink(link, linkId) {
  const linkQuality = link.userData?.quality?.score ?? 50;
  const synergyStrength = linkQuality / 100;  // Normalize to 0–1
  
  // Rest of logic stays the same, but now using correct metric
  this.updateVisuals(linkId, synergyStrength);
}

// Also update update() method
update(deltaTime) {
  for (const [linkId, linkData] of this.linkData) {
    const link = linkData.link;
    const linkQuality = link.userData?.quality?.score ?? 50;
    const synergyStrength = linkQuality / 100;
    
    // Use synergyStrength for all visual calculations
    this.updatePulse(linkId, synergyStrength, deltaTime);
  }
}
```

**Testing:**
- [ ] Links with high quality display high intensity
- [ ] Links with low quality display low intensity
- [ ] Smooth transitions when quality changes
- [ ] All 4 quality levels (Prime, Stable, Weak, Critical) visible

#### Day 3–4: LinkAutomationEngine Update

**File:** LinkAutomationEngine1_0.js  
**Changes:** Switch to LinkQualityCalculator for decisions

```javascript
// OLD: Uses ComputeSynergyScore2_0
shouldCreateLink(source, target) {
  const synergyData = computeSynergyScore(someLink, systems);
  return synergyData.score > 0.7;  // 0–1 scale
}

// NEW: Uses LinkQualityCalculator
shouldCreateLink(source, target) {
  // First, check if link already exists and get its quality
  let link = findLinkBetween(source, target);
  if (!link) {
    // Estimate quality based on source/target quality
    const sourceQuality = source.userData?.quality?.score ?? 50;
    const targetQuality = target.userData?.quality?.score ?? 50;
    const estimatedLinkQuality = (sourceQuality + targetQuality) / 2;
    return estimatedLinkQuality > 70;  // 0–100 scale
  } else {
    // Use actual link quality
    return link.userData?.quality?.score > 70;
  }
}
```

#### Day 4–5: Integration Testing

**Checklist:**
- [ ] CoreMetricsCalculator produces correct aggregates
- [ ] SynergyVFX systems display correctly
- [ ] LinkAutomationEngine creates/removes links based on new quality
- [ ] All metrics within expected ranges
- [ ] Performance maintained or improved
- [ ] Backward compatibility layer working

---

### Phase 3b Week 3: Medium Priority (Displays & Events)

**Objective:** Update display systems and event triggers

#### Day 1–2: CoreMetricsHUD & Display Updates

**File:** CoreMetricsHUD.js  
**Changes:** Add NodeQualityCalculator display

```javascript
// NEW: Display node quality statistics
updateDisplay() {
  // Display network-level aggregates (existing)
  this.updateNetworkMetrics(metrics);
  
  // NEW: Add node quality section
  const nodeQualityStats = {
    average: metrics.qualityDistribution ? 
      (metrics.qualityDistribution.Prime * 85 + 
       metrics.qualityDistribution.Stable * 70 + 
       metrics.qualityDistribution.Weak * 50 + 
       metrics.qualityDistribution.Critical * 20) / aiNodes.nodes.length : 50,
    distribution: metrics.qualityDistribution
  };
  
  this.displayNodeQualityStats(nodeQualityStats);
}

// NEW: Render quality distribution
displayNodeQualityStats(stats) {
  // Show average node quality
  updateElement('avg-node-quality', stats.average.toFixed(1));
  
  // Show distribution
  updateElement('prime-nodes', stats.distribution.Prime);
  updateElement('stable-nodes', stats.distribution.Stable);
  updateElement('weak-nodes', stats.distribution.Weak);
  updateElement('critical-nodes', stats.distribution.Critical);
}
```

#### Day 2–3: MetricReactiveWorldEvents Update

**File:** MetricReactiveWorldEvents.js  
**Changes:** Verify triggers work with aggregated metrics

```javascript
// VERIFY: Event triggers still function correctly
checkSynergyEvents(metrics, currentTime) {
  // Synergy is now avg node quality (different baseline)
  const synergy = metrics.avgNodeQuality ?? 50;
  
  // Thresholds may need adjustment
  // OLD: synergy % (0–100)
  // NEW: avg quality (0–100, but distribution might be different)
  
  // Recommend: Test and adjust thresholds if needed
  if (synergy > 80) {
    triggerCoherenceWave();
  }
}
```

**Action Items:**
- [ ] Run baseline metrics with old and new systems
- [ ] Compare distributions (old synergy % vs new avg quality)
- [ ] Adjust thresholds if distributions significantly different
- [ ] Test all event triggers work correctly

#### Day 3–4: NodePersonality Integration Design

**File:** NodePersonality2_0.js  
**Changes:** Design personality modifier application

```javascript
// NEW: Apply personality modifiers to node metrics

// In update loop:
function applyPersonalityModifiers(node) {
  if (!node.userData?.personality?.temperament) return;
  
  const personality = node.userData.personality.temperament;
  const metrics = node.userData.metrics;
  
  // Scale factor: how much does personality affect each metric
  const scaleFactor = 10;  // ±10 points for ±1.0 personality
  
  // Apply modifiers
  const adjustedMetrics = {
    stability: metrics.stability + (personality.harmony * scaleFactor),
    harmony: metrics.harmony + (personality.harmony * scaleFactor),
    clarity: metrics.clarity + (personality.clarity * scaleFactor),
    instability: metrics.instability + (personality.instability * scaleFactor),
    corruption: metrics.corruption + (personality.corruption * scaleFactor),
  };
  
  // Clamp all to valid ranges
  for (const key in adjustedMetrics) {
    adjustedMetrics[key] = Math.max(0, Math.min(100, adjustedMetrics[key]));
  }
  
  // Store adjusted values
  node.userData.personalityAdjustedMetrics = adjustedMetrics;
}

// DECISION: Use adjusted or base metrics?
// Option A: Use adjusted metrics throughout VFX
// Option B: Use base metrics for consistency, personality is cosmetic
// RECOMMENDATION: Option B (use base, personality for evolution speed)
```

**Design Decision:**
- Personality modifiers are cosmetic enhancement to node visuals
- Base metrics (from NodeDynamicMetrics) remain source of truth
- Personality system refined in Phase 3c (optional)

#### Day 4–5: Comprehensive Integration Testing

**Test Scenarios:**

1. **Metric Consistency**
   ```javascript
   // Verify all systems read same source
   for (const node of aiNodes.nodes) {
     const m1 = node.userData.metrics.stability;
     // If multiple systems read this, they should all get same value
   }
   ```

2. **Scale Consistency**
   ```javascript
   // Verify all scales are consistent (0–100 for metrics)
   for (const node of aiNodes.nodes) {
     for (const [key, value] of Object.entries(node.userData.metrics)) {
       if (key === 'energyNorm' || key === 'loadRatio') {
         assert(value >= 0 && value <= 1);
       } else if (key === 'energy') {
         assert(value >= 0 && value <= 120);
       } else {
         assert(value >= 0 && value <= 100);  // Standard range
       }
     }
   }
   ```

3. **VFX Correctness**
   ```javascript
   // Verify VFX respond correctly to metrics
   testHighQualityLink(75);    // Should display bright/fast
   testLowQualityLink(25);     // Should display dim/slow
   testCriticalQualityNode(15); // Should display red/distorted
   ```

4. **Performance**
   ```javascript
   // Measure per-frame cost
   const t0 = performance.now();
   nodeQuality.update(dt);
   linkQuality.update(dt);
   coreMet.update(dt);
   allVFXSystems.update(dt);
   const t1 = performance.now();
   
   assert(t1 - t0 < 5);  // Total < 5ms per frame
   ```

---

### Phase 3b Week 4: Advanced Integrations & Optimization

**Objective:** Polish, optimization, and optional enhancements

#### Day 1–2: Color Palette Unification

**Goal:** All VFX use consistent colors for quality levels

```javascript
// UNIFIED COLOR PALETTE (shared constant)
const QUALITY_COLORS = {
  // Based on quality scores (0–100)
  critical: { hex: 0xff4444, rgb: [255, 68, 68] },    // 0–39: Red
  weak:     { hex: 0xffaa00, rgb: [255, 170, 0] },    // 40–64: Orange
  stable:   { hex: 0x00ccdd, rgb: [0, 204, 221] },    // 65–84: Cyan
  prime:    { hex: 0x00ff88, rgb: [0, 255, 136] },    // 85–100: Green
};

function getColorForQuality(score) {
  if (score >= 85) return QUALITY_COLORS.prime;
  if (score >= 65) return QUALITY_COLORS.stable;
  if (score >= 40) return QUALITY_COLORS.weak;
  return QUALITY_COLORS.critical;
}

// Apply across all VFX systems
linkGlow.color = getColorForQuality(linkQuality);
nodeAura.color = getColorForQuality(nodeQuality);
synergyHighway.color = getColorForQuality(linkQuality);
```

#### Day 2–3: Brightness/Intensity Unification

**Goal:** Map quality scores to visual intensity consistently

```javascript
// UNIFIED INTENSITY MAPPING (shared constant)
const INTENSITY_CURVE = {
  // Score (0–100) → intensity (0–1)
  compute: (score) => {
    const norm = score / 100;
    // Curve: 1.0 + 0.5 * sin(pi * norm - pi/2)
    // Gives: low (0.5) at 0, peak (1.5) at 100
    return 1.0 + 0.5 * Math.sin(Math.PI * norm - Math.PI / 2);
  },
  min: 0.5,   // Minimum glow intensity
  max: 1.5    // Maximum glow intensity
};

// Apply across systems
linkGlowIntensity = INTENSITY_CURVE.compute(linkQuality);
nodeGlowIntensity = INTENSITY_CURVE.compute(nodeQuality);
```

#### Day 3–4: Performance Optimization

```javascript
// Cache metric computations to reduce CPU load
class MetricCache {
  constructor() {
    this.nodeQualityCache = new Map();  // nodeId → cached quality
    this.linkQualityCache = new Map();  // linkId → cached quality
    this.lastUpdateFrame = 0;
  }
  
  getNodeQuality(node) {
    const nodeId = node.uuid || node.id;
    
    // Return cached if from same frame
    if (this.lastUpdateFrame === window.game.frameCount &&
        this.nodeQualityCache.has(nodeId)) {
      return this.nodeQualityCache.get(nodeId);
    }
    
    // Otherwise, cache and return
    const quality = node.userData?.quality?.score ?? 50;
    this.nodeQualityCache.set(nodeId, quality);
    this.lastUpdateFrame = window.game.frameCount;
    return quality;
  }
  
  invalidate() {
    this.nodeQualityCache.clear();
    this.linkQualityCache.clear();
    this.lastUpdateFrame = -1;
  }
}
```

#### Day 4–5: Final Validation & Documentation

**Validation Checklist:**
- [ ] All metrics read from single sources (NodeDynamics, LinkQuality, NodeQuality)
- [ ] No duplicate metric computations
- [ ] All scales consistent (0–100 for percentages, 0–1 for normalized)
- [ ] Color palette unified across all VFX
- [ ] Intensity mapping consistent
- [ ] Performance baseline met or exceeded
- [ ] All visual effects render correctly
- [ ] No console warnings or errors
- [ ] Integration tests pass (100%)
- [ ] Load testing passes (1000+ nodes)

**Documentation:**
- [ ] Update all VFX module headers with new metric sources
- [ ] Create VFXMETRICS_INTEGRATION_GUIDE.md
- [ ] Document color palette and intensity mapping
- [ ] Add performance optimization notes
- [ ] Create troubleshooting guide for common issues

---

## PART 4: VALIDATION & TESTING FRAMEWORK

### Automated Test Suite

```javascript
// FILE: VFXMetricsValidationSuite.js
export class VFXMetricsValidationSuite {
  // Test 1: Verify metric sources
  testMetricSources(aiNodes, linkingSystem) {
    for (const node of aiNodes.nodes) {
      assert(node.userData?.metrics?.stability !== undefined);
      assert(node.userData?.quality?.score !== undefined);
    }
    
    for (const link of linkingSystem.links) {
      assert(link.userData?.quality?.score !== undefined);
    }
    
    console.log('✓ All metrics have valid sources');
  }
  
  // Test 2: Verify scale consistency
  testScaleConsistency(aiNodes, linkingSystem) {
    for (const node of aiNodes.nodes) {
      for (const [key, value] of Object.entries(node.userData.metrics)) {
        if (key === 'energyNorm' || key === 'loadRatio') {
          assert(value >= 0 && value <= 1, `${key} out of range`);
        } else if (key === 'energy') {
          assert(value >= 0 && value <= 120);
        } else {
          assert(value >= 0 && value <= 100);
        }
      }
    }
    
    console.log('✓ All scales within valid ranges');
  }
  
  // Test 3: Verify no redundant computations
  testNoRedundancy(systems) {
    const synergyComputations = [
      systems.computeSynergyScore2_0,
      systems.linkGlowEngine,
      systems.linkAutomation
    ];
    
    // Verify only one is used per decision
    assert(synergyComputations.filter(s => s.enabled).length === 1);
    
    console.log('✓ No redundant metric computations');
  }
  
  // Test 4: Verify color consistency
  testColorConsistency() {
    const quality75 = getColorForQuality(75);
    const quality85 = getColorForQuality(85);
    
    assert(quality75 !== quality85);  // Different scores → different colors
    assert(isColorValid(quality75));  // Valid color format
    
    console.log('✓ Color palette consistent');
  }
  
  // Test 5: Performance benchmark
  testPerformance(aiNodes, linkingSystem, iterations = 100) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      
      // Update all metric systems
      nodeQuality.update(0.016);
      linkQuality.update(0.016);
      coreMetrics.update(0.016);
      allVFXSystems.forEach(vfx => vfx.update(0.016));
      
      const t1 = performance.now();
      times.push(t1 - t0);
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    const max = Math.max(...times);
    
    assert(avg < 2, `Average time ${avg}ms exceeds 2ms target`);
    assert(max < 5, `Max time ${max}ms exceeds 5ms target`);
    
    console.log(`✓ Performance: avg=${avg.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
  }
}

// Run suite
const suite = new VFXMetricsValidationSuite();
suite.testMetricSources(aiNodes, linkingSystem);
suite.testScaleConsistency(aiNodes, linkingSystem);
suite.testNoRedundancy(window.game);
suite.testColorConsistency();
suite.testPerformance(aiNodes, linkingSystem);
```

---

## PART 5: DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All code changes reviewed and approved
- [ ] All automated tests passing (100%)
- [ ] Performance benchmarks met
- [ ] Manual testing completed on all VFX systems
- [ ] Backward compatibility verified
- [ ] Documentation updated
- [ ] Console clean (no warnings/errors)

### Deployment

- [ ] Stage 1: Deploy to staging environment
- [ ] Stage 2: Run full test suite on staging
- [ ] Stage 3: Deploy to production
- [ ] Stage 4: Monitor metrics and performance
- [ ] Stage 5: Collect user feedback

### Post-Deployment

- [ ] Monitor for any metric inconsistencies
- [ ] Performance remains acceptable
- [ ] VFX render correctly across all systems
- [ ] No regressions in game logic
- [ ] Plan Phase 3c enhancements

---

## CONCLUSION

**Timeline:** 3–4 weeks  
**Effort:** ~120 hours (one senior engineer)  
**Risk:** Medium (refactoring, not rewriting)  
**Benefit:** Eliminates redundancy, fixes inconsistencies, enables advanced features

**Success Criteria:**
1. ✅ Single source of truth for all metrics
2. ✅ Unified color and brightness mapping
3. ✅ No redundant computations
4. ✅ Performance maintained/improved
5. ✅ All visual effects render correctly
6. ✅ 100% backward compatibility maintained

---

**Ready for: Implementation Phase**
**Owner:** Lucy (Senior AI Engineer)
**Status:** APPROVED FOR EXECUTION

---

END OF REFACTOR PREPARATION PLAN
