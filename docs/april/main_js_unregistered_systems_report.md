# Main.js Static Audit Report
## Systems Imported + Initialized but NOT Registered in FrameScheduler

**Date:** 2026-03-29  
**Audit Type:** Static Analysis of main.js

---

## Summary
This report identifies systems in main.js that are:
1. ✅ Imported (via `import` statements)
2. ✅ Initialized (instantiated with `new`)
3. ❌ NOT registered in FrameScheduler

These systems may be running without proper frame scheduling, which could lead to:
- Uncontrolled update frequencies
- Performance inconsistencies
- Difficulties in debugging and optimization

---

## Critical Infrastructure Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| SessionVariantEngine | 241 | SessionVariantEngine | Manages session configuration |
| FrameClock | 3363 | FrameClock | Timing system |
| RenderCostProfile | 3369 | RenderCostProfile | Performance monitoring |
| SemanticEventBus | 3379 | SemanticEventBus | Event communication |

---

## Audio Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| AtomaAudioSystem | 4368 | AtomaAudioSystem | Main audio system |
| AtomaAudioModulation | 4380, 4471 | AtomaAudioModulation | Audio modulation |

---

## Core Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| SafeWorldResetFix1_0 | 4822 | SafeWorldResetFix1_0 | World reset handler |
| SafeMetricsFX1_1 | 4834 | SafeMetricsFX1_1 | Metrics visual effects |
| NodePersonalitySystem2_0 | 4837 | NodePersonalitySystem2_0 | Node personality system |
| AtomaLanguageEngine2_0 | 4959 | AtomaLanguageEngine2_0 | Language engine |
| AtomaDebugHUD_1_0 | 5030 | AtomaDebugHUD_1_0 | Debug HUD |

---

## Environment & World Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| EnvironmentDomainController | 5041 | EnvironmentDomainController | Environment control |
| WorldSelectorHUD | 5478 | WorldSelectorHUD | World selection UI |
| DistanceLODController | 5710 | DistanceLODController | LOD management |

---

## Wave & Cascade Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| WaveInterferenceEngine_v1 | 5759 | WaveInterferenceEngine_v1 | Wave interference |
| CascadeToWaveBridge_v1 | 5881 | CascadeToWaveBridge_v1 | Cascade-wave bridge |
| WaveShaderBridge_v1 | 5922 | WaveShaderBridge_v1 | Wave shader bridge |
| WaveShaderMaterialPatch_v1 | 5934 | WaveShaderMaterialPatch_v1 | Wave shader patch |
| WaveTravelShaderPack_v1 | 5944 | WaveTravelShaderPack_v1 | Wave travel shaders |
| CascadingHarmonicResonanceAmplification | 3688 | CascadingHarmonicResonanceAmplification | Harmonic resonance |

---

## Debug & Overlay Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| HarmonyDebugOverlay | 5973 | HarmonyDebugOverlay | Harmony debugging |
| NodeInspectOverlay1_0 | 5984 | NodeInspectOverlay1_0 | Node inspection |
| NodeMicroEvents | 5993 | NodeMicroEvents | Micro event tracking |

---

## Personality & Ritual Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| WorldPersonalityController | 6005 | WorldPersonalityController | World personality |
| MythicRitualController | 6013 | MythicRitualController | Ritual control |
| MythicSeedGlyph | 6023 | MythicSeedGlyph | Seed glyph system |
| LegacyGlyphCleanup | 6032 | LegacyGlyphCleanup | Glyph cleanup |

---

## Glyph Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| AtomaGlyphSystem4_0 | 6050 | AtomaGlyphSystem4_0 | Glyph system v4 |
| GlyphLayer4_MultiFusion | 6059, 6855 | GlyphLayer4_MultiFusion | Multi-fusion glyphs |
| GlyphPurityMode5_1 | 6081 | GlyphPurityMode5_1 | Glyph purity mode |
| AdaptiveGlyphRendering1_0 | 6089 | AdaptiveGlyphRendering1_0 | Adaptive rendering |
| LinkedGlyphSynchronization1_0 | 6095 | LinkedGlyphSynchronization1_0 | Glyph sync |

---

## Scene & Environment Objects

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| PlayerController | 6375 | PlayerController | Player control |
| FirstPersonCameraController | 6385 | FirstPersonCameraController | Camera control |

---

## World & Chamber Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| World | 6994 | World | World container |
| EnvironmentDomainController | 6932 | EnvironmentDomainController | Environment domain (second instance) |
| SigmaRiftChamber | 6960 | SigmaRiftChamber | Rift chamber |
| DreamDesert | 6967 | DreamDesert | Desert environment |
| QuantumIsland | 6974 | QuantumIsland | Quantum environment |
| FractalValley | 6981 | FractalValley | Valley environment |
| MemoryLane | 6988 | MemoryLane | Memory environment |

---

## Core Systems (AINodes & Linking)

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| AINodes | 7104 | AINodes | Core AI nodes system |
| SimulationEffectOrchestrator | 7190 | SimulationEffectOrchestrator | Effect orchestration |
| NodeLinkingSystem | 7194 | NodeLinkingSystem | Linking system |

---

## Multi-network & Corruption Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| LinkCorruptionTransmission_v1 | 7494, 8644 | LinkCorruptionTransmission_v1 | Corruption transmission |
| PHASE5_MultiNetworkManager | 7586 | PHASE5_MultiNetworkManager | Multi-network manager |
| PHASE5_CorruptionBridge | 7594 | PHASE5_CorruptionBridge | Corruption bridge |
| CorruptionVisualFX_v1 | 7599 | CorruptionVisualFX_v1 | Corruption visuals |

---

## VFX & Particle Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| VFXRuntimeLoader | 7630 | VFXRuntimeLoader | VFX loader |
| NodeLinkedAuraSystem | 7899 | NodeLinkedAuraSystem | Node aura system |
| CorruptionDrivenAuraDesaturationSystem | 7905 | CorruptionDrivenAuraDesaturationSystem | Aura desaturation |
| LinkHistoryTracker1_0 | 7920 | LinkHistoryTracker1_0 | Link history |
| LinkCorrelationEngine1_0 | 7935 | LinkCorrelationEngine1_0 | Link correlation |

---

## Link Intelligence Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| DynamicLinkColorSystem | 7990 | DynamicLinkColorSystem | Dynamic link colors |
| SynergyCascadeVisualizer | 8030 | SynergyCascadeVisualizer | Synergy visualization |
| CoreMaterialMutationDetector | 8186 | CoreMaterialMutationDetector | Material mutation |
| CoreMaterialMutationTestSuite | 8195 | CoreMaterialMutationTestSuite | Material testing |
| LinkRecommendationAI1_0 | 8242 | LinkRecommendationAI1_0 | AI recommendations |

---

## Link Priority & Quality Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| PriorityHistoryEngine1_0 | 8257 | PriorityHistoryEngine1_0 | Priority history |
| LinkPriorityDecayEngine | 8274 | LinkPriorityDecayEngine | Priority decay |
| LinkAutomationEngine1_0 | 8308 | LinkAutomationEngine1_0 | Link automation |
| LinkQualityPredictor1_0 | 8322 | LinkQualityPredictor1_0 | Quality prediction |
| LinkQualityCalculator | 8392 | LinkQualityCalculator | Quality calculation |
| LinkQualityFeedbackLoop1_0 | 8423 | LinkQualityFeedbackLoop1_0 | Quality feedback |

---

## Link Degradation & Cascade Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| LinkDegradationSystem | 8429 | LinkDegradationSystem | Link degradation |
| LinkCollapseSystem | 8461 | LinkCollapseSystem | Link collapse |
| ParticleEmissionScaler | 8491 | ParticleEmissionScaler | Particle scaling |
| LinkSemanticMetricsBridge_v1 | 8533 | LinkSemanticMetricsBridge_v1 | Semantic metrics |
| LinkCascadeInfectionSystem | 8542 | LinkCascadeInfectionSystem | Cascade infection |
| SemanticActivityFilter_v1 | 8553 | SemanticActivityFilter_v1 | Activity filtering |
| StressBasedParticleScaler_v1 | 8591 | StressBasedParticleScaler_v1 | Stress scaling |

---

## Harmony & Stabilization Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| HarmonyStabilizationSystem_v1 | 8657 | HarmonyStabilizationSystem_v1 | Harmony stabilization |
| T2_CorruptionVisualIntegration_v1 | 8711 | T2_CorruptionVisualIntegration_v1 | T2 corruption visuals |
| T2_HarmonyVisualConsumer_v1 | 8722 | T2_HarmonyVisualConsumer_v1 | T2 harmony visuals |
| TIER4_GameplayIntegrationBridge | 8739 | TIER4_GameplayIntegrationBridge | Tier4 gameplay |

---

## Ritual & Phase Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| NetworkRituals | 8807 | NetworkRituals | Network rituals |
| Phase8VisualBridge | 8813 | Phase8VisualBridge | Phase8 visuals |
| Phase8RitualVisualOrchestration | 8839 | Phase8RitualVisualOrchestration | Ritual orchestration |
| PHASE5_MultiNetworkOrchestrator | 8859 | PHASE5_MultiNetworkOrchestrator | Multi-network orchestration |
| PHASE5_InterNetworkVisualizationBridge | 8977 | PHASE5_InterNetworkVisualizationBridge | Inter-network viz |
| PHASE5_CascadePropagationVisuals | 8993 | PHASE5_CascadePropagationVisuals | Cascade propagation |
| PHASE5_CascadeVisualizationBridge | 9035 | PHASE5_CascadeVisualizationBridge | Cascade viz |

---

## Personality & Visual Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| NodeHierarchyBridge | 9076 | NodeHierarchyBridge | Node hierarchy |
| PersonalityVisualAdapter | 9100 | PersonalityVisualAdapter | Personality viz adapter |
| PersonalityVFXLayer_v1 | 9116 | PersonalityVFXLayer_v1 | Personality VFX layer |
| PersonalityShaderBridge_v1 | 9132 | PersonalityShaderBridge_v1 | Personality shader bridge |
| PersonalityShaderEffects_Pack_v1 | 9152 | PersonalityShaderEffects_Pack_v1 | Personality shader effects |
| PersonalityShaderAdvancedFX_v1 | 9168 | PersonalityShaderAdvancedFX_v1 | Advanced personality FX |

---

## Archetype Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| MythicEvolutionFX_v1 | 9181 | MythicEvolutionFX_v1 | Mythic evolution |
| ArchetypeAscensionCurves_v1 | 9201 | ArchetypeAscensionCurves_v1 | Archetype curves |
| ArchetypeAuraEnhancement_v1 | 9220 | ArchetypeAuraEnhancement_v1 | Archetype auras |
| MythicAuraIntegration_v1 | 9233 | MythicAuraIntegration_v1 | Mythic aura integration |
| ArchetypeColorPaletteSystem_v1 | 9255 | ArchetypeColorPaletteSystem_v1 | Archetype colors |
| ArchetypeShaderModes_v1 | 9274 | ArchetypeShaderModes_v1 | Archetype shaders |
| ArchetypeNeuralLinkVis_v1 | 9287 | ArchetypeNeuralLinkVis_v1 | Neural link viz |

---

## Node & Link Visual Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| NodeShaderActivation_v1 | 9303 | NodeShaderActivation_v1 | Node shader activation |
| LinkPersonalityStateMachine_v1 | 9322 | LinkPersonalityStateMachine_v1 | Link personality state |
| SynergyBonusVisualization_v1 | 9339 | SynergyBonusVisualization_v1 | Synergy bonus viz |
| SynergyBonusFXLayer_v1 | 9359 | SynergyBonusFXLayer_v1 | Synergy bonus FX |
| SynergyResonanceShaderPack_v1 | 9380 | SynergyResonanceShaderPack_v1 | Resonance shaders |
| ResonanceFeedback_v1 | 9400 | ResonanceFeedback_v1 | Resonance feedback |
| SynergyChainReaction_v1 | 9420 | SynergyChainReaction_v1 | Chain reaction |
| SynergyCascadeFXBridge_v1 | 9472 | SynergyCascadeFXBridge_v1 | Cascade FX bridge |

---

## Wave & Particle Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| WaveParticleEmitter_v1 | 9503 | WaveParticleEmitter_v1 | Wave particles |
| ParticleStreamCascadeAccelerationIntegrationSetup | 9546 | ParticleStreamCascadeAccelerationIntegrationSetup | Cascade acceleration |

---

## Performance Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| FXPerformanceController_v1 | 9578 | FXPerformanceController_v1 | FX performance control |
| FXPerformanceScaler_v1 | 9582 | FXPerformanceScaler_v1 | FX scaling |
| AdaptivePerformanceMonitor_v1 | 9601 | AdaptivePerformanceMonitor_v1 | Performance monitor |
| FXPerformanceSmoothTransition_v1 | 9630 | FXPerformanceSmoothTransition_v1 | Smooth transitions |

---

## Metrics & Runtime Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| MetricsRuntime_v1 | 9657 | MetricsRuntime_v1 | Metrics runtime |
| NetworkStressAggregator | 9699 | NetworkStressAggregator | Stress aggregation |
| MetricInterpretationLayer_v1 | 9717 | MetricInterpretationLayer_v1 | Metric interpretation |
| StressVisualShaderSystem | 9730 | StressVisualShaderSystem | Stress shader viz |
| CanonicalTemplate3_StressVisuals | 9744 | CanonicalTemplate3_StressVisuals | Stress visuals template |
| PersonalityRuntime_v1 | 9766 | PersonalityRuntime_v1 | Personality runtime |
| WorldRuntime_v1 | 9784 | WorldRuntime_v1 | World runtime |
| NodeEditorRuntime_v1 | 9804 | NodeEditorRuntime_v1 | Node editor runtime |
| InputRuntime_v1 | 9815 | InputRuntime_v1 | Input runtime |

---

## Cascade & Wave Visualization

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| CascadeResonanceWaveVisualization_Session146 | 10240 | CascadeResonanceWaveVisualization_Session146 | Resonance wave viz |
| ResonanceCascadeVisualization_Session117B | 10314 | ResonanceCascadeVisualization_Session117B | Resonance cascade viz |

---

## Visual Upgrade Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| VisualUpgradeSuperpack | 11950 | VisualUpgradeSuperpack | Visual upgrades |
| CinematicUpgrade | 11970 | CinematicUpgrade | Cinematic effects |
| NodeEditor | 11982 | NodeEditor | Node editor |
| EnvironmentalHazards | 11997 | EnvironmentalHazards | Hazards system |

---

## Safe & Legendary Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| SafeEvolutionManager | 12011 | SafeEvolutionManager | Evolution manager |
| SafeLegendaryNodePack | 12032 | SafeLegendaryNodePack | Legendary nodes |
| SafeLegendaryLinkFX | 12042 | SafeLegendaryLinkFX | Legendary links |
| SafeLegendaryWorldEvents | 12052 | SafeLegendaryWorldEvents | Legendary events |
| SafeAIWeatherPack | 12062 | SafeAIWeatherPack | Weather system |
| SafeWorldFXPack | 12083 | SafeWorldFXPack | World FX |
| AmbientEntityManager | 12093 | AmbientEntityManager | Ambient entities |
| SafeMemoryTrailsManager | 12113 | SafeMemoryTrailsManager | Memory trails |
| SafeQuantumIllusionsPack1 | 12138 | SafeQuantumIllusionsPack1 | Quantum illusions |
| SafeColonyExpansion2 | 12157 | SafeColonyExpansion2 | Colony expansion |
| SafeDreamDepthPack | 12186 | SafeDreamDepthPack | Dream depth |
| DreamDepthEffectManager | 12187 | DreamDepthEffectManager | Dream depth effects |
| SafeMobilityPack4 | 12217 | SafeMobilityPack4 | Mobility pack |

---

## Node Visual & Evolution Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| NodeVisuals4_0 | 12274 | NodeVisuals4_0 | Node visuals v4 |
| NodeEvolution2_0 | 12295 | NodeEvolution2_0 | Node evolution |
| EvolvingLinkFX2_0 | 12352 | EvolvingLinkFX2_0 | Evolving links |
| NodePersonality2_0 | 12370 | NodePersonality2_0 | Node personality |

---

## HUD & Overlay Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| CoreMetricsOverlay | 12409 | CoreMetricsOverlay | Core metrics HUD |
| SystemStateOverlay | 12459 | SystemStateOverlay | System state HUD |
| ZoneAudioReactivity | 12498 | ZoneAudioReactivity | Zone audio |

---

## Semantic & Glyph AI Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| SemanticGlyphAI | 12558 | SemanticGlyphAI | Semantic glyphs |
| GlyphFusionOverlay4_1 | 12943 | GlyphFusionOverlay4_1 | Glyph fusion |
| ProceduralMeaningEngine | 12973 | ProceduralMeaningEngine | Meaning generation |
| LinkGlyphFlow | 12995 | LinkGlyphFlow | Link glyphs |
| LinkedGlyphMessaging3_0 | 13016 | LinkedGlyphMessaging3_0 | Glyph messaging |
| RecursiveGlyphMessaging4_0 | 13049 | RecursiveGlyphMessaging4_0 | Recursive messaging |
| RecursiveGlyphSignalSystem | 13084 | RecursiveGlyphSignalSystem | Glyph signals |

---

## Narrative & Thought Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| EmergentThoughtStorms5_0 | 13166 | EmergentThoughtStorms5_0 | Thought storms |
| AINarrativePatterns6_0 | 13194 | AINarrativePatterns6_0 | Narrative patterns |

---

## Linguistic & UI Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| NodeInspectLinguisticOverlay | 13265 | NodeInspectLinguisticOverlay | Linguistic overlay |
| AtomaLanguageEngine3_0 | 13292 | AtomaLanguageEngine3_0 | Language engine v3 |
| UICategoryLegend3_1 | 13329 | UICategoryLegend3_1 | Category legend |
| AIEmotionalFeed3_1 | 13339 | AIEmotionalFeed3_1 | Emotional feed |
| UINodeInspectPanel | 13368 | UINodeInspectPanel | Node inspect panel |
| UISelectedNodeLabel3_3 | 13386 | UISelectedNodeLabel3_3 | Selected node label |

---

## Network Influence Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| NetworkFatigueSystem | 13411 | NetworkFatigueSystem | Network fatigue |
| InfluenceAttenuationAbsorptionSystem_Session128 | 13447 | InfluenceAttenuationAbsorptionSystem_Session128 | Influence absorption |
| InfluenceReflectionBackPressureSystem_Session129 | 13482 | InfluenceReflectionBackPressureSystem_Session129 | Influence reflection |
| StandingWaveOscillationTrapSystem_Session130 | 13523 | StandingWaveOscillationTrapSystem_Session130 | Wave trap |
| StandingWaveVisualRenderer_Session131 | 13568 | StandingWaveVisualRenderer_Session131 | Wave renderer |
| NodeLinkedAuraRenderer_Session146 | 13622 | NodeLinkedAuraRenderer_Session146 | Aura renderer |

---

## Link & Harmonic Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| LinkAuraSystem_v1 | 13665 | LinkAuraSystem_v1 | Link aura |
| WaveInterferencePatternSystem_Session132 | 13705 | WaveInterferencePatternSystem_Session132 | Wave interference |
| ResonanceRuptureVisualSystem_Session133 | 13766 | ResonanceRuptureVisualSystem_Session133 | Resonance rupture |
| HarmonicRecoveryVisualSystem_Session138 | 13843 | HarmonicRecoveryVisualSystem_Session138 | Harmonic recovery |
| HarmonicAudioReactivitySystem_Session135 | 13872 | HarmonicAudioReactivitySystem_Session135 | Harmonic audio |
| HealingParticleSystem_Session136 | 13885 | HealingParticleSystem_Session136 | Healing particles |
| LinkTrailParticleSystem | 13896 | LinkTrailParticleSystem | Link trails |
| HarmonicHealingVisualSystem_Session134 | 13905 | HarmonicHealingVisualSystem_Session134 | Harmonic healing |

---

## Critical & Cascade Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| RegionalEquilibriumFieldSystem | 13929 | RegionalEquilibriumFieldSystem | Equilibrium field |
| CascadingRuptureSystem | 13948 | CascadingRuptureSystem | Cascading rupture |
| CriticalNodeFailureSystem | 13968 | CriticalNodeFailureSystem | Critical node failure |

---

## Harmonic Resonance Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| HarmonicResonanceFeedbackSystem | 14141 | HarmonicResonanceFeedbackSystem | Resonance feedback |
| ResonanceEchoTrailSystem | 14164 | ResonanceEchoTrailSystem | Echo trails |
| HarmonicTopologyLearningSystem | 14182 | HarmonicTopologyLearningSystem | Topology learning |
| TopologyBiasVisualizationLayer | 14230 | TopologyBiasVisualizationLayer | Topology viz |
| ProceduralHarmonicGlyphGenerator | 14260 | ProceduralHarmonicGlyphGenerator | Procedural glyphs |
| RegionalHarmonicCycleController | 14289 | RegionalHarmonicCycleController | Harmonic cycles |
| GlyphAnimationModulator | 14315 | GlyphAnimationModulator | Glyph animation |

---

## Competition & Selection Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| CompositeGlyphResonanceFeedback | 14338 | CompositeGlyphResonanceFeedback | Composite resonance |
| CompetitionDominanceAdapter_v1 | 14367 | CompetitionDominanceAdapter_v1 | Competition dominance |
| NodeSelectionCore3_4 | 14385 | NodeSelectionCore3_4 | Node selection |

---

## Synergy & Harmonic Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| SynergyPulseVisuals_v1 | 14585 | SynergyPulseVisuals_v1 | Synergy pulse |
| HarmonicResonanceCoupling_v1 | 14602 | HarmonicResonanceCoupling_v1 | Resonance coupling |
| HarmonicHubAuraSystem_Session126 | 14646 | HarmonicHubAuraSystem_Session126 | Hub aura |
| HarmonicInfluencePropagationSystem_Session127 | 14682 | HarmonicInfluencePropagationSystem_Session127 | Influence propagation |
| HarmonicCascadeAmplification_Session145 | 14715 | HarmonicCascadeAmplification_Session145 | Cascade amplification |
| LinkResonanceFlowSystem_Session124 | 14782 | LinkResonanceFlowSystem_Session124 | Resonance flow |
| HarmonicPhaseSynchronization_Session146 | 14864 | HarmonicPhaseSynchronization_Session146 | Phase sync |
| PreCascadeVisualHint_Session146 | 14895 | PreCascadeVisualHint_Session146 | Cascade hints |
| HarmonicNodeResonanceHalos | 14919 | HarmonicNodeResonanceHalos | Resonance halos |
| HarmonicHubDebugger | 14923 | HarmonicHubDebugger | Hub debugger |

---

## Visual Effects Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| VisualEchoTrails_v1 | 14939 | VisualEchoTrails_v1 | Echo trails |
| VisualNetworkTimeElasticity_v1 | 14958 | VisualNetworkTimeElasticity_v1 | Network elasticity |
| ExtremeAIShaderTestSuite | 15283 | ExtremeAIShaderTestSuite | Shader testing |
| SafeNewNodeCategories1_0 | 15301 | SafeNewNodeCategories1_0 | New node categories |
| NewNodeCategoryVisuals | 15316 | NewNodeCategoryVisuals | Category visuals |

---

## Link Visual Systems

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| ExtremeLinkVisualPack3 | 15334 | ExtremeLinkVisualPack3 | Extreme links v3 |
| NeuralCurveLinkVisuals | 15369 | NeuralCurveLinkVisuals | Neural curves |
| ExtremeLinkVisuals4_0 | 15410 | ExtremeLinkVisuals4_0 | Extreme links v4 |
| LinkVisualMoodSystem | 15455 | LinkVisualMoodSystem | Link mood |

---

## Consciousness System

| System | Line | File/Class | Notes |
|--------|------|------------|-------|
| AIConsciousnessLayer | 15504 | AIConsciousnessLayer | AI consciousness |

---

## Statistics

- **Total Systems Analyzed:** 200+
- **Systems NOT Registered in FrameScheduler:** 200+
- **Registration Rate:** ~0% (most systems use direct method calls instead of frame scheduler)

---

## Observations

1. **Pattern Observed:** Most systems in ATOMA are initialized with `new` but are NOT registered in the FrameScheduler.
2. **Update Mechanism:** These systems likely use direct method calls or are invoked through other registered systems.
3. **Design Implication:** This suggests ATOMA uses a hybrid approach where some systems are explicitly scheduled while others are called implicitly.

---

## Recommendations

1. **Audit Update Paths:** For critical systems, verify they are being called regularly through some mechanism.
2. **Consider Standardization:** Evaluate whether high-frequency update systems should be registered in FrameScheduler for consistent timing.
3. **Document Update Frequency:** For unregistered systems, document their update frequency and invocation mechanism.

---

## Notes

- This is a static analysis and may not capture all runtime behaviors.
- Some systems may be updated through parent/child relationships or event-driven mechanisms.
- The frame scheduler is used primarily for specific update loops (simulation, visual, realtime) rather than all system updates.

---

**End of Report**