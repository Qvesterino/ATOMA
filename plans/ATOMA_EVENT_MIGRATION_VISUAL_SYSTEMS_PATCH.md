# ATOMA EVENT MIGRATION — VISUAL SYSTEMS

**Date:** 2026-03-15  
**Type:** READ-ONLY ANALYSIS & PATCH PLAN  
**Status:** ARCHITECTURAL ANALYSIS ONLY

---

## EXECUTIVE SUMMARY

**Goal:** Migrate 7 polling VFX systems from 30Hz metric polling to SemanticEventBus subscriptions.

**Current State:**
- 7 visual systems poll `node.userData.metrics` at 30Hz
- MetricsRuntime_v1 emits `metric.node.updated` but no consumers
- Massive performance waste: 7 systems × 30Hz × N nodes = unnecessary CPU load

**Target State:**
- Visual systems subscribe to `metric.node.updated` events
- Updates only triggered when metrics actually change
- Fallback polling retained if SemanticBus unavailable

**Estimated Performance Gain:** 70-90% reduction in metric polling overhead

---

## KROK 1: SYSTEM INVENTORY

### Target Systems (7 total)

| # | System | Current Frequency | Polls | Should Subscribe To |
|---|--------|-------------------|-------|---------------------|
| 1 | **HarmonicNodeResonanceHalos.js** | 30 Hz | `node.userData.metrics.harmony` | `event:harmonyResonance` |
| 2 | **SynergyCascadeVisualizer.js** | 30 Hz | `node.userData.metrics.synergy` | `event:synergyCascade` |
| 3 | **NodeDynamicMetrics.js** | 30 Hz | `node.userData.metrics` (all) | `metric.node.updated` |
| 4 | **SafeMetricsFX1_1.js** | 30 Hz | `node.userData.metrics` (all) | `metric.node.updated` |
| 5 | **_AdaptiveGlyphRendering1_0.js** | 30 Hz | `node.userData.metrics` (all) | `metric.node.updated` |
| 6 | **_ExtremeAINodeEvolution3.js** | 30 Hz | `node.userData.metrics.synergy, harmony` | `event:synergyCascade`, `event:harmonyResonance` |
| 7 | **_ExtremeAIShaderPack.js** | 30 Hz | `node.userData.metrics` (all) | `metric.node.updated` |

---

## KROK 2: CURRENT POLLING PATTERNS

### System 1: HarmonicNodeResonanceHalos.js

**Current Implementation:**
```javascript
update(deltaTime, nodeRegistry, hubSystemData, harmonicManagerData = null) {
  nodeRegistry.forEach((node, nodeId) => {
    // Polls metrics from node.userData.metrics
    const hubState = this.getHubState(nodeId, hubSystemData, harmonicManagerData, node);
    // hubState.harmony = metrics.harmony ?? state.harmony;
    // hubState.synergy = metrics.synergy ?? state.synergy;
  });
}

getHubState(nodeId, hubSystemData, harmonicManagerData, node) {
  const state = { ... };
  const metrics = node.userData.metrics || {};
  state.harmony = metrics.harmony ?? state.harmony;
  state.synergy = metrics.synergy ?? state.synergy;
  return state;
}
```

**Polling Location:** Lines 434-436  
**Frequency:** 30 Hz (called every frame)  
**Nodes Processed:** All nodes in registry (15-50 nodes)

---

### System 2: SynergyCascadeVisualizer.js

**Current Implementation:**
```javascript
update(deltaTime) {
  // Event-driven path (already partially implemented)
  this.processPendingSynergyUpdates();
  
  // Polling fallback (runs every pollingStrideFrames)
  if (this.pendingSynergyUpdates.size === 0 && 
      (this.frameCounter % this.pollingStrideFrames === 0)) {
    this.detectCascadeSources();
  }
}

detectCascadeSources() {
  const nodes = this.linkingSystem.aiNodes.nodes || [];
  for (const node of nodes) {
    const synergy = this.getNodeSynergy(node); // Polls node.userData.metrics.synergy
    this.upsertCascadeForNode(node, synergy);
  }
}

// ALREADY HAS SEMANTIC BUS BINDING (partial)
bindSemanticEvents() {
  const semanticBus = globalThis?.semanticBus;
  if (!semanticBus) return;
  
  this._semanticHandler = (payload = {}) => {
    if (payload?.metric !== 'synergy') return;
    // Process synergy update
  };
  
  semanticBus.on('metric.node.updated', this._semanticHandler);
}
```

**Polling Location:** Line 167 (`getNodeSynergy`)  
**Frequency:** 30 Hz (but throttled by `pollingStrideFrames`)  
**Status:** PARTIALLY MIGRATED - has SemanticBus binding but still polls as fallback

---

### System 3: NodeDynamicMetrics.js

**Current Implementation:**
```javascript
// ALREADY HAS SEMANTIC BUS SUBSCRIPTION (complete)
subscribeToMetricUpdates(semanticBus) {
  const handler = (payload) => {
    const { nodeId, metric, value } = payload;
    // Process metric update
  };
  
  this._metricSubscriptionDisposer = 
    semanticBus.subscribe('metric.node.updated', handler);
  this._hasMetricSubscription = true;
}

_sanitizeMetric(metric, value) {
  if (typeof value !== 'number' || !isFinite(value)) return null;
  switch (metric) {
    case 'synergy':
    case 'harmony':
    case 'stability':
    case 'corruption':
    case 'loadPressure':
      return this._clamp01(value);
    default:
      return null;
  }
}
```

**Status:** FULLY MIGRATED - already subscribes to `metric.node.updated`  
**No Changes Needed:** This system is already event-driven

---

### System 4: SafeMetricsFX1_1.js

**Current Implementation:**
```javascript
applyNodeMetricsFX(node) {
  if (!node || !node.userData) return;
  
  const metrics = node.userData.metrics; // POLLING
  const nodeId = node.uuid;
  
  let state = this.appliedFX.get(nodeId);
  if (!state) {
    state = {
      harmony: 0,
      instability: 0,
      energy: 0,
      corruption: 0,
    };
    this.appliedFX.set(nodeId, state);
  }
  
  // Updates state from metrics
  state.harmony = metrics.harmony ?? state.harmony;
  state.corruption = metrics.corruption ?? state.corruption;
  // ...
}
```

**Polling Location:** Line 78 (`node.userData.metrics`)  
**Frequency:** 30 Hz (called from update loop)  
**Status:** NOT MIGRATED - pure polling

---

### System 5: _AdaptiveGlyphRendering1_0.js

**Current Implementation:**
```javascript
// Documentation shows it reads metrics:
// - node.userData.metrics.synergy (0-1)
// - node.userData.metrics.harmony (0-1)
// - node.userData.metrics.corruption (0-1)
// - node.userData.metrics.stability (0-1)
// - node.userData.metrics.loadPressure (0-1)

// Actual polling location: needs investigation
// Likely in update() or render() method
```

**Polling Location:** Unknown (needs investigation)  
**Frequency:** 30 Hz (assumed)  
**Status:** NOT MIGRATED - likely pure polling

---

### System 6: _ExtremeAINodeEvolution3.js

**Current Implementation:**
```javascript
const node = Array.from(this.evolutionMap.entries())
  .find(([n, data]) => data === evoData)?.[0];

if (node?.userData?.metrics) {
  // Polls metrics for evolution transitions
  const synergy = node.userData.metrics.synergy || 0;
  const harmony = node.userData.metrics.harmony || 0;
  
  if (synergy > this.synergyThresholds.stage2 && 
      harmony > this.harmonicThresholds.stage2) {
    evoData.stage = 2; // ASCENDED
  } else if (synergy > this.synergyThresholds.stage1 && 
             harmony > this.harmonicThresholds.stage1) {
    evoData.stage = 1; // EVOLVING
  }
}
```

**Polling Location:** Lines 136-137  
**Frequency:** 30 Hz (assumed)  
**Status:** NOT MIGRATED - pure polling

---

### System 7: _ExtremeAIShaderPack.js

**Current Implementation:**
```javascript
updateMetricsUniforms(node, material) {
  if (!material.uniforms) return;
  
  const metrics = node.userData.metrics; // POLLING
  if (!metrics) return;
  
  const synergy = metrics.synergy || 0;
  const harmony = metrics.harmony || 0;
  const corruption = metrics.corruption || 0;
  const stability = metrics.stability || 0;
  
  // Update metric uniforms
  if (material.uniforms.u_synergy) {
    material.uniforms.u_synergy.value = Math.min(1, synergy);
  }
  if (material.uniforms.u_harmony) {
    material.uniforms.u_harmony.value = Math.min(1, harmony);
  }
  // ...
}
```

**Polling Location:** Line 121 (`node.userData.metrics`)  
**Frequency:** 30 Hz (called from update loop)  
**Status:** NOT MIGRATED - pure polling

---

## KROK 3: MIGRATION PATTERN

### Standard Migration Pattern

```javascript
// BEFORE: Polling in update()
update(deltaTime) {
  this.nodes.forEach(node => {
    const metrics = node.userData.metrics;
    this.processNodeMetrics(node, metrics);
  });
}

// AFTER: Event-driven with fallback
constructor(scene, semanticBus = null) {
  this.scene = scene;
  this.semanticBus = semanticBus;
  this._useEventDriven = false;
  this._dirtyNodes = new Set(); // Track nodes needing updates
  
  // Try to subscribe to SemanticBus
  this._trySubscribeToMetrics();
}

_trySubscribeToMetrics() {
  if (!this.semanticBus) {
    console.warn('[SystemName] SemanticBus not available, using polling fallback');
    return;
  }
  
  const subscribe = this.semanticBus.subscribe?.bind(this.semanticBus) || 
                    this.semanticBus.on?.bind(this.semanticBus);
  
  if (!subscribe) {
    console.warn('[SystemName] SemanticBus.subscribe not available, using polling fallback');
    return;
  }
  
  try {
    this._metricHandler = (payload) => {
      const { nodeId, metric, value } = payload;
      this._handleMetricUpdate(nodeId, metric, value);
    };
    
    this._metricSubscriptionDisposer = 
      subscribe('metric.node.updated', this._metricHandler);
    
    this._useEventDriven = true;
    console.log('[SystemName] Subscribed to metric.node.updated');
  } catch (error) {
    console.error('[SystemName] Failed to subscribe to SemanticBus:', error);
    this._useEventDriven = false;
  }
}

_handleMetricUpdate(nodeId, metric, value) {
  // Mark node as dirty for targeted update
  this._dirtyNodes.add(nodeId);
}

update(deltaTime) {
  if (this._useEventDriven) {
    // Event-driven path: only update dirty nodes
    this._processDirtyNodes();
  } else {
    // Polling fallback: scan all nodes
    this._pollAllNodes();
  }
}

_processDirtyNodes() {
  for (const nodeId of this._dirtyNodes) {
    const node = this._getNodeById(nodeId);
    if (node) {
      const metrics = node.userData.metrics;
      this.processNodeMetrics(node, metrics);
    }
  }
  this._dirtyNodes.clear();
}

_pollAllNodes() {
  this.nodes.forEach(node => {
    const metrics = node.userData.metrics;
    this.processNodeMetrics(node, metrics);
  });
}

dispose() {
  if (this._metricSubscriptionDisposer) {
    this._metricSubscriptionDisposer();
    this._metricSubscriptionDisposer = null;
  }
  this._dirtyNodes.clear();
}
```

---

## KROK 4: SYSTEM-SPECIFIC PATCHES

### PATCH 1: HarmonicNodeResonanceHalos.js

**File:** `HarmonicNodeResonanceHalos.js`  
**Lines to Modify:** Constructor, add new methods  
**Event to Subscribe:** `event:harmonyResonance` (specific to harmony) OR `metric.node.updated`

**Handler Payload:**
```javascript
{
  nodeId: "node-123",
  metric: "harmony",
  value: 0.85
}
```

**Migration Steps:**

1. Add SemanticBus injection to constructor
2. Add `_trySubscribeToHarmonyEvents()` method
3. Add `_handleHarmonyUpdate(nodeId, value)` method
4. Add `_dirtyNodes` Set to track affected nodes
5. Modify `update()` to check event-driven vs polling mode
6. Add `dispose()` method to cleanup subscription

**Fallback Behavior:**
- If SemanticBus unavailable → continue polling all nodes in `update()`
- If subscription fails → log warning, fall back to polling

**Expected Performance Gain:** 95% reduction in metric reads (only update nodes with harmony changes)

---

### PATCH 2: SynergyCascadeVisualizer.js

**File:** `SynergyCascadeVisualizer.js`  
**Lines to Modify:** Already has partial SemanticBus binding  
**Event to Subscribe:** `event:synergyCascade` (specific to synergy) OR `metric.node.updated`

**Current State:**
- Has `bindSemanticEvents()` method
- Subscribes to `metric.node.updated`
- Already processes pending updates
- Still polls as fallback

**Migration Steps:**

1. **NO CHANGES NEEDED** - Already partially migrated
2. Optional: Remove polling fallback if event coverage is sufficient
3. Optional: Add `event:synergyCascade` subscription for threshold-based updates

**Fallback Behavior:**
- Already implemented: polls if no pending updates

**Expected Performance Gain:** Already 70-90% reduction (event-driven path active)

---

### PATCH 3: NodeDynamicMetrics.js

**File:** `NodeDynamicMetrics.js`  
**Status:** FULLY MIGRATED - No changes needed

**Current State:**
- Subscribes to `metric.node.updated`
- Has proper handler with sanitization
- Has disposal mechanism

**Action:** DOCUMENT AS REFERENCE IMPLEMENTATION

---

### PATCH 4: SafeMetricsFX1_1.js

**File:** `SafeMetricsFX1_1.js`  
**Lines to Modify:** Constructor, add new methods  
**Event to Subscribe:** `metric.node.updated`

**Handler Payload:**
```javascript
{
  nodeId: "node-123",
  metric: "harmony",  // or "synergy", "corruption", etc.
  value: 0.85
}
```

**Migration Steps:**

1. Add SemanticBus injection to constructor
2. Add `_trySubscribeToMetricUpdates()` method
3. Add `_handleMetricUpdate(nodeId, metric, value)` method
4. Add `_dirtyNodes` Set to track affected nodes
5. Modify `applyNodeMetricsFX()` to be called per-node instead of scanning all
6. Add `dispose()` method to cleanup subscription

**Fallback Behavior:**
- If SemanticBus unavailable → continue calling `applyNodeMetricsFX()` for all nodes

**Expected Performance Gain:** 90% reduction in metric reads (only update nodes with metric changes)

---

### PATCH 5: _AdaptiveGlyphRendering1_0.js

**File:** `_AdaptiveGlyphRendering1_0.js`  
**Lines to Modify:** Constructor, add new methods  
**Event to Subscribe:** `metric.node.updated`

**Handler Payload:**
```javascript
{
  nodeId: "node-123",
  metric: "synergy",  // or "harmony", "corruption", etc.
  value: 0.85
}
```

**Migration Steps:**

1. Add SemanticBus injection to constructor
2. Add `_trySubscribeToMetricUpdates()` method
3. Add `_handleMetricUpdate(nodeId, metric, value)` method
4. Add `_dirtyNodes` Set to track affected nodes
5. Modify update/render loop to process only dirty nodes
6. Add `dispose()` method to cleanup subscription

**Fallback Behavior:**
- If SemanticBus unavailable → continue current polling behavior

**Expected Performance Gain:** 85% reduction in metric reads (only update nodes with metric changes)

---

### PATCH 6: _ExtremeAINodeEvolution3.js

**File:** `_ExtremeAINodeEvolution3.js`  
**Lines to Modify:** Constructor, evolution logic  
**Event to Subscribe:** `event:synergyCascade`, `event:harmonyResonance`

**Handler Payload:**
```javascript
{
  nodeId: "node-123",
  metric: "synergy",  // or "harmony"
  value: 0.85
}
```

**Migration Steps:**

1. Add SemanticBus injection to constructor
2. Add `_trySubscribeToEvolutionEvents()` method
3. Add `_handleSynergyUpdate(nodeId, value)` method
4. Add `_handleHarmonyUpdate(nodeId, value)` method
5. Add `_dirtyNodes` Set to track affected nodes
6. Modify evolution logic to process only dirty nodes
7. Add `dispose()` method to cleanup subscription

**Fallback Behavior:**
- If SemanticBus unavailable → continue polling metrics in evolution loop

**Expected Performance Gain:** 80% reduction in metric reads (only update nodes with synergy/harmony changes)

---

### PATCH 7: _ExtremeAIShaderPack.js

**File:** `_ExtremeAIShaderPack.js`  
**Lines to Modify:** Constructor, add new methods  
**Event to Subscribe:** `metric.node.updated`

**Handler Payload:**
```javascript
{
  nodeId: "node-123",
  metric: "synergy",  // or "harmony", "corruption", etc.
  value: 0.85
}
```

**Migration Steps:**

1. Add SemanticBus injection to constructor
2. Add `_trySubscribeToMetricUpdates()` method
3. Add `_handleMetricUpdate(nodeId, metric, value)` method
4. Add `_dirtyNodes` Set to track affected nodes
5. Modify `updateMetricsUniforms()` to be called per-node instead of scanning all
6. Add `dispose()` method to cleanup subscription

**Fallback Behavior:**
- If SemanticBus unavailable → continue calling `updateMetricsUniforms()` for all nodes

**Expected Performance Gain:** 90% reduction in metric reads (only update nodes with metric changes)

---

## KROK 5: METRICSRUNTIME_V1.JS EMITTER REQUIREMENTS

### Required Event Emissions

**File:** `MetricsRuntime_v1.js`  
**Current State:** Emits `metric.node.updated` but payload format unclear

**Required Payload Format:**
```javascript
semanticBus.emit('metric.node.updated', {
  nodeId: "node-123",           // REQUIRED: Node identifier
  metric: "harmony",            // REQUIRED: Metric name
  value: 0.85,                  // REQUIRED: New value (0-1)
  timestamp: performance.now()   // OPTIONAL: Timestamp
});
```

**Current Emission (Line 551):**
```javascript
semanticBus.emit('metric.node.updated', {
  nodeId,
  // ... other fields
});
```

**Verification Needed:**
- Does current emission include `metric` field?
- Does current emission include `value` field?
- If not, add these fields to payload

---

## KROK 6: IMPLEMENTATION PRIORITY

### PHASE 1: Quick Wins (Already Migrated)

1. **NodeDynamicMetrics.js** - NO CHANGES (reference implementation)
2. **SynergyCascadeVisualizer.js** - MINIMAL CHANGES (already event-driven)

**Estimated Effort:** 1-2 hours  
**Expected Performance Gain:** Already achieved (70-90%)

---

### PHASE 2: High Impact (30Hz Systems)

3. **SafeMetricsFX1_1.js** - HIGH PRIORITY
4. **HarmonicNodeResonanceHalos.js** - HIGH PRIORITY
5. **_ExtremeAIShaderPack.js** - HIGH PRIORITY

**Estimated Effort:** 4-6 hours  
**Expected Performance Gain:** 85-95% reduction in metric polling

---

### PHASE 3: Medium Impact

6. **_AdaptiveGlyphRendering1_0.js** - MEDIUM PRIORITY
7. **_ExtremeAINodeEvolution3.js** - MEDIUM PRIORITY

**Estimated Effort:** 3-4 hours  
**Expected Performance Gain:** 80-85% reduction in metric polling

---

### PHASE 4: MetricsRuntime_v1 Emitter Fix

8. **MetricsRuntime_v1.js** - Verify and fix payload format

**Estimated Effort:** 1 hour  
**Risk:** LOW (just verify payload format)

---

## KROK 7: TESTING STRATEGY

### Unit Tests (Per System)

1. **SemanticBus Subscription Test:**
   - Verify subscription is created on init
   - Verify handler receives correct payload
   - Verify handler marks node as dirty

2. **Event-Driven Update Test:**
   - Emit `metric.node.updated` event
   - Verify only affected node is updated
   - Verify other nodes are not touched

3. **Fallback Polling Test:**
   - Disable SemanticBus
   - Verify system falls back to polling
   - Verify all nodes are updated

4. **Disposal Test:**
   - Call `dispose()`
   - Verify subscription is cleaned up
   - Verify no memory leaks

### Integration Tests

1. **End-to-End Flow:**
   - MetricsRuntime_v1 emits event
   - Visual system receives event
   - Visual system updates only affected node
   - Verify visual changes are correct

2. **Performance Test:**
   - Measure CPU usage before migration
   - Measure CPU usage after migration
   - Verify 70-90% reduction in metric polling overhead

---

## KROK 8: RISK ASSESSMENT

### LOW RISK

- **NodeDynamicMetrics.js** - Already migrated, no changes
- **SynergyCascadeVisualizer.js** - Already partially migrated, minimal changes

### MEDIUM RISK

- **SafeMetricsFX1_1.js** - Well-structured system, straightforward migration
- **_ExtremeAIShaderPack.js** - Shader updates are isolated, low coupling

### HIGH RISK

- **HarmonicNodeResonanceHalos.js** - Complex halo logic, multiple data sources
- **_AdaptiveGlyphRendering1_0.js** - Unknown polling location, needs investigation
- **_ExtremeAINodeEvolution3.js** - Evolution logic is complex, threshold-based

### MITIGATION STRATEGIES

1. **Incremental Migration:** Migrate one system at a time
2. **Fallback Retention:** Always keep polling as fallback
3. **Comprehensive Testing:** Test each system thoroughly before proceeding
4. **Rollback Plan:** Keep original code commented out for easy rollback

---

## KROK 9: SUCCESS METRICS

### Performance Metrics

1. **Metric Polling Reduction:**
   - Target: 70-90% reduction in `node.userData.metrics` reads
   - Measurement: Count metric reads per second before/after

2. **CPU Usage Reduction:**
   - Target: 10-15% reduction in frame time
   - Measurement: Profile frame time before/after

3. **Memory Usage:**
   - Target: No increase (or decrease due to less GC pressure)
   - Measurement: Monitor memory usage over time

### Functional Metrics

1. **Visual Correctness:**
   - All visual effects work correctly
   - No visual glitches or missing updates

2. **Event Coverage:**
   - All metric changes trigger visual updates
   - No missed updates

3. **Fallback Reliability:**
   - Polling fallback works when SemanticBus unavailable
   - No system failures when SemanticBus down

---

## KROK 10: DEPENDENCIES

### Required Dependencies

1. **SemanticEventBus** - Must be available and functional
2. **MetricsRuntime_v1** - Must emit events with correct payload format
3. **Node Identification** - Systems must be able to map `nodeId` to node objects

### Blocking Issues

1. **MetricsRuntime_v1 Payload Format** - Verify payload includes `metric` and `value` fields
2. **Node ID Consistency** - Ensure all systems use same node ID format
3. **SemanticBus Availability** - Ensure SemanticBus is initialized before systems

---

## SUMMARY

**Total Systems to Migrate:** 7  
**Already Migrated:** 2 (NodeDynamicMetrics, SynergyCascadeVisualizer)  
**Needs Migration:** 5 (SafeMetricsFX, HarmonicNodeResonanceHalos, _ExtremeAIShaderPack, _AdaptiveGlyphRendering, _ExtremeAINodeEvolution)

**Estimated Total Effort:** 8-12 hours  
**Expected Performance Gain:** 70-90% reduction in metric polling overhead

**Key Success Factors:**
1. Verify MetricsRuntime_v1 payload format
2. Retain polling fallback for all systems
3. Test each system thoroughly before proceeding
4. Migrate incrementally, one system at a time

**Next Steps:**
1. Verify MetricsRuntime_v1 payload format
2. Migrate SafeMetricsFX1_1.js (high impact, low risk)
3. Migrate HarmonicNodeResonanceHalos.js (high impact, medium risk)
4. Migrate remaining systems in priority order

---

**END OF PATCH PLAN**
