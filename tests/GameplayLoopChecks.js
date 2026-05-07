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
import { getDefaultMetricThresholds } from '../src/metrics/MetricTierClassifier.js';
import { CompetitionDominanceAdapter_v1 } from '../CompetitionDominanceAdapter_v1.js';
import { applyDominancePulseModulation } from '../HarmonyStabilization.js';
import {
  UIVisibilityConfig,
  getUIVisibilitySettingsRows,
  isHudEffectivelyVisible,
} from '../ui/config/UIVisibilityConfig.js';
import { NODE_VISUAL_REGISTRY } from '../NodeVisualRegistry.js';
import { NetworkMetricsAggregator } from '../src/metrics/NetworkMetricsAggregator.js';
import { onLinkCreated, onLinkRemoved } from '../src/metrics/NodeMetricEngine.js';

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
    ...overrides
  });
}

test('Network Time rewinds after 5s of canonical global.synergy.high sustain', () => {
  const threshold = getDefaultMetricThresholds('synergy').high;
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

test('main.js wires competition dominance update on simulation tick', () => {
  const source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  assert(source.includes("simulation.competitionDominance"), 'expected simulation competition dominance scheduler registration');
  assert(source.includes("this.competitionDominance.update("), 'expected competition dominance update call in scheduler');
});

test('Network Time stays forward below canonical global.synergy.high threshold', () => {
  const threshold = getDefaultMetricThresholds('synergy').high;
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
  const threshold = getDefaultMetricThresholds('synergy').high;
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
  setEligibleScoreSnapshot(score, threshold);
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
  const threshold = getDefaultMetricThresholds('synergy').high;
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
  const threshold = getDefaultMetricThresholds('synergy').high;
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
  const threshold = getDefaultMetricThresholds('synergy').high;
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
  const threshold = getDefaultMetricThresholds('synergy').high;
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

test('main wires the full raw network snapshot into the score authority', () => {
  const mainSource = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');

  assert(mainSource.includes('this.visualNetworkTimeElasticity.setNetworkMetricsSnapshot(rawNetworkMetrics || {});'));
  assert(!mainSource.includes('this.visualNetworkTimeElasticity.setAverageSynergy(avgSynergy);'));
});

test('HUD exposes minimal rewind lock feedback strings', () => {
  const hudSource = fs.readFileSync(new URL('../HUD/CoreMetricsHUD.js', import.meta.url), 'utf8');

  assert(hudSource.includes('sustain-lock-reason'));
  assert(hudSource.includes('NEED MORE NODES'));
  assert(hudSource.includes('NEED MORE LINKS'));
  assert(hudSource.includes('LINK QUALITY TOO LOW'));
  assert(hudSource.includes('SYNERGY TOO LOW'));
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
