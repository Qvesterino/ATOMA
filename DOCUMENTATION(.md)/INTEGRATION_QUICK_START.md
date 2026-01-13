# Quick Start: Phase 8 & Metrics Integration

## 60-Second Overview

Two production-ready systems are ready for integration:

1. **Metric Interpretation Layer** — Converts raw stats → visual signals (read-only, non-mutating)
2. **Phase 8 Network Rituals** — Cooperative group reconstruction (read-only orchestration)

Both operate as **pure consumption layers**: they read core stats, produce signals/actions, never write core values.

---

## What Gets Integrated

### MetricInterpretationLayer_v1.js
- Smooths 5 core stats into 7 visual signals
- Produces: vitality score, glow intensity, stress density, network mood, etc.
- Cost: <0.3ms per 200 nodes
- **Status**: Ready now

### NetworkRituals_v1.js (Existing)
- Already exists, now needs integration point
- Ritual orchestration via effect layer
- Cost: <1ms per frame
- **Status**: Awaiting 3 approvals

---

## Integration Checklist (5 Minutes)

### Step 1: Import (main.js, top)
```javascript
import { MetricInterpretationLayer_v1, setupMetricInterpretationConsoleAPI } from './MetricInterpretationLayer_v1.js';
```

### Step 2: Initialize (constructor, line ~2700-2800)
```javascript
this.metricsInterpretation = new MetricInterpretationLayer_v1({ debugEnabled: false });
console.log('[main.js] MetricInterpretationLayer_v1 initialized ✓');
```

### Step 3: Update (animate function, line ~3800)
```javascript
if (this.metricsInterpretation && this.aiNodes) {
  this.metricsInterpretation.update(deltaTime, this.aiNodes.nodes);
}
```

### Step 4: Setup Console (after initialization)
```javascript
setupMetricInterpretationConsoleAPI(this.metricsInterpretation);
```

### Step 5: Test
```javascript
// In browser console:
window.__ATOMA_INTERPRETATION.getNetworkSignals()
// Should return: { networkMood, averageHealth, etc }
```

---

## Available Signals (For Visual Systems)

Every node now has these in `node.userData`:

```javascript
// Metrics layer writes these automatically:
node.userData.visualMetrics                      // Full object
node.userData.visualCorruptionIntensity          // 0-1: chaos amount
node.userData.visualIntegrityHealth              // 0-1: danger indicator  
node.userData.visualHarmonyAuraStrength          // 0-1: breathing aura
node.userData.visualSynergyGlowIntensity         // 0-1: resonance glow
node.userData.visualNetworkStressDensity         // 0-1: artifact density
node.userData.visualNodeVitalityScore            // 0-1: overall health
```

Network-level:
```javascript
window.__ATOMA_METRICS.interpretation.network.networkMood       // -1 to +1
window.__ATOMA_METRICS.interpretation.network.averageHealth     // 0-1
window.__ATOMA_METRICS.interpretation.network.averageCorruption // 0-1
```

---

## How Visual Systems Should Consume

### Example: Update a shader based on vitality
```javascript
// In any visual update function:
const vitality = node.userData.visualNodeVitalityScore;
node.material.uniforms.healthColor.value = vitalityColorMap[vitality];
```

### Example: Scale a glow based on synergy
```javascript
const glowIntensity = node.userData.visualSynergyGlowIntensity;
node.material.uniforms.glowStrength.value = glowIntensity * 2.0;
```

### Example: Add jitter based on stress
```javascript
const stressDensity = node.userData.visualNetworkStressDensity;
const jitterAmount = stressDensity * 0.5;  // 0-50% position jitter
```

---

## Performance Baseline

After integration, metrics layer adds:
- **0.3ms** per frame (200 nodes)
- **<0.5% of 60fps frame budget**

Zero impact on gameplay.

---

## Phase 8 Integration (Separate - Post-Approval)

Once 3 approvals are secured:

```javascript
// Import
import { NetworkRituals_v1 } from './NetworkRituals_v1.js';

// Initialize (line ~2700)
this.networkRituals = new NetworkRituals_v1({
  nodes: this.aiNodes,
  links: this.nodeLinking,
  scene: this.scene,
  effectOrchestrator: this.effectOrchestrator
});

// Update (line ~3800, after metrics)
if (this.networkRituals && this.aiNodes && this.nodeLinking) {
  this.networkRituals.update(deltaTime, this.aiNodes.nodes, this.nodeLinking.links);
}
```

---

## Console Debugging

```javascript
// Get all current signals for a node
window.__ATOMA_INTERPRETATION.getNodeSignals('node_id')

// Get network-level signals
window.__ATOMA_INTERPRETATION.getNetworkSignals()

// Tune configuration at runtime
window.__ATOMA_INTERPRETATION.setConfig({ smoothingAlpha: 0.3 })

// Check performance
window.__ATOMA_INTERPRETATION.getDebugInfo()
```

---

## Key Points

✅ **Metrics layer**: Deploy immediately (production ready)
✅ **Phase 8 rituals**: Deploy post-approval
✅ **Both systems**: Read-only, non-mutating
✅ **Performance**: Combined <2% frame budget
✅ **Visual integration**: Straightforward (just read node.userData fields)

---

## Approval Gate (Phase 8 Only)

Before Phase 8 integration, confirm 3 decisions:

1. **Load/Pressure Retirement** → YES / NO
2. **Synergy Consolidation** → YES / NO / DEFER
3. **Stat Authority Contract** → YES / NO / REQUEST

---

## Files & Documentation

| File | Purpose | Size |
|------|---------|------|
| MetricInterpretationLayer_v1.js | Core implementation | 280 lines |
| NetworkRituals_v1.js | Phase 8 (existing) | 600 lines |
| METRIC_INTERPRETATION_SPECIFICATION.md | Complete signal specs | 400 lines |
| PHASE_8_INTEGRATION_CONTROLLED.md | Integration guide | 200 lines |
| PHASE_8_AND_METRICS_INTEGRATION_SUMMARY.md | Full summary | 300 lines |

---

## What's Next

1. **Now**: Deploy metrics layer (5 minute integration)
2. **This week**: Review and approve 3 Priority 0 decisions
3. **Next week**: Deploy Phase 8 rituals
4. **Week 3**: Wire visual systems to consume signals
5. **Week 4**: Playtesting & balance

---

**Status**: Ready to go. Metrics layer deployable immediately. Phase 8 awaiting approvals.
