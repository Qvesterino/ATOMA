# ATOMA METRICS — FLOW VALIDATION AUDIT (2026-03-09)

## Expected Pipeline
`node.userData.metrics.*` → `link.userData.synergy {score, synergyNorm}` → `world.metrics.global` (aggregates) → `visualMetrics` (NodeDynamicMetrics) → VFX/visual systems (read-only).

## Checks Performed
- Searched for writes to `node.userData.metrics.*` from visual/derive layers – none found.
- Searched for writes to `node.userData.metrics.*` from `visualMetrics` or VFX systems – none found.
- Verified current canonical writers are restricted to gameplay/metric layers: SafeMetricsDNAIntegration, MetricCompatibilityLayer (spawn), NodeMetricEngine, MetricsRuntime_v1, CriticalNodeFailureSystem (recovery), corruption/synergy systems.
- Confirmed link synergy writer is `NodeLinkingSystem` (ComputeSynergyScore2_1) only.
- Visual systems (LinkGlowSynergyEngine_v2/1_0, LinkRendererConduit, LinkVisualStateAdapter, CorruptionVisualFX, SynergyBonus FX layers, NeonLinkVisuals) read metrics/visualMetrics and do not write back to canonical metrics.

## Findings
- ✅ No visual → metrics writes detected.
- ✅ No derive layer (`visualMetrics`) → canonical metrics writes detected.
- ✅ Metric flow matches CLEAN MAP: canonical metrics feed link metrics, feed global aggregates, feed visualMetrics, feed visuals (read-only).

## Notes / Watchlist
- MetricCompatibilityLayer writes at spawn (allowed) — keep spawn guard in place.
- LinkMetricsSanityGuard writes legacy `userData.synergy` (not `metrics`) when sanitizing; does not touch canonical metrics.
- Continue to guard against future visual templates that attempt metric mutation.

## Conclusion
Flow is clean and compliant: canonical metrics are written only by authorized gameplay/metric systems; visual and derive layers remain read-only.
