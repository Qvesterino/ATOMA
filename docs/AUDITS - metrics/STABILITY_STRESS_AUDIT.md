# STABILITY / STRESS AUDIT — ATOMA (2026-03-09)

## Goal
Map stability-related metrics and stress systems. Canonical metric: `node.userData.metrics.stability` (0–1). Related global: `networkStress` (derived).

## Quick Findings
- **Canonical writers:** `NodeMetricEngine` (event impulses) and `MetricsRuntime_v1` (10 Hz relax/equalize) actively mutate `node.userData.metrics.stability`.
- **Compatibility writer:** `SafeMetricsDNAIntegration1_0` (spawn snapshot) seeds stability; `MetricCompatibilityLayer` fills stability from legacy `userData.instability` → not listed in MetricAuthorityGuard.
- **Non-canonical writes:** `CriticalNodeFailureSystem` regenerates `node.userData.stability` (legacy field, not metrics). Risk of divergence from canonical metrics.
- **Stress is derived, not canonical:** `networkStress` computed by MetricInterpretationLayer_v1 / NetworkMetricsAggregator / LinkCorruptionTransmission_v1; visuals consume it (e.g., CanonicalTemplate3_StressVisuals). No direct writes to `node.userData.metrics.stability`.
- **No active stabilization hotfix:** `LEGACY/HOTFIX_EmergencyVisualStabilization_v1.js` is legacy and removed from main.js.

## Classification

### Metric Writers (stability)
| System | File | Scope | Notes |
| --- | --- | --- | --- |
| NodeMetricEngine | `src/metrics/NodeMetricEngine.js` | EVENT | Adjusts stability on overload (reduces), clamps 0–1. Authority-approved. |
| MetricsRuntime_v1 | `MetricsRuntime_v1.js` | FIXED 10 Hz | Relaxes toward archetype baselines; equalizes stability across linked nodes; traces mutations. |
| SafeMetricsDNAIntegration1_0 | `SafeMetricsDNAIntegration1_0.js` | SPAWN SNAPSHOT | Seeds metrics including stability once at spawn. |
| MetricCompatibilityLayer | `MetricCompatibilityLayer.js` | SPAWN FILL | Writes stability from legacy `instability` (1 - instability) when missing. Not in guard allow-list → non-canonical writer. |
| (Legacy) CriticalNodeFailureSystem | `CriticalNodeFailureSystem.js` | RUNTIME | Writes `node.userData.stability` (not metrics) for isolated-node recovery; bypasses canonical metrics. |

### Stress / Derived Systems
| Purpose | Systems (files) | Data used |
| --- | --- | --- |
| Compute networkStress | `MetricInterpretationLayer_v1.js`, `NetworkMetricsAggregator.js`, `LinkCorruptionTransmission_v1.js` | Derived from node stability/load or collapsed links; stored in global metrics. |
| Stress visuals | `CanonicalTemplate3_StressVisuals.js`, `LinkStateVisualLanguageIntegration.js`, `NeonLinkVisuals.js`, `ParticleEmissionScaler.js` | Read networkStress/load to drive fog, color, particle density. |
| Stress guidance | `StressTurbulenceController.js` (visual-only; forbids networkStress writes), `StressTurbulenceIntegrationGuide.js` (guidance). |

### Visual / Read Layers (stability)
| Systems | Notes |
| --- | --- |
| VisualDerivedMetrics (NodeDynamicMetrics.js) → `visualMetrics.stabilityNorm` (0–100) | Read-only from canonical metrics. |
| Glyph/overlay systems (`_AdaptiveGlyphRendering1_0.js`, `SystemStateOverlay.js`, `MetricInterpretationLayer_v1.js`) | Use stability for halos/jitter/readouts. |
| Shaders (`ExtremeAIShaderPack.js`, `LinkStateVisualLanguageIntegration.js`) | Uniforms `u_stability` / stress blending. |

## Metric Conflicts / Risks
- Dual writer (intended): NodeMetricEngine (events) + MetricsRuntime_v1 (fixed tick). Acceptable but remain coordinated.
- MetricCompatibilityLayer writes stability outside guard: could mask archetype baselines if legacy fields present.
- CriticalNodeFailureSystem writes legacy `userData.stability`, not canonical metrics → divergence risk between visuals and gameplay metrics.
- No evidence of HarmonyStabilizationSystem_v1 writing stability (Phase C.3 visual-only).

## Mutation Chain (intended)
`NodeMetricEngine/SafeMetricsDNAIntegration → node.userData.metrics.stability → MetricsRuntime_v1 relax/equalize → NetworkMetricsAggregator / MetricInterpretationLayer compute networkStress → stress visuals (fog/color/particles) & HUD/overlays`

## Legacy / Deprecated
- `LEGACY/HOTFIX_EmergencyVisualStabilization_v1.js` — emergency visual stabilizer; removed from main.js, keep inactive.
- Legacy direct field `node.userData.stability` persists in some systems (e.g., CriticalNodeFailureSystem). Should remain read-only or be migrated to canonical metrics.

## Recommendations (proposal; no code changes made)
1) Add MetricCompatibilityLayer to MetricAuthorityGuard allow-list or route its fills through NodeMetricEngine to keep governance consistent.
2) Migrate CriticalNodeFailureSystem to read/write `node.userData.metrics.stability` via NodeMetricEngine helper; otherwise mark as legacy-only.
3) Keep stress systems strictly derived/read-only; ensure no visual system writes back to stability/networkStress. Use guard scans to prevent `.networkStress =` patterns (already enforced in StressTurbulenceController guidance).
