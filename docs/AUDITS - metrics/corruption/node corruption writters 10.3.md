SECTION 1 — PRIMARY WRITERS
- PHASE5_CorruptionBridge_v1.js  
  - applyCorruptionToNetwork (around line 230): `node.userData.corruption = Math.min(currentCorruption + corruptionPerNode, 1.0);`  
  - applyHarmonyToNetwork (around line 267): `node.userData.corruption = Math.max(currentCorruption - harmonyPerNode, 0);`  
  - When: simulation layer (FrameScheduler “simulation.corruptionBridge” each tick).  
  - Note: also caches `_prevCorruption` for threshold events.

SECTION 2 — SECONDARY WRITERS (modifiers/healing/clamp)
- HarmonyStabilizationSystem_v1.js  
  - applyHealPulse (~221): `node.userData.corruption = Math.max(0, nodeCorruption - healAmount);`  
  - stabilizeNode (~466): `node.userData.corruption = Math.max(0, node.userData.corruption - 0.2);`  
  - resetCorruption (~483): `node.userData.corruption = 0;`  
  - Pulse heal (~562), zone heal (~751), hard reset (~1051): various `Math.max`/`=0` writes.  
  - When: gameplay/simulation tick (healing mechanic).  
  - Classification: SECONDARY (healing/recovery).

- PHASE5_NetworkSynchronization_v1.js  
  - resolveMetricConflict (~303): `node.userData.corruption = Math.max(0, Math.min(1, corruption));`  
  - When: network sync step (simulation).  
  - Classification: SECONDARY (clamp/sync).

SECTION 3 — LEGACY / UNUSED WRITERS
- CorruptionVisualFX_v1.js, CorruptionDesaturationIntegrationPatch.js, CorruptionDrivenAuraDesaturationSystem.js, NodeCorruptionAuraDegradation.js  
  - Various assignments to node.userData.corruption or gameplay.corruptionLevel for visuals.  
  - When: only if legacy visual packs activated (currently not instantiated).  
  - Classification: LEGACY.

- Example/Test harnesses  
  - EXAMPLES/HARMONY_STABILIZATION_v1_EXAMPLES.js, LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js, T4004_HARMONY_HEALING_TEST_RUNNER.js: multiple writes to node.userData.corruption for demos/tests.  
  - When: only during manual/test execution.  
  - Classification: LEGACY/TEST.

- MetricAuthorityPolicy_v2.md (docs) shows `node.userData.metrics.corruption += delta;` — documentation only.

Notes on coverage
- No active writer to node.userData.metrics.corruption in runtime codepaths above; all active writers target node.userData.corruption (legacy field).
- Visual-only systems (LinkRendererConduit, SpreadAnimator, ParticleSystem, Morphing) do NOT write node corruption; they read link corruption.

Summary
- Primary gameplay corruption source today: PHASE5_CorruptionBridge (increase/decrease).  
- Secondary modifiers: HarmonyStabilization (healing), NetworkSynchronization (clamp).  
- Other writers found are legacy or test-only.