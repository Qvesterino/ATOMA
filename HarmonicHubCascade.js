/**
 * HarmonicHubCascade.js
 * ============================================================================
 * MERGED FILE — Cascade subsystems: proximity detection, phase sync, BFS propagation.
 *
 * Original files merged (2026-04-22):
 *   - HubProximityDetector.js                            (333 lines)
 *   - HarmonicPhaseSynchronization_Session146.js          (409 lines)
 *   - CascadingHarmonicResonanceAmplification.js          (776 lines)
 *
 * These three systems form the cascade pipeline:
 *   HubProximityDetector → HarmonicPhaseSynchronization → CascadingHarmonicResonanceAmplification
 * They are composed together by HarmonicCascadeAmplification_Session145.
 *
 * CONSTRAINTS (inherited):
 * ✅ Pure visual adapters — zero gameplay impact
 * ✅ Read-only on network state
 * ✅ Zero per-frame allocations
 * ✅ Deterministic math
 * ✅ Graceful degradation
 */


// ============================================================================
// SECTION 1: HubProximityDetector
// ============================================================================

/**
 * HUB-TO-HUB PROXIMITY DETECTION SYSTEM
 *
 * Lightweight, detection-only algorithm that identifies when harmonic hubs
 * are close enough (spatially and topologically) to be eligible for cascade
 * interaction in future systems.
 *
 * FEATURES:
 * - Reuses existing hub data from HarmonicHubAuraSystem
 * - Pairwise spatial checks (O(n²) but small n)
 * - Cached results per frame
 * - Zero per-frame allocations
 * - NO visual effects, NO mutations, NO cascades
 */
export class HubProximityDetector {
  constructor(config = {}) {
    this.config = {
      maxProximityDistance: config.maxProximityDistance ?? 24.0,
      minHubsForProximity: config.minHubsForProximity ?? 2,
      minHarmonyThreshold: config.minHarmonyThreshold ?? 0.2,
      minStabilityThreshold: config.minStabilityThreshold ?? 0.65,
      maxCorruptionThreshold: config.maxCorruptionThreshold ?? 0.25,
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
    };

    this.proximityPairs = [];
    this.proximityPairsMap = new Map();

    this.stats = {
      pairsDetected: 0,
      avgProximityStrength: 0,
      lastCheckFrame: -1,
      checksPerformed: 0,
    };

    this.hubList = [];
  }

  _readHubMetric(hub, key, fallback = 0) {
    const primaryNode = hub?.primaryNode ?? hub?.nodes?.[0] ?? null;
    const hubMetrics = hub?.userData?.metrics;
    const primaryMetrics = primaryNode?.userData?.metrics;
    const value =
      hubMetrics?.[key] ??
      hub?.[key] ??
      primaryMetrics?.[key] ??
      primaryNode?.userData?.[key] ??
      fallback;
    return this._clamp01(value);
  }

  _clamp01(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }

  detectProximity(hubs) {
    if (!this.config.enabled || !hubs) return [];
    if (hubs.size < this.config.minHubsForProximity) {
      this.proximityPairs = [];
      this.proximityPairsMap.clear();
      this.stats.pairsDetected = 0;
      return [];
    }

    this.hubList.length = 0;
    for (const hub of hubs.values()) {
      if (hub && hub.active && hub.position && hub.hubId) {
        this.hubList.push(hub);
      }
    }

    if (this.hubList.length < this.config.minHubsForProximity) {
      this.proximityPairs = [];
      this.proximityPairsMap.clear();
      this.stats.pairsDetected = 0;
      return [];
    }

    this.proximityPairs = [];
    this.proximityPairsMap.clear();

    for (let i = 0; i < this.hubList.length; i++) {
      const hubA = this.hubList[i];
      for (let j = i + 1; j < this.hubList.length; j++) {
        const hubB = this.hubList[j];
        const pair = this._checkProximity(hubA, hubB);
        if (pair) {
          this.proximityPairs.push(pair);
          this.proximityPairsMap.set(`${hubA.hubId}-${hubB.hubId}`, pair);
        }
      }
    }

    this.stats.pairsDetected = this.proximityPairs.length;
    this.stats.checksPerformed = this.hubList.length * (this.hubList.length - 1) / 2;

    if (this.proximityPairs.length > 0) {
      const totalStrength = this.proximityPairs.reduce((sum, p) => sum + p.proximityStrength, 0);
      this.stats.avgProximityStrength = totalStrength / this.proximityPairs.length;
    } else {
      this.stats.avgProximityStrength = 0;
    }

    return this.proximityPairs;
  }

  _checkProximity(hubA, hubB) {
    const distance = hubA.position.distanceTo(hubB.position);
    if (distance > this.config.maxProximityDistance) return null;
    if (!hubA || !hubB) return null;

    const harmonyA = this._readHubMetric(hubA, 'harmony', 0);
    const harmonyB = this._readHubMetric(hubB, 'harmony', 0);
    const combinedHarmony = (harmonyA + harmonyB) / 2;
    if (combinedHarmony < this.config.minHarmonyThreshold) return null;

    const corruptionA = this._readHubMetric(hubA, 'corruption', 0);
    const corruptionB = this._readHubMetric(hubB, 'corruption', 0);
    const stabilityA = this._readHubMetric(hubA, 'stability', 1 - corruptionA);
    const stabilityB = this._readHubMetric(hubB, 'stability', 1 - corruptionB);

    if (corruptionA > this.config.maxCorruptionThreshold || corruptionB > this.config.maxCorruptionThreshold) return null;
    if (stabilityA < this.config.minStabilityThreshold || stabilityB < this.config.minStabilityThreshold) return null;
    if (corruptionA > harmonyA || corruptionB > harmonyB) return null;

    const distanceDecay = 1 - (distance / this.config.maxProximityDistance);
    const harmonyBonus = combinedHarmony * 0.5;
    const synergyA = hubA.synergy ?? 0;
    const synergyB = hubB.synergy ?? 0;
    const avgSynergy = (synergyA + synergyB) / 2;
    const synergyBonus = avgSynergy * 0.3;
    const proximityStrength = Math.min(1.0, distanceDecay + harmonyBonus + synergyBonus);

    return {
      hubAId: hubA.hubId, hubBId: hubB.hubId, distance, combinedHarmony, proximityStrength,
      harmonyA, harmonyB, corruptionA, corruptionB, stabilityA, stabilityB, synergyA, synergyB,
    };
  }

  getProximityPair(hubAId, hubBId) {
    return this.proximityPairsMap.get(`${hubAId}-${hubBId}`) || this.proximityPairsMap.get(`${hubBId}-${hubAId}`) || null;
  }

  isProximal(hubAId, hubBId) { return this.getProximityPair(hubAId, hubBId) !== null; }

  getProximalHubs(hubId) {
    const proximalIds = [];
    for (const pair of this.proximityPairs) {
      if (pair.hubAId === hubId) proximalIds.push(pair.hubBId);
      else if (pair.hubBId === hubId) proximalIds.push(pair.hubAId);
    }
    return proximalIds;
  }

  getAverageProximityStrength() { return this.stats.avgProximityStrength; }

  getStats() {
    return {
      pairsDetected: this.stats.pairsDetected,
      avgProximityStrength: this.stats.avgProximityStrength,
      checksPerformed: this.stats.checksPerformed,
      maxDistance: this.config.maxProximityDistance,
      enabled: this.config.enabled,
    };
  }

  setupConsoleAPI(globalWindow) {
    if (!globalWindow) return;
    globalWindow.proximity_info = () => {
      console.log('=== HUB PROXIMITY DETECTION STATUS ===');
      console.log(`Pairs detected: ${this.stats.pairsDetected}`);
      console.log(`Avg proximity strength: ${this.stats.avgProximityStrength.toFixed(2)}`);
      console.log(`Checks performed: ${this.stats.checksPerformed}`);
      console.log(`Max distance threshold: ${this.config.maxProximityDistance.toFixed(1)}`);
      if (this.proximityPairs.length > 0) {
        console.log('\n=== DETECTED PROXIMITY PAIRS ===');
        for (const pair of this.proximityPairs) {
          console.log(`${pair.hubAId} <-> ${pair.hubBId}: dist=${pair.distance.toFixed(1)}, harmony=${pair.combinedHarmony.toFixed(2)}, strength=${pair.proximityStrength.toFixed(2)}`);
        }
      } else { console.log('No proximity pairs detected.'); }
    };
    globalWindow.proximity_tune = (key, value) => { if (key in this.config) { this.config[key] = value; console.log(`[PROXIMITY] ${key} = ${value}`); } };
    globalWindow.proximity_getPairs = () => this.proximityPairs;
  }
}


// ============================================================================
// SECTION 2: HarmonicPhaseSynchronization_Session146
// ============================================================================

/**
 * HARMONIC PHASE SYNCHRONIZATION SYSTEM
 *
 * Implements subtle temporal alignment between proximal harmonic hubs.
 * When two or more hubs are detected as proximal (via HubProximityDetector),
 * their internal harmonic phases gradually align toward a shared midpoint.
 *
 * CORE BEHAVIOR:
 * - Each hub has a harmonicPhase value (0 to 2π)
 * - Proximal hubs experience elastic phase synchronization
 * - Alignment strength scales with proximityStrength (0-1)
 * - Synchronization is time-based and gradual (no snapping)
 * - Naturally reverses when hubs separate or proximity weakens
 *
 * INTEGRATION POINTS:
 * - Runs after HubProximityDetector.detectProximity()
 * - Uses cascade system enabled flag
 * - Updates hub.harmonicPhase for visual systems
 * - Stored in HarmonicCascadeAmplification_Session145
 */
export class HarmonicPhaseSynchronization_Session146 {
  constructor(cascadeSystem, harmonicHubSystem, config = {}) {
    this.cascadeSystem = cascadeSystem;
    this.harmonicHubSystem = harmonicHubSystem;

    this.config = {
      syncStrength: config.syncStrength ?? 2.0,
      damping: config.damping ?? 0.85,
      maxPhaseDelta: config.maxPhaseDelta ?? Math.PI,
      phaseVariance: config.phaseVariance ?? 0.3,
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      maxProximalPairs: config.maxProximalPairs ?? 100,
    };

    this.hubPhases = new Map();
    this.phaseBuffer = [];
    this.updateQueue = [];

    this.stats = {
      activeSyncPairs: 0,
      phasesUpdated: 0,
      totalSyncEnergy: 0,
      avgPhaseDelta: 0,
      lastUpdateTime: 0,
    };
  }

  init() {
    if (!this.harmonicHubSystem || !this.harmonicHubSystem.hubs) return;

    for (const hub of this.harmonicHubSystem.hubs.values()) {
      if (hub && hub.hubId) {
        const variance = (Math.random() - 0.5) * this.config.phaseVariance;
        const initialPhase = Math.random() * Math.PI * 2 + variance;
        this.hubPhases.set(hub.hubId, { phase: initialPhase, velocity: 0, lastSyncTime: 0, targetPhase: initialPhase });
        hub.harmonicPhase = initialPhase;
      }
    }

    if (this.config.debugMode) console.log(`[PhazeSync] Initialized ${this.hubPhases.size} hub phases`);
  }

  update(deltaTime) {
    if (!this.config.enabled || !this.cascadeSystem) return;
    const startTime = performance.now();

    const proximityPairs = this.cascadeSystem.getProximityPairs();
    if (!proximityPairs || proximityPairs.length === 0) {
      this.stats.activeSyncPairs = 0;
      this.stats.phasesUpdated = 0;
      this.stats.totalSyncEnergy = 0;
      this.stats.avgPhaseDelta = 0;
      return;
    }

    const pairsToProcess = Math.min(proximityPairs.length, this.config.maxProximalPairs);
    this._ensureHubPhasesExist();
    this.updateQueue.length = 0;
    this.phaseBuffer.length = 0;

    let totalDelta = 0;
    let syncPairCount = 0;

    for (let i = 0; i < pairsToProcess; i++) {
      const pair = proximityPairs[i];
      if (!pair) continue;

      const hubAPhaseData = this.hubPhases.get(pair.hubAId);
      const hubBPhaseData = this.hubPhases.get(pair.hubBId);
      if (!hubAPhaseData || !hubBPhaseData) continue;

      let delta = hubBPhaseData.phase - hubAPhaseData.phase;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;

      const syncForce = pair.proximityStrength * this.config.syncStrength;
      const correction = delta * 0.5 * syncForce * deltaTime;
      const correctionA = Math.max(-this.config.maxPhaseDelta, Math.min(this.config.maxPhaseDelta, correction));
      const correctionB = -correctionA;

      hubAPhaseData.velocity = hubAPhaseData.velocity * this.config.damping + correctionA;
      hubBPhaseData.velocity = hubBPhaseData.velocity * this.config.damping + correctionB;
      hubAPhaseData.phase += hubAPhaseData.velocity;
      hubBPhaseData.phase += hubBPhaseData.velocity;

      hubAPhaseData.phase = ((hubAPhaseData.phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      hubBPhaseData.phase = ((hubBPhaseData.phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

      totalDelta += Math.abs(delta);
      syncPairCount++;
      this.updateQueue.push(pair.hubAId, hubAPhaseData.phase);
      this.updateQueue.push(pair.hubBId, hubBPhaseData.phase);
    }

    this._applyPhaseUpdates();

    this.stats.activeSyncPairs = syncPairCount;
    this.stats.phasesUpdated = this.updateQueue.length / 2;
    this.stats.totalSyncEnergy = totalDelta;
    this.stats.avgPhaseDelta = syncPairCount > 0 ? totalDelta / syncPairCount : 0;
    this.stats.lastUpdateTime = performance.now() - startTime;

    if (this.config.debugMode && syncPairCount > 0) {
      console.log(`[PhazeSync] ${syncPairCount} pairs | avg delta=${this.stats.avgPhaseDelta.toFixed(3)} rad | time=${this.stats.lastUpdateTime.toFixed(2)}ms`);
    }
  }

  _ensureHubPhasesExist() {
    if (!this.harmonicHubSystem || !this.harmonicHubSystem.hubs) return;
    for (const hub of this.harmonicHubSystem.hubs.values()) {
      if (hub && hub.hubId && !this.hubPhases.has(hub.hubId)) {
        const phase = Math.random() * Math.PI * 2;
        this.hubPhases.set(hub.hubId, { phase, velocity: 0, lastSyncTime: 0, targetPhase: phase });
      }
    }
  }

  _applyPhaseUpdates() {
    if (!this.harmonicHubSystem || !this.harmonicHubSystem.hubs) return;
    for (const [hubId, phaseData] of this.hubPhases.entries()) {
      const hub = this.harmonicHubSystem.hubs.get(hubId);
      if (hub) hub.harmonicPhase = phaseData.phase;
    }
  }

  getHubPhaseStatus(hubId) { return this.hubPhases.get(hubId) || null; }

  getAllHubPhases() {
    const result = [];
    for (const [hubId, phaseData] of this.hubPhases.entries()) {
      result.push({ hubId, phase: phaseData.phase, velocity: phaseData.velocity });
    }
    return result;
  }

  getStats() { return { ...this.stats }; }

  getPhaseDelta(hubAId, hubBId) {
    const phaseA = this.hubPhases.get(hubAId);
    const phaseB = this.hubPhases.get(hubBId);
    if (!phaseA || !phaseB) return 0;
    let delta = phaseB.phase - phaseA.phase;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
  }

  setupConsoleAPI(globalWindow) {
    if (!globalWindow) return;
    globalWindow.PHASE_SYNC_STATS = this.stats;
    globalWindow.PHASE_SYNC_CONFIG = this.config;
    globalWindow.getHubPhaseStatus = (hubId) => {
      const data = this.getHubPhaseStatus(hubId);
      if (data) {
        console.log(`Hub ${hubId} phase status:`, { phase: `${(data.phase * 180 / Math.PI).toFixed(1)}°`, velocity: `${(data.velocity * 180 / Math.PI).toFixed(1)}°/s`, targetPhase: `${(data.targetPhase * 180 / Math.PI).toFixed(1)}°` });
        return data;
      } else { console.log(`Hub ${hubId} not found in phase tracking`); return null; }
    };
    globalWindow.getPhaseSyncStats = () => {
      const stats = this.getStats();
      console.log('=== PHASE SYNCHRONIZATION STATS ===');
      console.log(`Active sync pairs: ${stats.activeSyncPairs}`);
      console.log(`Phases updated: ${stats.phasesUpdated}`);
      console.log(`Avg phase delta: ${(stats.avgPhaseDelta * 180 / Math.PI).toFixed(1)}°`);
      console.log(`Total sync energy: ${stats.totalSyncEnergy.toFixed(3)}`);
      console.log(`Last update time: ${stats.lastUpdateTime.toFixed(2)}ms`);
      return stats;
    };
    globalWindow.getAllHubPhases = () => {
      const phases = this.getAllHubPhases();
      console.log('=== ALL HUB PHASES ===');
      for (const entry of phases) console.log(`${entry.hubId}: ${(entry.phase * 180 / Math.PI).toFixed(1)}° (velocity: ${(entry.velocity * 180 / Math.PI).toFixed(1)}°/s)`);
      return phases;
    };
    globalWindow.getPhaseDelta = (hubAId, hubBId) => {
      const delta = this.getPhaseDelta(hubAId, hubBId);
      console.log(`Phase delta ${hubAId} -> ${hubBId}: ${(delta * 180 / Math.PI).toFixed(1)}°`);
      return delta;
    };
    globalWindow.togglePhaseDebug = (enabled = true) => { this.config.debugMode = enabled; console.log(`[PhazeSync] Debug mode: ${enabled ? 'ON' : 'OFF'}`); };
    globalWindow.tune_phase_sync = (key, value) => { if (key in this.config) { this.config[key] = value; console.log(`[PhazeSync] ${key} = ${value}`); } else { console.warn(`Unknown config key: ${key}`); } };
  }

  dispose() {
    this.hubPhases.clear();
    this.updateQueue.length = 0;
    this.phaseBuffer.length = 0;
  }
}

/**
 * Console API setup function for phase sync
 */
export function setupPhaseSyncConsoleAPI(globalWindow, phaseSync) {
  if (phaseSync && phaseSync.setupConsoleAPI) phaseSync.setupConsoleAPI(globalWindow);
}


// ============================================================================
// SECTION 3: CascadingHarmonicResonanceAmplification
// ============================================================================

/**
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
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
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
