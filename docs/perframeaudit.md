Per-Frame Execution Map (main.js → animate())

Function	Category	Why it runs per frame	Risk
updateValidator.startFrame/endFrame	B	Frame instrumentation called at loop start/end	LOW
FrameClock.tick	B	Timekeeping each RAF	LOW
requestAnimationFrame→animate	B	Schedules next frame	LOW
frameScheduler.tick	C	Runs registered layer tasks every frame	MEDIUM
cameraController.update	B	Player view step each frame	LOW
playerController.update	B	Movement + input each frame	LOW
cameraPolishPack.update / cameraPolishPack3.update	B	Camera smoothing every frame	LOW
worldStabilityPack.enforceWorldLock	B	Constant transform lock	LOW
shakeObliterationPack.update	B	Per-frame shake guard	LOW
pulseReducerPack.update	B	Per-frame pulse clamp	LOW
activeWorld.update	C	World-level per-frame logic	MEDIUM
visualSuperpack.update	C	Visual bundle tick	MEDIUM
cinematicUpgrade.update	C	Cinematic FX tick	MEDIUM
sigmaNodes.forEach(node.update)	D (all nodes)	Iterates every Sigma node each frame	HIGH
quantumNodes.forEach(node.update)	D (all nodes)	Iterates every Quantum node each frame	HIGH
nodeEditor.update	B	UI editor tick	LOW
hazards.update + hazards.getHazardEffect	C	Hazard logic each frame; per player check	MEDIUM
aiNodes.update	D (all nodes)	Walks all AI nodes for activation/visuals	HIGH
aiNodes.updateSpawning	C	Spawn manager per frame	MEDIUM
relaxNodeMetrics (every 60f)	D (all nodes, periodic)	Loops all nodes for metric relaxation	MEDIUM
updateNodeUI (≈10 Hz)	B	UI refresh gated to 0.1 s	LOW
nodeAuraSystem.update	D (all nodes)	Aura loop over all nodes	HIGH
updateUndoRedoUI (≈10 Hz)	B	UI refresh	LOW
safeTick(linkCorruptionTransmission)	C	Per-frame system tick	MEDIUM
safeTick(harmonyStabilizationSystem)	C	Per-frame system tick	MEDIUM
effectOrchestrator.tick	C	Central effect dispatcher each frame	MEDIUM
visualHierarchyCorrection.update	C	Visual enforcement each frame	MEDIUM
auraModulationIntegration.update	C	Aura modulation each frame	MEDIUM
dynamicLinkColorSystem.update	D (all links)	Colors every link	HIGH
linkQualityCalculator.update	D (all links)	Computes quality per link	HIGH
linkDegradationSystem.update	D (all links)	Applies degradation per link	HIGH
linkCollapseSystem.update	D (all links)	Collapse checks per link	HIGH
nodeShellSizeAuthority.enforceShellSizes	D (all nodes)	Enforces shell sizes scene-wide	HIGH
particleEmissionScaler.update	D (links/nodes)	Particle rates per link	HIGH
linkMetricsToVisualBridge.update	D (all links)	Shader metric wiring per link	HIGH
stressBasedParticleScaler.update	D (all links)	Stress-based emission	HIGH
cascadeVisualizer.update	C	Visual cascade step	MEDIUM
synergyPulseVisuals.update	A	Uses avg synergy only	LOW
visualNetworkTimeElasticity.update	A	Time-uniform updates	LOW
harmonicResonanceCoupling.update	B	Uses avg synergy	LOW
harmonicHubAuraSystem.update	D (all nodes)	Aura over node list	HIGH
harmonicInfluencePropagation.update	D (all nodes)	Propagation sweep	HIGH
harmonicCascadeAmplification.update	D (nodes)	Cascade gain sweep	HIGH
audioSystem.playSynergy*	B	Threshold checks	LOW
echoTrailsIntegration.updateAllMaterials	C	Material sweep per frame	MEDIUM
coreMaterialMutationDetector.checkAllCores (every 60f)	C	Material scan batch	MEDIUM
coreMaterialPropertyLock.enforceFrame	D (all materials)	Enforces locks every frame	HIGH
metricsRuntime_v1.update (30 Hz)	C	Metrics orchestration	MEDIUM
nodeEditorRuntime_v1 / inputRuntime_v1.update (30 Hz)	B	Runtime helpers	LOW
personalityRuntime_v1.update (30 Hz)	C	Personality orchestrator	MEDIUM
personalityVisualAdapter.update (30 Hz, nodes)	D	Per-node visual signals	HIGH
fxPerformanceScaler.update (30 Hz)	B	Global multipliers	LOW
adaptivePerformanceMonitor.update (30 Hz)	B	FPS monitor	LOW
fxPerformanceTransition.update (30 Hz)	B	Transition smoothing	LOW
personalityVFXLayer.update (30 Hz, nodes)	D	Per-node FX	HIGH
personalityShaderBridge.update (30 Hz)	C	Shader uniform push	MEDIUM
advancedShaderFX.update (30 Hz)	C	GPU distortion drive	MEDIUM
archetypeCurves.update (30 Hz, nodes)	D	Per-node curves	HIGH
archetypeAuraFX.update (30 Hz, nodes)	D	Aura per node	HIGH
archetypeColorFX.update (30 Hz, nodes)	D	Color per node	HIGH
archetypeShaderModes.update (30 Hz)	C	Shader mode switcher	MEDIUM
nodeShaderActivation.update (30 Hz)	B	Selection shader boost	LOW
linkPersonalityStateMachine.update (links)	D	Per-link state	HIGH
synergyBonusVisualization.update (links)	D	Per-link bonuses	HIGH
synergyBonusFXLayer.update (links)	D	Per-link shader uniforms	HIGH
synergyResonanceShaderPack.update (links)	C	Shader uniforms per material	MEDIUM
resonanceFeedback.update (nodes+links)	D	Network-wide resonance sweep	HIGH
synergyChainReaction.update (nodes+links)	D	Cascade propagation	HIGH
synergyCascadeFXBridge.update (nodes+links)	D	Event → shader bridge	HIGH
waveInterferenceEngine.update (nodes+links BFS)	D (nested)	Wave propagation across network	EXTREME
synapticGatingAdapter.updateNodeGates (nodes)	D	Gate strength per node	HIGH
pulseWaveSystemBridge.update (links + wave data)	D	Pulse positions across links	HIGH
pulseBoundaryInteractionAdapter.update (links+nodes)	D	Boundary effects	HIGH
synapticFatigueAdapter.updateFatigue (nodes)	D	Fatigue accumulation	HIGH
synapticSpecializationAdapter.updateSpecialization (nodes)	D	Specialization per node	HIGH
waveShaderBridge.update (nodes+links, if enabled)	D	Uniforms for all	HIGH
waveTravelShaderPack.update (time only)	A	Time uniform	LOW
waveDynamicsShaderPack.update (time only)	A	Time uniform	LOW
particleEmitter.update (nodes+links)	D	Particle emission per link/node	HIGH
cascadeParticleEmissionBoost.update (links)	D	Boost per link	HIGH
cascadeParticleColorTinting.update (links)	D	Color per link	HIGH
cascadeParticleSystem.update (links/particles)	D	Particle simulate	HIGH
particleSemanticDensity.update (links)	D	Density calc per link	HIGH
influenceAttenuationAbsorption.update	D (nodes+links)	Influence sweep	HIGH
influenceReflection.update	D (nodes+links)	Reflection sweep	HIGH
standingWaveTrap.update	D (nodes+links)	Standing-wave calc	HIGH
standingWaveRenderer.update	C	Renders trap outputs	MEDIUM
waveInterference.update	D	Wave visuals over network	HIGH
resonanceRupture.update	C	Rupture detection	MEDIUM
harmonicAudio/healingParticles/harmonicHealing (safeTick)	C	Healing effects per frame	MEDIUM
cascadeAccelSetup.update	D	Cascade acceleration over network	HIGH
microImpulseAdapter.update	C	Event impulses	MEDIUM
pulseIntersectionAdapter.update	C	Intersection impulses	MEDIUM
neuralLinkVis.update (links)	D	Bezier link update per active link	HIGH
nodePersonalitySystem.update (nodes)	D	Personality per node	HIGH
nodeMicroEvents.update (nodes)	D	Micro-events per node	HIGH
worldPersonalityController.update (nodes)	D	World mood per node	HIGH
mythicRitualController.update (nodes)	D	Ritual logic per node	HIGH
mythicNodeCreation.update	C	Creation sequence per frame	MEDIUM
phase8RitualOrchestration.update	B	Ritual visuals (dt)	LOW
mythicSeedGlyph.scanAndApplyGlyphs (5 Hz, nodes)	D	Scans all nodes periodically	MEDIUM
mythicSeedGlyph.update	C	Animation	LOW
glyphSystem.update	C	Glyph visuals	MEDIUM
glyphSystem4.update (nodes)	D	Glyphs over all nodes	HIGH
glyphLayer4.update	C	Layer animation	MEDIUM
compositeResonanceFeedback.update/applyGlyphAnimationInfluence	C	Resonance visuals	MEDIUM
semanticGlyphAI.update (nodes)	D	AI glyph over nodes	HIGH
glyphFusionOverlay.update	C	Overlay animation	MEDIUM
proceduralMeaningEngine.update (nodes)	D	Meaning per node	HIGH
linkGlyphFlow.update	C	Link glyph animations	MEDIUM
adaptiveGlyphRendering.update (nodes)	D	Metric-driven glyphs per node	HIGH
linkedGlyphSync.update (nodes+links)	D	Sync glyphs across links	HIGH
linkedGlyphMessaging.update (nodes+links)	D	Messaging across network	HIGH
recursiveGlyphMessaging.update (nodes+links)	D	Recursive chains	EXTREME
emergentThoughtStorms.update (nodes+links)	D	Chain collisions	EXTREME
narrativePatterns.update (nodes+links)	D	Narrative layer over network	HIGH
linkingSystem.update + updateLinkingUI	D (links)	Core link update each frame	HIGH
linkCorrelationEngine.tick (every frame, 3s cadence)	C	Engine tick scheduler	MEDIUM
hitProxySystem.update	D (nodes/links)	Proxy sync sweep	HIGH
linkPriorityDecayEngine.update	D (links)	Per-link decay	HIGH
t2CorruptionVisualIntegration.update	D (links)	Visual tint per link	HIGH
t2HarmonyVisualConsumer.update	D (nodes)	Harmony auras per node	HIGH
tier4GameplayIntegration.update	C	Visual/UI gameplay feedback	MEDIUM
phase5MultiNetworkOrchestrator.update	C	Multi-network sync	MEDIUM
phase5InterNetworkVisualizationBridge.update	C	Inter-network visuals	MEDIUM
phase5CascadePropagationVisuals.update	C	Cascade visuals	MEDIUM
phase5CascadeVisualizationBridge.update	C	Cascade detection visuals	MEDIUM
nodeHierarchyBridge.update	D (nodes)	Hierarchy positions sweep	HIGH
evolutionManager.update	D (nodes+links)	Evolution logic	HIGH
legendaryPack.update	D (nodes+links)	Legendary state sweep	HIGH
legendaryLinkFX.update	D (links)	FX per link	HIGH
worldEvents.update	C	Global events	MEDIUM
weatherPack.update	C	Weather visuals	MEDIUM
cameraFX.update	B	Camera FX	LOW
cameraAntiTilt._antiTiltUpdate	A	Simple tilt clamp	LOW
personalityFX.update	D (nodes+links)	Behavioral visuals	HIGH
worldFXPack.update	D (nodes+links)	Env FX sweep	HIGH
ambientEntityManager.updateSynergy+update	C	Spawner tick	MEDIUM
memoryTrails.update	C	Trail animation	MEDIUM
quantumIllusions.update	B	Time-based illusion	LOW
colonyManager.update	C	Colony systems	MEDIUM
dreamDepthPack.update + dreamDepthEffects.update	C	DOF/visuals	MEDIUM
mobilityPack.update	B	Movement augment	LOW
nodeVisuals4.update	D (nodes)	Premium node VFX per node	HIGH
rareNodeSpawner.update	C	Spawner	MEDIUM
nodeEvolution.update	D (nodes)	Evolution visuals	HIGH
evolvingLinkFX.update	D (links)	Link evolution sweep	HIGH
nodePersonality.update	D (nodes)	Personality signatures	HIGH
extremeShaderTestSuite.update	B	Diagnostics	LOW
newNodeCategories.update	D (nodes)	Category visuals	HIGH
newNodeVisuals.animate	D (nodes)	Category VFX	HIGH
extremeLinkVisuals.update	D (links)	Neon beams per link	HIGH
neuralCurveLinkVisuals.updateLink (loop links)	D	Iterates each active link	HIGH
extremeLinkVisuals4.update	D (links)	Curvature/depth FX	HIGH
linkVisualMoodSystem.update	D (links)	Mood transitions per link	HIGH
consciousnessLayer.update	D (nodes)	Thought visualization per node	HIGH
poetryEngine.update	B	Time-based text	LOW
emotionalFeed.update	C	UI feed	MEDIUM
nodeLinking.update	D (links)	Interaction core per frame	HIGH
primaryNodeAura.update	A	UI aura	LOW
primaryNodeTopBar.update	A	UI text refresh	LOW
nodeVisualFreezeMode.enforceFreeze	D (scene graph)	Traverses scene to freeze nodes	HIGH
linkDebugMode.updateDebugVisuals (if enabled)	C	Debug visuals across links	MEDIUM
hardInteractionAuthority.safetyNet	D (scene)	Frame-end guard over nodes	HIGH
regionalEquilibrium.update (10 Hz, nodes+links)	D	Regional fields	HIGH
cascadingRuptures.update (10 Hz, if enabled)	D	Rupture propagation	EXTREME
criticalNodeFailure.update (10 Hz, if enabled)	D	Failure checks per node	HIGH
linkSemanticPictograms.update (10 Hz, nodes+links)	D	Pictogram sweep	HIGH
harmonicResonance.update (10 Hz)	D	Resonance fields	HIGH
resonanceEchoTrails.update (10 Hz)	C	Echo visuals over composites	MEDIUM
harmonicTopology.update (10 Hz)	D	Topology learning over network	HIGH
topologyViz.update (10 Hz)	D	Flow field draw over nodes	HIGH
proceduralGlyphGenerator.update (10 Hz)	C	Procedural glyph generation	MEDIUM
harmonicCycleController.update (10 Hz)	C	Regional cycle state	MEDIUM
glyphAnimationModulator.update (10 Hz)	C	Glyph animation modulation	MEDIUM
Dangerous / Critical hot spots (loops over ALL nodes/links or nested):

aiNodes.update, sigmaNodes/quantumNodes loops, nodeAuraSystem.update, nodeShellSizeAuthority.enforceShellSizes, nodeVisuals4.update, etc. — O(N) every frame, always.
Link-wide systems (dynamicLinkColorSystem, linkQuality/Degradation/Collapse, linkMetricsToVisualBridge, stressBasedParticleScaler, linkPersonalityStateMachine, synergyBonus*, waveInterferenceEngine, cascade particle systems, neuralCurveLinkVisuals, nodeLinking.update, etc.) — O(L) each frame, always.
WaveInterferenceEngine.update, recursive/emergent glyph messaging, synergyChainReaction — network-wide traversals (O(N+L), some nested via BFS) always → EXTREME.
Periodic but heavy scans: relaxNodeMetrics (all nodes every 60f), coreMaterialPropertyLock (all materials each frame), nodeVisualFreezeMode.enforceFreeze (scene sweep each frame), regionalEquilibrium/cascadingRuptures/criticalNodeFailure (10 Hz but network-wide).