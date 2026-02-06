// ============================================================================
// [BOOT] SAFETY LOGGING - Module Load Verification
// ============================================================================
console.log('[BOOT] main.js loaded');

// ============================================================================
// PHASE B: FRAME SCHEDULER INTEGRATION
// ============================================================================
import * as THREE from 'three';
import { PlayerController, FirstPersonCameraController } from './rosie/controls/rosieControls.js';
import { World } from './World.js';
import { SigmaRiftChamber } from './SigmaRiftChamber.js';
import { DreamDesert } from './DreamDesert.js';
import { QuantumIsland } from './QuantumIsland.js';
import { FractalValley } from './FractalValley.js';
import { MemoryLane } from './MemoryLane.js';
import { AINodes } from './AINodes.js';
import { EnhancedNodeModels } from './EnhancedNodeModels.js';
import { ArchetypeVisualProfiles } from './ArchetypeVisualProfiles_v1.js';
import { ArchetypeVisualDifferentiationSystem_v1 } from './ArchetypeVisualDifferentiationSystem_v1.js';
import { patchArchetypeVisuals } from './ArchetypeVisualIntegrationPatch_v1.js';
// import { AtomaAudioSystem } from './AtomaAudioSystem.js';
// import { AtomaAudioModulation } from './AtomaAudioModulation.js';
import NodeLinkingSystem, { warmUpArchetypeShaders } from './NodeLinkingSystem.js';
import { CONFIG } from './config.js';
import { FrameClock } from './FrameClock.js';
import { FrameScheduler } from './FrameScheduler.js';
import { RenderCostProfile } from './RenderCostProfile.js';
import { sanitizeTransmission, findTransmissionMaterials } from './src/render/TransmissionSanitizer.js';
import { installMaterialDebugGuard } from './src/metrics/MaterialDebugGuard_v1.js';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';
import VisualTime from './src/time/VisualTime.js';
import { FrameUpdateLoopOrderValidator_v1 } from './FrameUpdateLoopOrderValidator_v1.js';
import { NodeEditor } from './NodeEditor.js';
import { EnvironmentalHazards } from './EnvironmentalHazards.js';
import { CinematicUpgrade } from './CinematicUpgrade.js';
import { VisualUpgradeSuperpack } from './VisualUpgradeSuperpack.js';
import { SafeEvolutionManager } from './_SafeEvolutionManager.js';
import { SafeLegendaryNodePack } from './_SafeLegendaryNodePack.js';
import { SafeLegendaryLinkFX } from './_SafeLegendaryLinkFX.js';
import { SafeLegendaryWorldEvents } from './_SafeLegendaryWorldEvents.js';
import { SafeAIWeatherPack } from './_SafeAIWeatherPack.js';
// DISABLED (Session 92): SafeNodePersonalityFX creates opaque plane overlays that obscure node identity
// import { SafeNodePersonalityFX } from './_SafeNodePersonalityFX.js';
import { SafeWorldFXPack } from './_SafeWorldFXPack.js';
import { AmbientEntityManager } from './_AmbientEntityManager.js';
import { SafeMemoryTrailsManager } from './SafeMemoryTrailsManager.js';
import { SafeQuantumIllusionsPack1 } from './SafeQuantumIllusionsPack1.js';
import { SafeColonyExpansion2 } from './SafeColonyExpansion2.js';
import { SafeDreamDepthPack } from './SafeDreamDepthPack.js';
import { DreamDepthEffectManager } from './DreamDepthEffectManager.js';
import { SafeMobilityPack4 } from './SafeMobilityPack4.js';
import { NodeVisuals4_0 } from './_NodeVisuals4_0.js';
import { RareNodeSpawner } from './_RareNodeSpawner.js';
import { setupRareNodeVerifier } from './_RareNodeSimulationVerifier.js';
import { setupSimulationInvariantEnforcement } from './_SIMULATION_INVARIANT_ENFORCEMENT.js';
import { setupSimulationAuditHelpers } from './_TASK_AUDIT_DEBUG_HELPERS.js';
import { setupRareNodeVerificationTracker } from './_TASK_3_RARE_NODE_VERIFICATION.js';
import { NodeEvolution2_0 } from './_NodeEvolution2_0.js';
import { SafeNodeArchetypesPack } from './_SafeNodeArchetypesPack.js';
import { EvolvingLinkFX2_0 } from './_EvolvingLinkFX2_0.js';
import { NodePersonality2_0 } from './NodePersonality2_0.js';
import { CoreMetricsOverlay } from './CoreMetricsOverlay.js';
import { createEmptyCoreMetricsViewModel, updateCoreMetricsViewModel } from './CoreMetricsViewModel.js';
import { SystemStateOverlay } from './SystemStateOverlay.js';
import { ZoneAudioReactivity } from './ZoneAudioReactivity.js';
import { relaxNodeMetrics } from './src/metrics/NodeMetricEngine.js';
// DISABLED: Legacy metric reactive system (replaced by Phase 5-7 architecture)
// import { MetricReactiveWorldEvents } from './MetricReactiveWorldEvents.js';
import { SafeWorldResetFix1_0 } from './SafeWorldResetFix1_0.js';
import { NodeInspectOverlay1_0 } from './NodeInspectOverlay1_0.js';
import { SafeMetricsFX1_1 } from './SafeMetricsFX1_1.js';
import { NodePersonalitySystem2_0 } from './NodePersonalitySystem2_0.js';
import { NodeMicroEvents } from './_NodeMicroEvents.js';
import { WorldPersonalityController } from './_WorldPersonalityController.js';
import { MythicRitualController } from './_MythicRitualController.js';
import { MythicNodeCreation } from './_MythicNodeCreation.js';
import { SimulationEffectOrchestrator } from './SimulationEffectOrchestrator.js';
import { MythicSeedGlyph } from './_MythicSeedGlyph.js';
import { LegacyDebugConeCleanup } from './_LegacyDebugConeCleanup.js';
// import { FractalHexMarker } from './_FractalHexMarker.js'; // DISABLED - legacy debug system
import { LegacyGlyphCleanup } from './_LegacyGlyphCleanup.js';
import { AtomaGlyphSystem3_0 } from './_AtomaGlyphSystem3_0.js';
import { AtomaGlyphSystem4_0 } from './_AtomaGlyphSystem4_0.js';
import { GlyphLayer4_MultiFusion } from './_GlyphLayer4_MultiFusion.js';
import { SemanticGlyphAI } from './_SemanticGlyphAI.js';
import { GlyphFusionOverlay4_1 } from './_GlyphFusionOverlay4_1.js';
import { ProceduralMeaningEngine } from './_ProceduralMeaningEngine.js';
import { LinkGlyphFlow } from './_LinkGlyphFlow.js';
import { GlyphPurityMode5_1 } from './_GlyphPurityMode5_1.js';
import { AdaptiveGlyphRendering1_0 } from './_AdaptiveGlyphRendering1_0.js';
import { LinkedGlyphSynchronization1_0 } from './_LinkedGlyphSynchronization1_0.js';
import { LinkedGlyphMessaging3_0 } from './_LinkedGlyphMessaging3_0.js';
import { RecursiveGlyphMessaging4_0 } from './_RecursiveGlyphMessaging4_0.js';
import { EmergentThoughtStorms5_0 } from './_EmergentThoughtStorms5_0.js';
import { AINarrativePatterns6_0 } from './_AINarrativePatterns6_0.js';
import { ExtremeAIShaderTestSuite } from './_ExtremeAIShaderTestSuite.js';
import { SafeNewNodeCategories1_0 } from './_SafeNewNodeCategories1_0.js';
import { NewNodeCategoryVisuals } from './_NewNodeCategoryVisuals.js';
import { ExtremeLinkVisualPack3 } from './_ExtremeLinkVisualPack3.js';
import { NeuralCurveLinkVisuals, setupNeuralCurveConsoleAPI } from './_NeuralCurveLinkVisuals.js';
import { AIConsciousnessLayer, setupAIConsciousnessConsoleAPI } from './AIConsciousnessLayer.js';
import { AIThoughtStorms2_0, setupAIThoughtStormsConsoleAPI } from './_AIThoughtStorms2_0.js';
import { ExtremeLinkVisuals4_0, setupExtremeLinkVisualsV4ConsoleAPI } from './_ExtremeLinkVisuals4_0.js';
import { LinkVisualMoodSystem, setupLinkMoodSystemConsoleAPI } from './LinkVisualMoodSystem.js';
import { LinkQualityCalculator } from './LinkQualityCalculator.js';
import { LinkDegradationSystem } from './LinkDegradationSystem.js';
import { LinkCollapseSystem } from './LinkCollapseSystem.js';
import { NetworkStressAggregator, setupNetworkStressAggregatorConsoleAPI } from './NetworkStressAggregator.js';
import { NodeShellSizeAuthority } from './NodeShellSizeAuthority.js';
import { ParticleEmissionScaler } from './ParticleEmissionScaler.js';
import { updateVariantBAdvisorHUD } from './ui/hud/VariantBAdvisorHUD.js';
import { getSharedPostProcessingPipeline } from './PostProcessing.js';

const ENABLE_SELECTED_NODE_BADGE = false;

// Global camera authority flag: default to first-person only
if (typeof window !== 'undefined') {
    window.CAMERA_AUTHORITY_MODE = window.CAMERA_AUTHORITY_MODE || 'fp_only';
    window.ATOMA_DISABLE_PARASITIC_HUDS = true;
    window.ATOMA_HARD_KILL_PARASITIC_DOM = true;
    window.ATOMA_HARD_OFF_LANGUAGE_ENGINE = true;
}

// Optional logging for program-count checkpoints
const PROGRAM_LOG = true;
const logPrograms = (label, renderer) => {
    if (!PROGRAM_LOG || !renderer?.info) return;
    const info = renderer.info;
    const count = Array.isArray(info.programs) ? info.programs.length : (info.programs ?? 0);
    console.log(`[prog] ${label}: programs=${count}`);
};
// Phase B.3 – program stabilization: dev-only watcher for new program creations
const PROGRAM_WATCH_ENABLED = false;
let __phaseB3LastProgramCount = 0;
// Disable per-frame visual-only ticks to reduce uniform churn/stutters
const VISUAL_TICKS_ENABLED = false;
window.__DEBUG_FRAME_BUDGET_ENABLED = false;   // master switch
window.__DEBUG_FRAME_BUDGET_MS = 3.0;         // max time allowed for heavy systems per frame
window.__DEBUG_FRAME_BUDGET_LOG = true;       // log offenders
window.__DBG_SPIKE_TRACE = false;             // set true to enable RAF spike tracing
window.__DBG_SPIKE_TRACE_THRESHOLD_MS = 200;  // frame duration threshold in ms
import { mountVariantBAdvisorHUD } from './ui/hud/VariantBAdvisorHUD.js';

// Lightweight parasitic HUD guard: remove unused fullscreen overlays if present
document.addEventListener('DOMContentLoaded', () => {
    const softGate = Boolean(window.ATOMA_DISABLE_PARASITIC_HUDS);
    const hardGate = Boolean(window.ATOMA_HARD_KILL_PARASITIC_DOM);
    const hardOffLanguage = Boolean(window.ATOMA_HARD_OFF_LANGUAGE_ENGINE);
    if (!softGate && !hardGate && !hardOffLanguage) return;

    const targetIds = new Set([
        'atoma-language-engine',
        'auto-link-tooltip-overlay'
    ]);

    if (hardGate || hardOffLanguage) {
        targetIds.add('atoma-language-engine-3-container');
        targetIds.add('auto-link-tooltip-overlay');
        if (!window.ATOMA_DEBUG_HUD_ENABLED) {
            targetIds.add('atoma-debug-hud');
        }
    }

    const targetClassPrefixes = (hardGate || hardOffLanguage)
        ? ['atoma-language-engine', 'atoma-node-poetry', 'atoma-pulse-poetry', 'atoma-link-whisper']
        : [];

    const selectorList = [
        ...Array.from(targetIds).map(id => `#${id}`),
        ...targetClassPrefixes.flatMap(prefix => [
            `[class^=\"${prefix}\"]`,
            `[class*=\" ${prefix}\"]`
        ])
    ];

    const selectors = selectorList.join(',');

    const removeTargets = (root) => {
        if (!selectors) return;
        root.querySelectorAll(selectors).forEach(node => node.parentNode?.removeChild(node));
    };

    removeTargets(document);

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (!(node instanceof Element)) return;
                if (selectors && node.matches?.(selectors)) {
                    node.parentNode?.removeChild(node);
                    return;
                }
                node.querySelectorAll?.(selectors).forEach(child => child.parentNode?.removeChild(child));
            });
        }
    });

    const body = document.body || document.documentElement;
    if (body && selectors) {
        observer.observe(body, { childList: true, subtree: true });
    }
});


// ============================================================================
// PHASE 1 LINK SYSTEMS REACTIVATION (Session 107+)
// Approved infrastructure recovery: LOW + MEDIUM risk systems
// ============================================================================
import { LinkCorrelationEngine1_0 } from './LinkCorrelationEngine1_0.js';
import { hardenNodeLinkingSystem } from './LinkingSystemHardening.js';
import { LinkHistoryTracker1_0 } from './LinkHistoryTracker1_0.js';

import { AtomaLanguageEngine2_0, setupAtomaNamingConsoleAPI } from './_AtomaLanguageEngine2_0.js';
import { NodeInspectLinguisticOverlay, setupLinguisticOverlayConsoleAPI } from './_NodeInspectLinguisticOverlay.js';
import { AtomaLanguageEngine3_0, setupAtomaLanguageEngine3ConsoleAPI } from './_AtomaLanguageEngine3_0.js';
import { setupCompleteVisualLock, teardownCompleteVisualLock } from './_VisualLockCompleteIntegration.js';
import { CoreVisualAuthoritySystem } from './CoreVisualAuthoritySystem.js';
import { VisualOverlayAuditSystem } from './VisualOverlayAuditSystem.js';
import { VisualLayerDebugger } from './VisualLayerDebugger.js';
import { VisualLayerEnforcementGate } from './VisualLayerEnforcementGate.js';
import { HologramShellAuthoritySystem } from './HologramShellAuthoritySystem.js';
import { setupVisualInteractionIsolation_v2, setupRaycastInteractionFiltering } from './VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js';
import { VisualAudit } from './VisualAudit.js';
import { initializeHardInteractionAuthority } from './HARD_INTERACTION_AUTHORITY_SYSTEM.js';
import { setupHardAuthorityDebugAPI } from './HARD_AUTHORITY_DEBUG_API.js';
import { NodeVisualIntegrityFix } from './NodeVisualIntegrityFix.js';
import { ControlledUnfreezeSystem_v1, setupControlledUnfreeze } from './ControlledUnfreezeSystem_v1.js';

// ============================================================================
// SESSION 105: LINK METRICS TO VISUAL BRIDGE (Real-time network metrics)
// ============================================================================
import { LinkMetricsToVisualBridge, setupLinkMetricsBridgeConsoleAPI } from './LinkMetricsToVisualBridge_v1.js';

// ============================================================================
// SESSION 106+: STRESS-BASED PARTICLE SCALER (Particle effects from link stress)
// ============================================================================
import { StressBasedParticleScaler_v1, setupStressParticleScalerConsoleAPI } from './StressBasedParticleScaler_v1.js';

// ============================================================================
// PARTICLE STREAM CASCADE ACCELERATION (Layer-depth based particle dynamics)
// Accelerates particles based on cascade layer depth, creating visual
// stratification that communicates network hierarchy through motion patterns
// ============================================================================
import { CascadingHarmonicResonanceAmplification } from './CascadingHarmonicResonanceAmplification.js';
import { ParticleStreamCascadeAcceleration } from './ParticleStreamCascadeAcceleration.js';
import { ParticleCascadeFlowDeflection } from './ParticleCascadeFlowDeflection.js';
import { ParticleStreamCascadeAccelerationIntegrationPatch } from './ParticleStreamCascadeAccelerationIntegrationPatch.js';
import { ParticleStreamCascadeAccelerationIntegrationSetup } from './ParticleStreamCascadeAccelerationIntegrationSetup.js';

// ============================================================================
// SESSION 117B+ EXTENDED: CASCADE PARTICLE EMISSION BOOST (Cascade → Particle FX)
// Drives particle emission on links affected by cascades
// ============================================================================
import { setupCascadeParticleEmissionBoost } from './CascadeParticleEmissionBoost_Session118.js';

// ============================================================================
// SESSION 119: CASCADE PARTICLE COLOR TINTING (Conflict-Type Color Coding)
// Colors particles based on conflict type (destructive, fatigue, oscillation, etc)
// ============================================================================
import { setupCascadeParticleColorTinting } from './CascadeParticleColorTinting_Session119.js';

// ============================================================================
// SESSION 120: SEMANTIC PARTICLE ENCODING (Shape & Velocity as Meaning)
// Encodes conflict type (shape) and propagation (velocity) into particles
// ============================================================================
import { setupCascadeParticleSystem } from './CascadeParticleSystem_Session120.js';

// ============================================================================
// SESSION 121: PARTICLE SEMANTIC DENSITY (Clustering & Density as Meaning)
// Encodes intensity and urgency through particle distribution
// ============================================================================
import { setupParticleSemanticDensity } from './ParticleSemanticDensityAdapter_Session121.js';

// ============================================================================
// SESSION 128: INFLUENCE ATTENUATION & ABSORPTION VISUALS
// Visualizes how harmonic influence weakens/absorbs at non-harmonic nodes
// ============================================================================
import { InfluenceAttenuationAbsorptionSystem_Session128 } from './InfluenceAttenuationAbsorptionSystem_Session128.js';

// ============================================================================
// SESSION 129: INFLUENCE REFLECTION & BACK-PRESSURE VISUALS
// Visualizes how resistant nodes reject influence through elastic reflection
// ============================================================================
import { InfluenceReflectionBackPressureSystem_Session129 } from './InfluenceReflectionBackPressureSystem_Session129.js';

// ============================================================================
// SESSION 130: STANDING WAVE & OSCILLATION TRAP VISUALS
// Visualizes energy trapped between opposing nodes, forming standing waves
// ============================================================================
import { StandingWaveOscillationTrapSystem_Session130 } from './StandingWaveOscillationTrapSystem_Session130.js';

// ============================================================================
// SESSION 131: STANDING WAVE VISUAL RENDERER
// Renders standing wave patterns, antinode glows, and trap zone visuals
// ============================================================================
import { StandingWaveVisualRenderer_Session131 } from './StandingWaveVisualRenderer_Session131.js';

// ============================================================================
// SESSION 132: WAVE INTERFERENCE PATTERN SYSTEM
// Visualizes constructive/destructive interference from colliding reflections
// ============================================================================
import { WaveInterferencePatternSystem_Session132 } from './WaveInterferencePatternSystem_Session132.js';

// ============================================================================
// SESSION 133: RESONANCE RUPTURE VISUAL SYSTEM
// Visualizes standing wave collapse under extreme pressure
// ============================================================================
import { ResonanceRuptureVisualSystem_Session133 } from './ResonanceRuptureVisualSystem_Session133.js';
import { HarmonicRecoveryVisualSystem_Session138 } from './HarmonicRecoveryVisualSystem_Session138.js';

// ============================================================================
// SESSION 134: HARMONIC HEALING VISUAL SYSTEM
// "Golden Wave" logic engine that drives healing particles
// ============================================================================
import { HarmonicHealingVisualSystem_Session134 } from './HarmonicHealingVisualSystem_Session134.js';

// ============================================================================
// SESSION 135: HARMONIC AUDIO REACTIVITY SYSTEM
// Transforms network state into living soundscape
// ============================================================================
import { HarmonicAudioReactivitySystem_Session135 } from './HarmonicAudioReactivitySystem_Session135.js';

// ============================================================================
// SESSION 136: HEALING PARTICLE SYSTEM
// Visual enhancement layer: Particle trails for healing waves and scar sparkles
// ============================================================================
import { HealingParticleSystem_Session136 } from './HealingParticleSystem_Session136.js';

// ============================================================================
// REGIONAL EQUILIBRIUM FIELD SYSTEM
// Visualizes long-term power balance and territorial equilibrium shifts
// via subtle ambient volumetric fields for each network region
// ============================================================================
import { RegionalEquilibriumFieldSystem } from './RegionalEquilibriumFieldSystem.js';

// ============================================================================
// CASCADING RUPTURE & CRITICAL NODE FAILURE SYSTEMS (Session 139+)
// Hybrid visual + mechanical systems for network collapse propagation
// ============================================================================
import { CascadingRuptureSystem } from './CascadingRuptureSystem.js';
import { CriticalNodeFailureSystem } from './CriticalNodeFailureSystem.js';
import { setupCascadeSystemConsoleAPI } from './CascadeSystemConsoleAPI.js';

// ============================================================================
// LINK SEMANTIC PICTOGRAM SYSTEM — ENHANCED WITH FUSION (Session 139+)
// Multi-layer semantic visual language with morphing, depth, flow intelligence, and glyph fusion
// ============================================================================
import { LinkSemanticPictogramSystem_WithFusion } from './LinkSemanticPictogramSystem_WithFusion.js';

// ============================================================================
// HARMONIC RESONANCE FEEDBACK SYSTEM (Session 140+)
// Composite glyphs emit subtle resonance fields influencing nearby link motion
// Closed visual feedback loop: meaning shapes motion
// ============================================================================
import { HarmonicResonanceFeedbackSystem, setupHarmonicResonanceConsoleAPI } from './HarmonicResonanceFeedbackSystem.js';

// ============================================================================
// RESONANCE ECHO TRAIL SYSTEM (Session 140+)
// Harmonic afterimages as temporal memory of composite glyph movement
// Stationary echo trails fade quietly, reinforcing continuity
// ============================================================================
import { ResonanceEchoTrailSystem, setupResonanceEchoConsoleAPI } from './ResonanceEchoTrailSystem.js';

// ============================================================================
// HARMONIC TOPOLOGY LEARNING SYSTEM (Session 140+)
// Visualizes long-term network learning through topology evolution
// Shows how repeated resonance, rupture, and fusion reshape flow patterns
// ============================================================================
import { HarmonicTopologyLearningSystem, setupHarmonicTopologyConsoleAPI } from './HarmonicTopologyLearningSystem.js';

// ============================================================================
// TOPOLOGY BIAS VISUALIZATION LAYER (Session 140+)
// Renders topology bias vectors and flow fields as dedicated visual layer
// Makes learned space perception visible through subtle directional hints
// ============================================================================
import { TopologyBiasVisualizationLayer, setupTopologyBiasVisualizationConsoleAPI } from './TopologyBiasVisualizationLayer.js';

// ============================================================================
// PROCEDURAL HARMONIC GLYPH GENERATOR (Session 140+ Polish)
// Generates emergent visual language from topology learning history
// Creates unique procedural glyphs representing learned network identity
// ============================================================================
import { ProceduralHarmonicGlyphGenerator, setupProceduralGlyphConsoleAPI } from './ProceduralHarmonicGlyphGenerator.js';

// ============================================================================
// REGIONAL HARMONIC CYCLE CONTROLLER (Session 140+ Polish - Animation)
// Manages harmonic activity cycles for regions
// Drives subtle glyph animation through cycle-based modulation
// ============================================================================
import { RegionalHarmonicCycleController, setupRegionalHarmonicCycleConsoleAPI } from './RegionalHarmonicCycleController.js';

// ============================================================================
// GLYPH ANIMATION MODULATOR (Session 140+ Polish - Animation)
// Applies harmonic cycle animations to procedural glyphs
// Makes glyphs breathe with regional harmonic activity
// ============================================================================
import { GlyphAnimationModulator, setupGlyphAnimationConsoleAPI } from './GlyphAnimationModulator.js';

// ============================================================================
// COMPOSITE GLYPH RESONANCE FEEDBACK (Session 140+ Visual-Only Feedback)
// Makes composite glyph resonance perceptible through subtle spatial & temporal cues
// Visual-only adapter: no gameplay logic, no new signals, pure perception
// ============================================================================
import { CompositeGlyphResonanceFeedback } from './CompositeGlyphResonanceFeedback.js';

// ============================================================================
// SESSION 108+: LINK MICRO-IMPULSES (Event-Driven Electrical Nervous Responses)
// ============================================================================
import { setupLinkMicroImpulseIntegration } from './LinkMicroImpulseIntegrationSetup.js';

// ============================================================================
// SESSION 108+ EXTENDED: PULSE INTERSECTION IMPULSES (Neural Firing on Wave Contact)
// ============================================================================
import { setupPulseIntersectionIntegration } from './PulseIntersectionIntegrationSetup.js';
import { setupPulseWaveSystemBridgeIntegration } from './PulseWaveSystemBridge_v1.js';
import { setupPulseBoundaryInteractionIntegration } from './PulseBoundaryInteractionAdapter_v1.js';
import { setupSynapticGatingIntegration } from './SynapticGatingAdapter_v1.js';
import { setupSynapticFatigueIntegration } from './SynapticFatigueAdapter_v1.js';
import { setupSynapticSpecializationIntegration } from './SynapticSpecializationAdapter_v1.js';

// ============================================================================
// SESSION 113+: COMPETITION & DOMINANCE VISUALIZATION (Territorial Politics)
// Specialized nodes compete for regional influence — pure visual storytelling
// Dominant nodes impose rhythm; contested zones shimmer with tension
// ============================================================================
import { CompetitionDominanceAdapter_v1, setupCompetitionDominanceIntegration } from './CompetitionDominanceAdapter_v1.js';

// ============================================================================
// SESSION 99: EMERGENCY VISUAL STABILIZATION HOTFIX (Critical Opaque Enforcement)
// ============================================================================
import { setupEmergencyVisualStabilization } from './HOTFIX_EmergencyVisualStabilization_v1.js';
import { setupNodeVisualFreezeMode } from './NodeVisualFreezeMode_v1.js';
import { installNodeVisualFreezeBlockers } from './NodeVisualFreezeBlockers_v1.js';
import { NodeLinkedAuraSystem } from './NodeLinkedAuraSystem.js';
import { setupLinkEligibilityGate } from './LinkEligibilityGate_v1.js';
import { setupLinkDebugMode } from './LinkDebugMode_v1.js';

// ============================================================================
// HIT PROXY SYSTEM & RAYCAST ISOLATION (Session 61+)
// ============================================================================
import { applyHitProxyIntegration, setupHitProxyDebugAPI } from './_HitProxyIntegrationPatch.js';
import { setupHitProxyAutoRegistrar } from './HitProxyAutoRegistrar.js';
import { setupGpuSanity } from './GpuSanityPass.js';

// ============================================================================
// PHASE 8: NETWORK RITUAL VISUAL ORCHESTRATION (Visual Ceremony Layer)
// Pure read-only visual consumption of ritual events — no gameplay logic
// ============================================================================
import { Phase8RitualVisualOrchestration, RITUAL_VISUAL_CONFIG } from './Phase8RitualVisualOrchestration.js';
import { Phase8VisualBridge } from './Phase8VisualBridge.js';

// ============================================================================
// SYNERGY VISUAL EFFECTS — Pure world-space visual feedback
// Non-intrusive breathing pulse + visual time elasticity on extreme synergy
// ============================================================================
import { SynergyPulseVisuals_v1, validateSynergyPulseVisuals } from './SynergyPulseVisuals_v1.js';
import { VisualNetworkTimeElasticity_v1, validateVisualNetworkTimeElasticity } from './VisualNetworkTimeElasticity_v1.js';
import { HarmonicResonanceCoupling_v1 } from './HarmonicResonanceCoupling_v1.js';
import { HarmonicHubAuraSystem_Session126 } from './HarmonicHubAuraSystem_Session126.js';
import { HarmonicInfluencePropagationSystem_Session127 } from './HarmonicInfluencePropagationSystem_Session127.js';
import { HarmonicCascadeAmplification_Session145, setupCascadeConsoleAPI } from './HarmonicCascadeAmplification_Session145.js';
import { VisualEchoTrails_v1 } from './VisualEchoTrails_v1_Shader.js';
import { VisualEchoTrails_v1_Integration, setupVisualEchoTrailsIntegration } from './VisualEchoTrails_v1_Integration.js';

// ============================================================================
// TIER 1 INTEGRATION: CORRUPTION & HARMONY SYSTEMS (Phase A)
// Core active mechanics: corruption propagation + harmony stabilization
// ============================================================================
import { LinkCorruptionTransmission_v1 } from './LinkCorruptionTransmission_v1.js';
import { HarmonyStabilizationSystem_v1 } from './HarmonyStabilizationSystem_v1.js';
import { setupCorruptionCascadeTestRunner } from './_T4003_CORRUPTION_CASCADE_TEST_RUNNER.js';
import { setupHarmonyHealingTestRunner } from './T4004_HARMONY_HEALING_TEST_RUNNER.js';

// ============================================================================
// TIER 2 VISUAL INTEGRATION — Visual System Wiring
// ============================================================================
// ✅ T2-001: Extreme Node Visuals (via _NodeVisuals4_0.js modifications)
// ✅ T2-002: Corruption Visual FX Integration
// ✅ T2-003: Harmony Visual Feedback Consumer
// ============================================================================
import { T2_CorruptionVisualIntegration_v1 } from './T2_CorruptionVisualIntegration_v1.js';
import { T2_HarmonyVisualConsumer_v1 } from './T2_HarmonyVisualConsumer_v1.js';

// ============================================================================
// TIER 4 GAMEPLAY INTEGRATION — Gameplay Layer
// ============================================================================
// ✅ T4-001: Core Gameplay Logic (link actions → mechanics)
// ✅ T4-002: Corruption Feedback Visuals (particle effects + indicators)
// ✅ T4-003: Gameplay Feedback UI (notifications + meters)
// ============================================================================
import { TIER4_GameplayIntegrationBridge } from './TIER4_GameplayIntegrationBridge_v1.js';

// ============================================================================
// PHASE 5: MULTI-NETWORK SYNCHRONIZATION — Inter-Network Dynamics
// ============================================================================
// ✅ P5-001: Multi-Network Manager (orchestrate multiple networks)
// ✅ P5-002: Corruption Bridge (spread corruption between networks)
// ✅ P5-003: Network Synchronization (keep networks in sync)
// ✅ P5-004: Inter-Network Connection Visuals (visual network flow)
// ✅ P5-005: Cascade Propagation Visuals (expanding rings on cascades)
// ============================================================================
import { PHASE5_MultiNetworkOrchestrator } from './PHASE5_MultiNetworkOrchestrator_v1.js';
//import { PHASE5_InterNetworkConnectionVisuals } from './PHASE5_InterNetworkConnectionVisuals_v1.js';
import { PHASE5_InterNetworkVisualizationBridge } from './PHASE5_InterNetworkVisualizationBridge_v1.js';

const VISUAL_SYSTEMS_ENABLED = false;
import { PHASE5_CascadePropagationVisuals } from './PHASE5_CascadePropagationVisuals_v1.js';
import { PHASE5_CascadeVisualizationBridge } from './PHASE5_CascadeVisualizationBridge_v1.js';

// ============================================================================
// DEFENSIVE HARDENING PATCH v1.0 (Session 24)
// Stabilizes runtime: iterable safety + post-link visual dominance correction
// ============================================================================
// [SESSION 56] DISABLED: correctPostLinkLayering - violated base visual state immutability
import { applyAllDefensivePatches } from './DefensiveHardeningPatch_v1.js';
// import { correctPostLinkLayering } from './DefensiveHardeningPatch_v1.js';  // DISABLED

// ============================================================================
// NODE CORE MATERIAL AUTHORITY SYSTEM v1.0 (Session 26)
// Ensures node core holographic materials can NEVER be overridden by auras
// Material-driven solution (NOT depth-buffer hacks)
// ============================================================================
import { NodeCoreMaterialAuthority, setupNodeCoreAuthorityConsoleAPI } from './NodeCoreMaterialAuthority.js';
import { nodeSpawnRegistry } from './NodeSpawnRegistry.js';

// ============================================================================
// EVENT VISUAL SUPPRESSION SYSTEM v1.0 (Session 26)
// Prevents event effects from diluting or occluding node cores
// Redirects event intensity to aura system instead
// ============================================================================
import { EventVisualSuppression_v1, setupEventSuppressionConsoleAPI } from './EventVisualSuppression_v1.js';

// ============================================================================
// AURA MODULATION SYSTEM v1.0 (Session 27)
// Receives redirected event intensity and modulates aura visually
// ============================================================================
import { AuraModulationSystem, setupAuraModulationConsoleAPI } from './AuraModulationSystem.js';
import { AuraModulationIntegration_v1, setupAuraModulationRedirection, setupAuraModulationIntegrationConsoleAPI } from './AuraModulationIntegration_v1.js';

// ============================================================================
// ENHANCED NODE MODEL LINK STATE v1.0 (Session 28)
// Boosts core visual presence when nodes are linked
// ============================================================================
// DISABLED (Session 56 Visual Authority Fix): EnhancedNodeModelLinkState violated base visual state immutability
// import { EnhancedNodeModelLinkState, setupEnhancedNodeModelLinkStateConsoleAPI } from './EnhancedNodeModelLinkState.js';

// ============================================================================
// GLOBAL AURA OPACITY CLAMP v1.0 (Session 28)
// Clamps all aura opacity to ≤ 0.10 after linking
// ============================================================================
import { GlobalAuraOpacityClamp, setupGlobalAuraOpacityClampConsoleAPI } from './GlobalAuraOpacityClamp.js';
import { integrateGlobalAuraOpacityClamp, setupGlobalAuraOpacityClampIntegrationConsoleAPI } from './GlobalAuraOpacityClamp_Integration.js';

// ============================================================================
// DYNAMIC LINK COLOR SYSTEM v1.0 (NEW)
// Real-time synergy-driven link color transitions
// ============================================================================
import { DynamicLinkColorSystem, setupDynamicLinkColorSystemConsoleAPI } from './DynamicLinkColorSystem.js';

// ============================================================================
// SYNERGY CASCADE PROPAGATION VISUALIZER v1.0 (NEW)
// Real-time visualization of synergy energy flowing through linked networks
// ============================================================================
import { SynergyCascadeVisualizer } from './SynergyCascadeVisualizer.js';

// ============================================================================
// CORE MATERIAL MUTATION DETECTOR v1.0 (Session 28)
// Automated detection and repair of core material mutations
// ============================================================================
import { CoreMaterialMutationDetector, setupCoreMutationDetectorConsoleAPI } from './CoreMaterialMutationDetector.js';
import { CoreMaterialMutationTestSuite, setupCoreMaterialTestSuiteConsoleAPI } from './CoreMaterialMutationTestSuite.js';

// ============================================================================
// CORE MATERIAL PROPERTY LOCK v1.0 (Session 30 - Hard Enforcement)
// Enforces immutability of core material properties at runtime
// Prevents opacity/transparent/depthWrite/emissive degradation
// ============================================================================
import { CoreMaterialPropertyLock, setupCoreMaterialPropertyLockConsoleAPI } from './CoreMaterialPropertyLock.js';

// ============================================================================
// NODE HIERARCHY SYSTEM v1.0 — Parent-Child Node Relationships
// Enables organizational hierarchies, property cascading, metrics aggregation
// ============================================================================
import { NodeHierarchyBridge } from './NodeHierarchyBridge_v1.js';



// ============================================================================
// NODE SURFACE PROTECTION RULE — DEPTH ANCHOR SYSTEM (DISABLED - Session 26)
// Replaced by NodeCoreMaterialAuthority (material-driven approach)
// ============================================================================
// import { setupNodeSurfaceProtection } from './NodeSurfaceProtection_DepthAnchor.js';

// ============================================================================
// SESSION 21: VISUAL HIERARCHY REGISTRY v1.0
// Single authoritative source for renderOrder values across visual layers
// ============================================================================
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// ============================================================================
// SESSION 20: VISUAL HIERARCHY CORRECTION SYSTEM v1.0
// Ensures core node geometry is always dominant and never occluded
// ============================================================================
import { VisualHierarchyCorrectionSystem_v1 } from './_VisualHierarchyCorrectionSystem_v1.js';

// ============================================================================
// NODE SURFACE PROTECTION RULE v2.0 (Session 24 Enhanced)
// Ensures node cores are never obscured by auras through dynamic opacity attenuation
// ============================================================================
// DISABLED: 503 server error on file load - will recreate from inline
// import { NodeSurfaceProtectionRule_v2 } from './NodeSurfaceProtectionRule_v2.js';

// ============================================================================
// PHASE 3C PERSONALITY VISUAL ADAPTER (Week 1 - Visual Personality Signals)
// ============================================================================
import { PersonalityVisualAdapter } from './NodePersonality_VisualAdapter.js';

// ============================================================================
// PHASE 3C PERSONALITY VFX LAYER (Week 2 - Visual Effects Application)
// ============================================================================
import { PersonalityVFXLayer_v1 } from './PersonalityVFXLayer_v1.js';

// ============================================================================
// PHASE 3C PERSONALITY SHADER BRIDGE (Week 3 - GPU Shader Integration)
// ============================================================================
import { PersonalityShaderBridge_v1 } from './PersonalityShaderBridge_v1.js';

// ============================================================================
// PHASE 3C PERSONALITY SHADER EFFECTS PACK (Week 4 - Advanced Visual Polish)
// ============================================================================
import { PersonalityShaderEffects_Pack_v1 } from './PersonalityShaderEffects_Pack_v1.js';

// ============================================================================
// PHASE 3C PERFORMANCE MODE (Centralized FX scaling controller)
// ============================================================================
import { FXPerformanceController_v1 } from './FXPerformanceController_v1.js';
import { FXPerformanceScaler_v1 } from './FXPerformanceScaler_v1.js';

// ============================================================================
// PHASE 3C ADAPTIVE PERFORMANCE MONITOR (FPS-based automatic LowFX toggle)
// ============================================================================
import { AdaptivePerformanceMonitor_v1 } from './AdaptivePerformanceMonitor_v1.js';

// ============================================================================
// PHASE 3C SMOOTH TRANSITION LAYER (Week 4.5 - Visual Polish)
// ============================================================================
import { FXPerformanceSmoothTransition_v1 } from './FXPerformanceSmoothTransition_v1.js';

// ============================================================================
// PHASE 3C PERSONALITY SHADER ADVANCED FX (Week 5 - Advanced Distortion)
// ============================================================================
import { PersonalityShaderAdvancedFX_v1 } from './PersonalityShaderAdvancedFX_v1.js';

// ============================================================================
// PHASE 3C ARCHETYPE ASCENSION CURVES (Week 13 - Personality-Driven Curves)
// ============================================================================
import { ArchetypeAscensionCurves_v1 } from './ArchetypeAscensionCurves_v1.js';

// ============================================================================
// PHASE 3C ARCHETYPE AURA ENHANCEMENT (Week 14 - GPU-Enhanced Halos)
// ============================================================================
import { ArchetypeAuraEnhancement_v1 } from './ArchetypeAuraEnhancement_v1.js';

// ============================================================================
// PHASE 3C ARCHETYPE COLOR PALETTE SYSTEM (Week 15 - Signal-Driven Colors)
// ============================================================================
import { ArchetypeColorPaletteSystem_v1 } from './ArchetypeColorPaletteSystem_v1.js';

// ============================================================================
// PHASE 3C ARCHETYPE SHADER MODES (Week 16 - GPU Shader Mode Orchestration)
// ============================================================================
import { ArchetypeShaderModes_v1 } from './ArchetypeShaderModes_v1.js';

// ============================================================================
// WEEK 17: ARCHETYPE NEURAL LINK VISUALIZATION (GPU Link Resonance)
// ============================================================================
import { ArchetypeNeuralLinkVis_v1 } from './ArchetypeNeuralLinkVis_v1.js';

// ============================================================================
// WEEK 18: NODE SELECTION SHADER ACTIVATION (Selection-Driven Intensity Boost)
// ============================================================================
import { NodeShaderActivation_v1 } from './NodeShaderActivation_v1.js';

// ============================================================================
// WEEK 18 (ALT): LINK PERSONALITY STATE MACHINE (Dynamic Link Personalities)
// ============================================================================
import { LinkPersonalityStateMachine_v1 } from './LinkPersonalityStateMachine_v1.js';

// ============================================================================
// WEEK 19: SYNERGY BONUS VISUALIZATION (High-Synergy Link Effects)
// ============================================================================
import { SynergyBonusVisualization_v1 } from './SynergyBonusVisualization_v1.js';

// ============================================================================
// WEEK 19 (ALT): SYNERGY BONUS FX LAYER (GPU-Based Synergy Flares)
// ============================================================================
import { SynergyBonusFXLayer_v1 } from './SynergyBonusFXLayer_v1.js';

// ============================================================================
// WEEK 20: SYNERGY RESONANCE SHADER PACK (Multi-Frequency Resonance FX)
// ============================================================================
import { SynergyResonanceShaderPack_v1 } from './SynergyResonanceShaderPack_v1.js';

// ============================================================================
// WEEK 21: AI NETWORK RESONANCE FEEDBACK (Network-Level Feedback System)
// ============================================================================
import { ResonanceFeedback_v1 } from './ResonanceFeedback_v1.js';

// ============================================================================
// WEEK 22: SYNERGY CHAIN REACTIONS (Emergent Cascade Events)
// ============================================================================
import { SynergyChainReaction_v1 } from './SynergyChainReaction_v1.js';

// ============================================================================
// WEEK 22B: SYNERGY CASCADE FX BRIDGE (Cascade → Shader Effects)
// ============================================================================
import { SynergyCascadeFXBridge_v1 } from './SynergyCascadeFXBridge_v1.js';

// ============================================================================
// WEEK 25 (BONUS): WAVE INTERFERENCE ENGINE (Multi-Origin Wave System)
// ============================================================================
import { WaveInterferenceEngine_v1 } from './WaveInterferenceEngine_v1.js';

// ============================================================================
// WEEK 25 (BONUS): WAVE SHADER BRIDGE (GPU Uniform Injection)
// ============================================================================
import { WaveShaderBridge_v1 } from './WaveShaderBridge_v1.js';

// ============================================================================
// WEEK 25 (BONUS): WAVE SHADER MATERIAL PATCH (GPU Shader Patching)
// ============================================================================
import { WaveShaderMaterialPatch_v1 } from './WaveShaderMaterialPatch_v1.js';

// ============================================================================
// WEEK 25 (BONUS): WAVE TRAVEL SHADER PACK (GPU Motion Effects)
// ============================================================================
import { WaveTravelShaderPack_v1 } from './WaveTravelShaderPack_v1.js';

// ============================================================================
// WEEK 25 (BONUS): WAVE DYNAMICS SHADER PACK (Advanced FX Layers)
// ============================================================================
import { WaveDynamicsShaderPack_v1 } from './WaveDynamicsShaderPack_v1.js';

// ============================================================================
// WEEK 27: WAVE PARTICLE EMITTER (GPU-Reactive Particle FX)
// ============================================================================
import { WaveParticleEmitter_v1 } from './WaveParticleEmitter_v1.js';

// ============================================================================
// EXTRACTION PACK V1.0 — RUNTIME ORCHESTRATION
// ============================================================================
import { MetricsRuntime_v1 } from './MetricsRuntime_v1.js';
import { PersonalityRuntime_v1 } from './PersonalityRuntime_v1.js';

// ============================================================================
// EXTRACTION PACK V1.1 — RUNTIME ORCHESTRATION (WORLD & FX)
// ============================================================================
import { WorldRuntime_v1 } from './WorldRuntime_v1.js';
// import { FXRuntime_v1 } from './FXRuntime_v1.js';

// ============================================================================
// EXTRACTION PACK V1.2 — RUNTIME ORCHESTRATION (NODE EDITOR & UI)
// ============================================================================
import { NodeEditorRuntime_v1 } from './NodeEditorRuntime_v1.js';

// ============================================================================
// EXTRACTION PACK V1.3 — RUNTIME ORCHESTRATION (INPUT HANDLING)
// ============================================================================
import { InputRuntime_v1 } from './InputRuntime_v1.js';

// ============================================================================
// HUD COLLAPSE SYSTEM 1.0 (Lightweight collapsible HUD management)
// ============================================================================
import { initializeHudCollapseSystem, verifyHudCollapseSystem } from './HudCollapseSystem1_0.js';

// ============================================================================
// INTEGRATION NODE SELECTION FIX (Targeted Compatibility)
// Enable selection of INTEGRATION nodes via parent chain resolution
// ============================================================================
import { patchIntegrationNodeSelection, setupIntegrationDebugAPI } from './_IntegrationNodeSelectionFix.js';

// ============================================================================
// SYNERGY ANALYSIS & SCORING SYSTEM (Session 19 Extended)
// ============================================================================
import { computeSynergyScore } from './ComputeSynergyScore2_0.js';
import { LinkRecommendationAI1_0 } from './LinkRecommendationAI1_0.js';
import { LinkAutomationEngine1_0 } from './LinkAutomationEngine1_0.js';

// ============================================================================
// AUTO LINK VISUALIZATION FEEDBACK UI 1.0 (Session 19 Extended)
// ============================================================================
import { AutoLinkFeedbackUI1_0 } from './AutoLinkFeedbackUI1_0.js';

// ============================================================================
// LINK QUALITY PREDICTOR 1.0 (Session 19 Extended)
// ============================================================================
import { LinkQualityPredictor1_0 } from './LinkQualityPredictor1_0.js';

// ============================================================================
// HUD SYNCHRONIZATION PATCH 1.0 (Session 27 Continuation)
// ============================================================================
import { SelectedHUDSyncPatch1_0 } from './SelectedHUDSyncPatch1_0.js';

// ============================================================================
// LINK PRIORITY DECAY ENGINE 1.0 (Session 27 Extended)
// ============================================================================
import { LinkPriorityDecayEngine } from './LinkPriorityDecayEngine.js';
import { LinkQualityFeedbackLoop1_0 } from './LinkQualityFeedbackLoop1_0.js';
import { LinkMLRecommendationEngine1_0 } from './LinkMLRecommendationEngine1_0.js';
import { UserAcceptanceTracker1_0 } from './UserAcceptanceTracker1_0.js';
import { NodeLinker2_RepairLayer1_0 } from './NodeLinker2_RepairLayer1_0.js';

// ============================================================================
// SYNERGY RECOMMENDATION DEBUG HUD 1.0 (Session 19 Extended)
// ============================================================================
import { SynergyRecommendationDebugHUD } from './SynergyRecommendationDebugHUD.js';

// ============================================================================
// ATOMA UI 3.1 - DISABLED (Replaced by 3.4–3.7)
// ============================================================================
// REMOVED: UINodeAutoDetect3_1, NodeLinking2_0, UINodeHoverTooltip3_1
import { UICategoryLegend3_1 } from './_UICategoryLegend3_1.js';
import { AIEmotionalFeed3_1 } from './_AIEmotionalFeed3_1.js';

// ============================================================================
// ATOMA UI 3.2 - Interaction Polishing & Selected Node System
// ============================================================================
import { UISelectedNodeHighlight3_2 } from './_UISelectedNodeHighlight3_2.js';
import { UINodeInspectPanel } from './UINodeInspectPanel.js';


// ============================================================================
// ATOMA UI 3.3 - Selected Node Identity + Safe Unlinking System
// ============================================================================
import { UISelectedNodeLabel3_3 } from './_UISelectedNodeLabel3_3.js';
import { SafeNodeUnlinking3_3 } from './_SafeNodeUnlinking3_3.js';

// ============================================================================
// ATOMA UI 3.4–3.7 - ACTIVE SYSTEMS (Core Selection + Primary Node Linking)
// ============================================================================
import { NodeSelectionCore3_4 } from './_NodeSelectionCore3_4.js';
import { NodeLinking2_3 } from './_NodeLinking2_3.js';
import { UIPrimaryNodeAura3_7 } from './_UIPrimaryNodeAura3_7.js';
import { UIPrimaryNodeTopBar3_7 } from './_UIPrimaryNodeTopBar3_7.js';
import { getSelectedHUD } from './UISelectedHUD.js';
// REMOVED: NodeLinking2_0, NodeLinking2_1, NodeLinking2_2 (superseded by 2.3)

// ============================================================================
// ATOMA DEBUG HUD 1.0 (Session 28 - In-Game Debug Monitoring)
// ============================================================================
import { AtomaDebugHUD_1_0 } from './AtomaDebugHUD_1_0.js';

/**
 * ATOMA - AI Dream Realm Simulation
 * A minimal, futuristic exploration experience
 * 
 * + Node Inspect Overlay 1.0 (SAFE Edition)
 * Pure HUD overlay for inspecting node archetypes and metrics
 * 
 * + Camera Steady Fix 1.0
 * Ensures camera remains perfectly stable (zero jitter)
 * 
 * + Safe Metrics FX 1.1
 * Subtle visual effects based on node metrics (15Hz throttled)
 * 
 * + Node Personality System 2.0 - SAFE ALL IN
 * Complete personality system with 10 types, safe visual behaviors
 * 
 * + Node Micro-Events 1.0 - SAFE EDITION
 * Personality-driven spontaneous events with event logs
 * 
 * + World Personality Controller 2.0 - SAFE EDITION
 * World reacts to global network mood (7 mood types)
 * 
 * + Mythic Ritual Controller 1.0 - SAFE EDITION
 * Rare ceremonial events (6 ritual types)
 * 
 * + Mythic Ritual Player 2.0 - PLAYER PARTICIPATION
 * Optional player interactions during rituals
 * 
 * + Mythic Node Creation - SAFE ALL-IN EDITION
 * Cinematic ritual to birth new mythic nodes
 */

/**
 * Phase E — Semantic Scheduling
 * Lightweight event bus for meaning-driven triggers.
 */
class SemanticEventBus {
    constructor() {
        this.handlers = new Map();
        this.priority = {
            CRITICAL: 0,
            INTERACTIVE: 1,
            NORMAL: 2,
            BACKGROUND: 3
        };
        this.eventQueues = [
            { items: [], head: 0 },
            { items: [], head: 0 },
            { items: [], head: 0 },
            { items: [], head: 0 }
        ];
        this.taskQueues = [
            { items: [], head: 0 },
            { items: [], head: 0 },
            { items: [], head: 0 },
            { items: [], head: 0 }
        ];
        this.stats = {
            eventsProcessed: [0, 0, 0, 0],
            tasksProcessed: [0, 0, 0, 0],
            lastDrainMsEvents: 0,
            lastDrainMsTasks: 0,
            cooledEvents: 0,
            droppedEvents: 0,
            decayedEvents: 0,
            aggregatedEvents: 0,
            escalatedEvents: 0,
            suppressedEvents: 0,
            budgetDeferredEvents: 0,
            budgetOverflows: 0,
            budgetUsed: 0,
            budgetMax: 0,
            starvedEventsRecovered: 0,
            starvationSkips: 0,
            fairnessBoostsApplied: 0
        };
        // Phase E.2: semantic decay / cooldown defaults
        // Phase E.3: semantic aggregation defaults
        // Phase E.4: semantic escalation / suppression defaults
        this.eventPolicies = new Map([
            ['metrics.spike', { decayStages: [{ afterMs: 500, priority: this.priority.INTERACTIVE }, { afterMs: 1500, priority: this.priority.NORMAL }], expiresMs: 2200, cooldownMs: 120, aggregateWithinMs: 500, aggregationStrategy: 'latest', escalate: { threshold: 2, toPriority: this.priority.CRITICAL, windowMs: 800, maxLevel: 1 }, suppress: { ifOverload: true, maxQueueDepth: 120, dropRateThreshold: 0.25 } }],
            ['node.selection', { decayStages: [{ afterMs: 300, priority: this.priority.INTERACTIVE }, { afterMs: 1200, priority: this.priority.NORMAL }], expiresMs: 2000, cooldownMs: 200, aggregateWithinMs: 250, aggregationStrategy: 'latest', escalate: { threshold: 3, toPriority: this.priority.CRITICAL, windowMs: 900, maxLevel: 1 }, suppress: { ifOverload: true, maxQueueDepth: 140 } }],
            ['hud.visibility.change', { decayStages: [{ afterMs: 500, priority: this.priority.NORMAL }], expiresMs: 1500, cooldownMs: 250, aggregateWithinMs: 300, aggregationStrategy: 'latest', escalate: { threshold: 2, toPriority: this.priority.INTERACTIVE, windowMs: 700, maxLevel: 1 }, suppress: { ifOverload: true, maxQueueDepth: 120 } }],
            ['camera.motion', { decayStages: [{ afterMs: 700, priority: this.priority.NORMAL }], expiresMs: 1800, cooldownMs: 120, aggregateWithinMs: 300, aggregationStrategy: 'sum', escalate: { threshold: 4, toPriority: this.priority.INTERACTIVE, windowMs: 600, maxLevel: 1 }, suppress: { ifOverload: true, maxQueueDepth: 160 } }]
        ]);
        this.cooldownMap = new Map();
        // Phase E.3: aggregation buffers keyed by semantic tag
        this.aggregationBuffers = new Map();
        // Phase E.4: escalation state per semantic key
        this.escalationState = new Map();
        // Phase E.4: suppression tracking (counts/timestamps for observability)
        this.suppressedTags = new Map();
        // Phase E.5: semantic budgets (per-frame meaning quota)
        this.semanticBudget = {
            maxUnitsPerFrame: 100,
            usedUnits: 0,
            costByPriority: {
                [this.priority.CRITICAL]: 50,
                [this.priority.INTERACTIVE]: 20,
                [this.priority.NORMAL]: 10,
                [this.priority.BACKGROUND]: 5
            }
        };
        // Phase E.6: starvation prevention (aging-based fairness)
        this.starvationConfig = {
            thresholdMs: 300,
            maxBoostPriority: this.priority.INTERACTIVE,
            boostStep: 1
        };
        this.starvationTracker = [
            performance.now(),
            performance.now(),
            performance.now(),
            performance.now()
        ];
        // Phase E.8: semantic tracing (bounded, passive time-travel buffer)
        this.semanticTrace = {
            enabled: true,
            maxEntries: 500,
            entries: [],
            drainCycle: 0
        };
        // Phase F.1: semantic → visual contract (frame-stable derived state for visuals)
        this.semanticVisualState = {
            pressure: 0,
            urgency: 0,
            calm: 1,
            congestion: 0,
            volatility: 0,
            focus: 0,
            anomalies: 0,
            __sources: {}
        };
        this.semanticVisualStateTimestamp = performance.now();
        // Phase F.2: semantic → motion intent (camera motion signals only, no direct movement)
        this.semanticMotionIntent = {
            drift: 0,
            pull: 0,
            tremor: 0,
            inertia: 0,
            zoomBias: 0,
            verticalBias: 0,
            __sources: {}
        };
        this.semanticMotionIntentTimestamp = performance.now();
        // Phase F.3: semantic → FX/atmosphere intent (read-only, no visual side effects)
        this.semanticAtmosphereState = {
            exposureBias: 0,
            contrastBias: 0,
            saturationBias: 0,
            fogDensity: 0,
            noiseAmount: 0,
            chromaticShift: 0,
            glowIntensity: 0,
            pulse: 0,
            __sources: {}
        };
        this.semanticAtmosphereTimestamp = performance.now();
        // Phase F.4: semantic → node material intent (read-only, no material mutations)
        this.semanticNodeMaterialIntent = {
            emissiveBoost: 0,
            glowBias: 0,
            wireIntensity: 0,
            opacityBias: 0,
            distortion: 0,
            pulse: 0,
            __sources: {}
        };
        this.semanticNodeMaterialTimestamp = performance.now();
        // Phase F.5: semantic → link/field intent (read-only, no link system mutations)
        this.semanticLinkFieldIntent = {
            tension: 0,
            flow: 0,
            coherence: 0,
            turbulence: 0,
            attenuation: 0,
            directionality: 0,
            __sources: {}
        };
        this.semanticLinkFieldTimestamp = performance.now();
        // Phase F.6: semantic → HUD/UI intent (read-only, no DOM changes)
        this.semanticHUDIntent = {
            alertness: 0,
            readability: 1,
            emphasis: 0,
            jitter: 0,
            density: 0,
            calmness: 1,
            __sources: {}
        };
        this.semanticHUDIntentTimestamp = performance.now();
        // Phase G.1: semantic guardrails & invariants (passive diagnostics only)
        this.semanticInvariants = {
            calmUrgencyMax: 1.2,
            maxEscalationDurationMs: 3000,
            maxJitterGrowthFrames: 10,
            maxSuppressionRatio: 0.6
        };
        this.semanticHealth = {
            score: 1,
            warnings: [],
            violations: [],
            lastCheck: performance.now(),
            profile: {
                active: 'default',
                modifiers: this.semanticProfiles?.default || {}
            },
            transition: {},
            recommendation: null,
            authority: {
                active: null,
                source: null,
                priority: 0,
                locks: {},
                constraints: {},
                remainingMs: null,
                resolved: this.semanticAuthorityState
            }
        };
        this.lastJitter = 0;
        this.jitterGrowthFrames = 0;
        this.escalationActiveSince = new Map();
        // Phase G.2: semantic time smoothing & hysteresis (passive, post-compute)
        this.semanticSmoothing = {
            enabled: true,
            alpha: 0.15,
            hysteresis: 0.05,
            minDeltaMs: 16
        };
        this.semanticSmoothingState = {
            visual: {},
            motion: {},
            atmosphere: {},
            nodeMaterial: {},
            hud: {},
            lastUpdate: 0
        };
        // Phase G.3: semantic profiles/modes (lens-only modulation, no logic changes)
        this.semanticProfiles = {
            default: {},
            zen: {
                smoothingAlphaScale: 1.0,
                volatilityScale: 0.7,
                urgencyScale: 0.8,
                calmBias: 0.05,
                jitterDamping: 0.3,
                motionInertiaScale: 1.1,
                hudEmphasisScale: 0.9,
                fxIntensityScale: 0.9
            },
            chaos: {
                smoothingAlphaScale: 1.0,
                volatilityScale: 1.3,
                urgencyScale: 1.2,
                calmBias: -0.05,
                anomalyAmplification: 1.2,
                jitterDamping: -0.1,
                motionInertiaScale: 0.9,
                hudEmphasisScale: 1.1,
                fxIntensityScale: 1.1
            },
            analytical: {
                smoothingAlphaScale: 1.0,
                volatilityScale: 0.9,
                urgencyScale: 1.0,
                calmBias: 0.02,
                anomalyAmplification: 1.1,
                jitterDamping: 0.2,
                motionInertiaScale: 1.2,
                hudEmphasisScale: 1.05,
                fxIntensityScale: 1.0
            },
            dream: {
                smoothingAlphaScale: 1.0,
                volatilityScale: 0.8,
                urgencyScale: 0.85,
                calmBias: 0.08,
                anomalyAmplification: 1.3,
                jitterDamping: 0.4,
                motionInertiaScale: 0.95,
                hudEmphasisScale: 0.95,
                fxIntensityScale: 1.05
            }
        };
        this.activeSemanticProfile = 'default';
        this.semanticProfileStack = {
            global: 'default',
            local: new Map(),
            context: []
        };
        this.semanticProfileTransition = {
            active: false,
            from: 'default',
            to: 'default',
            startTime: 0,
            durationMs: 600,
            easing: 'smoothstep'
        };
        this.semanticProfileLocalTransitions = new Map();
        this.semanticProfileTriggers = {
            zen: {
                when: (ctx) => ctx.visual.pressure < 0.3 && ctx.motion.inertia < 0.3 && ctx.health.violations.length === 0,
                confidence: (ctx) => 1 - (ctx.visual.volatility || 0),
                minConfidence: 0.6,
                cooldownMs: 4000,
                reason: 'low pressure + low motion + no violations'
            },
            chaos: {
                when: (ctx) => (ctx.visual.volatility || 0) > 0.7 || (ctx.visual.anomalies || 0) > 0.6,
                confidence: (ctx) => ctx.visual.volatility || 0,
                minConfidence: 0.65,
                cooldownMs: 5000,
                reason: 'high volatility or anomalies'
            },
            analytical: {
                when: (ctx) => (ctx.visual.focus || 0) > 0.6 && (ctx.motion.tremor || 0) < 0.3,
                confidence: (ctx) => ctx.visual.focus || 0,
                minConfidence: 0.6,
                cooldownMs: 4000,
                reason: 'focused state with low tremor'
            }
        };
        this.semanticProfileAutoAccept = false;
        this.semanticProfileRecommendation = null;
        this.semanticProfileTriggerCooldowns = new Map();
        // Phase G.7 — Narrative / Authority Locks (passive lens; no behavior change)
        this.semanticAuthorityLockState = {
            active: null,
            priority: 0,
            locks: {},
            constraints: {},
            source: null,
            startTime: 0,
            durationMs: 0
        };
        this.semanticAuthorityPrevious = {};
        this.semanticAuthorityPriorityDefs = {
            narrative: { priority: 100 },
            system: { priority: 80 },
            player: { priority: 60 },
            environment: { priority: 40 },
            ambient: { priority: 20 }
        };
        // Phase G.8: authority blending registry and resolved snapshot (passive only)
        this.semanticAuthorities = new Map();
        this.semanticAuthorityState = {
            global: { strength: 0, sources: [] },
            scopes: {},
            timestamp: performance.now()
        };
        // Phase G.9: profile gating (authority-damped profiles, lens-only)
        this.semanticProfileGate = {
            enabled: true,
            globalFactor: 1,
            perScope: {},
            sources: [],
            timestamp: performance.now()
        };
        // Phase G.10: semantic budgeting/backpressure (passive, lens-only)
        this.semanticBudgetConfig = {
            enabled: true,
            caps: {
                visual: 3,
                motion: 2,
                atmosphere: 3,
                nodeMaterial: 3,
                linkField: 3,
                hud: 2
            },
            decayRate: 0.4,
            recoveryRate: 0.25
        };
        this.semanticBudgetState = {
            factors: {
                visual: 1,
                motion: 1,
                atmosphere: 1,
                nodeMaterial: 1,
                linkField: 1,
                hud: 1
            },
            loads: {},
            timestamp: performance.now()
        };
    }
    subscribe(tag, handler, opts = {}) {
        if (!this.handlers.has(tag)) {
            this.handlers.set(tag, []);
        }
        const handlerPriority = this.normalizePriority(opts.priority);
        this.handlers.get(tag).push({ fn: handler, priority: handlerPriority });
    }
    emit(tag, payload, opts = {}) {
        const list = this.handlers.get(tag);
        if (!list || list.length === 0) return;
        const eventPriority = this.normalizePriority(opts.priority);
        const now = performance.now();
        const basePolicy = opts.policy || this.eventPolicies.get(tag);
        const policy = basePolicy ? { ...basePolicy } : undefined;
        if (policy) {
            if (opts.cooldownMs !== undefined) policy.cooldownMs = opts.cooldownMs;
            if (opts.cooldownKey !== undefined) policy.cooldownKey = opts.cooldownKey;
        }
        // Phase E.4: suppression pre-check before aggregation/cooldown
        if (this.shouldSuppress(tag, policy, eventPriority)) {
            this.stats.suppressedEvents++;
            this.recordTraceEntry({
                tag,
                originalPriority: eventPriority,
                finalPriority: eventPriority,
                queueAtInsert: null,
                queueAtExit: null,
                flags: { suppressed: true },
                policy,
                timestamp: now
            });
            return;
        }
        // Phase E.3: semantic aggregation before enqueue
        if (policy?.aggregateWithinMs) {
            this.handleAggregateEmit(tag, payload, list, eventPriority, policy, now);
            return;
        }
        this.enqueueEventInstances(tag, payload, list, eventPriority, policy, now);
    }
    // Phase E.3: aggregate similar semantic events within a short window before enqueueing
    handleAggregateEmit(tag, payload, handlers, eventPriority, policy, now) {
        const key = policy.aggregateKey || tag;
        const windowMs = policy.aggregateWithinMs;
        let buffer = this.aggregationBuffers.get(key);
        if (buffer && now - buffer.firstTimestamp >= windowMs) {
            this.flushAggregate(key, buffer, now);
            buffer = null;
        }
        if (!buffer) {
            buffer = {
                tag,
                handlers,
                policy,
                firstTimestamp: now,
                lastTimestamp: now,
                count: 1,
                aggregatedValue: this.initAggregateValue(payload, policy?.aggregationStrategy),
                latestPayload: payload,
                basePriority: eventPriority
            };
            this.aggregationBuffers.set(key, buffer);
            this.recordTraceEntry({
                tag,
                originalPriority: eventPriority,
                finalPriority: eventPriority,
                queueAtInsert: null,
                queueAtExit: null,
                flags: { aggregated: true },
                policy,
                timestamp: now
            });
            return;
        }
        buffer.lastTimestamp = now;
        buffer.count += 1;
        buffer.latestPayload = payload;
        buffer.basePriority = Math.min(buffer.basePriority, eventPriority);
        buffer.aggregatedValue = this.applyAggregationStrategy(buffer.aggregatedValue, payload, policy?.aggregationStrategy);
    }
    enqueueEventInstances(tag, payload, handlers, eventPriority, policy, now) {
        if (this.shouldSuppress(tag, policy, eventPriority)) {
            this.stats.suppressedEvents++;
            return false;
        }
        const cooldownMs = policy?.cooldownMs;
        const cooldownKey = policy?.cooldownKey || tag;
        if (cooldownMs) {
            const last = this.cooldownMap.get(cooldownKey);
            if (last !== undefined && now - last < cooldownMs) {
                this.stats.cooledEvents++;
                return false;
            }
            this.cooldownMap.set(cooldownKey, now);
        }
        const escalatedBase = this.applyEscalation(tag, eventPriority, policy, now);
        for (const handler of handlers) {
            const basePri = handler.priority ?? escalatedBase ?? eventPriority;
            const pri = Math.min(basePri, escalatedBase ?? basePri);
            const queue = this.eventQueues[pri];
            const evt = {
                name: tag,
                payload,
                handler: handler.fn,
                t: now,
                priority: pri,
                originalPriority: pri,
                policy
            };
            queue.items.push(evt);
            this.recordTraceEntry({
                tag,
                originalPriority: pri,
                finalPriority: pri,
                queueAtInsert: pri,
                queueAtExit: pri,
                flags: { aggregated: !!policy?.aggregateWithinMs },
                policy,
                timestamp: now
            });
        }
        return true;
    }
    scheduleTask(fn, opts = {}) {
        if (!fn) return;
        const pri = this.normalizePriority(opts.priority);
        const queue = this.taskQueues[pri];
        queue.items.push({ fn, priority: pri, label: opts.label });
    }
    drain(budgetMs = 1.0, maxEvents = 64) {
        const now = performance.now();
        this.flushAggregationWindows(now);
        const start = now;
        // Phase E.5: reset per-frame semantic budget before draining
        this.semanticBudget.usedUnits = 0;
        this.stats.budgetUsed = 0;
        this.stats.budgetMax = this.semanticBudget.maxUnitsPerFrame;
        this.semanticTrace.drainCycle += 1;
        let processed = 0;
        for (let pri = 0; pri < this.eventQueues.length; pri++) {
            const queue = this.eventQueues[pri];
            while (queue.head < queue.items.length) {
                if (processed >= maxEvents || performance.now() - start > budgetMs) {
                    this.stats.lastDrainMsEvents = performance.now() - start;
                    this.computeSemanticVisualState();
                    return processed;
                }
                const evt = queue.items[queue.head++];
                const now = performance.now();
                const decayedPriority = this.applyDecay(evt, now);
                if (decayedPriority === null) {
                    this.stats.droppedEvents++;
                    this.recordTraceEntry({
                        tag: evt.name,
                        originalPriority: evt.originalPriority,
                        finalPriority: evt.priority,
                        queueAtInsert: pri,
                        queueAtExit: null,
                        flags: { dropped: true },
                        policy: evt.policy,
                        timestamp: now,
                        age: now - evt.t
                    });
                    continue;
                }
                const fairnessResult = this.maybeBoostForFairness(decayedPriority, pri, evt, now);
                if (fairnessResult === 'requeued') {
                    this.recordTraceEntry({
                        tag: evt.name,
                        originalPriority: evt.originalPriority,
                        finalPriority: evt.priority,
                        queueAtInsert: pri,
                        queueAtExit: evt.priority,
                        flags: { fairnessBoosted: true },
                        policy: evt.policy,
                        timestamp: now,
                        age: now - evt.t
                    });
                    continue;
                }
                const effectivePriority = fairnessResult;
                if (decayedPriority > pri) {
                    evt.priority = decayedPriority;
                    const targetQueue = this.eventQueues[decayedPriority];
                    targetQueue.items.push(evt);
                    this.stats.decayedEvents++;
                    this.recordTraceEntry({
                        tag: evt.name,
                        originalPriority: evt.originalPriority,
                        finalPriority: evt.priority,
                        queueAtInsert: pri,
                        queueAtExit: decayedPriority,
                        flags: { decayed: true },
                        policy: evt.policy,
                        timestamp: now,
                        age: now - evt.t
                    });
                    continue;
                }
                if (!this.consumeBudget(effectivePriority)) {
                    // Defer: push back to end of its priority queue to be tried next frame
                    queue.items.push(evt);
                    this.stats.budgetDeferredEvents++;
                    if (evt.fairnessBoosted) {
                        this.stats.starvationSkips++;
                    }
                    this.recordTraceEntry({
                        tag: evt.name,
                        originalPriority: evt.originalPriority,
                        finalPriority: evt.priority,
                        queueAtInsert: pri,
                        queueAtExit: pri,
                        flags: { budgetDeferred: true },
                        policy: evt.policy,
                        timestamp: now,
                        age: now - evt.t
                    });
                    break;
                }
                try {
                    evt.handler(evt.payload);
                    this.stats.eventsProcessed[pri]++;
                    if (evt.fairnessBoosted) {
                        this.stats.starvedEventsRecovered++;
                    }
                    this.starvationTracker[pri] = now;
                    this.recordTraceEntry({
                        tag: evt.name,
                        originalPriority: evt.originalPriority,
                        finalPriority: evt.priority,
                        queueAtInsert: pri,
                        queueAtExit: pri,
                        flags: { executed: true, fairnessBoosted: !!evt.fairnessBoosted },
                        policy: evt.policy,
                        timestamp: now,
                        age: now - evt.t
                    });
                } catch (err) {
                    console.warn('[SemanticEventBus] handler error for', evt.name, err);
                }
                processed++;
            }
            if (queue.head > 64 && queue.head > queue.items.length / 2) {
                queue.items = queue.items.slice(queue.head);
                queue.head = 0;
            }
        }
        this.stats.lastDrainMsEvents = performance.now() - start;
        this.computeSemanticVisualState();
        this.computeSemanticMotionIntent();
        this.computeSemanticAtmosphereState();
        this.computeSemanticNodeMaterialIntent();
        this.computeSemanticLinkFieldIntent();
        this.computeSemanticHUDIntent();
        this.applySemanticSmoothing(now);
        this.resolveSemanticAuthorities(now);
        this.computeSemanticProfileGate(now);
        this.applySemanticProfile(now);
        this.applySemanticAuthorityLens(now);
        this.applySemanticBudgeting(now);
        this.evaluateSemanticProfileTriggers(now);
        this.evaluateSemanticInvariants();
        return processed;
    }
    drainTasks(budgetMs = 0.5, maxTasks = 32) {
        const start = performance.now();
        let processed = 0;
        for (let pri = 0; pri < this.taskQueues.length; pri++) {
            const queue = this.taskQueues[pri];
            while (queue.head < queue.items.length) {
                if (processed >= maxTasks || performance.now() - start > budgetMs) {
                    this.stats.lastDrainMsTasks = performance.now() - start;
                    return processed;
                }
                const task = queue.items[queue.head++];
                try {
                    task.fn();
                    this.stats.tasksProcessed[pri]++;
                } catch (err) {
                    console.warn('[SemanticEventBus] task error', err);
                }
                processed++;
            }
            if (queue.head > 64 && queue.head > queue.items.length / 2) {
                queue.items = queue.items.slice(queue.head);
                queue.head = 0;
            }
        }
        this.stats.lastDrainMsTasks = performance.now() - start;
        return processed;
    }
    // Phase E.3: flush aggregation buffers whose windows have elapsed before draining
    flushAggregationWindows(now) {
        if (this.aggregationBuffers.size === 0) return;
        const toFlush = [];
        for (const [key, buffer] of this.aggregationBuffers) {
            const windowMs = buffer.policy?.aggregateWithinMs;
            if (!windowMs || now - buffer.firstTimestamp >= windowMs) {
                toFlush.push([key, buffer]);
            }
        }
        for (const [key, buffer] of toFlush) {
            this.flushAggregate(key, buffer, now);
        }
    }
    flushAggregate(key, buffer, now) {
        if (!buffer) return;
        const aggregatedPayload = this.buildAggregatedPayload(buffer);
        this.enqueueEventInstances(
            buffer.tag,
            aggregatedPayload,
            buffer.handlers,
            buffer.basePriority,
            buffer.policy,
            now
        );
        this.stats.aggregatedEvents++;
        this.aggregationBuffers.delete(key);
    }
    buildAggregatedPayload(buffer) {
        const duration = buffer.lastTimestamp - buffer.firstTimestamp;
        const basePayload =
            buffer.latestPayload && typeof buffer.latestPayload === 'object'
                ? { ...buffer.latestPayload }
                : { value: buffer.latestPayload };
        basePayload.__aggregation = {
            count: buffer.count,
            duration,
            aggregatedValue: buffer.aggregatedValue,
            firstTimestamp: buffer.firstTimestamp,
            lastTimestamp: buffer.lastTimestamp
        };
        return basePayload;
    }
    initAggregateValue(payload, strategy) {
        switch (strategy) {
            case 'sum':
            case 'max':
                return this.toNumber(payload);
            case 'latest':
                return payload;
            case 'count':
            default:
                return 1;
        }
    }
    applyAggregationStrategy(currentValue, payload, strategy) {
        switch (strategy) {
            case 'sum':
                return (this.toNumber(currentValue) || 0) + this.toNumber(payload);
            case 'max':
                return Math.max(this.toNumber(currentValue), this.toNumber(payload));
            case 'latest':
                return payload;
            case 'count':
            default:
                return (typeof currentValue === 'number' && Number.isFinite(currentValue) ? currentValue : 0) + 1;
        }
    }
    toNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (value && typeof value === 'object') {
            if (typeof value.motion === 'number' && Number.isFinite(value.motion)) return value.motion;
            if (typeof value.value === 'number' && Number.isFinite(value.value)) return value.value;
            if (typeof value.severity === 'number' && Number.isFinite(value.severity)) return value.severity;
        }
        return 0;
    }
    getAggregationBufferSummary() {
        const now = performance.now();
        const summary = [];
        for (const [key, buffer] of this.aggregationBuffers) {
            summary.push({
                key,
                count: buffer.count,
                ageMs: now - buffer.firstTimestamp,
                windowMs: buffer.policy?.aggregateWithinMs ?? 0
            });
        }
        return summary;
    }
    // Phase E.8: trace entry creator (compact, ring-buffer)
    recordTraceEntry(data) {
        if (!this.semanticTrace.enabled) return;
        const entry = {
            timestamp: data.timestamp ?? performance.now(),
            frameIndex: this.semanticTrace.drainCycle,
            tag: data.tag,
            originalPriority: data.originalPriority,
            finalPriority: data.finalPriority,
            age: data.age ?? 0,
            queueAtInsert: data.queueAtInsert ?? null,
            queueAtExit: data.queueAtExit ?? null,
            flags: {
                suppressed: !!data.flags?.suppressed,
                cooled: !!data.flags?.cooled,
                aggregated: !!data.flags?.aggregated,
                escalated: !!data.flags?.escalated,
                decayed: !!data.flags?.decayed,
                fairnessBoosted: !!data.flags?.fairnessBoosted,
                budgetDeferred: !!data.flags?.budgetDeferred,
                dropped: !!data.flags?.dropped,
                executed: !!data.flags?.executed
            },
            policySnapshot: this.buildPolicySnapshot(data.policy)
        };
        const buf = this.semanticTrace.entries;
        if (buf.length >= this.semanticTrace.maxEntries) {
            buf.shift();
        }
        buf.push(entry);
    }
    buildPolicySnapshot(policy) {
        if (!policy) return null;
        return {
            hasDecay: !!(policy.decayStages || policy.halfLifeMs),
            hasCooldown: !!policy.cooldownMs,
            hasAggregation: !!policy.aggregateWithinMs,
            hasEscalation: !!policy.escalate,
            hasSuppression: !!policy.suppress
        };
    }
    setSemanticProfile(name) {
        if (!name || !this.semanticProfiles[name]) return this.activeSemanticProfile;
        if (name === this.activeSemanticProfile) return this.activeSemanticProfile;
        this.semanticProfileStack.global = name;
        this.semanticProfileTransition = {
            active: true,
            from: this.activeSemanticProfile,
            to: name,
            startTime: performance.now(),
            durationMs: this.semanticProfileTransition.durationMs || 600,
            easing: this.semanticProfileTransition.easing || 'smoothstep'
        };
        // Keep current profile active during blend; no smoothing reset
        return this.activeSemanticProfile;
    }
    setLocalSemanticProfile(key, name) {
        if (!key || !name || !this.semanticProfiles[name]) return;
        const current = this.semanticProfileStack.local.get(key);
        if (current === name) return;
        this.semanticProfileStack.local.set(key, name);
        this.semanticProfileLocalTransitions.set(key, {
            active: true,
            from: current || 'default',
            to: name,
            startTime: performance.now(),
            durationMs: this.semanticProfileTransition.durationMs || 600,
            easing: this.semanticProfileTransition.easing || 'smoothstep'
        });
    }
    clearLocalSemanticProfile(key) {
        if (!key) return;
        const current = this.semanticProfileStack.local.get(key);
        if (!current) return;
        this.semanticProfileStack.local.delete(key);
        this.semanticProfileLocalTransitions.set(key, {
            active: true,
            from: current,
            to: 'default',
            startTime: performance.now(),
            durationMs: this.semanticProfileTransition.durationMs || 600,
            easing: this.semanticProfileTransition.easing || 'smoothstep'
        });
    }
    pushContextSemanticProfile(name, ttlMs = 1000) {
        if (!name || !this.semanticProfiles[name]) return;
        const expiresAt = performance.now() + ttlMs;
        this.semanticProfileStack.context.push({
            name,
            from: 'default',
            t: 1,
            expiresAt
        });
    }
    // Phase G.7 — Narrative / Authority Locks
    setSemanticAuthority(name, config = {}) {
        if (!name) return this.semanticAuthorityLockState.active;
        const priorityDef = this.semanticAuthorityPriorityDefs[name];
        if (!priorityDef) return this.semanticAuthorityLockState.active;
        const now = performance.now();
        const incomingPriority = priorityDef.priority ?? 0;
        if (incomingPriority < (this.semanticAuthorityLockState.priority || 0)) {
            return this.semanticAuthorityLockState.active;
        }
        this.semanticAuthorityLockState = {
            active: name,
            priority: incomingPriority,
            locks: config.locks || {},
            constraints: config.constraints || {},
            source: config.source || null,
            startTime: now,
            durationMs: config.durationMs || 0
        };
        // register passive authority entry (G.8) as well
        const entryPriority = config.priority !== undefined ? config.priority : (priorityDef.priority || 0);
        const normPriority = entryPriority > 1 ? entryPriority / 100 : entryPriority;
        this.semanticAuthorities.set(name, {
            id: name,
            scope: config.scope || 'global',
            priority: normPriority,
            decayMs: config.decayMs ?? config.durationMs ?? null,
            startTime: now,
            blendMode: config.blendMode || 'max',
            source: config.source || name
        });
        return this.semanticAuthorityLockState.active;
    }
    clearSemanticAuthority(name) {
        if (!name || this.semanticAuthorityLockState.active !== name) return;
        this.semanticAuthorityLockState = {
            active: null,
            priority: 0,
            locks: {},
            constraints: {},
            source: null,
            startTime: 0,
            durationMs: 0
        };
        this.semanticAuthorities.delete(name);
    }
    applySemanticAuthority(state, domain) {
        const authority = this.semanticAuthorityLockState;
        if (!authority.active) return state;
        const now = performance.now();
        if (authority.durationMs && authority.startTime + authority.durationMs < now) {
            this.clearSemanticAuthority(authority.active);
            return state;
        }
        const lock = authority.locks[domain] || authority.locks['*'];
        if (!lock) return state;
        const constraints = authority.constraints[domain] || authority.constraints['*'] || {};
        const prev = this.semanticAuthorityPrevious[domain];
        const result = { ...state };
        if (lock === 'freeze') {
            const frozen = prev ? { ...prev } : { ...result };
            frozen.__authorityApplied = authority.active;
            this.semanticAuthorityPrevious[domain] = frozen;
            return frozen;
        }
        const clampVal = (v) => {
            let out = v;
            if (lock === 'scale' && typeof constraints.scale === 'number') {
                out = v * constraints.scale;
            }
            if (lock === 'clamp') {
                if (typeof constraints.min === 'number') out = Math.max(constraints.min, out);
                if (typeof constraints.max === 'number') out = Math.min(constraints.max, out);
            }
            return out;
        };
        for (const key of Object.keys(result)) {
            if (typeof result[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                result[key] = clampVal(result[key]);
            }
        }
        result.__authorityApplied = authority.active;
        this.semanticAuthorityPrevious[domain] = result;
        return result;
    }
    applySemanticAuthorityLens(now) {
        if (!this.semanticAuthorityLockState.active) return;
        this.semanticVisualState = this.applySemanticAuthority(this.semanticVisualState, 'visual');
        this.semanticMotionIntent = this.applySemanticAuthority(this.semanticMotionIntent, 'motion');
        this.semanticAtmosphereState = this.applySemanticAuthority(this.semanticAtmosphereState, 'atmosphere');
        this.semanticNodeMaterialIntent = this.applySemanticAuthority(this.semanticNodeMaterialIntent, 'nodeMaterial');
        this.semanticHUDIntent = this.applySemanticAuthority(this.semanticHUDIntent, 'hud');
    }
    // Phase G.8: authority blending & decay (passive resolution snapshot only)
    resolveSemanticAuthorities(now) {
        const epsilon = 0.0001;
        const resolved = {
            global: { strength: 0, sources: [] },
            scopes: {},
            timestamp: now
        };
        const scopeBuckets = new Map();
        const toDelete = [];
        for (const [id, entry] of this.semanticAuthorities.entries()) {
            const elapsed = Math.max(0, now - (entry.startTime || now));
            let strength = entry.priority || 0;
            if (entry.decayMs) {
                // linear decay toward 0 over decayMs
                const factor = Math.max(0, 1 - elapsed / entry.decayMs);
                strength = strength * factor;
            }
            if (strength <= epsilon) {
                toDelete.push(id);
                continue;
            }
            const scopes = entry.scope === 'global' ? ['global'] : Array.isArray(entry.scope) ? entry.scope : [entry.scope];
            for (const scope of scopes) {
                if (!scopeBuckets.has(scope)) scopeBuckets.set(scope, []);
                scopeBuckets.get(scope).push({
                    id: entry.id,
                    strength,
                    blendMode: entry.blendMode || 'max',
                    source: entry.source
                });
            }
        }
        for (const id of toDelete) {
            this.semanticAuthorities.delete(id);
        }
        const blendScope = (entries) => {
            let strength = 0;
            let weightedSum = 0;
            let weightTotal = 0;
            const sources = [];
            for (const e of entries) {
                sources.push({ id: e.id, strength: e.strength, blendMode: e.blendMode, source: e.source });
                switch (e.blendMode) {
                    case 'exclusive':
                        if (e.strength > strength) strength = e.strength;
                        break;
                    case 'additive':
                        strength = Math.min(1, strength + e.strength);
                        break;
                    case 'weighted':
                        weightedSum += e.strength * e.strength;
                        weightTotal += e.strength;
                        break;
                    case 'max':
                    default:
                        strength = Math.max(strength, e.strength);
                        break;
                }
            }
            if (weightTotal > 0) {
                strength = Math.max(strength, weightedSum / weightTotal);
            }
            return { strength: Math.min(1, strength), sources };
        };
        for (const [scope, entries] of scopeBuckets.entries()) {
            const blended = blendScope(entries);
            if (scope === 'global') {
                resolved.global = blended;
            } else {
                resolved.scopes[scope] = blended;
            }
        }
        this.semanticAuthorityState = resolved;
    }
    applySemanticBudgeting(now) {
        if (!this.semanticBudgetConfig.enabled) return;
        const clamps = {};
        const computeLoad = (state) => {
            if (!state) return 0;
            let sum = 0;
            for (const [k, v] of Object.entries(state)) {
                if (typeof v === 'number' && k !== '__smoothed' && k !== '__raw') {
                    sum += Math.abs(v);
                }
            }
            return sum;
        };
        const domains = {
            visual: this.semanticVisualState,
            motion: this.semanticMotionIntent,
            atmosphere: this.semanticAtmosphereState,
            nodeMaterial: this.semanticNodeMaterialIntent,
            linkField: this.semanticLinkFieldIntent,
            hud: this.semanticHUDIntent
        };
        const prevFactors = this.semanticBudgetState.factors || {};
        const newFactors = {};
        const loads = {};
        const { decayRate, recoveryRate } = this.semanticBudgetConfig;
        for (const [domain, state] of Object.entries(domains)) {
            const load = computeLoad(state);
            loads[domain] = load;
            const cap = this.semanticBudgetConfig.caps?.[domain] ?? Infinity;
            const targetFactor = load > cap && cap > 0 ? Math.max(0, cap / load) : 1;
            const prev = prevFactors[domain] ?? 1;
            const rate = targetFactor < prev ? decayRate : recoveryRate;
            const factor = prev + (targetFactor - prev) * rate;
            newFactors[domain] = Math.min(1, Math.max(0, factor));
            clamps[domain] = newFactors[domain];
        }
        const applyFactor = (state, domain) => {
            if (!state) return state;
            const factor = clamps[domain] ?? 1;
            if (factor >= 0.999) return state;
            const result = { ...state };
            for (const [k, v] of Object.entries(result)) {
                if (typeof v === 'number' && k !== '__smoothed' && k !== '__raw') {
                    result[k] = v * factor;
                }
            }
            result.__budgeted = true;
            result.budgetFactor = factor;
            return result;
        };
        this.semanticVisualState = applyFactor(this.semanticVisualState, 'visual');
        this.semanticMotionIntent = applyFactor(this.semanticMotionIntent, 'motion');
        this.semanticAtmosphereState = applyFactor(this.semanticAtmosphereState, 'atmosphere');
        this.semanticNodeMaterialIntent = applyFactor(this.semanticNodeMaterialIntent, 'nodeMaterial');
        this.semanticLinkFieldIntent = applyFactor(this.semanticLinkFieldIntent, 'linkField');
        this.semanticHUDIntent = applyFactor(this.semanticHUDIntent, 'hud');
        this.semanticBudgetState = {
            factors: newFactors,
            loads,
            timestamp: now
        };
    }
    computeSemanticProfileGate(now) {
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const globalStrength = this.semanticAuthorityState.global?.strength || 0;
        const globalFactor = clamp01(1 - globalStrength);
        const perScope = {};
        const sources = [];
        for (const [scope, data] of Object.entries(this.semanticAuthorityState.scopes || {})) {
            const factor = clamp01(1 - (data.strength || 0));
            perScope[scope] = factor;
            if (Array.isArray(data.sources)) {
                sources.push(...data.sources);
            }
        }
        this.semanticProfileGate = {
            enabled: this.semanticProfileGate.enabled !== false,
            globalFactor,
            perScope,
            sources,
            timestamp: now
        };
    }
    getProfileGateFactor(domain) {
        if (this.semanticProfileGate.enabled === false) return 1;
        const globalFactor = this.semanticProfileGate.globalFactor ?? 1;
        const scopeFactor = this.semanticProfileGate.perScope?.[domain] ?? 1;
        return Math.min(globalFactor, scopeFactor);
    }
    getSemanticProfileBlend(now) {
        const trans = this.semanticProfileTransition;
        if (!trans || !trans.active) {
            return { from: this.activeSemanticProfile, to: this.activeSemanticProfile, t: 1 };
        }
        const duration = trans.durationMs || 600;
        const elapsed = Math.max(0, now - (trans.startTime || now));
        let t = duration > 0 ? Math.min(1, elapsed / duration) : 1;
        // smoothstep easing
        t = t * t * (3 - 2 * t);
        return { from: trans.from, to: trans.to, t };
    }
    getLocalProfileBlend(key, now) {
        const trans = this.semanticProfileLocalTransitions.get(key);
        if (!trans || !trans.active) {
            const target = this.semanticProfileStack.local.get(key) || 'default';
            return { from: target, to: target, t: 1, name: target };
        }
        const duration = trans.durationMs || 600;
        const elapsed = Math.max(0, now - (trans.startTime || now));
        let t = duration > 0 ? Math.min(1, elapsed / duration) : 1;
        t = t * t * (3 - 2 * t);
        return { from: trans.from, to: trans.to, t, name: trans.to };
    }
    pruneContextProfiles(now) {
        if (!Array.isArray(this.semanticProfileStack.context)) return;
        this.semanticProfileStack.context = this.semanticProfileStack.context.filter(entry => !entry.expiresAt || entry.expiresAt > now);
    }
    resolveSemanticProfiles(now) {
        const layers = [];
        const globalBlend = this.getSemanticProfileBlend(now);
        layers.push({ name: globalBlend.to, from: globalBlend.from, to: globalBlend.to, t: globalBlend.t, source: 'global' });
        // local profiles sorted by specificity (longer key first)
        const locals = Array.from(this.semanticProfileStack.local.entries()).sort((a, b) => b[0].length - a[0].length);
        for (const [key, name] of locals) {
            const blend = this.getLocalProfileBlend(key, now);
            layers.push({ name, from: blend.from, to: blend.to, t: blend.t, source: 'local', key });
            if (blend.t >= 1 && this.semanticProfileLocalTransitions.has(key) && this.semanticProfileLocalTransitions.get(key).active) {
                const st = this.semanticProfileLocalTransitions.get(key);
                st.active = false;
                this.semanticProfileLocalTransitions.set(key, st);
            }
        }
        // context overrides (most recent last)
        this.pruneContextProfiles(now);
        for (const ctx of this.semanticProfileStack.context) {
            layers.push({ name: ctx.name, from: ctx.from || 'default', to: ctx.name, t: ctx.t || 1, source: 'context' });
        }
        return layers;
    }
    getSemanticContextSnapshot(now) {
        return {
            visual: this.semanticVisualState || {},
            motion: this.semanticMotionIntent || {},
            atmosphere: this.semanticAtmosphereState || {},
            nodeMaterial: this.semanticNodeMaterialIntent || {},
            hud: this.semanticHUDIntent || {},
            health: this.semanticHealth || {},
            activeProfile: this.semanticProfileStack.global,
            transition: this.semanticProfileTransition,
            authority: {
                lock: this.semanticAuthorityLockState,
                resolved: this.semanticAuthorityState
            },
            budget: this.semanticBudgetState,
            timestamp: now
        };
    }
    getSemanticProfileStack() {
        return {
            global: this.semanticProfileStack.global,
            local: Array.from(this.semanticProfileStack.local.entries()),
            context: Array.isArray(this.semanticProfileStack.context) ? [...this.semanticProfileStack.context] : []
        };
    }
    evaluateSemanticProfileTriggers(now) {
        if (!this.semanticProfileTriggers) return;
        if (this.semanticProfileTransition?.active) return;
        const ctx = this.getSemanticContextSnapshot(now);
        let best = null;
        for (const [name, trigger] of Object.entries(this.semanticProfileTriggers)) {
            if (!trigger || typeof trigger.when !== 'function' || typeof trigger.confidence !== 'function') continue;
            if (name === this.activeSemanticProfile) continue;
            const last = this.semanticProfileTriggerCooldowns.get(name);
            if (last && trigger.cooldownMs && now - last < trigger.cooldownMs) continue;
            if (!trigger.when(ctx)) continue;
            const conf = Math.min(1, Math.max(0, trigger.confidence(ctx)));
            if (conf < (trigger.minConfidence ?? 0)) continue;
            if (!best || conf > best.confidence) {
                best = { name, confidence: conf, reason: trigger.reason || 'semantic trigger matched' };
            }
        }
        if (best) {
            this.semanticProfileRecommendation = {
                suggested: best.name,
                confidence: best.confidence,
                reason: best.reason,
                timestamp: now
            };
            this.semanticProfileTriggerCooldowns.set(best.name, now);
            if (this.semanticProfileAutoAccept && best.confidence >= 0.75) {
                this.setSemanticProfile(best.name);
            }
        }
    }
    getQueueSizes() {
        return {
            events: this.eventQueues.map(q => q.items.length - q.head),
            tasks: this.taskQueues.map(q => q.items.length - q.head)
        };
    }
    getStats() {
        return {
            eventsProcessed: [...this.stats.eventsProcessed],
            tasksProcessed: [...this.stats.tasksProcessed],
            lastDrainMsEvents: this.stats.lastDrainMsEvents,
            lastDrainMsTasks: this.stats.lastDrainMsTasks,
            queueSizes: this.getQueueSizes(),
            cooledEvents: this.stats.cooledEvents,
            droppedEvents: this.stats.droppedEvents,
            decayedEvents: this.stats.decayedEvents,
            aggregatedEvents: this.stats.aggregatedEvents,
            escalatedEvents: this.stats.escalatedEvents,
            suppressedEvents: this.stats.suppressedEvents,
            budgetDeferredEvents: this.stats.budgetDeferredEvents,
            budgetOverflows: this.stats.budgetOverflows,
            budgetUsed: this.stats.budgetUsed,
            budgetMax: this.stats.budgetMax,
            starvedEventsRecovered: this.stats.starvedEventsRecovered,
            starvationSkips: this.stats.starvationSkips,
            fairnessBoostsApplied: this.stats.fairnessBoostsApplied,
            aggregationBuffers: this.getAggregationBufferSummary()
        };
    }
    normalizePriority(p) {
        if (p === undefined || p === null) return this.priority.NORMAL;
        return Math.min(Math.max(p, 0), 3);
    }
    // Phase E.2: apply semantic decay and expiry at drain time
    applyDecay(evt, now) {
        const policy = evt.policy;
        if (!policy) return evt.priority;
        const age = now - evt.t;
        if (policy.expiresMs !== undefined && age > policy.expiresMs) {
            return null;
        }
        let newPriority = evt.priority;
        if (policy.decayStages && policy.decayStages.length) {
            for (let i = 0; i < policy.decayStages.length; i++) {
                const stage = policy.decayStages[i];
                if (age >= stage.afterMs) {
                    newPriority = this.normalizePriority(stage.priority);
                }
            }
        } else if (policy.halfLifeMs) {
            const steps = Math.floor(age / policy.halfLifeMs);
            newPriority = this.normalizePriority(evt.originalPriority + steps);
        }
        return newPriority;
    }
    // Phase E.4: determine if an event should escalate or be suppressed before enqueue
    applyEscalation(tag, priorityValue, policy, now) {
        if (!policy?.escalate) return priorityValue;
        const esc = policy.escalate;
        let state = this.escalationState.get(tag);
        if (!state || now - state.windowStart > (esc.windowMs ?? 0)) {
            state = { count: 0, windowStart: now, level: 0 };
        }
        state.count += 1;
        let result = priorityValue;
        const cappedTarget = Math.max(0, Math.min(esc.toPriority ?? priorityValue, this.priority.CRITICAL));
        const canEscalate = state.count >= (esc.threshold ?? Infinity) && (esc.maxLevel === undefined || state.level < esc.maxLevel);
        if (canEscalate && priorityValue > cappedTarget) {
            result = cappedTarget;
            state.level += 1;
            state.count = 0; // reset within window after escalation to avoid runaway
            state.windowStart = now;
            this.stats.escalatedEvents++;
        }
        this.escalationState.set(tag, state);
        return result;
    }
    // Phase E.4: suppression gates low-value events under overload conditions
    shouldSuppress(tag, policy, priorityValue) {
        if (!policy?.suppress) return false;
        if (priorityValue === this.priority.CRITICAL) return false;
        const suppress = policy.suppress;
        if (suppress.ifOverload) {
            const depth = this.getTotalQueueDepth();
            if (suppress.maxQueueDepth && depth >= suppress.maxQueueDepth) {
                return true;
            }
            if (suppress.dropRateThreshold !== undefined) {
                const rate = this.getDropRate();
                if (rate >= suppress.dropRateThreshold) {
                    return true;
                }
            }
        }
        const now = performance.now();
        const existing = this.suppressedTags.get(tag) || { count: 0, last: 0 };
        this.suppressedTags.set(tag, { count: existing.count + 1, last: now });
        return false;
    }
    getTotalQueueDepth() {
        let depth = 0;
        for (let i = 0; i < this.eventQueues.length; i++) {
            const q = this.eventQueues[i];
            depth += q.items.length - q.head;
        }
        return depth;
    }
    getDropRate() {
        const totalEvents = this.stats.droppedEvents + this.stats.eventsProcessed.reduce((a, b) => a + b, 0);
        if (totalEvents === 0) return 0;
        return this.stats.droppedEvents / totalEvents;
    }
    // Phase E.6: fairness via aging boost to prevent starvation of lower priorities
    maybeBoostForFairness(decayedPriority, currentQueuePriority, evt, now) {
        if (decayedPriority <= this.starvationConfig.maxBoostPriority) return decayedPriority;
        if (evt.fairnessBoosted) return decayedPriority;
        const lastServiced = this.starvationTracker[currentQueuePriority] ?? 0;
        if (now - lastServiced < this.starvationConfig.thresholdMs) return decayedPriority;
        const step = this.starvationConfig.boostStep || 1;
        const targetPriority = Math.max(this.starvationConfig.maxBoostPriority, decayedPriority - step);
        if (targetPriority >= decayedPriority) return decayedPriority;
        evt.priority = targetPriority;
        evt.fairnessBoosted = true;
        this.eventQueues[targetPriority].items.push(evt);
        this.stats.fairnessBoostsApplied++;
        return 'requeued';
    }
    // Phase E.5: semantic budgets — consume budget units per event before execution
    consumeBudget(priorityValue) {
        const cost = this.semanticBudget.costByPriority[priorityValue] ?? 0;
        if (priorityValue === this.priority.CRITICAL) {
            this.semanticBudget.usedUnits += cost;
            this.stats.budgetUsed = this.semanticBudget.usedUnits;
            if (this.semanticBudget.usedUnits > this.semanticBudget.maxUnitsPerFrame) {
                this.stats.budgetOverflows++;
            }
            return true;
        }
        if (this.semanticBudget.usedUnits + cost > this.semanticBudget.maxUnitsPerFrame) {
            return false;
        }
        this.semanticBudget.usedUnits += cost;
        this.stats.budgetUsed = this.semanticBudget.usedUnits;
        return true;
    }
    // Phase E.7: semantic observability & introspection
    getSemanticSnapshot() {
        const now = performance.now();
        const queues = this.eventQueues.map((q) => {
            const headEvt = q.items[q.head];
            const headAge = headEvt ? now - headEvt.t : 0;
            return { length: q.items.length - q.head, headAge };
        });
        const activePolicies = [];
        for (const [tag, policy] of this.eventPolicies) {
            activePolicies.push({
                tag,
                decay: policy.decayStages || policy.halfLifeMs || null,
                aggregateWithinMs: policy.aggregateWithinMs || null,
                aggregationStrategy: policy.aggregationStrategy || null,
                cooldownMs: policy.cooldownMs || null,
                escalate: policy.escalate || null,
                suppress: policy.suppress || null
            });
        }
        const cooldowns = [];
        for (const [key, last] of this.cooldownMap) {
            const policy = this.eventPolicies.get(key);
            const cooldownMs = policy?.cooldownMs;
            const remaining = cooldownMs ? Math.max(0, cooldownMs - (now - last)) : 0;
            cooldowns.push({ key, remaining });
        }
        const suppressed = [];
        for (const [key, info] of this.suppressedTags) {
            suppressed.push({ key, count: info.count, last: info.last });
        }
        const aggregationBuffers = this.getAggregationBufferSummary();
        const escalation = [];
        for (const [key, state] of this.escalationState) {
            escalation.push({ key, level: state.level, count: state.count, windowStart: state.windowStart });
        }
        return {
            frameTimestamp: now,
            queues,
            activePolicies,
            budget: {
                used: this.semanticBudget.usedUnits,
                max: this.semanticBudget.maxUnitsPerFrame,
                deferred: this.stats.budgetDeferredEvents,
                overflows: this.stats.budgetOverflows
            },
            starvation: {
                lastServed: [...this.starvationTracker],
                boostsApplied: this.stats.fairnessBoostsApplied,
                recovered: this.stats.starvedEventsRecovered,
                skips: this.stats.starvationSkips
            },
            aggregation: {
                buffers: aggregationBuffers
            },
            suppression: {
                active: suppressed,
                cooldowns
            },
            escalation,
            stats: this.getStats()
        };
    }
    explainEvent(evt) {
        if (!evt) return null;
        const now = performance.now();
        const originalPriority = evt.originalPriority ?? evt.priority;
        const currentPriority = evt.priority;
        const policy = evt.policy || this.eventPolicies.get(evt.name);
        const cost = this.semanticBudget.costByPriority[currentPriority] ?? 0;
        const cooldownMs = policy?.cooldownMs;
        const lastCooldown = cooldownMs ? this.cooldownMap.get(policy.cooldownKey || evt.name) : undefined;
        const remainingCooldown = cooldownMs && lastCooldown ? Math.max(0, cooldownMs - (now - lastCooldown)) : 0;
        return {
            tag: evt.name,
            originalPriority,
            currentPriority,
            decayed: currentPriority > originalPriority,
            escalated: currentPriority < originalPriority,
            boosted: !!evt.fairnessBoosted,
            suppressed: false,
            cooled: cooldownMs ? remainingCooldown > 0 : false,
            cooldownRemainingMs: cooldownMs ? remainingCooldown : null,
            aggregated: !!(policy && policy.aggregateWithinMs),
            aggregationKey: policy?.aggregateKey || evt.name,
            budgetCost: cost,
            ageMs: now - evt.t
        };
    }
    // Phase E.8: semantic trace query / replay (observability only)
    getSemanticTrace(options = {}) {
        const { limit, tag, priority, sinceTimestamp } = options;
        const entries = [];
        for (let i = 0; i < this.semanticTrace.entries.length; i++) {
            const entry = this.semanticTrace.entries[i];
            if (tag && entry.tag !== tag) continue;
            if (priority !== undefined && entry.finalPriority !== priority && entry.originalPriority !== priority) continue;
            if (sinceTimestamp !== undefined && entry.timestamp < sinceTimestamp) continue;
            entries.push({ ...entry });
        }
        if (limit && entries.length > limit) {
            return entries.slice(entries.length - limit);
        }
        return entries;
    }
    replaySemanticTrace(callback) {
        if (typeof callback !== 'function') return;
        const snapshot = this.semanticTrace.entries.slice();
        for (let i = 0; i < snapshot.length; i++) {
            callback({ ...snapshot[i] });
        }
    }
    clearSemanticTrace() {
        this.semanticTrace.entries = [];
    }
    // Phase F.1: semantic → visual contract (derived, frame-stable state for visuals)
    computeSemanticVisualState() {
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const queues = this.getQueueSizes();
        const queueDepth = queues.events.reduce((a, b) => a + b, 0);
        const highDepth = queues.events[0] + queues.events[1];
        const budgetRatio = this.semanticBudget.maxUnitsPerFrame > 0 ? clamp01(this.semanticBudget.usedUnits / this.semanticBudget.maxUnitsPerFrame) : 0;
        const backlogRatio = clamp01(queueDepth / 200);
        const pressure = clamp01(budgetRatio * 0.6 + backlogRatio * 0.4);
        const urgency = clamp01((highDepth / (queueDepth + 1)) * 0.7 + backlogRatio * 0.3);
        const congestion = clamp01(backlogRatio * 0.7 + clamp01(this.aggregationBuffers.size / 20) * 0.3);
        const totalEvents = this.stats.droppedEvents + this.stats.eventsProcessed.reduce((a, b) => a + b, 0);
        const anomalies = clamp01((this.stats.droppedEvents + this.stats.starvedEventsRecovered + this.stats.budgetOverflows) / (totalEvents + 1));
        const volatility = clamp01((this.aggregationBuffers.size > 0 ? Math.min(this.aggregationBuffers.size / 10, 0.6) : 0) + clamp01(this.stats.fairnessBoostsApplied / (totalEvents + 1)) * 0.4);
        const focus = clamp01(1 - Math.min((this.aggregationBuffers.size + this.suppressedTags.size) / 10, 1));
        const calm = clamp01(1 - Math.max(pressure, congestion));
        this.semanticVisualState = {
            pressure,
            urgency,
            calm,
            congestion,
            volatility,
            focus,
            anomalies,
            __sources: {
                pressure: ['budgetUsed', 'queueDepth'],
                urgency: ['highPriorityDepth', 'queueDepth'],
                calm: ['pressure', 'congestion'],
                congestion: ['queueDepth', 'aggregationBuffers'],
                volatility: ['aggregationBuffers', 'fairnessBoostsApplied'],
                focus: ['aggregationBuffers', 'suppressedTags'],
                anomalies: ['droppedEvents', 'starvedEventsRecovered', 'budgetOverflows']
            }
        };
        this.semanticVisualStateTimestamp = performance.now();
    }
    getSemanticVisualState() {
        const state = this.semanticVisualState || {};
        return { ...state, __sources: state.__sources ? { ...state.__sources } : {} };
    }
    // Phase F.2: semantic → motion reducer (derived motion intent for camera; no movement applied)
    computeSemanticMotionIntent() {
        const svs = this.semanticVisualState || {};
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const clamp11 = (v) => Math.min(1, Math.max(-1, v));
        const drift = clamp11((svs.volatility || 0) * 0.5 - (svs.calm || 0) * 0.2);
        const pull = clamp01((svs.focus || 0) * 0.6 + (svs.urgency || 0) * 0.4);
        const tremorBase = clamp01((svs.volatility || 0) * 0.6 + (svs.anomalies || 0) * 0.5);
        const tremor = clamp01(Math.max(0, tremorBase - (svs.calm || 0) * 0.3));
        const inertia = clamp01((svs.pressure || 0) * 0.5 + (svs.congestion || 0) * 0.5);
        const zoomBias = clamp11((svs.pressure || 0) * 0.7 - (svs.calm || 0) * 0.3);
        const verticalBias = clamp11(((svs.calm || 0) * 0.5) - ((svs.anomalies || 0) * 0.3));
        this.semanticMotionIntent = {
            drift,
            pull,
            tremor,
            inertia,
            zoomBias,
            verticalBias,
            __sources: {
                drift: ['volatility', 'calm'],
                pull: ['focus', 'urgency'],
                tremor: ['volatility', 'anomalies', 'calm'],
                inertia: ['pressure', 'congestion'],
                zoomBias: ['pressure', 'calm'],
                verticalBias: ['calm', 'anomalies']
            }
        };
        this.semanticMotionIntentTimestamp = performance.now();
    }
    getSemanticMotionIntent() {
        const intent = this.semanticMotionIntent || {};
        return { ...intent, __sources: intent.__sources ? { ...intent.__sources } : {} };
    }
    // Phase F.3: semantic → atmosphere reducer (FX intent only; no rendering side effects)
    computeSemanticAtmosphereState() {
        const svs = this.semanticVisualState || {};
        const smi = this.semanticMotionIntent || {};
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const clamp11 = (v) => Math.min(1, Math.max(-1, v));
        const pressure = svs.pressure || 0;
        const calm = svs.calm || 0;
        const volatility = svs.volatility || 0;
        const anomalies = svs.anomalies || 0;
        const urgency = svs.urgency || 0;
        const exposureBias = clamp01(urgency * 0.6 + pressure * 0.2);
        const contrastBias = clamp01((1 - pressure) * 0.5 + calm * 0.3);
        const saturationBias = clamp01(calm * 0.6 + (1 - volatility) * 0.2);
        const fogDensity = clamp01(pressure * 0.7 + (1 - calm) * 0.2);
        const noiseAmount = clamp01(volatility * 0.6 + anomalies * 0.5);
        const chromaticShift = clamp01(anomalies * 0.7 + volatility * 0.2);
        const glowIntensity = clamp01(svs.focus ? svs.focus * 0.5 + urgency * 0.3 : urgency * 0.3);
        const pulse = clamp01(urgency * 0.5 + volatility * 0.3 + anomalies * 0.2);
        this.semanticAtmosphereState = {
            exposureBias,
            contrastBias,
            saturationBias,
            fogDensity,
            noiseAmount,
            chromaticShift,
            glowIntensity,
            pulse,
            __sources: {
                exposureBias: ['urgency', 'pressure'],
                contrastBias: ['pressure', 'calm'],
                saturationBias: ['calm', 'volatility'],
                fogDensity: ['pressure', 'calm'],
                noiseAmount: ['volatility', 'anomalies'],
                chromaticShift: ['anomalies', 'volatility'],
                glowIntensity: ['focus', 'urgency'],
                pulse: ['urgency', 'volatility', 'anomalies']
            }
        };
        this.semanticAtmosphereTimestamp = performance.now();
    }
    getSemanticAtmosphereState() {
        const state = this.semanticAtmosphereState || {};
        return { ...state, __sources: state.__sources ? { ...state.__sources } : {} };
    }
    // Phase F.4: semantic → node material reducer (intent only; rendering binds later)
    computeSemanticNodeMaterialIntent() {
        const svs = this.semanticVisualState || {};
        const sas = this.semanticAtmosphereState || {};
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const emissiveBoost = clamp01((svs.focus || 0) * 0.6 + (svs.urgency || 0) * 0.4);
        const glowBias = clamp01((sas.glowIntensity || 0) * 0.7 + (svs.calm || 0) * 0.3);
        const wireIntensity = clamp01((svs.pressure || 0) * 0.6 + (svs.congestion || 0) * 0.4);
        const opacityBias = clamp01((svs.calm || 0) * 0.7 - (svs.volatility || 0) * 0.4);
        const distortion = clamp01((svs.anomalies || 0) * 0.6 + (sas.noiseAmount || 0) * 0.4);
        const pulse = clamp01((sas.pulse || 0) * 0.6 + (svs.urgency || 0) * 0.4);
        this.semanticNodeMaterialIntent = {
            emissiveBoost,
            glowBias,
            wireIntensity,
            opacityBias,
            distortion,
            pulse,
            __sources: {
                emissiveBoost: ['focus', 'urgency'],
                glowBias: ['glowIntensity', 'calm'],
                wireIntensity: ['pressure', 'congestion'],
                opacityBias: ['calm', 'volatility'],
                distortion: ['anomalies', 'noiseAmount'],
                pulse: ['pulse', 'urgency']
            }
        };
        this.semanticNodeMaterialTimestamp = performance.now();
    }
    getSemanticNodeMaterialIntent() {
        const state = this.semanticNodeMaterialIntent || {};
        return { ...state, __sources: state.__sources ? { ...state.__sources } : {} };
    }
    // Phase F.5: semantic → link/field reducer (intent layer only; no link/shader changes)
    computeSemanticLinkFieldIntent() {
        const svs = this.semanticVisualState || {};
        const smi = this.semanticMotionIntent || {};
        const sas = this.semanticAtmosphereState || {};
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const tension = clamp01((svs.pressure || 0) * 0.6 + (svs.congestion || 0) * 0.4);
        const flow = clamp01((smi.drift ? Math.abs(smi.drift) : 0) * 0.5 + (svs.focus || 0) * 0.5);
        const coherence = clamp01((svs.calm || 0) * 0.7 - (svs.volatility || 0) * 0.4);
        const turbulence = clamp01((svs.volatility || 0) * 0.6 + (sas.noiseAmount || 0) * 0.4);
        const attenuation = clamp01((svs.calm || 0) * 0.6 - (svs.urgency || 0));
        const directionality = clamp01((smi.inertia || 0) * 0.6 + (svs.focus || 0) * 0.4);
        this.semanticLinkFieldIntent = {
            tension,
            flow,
            coherence,
            turbulence,
            attenuation,
            directionality,
            __sources: {
                tension: ['pressure', 'congestion'],
                flow: ['drift', 'focus'],
                coherence: ['calm', 'volatility'],
                turbulence: ['volatility', 'noiseAmount'],
                attenuation: ['calm', 'urgency'],
                directionality: ['inertia', 'focus']
            }
        };
        this.semanticLinkFieldTimestamp = performance.now();
    }
    getSemanticLinkFieldIntent() {
        const state = this.semanticLinkFieldIntent || {};
        return { ...state, __sources: state.__sources ? { ...state.__sources } : {} };
    }
    // Phase F.6: semantic → HUD/UI reducer (intent only; no DOM/UI mutation)
    computeSemanticHUDIntent() {
        const svs = this.semanticVisualState || {};
        const sas = this.semanticAtmosphereState || {};
        const smi = this.semanticMotionIntent || {};
        const slf = this.semanticLinkFieldIntent || {};
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const alertness = clamp01((svs.urgency || 0) * 0.5 + (svs.anomalies || 0) * 0.3 + (svs.volatility || 0) * 0.2);
        const readability = clamp01((svs.calm || 0) * 0.7 - (sas.noiseAmount || 0) * 0.2 - (slf.turbulence || 0) * 0.2);
        const emphasis = clamp01((svs.focus || 0) * 0.6 + (svs.pressure || 0) * 0.4);
        const jitter = clamp01((svs.volatility || 0) * 0.4 + (smi.tremor || 0) * 0.4 + (sas.noiseAmount || 0) * 0.2);
        const density = clamp01((svs.congestion || 0) * 0.5 + (slf.tension || 0) * 0.5);
        const calmness = clamp01((svs.calm || 0) * 0.7 - (svs.urgency || 0) * 0.3);
        this.semanticHUDIntent = {
            alertness,
            readability,
            emphasis,
            jitter,
            density,
            calmness,
            __sources: {
                alertness: ['urgency', 'anomalies', 'volatility'],
                readability: ['calm', 'noiseAmount', 'turbulence'],
                emphasis: ['focus', 'pressure'],
                jitter: ['volatility', 'tremor', 'noiseAmount'],
                density: ['congestion', 'tension'],
                calmness: ['calm', 'urgency']
            }
        };
        this.semanticHUDIntentTimestamp = performance.now();
    }
    getSemanticHUDIntent() {
        const state = this.semanticHUDIntent || {};
        return { ...state, __sources: state.__sources ? { ...state.__sources } : {} };
    }
    smoothValue(prev, next, alpha, hysteresis) {
        if (prev === undefined || prev === null) return next;
        if (Math.abs(next - prev) < hysteresis) return prev;
        return prev + alpha * (next - prev);
    }
    // Phase G.2: apply smoothing/hysteresis to derived semantic intents (no behavior change)
    applySemanticSmoothing(now) {
        if (!this.semanticSmoothing.enabled) return;
        if (now - this.semanticSmoothingState.lastUpdate < this.semanticSmoothing.minDeltaMs) return;
        const { alpha, hysteresis } = this.semanticSmoothing;
        const smoothState = (target, cacheKey) => {
            const prev = this.semanticSmoothingState[cacheKey] || {};
            const smoothed = { ...target };
            for (const key of Object.keys(smoothed)) {
                if (key === '__sources' || key === '__smoothed' || key === '__raw') continue;
                if (typeof smoothed[key] === 'number') {
                    const prevVal = typeof prev[key] === 'number' ? prev[key] : smoothed[key];
                    smoothed[key] = this.smoothValue(prevVal, smoothed[key], alpha, hysteresis);
                }
            }
            smoothed.__smoothed = true;
            smoothed.__raw = target;
            this.semanticSmoothingState[cacheKey] = smoothed;
            return smoothed;
        };
        this.semanticVisualState = smoothState(this.semanticVisualState, 'visual');
        this.semanticMotionIntent = smoothState(this.semanticMotionIntent, 'motion');
        this.semanticAtmosphereState = smoothState(this.semanticAtmosphereState, 'atmosphere');
        this.semanticNodeMaterialIntent = smoothState(this.semanticNodeMaterialIntent, 'nodeMaterial');
        this.semanticHUDIntent = smoothState(this.semanticHUDIntent, 'hud');
        this.semanticSmoothingState.lastUpdate = now;
    }
    // Phase G.3: apply semantic profile (lens-only modulation; post-smoothing, pre-invariants)
    applySemanticProfile(now) {
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const applyScaleBias = (value, scale, bias) => {
            let out = value;
            if (scale !== undefined) out = value * scale;
            if (bias !== undefined) out = out + bias;
            return clamp01(out);
        };
        const blendNumber = (a, b, tVal, biasDefault = 0, scaleDefault = 1) => {
            const va = a === undefined ? (scaleDefault !== 1 ? scaleDefault : biasDefault) : a;
            const vb = b === undefined ? (scaleDefault !== 1 ? scaleDefault : biasDefault) : b;
            return va + (vb - va) * tVal;
        };
        const blendProfileModifiers = (fromName, toName, tVal) => {
            const from = this.semanticProfiles[fromName] || {};
            const to = this.semanticProfiles[toName] || {};
            return {
                volatilityScale: blendNumber(from.volatilityScale, to.volatilityScale, tVal, 0, 1),
                urgencyScale: blendNumber(from.urgencyScale, to.urgencyScale, tVal, 0, 1),
                calmBias: blendNumber(from.calmBias, to.calmBias, tVal, 0, 0),
                anomalyAmplification: blendNumber(from.anomalyAmplification, to.anomalyAmplification, tVal, 0, 1),
                jitterDamping: blendNumber(from.jitterDamping, to.jitterDamping, tVal, 0, 0),
                motionInertiaScale: blendNumber(from.motionInertiaScale, to.motionInertiaScale, tVal, 0, 1),
                hudEmphasisScale: blendNumber(from.hudEmphasisScale, to.hudEmphasisScale, tVal, 0, 1),
                fxIntensityScale: blendNumber(from.fxIntensityScale, to.fxIntensityScale, tVal, 0, 1)
            };
        };
        const resolvedProfiles = this.resolveSemanticProfiles(now);
        const profileStackTag = { global: this.semanticProfileStack.global, local: [], context: [] };
        // Visual
        if (this.semanticVisualState) {
            let svs = { ...this.semanticVisualState };
            const gate = this.getProfileGateFactor('visual');
            for (const layer of resolvedProfiles) {
                const mods = blendProfileModifiers(layer.from, layer.to, layer.t);
                if (mods.volatilityScale !== undefined && typeof svs.volatility === 'number') {
                    svs.volatility = applyScaleBias(svs.volatility, mods.volatilityScale);
                }
                if (mods.urgencyScale !== undefined && typeof svs.urgency === 'number') {
                    svs.urgency = applyScaleBias(svs.urgency, mods.urgencyScale);
                }
                if (mods.calmBias !== undefined && typeof svs.calm === 'number') {
                    svs.calm = applyScaleBias(svs.calm, 1, mods.calmBias);
                }
                if (mods.anomalyAmplification !== undefined && typeof svs.anomalies === 'number') {
                    svs.anomalies = applyScaleBias(svs.anomalies, mods.anomalyAmplification);
                }
                if (layer.source === 'local') profileStackTag.local.push(layer.name);
                if (layer.source === 'context') profileStackTag.context.push(layer.name);
            }
            for (const key of Object.keys(svs)) {
                if (typeof svs[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                    svs[key] = svs[key] * gate;
                }
            }
            svs.__profileStack = profileStackTag;
            this.semanticVisualState = svs;
        }
        // Motion
        if (this.semanticMotionIntent) {
            let smi = { ...this.semanticMotionIntent };
            const gate = this.getProfileGateFactor('motion');
            for (const layer of resolvedProfiles) {
                const mods = blendProfileModifiers(layer.from, layer.to, layer.t);
                if (mods.motionInertiaScale !== undefined && typeof smi.inertia === 'number') {
                    smi.inertia = applyScaleBias(smi.inertia, mods.motionInertiaScale);
                }
            }
            for (const key of Object.keys(smi)) {
                if (typeof smi[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                    smi[key] = smi[key] * gate;
                }
            }
            smi.__profileStack = profileStackTag;
            this.semanticMotionIntent = smi;
        }
        // Atmosphere
        if (this.semanticAtmosphereState) {
            let sas = { ...this.semanticAtmosphereState };
            const gate = this.getProfileGateFactor('atmosphere');
            for (const layer of resolvedProfiles) {
                const mods = blendProfileModifiers(layer.from, layer.to, layer.t);
                if (mods.fxIntensityScale !== undefined) {
                    const applyFx = (key) => {
                        if (typeof sas[key] === 'number') {
                            sas[key] = applyScaleBias(sas[key], mods.fxIntensityScale);
                        }
                    };
                    applyFx('glowIntensity');
                    applyFx('pulse');
                    applyFx('noiseAmount');
                    applyFx('chromaticShift');
                }
            }
            for (const key of Object.keys(sas)) {
                if (typeof sas[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                    sas[key] = sas[key] * gate;
                }
            }
            sas.__profileStack = profileStackTag;
            this.semanticAtmosphereState = sas;
        }
        // Node material
        if (this.semanticNodeMaterialIntent) {
            let nm = { ...this.semanticNodeMaterialIntent };
            const gate = this.getProfileGateFactor('nodeMaterial');
            for (const layer of resolvedProfiles) {
                const mods = blendProfileModifiers(layer.from, layer.to, layer.t);
                if (mods.hudEmphasisScale !== undefined && typeof nm.emissiveBoost === 'number') {
                    nm.emissiveBoost = applyScaleBias(nm.emissiveBoost, mods.hudEmphasisScale);
                }
                if (mods.fxIntensityScale !== undefined && typeof nm.glowBias === 'number') {
                    nm.glowBias = applyScaleBias(nm.glowBias, mods.fxIntensityScale);
                }
            }
            for (const key of Object.keys(nm)) {
                if (typeof nm[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                    nm[key] = nm[key] * gate;
                }
            }
            nm.__profileStack = profileStackTag;
            this.semanticNodeMaterialIntent = nm;
        }
        // HUD
        if (this.semanticHUDIntent) {
            let hud = { ...this.semanticHUDIntent };
            const gate = this.getProfileGateFactor('hud');
            for (const layer of resolvedProfiles) {
                const mods = blendProfileModifiers(layer.from, layer.to, layer.t);
                if (mods.hudEmphasisScale !== undefined && typeof hud.emphasis === 'number') {
                    hud.emphasis = applyScaleBias(hud.emphasis, mods.hudEmphasisScale);
                }
                if (mods.jitterDamping !== undefined && typeof hud.jitter === 'number') {
                    hud.jitter = applyScaleBias(hud.jitter, 1 - mods.jitterDamping);
                }
            }
            for (const key of Object.keys(hud)) {
                if (typeof hud[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                    hud[key] = hud[key] * gate;
                }
            }
            hud.__profileStack = profileStackTag;
            this.semanticHUDIntent = hud;
        }
        if (this.semanticProfileTransition.active && this.getSemanticProfileBlend(now).t >= 1) {
            this.activeSemanticProfile = this.semanticProfileTransition.to;
            this.semanticProfileStack.global = this.semanticProfileTransition.to;
            this.semanticProfileTransition.active = false;
        }
        this.pruneContextProfiles(now);
    }
    // Phase G.1: evaluate semantic guardrails (passive; records diagnostics only)
    evaluateSemanticInvariants() {
        const now = performance.now();
        const warnings = [];
        const violations = [];
        const hud = this.semanticHUDIntent || {};
        const svs = this.semanticVisualState || {};
        const stats = this.stats || {};
        // Calm + alertness budget check
        if ((hud.calmness || 0) + (hud.alertness || 0) > this.semanticInvariants.calmUrgencyMax) {
            warnings.push('Calmness + alertness exceeds configured maximum.');
        }
        // Jitter growth trend
        const jitter = hud.jitter || 0;
        if (jitter > this.lastJitter) {
            this.jitterGrowthFrames += 1;
        } else {
            this.jitterGrowthFrames = 0;
        }
        this.lastJitter = jitter;
        if (this.jitterGrowthFrames > this.semanticInvariants.maxJitterGrowthFrames) {
            warnings.push('Jitter increasing over multiple frames.');
        }
        // Escalation duration
        if (this.escalationState) {
            for (const [key, state] of this.escalationState) {
                if (state.level > 0) {
                    const start = this.escalationActiveSince.get(key) ?? now;
                    this.escalationActiveSince.set(key, start);
                    if (now - start > this.semanticInvariants.maxEscalationDurationMs) {
                        violations.push(`Escalation active too long for ${key}.`);
                    }
                } else {
                    this.escalationActiveSince.delete(key);
                }
            }
        }
        // Suppression ratio
        const processedCount = Array.isArray(stats.eventsProcessed) ? stats.eventsProcessed.reduce((a, b) => a + b, 0) : 0;
        const totalEvents = processedCount + (stats.droppedEvents || 0) + (stats.suppressedEvents || 0);
        if (totalEvents > 0) {
            const suppressionRatio = (stats.suppressedEvents || 0) / totalEvents;
            if (suppressionRatio > this.semanticInvariants.maxSuppressionRatio) {
                warnings.push('Suppression ratio above threshold.');
            }
        }
        // Health score is informational only
        const score = Math.max(0, 1 - warnings.length * 0.1 - violations.length * 0.2);
        this.semanticHealth = {
            score,
            warnings,
            violations,
            lastCheck: now,
            profile: {
                active: this.semanticProfileStack.global,
                modifiers: this.semanticProfiles[this.semanticProfileStack.global] || {},
                stack: this.getSemanticProfileStack()
            },
            transition: {
                ...this.semanticProfileTransition
            },
            recommendation: this.semanticProfileRecommendation,
            authority: {
                active: this.semanticAuthorityLockState.active,
                source: this.semanticAuthorityLockState.source,
                priority: this.semanticAuthorityLockState.priority,
                locks: this.semanticAuthorityLockState.locks,
                constraints: this.semanticAuthorityLockState.constraints,
                remainingMs: this.semanticAuthorityLockState.durationMs
                    ? Math.max(0, (this.semanticAuthorityLockState.startTime + this.semanticAuthorityLockState.durationMs) - now)
                    : null,
                affectedDomains: Object.keys(this.semanticAuthorityLockState.locks || {}),
                resolved: this.semanticAuthorityState
            }
        };
    }
    getSemanticHealth() {
        return {
            score: this.semanticHealth.score,
            warnings: [...this.semanticHealth.warnings],
            violations: [...this.semanticHealth.violations],
            lastCheck: this.semanticHealth.lastCheck,
            profile: this.semanticHealth.profile,
            transition: this.semanticHealth.transition,
            recommendation: this.semanticHealth.recommendation,
            authority: this.semanticHealth.authority,
            profileGate: {
                active: this.semanticProfileGate.enabled !== false,
                global: this.semanticProfileGate.globalFactor,
                scopes: this.semanticProfileGate.perScope
            },
            budget: {
                factors: this.semanticBudgetState.factors,
                loads: this.semanticBudgetState.loads,
                timestamp: this.semanticBudgetState.timestamp
            }
        };
    }
    getSemanticBudgetState() {
        return {
            factors: this.semanticBudgetState.factors,
            loads: this.semanticBudgetState.loads,
            timestamp: this.semanticBudgetState.timestamp
        };
    }
}
/**
 * RUNTIME API ADAPTER: safeTick()
 * ============================================================================
 * Universal system execution adapter for ATOMA systems.
 * Eliminates runtime errors from mismatched update method names.
 * 
 * Tries execution methods in deterministic order:
 * 1. update(...)   - Standard method
 * 2. tick(...)     - Alternative method
 * 3. process(...) - Processing method
 * 4. step(...)     - Step method
 * 5. None         - Event-driven (silent, no crash)
 * 
 * Accepts variadic arguments, forwards all to the method.
 * 
 * GUARANTEES:
 * - Never throws if system missing or method unavailable
 * - Works with any current or future system
 * - Pure runtime wiring (zero class modifications)
 * - Deterministic behavior (always same method tried first)
 * - Handles single or multiple parameters transparently
 * 
 * Usage:
 *   safeTick(system, deltaTime);                  // Single param
 *   safeTick(system, deltaTime, currentTime);     // Multiple params
 */
function safeTick(system, ...args) {
  if (!system) return;

  if (typeof system.update === 'function') {
    system.update(...args);
    return;
  }

  if (typeof system.tick === 'function') {
    system.tick(...args);
    return;
  }

  if (typeof system.process === 'function') {
    system.process(...args);
    return;
  }

  if (typeof system.step === 'function') {
    system.step(...args);
    return;
  }

  // Event-driven systems or systems with no per-frame method: silent no-op
}

class AtomaGame {
    constructor() {
        // ========================================================================
        // STEP 1 — GLOBAL AUTHORITY FLAGS (CRITICAL STABILIZATION)
        // ========================================================================
        window.DEBUG_VISUAL_MODE = true;
        console.log("⚠️ DEBUG_VISUAL_MODE ENABLED - Visuals Disabled, Interactions Hardened");
        if (typeof window !== 'undefined' && window.DEBUG_VISUAL_MODE) {
            installMaterialDebugGuard();
        }
        document.documentElement.classList.add('atoma-no-blur');
        document.documentElement.classList.add('atoma-no-animated-glow');
        if (window?.ATOMA_DISABLE_PARASITIC_HUDS) {
            document.documentElement.classList.add('atoma-disable-parasitic-huds');
        }
        if (window?.ATOMA_HARD_KILL_PARASITIC_DOM) {
            document.documentElement.classList.add('atoma-hard-kill-parasitic-dom');
        }
        if (window?.ATOMA_HARD_OFF_LANGUAGE_ENGINE) {
            document.documentElement.classList.add('atoma-hard-off-language-engine');
        }
        
        // ========================================================================
        // STEP 1b — HARD INTERACTION AUTHORITY (Session 104 Critical Stabilization)
        // ========================================================================
        window.VISUAL_AUTHORITY_LOCK = true;
        console.log('🔒 [AtomaGame] VISUAL_AUTHORITY_LOCK ENABLED - Hard interaction authority engaged');

        document.addEventListener("contextmenu", e => e.preventDefault());
        
        // ================================
        //   🔥 DISABLE MYTHIC RITUALS 
        // ================================
        window.ATOMA_DISABLE_MYTHIC_RITUALS = true;
        console.log('🔥 [AtomaGame] Mythic Rituals globally disabled');
        
        this.clock = new THREE.Clock();
        this.time = 0;
        this.frameClock = new FrameClock();
        this.lastRenderFrame = -1;
        window.frameClock = this.frameClock;
        window.debugFrameClock = () => this.frameClock.getStats();
        this.updateValidator = new FrameUpdateLoopOrderValidator_v1();
        // L.3 OBSERVATION ONLY — DO NOT OPTIMIZE HERE
        this.renderProfile = new RenderCostProfile();
        if (typeof window !== 'undefined') {
            window.__ATOMA_RENDER_PROFILE__ = {
                getSnapshot: () => this.renderProfile.getSnapshot(),
                getAverages: () => this.renderProfile.getAverages(),
                reset: () => this.renderProfile.reset(),
                setEnabled: (enabled) => this.renderProfile.setEnabled(enabled)
            };
        }
        this.materialRegistry = materialRegistry;
        this.semanticBus = new SemanticEventBus();
        window.semanticBus = this.semanticBus;
        window.__ATOMA_SEMANTIC_STATS__ = () => this.semanticBus.getStats();
        window.__ATOMA_SEMANTIC_QUEUE__ = () => this.semanticBus.getQueueSizes();
        window.__ATOMA_SEMANTIC_DRAIN__ = (ms = 2) => this.semanticBus.drain(ms);
        // Phase E.7: semantic observability helpers (read-only views for HUD/console/agents)
        window.ATOMA_SEMANTIC_SNAPSHOT = () => this.semanticBus.getSemanticSnapshot();
        window.ATOMA_SEMANTIC_STATS = () => this.semanticBus.getStats();
        window.ATOMA_SEMANTIC_EXPLAIN = (evt) => this.semanticBus.explainEvent(evt);
        // Phase E.8: semantic trace replay APIs (time-travel debugging, read-only)
        window.ATOMA_SEMANTIC_TRACE = (opts) => this.semanticBus.getSemanticTrace(opts);
        window.ATOMA_SEMANTIC_REPLAY = (fn) => this.semanticBus.replaySemanticTrace(fn);
        window.ATOMA_SEMANTIC_TRACE_CLEAR = () => this.semanticBus.clearSemanticTrace();
        // Phase F.1: semantic → visual contract (read-only derived visual state)
        window.ATOMA_SEMANTIC_VISUAL_STATE = () => this.semanticBus.getSemanticVisualState();
        // Phase F.2: semantic → motion intent (read-only derived signals for camera layer)
        window.ATOMA_SEMANTIC_MOTION = () => this.semanticBus.getSemanticMotionIntent();
        // Phase F.3: semantic → FX/atmosphere intent (read-only derived signals for future FX binding)
        window.ATOMA_SEMANTIC_ATMOSPHERE = () => this.semanticBus.getSemanticAtmosphereState();
        // Phase F.4: semantic → node material intent (read-only derived signals for material binding)
        window.ATOMA_SEMANTIC_NODE_MATERIAL = () => this.semanticBus.getSemanticNodeMaterialIntent();
        // Phase F.5: semantic → link/field intent (read-only derived signals for link/field binding)
        window.ATOMA_SEMANTIC_LINK_FIELD = () => this.semanticBus.getSemanticLinkFieldIntent();
        // Phase F.6: semantic → HUD/UI intent (read-only derived signals for HUD binding)
        window.ATOMA_SEMANTIC_HUD = () => this.semanticBus.getSemanticHUDIntent();
        // Phase G.1: semantic guardrails diagnostics (read-only health snapshot)
        window.ATOMA_SEMANTIC_HEALTH = () => this.semanticBus.getSemanticHealth();
        // Phase G.2: semantic smoothing observability (read-only config/state)
        window.ATOMA_SEMANTIC_SMOOTHING = () => ({
            config: this.semanticBus.semanticSmoothing,
            state: this.semanticBus.semanticSmoothingState
        });
        // Phase G.3: semantic profile controls (lens-only modulation)
        window.ATOMA_SEMANTIC_PROFILE_GET = () => this.semanticBus.activeSemanticProfile;
        window.ATOMA_SEMANTIC_PROFILE_SET = (name) => this.semanticBus.setSemanticProfile(name);
        window.ATOMA_SEMANTIC_PROFILES = () => Object.keys(this.semanticBus.semanticProfiles || {});
        window.ATOMA_SEMANTIC_PROFILE_TRANSITION = () => ({ ...this.semanticBus.semanticProfileTransition });
        window.ATOMA_SEMANTIC_PROFILE_RECOMMENDATION = () => this.semanticBus.semanticProfileRecommendation;
        window.ATOMA_SEMANTIC_PROFILE_TRIGGERS = () => Object.keys(this.semanticBus.semanticProfileTriggers || {});
        window.ATOMA_SEMANTIC_PROFILE_STACK = () => this.semanticBus.getSemanticProfileStack();
        window.ATOMA_SEMANTIC_AUTHORITY_GET = () => ({ ...this.semanticBus.semanticAuthorityLockState });
        window.ATOMA_SEMANTIC_AUTHORITY_SET = (name, cfg) => this.semanticBus.setSemanticAuthority(name, cfg);
        window.ATOMA_SEMANTIC_AUTHORITY_CLEAR = (name) => this.semanticBus.clearSemanticAuthority(name);
        window.ATOMA_SEMANTIC_AUTHORITIES = () => ({
            active: Array.from(this.semanticBus.semanticAuthorities.values()),
            resolved: this.semanticBus.semanticAuthorityState
        });
        window.ATOMA_SEMANTIC_PROFILE_GATE = () => ({
            gate: this.semanticBus.semanticProfileGate,
            authority: this.semanticBus.semanticAuthorityState
        });
        window.ATOMA_SEMANTIC_BUDGET = () => this.semanticBus.getSemanticBudgetState();
        this.hudAccumulator = 0;
        this.hudTargetHz = 20;
        this.hudLastPos = new THREE.Vector3();
        this.hudLastRot = new THREE.Euler();
        this.hudTempDelta = new THREE.Vector3();
        this.hudWakeUntil = 0;
        this.hudCriticalAcc = 0;
        this.hudAmbientAcc = 0;
        this.hudVisibility = {
            critical: true,
            ambient: true,
            panels: {
                nodeInspector: false,
                metricsOverlay: true,
                systemState: true,
                zoneOverlay: false
            }
        };
        this.hudDirty = {
            coreMetrics: true,
            nodeInspector: false,
            ambient: true
        };
        this.lastCameraMotionEvent = 0;
        this.semanticDebugLastLog = 0;
        this.hudAccumulator = 0;
        this.hudTargetHz = 20;
        this.hudLastPos = new THREE.Vector3();
        this.hudLastRot = new THREE.Euler();
        this.hudTempDelta = new THREE.Vector3();
        this.nodeUiAcc = 0;
        this.undoUiAcc = 0;
        // Cadence controls: keep motion at 60 Hz; throttle interpretation/UI to lighter rates
        this.semanticVisualAcc = 0;
        this.semanticVisualInterval = 1 / 30; // ~30 Hz for visual/UI recompute
        this.semanticSlowAcc = 0;
        this.semanticSlowInterval = 0.1; // ~10 Hz for deep semantic layers
        this.semanticCadenceLogMs = 5000;
        this.semanticCadenceLastLog = 0;
        this.semanticSlowCadenceLastLog = 0;
        this._runVisualSemanticPending = false;
        this._pendingVisualSemanticDt = 0;
        this._pendingMark = null;
        this._runSlowSemanticPending = false;
        this._pendingSlowSemanticDt = 0;
        this._runElasticityPending = false;
        this._pendingElasticityDt = 0;
        this._runSynergyPulsePending = false;
        this._pendingSynergyPulseDt = 0;
        this._runHarmonicResonancePending = false;
        this._pendingHarmonicResonanceDt = 0;
        this._runHarmonicHubAuraPending = false;
        this._pendingHarmonicHubAuraDt = 0;
        this._runHarmonicInfluencePending = false;
        this._pendingHarmonicInfluenceDt = 0;
        this._runHarmonicCascadePending = false;
        this._pendingHarmonicCascadeDt = 0;
        this._runCascadeVisualizerPending = false;
        this._pendingCascadeVisualizerDt = 0;
        this.updateValidator.registerUpdateSystem('cameraController.update', 1, 1.0);
        this.updateValidator.registerUpdateSystem('playerController.update', 2, 1.0);
        this.updateValidator.registerUpdateSystem('aiNodes.update', 3, 4.0);
        this.updateValidator.registerUpdateSystem('coreMetricsOverlay.update', 4, 3.0);
        this.updateValidator.registerUpdateSystem('renderer.render', 5, 16.0);
        
        // ========================================================================
        // PHASE B: FRAME SCHEDULER INTEGRATION (Controlled Registration)
        // === RENDER CONTRACT (LOCKED) ===
// renderer.render() MUST be called:
// 1) EXACTLY ONCE per frame
// 2) ALWAYS as the LAST step of runRenderTick()
// 3) ONLY from FrameScheduler
//
// Any direct or indirect renderer.render() call
// outside this function is a BUG.
//
// Reason:
// - deterministic frame timing
// - no OUT_OF_ORDER_UPDATE
// - stable performance & observability
        // ========================================================================
        this.frameScheduler = new FrameScheduler();
        window.frameScheduler = this.frameScheduler;
        window.debugSchedulerStats = () => this.frameScheduler.getStats();
        window.debugSchedulerList = () => this.frameScheduler.listSystems();
        this.frameScheduler.register('background', () => EnhancedNodeModels.ensureRegistryReady?.(), 'registry-warmup');
this.frameScheduler.register(
  'realtime',
  (dt) => this.runCoreMetricsOverlayTick(dt),
  'coreMetricsOverlay.realtime'
);

this.frameScheduler.register(
  'realtime',
  (dt) => this.runNodeInspectOverlayTick(dt),
  'nodeInspectOverlay.realtime'
);
        this.frameScheduler.register('realtime', this.runCameraControllerTick.bind(this), 'realtime.cameraController');
        this.frameScheduler.register('realtime', this.runPlayerControllerTick.bind(this), 'realtime.playerController');
        this.frameScheduler.register('visual', (dt) => this.runRenderTick(dt), 'renderer.render');
        this.frameScheduler.register('visual', this.runNodeAuraSystemTick.bind(this), 'visual.nodeAuraSystem');
        this.frameScheduler.register('realtime', () => {
            if (this._runElasticityPending) {
                this._runElasticityPending = false;
                this.visualNetworkTimeElasticityTick(this._pendingElasticityDt);
            }
        }, 'visualNetworkTimeElasticity.realtime');
        this.frameScheduler.register('realtime', () => {
            if (!VISUAL_SYSTEMS_ENABLED) return;
            if (this._runSynergyPulsePending) {
                this._runSynergyPulsePending = false;
                this.synergyPulseVisualsTick(this._pendingSynergyPulseDt);
            }
        }, 'synergyPulseVisuals.realtime');
        this.frameScheduler.register('realtime', () => {
            if (this._runVisualSemanticPending) {
                this._runVisualSemanticPending = false;
                this.runVisualSemanticTick(this._pendingVisualSemanticDt, this._pendingMark);
            }
        }, 'semantic.visual30Hz');
        this.frameScheduler.register('realtime', () => {
            if (this._runHarmonicResonancePending) {
                this._runHarmonicResonancePending = false;
                this.harmonicResonanceCouplingTick(this._pendingHarmonicResonanceDt);
            }
        }, 'harmonicResonanceCoupling.realtime');
        this.frameScheduler.register('realtime', () => {
            if (this._runHarmonicHubAuraPending) {
                this._runHarmonicHubAuraPending = false;
                this.harmonicHubAuraSystemTick(this._pendingHarmonicHubAuraDt);
            }
        }, 'harmonicHubAuraSystem.realtime');
        this.frameScheduler.register('realtime', () => {
            if (this._runHarmonicInfluencePending) {
                this._runHarmonicInfluencePending = false;
                this.harmonicInfluencePropagationTick(this._pendingHarmonicInfluenceDt);
            }
        }, 'harmonicInfluencePropagation.realtime');
        this.frameScheduler.register('realtime', () => {
            if (this._runHarmonicCascadePending) {
                this._runHarmonicCascadePending = false;
                this.harmonicCascadeAmplificationTick(this._pendingHarmonicCascadeDt);
            }
        }, 'harmonicCascadeAmplification.realtime');
        this.frameScheduler.register('realtime', () => {
            if (this._runCascadeVisualizerPending) {
                this._runCascadeVisualizerPending = false;
                this.cascadeVisualizerTick(this._pendingCascadeVisualizerDt);
            }
        }, 'cascadeVisualizer.realtime');
        this.frameScheduler.register('realtime', () => {
            if (this._runSlowSemanticPending) {
                this._runSlowSemanticPending = false;
                this.runSlowSemanticTick(this._pendingSlowSemanticDt);
            }
        }, 'semantic.slow10Hz');
        // --- HUD bootstrap (required for realtime overlays) ---
this.wakeHud('coreMetrics');
this.wakeHud('nodeInspect');
this.setHudDirty('coreMetrics');
this.setHudDirty('nodeInspect');

        this.semanticBus.subscribe('camera.motion', () => {
            this.wakeHud('camera-motion');
            this.setHudDirty('coreMetrics');
        });
        this.semanticBus.subscribe('node.selection', () => {
            this.wakeHud('selection');
        });
        
        // Phase B Console API
        window.scheduler = {
            // Register a system to a layer (with optional ID for management)
            register: (layer, fn, id) => this.frameScheduler.register(layer, fn, id),
            
            // Unregister a system by ID
            unregister: (id) => this.frameScheduler.unregister(id),
            
            // Check if system is registered
            isRegistered: (id) => this.frameScheduler.isRegistered(id),
            
            // Get stats
            stats: () => this.frameScheduler.getStats(),
            
            // List all systems by layer
            listSystems: () => this.frameScheduler.listSystems(),
            
            // Clear all registrations
            clear: () => this.frameScheduler.clear(),
            
            // Test registration (example system for Phase B verification)
            registerTestSystems: () => {
                console.group('%c[FrameScheduler] PHASE B TEST REGISTRATION', 'color: #00ff00; font-weight: bold;');
                console.log('Registering example test systems...');
                
                // Realtime layer (60Hz)
                this.frameScheduler.register('realtime', (dt) => {
                    // Example: camera update
                }, 'test-camera');
                
                // Visual layer (30Hz)
                this.frameScheduler.register('visual', (dt) => {
                    // Example: visual effects update
                }, 'test-visuals');
                
                // Simulation layer (10Hz)
                this.frameScheduler.register('simulation', (dt) => {
                    // Example: AI processing
                }, 'test-ai');
                
                // Background layer (2Hz)
                this.frameScheduler.register('background', (dt) => {
                    // Example: narrative system
                }, 'test-narrative');
                
                console.log('✓ Registered 4 test systems (one per layer)');
                console.log('  - test-camera → realtime (60Hz)');
                console.log('  - test-visuals → visual (30Hz)');
                console.log('  - test-ai → simulation (10Hz)');
                console.log('  - test-narrative → background (2Hz)');
                console.log('Run for ~5 seconds, then call scheduler.stats() to verify execution');
                console.groupEnd();
            }
        };
        
        console.log('%c[FrameScheduler] Phase B: Controlled Registration initialized ✓', 'color: #00ff00; font-weight: bold;');
        console.log('  API: scheduler.register(layer, fn, id)');
        console.log('  API: scheduler.unregister(id)');
        console.log('  API: scheduler.registerTestSystems()');
        console.log('  API: scheduler.stats() | scheduler.listSystems() | scheduler.clear()');
        
        this.currentMode = 'fractal'; // Default: Fractal Valley

        // ========================================================================
        // AUDIO SYSTEM (ATOMA Audio Design)
        // ========================================================================
        //this.audioSystem = new AtomaAudioSystem();
        // this.audioModulation = new AtomaAudioModulation(this.audioSystem);
        this.previousSynergyState = 'none'; // 'none', 'active', 'fading'
        this.synergyActivationThreshold = 0.5;
        this.synergyFadingThreshold = 0.3;
        
        // Start audio on first interaction
document.addEventListener('click', () => {
    if (!this.audioSystem) return;
    if (!this.audioSystem.initialized) {
        this.audioSystem.start();
    }
});


document.addEventListener('keydown', () => {
  if (!this.audioSystem) return;
  if (!this.audioSystem.initialized) {
    this.audioSystem.start();
  }
});

        // Initialize systems
        this.nodeEditor = null;
        this.hazards = null;
        this.cinematicUpgrade = null;
        this.visualSuperpack = null;
        this.evolutionManager = null;
        this.legendaryPack = null;
        this.legendaryLinkFX = null;
        this.worldEvents = null;
        this.weatherPack = null;
        this.personalityFX = null;
        this.worldFXPack = null;

        // Ambient entities
        this.ambientEntityManager = null;

        // Memory trails
        this.memoryTrails = null;

        // Quantum illusions
        this.quantumIllusions = null;

        // Colony ecosystem
        this.colonyManager = null;

        // Dream Depth Pack (AI DOF simulation)
        this.dreamDepthPack = null;
        this.dreamDepthEffects = null;

        // Safe Mobility Pack 4.0 (dash + double jump)
        this.mobilityPack = null;

        // ====================================================================
        // TIER 1 INTEGRATION: Core Active Systems (Phase A)
        // ====================================================================
        this.linkCorruptionTransmission = null;
        this.harmonyStabilizationSystem = null;
        
        // ====================================================================
        // TIER 2 VISUAL INTEGRATION: Visual System Wiring
        // ====================================================================
        // T2-002: Corruption Visual Integration
        this.t2CorruptionVisualIntegration = null;
        
        // T2-003: Harmony Visual Consumer
        this.t2HarmonyVisualConsumer = null;
        
        // ====================================================================
        // TIER 4 GAMEPLAY INTEGRATION: Gameplay Layer
        // ====================================================================
        this.tier4GameplayIntegration = null;
        
        // ====================================================================
        // PHASE 5: MULTI-NETWORK SYNCHRONIZATION
        // ====================================================================
        this.phase5MultiNetworkOrchestrator = null;
      //  this.phase5InterNetworkConnectionVisuals = null;
        this.phase5InterNetworkVisualizationBridge = null;
        this.phase5CascadePropagationVisuals = null;
        this.phase5CascadeVisualizationBridge = null;

        // ====================================================================
        // NODE HIERARCHY SYSTEM v1.0 — Parent-Child Node Relationships
        // ====================================================================
        this.nodeHierarchyBridge = null;

        // Node Visuals 4.0 (high-quality node visual upgrade)
        this.nodeVisuals4 = null;

        // Rare Node Spawner (safe background rare node spawning)
        // FIX SESSION 37: CRITICAL — Ghost node fix via unified node registry
        this.rareNodeSpawner = null;

        // Node Evolution 2.0 (safe visual node evolution system)
        this.nodeEvolution = null;

        // Safe Node Archetypes Pack (visual diversity system)
        this.nodeArchetypesPack = null;

        // Evolving Link FX 2.0 (visual link evolution system)
        this.evolvingLinkFX = null;

        // Node Personality 2.0 (unique personality signatures)
        this.nodePersonality = null;

        // Phase 3c Personality Visual Adapter (visual personality signals from metrics)
        this.personalityVisualAdapter = null;

        // Phase 3c Personality VFX Layer (visual effects driven by personality signals)
        this.personalityVFXLayer = null;

        // Phase 3c Personality Shader Bridge (GPU shader integration for effects)
        this.personalityShaderBridge = null;

        // Phase 3c Personality Shader Effects Pack (Week 4 - advanced visual polish)
        this.personalityShaderEffects = null;

        // Phase 3c Personality Shader Advanced FX (Week 5 - procedural noise & distortion)
        this.advancedShaderFX = null;

        // Phase 3c Archetype Ascension Curves (Week 13 - Personality-driven curve profiling)
        this.archetypeCurves = null;

        // Phase 3c Archetype Aura Enhancement (Week 14 - GPU-enhanced visual multiplier)
        this.archetypeAuraFX = null;

        // Phase 3c Archetype Color Palette System (Week 15 - Personality-driven palette shifts)
        this.archetypeColorFX = null;

        // Phase 3c Archetype Shader Modes (Week 16 - GPU shader mode orchestration)
        this.archetypeShaderModes = null;

        // Week 17 Archetype Neural Link Visualization (GPU link resonance)
        this.neuralLinkVis = null;

        // Week 18 Node Selection Shader Activation (selection-driven intensity boost)
        this.nodeShaderActivation = null;

        // Week 18 (Alt) Link Personality State Machine (dynamic link personalities)
        this.linkPersonalityStateMachine = null;

        // Week 19 Synergy Bonus Visualization (high-synergy link effects)
        this.synergyBonusVisualization = null;

        // Week 19 (Alt) Synergy Bonus FX Layer (GPU-based synergy flares)
        this.synergyBonusFXLayer = null;

        // Week 20 Synergy Resonance Shader Pack (multi-frequency resonance FX)
        this.synergyResonanceShaderPack = null;

        // Week 21 AI Network Resonance Feedback (network-level feedback)
        this.resonanceFeedback = null;

        // Week 22 Synergy Chain Reactions (emergent cascade events)
        this.synergyChainReaction = null;

        // Week 22B Synergy Cascade FX Bridge (cascade → shader effects)
        this.synergyCascadeFXBridge = null;

        // Week 25 (Bonus) Wave Interference Engine (multi-origin wave system)
        this.waveInterferenceEngine = null;

        // Week 25 (Bonus) Wave Shader Bridge (GPU uniform injection)
        this.waveShaderBridge = null;

        // Week 25 (Bonus) Wave Shader Material Patch (GPU shader patching)
        this.waveShaderMaterialPatch = null;

        // Week 25 (Bonus) Wave Travel Shader Pack (GPU motion effects)
        this.waveTravelShaderPack = null;

        // Week 25 (Bonus) Wave Dynamics Shader Pack (advanced FX layers)
        this.waveDynamicsShaderPack = null;

        // Week 27: Wave Particle Emitter (GPU-reactive particle FX)
        this.particleEmitter = null;

        // Particle Stream Cascade Acceleration (layer-depth based particle dynamics)
        this.cascadeAccelSetup = null;

        // Cascade Particle Emission Boost (drives particle FX from cascades)
        this.cascadeParticleEmissionBoost = null;

        // Cascade Particle Color Tinting (colors particles by conflict type)
        this.cascadeParticleColorTinting = null;

        // Link Micro-Impulses (event-driven electrical responses)
        this.microImpulseAdapter = null;

        // Pulse Intersection Impulses (neural firing on wave contact)
        this.pulseIntersectionAdapter = null;

        // Pulse Wave System Bridge (connects waves to neural firing)
        this.pulseWaveSystemBridge = null;

        // Pulse Boundary Interaction Adapter (energy dissipation/absorption at nodes)
        this.pulseBoundaryInteractionAdapter = null;

        // Synaptic Gating Adapter (selective pulse amplification/dampening at nodes)
        this.synapticGatingAdapter = null;

        // Synaptic Fatigue Adapter (long-term wear and recovery at nodes)
        this.synapticFatigueAdapter = null;

        // Synaptic Specialization Adapter (visual learning from repeated behavior)
        this.synapticSpecializationAdapter = null;

        // Competition & Dominance Adapter (territorial politics — Session 113+)
        this.competitionDominance = null;

        // ====================================================================
        // SESSION 128: INFLUENCE ATTENUATION & ABSORPTION VISUALS
        // Visualizes how harmonic influence weakens/absorbs at non-harmonic nodes
        // ====================================================================
        this.influenceAttenuationAbsorption = null;

        // ====================================================================
        // SESSION 129: INFLUENCE REFLECTION & BACK-PRESSURE VISUALS
        // Visualizes how resistant nodes reject influence through reflection
        // ====================================================================
        this.influenceReflection = null;

        // ====================================================================
        // SESSION 130: STANDING WAVE & OSCILLATION TRAP VISUALS
        // Visualizes energy trapped between opposing nodes
        // ====================================================================
        this.standingWaveTrap = null;

        // ====================================================================
        // SESSION 131: STANDING WAVE VISUAL RENDERER
        // Renders mesh visuals for standing wave patterns
        // ====================================================================
        this.standingWaveRenderer = null;

        // ====================================================================
        // SESSION 132: WAVE INTERFERENCE PATTERN SYSTEM
        // Visualizes constructive/destructive wave collision patterns
        // ====================================================================
        this.waveInterference = null;

        // ====================================================================
        // SESSION 133: RESONANCE RUPTURE VISUAL SYSTEM
        // Visualizes standing wave collapse and pressure release
        // ====================================================================
        this.resonanceRupture = null;
        this.harmonicRecovery = null;

        // ====================================================================
        // REGIONAL EQUILIBRIUM FIELD SYSTEM
        // Visualizes territorial equilibrium and power balance shifts
        // ====================================================================
        this.regionalEquilibrium = null;

        // Extraction Pack v1.0 — Runtime Orchestration
        this.metricsRuntime_v1 = null;
        this.personalityRuntime_v1 = null;

        // Extraction Pack v1.1 — Runtime Orchestration (World & FX)
        this.worldRuntime_v1 = null;
        this.fxRuntime_v1 = null;

        // Extraction Pack v1.2 — Runtime Orchestration (Node Editor & UI)
        this.nodeEditorRuntime_v1 = null;

        // Extraction Pack v1.3 — Runtime Orchestration (Input Handling)
        this.inputRuntime_v1 = null;

        // Phase 3c Performance Mode (centralized FX scaling controller)
        this.fxPerformance = null;
        this.fxPerformanceScaler = null;

        // Phase 3c Adaptive Performance Monitor (automatic FPS-based LowFX toggling)
        this.adaptivePerformanceMonitor = null;

        // Phase 3c Smooth Transition Layer (Week 4.5 - polished quality mode transitions)
        this.fxPerformanceTransition = null;

        // Core Metrics Overlay 1.0 (network metrics + temporal units)
        this.coreMetricsOverlay = null;

        // System State Overlay (visual representation of harmony, synergy, corruption)
        this.systemStateOverlay = null;
        
        // Zone Audio Reactivity (subtle per-zone audio modulation)
        this.zoneAudioReactivity = null;

        // Core Metrics View Model (global read-only snapshot)
        this.coreMetricsVM = createEmptyCoreMetricsViewModel();

        // DISABLED: Metric-Reactive World Events 1.0 (legacy, replaced by Phase 5-7 architecture)
        // this.metricReactiveEvents = null;

        // Safe World Reset Fix 1.0 (safe map transition system)
        this.worldResetFix = new SafeWorldResetFix1_0();

        // Node Inspect Overlay 1.0 (initialized after scene/camera ready)
        this.nodeInspectOverlay = null;

        // Safe Metrics FX 1.1 (subtle metric-based visual effects)
        this.metricsVisualFX = new SafeMetricsFX1_1();

        // Node Personality System 2.0 (complete personality system)
        this.nodePersonalitySystem = new NodePersonalitySystem2_0();

        // Node Micro-Events 1.0 (personality-driven spontaneous events)
        this.nodeMicroEvents = null; // Initialized after scene/camera ready

        // World Personality Controller 2.0 (world reacts to network mood)
        this.worldPersonalityController = null; // Initialized after scene/camera/renderer ready

        // Mythic Ritual Controller 1.0 (rare ceremonial events)
        this.mythicRitualController = null; // Initialized after world controller ready

        // ====================================================================
        // SYNERGY VISUAL EFFECTS v1.0 — Pure world-space visual feedback
        // Soft pulse + visual time elasticity (zero gameplay impact)
        // ====================================================================
        this.synergyPulseVisuals = null;           // Simple breathing pulse effect
        this.visualNetworkTimeElasticity = null;  // Extreme synergy time reversal effect
        this.harmonicResonanceCoupling = null;    // Synergy-driven link resonance coupling
        this.harmonicHubAuraSystem = null;        // Harmonic hub resonance fields (Session 126)
        this.harmonicInfluencePropagation = null; // Harmonic influence propagation (Session 127)
        this.harmonicCascadeAmplification = null; // Hub-to-hub cascade amplification (Session 145)
        this.echoTrailsSystem = null;             // Echo trails shader system
        this.echoTrailsIntegration = null;        // Echo trails integration layer

        // Mythic Node Creation (cinematic node birth ritual)
        this.mythicNodeCreation = null; // Initialized after AI nodes ready

        // ====================================================================
        // PHASE 8: NETWORK RITUAL VISUAL ORCHESTRATION
        // Pure visual ceremony layer for rituals (no gameplay logic)
        // ====================================================================
        this.phase8VisualBridge = null;                    // Initialized after scene ready
        this.phase8RitualOrchestration = null;             // Initialized after wiring ready

        // Mythic Seed Glyph System (elegant visual markers)
        this.mythicSeedGlyph = null; // Initialized after scene ready

        // Legacy Debug Cone Cleanup (removes old debug meshes)
        this.legacyConeCleanup = null; // Initialized after scene ready

        // Fractal Hex Marker System (replaces debug cones with elegant markers)
        this.fractalHexMarker = null; // Initialized after scene ready

        // ATOMA Glyph System 3.0 (unified glyph framework)
        this.glyphSystem = null; // Initialized after scene ready

        // ATOMA Glyph System 4.0 (animated meaning edition)
        this.glyphSystem4 = null; // Initialized after scene ready

        // ATOMA Glyph Layer 4.0 (multi-glyph fusion)
        this.glyphLayer4 = null; // Initialized after scene ready

        // Semantic Glyph AI 5.0 (intelligent visual node communication)
        this.semanticGlyphAI = null; // Initialized after Glyph Layer 4.0 ready

        // Glyph Fusion Overlay 4.1 (semantic fusion layer)
        this.glyphFusionOverlay = null; // Initialized after SemanticGlyphAI ready

        // Procedural Meaning Engine 1.0 (lightweight 3D semantic glyphs)
        this.proceduralMeaningEngine = null; // Initialized after SemanticGlyphAI ready

        // Link Glyph Flow 1.0 (AI communication packets along links)
        this.linkGlyphFlow = null; // Initialized after LinkingSystem ready

        // Glyph Purity Mode 5.1 (enforces minimal atmospheric visuals)
        this.glyphPurityMode = null; // Initialized after scene ready

        // Adaptive Glyph Rendering 1.0 (responsive to node metrics)
        this.adaptiveGlyphRendering = null; // Initialized after scene ready

        // Linked Glyph Synchronization 1.0 (coordinated animations across linked nodes)
        this.linkedGlyphSync = null; // Initialized after scene ready

        // Linked Glyph Messaging 3.0 (ultra symbolic AI language transport)
        this.linkedGlyphMessaging = null; // Initialized after semantic AI ready

        // Recursive Glyph Messaging 4.0 (recursive meaning chains)
        this.recursiveGlyphMessaging = null; // Initialized after semantic AI ready

        // Emergent Thought Storms 5.0 (chain collision phenomena)
        this.emergentThoughtStorms = null; // Initialized after recursive messaging ready

        // AI Narrative Patterns 6.0 (narrative structure layer)
        this.narrativePatterns = null; // Initialized after emergent storms ready

        // Extreme AI Shader Test Suite (comprehensive diagnostics)
        this.extremeShaderTestSuite = null; // Initialized after scene ready

        // Safe New Node Categories 1.0 (Mythic, Prime, Error nodes)
        this.newNodeCategories = null; // Initialized after scene ready

        // New Node Category Visuals 1.0 (visual enhancement for new categories)
        this.newNodeVisuals = null; // Initialized after scene ready

        // Extreme Link Visual Pack 3.0 (AAA-quality link visuals)
        this.extremeLinkVisuals = null; // Initialized after scene ready

        // Neural Curve Link Visuals 1.0 (dynamic Bézier curved links)
        this.neuralCurveLinkVisuals = null; // Initialized after scene ready

        // AI Consciousness Layer 1.0 (neural thought visualization)
        this.consciousnessLayer = null; // Initialized after linking system ready

        // Extreme Link Visuals 4.0 (neural curvature & depth)
        this.extremeLinkVisuals4 = null; // Initialized after linking system ready
        
        // Link Visual Mood System 1.0 (calm, premium, intense, meditative presets)
        this.linkVisualMoodSystem = null; // Initialized after all link systems ready

        // ATOMA Language Engine 2.0 (grammar + semantic language processing)
        this.languageEngine = new AtomaLanguageEngine2_0();
        
        // Visual Hierarchy Correction System v1.0 (Session 20 - enforces visual dominance)
        this.visualHierarchyCorrection = null; // Initialized in createAINodes()

        // Node Surface Protection Rule v2.0 (Session 24 Enhanced - prevents aura occlusion)
        this.nodeSurfaceProtection = null; // Initialized after linking system ready

        // Link Recommendation AI 1.0 (AI-driven link pairing suggestions)
        this.linkRecommendationAI = null; // Initialized after linking system ready

        // Link Automation Engine 1.0 (automatic link creation from recommendations)
        this.linkAutomationEngine = null; // Initialized after recommendation AI ready

        // Node Inspect Linguistic Overlay (semantic node inspection display)
        this.linguisticOverlay = null; // Initialized after consciousness layer ready

        // ATOMA Language Engine 3.0 (procedural AI poetry)
        this.poetryEngine = null; // Initialized after consciousness layer ready

        // ========================================================================
        // PHASE 1 LINK SYSTEMS REACTIVATION (Session 107+)
        // ========================================================================
        // Infrastructure recovery: LinkCorrelationEngine + Hardening + History
        this.linkCorrelationEngine = null;  // Synergy cluster detection
        this.linkHistoryTracker = null;     // Temporal link analytics
        // linkingSystemHardening applied inline after linkingSystem init
        
        // ========================================================================
        // LINK PRIORITY DECAY ENGINE 1.0 (Session 27 Extended)
        // ========================================================================
        // Time-based priority decay system for intelligent link lifecycle management
        this.linkPriorityDecayEngine = null; // Initialized after linking system ready
        this.linkQualityFeedbackLoop = null; // Initialized after linking system ready
        this.linkMLRecommendationEngine = null; // Initialized after linking system ready
        this.userAcceptanceTracker = null; // Initialized after linking system ready
        this.nodeLinkerRepairLayer = null; // Initialized after linking system ready

        // ========================================================================
        // ATOMA UI 3.1 - Node Interaction & HUD Systems (PARTIALLY DISABLED)
        // ========================================================================
        // DISABLED: this.autoDetect = null;           // REMOVED - NodeLinking2_3 handles detection
        this.categoryLegend = null;       // Category reference panel (passive display)
        this.emotionalFeed = null;        // AI poetic status feed (passive display)
        this.nodeLinking = null;          // ← REPLACED by NodeLinking2_3 (see UI 3.4–3.7)
        // DISABLED: this.hoverTooltip = null;         // REMOVED - Conflicts with new interaction

        // ========================================================================
        // ATOMA UI 3.2 - Interaction Polishing & Selected Node System
        // ========================================================================
        this.selectedNodeBadge = null;    // Badge under crosshair (QNT-ORB-SYN)
        this.selectedNodeHighlight = null; // Pulsing highlight shader
        this.selectedNodeLabel = null;    // Floating label above node

        // ATOMA UI 3.3 - Safe Unlinking
        // ========================================================================
        // (SafeNodeUnlinking3_3 is static, no instance needed)

        // ATOMA UI 3.4 - Core Selection Rewrite
        // ========================================================================
        this.selectionCore = null;        // Single source of truth for selection
        this.selectedNodeTopBar = null;   // Top center bar showing selected node info

        // ATOMA UI 3.7 - Double-Click Primary Node System
        // ========================================================================
        this.primaryNodeAura = null;      // Visual aura for primary (linking source)
        this.primaryNodeTopBar = null;    // HUD bar showing primary node info

        // OLD UI 3.0 - To be disabled
        this.nodeInspectPanel = null;     // Used by UI 3.2 for persistence

        this.init();
        this.setupPlayer();
        // ========================================================================
        // ATOMA DEBUG HUD 1.0 - Initialize after player setup
        // ========================================================================
        this.debugHUD = new AtomaDebugHUD_1_0();
        
        // ========================================================================
        // SESSION 99: NODE VISUAL FREEZE MODE (Emergency Immutability)
        // ========================================================================
        // Initialize freeze mode to make all node visuals completely immutable
        this.__nodeVisualFreezeMode__ = setupNodeVisualFreezeMode({
          enabled: true,
          debugMode: false,
          enforceEveryFrame: true
        });
        console.log('✅ [main.js] Node Visual Freeze Mode initialized');
        this.createWorld();
        this.setupVisualSuperpack();
        this.setupCinematicUpgrade();
        this.setupNodeEditor();
        this.setupHazards();
        this.setupEvolutionManager();
        this.setupLegendaryPack();
        this.setupLegendaryLinkFX();
        this.setupWorldEvents();
        this.setupWeatherPack();
        this.setupPersonalityFX();
        this.setupWorldFXPack();
        this.setupAmbientEntities();
        this.setupMemoryTrails();
        this.setupQuantumIllusions();
        this.setupColonyManager();
        this.setupDreamDepthPack();
        this.setupMobilityPack();
        this.setupNodeVisuals4();
        this.setupRareNodeSpawner();
        this.setupNodeEvolution();
        // DISABLED: this.setupNodeArchetypesPack(); // System permanently disconnected
        this.setupEvolvingLinkFX();
        this.setupNodePersonality();
        this.setupCoreMetricsOverlay();
        this.setupSystemStateOverlay();
        this.setupZoneAudioReactivity();
        this.setupMetricReactiveEvents();
        this.setupSemanticGlyphAI();
        this.setupGlyphFusionOverlay();
        this.setupProceduralMeaningEngine();
        this.setupLinkGlyphFlow();
        this.setupLinkedGlyphMessaging();
        this.setupRecursiveGlyphMessaging();
        this.setupEmergentThoughtStorms();
        this.setupAINarrativePatterns();
        this.setupModeSwitch();
        this.setupPerformanceMode();
        this.setupNodeEditorInput();
        this.setupExtremeShaderTestSuite();
        this.setupNewNodeCategories();
        this.setupNewNodeCategoryVisuals();
        this.setupExtremeLinkVisuals();
        this.setupNeuralCurveLinkVisuals();
        this.setupExtremeLinkVisuals4();
        this.setupLinkVisualMoodSystem(); // Link visual mood system (calm, premium, intense, meditative)
        this.setupAIConsciousnessLayer();
        this.setupLanguageEngine();
        this.setupLinguisticOverlay();
        this.setupPoetryEngine();
        
        // ========================================================================
        // SESSION 108+: LINK MICRO-IMPULSES (Event-Driven Electrical Responses)
        // ========================================================================
        this.setupLinkMicroImpulses();
        
        // ========================================================================
        // SESSION 108+ EXTENDED: PULSE INTERSECTION IMPULSES
        // ========================================================================
        this.setupPulseIntersectionImpulses();

        // ========================================================================
        // PULSE WAVE SYSTEM BRIDGE — Connect waves to neural firing
        // ========================================================================
        this.setupPulseWaveSystemBridge();

        // ========================================================================
        // PULSE BOUNDARY INTERACTION ADAPTER — Energy dissipation at node boundaries
        // ========================================================================
        this.setupPulseBoundaryInteraction();

        // ========================================================================
        // SYNAPTIC GATING ADAPTER — Selective pulse amplification/dampening at nodes
        // ========================================================================
        this.setupSynapticGating();

        // ========================================================================
        // SYNAPTIC FATIGUE ADAPTER — Long-term wear and recovery at nodes
        // ========================================================================
        this.setupSynapticFatigue();

        // ========================================================================
        // SYNAPTIC SPECIALIZATION ADAPTER — Visual learning from behavior
        // ========================================================================
        this.setupSynapticSpecialization();

        // ========================================================================
        // COMPETITION & DOMINANCE VISUALIZATION — Territorial politics
        // ========================================================================
        this.setupCompetitionDominance();

        // ========================================================================
        // SESSION 118: CASCADE PARTICLE EMISSION BOOST
        // Drives particle emission on cascade-affected links
        // ========================================================================
        this.setupCascadeParticleEmissionBoost();

        // ========================================================================
        // SESSION 119: CASCADE PARTICLE COLOR TINTING
        // Colors particles based on conflict type
        // ========================================================================
        this.setupCascadeParticleColorTinting();

        // ========================================================================
        // SESSION 120: CASCADE PARTICLE SYSTEM
        // Semantic particles with shape and velocity encoding
        // ========================================================================
        this.setupCascadeParticleSystem();

        // ========================================================================
        // SESSION 121: PARTICLE SEMANTIC DENSITY
        // Clustering and density encoding intensity and urgency
        // ========================================================================
        this.setupParticleSemanticDensity();

        // ========================================================================
        // SESSION 128: INFLUENCE ATTENUATION & ABSORPTION VISUALS
        // Visualizes how harmonic influence weakens/absorbs at non-harmonic nodes
        // ========================================================================
        this.setupInfluenceAttenuationAbsorption();

        // ========================================================================
        // SESSION 129: INFLUENCE REFLECTION & BACK-PRESSURE VISUALS
        // Visualizes how resistant nodes reject influence through reflection
        // ========================================================================
        this.setupInfluenceReflection();

        // ========================================================================
        // SESSION 130: STANDING WAVE & OSCILLATION TRAP VISUALS
        // Visualizes energy trapped between opposing nodes
        // ========================================================================
        this.setupStandingWaveTrap();

        // ========================================================================
        // SESSION 131: STANDING WAVE VISUAL RENDERER
        // Renders mesh visuals for standing wave patterns
        // ========================================================================
        this.setupStandingWaveRenderer();

        // ========================================================================
        // SESSION 132: WAVE INTERFERENCE PATTERN SYSTEM
        // Visualizes constructive/destructive wave collision patterns
        // ========================================================================
        this.setupWaveInterference();

        // ========================================================================
        // SESSION 133: RESONANCE RUPTURE VISUAL SYSTEM
        // Visualizes standing wave collapse under pressure
        // ========================================================================
        this.setupResonanceRupture();

        // ========================================================================
        // SESSION 138: HARMONIC RECOVERY VISUAL SYSTEM
        // Visualizes network repair after rupture (Coherence Waves, Re-Stitching)
        // ========================================================================
        this.setupHarmonicRecovery();

        // ========================================================================
        // REGIONAL EQUILIBRIUM FIELD SYSTEM
        // Visualizes territorial equilibrium and long-term power balance shifts
        // ========================================================================
        this.setupRegionalEquilibrium();
        this.setupCascadingRuptureAndFailure();
        this.setupLinkSemanticPictograms();
        this.setupHarmonicResonanceFeedback();
        this.setupResonanceEchoTrails();
        this.setupHarmonicTopologyLearning();
        this.setupTopologyBiasVisualization();
        this.setupProceduralHarmonicGlyphs();
        this.setupRegionalHarmonicCycles();
        this.setupGlyphAnimationModulator();
        this.setupCompositeGlyphResonanceFeedback();

        // ========================================================================
        // ATOMA UI 3.4 - CORE SELECTION (Initialize FIRST - single source of truth)
        // ========================================================================
        // ========================================================================
        // ATOMA INPUT CLEANUP 3.8 — MOVE UI 3.7 SETUP TO BOTTOM
        // ========================================================================

        // UI CORE
        // --- UI CORE ---
        this.setupSelectionCore();
        this.setupSelectedNodeHUD();

        // --- UI Visual Components ---
        this.setupNodeInspectPanel();
        this.setupSelectedNodeBadge();
        this.setupSelectedNodeHighlight();
        this.setupSelectedNodeLabel();

        // --- Primary Node System (creates final NodeLinking2_3 instance) ---
        this.setupPrimaryNodeSystem();

        // --- Final unified wiring (connects UI + linking) ---
        this.setupUIWiring3_7();

        // --- Setup global double-click fallback ---
        this.setupDoubleClickFallback();

        // ========================================================================
        // SYNERGY VISUAL EFFECTS v1.0 - Pure world-space visual feedback
        // Soft breathing pulse + visual time elasticity (zero gameplay impact)
        // ========================================================================
        this.setupSynergyPulseVisuals();
        this.setupVisualNetworkTimeElasticity();
        this.setupHarmonicResonanceCoupling();
        this.setupHarmonicHubAuraSystem();
        this.setupHarmonicInfluencePropagation();
        this.setupHarmonicCascadeAmplification();
        this.setupVisualEchoTrails();

        // ========================================================================
        // ATOMA UI 3.1 - CATEGORY LEGEND & EMOTIONAL FEED (Session 28 Restoration)
        // ========================================================================
        // Initialize Category Legend 3.1 (passive reference panel showing all 14 categories)
        this.setupCategoryLegend();
        // Initialize Emotional Feed 3.1 (passive poetic network status reflections)
        this.setupEmotionalFeed();

        // ========================================================================
        // EXPOSE ATOMA ENGINE & SUBSYSTEMS GLOBALLY (Safe Debug Mode)
        // ========================================================================
        // Expose AtomaGame instance and subsystems globally (debug-safe)
        window.game = this;
        window.linkPriorityDecayEngine = this.linkPriorityDecayEngine;
        window.linkQualityFeedbackLoop = this.linkQualityFeedbackLoop;
        window.linkMLRecommendationEngine = this.linkMLRecommendationEngine;
        window.userAcceptanceTracker = this.userAcceptanceTracker;
        
        // ========================================================================
        // [SESSION 56 FORENSIC] VISUAL AUDIT TOOL - Snapshot & Diff System
        // Forensic analysis of node visual mutations during linking
        // ========================================================================
        VisualAudit.setScene(this.scene);
        window.VisualAudit = VisualAudit;
        console.log('[main.js] ✓ VisualAudit tool initialized (window.VisualAudit.testLink(nodeA, nodeB))');

        // ========================================================================
        // PHASE B.3.A: Disable implicit RenderTransmissionPass (one-time sanitize)
        // ========================================================================
        if (CONFIG?.rendering?.DISABLE_TRANSMISSION_PASS) {
            const offenders = sanitizeTransmission(this.scene, { log: true });
            if (typeof window !== 'undefined') {
                window.__ATOMA_TRANSMISSION_OFFENDERS__ = offenders;
                window.findTransmissionMaterials = () => findTransmissionMaterials(this.scene);
            }
        }

        this.setupDebugCommands();
        
        // ========================================================================
        // HUD COLLAPSE SYSTEM 1.0 - Initialize after all HUDs are created
        // ========================================================================
        // Deferred initialization: Set up collapsible HUDs after all game systems are ready
        setTimeout(() => {
            try {
                initializeHudCollapseSystem();
                
                // Verify system is working (optional)
                if (this.debugMode) {
                    verifyHudCollapseSystem();
                }
            } catch (err) {
                console.warn('⚠ HUD Collapse System initialization error:', err);
            }
        }, 100);
        
        // ========================================================================
        // DEFENSIVE HARDENING PATCH v1.0 - Apply after all systems initialized
        // ========================================================================
        // Apply protective guards against "is not iterable" errors and visual layering
        // This ensures stable runtime without changing gameplay or visual identity
         try {
            applyAllDefensivePatches(this);
        } catch (err) {
            console.warn('⚠ Defensive hardening patch initialization error:', err);
        }
        
        // ========================================================================
        // SESSION 99: INSTALL NODE VISUAL FREEZE BLOCKERS
        // ========================================================================
        // After ALL systems are initialized, install blockers to prevent
        // reactive systems from modifying node visuals
         try {
            installNodeVisualFreezeBlockers(this);
            console.log('✅ [main.js] Node Visual Freeze Blockers installed');
        } catch (err) {
            console.warn('⚠ Node Visual Freeze Blockers installation error:', err);
        }
        
        // ========================================================================
        // SESSION 104: HARD INTERACTION AUTHORITY SYSTEM
        // Critical stabilization - enforce interaction core authority
        // ========================================================================
        try {
            this.hardInteractionAuthority = initializeHardInteractionAuthority(this);
            console.log('🔒 [main.js] Hard Interaction Authority System initialized ✓');
            
            // Initialize debug API for testing
            setupHardAuthorityDebugAPI();
            console.log('🔍 [main.js] Hard Authority Debug API ready (use reportSystemStatus())');
        } catch (err) {
            console.warn('⚠ Hard Interaction Authority System initialization error:', err);
        }
        
        this.animate();

    }

    /**
     * Initialize Three.js scene, camera, renderer
     */
    init() {
        // ========================================================================
        // LEFT HUD COLUMN v2.5 ULTRA CLEAN PATCH - LEGACY CLEANUP
        // ========================================================================
        // Remove all legacy category HUDs, secondary HUDs, and traffic HUDs from DOM
        // This ensures zero visual overlap and production-ready left column layout
        // P0 HUD SAFE CLEANUP
// ===============================
// P0 HUD HARD KILL (auto-recreated DOM guards)
// ===============================
const HUD_KILL_IDS = [
  'ai-emotional-feed',
  'ui-selected-hud-stats',
 
];

const PROTECTED_HUD_IDS = [
  'core-metrics-hud',
  'core-metrics-overlay',
  'node-inspect-overlay'
];

const killHUD = () => {
  HUD_KILL_IDS.forEach(id => {
    // Preserve realtime HUDs (Core Metrics + Node Inspector)
    if (PROTECTED_HUD_IDS.includes(id)) return;
    document.getElementById(id)?.remove();
  });
};

// initial sweep
killHUD();

// kill on re-injection
const hudObserver = new MutationObserver(killHUD);
hudObserver.observe(document.body, {
  childList: true,
  subtree: true
});
if (!window.__ATOMA_DISABLE_HUD_GUARDS__) {

// ===============================
// P0.5 HUD PERFORMANCE KILLS
// ===============================
const HUD_P05_KILL_SELECTORS = [
  //tento konrketne je na box selection
  '#tier4-gameplay-feedback-hud',


  '#node-inspect-linguistic-overlay',
  '#ui-primary-node-top-bar-3-7',


];

const killHUD_P05 = () => {
  HUD_P05_KILL_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      // Skip realtime HUDs that must persist
      if (el.id && PROTECTED_HUD_IDS.includes(el.id)) return;
      el.remove();
    });
  });
};

killHUD_P05();

const hudP05Observer = new MutationObserver(killHUD_P05);
hudP05Observer.observe(document.body, {
  childList: true,
  subtree: true
});

  // kill-switch block
}
        // Remove legacy category legend versions (v1, v2)
        const legacyCategorySelectors = [
            '.ui-category-legend',
            '.category-panel',
            '.ui-legend',
            '.legend-container',
            '#legacy-category-hud',
            '#category-legend-v1',
            '#category-legend-v2'
        ];
        legacyCategorySelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        // Remove secondary HUD (if it exists)
        document.querySelectorAll('.secondary-hud, #secondary-hud').forEach(el => el.remove());
        
        // Remove traffic HUD (fully verified as non-existent, but clean anyway)
        document.querySelectorAll('#traffic-hud, .traffic-hud, .link-traffic, #link-traffic-hud').forEach(el => el.remove());
        
        // Remove legacy NODE CATEGORIES overlay (session 30 cleanup)
        const legacyNodeCategoriesSelectors = [
            '#node-categories',
            '.node-categories-overlay',
            '.legacy-node-categories',
            '[class*="NodeCategoriesOverlay"]'
        ];
        legacyNodeCategoriesSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Don't remove if it's part of the new UI category legend
                if (!el.closest('#ui-category-legend')) {
                    el.remove();
                }
            });
        });
        
        console.log('✓ [v3.0] Legacy HUD DOM elements cleaned from page');
        
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        window.__renderer = this.renderer; // debug-only: expose renderer for inspection
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        document.body.appendChild(this.renderer.domElement);
        this.gpuSanity = setupGpuSanity(this.renderer);

        // [B.3-C4] Post-processing toggle stabilization (build once)
        if (typeof window !== 'undefined') {
            window.__POST_PROCESSING_BUILT = window.__POST_PROCESSING_BUILT || false;
            window.__POST_PROCESSING_TOGGLES = window.__POST_PROCESSING_TOGGLES || 0;
            window.__POST_PROCESSING_REBUILDS = window.__POST_PROCESSING_REBUILDS || 0;
        }
        if (!this.postProcessing) {
            this.postProcessing = getSharedPostProcessingPipeline(this.renderer, this.scene, this.camera);
            this.postProcessingEnabled = true;
            if (typeof window !== 'undefined') window.__POST_PROCESSING_BUILT = true;
        }
        this.setPostProcessingEnabled = (enabled = true) => {
            const next = !!enabled;
            if (this.postProcessingEnabled !== next) {
                this.postProcessingEnabled = next;
                if (typeof window !== 'undefined') window.__POST_PROCESSING_TOGGLES++;
            }
            return this.postProcessingEnabled;
        };

        // === Wave shader stack (init early so warm-up uses patched shaders) ===
        try {
            this.waveInterferenceEngine = new WaveInterferenceEngine_v1({
                maxSources: 8,
                enableDebug: false,
                enableWarnings: false
            });
            console.log('[main.js] WaveInterferenceEngine_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] WaveInterferenceEngine_v1 failed:', err);
        }

        try {
            this.waveShaderBridge = new WaveShaderBridge_v1({
                renderer: this.renderer,
                scene: this.scene,
                waveEngine: this.waveInterferenceEngine,
                maxSources: 8
            });
            console.log('[main.js] WaveShaderBridge_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] WaveShaderBridge_v1 failed:', err);
        }

        try {
            this.waveShaderMaterialPatch = new WaveShaderMaterialPatch_v1({
                enableDebug: false,
                enableWarnings: false
            });
            console.log('[main.js] WaveShaderMaterialPatch_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] WaveShaderMaterialPatch_v1 failed:', err);
        }

        try {
            this.waveTravelShaderPack = new WaveTravelShaderPack_v1({
                enableDebug: false
            });
            console.log('[main.js] WaveTravelShaderPack_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] WaveTravelShaderPack_v1 failed:', err);
        }

        try {
            this.waveDynamicsShaderPack = new WaveDynamicsShaderPack_v1({
                enableDebug: false,
                enableWarnings: false
            });
            console.log('[main.js] WaveDynamicsShaderPack_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] WaveDynamicsShaderPack_v1 failed:', err);
        }

        // Initialize Node Inspect Overlay (after scene/camera/renderer ready)
        this.nodeInspectOverlay = new NodeInspectOverlay1_0(
            this.scene,
            this.camera,
            this.renderer
        );

        // Initialize Node Micro-Events 1.0 (after scene/camera ready)
        this.nodeMicroEvents = new NodeMicroEvents(
            this.scene,
            this.camera
        );
// Mount Variant B – AI Status HUD
mountVariantBAdvisorHUD(document.body);

// UI DEBUG – Variant B Advisor (temporary)
window.__ATOMA_AI_ADVISOR__ = {
  stability: 0.72,
  risk: 0.18,
  recovery: 'LOW',
  insight: 'System stable. No intervention required.'
};

// First paint
updateVariantBAdvisorHUD(window.__ATOMA_AI_ADVISOR__);

        // Initialize World Personality Controller 2.0 (after scene/camera/renderer ready)
        this.worldPersonalityController = new WorldPersonalityController(
            this.scene,
            this.camera,
            this.renderer
        );

        // Initialize Mythic Ritual Controller 1.0 (after world controller ready)
        this.mythicRitualController = new MythicRitualController(
            this.scene,
            this.camera,
            this.renderer,
            this.worldPersonalityController,
            this.player // Pass player for participation system
        );

        // Initialize Mythic Seed Glyph System (after scene ready)
        this.mythicSeedGlyph = new MythicSeedGlyph(this.scene);

        // Remove all old debug markers and yellow triangles
        this.mythicSeedGlyph.removeOldMarkers();

        // Initialize Legacy Debug Cone Cleanup (after scene ready)
        this.legacyConeCleanup = new LegacyDebugConeCleanup(this.scene);

        // Initialize Legacy Glyph Cleanup 1.0 (after scene ready)
        // This removes ALL old 2D cyan hexagon debug markers and legacy slots
        this.legacyGlyphCleanup = new LegacyGlyphCleanup(this.scene);
        this.legacyGlyphCleanup.cleanupLegacyGlyphs();
        this.legacyGlyphCleanup.printCleanupReport();

        // DISABLED: Fractal Hex Marker System (legacy debug system - replaced by Glyph Slot System 2.0)
        // this.fractalHexMarker = new FractalHexMarker(this.scene);

        // Initialize ATOMA Glyph System 3.0 (after scene ready)
        this.glyphSystem = new AtomaGlyphSystem3_0(this.scene);

        // Initialize ATOMA Glyph System 4.0 (Animated Meaning Edition)
        this.glyphSystem4 = new AtomaGlyphSystem4_0(this.scene, this.camera);

        // Initialize ATOMA Glyph Layer 4.0 (Multi-Glyph Fusion)
        // Pass resonance feedback system for composite glyph registration
        this.glyphLayer4 = new GlyphLayer4_MultiFusion(this.scene, null, this.compositeResonanceFeedback);

        // Initialize Glyph Purity Mode 5.1 (after scene ready)
        // Enforces minimal atmospheric visual identity - ONLY designed glyphs
        this.glyphPurityMode = new GlyphPurityMode5_1(this.scene);
        this.glyphPurityMode.setPurityLevel(3); // PURE mode (strictest)
        this.glyphPurityMode.purifyScene();     // First cleanup pass
        this.glyphPurityMode.printPurityReport();

        // Initialize Adaptive Glyph Rendering 1.0 (after scene ready)
        // Makes glyphs respond to node metrics in real-time
        this.adaptiveGlyphRendering = new AdaptiveGlyphRendering1_0(this.scene);
        this.adaptiveGlyphRendering.setEnabled(true);
        console.log('✓ Adaptive Glyph Rendering 1.0 active — Glyphs now respond to node metrics');

        // Initialize Linked Glyph Synchronization 1.0 (after scene ready)
        // Coordinates animations across linked nodes
        this.linkedGlyphSync = new LinkedGlyphSynchronization1_0(this.scene);
        this.linkedGlyphSync.setEnabled(true);
        console.log('✓ Linked Glyph Synchronization 1.0 active — Linked glyphs now coordinated');

        // Setup initial environment (Sigma Rift)
        this.setupSigmaRiftEnvironment();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Setup Sigma Rift Chamber environment
     */
    setupSigmaRiftEnvironment() {
        // Vast void with green rift glow
        this.scene.background = new THREE.Color(0x0a0a14);
        this.scene.fog = new THREE.FogExp2(0x0d1a12, 0.008);

        // Clear existing lights
        this.scene.children = this.scene.children.filter(child =>
            !(child instanceof THREE.Light)
        );

        // Minimal dark ambient
        const ambientLight = new THREE.AmbientLight(0x0d4d40, 0.1);
        this.scene.add(ambientLight);

        // Soft key light with cyan tint
        const keyLight = new THREE.DirectionalLight(0x00ccdd, 0.15);
        keyLight.position.set(30, 20, 30);
        this.scene.add(keyLight);

        // Rim light with green tint from Rift
        const rimLight = new THREE.DirectionalLight(0x00ff88, 0.1);
        rimLight.position.set(-30, 20, -30);
        this.scene.add(rimLight);
    }

    /**
     * Setup Dream Desert environment
     */
    setupDreamDesertEnvironment() {
        // Gradient dream sky
        const skyColors = {
            top: new THREE.Color(0x6633cc),      // Purple
            middle: new THREE.Color(0x3366ff),   // Blue
            bottom: new THREE.Color(0x00cccc)    // Turquoise
        };

        // Create gradient background
        this.scene.background = skyColors.middle;

        // Ground fog
        this.scene.fog = new THREE.FogExp2(0xccbbff, 0.008);

        // Soft ambient lighting
        const ambientLight = new THREE.AmbientLight(0xffeeff, 0.6);
        this.scene.add(ambientLight);

        // Soft directional light (no hard shadows)
        const directionalLight = new THREE.DirectionalLight(0xffddff, 0.4);
        directionalLight.position.set(10, 30, 10);
        directionalLight.castShadow = false;
        this.scene.add(directionalLight);

        // Hemisphere light for sky/ground gradient
        const hemisphereLight = new THREE.HemisphereLight(
            0xccbbff,  // Sky color
            0xf5d0f0,  // Ground color
            0.5
        );
        this.scene.add(hemisphereLight);
    }

    /**
     * Setup Node-Space Chamber environment
     */
    setupChamberEnvironment() {
        this.scene.background = new THREE.Color(CONFIG.colors.background);
        this.scene.fog = new THREE.FogExp2(CONFIG.colors.fog, 0.015);

        // Clear existing lights
        this.scene.children = this.scene.children.filter(child =>
            !(child instanceof THREE.Light)
        );

        // Minimal and calm lighting
        const ambientLight = new THREE.AmbientLight(
            CONFIG.colors.primary,
            CONFIG.lighting.ambientIntensity
        );
        this.scene.add(ambientLight);

        // Very subtle directional for depth
        const directionalLight = new THREE.DirectionalLight(
            CONFIG.colors.accent,
            0.1
        );
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);
    }

    /**
     * Setup Quantum Island environment
     */
    setupQuantumIslandEnvironment() {
        // Gradient energy dome (violet → cyan)
        this.scene.background = new THREE.Color(0x4433aa);

        // Subtle void fog
        this.scene.fog = new THREE.FogExp2(0x2a1a4a, 0.01);

        // Soft ambient glow
        const ambientLight = new THREE.AmbientLight(0x8866ff, 0.4);
        this.scene.add(ambientLight);

        // Directional light from above (no hard shadows)
        const directionalLight = new THREE.DirectionalLight(0x00dddd, 0.3);
        directionalLight.position.set(0, 50, 0);
        directionalLight.castShadow = false;
        this.scene.add(directionalLight);

        // Hemisphere for void gradient
        const hemisphereLight = new THREE.HemisphereLight(
            0x6633cc,  // Sky violet
            0x00cccc,  // Ground cyan
            0.4
        );
        this.scene.add(hemisphereLight);

        // Subtle point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0x8800ff, 0.3, 50);
        pointLight1.position.set(20, 10, 20);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x00dddd, 0.3, 50);
        pointLight2.position.set(-20, 10, -20);
        this.scene.add(pointLight2);
    }

    /**
     * Create fallback ground plane for Quantum Island (QuantumIsland class disabled)
     * Provides basic ground geometry when QuantumIsland.js fails to load
     */
    createQuantumIslandFallbackGround() {
        // Create a dark, metallic disk as ground placeholder
        const groundRadius = 40;
        const groundGeometry = new THREE.CircleGeometry(groundRadius, 64);
        
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0x004455,
            emissiveIntensity: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
        
        // Add subtle neon ring edge
        const ringGeometry = new THREE.TorusGeometry(groundRadius - 1, 0.5, 32, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00dddd,
            emissive: 0x00dddd,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01; // Slightly above to prevent z-fighting
        
        this.scene.add(ring);
    }

    /**
     * Setup Fractal Valley environment
     */
    setupFractalValleyEnvironment() {
        // Gradient sky violet to cyan
        this.scene.background = new THREE.Color(0x5544bb);

        // Distant fog for depth
        this.scene.fog = new THREE.FogExp2(0x7766cc, 0.006);

        // Soft pastel ambient light
        const ambientLight = new THREE.AmbientLight(0xddccff, 0.6);
        this.scene.add(ambientLight);

        // Directional light for rim glow (no shadows)
        const directionalLight = new THREE.DirectionalLight(0xffeeff, 0.5);
        directionalLight.position.set(20, 50, 20);
        directionalLight.castShadow = false;
        this.scene.add(directionalLight);

        // Hemisphere for valley gradient
        const hemisphereLight = new THREE.HemisphereLight(
            0x6633cc,  // Sky violet
            0xd4c8f0,  // Ground pastel
            0.5
        );
        this.scene.add(hemisphereLight);

        // Subtle fill lights
        const fillLight1 = new THREE.PointLight(0xaa88ff, 0.2, 80);
        fillLight1.position.set(-40, 20, -40);
        this.scene.add(fillLight1);

        const fillLight2 = new THREE.PointLight(0x88ddff, 0.2, 80);
        fillLight2.position.set(40, 20, 40);
        this.scene.add(fillLight2);
    }

    /**
     * Setup Memory Lane environment
     */
    setupMemoryLaneEnvironment() {
        // Dark datacenter background
        this.scene.background = new THREE.Color(0x0a0a12);

        // Corridor fog for depth
        this.scene.fog = new THREE.FogExp2(0x0f0f1a, 0.008);

        // Soft ambient lighting
        const ambientLight = new THREE.AmbientLight(0x3344aa, 0.3);
        this.scene.add(ambientLight);

        // Directional light from above
        const directionalLight = new THREE.DirectionalLight(0x6666aa, 0.4);
        directionalLight.position.set(0, 20, 10);
        directionalLight.castShadow = false;
        this.scene.add(directionalLight);

        // Rim lights from sides
        const leftRimLight = new THREE.DirectionalLight(0x00dddd, 0.25);
        leftRimLight.position.set(-20, 5, 0);
        this.scene.add(leftRimLight);

        const rightRimLight = new THREE.DirectionalLight(0x8800ff, 0.25);
        rightRimLight.position.set(20, 5, 0);
        this.scene.add(rightRimLight);

        // Ceiling glow
        const ceilingLight = new THREE.PointLight(0x6633aa, 0.3, 50);
        ceilingLight.position.set(0, 9, 0);
        this.scene.add(ceilingLight);
    }

    /**
     * Setup player with first-person controls
     */
    setupPlayer() {
        // Create invisible player object (we're in first-person)
        const playerGeometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
        const playerMaterial = new THREE.MeshBasicMaterial({
            visible: false
        });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        this.player.position.set(0, 1, 0);
        this.scene.add(this.player);

        // Setup player controller with increased speed
        this.playerController = new PlayerController(this.player, {
            moveSpeed: CONFIG.player.moveSpeed, // Already set to 15 (250% of 6)
            jumpForce: CONFIG.player.jumpForce,
            gravity: CONFIG.player.gravity,
            groundLevel: 1
        });

        // Setup first-person camera
        this.cameraController = new FirstPersonCameraController(
            this.camera,
            this.player,
            this.renderer.domElement,
            {
                eyeHeight: CONFIG.player.eyeHeight,
                mouseSensitivity: 0.002
            }
        );

        // Enable first-person mode
        this.cameraController.enable();
    }

    /**
     * Create the ATOMA world
     */
    createWorld() {
        // ATOMA: visual layer prune/reset on world switch
        this.frameScheduler?.resetLayer?.('visual');

        if (this.currentMode === 'sigma') {
            this.sigmaRift = new SigmaRiftChamber(this.scene);
            this.activeWorld = this.sigmaRift;
        } else if (this.currentMode === 'desert') {
            this.dreamDesert = new DreamDesert(this.scene, this.camera);
            this.activeWorld = this.dreamDesert;
        } else if (this.currentMode === 'quantum') {
            this.setupQuantumIslandEnvironment(); // Restored for lighting/fog/ground
            this.quantumIsland = new QuantumIsland(this.scene, this.camera);
            this.activeWorld = this.quantumIsland;
        } else if (this.currentMode === 'fractal') {
            this.fractalValley = new FractalValley(this.scene);
            this.activeWorld = this.fractalValley;
        } else if (this.currentMode === 'memory') {
            this.memoryLane = new MemoryLane(this.scene);
            this.activeWorld = this.memoryLane;
        } else {
            this.chamber = new World(this.scene);
            this.activeWorld = this.chamber;
        }

        // Create AI nodes for this environment
        this.createAINodes();

        // ====================================================================
        // CONTROLLED UNFREEZE SYSTEM: Safe reactivation of visual systems
        // ====================================================================
        try {
            setupControlledUnfreeze(this);
            console.log('[main.js] ControlledUnfreezeSystem initialized ✓');
        } catch (err) {
            console.warn('[main.js] ControlledUnfreezeSystem initialization failed:', err);
        }
    }

    /**
     * Create interactive AI nodes
     */
    createAINodes() {
        // RESET REGISTRY: Clear unique node tracking for new world generation
        if (nodeSpawnRegistry) {
            nodeSpawnRegistry.reset();
            console.log('✓ NodeSpawnRegistry reset for new world generation');
        }

        this.aiNodes = new AINodes(this.scene, this.player);
        
        // ====================================================================
        // TASK 2: SIMULATION INVARIANT ENFORCEMENT
        // Non-breaking enforcement of registry authority and update participation
        // ====================================================================
        setupSimulationInvariantEnforcement(this.aiNodes);
        console.log('✓ Simulation Invariant Enforcement initialized (TASK 2)');
        
        // ====================================================================
        // TASK 3: RARE NODE VERIFICATION TRACKER
        // Track update ticks, registry participation, shell visibility
        // ====================================================================
        setupRareNodeVerificationTracker(this.aiNodes);
        console.log('✓ Rare Node Verification Tracker initialized (TASK 3)');
        
        // Archetype Visual System – Activation
        const archetypeVisualSystem = patchArchetypeVisuals(this.aiNodes, true);
        console.log('✅ Archetype Visual System enabled (debug mode ON)');
        // Optional: first-spawn program-count log (guarded by PROGRAM_LOG)
        let __loggedFirstSpawn = false;
        const originalCreateNode = this.aiNodes.createNode.bind(this.aiNodes);
        this.aiNodes.createNode = (...args) => {
            const node = originalCreateNode(...args);
            if (!__loggedFirstSpawn) {
                logPrograms('after-first-node', this.renderer);
                __loggedFirstSpawn = true;
            }
            return node;
        };
        
        // ========================================================================
        // SESSION 20: VISUAL HIERARCHY CORRECTION SYSTEM v1.0
        // Enforces visual dominance of core node geometry over auxiliary layers
        // ========================================================================
        this.visualHierarchyCorrection = new VisualHierarchyCorrectionSystem_v1({
          enableAutoEnforcement: true,
          enableDebug: false, // Set to true for debug logging
          enforcementMode: 'constrain', // 'constrain' | 'suppress' | 'relocate'
          radiusScaleFactor: 1.8,
          suppressLegacyExtremes: true
        });
        
        // Register all created nodes with hierarchy system
        for (const node of this.aiNodes.nodes) {
          this.visualHierarchyCorrection.registerNode(node, node.userData?.category || 'input');
        }
        console.log('[main.js] Visual Hierarchy Correction System v1.0 initialized ✓');

        // Initialize dynamic node spawning system
        this.aiNodes.initializeNodeSpawning();

        // ====================================================================
        // SIMULATION EFFECT ORCHESTRATOR (Session 37+ FIXED)
        // Central hub for all dt-based animations (no requestAnimationFrame)
        // Consolidates: node materialization, link pulses, mythic effects
        // ====================================================================
        this.effectOrchestrator = new SimulationEffectOrchestrator(this.scene);
        console.log('[main.js] Simulation Effect Orchestrator initialized ✓');

        // Create node linking system
        this.linkingSystem = new NodeLinkingSystem(
            this.scene,
            this.camera,
            this.renderer,
            this.aiNodes
        );
        console.log('[main.js] NodeLinkingSystem created');
        if (this.frameScheduler && this.linkingSystem?.processNodeTargeting) {
            this.frameScheduler.register('visual', () => this.linkingSystem.processNodeTargeting(), 'node.targeting');
        }

        // One-time shader warm-up for archetype visuals to avoid first-spawn GPU stalls
        if (typeof window !== 'undefined' && window.__shaderWarmupDone !== true) {
            logPrograms('pre-warmup', this.renderer);
            warmUpArchetypeShaders(this.renderer, {
                waveShaderBridge: this.waveShaderBridge,
                waveShaderMaterialPatch: this.waveShaderMaterialPatch,
                waveTravelShaderPack: this.waveTravelShaderPack,
                waveDynamicsShaderPack: this.waveDynamicsShaderPack
            });
            logPrograms('post-warmup', this.renderer);
        }
        const nodeCount = this.currentMode === 'chamber' ? 12 : 15;
        this.aiNodes.createNodes(this.currentMode, nodeCount);

        // Wave shader stacks: register/patch/apply after nodes exist (pre-link usage)
        try {
            if (this.waveShaderBridge && this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    const mats = node?.material
                        ? (Array.isArray(node.material) ? node.material : [node.material])
                        : [];
                    mats.forEach(mat => this.waveShaderBridge?.registerNodeMaterial?.(mat, 'DEFAULT'));
                }
                console.log('[main.js] Wave Shader Bridge: Node materials registered ✓');
            }
            if (this.waveShaderBridge && this.nodeLinking?.links) {
                for (const link of this.nodeLinking.links) {
                    const mats = link?.material
                        ? (Array.isArray(link.material) ? link.material : [link.material])
                        : [];
                    mats.forEach(mat => this.waveShaderBridge?.registerLinkMaterial?.(mat, 'DEFAULT'));
                }
                console.log('[main.js] Wave Shader Bridge: Link materials registered ✓');
            }
        } catch (err) {
            console.warn('[main.js] Wave Shader Bridge material registration error:', err);
        }

        try {
            if (this.waveShaderMaterialPatch && this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    const mats = node?.material
                        ? (Array.isArray(node.material) ? node.material : [node.material])
                        : [];
                    mats.forEach(mat => this.waveShaderMaterialPatch?.patch?.(mat, 'DEFAULT'));
                }
                console.log('[main.js] Wave Shader Material Patch: Node materials patched ✓');
            }
            if (this.waveShaderMaterialPatch && this.nodeLinking?.links) {
                for (const link of this.nodeLinking.links) {
                    const mats = link?.material
                        ? (Array.isArray(link.material) ? link.material : [link.material])
                        : [];
                    mats.forEach(mat => this.waveShaderMaterialPatch?.patch?.(mat, 'SYNERGY'));
                }
                console.log('[main.js] Wave Shader Material Patch: Link materials patched ✓');
            }
        } catch (err) {
            console.warn('[main.js] Wave Shader Material Patch patching error:', err);
        }

        try {
            if (this.waveTravelShaderPack && this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    const mats = node?.material
                        ? (Array.isArray(node.material) ? node.material : [node.material])
                        : [];
                    mats.forEach(mat => this.waveTravelShaderPack?.register?.(mat, 'TRAVEL_LINEAR'));
                }
                console.log('[main.js] Wave Travel Shader Pack: Node materials registered ✓');
            }
            if (this.waveTravelShaderPack && this.nodeLinking?.links) {
                for (const link of this.nodeLinking.links) {
                    const mats = link?.material
                        ? (Array.isArray(link.material) ? link.material : [link.material])
                        : [];
                    mats.forEach(mat => this.waveTravelShaderPack?.register?.(mat, 'TRAVEL_INTERFERENCE'));
                }
                console.log('[main.js] Wave Travel Shader Pack: Link materials registered ✓');
            }
        } catch (err) {
            console.warn('[main.js] Wave Travel Shader Pack registration error:', err);
        }

        try {
            if (this.waveDynamicsShaderPack && this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    const mats = node?.material
                        ? (Array.isArray(node.material) ? node.material : [node.material])
                        : [];
                    mats.forEach(mat => this.waveDynamicsShaderPack?.applyToMaterial?.(mat, 'AURA'));
                }
                console.log('[main.js] Wave Dynamics Shader Pack: Node materials applied ✓');
            }
            if (this.waveDynamicsShaderPack && this.nodeLinking?.links) {
                for (const link of this.nodeLinking.links) {
                    const mats = link?.material
                        ? (Array.isArray(link.material) ? link.material : [link.material])
                        : [];
                    mats.forEach(mat => this.waveDynamicsShaderPack?.applyToMaterial?.(mat, 'SYNERGY'));
                }
                console.log('[main.js] Wave Dynamics Shader Pack: Link materials applied ✓');
            }
        } catch (err) {
            console.warn('[main.js] Wave Dynamics Shader Pack application error:', err);
        }

        // Hook audio feedback to link events
        const originalCreateLink = this.linkingSystem.createLink.bind(this.linkingSystem);
        this.linkingSystem.createLink = (sourceNode, targetNode) => {
            const result = originalCreateLink(sourceNode, targetNode);
            if (this.audioSystem && this.audioSystem.initialized) {
                this.audioSystem.playLinkCreated();
            }
            return result;
        };
        
        const originalRemoveLink = this.linkingSystem.removeLink.bind(this.linkingSystem);
        this.linkingSystem.removeLink = (link) => {
            const result = originalRemoveLink(link);
            if (this.audioSystem && this.audioSystem.initialized) {
                this.audioSystem.playLinkBroken();
            }
            return result;
        };
        
        console.log('✓ Audio feedback hooked to link creation/removal');
        
        // [Session 144+] Initialize Node Linked Aura System (ENABLED)
        this.nodeAuraSystem = new NodeLinkedAuraSystem(
            this.scene,
            this.linkingSystem,
            { enabled: true }  // Feature flag - enabled by default
        );
        
        // Wire orchestrator to linking system for effect registration
        this.linkingSystem.effectOrchestrator = this.effectOrchestrator;
        
        // Wire orchestrator to AINodes for materialization effects
        this.aiNodes.effectOrchestrator = this.effectOrchestrator;

        // ============================================================================
        // PHASE 1 LINK SYSTEMS REACTIVATION (Session 107+)
        // Infrastructure recovery: LinkCorrelationEngine + Hardening + History
        // ============================================================================
        
        // === System 1: Link History Tracker 1.0 (LOW RISK) ===
        try {
            this.linkHistoryTracker = new LinkHistoryTracker1_0(this.linkingSystem, this.scene, {
                enabled: true,
                bufferSize: 100,
                trackQualityChanges: true,
                trackPriorityChanges: true,
                trackCorruptionChanges: true
            });
            console.log('[main.js] LinkHistoryTracker1_0 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkHistoryTracker1_0 initialization failed:', err.message);
            this.linkHistoryTracker = null;
        }

        // === System 2: Link Correlation Engine 1.0 (LOW RISK) ===
        try {
            this.linkCorrelationEngine = new LinkCorrelationEngine1_0(
                this.linkingSystem,
                this.linkHistoryTracker,
                {
                    tickIntervalMs: 3000,              // Run analysis every 3 seconds
                    maxWorkPerTickMs: 1.0,             // Limit to 1ms per frame
                    minSamplesForCorrelation: 5,       // Need 5+ samples before correlating
                    correlationMethod: 'pearson',      // Pearson correlation (standard)
                    minCorrelationScore: 0.15,         // Only report correlations > 0.15
                    minClusterSize: 2,                 // Clusters must have 2+ links
                    enabled: true
                }
            );
            console.log('[main.js] LinkCorrelationEngine1_0 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkCorrelationEngine1_0 initialization failed:', err.message);
            this.linkCorrelationEngine = null;
        }

        // === System 3: Linking System Hardening (MEDIUM RISK) ===
        try {
            if (this.linkingSystem && this.linkGuard) {
                hardenNodeLinkingSystem(
                    this.linkingSystem,
                    this.aiNodes,
                    this.scene,
                    this.linkGuard
                );
                console.log('[main.js] Linking System Hardening applied ✓');
            } else {
                console.warn('[main.js] Skipping hardening: linkingSystem or linkGuard not ready');
            }
        } catch (err) {
            console.warn('[main.js] Linking System Hardening failed:', err.message);
        }

        // ====================================================================
        // LINK ELIGIBILITY GATE v1.0 (Session 99 - Logic-First Repair)
        // Single authoritative source for all link eligibility decisions
        // ====================================================================
        try {
            this.linkEligibilityGate = setupLinkEligibilityGate({
                aiNodes: this.aiNodes,
                linkingSystem: this.linkingSystem,
                debugMode: false  // Set to true to see eligibility logs
            });
            console.log('[main.js] LinkEligibilityGate initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkEligibilityGate initialization failed:', err);
        }

        // ====================================================================
        // LINK DEBUG MODE v1.0 (Session 99 - Debug Visibility)
        // Temporary debug visualization for link eligibility testing
        // ====================================================================
        try {
            this.linkDebugMode = setupLinkDebugMode({
                scene: this.scene,
                linkingSystem: this.linkingSystem,
                eligibilityGate: this.linkEligibilityGate,
                enabled: false  // Set to true to enable debug visualization
            });
            console.log('[main.js] LinkDebugMode initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkDebugMode initialization failed:', err);
        }

        // ====================================================================
        // DYNAMIC LINK COLOR SYSTEM v1.0 (NEW - Real-time synergy colors)
        // Automatically updates link colors based on current synergy scores
        // ====================================================================
        try {
            this.dynamicLinkColorSystem = new DynamicLinkColorSystem(this.linkingSystem);
            
            // Configure for smooth transitions
            this.dynamicLinkColorSystem.configure({
                enabled: true,
                updateFrequency: 1,        // Update every frame
                transitionDuration: 0.3,   // Smooth 300ms transitions
                useParticleColors: true,   // Color particles too
                batchSize: 50              // Process 50 links per batch
            });
            
            setupDynamicLinkColorSystemConsoleAPI(this.dynamicLinkColorSystem);
            console.log('[main.js] DynamicLinkColorSystem initialized ✓');
        } catch (err) {
            console.warn('[main.js] DynamicLinkColorSystem initialization failed:', err);
            this.dynamicLinkColorSystem = null;
        }

        // ====================================================================
        // ANIMATED LINK FLOW SYSTEM v1.0 (Session 112 - Data visualization)
        // Visualizes data flow between nodes with animated packets and beams
        // ====================================================================
        try {
            if (this.linkingSystem && this.linkingSystem.flowSystem) {
                setupAnimatedLinkFlowConsoleAPI(this.linkingSystem.flowSystem);
                console.log('[main.js] Animated Link Flow System console API initialized ✓');
            }
        } catch (err) {
            console.warn('[main.js] Animated Link Flow System setup failed:', err);
        }

        // ====================================================================
        // SYNERGY CASCADE PROPAGATION VISUALIZER v1.0 (NEW)
        // Real-time visualization of synergy energy flowing through networks
        // ====================================================================
        try {
            this.cascadeVisualizer = new SynergyCascadeVisualizer(
                this.scene,
                this.linkingSystem,
                this.camera
            );
            
            // Configure cascade properties
            this.cascadeVisualizer.config.detectionThreshold = 0.7;
            this.cascadeVisualizer.config.propagationSpeed = 2.0;
            this.cascadeVisualizer.config.particleCount = 8;
            
            console.log('[main.js] SynergyCascadeVisualizer initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynergyCascadeVisualizer initialization failed:', err);
            this.cascadeVisualizer = null;
        }

        // ====================================================================
        // HIT PROXY SYSTEM v1.0 (Session 61+)
        // Strict raycast proxy architecture — PHASE 1 PRIMARY SYSTEM
        // Invisible hit-proxies for ALL nodes, real visuals 100% protected
        // ====================================================================
        try {
            const hitProxyResult = applyHitProxyIntegration(
                this.scene,
                this.aiNodes,
                this.linkingSystem,
                { proxyRadius: 0.7, layer: 10, autoSync: true }
            );
            this.hitProxySystem = hitProxyResult.hitProxySystem;
            setupHitProxyDebugAPI();
            console.log('[main.js] ✅ Hit Proxy System v1.0 initialized (Phase 1)');
            console.log(`[main.js] Created ${this.aiNodes.nodes.length} hit-proxy spheres`);
        } catch (err) {
            console.error('[main.js] Hit Proxy System initialization failed:', err);
        }

        // Raycast isolation/failsafe systems removed (handled by consolidated sanitization/registry)

        // ====================================================================
        // HIT-PROXY AUTO-REGISTRAR v1.0 (SESSION 62B - FPS Death Prevention)
        // Ensures every spawned node gets a valid hit-proxy automatically
        // Prevents FPS death from missing/invalid proxies triggering failsafe
        // ====================================================================
        try {
            const hitProxyAutoRegistrar = setupHitProxyAutoRegistrar(this);
            this.hitProxyAutoRegistrar = hitProxyAutoRegistrar;
            console.log('[main.js] ✅ Hit-Proxy Auto-Registrar initialized (Session 62B)');
        } catch (err) {
            console.warn('[main.js] Hit-Proxy Auto-Registrar initialization warning:', err);
        }
        
        // ====================================================================
        // INTEGRATION NODE SELECTION FIX v1.0 (Targeted Compatibility)
        // Enable INTEGRATION nodes to be selected via parent chain resolution
        // ====================================================================
        try {
            patchIntegrationNodeSelection(this.linkingSystem, this.aiNodes);
            setupIntegrationDebugAPI(this.aiNodes);
            console.log('[main.js] INTEGRATION Node Selection Fix applied ✓');
        } catch (err) {
            console.warn('[main.js] INTEGRATION Node Selection Fix failed:', err);
        }
        /* VISUAL LOCK DISABLED - REMOVED FOR SYNTAX RECOVERY */
        // ====================================================================
        // CORE VISUAL AUTHORITY SYSTEM v1.0 (SESSION 46)
        // Guarantees node cores are ALWAYS rendered on top of visual overlays
        // ====================================================================
        try {
            // Session 92: Visual Overlay Audit System for opaque overlay detection
            this.visualOverlayAudit = new VisualOverlayAuditSystem(this.scene);
            this.visualLayerDebugger = new VisualLayerDebugger(this.scene);
            
            // Session 93: Visual Layer Enforcement Gate (runtime prevention)
            this.visualLayerGate = new VisualLayerEnforcementGate();
            this.visualLayerGate.setMode('DEV'); // Start in DEV for safety during development
            
            this.coreVisualAuthority = new CoreVisualAuthoritySystem({
                scene: this.scene,
                enabled: true,
                debugMode: false,
                coreRenderOrder: 1000,
                visualOnlyRenderOrder: -1000,
                rimRenderOrder: 500
            });
            
            // Process all existing nodes
            if (this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    this.coreVisualAuthority.processNode(node);
                }
            }
            
            // Hook node spawn for automatic authority enforcement
            const originalSpawnNode = this.aiNodes?.spawnNode;
            if (originalSpawnNode) {
                const coreVisualAuthority = this.coreVisualAuthority;
                this.aiNodes.spawnNode = function(...args) {
                    const newNode = originalSpawnNode.apply(this, args);
                    // Enforce visual authority on newly spawned node
                    if (newNode && coreVisualAuthority) {
                        coreVisualAuthority.processNode(newNode);
                    }
                    return newNode;
                }.bind(this.aiNodes);
            }
            
            // Setup debug API
            if (window.CoreVisualAuthorityDebug) {
                window.CoreVisualAuthorityDebug.init(this.coreVisualAuthority);
            }
            
            // Session 92: Setup Visual Overlay Audit console API
            if (this.visualOverlayAudit) {
                window.setupVisualOverlayAuditAPI(this.visualOverlayAudit);
            }
            if (this.visualLayerDebugger) {
                window.setupVisualLayerDebuggerAPI(this.visualLayerDebugger);
            }
            
            // Session 93: Setup Visual Layer Enforcement Gate console API
            if (this.visualLayerGate) {
                window.setupVisualLayerEnforcementGateAPI(this.visualLayerGate);
            }
            
            console.log('[main.js] Core Visual Authority System initialized ✓');
        } catch (err) {
            console.warn('[main.js] Core Visual Authority System initialization failed:', err.message);
        }
        
        // ====================================================================
        // HOLOGRAM SHELL AUTHORITY SYSTEM v1.0 (SESSION 46)
        // Ensures shells never obscure node cores
        // ====================================================================
        try {
            this.hologramShellAuthority = new HologramShellAuthoritySystem({
                enabled: true,
                debugMode: false,
                shellRenderOrder: -500,
                maxShellOpacity: 0.5
            });
            
            // Process all existing nodes
            if (this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    this.hologramShellAuthority.processShellGroup(node);
                }
            }
            
            // Setup debug API
            if (window.HologramShellAuthorityDebug) {
                window.HologramShellAuthorityDebug.init(this.hologramShellAuthority);
            }
            
            console.log('[main.js] Hologram Shell Authority System initialized ✓');
        } catch (err) {
            console.warn('[main.js] Hologram Shell Authority System initialization failed:', err.message);
        }
        
        // ====================================================================
        // [SESSION 90] NODE SHELL SIZE AUTHORITY v1.0
        // Enforce static shell sizes derived ONLY from node category and tier
        // Decouple shell scale from network metrics (load, stress, corruption)
        // ====================================================================
        try {
            this.nodeShellSizeAuthority = new NodeShellSizeAuthority({
                baseShellSize: 1.0,
                minShellSize: 0.6,
                maxShellSize: 1.5,
                enabled: true,
                debugMode: false,
                tierMultipliers: {
                    1: 0.9,
                    2: 1.0,
                    3: 1.1,
                    4: 1.2,
                    5: 1.3,
                }
            });
            
            // Register all existing nodes
            if (this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    const category = node.userData?.category || 'crystal';
                    const tier = node.userData?.evolutionTier || 2;
                    this.nodeShellSizeAuthority.registerNode(node, category, tier);
                }
            }
            
            // Hook node spawn for automatic registration
            const originalSpawnNode = this.aiNodes?.spawnNode;
            if (originalSpawnNode) {
                const shellAuthority = this.nodeShellSizeAuthority;
                this.aiNodes.spawnNode = function(...args) {
                    const newNode = originalSpawnNode.apply(this, args);
                    if (newNode && shellAuthority) {
                        const category = newNode.userData?.category || 'crystal';
                        const tier = newNode.userData?.evolutionTier || 2;
                        shellAuthority.registerNode(newNode, category, tier);
                    }
                    return newNode;
                }.bind(this.aiNodes);
            }
            
            console.log('[main.js] Node Shell Size Authority initialized ✓');
        } catch (err) {
            console.warn('[main.js] Node Shell Size Authority initialization failed:', err.message);
        }
        
        // ====================================================================
        // VISUAL INTERACTION ISOLATION PATCH v2.0 - CRITICAL FIX (SESSION 46)
        // Uses intersection filtering instead of raycast disabling
        // NO MORE THREE.JS TypeError: r.raycast is not a function
        // ====================================================================
        try {
            this.interactionIsolation = setupVisualInteractionIsolation_v2(
                this.scene,
                this.aiNodes,
                {
                    enabled: true,
                    interactionLayer: 10,
                    debugMode: false,
                    autoProxyRadius: 0.6
                }
            );
            
            // Setup filtering helper for selection systems
            this.raycastFilter = setupRaycastInteractionFiltering(this.interactionIsolation);
            
            console.log('[main.js] Visual Interaction Isolation Patch v2.0 applied ✓');
            console.log('[main.js] ⚠️  CRITICAL: Update raycaster calls with filtering!');
        } catch (err) {
            console.warn('[main.js] Visual Interaction Isolation Patch v2.0 failed:', err.message);
        }
        
        // ====================================================================
        // NODE SURFACE PROTECTION RULE v2.0 (Session 24 Enhanced)
        // ====================================================================
        // DISABLED: 503 server error - file import disabled to prevent crash
        // This system was protecting node cores from aura occlusion
        // When file serving resumes, re-enable import and initialization
        /*
        // Initialize node surface protection to prevent aura occlusion
        try {
            this.nodeSurfaceProtection = new NodeSurfaceProtectionRule_v2({
                auraOpacityCeiling: 0.25,    // Max aura opacity
                coreOpacityFloor: 0.7,       // Min node core opacity
                debugEnabled: false
            });
            
            // Protect all existing nodes
            if (this.aiNodes?.nodes) {
                this.nodeSurfaceProtection.protectNodes(this.aiNodes.nodes);
            }
            
            // Hook node spawn for automatic protection
            const originalSpawnNode = this.aiNodes?.spawnNode;
            if (originalSpawnNode) {
                this.aiNodes.spawnNode = function(...args) {
                    const newNode = originalSpawnNode.apply(this, args);
                    // Protect newly spawned node
                    if (newNode) {
                        this.game?.nodeSurfaceProtection?.registerNode(newNode);
                    }
                    return newNode;
                }.bind(this.aiNodes);
                this.aiNodes.game = this; // Reference for protection hook
            }
            
            // [SESSION 56] Visual Authority Lock: Disable post-link visual overrides
            // DISABLED: Post-link layering correction was mutating aura opacity & renderOrder
            // Reason: Violates immutable base state principle
            // Link FX are added as separate layers, base state never changes
            
            // Register observer for link creation events
            if (this.linkingSystem && this.linkingSystem.registerObserver) {
                this.linkingSystem.registerObserver({
                    onLinkCreated: (link) => {
                        try {
                            // DISABLED: Attenuate aura opacity on link creation
                            // this.nodeSurfaceProtection?.onLinkCreated(link);
                            
                            // DISABLED: Also apply defensive layering correction
                            // if (link?.nodes?.[0]) correctPostLinkLayering(link.nodes[0]);
                            // if (link?.nodes?.[1]) correctPostLinkLayering(link.nodes[1]);
                        } catch (e) {
                            // Silent failure
                        }
                    }
                });
            }
            
            console.log('[main.js] NodeSurfaceProtectionRule_v2 initialized ✓');
        } catch (err) {
            console.warn('[main.js] NodeSurfaceProtectionRule_v2 initialization failed:', err);
        }
        */
        
        // ====================================================================
        // NODE CORE MATERIAL AUTHORITY SYSTEM v1.0 (Session 26)
        // Material-driven solution: ensures cores are NEVER overridden by auras
        // ====================================================================
        try {
            this.nodeCoreAuthority = new NodeCoreMaterialAuthority({
                debugEnabled: false,
                enableLogging: false
            });
            
            // Register all existing nodes
            if (this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    this.nodeCoreAuthority.registerNodeCore(node);
                }
            }
            
            // Hook node spawn for automatic core registration
            const originalSpawnNode = this.aiNodes?.spawnNode;
            if (originalSpawnNode) {
                this.aiNodes.spawnNode = function(...args) {
                    const newNode = originalSpawnNode.apply(this, args);
                    // Register core immediately after spawn
                    if (newNode && this.game?.nodeCoreAuthority) {
                        this.game.nodeCoreAuthority.registerNodeCore(newNode);
                    }
                    return newNode;
                }.bind(this.aiNodes);
                this.aiNodes.game = this; // Reference for authority hook
            }
            
            // [SESSION 56 FORENSIC FIX] Register observer for link events
            // DISABLED: correctPostLinkLayering was calling undefined function (import was disabled)
            // This was mutating renderOrder and aura opacity POST-LINK
            // Visual authority lock: Base state is immutable, only FX layers are added
            if (this.linkingSystem && this.linkingSystem.registerObserver) {
                this.linkingSystem.registerObserver({
                    onLinkCreated: (link) => {
                        try {
                            // Re-assert core materials after link creation
                            if (link?.nodes?.[0]) this.nodeCoreAuthority?.assertCoreOnLink(link.nodes[0]);
                            if (link?.nodes?.[1]) this.nodeCoreAuthority?.assertCoreOnLink(link.nodes[1]);
                            
                            // DISABLED (Session 56): Defensive layering correction was calling undefined function
                            // if (link?.nodes?.[0]) correctPostLinkLayering(link.nodes[0]);
                            // if (link?.nodes?.[1]) correctPostLinkLayering(link.nodes[1]);
                        } catch (e) {
                            // Silent failure
                        }
                    }
                });
            }
            
            // Setup console API for debugging
            window.debugCoreAuthority = setupNodeCoreAuthorityConsoleAPI(this.nodeCoreAuthority);
            
            console.log('[main.js] NodeCoreMaterialAuthority initialized ✓');
        } catch (err) {
            console.warn('[main.js] NodeCoreMaterialAuthority initialization failed:', err);
        }
        
        // ====================================================================
        // EVENT VISUAL SUPPRESSION SYSTEM v1.0 (Session 26)
        // Prevents event visual effects from diluting or occluding cores
        // ====================================================================
        try {
            this.eventVisualSuppression = new EventVisualSuppression_v1({
                debugEnabled: false,
                enableLogging: false,
                suppressionStrength: 0.8,    // Aggressive suppression
                suppressCoreEmissive: true,
                suppressCoreOpacity: true,
                suppressCoreOverlays: true,
                suppressCoreMaterial: true,
                redirectToAura: true
            });
            
            // Register common event sources for monitoring
            // These will be used to track which systems are applying effects
            
            // Suppress VFX effects for all nodes
            if (this.aiNodes?.nodes) {
                this.eventVisualSuppression.suppressVFXEventEffects(this.aiNodes.nodes);
            }
            
            // Hook on new node spawn to suppress their VFX effects
            const originalSpawnNode = this.aiNodes?.spawnNode;
            if (originalSpawnNode) {
                this.aiNodes.spawnNode = function(...args) {
                    const newNode = originalSpawnNode.apply(this, args);
                    if (newNode && this.game?.eventVisualSuppression) {
                        this.game.eventVisualSuppression.suppressVFXEventEffects([newNode]);
                    }
                    return newNode;
                }.bind(this.aiNodes);
                this.aiNodes.game = this; // Ensure reference exists
            }
            
            // Setup console API for debugging
            window.debugEventSuppression = setupEventSuppressionConsoleAPI(this.eventVisualSuppression);
            
            console.log('[main.js] EventVisualSuppression initialized ✓');
        } catch (err) {
            console.warn('[main.js] EventVisualSuppression initialization failed:', err);
        }
        
        // ====================================================================
        // AURA MODULATION SYSTEM v1.0 (Session 27)
        // Receives redirected event intensity and applies modulation to auras
        // ====================================================================
        try {
            this.auraModulationSystem = new AuraModulationSystem();
            setupAuraModulationConsoleAPI(this.auraModulationSystem);
            
            // Initialize integration with EventVisualSuppression
            this.auraModulationIntegration = new AuraModulationIntegration_v1(
                this.auraModulationSystem,
                this.eventVisualSuppression,
                this.scene
            );
            this.auraModulationIntegration.initialize();
            setupAuraModulationIntegrationConsoleAPI(this.auraModulationIntegration);
            
            // Setup redirection in EventVisualSuppression
            setupAuraModulationRedirection(this.auraModulationIntegration);
            
            // Hook existing nodes
            this.auraModulationIntegration.hookExistingNodes();
            
            console.log('[main.js] AuraModulationSystem v1.0 initialized ✓');
        } catch (err) {
            console.warn('[main.js] AuraModulationSystem initialization failed:', err);
        }
        
        // ====================================================================
        // ENHANCED NODE MODEL LINK STATE v1.0 (Session 28) — DISABLED
        // Reason: Violates visual authority lock. Linking is a relationship,
        // not a visual mutation. BaseVisualState is immutable authority.
        // Nodes must look IDENTICAL before and after linking.
        // Link FX are applied as ADDITIVE layers only (arc, glow, pulse).
        // ====================================================================
        // DISABLED: this.enhancedNodeModelLinkState = new EnhancedNodeModelLinkState();
        // Kept commented for reference but NOT instantiated
        
        // ====================================================================
        // GLOBAL AURA OPACITY CLAMP v1.0 (Session 28)
        // Clamps all aura opacity to ≤ 0.10 after linking
        // ====================================================================
        try {
            this.globalAuraOpacityClamp = new GlobalAuraOpacityClamp();
            setupGlobalAuraOpacityClampConsoleAPI(this.globalAuraOpacityClamp);
            
            // [TASK 1 FIX] Integrate with NodeLinkingSystem for automatic aura clamping on link creation
            if (this.linkingSystem) {
                integrateGlobalAuraOpacityClamp(this.linkingSystem, this.globalAuraOpacityClamp);
                setupGlobalAuraOpacityClampIntegrationConsoleAPI(this.linkingSystem, this.globalAuraOpacityClamp);
                console.log('[main.js] ✅ GlobalAuraOpacityClamp integrated with NodeLinkingSystem');
            } else {
                console.warn('[main.js] ⚠️ linkingSystem not available for GlobalAuraOpacityClamp integration');
            }
            
            console.log('[main.js] GlobalAuraOpacityClamp initialized ✓');
        } catch (err) {
            console.warn('[main.js] GlobalAuraOpacityClamp initialization failed:', err);
        }
        
        // ====================================================================
        // CORE MATERIAL MUTATION DETECTOR v1.0 (Session 28)
        // Automated detection and repair of core material mutations
        // ====================================================================
        try {
            this.coreMaterialMutationDetector = new CoreMaterialMutationDetector({
                debugEnabled: false,
                reportViolations: true,
                autoRepair: true,
                maxViolationsToReport: 100,
            });
            setupCoreMutationDetectorConsoleAPI(this.coreMaterialMutationDetector);
            
            // Initialize test suite
            this.coreMaterialTestSuite = new CoreMaterialMutationTestSuite(
                this.coreMaterialMutationDetector,
                this.scene,
                {
                    verbose: true,
                    stopOnFailure: false,
                    maxTestDuration: 5000,
                }
            );
            setupCoreMaterialTestSuiteConsoleAPI(this.coreMaterialTestSuite);
            
            // Register all node cores with detector
            if (this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    // Find core mesh (usually node.mesh itself or first child)
                    let core = node.mesh || node;
                    if (core && core.material) {
                        this.coreMaterialMutationDetector.registerCore(node, core);
                    }
                }
            }
            
            console.log('[main.js] CoreMaterialMutationDetector initialized ✓');
        } catch (err) {
            console.warn('[main.js] CoreMaterialMutationDetector initialization failed:', err);
        }
        
        // ====================================================================
        // CORE MATERIAL PROPERTY LOCK v1.0 (Session 30 - Hard Enforcement)
        // Enforces immutability of core material properties at runtime
        // ====================================================================
        try {
            this.coreMaterialPropertyLock = new CoreMaterialPropertyLock({
                debugEnabled: false,
                enforceOnFrame: true,
                violationDetectionEnabled: true,
            });
            setupCoreMaterialPropertyLockConsoleAPI(this.coreMaterialPropertyLock);
            
            // Initialize tracking map for iteration
            this.coreMaterialPropertyLock.initializeTrackingMap();
            
            // Register all node core materials with the lock
            if (this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    // Traverse node to find all core materials
                    node.traverse((child) => {
                        if (child.isMesh && child.material) {
                            // Check if this is a core mesh (marked with isNodeCore flag)
                            if (child.userData?.isNodeCore || 
                                child.name?.toLowerCase().includes('core') ||
                                child.userData?.vfxType?.includes('core')) {
                                
                                // Register core material for locking
                                this.coreMaterialPropertyLock.registerCoreMaterial(
                                    child.material,
                                    node.userData?.id || 'unknown'
                                );
                                
                                // Add to tracking map for frame enforcement
                                this.coreMaterialPropertyLock.addToTrackingMap(child.material);
                            }
                        }
                    });
                }
            }
            
            console.log('[main.js] CoreMaterialPropertyLock initialized ✓');
        } catch (err) {
            console.warn('[main.js] CoreMaterialPropertyLock initialization failed:', err);
        }
        
        // Initialize Link Recommendation AI 1.0 (after linking system ready)
        this.linkRecommendationAI = new LinkRecommendationAI1_0(
            this.linkingSystem,
            null, // correlationEngine (optional, attached later if available)
            null, // priorityHistoryEngine (optional, attached later if available)
            null  // priorityDecayEngine (optional, attached later if available)
        );
        console.log('[main.js] LinkRecommendationAI1_0 initialized ✓');
        
        // Initialize Link Automation Engine 1.0 (after recommendation AI ready)
        this.linkAutomationEngine = new LinkAutomationEngine1_0(
            this.linkingSystem,
            this.linkRecommendationAI,
            {
                automationThreshold: 0.65,
                maxLinksPerCycle: 3,
                requireUserTrigger: true,
                safetyCooldownMs: 500,
                enabled: false
            }
        );
        console.log('[main.js] LinkAutomationEngine1_0 initialized ✓');
        
        // Initialize Link Quality Predictor 1.0 (link viability evaluation)
        this.linkQualityPredictor = new LinkQualityPredictor1_0(
            this.linkingSystem,
            computeSynergyScore,
            this.scene
        );
        console.log('[main.js] LinkQualityPredictor1_0 initialized ✓');
        
        // Integrate quality predictor with recommendation AI
        // (AI will use predictor to rank candidates)
        if (this.linkRecommendationAI && this.linkQualityPredictor) {
            this.linkRecommendationAI.linkQualityPredictor = this.linkQualityPredictor;
        }
        
        // Integrate quality predictor with automation engine
        // (Automation will filter poor-quality links)
        if (this.linkAutomationEngine && this.linkQualityPredictor) {
            this.linkAutomationEngine.linkQualityPredictor = this.linkQualityPredictor;
            this.linkQualityPredictor.setAutomationThreshold(65); // 65+ quality required
        }
        
        // Initialize Synergy Recommendation Debug HUD 1.0 (real-time monitoring)
        this.synergyDebugHUD = new SynergyRecommendationDebugHUD(
            this.linkRecommendationAI,
            this.linkAutomationEngine
        );
        console.log('[main.js] SynergyRecommendationDebugHUD1_0 initialized ✓');
        
        // Initialize Auto Link Feedback UI 1.0 (visual feedback for automation)
        this.autoLinkFeedbackUI = new AutoLinkFeedbackUI1_0(
            this.scene,
            this.neonLinkVisuals || null // Will use if available
        );
        
        // Register callback for link creation feedback
        if (this.linkAutomationEngine && this.autoLinkFeedbackUI) {
            this.linkAutomationEngine.registerOnAutoLinkCreated((sourceNode, targetNode, synergyScore) => {
                this.autoLinkFeedbackUI.registerOnAutoLink(sourceNode, targetNode, synergyScore);
            });
        }
        console.log('[main.js] AutoLinkFeedbackUI1_0 initialized ✓');
        
        // Connect UISelectedHUD to the new linkingSystem
        if (this.selectedHUD) {
            console.log('[main.js] ✓ selectedHUD exists, connecting to linkingSystem');
            this.selectedHUD.setLinkingSystem(this.linkingSystem);
            console.log('[main.js] ✓ HUD successfully connected to linkingSystem');
        } else {
            console.warn('[main.js] ⚠ selectedHUD not initialized! Getting fresh instance');
            this.selectedHUD = getSelectedHUD();
            this.selectedHUD.setLinkingSystem(this.linkingSystem);
            console.log('[main.js] ✓ HUD instance obtained and connected to linkingSystem');
        }

        // Initialize HUD Synchronization Patch 1.0 (single source of truth for HUD updates)
        // AFTER selectedHUD.setLinkingSystem() to ensure both parameters are ready
        this.selectedHUDSyncPatch = new SelectedHUDSyncPatch1_0(
            this.selectedHUD,
            this.linkingSystem
        );
        this.selectedHUDSyncPatch.init();
        console.log('[main.js] SelectedHUDSyncPatch1_0 initialized ✓');
        
        // ====================================================================
        // LINK PRIORITY DECAY ENGINE 1.0 INITIALIZATION (Session 27 Extended)
        // ====================================================================
        // Initialize 4 upstream dependency systems (in dependency order)
        
        // ===================================================================
        // [SESSION 88] LINK QUALITY CALCULATOR - Per-frame quality metrics
        // ===================================================================
        this.linkQualityCalculator = new LinkQualityCalculator(
            this.linkingSystem,
            this.nodeDynamics,
            {
                // Quality component weighting (sums to 1.0)
                structuralWeight: 0.30,          // Link geometry & validity
                harmonyWeight: 0.40,             // Node stability & harmony
                loadWeight: 0.15,                // Load pressure ratio
                corruptionWeight: 0.15,          // Corruption influence
                
                // Structural quality parameters
                baseStructuralScore: 80,
                maxLinkDistance: 50,
                distancePenaltyRate: 0.5,
                stalenessThreshold: 5000,
                
                // EMA smoothing (optional, disabled by default)
                enableEmaSmoothing: false,
                emasAlpha: 0.2
            }
        );
        console.log('[main.js] LinkQualityCalculator initialized ✓');
        
        // 1. Link Quality Feedback Loop 1.0 - Link outcome evaluation
        this.linkQualityFeedbackLoop = new LinkQualityFeedbackLoop1_0(this.linkingSystem);
        console.log('[main.js] LinkQualityFeedbackLoop1_0 initialized ✓');
        
        // ===================================================================
        // [SESSION 88] LINK DEGRADATION SYSTEM - Quality-based effect scaling
        // ===================================================================
        this.linkDegradationSystem = new LinkDegradationSystem(
            this.linkingSystem,
            this.linkQualityCalculator,
            {
                // Quality thresholds (aligned with LinkQualityCalculator levels)
                fullQualityThreshold: 80,        // 100% efficient
                degradedStartThreshold: 55,      // Degradation begins
                severeThreshold: 30,             // Heavy degradation
                criticalThreshold: 10,           // Near collapse
                
                // Visual effect scaling
                minVisualIntensity: 0.15,        // Don't go fully invisible
                minParticleEmission: 0.20,       // Some particles always
                
                // Load noise/jitter effects
                enableLoadNoise: true,
                maxLoadNoiseIntensity: 0.3,
                
                // Metrics contribution scaling
                enableMetricsScaling: true,
                minMetricsContribution: 0.1,
                
                // Degradation curve shaping
                enableExponentialFalloff: true,
                exponentialPower: 1.5
            }
        );
        console.log('[main.js] LinkDegradationSystem initialized ✓');
        
        // ===================================================================
        // [SESSION 89] LINK COLLAPSE SYSTEM - Conditional failure under extreme stress
        // ===================================================================
        this.linkCollapseSystem = new LinkCollapseSystem(
            this.linkingSystem,
            this.linkQualityCalculator,
            this.linkDegradationSystem,
            {
                // Collapse eligibility thresholds
                corruptionThreshold: 0.8,           // 80% corruption
                criticalLoadThreshold: 1.0,         // 100% node capacity
                
                // Temporal requirements
                minStressAccumulation: 3000,        // 3 seconds minimum
                maxStressWindow: 10000,             // 10 second tracking window
                
                // Collapse progression (0.0 - 1.0 scale)
                warningThreshold: 0.3,              // 30% → warning state
                criticalThreshold: 0.7,             // 70% → critical state
                collapseThreshold: 1.0,             // 100% → collapse
                
                // Stress dynamics
                stressAccumulationRate: 0.15,       // +0.15 per second under extreme conditions
                stressRecoveryRate: 0.05,           // -0.05 per second when improving
                
                // Visual feedback integration
                enableVisualFeedback: true,         // Feed collapse state to visual systems
            }
        );
        console.log('[main.js] LinkCollapseSystem initialized ✓');
        
        // ===================================================================
        // [SESSION 91] PARTICLE EMISSION SCALER - Network corruption/stress driven
        // ===================================================================
        this.particleEmissionScaler = new ParticleEmissionScaler(
            this.nodeDynamicMetrics,
            this.linkingSystem,
            {
                // Network-level scaling sources
                useNetworkCorruption: true,
                useNetworkStress: true,
                useNetworkLoad: true,
                
                // Corruption scaling
                corruptionCurve: 'exponential',      // Accelerates as corruption increases
                corruptionMultiplier: 2.0,           // Up to 2x more particles at max corruption
                corruptionThreshold: 0.3,            // Start scaling at 30% corruption
                
                // Stress scaling
                stressCurve: 'exponential',
                stressMultiplier: 1.5,               // Up to 1.5x more at max stress
                stressThreshold: 0.4,                // Start at 40% network stress
                
                // Load scaling
                loadMultiplier: 1.2,                 // Up to 1.2x at max load
                loadThreshold: 0.7,                  // Start at 70% load
                
                // Per-link scaling
                perLinkCorruptionMultiplier: 1.5,    // Links scale by own corruption
                perLinkDegradationMultiplier: 1.3,   // Links scale by quality degradation
                
                // Temporal smoothing (EMA)
                emissionEMAAlpha: 0.15,              // Smooth transitions
                
                // Debug
                enabled: true,
                debugMode: false,
            }
        );
        console.log('[main.js] ParticleEmissionScaler initialized ✓');
        
        // ===================================================================
        // [SESSION 105] LINK METRICS TO VISUAL BRIDGE - Real-time metrics-to-visuals
        // ===================================================================
        // Aggregates metrics from LinkDegradationSystem, LinkCollapseSystem, and
        // CorruptionSystem into unified shader uniforms that drive link fracture visualization
        try {
            // Defer initialization until systems are stable
            this.linkMetricsToVisualBridge = null;
            
            // Initialize after animate loop starts (when all systems are ready)
            setTimeout(() => {
                if (!this.linkMetricsToVisualBridge && this.linkDegradationSystem && this.linkCollapseSystem) {
                    try {
                        this.linkMetricsToVisualBridge = new LinkMetricsToVisualBridge(
                            this.linkDegradationSystem,
                            this.linkCollapseSystem,
                            null,  // CorruptionSystem not directly available; can be wired later
                            this.linkingSystem?.visuals  // NeonLinkVisuals instance
                        );
                        // Setup console debug API for metrics bridge
                        setupLinkMetricsBridgeConsoleAPI(this.linkMetricsToVisualBridge);
                        console.log('[main.js] LinkMetricsToVisualBridge deferred initialization ✓');
                    } catch (err) {
                        console.error('[main.js] LinkMetricsToVisualBridge init error:', err);
                    }
                }
            }, 100);
        } catch (err) {
            console.warn('[main.js] LinkMetricsToVisualBridge initialization deferred:', err.message);
            this.linkMetricsToVisualBridge = null;
        }
        
        // ===================================================================
        // [SESSION 106+] STRESS-BASED PARTICLE SCALER - Particle scaling from link stress
        // ===================================================================
        // Scales link particle emission rates based on per-link stress values
        // Higher stress = more/faster particles with color-coded feedback
        this.stressBasedParticleScaler = null;
        
        setTimeout(() => {
            if (!this.stressBasedParticleScaler && this.linkMetricsToVisualBridge && this.linkingSystem) {
                try {
                    this.stressBasedParticleScaler = new StressBasedParticleScaler_v1(
                        this.linkMetricsToVisualBridge,
                        this.linkingSystem,
                        {
                            // Particle emission scaling
                            minParticleMultiplier: 0.5,        // Reduce to 0.5x at 0% stress
                            maxParticleMultiplier: 3.0,        // Increase to 3.0x at 100% stress
                            particleScalingCurve: 'quadratic', // 'linear', 'quadratic', 'exponential'
                            
                            // Particle speed scaling
                            minParticleSpeed: 1.0,             // Min speed multiplier
                            maxParticleSpeed: 2.5,             // Max speed multiplier
                            
                            // Color coding by stress
                            enableStressColors: true,
                            
                            // Smoothing for temporal coherence
                            enableSmoothing: true,
                            smoothingAlpha: 0.2,
                            
                            // Performance
                            enableCache: true,
                            enableLogging: false,
                            enabled: true,
                        }
                    );
                    
                    // Setup console debug API
                    setupStressParticleScalerConsoleAPI(this.stressBasedParticleScaler);
                    console.log('[main.js] StressBasedParticleScaler deferred initialization ✓');
                } catch (err) {
                    console.error('[main.js] StressBasedParticleScaler init error:', err);
                }
            }
        }, 150);  // Wait 150ms to ensure LinkMetricsToVisualBridge is ready first
        
        // 2. User Acceptance Tracker 1.0 - Player interaction metrics
        this.userAcceptanceTracker = new UserAcceptanceTracker1_0();
        console.log('[main.js] UserAcceptanceTracker1_0 initialized ✓');
        
        // 3. Link ML Recommendation Engine 1.0 - ML-based learning (depends on feedback loop)
        this.linkMLRecommendationEngine = LinkMLRecommendationEngine1_0;
        if (this.linkMLRecommendationEngine?.setFeedbackLoop && this.linkQualityFeedbackLoop) {
            this.linkMLRecommendationEngine.setFeedbackLoop(this.linkQualityFeedbackLoop);
        }
        if (this.linkMLRecommendationEngine?.setUserAcceptanceTracker && this.userAcceptanceTracker) {
            this.linkMLRecommendationEngine.setUserAcceptanceTracker(this.userAcceptanceTracker);
        }
        console.log('[main.js] LinkMLRecommendationEngine1_0 initialized ✓');
        
        // 4. Node Linker Repair Layer 1.0 - Self-healing validation (depends on quality feedback)
        this.nodeLinkerRepairLayer = new NodeLinker2_RepairLayer1_0(this.linkingSystem, this.aiNodes);
        if (this.nodeLinkerRepairLayer?.init) {
            this.nodeLinkerRepairLayer.init();
        }
        console.log('[main.js] NodeLinker2_RepairLayer1_0 initialized ✓');
        
        // Initialize Link Priority Decay Engine 1.0 (main system)
        this.linkPriorityDecayEngine = new LinkPriorityDecayEngine(
            this.linkingSystem,
            this.scene
        );
        
        // Wire all upstream systems into decay engine (safe optional chaining)
        if (this.linkQualityFeedbackLoop) {
            this.linkPriorityDecayEngine.setQualityFeedbackLoop(this.linkQualityFeedbackLoop);
        }
        if (this.userAcceptanceTracker) {
            this.linkPriorityDecayEngine.setUserAcceptanceTracker(this.userAcceptanceTracker);
        }
        if (this.linkMLRecommendationEngine) {
            this.linkPriorityDecayEngine.setMLRecommendationEngine(this.linkMLRecommendationEngine);
        }
        if (this.nodeLinkerRepairLayer) {
            this.linkPriorityDecayEngine.setRepairLayer(this.nodeLinkerRepairLayer);
        }
        
        // Register decay engine as observer for link events
        if (this.linkingSystem && this.linkingSystem.registerObserver) {
            this.linkingSystem.registerObserver({
                onLinkCreated: (link) => this.linkPriorityDecayEngine?.onLinkCreated(link),
                onLinkRemoved: (link) => this.linkPriorityDecayEngine?.onLinkRemoved(link),
                onLinkUpdated: (link) => this.linkPriorityDecayEngine?.onLinkUpdated(link)
            });
        }
        
        // Register acceptance tracker with linking system (monitor user interactions)
        if (this.userAcceptanceTracker && this.linkingSystem) {
            if (this.linkingSystem.registerObserver) {
                this.linkingSystem.registerObserver({
                    onLinkCreated: (link) => this.userAcceptanceTracker?.trackLinkCreation(link),
                    onLinkRemoved: (link) => this.userAcceptanceTracker?.trackLinkRemoval(link),
                    onLinkInteraction: (link, action) => this.userAcceptanceTracker?.trackInteraction(link, action)
                });
            }
        }
        
        // Wire quality feedback loop to linking system for outcome tracking
        if (this.linkQualityFeedbackLoop && this.linkingSystem) {
            if (this.linkingSystem.registerObserver) {
                this.linkingSystem.registerObserver({
                    onLinkCreated: (link) => this.linkQualityFeedbackLoop?.onLinkCreated(link),
                    onLinkRemoved: (link) => this.linkQualityFeedbackLoop?.onLinkRemoved(link)
                });
            }
        }
        
        console.log('[main.js] LinkPriorityDecayEngine system initialized ✓');
        console.log('[main.js] ✓ All 5 dependency systems ready: Decay → Feedback → Acceptance → ML → Repair');

        // ====================================================================
        // TIER 1 INTEGRATION: Core Active Systems (Phase A)
        // Corruption Transmission + Harmony Stabilization
        // ====================================================================
        
        // Initialize Link Corruption Transmission v1.0
        try {
            this.linkCorruptionTransmission = new LinkCorruptionTransmission_v1(
                this.aiNodes,           // AI nodes system
                this.linkingSystem       // Link system
            );
            console.log('[main.js] LinkCorruptionTransmission_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkCorruptionTransmission_v1 initialization failed:', err);
        }
        
        // Initialize Harmony Stabilization System v1.0
        try {
            this.harmonyStabilizationSystem = new HarmonyStabilizationSystem_v1(
                this.aiNodes,                               // AI nodes system
                this.linkingSystem,                         // Link system
                false,                                      // Debug mode off
                this.linkCorruptionTransmission             // LinkCorruptionTransmission for category multipliers
            );
            console.log('[main.js] HarmonyStabilizationSystem_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] HarmonyStabilizationSystem_v1 initialization failed:', err);
        }
        
        // ====================================================================
        // T4-003: CORRUPTION CASCADE TEST RUNNER (Debug Console)
        // Setup console commands for cascade validation
        // ====================================================================
        try {
            setupCorruptionCascadeTestRunner(this);
            console.log('[main.js] T4-003 Corruption Cascade Test Runner initialized ✓');
        } catch (err) {
            console.warn('[main.js] T4-003 Test Runner initialization error:', err);
        }

        // ====================================================================
        // T4-004: HARMONY HEALING TEST RUNNER (Debug Console)
        // Setup console commands for harmony validation
        // ====================================================================
        try {
            setupHarmonyHealingTestRunner(this);
            console.log('[main.js] T4-004 Harmony Healing Test Runner initialized ✓');
        } catch (err) {
            console.warn('[main.js] T4-004 Test Runner initialization error:', err);
        }
        
        // ====================================================================
        // TIER 2 VISUAL INTEGRATION: Visual System Wiring (T2-002 & T2-003)
        // ====================================================================
        
        // T2-002: Initialize Corruption Visual Integration
        try {
            this.t2CorruptionVisualIntegration = new T2_CorruptionVisualIntegration_v1(
                this.scene,
                this.linkingSystem,
                null  // CorruptionVisualFX reference (optional)
            );
            console.log('[main.js] T2_CorruptionVisualIntegration_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] T2_CorruptionVisualIntegration_v1 initialization failed:', err);
        }
        
        // T2-003: Initialize Harmony Visual Consumer
        try {
            this.t2HarmonyVisualConsumer = new T2_HarmonyVisualConsumer_v1(
                this.scene,
                this.harmonyStabilizationSystem
            );
            console.log('[main.js] T2_HarmonyVisualConsumer_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] T2_HarmonyVisualConsumer_v1 initialization failed:', err);
        }
        
        // ====================================================================
        // TIER 4 GAMEPLAY INTEGRATION: Gameplay Layer
        // Connect player actions to TIER 1-3 systems
        // ====================================================================
        try {
            this.tier4GameplayIntegration = new TIER4_GameplayIntegrationBridge({
                enableDebug: false,
                enableVisualFeedback: true,
                enableUIFeedback: true,
                enableGameplayLogic: true,
                linkCreationCorruptionSeed: 0.1,
                linkCreationHarmonyBoost: 0.3,
                linkDestructionHarmonyBoost: 0.2,
                cascadeMitigationStrength: 0.15,
                showCorruptionSeedPulse: true,
                showCascadeWarning: true,
                showHarmonyPulse: true,
                uiPosition: 'top-right',
                uiTheme: 'neon'
            });
            
            // Initialize with all required systems
            this.tier4GameplayIntegration.initialize(
                this.linkingSystem,
                this.aiNodes,
                this.scene,
                this.linkCorruptionTransmission,
                this.harmonyStabilizationSystem
            );
            
            console.log('[main.js] TIER4_GameplayIntegrationBridge initialized ✓');
        } catch (err) {
            console.warn('[main.js] TIER4_GameplayIntegrationBridge initialization failed:', err);
        }
        
        // ====================================================================
        // PHASE 5: MULTI-NETWORK SYNCHRONIZATION INITIALIZATION
        // ====================================================================
        try {
            this.phase5MultiNetworkOrchestrator = new PHASE5_MultiNetworkOrchestrator({
                enableDebug: false,
                enableLogging: false,
                maxNetworks: 10,
                syncInterval: 100,
                enableCorruptionSpread: true,
                enableSynchronization: true,
                enableEventPropagation: true
            });
            
            // Initialize orchestrator
            this.phase5MultiNetworkOrchestrator.initialize();
            
            // Register primary network (current network as Network 0)
            // This allows future multi-network scenarios
            this.phase5MultiNetworkOrchestrator.registerNetwork(
                'primary',
                {
                    aiNodes: this.aiNodes,
                    linkingSystem: this.linkingSystem,
                    linkCorruptionTransmission: this.linkCorruptionTransmission,
                    harmonyStabilizationSystem: this.harmonyStabilizationSystem
                },
                {
                    name: 'Primary Network',
                    position: { x: 0, y: 0, z: 0 }
                }
            );
            
            console.log('[main.js] PHASE5_MultiNetworkOrchestrator initialized ✓');
        } catch (err) {
            console.warn('[main.js] PHASE5_MultiNetworkOrchestrator initialization failed:', err);
        }
        
        // ====================================================================
        // PHASE 5: INTER-NETWORK CONNECTION VISUALS (Disabled)
        // ====================================================================
        // Hard off: skip initialization of visuals and bridge
        // this.phase5InterNetworkConnectionVisuals = null;
        // this.phase5InterNetworkVisualizationBridge = null;
        
        // ====================================================================
        // PHASE 5: CASCADE PROPAGATION VISUAL EFFECTS
        // ====================================================================
        // Initialize cascade propagation visual effects (expanding rings)
        if (VISUAL_SYSTEMS_ENABLED) {
            try {
                this.phase5CascadePropagationVisuals = new PHASE5_CascadePropagationVisuals(
                    this.scene,
                    {
                        enableDebug: false,
                        enableLogging: false,
                        ringRadius: 1.5,
                        expandSpeed: 8.0,
                        fadeDuration: 0.8,
                        maxRingSize: 15.0,
                        corruptionCascadeColor: 0xff3333,  // Red
                        harmonyCascadeColor: 0x00ffff,     // Cyan
                        threatCascadeColor: 0xff6600,      // Orange
                        maxActiveRings: 50,
                        depthDecayFactor: 0.7
                    }
                );
                console.log('[main.js] PHASE5_CascadePropagationVisuals initialized ✓');
            } catch (err) {
                console.warn('[main.js] PHASE5_CascadePropagationVisuals initialization failed:', err);
            }
        } else {
            this.phase5CascadePropagationVisuals = null;
        }
        
        // Initialize cascade visualization bridge
        if (VISUAL_SYSTEMS_ENABLED) {
            try {
                this.phase5CascadeVisualizationBridge = new PHASE5_CascadeVisualizationBridge(
                    this.aiNodes,
                    this.linkCorruptionTransmission,
                    this.phase5CascadePropagationVisuals,
                    {
                        enableDebug: false,
                        enableLogging: false,
                        corruptionCascadeThreshold: 0.7,
                        threatCascadeThreshold: 0.5,
                        harmonyCascadeThreshold: 0.8,
                        maxEventHistory: 100
                    }
                );
                console.log('[main.js] PHASE5_CascadeVisualizationBridge initialized ✓');
            } catch (err) {
                console.warn('[main.js] PHASE5_CascadeVisualizationBridge initialization failed:', err);
            }
        } else {
            this.phase5CascadeVisualizationBridge = null;
        }

        // ====================================================================
        // NODE HIERARCHY SYSTEM v1.0 — Parent-Child Node Relationships
        // Enables organizational hierarchies, property cascading, visualization
        // ====================================================================
        try {
            this.nodeHierarchyBridge = new NodeHierarchyBridge(
                this.scene,
                this.camera,
                this.aiNodes,
                this.linkingSystem
            );
            
            // Initialize after all nodes/links are ready
            this.nodeHierarchyBridge.init();
            
            // Expose console API for debugging
            window.hierarchyDebug = this.nodeHierarchyBridge.getConsoleAPI();
            
            console.log('[main.js] NodeHierarchyBridge v1.0 initialized ✓');
        } catch (err) {
            console.warn('[main.js] NodeHierarchyBridge initialization failed:', err);
        }

        // ====================================================================
        // PHASE 3C PERSONALITY VISUAL ADAPTER (Week 1 - Visual Personality)
        // ====================================================================
        // Initialize PersonalityVisualAdapter (computes visual personality signals)
        // This is a safe, additive layer that reads Phase 3 metrics and writes
        // visual personality signals to node.userData.personalityVisual
        this.personalityVisualAdapter = new PersonalityVisualAdapter(
            this.aiNodes,
            this.linkingSystem,
            {
                enableDebug: false,
                enableWarnings: false
            }
        );
        console.log('[main.js] PersonalityVisualAdapter initialized ✓');

        // ====================================================================
        // PHASE 3C PERSONALITY VFX LAYER (Week 2 - Visual Effects Application)
        // ====================================================================
        // Initialize PersonalityVFXLayer_v1 (applies VFX effects to nodes)
        // This layer reads personality visual signals and applies frame-local
        // transformations: emissive intensity, pulse, jitter, rotation, color tint
        this.personalityVFXLayer = new PersonalityVFXLayer_v1(
            this.aiNodes,
            {
                enableDebug: false,
                enableWarnings: false
            }
        );
        console.log('[main.js] PersonalityVFXLayer_v1 initialized ✓');

        // ====================================================================
        // PHASE 3C PERSONALITY SHADER BRIDGE (Week 3 - GPU Shader Integration)
        // ====================================================================
        // Initialize PersonalityShaderBridge_v1 (binds signals to GPU uniforms)
        // This layer safely injects personality uniforms into shaders
        // without modifying existing shader logic
        try {
            this.personalityShaderBridge = new PersonalityShaderBridge_v1(
                this.scene,
                this.aiNodes,
                {
                    enableDebug: false,
                    enableWarnings: false
                }
            );
            console.log('[main.js] PersonalityShaderBridge_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize PersonalityShaderBridge_v1:', err);
        }

        // ====================================================================
        // PHASE 3C PERSONALITY SHADER EFFECTS PACK (Week 4 - Visual Polish)
        // ====================================================================
        // Initialize PersonalityShaderEffects_Pack_v1 (advanced shader effects)
        // This layer applies gameplay-readable effects (bloom, corruption, waves, etc)
        // using the existing uniforms from PersonalityShaderBridge_v1
        try {
            this.personalityShaderEffects = new PersonalityShaderEffects_Pack_v1({
                enableDebug: false,
                enableWarnings: false
            });
            console.log('[main.js] PersonalityShaderEffects_Pack_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize PersonalityShaderEffects_Pack_v1:', err);
        }

        // ====================================================================
        // PHASE 3C PERSONALITY SHADER ADVANCED FX (Week 5 - Procedural Distortion)
        // ====================================================================
        // Initialize PersonalityShaderAdvancedFX_v1 (GPU-side procedural noise effects)
        // This layer applies advanced vertex/fragment distortion using procedural noise
        // driven by personality signals from PersonalityShaderBridge_v1
        try {
            this.advancedShaderFX = new PersonalityShaderAdvancedFX_v1({
                scene: this.scene,
                lowFXProvider: () => this.lowFXModeEnabled ?? false,
            });
            console.log('[main.js] AdvancedFX initialized ✓');
        } catch (err) {
            console.warn('[main.js] AdvancedFX init error:', err);
        }

        // ====================================================================
        // PHASE 3C ARCHETYPE ASCENSION CURVES (Week 13 - Personality-Driven Curves)
        // ====================================================================
        // Initialize ArchetypeAscensionCurves_v1 (personality-driven ascension profiling)
        // This layer reads from MythicEvolutionFX and writes ascension multipliers
        // for Week 14/15 systems to apply
        try {
            this.archetypeCurves = new ArchetypeAscensionCurves_v1({
                aiNodes: this.aiNodes,
                mythicEvolutionFX: this.mythicEvolutionFX,
                nodeDynamicMetrics: this.nodeDynamicMetrics,
                nodeQualityCalculator: this.nodeQualityCalculator,
                visualMetricModel: this.visualMetricModel,
            });
            console.log('[main.js] ArchetypeAscensionCurves_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize ArchetypeAscensionCurves_v1:', err);
        }

        // ====================================================================
        // PHASE 3C ARCHETYPE AURA ENHANCEMENT (Week 14 - GPU Enhancement Multiplier)
        // ====================================================================
        // Initialize ArchetypeAuraEnhancement_v1 (applies multiplier to node/link auras)
        // This layer depends on Week 13 curves and enhances Week 9/10 aura systems
        try {
            this.archetypeAuraFX = new ArchetypeAuraEnhancement_v1({
                aiNodes: this.aiNodes,
                archetypeCurves: this.archetypeCurves,
                nodeAuraSystem: this.nodeAuraSystem || null,  // If available (Week 9)
                linkAuraSystem: this.linkAuraSystem || null,  // If available (Week 10)
            });
            console.log('[main.js] ArchetypeAuraEnhancement_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize ArchetypeAuraEnhancement_v1:', err);
        }

        // ====================================================================
        // PHASE 3C ARCHETYPE COLOR PALETTE SYSTEM (Week 15 - Signal-Driven Colors)
        // ====================================================================
        // Initialize ArchetypeColorPaletteSystem_v1 (applies personality-driven colors)
        // This layer depends on Weeks 13 & 14 and integrates with Week 14 aura system
        try {
            this.archetypeColorFX = new ArchetypeColorPaletteSystem_v1({
                aiNodes: this.aiNodes,
                archetypeCurves: this.archetypeCurves,
                archetypeAuraFX: this.archetypeAuraFX,
                scene: this.scene,
            });
            console.log('[main.js] ArchetypeColorPaletteSystem_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize ArchetypeColorPaletteSystem_v1:', err);
        }

        // ====================================================================
        // PHASE 3C ARCHETYPE SHADER MODES (Week 16 - GPU Shader Mode Orchestration)
        // ====================================================================
        // Initialize ArchetypeShaderModes_v1 (GPU shader mode controller)
        // This layer depends on Week 15 color palette and orchestrates shader modes
        // across all GPU-rendered nodes and effects
        try {
            this.archetypeShaderModes = new ArchetypeShaderModes_v1({ scene: this.scene, camera: this.camera, renderer: this.renderer });
            console.log('[main.js] ArchetypeShaderModes_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] ArchetypeShaderModes_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 17: ARCHETYPE NEURAL LINK VISUALIZATION (GPU Link Resonance)
        // ====================================================================
        // Initialize ArchetypeNeuralLinkVis_v1 (neural link visualization)
        // This layer visualizes archetype-based neural link resonance
        // Renders dynamic beams based on compatibility/resonance/entropy/ascension
        try {
            this.neuralLinkVis = new ArchetypeNeuralLinkVis_v1({
                scene: this.scene,
                debugEnabled: false
            });
            console.log('[main.js] ArchetypeNeuralLinkVis_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] ArchetypeNeuralLinkVis_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 18: NODE SELECTION SHADER ACTIVATION (Selection-Driven Boost)
        // ====================================================================
        // Initialize NodeShaderActivation_v1 (selection-hooked shader intensity boost)
        // This layer listens to node selection events and amplifies the selected node's
        // archetype shader mode with intensity × 1.35 and distortion × 1.25
        try {
            this.nodeShaderActivation = new NodeShaderActivation_v1({
                selectionCore: this.selectionCore,
                archetypeShaderModes: this.archetypeShaderModes,
                debugEnabled: false
            });
            this.nodeShaderActivation.init();
            console.log('[main.js] NodeShaderActivation_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] NodeShaderActivation_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 18 (ALT): LINK PERSONALITY STATE MACHINE (Dynamic Link Personalities)
        // ====================================================================
        // Initialize LinkPersonalityStateMachine_v1 (compute link personality states)
        // This system evaluates 1000+ links in <1.5ms with EMA smoothing
        // Outputs: link.userData.personalityState (state ID, name, stability, turbulence, ascension)
        // Reads from: visualGlow, personalityVisual, archetypeEvolution (no modifications)
        try {
            this.linkPersonalityStateMachine = new LinkPersonalityStateMachine_v1({
                debugEnabled: false
            });
            console.log('[main.js] LinkPersonalityStateMachine_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkPersonalityStateMachine_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 19: SYNERGY BONUS VISUALIZATION (High-Synergy Link Effects)
        // ====================================================================
        // Initialize SynergyBonusVisualization_v1 (compute synergy bonuses for links)
        // This system highlights high-synergy links with dynamic visual effects
        // Evaluates 1500+ links in <1ms with multi-tier EMA smoothing
        // Outputs: link.userData.synergyBonus (tier, pulseStrength, chromaShift, resonanceRipples)
        // Reads from: visualGlow (synergy score)
        try {
            this.synergyBonusVisualization = new SynergyBonusVisualization_v1({
                debugEnabled: false
            });
            console.log('[main.js] SynergyBonusVisualization_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynergyBonusVisualization_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 19 (ALT): SYNERGY BONUS FX LAYER (GPU-Based Synergy Flares)
        // ====================================================================
        // Initialize SynergyBonusFXLayer_v1 (GPU shader effects on synergy links)
        // This system reads synergy bonus data and applies shader-based visual flares
        // Emissive boosting (10–90%), multi-frequency pulsing (0.5–3 Hz), chroma flares
        // Evaluates 1500+ links in <1ms with per-material shader patches
        // Reads from: link.userData.synergyBonus (computed by SynergyBonusVisualization_v1)
        try {
            this.synergyBonusFXLayer = new SynergyBonusFXLayer_v1({
                maxLinksPerFrame: null,  // No frame limit
                globalIntensity: 1.0,
                enableRipples: true,
                enableChroma: true,
                debugEnabled: false
            });
            console.log('[main.js] SynergyBonusFXLayer_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynergyBonusFXLayer_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 20: SYNERGY RESONANCE SHADER PACK (Multi-Frequency Resonance FX)
        // ====================================================================
        // Initialize SynergyResonanceShaderPack_v1 (advanced resonance effects)
        // This system provides multi-frequency pulse, chromatic ripples, and flow mapping
        // Works alongside Week 19 FXLayer for layered, expressive synergy visuals
        // Per-material shader patching with dynamic uniform updates
        // Reads from: link.userData.synergyBonus (populated by SynergyBonusVisualization_v1)
        try {
            this.synergyResonanceShaderPack = new SynergyResonanceShaderPack_v1({
                debugEnabled: false,
                globalMultiFreqStrength: 1.0,    // Multi-frequency pulse intensity
                globalChromaticStrength: 1.0,    // Chromatic aberration intensity
                globalFlowSpeed: 1.0             // Coherence flow animation speed
            });
            console.log('[main.js] SynergyResonanceShaderPack_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynergyResonanceShaderPack_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 21: AI NETWORK RESONANCE FEEDBACK (Network-Level Feedback)
        // ====================================================================
        // Initialize ResonanceFeedback_v1 (AI network resonance feedback system)
        // This system samples synergy, personality, and shader data across the network
        // Computes local resonance for nodes & links, aggregates into global "network mood"
        // Influences node behavior, link behavior, and overall network state
        // Reads from: node/link userData (all previous Week systems)
        try {
            this.resonanceFeedback = new ResonanceFeedback_v1({
                debugEnabled: false,
                maxNodesPerFrame: null,     // No frame limit
                maxLinksPerFrame: null      // No frame limit
            });
            console.log('[main.js] ResonanceFeedback_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] ResonanceFeedback_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 22: SYNERGY CHAIN REACTIONS (Emergent Cascade Events)
        // ====================================================================
        // Initialize SynergyChainReaction_v1 (cascade event propagation system)
        // This system monitors synergy thresholds and propagates chain reactions
        // Events cascade through linked nodes with resonance/personality filtering
        // Generates LinkEvents (for shader effects) and NodeEvents (for AI behavior)
        // Reads from: node/link userData (synergy, resonance, personality)
        // Outputs: chainReaction.getActiveReactions() for shader/AI integration
        try {
            this.synergyChainReaction = new SynergyChainReaction_v1({
                debugEnabled: false,
                synergyThreshold: 0.75,     // Node synergy to trigger cascade
                resonanceSimilarityThreshold: 0.6,  // Resonance compatibility
                personalityCompatibilityThreshold: 0.5,  // Personality filter
                synergyMinimum: 0.3,        // Min synergy for propagation
                minimumIntensity: 0.1,      // Stop cascade below this
                maxHops: 8,                 // Max chain depth
                maxReactionsPerFrame: null  // No frame limit
            });
            console.log('[main.js] SynergyChainReaction_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynergyChainReaction_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 22B: SYNERGY CASCADE FX BRIDGE (Cascade → Shader Effects)
        // ====================================================================
        // Initialize SynergyCascadeFXBridge_v1 (cascade event → shader signals)
        // This system converts chain reaction events into GPU-friendly shader signals
        // Connects cascade propagation to visual effects (pulses, waves, glows, distortions)
        // Sends signals to: resonance shaders, bonus FX, auras, archetype systems
        // Reads from: SynergyChainReaction_v1.getActiveReactions()
        // Outputs: GPU cascade visual reactions (radial pulse, line waves, flashes, spikes)
        try {
            this.synergyCascadeFXBridge = new SynergyCascadeFXBridge_v1({
                debugEnabled: false,
                enableNodeGlow: true,           // Node aura cascade glow
                enableLinkWaves: true,          // Link traveling waves
                enableResonanceMode: true,      // Multi-freq resonance effects
                enableArchetypeBoost: true,     // Archetype-specific cascade boost
                maxNodesPerFrame: null,         // No frame limit
                maxLinksPerFrame: null          // No frame limit
            });
            
            // Register event source
            this.synergyCascadeFXBridge.registerEventSource(this.synergyChainReaction);
            
            // Register target shader systems (will be available after initialization)
            // These are registered in a second pass after all systems are initialized
            
            console.log('[main.js] SynergyCascadeFXBridge_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynergyCascadeFXBridge_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 27: WAVE PARTICLE EMITTER (GPU-Reactive Particle FX)
        // ====================================================================
        // Emits 3 particle families based on real-time wave interference:
        // - Constructive Burst Particles (cyan-white synergy sparks)
        // - Destructive Chaos Sparks (orange-red chaotic explosions)
        // - Standing Wave Ripple Rings (circular harmonic expansion)
        // Reads from: node/link userData.waveField (WaveInterferenceEngine_v1)
        // Performance: <2ms per frame for 200-400 nodes with ~2000 active particles
        try {
            this.particleEmitter = new WaveParticleEmitter_v1({
                maxParticlesPerFamily: 2000,
                emissionRate: 1.0,
                constructiveThreshold: 0.7,
                destructiveThreshold: 0.7,
                standingWaveThreshold: 0.65,
                amplitudeSpikeThreshold: 0.12,
                amplitudeEMAAlpha: 0.15,
                debugMode: false
            });
            this.particleEmitter?.init?.(this.renderer, this.scene);
            console.log('[main.js] WaveParticleEmitter_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] WaveParticleEmitter_v1 initialization failed:', err);
        }

        // ====================================================================
        // PARTICLE STREAM CASCADE ACCELERATION (Layer-Depth Based Particle Dynamics)
        // ====================================================================
        // Accelerates particle streams based on cascade layer depth:
        // - Layer 0 (hubs): Slow, steady acceleration (strong harmonic control)
        // - Layer 1-2: Medium acceleration (cascade propagating)
        // - Layer 3-4: Faster acceleration (cascade attenuating, particles escape)
        // - Layer 5+: Maximum acceleration (far field, weak constraint)
        // 
        // Integrates: CascadingHarmonicResonance → ParticleStreamCascadeAcceleration → WaveParticleEmitter
        // Performance: <1ms per frame, zero impact for non-cascaded nodes
        try {
            this.cascadeAccelSetup = new ParticleStreamCascadeAccelerationIntegrationSetup(
                this.nodeDynamicMetrics,
                this.linkingSystem,
                this.particleEmitter,
                {
                    enableCascadingResonance: true,
                    enableCascadeAcceleration: true,
                    enableIntegrationPatch: true,
                    setupConsoleAPIs: true,
                    consoleAPIPrefix: 'cascadeParticle',
                    debugMode: false
                }
            );
            
            // Defer initialization until after all systems are ready
            // (nodeDynamicMetrics and linkingSystem must be fully initialized)
            setTimeout(() => {
                this.cascadeAccelSetup.initialize(this.scene, this);
                console.log('[main.js] ParticleStreamCascadeAcceleration initialized ✓');
            }, 500);
        } catch (err) {
            console.warn('[main.js] ParticleStreamCascadeAcceleration initialization failed:', err);
        }

        // ====================================================================
        // PHASE 3C PERFORMANCE MODE (Centralized FX Scaling)
        // ====================================================================
        // Initialize FXPerformanceController_v1 + FXPerformanceScaler_v1
        // This layer provides global scaling of all Phase 3c visual effects
        // Toggle with F7 key (see keyboard event listener below)
        try {
            this.fxPerformance = new FXPerformanceController_v1({
                enableDebug: false,
                enableWarnings: false
            });
            this.fxPerformanceScaler = new FXPerformanceScaler_v1(
                this.aiNodes,
                this.fxPerformance,
                { enableDebug: false }
            );
            console.log('[main.js] FXPerformanceController_v1 + Scaler initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize FXPerformanceController_v1:', err);
        }

        // ====================================================================
        // PHASE 3C ADAPTIVE PERFORMANCE MONITOR (Automatic FPS-based scaling)
        // ====================================================================
        // Initialize AdaptivePerformanceMonitor_v1
        // This layer automatically toggles LowFX based on frame rate
        // User F7 toggle locks system to manual mode (notifyManualToggle)
        // Resets to AUTO mode on map transitions (resetToAuto)
        // Includes callback for smooth transitions (Week 4.5)
        try {
            this.adaptivePerformanceMonitor = new AdaptivePerformanceMonitor_v1(
                this.fxPerformance,
                {
                    targetFPS: 60,
                    hysteresisFPS: 5,
                    lowFXDelaySec: 3.0,
                    highFXDelaySec: 5.0,
                    emaAlpha: 0.1,
                    // Callback for smooth transitions (Week 4.5)
                    transitionCallback: (toLowFX) => {
                        if (this.fxPerformanceTransition?.startTransition) {
                            this.fxPerformanceTransition.startTransition(toLowFX);
                        }
                    }
                }
            );
            console.log('[main.js] AdaptivePerformanceMonitor_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize AdaptivePerformanceMonitor_v1:', err);
        }

        // ====================================================================
        // PHASE 3C SMOOTH TRANSITION LAYER (Week 4.5 - Visual Polish)
        // ====================================================================
        // Initialize FXPerformanceSmoothTransition_v1
        // This layer smoothly interpolates multipliers during LowFX toggles
        // Creates polished fade-in/fade-out effects instead of instant jumps
        // Integrates with both manual F7 and adaptive auto-toggle
        try {
            this.fxPerformanceTransition = new FXPerformanceSmoothTransition_v1(
                this.fxPerformance,
                {
                    duration: 0.6,  // 0.6 second smooth transition
                    enableDebug: false
                }
            );
            console.log('[main.js] FXPerformanceSmoothTransition_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize FXPerformanceSmoothTransition_v1:', err);
        }

        // Initialize or update Node Inspect Overlay (with Linguistic Overlay)
        if (!this.nodeInspectOverlay) {
            this.nodeInspectOverlay = new NodeInspectOverlay1_0(
                this.scene,
                this.camera,
                this.renderer,
                this.linguisticOverlay // Pass linguistic overlay for integration
            );
        }

        // Initialize Mythic Node Creation (after AI nodes ready)
        if (!this.mythicNodeCreation) {
            this.mythicNodeCreation = new MythicNodeCreation(
                this.scene,
                this.camera,
                this.player,
                this.aiNodes,
                this.worldPersonalityController
            );
        }

        // ====================================================================
        // EXTRACTION PACK V1.0 — METRICS RUNTIME ORCHESTRATION
        // ====================================================================
try {
this.metricsRuntime_v1 = new MetricsRuntime_v1({
  nodes: this.aiNodes,
  links: this.links, // fallback / legacy
  linkSystem: this.linkingSystem, // 🔥 KANONICKÝ
  metricsSystems: {
    nodeDynamicMetrics: this.nodeDynamicMetrics,
    linkQualityCalculator: this.linkQualityCalculator,
    nodeQualityCalculator: this.nodeQualityCalculator,
    visualMetricModel: this.visualMetricModel,
    safeMetricsFX: this.safeMetricsFX
  },
  options: {
    useNetworkMetricsAggregator: true
  }
});

  console.log('[main.js] MetricsRuntime_v1 initialized ✓');
  // 🔗 Inject canonical link system into NetworkMetricsAggregator
  this.metricsRuntime_v1?.networkMetricsAggregator?.setLinkSource?.(
    this.nodeLinkingSystem
  );

  // fallback (ak setter neexistuje)
  if (this.metricsRuntime_v1?.networkMetricsAggregator) {
    this.metricsRuntime_v1.networkMetricsAggregator.linkSystem =
      this.nodeLinkingSystem;
  }

} catch (err) {
  console.warn('[main.js] MetricsRuntime_v1 failed:', err);
}

        // ====================================================================
        // EXTRACTION PACK V1.0 — PERSONALITY RUNTIME ORCHESTRATION
        // ====================================================================
        try {
            this.personalityRuntime_v1 = new PersonalityRuntime_v1({
                nodes: this.aiNodes,
                personalitySystems: {
                    adapter: this.personalityVisualAdapter,
                    vfx: this.personalityVFXLayer,
                    shaderBridge: this.personalityShaderBridge,
                    shaderFX: this.advancedShaderFX
                }
            });
            console.log('[main.js] PersonalityRuntime_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] PersonalityRuntime_v1 failed:', err);
        }

        // ====================================================================
        // EXTRACTION PACK V1.1 — WORLD RUNTIME ORCHESTRATION
        // ====================================================================
        try {
            this.worldRuntime_v1 = new WorldRuntime_v1({ game: this });
            console.log('[main.js] WorldRuntime_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] WorldRuntime_v1 failed:', err);
        }

        // ====================================================================
        // EXTRACTION PACK V1.1 — FX RUNTIME ORCHESTRATION
        // ====================================================================
       // try {
       //     this.fxRuntime_v1 = new FXRuntime_v1({ game: this });
      //      console.log('[main.js] FXRuntime_v1 initialized ✓');
      //  } catch (err) {
      //      console.warn('[main.js] FXRuntime_v1 failed:', err);
      //  }

        // ====================================================================
        // EXTRACTION PACK V1.2 — NODE EDITOR RUNTIME ORCHESTRATION
        // ====================================================================
        try {
            this.nodeEditorRuntime_v1 = new NodeEditorRuntime_v1({ game: this });
            this.nodeEditorRuntime_v1.init?.();
            console.log('[main.js] NodeEditorRuntime_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] NodeEditorRuntime_v1 failed:', err);
        }

        // ====================================================================
        // EXTRACTION PACK V1.3 — INPUT RUNTIME ORCHESTRATION
        // ====================================================================
        try {
            this.inputRuntime_v1 = new InputRuntime_v1({ game: this });
            this.inputRuntime_v1.init?.();
            console.log('[main.js] InputRuntime_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] InputRuntime_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 22B: CASCADE FX BRIDGE TARGET SYSTEM REGISTRATION
        // ====================================================================
        // Second pass: Register all target shader systems with cascade bridge
        // This must happen after all systems are initialized
        if (this.synergyCascadeFXBridge) {
            try {
                if (this.synergyResonanceShaderPack) {
                    this.synergyCascadeFXBridge.registerTargetSystem('resonanceShader', this.synergyResonanceShaderPack);
                }
                if (this.synergyBonusFXLayer) {
                    this.synergyCascadeFXBridge.registerTargetSystem('bonusFXLayer', this.synergyBonusFXLayer);
                }
                if (this.nodeAuraSystem) {
                    this.synergyCascadeFXBridge.registerTargetSystem('nodeAuraSystem', this.nodeAuraSystem);
                }
                if (this.linkAuraSystem) {
                    this.synergyCascadeFXBridge.registerTargetSystem('linkAuraSystem', this.linkAuraSystem);
                }
                if (this.nodeShaderActivation) {
                    this.synergyCascadeFXBridge.registerTargetSystem('nodeShaderActivation', this.nodeShaderActivation);
                }
                if (this.archetypeShaderModes) {
                    this.synergyCascadeFXBridge.registerTargetSystem('archetypeShaderModes', this.archetypeShaderModes);
                }
                console.log('[main.js] SynergyCascadeFXBridge target systems registered ✓');
            } catch (err) {
                console.warn('[main.js] Cascade FX Bridge target registration failed:', err);
            }
        }

        // ====================================================================
        // CRITICAL VISUAL INTEGRITY ENFORCEMENT (Session X)
        // ====================================================================
        // Ensures nodes retain full visual fidelity even when linked
        // - Locks core materials against external mutation
        // - Preserves holographic layers (rings, fresnel, wireframes)
        // - Neutralizes legacy pulsing/scaling behaviors
        // - Enforces link/aura transparency constraints
        try {
            NodeVisualIntegrityFix.initializeVisualIntegrity(this.scene);
            console.log('[main.js] NodeVisualIntegrityFix initialized ✓');
        } catch (err) {
            console.warn('[main.js] NodeVisualIntegrityFix initialization failed:', err);
        }
    }

    /**
     * Setup mode switching (M key)
     */
    setupModeSwitch() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM') {
                this.switchMode();
            }
        });
    }

    /**
     * Setup performance mode hotkey (F7 key)
     * Toggle LowFX mode for instant quality switching
     * Notifies adaptive monitor of manual override
     * Triggers smooth transition effects
     */
    setupPerformanceMode() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F7') {
                if (this.fxPerformance) {
                    const newState = !this.fxPerformance.isLowFX();
                    this.fxPerformance.setLowFX(newState);
                    console.log(`[FXPerformanceMode] LowFX: ${newState ? 'ON' : 'OFF'} (manual)`);

                    // Notify adaptive monitor that user manually overrode auto system
                    if (this.adaptivePerformanceMonitor?.notifyManualToggle) {
                        this.adaptivePerformanceMonitor.notifyManualToggle(newState);
                    }

                    // Start smooth transition effect
                    if (this.fxPerformanceTransition?.startTransition) {
                        this.fxPerformanceTransition.startTransition(newState);
                    }
                }
            }
        });
    }

    /**
     * Switch between environments
     * NOW WITH: Safe World Reset Fix 1.0 - Prevents map-switch crashes
     */
    async switchMode() {
        // PHASE 1: Begin transition and pause visual systems
        this.worldResetFix.beginMapTransition({
            coreMetricsOverlay: this.coreMetricsOverlay,
            metricReactiveEvents: null, // DISABLED: Legacy system
            nodePersonality: this.nodePersonality,
            evolvingLinkFX: this.evolvingLinkFX,
            worldFXPack: this.worldFXPack,
            scene: this.scene,
            renderer: this.renderer
        });

        // Dispose old AI nodes, linking system, and all effect packs
        if (this.worldFXPack) {
            this.worldFXPack.disableAll();
        }
        if (this.legendaryPack) {
            this.legendaryPack.disableAll();
        }
        if (this.legendaryLinkFX) {
            this.legendaryLinkFX.disableAll();
        }
        if (this.worldEvents) {
            this.worldEvents.disableAll();
        }
        if (this.weatherPack) {
            this.weatherPack.disableAll();
        }
        if (this.personalityFX) {
            this.personalityFX.disableAll();
        }
        if (this.evolutionManager) {
            this.evolutionManager.disableAll();
        }
        if (this.quantumIllusions) {
            this.quantumIllusions.clearAll();
        }
        
        // Dispose System State Overlay (safe cleanup for new world)
        if (this.systemStateOverlay) {
            try {
                this.systemStateOverlay.dispose();
            } catch (err) {
                console.warn('[main.js] SystemStateOverlay disposal failed:', err);
            }
        }
        
        // [Audit 6.2] Signal world transition start
        if (this.linkingSystem) {
            this.linkingSystem.setWorldReady(false);
        }
        
        // Clear auto-link feedback UI effects during map transition
        if (this.autoLinkFeedbackUI) {
            this.autoLinkFeedbackUI.clearAll();
        }
        
        // Note: Synergy Debug HUD continues to show on new map (data updates automatically)
        
        // Dispose PersonalityVisualAdapter (safe cleanup)
        if (this.personalityVisualAdapter) {
            this.personalityVisualAdapter = null;
        }

        // Dispose PersonalityVFXLayer (safe cleanup)
        if (this.personalityVFXLayer) {
            if (this.personalityVFXLayer.clearCache) {
                this.personalityVFXLayer.clearCache();
            }
            this.personalityVFXLayer = null;
        }

        // Dispose PersonalityShaderBridge (safe cleanup)
        if (this.personalityShaderBridge) {
            if (this.personalityShaderBridge.dispose) {
                this.personalityShaderBridge.dispose();
            }
            this.personalityShaderBridge = null;
        }

        // Dispose PersonalityShaderEffects (safe cleanup)
        if (this.personalityShaderEffects) {
            // No dispose needed for effects pack (stateless)
            this.personalityShaderEffects = null;
        }

        // Dispose PersonalityShaderAdvancedFX (safe cleanup)
        if (this.advancedShaderFX) {
            this.advancedShaderFX.dispose();
            this.advancedShaderFX = null;
        }

        // Dispose ArchetypeColorPaletteSystem (safe cleanup)
        if (this.archetypeColorFX) {
            if (this.archetypeColorFX.dispose) {
                this.archetypeColorFX.dispose();
            }
            this.archetypeColorFX = null;
        }

        // Dispose ArchetypeAuraEnhancement (safe cleanup)
        if (this.archetypeAuraFX) {
            if (this.archetypeAuraFX.dispose) {
                this.archetypeAuraFX.dispose();
            }
            this.archetypeAuraFX = null;
        }

        // Dispose ArchetypeAscensionCurves (safe cleanup)
        if (this.archetypeCurves) {
            if (this.archetypeCurves.dispose) {
                this.archetypeCurves.dispose();
            }
            this.archetypeCurves = null;
        }

        // Dispose ArchetypeShaderModes (safe cleanup)
        // try {
            this.archetypeShaderModes?.dispose?.();
this.archetypeShaderModes = null;


        // Dispose ArchetypeNeuralLinkVis (safe cleanup)
        try {
            this.neuralLinkVis?.dispose?.();
            this.neuralLinkVis = null;
        } catch (err) {
            console.warn('[main.js] ArchetypeNeuralLinkVis_v1 cleanup failed:', err);
        }

        // Dispose NodeShaderActivation (safe cleanup)
        try {
            this.nodeShaderActivation?.dispose?.();
            this.nodeShaderActivation = null;
        } catch (err) {
            console.warn('[main.js] NodeShaderActivation_v1 cleanup failed:', err);
        }

        // Dispose LinkPersonalityStateMachine (safe cleanup)
        try {
            this.linkPersonalityStateMachine?.dispose?.();
            this.linkPersonalityStateMachine = null;
        } catch (err) {
            console.warn('[main.js] LinkPersonalityStateMachine_v1 cleanup failed:', err);
        }

        // Dispose SynergyBonusVisualization (safe cleanup)
        try {
            this.synergyBonusVisualization?.dispose?.();
            this.synergyBonusVisualization = null;
        } catch (err) {
            console.warn('[main.js] SynergyBonusVisualization_v1 cleanup failed:', err);
        }

        // Dispose SynergyBonusFXLayer (safe cleanup)
        try {
            this.synergyBonusFXLayer?.dispose?.();
            this.synergyBonusFXLayer = null;
        } catch (err) {
            console.warn('[main.js] SynergyBonusFXLayer_v1 cleanup failed:', err);
        }

        // Dispose SynergyResonanceShaderPack (safe cleanup)
        try {
            this.synergyResonanceShaderPack?.dispose?.();
            this.synergyResonanceShaderPack = null;
        } catch (err) {
            console.warn('[main.js] SynergyResonanceShaderPack_v1 cleanup failed:', err);
        }

        // Dispose ResonanceFeedback (safe cleanup)
        try {
            this.resonanceFeedback?.dispose?.();
            this.resonanceFeedback = null;
        } catch (err) {
            console.warn('[main.js] ResonanceFeedback_v1 cleanup failed:', err);
        }

        // Dispose SynergyChainReaction (safe cleanup)
        try {
            this.synergyChainReaction?.dispose?.();
            this.synergyChainReaction = null;
        } catch (err) {
            console.warn('[main.js] SynergyChainReaction_v1 cleanup failed:', err);
        }

        // Dispose SynergyCascadeFXBridge (safe cleanup)
        try {
            this.synergyCascadeFXBridge?.dispose?.();
            this.synergyCascadeFXBridge = null;
        } catch (err) {
            console.warn('[main.js] SynergyCascadeFXBridge_v1 cleanup failed:', err);
        }

        // ====================================================================
        // WEEK 25 (BONUS): Cleanup Wave Interference Engine
        // ====================================================================
        try {
            this.waveInterferenceEngine?.dispose?.();
            this.waveInterferenceEngine = null;
        } catch (err) {
            console.warn('[main.js] WaveInterferenceEngine_v1 cleanup failed:', err);
        }

        // ====================================================================
        // WEEK 25 (BONUS): Cleanup Wave Shader Bridge
        // ====================================================================
        try {
            this.waveShaderBridge?.dispose?.();
            this.waveShaderBridge = null;
        } catch (err) {
            console.warn('[main.js] WaveShaderBridge_v1 cleanup failed:', err);
        }

        // ====================================================================
        // WEEK 25 (BONUS): Cleanup Wave Shader Material Patch
        // ====================================================================
        try {
            this.waveShaderMaterialPatch?.dispose?.();
            this.waveShaderMaterialPatch = null;
        } catch (err) {
            console.warn('[main.js] WaveShaderMaterialPatch_v1 cleanup failed:', err);
        }

        // ====================================================================
        // WEEK 25 (BONUS): Cleanup Wave Travel Shader Pack
        // ====================================================================
        try {
            this.waveTravelShaderPack?.dispose?.();
            this.waveTravelShaderPack = null;
        } catch (err) {
            console.warn('[main.js] WaveTravelShaderPack_v1 cleanup failed:', err);
        }

        // ====================================================================
        // WEEK 25 (BONUS): Cleanup Wave Dynamics Shader Pack
        // ====================================================================
        try {
            this.waveDynamicsShaderPack?.dispose?.();
            this.waveDynamicsShaderPack = null;
        } catch (err) {
            console.warn('[main.js] WaveDynamicsShaderPack_v1 cleanup failed:', err);
        }

        // ====================================================================
        // WEEK 27: Cleanup Wave Particle Emitter
        // ====================================================================
        try {
            this.particleEmitter?.dispose?.();
            this.particleEmitter = null;
        } catch (err) {
            console.warn('[main.js] WaveParticleEmitter_v1 cleanup failed:', err);
        }

        // ====================================================================
        // EXTRACTION PACK V1.3: Cleanup Input Runtime Orchestration
        // ====================================================================
        this.inputRuntime_v1?.dispose?.();
        this.inputRuntime_v1 = null;

        // ====================================================================
        // EXTRACTION PACK V1.2: Cleanup Node Editor Runtime Orchestration
        // ====================================================================
        this.nodeEditorRuntime_v1?.dispose?.();
        this.nodeEditorRuntime_v1 = null;

        // ====================================================================
        // EXTRACTION PACK V1.1: Cleanup Runtime Orchestration
        // ====================================================================
        this.fxRuntime_v1?.dispose?.();
        this.fxRuntime_v1 = null;
        this.worldRuntime_v1?.dispose?.();
        this.worldRuntime_v1 = null;

        // ====================================================================
        // EXTRACTION PACK V1.0: Cleanup Runtime Orchestration
        // ====================================================================
        this.metricsRuntime_v1?.dispose?.();
        this.metricsRuntime_v1 = null;
        
        this.personalityRuntime_v1?.dispose?.();
        this.personalityRuntime_v1 = null;

        // ========================================================================
        // EXTRACTION PACK V1.0 — METRICS RUNTIME ORCHESTRATION
        // EXACTLY ONE metricsRuntime_v1 instance per world
        // MUST be recreated after every map switch
        // ========================================================================
        // 1. Dispose any previous instance defensively
        if (this.metricsRuntime_v1) {
            this.metricsRuntime_v1.dispose();
            this.metricsRuntime_v1 = null;
        }

        // 2. Create a NEW MetricsRuntime_v1 instance with FULL references
        this.metricsRuntime_v1 = new MetricsRuntime_v1({
            aiNodes: this.aiNodes,
            linkingSystem: this.linkingSystem,
            scene: this.scene,
            player: this.player
        });

        // 3. Add ONE debug log
        console.info("[MetricsRuntime] Reinitialized after map switch");

        // Dispose FXPerformance Controller & Scaler (safe cleanup)
        if (this.fxPerformance) {
            this.fxPerformance = null;
        }
        if (this.fxPerformanceScaler) {
            this.fxPerformanceScaler = null;
        }

        // Reset Adaptive Performance Monitor to AUTO mode (for new map)
        if (this.adaptivePerformanceMonitor) {
            this.adaptivePerformanceMonitor.resetToAuto();
        }
        
        if (this.linkingSystem) {
            this.linkingSystem.dispose();
        }
        if (this.aiNodes) {
            this.aiNodes.dispose();
        }

        // PHASE 2: Clean old scene visuals
        this.worldResetFix.cleanOldScene();

        // Clear current world
        this.scene.children = this.scene.children.filter(child =>
            child === this.player || child instanceof THREE.Light
        );

        // Cycle through modes
        if (this.currentMode === 'sigma') {
            this.currentMode = 'memory';
        } else if (this.currentMode === 'memory') {
            this.currentMode = 'fractal';
        } else if (this.currentMode === 'fractal') {
            this.currentMode = 'quantum';
        } else if (this.currentMode === 'quantum') {
            this.currentMode = 'desert';
        } else if (this.currentMode === 'desert') {
            this.currentMode = 'chamber';
        } else {
            this.currentMode = 'sigma';
        }

        // Update subtitle
        const subtitle = document.getElementById('subtitle');
        const modeNames = {
            sigma: 'SIGMA RIFT CHAMBER - BOSS ARENA',
            memory: 'MEMORY LANE MODE',
            fractal: 'FRACTAL VALLEY MODE',
            quantum: 'QUANTUM ISLAND MODE',
            desert: 'DREAM DESERT MODE',
            chamber: 'NODE-SPACE CORE SIMULATION'
        };
        if (subtitle) {
            subtitle.textContent = modeNames[this.currentMode];
        }

        // Setup new environment
        if (this.currentMode === 'sigma') {
            this.setupSigmaRiftEnvironment();
            this.sigmaRift = new SigmaRiftChamber(this.scene);
            this.activeWorld = this.sigmaRift;
        } else if (this.currentMode === 'desert') {
            this.setupDreamDesertEnvironment();
            this.dreamDesert = new DreamDesert(this.scene);
            this.activeWorld = this.dreamDesert;
        } else if (this.currentMode === 'quantum') {
            this.setupQuantumIslandEnvironment(); // Restored for lighting/fog/ground
            this.quantumIsland = new QuantumIsland(this.scene, this.camera);
            this.activeWorld = this.quantumIsland;
        } else if (this.currentMode === 'fractal') {
            this.setupFractalValleyEnvironment();
            this.fractalValley = new FractalValley(this.scene);
            this.activeWorld = this.fractalValley;
        } else if (this.currentMode === 'memory') {
            this.setupMemoryLaneEnvironment();
            this.memoryLane = new MemoryLane(this.scene);
            this.activeWorld = this.memoryLane;
        } else {
            this.setupChamberEnvironment();
            this.chamber = new World(this.scene);
            this.activeWorld = this.chamber;
        }

        // Create new AI nodes
        this.createAINodes();
        if (this.coreMetricsOverlay) {
  this.coreMetricsOverlay.cleanup?.()
}

this.coreMetricsOverlay = new CoreMetricsOverlay(
  this.scene,
  this.renderer
);

console.log('[switchMode] CoreMetricsOverlay reinitialized after world switch');
        // [Audit 6.2] Signal world transition complete - nodes ready
        if (this.linkingSystem) {
            this.linkingSystem.setWorldReady(true);
        }

        // Reinitialize Node Evolution 2.0 for new nodes
        this.setupNodeEvolution();

        // DISABLED: Reinitialize Safe Node Archetypes Pack for new nodes
        // this.setupNodeArchetypesPack(); // System permanently disconnected

        // Reinitialize evolution manager for new nodes
        this.setupEvolutionManager();

        // Reinitialize legendary pack for new nodes
        this.setupLegendaryPack();

        // Reinitialize legendary link FX for new links
        this.setupLegendaryLinkFX();

        // Reinitialize world events for new environment
        this.setupWorldEvents();

        // Reinitialize weather pack for new environment
        this.setupWeatherPack();

        // Reinitialize camera FX for new environment

        // Reinitialize personality FX for new nodes
        this.setupPersonalityFX();

        // Reinitialize world FX for new environment
        this.setupWorldFXPack();

        // Reinitialize Semantic Glyph AI for new nodes
        this.setupSemanticGlyphAI();

        // Reinitialize Glyph Fusion Overlay 4.1 for new nodes
        this.setupGlyphFusionOverlay();

        // Hide Node Inspect Overlay during transition (will reappear when looking at nodes)
        if (this.nodeInspectOverlay) {
            this.nodeInspectOverlay.forceHide();
        }

        // Reset Metrics FX for new nodes
        if (this.metricsVisualFX) {
            this.metricsVisualFX.reset();
        }

        // Reset Node Personality System for new nodes
        if (this.nodePersonalitySystem) {
            this.nodePersonalitySystem.reset();
        }

        // Reset Mythic Seed Glyph System for new nodes
        if (this.mythicSeedGlyph) {
            this.mythicSeedGlyph.cleanup();
            // Remove old markers in new scene
            this.mythicSeedGlyph.removeOldMarkers();
        }

        // Reset Legacy Debug Cone Cleanup for new nodes
        if (this.legacyConeCleanup) {
            this.legacyConeCleanup.reset();
        }

        // DISABLED: Fractal Hex Marker System (legacy debug system)
        // if (this.fractalHexMarker) {
        //   this.fractalHexMarker.cleanup();
        // }

        // Run Legacy Glyph Cleanup again on world transition
        if (this.legacyGlyphCleanup) {
            this.legacyGlyphCleanup.resetStats();
            this.legacyGlyphCleanup.cleanupLegacyGlyphs();
        }

        // Reset ATOMA Glyph System 3.0 for new nodes
        if (this.glyphSystem) {
            this.glyphSystem.cleanup();
        }

        // Reset ATOMA Glyph System 4.0 for new nodes
        if (this.glyphSystem4) {
            this.glyphSystem4.cleanup();
        }

        // Reset ATOMA Glyph Layer 4.0 for new nodes
        if (this.glyphLayer4) {
            this.glyphLayer4.cleanup();
        }

        // Run Glyph Purity Mode 5.1 purification on world transition
        // Ensures no stray fallback glyphs appear in new world
        if (this.glyphPurityMode) {
            this.glyphPurityMode.resetStats();
            const removed = this.glyphPurityMode.purifyScene();
            if (removed > 0) {
                console.log(`✓ Glyph Purity: Removed ${removed} unauthorized glyphs from new world`);
            }
        }

        // Reset Glyph Fusion Overlay 4.1 for new nodes
        if (this.glyphFusionOverlay) {
            this.glyphFusionOverlay.cleanup();
        }

        // Reset Procedural Meaning Engine 1.0 for new nodes
        if (this.proceduralMeaningEngine) {
            this.proceduralMeaningEngine.cleanup();
            // Reinitialize for new nodes
            this.setupProceduralMeaningEngine();
        }

        // Reset Link Glyph Flow 1.0 for new links
        if (this.linkGlyphFlow) {
            this.linkGlyphFlow.cleanupAll();
        }

        // Reset Linked Glyph Synchronization 1.0 for new links
        if (this.linkedGlyphSync) {
            this.linkedGlyphSync.cleanup();
        }

        // Reset Linked Glyph Messaging 3.0 for new links
        if (this.linkedGlyphMessaging) {
            this.linkedGlyphMessaging.cleanup();
        }

        // Reset Recursive Glyph Messaging 4.0 for new links
        if (this.recursiveGlyphMessaging) {
            this.recursiveGlyphMessaging.cleanup();
        }

        // Reset Emergent Thought Storms 5.0 for new network
        if (this.emergentThoughtStorms) {
            this.emergentThoughtStorms.cleanup();
        }

        // Reset AI Narrative Patterns 6.0 for new network
        if (this.narrativePatterns) {
            this.narrativePatterns.cleanup();
        }

        // PHASE 3: Wait for new scene to be ready
        const sceneReady = await this.worldResetFix.waitForNewSceneReady(
            this.scene,
            this.aiNodes,
            this.linkingSystem
        );

        if (!sceneReady) {
            console.warn('⚠ New scene failed to initialize, attempting recovery');
        }

        // PHASE 4: Reinitialize visual systems
        await this.worldResetFix.reinitializeVisualSystems({
            coreMetricsOverlay: this.coreMetricsOverlay,
            metricReactiveEvents: null, // DISABLED: Legacy system
            nodePersonality: this.nodePersonality,
            evolvingLinkFX: this.evolvingLinkFX,
            worldFXPack: this.worldFXPack,
            scene: this.scene,
            renderer: this.renderer
        });

        // Reset player position
        this.player.position.set(0, 1, 0);

        // PHASE 5: Complete transition
        this.worldResetFix.completeTransition();
    }

    /**
     * Setup CASCADE PARTICLE EMISSION BOOST (Session 118)
     * Drives particle emission on links affected by resonance cascades
     */
    setupCascadeParticleEmissionBoost() {
        try {
            this.cascadeParticleEmissionBoost = setupCascadeParticleEmissionBoost(
                this,
                {
                    enabled: true,
                    debugMode: false,
                    maxEmissionMultiplier: 3.0,
                    cascadeToEmissionResponse: 'quadratic',
                    burstPulseFrequencyBase: 2.0,
                    burstPulseFrequencyMax: 10.0
                }
            );
            
            console.log('[main.js] CascadeParticleEmissionBoost initialized ✓');
        } catch (err) {
            console.warn('[main.js] CascadeParticleEmissionBoost initialization failed:', err);
        }
    }

    /**
     * Setup CASCADE PARTICLE COLOR TINTING (Session 119)
     * Colors particles based on conflict type
     */
    setupCascadeParticleColorTinting() {
        try {
            this.cascadeParticleColorTinting = setupCascadeParticleColorTinting(
                this,
                {
                    enabled: true,
                    debugMode: false,
                    enableConflictTypeDetection: true,
                    enableCorruptionTinting: true,
                    colorEMAAlpha: 0.15,
                    brightnessModulationDepth: 0.2
                }
            );
            
            console.log('[main.js] CascadeParticleColorTinting initialized ✓');
        } catch (err) {
            console.warn('[main.js] CascadeParticleColorTinting initialization failed:', err);
        }
    }

    /**
     * Setup CASCADE PARTICLE SYSTEM (Session 120)
     * Semantic particles with shape and velocity encoding
     */
    setupCascadeParticleSystem() {
        try {
            this.cascadeParticleSystem = setupCascadeParticleSystem(
                this,
                {
                    enabled: true,
                    debugMode: false,
                    maxParticles: 3000,
                    emissionRate: 1.0,
                    baseSize: 4.0
                }
            );
            
            console.log('[main.js] CascadeParticleSystem initialized ✓');
        } catch (err) {
            console.warn('[main.js] CascadeParticleSystem initialization failed:', err);
        }
    }

    /**
     * Setup PARTICLE SEMANTIC DENSITY (Session 121)
     * Clustering and density encoding intensity and urgency
     */
    setupParticleSemanticDensity() {
        try {
            this.particleSemanticDensity = setupParticleSemanticDensity(
                this,
                {
                    enabled: true,
                    debugMode: false,
                    maxDensityMultiplier: 4.0,
                    densitySafetyThreshold: 3.5,
                    maxClusterCohesion: 1.0,
                    intensityEMAAlpha: 0.2,
                    urgencyEMAAlpha: 0.15,
                }
            );
            
            console.log('[main.js] ParticleSemanticDensity initialized ✓');
        } catch (err) {
            console.warn('[main.js] ParticleSemanticDensity initialization failed:', err);
        }
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    visualNetworkTimeElasticityTick(deltaTime) {
        // Update visual network time elasticity (visual time reversal when avgSynergy > 0.85 for 5s)
        if (this.visualNetworkTimeElasticity && this.nodeDynamicMetrics) {
            // Get average synergy from network metrics
            const avgSynergy = this.nodeDynamicMetrics?.avgSynergy ?? 0.0;
            this.visualNetworkTimeElasticity.setAverageSynergy(avgSynergy);
            this.visualNetworkTimeElasticity.update(deltaTime, this.time);
            
            // Store visual time for use in animation systems
            window.VISUAL_TIME = this.visualNetworkTimeElasticity.getVisualTime();
        }
    }

    synergyPulseVisualsTick(deltaTime) {
        // Update synergy pulse visuals (soft breathing pulse when synergy > 0.6)
        if (this.synergyPulseVisuals && this.nodeDynamicMetrics) {
            // Get average synergy from network metrics
            const avgSynergy = this.nodeDynamicMetrics?.avgSynergy ?? 0.0;
            this.synergyPulseVisuals.setAverageSynergy(avgSynergy);
            this.synergyPulseVisuals.update(deltaTime, this.time);
        }
    }

    harmonicResonanceCouplingTick(deltaTime) {
        // Update harmonic resonance coupling (synergy-driven link resonance particles & effects)
        if (this.harmonicResonanceCoupling && this.nodeDynamicMetrics) {
            const avgSynergy = this.nodeDynamicMetrics?.avgSynergy ?? 0.0;
            this.harmonicResonanceCoupling.update(deltaTime, avgSynergy);
        }
    }

    harmonicHubAuraSystemTick(deltaTime) {
        if (this.harmonicHubAuraSystem && this.aiNodes) {
            this.harmonicHubAuraSystem.update(deltaTime, this.aiNodes.nodes);
        }
    }

    harmonicInfluencePropagationTick(deltaTime) {
        if (this.harmonicInfluencePropagation) {
            this.harmonicInfluencePropagation.update(deltaTime);
        }
    }

    harmonicCascadeAmplificationTick(deltaTime) {
        if (this.harmonicCascadeAmplification && this.harmonicCascadeAmplification.config.enabled) {
            this.harmonicCascadeAmplification.update(deltaTime);
        }
    }

    cascadeVisualizerTick(deltaTime) {
        if (this.cascadeVisualizer) {
            this.cascadeVisualizer.update(deltaTime);
        }
    }

    runVisualSemanticTick(deltaTime, mark) {
        // Semantic/visual 30 Hz logic currently executed inline in animate() when scheduler is unavailable
        // This method exists to satisfy FrameScheduler callbacks.
    }

    runSlowSemanticTick(deltaTime) {
        // Slow semantic 10 Hz logic currently executed inline in animate() when scheduler is unavailable
        // This method exists to satisfy FrameScheduler callbacks.
    }

    /**
     * Main animation loop
     */
    animate() {
        this.updateValidator?.startFrame();
        requestAnimationFrame(() => this.animate());

        const t0 = performance.now();
        const tracingSpike = window.__DBG_SPIKE_TRACE === true;
        const spikeThresholdMs = window.__DBG_SPIKE_TRACE_THRESHOLD_MS ?? 200;
        const frameStart = tracingSpike ? performance.now() : 0;
        const samples = tracingSpike ? [] : null;
        const mark = tracingSpike
            ? (name, fn) => {
                const t0 = performance.now();
                const result = fn();
                samples.push({ name, ms: performance.now() - t0 });
                return result;
            }
            : (_name, fn) => fn();

        const now = performance.now();
        if (this.frameClock) {
            this.frameClock.tick(now);
            
            // Optional debug: Print FrameClock stats every ~120 frames (~2 seconds at 60fps)
            // Uses FrameClock's internal frame counter to avoid conflict with engine frameCount
            if (this.frameClock.frame % 120 === 0) {
                console.log('[FrameClock]', this.frameClock.getStats());
            }
        }

        // ========================================================================
        // PHASE B: FRAME SCHEDULER TICK (Controlled Registration)
        // ========================================================================
        // Call scheduler.tick() to execute registered systems based on layer frequency
        // This runs side-by-side with existing game logic - no throttling yet
        const deltaTime = Math.min(this.clock.getDelta(), 0.1); // Clamp to max 100ms to prevent tab-inactive spikes
        const deltaTimeMs = deltaTime * 1000;
        this.time += deltaTime;

        // VisualTime infrastructure (INFRA-ONLY, no behavior change): canonical RAF-driven visual clock
        VisualTime.delta = deltaTime;
        VisualTime.now = this.time;
        VisualTime.frameId += 1;

        // Cadence gates: motion stays 60 Hz; semantic/UI work drops to lighter rates
        this.semanticVisualAcc += deltaTime;
        const runVisualSemantic = this.semanticVisualAcc >= this.semanticVisualInterval;
        if (runVisualSemantic && !this._runVisualSemanticPending) {
            this.semanticVisualAcc -= this.semanticVisualInterval;
            if (performance.now() - this.semanticCadenceLastLog >= this.semanticCadenceLogMs) {
                console.debug('[Cadence] semantic/UI @30Hz tick');
                this.semanticCadenceLastLog = performance.now();
            }
            this._pendingVisualSemanticDt = deltaTime;
            this._pendingMark = mark;
            this._runVisualSemanticPending = true;
            this._pendingSynergyPulseDt = deltaTime;
            this._runSynergyPulsePending = true;
            this._pendingHarmonicResonanceDt = deltaTime;
            this._runHarmonicResonancePending = true;
            this._pendingHarmonicHubAuraDt = deltaTime;
            this._runHarmonicHubAuraPending = true;
            this._pendingHarmonicInfluenceDt = deltaTime;
            this._runHarmonicInfluencePending = true;
            this._pendingHarmonicCascadeDt = deltaTime;
            this._runHarmonicCascadePending = true;
            this._pendingCascadeVisualizerDt = deltaTime;
            this._runCascadeVisualizerPending = true;
        }
        this.semanticSlowAcc += deltaTime;
        const runSlowSemantic = this.semanticSlowAcc >= this.semanticSlowInterval;
        if (runSlowSemantic && !this._runSlowSemanticPending) {
            this.semanticSlowAcc -= this.semanticSlowInterval;
            if (performance.now() - this.semanticSlowCadenceLastLog >= this.semanticCadenceLogMs) {
                console.debug('[Cadence] semantic background @10Hz tick');
                this.semanticSlowCadenceLastLog = performance.now();
            }
            this._pendingSlowSemanticDt = deltaTime;
            this._runSlowSemanticPending = true;
        }

        // FrameScheduler drives layer-gated systems (visual/render integration point)
        if (this.frameScheduler) {
            this.frameScheduler.tick(deltaTime);
        }
        
        // Update player and camera
        // migrated to FrameScheduler (Phase C.1)
        // const cameraRotation = this.cameraController.update();
        // this.playerController.update(deltaTime, cameraRotation);

        // Update active world
        if (this.activeWorld) {
            this.activeWorld.update(deltaTime, this.time);
        }

        // Update Visual Upgrade Superpack
        if (this.visualSuperpack) {
            this.visualSuperpack.update(deltaTime);
        }

        // Update cinematic effects
        if (this.cinematicUpgrade) {
            this.cinematicUpgrade.update(deltaTime);
        }

        // Update node editor
        if (this.nodeEditor) {
            this.nodeEditor.update(deltaTime);
        }

        // Update environmental hazards
        if (this.hazards) {
            this.hazards.update(deltaTime);

            // Apply hazard forces to player
            const hazardEffect = this.hazards.getHazardEffect(this.player.position);
            this.player.position.add(hazardEffect.multiplyScalar(0.5)); // Dampen effect
        }

        // Update AI nodes
        if (this.aiNodes) {
            mark('aiNodes.update', () => {
                const aiNodesUpdateStart = performance.now();
                this.aiNodes.update(deltaTime, this.time);
                this.updateValidator?.markSystemUpdate('aiNodes.update', performance.now() - aiNodesUpdateStart);
                // === DEBUG: expose FrameUpdateLoopOrderValidator to console (DEV ONLY) ===
                if (this.updateValidator && !window.updateValidator) {
                    window.updateValidator = this.updateValidator;
                    console.log('[Validator] updateValidator exposed to window');
                }
                // Update dynamic node spawning system
                this.aiNodes.updateSpawning(Date.now());

                // Node info HUD update throttled to ~10Hz to cut per-frame DOM writes
                this.nodeUiAcc += deltaTime;
                if (this.nodeUiAcc >= 0.1) {
                    this.nodeUiAcc = 0;
                    this.updateNodeUI();
                }

                // Lightweight relaxation every ~60 frames (~1s)
                if (this.frameCount % 60 === 0) {
                    for (const node of this.aiNodes.nodes) {
                        relaxNodeMetrics(node, 1.0); // coarse tick, not per-frame
                    }
                }
            });
        }
        
        // [Session 144+] Update Node Linked Aura System
        // migrated to FrameScheduler (Phase C.1)
        // if (this.nodeAuraSystem && this.aiNodes) {
        //     mark('nodeAuraSystem.update', () => {
        //         this.nodeAuraSystem.update(deltaTime, this.aiNodes.nodes);
        //     });
        // }
        
        // [Session 144+] Update undo/redo UI (throttled to ~10Hz)
        this.undoUiAcc += deltaTime;
        if (this.undoUiAcc >= 0.1) {
            this.undoUiAcc = 0;
            this.updateUndoRedoUI();
        }

        // ====================================================================
        // TIER 1 INTEGRATION: Core Active Systems (Phase A)
        // Corruption Transmission & Harmony Stabilization
        // Using safeTick() adapter for universal method compatibility
        // ====================================================================
        
        safeTick(this.linkCorruptionTransmission, deltaTime);
        safeTick(this.harmonyStabilizationSystem, deltaTime);

        // ====================================================================
        // SIMULATION EFFECT ORCHESTRATOR TICK (Session 37+ FIXED)
        // Central hub for ALL time-based effects (dt-driven, no rAF loops)
        // Call AFTER simulation updates and BEFORE visual effects
        // Using safeTick() adapter for universal method compatibility
        // ====================================================================
        safeTick(this.effectOrchestrator, deltaTime, this.time);

        // Update Visual Hierarchy Correction System v1.0 (enforce visual dominance)
        if (this.visualHierarchyCorrection) {
            this.visualHierarchyCorrection.update(deltaTime);
        }

        // ====================================================================
        // AURA MODULATION SYSTEM v1.0 (Session 27)
        // Updates all active aura modulations per frame
        // ====================================================================
        if (this.auraModulationIntegration) {
            this.auraModulationIntegration.update(deltaTime);
        }

        // ====================================================================
        // DYNAMIC LINK COLOR SYSTEM v1.0 — Real-time synergy-driven colors
        // Updates link colors every frame based on current synergy scores
        // ====================================================================
        if (this.dynamicLinkColorSystem) {
            mark('dynamicLinkColorSystem.update', () => {
                this.dynamicLinkColorSystem.update(deltaTime);
            });
        }

        // ====================================================================
        // [SESSION 88] LINK QUALITY CALCULATOR — Per-frame quality metrics
        // Calculates quality scores (0-100) based on structural, harmony, load, corruption
        // Must run BEFORE LinkDegradationSystem which reads quality scores
        // ====================================================================
        if (this.linkQualityCalculator) {
            mark('linkQualityCalculator.update', () => {
                this.linkQualityCalculator.update(deltaTime);
            });
        }

        // ====================================================================
        // [SESSION 88] LINK DEGRADATION SYSTEM — Quality-based effect scaling
        // Maps quality scores to efficiency multipliers (0.0-1.0)
        // Applies degradation to visual intensity, metrics weight, particle rate
        // Must run AFTER LinkQualityCalculator which provides quality input
        // ====================================================================
        if (this.linkDegradationSystem) {
            mark('linkDegradationSystem.update', () => {
                this.linkDegradationSystem.update(deltaTime);
            });
        }

        // ====================================================================
        // [SESSION 89] LINK COLLAPSE SYSTEM — Conditional failure under extreme stress
        // Tracks sustained corruption + critical load to trigger link collapse
        // Must run AFTER LinkQualityCalculator and LinkDegradationSystem
        // ====================================================================
        if (this.linkCollapseSystem) {
            mark('linkCollapseSystem.update', () => {
                this.linkCollapseSystem.update(deltaTime);
            });
        }

        // ====================================================================
        // [SESSION 90] NODE SHELL SIZE AUTHORITY — Enforce static shell sizes
        // Decouple shell scale from network metrics (corruption, load, stress)
        // Shells are static per node category and tier, never dynamic
        // Must run AFTER aura updates to override any dynamic scaling
        // ====================================================================
        if (this.nodeShellSizeAuthority) {
            this.nodeShellSizeAuthority.enforceShellSizes(this.scene);
        }

        // ====================================================================
        // [SESSION 91] PARTICLE EMISSION SCALER — Update network particle metrics
        // Scales particle emission based on corruption, stress, and load
        // Must run AFTER LinkQualityCalculator and LinkDegradationSystem
        // ====================================================================
        if (this.particleEmissionScaler) {
            mark('particleEmissionScaler.update', () => {
                this.particleEmissionScaler.update(deltaTime);
            });
        }

        // ====================================================================
        // [SESSION 105] LINK METRICS TO VISUAL BRIDGE — Real-time metrics-to-shader wiring
        // Aggregates 4 metric sources (degradation, collapse, corruption, contagion)
        // into per-link stress values that drive fracture/kink visualization
        // Must run AFTER LinkQualityCalculator, LinkDegradationSystem, LinkCollapseSystem
        // ====================================================================
        if (this.linkMetricsToVisualBridge) {
            mark('linkMetricsToVisualBridge.update', () => {
                this.linkMetricsToVisualBridge.update(deltaTime);
            });
        }

        // ====================================================================
        // [SESSION 106+] STRESS-BASED PARTICLE SCALER — Particle effects from link stress
        // Scales link particle emission rates based on per-link stress values
        // Higher stress = more/faster/color-changed particles
        // Must run AFTER LinkMetricsToVisualBridge
        // ====================================================================
        if (this.stressBasedParticleScaler) {
            mark('stressBasedParticleScaler.update', () => {
                this.stressBasedParticleScaler.update(deltaTime);
            });
        }

        // ====================================================================
        // SYNERGY CASCADE PROPAGATION VISUALIZER v1.0 — Network energy flow
        // Visualizes synergy energy cascading through linked networks
        // ====================================================================
        if (!this._runCascadeVisualizerPending) this.cascadeVisualizerTick(deltaTime);

        // ====================================================================
        // SYNERGY VISUAL EFFECTS v1.0 — Pure world-space visual feedback
        // Soft breathing pulse on nodes + visual time elasticity tracking
        // ====================================================================
        
        this._pendingSynergyPulseDt = deltaTime;
        this._runSynergyPulsePending = true;

        this._pendingElasticityDt = deltaTime;
        this._runElasticityPending = true;
        
        if (!this._runHarmonicResonancePending) this.harmonicResonanceCouplingTick(deltaTime);
        
        if (!this._runHarmonicHubAuraPending) this.harmonicHubAuraSystemTick(deltaTime);
        
        if (!this._runHarmonicInfluencePending) this.harmonicInfluencePropagationTick(deltaTime);
        
        if (!this._runHarmonicCascadePending) this.harmonicCascadeAmplificationTick(deltaTime);
        
        // ====================================================================
        // ATOMA AUDIO SYSTEM — Synergy State Monitoring
        // Trigger audio feedback for synergy activation/fading
        // ====================================================================
        if (this.audioSystem && this.nodeDynamicMetrics) {
            const avgSynergy = this.nodeDynamicMetrics?.avgSynergy ?? 0.0;
            
            // Detect state transitions
            if (avgSynergy >= this.synergyActivationThreshold && this.previousSynergyState !== 'active') {
                // Synergy just activated
                this.audioSystem.playSynergyActive();
                this.previousSynergyState = 'active';
            } else if (avgSynergy < this.synergyFadingThreshold && this.previousSynergyState === 'active') {
                // Synergy just faded
                this.audioSystem.playSynergyFade();
                this.previousSynergyState = 'fading';
            } else if (avgSynergy < this.synergyFadingThreshold && this.previousSynergyState === 'fading') {
                // Completely faded
                this.previousSynergyState = 'none';
            }
        }

        // Update echo trail shader uniforms (per-frame visual time propagation)
        if (this.echoTrailsIntegration && this.nodeDynamicMetrics) {
            const avgSynergy = this.nodeDynamicMetrics?.avgSynergy ?? 0.0;
            const visualTime = window.VISUAL_TIME ?? this.time;
            mark('echoTrailsIntegration.updateAllMaterials', () => {
                this.echoTrailsIntegration.updateAllMaterials(this.time, visualTime, avgSynergy);
            });
        }

        // ====================================================================
        // CORE MATERIAL MUTATION DETECTION (Periodic Check)
        // Check every 60 frames (~1 second at 60fps) for core mutations
        // ====================================================================
        if (this.coreMaterialMutationDetector && this.frameCount % 60 === 0) {
            const violationCount = this.coreMaterialMutationDetector.checkAllCores();
            if (violationCount > 0 && Math.random() < 0.01) {
                // Log occasionally (1% of checks that have violations) to avoid spam
                console.warn(
                    `[Mutation Check] ${violationCount} core material violations detected and auto-repaired`
                );
            }
        }
        this.frameCount = (this.frameCount || 0) + 1;
        
        // ====================================================================
        // CORE MATERIAL PROPERTY LOCK v1.0 (Session 30 - Hard Enforcement)
        // Enforce immutability of core material properties EVERY FRAME
        // This is the final defensive line against runtime property degradation
        // ====================================================================
        if (this.coreMaterialPropertyLock && this.frameCount % 1 === 0) {
            mark('coreMaterialPropertyLock.enforceFrame', () => {
                // Enforce canonical properties every frame (zero tolerance)
                const lockViolationCount = this.coreMaterialPropertyLock.enforceFrame();
                if (lockViolationCount > 0 && this.frameCount % 300 === 0) {
                    // Log occasionally (~5 seconds at 60fps) to detect systematic issues
                    console.warn(
                        `[Core Material Lock] ${lockViolationCount} property violations locked & corrected this frame`
                    );
                }
            });
        }

        if (runVisualSemantic && !this._runVisualSemanticPending) {
        // 30 Hz visual/semantic cadence (motion-critical work stayed above at 60 Hz)

        // Update Safe Metrics FX 1.1 (subtle visual effects - 15Hz throttled)
        if (this.metricsVisualFX && this.aiNodes) {
            this.metricsVisualFX.update(deltaTime, this.aiNodes.nodes);
        }

        // ====================================================================
        // EXTRACTION PACK V1.1: Update World Runtime Orchestration
        // ====================================================================
        this.worldRuntime_v1?.update?.(deltaTime);

        // ====================================================================
        // EXTRACTION PACK V1.1: Update FX Runtime Orchestration
        // ====================================================================
    //    this.fxRuntime_v1?.update?.(deltaTime);

        // ====================================================================
        // EXTRACTION PACK V1.2: Update Node Editor Runtime Orchestration
        // ====================================================================
        this.nodeEditorRuntime_v1?.update?.(deltaTime);

        // ====================================================================
        // EXTRACTION PACK V1.3: Update Input Runtime Orchestration
        // ====================================================================
        this.inputRuntime_v1?.update?.(deltaTime);

        // ====================================================================
        // EXTRACTION PACK V1.0: Update Metrics Runtime Orchestration
        // Runs every frame (60fps) to ensure __ATOMA_LIVE_METRICS__ is always up-to-date
        // ====================================================================
        if (this.metricsRuntime_v1) {
            this.metricsRuntime_v1.update(deltaTime);
        }

  //      if (shouldRunMetrics && this.coreMetricsVM) {
            // Use visual nodes because normalized metrics live under node.userData.visualMetrics
   //         updateCoreMetricsViewModel(this.coreMetricsVM, this.aiNodes, this.frameCount);
  //      }

        // ====================================================================
        // EXTRACTION PACK V1.0: Update Personality Runtime Orchestration
        // ====================================================================
        if (this.personalityRuntime_v1) {
            this.personalityRuntime_v1.update(deltaTime);
        }

        // ====================================================================
        // PHASE 3C: Update Personality Visual Adapter (Week 1)
        // ====================================================================
        // Computes visual personality signals from Phase 3 metrics
        // Writes to node.userData.personalityVisual for VFX/shader systems
        // Safe, additive layer - doesn't modify existing personality systems
        if (this.personalityVisualAdapter && this.aiNodes) {
            this.personalityVisualAdapter.update(deltaTime);
        }

        // ====================================================================
        // PHASE 3C: Update Performance Scaler (Performance Mode)
        // ====================================================================
        // Applies global FX scaling multipliers to all personality signals
        // Runs after PersonalityVisualAdapter, before VFX/Shader systems
        // Allows instant quality switching without reinitializing shaders
        if (this.fxPerformanceScaler) {
            this.fxPerformanceScaler.update(deltaTime);
        }

        // ====================================================================
        // PHASE 3C: Update Adaptive Performance Monitor (Automatic FPS Scaling)
        // ====================================================================
        // Automatically toggles LowFX based on sustained frame rate changes
        // Uses hysteresis + time windows to avoid rapid oscillation
        // Respects manual F7 overrides (locks to MANUAL_LOCKED mode)
        if (this.adaptivePerformanceMonitor?.update) {
            this.adaptivePerformanceMonitor.update(deltaTime);
        }

        // ====================================================================
        // PHASE 3C: Update Smooth Transition Layer (Week 4.5 Visual Polish)
        // ====================================================================
        // Smoothly interpolates multipliers during LowFX toggles
        // Creates polished fade effects instead of instant jumps
        // Works with both manual F7 and adaptive auto-toggle
        if (this.fxPerformanceTransition?.update) {
            this.fxPerformanceTransition.update(deltaTime);
        }

        // ====================================================================
        // PHASE 3C: Update Personality VFX Layer (Week 2)
        // ====================================================================
        // Applies visual effects based on personality signals
        // Effects: emissive intensity, pulse, jitter, rotation, color tint
        // All transformations are frame-local and reversible
        if (this.personalityVFXLayer && this.aiNodes) {
            this.personalityVFXLayer.update(deltaTime, this.time || this.elapsedTime);
        }

        // ====================================================================
        // PHASE 3C: Update Personality Shader Bridge (Week 3)
        // ====================================================================
        // Bind personality signals to GPU shader uniforms
        // Effects: emissive modulation, tinting, noise/distortion (in shaders)
        if (this.personalityShaderBridge?.update) {
            this.personalityShaderBridge.update(deltaTime);
        }

        // ====================================================================
        // PHASE 3C: Update Personality Shader Advanced FX (Week 5)
        // ====================================================================
        // Apply procedural GPU distortion based on personality signals
        // Effects: chaos wobble, energy ripples, resonance waves, focus warp, corruption jitter
        if (this.advancedShaderFX?.update) {
            this.advancedShaderFX.update(deltaTime);
        }

        // ====================================================================
        // PHASE 3C: Update Archetype Ascension Curves (Week 13)
        // ====================================================================
        // Recompute personality-driven ascension curve profiles
        // Outputs to node.userData.archetypeEvolution for Week 14/15 systems
        if (this.archetypeCurves && this.aiNodes) {
            this.archetypeCurves.update(deltaTime);
        }

        // ====================================================================
        // PHASE 3C: Update Archetype Aura Enhancement (Week 14)
        // ====================================================================
        // Apply multiplier to node/link aura visuals based on Week 13 signals
        // Runs after ascension curves but before shader bridge for GPU updates
        if (this.archetypeAuraFX && this.aiNodes) {
            this.archetypeAuraFX.update(deltaTime);
        }

        // ====================================================================
        // PHASE 3C: Update Archetype Color Palette System (Week 15)
        // ====================================================================
        // Apply personality-driven color palette shifts based on Week 13/14 signals
        // Runs after aura enhancement for coordinated visual updates
        if (this.archetypeColorFX && this.aiNodes) {
            this.archetypeColorFX.update(deltaTime);
        }

        // ====================================================================
        // PHASE 3C: Update Archetype Shader Modes (Week 16)
        // ====================================================================
        // Update GPU shader mode orchestration based on Week 13/14/15 signals
        // Runs after color palette for coordinated shader mode switching
        this.archetypeShaderModes?.update?.(deltaTime);

        // ====================================================================
        // WEEK 18: Update Node Selection Shader Activation
        // ====================================================================
        // Update selection-driven shader intensity boosts (smooth EMA interpolation)
        this.nodeShaderActivation?.update?.(deltaTime);

        // ====================================================================
        // WEEK 18 (ALT): Update Link Personality State Machine
        // ====================================================================
        // Compute personality states for all links (EMA smoothing, <1.5ms for 1000 links)
        // Outputs: link.userData.personalityState with stability, turbulence, ascensionBoost
        if (this.linkPersonalityStateMachine && this.nodeLinking) {
            this.linkPersonalityStateMachine.update(deltaTime, this.nodeLinking.links || []);
        }

        // ====================================================================
        // WEEK 19: Update Synergy Bonus Visualization
        // ====================================================================
        // Compute synergy bonuses for all links (EMA smoothing, <1ms for 1500 links)
        // Outputs: link.userData.synergyBonus with tier, pulseStrength, chromaShift, resonanceRipples
        if (this.synergyBonusVisualization && this.nodeLinking) {
            this.synergyBonusVisualization.update(deltaTime, this.nodeLinking.links || []);
        }

        // ====================================================================
        // WEEK 19 (ALT): Update Synergy Bonus FX Layer
        // ====================================================================
        // Apply GPU shader effects to high-synergy links (emissive, pulsing, chroma, ripples)
        // Reads from: link.userData.synergyBonus (populated by SynergyBonusVisualization_v1)
        // Updates shader uniforms for all links in <1ms
        if (this.synergyBonusFXLayer && this.nodeLinking) {
            this.synergyBonusFXLayer.update(deltaTime, this.nodeLinking.links || []);
        }

        // ====================================================================
        // WEEK 20: Update Synergy Resonance Shader Pack
        // ====================================================================
        // Apply advanced resonance effects (multi-freq pulse, chromatic ripple, flow)
        // Works alongside Week 19 FX layer for layered effects
        // Reads from: link.userData.synergyBonus (populated by SynergyBonusVisualization_v1)
        // Updates GPU uniforms per material in <0.5ms
        if (this.synergyResonanceShaderPack && this.nodeLinking) {
            this.synergyResonanceShaderPack.update(deltaTime, this.nodeLinking.links || []);
        }

        // ====================================================================
        // WEEK 21: Update AI Network Resonance Feedback
        // ====================================================================
        // Sample network-level resonance across all nodes & links
        // Compute local feedback signals & aggregate global network mood
        // Influences node behavior, link behavior, and overall network state
        // Reads from: node/link userData (all Week 19-20 systems)
        if (this.resonanceFeedback && this.aiNodes && this.nodeLinking) {
            this.resonanceFeedback.update(
                deltaTime,
                this.aiNodes.nodes || [],
                this.nodeLinking.links || []
            );
        }

        // ====================================================================
        // WEEK 22: Update Synergy Chain Reactions (Cascade Propagation)
        // ====================================================================
        // Phase D.6 – synergyChainReaction detached from RAF
        // Reason: extreme per-frame traversal & recursion
        // Engine remains initialized but dormant until event-gated reactivation
        // (per-frame update call removed)

        // ====================================================================
        // WEEK 22B: Update Synergy Cascade FX Bridge (Events → Shader Signals)
        // ====================================================================
        // Convert chain reaction events to shader-friendly cascade signals
        // Update node/link cascade states with smoothed intensities
        // Send signals to target shader systems (resonance, bonus FX, auras, archetypes)
        // Generates radial pulses, traveling waves, brightness flashes, aura spikes
        if (this.synergyCascadeFXBridge && this.aiNodes && this.nodeLinking) {
            this.synergyCascadeFXBridge.update(
                deltaTime,
                this.aiNodes.nodes || [],
                this.nodeLinking.links || []
            );
        }

        // ====================================================================
        // WEEK 25 (BONUS): Update Wave Interference Engine (Multi-Origin Waves)
        // ====================================================================
        // Compute interference patterns from multiple wave sources
        // Propagates waves via BFS with exponential decay
        // Updates node/link userData.waveField with 7 metrics (amplitude, phase, standing wave, etc)
        // Synergy/resonance/corruption amplitude modulation enabled
        // Performance: <2ms per frame (pooled updates, no mid-frame allocations)
        // Phase D.1: waveInterferenceEngine detached from per-frame loop
        // Engine is now dormant unless explicitly triggered
        //        if (this.waveInterferenceEngine && this.aiNodes && this.nodeLinking) {
       //     this.waveInterferenceEngine.update(
        //        deltaTime,
          //      {
          //          nodes: this.aiNodes.nodes || [],
          //          links: this.nodeLinking.links || [],
          //          network: this.nodeLinking  // For BFS traversal
         //       }
         //   );
      //  }
        // ====================================================================
        // SYNAPTIC GATING ADAPTER — Compute synaptic gate strength for all nodes
        // ====================================================================
        // Compute how strongly each node amplifies or dampens passing pulses
        // Must run FIRST in pulse pipeline to establish gate strengths
        // Gate is purely visual and modulates boundary interactions
        if (this.synapticGatingAdapter && this.aiNodes) {
            this.synapticGatingAdapter.updateNodeGates(this.aiNodes.nodes || []);
        }

        // ====================================================================
        // PULSE WAVE SYSTEM BRIDGE — Connect wave propagation to neural firing
        // ====================================================================
        // Convert wave fields into pulse positions on links
        // Triggers intersection impulses as waves travel (neural action potentials)
        // Must run AFTER WaveInterferenceEngine to read fresh wave data
        if (this.pulseWaveSystemBridge && this.waveInterferenceEngine && this.pulseIntersectionAdapter) {
            this.pulseWaveSystemBridge.update(deltaTime, {
                waveEngine: this.waveInterferenceEngine,
                links: this.nodeLinking?.links || [],
                nodeDynamicMetrics: this.nodeDynamicMetrics,
                pulseIntersectionAdapter: this.pulseIntersectionAdapter
            });
        }

        // ====================================================================
        // PULSE BOUNDARY INTERACTION ADAPTER — Energy dissipation/absorption at nodes
        // ====================================================================
        // Process boundary effects when pulses reach node endpoints:
        // - Absorption: node halo brightens
        // - Dissipation: pulse fades near endpoint
        // - Reflection: weaker pulse rebounds (rare, corruption-driven)
        // - Split: energy fans into other links (harmonic hubs only)
        // Must run AFTER pulse position updates
        if (this.pulseBoundaryInteractionAdapter && this.aiNodes && this.nodeLinking) {
            this.pulseBoundaryInteractionAdapter.update({
                links: this.nodeLinking?.links || [],
                nodes: this.aiNodes?.nodes || [],
                nodeDynamicMetrics: this.nodeDynamicMetrics,
                aiNodes: this.aiNodes
            });
        }

        // ====================================================================
        // SYNAPTIC FATIGUE ADAPTER — Long-term wear and recovery at nodes
        // ====================================================================
        // Track cumulative synaptic fatigue from repeated gating activity
        // Fatigue accumulates from: |gateStrength|, pulse density, hub splitting
        // Fatigue decays from: rest periods, harmony, reduced load
        // Visual effects: halo dulling, phase lag, subtle flicker (high fatigue only)
        // Must run AFTER gating is computed to read gate strengths
        if (this.synapticFatigueAdapter && this.aiNodes) {
            this.synapticFatigueAdapter.updateFatigue(
                this.aiNodes.nodes || [],
                this.synapticGatingAdapter?.nodeGateMap || new Map(),
                deltaTime,
                this.time * 1000  // Convert to ms
            );
        }

        // ====================================================================
        // SYNAPTIC SPECIALIZATION ADAPTER — Visual learning from behavior
        // ====================================================================
        // Nodes develop visual identities based on dominant gating behavior
        // Specialization: +1.0 = excitatory (amplifies), -1.0 = inhibitory (dampens)
        // Visual expression: halo rhythm, pulse shape, ripple coherence adapt
        // Must run AFTER gating is computed to read gate strengths
        if (this.synapticSpecializationAdapter && this.aiNodes) {
            this.synapticSpecializationAdapter.updateSpecialization(
                this.aiNodes.nodes || [],
                this.synapticGatingAdapter?.nodeGateMap || new Map(),
                deltaTime,
                this.time * 1000  // Convert to ms
            );
        }

        // ====================================================================
        // WEEK 25 (BONUS): Update Wave Shader Bridge (GPU Uniform Injection)
        // ====================================================================
        // Read waveField from nodes/links and push normalized values to shader uniforms
        // EMA smoothing: alpha ~0.18 for ~0.4-0.5s response time
        // Performance: trivial per-frame overhead (<0.1ms per material)
        if (!VISUAL_TICKS_ENABLED) {
            if (!this._visualTickNoticeShown) {
                console.log('[perf] Visual ticks disabled (wave shaders frozen)');
                this._visualTickNoticeShown = true;
            }
        } else if (this.waveShaderBridge && this.aiNodes && this.nodeLinking && this.postProcessingEnabled !== false) {
            this.waveShaderBridge.update(deltaTime, {
                nodes: this.aiNodes.nodes || [],
                links: this.nodeLinking.links || []
            });
        }

        // ====================================================================
        // WEEK 25 (BONUS): Update Wave Shader Material Patch (GPU Shader Patching)
        // ====================================================================
        // Shader effects are driven by uniforms from bridge (no explicit update needed)
        // Materials automatically receive wave data and render with 7 effects
        // Shader patches are applied at compile time via onBeforeCompile

        // ====================================================================
        // WEEK 25 (BONUS): Update Wave Travel Shader Pack (GPU Motion Effects)
        // ====================================================================
        // Advance global time for traveling-wave animations
        // Vertex displacement, UV flow, color gradients, pulse bursts all driven by time
        // Multi-frequency oscillation + rift chaos effects update per frame
        // Performance: trivial per-frame cost (time accumulation + uniform updates)
        if (VISUAL_TICKS_ENABLED && this.waveTravelShaderPack && this.postProcessingEnabled !== false) {
            this.waveTravelShaderPack.update(deltaTime);
        }

        // ====================================================================
        // WEEK 25 (BONUS): Update Wave Dynamics Shader Pack (Advanced FX Layers)
        // ====================================================================
        // Advance global time for breathing/ripple/diffusion animations
        // All 3 FX layers driven by accumulated time + wave physics uniforms
        // Standing-wave breathing, quantum ripples, color diffusion pulses update per frame
        // Performance: <0.2ms per frame (time accumulation + minimal uniform writes)
        if (VISUAL_TICKS_ENABLED && this.waveDynamicsShaderPack && this.postProcessingEnabled !== false) {
            this.waveDynamicsShaderPack.update(deltaTime);
        }

        // ====================================================================
        // WEEK 27: Update Wave Particle Emitter (GPU-Reactive Particle FX)
        // ====================================================================
        // Emit particles based on real-time wave interference conditions:
        // - Constructive Burst Particles when constructive > 0.7
        // - Destructive Chaos Sparks when destructive > 0.7
        // - Standing Wave Ripple Rings when standing > 0.65
        // Reads from: node/link userData.waveField (WaveInterferenceEngine_v1)
        // Performance: <2ms per frame for 200-400 nodes with ~2000 active particles
        try {
            this.particleEmitter?.update?.(
                deltaTime,
                this.aiNodes?.nodes ?? [],
                this.nodeLinking?.links ?? []
            );
        } catch (err) {
            console.warn('[main.js] WaveParticleEmitter_v1 update failed:', err);
        }

        // ====================================================================
        // SESSION 118: CASCADE PARTICLE EMISSION BOOST - Per-Frame Update
        // ====================================================================
        // Drives particle emission boost on cascade-affected links:
        // - Reads cascade intensity from ResonanceCascadeVisualization
        // - Computes emission multiplier (1.0-3.0x) per link
        // - Stores in link.userData.cascadeParticleEmissionBoost
        // - Modulates downstream particle emitters
        // Performance: <0.5ms per frame for 200-400 links
        try {
            if (this.cascadeParticleEmissionBoost && this.nodeLinking?.links) {
                this.cascadeParticleEmissionBoost.update(
                    deltaTime,
                    this.nodeLinking.links,
                    this.resonanceCascade  // Cascade system reference
                );
            }
        } catch (err) {
            console.warn('[main.js] CascadeParticleEmissionBoost update failed:', err);
        }

        // ====================================================================
        // SESSION 119: CASCADE PARTICLE COLOR TINTING - Per-Frame Update
        // ====================================================================
        // Colors particles based on conflict type:
        // - Reads cascade intensity and conflict type
        // - Detects conflict type from hub state and node positions
        // - Computes color based on conflict type palette
        // - Stores in link.userData.cascadeParticleColor
        // - Enables downstream particle systems to use type-specific colors
        // Performance: <0.3ms per frame for 200-400 links
        try {
            if (this.cascadeParticleColorTinting && this.nodeLinking?.links) {
                this.cascadeParticleColorTinting.update(
                    deltaTime,
                    this.nodeLinking.links,
                    this.resonanceCascade,           // Cascade system
                    this.synapticConflict            // Conflict system (Session 117)
                );
            }
        } catch (err) {
            console.warn('[main.js] CascadeParticleColorTinting update failed:', err);
        }

        // ====================================================================
        // SESSION 120: CASCADE PARTICLE SYSTEM - Per-Frame Update
        // ====================================================================
        // Update semantic particles (shape & velocity encoding)
        // - Spawns new particles from active cascades
        // - Updates physics for existing particles
        // - Renders using single-draw-call POINTS system
        try {
            if (this.cascadeParticleSystem && this.nodeLinking?.links) {
                this.cascadeParticleSystem.update(
                    deltaTime,
                    this.nodeLinking.links
                );
            }
        } catch (err) {
            console.warn('[main.js] CascadeParticleSystem update failed:', err);
        }

        // ====================================================================
        // SESSION 121: PARTICLE SEMANTIC DENSITY - Per-Frame Update
        // ====================================================================
        // Update particle clustering and density
        // - Computes intensity from cascade state
        // - Computes urgency from change rates and thresholds
        // - Controls spawn density and cluster cohesion
        // - Zero allocations, pure adapter pattern
        try {
            if (this.particleSemanticDensity && this.nodeLinking?.links) {
                this.particleSemanticDensity.update(
                    deltaTime,
                    this.nodeLinking.links,
                    this.synapticConflict,          // For unresolved conflict tracking
                    this.resonanceCascade           // For cascade state
                );
            }
        } catch (err) {
            console.warn('[main.js] ParticleSemanticDensity update failed:', err);
        }

        // ====================================================================
        // SESSION 128: INFLUENCE ATTENUATION & ABSORPTION VISUALS
        // Visualizes how harmonic influence weakens/absorbs at non-harmonic nodes
        // ====================================================================
        if (this.influenceAttenuationAbsorption && this.aiNodes && this.linkingSystem) {
            this.influenceAttenuationAbsorption.update(deltaTime, this.time);
        }

        // ====================================================================
        // SESSION 129: INFLUENCE REFLECTION & BACK-PRESSURE VISUALS
        // Visualizes how resistant nodes reject influence through reflection
        // ====================================================================
        if (this.influenceReflection && this.aiNodes && this.linkingSystem) {
            this.influenceReflection.update(deltaTime, this.time);
        }

        // ====================================================================
        // SESSION 130: STANDING WAVE & OSCILLATION TRAP VISUALS
        // Visualizes energy trapped between opposing nodes
        // ====================================================================
        if (this.standingWaveTrap && this.aiNodes && this.linkingSystem) {
            this.standingWaveTrap.update(deltaTime, this.time);
        }

        // ====================================================================
        // SESSION 131: STANDING WAVE VISUAL RENDERER
        // Renders mesh visuals (update AFTER trap system)
        // ====================================================================
        if (this.standingWaveRenderer && this.standingWaveTrap) {
            this.standingWaveRenderer.update(deltaTime, this.time);
        }

        // ====================================================================
        // SESSION 132: WAVE INTERFERENCE PATTERN SYSTEM
        // Visualizes wave collision patterns (update AFTER all wave systems)
        // ====================================================================
        if (this.waveInterference && this.influenceReflection) {
            this.waveInterference.update(deltaTime, this.time);
        }

        // ====================================================================
        // SESSION 133: RESONANCE RUPTURE VISUAL SYSTEM
        // Detects rupture conditions and creates burst visuals
        // ====================================================================
        if (this.resonanceRupture && this.standingWaveTrap) {
            this.resonanceRupture.update(deltaTime, this.time);
        }

        // ====================================================================
        // SESSION 134-136: HARMONIC HEALING SYSTEM UPDATE
        // ====================================================================
        const healingState = { 
            harmony: this.nodeDynamicMetrics?.avgHarmony || 0.5,
            corruption: this.nodeDynamicMetrics?.avgCorruption || 0 
        };

        // 1. Audio Reactivity (Session 135)
        if (this.harmonicAudio) {
            safeTick(this.harmonicAudio, deltaTime, this.time, healingState);
        }

        // 2. Healing Particles (Session 136) - Visual trails & sparkles
        if (this.healingParticles) {
            safeTick(this.healingParticles, deltaTime, this.time, healingState, this.camera);
        }

        // 3. Harmonic Healing Waves (Session 134) - Logic driver for waves
        if (this.harmonicHealing) {
            safeTick(this.harmonicHealing, deltaTime, this.time, healingState);
        }

        // ====================================================================
        // PARTICLE STREAM CASCADE ACCELERATION - Per-Frame Update
        // ====================================================================
        // Update cascade acceleration system:
        // 1. Recompute cascading resonance through network layers
        // 2. Update particle acceleration multipliers based on cascade depth
        // 3. Apply velocity modifications to emitted particles
        // Performance: <1ms per frame (negligible at typical game framerates)
        try {
            if (this.cascadeAccelSetup?.isInitialized) {
                this.cascadeAccelSetup.update(deltaTime, this.time);
            }

            // === LINK MICRO-IMPULSES: Update event-driven electrical responses ===
            if (this.microImpulseAdapter) {
                this.microImpulseAdapter.update();
            }

            // === PULSE INTERSECTION IMPULSES: Update neural firing on wave contact ===
            if (this.pulseIntersectionAdapter) {
                this.pulseIntersectionAdapter.update();
            }
        } catch (err) {
            console.warn('[main.js] ParticleStreamCascadeAcceleration update failed:', err);
        }

        // ====================================================================
        // WEEK 17: Update Archetype Neural Link Visualization
        // ====================================================================
        // Update neural link visualizations based on link compatibility/resonance
        // Renders dynamic beams per link with archetype-driven effects
        this.neuralLinkVis?.update?.(deltaTime);

        // Update Node Personality System 2.0 (personality-driven animations)
        if (this.nodePersonalitySystem && this.aiNodes) {
            this.nodePersonalitySystem.update(deltaTime, this.aiNodes.nodes);
        }

        // Update Node Micro-Events 1.0 (personality-driven spontaneous events)
        if (this.nodeMicroEvents && this.aiNodes) {
            this.nodeMicroEvents.update(deltaTime, this.aiNodes.nodes);
        }

        // Update World Personality Controller 2.0 (global mood-driven world events)
        if (this.worldPersonalityController && this.aiNodes) {
            this.worldPersonalityController.update(deltaTime, this.aiNodes.nodes);
        }
        if (this.frameCount % (60 * 30) === 0) {
  console.log(this.coreMetricsVM.metrics, this.coreMetricsVM.meta);
}


        // Update Mythic Ritual Controller 1.0 (rare ceremonial events)
        if (this.mythicRitualController && this.aiNodes) {
            this.mythicRitualController.update(deltaTime, this.aiNodes.nodes);
        }

        // Update Mythic Node Creation (cinematic node birth ritual)
        if (this.mythicNodeCreation) {
            // Wire orchestrator on first update (lazy init)
            if (!this.mythicNodeCreation.effectOrchestrator && this.effectOrchestrator) {
                this.mythicNodeCreation.effectOrchestrator = this.effectOrchestrator;
            }
            this.mythicNodeCreation.update(deltaTime);
        }

        // ====================================================================
        // PHASE 8: Update Network Ritual Visual Orchestration
        // Pure visual ceremony layer — orchestrates canonical templates
        // ====================================================================
        if (this.phase8RitualOrchestration) {
            const deltaTimeMs = deltaTime * 1000;  // Convert to milliseconds
            this.phase8RitualOrchestration.update(deltaTimeMs);
        }

        // Update Mythic Seed Glyph System (visual markers with animations)
        if (this.mythicSeedGlyph && this.aiNodes) {
            // Scan nodes for mythic/seeded state (throttled to 5Hz)
            if (!this.mythicGlyphScanTimer) this.mythicGlyphScanTimer = 0;
            this.mythicGlyphScanTimer += deltaTime;
            if (this.mythicGlyphScanTimer >= 0.2) { // Every 0.2s = 5Hz
                this.mythicSeedGlyph.scanAndApplyGlyphs(this.aiNodes.nodes);
                this.mythicGlyphScanTimer = 0;
            }

            // Update animations
            this.mythicSeedGlyph.update(deltaTime, this.camera);
        }

        // NEUTRALIZED: Legacy Debug Cone Cleanup (Session 23 - Per-frame execution disabled)
        // Update(): Now dormant - no per-frame scene traversal
        // Use onDemandCleanup() or manualCleanup() for explicit cleanup triggers
        // Eliminates continuous O(n) scene traversal; cleanup only runs when needed
        // if (this.legacyConeCleanup && this.aiNodes) {
        //     this.legacyConeCleanup.update(this.aiNodes.nodes);  // DISABLED: no longer runs every frame
        // }

        // DISABLED: Fractal Hex Marker System (legacy debug system - replaced by Glyph Slot System 2.0)
        // if (this.fractalHexMarker && this.aiNodes) {
        //   if (!this.fractalHexScanTimer) this.fractalHexScanTimer = 0;
        //   this.fractalHexScanTimer += deltaTime;
        //   if (this.fractalHexScanTimer >= 0.2) {
        //     this.fractalHexMarker.detectAndReplaceDebugCones(this.aiNodes.nodes);
        //     this.fractalHexScanTimer = 0;
        //   }
        //   this.fractalHexMarker.update(deltaTime);
        // }

        // Update ATOMA Glyph System 3.0 (unified glyph animations)
        if (this.glyphSystem) {
            this.glyphSystem.update(deltaTime);
        }

        // Update ATOMA Glyph System 4.0 (Animated Meaning Edition)
        if (this.glyphSystem4 && this.aiNodes) {
            this.glyphSystem4.update(deltaTime, this.aiNodes.nodes);
        }

        // Update ATOMA Glyph Layer 4.0 (Multi-Glyph Fusion)
        if (this.glyphLayer4) {
            this.glyphLayer4.update(deltaTime);
        }

        // Update Composite Glyph Resonance Feedback (Session 140+ Visual-Only)
        // Makes composite glyph resonance perceptible through spatial & temporal cues
        if (this.compositeResonanceFeedback) {
            this.compositeResonanceFeedback.update(deltaTime);
            
            // Optional: Apply subtle phase alignment to nearby glyphs
            if (this.compositeResonanceFeedback.glyphAnimationInfluenceEnabled) {
                this.compositeResonanceFeedback.applyGlyphAnimationInfluence();
            }
        }

        // Update Semantic Glyph AI 5.0 (After Glyph Layer 4.0)
        if (this.semanticGlyphAI && this.aiNodes) {
            this.semanticGlyphAI.update(deltaTime, this.aiNodes.nodes);
        }

        // Update Glyph Fusion Overlay 4.1 (After Semantic Glyph AI)
        if (this.glyphFusionOverlay) {
            this.glyphFusionOverlay.update(deltaTime);
        }

        // Update Procedural Meaning Engine 1.0 (After Semantic Glyph AI)
        if (this.proceduralMeaningEngine && this.aiNodes) {
            this.proceduralMeaningEngine.update(deltaTime, this.aiNodes.nodes, this.semanticGlyphAI);
        }

        // Update Link Glyph Flow 1.0 (After linking system)
        if (this.linkGlyphFlow) {
            this.linkGlyphFlow.update(deltaTime);
        }

        // Update Adaptive Glyph Rendering 1.0 (Apply metric-driven animations)
        // Must run after all glyph systems but before render
        if (this.adaptiveGlyphRendering && this.aiNodes) {
            this.adaptiveGlyphRendering.update(deltaTime, this.aiNodes.nodes);
        }

        // Update Linked Glyph Synchronization 1.0 (Coordinate linked node animations)
        // Must run after Adaptive Glyph Rendering for sync to work properly
        if (this.linkedGlyphSync && this.aiNodes && this.linkingSystem) {
            this.linkedGlyphSync.update(deltaTime, this.aiNodes, this.linkingSystem);
        }

        // Update Linked Glyph Messaging 3.0 (Ultra symbolic AI language transport)
        // Must run after all glyph systems
        if (this.linkedGlyphMessaging && this.aiNodes && this.linkingSystem) {
            this.linkedGlyphMessaging.update(deltaTime, this.aiNodes, this.linkingSystem);
        }

        // Update Recursive Glyph Messaging 4.0 (Recursive meaning chains)
        // Must run after Linked Glyph Messaging 3.0
        // Phase D.8 – detached from per-frame execution
        // System remains initialized but dormant
        // (per-frame update removed from animate())

        // Update Emergent Thought Storms 5.0 (chain collision phenomena)
        // Must run after Recursive Glyph Messaging 4.0
        // Phase D – detached from per-frame execution
        // System remains initialized but dormant
        // (per-frame update removed from animate())

        // Update AI Narrative Patterns 6.0 (narrative structure layer)
        // Must run after Emergent Thought Storms 5.0
        if (this.narrativePatterns && this.aiNodes && this.linkingSystem) {
            this.narrativePatterns.update(deltaTime, this.aiNodes.nodes, this.linkingSystem.links, this.worldMetrics || {});
        }

        } // end 30 Hz semantic/UI cadence

        // Update linking system with time and deltaTime for animations
        if (this.linkingSystem) {
            mark('linkingSystem.update', () => {
                this.linkingSystem.update(deltaTime, this.time);
                this.updateLinkingUI();
            });
        }

        // ============================================================================
        // PHASE 1 LINK SYSTEMS REACTIVATION (Session 107+)
        // Update calls: LinkCorrelationEngine + History (NO visual systems)
        // ============================================================================
        
        // Update Link Correlation Engine (tickable: every 3 seconds)
        if (this.linkCorrelationEngine) {
            try {
                this.linkCorrelationEngine.tick(deltaTime);
            } catch (err) {
                console.warn('[LinkCorrelationEngine] Update error:', err.message);
            }
        }

        // ====================================================================
        // HIT PROXY SYSTEM UPDATE (Session 61+)
        // Synchronize proxy positions with nodes, maintain raycast isolation
        // ====================================================================
        if (this.hitProxySystem) {
            this.hitProxySystem.update(deltaTime);
        }

        // Update Link Priority Decay Engine 1.0 - Time-based priority management
        if (this.linkPriorityDecayEngine) {
            this.linkPriorityDecayEngine.update(deltaTime, this.time);
        }
        
        // ====================================================================
        // TIER 2 VISUAL INTEGRATION: Update Visual Feedback Systems
        // ====================================================================
        
        // T2-002: Update Corruption Visual Integration
        // Wires link.corruptionLevel → visual tinting + particles
        if (this.t2CorruptionVisualIntegration && this.linkingSystem?.links) {
            this.t2CorruptionVisualIntegration.update(deltaTime, this.linkingSystem.links);
        }
        
        // T2-003: Update Harmony Visual Consumer
        // Wires node.harmonyLevel → cyan auras + healing pulses
        if (this.t2HarmonyVisualConsumer && this.aiNodes) {
            this.t2HarmonyVisualConsumer.update(deltaTime, this.aiNodes, this.harmonyStabilizationSystem);
        }
        
        // ====================================================================
        // TIER 4 GAMEPLAY INTEGRATION: Update Visual + UI Feedback
        // ====================================================================
        
        // Update TIER 4 gameplay feedback (visual effects + UI)
        if (this.tier4GameplayIntegration) {
            this.tier4GameplayIntegration.update(deltaTime);
        }
        
        // ====================================================================
        // PHASE 5: MULTI-NETWORK SYNCHRONIZATION UPDATE
        // ====================================================================
        
        // Update Phase 5 multi-network state synchronization
        if (this.phase5MultiNetworkOrchestrator) {
            this.phase5MultiNetworkOrchestrator.update(deltaTime);
        }
        
        // ====================================================================
        // PHASE 5: INTER-NETWORK CONNECTION VISUALS UPDATE
        // ====================================================================
        // Update inter-network connection visualization (animated flows + anchors)
        // Inter-network visuals disabled: skip update
        
        // ====================================================================
        // PHASE 5: CASCADE PROPAGATION VISUALS UPDATE
        // ====================================================================
        // Update cascade visual effects (expanding rings)
        if (this.phase5CascadePropagationVisuals) {
            this.phase5CascadePropagationVisuals.update(deltaTime);
        }
        
        // Update cascade visualization bridge (detect and visualize cascades)
        if (this.phase5CascadeVisualizationBridge) {
            this.phase5CascadeVisualizationBridge.update(deltaTime);
        }

        // ====================================================================
        // NODE HIERARCHY SYSTEM UPDATE — Synchronize hierarchy visuals
        // ====================================================================
        // Update hierarchy visualization and positions
        if (this.nodeHierarchyBridge) {
            this.nodeHierarchyBridge.update();
        }

        // Update Safe Evolution Manager - External node evolution system
        if (this.evolutionManager && this.linkingSystem && this.aiNodes) {
            this.evolutionManager.update(deltaTime, this.aiNodes.nodes, this.linkingSystem);
        }

        // Update Safe Legendary Node Pack - External legendary system
        if (this.legendaryPack && this.linkingSystem && this.aiNodes && this.evolutionManager) {
            this.legendaryPack.update(
                deltaTime,
                this.aiNodes.nodes,
                this.linkingSystem,
                this.evolutionManager
            );
        }

        // Update Safe Legendary Link FX - Link enhancements
        if (this.legendaryLinkFX && this.linkingSystem && this.legendaryPack && this.evolutionManager) {
            this.legendaryLinkFX.update(
                deltaTime,
                this.linkingSystem.links,
                this.legendaryPack,
                this.evolutionManager
            );
        }

        // Update Safe Legendary World Events - Global event system
        if (this.worldEvents && this.legendaryPack && this.linkingSystem && this.evolutionManager) {
            this.worldEvents.update(
                deltaTime,
                this.legendaryPack,
                this.linkingSystem,
                this.evolutionManager
            );
        }

        // Update Safe AI Weather Pack - Dynamic weather system
        if (this.weatherPack && this.legendaryPack && this.linkingSystem && this.evolutionManager && this.worldEvents) {
            this.weatherPack.update(
                deltaTime,
                this.legendaryPack,
                this.linkingSystem,
                this.evolutionManager,
                this.worldEvents
            );
        }

        // Update Safe Node Personality FX - Behavioral node visuals
        if (this.personalityFX && this.aiNodes && this.linkingSystem && this.evolutionManager && this.weatherPack && this.worldEvents) {
            this.personalityFX.update(
                deltaTime,
                this.aiNodes.nodes,
                this.linkingSystem,
                this.evolutionManager,
                this.weatherPack,
                this.worldEvents,
                this.camera
            );
        }

        // Update Safe World FX Pack - Environmental effects
        if (this.worldFXPack && this.aiNodes && this.linkingSystem && this.evolutionManager && this.legendaryPack) {
            this.worldFXPack.update(
                deltaTime,
                this.aiNodes.nodes,
                this.linkingSystem,
                this.evolutionManager,
                this.legendaryPack
            );
        }

        // Update Ambient Entities - Holographic VFX entities
        if (this.ambientEntityManager) {
            // Update synergy for entity spawning
            const avgSynergy = this.linkingSystem?.getAverageSynergy?.() || 0;
            this.ambientEntityManager.updateSynergy(avgSynergy);

            // Main update
            this.ambientEntityManager.update(deltaTime);
        }

        // Update Safe Memory Trails Pack 1.0 - Holographic memory traces
        if (this.memoryTrails) {
            this.memoryTrails.update(deltaTime);
        }

        // Update Safe Quantum Illusions Pack 1.0 - Visual hallucination effects
        if (this.quantumIllusions) {
            this.quantumIllusions.setGlobalTime(this.time);
            this.quantumIllusions.update(deltaTime);
        }

        // Update Safe Colony Expansion 2.0 - Living AI ecosystem
        if (this.colonyManager) {
            this.colonyManager.update(deltaTime);
        }

        // Update Safe Dream Depth Pack - AI DOF simulation
        if (this.dreamDepthPack && this.dreamDepthEffects) {
            // Update world systems reference
            this.dreamDepthWorldSystems.colonies = this.colonyManager?.registry?.getAllColonies?.() || [];

            this.dreamDepthPack.update(deltaTime, this.dreamDepthWorldSystems);
            this.dreamDepthEffects.update(deltaTime);
        }

        // Update Safe Mobility Pack 4.0 - Enhanced movement with dash and double jump
        if (this.mobilityPack) {
            this.mobilityPack.update(deltaTime);
        }

        // Update Node Visuals 4.0 - Premium node visual effects
        if (this.nodeVisuals4) {
            this.nodeVisuals4.update(deltaTime);
        }

        // Update Rare Node Spawner - Background rare node spawning system
        if (this.rareNodeSpawner) {
            this.rareNodeSpawner.update(deltaTime);
        }

        // Update Node Evolution 2.0 - Visual node evolution system
        if (this.nodeEvolution && this.aiNodes) {
            this.nodeEvolution.update(deltaTime, {}, this.linkingSystem);
        }

        // DISABLED: Update Safe Node Archetypes Pack - Visual archetype animations
        // if (this.nodeArchetypesPack) {
        //   this.nodeArchetypesPack.update(deltaTime);
        // }

        // Update Evolving Link FX 2.0 - Visual link evolution
        if (this.evolvingLinkFX && this.linkingSystem) {
            this.evolvingLinkFX.update(deltaTime, null, null);
        }

        // Update Node Personality 2.0 - Unique personality signatures
        if (this.nodePersonality) {
            this.nodePersonality.update(deltaTime, this.time);
        }
        // Core visual metrics + overlays are now driven by FrameScheduler (visual layer, 30Hz)

        // Update Extreme AI Shader Test Suite (diagnostics - opt-in, very cheap when disabled)
        if (this.extremeShaderTestSuite) {
            this.extremeShaderTestSuite.update(deltaTime);
        }

        // Update Safe New Node Categories 1.0 (Mythic, Prime, Error node animations)
        if (this.newNodeCategories) {
            this.newNodeCategories.update(deltaTime, this.time);
        }

        // Update New Node Category Visuals 1.0 (Enhanced visual layer)
        try {
            if (this.newNodeVisuals && this.newNodeVisuals.animate) {
                this.newNodeVisuals.animate(deltaTime);
            }
        } catch (err) {
            console.warn('NewNodeCategoryVisuals update failed:', err);
        }

        // Update Extreme Link Visual Pack 3.0 (Multi-layer neon beams + glyphs)
        try {
            if (this.extremeLinkVisuals && this.extremeLinkVisuals.update) {
                this.extremeLinkVisuals.update(deltaTime);
            }
        } catch (err) {
            console.warn('ExtremeLinkVisualPack3 update failed:', err);
        }

        // Update Neural Curve Link Visuals 1.0 (Dynamic Bézier curved links)
        try {
            if (this.neuralCurveLinkVisuals && this.linkingSystem && this.linkingSystem.links) {
                for (const link of this.linkingSystem.links) {
                    if (link.active) {
                        this.neuralCurveLinkVisuals.updateLink(link, this.time, deltaTime);
                    }
                }
            }
        } catch (err) {
            console.warn('NeuralCurveLinkVisuals update failed:', err);
        }

        // Update Extreme Link Visuals 4.0 (Neural curvature & depth)
        try {
            if (this.extremeLinkVisuals4) {
                this.extremeLinkVisuals4.update(deltaTime, this.camera);
            }
        } catch (err) {
            console.warn('ExtremeLinkVisuals4_0 update failed:', err);
        }

        // Update Link Visual Mood System (mood transitions & smooth lerping)
        try {
            if (this.linkVisualMoodSystem) {
                this.linkVisualMoodSystem.update(deltaTime);
            }
        } catch (err) {
            console.warn('LinkVisualMoodSystem update failed:', err);
        }

        // Update AI Consciousness Layer 1.0 (Neural thought visualization)
        try {
            if (this.consciousnessLayer) {
                this.consciousnessLayer.update(deltaTime);
            }
        } catch (err) {
            console.warn('AIConsciousnessLayer update failed:', err);
        }

        // Update ATOMA Language Engine 3.0 (Procedural AI Poetry)
        try {
            if (this.poetryEngine) {
                this.poetryEngine.update(deltaTime, this.time);
            }
        } catch (err) {
            console.warn('AtomaLanguageEngine3_0 update failed:', err);
        }

        // ========================================================================
        // ATOMA UI 3.1 - Update All Components
        // ========================================================================
        // DISABLED: UINodeAutoDetect3_1 (replaced by NodeLinking2_3)
        // try {
        //   if (this.autoDetect) {
        //     this.autoDetect.update(deltaTime);
        //   }
        // } catch (err) {
        //   console.warn('UINodeAutoDetect3_1 update failed:', err);
        // }

        try {
            if (this.emotionalFeed) {
                this.emotionalFeed.update(deltaTime);
            }
        } catch (err) {
            console.warn('AIEmotionalFeed3_1 update failed:', err);
        }

        // ACTIVE: NodeLinking2_3 with integrated double-click + primary node
        try {
            if (this.nodeLinking) {
                mark('nodeLinking.update', () => {
                    this.nodeLinking.update(deltaTime);
                });
            }
        } catch (err) {
            console.warn('NodeLinking2_3 update failed:', err);
        }

        // DISABLED: UINodeHoverTooltip3_1 (conflicts with NodeLinking2_3)
         try {
        //   if (this.hoverTooltip) {
        //     this.hoverTooltip.update(deltaTime);
        //   }
        // } catch (err) {
        //   console.warn('UINodeHoverTooltip3_1 update failed:', err);
        // }

        // ========================================================================
        // ATOMA UI 3.2 - Update Interaction Polishing
        // ========================================================================
        // EXTRACTION PACK V1.0 — METRICS RUNTIME ORCHESTRATION
        // Moved to END of createAINodes() to ensure clean lifecycle
        // ========================================================================
        } catch (err) {
            console.warn('UISelectedNodeTopBar3_4 update failed:', err);
        }

        // ========================================================================
        // ATOMA UI 3.7 - Update Primary Node System
        // ========================================================================
        try {
            if (this.primaryNodeAura) {
                this.primaryNodeAura.update(deltaTime);
            }
        } catch (err) {
            console.warn('UIPrimaryNodeAura3_7 update failed:', err);
        }

        try {
            if (this.primaryNodeTopBar) {
                this.primaryNodeTopBar.update();
            }
        } catch (err) {
            console.warn('UIPrimaryNodeTopBar3_7 update failed:', err);
        }

        // ========================================================================
        // SESSION 99: ENFORCE NODE VISUAL FREEZE (Every Frame)
        // ========================================================================
        // Hard-enforce all frozen node properties to ensure immutability
        if (this.__nodeVisualFreezeMode__) {
            mark('nodeVisualFreezeMode.enforceFreeze', () => {
                this.__nodeVisualFreezeMode__.enforceFreeze(this.scene);
            });
        }

        // ========================================================================
        // SESSION 99: UPDATE LINK DEBUG VISUALIZATION (When enabled)
        // ========================================================================
        // Update debug visuals if link debug mode is active
        if (this.linkDebugMode && this.linkDebugMode.enabled) {
            this.linkDebugMode.updateDebugVisuals();
        }

        // ========================================================================
        // SESSION 104: FRAME-END VISUAL SAFETY NET (Hard Interaction Authority)
        // ========================================================================
        // Last line of defense: Guarantee node cores remain visible and interactive
        // This runs at end of frame to ensure NO system can win over interaction cores
        if (this.hardInteractionAuthority && this.scene) {
            this.hardInteractionAuthority.safetyNet();
        }

        if (runSlowSemantic && !this._runSlowSemanticPending) {
        // 10 Hz deep semantic/world-mood cadence (interpretation, not motion)
        // ========================================================================
        // REGIONAL EQUILIBRIUM FIELD SYSTEM — Territorial Visualization
        // ========================================================================
        // Updates regional ambient fields based on harmony, corruption, synergy
        // Reads: harmonySystem, ruptureSystem, standingWaveSystem (read-only)
        // Outputs: Visual mesh transforms, material uniforms (no gameplay mutation)
        // Must run late in frame (after all network state updates)
        if (this.regionalEquilibrium && this.harmonySystem && this.ruptureSystem) {
            this.regionalEquilibrium.update(
                deltaTime,
                this.time,
                {
                    nodes: this.aiNodes?.nodes || [],
                    links: this.linkingSystem?.links || []
                },
                this.harmonySystem,
                this.ruptureSystem,
                this.standingWaveSystem
            );
        }

        // ========================================================================
        // CASCADING RUPTURE SYSTEM — Regional Collapse Propagation
        // ========================================================================
        // Detects rupture cascade conditions and propagates visual effects
        // Reads: ruptureSystem, harmonySystem (read-only)
        // Outputs: Visual cascade effects, triggers node failure events
        // DISABLED BY DEFAULT: Enable via game.cascadingRuptures.enable()
        if (this.cascadingRuptures && this.cascadingRuptures.enabled) {
            this.cascadingRuptures.update(
                deltaTime,
                this.time,
                this.ruptureSystem,
                this.harmonySystem
            );
        }

        // ========================================================================
        // CRITICAL NODE FAILURE SYSTEM — Link Severing on Collapse
        // ========================================================================
        // Detects critical nodes and severs links after countdown
        // Reads: Node stability, corruption (read-only)
        // Writes: Links (DESTRUCTIVE - severs connections)
        // DISABLED BY DEFAULT: Enable via game.criticalNodeFailure.enable()
        if (this.criticalNodeFailure && this.criticalNodeFailure.enabled) {
            this.criticalNodeFailure.update(deltaTime, this.time);
        }

        // ========================================================================
        // LINK SEMANTIC PICTOGRAM SYSTEM — Visual Meaning Carriers
        // ========================================================================
        // Updates floating pictograms above links that encode network state
        // Includes: Multi-layer stack, morphing, depth/parallax, flow intelligence, glyph fusion
        // Reads: Link state, node harmony/corruption/synergy (read-only)
        // Outputs: Pictogram positions, materials, visibility (visual-only)
        // Adapter pattern: no gameplay mutation
        if (this.linkSemanticPictograms && this.linkSemanticPictograms.enabled) {
            this.linkSemanticPictograms.update(deltaTime, this.time, this.aiNodes);
        }

        // ========================================================================
        // HARMONIC RESONANCE FEEDBACK SYSTEM — Emergent Motion Guidance
        // ========================================================================
        // Composite glyphs emit subtle resonance fields influencing nearby link motion
        // Closed visual feedback loop: meaning shapes motion through phase alignment
        // Reads: Composite glyph state, link positions, pictogram data (read-only)
        // Outputs: Link phase modulation, pictogram speed/spacing adjustments (visual-only)
        // Adapter pattern: no gameplay mutation
        if (this.harmonicResonance && this.harmonicResonance.enabled) {
            this.harmonicResonance.update(
                deltaTime,
                this.linkSemanticPictograms?.fusionZoneManager,
                this.linkSemanticPictograms?.pictogramSystem?.pictograms,
                this.linkingSystem
            );
        }

        // ========================================================================
        // RESONANCE ECHO TRAIL SYSTEM — Temporal Memory of Meaning
        // ========================================================================
        // Harmonic afterimages following composite glyph movement and dissolution
        // Echoes spawn at low frequency (time-sliced), fade smoothly over time
        // Reads: Composite glyph positions, state (harmony/stability/synergy) (read-only)
        // Outputs: Echo mesh visibility, opacity, position (visual-only)
        // Adapter pattern: no gameplay mutation
        if (this.resonanceEchoTrails && this.resonanceEchoTrails.enabled) {
            this.resonanceEchoTrails.update(
                deltaTime,
                this.linkSemanticPictograms?.fusionZoneManager?.compositeGlyphs
            );
        }

        // ========================================================================
        // HARMONIC TOPOLOGY LEARNING SYSTEM — Long-Term Network Memory
        // ========================================================================
        // Visualizes network learning through topology evolution
        // Tracks preferred flow paths, reinforced links, learned avoidance patterns
        // Reads: Composite glyph synthesis, link success/failure, rupture events (read-only)
        // Outputs: Topology bias vectors, learning metrics, region state (visual-only)
        // Adapter pattern: no gameplay mutation
        if (this.harmonicTopology && this.harmonicTopology.enabled) {
            this.harmonicTopology.update(
                deltaTime,
                this.linkSemanticPictograms?.fusionZoneManager,
                this.linkingSystem
            );
        }

        // ========================================================================
        // TOPOLOGY BIAS VISUALIZATION LAYER — Spatial Learning Perception
        // ========================================================================
        // POLISHED: Added missing update loop call for topology visualization
        // Renders learned topology bias vectors and flow fields
        // Reveals how space itself has learned preferences over time
        // Reads: Topology system regions (read-only)
        // Outputs: Bias vector meshes, flow field shaders (visual-only)
        // Adapter pattern: no gameplay mutation
        if (this.topologyViz && this.topologyViz.enabled) {
            // Compute network state for flow field modulation
            const networkState = {
                harmony: this.nodeDynamicMetrics?.avgHarmony || 0.5,
                corruption: this.nodeDynamicMetrics?.avgCorruption || 0,
                synergy: this.nodeDynamicMetrics?.avgSynergy || 0,
                instability: this.nodeDynamicMetrics?.avgInstability || 0
            };
            
            this.topologyViz.update(deltaTime, networkState);
        }

        // ========================================================================
        // PROCEDURAL HARMONIC GLYPH GENERATOR — Emergent Visual Language
        // ========================================================================
        // Generates procedural glyphs from topology learning history
        // Creates unique symbols representing emergent network identity
        // Reads: Topology learning regions, flow bias, reinforcement history (read-only)
        // Outputs: Procedural glyph geometry, visibility, emergence timing (visual-only)
        // Adapter pattern: no gameplay mutation
        if (this.proceduralGlyphGenerator && this.proceduralGlyphGenerator.enabled) {
            this.proceduralGlyphGenerator.update(deltaTime);
        }

        // ========================================================================
        // REGIONAL HARMONIC CYCLE CONTROLLER — Breath of Regions
        // ========================================================================
        // Manages harmonic activity cycles for topology regions
        // Drives subtle glyph animation through cycle-based modulation
        // Reads: Region state, harmony, stability, healing (read-only)
        // Outputs: Cycle phase, animation parameters (visual-only)
        // Adapter pattern: no gameplay mutation
        const harmonicNetworkState = {
            harmony: this.nodeDynamicMetrics?.avgHarmony || 0.5,
            corruption: this.nodeDynamicMetrics?.avgCorruption || 0,
            stability: this.nodeDynamicMetrics?.avgStability || 0.5,
            synergy: this.nodeDynamicMetrics?.avgSynergy || 0
        };
        
        if (this.harmonicCycleController && this.harmonicCycleController.enabled) {
            this.harmonicCycleController.update(deltaTime, harmonicNetworkState);
        }

        // ========================================================================
        // GLYPH ANIMATION MODULATOR — Glyphs Breathing with Regions
        // ========================================================================
        // Applies harmonic cycle animations to procedural glyphs
        // Makes glyphs breathe with regional harmonic activity
        // Reads: Cycle phase, glyph state (read-only)
        // Outputs: Glyph rotation, scale, opacity (visual-only)
        // Adapter pattern: no gameplay mutation
        if (this.glyphAnimationModulator && this.glyphAnimationModulator.enabled) {
            if (this.proceduralGlyphGenerator?.glyphInstances) {
                this.glyphAnimationModulator.update(
                    this.proceduralGlyphGenerator.glyphInstances,
                    harmonicNetworkState
                );
            }
        }
        } // end 10 Hz semantic/world-mood cadence

    //  const dt = performance.now() - t0;
    //  if (dt > 50) {
    //      console.warn('[RAF_STALL]', dt.toFixed(1), 'ms');
    //  }

        if (tracingSpike) {
            const frameMs = performance.now() - frameStart;
            if (frameMs > spikeThresholdMs) {
                const top = samples
                    .sort((a, b) => b.ms - a.ms)
                    .slice(0, 8);
                const linksCount =
                    this.nodeLinking?.links?.length ??
                    this.linkingSystem?.links?.length ??
                    null;
                const nodesCount = this.aiNodes?.nodes?.length ?? null;
                const programCount = Array.isArray(this.renderer?.info?.programs)
                    ? this.renderer.info.programs.length
                    : (this.renderer?.info?.programs ?? null);
                console.groupCollapsed(`[SPIKE] ${frameMs.toFixed(0)}ms`);
                console.table(top);
                console.log('counts', {
                    links: linksCount,
                    nodes: nodesCount,
                    programs: programCount
                });
                console.groupEnd();
            }
        }

        this.updateValidator?.endFrame(deltaTimeMs);
    }

    /**
     * Update node info UI
     */
    updateNodeUI() {
        const info = this.aiNodes.getActiveNodeInfo();

        // Update status
        const statusEl = document.getElementById('node-status');
        if (statusEl) {
            statusEl.textContent = `AI NODES: ${info.activeNodes}/${info.totalNodes} ACTIVE`;
        }

        // Update categories
        const typesEl = document.getElementById('node-types');
        if (typesEl && info.activeNodes > 0) {
            let html = '';
            for (const [category, count] of Object.entries(info.nodesByCategory)) {
                if (count > 0) {
                    html += `<span class="node-type node-${category}">${category.toUpperCase()}: ${count}</span> `;
                }
            }
            typesEl.innerHTML = html;
        } else if (typesEl) {
            typesEl.innerHTML = '';
        }
    }

    /**
     * Phase D.3: visibility-driven HUD invalidation
     * Phase D.2: priority HUD lanes (critical vs ambient)
     * Adaptive HUD cadence (10-30Hz) with wake-up + dual-lane scheduling on FrameScheduler.visual.
     */
    runVisualOverlayTick(deltaTime) {
        // Drain semantic events and one-shots within small budgets before HUD work
        this.semanticBus?.drain(0.8, 48);
        this.semanticBus?.drainTasks(0.5, 32);
        // Adaptive cadence: adjust targetHz based on camera motion and wake window for critical lane
        const hudHz = this.getHudTargetHz();
        const criticalInterval = 1 / hudHz;
        const ambientInterval = 1 / 8; // AMBIENT_HZ = 8

        this.hudCriticalAcc += deltaTime;
        this.hudAmbientAcc += deltaTime;

        const shouldRunCritical = this.hudCriticalAcc >= criticalInterval;
        const shouldRunAmbient = this.hudAmbientAcc >= ambientInterval;

        const wakeActive = performance.now() < this.hudWakeUntil;
        const criticalReady = shouldRunCritical && (wakeActive || this.hasCriticalDirty());
        const ambientReady = shouldRunAmbient && (wakeActive || this.hasAmbientDirty());

        if (!criticalReady && !ambientReady) return;

        if (typeof window !== 'undefined' && window.DEBUG_VISUAL_MODE) {
            window.__ATOMA_HUD_HZ__ = hudHz;
            window.__ATOMA_HUD_LANES__ = {
                criticalHz: hudHz,
                ambientHz: 8,
                wakeUntil: this.hudWakeUntil
            };
        }

        if (criticalReady) {
            this.hudCriticalAcc -= criticalInterval;
            this.updateHudCritical(deltaTime);
        }

        if (ambientReady) {
            this.hudAmbientAcc -= ambientInterval;
            this.updateHudAmbient(deltaTime);
        }

    }

    updateHudCritical(deltaTime) {
        if (!this.hudVisibility?.critical) return;
        if (!this.hudVisibility.panels.metricsOverlay && !this.hudVisibility.panels.nodeInspector) return;
        const wakeActive = performance.now() < this.hudWakeUntil;
        if (!wakeActive && !this.hasCriticalDirty()) return;

        // System State Overlay critical signals (warnings/alerts)
        if (this.systemStateOverlay && this.coreMetricsOverlay && this.hudVisibility.panels.systemState) {
            this.systemStateOverlay.update(
                deltaTime,
                this.aiNodes?.nodes || [],
                this.coreMetricsOverlay.currentMetrics
            );
            this.setHudDirty('ambient');
            if (this.coreMetricsOverlay?.currentMetrics?.spikeAlert || this.coreMetricsOverlay?.currentMetrics?.spikeActive || this.coreMetricsOverlay?.currentMetrics?.hasSpike) {
                this.semanticBus.emit('metrics.spike', this.coreMetricsOverlay.currentMetrics, { priority: this.semanticBus.priority.CRITICAL });
            }
        }
        this.hudDirty.nodeInspector = false;
    }

    updateHudAmbient(deltaTime) {
        if (!this.hudVisibility?.ambient) return;
        if (!this.hudVisibility.panels.zoneOverlay) return;
        const wakeActive = performance.now() < this.hudWakeUntil;
        if (!wakeActive && !this.hasAmbientDirty()) return;
        // Ambient HUD: zone audio reactivity + background overlays
        if (this.zoneAudioReactivity && this.player && this.hudVisibility.panels.zoneOverlay) {
            this.zoneAudioReactivity.setPlayerPosition(this.player.position);

            if (this.systemStateOverlay?.regionalHarmonyZones?.zones) {
                this.zoneAudioReactivity.setZones(this.systemStateOverlay.regionalHarmonyZones.zones);
            }

            this.zoneAudioReactivity.update(deltaTime);

            if (this.systemStateOverlay?.regionalHarmonyZones) {
                const zoneInfluences = this.zoneAudioReactivity.getZoneInfluences();
                this.systemStateOverlay.regionalHarmonyZones.setZoneAudioInfluences(zoneInfluences);
                this.wakeHud('hud-toggle');
                this.hudDirty.ambient = false;
            }
        }
    }

    /**
     * Compute adaptive HUD cadence from camera motion + wake window (safe fallback at 20Hz)
     */
    getHudTargetHz() {
        const now = performance.now();
        if (now < this.hudWakeUntil) return 30;
        if (!this.camera) return 20;

        const pos = this.camera.position;
        const rot = this.camera.rotation;

        // Compute deltas without allocations
        const deltaPos = this.hudTempDelta.copy(pos).sub(this.hudLastPos).length();
        const deltaRot =
            Math.abs(rot.x - this.hudLastRot.x) +
            Math.abs(rot.y - this.hudLastRot.y) +
            Math.abs(rot.z - this.hudLastRot.z);

        // Update stored samples
        this.hudLastPos.copy(pos);
        this.hudLastRot.set(rot.x, rot.y, rot.z);

        // Simple motion score
        const motion = deltaPos + deltaRot;
        const HIGH_THRESHOLD = 0.02;
        const LOW_THRESHOLD = 0.005;
        const motionNow = performance.now();
        if (motion > LOW_THRESHOLD && motionNow - this.lastCameraMotionEvent > 200) {
            this.lastCameraMotionEvent = motionNow;
            this.semanticBus?.emit('camera.motion', { motion }, { priority: this.semanticBus.priority.INTERACTIVE });
        }

        if (motion > HIGH_THRESHOLD) return 30;
        if (motion > LOW_THRESHOLD) return 20;
        return 10;
    }

    hasCriticalDirty() {
        return !!(this.hudDirty.coreMetrics || this.hudDirty.nodeInspector);
    }

    hasAmbientDirty() {
        return !!this.hudDirty.ambient;
    }

    /**
     * Phase D.1: event-driven HUD wake-up (extends wake window to force 30Hz temporarily)
     */
    wakeHud(reason = 'generic') {
        const now = performance.now();
        const WAKE_WINDOW_MS = 1000;
        this.hudWakeUntil = Math.max(this.hudWakeUntil, now + WAKE_WINDOW_MS);
        if (reason === 'selection') {
            this.setHudDirty('coreMetrics');
            this.setHudDirty('nodeInspector');
        } else if (reason === 'hud-toggle') {
            this.setHudDirty('ambient');
        } else if (reason === 'metric-spike') {
            this.setHudDirty('coreMetrics');
        }
        if (typeof window !== 'undefined' && window.DEBUG_VISUAL_MODE) {
            window.__ATOMA_HUD_WAKE__ = { reason, until: this.hudWakeUntil };
            window.__ATOMA_HUD_VISIBILITY__ = this.hudVisibility;
            window.__ATOMA_HUD_STATE__ = {
                visibility: this.hudVisibility,
                dirty: this.hudDirty,
                wakeUntil: this.hudWakeUntil
            };
        }
        // Reset accumulator so next visual tick runs immediately
        this.hudAccumulator = 0;
        this.hudCriticalAcc = 0;
    }

    setHudVisible(key, visible) {
        if (!this.hudVisibility?.panels) return;
        if (this.hudVisibility.panels[key] === visible) return;
        this.hudVisibility.panels[key] = visible;
        if (key === 'zoneOverlay') {
            this.setHudDirty('ambient');
        } else if (key === 'nodeInspector') {
            this.setHudDirty('nodeInspector');
        } else {
            this.setHudDirty('coreMetrics');
        }
        this.semanticBus.emit('hud.visibility.change', { key, visible }, { priority: this.semanticBus.priority.CRITICAL });
        this.wakeHud('visibility-change');
    }

    isHudVisible(key) {
        if (!this.hudVisibility?.panels) return false;
        return !!this.hudVisibility.panels[key];
    }

    setHudDirty(section) {
        if (!this.hudDirty) return;
        if (section === 'coreMetrics') this.hudDirty.coreMetrics = true;
        if (section === 'nodeInspector') this.hudDirty.nodeInspector = true;
        if (section === 'ambient') this.hudDirty.ambient = true;
        if (typeof window !== 'undefined' && window.DEBUG_VISUAL_MODE) {
            window.__ATOMA_HUD_STATE__ = {
                visibility: this.hudVisibility,
                dirty: this.hudDirty,
                wakeUntil: this.hudWakeUntil
            };
        }
    }

    scheduleSemanticOnce(fn, opts = {}) {
        this.semanticBus?.scheduleTask(fn, opts);
    }

    scheduleVisualOnce(fn) {
        this.scheduleSemanticOnce(fn, { priority: this.semanticBus?.priority?.NORMAL });
    }

    /**
     * FrameScheduler-driven render tick (visual layer)
     */
    runRenderTick(deltaTime) {
        const frameId = this.frameCount ?? this.frameClock?.frame ?? 0;
        if (this.lastRenderFrame === frameId) {
            // Guard: enforce single renderer.render per RAF tick (FrameUpdateLoopOrderValidator duplicate fix)
            return;
        }
        this.lastRenderFrame = frameId;
        // [DIAG] HARD BYPASS post-processing
        this.renderer.setRenderTarget(null);
        if (!this.__renderWarningLogged) {
            this.__renderWarningLogged = false;
        }
        try {
            this.renderer.render(this.scene, this.camera);
        } catch (err) {
            if (!this.__renderWarningLogged) {
                console.warn('[FrameScheduler] renderer.render skipped due to runtime error:', err);
                this.__renderWarningLogged = true;
            }
            return;
        }
        // Phase B.3 – program stabilization: optional program creation watch (dev-only)
        if (PROGRAM_WATCH_ENABLED && this.renderer?.info?.programs) {
            const count = Array.isArray(this.renderer.info.programs)
                ? this.renderer.info.programs.length
                : (this.renderer.info.programs ?? 0);
            if (count > __phaseB3LastProgramCount) {
                console.log(`[prog-watch] new programs=${count} (+${count - __phaseB3LastProgramCount})`);
                __phaseB3LastProgramCount = count;
            }
        }
        return;
        const profile = this.renderProfile;
        profile?.startFrame();
        if (this.postProcessingEnabled && this.postProcessing && typeof this.postProcessing.apply === "function") {
            const result = this.postProcessing.apply(this.scene, this.camera);

            if (result && result.outputScene && result.outputCamera) {
                const finalStart = performance.now();
                this.renderer.setRenderTarget(null);
                this.renderer.render(result.outputScene, result.outputCamera);
                const finalDuration = performance.now() - finalStart;
                if (profile?.enabled) {
                    profile.record('finalRender', finalDuration);
                }
                this.updateValidator?.markSystemUpdate(
                    'renderer.render',
                    finalDuration,
                    { phase: 'present' }
                );
                profile?.endFrame();
                return;
            }
        }

        const baseStart = performance.now();
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);
        const baseDuration = performance.now() - baseStart;
        if (profile?.enabled) {
            profile.record('baseSceneRender', baseDuration);
            profile.record('finalRender', baseDuration);
        }
        this.updateValidator?.markSystemUpdate(
            'renderer.render',
            baseDuration,
            { phase: 'present' }
        );
        profile?.endFrame();
    }

    runNodeAuraSystemTick(deltaTime) {
        if (!VISUAL_SYSTEMS_ENABLED) return;
        if (this.nodeAuraSystem && this.aiNodes) {
            this.nodeAuraSystem.update(deltaTime, this.aiNodes.nodes);
        }
    }

    runCameraControllerTick(_deltaTime) {
        if (!this.cameraController) return;
        const start = performance.now();
        this._lastCameraRotation = this.cameraController.update();
        this.updateValidator?.markSystemUpdate(
            'cameraController.update',
            performance.now() - start
        );
    }

    runPlayerControllerTick(deltaTime) {
        if (!this.playerController) return;
        const start = performance.now();
        this.playerController.update(deltaTime, this._lastCameraRotation);
        this.updateValidator?.markSystemUpdate(
            'playerController.update',
            performance.now() - start
        );
    }

    /**
     * Update linking system - LEGACY TRAFFIC UI REMOVED (Session 35)
     */
    updateLinkingUI() {
        if (!VISUAL_SYSTEMS_ENABLED) return;
        if (!this.linkingSystem || !this.linkingSystem.links) return;
        // Legacy NODE CATEGORIES and LINK TRAFFIC overlays removed
        // These were deprecated HTML overlays in index.html
    }
    
    /**
     * [Session 144+] Update undo/redo UI counters
     */
    updateUndoRedoUI() {
        if (!this.linkingSystem || !this.linkingSystem.undoRedo) return;
        
        const undoCountEl = document.getElementById('undo-count');
        const redoCountEl = document.getElementById('redo-count');
        
        if (undoCountEl) {
            const undoCount = this.linkingSystem.undoRedo.getUndoCount();
            undoCountEl.textContent = `Undo: ${undoCount}`;
            undoCountEl.style.opacity = undoCount > 0 ? '1' : '0.5';
        }
        
        if (redoCountEl) {
            const redoCount = this.linkingSystem.undoRedo.getRedoCount();
            redoCountEl.textContent = `Redo: ${redoCount}`;
            redoCountEl.style.opacity = redoCount > 0 ? '1' : '0.5';
        }
    }

    /**
     * Setup Visual Upgrade Superpack - ALL 8 ENHANCEMENT PACKS
     */
    setupVisualSuperpack() {
        this.visualSuperpack = new VisualUpgradeSuperpack(
            this.scene,
            this.camera,
            this.renderer
        );

        // Apply all 8 enhancement packs
        this.visualSuperpack.applyFullUpgrade();

        // Apply renderer settings
        const settings = this.visualSuperpack.getRendererSettings();
        this.renderer.toneMapping = settings.toneMapping;
        this.renderer.toneMappingExposure = settings.toneMappingExposure;
        this.renderer.outputColorSpace = settings.outputColorSpace;
    }

    /**
     * Setup cinematic visual upgrade
     */
    setupCinematicUpgrade() {
        this.cinematicUpgrade = new CinematicUpgrade(this.scene, this.camera);
        this.cinematicUpgrade.initialize();

        // Apply color grading
        this.cinematicUpgrade.applyColorGrading(this.renderer);
    }

    /**
     * Setup node editor system
     */
    setupNodeEditor() {
        this.nodeEditor = new NodeEditor(this.scene, this.camera, this.collisionManager);

        // Create demo nodes
        this.nodeEditor.createNode(new THREE.Vector3(-5, 2, -5), { type: 'input', synergy: 'linear' });
        this.nodeEditor.createNode(new THREE.Vector3(0, 2, 0), { type: 'processor', synergy: 'fusion' });
        this.nodeEditor.createNode(new THREE.Vector3(5, 2, 5), { type: 'output', synergy: 'quantum' });
    }

    /**
     * Setup environmental hazards
     */
    setupHazards() {
        this.hazards = new EnvironmentalHazards(this.scene, this.camera);

        // Create demo hazards in Fractal Valley
        if (this.currentMode === 'fractal') {
            this.hazards.createElectricalStorm(new THREE.Vector3(40, 15, 40), 25, 0.8);
            this.hazards.createGravitationalAnomaly(new THREE.Vector3(-40, 10, -40), 20, 0.6);
        }
    }

    /**
     * Setup Safe Evolution Manager - External node evolution system
     * SAFE: Zero modifications to Node class, all state external
     */
    setupEvolutionManager() {
        this.evolutionManager = new SafeEvolutionManager(this.scene);

        // Auto-registers nodes on first update, no invasive setup needed
    }

    /**
     * Setup Safe Legendary Node Pack - External legendary system
     * SAFE: Zero modifications to Node class, all state external
     */
    setupLegendaryPack() {
        this.legendaryPack = new SafeLegendaryNodePack(this.scene);

        // Auto-spawns legendary nodes based on activity, no invasive setup needed
    }

    /**
     * Setup Safe Legendary Link FX - Link enhancements
     * SAFE: Zero modifications to Link objects, VFX overlays only
     */
    setupLegendaryLinkFX() {
        this.legendaryLinkFX = new SafeLegendaryLinkFX(this.scene, this.camera);

        // Auto-enhances links connected to legendary nodes, no invasive setup needed
    }

    /**
     * Setup Safe Legendary World Events - Global event system
     * SAFE: Zero modifications to core systems, VFX overlays only
     */
    setupWorldEvents() {
        this.worldEvents = new SafeLegendaryWorldEvents(this.scene, this.camera, this.renderer);

        // Auto-triggers rare global events, no invasive setup needed
    }

    /**
     * Setup Safe AI Weather Pack - Dynamic weather system
     * SAFE: Zero modifications to core systems, VFX overlays only
     */
    setupWeatherPack() {
        this.weatherPack = new SafeAIWeatherPack(this.scene, this.camera);

        // Auto-generates dynamic weather, no invasive setup needed
    }

    /**
     * Setup Safe Node Personality FX - Behavioral node visuals
     * SAFE: Pure VFX overlays, external registries only
     */
    setupPersonalityFX() {
        // DISABLED (Session 92): SafeNodePersonalityFX creates opaque plane overlays that obscure node identity
        this.personalityFX = null; // new SafeNodePersonalityFX(this.scene, this.camera);

        // Auto-assigns personalities and generates behavioral VFX, no invasive setup needed
    }

    /**
     * Setup Safe World FX Pack - Environmental effects
     * SAFE: Zero shader/material modifications, VFX overlays only
     */
    setupWorldFXPack() {
        this.worldFXPack = new SafeWorldFXPack(this.scene, this.camera);

        // Auto-generates environmental effects, no setup needed
    }

    /**
     * Setup Ambient Entity Manager - Holographic VFX entities
     * Ghost orbs, spectres, swarms, phantoms, wisps
     */
    setupAmbientEntities() {
        this.ambientEntityManager = new AmbientEntityManager(this.scene, this.camera);

        // Register world systems (read-only)
        if (this.legendaryPack && this.worldEvents && this.weatherPack && this.linkingSystem) {
            this.ambientEntityManager.registerWorldSystems(
                this.legendaryPack,
                this.worldEvents,
                this.weatherPack,
                this.linkingSystem
            );
        }
    }



    /**
     * Setup Safe Memory Trails Pack 1.0
     * SAFE: Creates holographic memory trails for nodes, links, and player
     */
    setupMemoryTrails() {
        this.memoryTrails = new SafeMemoryTrailsManager(this.scene, this.camera);

        // Register read-only world system references
        if (this.aiNodes && this.linkingSystem && this.player && this.personalityFX &&
            this.weatherPack && this.worldEvents && this.legendaryPack) {
            this.memoryTrails.registerWorldSystems(
                this.aiNodes,
                this.linkingSystem,
                this.player,
                this.personalityFX,
                this.weatherPack,
                this.worldEvents,
                this.legendaryPack
            );
        }

        console.log('✓ Memory Trails Pack 1.0 initialized');
    }

    /**
     * Setup Safe Quantum Illusions Pack 1.0
     * SAFE: Pure visual VFX, no gameplay modifications
     */
    setupQuantumIllusions() {
        this.quantumIllusions = new SafeQuantumIllusionsPack1(
            this.scene,
            this.camera,
            this.aiNodes,
            this.linkingSystem,
            this.worldEvents,
            this.weatherPack,
            this.legendaryPack
        );

        console.log('✓ Quantum Illusions Pack 1.0 initialized');
    }

    /**
     * Setup Safe Colony Expansion 2.0
     * SAFE: Living AI ecosystem with formation, growth, splitting, merging
     */
    setupColonyManager() {
        this.colonyManager = new SafeColonyExpansion2(this.scene);

        // Initialize with world systems (read-only)
        if (this.aiNodes && this.linkingSystem) {
            const worldSystems = {
                nodes: this.aiNodes.nodes.reduce((acc, node) => {
                    acc[node.uuid || node.id] = node;
                    return acc;
                }, {}),
                links: this.linkingSystem.links || [],
                legendaryRegistry: this.legendaryPack?.registry || null,
                weatherRegistry: this.weatherPack?.registry || null,
                worldEvents: this.worldEvents,
                evolutionRegistry: this.evolutionManager?.registry || null,
                synergyMap: this.synergyMap || {},
                trafficMap: this.trafficMap || {}
            };

            this.colonyManager.initialize(worldSystems);
        }

        console.log('✓ Safe Colony Expansion 2.0 initialized');
    }

    /**
     * Setup Safe Dream Depth Pack
     * SAFE: Pure VFX DOF simulation, no camera modifications
     */
    setupDreamDepthPack() {
        this.dreamDepthPack = new SafeDreamDepthPack(this.scene, this.camera, this.renderer);
        this.dreamDepthEffects = new DreamDepthEffectManager(this.scene, this.camera, this.renderer);

        // Initialize with world systems (read-only)
        const worldSystems = {
            aiNodes: this.aiNodes,
            legendaryRegistry: this.legendaryPack?.registry,
            weatherRegistry: this.weatherPack?.registry,
            worldEvents: this.worldEvents,
            colonies: this.colonyManager?.registry?.getAllColonies?.() || []
        };

        // Store for updates
        this.dreamDepthWorldSystems = worldSystems;

        console.log('✓ Safe Dream Depth Pack initialized');
    }



    /**
     * Setup Safe Mobility Pack 4.0
     * SAFE: Enhanced movement with dash/blink on SHIFT and double jump on double SPACE
     * Zero physics modifications, pure movement modifiers + VFX overlays
     */
    setupMobilityPack() {
        if (!this.player || !this.playerController || !this.cameraController) {
            console.warn('Player systems not initialized, deferring Mobility Pack setup');
            return;
        }

        this.mobilityPack = new SafeMobilityPack4(
            this.scene,
            this.camera,
            this.player,
            this.playerController,
            this.cameraController
        );

        // Print comprehensive status report
        this.mobilityPack.printStatusReport();

        console.log('✓ Safe Mobility Pack 4.0 initialized');
    }

    /**
     * Setup node editor input handling
     */
    setupNodeEditorInput() {
        const handler = (method) => (e) => {
            if (this.nodeEditor && typeof this.nodeEditor[method] === "function") {
                this.nodeEditor[method](e);
            }
            if (this.nodeLinking && typeof this.nodeLinking[method] === "function") {
                this.nodeLinking[method](e);
            }
        };

        document.addEventListener("pointermove", handler("handleMouseMove"));
        document.addEventListener("pointerdown", handler("handleMouseDown"));
        document.addEventListener("pointerup", handler("handleMouseUp"));
    }

    // Global double-click fallback (browser-independent)
    setupDoubleClickFallback() {
        document.addEventListener("dblclick", (e) => {
            if (window.game && window.game.nodeLinking && window.game.nodeLinking.handleDoubleClick) {
                window.game.nodeLinking.handleDoubleClick(e);
            }
        });
    }

    /**
     * Setup Node Visuals 4.0
     * SAFE: High-quality node visual upgrade system
     * ✓ Hologram core with soft inner glow
     * ✓ Spectral energy rings
     * ✓ Levitation field (local oscillation only)
     * ✓ Neon rim-light
     * ✓ Internal pulse (subtle)
     * ✓ Occlusion halo (static shadow)
     */
    setupNodeVisuals4() {
        if (!this.aiNodes || !this.aiNodes.nodes) {
            console.warn('AI Nodes not initialized, deferring Node Visuals 4.0 setup');
            return;
        }

        this.nodeVisuals4 = new NodeVisuals4_0(this.scene);
        this.nodeVisuals4.upgradeAllNodes(this.aiNodes.nodes);
        this.nodeVisuals4.printStatusReport();

        console.log('✓ Node Visuals 4.0 initialized');
    }

    /**
     * Setup Rare Node Spawner
     * SAFE: Background rare node spawning system
     * ✓ 10 unique rare node types
     * ✓ Safe collision avoidance
     * ✓ No world transforms
     * ✓ Node-local visuals only
     */
    setupRareNodeSpawner() {
        if (!this.aiNodes || !this.player) {
            console.warn('Player or AI Nodes not initialized, deferring Rare Node Spawner setup');
            return;
        }

        // SESSION 37 FIX CRITICAL: Pass aiNodes instance itself (not just nodes list)
        // This ensures RareNodeSpawner registers nodes to this.aiNodes.nodes (authoritative)
        // Not to a local nodesList copy (which would create ghost nodes)
        this.rareNodeSpawner = new RareNodeSpawner(
            this.scene,
            this.player,
            this.aiNodes  // ✓ Pass full instance for registry access
        );

        this.rareNodeSpawner.printStatusReport();

        // Setup runtime verifier for diagnostics
        setupRareNodeVerifier(this.aiNodes, this.rareNodeSpawner);
        console.log('✓ Rare Node Verifier initialized (window.__rareNodeVerifier)');
        
        // Setup simulation audit helpers (Session 37+ Part 2)
        setupSimulationAuditHelpers(this.aiNodes, this.scene, this.effectOrchestrator);

        console.log('✓ Rare Node Spawner initialized (COHESION FIX: authoritative registry)');
    }

    /**
     * Setup Node Evolution 2.0
     * SAFE: Visual-only node evolution system
     * ✓ 4 evolution stages per node
     * ✓ Time, synergy, and rare event triggers
     * ✓ Pure visual effects (no world/physics/camera changes)
     * ✓ Node-local effects only
     */
    setupNodeEvolution() {
        if (!this.aiNodes || !this.aiNodes.nodes) {
            console.warn('AI Nodes not initialized, deferring Node Evolution 2.0 setup');
            return;
        }

        this.nodeEvolution = new NodeEvolution2_0(this.scene);

        // Register all current nodes for evolution tracking
        this.aiNodes.nodes.forEach((node, index) => {
            const nodeId = node.uuid || `node-${index}`;
            this.nodeEvolution.registerNode(node, nodeId);
            node.userData.originalPosition = node.position.clone();
        });

        this.nodeEvolution.printStatusReport();

        console.log('✓ Node Evolution 2.0 initialized');
    }

    /**
     * Setup Safe Node Archetypes Pack
     * SAFE: Pure visual archetype overlays
     * ✓ 10 unique visual archetypes
     * ✓ Random assignment at spawn only
     * ✓ No gameplay modifications
     * ✓ < 0.3ms overhead per frame
     */
    setupNodeArchetypesPack() {
        if (!this.aiNodes || !this.aiNodes.nodes) {
            console.warn('AI Nodes not initialized, deferring Node Archetypes Pack setup');
            return;
        }

        // DISABLED: SafeNodeArchetypesPack system permanently disconnected
        // this.nodeArchetypesPack = new SafeNodeArchetypesPack(this.scene);

        // Assign archetypes to all current nodes
        // this.aiNodes.nodes.forEach((node, index) => {
        //   const nodeId = node.uuid || `node-${index}`;
        //   this.nodeArchetypesPack.assignArchetype(node, nodeId);
        // });

        // this.nodeArchetypesPack.printStatusReport();

        // console.log('✓ Safe Node Archetypes Pack initialized');
        console.log('⊗ Safe Node Archetypes Pack DISABLED (permanently disconnected)');
    }

    /**
     * Setup Evolving Link FX 2.0
     * SAFE: Visual-only link evolution system
     * ✓ 4 evolution stages per link
     * ✓ Based on node evolution, synergy, and load
     * ✓ Pure visual effects (no gameplay changes)
     * ✓ < 0.3ms overhead per frame
     */
    setupEvolvingLinkFX() {
        if (!this.linkingSystem || !this.linkingSystem.links) {
            console.warn('Linking system not initialized, deferring Evolving Link FX setup');
            return;
        }

        this.evolvingLinkFX = new EvolvingLinkFX2_0(this.scene);

        // Track all current links
        this.linkingSystem.links.forEach((link, index) => {
            const linkId = link.uuid || `link-${index}`;
            this.evolvingLinkFX.trackLink(link, linkId);
        });

        this.evolvingLinkFX.printStatusReport();

        console.log('✓ Evolving Link FX 2.0 initialized');
    }

    /**
     * Setup Node Personality 2.0 system
     * Assigns unique personality signatures to nodes (visual-only, completely safe)
     */
    setupNodePersonality() {
        this.nodePersonality = new NodePersonality2_0(this.scene);
        this.nodePersonality.initialize();

        // Bezpečne zober aktuálne AI uzly
        const nodes = (this.aiNodes && this.aiNodes.nodes) ? this.aiNodes.nodes : [];

        if (nodes.length > 0) {
            nodes.forEach((node, index) => {
                if (node && node.userData) {
                    const nodeId = node.uuid || `node-${index}`;
                    const nodeCategory = node.userData.category || 'input';
                    const archetypeType = node.userData.archetypeType || null;
                    const evolutionStage = node.userData.evolutionStage || 1;

                    this.nodePersonality.assignPersonality(
                        node,
                        nodeId,
                        nodeCategory,
                        archetypeType,
                        evolutionStage
                    );
                }
            });
        }

        const stats = this.nodePersonality.getStatistics();
        console.log(
            '✓ Node Personality 2.0 initialized with ' +
            stats.activePersonalities +
            ' active personalities'
        );
    }


    /**
     * Setup Core Metrics Overlay 1.0
     * Non-intrusive HUD showing network metrics and temporal units
     */
    setupCoreMetricsOverlay() {
        this.coreMetricsOverlay = new CoreMetricsOverlay(this.scene, this.renderer);

        // Store reference to game in window for console access
        window.game = this;

        console.log('✓ Core Metrics Overlay 1.0 initialized');
        console.log('  - Use toggleMetricsOverlay() to toggle HUD');
        console.log('  - Use debugMetricsOverlay() to see status');
    }

    runCoreMetricsOverlayTick(deltaTime) {
        if (!this.coreMetricsOverlay) return;
        if (!this.hudVisibility?.panels?.metricsOverlay) return;
        const nodeManager = this.aiNodes || null;
        const start = performance.now();
        this.coreMetricsOverlay.update(
            deltaTime,
            nodeManager,
            this.linkingSystem,
            this.nodeEvolution,
            null
        );
        this.updateValidator?.markSystemUpdate(
            'coreMetricsOverlay.update',
            performance.now() - start
        );
        this.hudDirty.coreMetrics = false;
    }

    runNodeInspectOverlayTick(deltaTime) {
        if (!this.nodeInspectOverlay) return;
        const start = performance.now();
        this.nodeInspectOverlay.update(deltaTime);
        this.updateValidator?.markSystemUpdate(
            'nodeInspectOverlay.update',
            performance.now() - start
        );
    }

    /**
     * Setup System State Overlay 1.0
     * Non-intrusive visual representation of system metrics (harmony, synergy, corruption)
     * Disabled by default - enable via window.toggleSystemStateOverlay()
     */
    setupSystemStateOverlay() {
        if (!this.camera) {
            console.warn('Camera not initialized, deferring System State Overlay setup');
            return;
        }

        this.systemStateOverlay = new SystemStateOverlay(this.scene, this.renderer, this.camera);

        // Setup console API
        window.toggleSystemStateOverlay = () => {
            if (this.systemStateOverlay) {
                this.systemStateOverlay.toggle();
            }
        };

        window.systemStateOverlayStatus = () => {
            if (this.systemStateOverlay) {
                this.systemStateOverlay.status();
            }
        };

        window.toggleRegionalHarmonyZones = () => {
            if (this.systemStateOverlay) {
                this.systemStateOverlay.toggleRegionalHarmonyZones();
            }
        };

        console.log('✓ System State Overlay 1.0 initialized (disabled by default)');
        console.log('  - Use window.toggleSystemStateOverlay() to enable/disable');
        console.log('  - Use window.toggleRegionalHarmonyZones() to show/hide zones');
        console.log('  - Use window.systemStateOverlayStatus() to see metrics');
    }

    /**
     * Setup Zone Audio Reactivity 1.0
     * Subtle per-zone audio parameter modulation based on harmony zone stability
     * Modulates filter cutoff, Q, and LFO rate—never introduces new sounds or volume changes
     * Disabled by default - enable via window.toggleZoneAudioReactivity()
     */
    setupZoneAudioReactivity() {
        if (!this.audioSystem || !this.coreMetricsOverlay || !this.systemStateOverlay) {
            console.warn('Required systems not initialized, deferring Zone Audio Reactivity setup');
            return;
        }

        this.zoneAudioReactivity = new ZoneAudioReactivity(this.audioSystem, this.coreMetricsOverlay);
        
        // Wire zone data from system state overlay (read-only)
        if (this.systemStateOverlay.regionalHarmonyZones) {
            this.zoneAudioReactivity.setZones(this.systemStateOverlay.regionalHarmonyZones.zones);
        }
        
        // Setup console API
        window.toggleZoneAudioReactivity = () => {
            if (this.zoneAudioReactivity) {
                this.zoneAudioReactivity.toggle();
            }
        };

        window.zoneAudioReactivityStatus = () => {
            if (this.zoneAudioReactivity) {
                const status = this.zoneAudioReactivity.getStatus();
                console.log('Zone Audio Reactivity Status:', status);
                return status;
            }
        };

        console.log('✓ Zone Audio Reactivity 1.0 initialized (disabled by default)');
        console.log('  - Use window.toggleZoneAudioReactivity() to enable/disable');
        console.log('  - Use window.zoneAudioReactivityStatus() to see metrics');
    }

    /**
     * Setup Metric-Reactive World Events 1.0
     * Environment reacts to live metrics in real-time
     */
    setupMetricReactiveEvents() {
        if (!this.coreMetricsOverlay) {
            console.warn('Core Metrics Overlay not initialized, skipping reactive events');
            return;
        }

        // DISABLED: Legacy metric reactive system initialization
        // this.metricReactiveEvents = new MetricReactiveWorldEvents(this.scene, this.renderer, this.coreMetricsOverlay);

        // console.log('✓ Metric-Reactive World Events 1.0 initialized');
        // console.log('  - Events trigger based on live metrics');
        // console.log('  - Use toggleWorldEvents() to toggle effects');
    }

    /**
     * Setup Semantic Glyph AI 5.0
     */
    setupSemanticGlyphAI() {
        if (!this.glyphLayer4) {
            console.warn('Glyph Layer 4.0 not initialized, skipping Semantic Glyph AI');
            return;
        }

        this.semanticGlyphAI = new SemanticGlyphAI(this.scene, this.glyphLayer4);

        console.log('✓ Semantic Glyph AI 5.0 initialized');
        console.log('  - Glyphs react to node metrics and state');
        console.log('  - Use debugSemanticGlyph(nodeIndex) to inspect');
        console.log('  - Use debugSemanticStats() for system stats');
    }

    /**
     * Setup Glyph Fusion Overlay 4.1
     */
    setupGlyphFusionOverlay() {
        if (!this.semanticGlyphAI) {
            console.warn('Semantic Glyph AI not initialized, deferring Glyph Fusion Overlay setup');
            return;
        }

        this.glyphFusionOverlay = new GlyphFusionOverlay4_1(this.scene, this.semanticGlyphAI);

        // Initialize fusion glyphs for all existing nodes
        if (this.aiNodes) {
            this.glyphFusionOverlay.initializeForNodes(this.aiNodes.nodes);
        }

        console.log('✓ Glyph Fusion Overlay 4.1 initialized');
        console.log('  - Semantic-driven fusion forms');
        console.log('  - 5 fusion geometries per semantic state');
        console.log('  - Use debugFusionGlyph(nodeIndex) to inspect');
        console.log('  - Use debugFusionStats() for statistics');
    }

    /**
     * Setup Procedural Meaning Engine 1.0
     * Replaces legacy 2D hexagon glyphs with lightweight 3D procedural glyphs
     */
    setupProceduralMeaningEngine() {
        if (!this.semanticGlyphAI) {
            console.warn('Semantic Glyph AI not initialized, deferring Procedural Meaning Engine setup');
            return;
        }

        this.proceduralMeaningEngine = new ProceduralMeaningEngine(this.scene);

        // Remove all legacy 2D cyan hexagon glyphs
        this.proceduralMeaningEngine.removeLegacyHexagons();

        console.log('✓ Procedural Meaning Engine 1.0 initialized');
        console.log('  - Lightweight 3D semantic glyphs');
        console.log('  - 5 procedural glyph types (consciousness, instability, synergy, corruption, harmony)');
        console.log('  - Auto-attached to node.visualGroup');
        console.log('  - Use debugRemoveLegacyHex() to cleanup old glyphs');
    }

    /**
     * Setup Link Glyph Flow 1.0 (SAFE EDITION)
     * AI communication packets travel along links
     */
    setupLinkGlyphFlow() {
        if (!this.linkingSystem || !this.semanticGlyphAI) {
            console.warn('Linking system or Semantic Glyph AI not initialized, deferring Link Glyph Flow setup');
            return;
        }

        this.linkGlyphFlow = new LinkGlyphFlow(this.scene, this.linkingSystem, this.semanticGlyphAI);

        console.log('✓ Link Glyph Flow 1.0 initialized');
        console.log('  - AI communication packets along links');
        console.log('  - 7 glyph packet shapes (circle, triangle, lotus, hex, shard, diamond, ring)');
        console.log('  - Use debugLinkGlyphFlow() to view statistics');
        console.log('  - Use toggleLinkGlyphFlow() to enable/disable');
    }

    /**
     * Setup Linked Glyph Messaging 3.0 (SAFE EDITION)
     * Ultra symbolic AI language transport
     */
    setupLinkedGlyphMessaging() {
        if (!this.semanticGlyphAI) {
            console.warn('Semantic Glyph AI not initialized, deferring Linked Glyph Messaging setup');
            return;
        }

        this.linkedGlyphMessaging = new LinkedGlyphMessaging3_0(this.scene, this.semanticGlyphAI);
        this.linkedGlyphMessaging.setEnabled(true);

        console.log('✓ Linked Glyph Messaging 3.0 active');
        console.log('  - Ultra symbolic AI language transport');
        console.log('  - Messages carry node semantic state');
        console.log('  - Use debugPrintMessages() to view statistics');
        console.log('  - Use toggleMessaging() to enable/disable');
    }

    /**
     * Setup Recursive Glyph Messaging 4.0 (SAFE EDITION)
     * Recursive meaning chains with branching and looping
     */
    setupRecursiveGlyphMessaging() {
        if (!this.semanticGlyphAI) {
            console.warn('Semantic Glyph AI not initialized, deferring Recursive Glyph Messaging setup');
            return;
        }

        this.recursiveGlyphMessaging = new RecursiveGlyphMessaging4_0(this.scene, this.semanticGlyphAI);
        this.recursiveGlyphMessaging.setEnabled(true);

        console.log('✓ Recursive Glyph Messaging 4.0 active');
        console.log('  - Recursive meaning chains (WORD→PHRASE→SENTENCE→CHAIN)');
        console.log('  - Semantic-driven chain evolution');
        console.log('  - Branching sub-chains & safe looping');
        console.log('  - Use debugRecursiveMessages() to view statistics');
        console.log('  - Use toggleRecursiveChains() to enable/disable');
    }

    /**
     * Setup Emergent Thought Storms 5.0 (SAFE EDITION)
     * Chain collision phenomena with spectacular visual effects
     */
    setupEmergentThoughtStorms() {
        if (!this.recursiveGlyphMessaging || !this.semanticGlyphAI) {
            console.warn('Recursive Glyph Messaging not initialized, deferring Thought Storms setup');
            return;
        }

        this.emergentThoughtStorms = new EmergentThoughtStorms5_0(
            this.scene,
            this.recursiveGlyphMessaging,
            this.semanticGlyphAI
        );
        this.emergentThoughtStorms.setEnabled(true);

        console.log('✓ Emergent Thought Storms 5.0 active');
        console.log('  - Chain collision detection');
        console.log('  - 4 storm types (coherence, chaotic, corruption, ascended)');
        console.log('  - Swirling glyphs & fractal patterns');
        console.log('  - Expanding ripple waves');
        console.log('  - Use debugThoughtStorms() to view statistics');
        console.log('  - Use toggleThoughtStorms() to enable/disable');
    }

    /**
     * Setup AI Narrative Patterns 6.0 (SAFE EDITION)
     * Visual narrative structure layer with emergent story arcs
     */
    setupAINarrativePatterns() {
        if (!this.emergentThoughtStorms || !this.recursiveGlyphMessaging ||
            !this.linkedGlyphMessaging || !this.semanticGlyphAI) {
            console.warn('Glyph messaging systems not initialized, deferring Narrative Patterns setup');
            return;
        }

        this.narrativePatterns = new AINarrativePatterns6_0(
            this.scene,
            this.linkedGlyphMessaging,
            this.recursiveGlyphMessaging,
            this.emergentThoughtStorms,
            this.semanticGlyphAI
        );
        this.narrativePatterns.enabled = true;

        console.log('✓ AI Narrative Patterns 6.0 active');
        console.log('  - Visual narrative structure layer');
        console.log('  - 5-phase episodic progression (INTRO→RISING→CLIMAX→RESOLVE→ECHO)');
        console.log('  - 6 narrative motifs (RISING_HARMONY, COLLAPSING_ORDER, ASCENSION_TALE, etc.)');
        console.log('  - Emergent story arcs from network metrics');
        console.log('  - Use debugNarrativePatterns() to view statistics');
        console.log('  - Use toggleNarrativePatterns() to enable/disable');
    }

    /**
     * Setup ATOMA Language Engine 2.0
     * Grammar + semantic language processing for archetype naming system
     * Pure text layer - zero gameplay impact, read-only access only
     */
    setupLanguageEngine() {
        // Language engine already initialized in constructor
        // Just setup console API and expose to window
        window.atomaLang = this.languageEngine;

        // Initialize console API for debugging
        setupAtomaNamingConsoleAPI(this.languageEngine);

        console.log('%c✓ ATOMA Language Engine 2.0 initialized', 'color: cyan; font-weight: bold;');
        console.log('%c  API available via window.lang.*', 'color: cyan;');
        console.log('%c  - lang.info(code) — Get archetype info', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.label(code) — Get short label', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.fullname(code) — Get poetic name', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.phrase(code, metrics) — Get descriptive phrase', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.link(srcCode, tgtCode, metrics) — Get link description', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.stats() — Get cache statistics', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.queryByOrigin(code) — Find by origin', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.queryByPattern(code) — Find by pattern', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.queryBySignature(code) — Find by signature', 'color: cyan; font-size: 11px;');
    }

    /**
     * Setup Node Inspect Linguistic Overlay 1.0
     * Semantic language enhancement for node inspection HUD
     * Pure visual layer - zero gameplay impact
     */
    setupLinguisticOverlay() {
        if (!this.languageEngine) {
            console.warn('Language Engine not initialized, deferring Linguistic Overlay setup');
            return;
        }

        this.linguisticOverlay = new NodeInspectLinguisticOverlay(
            this.languageEngine,
            this.consciousnessLayer // Optional: passes AI mood information
        );

        // Setup console API
        setupLinguisticOverlayConsoleAPI(this.linguisticOverlay);

        console.log('%c✓ Node Inspect Linguistic Overlay 1.0 initialized', 'color: magenta; font-weight: bold;');
        console.log('%c  API available via window.ling.*', 'color: magenta;');
        console.log('%c  - ling.toggle() — Enable/disable overlay', 'color: magenta; font-size: 11px;');
        console.log('%c  - ling.show() / ling.hide() — Manual control', 'color: magenta; font-size: 11px;');
        console.log('%c  - ling.stats() — View statistics', 'color: magenta; font-size: 11px;');
        console.log('%c  - ling.status() — Print status report', 'color: magenta; font-size: 11px;');
    }

    /**
     * Setup ATOMA Language Engine 3.0
     * Procedural AI Poetry — Emergent whispers from the dream network
     * Pure text/DOM layer - zero gameplay impact, poetic descriptions
     */
    setupPoetryEngine() {
        if (!this.languageEngine) {
            console.warn('Language Engine not initialized, deferring Poetry Engine setup');
            return;
        }

        this.poetryEngine = new AtomaLanguageEngine3_0(
            this.languageEngine,
            this.consciousnessLayer ? this.consciousnessLayer.storms : null,
            this.consciousnessLayer
        );

        // Enable poetry engine
        this.poetryEngine.enable();

        // Setup console API
        setupAtomaLanguageEngine3ConsoleAPI(this.poetryEngine);

        console.log('%c✓ ATOMA Language Engine 3.0 initialized', 'color: cyan; font-weight: bold;');
        console.log('%c  Procedural AI Poetry — Emergent whispers active', 'color: cyan;');
        console.log('%c  API available via window.poetry.*', 'color: cyan;');
        console.log('%c  - poetry.enable() / poetry.disable() — Toggle', 'color: cyan; font-size: 11px;');
        console.log('%c  - poetry.test() — Generate sample poetry', 'color: cyan; font-size: 11px;');
        console.log('%c  - poetry.stats() — View performance metrics', 'color: cyan; font-size: 11px;');
        console.log('%c  - poetry.show() / poetry.hide() — Manual control', 'color: cyan; font-size: 11px;');
    }

    /**
     * Setup Node Auto-Detection 3.1 - DISABLED
     * Replaced by NodeLinking2_3 unified mouse handler
     */
    setupNodeAutoDetect() {
        console.log('⊘ Node Auto-Detection 3.1 DISABLED (replaced by UI 3.7 mouse kernel)');
        // Legacy system disabled - NodeLinking2_3 handles all input
    }

    /**
     * Setup Category Legend 3.1 - PASSIVE DISPLAY ONLY
     * Reference panel showing all 14 node categories with color indicators
     * Categories: Input, Process, Integration, Analytics, Storage, Control,
     *             Sigma, Emotional, Quantum, Mythic, Prime, External, Extreme, Special
     */
    setupCategoryLegend() {
        this.categoryLegend = new UICategoryLegend3_1();

        console.log('✓ Category Legend 3.1 initialized (14 categories - passive display)');
    }

    /**
     * Setup Emotional Feed 3.1 - PASSIVE DISPLAY ONLY
     * Dynamic poetic network status reflections (no interaction)
     */
    setupEmotionalFeed() {
        this.emotionalFeed = new AIEmotionalFeed3_1(this.aiNodes);

        console.log('✓ Emotional Feed 3.1 initialized (passive display - no interaction)');
    }

    /**
     * Setup Node Linking 2.1 - DISABLED
     * Replaced by NodeLinking2_3 (unified mouse kernel with double-click primary)
     */
    setupNodeLinking() {
        console.log('⊘ Node Linking 2.0/2.1 DISABLED (replaced by UI 3.7 NodeLinking2_3)');
        // Legacy system disabled - NodeLinking2_3 handles all LMB/RMB interactions
    }

    /**
     * Setup Node Hover Tooltip 3.1 - DISABLED
     * Conflicts with NodeLinking2_3 unified mouse handler
     */
    setupHoverTooltip() {
        console.log('⊘ Node Hover Tooltip 3.1 DISABLED (conflicts with UI 3.7 mouse kernel)');
        // Legacy system disabled - NodeLinking2_3 handles all mouse detection
    }

    /**
     * Setup Node Inspect Panel
     * Persistent panel showing node details
     */
    setupNodeInspectPanel() {
        this.nodeInspectPanel = new UINodeInspectPanel(this.languageEngine, this.poetryEngine);

        console.log('✓ Node Inspect Panel initialized (persistent display)');
    }

    /**
     * Setup Selected Node Badge 3.2
     * Minimalist badge under crosshair showing QNT-ORB-SYN code + archetype
     */
    setupSelectedNodeBadge() {
        this.selectedNodeBadge = null;
    }

    /**
     * Setup Selected Node Highlight 3.2 (Upgraded to 3.3)
     * Thicker pulsing neon highlight shader for selected nodes
     */
    setupSelectedNodeHighlight() {
        this.selectedNodeHighlight = new UISelectedNodeHighlight3_2(this.scene);

        console.log('✓ Selected Node Highlight 3.3 initialized (thicker neon outline, 1.5s pulse)');
    }

    /**
     * Setup Selected Node Label 3.3
     * Floating label above selected node showing [SELECTED] code
     */
    setupSelectedNodeLabel() {
        this.selectedNodeLabel = new UISelectedNodeLabel3_3(this.scene, this.camera);

        console.log('✓ Selected Node Label 3.3 initialized (floating above node)');
    }

    /**
     * Setup Synaptic Fatigue Adapter
     * Long-term wear and recovery at nodes
     */
    setupSynapticFatigue() {
        try {
            const adapter = setupSynapticFatigueIntegration(this);
            console.log('[main.js] SynapticFatigueAdapter initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynapticFatigueAdapter init error:', err);
        }
    }

    /**
     * Setup Synaptic Specialization Adapter
     * Visual learning from repeated behavior (excitatory vs inhibitory)
     */
    setupSynapticSpecialization() {
        try {
            const adapter = setupSynapticSpecializationIntegration(this);
            console.log('[main.js] SynapticSpecializationAdapter initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynapticSpecializationAdapter init error:', err);
        }
    }

    /**
     * Setup Influence Attenuation & Absorption Visuals (Session 128)
     * Visualizes how harmonic influence weakens/absorbs at non-harmonic nodes
     * VISUAL-ONLY SYSTEM: Creates attenuation zones and absorption blooms
     */
    setupInfluenceAttenuationAbsorption() {
        try {
            // Initialize system with core world references
            // Harmonic hub detection happens internally via node/link analysis
            this.influenceAttenuationAbsorption = new InfluenceAttenuationAbsorptionSystem_Session128(
                this.scene,
                this.world || { aiNodes: this.aiNodes, linkingSystem: this.linkingSystem },
                null,  // Harmonic hub system (can be null, auto-detected internally)
                null,  // Harmonic influence system (can be null, auto-detected internally)
                {
                    minLinksForHub: 2,
                    harmonyThreshold: 0.3,
                    attenuationZoneRadiusBase: 1.0,
                    attenuationZoneOpacityBase: 0.12,
                    bloomOpacityMin: 0.08,
                    bloomOpacityMax: 0.15,
                    bloomLifetime: 0.6,
                }
            );

            console.log('[main.js] InfluenceAttenuationAbsorptionSystem initialized ✓');
            console.log('  - Attenuation zones around non-harmonic nodes');
            console.log('  - Absorption blooms on influence arrival');
            console.log('  - Link termination softening');
        } catch (err) {
            console.warn('[main.js] InfluenceAttenuationAbsorptionSystem init error:', err);
        }
    }

    /**
     * Setup Influence Reflection & Back-Pressure (Session 129)
     * Visualizes how resistant nodes reject influence through elastic reflection
     */
    setupInfluenceReflection() {
        try {
            // Get harmonic influence system if available
            const harmonicInfluenceSystem = this.harmonicInfluencePropagation || null;
            
            // Initialize reflection system with core world references
            this.influenceReflection = new InfluenceReflectionBackPressureSystem_Session129(
                this.scene,
                this.world || { aiNodes: this.aiNodes, linkingSystem: this.linkingSystem },
                harmonicInfluenceSystem,
                this.aiNodes,
                this.linkingSystem,
                {
                    pressureZoneStart: 0.7,
                    pressureZoneEnd: 0.95,
                    pressureThickness: 1.2,
                    pressureGlowBase: 0.08,
                    reflectionPulseWidth: 0.15,
                    reflectionPulseOpacity: 0.18,
                    reflectionPulseLifetime: 0.8,
                    reflectionPulseSpeed: 1.2,
                    harmonyDamping: 0.6,
                    corruptionBoost: 1.4,
                    instabilitySpeedup: 0.8,
                    synergyElasticity: 0.7
                }
            );
            
            this.influenceReflection.setup();
            
            console.log('[main.js] InfluenceReflectionBackPressureSystem initialized ✓');
            console.log('  - Pressure zone buildup on resistant nodes');
            console.log('  - Reflection pulses traveling backward');
            console.log('  - Surface ripples on impact');
            console.log('  - State-modulated by harmony/corruption/instability');
        } catch (err) {
            console.warn('[main.js] InfluenceReflectionBackPressureSystem init error:', err);
        }
    }

    /**
     * Setup Standing Wave & Oscillation Trap (Session 130)
     * Visualizes energy trapped between opposing nodes forming standing waves
     */
    setupStandingWaveTrap() {
        try {
            // Initialize trap system with core world references
            this.standingWaveTrap = new StandingWaveOscillationTrapSystem_Session130(
                this.scene,
                this.world || { aiNodes: this.aiNodes, linkingSystem: this.linkingSystem },
                this.influenceReflection,  // Reflection system (required for detection)
                this.harmonicInfluencePropagation,  // Influence system (optional)
                this.aiNodes,
                this.linkingSystem,
                {
                    reflectionCountThreshold: 3,
                    detectionWindow: 1.5,
                    netFlowThreshold: 0.1,
                    phaseConsistencyThreshold: 0.7,
                    trapCenterOffset: 0.5,
                    trapRadiusBase: 0.15,
                    standingWaveAmplitude: 0.8,
                    beatFrequencyBase: 2.0,
                    harmonyDamping: 0.5,
                    corruptionStabilization: 0.7,
                    instabilityWobble: 0.4,
                    synergyClarity: 0.8,
                    dampingRate: 0.15,
                    breakthroughThreshold: 0.8,
                    collapseTriggerInstability: 0.85
                }
            );
            
            this.standingWaveTrap.setup();
            
            console.log('[main.js] StandingWaveOscillationTrapSystem initialized ✓');
            console.log('  - Detects standing wave conditions (reflection frequency + phase)');
            console.log('  - Creates oscillation trap zones between opposing nodes');
            console.log('  - Visualizes interference patterns and beat frequencies');
            console.log('  - Tracks resolution paths (damping, breakthrough, collapse)');
        } catch (err) {
            console.warn('[main.js] StandingWaveOscillationTrapSystem init error:', err);
        }
    }

    /**
     * Setup Standing Wave Visual Renderer (Session 131)
     * Renders standing wave meshes, antinode glows, and trap zones
     */
    setupStandingWaveRenderer() {
        try {
            // Initialize visual renderer with core world references
            this.standingWaveRenderer = new StandingWaveVisualRenderer_Session131(
                this.scene,
                this.standingWaveTrap,  // Trap system (provides state)
                this.linkingSystem,
                this.aiNodes,
                {
                    antinodeRadius: 0.25,
                    antinodeOpacityBase: 0.4,
                    antinodeGlowIntensity: 1.8,
                    antinodeLODDistance: 30,
                    
                    bandThickness: 0.05,
                    bandTransitionSmoothing: 0.3,
                    brightBandOpacity: 0.25,
                    dimBandOpacity: 0.08,
                    
                    trapZoneThickness: 0.1,
                    trapZoneOpacityBase: 0.15,
                    trapZoneGlowFactor: 0.8,
                    
                    haloPulseFrequency: 3.0,
                    haloPulseAmount: 0.15,
                    
                    dampingFadeRate: 0.5,
                    breakthroughAcceleration: 2.0,
                    collapseInwardRate: 0.3,
                    
                    maxAntinodeMeshes: 100,
                    maxTrapZoneMeshes: 30,
                    enableLOD: true
                }
            );
            
            this.standingWaveRenderer.setup();
            
            console.log('[main.js] StandingWaveVisualRenderer initialized ✓');
            console.log('  - Renders antinode glow meshes in trap zones');
            console.log('  - Applies interference band patterns to links');
            console.log('  - Animates node halo counter-pulsing');
            console.log('  - Handles resolution animations (damping, breakthrough, collapse)');
        } catch (err) {
            console.warn('[main.js] StandingWaveVisualRenderer init error:', err);
        }
    }

    /**
     * Setup Wave Interference Pattern System (Session 132)
     * Visualizes constructive/destructive interference from colliding reflections
     */
    setupWaveInterference() {
        try {
            // Initialize wave interference system
            this.waveInterference = new WaveInterferencePatternSystem_Session132(
                this.scene,
                this.influenceReflection,  // Reflection system (required)
                this.standingWaveTrap,     // Standing wave system (optional)
                this.linkingSystem,
                this.aiNodes,
                {
                    collisionWindowSeconds: 0.5,
                    pathProximityThreshold: 0.3,
                    phaseDifferenceThreshold: 0.2,
                    minWaveIntensity: 0.1,
                    
                    constructiveOpacity: 0.25,
                    constructiveGlow: 1.5,
                    constructiveAmplification: 1.8,
                    
                    destructiveOpacity: 0.08,
                    destructiveGlow: 0.3,
                    destructiveDamping: 0.5,
                    
                    beatFrequencyRange: [0.5, 4.0],
                    beatAmplification: 1.2,
                    beatFrequencySmoothing: 0.3,
                    
                    harmonyCancellation: 0.4,
                    corruptionAmplification: 0.6,
                    instabilityNoise: 0.2,
                    synergyClarity: 0.8,
                    
                    emergenceTime: 0.3,
                    peakDuration: 2.0,
                    dissipateTime: 1.5,
                    
                    maxInterferenceMeshes: 50,
                    maxConcurrentInterferences: 15,
                    enableLOD: true,
                    lodDistance: 35
                }
            );
            
            this.waveInterference.setup();
            
            console.log('[main.js] WaveInterferencePatternSystem initialized ✓');
            console.log('  - Detects wave collision points (converging paths)');
            console.log('  - Visualizes constructive interference (golden amplification)');
            console.log('  - Visualizes destructive interference (dark cancellation)');
            console.log('  - Animates beat frequency patterns from frequency differences');
            console.log('  - Modulated by harmony/corruption/instability/synergy');
        } catch (err) {
            console.warn('[main.js] WaveInterferencePatternSystem init error:', err);
        }
    }

    /**
     * Setup Resonance Rupture Visual System (Session 133)
     * Visualizes standing wave collapse and structural failure under pressure
     */
    setupResonanceRupture() {
        try {
            // Initialize resonance rupture system
            this.resonanceRupture = new ResonanceRuptureVisualSystem_Session133(
                this.scene,
                this.standingWaveTrap,     // Trap system (required)
                this.influenceReflection,  // Reflection system (optional)
                this.linkingSystem,
                this.aiNodes,
                {
                    stressAccumulationRate: 0.3,
                    stressRuptureThreshold: 0.85,
                    corruptionRuptureBoost: 0.4,
                    instabilityRuptureBoost: 0.3,
                    phaseDivergenceThreshold: 0.6,
                    amplitudeRuptureThreshold: 0.9,
                    minTrapLifetime: 1.0,
                    
                    stressIndicatorOpacity: 0.3,
                    stressCompressionFactor: 1.3,
                    stressFrequencyIncrease: 1.5,
                    
                    ruptureDuration: 0.15,
                    ruptureBurst: 0.8,
                    ruptureBurstWidth: 0.2,
                    ruptureBurstGlow: 2.5,
                    
                    propagationSpeed: 2.0,
                    propagationDistance: 3.0,
                    propagationDamping: 0.85,
                    propagationPaths: 2,
                    
                    scarOpacity: 0.15,
                    scarDuration: 60.0,
                    scarDeformation: 0.1,
                    scarFrequencyDamping: 0.4,
                    
                    haloDestabilizationAmount: 0.3,
                    haloDestabilizationDuration: 0.5,
                    haloRecoveryRate: 0.8,
                    
                    harmonyRuputrePrevention: 0.6,
                    corruptionRuptureAcceleration: 0.4,
                    instabilityRuptureEarlier: 0.5,
                    synergyRuptureClarity: 0.7,
                    
                    maxConcurrentRuptures: 5,
                    maxRupturePropagations: 20,
                    maxResnonanceScarsMeshes: 20,
                    enableLOD: true,
                    lodDistance: 40
                }
            );
            
            this.resonanceRupture.setup();
            
            console.log('[main.js] ResonanceRuptureVisualSystem initialized ✓');
            console.log('  - Monitors standing wave stress accumulation');
            console.log('  - Pre-rupture stress zones with visual tension');
            console.log('  - Rupture burst events at convergence points');
            console.log('  - Energy propagation along network paths');
            console.log('  - Resonance scars (persistent visual memory)');
            console.log('  - Node halo destabilization and recovery');
            console.log('  - State-modulated by harmony/corruption/synergy');
        } catch (err) {
            console.warn('[main.js] ResonanceRuptureVisualSystem init error:', err);
        }
    }

    /**
     * Setup Harmonic Recovery Visual System (Session 138)
     * High-level visual recovery representing network repair after rupture
     */
    setupHarmonicRecovery() {
        try {
            this.harmonicRecovery = new HarmonicRecoveryVisualSystem_Session138(
                this.scene,
                this.resonanceRupture,
                this.healingParticles, // Can be null if not yet initialized, but setupHarmonicHealingSystem is called later? 
                                       // No, healingParticles is initialized in setupHealingParticleSystem which is called by setupHarmonicHealingSystem?
                                       // I need to ensure healingParticles exists.
                this.linkingSystem
            );
            
            console.log('[main.js] HarmonicRecoveryVisualSystem initialized ✓');
            console.log('  - Monitors rupture completion');
            console.log('  - Spawns Coherence Waves from healed zones');
            console.log('  - Applies Link Re-Stitching effects');
            console.log('  - Creates Node Recovery Halos');
        } catch (err) {
            console.warn('[main.js] HarmonicRecoveryVisualSystem init error:', err);
        }
    }

    /**
     * Setup Harmonic Healing System (Sessions 134-136)
     * "Golden Wave" visuals + Audio + Particles
     */
    setupHarmonicHealingSystem() {
        try {
            // 1. Audio System (Session 135)
            if (!this.harmonicAudio) {
                // Check if constructor signature matches (scene, linking, nodes)
                this.harmonicAudio = new HarmonicAudioReactivitySystem_Session135(
                    this.scene,
                    this.linkingSystem,
                    this.aiNodes
                );
                console.log('[main.js] HarmonicAudioReactivitySystem initialized ✓');
            }

            // 2. Healing Particle System (Session 136)
            if (!this.healingParticles) {
                this.healingParticles = new HealingParticleSystem_Session136(
                    this.scene,
                    this.resonanceRupture, // Hooks into rupture system for scars
                    this.harmonicAudio,    // Audio System (Session 135)
                    { maxParticles: 5000 }
                );
                console.log('[main.js] HealingParticleSystem initialized ✓');
            }

            // 3. Harmonic Healing Visual System (Session 134 - The Logic)
            if (!this.harmonicHealing) {
                this.harmonicHealing = new HarmonicHealingVisualSystem_Session134(
                    this.scene,
                    this.linkingSystem,
                    this.healingParticles // Wires logic to visuals
                );
                console.log('[main.js] HarmonicHealingVisualSystem initialized (Golden Waves) ✓');
            }

        } catch (err) {
            console.warn('[main.js] Harmonic Healing System initialization failed:', err);
        }
    }

    /**
     * Setup Regional Equilibrium Field System
     * Visualizes territorial equilibrium and long-term power balance shifts
     */
    setupRegionalEquilibrium() {
        try {
            this.regionalEquilibrium = new RegionalEquilibriumFieldSystem(
                this.scene,
                this.aiNodes,
                this.linkingSystem
            );
            console.log('[main.js] RegionalEquilibriumFieldSystem initialized ✓');
        } catch (err) {
            console.warn('[main.js] RegionalEquilibriumFieldSystem init error:', err);
        }
    }

    /**
     * Setup Cascading Rupture & Critical Node Failure Systems (Session 139+)
     * Hybrid visual + mechanical systems for network collapse propagation
     * DISABLED BY DEFAULT - Enable via console: game.cascadingRuptures.enable()
     */
    setupCascadingRuptureAndFailure() {
        try {
            // Initialize cascading rupture system (visual propagation)
            this.cascadingRuptures = new CascadingRuptureSystem(
                this.scene,
                this.aiNodes,
                this.linkingSystem,
                this.regionalEquilibrium
            );

            // Initialize critical node failure system (link severing)
            this.criticalNodeFailure = new CriticalNodeFailureSystem(
                this.scene,
                this.aiNodes,
                this.linkingSystem
            );

            // Wire cascade system to trigger node failure
            this.cascadingRuptures.onNodeCritical = (node) => {
                if (this.criticalNodeFailure && this.criticalNodeFailure.enabled) {
                    this.criticalNodeFailure.markNodeApproachingCritical(node);
                }
            };

            // Wire failure system to record events in cascade history
            this.criticalNodeFailure.onLinksSevered = (node, linkIds) => {
                if (this.cascadingRuptures && this.cascadingRuptures.enabled) {
                    // Link severing can amplify local cascade energy
                    console.log(`[CascadingRupture] Node failure detected, ${linkIds.length} links severed`);
                }
            };

            // Setup console API
            setupCascadeSystemConsoleAPI(this);

            console.log('[main.js] CascadingRuptureSystem & CriticalNodeFailureSystem initialized ✓');
            console.log('[main.js] ⚠️  Both systems DISABLED by default for safety');
            console.log('[main.js] Enable via console:');
            console.log('[main.js]   game.enableBothCascadeSystems()');
            console.log('[main.js] Help: game.cascadeHelp()');
        } catch (err) {
            console.warn('[main.js] Cascading rupture/failure init error:', err);
        }
    }

    /**
     * Setup Link Semantic Pictogram System — Enhanced with Fusion (Session 139+)
     * Multi-layer semantic visual language with morphing, depth, flow intelligence, and glyph fusion
     */
    setupLinkSemanticPictograms() {
        try {
            this.linkSemanticPictograms = new LinkSemanticPictogramSystem_WithFusion(
                this.scene,
                this.linkingSystem,
                this.camera
            );
            console.log('[main.js] LinkSemanticPictogramSystem_WithFusion initialized ✓');
            console.log('[main.js] Features: 3-layer stack, morphing, depth/parallax, flow intelligence, glyph fusion');
            console.log('[main.js] Fusion enabled by default — disable with: game.disableFusion()');
        } catch (err) {
            console.warn('[main.js] LinkSemanticPictogramSystem init error:', err);
        }
    }

    /**
     * Setup Harmonic Resonance Feedback System (Session 140+)
     * Composite glyphs emit subtle resonance fields influencing nearby link motion
     * Closed visual feedback loop: meaning shapes motion
     */
    setupHarmonicResonanceFeedback() {
        try {
            this.harmonicResonance = new HarmonicResonanceFeedbackSystem(this.scene);
            setupHarmonicResonanceConsoleAPI(this, this.harmonicResonance);
            console.log('[main.js] HarmonicResonanceFeedbackSystem initialized ✓');
            console.log('[main.js] Features: resonance fields, phase alignment, pictogram influence');
        } catch (err) {
            console.warn('[main.js] HarmonicResonanceFeedbackSystem init error:', err);
        }
    }

    /**
     * Setup Resonance Echo Trail System (Session 140+)
     * Harmonic afterimages as temporal memory of composite glyph movement
     * Stationary echo trails fade quietly, reinforcing continuity
     */
    setupResonanceEchoTrails() {
        try {
            this.resonanceEchoTrails = new ResonanceEchoTrailSystem(this.scene);
            setupResonanceEchoConsoleAPI(this, this.resonanceEchoTrails);
            console.log('[main.js] ResonanceEchoTrailSystem initialized ✓');
            console.log('[main.js] Features: echo pool, temporal decay, harmony modulation');
        } catch (err) {
            console.warn('[main.js] ResonanceEchoTrailSystem init error:', err);
        }
    }

    /**
     * Setup Harmonic Topology Learning System (Session 140+)
     * Visualizes long-term network learning through topology evolution
     * Shows how repeated resonance, rupture, and fusion reshape flow patterns
     */
    setupHarmonicTopologyLearning() {
        try {
            this.harmonicTopology = new HarmonicTopologyLearningSystem(this.scene);
            setupHarmonicTopologyConsoleAPI(this, this.harmonicTopology);
            console.log('[main.js] HarmonicTopologyLearningSystem initialized ✓');
            console.log('[main.js] Features: flow bias, path reinforcement, scar memory, hub maturation');
        } catch (err) {
            console.warn('[main.js] HarmonicTopologyLearningSystem init error:', err);
        }
    }

    /**
     * Setup Topology Bias Visualization Layer (Session 140+)
     * Renders topology bias vectors and flow fields as dedicated visual layer
     * Makes learned space perception visible through subtle directional hints
     */
    setupTopologyBiasVisualization() {
        try {
            if (!this.harmonicTopology) {
                console.warn('[main.js] Topology not ready, skipping bias visualization');
                return;
            }

            this.topologyViz = new TopologyBiasVisualizationLayer(
                this.scene,
                this.camera,
                this.harmonicTopology
            );
            
            setupTopologyBiasVisualizationConsoleAPI(this);
            
            console.log('[main.js] TopologyBiasVisualizationLayer initialized ✓');
            console.log('[main.js] Features: bias vectors, flow fields, influence interaction');
            console.log('[main.js] Debug: game.toggleTopologyBiasVectorsDebug(), game.toggleTopologyFlowFieldsDebug()');
        } catch (err) {
            console.warn('[main.js] TopologyBiasVisualizationLayer init error:', err);
        }
    }

    /**
     * Setup Procedural Harmonic Glyph Generator (Session 140+ Polish)
     * Generates emergent visual language from topology learning history
     * Creates unique procedural glyphs representing learned network identity
     */
    setupProceduralHarmonicGlyphs() {
        try {
            if (!this.harmonicTopology) {
                console.warn('[main.js] Topology not ready, skipping procedural glyphs');
                return;
            }

            this.proceduralGlyphGenerator = new ProceduralHarmonicGlyphGenerator(
                this.scene,
                this.harmonicTopology
            );
            
            setupProceduralGlyphConsoleAPI(this);
            
            console.log('[main.js] ProceduralHarmonicGlyphGenerator initialized ✓');
            console.log('[main.js] Features: emergent symbols, topology-derived glyphs, region identity');
            console.log('[main.js] Debug: game.toggleProceduralGlyphDebug(), game.proceduralGlyphStatus()');
        } catch (err) {
            console.warn('[main.js] ProceduralHarmonicGlyphGenerator init error:', err);
        }
    }

    /**
     * Setup Regional Harmonic Cycle Controller (Session 140+ Polish - Animation)
     * Manages harmonic activity cycles for regions
     * Drives subtle glyph animation through cycle-based modulation
     */
    setupRegionalHarmonicCycles() {
        try {
            if (!this.harmonicTopology) {
                console.warn('[main.js] Topology not ready, skipping harmonic cycles');
                return;
            }

            this.harmonicCycleController = new RegionalHarmonicCycleController(
                this.harmonicTopology
            );
            
            setupRegionalHarmonicCycleConsoleAPI(this);
            
            console.log('[main.js] RegionalHarmonicCycleController initialized ✓');
            console.log('[main.js] Features: regional cycles, phase-driven animation, breathing glyphs');
            console.log('[main.js] Debug: game.toggleGlyphCycleDebug(), game.glyphCycleStatus()');
        } catch (err) {
            console.warn('[main.js] RegionalHarmonicCycleController init error:', err);
        }
    }

    /**
     * Setup Glyph Animation Modulator (Session 140+ Polish - Animation)
     * Applies harmonic cycle animations to procedural glyphs
     * Makes glyphs breathe with regional harmonic activity
     */
    setupGlyphAnimationModulator() {
        try {
            if (!this.harmonicCycleController) {
                console.warn('[main.js] Cycle controller not ready, skipping glyph animation');
                return;
            }

            this.glyphAnimationModulator = new GlyphAnimationModulator(
                this.harmonicCycleController
            );
            
            setupGlyphAnimationConsoleAPI(this);
            
            console.log('[main.js] GlyphAnimationModulator initialized ✓');
            console.log('[main.js] Features: cycle-driven animation, subtle breathing, regional coherence');
            console.log('[main.js] Debug: game.toggleGlyphAnimationDebug(), game.glyphAnimationStatus()');
        } catch (err) {
            console.warn('[main.js] GlyphAnimationModulator init error:', err);
        }
    }

    /**
     * Setup Composite Glyph Resonance Feedback (Session 140+ Visual-Only Feedback)
     * Makes composite glyph resonance perceptible through subtle spatial & temporal cues
     * Read-only visual adapter: no gameplay logic, pure perception
     */
    setupCompositeGlyphResonanceFeedback() {
        try {
            this.compositeResonanceFeedback = new CompositeGlyphResonanceFeedback();
            
            // Initialize with core systems
            this.compositeResonanceFeedback.initialize(
                this.scene,
                this.camera,
                this.network || { aiNodes: this.aiNodes, linkingSystem: this.linkingSystem }
            );
            
            console.log('[main.js] CompositeGlyphResonanceFeedback initialized ✓');
            console.log('[main.js] Features: spatial coherence, temporal phase alignment, boundary softening');
            console.log('[main.js] Lifetime: visual decay transitions (stable → fading → dissolving → cleanup)');
            console.log('[main.js] Reabsorption: source glyphs phase-converge during dissolution');
            console.log('[main.js] Optional: Glyph animation influence (disabled by default)');
            console.log('[main.js] Debug: game.toggleCompositeResonanceDebug(), game.compositeResonanceStatus()');
            console.log('[main.js] Decay: game.compositeGlyphDecayStatus()');
            console.log('[main.js] Optional: game.enableGlyphResonanceInfluence(), game.disableGlyphResonanceInfluence()');
        } catch (err) {
            console.warn('[main.js] CompositeGlyphResonanceFeedback init error:', err);
        }
    }

    /**
     * Setup Competition & Dominance Adapter (Session 113+)
     * Specialized nodes compete for territorial influence — pure visual storytelling
     */
    setupCompetitionDominance() {
        try {
            this.competitionDominance = new CompetitionDominanceAdapter_v1({
                dominanceStrength: 0.7,
                contestationStrength: 0.5,
                regionHopRadius: 2,
            });

            setupCompetitionDominanceIntegration(this.competitionDominance, this);
            console.log('[main.js] CompetitionDominanceAdapter initialized ✓');
        } catch (err) {
            console.warn('[main.js] CompetitionDominanceAdapter init error:', err);
        }
    }

    /**
     * Setup Selection Core 3.4
     * UNIFIED SELECTION KERNEL - Single source of truth for all selection
     */
    setupSelectionCore() {
        this.selectionCore = new NodeSelectionCore3_4();

        // Hook audio feedback to selection events
        this.selectionCore.onSelectCallbacks.push(() => {
            if (this.audioSystem && this.audioSystem.initialized) {
                this.audioSystem.playSelection();
            }
            this.semanticBus.emit('node.selection', { type: 'select' }, { priority: this.semanticBus.priority.CRITICAL });
            this.setHudDirty('coreMetrics');
            this.setHudDirty('nodeInspector');
        });
        
        this.selectionCore.onDeselectCallbacks.push(() => {
            if (this.audioSystem && this.audioSystem.initialized) {
                this.audioSystem.playDeselection();
            }
            this.semanticBus.emit('node.selection', { type: 'deselect' }, { priority: this.semanticBus.priority.CRITICAL });
            this.setHudDirty('coreMetrics');
            this.setHudDirty('nodeInspector');
        });

        console.log('✓ Selection Core 3.4 initialized (single source of truth)');
        console.log('✓ Audio feedback hooked to selection events');
    }

    /**
     * Setup Selected Node HUD
     * Displays selected node name and type in top-right corner
     */
    setupSelectedNodeHUD() {
        const selectedHUD = getSelectedHUD();
        console.log('[main.js] setupSelectedNodeHUD called - storing HUD reference');
        this.selectedHUD = selectedHUD;
        
        console.log('[main.js] setupSelectedNodeHUD: linking system is:', this.linkingSystem ? 'SET' : 'NULL');
        if (this.linkingSystem) {
            selectedHUD.setLinkingSystem(this.linkingSystem);
            console.log('[main.js] ✓ HUD connected to existing linkingSystem');
        } else {
            console.log('[main.js] setupSelectedNodeHUD: linkingSystem will be created in createAINodes()');
        }

        console.log('✓ Selected Node HUD initialized (top-right corner)');
    }

    /**
     * Setup Node Linking 2.1 (Unified Core Edition)
     * Simplified interaction layer powered by SelectionCore3_4
     */
    setupNodeLinking2_1() {
        this.nodeLinking = new NodeLinking2_1(
            this.scene,
            this.camera,
            this.renderer,
            this.selectionCore,
            this.linkingSystem
        );

        console.log('✓ Node Linking 2.1 (Core Edition) initialized (unified interaction)');
    }

    /**
     * Setup Node Linking 2.2 (Unified Mouse Logic + Unlinking)
     * UI 3.5 FINAL IMPLEMENTATION - LMB/RMB behavior + safe unlinking
     */
    setupNodeLinking2_2() {
        // Collect all nodes for unlinking checks
        const allNodes = [];
        this.scene.traverse(obj => {
            if (obj.userData && obj.userData.isNode) {
                allNodes.push(obj);
            }
        });

        this.nodeLinking = new NodeLinking2_2(
            this.scene,
            this.camera,
            this.renderer,
            this.selectionCore,
            this.linkingSystem,
            allNodes
        );

        console.log('✓ Node Linking 2.2 (Unified Mouse Logic) initialized (LMB/RMB + unlinking)');
    }

    /**
     * Setup Primary Node System 3.7
     * Double-click primary node selection + visual aura + linking source
     */
    setupPrimaryNodeSystem() {
        // Create primary node aura (visual feedback)
        this.primaryNodeAura = new UIPrimaryNodeAura3_7(this.scene, this.selectionCore);

        // Create primary node top bar (HUD display)
        this.primaryNodeTopBar = new UIPrimaryNodeTopBar3_7(this.selectionCore);

        // Subscribe to primary node changes to sync visuals
        if (this.selectionCore) {
            this.selectionCore.onPrimaryNodeChanged((oldPrimary, newPrimary) => {
                if (newPrimary) {
                    if (this.primaryNodeAura) {
                        this.primaryNodeAura.showAura(newPrimary);
                    }
                    if (this.primaryNodeTopBar) {
                        this.primaryNodeTopBar.show(newPrimary);
                    }
                } else {
                    if (this.primaryNodeAura) {
                        this.primaryNodeAura.hideAura();
                    }
                    if (this.primaryNodeTopBar) {
                        this.primaryNodeTopBar.hide();
                    }
                }
            });
        }

        // Switch to NodeLinking2_3 (double-click enabled)
        const allNodes = [];
        this.scene.traverse(obj => {
            if (obj.userData && obj.userData.isNode) {
                allNodes.push(obj);
            }
        });

        this.nodeLinking = new NodeLinking2_3(
            this.scene,
            this.camera,
            this.renderer,
            this.selectionCore,
            this.linkingSystem,
            allNodes
        );

        console.log("✓ NodeLinking2_3 confirmed active");
        console.log('✓ Primary Node System 3.7 initialized (double-click + aura + 2.3 linking)');
    }

    /**
     * Setup UI 3.1/3.2/3.3/3.4 Component Wiring
     * Connect all UI systems with selection core
     */
    setupUIWiring3_4() {
        // Set selection core reference for top bar
        // Wire up NodeLinking 2.1 with all UI components
        if (this.nodeLinking) {
            this.nodeLinking.setUIReferences(
                null,
                this.nodeInspectPanel,
                this.selectedNodeBadge,
                this.selectedNodeHighlight,
                this.selectedNodeLabel
            );

            // Set core reference
            this.nodeLinking.setSelectionCore(this.selectionCore);
        }
    }

    /**
     * Setup UI 3.1/3.2/3.3/3.4/3.5/3.7 Component Wiring
     * Connect all systems with unified selection core + 2.3 linking (primary node enabled)
     */
    setupUIWiring3_7() {
        // Set selection core reference for top bar
        // Wire up NodeLinking 2.3 (3.7) with all UI components
        if (this.nodeLinking) {
            this.nodeLinking.setUIReferences(
                null,
                this.nodeInspectPanel,
                this.selectedNodeBadge,
                this.selectedNodeHighlight,
                this.selectedNodeLabel,
                this.primaryNodeAura,
                this.primaryNodeTopBar
            );
            this.nodeLinking.setSelectionCore(this.selectionCore);

            // Set all nodes for unlinking checks
            const allNodes = [];
            this.scene.traverse(obj => {
                if (obj.userData && obj.userData.isNode) {
                    allNodes.push(obj);
                }
            });
            this.nodeLinking.setAllNodes(allNodes);
        }
    }

    /**
     * Setup UI 3.1/3.2/3.3 Component Wiring (Legacy - for compatibility)
     * Connect all UI systems together after initialization
     */
    setupUIWiring() {
        // Wire up NodeLinking 2.1 with all UI components (upgraded for 3.3)
        if (this.nodeLinking) {
            this.nodeLinking.setUIReferences(
                this.nodeInspectPanel,
                this.selectedNodeBadge,
                this.selectedNodeHighlight,
                this.selectedNodeLabel  // New: floating label
            );
        }
    }

    /**
     * Setup Synergy Pulse Visuals v1.0
     * Simple breathing pulse effect on nodes when synergy > 0.6
     */
    setupSynergyPulseVisuals() {
        this.synergyPulseVisuals = new SynergyPulseVisuals_v1();
        
        // Register all current nodes
        if (this.aiNodes && this.aiNodes.nodes) {
            this.synergyPulseVisuals.registerNodes(this.aiNodes.nodes);
        }
        
        validateSynergyPulseVisuals();
        console.log('✓ Synergy Pulse Visuals v1.0 initialized');
    }
    
    /**
     * Setup Harmonic Resonance Coupling v1.0
     * Synergy-driven visual coupling between linked nodes
     * Creates particle flow and phase-locked shimmer effects
     */
    setupHarmonicResonanceCoupling() {
        this.harmonicResonanceCoupling = new HarmonicResonanceCoupling_v1(this.scene, this.linkingSystem);
        
        // Register all existing links
        if (this.linkingSystem && this.linkingSystem.links) {
            for (const link of this.linkingSystem.links) {
                this.harmonicResonanceCoupling.registerLink(link);
            }
        }
        
        // Register callback for new link creation
        if (this.linkingSystem && this.linkingSystem.onLinkCreatedCallbacks) {
            this.linkingSystem.onLinkCreatedCallbacks.push((link) => {
                if (this.harmonicResonanceCoupling) {
                    this.harmonicResonanceCoupling.registerLink(link);
                }
            });
        }
        
        // Register callback for link removal
        if (this.linkingSystem && this.linkingSystem.onLinkRemovedCallbacks) {
            this.linkingSystem.onLinkRemovedCallbacks.push((link) => {
                if (this.harmonicResonanceCoupling) {
                    this.harmonicResonanceCoupling.unregisterLink(link);
                }
            });
        }
        
        console.log('✓ Harmonic Resonance Coupling v1.0 initialized');
    }
    
    /**
     * Setup Harmonic Hub Aura System (Session 126)
     * Creates shared resonance fields between nearby harmonic hubs
     */
    setupHarmonicHubAuraSystem() {
        try {
            this.harmonicHubAuraSystem = new HarmonicHubAuraSystem_Session126(
                this.scene,
                this.aiNodes,
                this.nodeAuraSystem,
                this.harmonicResonanceCoupling,
                {
                    minLinksForHub: 2,
                    harmonyThreshold: 0.3,
                    maxHubDistance: 12.0,
                    fieldMinRadius: 0.8,
                    fieldRadiusSynergyMult: 0.6,
                    fieldMaxRadius: 6.0,
                }
            );
            console.log('✓ Harmonic Hub Aura System (Session 126) initialized');
        } catch (err) {
            console.warn('⚠ Harmonic Hub Aura System initialization failed:', err);
        }
    }
    
    /**
     * Setup Harmonic Influence Propagation System (Session 127)
     * Renders flowing harmonic influence from hubs through network
     */
    setupHarmonicInfluencePropagation() {
        try {
            this.harmonicInfluencePropagation = new HarmonicInfluencePropagationSystem_Session127(
                this.scene,
                this.aiNodes,
                this.harmonicHubAuraSystem,
                this.nodeAuraSystem,
                {
                    enabled: true,
                    propagationInterval: 2.0,
                    propagationSpeed: 3.0,
                    nodeAuraOpacityBase: 0.2,
                    linkFlowOpacity: 0.3,
                    driftSpeed: 0.3,
                    oscillationAmplitude: 0.15,
                }
            );
            console.log('✓ Harmonic Influence Propagation System (Session 127) initialized');
        } catch (err) {
            console.warn('⚠ Harmonic Influence Propagation initialization failed:', err);
        }
    }
    
    /**
     * Setup Harmonic Cascade Amplification System (Session 145)
     * Hub-to-hub reinforcement where nearby hubs amplify each other's resonance
     */
    setupHarmonicCascadeAmplification() {
        try {
            this.harmonicCascadeAmplification = new HarmonicCascadeAmplification_Session145(
                this.scene,
                this.aiNodes,
                this.harmonicHubAuraSystem,
                this.harmonicResonanceCoupling,
                {
                    enabled: false,  // Currently disabled (skeleton)
                    debugMode: false,
                }
            );
            console.log('✓ Harmonic Cascade Amplification System (Session 145) initialized (skeleton)');
            
            // Setup console API for debugging
            setupCascadeConsoleAPI(window, this.harmonicCascadeAmplification);
        } catch (err) {
            console.warn('⚠ Harmonic Cascade Amplification initialization failed:', err);
        }
    }
    
    /**
     * Setup Visual Echo Trails v1.0
     * Shader-level echo trail enhancement for link pulses
     * Pure additive visual effect, no gameplay impact
     */
    setupVisualEchoTrails() {
        // Initialize shader system
        this.echoTrailsSystem = new VisualEchoTrails_v1();
        
        // Initialize integration layer
        this.echoTrailsIntegration = setupVisualEchoTrailsIntegration(
            this,
            this.echoTrailsSystem
        );
        
        console.log('✓ Visual Echo Trails v1.0 initialized');
    }
    
    /**
     * Setup Visual Network Time Elasticity v1.0
     * Visual-only "time reversal" effect when avgSynergy > 0.85 for 5+ seconds
     */
    setupVisualNetworkTimeElasticity() {
        this.visualNetworkTimeElasticity = new VisualNetworkTimeElasticity_v1();
        
        validateVisualNetworkTimeElasticity();
        console.log('✓ Visual Network Time Elasticity v1.0 initialized');
    }

    /**
     * Setup debug console commands
     */
    /**
     * Setup Link Micro-Impulses
     * Event-driven electrical nervous responses for links
     */
    setupLinkMicroImpulses() {
        try {
            const setup = setupLinkMicroImpulseIntegration(this);
            this.microImpulseSetup = setup;
            console.log('✅ [main.js] Link Micro-Impulse system initialized');
        } catch (err) {
            console.warn('⚠ Link Micro-Impulse setup error:', err);
        }
    }

    /**
     * Setup Pulse Intersection Impulses
     * Neural firing on pulse wave + link geometry contact
     */
    setupPulseIntersectionImpulses() {
        try {
            const setup = setupPulseIntersectionIntegration(this);
            this.pulseIntersectionSetup = setup;
            console.log('✅ [main.js] Pulse Intersection Impulse system initialized');
        } catch (err) {
            console.warn('⚠ Pulse Intersection Impulse setup error:', err);
        }
    }

    setupPulseWaveSystemBridge() {
        try {
            const bridge = setupPulseWaveSystemBridgeIntegration(this);
            this.pulseWaveSystemBridge = bridge;
            console.log('✅ [main.js] Pulse Wave System Bridge initialized');
        } catch (err) {
            console.warn('⚠ Pulse Wave System Bridge setup error:', err);
        }
    }

    setupPulseBoundaryInteraction() {
        try {
            const adapter = setupPulseBoundaryInteractionIntegration(this);
            this.pulseBoundaryInteractionAdapter = adapter;
            console.log('✅ [main.js] Pulse Boundary Interaction Adapter initialized');
        } catch (err) {
            console.warn('⚠ Pulse Boundary Interaction setup error:', err);
        }
    }

    setupSynapticGating() {
        try {
            const adapter = setupSynapticGatingIntegration(this);
            this.synapticGatingAdapter = adapter;
            console.log('✅ [main.js] Synaptic Gating Adapter initialized');
        } catch (err) {
            console.warn('⚠ Synaptic Gating setup error:', err);
        }
    }

    setupDebugCommands() {
        // Store game reference for global access
        window.atoma = this;

        // Recursive Glyph Messaging 4.0 commands
        window.toggleRecursiveChains = () => {
            if (!window.atoma.recursiveGlyphMessaging) {
                console.warn('Recursive Glyph Messaging not initialized');
                return;
            }
            const enabled = window.atoma.recursiveGlyphMessaging.isEnabled();
            window.atoma.recursiveGlyphMessaging.setEnabled(!enabled);
            console.log(`✓ Recursive chains ${!enabled ? 'ENABLED' : 'DISABLED'}`);
        };

        window.debugRecursiveMessages = () => {
            if (!window.atoma.recursiveGlyphMessaging) {
                console.warn('Recursive Glyph Messaging not initialized');
                return;
            }
            window.atoma.recursiveGlyphMessaging.printStatusReport();
            const stats = window.atoma.recursiveGlyphMessaging.getStats();
            console.group('📊 Recursive Messaging Stats');
            console.table(stats);
            console.groupEnd();
        };

        window.clearRecursiveGlyphs = () => {
            if (!window.atoma.recursiveGlyphMessaging) {
                console.warn('Recursive Glyph Messaging not initialized');
                return;
            }
            window.atoma.recursiveGlyphMessaging.clearAllChains();
            console.log('✓ All recursive chains cleared');
        };

        // Emergent Thought Storms 5.0 commands
        window.toggleThoughtStorms = () => {
            if (!window.atoma.emergentThoughtStorms) {
                console.warn('Emergent Thought Storms not initialized');
                return;
            }
            const enabled = window.atoma.emergentThoughtStorms.isEnabled();
            window.atoma.emergentThoughtStorms.setEnabled(!enabled);
            console.log(`✓ Thought storms ${!enabled ? 'ENABLED' : 'DISABLED'}`);
        };

        window.debugThoughtStorms = () => {
            if (!window.atoma.emergentThoughtStorms) {
                console.warn('Emergent Thought Storms not initialized');
                return;
            }
            window.atoma.emergentThoughtStorms.printStatusReport();
            const stats = window.atoma.emergentThoughtStorms.getStats();
            console.group('🌪️ Thought Storms Stats');
            console.table(stats);
            console.groupEnd();
        };

        window.clearThoughtStorms = () => {
            if (!window.atoma.emergentThoughtStorms) {
                console.warn('Emergent Thought Storms not initialized');
                return;
            }
            window.atoma.emergentThoughtStorms.clearAllStorms();
            console.log('✓ All thought storms cleared');
        };

        window.triggerStormDemo = (stormType = 'coherence') => {
            if (!window.atoma.emergentThoughtStorms || !window.atoma.player) {
                console.warn('Thought Storms or Player not initialized');
                return;
            }
            const types = ['coherence', 'chaotic', 'corruption', 'ascended', 'balanced'];
            const type = types.includes(stormType) ? stormType : 'balanced';
            window.atoma.emergentThoughtStorms.triggerStorm(type, window.atoma.player);
            console.log(`✓ Triggered ${type} storm demo`);
        };

        // AI Narrative Patterns 6.0 commands
        window.toggleNarrativePatterns = () => {
            if (!window.atoma.narrativePatterns) {
                console.warn('AI Narrative Patterns not initialized');
                return;
            }
            window.atoma.narrativePatterns.enabled = !window.atoma.narrativePatterns.enabled;
            console.log(`✓ Narrative patterns ${window.atoma.narrativePatterns.enabled ? 'ENABLED' : 'DISABLED'}`);
        };

        window.debugNarrativePatterns = () => {
            if (!window.atoma.narrativePatterns) {
                console.warn('AI Narrative Patterns not initialized');
                return;
            }
            window.atoma.narrativePatterns.debugNarratives();
        };

        window.resetNarrativePatterns = () => {
            if (!window.atoma.narrativePatterns) {
                console.warn('AI Narrative Patterns not initialized');
                return;
            }
            window.atoma.narrativePatterns.resetNarratives();
        };

        console.log('✓ Debug commands available:');
        console.log('  - toggleRecursiveChains()');
        console.log('  - debugRecursiveMessages()');
        console.log('  - clearRecursiveGlyphs()');
        console.log('  - toggleThoughtStorms()');
        console.log('  - debugThoughtStorms()');
        console.log('  - clearThoughtStorms()');
        console.log('  - triggerStormDemo(type)');
        console.log('  - toggleNarrativePatterns()');
        console.log('  - debugNarrativePatterns()');
        console.log('  - resetNarrativePatterns()');
        console.log('✓ Extreme Shader Test Suite commands available:');
        console.log('  - debugExtremeShaders() — Run full consistency check');
        console.log('  - enableExtremeShaderDiagnostics() — Enable per-frame validation');
        console.log('  - disableExtremeShaderDiagnostics() — Disable per-frame validation');
        console.log('  - enableExtremeShaderDebugVisuals() — Show debug overlays on nodes');
        console.log('  - disableExtremeShaderDebugVisuals() — Hide debug overlays');
        console.log('  - printExtremeShaderSummary() — Print TL;DR status');
        console.log('✓ New Node Categories commands available:');
        console.log('  - printNewNodeCategoriesStatus() — Print category statistics');
        console.log('  - applyMythicNodeVisuals(node) — Apply Mythic visuals to node');
        console.log('  - applyPrimeNodeVisuals(node) — Apply Prime visuals to node');
        console.log('  - applyErrorNodeVisuals(node) — Apply Error visuals to node');
        console.log('✓ New Node Category Visuals commands available:');
        console.log('  - window.visuals — Access module directly');
        console.log('  - window.visuals.listNewNodeTypes() — List all categories');
        console.log('  - window.visuals.preview("mythic") — Preview category visuals');
        console.log('  - window.visuals.preview("prime")');
        console.log('  - window.visuals.preview("error")');
        console.log('  - window.visuals.status() — Print visual system status');
        console.log('✓ Extreme Link Visual Pack 3.0 commands available:');
        console.log('  - window.extremeLinks — Access module directly');
        console.log('  - window.extremeLinks.enable() / disable()');
        console.log('  - window.extremeLinks.setGlyphDensity(multiplier)');
        console.log('  - window.extremeLinks.setGlobalBrightness(value)');
        console.log('  - window.extremeLinks.printStats()');
        console.log('  - window.extremeLinks.printConfig()');

        // ========== EXTENDED SPAWN SYSTEM 1.0 COMMANDS ==========
        console.log('✓ Extended Spawn System 1.0 commands available:');
        console.log('  - spawn.mythic() — Spawn ultra-rare MYTHIC node (0.5-1.5%)');
        console.log('  - spawn.prime() — Spawn rare PRIME node (2-3%)');
        console.log('  - spawn.error() — Spawn unstable ERROR node (0.5-1.5%)');
        console.log('  - spawn.extreme() — Spawn EXTREME archetype (4-6%)');
        console.log('  - spawn.archetype(name) — Spawn specific archetype');
        console.log('  - spawn.stats() — Print archetype statistics');
        console.log('  - spawn.list() — List all 49 archetypes');
        console.log('  - spawn.weights() — Show spawn weight distribution');

        // Setup extended spawn system console API
        window.spawn = {
            mythic: () => {
                if (window.game && window.game.aiNodes) {
                    const node = window.game.aiNodes.spawnMythicNode();
                    console.log(`✓ MYTHIC node spawned at (${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}, ${node.position.z.toFixed(1)})`);
                }
            },

            prime: () => {
                if (window.game && window.game.aiNodes) {
                    const node = window.game.aiNodes.spawnPrimeNode();
                    console.log(`✓ PRIME node spawned at (${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}, ${node.position.z.toFixed(1)})`);
                }
            },

            error: () => {
                if (window.game && window.game.aiNodes) {
                    const node = window.game.aiNodes.spawnErrorNode();
                    console.log(`✓ ERROR node spawned at (${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}, ${node.position.z.toFixed(1)})`);
                }
            },

            extreme: () => {
                if (window.game && window.game.aiNodes) {
                    const node = window.game.aiNodes.spawnExtremeNode();
                    console.log(`✓ EXTREME node spawned at (${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}, ${node.position.z.toFixed(1)})`);
                }
            },

            archetype: (name) => {
                if (window.game && window.game.aiNodes) {
                    const node = window.game.aiNodes.spawnArchetype(name);
                    if (node) {
                        console.log(`✓ Archetype ${name} spawned at (${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}, ${node.position.z.toFixed(1)})`);
                    }
                }
            },

            stats: () => {
                if (window.game && window.game.aiNodes) {
                    window.game.aiNodes.printArchetypeStats();
                }
            },

            list: () => {
                if (window.game && window.game.aiNodes) {
                    const archetypes = Object.keys(window.game.aiNodes.extremeArchetypes);
                    console.log(`🧬 All 49 Standardized Archetypes:`);
                    console.table(archetypes.map(a => ({
                        archetype: a,
                        baseCategory: window.game.aiNodes.extremeArchetypes[a]
                    })));
                }
            },

            weights: () => {
                if (window.game && window.game.aiNodes) {
                    const weights = window.game.aiNodes.spawningConfig.spawnWeights;
                    console.log(`📊 Spawn Weight Distribution:`);
                    console.table({
                        standard: `${(weights.standard * 100).toFixed(1)}% (6 categories)`,
                        mythic: `${(weights.mythic * 100).toFixed(1)}% (ultra-rare)`,
                        prime: `${(weights.prime * 100).toFixed(1)}% (rare)`,
                        error: `${(weights.error * 100).toFixed(1)}% (unstable)`,
                        extreme: `${(weights.extreme * 100).toFixed(1)}% (13 archetypes)`,
                        special: `${(weights.special * 100).toFixed(1)}% (sigma/quantum/emotional)`
                    });
                }
            }
        };

        // Setup ATOMA Naming Engine console API
        console.log('✓ ATOMA Naming Engine 1.0 commands available:');
        console.log('  - name.show(nodeId) — Show naming code & meaning for node');
        console.log('  - name.random() — Generate random naming code');
        console.log('  - name.archetypes() — List all archetype → code mappings');
        console.log('  - name.reference() — Print full morpheme reference table');
        console.log('  - name.stats() — Print naming engine statistics');
        console.log('  - name.enable() / name.disable() — Toggle naming layer');



        // ============================================================================
        // PHASE 1 LINK SYSTEMS REACTIVATION (Session 107+)
        // Console API setup for LinkCorrelationEngine + History + Hardening
        // ============================================================================
        console.log('✓ Phase 1 Link Systems console API available:');
        
        window.correlationStatus = function() {
            if (!window.game?.linkCorrelationEngine) {
                console.warn('⚠ LinkCorrelationEngine not available');
                return;
            }
            const status = window.game.linkCorrelationEngine.status();
            console.log('🔄 Correlation Engine Status:', status);
            return status;
        };
        console.log('  - correlationStatus() — Get correlation engine status');
        
        window.getClusters = function() {
            if (!window.game?.linkCorrelationEngine) {
                console.warn('⚠ LinkCorrelationEngine not available');
                return;
            }
            const clusters = window.game.linkCorrelationEngine.getClusters();
            console.log('📊 Synergy Clusters:', clusters);
            return clusters;
        };
        console.log('  - getClusters() — Get all synergy clusters');
        
        window.getCorrelationFor = function(linkId) {
            if (!window.game?.linkCorrelationEngine) {
                console.warn('⚠ LinkCorrelationEngine not available');
                return;
            }
            const meta = window.game.linkCorrelationEngine.getCorrelationMeta(linkId);
            console.log(`📈 Correlation for ${linkId}:`, meta);
            return meta;
        };
        console.log('  - getCorrelationFor(linkId) — Get correlation data for link');
        
        window.checkLinkIntegrity = function() {
            if (!window.game?.linkingSystem) {
                console.warn('⚠ LinkingSystem not available');
                return;
            }
            const links = window.game.linkingSystem.getLinkList?.() || [];
            let issues = 0;
            
            links.forEach(link => {
                if (!link.source || !link.target) {
                    console.warn(`⚠ Link ${link.id} has missing source/target`);
                    issues++;
                }
            });
            
            console.log(`✓ Checked ${links.length} links, found ${issues} issues`);
            return { total: links.length, issues };
        };
        console.log('  - checkLinkIntegrity() — Verify link integrity (hardening)');

        // Expose modules for console access
        window.visuals = this.newNodeVisuals;
        window.extremeLinks = this.extremeLinkVisuals;
    }

    /**
     * Setup Extreme AI Shader Test Suite
     * SAFE: Non-destructive diagnostics for EXTREME node shader integration
     */
    setupExtremeShaderTestSuite() {
        this.extremeShaderTestSuite = new ExtremeAIShaderTestSuite({
            scene: this.scene,
            nodeManager: this.aiNodes,
            shaderPack: null // Will be set if shader pack is created
        });

        // Build static registries
        this.extremeShaderTestSuite.setup();

        console.log('✓ Extreme AI Shader Test Suite initialized (SAFE diagnostics mode)');
    }

    /**
     * Setup Safe New Node Categories 1.0
     * SAFE: Non-destructive addition of 3 new node categories
     * Mythic (MYT-), Prime (PRM-), Error (ERR-) with spawn rules and visuals
     */
    setupNewNodeCategories() {
        this.newNodeCategories = new SafeNewNodeCategories1_0(this.scene, this.aiNodes);

        console.log('✓ Safe New Node Categories 1.0 initialized');
        console.log('  - MYTHIC NODES (MYT-): Rare ritual stabilizers');
        console.log('  - PRIME NODES (PRM-): Perfect topology anchors');
        console.log('  - ERROR NODES (ERR-): Unstable glitch entities');
    }

    /**
     * Setup New Node Category Visuals 1.0
     * SAFE: Pure visual enhancement for the three new node categories
     * Mythic (elegant auras), Prime (crystalline), Error (glitch) visuals
     */
    setupNewNodeCategoryVisuals() {
        try {
            this.newNodeVisuals = new NewNodeCategoryVisuals(this.scene);
            if (this.newNodeVisuals && this.newNodeVisuals.animate) {
                console.log('✓ New Node Category Visuals 1.0 initialized');
                console.log('  - MYTHIC: Sacred auras + fractal triangle + orbiting rings');
                console.log('  - PRIME: White icosahedron + holographic grid + space-warp');
                console.log('  - ERROR: Broken cube + glitch effects + burst sparks');
            }
        } catch (err) {
            console.warn('NewNodeCategoryVisuals initialization failed:', err);
        }
    }

    /**
     * Setup Extreme Link Visual Pack 3.0
     * SAFE: AAA-quality link visualization with multi-layer neon beams + glyph language
     */
    setupExtremeLinkVisuals() {
        try {
            this.extremeLinkVisuals = new ExtremeLinkVisualPack3({
                coreThickness: 3.0,
                glowThickness: 6.0,
                bloomThickness: 10.0,
                glyphDensity: 1.0,
                glyphSpeed: 1.0
            });

            // Register existing links
            if (this.linkingSystem && this.linkingSystem.links) {
                this.linkingSystem.links.forEach(link => {
                    try {
                        this.extremeLinkVisuals.registerLink(link);
                    } catch (err) {
                        console.warn('Failed to register link:', err);
                    }
                });
            }

            console.log('✓ Extreme Link Visual Pack 3.0 initialized');
            console.log('  - Multi-layer neon beam structure');
            console.log('  - Animated glyph language stream');
            console.log('  - Synergy-reactive intensity & speed');
            console.log('  - Category-aware color blending');
        } catch (err) {
            console.warn('ExtremeLinkVisualPack3 initialization failed:', err);
        }
    }

    /**
     * Setup Neural Curve Link Visuals 1.0
     * SAFE: Dynamic Bézier curved links with AI neural pathways
     */
    setupNeuralCurveLinkVisuals() {
        try {
            this.neuralCurveLinkVisuals = new NeuralCurveLinkVisuals({
                strength: 0.6,
                oscillationAmount: 0.005,
                categoryBias: true
            });

            // Register existing links
            if (this.linkingSystem && this.linkingSystem.links) {
                this.linkingSystem.links.forEach(link => {
                    try {
                        this.neuralCurveLinkVisuals.registerLink(link);
                    } catch (err) {
                        console.warn('Failed to register neural curve for link:', err);
                    }
                });
            }

            // Setup console API
            setupNeuralCurveConsoleAPI(this.neuralCurveLinkVisuals);

            console.log('✓ Neural Curve Link Visuals 1.0 initialized');
            console.log('  - Dynamic Bézier curved links');
            console.log('  - Category-influenced curves');
            console.log('  - Neural micro-oscillations');
            console.log('  - Smooth curvature transitions');
        } catch (err) {
            console.warn('NeuralCurveLinkVisuals initialization failed:', err);
        }
    }

    /**
     * Setup Extreme Link Visuals 4.0
     * SAFE: Neural curvature, depth, and category-aware link visualization
     */
    setupExtremeLinkVisuals4() {
        if (!this.linkingSystem || !this.scene) {
            console.warn('Linking system or scene not initialized, deferring Extreme Link Visuals 4.0 setup');
            return;
        }

        try {
            this.extremeLinkVisuals4 = new ExtremeLinkVisuals4_0(
                this.scene,
                this.linkingSystem,
                null, // metrics system (optional)
                this.aiNodes
            );

            // Set camera for depth calculations
            this.extremeLinkVisuals4.setCamera(this.camera);

            // Attach visuals to existing links
            if (this.linkingSystem.links) {
                for (const link of this.linkingSystem.links) {
                    this.extremeLinkVisuals4.attachToLink(link);
                }
            }

            // Setup console API
            setupExtremeLinkVisualsV4ConsoleAPI(this.extremeLinkVisuals4);

            console.log('✓ Extreme Link Visuals 4.0 initialized');
            console.log('  - 3-layer neural geometry per link');
            console.log('  - Depth-reactive brightness & width');
            console.log('  - Category-aware unified colors');
            console.log('  - Metric-reactive visual accents');
            console.log('  - Animated flow packets');
            console.log('  - Subtle glyph integration');
            console.log('  - Use extremeLinksV4.debugStats() for status');
        } catch (err) {
            console.warn('ExtremeLinkVisuals4_0 initialization failed:', err);
        }
    }

    /**
     * Setup Link Visual Mood System v1.0
     * SAFE: Real-time link visual mood presets (calm, premium, intense, meditative)
     * Provides thematic appearance switching without affecting gameplay
     */
    setupLinkVisualMoodSystem() {
        if (!this.linkingSystem || !this.scene || !this.camera || !this.renderer) {
            console.warn('Required systems not initialized, deferring Link Visual Mood System setup');
            return;
        }

        try {
            this.linkVisualMoodSystem = new LinkVisualMoodSystem(
                this.scene,
                this.camera,
                this.renderer
            );

            // Wire up to visual systems
            if (this.neonLinkVisuals) {
                this.linkVisualMoodSystem.setNeonLinkVisuals(this.neonLinkVisuals);
            }
            if (this.dynamicLinkColorSystem) {
                this.linkVisualMoodSystem.setDynamicLinkColorSystem(this.dynamicLinkColorSystem);
            }
            if (this.linkingSystem) {
                this.linkVisualMoodSystem.setLinkingSystem(this.linkingSystem);
            }
            if (this.postProcessing) {
                this.linkVisualMoodSystem.setPostProcessing(this.postProcessing);
            }

            // Setup console API
            setupLinkMoodSystemConsoleAPI(this.linkVisualMoodSystem);

            // Set default mood
            this.linkVisualMoodSystem.activateMood('premium', 0.5);

            console.log('✓ Link Visual Mood System v1.0 initialized');
            console.log('  - 🧘 Calm: Minimal, zen-like, subtle');
            console.log('  - ✨ Premium: Elegant, refined, professional');
            console.log('  - ⚡ Intense: Aggressive, high-contrast, dramatic');
            console.log('  - 🌙 Meditative: Slow, deep, contemplative');
            console.log('  - Use debugLinkMood.* commands to switch moods');
        } catch (err) {
            console.warn('LinkVisualMoodSystem initialization failed:', err);
        }
    }

    /**
     * Setup AI Consciousness Layer 2.0
     * SAFE: Neural thought visualization + Emergent Thought Storms
     */
    setupAIConsciousnessLayer() {
        if (!this.linkingSystem || !this.scene) {
            console.warn('Linking system or scene not initialized, deferring AI Consciousness Layer setup');
            return;
        }

        try {
            this.consciousnessLayer = new AIConsciousnessLayer(
                this.scene,
                this.linkingSystem,
                this.aiNodes,
                this.glyphLayer4
            );

            // Initialize Emergent Thought Storms 2.0 as sub-system
            try {
                this.consciousnessLayer.initializeStorms(AIThoughtStorms2_0);

                // Setup storms console API
                if (this.consciousnessLayer.storms) {
                    setupAIThoughtStormsConsoleAPI(this.consciousnessLayer.storms);
                }
            } catch (err) {
                console.warn('Thought Storms sub-system failed to initialize:', err);
            }

            // Setup consciousness layer console API (which now includes storms toggle)
            setupAIConsciousnessConsoleAPI(this.consciousnessLayer);

            console.log('✓ AI Consciousness Layer 2.0 initialized');
            console.log('  - Neural thought threads on links');
            console.log('  - Cognitive pulse packets flowing');
            console.log('  - Semantic thought patterns');
            console.log('  - Global consciousness field');
            console.log('  - Emergent Thought Storms (mood-reactive)');
            console.log('  - Use conscious.debug() for detailed status');
            console.log('  - Use conscious.enableStorms() / disableStorms()');
            console.log('  - Use consciousStorms.debugState() for storms status');
        } catch (err) {
            console.warn('AIConsciousnessLayer initialization failed:', err);
        }
    }

    // ---------------------------------------------------------
    // LEGACY SYSTEMS DISABLED — SAFE VERSION
    // NOTE: setupCategoryLegend() and setupEmotionalFeed() are NOW ACTIVE
    // See main constructor for active initialization
    // ---------------------------------------------------------

    // AUTO-DETECT 3.1 (legacy, disabled)
    setupNodeAutoDetect() {
        console.log('✗ UI Node Auto-Detect 3.1 DISABLED');
        // nothing executed
    }

    // NODE LINKING 2.0 (DO NOT ENABLE – conflicts with 2.3)
    setupNodeLinkingLegacy() {
        console.log('✗ Node Linking 2.0 DISABLED (using NodeLinking2_3)');
        // nothing executed
    }

    // HOVER TOOLTIP 3.1 (blocks clicks, disabled)
    setupHoverTooltipLegacy() {
        console.log('✗ Hover Tooltip 3.1 DISABLED');
        // nothing executed



        // Global toggle function for world events
        window.toggleWorldEvents = function () {
            if (window.game && window.game.metricReactiveEvents) {
                if (window.game.metricReactiveEvents.enabled) {
                    window.game.metricReactiveEvents.disable();
                } else {
                    window.game.metricReactiveEvents.enable();
                }
            }
        };

        // Global debug function for world events
        window.debugWorldEvents = function () {
            if (window.game && window.game.metricReactiveEvents) {
                console.group('Metric-Reactive World Events Status');
                console.log('Enabled:', window.game.metricReactiveEvents.enabled);
                console.log('Debug Mode:', window.game.metricReactiveEvents.debugMode);
                console.log('Performance:', window.game.metricReactiveEvents.getPerformanceStats());
                console.log('Event States:', window.game.metricReactiveEvents.eventStates);
                console.groupEnd();
            }
        };

        // Global debug function for world reset fix
        window.debugWorldResetFix = function () {
            if (window.game && window.game.worldResetFix) {
                console.group('Safe World Reset Fix 1.0 Status');
                const status = window.game.worldResetFix.getStatus();
                console.log('Transition Active:', status.isTransitioning);
                console.log('Scene Ready:', status.sceneReady);
                console.log('Cleanup Queue Length:', status.cleanupQueueLength);
                console.log('Systems Active:', status.systemsActive);
                console.groupEnd();
            }
        };

        // Global debug function for mythic seed glyphs
        window.debugMythicGlyphs = function () {
            if (window.game && window.game.mythicSeedGlyph) {
                window.game.mythicSeedGlyph.printStatusReport();
            }
        };

        // ════════════════════════════════════════════════════════════════════════════════
        // EXTREME AI SHADER TEST SUITE CONSOLE COMMANDS
        // ════════════════════════════════════════════════════════════════════════════════

        // Run full consistency check on EXTREME archetype ↔ shader mapping
        window.debugExtremeShaders = function () {
            if (window.game && window.game.extremeShaderTestSuite) {
                window.game.extremeShaderTestSuite.runOfflineConsistencyCheck();
            } else {
                console.warn('[ExtremeShaderTestSuite] Not initialized');
            }
        };

        // Enable per-frame validation checks
        window.enableExtremeShaderDiagnostics = function () {
            if (window.game && window.game.extremeShaderTestSuite) {
                window.game.extremeShaderTestSuite.enableDiagnostics();
            } else {
                console.warn('[ExtremeShaderTestSuite] Not initialized');
            }
        };

        // Disable per-frame validation checks
        window.disableExtremeShaderDiagnostics = function () {
            if (window.game && window.game.extremeShaderTestSuite) {
                window.game.extremeShaderTestSuite.disableDiagnostics();
            } else {
                console.warn('[ExtremeShaderTestSuite] Not initialized');
            }
        };

        // Enable debug visualization overlays on EXTREME nodes
        window.enableExtremeShaderDebugVisuals = function () {
            if (window.game && window.game.extremeShaderTestSuite) {
                window.game.extremeShaderTestSuite.enableDebugVisuals();
            } else {
                console.warn('[ExtremeShaderTestSuite] Not initialized');
            }
        };

        // Disable debug visualization overlays
        window.disableExtremeShaderDebugVisuals = function () {
            if (window.game && window.game.extremeShaderTestSuite) {
                window.game.extremeShaderTestSuite.disableDebugVisuals();
            } else {
                console.warn('[ExtremeShaderTestSuite] Not initialized');
            }
        };

        // Print concise status summary
        window.printExtremeShaderSummary = function () {
            if (window.game && window.game.extremeShaderTestSuite) {
                window.game.extremeShaderTestSuite.printExtremeShaderSummary();
            } else {
                console.warn('[ExtremeShaderTestSuite] Not initialized');
            }
        };

        // Export metrics for telemetry
        window.exportExtremeShaderMetrics = function () {
            if (window.game && window.game.extremeShaderTestSuite) {
                const metrics = window.game.extremeShaderTestSuite.exportMetrics();
                console.log('Extreme Shader Metrics:', metrics);
                return metrics;
            } else {
                console.warn('[ExtremeShaderTestSuite] Not initialized');
            }
        };

        // ════════════════════════════════════════════════════════════════════════════════
        // SAFE NEW NODE CATEGORIES 1.0 CONSOLE COMMANDS
        // ════════════════════════════════════════════════════════════════════════════════

        // Print status report for all new node categories
        window.printNewNodeCategoriesStatus = function () {
            if (window.game && window.game.newNodeCategories) {
                window.game.newNodeCategories.printStatusReport();
            } else {
                console.warn('[SafeNewNodeCategories1_0] Not initialized');
            }
        };

        // Apply Mythic node visuals to a specific node (by array index)
        window.applyMythicNodeVisuals = function (nodeIndex = 0) {
            if (window.game && window.game.newNodeCategories && window.game.aiNodes) {
                const nodes = window.game.aiNodes.nodes;
                if (nodeIndex >= 0 && nodeIndex < nodes.length) {
                    const success = window.game.newNodeCategories.createMythicNodeVisuals(nodes[nodeIndex]);
                    if (success) {
                        console.log(`✓ Applied Mythic visuals to node ${nodeIndex} (MYT-${nodeIndex})`);
                    } else {
                        console.warn(`✗ Failed to apply Mythic visuals to node ${nodeIndex}`);
                    }
                } else {
                    console.warn(`Invalid node index: ${nodeIndex} (available: 0-${nodes.length - 1})`);
                }
            } else {
                console.warn('[SafeNewNodeCategories1_0] Not initialized or AI Nodes not available');
            }
        };

        // Apply Prime node visuals to a specific node
        window.applyPrimeNodeVisuals = function (nodeIndex = 0) {
            if (window.game && window.game.newNodeCategories && window.game.aiNodes) {
                const nodes = window.game.aiNodes.nodes;
                if (nodeIndex >= 0 && nodeIndex < nodes.length) {
                    const success = window.game.newNodeCategories.createPrimeNodeVisuals(nodes[nodeIndex]);
                    if (success) {
                        console.log(`✓ Applied Prime visuals to node ${nodeIndex} (PRM-${nodeIndex})`);
                    } else {
                        console.warn(`✗ Failed to apply Prime visuals to node ${nodeIndex}`);
                    }
                } else {
                    console.warn(`Invalid node index: ${nodeIndex} (available: 0-${nodes.length - 1})`);
                }
            } else {
                console.warn('[SafeNewNodeCategories1_0] Not initialized or AI Nodes not available');
            }
        };

        // Apply Error node visuals to a specific node
        window.applyErrorNodeVisuals = function (nodeIndex = 0) {
            if (window.game && window.game.newNodeCategories && window.game.aiNodes) {
                const nodes = window.game.aiNodes.nodes;
                if (nodeIndex >= 0 && nodeIndex < nodes.length) {
                    const success = window.game.newNodeCategories.createErrorNodeVisuals(nodes[nodeIndex]);
                    if (success) {
                        console.log(`✓ Applied Error visuals to node ${nodeIndex} (ERR-${nodeIndex})`);
                    } else {
                        console.warn(`✗ Failed to apply Error visuals to node ${nodeIndex}`);
                    }
                } else {
                    console.warn(`Invalid node index: ${nodeIndex} (available: 0-${nodes.length - 1})`);
                }
            } else {
                console.warn('[SafeNewNodeCategories1_0] Not initialized or AI Nodes not available');
            }
        };

        // Demo: Apply all three categories to demo nodes
        window.demoNewNodeCategories = function () {
            if (window.game && window.game.newNodeCategories && window.game.aiNodes) {
                const nodes = window.game.aiNodes.nodes;
                if (nodes.length >= 3) {
                    console.group('🎨 New Node Categories Demo');

                    window.game.newNodeCategories.createMythicNodeVisuals(nodes[0]);
                    console.log(`✓ Node 0: Mythic (MYT-0) - Gold/Purple/Cyan triple aura`);

                    window.game.newNodeCategories.createPrimeNodeVisuals(nodes[1]);
                    console.log(`✓ Node 1: Prime (PRM-1) - White fractal core with hex rings`);

                    window.game.newNodeCategories.createErrorNodeVisuals(nodes[2]);
                    console.log(`✓ Node 2: Error (ERR-2) - Red/cyan glitch layers`);

                    console.log('');
                    window.game.newNodeCategories.printStatusReport();
                    console.groupEnd();
                } else {
                    console.warn(`Need at least 3 nodes for demo (available: ${nodes.length})`);
                }
            } else {
                console.warn('[SafeNewNodeCategories1_0] Not initialized or AI Nodes not available');
            }
        };

        // ════════════════════════════════════════════════════════════════════════════════
        // LINKED GLYPH SYNCHRONIZATION 1.0 CONSOLE COMMANDS
        // ════════════════════════════════════════════════════════════════════════════════

        // Debug Linked Glyph Synchronization
        window.debugGlyphSync = function () {
            if (window.game && window.game.linkedGlyphSync) {
                window.game.linkedGlyphSync.printStatusReport();
            } else {
                console.warn('Linked Glyph Synchronization not available');
            }
        };

        // Toggle Linked Glyph Synchronization
        window.toggleLinkedGlyphSync = function () {
            if (window.game && window.game.linkedGlyphSync) {
                window.game.linkedGlyphSync.toggle();
            } else {
                console.warn('Linked Glyph Synchronization not available');
            }
        };

        // Resync all glyphs immediately
        window.resyncAllGlyphs = function () {
            if (window.game && window.game.linkedGlyphSync) {
                window.game.linkedGlyphSync.resyncAllGlyphs();
            } else {
                console.warn('Linked Glyph Synchronization not available');
            }
        };

        // ════════════════════════════════════════════════════════════════════════════════
        // LINKED GLYPH MESSAGING 3.0 CONSOLE COMMANDS
        // ════════════════════════════════════════════════════════════════════════════════

        // Debug Linked Glyph Messaging
        window.debugPrintMessages = function () {
            if (window.game && window.game.linkedGlyphMessaging) {
                window.game.linkedGlyphMessaging.printStatusReport();
            } else {
                console.warn('Linked Glyph Messaging not available');
            }
        };

        // Toggle Linked Glyph Messaging
        window.toggleMessaging = function () {
            if (window.game && window.game.linkedGlyphMessaging) {
                window.game.linkedGlyphMessaging.toggle();
            } else {
                console.warn('Linked Glyph Messaging not available');
            }
        };

        // Clear all messages immediately
        window.clearAllGlyphMessages = function () {
            if (window.game && window.game.linkedGlyphMessaging) {
                window.game.linkedGlyphMessaging.clearAllMessages();
            } else {
                console.warn('Linked Glyph Messaging not available');
            }
        };

        // Global function to remove old markers manually
        window.removeOldMarkers = function () {
            if (window.game && window.game.mythicSeedGlyph) {
                window.game.mythicSeedGlyph.removeOldMarkers();
                console.log('✓ Old markers removal triggered');
            }
        };

        // Global debug function for legacy cone cleanup
        window.debugLegacyConeCleanup = function () {
            if (window.game && window.game.legacyConeCleanup) {
                window.game.legacyConeCleanup.printStatusReport();
            }
        };

        // Global function to manually trigger cone cleanup
        window.cleanLegacyCones = function () {
            if (window.game && window.game.legacyConeCleanup && window.game.aiNodes) {
                window.game.legacyConeCleanup.manualCleanup(window.game.aiNodes.nodes);
            }
        };

        // DISABLED: Fractal hex markers debug commands (legacy system)
        // window.debugFractalHexMarkers = function() { ... };
        // window.createFractalHexMarkers = function() { ... };

        // ========== LEGACY GLYPH CLEANUP 1.0 DEBUG COMMANDS ==========

        // Manual cleanup of all legacy 2D cyan hexagon glyphs
        window.cleanupLegacyGlyphs = function () {
            if (window.game && window.game.legacyGlyphCleanup) {
                const result = window.game.legacyGlyphCleanup.cleanupLegacyGlyphs();
                console.group('🧹 Legacy Glyph Cleanup Complete');
                console.log(`Meshes Removed: ${result.meshesRemoved}`);
                console.log(`Geometries Disposed: ${result.geometriesDisposed}`);
                console.log(`Materials Disposed: ${result.materialsDisposed}`);
                console.log(`Time: ${result.timeMs.toFixed(2)}ms`);
                if (result.removedNames.length > 0) {
                    console.log('Removed Items:');
                    result.removedNames.forEach(name => console.log(`  - ${name}`));
                }
                console.groupEnd();
            } else {
                console.warn('⚠ Legacy Glyph Cleanup not initialized');
            }
        };

        // Debug legacy glyph cleanup statistics
        window.debugLegacyGlyphCleanup = function () {
            if (window.game && window.game.legacyGlyphCleanup) {
                const stats = window.game.legacyGlyphCleanup.getStats();
                console.group('📊 Legacy Glyph Cleanup Statistics');
                console.log('Total Meshes Removed:', stats.meshesRemoved);
                console.log('Total Geometries Disposed:', stats.geometriesDisposed);
                console.log('Total Materials Disposed:', stats.materialsDisposed);
                console.log('Last Cleanup Time:', stats.lastCleanupTime.toFixed(2) + 'ms');
                console.groupEnd();
            } else {
                console.warn('⚠ Legacy Glyph Cleanup not initialized');
            }
        };

        // ========== GLYPH PURITY MODE 5.1 DEBUG COMMANDS ==========

        // Main purification command - removes all unauthorized glyphs
        window.purifyGlyphs = function () {
            if (window.game && window.game.glyphPurityMode) {
                const removed = window.game.glyphPurityMode.purifyScene();
                console.group('🎨 Glyph Purity Enforcement');
                console.log(`Unauthorized Glyphs Removed: ${removed}`);
                window.game.glyphPurityMode.printPurityReport();
                console.groupEnd();
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // Set purity enforcement level (0=OFF, 1=MODERATE, 2=STRICT, 3=PURE)
        window.setPurityLevel = function (level) {
            if (window.game && window.game.glyphPurityMode) {
                window.game.glyphPurityMode.setPurityLevel(level);
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // Print comprehensive purity report
        window.debugPurityMode = function () {
            if (window.game && window.game.glyphPurityMode) {
                window.game.glyphPurityMode.printPurityReport();
                window.game.glyphPurityMode.printIntegrityReport();
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // List all approved glyph components
        window.listApprovedGlyphs = function () {
            if (window.game && window.game.glyphPurityMode) {
                window.game.glyphPurityMode.printApprovedComponents();
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // Validate entire scene integrity
        window.validateGlyphIntegrity = function () {
            if (window.game && window.game.glyphPurityMode) {
                const report = window.game.glyphPurityMode.validateSceneIntegrity();
                console.group('✓ Scene Glyph Integrity Validation');
                console.log(`Valid Glyphs: ${report.valid}`);
                console.log(`Invalid Glyphs: ${report.invalid}`);
                console.log(`Scene is Pure: ${report.isPure ? '✓ YES - Perfect!' : '✗ NO - Issues found'}`);
                if (report.issues.length > 0) {
                    console.log('Issues:');
                    report.issues.forEach(issue => console.log(`  ⚠ ${issue}`));
                }
                console.groupEnd();
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // Enable/disable purity enforcement
        window.togglePurityMode = function (enabled) {
            if (window.game && window.game.glyphPurityMode) {
                window.game.glyphPurityMode.setPurityEnabled(enabled !== false);
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // ========== ADAPTIVE GLYPH RENDERING 1.0 DEBUG COMMANDS ==========

        // Debug adaptive glyph rendering status
        window.debugAdaptiveGlyphs = function () {
            if (window.game && window.game.adaptiveGlyphRendering) {
                window.game.adaptiveGlyphRendering.printDebugReport();
            } else {
                console.warn('⚠ Adaptive Glyph Rendering 1.0 not initialized');
            }
        };

        // Toggle adaptive glyph rendering on/off
        window.toggleAdaptiveGlyphs = function (enabled) {
            if (window.game && window.game.adaptiveGlyphRendering) {
                window.game.adaptiveGlyphRendering.setEnabled(enabled !== false);
            } else {
                console.warn('⚠ Adaptive Glyph Rendering 1.0 not initialized');
            }
        };

        // Debug adaptive rendering for a specific node
        window.debugNodeAdaptation = function (nodeIndex = 0) {
            if (!window.game || !window.game.adaptiveGlyphRendering || !window.game.aiNodes) {
                console.warn('⚠ Required systems not found');
                return;
            }

            const node = window.game.aiNodes.nodes[nodeIndex];
            if (!node) {
                console.warn(`⚠ Node at index ${nodeIndex} not found`);
                return;
            }

            const nodeId = node.uuid || `node-${nodeIndex}`;
            window.game.adaptiveGlyphRendering.debugNodeAdaptation(nodeId, node);
        };

        // Global debug function for ATOMA Glyph System
        window.debugGlyphs = function () {
            if (window.game && window.game.glyphSystem) {
                window.game.glyphSystem.printStatus();
            }
        };

        // Global debug function for glyph mapping distribution
        window.debugGlyphMapping = function () {
            if (window.game && window.game.glyphSystem) {
                window.game.glyphSystem.debugGlyphMapping();
            }
        };

        // Global function to auto-assign glyphs to all nodes
        window.autoAssignGlyphs = function () {
            if (window.game && window.game.glyphSystem && window.game.aiNodes) {
                window.game.glyphSystem.assignGlyphsToNodes(window.game.aiNodes.nodes);
                console.log('✓ Auto-assigned glyphs to all nodes');
                window.debugGlyphMapping();
            }
        };

        // Global function to clear all glyphs
        window.clearGlyphs = function () {
            if (window.game && window.game.glyphSystem) {
                window.game.glyphSystem.cleanup();
                console.log('✓ All glyphs cleared');
            }
        };

        // Global debug function for ATOMA Glyph System 4.0
        window.debugGlyphs4 = function () {
            if (window.game && window.game.glyphSystem4) {
                window.game.glyphSystem4.printStatus();
            }
        };

        // Global function to clear all glyphs (4.0)
        window.clearGlyphs4 = function () {
            if (window.game && window.game.glyphSystem4) {
                window.game.glyphSystem4.cleanup();
                console.log('✓ All Glyph System 4.0 glyphs cleared');
            }
        };

        // Global helper to create glyphs with 4.0
        window.createGlyph4 = function (nodeId, glyphType) {
            if (!window.game || !window.game.glyphSystem4 || !window.game.aiNodes) {
                console.warn('Systems not ready');
                return;
            }

            const node = window.game.aiNodes.nodes.find((n, idx) => {
                const nId = n.uuid || `node-${idx}`;
                return nId === nodeId;
            });

            if (!node) {
                console.warn(`Node ${nodeId} not found`);
                return;
            }

            const glyphMethods = {
                aiConsciousness: () => window.game.glyphSystem4.createAIConsciousnessGlyph(node, nodeId),
                mythicSeed: () => window.game.glyphSystem4.createMythicSeedGlyph(node, nodeId),
                ascendedNode: () => window.game.glyphSystem4.createAscendedNodeGlyph(node, nodeId),
                evolutionStage1: () => window.game.glyphSystem4.createEvolutionStage1Glyph(node, nodeId),
                evolutionStage2: () => window.game.glyphSystem4.createEvolutionStage2Glyph(node, nodeId),
                evolutionStage3: () => window.game.glyphSystem4.createEvolutionStage3Glyph(node, nodeId),
                personalityHarmony: () => window.game.glyphSystem4.createPersonalityHarmonyGlyph(node, nodeId),
                personalityInstability: () => window.game.glyphSystem4.createPersonalityInstabilityGlyph(node, nodeId),
                personalityCorruption: () => window.game.glyphSystem4.createPersonalityCorruptionGlyph(node, nodeId),
                personalitySynergy: () => window.game.glyphSystem4.createPersonalitySynergyGlyph(node, nodeId),
                eventMythicRitual: () => window.game.glyphSystem4.createEventMythicRitualGlyph(node, nodeId),
                eventClusterSurge: () => window.game.glyphSystem4.createEventClusterSurgeGlyph(node, nodeId),
                eventWorldEvent: () => window.game.glyphSystem4.createEventWorldEventGlyph(node, nodeId)
            };

            if (glyphMethods[glyphType]) {
                glyphMethods[glyphType]();
                console.log(`✓ Created ${glyphType} glyph (4.0) on node ${nodeId}`);
            } else {
                console.warn(`Unknown glyph type: ${glyphType}`);
                console.log('Available types:', Object.keys(glyphMethods));
            }
        };

        // Global helper to create specific glyph types
        window.createGlyph = function (nodeId, glyphType) {
            if (!window.game || !window.game.glyphSystem || !window.game.aiNodes) {
                console.warn('Systems not ready');
                return;
            }

            const node = window.game.aiNodes.nodes.find((n, idx) => {
                const nId = n.uuid || `node-${idx}`;
                return nId === nodeId;
            });

            if (!node) {
                console.warn(`Node ${nodeId} not found`);
                return;
            }

            const glyphMethods = {
                aiConsciousness: () => window.game.glyphSystem.createAIConsciousnessGlyph(node, nodeId),
                mythicSeed: () => window.game.glyphSystem.createMythicSeedGlyph(node, nodeId),
                ascendedNode: () => window.game.glyphSystem.createAscendedNodeGlyph(node, nodeId),
                evolutionStage1: () => window.game.glyphSystem.createEvolutionStage1Glyph(node, nodeId),
                evolutionStage2: () => window.game.glyphSystem.createEvolutionStage2Glyph(node, nodeId),
                evolutionStage3: () => window.game.glyphSystem.createEvolutionStage3Glyph(node, nodeId),
                personalityHarmony: () => window.game.glyphSystem.createPersonalityHarmonyGlyph(node, nodeId),
                personalityInstability: () => window.game.glyphSystem.createPersonalityInstabilityGlyph(node, nodeId),
                personalityCorruption: () => window.game.glyphSystem.createPersonalityCorruptionGlyph(node, nodeId),
                personalitySynergy: () => window.game.glyphSystem.createPersonalitySynergyGlyph(node, nodeId),
                eventMythicRitual: () => window.game.glyphSystem.createEventMythicRitualGlyph(node, nodeId),
                eventClusterSurge: () => window.game.glyphSystem.createEventClusterSurgeGlyph(node, nodeId),
                eventWorldEvent: () => window.game.glyphSystem.createEventWorldEventGlyph(node, nodeId)
            };

            if (glyphMethods[glyphType]) {
                glyphMethods[glyphType]();
                console.log(`✓ Created ${glyphType} glyph on node ${nodeId}`);
            } else {
                console.warn(`Unknown glyph type: ${glyphType}`);
                console.log('Available types:', Object.keys(glyphMethods));
            }
        };

        // ============================================================
        // GLYPH LAYER 4.0 - MULTI-GLYPH FUSION DEBUG COMMANDS
        // ============================================================

        // Global function to auto-create glyph fusions for all nodes
        window.autoCreateGlyphFusions = function () {
            if (window.game && window.game.glyphLayer4 && window.game.aiNodes) {
                window.game.glyphLayer4.createGlyphFusionsForNodes(window.game.aiNodes.nodes);
                console.log('✓ Auto-created glyph fusions for all nodes');
                window.debugGlyphLayer4Status();
            }
        };

        // Global function to debug glyph fusion on specific node
        window.debugGlyphFusion = function (nodeIndex = 0) {
            if (!window.game || !window.game.glyphLayer4 || !window.game.aiNodes) {
                console.warn('Systems not ready');
                return;
            }

            const node = window.game.aiNodes.nodes[nodeIndex];
            if (!node) {
                console.warn(`Node ${nodeIndex} not found`);
                return;
            }

            const nodeId = node.uuid || `node-${nodeIndex}`;
            window.game.glyphLayer4.debugGlyphFusion(nodeId);
        };

        // Global function to see Glyph Layer 4.0 status
        window.debugGlyphLayer4Status = function () {
            if (window.game && window.game.glyphLayer4) {
                window.game.glyphLayer4.printStatus();
            }
        };

        // Global function to disable Glyph Layer 4.0
        window.disableGlyphLayer4 = function () {
            if (window.game && window.game.glyphLayer4) {
                window.game.glyphLayer4.disable();
            }
        };

        // Global function to enable Glyph Layer 4.0
        window.enableGlyphLayer4 = function () {
            if (window.game && window.game.glyphLayer4) {
                window.game.glyphLayer4.enable();
            }
        };

        // Global function to clean up Glyph Layer 4.0
        window.clearGlyphLayer4 = function () {
            if (window.game && window.game.glyphLayer4) {
                window.game.glyphLayer4.cleanup();
                console.log('✓ Glyph Layer 4.0 cleaned up');
            }
        };

        // ========== SEMANTIC GLYPH AI 5.0 DEBUG COMMANDS ==========

        // Debug a specific node's semantic state
        window.debugSemanticGlyph = function (nodeIndex = 0) {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.debugSemanticGlyph(nodeIndex);
            }
        };

        // Display semantic system statistics
        window.debugSemanticStats = function () {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.debugSemanticStats();
            }
        };

        // Disable semantic AI updates
        window.disableSemanticGlyphAI = function () {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.disable();
                console.log('✓ Semantic Glyph AI disabled');
            }
        };

        // Enable semantic AI updates
        window.enableSemanticGlyphAI = function () {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.enable();
                console.log('✓ Semantic Glyph AI enabled');
            }
        };

        // Record link creation event on a node
        window.recordNodeLink = function (nodeIndex = 0) {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.recordLinkCreated(nodeIndex);
                console.log(`✓ Recorded link creation for node ${nodeIndex}`);
            }
        };

        // Record ritual completion event on a node
        window.recordNodeRitual = function (nodeIndex = 0) {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.recordRitualCompleted(nodeIndex);
                console.log(`✓ Recorded ritual for node ${nodeIndex}`);
            }
        };

        // ===================================================================
        // COMPOSITE GLYPH RESONANCE FEEDBACK DEBUG APIs
        // ===================================================================

        // Toggle debug visualization of resonance influence zones
        window.toggleCompositeResonanceDebug = function () {
            if (window.game && window.game.compositeResonanceFeedback) {
                const cf = window.game.compositeResonanceFeedback;
                const isDebugEnabled = cf.enabled && !cf.debugMode;
                cf.debugMode = !cf.debugMode;
                console.log(`✓ Composite Resonance debug visualization ${cf.debugMode ? 'ENABLED' : 'DISABLED'}`);
                if (cf.debugMode) {
                    console.log('   Visual cues: green wireframe spheres show influence zones');
                    console.log('   Phase vectors show coherence direction');
                }
            }
        };

        // Show status of active composite glyph resonances
        window.compositeResonanceStatus = function () {
            if (window.game && window.game.compositeResonanceFeedback) {
                const cf = window.game.compositeResonanceFeedback;
                console.group('🔮 Composite Glyph Resonance Feedback Status');
                console.log('Enabled:', cf.enabled);
                console.log('Debug Mode:', cf.debugMode);
                console.log('Active Resonances:', cf.resonanceZones.size);
                console.log('Update Counter:', cf.updateCounter);
                
                let activeCount = 0, decayingCount = 0;
                
                if (cf.resonanceZones.size > 0) {
                    console.log('\nZone Details:');
                    for (const [glyphId, zone] of cf.resonanceZones) {
                        const isDecaying = zone.decayStartTime !== null;
                        if (isDecaying) decayingCount++;
                        else activeCount++;
                        
                        console.log(`  [${glyphId}] ${isDecaying ? '🔴 DECAYING' : '🟢 ACTIVE'}`);
                        console.log(`    Strength: ${(zone.strength * 100).toFixed(1)}%`);
                        console.log(`    Radius: ${zone.influenceRadius.toFixed(2)}`);
                        console.log(`    Phase: ${zone.rampPhase}${isDecaying ? ` / Decay: ${zone.decayPhase}` : ''}`);
                        if (isDecaying) {
                            console.log(`    Decay Progress: ${(zone.decayProgress * 100).toFixed(1)}%`);
                            console.log(`    Structural Integrity: ${(zone.structuralIntegrity * 100).toFixed(1)}%`);
                        }
                        console.log(`    Affected: ${zone.affectedElements.length}`);
                    }
                    console.log(`\nSummary: ${activeCount} active, ${decayingCount} decaying`);
                }
                console.groupEnd();
            }
        };

        // Enable optional glyph animation phase influence from composite resonance
        window.enableGlyphResonanceInfluence = function () {
            if (window.game && window.game.compositeResonanceFeedback) {
                window.game.compositeResonanceFeedback.enableGlyphAnimationInfluence(true);
            }
        };

        // Disable optional glyph animation phase influence
        window.disableGlyphResonanceInfluence = function () {
            if (window.game && window.game.compositeResonanceFeedback) {
                window.game.compositeResonanceFeedback.enableGlyphAnimationInfluence(false);
            }
        };

        // Show detailed decay status of composite glyphs
        window.compositeGlyphDecayStatus = function () {
            if (window.game && window.game.compositeResonanceFeedback) {
                const cf = window.game.compositeResonanceFeedback;
                console.group('⏳ Composite Glyph Decay Status');
                
                let hasDecaying = false;
                for (const [glyphId, zone] of cf.resonanceZones) {
                    if (zone.decayStartTime !== null) {
                        hasDecaying = true;
                        console.log(`\n[${glyphId}]`);
                        console.log(`  Status: 🔴 ${zone.decayPhase.toUpperCase()}`);
                        console.log(`  Overall Progress: ${(zone.decayProgress * 100).toFixed(1)}%`);
                        console.log(`  Elapsed: ${zone.decayStartTime.toFixed(2)}s`);
                        console.log(`  Opacity Strength: ${(zone.strength * 100).toFixed(1)}%`);
                        console.log(`  Structural Integrity: ${(zone.structuralIntegrity * 100).toFixed(1)}%`);
                        console.log(`  Phase Decoherence: ${zone.phaseDecoherence.toFixed(3)} rad`);
                        console.log(`  Influence Radius: ${zone.influenceRadius.toFixed(2)}`);
                        
                        // Show reabsorption info if dissolving
                        if (zone.decayPhase === 'dissolving' && zone.sourceGlyphs.length > 0) {
                            console.log(`  📊 Source Reabsorption:`);
                            console.log(`     Sources Found: ${zone.sourceGlyphs.length}`);
                            console.log(`     Source IDs: ${zone.sourceNodeIds.join(', ')}`);
                        }
                    }
                }
                
                if (!hasDecaying) {
                    console.log('No composite glyphs currently decaying.');
                }
                console.groupEnd();
            }
        };

        // Record ascension event on a node
        window.recordNodeAscended = function (nodeIndex = 0) {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.recordAscended(nodeIndex);
                console.log(`✓ Recorded ascension for node ${nodeIndex}`);
            }
        };

        // ========== GLYPH FUSION OVERLAY 4.1 DEBUG COMMANDS ==========

        // Debug fusion glyph on a specific node
        window.debugFusionGlyph = function (nodeIndex = 0) {
            if (window.game && window.game.glyphFusionOverlay) {
                window.game.glyphFusionOverlay.debugFusionGlyph(nodeIndex);
            }
        };

        // Display fusion glyph system statistics
        window.debugFusionStats = function () {
            if (window.game && window.game.glyphFusionOverlay) {
                window.game.glyphFusionOverlay.debugFusionStats();
            }
        };

        // Enable Glyph Fusion Overlay
        window.enableFusionOverlay = function () {
            if (window.game && window.game.glyphFusionOverlay) {
                window.game.glyphFusionOverlay.enable();
                console.log('✓ Glyph Fusion Overlay 4.1 enabled');
            }
        };

        // Disable Glyph Fusion Overlay
        window.disableFusionOverlay = function () {
            if (window.game && window.game.glyphFusionOverlay) {
                window.game.glyphFusionOverlay.disable();
                console.log('✓ Glyph Fusion Overlay 4.1 disabled');
            }
        };

        // ========== ATOMA GLYPH SYSTEM 4.0 CLEANUP COMMANDS ==========

        // Remove all legacy 2D cyan hexagon glyphs (Glyph System 4.0 only)
        window.glyphCleanupLegacy = function () {
            if (window.game && window.game.glyphSystem4) {
                const removed = window.game.glyphSystem4.removeLegacyHexGlyphs();
                console.log(`🧹 Glyph System 4.0 cleanup complete: ${removed} legacy hex glyphs removed`);
            } else {
                console.warn('⚠ Glyph System 4.0 not found');
            }
        };

        // ========== PROCEDURAL MEANING ENGINE 1.0 DEBUG COMMANDS ==========

        // Debug procedural glyph system statistics
        window.debugProceduralGlyphs = function () {
            if (window.game && window.game.proceduralMeaningEngine) {
                const stats = window.game.proceduralMeaningEngine.getStats();
                console.group('Procedural Meaning Engine 1.0 Stats');
                console.log('Total Glyphs:', stats.totalGlyphs);
                console.log('Active Glyphs:', stats.activeGlyphs);
                console.log('Removed This Frame:', stats.removedThisFrame);
                console.log('Created This Frame:', stats.createdThisFrame);
                console.log('Frame Time (ms):', stats.frameTime.toFixed(3));
                console.log('Registry Size:', stats.registrySize);
                console.groupEnd();
            }
        };

        // Remove legacy 2D cyan hexagon glyphs
        window.debugRemoveLegacyHex = function () {
            if (window.game && window.game.proceduralMeaningEngine) {
                window.game.proceduralMeaningEngine.debugRemoveLegacyHex();
            }
        };

        // Enable Procedural Meaning Engine
        window.enableProceduralGlyphs = function () {
            if (window.game && window.game.proceduralMeaningEngine) {
                window.game.proceduralMeaningEngine.enabled = true;
                console.log('✓ Procedural Meaning Engine 1.0 enabled');
            }
        };

        // ========== ATOMA AUDIO SYSTEM DEBUG COMMANDS ==========

        // Enable/disable audio system
        window.toggleAudio = function () {
            if (window.game && window.game.audioSystem) {
                window.game.audioSystem.enabled = !window.game.audioSystem.enabled;
                console.log(`🔊 Audio System ${window.game.audioSystem.enabled ? 'ENABLED' : 'DISABLED'}`);
            }
        };

        // Start audio context (required on first interaction)
        window.startAudio = function () {
            if (window.game && window.game.audioSystem) {
                window.game.audioSystem.start().then(() => {
                    console.log('🎵 Audio Context Started');
                });
            }
        };

        // Test individual sounds
        window.testAudio = function (soundName = 'all') {
            if (!window.game || !window.game.audioSystem) {
                console.warn('⚠ Audio System not available');
                return;
            }
            
            const audio = window.game.audioSystem;
            const sounds = {
                'selection': () => audio.playSelection(),
                'deselection': () => audio.playDeselection(),
                'link': () => audio.playLinkCreated(),
                'unlink': () => audio.playLinkBroken(),
                'synergy_active': () => audio.playSynergyActive(),
                'synergy_fade': () => audio.playSynergyFade()
            };
            
            if (soundName === 'all') {
                Object.values(sounds).forEach(fn => {
                    setTimeout(fn, 300); // Stagger for audibility
                });
                console.log('🔊 Playing all ATOMA audio tests');
            } else if (sounds[soundName]) {
                sounds[soundName]();
                console.log(`🔊 Played: ${soundName}`);
            } else {
                console.warn(`⚠ Unknown sound: ${soundName}`);
                console.log('Available: selection, deselection, link, unlink, synergy_active, synergy_fade');
            }
        };

        // Show audio system status
        window.audioStatus = function () {
            if (window.game && window.game.audioSystem) {
                const audio = window.game.audioSystem;
                console.group('🔊 ATOMA Audio System Status');
                console.log('Initialized:', audio.initialized);
                console.log('Enabled:', audio.enabled);
                console.log('Synergy Threshold:', window.game.synergyActivationThreshold);
                console.log('Current Synergy State:', window.game.previousSynergyState);
                console.groupEnd();
            }
        };

        // ========== ATOMA AUDIO MODULATION DEBUG COMMANDS ==========

        // Enable/disable audio modulation (3-layer: synergy, harmony, corruption)
      //  window.toggleAudioModulation = function () {
      //      if (window.game && window.game.audioModulation) {
      //          const enabled = !window.game.audioModulation.enabled;
      //          window.game.audioModulation.setEnabled(enabled);
      //          console.log(`🎼 Audio Modulation ${enabled ? 'ENABLED' : 'DISABLED'}`);
   //         }
    //    };

        // Show audio modulation status
      //  window.audioModulationStatus = function () {
          // if (window.game && window.game.audioModulation) {
          //      const status = window.game.audioModulation.getStatus();
           //     console.group('🎼 ATOMA Audio Modulation Status');
       //         console.log('Enabled:', status.enabled);
     //           console.log('Synergy (Clarity):', status.synergy);
   //             console.log('Harmony (Stability):', status.harmony);
 //               console.log('Corruption (Entropy):', status.corruption);
 //               console.log(status.description);
 //               console.groupEnd();
  //          }
   //     };

        // Test audio modulation layers
        window.testAudioModulation = function () {
            if (window.game && window.game.audioModulation) {
                window.game.audioModulation.testModulation();
                console.log('✓ Audio Modulation test complete (check console for details)');
            }
        };

        // Disable Procedural Meaning Engine
        window.disableProceduralGlyphs = function () {
            if (window.game && window.game.proceduralMeaningEngine) {
                window.game.proceduralMeaningEngine.enabled = false;
                console.log('✓ Procedural Meaning Engine 1.0 disabled');
            }
        };

        // ========== LINK GLYPH FLOW 1.0 DEBUG COMMANDS ==========

        // Debug link glyph flow statistics
        window.debugLinkGlyphFlow = function () {
            if (window.game && window.game.linkGlyphFlow) {
                window.game.linkGlyphFlow.debugCount();
            }
        };

        // Toggle link glyph flow
        window.toggleLinkGlyphFlow = function () {
            if (window.game && window.game.linkGlyphFlow) {
                const newState = !window.game.linkGlyphFlow.enabled;
                window.game.linkGlyphFlow.setEnabled(newState);
                console.log(`✓ Link Glyph Flow 1.0 ${newState ? 'enabled' : 'disabled'}`);
            }
        };

        // Force refresh link glyph flow
        window.refreshLinkGlyphFlow = function () {
            if (window.game && window.game.linkGlyphFlow) {
                window.game.linkGlyphFlow.forceRefresh();
            }
        };

        // ========== COMPUTE SYNERGY SCORE 2.0 DEBUG COMMANDS ==========

        // Register ComputeSynergyScore2_0 globally
        if (computeSynergyScore) {
            window.ComputeSynergyScore2_0 = computeSynergyScore;
        }

        // Test synergy scoring on a category pair
        window.testSynergyPair = function (cat1, cat2) {
            if (window.ComputeSynergyScore2_0) {
                return window.ComputeSynergyScore2_0.tuning.testPair(cat1, cat2);
            } else {
                console.warn('⚠ ComputeSynergyScore2_0 not available');
            }
        };

        // Test all category pairs (full matrix)
        window.testAllSynergyPairs = function () {
            if (window.ComputeSynergyScore2_0) {
                return window.ComputeSynergyScore2_0.tuning.testAll();
            } else {
                console.warn('⚠ ComputeSynergyScore2_0 not available');
            }
        };

        // Enable synergy score debug logging
        window.enableSynergyDebug = function () {
            if (window.ComputeSynergyScore2_0) {
                window.ComputeSynergyScore2_0.tuning.debug = true;
                console.log('✓ ComputeSynergyScore2_0 debug logging enabled');
            } else {
                console.warn('⚠ ComputeSynergyScore2_0 not available');
            }
        };

        // Disable synergy score debug logging
        window.disableSynergyDebug = function () {
            if (window.ComputeSynergyScore2_0) {
                window.ComputeSynergyScore2_0.tuning.debug = false;
                console.log('✓ ComputeSynergyScore2_0 debug logging disabled');
            } else {
                console.warn('⚠ ComputeSynergyScore2_0 not available');
            }
        };

        // Get synergy score statistics (if available)
        window.getSynergyStats = function () {
            if (window.game && window.game.nodeLinkingSystem) {
                const allLinks = window.game.nodeLinkingSystem.links || [];
                const scores = allLinks
                    .map(link => ({
                        id: link.id || 'unknown',
                        score: link.synergyScore?.score || 0,
                        tier: link.synergyScore?.tier || 'unknown'
                    }))
                    .sort((a, b) => b.score - a.score);
                
                console.group('📊 Synergy Score Statistics');
                console.log(`Total Links: ${allLinks.length}`);
                console.log(`Links with Scores: ${scores.filter(s => s.score > 0).length}`);
                
                if (scores.length > 0) {
                    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
                    console.log(`Average Score: ${avgScore.toFixed(3)}`);
                    
                    const tiers = { low: 0, medium: 0, high: 0, critical: 0 };
                    scores.forEach(s => {
                        if (tiers[s.tier] !== undefined) tiers[s.tier]++;
                    });
                    console.log('Tier Distribution:', tiers);
                    
                    console.log('\nTop 10 Synergy Links:');
                    scores.slice(0, 10).forEach((s, i) => {
                        console.log(`  ${i + 1}. ${s.id} → ${s.score.toFixed(3)} [${s.tier}]`);
                    });
                }
                console.groupEnd();
            } else {
                console.warn('⚠ NodeLinkingSystem not available');
            }
        };

        console.log('✓ ComputeSynergyScore2_0 registered');
        console.log('  Commands: testSynergyPair() | testAllSynergyPairs() | getSynergyStats()');
        console.log('  Debug: enableSynergyDebug() | disableSynergyDebug()');

        // ========== LINK RECOMMENDATION AI 1.0 DEBUG COMMANDS ==========

        // Get recommendations for a node by name
        window.recommendFor = function (nodeName) {
            if (!window.game || !window.game.linkRecommendationAI) {
                console.warn('⚠ LinkRecommendationAI not available');
                return;
            }

            const nodes = window.game.aiNodes?.nodes || [];
            const node = nodes.find(n =>
                (n.userData?.name || n.name || n.id || '').toLowerCase().includes(nodeName.toLowerCase())
            );

            if (!node) {
                console.warn(`⚠ Node "${nodeName}" not found`);
                return;
            }

            window.game.linkRecommendationAI.updateRecommendations(node);
            window.game.linkRecommendationAI.debugDump();
        };

        // Get recommendations for currently selected node
        window.recommendActive = function () {
            if (!window.game || !window.game.linkRecommendationAI) {
                console.warn('⚠ LinkRecommendationAI not available');
                return;
            }

            // Try to get selected node from NodeSelectionCore3_4
            const selectedNode = window.game.selectedNode;
            if (!selectedNode) {
                console.warn('⚠ No node currently selected. Use recommendFor(nodeName) instead.');
                return;
            }

            window.game.linkRecommendationAI.updateRecommendations(selectedNode);
            window.game.linkRecommendationAI.debugDump();
        };

        // Print current recommendations
        window.printRecommendations = function () {
            if (!window.game || !window.game.linkRecommendationAI) {
                console.warn('⚠ LinkRecommendationAI not available');
                return;
            }

            window.game.linkRecommendationAI.debugDump();
        };

        // Get recommendation statistics
        window.getRecommendationStats = function () {
            if (!window.game || !window.game.linkRecommendationAI) {
                console.warn('⚠ LinkRecommendationAI not available');
                return;
            }

            const stats = window.game.linkRecommendationAI.getStats();
            console.group('🤖 Link Recommendation AI Statistics');
            console.log('Active Node:', stats.activeNodeName);
            console.log('Candidates:', stats.candidateCount);
            console.log('Total Recommendations:', stats.totalRecommendations);
            console.log('Average Update Time:', stats.averageUpdateTime.toFixed(3) + 'ms');
            console.log('Max Update Time:', stats.maxUpdateTime.toFixed(3) + 'ms');
            console.log('Errors:', stats.errors);
            console.log('Config:', stats.config);
            console.groupEnd();
        };

        // Enable/disable recommendation AI
        window.enableRecommendationAI = function () {
            if (window.game && window.game.linkRecommendationAI) {
                window.game.linkRecommendationAI.setEnabled(true);
                console.log('✓ LinkRecommendationAI enabled');
            } else {
                console.warn('⚠ LinkRecommendationAI not available');
            }
        };

        window.disableRecommendationAI = function () {
            if (window.game && window.game.linkRecommendationAI) {
                window.game.linkRecommendationAI.setEnabled(false);
                console.log('✓ LinkRecommendationAI disabled');
            } else {
                console.warn('⚠ LinkRecommendationAI not available');
            }
        };

        console.log('✓ LinkRecommendationAI1_0 registered');
        console.log('  Commands: recommendFor(name) | recommendActive() | printRecommendations() | getRecommendationStats()');
        console.log('  Control: enableRecommendationAI() | disableRecommendationAI()');

        // ========== LINK AUTOMATION ENGINE 1.0 DEBUG COMMANDS ==========

        // Auto-link for currently selected node
        window.autoLinkActive = function () {
            if (!window.game || !window.game.linkAutomationEngine) {
                console.warn('⚠ LinkAutomationEngine not available');
                return;
            }

            const selectedNode = window.game.selectedNode;
            if (!selectedNode) {
                console.warn('⚠ No node currently selected');
                return;
            }

            const result = window.game.linkAutomationEngine.autoLinkFor(selectedNode);
            console.group('[AutoLink] Results');
            console.log(`Created: ${result.created}`);
            console.log(`Skipped: ${result.skipped}`);
            console.log(`Total Candidates: ${result.total}`);
            if (result.links.length > 0) {
                console.log('Links Created:');
                result.links.forEach(link => {
                    console.log(`  → ${link.sourceCategory} → ${link.targetCategory} (${link.synergyScore.toFixed(3)})`);
                });
            }
            if (result.reason !== 'ok') {
                console.log('Reason:', result.reason);
            }
            console.groupEnd();
        };

        // Preview what WOULD be created (without creating)
        window.previewAutoLink = function () {
            if (!window.game || !window.game.linkAutomationEngine) {
                console.warn('⚠ LinkAutomationEngine not available');
                return;
            }

            const selectedNode = window.game.selectedNode;
            if (!selectedNode) {
                console.warn('⚠ No node currently selected');
                return;
            }

            const preview = window.game.linkAutomationEngine.preview(selectedNode);
            console.group('[AutoLink] Preview (No Changes Made)');
            console.log(`Would Create: ${preview.wouldCreate} links`);
            if (preview.suggestions.length > 0) {
                console.log('Suggested Links:');
                preview.suggestions.forEach((suggestion, i) => {
                    console.log(`  ${i + 1}. → ${suggestion.targetCategory} (${suggestion.synergyScore})`);
                });
            }
            if (preview.reason !== 'ok') {
                console.log('Reason:', preview.reason);
            }
            console.groupEnd();
        };

        // Enable automation
        window.enableAutoLink = function () {
            if (window.game && window.game.linkAutomationEngine) {
                window.game.linkAutomationEngine.enable();
                console.log('✓ LinkAutomationEngine enabled');
            } else {
                console.warn('⚠ LinkAutomationEngine not available');
            }
        };

        // Disable automation
        window.disableAutoLink = function () {
            if (window.game && window.game.linkAutomationEngine) {
                window.game.linkAutomationEngine.disable();
                console.log('✓ LinkAutomationEngine disabled');
            } else {
                console.warn('⚠ LinkAutomationEngine not available');
            }
        };

        // Toggle automation
        window.toggleAutoLink = function () {
            if (window.game && window.game.linkAutomationEngine) {
                window.game.linkAutomationEngine.toggle();
                const state = window.game.linkAutomationEngine.isEnabled();
                console.log(`✓ LinkAutomationEngine toggled to ${state ? 'ENABLED' : 'DISABLED'}`);
            } else {
                console.warn('⚠ LinkAutomationEngine not available');
            }
        };

        // Get automation statistics
        window.getAutoLinkStats = function () {
            if (!window.game || !window.game.linkAutomationEngine) {
                console.warn('⚠ LinkAutomationEngine not available');
                return;
            }

            const stats = window.game.linkAutomationEngine.getStats();
            console.group('⚙️ Link Automation Engine Statistics');
            console.log('Status:', stats.config.enabled ? '✓ ENABLED' : '✗ DISABLED');
            console.log('Automation Threshold:', stats.config.automationThreshold);
            console.log('Max Links Per Cycle:', stats.config.maxLinksPerCycle);
            console.log('Safe Cooldown (ms):', stats.config.safetyCooldownMs);
            console.log('Cooldown Remaining (ms):', stats.cooldownRemaining);
            console.log('---');
            console.log('Total Auto-Links Created:', stats.totalAutoLinksCreated);
            console.log('Total Cycles:', stats.totalCycles);
            console.log('Average Links Per Cycle:', stats.averageLinksPerCycle.toFixed(2));
            console.log('Last Cycle Created:', stats.lastCycleCreated);
            console.log('Last Cycle Skipped:', stats.lastCycleSkipped);
            console.log('Last Execution Time:', stats.lastExecutionMs.toFixed(3) + 'ms');
            console.log('Total Previews:', stats.totalPreviews);
            console.groupEnd();
        };

        console.log('✓ LinkAutomationEngine1_0 registered');
        console.log('  Commands: autoLinkActive() | previewAutoLink() | getAutoLinkStats()');
        console.log('  Control: enableAutoLink() | disableAutoLink() | toggleAutoLink()');

        // ========== AUTO LINK FEEDBACK UI 1.0 DEBUG COMMANDS ==========

        // Check if feedback UI is active
        window.feedbackUIActive = function () {
            if (!window.game || !window.game.autoLinkFeedbackUI) {
                console.warn('⚠ AutoLinkFeedbackUI not available');
                return;
            }

            const stats = window.game.autoLinkFeedbackUI.getStats();
            console.group('📊 Auto Link Feedback UI Status');
            console.log('Active:', stats.isActive ? '✓ YES' : '✗ NO');
            console.log('Total Feedbacks Triggered:', stats.feedbacksTriggered);
            console.log('Total Feedbacks Processed:', stats.feedbacksProcessed);
            console.log('Pulses Created:', stats.pulsesCreated);
            console.log('Tooltips Created:', stats.tooltipsCreated);
            console.log('HUD Notifications Shown:', stats.hudNotificationsShown);
            console.log('---');
            console.log('Active Pulses:', stats.activePulses);
            console.log('Active Tooltips:', stats.activeTooltips);
            console.log('HUD Queue:', stats.hudNotificationsQueued);
            console.log('Cooldown Remaining (ms):', stats.cooldownRemainingMs);
            console.groupEnd();
        };

        // Test all feedback effects
        window.testAutoLinkFeedback = function () {
            if (!window.game || !window.game.autoLinkFeedbackUI) {
                console.warn('⚠ AutoLinkFeedbackUI not available');
                return;
            }

            console.log('🧪 Testing Auto Link Feedback effects...');
            window.game.autoLinkFeedbackUI.testAllEffects();
        };

        // Enable feedback UI
        window.enableFeedbackUI = function () {
            if (window.game && window.game.autoLinkFeedbackUI) {
                window.game.autoLinkFeedbackUI.enable();
                console.log('✓ AutoLinkFeedbackUI enabled');
            } else {
                console.warn('⚠ AutoLinkFeedbackUI not available');
            }
        };

        // Disable feedback UI
        window.disableFeedbackUI = function () {
            if (window.game && window.game.autoLinkFeedbackUI) {
                window.game.autoLinkFeedbackUI.disable();
                console.log('✓ AutoLinkFeedbackUI disabled');
            } else {
                console.warn('⚠ AutoLinkFeedbackUI not available');
            }
        };

        // Toggle feedback UI
        window.toggleFeedbackUI = function () {
            if (window.game && window.game.autoLinkFeedbackUI) {
                window.game.autoLinkFeedbackUI.toggle();
                const state = window.game.autoLinkFeedbackUI.isActive;
                console.log(`✓ AutoLinkFeedbackUI toggled to ${state ? 'ENABLED' : 'DISABLED'}`);
            } else {
                console.warn('⚠ AutoLinkFeedbackUI not available');
            }
        };

        // Clear all active feedback effects
        window.clearAutoLinkFeedback = function () {
            if (window.game && window.game.autoLinkFeedbackUI) {
                window.game.autoLinkFeedbackUI.clearAll();
                console.log('✓ All auto-link feedback effects cleared');
            } else {
                console.warn('⚠ AutoLinkFeedbackUI not available');
            }
        };

        console.log('✓ AutoLinkFeedbackUI1_0 registered');
        console.log('  Commands: feedbackUIActive() | testAutoLinkFeedback() | clearAutoLinkFeedback()');
        console.log('  Control: enableFeedbackUI() | disableFeedbackUI() | toggleFeedbackUI()');

        // ========== SYNERGY RECOMMENDATION DEBUG HUD 1.0 COMMANDS ==========

        // Toggle debug HUD visibility
        window.toggleSynergyDebug = function () {
            if (!window.game || !window.game.synergyDebugHUD) {
                console.warn('⚠ SynergyRecommendationDebugHUD not available');
                return;
            }

            window.game.synergyDebugHUD.toggle();
            const state = window.game.synergyDebugHUD.visible;
            console.log(`✓ Synergy Debug HUD toggled to ${state ? 'VISIBLE' : 'HIDDEN'}`);
        };

        // Show debug HUD
        window.showSynergyDebug = function () {
            if (window.game && window.game.synergyDebugHUD) {
                window.game.synergyDebugHUD.show();
                console.log('✓ Synergy Debug HUD shown');
            } else {
                console.warn('⚠ SynergyRecommendationDebugHUD not available');
            }
        };

        // Hide debug HUD
        window.hideSynergyDebug = function () {
            if (window.game && window.game.synergyDebugHUD) {
                window.game.synergyDebugHUD.hide();
                console.log('✓ Synergy Debug HUD hidden');
            } else {
                console.warn('⚠ SynergyRecommendationDebugHUD not available');
            }
        };

        // Get debug HUD statistics
        window.getSynergyDebugStats = function () {
            if (!window.game || !window.game.synergyDebugHUD) {
                console.warn('⚠ SynergyRecommendationDebugHUD not available');
                return;
            }

            const stats = window.game.synergyDebugHUD.getStats();
            console.group('⚡ Synergy Debug HUD Statistics');
            console.log('HUD Visible:', stats.hudVisible ? '✓ YES' : '✗ NO');
            console.log('Refresh Interval:', stats.hudRefreshInterval + 'ms');
            console.log('Recommendation Count:', stats.recommendationCount);
            console.log('---');
            console.log('AI Stats:', stats.aiStats);
            console.log('Automation Stats:', stats.automationStats);
            console.groupEnd();
        };

        // Set debug HUD refresh interval
        window.setSynergyDebugRefresh = function (ms) {
            if (!window.game || !window.game.synergyDebugHUD) {
                console.warn('⚠ SynergyRecommendationDebugHUD not available');
                return;
            }

            if (typeof ms !== 'number' || ms < 100) {
                console.warn('⚠ Refresh interval must be >= 100ms');
                return;
            }

            window.game.synergyDebugHUD.setRefreshInterval(ms);
            console.log(`✓ Synergy Debug HUD refresh interval set to ${ms}ms`);
        };

        console.log('✓ SynergyRecommendationDebugHUD1_0 registered');
        console.log('  Commands: toggleSynergyDebug() | showSynergyDebug() | hideSynergyDebug() | getSynergyDebugStats()');
        console.log('  Control: setSynergyDebugRefresh(ms)');

        // ========== LINK QUALITY PREDICTOR 1.0 DEBUG COMMANDS ==========

        // Compute quality for two nodes and explain
        window.computeLinkQuality = function (nodeNameA, nodeNameB) {
            if (!window.game || !window.game.linkQualityPredictor) {
                console.warn('⚠ LinkQualityPredictor not available');
                return;
            }

            // Try to find nodes by name
            let nodeA = null, nodeB = null;
            window.game.scene.traverse((obj) => {
                if (obj.userData?.code === nodeNameA || obj.userData?.name === nodeNameA || obj.name === nodeNameA) {
                    nodeA = obj;
                }
                if (obj.userData?.code === nodeNameB || obj.userData?.name === nodeNameB || obj.name === nodeNameB) {
                    nodeB = obj;
                }
            });

            if (!nodeA || !nodeB) {
                console.warn('⚠ Could not find both nodes. Use: computeLinkQuality("NODE_CODE_1", "NODE_CODE_2")');
                return;
            }

            const result = window.game.linkQualityPredictor.computeQuality(nodeA, nodeB);
            console.group('🔍 Link Quality Analysis');
            console.log('Quality Score:', `${result.quality}/100`);
            console.log('Explanation:', result.explanation.reason);
            console.log('Categories:', result.explanation.categories);
            console.log('Factors:', result.factors);
            console.log('Rationale:', result.explanation.factors);
            console.log('Execution Time:', result.executionMs.toFixed(2) + 'ms');
            console.groupEnd();
        };

        // Test quality matrix
        window.testQualityMatrix = function () {
            if (!window.game || !window.game.linkQualityPredictor) {
                console.warn('⚠ LinkQualityPredictor not available');
                return;
            }

            console.group('🧪 Link Quality Matrix Test');
            const predictor = window.game.linkQualityPredictor;
            
            // Find diverse nodes
            const allNodes = [];
            window.game.scene.traverse((obj) => {
                if (obj.userData?.isAINode) allNodes.push(obj);
            });

            if (allNodes.length < 2) {
                console.warn('Not enough nodes to test');
                console.groupEnd();
                return;
            }

            // Test first few pairs
            const testPairs = Math.min(5, allNodes.length - 1);
            for (let i = 0; i < testPairs; i++) {
                const nodeA = allNodes[i];
                const nodeB = allNodes[i + 1];
                const result = predictor.computeQuality(nodeA, nodeB);
                
                console.log(`${i + 1}. ${nodeA.userData?.code || 'NODE'} → ${nodeB.userData?.code || 'NODE'}: ${result.quality}% (${result.explanation.reason})`);
            }

            console.groupEnd();
        };

        // Test random candidates
        window.testRandomCandidates = function () {
            if (!window.game || !window.game.linkQualityPredictor) {
                console.warn('⚠ LinkQualityPredictor not available');
                return;
            }

            console.group('🎲 Random Candidate Test');
            const predictor = window.game.linkQualityPredictor;
            
            const allNodes = [];
            window.game.scene.traverse((obj) => {
                if (obj.userData?.isAINode) allNodes.push(obj);
            });

            if (allNodes.length < 2) {
                console.warn('Not enough nodes');
                console.groupEnd();
                return;
            }

            // Generate random pairs
            const candidates = [];
            for (let i = 0; i < 5; i++) {
                const a = Math.floor(Math.random() * allNodes.length);
                let b = Math.floor(Math.random() * allNodes.length);
                while (b === a) b = Math.floor(Math.random() * allNodes.length);
                
                candidates.push({ nodeA: allNodes[a], nodeB: allNodes[b] });
            }

            const evaluated = predictor.evaluateCandidates(candidates);
            console.log('Top 5 Random Candidates (by quality):');
            evaluated.forEach((c, i) => {
                console.log(`${i + 1}. ${c.nodeA.userData?.code || 'A'} → ${c.nodeB.userData?.code || 'B'}: ${c.quality}% ✓`);
            });

            console.groupEnd();
        };

        // Get quality predictor stats
        window.getQualityStats = function () {
            if (!window.game || !window.game.linkQualityPredictor) {
                console.warn('⚠ LinkQualityPredictor not available');
                return;
            }

            const stats = window.game.linkQualityPredictor.getStats();
            console.group('📊 Link Quality Predictor Statistics');
            console.log('Total Evaluations:', stats.totalEvaluations);
            console.log('Average Quality:', stats.averageQuality + '%');
            console.log('Excellent Matches:', stats.excellentCount);
            console.log('Good Matches:', stats.goodCount);
            console.log('Fair Matches:', stats.fairCount);
            console.log('Poor Matches:', stats.poorCount);
            console.groupEnd();
        };

        // Set automation quality threshold
        window.setQualityThreshold = function (threshold) {
            if (!window.game || !window.game.linkQualityPredictor) {
                console.warn('⚠ LinkQualityPredictor not available');
                return;
            }

            if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
                console.warn('⚠ Threshold must be 0-100');
                return;
            }

            window.game.linkQualityPredictor.setAutomationThreshold(threshold);
            console.log(`✓ Quality threshold for automation set to ${threshold}`);
        };

        console.log('✓ LinkQualityPredictor1_0 registered');
        console.log('  Commands: computeLinkQuality(nodeA, nodeB) | testQualityMatrix() | testRandomCandidates() | getQualityStats()');
        console.log('  Control: setQualityThreshold(0-100)');

        // ====================================================================
        // LINK PRIORITY DECAY ENGINE 1.0 CONSOLE API (Session 27 Extended)
        // ====================================================================
        
        // Get decay engine status
        window.getDecayEngineStatus = function () {
            if (!window.game || !window.game.linkPriorityDecayEngine) {
                console.warn('⚠ LinkPriorityDecayEngine not available');
                return;
            }
            const engine = window.game.linkPriorityDecayEngine;
            console.group('📊 Link Priority Decay Engine Status');
            console.log('Active:', engine.isActive?.() ?? 'N/A');
            console.log('Total Links:', engine.getTotalLinks?.() ?? 0);
            console.log('Decayed Links:', engine.getDecayedLinksCount?.() ?? 0);
            console.log('Average Priority:', (engine.getAveragePriority?.() ?? 0).toFixed(2));
            console.log('Decay Rate (%):', (engine.decayRatePercent ?? 1).toFixed(2));
            console.log('Half-Life (seconds):', engine.halfLifeSeconds ?? 60);
            console.groupEnd();
        };

        // Get individual link decay stats
        window.getDecayStats = function (nodeAId, nodeBId) {
            if (!window.game || !window.game.linkPriorityDecayEngine) {
                console.warn('⚠ LinkPriorityDecayEngine not available');
                return;
            }
            if (!nodeAId || !nodeBId) {
                console.warn('⚠ Usage: getDecayStats(nodeAId, nodeBId)');
                return;
            }
            const stats = window.game.linkPriorityDecayEngine.getDecayStats?.(nodeAId, nodeBId);
            if (!stats) {
                console.warn(`⚠ No decay stats found for link ${nodeAId} → ${nodeBId}`);
                return;
            }
            console.group(`📉 Decay Stats: ${nodeAId} → ${nodeBId}`);
            console.log('Current Priority:', stats.currentPriority?.toFixed(2) ?? 'N/A');
            console.log('Initial Priority:', stats.initialPriority?.toFixed(2) ?? 'N/A');
            console.log('Age (seconds):', stats.ageSeconds?.toFixed(2) ?? 'N/A');
            console.log('Decay Applied (%):', stats.decayApplied?.toFixed(2) ?? 'N/A');
            console.log('Is Active:', stats.isActive ?? false);
            console.groupEnd();
        };

        // Reset all link priorities
        window.resetAllPriorities = function () {
            if (!window.game || !window.game.linkPriorityDecayEngine) {
                console.warn('⚠ LinkPriorityDecayEngine not available');
                return;
            }
            window.game.linkPriorityDecayEngine.resetAllPriorities?.();
            console.log('✓ All link priorities reset to 100');
        };

        // Set custom decay rate
        window.setDecayRate = function (ratePercent) {
            if (!window.game || !window.game.linkPriorityDecayEngine) {
                console.warn('⚠ LinkPriorityDecayEngine not available');
                return;
            }
            if (typeof ratePercent !== 'number' || ratePercent < 0 || ratePercent > 100) {
                console.warn('⚠ Decay rate must be 0-100 (percent per second)');
                return;
            }
            window.game.linkPriorityDecayEngine.setDecayRate?.(ratePercent);
            console.log(`✓ Decay rate set to ${ratePercent}% per second`);
        };

        // Set custom half-life
        window.setDecayHalfLife = function (seconds) {
            if (!window.game || !window.game.linkPriorityDecayEngine) {
                console.warn('⚠ LinkPriorityDecayEngine not available');
                return;
            }
            if (typeof seconds !== 'number' || seconds < 1) {
                console.warn('⚠ Half-life must be >= 1 second');
                return;
            }
            window.game.linkPriorityDecayEngine.setHalfLife?.(seconds);
            console.log(`✓ Decay half-life set to ${seconds} seconds`);
        };

        console.log('✓ LinkPriorityDecayEngine registered');
        console.log('  Status: getDecayEngineStatus() | getDecayStats(nodeA, nodeB)');
        console.log('  Control: resetAllPriorities() | setDecayRate(0-100) | setDecayHalfLife(seconds)');
        
        // [Session 144+] Node Linked Aura System Commands
        window.enableNodeAuras = () => {
            if (this.nodeAuraSystem) {
                this.nodeAuraSystem.setEnabled(true);
            } else {
                console.warn('⚠ Node Aura System not initialized');
            }
        };
        
        window.disableNodeAuras = () => {
            if (this.nodeAuraSystem) {
                this.nodeAuraSystem.setEnabled(false);
            } else {
                console.warn('⚠ Node Aura System not initialized');
            }
        };
        
        window.toggleNodeAuraDebug = () => {
            if (this.nodeAuraSystem) {
                const debugMode = this.nodeAuraSystem.toggleDebug();
                console.log(`[NodeAura] Debug mode: ${debugMode ? 'ON (wireframe + bounds)' : 'OFF'}`);
                return debugMode;
            } else {
                console.warn('⚠ Node Aura System not initialized');
                return false;
            }
        };
        
        window.nodeAuraStatus = () => {
            if (this.nodeAuraSystem) {
                const status = this.nodeAuraSystem.getStatus();
                console.group('🌀 Node Linked Aura System Status');
                console.log('Enabled:', status.enabled);
                console.log('Active Auras:', status.activeAuras);
                console.log('Active Boosts (Link Spikes):', status.activeSpikes);
                console.log('Corrupted Auras:', status.corruptedAuras, '(Max influence:', status.maxCorruptionInfluence + ')');
                console.log('Harmonized Auras:', status.harmonizedAuras, '(Max stabilization:', status.maxHarmonyStabilization + ')');
                console.log('Last Update Time:', status.lastUpdateTime);
                console.log('Avg Update Time:', status.avgUpdateTime);
                console.log('Debug Mode:', status.debugMode);
                console.groupEnd();
                return status;
            } else {
                console.warn('⚠ Node Aura System not initialized');
                return null;
            }
        };
        
        console.log('\n🌀 Node Linked Aura System Commands:');
        console.log('  - enableNodeAuras() — Enable living auras on linked nodes');
        console.log('  - disableNodeAuras() — Disable aura system');
        console.log('  - toggleNodeAuraDebug() — Toggle wireframe debug view');
        console.log('  - nodeAuraStatus() — Show system status and metrics');
    }
}

// ============================================================================
// [UTILITY] Node identity helpers (debug-only, behavior-preserving)
// ============================================================================
function getNodeIdentity(node) {
    if (!node) return null;
    const ud = node.userData || {};
    return ud.id || ud.nodeId || node.uuid || null;
}

function debugNodeIdentity(node) {
    if (!node) {
        console.log('[debugNodeIdentity] node is null/undefined');
        return null;
    }
    const ud = node.userData || {};
    const chosen = getNodeIdentity(node);
    console.log('[debugNodeIdentity]', {
        id: ud.id,
        nodeId: ud.nodeId,
        uuid: node.uuid,
        chosen
    });
    return chosen;
}

if (typeof window !== 'undefined') {
    window.getNodeIdentity = getNodeIdentity;
    window.debugNodeIdentity = debugNodeIdentity;
}

// ============================================================================
// [HUD SAFETY] REMOVE LEGACY AUTOMATION HUD (UI-only cleanup)
// ============================================================================





// ============================================================================
// [BOOT] START GAME INSTANCE
// ============================================================================
console.log('[BOOT] Starting AtomaGame instance...');

new AtomaGame();
console.log('[BOOT] main.js execution completed');
