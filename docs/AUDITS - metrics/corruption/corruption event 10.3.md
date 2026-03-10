SECTION 1 — EVENT SAFE PATHS
- PHASE5_CorruptionBridge_v1.js  
  - Function: applyCorruptionToNetwork()  
  - Writes node.userData.corruption (adds corruptionPerNode).  
  - Emits corruptionThresholdCrossed when rising from <0.7 to ≥0.7 (watcher present).  
  - Can trigger event: YES.

SECTION 2 — PATHS MISSING EVENT EMITTER
- PHASE5_NetworkSynchronization_v1.js  
  - Function: resolveMetricConflict / sync logic (clamps node.userData.corruption)  
  - Writes node.userData.corruption directly.  
  - Can trigger event: NO (no threshold watcher).

- HarmonyStabilizationSystem_v1.js  
  - Functions: applyHealPulse / stabilizeNode / zone heals (various)  
  - Writes node.userData.corruption (healing/reduction).  
  - Can trigger event: NO (no watcher; generally decreases corruption, but any clamped set would bypass).

- PHASE5_CorruptionBridge_v1.js (harmony side)  
  - Function: applyHarmonyToNetwork()  
  - Writes node.userData.corruption (reduces).  
  - Can trigger event: NO (updates _prevCorruption only; no threshold check on decrease).

- Legacy / inactive writers (if reactivated, would bypass)  
  - CorruptionVisualFX_v1.js (node.userData.gameplay.corruptionLevel)  
  - CorruptionDesaturationIntegrationPatch.js, CorruptionDrivenAuraDesaturationSystem.js, NodeCorruptionAuraDegradation.js  
  - T4003_CORRUPTION_CASCADE_TEST_RUNNER.js / example scripts  
  - These write corruption fields but have no threshold emission.

Summary
- Only the PHASE5_CorruptionBridge “applyCorruptionToNetwork” path currently emits corruptionThresholdCrossed. Any node corruption changes from synchronization, healing systems, or legacy/inactive writers will not raise the event (MISSING EVENT EMITTER).