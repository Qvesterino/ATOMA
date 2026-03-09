# FIX — METRIC TRUE ZERO STATE (NO LINKS)

Change: In `MetricsRuntime_v1._publishLiveMetrics()` global metrics now return early with **all zeros** (including loadPressure) when `totalLinks === 0` (`this.networkResolver?.linkSystem?.links?.length ?? 0`).

Behavior:
- No links → `networkSynergy`, `harmonyFlow`, `networkStress`, `corruptionLevel`, `loadPressure` all set to 0; `nodeCount` = 0, `linkCount` = 0; rest of publishing is skipped.
- Normal flow unchanged when links exist.

Impact:
- HUD/global metrics correctly show a true zero state on empty maps.
