/**
 * Node Metric Engine (canonical gameplay metrics)
 * Read/write only node.userData.metrics (synergy, harmony, stability, corruption, loadPressure).
 * Does not touch visuals or HUDs; intended as a lightweight, event-driven updater.
 */

const DEFAULT_METRICS = {
  synergy: 0.5,
  harmony: 0.5,
  stability: 0.5,
  corruption: 0.0,
  loadPressure: 0.2
};

// TODO: Replace placeholder step sizes with design-approved values.
const STEP = {
  linkBoost: 0.02,
  linkStress: 0.01,
  overloadLoadScale: 0.1,
  overloadCorruptionScale: 0.05,
  overloadStabilityLoss: 0.02,
  relaxRate: 0.1 // per second toward defaults
};

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

function ensureMetrics(node) {
  if (!node || !node.userData) return null;
  const metrics = node.userData.metrics || (node.userData.metrics = {});
  for (const key of Object.keys(DEFAULT_METRICS)) {
    if (metrics[key] === undefined) {
      metrics[key] = DEFAULT_METRICS[key];
    }
  }
  return metrics;
}

function adjust(metrics, key, delta) {
  metrics[key] = clamp01(metrics[key] + delta);
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
  const m = ensureMetrics(node);
  if (!m) return;
  // Nudge toward defaults gently.
  for (const key of Object.keys(DEFAULT_METRICS)) {
    m[key] = clamp01(m[key] * 0.9 + DEFAULT_METRICS[key] * 0.1);
  }
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
    adjust(m, 'synergy', STEP.linkBoost);
    adjust(m, 'harmony', STEP.linkBoost);
    adjust(m, 'loadPressure', STEP.linkStress);
    adjust(m, 'corruption', -STEP.linkBoost * 0.5);
  }

  if (nodeA?.userData?.category && nodeB?.userData?.category && nodeA.userData.category !== nodeB.userData.category) {
    const mA = ensureMetrics(nodeA);
    const mB = ensureMetrics(nodeB);
    if (mA) adjust(mA, 'corruption', 0.02);
    if (mB) adjust(mB, 'corruption', 0.02);
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
    adjust(m, 'synergy', -STEP.linkBoost * 0.5);
    adjust(m, 'harmony', -STEP.linkBoost * 0.5);
    adjust(m, 'loadPressure', -STEP.linkStress * 1.5);
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
  adjust(m, 'loadPressure', amt * STEP.overloadLoadScale);
  adjust(m, 'corruption', amt * STEP.overloadCorruptionScale);
  adjust(m, 'stability', -amt * STEP.overloadStabilityLoss);
  applyArchetypeClamp(node);
}
