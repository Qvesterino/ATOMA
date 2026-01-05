import * as THREE from 'three';

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
 * - Instability: quantum/chaos factor (0-100%)
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
      instability: 0,
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
        return;
      }
      
      // Reset counts
      Object.keys(this.nodeCount).forEach(key => {
        this.nodeCount[key] = 0;
      });
      
      this.nodeCount.total = aiNodes.nodes.length;
      
      // Read node data safely
      aiNodes.nodes.forEach(node => {
        if (!node || !node.userData) return;
        
        // Evolution level
        const evolutionStage = node.userData.evolutionStage || 1;
        if (evolutionStage >= 2) this.nodeCount.evolved++;
        if (evolutionStage >= 3) this.nodeCount.advanced++;
        if (evolutionStage >= 4) this.nodeCount.ascended++;
        
        // Archetype type
        const archetypeType = node.userData.archetypeType || null;
        if (archetypeType) {
          const typeKey = archetypeType.toLowerCase();
          if (this.nodeCount.hasOwnProperty(typeKey)) {
            this.nodeCount[typeKey]++;
          }
        }
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
    this.metrics.instability = this.calculateInstability();
    this.metrics.corruption = this.calculateCorruption();
    this.metrics.networkLoad = this.calculateNetworkLoad();
  }
  
  /**
   * SYNERGY %: How interconnected the network is
   */
  calculateSynergy() {
    if (this.linkCount.maxPotential === 0) return 0;
    
    const synergyRaw = this.linkCount.total / this.linkCount.maxPotential;
    return Math.round(Math.min(100, Math.max(0, synergyRaw * 100)));
  }
  
  /**
   * HARMONY %: How compatible the archetypes are
   */
  calculateHarmony() {
    if (this.nodeCount.total === 0) return 0;
    
    // Supportive archetypes
    const supportive = 
      this.nodeCount.crystal +
      this.nodeCount.harmonic +
      this.nodeCount.solar +
      this.nodeCount.echo +
      this.nodeCount.convergence;
    
    // Challenging archetypes (slightly penalized)
    const challenging =
      (this.nodeCount.quantum * 0.7) +
      (this.nodeCount.umbra * 0.9);
    
    // Base harmony score
    let harmonyScore = supportive - challenging;
    
    // Normalize to 0-100%
    const maxScore = this.nodeCount.total;
    const normalized = (harmonyScore / maxScore) * 100;
    
    return Math.round(Math.min(100, Math.max(0, normalized + 50)));
  }
  
  /**
   * INSTABILITY %: How chaotic/volatile the network is
   */
  calculateInstability() {
    if (this.nodeCount.total === 0) return 0;
    
    const unstableCount = this.nodeCount.quantum + this.nodeCount.umbra;
    const instabilityRaw = unstableCount / this.nodeCount.total;
    
    return Math.round(Math.min(100, Math.max(0, instabilityRaw * 100)));
  }
  
  /**
   * CORRUPTION %: Dark/void influence level (heavier weight on Umbra)
   */
  calculateCorruption() {
    if (this.nodeCount.total === 0) return 0;
    
    // Umbra has 3x weight, quantum has 1x weight
    const corruptionScore = 
      (this.nodeCount.umbra * 3 + this.nodeCount.quantum) / 
      (this.nodeCount.total * 4);
    
    return Math.round(Math.min(100, Math.max(0, corruptionScore * 100)));
  }
  
  /**
   * NETWORK LOAD %: Average traffic in the network
   */
  calculateNetworkLoad() {
    if (this.nodeCount.total === 0) return 0;
    
    // Use average link load if available, otherwise estimate
    if (this.avgLinkLoad > 0) {
      // Assume max load is 1.0, normalize to percentage
      return Math.round(Math.min(100, Math.max(0, this.avgLinkLoad * 100)));
    }
    
    // Fallback: use link density as proxy for load
    const linkDensity = this.linkCount.total / Math.max(1, this.nodeCount.total);
    const estimatedLoad = linkDensity * 20; // Scale to reasonable percentage
    
    return Math.round(Math.min(100, Math.max(0, estimatedLoad)));
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
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
      instability: this.getFormattedMetric('instability'),
      corruption: this.getFormattedMetric('corruption'),
      networkLoad: this.getFormattedMetric('networkLoad')
    };
  }
}
