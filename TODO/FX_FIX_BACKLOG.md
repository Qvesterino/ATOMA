# FX Fix Backlog — Systematic Cleanup Plan

Generated from [`FX_CONTRACT_AUDIT_DATA.json`](../docs/maj/FX_CONTRACT_AUDIT_DATA.json).
Total FIX files: **50**

---

## Priority 1: CRITICAL — FrameScheduler Optional-Chain Bug

These files use `!this.frameScheduler?.shouldRunVisual?.()` which evaluates to `true` when `frameScheduler` is undefined, causing `update()` to **always return immediately** — the entire FX system freezes.

| # | File | Category | Owner | Also Fails | Status |
|---|------|----------|-------|------------|--------|
| 1.1 | `EnvironmentalHazards.js` | ENVIRONMENT FX | main.js | — | ✅ FIXED |
| 1.2 | `NodeEditor.js` | LINK FX | main.js | — | ✅ FIXED |
| 1.3 | `ResonanceEchoTrailSystem.js` | SHADER/MATERIAL | main.js | — | ✅ FIXED |
| 1.4 | `CascadingRuptureSystem.js` | CASCADE/WAVE | main.js | DEBUG: 7 console calls | ✅ FIXED |
| 1.5 | `CriticalNodeFailureSystem.js` | LINK FX | main.js | DEBUG: 8 console calls | ✅ FIXED |
| 1.6 | `PHASE5_CascadeVisuals.js` | LINK FX | main.js | DEBUG: 35 console calls | ✅ FIXED |
| 1.7 | `CompositeGlyphResonanceFeedback.js` | RESONANCE | main.js | — | ✅ FIXED |
| 1.8 | `FXPerformanceSmoothTransition_v1.js` | PERFORMANCE | main.js | — | ✅ FIXED |
| 1.9 | `HarmonicHubAuraSystem_Session126.js` | HUB AURA | main.js | — | ✅ FIXED |
| 1.10 | `MetricReactiveWorldEvents.js` | ENVIRONMENT FX | main.js | — | ✅ FIXED |
| 1.11 | `PersonalityShaderBridge_v1.js` | SHADER/MATERIAL | main.js | — | ✅ FIXED |
| 1.12 | `SafeColonyExpansion2.js` | COLONY FX | main.js | — | ✅ FIXED |
| 1.13 | `TIER4_GameplayIntegrationBridge_v1.js` | GAMEPLAY | main.js | — | ✅ FIXED |
| 1.14 | `TIER4_GameplayIntegrationCore_v1.js` | GAMEPLAY | main.js | — | ✅ FIXED |

**Fix pattern:** Replace `!this.frameScheduler?.shouldRunVisual?.()` with explicit `typeof` check:
```js
if (this.frameScheduler && typeof this.frameScheduler.shouldRunVisual === 'function') {
  if (!this.frameScheduler.shouldRunVisual()) return;
}
```

---

## Priority 2: HIGH — Missing DISPOSE (Memory Leak)

| # | File | Category | Owner | Also Fails | Status |
|---|------|----------|-------|------------|--------|
| 2.1 | `_AdaptiveGlyphRendering1_0.js` | NODE FX | main.js | — | ✅ FIXED |

**Fix pattern:** Add `dispose()` method that removes meshes from scene and disposes geometry/material.

---

## Priority 3: MEDIUM — Missing BUDGET Cap

~30 files lack explicit resource caps (`maxCount`, `poolSize`, `MAX_*`). Grouped by subsystem for batch work.

### Batch A: Node FX (8 files)
| # | File | Owner | Also Fails | Status |
|---|------|-------|------------|--------|
| 3.1 | `_AINarrativePatterns6_0.js` | main.js | — | ✅ FIXED |
| 3.2 | `_ExtremeAIShaderPack.js` | UNKNOWN | LIFETIME | ✅ FIXED |
| 3.3 | `_SemanticGlyphAI.js` | main.js | — | ✅ FIXED |
| 3.4 | `AIConsciousnessLayer.js` | main.js | — | ✅ FIXED |
| 3.5 | `CinematicUpgrade.js` | main.js | — | ✅ FIXED |
| 3.6 | `HarmonicHubSync.js` | UNKNOWN | — | ✅ FIXED |
| 3.7 | `NodeInterferenceManager.js` | main.js | — | ✅ FIXED |
| 3.8 | `SimulationEffectOrchestrator.js` | main.js | DEBUG: 7 calls | ✅ FIXED |

### Batch B: Link FX (6 files)
| # | File | Owner | Also Fails |
|---|------|-------|------------|
| 3.9 | `_AmbientEntityManager.js` | main.js | — |
| 3.10 | `_LinkedGlyphSynchronization1_0.js` | main.js | — |
| 3.11 | `HarmonicHealingVisualSystem_Session134.js` | main.js | — |
| 3.12 | `LinkRingArcDischarges.js` | LinkRendererConduit | — |
| 3.13 | `LinkSemanticPictogramSystem_WithFusion.js` | LinkRendererConduit | — |
| 3.14 | `SafeWorldResetFix1_0.js` | main.js | DEBUG: 62 calls |

### Batch C: Environment FX (4 files)
| # | File | Owner | Also Fails |
|---|------|-------|------------|
| 3.15 | `_SafeLegendaryWorldEvents.js` | main.js | — |
| 3.16 | `SafeDreamDepthPack.js` | main.js | — |
| 3.17 | `SafeQuantumIllusionsPack1.js` | main.js | — |
| 3.18 | `SystemStateOverlay.js` | main.js | DEBUG: 14 calls |

### Batch D: Shader/Material FX (5 files)
| # | File | Owner | Also Fails |
|---|------|-------|------------|
| 3.19 | `ArchetypeShaderModes_v1.js` | main.js | — |
| 3.20 | `HarmonicRecoveryVisualSystem_Session138.js` | main.js | — |
| 3.21 | `LinkVisualStateAdapter.js` | LinkRendererConduit | OWNER |
| 3.22 | `VisualEchoTrails_v1_Integration.js` | main.js | UPDATE |
| 3.23 | `WaveDynamicsShaderPack_v1.js` | main.js | OWNER |

### Batch E: Cascade/Wave + Particle FX (4 files)
| # | File | Owner | Also Fails |
|---|------|-------|------------|
| 3.24 | `CompositeGlyphGenerator.js` | UNKNOWN | UPDATE, DEBUG |
| 3.25 | `PulseIntersectionImpulseAdapter_v1.js` | UNKNOWN | — |
| 3.26 | `_MythicRitualController.js` | main.js | DEBUG: 11 calls |
| 3.27 | `BeadDebugUtils.js` | UNKNOWN | UPDATE |

**Fix pattern:** Add a `MAX_*` constant or `poolSize` config near the constructor:
```js
this.config = {
  maxParticles: 200,
  poolSize: 50,
  // ...
};
```

---

## Priority 4: MEDIUM — DEBUG Console Spam

Files with unguarded `console.log` calls. Wrap in `if (this.debug)` or `if (DEBUG)`.

| # | File | Category | Owner | Console Calls |
|---|------|----------|-------|---------------|
| 4.1 | `DreamDesert2.js` | PARTICLE FX | main.js | 12 |
| 4.2 | `MetricsRuntime_v1.js` | CASCADE/WAVE | main.js | 17 |
| 4.3 | `TIER4_CorruptionFeedbackVisuals_v1.js` | SHADER/MATERIAL | main.js | 6 |
| 4.4 | `CompositeGlyphGenerator.js` | CASCADE/WAVE | UNKNOWN | 6 |
| 4.5 | `CascadingRuptureSystem.js` | CASCADE/WAVE | main.js | 7 |
| 4.6 | `CriticalNodeFailureSystem.js` | LINK FX | main.js | 8 |
| 4.7 | `PHASE5_CascadeVisuals.js` | LINK FX | main.js | 35 |
| 4.8 | `_MythicRitualController.js` | PARTICLE FX | main.js | 11 |
| 4.9 | `ResonanceFeedback_v1.js` | SHADER/MATERIAL | main.js | 14 |
| 4.10 | `SafeWorldResetFix1_0.js` | LINK FX | main.js | 62 |
| 4.11 | `SimulationEffectOrchestrator.js` | NODE FX | main.js | 7 |
| 4.12 | `SystemStateOverlay.js` | UNKNOWN | main.js | 14 |
| 4.13 | `TemporalEventEffects.js` | SHADER/MATERIAL | UNKNOWN | 4 |

**Fix pattern:** Add `this.debug = false` in constructor, then wrap:
```js
if (this.debug) console.log('[FileName]', ...);
```

---

## Priority 5: LOW — Missing UPDATE Method

Event-driven or config-only files that may not need `update()`. Verify before adding.

| # | File | Category | Owner | Also Fails |
|---|------|----------|-------|------------|
| 5.1 | `_ExtremeAINodePack.js` | NODE FX | main.js | — |
| 5.2 | `LinkPointFXBase.js` | SHADER/MATERIAL | LinkRendererConduit | — |
| 5.3 | `CorruptionVisualFX_v1.js` | SHADER/MATERIAL | main.js | — |
| 5.4 | `PostProcessing.js` | SHADER/MATERIAL | UNKNOWN | — |
| 5.5 | `VisualEchoTrails_v1_Integration.js` | SHADER/MATERIAL | main.js | BUDGET |
| 5.6 | `BeadDebugUtils.js` | LINK FX | UNKNOWN | BUDGET |
| 5.7 | `CompositeGlyphGenerator.js` | CASCADE/WAVE | UNKNOWN | BUDGET, DEBUG |

---

## Priority 6: LOW — Missing OWNER Reference

Files with no cross-reference to `main.js` or `EnvironmentDomainController`. May be orphaned or utility modules.

| # | File | Category | Also Fails |
|---|------|----------|------------|
| 6.1 | `_AIThoughtStorms2_0.js` | LINK FX | — |
| 6.2 | `HarmonicHubLifecycle.js` | CASCADE/WAVE | — |
| 6.3 | `NodeImpactManager.js` | PARTICLE FX | — |
| 6.4 | `EventVisualSuppression_v1.js` | NODE FX | GATE |
| 6.5 | `LinkVisualStateAdapter.js` | SHADER/MATERIAL | BUDGET |
| 6.6 | `WaveDynamicsShaderPack_v1.js` | SHADER/MATERIAL | BUDGET |
| 6.7 | `CompositeGlyphGenerator.js` | CASCADE/WAVE | UPDATE, DEBUG |
| 6.8 | `PulseIntersectionImpulseAdapter_v1.js` | PARTICLE FX | BUDGET |

---

## Priority 7: LOW — Missing TRIGGER / PURPOSE / GATE

| # | File | Category | Owner | Failure |
|---|------|----------|-------|---------|
| 7.1 | `LinkBeadTrailSystem.js` | SHADER/MATERIAL | LinkRendererConduit | TRIGGER: No clear trigger |
| 7.2 | `EchoRippleSystem_Session125.js` | CASCADE/WAVE | UNKNOWN | PURPOSE: No purpose documentation |
| 7.3 | `NodeSegmentedOrbitRings.js` | SHADER/MATERIAL | main.js | GATE: No gate mechanism |

---

## Recommended Workflow

1. **Start with Priority 1** (frameScheduler bugs) — these are runtime-breaking.
2. **Do Priority 2** (missing dispose) — prevents memory leaks.
3. **Batch-process Priority 3** by subsystem (Node FX → Link FX → Environment FX → Shader/Material) — same fix pattern applies to many files.
4. **Batch-process Priority 4** (DEBUG guards) — mechanical wrapping job.
5. **Review Priority 5–7** — many may be false positives (event-driven files legitimately lack `update()`; utility files legitimately lack owner).
6. **Re-run the audit script** after each batch to verify progress:
   ```bash
   node "ai tools (powershell)/vfx_contract_audit.cjs"
   ```

---

## Progress Tracker

| Priority | Files | Fixed | Remaining |
|----------|-------|-------|-----------|
| 1 CRITICAL | 14 | 14 | 0 |
| 2 DISPOSE | 1 | 1 | 0 |
| 3 BUDGET | 27 | 8 | 19 |
| 4 DEBUG | 13 | 0 | 13 |
| 5 UPDATE | 7 | 0 | 7 |
| 6 OWNER | 8 | 0 | 8 |
| 7 OTHER | 3 | 0 | 3 |
