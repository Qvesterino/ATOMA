# ATOMA METRICS SYSTEM - COMPLETE AUDIT REPORT

**Date:** 2026-04-07  
**Scope:** Full metrics system analysis (READ-ONLY)  
**Mode:** EVOLUTION_V2 / CONTROLLED INNOVATION

---

## EXECUTIVE SUMMARY

The ATOMA metrics system has undergone significant evolution toward canonical single-source-of-truth architecture. The system now has:

✅ **STABLE:**
- Canonical metric engine (NodeMetricEngine.js) with clear write authority
- Event-driven architecture via semanticBus
- 10Hz simulation / 30Hz visual / 60Hz runtime frequency separation
- Legacy field guards preventing duplicate writes

⚠️ **NEEDS ATTENTION:**
- Multiple legacy write paths still active (HarmonyStabilizationSystem, LinkCorruptionTransmission)
- Duplicate metric storage (userData.metrics.* AND userData.* mirrors)
- Event consumers reading from inconsistent sources
- Some visual systems bypassing canonical metrics

❌ **CRITICAL ISSUES:**
- No single registry of all metric writers
- Some systems writing directly to userData fields bypassing guards
- Inconsistent event emission patterns across systems

---

## 1. CORE METRIC SYSTEMS IDENTIFICATION

### 1.1 Canonical Metric Engine

**File:** `src/metrics/NodeMetricEngine.js`  
**Role:** Single authority for node gameplay metrics  
**Type:** WRITE ONLY (canonical)

**Metrics Written:**
- `node.userData.metrics.synergy` (DERIVED - read-only for external writers)
- `node.userData.metrics.harmony` (primary)
- `node.userData.metrics.stability` (primary)
- `node.userData.metrics.corruption` (primary)
- `node.userData.metrics.loadPressure` (primary)
- `node.userData.metrics.load` (alias for loadPressure)
- `node.userData.metrics.loadRatio` (alias for loadPressure)

**Frequency:** 10Hz (fixed tick, FIXED_TICK_BASE = 0.1s)  
**Integration Point:** Called from MetricsRuntime_v1._step()

**Key Functions:**
- `updateNodeMetrics()` - Main update loop
- `deriveSynergy()` - Calculates synergy from other metrics
- `applyMetricImpulse()` - Applies impulse changes
- `setMetric()` - Absolute value setter
- `onNodeSpawn()`, `onLinkCreated()`, `onLinkRemoved()`, `onOverload()` - Lifecycle hooks

---

### 1.2 Metrics Runtime Orchestrator

**File:** `MetricsRuntime_v1.js`  
**Role:** Central orchestration wrapper  
**Type:** ORCHESTRATION (no direct metric calculation)

**Responsibilities:**
- Manages 10Hz fixed-step update loop
- Orchestrates multiple metric subsystems
- Publishes live metrics to `window.__ATOMA_LIVE_METRICS__`
- Runs NetworkMetricsAggregator (2Hz)
- Canonical writer for link corruption metrics
- Canonical writer for network metrics (fatigue, hubId, activeLinkCount)

**Update Frequency:** 10Hz (simulation), 2Hz (network aggregation)  
**Location in FrameScheduler:** Main loop → MetricsRuntime_v1.update(delta)

**Subsystems Orchestrated:**
1. nodeDynamicMetrics
2. linkQualityCalculator
3. nodeQualityCalculator
4. visualMetricModel
5. safeMetricsFX
6. NodeMetricEngine (canonical node metrics)

---

### 1.3 Network Metrics Aggregator

**File:** `src/metrics/NetworkMetricsAggregator.js`  
**Role:** Network-wide metric aggregation  
**Type:** AGGREGATOR (reads node metrics, produces network metrics)

**Metrics Produced:**
- `networkSynergy` - Average node synergy
- `harmonyFlow` - Aggregate harmony
- `networkStress` - Derived from load + instability
- `corruptionLevel` - Average node corruption
- `loadPressure` - Average node load

**Frequency:** 2Hz (via FrameScheduler.background layer)  
**Integration Point:** MetricsRuntime_v1.runNetworkMetricsAggregator()

---

## 2. WRITE AUTHORITY MAP

### 2.1 Node Metrics (Primary)

| Metric Field | Canonical Writer | Frequency | Method | Guarded |
|--------------|------------------|-----------|--------|---------|
| `node.userData.metrics.synergy` | NodeMetricEngine | 10Hz | deriveSynergy() | ✅ Yes |
| `node.userData.metrics.harmony` | NodeMetricEngine | 10Hz | writeMetric() | ✅ Yes |
| `node.userData.metrics.stability` | NodeMetricEngine | 10Hz | writeMetric() | ✅ Yes |
| `node.userData.metrics.corruption` | NodeMetricEngine | 10Hz | writeMetric() | ✅ Yes |
| `node.userData.metrics.loadPressure` | NodeMetricEngine | 10Hz | writeMetric() | ✅ Yes |

### 2.2 Node Metrics (Legacy Aliases - MIRRORS)

| Legacy Field | Canonical Source | Writer | Frequency | Purpose |
|--------------|------------------|--------|-----------|---------|
| `node.userData.harmony` | metrics.harmony | MetricsRuntime_v1 | 10Hz | Legacy compatibility |
| `node.userData.harmonyLevel` | metrics.harmony | MetricsRuntime_v1 | 10Hz | Legacy compatibility |
| `node.userData.corruption` | metrics.corruption | MetricsRuntime_v1 | 10Hz | Legacy compatibility |
| `node.userData.corruptionLevel` | metrics.corruption | MetricsRuntime_v1 | 10Hz | Legacy compatibility |
| `node.userData.load` | metrics.loadPressure | MetricsRuntime_v1 | 10Hz | Legacy compatibility |
| `node.userData.loadRatio` | metrics.loadPressure | MetricsRuntime_v1 | 10Hz | Legacy compatibility |
| `node.userData.pressure` | metrics.loadPressure | MetricsRuntime_v1 | 10Hz | Legacy compatibility |
| `node.userData.instability` | 1 - metrics.stability | MetricsRuntime_v1 | 10Hz | Legacy compatibility |

### 2.3 Link Metrics

| Metric Field | Canonical Writer | Frequency | Method | Guarded |
|--------------|------------------|-----------|--------|---------|
| `link.userData.metrics.corruption` | MetricsRuntime_v1 | 10Hz | _canonicalWriteLinkCorruptionMetrics() | ❌ No |
| `link.userData.corruptionLevel` | MetricsRuntime_v1 | 10Hz | _canonicalWriteLinkCorruptionMetrics() | ❌ No |
| `link.userData.integrity` | MetricsRuntime_v1 | 10Hz | _canonicalWriteLinkCorruptionMetrics() | ❌ No |
| `link.userData.synergy` | ComputeSynergyScore2_1 | Per-frame | update() | ❌ No |

### 2.4 NON-CANONICAL WRITERS (PROBLEMATIC)

| System | Field Written | Frequency | Issue |
|--------|---------------|-----------|-------|
| HarmonyStabilizationSystem_v1 | `node.userData.harmonyLevel` | Variable | Bypasses NodeMetricEngine |
| HarmonyStabilizationSystem_v1 | `link.userData.harmonyLevel` | Variable | Bypasses NodeMetricEngine |
| LinkCorruptionTransmission_v1 | `link.userData.corruptionLevel` | Variable | Bypasses MetricsRuntime_v1 |
| LinkCorruptionTransmission_v1 | `node.userData.corruption` | Variable | Bypasses NodeMetricEngine |
| HarmonicHealingVisualSystem_Session134 | `node.userData.metrics.corruption` | Per-frame | Writes to canonical without authority |
| HarmonicHealingVisualSystem_Session134 | `node.userData.corruption` | Per-frame | Writes to legacy without authority |

---

## 3. DERIVED METRICS & DEPENDENCY CHAINS

### 3.1 Synergy Derivation

**Source:** NodeMetricEngine.deriveSynergy()  
**Type:** DERIVED (read-only for external systems)

**Formula:**
```
synergy_target = (harmony²) × stability × (1 - corruption × 0.85) × (1 - loadPressure × 0.65)
                + resonance_bonus

resonance_bonus = max(0, harmony - 0.75) × max(0, stability - 0.65) × 0.35

synergy = lerp(current, synergy_target, 0.25 × dtScale)
```

**Dependency Chain:**
```
archetypeMetrics (base)
  ↓
harmony, stability, corruption, loadPressure (primary metrics)
  ↓
cross-metric interactions (applyCrossMetricInteractions)
  ↓
synergy (derived)
```

### 3.2 Network Stress Derivation

**Source:** NetworkMetricsAggregator  
**Type:** AGGREGATED

**Formula (implied from codebase):**
```
networkStress = f(loadPressure, instability, corruption)
```

**Dependency Chain:**
```
node.userData.metrics.loadPressure
node.userData.metrics.stability
node.userData.metrics.corruption
  ↓
NetworkMetricsAggregator.compute()
  ↓
networkStress (network-level metric)
```

### 3.3 Metric Tier Classification

**Source:** MetricTierClassifier.js  
**Type:** CLASSIFICATION

**Tiers:** CRITICAL, HIGH, MEDIUM, LOW, NOMINAL  
**Thresholds:** Defined per metric

**Emission:** `metric.tier.changed` event on tier transition

---

## 4. EVENT GENERATION MAP

### 4.1 Metric Events (NodeMetricEngine)

| Event Name | Trigger Metric | Threshold | Emission Frequency |
|------------|----------------|-----------|-------------------|
| `metric:synergySpike` | synergy | delta ≥ 0.05 (rising) | When threshold met |
| `metric:harmonyPeak` | harmony | crossing 0.85 | One-time |
| `metric:stabilityDrop` | stability | delta ≥ 0.05 (falling) | When threshold met |
| `metric:corruptionRise` | corruption | delta ≥ 0.05 (rising) | When threshold met |
| `metric:loadPressureHigh` | loadPressure | crossing 0.75 | One-time |
| `metric.synergy.burst` | synergy | > 0.85 | Cooldown: 2000ms |
| `metric.corruption.spike` | corruption | > 0.65 | Cooldown: 2000ms |
| `metric.tier.changed` | any metric | tier transition | Immediate |
| `node.metric.updated` | any metric | any change | Max 10Hz per node |

### 4.2 Corruption Spread Events (MetricsRuntime_v1)

| Event Name | Trigger | Threshold | Emission Frequency |
|------------|---------|-----------|-------------------|
| `corruption.spread.link` | link corruption | delta ≥ 0.01 | Per link per tick |
| `corruption.spread.source` | node corruption | N/A | Per link per tick |
| `corruption.spread.target` | node corruption | N/A | Per link per tick |

### 4.3 Cascade Events

| Event Name | Trigger | Source | Frequency |
|------------|---------|--------|-----------|
| `cascade.start` | Cascade activation | CascadeEventBridge | Per cascade |
| `cascade.hop` | Cascade propagation | CascadeEventBridge | Per hop |
| `cascade.end` | Cascade completion | CascadeEventBridge | Per cascade |

---

## 5. EVENT CONSUMERS

### 5.1 Visual Systems

| System | Events Consumed | Action |
|--------|-----------------|--------|
| PHASE5_CascadeVisuals.js | `cascade.hop`, `cascade.start` | Cascade VFX |
| PHASE5_CascadeVisuals.js | `link.harmony.*` | Link harmony states |
| PHASE5_CascadeVisuals.js | `node.stability.*` | Node stability VFX |
| ResonanceCascadeVisualization_Session117B.js | `link.created`, `global.loadPressure.high` | Resonance VFX |
| ResonanceEchoTrailSystem.js | `wave.burst.lifecycle`, `wave.packet.spawn` | Wave trail VFX |

### 5.2 Data Systems

| System | Events Consumed | Action |
|--------|-----------------|--------|
| main.js | `cascade.*` | Debug logging |
| EnvironmentEventCoordinator.js | Generic events | Event coordination |
| AnimatedLinkFlow.js | `link.created` | Link initialization |
| _RecursiveGlyphSignalSystem.js | `link.created` | Glyph initialization |
| VisualEchoTrails_v1_Integration.js | `link.created` | Echo trail setup |

---

## 6. UPDATE FREQUENCY MAP

### 6.1 Metric Calculations

| System | Frequency | Scheduler Layer | Type |
|--------|-----------|-----------------|------|
| NodeMetricEngine | 10Hz | Main loop (fixed tick) | Simulation |
| MetricsRuntime_v1._step() | 10Hz | Main loop (fixed tick) | Orchestration |
| NetworkMetricsAggregator | 2Hz | FrameScheduler.background | Aggregation |
| MetricValidationRuntime | 1Hz | Main loop | Validation |
| CanonicalFieldAudit | 0.2Hz (5s interval) | Main loop | Audit |

### 6.2 Visual Updates

| System | Frequency | Scheduler Layer | Type |
|--------|-----------|-----------------|------|
| LinkRendererConduit | 30Hz (implied) | Visual layer | Rendering |
| HarmonyAuraController | Per-frame | Visual layer | Rendering |
| HarmonicHubAuraSystem | Per-frame | Visual layer | Rendering |
| LinkGlowSynergyEngine | Per-frame | Visual layer | Rendering |

### 6.3 Event Emission

| Event Type | Frequency | Throttling |
|------------|-----------|------------|
| node.metric.updated | Max 10Hz per node | 100ms cooldown |
| metric.synergy.burst | Cooldown | 2000ms per node |
| metric.corruption.spike | Cooldown | 2000ms per node |
| metric:* (threshold) | On threshold | No throttling |

### 6.4 Frequency Mismatches (PROBLEMS)

| Reader | Frequency | Metric Update | Issue |
|--------|-----------|---------------|-------|
| Some visual shaders | 60Hz | 10Hz | Reading stale data 5x/sec |
| HarmonyAuraController | 60Hz | 10Hz (via NodeMetricEngine) | No issue (uses lerp) |
| LinkCorruptionTransmission | Variable | 10Hz | Potential race conditions |

---

## 7. LEGACY / DUPLICATE PATHS

### 7.1 Harmony Level Duplication

**Canonical Source:** `node.userData.metrics.harmony`

**Legacy Duplicates:**
- `node.userData.harmony` (mirror written by MetricsRuntime_v1)
- `node.userData.harmonyLevel` (written by HarmonyStabilizationSystem_v1 - CONFLICT!)

**Problem:** HarmonyStabilizationSystem_v1 writes directly to `harmonyLevel` without going through NodeMetricEngine.

**Impact:**
- Two systems writing harmony independently
- Potential for out-of-sync values
- Event emission inconsistency

---

### 7.2 Corruption Level Duplication

**Canonical Source:** `node.userData.metrics.corruption`

**Legacy Duplicates:**
- `node.userData.corruption` (mirror written by MetricsRuntime_v1)
- `node.userData.corruptionLevel` (legacy, used by some systems)
- `link.userData.corruptionLevel` (canonical for links)
- `link.userData.corruption` (mirror)

**Problem:** Multiple systems write to `node.userData.corruption`:
1. NodeMetricEngine (canonical)
2. LinkCorruptionTransmission_v1 (direct write)
3. HarmonicHealingVisualSystem_Session134 (direct write)

**Impact:**
- Corruption healing and transmission can conflict
- No single source of truth
- Event emission may be missed

---

### 7.3 Synergy Storage Confusion

**Canonical Source:** `node.userData.metrics.synergy` (derived, read-only)

**Legacy Locations:**
- `link.userData.synergy.score` (computed by ComputeSynergyScore2_1)
- `link.userData.synergyNorm` (normalized version)
- `link.userData.synergy.synergyNorm` (nested structure)

**Problem:** Link synergy has completely different storage structure than node synergy.

**Impact:**
- Inconsistent API across nodes/links
- Difficult to reason about synergy as a unified concept

---

### 7.4 Load Pressure Aliases

**Canonical Source:** `node.userData.metrics.loadPressure`

**Aliases:**
- `node.userData.load`
- `node.userData.loadRatio`
- `node.userData.pressure`
- `node.userData.metrics.load`
- `node.userData.metrics.loadRatio`

**Status:** Well-managed by MetricsRuntime_v1 (all synced in _ensureNodeCanonicalFallbacks)

**Impact:** Low - all aliases are properly synced

---

## 8. VISUALIZATION MAP

### 8.1 Synergy Usage in Visuals

| Visual System | Metric Used | Effect |
|---------------|-------------|--------|
| CompositeGlyphGenerator | `metrics.synergy` | Glyph complexity, shell radius |
| HarmonicNodeResonanceHalos | `metrics.synergy` | Resonance intensity |
| CascadingHarmonicResonanceAmplification | `metrics.synergy` | Amplification factor |
| CompetitionDominanceAdapter | `metrics.synergy` | Dominance score |
| LinkEnergyRingSystem | `metrics.synergy` | Ring intensity/color |
| LinkSurfacePhaseRipples | `metrics.synergy` | Ripple characteristics |
| LinkStateVisualLanguageIntegration | `metrics.synergy` | Edge quality label |

### 8.2 Harmony Usage in Visuals

| Visual System | Metric Used | Effect |
|---------------|-------------|--------|
| HarmonyAuraController | `node.userData.harmonyAuraStrength` | Aura intensity (DERIVED) |
| HarmonicHubAuraSystem | `metrics.harmony` | Hub aura strength |
| HarmonyStabilizationSystem_v1 | `harmonyLevel` | Stabilization visuals |
| CompositeGlyphGenerator | `metrics.harmony` | Glyph color, rib count |
| CascadingHarmonicResonanceAmplification | `metrics.harmony` | Resonance factor |
| HarmonicResonanceFeedbackSystem | `metrics.harmony` | Feedback strength |
| LinkTrailParticleSystem | `userData.harmony` / `metrics.harmony` | Trail behavior |
| LinkSurfacePhaseRipples | `metrics.harmony` | Ripple properties |

### 8.3 Stability Usage in Visuals

| Visual System | Metric Used | Effect |
|---------------|-------------|--------|
| PHASE5_CascadeVisuals | `node.stability` | Stability states (low/mid/high) |
| HarmonicHealingVisualSystem | `metrics.stability` | Healing calculations |
| CascadingHarmonicResonanceAmplification | `metrics.stability` (as resilience) | Amplification factor |
| LinkCollapseSystem | `metrics.loadPressure` (proxy) | Collapse detection |
| LinkSurfacePhaseRipples | `metrics.stability` | Ripple stability |

### 8.4 Corruption Usage in Visuals

| Visual System | Metric Used | Effect |
|---------------|-------------|--------|
| CorruptionVisualFX_v1 | `metrics.corruption` | Corruption visuals |
| CorruptionDesaturationIntegrationPatch | `metrics.corruption` | Color desaturation |
| CorruptionDrivenAuraDesaturationSystem | `metrics.corruption` | Aura desaturation |
| CompositeGlyphGenerator | `metrics.corruption` | Glyph corruption tint |
| CascadingHarmonicResonanceAmplification | `metrics.corruption` | Damping factor |
| LinkCorruptionTransmission_v1 | `corruptionLevel` | Corruption spread visuals |
| LinkCorruptionParticleSystem | `corruptionLevel` | Particle emission |
| LinkSurfacePhaseRipples | `metrics.corruption` | Ripple corruption |
| LinkRendererConduit | `metrics.corruption` | Shader uniforms |

### 8.5 Load Pressure Usage in Visuals

| Visual System | Metric Used | Effect |
|---------------|-------------|--------|
| LinkCollapseSystem | `metrics.loadPressure` | Collapse triggers |
| ResonanceCascadeVisualization | `global.loadPressure.high` event | Cascade visualization |
| LinkSurfacePhaseRipples | `metrics.loadPressure` | Ripple intensity |
| LinkRendererConduit | `metrics.loadPressure` | Shader uniforms |
| EXAMPLES | `metrics.loadPressure` | Demo displays |

---

## 9. METRIC FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT SOURCES                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Archetype    │  │ Link Events  │  │ Overload     │          │
│  │ Metrics      │  │ (create/rem) │  │ Events      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NODE METRIC ENGINE                           │
│                  (Canonical Writer - 10Hz)                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Primary Metrics:                                       │  │
│  │  • harmony       (read/write)                           │  │
│  │  • stability     (read/write)                           │  │
│  │  • corruption    (read/write)                           │  │
│  │  • loadPressure  (read/write)                           │  │
│  │  • synergy       (READ ONLY - derived)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Cross-Metric Interactions:                              │  │
│  │  • harmony ↔ stability (mutual reinforcement)            │  │
│  │  • harmony ↔ corruption (suppression)                    │  │
│  │  • stability ↔ load (stress)                             │  │
│  │  • corruption ↔ load (amplification)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Synergy Derivation:                                     │  │
│  │  harmony × stability × (1-corruption) × (1-load) → synergy│  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                  │                  │
          │ Event Emission   │ Mirror Writes    │
          ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ semanticBus     │  │ userData.*      │  │ userData.*      │
│ Events:         │  │ (legacy mirrors)│  │ metrics.*       │
│ • metric:*      │  │ • harmony       │  │ • harmony       │
│ • node.metric   │  │ • corruption    │  │ • corruption    │
│ • tier.changed  │  │ • load          │  │ • loadPressure  │
└────────┬────────┘  │ • harmonyLevel  │  │ • synergy       │
         │           │ • corruptionLevel│  │ • stability     │
         │           └─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT CONSUMERS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Visual FX    │  │ Gameplay     │  │ Audio        │          │
│  │ Systems      │  │ Logic        │  │ System       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              NETWORK METRICS AGGREGATOR (2Hz)                   │
│                                                                  │
│  Reads: node.userData.metrics.* from all nodes                 │
│  Produces:                                                      │
│  • networkSynergy (average)                                     │
│  • harmonyFlow (aggregate)                                      │
│  • networkStress (derived)                                      │
│  • corruptionLevel (average)                                   │
│  • loadPressure (average)                                      │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              window.__ATOMA_LIVE_METRICS__                     │
│              (Published every 10Hz)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. WRITE AUTHORITY TABLE (OFFICIAL)

### 10.1 Canonical Writers Only

| System | Scope | Metrics Written | Frequency | Method |
|--------|-------|-----------------|-----------|--------|
| **NodeMetricEngine.js** | NODE | harmony, stability, corruption, loadPressure, synergy | 10Hz | updateNodeMetrics() |
| **MetricsRuntime_v1.js** | NODE | legacy mirrors (harmony, corruption, load, etc.) | 10Hz | _ensureNodeCanonicalFallbacks() |
| **MetricsRuntime_v1.js** | LINK | corruption, corruptionLevel, integrity | 10Hz | _canonicalWriteLinkCorruptionMetrics() |
| **MetricsRuntime_v1.js** | NODE | fatigue, networkFatigue, hubId, activeLinkCount | 10Hz | _canonicalWriteNetworkMetrics() |
| **ComputeSynergyScore2_1.js** | LINK | synergy.score | Per-frame | update() |

### 10.2 Unauthorized Writers (NEEDS FIXING)

| System | Scope | Metrics Written | Frequency | Problem |
|--------|-------|-----------------|-----------|---------|
| HarmonyStabilizationSystem_v1 | NODE | harmonyLevel | Variable | Bypasses NodeMetricEngine |
| HarmonyStabilizationSystem_v1 | LINK | harmonyLevel | Variable | Bypasses NodeMetricEngine |
| LinkCorruptionTransmission_v1 | NODE | corruption | Variable | Bypasses NodeMetricEngine |
| LinkCorruptionTransmission_v1 | LINK | corruptionLevel | Variable | Bypasses MetricsRuntime_v1 |
| HarmonicHealingVisualSystem_Session134 | NODE | corruption | Per-frame | Bypasses NodeMetricEngine |

---

## 11. EVENT PIPELINE MAP

### 11.1 Metric → Event Flow

```
NodeMetricEngine.updateNodeMetrics (10Hz)
  │
  ├─→ writeMetric() → node.userData.metrics.*
  │       │
  │       ├─→ traceMetricMutation() (audit trail)
  │       ├─→ emitNodeMetricUpdated() → node.metric.updated
  │       ├─→ emitMetricTierChanged() → metric.tier.changed
  │       └─→ emitSemanticMetricEvent() → metric:* (threshold-based)
  │
  ├─→ deriveSynergy() → node.userData.metrics.synergy
  │       │
  │       └─→ emitSemanticMetricEvent() → metric:synergySpike (if threshold)
  │
  └─→ emitNodeThresholdEvents() → metric.synergy.burst / metric.corruption.spike
```

### 11.2 Event → System Flow

```
metric:* events (from NodeMetricEngine)
  │
  ├─→ Visual FX Systems
  │       ├─→ PHASE5_CascadeVisuals
  │       ├─→ ResonanceCascadeVisualization
  │       └─→ CorruptionVisualFX_v1
  │
  ├─→ Audio Systems
  │       └─→ AtomaAudioModulation
  │
  └─→ HUD/Overlay Systems
          └─→ CoreMetricsOverlay

cascade.* events (from CascadeEventBridge_v1)
  │
  ├─→ PHASE5_CascadeVisuals (cascade VFX)
  └─→ main.js (debug logging)

corruption.spread.* events (from MetricsRuntime_v1)
  │
  └─→ (no identified consumers - potential dead events)
```

---

## 12. PROBLEMS & CONFLICTS

### 12.1 CRITICAL: Multiple Harmony Writers

**Problem:** Two systems write to harmony independently:
1. NodeMetricEngine (canonical) → `node.userData.metrics.harmony`
2. HarmonyStabilizationSystem_v1 → `node.userData.harmonyLevel`

**Impact:**
- Harmony can be set by two different systems
- Values may diverge
- Event emission inconsistency

**Recommendation:**
- Migrate HarmonyStabilizationSystem_v1 to use NodeMetricEngine.applyMetricImpulse()
- Remove direct writes to `harmonyLevel`
- Treat `harmonyLevel` as read-only alias for `metrics.harmony`

---

### 12.2 CRITICAL: Multiple Corruption Writers

**Problem:** Three systems write to corruption:
1. NodeMetricEngine (canonical) → `node.userData.metrics.corruption`
2. LinkCorruptionTransmission_v1 → `node.userData.corruption`
3. HarmonicHealingVisualSystem_Session134 → `node.userData.metrics.corruption`

**Impact:**
- Corruption transmission and healing can conflict
- No single source of truth
- Race conditions possible

**Recommendation:**
- Migrate all corruption writes to NodeMetricEngine.applyMetricImpulse()
- Remove direct writes from LinkCorruptionTransmission and healing systems
- Use semantic events for coordination

---

### 12.3 HIGH: Legacy Field Contamination

**Problem:** Legacy fields are still being written to by multiple systems:
- `node.userData.harmonyLevel`
- `node.userData.corruptionLevel`
- `link.userData.harmonyLevel`

**Impact:**
- Duplicate storage
- Inconsistent data
- Confusing API for consumers

**Recommendation:**
- Complete migration to `node.userData.metrics.*` structure
- Mark legacy fields as read-only with deprecation warnings
- Phase out legacy reads over time

---

### 12.4 MEDIUM: Event Consumer Inconsistency

**Problem:** Event consumers read from inconsistent sources:
- Some read from `node.userData.metrics.*` (canonical)
- Some read from `node.userData.*` (legacy)
- Some read from `link.userData.synergy` (different structure)

**Impact:**
- Visuals may show stale data
- Inconsistent behavior across systems
- Difficult to maintain

**Recommendation:**
- Establish standard: all consumers MUST read from canonical metrics
- Audit and update all visual systems
- Add warnings for legacy field reads

---

### 12.5 MEDIUM: Frequency Mismatch

**Problem:** Some visual systems run at 60Hz but metrics update at 10Hz:
- Shaders reading metrics per-frame
- No interpolation for visual smoothness

**Impact:**
- Visual jitter possible
- Wasted cycles reading same data

**Recommendation:**
- Implement metric interpolation in visual systems
- Or move visual updates to 30Hz (match visual layer)
- Document which systems need high-frequency access

---

### 12.6 LOW: Dead Events

**Problem:** Some events have no identified consumers:
- `corruption.spread.link`
- `corruption.spread.source`
- `corruption.spread.target`

**Impact:**
- Unnecessary event overhead
- Confusing event contract

**Recommendation:**
- Verify if these events are truly unused
- If unused, remove event emission
- If needed, document intended consumers

---

### 12.7 LOW: Missing Guards

**Problem:** Link metrics lack write guards:
- `link.userData.synergy.score` written by ComputeSynergyScore2_1
- `link.userData.corruptionLevel` written by MetricsRuntime_v1
- No guard system to prevent unauthorized writes

**Impact:**
- Potential for unauthorized link metric writes
- Harder to track write authority

**Recommendation:**
- Implement LinkMetricAuthorityGuard (similar to NodeMetricEngine)
- Or consolidate link metric writes under MetricsRuntime_v1

---

## 13. RECOMMENDATIONS

### 13.1 Immediate (CRITICAL)

1. **Migrate HarmonyStabilizationSystem_v1**
   - Replace direct `harmonyLevel` writes with `NodeMetricEngine.applyMetricImpulse()`
   - Treat `harmonyLevel` as read-only alias

2. **Migrate LinkCorruptionTransmission_v1**
   - Use `NodeMetricEngine.applyMetricImpulse()` for node corruption
   - Use MetricsRuntime_v1 for link corruption
   - Remove all direct metric writes

3. **Migrate HarmonicHealingVisualSystem_Session134**
   - Use `NodeMetricEngine.applyMetricImpulse()` for healing
   - Remove direct metric writes

### 13.2 Short-term (HIGH)

4. **Implement Link Metric Guards**
   - Create LinkMetricAuthorityGuard
   - Apply to all link metric writes
   - Add audit logging

5. **Standardize Event Consumer Reads**
   - Audit all visual systems
   - Migrate to canonical `metrics.*` reads
   - Add warnings for legacy reads

6. **Clean Up Dead Events**
   - Identify all events without consumers
   - Remove unused events
   - Document remaining event contracts

### 13.3 Medium-term (MEDIUM)

7. **Phase Out Legacy Fields**
   - Mark legacy fields as deprecated
   - Add console warnings for reads/writes
   - Migrate all consumers over time

8. **Implement Metric Interpolation**
   - Add interpolation layer for 60Hz visual systems
   - Smooth visual transitions between 10Hz updates
   - Document interpolation strategy

9. **Create Metric Writer Registry**
   - Centralized registry of all metric writers
   - Easy to audit and verify
   - Prevent new unauthorized writers

### 13.4 Long-term (LOW)

10. **Unify Node/Link Metric Structures**
    - Standardize metric storage across nodes and links
    - Consistent API for all entities
    - Simplify consumer code

11. **Performance Optimization**
    - Profile metric update loop
    - Optimize event emission
    - Reduce unnecessary calculations

---

## 14. CONCLUSION

The ATOMA metrics system has evolved significantly toward a clean, canonical architecture. The core engine (NodeMetricEngine) is well-designed with clear write authority, proper event emission, and good frequency separation.

However, legacy systems (HarmonyStabilizationSystem_v1, LinkCorruptionTransmission_v1) continue to write metrics directly, bypassing the canonical engine. This creates multiple sources of truth and potential conflicts.

The path forward is clear:
1. Migrate all metric writers to use NodeMetricEngine.applyMetricImpulse()
2. Standardize all consumers to read from canonical `metrics.*` fields
3. Phase out legacy field usage
4. Improve guard systems and auditability

With these changes, the metrics system will achieve true single-source-of-truth status, making it easier to maintain, debug, and extend.

---

## APPENDICES

### Appendix A: Metric Field Reference

#### Node Metrics (Canonical)

```javascript
node.userData.metrics = {
  synergy: 0,      // DERIVED - read-only for external writers
  harmony: 0,      // PRIMARY - canonical write
  stability: 0,    // PRIMARY - canonical write
  corruption: 0,   // PRIMARY - canonical write
  loadPressure: 0, // PRIMARY - canonical write
  load: 0,         // ALIAS for loadPressure
  loadRatio: 0     // ALIAS for loadPressure
}
```

#### Node Metrics (Legacy Mirrors - READ-ONLY)

```javascript
node.userData = {
  harmony: 0,           // Mirror of metrics.harmony
  harmonyLevel: 0,      // Mirror of metrics.harmony
  corruption: 0,        // Mirror of metrics.corruption
  corruptionLevel: 0,   // Mirror of metrics.corruption
  load: 0,             // Mirror of metrics.loadPressure
  loadRatio: 0,        // Mirror of metrics.loadPressure
  pressure: 0,         // Mirror of metrics.loadPressure
  instability: 0       // Mirror of 1 - metrics.stability
}
```

#### Link Metrics (Canonical)

```javascript
link.userData.metrics = {
  corruption: 0,        // Canonical corruption
  integrity: 100,       // Legacy compatibility (100 - corruption * 100)
  particleIntensity: 0, // Visual metric
  particleUrgency: 0    // Visual metric
}
```

#### Link Metrics (Legacy Mirrors)

```javascript
link.userData = {
  corruptionLevel: 0,   // Mirror of metrics.corruption
  corruption: 0,        // Mirror of metrics.corruption
  integrity: 100,       // Mirror of metrics.integrity
  synergy: {            // Computed by ComputeSynergyScore2_1
    score: 0.5,         // 0-1 synergy score
    synergyNorm: 0.5    // Normalized version
  }
}
```

### Appendix B: Event Reference

#### Node Metric Events

```
metric:synergySpike       - Synergy rising rapidly (delta ≥ 0.05)
metric:harmonyPeak       - Harmony crossing 0.85
metric:stabilityDrop     - Stability falling rapidly (delta ≥ 0.05)
metric:corruptionRise    - Corruption rising rapidly (delta ≥ 0.05)
metric:loadPressureHigh  - LoadPressure crossing 0.75
metric.synergy.burst     - Synergy > 0.85 (cooldown: 2000ms)
metric.corruption.spike  - Corruption > 0.65 (cooldown: 2000ms)
metric.tier.changed      - Any metric tier transition
node.metric.updated      - Any metric change (max 10Hz per node)
```

#### Link/Network Events

```
corruption.spread.link    - Link corruption increasing
corruption.spread.source  - Source node in corruption spread
corruption.spread.target  - Target node in corruption spread
cascade.start             - Cascade activated
cascade.hop               - Cascade propagating
cascade.end               - Cascade completed
```

### Appendix C: Frequency Reference

```
10Hz (100ms)  - NodeMetricEngine update
              - MetricsRuntime_v1._step()
              - Canonical metric writes
              - Legacy mirror syncs

2Hz (500ms)   - NetworkMetricsAggregator
              - Network-wide metric aggregation

1Hz (1000ms)  - MetricValidationRuntime
              - Metric validation checks

0.2Hz (5s)    - CanonicalFieldAudit
              - Field staleness checks

60Hz (16.6ms) - Visual layer rendering
              - Shader updates
              - Per-frame visual calculations

30Hz (33.3ms) - Visual systems (intended)
              - VFX updates
              - Particle systems
```

---

**END OF AUDIT REPORT**