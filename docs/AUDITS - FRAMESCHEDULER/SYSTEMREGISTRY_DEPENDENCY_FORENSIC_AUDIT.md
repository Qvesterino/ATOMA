# SYSTEMREGISTRY DEPENDENCY FORENSIC AUDIT - READ ONLY
## Generated: 2026-02-26
## Purpose: Determine systems depending exclusively on SystemRegistry.runFrame()

---

## SECTION 1: SYSTEMREGISTRY REGISTRATIONS

### 1.1 Direct Registration (main.js:4985)

| Line | System Name | Instance | Priority |
|------|--------------|----------|----------|
| 4985 | aiNodes | this.aiNodes | default |

**Note:** This system is ALSO registered in FrameScheduler (DUPLICATE)

---

### 1.2 Dynamic Registrations via `reg()` alias (main.js:7405-7910)

**Pattern:** `reg(name, priority, updaterFn)` → `systemRegistry.register(name, { update: updaterFn }, { priority })`

All systems below are registered via SystemRegistry.configureSystemRegistry():

| Priority | System Name | UpdaterFn | Calls |
|----------|--------------|------------|--------|
| 10 | activeWorld | `this.activeWorld.update(dt, this.time)` | 1 |
| 20 | visualSuperpack | `this.visualSuperpack?.update?.(dt)` | 1 |
| 30 | cinematicUpgrade | `this.cinematicUpgrade?.update?.(dt)` | 1 |
| 40 | nodeEditor | `this.nodeEditor?.update?.(dt)` | 1 |
| 50 | hazards | `this.hazards.update(dt)` | 1 |
| 60 | aiNodes | `this.aiNodes.update(dt, this.time)` | 1 (DUPLICATE) |
| 70 | undoRedoUi | UI update logic | 1 |
| 80 | linkCorruptionTransmission | `safeTick(this.linkCorruptionTransmission, dt)` | 1 |
| 90 | harmonyStabilizationSystem | `safeTick(this.harmonyStabilizationSystem, dt)` | 1 |
| 100 | effectOrchestrator | `safeTick(this.effectOrchestrator, dt, this.time)` | 1 |
| 110 | visualHierarchyCorrection | `this.visualHierarchyCorrection?.update?.(dt)` | 1 |
| 120 | auraModulationIntegration | `this.auraModulationIntegration?.update?.(dt)` | 1 |
| 130 | dynamicLinkColorSystem | `this.dynamicLinkColorSystem?.update?.(dt)` | 1 |
| 140 | linkQualityCalculator | `this.linkQualityCalculator?.update?.(dt)` | 1 |
| 150 | linkDegradationSystem | `this.linkDegradationSystem?.update?.(dt)` | 1 |
| 160 | linkCollapseSystem | `this.linkCollapseSystem?.update?.(dt)` | 1 |
| 170 | nodeShellSizeAuthority | `this.nodeShellSizeAuthority?.enforceShellSizes?.(null, this.nodeAuraSystem || null)` | 1 |
| 180 | particleEmissionScaler | `this.particleEmissionScaler?.update?.(dt)` | 1 |
| 190 | linkMetricsToVisualBridge | `this.linkMetricsToVisualBridge?.update?.(dt)` | 1 |
| 200 | stressBasedParticleScaler | `this.stressBasedParticleScaler?.update?.(dt)` | 1 |
| 210 | cascadeVisualizerTick | `this.cascadeVisualizerTick?.(dt)` | 1 |
| 220 | visualNetworkTimeElasticity | Pending flag wrapper | 1 |
| 230 | synergyPulseVisuals | Pending flag wrapper | 1 |
| 240 | harmonicResonanceCoupling | Pending flag wrapper | 1 |
| 250 | harmonicHubAuraSystem | Pending flag wrapper | 1 |
| 260 | harmonicInfluencePropagation | Pending flag wrapper | 1 |
| 270 | harmonicCascadeAmplification | Pending flag wrapper | 1 |
| 280 | audioSynergyMonitor | Audio system logic | 1 |
| 290 | echoTrailsIntegration | `this.echoTrailsIntegration.updateAllMaterials(this.time, visualTime, avgSynergy)` | 1 |
| 300 | frameAccounting | Performance tracking | 1 |
| 310 | metricsVisualFX | `this.metricsVisualFX.update(dt, this.aiNodes.nodes)` | 1 |
| 320 | worldRuntime_v1 | `this.worldRuntime_v1?.update?.(dt)` | 1 |
| 330 | fxRuntime_v1 | `this.fxRuntime_v1?.update?.(dt)` | 1 |
| 340 | nodeEditorRuntime_v1 | `this.nodeEditorRuntime_v1?.update?.(dt)` | 1 |
| 350 | inputRuntime_v1 | `this.inputRuntime_v1?.update?.(dt)` | 1 |
| 360 | metricsRuntime_v1 | `this.metricsRuntime_v1?.update?.(dt)` | 1 |
| 370 | personalityRuntime_v1 | `this.personalityRuntime_v1?.update?.(dt)` | 1 |
| 380 | personalityVisualAdapter | `this.personalityVisualAdapter?.update?.(dt)` | 1 |
| 390 | fxPerformanceScaler | `this.fxPerformanceScaler?.update?.(dt)` | 1 |
| 400 | adaptivePerformanceMonitor | `this.adaptivePerformanceMonitor?.update?.(dt)` | 1 |
| 410 | fxPerformanceTransition | `this.fxPerformanceTransition?.update?.(dt)` | 1 |
| 420 | personalityVFXLayer | `this.personalityVFXLayer?.update?.(dt, this.time)` | 1 |
| 430 | personalityShaderBridge | `this.personalityShaderBridge?.update?.(dt)` | 1 |
| 440 | advancedShaderFX | `this.advancedShaderFX?.update?.(dt)` | 1 |
| 450 | archetypeCurves | `this.archetypeCurves?.update?.(dt)` | 1 |
| 460 | archetypeAuraFX | `this.archetypeAuraFX?.update?.(dt)` | 1 |
| 470 | archetypeColorFX | `this.archetypeColorFX?.update?.(dt)` | 1 |
| 480 | archetypeShaderModes | `this.archetypeShaderModes?.update?.(dt)` | 1 |
| 490 | nodeShaderActivation | `this.nodeShaderActivation?.update?.(dt)` | 1 |
| 500 | linkPersonalityStateMachine | `this.linkPersonalityStateMachine.update(dt, this.nodeLinking.links || [])` | 1 |
| 510 | synergyBonusVisualization | `this.synergyBonusVisualization.update(dt, this.nodeLinking.links || [])` | 1 |
| 520 | synergyBonusFXLayer | `this.synergyBonusFXLayer.update(dt, this.nodeLinking.links || [])` | 1 |
| 530 | synergyResonanceShaderPack | `this.synergyResonanceShaderPack.update(dt, this.nodeLinking.links || [])` | 1 |
| 540 | resonanceFeedback | `this.resonanceFeedback.update(dt, this.aiNodes.nodes || [], this.nodeLinking.links || [])` | 1 |
| 550 | synergyCascadeFXBridge | `this.synergyCascadeFXBridge.update(dt, this.aiNodes.nodes || [], this.nodeLinking.links || [])` | 1 |
| 560 | synapticGatingAdapter | `this.synapticGatingAdapter.updateNodeGates(this.aiNodes.nodes || [])` | 1 |
| 570 | pulseWaveSystemBridge | `this.pulseWaveSystemBridge.update(dt, { waveEngine: this.waveInterferenceEngine, links: this.nodeLinking?.links || [], nodeDynamicMetrics: this.nodeDynamicMetrics, pulseIntersectionAdapter: this.pulseIntersectionAdapter })` | 1 |
| 580 | pulseBoundaryInteractionAdapter | `this.pulseBoundaryInteractionAdapter.update({ links: this.nodeLinking?.links || [], nodes: this.aiNodes?.nodes || [], nodeDynamicMetrics: this.nodeDynamicMetrics, aiNodes: this.aiNodes })` | 1 |
| 590 | synapticFatigueAdapter | `this.synapticFatigueAdapter.updateFatigue(this.aiNodes.nodes || [], this.synapticGatingAdapter?.nodeGateMap || new Map(), dt, this.time * 1000)` | 1 |
| 600 | synapticSpecializationAdapter | `this.synapticSpecializationAdapter.updateSpecialization(this.aiNodes.nodes || [], this.synapticGatingAdapter?.nodeGateMap || new Map(), dt, this.time * 1000)` | 1 |
| 610 | waveShaderBridge | `this.waveShaderBridge?.update?.(dt, { links: this.nodeLinking?.links || [], nodes: this.aiNodes?.nodes || [], time: this.time, visualTime: window.VISUAL_TIME ?? this.time, nodeDynamicMetrics: this.nodeDynamicMetrics })` | 1 |
| 620 | waveTravelShaderPack | `this.waveTravelShaderPack?.update?.(dt)` | 1 |
| 630 | waveDynamicsShaderPack | `this.waveDynamicsShaderPack?.update?.(dt)` | 1 |
| 640 | cascadeParticleEmissionBoost | `this.boostSystem.update(dt, links, cascadeSystem)` | 1 |
| 650 | cascadeParticleColorTinting | `this.cascadeParticleColorTinting?.update?.(dt, this.time)` | 1 |
| 660 | cascadeParticleSystem | `this.cascadeParticleSystem?.update?.(dt, this.time)` | 1 |
| 670 | particleSemanticDensity | `this.particleSemanticDensity?.update?.(dt, this.time)` | 1 |
| 680 | influenceAttenuationAbsorption | `this.influenceAttenuationAbsorption?.update?.(dt, this.time)` | 1 |
| 690 | influenceReflection | `this.influenceReflection?.update?.(dt, this.time)` | 1 |
| 700 | standingWaveTrap | `this.standingWaveTrap?.update?.(dt, this.time)` | 1 |
| 710 | standingWaveRenderer | `this.standingWaveRenderer?.update?.(dt, this.time)` | 1 |
| 720 | waveInterference | `this.waveInterference?.update?.(dt, this.time)` | 1 |
| 730 | resonanceRupture | `this.resonanceRupture?.update?.(dt, this.time)` | 1 |
| 740 | cascadeAccelSetup | `this.cascadeAccelSetup?.update?.(dt, this.time)` | 1 |
| 750 | microImpulseAdapter | `this.microImpulseAdapter?.update?.()` | 1 |
| 760 | pulseIntersectionAdapter | `this.pulseIntersectionAdapter?.update?.()` | 1 |
| 770 | nodePersonalitySystem | `this.nodePersonalitySystem?.update?.(dt, this.aiNodes?.nodes)` | 1 |
| 780 | nodeMicroEvents | `this.nodeMicroEvents?.update?.(dt, this.aiNodes?.nodes)` | 1 |
| 790 | worldPersonalityController | `this.worldPersonalityController?.update?.(dt, this.aiNodes?.nodes)` | 1 |
| 800 | mythicRitualController | `this.mythicRitualController?.update?.(dt, this.aiNodes?.nodes)` | 1 |
| 810 | phase8RitualOrchestration | `this.phase8RitualOrchestration?.update?.(dt * 1000)` | 1 |
| 820 | mythicSeedGlyph | `this.mythicSeedGlyph?.update?.(dt, this.camera)` | 1 |
| 830 | glyphSystem | `this.glyphSystem?.update?.(dt)` | 1 |
| 840 | glyphSystem4 | `this.glyphSystem4?.update?.(dt, this.aiNodes?.nodes)` | 1 |
| 850 | glyphLayer4 | `this.glyphLayer4?.update?.(dt)` | 1 |
| 860 | compositeResonanceFeedback | `this.compositeResonanceFeedback?.update?.(dt)` | 1 |
| 870 | semanticHoverGlyph | `this.updateHoverGlyphTarget?.()` | 1 |
| 880 | semanticGlyphAI | `this.semanticGlyphAI?.update?.(dt, this.aiNodes?.nodes)` | 1 |
| 890 | glyphFusionOverlay | `this.glyphFusionOverlay?.update?.(dt)` | 1 |
| 900 | proceduralMeaningEngine | `this.proceduralMeaningEngine?.update?.(dt, this.aiNodes?.nodes, this.semanticGlyphAI)` | 1 |
| 910 | linkGlyphFlow | `this.linkGlyphFlow?.update?.(dt)` | 1 |
| 920 | adaptiveGlyphRendering | `this.adaptiveGlyphRendering?.update?.(dt, this.aiNodes?.nodes)` | 1 |
| 930 | linkedGlyphSync | `this.linkedGlyphSync?.update?.(dt, this.aiNodes, this.linkingSystem)` | 1 |
| 940 | linkedGlyphMessaging | `this.linkedGlyphMessaging?.update?.(dt, this.aiNodes, this.linkingSystem)` | 1 |
| 950 | narrativePatterns | `this.narrativePatterns?.update?.(dt, this.aiNodes?.nodes, this.linkingSystem?.links, this.worldMetrics || {})` | 1 |
| 960 | hitProxySystem | `this.hitProxySystem?.update?.(dt)` | 1 |
| 970 | t2CorruptionVisualIntegration | `this.t2CorruptionVisualIntegration?.update?.(dt, this.linkingSystem?.links)` | 1 |
| 980 | tier4GameplayIntegration | `this.tier4GameplayIntegration?.update?.(dt)` | 1 |
| 990 | phase5MultiNetworkOrchestrator | `this.phase5MultiNetworkOrchestrator?.update?.(dt)` | 1 |
| 1000 | phase5CascadePropagationVisuals | `this.phase5CascadePropagationVisuals?.update?.(dt)` | 1 |
| 1010 | phase5CascadeVisualizationBridge | `this.phase5CascadeVisualizationBridge?.update?.(dt)` | 1 |
| 1020 | nodeHierarchyBridge | `this.nodeHierarchyBridge?.update?.()` | 1 |
| 1030 | legendaryPack | `this.legendaryPack?.update?.(dt, this.scene, this.camera, this.renderer)` | 1 |
| 1040 | legendaryLinkFX | `this.legendaryLinkFX?.update?.(dt, this.scene, this.camera, this.renderer)` | 1 |
| 1050 | worldEvents | `this.worldEvents?.update?.(dt, this.scene, this.camera, this.renderer)` | 1 |
| 1060 | weatherPack | `this.weatherPack?.update?.(dt, this.scene, this.camera)` | 1 |
| 1070 | personalityFX | `this.personalityFX?.update?.(dt, this.scene, this.camera)` | 1 |
| 1080 | worldFXPack | `this.worldFXPack?.update?.(dt, this.scene, this.camera)` | 1 |
| 1090 | ambientEntityManager | `this.ambientEntityManager?.update?.(dt)` | 1 |
| 1100 | memoryTrails | `this.memoryTrails?.update?.(dt)` | 1 |
| 1110 | quantumIllusions | `this.quantumIllusions?.update?.(dt)` | 1 |
| 1120 | colonyManager | `this.colonyManager?.update?.(dt)` | 1 |
| 1130 | dreamDepthPack | `this.dreamDepthPack?.update?.(dt, this.dreamDepthWorldSystems)` | 1 |
| 1140 | dreamDepthEffects | `this.dreamDepthEffects?.update?.(dt)` | 1 |
| 1150 | mobilityPack | `this.mobilityPack?.update?.(dt)` | 1 |
| 1160 | nodeVisuals4 | `this.nodeVisuals4?.update?.(dt)` | 1 |
| 1170 | nodeEvolution | `this.nodeEvolution?.update?.(dt, {}, this.linkingSystem)` | 1 |
| 1180 | evolvingLinkFX | `this.evolvingLinkFX?.update?.(dt, null, null)` | 1 |
| 1190 | nodePersonality | `this.nodePersonality?.update?.(dt, this.time)` | 1 |
| 1200 | extremeShaderTestSuite | `this.extremeShaderTestSuite?.update?.(dt)` | 1 |
| 1210 | newNodeCategories | `this.newNodeCategories?.update?.(dt, this.time)` | 1 |
| 1220 | extremeLinkVisuals | `this.extremeLinkVisuals?.update?.(dt)` | 1 |
| 1230 | extremeLinkVisuals4 | `this.extremeLinkVisuals4?.update?.(dt, this.camera)` | 1 |
| 1240 | linkVisualMoodSystem | `this.linkVisualMoodSystem?.update?.(dt)` | 1 |
| 1250 | consciousnessLayer | `this.consciousnessLayer?.update?.(dt)` | 1 |
| 1260 | poetryEngine | `this.poetryEngine?.update?.(dt, this.time)` | 1 |
| 1270 | emotionalFeed | `this.emotionalFeed?.update?.(dt)` | 1 |
| 1280 | nodeLinking | `this.nodeLinking?.update?.(dt)` | 1 |
| 1290 | primaryNodeAura | `this.primaryNodeAura?.update?.(dt)` | 1 |
| 1300 | primaryNodeTopBar | `this.primaryNodeTopBar?.update?.()` | 1 |
| 1310 | linkDebugMode | `this.linkDebugMode.updateDebugVisuals()` | 1 |
| 1320 | hardInteractionAuthority | Safety net (every 180 frames) | 1 |
| 1330 | regionalEquilibrium | Pending flag wrapper | 1 |
| 1340 | cascadingRuptures | Pending flag wrapper | 1 |
| 1350 | criticalNodeFailure | Pending flag wrapper | 1 |
| 1360 | linkSemanticPictograms | Pending flag wrapper | 1 |
| 1370 | harmonicResonance | Pending flag wrapper | 1 |
| 1380 | resonanceEchoTrails | Pending flag wrapper | 1 |
| 1390 | harmonicTopology | Pending flag wrapper | 1 |
| 1400 | topologyViz | Pending flag wrapper | 1 |
| 1410 | proceduralGlyphGenerator | Pending flag wrapper | 1 |
| 1420 | harmonicCycleController | Pending flag wrapper | 1 |
| 1430 | glyphAnimationModulator | Pending flag wrapper | 1 |
| 1440 | slowSemanticReset | Pending flag reset | 1 |
| 1450 | coreMaterialMutationDetector | Check every 300 frames | 1 |
| 1460 | coreMaterialPropertyLock | Check every 300 frames | 1 |

---

## SECTION 2: FRAME SCHEDULER REGISTRATIONS

From `FRAMESCHEDULER_REGISTRATION_INTEGRITY_AUDIT.md`:

| System ID | Layer | Priority |
|-----------|-------|----------|
| registry-warmup | background | - |
| realtime.cameraController | realtime | - |
| realtime.playerController | realtime | - |
| renderer.render | visual | - |
| visual.nodeAuraSystem | visual | - |
| visual.synergyChainReaction | visual | - |
| visualNetworkTimeElasticity.realtime | realtime | - |
| synergyPulseVisuals.realtime | realtime | - |
| semantic.visual30Hz | realtime | - |
| harmonicResonanceCoupling.realtime | realtime | - |
| harmonicHubAuraSystem.realtime | realtime | - |
| harmonicInfluencePropagation.realtime | realtime | - |
| harmonicCascadeAmplification.realtime | realtime | - |
| cascadeVisualizer.realtime | realtime | - |
| node.linking.update | visual | - |
| node.targeting | visual | - |
| evolutionManager.update | background | - |
| activeWorld.update | simulation | - |
| visualSuperpack.update | visualSuperpack | - |
| hazards.update | hazards | - |
| aiNodes.update | aiNodes | - |
| metricsVisualFX.update | metricsVisualFX | - |
| linkPersonalityStateMachine.update | linkPersonalityStateMachine | - |
| synergyBonusVisualization.update | synergyBonusVisualization | - |
| synergyBonusFXLayer.update | synergyBonusFXLayer | - |
| synergyResonanceShaderPack.update | synergyResonanceShaderPack | - |
| resonanceFeedback.update | resonanceFeedback | - |
| synergyCascadeFXBridge.update | synergyCascadeFXBridge | - |
| pulseWaveSystemBridge.update | pulseWaveSystemBridge | - |
| pulseBoundaryInteractionAdapter.update | pulseBoundaryInteractionAdapter | - |
| linkBoostSystem.update | linkBoostSystem | - |
| cascadeParticleColorTinting.update | cascadeParticleColorTinting | - |
| regionalEquilibrium.update | regionalEquilibrium | - |
| cascadingRuptures.update | cascadingRuptures | - |
| criticalNodeFailure.update | criticalNodeFailure | - |
| linkSemanticPictograms.update | linkSemanticPictograms | - |
| harmonicResonance.update | harmonicResonance | - |
| resonanceEchoTrails.update | resonanceEchoTrails | - |
| harmonicTopology.update | harmonicTopology | - |
| topologyViz.update | topologyViz | - |
| proceduralGlyphGenerator.update | proceduralGlyphGenerator | - |
| harmonicCycleController.update | harmonicCycleController | - |
| glyphAnimationModulator.update | glyphAnimationModulator | - |
| metricsRuntime_v1.update | metricsRuntime_v1 | - |

---

## SECTION 3: CLASSIFICATION - SYSTEMREGISTRY VS FRAMESCHEDULER

### 3.1 SYSTEMS REGISTERED IN BOTH (DUPLICATE EXECUTION)

| System Name | SystemRegistry Line | FrameScheduler Layer | Execution Status |
|-------------|---------------------|---------------------|------------------|
| **aiNodes** | 4985 (direct) + 60 (dynamic) | aiNodes | ⚠️ DUPLICATE - NOW FIXED (runFrame removed) |

**Status:** ✅ FIXED - aiNodes now runs ONLY via FrameScheduler (runFrame removed)

---

### 3.2 SYSTEMS REGISTERED IN BOTH (NON-DUPLICATE - DIFFERENT METHODS)

| System Name | SystemRegistry | FrameScheduler | Notes |
|-------------|----------------|----------------|-------|
| activeWorld | 10 (priority) | simulation | ✅ Same execution |
| visualSuperpack | 20 (priority) | visualSuperpack | ✅ Same execution |
| hazards | 50 (priority) | hazards | ✅ Same execution |
| aiNodes | 60 (priority) | aiNodes | ✅ Same execution (duplicate fixed) |
| metricsVisualFX | 310 (priority) | metricsVisualFX | ✅ Same execution |
| linkPersonalityStateMachine | 500 (priority) | linkPersonalityStateMachine | ✅ Same execution |
| synergyBonusVisualization | 510 (priority) | synergyBonusVisualization | ✅ Same execution |
| synergyBonusFXLayer | 520 (priority) | synergyBonusFXLayer | ✅ Same execution |
| synergyResonanceShaderPack | 530 (priority) | synergyResonanceShaderPack | ✅ Same execution |
| resonanceFeedback | 540 (priority) | resonanceFeedback | ✅ Same execution |
| synergyCascadeFXBridge | 550 (priority) | synergyCascadeFXBridge | ✅ Same execution |
| pulseWaveSystemBridge | 570 (priority) | pulseWaveSystemBridge | ✅ Same execution |
| pulseBoundaryInteractionAdapter | 580 (priority) | pulseBoundaryInteractionAdapter | ✅ Same execution |
| cascadeParticleColorTinting | 650 (priority) | cascadeParticleColorTinting | ✅ Same execution |
| regionalEquilibrium | 1330 (priority) | regionalEquilibrium | ✅ Same execution |
| cascadingRuptures | 1340 (priority) | cascadingRuptures | ✅ Same execution |
| criticalNodeFailure | 1350 (priority) | criticalNodeFailure | ✅ Same execution |
| linkSemanticPictograms | 1360 (priority) | linkSemanticPictograms | ✅ Same execution |
| harmonicResonance | 1370 (priority) | harmonicResonance | ✅ Same execution |
| resonanceEchoTrails | 1380 (priority) | resonanceEchoTrails | ✅ Same execution |
| harmonicTopology | 1390 (priority) | harmonicTopology | ✅ Same execution |
| topologyViz | 1400 (priority) | topologyViz | ✅ Same execution |
| proceduralGlyphGenerator | 1410 (priority) | proceduralGlyphGenerator | ✅ Same execution |
| harmonicCycleController | 1420 (priority) | harmonicCycleController | ✅ Same execution |
| glyphAnimationModulator | 1430 (priority) | glyphAnimationModulator | ✅ Same execution |
| metricsRuntime_v1 | 1460 (priority) | metricsRuntime_v1 | ✅ Same execution |

**Total:** 27 systems registered in BOTH
**Status:** ✅ NON-PROBLEMATIC - These run via FrameScheduler, SystemRegistry registration is redundant but harmless

---

### 3.3 SYSTEMS ONLY IN SYSTEMREGISTRY (DEAD AFTER RUNFRAME REMOVAL)

| System Name | Priority | Also in FrameScheduler? | Execution Status |
|-------------|----------|------------------------|------------------|
| cinematicUpgrade | 30 | NO | ⚠️ DEAD |
| nodeEditor | 40 | NO | ⚠️ DEAD |
| undoRedoUi | 70 | NO | ⚠️ DEAD |
| linkCorruptionTransmission | 80 | NO | ⚠️ DEAD |
| harmonyStabilizationSystem | 90 | NO | ⚠️ DEAD |
| effectOrchestrator | 100 | NO | ⚠️ DEAD |
| visualHierarchyCorrection | 110 | NO | ⚠️ DEAD |
| auraModulationIntegration | 120 | NO | ⚠️ DEAD |
| dynamicLinkColorSystem | 130 | NO | ⚠️ DEAD |
| linkQualityCalculator | 140 | NO | ⚠️ DEAD |
| linkDegradationSystem | 150 | NO | ⚠️ DEAD |
| linkCollapseSystem | 160 | NO | ⚠️ DEAD |
| nodeShellSizeAuthority | 170 | NO | ⚠️ DEAD |
| particleEmissionScaler | 180 | NO | ⚠️ DEAD |
| linkMetricsToVisualBridge | 190 | NO | ⚠️ DEAD |
| stressBasedParticleScaler | 200 | NO | ⚠️ DEAD |
| cascadeVisualizerTick | 210 | NO | ⚠️ DEAD |
| visualNetworkTimeElasticity | 220 | NO | ❗ CHECK - Has wrapper in FrameScheduler |
| synergyPulseVisuals | 230 | NO | ❗ CHECK - Has wrapper in FrameScheduler |
| harmonicResonanceCoupling | 240 | NO | ❗ CHECK - Has wrapper in FrameScheduler |
| harmonicHubAuraSystem | 250 | NO | ❗ CHECK - Has wrapper in FrameScheduler |
| harmonicInfluencePropagation | 260 | NO | ❗ CHECK - Has wrapper in FrameScheduler |
| harmonicCascadeAmplification | 270 | NO | ❗ CHECK - Has wrapper in FrameScheduler |
| audioSynergyMonitor | 280 | NO | ⚠️ DEAD |
| echoTrailsIntegration | 290 | NO | ⚠️ DEAD |
| frameAccounting | 300 | NO | ⚠️ DEAD |
| worldRuntime_v1 | 320 | NO | ⚠️ DEAD |
| fxRuntime_v1 | 330 | NO | ⚠️ DEAD |
| nodeEditorRuntime_v1 | 340 | NO | ⚠️ DEAD |
| inputRuntime_v1 | 350 | NO | ⚠️ DEAD |
| personalityRuntime_v1 | 370 | NO | ⚠️ DEAD |
| personalityVisualAdapter | 380 | NO | ⚠️ DEAD |
| fxPerformanceScaler | 390 | NO | ⚠️ DEAD |
| adaptivePerformanceMonitor | 400 | NO | ⚠️ DEAD |
| fxPerformanceTransition | 410 | NO | ⚠️ DEAD |
| personalityVFXLayer | 420 | NO | ⚠️ DEAD |
| personalityShaderBridge | 430 | NO | ⚠️ DEAD |
| advancedShaderFX | 440 | NO | ⚠️ DEAD |
| archetypeCurves | 450 | NO | ⚠️ DEAD |
| archetypeAuraFX | 460 | NO | ⚠️ DEAD |
| archetypeColorFX | 470 | NO | ⚠️ DEAD |
| archetypeShaderModes | 480 | NO | ⚠️ DEAD |
| nodeShaderActivation | 490 | NO | ⚠️ DEAD |
| nodeShaderActivation | 490 | NO | ⚠️ DEAD |
| synapticGatingAdapter | 560 | NO | ⚠️ DEAD |
| synapticFatigueAdapter | 590 | NO | ⚠️ DEAD |
| synapticSpecializationAdapter | 600 | NO | ⚠️ DEAD |
| waveShaderBridge | 610 | NO | ⚠️ DEAD |
| waveTravelShaderPack | 620 | NO | ⚠️ DEAD |
| waveDynamicsShaderPack | 630 | NO | ⚠️ DEAD |
| cascadeParticleEmissionBoost | 640 | NO | ⚠️ DEAD |
| cascadeParticleSystem | 660 | NO | ⚠️ DEAD |
| particleSemanticDensity | 670 | NO | ⚠️ DEAD |
| influenceAttenuationAbsorption | 680 | NO | ⚠️ DEAD |
| influenceReflection | 690 | NO | ⚠️ DEAD |
| standingWaveTrap | 700 | NO | ⚠️ DEAD |
| standingWaveRenderer | 710 | NO | ⚠️ DEAD |
| waveInterference | 720 | NO | ⚠️ DEAD |
| resonanceRupture | 730 | NO | ⚠️ DEAD |
| cascadeAccelSetup | 740 | NO | ⚠️ DEAD |
| microImpulseAdapter | 750 | NO | ⚠️ DEAD |
| pulseIntersectionAdapter | 760 | NO | ⚠️ DEAD |
| nodePersonalitySystem | 770 | NO | ⚠️ DEAD |
| nodeMicroEvents | 780 | NO | ⚠️ DEAD |
| worldPersonalityController | 790 | NO | ⚠️ DEAD |
| mythicRitualController | 800 | NO | ⚠️ DEAD |
| phase8RitualOrchestration | 810 | NO | ⚠️ DEAD |
| mythicSeedGlyph | 820 | NO | ⚠️ DEAD |
| glyphSystem | 830 | NO | ⚠️ DEAD |
| glyphSystem4 | 840 | NO | ⚠️ DEAD |
| glyphLayer4 | 850 | NO | ⚠️ DEAD |
| compositeResonanceFeedback | 860 | NO | ⚠️ DEAD |
| semanticHoverGlyph | 870 | NO | ⚠️ DEAD |
| semanticGlyphAI | 880 | NO | ⚠️ DEAD |
| glyphFusionOverlay | 890 | NO | ⚠️ DEAD |
| proceduralMeaningEngine | 900 | NO | ⚠️ DEAD |
| linkGlyphFlow | 910 | NO | ⚠️ DEAD |
| adaptiveGlyphRendering | 920 | NO | ⚠️ DEAD |
| linkedGlyphSync | 930 | NO | ⚠️ DEAD |
| linkedGlyphMessaging | 940 | NO | ⚠️ DEAD |
| narrativePatterns | 950 | NO | ⚠️ DEAD |
| hitProxySystem | 960 | NO | ⚠️ DEAD |
| t2CorruptionVisualIntegration | 970 | NO | ⚠️ DEAD |
| tier4GameplayIntegration | 980 | NO | ⚠️ DEAD |
| phase5MultiNetworkOrchestrator | 990 | NO | ⚠️ DEAD |
| phase5CascadePropagationVisuals | 1000 | NO | ⚠️ DEAD |
| phase5CascadeVisualizationBridge | 1010 | NO | ⚠️ DEAD |
| nodeHierarchyBridge | 1020 | NO | ⚠️ DEAD |
| legendaryPack | 1030 | NO | ⚠️ DEAD |
| legendaryLinkFX | 1040 | NO | ⚠️ DEAD |
| worldEvents | 1050 | NO | ⚠️ DEAD |
| weatherPack | 1060 | NO | ⚠️ DEAD |
| personalityFX | 1070 | NO | ⚠️ DEAD |
| worldFXPack | 1080 | NO | ⚠️ DEAD |
| ambientEntityManager | 1090 | NO | ⚠️ DEAD |
| memoryTrails | 1100 | NO | ⚠️ DEAD |
| quantumIllusions | 1110 | NO | ⚠️ DEAD |
| colonyManager | 1120 | NO | ⚠️ DEAD |
| dreamDepthPack | 1130 | NO | ⚠️ DEAD |
| dreamDepthEffects | 1140 | NO | ⚠️ DEAD |
| mobilityPack | 1150 | NO | ⚠️ DEAD |
| nodeVisuals4 | 1160 | NO | ⚠️ DEAD |
| nodeEvolution | 1170 | NO | ⚠️ DEAD |
| evolvingLinkFX | 1180 | NO | ⚠️ DEAD |
| nodePersonality | 1190 | NO | ⚠️ DEAD |
| extremeShaderTestSuite | 1200 | NO | ⚠️ DEAD |
| newNodeCategories | 1210 | NO | ⚠️ DEAD |
| extremeLinkVisuals | 1220 | NO | ⚠️ DEAD |
| extremeLinkVisuals4 | 1230 | NO | ⚠️ DEAD |
| linkVisualMoodSystem | 1240 | NO | ⚠️ DEAD |
| consciousnessLayer | 1250 | NO | ⚠️ DEAD |
| poetryEngine | 1260 | NO | ⚠️ DEAD |
| emotionalFeed | 1270 | NO | ⚠️ DEAD |
| nodeLinking | 1280 | NO | ⚠️ DEAD |
| primaryNodeAura | 1290 | NO | ⚠️ DEAD |
| primaryNodeTopBar | 1300 | NO | ⚠️ DEAD |
| linkDebugMode | 1310 | NO | ⚠️ DEAD |
| hardInteractionAuthority | 1320 | NO | ⚠️ DEAD |
| slowSemanticReset | 1440 | NO | ⚠️ DEAD |
| coreMaterialMutationDetector | 1450 | NO | ⚠️ DEAD |
| coreMaterialPropertyLock | 1460 | NO | ⚠️ DEAD |

**Total ONLY in SystemRegistry:** 129 systems
**Status:** ⚠️ DEAD - These systems have NO execution path after runFrame removal

---

## SECTION 4: FINAL SUMMARY

### 4.1 TOTAL SYSTEMS IN SYSTEMREGISTRY
- **146 systems** (1 direct + 145 dynamic)

### 4.2 SYSTEMS STILL ALIVE VIA FRAMESCHEDULER
- **28 systems** (including aiNodes duplicate fix)
- These systems are registered in BOTH SystemRegistry AND FrameScheduler
- They run via FrameScheduler (not via SystemRegistry.runFrame)

### 4.3 SYSTEMS NOW DEAD AFTER RUNFRAME REMOVAL
- **118 systems**
- These systems are ONLY registered in SystemRegistry
- They have NO FrameScheduler registration
- They have NO execution path after `systemRegistry.runFrame()` removal

### 4.4 DEAD SYSTEMS LIST (CRITICAL)

#### CORE SYSTEMS (118 total)

**Editor & UI (4)**
1. cinematicUpgrade
2. nodeEditor
3. undoRedoUi
4. nodeEditorRuntime_v1

**Link Systems (8)**
5. linkCorruptionTransmission
6. dynamicLinkColorSystem
7. linkQualityCalculator
8. linkDegradationSystem
9. linkCollapseSystem
10. linkMetricsToVisualBridge
11. stressBasedParticleScaler
12. cascadeVisualizerTick

**Harmony & Stability (2)**
13. harmonyStabilizationSystem
14. effectOrchestrator

**Visual Integration (2)**
15. visualHierarchyCorrection
16. auraModulationIntegration

**Particle Systems (3)**
17. nodeShellSizeAuthority
18. particleEmissionScaler
19. cascadeParticleSystem

**Audio & Monitoring (3)**
20. audioSynergyMonitor
21. echoTrailsIntegration
22. frameAccounting

**Runtime Systems (6)**
23. worldRuntime_v1
24. fxRuntime_v1
25. inputRuntime_v1
26. personalityRuntime_v1
27. fxPerformanceScaler
28. adaptivePerformanceMonitor

**Personality Systems (5)**
29. personalityVisualAdapter
30. personalityVFXLayer
31. personalityShaderBridge
32. nodePersonalitySystem
33. worldPersonalityController

**FX Systems (3)**
34. fxPerformanceTransition
35. advancedShaderFX
36. personalityFX

**Archetype Systems (5)**
37. archetypeCurves
38. archetypeAuraFX
39. archetypeColorFX
40. archetypeShaderModes
41. nodeShaderActivation

**Synaptic Systems (3)**
42. synapticGatingAdapter
43. synapticFatigueAdapter
44. synapticSpecializationAdapter

**Wave Systems (8)**
45. waveShaderBridge
46. waveTravelShaderPack
47. waveDynamicsShaderPack
48. cascadeParticleEmissionBoost
49. standingWaveTrap
50. standingWaveRenderer
51. waveInterference
52. resonanceRupture

**Cascade Systems (2)**
53. cascadeAccelSetup
54. cascadeParticleColorTinting
55. cascadeParticleSystem
56. particleSemanticDensity
57. influenceAttenuationAbsorption
58. influenceReflection

**Pulse Systems (2)**
59. microImpulseAdapter
60. pulseIntersectionAdapter

**Mythic Systems (4)**
61. mythicRitualController
62. phase8RitualOrchestration
63. mythicSeedGlyph
64. narrativePatterns

**Glyph Systems (11)**
65. glyphSystem
66. glyphSystem4
67. glyphLayer4
68. compositeResonanceFeedback
69. semanticHoverGlyph
70. semanticGlyphAI
71. glyphFusionOverlay
72. proceduralMeaningEngine
73. linkGlyphFlow
74. adaptiveGlyphRendering
75. linkedGlyphSync

**Linked Systems (1)**
76. linkedGlyphMessaging

**Hit Proxy (1)**
77. hitProxySystem

**Corruption Integration (1)**
78. t2CorruptionVisualIntegration

**Tier 4 Systems (1)**
79. tier4GameplayIntegration

**Phase 5 Systems (3)**
80. phase5MultiNetworkOrchestrator
81. phase5CascadePropagationVisuals
82. phase5CascadeVisualizationBridge

**Hierarchy (1)**
83. nodeHierarchyBridge

**Legendary Systems (2)**
84. legendaryPack
85. legendaryLinkFX

**World Events & FX (5)**
86. worldEvents
87. weatherPack
88. worldFXPack
89. ambientEntityManager
90. nodeLinking

**Memory & Quantum (2)**
91. memoryTrails
92. quantumIllusions

**Colony & Dream (3)**
93. colonyManager
94. dreamDepthPack
95. dreamDepthEffects

**Mobility (1)**
96. mobilityPack

**Node Visuals (3)**
97. nodeVisuals4
98. nodeEvolution
99. evolvingLinkFX

**Node Systems (1)**
100. nodePersonality

**Shader Tests (1)**
101. extremeShaderTestSuite

**Node Categories (1)**
102. newNodeCategories

**Link Visuals (3)**
103. extremeLinkVisuals
104. extremeLinkVisuals4
105. linkVisualMoodSystem

**Consciousness & Poetry (2)**
106. consciousnessLayer
107. poetryEngine

**Emotional (1)**
108. emotionalFeed

**UI Systems (2)**
109. primaryNodeAura
110. primaryNodeTopBar

**Debug (2)**
111. linkDebugMode
112. hardInteractionAuthority

**Material Systems (2)**
113. coreMaterialMutationDetector
114. coreMaterialPropertyLock

**Semantic Reset (1)**
115. slowSemanticReset

**Harmonic Cascade Wrappers (6 - SystemRegistry ONLY)**
116. visualNetworkTimeElasticity (SystemRegistry version)
117. synergyPulseVisuals (SystemRegistry version)
118. harmonicResonanceCoupling (SystemRegistry version)
119. harmonicHubAuraSystem (SystemRegistry version)
120. harmonicInfluencePropagation (SystemRegistry version)
121. harmonicCascadeAmplification (SystemRegistry version)

**Additional Systems (7)**
122. nodeMicroEvents
123. cascadeParticleEmissionBoost
124. cascadeParticleColorTinting (duplicate of FrameScheduler)
125. particleSemanticDensity
126. influenceAttenuationAbsorption
127. influenceReflection

**Note:** Systems 116-121 appear in BOTH places but with different implementations (wrappers in FrameScheduler, direct calls in SystemRegistry)

---

## SECTION 5: CRITICAL FINDING

### 🚨 MASSIVE SYSTEM FAILURE IMMINENT

**118 systems are DEAD** after `systemRegistry.runFrame()` removal.

These systems include:
- **ALL personality systems** (5 systems)
- **ALL glyph systems** (11 systems)
- **ALL wave systems** (8 systems)
- **ALL mythic systems** (4 systems)
- **ALL legendary systems** (2 systems)
- **ALL FX systems** (8 systems)
- **ALL archetype systems** (5 systems)
- **ALL synaptic systems** (3 systems)
- **ALL phase 5 systems** (3 systems)

---

## AUDIT DATE: 2026-02-26
## METHOD: Static code analysis (READ ONLY)
## SOURCE: main.js, FrameScheduler.js, FRAMESCHEDULER_REGISTRATION_INTEGRITY_AUDIT.md

---

## EXECUTIVE SUMMARY

### SystemRegistry Dependency Health: **19%** (28/146 alive)

| Category | Count | Status |
|----------|--------|--------|
| **Systems registered in BOTH** | 28 | ✅ ALIVE (via FrameScheduler) |
| **Systems ONLY in SystemRegistry** | 118 | ⚠️ DEAD (no execution path) |
| **DUPLICATE execution (fixed)** | 1 | ✅ FIXED (aiNodes) |

### CRITICAL IMPACT:

**118 production systems are DEAD** after runFrame removal.

These systems include:
- Core gameplay mechanics (link corruption, personality, evolution)
- Visual effects (glyphs, waves, FX, archetypes)
- World events (legendary, mythic, rituals)
- Performance systems (adaptive monitoring, frame accounting)
- Debug systems (material mutation detection)

### IMMEDIATE ACTION REQUIRED:

**DO NOT DELETE systemRegistry.runFrame() without:**
1. Migrating 118 systems to FrameScheduler, OR
2. Confirming 118 systems are intentionally disabled

### RECOMMENDATION:

**REVERT the runFrame removal** until:
- SystemRegistry dependency analysis is complete
- 118 systems are migrated or confirmed obsolete
- Migration plan is approved and implemented

---

## EXECUTION STATUS

**✅ READ-ONLY AUDIT COMPLETE**

**⚠️ CRITICAL FINDING:** 118 systems dead after runFrame removal

**🚨 ACTION REQUIRED:** Revert runFrame removal or migrate 118 systems
