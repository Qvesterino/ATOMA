# ATOMA STABILITY / INSTABILITY / NETWORK STRESS SYSTEM AUDIT

## EXECUTIVE SUMMARY

The ATOMA stability system has a canonical path with clear authority boundaries, but contains legacy field usage and derived patterns that create coupling complexity. The canonical metric `node.userData.metrics.stability` is well-governed by NodeMetricEngine and MetricsRuntime_v1, while `instability` and `networkStress` are derived values, not stored metrics.

---

## 1️⃣ ALL OCCURRENCES

### stability
**Canonical Container**: `node.userData.metrics.stability`

**Writers**:
- `src/metrics/NodeMetricEngine.js:145` - `adjust(m, 'stability', -amt * STEP.overloadStabilityLoss, id)` (overload event)
- `MetricsRuntime_v1.js:227` - Relaxation: `m.stability += (base.stability - m.stability) * (RELAXATION.stability ?? 0.05)`
- `MetricsRuntime_v1.js:249` - Link equalization: bidirectional stability smoothing
- `CriticalNodeFailureSystem.js:382` - Recovery: `applyMetricImpulse(node, { stability: delta })`

**Readers**:
- `CriticalNodeFailureSystem.js:254` - Failure detection: `const stability = node.userData?.metrics?.stability ?? 1.0`
- `MetricsRuntime_v1.js:210` - Snapshot before mutation
- `MetricsRuntime_v1.js:227` - Relaxation calculation
- `MetricsRuntime_v1.js:249` - Link equalization calculation

---

### instability
**Status**: DERIVED ONLY - NOT A STORED METRIC

**Derivations (all `1 - stability`)**:
- `LinkRendererConduit.js:???` - `(typeof stabilityMetric === 'number' ? 1 - stabilityMetric : 0.0)`
- `NodePersonality_VisualAdapter.js:??` - `instability: 0.30, // 1 - stability` (comment, constant)
- `_LinkedGlyphSynchronization1_0.js:??` - `const stabilityFactor = 1 - stability`

**Legacy Field Reads** (DEPRECATED):
- `HarmonicNodeResonanceHalos.js:??` - `state.instability = node.userData.instability || state.instability`

---

### networkStress / network stress
**Status**: DERIVED GLOBAL METRIC - NOT A STORED NODE METRIC

**Computation**:
- `MetricsRuntime_v1.js:286` - Aggregated from node metrics: `networkStress = baseline.networkStress` (average of `node.userData.metrics.stability`)
- `NetworkMetricsAggregator.js` - Alternative computation when enabled

**Publication**:
- `MetricsRuntime_v1.js:??` - Published to `window.__ATOMA_LIVE_METRICS__.networkStress`
- `MetricsRuntime_v1.js:??` - Mirrored to `window.world.metrics.global.networkStress`

**Readers**:
- Visual systems consume via global metrics object (no direct reads found in search)
- HUD/Overlay systems use global publication

---

## 2️⃣ CANONICAL METRIC CONTAINER USAGE

### ✓ CANONICAL
`node.userData.metrics.stability`

### ✗ VIOLATIONS (Legacy Fields)

| File | Violation | Type |
|------|-----------|------|
| `HarmonicNodeResonanceHalos.js` | `node.userData.instability` | READ (legacy) |
| `CriticalNodeFailureSystem.js:254` | `node.userData.corruption` | READ (legacy fallback) |
| Multiple glyph systems | `node.userData.stability` | READ (legacy, should use `.metrics.stability`) |

**Note**: NodeMetricEngine installs guards via `installLegacyFieldGuards()` that redirect legacy writes to canonical container, but legacy reads still exist.

---

## 3️⃣ METRIC WRITERS AND READERS

| FILE | FUNCTION | METRIC | TYPE |
|------|----------|--------|------|
| `NodeMetricEngine.js` | `onOverload()` | stability | WRITE (impulse) |
| `MetricsRuntime_v1.js` | `_step()` | stability | WRITE (relax) |
| `MetricsRuntime_v1.js` | `_step()` | stability | WRITE (equalize) |
| `CriticalNodeFailureSystem.js` | `updateIsolatedNodeRecovery()` | stability | WRITE (recovery) |
| `NodeMetricEngine.js` | `ensureMetrics()` | stability | WRITE (init) |
| `CriticalNodeFailureSystem.js` | `isNodeCritical()` | stability | READ |
| `MetricsRuntime_v1.js` | `_step()` | stability | READ (for relax) |
| `MetricsRuntime_v1.js` | `_step()` | stability | READ (for equalize) |
| `LinkRendererConduit.js` | `update()` | instability | DERIVED (1 - stability) |
| `NodePersonality_VisualAdapter.js` | (constant) | instability | DERIVED (1 - stability) |
| `_LinkedGlyphSynchronization1_0.js` | (calculation) | instability | DERIVED (1 - stability) |

---

## 4️⃣ CANONICAL WRITERS

### ✓ AUTHORIZED WRITERS
1. **NodeMetricEngine.js**
   - Functions: `onOverload()`, `ensureMetrics()`
   - Type: Event-driven impulses
   - Frequency: On trigger
   - Guarded: Yes (`ALLOWED_WRITERS` includes 'NodeMetricEngine.js')

2. **MetricsRuntime_v1.js**
   - Functions: `_step()` (relaxation + equalization)
   - Type: Fixed 10Hz tick
   - Frequency: Every 0.1 seconds
   - Guarded: Yes (`ALLOWED_WRITERS` includes 'MetricsRuntime_v1.js')

3. **CriticalNodeFailureSystem.js**
   - Function: `updateIsolatedNodeRecovery()`
   - Type: Recovery impulse
   - Frequency: Per-frame when node is isolated
   - Guarded: Uses `applyMetricImpulse()` which is canonical

### ✓ SPAWN-ONLY WRITER
4. **SafeMetricsDNAIntegration1_0.js**
   - Function: `attachMetrics()`
   - Type: One-time spawn snapshot
   - Guarded: Yes (`ALLOWED_WRITERS` includes 'SafeMetricsDNAIntegration1_0.js')

### ⚠️ NON-CANONICAL WRITER
- **MetricCompatibilityLayer.js** - Writes stability from legacy `instability` during spawn, NOT in `ALLOWED_WRITERS` list. Tolerated as compatibility but should be explicitly blessed.

---

## 5️⃣ INSTABILITY DERIVATION PATTERNS

### DERIVATION LOCATIONS

| System | Pattern | Usage Type |
|--------|---------|------------|
| `LinkRendererConduit.js` | `1 - stabilityMetric` | VISUAL (link instability noise) |
| `NodePersonality_VisualAdapter.js` | `1 - stability` (constant definition) | VISUAL (personality weights) |
| `_LinkedGlyphSynchronization1_0.js` | `1 - stability` (variable) | VISUAL (glyph drift) |

### DERIVATION CLASSIFICATION

**VISUAL** (all current derivations):
- Link instability noise/jitter
- Personality weight computation
- Glyph synchronization drift timing

**GAMEPLAY**: None found
**AI**: None found
**DIAGNOSTIC**: None found

---

## 6️⃣ NETWORK STRESS USAGE

### SOURCE: DERIVED FROM NODE METRICS

**Primary Computation** (MetricsRuntime_v1.js):
```javascript
networkStress = average(node.userData.metrics.stability across all nodes)
```

**Alternative Computation** (NetworkMetricsAggregator):
- Weighted average considering link topology
- Only used when `useNetworkMetricsAggregator: true`

### WRITERS
- **NONE** - network stress is never directly written
- Always derived from node metrics aggregation

### READERS
- `window.__ATOMA_LIVE_METRICS__.networkStress` (global publication)
- `window.world.metrics.global.networkStress` (canonical mirror)
- HUD/Overlay systems consume via global object
- Visual systems consume via global object (not directly reading from nodes)

---

## 7️⃣ CROSS-SYSTEM COUPLING

### STABILITY INFLUENCES:

**Link Visuals**:
- `LinkRendererConduit.js` → derives instability → `link.userData.instabilityLevel` → visual jitter/noise

**Node Visuals**:
- `_LinkedGlyphSynchronization1_0.js` → instability factor → glyph drift timing
- Various glyph systems → stability values → glyph appearance/behavior

**AI Behavior**:
- `NodePersonality_VisualAdapter.js` → instability weights → personality-driven visual adaptation
- No direct AI gameplay logic found (only visual adaptation)

**Link Corruption**:
- No direct coupling found
- Stability is separate from corruption systems

**Load Pressure**:
- Both written by NodeMetricEngine on same events (link create/remove/overload)
- But no direct dependency (parallel, not serial)

### DEPENDENCY GRAPH

```
node.userData.metrics.stability
         ↓ (canonical writers)
    MetricsRuntime_v1 relaxation
         ↓ (aggregation)
networkStress (global derived)
         ↓
    HUD/Overlay systems

stability
         ↓ (derivation)
instability = 1 - stability
         ↓
    Link visuals (jitter, noise)
    Glyph visuals (drift)
    Personality adaptation
```

---

## 8️⃣ LEGACY PATTERNS

### LEGACY FIELDS (DEPRECATED)

| Field | Status | Should |
|-------|--------|--------|
| `node.userData.stability` | READ ONLY | Migrate to `node.userData.metrics.stability` |
| `node.userData.instability` | READ ONLY | Should not exist (derive from stability) |
| `link.userData.instability` | WRITTEN (visual) | Acceptable for visual-only state |

### LEGACY SYSTEMS

**HarmonicNodeResonanceHalos.js**:
- Reads `node.userData.instability` (legacy fallback)
- Should migrate to `1 - node.userData.metrics.stability`

**CriticalNodeFailureSystem.js**:
- Reads `node.userData.corruption` (legacy fallback at line 254)
- Should migrate to `node.userData.metrics.corruption`

**Multiple glyph systems** (from METRIC SURFACE.md audit):
- Read `node.userData.stability`, `node.userData.harmony`, etc. directly
- Should migrate to canonical `node.userData.metrics.*` container

---

## 9️⃣ ARCHITECTURE SUMMARY

### STABILITY WRITERS
- **Primary**: NodeMetricEngine (event impulses on overload)
- **Runtime**: MetricsRuntime_v1 (10Hz relaxation + link equalization)
- **Recovery**: CriticalNodeFailureSystem (isolated node recovery via applyMetricImpulse)
- **Spawn**: SafeMetricsDNAIntegration1_0 (one-time archetype initialization)

### STABILITY READERS
- **Gameplay**: CriticalNodeFailureSystem (failure detection)
- **Runtime**: MetricsRuntime_v1 (relaxation/equalization calculations)
- **Visuals**: LinkRendererConduit, glyph systems (via derivation to instability)

### INSTABILITY DERIVATIONS
- **Pattern**: Always `1 - stability`
- **Usage**: VISUAL ONLY (link jitter, glyph drift, personality weights)
- **Storage**: None (derived on demand)

### NETWORK STRESS SYSTEM
- **Source**: Derived global metric (average of node stabilities)
- **Computation**: MetricsRuntime_v1._aggregateNodeMetrics() or NetworkMetricsAggregator
- **Writers**: NONE (read-only derived value)
- **Publication**: window.__ATOMA_LIVE_METRICS__.networkStress

### LEGACY FIELDS
- `node.userData.stability` - READ ONLY (multiple glyph systems)
- `node.userData.instability` - READ ONLY (HarmonicNodeResonanceHalos)
- `node.userData.corruption` - READ ONLY (CriticalNodeFailureSystem fallback)
- Guarded against writes but legacy reads persist

### VISUAL DEPENDENCIES
- LinkRendererConduit: instability (1 - stability) → noise/jitter
- _LinkedGlyphSynchronization1_0: instability → drift timing
- NodePersonality_VisualAdapter: instability → personality weights
- Multiple glyph systems: stability (legacy field) → glyph appearance

---

## 🔟 FINAL SYSTEM MAP

```
┌─────────────────────────────────────────────────────────────────┐
│                    NODE METRICS (CANONICAL)                       │
│            node.userData.metrics.stability [0-1]                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────────┐
                              │                                 │
                    ┌─────────▼─────────┐               ┌──────▼──────────┐
                    │  NODEMETRICENGINE  │               │ METRICSRUNTIME  │
                    │ (Event Impulses)  │               │   (_step 10Hz)  │
                    │ - onOverload()    │               │ - Relaxation    │
                    │ - Link events     │               │ - Equalization  │
                    │ - Init            │               │ - Aggregation   │
                    └─────────┬─────────┘               └──────┬──────────┘
                              │                                 │
                              └─────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DERIVED INSTABILITY                             │
│                  instability = 1 - stability                      │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
    │ LINK      │       │ GLYPH     │       │ NODE      │
    │ VISUALS   │       │ DRIFT     │       │ PERSONAL- │
    │ (jitter,  │       │ TIMING    │       │ ITY       │
    │  noise)   │       │           │       │ WEIGHTS   │
    └───────────┘       └───────────┘       └───────────┘

                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              GLOBAL NETWORK STRESS (DERIVED)                     │
│    networkStress = avg(node.userData.metrics.stability)        │
│    Published to: __ATOMA_LIVE_METRICS__.networkStress          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   HUD / OVERLAYS  │
                    │   CoreMetricsHUD  │
                    │   MetricsOverlay  │
                    └───────────────────┘

```

---

## TOP 10 MOST CRITICAL STABILITY-RELATED SYSTEMS

1. **NodeMetricEngine.js** (CRITICAL)
   - Primary canonical writer
   - Event-driven stability mutations
   - Authority guard enforcement

2. **MetricsRuntime_v1.js** (CRITICAL)
   - 10Hz relaxation (decay toward archetype baseline)
   - Link equalization (stability smoothing between nodes)
   - Global network stress aggregation
   - Publication to HUD systems

3. **CriticalNodeFailureSystem.js** (CRITICAL)
   - Reads stability for failure detection (threshold: 0.2)
   - Recovery impulse for isolated nodes
   - Links sever on low stability + high corruption

4. **SafeMetricsDNAIntegration1_0.js** (HIGH)
   - Spawn-time stability initialization
   - Archetype-based baselines
   - DNA snapshot wins over NodeMetricEngine defaults

5. **MetricCompatibilityLayer.js** (MEDIUM)
   - Non-canonical compatibility writer
   - Fills stability from legacy instability field
   - Should be explicitly blessed or migrated

6. **LinkRendererConduit.js** (MEDIUM)
   - Derives instability for link visuals
   - Visual noise/jitter based on stability
   - Visual-only, no gameplay impact

7. **NetworkMetricsAggregator.js** (MEDIUM)
   - Alternative network stress computation
   - Considers link topology
   - Optional (disabled by default)

8. **HarmonicNodeResonanceHalos.js** (LOW)
   - Reads legacy `node.userData.instability`
   - Should migrate to canonical container

9. **_LinkedGlyphSynchronization1_0.js** (LOW)
   - Derives instability for glyph drift
   - Visual-only timing calculation

10. **NodePersonality_VisualAdapter.js** (LOW)
    - Defines instability weights for personality
    - Visual adaptation only

---

## RECOMMENDATIONS (NO CODE CHANGES - OBSERVATION ONLY)

1. **Legacy Field Migration**: Multiple systems read `node.userData.stability`, `node.userData.instability`, `node.userData.corruption` directly. These should migrate to `node.userData.metrics.*` container.

2. **MetricCompatibilityLayer Authority**: This system writes stability outside the `ALLOWED_WRITERS` list. Should be explicitly blessed or routed through NodeMetricEngine.

3. **Instability as Derived Value**: Current pattern is correct - instability should always be derived from stability, not stored. No changes needed.

4. **Network Stress Derivation**: Current implementation is correct - always derived from node metrics, never directly written. No changes needed.

5. **Visual vs Gameplay Separation**: All instability derivations are visual-only, which is architecturally sound. No coupling to gameplay systems.

6. **Canonical Writer Enforcement**: The `ALLOWED_WRITERS` list in NodeMetricEngine is working correctly. Consider adding MetricCompatibilityLayer if compatibility fills are permanent.

---

## CONCLUSION

The ATOMA stability system has a **clean canonical path** with clear authority boundaries:

- **Canonical container**: `node.userData.metrics.stability` ✓
- **Authorized writers**: NodeMetricEngine, MetricsRuntime_v1, CriticalNodeFailureSystem, SafeMetricsDNAIntegration ✓
- **Derived values**: instability (visuals only), networkStress (global aggregation) ✓
- **No unauthorized mutations detected** (except tolerated compatibility layer) ✓

**Primary debt**: Legacy field reads (`node.userData.stability`, `node.userData.instability`, `node.userData.corruption`) in multiple visual systems. These should migrate to canonical container but pose no functional risk since legacy writes are guarded against.

**Overall health**: STABLE - The system is well-architected with proper separation of concerns and clear authority boundaries.