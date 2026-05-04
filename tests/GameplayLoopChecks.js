import assert from 'node:assert/strict';
import { VisualNetworkTimeElasticity_v1, SCORE_DIRECTION } from '../VisualNetworkTimeElasticity_v1.js';
import { LinkCollapseSystem } from '../LinkCollapseSystem.js';
import { getDefaultMetricThresholds } from '../src/metrics/MetricTierClassifier.js';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

test('Network Time rewinds from canonical global.synergy.high threshold', () => {
  const threshold = getDefaultMetricThresholds('synergy').high;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3,
    sustainDuration: 7,
    synergyQualityScale: 0
  });

  score.setAverageSynergy(threshold);
  for (let t = 1; t <= 8; t++) {
    score.update(1, t);
  }

  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.REWIND);
  assert(score.getNetworkTime() > 0, 'Network Time should accumulate before rewind starts');
});

test('Network Time stays forward below canonical global.synergy.high threshold', () => {
  const threshold = getDefaultMetricThresholds('synergy').high;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3,
    sustainDuration: 7
  });

  score.setAverageSynergy(threshold - 0.01);
  for (let t = 1; t <= 10; t++) {
    score.update(1, t);
  }

  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);
});

test('LinkCollapseSystem uses canonical link metrics instead of stale visual fallback metrics', () => {
  const originalDateNow = Date.now;
  let now = 1000;
  Date.now = () => now;

  try {
    const collapseRequests = [];
    const source = { userData: { nodeId: 'a', metrics: { stability: 0.1, corruption: 0.9 } } };
    const target = { userData: { nodeId: 'b', metrics: { stability: 0.1, corruption: 0.9 } } };
    const link = {
      id: 'link-a-b',
      active: true,
      source,
      target,
      userData: {
        metrics: {
          corruption: 0.9,
          stability: 0.1,
          loadPressure: 0.2
        }
      }
    };

    const linkingSystem = {
      links: [link],
      onLinkCreated() {},
      onLinkUpdated() {},
      onLinkRemoved() {},
      enqueueCollapseRequest(targetLink, context) {
        collapseRequests.push({ targetLink, context });
      }
    };

    const collapseSystem = new LinkCollapseSystem(linkingSystem, null, null, {
      holdDurationMs: 1000,
      corruptionHighThreshold: 0.8,
      stabilityLowThreshold: 0.2,
      enableVisualFeedback: false,
      globalMetricsEnabled: false
    });

    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0, stability: 0.1 }, { silent: true });
    now += 1000;
    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0, stability: 0.1 }, { silent: true });

    assert.strictEqual(collapseRequests.length, 1);
    assert.strictEqual(collapseSystem.getCollapseStatistics().totalCollapses, 1);
    assert.strictEqual(collapseRequests[0].context.corruption, 0.9);
  } finally {
    Date.now = originalDateNow;
  }
});

test('LinkCollapseSystem collapses after sustained high corruption alone in OR mode', () => {
  const originalDateNow = Date.now;
  let now = 2000;
  Date.now = () => now;

  try {
    const collapseRequests = [];
    const source = { userData: { nodeId: 'c' } };
    const target = { userData: { nodeId: 'd' } };
    const link = {
      id: 'link-c-d',
      active: true,
      source,
      target,
      userData: {
        metrics: {
          corruption: 0.9,
          stability: 0.8,
          loadPressure: 0.1
        }
      }
    };

    const linkingSystem = {
      links: [link],
      onLinkCreated() {},
      onLinkUpdated() {},
      onLinkRemoved() {},
      enqueueCollapseRequest(targetLink, context) {
        collapseRequests.push({ targetLink, context });
      }
    };

    const collapseSystem = new LinkCollapseSystem(linkingSystem, null, null, {
      holdDurationMs: 1000,
      corruptionHighThreshold: 0.8,
      stabilityLowThreshold: 0.2,
      enableVisualFeedback: false,
      globalMetricsEnabled: false
    });

    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.9, stability: 0.8 }, { silent: true });
    now += 1000;
    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.9, stability: 0.8 }, { silent: true });

    assert.strictEqual(collapseRequests.length, 1);
    assert.strictEqual(collapseRequests[0].context.reason, 'collapse-threshold');
  } finally {
    Date.now = originalDateNow;
  }
});

test('LinkCollapseSystem collapses after sustained low stability alone in OR mode', () => {
  const originalDateNow = Date.now;
  let now = 3000;
  Date.now = () => now;

  try {
    const collapseRequests = [];
    const source = { userData: { nodeId: 'e' } };
    const target = { userData: { nodeId: 'f' } };
    const link = {
      id: 'link-e-f',
      active: true,
      source,
      target,
      userData: {
        metrics: {
          corruption: 0.1,
          stability: 0.1,
          loadPressure: 0.3
        }
      }
    };

    const linkingSystem = {
      links: [link],
      onLinkCreated() {},
      onLinkUpdated() {},
      onLinkRemoved() {},
      enqueueCollapseRequest(targetLink, context) {
        collapseRequests.push({ targetLink, context });
      }
    };

    const collapseSystem = new LinkCollapseSystem(linkingSystem, null, null, {
      holdDurationMs: 1000,
      corruptionHighThreshold: 0.8,
      stabilityLowThreshold: 0.2,
      enableVisualFeedback: false,
      globalMetricsEnabled: false
    });

    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.1, stability: 0.1 }, { silent: true });
    now += 1000;
    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.1, stability: 0.1 }, { silent: true });

    assert.strictEqual(collapseRequests.length, 1);
    assert.strictEqual(collapseRequests[0].context.stability, 0.1);
  } finally {
    Date.now = originalDateNow;
  }
});

test('LinkCollapseSystem does not collapse for short spike below hold duration', () => {
  const originalDateNow = Date.now;
  let now = 4000;
  Date.now = () => now;

  try {
    const collapseRequests = [];
    const source = { userData: { nodeId: 'g' } };
    const target = { userData: { nodeId: 'h' } };
    const link = {
      id: 'link-g-h',
      active: true,
      source,
      target,
      userData: {
        metrics: {
          corruption: 0.85,
          stability: 0.5,
          loadPressure: 0.1
        }
      }
    };

    const linkingSystem = {
      links: [link],
      onLinkCreated() {},
      onLinkUpdated() {},
      onLinkRemoved() {},
      enqueueCollapseRequest(targetLink, context) {
        collapseRequests.push({ targetLink, context });
      }
    };

    const collapseSystem = new LinkCollapseSystem(linkingSystem, null, null, {
      holdDurationMs: 1000,
      corruptionHighThreshold: 0.8,
      stabilityLowThreshold: 0.2,
      enableVisualFeedback: false,
      globalMetricsEnabled: false
    });

    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.85, stability: 0.5 }, { silent: true });
    now += 750;
    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.85, stability: 0.5 }, { silent: true });

    assert.strictEqual(collapseRequests.length, 0);
    assert(collapseSystem.getCollapseProgress(link) < 1, 'progress should remain below collapse threshold');
  } finally {
    Date.now = originalDateNow;
  }
});

test('LinkCollapseSystem recovers and resets progress when metrics return to normal', () => {
  const originalDateNow = Date.now;
  let now = 5000;
  Date.now = () => now;

  try {
    const collapseRequests = [];
    const source = { userData: { nodeId: 'i' } };
    const target = { userData: { nodeId: 'j' } };
    const link = {
      id: 'link-i-j',
      active: true,
      source,
      target,
      userData: {
        metrics: {
          corruption: 0.9,
          stability: 0.6,
          loadPressure: 0.2
        }
      }
    };

    const linkingSystem = {
      links: [link],
      onLinkCreated() {},
      onLinkUpdated() {},
      onLinkRemoved() {},
      enqueueCollapseRequest(targetLink, context) {
        collapseRequests.push({ targetLink, context });
      }
    };

    const collapseSystem = new LinkCollapseSystem(linkingSystem, null, null, {
      holdDurationMs: 1000,
      corruptionHighThreshold: 0.8,
      stabilityLowThreshold: 0.2,
      stressRecoveryRate: 1.0,
      enableVisualFeedback: false,
      globalMetricsEnabled: false
    });

    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.9, stability: 0.6 }, { silent: true });
    now += 600;
    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.9, stability: 0.6 }, { silent: true });
    const midProgress = collapseSystem.getCollapseProgress(link);
    assert(midProgress > 0, 'progress should accumulate while stressed');

    link.userData.metrics.corruption = 0.1;
    link.userData.metrics.stability = 0.8;
    now += 1000;
    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.1, stability: 0.8 }, { silent: true });

    assert.strictEqual(collapseRequests.length, 0);
    assert.strictEqual(collapseSystem.getCollapseState(link).eligibleSince, null);
    assert.strictEqual(collapseSystem.getCollapseProgress(link), 0);
  } finally {
    Date.now = originalDateNow;
  }
});

test('LinkCollapseSystem enqueues collapse only once per link collapse event', () => {
  const originalDateNow = Date.now;
  let now = 6000;
  Date.now = () => now;

  try {
    const collapseRequests = [];
    const source = { userData: { nodeId: 'k' } };
    const target = { userData: { nodeId: 'l' } };
    const link = {
      id: 'link-k-l',
      active: true,
      source,
      target,
      userData: {
        metrics: {
          corruption: 0.9,
          stability: 0.6,
          loadPressure: 0.25
        }
      }
    };

    const linkingSystem = {
      links: [link],
      onLinkCreated() {},
      onLinkUpdated() {},
      onLinkRemoved() {},
      enqueueCollapseRequest(targetLink, context) {
        collapseRequests.push({ targetLink, context });
      }
    };

    const collapseSystem = new LinkCollapseSystem(linkingSystem, null, null, {
      holdDurationMs: 1000,
      corruptionHighThreshold: 0.8,
      stabilityLowThreshold: 0.2,
      enableVisualFeedback: false,
      globalMetricsEnabled: false
    });

    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.9, stability: 0.6 }, { silent: true });
    now += 1000;
    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.9, stability: 0.6 }, { silent: true });
    now += 1000;
    collapseSystem.onLinkMetricsUpdated(link, { corruption: 0.9, stability: 0.6 }, { silent: true });

    assert.strictEqual(collapseRequests.length, 1);
    assert.strictEqual(collapseSystem.getCollapseStatistics().totalCollapses, 1);
  } finally {
    Date.now = originalDateNow;
  }
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
  console.log('All GameplayLoop tests passed');
}
