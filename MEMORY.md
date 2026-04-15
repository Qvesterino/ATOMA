# MEMORY.md -- ATOMA Resident Persistent Memory

This document is the stable memory layer of ATOMA.

It stores confirmed facts, durable decisions, and historical notes that should remain useful across sessions.

---

## Scope

This file owns:

- stable architectural decisions
- confirmed invariants
- historical facts
- durable lessons

This file does not own:

- project philosophy
- subsystem design rules
- active workflow tactics

---

## Phase Record

`PROJECT_PHASE = EVOLUTION_V2`
`DOCUMENT_BASELINE = EVOLUTION_V2.2`

ATOMA is in controlled evolution with subsystem autonomy and bounded innovation.

---

## Confirmed Invariants

The following are confirmed and should be treated as stable:

- Node identity is unified via `node.userData.nodeId`
- `FrameScheduler` is the timing authority
- `MetricsRuntime` is the canonical runtime metrics authority
- `VisualHierarchyRegistry` is the visual hierarchy authority
- Canonical metrics are `synergy`, `harmony`, `stability`, `corruption`, `loadPressure`
- Scheduler frequencies remain `10Hz` simulation, `30Hz` visual, `60Hz` runtime
- WorldRoot and NodeRoot are explicit scene anchors
- Visual systems must not become parallel metric authorities
- GPU-first execution remains the preferred runtime bias where practical

---


## Confirmed Runtime Lessons

- Node select/deselect authority is `NodeLinkingSystem`, not `selectionCore`.
- Prefer passive listeners on the true runtime authority layer; avoid duplicate `main.js` wrappers around `createLink/removeLink` or `setPrimaryNode/clearPrimaryNode`.
- `NodeLinkingSystem.createLinkById(sourceNodeId, targetNodeId)` is the canonical helper, and debug helpers should remain thin passthroughs.
- Link-resonance and cascade systems must derive state from live link authority and remain tolerant of partial `link.userData.metrics` hydration.
- Cascade and wave systems should seed from canonical link lifecycle events and preserve short-lived birth history through unlink instead of deleting it immediately.
- Link visuals and supporting systems may be refactored, but the runtime authority and event-binding contract remain the durable memory.
- In normal runtime, `renderer.debug.checkShaderErrors` should stay disabled and shader programs should be precompiled after world build so cold `getProgramInfoLog` work does not land in `runRenderTick()`.
- Post-processing has its own effect scene, so shader warmup must cover `scene_scene` separately from the main world scene.
- When meshes only differ by uniform values, reuse one `ShaderMaterial` instance and override per-mesh uniforms in `onBeforeRender` instead of cloning the material.
- Late material creation after warmup should be audited explicitly via `checkLateMaterialCreation` so post-warmup GPU churn is visible during profiling.
- Selective bloom refresh should prefer explicit refresh requests, with the periodic scene traversal acting as fallback only.
- Shader patchers that wrap `onBeforeCompile` should preserve/combine `customProgramCacheKey` so identical shader source reuses one program variant.
- Late shader priming should be followed by a scene warmup pass so patched programs compile outside the first render frame.
- Hot metric update loops should batch alias/clamp writes by touched node instead of rewriting the same proxy-backed fields repeatedly inside the same tick.
- Constructive wave particle bursts should preserve straight radial emission; cascade acceleration / flow deflection should not be applied to the constructive family if it introduces sideways drift.
- Runtime browser A/B tests must first confirm the game is in a stable gameplay state, not menu/boot overlay. If `window.game` is absent, the page falls back to menu, or `render_game_to_text` does not reflect live gameplay, the result is invalid and must be discarded before drawing conclusions.
- Semantic pictogram teardown must happen after the link is removed from live link arrays, otherwise the pictogram system can respawn stale glyphs from `_lastLinks` / live-link cache.
- Link semantic pictogram builder logic is now separated from lifecycle/state management into `LinkSemanticPictogramGlyphBuilders.js`; keep glyph construction and unlink cleanup isolated from pool/state orchestration.

---

## Unified Cleanup Contract

Confirmed on 2026-04-06: All 20 high-risk systems now follow the unified cleanup contract.

### Contract Pattern

**Track Created Objects:**
```javascript
constructor(scene, ...args) {
    this.scene = scene;
    this._createdObjects = [];  // UNIFIED CLEANUP CONTRACT
}

// After each scene.add(obj):
scene.add(obj);
this._createdObjects.push(obj);  // UNIFIED CLEANUP CONTRACT
```

**Dispose Implementation:**
```javascript
dispose() {
    // UNIFIED CLEANUP CONTRACT - Remove and dispose all tracked objects
    this._createdObjects.forEach(obj => {
        if (this.scene) this.scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    this._createdObjects = [];
}
```

### Completed Systems (20/20)

**Implemented cleanup contract (15 systems):**
1. NodeEditor.js
2. LinkPointFXBase.js
3. _MythicRitualController.js
4. ResonanceRuptureVisualSystem_Session133.js
5. LinkGlyphFlow.js
6. SynergyVFXEngine1_0.js
7. T2_CorruptionVisualIntegration_v1.js
8. TIER4_CorruptionFeedbackVisuals_v1.js
9. WaveInterferencePatternSystem_Session132.js
10. CorruptionVisualFX_v1.js
11. SynergyCascadeVisualizer.js
12. CompositeGlyphResonanceFeedback.js
13. HarmonicHealingVisualSystem_Session134.js
14. HarmonicRecoveryVisualSystem_Session138.js
15. HealingParticleSystem_Session136.js

**Already compliant (5 systems):**
16. NodeLinkingSystem.js
17. LinkingSystemHardening.js
18. ResonanceCascadeVisualization_Session117B.js
19. AINodes.js
20. Multiple smaller VFX systems

### Stability Impact

- Zero orphan objects on scene switch
- Zero memory leaks from missed disposal
- Consistent pattern across all VFX and visual systems
- Safe to add `nodesRoot`, `linksRoot`, `debugRoot` without breaking cleanup

---

## Runtime Test Boot

Confirmed default runtime validation entrypoint:

- use `http://127.0.0.1:5500/index.html` for browser runtime tests and validation
- prefer the local static server boot path over Vite when reproducing live runtime behavior
- treat `5500/index.html` as the default verification target unless a task explicitly says otherwise

## Open Follow-Up

- Deterministic node growth spawn is prewired; live Edge verification still needs a clean fresh-session smoke test.

---

## AI Tooling Summary

ATOMA has a confirmed AI tooling layer for analysis, testing, and optimization support. Detailed implementation and runtime APIs are documented separately in `TOOLS.md` and the phase summary documents.

The persistent memory obligation is that AI tooling is designed to complement existing architecture, not to replace it, and that it respects the canonical authorities of `FrameScheduler`, `MetricsRuntime`, and `VisualHierarchyRegistry`.

---

## VFX Systems Catalog

**Link Visual Systems (35+):**
- LinkRendererConduit.js - Core link renderer with glow, streaks, beads, pulses, and particles.
- AnimatedLinkFlow.js - Optional data-flow visualization with moving packets and beams.
- LinkBeadVisualEffects.js - Enhances link beads with trails and pulse effects.
- TopologyBiasVisualizationLayer.js - Visualizes long-term topology learning as directional bias vectors.
- VisualUpgradeSuperpack.js - Global visual polish with volumetric lights, bloom, and cinematic effects.
- PHASE5_CascadeVisuals.js - Consolidated cascade ring propagation visualization.
- LinkResonanceFlowSystem_Session124.js - Pulsing directional energy flows along links with overload indicators.
- LinkSemanticPictogramSystem_WithFusion.js - Creates traveling glyphs with convergence detection and fusion.
- LinkDirectionalGradientPolish.js - Applies gradient colors along link direction.
- LinkDirectionalStreaks.js - Renders streak patterns showing energy flow direction.
- LinkStreakColorDynamics_Session115.js - Animates streak colors based on link state.
- LinkRingArcDischarges.js - Generates electric arc discharges on link rings.
- LinkSurfacePhaseRipples.js - Creates phase-based ripple effects on link surfaces.
- LinkEventVisualCoordinator_v1.js - Coordinates event-based link visuals.
- LinkCategoryColorContract.js - Defines color contracts for link categories.
- LinkQualityCalculator.js - Calculates overall link quality score from metrics.
- LinkQualityPredictor1_0.js - Predicts future link quality for proactive visual changes.
- LinkDecayEffectApplier.js - Applies visual decay effects to deteriorating links.
- LinkDegradationSystem.js - Manages link degradation lifecycle stages.
- LinkCollapseSystem.js - Visualizes link collapse with shatter and debris effects.
- LinkEmissionPulsingSystem.js - Creates rhythmic emission pulsing on links.
- LinkBeadTrailSystem.js - Generates trail effects behind moving beads.
- LinkPointFXBase.js - Base class for point-based FX systems.
- LinkVisualStateAdapter.js - Adapts link state to visual parameters.
- LinkRenderLayerPolicy.js - Defines render layer policy for link visuals.
- LinkSemanticMetricsBridge_v1.js - Bridges semantic metrics to visual systems.
- LinkShaderMetricsIntegration_v1.js - Integrates metrics into link shader uniforms.
- LinkThicknessMetricsIntegrationPatch_v1.js - Integrates metrics into link thickness.
- LinkThicknessScaling_v1.js - Scales link thickness based on various factors.
- LinkStateVisualLanguageIntegration.js - Encodes link state in visual patterns.
- LinkCascadePulseManager.js - Manages cascade pulses on links.
- LinkCascadeInfectionSystem.js - Visualizes cascade infection spreading along links.
- LinkPersonalityStateMachine_v1.js - Manages personality state for links.
- LinkCorruptionTransmission_v1.js - Visualizes corruption transmission along links.
- LinkCorruptionSpreadAnimator.js - Animates corruption spread across links.
- NeonLinkVisuals.js - Alternative neon-style link visual effects.
- DynamicLinkColorSystem.js - Dynamic color assignment based on metrics.

**Resonance Systems (9):**
- LinkResonanceFlowSystem_Session124.js - Pulsing directional energy flows along links.
- ResonanceEchoTrailSystem.js - Creates harmonic afterimages following composite glyphs.
- HarmonicResonanceCoupling_v1.js - Creates pulsing resonance particles flowing between nodes.
- CascadeResonanceWaveVisualization_Session146.js - Visualizes resonance waves between harmonic hubs.
- T2_HarmonyVisualConsumer_v1.js - Renders visual harmony feedback with auras and healing pulses.
- ResonanceCascadeVisualization_Session117B.js - Visualizes link-born resonance blooms and load-pressure surges.
- HarmonicResonanceFeedbackSystem.js - Shows resonance active state with glow and pulse.
- CompositeGlyphResonanceFeedback.js - Provides resonance feedback through composite glyphs.
- LinkResonanceFlowIntegrationPatch_Session124.js - Integrates resonance flow with visual systems.

**Cascade Systems (16):**
- SynergyCascadeVisualizer.js - Visualizes cascade propagation with flow particles and ripples.
- CascadeParticleSystem_Session120.js - GPU particle system with semantic encoding for conflict types.
- CascadingRuptureSystem.js - Visualizes rupture energy propagating through network.
- CascadeWaveParticles.js - Wave-front particles for cascade events.
- CascadeBurstVisual_Session147.js - Burst explosion visual effects.
- ParticleCascadeFlowDeflection.js - Deflects particle flow during cascade.
- ParticleStreamCascadeAcceleration.js - Accelerates particle streams during cascade.
- ParticleStreamCascadeAccelerationIntegrationSetup.js - Sets up cascade acceleration integration.
- ParticleStreamCascadeAccelerationIntegrationPatch.js - Patches acceleration into particle systems.
- HarmonicCascadeAmplification_Session145.js - Amplifies harmonic cascade effects.
- CascadeEventBridge_v1.js - Bridges cascade events to visual systems.
- CascadeToWaveBridge_v1.js - Converts cascade data to wave format.
- CascadeSystemConsoleAPI.js - Console API for cascade debugging and control.
- CascadingHarmonicResonanceAmplification.js - Amplifies harmonic resonance during cascades.
- PreCascadeVisualHint_Session146.js - Provides visual warnings before cascade events.
- PHASE5_CorruptionBridge_v1.js - Bridges corruption events to visual systems.

**Wave Systems (8):**
- StandingWaveVisualRenderer_Session131.js - Visualizes standing waves with concentric ring patterns.
- OscillationTrapVisualSystem_Session132.js - Visualizes standing wave oscillation traps.
- StandingWaveOscillationTrapSystem_Session130.js - Detects standing wave formation and trap regions.
- ResonanceRuptureVisualSystem_Session133.js - Visualizes standing wave collapse and rupture.
- HarmonicRecoveryVisualSystem_Session138.js - Represents network repair with recovery waves.
- WaveInterferencePatternSystem_Session132.js - Visualizes constructive/destructive interference patterns.
- WaveInterferenceEngine_v1.js - Computes wave superposition and interference.
- WaveBurstRouter_v1.js - Routes wave burst events to appropriate visual systems.

**Pulse Wave Systems (3):**
- PulseWaveSystemBridge_v1.js - Bridges pulse events to wave visual systems.
- PulseIntersectionImpulseAdapter_v1.js - Creates visuals when pulses intersect.
- PulseBoundaryInteractionAdapter_v1.js - Creates visuals when pulses reach link boundaries.

**Particle Systems (13):**
- CascadeParticleSystem_Session120.js - GPU particle system for cascade conflicts.
- HealingParticleSystem_Session136.js - GPU particle system for healing effects.
- T2_CorruptionVisualIntegration_v1.js - Corruption feedback particles and link bursts.
- WaveParticleEmitter_v1.js - Emits wave-reactive particles for different states.
- ParticleTrailSystem_Session122.js - Renders motion trails for fast-moving particles.
- LinkCorruptionParticleSystem.js - Minimal GPU corruption particles with red shards.
- LinkHealingParticleSystem.js - Minimal GPU healing particles with knots and petals.
- LinkSparkSystem.js - Particle sparks emitting along link curves.
- LinkTrailParticleSystem.js - Organic particle trails flowing along links.
- ParticleEmissionScaler.js - Scales particle emission rates dynamically.
- ParticleEmissionRateScaling.js - Scales emission rates based on metrics.
- ParticleEmissionIntegrationPatch.js - Integrates emission scaling into systems.
- StressBasedParticleScaler_v1.js - Scales particle emission based on stress levels.

**Synergy VFX (9):**
- SynergyHighwayVisuals3D_1_0.js - Renders 3D arc highways connecting category clusters.
- SynergyChainReaction_v1.js - Propagates synergy chain reactions through network.
- SynergyVFXEngine1_0.js - Advanced 5-layer visual effects for synergy visualization.
- SynergyVFX1_0.js - Clean visual-only system with glow, trails, halos, and bursts.
- SynergyPulseVisuals_v1.js - Simple smooth sinusoid pulse for high synergy.
- SynergyTravelingWaveFX_v1.js - GPU-driven traveling wave shader effects.
- SynergyCascadeFXBridge_v1.js - Bridge connecting chain reactions to shader systems.
- SynergyBonusVisualization_v1.js - GPU visualization highlighting high-synergy links.
- SynergyBonusFXLayer_v1.js - GPU-based synergy flares on high-synergy links.
- SynergyColorTransition.js - Handles smooth color transitions for synergy.
- SynergyGlowIntegrationGuide.js - Guide for integrating synergy glow effects.

**Harmony Systems (9):**
- HarmonicNodeResonanceHalos.js - Visualizes harmonic hub authority with halos.
- HarmonicInfluencePropagationSystem_Session127.js - Visualizes harmonic influence propagation.
- HarmonicInfluencePropagationIntegrationPatch_Session127.js - Integrates influence with visual systems.
- HarmonicHealingVisualSystem_Session134.js - Visualizes harmonic healing effects.
- HarmonicHubAuraSystem_Session126.js - Creates aura effects around harmonic hubs.
- HarmonicSyncEffectApplier.js - Applies harmonic synchronization visual effects.
- NodeHarmonicManager.js - Manages harmonic state for nodes.
- NodeHarmonicSyncController.js - Controls harmonic synchronization for nodes.
- HarmonyStabilizationIntegrationPatch_v1.js - Integrates stabilization with visual systems.
- HarmonicPhaseSynchronization_Session146.js - Synchronizes harmonic phases across network.
- T2_HarmonyVisualConsumer_v1.js - Renders visual harmony feedback with auras.

**Corruption VFX (5):**
- CorruptionVisualFX_v1.js - Visualizes corruption progression with distortion and glow.
- TIER4_CorruptionFeedbackVisuals_v1.js - Visual feedback for corruption-affecting actions.
- CorruptionVisualIntegrationPatch_v1.js - Integrates corruption visuals with other systems.
- CorruptionDesaturationIntegrationPatch.js - Integrates corruption desaturation effects.
- CorruptionDrivenAuraDesaturationSystem.js - Desaturates auras based on corruption level.

**Ritual VFX (3):**
- Phase8RitualVisualOrchestration.js - Purely visual ceremony layer for network rituals.
- RitualVisualOrchestrator.js - Orchestrates canonical visual templates during rituals.
- NetworkRituals_v1.js - System for network ritual events.

**Archetype VFX (5):**
- ArchetypeVisualDifferentiationSystem_v1.js - Applies distinct visual treatments by archetype.
- ArchetypeVisualProfiles_v1.js - Defines visual profiles for archetypes.
- ArchetypeVisualTransitionEngine_v2.js - Handles smooth transitions between archetype visuals.
- ArchetypeVisualIntegrationPatch_v1.js - Integrates archetype visuals with node systems.
- ArchetypeShaderModes_v1.js - Defines shader modes for archetypes.

**Colony VFX (1):**
- ColonyVFXManager.js - Safe living civilization visual effects with growth shells and orbitals.

**Dream Effects (9):**
- DreamDepthEffectManager.js - Rich dream aperture overlay with depth-of-field.
- SafeDreamDepthPack.js - Low-cost fallback depth layer for performance.
- DreamDesert.js - Desert environment background for dream state.
- DreamDesert2.js - Enhanced desert environment background.
- FractalValley.js - Fractal valley environment background.
- QuantumIsland.js - Quantum island environment background.
- SigmaRiftChamber.js - Sigma rift chamber environment background.
- MemoryLane.js - Memory lane visual effect showing past states.
- CinematicUpgrade.js - Cinematic visual upgrades for better presentation.

**Glyph Systems (15):**
- MegaGlyphSystem.js - Creates and manages large-scale glyph visualizations.
- MegaGlyphConduit.js - Conduit system for large glyphs data flow.
- GlyphFusionZone.js - Manages glyph fusion zones and convergence.
- GlyphAnimationModulator.js - Modulates glyph animation parameters.
- _AtomaGlyphSystem4_0.js - Main glyph system for ATOMA v4.
- _GlyphFusionOverlay4_1.js - Overlay for glyph fusion effects.
- _GlyphLayer4_MultiFusion.js - Handles multi-glyph fusion scenarios.
- _GlyphPurityMode5_1.js - Purity mode for glyph clarity.
- _AdaptiveGlyphRendering1_0.js - Adaptive rendering with performance-based LOD.
- _LinkedGlyphMessaging3_0.js - Messaging system for linked glyphs.
- _LinkedGlyphSynchronization1_0.js - Synchronizes linked glyphs.
- _RecursiveGlyphSignalSystem.js - Recursive signal system for glyphs.
- _RecursiveGlyphMessaging4_0.js - Recursive messaging for glyphs.
- _SemanticGlyphAI.js - AI-driven semantic glyph generation.
- _MythicSeedGlyph.js - Mythic seed glyph system.
- ProceduralHarmonicGlyphGenerator.js - Generates procedural glyphs with harmonic properties.
- LinkSemanticPictogramGlyphBuilders.js - Builder utilities for creating semantic glyphs.
- CompositeGlyphGenerator.js - Generates composite glyph geometry.
- CompositeGlyphResonanceFeedback.js - Provides resonance feedback through glyphs.
- LinkSemanticPictogramSystem_WithFusion.js - Creates traveling glyphs with convergence detection.

**Node Visual Systems (13):**
- _NodeVisuals4_0.js - Main node visual system for ATOMA v4.
- _NodeVisualBootstrap3_0.js - Bootstrap system for node visuals.
- NodeShaderActivation_v1.js - Activates and manages node shaders.
- Atoma_nodes/StorageNodesVisual_Session116.js - Visual system for storage nodes.
- NodeCoreOpaqueEnforcer_Session113.js - Enforces opaque rendering for node cores.
- NodeDepthAndHoloPreservationFix.js - Fix for node depth and hologram preservation.
- NodeVisualIntegrityFix.js - Fixes node visual integrity issues.
- NodeHoverRingSystem.js - Creates hover ring effects on node interaction.
- NodeImpactManager.js - Manages impact visuals like pulses and ripples.
- NodeHierarchyEffectsPool_v1.js - Pooled effects for node hierarchy visualization.
- NodeHierarchyVisuals_v1.js - Visualizes node hierarchy and relationships.
- NodeHierarchyVisualFeedback_v1.js - Provides feedback for hierarchy events.
- NodeVisualAuthorityRuntime.js - Runtime authority system for node visuals.
- NodeVisualRegistry.js - Visual registry for node management.
- NodeVisualStateBinder.js - Binds visual state to nodes.
- NodeVisualReadinessGate_v1.js - Ensures nodes are ready before activating visuals.

**Visual Authority Systems (8):**
- VisualAuthority.js - Defines canonical authority for visual systems.
- VisualAuthorityFlag.js - Defines flag constants for visual authority claims.
- CoreVisualAuthoritySystem.js - Central system managing visual authority claims.
- NodeVisualAuthorityRuntime.js - Runtime authority for node visual management.
- VisualTemplateRegistry.js - Registry for canonical visual templates.
- VisualTemplateResolver.js - Resolves and applies visual templates.
- VisualAutoWiringSystem.js - Automatically wires visual controllers to renderables.
- VisualHierarchyRegistry.js - Visual hierarchy authority.

**Audio-Reactive VFX (1):**
- HarmonicAudioReactivitySystem_Session135.js - Creates visuals synchronized with audio.

**Environmental VFX (6):**
- _SafeWorldFXPack.js - Safe environmental effects with haze and particles.
- SafeMetricsFX1_1.js - Visual effects driven by network metrics.
- EnvironmentalHazards.js - Visualizes environmental hazards and danger zones.
- MetricReactiveWorldEvents.js - World events that react to network metrics.
- EventVisualSuppression_v1.js - Suppresses visual events for performance.
- TemporalEventEffects.js - Time-based event visual effects.

**Performance Systems (4):**
- FXRuntime_v1.js - Centralized orchestration for all global FX systems.
- FXPerformanceController_v1.js - Controls VFX performance through quality settings.
- FXPerformanceScaler_v1.js - Dynamically scales VFX quality based on performance.
- FXPerformanceSmoothTransition_v1.js - Smooth transitions between performance levels.

**Shader Systems (13):**
- ATOMAShaderBase.js - Base class for ATOMA shaders.
- UtilityShaders.js - Shared utility shader functions.
- NodeAuraShader.js - Dynamic noise-driven vertex displacement for node auras.
- LinkAuraShader.js - Energy flow visualization between nodes.
- NeonPulseShader.js - Pulsing neon glow shader effects.
- NeonEdgeGlowShader.js - Edge-based glow shader effects.
- RiftEnergyShader.js - Rift/tear energy visualizations.
- StressVisualShaders.js - Stress and turbulence shader effects.
- AITechDistortionShader.js - AI/tech distortion effects.
- NodeSegmentedOrbitRings.js - Segmented orbital rings around nodes.
- LinkStateVisualLanguage.js - Link state visual encoding.
- FresnelRimLightAuraShader.js - Fresnel-based rim lighting for auras.
- HarmonyAuraShaderMaterial.js - Harmony-specific aura materials.
- StressTurbulenceShaderMaterial.js - Stress turbulence materials.
- CoreHologramShader.js - Holographic rendering effects.

**Post-Processing (1):**
- PostProcessing.js - Central post-processing pipeline with bloom, chromatic aberration, vignette.

**Debug Systems (8):**
- FXDebugSandbox.js - Debug sandbox for visual effects testing.
- VisualAudit.js - Audits visual systems for issues.
- VisualLayerDebugger.js - Debugs visual layers and rendering.
- VisualOverlayAuditSystem.js - Audits visual overlays and effects.
- ShaderFreezeGuard.js - Guards against shader freeze issues.
- ShaderVariantDetector.js - Detects shader variants and configurations.
- HarmonicHubDebugger.js - Debugs harmonic hub systems.
- run_vfx_audit.js - Runs VFX audits and generates reports.

**Additional VFX (30):**
- VisualNetworkTimeElasticity_v1.js - Time-based visual elasticity effects.
- SimulationEffectOrchestrator.js - Orchestrates simulation-based visual effects.
- SimulationEffectPool.js - Pooled effect objects for simulation effects.
- InterferenceEffectApplier.js - Applies interference-based visual effects.
- RegionalEquilibriumFieldSystem.js - Regional equilibrium field visualization.
- RegionalHarmonicCycleController.js - Controls regional harmonic cycles.
- RegionalHarmonyZones.js - Regional harmony zone visualization.
- VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js - Critical fix for visual interaction isolation.
- NodeLinkedAuraSystem.js - Linked aura system between nodes.
- LinkedAuraHarmonyBands.js - Harmony bands in linked auras.
- FireLikeAuraConfig.js - Fire-like aura configuration.
- FresnelAuraIntegrationPatch.js - Integrates Fresnel effects into auras.
- HarmonyAuraController.js - Controls harmony aura effects.
- PersonalityRuntime_v1.js - Runtime system for personality visualization.
- PersonalitySignalSmoother_v1.js - Smooths personality-based visual signals.
- PersonalityMaterialProfileRegistry_v1.js - Registry for personality material profiles.
- _SafeNodePersonalityFX.js - Safe personality-based visual effects.
- _ExtremeAIShaderPack.js - Extreme AI-style shader effects.
- NeuralConvergenceSingularity.js - Visualizes neural convergence singularity.
- VisualMetricModel_v1.js - Visual model for metric-based effects.
- MetricInterpretationLayer_v1.js - Interprets metrics for visual use.
- SemanticMetricAdapter.js - Adapts semantic metrics for visual systems.
- VisualEchoTrails_v1_Integration.js - Integrates echo trail effects.
- EchoRippleIntegrationPatch_Session125.js - Integrates echo ripple effects.
- LinkMicroImpulseIntegrationSetup.js - Sets up micro impulse integration.
- Phase8VisualBridge.js - Bridges Phase 8 events to visual systems.
- NetworkRituals_v1.js - System for network ritual events.
- _MythicRitualController.js - Controller for mythic rituals.
- SafeLegendaryLinkFX.js - Legendary visual effects for links.
- VisualUpgradeSuperpack.js - Global visual polish across engine.
