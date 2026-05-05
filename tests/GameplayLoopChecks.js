import assert from 'node:assert/strict';
import fs from 'node:fs';
import { VisualNetworkTimeElasticity_v1, SCORE_DIRECTION } from '../VisualNetworkTimeElasticity_v1.js';
import { AtomaLeaderboard } from '../AtomaLeaderboard.js';
import { LinkCollapseSystem } from '../LinkCollapseSystem.js';
import { getDefaultMetricThresholds } from '../src/metrics/MetricTierClassifier.js';
import { NODE_VISUAL_REGISTRY } from '../NodeVisualRegistry.js';
import { onLinkCreated, onLinkRemoved } from '../src/metrics/NodeMetricEngine.js';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function assertNear(actual, expected, epsilon = 1e-9) {
  assert(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

test('Network Time rewinds after 5s of canonical global.synergy.high sustain', () => {
  const threshold = getDefaultMetricThresholds('synergy').high;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5,
    synergyQualityScale: 0
  });

  score.setAverageSynergy(threshold);
  for (let t = 1; t <= 5; t++) {
    score.update(1, t);
  }

  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);
  score.update(1, 6);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.REWIND);
  assert(score.getNetworkTime() > 0, 'Network Time should accumulate before rewind starts');
});

test('Network Time stays forward below canonical global.synergy.high threshold', () => {
  const threshold = getDefaultMetricThresholds('synergy').high;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5
  });

  score.setAverageSynergy(threshold - 0.01);
  for (let t = 1; t <= 10; t++) {
    score.update(1, t);
  }

  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);
});

test('Network Time sustain resets cleanly when synergy drops before 5s', () => {
  const threshold = getDefaultMetricThresholds('synergy').high;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5,
    synergyQualityScale: 0
  });

  score.setAverageSynergy(threshold);
  for (let t = 1; t <= 4; t++) {
    score.update(1, t);
  }
  assert(score.getSustainProgress() > 0 && score.getSustainProgress() < 5);

  score.setAverageSynergy(threshold - 0.05);
  score.update(1, 5);
  assert.strictEqual(score.getSustainProgress(), 0);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);

  score.setAverageSynergy(threshold);
  for (let t = 6; t <= 9; t++) {
    score.update(1, t);
  }
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);

  score.update(1, 10);
  score.update(1, 11);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.REWIND);
});

test('Network Time win triggers exactly when counter reaches zero', () => {
  const threshold = getDefaultMetricThresholds('synergy').high;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5,
    synergyQualityScale: 0
  });

  score._networkTimeCounter = 3;
  score._sustainedDuration = 5;
  score._highSynergyStartTime = 0;
  score.setAverageSynergy(threshold);
  score.update(1, 6);

  assert.strictEqual(score.isWon(), true);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.WON);
  assert.strictEqual(score.getNetworkTime(), 0);
});

test('Network Time keeps pressure escalation, combo, and drama zone behaviors', () => {
  const threshold = getDefaultMetricThresholds('synergy').high;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 0.1,
    synergyQualityScale: 0,
    dramaZoneThreshold: 20
  });

  score.setAverageSynergy(threshold - 0.05);
  score._networkTimeCounter = 150;
  score.update(1, 1);
  assert(score._networkTimeCounter > 155, 'forward pressure should escalate as NT rises');

  score._networkTimeCounter = 10;
  score.setAverageSynergy(threshold);
  score.update(0.1, 2);
  score.update(0.1, 2.1);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.REWIND);
  assert.strictEqual(score.getScoreState().combo, 1);
  assert.strictEqual(score.isInDramaZone(), true);

  score.setAverageSynergy(threshold - 0.05);
  score.update(0.05, 3);
  score.setAverageSynergy(threshold);
  score.update(0.1, 4);
  score.update(0.1, 4.2);
  assert.strictEqual(score.getScoreState().combo, 2);
});

test('Unified release score config is mirrored in main and menu definitions', () => {
  const mainSource = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  const menuSource = fs.readFileSync(new URL('../MainMenu.js', import.meta.url), 'utf8');

  const mainMatches = mainSource.match(/sustainDuration:\s*5,\s*rewindSpeed:\s*3\.5,\s*forwardSpeed:\s*5/g) ?? [];
  const menuMatches = menuSource.match(/sustainDuration:\s*5,\s*rewindSpeed:\s*3\.5,\s*forwardSpeed:\s*5/g) ?? [];

  assert(mainMatches.length >= 6, 'main.js should define unified release score config for all worlds');
  assert(menuMatches.length >= 6, 'MainMenu.js should mirror the unified release score config for all worlds');
  assert(!mainSource.includes('sustainDuration: 10'), 'old per-world score drift should be removed from main.js');
  assert(!menuSource.includes('sustainDuration: 10'), 'old per-world score drift should be removed from MainMenu.js');
});

test('Balance-first DNA offsets only lift storage, input, and control baselines', () => {
  const storageNode = NODE_VISUAL_REGISTRY[501];
  const inputNode = NODE_VISUAL_REGISTRY[101];
  const controlNode = NODE_VISUAL_REGISTRY[601];
  const analyticsNode = NODE_VISUAL_REGISTRY[401];

  assertNear(storageNode.metrics.synergy, 0.374731);
  assertNear(storageNode.metrics.harmony, 0.458263);
  assertNear(storageNode.metrics.stability, 0.643847);
  assertNear(storageNode.metrics.loadPressure, 0.208473);

  assertNear(inputNode.metrics.synergy, 0.412741);
  assertNear(inputNode.metrics.harmony, 0.481283);
  assertNear(inputNode.metrics.stability, 0.433817);

  assertNear(controlNode.metrics.synergy, 0.412847);
  assertNear(controlNode.metrics.harmony, 0.593721);

  assertNear(analyticsNode.metrics.synergy, 0.538174);
  assertNear(analyticsNode.metrics.harmony, 0.392847);
  assertNear(analyticsNode.metrics.stability, 0.318263);
  assertNear(analyticsNode.metrics.loadPressure, 0.402817);
});

test('Link create and remove impulses improve stability and only mildly punish cross-category links', () => {
  const nodeA = {
    userData: {
      nodeId: 'test-a',
      category: 'input',
      archetypeMetrics: {
        synergy: 0.42,
        harmony: 0.48,
        stability: 0.43,
        corruption: 0.04,
        loadPressure: 0.21
      },
      metrics: {
        synergy: 0.42,
        harmony: 0.48,
        stability: 0.43,
        corruption: 0.04,
        loadPressure: 0.21
      }
    }
  };
  const nodeB = {
    userData: {
      nodeId: 'test-b',
      category: 'storage',
      archetypeMetrics: {
        synergy: 0.37,
        harmony: 0.46,
        stability: 0.64,
        corruption: 0.02,
        loadPressure: 0.21
      },
      metrics: {
        synergy: 0.37,
        harmony: 0.46,
        stability: 0.64,
        corruption: 0.02,
        loadPressure: 0.21
      }
    }
  };

  onLinkCreated(nodeA, nodeB);
  assert(nodeA.userData.metrics.harmony > 0.48);
  assert(nodeA.userData.metrics.stability > 0.43);
  assert(nodeA.userData.metrics.loadPressure > 0.21 && nodeA.userData.metrics.loadPressure < 0.22);
  assert(nodeA.userData.metrics.corruption < 0.04, 'link should still lower corruption overall on source node');
  assert(nodeB.userData.metrics.corruption < 0.03, 'cross-category penalty should stay mild on target node');

  const postCreateStabilityA = nodeA.userData.metrics.stability;
  const postCreateHarmonyA = nodeA.userData.metrics.harmony;
  const postCreateLoadA = nodeA.userData.metrics.loadPressure;

  onLinkRemoved(nodeA, nodeB);
  assert(nodeA.userData.metrics.stability < postCreateStabilityA);
  assert(nodeA.userData.metrics.harmony < postCreateHarmonyA);
  assert(nodeA.userData.metrics.loadPressure < postCreateLoadA);
});

test('Leaderboard scoring prefers synergy mastery over a slightly faster weak run', () => {
  const leaderboard = new AtomaLeaderboard();
  const masteryRun = leaderboard.calculateScore({
    gameTime: 170,
    avgSynergy: 0.88,
    peakNT: 160,
    maxCombo: 3,
    totalCollapses: 0,
    totalRewindTime: 80,
    averageRewindSynergy: 0.9,
    rewindUptimeRatio: 0.47
  });
  const weakFastRun = leaderboard.calculateScore({
    gameTime: 150,
    avgSynergy: 0.52,
    peakNT: 260,
    maxCombo: 0,
    totalCollapses: 1,
    totalRewindTime: 28,
    averageRewindSynergy: 0.55,
    rewindUptimeRatio: 0.19
  });

  assert(masteryRun.score > weakFastRun.score);
});

test('Leaderboard scoring rewards rewind uptime and penalizes collapses', () => {
  const leaderboard = new AtomaLeaderboard();
  const lowUptime = leaderboard.calculateScore({
    gameTime: 200,
    avgSynergy: 0.72,
    peakNT: 210,
    maxCombo: 1,
    totalCollapses: 0,
    totalRewindTime: 20,
    averageRewindSynergy: 0.72,
    rewindUptimeRatio: 0.10
  });
  const highUptime = leaderboard.calculateScore({
    gameTime: 200,
    avgSynergy: 0.72,
    peakNT: 210,
    maxCombo: 1,
    totalCollapses: 0,
    totalRewindTime: 70,
    averageRewindSynergy: 0.85,
    rewindUptimeRatio: 0.35
  });
  const collapseHeavy = leaderboard.calculateScore({
    gameTime: 200,
    avgSynergy: 0.72,
    peakNT: 210,
    maxCombo: 1,
    totalCollapses: 4,
    totalRewindTime: 70,
    averageRewindSynergy: 0.85,
    rewindUptimeRatio: 0.35
  });

  assert(highUptime.score > lowUptime.score);
  assert(collapseHeavy.score < highUptime.score);
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
