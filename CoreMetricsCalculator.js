import * as THREE from 'three';
import { withGlobalMetricAliases } from './SemanticMetricAdapter.js';

const NODE_METRIC_KEYS = ['synergy', 'harmony', 'stability', 'corruption', 'load'];

/**
 * CORE METRICS CALCULATOR
 * 
 * Safely reads runtime data and computes ATOMA core metrics.
 * 100% read-only, no modifications to game state.
 * Runs at low frequency (2x per second) to minimize overhead.
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
    this.calculationInterval = 0.5; // Calculate every 0.5 seconds
    
    // Cached metrics (updated periodically)
    this.metrics = {
      synergy: 0,
      harmony: 0,
      stability: 0,
      corruption: 0,
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
   * Call this at low frequency (2x per second)
   */
  update(deltaTime, aiNodes, linkingSystem, nodeEvolution, nodeArchetypes) {
    this.lastCalculationTime += deltaTime;
    
    if (this.lastCalculationTime < this.calculationInterval) {
      // Not time to recalculate yet
      return false;
    }
    
    this.lastCalculationTime = 0;
    
    try {
      // Safely read all node and link data
      this.updateNodeCounts(aiNodes, nodeEvolution, nodeArchetypes);
      this.updateLinkCounts(linkingSystem);
      this.calculateMetrics();
      
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
        this.nodeCount.total = 0;
        this.resetNodeMetricAggregates();
        return;
      }

      // Reset counts
      Object.keys(this.nodeCount).forEach(key => {
        this.nodeCount[key] = 0;
      });

      this.resetNodeMetricAggregates();
      
      this.nodeCount.total = aiNodes.nodes.length;

      // Read node data safely
      aiNodes.nodes.forEach(node => {
        if (!node || !node.userData) return;

        const metrics = node.userData.metrics;
        if (!metrics) return;

        NODE_METRIC_KEYS.forEach(metricKey => {
          this.accumulateNodeMetric(metricKey, metrics[metricKey]);
        });
      });
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
      
      linkingSystem.links.forEach(link => {
        if (link && link.userData) {
          const load = link.userData.load || link.userData.traffic || 0;
          totalLoad += load;
          loadCount++;
        }
      });
      
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
    this.metrics.networkLoad = this.calculateNetworkLoad();
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
    return this.clamp01(this.getAverageMetric('load'));
  }

  resetNodeMetricAggregates() {
    NODE_METRIC_KEYS.forEach(key => {
      this.nodeMetricSums[key] = 0;
      this.nodeMetricCounts[key] = 0;
    });
  }

  accumulateNodeMetric(key, value) {
    if (!NODE_METRIC_KEYS.includes(key)) return;
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    this.nodeMetricSums[key] += num;
    this.nodeMetricCounts[key] += 1;
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
      networkLoad: this.getFormattedMetric('networkLoad')
    };
  }
}