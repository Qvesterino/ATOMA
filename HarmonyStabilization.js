/**
 * HarmonyStabilization.js
 * ============================================================================
 * MERGED FILE — Harmony stabilization engine + integration patch.
 *
 * Original files merged (2026-04-22):
 *   - HarmonyStabilizationSystem_v1.js            (1656 lines)
 *   - HarmonyStabilizationIntegrationPatch_v1.js   (398 lines)
 *
 * The integration patch is a thin convenience layer over the main system,
 * so merging them eliminates a redundant import chain.
 *
 * Features:
 * - Node-level harmony tracking (0-1 scale)
 * - Link-level harmony flow (spreading stability)
 * - Corruption reduction and blocking
 * - Harmony pulses (radial cleansing waves)
 * - Oasis zones (clustered harmony areas)
 * - Archetype-aware harmony effects
 * - Progressive visual stabilization
 * - Full THREE.js safe mode compatibility
 * - Non-breaking integration with existing systems
 */

import { setMetric } from './src/metrics/NodeMetricEngine.js';
import { setNodeCorruption } from './src/utils/nodeCorruptionAccessor.js';

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

const THREE = THREE_SAFE;

// Phase C.3: HarmonyStabilizationSystem is visual-only
const PHASE_C3_METRIC_WRITE_LOCK = false;

/**
 * Harmony threshold definitions
 */
const HARMONY_THRESHOLDS = {
  DECAY_BEGIN: 0.2,
  LINK_SLOW: 0.4,
  CASCADE_DAMPEN: 0.6,
  BLOCKING: 0.8,
  ANCHOR: 1.0
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function applyDominancePulseModulation(
  {
    haloAmplitude = 0.15,
    haloFrequency = 1.0,
    pulsePhase = 0,
    pulseCoherence = 0.3,
    pulseStreak = 0.2,
  },
  dominanceState = null,
) {
  const modulation = dominanceState?.modulation;
  if (!modulation) {
    return {
      haloAmplitude,
      haloFrequency,
      pulsePhase,
      pulseCoherence,
      pulseStreak,
    };
  }

  return {
    haloAmplitude: clamp(
      haloAmplitude * (Number.isFinite(modulation.haloAmplitudeMul) ? modulation.haloAmplitudeMul : 1),
      0.08,
      0.5,
    ),
    haloFrequency: clamp(
      haloFrequency * (Number.isFinite(modulation.haloFrequencyMul) ? modulation.haloFrequencyMul : 1),
      0.6,
      1.8,
    ),
    pulsePhase: pulsePhase + (Number.isFinite(modulation.pulsePhaseOffset) ? modulation.pulsePhaseOffset : 0),
    pulseCoherence: clamp(
      pulseCoherence * (Number.isFinite(modulation.pulseCoherenceMul) ? modulation.pulseCoherenceMul : 1),
      0.18,
      1.45,
    ),
    pulseStreak: clamp(
      pulseStreak * (Number.isFinite(modulation.pulseStreakMul) ? modulation.pulseStreakMul : 1),
      0.08,
      1.1,
    ),
  };
}


// ============================================================================
// SECTION 1: HarmonyStabilizationSystem_v1
// ============================================================================

/**
 * HARMONY STABILIZATION & HEALING SYSTEM v1.0
 *
 * Counter-force to corruption that spreads order, stability, and healing through the network.
 * Represents harmony, resonance, and equilibrium as a balancing mechanic.
 *
 * Core Mechanics:
 * - Harmony spreads opposite to corruption (high → low)
 * - Reduces/blocks corruption spread on links
 * - Increases node stability and synergy
 * - Triggers healing pulses at thresholds
 * - Dampens cascade events
 * - Creates "Harmony Anchors" at max level
 *
 * Integration:
 * - Works with CorruptionVisualFX_v1 (overrides/fades corruption tint)
 * - Works with LinkCorruptionTransmission_v1 (reduces linkCorruptionLevel)
 * - Works with ArchetypeGameplayEffects_v1 (uses archetype profiles)
 */
export class HarmonyStabilizationSystem_v1 {
  constructor(aiNodes, linkSystem, debugMode = false, linkCorruptionTransmission = null) {
    this.aiNodes = aiNodes;
    this.linkSystem = linkSystem;
    this.debugMode = debugMode;
    this.linkCorruptionTransmission = linkCorruptionTransmission;

    this.nodeHarmony = new Map();
    this.linkHarmony = new Map();
    this.oasisZones = new Map();
    this.activePulses = [];

    this.updateInterval = 1 / 60;
    this.lastUpdateTime = 0;
    this.harmonyQueue = [];

    this.archetypeProfiles = null;

    if (this.debugMode) {
      console.log('%c[HarmonyStabilizationSystem_v1] Initialized', 'color: #00ffff; font-weight: bold;');
      this.setupConsoleAPI();
    }
  }

  _getLinkSynergyPct(link) {
    const score = Number.isFinite(link?.userData?.synergy?.score) ? link.userData.synergy.score : 0;
    return Math.max(0, Math.min(100, score * 100));
  }

  initializeNodeHarmony(node) {
    if (!node || !node.userData) return null;
    const nodeId = node.id || `node_${Math.random()}`;

    if (!this.nodeHarmony.has(nodeId)) {
      if (typeof node.userData.harmonyLevel !== 'number') {
        let initialHarmony = 0.5;
        const archetype = node.userData?.archetype;
        if (archetype === 'harmony' || archetype === 'resonance') initialHarmony = 0.7;
        else if (archetype === 'prime' || archetype === 'sigma') initialHarmony = 0.6;
        else if (archetype === 'chaos' || archetype === 'error') initialHarmony = 0.3;
        else initialHarmony = 0.45 + Math.random() * 0.15;
        this._writeNodeHarmonyLevel(node, initialHarmony);
      }
      if (typeof node.userData.isHarmonyAnchor !== 'boolean') node.userData.isHarmonyAnchor = false;
      if (typeof node.userData.anchorPulseActive !== 'boolean') node.userData.anchorPulseActive = false;

      this.nodeHarmony.set(nodeId, {
        velocity: 0, lastUpdateTime: Date.now(), pulseActive: false, pulseStartTime: 0,
        oasisActive: false, healingRate: 0, node: node, nodeId: nodeId
      });
    }
    return this.nodeHarmony.get(nodeId);
  }

  _writeNodeHarmonyLevel(node, level, source = 'HarmonyStabilizationSystem') {
    if (!node || !node.userData) return;
    const clampedLevel = Math.max(0, Math.min(1, Number(level) || 0));
    setMetric(node, 'harmony', clampedLevel, { source });
  }

  _writeLinkHarmonyLevel(link, level) {
    if (!link || !link.userData) return;
    const clampedLevel = Math.max(0, Math.min(1, Number(level) || 0));
    link.userData.metrics = link.userData.metrics || {};
    link.userData.metrics.harmony = clampedLevel;
  }

  _readNodeHarmonyLevel(node) {
    return node?.userData?.metrics?.harmony ?? node?.userData?.harmonyLevel ?? 0;
  }

  _readLinkHarmonyLevel(link) {
    return link?.userData?.metrics?.harmony ?? link?.userData?.harmonyLevel ?? 0;
  }

  initializeLinkHarmony(link) {
    if (!link || !link.userData) return null;
    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;

    if (!this.linkHarmony.has(linkId)) {
      if (typeof link.userData.harmonyLevel !== 'number') {
        const synergy = link.userData?.synergy?.score ?? link.userData?.synergyScore ?? 0.5;
        const initialHarmony = 0.4 + synergy * 0.3 + Math.random() * 0.1;
        this._writeLinkHarmonyLevel(link, initialHarmony);
      }
      this.linkHarmony.set(linkId, {
        velocity: 0, flowDirection: 'forward', flowRate: 0,
        lastUpdateTime: Date.now(), link: link, linkId: linkId
      });
    }
    return this.linkHarmony.get(linkId);
  }

  _canonicalWriteNodeHarmonicMetrics(node) {
    if (!node) return;
    node.userData ||= {};
    const controllers = node.harmonicControllers;
    let harmonicPhase = 0, harmonicHub = 0, harmonicResilience = 0, harmonicCollapse = 0, harmonicRecovery = 0;

    if (controllers) {
      if (controllers.sync) { harmonicPhase = controllers.sync.hubPhase ?? 0; harmonicHub = controllers.sync.hubStrength ?? 0; }
      if (controllers.resilience) harmonicResilience = controllers.resilience.hubResilience ?? 0;
      if (controllers.collapse) harmonicCollapse = controllers.collapse.collapseFactor ?? 0;
      if (controllers.recovery) harmonicRecovery = controllers.recovery.recoveryFactor ?? 0;
    }

    node.userData.harmonicPhase = harmonicPhase;
    node.userData.harmonicHub = harmonicHub;
    node.userData.harmonicResilience = harmonicResilience;
    node.userData.harmonicCollapse = harmonicCollapse;
    node.userData.harmonicRecovery = harmonicRecovery;

    node.userData.__canonicalWriteAt = node.userData.__canonicalWriteAt || {};
    const now = Date.now();
    node.userData.__canonicalWriteAt.harmonicPhase = now;
    node.userData.__canonicalWriteAt.harmonicHub = now;
    node.userData.__canonicalWriteAt.harmonicResilience = now;
    node.userData.__canonicalWriteAt.harmonicCollapse = now;
    node.userData.__canonicalWriteAt.harmonicRecovery = now;

    if (typeof node.userData.isHarmonyAnchor !== 'boolean') node.userData.isHarmonyAnchor = false;
    if (typeof node.userData.anchorPulseActive !== 'boolean') node.userData.anchorPulseActive = false;
  }

  _canonicalWriteHaloPulseMetrics(node) {
    if (!node) return;
    node.userData ||= {};
    const controllers = node.harmonicControllers;
    let hubResilience = 0, haloAmplitude = 0.15, haloFrequency = 1.0, pulsePhase = 0, pulseCoherence = 0.3, pulseStreak = 0.2;
    const currentTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

    if (controllers && controllers.resilience) {
      hubResilience = controllers.resilience.hubResilience ?? 0;
      if (typeof controllers.resilience.getModulatedHaloStability === 'function') {
        const haloMod = controllers.resilience.getModulatedHaloStability(0.3, 1.0);
        haloAmplitude = Math.max(0.15, haloMod.amplitude);
        haloFrequency = haloMod.frequency;
      }
      if (typeof controllers.resilience.getModulatedPulseCoherence === 'function') {
        const coherenceMod = controllers.resilience.getModulatedPulseCoherence(0.3);
        pulseCoherence = Math.max(0.3, coherenceMod.syncStrength);
        pulseStreak = coherenceMod.coherenceFactor;
      }
    }

    const phaseOffset = node.userData._pulsePhaseOffset ?? (node.id * 123.45) % (Math.PI * 2);
    const pulseSpeed = 1.0 + hubResilience * 0.5;
    pulsePhase = (currentTime * pulseSpeed + phaseOffset) % (Math.PI * 2);
    node.userData._pulsePhaseOffset = phaseOffset;

    const modulated = applyDominancePulseModulation({
      haloAmplitude,
      haloFrequency,
      pulsePhase,
      pulseCoherence,
      pulseStreak,
    }, node.userData?.visualState?.dominance);
    haloAmplitude = modulated.haloAmplitude;
    haloFrequency = modulated.haloFrequency;
    pulsePhase = modulated.pulsePhase;
    pulseCoherence = modulated.pulseCoherence;
    pulseStreak = modulated.pulseStreak;

    node.userData.haloAmplitude = haloAmplitude;
    node.userData.haloFrequency = haloFrequency;
    node.userData.pulsePhase = pulsePhase;
    node.userData.pulseCoherence = pulseCoherence;
    node.userData.pulseStreak = pulseStreak;

    node.userData.__canonicalWriteAt = node.userData.__canonicalWriteAt || {};
    const now = Date.now();
    node.userData.__canonicalWriteAt.haloAmplitude = now;
    node.userData.__canonicalWriteAt.haloFrequency = now;
    node.userData.__canonicalWriteAt.pulsePhase = now;
    node.userData.__canonicalWriteAt.pulseCoherence = now;
    node.userData.__canonicalWriteAt.pulseStreak = now;
  }

  _canonicalWriteLinkHarmonicMetrics(link) {
    if (!link) return;
    link.userData ||= {};
    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    let harmonicPhase = 0, harmonicHub = 0, harmonicResilience = 0, harmonicCollapse = 0, harmonicRecovery = 0;

    if (sourceNode?.userData) {
      harmonicPhase = sourceNode.userData.harmonicPhase ?? 0;
      harmonicHub = sourceNode.userData.harmonicHub ?? 0;
      harmonicResilience = sourceNode.userData.harmonicResilience ?? 0;
      harmonicCollapse = sourceNode.userData.harmonicCollapse ?? 0;
      harmonicRecovery = sourceNode.userData.harmonicRecovery ?? 0;
    }
    if (targetNode?.userData) {
      harmonicPhase = (harmonicPhase + (targetNode.userData.harmonicPhase ?? 0)) * 0.5;
      harmonicHub = (harmonicHub + (targetNode.userData.harmonicHub ?? 0)) * 0.5;
      harmonicResilience = (harmonicResilience + (targetNode.userData.harmonicResilience ?? 0)) * 0.5;
      harmonicCollapse = (harmonicCollapse + (targetNode.userData.harmonicCollapse ?? 0)) * 0.5;
      harmonicRecovery = (harmonicRecovery + (targetNode.userData.harmonicRecovery ?? 0)) * 0.5;
    }

    const linkHarmony = link.userData?.harmonyLevel ?? 0;
    harmonicHub *= linkHarmony;
    harmonicResilience *= (0.5 + linkHarmony * 0.5);
    harmonicCollapse *= (1.0 - linkHarmony * 0.5);
    harmonicRecovery *= linkHarmony;

    link.userData.harmonicPhase = harmonicPhase;
    link.userData.harmonicHub = harmonicHub;
    link.userData.harmonicResilience = harmonicResilience;
    link.userData.harmonicCollapse = harmonicCollapse;
    link.userData.harmonicRecovery = harmonicRecovery;

    link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
    const now = Date.now();
    link.userData.__canonicalWriteAt.harmonicPhase = now;
    link.userData.__canonicalWriteAt.harmonicHub = now;
    link.userData.__canonicalWriteAt.harmonicResilience = now;
    link.userData.__canonicalWriteAt.harmonicCollapse = now;
    link.userData.__canonicalWriteAt.harmonicRecovery = now;

    if (typeof link.userData.isHarmonyAnchor !== 'boolean') link.userData.isHarmonyAnchor = false;
    if (typeof link.userData.anchorPulseActive !== 'boolean') link.userData.anchorPulseActive = false;
  }

  _canonicalWriteLinkHaloPulseMetrics(link) {
    if (!link) return;
    link.userData ||= {};
    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    let hubResilience = 0, haloAmplitude = 0.1, haloFrequency = 1.0, pulsePhase = 0, pulseCoherence = 0.2, pulseStreak = 0.15;
    const currentTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

    if (sourceNode?.userData) {
      hubResilience = sourceNode.userData.harmonicResilience ?? 0;
      haloAmplitude = sourceNode.userData.haloAmplitude ?? 0.1;
      haloFrequency = sourceNode.userData.haloFrequency ?? 1.0;
      pulseCoherence = sourceNode.userData.pulseCoherence ?? 0.2;
      pulseStreak = sourceNode.userData.pulseStreak ?? 0.15;
    }
    if (targetNode?.userData) {
      haloAmplitude = (haloAmplitude + (targetNode.userData.haloAmplitude ?? 0.1)) * 0.5;
      haloFrequency = (haloFrequency + (targetNode.userData.haloFrequency ?? 1.0)) * 0.5;
      pulseCoherence = (pulseCoherence + (targetNode.userData.pulseCoherence ?? 0.2)) * 0.5;
      pulseStreak = (pulseStreak + (targetNode.userData.pulseStreak ?? 0.15)) * 0.5;
      hubResilience = (hubResilience + (targetNode.userData.harmonicResilience ?? 0)) * 0.5;
    }

    const linkHarmony = link.userData?.harmonyLevel ?? 0;
    haloAmplitude = 0.1 + linkHarmony * 0.3;

    const phaseOffset = link.userData._pulsePhaseOffset ?? ((link.id?.length ?? 0) * 123.45) % (Math.PI * 2);
    const pulseSpeed = 1.0 + hubResilience * 0.5;
    pulsePhase = (currentTime * pulseSpeed + phaseOffset) % (Math.PI * 2);
    link.userData._pulsePhaseOffset = phaseOffset;

    link.userData.haloAmplitude = haloAmplitude;
    link.userData.haloFrequency = haloFrequency;
    link.userData.pulsePhase = pulsePhase;
    link.userData.pulseCoherence = pulseCoherence;
    link.userData.pulseStreak = pulseStreak;

    link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
    const now = Date.now();
    link.userData.__canonicalWriteAt.haloAmplitude = now;
    link.userData.__canonicalWriteAt.haloFrequency = now;
    link.userData.__canonicalWriteAt.pulsePhase = now;
    link.userData.__canonicalWriteAt.pulseCoherence = now;
    link.userData.__canonicalWriteAt.pulseStreak = now;
  }

  update(deltaTime = 1/60) { this.updateHarmony(deltaTime); }

  updateHarmony(deltaTime = 1/60) {
    if (!this.aiNodes) return;
    const allNodes = this.getAllNodes();
    const allLinks = this.getAllLinks();

    if (allNodes && allNodes.length > 0) {
      for (const node of allNodes) { this._canonicalWriteNodeHarmonicMetrics(node); this._canonicalWriteHaloPulseMetrics(node); }
    }
    if (allLinks && allLinks.length > 0) {
      for (const link of allLinks) { this._canonicalWriteLinkHarmonicMetrics(link); this._canonicalWriteLinkHaloPulseMetrics(link); }
    }
    if (allNodes && allNodes.length > 0) { for (const node of allNodes) this.updateNodeHarmony(node, deltaTime); }
    if (allLinks && allLinks.length > 0) { for (const link of allLinks) this.updateLinkHarmony(link, deltaTime); }
    this.updateHarmonyPulses(deltaTime);
    this.updateOasisZones(deltaTime);
    this.processHarmonyQueue();
  }

  updateNodeHarmony(node, deltaTime) {
    const harmonyData = this.initializeNodeHarmony(node);
    if (!harmonyData) return;
    let level = this._readNodeHarmonyLevel(node);
    const nodeCorruption = node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0;

    let avgSynergy = 0, linkCount = 0;
    if (node.userData?.links && node.userData.links.length > 0) {
      for (const link of node.userData.links) { avgSynergy += this._getLinkSynergyPct(link); linkCount++; }
      avgSynergy = linkCount > 0 ? avgSynergy / linkCount : 0;
    }
    const recoveryBoost = 1.0 + Math.min(avgSynergy * 0.5, 0.5);

    if (linkCount === 0) return;

    if (level > 0) {
      let healAmount = level * 0.1 * deltaTime * recoveryBoost;
      if (nodeCorruption > 0) {
        setNodeCorruption(node, Math.max(0, nodeCorruption - healAmount), { source: 'harmony-stabilization' });
        this._emitCorruptionThreshold(node);
      }
    }

    const inboundFlow = this.computeInboundHarmonyFlow(node);
    let targetHarmony = 0.5 + inboundFlow * 0.3;
    targetHarmony = Math.max(0.1, Math.min(0.95, targetHarmony));

    const lerpRate = 0.1 * recoveryBoost;
    const distance = targetHarmony - level;
    level = level + distance * lerpRate * deltaTime;

    const decayRate = 0.005;
    if (level > 0.7) level -= level * decayRate * deltaTime;

    level = Math.max(0, Math.min(1.0, level));
    this._writeNodeHarmonyLevel(node, level);
    harmonyData.lastUpdateTime = Date.now();
    this.checkHarmonyThresholds(node, { level });
    this.applyNodeHarmonyVisuals(node, level, Date.now() / 1000);
  }

  updateLinkHarmony(link, deltaTime) {
    const harmonyData = this.initializeLinkHarmony(link);
    if (!harmonyData) return;
    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    if (!sourceNode || !targetNode) return;

    let level = this._readLinkHarmonyLevel(link);
    const synergy = this._getLinkSynergyPct(link);
    const recoveryBoost = 1.0 + Math.min(synergy * 0.5, 0.5);
    const harmonyFlowRate = this.computeHarmonyFlowRate(sourceNode, targetNode, link);
    const targetHarmony = targetNode.userData?.metrics?.harmony ?? 0;
    const harmonyDifference = targetHarmony - level;

    let harmonyMultiplier = 1.0;
    if (this.linkCorruptionTransmission && sourceNode && targetNode) {
      harmonyMultiplier = this.linkCorruptionTransmission.getHarmonyPropagationMultiplier(sourceNode, targetNode);
    }

    let harmonyIncrease = harmonyDifference * harmonyFlowRate * harmonyMultiplier * deltaTime * 0.1 * recoveryBoost;
    level = Math.min(1.0, level + harmonyIncrease);
    this._writeLinkHarmonyLevel(link, level);
    harmonyData.velocity = harmonyIncrease / (deltaTime + 0.001);
    harmonyData.lastUpdateTime = Date.now();

    if (level > 0.2 && this.aiNodes.linkCorruption) {
      const linkCorruptionData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
      if (linkCorruptionData) {
        let harmonyReduction = level * 0.05 * deltaTime * recoveryBoost;
        linkCorruptionData.level = Math.max(0, linkCorruptionData.level - harmonyReduction);
      }
    }
    this.applyLinkHarmonyVisuals(link, level, Date.now() / 1000);
  }

  computeInboundHarmonyFlow(node) {
    if (!node || !this.linkSystem) return 0;
    let totalFlow = 0;
    const inboundLinks = this.getInboundLinks(node);
    for (const link of inboundLinks) {
      const sourceNode = link.source || link.sourceNode;
      const harmonyData = this.linkHarmony.get(link.id);
      if (sourceNode && harmonyData) {
        const level = this._readLinkHarmonyLevel(link);
        totalFlow += level * harmonyData.flowRate;
      }
    }
    return Math.min(1.0, totalFlow);
  }

  computeHarmonyFlowRate(sourceNode, targetNode, link) {
    let baseRate = 0.5;
    if (!this.archetypeProfiles && this.aiNodes.archetypeProfiles) this.archetypeProfiles = this.aiNodes.archetypeProfiles;

    if (sourceNode.userData?.archetype && this.archetypeProfiles) {
      const p = this.archetypeProfiles[sourceNode.userData.archetype];
      if (p) {
        if (p.tags?.includes('harmony') || p.tags?.includes('resonance')) baseRate *= 2.0;
        if (p.tags?.includes('prime') || p.tags?.includes('sigma')) baseRate *= 1.5;
        if (p.tags?.includes('chaos') || p.tags?.includes('error')) baseRate *= 0.3;
        if (p.tags?.includes('quantum')) baseRate *= (0.5 + Math.random() * 1.5);
      }
    }
    if (targetNode.userData?.archetype && this.archetypeProfiles) {
      const p = this.archetypeProfiles[targetNode.userData.archetype];
      if (p) {
        if (p.tags?.includes('harmony') || p.tags?.includes('resonance')) baseRate *= 1.5;
        if (p.tags?.includes('prime') || p.tags?.includes('sigma')) baseRate *= 1.2;
        if (p.tags?.includes('chaos')) baseRate *= 0.5;
      }
    }
    if (link.userData?.synergy !== undefined) baseRate *= (0.5 + (link.userData.synergy.score ?? 0) * 0.5);
    return Math.max(0.01, Math.min(2.0, baseRate));
  }

  checkHarmonyThresholds(node, harmonyData) {
    const level = harmonyData.level;
    const thresholds = [
      { value: HARMONY_THRESHOLDS.DECAY_BEGIN, event: 'decay_begin' },
      { value: HARMONY_THRESHOLDS.LINK_SLOW, event: 'link_slow' },
      { value: HARMONY_THRESHOLDS.CASCADE_DAMPEN, event: 'cascade_dampen' },
      { value: HARMONY_THRESHOLDS.BLOCKING, event: 'blocking' },
      { value: HARMONY_THRESHOLDS.ANCHOR, event: 'anchor_achieved' }
    ];
    for (const threshold of thresholds) {
      if (level >= threshold.value && !node.userData.harmonyThresholds?.has?.(threshold.event)) {
        if (!node.userData.harmonyThresholds) node.userData.harmonyThresholds = new Set();
        node.userData.harmonyThresholds.add(threshold.event);
        this.harmonyQueue.push({ node, event: threshold.event, level, timestamp: Date.now() });
        if (this.debugMode) console.log(`[HarmonyStabilization] Threshold: ${threshold.event} at level ${level.toFixed(2)}`);
      }
    }
  }

  processHarmonyQueue() {
    while (this.harmonyQueue.length > 0) {
      const event = this.harmonyQueue.shift();
      switch (event.event) {
        case 'blocking': this.triggerHarmonyBlocking(event.node); break;
        case 'anchor_achieved': this.triggerAnchorState(event.node); break;
        case 'cascade_dampen': this.triggerCascadeDampening(event.node); break;
      }
    }
  }

  triggerHarmonyBlocking(node) {
    if (!node || !node.userData) return;
    node.userData.corrupted = false;
    setNodeCorruption(node, Math.max(0, (node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0) - 0.2), { source: 'harmony-stabilization' });
    this._emitCorruptionThreshold(node);
    this.triggerHarmonyPulse(node);
    if (this.debugMode) console.log('[HarmonyStabilization] Blocking triggered - corruption reduced');
  }

  triggerAnchorState(node) {
    if (!node || !node.userData) return;
    node.userData.isHarmonyAnchor = true;
    setNodeCorruption(node, 0, { source: 'harmony-stabilization' });
    this._emitCorruptionThreshold(node);
    node.userData.anchorPulseActive = true;
    if (this.debugMode) console.log('[HarmonyStabilization] Node became harmony anchor');
  }

  triggerCascadeDampening(node) {
    if (!node || !this.aiNodes.linkCorruption) return;
    const outboundLinks = this.getOutboundLinks(node);
    for (const link of outboundLinks) {
      const linkData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
      if (linkData) { linkData.cascadeThresholdsCrossed.delete('cascade'); linkData.cascadeThresholdsCrossed.delete('infection_complete'); }
    }
    if (this.debugMode) console.log('[HarmonyStabilization] Cascade dampening applied');
  }

  triggerHarmonyPulse(sourceNode, radius = 2.0, intensity = 0.5) {
    if (!sourceNode) return;
    const harmonyData = this.initializeNodeHarmony(sourceNode);
    if (!harmonyData) return;
    const level = this._readNodeHarmonyLevel(sourceNode);
    const pulse = { sourceNode, sourcePos: sourceNode.position || { x: 0, y: 0, z: 0 }, startTime: Date.now(), duration: 1.0, radius, intensity: Math.min(1.0, level * intensity), active: true };
    this.activePulses.push(pulse);
    this.appliesPulseEffect(pulse);
    if (this.debugMode) console.log('[HarmonyStabilization] Harmony pulse triggered from node');
    return pulse;
  }

  appliesPulseEffect(pulse) {
    const allNodes = this.getAllNodes();
    const allLinks = this.getAllLinks();
    const sourcePos = pulse.sourcePos || { x: 0, y: 0, z: 0 };
    const sourceX = sourcePos.x || 0, sourceY = sourcePos.y || 0, sourceZ = sourcePos.z || 0;
    const radiusSq = (pulse.radius || 0) * (pulse.radius || 0);

    for (const node of allNodes) {
      const nodePos = node?.position;
      if (!nodePos) continue;
      const dx = sourceX - (nodePos.x || 0), dy = sourceY - (nodePos.y || 0), dz = sourceZ - (nodePos.z || 0);
      if ((dx * dx) + (dy * dy) + (dz * dz) <= radiusSq) {
        if (node.userData) {
          setNodeCorruption(node, Math.max(0, (node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0) - pulse.intensity * 0.3), { source: 'harmony-stabilization' });
          this._emitCorruptionThreshold(node);
          const currentLevel = this._readNodeHarmonyLevel(node);
          this._writeNodeHarmonyLevel(node, Math.min(1.0, currentLevel + pulse.intensity * 0.2));
        }
      }
    }

    for (const link of allLinks) {
      const source = link.source || link.sourceNode;
      const target = link.target || link.targetNode;
      if (source && target && source.position && target.position) {
        const midX = (source.position.x + target.position.x) * 0.5;
        const midY = (source.position.y + target.position.y) * 0.5;
        const midZ = (source.position.z + target.position.z) * 0.5;
        const linkDx = sourceX - midX, linkDy = sourceY - midY, linkDz = sourceZ - midZ;
        if ((linkDx * linkDx) + (linkDy * linkDy) + (linkDz * linkDz) <= radiusSq) {
          if (this.aiNodes.linkCorruption) {
            const linkData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
            if (linkData) linkData.level = Math.max(0, linkData.level - pulse.intensity * 0.2);
          }
          const currentLevel = this._readLinkHarmonyLevel(link);
          this._writeLinkHarmonyLevel(link, Math.min(1.0, currentLevel + pulse.intensity * 0.3));
        }
      }
    }
  }

  updateHarmonyPulses(deltaTime) {
    for (let i = this.activePulses.length - 1; i >= 0; i--) {
      const pulse = this.activePulses[i];
      const elapsed = (Date.now() - pulse.startTime) / 1000;
      if (elapsed >= pulse.duration) this.activePulses.splice(i, 1);
    }
    const allNodes = this.getAllNodes();
    for (const node of allNodes) {
      const isAnchor = node.userData?.isHarmonyAnchor ?? false;
      const level = node.userData?.harmonyLevel ?? 0;
      if (isAnchor && level >= 1.0) {
        const anchorPulse = { sourceNode: node, sourcePos: node.position || { x: 0, y: 0, z: 0 }, startTime: Date.now(), duration: 0.5, radius: 1.5, intensity: 0.2, isAnchorPulse: true };
        this.appliesPulseEffect(anchorPulse);
      }
    }
  }

  updateOasisZones(deltaTime) {
    const allNodes = this.getAllNodes();
    const harmonyNodes = allNodes.filter(n => (n.userData?.harmonyLevel ?? 0) > 0.5);
    if (harmonyNodes.length < 2) return;
    const clusters = this.findHarmonyClusters(harmonyNodes);
    for (const cluster of clusters) {
      if (cluster.length >= 3) {
        const centroid = this.computeCentroid(cluster);
        const radius = this.computeClusterRadius(cluster);
        const zoneId = `oasis_${cluster[0].id}_${cluster[1].id}`;
        let totalLevel = 0;
        for (const n of cluster) totalLevel += n.userData?.harmonyLevel ?? 0;
        const zone = { nodes: new Set(cluster), centerPos: centroid, radius, intensity: totalLevel / cluster.length };
        this.oasisZones.set(zoneId, zone);
        this.applyOasisEffects(zone, deltaTime);
      }
    }
  }

  findHarmonyClusters(harmonyNodes, clusterDistance = 3.0) {
    const clusters = [];
    const visited = new Set();
    for (const node of harmonyNodes) {
      if (visited.has(node.id)) continue;
      const cluster = [node];
      visited.add(node.id);
      for (const other of harmonyNodes) {
        if (visited.has(other.id)) continue;
        if (this.distanceToNode(node.position, other.position) <= clusterDistance) { cluster.push(other); visited.add(other.id); }
      }
      if (cluster.length >= 2) clusters.push(cluster);
    }
    return clusters;
  }

  computeCentroid(nodes) {
    let x = 0, y = 0, z = 0;
    for (const node of nodes) { if (node.position) { x += node.position.x || 0; y += node.position.y || 0; z += node.position.z || 0; } }
    return { x: x / nodes.length, y: y / nodes.length, z: z / nodes.length };
  }

  computeClusterRadius(nodes) {
    const centroid = this.computeCentroid(nodes);
    let maxDist = 0;
    for (const node of nodes) { if (node.position) maxDist = Math.max(maxDist, this.distanceToNode(centroid, node.position)); }
    return maxDist + 1.0;
  }

  applyOasisEffects(zone, deltaTime) {
    const allLinks = this.getAllLinks();
    for (const node of zone.nodes) {
      if (node.userData) {
        setNodeCorruption(node, Math.max(0, (node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0) - zone.intensity * 0.01 * deltaTime), { source: 'harmony-stabilization' });
        this._emitCorruptionThreshold(node);
        const currentLevel = this._readNodeHarmonyLevel(node);
        this._writeNodeHarmonyLevel(node, Math.min(1.0, currentLevel + zone.intensity * 0.005 * deltaTime));
      }
    }
    for (const link of allLinks) {
      const source = link.source || link.sourceNode;
      const target = link.target || link.targetNode;
      if (source && target && source.position && target.position) {
        const mid = { x: (source.position.x + target.position.x) / 2, y: (source.position.y + target.position.y) / 2, z: (source.position.z + target.position.z) / 2 };
        if (this.distanceToNode(zone.centerPos, mid) <= zone.radius) {
          if (this.aiNodes.linkCorruption) {
            const linkData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
            if (linkData) linkData.level *= 0.2;
          }
        }
      }
    }
  }

  applyNodeHarmonyVisuals(node, level, time = 0) {
    if (!node || !node.userData) return;
    if (!node.userData.harmonyVisualState) {
      node.userData.harmonyVisualState = { auraTint: { r: 0.2, g: 0.9, b: 0.8 }, auraIntensity: 0, pulseFrequency: 2.0, rotationStabilization: 0, particleDriftDirection: { x: 0, y: 1, z: 0 } };
    }
    const vis = node.userData.harmonyVisualState;
    if (level < 0.1) { vis.auraIntensity = 0; vis.rotationStabilization = 0; }
    else if (level < 0.3) { vis.auraIntensity = level * 0.5; vis.rotationStabilization = level * 0.2; vis.pulseFrequency = 1.0; }
    else if (level < 0.6) { const t = (level - 0.3) / 0.3; vis.auraIntensity = 0.3 + t * 0.3 + Math.sin(time * 2.0) * 0.1; vis.rotationStabilization = 0.1 + t * 0.3; vis.pulseFrequency = 1.5 + t * 0.5; }
    else if (level < 0.85) { const t = (level - 0.6) / 0.25; vis.auraIntensity = Math.min(1.0, 0.6 + t * 0.2 + Math.sin(time * 2.5) * 0.15); vis.rotationStabilization = 0.4 + t * 0.3; vis.pulseFrequency = 2.0 + t * 0.5; }
    else { vis.auraIntensity = Math.min(1.0, 0.8 + Math.sin(time * 3.0) * 0.2); vis.rotationStabilization = 0.8; vis.pulseFrequency = 3.0; }
    vis.auraIntensity = Math.max(0, Math.min(1, vis.auraIntensity));
    vis.rotationStabilization = Math.max(0, Math.min(1, vis.rotationStabilization));
    node.userData.isHarmonized = level > 0.2;
  }

  applyLinkHarmonyVisuals(link, level, time = 0) {
    if (!link || !link.userData) return;
    if (!link.userData.harmonyVisualState) {
      link.userData.harmonyVisualState = { ribbonColor: { r: 0.3, g: 0.9, b: 0.8 }, ribbonIntensity: 0, waveFrequency: 1.0, waveAmplitude: 0.2, particleDirection: 'resonance' };
    }
    const vis = link.userData.harmonyVisualState;
    if (level < 0.1) { vis.ribbonIntensity = 0; }
    else if (level < 0.4) { vis.ribbonIntensity = level * 0.6; vis.waveFrequency = 1.5; vis.waveAmplitude = 0.15; }
    else if (level < 0.7) { const t = (level - 0.4) / 0.3; vis.ribbonIntensity = 0.3 + t * 0.5; vis.waveFrequency = 1.5 + t * 1.5; vis.waveAmplitude = 0.15 + t * 0.2; vis.particleDirection = 'resonance'; }
    else { vis.ribbonIntensity = Math.min(1.0, 0.8 + Math.sin(time * 2.0) * 0.2); vis.waveFrequency = 3.0; vis.waveAmplitude = 0.35; }
    vis.ribbonIntensity = Math.max(0, Math.min(1, vis.ribbonIntensity));
  }

  setNodeHarmony(node, level) {
    this.initializeNodeHarmony(node);
    this._writeNodeHarmonyLevel(node, Math.max(0, Math.min(1, level)));
  }

  setLinkHarmony(link, level) {
    this.initializeLinkHarmony(link);
    this._writeLinkHarmonyLevel(link, Math.max(0, Math.min(1, level)));
  }

  getAllNodes() {
    if (!this.aiNodes) return [];
    if (Array.isArray(this.aiNodes.nodes)) return this.aiNodes.nodes;
    if (this.aiNodes.allNodes && Array.isArray(this.aiNodes.allNodes)) return this.aiNodes.allNodes;
    if (this.aiNodes.nodesByCategory) { const allNodes = []; for (const category of ['root', 'core', 'extended']) { const nodes = this.aiNodes.nodesByCategory(category); if (nodes) allNodes.push(...nodes); } return allNodes; }
    return [];
  }

  getAllLinks() {
    if (!this.linkSystem) return [];
    if (this.linkSystem.allLinks && Array.isArray(this.linkSystem.allLinks)) return this.linkSystem.allLinks;
    if (this.linkSystem.links && Array.isArray(this.linkSystem.links)) return this.linkSystem.links;
    if (this.linkSystem.linksBySourceId) { const allLinks = []; for (const sourceLinks of this.linkSystem.linksBySourceId.values()) allLinks.push(...sourceLinks); return allLinks; }
    return [];
  }

  getInboundLinks(node) {
    if (!node || !this.linkSystem) return [];
    if (this.linkSystem.linksByTargetId && this.linkSystem.linksByTargetId.has(node.id)) return Array.from(this.linkSystem.linksByTargetId.get(node.id));
    if (Array.isArray(this.linkSystem.allLinks)) return this.linkSystem.allLinks.filter(l => (l.target?.id === node.id || l.targetNode?.id === node.id));
    return [];
  }

  getOutboundLinks(node) {
    if (!node || !this.linkSystem) return [];
    if (this.linkSystem.linksBySourceId && this.linkSystem.linksBySourceId.has(node.id)) return Array.from(this.linkSystem.linksBySourceId.get(node.id));
    if (Array.isArray(this.linkSystem.allLinks)) return this.linkSystem.allLinks.filter(l => (l.source?.id === node.id || l.sourceNode?.id === node.id));
    return [];
  }

  distanceToNode(pos1, pos2) {
    if (!pos1 || !pos2) return 999;
    const dx = (pos1.x || 0) - (pos2.x || 0), dy = (pos1.y || 0) - (pos2.y || 0), dz = (pos1.z || 0) - (pos2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  getNodeHarmonyInfo(node) {
    const harmonyData = this.nodeHarmony.get(node.id) || this.initializeNodeHarmony(node);
    if (!harmonyData) return null;
    const level = this._readNodeHarmonyLevel(node);
    return { nodeId: harmonyData.nodeId, harmonyLevel: level.toFixed(3), velocity: harmonyData.velocity.toFixed(3), isAnchor: node.userData.isHarmonyAnchor ?? false, pulseActive: node.userData.anchorPulseActive ?? false };
  }

  setupConsoleAPI() {
    window.harmonyDebug = {
      setHarmony: (node, value) => { this.setNodeHarmony(node, value); console.log(`[HarmonyStabilization] Node harmony set to ${value.toFixed(3)}`); },
      pulse: (node) => { this.triggerHarmonyPulse(node); console.log('[HarmonyStabilization] Pulse triggered from node'); },
      cleanseNode: (node) => { if (node.userData) { setNodeCorruption(node, 0, { source: 'harmony-stabilization' }); this._emitCorruptionThreshold(node); } this.setNodeHarmony(node, 1.0); console.log('[HarmonyStabilization] Node cleansed'); },
      cleanseLink: (link) => { this.setLinkHarmony(link, 1.0); if (this.aiNodes.linkCorruption) this.aiNodes.linkCorruption.setLinkCorruption(link, 0); console.log('[HarmonyStabilization] Link cleansed'); },
      createOasis: (node) => { this.setNodeHarmony(node, 0.9); for (const link of this.getOutboundLinks(node)) this.setLinkHarmony(link, 0.8); console.log('[HarmonyStabilization] Oasis zone created'); },
      networkHarmonyStats: () => {
        const allNodes = this.getAllNodes(); const allLinks = this.getAllLinks();
        let totalNodeHarmony = 0, totalLinkHarmony = 0, maxNodeHarmony = 0, anchors = 0;
        for (const node of allNodes) { const level = node.userData?.harmonyLevel ?? 0; totalNodeHarmony += level; maxNodeHarmony = Math.max(maxNodeHarmony, level); if (node.userData?.isHarmonyAnchor ?? false) anchors++; }
        for (const link of allLinks) totalLinkHarmony += link.userData?.harmonyLevel ?? 0;
        const stats = { totalNodes: allNodes.length, trackedNodes: this.nodeHarmony.size, averageNodeHarmony: allNodes.length > 0 ? totalNodeHarmony / allNodes.length : 0, maxNodeHarmony, harmonyAnchors: anchors, totalLinks: allLinks.length, trackedLinks: this.linkHarmony.size, averageLinkHarmony: allLinks.length > 0 ? totalLinkHarmony / allLinks.length : 0, activePulses: this.activePulses.length, oasisZones: this.oasisZones.size };
        console.table(stats); return stats;
      },
      toggleDebug: () => { this.debugMode = !this.debugMode; console.log(`[HarmonyStabilization] Debug mode: ${this.debugMode}`); },
      getNetworkHarmony: () => { const allNodes = this.aiNodes?.nodes || []; if (allNodes.length === 0) return 0; let totalHarmony = 0; for (const node of allNodes) totalHarmony += node.userData?.harmonyLevel ?? node.userData?.harmony ?? 0; return totalHarmony / allNodes.length; }
    };
    console.log('%c[HarmonyStabilizationSystem_v1] Debug API ready at window.harmonyDebug', 'color: #00ff00;');
  }

  _emitCorruptionThreshold(node) {
    if (!node?.userData) return;
    const prev = node.userData._prevCorruption ?? 0;
    const current = node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0;
    const THRESHOLD = 0.7;
    if (prev < THRESHOLD && current >= THRESHOLD) { this.multiNetworkManager?.emitEvent?.({ type: 'corruptionThresholdCrossed', node, value: current, timestamp: Date.now() }); }
    node.userData._prevCorruption = current;
  }

  rebind({ linkingSystem, aiNodes, semanticBus }) {
    if (linkingSystem !== undefined) this.linkSystem = linkingSystem;
    if (aiNodes !== undefined) this.aiNodes = aiNodes;
  }
}

export default HarmonyStabilizationSystem_v1;


// ============================================================================
// SECTION 2: HarmonyStabilizationIntegrationPatch_v1
// ============================================================================

/**
 * Non-breaking integration patch for HarmonyStabilizationSystem_v1.
 * Provides automatic system initialization, safe patches, lifecycle management.
 */
export class HarmonyStabilizationIntegrationPatch_v1 {
  static patchAINodes(aiNodesInstance, linkSystemInstance, debugMode = false) {
    if (!aiNodesInstance) { console.error('[HarmonyStabilizationIntegrationPatch_v1] AINodes instance required'); return; }
    if (!aiNodesInstance.harmonySystem) {
      aiNodesInstance.harmonySystem = new HarmonyStabilizationSystem_v1(aiNodesInstance, linkSystemInstance, debugMode);
      if (debugMode) console.log('%c[HarmonyStabilizationIntegrationPatch_v1] Initialized', 'color: #00ffff;');
    }
    if (!aiNodesInstance.updateNodeHarmony) aiNodesInstance.updateNodeHarmony = function(deltaTime) { if (this.harmonySystem) this.harmonySystem.updateHarmony(deltaTime); };
    if (!aiNodesInstance.getNodeHarmonyInfo) aiNodesInstance.getNodeHarmonyInfo = function(node) { return this.harmonySystem ? this.harmonySystem.getNodeHarmonyInfo(node) : null; };
    if (!aiNodesInstance.setNodeHarmonyLevel) aiNodesInstance.setNodeHarmonyLevel = function(node, level) { if (this.harmonySystem) this.harmonySystem.setNodeHarmony(node, level); };
    if (!aiNodesInstance.setLinkHarmonyLevel) aiNodesInstance.setLinkHarmonyLevel = function(link, level) { if (this.harmonySystem) this.harmonySystem.setLinkHarmony(link, level); };
    if (!aiNodesInstance.triggerHarmonyPulse) aiNodesInstance.triggerHarmonyPulse = function(node, radius = 2.0, intensity = 0.5) { return this.harmonySystem ? this.harmonySystem.triggerHarmonyPulse(node, radius, intensity) : undefined; };
    if (!aiNodesInstance.linkSystemInstance) aiNodesInstance.linkSystemInstance = linkSystemInstance;
    return aiNodesInstance.harmonySystem;
  }

  static updateGameLoop(aiNodes, deltaTime) { if (!aiNodes || !aiNodes.harmonySystem) return; aiNodes.harmonySystem.updateHarmony(deltaTime); }

  static setupCorruptionCounterplay(aiNodes) {
    if (!aiNodes || !aiNodes.harmonySystem) return;
    console.log('[HarmonyStabilizationIntegrationPatch_v1] Corruption counterplay active');
  }

  static setupVisualIntegration(aiNodes, corruptionVisualFX) {
    if (!aiNodes || !aiNodes.harmonySystem || !corruptionVisualFX) return;
    aiNodes.harmonySystem.visualFXLayer = corruptionVisualFX;
    console.log('[HarmonyStabilizationIntegrationPatch_v1] Visual integration setup');
  }

  static getPerformanceStats(aiNodes) {
    if (!aiNodes || !aiNodes.harmonySystem) return null;
    return aiNodes.harmonySystem.getNodeHarmonyInfo ? window.harmonyDebug?.networkHarmonyStats?.() : null;
  }

  static resetSystem(aiNodes) {
    if (!aiNodes || !aiNodes.harmonySystem) return;
    aiNodes.harmonySystem.nodeHarmony.clear(); aiNodes.harmonySystem.linkHarmony.clear();
    aiNodes.harmonySystem.oasisZones.clear(); aiNodes.harmonySystem.activePulses = []; aiNodes.harmonySystem.harmonyQueue = [];
    console.log('[HarmonyStabilizationIntegrationPatch_v1] System reset');
  }

  static completeSetup(aiNodes, nodeLinkingSystem, corruptionVisualFX = null, debugMode = false) {
    console.log('%c[HarmonyStabilizationIntegrationPatch_v1] Starting complete setup', 'color: #00ffff;');
    this.patchAINodes(aiNodes, nodeLinkingSystem, debugMode);
    this.setupCorruptionCounterplay(aiNodes);
    if (corruptionVisualFX) this.setupVisualIntegration(aiNodes, corruptionVisualFX);
    if (debugMode) {
      window.harmonyIntegrationDebug = { stats: () => window.harmonyDebug?.networkHarmonyStats?.(), reset: () => HarmonyStabilizationIntegrationPatch_v1.resetSystem(aiNodes), system: () => aiNodes.harmonySystem };
      console.log('%c[HarmonyStabilizationIntegrationPatch_v1] Integration debug API ready', 'color: #00ff00;');
    }
    console.log('%c[HarmonyStabilizationIntegrationPatch_v1] Setup complete', 'color: #00ff00;');
    return aiNodes.harmonySystem;
  }

  static seedHarmonyNetwork(aiNodes, seedNodes, harmonyLevel = 0.7) {
    if (!aiNodes || !aiNodes.harmonySystem) return;
    for (const node of seedNodes) aiNodes.harmonySystem.setNodeHarmony(node, harmonyLevel);
    console.log(`[HarmonyStabilizationIntegrationPatch_v1] Seeded ${seedNodes.length} nodes with harmony`);
  }

  static triggerNetworkHarmonyWave(aiNodes, intensity = 0.5) {
    if (!aiNodes || !aiNodes.harmonySystem) return;
    for (const node of aiNodes.harmonySystem.getAllNodes()) aiNodes.harmonySystem.triggerHarmonyPulse(node, 2.0, intensity);
    console.log(`[HarmonyStabilizationIntegrationPatch_v1] Network harmony wave triggered (intensity: ${intensity})`);
  }

  static createRegionalOasis(aiNodes, oasisNodes) {
    if (!aiNodes || !aiNodes.harmonySystem) return;
    for (const node of oasisNodes) aiNodes.harmonySystem.setNodeHarmony(node, 0.9);
    for (const node of oasisNodes) aiNodes.harmonySystem.triggerHarmonyPulse(node, 3.0, 0.6);
    console.log(`[HarmonyStabilizationIntegrationPatch_v1] Regional oasis created with ${oasisNodes.length} nodes`);
  }
}

/**
 * Apply harmony stabilization integration to main instance
 */
export function applyHarmonyStabilizationIntegration(harmonySystem, mainInstance) {
  if (!harmonySystem) { console.error('[HarmonyStabilizationIntegration] harmonySystem parameter is required'); return; }
  if (!mainInstance) { console.error('[HarmonyStabilizationIntegration] mainInstance parameter is required'); return; }

  if (!mainInstance.harmonySystem) { mainInstance.harmonySystem = harmonySystem; }
  else if (mainInstance.harmonySystem !== harmonySystem) { console.warn('[HarmonyStabilizationIntegration] mainInstance.harmonySystem already exists and is different. Skipping assignment.'); }

  if (mainInstance.aiNodes && !mainInstance.aiNodes.harmonySystem) mainInstance.aiNodes.harmonySystem = harmonySystem;
  if (mainInstance.linkCorruptionTransmission && !harmonySystem.linkCorruptionTransmission) harmonySystem.linkCorruptionTransmission = mainInstance.linkCorruptionTransmission;

  if (!mainInstance.updateHarmonySystem) {
    mainInstance.updateHarmonySystem = function(deltaTime = 1/60) { if (this.harmonySystem) this.harmonySystem.updateHarmony(deltaTime); };
  }
  if (mainInstance.aiNodes && !mainInstance.aiNodes.getNodeHarmonyInfo) {
    mainInstance.aiNodes.getNodeHarmonyInfo = function(node) { return this.harmonySystem ? this.harmonySystem.getNodeHarmonyInfo?.(node) ?? this.harmonySystem.nodeHarmony.get(node.id) : null; };
  }
  if (mainInstance.aiNodes && !mainInstance.aiNodes.setNodeHarmonyLevel) {
    mainInstance.aiNodes.setNodeHarmonyLevel = function(node, level) { if (this.harmonySystem) this.harmonySystem.setNodeHarmony(node, level); };
  }
  if (mainInstance.aiNodes && !mainInstance.aiNodes.setLinkHarmonyLevel) {
    mainInstance.aiNodes.setLinkHarmonyLevel = function(link, level) { if (this.harmonySystem) this.harmonySystem.setLinkHarmony(link, level); };
  }
  if (mainInstance.aiNodes && !mainInstance.aiNodes.triggerHarmonyPulse) {
    mainInstance.aiNodes.triggerHarmonyPulse = function(node, radius = 2.0, intensity = 0.5) { return this.harmonySystem ? this.harmonySystem.triggerHarmonyPulse(node, radius, intensity) : undefined; };
  }

  console.log('[HarmonyStabilizationIntegration] Integration applied successfully');
  return harmonySystem;
}
