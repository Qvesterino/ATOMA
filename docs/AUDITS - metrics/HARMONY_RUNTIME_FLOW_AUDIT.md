# Harmony Data Flow Verification (Runtime)

Flow traced: HarmonyStabilizationSystem → node.userData.harmonyLevel → link.userData.harmonyLevel → LinkRendererConduit._readLinkMetrics() → metrics.harmony → NodeHarmonicManager → HarmonicSyncEffectApplier → LinkHealingParticleSystem.

## Writers (harmonyLevel)
- `HarmonyStabilizationSystem_v1.js`: writes `node.userData.harmonyLevel = level` (≈ line 850) and `link.userData.harmonyLevel = level` (≈ line 897) when `PHASE_C3_METRIC_WRITE_LOCK` is disabled. Values are already clamped 0..1 inside the system.
- Temporary runtime trace added there: `console.debug("HarmonyLevel", ...)` logs node/link harmonyLevel when written.

## Readers
- `LinkRendererConduit.js` `_readLinkMetrics()`: `harmony: link.userData?.harmonyLevel ?? link.harmonyLevel ?? link.harmony ?? 1.0` (≈ line 2337). Temporary probe logs `LINK HARMONY <linkId> <value>`.
- `NodeHarmonicManager` (update call from LinkRendererConduit around line 1370): receives `metrics.harmony` from `_readLinkMetrics`.
- `NodeHarmonicSyncController.js`: `update()` clamps `harmony = Math.max(0, Math.min(1, harmony));` (line ~86).
- `HarmonicSyncEffectApplier.js`: consumes syncStrength derived from controllers (no direct harmonyLevel read; assumes 0..1 strength).
- `LinkHealingParticleSystem.js`: `update(..., harmony, corruption)` uses `harmonyThreshold = 0.6` and gradients expecting harmony in 0..1.

## Transformers / Clamps
- `HarmonyStabilizationSystem_v1`: levels clamped 0..1 before writing to userData.
- `NodeHarmonicSyncController.update`: explicit clamp 0..1 on incoming harmony.
- `LinkHealingParticleSystem`: thresholds and curves assume harmony ∈ [0,1]; no further clamp.
- `_readLinkMetrics` uses default harmony 1.0 if missing (acts as fallback).

## Visual Consumers
- `LinkRendererConduit` passes `metrics.harmony` to:
  - `NodeHarmonicManager.update` (drives harmonic sync feedback).
  - `LinkHealingParticleSystem` emitters (healing FX strength/threshold).
  - Various link visual modules via `metrics.harmony` in the per-link state.

## Range Expectations
- All systems in this pipeline assume **0..1** harmony. No usages observed for -1..1 or 0..100. Defaults in the conduit are 1.0 if unavailable.

## Current Runtime Probes
- Harmony writes: `console.debug("HarmonyLevel", node/link, value)` in `HarmonyStabilizationSystem_v1`.
- Link read: `console.debug("LINK HARMONY", link.id, link.userData?.harmonyLevel)` in `_readLinkMetrics`.

Conclusion: With the write lock disabled, harmonyLevel propagates from HarmonyStabilizationSystem to userData, is read by LinkRendererConduit as metrics.harmony, and is forwarded to NodeHarmonicManager, HarmonicSyncEffectApplier, and LinkHealingParticleSystem, all expecting values in [0,1].
