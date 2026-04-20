// Rebalanced per METRICS_REBALANCE_V2_FINAL.md R1
// Thresholds differentiated per metric to match actual steady-state distributions
// synergy:      steady-state 0.04-0.51, "high" catches Integration/Process top
// harmony:      steady-state 0.05-0.74, "high" catches Control/Prime/Mythic
// stability:    steady-state 0.14-0.82, naturally wide — slightly lower high
// corruption:   steady-state 0.01-0.81, "low" at 0.08 = first sign, "high" at 0.35 = serious
// loadPressure: steady-state 0.22-0.66, "high" at 0.55 catches heavy-load archetypes
const DEFAULT_METRIC_THRESHOLDS = Object.freeze({
  synergy:      Object.freeze({ low: 0.15, high: 0.45, lowExit: 0.22, highExit: 0.38 }),
  harmony:      Object.freeze({ low: 0.20, high: 0.60, lowExit: 0.27, highExit: 0.53 }),
  stability:    Object.freeze({ low: 0.25, high: 0.70, lowExit: 0.32, highExit: 0.63 }),
  corruption:   Object.freeze({ low: 0.08, high: 0.35, lowExit: 0.15, highExit: 0.28 }),
  loadPressure: Object.freeze({ low: 0.25, high: 0.55, lowExit: 0.32, highExit: 0.48 })
});

function clamp01(value) {
  const numeric = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(1, numeric));
}

export function normalizeMetricTier(tier) {
  if (tier === 'normal') return 'mid';
  if (tier === 'high' || tier === 'low' || tier === 'mid') return tier;
  return null;
}

export function toLegacyMetricPhase(tier) {
  const normalizedTier = normalizeMetricTier(tier);
  return normalizedTier === null ? null : normalizedTier;
}

export function buildMetricTierEventName(scope, metric, tier) {
  const scopeName = String(scope || '').trim().toLowerCase();
  return `${scopeName}.${metric}.${tier}`;
}

export const buildScopedMetricEventName = buildMetricTierEventName;

export function getDefaultMetricThresholds(metric) {
  return DEFAULT_METRIC_THRESHOLDS[metric] || DEFAULT_METRIC_THRESHOLDS.synergy;
}

export function classifyMetricTier(value, previousTier = null, thresholds = null) {
  const normalized = clamp01(value);
  const resolvedThresholds = thresholds || getDefaultMetricThresholds('synergy');
  const lastTier = normalizeMetricTier(previousTier);

  if (lastTier === 'high') {
    if (normalized >= resolvedThresholds.highExit) return 'high';
    if (normalized <= resolvedThresholds.low) return 'low';
    return 'mid';
  }

  if (lastTier === 'low') {
    if (normalized <= resolvedThresholds.lowExit) return 'low';
    if (normalized >= resolvedThresholds.high) return 'high';
    return 'mid';
  }

  if (normalized >= resolvedThresholds.high) return 'high';
  if (normalized <= resolvedThresholds.low) return 'low';
  return 'mid';
}
