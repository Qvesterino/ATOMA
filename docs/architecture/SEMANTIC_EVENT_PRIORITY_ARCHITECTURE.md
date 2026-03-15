# ATOMA SEMANTIC EVENT PRIORITY ARCHITECTURE
## READ-ONLY AUDIT: Priority Architecture for SemanticEventBus

**Date:** 2026-03-15  
**Purpose:** Design priority architecture for SemanticEventBus to respect FrameScheduler layers and avoid engine overload  
**Status:** READ ONLY - No changes made

---

## 1. EVENT INVENTORY

### 1.1 Events Emitted (Producers)

| Event Name | Producer System | Current Priority | Frequency | Notes |
|-------------|-----------------|-----------------|-----------|--------|
| `harmonic.cascade.start` | HarmonicHubAuraSystem_Session126 | NORMAL | Burst | Hub cascade initiation |
| `metric.corruption.spread` | MetricsRuntime_v1 | NORMAL | Threshold | Corruption propagation detected |
| `metric.node.updated` | NodeMetricEngine | NORMAL | Throttled | Node metrics changed |
| `metric.synergy.burst` | NodeMetricEngine | NORMAL | Throttled | High synergy spike |
| `metric.corruption.spike` | NodeMetricEngine | NORMAL | Throttled | Corruption spike detected |
| `event:synergyCascade` | MetricsRuntime_v1 | NORMAL | Threshold | Network synergy cascade |
| `event:harmonyResonance` | MetricsRuntime_v1 | NORMAL | Threshold | Harmony resonance detected |
| `event:corruptionOutbreak` | MetricsRuntime_v1 | NORMAL | Threshold | Corruption outbreak detected |
| `event:loadCollapse` | MetricsRuntime_v1 | NORMAL | Threshold | Network load collapse |
| `event:instabilityTrap` | MetricsRuntime_v1 | NORMAL | Threshold | Network instability trap |
| `network.node.created` | main.js (createAINodes) | INTERACTIVE | Spawn burst | Node spawned |
| `node:spawned` | main.js (createAINodes) | INTERACTIVE | Spawn burst | Node spawned (duplicate) |
| `network.link.created` | main.js (linkingSystem) | INTERACTIVE | User action | Link created (legacy format) |
| `link:created` | main.js, NodeLinkingSystem | INTERACTIVE | User action | Link created (canonical) |
| `link:synergyThreshold` | main.js | INTERACTIVE | Threshold | High synergy link |
| `link:harmonicLock` | main.js | INTERACTIVE | Threshold | Harmonic link lock |
| `network.link.destroyed` | main.js | INTERACTIVE | User action | Link destroyed (legacy format) |
| `link:collapsed` | main.js, NodeLinkingSystem | INTERACTIVE | User action | Link collapsed (canonical) |
| `metrics.spike` | main.js (HUD) | CRITICAL | Alert | Metrics spike alert |
| `hud.visibility.change` | main.js (HUD) | CRITICAL | UI action | HUD visibility changed |
| `node.selection` | main.js (interaction) | CRITICAL | User action | Node selected/deselected |
| `node:selected` | main.js (interaction) | CRITICAL | User action | Node selected (duplicate) |
| `semantic.ascension` | _NodeEvolution2_0 | CRITICAL | Lifecycle | Node ascended |
| `node:ascended` | _NodeEvolution2_0 | CRITICAL | Lifecycle | Node ascended (duplicate) |
| `node:evolved` | _NodeEvolution2_0 | NORMAL | Lifecycle | Node evolved |
| `semantic.ritual.started` | _MythicRitualController | BACKGROUND | User action | Ritual started |
| `semantic.ritual.completed` | _MythicRitualController | BACKGROUND | User action | Ritual completed |
| `camera.motion` | main.js (HUD) | INTERACTIVE | Throttled | Camera motion detected |

### 1.2 Events Subscribed (Consumers)

| Event Name | Consumer Systems | Current Priority | Behavior |
|-------------|-----------------|-----------------|----------|
| `event:harmonyResonance` | HarmonicHubAuraSystem_Session126 | NORMAL | Handle harmony resonance |
| `camera.motion` | main.js (HUD) | INTERACTIVE | Wake HUDs |
| `node.selection` | main.js (HUD), _GlyphFusionOverlay4_1 | CRITICAL/INTERACTIVE | Wake HUDs, handle selection |
| `node.synergy.high` | WaveBurstRouter_v1 | NORMAL | Handle synergy events |
| `metric:synergySpike` | WaveBurstRouter_v1 | NORMAL | Handle synergy spikes |
| `cascade.triggered` | WaveBurstRouter_v1 | NORMAL | Handle cascade events |
| `harmonic.cascade.start` | WaveBurstRouter_v1 | NORMAL | Handle cascade events |
| `link:created` | WaveBurstRouter_v1, _GlyphFusionOverlay4_1 | NORMAL | Handle link creation |
| `network.link.created` | _GlyphFusionOverlay4_1 | NORMAL | Handle link creation |
| `node.corruption.high` | WaveBurstRouter_v1 | NORMAL | Handle corruption events |
| `node.failure` | WaveBurstRouter_v1 | INTERACTIVE | Handle node failure |
| `metric:corruptionRise` | WaveBurstRouter_v1 | NORMAL | Handle corruption rise |
| `network:corruptionSpread` | WaveBurstRouter_v1 | INTERACTIVE | Handle corruption spread |
| `link:collapsed` | WaveBurstRouter_v1, _GlyphFusionOverlay4_1 | INTERACTIVE | Handle link collapse |
| `network.link.destroyed` | _GlyphFusionOverlay4_1 | NORMAL | Handle link destruction |
| `node.hover` | WaveBurstRouter_v1 | INTERACTIVE | Handle user interaction |
| `node.click` | WaveBurstRouter_v1 | INTERACTIVE | Handle user interaction |
| `node:selected` | WaveBurstRouter_v1, _GlyphFusionOverlay4_1 | INTERACTIVE | Handle user interaction |
| `semantic.state.changed` | _GlyphFusionOverlay4_1 | NORMAL | Handle state changes |
| `semantic.cluster.sync` | _GlyphFusionOverlay4_1 | NORMAL | Handle cluster sync |
| `semantic.ascension` | _GlyphFusionOverlay4_1 | NORMAL | Handle ascension |
| `node:ascended` | _GlyphFusionOverlay4_1 | NORMAL | Handle ascension |
| `semantic.ritual.started` | _GlyphFusionOverlay4_1 | NORMAL | Handle ritual start |
| `semantic.ritual.completed` | _GlyphFusionOverlay4_1 | NORMAL | Handle ritual completion |

---

## 2. PRIORITY ARCHITECTURE

### 2.1 Category Definitions

#### CRITICAL
**Definition:** Events that require immediate dispatch and cannot be delayed

**Scope:**
- Node lifecycle (creation, destruction, evolution)
- Link lifecycle (creation, destruction, collapse)
- Corruption threshold crossings
- System integrity alerts
- Engine state changes

**Rationale:** These events represent state transitions that must be processed immediately to maintain system consistency.

---

#### INTERACTION
**Definition:** Events triggered by user input or direct user actions

**Scope:**
- Player input (camera motion, clicks, hovers)
- Node interaction (selection, targeting)
- UI actions (HUD visibility changes)
- Link creation requests

**Rationale:** User actions require immediate feedback for responsive UX, but can be throttled if they occur in rapid succession.

---

#### SIMULATION
**Definition:** Events representing gameplay mechanics and simulation state changes

**Scope:**
- Metrics updates (synergy, harmony, corruption, stability)
- AI behavior (node evolution, ascension)
- Energy propagation (corruption spread, load changes)
- Harmony stabilization
- Cascade events

**Rationale:** Simulation events can be processed at lower frequency without affecting gameplay feel. Most changes are gradual.

---

#### VISUAL
**Definition:** Events that trigger visual effects and VFX

**Scope:**
- Particle triggers (bursts, explosions, cascades)
- Aura updates (harmony, synergy, corruption)
- Glyph updates (fusion, evolution)
- VFX pulses (emission, resonance)
- Shader effects (color changes, intensity)

**Rationale:** Visual effects are time-sensitive but can be processed at visual frame rate (30Hz) rather than real-time (60Hz).

---

#### BACKGROUND
**Definition:** Events for analytics, logging, and telemetry

**Scope:**
- Analytics (performance metrics, usage statistics)
- Logging (debug information, error tracking)
- Debug (state dumps, diagnostics)
- Statistics (aggregate metrics, historical data)
- Telemetry (user behavior tracking, system health)

**Rationale:** Background events have no real-time requirements and can be processed at very low frequency (1-2Hz).

---

### 2.2 Recommended Frequencies by Category

| Category | Recommended Max Rate | Throttling Strategy | Rationale |
|----------|---------------------|---------------------|------------|
| **CRITICAL** | Immediate (no limit) | No throttling | State transitions must be processed instantly |
| **INTERACTION** | Immediate (no limit) | Cooldown: 50ms | User actions need instant feedback, but rapid inputs can be debounced |
| **SIMULATION** | 10-20 Hz | Throttle: 50-100ms | Simulation changes are gradual; 10Hz sufficient for gameplay |
| **VISUAL** | 30 Hz | Throttle: 33ms | Matches visual frame rate; no benefit to exceed |
| **BACKGROUND** | 1-2 Hz | Throttle: 500-1000ms | No real-time requirements; batch processing |

---

## 3. PRIORITY TABLE

### 3.1 Complete Event Priority Matrix

| Event Name | Category | Producer System | Consumer Systems | Recommended Priority | Recommended Max Rate | Current Implementation |
|-------------|-----------|-----------------|------------------|---------------------|----------------------|----------------------|
| `harmonic.cascade.start` | SIMULATION | HarmonicHubAuraSystem_Session126 | WaveBurstRouter_v1 | NORMAL | 10 Hz | ✅ Correct |
| `metric.corruption.spread` | SIMULATION | MetricsRuntime_v1 | WaveBurstRouter_v1 | NORMAL | 10 Hz | ✅ Correct |
| `metric.node.updated` | SIMULATION | NodeMetricEngine | - | NORMAL | 10 Hz | ✅ Correct |
| `metric.synergy.burst` | SIMULATION | NodeMetricEngine | WaveBurstRouter_v1 | NORMAL | 10 Hz | ✅ Correct |
| `metric.corruption.spike` | SIMULATION | NodeMetricEngine | WaveBurstRouter_v1 | NORMAL | 10 Hz | ✅ Correct |
| `event:synergyCascade` | SIMULATION | MetricsRuntime_v1 | - | NORMAL | 10 Hz | ✅ Correct |
| `event:harmonyResonance` | SIMULATION | MetricsRuntime_v1 | HarmonicHubAuraSystem_Session126 | NORMAL | 10 Hz | ✅ Correct |
| `event:corruptionOutbreak` | SIMULATION | MetricsRuntime_v1 | - | NORMAL | 10 Hz | ✅ Correct |
| `event:loadCollapse` | SIMULATION | MetricsRuntime_v1 | - | NORMAL | 10 Hz | ✅ Correct |
| `event:instabilityTrap` | SIMULATION | MetricsRuntime_v1 | - | NORMAL | 10 Hz | ✅ Correct |
| `network.node.created` | CRITICAL | main.js | - | CRITICAL | Immediate | ✅ Correct |
| `node:spawned` | CRITICAL | main.js | - | CRITICAL | Immediate | ⚠️ Duplicate (use `network.node.created`) |
| `network.link.created` | CRITICAL | main.js | _GlyphFusionOverlay4_1 | CRITICAL | Immediate | ⚠️ Legacy format (use `link.created`) |
| `link:created` | CRITICAL | main.js, NodeLinkingSystem | WaveBurstRouter_v1, _GlyphFusionOverlay4_1 | CRITICAL | Immediate | ✅ Correct |
| `link:synergyThreshold` | SIMULATION | main.js | - | NORMAL | 10 Hz | ✅ Correct |
| `link:harmonicLock` | SIMULATION | main.js | - | NORMAL | 10 Hz | ✅ Correct |
| `network.link.destroyed` | CRITICAL | main.js | _GlyphFusionOverlay4_1 | CRITICAL | Immediate | ⚠️ Legacy format (use `link:collapsed`) |
| `link:collapsed` | CRITICAL | main.js, NodeLinkingSystem | WaveBurstRouter_v1, _GlyphFusionOverlay4_1 | CRITICAL | Immediate | ✅ Correct |
| `metrics.spike` | CRITICAL | main.js (HUD) | - | CRITICAL | Immediate | ✅ Correct |
| `hud.visibility.change` | INTERACTION | main.js (HUD) | - | INTERACTIVE | Immediate | ✅ Correct |
| `node.selection` | INTERACTION | main.js | main.js (HUD), _GlyphFusionOverlay4_1 | INTERACTIVE | Immediate | ✅ Correct |
| `node:selected` | INTERACTION | main.js | WaveBurstRouter_v1, _GlyphFusionOverlay4_1 | INTERACTIVE | Immediate | ⚠️ Duplicate (use `node.selection`) |
| `semantic.ascension` | CRITICAL | _NodeEvolution2_0 | _GlyphFusionOverlay4_1 | CRITICAL | Immediate | ✅ Correct |
| `node:ascended` | CRITICAL | _NodeEvolution2_0 | _GlyphFusionOverlay4_1 | CRITICAL | Immediate | ⚠️ Duplicate (use `semantic.ascension`) |
| `node:evolved` | CRITICAL | _NodeEvolution2_0 | - | NORMAL | 10 Hz | ✅ Correct |
| `semantic.ritual.started` | BACKGROUND | _MythicRitualController | _GlyphFusionOverlay4_1 | BACKGROUND | 1-2 Hz | ✅ Correct |
| `semantic.ritual.completed` | BACKGROUND | _MythicRitualController | _GlyphFusionOverlay4_1 | BACKGROUND | 1-2 Hz | ✅ Correct |
| `camera.motion` | INTERACTION | main.js (HUD) | main.js (HUD) | INTERACTIVE | Immediate | ✅ Correct |

---

## 4. ARCHITECTURAL RISKS

### 4.1 Events Emitted Too Frequently

**Risk 1: `metric.node.updated` Over-Emission**
- **Current:** Emitted on every metric change (synergy, harmony, corruption, stability)
- **Issue:** Can emit 60+ times per second during active gameplay
- **Impact:** Overloads event bus with redundant updates
- **Recommendation:** Implement delta-based emission - only emit if value changes significantly (>1%)

**Risk 2: `node.selection` Dual Emission**
- **Current:** Emitted twice with slightly different payloads (`node.selection` and `node:selected`)
- **Issue:** Subscribers may process same event twice
- **Impact:** Redundant processing, potential double-triggering
- **Recommendation:** Consolidate to single `node.selection` event

**Risk 3: `link:created` Dual Emission**
- **Current:** Emitted from both `main.js` and `NodeLinkingSystem.js`
- **Issue:** Duplicate events for same link creation
- **Impact:** Subscribers process same event twice
- **Recommendation:** Remove emission from `main.js`, keep only in `NodeLinkingSystem`

---

### 4.2 Events That Should Be Throttled

**Event 1: `camera.motion`**
- **Current:** Emits on every camera movement
- **Issue:** Can emit 60+ times per second during camera movement
- **Recommendation:** Implement 50ms cooldown (20Hz max)

**Event 2: `metric.synergy.burst`**
- **Current:** Emitted on every synergy spike detection
- **Issue:** Can cascade during network-wide synergy changes
- **Recommendation:** Implement 100ms cooldown (10Hz max)

**Event 3: `metric.corruption.spike`**
- **Current:** Emitted on every corruption spike detection
- **Issue:** Can cascade during corruption outbreaks
- **Recommendation:** Implement 100ms cooldown (10Hz max)

---

### 4.3 Events That Should Be Batched

**Batch 1: Metric Updates**
- **Current:** Individual events for each metric change
- **Issue:** Multiple events for same node in short time window
- **Recommendation:** Batch metric updates into single `metric.node.batch` event containing all changed metrics

**Batch 2: Visual Effect Triggers**
- **Current:** Separate events for particles, auras, glyphs
- **Issue:** Multiple events for same visual sequence
- **Recommendation:** Batch into `visual.sequence` event with ordered steps

---

### 4.4 Polling Systems That Should Use Events

**System 1: HarmonicNodeResonanceHalos.js (30 Hz)**
- **Current:** Polls `node.userData.metrics.harmony` every frame
- **Should:** Subscribe to `event:harmonyResonance` or `metric.node.updated`
- **Benefit:** Eliminate 30Hz polling, react only to changes

**System 2: SynergyCascadeVisualizer.js (30 Hz)**
- **Current:** Polls `node.userData.metrics.synergy` every frame
- **Should:** Subscribe to `event:synergyCascade` or `metric.synergy.burst`
- **Benefit:** Eliminate 30Hz polling, react only to cascade events

**System 3: NodeDynamicMetrics.js (30 Hz)**
- **Current:** Polls `node.userData.metrics` every frame
- **Should:** Subscribe to `metric.node.updated`
- **Benefit:** Eliminate 30Hz polling, react only to metric changes

**System 4: SafeMetricsFX1_1.js (30 Hz)**
- **Current:** Polls `node.userData.metrics` every frame
- **Should:** Subscribe to `metric.node.updated`
- **Benefit:** Eliminate 30Hz polling, react only to metric changes

**System 5: AdaptiveGlyphRendering1_0.js (30 Hz)**
- **Current:** Polls `node.userData.metrics` every frame
- **Should:** Subscribe to `metric.node.updated`
- **Benefit:** Eliminate 30Hz polling, react only to metric changes

**System 6: _ExtremeAINodeEvolution3.js (30 Hz)**
- **Current:** Polls `node.userData.metrics.synergy, harmony` every frame
- **Should:** Subscribe to `metric.node.updated` and `semantic.ascension`
- **Benefit:** Eliminate 30Hz polling, react only to changes

**System 7: _ExtremeAIShaderPack.js (30 Hz)**
- **Current:** Polls `node.userData.metrics` every frame
- **Should:** Subscribe to `metric.node.updated`
- **Benefit:** Eliminate 30Hz polling, react only to metric changes

**System 8: LinkCorruptionTransmission_v1.js (10 Hz)**
- **Current:** Polls `link.userData.synergy.score` every 100ms
- **Should:** Subscribe to `link:created` and `link:collapsed`
- **Benefit:** Eliminate 10Hz polling, react only to link lifecycle

**System 9: HarmonyStabilizationSystem_v1.js (Unknown)**
- **Current:** Polls `node.userData.corruption` and `link.userData.synergy`
- **Should:** Subscribe to `metric.corruption.spike` and `link:synergyThreshold`
- **Benefit:** Eliminate continuous polling, react only to threshold events

---

## 5. EVENT NAMING STANDARDS

### 5.1 Canonical Naming Convention

**Standard Format:** `system.entity.action`

**Rules:**
1. Use lowercase with dot notation
2. System: identifies the domain (network, node, link, metric, visual, semantic)
3. Entity: identifies the target (node, link, network, camera, hud, ritual)
4. Action: describes what happened (created, destroyed, updated, selected, started, completed)

---

### 5.2 Event Naming Taxonomy

#### Network Events
- `network.node.created` ✅ (canonical)
- `network.link.created` ✅ (canonical)
- `network.link.destroyed` ✅ (canonical)
- `network.link.destroyed` → `link:destroyed` (simplify)

#### Node Events
- `node:created` → `network.node.created` (use network prefix)
- `node:destroyed` → `network.node.destroyed` (use network prefix)
- `node:spawned` → `network.node.created` (duplicate, remove)
- `node:evolved` ✅ (canonical)
- `node:ascended` → `semantic.ascension` (use semantic prefix)
- `node.selection` ✅ (canonical)
- `node:selected` → `node.selection` (duplicate, remove)

#### Link Events
- `link:created` ✅ (canonical)
- `link:destroyed` → `link:collapsed` (use collapsed for failure)
- `link:collapsed` ✅ (canonical)
- `link:synergyThreshold` ✅ (canonical)
- `link:harmonicLock` ✅ (canonical)

#### Metric Events
- `metric.node.updated` ✅ (canonical)
- `metric.synergy.burst` ✅ (canonical)
- `metric.corruption.spike` ✅ (canonical)
- `metric.corruption.spread` ✅ (canonical)
- `metric:nodeUpdate` → `metric.node.updated` (use canonical format)
- `metric:linkUpdate` → `metric.link.updated` (use canonical format)

#### Simulation Events
- `event:synergyCascade` → `cascade.synergy.started` (use cascade prefix)
- `event:harmonyResonance` → `harmony.resonance.detected` (use harmony prefix)
- `event:corruptionOutbreak` → `corruption.outbreak.detected` (use corruption prefix)
- `event:loadCollapse` → `network.load.collapsed` (use network prefix)
- `event:instabilityTrap` → `network.instability.trapped` (use network prefix)

#### Visual Events
- `harmonic.cascade.start` ✅ (canonical)
- `cascade.triggered` → `cascade.started` (simplify)
- `wave.burst.lifecycle` → `wave.burst.started` (use canonical format)
- `wave.regime.transition` ✅ (canonical)

#### Semantic Events
- `semantic.ascension` ✅ (canonical)
- `semantic.ritual.started` ✅ (canonical)
- `semantic.ritual.completed` ✅ (canonical)
- `semantic.state.changed` ✅ (canonical)
- `semantic.cluster.sync` ✅ (canonical)

#### Interaction Events
- `camera.motion` ✅ (canonical)
- `node.hover` ✅ (canonical)
- `node.click` ✅ (canonical)
- `hud.visibility.change` ✅ (canonical)

#### Critical Events
- `metrics.spike` ✅ (canonical)

---

### 5.3 Naming Inconsistencies Found

**Inconsistency 1: Duplicate Node Creation Events**
- `network.node.created` and `node:spawned` represent same action
- **Recommendation:** Remove `node:spawned`, use only `network.node.created`

**Inconsistency 2: Duplicate Node Selection Events**
- `node.selection` and `node:selected` represent same action
- **Recommendation:** Remove `node:selected`, use only `node.selection`

**Inconsistency 3: Duplicate Ascension Events**
- `semantic.ascension` and `node:ascended` represent same action
- **Recommendation:** Remove `node:ascended`, use only `semantic.ascension`

**Inconsistency 4: Event Prefix Mismatch**
- `event:synergyCascade` vs `harmonic.cascade.start`
- **Recommendation:** Standardize to `cascade.synergy.started`

**Inconsistency 5: Legacy vs Canonical Formats**
- `network.link.created` vs `link:created`
- **Recommendation:** Phase out `network.*` prefix for links, use `link.*`

---

## 6. SYSTEMS TO MIGRATE FROM POLLING TO EVENTS

### 6.1 High Priority (Immediate Impact)

**1. HarmonicNodeResonanceHalos.js**
- **Current:** 30 Hz polling of `node.userData.metrics.harmony`
- **Target:** Subscribe to `event:harmonyResonance`
- **Migration Effort:** Low
- **Performance Gain:** High (eliminates 30Hz polling)

**2. SynergyCascadeVisualizer.js**
- **Current:** 30 Hz polling of `node.userData.metrics.synergy`
- **Target:** Subscribe to `event:synergyCascade`
- **Migration Effort:** Low
- **Performance Gain:** High (eliminates 30Hz polling)

**3. NodeDynamicMetrics.js**
- **Current:** 30 Hz polling of `node.userData.metrics`
- **Target:** Subscribe to `metric.node.updated`
- **Migration Effort:** Low
- **Performance Gain:** High (eliminates 30Hz polling)

**4. SafeMetricsFX1_1.js**
- **Current:** 30 Hz polling of `node.userData.metrics`
- **Target:** Subscribe to `metric.node.updated`
- **Migration Effort:** Low
- **Performance Gain:** High (eliminates 30Hz polling)

**5. AdaptiveGlyphRendering1_0.js**
- **Current:** 30 Hz polling of `node.userData.metrics`
- **Target:** Subscribe to `metric.node.updated`
- **Migration Effort:** Low
- **Performance Gain:** High (eliminates 30Hz polling)

**6. _ExtremeAINodeEvolution3.js**
- **Current:** 30 Hz polling of `node.userData.metrics.synergy, harmony`
- **Target:** Subscribe to `metric.node.updated` and `semantic.ascension`
- **Migration Effort:** Low
- **Performance Gain:** High (eliminates 30Hz polling)

**7. _ExtremeAIShaderPack.js**
- **Current:** 30 Hz polling of `node.userData.metrics`
- **Target:** Subscribe to `metric.node.updated`
- **Migration Effort:** Low
- **Performance Gain:** High (eliminates 30Hz polling)

---

### 6.2 Medium Priority (Moderate Impact)

**8. LinkCorruptionTransmission_v1.js**
- **Current:** 10 Hz polling of `link.userData.synergy.score`
- **Target:** Subscribe to `link:created` and `link:collapsed`
- **Migration Effort:** Medium
- **Performance Gain:** Medium (eliminates 10Hz polling)

**9. HarmonyStabilizationSystem_v1.js**
- **Current:** Continuous polling of `node.userData.corruption` and `link.userData.synergy`
- **Target:** Subscribe to `metric.corruption.spike` and `link:synergyThreshold`
- **Migration Effort:** Medium
- **Performance Gain:** Medium (eliminates continuous polling)

---

### 6.3 Low Priority (Long-Term)

**10. CriticalNodeFailureSystem.js**
- **Current:** 4 Hz polling of `node.userData.metrics.stability`
- **Target:** Subscribe to `metric.node.updated`
- **Migration Effort:** Low
- **Performance Gain:** Low (already low frequency)

**11. CoreMetricsCalculator.js**
- **Current:** 2 Hz polling of `node.userData.metrics`
- **Target:** Subscribe to `metric.node.updated`
- **Migration Effort:** Low
- **Performance Gain:** Low (already low frequency)

---

## 7. RECOMMENDED IMPLEMENTATION ROADMAP

### Phase 1: Event Standardization (Week 1)
1. Remove duplicate events:
   - Remove `node:spawned` (use `network.node.created`)
   - Remove `node:selected` (use `node.selection`)
   - Remove `node:ascended` (use `semantic.ascension`)
2. Standardize event naming:
   - Rename `event:synergyCascade` → `cascade.synergy.started`
   - Rename `event:harmonyResonance` → `harmony.resonance.detected`
3. Remove duplicate emissions:
   - Remove `link:created` from `main.js` (keep only in `NodeLinkingSystem`)
   - Remove `network.link.created` from `main.js` (use only `link:created`)

### Phase 2: Throttling Implementation (Week 2)
1. Add throttling to high-frequency events:
   - `camera.motion`: 50ms cooldown (20Hz max)
   - `metric.synergy.burst`: 100ms cooldown (10Hz max)
   - `metric.corruption.spike`: 100ms cooldown (10Hz max)
2. Implement delta-based emission:
   - `metric.node.updated`: emit only if value changes >1%

### Phase 3: High-Priority Migration (Week 3-4)
1. Migrate 7 visual systems from 30Hz polling to events:
   - HarmonicNodeResonanceHalos.js
   - SynergyCascadeVisualizer.js
   - NodeDynamicMetrics.js
   - SafeMetricsFX1_1.js
   - AdaptiveGlyphRendering1_0.js
   - _ExtremeAINodeEvolution3.js
   - _ExtremeAIShaderPack.js
2. Expected performance gain: 30-40% reduction in CPU load

### Phase 4: Medium-Priority Migration (Week 5-6)
1. Migrate 2 simulation systems from polling to events:
   - LinkCorruptionTransmission_v1.js
   - HarmonyStabilizationSystem_v1.js
2. Expected performance gain: 10-15% reduction in CPU load

### Phase 5: Low-Priority Migration (Week 7-8)
1. Migrate 2 background systems from polling to events:
   - CriticalNodeFailureSystem.js
   - CoreMetricsCalculator.js
2. Expected performance gain: 5-10% reduction in CPU load

---

## 8. CONCLUSION

The SemanticEventBus has a solid foundation with proper priority levels (CRITICAL, INTERACTIVE, NORMAL, BACKGROUND). However, several architectural issues prevent it from reaching its full potential:

**Key Findings:**
1. **Duplicate Events:** 3 event pairs represent the same action
2. **Naming Inconsistencies:** 5+ event prefixes don't follow canonical format
3. **Over-Emission:** `metric.node.updated` can emit 60+ times/second
4. **Underutilization:** 9 systems poll at 30Hz instead of using events
5. **Dual-Signal Architecture:** Link lifecycle emits both callbacks and events

**Recommendations:**
1. **Immediate:** Remove duplicate events and standardize naming
2. **Short-term:** Implement throttling for high-frequency events
3. **Medium-term:** Migrate 7 high-priority systems from polling to events
4. **Long-term:** Complete migration of all polling systems to event-driven architecture

**Expected Outcome:**
- 40-50% reduction in CPU load from eliminated polling
- Consistent event naming across the codebase
- Single source of truth for all lifecycle events
- Better separation of concerns between simulation and visual layers

---

**END OF AUDIT**
