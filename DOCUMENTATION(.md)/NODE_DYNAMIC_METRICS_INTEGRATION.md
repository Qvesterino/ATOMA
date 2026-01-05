# NODE DYNAMIC METRICS v1.0 - Integration Guide

## Overview

`NodeDynamicMetrics.js` is the **single source of truth** for all per-node metrics in ATOMA. It replaces scattered and duplicated metric computations across other systems with a unified, production-ready module.

**Key Promise:** Every node gets exactly one metric calculation per frame, stored in `node.userData.metrics` for read-only access by other systems.

---

## Installation (In Your Game Loop)

### Step 1: Import the module

```javascript
import { NodeDynamicMetrics } from './NodeDynamicMetrics.js';
```

### Step 2: Initialize in your AtomaGame constructor

```javascript
class AtomaGame {
  constructor(container) {
    // ... existing initialization ...
    
    this.aiNodes = new AINodes(this.scene, this.player);
    this.linkingSystem = new NodeLinkingSystem(
      this.scene,
      this.camera,
      this.renderer,
      this.aiNodes
    );
    
    // NEW: Initialize Node Dynamic Metrics
    this.nodeDynamics = new NodeDynamicMetrics(
      this.aiNodes,
      this.linkingSystem
      // Optional: pass config object to customize parameters
    );
  }
}
```

### Step 3: Call update() in your main game loop

In your `animate()` or `update(deltaTime)` method:

```javascript
animate(deltaTime) {
  // ... existing updates ...
  
  // NEW: Update node metrics (once per frame, before reading metrics)
  this.nodeDynamics.update(deltaTime);
  
  // ... rest of your game loop ...
}
```

**Placement:** Call this **before** any systems that read `node.userData.metrics`. This ensures metrics are fresh for that frame.

---

## Reading Metrics (From Any System)

Once initialized and updated each frame, all metrics are available read-only:

```javascript
// In any system (CoreMetricsHUD, LinkQualityCalculator, etc.)

const node = somNode; // Get your node reference

// Safe pattern: always check if metrics exist
if (node.userData?.metrics) {
  const m = node.userData.metrics;
  
  // Structural (counts)
  const links = m.linkCount;         // Total connections (in + out)
  const incoming = m.incomingLinks;   // Incoming connections
  const outgoing = m.outgoingLinks;   // Outgoing connections
  const ratio = m.loadRatio;          // 0-1, how loaded this node is
  
  // Dynamic soft metrics (0-100 scale)
  const energy = m.energy;           // 0-120 (clamped for display)
  const stability = m.stability;     // 0-100
  const harmony = m.harmony;         // 0-100
  const instability = m.instability; // 0-100 (inverse of stability)
  const clarity = m.clarity;         // 0-100
  const corruption = m.corruption;   // 0-100
  
  // Time-based
  const idleSecs = m.lastActiveSeconds;  // Seconds since last activity
  const lastUpdate = m.updatedAt;        // Timestamp of last update
}
```

---

## Configuration (Optional)

You can customize behavior by passing a config object during initialization:

```javascript
const customConfig = {
  emasAlpha: 0.3,                    // Higher = faster response (default: 0.2)
  energyMaximum: 150,                // Peak energy value (default: 120)
  energyDecayRate: 0.1,              // Decay when idle (default: 0.15)
  energyGainPerLink: 10,             // Energy per link per second (default: 8)
  baseStability: 70,                 // Baseline stability (default: 60)
  loadStressFactor: 50,              // Load stress impact (default: 40)
  defaultLoadMax: 5,                 // Max links before stress (default: 4)
  sigmaCorruptionGain: 20,           // Corruption/sec for sigma nodes (default: 15)
};

this.nodeDynamics = new NodeDynamicMetrics(
  this.aiNodes,
  this.linkingSystem,
  customConfig
);
```

**Recommended Tuning:**
- **Faster metrics:** Increase `emasAlpha` (0.3-0.4)
- **More energy gain:** Increase `energyGainPerLink` (10-15)
- **Stricter stability:** Decrease `baseStability` (40-50)
- **Aggressive sigma corruption:** Increase `sigmaCorruptionGain` (20-30)

---

## Computation Details

### Energy (0-120 range)
- Increases based on `linkCount` each frame
- Slowly decays when node is idle (> 2 seconds with no links)
- Clamped to 0-120 range
- **Formula:** `newEnergy += energyGainPerLink * linkCount * deltaTime`

### Stability (0-100 scale)
- Derives from `loadRatio` and `linkCount`
- Higher load = lower stability
- More links = stability penalty
- **Formula:** `stability = baseStability + (1-loadRatio)*40 - linkCount*2`

### Harmony (0-100 scale)
- Combination of stability (70% weight) and inverse load stress (30% weight)
- Represents overall node balance
- **Formula:** `harmony = stability*0.7 + (1-loadRatio)*30`

### Clarity (0-100 scale)
- Influenced by stability
- Baseline 50, adjusted ±50 based on stability
- Represents coherence and focus
- **Formula:** `clarity = 50 + (stability*0.5 - 30)`

### Instability (0-100 scale)
- Simple inverse of stability
- **Formula:** `instability = 100 - stability`

### Corruption (0-100 scale)
- Regular nodes: slowly decay
- Sigma-like nodes: continuously increase (15 points/sec)
- Clamped to 0-100 range
- **Special:** Detected via `node.userData.isSigma` flag or category/archetype

### Load Ratio (0-1 scale)
- How many links a node has vs. its maximum capacity
- **Formula:** `loadRatio = min(1, linkCount / loadMax)`

---

## Utility Methods

All nodes have access to these helper methods:

### Get metrics for a specific node
```javascript
const metrics = this.nodeDynamics.getNodeMetrics(node);
if (metrics) {
  console.log('Node energy:', metrics.energy);
}
```

### Reset metrics for a node (after recycling/respawn)
```javascript
this.nodeDynamics.resetNodeMetrics(node);
```

### Get all nodes sorted by a metric
```javascript
// Get most corrupted nodes
const sigma = this.nodeDynamics.getNodesSortedByMetric('corruption', true);

// Get least loaded nodes (ascending)
const available = this.nodeDynamics.getNodesSortedByMetric('loadRatio', false);
```

### Debug dump all metrics
```javascript
this.nodeDynamics.debugDumpAllMetrics();
// Outputs formatted table to console
```

---

## Integration Patterns

### Pattern 1: HUD Display (Read-Only)

```javascript
// In CoreMetricsHUD or similar
update() {
  const metrics = this.game.nodeDynamics.getNodeMetrics(this.selectedNode);
  if (metrics) {
    this.displayEnergy(metrics.energy);
    this.displayStability(metrics.stability);
    this.displayCorruption(metrics.corruption);
  }
}
```

### Pattern 2: AI Decision Making

```javascript
// In AI controller
decideLinkTarget() {
  // Find nodes with best harmony and low load
  const candidates = this.game.nodeDynamics.getNodesSortedByMetric('harmony');
  const bestCandidate = candidates.find(n => {
    const m = this.game.nodeDynamics.getNodeMetrics(n);
    return m && m.loadRatio < 0.8;
  });
  return bestCandidate;
}
```

### Pattern 3: Visual Effects (Energy-Based)

```javascript
// In visual effect system
updateNodeGlow() {
  for (const node of this.aiNodes.nodes) {
    const metrics = this.nodeDynamics.getNodeMetrics(node);
    if (metrics) {
      // Scale glow intensity by energy
      const glowIntensity = metrics.energy / 120;
      node.material.emissiveIntensity = glowIntensity;
    }
  }
}
```

### Pattern 4: Event Triggers

```javascript
// Trigger world events based on metrics
checkForCriticalState() {
  for (const node of this.aiNodes.nodes) {
    const metrics = this.nodeDynamics.getNodeMetrics(node);
    if (metrics && metrics.corruption > 90) {
      // High corruption event
      this.triggerCorruptionEvent(node);
    }
    if (metrics && metrics.stability < 20) {
      // Node instability event
      this.triggerInstabilityEvent(node);
    }
  }
}
```

---

## EMA Smoothing (Why It Matters)

All metrics use **Exponential Moving Average** (EMA) smoothing to prevent flickering and create smooth transitions:

```
EMA(new) = alpha * newValue + (1 - alpha) * previousValue
```

- **Alpha = 0.2 (default):** Smooth, gradual changes (useful for visual feedback)
- **Alpha = 0.4:** Faster response (better for game feel)
- **Alpha = 1.0:** No smoothing (raw values, unrecommended)

You can adjust via config during initialization.

---

## Safety & Architecture

### Pure Read-Only Access
Once updated, `node.userData.metrics` is safe for **unlimited concurrent reads** from any system without locks or synchronization.

### No External Modifications
This module:
- ✅ Never modifies `this.aiNodes` structure
- ✅ Never modifies `this.linkingSystem` state
- ✅ Only writes to `node.userData.metrics` (append-only per frame)
- ✅ Never touches Three.js scene graph, materials, or rendering

### Graceful Degradation
- Missing links return empty metrics
- Nodes without userData are initialized safely
- Sigma detection works with multiple flag patterns
- All ranges clamped to prevent edge cases

---

## Performance Characteristics

- **Time Complexity:** O(N + L) per frame
  - N = number of nodes
  - L = number of links
- **Space Complexity:** O(N) for internal cache
- **Typical Frame Time:** < 1ms for 100 nodes + 500 links

### Optimization Notes
- Metrics computed once per frame (no redundant calculations)
- Link scanning uses direct iteration (no expensive searches)
- EMA smoothing is O(1) per metric
- No garbage allocation per frame (except cache misses on node spawn)

---

## Migration from Old Systems

When you're ready to switch from scattered metrics to this unified system:

1. **Stop calling** old metric computation code
2. **Start calling** `this.nodeDynamics.update(deltaTime)` each frame
3. **Update reads** to use `node.userData.metrics.*` instead of old locations
4. **Test thoroughly** especially sigma node corruption and link-based energy
5. **Benchmark** to verify performance (should be faster)

No breaking changes to existing code—this is purely additive.

---

## Troubleshooting

### Metrics are all zeros
- Check that `nodeDynamics.update(deltaTime)` is called each frame
- Verify `deltaTime > 0`
- Confirm nodes exist in `this.aiNodes.nodes`

### Metrics not updating
- Ensure update() is called before reading
- Check that nodes have `userData` property
- Verify linkingSystem has links array

### Sigma corruption not increasing
- Verify node has `isSigma` flag, or matches category/archetype patterns
- Check `debugDumpAllMetrics()` to see detected nodes
- Adjust `sigmaCorruptionGain` config if gains seem too slow

### Performance degradation
- Check node count hasn't exploded
- Verify link count is reasonable (< 10k)
- Profile with DevTools to confirm NodeDynamicMetrics is the bottleneck

---

## Next Steps

This v1.0 module is the foundation for the v2.0 metrics architecture described in Session 37 audit:

1. **LinkQualityCalculator.js** (read metrics.linkCount, compute quality 0-100)
2. **NodeQualityCalculator.js** (read multiple metrics, output overall quality)
3. **Automatic ML learning loops** (close feedback based on metrics)
4. **Personality evolution triggers** (real-time updates from stability/energy)

All will use `NodeDynamicMetrics` as their reliable input source.

---

## Summary

| Aspect | Detail |
|--------|--------|
| **File** | `/NodeDynamicMetrics.js` |
| **Export** | `NodeDynamicMetrics` class + `getNodeDynamicMetrics()` factory |
| **Init** | `new NodeDynamicMetrics(aiNodes, linkingSystem)` |
| **Update** | `this.nodeDynamics.update(deltaTime)` per frame |
| **Read** | `node.userData.metrics.*` (read-only) |
| **Metrics** | 11 total (3 structural, 6 dynamic, 2 time-based) |
| **EMA Smoothing** | Alpha 0.2 default (configurable) |
| **Complexity** | O(N + L) per frame, < 1ms typical |
| **Thread Safe** | Read-only after update, no locks needed |
| **Breaking Changes** | None—purely additive |

---

## Contact & Questions

If you encounter issues or need clarification on computation logic, refer back to:
- **Audit Session 37:** Identified v2.0 architecture requirements
- **This document:** Integration and usage patterns
- **Code comments:** Detailed formulas and special cases

Happy metrics! 🚀
