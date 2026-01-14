import { aggregateNetworkCanonicalMetrics, withGlobalMetricAliases } from './SemanticMetricAdapter.js';

/**
 * ============================================================================
 * CORE METRICS VIEW MODEL (v1)
 * ============================================================================
 * Global, read-only snapshot of the current system state.
 *
 * SOURCE OF TRUTH:
 * - Aggregated (average) values from node.userData.metrics via semantic adapter
 *
 * RESPONSIBILITY:
 * - Expose the current "health" of the entire network
 * - Provide a single canonical object for HUD, debug, and AI tooling
 *
 * IMPORTANT:
 * - This file MUST NOT compute gameplay logic
 * - This file MUST NOT modify nodes, links, or metrics
 * ============================================================================
 */

export function createEmptyCoreMetricsViewModel() {
  return {
    frameId: 0,
    timestamp: 0,

    metrics: {
      // Canonical global naming
      networkSynergy: 0,
      harmonyFlow: 0,
      networkStress: 0,
      corruptionLevel: 0,
      loadPressure: 0,
      // Legacy norm aliases preserved for compatibility
      harmonyNorm: 0,
      stabilityNorm: 0,
      corruptionNorm: 0,
      energyNorm: 0,
    },

    meta: {
      nodeCount: 0,
      sampleSize: 0,
      coverageRatio: 0,
    },
  };
}

/**
 * Update global core metrics by averaging per-node visualMetrics.
 * Read-only aggregation; safe to call each frame.
 */
const DEBUG = false;
const DEBUG_INTERVAL_MS = 2000;
let lastDebugLog = 0;

export function updateCoreMetricsViewModel(coreMetricsVM, aiNodes, frameId) {
  if (!coreMetricsVM) return;

  const nodes = Array.isArray(aiNodes?.nodes)
    ? aiNodes.nodes
    : (Array.isArray(aiNodes) ? aiNodes : []);
  const nodeCount = nodes.length;

  const aggregated = aggregateNetworkCanonicalMetrics(nodes);
  const metrics = withGlobalMetricAliases(aggregated);

  // Canonical global fields
  coreMetricsVM.metrics.networkSynergy = metrics.networkSynergy;
  coreMetricsVM.metrics.harmonyFlow = metrics.harmonyFlow;
  coreMetricsVM.metrics.networkStress = metrics.networkStress;
  coreMetricsVM.metrics.corruptionLevel = metrics.corruptionLevel;
  coreMetricsVM.metrics.loadPressure = metrics.loadPressure;

  // Legacy aliases (kept to avoid breaking existing consumers)
  coreMetricsVM.metrics.harmonyNorm = metrics.harmonyFlow;
  coreMetricsVM.metrics.stabilityNorm = metrics.networkStress;
  coreMetricsVM.metrics.corruptionNorm = metrics.corruptionLevel;
  coreMetricsVM.metrics.energyNorm = metrics.loadPressure;

  coreMetricsVM.meta.nodeCount = nodeCount;
  coreMetricsVM.meta.sampleSize = metrics.sampleSize ?? 0;
  coreMetricsVM.meta.coverageRatio = nodeCount > 0 ? (metrics.sampleSize ?? 0) / nodeCount : 0;

  coreMetricsVM.frameId = frameId ?? coreMetricsVM.frameId;
  coreMetricsVM.timestamp = performance.now();

  if (DEBUG) {
    const now = performance.now();
    if (now - lastDebugLog >= DEBUG_INTERVAL_MS) {
      lastDebugLog = now;
      console.log(
        `[CoreMetricsVM] nodes=${nodeCount} samples=${sampleSize} ` +
        `H=${coreMetricsVM.metrics.harmonyNorm.toFixed(3)} ` +
        `S=${coreMetricsVM.metrics.stabilityNorm.toFixed(3)} ` +
        `C=${coreMetricsVM.metrics.corruptionNorm.toFixed(3)} ` +
        `E=${coreMetricsVM.metrics.SynergyNorm.toFixed(3)}`
      );
    }
  }
}
