/**
 * Canonical semantic link metrics bridge (0-1 normalized).
 *
 * Canonical link metrics are the source of truth; cascade intensity is derived from them.
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
      const linkMetrics = userData.metrics || (userData.metrics = {});

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
        userData.synergy = synergy;
        changed = true;
      }

      if (shouldWrite(linkMetrics.harmony, harmony)) {
        linkMetrics.harmony = harmony;
        changed = true;
      }
      if (shouldWrite(linkMetrics.corruption, corruption)) {
        linkMetrics.corruption = corruption;
        changed = true;
      }
      if (shouldWrite(linkMetrics.synergy, synergy)) {
        linkMetrics.synergy = synergy;
        changed = true;
      }

      const cascadeIntensity = clamp01(synergy);

      if (shouldWrite(userData.cascadeIntensity, cascadeIntensity)) {
        userData.cascadeIntensity = cascadeIntensity;
        changed = true;
      }
      if (shouldWrite(linkMetrics.cascadeIntensity, cascadeIntensity)) {
        linkMetrics.cascadeIntensity = cascadeIntensity;
        changed = true;
      }

      const semanticBus = this.linkingSystem?.semanticBus || globalThis?.semanticBus || null;
      if (semanticBus?.emit) {
        const isActive = cascadeIntensity > 0.6;
        const wasActive = userData.__cascadeActive === true;
        const sourceNode = userData.nodeA || link.source || link.nodeA || null;
        const targetNode = userData.nodeB || link.target || link.nodeB || null;
        const center = sourceNode?.position && targetNode?.position
          ? {
              x: (sourceNode.position.x + targetNode.position.x) * 0.5,
              y: (sourceNode.position.y + targetNode.position.y) * 0.5,
              z: (sourceNode.position.z + targetNode.position.z) * 0.5
            }
          : null;
        const payload = {
          linkId: link.id,
          fromId: sourceNode?.id ?? null,
          toId: targetNode?.id ?? null,
          sourceNode,
          targetNode,
          link,
          center,
          intensity: cascadeIntensity,
          value: cascadeIntensity
        };

        if (isActive && !wasActive) {
          semanticBus.emit('cascade.start', payload, {
            priority: semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL
          });
        }

        if (isActive) {
          semanticBus.emit('cascade.hop', payload, {
            priority: semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL
          });
        }

        if (!isActive && wasActive) {
          semanticBus.emit('cascade.end', payload, {
            priority: semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL
          });
        }

        userData.__cascadeActive = isActive;
      }

      if (changed) updated++;

      if (changed) {
        const metricDirtyQueue = this.linkingSystem?.metricDirtyQueue || globalThis?.__ATOMA_METRIC_DIRTY_QUEUE__ || null;
        if (metricDirtyQueue?.markLink) {
          metricDirtyQueue.markLink(link.id ?? userData.linkId ?? userData.link?.id ?? null);
        }
      }
    }

    this.lastUpdatedLinks = updated;

    // DEBUG: Log cascade data flow (enable with window.ATOMA_DEBUG_CASCADE = true)
    if (typeof window !== 'undefined' && window.ATOMA_DEBUG_CASCADE && updated > 0) {
      const sample = links.find(l => l?.userData?.cascadeIntensity > 0);
      if (sample) {
        console.log('[LinkSemanticMetricsBridge] cascadeIntensity sample:', {
          linkId: sample.id,
          cascadeIntensity: sample.userData.cascadeIntensity?.toFixed(3),
          qualityScore: sample.userData?.quality?.score?.toFixed(1),
          activeLinks: links.filter(l => l?.userData?.cascadeIntensity > 0.1).length
        });
      }
    }

    return updated;
  }
}


