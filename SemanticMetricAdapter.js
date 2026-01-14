/**
 * Semantic Metric Naming Adapter
 * Centralizes legacy → canonical metric aliases without changing numeric behavior.
 *
 * Canonical per-node: synergy, harmony, stability, corruption, load
 * Canonical global: networkSynergy, harmonyFlow, networkStress, corruptionLevel, loadPressure
 */
function firstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

/**
 * Resolve a node's metrics into canonical names using legacy fallbacks.
 * Does not mutate the node.
 */
export function getNodeCanonicalMetrics(node) {
  const metrics = node?.userData?.metrics || {};

  const synergy = firstDefined(
    metrics.synergy,
    metrics.synergyNorm,
    metrics.networkSynergy
  );

  const harmony = firstDefined(
    metrics.harmony,
    metrics.harmonyNorm,
    metrics.clarity
  );

  const stability = firstDefined(
    metrics.stability,
    metrics.integrity
  );

  const corruption = firstDefined(
    metrics.corruption,
    metrics.corruptionNorm
  );

  let load = firstDefined(
    metrics.load,
    metrics.loadPressure,
    metrics.loadRatio
  );

  // Legacy energy → inverse load (kept for backward compatibility; same behavior as legacy compatibility layer)
  if (load === undefined && typeof metrics.energy === 'number') {
    load = 1 - metrics.energy;
  }
  if (load === undefined && typeof metrics.energyNorm === 'number') {
    load = 1 - metrics.energyNorm;
  }

  return { synergy, harmony, stability, corruption, load };
}

/**
 * Aggregate canonical network metrics (simple averages; no scaling changes).
 */
export function aggregateNetworkCanonicalMetrics(nodes = []) {
  let sumSynergy = 0;
  let sumHarmony = 0;
  let sumStability = 0;
  let sumCorruption = 0;
  let sumLoad = 0;
  let sampleSize = 0;

  for (const node of nodes) {
    const m = getNodeCanonicalMetrics(node);
    const hasAny =
      m.synergy !== undefined ||
      m.harmony !== undefined ||
      m.stability !== undefined ||
      m.corruption !== undefined ||
      m.load !== undefined;

    if (!hasAny) continue;

    sumSynergy += m.synergy ?? 0;
    sumHarmony += m.harmony ?? 0;
    sumStability += m.stability ?? 0;
    sumCorruption += m.corruption ?? 0;
    sumLoad += m.load ?? 0;
    sampleSize += 1;
  }

  const divisor = sampleSize > 0 ? sampleSize : 1;

  return {
    networkSynergy: sumSynergy / divisor,
    harmonyFlow: sumHarmony / divisor,
    networkStress: sumStability / divisor,
    corruptionLevel: sumCorruption / divisor,
    loadPressure: sumLoad / divisor,
    sampleSize
  };
}

/**
 * Add canonical global aliases while preserving legacy fields.
 */
export function withGlobalMetricAliases(globalMetrics = {}) {
  return {
    ...globalMetrics,
    networkSynergy: firstDefined(globalMetrics.networkSynergy, globalMetrics.synergy),
    harmonyFlow: firstDefined(globalMetrics.harmonyFlow, globalMetrics.harmony, globalMetrics.harmonyNorm),
    networkStress: firstDefined(globalMetrics.networkStress, globalMetrics.stability, globalMetrics.stabilityNorm, globalMetrics.instability),
    corruptionLevel: firstDefined(globalMetrics.corruptionLevel, globalMetrics.corruption, globalMetrics.corruptionNorm),
    loadPressure: firstDefined(globalMetrics.loadPressure, globalMetrics.networkLoad, globalMetrics.energyNorm, globalMetrics.loadNorm),
    // Legacy norm aliases kept for compatibility with existing consumers
    harmonyNorm: firstDefined(globalMetrics.harmonyNorm, globalMetrics.harmonyFlow),
    stabilityNorm: firstDefined(globalMetrics.stabilityNorm, globalMetrics.networkStress),
    corruptionNorm: firstDefined(globalMetrics.corruptionNorm, globalMetrics.corruptionLevel),
    energyNorm: firstDefined(globalMetrics.energyNorm, globalMetrics.loadPressure),
    loadNorm: firstDefined(globalMetrics.loadNorm, globalMetrics.loadPressure)
  };
}

/**
 * Map any metrics object into the HUD-facing canonical names with legacy fallbacks.
 */
export function projectHudMetrics(metrics = {}) {
  return {
    networkSynergy: firstDefined(metrics.networkSynergy, metrics.synergy, metrics.synergyNorm),
    harmonyFlow: firstDefined(metrics.harmonyFlow, metrics.harmony, metrics.harmonyNorm, metrics.clarity),
    networkStress: firstDefined(metrics.networkStress, metrics.instability, metrics.stability, metrics.stabilityNorm),
    corruptionLevel: firstDefined(metrics.corruptionLevel, metrics.corruption, metrics.corruptionNorm),
    loadPressure: firstDefined(metrics.loadPressure, metrics.networkLoad, metrics.energyNorm, metrics.loadNorm, metrics.loadRatio)
  };
}
