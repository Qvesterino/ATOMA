# LOAD PRESSURE AUDIT — ATOMA (2026-03-09)

## Goal
Verify implementation state of `node.userData.metrics.loadPressure`.

## Findings
- **Canonical writers (present):**
  - `NodeMetricEngine` (`src/metrics/NodeMetricEngine.js`): event impulses adjust `loadPressure` on link create/remove and overload; clamps 0–1; guard-authorized.
  - `MetricsRuntime_v1` (`MetricsRuntime_v1.js`): 10 Hz relax toward archetype baselines and equalization; traces mutations.
  - `SafeMetricsDNAIntegration1_0`: seeds `loadPressure` on spawn (from load capacity).
  - `MetricCompatibilityLayer`: fills `metrics.loadPressure` from legacy `userData.loadPressure` or inverse `energy` when missing (not in guard allow-list → compatibility writer).
- **Readers (active):**
  - Visual-derived: `NodeDynamicMetrics` → `visualMetrics.loadPressure` (0–100) for UIs/shaders.
  - Global aggregation: `NetworkMetricsAggregator`, `CoreMetricsCalculator/Overlay/HUD/ViewModel`, `SemanticMetricAdapter` (aliases networkLoad/loadNorm/energyNorm fallbacks).
  - Link visuals / conduits: `LinkRendererConduit` (thickness, shader uniforms), `LinkStateVisualLanguageIntegration`, `LinkSemanticPictogramSystem_Enhanced` (pictograms), `CanonicalTemplate3_StressVisuals` (stress overlays).
  - Gameplay gates: `LinkEligibilityGate_v1` (rebuild gating by network load), `ParticleEmissionScaler` (FX scaling).
- **Write authority check:** MetricAuthorityGuard lists only `NodeMetricEngine` for loadPressure; MetricsRuntime writes under guard via relax; CompatibilityLayer is outside allow-list (spawn fill).
- **Legacy/duplicates:** Multiple aliases (`load`, `loadRatio`, `networkLoad`, `energyNorm`) used as fallbacks in adapters; no separate link-level canonical loadPressure metric identified.

## Status
**ACTIVE** — loadPressure is implemented with canonical writers and multiple readers; not a placeholder.

## Risks / Notes
- CompatibilityLayer writes outside guard; consider blessing or routing through NodeMetricEngine to avoid silent divergence.
- SafeMetricsDNAIntegration overwrites metrics on archetype nodes; ensure it preserves loadPressure when merging snapshots.
- Alias proliferation (load/loadRatio/networkLoad/energyNorm) may hide missing canonical values; prefer canonical `metrics.loadPressure` in new code.

## Mutation Chain
`SafeMetricsDNAIntegration → NodeMetricEngine (events) → node.userData.metrics.loadPressure → MetricsRuntime_v1 relax/equalize → SemanticMetricAdapter/NetworkMetricsAggregator → overlays/HUD & link visuals (thickness/stress)`.
