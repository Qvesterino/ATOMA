/**
 * Canonical semantic link metrics bridge (0-1 normalized).
 */

const NEUTRAL_VALUE = 0.5;
const WRITE_EPSILON = 1e-4;

function clamp01(value) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function readMetric(metrics, key) {
  const value = metrics?.[key];
  return (typeof value === 'number' && Number.isFinite(value)) ? value : NEUTRAL_VALUE;
}

function shouldWrite(currentValue, nextValue) {
  return typeof currentValue !== 'number' || Math.abs(currentValue - nextValue) > WRITE_EPSILON;
}

export class LinkSemanticMetricsBridge_v1 {
  constructor(linkingSystem = null) {
    this.enabled = true;
    this.linkingSystem = linkingSystem;
    this.lastUpdatedLinks = 0;
  }

  setLinkingSystem(linkingSystem) {
    this.linkingSystem = linkingSystem;
  }

  update(_deltaTime = 0) {
    if (!this.enabled || !this.linkingSystem) return 0;

    const links = this.linkingSystem.links;
    if (!links || links.length === 0) {
      this.lastUpdatedLinks = 0;
      return 0;
    }

    let updated = 0;

    for (let i = 0, n = links.length; i < n; i++) {
      const link = links[i];
      if (!link) continue;

      const userData = link.userData;
      if (!userData) continue;

      const nodeA = userData.nodeA || link.source || link.nodeA;
      const nodeB = userData.nodeB || link.target || link.nodeB;
      if (!nodeA || !nodeB) continue;

      const metricsA = nodeA.userData?.metrics;
      const metricsB = nodeB.userData?.metrics;

      const harmonyA = clamp01(readMetric(metricsA, 'harmony'));
      const harmonyB = clamp01(readMetric(metricsB, 'harmony'));
      const corruptionA = clamp01(readMetric(metricsA, 'corruption'));
      const corruptionB = clamp01(readMetric(metricsB, 'corruption'));

      const harmony = clamp01((harmonyA + harmonyB) * 0.5);
      const corruption = clamp01((corruptionA + corruptionB) * 0.5);
      const compatibility = clamp01(1 - Math.abs(harmonyA - harmonyB));
      const synergy = clamp01(harmony * compatibility);

      let changed = false;
      if (shouldWrite(userData.harmony, harmony)) {
        userData.harmony = harmony;
        changed = true;
      }
      if (shouldWrite(userData.corruption, corruption)) {
        userData.corruption = corruption;
        changed = true;
      }
      if (shouldWrite(userData.synergy, synergy)) {
        changed = true;
      }

      if (changed) updated++;
    }

    this.lastUpdatedLinks = updated;
    return updated;
  }
}


