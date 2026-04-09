# VISUAL SYSTEMS MAP
## ATOMA Visual Systems Inventory

**Version:** 1.0  
**Date:** 2026-03-03  
**Status:** Phase 1 - Inventory Complete

---

## Table of Contents

1. [Node-Level FX](#node-level-fx)
2. [Link-Level FX](#link-level-fx)
3. [Global FX](#global-fx)
4. [Postprocess FX](#postprocess-fx)
5. [Particles](#particles)
6. [Emitters](#emitters)
7. [Aura Systems](#aura-systems)
8. [Shaders](#shaders)
9. [Integration Wrappers](#integration-wrappers)

---

## Node-Level FX

### Core Node Visuals
- **EnhancedNodeModels.js** - Enhanced node geometry generation
- **AINodeModel.js** - AI node model definitions
- **CanonicalGeometryFamilies_v1.js** - Canonical geometry families for nodes
- **ArchetypeVisualProfiles_v1.js** - Archetype-based visual profiles
- **ArchetypeVisualIntegrationPatch_v1.js** - Integration of archetype visuals

### Node State Visuals
- **NodeDynamicMetrics.js** - Dynamic metrics visualization on nodes
- **NodeLinkedAuraRenderer_Session146.js** - Render linked auras for nodes
- **NodeLinkedAuraSystem.js** - Linked aura system for nodes
- **FresnelAuraIntegrationPatch.js** - Fresnel-based aura integration
- **FresnelRimLightAuraShader.js** - Fresnel rim light aura shader
- **AuraLODCulling.js** - Level-of-detail culling for auras
- **GlobalAuraOpacityClamp.js** - Global aura opacity control
- **GlobalAuraOpacityClamp_Integration.js** - Integration of global aura clamping

### Node Selection & Interaction
- **VisualHierarchyCorrectionSystem_v1.js** - Visual hierarchy correction
- **VisualInteractionIsolationPatch.js** - Visual interaction isolation
- **VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js** - Critical fixes for interaction isolation
- **HitProxyAutoRegistrar.js** - Hit proxy auto-registration
- **ForceNodeOpaqueBodySystem_v1.js** - Force opaque body system

### Archetype Visuals
- **ArchetypeAuraEnhancement_v1.js** - Archetype aura enhancement
- **ArchetypeColorPaletteSystem_v1.js** - Archetype color palettes
- **ArchetypeNeuralLinkVis_v1.js** - Archetype neural link visualization
- **ArchetypeShaderModes_v1.js** - Archetype shader modes
- **ArchetypeVisualDifferentiationSystem_v1.js** - Visual differentiation by archetype
- **ArchetypeVisualTransitionEngine_v2.js** - Visual transition engine

### Corruption Visuals
- **CorruptionVisualFX_v1.js** - Corruption visual effects
- **CorruptionVisualIntegrationPatch_v1.js** - Integration of corruption visuals
- **CorruptionDesaturationIntegrationPatch.js** - Corruption desaturation effects
- **CorruptionDrivenAuraDesaturationSystem.js** - Aura desaturation driven by corruption

### Hologram Systems
- **CoreHologramShader.js** - Core hologram shader
- **HologramShellAuthoritySystem.js** - Hologram shell authority system
- **TopologyBiasVisualizationLayer.js** - Topology bias visualization

---

## Link-Level FX

### Core Link Rendering
- **LinkRenderer.ts** - TypeScript link renderer
- **LinkRendererConduit.js** - Link renderer conduit
- **NeonLinkVisuals.js** - Neon-style link visuals
- **LinkStateVisualLanguage.js** - Link state visual language
- **LinkStateVisualLanguageIntegration.js** - Integration of visual language

### Link Visual Layers
- **_ExtremeLinkVisualPack3.js** - Extreme link visual pack (3 layers: core, glow, bloom)
- **LinkBeadSystem.js** - Traveling bead system on links
- **LinkTrailParticleSystem.js** - Trail particle system for links
- **LinkPulseRing.js** - Pulse ring effects on links
- **LinkRingArcDischarges.js** - Arc discharge effects

### Link Surface Effects
- **LinkSurfacePhaseRipples.js** - Surface phase ripples
- **SURFACE_RIPPLES_EXAMPLES.js** - Surface ripple examples
- **LinkDirectionalStreaks.js** - Directional streak effects
- **LinkSparkSystem.js** - Spark system on links
- **DynamicLinkColorSystem.js** - Dynamic link color system

### Link Metrics Visuals
- **LinkMetricsToVisualBridge_v1.js** - Bridge from metrics to visuals
- **StressBasedParticleScaler_v1.js** - Stress-based particle scaling
- **_DynamicLinkThicknessSystem.js** - Dynamic link thickness based on traffic

### Link State Visuals
- **AnimatedLinkFlow.js** - Animated flow on links
- **SynapticGatingAdapter_v1.js** - Synaptic gating visualization
- **LinkResonanceFlowSystem_Session124.js** - Resonance flow system
- **EchoRippleIntegrationPatch_Session125.js** - Echo ripple integration

### Link Pictograms
- **LinkPictogramLibrary.js** - Link pictogram library
- **LinkSemanticPictogramSystem.js** - Semantic pictogram system
- **LinkSemanticPictogramSystem_Enhanced.js** - Enhanced semantic pictograms
- **LinkSemanticPictogramSystem_WithFusion.js** - Pictograms with fusion

---

## Global FX

### World Effects
- **World.js** - World root with particle drift
- **DreamDesert.js** - Dream desert environment
- **DreamDesert2.js** - Dream desert environment (v2)
- **FractalValley.js** - Fractal valley environment
- **DreamDepthEffectManager.js** - Dream depth effect management
- **EnvironmentalHazards.js** - Environmental hazard visuals

### Weather & Atmosphere
- **VisualUpgradeSuperpack.js** - Visual upgrade superpack with weather
- **_AmbientEntityManager.js** - Ambient entity management

### Temporal Effects
- **TemporalEventEffects.js** - Temporal event visual effects
- **SigmaRiftChamber.js** - Sigma rift chamber visuals

### Ritual Effects
- **_MythicRitualController.js** - Mythic ritual visual controller

---

## Postprocess FX

### Post-Process Systems
- **TemporalEventEffects.js** - Temporal post-processing effects (composer, vignette)
- **VisualUpgradeSuperpack.js** - Post-effect packs:
  - NeonDreamPostfxPack (bloom, chromatic aberration, vignette, shimmer)
  - DreamParticlesPack

### Visual Enhancements
- **CinematicUpgrade.js** - Cinematic visual upgrades
- **AuraModulationIntegration_v1.js** - Aura modulation integration
- **AuraModulationSystem.js** - Aura modulation system

### Special Effects
- **_NewNodeCategoryVisuals.js** - New node category visuals
- **TopologyBiasVisualizationLayer.js** - Topology bias visualization

---

## Particles

### Cascade Particles
- **CascadeParticleSystem_Session120.js** - Cascade particle system
- **CascadeParticleEmissionBoost_Session118.js** - Cascade emission boost
- **CascadeParticleColorTinting_Session119.js** - Cascade color tinting
- **CascadeResonanceWaveVisualization_Session146.js** - Resonance wave visualization

### Wave & Flow Particles
- **WaveParticleEmitter_v1.js** - Wave particle emitter
- **WaveDynamicsShaderPack_v1.js** - Wave dynamics shader pack
- **WaveShaderMaterialPatch_v1.js** - Wave shader material patch
- **WAVE_INTERFERENCE_ENGINE_SNIPPETS.js** - Wave interference examples

### Healing & Recovery
- **HealingParticleSystem_Session136.js** - Healing particle system
- **HarmonicHealingVisualSystem_Session138.js** - Harmonic healing visuals

### Ritual Particles
- **_MythicRitualController.js** - Ritual particle bursts

### Corruption Particles
- **T2_CorruptionVisualIntegration_v1.js** - Corruption particle bursts
- **CorruptionVisualFX_v1.js** - Corruption particle effects

### Stress Particles
- **StressBasedParticleScaler_v1.js** - Stress-based particle scaling

### Ambient Particles
- **World.js** - Ambient particle drift
- **_AmbientEntityManager.js** - Ambient entity particles
- **VisualUpgradeSuperpack.js** - Dream particles pack

### UI Particles
- **_AIEmotionalFeed3_1.js** - Emotional feed particles (poetry display)

---

## Emitters

### Wave Emitters
- **WaveParticleEmitter_v1.js** - Wave particle emitter
- **HarmonicCascadeAmplification_Session145.js** - Harmonic cascade amplification

### Cascade Emitters
- **CascadeParticleSystem_Session120.js** - Cascade particle emission
- **CascadeParticleEmissionBoost_Session118.js** - Boosted cascade emission

### Synaptic Emitters
- **SynapticGatingAdapter_v1.js** - Synaptic gating pulse emission

### Ritual Emitters
- **_MythicRitualController.js** - Ritual burst emitter

---

## Aura Systems

### Core Aura Systems
- **NodeAuraSystem_v1.js** - Core node aura system
- **NodeLinkedAuraSystem.js** - Linked aura system
- **NodeLinkedAuraRenderer_Session146.js** - Aura renderer

### Fresnel Auras
- **FresnelAuraIntegrationPatch.js** - Fresnel aura integration
- **FresnelRimLightAuraShader.js** - Fresnel rim light shader
- **FresnelAuraIntegrationExample.js** - Fresnel integration examples

### Synergy Auras
- **SynergyDrivenAuraColorSystem.js** - Synergy-driven aura colors
- **SynergyAuraColorIntegrationPatch.js** - Synergy aura integration patch
- **SynergyAuraColorIntegrationExample.js** - Integration examples

### Harmony Auras
- **HarmonyAuraController.js** - Harmony aura controller
- **HarmonyAuraIntegrationGuide.js** - Harmony aura integration guide
- **HarmonyAuraShaderMaterial.js** - Harmony aura shader material
- **HarmonyStabilizationSystem_v1.js** - Harmony stabilization visuals
- **HarmonyStabilizationIntegrationPatch_v1.js** - Integration patch

### Harmonic Systems
- **HarmonicHubAuraIntegrationPatch_Session126.js** - Harmonic hub aura integration
- **HarmonicHubAuraSystem_Session126.js** - Harmonic hub aura system
- **HarmonicResonanceFeedbackSystem.js** - Resonance feedback visuals
- **HarmonicResonanceCoupling_v1.js** - Resonance coupling
- **HarmonicInfluencePropagationSystem_Session127.js** - Influence propagation
- **HarmonicInfluencePropagationIntegrationPatch_Session127.js** - Integration patch

### Aura Control
- **AuraModulationIntegration_v1.js** - Aura modulation integration
- **AuraModulationSystem.js** - Aura modulation system
- **GlobalAuraOpacityClamp.js** - Global opacity clamp
- **GlobalAuraOpacityClamp_Integration.js** - Integration
- **AuraLODCulling.js** - LOD culling
- **EmergencyAuraKillSwitch_v1.js** - Emergency kill switch

---

## Shaders

### Core Shaders (in /shaders/)
- **LinkLine.fragment.glsl** - Link fragment shader
- **LinkLine.vertex.glsl** - Link vertex shader
- **NodeAuraShader.js** - Node aura shader
- **LinkAuraShader.js** - Link aura shader
- **LinkAuraSystem_v1.js** - Link aura system shader
- **NeonEdgeGlowShader.js** - Neon edge glow shader
- **NeonPulseShader.js** - Neon pulse shader
- **RiftEnergyShader.js** - Rift energy shader
- **StressVisualShaders.js** - Stress visualization shaders
- **UtilityShaders.js** - Utility shader collection
- **AITechDistortionShader.js** - AI tech distortion shader
- **LinkStateVisualLanguage.js** - Link state visual language shader

### Wave Shaders
- **WaveDynamicsShaderPack_v1.js** - Wave dynamics pack
- **WaveShaderMaterialPatch_v1.js** - Wave shader patch
- **LinkSurfacePhaseRipples.js** - Surface ripples shader

### Special Effect Shaders
- **SynergyGlowShaderMaterial.js** - Synergy glow shader
- **StressTurbulenceShaderMaterial.js** - Stress turbulence shader
- **HarmonyAuraShaderMaterial.js** - Harmony aura shader
- **CoreHologramShader.js** - Hologram shader

### Extreme Shaders
- **_ExtremeAIShaderPack.js** - Extreme AI node shaders:
  - Quantum lattice shader
  - Fractal bloom shader
  - Reactive tesseract shader
  - Time-glitch shader

### Synergy Shaders
- **SynergyBonusFXLayer_v1.js** - Synergy bonus FX shader
- **SynergyVFX1_0.js** - Synergy VFX shaders

---

## Integration Wrappers

### Visual Authority & Hierarchy
- **VisualAuthority.js** - Visual authority system
- **VisualHierarchyRegistry.js** - Visual hierarchy registry
- **VisualLayerDebugger.js** - Visual layer debugger
- **CoreVisualAuthoritySystem.js** - Core visual authority

### Metrics Integration
- **LinkMetricsToVisualBridge_v1.js** - Metrics to visual bridge
- **MetricCompatibilityLayer.js** - Metrics compatibility layer
- **NodeDynamicMetrics.js** - Dynamic metrics integration

### FX Integration
- **FXPerformanceController_v1.js** - FX performance control
- **FXPerformanceScaler_v1.js** - FX performance scaling
- **FXPerformanceSmoothTransition_v1.js** - Smooth transitions
- **FXRuntime_v1.js** - FX runtime management
- **EventVisualSuppression_v1.js** - Event visual suppression

### Template Systems
- **VisualTemplateReferenceImplementations.js** - Template implementations
- **VisualTemplateRegistry.js** - Template registry
- **VisualTemplateResolver.js** - Template resolver

### System Integration
- **_VisualHierarchyCorrectionSystem_v1.js** - Hierarchy correction
- **VisualStateSnapshot.js** - Visual state snapshots
- **VisualAudit.js** - Visual audit system
- **VerifyLinkStateContractCompliance.js** - Contract compliance verifier

### Glyph Integration
- **_GlyphLayer4_MultiFusion.js** - Multi-fusion glyph layer
- **_RecursiveGlyphSignalSystem.js** - Recursive glyph signals
- **_SemanticGlyphAI.js** - Semantic glyph AI
- **_LinkedGlyphMessaging3_0.js** - Linked glyph messaging

### Adaptive Systems
- **_AdaptiveGlyphRendering1_0.js** - Adaptive glyph rendering
- **AdaptivePerformanceMonitor_v1.js** - Adaptive performance monitoring

---

## Visual Architecture Notes

### Render Order (VisualHierarchyRegistry)

**Node Layers (< 200):**
- AURA_BACKGROUND (-100)
- BASELINE_AURA (-10)
- CORE (0)
- SELECTION (5)
- NODE_LINKED (15)
- NODE_LINK_GLOW (18)
- PRIMARY_UI/UI_PRIMARY (80)
- EVOLUTION (90)
- FX (95)
- DEBUG_NODE (100)

**Link Layers (200-300):**
- LINK_SKIN (200)
- LINK_STRANDS (210)
- LINK_DIRECTIONAL (215)
- LINK_GLOW (220)
- LINK_PULSE (230)
- LINK_SPARKS (240)
- LINK_BEADS (245)
- LINK_IMPACTS (250)
- LINK_PARTICLES (260)

**World Layers (400+):**
- WORLD_BACKGROUND (400)
- WORLD_OVERLAY (450)

### Visual Layers
- **SHELL** - Hologram shells
- **AURA** - Auras and halos
- **VFX** - Particles and transient effects
- **GLYPH_LAYER** - Glyph systems
- **SELECTION_HIGHLIGHT** - Selection indicators

### Performance Optimization
- All visual systems respect performance budgets
- LOD culling available (AuraLODCulling.js)
- Performance controllers and scalers (FXPerformanceController_v1.js, FXPerformanceScaler_v1.js)
- Adaptive rendering (AdaptiveGlyphRendering1_0.js)

### Visual Safety Guarantees
- Visuals never modify gameplay state
- Visual layers are isolated from raycast interaction (VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js)
- All effects are reversible and safe to interrupt
- Zero impact on gameplay when missing (fail-safe design)

---

## System Dependencies

### Core Dependencies
- THREE.js for 3D rendering
- NodeLinkingSystem for link data
- AINodes for node data
- MetricsAuthority for metric signals

### Visual Authority Chain
```
VisualAuthority.js
  └─ VisualHierarchyRegistry.js
      └─ Individual Visual Systems
```

### Integration Pattern
```
Metrics → MetricsToVisualBridge → VisualSystems → GPU Shaders
```

---

## Maintenance Notes

### Active Systems (Production)
- NodeAuraSystem_v1.js
- LinkRendererConduit.js
- _AtomaGlyphSystem4_0.js
- VisualHierarchyRegistry.js
- FXPerformanceController_v1.js

### Experimental/Session-Based
- Session* prefixed files
- CascadeParticleSystem_Session120.js
- Harmonic* systems (Session 124-146)

### Legacy/Deprecated
- Files with Legacy* prefix
- Old node model filters
- Legacy link state systems

### Critical Integration Points
1. **VisualHierarchyRegistry** - All systems must register here
2. **LinkMetricsToVisualBridge** - Metrics to visuals translation
3. **FXPerformanceController** - Performance budgeting
4. **VisualAuthority** - Visual layer authority

---

**End of Visual Systems Inventory**