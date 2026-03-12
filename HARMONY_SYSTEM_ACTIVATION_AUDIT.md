# Harmony / Harmonic Systems Activation Audit  
Date: 2026-03-12  

## 1) Harmony-Related Files (code)
- CascadingHarmonicResonanceAmplification.js  
- CascadeResonanceWaveVisualization_Session146.js  
- CompositeGlyphResonanceFeedback.js  
- HarmonicAudioReactivitySystem_Session135.js  
- HarmonicCascadeAmplification_Session145.js  
- HarmonicHealingVisualSystem_Session134.js  
- HarmonicHubAuraIntegrationPatch_Session126.js  
- HarmonicHubAuraSystem_Session126.js  
- HarmonicHubCollapseController.js  
- HarmonicHubDebugger.js  
- HarmonicHubRecoveryController.js  
- HarmonicHubResilienceController.js  
- HarmonicInfluencePropagationIntegrationPatch_Session127.js  
- HarmonicInfluencePropagationSystem_Session127.js  
- HarmonicNodeResonanceHalos.js  
- HarmonicPhaseSynchronization_Session146.js  
- HarmonicRecoveryVisualSystem_Session138.js  
- HarmonicResonanceCoupling_v1.js  
- HarmonicResonanceFeedbackSystem.js  
- HarmonicSyncEffectApplier.js  
- HarmonicTopologyLearningSystem.js  
- HarmonyAuraController.js  
- HarmonyAuraIntegrationGuide.js  
- HarmonyAuraShaderMaterial.js  
- HarmonyDebugOverlay.js  
- HarmonyStabilizationIntegrationPatch_v1.js  
- HarmonyStabilizationSystem_v1.js  
- LinkResonanceFlowIntegrationPatch_Session124.js  
- LinkResonanceFlowSystem_Session124.js  
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
- T2_HarmonyVisualConsumer_v1.js  

## 2) Activation Table
| SYSTEM | FILE | TYPE | ACTIVE | SCHEDULER / CALLER | WRITES | READS |
| --- | --- | --- | --- | --- | --- | --- |
| HarmonyStabilizationSystem_v1 | HarmonyStabilizationSystem_v1.js | simulation | ACTIVE | FrameScheduler `simulation.harmonyStabilizationSystem` | `node.userData.harmonyLevel`, `link.userData.harmonyLevel` (gated) | `node.userData.metrics.*` |
| HarmonicResonanceCoupling_v1 | HarmonicResonanceCoupling_v1.js | simulation/visual | ACTIVE | FrameScheduler `harmonicResonanceCoupling` | – | `node.userData.harmony` |
| HarmonicHubAuraSystem_Session126 | HarmonicHubAuraSystem_Session126.js | visual | ACTIVE | FrameScheduler `harmonicHubAuraSystem` | – | `link/node harmony` |
| HarmonicInfluencePropagationSystem_Session127 | HarmonicInfluencePropagationSystem_Session127.js | visual/propagation | ACTIVE | FrameScheduler `harmonicInfluencePropagation` | – | `node.userData.harmony` |
| HarmonicCascadeAmplification_Session145 | HarmonicCascadeAmplification_Session145.js | simulation cascade | ACTIVE | FrameScheduler `harmonicCascadeAmplification` | – | `nodeDynamicMetrics.avgHarmony` |
| CascadingHarmonicResonanceAmplification | CascadingHarmonicResonanceAmplification.js | simulation | ACTIVE | invoked inside cascade amplifier tick | – | `avgHarmony` |
| CascadeResonanceWaveVisualization | CascadeResonanceWaveVisualization_Session146.js | visual/shader | ACTIVE | FrameScheduler `visual.cascadeResonanceWave` | – | `linkResonance` (indirect harmony) |
| ResonanceCascadeVisualization | ResonanceCascadeVisualization_Session117B.js | visual | ACTIVE | FrameScheduler `visual.resonanceCascade` | – | `resonance intensity` |
| ResonanceRuptureVisualSystem | ResonanceRuptureVisualSystem_Session133.js | visual | ACTIVE | main update block (visual heavy tick) | – | `link/node metrics` |
| HarmonicRecoveryVisualSystem | HarmonicRecoveryVisualSystem_Session138.js | visual | ACTIVE | main update block | – | `healingParticles metrics.harmony` |
| HarmonicHealingVisualSystem | HarmonicHealingVisualSystem_Session134.js | visual/particle | ACTIVE | main update block | – | `node/userData harmonyLevel` |
| HarmonicAudioReactivitySystem | HarmonicAudioReactivitySystem_Session135.js | audio/controller | ACTIVE | main update block | – | `node.userData.harmonyLevel` |
| HarmonicResonanceFeedbackSystem | HarmonicResonanceFeedbackSystem.js | visual | ACTIVE | FrameScheduler `visual.harmonicResonanceFeedback` | – | `scene harmony fields` |
| ResonanceEchoTrailSystem | ResonanceEchoTrailSystem.js | visual/particle | ACTIVE | FrameScheduler `visual.resonanceEchoTrails` | – | `composite glyph movement` |
| HarmonicTopologyLearningSystem | HarmonicTopologyLearningSystem.js | visual/analysis | ACTIVE | FrameScheduler `background.harmonicTopology` | – | `scene nodes harmony` |
| ProceduralHarmonicGlyphGenerator | ProceduralHarmonicGlyphGenerator.js | visual/procedural | ACTIVE | FrameScheduler `background.proceduralGlyphGenerator` | – | `metrics.harmony` |
| RegionalHarmonicCycleController | RegionalHarmonicCycleController.js | controller/animation | ACTIVE | FrameScheduler `background.harmonicCycleController` | – | `global harmony (passed from main)` |
| CompositeGlyphResonanceFeedback | CompositeGlyphResonanceFeedback.js | visual | ACTIVE | FrameScheduler `visual.compositeResonanceFeedback` | – | `glyph resonance (harmony-derived)` |
| SynergyResonanceShaderPack_v1 | SynergyResonanceShaderPack_v1.js | shader/visual | ACTIVE | FrameScheduler `visual.synergyResonanceShaderPack` | – | `metrics.harmony` |
| ResonanceFeedback_v1 | ResonanceFeedback_v1.js | visual | ACTIVE | main update block | – | `metrics.harmony` |
| HarmonyDebugOverlay | HarmonyDebugOverlay.js | visual overlay | ACTIVE (toggle) | FrameScheduler `visual.harmonyDebugOverlay` when enabled | – | `metrics.harmonyFlow` |
| NodeHarmonicManager | NodeHarmonicManager.js | visual/controller | ACTIVE | called each frame by LinkRendererConduit.update | – | `metrics.harmony` (from link metrics) |
| NodeHarmonicSyncController | NodeHarmonicSyncController.js | controller | ACTIVE (via NodeHarmonicManager) | driven per-node inside NodeHarmonicManager | – | `harmony` (param) |
| HarmonicSyncEffectApplier | HarmonicSyncEffectApplier.js | visual material mutator | ACTIVE (via NodeHarmonicManager) | per-frame from NodeHarmonicManager | `userData.harmonySync*` (visual flags) | `syncStrength` |
| RegionalHarmonyZones | RegionalHarmonyZones.js | visual overlay | ACTIVE (SystemStateOverlay) | updated via SystemStateOverlay tick | – | `node.userData.harmony`, `metrics.harmony` |
| HarmonyAuraShaderMaterial | HarmonyAuraShaderMaterial.js | shader utility | ACTIVE (material factory) | used by VisualTemplateResolver (no tick) | – | – |
| HarmonyAuraController | HarmonyAuraController.js | visual/controller | DORMANT | no runtime imports | – | – |
| HarmonyAuraIntegrationGuide | HarmonyAuraIntegrationGuide.js | doc/guide | DORMANT | – | – |
| HarmonyStabilizationIntegrationPatch_v1 | HarmonyStabilizationIntegrationPatch_v1.js | patch | DORMANT | not wired | – | – |
| HarmonicHubResilienceController | HarmonicHubResilienceController.js | simulation | DORMANT | only examples/docs | – | `recoveryController` data |
| HarmonicHubRecoveryController | HarmonicHubRecoveryController.js | simulation | DORMANT | only examples/docs | – | `hub metrics` |
| HarmonicHubCollapseController | HarmonicHubCollapseController.js | simulation | DORMANT | only docs | – | – |
| HarmonicHubDebugger | HarmonicHubDebugger.js | tooling | DORMANT | not imported | – | – |
| HarmonicInfluencePropagationIntegrationPatch_Session127 | HarmonicInfluencePropagationIntegrationPatch_Session127.js | patch | DORMANT | not applied | – | – |
| HarmonicHubAuraIntegrationPatch_Session126 | HarmonicHubAuraIntegrationPatch_Session126.js | patch | DORMANT | not applied | – | – |
| HarmonicNodeResonanceHalos | HarmonicNodeResonanceHalos.js | visual | DORMANT | not referenced in main | – | `metrics.harmony` |
| HarmonicPhaseSynchronization_Session146 | HarmonicPhaseSynchronization_Session146.js | simulation | DORMANT | no imports | – | – |
| LinkResonanceFlowSystem_Session124 | LinkResonanceFlowSystem_Session124.js | simulation | ACTIVE | FrameScheduler `linkResonanceFlowSystem` | – | `link metrics.harmony` |
| LinkResonanceFlowIntegrationPatch_Session124 | LinkResonanceFlowIntegrationPatch_Session124.js | patch | DORMANT | not applied | – | – |
| T2_HarmonyVisualConsumer_v1 | T2_HarmonyVisualConsumer_v1.js | visual | DISABLED | commented in main.js | reads `node.userData.harmonyLevel` | – |

## 3) Harmony Data Flow (runtime)
metrics.harmony (CoreMetricsCalculator)  
→ HarmonyStabilizationSystem_v1 (writes `node.userData.harmonyLevel`, `link.userData.harmonyLevel` when lock open)  
→ LinkRendererConduit `_readLinkMetrics()` → per-link `metrics.harmony`  
→ NodeHarmonicManager → NodeHarmonicSyncController → HarmonicSyncEffectApplier (link material sync)  
→ Visual stack: HarmonicResonanceCoupling → HarmonicHubAuraSystem → HarmonicInfluencePropagation → HarmonicCascadeAmplification / CascadeResonanceWave / ResonanceCascadeVisualization → ResonanceEchoTrailSystem / HarmonicResonanceFeedbackSystem → SynergyResonanceShaderPack / ResonanceFeedback_v1 / CompositeGlyphResonanceFeedback → particles/shaders (HarmonicHealingVisualSystem, HarmonicAudioReactivitySystem, RegionalHarmonyZones).  

## 4) Highlights
- ORPHAN SYSTEMS: HarmonyAuraController, HarmonyAuraIntegrationGuide, HarmonyStabilizationIntegrationPatch_v1, HarmonicHubResilienceController, HarmonicHubRecoveryController, HarmonicHubCollapseController, HarmonicHubDebugger, HarmonicNodeResonanceHalos, HarmonicPhaseSynchronization_Session146, T2_HarmonyVisualConsumer_v1 (explicitly disabled).  
- DUPLICATE WRITERS: HarmonyStabilizationSystem_v1 writes `node.userData.harmonyLevel`/`link.userData.harmonyLevel`; NetworkRituals_v1 also mutates `node.userData.harmonyLevel` (non-harmonic system) → potential contention if lock lifted.  
- SHADOW METRICS: Several active systems still read legacy `node.userData.harmony` (HarmonicResonanceCoupling_v1, HarmonicInfluencePropagationSystem, RegionalHarmonyZones) instead of stabilized `node.userData.harmonyLevel`, risking divergence.  

## 5) Notes
- FrameScheduler keys for harmonic group: `harmonicResonanceCoupling`, `harmonicHubAuraSystem`, `harmonicInfluencePropagation`, `harmonicCascadeAmplification`, `linkResonanceFlowSystem`, `visual.harmonicResonanceFeedback`, `visual.resonanceEchoTrails`, `visual.cascadeResonanceWave`, `visual.resonanceCascade`, `simulation.harmonyStabilizationSystem`, plus LinkRendererConduit-driven NodeHarmonicManager chain.  
- HarmonyDebugOverlay remains off by default; enable via `ATOMA_FLAGS.debug.harmonyOverlay`.  
