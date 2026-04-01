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
  loadPressure: 0,
  load: 0,
  loadRatio: 0
};


const LEGACY_KEYS = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure', 'load', 'loadRatio'];
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
];

const FIXED_TICK_BASE = 0.1;

const RELAXATION = {
  harmony: 0.05,
  stability: 0.04,
  corruption: 0.03,
  loadPressure: 0.07
};

const INTERACTION = {
  harmonyCoherenceGain: 0.025,
  harmonyCorruptionLoss: 0.06,
  corruptionVulnerabilityGain: 0.035,
  corruptionHarmonySuppression: 0.045,
  corruptionLoadGain: 0.02,
  stabilityHarmonyGain: 0.015,
  stabilityCorruptionLoss: 0.04,
  stabilityLoadLoss: 0.02
};

const LINK_EQUALIZE = {
  harmony: 0.02,
  stability: 0.015
};

const SYNERGY_RESONANCE = {
  threshold: 0.75,
  harmonyGain: 0.002,
  stabilityGain: 0.001,
  maxHarmonyPerTick: 0.01,
  maxStabilityPerTick: 0.005
};

const SYNERGY_BURST = {
  threshold: 0.85,
  cooldownTicks: 120,
  selfHarmonyBoost: 0.02,
  selfStabilityBoost: 0.01,
  neighborHarmonyBoost: 0.01
};

const UNLINKED_WRITE_POLICY = {
  OFF: 'off',
  STRICT: 'strict',
  ALLOWLIST: 'allowlist'
};

const DEFAULT_UNLINKED_ALLOWLIST = new Set([
  'phase5-corruption-bridge',
  'phase5-network-synchronization',
  'harmony-stabilization'
]);
const UNLINKED_DAMPING_FACTOR = 0.1;

const SYNERGY_DERIVATION = {
  smoothing: 0.25,
  corruptionDamping: 0.85,
  loadDamping: 0.65,
  resonanceHarmonyThreshold: 0.75,
  resonanceStabilityThreshold: 0.65,
  resonanceScale: 0.35
};

const DYNAMICS_INERTIA = 0.85;
const NODE_SEMANTIC_EVENT_THRESHOLDS = {
  synergyBurst: 0.85,
  corruptionSpike: 0.65
};
const NODE_SEMANTIC_COOLDOWN_MS = 2000;

// Semantic emission thresholds (delta since last emission)
const SEMANTIC_THRESHOLDS = {
  synergy: 0.05,
  harmony: 0.05,
  stability: 0.05,
  corruption: 0.05,
  loadPressure: 0.05,
};
const NODE_METRIC_UPDATED_EVENT_INTERVAL_MS = 100; // 10Hz max per node
const METRIC_PHASE_THRESHOLDS = {
  low: 0.25,
  high: 0.75,
  lowExit: 0.32,
  highExit: 0.68
};

// Track last emitted values to avoid per-frame spam
const lastEmittedMetricValue = new Map(); // key: `${nodeId}:${metric}` → value
const lastNodeMetricUpdatedEmitAt = new Map(); // key: `${nodeId}` → timestamp(ms)
const unlinkedWriteWarned = new Set();
let nodeMetricsTick = 0;

function getSemanticBus() {
  // semanticBus is attached to window/global in main.js
  return (typeof globalThis !== 'undefined' && globalThis.semanticBus) || null;
}

function shouldEmit(metric, after, nodeId) {
  const threshold = SEMANTIC_THRESHOLDS[metric] ?? 0.05;
  const key = `${nodeId}:${metric}`;
  const last = lastEmittedMetricValue.get(key);
  if (last === undefined) {
    return true; // allow first meaningful change to emit
  }
  const diff = Math.abs(after - last);
  return diff >= threshold;
}

function recordEmit(metric, value, nodeId) {
  lastEmittedMetricValue.set(`${nodeId}:${metric}`, value);
}

function classifyMetricPhase(value, previousPhase = null) {
  const normalized = clamp01(value);

  if (previousPhase === 'high') {
    if (normalized >= METRIC_PHASE_THRESHOLDS.highExit) return 'high';
    if (normalized <= METRIC_PHASE_THRESHOLDS.low) return 'low';
    return 'normal';
  }

  if (previousPhase === 'low') {
    if (normalized <= METRIC_PHASE_THRESHOLDS.lowExit) return 'low';
    if (normalized >= METRIC_PHASE_THRESHOLDS.high) return 'high';
    return 'normal';
  }

  if (normalized >= METRIC_PHASE_THRESHOLDS.high) return 'high';
  if (normalized <= METRIC_PHASE_THRESHOLDS.low) return 'low';
  return 'normal';
}

function emitSemanticMetricEvent(metric, before, after, nodeId) {
  const bus = getSemanticBus();
  if (!bus?.emit) return;

  const delta = after - before;
  const threshold = SEMANTIC_THRESHOLDS[metric] ?? 0.05;
  const rising = delta > 0;
  const falling = delta < 0;

  let eventName = null;
  switch (metric) {
    case 'synergy':
      if (rising && Math.abs(delta) >= threshold) eventName = 'metric:synergySpike';
      break;
    case 'harmony':
      if (before < 0.85 && after >= 0.85) eventName = 'metric:harmonyPeak';
      break;
    case 'stability':
      if (falling && Math.abs(delta) >= threshold) eventName = 'metric:stabilityDrop';
      break;
    case 'corruption':
      if (rising && Math.abs(delta) >= threshold) eventName = 'metric:corruptionRise';
      break;
    case 'loadPressure':
      if (before < 0.75 && after >= 0.75) eventName = 'metric:loadPressureHigh';
      break;
    default:
      break;
  }

  if (eventName) {
    if (!shouldEmit(metric, after, nodeId)) return;
    bus.emit(eventName, {
      nodeId,
      value: after,
      delta,
      metric
    }, { priority: bus.priority?.NORMAL });
    recordEmit(metric, after, nodeId);
  }
}

function emitMetricPhaseChanged(node, metric, before, after, targetId) {
  const bus = getSemanticBus();
  if (!bus?.emit || !node?.userData) return;

  if (!node.userData.__metricEventState) {
    node.userData.__metricEventState = {
      synergyBurstActive: false,
      corruptionSpikeActive: false,
      metricPhases: {}
    };
  }

  const state = node.userData.__metricEventState;
  if (!state.metricPhases) {
    state.metricPhases = {};
  }

  const previousPhase = state.metricPhases[metric] ?? null;
  const nextPhase = classifyMetricPhase(after, previousPhase);
  state.metricPhases[metric] = nextPhase;

  if (previousPhase === null || previousPhase === nextPhase) {
    return;
  }

  bus.emit('metric.phase.changed', {
    nodeId: targetId,
    metric,
    phase: nextPhase,
    previousPhase,
    value: after
  }, { priority: bus.priority?.NORMAL });
}

function emitNodeMetricUpdated(metric, value, nodeId) {
  const bus = getSemanticBus();
  if (!bus?.emit) return;
  const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const key = `${nodeId}`;
  const last = Number(lastNodeMetricUpdatedEmitAt.get(key) ?? -Infinity);
  if (nowMs - last < NODE_METRIC_UPDATED_EVENT_INTERVAL_MS) return;
  lastNodeMetricUpdatedEmitAt.set(key, nowMs);
  bus.emit('metric.node.updated', {
    nodeId,
    metric,
    value
  }, { priority: bus.priority?.NORMAL });
}

function shouldEmitNodeSemanticEvent(node, key, nowMs) {
  if (!node?.userData) return false;
  if (!node.userData.__metricEventCooldowns) {
    node.userData.__metricEventCooldowns = {};
  }
  const last = Number(node.userData.__metricEventCooldowns[key] ?? 0);
  if (nowMs - last < NODE_SEMANTIC_COOLDOWN_MS) return false;
  node.userData.__metricEventCooldowns[key] = nowMs;
  return true;
}

function emitNodeThresholdEvents(node) {
  const bus = getSemanticBus();
  if (!bus?.emit) return;
  const metrics = ensureMetrics(node);
  if (!metrics) return;

  if (!node?.userData) return;
  const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (!node.userData.__metricEventState) {
    node.userData.__metricEventState = {
      synergyBurstActive: false,
      corruptionSpikeActive: false,
      metricPhases: {}
    };
  }
  const state = node.userData.__metricEventState;
  const nodeId = node?.id ?? getNodeId(node);

  const synergy = clamp01(metrics.synergy ?? 0);
  const synergyActive = synergy > NODE_SEMANTIC_EVENT_THRESHOLDS.synergyBurst;
  if (synergyActive && !state.synergyBurstActive && shouldEmitNodeSemanticEvent(node, 'synergyBurst', nowMs)) {
    bus.emit('metric.synergy.burst', {
      nodeId,
      synergy
    }, { priority: bus.priority?.NORMAL });
  }
  state.synergyBurstActive = synergyActive;

  const corruption = clamp01(metrics.corruption ?? 0);
  const corruptionActive = corruption > NODE_SEMANTIC_EVENT_THRESHOLDS.corruptionSpike;
  if (corruptionActive && !state.corruptionSpikeActive && shouldEmitNodeSemanticEvent(node, 'corruptionSpike', nowMs)) {
    bus.emit('metric.corruption.spike', {
      nodeId,
      corruption
    }, { priority: bus.priority?.NORMAL });
  }
  state.corruptionSpikeActive = corruptionActive;
}

function writeMetric(metrics, key, nextValue, targetId = 'unknown-node', node = null) {
  const before = metrics[key];
  const after = clamp01(nextValue);
  if (before === after) return;
  metrics[key] = after;
  if (key === 'loadPressure') {
    metrics.load = after;
    metrics.loadRatio = after;
  }
  traceMetricMutation('NodeMetricEngine', `node.${key}`, before, after, targetId);
  emitNodeMetricUpdated(key, after, targetId);
  emitMetricPhaseChanged(node, key, before, after, targetId);
  emitSemanticMetricEvent(key, before, after, targetId);
}

function syncLoadAliases(node) {
  if (!node?.userData?.metrics) return;
  const metrics = node.userData.metrics;
  const loadPressure = clamp01(metrics.loadPressure ?? 0);
  metrics.loadPressure = loadPressure;
  metrics.load = loadPressure;
  metrics.loadRatio = loadPressure;
  node.userData.load = loadPressure;
  node.userData.loadRatio = loadPressure;
}

function getNodeId(node) {
  return node?.userData?.nodeId || node?.uuid || node?.id || 'unknown-node';
}

function getUnlinkedWritePolicy() {
  const policyRaw = (typeof window !== 'undefined' && window?.ATOMA_METRIC_UNLINKED_WRITE_POLICY) || UNLINKED_WRITE_POLICY.OFF;
  const policy = String(policyRaw).toLowerCase();
  if (policy === UNLINKED_WRITE_POLICY.STRICT) return UNLINKED_WRITE_POLICY.STRICT;
  if (policy === UNLINKED_WRITE_POLICY.ALLOWLIST) return UNLINKED_WRITE_POLICY.ALLOWLIST;
  return UNLINKED_WRITE_POLICY.OFF;
}

function getUnlinkedAllowlist() {
  if (typeof window !== 'undefined' && Array.isArray(window?.ATOMA_METRIC_UNLINKED_ALLOWLIST)) {
    return new Set(window.ATOMA_METRIC_UNLINKED_ALLOWLIST.map((v) => String(v).toLowerCase()));
  }
  return DEFAULT_UNLINKED_ALLOWLIST;
}

function isNodeMetricActiveLinked(node) {
  return node?.userData?._metricActiveLink === true;
}

function shouldBlockUnlinkedWrite(node, source = 'unknown') {
  const policy = getUnlinkedWritePolicy();
  if (policy === UNLINKED_WRITE_POLICY.OFF) return false;
  if (isNodeMetricActiveLinked(node)) return false;

  if (policy === UNLINKED_WRITE_POLICY.STRICT) return true;
  if (policy === UNLINKED_WRITE_POLICY.ALLOWLIST) {
    const allow = getUnlinkedAllowlist();
    return !allow.has(String(source).toLowerCase());
  }
  return false;
}

function warnUnlinkedWriteBlocked(node, metric, source, op) {
  const nodeId = getNodeId(node);
  const key = `${op}:${nodeId}:${metric}:${String(source).toLowerCase()}`;
  if (unlinkedWriteWarned.has(key)) return;
  unlinkedWriteWarned.add(key);
  console.warn('UNLINKED_METRIC_WRITE_BLOCKED', { nodeId, metric, source, policy: getUnlinkedWritePolicy(), op });
}

function resolveNodeList(nodesInput) {
  if (Array.isArray(nodesInput?.nodes)) return nodesInput.nodes;
  if (Array.isArray(nodesInput)) return nodesInput;
  return [];
}

function resolveLinkList(linkSystem) {
  if (Array.isArray(linkSystem?.links)) return linkSystem.links;
  if (Array.isArray(linkSystem)) return linkSystem;
  return [];
}

function deriveSynergyTarget(metrics) {
  const harmony = clamp01(metrics.harmony ?? 0);
  const stability = clamp01(metrics.stability ?? 0);
  const corruption = clamp01(metrics.corruption ?? 0);
  const loadPressure = clamp01(metrics.loadPressure ?? 0);

  const harmonyField = harmony * harmony;
  const stabilityField = stability;
  const corruptionField = 1 - corruption * SYNERGY_DERIVATION.corruptionDamping;
  const loadField = 1 - loadPressure * SYNERGY_DERIVATION.loadDamping;

  const base = harmonyField * stabilityField * corruptionField * loadField;
  const resonance =
    Math.max(0, harmony - SYNERGY_DERIVATION.resonanceHarmonyThreshold) *
    Math.max(0, stability - SYNERGY_DERIVATION.resonanceStabilityThreshold) *
    SYNERGY_DERIVATION.resonanceScale;

  return clamp01(base + resonance);
}

function applyCrossMetricInteractions(metrics, base, dtScale) {
  let harmony = clamp01(metrics.harmony);
  let stability = clamp01(metrics.stability);
  let corruption = clamp01(metrics.corruption);
  let loadPressure = clamp01(metrics.loadPressure);

  harmony += (clamp01(base.harmony ?? harmony) - harmony) * RELAXATION.harmony * dtScale;
  stability += (clamp01(base.stability ?? stability) - stability) * RELAXATION.stability * dtScale;
  loadPressure += (clamp01(base.loadPressure ?? loadPressure) - loadPressure) * RELAXATION.loadPressure * dtScale;

  corruption -= corruption * 0.04 * dtScale;
  if ((base.corruption ?? 0) > 0) {
    corruption += (clamp01(base.corruption) - corruption) * RELAXATION.corruption * dtScale;
  }

  const vulnerability = (1 - stability) * (0.5 + loadPressure * 0.7);
  const coherence = stability * (1 - loadPressure * 0.6);

  const nextHarmony = harmony + (
    INTERACTION.harmonyCoherenceGain * coherence -
    INTERACTION.harmonyCorruptionLoss * corruption * vulnerability
  ) * dtScale;

  const nextCorruption = corruption + (
    INTERACTION.corruptionVulnerabilityGain * vulnerability -
    INTERACTION.corruptionHarmonySuppression * harmony * coherence +
    INTERACTION.corruptionLoadGain * loadPressure
  ) * dtScale;

  const nextStability = stability + (
    INTERACTION.stabilityHarmonyGain * harmony -
    INTERACTION.stabilityCorruptionLoss * corruption -
    INTERACTION.stabilityLoadLoss * loadPressure
  ) * dtScale;

  // Cheap inertia damping prevents oscillation in tightly coupled clusters.
  harmony = harmony * DYNAMICS_INERTIA + nextHarmony * (1 - DYNAMICS_INERTIA);
  corruption = corruption * DYNAMICS_INERTIA + nextCorruption * (1 - DYNAMICS_INERTIA);
  stability = stability * DYNAMICS_INERTIA + nextStability * (1 - DYNAMICS_INERTIA);

  return {
    harmony: clamp01(harmony),
    stability: clamp01(stability),
    corruption: clamp01(corruption),
    loadPressure: clamp01(loadPressure)
  };
}

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
  m.load = m.loadPressure;
  m.loadRatio = m.loadPressure;
  node.userData.load = m.loadPressure;
  node.userData.loadRatio = m.loadPressure;

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
            const next = clamp01(typeof v === 'number' ? v : DEFAULT_METRICS[key]);
            if (key === 'load' || key === 'loadRatio') {
              metrics.loadPressure = next;
              metrics.load = next;
              metrics.loadRatio = next;
            } else {
              metrics[key] = next;
            }
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
    const seededLoadPressure = Number.isFinite(node.userData.metrics.loadPressure)
      ? node.userData.metrics.loadPressure
      : (Number.isFinite(node.userData.metrics.load)
          ? node.userData.metrics.load
          : (Number.isFinite(node.userData.metrics.loadRatio)
              ? node.userData.metrics.loadRatio
              : 0));
    node.userData.metrics.loadPressure = clamp01(seededLoadPressure);
    node.userData.metrics.load = node.userData.metrics.loadPressure;
    node.userData.metrics.loadRatio = node.userData.metrics.loadPressure;
    syncLoadAliases(node);
    return node.userData.metrics;
  }
  const metrics = (node.userData.metrics = {});
  for (const key of Object.keys(DEFAULT_METRICS)) {
    metrics[key] = DEFAULT_METRICS[key];
  }
  node.userData.metrics = wrapMetricsWithGuard(metrics);
  installLegacyFieldGuards(node);
  syncLoadAliases(node);
  return node.userData.metrics;
}

function adjust(metrics, key, delta, targetId = 'unknown-node', node = null) {
  assertMetricAuthority('NodeMetricEngine', key);
  const clampedDelta = Math.max(-MAX_IMPULSE, Math.min(MAX_IMPULSE, delta));
  writeMetric(metrics, key, (metrics[key] ?? 0) + clampedDelta, targetId, node);
}

function deriveSynergy(node, dtScale = 1) {
  const m = ensureMetrics(node);
  if (!m) return;
  const id = getNodeId(node);
  const target = deriveSynergyTarget(m);
  const smoothing = Math.min(1, SYNERGY_DERIVATION.smoothing * dtScale);
  const next = (m.synergy ?? 0) + (target - (m.synergy ?? 0)) * smoothing;
  writeMetric(m, 'synergy', next, id, node);
}

function applyCappedPositiveGain(metrics, key, baseGain, capByNode, capPerTick, targetId, node = null) {
  if (!metrics || !targetId || baseGain <= 0) return;
  const consumed = capByNode.get(targetId) ?? 0;
  if (consumed >= capPerTick) return;
  const allowed = Math.min(baseGain, capPerTick - consumed);
  if (allowed <= 0) return;
  writeMetric(metrics, key, (metrics[key] ?? 0) + allowed, targetId, node);
  capByNode.set(targetId, consumed + allowed);
}

export function updateNodeMetrics(nodesInput, linkSystem, dt = FIXED_TICK_BASE) {
  const nodes = resolveNodeList(nodesInput);
  if (!nodes.length) return;

  const currentTick = ++nodeMetricsTick;
  const dtClamped = Number.isFinite(dt) ? Math.max(0.001, Math.min(0.25, dt)) : FIXED_TICK_BASE;
  const dtScale = dtClamped / FIXED_TICK_BASE;
  const linkedNeighbors = new Map();
  const links = resolveLinkList(linkSystem);
  const activeLinks = [];
  const activeNodes = new Set();

  for (const link of links) {
    if (link?.active === false) continue;
    const nodeA = link?.source || link?.nodeA;
    const nodeB = link?.target || link?.nodeB;
    if (!nodeA || !nodeB) continue;
    activeLinks.push(link);
    activeNodes.add(nodeA);
    activeNodes.add(nodeB);
  }

  for (const node of nodes) {
    if (node?.userData) {
      node.userData._metricActiveLink = activeNodes.has(node);
    }
    if (!activeNodes.has(node)) continue;
    const m = ensureMetrics(node);
    const base = node?.userData?.archetypeMetrics;
    if (!m || !base) continue;
    const id = getNodeId(node);

    if (node?.userData) {
      const cd = Number(node.userData.metricsCooldown ?? 0);
      if (cd > 0) {
        node.userData.metricsCooldown = cd - 1;
        continue;
      }
    }

    const next = applyCrossMetricInteractions(m, base, dtScale);
    writeMetric(m, 'harmony', next.harmony, id, node);
    writeMetric(m, 'stability', next.stability, id, node);
    writeMetric(m, 'corruption', next.corruption, id, node);
    writeMetric(m, 'loadPressure', next.loadPressure, id, node);
    applyArchetypeClamp(node);
    syncLoadAliases(node);
  }

  if (activeLinks.length) {
    const resonanceHarmonyApplied = new Map();
    const resonanceStabilityApplied = new Map();
    for (const link of activeLinks) {
      const nodeA = link?.source || link?.nodeA;
      const nodeB = link?.target || link?.nodeB;
      if (!nodeA || !nodeB) continue;

      const ma = ensureMetrics(nodeA);
      const mb = ensureMetrics(nodeB);
      if (!ma || !mb) continue;

      if (!linkedNeighbors.has(nodeA)) linkedNeighbors.set(nodeA, new Set());
      if (!linkedNeighbors.has(nodeB)) linkedNeighbors.set(nodeB, new Set());
      linkedNeighbors.get(nodeA).add(nodeB);
      linkedNeighbors.get(nodeB).add(nodeA);

      const idA = getNodeId(nodeA);
      const idB = getNodeId(nodeB);

      const strengthRaw = link?.userData?.synergy?.score;
      const strength = clamp01(Number.isFinite(strengthRaw) ? strengthRaw : 0.5);
      const equalizeHarmony = LINK_EQUALIZE.harmony * strength * dtScale;
      const equalizeStability = LINK_EQUALIZE.stability * strength * dtScale;

      const dH = ((mb.harmony ?? 0) - (ma.harmony ?? 0)) * equalizeHarmony;
      writeMetric(ma, 'harmony', (ma.harmony ?? 0) + dH, idA, nodeA);
      writeMetric(mb, 'harmony', (mb.harmony ?? 0) - dH, idB, nodeB);

      const dSt = ((mb.stability ?? 0) - (ma.stability ?? 0)) * equalizeStability;
      writeMetric(ma, 'stability', (ma.stability ?? 0) + dSt, idA, nodeA);
      writeMetric(mb, 'stability', (mb.stability ?? 0) - dSt, idB, nodeB);

      const synergyA = clamp01(ma.synergy ?? 0);
      const synergyB = clamp01(mb.synergy ?? 0);
      if (synergyA <= SYNERGY_RESONANCE.threshold || synergyB <= SYNERGY_RESONANCE.threshold) {
        continue;
      }

      const harmonyGain = SYNERGY_RESONANCE.harmonyGain * strength;
      const stabilityGain = SYNERGY_RESONANCE.stabilityGain * strength;

      applyCappedPositiveGain(
        ma,
        'harmony',
        harmonyGain,
        resonanceHarmonyApplied,
        SYNERGY_RESONANCE.maxHarmonyPerTick,
        idA,
        nodeA
      );
      applyCappedPositiveGain(
        mb,
        'harmony',
        harmonyGain,
        resonanceHarmonyApplied,
        SYNERGY_RESONANCE.maxHarmonyPerTick,
        idB,
        nodeB
      );
      applyCappedPositiveGain(
        ma,
        'stability',
        stabilityGain,
        resonanceStabilityApplied,
        SYNERGY_RESONANCE.maxStabilityPerTick,
        idA,
        nodeA
      );
      applyCappedPositiveGain(
        mb,
        'stability',
        stabilityGain,
        resonanceStabilityApplied,
        SYNERGY_RESONANCE.maxStabilityPerTick,
        idB,
        nodeB
      );
      syncLoadAliases(nodeA);
      syncLoadAliases(nodeB);
    }
  }

  for (const node of nodes) {
    if (!activeNodes.has(node)) continue;
    deriveSynergy(node, dtScale);
    applyArchetypeClamp(node);
    syncLoadAliases(node);
  }

  for (const node of nodes) {
    const neighbors = linkedNeighbors.get(node);
    if (!neighbors || neighbors.size === 0) continue;

    const metrics = ensureMetrics(node);
    if (!metrics) continue;
    if ((metrics.synergy ?? 0) <= SYNERGY_BURST.threshold) continue;

    const lastBurstTick = Number.isFinite(node?.lastSynergyBurstTick)
      ? node.lastSynergyBurstTick
      : -Infinity;
    if (lastBurstTick + SYNERGY_BURST.cooldownTicks >= currentTick) continue;

    applyMetricImpulse(node, {
      harmony: SYNERGY_BURST.selfHarmonyBoost,
      stability: SYNERGY_BURST.selfStabilityBoost
    });

    for (const neighbor of neighbors) {
      applyMetricImpulse(neighbor, {
        harmony: SYNERGY_BURST.neighborHarmonyBoost
      });
    }

    node.lastSynergyBurstTick = currentTick;
  }

  // Emit threshold-based semantic events once per node at the end of the tick.
  for (const node of nodes) {
    if (!activeNodes.has(node)) continue;
    emitNodeThresholdEvents(node);
  }
}

/**
 * Apply a set of metric deltas to a node (authoritative impulse).
 * @param {Object} node - target node
 * @param {Object} deltas - { synergy?, harmony?, stability?, corruption?, loadPressure? }
 */
export function applyMetricImpulse(node, deltas = {}, options = {}) {
  if (!node) return;
  const source = options?.source || 'unknown';
  if (shouldBlockUnlinkedWrite(node, source)) {
    warnUnlinkedWriteBlocked(node, 'impulse', source, 'applyMetricImpulse');
    return;
  }
  const m = ensureMetrics(node);
  if (!m) return;
  if (node.userData) {
    node.userData.metricsCooldown = 3;
  }
  const id = node?.userData?.nodeId || node?.uuid || node?.id || 'unknown-node';
  const impulseScale = isNodeMetricActiveLinked(node) ? 1 : UNLINKED_DAMPING_FACTOR;
  const keys = ['harmony', 'stability', 'corruption', 'loadPressure'];
  for (const key of keys) {
    if (typeof deltas[key] === 'number' && Number.isFinite(deltas[key])) {
      adjust(m, key, deltas[key] * impulseScale, id, node);
    }
  }
  if (typeof deltas.synergy === 'number' && Number.isFinite(deltas.synergy)) {
    console.warn('DERIVED_METRIC_WRITE_BLOCKED', { key: 'synergy', nodeId: id });
  }
  deriveSynergy(node);
  applyArchetypeClamp(node);
  syncLoadAliases(node);
}

/**
 * Set a single metric value (absolute) on the canonical container.
 * Blocks legacy field writes by warning when direct fields are present.
 */
export function setMetric(node, metric, value, options = {}) {
  if (!node || !metric) return;
  if (!LEGACY_KEYS.includes(metric)) return;
  const canonicalMetric = (metric === 'load' || metric === 'loadRatio') ? 'loadPressure' : metric;
  const source = options?.source || 'unknown';
  if (shouldBlockUnlinkedWrite(node, source)) {
    warnUnlinkedWriteBlocked(node, canonicalMetric, source, 'setMetric');
    return;
  }
  if (canonicalMetric === 'synergy') {
    console.warn('DERIVED_METRIC_WRITE_BLOCKED', { key: canonicalMetric, nodeId: getNodeId(node) });
    return;
  }
  const m = ensureMetrics(node);
  if (!m) return;
  const id = getNodeId(node);
  if (Object.prototype.hasOwnProperty.call(node.userData, canonicalMetric) && node.userData[canonicalMetric] !== undefined) {
    console.warn('LEGACY METRIC WRITE BLOCKED', { key: canonicalMetric, nodeId: id });
  }
  const rawValue = typeof value === 'number' && Number.isFinite(value) ? value : DEFAULT_METRICS[canonicalMetric];
  const currentValue = Number.isFinite(m[canonicalMetric]) ? m[canonicalMetric] : DEFAULT_METRICS[canonicalMetric];
  const isUnlinked = !isNodeMetricActiveLinked(node);
  const sourceKey = String(source).toLowerCase();
  let unlinkedFactor = UNLINKED_DAMPING_FACTOR;
  if (sourceKey === 'harmony-stabilization') unlinkedFactor = 0.25;
  if (sourceKey === 'phase5-network-synchronization') unlinkedFactor = 0.15;
  if (sourceKey === 'phase5-corruption-bridge') unlinkedFactor = 0.05;

  let nextValue = isUnlinked
    ? currentValue + (rawValue - currentValue) * unlinkedFactor
    : rawValue;

  if (Math.abs(nextValue - currentValue) < 0.01) {
    return currentValue;
  }

  const after = clamp01(nextValue);
  writeMetric(m, canonicalMetric, after, id, node);
  deriveSynergy(node);
  applyArchetypeClamp(node);
  syncLoadAliases(node);
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
  // Preserve spawn snapshot; only enforce canonical derived metric.
  deriveSynergy(node);
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
    const id = getNodeId(node);
    adjust(m, 'harmony', STEP.linkBoost, id);
    adjust(m, 'loadPressure', STEP.linkStress, id);
    adjust(m, 'corruption', -STEP.linkBoost * 0.5, id);
    deriveSynergy(node);
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
  syncLoadAliases(nodeA);
  syncLoadAliases(nodeB);
}




/**
 * Link removal slightly relaxes load and reduces synergy/harmony.
 */
export function onLinkRemoved(nodeA, nodeB) {
  const nodes = [nodeA, nodeB];
  for (const node of nodes) {
    const m = ensureMetrics(node);
    if (!m) continue;
    const id = getNodeId(node);
    adjust(m, 'harmony', -STEP.linkBoost * 0.5, id);
    adjust(m, 'loadPressure', -STEP.linkStress * 1.5, id);
    deriveSynergy(node);
  }
  applyArchetypeClamp(nodeA);
  applyArchetypeClamp(nodeB);
  syncLoadAliases(nodeA);
  syncLoadAliases(nodeB);
}

/**
 * Overload raises load pressure and corruption, reduces stability.
 * overloadAmount is expected in [0,1]; larger values are clamped.
 */
export function onOverload(node, overloadAmount = 0) {
  const m = ensureMetrics(node);
  if (!m) return;
  const amt = clamp01(overloadAmount);
  const id = getNodeId(node);
  adjust(m, 'loadPressure', amt * STEP.overloadLoadScale, id);
  adjust(m, 'corruption', amt * STEP.overloadCorruptionScale, id);
  adjust(m, 'stability', -amt * STEP.overloadStabilityLoss, id);
  deriveSynergy(node);
  applyArchetypeClamp(node);
  syncLoadAliases(node);
}
