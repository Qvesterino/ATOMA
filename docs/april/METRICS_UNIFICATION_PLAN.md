# METRICS UNIFICATION PLAN

**Date**: 2026-03-18  
**Goal**: Unify all metrics to CoreMetricsCalculator as single source of truth

---

## CURRENT ARCHITECTURE

### Node-Level Metrics (Canonical)
- **Location**: `node.userData.metrics.*`
- **Writer**: `NodeMetricEngine.updateNodeMetrics()` (10 Hz)
- **Status**: ✅ Keep as canonical source

### Network-Level Metrics (Multiple Sources)
1. **NetworkMetricsAggregator** - Computes network metrics, writes to override key
2. **MetricsRuntime_v1** - Reads from NetworkMetricsAggregator, publishes to `__ATOMA_LIVE_METRICS__`
3. **CoreMetricsCalculator** - Separate aggregator for HUD (reads from node.userData.metrics)

### Problem
- Multiple aggregators computing network metrics
- Potential divergence between sources
- No single source of truth for network-level metrics

---

## TARGET ARCHITECTURE

### Node-Level Metrics (Canonical - Unchanged)
- **Location**: `node.userData.metrics.*`
- **Writer**: `NodeMetricEngine.updateNodeMetrics()` (10 Hz)
- **Status**: ✅ Keep as canonical source

### Network-Level Metrics (Single Source)
- **Location**: `CoreMetricsCalculator.getMetrics()`
- **Writer**: `CoreMetricsCalculator.update()` (2 Hz)
- **Source**: Reads from `node.userData.metrics` (canonical node metrics)
- **Status**: ✅ Single source of truth

### Read-Only Legacy Systems
- **NetworkMetricsAggregator**: Read-only (no write operations)
- **__ATOMA_LIVE_METRICS__**: Read-only (no write operations)

---

## IMPLEMENTATION PLAN

### Phase 1: Strengthen CoreMetricsCalculator

#### 1.1 Add Static Compute Method for Single Node
```javascript
// CoreMetricsCalculator.js
static compute(node) {
  if (!node || !node.userData) {
    return {
      synergy: 0,
      harmony: 0,
      stability: 0,
      corruption: 0,
      loadPressure: 0
    };
  }
  
  return {
    synergy: node.userData.metrics?.synergy ?? 0,
    harmony: node.userData.metrics?.harmony ?? 0,
    stability: node.userData.metrics?.stability ?? 0,
    corruption: node.userData.metrics?.corruption ?? 0,
    loadPressure: node.userData.metrics?.loadPressure ?? 0
  };
}
```

#### 1.2 Add Guard Pattern Helper
```javascript
// CoreMetricsCalculator.js
static ensureMetrics(node) {
  if (!node) return;
  if (!node.userData) node.userData = {};
  if (!node.userData.metrics) {
    node.userData.metrics = CoreMetricsCalculator.compute(node);
  }
}
```

### Phase 2: Disable Write Operations

#### 2.1 Disable NetworkMetricsAggregator Write
```javascript
// MetricsRuntime_v1.js
_runNetworkMetricsAggregator() {
  // DISABLED: No longer writes to override key
  // Kept for potential future read-only use
  console.warn('[MetricsRuntime_v1] NetworkMetricsAggregator write disabled - using CoreMetricsCalculator as single source');
  return;
}
```

#### 2.2 Disable __ATOMA_LIVE_METRICS__ Write
```javascript
// MetricsRuntime_v1.js
_publishLiveMetrics() {
  // DISABLED: No longer writes to __ATOMA_LIVE_METRICS__
  // Consumers should read from CoreMetricsCalculator
  console.warn('[MetricsRuntime_v1] __ATOMA_LIVE_METRICS__ write disabled - using CoreMetricsCalculator as single source');
  return;
}
```

### Phase 3: Update Consumers

#### 3.1 CoreMetricsHUD.js
```javascript
// Before
const liveMetrics = window.__ATOMA_LIVE_METRICS__;
const synergy = liveMetrics?.networkSynergy ?? 0;

// After
const metrics = coreMetricsCalculator.getMetrics();
const synergy = metrics.synergy ?? 0;
```

#### 3.2 HarmonicHubAuraSystem_Session126.js
```javascript
// Before
const fromLiveMetrics = globalThis?.__ATOMA_LIVE_METRICS__?.harmonyFlow ?? null;

// After
const metrics = coreMetricsCalculator.getMetrics();
const fromLiveMetrics = metrics.harmony ?? null;
```

#### 3.3 StressVisualShaderSystem.js
```javascript
// Before
if (typeof window !== 'undefined' && window.__ATOMA_LIVE_METRICS__) {
  this.networkStress = window.__ATOMA_LIVE_METRICS__.networkStress ?? 0;
}

// After
const metrics = coreMetricsCalculator.getMetrics();
this.networkStress = metrics.stability ?? 0; // Note: networkStress = 1 - stability
```

### Phase 4: Add Guard Pattern

#### 4.1 Add Guard in Node Creation
```javascript
// In node creation code
CoreMetricsCalculator.ensureMetrics(node);
```

#### 4.2 Add Guard in Node Access
```javascript
// In code that accesses node.userData.metrics
if (!node.userData.metrics) {
  node.userData.metrics = CoreMetricsCalculator.compute(node);
}
```

---

## VERIFICATION

### 1. Check CoreMetricsCalculator is Single Source
- All network metrics read from CoreMetricsCalculator.getMetrics()
- No other system writes to network metrics

### 2. Check Node-Level Metrics are Canonical
- All node metrics read from node.userData.metrics.*
- NodeMetricEngine is only writer

### 3. Check Legacy Systems are Read-Only
- NetworkMetricsAggregator: No write operations
- __ATOMA_LIVE_METRICS__: No write operations

### 4. Check Guard Pattern
- All node access includes guard for missing metrics
- CoreMetricsCalculator.ensureMetrics() called on node creation

---

## FILES TO MODIFY

1. **CoreMetricsCalculator.js**
   - Add static compute() method
   - Add static ensureMetrics() method

2. **MetricsRuntime_v1.js**
   - Disable _runNetworkMetricsAggregator() write
   - Disable _publishLiveMetrics() write

3. **CoreMetricsHUD.js**
   - Update to read from CoreMetricsCalculator

4. **HarmonicHubAuraSystem_Session126.js**
   - Update to read from CoreMetricsCalculator

5. **StressVisualShaderSystem.js**
   - Update to read from CoreMetricsCalculator

6. **Node creation files**
   - Add CoreMetricsCalculator.ensureMetrics() guard

---

## ROLLBACK PLAN

If issues arise:
1. Re-enable NetworkMetricsAggregator write
2. Re-enable __ATOMA_LIVE_METRICS__ write
3. Revert consumers to read from legacy sources

All changes are reversible via git revert.
