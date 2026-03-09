/**
 * Metric Compatibility Layer
 * Maps legacy node fields into canonical node.userData.metrics without changing gameplay logic.
 * Canonical metrics live in node.userData.metrics:
 *   synergy, harmony, stability, corruption, loadPressure
 * Legacy fields (read-only):
 *   clarity -> harmony
 *   instability -> 1 - stability
 *   energy (old) -> inverse loadPressure
 */
export function applyMetricCompatibility(nodes = []) {
  for (const node of nodes) {
    // Restrict to spawn-only path
    const spawnPhase = node?.__spawnPhase ?? node?.__isSpawnInitialization;
    if (!spawnPhase) continue;

    const ud = node?.userData;
    if (!ud) continue;

    const metrics = ud.metrics || (ud.metrics = {});

    const fillIfMissing = (key, value) => {
      if (metrics[key] === undefined && value !== undefined) {
        metrics[key] = value;
      }
    };

    fillIfMissing('synergy', ud.synergy);

    fillIfMissing('harmony', ud.harmony);
    if (metrics.harmony === undefined && ud.clarity !== undefined) {
      metrics.harmony = ud.clarity; // legacy clarity maps to harmony
    }

    fillIfMissing('stability', ud.stability);
    if (metrics.stability === undefined && ud.instability !== undefined) {
      metrics.stability = 1 - ud.instability; // legacy instability maps to 1 - stability
    }

    fillIfMissing('corruption', ud.corruption);

    if (metrics.loadPressure === undefined) {
      if (ud.loadPressure !== undefined) {
        metrics.loadPressure = ud.loadPressure;
      } else if (ud.energy !== undefined) {
        metrics.loadPressure = 1 - ud.energy; // legacy energy maps to inverse loadPressure
      }
    }
  }
}
