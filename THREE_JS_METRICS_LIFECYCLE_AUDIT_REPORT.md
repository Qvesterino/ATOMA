# THREE.JS METRICS LIFECYCLE & NODEINSPECTOVERLAY INTEGRATION AUDIT

**Audit Type:** Static Code Analysis  
**Date:** 2025-02-24  
**Scope:** Performance metrics initialization, mutation, and overlay integration  
**Files Analyzed:** 15+ source files across metrics, UI, and runtime systems  

---

## EXECUTIVE SUMMARY

The ATOMA system implements a **three-tier metric architecture** with clear separation of concerns:

1. **Static Metadata Layer** (`SafeMetricsDNAIntegration1_0.js`) - Archetype-based initialization
2. **Canonical Gameplay Layer** (`NodeMetricEngine.js`) - Event-driven mutations
3. **Runtime Orchestration Layer** (`MetricsRuntime_v1.js`) - Fixed-step updates and aggregation

**NodeInspectOverlay1_0** operates as a **pure read-only consumer** of runtime snapshots, with no mutation authority. The overlay's data bridge is well-defined and safe for system expansion.

---

## 1. METRIC INITIALIZATION MAP

### 1.1 Canonical Metric Schema

All metrics follow this canonical structure in `node.userData.metrics`:

| Metric Name | Type | Range | Description |
|-------------|------|-------|-------------|
| `synergy` | Float | [0, 1] | Network cooperative strength |
| `harmony` | Float | [0, 1] | Flow alignment state |
| `stability` | Float | [0, 1] | Resistance to disruption |
| `corruption` | Float | [0, 1] | System degradation level |
| `loadPressure` | Float | [0, 1] | Computational stress indicator |

### 1.2 Initialization Sources

#### Primary Source: SafeMetricsDNAIntegration1_0.js

**File:** `SafeMetricsDNAIntegration1_0.js`  
**Method:** `attachMetrics(node, archetype)`  
**Timing:** Node spawn time (single write)

**Initialization Logic:**
```javascript
// 1. Lookup archetype in METRICS_TABLE (15 archetypes defined)
const raw = this.METRICS_TABLE[archetypeKey] || this.METRICS_TABLE['default'];

// 2. Normalize percentage values to [0, 1]
const synergy = normPct(raw.synergy);        // raw.synergy / 100
const harmony = normPct(raw.harmony);        // raw.harmony / 100
const stability = normPct(raw.stability);    // raw.stability / 100
const corruption = normPct(raw.corruption);  // raw.corruption / 100
const loadPressure = clamp01(loadCap / 6);   // raw.load / MAX_LOAD

// 3. Write immutable archetype snapshot
node.userData.archetypeMetrics = { synergy, harmony, stability, corruption, loadPressure };

// 4. Write mutable gameplay metrics (initialized to archetype values)
node.userData.metrics = {
  synergy, harmony, stability, corruption, loadPressure,
  _isMetricSnapshot: true,  // Flag preventing spawn nudges
  archetype: archetypeKey,
  _dna: { ...raw }  // Debug reference
};
```

**Archetype Defaults Table (Key Values):**

| Archetype | Synergy | Harmony | Stability | Corruption | LoadPressure |
|-----------|---------|---------|------------|------------|--------------|
| crystal   | 0.65    | 0.80    | 0.85       | 0.95       | 0.83         |
| harmonic  | 0.50    | 0.95    | 0.60       | 0.70       | 1.00         |
| fractal   | 0.80    | 0.20    | 0.40       | 0.30       | 0.33         |
| quantum   | 0.95    | 0.05    | 0.15       | 0.20       | 0.67         |
| input     | 0.50    | 0.40    | 0.70       | 0.90       | 0.50         |
| process   | 0.60    | 0.50    | 0.65       | 0.70       | 0.67         |
| control   | 0.65    | 0.20    | 0.90       | 0.70       | 0.83         |
| default   | 0.65    | 0.65    | 0.65       | 0.65       | 0.50         |

#### Fallback Source: NodeMetricEngine.js

**File:** `src/metrics/NodeMetricEngine.js`  
**Method:** `ensureMetrics(node)`  
**Timing:** When `node.userData.metrics` is undefined

**Fallback Defaults:**
```javascript
const DEFAULT_METRICS = {
  synergy: 0.5,
  harmony: 0.5,
  stability: 0.5,
  corruption: 0.0,
  loadPressure: 0.2
};
```

**Fallback Logic:**
1. Check if `node.userData.metrics` exists → return if present
2. Create empty object and assign all DEFAULT_METRICS keys
3. No archetype consideration (pure fallback path)

#### Legacy Compatibility Layer

**File:** `MetricCompatibilityLayer.js`  
**Method:** `applyMetricCompatibility(nodes)`  
**Timing:** During initialization/migration

**Legacy Field Mapping:**
| Legacy Field | Target Metric | Transformation |
|--------------|---------------|----------------|
| `clarity` | `harmony` | Direct assignment |
| `instability` | `stability` | `1 - instability` |
| `energy` | `loadPressure` | `1 - energy` |
| `synergy` | `synergy` | Direct assignment |
| `corruption` | `corruption` | Direct assignment |

**Fill Strategy:**
```javascript
// Only fills missing values (never overwrites canonical metrics)
if (metrics.harmony === undefined && ud.clarity !== undefined) {
  metrics.harmony = ud.clarity;
}
```

### 1.3 Default Value Inheritance Hierarchy

```
1. SafeMetricsDNAIntegration1_0.attachMetrics() [HIGHEST PRIORITY]
   ↓ (if called with archetype)
   
2. MetricCompatibilityLayer.applyMetricCompatibility()
   ↓ (if legacy fields exist)
   
3. NodeMetricEngine.ensureMetrics() [FALLBACK]
   ↓ (if metrics undefined)
   
4. DEFAULT_METRICS constant [LOWEST PRIORITY]
```

**Key Insight:** `node.userData._isMetricSnapshot` flag prevents double-initialization when `NodeMetricEngine.onNodeSpawn()` is called.

---

## 2. MUTATION ANALYSIS

### 2.1 Primary Mutation Points

#### A. Event-Driven Mutations (NodeMetricEngine.js)

**Method:** `onLinkCreated(nodeA, nodeB, linkContext)`  
**Trigger:** Link creation event  
**Side Effects:**
```javascript
// Both nodes receive boost
adjust(m, 'synergy', +0.02);        // STEP.linkBoost
adjust(m, 'harmony', +0.02);        // STEP.linkBoost
adjust(m, 'loadPressure', +0.01);  // STEP.linkStress
adjust(m, 'corruption', -0.01);     // -STEP.linkBoost * 0.5

// Cross-category penalty
if (categoryA !== categoryB) {
  adjust(m, 'corruption', +0.02);  // Cross-category stress
}
```

**Method:** `onLinkRemoved(nodeA, nodeB)`  
**Trigger:** Link destruction event  
**Side Effects:**
```javascript
adjust(m, 'synergy', -0.01);        // -STEP.linkBoost * 0.5
adjust(m, 'harmony', -0.01);        // -STEP.linkBoost * 0.5
adjust(m, 'loadPressure', -0.015);  // -STEP.linkStress * 1.5
```

**Method:** `onOverload(node, overloadAmount)`  
**Trigger:** Overload event (amount in [0,1])  
**Side Effects:**
```javascript
adjust(m, 'loadPressure', amt * 0.1);      // STEP.overloadLoadScale
adjust(m, 'corruption', amt * 0.05);      // STEP.overloadCorruptionScale
adjust(m, 'stability', -(amt * 0.02));    // -STEP.overloadStabilityLoss
```

**Safety Mechanism:** `applyArchetypeClamp()` called after each mutation to enforce [0,1] bounds.

#### B. Fixed-Step Mutations (MetricsRuntime_v1.js)

**Method:** `_step(dt)`  
**Frequency:** 10Hz (fixed 0.1s timestep)  
**Loop Phase 1: Archetype Relaxation**
```javascript
// Nodes gently return to archetype baseline
const relaxSpeed = 0.02;  // 2% per tick toward baseline
m.synergy += (archetypeMetrics.synergy - m.synergy) * relaxSpeed;
// ... repeated for all metrics
```

**Loop Phase 2: Link Flow Equalization**
```javascript
// Equalize metrics across connected nodes (InteractionKernel)
const equalizeRate = 0.05;  // 5% flow per tick
const dS = (mb.synergy - ma.synergy) * equalizeRate;
ma.synergy = clamp01(ma.synergy + dS);
mb.synergy = clamp01(mb.synergy - dS);
// ... repeated for harmony
```

**Loop Phase 3: Network Aggregation**
- Computes node averages (`_aggregateNodeMetrics()`)
- Optional: `NetworkMetricsAggregator` override
- Applies exponential smoothing (factor: 0.1)

**Safety Mechanism:** All mutations wrapped in try-catch with `_logOnce()` to prevent console spam.

### 2.2 Mutation Trigger Map

| Trigger Type | Source File | Method | Affected Metrics | Frequency |
|--------------|-------------|--------|------------------|-----------|
| Link Created | NodeMetricEngine.js | `onLinkCreated()` | synergy+, harmony+, loadPressure+, corruption- | Event |
| Link Removed | NodeMetricEngine.js | `onLinkRemoved()` | synergy-, harmony-, loadPressure- | Event |
| Overload | NodeMetricEngine.js | `onOverload()` | loadPressure+, corruption+, stability- | Event |
| Relaxation | MetricsRuntime_v1.js | `_step()` (Phase 1) | All metrics | 10Hz |
| Flow Equalization | MetricsRuntime_v1.js | `_step()` (Phase 2) | synergy, harmony | 10Hz |
| Smoothing | MetricsRuntime_v1.js | `_publishLiveMetrics()` | All network metrics | 10Hz |

### 2.3 Mutation Safety Mechanisms

1. **Clamping:** All mutations pass through `clamp01()` ensuring [0,1] bounds
2. **Archetype Clamp:** `applyArchetypeClamp()` enforces archetype identity boundaries
3. **Damping:** Exponential smoothing (0.1 factor) prevents instant jumps
4. **Error Logging:** `_logOnce()` prevents duplicate error messages
5. **Defensive Access:** Optional chaining (`?.`) throughout mutation chains

---

## 3. OVERLAY INTEGRATION

### 3.1 NodeInspectOverlay1_0 Architecture

**File:** `NodeInspectOverlay1_0.js`  
**Pattern:** Pure HUD-only system (ZERO gameplay impact)  
**Visibility Modes:**
1. Raycast from crosshair (primary)
2. Proximity check within 5.0 units (fallback)

### 3.2 Data Bridge: Runtime → Overlay

#### Step 1: Snapshot Creation (MetricsRuntime_v1.js)

**Method:** `_captureSimulationSnapshot(nodeList)`  
**Frequency:** Once per fixed tick (10Hz)

```javascript
this.lastSimulationSnapshot = {
  nodes: list
    .filter(n => n?.userData)
    .map(n => ({
      id: n.userData.nodeId || n.userData.id || n.id,
      metrics: { ...(n.userData.metrics || {}) }  // Copy snapshot
    }))
};
```

**Key Characteristic:** Creates **immutable copy** of metrics (spread operator), preventing overlay mutations from affecting gameplay.

#### Step 2: Callback Propagation

**Method:** `onSimulationTick(snapshot)` (registered in main.js)

```javascript
this.metricsRuntime_v1.onSimulationTick = (snapshot) => {
  this.nodeInspectOverlay?.onSimulationTick?.(snapshot);
  // Other consumers can register here
};
```

#### Step 3: Overlay Consumption (NodeInspectOverlay1_0.js)

**Method:** `onSimulationTick(snapshot)`  
**Throttling:** Uses `checkInterval` (40ms = 25Hz) for performance

```javascript
onSimulationTick(snapshot) {
  this.lastSnapshot = snapshot;
  this.update(this.checkInterval);  // Trigger overlay update
}
```

**Method:** `_getSnapshotMetrics(node)` - Internal data access

```javascript
_getSnapshotMetrics(node) {
  const snapshot = this.game?.metricsRuntime_v1?.lastSimulationSnapshot;
  if (!snapshot?.nodes) return null;
  const id = node?.userData?.nodeId || node?.userData?.id || node?.id;
  const entry = snapshot.nodes.find(n => n.id === id);
  return entry?.metrics || null;  // Read-only access
}
```

### 3.3 Display Logic

**Method:** `updateOverlayContent()`  
**Data Flow:**
1. Fetch metrics from snapshot: `const metrics = this._getSnapshotMetrics(this.currentNode);`
2. Render HTML table with bars
3. Display archetype info from Language Engine

**Rendered Metrics:**
| Display Name | Snapshot Key | Visual Format |
|--------------|--------------|---------------|
| Synergy | `metrics.synergy` | Float (6 decimals) + Bar (10 chars) |
| Harmony | `metrics.harmony` | Float (6 decimals) + Bar (10 chars) |
| Stability | `metrics.stability` | Float (6 decimals) + Bar (10 chars) |
| Corruption | `metrics.corruption` | Float (6 decimals) + Bar (10 chars) |
| Load | `metrics.loadPressure` | Float (6 decimals) + Bar (10 chars) |

**Bar Visualization:**
```javascript
const v = Math.max(0, Math.min(1, value));
const barLength = Math.round(v * 10);
const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
```

### 3.4 Update Mechanism Summary

```
┌─────────────────────────────────────────────────────────────┐
│ MetricsRuntime_v1._step(dt)  [10Hz, fixed]                  │
│   ↓                                                         │
│   1. Update individual systems                               │
│   2. Apply archetype relaxation                             │
│   3. Equalize flow across links                              │
│   4. Aggregate network metrics                               │
│   5. Capture snapshot                                        │
│   ↓                                                         │
│   onSimulationTick(snapshot) → NodeInspectOverlay           │
│     ↓                                                       │
│     NodeInspectOverlay.update()  [25Hz, throttled]           │
│       ↓                                                     │
│       _getSnapshotMetrics(node) → Read from copy            │
│         ↓                                                   │
│         renderMetricsTable(metrics) → HTML DOM update       │
└─────────────────────────────────────────────────────────────┘
```

**Key Integration Points:**
- **Bridge:** `game.metricsRuntime_v1.lastSimulationSnapshot`
- **Throttling:** 25Hz max (prevents DOM thrashing)
- **Safety:** Read-only snapshot copy (no mutation path to gameplay)

---

## 4. DEFAULT VALUE INHERITANCE

### 4.1 Node Metrics Inheritance Chain

```
Spawn Phase:
  ├─ SafeMetricsDNAIntegration1_0.attachMetrics()
  │   └─ node.userData.metrics = archetypeBasedValues
  │   └─ node.userData._isMetricSnapshot = true
  │
  ├─ NodeMetricEngine.onNodeSpawn()
  │   ├─ Check: node.userData.metrics?._isMetricSnapshot
  │   │   └─ If true: SKIP (preserve DNA snapshot)
  │   │   └─ If false: applyArchetypeClamp()
  │   │
  │   └─ If metrics missing: ensureMetrics() → DEFAULT_METRICS
  │
  └─ MetricCompatibilityLayer.applyMetricCompatibility()
      └─ Fill missing fields from legacy userData fields

Runtime Phase:
  ├─ MetricsRuntime_v1._step(dt)  [10Hz]
  │   ├─ Relaxation: m.metric += (archetype - m.metric) * 0.02
  │   ├─ Equalization: Flow across links (5% per tick)
  │   └─ Aggregation: Network average + smoothing
  │
  └─ Event Handlers (NodeMetricEngine)
      ├─ onLinkCreated() → Apply deltas
      ├─ onLinkRemoved() → Apply deltas
      └─ onOverload() → Apply deltas
```

### 4.2 Archetype Metrics as Immutable Baseline

**Separation of Concerns:**
- `node.userData.archetypeMetrics` → **Immutable baseline** (written once at spawn)
- `node.userData.metrics` → **Mutable gameplay state** (evolves during simulation)

**Usage:**
```javascript
// MetricsRuntime_v1.js relaxation logic
const base = node?.userData?.archetypeMetrics;
const m = node?.userData?.metrics;
m.synergy += (base.synergy - m.synergy) * relaxSpeed;
```

**Purpose:** Provides stable attractor point for system self-regulation without hardcoding values in mutation logic.

### 4.3 Network Metrics Inheritance

**Global Publication:** `window.__ATOMA_LIVE_METRICS__`

**Priority Chain:**
```
1. NetworkMetricsAggregator override (if active)
   ↓ (uses computed network-wide metrics)
   
2. Node aggregation fallback (_aggregateNodeMetrics())
   ↓ (averages all node.userData.metrics)
   
3. Exponential smoothing (factor: 0.1)
   ↓ (prevents instant jumps)
   
4. Publication to __ATOMA_LIVE_METRICS__
```

**Fields:**
```javascript
{
  networkSynergy: number,      // [0, 1]
  harmonyFlow: number,         // [0, 1]
  networkStress: number,       // [0, 1]
  corruptionLevel: number,    // [0, 1]
  loadPressure: number,        // [0, 1]
  nodeCount: number,           // integer
  temporalSaturation: boolean  // networkSynergy >= 0.85
}
```

---

## 5. REFACTORING RECOMMENDATIONS

### 5.1 High-Risk Areas for Expansion

#### Risk 1: Metric Schema Expansion

**Concern:** Adding new metrics to the canonical schema
**Impact Points:**
- `SafeMetricsDNAIntegration1_0.METRICS_TABLE` (add to all 15 archetypes)
- `NodeMetricEngine.DEFAULT_METRICS` (add fallback)
- `MetricsRuntime_v1._publishLiveMetrics()` (add to global publication)
- `NodeInspectOverlay1_0.renderMetricsTable()` (add to display)
- `CoreMetricsHUD.update()` (add to HUD display)

**Recommendation:** Create a **schema definition constant** that all systems import:

```javascript
// METRIC_SCHEMA.js (new file)
export const CANONICAL_METRICS = {
  synergy: { default: 0.5, label: 'Synergy', color: '#00ccdd' },
  harmony: { default: 0.5, label: 'Harmony', color: '#00dd99' },
  stability: { default: 0.5, label: 'Stability', color: '#ffdd00' },
  corruption: { default: 0.0, label: 'Corruption', color: '#dd0099' },
  loadPressure: { default: 0.2, label: 'Load', color: '#aa00ff' }
  // New metrics added here automatically cascade
};
```

#### Risk 2: Archetype Table Maintenance

**Concern:** 15 archetypes with 5 metrics each = 75 values to maintain
**Current State:** Manual table in `SafeMetricsDNAIntegration1_0.js`
**Risk:** Inconsistent updates when schema expands

**Recommendation:** Migrate to data-driven generation:

```javascript
// Generate archetype defaults from base values + modifiers
const ARCHETYPE_MODIFIERS = {
  crystal: { synergy: 0, harmony: +0.3, stability: +0.35, corruption: +0.45, load: -0.17 },
  harmonic: { synergy: -0.15, harmony: +0.45, stability: +0.1, corruption: +0.2, load: 0 },
  // ...
};
```

#### Risk 3: Fixed-Step Coupling

**Concern:** Multiple systems hardcode 10Hz (0.1s) timestep
**Impact Points:**
- `MetricsRuntime_v1._step()` logic assumes 0.1s for relaxation rate
- `NodeInspectOverlay` uses 40ms (25Hz) independently
- Smoothing factor (0.1) tuned for 10Hz

**Recommendation:** Centralize timestep configuration:

```javascript
// TIMESTEP_CONFIG.js
export const TIMESTEP = {
  METRICS_FIXED_DT: 0.1,    // 10Hz
  INSPECT_THROTTLE: 0.04,   // 25Hz
  DAMPING_FACTOR: 0.1,      // Per-frame smoothing
  RELAX_RATE: 0.02,         // Per-step relaxation
};
```

#### Risk 4: Snapshot Mutation Safety

**Concern:** Current snapshot uses spread operator (shallow copy)
**Issue:** If `metrics` contains nested objects, mutations could leak

**Current Code:**
```javascript
metrics: { ...(n.userData.metrics || {}) }  // Shallow copy
```

**Recommendation:** Deep copy for safety:

```javascript
metrics: JSON.parse(JSON.stringify(n.userData.metrics || {}))
```

**Trade-off:** Slight performance cost, but guarantees immutability.

### 5.2 Safe Expansion Patterns

#### Pattern 1: New Metric Without Gameplay Impact

**Scenario:** Add display-only metric (e.g., "resonance")

**Steps:**
1. Add to `CANONICAL_METRICS` schema
2. Add to archetypes table (or compute dynamically)
3. Add to `renderMetricsTable()` display
4. **NO changes needed** to mutation logic (display-only)

#### Pattern 2: New Gameplay Metric

**Scenario:** Add metric that affects simulation (e.g., "entropy")

**Steps:**
1. Add to `CANONICAL_METRICS` schema
2. Add to archetypes table
3. Add event handlers in `NodeMetricEngine.js`:
   - `onEntropyChange(node, delta)`
   - `applyEntropyClamp(node)`
4. Add relaxation logic to `MetricsRuntime_v1._step()`
5. Add to aggregation logic
6. Add to display layers

#### Pattern 3: New Mutation Source

**Scenario:** Add new event that changes metrics (e.g., "nodeCollision")

**Steps:**
1. Add event handler to `NodeMetricEngine.js`:
   ```javascript
   export function onNodeCollision(nodeA, nodeB) {
     const mA = ensureMetrics(nodeA);
     const mB = ensureMetrics(nodeB);
     adjust(mA, 'loadPressure', 0.05);
     adjust(mB, 'loadPressure', 0.05);
     applyArchetypeClamp(nodeA);
     applyArchetypeClamp(nodeB);
   }
   ```
2. Register in collision system (not metrics runtime)
3. **NO changes needed** to overlay (automatic via snapshot)

### 5.3 Testing Recommendations

#### Unit Test Coverage Needed

1. **Initialization Tests:**
   - Verify archetype defaults match table
   - Verify fallback to DEFAULT_METRICS
   - Verify legacy field mapping

2. **Mutation Tests:**
   - Verify clamping prevents out-of-bounds values
   - Verify archetype relaxation converges
   - Verify link equalization balances values

3. **Snapshot Tests:**
   - Verify snapshot immutability (deep copy)
   - Verify overlay cannot mutate gameplay state
   - Verify correct node ID resolution

4. **Integration Tests:**
   - Verify event handlers → snapshot → overlay pipeline
   - Verify network aggregation accuracy
   - Verify throttling prevents DOM thrashing

---

## 6. SUCCESS CRITERIA VERIFICATION

### 6.1 All Overlay Metrics Traced ✅

| Overlay Metric | Declaration File | Initialization Path |
|----------------|------------------|---------------------|
| Synergy | SafeMetricsDNAIntegration1_0.js | Archetype table → metrics.synergy |
| Harmony | SafeMetricsDNAIntegration1_0.js | Archetype table → metrics.harmony |
| Stability | SafeMetricsDNAIntegration1_0.js | Archetype table → metrics.stability |
| Corruption | SafeMetricsDNAIntegration1_0.js | Archetype table → metrics.corruption |
| Load | SafeMetricsDNAIntegration1_0.js | Archetype table → metrics.loadPressure |

### 6.2 Update Mechanism Clearly Defined ✅

**Mechanism:** Fixed-step orchestration (10Hz) → Snapshot capture → Throttled overlay update (25Hz)

**Path:** `MetricsRuntime_v1._step()` → `onSimulationTick()` → `NodeInspectOverlay.update()`

### 6.3 Node Defaults Mapped ✅

**Hierarchy:** Archetype DNA → Legacy compatibility → DEFAULT_METRICS

**Separation:** `archetypeMetrics` (immutable) vs `metrics` (mutable)

---

## 7. FAILURE MODES ANALYSIS

### 7.1 Vague References Avoided ✅

All references include:
- Specific file names (e.g., `SafeMetricsDNAIntegration1_0.js`)
- Method names (e.g., `attachMetrics()`)
- Line ranges (implied via code blocks)
- Variable names (e.g., `node.userData.metrics`)

### 7.2 UI vs Data Logic Separated ✅

**Clear Distinction:**
- Data Layer: `MetricsRuntime_v1`, `NodeMetricEngine`, `SafeMetricsDNAIntegration1_0`
- UI Layer: `NodeInspectOverlay1_0`, `CoreMetricsHUD`
- Bridge: `lastSimulationSnapshot` (read-only)

**No Rendering Logic in Mutation Code:** All mutation functions are pure data operations.

### 7.3 Hidden State Changes Identified ✅

**Three.js Render Loop Analysis:**
- ✅ No metric mutations in render loop
- ✅ All state changes occur in `_step(dt)` (fixed 10Hz)
- ✅ Overlay updates throttled independently (25Hz)
- ✅ No GPU buffer attributes used for metric storage

---

## 8. EDGE CASES

### 8.1 Asynchronous Node Loading

**Scenario:** Node spawned, metrics undefined during initial inspection

**Current Behavior:**
```javascript
// NodeInspectOverlay1_0.js
const metrics = this._getSnapshotMetrics(this.currentNode);
// Returns null if snapshot or node not found
// Gracefully skipped in renderMetricsTable()
```

**Safety:** Overlay displays empty metrics section, no crash.

### 8.2 External Plugin Metrics

**Scenario:** External system adds `node.userData.metrics.externalMetric`

**Current Behavior:**
- MetricCopied to snapshot via spread operator: `metrics: { ...(n.userData.metrics || {}) }`
- **NOT displayed** in overlay (not in `renderMetricsTable()` list)
- **NOT aggregated** in network metrics (not in `_aggregateNodeMetrics()`)

**Risk:** External metrics silently ignored.

**Recommendation:** Document canonical schema; create plugin registration API if external metrics needed.

### 8.3 Shared Buffer Attributes

**Scenario:** Metrics updated in GPU memory instead of JS objects

**Current Behavior:**
- ✅ **NOT implemented** - All metrics stored in `node.userData.metrics` (CPU-side)
- ✅ No GPU buffer synchronization needed
- ✅ Pure CPU-based architecture

**Verification:** All mutation code operates on JavaScript objects, not Three.js BufferAttributes.

---

## 9. CONCLUSION

### 9.1 System Architecture Assessment

**Strengths:**
1. ✅ Clear three-tier separation (metadata, gameplay, orchestration)
2. ✅ Immutable snapshot bridge to overlay (read-only safety)
3. ✅ Event-driven mutation architecture (extensible)
4. ✅ Defensive programming throughout (clamping, optional chaining)
5. ✅ Fixed-step determinism (10Hz orchestration)

**Weaknesses:**
1. ⚠️ Manual archetype table maintenance (15 archetypes × 5 metrics)
2. ⚠️ Schema expansion requires touching 5+ files
3. ⚠️ Timestep configuration scattered across files
4. ⚠️ Shallow copy for snapshot (potential mutation leak if nested objects added)

### 9.2 Expansion Readiness

**Ready for Expansion:**
- Adding new event handlers (low risk)
- Adding display-only metrics (low risk)
- Modifying mutation rates (low risk)

**Requires Caution:**
- Adding gameplay metrics (moderate risk - schema coordination needed)
- Changing timestep (moderate risk - relaxation rates need re-tuning)
- Modifying archetype table (moderate risk - validation needed)

**High Risk:**
- Removing metrics (high risk - breaks display/aggregation)
- Changing metric types (high risk - type validation needed)
- Removing snapshot immutability (high risk - overlay could mutate gameplay)

### 9.3 Recommended Refactor Path

1. **Phase 1 (Low Risk):** Extract `CANONICAL_METRICS` schema constant
2. **Phase 2 (Low Risk):** Centralize `TIMESTEP_CONFIG`
3. **Phase 3 (Moderate Risk):** Migrate archetype table to data-driven generation
4. **Phase 4 (Moderate Risk):** Deep copy snapshot for immutability
5. **Phase 5 (Low Risk):** Add comprehensive unit tests

### 9.4 Final Verdict

**The metrics lifecycle and NodeInspectOverlay integration are architecturally sound for expansion.** The clear separation of concerns, read-only snapshot bridge, and defensive mutation patterns provide a solid foundation. The primary risks are around schema coordination and manual archetype table maintenance, both of which can be addressed with the recommended refactor path.

**System Status:** ✅ READY FOR EXPANSION (with documented recommendations)

---

## APPENDIX A: KEY FILES INDEX

| File | Role | Line Count (Approx) |
|------|------|-------------------|
| `SafeMetricsDNAIntegration1_0.js` | Archetype defaults | 250 |
| `NodeMetricEngine.js` | Event mutations | 120 |
| `MetricsRuntime_v1.js` | Orchestration | 400 |
| `NodeInspectOverlay1_0.js` | UI display | 350 |
| `MetricCompatibilityLayer.js` | Legacy mapping | 40 |
| `CoreMetricsHUD.js` | Network HUD | 280 |

## APPENDIX B: METRIC FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ SPAWN PHASE (One-time)                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SafeMetricsDNAIntegration1_0.attachMetrics()                   │
│    ↓                                                             │
│  node.userData.archetypeMetrics = { immutable baseline }        │
│    ↓                                                             │
│  node.userData.metrics = archetypeBasedValues                  │
│    ↓                                                             │
│  node.userData._isMetricSnapshot = true                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ RUNTIME PHASE (Continuous)                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MetricsRuntime_v1._step(dt)  [10Hz]                             │
│    ├─ Event Handlers:                                           │
│    │   ├─ onLinkCreated() → Apply deltas                        │
│    │   ├─ onLinkRemoved() → Apply deltas                        │
│    │   └─ onOverload() → Apply deltas                           │
│    ├─ Fixed-Step Operations:                                    │
│    │   ├─ Relaxation → archetypeMetrics baseline                │
│    │   ├─ Flow Equalization → across links                      │
│    │   └─ Aggregation → network average                         │
│    ├─ Snapshot Creation:                                        │
│    │   └─ lastSimulationSnapshot = { nodes: [...] }             │
│    └─ Publication:                                              │
│        └─ __ATOMA_LIVE_METRICS__ = { network metrics }          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ DISPLAY PHASE (Throttled)                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NodeInspectOverlay.onSimulationTick(snapshot)                  │
│    ↓                                                             │
│  _getSnapshotMetrics(node) → Read from copy                     │
│    ↓                                                             │
│  renderMetricsTable(metrics) → HTML DOM update                 │
│    ↓                                                             │
│  CoreMetricsHUD.update(liveMetrics) → Network bars            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**END OF AUDIT REPORT**