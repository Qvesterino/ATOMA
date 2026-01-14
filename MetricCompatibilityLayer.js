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
    const ud = node?.userData;
    if (!ud) continue;

    const metrics = ud.metrics || (ud.metrics = {});

    if (metrics.synergy === undefined && ud.synergy !== undefined) {
      metrics.synergy = ud.synergy;
    }

    if (metrics.harmony === undefined) {
      if (ud.harmony !== undefined) {
        metrics.harmony = ud.harmony;
      } else if (ud.clarity !== undefined) {
        metrics.harmony = ud.clarity; // legacy clarity maps to harmony
      }
    }

    if (metrics.stability === undefined) {
      if (ud.stability !== undefined) {
        metrics.stability = ud.stability;
      } else if (ud.instability !== undefined) {
        metrics.stability = 1 - ud.instability; // legacy instability maps to 1 - stability
      }
    }

    if (metrics.corruption === undefined && ud.corruption !== undefined) {
      metrics.corruption = ud.corruption;
    }

    if (metrics.loadPressure === undefined) {
      if (ud.loadPressure !== undefined) {
        metrics.loadPressure = ud.loadPressure;
      } else if (ud.energy !== undefined) {
        metrics.loadPressure = 1 - ud.energy; // legacy energy maps to inverse loadPressure
      }
    }
  }
}
