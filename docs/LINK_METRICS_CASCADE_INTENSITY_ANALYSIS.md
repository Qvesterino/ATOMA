# LinkMetrics System Analysis & cascadeIntensity Integration

**Date:** 2026-03-06  
**Purpose:** Analyze LinkMetrics architecture and propose cascadeIntensity integration

---

## 1. LinkMetrics Architecture Overview

### System Hierarchy

```
NodeDynamicMetrics (Node Metrics Source)
    ↓
LinkQualityCalculator (Link Quality Computation)
    ↓
link.userData.quality (0-100 scale)
    ↓
LinkMetricsToVisualBridge (Stress Visualization)
    ↓
Visual Output (Stress effects on links)
```

---

## 2. LinkQualityCalculator v1.0 (Primary System)

### File: LinkQualityCalculator.js

**Responsibility:**
- Compute per-link quality once per frame (0-100 scale)
- Use NodeDynamicMetrics as input source
- Store results in link.userData.quality for read-only access
- Never modify external systems

### Input Sources

**NodeDynamicMetrics:**
```javascript
this.nodeDynamics.getNodeMetrics(node)
```

**Returns:**
```javascript
{
  stability: 0..1,    // Node stability
  harmony: 0..1,      // Node harmony
  synergy: 0..1,      // Node synergy
  corruption: 0..1,   // Node corruption
  loadPressure: 0..1  // Node load pressure
}
```

### Output Structure

**link.userData.quality:**
```javascript
{
  score: 0..100,              // Final weighted score
  level: "High"|"Medium"|"Low"|"Critical",
  structural: 0..100,          // Structural quality (30%)
  harmony: 0..100,            // Harmony quality (40%)
  load: 0..100,               // Load quality (15%)
  corruption: 0..100,         // Corruption quality (15%)
  updatedAt: timestamp
}
```

### Quality Components

#### 2.1 Structural Quality (30%)

**Computation:**
```javascript
_computeStructuralQuality(link, now) {
    let score = baseStructuralScore; // Default: 80
    
    // Check 1: Link validity
    if (!link || !link.source || !link.target) {
        return 0; // Dead link
    }
    
    if (!link.source.parent || !link.target.parent) {
        return 0; // Nodes removed
    }
    
    // Check 2: Distance-based penalty
    const distance = link.source.position.distanceTo(link.target.position);
    const maxDist = maxLinkDistance; // Default: 50
    
    if (distance > maxDist) {
        const excess = distance - maxDist;
        const penalty = excess * distancePenaltyRate; // Default: 0.5
        score -= penalty;
    }
    
    // Check 3: Staleness detection
    const lastUpdate = link.userData?.quality?.updatedAt ?? now;
    const staleness = (now - lastUpdate) / 1000; // in seconds
    
    if (staleness > stalenessThreshold) { // Default: 5 sec
        score -= 20;
    }
    
    return Math.max(0, Math.min(100, score));
}
```

**Sources:**
- Link structure (source, target)
- Link distance (computed)
- Update timestamp (link.userData.quality.updatedAt)

---

#### 2.2 Node Harmony & Stability (40%)

**Computation:**
```javascript
_computeHarmonyQuality(link) {
    const metricsA = this.nodeDynamics.getNodeMetrics(link.source);
    const metricsB = this.nodeDynamics.getNodeMetrics(link.target);
    
    if (!metricsA || !metricsB) {
        return 50; // Neutral fallback
    }
    
    // Extract stability metrics
    const stabA = metricsA.stability ?? 0.6;
    const stabB = metricsB.stability ?? 0.6;
    const nodePairStability = (stabA + stabB) / 2;
    
    // Extract harmony metrics
    const harmA = metricsA.harmony ?? 0.5;
    const harmB = metricsB.harmony ?? 0.5;
    const nodePairHarmony = (harmA + harmB) / 2;
    
    // Weighted average: 60% stability, 40% harmony
    const score = (nodePairStability * 0.6) + (nodePairHarmony * 0.4);
    
    return Math.max(0, Math.min(100, score));
}
```

**Sources:**
- NodeDynamicMetrics.getNodeMetrics(source)
- NodeDynamicMetrics.getNodeMetrics(target)

**Weighting:**
- Stability: 60%
- Harmony: 40%

---

#### 2.3 Load Stress Factor (15%)

**Computation:**
```javascript
_computeLoadQuality(link) {
    const metricsA = this.nodeDynamics.getNodeMetrics(link.source);
    const metricsB = this.nodeDynamics.getNodeMetrics(link.target);
    
    if (!metricsA || !metricsB) {
        return 60; // Moderate fallback
    }
    
    // Get load ratios (0-1 scale)
    const loadA = metricsA.loadPressure ?? 0;
    const loadB = metricsB.loadPressure ?? 0;
    const averageLoad = (loadA + loadB) / 2;
    
    // Convert to quality: high load = low quality
    // 0 load → 100 quality
    // 0.5 load → 50 quality
    // 1.0 load → 0 quality
    const score = 100 * (1 - averageLoad);
    
    return Math.max(0, Math.min(100, score));
}
```

**Sources:**
- NodeDynamicMetrics.getNodeMetrics(source).loadPressure
- NodeDynamicMetrics.getNodeMetrics(target).loadPressure

**Transformation:**
- Inverse relationship (higher load = lower quality)

---

#### 2.4 Corruption Factor (15%)

**Computation:**
```javascript
_computeCorruptionQuality(link) {
    const metricsA = this.nodeDynamics.getNodeMetrics(link.source);
    const metricsB = this.nodeDynamics.getNodeMetrics(link.target);
    
    if (!metricsA || !metricsB) {
        return 70; // Assume some corruption
    }
    
    // Get corruption for both nodes (0-100 scale)
    const corrA = metricsA.corruption ?? 0;
    const corrB = metricsB.corruption ?? 0;
    
    // Use maximum corruption (worst node determines link quality)
    const maxCorruption = Math.max(corrA, corrB);
    
    // Convert to quality: corruption is inversely related
    // 0 corruption → 100 quality
    // 50 corruption → 50 quality
    // 100 corruption → 0 quality
    const score = 100 - maxCorruption;
    
    return Math.max(0, Math.min(100, score));
}
```

**Sources:**
- NodeDynamicMetrics.getNodeMetrics(source).corruption
- NodeDynamicMetrics.getNodeMetrics(target).corruption

**Logic:**
- Use maximum corruption (worst node)
- Inverse relationship (higher corruption = lower quality)

---

### Final Quality Score

```javascript
_calculateFinalScore(structuralScore, harmonyScore, loadScore, corruptionScore) {
    const score =
      (structuralScore * structuralWeight) +      // 30%
      (harmonyScore * harmonyWeight) +            // 40%
      (loadScore * loadWeight) +                // 15%
      (corruptionScore * corruptionWeight);      // 15%
    
    return Math.max(0, Math.min(100, score));
}
```

**Weighting:**
- Structural: 30%
- Harmony: 40%
- Load: 15%
- Corruption: 15%

**Range:** 0-100 (clamped)

---

## 3. NodeDynamicMetrics (Node Metrics Source)

### File: NodeDynamicMetrics.js

**Responsibility:**
- READ canonical node.userData.metrics (0..1 scale)
- Compute derived visual values (0..100 scale)
- Write ONLY to node.userData.visualMetrics
- No gameplay authority

### Input Structure

**node.userData.metrics (Canonical 0..1):**
```javascript
{
  stability: 0..1,    // Node stability metric
  harmony: 0..1,      // Node harmony metric
  synergy: 0..1,      // Node synergy metric
  corruption: 0..1,   // Node corruption metric
  loadPressure: 0..1  // Node load pressure
}
```

**Note:** This is READ-ONLY canonical data. VisualDerivedMetrics transforms to visual scale (0..100).

### Output Structure

**node.userData.visualMetrics (Visual 0..100):**
```javascript
{
  stability: 0..100,     // Transformed from 0..1
  harmony: 0..100,       // Transformed from 0..1
  synergy: 0..100,       // Transformed from 0..1
  corruption: 0..100,    // Transformed from 0..1
  loadPressure: 0..100,  // Transformed from 0..1
  
  linkCount: int,         // Total links connected
  incomingLinks: int,     // Incoming connections
  outgoingLinks: int,     // Outgoing connections
  
  loadRatio: 0..1,       // loadMax normalized
  loadMax: int            // Maximum load capacity
}
```

### Transformation Logic

```javascript
// Canonical (0..1) → Visual (0..100)
const stabilityNorm = _clamp01(base?.stability ?? 0.5);
const harmonyNorm = _clamp01(base?.harmony ?? 0.5);
const synergyNorm = _clamp01(base?.synergy ?? 0.5);
const corruptionNorm = _clamp01(base?.corruption ?? 0);
const loadPressureNorm = _clamp01(base?.loadPressure ?? loadRatio);

visual.stability = _clamp100(stabilityNorm * 100);
visual.harmony = _clamp100(harmonyNorm * 100);
visual.synergy = _clamp100(synergyNorm * 100);
visual.corruption = _clamp100(corruptionNorm * 100);
visual.loadPressure = _clamp100(loadPressureNorm * 100);
```

**Transformation:**
- Linear scaling (multiply by 100)
- Fallback defaults (0.5 for most metrics)
- Clamping to valid range (0-100)

---

## 4. Who Provides node.userData.metrics?

### Current Status: UNKNOWN

**Searched Systems:**
- ❌ NodeLinkingSystem - NO .metrics assignment found
- ❌ AINodes - NO .metrics assignment found
- ❌ NodeDynamicMetrics - Only READS .metrics
- ❌ VisualDerivedMetrics - Only READS .metrics

**Possible Sources:**
1. **AINodes System** - AI computations may set metrics
2. **NodeInitialization** - Metrics set when node created
3. **DynamicCalculation** - Metrics updated during runtime
4. **ExternalSystem** - Metrics imported from external source

**Fallback Behavior:**
```javascript
const base = node.userData.metrics || null; // READ-ONLY
if (!base) {
    // Fallback to defaults
    stability = 0.5;
    harmony = 0.5;
    synergy = 0.5;
    corruption = 0;
    loadPressure = 0;
}
```

---

## 5. cascadeIntensity Integration Proposal

### 5.1 Problem Statement

**Current Issue:**
- CascadeParticleSystem_Session120 requires `link.userData.cascadeIntensity` (0-1)
- No system creates or calculates `link.userData.cascadeIntensity`
- Default value: undefined → 0 (no particles emitted)

**Required:**
- Calculate cascadeIntensity from existing LinkMetrics
- Store in link.userData.cascadeIntensity (0-1 scale)
- Triggered by cascade events or corruption levels

---

### 5.2 Integration Option 1: LinkQualityCalculator Extension (RECOMMENDED)

**Add to LinkQualityCalculator.js:**

```javascript
/**
 * Calculate cascade intensity based on link quality metrics
 * Range: 0-1 (higher = more intense cascade)
 * @public
 */
calculateCascadeIntensity(link) {
    if (!link || !link.userData?.quality) {
        return 0; // No quality data
    }
    
    const quality = link.userData.quality;
    
    // Cascade intensity is inversely related to link quality
    // High quality (100) → Low cascade intensity (0)
    // Low quality (0) → High cascade intensity (1)
    const intensity = 1 - (quality.score / 100);
    
    // Modulate based on corruption level
    const corruptionModulation = quality.corruption / 100;
    
    // Final intensity: blend quality and corruption
    const finalIntensity = (intensity * 0.7) + (corruptionModulation * 0.3);
    
    return Math.max(0, Math.min(1, finalIntensity));
}

/**
 * Update cascade intensity for all links
 * Call this from update loop after quality calculation
 * @public
 */
updateCascadeIntensities() {
    for (const link of this.linkingSystem.links) {
        if (!link.userData) {
            link.userData = {};
        }
        
        const cascadeIntensity = this.calculateCascadeIntensity(link);
        link.userData.cascadeIntensity = cascadeIntensity;
        
        // Set conflict type based on lowest quality component
        link.userData.cascadeConflictType = this._determineConflictType(link);
        
        // Set cascade color based on corruption level
        link.userData.cascadeParticleColor = this._getCascadeColor(link);
    }
}

/**
 * Determine conflict type from quality components
 * @private
 */
_determineConflictType(link) {
    const quality = link.userData.quality;
    if (!quality) return 'none';
    
    // Find lowest component
    const components = {
        structural: quality.structural,
        harmony: quality.harmony,
        load: quality.load,
        corruption: quality.corruption
    };
    
    const lowest = Object.entries(components).reduce((min, [key, value]) => {
        return value < min.value ? [key, value] : min;
    }, ['structural', 100]);
    
    // Map lowest component to conflict type
    const conflictTypes = {
        structural: 'fatigue_yield',      // Structural failure
        harmony: 'destructive',          // Harmony conflict
        load: 'specialization_drift',   // Load stress
        corruption: 'corruption'        // Corruption spread
    };
    
    return conflictTypes[lowest[0]] || 'none';
}

/**
 * Get cascade particle color based on corruption level
 * @private
 */
_getCascadeColor(link) {
    const quality = link.userData.quality;
    if (!quality) return new THREE.Color(1, 1, 1);
    
    const corruption = quality.corruption / 100;
    
    // Color gradient: White (low corruption) → Red (high corruption)
    const color = new THREE.Color();
    color.setRGB(1 - corruption, 1 - corruption * 0.5, 1 - corruption);
    
    return color;
}
```

**Update Loop Modification:**
```javascript
update(deltaTime) {
    // ... existing quality calculations ...
    
    // NEW: Update cascade intensities
    this.updateCascadeIntensities();
}
```

**Benefits:**
1. Centralized calculation in existing LinkQualityCalculator
2. Consistent with existing quality metrics
3. Automatic updates (once per frame)
4. No additional systems needed

**Integration:**
```javascript
// In main.js constructor
this.linkQualityCalculator = new LinkQualityCalculator(
    this.linkingSystem,
    this.nodeDynamics
);

// Update loop (already exists)
this.frameScheduler.register('simulation', (dt) => {
    this.linkQualityCalculator.update(dt);
}, 'simulation.linkQuality');
```

---

### 5.3 Integration Option 2: CascadingRuptureSystem (CASCADE EVENTS)

**Add to CascadingRuptureSystem.js:**

```javascript
/**
 * Update cascade intensity for active cascades
 * Called when cascade hops between nodes
 * @public
 */
onCascadeHop(sourceNodeId, targetNodeId, linkId, cascadeData) {
    const link = this.linkingSystem.getLink(linkId);
    if (!link) return;
    
    // Set cascade intensity from cascade data
    const intensity = cascadeData.intensity ?? 0.8;
    link.userData.cascadeIntensity = intensity;
    
    // Set conflict type from cascade data
    link.userData.cascadeConflictType = cascadeData.type ?? 'destructive';
    
    // Set emission boost
    link.userData.cascadeParticleEmissionBoost = cascadeData.boost ?? 2.0;
    
    // Set cascade color
    link.userData.cascadeParticleColor = cascadeData.color ?? new THREE.Color(1, 0.5, 0);
    
    console.log('[CascadingRuptureSystem] Cascade hop:', sourceNodeId, '→', targetNodeId, 'intensity:', intensity);
}

/**
 * Clear cascade intensity when cascade completes
 * @public
 */
onCascadeComplete(linkId) {
    const link = this.linkingSystem.getLink(linkId);
    if (!link) return;
    
    // Reduce intensity (fade out)
    link.userData.cascadeIntensity = 0;
    link.userData.cascadeParticleEmissionBoost = 1.0;
    
    console.log('[CascadingRuptureSystem] Cascade complete:', linkId);
}
```

**Trigger Points:**
- Cascade start: `onCascadeHop()` called
- Cascade complete: `onCascadeComplete()` called
- Automatic: Triggered by cascading rupture system

**Benefits:**
1. Event-driven (only updates when cascade active)
2. High control (explicit intensity control)
3. Proper cleanup (clears intensity on completion)

**Integration:**
```javascript
// In CascadingRuptureSystem.triggerRupture(nodeId)
function triggerRupture(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    // Create cascade data
    const cascadeData = {
        intensity: 0.9,
        type: 'destructive',
        boost: 2.0,
        color: new THREE.Color(1, 0, 0)
    };
    
    // Propagate cascade through network
    this._propagateCascade(nodeId, cascadeData);
    
    // Each hop calls onCascadeHop() → sets cascadeIntensity
}
```

---

### 5.4 Integration Option 3: Hybrid Approach (BEST)

**Combine Options 1 + 2:**

1. **Option 1 (Baseline):** LinkQualityCalculator calculates baseline cascadeIntensity
2. **Option 2 (Events):** CascadingRuptureSystem overrides intensity during cascades
3. **Falloff:** Cascade intensity fades back to baseline after cascade completes

**Implementation:**
```javascript
// In LinkQualityCalculator.update()
update(deltaTime) {
    // ... existing quality calculations ...
    
    // NEW: Update cascade intensities (baseline)
    this.updateCascadeIntensities();
}

// In CascadingRuptureSystem.onCascadeHop()
onCascadeHop(sourceNodeId, targetNodeId, linkId, cascadeData) {
    const link = this.linkingSystem.getLink(linkId);
    if (!link) return;
    
    // Set cascade intensity (overrides baseline)
    link.userData.cascadeIntensity = cascadeData.intensity ?? 0.8;
    link.userData.cascadeConflictType = cascadeData.type ?? 'destructive';
    link.userData.cascadeParticleEmissionBoost = cascadeData.boost ?? 2.0;
    
    // Store baseline for falloff
    if (!link.userData.cascadeBaseline) {
        link.userData.cascadeBaseline = link.userData.cascadeIntensity;
    }
    
    // Schedule falloff to baseline
    this._scheduleFalloff(linkId, cascadeData.duration ?? 2.0);
}

// In CascadingRuptureSystem (falloff method)
_scheduleFalloff(linkId, duration) {
    const link = this.linkingSystem.getLink(linkId);
    if (!link) return;
    
    setTimeout(() => {
        // Return to baseline
        const baseline = link.userData.cascadeBaseline || 0;
        link.userData.cascadeIntensity = baseline;
        link.userData.cascadeParticleEmissionBoost = 1.0;
        
        console.log('[CascadingRuptureSystem] Cascade falloff:', linkId, 'intensity:', baseline);
    }, duration * 1000);
}
```

**Benefits:**
1. Always has cascadeIntensity (even without active cascades)
2. Event-driven updates (high priority during cascades)
3. Smooth falloff (graceful return to baseline)
4. Best of both approaches

---

## 6. Summary

| Question | Answer | Source |
|----------|--------|--------|
| **Aké metriky sa počítajú?** | Quality (0-100): structural, harmony, load, corruption | LinkQualityCalculator |
| **Z čoho?** | NodeDynamicMetrics.getNodeMetrics(node) | LinkQualityCalculator |
| **Kto ich dáva?** | ❌ UNKNOWN (not found in codebase) | AINodes? External? |
| ** cascadeIntensity počítanie?** | ❌ NOT CALCULATED (missing) | Should be in LinkQualityCalculator |

---

## 7. Action Items

### Immediate (Testing)
1. ✅ Add `calculateCascadeIntensity()` to LinkQualityCalculator
2. ✅ Add `updateCascadeIntensities()` to LinkQualityCalculator
3. ✅ Call `updateCascadeIntensities()` in `update()` loop
4. ⏭️ Test cascadeIntensity calculation

### Short-term (Integration)
1. ⏭️ Identify source of node.userData.metrics
2. ⏭️ Integrate cascadeIntensity update in main.js
3. ⏭️ Test with CascadeParticleSystem_Session120

### Long-term (Architecture)
1. ⏭️ Document node.userData.metrics source
2. ⏭️ Consider event-driven cascade updates
3. ⏭️ Implement hybrid baseline + events approach

---

## 8. Proposed Implementation (Option 1 - Recommended)

Add to LinkQualityCalculator.js:

```javascript
// In class LinkQualityCalculator

/**
 * Calculate cascade intensity (0-1)
 * Inversely related to link quality
 */
calculateCascadeIntensity(link) {
    if (!link || !link.userData?.quality) {
        return 0;
    }
    
    const quality = link.userData.quality;
    const intensity = 1 - (quality.score / 100);
    const corruptionModulation = quality.corruption / 100;
    
    return Math.max(0, Math.min(1, (intensity * 0.7) + (corruptionModulation * 0.3)));
}

/**
 * Update cascade intensities for all links
 */
updateCascadeIntensities() {
    for (const link of this.linkingSystem.links) {
        if (!link.userData) {
            link.userData = {};
        }
        
        link.userData.cascadeIntensity = this.calculateCascadeIntensity(link);
        link.userData.cascadeConflictType = this._determineConflictType(link);
        link.userData.cascadeParticleColor = this._getCascadeColor(link);
    }
}

/**
 * Determine conflict type from quality components
 */
_determineConflictType(link) {
    const quality = link.userData.quality;
    if (!quality) return 'none';
    
    const components = {
        structural: quality.structural,
        harmony: quality.harmony,
        load: quality.load,
        corruption: quality.corruption
    };
    
    const lowest = Object.entries(components).reduce((min, [key, value]) => {
        return value < min.value ? [key, value] : min;
    }, ['structural', 100]);
    
    const conflictTypes = {
        structural: 'fatigue_yield',
        harmony: 'destructive',
        load: 'specialization_drift',
        corruption: 'corruption'
    };
    
    return conflictTypes[lowest[0]] || 'none';
}

/**
 * Get cascade particle color
 */
_getCascadeColor(link) {
    const quality = link.userData.quality;
    if (!quality) return new THREE.Color(1, 1, 1);
    
    const corruption = quality.corruption / 100;
    const color = new THREE.Color();
    color.setRGB(1 - corruption, 1 - corruption * 0.5, 1 - corruption);
    
    return color;
}

// In update() method
update(deltaTime) {
    // ... existing code ...
    
    // NEW: Update cascade intensities
    this.updateCascadeIntensities();
}
```

---

## 9. Testing Commands

```javascript
// Check cascadeIntensity is being set
window.game.linkingSystem.links.forEach(link => {
    const intensity = link.userData.cascadeIntensity;
    const conflictType = link.userData.cascadeConflictType;
    if (intensity > 0.1) {
        console.log(`Link ${link.id}: intensity=${intensity}, type=${conflictType}`);
    }
});

// Check LinkQualityCalculator methods
window.game.linkQualityCalculator?.calculateCascadeIntensity(window.game.linkingSystem.links[0]);
window.game.linkQualityCalculator?.updateCascadeIntensities();

// Verify particle emission
window.game.cascadeParticleSystem.activeCount // Should be > 0 after setting cascadeIntensity
```

---

## Conclusion

**cascadeIntensity Integration:**

✅ **Option 1 (Recommended):** Add to LinkQualityCalculator
- Calculates baseline cascadeIntensity from quality
- Updates all links once per frame
- No additional systems needed

✅ **Option 2 (Event-driven):** Use CascadingRuptureSystem
- Event-driven updates during cascades
- Higher priority for active cascades
- Requires cascade events

✅ **Option 3 (Hybrid):** Best of both approaches
- Baseline from LinkQualityCalculator
- Overrides from CascadingRuptureSystem
- Smooth falloff to baseline

**Recommendation:** Start with Option 1 (LinkQualityCalculator extension) for baseline cascade intensity.

---

**Status:** ✅ ANALYSIS COMPLETE - READY FOR IMPLEMENTATION

**Next Step:** Implement Option 1 (Recommended) in LinkQualityCalculator.js
