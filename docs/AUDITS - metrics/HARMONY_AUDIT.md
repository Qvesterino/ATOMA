# HARMONY AUDIT — ATOMA (2026-03-09)

## Goal
Map harmony metric architecture, writers, derived layers, visuals, and feedback risks. Canonical metric: `node.userData.metrics.harmony` (0–1).

## Quick Findings
- **Canonical writers (active):** `NodeMetricEngine` (event impulses) and `MetricsRuntime_v1` (10 Hz relax/equalize). Both operate on `node.userData.metrics.harmony` and are guard-authorized.
- **Compatibility writer:** `MetricCompatibilityLayer` back-fills `metrics.harmony` from legacy `userData.harmony/clarity` during spawn; not listed in MetricAuthorityGuard → flag as non-canonical writer.
- **HarmonyStabilizationSystem_v1** is Phase C.3 visual-only; tracks `harmonyLevel` in side maps/userData but does **not** write `node.userData.metrics.harmony`.
- **Illegal visual write risk:** `VisualTemplateReferenceImplementations.js` demonstrates per-frame aura logic that mutates `node.userData.harmony` (and even `+= 0.01`) — unconstitutional metric mutation outside authority.
- **Feedback gap:** No current feedback loop writes back to canonical harmony from visuals; main risk is accidental visual writes (see above), not missing computation.

## Classification

### Metric Writers (canonical / compatibility)
| System | File | Scope | Notes |
| --- | --- | --- | --- |
| NodeMetricEngine | `src/metrics/NodeMetricEngine.js` | EVENT | Adjusts harmony on link create/remove; clamps 0–1; authority-approved. |
| MetricsRuntime_v1 | `MetricsRuntime_v1.js` | FIXED 10 Hz | Relaxes toward archetype baselines; equalizes harmony across linked nodes; traces mutations. |
| SafeMetricsDNAIntegration1_0 | `SafeMetricsDNAIntegration1_0.js` | SPAWN SNAPSHOT | Seeds metrics (including harmony) once on spawn. |
| MetricCompatibilityLayer | `MetricCompatibilityLayer.js` | SPAWN FILL | Fills `metrics.harmony` from legacy `userData.harmony/clarity` when missing. Not in guard allow-list → **non-canonical writer**. |

### Derive / Read Layers
| Purpose | Systems (files) | Data used |
| --- | --- | --- |
| Visual-derived metrics | `NodeDynamicMetrics.js` (VisualDerivedMetrics) → `node.userData.visualMetrics.harmony` (0–100) | Reads canonical harmony. |
| Semantic/adapter | `SemanticMetricAdapter.js`, `CoreMetricsCalculator.js`, `NetworkMetricsAggregator.js`, `CoreMetricsOverlay/ViewModel/HUD` | Aggregate & present; read-only. |
| Synergy compute | `ComputeSynergyScore2_1.js` | Reads `visualMetrics.harmonyNorm`. |
| Link logic | `LinkPrioritySystem.js`, `LinkResonanceFlowSystem_Session124.js`, `LinkCorruptionTransmission_v1.js` (reads harmonyLevel), `HarmonyStabilizationSystem_v1.js` (reads synergy to scale harmony flow) | Expect harmony/harmonyLevel for modulation. |

### Visual Systems (read-only expected)
| Systems | Notes |
| --- | --- |
| HarmonyStabilizationSystem_v1.js (Phase C.3) | Tracks `harmonyLevel`, pulses, anchors; visual + corruption-mitigation logic; does not write canonical metrics. |
| T2_HarmonyVisualConsumer_v1.js | Consumes harmony runtime data for rendering. |
| SystemStateOverlay.js, _AdaptiveGlyphRendering1_0.js, MegaGlyphSystem.js, MetricInterpretationLayer_v1.js | Use harmony for halos/glyphs/labels. |
| Audio: AtomaAudioModulation.js, ZoneAudioReactivity.js | Modulate audio by harmony (read-only). |

## Illegal / Risky Writes Detected
- **VisualTemplateReferenceImplementations.js** — Example code writes `node.userData.harmony = ...` and `node.userData.harmony += 0.01` (per-frame). This is outside canonical authority and violates Single Writer Law. Must remain disabled or removed.
- **MetricCompatibilityLayer.js** — Writes canonical harmony during spawn without guard authorization; tolerated as compatibility but should be explicitly blessed or moved behind NodeMetricEngine.
- No active evidence of HarmonyStabilizationSystem writing `node.userData.metrics.harmony` (Phase C.3 lock).

## Feedback Chains
Intended chain:
`NodeMetricEngine/MetricsRuntime → node.userData.metrics.harmony → VisualDerivedMetrics (visualMetrics.harmonyNorm) → Read by visuals/synergy compute → visuals only`

Current risks:
- VisualTemplateReferenceImplementations could create a loop `harmony → aura → harmony mutation`, corrupting canonical metric if enabled.
- Compatibility layer may overwrite archetype baselines when legacy fields present (spawn-time only).

## Dependency Map (high level)
- **Sources (canonical):** NodeMetricEngine (events), MetricsRuntime_v1 (10 Hz), SafeMetricsDNAIntegration1_0 (spawn).
- **Compatibility fill:** MetricCompatibilityLayer (legacy → canonical).
- **Derived:** VisualDerivedMetrics → visualMetrics.harmonyNorm; SemanticMetricAdapter → harmonized views.
- **Consumers:** Link logic (priority/resonance/corruption), audio systems, overlays, glyph systems, HarmonyStabilizationSystem_v1 visuals.
- **Guards:** MetricAuthorityGuard allows `NodeMetricEngine`, `HarmonyStabilizationSystem` (unused), `MetricsRuntime_v1`; does **not** include MetricCompatibilityLayer or visual templates.

## Recommendations (proposal-only; no changes made)
1) Add MetricCompatibilityLayer to the authority allow-list or route its fills through NodeMetricEngine to avoid guard violations.
2) Ensure VisualTemplateReferenceImplementations remains non-executed; consider removing the harmony write examples or wrapping in explicit “do not enable” guard.
3) If future harmony propagation is needed, ensure any writes flow through NodeMetricEngine or MetricsRuntime and keep HarmonyStabilizationSystem strictly read-only/visual as per Phase C.3.
