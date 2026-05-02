Here is the complete list of 50 FIX files from the FX Contract Audit, sorted by risk (LOW → MID):

LOW Risk (0–1) — 9 files
File	Category	Owner	Failure

_AIThoughtStorms2_0.js	LINK FX	UNKNOWN	OWNER: No known owner
_ExtremeAINodePack.js	NODE FX	main.js	UPDATE: No update() method
DreamDesert2.js	PARTICLE FX	main.js	DEBUG: 12 console calls without debug flag
HarmonicHubLifecycle.js	CASCADE/WAVE	UNKNOWN	OWNER: No known owner
LinkPointFXBase.js	SHADER/MATERIAL	LinkRendererConduit	UPDATE: No update() method
MetricsRuntime_v1.js	CASCADE/WAVE	main.js	DEBUG: 17 console calls without debug flag
NodeImpactManager.js	PARTICLE FX	main.js	OWNER: No known owner
TIER4_CorruptionFeedbackVisuals_v1.js	SHADER/MATERIAL	main.js	DEBUG: 6 console calls without debug flag
MID Risk (2) — 16 files
File	Category	Owner	Failure
_AINarrativePatterns6_0.js	NODE FX	main.js	BUDGET: No budget cap
_AmbientEntityManager.js	LINK FX	main.js	BUDGET: No budget cap
_ExtremeAIShaderPack.js	NODE FX	UNKNOWN	BUDGET: No budget cap, LIFETIME: No lifetime management
_LinkedGlyphSynchronization1_0.js	LINK FX	main.js	BUDGET: No budget cap
_SafeLegendaryWorldEvents.js	ENVIRONMENT FX	main.js	BUDGET: No budget cap
_SemanticGlyphAI.js	NODE FX	main.js	BUDGET: No budget cap
AIConsciousnessLayer.js	PARTICLE FX	main.js	BUDGET: No budget cap
ArchetypeShaderModes_v1.js	SHADER/MATERIAL	main.js	BUDGET: No budget cap
CinematicUpgrade.js	PARTICLE FX	main.js	BUDGET: No budget cap
CompositeGlyphGenerator.js	CASCADE/WAVE	UNKNOWN	UPDATE: No update(), DEBUG: 6 console calls
EchoRippleSystem_Session125.js	CASCADE/WAVE	UNKNOWN	PURPOSE: No purpose documentation
EnvironmentalHazards.js	ENVIRONMENT FX	main.js	GATE: CRITICAL frameScheduler optional-chain bug
HarmonicHealingVisualSystem_Session134.js	LINK FX	main.js	BUDGET: No budget cap
HarmonicHubSync.js	NODE FX	UNKNOWN	BUDGET: No budget cap
HarmonicRecoveryVisualSystem_Session138.js	SHADER/MATERIAL	main.js	BUDGET: No budget cap
LinkRingArcDischarges.js	PARTICLE FX	LinkRendererConduit	BUDGET: No budget cap
LinkSemanticPictogramSystem_WithFusion.js	LINK FX	LinkRendererConduit	BUDGET: No budget cap
NodeEditor.js	LINK FX	main.js	GATE: CRITICAL frameScheduler optional-chain bug
NodeInterferenceManager.js	LINK FX	main.js	BUDGET: No budget cap
NodeSegmentedOrbitRings.js	SHADER/MATERIAL	main.js	GATE: No gate mechanism
PulseIntersectionImpulseAdapter_v1.js	PARTICLE FX	UNKNOWN	BUDGET: No budget cap
ResonanceEchoTrailSystem.js	SHADER/MATERIAL	main.js	GATE: CRITICAL frameScheduler optional-chain bug
SafeDreamDepthPack.js	ENVIRONMENT FX	main.js	BUDGET: No budget cap
SafeQuantumIllusionsPack1.js	ENVIRONMENT FX	main.js	BUDGET: No budget cap
MID Risk (3) — 25 files
File	Category	Owner	Failure
_AdaptiveGlyphRendering1_0.js	NODE FX	main.js	DISPOSE: No dispose() method
_MythicRitualController.js	PARTICLE FX	main.js	BUDGET: No budget cap, DEBUG: 11 console calls
BeadDebugUtils.js	LINK FX	UNKNOWN	UPDATE: No update(), BUDGET: No budget cap
CascadingRuptureSystem.js	CASCADE/WAVE	main.js	GATE: CRITICAL frameScheduler bug, DEBUG: 7 console calls
CorruptionVisualFX_v1.js	SHADER/MATERIAL	main.js	UPDATE: No update() method
CriticalNodeFailureSystem.js	LINK FX	main.js	GATE: CRITICAL frameScheduler bug, DEBUG: 8 console calls
EventVisualSuppression_v1.js	NODE FX	UNKNOWN	OWNER: No known owner, GATE: No gate mechanism
LinkVisualStateAdapter.js	SHADER/MATERIAL	LinkRendererConduit	OWNER: No known owner, BUDGET: No budget cap
PHASE5_CascadeVisuals.js	LINK FX	main.js	GATE: CRITICAL frameScheduler bug, DEBUG: 35 console calls
PostProcessing.js	SHADER/MATERIAL	UNKNOWN	UPDATE: No update() method
ResonanceFeedback_v1.js	SHADER/MATERIAL	main.js	DEBUG: 14 console calls without debug flag
SafeWorldResetFix1_0.js	LINK FX	main.js	BUDGET: No budget cap, DEBUG: 62 console calls
SimulationEffectOrchestrator.js	NODE FX	main.js	BUDGET: No budget cap, DEBUG: 7 console calls
SystemStateOverlay.js	UNKNOWN	main.js	BUDGET: No budget cap, DEBUG: 14 console calls
TemporalEventEffects.js	SHADER/MATERIAL	UNKNOWN	DEBUG: 4 console calls without debug flag
VisualEchoTrails_v1_Integration.js	SHADER/MATERIAL	main.js	UPDATE: No update(), BUDGET: No budget cap
WaveDynamicsShaderPack_v1.js	SHADER/MATERIAL	main.js	OWNER: No known owner, BUDGET: No budget cap
Top patterns in FIX files:

BUDGET missing — ~30 files (add maxCount / poolSize constant)
DEBUG unguarded console calls — ~15 files (wrap in if (this.debug))
GATE missing / frameScheduler bug — ~8 files (fix ?.shouldRunVisual?.() anti-pattern)
UPDATE missing — ~6 files (event-driven only, may be acceptable)
OWNER unknown — ~8 files (cross-reference with main.js / EnvironmentDomainController.js)