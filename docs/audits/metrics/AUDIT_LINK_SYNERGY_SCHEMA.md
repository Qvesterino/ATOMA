# ATOMA METRICS — LINK SYNERGY SCHEMA AUDIT (2026-03-09)

## Formats Observed

| Format | Writers | Reader Systems | Usage |
| --- | --- | --- | --- |
| `link.userData.synergy` (object: `{ score, synergyNorm }`) | NodeLinkingSystem (link creation, ComputeSynergyScore2_1 → canonical); LinkMetricsSanityGuard_v1 (sanitizes when present) | LinkGlowSynergyEngine_v2, LinkGlowSynergyEngine1_0 (fallback), LinkPrioritySystem, LinkResonanceFlowSystem_Session124, HarmonyStabilizationSystem_v1 (synergy gating), LinkCorruptionTransmission_v1 (synergy blocking), SynergyStateResolver, LinkRendererConduit (metrics feed), visual adapters (LinkVisualStateAdapter), various VFX | Gameplay + visual (intended canonical) |
| `link.userData.synergy2_1` (object: `{ score, synergyNorm }`) | None detected in runtime (only referenced in docs/audits) | Legacy doc references; no active readers found in code | Legacy placeholder (UNUSED) |
| `link.userData.synergyBonus` (object: tier, pulseStrength, chromaShift, resonanceRipples, etc.) | SynergyBonusVisualization_v1 (per-frame derived); tests/snippets | SynergyBonusFXLayer_v1, ResonanceFeedback_v1, SynergyChainReaction_v1, SynergyResonanceShaderPack_v1, SynergyCascadeFXBridge pipelines | Visual-only derived layer (non-canonical) |
| `link.synergy` (top-level number) | None detected in runtime code | None detected | Legacy/absent |

## Details by Writer

- **NodeLinkingSystem.js** — During link creation, writes canonical `link.userData.synergy = { score, synergyNorm }` and mirrors `synergyScore`. Frequency: per link spawn. Authority: canonical gameplay.
- **LinkMetricsSanityGuard_v1.js** — Sanitizes `userData.synergy` if present. Frequency: guard pass. Authority: safety utility.
- **SynergyBonusVisualization_v1.js** — Computes `link.userData.synergyBonus` (visual metadata). Frequency: per-frame visual update. Authority: visual derived (non-canonical metric).
- **No active writer** for `link.userData.synergy2_1` or `link.synergy`.

## Reader Highlights

- Gameplay/logic: LinkPrioritySystem, LinkResonanceFlowSystem_Session124, HarmonyStabilizationSystem_v1, LinkCorruptionTransmission_v1 (synergy blocking), SynergyStateResolver.
- Visuals: LinkGlowSynergyEngine_v2/1_0, LinkVisualStateAdapter, LinkRendererConduit, NeonLinkVisuals (via metrics), SynergyBonus FX stack (reads synergyBonus), ResonanceFeedback_v1.

## Conflicts / Drift

- Multiple synergy representations coexist (`synergy`, `synergyBonus`, legacy `synergy2_1` doc references). Only `link.userData.synergy` is actively written by gameplay.
- `synergyBonus` is visual-only and should not be treated as canonical gameplay input.
- No active top-level `link.synergy`, but legacy code could be reintroduced; keep guards.

# RECOMMENDED CANONICAL SCHEMA

Use a single canonical link synergy object:

```js
link.userData.synergy = {
  score: <number 0..1>,       // gameplay score (from ComputeSynergyScore2_1)
  synergyNorm: <number 0..1>  // normalized visual-ready value (equals score if norm unavailable)
};
```

- All gameplay and visual systems should read `link.userData.synergy.score` (gameplay) or `link.userData.synergy.synergyNorm` (visuals).
- Deprecate `link.userData.synergy2_1`, `link.synergy`, and restrict `synergyBonus` to visual-only, explicitly marked non-canonical.*** End Patch>>();
