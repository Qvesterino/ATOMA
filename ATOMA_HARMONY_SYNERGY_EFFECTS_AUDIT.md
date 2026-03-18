# ATOMA HARMONY & SYNERGY EFFECTS AUDIT

**Date:** 2026-03-18  
**Purpose:** Map all harmony/synergy effects, identify active systems, dead code, and never-run effects

---

## EXECUTIVE SUMMARY

| Category | Active | Dead | Never-Run | Total |
|----------|--------|------|-----------|-------|
| Harmony Systems | 24 | 7 | 0 | 31 |
| Synergy Systems | 2 | 0 | 1 | 3 |
| Aura Systems | 3 | 4 | 0 | 7 |
| Link Effect Systems | 2 | 1 | 0 | 3 |
| **TOTAL** | **31** | **12** | **1** | **44** |

**Key Findings:**
- 70% of systems are actively wired and running
- 27% are dead/unused code
- 2% explicitly disabled
- Multiple patch files never applied to production
- Strong data flow from CoreMetricsCalculator through visual stack

---

## 1. ACTIVE SYSTEMS (31)

### 1.1 Harmony Simulation Systems (6)

| System | File | Scheduler/Caller | Reads | Writes | Notes |
|--------|------|------------------|-------|--------|-------|
| HarmonyStabilizationSystem_v1 | HarmonyStabilizationSystem_v1.js | `simulation.harmonyStabilizationSystem` | `node.userData.metrics.*` | `node.userData.harmonyLevel`, `link.userData.harmonyLevel` | Primary harmony writer (gated) |
| HarmonicCascadeAmplification_Session145 | HarmonicCascadeAmplification_Session145.js | `harmonicCascadeAmplification` | `nodeDynamicMetrics.avgHarmony` | – | Cascade effect propagator |
| CascadingHarmonicResonanceAmplification | CascadingHarmonicResonanceAmplification.js | invoked inside cascade amplifier | `avgHarmony` | – | Amplifies resonance through network |
| HarmonicPhaseSynchronization_Session146 | HarmonicPhaseSynchronization_Session146.js | `harmonicPhaseSynchronization` | `cascadeSystem.getProximityPairs()` | `hub.harmonicPhase` | Phase alignment system |
| HarmonicTopologyLearningSystem | HarmonicTopologyLearningSystem.js | `background.harmonicTopology` | `scene nodes harmony` | – | Topology analysis |
| RegionalHarmonicCycleController | RegionalHarmonicCycleController.js | `background.harmonicCycleController` | `global harmony (passed from main)` | – | Cyclic harmonic patterns |

### 1.2 Harmony Visual Systems (18)

| System | File | Scheduler/Caller | Reads | Notes |
|--------|------|------------------|-------|-------|
| HarmonicResonanceCoupling_v1 | HarmonicResonanceCoupling_v1.js | `harmonicResonanceCoupling` | `node.userData.harmony` | Visual coupling renderer |
| HarmonicHubAuraSystem_Session126 | HarmonicHubAuraSystem_Session126.js | `harmonicHubAuraSystem` | `link/node harmony` | Hub aura visualization |
| HarmonicInfluencePropagationSystem_Session127 | HarmonicInfluencePropagationSystem_Session127.js | `harmonicInfluencePropagation` | `node.userData.harmony` | Propagation visualizer |
| CascadeResonanceWaveVisualization_Session146 | CascadeResonanceWaveVisualization_Session146.js | `visual.cascadeResonanceWave` | `linkResonance` (indirect) | Wave shader effect |
| ResonanceCascadeVisualization_Session117B | ResonanceCascadeVisualization_Session117B.js | `visual.resonanceCascade` | `resonance intensity` | Cascade visualization |
| ResonanceRuptureVisualSystem_Session133 | ResonanceRuptureVisualSystem_Session133.js | main update block | `link/node metrics` | Rupture effect visualizer |
| HarmonicRecoveryVisualSystem_Session138 | HarmonicRecoveryVisualSystem_Session138.js | main update block | `healingParticles metrics.harmony` | Recovery effect visualizer |
| HarmonicHealingVisualSystem_Session134 | HarmonicHealingVisualSystem_Session134.js | main update block | `node/userData harmonyLevel` | Healing particle system |
| HarmonicAudioReactivitySystem_Session135 | HarmonicAudioReactivitySystem_Session135.js | main update block | `node.userData.harmonyLevel` | Audio-visual reactivity |
| HarmonicResonanceFeedbackSystem | HarmonicResonanceFeedbackSystem.js | `visual.harmonicResonanceFeedback` | `scene harmony fields` | Resonance feedback visualizer |
| ResonanceEchoTrailSystem | ResonanceEchoTrailSystem.js | `visual.resonanceEchoTrails` | `composite glyph movement` | Echo trail renderer |
| ProceduralHarmonicGlyphGenerator | ProceduralHarmonicGlyphGenerator.js | `background.proceduralGlyphGenerator` | `metrics.harmony` | Procedural glyph generation |
| RegionalHarmonicCycleController | RegionalHarmonicCycleController.js | `background.harmonicCycleController` | `global harmony` | Cycle animation controller |
| CompositeGlyphResonanceFeedback | CompositeGlyphResonanceFeedback.js | `visual.compositeResonanceFeedback` | `glyph resonance (harmony-derived)` | Composite feedback renderer |
| SynergyResonanceShaderPack_v1 | SynergyResonanceShaderPack_v1.js | `visual.synergyResonanceShaderPack` | `metrics.harmony` | Shader pack for synergy |
| ResonanceFeedback_v1 | ResonanceFeedback_v1.js | main update block | `metrics.harmony` | Basic resonance feedback |
| HarmonyDebugOverlay | HarmonyDebugOverlay.js | `visual.harmonyDebugOverlay` (toggle) | `metrics.harmonyFlow` | Debug overlay (off by default) |
| HarmonicNodeResonanceHalos | HarmonicNodeResonanceHalos.js | `harmonicNodeResonanceHalos` | `hubSystemData`, `node.userData.metrics.harmony` | Node halo renderer |

### 1.3 Node Harmonic Management (3)

| System | File | Caller | Notes |
|--------|------|--------|-------|
| NodeHarmonicManager | NodeHarmonicManager.js | LinkRendererConduit.update | Per-frame harmonic manager |
| NodeHarmonicSyncController | NodeHarmonicSyncController.js | NodeHarmonicManager | Driven per-node |
| HarmonicSyncEffectApplier | HarmonicSyncEffectApplier.js | NodeHarmonicManager | Visual material mutator |

### 1.4 Link Resonance Systems (2)

| System | File | Scheduler/Caller | Notes |
|--------|------|------------------|-------|
| LinkResonanceFlowSystem_Session124 | LinkResonanceFlowSystem_Session124.js | `linkResonanceFlowSystem` | Directional pulse flows |
| RegionalHarmonyZones | RegionalHarmonyZones.js | SystemStateOverlay tick | Visual overlay for zones |

### 1.5 Aura Systems (3)

| System | File | Status | Notes |
|--------|------|--------|-------|
| ArchetypeAuraEnhancement_v1 | ArchetypeAuraEnhancement_v1.js | ACTIVE | Personality-driven GPU visual layer |
| HarmonyAuraShaderMaterial | HarmonyAuraShaderMaterial.js | ACTIVE | Material factory (no tick) |
| AuraModulationIntegration_v1 | AuraModulationIntegration_v1.js | ACTIVE | Event-to-aura integration |

### 1.6 Synergy Computation (2)

| System | File | Status | Notes |
|--------|------|--------|-------|
| ComputeSynergyScore2_0 | ComputeSynergyScore2_0.js | ACTIVE | Production-ready hybrid scoring |
| ComputeSynergyScore2_1 | ComputeSynergyScore2_1.js | ACTIVE | Phase 3b upgrade with visual metrics |

---

## 2. DEAD SYSTEMS (12)

### 2.1 Harmony Dead Code (7)

| System | File | Reason |
|--------|------|--------|
| HarmonyAuraController | HarmonyAuraController.js | No runtime imports |
| HarmonyAuraIntegrationGuide | HarmonyAuraIntegrationGuide.js | Documentation only |
| HarmonyStabilizationIntegrationPatch_v1 | HarmonyStabilizationIntegrationPatch_v1.js | Not wired |
| HarmonicHubResilienceController | HarmonicHubResilienceController.js | Only examples/docs |
| HarmonicHubRecoveryController | HarmonicHubRecoveryController.js | Only examples/docs |
| HarmonicHubCollapseController | HarmonicHubCollapseController.js | Only docs |
| HarmonicHubDebugger | HarmonicHubDebugger.js | Not imported |

### 2.2 Aura Dead Code (4)

| System | File | Reason |
|--------|------|--------|
| AuraBaselineInvalidationFix | AuraBaselineInvalidationFix.js | Not wired |
| AuraRefactorValidationHelper | AuraRefactorValidationHelper.js | Validation tool only |
| FresnelAuraIntegrationExample | FresnelAuraIntegrationExample.js | Example/demo |
| FresnelAuraIntegrationPatch | FresnelAuraIntegrationPatch.js | Patch not applied |

### 2.3 Link Effect Dead Code (1)

| System | File | Reason |
|--------|------|--------|
| FresnelRimLightAuraShader | FresnelRimLightAuraShader.js | Not integrated |

---

## 3. NEVER-RUN SYSTEMS (1)

| System | File | Reason |
|--------|------|--------|
| T2_HarmonyVisualConsumer_v1 | T2_HarmonyVisualConsumer_v1.js | Explicitly disabled in main.js |

---

## 4. NEVER-APPLIED PATCHES (8)

These patches exist but were never integrated into the production system:

| Patch | File | Target System |
|-------|------|---------------|
| HarmonyStabilizationIntegrationPatch_v1 | HarmonyStabilizationIntegrationPatch_v1.js | HarmonyStabilizationSystem |
| HarmonicInfluencePropagationIntegrationPatch_Session127 | HarmonicInfluencePropagationIntegrationPatch_Session127.js | HarmonicInfluencePropagationSystem |
| HarmonicHubAuraIntegrationPatch_Session126 | HarmonicHubAuraIntegrationPatch_Session126.js | HarmonicHubAuraSystem |
| LinkResonanceFlowIntegrationPatch_Session124 | LinkResonanceFlowIntegrationPatch_Session124.js | LinkResonanceFlowSystem |
| EchoRippleIntegrationPatch_Session125 | EchoRippleIntegrationPatch_Session125.js | Echo ripple system |
| AuraBaselineInvalidationFix | AuraBaselineInvalidationFix.js | Aura systems |
| FresnelAuraIntegrationPatch | FresnelAuraIntegrationPatch.js | Fresnel aura |
| CorruptionDesaturationIntegrationPatch | CorruptionDesaturationIntegrationPatch.js | Corruption visuals |

---

## 5. HARMONY DATA FLOW

```
CoreMetricsCalculator (computes metrics.harmony)
    ↓
HarmonyStabilizationSystem_v1 (writes node.userData.harmonyLevel, link.userData.harmonyLevel)
    ↓
LinkRendererConduit._readLinkMetrics() → per-link metrics.harmony
    ↓
NodeHarmonicManager → NodeHarmonicSyncController → HarmonicSyncEffectApplier (link material sync)
    ↓
Visual Stack:
    ├─ HarmonicResonanceCoupling
    ├─ HarmonicHubAuraSystem
    ├─ HarmonicInfluencePropagation
    ├─ HarmonicCascadeAmplification / CascadeResonanceWave / ResonanceCascadeVisualization
    ├─ ResonanceEchoTrailSystem / HarmonicResonanceFeedbackSystem
    ├─ SynergyResonanceShaderPack / ResonanceFeedback_v1 / CompositeGlyphResonanceFeedback
    └─ Particles/Shaders (HarmonicHealingVisualSystem, HarmonicAudioReactivitySystem, RegionalHarmonyZones)
```

---

## 6. CRITICAL ISSUES

### 6.1 Duplicate Writers (Contention Risk)
- **HarmonyStabilizationSystem_v1** writes `node.userData.harmonyLevel` and `link.userData.harmonyLevel`
- **NetworkRituals_v1** also mutates `node.userData.harmonyLevel` (non-harmonic system)
- **Risk:** Potential data corruption if lock is lifted

### 6.2 Shadow Metrics (Divergence Risk)
Several active systems read legacy `node.userData.harmony` instead of stabilized `node.userData.harmonyLevel`:
- HarmonicResonanceCoupling_v1
- HarmonicInfluencePropagationSystem
- RegionalHarmonyZones

**Risk:** These systems may read stale or divergent data

### 6.3 Orphan Systems
7 harmony systems and 4 aura systems exist but are never initialized or called, consuming no resources but adding codebase complexity.

---

## 7. SYNERGY COMPUTATION ARCHITECTURE

### ComputeSynergyScore2_0
- **Formula:** Weighted hybrid scoring (35% type, 25% priority, 20% traffic, 10% decay, 10% topology)
- **Inputs:** Link correlation data, priority history, traffic magnitude, decay state, topology
- **Output:** Score (0-1), tier (low/medium/high/critical), component breakdown
- **Visual Triggers:** Aura pulse, highway intensity, beam glow boost (currently disabled)

### ComputeSynergyScore2_1 (Phase 3b Upgrade)
- **Backward Compatible:** Falls back to 2.0 if visualMetrics unavailable
- **Visual Metrics Integration:** Reads `node.userData.visualMetrics` for cleaner values
- **Inputs:** `harmonyNorm`, `stabilityNorm`, `corruptionNorm`, `energyNorm`
- **Enhancement Hooks:** Placeholders for Week 2+ features (currently disabled)

---

## 8. FRAME SCHEDULER INTEGRATION

### Harmonic/Harmony System Keys
```
harmonicResonanceCoupling
harmonicHubAuraSystem
harmonicInfluencePropagation
harmonicCascadeAmplification
harmonicNodeResonanceHalos
harmonicPhaseSynchronization
linkResonanceFlowSystem
simulation.harmonyStabilizationSystem
visual.harmonicResonanceFeedback
visual.resonanceEchoTrails
visual.cascadeResonanceWave
visual.resonanceCascade
visual.synergyResonanceShaderPack
background.harmonicTopology
background.proceduralGlyphGenerator
background.harmonicCycleController
```

### Layer Distribution
- **Realtime (60 Hz):** Core rendering, input
- **Visual (30 Hz):** Most harmonic/harmony visual systems
- **Simulation (10 Hz):** HarmonyStabilizationSystem, cascade effects
- **Background (2 Hz):** Topology learning, glyph generation, cycle control

---

## 9. RECOMMENDATIONS

### 9.1 Cleanup Dead Code (Low Risk)
Remove or archive these files to reduce codebase complexity:
- All patch files that were never applied (8 files)
- Documentation/guide files masquerading as code (HarmonyAuraIntegrationGuide)
- Debug tools not in use (HarmonicHubDebugger)
- Example/demo files (FresnelAuraIntegrationExample)

### 9.2 Fix Shadow Metrics (Medium Risk)
Update these systems to read from `node.userData.harmonyLevel`:
- HarmonicResonanceCoupling_v1
- HarmonicInfluencePropagationSystem
- RegionalHarmonyZones

### 9.3 Resolve Duplicate Writers (High Risk)
Investigate and coordinate between:
- HarmonyStabilizationSystem_v1
- NetworkRituals_v1

**Options:**
1. Consolidate to single writer
2. Add explicit coordination layer
3. Clarify data ownership boundaries

### 9.4 Enable Visual Triggers (Feature Enhancement)
Re-enable synergy visual triggers in ComputeSynergyScore2_0:
- Aura pulse based on tier
- Highway intensity modulation
- Beam glow boost

### 9.5 Documentation
Document the decision-making process for:
- Which patches were intentionally not applied
- Why certain systems remain dormant
- Data flow invariants for harmony metrics

---

## 10. VERIFICATION CHECKLIST

- [x] All harmony/harmonic systems mapped
- [x] All synergy computation systems mapped
- [x] All aura systems mapped
- [x] All link effect systems mapped
- [x] Activation status verified via FrameScheduler
- [x] Data flow traced from source to sinks
- [x] Dead code identified
- [x] Never-applied patches catalogued
- [x] Critical issues documented
- [ ] Cleanup recommendations implemented (pending approval)

---

## APPENDIX: FILE INVENTORY

### Harmony/Harmonic Files (31)
- CascadingHarmonicResonanceAmplification.js
- CascadeResonanceWaveVisualization_Session146.js
- CompositeGlyphResonanceFeedback.js
- HarmonicAudioReactivitySystem_Session135.js
- HarmonicCascadeAmplification_Session145.js
- HarmonicHealingVisualSystem_Session134.js
- HarmonicHubAuraIntegrationPatch_Session126.js (dead)
- HarmonicHubAuraSystem_Session126.js
- HarmonicHubCollapseController.js (dead)
- HarmonicHubDebugger.js (dead)
- HarmonicHubRecoveryController.js (dead)
- HarmonicHubResilienceController.js (dead)
- HarmonicInfluencePropagationIntegrationPatch_Session127.js (dead)
- HarmonicInfluencePropagationSystem_Session127.js
- HarmonicNodeResonanceHalos.js
- HarmonicPhaseSynchronization_Session146.js
- HarmonicRecoveryVisualSystem_Session138.js
- HarmonicResonanceCoupling_v1.js
- HarmonicResonanceFeedbackSystem.js
- HarmonicSyncEffectApplier.js
- HarmonicTopologyLearningSystem.js
- HarmonyAuraController.js (dead)
- HarmonyAuraIntegrationGuide.js (dead)
- HarmonyAuraShaderMaterial.js
- HarmonyDebugOverlay.js
- HarmonyStabilizationIntegrationPatch_v1.js (dead)
- HarmonyStabilizationSystem_v1.js
- NodeHarmonicManager.js
- NodeHarmonicSyncController.js
- ProceduralHarmonicGlyphGenerator.js
- RegionalHarmonicCycleController.js
- RegionalHarmonyZones.js
- ResonanceCascadeVisualization_Session117B.js
- ResonanceEchoTrailSystem.js
- ResonanceFeedback_v1.js
- ResonanceRuptureVisualSystem_Session133.js
- SynergyResonanceShaderPack_v1.js
- T2_HarmonyVisualConsumer_v1.js (disabled)

### Synergy Files (3)
- ComputeSynergyScore2_0.js
- ComputeSynergyScore2_1.js

### Aura Files (7)
- ArchetypeAuraEnhancement_v1.js
- AuraBaselineInvalidationFix.js (dead)
- AuraModulationIntegration_v1.js
- AuraRefactorValidationHelper.js (dead)
- FresnelAuraIntegrationExample.js (dead)
- FresnelAuraIntegrationPatch.js (dead)
- FresnelRimLightAuraShader.js (dead)
- HarmonyAuraShaderMaterial.js

### Link Effect Files (3)
- EchoRippleIntegrationPatch_Session125.js (dead)
- LinkResonanceFlowIntegrationPatch_Session124.js (dead)
- LinkResonanceFlowSystem_Session124.js

---

**Audit Complete**  
**Total Systems Analyzed: 44**  
**Active: 31 (70%)**  
**Dead/Unused: 12 (27%)**  
**Explicitly Disabled: 1 (2%)**