# TIMING MECHANISMS & METRICS CALCULATION ANALYSIS
## Date: 2026-03-28

---

## EXECUTIVE SUMMARY

ATOMA uses a **multi-layered timing architecture** with `FrameScheduler` as the central authority. Metrics calculations are already partially rate-limited (10Hz for core metrics, 2Hz for aggregation), but opportunities exist for further optimization.

**Key Finding:** The system already implements rate limiting for metrics calculation through `MetricsRuntime_v1._step()` running at 10Hz, with `CoreMetricsCalculator` running at 2Hz. However, many visual systems read metrics per-frame (60Hz) without explicit throttling.

---

## 1. TIMING AUTHORITIES

### Primary Authority: `FrameScheduler.js`
- **Location**: Root directory
- **Architecture**: Three-layer frequency separation
  - **Simulation Layer**: 10Hz (0.1s fixed timestep)
  - **Visual Layer**: 30Hz
  - **Runtime Layer**: 60Hz (full frame rate)
  - **Background Layer**: 2Hz (low-frequency tasks)
- **Pattern**: Fixed timestep accumulator
  ```javascript
  this._accumulator += dt;
  while (this._accumulator >= this._fixedDt) {
    this._step(this._fixedDt);
    this._accumulator -= this._fixedDt;
  }
  ```

### Secondary Authorities

1. **`MetricsRuntime_v1.js`**
   - Runs at **10Hz** via fixed timestep
   - Uses accumulator pattern (`_accumulator`, `_fixedDt = 0.1`)
   - Orchestrates all metrics subsystems

2. **`CoreMetricsCalculator.js`**
   - Runs at **2Hz** (0.5s interval)
   - Low-frequency metrics aggregation
   - Read-only computation

3. **Direct deltaTime Systems**
   - Many systems accept `deltaTime` directly from animation loop
   - No explicit rate limiting (runs at full frame rate)

---

## 2. METRICS CALCULATION FREQUENCIES

### Current Rate-Limited Metrics (GOOD)

| System | Frequency | Implementation | File |
|--------|-----------|----------------|------|
| **NodeMetrics** | 10Hz | Fixed timestep via `MetricsRuntime_v1._step()` | `MetricsRuntime_v1.js` |
| **LinkQualityCalculator** | 10Hz | Fixed timestep via `MetricsRuntime_v1._step()` | `MetricsRuntime_v1.js` |
| **NodeQualityCalculator** | 10Hz | Fixed timestep via `MetricsRuntime_v1._step()` | `MetricsRuntime_v1.js` |
| **VisualMetricModel** | 10Hz | Fixed timestep via `MetricsRuntime_v1._step()` | `MetricsRuntime_v1.js` |
| **SafeMetricsFX** | 10Hz | Fixed timestep via `MetricsRuntime_v1._step()` | `MetricsRuntime_v1.js` |
| **CoreMetricsCalculator** | 2Hz | `calculationInterval = 0.5` | `CoreMetricsCalculator.js` |
| **NetworkMetricsAggregator** | 2Hz | Background layer in `FrameScheduler` | `FrameScheduler.js` |

### Non-Rate-Limited Metrics Reading (OPTIMIZATION OPPORTUNITY)

These systems **read** metrics every frame without throttling:

| System | Frequency | Pattern | Risk Level |
|--------|-----------|---------|------------|
| **LinkSynergyColorTransition** | 60Hz | Reads synergy every frame | LOW |
| **NeonLinkVisuals** | 60Hz | Reads metrics in visual update | LOW |
| **CorruptionDesaturation** | 60Hz | Reads corruption per link | MEDIUM |
| **DynamicLinkColorSystem** | 60Hz | Reads synergy for all links | MEDIUM |
| **VisualMetricModel** | 10Hz (calc) / 60Hz (read) | Calculates 10Hz, reads 60Hz | LOW |
| **ArchetypeColorPalette** | 30Hz | Reads metrics for color shifts | LOW |

---

## 3. TIMING PATTERNS DISCOVERED

### Pattern 1: Fixed Timestep (Best Practice)
```javascript
// MetricsRuntime_v1.js
this._accumulator += dt;
while (this._accumulator >= this._fixedDt) {
  this._step(this._fixedDt);
  this._accumulator -= this._fixedDt;
}
```
**Used by**: `MetricsRuntime_v1`, `FrameScheduler`

### Pattern 2: Interval-Based Update
```javascript
// CoreMetricsCalculator.js
this.lastCalculationTime += deltaTime;
if (this.lastCalculationTime < this.calculationInterval) {
  return false;
}
this.lastCalculationTime = 0;
```
**Used by**: `CoreMetricsCalculator`

### Pattern 3: FrameScheduler Layer Registration
```javascript
// main.js
this.frameScheduler.register('simulation', (dt) => {
  this.metricsRuntime_v1?.update?.(dt);
}, 'simulation.metricsRuntime_v1');
```
**Used by**: Most systems in `main.js`

### Pattern 4: Direct deltaTime (No Rate Limiting)
```javascript
update(deltaTime) {
  // No accumulator, no interval check
  // Runs at full frame rate
}
```
**Used by**: Many visual systems

---

## 4. METRICS CALCULATION LOCATIONS

### Calculation (Write) Sites

1. **`src/metrics/NodeMetricEngine.js`**
   - **Frequency**: 10Hz (via `MetricsRuntime_v1`)
   - **Metrics**: `synergy`, `harmony`, `stability`, `corruption`, `loadPressure`
   - **Status**: ✅ Rate-limited

2. **`LinkQualityCalculator.js`**
   - **Frequency**: 10Hz (via `MetricsRuntime_v1`)
   - **Metrics**: Link quality scores
   - **Status**: ✅ Rate-limited

3. **`NodeQualityCalculator.js`**
   - **Frequency**: 10Hz (via `MetricsRuntime_v1`)
   - **Metrics**: Node quality scores
   - **Status**: ✅ Rate-limited

4. **`CoreMetricsCalculator.js`**
   - **Frequency**: 2Hz
   - **Metrics**: Network-level aggregates
   - **Status**: ✅ Rate-limited

### Reading (Visual) Sites

These systems **consume** metrics, don't calculate them:

1. **`LinkSynergyColorTransition.js`** - Reads synergy for link colors
2. **`NeonLinkVisuals.js`** - Reads metrics for emissive effects
3. **`CorruptionDesaturationIntegrationPatch.js`** - Reads corruption for grayscale
4. **`DynamicLinkColorSystem.js`** - Reads synergy for all links
5. **`ArchetypeColorPaletteSystem_v1.js`** - Reads metrics for archetype colors

**Note**: Reading is cheap; calculation is expensive. Current implementation correctly separates these concerns.

---

## 5. IDENTIFIED TICK/DELTA MECHANISMS

### Explicit Timing Keywords Found
- `requestAnimationFrame` - Main animation loop (60Hz)
- `setInterval` - Rare, used for one-off tasks
- `setTimeout` - Rare, used for delays
- `performance.now()` - High-precision timestamps
- `deltaTime` / `dt` - Frame delta time passed to update()
- `accumulator` - Fixed timestep accumulator
- `_fixedDt` - Fixed timestep constant (0.1 = 10Hz)

### Implicit Timing (via update callbacks)
```javascript
// FrameScheduler registered systems
this.frameScheduler.register('simulation', (dt) => {
  this.system.update?.(dt);
}, 'id');
```

---

## 6. RECOMMENDATIONS FOR 10Hz METRICS LIMITATION

### ✅ Already Correct (No Action Needed)

1. **Core Metrics Calculation**
   - Already running at 10Hz via `MetricsRuntime_v1._step()`
   - No changes needed

2. **Network Aggregation**
   - Already running at 2Hz via `FrameScheduler.background` layer
   - No changes needed

### ⚠️ Potential Optimizations (Optional)

These visual systems **read metrics every frame**. Consider rate-limiting if CPU profiling shows high cost:

1. **`DynamicLinkColorSystem.updateAllLinkColors()`**
   - **Current**: 60Hz (visual layer)
   - **Proposed**: Add accumulator to run at 30Hz (same as visual layer)
   - **Impact**: Low (visual systems should stay responsive)

2. **`CorruptionDesaturationIntegrationPatch`**
   - **Current**: 60Hz (per link)
   - **Proposed**: Cache corruption values, update only when changed
   - **Impact**: Medium (scales with link count)

3. **Archetype Color Transitions**
   - **Current**: 30Hz (archetypeColorFX)
   - **Status**: Appropriate for smooth transitions
   - **Action**: None (30Hz is reasonable for visual smoothing)

### 🔴 Critical Issues (None Found)

No systems are calculating metrics at inappropriate frequencies. All metric calculation is properly rate-limited.

---

## 7. TIMING ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     MAIN ANIMATION LOOP                       │
│                   requestAnimationFrame                        │
│                        (60Hz base)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      FrameScheduler                            │
│  ┌─────────────┬──────────────┬─────────────┬──────────────┐  │
│  │ 60Hz        │ 30Hz         │ 10Hz        │ 2Hz          │  │
│  │ Runtime     │ Visual       │ Simulation  │ Background   │  │
│  │             │              │             │              │  │
│  │ - Input     │ - FX         │ - Metrics   │ - Network    │  │
│  │ - Interaction│ - Shaders   │   Runtime   │   Aggregator │  │
│  │ - HitProxy  │ - Transitions│ - Harmony   │ - Ambient    │  │
│  │             │              │   Cascade   │ - Conscious  │  │
│  └─────────────┴──────────────┴─────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  MetricsRuntime_v1                            │
│  Fixed Timestep: 10Hz (_fixedDt = 0.1)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ update(deltaTime)                                   │   │
│  │   ├─ accumulate delta                                │   │
│  │   └─ while (accumulator >= 0.1) _step(0.1)          │   │
│  │                                                        │   │
│  │ _step(dt)                                            │   │
│  │   ├─ nodeDynamicMetrics.update(dt)                   │   │
│  │   ├─ linkQualityCalculator.update(dt)                 │   │
│  │   ├─ nodeQualityCalculator.update(dt)                │   │
│  │   ├─ visualMetricModel.update(dt)                    │   │
│  │   ├─ safeMetricsFX.update(dt)                        │   │
│  │   ├─ updateNodeMetrics() [NodeMetricEngine]           │   │
│  │   └─ _canonicalWriteLinkCorruptionMetrics()          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                CoreMetricsCalculator (2Hz)                    │
│  calculationInterval = 0.5 (2 updates per second)            │
│  Reads aggregated metrics, computes network-level values     │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. KEY FINDINGS SUMMARY

### ✅ What's Working Well

1. **Metrics calculation is properly rate-limited** at 10Hz via `MetricsRuntime_v1`
2. **Network aggregation is throttled** to 2Hz for low overhead
3. **FrameScheduler provides clean frequency separation**
4. **Fixed timestep pattern** ensures deterministic simulation

### ⚠️ Observations

1. **Visual systems read metrics at 60Hz**, but this is intentional for smooth animations
2. **No metrics are calculated at inappropriate frequencies** (all calculation is 10Hz or lower)
3. **FrameScheduler is the single source of truth** for timing authority
4. **No zombie tick systems found** - all updates are properly integrated

### 📊 Frequency Distribution

| Frequency | System Count | Example Systems |
|-----------|--------------|-----------------|
| 60Hz (Runtime) | ~15 | Input, HitProxy, Interaction |
| 30Hz (Visual) | ~40 | FX, Shaders, Transitions |
| 10Hz (Simulation) | ~8 | **Metrics**, Harmony, Personality |
| 2Hz (Background) | ~5 | Network Aggregator, Ambient |

---

## 9. ACTION ITEMS

### None Required (System is Correctly Designed)

The metrics calculation system is already optimized:
- Core metrics: 10Hz ✅
- Network aggregation: 2Hz ✅
- Visual reading: 60Hz (intentional for smoothness) ✅

### Optional Future Optimizations (Low Priority)

If CPU profiling shows visual systems consuming too much CPU:
1. Add accumulator pattern to `DynamicLinkColorSystem` to run at 30Hz
2. Implement dirty-flag pattern for corruption desaturation
3. Cache metric reads in visual systems when values haven't changed

---

## 10. CONCLUSION

**ATOMA's metrics timing architecture is sound.** The system correctly separates:
- **Calculation** (expensive, rate-limited to 10Hz)
- **Aggregation** (expensive, rate-limited to 2Hz)
- **Reading** (cheap, runs at frame rate for smooth visuals)

No urgent changes needed. The existing `MetricsRuntime_v1` implementation with fixed timestep at 10Hz provides the desired rate limiting for metrics calculation.

**Recommendation**: Maintain current architecture. Focus optimization efforts on other subsystems if performance issues arise.