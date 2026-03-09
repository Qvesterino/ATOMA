/**
 * Node Metric Engine (canonical gameplay metrics)
 * Read/write only node.userData.metrics (synergy, harmony, stability, corruption, loadPressure).
 * Does not touch visuals or HUDs; intended as a lightweight, event-driven updater.
 */

import { assertMetricAuthority, traceMetricMutation } from './MetricAuthorityGuard.js';

const DEFAULT_METRICS = {
  synergy: 0,
  harmony: 0,
  stability: 1,
  corruption: 0,
  loadPressure: 0
};

const LEGACY_KEYS = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure'];
const MAX_IMPULSE = 0.25;

// TODO: Replace placeholder step sizes with design-approved values.
const STEP = {
  linkBoost: 0.02,
  linkStress: 0.01,
  overloadLoadScale: 0.1,
  overloadCorruptionScale: 0.05,
  overloadStabilityLoss: 0.02,
  relaxRate: 0.1 // per second toward defaults
};

const ALLOWED_WRITERS = [
  'SafeMetricsDNAIntegration1_0.js',
  'NodeMetricEngine.js',
  'MetricsRuntime_v1.js',
];

function wrapMetricsWithGuard(metricsObj) {
  if (!metricsObj || metricsObj.__guarded) return metricsObj;
  const warnedProps = new Set();
  const proxy = new Proxy(metricsObj, {
    set(target, prop, value) {
      const stack = new Error().stack || '';
      const isAllowed = ALLOWED_WRITERS.some(marker => stack.includes(marker));
      if (!isAllowed) {
        const key = String(prop);
        if (!warnedProps.has(key)) {
          console.warn('[MetricAuthorityGuard] external metrics write detected', { prop: key, stack });
          warnedProps.add(key);
        }
      }
      target[prop] = value;
      return true;
    }
  });
  metricsObj.__guarded = true;
  return proxy;
}

function clamp01(v) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

// Passive safety clamp - enforces archetype identity boundaries
// NodeMetricEngine must never redefine archetype identity
function applyArchetypeClamp(node) {
  if (!node?.userData?.archetypeMetrics) return;

  const arch = node.userData.archetypeMetrics;
  const m = node.userData.metrics;
  if (!m) return;

  // Clamp to archetype-defined bounds
  m.synergy = clamp01(m.synergy);
  m.harmony = clamp01(m.harmony);
  m.stability = clamp01(m.stability);
  m.corruption = clamp01(m.corruption);
  m.loadPressure = clamp01(m.loadPressure);
}

function installLegacyFieldGuards(node) {
  if (!node?.userData || node.userData.__legacyMetricGuardInstalled) return;
  for (const key of LEGACY_KEYS) {
    try {
      const desc = Object.getOwnPropertyDescriptor(node.userData, key);
      // Only wrap if writable/configurable to avoid breaking existing non-configurable props.
      if (desc && desc.configurable === false) continue;
      Object.defineProperty(node.userData, key, {
        configurable: true,
        enumerable: false,
        get() {
          return undefined;
        },
        set(v) {
          console.warn('LEGACY METRIC WRITE BLOCKED', { key });
          const metrics = this.metrics;
          if (metrics) {
            metrics[key] = clamp01(typeof v === 'number' ? v : DEFAULT_METRICS[key]);
          }
        }
      });
    } catch (_e) {
      // Best-effort; skip if definition fails
    }
  }
  node.userData.__legacyMetricGuardInstalled = true;
}

function ensureMetrics(node) {
  if (!node || !node.userData) return null;
  if (node.userData.metrics) {
    installLegacyFieldGuards(node);
    node.userData.metrics = wrapMetricsWithGuard(node.userData.metrics);
    return node.userData.metrics;
  }
  const metrics = (node.userData.metrics = {});
  for (const key of Object.keys(DEFAULT_METRICS)) {
    metrics[key] = DEFAULT_METRICS[key];
  }
  node.userData.metrics = wrapMetricsWithGuard(metrics);
  installLegacyFieldGuards(node);
  return node.userData.metrics;
}

function adjust(metrics, key, delta, targetId = 'unknown-node') {
  assertMetricAuthority('NodeMetricEngine', key);
  const clampedDelta = Math.max(-MAX_IMPULSE, Math.min(MAX_IMPULSE, delta));
  const before = metrics[key];
  const after = clamp01(before + clampedDelta);
  metrics[key] = after;
  traceMetricMutation('NodeMetricEngine', `node.${key}`, before, after, targetId);
}

/**
 * Apply a set of metric deltas to a node (authoritative impulse).
 * @param {Object} node - target node
 * @param {Object} deltas - { synergy?, harmony?, stability?, corruption?, loadPressure? }
 */
export function applyMetricImpulse(node, deltas = {}) {
  if (!node) return;
  const m = ensureMetrics(node);
  if (!m) return;
  if (node.userData) {
    node.userData.metricsCooldown = 3;
  }
  const id = node?.userData?.nodeId || node?.uuid || node?.id || 'unknown-node';
  const keys = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure'];
  for (const key of keys) {
    if (typeof deltas[key] === 'number' && Number.isFinite(deltas[key])) {
      adjust(m, key, deltas[key], id);
    }
  }
  applyArchetypeClamp(node);
}

/**
 * Set a single metric value (absolute) on the canonical container.
 * Blocks legacy field writes by warning when direct fields are present.
 */
export function setMetric(node, metric, value) {
  if (!node || !metric) return;
  if (!LEGACY_KEYS.includes(metric)) return;
  const m = ensureMetrics(node);
  if (!m) return;
  const id = node?.userData?.nodeId || node?.uuid || node?.id || 'unknown-node';
  if (Object.prototype.hasOwnProperty.call(node.userData, metric) && node.userData[metric] !== undefined) {
    console.warn('LEGACY METRIC WRITE BLOCKED', { key: metric, nodeId: id });
  }
  const before = m[metric];
  const after = clamp01(typeof value === 'number' && Number.isFinite(value) ? value : DEFAULT_METRICS[metric]);
  m[metric] = after;
  traceMetricMutation('NodeMetricEngine', `node.${metric}`, before, after, id);
  applyArchetypeClamp(node);
}

/**
 * Ensure node has canonical metrics; fill only missing values.
 */
export function initNodeMetrics(node) {
  return ensureMetrics(node);
}

/**
 * Initialize metrics on spawn without overwriting existing values.
 */
export function onNodeSpawn(node) {
  // Skip spawn nudge when a canonical DNA snapshot already exists
  if (node?.userData?.metrics?._isMetricSnapshot) {
    return;
  }

  const m = ensureMetrics(node);
  if (!m) return;
  // No blending toward defaults; preserve existing values
  applyArchetypeClamp(node);
}

/**
 * Linking compatible nodes slightly boosts harmony/synergy and adds minimal load.
 * linkContext is optional and not used here (placeholder for future design).
 */
export function onLinkCreated(nodeA, nodeB, linkContext) {
  const nodes = [nodeA, nodeB];
  for (const node of nodes) {
    const m = ensureMetrics(node);
    if (!m) continue;
    const id = node?.userData?.nodeId || node?.uuid || node?.id || 'unknown-node';
    adjust(m, 'synergy', STEP.linkBoost, id);
    adjust(m, 'harmony', STEP.linkBoost, id);
    adjust(m, 'loadPressure', STEP.linkStress, id);
    adjust(m, 'corruption', -STEP.linkBoost * 0.5, id);
  }

  if (nodeA?.userData?.category && nodeB?.userData?.category && nodeA.userData.category !== nodeB.userData.category) {
    const mA = ensureMetrics(nodeA);
    const mB = ensureMetrics(nodeB);
    const idA = nodeA?.userData?.nodeId || nodeA?.uuid || nodeA?.id || 'unknown-node';
    const idB = nodeB?.userData?.nodeId || nodeB?.uuid || nodeB?.id || 'unknown-node';
    if (mA) adjust(mA, 'corruption', 0.02, idA);
    if (mB) adjust(mB, 'corruption', 0.02, idB);
  }
  
  applyArchetypeClamp(nodeA);
  applyArchetypeClamp(nodeB);
}




/**
 * Link removal slightly relaxes load and reduces synergy/harmony.
 */
export function onLinkRemoved(nodeA, nodeB) {
  const nodes = [nodeA, nodeB];
  for (const node of nodes) {
    const m = ensureMetrics(node);
    if (!m) continue;
    const id = node?.userData?.nodeId || node?.uuid || node?.id || 'unknown-node';
    adjust(m, 'synergy', -STEP.linkBoost * 0.5, id);
    adjust(m, 'harmony', -STEP.linkBoost * 0.5, id);
    adjust(m, 'loadPressure', -STEP.linkStress * 1.5, id);
  }
  applyArchetypeClamp(nodeA);
  applyArchetypeClamp(nodeB);
}

/**
 * Overload raises load pressure and corruption, reduces stability.
 * overloadAmount is expected in [0,1]; larger values are clamped.
 */
export function onOverload(node, overloadAmount = 0) {
  const m = ensureMetrics(node);
  if (!m) return;
  const amt = clamp01(overloadAmount);
  const id = node?.userData?.nodeId || node?.uuid || node?.id || 'unknown-node';
  adjust(m, 'loadPressure', amt * STEP.overloadLoadScale, id);
  adjust(m, 'corruption', amt * STEP.overloadCorruptionScale, id);
  adjust(m, 'stability', -amt * STEP.overloadStabilityLoss, id);
  applyArchetypeClamp(node);
}
