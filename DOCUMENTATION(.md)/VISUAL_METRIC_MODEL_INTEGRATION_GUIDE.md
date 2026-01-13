# Visual Metric Model v1.0 Integration Guide

## Overview

**VisualMetricModel_v1.js** is a safe, non-invasive visual adapter layer that normalizes all Phase 3 metrics to shader-friendly 0–1 values. It reads from three Phase 3 sources and writes normalized values to `node.userData.visualMetrics` and `link.userData.visualMetrics`.

**Key Promise:** Zero modifications to existing systems. Purely additive read-only layer.

---

## Quick Integration

### 1. Import the Module

```javascript
import { VisualMetricModel } from "./VisualMetricModel_v1.js";
```

### 2. Initialize in AtomaGame Constructor

```javascript
constructor(scene, camera, renderer) {
  // ... existing code ...

  // Initialize Phase 3 metrics (must be before VisualMetricModel)
  this.nodeDynamics = new NodeDynamicMetrics(this.aiNodes, this.nodeLinkingSystem);
  this.linkQuality = new LinkQualityCalculator(this.nodeLinkingSystem, this.nodeDynamics);
  this.nodeQuality = new NodeQualityCalculator(
    this.aiNodes,
    this.nodeLinkingSystem,
    this.nodeDynamics,
    this.linkQuality
  );

  // Initialize visual metrics (after all Phase 3 systems)
  this.visualMetrics = new VisualMetricModel(
    this.aiNodes,
    this.nodeLinkingSystem,
    this.nodeDynamics,
    this.nodeQuality,
    this.linkQuality
  );
}
```

### 3. Call Update in Game Loop

In your `update(dt)` method, call VisualMetricModel after all metric systems:

```javascript
update(dt) {
  // Update Phase 3 metrics first
  this.nodeDynamics.update(dt);
  this.linkQuality.update(dt);
  this.nodeQuality.update(dt);

  // Then update visual metrics
  this.visualMetrics.update(dt);

  // ... rest of game update ...
}
```

**Important:** Update order matters! VisualMetricModel depends on all Phase 3 systems being up-to-date.

---

## Output Structure

### Node Visual Metrics

After `visualMetrics.update()`, every node has:

```javascript
node.userData.visualMetrics = {
  // Normalized 0–1 values for all metrics
  synergyNorm: 0.0–1.0,        // Proxy for connected harmony
  stabilityNorm: 0.0–1.0,      // From NodeDynamicMetrics
  harmonyNorm: 0.0–1.0,        // From NodeDynamicMetrics
  corruptionNorm: 0.0–1.0,     // From NodeDynamicMetrics
  energyNorm: 0.0–1.0,         // From NodeDynamicMetrics (already normalized)
  clarityNorm: 0.0–1.0,        // From NodeDynamicMetrics
  instabilityNorm: 0.0–1.0,    // From NodeDynamicMetrics
  loadNorm: 0.0–1.0,           // From NodeDynamicMetrics (already normalized)
  qualityNorm: 0.0–1.0,        // From NodeQualityCalculator (0–100 normalized)
  isPrime: boolean,             // True if quality level is "Prime"
  isCritical: boolean,          // True if quality level is "Critical"
  updatedAt: timestamp,         // Last update time
};
```

### Link Visual Metrics

After `visualMetrics.update()`, every link has:

```javascript
link.userData.visualMetrics = {
  // Normalized 0–1 values
  qualityNorm: 0.0–1.0,        // From LinkQualityCalculator (0–100 normalized)
  stressNorm: 0.0–1.0,         // 1 - (structuralScore / 100)
  updatedAt: timestamp,        // Last update time
};
```

---

## Usage Examples

### Example 1: Color a Node by Quality Level

```javascript
// In a visual system or shader setup
const visualMtx = node.userData.visualMetrics;

if (visualMtx) {
  let color;
  if (visualMtx.isPrime) {
    color = new THREE.Color(0x00ff00); // Bright green
  } else if (visualMtx.isCritical) {
    color = new THREE.Color(0xff0000); // Bright red
  } else {
    // Lerp between colors based on qualityNorm
    const h = visualMtx.qualityNorm * 0.3; // Hue from red to yellow
    color = new THREE.Color().setHSL(h, 1.0, 0.5);
  }

  node.material.color = color;
}
```

### Example 2: Set Emissive Intensity Based on Harmony

```javascript
const visualMtx = node.userData.visualMetrics;

if (visualMtx) {
  // Combine harmony and energy for brightness
  const emissiveIntensity = (visualMtx.harmonyNorm * 0.7 + visualMtx.energyNorm * 0.3) * 2.0;

  node.material.emissiveIntensity = emissiveIntensity;
}
```

### Example 3: Scale a Link by Quality

```javascript
const visualMtx = link.userData.visualMetrics;

if (visualMtx) {
  // High quality links are thicker
  const lineWidth = 1.0 + visualMtx.qualityNorm * 3.0; // 1.0 to 4.0

  link.material.linewidth = lineWidth;
}
```

### Example 4: Animate Based on Synergy

```javascript
const visualMtx = node.userData.visualMetrics;

if (visualMtx) {
  // Nodes with high synergy pulse faster
  const pulseFrequency = 1.0 + visualMtx.synergyNorm * 5.0; // 1 to 6 Hz

  const pulseStrength = Math.sin(Date.now() * 0.001 * pulseFrequency) * 0.5 + 0.5;

  node.material.emissiveIntensity = 1.0 + pulseStrength;
}
```

---

## Normalization Rules

All metrics are normalized using these rules:

### From 0–100 Scale

```javascript
normalized = Math.max(0, Math.min(1, raw / 100))
```

Examples:
- `stability: 85` → `stabilityNorm: 0.85`
- `harmony: 60` → `harmonyNorm: 0.60`
- `corruption: 25` → `corruptionNorm: 0.25`
- `quality: 100` → `qualityNorm: 1.0`

### Already 0–1 Scale

```javascript
normalized = Math.max(0, Math.min(1, raw))
```

Examples:
- `energyNorm: 0.75` → `energyNorm: 0.75` (already normalized)
- `loadRatio: 0.5` → `loadNorm: 0.5` (already normalized)

### Computed Values

**synergyNorm:** Proxy for connection quality

```javascript
synergyNorm = (harmony * 0.6 + stability * 0.4) / 100
```

**stressNorm:** Inverse of link structural quality

```javascript
stressNorm = (100 - structuralScore) / 100
```

---

## Safety Features

### 1. Defensive Programming

- Optional chaining throughout (`?.`)
- Null/undefined checks before every extraction
- Safe defaults on initialization
- No modifications to source systems

### 2. Error Handling

- Try/catch blocks wrap extraction logic
- Individual node/link errors don't crash the system
- Errors logged but processing continues
- NaN/Infinity values automatically repaired

### 3. Performance Tracking

```javascript
// Check performance stats
const stats = visualMetrics.getPerformanceStats();
console.log(`Avg frame: ${stats.averageFrameMs.toFixed(2)}ms`);
console.log(`Budget usage: ${stats.budgetUsagePercent}%`);

// Reset if needed
visualMetrics.resetPerformanceStats();
```

### 4. System Status Check

```javascript
// Verify all systems initialized
const status = visualMetrics.getSystemStatus();
if (!status.allReady) {
  console.warn("Not all Phase 3 systems ready:", status);
}
```

---

## Debugging

### Get Metrics for a Specific Node

```javascript
const metrics = visualMetrics.getNodeVisualMetrics(myNode);
console.log("Node visual metrics:", metrics);
// Output:
// {
//   qualityNorm: 0.85,
//   stabilityNorm: 0.70,
//   harmonyNorm: 0.65,
//   ...
//   isPrime: true,
//   updatedAt: 1234567890
// }
```

### Get Metrics for a Specific Link

```javascript
const metrics = visualMetrics.getLinkVisualMetrics(myLink);
console.log("Link visual metrics:", metrics);
```

### Monitor Performance in Console

```javascript
// In your game loop or console
const stats = this.game.visualMetrics.getPerformanceStats();
console.table(stats);
```

---

## Integration Checklist

- [ ] Import VisualMetricModel_v1.js
- [ ] Initialize after all Phase 3 systems (nodeDynamics, linkQuality, nodeQuality)
- [ ] Call update(dt) in game loop after Phase 3 systems
- [ ] Verify system status with `getSystemStatus()`
- [ ] Test with a single node/link using `getNodeVisualMetrics()` / `getLinkVisualMetrics()`
- [ ] Integrate with first visual system (e.g., CoreMetricsHUD)
- [ ] Monitor performance stats
- [ ] Deploy progressively to other VFX systems

---

## Migration Path

### Phase 3b Visual Refactor Strategy

1. **Week 1:** Wrap ComputeSynergyScore2_0 with VisualMetricModel
2. **Week 2:** Update LinkGlowSynergyEngine to read from visualMetrics
3. **Week 3:** Migrate CoreMetricsCalculator to use normalized values
4. **Week 4:** Polish colors, intensity, and effects

Each VFX system can be migrated independently without affecting others.

---

## FAQ

**Q: Does VisualMetricModel modify existing systems?**

A: No. It reads from NodeDynamicMetrics, LinkQualityCalculator, and NodeQualityCalculator only. All writes are to the new `visualMetrics` property.

**Q: What if a node doesn't have metrics yet?**

A: VisualMetricModel uses safe defaults (0.5 for normalized values, false for booleans) and skips the node without crashing.

**Q: Can I use visualMetrics in shaders?**

A: Not directly—shaders can't read JavaScript objects. Pass visualMetrics values to shaders via uniforms or vertex colors. See "Usage Examples" for patterns.

**Q: What's the performance impact?**

A: Typically <1ms per frame for 100 nodes + 500 links. Use `getPerformanceStats()` to verify in your project.

**Q: Can I customize normalization rules?**

A: Yes, extend the class and override `_extractNodeMetrics()` and `_extractLinkMetrics()` methods.

---

## Next Steps

1. Integrate VisualMetricModel into AtomaGame
2. Test with debug output
3. Migrate ComputeSynergyScore2_0 to use visualMetrics
4. Update LinkGlowSynergyEngine
5. Gradually roll out to remaining VFX systems

See **REFACTOR_PREPARATION_PLAN.md** for the 4-week Phase 3b strategy.
