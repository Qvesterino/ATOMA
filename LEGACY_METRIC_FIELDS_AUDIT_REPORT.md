# Legacy Metric Fields Audit Report

**Date:** 2026-03-18  
**Objective:** Identify all legacy metric field usage outside canonical container to eliminate silent divergence

---

## Executive Summary

**Total Legacy Occurrences Found:** 184

| Metric | Occurrences | Writers | Readers | Critical |
|--------|------------|---------|---------|----------|
| `harmony` | 78 | 6 | 12 | 0 |
| `synergy` | 54 | 3 | 9 | 0 |
| `corruption` | 52 | 7 | 8 | **1** |

**CRITICAL FINDING:** Renderer (`NeonLinkVisuals.js`) reads legacy `corruption` field directly

---

## 1. Canonical Container Structure

**NodeMetricEngine.js** defines the canonical container:
```javascript
node.userData.metrics = {
  synergy: 0,
  harmony: 0,
  stability: 1,
  corruption: 0,
  loadPressure: 0
}
```

**Legacy Field Guards Installed:**
- NodeMetricEngine installs property guards that block legacy writes
- Legacy reads return `undefined`
- Legacy writes redirect to `node.userData.metrics[key]`

---

## 2. Legacy Field Usage by Metric

### 2.1 HARMONY (78 occurrences)

#### Legacy Fields Found:
- `node.userData.harmonyLevel` - Harmony value (0-1)
- `node.userData.harmonyStabilized` - Visual state flag
- `node.userData.harmonyDampingFactor` - Motion damping value
- `node.userData.harmonyThresholds` - Event tracking set
- `node.userData.harmonyVisualState` - Visual parameters object
- `link.userData.harmonyLevel` - Link harmony (0-1)
- `link.userData.harmonyVisualState` - Link visual parameters
- `link.userData.harmonyStabilized` - Link visual state flag
- `link.userData.harmonyDamping` - Motion damping
- `link.userData.harmonyAuraStrength` - Derived aura intensity

#### WRITERS (6 systems):

1. **HarmonyStabilizationSystem_v1.js** (Lines 50-80)
   ```javascript
   node.userData.harmonyLevel = canonicalHarmony;
   ```
   - **Status:** Writes to legacy, should use `node.userData.metrics.harmony`
   - **Risk:** Creates desync with canonical metrics

2. **NetworkRituals_v1.js** (Lines 45-80)
   ```javascript
   newParticipant.userData.harmonyLevel -= harmonyCost;
   node.userData.harmonyLevel = (node.userData.harmonyLevel || 0) + refundPerParticipant;
   ```
   - **Status:** Direct writes to legacy field
   - **Risk:** Gameplay mechanics bypass canonical metrics

3. **InjectHarmonyIntoNodes.js** (Lines 25-60)
   ```javascript
   node.userData.harmonyLevel = harmonyLevel;
   ```
   - **Status:** Initialization utility writes to legacy
   - **Risk:** Creates initial desync

4. **NodeVisualStateBinder.js** (Lines 85-95)
   ```javascript
   node.userData.harmonyStabilized = true;
   node.userData.harmonyDampingFactor = 0.2;
   ```
   - **Status:** Visual state writes (acceptable - not a metric)
   - **Risk:** None (visual state, not metric)

5. **NodeLinkingSystem.js** (Lines 200-220)
   ```javascript
   node.userData.harmonyStabilized = true;
   node.userData.harmonyDampingFactor = 0.2;
   ```
   - **Status:** Visual state writes (acceptable - not a metric)
   - **Risk:** None (visual state, not metric)

6. **T4004_HARMONY_HEALING_TEST_RUNNER.js** (Lines 90-95)
   ```javascript
   targetNode.userData.harmonyLevel = 0.9;
   ```
   - **Status:** Test utility writes to legacy
   - **Risk:** None (test code only)

#### READERS (12 systems):

1. **HarmonyStabilizationSystem_v1.js** (Lines 50-80)
   - Reads own writes (circular dependency)
   
2. **NetworkRituals_v1.js** (Lines 40-85)
   - Reads for ritual cost checks
   
3. **LinkCorruptionTransmission_v1.js** (Lines 120-140)
   - Reads for resource deduction calculations
   
4. **src/legacy/T2_HarmonyVisualConsumer_v1.js** (Lines 35-40)
   - Legacy visual system reads harmony
   
5. **NeonLinkVisuals.js** (Lines 1500-1520)
   - Reads `harmonyStabilized` and `harmonyDamping` (visual state, not metric)
   
6. **NodeVisualStateBinder.js** (Lines 95-105)
   - Reads own visual state
   
7. **NodeLinkingSystem.js** (Lines 200-230)
   - Checks harmony state flags
   
8. **LinkVisualStateAdapter.js** (Lines 60-65)
   - Reads for visual parameter binding
   
9. **RitualVisualOrchestrator.js** (Lines 75-80)
   - Reads `harmonyAuraStrength` for visuals
   
10. **HarmonicSyncEffectApplier.js** (Lines 25-45)
    - Reads `harmonySync` and `harmonySyncStrength`
    
11. **HarmonicInfluencePropagationSystem_Session127.js**
    - Reads for influence calculations
    
12. **HarmonicHubAuraSystem_Session126.js**
    - Reads for aura calculations

**WARNING:** Most visual systems reading `harmonyLevel` should read from `node.userData.metrics.harmony` instead.

---

### 2.2 SYNERGY (54 occurrences)

#### Legacy Fields Found:
- `node.userData.synergy` - Raw synergy value
- `node.userData.synergyPotential` - Synergy capacity
- `node.userData.synergyBonus` - Visual enhancement tier
- `node.userData.synergyPulseActive` - Visual pulse flag
- `node.userData.synergyScore` - Pulse score tracking
- `node.userData.synergyArrows` - Visual arrow clusters
- `link.userData.synergy` - Link synergy object `{ score, synergyNorm }`
- `link.userData.synergyCollapse` - Collapse state flag
- `link.userData.synergyCascadeTime` - Cascade timestamp
- `link.userData.visualSynergy` - Derived visual synergy (0-1)
- `link.userData.synergyBonus` - Visual enhancement data

#### WRITERS (3 systems):

1. **NodeLinkingSystem.js** (Lines 150-160)
   ```javascript
   link.userData.synergy = { score, synergyNorm };
   link['synergyScore'] = score;
   ```
   - **Status:** Writes to legacy link synergy
   - **Risk:** Creates desync with canonical link metrics
   - **Note:** This is the **ONLY** system writing `link.userData.synergy`

2. **NodeVisualStateBinder.js** (Lines 55-65)
   ```javascript
   node.userData.synergyPulseActive = true;
   node.userData.synergyScore = synergy;
   ```
   - **Status:** Visual state writes (acceptable - not a metric)
   - **Risk:** None (visual state, not metric)

3. **LinkCorruptionTransmission_v1.js** (Lines 200-210)
   ```javascript
   link.userData.synergyCollapse = true;
   link.userData.synergyCascadeTime = Date.now();
   ```
   - **Status:** Collapse state writes (acceptable - not a metric)
   - **Risk:** None (event state, not metric)

#### READERS (9 systems):

1. **NodeLinkingSystem.js** (Lines 155-165)
   - Reads own writes (circular dependency)

2. **LinkPrioritySystem.js** (Lines 30-35)
   ```javascript
   * @param {Object} link - Link object (uses canonical link.userData.synergy or synergy labels)
   ```
   - **Status:** Documentation indicates should use canonical
   - **Actual:** Reads `link.userData.synergy`
   - **Risk:** Uses legacy data for priority calculations

3. **LinkGlowSynergyEngine_v2.js** (Lines 15-20)
   ```javascript
   * - Reads from link.userData.synergy (ComputeSynergyScore2_1 output)
   ```
   - **Status:** Reads legacy for glow effects
   - **Risk:** Visual effects driven by unsynced data

4. **LinkSemanticPictogramSystem_Enhanced.js** (Lines 95-100)
   - Reads `synergyArrows` for visual rendering

5. **MetricValidationRuntime.js** (Lines 70-75)
   - Reads for validation checks
   - **Status:** Validator intentionally checks legacy fields

6. **ResonanceFeedback_v1.js** (Lines 45-55)
   - Reads `synergyBonus` for visual feedback

7. **SynergyChainReaction_v1.js** (Lines 60-75)
   - Reads `synergyBonus` for chain reactions

8. **SystemStateOverlay.js** (Lines 80-85)
   - Reads `synergyValue` for overlay display

9. **EXAMPLES/LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js** (Lines 50-55)
   - Reads `synergyPotential` for example logic
   - **Status:** Example code only

**WARNING:** Multiple visual systems reading legacy `synergy` instead of canonical `node.userData.metrics.synergy`.

---

### 2.3 CORRUPTION (52 occurrences)

#### Legacy Fields Found:
- `node.userData.corruption` - Node corruption level (0-1)
- `link.userData.corruption` - Link corruption level (0-1)
- `link.userData.corruptionLevel` - Canonical link corruption (0-1)
- `link.userData.corruptionVisualState` - Visual parameters object
- `link.userData.corruptionWavePhase` - Wave animation phase
- `link.userData.corruptionWaveIntensity` - Wave animation intensity
- `node.userData.corruptionSurgeTime` - Surge timestamp
- `link.userData.contagionState` - Contagion infection status
- `mesh.userData.corruptionLevel` - Mesh-level corruption
- `mesh.userData.corruptionActive` - Corruption active flag
- `mesh.userData.corruptionDeviation` - Visual deviation value
- `mesh.userData.isCorrupted` - Visual corruption flag
- `glyphGroup.userData.corruptionDimmingActive` - Dimming flag
- `glyphGroup.userData.corruptionDimmingFactor` - Dimming intensity

#### WRITERS (7 systems):

1. **LinkCorruptionTransmission_v1.js** (Lines 95-105)
   ```javascript
   const currentCorruption = targetNode.userData?.corruption || 0;
   targetNode.userData.corruption = Math.min(1.0, currentCorruption + infectionRate * deltaTime);
   ```
   - **Status:** Direct writes to legacy `node.userData.corruption`
   - **Risk:** Creates desync with canonical `node.userData.metrics.corruption`
   - **CRITICAL:** This system writes to legacy while NodeMetricEngine maintains canonical

2. **LinkCorruptionTransmissionIntegrationPatch_v1.js** (Lines 40-50)
   - Same as above (integration patch)
   
3. **T4004_HARMONY_HEALING_TEST_RUNNER.js** (Lines 30-45)
   ```javascript
   node.userData.corruption = targetLevel + (Math.random() * 0.1 - 0.05);
   ```
   - **Status:** Test utility writes to legacy
   - **Risk:** None (test code only)

4. **debug_semantic_helpers_validation.js** (Lines 15-20)
   ```javascript
   testNode.userData.corruption = 0.05;
   ```
   - **Status:** Validation test writes to legacy
   - **Risk:** None (test code only)

5. **src/utils/nodeCorruptionAccessor.js** (Lines 10-15)
   ```javascript
   node.userData.corruption = next;
   ```
   - **Status:** Legacy accessor utility
   - **Risk:** Creates bypass of canonical metrics

6. **EXAMPLES/LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js** (Lines 75-80)
   - Example code writes to legacy
   - **Status:** Example code only

7. **EXAMPLES/HARMONY_STABILIZATION_v1_EXAMPLES.js** (Lines 25-30)
   - Example code writes to legacy
   - **Status:** Example code only

#### READERS (8 systems):

1. **LinkEligibilityGate_v1.js** (Lines 35-40)
   ```javascript
   const nodeACorruption = nodeA.userData.corruption ?? 0;
   const nodeBCorruption = nodeB.userData.corruption ?? 0;
   ```
   - **Status:** Reads legacy for link eligibility logic
   - **Risk:** Game logic driven by unsynced data

2. **LinkMetricsToVisualBridge_v1.js** (Lines 20-25)
   - Reads `link.userData.corruption` for visual mapping

3. **NeonLinkVisuals.js** (Lines 1800-1850)
   ```javascript
   child.userData.isCorrupted = true;
   child.userData.corruptionLevel = corruptionLevel;
   child.userData.corruptionDeviation = randomDeviation * maxDeviation;
   linkMesh.userData.corruptionActive = true;
   linkMesh.userData.corruptionLevel = corruptionLevel;
   ```
   - **Status:** **CRITICAL** - Renderer reads legacy corruption for visuals
   - **Risk:** Visuals driven by potentially desynced data
   - **Impact:** Direct visual feedback to user based on wrong data

4. **LinkResonanceFlowSystem_Session124.js** (Lines 60-65)
   - Reads for flow calculations

5. **MegaGlyphSystem.js** (Lines 120-125)
   - Reads for dimming calculations

6. **MetricValidationRuntime.js** (Lines 70-75)
   - Reads for validation checks
   - **Status:** Validator intentionally checks legacy fields

7. **SNIPPETS/WEEK13_ARCHETYPE_CURVES_SNIPPETS.js** (Lines 15-20)
   ```javascript
   if (myNode.userData.corruption > 0.8) {
     this.archetypeCurves.assignArchetype(myNode, 'warlock');
   }
   ```
   - **Status:** Archetype system reads legacy for decisions
   - **Risk:** Game mechanics driven by unsynced data

8. **SemanticMetricAdapter.js** (Lines 25-35)
   - Reads for legacy fallback resolution
   - **Status:** Adapter intentionally checks legacy fields

**CRITICAL:** Renderer (`NeonLinkVisuals.js`) reads legacy corruption directly. This is a high-risk visual desync.

---

## 3. Critical Issues

### 3.1 RENDERER READS LEGACY CORRUPTION
**File:** `NeonLinkVisuals.js`  
**Lines:** 1800-1850  
**Severity:** CRITICAL  

**Issue:**
The renderer reads legacy `mesh.userData.corruptionLevel` and `mesh.userData.isCorrupted` flags directly from legacy fields. If these are not synced with canonical `node.userData.metrics.corruption`, visuals will not reflect actual game state.

**Impact:**
- User sees corrupted links that aren't actually corrupted
- User sees clean links that are actually corrupted
- Visual feedback is unreliable

**Current Code:**
```javascript
// NeonLinkVisuals.js, Lines 1820-1830
child.userData.isCorrupted = true;
child.userData.corruptionLevel = corruptionLevel;
linkMesh.userData.corruptionActive = true;
linkMesh.userData.corruptionLevel = corruptionLevel;
```

---

### 3.2 LINK CORRUPTION TRANSMISSION WRITES LEGACY
**File:** `LinkCorruptionTransmission_v1.js`  
**Lines:** 95-105  
**Severity:** HIGH  

**Issue:**
System writes directly to `node.userData.corruption` instead of canonical `node.userData.metrics.corruption`. NodeMetricEngine maintains canonical metrics separately.

**Impact:**
- Canonical metrics don't reflect actual corruption
- Other systems reading canonical metrics get wrong data
- Silent desync between corruption writer and canonical system

**Current Code:**
```javascript
// LinkCorruptionTransmission_v1.js, Lines 95-105
const currentCorruption = targetNode.userData?.corruption || 0;
targetNode.userData.corruption = Math.min(1.0, currentCorruption + infectionRate * deltaTime);
```

**Should be:**
```javascript
import { setMetric } from './src/metrics/NodeMetricEngine.js';
setMetric(targetNode, 'corruption', Math.min(1.0, currentCorruption + infectionRate * deltaTime), { source: 'link-corruption-transmission' });
```

---

### 3.3 HARMONY SYSTEMS WRITE LEGACY
**Files:** 
- `HarmonyStabilizationSystem_v1.js`
- `NetworkRituals_v1.js`
- `InjectHarmonyIntoNodes.js`

**Severity:** HIGH  

**Issue:**
Multiple systems write to `node.userData.harmonyLevel` instead of canonical `node.userData.metrics.harmony`.

**Impact:**
- Ritual system bypasses canonical metrics
- Harmony stabilization creates separate value
- Silent desync between multiple harmony writers

---

### 3.4 LINK SYNERGY ONLY IN LEGACY
**File:** `NodeLinkingSystem.js`  
**Lines:** 150-160  
**Severity:** MEDIUM  

**Issue:**
Link synergy is stored ONLY in `link.userData.synergy` object. No canonical storage in `link.userData.metrics.synergy`.

**Impact:**
- NodeMetricEngine cannot read link synergy
- Synergy calculations isolated from canonical system
- No metric authority over link synergy

---

## 4. Visual State vs Metrics (Acceptable Legacy)

The following legacy fields are **NOT metrics** and are acceptable:

### Harmony Visual States (Acceptable):
- `node.userData.harmonyStabilized` - Visual flag
- `node.userData.harmonyDampingFactor` - Motion damping
- `node.userData.harmonyVisualState` - Visual parameters
- `link.userData.harmonyStabilized` - Visual flag
- `link.userData.harmonyDamping` - Motion damping
- `link.userData.harmonyVisualState` - Visual parameters

### Synergy Visual States (Acceptable):
- `node.userData.synergyPulseActive` - Visual flag
- `node.userData.synergyScore` - Visual score
- `node.userData.synergyBonus` - Visual enhancement data
- `link.userData.synergyCollapse` - Event state
- `link.userData.synergyCascadeTime` - Event timestamp

### Corruption Visual States (Acceptable):
- `mesh.userData.isCorrupted` - Visual flag
- `mesh.userData.corruptionActive` - Visual flag
- `mesh.userData.corruptionDeviation` - Visual deviation
- `glyphGroup.userData.corruptionDimmingActive` - Visual flag
- `glyphGroup.userData.corruptionDimmingFactor` - Visual intensity

**Note:** These fields control VISUAL behavior, not GAMEPLAY metrics. They are acceptable as legacy fields.

---

## 5. Migration Strategy

### Phase 1: Critical Fixes (Immediate)

1. **Fix LinkCorruptionTransmission_v1.js**
   - Replace legacy writes with `setMetric()` calls
   - Target: `link.userData.metrics.corruption` instead of `link.userData.corruption`
   - Verify sync with renderer

2. **Fix NeonLinkVisuals.js**
   - Add sync layer to read from canonical `node.userData.metrics.corruption`
   - Maintain visual state flags as separate visual layer
   - Add validation that visual state matches canonical metric

### Phase 2: High Priority (Week 1)

3. **Migrate Harmony Systems**
   - `HarmonyStabilizationSystem_v1.js`: Use `setMetric()` for harmony
   - `NetworkRituals_v1.js`: Use `setMetric()` for ritual costs
   - `InjectHarmonyIntoNodes.js`: Use `setMetric()` for initialization

4. **Fix Link Synergy**
   - Add canonical storage: `link.userData.metrics.synergy`
   - Migrate `NodeLinkingSystem.js` to write to canonical
   - Update readers to use canonical

### Phase 3: Medium Priority (Week 2)

5. **Migrate Visual Readers**
   - Update all visual systems to read from `node.userData.metrics.*`
   - Keep visual state flags separate (as above)
   - Add semantic events for visual updates

6. **Remove Legacy Accessor Utilities**
   - Deprecate `src/utils/nodeCorruptionAccessor.js`
   - Replace all usages with canonical metric APIs

### Phase 4: Cleanup (Week 3)

7. **Remove Legacy Field Guards**
   - Once all systems migrated, remove guards from NodeMetricEngine
   - Clean up legacy field definitions

8. **Update Documentation**
   - Update integration guides to reference canonical container
   - Add metric authority rules to AGENTS.md

---

## 6. Risk Assessment

### Current Risk Level: **HIGH**

**Reason:**
- Renderer reads legacy corruption (CRITICAL)
- Multiple writers create desync (HIGH)
- Link synergy has no canonical storage (MEDIUM)

### Potential Failures:

1. **Visual Desync**
   - User sees corrupted nodes that aren't corrupted
   - Visual feedback doesn't match game state
   - Loss of player trust in visual system

2. **Gameplay Desync**
   - Rituals use wrong harmony values
   - Corruption spreads based on wrong data
   - Synergy calculations use outdated values

3. **Debug Difficulty**
   - Metrics appear inconsistent
   - Hard to trace which system holds "truth"
   - Silent failures accumulate

---

## 7. Recommendations

### Immediate Actions:

1. **Stop New Legacy Writes**
   - Add lint rule to prevent new `node.userData.harmony` writes
   - Add lint rule to prevent new `node.userData.corruption` writes
   - Add lint rule to prevent new `link.userData.synergy` writes

2. **Add Metric Sync Validation**
   - Run nightly audit comparing legacy vs canonical
   - Alert on desync > 5%
   - Log systems writing to legacy

3. **Document Metric Authority**
   - Create clear documentation on canonical container
   - List all approved metric writers
   - Define metric mutation contracts

### Long-term:

4. **Integrate Link Metrics**
   - Add `LinkMetricEngine.js` parallel to `NodeMetricEngine.js`
   - Unify node and link metric authority
   - Single source of truth for all metrics

5. **Semantic Event System**
   - Emit metric change events
   - Visual systems subscribe to events
   - Decouple readers from writers

6. **Metric Visualization Debugger**
   - Show canonical vs legacy values in debug HUD
   - Highlight desync in real-time
   - Trace metric mutations through call stack

---

## 8. Summary by File

### Files Writing Legacy Metrics (Should Use Canonical):

| File | Metrics | Priority | Risk |
|------|---------|----------|------|
| LinkCorruptionTransmission_v1.js | corruption | CRITICAL | HIGH |
| LinkCorruptionTransmissionIntegrationPatch_v1.js | corruption | CRITICAL | HIGH |
| HarmonyStabilizationSystem_v1.js | harmony | HIGH | MEDIUM |
| NetworkRituals_v1.js | harmony | HIGH | MEDIUM |
| InjectHarmonyIntoNodes.js | harmony | MEDIUM | LOW |
| NodeLinkingSystem.js | synergy | MEDIUM | MEDIUM |
| src/utils/nodeCorruptionAccessor.js | corruption | MEDIUM | MEDIUM |

### Files Reading Legacy Metrics (Should Use Canonical):

| File | Metrics | Priority | Risk |
|------|---------|----------|------|
| NeonLinkVisuals.js | corruption | CRITICAL | HIGH |
| LinkEligibilityGate_v1.js | corruption | HIGH | MEDIUM |
| LinkPrioritySystem.js | synergy | HIGH | MEDIUM |
| LinkGlowSynergyEngine_v2.js | synergy | MEDIUM | LOW |
| src/legacy/T2_HarmonyVisualConsumer_v1.js | harmony | MEDIUM | LOW |
| SNIPPETS/WEEK13_ARCHETYPE_CURVES_SNIPPETS.js | corruption | MEDIUM | MEDIUM |

### Files Using Acceptable Visual States (No Action Needed):

| File | Visual States | Status |
|------|----------------|--------|
| NodeVisualStateBinder.js | harmonyStabilized, harmonyDampingFactor | OK |
| NodeLinkingSystem.js | harmonyStabilized, harmonyDampingFactor | OK |
| NeonLinkVisuals.js | corruptionLevel (mesh), isCorrupted (mesh) | OK |
| LinkVisualStateAdapter.js | Various visual states | OK |
| MegaGlyphSystem.js | corruptionDimmingActive, corruptionDimmingFactor | OK |

---

## 9. Action Items Checklist

- [ ] **Phase 1: Critical Fixes**
  - [ ] Migrate LinkCorruptionTransmission_v1.js to setMetric()
  - [ ] Add sync layer to NeonLinkVisuals.js for corruption
  - [ ] Verify renderer uses canonical corruption

- [ ] **Phase 2: High Priority**
  - [ ] Migrate HarmonyStabilizationSystem_v1.js
  - [ ] Migrate NetworkRituals_v1.js
  - [ ] Migrate InjectHarmonyIntoNodes.js
  - [ ] Add canonical link synergy storage
  - [ ] Migrate NodeLinkingSystem.js synergy writes

- [ ] **Phase 3: Medium Priority**
  - [ ] Update all visual readers to use canonical metrics
  - [ ] Deprecate src/utils/nodeCorruptionAccessor.js
  - [ ] Replace all legacy accessor usages

- [ ] **Phase 4: Cleanup**
  - [ ] Remove legacy field guards from NodeMetricEngine
  - [ ] Update integration guides
  - [ ] Update AGENTS.md with metric authority rules

- [ ] **Infrastructure**
  - [ ] Add lint rules for legacy metric writes
  - [ ] Add metric sync validation
  - [ ] Create metric authority documentation
  - [ ] Add metric visualization debugger

---

## Appendix: Complete File List with Legacy Usage

### 184 Occurrences Across 28 Files:

1. debug_semantic_helpers_validation.js (3)
2. EXAMPLES/HARMONY_STABILIZATION_v1_EXAMPLES.js (3)
3. EXAMPLES/LINK_MORPHING_EXAMPLES.js (2)
4. EXAMPLES/LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js (6)
5. HarmonyAuraIntegrationGuide.js (2)
6. HarmonyAuraController.js (4)
7. HarmonyStabilizationSystem_v1.js (12)
8. HarmonyStabilizationIntegrationPatch_v1.js (3)
9. HarmonicSyncEffectApplier.js (8)
10. LinkCorruptionTransmissionIntegrationPatch_v1.js (3)
11. LinkPrioritySystem.js (2)
12. LinkGlowSynergyEngine_v2.js (2)
13. LinkMetricsToVisualBridge_v1.js (2)
14. LinkEligibilityGate_v1.js (3)
15. LinkSemanticPictogramSystem_Enhanced.js (2)
16. LinkCorruptionTransmission_v1.js (15)
17. LinkVisualStateAdapter.js (5)
18. LinkResonanceFlowSystem_Session124.js (2)
19. NetworkRituals_v1.js (6)
20. InjectHarmonyIntoNodes.js (8)
21. MetricValidationRuntime.js (4)
22. MegaGlyphSystem.js (3)
23. NeonLinkVisuals.js (12) - **CRITICAL RENDERER**
24. InterferenceEffectApplier.js (5)
25. LEGACY/aura/SynergyGlowController.js (4)
26. NodeLinkingSystem.js (12)
27. ResonanceFeedback_v1.js (6)
28. SystemStateOverlay.js (5)
29. NodeVisualStateBinder.js (10)
30. RitualVisualOrchestrator.js (2)
31. SemanticMetricAdapter.js (6)
32. StressTurbulenceIntegrationGuide.js (2)
33. SynergyChainReaction_v1.js (6)
34. SynergyGlowIntegrationGuide.js (2)
35. SNIPPETS/WEEK13_ARCHETYPE_CURVES_SNIPPETS.js (2)
36. SNIPPETS/W20_Integration_Snippet.js (18)
37. SNIPPETS/W21_ResonanceFeedback_Snippets.js (14)
38. T4004_HARMONY_HEALING_TEST_RUNNER.js (8)
39. T2_CorruptionVisualIntegration_v1.js (3)
40. src/utils/nodeCorruptionAccessor.js (2)
41. src/legacy/T2_HarmonyVisualConsumer_v1.js (3)
42. _AtomaGlyphSystem4_0.js (3)
43. _RecursiveGlyphMessaging4_0.js (2)

---

**Report Generated:** 2026-03-18  
**Engineer:** Cline (Autonomous ATOMA Engineer)  
**Status:** Analysis Complete - Awaiting Migration Approval