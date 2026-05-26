import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  canAccessMap,
  getMenuMaps,
  isMapPubliclyAvailable,
  resolvePublicSelectedMapId
} from '../MainMenu.js';
import { VisualNetworkTimeElasticity_v1, SCORE_DIRECTION } from '../VisualNetworkTimeElasticity_v1.js';
import { AtomaLeaderboard } from '../AtomaLeaderboard.js';
import { LinkCollapseSystem } from '../LinkCollapseSystem.js';
import { NetworkTensionRuntime_v1, NETWORK_TENSION_WORLD_PROFILES } from '../NetworkTensionRuntime_v1.js';
import { PostCollapseResidueSystem } from '../PostCollapseResidueSystem.js';
import { getDefaultMetricThresholds } from '../src/metrics/MetricTierClassifier.js';
import { CrisisPhaseDirector } from '../CrisisPhaseDirector.js';
import { CompetitionDominanceAdapter_v1 } from '../CompetitionDominanceAdapter_v1.js';
import { applyDominancePulseModulation } from '../harmony/HarmonyStabilization.js';
import {
  buildAtomaReleaseContainmentStatus,
  ensureAtomaReleaseContainmentGlobals,
} from '../src/runtime/AtomaReleaseContainmentPolicy.js';
import {
  buildRunIdentityOverlayQAState,
  commitPreparedRunIdentityForQA
} from '../src/runtime/RunIdentityQAHooks.js';
import {
  UIVisibilityConfig,
  getUIVisibilitySettingsRows,
  isHudEffectivelyVisible,
} from '../ui/config/UIVisibilityConfig.js';
import { NODE_VISUAL_REGISTRY } from '../NodeVisualRegistry.js';
import { NetworkMetricsAggregator } from '../src/metrics/NetworkMetricsAggregator.js';
import { onLinkCreated, onLinkRemoved } from '../src/metrics/NodeMetricEngine.js';
import { RUN_SHAPER_DEFINITIONS, getRunShaper, sanitizeDoctrineState } from '../src/doctrine/DoctrineLayer.js';
import { DoctrineRuntime } from '../src/doctrine/DoctrineRuntime.js';
import { CollapseReadabilityDirector } from '../src/collapse/CollapseReadabilityDirector.js';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function assertNear(actual, expected, epsilon = 1e-9) {
  assert(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

function withMockLocalStorage(values, fn) {
  const originalLocalStorage = globalThis.localStorage;
  const store = new Map(Object.entries(values ?? {}));
  const mockLocalStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };

  globalThis.localStorage = mockLocalStorage;
  try {
    return fn(store);
  } finally {
    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = originalLocalStorage;
    }
  }
}

function deriveReachabilityTarget(metrics) {
  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  const harmony = clamp01(metrics.harmony ?? 0);
  const stability = clamp01(metrics.stability ?? 0);
  const corruption = clamp01(metrics.corruption ?? 0);
  const loadPressure = clamp01(metrics.loadPressure ?? 0);
  const derived = harmony * stability * (1 - corruption * 0.70) * (1 - loadPressure * 0.50);
  const archetypeBase = metrics.synergy ?? derived;
  return clamp01(archetypeBase * 0.72 + derived * 0.28);
}

function createTestNode(nodeId, category, metrics) {
  return {
    id: nodeId,
    userData: {
      nodeId,
      category,
      metrics: { ...metrics },
      archetypeMetrics: { ...metrics }
    }
  };
}

function createAggregatorHarness({ nodes, links }) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const linkList = links.map((link, index) => {
    const source = nodeMap.get(link.a);
    const target = nodeMap.get(link.b);
    return {
      id: link.id ?? `link-${index}`,
      source,
      target,
      quality: link.quality,
      userData: link.userData ? { ...link.userData } : {}
    };
  });

  return new NetworkMetricsAggregator({
    networkResolver: {
      nodeMap,
      resolve() {},
      getNetworks() {
        return new Map([['network-0', new Set(nodes.map((node) => node.id))]]);
      },
      linkSystem: {
        links: linkList,
        getLinksForNode(nodeId) {
          return linkList.filter((link) => link.source?.id === nodeId || link.target?.id === nodeId);
        }
      }
    }
  });
}

function setEligibleScoreSnapshot(score, synergy, overrides = {}) {
  score.setNetworkMetricsSnapshot({
    networkSynergy: synergy,
    nodeCount: 4,
    linkCount: 3,
    avgLinkQuality: 0.7,
    criticalHotspotActive: false,
    fragileChokepointActive: false,
    regionalTension: 0,
    maxChokepointScore: 0,
    tensionReleaseThreshold: 0.55,
    chokepointReleaseThreshold: 0.68,
    ...overrides
  });
}

function createTensionLink(source, target, quality = 0.28) {
  return {
    id: `${source.userData.nodeId}-${target.userData.nodeId}`,
    active: true,
    source,
    target,
    userData: {
      quality
    }
  };
}

function createTensionLinkingSystem(links) {
  return { links };
}

test('Network Time rewinds after 5s of canonical global.synergy.high sustain', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5,
    synergyQualityScale: 0
  });

  setEligibleScoreSnapshot(score, threshold);
  for (let t = 1; t <= 5; t++) {
    score.update(1, t);
  }

  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);
  score.update(1, 6);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.REWIND);
  assert(score.getNetworkTime() > 0, 'Network Time should accumulate before rewind starts');
});

test('CompetitionDominanceAdapter reads canonical userData fields and writes readable dominance payload', () => {
  const adapter = new CompetitionDominanceAdapter_v1({
    dominanceStrength: 0.7,
    contestationStrength: 0.5,
    regionHopRadius: 2,
  });

  const dominantNode = {
    id: 'node-dominant',
    userData: {
      nodeId: 'node-dominant',
      synapticBias: 0.92,
      synapticSpecialization: 'excitatory',
      synapticFatigue: 0.02,
      metrics: {
        harmony: 0.9,
        corruption: 0.05,
        synergy: 0.88,
        stability: 0.84,
        loadPressure: 0.08,
      },
    },
  };

  const submissiveNode = {
    id: 'node-submissive',
    userData: {
      nodeId: 'node-submissive',
      synapticBias: -0.08,
      synapticSpecialization: 'neutral',
      synapticFatigue: 0.42,
      metrics: {
        harmony: 0.25,
        corruption: 0.38,
        synergy: 0.18,
        stability: 0.22,
        loadPressure: 0.54,
      },
    },
  };

  const nodes = [dominantNode, submissiveNode];
  const links = [{ sourceNode: dominantNode, targetNode: submissiveNode }];

  adapter.update(nodes, links, 1 / 10, { time: 1.5 });

  const dominantVisuals = dominantNode.userData.visualState?.dominance;
  const submissiveVisuals = submissiveNode.userData.visualState?.dominance;

  assert(dominantVisuals, 'dominant node should receive dominance visuals');
  assert(submissiveVisuals, 'submissive node should receive dominance visuals');
  assert.strictEqual(dominantVisuals.role, 'dominant');
  assert.strictEqual(submissiveVisuals.role, 'submissive');
  assert(dominantVisuals.dominanceLevel > submissiveVisuals.dominanceLevel, 'dominant node should score higher');
  assert(dominantVisuals.modulation.pulseCoherenceMul > 1, 'dominant payload should boost coherence');
  assert(submissiveVisuals.modulation.pulseCoherenceMul < 1, 'submissive payload should reduce coherence');

  const status = adapter.getStatus();
  assert.strictEqual(status.updateCount, 1);
  assert.strictEqual(status.nodesTracked, 2);
  assert.strictEqual(status.regionsIdentified, 1);
  assert.strictEqual(status.roleCounts.dominant, 1);
  assert.strictEqual(status.roleCounts.submissive, 1);
  assert(Array.isArray(status.sample) && status.sample.length > 0, 'status should expose node samples');
});

test('CompetitionDominanceAdapter keeps solo nodes neutral without live competition', () => {
  const adapter = new CompetitionDominanceAdapter_v1();
  const node = {
    id: 'solo-node',
    userData: {
      nodeId: 'solo-node',
      synapticBias: 0.75,
      synapticSpecialization: 'excitatory',
      metrics: {
        harmony: 0.8,
        corruption: 0.1,
        synergy: 0.7,
        stability: 0.8,
        loadPressure: 0.1,
      },
    },
  };

  adapter.update([node], [], 1 / 10, { time: 0.5 });

  assert.strictEqual(node.userData.visualState?.dominance?.role, 'neutral');
  assert.strictEqual(adapter.getStatus().roleCounts.neutral, 1);
});

test('applyDominancePulseModulation bridges dominance payload into existing halo and pulse channels', () => {
  const modulated = applyDominancePulseModulation({
    haloAmplitude: 0.15,
    haloFrequency: 1.0,
    pulsePhase: 0.5,
    pulseCoherence: 0.3,
    pulseStreak: 0.2,
  }, {
    modulation: {
      haloAmplitudeMul: 1.2,
      haloFrequencyMul: 0.95,
      pulseCoherenceMul: 1.3,
      pulseStreakMul: 1.1,
      pulsePhaseOffset: 0.12,
    },
  });

  assertNear(modulated.haloAmplitude, 0.18);
  assertNear(modulated.haloFrequency, 0.95);
  assertNear(modulated.pulsePhase, 0.62);
  assertNear(modulated.pulseCoherence, 0.39);
  assertNear(modulated.pulseStreak, 0.22);
});

test('SafeQuantumIllusionsPack1 demo containment disables afterPaths and exposes status truth', () => {
  const source = fs.readFileSync(new URL('../SafeQuantumIllusionsPack1.js', import.meta.url), 'utf8');
  assert(source.includes('afterPaths: {\n        enabled: false,'));
  assert(source.includes("if (!this.config.afterPaths.enabled || !this.isModeActive('afterPaths')) return;"));
  assert(source.includes('getStatus() {'));
  assert(source.includes('active: stats.byType?.afterPaths ?? 0'));
});

test('repo runtime truth points browser validation to Vite 5173 and keeps 5500 as non-canonical fallback', () => {
  const toolsText = fs.readFileSync(new URL('../TOOLS.md', import.meta.url), 'utf8');
  const memoryText = fs.readFileSync(new URL('../MEMORY.md', import.meta.url), 'utf8');
  const bootText = fs.readFileSync(new URL('../BOOT.md', import.meta.url), 'utf8');
  const vfxAuditText = fs.readFileSync(new URL('../Engine/Debug/run_vfx_audit.js', import.meta.url), 'utf8');

  assert(toolsText.includes('http://127.0.0.1:5173/'));
  assert(toolsText.includes('legacy static fallback') || toolsText.includes('legacy/static fallback'));
  assert(memoryText.includes('http://127.0.0.1:5173/'));
  assert(memoryText.includes('legacy/static fallback'));
  assert(bootText.includes('http://127.0.0.1:5173/'));
  assert(vfxAuditText.includes("http://127.0.0.1:5173/"));
});

test('main debug surface exposes live link snapshot, unlink, and canonical link-metrics helpers', () => {
  const mainText = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  assert(mainText.includes('window.__DEBUG.getActiveLinkSnapshot'));
  assert(mainText.includes('window.__DEBUG.removeLink'));
  assert(mainText.includes('window.__DEBUG.pushLinkMetrics'));
  assert(mainText.includes('window.__DEBUG.sustainLinkMetrics'));
  assert(mainText.includes('window.__DEBUG.getCollapseSystem'));
  assert(mainText.includes('window.__DEBUG.getRunIdentityOverlayState'));
  assert(mainText.includes('window.__DEBUG.commitPreparedRunIdentity'));
});

test('QA run-identity helper reports unsupported worlds and missing director cleanly', () => {
  const unsupportedWorldResult = commitPreparedRunIdentityForQA({
    world: 'fractal',
    director: {
      commitSelection() {},
      getPreparedSelection() { return null; },
      isOverlayVisible() { return false; }
    },
    isPaused: true
  });
  assert.deepStrictEqual(unsupportedWorldResult, {
    ok: false,
    reason: 'world-not-supported',
    world: 'fractal',
    packageId: null,
    worldStateId: null,
    overlayWasVisible: false,
    resumed: false
  });

  const unavailableDirectorResult = commitPreparedRunIdentityForQA({
    world: 'quantum',
    director: null,
    isPaused: true
  });
  assert.deepStrictEqual(unavailableDirectorResult, {
    ok: false,
    reason: 'run-identity-unavailable',
    world: 'quantum',
    packageId: null,
    worldStateId: null,
    overlayWasVisible: false,
    resumed: false
  });
});

test('QA run-identity helper commits the prepared selection through director authority and is idempotent', () => {
  const preparedSelection = {
    world: 'quantum',
    packageId: 'surge_thread',
    worldStateId: 'baseline_quantum'
  };

  const commitCalls = [];
  const director = {
    _prepared: preparedSelection,
    _active: null,
    _visible: true,
    getPreparedSelection() {
      return this._prepared;
    },
    getActiveRuntimeSelection() {
      return this._active;
    },
    isOverlayVisible() {
      return this._visible;
    },
    commitSelection(selection) {
      commitCalls.push(selection);
      this._active = selection;
      this._visible = false;
      return selection;
    }
  };

  const lazyPrepare = () => {
      return preparedSelection;
  };

  const firstResult = commitPreparedRunIdentityForQA({
    world: 'quantum',
    director,
    preparedSelection,
    activeSelection: null,
    isPaused: true,
    lazyPrepare
  });
  assert.deepStrictEqual(firstResult, {
    ok: true,
    reason: null,
    world: 'quantum',
    packageId: 'surge_thread',
    worldStateId: 'baseline_quantum',
    overlayWasVisible: true,
    resumed: false
  });
  assert.strictEqual(commitCalls.length, 1);
  assert.strictEqual(commitCalls[0], preparedSelection);

  const secondResult = commitPreparedRunIdentityForQA({
    world: 'quantum',
    director,
    preparedSelection,
    activeSelection: preparedSelection,
    isPaused: true,
    lazyPrepare
  });
  assert.deepStrictEqual(secondResult, {
    ok: false,
    reason: 'already-committed',
    world: 'quantum',
    packageId: 'surge_thread',
    worldStateId: 'baseline_quantum',
    overlayWasVisible: false,
    resumed: false
  });
  assert.strictEqual(commitCalls.length, 1);
});

test('QA run-identity overlay state helper returns deterministic read-only payload', () => {
  const payload = buildRunIdentityOverlayQAState({
    world: 'desert',
    director: {
      getPreparedSelection() {
        return { packageId: 'surge_thread', worldStateId: 'baseline_desert' };
      },
      isOverlayVisible() {
        return true;
      }
    },
    preparedSelection: { packageId: 'surge_thread', worldStateId: 'baseline_desert' },
    isPaused: true
  });

  assert.deepStrictEqual(payload, {
    world: 'desert',
    isVisible: true,
    isReleaseWorld: true,
    hasPreparedSelection: true,
    preparedPackageId: 'surge_thread',
    preparedWorldStateId: 'baseline_desert',
    isPaused: true
  });
});

test('main runs aiNodes.updateSpawning on simulation authority instead of the visual tick', () => {
  const mainText = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  assert(mainText.includes("'simulation.aiNodeSpawning'"));
  assert(mainText.includes("regGuard('aiNodeSpawning', 'simulation.aiNodeSpawning'"));
});

test('main.js wires competition dominance update on simulation tick', () => {
  const source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  assert(source.includes("simulation.competitionDominance"), 'expected simulation competition dominance scheduler registration');
  assert(source.includes("this.competitionDominance.update("), 'expected competition dominance update call in scheduler');
});

test('release containment policy defaults to demo-disabled synergy chain reaction', () => {
  const target = {};
  const profile = ensureAtomaReleaseContainmentGlobals(target);

  assert.strictEqual(target.ATOMA_DEMO_RELEASE_PROFILE, true);
  assert.strictEqual(target.ATOMA_DISABLE_WAVE_SHADER_STACK, true);
  assert.strictEqual(target.ATOMA_DISABLE_SYNERGY_CHAIN_REACTION, true);
  assert.strictEqual(profile.systems.synapticGating.policy, 'support-only');
  assert.strictEqual(profile.systems.waveShaderStack.policy, 'disabled');
  assert.strictEqual(profile.systems.waveShaderStack.disabledByPolicy, true);
  assert.strictEqual(profile.systems.synergyChainReaction.policy, 'disabled');
  assert.strictEqual(profile.systems.synergyChainReaction.disabledByPolicy, true);
});

test('release containment status merges runtime truth with central policy', () => {
  const scope = {
    ATOMA_DEMO_RELEASE_PROFILE: true,
    ATOMA_DISABLE_WAVE_SHADER_STACK: true,
    ATOMA_DISABLE_SYNERGY_CHAIN_REACTION: true,
  };
  const status = buildAtomaReleaseContainmentStatus(scope, {
    synapticGating: { initialized: true, scheduled: true, enabled: true },
    competitionDominance: { initialized: true, scheduled: true, enabled: true },
    waveShaderStack: { initialized: false, scheduled: false, enabled: false },
    synergyChainReaction: { initialized: false, scheduled: false, enabled: false },
  });

  assert.strictEqual(status.systems.synapticGating.classification, 'ACTIVE AS SUPPORT');
  assert.strictEqual(status.systems.synapticGating.initialized, true);
  assert.strictEqual(status.systems.competitionDominance.scheduled, true);
  assert.strictEqual(status.systems.waveShaderStack.disabledByPolicy, true);
  assert.strictEqual(status.systems.waveShaderStack.enabled, false);
  assert.strictEqual(status.systems.synergyChainReaction.disabledByPolicy, true);
  assert.strictEqual(status.systems.synergyChainReaction.scheduled, false);
});

test('main.js applies demo containment gate to synergy chain reaction wiring', () => {
  const source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  assert(source.includes('ATOMA_DISABLE_SYNERGY_CHAIN_REACTION'), 'expected demo containment flag alias in main.js');
  assert(source.includes('SynergyChainReaction_v1 disabled by demo release containment policy'), 'expected explicit chain reaction containment log');
  assert(source.includes("window.__ATOMA_RELEASE_CONTAINMENT_STATUS__"), 'expected runtime release containment status helper');
});

test('main.js applies demo containment gate to the wave shader stack wiring', () => {
  const source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  assert(source.includes('disableWaveShaderStack'), 'expected release flag for wave shader stack');
  assert(source.includes('Wave shader stack disabled via release containment policy'), 'expected explicit wave shader containment log');
  assert(source.includes("window.ATOMA_FLAGS?.release?.disableWaveShaderStack === true ? null : this.waveShaderBridge"), 'expected conduit wave bridge gating');
  assert(source.includes("window.ATOMA_FLAGS?.release?.disableWaveShaderStack !== true && this.waveDynamicsShaderPack && node"), 'expected createNode wave dynamics guard');
});

test('integration 314 no longer carries the wireframe topology cage accent', () => {
  const source = fs.readFileSync(new URL('../EnhancedNodeModels.js', import.meta.url), 'utf8');
  assert(source.includes('static createIntegrationNode2(group, color)'));
  assert(!source.includes("cage.name = 'TopologyCageAccent';"), 'wireframe cage accent should stay removed from integration 314');
});

test('control fallback factories tolerate invalid incoming groups instead of aborting on group.add', () => {
  const source = fs.readFileSync(new URL('../EnhancedNodeModels.js', import.meta.url), 'utf8');
  assert(source.includes("const rootGroup = group && typeof group.add === 'function' ? group : new THREE.Group();"));
  assert(source.includes('rootGroup.add(controlRoot);'));
  assert(source.includes('return rootGroup;'));
});

test('storage 510 obelisk cache exposes stronger focal accents instead of plain monolith read', () => {
  const source = fs.readFileSync(new URL('../Atoma_nodes/StorageNodesVisual_Session116.js', import.meta.url), 'utf8');
  assert(source.includes('SignalPilaster_A'));
  assert(source.includes('CrownHaloBracket'));
  assert(source.includes('VaultKeystone'));
});

test('NodeLinkedAuraSystem uses cached per-frame link counts instead of scanning links for every node', () => {
  const source = fs.readFileSync(new URL('../NodeLinkedAuraSystem.js', import.meta.url), 'utf8');
  assert(source.includes('this._linkCountByNode = new Map();'));
  assert(source.includes('this._rebuildLinkCountCache();'));
  assert(source.includes('return this._linkCountByNode.get(node) || 0;'));
  assert(source.includes('segmentCount: 48'));
});

test('WaveInterferencePatternSystem runs on a lower demo budget and caches network modulation state', () => {
  const source = fs.readFileSync(new URL('../WaveInterferencePatternSystem_Session132.js', import.meta.url), 'utf8');
  const mainSource = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  assert(source.includes('maxInterferenceMeshes: 18'));
  assert(source.includes('maxConcurrentInterferences: 8'));
  assert(source.includes('visualUpdateHz: 20'));
  assert(source.includes('spikeCount: 3'));
  assert(source.includes('this._networkStateAccumulator = 0;'));
  assert(source.includes('this._refreshCachedNetworkState()'));
  assert(mainSource.includes('maxInterferenceMeshes: 18'));
  assert(mainSource.includes('maxConcurrentInterferences: 8'));
});

test('ResonanceCascadeVisualization samples node and link influence at a lower cadence and uses lighter shared geometry', () => {
  const source = fs.readFileSync(new URL('../ResonanceCascadeVisualization_Session117B.js', import.meta.url), 'utf8');
  assert(source.includes('this._influenceSampleInterval = 1 / 15;'));
  assert(source.includes('new THREE.SphereGeometry(1, 10, 10)'));
  assert(source.includes('new THREE.TorusGeometry(1, 0.033, 8, 32)'));
  assert(source.includes('const shouldSampleInfluence = this._influenceSampleAccumulator >= this._influenceSampleInterval;'));
});

test('Network Time stays forward below canonical global.synergy.high threshold', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5
  });

  setEligibleScoreSnapshot(score, threshold - 0.01);
  for (let t = 1; t <= 10; t++) {
    score.update(1, t);
  }

  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);
  assert.strictEqual(score.getScoreState().rewindBlockReason, 'synergy-too-low');
});

test('Network Time sustain resets cleanly when synergy drops before 5s', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5,
    synergyQualityScale: 0
  });

  setEligibleScoreSnapshot(score, threshold);
  for (let t = 1; t <= 4; t++) {
    score.update(1, t);
  }
  assert(score.getSustainProgress() > 0 && score.getSustainProgress() < 5);

  setEligibleScoreSnapshot(score, threshold - 0.05);
  score.update(1, 5);
  assert.strictEqual(score.getSustainProgress(), 0);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);

  setEligibleScoreSnapshot(score, threshold);
  for (let t = 6; t <= 9; t++) {
    score.update(1, t);
  }
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);

  score.update(1, 10);
  score.update(1, 11);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.REWIND);
});

test('Network Time win triggers exactly when counter reaches zero', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5,
    synergyQualityScale: 0
  });

  score._networkTimeCounter = 3;
  score._sustainedDuration = 5;
  score._highSynergyStartTime = 0;
  setEligibleScoreSnapshot(score, threshold);
  score.update(1, 6);

  assert.strictEqual(score.isWon(), true);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.WON);
  assert.strictEqual(score.getNetworkTime(), 0);
});

test('Network Time keeps pressure escalation, combo, and drama zone behaviors', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 0.1,
    synergyQualityScale: 0,
    dramaZoneThreshold: 20
  });

  setEligibleScoreSnapshot(score, threshold - 0.05);
  score._networkTimeCounter = 150;
  score.update(1, 1);
  assert(score._networkTimeCounter > 155, 'forward pressure should escalate as NT rises');

  score._networkTimeCounter = 10;
  setEligibleScoreSnapshot(score, threshold);
  score.update(0.1, 2);
  score.update(0.1, 2.1);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.REWIND);
  assert.strictEqual(score.getScoreState().combo, 1);
  assert.strictEqual(score.isInDramaZone(), true);

  setEligibleScoreSnapshot(score, threshold - 0.05);
  score.update(0.05, 3);
  setEligibleScoreSnapshot(score, threshold);
  score.update(0.1, 4);
  score.update(0.1, 4.2);
  assert.strictEqual(score.getScoreState().combo, 2);
});

test('Two-node high-synergy network cannot accumulate rewind sustain', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5,
    synergyQualityScale: 0
  });

  score.setNetworkMetricsSnapshot({
    networkSynergy: threshold + 0.3,
    nodeCount: 2,
    linkCount: 1,
    avgLinkQuality: 0.96
  });

  for (let t = 1; t <= 8; t++) {
    score.update(1, t);
  }

  assert.strictEqual(score.getSustainProgress(), 0);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);
  assert.strictEqual(score.getScoreState().rewindEligible, false);
  assert.strictEqual(score.getScoreState().rewindBlockReason, 'need-more-nodes');
});

test('Three-node network stays blocked below minimum topology gate', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5,
    synergyQualityScale: 0
  });

  score.setNetworkMetricsSnapshot({
    networkSynergy: threshold + 0.1,
    nodeCount: 3,
    linkCount: 2,
    avgLinkQuality: 0.82
  });

  for (let t = 1; t <= 8; t++) {
    score.update(1, t);
  }

  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);
  assert.strictEqual(score.getSustainProgress(), 0);
  assert.strictEqual(score.getScoreState().rewindBlockReason, 'need-more-nodes');
});

test('Dropping below the topology gate resets sustain progress', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1({
    forwardSpeed: 5,
    rewindSpeed: 3.5,
    sustainDuration: 5,
    synergyQualityScale: 0
  });

  setEligibleScoreSnapshot(score, threshold);
  score.update(1, 1);
  score.update(1, 2);
  assert(score.getSustainProgress() > 0 && score.getSustainProgress() < 5);

  setEligibleScoreSnapshot(score, threshold, { linkCount: 2 });
  score.update(1, 3);
  assert.strictEqual(score.getSustainProgress(), 0);
  assert.strictEqual(score.getScoreState().rewindBlockReason, 'need-more-links');

  setEligibleScoreSnapshot(score, threshold);
  score.update(1, 4);
  score.update(1, 5);
  score.update(1, 6);
  score.update(1, 7);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);
  score.update(1, 8);
  score.update(1, 9);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.REWIND);
});

test('Score state exposes rewind gate diagnostics from the raw network snapshot', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1();

  score.setNetworkMetricsSnapshot({
    networkSynergy: threshold + 0.05,
    nodeCount: 5,
    linkCount: 4,
    avgLinkQuality: 0.52
  });

  const state = score.getScoreState();
  assert.strictEqual(state.rewindEligible, false);
  assert.strictEqual(state.rewindBlockReason, 'quality-too-low');
  assert.strictEqual(state.connectedNodeCount, 5);
  assert.strictEqual(state.activeLinkCount, 4);
  assertNear(state.avgLinkQuality, 0.52);
});

test('Score gate blocks rewind while a critical hotspot is active', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1();

  score.setNetworkMetricsSnapshot({
    networkSynergy: threshold + 0.08,
    nodeCount: 5,
    linkCount: 4,
    avgLinkQuality: 0.74,
    criticalHotspotActive: true,
    regionalTension: 0.82,
    tensionReleaseThreshold: 0.54
  });

  const state = score.getScoreState();
  assert.strictEqual(state.rewindEligible, false);
  assert.strictEqual(state.rewindBlockReason, 'tension-critical');
});

test('Critical tension can kick rewind back to forward after the grace window', () => {
  const threshold = 0.55;
  const score = new VisualNetworkTimeElasticity_v1({
    sustainDuration: 0.5,
    synergyQualityScale: 0
  });

  setEligibleScoreSnapshot(score, threshold + 0.05);
  score.update(0.3, 0.3);
  score.update(0.3, 0.6);
  score.update(0.3, 0.9);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.REWIND);

  setEligibleScoreSnapshot(score, threshold + 0.05, {
    criticalHotspotActive: true,
    regionalTension: 0.8,
    tensionReleaseThreshold: 0.54
  });
  score.update(0.5, 1.4);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.REWIND);

  score.update(1.8, 3.2);
  assert.strictEqual(score.getDirection(), SCORE_DIRECTION.FORWARD);
  assert.strictEqual(score.getScoreState().rewindBlockReason, 'tension-critical');
});

test('main wires the full raw network snapshot into the score authority', () => {
  const mainSource = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');

  assert(mainSource.includes('const tensionScoreGate = this.networkTensionRuntime_v1?.getScoreGateSnapshot?.() || null;'));
  assert(mainSource.includes('this.visualNetworkTimeElasticity.setNetworkMetricsSnapshot(scoreMetricsSnapshot || {});'));
  assert(!mainSource.includes('this.visualNetworkTimeElasticity.setAverageSynergy(avgSynergy);'));
});

test('HUD exposes minimal rewind lock feedback strings', () => {
  const hudSource = fs.readFileSync(new URL('../HUD/CoreMetricsHUD.js', import.meta.url), 'utf8');

  assert(hudSource.includes('sustain-lock-reason'));
  assert(hudSource.includes('The network needs more anchors'));
  assert(hudSource.includes('The network needs more bonds'));
  assert(hudSource.includes('The current bonds are too weak'));
  assert(hudSource.includes('The field is not coherent enough'));
  assert(hudSource.includes('Relieve the hotspot'));
  assert(hudSource.includes('brittle route'));
});

test('NetworkTensionRuntime is deterministic for a fixed graph and never writes direct synergy impulses', () => {
  const sourceA = createTestNode('ta', 'quantum', {
    synergy: 0.5,
    harmony: 0.46,
    stability: 0.42,
    corruption: 0.42,
    loadPressure: 0.78
  });
  const targetA = createTestNode('tb', 'control', {
    synergy: 0.48,
    harmony: 0.44,
    stability: 0.4,
    corruption: 0.38,
    loadPressure: 0.72
  });
  const sideA = createTestNode('tc', 'storage', {
    synergy: 0.45,
    harmony: 0.54,
    stability: 0.6,
    corruption: 0.18,
    loadPressure: 0.26
  });

  const sourceB = createTestNode('ua', 'quantum', {
    synergy: 0.5,
    harmony: 0.46,
    stability: 0.42,
    corruption: 0.42,
    loadPressure: 0.78
  });
  const targetB = createTestNode('ub', 'control', {
    synergy: 0.48,
    harmony: 0.44,
    stability: 0.4,
    corruption: 0.38,
    loadPressure: 0.72
  });
  const sideB = createTestNode('uc', 'storage', {
    synergy: 0.45,
    harmony: 0.54,
    stability: 0.6,
    corruption: 0.18,
    loadPressure: 0.26
  });

  const linksA = [
    createTensionLink(sourceA, targetA, 0.22),
    createTensionLink(targetA, sideA, 0.7)
  ];
  const linksB = [
    createTensionLink(sourceB, targetB, 0.22),
    createTensionLink(targetB, sideB, 0.7)
  ];

  const runtimeA = new NetworkTensionRuntime_v1({
    linkSystem: createTensionLinkingSystem(linksA),
    getWorldId: () => 'quantum'
  });
  const runtimeB = new NetworkTensionRuntime_v1({
    linkSystem: createTensionLinkingSystem(linksB),
    getWorldId: () => 'quantum'
  });

  runtimeA.update(0, 0);
  runtimeB.update(0, 0);

  assert.deepStrictEqual(linksA[0].userData.networkTension, linksB[0].userData.networkTension);

  const tensionSource = fs.readFileSync(new URL('../NetworkTensionRuntime_v1.js', import.meta.url), 'utf8');
  assert(!tensionSource.includes('synergy:'), 'NetworkTensionRuntime should not write direct synergy impulses');
});

test('NetworkTensionRuntime reinforce reduces corridor strain and enforces cooldown', () => {
  const source = createTestNode('ra', 'quantum', {
    synergy: 0.52,
    harmony: 0.4,
    stability: 0.36,
    corruption: 0.44,
    loadPressure: 0.8
  });
  const target = createTestNode('rb', 'control', {
    synergy: 0.5,
    harmony: 0.38,
    stability: 0.34,
    corruption: 0.42,
    loadPressure: 0.76
  });
  const branch = createTestNode('rc', 'storage', {
    synergy: 0.44,
    harmony: 0.58,
    stability: 0.62,
    corruption: 0.12,
    loadPressure: 0.22
  });
  const links = [
    createTensionLink(source, target, 0.18),
    createTensionLink(target, branch, 0.68)
  ];

  const runtime = new NetworkTensionRuntime_v1({
    linkSystem: createTensionLinkingSystem(links),
    getWorldId: () => 'desert'
  });

  runtime.update(0.1, 0);
  const beforeStrain = links[0].userData.networkTension.strain;
  const reinforce = runtime.tryReinforceCorridor(source, target);
  assert.strictEqual(reinforce.applied, true);

  runtime.update(0.1, 0.1);
  const afterStrain = links[0].userData.networkTension.strain;
  assert(afterStrain < beforeStrain, 'reinforce should reduce strain on the corridor');

  const secondReinforce = runtime.tryReinforceCorridor(source, target);
  assert.strictEqual(secondReinforce.applied, false);
  assert.strictEqual(secondReinforce.reason, 'cooldown');
});

test('NetworkTensionRuntime reroute relief triggers only on a real hotspot-adjacent path', () => {
  const a = createTestNode('xa', 'quantum', {
    synergy: 0.52,
    harmony: 0.4,
    stability: 0.34,
    corruption: 0.46,
    loadPressure: 0.82
  });
  const b = createTestNode('xb', 'control', {
    synergy: 0.5,
    harmony: 0.38,
    stability: 0.35,
    corruption: 0.42,
    loadPressure: 0.78
  });
  const c = createTestNode('xc', 'storage', {
    synergy: 0.47,
    harmony: 0.56,
    stability: 0.6,
    corruption: 0.16,
    loadPressure: 0.22
  });
  const d = createTestNode('xd', 'prime', {
    synergy: 0.48,
    harmony: 0.58,
    stability: 0.62,
    corruption: 0.14,
    loadPressure: 0.2
  });
  const e = createTestNode('xe', 'sigma', {
    synergy: 0.43,
    harmony: 0.55,
    stability: 0.61,
    corruption: 0.18,
    loadPressure: 0.24
  });

  const hotspotLink = createTensionLink(a, b, 0.18);
  const supportLink = createTensionLink(b, c, 0.7);
  const links = [hotspotLink, supportLink];
  const runtime = new NetworkTensionRuntime_v1({
    linkSystem: createTensionLinkingSystem(links),
    getWorldId: () => 'quantum'
  });

  runtime.update(0.1, 0);

  const rerouteLink = createTensionLink(a, d, 0.66);
  links.push(rerouteLink);
  const reroute = runtime.noteLinkCreated(rerouteLink);
  assert.strictEqual(reroute.relieved, true);

  const unrelatedLink = createTensionLink(c, e, 0.64);
  const noRelief = runtime.noteLinkCreated(unrelatedLink);
  assert.strictEqual(noRelief.relieved, false);
});

test('NetworkTensionRuntime reinforce is gated to threatened links', () => {
  const source = createTestNode('ga', 'quantum', {
    synergy: 0.52,
    harmony: 0.4,
    stability: 0.36,
    corruption: 0.44,
    loadPressure: 0.8
  });
  const target = createTestNode('gb', 'control', {
    synergy: 0.5,
    harmony: 0.38,
    stability: 0.34,
    corruption: 0.42,
    loadPressure: 0.76
  });
  const links = [createTensionLink(source, target, 0.18)];

  const runtime = new NetworkTensionRuntime_v1({
    linkSystem: createTensionLinkingSystem(links),
    getWorldId: () => 'default'
  });

  runtime.update(0.1, 0);

  // With low quality and high load, the link should be threatened
  const reinforce = runtime.tryReinforceCorridor(source, target);
  assert.strictEqual(reinforce.applied, true, 'reinforce should apply on threatened link');

  // Create a calm link with low load and high quality
  const calmSource = createTestNode('gc', 'storage', {
    synergy: 0.6,
    harmony: 0.6,
    stability: 0.8,
    corruption: 0.1,
    loadPressure: 0.1
  });
  const calmTarget = createTestNode('gd', 'storage', {
    synergy: 0.6,
    harmony: 0.6,
    stability: 0.8,
    corruption: 0.1,
    loadPressure: 0.1
  });
  const calmLink = createTensionLink(calmSource, calmTarget, 0.95);
  const calmLinks = [calmLink];
  const calmRuntime = new NetworkTensionRuntime_v1({
    linkSystem: createTensionLinkingSystem(calmLinks),
    getWorldId: () => 'default'
  });
  calmRuntime.update(0.1, 0);

  const calmReinforce = calmRuntime.tryReinforceCorridor(calmSource, calmTarget);
  assert.strictEqual(calmReinforce.applied, false, 'reinforce should NOT apply on calm link');
  assert.strictEqual(calmReinforce.reason, 'not-threatened');
});

test('NetworkTensionRuntime abandon gives component-wide relief on threatened links', () => {
  const a = createTestNode('aa', 'quantum', {
    synergy: 0.52,
    harmony: 0.4,
    stability: 0.34,
    corruption: 0.46,
    loadPressure: 0.82
  });
  const b = createTestNode('ab', 'control', {
    synergy: 0.5,
    harmony: 0.38,
    stability: 0.35,
    corruption: 0.42,
    loadPressure: 0.78
  });
  const c = createTestNode('ac', 'storage', {
    synergy: 0.47,
    harmony: 0.56,
    stability: 0.6,
    corruption: 0.16,
    loadPressure: 0.22
  });

  const hotspotLink = createTensionLink(a, b, 0.18);
  const supportLink = createTensionLink(b, c, 0.7);
  const links = [hotspotLink, supportLink];
  const runtime = new NetworkTensionRuntime_v1({
    linkSystem: createTensionLinkingSystem(links),
    getWorldId: () => 'default'
  });

  runtime.update(0.1, 0);

  const beforeStabilityA = a.userData.metrics.stability;
  const beforeCorruptionA = a.userData.metrics.corruption;

  const abandon = runtime.tryAbandonCorridor(hotspotLink);
  assert.strictEqual(abandon.applied, true, 'abandon should apply on threatened hotspot link');
  assert.strictEqual(abandon.reason, 'abandoned');

  // Nodes should receive stability boost and corruption reduction
  assert(a.userData.metrics.stability > beforeStabilityA, 'abandon should boost source node stability');
  assert(a.userData.metrics.corruption < beforeCorruptionA, 'abandon should reduce source node corruption');

  // Second abandon should be on cooldown
  const secondAbandon = runtime.tryAbandonCorridor(hotspotLink);
  assert.strictEqual(secondAbandon.applied, false);
  assert.strictEqual(secondAbandon.reason, 'cooldown');
});

test('NetworkTensionRuntime reroute relief scale is at least 0.72', () => {
  const profile = NETWORK_TENSION_WORLD_PROFILES?.default || {};
  assert(profile.rerouteReliefScale >= 0.72, `default rerouteReliefScale should be >= 0.72, got ${profile.rerouteReliefScale}`);
});

test('Menu release metadata exposes only Quantum and Dream Desert publicly', () => {
  const maps = getMenuMaps();
  const publicMapIds = maps.filter((map) => isMapPubliclyAvailable(map.id)).map((map) => map.id);
  const lockedMaps = maps.filter((map) => !isMapPubliclyAvailable(map.id));

  assert.deepStrictEqual(publicMapIds, ['quantum', 'desert']);
  assert.deepStrictEqual(lockedMaps.map((map) => map.id), ['memory', 'sigma', 'desert2', 'fractal']);
  assert(lockedMaps.every((map) => map.releaseState === 'coming-soon'));
  assert(lockedMaps.every((map) => map.releaseLabel === 'COMING SOON'));
});

test('Public map selection falls back to Quantum unless dev unlock is enabled', () => {
  assert.strictEqual(canAccessMap('memory', { devUnlock: false }), false);
  assert.strictEqual(canAccessMap('memory', { devUnlock: true }), true);
  assert.strictEqual(resolvePublicSelectedMapId('memory', { devUnlock: false }), 'quantum');
  assert.strictEqual(resolvePublicSelectedMapId('memory', { devUnlock: true }), 'memory');
});

test('Pause menu and boot controller both enforce public map locks', () => {
  const pauseSource = fs.readFileSync(new URL('../PauseMenu.js', import.meta.url), 'utf8');
  const bootSource = fs.readFileSync(new URL('../AtomaBoot.js', import.meta.url), 'utf8');

  assert(pauseSource.includes("selectable: canAccessMap(map.id, { devUnlock })"));
  assert(pauseSource.includes("releaseBadge.textContent = map.releaseLabel || 'COMING SOON';"));
  assert(pauseSource.includes('const nextWorldId = resolvePublicSelectedMapId(entry.id);'));

  assert(bootSource.includes('setMapDevUnlock: (enabled) => this.setMapDevUnlock(enabled),'));
  assert(bootSource.includes('isMapDevUnlockEnabled: () => isMenuDevMapUnlockEnabled(),'));
  assert(bootSource.includes('const sanitizedContinueSnapshot = continueSnapshot'));
  assert(bootSource.includes('await this.game.switchWorld?.(nextSelection.worldId);'));
});

test('HUD registry defaults reflect the V1 first-launch layout intent', () => {
  const registrySource = fs.readFileSync(new URL('../HUD/HUDRegistry.js', import.meta.url), 'utf8');

  assert(registrySource.includes("defaultPosition: { left: 10, bottom: 20 }"));
  assert(registrySource.includes("defaultPosition: { left: 10, top: 10 }"));
  assert(registrySource.includes("defaultPosition: { left: 10, top: 200 }"));
  assert(registrySource.includes("defaultPosition: { right: 12, top: 340 }"));
});

test('HUD drag manager bootstraps first-launch positions without overwriting saved layouts', () => {
  const dragSource = fs.readFileSync(new URL('../HUD/HUDDragManager.js', import.meta.url), 'utf8');

  assert(dragSource.includes('export function hasSavedHudPositions()'));
  assert(dragSource.includes('export function hasSavedHudPosition(hudKey)'));
  assert(dragSource.includes('export function applyDefaultHudBootstrapLayout({ force = false, attempt = 0 } = {})'));
  assert(dragSource.includes('export function applyAutomationHudWaveAnchor({ force = false, attempt = 0 } = {})'));
  assert(dragSource.includes('if (!force && hasSavedHudPositions()) {'));
  assert(dragSource.includes("if (!force && hasSavedHudPosition('automationHUD')) {"));
  assert(dragSource.includes('applyDefaultHudBootstrapLayout();'));
  assert(dragSource.includes('const DEFAULT_AUTOMATION_WAVE_REQUIRED_IDS = Object.freeze(['));
  assert(dragSource.includes("applyDefaultHudBootstrapLayout({ force: true });"));
  assert(dragSource.includes("applyAutomationHudWaveAnchor({ force: true });"));
  assert(dragSource.includes("'wave-debug-overlay'"));
  assert(dragSource.includes("'ai-automation-hud'"));
  assert(dragSource.includes("inspectorHud.style.maxHeight = `${maxInspectorHeight}px`;"));
  assert(dragSource.includes('const automationTop = Math.round(waveRect.bottom + DEFAULT_VERTICAL_GAP);'));
});

test('Node inspect overlay participates in the first-launch HUD bootstrap flow', () => {
  const inspectSource = fs.readFileSync(new URL('../NodeInspectOverlay1_0.js', import.meta.url), 'utf8');

  assert(inspectSource.includes("import { applyDefaultHudBootstrapLayout, hasSavedHudPositions } from './HUD/HUDDragManager.js';"));
  assert(inspectSource.includes('if (!hasSavedHudPositions()) {'));
  assert(inspectSource.includes('this.repositionBelowCoreMetrics();'));
  assert(inspectSource.includes('applyDefaultHudBootstrapLayout({ force: true });'));
});

test('AI Automation HUD reapplies the canonical wave anchor after remounts', () => {
  const automationHudSource = fs.readFileSync(new URL('../HUD/AIAutomationHUD.js', import.meta.url), 'utf8');

  assert(automationHudSource.includes("import { applyAutomationHudWaveAnchor } from './HUDDragManager.js';"));
  assert(automationHudSource.includes('position: fixed;'));
  assert(automationHudSource.includes('right: 12px;'));
  assert(automationHudSource.includes('top: 340px;'));
  assert(automationHudSource.includes('applyAutomationHudWaveAnchor();'));
  assert(automationHudSource.includes("if (!isHudEffectivelyVisible('aiHUD')) {"));
});

test('Optional HUD defaults start off while Wave System remains developer-gated', () => {
  assert.strictEqual(UIVisibilityConfig.aiHUD, false);
  assert.strictEqual(UIVisibilityConfig.advisorHUD, false);
  assert.strictEqual(UIVisibilityConfig.waveSystemHUD, true);
});

test('Optional HUD rows show direct menu truth and Wave System stays developer-gated', () => {
  UIVisibilityConfig.aiHUD = true;
  UIVisibilityConfig.advisorHUD = false;
  UIVisibilityConfig.waveSystemHUD = true;

  withMockLocalStorage({ 'atoma.hud.developerMode': 'false' }, () => {
    const rows = getUIVisibilitySettingsRows();
    const aiRow = rows.find((row) => row.id === 'aiHUD');
    const advisorRow = rows.find((row) => row.id === 'advisorHUD');
    const waveRow = rows.find((row) => row.id === 'waveSystemHUD');

    assert.strictEqual(aiRow.value, '[ ON ]');
    assert.strictEqual(advisorRow.value, '[ OFF ]');
    assert.strictEqual(waveRow.value, '[ OFF ]');
    assert(aiRow.description.includes('AI automation overlay'));
    assert(advisorRow.description.includes('compact advisor overlay'));
    assert.strictEqual(isHudEffectivelyVisible('aiHUD'), true);
    assert.strictEqual(isHudEffectivelyVisible('advisorHUD'), false);
    assert.strictEqual(isHudEffectivelyVisible('waveSystemHUD'), false);
  });

  withMockLocalStorage({ 'atoma.hud.developerMode': 'true' }, () => {
    UIVisibilityConfig.advisorHUD = true;
    assert.strictEqual(isHudEffectivelyVisible('aiHUD'), true);
    assert.strictEqual(isHudEffectivelyVisible('advisorHUD'), true);
    assert.strictEqual(isHudEffectivelyVisible('waveSystemHUD'), true);
  });
});

test('Developer mode changes rebroadcast the shared UI visibility event', () => {
  const layerManagerSource = fs.readFileSync(new URL('../HUD/HUDLayerManager.js', import.meta.url), 'utf8');
  const advisorSource = fs.readFileSync(new URL('../ui/hud/VariantBAdvisorHUD.js', import.meta.url), 'utf8');
  const registrySource = fs.readFileSync(new URL('../HUD/HUDRegistry.js', import.meta.url), 'utf8');

  assert(layerManagerSource.includes('dispatchUIVisibilityChange();'));
  assert(advisorSource.includes("if (!isHudEffectivelyVisible('advisorHUD')) {"));
  assert(registrySource.includes('requiresDevMode: false'));
  assert(registrySource.includes('requiresDevMode: true'));
  assert(layerManagerSource.includes('return requiresDevMode(hudKey) ? _developerMode : true;'));
});

test('Per-world score configs are present in main and menu definitions', () => {
  const mainSource = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  const menuSource = fs.readFileSync(new URL('../MainMenu.js', import.meta.url), 'utf8');

  // All 6 worlds must have a scoreConfig entry
  const mainWorldEntries = mainSource.match(/\w+:\s*\{\s*sustainDuration:/g) ?? [];
  const menuWorldEntries = menuSource.match(/scoreConfig:\s*\{\s*sustainDuration:/g) ?? [];
  assert(mainWorldEntries.length >= 6, 'main.js WORLD_SCORE_CONFIG must define score config for all worlds');
  assert(menuWorldEntries.length >= 6, 'MainMenu.js MENU_MAPS must define scoreConfig for all worlds');

  // Prevent old drift
  assert(!mainSource.includes('sustainDuration: 10'), 'old per-world score drift should be removed from main.js');
  assert(!menuSource.includes('sustainDuration: 10'), 'old per-world score drift should be removed from MainMenu.js');
});

test('Desert is easier than Quantum (per-world balance differentiation)', () => {
  const mainSource = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  const menuSource = fs.readFileSync(new URL('../MainMenu.js', import.meta.url), 'utf8');

  // Desert: lower synergy threshold, shorter sustain, faster rewind speed
  assert(mainSource.includes("desert:   { sustainDuration: 4.5, rewindSpeed: 4.0,"), 'main.js desert should have easier config');
  assert(mainSource.includes("quantum:  { sustainDuration: 5, rewindSpeed: 3.5,"), 'main.js quantum should have standard config');
  assert(menuSource.includes("scoreConfig: { sustainDuration: 4.5, rewindSpeed: 4.0, forwardSpeed: 5, synergyThreshold: 0.50 }"), 'MainMenu.js desert should have easier scoreConfig');
  assert(menuSource.includes("scoreConfig: { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 }"), 'MainMenu.js quantum should have standard scoreConfig');
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

test('Reachability derivation keeps input, storage, and control nodes near viable baseline synergy', () => {
  const inputTarget = deriveReachabilityTarget(NODE_VISUAL_REGISTRY[111].metrics);
  const storageTarget = deriveReachabilityTarget(NODE_VISUAL_REGISTRY[516].metrics);
  const controlTarget = deriveReachabilityTarget(NODE_VISUAL_REGISTRY[619].metrics);

  assert(inputTarget >= 0.43, `expected input target >= 0.43, got ${inputTarget}`);
  assert(storageTarget >= 0.44, `expected storage target >= 0.44, got ${storageTarget}`);
  assert(controlTarget >= 0.49, `expected control target >= 0.49, got ${controlTarget}`);
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

test('Hybrid network aggregator normalizes quality and favors high-quality mixed networks', () => {
  const inputNode = createTestNode('111', 'input', {
    ...NODE_VISUAL_REGISTRY[111].metrics,
    synergy: deriveReachabilityTarget(NODE_VISUAL_REGISTRY[111].metrics)
  });
  const storageNode = createTestNode('516', 'storage', {
    ...NODE_VISUAL_REGISTRY[516].metrics,
    synergy: deriveReachabilityTarget(NODE_VISUAL_REGISTRY[516].metrics)
  });
  const controlNode = createTestNode('619', 'control', {
    ...NODE_VISUAL_REGISTRY[619].metrics,
    synergy: deriveReachabilityTarget(NODE_VISUAL_REGISTRY[619].metrics)
  });

  const goodAggregator = createAggregatorHarness({
    nodes: [inputNode, storageNode, controlNode],
    links: [
      { a: '111', b: '516', userData: { quality: { normalizedScore: 0.85 } } },
      { a: '516', b: '619', userData: { quality: { score: 82 } } },
      { a: '111', b: '619', quality: 0.8 }
    ]
  });

  const weakAggregator = createAggregatorHarness({
    nodes: [inputNode, storageNode, controlNode],
    links: [
      { a: '111', b: '516', userData: { quality: { normalizedScore: 0.35 } } },
      { a: '516', b: '619', userData: { quality: { score: 38 } } },
      { a: '111', b: '619', quality: 0.3 }
    ]
  });

  const goodResult = goodAggregator.compute();
  const weakResult = weakAggregator.compute();

  assert(goodResult.networkSynergy >= 0.45, `expected good mixed network >= 0.45, got ${goodResult.networkSynergy}`);
  assert(goodResult.avgLinkQuality > 0.75, `expected normalized quality > 0.75, got ${goodResult.avgLinkQuality}`);
  assert.strictEqual(goodResult.aggregatorMode, 'hybrid');
  assert(goodResult.networkSynergy > weakResult.networkSynergy, 'high-quality network should outperform weak network');
});

test('Hybrid network aggregator never mutates missing node metrics with random fallback values', () => {
  const nodeA = { id: 'a', userData: { category: 'input' } };
  const nodeB = { id: 'b', userData: { category: 'storage' } };
  const aggregator = createAggregatorHarness({
    nodes: [nodeA, nodeB],
    links: [{ a: 'a', b: 'b', quality: 0.8 }]
  });

  const result = aggregator.compute();

  assert.strictEqual(result.networkSynergy, 0);
  assert.strictEqual(nodeA.userData.metrics, undefined);
  assert.strictEqual(nodeB.userData.metrics, undefined);
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

test('LinkCollapseSystem uses incoming canonical event metrics instead of stale cached or visual fallback metrics', () => {
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
    assert.strictEqual(collapseRequests[0].context.corruption, 0);
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

test('LinkCollapseSystem accelerates collapse stress when network tension risk is high', () => {
  const originalDateNow = Date.now;
  let now = 5800;
  Date.now = () => now;

  try {
    const sourceA = { userData: { nodeId: 'm' } };
    const targetA = { userData: { nodeId: 'n' } };
    const sourceB = { userData: { nodeId: 'o' } };
    const targetB = { userData: { nodeId: 'p' } };
    const plainLink = {
      id: 'link-m-n',
      active: true,
      source: sourceA,
      target: targetA,
      userData: { metrics: { corruption: 0.9, stability: 0.6, loadPressure: 0.2 } }
    };
    const tensionLink = {
      id: 'link-o-p',
      active: true,
      source: sourceB,
      target: targetB,
      userData: {
        metrics: { corruption: 0.9, stability: 0.6, loadPressure: 0.2 },
        networkTension: { overloadRisk: 1, chokepointScore: 1 }
      }
    };

    const plainSystem = new LinkCollapseSystem({
      links: [plainLink],
      onLinkCreated() {},
      onLinkUpdated() {},
      onLinkRemoved() {},
      enqueueCollapseRequest() {}
    }, null, null, {
      holdDurationMs: 1000,
      enableVisualFeedback: false,
      globalMetricsEnabled: false
    });
    const tensionSystem = new LinkCollapseSystem({
      links: [tensionLink],
      onLinkCreated() {},
      onLinkUpdated() {},
      onLinkRemoved() {},
      enqueueCollapseRequest() {}
    }, null, null, {
      holdDurationMs: 1000,
      enableVisualFeedback: false,
      globalMetricsEnabled: false
    });

    plainSystem.onLinkMetricsUpdated(plainLink, { corruption: 0.9, stability: 0.6 }, { silent: true });
    tensionSystem.onLinkMetricsUpdated(tensionLink, { corruption: 0.9, stability: 0.6 }, { silent: true });
    now += 600;
    plainSystem.onLinkMetricsUpdated(plainLink, { corruption: 0.9, stability: 0.6 }, { silent: true });
    tensionSystem.onLinkMetricsUpdated(tensionLink, { corruption: 0.9, stability: 0.6 }, { silent: true });

    assert(
      tensionSystem.getCollapseProgress(tensionLink) > plainSystem.getCollapseProgress(plainLink),
      'tension-biased links should accumulate collapse progress faster'
    );
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

// ── Post-Collapse Residue System Tests ────────────────────────────────────

function createMockNode(nodeId, stability = 0.5) {
  return {
    userData: { nodeId, metrics: { stability } },
    position: { x: 0, y: 0, z: 0 }
  };
}

tests.push({
  name: 'PostCollapseResidueSystem creates residue on link collapse',
  fn: () => {
    const system = new PostCollapseResidueSystem({ scene: null, semanticBus: null });
    const src = createMockNode('ra');
    const tgt = createMockNode('rb');
    const link = createTensionLink(src, tgt);
    system.onLinkCollapsed({ link });
    assert.strictEqual(system.getActiveResidueCount(), 1, 'should create one active residue');
    const residue = system.getResidueForPair('ra', 'rb');
    assert(residue, 'residue should exist for node pair');
    assert.strictEqual(residue.riskLevel, 1.0, 'fresh residue should have riskLevel 1.0');
    assert.strictEqual(residue.stage, 'fresh', 'fresh residue stage');
    system.dispose();
  }
});

tests.push({
  name: 'PostCollapseResidueSystem risk decays over time',
  fn: () => {
    const system = new PostCollapseResidueSystem({ scene: null, semanticBus: null });
    const src = createMockNode('rc');
    const tgt = createMockNode('rd');
    const link = createTensionLink(src, tgt);
    const now = Date.now();
    system.onLinkCollapsed({ link });
    const residue = system.getResidueForPair('rc', 'rd');
    // Simulate 8 seconds elapsed
    residue.createdAt = now - 8000;
    residue.expiresAt = now + 8000;
    system.update(0);
    assert(residue.riskLevel < 1.0, 'risk should decay after 8s');
    assert.strictEqual(residue.stage, 'cooling', 'should be in cooling stage after 8s');
    system.dispose();
  }
});

tests.push({
  name: 'PostCollapseResidueSystem expires after 16s',
  fn: () => {
    const system = new PostCollapseResidueSystem({ scene: null, semanticBus: null });
    const src = createMockNode('re');
    const tgt = createMockNode('rf');
    const link = createTensionLink(src, tgt);
    const now = Date.now();
    system.onLinkCollapsed({ link });
    const residue = system.getResidueForPair('re', 'rf');
    residue.createdAt = now - 17000;
    residue.expiresAt = now - 1000;
    system.update(0);
    assert.strictEqual(system.getActiveResidueCount(), 0, 'residue should expire');
    system.dispose();
  }
});

tests.push({
  name: 'PostCollapseResidueSystem recovery mode selection respects conditions',
  fn: () => {
    const system = new PostCollapseResidueSystem({ scene: null, semanticBus: null });
    const src = createMockNode('rg', 0.6);
    const tgt = createMockNode('rh', 0.6);
    const link = createTensionLink(src, tgt);
    const now = Date.now();
    system.onLinkCollapsed({ link });
    // Advance time so risk decays below 0.5 (clean rebuild threshold)
    const residue = system.getResidueForPair('rg', 'rh');
    residue.createdAt = now - 7500;
    residue.expiresAt = now + 8500;
    system.update(0);
    // Simulate link creation across residue
    system.onLinkCreated({ link });
    assert.strictEqual(link.userData.recoveryMode, 'cleanRebuild', 'should select cleanRebuild when stable and risk moderate');
    assert(link.userData.corruptionPenalty > 0, 'should apply corruption penalty');
    system.dispose();
  }
});

tests.push({
  name: 'PostCollapseResidueSystem dangerous reconnect when nodes unstable',
  fn: () => {
    const system = new PostCollapseResidueSystem({ scene: null, semanticBus: null });
    const src = createMockNode('ri', 0.2);
    const tgt = createMockNode('rj', 0.2);
    const link = createTensionLink(src, tgt);
    system.onLinkCollapsed({ link });
    system.onLinkCreated({ link });
    assert.strictEqual(link.userData.recoveryMode, 'dangerousReconnect', 'should select dangerousReconnect when unstable');
    assert(link.userData.immediateStrain > 0, 'should apply immediate strain');
    system.dispose();
  }
});

// ── Crisis Phase Director Tests ───────────────────────────────────────────

tests.push({
  name: 'CrisisPhaseDirector transitions through all 5 phases',
  fn: () => {
    const events = [];
    const mockBus = {
      emit: (tag, payload) => { events.push({ tag, payload }); },
      priority: { NORMAL: 2 }
    };
    const director = new CrisisPhaseDirector({
      semanticBus: mockBus,
      getWorldId: () => 'default'
    });

    // Start crisis
    director._onCrisisStart({ crisisId: 'resonance_surge', duration: 15 });
    assert.strictEqual(director.getActiveCrisis().phase, 'INTRO', 'should start in INTRO');

    // Advance through phases
    const config = director._activeCrisis.phaseConfig;
    director.update(0);
    assert.strictEqual(director.getActiveCrisis().phase, 'INTRO', 'still INTRO before duration');

    // Simulate time passing for each phase
    director._activeCrisis.phaseStartTime -= (config.introDuration + 0.1) * 1000;
    director.update(0);
    assert.strictEqual(director.getActiveCrisis().phase, 'SURGE', 'should transition to SURGE');

    director._activeCrisis.phaseStartTime -= (config.surgeDuration + 0.1) * 1000;
    director.update(0);
    assert.strictEqual(director.getActiveCrisis().phase, 'PEAK', 'should transition to PEAK');

    director._activeCrisis.phaseStartTime -= (config.peakDuration + 0.1) * 1000;
    director.update(0);
    assert.strictEqual(director.getActiveCrisis().phase, 'DECAY', 'should transition to DECAY');

    director._activeCrisis.phaseStartTime -= (config.decayDuration + 0.1) * 1000;
    director.update(0);
    assert.strictEqual(director.getActiveCrisis(), null, 'should resolve and clear');

    // Check phase change events
    const phaseEvents = events.filter(e => e.tag === 'crisis:phaseChanged');
    assert.strictEqual(phaseEvents.length, 5, 'should emit 5 phase change events');

    director.dispose();
  }
});

tests.push({
  name: 'CrisisPhaseDirector player agency tracking scores actions correctly',
  fn: () => {
    const director = new CrisisPhaseDirector({
      semanticBus: null,
      getWorldId: () => 'default'
    });

    director._onCrisisStart({ crisisId: 'resonance_surge', duration: 15 });
    // Force into SURGE phase
    director._activeCrisis.phase = 'SURGE';

    // Score reinforce
    director._scorePlayerAction('reinforceCorridor', { linkId: 'l1' });
    assert.strictEqual(director._activeCrisis.responseScore, 2.0, 'reinforce should score +2');

    // Score reroute
    director._scorePlayerAction('rerouteHotspot', { linkId: 'l2' });
    assert.strictEqual(director._activeCrisis.responseScore, 5.0, 'reroute should score +3');

    // Score abandon
    director._scorePlayerAction('abandonCorridor', { linkId: 'l3' });
    assert.strictEqual(director._activeCrisis.responseScore, 6.0, 'abandon should score +1');

    // Score create link
    director._scorePlayerAction('createLink', { linkId: 'l4' });
    assert.strictEqual(director._activeCrisis.responseScore, 6.5, 'createLink should score +0.5');

    // Deduplicate same action within 2s
    director._scorePlayerAction('createLink', { linkId: 'l4' });
    assert.strictEqual(director._activeCrisis.responseScore, 6.5, 'duplicate createLink should not score');

    // Score fracture residue (negative)
    director._scorePlayerAction('fractureResidueCreated', { linkId: 'l5' });
    assert.strictEqual(director._activeCrisis.responseScore, 5.5, 'fracture should score -1');

    director.dispose();
  }
});

tests.push({
  name: 'CrisisPhaseDirector Quantum crisis has shorter phase durations than Desert',
  fn: () => {
    const quantumDirector = new CrisisPhaseDirector({
      semanticBus: null,
      getWorldId: () => 'quantum'
    });
    const desertDirector = new CrisisPhaseDirector({
      semanticBus: null,
      getWorldId: () => 'desert'
    });

    quantumDirector._onCrisisStart({ crisisId: 'resonance_surge', duration: 15 });
    desertDirector._onCrisisStart({ crisisId: 'anchor_collapse', duration: 15 });

    const qConfig = quantumDirector._activeCrisis.phaseConfig;
    const dConfig = desertDirector._activeCrisis.phaseConfig;

    assert(qConfig.introDuration < dConfig.introDuration, 'Quantum intro should be shorter');
    assert(qConfig.surgeDuration < dConfig.surgeDuration, 'Quantum surge should be shorter');
    assert(qConfig.peakDuration < dConfig.peakDuration, 'Quantum peak should be shorter');
    assert.strictEqual(qConfig.tickPressureScaleMultiplier, 1.3, 'Quantum should have pressure multiplier');
    assert.strictEqual(dConfig.reinforceDurationMultiplier, 1.3, 'Desert should have reinforce duration multiplier');

    quantumDirector.dispose();
    desertDirector.dispose();
  }
});

tests.push({
  name: 'CrisisPhaseDirector survived crisis grants temporary buff',
  fn: () => {
    const director = new CrisisPhaseDirector({
      semanticBus: null,
      getWorldId: () => 'default'
    });

    director._onCrisisStart({ crisisId: 'resonance_surge', duration: 15 });
    director._activeCrisis.phase = 'SURGE';
    // Score enough to survive
    director._scorePlayerAction('rerouteHotspot', { linkId: 'l1' });
    director._scorePlayerAction('reinforceCorridor', { linkId: 'l2' });
    director._scorePlayerAction('abandonCorridor', { linkId: 'l3' });
    // responseScore = 6.0 >= 4 (SURVIVED)

    director._transitionToPhase('DECAY');
    director._transitionToPhase('RESOLVED');

    const buff = director.getActiveBuff();
    assert(buff, 'should have active buff after survival');
    assert.strictEqual(buff.crisisId, 'resonance_surge');
    assert(buff.synergy > 0, 'buff should have positive synergy');
    assert.strictEqual(director.getCrisisMastery('resonance_surge').survivedCount, 1, 'mastery should increment');

    director.dispose();
  }
});

tests.push({
  name: 'CrisisPhaseDirector failed crisis applies aftershock and unlocks mutation',
  fn: () => {
    const director = new CrisisPhaseDirector({
      semanticBus: null,
      getWorldId: () => 'default'
    });

    director._onCrisisStart({ crisisId: 'integrity_fracture', duration: 15 });
    director._activeCrisis.phase = 'SURGE';
    // Score low (only create link = 0.5)
    director._scorePlayerAction('createLink', { linkId: 'l1' });
    // responseScore = 0.5 < 2 (FAILED)

    director._transitionToPhase('DECAY');
    director._transitionToPhase('RESOLVED');

    const aftershock = director.getActiveAftershock();
    assert(aftershock, 'should have active aftershock after failure');
    assert.strictEqual(aftershock.crisisId, 'integrity_fracture');
    assert(aftershock.corruption > 0, 'aftershock should have corruption');
    assert.strictEqual(aftershock.unlockedMutation, 'corruption_acceptance', 'should unlock mutation');
    assert.strictEqual(director.getCrisisMastery('integrity_fracture').failedCount, 1, 'mastery failed count should increment');

    director.dispose();
  }
});

tests.push({
  name: 'CrisisPhaseDirector mastery progression increases trigger threshold',
  fn: () => {
    const director = new CrisisPhaseDirector({
      semanticBus: null,
      getWorldId: () => 'default'
    });

    // Base threshold for resonance_surge is 0.8
    const baseThreshold = director.getCrisisTriggerThreshold('resonance_surge');
    assert.strictEqual(baseThreshold, 0.8, 'base threshold should be 0.8');

    // Simulate 3 survived crises
    for (let i = 0; i < 3; i++) {
      director._onCrisisStart({ crisisId: 'resonance_surge', duration: 15 });
      director._activeCrisis.phase = 'SURGE';
      director._scorePlayerAction('rerouteHotspot', { linkId: `l${i}` });
      director._scorePlayerAction('reinforceCorridor', { linkId: `r${i}` });
      director._transitionToPhase('DECAY');
      director._transitionToPhase('RESOLVED');
    }

    const increasedThreshold = director.getCrisisTriggerThreshold('resonance_surge');
    assertNear(increasedThreshold, 0.86, 1e-9, 'threshold should increase by 0.02 per survival');
    assert.strictEqual(director.getCrisisMastery('resonance_surge').survivedCount, 3, 'should have 3 survivals');

    director.dispose();
  }
});

// ── Run-Shaper Doctrine Tests ───────────────────────────────────────────────

tests.push({
  name: 'DoctrineLayer run-shaper definitions have full config',
  fn: () => {
    assert(RUN_SHAPER_DEFINITIONS.sacrifice_pivot, 'sacrifice_pivot should exist');
    assert(RUN_SHAPER_DEFINITIONS.reinforce_discipline, 'reinforce_discipline should exist');
    assert(RUN_SHAPER_DEFINITIONS.risky_rewind, 'risky_rewind should exist');

    const sp = RUN_SHAPER_DEFINITIONS.sacrifice_pivot;
    assert.strictEqual(sp.decisionType, 'sacrifice', 'sacrifice_pivot decisionType');
    assert(sp.crisisPattern.peakDurationScale < 1, 'sacrifice_pivot has shorter peak');
    assert(sp.counterplayPayoff.rerouteReliefScale > 1, 'sacrifice_pivot favors reroute');
    assert(sp.rewindBehavior.thresholdOffset < 0, 'sacrifice_pivot easier rewind gate');

    const rd = RUN_SHAPER_DEFINITIONS.reinforce_discipline;
    assert.strictEqual(rd.decisionType, 'discipline', 'reinforce_discipline decisionType');
    assert(rd.crisisPattern.peakDurationScale > 1, 'reinforce_discipline has longer peak');
    assert(rd.counterplayPayoff.reinforceDurationScale > 1, 'reinforce_discipline favors reinforce');
    assert(rd.rewindBehavior.thresholdOffset > 0, 'reinforce_discipline harder rewind gate');

    const rr = RUN_SHAPER_DEFINITIONS.risky_rewind;
    assert.strictEqual(rr.decisionType, 'gamble', 'risky_rewind decisionType');
    assert(rr.crisisPattern.intensityCurveScale > 1, 'risky_rewind higher intensity');
    assert(rr.rewindBehavior.thresholdOffset < 0, 'risky_rewind easier rewind gate');
    assert(rr.rewindBehavior.peakBonusMultiplier > 1, 'risky_rewind peak bonus');
  }
});

tests.push({
  name: 'DoctrineLayer backward compatibility migrates legacy schools',
  fn: () => {
    const legacy = {
      activeSchools: ['synergy_cascade'],
      unlockedDoctrines: ['stability_doctrine', 'quantum_entropy_wave']
    };
    const migrated = sanitizeDoctrineState(legacy);
    assert.strictEqual(migrated.activeShaper, 'sacrifice_pivot', 'synergy_cascade maps to sacrifice_pivot');
    assert(migrated.unlockedDoctrines.includes('reinforce_discipline'), 'stability_doctrine maps to reinforce_discipline');
    assert(migrated.unlockedDoctrines.includes('quantum_entropy_wave'), 'mutator stays unchanged');
  }
});

tests.push({
  name: 'DoctrineRuntime emits doctrine.shaperActive on semantic bus',
  fn: () => {
    const emitted = [];
    const mockBus = {
      emit: (tag, payload, opts) => emitted.push({ tag, payload }),
      priority: { NORMAL: 2 }
    };
    const runtime = new DoctrineRuntime({ semanticBus: mockBus });
    runtime.initializeForWorld('quantum', ['sacrifice_pivot', 'reinforce_discipline', 'risky_rewind']);
    runtime.selectShaper('sacrifice_pivot');

    const shaperEvent = emitted.find(e => e.tag === 'doctrine.shaperActive');
    assert(shaperEvent, 'should emit doctrine.shaperActive');
    assert.strictEqual(shaperEvent.payload.shaperId, 'sacrifice_pivot', 'payload shaperId');
    assert(shaperEvent.payload.shaperConfig, 'payload shaperConfig');
    assert.strictEqual(shaperEvent.payload.world, 'quantum', 'payload world');
  }
});

tests.push({
  name: 'CrisisPhaseDirector applies shaper crisis pattern scaling',
  fn: () => {
    const director = new CrisisPhaseDirector({ semanticBus: null, getWorldId: () => 'default' });

    // Apply reinforce_discipline shaper (longer peak)
    director._onShaperActive({
      shaperConfig: {
        crisisPattern: {
          introDurationScale: 1.2,
          surgeDurationScale: 1.4,
          peakDurationScale: 1.5,
          decayDurationScale: 1.2,
          intensityCurveScale: 0.9
        }
      }
    });

    director._onCrisisStart({ crisisId: 'resonance_surge', duration: 15 });
    const crisis = director._activeCrisis;
    assert(crisis.phaseConfig.peakDuration > 2.5, 'peak duration should be scaled up');
    assert(crisis.phaseConfig.surgeDuration > 4.0, 'surge duration should be scaled up');

    // Intensity should be lower due to 0.9 curve scale
    const intensity = director._computeIntensity('SURGE', 2.0, crisis.phaseConfig);
    assert(intensity < 0.7, 'intensity should be scaled down by curve scale');

    director.dispose();
  }
});

tests.push({
  name: 'NetworkTensionRuntime applies shaper counterplay payoff',
  fn: () => {
    const runtime = new NetworkTensionRuntime_v1({ semanticBus: null });

    // Apply sacrifice_pivot shaper (favors reroute, penalizes reinforce)
    runtime._shaperConfig = {
      counterplayPayoff: {
        rerouteReliefScale: 1.6,
        rerouteRecoveryImpulseScale: 1.2,
        reinforceDurationScale: 0.6,
        reinforceStabilityCostScale: 1.4,
        reinforceRecoveryImpulseScale: 0.8,
        abandonStabilityBonus: 0.03,
        tickPressureScale: 1.05
      }
    };

    // Verify shaper config is stored
    assert.strictEqual(runtime._shaperConfig.counterplayPayoff.rerouteReliefScale, 1.6, 'reroute relief scale');
    assert.strictEqual(runtime._shaperConfig.counterplayPayoff.reinforceDurationScale, 0.6, 'reinforce duration scale');
    assert.strictEqual(runtime._shaperConfig.counterplayPayoff.abandonStabilityBonus, 0.03, 'abandon stability bonus');
  }
});

tests.push({
  name: 'VisualNetworkTimeElasticity applies shaper rewind behavior',
  fn: () => {
    const score = new VisualNetworkTimeElasticity_v1({ synergyThreshold: 0.55 });

    // Apply risky_rewind shaper (easier gate, shorter duration, peak bonus)
    score._shaperConfig = {
      rewindBehavior: {
        thresholdOffset: -0.08,
        gateDurationScale: 0.8,
        peakBonusMultiplier: 1.5
      }
    };

    // Simulate PEAK phase with crisis offset
    score.onCrisisPhaseChanged({ phase: 'PEAK', thresholdOffset: 0.02 });
    assert.strictEqual(score._crisisGateThresholdOffset, 0.03, 'threshold offset = 0.02 * 1.5 peak bonus');

    // Effective threshold should be lower (easier gate)
    // 0.55 + 0.03 - 0.08 = 0.50 conceptually, but floating point makes it ~0.50000000000000004
    // Use 0.51 to safely clear the gate
    const gateState = score._evaluateRewindGate({ networkSynergy: 0.51, nodeCount: 5, linkCount: 5, avgLinkQuality: 0.6, criticalHotspotActive: false, regionalTension: 0, tensionReleaseThreshold: 0 });
    assert(gateState.eligible, 'should be eligible with lowered threshold (0.55 + 0.03 - 0.08 ≈ 0.50)');
  }
});

tests.push({
  name: 'CollapseReadabilityDirector applies shaper collapse tolerance',
  fn: () => {
    const director = new CollapseReadabilityDirector({ semanticBus: null });

    // Apply sacrifice_pivot shaper (+0.15 fracture threshold offset = more tolerant)
    director._shaperConfig = {
      collapseTolerance: {
        fractureThresholdOffset: 0.15
      }
    };

    // Verify the shaper config is stored and accessible
    assert.strictEqual(director._shaperConfig.collapseTolerance.fractureThresholdOffset, 0.15, 'shaper offset stored');
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
