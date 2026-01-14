/**
 * ============================================================================
 * CORE METRICS VIEW MODEL (v1)
 * ============================================================================
 * Global, read-only snapshot of the current system state.
 *
 * SOURCE OF TRUTH:
 * - Aggregated (average) values from node.userData.visualMetrics
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
updateCoreMetricsViewModel(coreMetricsVM, aiNodes, frameId)
