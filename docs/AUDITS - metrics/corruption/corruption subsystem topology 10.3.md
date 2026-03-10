SECTION 1 — ACTIVE SYSTEMS
- LinkCorruptionTransmission_v1 (gameplay): Instantiated in main.js (aiNodes.linkCorruption); updated via FrameScheduler “simulation.corruptionTransmission” each frame; writes link.userData.corruptionLevel from node/game metrics.
- PHASE5_MultiNetworkManager + PHASE5_CorruptionBridge_v1: Instantiated in main.js; registered network “world”; updated via FrameScheduler “simulation.corruptionBridge”; bridge writes node.userData.corruption and emits corruptionThresholdCrossed events on 0.7 crossing.
- TIER4_CorruptionFeedbackVisuals_v1: Instantiated in main.js; listens to multiNetworkManager events; updated via FrameScheduler “visual.corruptionFeedback”; reacts to corruptionThresholdCrossed by showing cascade/seed visuals (visual-only).
- LinkRendererConduit corruption stack (visual): CorruptionSpreadAnimator, CorruptionParticleSystem, CorruptionMorphingSystem instantiated in conduit; updated per-link every visual update; read link.userData.corruptionLevel via metrics; disposed with links.
- Healing/Trail/Spark/Bead systems (non-corruption but adjacent) remain active in the same visual path.

SECTION 2 — PARTIAL SYSTEMS
- LinkCorruptionMorphingSystem: Now updated per-link; functional (reads link.corruptionLevel), but has no additional events—classified as active but still limited to per-link visuals (no external triggers).
- CorruptionThreshold events: Emitted only from CorruptionBridge path; other gameplay writers do not emit them—so feedback visuals trigger only for bridge-driven corruption rises.
- MultiNetworkManager event propagation enabled, but only one network is registered; inter-network transfer features idle.

SECTION 3 — UNUSED / LEGACY FILES
- CorruptionVisualFX_v1, CorruptionDesaturationIntegrationPatch, CorruptionDrivenAuraDesaturationSystem, NodeCorruptionAuraDegradation (LEGACY/aura): not imported or instantiated.
- LinkCorruptionTransmissionIntegrationPatch_v1: legacy helper, unused.
- T2_CorruptionVisualIntegration_v1, TIER4_CorruptionFeedbackVisuals_v1 (older copies), LinkCorruptionMorphingSystem alternatives in docs/examples: unused.
- Test/Example harnesses: LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js, T4003_CORRUPTION_CASCADE_TEST_RUNNER.js (not scheduled).

SECTION 4 — CORRUPTION PIPELINE MAP
Node metrics (corruption)  
→ LinkCorruptionTransmission_v1 updates link.userData.corruptionLevel  
→ LinkRendererConduit per-link visuals: SpreadAnimator → Morphing → ParticleSystem (corruptionFX gate)  
Parallel: CorruptionBridge distributes corruption to nodes (single network)  
→ Node corruption rises; on crossing 0.7 emits corruptionThresholdCrossed via MultiNetworkManager  
→ TIER4_CorruptionFeedbackVisuals listens and renders cascade/seed visuals  
→ (Bridge also feeds future multi-network transfers, but only one network is registered today)

SECTION 5 — POTENTIAL SIMPLIFICATIONS / RISKS
- Multiple node corruption writers now exist (Transmission upstream and CorruptionBridge); ensure only one gameplay authority if bridge remains.  
- CorruptionThreshold events fire only from CorruptionBridge; other corruption paths (e.g., Transmission, HarmonyStabilization) won’t trigger feedback visuals—consider a shared emitter near the canonical node corruption writer if broader coverage is desired.  
- Legacy visual packs (CorruptionVisualFX_v1, aura desaturation systems) can be left off or removed to reduce surface area.  
- MultiNetworkManager runs with a single network; cross-network logic is idle. Keep or guard registration to avoid unnecessary simulation cost.