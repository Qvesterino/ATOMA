import assert from 'node:assert/strict';
import fs from 'node:fs';

globalThis.window = globalThis.window || {};
window.ATOMA_FLAGS = window.ATOMA_FLAGS || {
  runtime: { linkSpawnEnabled: true },
  debug: {}
};
window.AuraDebug = window.AuraDebug || {};

const { AINodes } = await import('../AINodes.js');
const { SessionVariantEngine } = await import('../SessionVariantEngine.js');
const { NodeSpatialIndex } = await import('../NodeSpatialIndex.js');

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

test('balanced init plan gives every valid category one slot before duplicates', () => {
  const ctx = {
    variantEngine: new SessionVariantEngine(12345),
    _shuffleValuesForRun: AINodes.prototype._shuffleValuesForRun,
    _sortCategoriesByRepresentation: AINodes.prototype._sortCategoriesByRepresentation
  };
  const categories = [
    'input', 'process', 'integration', 'analytics', 'storage', 'control',
    'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'
  ];

  const plan = AINodes.prototype._buildBalancedCategoryPlan.call(ctx, 15, categories, null, 'init-test');

  assert.strictEqual(plan.length, 15);
  assert.strictEqual(new Set(plan.slice(0, 12)).size, 12);
  for (const category of categories) {
    assert(plan.slice(0, 12).includes(category), `missing category in first pass: ${category}`);
  }
});

test('new run seed produces different category ordering under normal conditions', () => {
  const categories = [
    'input', 'process', 'integration', 'analytics', 'storage', 'control',
    'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'
  ];
  const makeCtx = (seed) => ({
    variantEngine: new SessionVariantEngine(seed),
    _shuffleValuesForRun: AINodes.prototype._shuffleValuesForRun,
    _sortCategoriesByRepresentation: AINodes.prototype._sortCategoriesByRepresentation
  });

  const planA = AINodes.prototype._buildBalancedCategoryPlan.call(makeCtx(1111), 15, categories, null, 'run-a');
  const planB = AINodes.prototype._buildBalancedCategoryPlan.call(makeCtx(2222), 15, categories, null, 'run-b');

  assert.notDeepStrictEqual(planA, planB);
});

test('growth spawn candidate skips visual codes already active on the map', () => {
  const ctx = {
    nodes: [
      { userData: { visualCode: 101 } },
      { userData: { spawnCycle: { visualCode: 201 } } },
      { userData: { enhancedNodeModelBinding: { visualCode: 301 } } }
    ],
    SUPPORTED_CATEGORIES: ['input', 'process', 'integration', 'analytics', 'storage', 'control', 'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'],
    variantEngine: new SessionVariantEngine(9876),
    _getUsedVisualCodeSet: AINodes.prototype._getUsedVisualCodeSet,
    _shuffleValuesForRun: AINodes.prototype._shuffleValuesForRun,
    _getCategoryVisualPool: AINodes.prototype._getCategoryVisualPool,
    _getValidSpawnCategories: AINodes.prototype._getValidSpawnCategories,
    _getCategoryRepresentationCounts: AINodes.prototype._getCategoryRepresentationCounts,
    _sortCategoriesByRepresentation: AINodes.prototype._sortCategoriesByRepresentation,
    _getUnusedVisualCodesForCategory: AINodes.prototype._getUnusedVisualCodesForCategory,
    _selectVisualCodeForCategory: AINodes.prototype._selectVisualCodeForCategory
  };

  const candidate = AINodes.prototype._resolveGrowthSpawnCandidate.call(ctx);
  const used = AINodes.prototype._getUsedVisualCodeSet.call(ctx);

  assert(candidate, 'expected an available growth spawn candidate');
  assert(!used.has(candidate.visualCode), 'growth candidate reused an active visual code');
  assert.strictEqual(candidate.requireUniqueVisualCode, true);
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

test('growth spawn candidate prefers least represented categories', () => {
  const ctx = {
    nodes: [
      { userData: { category: 'input', visualCode: 101 } },
      { userData: { category: 'input', visualCode: 102 } },
      { userData: { category: 'process', visualCode: 201 } },
      { userData: { category: 'storage', visualCode: 501 } }
    ],
    SUPPORTED_CATEGORIES: ['input', 'process', 'storage', 'sigma'],
    variantEngine: new SessionVariantEngine(4455),
    _getUsedVisualCodeSet: AINodes.prototype._getUsedVisualCodeSet,
    _shuffleValuesForRun: AINodes.prototype._shuffleValuesForRun,
    _getCategoryVisualPool: AINodes.prototype._getCategoryVisualPool,
    _getValidSpawnCategories: AINodes.prototype._getValidSpawnCategories,
    _getCategoryRepresentationCounts: AINodes.prototype._getCategoryRepresentationCounts,
    _sortCategoriesByRepresentation: AINodes.prototype._sortCategoriesByRepresentation,
    _getUnusedVisualCodesForCategory: AINodes.prototype._getUnusedVisualCodesForCategory,
    _selectVisualCodeForCategory: AINodes.prototype._selectVisualCodeForCategory
  };

  const candidate = AINodes.prototype._resolveGrowthSpawnCandidate.call(ctx);
  assert(candidate, 'expected a growth candidate');
  assert.strictEqual(candidate.category, 'sigma');
});

test('armRuntimeSpawningAfterInit clears init-only cap and restores runtime growth target', () => {
  const ctx = {
    currentMode: 'quantum',
    nodes: new Array(15).fill(null).map((_, index) => ({ userData: { nodeId: `n${index}` } })),
    spawnState: { phase: 'INIT', seed: 123 },
    spawnGrowthState: {
      linksSinceSpawn: 2,
      linkSpawnMilestone: 1,
      lastObservedActiveLinks: 3,
      lastTimeSpawnAt: 0
    },
    spawningConfig: {
      disableRuntimeSpawn: true,
      targetPopulation: 15,
      maxNodesTarget: 15,
      needsRearm: true
    },
    hardSpawnCap: 15,
    initSpawnCap: 15,
    getNodeCount() { return this.nodes.length; },
    setSpawnPhase: AINodes.prototype.setSpawnPhase,
    _getModeDefaultPopulationTarget: AINodes.prototype._getModeDefaultPopulationTarget
  };

  AINodes.prototype.armRuntimeSpawningAfterInit.call(ctx, 123456);

  assert.strictEqual(ctx.hardSpawnCap, null);
  assert.strictEqual(ctx.spawnState.phase, 'RUNTIME');
  assert.strictEqual(ctx.spawningConfig.disableRuntimeSpawn, false);
  assert.strictEqual(ctx.spawningConfig.targetPopulation, 120);
  assert.ok(ctx.spawningConfig.maxNodesTarget > 15);
  assert.strictEqual(ctx.spawnGrowthState.lastTimeSpawnAt, 123456);
  assert.strictEqual(ctx.spawnGrowthState.linkSpawnMilestone, 0);
});

test('NodeSpatialIndex repairs malformed spatial sphere data during runtime insert', () => {
  const index = new NodeSpatialIndex({ worldSize: 200 });
  const obj = {
    userData: { _spatialSphere: {} },
    geometry: {
      boundingSphere: { radius: 2 },
      computeBoundingSphere() {}
    },
    updateMatrixWorld() {},
    getWorldPosition(target) {
      return target.set(4, 5, 6);
    },
    getWorldScale(target) {
      return target.set(2, 1, 1);
    }
  };

  const inserted = index.insert(obj);

  assert.strictEqual(inserted, true);
  assert.strictEqual(index.size(), 1);
  assert.strictEqual(typeof obj.userData._spatialSphere.radius, 'number');
  assert.strictEqual(obj.userData._spatialSphere.radius, 4);
  assert.strictEqual(obj.userData._spatialSphere.center.x, 4);
  assert.strictEqual(obj.userData._spatialSphere.center.y, 5);
  assert.strictEqual(obj.userData._spatialSphere.center.z, 6);
});

test('link-created growth notification no longer hides behind currentTier gating', () => {
  const source = fs.readFileSync(new URL('../NodeLinkingSystem.js', import.meta.url), 'utf8');
  assert(source.includes('this.aiNodes.maybeSpawnNodeFromLinkCreation({'));
  assert(!source.includes('this.aiNodes?.maybeSpawnNodeFromLinkCreation && currentTier >= 1'));
  assert(source.includes('linkTier: currentTier'));
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
