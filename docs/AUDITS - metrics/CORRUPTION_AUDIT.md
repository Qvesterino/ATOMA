# CORRUPTION AUDIT — ATOMA (2026-03-09)

## Goal
Map corruption metric architecture. Canonical node metric: `node.userData.metrics.corruption` (0–1). Canonical link metric: `link.userData.corruptionLevel` (0–1).

## Quick Findings
- **Node canonical writers:** `NodeMetricEngine` (event impulses) and `MetricsRuntime_v1` (10 Hz relax/equalize) mutate `node.userData.metrics.corruption` under guard.
- **Link canonical writer:** `LinkCorruptionTransmission_v1` maintains per-link corruption map and writes `link.userData.corruptionLevel`; also infects target node corruption (legacy field).
- **Secondary link writer:** `PHASE5_NetworkSynchronization_v1` clamps/rewrites `link.userData.corruptionLevel` during network sync.
- **Non-canonical / legacy node writes:** `LinkCorruptionTransmission_v1` and `NodeLinkingSystem` write `node.userData.corruption` / `node.userData.corruptionLevel` directly (bypassing `metrics`); `CorruptionVisualFX_v1` writes `node.userData.gameplay.corruptionLevel` for visuals. These coexist with canonical metrics and risk drift.
- **Visual layer:** `CorruptionVisualFX_v1`, `CorruptionVisualIntegrationPatch_v1`, `T2_CorruptionVisualIntegration_v1`, `LinkCorruptionSpreadAnimator`, `LinkCorruptionParticleSystem`, `NeonLinkVisuals`, `LinkVisualStateAdapter`, `LinkRendererConduit` all read `corruptionLevel` (link) or corruption metrics; they are read-only except where noted.
- **Feedback loop risk:** LinkCorruptionTransmission uses node corruption to drive link corruption, then can write back corruption to nodes (legacy field), forming a loop outside NodeMetricEngine/MetricsRuntime.

## Classification

### Node Corruption Writers
| System | File | Scope | Notes |
| --- | --- | --- | --- |
| NodeMetricEngine | `src/metrics/NodeMetricEngine.js` | EVENT | Adjusts corruption on link create/remove; clamps 0–1; guard-authorized. |
| MetricsRuntime_v1 | `MetricsRuntime_v1.js` | FIXED 10 Hz | Relaxes toward archetype baselines; traces mutations. |
| SafeMetricsDNAIntegration1_0 | `SafeMetricsDNAIntegration1_0.js` | SPAWN | Seeds metrics.corruption once. |
| (Non-canonical) LinkCorruptionTransmission_v1 | `LinkCorruptionTransmission_v1.js` | RUNTIME | Writes `targetNode.userData.corruption` (legacy) when infecting; not metrics. |
| (Non-canonical) NodeLinkingSystem | `NodeLinkingSystem.js` | RUNTIME | `_applyCorruptionToNode` sets `node.userData.corruptionLevel`; contagion paths read/write legacy fields. |
| (Visual gameplay) CorruptionVisualFX_v1 | `CorruptionVisualFX_v1.js` | VISUAL | Mutates `node.userData.gameplay.corruptionLevel` for VFX; separate from canonical metrics. |

### Link Corruption Writers
| System | File | Scope | Notes |
| --- | --- | --- | --- |
| LinkCorruptionTransmission_v1 | `LinkCorruptionTransmission_v1.js` | RUNTIME | Canonical writer of `link.userData.corruptionLevel`; drives cascades/barriers/healing. |
| PHASE5_NetworkSynchronization_v1 | `PHASE5_NetworkSynchronization_v1.js` | SYNC | Clamps/resets `link.userData.corruptionLevel` during network sync. |
| Test/Examples | `_T4003_CORRUPTION_CASCADE_TEST_RUNNER.js`, `T4004_HARMONY_HEALING_TEST_RUNNER.js`, `LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js` | TEST | Set `corruptionLevel` for scenarios. |

### Visual / Derived Systems
| Systems | Data read |
| --- | --- |
| Corruption visuals: `CorruptionVisualFX_v1`, `CorruptionVisualIntegrationPatch_v1`, `T2_CorruptionVisualIntegration_v1`, `LinkCorruptionSpreadAnimator`, `LinkCorruptionParticleSystem`, `NeonLinkVisuals`, `LinkVisualStateAdapter`, `LinkRendererConduit` | `link.userData.corruptionLevel` (links) and/or node corruption metrics for shaders, jitter, particles. |
| HUD/metrics: `CoreMetricsCalculator/Overlay/HUD/ViewModel`, `MetricReactiveWorldEvents`, `SemanticMetricAdapter`, `NetworkMetricsAggregator`, `MetricsRuntime_v1` globals | `corruptionLevel` derived from node metrics or link averages. |
| Aura/legacy: `LEGACY/aura/NodeCorruptionAuraDegradation.js`, `NodeLinkedAuraSystem.js` | `node.userData.corruptionLevel` / signals; read-only expected. |

### Metric Chain (intended)
`NodeMetricEngine/SafeMetricsDNAIntegration → node.userData.metrics.corruption → MetricsRuntime_v1 relax/equalize → LinkCorruptionTransmission_v1 computes/updates link.userData.corruptionLevel → Corruption visuals (T2/FX/Spread/Particles) and HUD → global corruptionLevel via NetworkMetricsAggregator`

### Loops / Conflicts
- **Dual representations:** `node.userData.metrics.corruption` (canonical) vs `node.userData.corruption` / `corruptionLevel` (legacy). LinkCorruptionTransmission writes the legacy field, not metrics.
- **NodeLinkingSystem contagion:** writes `node.userData.corruptionLevel` directly; bypasses canonical metrics and guard.
- **Visual gameplay write:** CorruptionVisualFX_v1 mutates `node.userData.gameplay.corruptionLevel` for visuals; separated but could diverge from canonical.
- **Multiple link writers:** LinkCorruptionTransmission (canonical) plus PHASE5_NetworkSynchronization (sync) — acceptable if PHASE5 remains clamping only.

### Legacy / Deprecated
- `LEGACY/HOTFIX_EmergencyVisualStabilization_v1.js` (not active).
- Legacy aura degradation (`NodeCorruptionAuraDegradation.js`) uses `corruptionLevel` visuals only.

## Recommendations (proposal; no code changes made)
1) Route node corruption infection/healing through NodeMetricEngine (or provide guard-blessed helper) instead of writing `userData.corruption`/`corruptionLevel` directly in LinkCorruptionTransmission and NodeLinkingSystem.  
2) Add a compatibility shim to sync legacy `userData.corruptionLevel` → `metrics.corruption` at read time, then deprecate legacy writes.  
3) Keep link corruption single-authority: ensure PHASE5_NetworkSynchronization only clamps and does not introduce new logic; prevent other systems from assigning `link.userData.corruptionLevel`.  
4) Mark CorruptionVisualFX gameplay writes as visual-only; avoid consumers treating `node.userData.gameplay.corruptionLevel` as canonical.
