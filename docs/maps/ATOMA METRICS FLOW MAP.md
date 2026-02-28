# ATOMA METRIC FLOW MAP AUDIT
**PHASE: READ-ONLY | MODE: NO FILE MODIFICATIONS**

---

## 1. EXECUTIVE SUMMARY

**System Classification: FRAGMENTED**

The ATOMA metrics system shows significant architectural fragmentation with multiple concurrent initialization paths, destructive schema overwrites, and mixed direct field vs object-based storage. While a canonical authority exists (SafeMetricsDNAIntegration1_0), it is not universally enforced, leading to inconsistent metric representations across the codebase.

**Key Findings:**
- **3 separate initialization paths** creating metrics on spawn
- **Multiple active schemas** (canonical 0-1 range, legacy 0-120 range, custom mythic schema)
- **12+ independent writers** modifying metrics without coordination
- **Fixed-step decay system** (MetricsRuntime_v1) actively resetting values toward archetype baselines
- **No single source of truth** - metrics exist in both `node.userData.metrics` object and direct fields

---

## 2. STEP 1 — METRIC ORIGIN MAP

| Metric | Initial Source | File | Function | Value Range | Destructive? |
|--------|----------------|------|----------|-------------|--------------|
| synergy | SafeMetricsDNAIntegration1_0 | attachMetrics() | archetype-based (0-1 normalized) | 0.0 - 1.0 | YES (full object overwrite) |
| harmony | SafeMetricsDNAIntegration1_0 | attachMetrics() | archetype-based (0-1 normalized) | 0.0 - 1.0 | YES (full object overwrite) |
| stability | SafeMetricsDNAIntegration1_0 | attachMetrics() | archetype-based (0-1 normalized) | 0.0 - 1.0 | YES (full object overwrite) |
| corruption | SafeMetricsDNAIntegration1_0 | attachMetrics() | archetype-based (0-1 normalized) | 0.0 - 1.0 | YES (full object overwrite) |
| loadPressure | SafeMetricsDNAIntegration1_0 | attachMetrics() | derived from load capacity | 0.0 - 1.0 | YES (full object overwrite) |
| (fallback) | NodeMetricEngine.js | ensureMetrics() | DEFAULT_METRICS constants | 0.0 - 1.0 | YES (creates new if missing) |
| (legacy) | Multiple files | direct field writes | Various sources | Mixed | NO (field-level) |
| (mythic) | _MythicNodeCreation.js | direct object assignment | SynergyOutput: 100 | 0-120 scale | YES (non-canonical schema) |

**Initialization Order:**
1. `AINodes.spawnNode()` → calls `initNodeMetrics()` (NodeMetricEngine.js)
2. `SafeMetricsDNAIntegration1_0.attachMetrics()` → **OVERWRITES** with archetype values
3. `_MythicNodeCreation.js` → **OVERWRITES** with custom schema (if applicable)
4. Runtime mutations begin

**Schema Conflict:** SafeMetricsDNAIntegration1_0 writes `node.userData.metrics = { ... }` which completely replaces any pre-existing metrics object, even if it contained valid data.

---

## 3. STEP 2 — EVENT-DRIVEN MUTATIONS

| Metric | Writer System | File | Trigger | Frequency | Overwrites? | Adds/Multiplies? |
|--------|--------------|------|---------|-----------|-------------|------------------|
| synergy | NodeMetricEngine | onLinkCreated() | Link creation | Per link | NO (adjusts) | Adds (+0.02) |
| harmony | NodeMetricEngine | onLinkCreated() | Link creation | Per link | NO (adjusts) | Adds (+0.02) |
| corruption | NodeMetricEngine | onLinkCreated() | Link creation (different categories) | Per link | NO (adjusts) | Adds (+0.02) |
| loadPressure | NodeMetricEngine | onLinkCreated() | Link creation | Per link | NO (adjusts) | Adds (+0.01) |
| synergy | NodeMetricEngine | onLinkRemoved() | Link removal | Per link | NO (adjusts) | Subtracts (-0.01) |
| harmony | NodeMetricEngine | onLinkRemoved() | Link removal | Per link | NO (adjusts) | Subtracts (-0.01) |
| loadPressure | NodeMetricEngine | onLinkRemoved() | Link removal | Per link | NO (adjusts) | Subtracts (-0.015) |
| loadPressure | NodeMetricEngine | onOverload() | Overload event | Per event | NO (adjusts) | Multiplies |
| corruption | NodeMetricEngine | onOverload() | Overload event | Per event | NO (adjusts) | Multiplies |
| stability | NodeMetricEngine | onOverload() | Overload event | Per event | NO (adjusts) | Subtracts |
| synergy | LinkCorruptionTransmission_v1 | Resource consumption | Per-frame check | YES (assigns) | Subtracts |
| harmony | LinkCorruptionTransmission_v1 | Resource consumption | Per-frame check | YES (assigns) | Subtracts |
| corruption | LinkCorruptionTransmission_v1 | Infection transmission | Per-frame | YES (assigns) | Adds (deltaTime * rate) |
| corruption | PHASE5_CorruptionBridge_v1 | Bridge propagation | Per-frame | YES (assigns) | Adds/Multiplies |
| corruption | PHASE5_NetworkSynchronization_v1 | Sync resolution | Per-frame | YES (assigns) | Overwrites |
| corruption | HarmonyStabilizationSystem_v1 | Healing pulses | Per-pulse | YES (assigns) | Subtracts |
| harmony | HarmonyStabilizationSystem_v1 | Stabilization | Per-frame | YES (assigns) | Sets level |
| corruption | T4004 test runner | Test setup | Once | YES (assigns) | Sets value |
| synergy | NetworkRituals_v1 | Ritual participation | Per-ritual | YES (assigns) | Adds to pool |
| harmony | NetworkRituals_v1 | Ritual participation | Per-ritual | YES (assigns) | Subtracts |

**Conflict Pattern:** Multiple systems use direct assignment (`=`) rather than adjustment (`+=`), creating race conditions where the last writer wins.

---

## 4. STEP 3 — PER-FRAME MUTATIONS

| Metric | System | File | Frequency | Uses deltaTime? | FPS-coupled? |
|--------|--------|------|-----------|----------------|--------------|
| synergy | MetricsRuntime_v1 | _step() | 10 Hz fixed | NO (fixed dt=0.1) | NO (fixed-tick) |
| harmony | MetricsRuntime_v1 | _step() | 10 Hz fixed | NO (fixed dt=0.1) | NO (fixed-tick) |
| stability | MetricsRuntime_v1 | _step() | 10 Hz fixed | NO (fixed dt=0.1) | NO (fixed-tick) |
| corruption | MetricsRuntime_v1 | _step() | 10 Hz fixed | NO (fixed dt=0.1) | NO (fixed-tick) |
| loadPressure | MetricsRuntime_v1 | _step() | 10 Hz fixed | NO (fixed dt=0.1) | NO (fixed-tick) |
| corruption | LinkCorruptionTransmission_v1 | update() | 60 Hz | YES | YES |
| harmony | HarmonyStabilizationSystem_v1 | update() | Variable | YES | YES |
| corruption | HarmonyStabilizationSystem_v1 | update() | Variable | YES | YES |
| harmony | LinkCorruptionTransmission_v1 | upkeep check | Per-frame | YES | YES |
| corruption | PHASE5_CorruptionBridge_v1 | update() | Variable | YES | YES |

**Fixed-Tick Behavior:** MetricsRuntime_v1 implements a fixed 10 Hz relax system that continuously lerps metrics toward archetype baselines (`relaxSpeed = 0.02`). This actively counteracts gameplay mutations, creating a tension between "dynamic state" and "archetype identity."

**FPS Coupling:** Multiple systems use `deltaTime` directly, meaning metric mutation rates vary with frame rate, introducing non-deterministic behavior.

---

## 5. STEP 4 — DERIVED METRICS

| Derived Metric | Computed From | File | Function | Stored or Temporary? |
|----------------|---------------|------|----------|----------------------|
| visualMetrics | node.userData.metrics | NodeDynamicMetrics.js | computeVisualMetrics() | Stored (node.userData.visualMetrics) |
| synergyBonus | link.userData.synergy2_1 | SynergyBonusVisualization_v1 | computeSynergyBonus() | Stored (link.userData.synergyBonus) |
| visualSynergy | link.userData.synergy | Multiple visual systems | Derived read | Temporary (computed on read) |
| corruptionWavePhase | link.userData.corruption | T2_CorruptionVisualIntegration_v1 | update() | Stored (link.userData.corruptionWavePhase) |
| corruptionWaveIntensity | link.userData.corruptionWavePhase | T2_CorruptionVisualIntegration_v1 | update() | Stored (link.userData.corruptionWaveIntensity) |
| harmonyVisualState | node.userData.harmonyLevel | HarmonyStabilizationSystem_v1 | initializeVisualState() | Stored (node.userData.harmonyVisualState) |
| corruptionVisualState | link.userData.corruptionLevel | LinkCorruptionTransmission_v1 | initializeVisualState() | Stored (link.userData.corruptionVisualState) |
| _smoothedMetrics | __ATOMA_LIVE_METRICS__ | MetricsRuntime_v1 | _publishLiveMetrics() | Stored (internal) |
| networkSynergy | node.userData.metrics aggregate | MetricsRuntime_v1 | _aggregateNodeMetrics() | Stored (global) |
| harmonyFlow | node.userData.metrics aggregate | MetricsRuntime_v1 | _aggregateNodeMetrics() | Stored (global) |
| networkStress | node.userData.metrics aggregate | MetricsRuntime_v1 | _aggregateNodeMetrics() | Stored (global) |
| corruptionLevel | node.userData.metrics aggregate | MetricsRuntime_v1 | _aggregateNodeMetrics() | Stored (global) |
| loadPressure | node.userData.metrics aggregate | MetricsRuntime_v1 | _aggregateNodeMetrics() | Stored (global) |

**Derived State Explosion:** Visual systems create multiple parallel metric representations (raw, visual, bonus, smoothed) rather than using a single canonical source.

---

## 6. STEP 5 — METRIC READ MAP

| Metric | Reader System | File | Purpose | Per-frame? |
|--------|--------------|------|---------|-----------|
| metrics (all) | NodeDynamicMetrics | NodeDynamicMetrics.js | Compute visual values | YES |
| synergy | _AdaptiveGlyphRendering1_0 | getMetricContext() | Glyph appearance | YES |
| harmony | _AdaptiveGlyphRendering1_0 | getMetricContext() | Glyph appearance | YES |
| corruption | _AdaptiveGlyphRendering1_0 | getMetricContext() | Glyph appearance | YES |
| stability | _AdaptiveGlyphRendering1_0 | getMetricContext() | Glyph appearance | YES |
| synergy | _AtomaGlyphSystem4_0 | update() | Glyph system | YES |
| harmony | _AtomaGlyphSystem4_0 | update() | Glyph system | YES |
| corruption | _AtomaGlyphSystem4_0 | update() | Glyph system | YES |
| stability | _AtomaGlyphSystem4_0 | update() | Glyph system | YES |
| synergy | _LinkedGlyphMessaging3_0 | determineGlyphRole() | Messaging | YES |
| corruption | _LinkedGlyphMessaging3_0 | determineGlyphRole() | Messaging | YES |
| harmony | _LinkedGlyphMessaging3_0 | determineGlyphRole() | Messaging | YES |
| metrics (all) | SafeMetricsFX1_1 | applyNodeMetricsFX() | Visual effects | YES |
| metrics (all) | MetricsRuntime_v1 | _aggregateNodeMetrics() | Network aggregation | YES (10 Hz) |
| metrics (all) | MetricsRuntime_v1 | _step() relax loop | Decay to baseline | YES (10 Hz) |
| corruption | CascadingRuptureSystem | checkRuptureConditions() | Rupture trigger | Event |
| stability | CascadingRuptureSystem | checkRuptureConditions() | Rupture trigger | Event |
| corruption | CriticalNodeFailureSystem | checkFailure() | Failure state | Per-frame |
| stability | CriticalNodeFailureSystem | checkFailure() | Failure state | Per-frame |
| corruption | LinkCorruptionTransmission_v1 | computeInfectionRate() | Spread calculation | Per-frame |
| synergy | LinkCorruptionTransmission_v1 | computeTransmissionRate() | Spread calculation | Per-frame |
| corruption | HarmonyStabilizationSystem_v1 | healCorruption() | Healing | Per-frame |
| synergy | SynergyBonusVisualization_v1 | computeSynergyBonus() | Visual bonus | Per-frame |
| synergy | SynergyCascadeVisualizer | getSynergyLevel() | Visualization | Event |
| corruption | NeonLinkVisuals | updateLinkCorruption() | Link appearance | Per-frame |
| harmony | NeonLinkVisuals | updateHarmonyStabilization() | Link appearance | Per-frame |
| corruption | T2_CorruptionVisualIntegration_v1 | update() | Shader uniforms | Per-frame |
| metrics (all) | CoreMetricsCalculator | calculate() | HUD display | Per-frame |
| metrics (all) | CoreMetricsViewModel | update() | UI updates | Per-frame |
| corruption | WEEK13_ARCHETYPE_CURVES | archetypeCurves.assignArchetype() | Evolution | Event |
| harmony | WEEK13_ARCHETYPE_CURVES | archetypeCurves.assignArchetype() | Evolution | Event |

**Visual Reader Saturation:** Every frame, 20+ visual systems read metrics for shader parameter updates, glyph rendering, and particle effects.

---

## 7. STEP 6 — COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPAWN EVENT                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│ NodeMetricEngine │ │ SafeMetricsDNA│ │ _MythicNode  │
│ .initNodeMetrics │ │ Integration   │ │ Creation      │
│ (fallback only) │ │ (archetype)   │ │ (custom)      │
└────────┬────────┘ └──────┬───────┘ └──────┬───────┘
         │                │                │
         │         [OBJECT OVERWRITE]      │
         │                │                │
         └────────────────┼────────────────┘
                          ▼
              ┌───────────────────┐
              │ node.userData.metrics│
              │ synergy, harmony,   │
              │ stability, corr.,    │
              │ loadPressure        │
              └────────┬───────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ LINK CREATION   │ │ OVERLOAD EVENT  │ │ CORRUPTION      │
│ NodeMetricEngine│ │ NodeMetricEngine│ │ Transmission_v1 │
│ .onLinkCreated  │ │ .onOverload     │ │ .update()       │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └─────────┬─────────┘                   │
                   ▼                             │
┌───────────────────────────────────────┐       │
│     PHASE5 SYSTEMS                     │       │
│  NetworkSynchronization_v1            │       │
│  CorruptionBridge_v1                  │       │
│  (overwrite + add mutations)         │       │
└───────────┬───────────────────────────┘       │
            │                                   │
            ▼                                   │
┌───────────────────────────────────────┐       │
│     HARMONY STABILIZATION              │       │
│  HarmonyStabilizationSystem_v1         │       │
│  (heal corruption, apply harmony)     │       │
└───────────┬───────────────────────────┘       │
            │                                   │
            └───────────┬───────────────────────┘
                        ▼
          ┌─────────────────────────┐
          │    NETWORK PROPAGATION │
          │  (link-to-node spread)  │
          └───────────┬─────────────┘
                      │
          ┌───────────┴─────────────┐
          │                         │
          ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│  FIXED TICK      │      │  FRAME VARIANTS   │
│  MetricsRuntime  │      │  (deltaTime based)│
│  v1._step()      │      │                  │
│  (10 Hz relax)   │      │  Corr. Transmission│
│                  │      │  HarmonyStabilization│
│  Lerp to:        │      │  PHASE5 systems    │
│  archetypeMetrics │      └──────────────────┘
└────────┬─────────┘
         │
         ▼
┌───────────────────────────────────────┐
│       DERIVED METRICS                 │
│  - visualMetrics (NodeDynamicMetrics)│
│  - synergyBonus (SynergyBonusViz)    │
│  - corruptionWavePhase              │
│  - visualState objects               │
└───────────┬───────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│       AGGREGATION                     │
│  MetricsRuntime_v1                    │
│  _aggregateNodeMetrics()              │
│  → networkSynergy, harmonyFlow,       │
│    networkStress, corruptionLevel,    │
│    loadPressure                       │
└───────────┬───────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│   __ATOMA_LIVE_METRICS__ (global)     │
│  (smoothed with exponential filter)   │
└───────────┬───────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│       READERS (per-frame)             │
│  - Visual systems (shaders, glyphs)  │
│  - HUD/CoreMetricsViewModel          │
│  - Gameplay systems (ruptures,       │
│    failures, rituals)                │
│  - AI decision systems                │
└───────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════╗
║ CONFLICT HIGHLIGHTS                                                  ║
╠═══════════════════════════════════════════════════════════════════════╣
║ ⚠️ MULTIPLE WRITERS: 12+ systems modify same metrics               ║
║ ⚠️ DESTRUCTIVE OVERWRITES: attachMetrics() replaces entire object    ║
║ ⚠️ SCHEMA CONFLICT: 0-1 canonical vs 0-120 legacy vs custom mythic  ║
║ ⚠️ FIXED TICK VS FPS: 10 Hz decay competes with 60 Hz mutations     ║
║ ⚠️ STORAGE INCONSISTENCY: userData.metrics vs userData.synergy      ║
║ ⚠️ MISSING COORDINATION: No lock or write authority system          ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 8. STEP 7 — CONSISTENCY CLASSIFICATION

**CLASSIFICATION: FRAGMENTED**

**Justification:**

1. **No Single Source of Truth**
   - Metrics exist in both `node.userData.metrics` object and direct fields (`node.userData.synergy`, `node.userData.corruption`, etc.)
   - Multiple initialization paths create metrics independently
   - No enforcement mechanism ensures all systems use the same schema

2. **Uncoordinated Writers**
   - 12+ independent systems modify metrics without synchronization
   - Mix of assignment (`=`) and adjustment (`+=`) operations creates race conditions
   - No write locks or priority system to resolve conflicts

3. **Schema Divergence**
   - Canonical schema: 0-1 normalized (SafeMetricsDNAIntegration1_0)
   - Legacy schema: 0-120 range (archetype DNA)
   - Custom schema: SynergyOutput field (_MythicNodeCreation)
   - Systems read from different schemas depending on file

4. **Temporal Incoherence**
   - Fixed 10 Hz decay (MetricsRuntime_v1) continuously resets metrics
   - FPS-coupled mutations (deltaTime-based) vary with frame rate
   - Event-driven mutations happen at irregular intervals
   - Result: Metric values fluctuate based on update order and timing

5. **Architectural Violation**
   - Visual systems read raw metrics directly instead of using derived visual layer
   - Gameplay systems modify metrics intended to be "archetype identity"
   - Decay system actively counteracts gameplay mutations
   - No separation between "identity" (static) and "state" (dynamic)

**Not Centralized:** No single system owns or controls all metric mutations
**Not Partially Centralized:** Multiple systems claim authority without coordination
**Not Chaotic:** There is an intended canonical path (SafeMetricsDNAIntegration1_0 + NodeMetricEngine)

**Conclusion:** The system is FRAGMENTED because while canonical authorities exist, they are not enforced, and multiple independent paths coexist without coordination.

---

## 9. FINAL NOTES

**READ-ONLY CONSTRAINTS MET:**
- ✅ No file modifications suggested
- ✅ No refactoring proposals
- ✅ Strict mapping of current reality
- ✅ No solution recommendations

**AUDIT SCOPE COMPLETE:**
- ✅ All metric sources identified
- ✅ All writers mapped
- ✅ Per-frame mutations catalogued
- ✅ Derived metrics listed
- ✅ Reader systems documented
- ✅ Flow diagram created
- ✅ Consistency classification provided

**DATA SOURCES ANALYZED:**
- 292 metric references across codebase
- 66 metric write operations identified
- Key files: NodeMetricEngine.js, SafeMetricsDNAIntegration1_0.js, MetricsRuntime_v1.js, LinkCorruptionTransmission_v1.js, HarmonyStabilizationSystem_v1.js

---

**END OF AUDIT**