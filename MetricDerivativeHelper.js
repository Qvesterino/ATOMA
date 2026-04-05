/**
 * METRIC DERIVATIVE CONSOLIDATION HELPER
 * 
 * Consolidates redundant metric variants into canonical 5.
 * Eliminates duplicate computations and normalizes to 0-1 range.
 * 
 * CANONICAL METRICS (5):
 * - synergy, harmony, stability, corruption, loadPressure
 * 
 * DEPRECATED VARIANTS (mapped to canonical):
 * - loadRatio → loadPressure
 * - corruptionNorm → corruption
 * - harmonyNorm → harmony
 * - stabilityNorm → stability
 * - loadPressureNorm → loadPressure
 * - synergyNorm → synergy
 * - energyNorm → (synergy + harmony) / 2
 * 
 * USAGE:
 *   import { getMetric, getMetrics, getAllMetrics } from './MetricDerivativeHelper.js';
 *   
 *   const load = getMetric(metrics, 'loadRatio');        // Returns metrics.loadPressure
 *   const stability = getMetric(metrics, 'stabilityNorm'); // Returns metrics.stability
 *   
 *   const all = getAllMetrics(metrics); // Returns consolidated object
 */

/**
 * Map of deprecated metric variants to canonical metrics
 */
const DERIVATIVE_MAP = {
  // Load variants
  'loadRatio': 'loadPressure',
  'load': 'loadPressure',
  'networkLoad': 'loadPressure',
  'loadRatioNorm': 'loadPressure',
  'loadPressureNorm': 'loadPressure',
  
  // Corruption variants
  'corruptionNorm': 'corruption',
  'corruptionLevel': 'corruption',
  
  // Harmony variants
  'harmonyNorm': 'harmony',
  'harmonyLevel': 'harmony',
  
  // Stability variants
  'stabilityNorm': 'stability',
  'instability': 'stability', // Note: inverse relationship
  
  // Synergy variants
  'synergyNorm': 'synergy',
  
  // Computed variants
  'energyNorm': 'energy', // Special case: computed
};

/**
 * Computed metric implementations
 */
const COMPUTED_METRICS = {
  /**
   * Energy norm = average of synergy and harmony
   */
  'energy': (metrics) => {
    const synergy = Number(metrics?.synergy) ?? 0.5;
    const harmony = Number(metrics?.harmony) ?? 0.5;
    return (synergy + harmony) / 2;
  },
};

/**
 * Clamp value to 0-1 range
 */
function clamp01(value) {
  const v = Number(value);
  return Math.max(0, Math.min(1, isFinite(v) ? v : 0));
}

/**
 * Get a single metric, automatically mapping deprecated variants to canonical
 * 
 * @param {Object} metrics - Metrics object
 * @param {string} metricName - Name of metric (canonical or deprecated)
 * @param {*} fallback - Fallback value if metric not found (default: 0)
 * @returns {number} Metric value (0-1 clamped)
 */
export function getMetric(metrics, metricName, fallback = 0) {
  if (!metrics || !metricName) {
    return fallback;
  }

  // Check if it's a computed metric
  if (COMPUTED_METRICS[metricName]) {
    const value = COMPUTED_METRICS[metricName](metrics);
    return isFinite(value) ? clamp01(value) : fallback;
  }

  // Map deprecated variant to canonical
  const canonicalName = DERIVATIVE_MAP[metricName] || metricName;
  
  // Get value
  const value = metrics[canonicalName];
  
  if (isFinite(value)) {
    return clamp01(value);
  }
  
  return fallback;
}

/**
 * Get multiple metrics at once
 * 
 * @param {Object} metrics - Metrics object
 * @param {string[]} metricNames - Array of metric names
 * @returns {Object} Object with metric names as keys and values as values
 */
export function getMetrics(metrics, metricNames) {
  const result = {};
  
  for (const name of metricNames) {
    result[name] = getMetric(metrics, name);
  }
  
  return result;
}

/**
 * Get all canonical metrics (the 5 core metrics)
 * 
 * @param {Object} metrics - Metrics object
 * @returns {Object} Object with all 5 canonical metrics
 */
export function getCanonicalMetrics(metrics) {
  return {
    synergy: getMetric(metrics, 'synergy'),
    harmony: getMetric(metrics, 'harmony'),
    stability: getMetric(metrics, 'stability'),
    corruption: getMetric(metrics, 'corruption'),
    loadPressure: getMetric(metrics, 'loadPressure'),
  };
}

/**
 * Get all metrics including deprecated variants (for backward compatibility)
 * 
 * @param {Object} metrics - Metrics object
 * @returns {Object} Object with all metrics (canonical + deprecated)
 */
export function getAllMetrics(metrics) {
  const result = {
    // Canonical metrics
    synergy: getMetric(metrics, 'synergy'),
    harmony: getMetric(metrics, 'harmony'),
    stability: getMetric(metrics, 'stability'),
    corruption: getMetric(metrics, 'corruption'),
    loadPressure: getMetric(metrics, 'loadPressure'),
    
    // Deprecated variants (for backward compatibility)
    loadRatio: getMetric(metrics, 'loadRatio'),
    load: getMetric(metrics, 'load'),
    networkLoad: getMetric(metrics, 'networkLoad'),
    corruptionNorm: getMetric(metrics, 'corruptionNorm'),
    corruptionLevel: getMetric(metrics, 'corruptionLevel'),
    harmonyNorm: getMetric(metrics, 'harmonyNorm'),
    harmonyLevel: getMetric(metrics, 'harmonyLevel'),
    stabilityNorm: getMetric(metrics, 'stabilityNorm'),
    instability: getMetric(metrics, 'instability'),
    synergyNorm: getMetric(metrics, 'synergyNorm'),
    energyNorm: getMetric(metrics, 'energyNorm'),
    loadPressureNorm: getMetric(metrics, 'loadPressureNorm'),
  };
  
  return result;
}

/**
 * Check if a metric name is canonical (one of the 5 core metrics)
 * 
 * @param {string} metricName - Name to check
 * @returns {boolean} True if canonical
 */
export function isCanonicalMetric(metricName) {
  const canonicalSet = new Set(['synergy', 'harmony', 'stability', 'corruption', 'loadPressure']);
  return canonicalSet.has(metricName);
}

/**
 * Get canonical name for a metric (returns input if already canonical)
 * 
 * @param {string} metricName - Name to normalize
 * @returns {string} Canonical metric name
 */
export function getCanonicalName(metricName) {
  return DERIVATIVE_MAP[metricName] || metricName;
}

/**
 * Migrate an object's deprecated metric properties to canonical names
 * Creates a new object with only canonical metrics
 * 
 * @param {Object} metrics - Metrics object with possibly deprecated names
 * @returns {Object} New object with only canonical metrics
 */
export function migrateToCanonical(metrics) {
  const result = {};
  
  for (const [key, value] of Object.entries(metrics || {})) {
    const canonicalName = getCanonicalName(key);
    result[canonicalName] = value;
  }
  
  return result;
}

export default {
  getMetric,
  getMetrics,
  getCanonicalMetrics,
  getAllMetrics,
  isCanonicalMetric,
  getCanonicalName,
  migrateToCanonical,
};
