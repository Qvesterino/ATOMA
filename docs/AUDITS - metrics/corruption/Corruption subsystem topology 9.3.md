Corruption subsystem topology (by file name)

A) Gameplay layer
- LinkCorruptionTransmission_v1.js — ACTIVE (instantiated in main.js; runs in FrameScheduler.simulation as `simulation.corruptionTransmission` @10 Hz). Canonical link corruption writer (`link.userData.corruptionLevel`). 
- PHASE5_CorruptionBridge_v1.js — DORMANT (no instantiation detected; cross‑network corruption transfer).
- LinkCorruptionTransmissionIntegrationPatch_v1.js — DORMANT (helper patch for Transmission v1; not imported).
- CorruptionDesaturationIntegrationPatch.js — DORMANT (visual/gamelike clamp patch; no import).
- T4003_CORRUPTION_CASCADE_TEST_RUNNER.js — TEST (manual seeding; not auto‑run).

B) Link visual layer
- LinkCorruptionSpreadAnimator.js — ACTIVE (constructed in LinkRendererConduit; updated per link in conduit update).
- LinkCorruptionParticleSystem.js — ACTIVE (constructed in LinkRendererConduit; updated per link in conduit update).
- LinkCorruptionMorphingSystem.js — DORMANT (no instantiation found).
- T2_CorruptionVisualIntegration_v1.js — DORMANT (not referenced in runtime code).
- TIER4_CorruptionFeedbackVisuals_v1.js — DORMANT (not referenced).
- CorruptionVisualIntegrationPatch_v1.js — DORMANT (legacy adapter, not imported).
- CorruptionVisualFX_v1.js — DORMANT (standalone FX; no current import).

C) Node visual layer
- CorruptionDrivenAuraDesaturationSystem.js (LEGACY/aura) — DORMANT.
- NodeCorruptionAuraDegradation.js (LEGACY/aura) — DORMANT.
- CorruptionDesaturationIntegrationPatch.js — (see above) dormant visual clamp.

D) Network layer
- PHASE5_CorruptionBridge_v1.js — DORMANT (cross‑network corruption transfer).
- PHASE5_CorruptionBridge is only network‑scoped component found.

E) Legacy / integration patches
- CorruptionVisualIntegrationPatch_v1.js — Legacy visual adapter (unused).
- LinkCorruptionTransmissionIntegrationPatch_v1.js — Legacy helper for older pipeline (unused).
- CorruptionDesaturationIntegrationPatch.js — Legacy clamp (unused).

F) Test / example systems
- LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js — Examples only.
- T4003_CORRUPTION_CASCADE_TEST_RUNNER.js — Test harness.
- Docs audit markdowns — non-runtime.

Activation / runtime status
- Instantiated & called: LinkCorruptionTransmission_v1 (simulation), LinkCorruptionSpreadAnimator (visual per-link), LinkCorruptionParticleSystem (visual per-link).
- Scheduler layers: corruption transmission → FrameScheduler.simulation; spread animator/particles ride inside LinkRendererConduit visual update (per link each frame).
- Not instantiated: MorphingSystem, T2_*, TIER4_*, CorruptionVisualFX_v1, CorruptionDesaturationIntegrationPatch, IntegrationPatch_v1, PHASE5_CorruptionBridge_v1, legacy aura systems, test/example files.

Corruption pipeline (current)
node corruption (maintained by gameplay systems; source for transmission)
↓
LinkCorruptionTransmission_v1 (writes link.userData.corruptionLevel)
↓
LinkRendererConduit per-link update
   → LinkCorruptionSpreadAnimator (strand color/wave)
   → LinkCorruptionParticleSystem (along-link particles)
↓
Other link/node visuals consume link.corruptionLevel or node.corruption as read-only.

Dormant but ready candidates (safe to activate if desired)
- LinkCorruptionMorphingSystem (link mesh deformation; currently unused).
- T2_CorruptionVisualIntegration_v1 / TIER4_CorruptionFeedbackVisuals_v1 (additional link FX).
- CorruptionVisualFX_v1 (node‑focused FX) and legacy aura desaturation systems (node visuals).
- PHASE5_CorruptionBridge_v1 (cross-network gameplay propagation) if multi-network is needed.

Legacy / removal candidates
- CorruptionVisualIntegrationPatch_v1, CorruptionDesaturationIntegrationPatch, LinkCorruptionTransmissionIntegrationPatch_v1 (older adapters, not referenced).
- Legacy aura systems in `LEGACY/aura/` unless a compatibility path requires them.
- Test/example files (`EXAMPLES`, `T4003_...`) keep as fixtures; exclude from runtime bundles.

Active systems (summary)
- Gameplay: LinkCorruptionTransmission_v1 (canonical writer).
- Visual (link): CorruptionSpreadAnimator, CorruptionParticleSystem.
- Node visuals: none currently active in corruption domain.

If further action is desired
- Decide whether to enable PHASE5_CorruptionBridge_v1 (network spread) and LinkCorruptionMorphingSystem (mesh deformation), and wire them via FrameScheduler to avoid drift.