import { applyMetricImpulse } from './src/metrics/NodeMetricEngine.js';

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function getNowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function getNodeId(node) {
  if (!node) return null;
  return node?.userData?.nodeId || node?.userData?.id || node?.uuid || node?.id || null;
}

function resolveNodeMetrics(node) {
  return node?.userData?.metrics || {};
}

function resolveLinkQuality(link) {
  const candidates = [
    link?.userData?.quality?.normalizedScore,
    link?.userData?.quality?.quality,
    link?.userData?.quality?.score,
    link?.userData?.qualityScore,
    link?.userData?.quality,
    link?.qualityScore,
    link?.quality
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return clamp01(candidate);
    }
  }
  return 0;
}

function emitSemantic(bus, eventName, payload = {}) {
  if (!bus || typeof bus.emit !== 'function') return;
  bus.emit(eventName, payload, {
    priority: bus.priority?.INTERACTIVE ?? bus.priority?.NORMAL
  });
}

const DEFAULT_WORLD_PROFILE = Object.freeze({
  flowLoadWeight: 0.36,
  flowAsymmetryWeight: 0.24,
  flowQualityWeight: 0.18,
  flowWaveWeight: 0.12,
  loadWeight: 0.28,
  stabilityWeight: 0.24,
  corruptionWeight: 0.22,
  qualityWeight: 0.14,
  chokepointWeight: 0.12,
  waveWeight: 0.14,
  hotspotWeight: 0.55,
  overloadWeight: 0.25,
  chokepointHotspotWeight: 0.20,
  hotspotThreshold: 0.58,
  criticalHotspotThreshold: 0.76,
  releaseThreshold: 0.54,
  chokepointCriticalThreshold: 0.68,
  rerouteCandidateThreshold: 0.56,
  rerouteDurationMs: 5800,
  rerouteReliefScale: 0.72,
  rerouteRecoveryImpulse: 0.018,
  reinforceDurationMs: 3200,
  reinforceCooldownMs: 8200,
  reinforceStrainScale: 0.58,
  reinforceOverloadScale: 0.65,
  reinforceRecoveryImpulse: 0.012,
  reinforceHarmonyCost: 0.018,
  reinforceStabilityCost: 0.012,
  reinforceLoadCost: 0.022,
  tickPressureScale: 0.0036,
  linkEventThreshold: 0.72
});

export const NETWORK_TENSION_WORLD_PROFILES = Object.freeze({
  default: DEFAULT_WORLD_PROFILE,
  quantum: Object.freeze({
    ...DEFAULT_WORLD_PROFILE,
    flowAsymmetryWeight: 0.28,
    flowWaveWeight: 0.16,
    hotspotThreshold: 0.60,
    criticalHotspotThreshold: 0.79,
    releaseThreshold: 0.55,
    rerouteDurationMs: 4800,
    rerouteReliefScale: 0.78,
    rerouteRecoveryImpulse: 0.020,
    reinforceDurationMs: 2800,
    reinforceCooldownMs: 7600,
    reinforceStrainScale: 0.54,
    reinforceOverloadScale: 0.62,
    reinforceRecoveryImpulse: 0.014,
    reinforceHarmonyCost: 0.020,
    reinforceStabilityCost: 0.014,
    reinforceLoadCost: 0.024,
    tickPressureScale: 0.0041
  }),
  desert: Object.freeze({
    ...DEFAULT_WORLD_PROFILE,
    flowAsymmetryWeight: 0.18,
    chokepointWeight: 0.15,
    hotspotThreshold: 0.56,
    criticalHotspotThreshold: 0.74,
    releaseThreshold: 0.50,
    chokepointCriticalThreshold: 0.65,
    rerouteDurationMs: 6400,
    rerouteReliefScale: 0.65,
    rerouteRecoveryImpulse: 0.016,
    reinforceDurationMs: 3800,
    reinforceCooldownMs: 8800,
    reinforceStrainScale: 0.60,
    reinforceOverloadScale: 0.68,
    reinforceRecoveryImpulse: 0.010,
    reinforceHarmonyCost: 0.016,
    reinforceStabilityCost: 0.010,
    reinforceLoadCost: 0.020,
    tickPressureScale: 0.0032
  })
});

function createEmptySnapshot(worldId = 'default') {
  return {
    worldId,
    updatedAt: 0,
    criticalHotspotActive: false,
    criticalHotspotCount: 0,
    fragileChokepointActive: false,
    fragileChokepointCount: 0,
    regionalTension: 0,
    maxChokepointScore: 0,
    tensionReleaseThreshold: DEFAULT_WORLD_PROFILE.releaseThreshold,
    chokepointReleaseThreshold: DEFAULT_WORLD_PROFILE.chokepointCriticalThreshold,
    hotspots: [],
    criticalLinks: [],
    components: [],
    mainNetwork: null
  };
}

export class NetworkTensionRuntime_v1 {
  constructor({
    metricsRuntime = null,
    linkSystem = null,
    semanticBus = null,
    getWorldId = null,
    getStandingWaveTrapSystem = null
  } = {}) {
    this.metricsRuntime = metricsRuntime || null;
    this.linkSystem = linkSystem || null;
    this.semanticBus = semanticBus || null;
    this.getWorldId = typeof getWorldId === 'function' ? getWorldId : (() => 'default');
    this.getStandingWaveTrapSystem = typeof getStandingWaveTrapSystem === 'function'
      ? getStandingWaveTrapSystem
      : (() => null);

    this._lastSnapshot = createEmptySnapshot(this._resolveWorldId());
    this._lastLinkAnalyses = [];
    this._linkHighEventAt = new Map();
    this._criticalHotspotActive = false;
    this._fragileChokepointActive = false;
    this._abandonCooldownUntil = new Map();
  }

  _resolveWorldId() {
    return String(this.getWorldId?.() || 'default').trim().toLowerCase() || 'default';
  }

  _getWorldProfile() {
    const worldId = this._resolveWorldId();
    return NETWORK_TENSION_WORLD_PROFILES[worldId] || NETWORK_TENSION_WORLD_PROFILES.default;
  }

  _getNodeList() {
    const nodes =
      this.metricsRuntime?.nodes?.nodes ||
      this.metricsRuntime?.nodes ||
      this.linkSystem?.nodes ||
      [];
    if (Array.isArray(nodes) && nodes.length > 0) {
      return nodes.filter(Boolean);
    }

    const links = this._getActiveLinks();
    const deduped = new Map();
    for (const link of links) {
      if (link?.source) {
        const sourceId = getNodeId(link.source);
        if (sourceId) deduped.set(sourceId, link.source);
      }
      if (link?.target) {
        const targetId = getNodeId(link.target);
        if (targetId) deduped.set(targetId, link.target);
      }
    }
    return Array.from(deduped.values());
  }

  _getActiveLinks() {
    const links =
      this.linkSystem?.links ||
      this.metricsRuntime?.linkSystem?.links ||
      this.metricsRuntime?.links?.links ||
      this.metricsRuntime?.links ||
      [];
    return Array.isArray(links)
      ? links.filter((link) => link?.active !== false && link?.source && link?.target)
      : [];
  }

  _buildNodeMap(nodes) {
    const nodeMap = new Map();
    for (const node of nodes) {
      const id = getNodeId(node);
      if (id) {
        nodeMap.set(id, node);
      }
    }
    return nodeMap;
  }

  _resolveComponentSets(nodeMap, links) {
    const resolver = this.metricsRuntime?.networkResolver;
    if (resolver?.resolve && resolver?.getNetworks) {
      try {
        resolver.nodeMap = this._buildNodeMap(Array.from(nodeMap.values()));
        resolver.resolve();
        const networks = resolver.getNetworks();
        if (networks instanceof Map && networks.size > 0) {
          return new Map(Array.from(networks.entries()).map(([id, nodes]) => [id, new Set(nodes)]));
        }
      } catch (_err) {
        // Fallback below when resolver becomes stale during world reset.
      }
    }

    const adjacency = new Map();
    for (const nodeId of nodeMap.keys()) {
      adjacency.set(nodeId, new Set());
    }
    for (const link of links) {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);
      if (!sourceId || !targetId) continue;
      if (!adjacency.has(sourceId)) adjacency.set(sourceId, new Set());
      if (!adjacency.has(targetId)) adjacency.set(targetId, new Set());
      adjacency.get(sourceId).add(targetId);
      adjacency.get(targetId).add(sourceId);
    }

    const visited = new Set();
    const components = new Map();
    let index = 0;
    for (const nodeId of adjacency.keys()) {
      if (visited.has(nodeId)) continue;
      const stack = [nodeId];
      const component = new Set();
      while (stack.length > 0) {
        const current = stack.pop();
        if (!current || visited.has(current)) continue;
        visited.add(current);
        component.add(current);
        const neighbors = adjacency.get(current) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) stack.push(neighbor);
        }
      }
      if (component.size >= 2) {
        components.set(`network_${index++}`, component);
      }
    }
    return components;
  }

  _getTrapAmplitudeByLinkId() {
    const trapSystem = this.getStandingWaveTrapSystem?.() || null;
    const trapMap = new Map();
    const traps = Array.isArray(trapSystem?.oscillationTraps) ? trapSystem.oscillationTraps : [];
    for (const trap of traps) {
      if (!trap?.active) continue;
      const linkId = trap.linkId ? String(trap.linkId) : null;
      if (!linkId) continue;
      const amplitude = clamp01((Number(trap.amplitude) || 0) / 1.2);
      const previous = trapMap.get(linkId) || 0;
      if (amplitude > previous) {
        trapMap.set(linkId, amplitude);
      }
    }
    return trapMap;
  }

  _createLinkTensionSnapshot(link, computed) {
    const existing = link?.userData?.networkTension && typeof link.userData.networkTension === 'object'
      ? link.userData.networkTension
      : {};
    return {
      flow: clamp01(computed.flow),
      strain: clamp01(computed.strain),
      chokepointScore: clamp01(computed.chokepointScore),
      overloadRisk: clamp01(computed.overloadRisk),
      hotspotWeight: clamp01(computed.hotspotWeight),
      reinforcedUntil: Number(existing.reinforcedUntil) || 0,
      reliefUntil: Number(existing.reliefUntil) || 0,
      cooldownUntil: Number(existing.cooldownUntil) || 0,
      fatigueUntil: Number(existing.fatigueUntil) || 0,
      rerouteCandidate: computed.rerouteCandidate === true
    };
  }

  _analyzeLinks(links, componentByNode, profile, trapAmplitudeByLinkId) {
    const degrees = new Map();
    for (const link of links) {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);
      if (!sourceId || !targetId) continue;
      degrees.set(sourceId, (degrees.get(sourceId) || 0) + 1);
      degrees.set(targetId, (degrees.get(targetId) || 0) + 1);
    }

    const now = getNowMs();
    const analyses = [];
    for (const link of links) {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);
      if (!sourceId || !targetId) continue;

      const sourceMetrics = resolveNodeMetrics(link.source);
      const targetMetrics = resolveNodeMetrics(link.target);
      const quality = resolveLinkQuality(link);
      const avgLoad = clamp01(((sourceMetrics.loadPressure || 0) + (targetMetrics.loadPressure || 0)) * 0.5);
      const avgStability = clamp01(((sourceMetrics.stability ?? 1) + (targetMetrics.stability ?? 1)) * 0.5);
      const avgCorruption = clamp01(((sourceMetrics.corruption || 0) + (targetMetrics.corruption || 0)) * 0.5);
      const loadAsymmetry = clamp01(Math.abs((sourceMetrics.loadPressure || 0) - (targetMetrics.loadPressure || 0)));
      const minDegree = Math.max(1, Math.min(degrees.get(sourceId) || 1, degrees.get(targetId) || 1));
      const componentId = componentByNode.get(sourceId) || componentByNode.get(targetId) || null;
      const componentSize = componentId ? (componentByNode.__sizes?.get(componentId) || 2) : 2;
      const trapAmplitude = trapAmplitudeByLinkId.get(String(link.id || link.userData?.id || '')) || 0;

      const degreeFragility = 1 - Math.min(1, (minDegree - 1) / 4);
      const componentPressure = Math.min(1, componentSize / 8);
      const chokepointScore = clamp01((degreeFragility * 0.72) + (componentPressure * 0.28));
      const flow = clamp01(
        (avgLoad * profile.flowLoadWeight) +
        (loadAsymmetry * profile.flowAsymmetryWeight) +
        ((1 - quality) * profile.flowQualityWeight) +
        (trapAmplitude * profile.flowWaveWeight)
      );
      let strain = clamp01(
        (avgLoad * profile.loadWeight) +
        ((1 - avgStability) * profile.stabilityWeight) +
        (avgCorruption * profile.corruptionWeight) +
        ((1 - quality) * profile.qualityWeight) +
        (chokepointScore * profile.chokepointWeight) +
        (trapAmplitude * profile.waveWeight)
      );
      let overloadRisk = clamp01(
        (strain * 0.58) +
        (avgLoad * 0.22) +
        (avgCorruption * 0.12) +
        ((1 - avgStability) * 0.08)
      );
      let hotspotWeight = clamp01(
        (strain * profile.hotspotWeight) +
        (overloadRisk * profile.overloadWeight) +
        (chokepointScore * profile.chokepointHotspotWeight)
      );

      const existing = link?.userData?.networkTension && typeof link.userData.networkTension === 'object'
        ? link.userData.networkTension
        : {};

      if ((Number(existing.reinforcedUntil) || 0) > now) {
        strain *= profile.reinforceStrainScale;
        overloadRisk *= profile.reinforceOverloadScale;
        hotspotWeight *= 0.76;
      }
      // Post-decay fatigue spike: 1.5s after reinforce expires, strain jumps
      if ((Number(existing.fatigueUntil) || 0) > now && (Number(existing.reinforcedUntil) || 0) <= now) {
        strain = clamp01(strain * 1.15);
        overloadRisk = clamp01(overloadRisk * 1.08);
      }
      if ((Number(existing.reliefUntil) || 0) > now) {
        const reliefScale = 1 - profile.rerouteReliefScale;
        hotspotWeight *= reliefScale;
        overloadRisk *= Math.max(0.52, reliefScale + 0.12);
      }

      const rerouteCandidate =
        hotspotWeight >= profile.rerouteCandidateThreshold ||
        (chokepointScore >= (profile.chokepointCriticalThreshold * 0.94) && strain >= (profile.releaseThreshold * 0.92));

      const snapshot = this._createLinkTensionSnapshot(link, {
        flow,
        strain,
        chokepointScore,
        overloadRisk,
        hotspotWeight,
        rerouteCandidate
      });

      if (!link.userData) link.userData = {};
      link.userData.networkTension = snapshot;

      analyses.push({
        link,
        linkId: String(link.id || link.userData?.id || `${sourceId}->${targetId}`),
        sourceNode: link.source,
        targetNode: link.target,
        sourceId,
        targetId,
        componentId,
        quality,
        avgLoad,
        avgStability,
        avgCorruption,
        loadAsymmetry,
        snapshot
      });
    }

    return analyses;
  }

  _summarizeComponents(componentSets, linkAnalyses, profile) {
    const summaries = [];
    for (const [componentId, nodes] of componentSets.entries()) {
      const componentLinks = linkAnalyses.filter((analysis) => analysis.componentId === componentId);
      if (componentLinks.length === 0) continue;

      const averageHotspot = componentLinks.reduce((sum, analysis) => sum + analysis.snapshot.hotspotWeight, 0) / componentLinks.length;
      const maxHotspot = componentLinks.reduce((max, analysis) => Math.max(max, analysis.snapshot.hotspotWeight), 0);
      const maxChokepoint = componentLinks.reduce((max, analysis) => Math.max(max, analysis.snapshot.chokepointScore), 0);
      const collapsePressure = componentLinks.reduce((max, analysis) => Math.max(max, analysis.snapshot.overloadRisk), 0);
      const criticalHotspot = maxHotspot >= profile.criticalHotspotThreshold ||
        (averageHotspot >= profile.hotspotThreshold && collapsePressure >= profile.releaseThreshold && maxChokepoint >= profile.chokepointCriticalThreshold);
      const fragileChokepoint = maxChokepoint >= profile.chokepointCriticalThreshold &&
        averageHotspot >= (profile.releaseThreshold * 0.9);

      const hotspots = componentLinks
        .filter((analysis) => analysis.snapshot.hotspotWeight >= profile.hotspotThreshold)
        .sort((a, b) => b.snapshot.hotspotWeight - a.snapshot.hotspotWeight)
        .slice(0, 4)
        .map((analysis) => ({
          linkId: analysis.linkId,
          hotspotWeight: analysis.snapshot.hotspotWeight,
          strain: analysis.snapshot.strain,
          overloadRisk: analysis.snapshot.overloadRisk,
          chokepointScore: analysis.snapshot.chokepointScore
        }));

      summaries.push({
        id: componentId,
        nodeCount: nodes.size,
        linkCount: componentLinks.length,
        averageHotspot,
        maxHotspot,
        maxChokepoint,
        collapsePressure,
        criticalHotspot,
        fragileChokepoint,
        hotspots
      });
    }

    summaries.sort((a, b) => {
      if (b.nodeCount !== a.nodeCount) return b.nodeCount - a.nodeCount;
      return b.linkCount - a.linkCount;
    });
    return summaries;
  }

  _applyTickPressure(linkAnalyses, profile, dt) {
    const stepScale = Math.max(0.4, Math.min(1.8, (Number(dt) || 0.1) / 0.1));
    for (const analysis of linkAnalyses) {
      if (analysis.snapshot.hotspotWeight < profile.hotspotThreshold) continue;
      const pressure = profile.tickPressureScale * analysis.snapshot.hotspotWeight * stepScale;
      const impulse = {
        loadPressure: pressure,
        stability: -pressure * 0.85,
        corruption: pressure * 0.52,
        harmony: -pressure * 0.42
      };
      applyMetricImpulse(analysis.sourceNode, impulse, { source: 'network-tension-runtime' });
      applyMetricImpulse(analysis.targetNode, impulse, { source: 'network-tension-runtime' });
    }
  }

  _emitRuntimeEvents(linkAnalyses, mainNetwork, profile, now, worldId) {
    const criticalHotspotActive = !!mainNetwork?.criticalHotspot;
    const fragileChokepointActive = !!mainNetwork?.fragileChokepoint;

    if (criticalHotspotActive && !this._criticalHotspotActive) {
      emitSemantic(this.semanticBus, 'network:tensionHotspot', {
        worldId,
        networkId: mainNetwork.id,
        hotspotCount: mainNetwork.hotspots.length,
        regionalTension: mainNetwork.averageHotspot,
        collapsePressure: mainNetwork.collapsePressure
      });
    } else if (!criticalHotspotActive && this._criticalHotspotActive) {
      emitSemantic(this.semanticBus, 'network:tensionRecovered', {
        worldId,
        networkId: mainNetwork?.id || null,
        regionalTension: mainNetwork?.averageHotspot || 0
      });
    }

    if (fragileChokepointActive && !this._fragileChokepointActive) {
      emitSemantic(this.semanticBus, 'network:chokepointCritical', {
        worldId,
        networkId: mainNetwork.id,
        maxChokepointScore: mainNetwork.maxChokepoint
      });
    }

    this._criticalHotspotActive = criticalHotspotActive;
    this._fragileChokepointActive = fragileChokepointActive;

    for (const analysis of linkAnalyses) {
      if (analysis.snapshot.hotspotWeight < profile.linkEventThreshold) continue;
      const lastAt = this._linkHighEventAt.get(analysis.linkId) || 0;
      if ((now - lastAt) < 2600) continue;
      this._linkHighEventAt.set(analysis.linkId, now);
      emitSemantic(this.semanticBus, 'link:tensionHigh', {
        worldId,
        linkId: analysis.linkId,
        hotspotWeight: analysis.snapshot.hotspotWeight,
        chokepointScore: analysis.snapshot.chokepointScore,
        overloadRisk: analysis.snapshot.overloadRisk
      });
    }
  }

  update(dt = 0.1, _gameTime = 0) {
    const worldId = this._resolveWorldId();
    const profile = this._getWorldProfile();
    const nodes = this._getNodeList();
    const links = this._getActiveLinks();
    const now = getNowMs();

    if (links.length === 0 || nodes.length === 0) {
      this._lastSnapshot = {
        ...createEmptySnapshot(worldId),
        updatedAt: now,
        tensionReleaseThreshold: profile.releaseThreshold,
        chokepointReleaseThreshold: profile.chokepointCriticalThreshold
      };
      this._lastLinkAnalyses = [];
      this._criticalHotspotActive = false;
      this._fragileChokepointActive = false;
      return this._lastSnapshot;
    }

    const nodeMap = this._buildNodeMap(nodes);
    const componentSets = this._resolveComponentSets(nodeMap, links);
    const componentByNode = new Map();
    componentByNode.__sizes = new Map();
    for (const [componentId, nodeIds] of componentSets.entries()) {
      componentByNode.__sizes.set(componentId, nodeIds.size);
      for (const nodeId of nodeIds) {
        componentByNode.set(nodeId, componentId);
      }
    }

    const trapAmplitudeByLinkId = this._getTrapAmplitudeByLinkId();
    const linkAnalyses = this._analyzeLinks(links, componentByNode, profile, trapAmplitudeByLinkId);
    const componentSummaries = this._summarizeComponents(componentSets, linkAnalyses, profile);
    const mainNetwork = componentSummaries[0] || null;

    this._applyTickPressure(linkAnalyses, profile, dt);
    this._emitRuntimeEvents(linkAnalyses, mainNetwork, profile, now, worldId);

    this._lastLinkAnalyses = linkAnalyses;
    this._lastSnapshot = {
      worldId,
      updatedAt: now,
      criticalHotspotActive: !!mainNetwork?.criticalHotspot,
      criticalHotspotCount: componentSummaries.filter((component) => component.criticalHotspot).length,
      fragileChokepointActive: !!mainNetwork?.fragileChokepoint,
      fragileChokepointCount: componentSummaries.filter((component) => component.fragileChokepoint).length,
      regionalTension: mainNetwork?.averageHotspot || 0,
      maxChokepointScore: mainNetwork?.maxChokepoint || 0,
      tensionReleaseThreshold: profile.releaseThreshold,
      chokepointReleaseThreshold: profile.chokepointCriticalThreshold,
      hotspots: mainNetwork?.hotspots || [],
      criticalLinks: (mainNetwork?.hotspots || []).map((entry) => entry.linkId),
      components: componentSummaries,
      mainNetwork
    };
    return this._lastSnapshot;
  }

  _resolveLinkByPair(sourceNode, targetNode) {
    const links = this._getActiveLinks();
    return links.find((link) => link?.source === sourceNode && link?.target === targetNode) || null;
  }

  tryReinforceCorridor(sourceNode, targetNode) {
    const link = this._resolveLinkByPair(sourceNode, targetNode);
    if (!link) {
      return { applied: false, reason: 'missing-link' };
    }

    const profile = this._getWorldProfile();
    const now = getNowMs();
    const existing = link?.userData?.networkTension && typeof link.userData.networkTension === 'object'
      ? link.userData.networkTension
      : {};
    const cooldownUntil = Number(existing.cooldownUntil) || 0;

    if (cooldownUntil > now) {
      return {
        applied: false,
        reason: 'cooldown',
        remainingMs: cooldownUntil - now
      };
    }

    // Situational gating: only allow reinforce on actually threatened links
    const hotspotWeight = Number(existing.hotspotWeight) || 0;
    const strain = Number(existing.strain) || 0;
    const isThreatened =
      hotspotWeight >= profile.hotspotThreshold * 0.85 ||
      strain >= profile.releaseThreshold * 0.9;
    if (!isThreatened) {
      return { applied: false, reason: 'not-threatened' };
    }

    if (!link.userData) link.userData = {};
    link.userData.networkTension = {
      ...existing,
      reinforcedUntil: now + profile.reinforceDurationMs,
      reliefUntil: Math.max(Number(existing.reliefUntil) || 0, now + Math.round(profile.reinforceDurationMs * 0.62)),
      cooldownUntil: now + profile.reinforceCooldownMs,
      fatigueUntil: now + profile.reinforceDurationMs + 1500,
      rerouteCandidate: false
    };

    const recoveryImpulse = {
      stability: profile.reinforceRecoveryImpulse,
      corruption: -(profile.reinforceRecoveryImpulse * 0.55),
      harmony: -profile.reinforceHarmonyCost,
      loadPressure: profile.reinforceLoadCost
    };
    applyMetricImpulse(sourceNode, recoveryImpulse, { source: 'network-tension-runtime' });
    applyMetricImpulse(targetNode, recoveryImpulse, { source: 'network-tension-runtime' });

    // Post-decay stability cost
    if (profile.reinforceStabilityCost > 0) {
      const decayImpulse = {
        stability: -profile.reinforceStabilityCost,
        loadPressure: profile.reinforceLoadCost * 0.5
      };
      applyMetricImpulse(sourceNode, decayImpulse, { source: 'network-tension-runtime' });
      applyMetricImpulse(targetNode, decayImpulse, { source: 'network-tension-runtime' });
    }

    emitSemantic(this.semanticBus, 'network:corridorReinforced', {
      worldId: this._resolveWorldId(),
      linkId: String(link.id || link.userData?.id || ''),
      sourceNodeId: getNodeId(sourceNode),
      targetNodeId: getNodeId(targetNode),
      durationMs: profile.reinforceDurationMs
    });

    emitSemantic(this.semanticBus, 'network:tensionRecovered', {
      worldId: this._resolveWorldId(),
      mode: 'reinforce',
      linkId: String(link.id || link.userData?.id || ''),
      sourceNodeId: getNodeId(sourceNode),
      targetNodeId: getNodeId(targetNode)
    });

    return {
      applied: true,
      reason: 'reinforced',
      link
    };
  }

  noteLinkCreated(link) {
    if (!link) return { relieved: false };
    const profile = this._getWorldProfile();
    const now = getNowMs();
    const sourceId = getNodeId(link.source);
    const targetId = getNodeId(link.target);
    const adjacentHotspot = this._lastLinkAnalyses
      .filter((analysis) => analysis.link !== link)
      .filter((analysis) => analysis.snapshot.rerouteCandidate)
      .filter((analysis) => (
        analysis.sourceId === sourceId ||
        analysis.targetId === sourceId ||
        analysis.sourceId === targetId ||
        analysis.targetId === targetId
      ))
      .sort((a, b) => b.snapshot.hotspotWeight - a.snapshot.hotspotWeight)[0];

    if (!adjacentHotspot || adjacentHotspot.snapshot.hotspotWeight < profile.rerouteCandidateThreshold) {
      return { relieved: false };
    }

    if (!link.userData) link.userData = {};
    const newLinkTension = link.userData.networkTension && typeof link.userData.networkTension === 'object'
      ? link.userData.networkTension
      : {};
    link.userData.networkTension = {
      ...newLinkTension,
      reliefUntil: now + profile.rerouteDurationMs,
      rerouteCandidate: false
    };

    const hotspotTension = adjacentHotspot.link.userData?.networkTension && typeof adjacentHotspot.link.userData.networkTension === 'object'
      ? adjacentHotspot.link.userData.networkTension
      : {};
    adjacentHotspot.link.userData.networkTension = {
      ...hotspotTension,
      reliefUntil: now + profile.rerouteDurationMs
    };

    const recoveryImpulse = {
      stability: profile.rerouteRecoveryImpulse,
      corruption: -(profile.rerouteRecoveryImpulse * 0.65),
      loadPressure: -(profile.rerouteRecoveryImpulse * 0.4)
    };
    applyMetricImpulse(adjacentHotspot.sourceNode, recoveryImpulse, { source: 'network-tension-runtime' });
    applyMetricImpulse(adjacentHotspot.targetNode, recoveryImpulse, { source: 'network-tension-runtime' });

    emitSemantic(this.semanticBus, 'network:hotspotRelieved', {
      worldId: this._resolveWorldId(),
      relievedLinkId: adjacentHotspot.linkId,
      newLinkId: String(link.id || link.userData?.id || ''),
      reliefScale: profile.rerouteReliefScale,
      durationMs: profile.rerouteDurationMs
    });

    emitSemantic(this.semanticBus, 'network:corridorRerouted', {
      worldId: this._resolveWorldId(),
      relievedLinkId: adjacentHotspot.linkId,
      newLinkId: String(link.id || link.userData?.id || '')
    });

    emitSemantic(this.semanticBus, 'network:tensionRecovered', {
      worldId: this._resolveWorldId(),
      mode: 'reroute',
      linkId: String(link.id || link.userData?.id || ''),
      relievedLinkId: adjacentHotspot.linkId
    });

    return {
      relieved: true,
      relievedLinkId: adjacentHotspot.linkId
    };
  }

  tryAbandonCorridor(link) {
    if (!link) return { applied: false, reason: 'missing-link' };
    const profile = this._getWorldProfile();
    const now = getNowMs();

    const existing = link?.userData?.networkTension && typeof link.userData.networkTension === 'object'
      ? link.userData.networkTension
      : {};
    const hotspotWeight = Number(existing.hotspotWeight) || 0;
    const chokepointScore = Number(existing.chokepointScore) || 0;

    const isThreatened =
      hotspotWeight >= profile.hotspotThreshold ||
      chokepointScore >= profile.chokepointCriticalThreshold * 0.85;
    if (!isThreatened) {
      return { applied: false, reason: 'not-threatened' };
    }

    const sourceId = getNodeId(link.source);
    const targetId = getNodeId(link.target);
    const componentId = this._lastLinkAnalyses
      .find((a) => a.sourceId === sourceId && a.targetId === targetId)
      ?.componentId || null;

    const cooldownKey = componentId || `${sourceId}->${targetId}`;
    const cooldownUntil = this._abandonCooldownUntil.get(cooldownKey) || 0;
    if (cooldownUntil > now) {
      return { applied: false, reason: 'cooldown', remainingMs: cooldownUntil - now };
    }
    this._abandonCooldownUntil.set(cooldownKey, now + 4000);

    // Component-wide load relief
    if (componentId) {
      const componentLinks = this._lastLinkAnalyses.filter((a) => a.componentId === componentId);
      for (const analysis of componentLinks) {
        if (analysis.link === link) continue;
        const nodeImpulse = {
          loadPressure: -0.08,
          stability: 0.02
        };
        applyMetricImpulse(analysis.sourceNode, nodeImpulse, { source: 'network-tension-runtime' });
        applyMetricImpulse(analysis.targetNode, nodeImpulse, { source: 'network-tension-runtime' });
      }
    }

    // Source and target node bonuses
    const abandonImpulse = {
      stability: 0.06,
      corruption: -0.04,
      loadPressure: -0.04
    };
    applyMetricImpulse(link.source, abandonImpulse, { source: 'network-tension-runtime' });
    applyMetricImpulse(link.target, abandonImpulse, { source: 'network-tension-runtime' });

    emitSemantic(this.semanticBus, 'network:corridorAbandoned', {
      worldId: this._resolveWorldId(),
      linkId: String(link.id || link.userData?.id || ''),
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      componentId: componentId || null
    });

    return {
      applied: true,
      reason: 'abandoned',
      componentId: componentId || null
    };
  }

  getScoreGateSnapshot() {
    return {
      criticalHotspotActive: this._lastSnapshot.criticalHotspotActive,
      criticalHotspotCount: this._lastSnapshot.criticalHotspotCount,
      fragileChokepointActive: this._lastSnapshot.fragileChokepointActive,
      fragileChokepointCount: this._lastSnapshot.fragileChokepointCount,
      regionalTension: this._lastSnapshot.regionalTension,
      maxChokepointScore: this._lastSnapshot.maxChokepointScore,
      tensionReleaseThreshold: this._lastSnapshot.tensionReleaseThreshold,
      chokepointReleaseThreshold: this._lastSnapshot.chokepointReleaseThreshold
    };
  }

  getDebugSnapshot() {
    return {
      ...this._lastSnapshot,
      hotspots: Array.isArray(this._lastSnapshot.hotspots)
        ? this._lastSnapshot.hotspots.map((entry) => ({ ...entry }))
        : [],
      components: Array.isArray(this._lastSnapshot.components)
        ? this._lastSnapshot.components.map((component) => ({
            ...component,
            hotspots: Array.isArray(component.hotspots)
              ? component.hotspots.map((entry) => ({ ...entry }))
              : []
          }))
        : []
    };
  }
}
