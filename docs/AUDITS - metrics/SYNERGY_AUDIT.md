# SYNERGY AUDIT — ATOMA (2026-03-09)

## Goal
Map the complete architecture of the **synergy** metric across links and nodes.

## Quick Findings
- **Canonical link writer missing:** No runtime system populates `link.userData.synergy` today. `ComputeSynergyScore2_1` exists but is not wired; `NodeLinkingSystem` still writes legacy `link['synergyScore']`.
- **Node metrics have governed writers:** `NodeMetricEngine` (event impulses) and `MetricsRuntime_v1` (10 Hz relax/equalize) mutate `node.userData.metrics.synergy` within authority rules.
- **Readers expect canonical link object:** Multiple systems (LinkPrioritySystem, HarmonyStabilizationSystem_v1, LinkCorruptionTransmission_v1, MetricsRuntime_v1 aggregator) read `link.userData.synergy.score`; they currently see `undefined`, so fallbacks or zeroes apply.
- **Legacy/fragmented fields:** `link['synergyScore']` (number), expected `link.userData.synergy2_1` object, and derived `link.userData.synergyBonus` coexist. VisualTemplateReferenceImplementations was a past per-frame writer (removed; still a risk if re-enabled).
- **Feedback loop gap:** Intended loop `node.metrics → visualMetrics → ComputeSynergyScore2_1 → link.userData.synergy → MetricsRuntime` is broken at the write step; there is no current path returning link synergy into the metrics layer.

## System Classification

### Writers
| Target | System | File | Notes |
| --- | --- | --- | --- |
| `node.userData.metrics.synergy` | NodeMetricEngine | `src/metrics/NodeMetricEngine.js` | Event impulses on link create/remove/overload; clamps 0..1; authority-guarded. |
| `node.userData.metrics.synergy` | MetricsRuntime_v1 | `MetricsRuntime_v1.js` | Fixed 10 Hz relax toward archetype + link equalization; traces mutations. |
| `node.userData.metrics.synergy` (spawn snapshot) | SafeMetricsDNAIntegration1_0 | `SafeMetricsDNAIntegration1_0.js` | Initializes metrics on spawn (one-time snapshot). |
| **(Missing)** `link.userData.synergy {score, synergyNorm}` | — | — | Expected `ComputeSynergyScore2_1` writer not wired; legacy `link['synergyScore']` used instead. |
| `link.userData.synergyBonus` (derived visual) | SynergyBonusVisualization_v1 | `SynergyBonusVisualization_v1.js` | Visual-only enhancement object (tier, pulseStrength, etc.). |

### Readers (logic / non-visual)
| Reads | Systems | Role |
| --- | --- | --- |
| `link.userData.synergy.score` | LinkPrioritySystem, LinkResonanceFlowSystem_Session124, HarmonyStabilizationSystem_v1, LinkCorruptionTransmission_v1, MetricsRuntime_v1 `_aggregateLinkSynergy`, LinkSemanticPictogramSystem | Use link synergy for priority decay, flow rates, stabilization, corruption spread, and global aggregation. |
| `node.userData.metrics.synergy` | MetricsRuntime_v1 (relax/equalize), SemanticMetricAdapter, NetworkMetricsAggregator, LinkRendererConduit, SystemStateOverlay, AI feeds (`_AIEmotionalFeed3_1`, `MetricReactiveWorldEvents`, etc.) | Gameplay/logical reads and global summaries. |

### Visual Systems (read-only expected)
| Source | Visual systems |
| --- | --- |
| `link.userData.synergy (score/synergyNorm)` | LinkGlowSynergyEngine_v2, LinkGlowSynergyEngine1_0 (fallback), LinkVisualStateAdapter, LinkStateVisualLanguageIntegration, LinkSurfacePhaseRipples, LinkResonanceFlowSystem_Session124, NodeLinkedAuraSystem_Session123. |
| `link.userData.synergyBonus` | SynergyBonusVisualization_v1, SynergyBonusFXLayer_v1, SynergyResonanceShaderPack_v1, SynergyChainReaction_v1, ResonanceFeedback_v1. |
| `node.userData.metrics.synergy` | VisualDerivedMetrics (→ visualMetrics.synergy 0–100), MetricInterpretationLayer_v1, SynergyCascadeVisualizer, MegaGlyphSystem, SystemStateOverlay halos, _AdaptiveGlyphRendering1_0. |
| Legacy risk | VisualTemplateReferenceImplementations (docs show past per-frame write `link.userData.synergy = glow.intensity`; currently removed but flagged as unconstitutional). |

## Canonical Writer Status (link)
- **Intended:** `ComputeSynergyScore2_1` should emit `{score, synergyNorm, tier, ...}` and be stored on `link.userData.synergy`.
- **Actual:** `NodeLinkingSystem` computes `synergyResult = ComputeSynergyScore2_0(...)` and stores numeric `link['synergyScore']` only; `link.userData.synergy` remains undefined.
- **Impact:** All consumers that expect `userData.synergy.score` (including MetricsRuntime aggregation and LinkPrioritySystem) see `undefined` → fall back to defaults or zeros → muted synergy-driven behavior and broken derivations (e.g., LinkGlowSynergyEngine_v2 reverts to legacy intensity).

## Legacy / Fragmentation Patterns
- `link['synergyScore']` — legacy numeric field used for link visuals and particle speeds in `NodeLinkingSystem`.
- `link.userData.synergy2_1` — schema referenced in docs; no active writer found.
- `link.userData.synergyBonus` — derived visual tier object; not canonical gameplay.
- Past per-frame visual writes to `link.userData.synergy` (VisualTemplateReferenceImplementations) are unconstitutional; ensure guard remains.

## Mutation Chain (intended vs. actual)
- **Intended chain:** `node.userData.metrics` (NodeMetricEngine + MetricsRuntime) → `VisualDerivedMetrics` → `ComputeSynergyScore2_1` → `link.userData.synergy {score, synergyNorm}` → readers (priority, stabilization, corruption transmission, glow engines) → `MetricsRuntime` aggregates global link synergy.
- **Actual chain:** `node.userData.metrics` → `VisualDerivedMetrics` → _ComputeSynergyScore2_1 not used_ → `link['synergyScore']` (legacy number) → visuals inside `NodeLinkingSystem` only. Canonical `link.userData.synergy` stays empty; global/link-driven logic operates on fallbacks.

## Observations / Risks
- Dual writers on node metrics are intentional (event + fixed tick) but remain within allowed authority.
- Link synergy authority effectively absent; MetricAuthorityGuard expects `ComputeSynergyScore2_1` yet never sees writes, so no guard warnings but downstream starvation.
- Feedback loops (node → link → node/global) are incomplete; corruption/harmony interactions via link synergy do not execute as designed.

## Suggested next steps (execution requires approval)
1) Wire `ComputeSynergyScore2_1` into `NodeLinkingSystem` create-link path and persist result to `link.userData.synergy` (object), keeping `link['synergyScore']` as a temporary compatibility mirror.  
2) Add a thin adapter to populate `link.userData.synergy` before `MetricsRuntime_v1` aggregation runs, preventing zeroed link metrics.  
3) Audit and remove any residual visual writes to `link.userData.synergy`; keep MetricAuthorityGuard warnings enabled.
