/**
 * harmonic/HarmonicPhaseSynchronization_Session146.js
 * ============================================================================
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
 *
 * CONSTRAINTS:
 * ✅ Pure visual adapter — zero gameplay impact
 * ✅ Read-only on network state
 * ✅ Zero per-frame allocations
 * ✅ Deterministic math
 * ✅ Graceful degradation
 */

import { normalizePhase } from '../shared/harmonyHelpers.js';

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
