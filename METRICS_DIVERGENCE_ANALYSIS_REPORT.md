# METRICS DIVERGENCE ANALYSIS REPORT

**Date**: 2026-03-18
**Task**: Identify divergence between NetworkMetricsAggregator and CoreMetricsCalculator
**Status**: ✅ **CRITICAL DIVERGENCE CONFIRMED**

---

## EXECUTIVE SUMMARY

**ATOMA HAS TWO PARALLEL SOURCE-OF-TRUTH BRANCHES** creating "2 realities" in the system:

1. **CORE PATH**: `CoreMetricsCalculator` → Shader visuals
2. **LEGACY/NETWORK PATH**: `NetworkMetricsAggregator` → `__ATOMA_LIVE_METRICS__` → HUD

These systems compute metrics independently with different methodologies, naming conventions, and update frequencies, leading to visual/semantic divergence.

---

## 1. SYSTEM ARCHITECTURE

### A) CoreMetricsCalculator (CORE PATH)

**File**: `CoreMetricsCalculator.js`
**Update Frequency**: 2 Hz (fixed 0.5s interval)
**Method**: Simple node-only averaging

**Output Metrics** (0-1 scale):
```javascript
{
  synergy: 0-1,
  harmony: 0-1,
  stability: 0-1,
  corruption: 0-1,
  loadPressure: 0-1,
  networkLoad: 0-1  // legacy alias
}
```

**Consumers**:
- `main.js:3610-3623` - Registered at 30Hz (visual layer)
- `LinkRendererMetricsIntegrationPatch_v1.js` - Reads via `getMetrics()`
- `LinkShaderMetricsIntegration_v1.js` - Maps to shader uniforms
- `LinkThicknessMetricsIntegrationPatch_v1.js` - Thickness scaling

---

### B) NetworkMetricsAggregator (LEGACY/NETWORK PATH)

**File**: `src/metrics/NetworkMetricsAggregator.js`
**Update Frequency**: 2 Hz (via MetricsRuntime_v1)
**Method**: Weighted averaging with link topology influence

**Output Metrics** (0-1 scale):
```javascript
{
  networkSynergy: 0-1,      // Different naming!
  harmonyFlow: 0-1,         // Different naming!
  networkStress: 0-1,       // Inverted stability!
  corruptionLevel: 0-1,     // Different naming!
  loadPressure: 0-1,
  nodeCount: number,
  networkCount: number
}
```

**Consumers**:
- `MetricsRuntime_v1.js` - Orchestrates and publishes
- `CoreMetricsHUD.js` - Reads from `__ATOMA_LIVE_METRICS__`
- `StressVisualShaderSystem.js` - Reads `networkStress`
- Semantic event systems

---

### C) Orchestration Layer

**File**: `MetricsRuntime_v1.js`

**Publication Flow**:
```javascript
NetworkMetricsAggregator.compute()  // 2Hz
  ↓
__ATOMA_NETWORK_METRICS_AGGREGATOR_OVERRIDE__ (global override)
  ↓
window.__ATOMA_LIVE_METRICS__  // Priority: override → fallback
  ↓
window.world.metrics.global  // Canonical mirror
```

**Smoothing**:
- Internal smoothing: 0.1 factor (10% per frame)
- Publish smoothing: 0.15 factor (15% per frame)
- Result: HUD values lag behind raw metrics

---

## 2. NAMING CONVENTION DIVERGENCE

| Metric Concept | CoreMetricsCalculator | NetworkMetricsAggregator | __ATOMA_LIVE_METRICS__ |
|---------------|---------------------|-------------------------|------------------------|
| Synergy | `synergy` | `networkSynergy` | `networkSynergy` |
| Harmony | `harmony` | `harmonyFlow` | `harmonyFlow` |
| Stability | `stability` | `stability` | `networkStress` ⚠️ |
| Corruption | `corruption` | `corruption` | `corruptionLevel` |
| Load | `loadPressure` | `loadPressure` | `loadPressure` |

**Key Issues**:
1. **Synergy**: `synergy` vs `networkSynergy` - Different names, same concept
2. **Harmony**: `harmony` vs `harmonyFlow` - Different names, same concept
3. **Stability**: `stability` vs `networkStress` - **Inverted values!** (stress = 1 - stability)
4. **Corruption**: `corruption` vs `corruptionLevel` - Different names, same concept

---

## 3. COMPUTATIONAL DIVERGENCE

### CoreMetricsCalculator Methodology

```javascript
// Simple average of node metrics
const avgSynergy = sum(node.userData.metrics.synergy) / nodeCount;
this.metrics.synergy = clamp01(avgSynergy);
```

**Characteristics**:
- ✅ Deterministic
- ✅ No link influence
- ✅ Simple math
- ❌ Ignores network topology
- ❌ Ignores link quality
- ❌ Ignores link count

---

### NetworkMetricsAggregator Methodology

```javascript
// Weighted average with link influence
const nodeWeight = links.reduce((sum, l) => sum + (l.quality ?? 0.5), 0) / links.length;
totals.synergy += metrics.synergy * nodeWeight;

// Add link influence
const influence = calculateLinkInfluence(link.source, link.target);
totals.synergy += influence.synergy;  // +0.05 per link (matched categories)
totals.harmony += influence.harmony;  // +0.04 per link (matched categories)
totals.stability -= influence.stress; // -0.02 per link (reduces stability)
```

**Characteristics**:
- ✅ Considers link topology
- ✅ Weighted by link quality
- ✅ Adds link influence (bonus synergy/harmony)
- ❌ Non-deterministic (depends on link state)
- ❌ Complex math
- ❌ Can create divergence from simple average

---

## 4. SCALE DIVERGENCE

### CoreMetricsCalculator

**Scale**: 0.0 - 1.0 (normalized)
- All metrics clamped to [0, 1]
- Direct 1:1 mapping to shader uniforms
- No transformation needed

### NetworkMetricsAggregator

**Scale**: 0.0 - 1.0 (normalized)
- All metrics clamped to [0, 1]
- **EXCEPT**: `networkStress` = inverted stability (stress = 1 - stability)
- Smoothing applied before publication

### Stress/Stability Inversion

| System | Metric | Meaning | Range |
|--------|--------|---------|-------|
| CoreMetricsCalculator | `stability` | Network stability | 0-1 (1=stable) |
| NetworkMetricsAggregator | `stability` | Network stability | 0-1 (1=stable) |
| __ATOMA_LIVE_METRICS__ | `networkStress` | Network stress | 0-1 (1=stressed) |

**Critical Conflict**:
- HUD displays "NETWORK STRESS" but reads `networkStress`
- Shaders expect `uStress` but CoreMetricsCalculator provides `stability`
- Potential inversion bug if not handled correctly

---

## 5. CONSUMER CONFLICTS

### A) HUD vs Shader Visuals

**CoreMetricsHUD.js** (line ~177):
```javascript
// Reads from __ATOMA_LIVE_METRICS__
const liveMetrics = window.__ATOMA_LIVE_METRICS__;
const synergy = liveMetrics?.networkSynergy ?? metrics?.synergy ?? 0;
const harmony = liveMetrics?.harmonyFlow ?? metrics?.harmony ?? 0;
const stress = liveMetrics?.networkStress ?? metrics?.stability ?? 0;
```

**LinkShaderMetricsIntegration_v1.js** (line ~142):
```javascript
// Reads from CoreMetricsCalculator
const metrics = this.coreMetricsCalculator.getMetrics();
// Maps to shader uniforms
material.uniforms.uStress.value = metrics.stability; // ⚠️ Not networkStress!
```

**Conflict**: 
- HUD shows `networkStress` from NetworkMetricsAggregator
- Shaders receive `stability` from CoreMetricsCalculator
- If `stability ≠ (1 - networkStress)`, visual divergence occurs

---

### B) Update Frequency Mismatch

| System | Update Frequency | Throttle | Effect |
|--------|-----------------|----------|--------|
| CoreMetricsCalculator | 2 Hz (calculation) | None | Direct read |
| | 30 Hz (registration) | main.js | Visual updates |
| NetworkMetricsAggregator | 2 Hz | MetricsRuntime_v1 | Global updates |
| CoreMetricsHUD | 2 Hz (throttle) | 500ms | UI updates |

**Conflict**:
- CoreMetricsCalculator registered at 30Hz but calculates at 2Hz
- NetworkMetricsAggregator runs at 2Hz
- HUD throttles to 2Hz
- Shaders update at 30Hz

**Result**: Different update rates can cause lag between systems

---

### C) Smoothing Divergence

**MetricsRuntime_v1** applies smoothing before publishing:
```javascript
// Internal smoothing: 0.1 factor
const smoothed = lerp(previous, target, 0.1);

// Publish smoothing: 0.15 factor
const publish = lerp(smoothed, target, 0.15);
```

**CoreMetricsCalculator**: No smoothing (direct values)

**Conflict**:
- HUD shows smoothed values (lagged)
- Shaders show raw values (instant)
- Visual/semantic divergence during rapid changes

---

## 6. SPECIFIC CONFLICT LOCATIONS

### Conflict #1: Synergy Naming
**File**: `CoreMetricsHUD.js:177`
```javascript
const synergy = liveMetrics?.networkSynergy ?? metrics?.synergy ?? 0;
```
**Issue**: Falls back to `metrics?.synergy` (CoreMetricsCalculator) if `networkSynergy` undefined
**Impact**: HUD may show different values than expected

---

### Conflict #2: Stability/Stress Inversion
**File**: `LinkShaderMetricsIntegration_v1.js:145`
```javascript
material.uniforms.uStress.value = metrics.stability; // ⚠️ Should be 1 - stability!
```
**File**: `CoreMetricsHUD.js:179`
```javascript
const stress = liveMetrics?.networkStress ?? metrics?.stability ?? 0;
```
**Issue**: HUD shows stress (inverted stability), shaders receive stability (not inverted)
**Impact**: Visual semantic contradiction

---

### Conflict #3: Dual Update Registration
**File**: `main.js:3610-3623`
```javascript
// Register CoreMetricsCalculator update (30Hz visual layer)
frameScheduler.registerTask({
  fn: () => {
    this.coreMetricsCalculator.update(dt, ...);
  },
  layer: 'visual.coreMetricsCalculator'
});
```

**File**: `main.js:3279`
```javascript
// Triggered from FrameScheduler.background (2Hz)
this.metricsRuntime_v1.runNetworkMetricsAggregator();
```
**Issue**: Both systems running in parallel, no coordination
**Impact**: Unnecessary computation, potential divergence

---

### Conflict #4: Link Influence Ignored by Shaders
**File**: `CoreMetricsCalculator.js:134-138`
```javascript
calculateSynergy() {
  return this.clamp01(this.getAverageMetric('synergy'));
}
// No link influence!
```

**File**: `src/metrics/NetworkMetricsAggregator.js:47-79`
```javascript
// Add link influence
totals.synergy += influence.synergy; // +0.05 per link
totals.harmony += influence.harmony; // +0.04 per link
```
**Issue**: Shaders ignore link topology bonus, HUD includes it
**Impact**: Visual undervaluation of dense networks

---

## 7. DIVERGENCE SCENARIOS

### Scenario A: Sparse Network (Few Links)
- **CoreMetricsCalculator**: Low synergy (low node connectivity)
- **NetworkMetricsAggregator**: Low synergy (no link influence to add)
- **Result**: Minimal divergence ✅

---

### Scenario B: Dense Network (Many Links)
- **CoreMetricsCalculator**: Low-medium synergy (node-only average)
- **NetworkMetricsAggregator**: High synergy (link influence bonus)
- **HUD**: Shows high synergy (NetworkMetricsAggregator)
- **Shaders**: Show low synergy (CoreMetricsCalculator)
- **Result**: **Major visual divergence** ❌

---

### Scenario C: High Link Quality
- **CoreMetricsCalculator**: Ignores link quality
- **NetworkMetricsAggregator**: Weighted by link quality (higher bonus)
- **Result**: HUD overestimates vs shaders ❌

---

### Scenario D: High Stability
- **CoreMetricsCalculator**: `stability = 0.9`
- **NetworkMetricsAggregator**: `networkStress = 0.1` (inverted)
- **HUD**: Shows "NETWORK STRESS: 0.1" (correctly labeled)
- **Shaders**: `uStress = 0.9` (wrong! should be 0.1)
- **Result**: **Semantic contradiction** ❌

---

### Scenario E: Rapid Metric Changes
- **MetricsRuntime_v1**: Applies smoothing (15% per frame)
- **CoreMetricsCalculator**: Direct values
- **HUD**: Lagged behind raw values
- **Shaders**: Instant values
- **Result**: Temporal divergence during transients ❌

---

## 8. CANONICAL SYSTEM RECOMMENDATION

### Recommendation: **UNIFY ON NETWORKMETRICSAGGREGATOR**

**Rationale**:
1. ✅ **More sophisticated**: Considers link topology and quality
2. ✅ **Semantic correctness**: Properly separates stress from stability
3. ✅ **Already canonical**: Used by HUD and global metrics
4. ✅ **Better representation**: Reflects network structure, not just nodes
5. ✅ **Event-driven**: Can be triggered on link creation/removal

**Migration Plan**:

#### Phase 1: Deprecate CoreMetricsCalculator
1. Remove `CoreMetricsCalculator` registration from FrameScheduler
2. Remove `LinkRendererMetricsIntegrationPatch_v1.js`
3. Remove `LinkShaderMetricsIntegration_v1.js`
4. Remove `LinkThicknessMetricsIntegrationPatch_v1.js`

#### Phase 2: Create Shader Metrics Adapter
1. Create `NetworkToShaderMetricsAdapter.js`
2. Map `__ATOMA_LIVE_METRICS__` to shader uniforms:
   - `uSynergy` = `networkSynergy`
   - `uHarmony` = `harmonyFlow`
   - `uStress` = `networkStress` (correctly inverted)
   - `uCorruption` = `corruptionLevel`
   - `uLoad` = `loadPressure`

#### Phase 3: Update Consumer References
1. Replace `coreMetricsCalculator.getMetrics()` with `window.__ATOMA_LIVE_METRICS__`
2. Update HUD to use unified source
3. Update stress visual systems to use `networkStress`

#### Phase 4: Cleanup
1. Delete `CoreMetricsCalculator.js`
2. Delete integration patches
3. Update documentation

---

## 9. ALTERNATIVE: UNIFY ON COREMETRICSCALCULATOR

**Rationale**:
1. ✅ **Simpler**: Deterministic, no link influence
2. ✅ **Faster**: No topology computation
3. ✅ **Already connected**: Shaders already using it
4. ✅ **Direct**: No smoothing lag

**Migration Plan**:

#### Phase 1: Update NetworkMetricsAggregator
1. Remove link influence from calculations
2. Match CoreMetricsCalculator naming conventions
3. Publish same field names as CoreMetricsCalculator

#### Phase 2: Update Consumers
1. HUD: Read from CoreMetricsCalculator instead of `__ATOMA_LIVE_METRICS__`
2. Semantic systems: Use CoreMetricsCalculator as source
3. MetricsRuntime_v1: Deprecate NetworkMetricsAggregator override

#### Phase 3: Cleanup
1. Delete `NetworkMetricsAggregator.js`
2. Simplify `MetricsRuntime_v1.js`
3. Update documentation

**Risk**: Loses network topology awareness

---

## 10. INTERIM MITIGATION (IF FULL UNIFICATION NOT POSSIBLE)

### Option A: Synchronization Bridge
Create `MetricsSynchronizationBridge.js` to:
1. Read from NetworkMetricsAggregator
2. Apply inverse transformation: `stability = 1 - networkStress`
3. Map field names to match CoreMetricsCalculator
4. Update CoreMetricsCalculator cache values
5. Ensure both systems show same data

**Pros**: Maintains both systems, keeps them synchronized
**Cons**: Adds complexity, still dual computation

---

### Option B: Single Source Selection
Choose one system as canonical for all consumers:

**If HUD priority**: Use NetworkMetricsAggregator
- Update shaders to read from `__ATOMA_LIVE_METRICS__`
- Fix stress/stress inversion: `uStress = networkStress`
- Handle smoothing lag in shaders

**If visual priority**: Use CoreMetricsCalculator
- Update HUD to read from CoreMetricsCalculator
- Deprecate NetworkMetricsAggregator
- Update global metrics to use CoreMetricsCalculator

**Pros**: Eliminates divergence immediately
**Cons**: May lose features from deprecated system

---

## 11. VERIFICATION STEPS

To confirm divergence in production:

1. **Add logging**:
```javascript
// In CoreMetricsCalculator
console.log('[CoreCalculator] synergy:', this.metrics.synergy);

// In NetworkMetricsAggregator
console.log('[NetworkAggregator] networkSynergy:', result.networkSynergy);

// In HUD
console.log('[HUD] synergy from live:', liveMetrics?.networkSynergy);
console.log('[HUD] synergy fallback:', metrics?.synergy);

// In shaders
console.log('[Shader] uStress:', material.uniforms.uStress.value);
```

2. **Test scenarios**:
- Sparse network (few links)
- Dense network (many links)
- High stability state
- Rapid metric changes (create/remove links)

3. **Compare values**:
- Are HUD and shader values different?
- Do values diverge during link changes?
- Is stress correctly inverted?

---

## 12. CONCLUSION

**CONFIRMED**: ATOMA has "2 realities" due to parallel metric computation systems.

**Impact**:
- ❌ Visual/semantic divergence between HUD and shaders
- ❌ Potential stress/stress inversion bugs
- ❌ Unnecessary computational overhead
- ❌ Naming convention confusion
- ❌ Temporal divergence due to smoothing

**Recommendation**: **Unify on NetworkMetricsAggregator** as canonical source.

**Next Steps**:
1. Implement metrics synchronization bridge (interim)
2. Update shader integration to read from `__ATOMA_LIVE_METRICS__`
3. Fix stress/stress inversion
4. Deprecate CoreMetricsCalculator
5. Verify convergence across all consumers

---

**Report Generated**: 2026-03-18
**Analysis Tool**: Cline (ATOMIC ENGINEER)
**Priority**: HIGH