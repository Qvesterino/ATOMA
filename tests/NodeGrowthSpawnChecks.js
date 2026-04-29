import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
window.ATOMA_FLAGS = window.ATOMA_FLAGS || {
  runtime: { linkSpawnEnabled: true },
  debug: {}
};
window.AuraDebug = window.AuraDebug || {};

const { AINodes } = await import('../AINodes.js');

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test('link-threshold growth only advances on active-link milestones', () => {
  const queued = [];
  const ctx = {
    spawnState: { phase: 'RUNTIME' },
    spawningConfig: { disableRuntimeSpawn: false, linkSpawnEveryNLinks: 3 },
    hardSpawnCap: null,
    getNodeCount() { return 15; },
    spawnGrowthState: {
      linksSinceSpawn: 0,
      linkSpawnMilestone: 0,
      lastObservedActiveLinks: 0,
      lastTimeSpawnAt: 0
    },
    _getActiveLinkCount: AINodes.prototype._getActiveLinkCount,
    _queueGrowthSpawnRequest(reason) {
      queued.push(reason);
      return true;
    }
  };

  AINodes.prototype.maybeSpawnNodeFromLinkCreation.call(ctx, { totalLinks: 1 });
  AINodes.prototype.maybeSpawnNodeFromLinkCreation.call(ctx, { totalLinks: 2 });
  AINodes.prototype.maybeSpawnNodeFromLinkCreation.call(ctx, { totalLinks: 3 });

  assert.strictEqual(queued.length, 1);
  assert.strictEqual(ctx.spawnGrowthState.linkSpawnMilestone, 1);

  // Simulate unlinking back down and rebuilding the network.
  AINodes.prototype.maybeSpawnNodeFromLinkCreation.call(ctx, { totalLinks: 2 });
  AINodes.prototype.maybeSpawnNodeFromLinkCreation.call(ctx, { totalLinks: 3 });
  AINodes.prototype.maybeSpawnNodeFromLinkCreation.call(ctx, { totalLinks: 4 });
  AINodes.prototype.maybeSpawnNodeFromLinkCreation.call(ctx, { totalLinks: 5 });

  assert.strictEqual(queued.length, 1);

  AINodes.prototype.maybeSpawnNodeFromLinkCreation.call(ctx, { totalLinks: 6 });
  assert.strictEqual(queued.length, 2);
  assert.strictEqual(ctx.spawnGrowthState.linkSpawnMilestone, 2);
});

test('growth spawn candidate skips visual codes already active on the map', () => {
  const ctx = {
    nodes: [
      { userData: { visualCode: 101 } },
      { userData: { spawnCycle: { visualCode: 201 } } },
      { userData: { enhancedNodeModelBinding: { visualCode: 301 } } }
    ],
    _getUsedVisualCodeSet: AINodes.prototype._getUsedVisualCodeSet,
    _getAvailableVisualEntries: AINodes.prototype._getAvailableVisualEntries
  };

  const candidate = AINodes.prototype._resolveGrowthSpawnCandidate.call(ctx);
  const used = AINodes.prototype._getUsedVisualCodeSet.call(ctx);

  assert(candidate, 'expected an available growth spawn candidate');
  assert(!used.has(candidate.visualCode), 'growth candidate reused an active visual code');
});

test('queueGrowthSpawnRequest carries forced unique visual options', () => {
  const queued = [];
  const ctx = {
    spawnState: { phase: 'RUNTIME' },
    spawningConfig: {
      disableRuntimeSpawn: false,
      growthSpawnPriority: { linkThreshold: 3, timeThreshold: 2 }
    },
    hardSpawnCap: null,
    getNodeCount() { return 15; },
    spawnGrowthState: {
      linksSinceSpawn: 0,
      linkSpawnMilestone: 0,
      lastObservedActiveLinks: 0,
      lastTimeSpawnAt: 0
    },
    _resolveGrowthSpawnCandidate() {
      return { category: 'storage', visualCode: 501 };
    },
    requestSpawn(request) {
      queued.push(request);
    }
  };

  const queuedOk = AINodes.prototype._queueGrowthSpawnRequest.call(ctx, 'time-threshold', 45000, null);

  assert.strictEqual(queuedOk, true);
  assert.strictEqual(queued.length, 1);
  assert.strictEqual(queued[0].category, 'storage');
  assert.strictEqual(queued[0].options.forcedVisualCode, 501);
  assert.strictEqual(queued[0].options.requireUniqueVisualCode, true);
  assert.strictEqual(ctx.spawnGrowthState.lastTimeSpawnAt, 45000);
});

for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

if (process.exitCode !== 1) {
  console.log('All NodeGrowthSpawn checks passed');
}
