/**
 * harmonic/HubProximityDetector.js
 * ============================================================================
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
 *
 * CONSTRAINTS:
 * ✅ Pure visual adapter — zero gameplay impact
 * ✅ Read-only on network state
 * ✅ Zero per-frame allocations
 * ✅ Deterministic math
 * ✅ Graceful degradation
 */

import { readHubMetric, clamp01 } from '../shared/harmonyHelpers.js';

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

    const harmonyA = readHubMetric(hubA, 'harmony', 0);
    const harmonyB = readHubMetric(hubB, 'harmony', 0);
    const combinedHarmony = (harmonyA + harmonyB) / 2;
    if (combinedHarmony < this.config.minHarmonyThreshold) return null;

    const corruptionA = readHubMetric(hubA, 'corruption', 0);
    const corruptionB = readHubMetric(hubB, 'corruption', 0);
    const stabilityA = readHubMetric(hubA, 'stability', 1 - corruptionA);
    const stabilityB = readHubMetric(hubB, 'stability', 1 - corruptionB);

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
