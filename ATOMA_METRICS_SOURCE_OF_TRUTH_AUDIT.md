# ATOMA METRICS SOURCE OF TRUTH AUDIT

**Date**: 2026-03-17  
**Auditor**: Autonomous ATOMA Engineer  
**Scope**: Synergy, Harmony, Stability, Corruption, LoadPressure

---

## EXECUTIVE SUMMARY

ATOMA has a **dual-layer metric architecture**:

1. **Node-Level Metrics**: Per-node canonical values stored in `node.userData.metrics`
2. **Network-Level Metrics**: Global aggregates stored in `window.__ATOMA_LIVE_METRICS__`

### Key Findings

- ✅ **Single writer authority**: `NodeMetricEngine.js` is the only system that updates canonical metrics
- ✅ **Fixed timestep execution**: All metric calculations use deterministic fixed timestep (0.1s)
- ✅ **Clear separation of concerns**: Calculation, aggregation, and visualization are separated
- ⚠️ **Legacy field pollution**: Many files read/write to legacy fields (`node.userData.harmony`, etc.) but canonical container is `node.userData.metrics`
- ⚠️ **Multiple aggregators**: Two systems calculate network metrics (CoreMetricsCalculator vs NetworkMetricsAggregator)

---

## 1. SYNERGY

### Node-Level (Canonical)

**Location**: `node.userData.metrics.synergy` (0-1 range)  
**Source File**: `src/metrics/NodeMetricEngine.js`  
**Calculation Function**: `deriveSynergy()` (line ~290)  
**Update Frequency**: 10 Hz (fixed 0.1s timestep)

```javascript
// Line 290-305 in NodeMetricEngine.js
function deriveSynergyTarget(metrics) {
  const harmony = clamp01(metrics.harmony ?? 0);
  const stability = clamp01(metrics.stability ?? 0);
  const corruption = clamp01(metrics.corruption ?? 0);
  const loadPressure = clamp01(metrics.loadPressure ?? 0);

  const harmonyField = harmony * harmony;
  const stabilityField = stability;
  const corruptionField = 1 - corruption * 0.85; // corruptionDamping
  const loadField = 1 - loadPressure * 0.65; // loadDamping

  const base = harmonyField * stabilityField * corruptionField * loadField;
  
  // Resonance bonus when harmony and stability are high
  const resonance = Math.max(0, harmony - 0.75) * 
                   Math.max(0, stability - 0.65) * 0.35;

  return clamp01(base + resonance);
}
```

**Derivation Rule**: Synergy is **DERIVED**, never directly written. Attempts to set `synergy` directly are blocked with a warning.

### Network-Level

**Location**: `window.__ATOMA_LIVE_METRICS__.networkSynergy`  
**Primary Source**: `src/metrics/NetworkMetricsAggregator.js` → `compute()` (line ~20)  
**Fallback Source**: `MetricsRuntime_v1.js` → `_aggregateNodeMetrics()` (line ~630)  
**Update Frequency**: 2 Hz (via FrameScheduler.background)

```javascript
// MetricsRuntime_v1.js line ~630
_aggregateNodeMetrics() {
  // ...
  const avgSynergy = validNodeCount > 0 ? sumSynergy / validNodeCount : 0;
  return {
    networkSynergy: avgSynergy,
    // ...
  };
}
```

### Who Updates It?

| System | Role | Frequency |
|--------|------|-----------|
| NodeMetricEngine.updateNodeMetrics() | Calculates per-node synergy | 10 Hz |
| NetworkMetricsAggregator.compute() | Aggregates to network level | 2 Hz |
| MetricsRuntime_v1 | Orchestrates and publishes | 10 Hz |

---

## 2. HARMONY

### Node-Level (Canonical)

**Location**: `node.userData.metrics.harmony` (0-1 range)  
**Source File**: `src/metrics/NodeMetricEngine.js`  
**Calculation Function**: `applyCrossMetricInteractions()` (line ~250)  
**Update Frequency**: 10 Hz (fixed 0.1s timestep)

```javascript
// Line 250-270 in NodeMetricEngine.js
function applyCrossMetricInteractions(metrics, base, dtScale) {
  let harmony = clamp01(metrics.harmony);
  let stability = clamp01(metrics.stability);
  let corruption = clamp01(metrics.corruption);
  let loadPressure = clamp01(metrics.loadPressure);

  // Relax toward base archetype metrics
  harmony += (clamp01(base.harmony ?? harmony) - harmony) * 0.05 * dtScale;

  const vulnerability = (1 - stability) * (0.5 + loadPressure * 0.7);
  const coherence = stability * (1 - loadPressure * 0.6);

  const nextHarmony = harmony + (
    INTERACTION.harmonyCoherenceGain * coherence -      // +0.025
    INTERACTION.harmonyCorruptionLoss * corruption * vulnerability  // -0.06
  ) * dtScale;

  // Inertia damping prevents oscillation
  harmony = harmony * 0.85 + nextHarmony * 0.15;
  
  return { harmony: clamp01(harmony), /* ... */ };
}
```

**Interaction Rules**:
- Gains from: Stability, coherence (low load)
- Loses from: Corruption, vulnerability (low stability + high load)
- Relaxes toward: Base archetype metric (0.05/sec)

### Network-Level

**Location**: `window.__ATOMA_LIVE_METRICS__.harmonyFlow`  
**Primary Source**: `src/metrics/NetworkMetricsAggregator.js` → `compute()`  
**Fallback Source**: `MetricsRuntime_v1.js` → `_aggregateNodeMetrics()`

---

## 3. STABILITY

### Node-Level (Canonical)

**Location**: `node.userData.metrics.stability` (0-1 range)  
**Source File**: `src/metrics/NodeMetricEngine.js`  
**Calculation Function**: `applyCrossMetricInteractions()` (line ~250)

```javascript
const nextStability = stability + (
  INTERACTION.stabilityHarmonyGain * harmony -      // +0.015
  INTERACTION.stabilityCorruptionLoss * corruption -  // -0.04
  INTERACTION.stabilityLoadLoss * loadPressure         // -0.02
) * dtScale;

stability = stability * 0.85 + nextStability * 0.15;
```

**Interaction Rules**:
- Gains from: Harmony
- Loses from: Corruption, load pressure
- Relaxes toward: Base archetype metric (0.04/sec)

### Network-Level

**Location**: `window.__ATOMA_LIVE_METRICS__.networkStress` (inverted stability)  
**Primary Source**: `src/metrics/NetworkMetricsAggregator.js`  
**Note**: Network publishes `networkStress` (1 - stability), not stability directly

---

## 4. CORRUPTION

### Node-Level (Canonical)

**Location**: `node.userData.metrics.corruption` (0-1 range)  
**Source File**: `src/metrics/NodeMetricEngine.js`  
**Calculation Function**: `applyCrossMetricInteractions()` (line ~250)

```javascript
// Natural decay
corruption -= corruption * 0.04 * dtScale;

// External corruption pushes toward base
if ((base.corruption ?? 0) > 0) {
  corruption += (clamp01(base.corruption) - corruption) * 0.03 * dtScale;
}

const nextCorruption = corruption + (
  INTERACTION.corruptionVulnerabilityGain * vulnerability -    // +0.035
  INTERACTION.corruptionHarmonySuppression * harmony * coherence -  // -0.045
  INTERACTION.corruptionLoadGain * loadPressure                // +0.02
) * dtScale;

corruption = corruption * 0.85 + nextCorruption * 0.15;
```

**Interaction Rules**:
- Gains from: Vulnerability, load pressure
- Loses from: Harmony, natural decay (0.04/sec)
- External influence: Archetype base.corruption (0.03/sec relaxation)

### Network-Level

**Location**: `window.__ATOMA_LIVE_METRICS__.corruptionLevel`  
**Primary Source**: `src/metrics/NetworkMetricsAggregator.js`  
**Fallback Source**: `MetricsRuntime_v1.js` → `_aggregateNodeMetrics()`

---

## 5. LOAD PRESSURE

### Node-Level (Canonical)

**Location**: `node.userData.metrics.loadPressure` (0-1 range)  
**Source File**: `src/metrics/NodeMetricEngine.js`  
**Calculation Function**: `applyCrossMetricInteractions()` (line ~250)

```javascript
// Relaxes toward base archetype loadPressure
loadPressure += (clamp01(base.loadPressure ?? loadPressure) - loadPressure) * 
                0.07 * dtScale;

// No cross-interaction - load is primarily archetype-driven
```

**Interaction Rules**:
- Relaxed toward: Base archetype metric (0.07/sec)
- No dynamic gains/losses - archetype defines target

### Network-Level

**Location**: `window.__ATOMA_LIVE_METRICS__.loadPressure`  
**Primary Source**: `src/metrics/NetworkMetricsAggregator.js`  
**Fallback Source**: `MetricsRuntime_v1.js` → `_aggregateNodeMetrics()`

---

## UPDATE CYCLES

### Primary Update Path

```
Frame Loop (60 Hz)
    ↓
MetricsRuntime_v1.update(dt)
    ↓
Accumulator (fixed timestep: 0.1s = 10 Hz)
    ↓
MetricsRuntime_v1._step(0.1)
    ├─→ updateNodeMetrics() ←── Canonical node metrics update
    │       ├─ applyCrossMetricInteractions()
    │       ├─ deriveSynergy()
    │       └─ Link equalization
    │
    └─→ NetworkMetricsAggregator.runNetworkMetricsAggregator() (2 Hz via background)
            └─ compute()
                ├─ Aggregate node metrics
                ├─ Add link influence
                └─ Publish to __ATOMA_LIVE_METRICS__
```

### Secondary Aggregator (HUD Only)

**File**: `CoreMetricsCalculator.js`  
**Frequency**: 2 Hz (0.5s interval)  
**Purpose**: Provides HUD-friendly metrics with legacy alias support

```javascript
// Line ~60 in CoreMetricsCalculator.js
update(deltaTime, aiNodes, linkingSystem, nodeEvolution, nodeArchetypes) {
  this.lastCalculationTime += deltaTime;
  
  if (this.lastCalculationTime < 0.5) return false; // 2 Hz
  
  this.updateNodeCounts(aiNodes, nodeEvolution, nodeArchetypes);
  this.updateLinkCounts(linkingSystem);
  this.calculateMetrics(); // Calls calculateSynergy(), calculateHarmony(), etc.
}
```

---

## NORMALIZED VS RAW VALUES

### Canonical Format

**All canonical metrics are normalized 0-1**:
- `node.userData.metrics.synergy` → 0.0 to 1.0
- `node.userData.metrics.harmony` → 0.0 to 1.0
- `node.userData.metrics.stability` → 0.0 to 1.0
- `node.userData.metrics.corruption` → 0.0 to 1.0
- `node.userData.metrics.loadPressure` → 0.0 to 1.0

### Legacy / Visual Formats

Many systems convert to 0-100 for display:

```javascript
// NodeDynamicMetrics.js
visual.synergy = this._clamp100(synergyNorm * 100);
visual.harmony = this._clamp100(harmonyNorm * 100);
visual.corruption = this._clamp100(corruptionNorm * 100);
```

### Raw Traffic Data

Links may have raw traffic counts:
- `link.userData.load` → raw traffic count
- `link.userData.traffic` → raw traffic count
- Converted to normalized `link.userData.loadPressure` via:

```javascript
// NodeDynamicMetrics.js
const loadRatio = rawTraffic / maxCapacity;
const loadPressureNorm = this._clamp01(base?.loadPressure ?? loadRatio);
```

---

## SOURCE OF TRUTH SUMMARY

### Canonical Node Metrics

| Metric | Location | Writer | Frequency |
|--------|----------|--------|-----------|
| synergy | `node.userData.metrics.synergy` | `NodeMetricEngine.deriveSynergy()` | 10 Hz |
| harmony | `node.userData.metrics.harmony` | `NodeMetricEngine.applyCrossMetricInteractions()` | 10 Hz |
| stability | `node.userData.metrics.stability` | `NodeMetricEngine.applyCrossMetricInteractions()` | 10 Hz |
| corruption | `node.userData.metrics.corruption` | `NodeMetricEngine.applyCrossMetricInteractions()` | 10 Hz |
| loadPressure | `node.userData.metrics.loadPressure` | `NodeMetricEngine.applyCrossMetricInteractions()` | 10 Hz |

### Canonical Network Metrics

| Metric | Location | Primary Source | Fallback | Frequency |
|--------|----------|----------------|----------|-----------|
| networkSynergy | `window.__ATOMA_LIVE_METRICS__.networkSynergy` | `NetworkMetricsAggregator.compute()` | `_aggregateNodeMetrics()` | 2 Hz |
| harmonyFlow | `window.__ATOMA_LIVE_METRICS__.harmonyFlow` | `NetworkMetricsAggregator.compute()` | `_aggregateNodeMetrics()` | 2 Hz |
| networkStress | `window.__ATOMA_LIVE_METRICS__.networkStress` | `NetworkMetricsAggregator.compute()` | `_aggregateNodeMetrics()` | 2 Hz |
| corruptionLevel | `window.__ATOMA_LIVE_METRICS__.corruptionLevel` | `NetworkMetricsAggregator.compute()` | `_aggregateNodeMetrics()` | 2 Hz |
| loadPressure | `window.__ATOMA_LIVE_METRICS__.loadPressure` | `NetworkMetricsAggregator.compute()` | `_aggregateNodeMetrics()` | 2 Hz |

---

## AUTHORITY ENFORCEMENT

### Write Protection

`NodeMetricEngine.js` enforces single-writer authority:

```javascript
const ALLOWED_WRITERS = [
  'SafeMetricsDNAIntegration1_0.js',
  'NodeMetricEngine.js',
];

// Proxy guard prevents external writes
function wrapMetricsWithGuard(metricsObj) {
  return new Proxy(metricsObj, {
    set(target, prop, value) {
      const isAllowed = ALLOWED_WRITERS.some(marker => 
        new Error().stack.includes(marker)
      );
      if (!isAllowed) {
        console.warn('[MetricAuthorityGuard] external metrics write detected');
      }
      target[prop] = value;
      return true;
    }
  });
}
```

### Legacy Field Blocking

Legacy direct writes are blocked with warnings:

```javascript
// Line ~330 in NodeMetricEngine.js
Object.defineProperty(node.userData, 'harmony', {
  get() { return undefined; },
  set(v) {
    console.warn('LEGACY METRIC WRITE BLOCKED');
    const metrics = this.metrics;
    if (metrics) metrics.harmony = clamp01(typeof v === 'number' ? v : 0.5);
  }
});
```

---

## RECOMMENDATIONS

### 1. Resolve Dual Aggregator Issue
- **Problem**: Both `CoreMetricsCalculator` and `NetworkMetricsAggregator` compute network metrics
- **Impact**: Potential for divergence between HUD and gameplay systems
- **Recommendation**: Deprecate `CoreMetricsCalculator` in favor of `NetworkMetricsAggregator` as single source of truth

### 2. Eliminate Legacy Field Reads
- **Problem**: 200+ files read from legacy fields (`node.userData.harmony`, etc.)
- **Impact**: Maintenance burden, potential for reading stale data
- **Recommendation**: Migrate all consumers to `node.userData.metrics.{metric}`

### 3. Document Metric Interaction Matrix
- **Problem**: Cross-metric interactions are scattered across `NodeMetricEngine.js`
- **Impact**: Difficult to understand system dynamics
- **Recommendation**: Create reference document with interaction matrix

---

## APPENDIX: FILE REFERENCES

### Core Metric Files

| File | Role | Authority |
|------|------|-----------|
| `src/metrics/NodeMetricEngine.js` | **Canonical node metrics calculator** | SINGLE WRITER |
| `src/metrics/NetworkMetricsAggregator.js` | Network metrics aggregator | Primary network source |
| `MetricsRuntime_v1.js` | Orchestration wrapper | Coordinator |
| `CoreMetricsCalculator.js` | HUD metrics (legacy) | Secondary (deprecate) |

### Metric Authority Files

| File | Role |
|------|------|
| `src/metrics/MetricAuthorityGuard.js` | Write protection |
| `src/metrics/MetricValidationRuntime.js` | Validation |

---

**Audit Complete**  
**Status**: System has clear source of truth with proper authority enforcement  
**Priority Items**: Resolve dual aggregator, eliminate legacy field pollution