# FIX — GLOBAL METRICS ZERO LINK GUARD

Change made: Added a guard in `MetricsRuntime_v1._publishLiveMetrics()` to zero all core global metrics when no links exist in the network.

Behavior:
- Counts links via `this.networkResolver?.linkSystem?.links?.length ?? 0`.
- If totalLinks === 0:
  - `networkSynergy`, `harmonyFlow`, `networkStress`, `corruptionLevel` → 0
  - `loadPressure` preserved from baseline node aggregation (clamped)
  - `nodeCount` preserved, `linkCount` = 0
  - Early return prevents further aggregation/smoothing.

Scope impact:
- HUD now shows zeroed core globals on empty maps; loadPressure still reflects node state.
