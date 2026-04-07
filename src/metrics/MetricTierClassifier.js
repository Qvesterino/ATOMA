const DEFAULT_METRIC_THRESHOLDS = Object.freeze({
  synergy: Object.freeze({ low: 0.25, high: 0.75, lowExit: 0.32, highExit: 0.68 }),
  harmony: Object.freeze({ low: 0.25, high: 0.75, lowExit: 0.32, highExit: 0.68 }),
  stability: Object.freeze({ low: 0.25, high: 0.75, lowExit: 0.32, highExit: 0.68 }),
  corruption: Object.freeze({ low: 0.25, high: 0.75, lowExit: 0.32, highExit: 0.68 }),
  loadPressure: Object.freeze({ low: 0.25, high: 0.75, lowExit: 0.32, highExit: 0.68 })
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
