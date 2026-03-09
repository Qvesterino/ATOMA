# ATOMA METRIC AUTHORITY MAP

**Generated:** 2026-03-09  
**Scope:** Complete audit of all core metric writes in ATOMA codebase

---

## METRIC: CORRUPTION

### WRITERS (Direct modification)

**Node Corruption:**
- `HarmonyStabilizationSystem_v1.js` - Heals corruption via harmony
  - `node.userData.corruption = Math.max(0, nodeCorruption - healAmount)`
  - `node.userData.corruption = Math.max(0, node.userData.corruption - 0.2)`
  - `node.userData.corruption = 0`
  - `node.userData.corruption = Math.max(0, node.userData.corruption - pulse.intensity * 0.3)`
  - `node.userData.corruption = Math.max(0, node.userData.corruption - zone.intensity * 0.01 * deltaTime)`
- `HarmonicHealingVisualSystem_Session134.js`
  - `targetNode.corruption = Math.max(0, targetNode.corruption - healingPower)`
- `LinkCorruptionTransmissionIntegrationPatch_v1.js`
  - `targetNode.userData.corruption = Math.min(1.0, currentCorruption + infectionRate * deltaTime)`
- `PHASE5_CorruptionBridge_v1.js`
  - `node.userData.corruption = Math.min(currentCorruption + corruptionPerNode, 1.0)`
  - `node.userData.corruption = Math.max(currentCorruption - harmonyPerNode, 0)`
- `PHASE5_NetworkSynchronization_v1.js`
  - `sourceNode.userData.corruption = resolvedValue`
  - `targetNode.userData.corruption = resolvedValue`
- `T4004_HARMONY_HEALING_TEST_RUNNER.js` (test file)
- `_AIEmotionalFeed3_1.js`

**Link Corruption (separate metric):**
- `LinkCorruptionTransmission_v1.js` - Main link corruption tracker
  - Link corruption is tracked in `this.linkCorruption` Map, NOT `link.userData.corruption`
  - Internal state: `linkData.level = Math.min(1.0, linkData.level + corruptionIncrease)`

**Example/Test Files:**
- `EXAMPLES/HARMONIC_RECOVERY_EXAMPLES.js`
- `EXAMPLES/HARMONIC_RESILIENCE_EXAMPLES.js`
- `EXAMPLES/HARMONY_STABILIZATION_v1_EXAMPLES.js`
- `EXAMPLES/LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js`
- `debug_semantic_helpers_validation.js`

### READERS
- `HarmonicHubAuraSystem_Session126.js`
- `HarmonicNodeResonanceHalos.js`
- `HubInfluencePropagation.js`
- `LinkCorruptionTransmission_v1.js` - Reads source node corruption for transmission
- `NodeLinkedAuraSystem_Session123.js`
- `PersonalitySignalSmoother_v1.js`
- `LinkCorruptionParticleSystem.js`
- `LinkCorruptionTransmissionIntegrationPatch_v1.js`
- `RegionalEquilibriumFieldSystem.js` - Computes average
- `ResonanceFeedback_v1.js` - Computes network aggregate

### DERIVED
- `CoreMetricsCalculator.js` - `this.metrics.corruption = this.calculateCorruption()`
- `RegionalEquilibriumFieldSystem.js` - `region.corruption = corruptionSum / count`
- `ResonanceFeedback_v1.js` - `networkMood.corruption = aggregates.corruptionSum / nodeCount`

### VISUALIZE
- `HarmonicNodeResonanceHalos.js` - Visual state corruption
- `NodeLinkedAuraSystem_Session123.js` - `aura.corruption = metrics.corruption ?? 0`
- `NeonLinkVisuals.js` - `visual.corruption = this._clamp100(corruptionNorm * 100)`
- `LEGACY/_ExtremeLinkVisualPack3.js` - `visualData.metrics.corruption = link.corruption || 0`
- `LinkCorruptionParticleSystem.js` - Particle corruption property
- `SafeMetricsFX1_1.js` - Visual state corruption

---

## METRIC: HARMONY

### WRITERS

**Node Harmony:**
- `HarmonyStabilizationSystem_v1.js` - Main harmony system
  - Uses internal `this.nodeHarmony` Map
  - `harmonyData.level = Math.max(0, Math.min(1.0, harmonyData.level + harmonyIncrease - harmonyDecay))`
  - Visual writes (guarded by `PHASE_C3_METRIC_WRITE_LOCK`):
    - `node.userData.harmonyLevel = level`
    - `link.userData.harmonyLevel = level`
- `HarmonicHealingVisualSystem_Session134.js`
  - `hub.harmony = hub.harmony * 0.9 + region.avgHarmony * 0.1`

**Link Harmony (separate metric):**
- `HarmonyStabilizationSystem_v1.js` - Internal `this.linkHarmony` Map
  - `harmonyData.level = Math.min(1.0, harmonyData.level + harmonyIncrease)`

**Example/Test Files:**
- `EXAMPLES/HARMONIC_RECOVERY_EXAMPLES.js`
- `EXAMPLES/HARMONIC_RESILIENCE_EXAMPLES.js`
- `EXAMPLES/HARMONY_STABILIZATION_v1_EXAMPLES.js`

### READERS
- `HarmonicHubAuraSystem_Session126.js`
- `HarmonicNodeResonanceHalos.js`
- `HubInfluencePropagation.js`
- `LinkCorruptionTransmission_v1.js` - Reads for corruption blocking
- `HarmonyStabilizationSystem_v1.js` - Reads source node harmony
- `NodeLinkedAuraSystem_Session123.js`

### DERIVED
- `CoreMetricsCalculator.js` - `this.metrics.harmony = this.calculateHarmony()`
- `RegionalEquilibriumFieldSystem.js` - `region.harmony = harmonySum / count`
- `ResonanceFeedback_v1.js` - `networkMood.harmony = aggregates.harmonySum / nodeCount`

### VISUALIZE
- `HarmonicNodeResonanceHalos.js` - Visual state harmony
- `NodeLinkedAuraSystem_Session123.js` - `aura.harmony = state.harmony ?? 0`
- `NeonLinkVisuals.js` - `visual.harmony = this._clamp100(harmonyNorm * 100)`
- `SafeMetricsFX1_1.js` - Visual state harmony

---

## METRIC: SYNERGY

### WRITERS

**Link Synergy (primary authority):**
- `NodeLinkingSystem.js` - **CANONICAL SYNERGY WRITER**
  - `link.userData.synergy = { score, synergyNorm }`
  - `link['synergyScore'] = score` // Compatibility mirror
  - Initial: `link.userData.synergy = { score: 0.5, synergyNorm: 0.5 }`

**Synergy Penalty (degradation):**
- `LinkCorruptionTransmission_v1.js`
  - `linkOrNode.synergy = Math.max(0, linkOrNode.synergy - synergyCost)`
  - **Note:** This is guarded by Phase C.3 write lock in some contexts

**Example Files:**
- `EXAMPLES/LINK_MORPHING_EXAMPLES.js`

### READERS
- `HarmonicHubAuraSystem_Session126.js`
- `HarmonicNodeResonanceHalos.js`
- `HubInfluencePropagation.js`
- `LinkCorruptionTransmission_v1.js` - Reads for corruption blocking
  - `_getLinkSynergyPct(link)` - Canonical reader
  - `_setLinkSynergyPct(link, value)` - Canonical writer (not used for penalties)
- `HarmonyStabilizationSystem_v1.js`
  - `_getLinkSynergyPct(link)` - Reads for recovery acceleration
- `NodeLinkedAuraSystem_Session123.js`
- `LEGACY/_ExtremeLinkVisualPack3.js`
- `NeonLinkVisuals.js`

### DERIVED
- `CoreMetricsCalculator.js` - `this.metrics.synergy = this.calculateSynergy()`
- `RegionalEquilibriumFieldSystem.js` - `region.synergy = 0.5` (fixed value)
- `ResonanceFeedback_v1.js` - `networkMood.synergy = aggregates.synergySum / nodeCount`

### VISUALIZE
- `HarmonicNodeResonanceHalos.js` - Visual state synergy
- `NodeLinkedAuraSystem_Session123.js` - `aura.synergy = state.synergy ?? 0`
- `NeonLinkVisuals.js` - `visual.synergy = this._clamp100(synergyNorm * 100)`
- `LEGACY/_ExtremeLinkVisualPack3.js` - `visualData.metrics.synergy = link.synergy || 0.5`

---

## METRIC: STABILITY

### WRITERS

**Gameplay Stability (separate metric):**
- `ArchetypeGameplayEffects_v1.js`
  - `gameplayState.stability = Math.max(0, Math.min(1, gameplayState.stability + stabilityDrift))`
  - `targetGameplay.stability += synergy.stabilityImpact * deltaTime * 0.1`
  - `targetGameplay.stability = Math.max(0, Math.min(1, targetGameplay.stability))`
- `ArchetypeVisualIntegrationPatch_v1_GAMEPLAY.js`
  - `gameplayState.stability = profile.stability`

**Link Stability (separate metric):**
- `HarmonicHealingVisualSystem_Session134.js`
  - `link.stability = Math.min(1.0, link.stability + healingPower)`

**MetricsRuntime_v1.js** (equalization system):
- `ma.stability = this._clamp01(ma.stability + dSt)`
- `mb.stability = this._clamp01(mb.stability - dSt)`

### READERS
- `HarmonicNodeResonanceHalos.js`
- `HarmonicResonanceFeedbackSystem.js`
- `HubInfluencePropagation.js`
- `NodeLinkedAuraSystem_Session123.js`
- `NeonLinkVisuals.js`

### DERIVED
- `CoreMetricsCalculator.js` - `this.metrics.stability = this.calculateStability()`
- `RegionalEquilibriumFieldSystem.js` - `region.instability = instabilitySum / count`
- `ResonanceFeedback_v1.js` - `networkMood.stability = aggregates.stabilitySum / nodeCount`

### VISUALIZE
- `HarmonicNodeResonanceHalos.js` - Visual state stability
- `NodeLinkedAuraSystem_Session123.js` - `aura.instability = metrics.instability ?? 0`
- `NeonLinkVisuals.js` - `visual.stability = this._clamp100(stabilityNorm * 100)`

---

## METRIC: INSTABILITY

### WRITERS

**No direct writes found for `node.userData.metrics.instability`**

**Instability appears to be DERIVED from other metrics:**
- `RegionalEquilibriumFieldSystem.js` - Aggregates node instability
- `ResonanceFeedback_v1.js` - Aggregates network instability

### READERS
- `HarmonicNodeResonanceHalos.js`
- `HarmonicResonanceFeedbackSystem.js`
- `HubInfluencePropagation.js`
- `NodeLinkedAuraSystem_Session123.js`
- `SafeMetricsFX1_1.js`

### DERIVED
- `RegionalEquilibriumFieldSystem.js` - `region.instability = instabilitySum / count`
- `ResonanceFeedback_v1.js` - `networkMood.instability = aggregates.instabilitySum / nodeCount`

### VISUALIZE
- `HarmonicNodeResonanceHalos.js` - Visual state instability
- `NodeLinkedAuraSystem_Session123.js` - `aura.instability = metrics.instability ?? 0`

---

## METRIC: LOAD PRESSURE

### WRITERS

**Link Load Pressure (separate metric):**
- `NodeLinkingSystem.js`
  - `this.cachedMetrics.loadPressure = avgLoad`
  - Legacy alias: `link['networkLoad'] = avgLoad`

**Node Load Pressure (separate metric):**
- `ParticleEmissionScaler.js`
  - `this.cachedMetrics.loadPressure = avgLoad`

**CanonicalTemplate3_StressVisuals.js:**
- `stressData.loadPressure = clampedLoad`

### READERS
- `CoreMetricsCalculator.js` - Reads for network load calculation
- `NodeDynamicMetrics.js` - Reads for visualization

### DERIVED
- `CoreMetricsCalculator.js` - `const loadPressure = this.calculateNetworkLoad()`

### VISUALIZE
- `NodeDynamicMetrics.js` - `visual.loadPressure = this._clamp100(loadPressureNorm * 100)`

---

## CONFLICT DETECTION

### CORRUPTION
**Potential Conflict Zone:**
- Multiple systems write to `node.userData.corruption`:
  1. `HarmonyStabilizationSystem_v1.js` - HEALS (decreases)
  2. `LinkCorruptionTransmission_v1.js` - INFECTS (increases, via PHASE_C3_METRIC_WRITE_LOCK check)
  3. `PHASE5_CorruptionBridge_v1.js` - BRIDGES (synchronizes)
  4. `PHASE5_NetworkSynchronization_v1.js` - SYNCHRONIZES (resolves)
  
**Status:** ⚠️ **POTENTIAL CONFLICT**  
**Severity:** MEDIUM  
**Details:** Harmony system heals corruption while transmission system spreads it. Both write to the same metric on the same node. The `PHASE_C3_METRIC_WRITE_LOCK` in transmission system suggests awareness of this conflict.

### HARMONY
**Potential Conflict Zone:**
- Multiple systems write to `harmonyLevel`:
  1. `HarmonyStabilizationSystem_v1.js` - Primary writer (internal Map + guarded userData writes)
  2. `HarmonicHealingVisualSystem_Session134.js` - Hub harmony smoothing
  
**Status:** ⚠️ **POTENTIAL CONFLICT**  
**Severity:** LOW  
**Details:** Different systems (node-level vs hub-level) writing to harmony. Primary system uses internal Map,.userData writes are guarded by `PHASE_C3_METRIC_WRITE_LOCK`.

### SYNERGY
**Potential Conflict Zone:**
- Multiple systems write to `link.userData.synergy`:
  1. `NodeLinkingSystem.js` - PRIMARY WRITER (canonical)
  2. `LinkCorruptionTransmission_v1.js` - DEGRADER (penalty system)
  
**Status:** ⚠️ **POTENTIAL CONFLICT**  
**Severity:** MEDIUM  
**Details:** Canonical writer in NodeLinkingSystem creates synergy, while transmission system applies penalties. This appears to be by design (synergy degradation under corruption pressure).

### STABILITY
**No conflicts detected.**  
Stability is written by separate gameplay and link systems that don't overlap.

### INSTABILITY
**No conflicts detected.**  
Instability is primarily a derived metric (no direct writers found).

### LOAD PRESSURE
**No conflicts detected.**  
Load pressure is computed from network statistics.

---

## SUMMARY STATISTICS

### TOTAL WRITERS PER METRIC

| Metric | Node Writers | Link Writers | Total |
|--------|--------------|--------------|--------|
| Corruption | 5 active + 4 tests | 1 (separate Map) | 10 |
| Harmony | 1 primary + 1 hub | 1 (separate Map) | 3 |
| Synergy | 0 | 2 (1 canonical, 1 penalty) | 2 |
| Stability | 1 (gameplay) | 1 (link) | 2 |
| Instability | 0 | 0 | 0 |
| Load Pressure | 1 | 1 | 2 |

### CONFLICTS BY SEVERITY

**HIGH (0):** None  
**MEDIUM (2):** Corruption, Synergy  
**LOW (1):** Harmony  
**NONE (3):** Stability, Instability, Load Pressure

### LEGACY METRICS FOUND

**Shadow Metrics (deprecated parallel copies):**
- `link['synergyScore']` in `NodeLinkingSystem.js` - Compatibility mirror for `link.userData.synergy`
- `link['networkLoad']` in `NodeLinkingSystem.js` - Legacy alias for load pressure

**Separate Tracking Systems (not in userData.metrics):**
- `HarmonyStabilizationSystem_v1.nodeHarmony` - Internal Map for node harmony
- `HarmonyStabilizationSystem_v1.linkHarmony` - Internal Map for link harmony
- `LinkCorruptionTransmission_v1.linkCorruption` - Internal Map for link corruption

---

## ARCHITECTURAL NOTES

### Metric Storage Patterns

**Pattern 1: Direct userData.metrics storage**
- Traditional pattern: `node.userData.metrics.corruption`
- **Status:** LIMITED USE
- Most active systems bypass this and write directly to `node.userData.metricName`

**Pattern 2: Direct userData storage (dominant)**
- Current pattern: `node.userData.corruption`, `link.userData.synergy`
- **Status:** DOMINANT
- Most active systems use this pattern

**Pattern 3: Internal System Maps**
- Pattern: System maintains own `Map<id, metricData>`
- Examples:
  - `HarmonyStabilizationSystem_v1.nodeHarmony`
  - `LinkCorruptionTransmission_v1.linkCorruption`
- **Status:** EMERGING
- Used for complex metrics with internal state

### Write Lock Mechanisms

**Phase C.3 Metric Write Lock:**
- `PHASE_C3_METRIC_WRITE_LOCK = true` constant in:
  - `HarmonyStabilizationSystem_v1.js`
  - `LinkCorruptionTransmission_v1.js`
- **Purpose:** Prevents systems from writing to userData during Phase C.3
- **Effect:** Metrics are tracked internally but not persisted to userData

---

## RECOMMENDATIONS

### HIGH PRIORITY

1. **Resolve Corruption Write Conflicts**
   - Establish clear write order: Transmission → Stabilization
   - Consider single authority node for corruption writes
   - Document the `PHASE_C3_METRIC_WRITE_LOCK` purpose

2. **Clarify Synergy Authority**
   - Document that `NodeLinkingSystem.js` is the canonical writer
   - Make `LinkCorruptionTransmission_v1.js` synergy penalties explicit (not hidden writes)

### MEDIUM PRIORITY

3. **Standardize Metric Storage**
   - Choose between `userData.metrics` vs direct `userData.metricName`
   - Prefer one pattern across all systems

4. **Audit Internal Map Systems**
   - Evaluate if `nodeHarmony`, `linkCorruption` Maps should be the primary storage
   - Consider migrating to single source of truth

### LOW PRIORITY

5. **Clean Up Legacy Metrics**
   - Remove `link['synergyScore']` compatibility mirror
   - Remove `link['networkLoad']` legacy alias

6. **Document Instability as Derived**
   - Clarify that instability has no direct writers
   - Document derivation formula

---

## METHODOLOGY

**Search Patterns Used:**
- `\.userData\.metrics\.(harmony|corruption|instability|stability|synergy|loadPressure)\s*=`
- `\.corruption\s*=\s*[^=]`
- `\.harmony\s*=\s*[^=]`
- `link\.userData\.synergy\s*=`

**Categorization Criteria:**
- **WRITE:** Direct metric value modification (assignment, +=, -=, Math.min, Math.max, clamp)
- **READ:** Metric used for logic/conditions without modification
- **DERIVE:** Metric calculated from other metrics or aggregates
- **VISUALIZE:** Metric only affects visual effects

**Scope:** Full codebase scan of all `.js` files

---

**End of Audit Report**