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
