# Root Directory Unused Code Audit

**Generated:** 2026-04-20
**Scope:** Root directory `.js` files only (no EXAMPLES, SNIPPETS, LEGACY, subdirectories)
**Method:** Precise import/require analysis across entire codebase (538 files searched)
**Status:** PARTIAL CLEANUP — 49 files moved to LEGACY/, 4 restored per user request

---

## Summary

| Category | Count |
|---|---|
| Total root `.js` files | 395 |
| **Confirmed unused** (zero imports) | 49 |
| **Self-only referencing** (only imports itself) | 2 |
| **LEGACY-only reference** | 1 |
| **Import commented out** | 1 |
| **Grand total candidates for cleanup** | **53** |
| Already cleaned since old audit (2026-04-07) | ~28 |

---

## Tier 1: SAFE TO DELETE — Zero Imports Anywhere (49 files)

These files are not imported, required, or referenced via `<script>` tag anywhere in the codebase. **Safe to delete immediately.**

| # | File | Notes |
|---|---|---|
| 1 | `CascadeWaveParticles.js` | |
| 2 | `ComputeSynergyScore2_1.js` | Superseded by ComputeSynergyScore2_0 |
| 3 | `ControlNodeGeometries_v1.js` | |
| 4 | `EvolutionRegistry.js` | |
| 5 | `ForceNodeOpaqueBodySystem_v1.js` | |
| 6 | `FrameEnforcementEngine.js` | |
| 7 | `HarmonyAuraController.js` | |
| 8 | `HubInfluencePropagation.js` | |
| 9 | `LinkSemanticPictogramGlyphBuilders.js` | |
| 10 | `LinkSemanticPictogramSystem.js` | Superseded by _Enhanced and _WithFusion variants |
| 11 | `LinkShaderMetricsIntegration_v1.js` | |
| 12 | `MegaGlyphConduit.js` | |
| 13 | `MegaGlyphSystem.js` | |
| 14 | `NetworkFatigueSystem_v0_DEBUG.js` | Debug variant, non-debug version exists |
| 15 | `NodeCoreOpaqueEnforcer_Session113.js` | |
| 16 | `NodeDynamicMetrics.js` | |
| 17 | `NodeHoverRingSystem.js` | |
| 18 | `NodeLinker2_RepairLayer1_0.js` | |
| 19 | `NodeLinkingInvariantGuard.js` | |
| 20 | `NodeQualityCalculator.js` | |
| 21 | `NodeStateMachine_v1.js` | |
| 22 | `NodeSurfaceDominanceRule_v1.js` | |
| 23 | `NodeSynergyIntegration1_0.js` | |
| 24 | `NodeVisualIntegrityFix.js` | |
| 25 | `ParticleEmissionRateScaling.js` | |
| 26 | `PersonalityMaterialProfileRegistry_v1.js` | |
| 27 | `PersonalityShaderStabilizedFX_v1.js` | |
| 28 | `PersonalitySignalSmoother_v1.js` | |
| 29 | `PriorityDecayEngine1_0.js` | |
| 30 | `RitualVisualOrchestrator.js` | |
| 31 | `SoftPointSpriteTexture.js` | |
| 32 | `SpatialIndexPerformanceTest.js` | Test file |
| 33 | `SpawnAuthorityConsoleAPI.js` | Console API, dev-only |
| 34 | `StressTurbulenceIntegrationGuide.js` | Guide/doc file |
| 35 | `SynergyVFX1_0.js` | Superseded |
| 36 | `SynergyVFXEngine1_0.js` | Superseded |
| 37 | `SystemInitializationOrderValidator_v1.js` | |
| 38 | `VerifyLinkStateContractCompliance.js` | Verification script |
| 39 | `VisualAuthority.js` | |
| 40 | `VisualMetricModel_v1.js` | |
| 41 | `VisualTemplateReferenceImplementations.js` | Reference impl, not used |
| 42 | `WaveBurstRouter_v1.js` | |
| 43 | `WorldScaffold_v2.js` | |
| 44 | `_AtomaUIUpdate3_0.js` | Old UI update |
| 45 | `_DynamicLinkThicknessSystem.js` | |
| 46 | `_ObjectExtensibilityGuard.js` | |
| 47 | `_VisualRootAutoRegister.js` | |
| 48 | `tmp_three.js` | Temp file |
| 49 | `vite.config.js` | Build config — verify vite not in use before deleting |

---

## Tier 2: EFFECTIVELY UNUSED — Self-Only Reference (2 files)

These files only import from themselves (self-referencing module). No external consumer exists.

| # | File | Evidence |
|---|---|---|
| 1 | `_NodeEvolution3_ExtremeSafe.js` | Zero external imports |
| 2 | `VISUAL_HIERARCHY_VERIFICATION_TEST.js` | Zero external imports, test/verification file |

---

## Tier 3: LEGACY-ONLY Reference (1 file)

Only referenced from files inside the `LEGACY/` directory, which are themselves unused.

| # | File | Imported by |
|---|---|---|
| 1 | `_ExtremeAIShaderPack.js` | `LEGACY/_ExtremeAIShaderTestSuite.js` only |

---

## Tier 4: IMPORT COMMENTED OUT (1 file)

The import exists in `main.js` but is commented out. The code has null-safe references (`this.fxRuntime_v1?.update?.()`) but the system is never instantiated.

| # | File | Evidence |
|---|---|---|
| 1 | `FXRuntime_v1.js` | `main.js:1342` — `// import { FXRuntime_v1 } from './FXRuntime_v1.js';` |

---

## Corrections from Old Audit (2026-04-07)

The following files were flagged as unused in the old audit but are **actually USED** in the current codebase:

| File | Actually imported by |
|---|---|
| `DreamDesert2.js` | `main.js` |
| `NodeLinkingSystem.js` | `main.js` (line 63, heavily used) |
| `EnergyVisualProfile.js` | `NodeImpactManager.js` |

The following root files from the old audit have **already been deleted** since the old audit:

`ATOMA_SPAWN_FILTER_AUDIT.js`, `AudioSystem.js`, `BeadSystemTuning.js`, `CoreMetricAuthorityMonitor.js`, `CorruptionVisualIntegrationPatch_v1.js`, `ENGINE_HEALTH_CHECK_CONSOLE_API.js`, `HarmonicInfluencePropagationIntegrationPatch_Session127.js`, `InputEnhancedVariants_Session84.js`, `InputSensoryGeometries_v1.js`, `IntegrationEnhancedVariants_Session82.js`, `LINK_DEGRADATION_MAINJS_PATCH.js`, `LegacyLinkStateNeutralization.js`, `LegacyLinkStateShutdown.js`, `LinkBeadVisualEffects.js`, `LinkEnergyWave.js`, `LinkGlowSynergyEngine_v2.js`, `LinkSurfacePhaseRipples.js`, `LinkThicknessMetricsIntegrationPatch_v1.js`, `NodeHierarchyEffectsPool_v1.js`, `NodeHierarchySystem_v1.js`, `NodeHierarchyVisualFeedback_v1.js`, `NodeHierarchyVisuals_v1.js`, `NodeVisualStateBinder_OLD_v1.js`, `VisualEchoTrails_v1_Shader.js`, `ZeroGravityControls.js`, `_RareNodeSimulationVerifier.js`, `_SESSION_38_VERIFICATION_SCRIPT.js`, `_UISelectedNodeBadge3_2.js`

---

## Recommended Cleanup Order

1. **Delete Tier 1** (49 files) — zero risk, no imports
2. **Delete Tier 2** (2 files) — self-only, zero external consumers
3. **Delete Tier 3** (1 file) — only LEGACY depends on it
4. **Decide on Tier 4** (1 file) — `FXRuntime_v1.js` — either re-enable or delete

**Total potential cleanup: 53 root files**
