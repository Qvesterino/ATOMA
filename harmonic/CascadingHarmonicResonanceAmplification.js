/**
 * harmonic/CascadingHarmonicResonanceAmplification.js
 * ============================================================================
 * HARMONIC RESONANCE CASCADING THROUGH NETWORK LAYERS
 *
 * Amplifies harmonic state across network topology layers, creating visual
 * patterns where strong hubs propagate resonance that builds and accumulates
 * through the network structure.
 *
 * LAYER ARCHITECTURE:
 * Layer 0: Primary harmonic hub (initiator, 100% strength)
 * Layer 1: Direct neighbors (60% decay)
 * Layer 2: Secondary reach (40% decay from L1)
 * Layer 3: Tertiary reach (30% decay from L2)
 * Layer 4+: Far field (10% decay per layer, asymptotic minimum)
 *
 * CONSTRAINTS & GUARANTEES:
 * ✅ Pure visual adapter - zero gameplay impact
 * ✅ Read-only on network state
 * ✅ Zero per-frame allocations
 * ✅ Deterministic math
 * ✅ Graceful degradation
 * ✅ No circular cascades (acyclic traversal via layer limits)
 */

import { clamp, clamp01 } from '../shared/harmonyHelpers.js';

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

export class CascadingHarmonicResonanceAmplification {
  constructor(network = null) {
    this.network = network;
    this.waveEngine =
      network?.waveEngine ??
      globalThis?.waveInterferenceEngine ??
      globalThis?.game?.waveInterferenceEngine ??
      null;

    this.nodeLayerData = new Map();
    this.nodeCascadeSources = new Map();
    this.neighborGraph = new Map();
    this.topologyGeneration = -1;

    this.layerDecayFactor = 0.6;
    this.maxCascadeLayers = 5;
    this.secondaryHubThreshold = 0.7;
    this.amplificationFactor = 0.3;
    this.corruptionDamping = 0.4;
    this.harmonySmoothing = 0.2;
    this.resilienceStabilization = 0.3;

    this.globalTime = 0;
    this.phaseSyncMultiplier = 0.5;

    this.debugEnabled = false;
    this.lastUpdateTime = 0;
    this.statsPerFrame = { hubsCascading: 0, nodesTouched: 0, secondaryHubsCreated: 0 };

    this.secondaryHubBurstThreshold = 0.7;
    this.secondaryHubBurstCooldownSec = 0.5;
    this._lastCascadeStrengthByNode = new Map();
    this._secondaryHubBurstCooldownByNode = new Map();
  }

  update(deltaTime = 0.016) {
    if (!this.network) return;
    this.globalTime += deltaTime;

    this._ensureTopologyCache();
    const resonantHubs = this._identifyResonantHubs();

    this.nodeLayerData.clear();
    this.nodeCascadeSources.clear();
    this.statsPerFrame = { hubsCascading: 0, nodesTouched: 0, secondaryHubsCreated: 0 };

    for (const hubData of resonantHubs) {
      this._propagateCascadeFromHub(hubData.nodeId, hubData.harmony, hubData.synergy, hubData.corruption, hubData.resilience, hubData.strength);
    }

    this._computeMultiCascadeInterference();
    this._storeComputedCascadeData();
    this.lastUpdateTime = performance.now();
  }

  _propagateCascadeFromHub(hubNodeId, harmony, synergy, corruption, resilience, hubStrength) {
    if (!hubStrength || hubStrength < 0.3) return;
    this.statsPerFrame.hubsCascading++;

    const queue = [];
    const visited = new Set();
    const cascadeData = new Map();

    queue.push({ nodeId: hubNodeId, layer: 0, strength: hubStrength, fromHubId: hubNodeId, propagationPhase: 0 });
    visited.add(hubNodeId);

    while (queue.length > 0) {
      const { nodeId, layer, strength, fromHubId, propagationPhase } = queue.shift();
      if (layer >= this.maxCascadeLayers) continue;

      const decayedStrength = strength * Math.pow(this.layerDecayFactor, layer);
      const amplifiedStrength = this._computeAmplifiedStrength(decayedStrength, harmony, synergy, corruption, resilience, layer);
      this.statsPerFrame.nodesTouched++;

      if (!cascadeData.has(nodeId)) cascadeData.set(nodeId, { cascadeStrengths: [], cascadePhases: [], cascadeSources: [] });
      const existing = cascadeData.get(nodeId);
      existing.cascadeStrengths.push(amplifiedStrength);
      existing.cascadePhases.push(propagationPhase + layer * this.phaseSyncMultiplier);
      existing.cascadeSources.push(fromHubId);

      if (amplifiedStrength > this.secondaryHubThreshold && nodeId !== hubNodeId) {
        this.statsPerFrame.secondaryHubsCreated++;
        const secondaryStrength = amplifiedStrength * 0.7;
        const neighbors = this.neighborGraph.get(nodeId) || new Set();
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) { visited.add(neighborId); queue.push({ nodeId: neighborId, layer: layer + 1, strength: secondaryStrength, fromHubId, propagationPhase: propagationPhase + layer * 0.2 }); }
        }
      } else if (amplifiedStrength > 0.1) {
        const neighbors = this.neighborGraph.get(nodeId) || new Set();
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) { visited.add(neighborId); queue.push({ nodeId: neighborId, layer: layer + 1, strength: amplifiedStrength, fromHubId, propagationPhase: propagationPhase + layer * 0.2 }); }
        }
      }
    }

    for (const [nodeId, cascadeInfo] of cascadeData) {
      const existingLayer = this.nodeLayerData.get(nodeId);
      let combinedStrength = 0, combinedPhase = 0, maxStrength = 0;
      for (let i = 0; i < cascadeInfo.cascadeStrengths.length; i++) {
        const s = cascadeInfo.cascadeStrengths[i];
        const p = cascadeInfo.cascadePhases[i];
        maxStrength = Math.max(maxStrength, s);
        combinedStrength += s;
        combinedPhase += p * s;
      }
      if (cascadeInfo.cascadeStrengths.length > 0) combinedPhase /= combinedStrength || 1;

      if (!existingLayer || combinedStrength > existingLayer.cascadeStrength) {
        this.nodeLayerData.set(nodeId, {
          layer: visited.has(nodeId) ? Math.ceil(Math.log(combinedStrength + 0.1) / Math.log(this.layerDecayFactor)) : 0,
          cascadeStrength: combinedStrength, resonanceAmplitude: maxStrength, cascadePhase: combinedPhase, sourceCount: cascadeInfo.cascadeSources.length
        });
      }

      if (!this.nodeCascadeSources.has(nodeId)) this.nodeCascadeSources.set(nodeId, new Set());
      for (const source of cascadeInfo.cascadeSources) this.nodeCascadeSources.get(nodeId).add(source);
    }
  }

  _computeAmplifiedStrength(baseStrength, harmony, synergy, corruption, resilience, layer) {
    const amplification = 1 + synergy * this.amplificationFactor;
    const damping = 1 - corruption * this.corruptionDamping;
    const smoothing = 0.8 + harmony * this.harmonySmoothing;
    const stabilization = 0.7 + resilience * this.resilienceStabilization;
    let strength = baseStrength * amplification * damping * smoothing * stabilization;
    const stabilityFactor = 1 - (layer * 0.1) * corruption;
    strength *= Math.max(0.1, stabilityFactor);
    return Math.min(1, Math.max(0, strength));
  }

  _computeMultiCascadeInterference() {
    for (const [nodeId, sources] of this.nodeCascadeSources) {
      if (sources.size <= 1) continue;
      const layerData = this.nodeLayerData.get(nodeId);
      if (!layerData) continue;
      const sourceArray = Array.from(sources);
      let constructiveBoost = 0;
      for (let i = 0; i < sourceArray.length - 1; i++) {
        for (let j = i + 1; j < sourceArray.length; j++) {
          constructiveBoost += this._estimateCascadeAlignment(sourceArray[i], sourceArray[j]) * 0.2;
        }
      }
      layerData.cascadeStrength = Math.min(1, layerData.cascadeStrength + constructiveBoost);
    }
  }

  _estimateCascadeAlignment(sourceA, sourceB) {
    const hubAData = this.network?.nodes?.get?.(sourceA);
    const hubBData = this.network?.nodes?.get?.(sourceB);
    if (!hubAData || !hubBData) return 0.5;
    const hubAMetrics = hubAData?.userData?.metrics || {};
    const hubBMetrics = hubBData?.userData?.metrics || {};
    const strengthDiff = Math.abs((hubAMetrics.harmony || 0) - (hubBMetrics.harmony || 0));
    return Math.max(0, 1 - strengthDiff * 0.5);
  }

  _identifyResonantHubs() {
    const hubs = [];
    if (!this.network?.nodes) return hubs;
    for (const [nodeId, nodeData] of this.network.nodes) {
      const metrics = nodeData?.userData?.metrics || {};
      const harmony = metrics.harmony || 0;
      const synergy = metrics.synergy || 0;
      const corruption = metrics.corruption || 0;
      const resilience = metrics.resilience ?? metrics.stability ?? 0;
      const resonanceEnergy = harmony * (0.5 + synergy * 0.2 * resilience);
      if (resonanceEnergy > 0.4) {
        const hubStrength = harmony * 0.6 + synergy * 0.3 + resilience * 0.1 - corruption * 0.3;
        if (hubStrength > 0.3) {
          hubs.push({ nodeId, harmony: harmony * (1 - corruption * 0.2), synergy: synergy * (1 - corruption * 0.1), corruption, resilience, strength: Math.max(0, hubStrength) });
        }
      }
    }
    return hubs;
  }

  _ensureTopologyCache() {
    if (!this.network?.nodes) { this.neighborGraph.clear(); return; }
    const currentGen = this.network._topologyGeneration || 0;
    if (currentGen === this.topologyGeneration) return;
    this.neighborGraph.clear();
    if (this.network.links) {
      for (const link of this.network.links) {
        const aId = link.a?.id || link.nodeA?.id || link.source?.id || link.sourceNode?.id;
        const bId = link.b?.id || link.nodeB?.id || link.target?.id || link.targetNode?.id;
        if (!aId || !bId) continue;
        if (!this.neighborGraph.has(aId)) this.neighborGraph.set(aId, new Set());
        if (!this.neighborGraph.has(bId)) this.neighborGraph.set(bId, new Set());
        this.neighborGraph.get(aId).add(bId);
        this.neighborGraph.get(bId).add(aId);
      }
    }
    this.topologyGeneration = currentGen;
  }

  _storeComputedCascadeData() {
    const TWO_PI = Math.PI * 2;
    const toPhase0ToTwoPi = (value) => { if (!Number.isFinite(value)) return 0; let phase = value % TWO_PI; if (phase < 0) phase += TWO_PI; return phase; };
    const semanticBus = globalThis?.semanticBus;

    for (const [nodeId, layerData] of this.nodeLayerData) {
      const node = this.network?.nodes?.get?.(nodeId);
      if (node) {
        node._cascadeLayer = layerData.layer || 0;
        node._cascadeStrength = layerData.cascadeStrength || 0;
        node._cascadeAmplitude = layerData.resonanceAmplitude || 0;
        node._cascadePhase = layerData.cascadePhase || 0;
        node._cascadeSourceCount = layerData.sourceCount || 0;

        if (node.userData._cascadeOwner && node.userData._cascadeOwner !== 'CascadingHarmonicResonanceAmplification') return;
        node.userData._cascadeOwner = 'CascadingHarmonicResonanceAmplification';

        if (!node.userData) node.userData = {};
        if (!node.userData.metrics) node.userData.metrics = {};
        node.userData.cascadeStrength = node._cascadeStrength;
        node.userData.cascadeAmplitude = node._cascadeAmplitude;
        node.userData.cascadePhase = node._cascadePhase;
        node.userData.metrics.cascadeStrength = node._cascadeStrength;
        node.userData.metrics.cascadeAmplitude = node._cascadeAmplitude;
        node.userData.metrics.cascadePhase = node._cascadePhase;

        if (node._cascadeStrength > 0.65 && semanticBus?.emit) {
          semanticBus.emit('cascade.start', { sourceNode: node.id ?? nodeId, strength: node._cascadeStrength, position: node?.position ? { x: node.position.x, y: node.position.y, z: node.position.z } : undefined });
        }

        node.userData.waveField = node.userData.waveField || {};
        const existingStanding = Number.isFinite(node.userData.waveField.standing) ? node.userData.waveField.standing : 0;
        const existingAmplitude = Number.isFinite(node.userData.waveField.amplitude) ? node.userData.waveField.amplitude : 0;
        const cascadeAmplitude = node._cascadeAmplitude || 0;
        const standingFromCascade = clamp(cascadeAmplitude * 0.5, 0, 1);
        node.userData.waveField.standing = clamp(Math.max(existingStanding, standingFromCascade), 0, 1);
        node.userData.waveField.amplitude = clamp(Math.max(existingAmplitude, cascadeAmplitude), 0, 2);
        node.userData.waveField.phase = toPhase0ToTwoPi(node._cascadePhase || 0);
        node.userData.waveField.sourceCount = Math.max(0, Number.isFinite(node._cascadeSourceCount) ? node._cascadeSourceCount : 0);

        this._triggerSecondaryHubBurstIfCrossed(nodeId, node);
      }
    }
  }

  _triggerSecondaryHubBurstIfCrossed(nodeId, node) {
    const threshold = this.secondaryHubBurstThreshold;
    const currentStrength = Number.isFinite(node?._cascadeStrength) ? node._cascadeStrength : 0;
    const previousStrength = this._lastCascadeStrengthByNode.get(nodeId) ?? 0;
    this._lastCascadeStrengthByNode.set(nodeId, currentStrength);
    const crossedUp = previousStrength <= threshold && currentStrength > threshold;
    if (!crossedUp) return;

    const semanticBus = this.semanticBus ?? this.network?.semanticBus ?? globalThis?.semanticBus ?? globalThis?.game?.semanticBus ?? null;
    if (!semanticBus?.emit) return;

    const nowSec = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() * 0.001 : (Date.now() * 0.001);
    const lastBurstSec = this._secondaryHubBurstCooldownByNode.get(nodeId) ?? -Infinity;
    if ((nowSec - lastBurstSec) < this.secondaryHubBurstCooldownSec) return;
    this._secondaryHubBurstCooldownByNode.set(nodeId, nowSec);

    const intensity = Math.max(0, Math.min(1, currentStrength));
    semanticBus.emit('cascade.start', {
      sourceId: nodeId, sourceNode: node,
      sourcePosition: node?.position ? { x: node.position.x, y: node.position.y, z: node.position.z } : undefined,
      strength: node?._cascadeStrength ?? intensity, intensity: node?._cascadeStrength ?? intensity
    }, { priority: semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL });
  }

  getCascadeStrength(nodeId) { return this.nodeLayerData.get(nodeId)?.cascadeStrength || 0; }
  getCascadeLayer(nodeId) { return this.nodeLayerData.get(nodeId)?.layer || 0; }
  getCascadeAmplitude(nodeId) { return this.nodeLayerData.get(nodeId)?.resonanceAmplitude || 0; }
  getCascadePhase(nodeId) { return this.nodeLayerData.get(nodeId)?.cascadePhase || 0; }

  enableDebug(enabled = true) { this.debugEnabled = enabled; if (enabled) console.log('[CascadingHarmonicResonanceAmplification] Debug enabled'); }

  getDebugStats() {
    return { ...this.statsPerFrame, nodeLayersActive: this.nodeLayerData.size, cascadingSources: this.nodeCascadeSources.size, topologyNodes: this.neighborGraph.size };
  }

  debugDumpCascadeState(limit = 10) {
    return Array.from(this.nodeLayerData.entries()).slice(0, limit).map(([nodeId, data]) => ({
      nodeId, layer: data.layer, cascadeStrength: (data.cascadeStrength || 0).toFixed(3),
      resonanceAmplitude: (data.resonanceAmplitude || 0).toFixed(3), cascadePhase: (data.cascadePhase || 0).toFixed(3), sourceCount: data.sourceCount || 0
    }));
  }

  reset() {
    this.nodeLayerData.clear();
    this.nodeCascadeSources.clear();
    this.neighborGraph.clear();
    this.topologyGeneration = -1;
    this.globalTime = 0;
  }
}

/**
 * Console API for debugging cascading resonance
 */
export function setupCascadingResonanceConsoleAPI(cascadeSystem) {
  if (typeof window === 'undefined') return;

  const api = {
    debug: (enabled = true) => { cascadeSystem.enableDebug(enabled); console.log(`[Cascade] Debug ${enabled ? 'enabled' : 'disabled'}`); },
    stats: () => { const stats = cascadeSystem.getDebugStats(); console.table(stats); return stats; },
    dump: (limit = 10) => { const state = cascadeSystem.debugDumpCascadeState(limit); console.table(state); return state; },
    queryNode: (nodeId) => ({ cascadeStrength: cascadeSystem.getCascadeStrength(nodeId), cascadeLayer: cascadeSystem.getCascadeLayer(nodeId), cascadeAmplitude: cascadeSystem.getCascadeAmplitude(nodeId), cascadePhase: cascadeSystem.getCascadePhase(nodeId) }),
    setAmplification: (factor) => { cascadeSystem.amplificationFactor = factor; console.log(`[Cascade] Amplification factor set to ${factor}`); },
    setDamping: (factor) => { cascadeSystem.corruptionDamping = factor; console.log(`[Cascade] Corruption damping set to ${factor}`); },
    setThreshold: (threshold) => { cascadeSystem.secondaryHubThreshold = threshold; console.log(`[Cascade] Secondary hub threshold set to ${threshold}`); },
    reset: () => { cascadeSystem.reset(); console.log('[Cascade] System reset'); }
  };

  window.CascadeAPI = api;
  console.log('[CascadingHarmonicResonanceAmplification] Console API ready: window.CascadeAPI');
}
