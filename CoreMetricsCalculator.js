import * as THREE from 'three';
import { withGlobalMetricAliases } from './SemanticMetricAdapter.js';

// Include legacy aliases so we can read and fold them into canonical loadPressure.
const NODE_METRIC_KEYS = [
  'synergy',
  'harmony',
  'stability',
  'corruption',
  'loadPressure',
  'load',
  'loadRatio'
];

const NODE_METRIC_KEY_SET = new Set(NODE_METRIC_KEYS);

/**
 * CORE METRICS CALCULATOR
 * 
 * Safely reads runtime data and computes ATOMA core metrics.
 * 100% read-only, no modifications to game state.
 * Uses dirty-flag gating with a periodic safety refresh to minimize overhead.
 * 
 * Metrics Computed:
 * - Synergy: network interconnection (0-100%)
 * - Harmony: archetype compatibility (0-100%)
 * - Stability: network stability (0-100%)
 * - Corruption: void/umbra influence (0-100%)
 * - Network Load: link traffic (0-100%)
 */

export class CoreMetricsCalculator {
  constructor() {
    this.lastCalculationTime = 0;
    this.calculationInterval = 0.5; // Retained for compatibility with older callers
    this.safetyRefreshInterval = 2.0; // Dirty-flag fallback scan if signals are missing

    // Cached metrics (updated periodically)
    this.metrics = {
      synergy: 0,
      harmony: 0,
      stability: 0,
      corruption: 0,
      loadPressure: 0,
      // Legacy alias for consumers not yet migrated
      networkLoad: 0
    };
    
    // Node and link counts (cached)
    this.nodeCount = {
      total: 0,
      evolved: 0,
      advanced: 0,
      ascended: 0,
      
      // Archetype counts
      quantum: 0,
      umbra: 0,
      harmonic: 0,
      crystal: 0,
      solar: 0,
      glyph: 0,
      echo: 0,
      convergence: 0,
      fractal: 0
    };
    
    this.linkCount = {
      total: 0,
      maxPotential: 0
    };
    
    this.avgLinkLoad = 0;
    this.synergyChains = 0;
    this._isDirty = true;
    this._metricDirtyQueue = null;
    this._lastAiNodesRef = null;
    this._lastLinkingSystemRef = null;
    this._lastNodeCount = -1;
    this._lastLinkCount = -1;

    this.nodeMetricSums = NODE_METRIC_KEYS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
    this.nodeMetricCounts = NODE_METRIC_KEYS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
  }
  
  /**
   * Update metrics by reading from game state
   * Call on the simulation tick; dirty signals will skip work when clean.
   */
  update(deltaTime, aiNodes, linkingSystem, nodeEvolution, nodeArchetypes) {
    this.lastCalculationTime += deltaTime;
    this._ingestDirtySignals();
    this._detectStructuralChanges(aiNodes, linkingSystem);

    const shouldRefresh =
      this._isDirty ||
      this.lastCalculationTime >= this.safetyRefreshInterval;

    if (!shouldRefresh) {
      return false;
    }
    
    this.lastCalculationTime = 0;
    
    try {
      // Safely read all node and link data
      this.updateNodeCounts(aiNodes, nodeEvolution, nodeArchetypes);
      this.updateLinkCounts(linkingSystem);
      this.calculateMetrics();
      this._isDirty = false;
      
      return true;
    } catch (error) {
      console.warn('Error calculating metrics:', error);
      return false;
    }
  }
  
  /**
   * Safely read node data
   */
  updateNodeCounts(aiNodes, nodeEvolution, nodeArchetypes) {
    try {
      if (!aiNodes || !aiNodes.nodes) {
        for (const key in this.nodeCount) {
          this.nodeCount[key] = 0;
        }
        this.resetNodeMetricAggregates();
        return;
      }

      // Reset counts
      for (const key in this.nodeCount) {
        this.nodeCount[key] = 0;
      }

      this.resetNodeMetricAggregates();
      
      this.nodeCount.total = aiNodes.nodes.length;

      // Read node data safely
      for (let i = 0; i < aiNodes.nodes.length; i++) {
        const node = aiNodes.nodes[i];
        if (!node || !node.userData) continue;

        const metrics = node.userData.metrics;
        if (!metrics) continue;

        for (let j = 0; j < NODE_METRIC_KEYS.length; j++) {
          const metricKey = NODE_METRIC_KEYS[j];
          const value =
            metricKey === 'loadPressure'
              ? (metrics.loadPressure ?? metrics.load ?? metrics.loadRatio)
              : metrics[metricKey];
          this.accumulateNodeMetric(metricKey, value);
        }
      }
    } catch (error) {
      console.warn('Error reading node counts:', error);
    }
  }
  
  /**
   * Safely read link data
   */
  updateLinkCounts(linkingSystem) {
    try {
      if (!linkingSystem || !linkingSystem.links) {
        this.linkCount.total = 0;
        this.linkCount.maxPotential = 0;
        this.avgLinkLoad = 0;
        return;
      }
      
      this.linkCount.total = linkingSystem.links.length;
      
      // Calculate max potential links (complete graph)
      const n = this.nodeCount.total;
      const theoreticalMax = n * (n - 1) / 2;
      
      // Cap max potential to avoid extreme values
      this.linkCount.maxPotential = Math.min(theoreticalMax, Math.max(1, n * 10));
      
      // Calculate average link load (if available)
      let totalLoad = 0;
      let loadCount = 0;
      
      for (let i = 0; i < linkingSystem.links.length; i++) {
        const link = linkingSystem.links[i];
        if (link && link.userData) {
          const load = link.userData.load || link.userData.traffic || 0;
          totalLoad += load;
          loadCount++;
        }
      }
      
      this.avgLinkLoad = loadCount > 0 ? totalLoad / loadCount : 0;
    } catch (error) {
      console.warn('Error reading link counts:', error);
    }
  }
  
  /**
   * Calculate all metrics from collected data
   */
  calculateMetrics() {
    this.metrics.synergy = this.calculateSynergy();
    this.metrics.harmony = this.calculateHarmony();
    this.metrics.stability = this.calculateStability();
    this.metrics.corruption = this.calculateCorruption();
    const loadPressure = this.calculateNetworkLoad();
    this.metrics.loadPressure = loadPressure;
    this.metrics.networkLoad = loadPressure; // alias for compatibility
  }
  
  /**
   * SYNERGY %: How interconnected the network is
   */
  calculateSynergy() {
    return this.clamp01(this.getAverageMetric('synergy'));
  }
  
  /**
   * HARMONY %: How compatible the archetypes are
   */
  calculateHarmony() {
    return this.clamp01(this.getAverageMetric('harmony'));
  }
  
  /**
   * STABILITY %: How stable/volatile the network is
   */
  calculateStability() {
    const avgStability = this.getAverageMetric('stability');
    return this.clamp01(avgStability);
  }
  
  /**
   * CORRUPTION %: Dark/void influence level (heavier weight on Umbra)
   */
  calculateCorruption() {
    return this.clamp01(this.getAverageMetric('corruption'));
  }
  
  /**
   * NETWORK LOAD %: Average traffic in the network
   */
  calculateNetworkLoad() {
    const avgLoadPressure = this.getAverageMetric('loadPressure');
    if (avgLoadPressure > 0) return this.clamp01(avgLoadPressure);

    // Fallbacks for legacy fields if canonical is absent
    const avgLoad = this.getAverageMetric('load');
    if (avgLoad > 0) return this.clamp01(avgLoad);

    const avgLoadRatio = this.getAverageMetric('loadRatio');
    return this.clamp01(avgLoadRatio);
  }

  resetNodeMetricAggregates() {
    for (let i = 0; i < NODE_METRIC_KEYS.length; i++) {
      const key = NODE_METRIC_KEYS[i];
      this.nodeMetricSums[key] = 0;
      this.nodeMetricCounts[key] = 0;
    }
  }

  accumulateNodeMetric(key, value) {
    if (!NODE_METRIC_KEY_SET.has(key)) return;
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    this.nodeMetricSums[key] += num;
    this.nodeMetricCounts[key] += 1;
  }

  markDirty() {
    this._isDirty = true;
  }

  markNodeDirty(nodeId) {
    if (nodeId === undefined || nodeId === null) return;
    this._isDirty = true;
  }

  markNodesDirty(nodeIds) {
    if (!nodeIds) return;
    for (const nodeId of nodeIds) {
      this.markNodeDirty(nodeId);
    }
  }

  markLinkDirty(linkId) {
    if (linkId === undefined || linkId === null) return;
    this._isDirty = true;
  }

  markLinksDirty(linkIds) {
    if (!linkIds) return;
    for (const linkId of linkIds) {
      this.markLinkDirty(linkId);
    }
  }

  bindDirtyQueue(queue) {
    this._metricDirtyQueue = queue || null;
  }

  _ingestDirtySignals() {
    const queue = this._metricDirtyQueue || globalThis?.__ATOMA_METRIC_DIRTY_QUEUE__ || null;
    if (!queue) return false;

    let hasDirtySignals = false;
    const nodeCount = Number(queue.nodeCount ?? 0);
    const linkCount = Number(queue.linkCount ?? 0);

    if (nodeCount > 0) {
      hasDirtySignals = true;
      if (typeof queue.snapshotNodeIds === 'function') {
        this.markNodesDirty(queue.snapshotNodeIds());
      }
    }

    if (linkCount > 0) {
      hasDirtySignals = true;
      if (typeof queue.snapshotLinkIds === 'function') {
        this.markLinksDirty(queue.snapshotLinkIds());
      }
    }

    if (hasDirtySignals) {
      if (typeof queue.clear === 'function') {
        queue.clear();
      } else {
        queue.clearNodes?.();
        queue.clearLinks?.();
      }
    }

    return hasDirtySignals;
  }

  _detectStructuralChanges(aiNodes, linkingSystem) {
    let changed = false;

    if (this._lastAiNodesRef !== aiNodes) {
      this._lastAiNodesRef = aiNodes;
      changed = true;
    }

    if (this._lastLinkingSystemRef !== linkingSystem) {
      this._lastLinkingSystemRef = linkingSystem;
      changed = true;
    }

    const nodeCount = Array.isArray(aiNodes?.nodes) ? aiNodes.nodes.length : 0;
    const linkCount = Array.isArray(linkingSystem?.links) ? linkingSystem.links.length : 0;

    if (nodeCount !== this._lastNodeCount) {
      this._lastNodeCount = nodeCount;
      changed = true;
    }

    if (linkCount !== this._lastLinkCount) {
      this._lastLinkCount = linkCount;
      changed = true;
    }

    if (changed) {
      this._isDirty = true;
    }

    return changed;
  }

  getAverageMetric(key) {
    const count = this.nodeMetricCounts[key] || 0;
    if (count === 0) return 0;
    return this.nodeMetricSums[key] / count;
  }

  clamp01(value) {
    const num = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(1, num));
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return withGlobalMetricAliases({ ...this.metrics });
  }
  
  /**
   * Get node counts
   */
  getNodeCounts() {
    return { ...this.nodeCount };
  }
  
  /**
   * Get link counts
   */
  getLinkCounts() {
    return { ...this.linkCount };
  }
  
  /**
   * Get formatted metric value with label
   */
  getFormattedMetric(metricName) {
    const value = this.metrics[metricName] || 0;
    return `${value.toString().padStart(2, '0')}%`;
  }
  
  /**
   * Get all formatted metrics
   */
  getAllFormattedMetrics() {
    return {
      synergy: this.getFormattedMetric('synergy'),
      harmony: this.getFormattedMetric('harmony'),
      stability: this.getFormattedMetric('stability'),
      corruption: this.getFormattedMetric('corruption'),
      loadPressure: this.getFormattedMetric('loadPressure'),
      networkLoad: this.getFormattedMetric('loadPressure') // legacy label
    };
  }

  /**
   * Static method: Compute metrics for a single node
   * Reads from node.userData.metrics and returns canonical metrics object
   * 
   * @param {Object} node - Node object with userData.metrics
   * @returns {Object} Metrics object { synergy, harmony, stability, corruption, loadPressure }
   */
  static compute(node) {
    if (!node || !node.userData) {
      return {
        synergy: 0,
        harmony: 0,
        stability: 0,
        corruption: 0,
        loadPressure: 0
      };
    }

    const metrics = node.userData.metrics;
    return {
      synergy: metrics?.synergy ?? 0,
      harmony: metrics?.harmony ?? 0,
      stability: metrics?.stability ?? 0,
      corruption: metrics?.corruption ?? 0,
      loadPressure: metrics?.loadPressure ?? metrics?.load ?? metrics?.loadRatio ?? 0
    };
  }

  /**
   * Static method: Ensure node has metrics
   * Guard pattern to initialize node.userData.metrics if missing
   * 
   * @param {Object} node - Node object to ensure metrics for
   */
  static ensureMetrics(node) {
    if (!node) return;
    if (!node.userData) node.userData = {};
    if (!node.userData.metrics) {
      node.userData.metrics = CoreMetricsCalculator.compute(node);
    }
  }
}
