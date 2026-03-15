/*
VISUAL DERIVED LAYER

Reads canonical node.userData.metrics (0..1).
Computes derived visual values.
Writes ONLY to node.userData.visualMetrics.
No gameplay authority.
*/

// Deprecated name compatibility is maintained at the bottom of this file.

export class VisualDerivedMetrics {
  /**
   * Initialize the visual metrics layer
   * @param {AINodes} aiNodes - Reference to the AINodes system containing all nodes
   * @param {NodeLinkingSystem} linkingSystem - Reference to the linking system for link counts
   * @param {Object} config - Optional configuration overrides
   */
  constructor(aiNodes, linkingSystem, config = {}) {
    this.aiNodes = aiNodes;
    this.linkingSystem = linkingSystem;

    // Minimal configuration: only structural defaults are needed for visuals
    this.config = {
      defaultLoadMax: config.defaultLoadMax ?? 4
    };

    this._nodeMetricCache = new Map();
    this._metricSubscriptionDisposer = null;
    this._hasMetricSubscription = false;
    this._initMetricSubscription();
  }

  _initMetricSubscription() {
    const semanticBus = globalThis.semanticBus;
    const subscribe = semanticBus?.subscribe;
    if (typeof subscribe !== 'function') {
      return;
    }

    const handler = (payload = {}) => {
      const nodeId = payload?.nodeId;
      const metric = payload?.metric;
      const value = payload?.value;
      if (nodeId === undefined || nodeId === null || typeof metric !== 'string') {
        return;
      }

      const sanitizedValue = this._sanitizeMetric(metric, value);
      if (sanitizedValue === null) {
        return;
      }

      const key = String(nodeId);
      const cached = this._nodeMetricCache.get(key) ?? {};
      cached[metric] = sanitizedValue;
      this._nodeMetricCache.set(key, cached);
    };

    this._metricSubscriptionDisposer = subscribe.call(semanticBus, 'metric.node.updated', handler);
    this._hasMetricSubscription = true;
  }

  _sanitizeMetric(metric, value) {
    if (typeof value !== 'number' || !isFinite(value)) return null;
    switch (metric) {
      case 'synergy':
      case 'harmony':
      case 'stability':
      case 'corruption':
      case 'loadPressure':
        return this._clamp01(value);
      default:
        return null;
    }
  }

  _getNodeMetricKey(node) {
    const key = node?.userData?.nodeId ?? node?.id ?? node?.uuid ?? null;
    return key === null ? null : String(key);
  }

  _readNodeMetrics(node) {
    if (!this._hasMetricSubscription) {
      return node?.userData?.metrics ?? null;
    }

    const key = this._getNodeMetricKey(node);
    if (!key) {
      return node?.userData?.metrics ?? null;
    }

    const cached = this._nodeMetricCache.get(key);
    if (cached) {
      return cached;
    }

    const fallback = node?.userData?.metrics;
    if (!fallback) {
      return null;
    }

    const seeded = {
      synergy: this._clamp01(fallback.synergy ?? 0.5),
      harmony: this._clamp01(fallback.harmony ?? 0.5),
      stability: this._clamp01(fallback.stability ?? 0.5),
      corruption: this._clamp01(fallback.corruption ?? 0),
      loadPressure: this._clamp01(fallback.loadPressure ?? fallback.load ?? fallback.loadRatio ?? 0)
    };
    this._nodeMetricCache.set(key, seeded);
    return seeded;
  }

  /**
   * Main update cycle - call once per frame from the render/game loop
   * @param {number} deltaTime - Time elapsed since last frame (in seconds)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    if (!this.aiNodes || !this.aiNodes.nodes) {
      return;
    }

    const now = Date.now();

    for (const node of this.aiNodes.nodes) {
      this._updateNodeVisuals(node, now);
    }
  }

  /**
   * Update visual metrics for a single node
   * @private
   */
  _updateNodeVisuals(node, now) {
    if (!node) return;

    // Ensure userData container
    if (!node.userData) {
      node.userData = {};
    }

    // Initialize visual metrics storage
    if (!node.userData.visualMetrics) {
      node.userData.visualMetrics = this._createBlankVisualMetrics();
    }

    const visual = node.userData.visualMetrics;
    const base = this._readNodeMetrics(node); // Event-fed metrics with safe polling fallback

    // Structural/link metrics
    const linkData = this._computeLinkMetrics(node);
    visual.linkCount = linkData.linkCount;
    visual.incomingLinks = linkData.incomingLinks;
    visual.outgoingLinks = linkData.outgoingLinks;

    visual.loadMax = node.userData.loadMax ?? this.config.defaultLoadMax;

    // Prefer canonical loadPressure (0..1); fallback to link-based ratio
    const canonicalLoad = base?.loadPressure;
    const structuralRatio =
      (typeof linkData.linkCount === 'number' && isFinite(linkData.linkCount) && visual.loadMax > 0)
        ? linkData.linkCount / visual.loadMax
        : 0;

    const loadRatio = (typeof canonicalLoad === 'number' && isFinite(canonicalLoad))
      ? this._clamp01(canonicalLoad)
      : Math.max(0, Math.min(1, structuralRatio));
    visual.loadRatio = loadRatio;

    // Canonical-to-visual transforms (0..1 → 0..100)
    const stabilityNorm = this._clamp01(base?.stability ?? 0.5);
    const harmonyNorm = this._clamp01(base?.harmony ?? 0.5);
    const synergyNorm = this._clamp01(base?.synergy ?? 0.5);
    const corruptionNorm = this._clamp01(base?.corruption ?? 0);
    const loadPressureNorm = this._clamp01(base?.loadPressure ?? loadRatio);

    visual.stability = this._clamp100(stabilityNorm * 100);
    visual.harmony = this._clamp100(harmonyNorm * 100);
    visual.synergy = this._clamp100(synergyNorm * 100);
    visual.corruption = this._clamp100(corruptionNorm * 100);
    visual.loadPressure = this._clamp100(loadPressureNorm * 100);

    visual.updatedAt = now;
  }

  /**
   * Compute link-based metrics for a node
   * @private
   */
  _computeLinkMetrics(node) {
    let linkCount = 0;
    let incomingLinks = 0;
    let outgoingLinks = 0;

    if (!this.linkingSystem || !this.linkingSystem.links) {
      return { linkCount: 0, incomingLinks: 0, outgoingLinks: 0 };
    }

    const nodeId = node.id || node.uuid;

    for (const link of this.linkingSystem.links) {
      if (!link || !link.from || !link.to) continue;

      const fromId = link.from.id || link.from.uuid;
      const toId = link.to.id || link.to.uuid;

      if (fromId === nodeId) {
        outgoingLinks++;
        linkCount++;
      } else if (toId === nodeId) {
        incomingLinks++;
        linkCount++;
      }
    }

    return { linkCount, incomingLinks, outgoingLinks };
  }

  /**
   * Clamp value to [0, 1]
   * @private
   */
  _clamp01(v) {
    if (typeof v !== 'number' || !isFinite(v)) return 0;
    return Math.max(0, Math.min(1, v));
  }

  /**
   * Clamp value to [0, 100]
   * @private
   */
  _clamp100(v) {
    if (typeof v !== 'number' || !isFinite(v)) return 0;
    return Math.max(0, Math.min(100, v));
  }

  /**
   * Create a blank visual metrics object with sensible defaults
   * @private
   */
  _createBlankVisualMetrics() {
    return {
      // Structural
      linkCount: 0,
      incomingLinks: 0,
      outgoingLinks: 0,
      loadMax: this.config.defaultLoadMax,
      loadRatio: 0,

      // Visual dynamic metrics (0–100 scale)
      stability: 50,
      harmony: 50,
      synergy: 50,
      corruption: 0,
      loadPressure: 0,

      // Time-based
      updatedAt: Date.now()
    };
  }

  /**
   * Utility: Get visual metrics for a specific node
   * @public
   */
  getNodeMetrics(node) {
    if (!node || !node.userData) {
      return null;
    }
    return node.userData.visualMetrics ?? null;
  }

  /**
   * Utility: Reset visual metrics for a specific node
   * @public
   */
  resetNodeMetrics(node) {
    console.warn('[VisualDerivedMetrics] resetNodeMetrics is deprecated for gameplay; visual-only reset.');
    if (!node || !node.userData) {
      return;
    }
    node.userData.visualMetrics = this._createBlankVisualMetrics();
  }

  /**
   * Utility: Get all nodes sorted by a specific visual metric
   * @public
   */
  getNodesSortedByMetric(metricKey, descending = true) {
    if (!this.aiNodes || !this.aiNodes.nodes) {
      return [];
    }

    return [...this.aiNodes.nodes]
      .filter(node => {
        const metrics = this.getNodeMetrics(node);
        return metrics && metricKey in metrics;
      })
      .sort((a, b) => {
        const metricsA = this.getNodeMetrics(a);
        const metricsB = this.getNodeMetrics(b);
        const valA = metricsA?.[metricKey] ?? 0;
        const valB = metricsB?.[metricKey] ?? 0;
        return descending ? valB - valA : valA - valB;
      });
  }

  /**
   * Utility: Dump all visual metrics for debugging
   * @public
   */
  debugDumpAllMetrics() {
    if (!this.aiNodes || !this.aiNodes.nodes) {
      console.warn('[VisualDerivedMetrics] No nodes available');
      return;
    }

    console.group('[VisualDerivedMetrics] All Node Visual Metrics');

    for (const node of this.aiNodes.nodes) {
      const metrics = this.getNodeMetrics(node);
      if (metrics) {
        const nodeName = node.userData?.name ?? `Node${node.id}`;
        console.log(`${nodeName}:`, {
          stability: metrics.stability.toFixed(2),
          harmony: metrics.harmony.toFixed(2),
          synergy: metrics.synergy?.toFixed(2),
          corruption: metrics.corruption.toFixed(2),
          linkCount: metrics.linkCount,
          loadRatio: metrics.loadRatio.toFixed(2),
          loadPressure: metrics.loadPressure?.toFixed(2)
        });
      }
    }

    console.groupEnd();
  }

  /**
   * Dispose: currently stateless; kept for API symmetry
   * @public
   */
  dispose() {
    if (typeof this._metricSubscriptionDisposer === 'function') {
      this._metricSubscriptionDisposer();
    }
    this._metricSubscriptionDisposer = null;
    this._nodeMetricCache.clear();
  }
}

/**
 * Factory function for convenient initialization
 * Usage: const visuals = getVisualDerivedMetrics(aiNodes, linkingSystem);
 */
export function getVisualDerivedMetrics(aiNodes, linkingSystem, config = {}) {
  return new VisualDerivedMetrics(aiNodes, linkingSystem, config);
}

// ---------------------------------------------------------------------------
// Deprecated aliases for backward compatibility
// ---------------------------------------------------------------------------
export const NodeDynamicMetrics = VisualDerivedMetrics;
export function getNodeDynamicMetrics(aiNodes, linkingSystem, config = {}) {
  return new VisualDerivedMetrics(aiNodes, linkingSystem, config);
}

/*
Integration:

const visualDynamics = new VisualDerivedMetrics(aiNodes, linkingSystem);

In render loop:
visualDynamics.update(deltaTime);

Visual systems read:
node.userData.visualMetrics
*/
