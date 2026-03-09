/**
 * Metric Authority Guard (Safe Mode)
 * Logs (warn) when an unauthorized system writes to canonical metrics.
 *
 * Canonical protected metrics:
 * - node.userData.metrics.* (synergy, harmony, stability, corruption, loadPressure)
 * - link.userData.synergy
 *
 * Allowed writers:
 * - NodeMetricEngine              → node metrics
 * - ComputeSynergyScore2_1        → link.userData.synergy
 * - LinkCorruptionTransmission    → corruption (link/user)
 * - HarmonyStabilizationSystem    → harmony (node/link)
 *
 * Guard never throws; it only warns once per (system, metric).
 */
const ALLOWED = {
  synergy: ['ComputeSynergyScore2_1', 'NodeMetricEngine'],
  harmony: ['NodeMetricEngine', 'HarmonyStabilizationSystem'],
  stability: ['NodeMetricEngine'],
  corruption: ['LinkCorruptionTransmission', 'NodeMetricEngine'],
  loadPressure: ['NodeMetricEngine'],
};

const warned = new Set();

export function assertMetricAuthority(systemName, metric) {
  if (!metric || !systemName) return;
  const allowedList = ALLOWED[metric];
  if (allowedList && allowedList.includes(systemName)) {
    return; // authorized
  }
  const key = `${systemName}::${metric}`;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn('[MetricAuthorityGuard] Unauthorized write:', systemName, '→', metric);
}

/**
 * Helper for node metric writes.
 * @param {string} systemName
 * @param {object} metrics
 * @param {string} key
 * @param {number} value
 */
export function setNodeMetric(systemName, metrics, key, value) {
  assertMetricAuthority(systemName, key);
  metrics[key] = value;
}

/**
 * Optional mutation trace for canonical metrics.
 * Enabled when CONFIG.dev.metricMutationTrace === true.
 *
 * @param {string} system - writer system name
 * @param {string} metric - metric path (e.g., 'node.synergy', 'link.synergy')
 * @param {number} before - previous value
 * @param {number} after - new value
 * @param {string|number} targetId - node/link identifier for context
 */
export function traceMetricMutation(system, metric, before, after, targetId) {
  const enabled =
    typeof CONFIG !== 'undefined' &&
    CONFIG?.dev?.metricMutationTrace === true;
  if (!enabled) return;
  if (before === after) return;

  console.log(
    '[MetricTrace]',
    system,
    metric,
    before,
    '→',
    after,
    'target:',
    targetId
  );
}
