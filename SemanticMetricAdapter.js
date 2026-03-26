/**
 * Semantic Metric Naming Adapter
 * CENTRAL AUTHORITY for all metric reads in ATOMA.
 *
 * Canonical per-node: synergy, harmony, stability, corruption, loadPressure
 * Canonical per-link: synergy, corruption
 * Canonical global: networkSynergy, harmonyFlow, networkStress, corruptionLevel, loadPressure *
 * ARCHITECTURAL CONTRACT:
 * - All systems MUST read canonical metrics via this adapter
 * - Legacy fields trigger deprecation warnings
 * - No duplicate alias mapping elsewhere
 */

// Warning deduplication to prevent console spam
const WARNED_LEGACY_ACCESS = new Set();

/**
 * Log deprecation warning for legacy field access (once per field)
 */
function warnLegacyAccess(context, field, canonicalPath) {
  const key = `${context}.${field}`;
  if (!WARNED_LEGACY_ACCESS.has(key)) {
    WARNED_LEGACY_ACCESS.add(key);
    console.warn(
      `[SemanticMetricAdapter] ⚠️ LEGACY FIELD: ${context}.${field}. ` +
      `Use ${canonicalPath} instead. ` +
      `This warning appears only once per field.`
    );
  }
}

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
    node?.userData?.harmonyLevel,  // Canonical: HarmonyStabilizationSystem_v1 writes here
    metrics.harmony,
    metrics.harmonyNorm
  );

  const stability = firstDefined(
    metrics.stability,
    metrics.integrity
  );

  const corruption = firstDefined(
    metrics.corruption,
    metrics.corruptionNorm
  );

  let loadPressure = firstDefined(
    metrics.loadPressure,
    metrics.load,
    metrics.loadRatio
  );

  // Return canonical name; keep legacy alias for compatibility with existing consumers.
  return {
    synergy,
    harmony,
    stability,
    corruption,
    loadPressure,
    load: loadPressure
  };
}

/**
 * Aggregate canonical network metrics (simple averages; no scaling changes).
 */
export function aggregateNetworkCanonicalMetrics(nodes = []) {
  let sumSynergy = 0;
  let sumHarmony = 0;
  let sumStability = 0;
  let sumCorruption = 0;
  let sumLoadPressure = 0;
  let sampleSize = 0;

  for (const node of nodes) {
    const m = getNodeCanonicalMetrics(node);
    const hasAny =
      m.synergy !== undefined ||
      m.harmony !== undefined ||
      m.stability !== undefined ||
      m.corruption !== undefined ||
      m.loadPressure !== undefined;

    if (!hasAny) continue;

    sumSynergy += m.synergy ?? 0;
    sumHarmony += m.harmony ?? 0;
    sumStability += m.stability ?? 0;
    sumCorruption += m.corruption ?? 0;
    sumLoadPressure += m.loadPressure ?? 0;
    sampleSize += 1;
  }

  const divisor = sampleSize > 0 ? sampleSize : 1;

  return {
    networkSynergy: sumSynergy / divisor,
    harmonyFlow: sumHarmony / divisor,
    networkStress: sumStability / divisor,
    corruptionLevel: sumCorruption / divisor,
    loadPressure: sumLoadPressure / divisor,
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
    networkStress: firstDefined(globalMetrics.networkStress, globalMetrics.stability, globalMetrics.stabilityNorm, globalMetrics.stability),
    corruptionLevel: firstDefined(globalMetrics.corruptionLevel, globalMetrics.corruption, globalMetrics.corruptionNorm),
    loadPressure: firstDefined(globalMetrics.loadPressure, globalMetrics.networkLoad, globalMetrics.energyNorm, globalMetrics.loadNorm, globalMetrics.loadRatio),
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
  const safeValue = (value) => (value === undefined || value === null ? 0 : value);

  return {
    networkSynergy: safeValue(metrics.networkSynergy ?? metrics.synergy ?? metrics.synergyNorm),
    harmonyFlow: safeValue(metrics.harmonyFlow ?? metrics.harmony ?? metrics.harmonyNorm ?? metrics.harmony),
    networkStress: safeValue(metrics.networkStress ?? metrics.stability ?? metrics.stability ?? metrics.stabilityNorm),
    corruptionLevel: safeValue(metrics.corruptionLevel ?? metrics.corruption ?? metrics.corruptionNorm),
    loadPressure: safeValue(metrics.loadPressure ?? metrics.networkLoad ?? metrics.loadNorm ?? metrics.loadRatio ?? metrics.load)
  };
}

// ============================================================================
// LINK METRICS (merged from MetricRuntimeAdapter)
// ============================================================================

/**
 * Resolve a link's synergy metric into canonical form with legacy fallbacks.
 * Canonical: link.userData.synergy.score
 * Legacy: link.synergyScore, link.synergy, link.synergy2_1
 */
export function getLinkSynergy(link) {
  // Try canonical first: link.userData.synergy.score
  if (link?.userData?.synergy?.score !== undefined) {
    const value = link.userData.synergy.score;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(1, value));
    }
  }

  // Try canonical variant: link.userData.synergy.synergyNorm
  if (link?.userData?.synergy?.synergyNorm !== undefined) {
    const value = link.userData.synergy.synergyNorm;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(1, value));
    }
  }

  // Legacy fallback: link.synergyScore
  if (link?.synergyScore !== undefined) {
    warnLegacyAccess('link', 'synergyScore', 'link.userData.synergy.score');
    const value = link.synergyScore;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(1, value));
    }
  }

  // Legacy fallback: link.synergy
  if (link?.synergy !== undefined) {
    warnLegacyAccess('link', 'synergy', 'link.userData.synergy.score');
    const value = link.synergy;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(1, value));
    }
  }

  return 0.5; // Default neutral synergy
}

/**
 * Resolve a link's corruption metric into canonical form with legacy fallbacks.
 * Canonical: link.userData.corruptionLevel
 * Legacy: link.corruption, link.corruptionIntensity
 */
export function getLinkCorruption(link) {
  // Try canonical first
  if (link?.userData?.corruptionLevel !== undefined) {
    const value = link.userData.corruptionLevel;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(1, value));
    }
  }

  // Legacy fallback: link.corruption
  if (link?.corruption !== undefined) {
    warnLegacyAccess('link', 'corruption', 'link.userData.corruptionLevel');
    const value = link.corruption;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(1, value));
    }
  }

  // Legacy fallback: link.corruptionIntensity
  if (link?.corruptionIntensity !== undefined) {
    warnLegacyAccess('link', 'corruptionIntensity', 'link.userData.corruptionLevel');
    const value = link.corruptionIntensity;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(1, value));
    }
  }

  return 0;
}

/**
 * Get all canonical link metrics as object
 */
export function getLinkCanonicalMetrics(link) {
  return {
    synergy: getLinkSynergy(link),
    corruption: getLinkCorruption(link)
  };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Project canonical link metrics into a stable visual profile.
 *
 * Visual consumers can use this instead of legacy submetric objects.
 */
export function getLinkSynergyVisualMetrics(link) {
  const synergy = getLinkSynergy(link);
  const corruption = getLinkCorruption(link);

  const tier =
    synergy >= 0.90 ? 3 :
    synergy >= 0.70 ? 2 :
    synergy >= 0.40 ? 1 :
    0;

  const tierName =
    tier === 1 ? 'SOFT_BOOST' :
    tier === 2 ? 'STRONG_PULSE' :
    tier === 3 ? 'MYTHIC_RESONANCE' :
    'NONE';

  return {
    synergy,
    corruption,
    tier,
    tierName,
    pulseStrength: clamp01(synergy * synergy),
    chromaShift: clamp01(synergy * (1 - corruption * 0.35)),
    resonanceRipples: clamp01(synergy * (1 - corruption * 0.5))
  };
}

// ============================================================================
// HUD UPDATE FUNCTION (merged from CoreMetricsEngineAdapter)
// ============================================================================

/**
 * Derive HUD-ready metrics from engine objects.
 * Safe to call every frame; returns canonical metrics for HUD consumers.
 * 
 * @param {Object} link - Link object (optional, for link-based metrics)
 * @param {Object} vm - ViewModel with network metrics
 * @returns {Object} HUD-ready canonical metrics
 */
export function updateHudMetrics(link, vm) {
  const globalMetrics = withGlobalMetricAliases({
    networkSynergy: vm?.networkSynergy ?? vm?.synergy ?? link?.['synergyScore'],
    harmonyFlow: vm?.harmonyFlow ?? vm?.harmonyNorm ?? vm?.harmony,
    networkStress: vm?.networkStress ?? vm?.stabilityNorm ?? vm?.stability,
    corruptionLevel: vm?.corruptionLevel ?? vm?.corruptionNorm ?? vm?.corruption,
    loadPressure: vm?.loadPressure ?? vm?.loadNorm ?? vm?.networkLoad ?? vm?.energyNorm
  });

  return projectHudMetrics(globalMetrics);
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Clear legacy warning cache (for testing)
 */
export function clearLegacyWarningCache() {
  WARNED_LEGACY_ACCESS.clear();
}

// Console API for debugging
if (typeof window !== 'undefined') {
  window.__ATOMA_SEMANTIC_METRIC_ADAPTER = {
    getNodeCanonicalMetrics,
    getLinkCanonicalMetrics,
    getLinkSynergy,
    getLinkCorruption,
    aggregateNetworkCanonicalMetrics,
    withGlobalMetricAliases,
    projectHudMetrics,
    updateHudMetrics,
    clearLegacyWarningCache
  };
}
