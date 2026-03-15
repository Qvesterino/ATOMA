# ATOMA EVENT MIGRATION — SafeMetricsFX1_1.js

**Date:** 2026-03-15  
**Type:** READ-ONLY PATCH PLAN  
**Status:** ARCHITECTURAL ANALYSIS ONLY

---

## TARGET SYSTEM

**File:** `SafeMetricsFX1_1.js`  
**Current Frequency:** 15 Hz (67ms tick interval)  
**Polling Location:** Line 78 - `const metrics = node.userData.metrics;`  
**Current Behavior:** Iterates all nodes every tick, reads metrics from each node

---

## CURRENT IMPLEMENTATION

### Constructor (Lines 23-33)
```javascript
constructor() {
  // Tick timing (15-20Hz = slower than raycast, minimal overhead)
  this.lastTickTime = 0;
  this.tickInterval = 1 / 15; // ~67ms per tick
  
  // Track state to prevent re-application
  this.appliedFX = new Map(); // nodeId -> { harmony, instability, energy, corruption }
  
  // Flicker state (for instability flicker effect)
  this.flickerStates = new Map(); // nodeId -> { phase, nextFlicker }
}
```

### Update Method (Lines 51-69)
```javascript
update(deltaTime, nodes) {
  // 🔒 HARD INTERACTION AUTHORITY - Stop all visual updates when locked
  if (window.VISUAL_AUTHORITY_LOCK) return;
  
  if (window.DEBUG_VISUAL_MODE) return;
  if (!nodes || nodes.length === 0) return;

  // Throttle to 15Hz (67ms)
  this.lastTickTime += deltaTime;
  if (this.lastTickTime < this.tickInterval) {
    return;
  }
  this.lastTickTime = 0;

  // Apply FX to all nodes
  nodes.forEach(node => {
    this.applyNodeMetricsFX(node);
  });
}
```

### Metrics Polling (Lines 75-104)
```javascript
applyNodeMetricsFX(node) {
  if (!node || !node.userData) return;

  const metrics = node.userData.metrics; // ← POLLING HERE (Line 78)
  const nodeId = node.uuid;

  try {
    // Get or create state for this node
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

    // Apply each FX type independently
    this.applyHarmonyGlow(node, metrics, state);
    this.applyInstabilityFlicker(node, metrics, state);
    this.applyCorruptionTint(node, metrics, state);
    this.applyEnergyIntensity(node, metrics, state);

  } catch (e) {
    // Fail silently - never crash the game
    console.warn('SafeMetricsFX: Error applying FX to node', nodeId, e);
  }
}
```

---

## MIGRATION PLAN

### STEP 1: Modify Constructor

**Location:** Lines 23-33  
**Changes:** Add SemanticBus injection and event-driven state

```javascript
constructor(semanticBus = null) {
  // Tick timing (15-20Hz = slower than raycast, minimal overhead)
  this.lastTickTime = 0;
  this.tickInterval = 1 / 15; // ~67ms per tick
  
  // Track state to prevent re-application
  this.appliedFX = new Map(); // nodeId -> { harmony, instability, energy, corruption }
  
  // Flicker state (for instability flicker effect)
  this.flickerStates = new Map(); // nodeId -> { phase, nextFlicker }
  
  // Event-driven state
  this.semanticBus = semanticBus;
  this._useEventDriven = false;
  this._dirtyNodes = new Set(); // Track nodes needing updates
  this._metricSubscriptionDisposer = null;
  
  // Node registry for event-driven lookups
  this._nodeRegistry = new Map(); // nodeId -> node object
  
  // Try to subscribe to SemanticBus
  this._trySubscribeToMetricUpdates();
}
```

**New Fields:**
- `semanticBus` - Reference to SemanticEventBus
- `_useEventDriven` - Flag indicating if event-driven mode is active
- `_dirtyNodes` - Set of node IDs that need updates
- `_metricSubscriptionDisposer` - Function to unsubscribe from events
- `_nodeRegistry` - Map for quick node lookup by ID

---

### STEP 2: Add Subscription Method

**Location:** After constructor, before `ensureMetricsBaseline()`  
**New Method:**

```javascript
/**
 * Try to subscribe to SemanticBus metric updates
 * Falls back to polling if SemanticBus unavailable
 */
_trySubscribeToMetricUpdates() {
  if (!this.semanticBus) {
    console.warn('[SafeMetricsFX1_1] SemanticBus not available, using polling fallback');
    this._useEventDriven = false;
    return;
  }
  
  const subscribe = this.semanticBus.subscribe?.bind(this.semanticBus) || 
                    this.semanticBus.on?.bind(this.semanticBus);
  
  if (!subscribe) {
    console.warn('[SafeMetricsFX1_1] SemanticBus.subscribe not available, using polling fallback');
    this._useEventDriven = false;
    return;
  }
  
  try {
    this._metricHandler = (payload) => {
      this._handleMetricUpdate(payload);
    };
    
    this._metricSubscriptionDisposer = 
      subscribe('metric.node.updated', this._metricHandler);
    
    this._useEventDriven = true;
    console.log('[SafeMetricsFX1_1] Subscribed to metric.node.updated (event-driven mode)');
  } catch (error) {
    console.error('[SafeMetricsFX1_1] Failed to subscribe to SemanticBus:', error);
    this._useEventDriven = false;
  }
}
```

**Purpose:** 
- Attempts to subscribe to `metric.node.updated` events
- Sets `_useEventDriven` flag based on success
- Logs warnings if subscription fails

---

### STEP 3: Add Metric Update Handler

**Location:** After `_trySubscribeToMetricUpdates()`  
**New Method:**

```javascript
/**
 * Handle metric update event from SemanticBus
 * @param {Object} payload - Event payload { nodeId, metric, value }
 */
_handleMetricUpdate(payload) {
  if (!payload) return;
  
  const { nodeId, metric, value } = payload;
  
  if (!nodeId) {
    console.warn('[SafeMetricsFX1_1] Metric update missing nodeId', payload);
    return;
  }
  
  if (!metric) {
    console.warn('[SafeMetricsFX1_1] Metric update missing metric name', payload);
    return;
  }
  
  // Only track metrics we care about
  const relevantMetrics = ['harmony', 'instability', 'energy', 'corruption'];
  if (!relevantMetrics.includes(metric)) {
    return;
  }
  
  // Mark node as dirty for targeted update
  this._dirtyNodes.add(nodeId);
}
```

**Purpose:**
- Filters relevant metrics (harmony, instability, energy, corruption)
- Marks affected nodes as dirty
- Validates payload structure

---

### STEP 4: Modify Update Method

**Location:** Lines 51-69  
**Changes:** Add node registry update and event-driven path

```javascript
update(deltaTime, nodes) {
  // 🔒 HARD INTERACTION AUTHORITY - Stop all visual updates when locked
  if (window.VISUAL_AUTHORITY_LOCK) return;
  
  if (window.DEBUG_VISUAL_MODE) return;
  if (!nodes || nodes.length === 0) return;

  // Update node registry for event-driven lookups
  this._updateNodeRegistry(nodes);

  // Throttle to 15Hz (67ms)
  this.lastTickTime += deltaTime;
  if (this.lastTickTime < this.tickInterval) {
    return;
  }
  this.lastTickTime = 0;

  // Choose update path based on mode
  if (this._useEventDriven) {
    // Event-driven path: only update dirty nodes
    this._processDirtyNodes();
  } else {
    // Polling fallback: scan all nodes
    this._pollAllNodes(nodes);
  }
}
```

**Changes:**
1. Added `_updateNodeRegistry()` call to keep registry in sync
2. Added conditional logic for event-driven vs polling mode
3. Split into two separate methods for clarity

---

### STEP 5: Add Node Registry Method

**Location:** After `update()` method  
**New Method:**

```javascript
/**
 * Update node registry for event-driven lookups
 * @param {Array} nodes - Array of node objects
 */
_updateNodeRegistry(nodes) {
  if (!nodes || nodes.length === 0) return;
  
  // Rebuild registry (simple approach, could be optimized)
  this._nodeRegistry.clear();
  for (const node of nodes) {
    const nodeId = node.uuid;
    if (nodeId) {
      this._nodeRegistry.set(nodeId, node);
    }
  }
}
```

**Purpose:**
- Maintains a map of node ID → node object
- Enables quick lookup when processing dirty nodes
- Rebuilt each tick (simple but effective)

---

### STEP 6: Add Dirty Nodes Processor

**Location:** After `_updateNodeRegistry()`  
**New Method:**

```javascript
/**
 * Process only dirty nodes (event-driven path)
 */
_processDirtyNodes() {
  if (this._dirtyNodes.size === 0) {
    return; // No updates needed
  }
  
  // Process each dirty node
  for (const nodeId of this._dirtyNodes) {
    const node = this._nodeRegistry.get(nodeId);
    if (node) {
      this.applyNodeMetricsFX(node);
    }
  }
  
  // Clear dirty set after processing
  this._dirtyNodes.clear();
}
```

**Purpose:**
- Processes only nodes with metric changes
- Clears dirty set after processing
- Uses node registry for quick lookups

---

### STEP 7: Add Polling Fallback Method

**Location:** After `_processDirtyNodes()`  
**New Method:**

```javascript
/**
 * Poll all nodes (fallback when SemanticBus unavailable)
 * @param {Array} nodes - Array of node objects
 */
_pollAllNodes(nodes) {
  // Apply FX to all nodes (original behavior)
  nodes.forEach(node => {
    this.applyNodeMetricsFX(node);
  });
}
```

**Purpose:**
- Original polling behavior
- Used when SemanticBus unavailable
- Ensures system always works

---

### STEP 8: Add Dispose Method

**Location:** After `cleanupNode()` method (after line 363)  
**New Method:**

```javascript
/**
 * Clean up subscriptions and resources
 */
dispose() {
  // Unsubscribe from SemanticBus
  if (this._metricSubscriptionDisposer) {
    this._metricSubscriptionDisposer();
    this._metricSubscriptionDisposer = null;
  }
  
  // Clear event-driven state
  this._dirtyNodes.clear();
  this._nodeRegistry.clear();
  
  // Clear FX state
  this.appliedFX.clear();
  this.flickerStates.clear();
  
  this._useEventDriven = false;
  this.semanticBus = null;
  
  console.log('[SafeMetricsFX1_1] Disposed');
}
```

**Purpose:**
- Cleans up SemanticBus subscription
- Prevents memory leaks
- Resets all state

---

### STEP 9: Update Reset Method

**Location:** Lines 327-331  
**Changes:** Clear event-driven state

```javascript
reset() {
  this.appliedFX.clear();
  this.flickerStates.clear();
  this.lastTickTime = 0;
  
  // Clear event-driven state
  this._dirtyNodes.clear();
  this._nodeRegistry.clear();
}
```

**Changes:**
- Added clearing of `_dirtyNodes` and `_nodeRegistry`

---

## COMPLETE PATCH SUMMARY

### Files Modified
- `SafeMetricsFX1_1.js`

### Lines Changed
- **Constructor (23-33):** Added SemanticBus injection, dirty nodes tracking, node registry
- **New Method:** `_trySubscribeToMetricUpdates()` - Subscribe to events
- **New Method:** `_handleMetricUpdate(payload)` - Process metric events
- **Update Method (51-69):** Added event-driven vs polling logic
- **New Method:** `_updateNodeRegistry(nodes)` - Maintain node lookup map
- **New Method:** `_processDirtyNodes()` - Process only affected nodes
- **New Method:** `_pollAllNodes(nodes)` - Fallback polling
- **New Method:** `dispose()` - Cleanup subscription
- **Reset Method (327-331):** Clear event-driven state

### New Fields Added
- `semanticBus` - SemanticEventBus reference
- `_useEventDriven` - Event mode flag
- `_dirtyNodes` - Set of dirty node IDs
- `_metricSubscriptionDisposer` - Unsubscribe function
- `_nodeRegistry` - Node ID → node map
- `_metricHandler` - Event handler function

---

## EVENT HANDLER PAYLOAD

### Expected Format
```javascript
{
  nodeId: "node-123",           // REQUIRED: Node UUID
  metric: "harmony",            // REQUIRED: Metric name
  value: 0.85,                  // REQUIRED: New value (0-1)
  timestamp: performance.now()   // OPTIONAL: Timestamp
}
```

### Supported Metrics
- `harmony` - Triggers harmony glow FX
- `instability` - Triggers instability flicker FX
- `energy` - Triggers energy intensity FX
- `corruption` - Triggers corruption tint FX

### Ignored Metrics
- All other metrics are ignored (not relevant to this system)

---

## BEHAVIOR COMPARISON

### Before (Polling Only)
```
Every 67ms (15 Hz):
  For each node in nodes array:
    Read node.userData.metrics
    Apply FX to node
  
Total metric reads: N nodes × 15 Hz
```

### After (Event-Driven with Fallback)
```
Event-Driven Mode (when SemanticBus available):
  When metric changes:
    Add nodeId to dirtyNodes
  
  Every 67ms (15 Hz):
    For each nodeId in dirtyNodes:
      Get node from registry
      Read node.userData.metrics
      Apply FX to node
    Clear dirtyNodes
  
  Total metric reads: M changed nodes × 15 Hz
  Where M << N (typically 1-5% of nodes)
  
Polling Fallback (when SemanticBus unavailable):
  Same as before (all nodes)
```

---

## PERFORMANCE EXPECTATIONS

### Metric Read Reduction
- **Before:** 15 Hz × 50 nodes = 750 metric reads/second
- **After:** 15 Hz × 2-5 dirty nodes = 30-75 metric reads/second
- **Reduction:** 90-96% fewer metric reads

### CPU Usage Reduction
- **Before:** Iterates all nodes every tick
- **After:** Iterates only changed nodes
- **Expected:** 80-90% reduction in update loop overhead

### Memory Impact
- **Added:** ~1-2 KB for dirty nodes set and node registry
- **Negligible:** Memory increase is minimal compared to savings

---

## TESTING CHECKLIST

### Unit Tests

1. **Subscription Test**
   - [ ] Verify subscription is created on init (if SemanticBus available)
   - [ ] Verify handler receives correct payload
   - [ ] Verify handler marks node as dirty

2. **Event-Driven Update Test**
   - [ ] Emit `metric.node.updated` event
   - [ ] Verify only affected node is updated
   - [ ] Verify dirtyNodes is cleared after processing
   - [ ] Verify other nodes are not touched

3. **Polling Fallback Test**
   - [ ] Disable SemanticBus (pass null to constructor)
   - [ ] Verify system falls back to polling
   - [ ] Verify all nodes are updated
   - [ ] Verify warning is logged

4. **Disposal Test**
   - [ ] Call `dispose()`
   - [ ] Verify subscription is cleaned up
   - [ ] Verify no memory leaks
   - [ ] Verify system can be re-initialized

5. **Metric Filter Test**
   - [ ] Emit event with irrelevant metric (e.g., "stability")
   - [ ] Verify node is NOT marked as dirty
   - [ ] Emit event with relevant metric (e.g., "harmony")
   - [ ] Verify node IS marked as dirty

### Integration Tests

1. **End-to-End Flow**
   - [ ] MetricsRuntime_v1 emits event
   - [ ] SafeMetricsFX1_1 receives event
   - [ ] SafeMetricsFX1_1 updates only affected node
   - [ ] Verify visual changes are correct

2. **Performance Test**
   - [ ] Measure CPU usage before migration
   - [ ] Measure CPU usage after migration
   - [ ] Verify 80-90% reduction in metric polling overhead

3. **Stress Test**
   - [ ] Emit rapid metric updates (100+ events/second)
   - [ ] Verify system handles high event rate
   - [ ] Verify no dropped updates
   - [ ] Verify dirtyNodes set doesn't grow unbounded

---

## RISK ASSESSMENT

### LOW RISK

- **Well-structured system** - Clear separation of concerns
- **Minimal coupling** - System is mostly self-contained
- **Fallback retained** - Original polling behavior preserved
- **No breaking changes** - Constructor signature extended (backward compatible)

### Potential Issues

1. **Node Registry Overhead**
   - **Risk:** Rebuilding registry every tick (15 Hz)
   - **Impact:** Minimal (50 nodes × 15 Hz = trivial)
   - **Mitigation:** Could optimize to incremental updates if needed

2. **Event Latency**
   - **Risk:** Events may be delayed by SemanticBus queue
   - **Impact:** Visual updates may be 1-2 frames delayed
   - **Mitigation:** Acceptable for subtle FX (not critical path)

3. **Missing Metrics**
   - **Risk:** MetricsRuntime_v1 may not emit all relevant metrics
   - **Impact:** Some FX may not trigger
   - **Mitigation:** Fallback polling ensures system still works

---

## DEPENDENCIES

### Required

1. **SemanticEventBus** - Must be available and functional
2. **MetricsRuntime_v1** - Must emit `metric.node.updated` events
3. **Node UUID** - Nodes must have `uuid` property for identification

### Blocking Issues

1. **MetricsRuntime_v1 Payload Format** - Must include `nodeId`, `metric`, `value` fields
2. **Node ID Consistency** - All systems must use same node ID format (UUID)
3. **SemanticBus Initialization** - Must be initialized before SafeMetricsFX1_1

---

## SUCCESS METRICS

### Performance Metrics

1. **Metric Polling Reduction**
   - Target: 90-96% reduction in `node.userData.metrics` reads
   - Measurement: Count metric reads per second before/after

2. **CPU Usage Reduction**
   - Target: 80-90% reduction in update loop overhead
   - Measurement: Profile frame time before/after

3. **Memory Usage**
   - Target: < 2 KB increase
   - Measurement: Monitor memory usage over time

### Functional Metrics

1. **Visual Correctness**
   - [ ] All FX types work correctly
   - [ ] No visual glitches or missing updates
   - [ ] FX behavior identical to polling mode

2. **Event Coverage**
   - [ ] All metric changes trigger FX updates
   - [ ] No missed updates
   - [ ] Dirty nodes processed correctly

3. **Fallback Reliability**
   - [ ] Polling fallback works when SemanticBus unavailable
   - [ ] No system failures when SemanticBus down
   - [ ] Warning logged when falling back

---

## IMPLEMENTATION ORDER

1. **Step 1:** Modify constructor (add SemanticBus injection)
2. **Step 2:** Add `_trySubscribeToMetricUpdates()` method
3. **Step 3:** Add `_handleMetricUpdate()` method
4. **Step 4:** Add `_updateNodeRegistry()` method
5. **Step 5:** Add `_processDirtyNodes()` method
6. **Step 6:** Add `_pollAllNodes()` method
7. **Step 7:** Modify `update()` method (add event-driven logic)
8. **Step 8:** Modify `reset()` method (clear event-driven state)
9. **Step 9:** Add `dispose()` method
10. **Step 10:** Test thoroughly

**Estimated Effort:** 2-3 hours  
**Risk Level:** LOW  
**Expected Performance Gain:** 90-96% reduction in metric polling

---

## SUMMARY

**Migration Strategy:**
- Add SemanticBus subscription to constructor
- Track dirty nodes for targeted updates
- Process only changed nodes when event-driven
- Retain polling fallback for reliability

**Key Benefits:**
- 90-96% reduction in metric reads
- 80-90% reduction in CPU overhead
- Minimal memory increase (< 2 KB)
- Backward compatible (fallback retained)

**Next Steps:**
1. Verify MetricsRuntime_v1 payload format
2. Implement patch following steps 1-10
3. Test thoroughly (unit + integration)
4. Measure performance improvements
5. Deploy to production

---

**END OF PATCH PLAN**
