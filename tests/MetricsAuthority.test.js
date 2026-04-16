import assert from 'node:assert/strict';
import { applyMetricImpulse, ensureMetrics, setMetric } from '../src/metrics/NodeMetricEngine.js';
import { MetricsRuntime_v1 } from '../MetricsRuntime_v1.js';
import { LinkQualityCalculator } from '../LinkQualityCalculator.js';
import { HarmonicHubAuraSystem_Session126 } from '../HarmonicHubAuraSystem_Session126.js';
import { buildScopedMetricEventName } from '../src/metrics/MetricTierClassifier.js';
import { aggregateNetworkCanonicalMetrics, projectHudMetrics, withGlobalMetricAliases, updateHudMetrics } from '../SemanticMetricAdapter.js';

function createTestBus() {
  const handlers = new Map();
  return {
    priority: { NORMAL: 2 },
    subscribe(tag, fn) {
      const list = handlers.get(tag) || [];
      list.push(fn);
      handlers.set(tag, list);
      return () => {
        const next = (handlers.get(tag) || []).filter((entry) => entry !== fn);
        if (next.length > 0) handlers.set(tag, next);
        else handlers.delete(tag);
      };
    },
    unsubscribe(tag, fn) {
      const list = handlers.get(tag) || [];
      const next = list.filter((entry) => entry !== fn);
      if (next.length > 0) handlers.set(tag, next);
      else handlers.delete(tag);
    },
    emit(tag, payload, opts) {
      const list = handlers.get(tag) || [];
      for (const fn of list) {
        try {
          fn(payload, opts);
        } catch (error) {
          console.error('Test bus handler error', error);
        }
      }
      return true;
    },
    emitImmediate(tag, payload, opts) {
      return this.emit(tag, payload, opts);
    }
  };
}

function createMockNode(metrics = {}) {
  return {
    userData: {
      metrics: {
        synergy: 0,
        harmony: 0,
        stability: 1,
        corruption: 0,
        loadPressure: 0,
        load: 0,
        loadRatio: 0,
        ...metrics
      }
    }
  };
}

function createMockLink(eventState = {}) {
  return {
    userData: {
      __metricEventState: {
        metricTiers: { ...eventState }
      }
    }
  };
}

function createMockHub(eventState = {}) {
  return {
    hubId: 'hub-1',
    primaryNode: { userData: { nodeId: 'node-1' } },
    userData: {
      __metricEventState: {
        metricTiers: { ...eventState }
      }
    },
    harmony: 0,
    synergy: 0,
    corruption: 0,
    stability: 0
  };
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// NodeMetricEngine canonical metric derivation
test('NodeMetricEngine derives synergy after harmony update', () => {
  const node = createMockNode({ synergy: 0.2, harmony: 0.2, stability: 0.7, corruption: 0.1, loadPressure: 0.1 });
  node.userData._metricActiveLink = true;
  globalThis.semanticBus = createTestBus();
  setMetric(node, 'harmony', 0.8, { source: 'test' });

  assert.strictEqual(node.userData.metrics.harmony, 0.8);
  assert(node.userData.metrics.synergy >= 0 && node.userData.metrics.synergy <= 1, 'synergy should be clamped');
  assert.notStrictEqual(node.userData.metrics.synergy, 0.2, 'synergy should be recalculated');
});

// MetricsRuntime_v1 publish shape and fallback
test('MetricsRuntime_v1 publishes canonical global metric shape', () => {
  globalThis.__ATOMA_LIVE_METRICS__ = undefined;
  globalThis.world = {};
  globalThis.globalMetrics = undefined;

  const nodes = [{ userData: { metrics: { synergy: 0.4, harmony: 0.3, stability: 0.5, corruption: 0.2, loadPressure: 0.1 } } }];
  const runtime = new MetricsRuntime_v1({ nodes, links: [], linkSystem: null, metricsSystems: {} });

  runtime._publishLiveMetrics();

  assert.deepStrictEqual(Object.keys(globalThis.__ATOMA_LIVE_METRICS__).sort(), [
    'corruptionLevel',
    'harmonyFlow',
    'linkCount',
    'loadPressure',
    'networkStress',
    'networkSynergy',
    'nodeCount'
  ].sort());
  assert.strictEqual(globalThis.world.metrics.global.networkSynergy, globalThis.__ATOMA_LIVE_METRICS__.networkSynergy);
  assert.strictEqual(globalThis.globalMetrics.synergy, globalThis.__ATOMA_LIVE_METRICS__.networkSynergy);
  assert.strictEqual(globalThis.world.metrics.globalMetrics.load, globalThis.__ATOMA_LIVE_METRICS__.loadPressure);
});

test('MetricsRuntime_v1 prefers canonical metrics container over legacy top-level aliases when aggregating active nodes', () => {
  globalThis.__ATOMA_LIVE_METRICS__ = undefined;
  globalThis.world = {};
  globalThis.globalMetrics = undefined;

  const node = {
    userData: {
      nodeId: 'node-1',
      synergy: 0,
      stability: 0,
      metrics: {
        synergy: 0.9,
        harmony: 0.4,
        stability: 0.8,
        corruption: 0.2,
        loadPressure: 0.3
      }
    }
  };
  const links = [{ source: node, target: node, active: true }];
  const runtime = new MetricsRuntime_v1({ nodes: [node], links, linkSystem: null, metricsSystems: {} });

  const aggregated = runtime._aggregateNodeMetrics();
  assert.ok(Math.abs(aggregated.networkSynergy - 0.9) < 1e-6, 'Expected canonical synergy value from metrics container');
  assert.ok(Math.abs(aggregated.networkStress - 0.2) < 1e-6, 'Expected canonical stability/stress from metrics container');
  assert.ok(Math.abs(aggregated.loadPressure - 0.3) < 1e-6, 'Expected canonical loadPressure value from metrics container');
});

test('MetricsRuntime_v1 canonical fallback preserves registry stability and corruption values', () => {
  const node = {
    userData: {
      nodeId: 'prime-1',
      visualCode: 1001,
      metrics: {
        synergy: 0.9,
        harmony: 0.9,
        stability: 0.9,
        corruption: 0.005,
        loadPressure: 0.62
      }
    }
  };

  const runtime = new MetricsRuntime_v1({ nodes: [node], links: [], linkSystem: null, metricsSystems: {} });
  runtime._ensureNodeCanonicalFallbacks([node]);

  assert.ok(Math.abs(node.userData.metrics.stability - 0.9) < 1e-6, 'Expected stability to survive canonical fallback');
  assert.ok(Math.abs(node.userData.metrics.corruption - 0.005) < 1e-6, 'Expected corruption to survive canonical fallback');
  assert.ok(Math.abs(node.userData.stability - 0.9) < 1e-6, 'Expected userData.stability legacy fallback to stay aligned');
  assert.ok(Math.abs(node.userData.instability - 0.1) < 1e-6, 'Expected userData.instability legacy fallback to stay inverted');
});

test('ensureMetrics seeds placeholder canonical metrics from archetype snapshot without overwriting live values', () => {
  const seededNode = {
    userData: {
      nodeId: 'error-1',
      visualCode: 1105,
      archetypeMetrics: {
        synergy: 0.140157,
        harmony: 0.128969,
        stability: 0.224775,
        corruption: 0.781345,
        loadPressure: 0.609660
      },
      metrics: {
        synergy: 0,
        harmony: 0,
        stability: 1,
        corruption: 0,
        loadPressure: 0,
        load: 0,
        loadRatio: 0
      }
    }
  };

  const metrics = ensureMetrics(seededNode);
  assert.ok(Math.abs(metrics.synergy - 0.140157) < 1e-6, 'Expected synergy to seed from archetype snapshot');
  assert.ok(Math.abs(metrics.harmony - 0.128969) < 1e-6, 'Expected harmony to seed from archetype snapshot');
  assert.ok(Math.abs(metrics.stability - 0.224775) < 1e-6, 'Expected stability to seed from archetype snapshot');
  assert.ok(Math.abs(metrics.corruption - 0.781345) < 1e-6, 'Expected corruption to seed from archetype snapshot');
  assert.ok(Math.abs(metrics.loadPressure - 0.609660) < 1e-6, 'Expected loadPressure to seed from archetype snapshot');
  assert.ok(Math.abs(seededNode.userData.load - 0.609660) < 1e-6, 'Expected load alias to stay aligned');

  const liveNode = {
    userData: {
      nodeId: 'control-1',
      visualCode: 602,
      archetypeMetrics: {
        synergy: 0.401263,
        harmony: 0.591847,
        stability: 0.682174,
        corruption: 0.019836,
        loadPressure: 0.326841
      },
      metrics: {
        synergy: 0.5,
        harmony: 0.6,
        stability: 0.7,
        corruption: 0.12,
        loadPressure: 0.25,
        load: 0.25,
        loadRatio: 0.25
      }
    }
  };

  const liveMetrics = ensureMetrics(liveNode);
  assert.ok(Math.abs(liveMetrics.synergy - 0.5) < 1e-6, 'Expected live synergy to remain unchanged');
  assert.ok(Math.abs(liveMetrics.corruption - 0.12) < 1e-6, 'Expected live corruption to remain unchanged');
});

test('SemanticMetricAdapter derives networkStress from stability and preserves stability aliases', () => {
  const emptyProjected = projectHudMetrics({});
  assert.strictEqual(emptyProjected.networkStress, 0, 'Expected empty HUD projection to stay neutral, not max stress');

  const projected = projectHudMetrics({ stability: 0.8 });
  assert.ok(Math.abs(projected.networkStress - 0.2) < 1e-6, 'Expected networkStress to invert stability for HUD projection');
  assert.ok(Math.abs(projected.stability - 0.8) < 1e-6, 'Expected stability to be preserved for HUD projection');
  assert.ok(Math.abs(projected.stabilityNorm - 0.8) < 1e-6, 'Expected stabilityNorm to mirror stability');

  const aliased = withGlobalMetricAliases({ stability: 0.8 });
  assert.ok(Math.abs(aliased.networkStress - 0.2) < 1e-6, 'Expected canonical global aliasing to invert stability into stress');
  assert.ok(Math.abs(aliased.stability - 0.8) < 1e-6, 'Expected canonical global aliasing to preserve stability');
  assert.ok(Math.abs(aliased.stabilityNorm - 0.8) < 1e-6, 'Expected stabilityNorm alias to remain stability');

  const hudMetrics = updateHudMetrics(null, { stabilityNorm: 0.8 });
  assert.ok(Math.abs(hudMetrics.networkStress - 0.2) < 1e-6, 'Expected HUD update to derive stress from vm stabilityNorm');
});

test('aggregateNetworkCanonicalMetrics returns inverted networkStress for stable nodes', () => {
  const aggregated = aggregateNetworkCanonicalMetrics([
    createMockNode({ stability: 0.8 })
  ]);

  assert.ok(Math.abs(aggregated.stability - 0.8) < 1e-6, 'Expected aggregated stability to match input stability');
  assert.ok(Math.abs(aggregated.networkStress - 0.2) < 1e-6, 'Expected aggregated networkStress to invert stability');
});

test('MetricsRuntime_v1 runtime update maintains full canonical __ATOMA_LIVE_METRICS__ shape', () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));

  const bus = createTestBus();
  globalThis.semanticBus = bus;
  globalThis.__ATOMA_LIVE_METRICS__ = { networkSynergy: 0 };
  globalThis.world = {};
  globalThis.globalMetrics = {};

  const nodes = [{
    userData: {
      nodeId: 'node-1',
      metrics: {
        synergy: 0.7,
        harmony: 0.6,
        stability: 0.8,
        corruption: 0.1,
        loadPressure: 0.2
      }
    }
  }];

  const runtime = new MetricsRuntime_v1({ nodes, links: [], linkSystem: null, metricsSystems: {} });
  runtime.update(5.2);

  assert.deepStrictEqual(Object.keys(globalThis.__ATOMA_LIVE_METRICS__).sort(), [
    'corruptionLevel',
    'harmonyFlow',
    'linkCount',
    'loadPressure',
    'networkStress',
    'networkSynergy',
    'nodeCount'
  ].sort());
  assert.strictEqual(globalThis.world.metrics.global.networkSynergy, globalThis.__ATOMA_LIVE_METRICS__.networkSynergy);
  assert.strictEqual(globalThis.world.metrics.global.loadPressure, globalThis.__ATOMA_LIVE_METRICS__.loadPressure);
  assert.strictEqual(globalThis.globalMetrics.synergy, globalThis.__ATOMA_LIVE_METRICS__.networkSynergy);
  assert.ok(!warnings.some(msg => msg.includes('__ATOMA_LIVE_METRICS__ is missing canonical fields')),
    'Expected runtime update to maintain the full canonical live metrics shape');

  console.warn = originalWarn;
});

test('MetricsRuntime_v1 runtime audit warns on missing canonical node metrics and broken live publish shape', () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => {
    warnings.push(args);
  };

  globalThis.__ATOMA_LIVE_METRICS__ = {
    networkSynergy: 0,
    harmonyFlow: 0,
    networkStress: 0
  };
  globalThis.world = {};
  globalThis.globalMetrics = {};

  const nodes = [{ userData: {} }];
  const runtime = new MetricsRuntime_v1({ nodes, links: [], linkSystem: null, metricsSystems: {} });
  globalThis.__ATOMA_LIVE_METRICS__ = {
    networkSynergy: 0,
    harmonyFlow: 0,
    networkStress: 0
  };
  runtime._runMetricAuthorityAudit(5.0, nodes, []);

  console.warn = originalWarn;

  const concatenated = warnings.map((args) => args.join(' ')).join(' ');
  assert.strictEqual(warnings.length > 0, true, 'Expected audit warnings to be emitted');
  assert.ok(concatenated.includes('missing canonical node.userData.metrics'), 'Expected missing canonical metrics warning');
  assert.ok(concatenated.includes('__ATOMA_LIVE_METRICS__ is missing canonical fields'), 'Expected global publish shape warning');
});

// Node tier event emission
test('NodeMetricEngine emits node.harmony.high on threshold transition', () => {
  const bus = createTestBus();
  globalThis.semanticBus = bus;
  const captured = [];
  bus.subscribe('node.harmony.high', (payload) => captured.push(payload));

  const node = createMockNode({ harmony: 0.6, synergy: 0.2, stability: 0.7, corruption: 0.1, loadPressure: 0.1 });
  node.userData._metricActiveLink = true;
  node.userData.__metricEventState = { metricTiers: { harmony: 'mid' } };

  setMetric(node, 'harmony', 0.85, { source: 'test' });

  assert.strictEqual(captured.length, 1, 'Expected node.harmony.high event');
  assert.strictEqual(captured[0].metric, 'harmony');
  assert.strictEqual(captured[0].tier, 'high');
});

// Global tier event emission
test('MetricsRuntime_v1 emits global.harmony.high on threshold transition', () => {
  const bus = createTestBus();
  globalThis.semanticBus = bus;
  const captured = [];
  bus.subscribe('global.harmony.high', (payload) => captured.push(payload));

  const runtime = new MetricsRuntime_v1({ nodes: [], links: [], linkSystem: null, metricsSystems: {} });
  runtime._semanticSignalState = { tiers: { harmony: 'mid' } };

  runtime._emitMetricTierSignals({ networkSynergy: 0, harmonyFlow: 0.85, networkStress: 0.1, corruptionLevel: 0, loadPressure: 0 }, { nodeCount: 1, linkCount: 0 });

  assert.strictEqual(captured.length, 1, 'Expected global.harmony.high event');
  assert.strictEqual(captured[0].metric, 'harmony');
  assert.strictEqual(captured[0].tier, 'high');
});

// Link tier event emission
test('LinkQualityCalculator emits link.harmony.high on threshold transition', () => {
  const bus = createTestBus();
  const calculator = new LinkQualityCalculator(null, null, { semanticBus: bus });
  const captured = [];
  bus.subscribe('link.harmony.high', (payload) => captured.push(payload));

  const link = createMockLink({ harmony: 'mid' });
  const quality = { score: 80, harmony: 82, structural: 90, corruption: 10, load: 20 };

  calculator._emitLinkMetricTierEvents(link, quality, Date.now());

  assert.strictEqual(captured.length, 1, 'Expected link.harmony.high event');
  assert.strictEqual(captured[0].metric, 'harmony');
  assert.strictEqual(captured[0].tier, 'high');
});

// Hub tier event emission
test('HarmonicHubAuraSystem_Session126 emits hub.harmony.high on threshold transition', () => {
  const bus = createTestBus();
  globalThis.semanticBus = bus;
  const captured = [];
  bus.subscribe('hub.harmony.high', (payload) => captured.push(payload));

  const hubSystem = new HarmonicHubAuraSystem_Session126(
    { add: () => {} },
    { add: () => {} },
    null,
    null,
    null,
    {}
  );
  const hub = createMockHub({ harmony: 'mid' });
  hub.harmony = 0.9;
  hub.synergy = 0.8;
  hub.corruption = 0.0;
  hub.stability = 0.85;

  hubSystem._syncHubMetricMirror(hub);

  assert.strictEqual(captured.length, 1, 'Expected hub.harmony.high event');
  assert.strictEqual(captured[0].metric, 'harmony');
  assert.strictEqual(captured[0].tier, 'high');
});

// Integration: node.harmony.high flows to world-event consumer
test('node.harmony.high reaches a world-event subscriber', () => {
  const bus = createTestBus();
  globalThis.semanticBus = bus;
  let called = false;
  bus.subscribe('node.harmony.high', () => {
    called = true;
  });

  const node = createMockNode({ harmony: 0.6, synergy: 0.2, stability: 0.7, corruption: 0.1, loadPressure: 0.1 });
  node.userData._metricActiveLink = true;
  node.userData.__metricEventState = { metricTiers: { harmony: 'mid' } };
  setMetric(node, 'harmony', 0.85, { source: 'test' });

  assert.strictEqual(called, true, 'Expected world-event subscriber to receive node.harmony.high');
});

// Node initial tier emission (previously skipped when previousTier === null)
test('NodeMetricEngine emits node.harmony.high on initial classification', () => {
  const bus = createTestBus();
  globalThis.semanticBus = bus;
  const captured = [];
  bus.subscribe('node.harmony.high', (payload) => captured.push(payload));

  // No pre-seeded __metricEventState — simulates first-ever metric write
  const node = createMockNode({ harmony: 0.5, synergy: 0.2, stability: 0.7, corruption: 0.1, loadPressure: 0.1 });
  node.userData._metricActiveLink = true;

  setMetric(node, 'harmony', 0.85, { source: 'test' });

  assert.strictEqual(captured.length, 1, 'Expected node.harmony.high on initial classification');
  assert.strictEqual(captured[0].initial, true, 'Expected initial flag');
});

// Global initial tier emission (previously skipped when previousTier === null)
test('MetricsRuntime_v1 emits global.harmony.high on initial classification', () => {
  const bus = createTestBus();
  globalThis.semanticBus = bus;
  const captured = [];
  bus.subscribe('global.harmony.high', (payload) => captured.push(payload));

  const runtime = new MetricsRuntime_v1({ nodes: [], links: [], linkSystem: null, metricsSystems: {} });
  // No pre-seeded tiers — simulates first-ever global metrics computation
  runtime._semanticSignalState = { tiers: {} };

  runtime._emitMetricTierSignals({ networkSynergy: 0, harmonyFlow: 0.85, networkStress: 0.1, corruptionLevel: 0, loadPressure: 0 }, { nodeCount: 1, linkCount: 0 });

  assert.strictEqual(captured.length, 1, 'Expected global.harmony.high on initial classification');
  assert.strictEqual(captured[0].initial, true, 'Expected initial flag');
});

for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

if (process.exitCode !== 1) {
  console.log('All MetricsAuthority tests passed');
}
