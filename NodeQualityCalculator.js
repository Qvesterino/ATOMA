/**
 * ============================================================================
 * NODE QUALITY CALCULATOR v1.0
 * ============================================================================
 * Single authoritative source for node quality scores (0–100)
 * 
 * RESPONSIBILITY:
 * - Compute unified quality score once per frame for every node
 * - Use NodeDynamicMetrics and LinkQualityCalculator as input sources
 * - Integrate: internal stability, energy, load stress, corruption, link quality
 * - Store results in node.userData.quality for read-only access
 * - Never modify external systems
 * 
 * INTEGRATION:
 * const nodeQuality = new NodeQualityCalculator(
 *     aiNodes,
 *     linkingSystem,
 *     nodeDynamics,
 *     linkQuality
 * );
 * 
 * UPDATE LOOP (in main game loop, once per frame):
 * nodeQuality.update(deltaTime);
 * 
 * READ ACCESS (from any other system):
 * const quality = node.userData.quality;
 * if (quality) {
 *   console.log(quality.score);   // 0–100
 *   console.log(quality.level);   // "Prime" | "Stable" | "Weak" | "Critical"
 * }
 * ============================================================================
 */

export class NodeQualityCalculator {
  /**
   * Initialize the node quality calculator
   * @param {AINodes} aiNodes - Reference to the AINodes system
   * @param {NodeLinkingSystem} linkingSystem - Reference to the linking system
   * @param {NodeDynamicMetrics} nodeDynamics - Reference to node metrics source
   * @param {LinkQualityCalculator} linkQuality - Reference to link quality source
   * @param {Object} config - Optional configuration overrides
   */
  constructor(aiNodes, linkingSystem, nodeDynamics, linkQuality, config = {}) {
    // Store references
    this.aiNodes = aiNodes;
    this.linkingSystem = linkingSystem;
    this.nodeDynamics = nodeDynamics;
    this.linkQuality = linkQuality;
    
    // Configuration with sensible defaults
    this.config = {
      // Component weights (must sum to 1.0)
      internalStabilityWeight: config.internalStabilityWeight ?? 0.30,  // 30%
      energyWeight: config.energyWeight ?? 0.15,                        // 15%
      loadStressWeight: config.loadStressWeight ?? 0.15,                // 15%
      corruptionWeight: config.corruptionWeight ?? 0.20,                // 20%
      linkQualityWeight: config.linkQualityWeight ?? 0.20,              // 20%
      
      // Internal stability sub-weights (must sum to 1.0)
      stabilityFactor: config.stabilityFactor ?? 0.50,  // 50% of internal
      harmonyFactor: config.harmonyFactor ?? 0.30,      // 30% of internal
      clarityFactor: config.clarityFactor ?? 0.20,      // 20% of internal
      
      // Link quality sub-weights
      avgLinkQualityFactor: config.avgLinkQualityFactor ?? 0.70,  // 70% avg
      minLinkQualityFactor: config.minLinkQualityFactor ?? 0.30,  // 30% min
      
      // Quality level thresholds
      primeThreshold: config.primeThreshold ?? 85,      // score >= 85 → "Prime"
      stableThreshold: config.stableThreshold ?? 65,    // score >= 65 → "Stable"
      weakThreshold: config.weakThreshold ?? 40,        // score >= 40 → "Weak"
      // else → "Critical"
      
      // EMA smoothing (optional, default disabled for quality)
      enableEmaSmoothing: config.enableEmaSmoothing ?? false,
      emasAlpha: config.emasAlpha ?? 0.2,
    };
    
    // Internal tracking
    this.nodeQualityCache = new Map(); // nodeId → { previousScore, lastUpdate }
  }
  
  /**
   * Main update cycle - call once per frame from game loop
   * @param {number} deltaTime - Time elapsed since last frame (in seconds)
   */
  update(deltaTime) {
    if (!this.aiNodes || !this.aiNodes.nodes) {
      return;
    }
    
    const now = Date.now();
    
    // Update all nodes
    for (const node of this.aiNodes.nodes) {
      this._updateNodeQuality(node, deltaTime, now);
    }
  }
  
  /**
   * Compute quality score for a single node
   * @private
   */
  _updateNodeQuality(node, deltaTime, now) {
    // Initialize userData if needed
    if (!node.userData) {
      node.userData = {};
    }
    
    // Initialize quality object if needed
    if (!node.userData.quality) {
      node.userData.quality = this._createBlankQuality();
    }
    
    const quality = node.userData.quality;
    const nodeId = this._getNodeId(node);
    
    // Component 1: Internal Stability (30%)
    const internal = this._computeInternalStability(node);
    
    // Component 2: Energy Factor (15%)
    const energyComponent = this._computeEnergyComponent(node);
    
    // Component 3: Load Stress Penalty (15%)
    const loadComponent = this._computeLoadComponent(node);
    
    // Component 4: Corruption Penalty (20%)
    const corruptionComponent = this._computeCorruptionComponent(node);
    
    // Component 5: Local Link Quality (20%)
    const linkComponent = this._computeLinkQualityComponent(node);
    
    // Compute final score
    let score =
      internal * this.config.internalStabilityWeight +
      energyComponent * this.config.energyWeight +
      loadComponent * this.config.loadStressWeight +
      corruptionComponent * this.config.corruptionWeight +
      linkComponent * this.config.linkQualityWeight;
    
    // Clamp score to [0, 100]
    score = Math.max(0, Math.min(100, score));
    
    // Apply EMA smoothing if enabled
    if (this.config.enableEmaSmoothing) {
      const cache = this.nodeQualityCache.get(nodeId);
      if (cache && cache.previousScore !== undefined) {
        score = cache.previousScore * (1 - this.config.emasAlpha) + 
                score * this.config.emasAlpha;
      }
      this.nodeQualityCache.set(nodeId, { previousScore: score, lastUpdate: now });
    }
    
    // Determine quality level
    const level = this._getQualityLevel(score);
    
    // Store results in node.userData.quality
    quality.score = score;
    quality.level = level;
    quality.metrics = {
      stability: internal,
      harmony: energyComponent,
      clarity: loadComponent,
      energy: corruptionComponent,
      loadPenalty: 100 - this._computeLoadRatio(node) * 100,
      corruptionPenalty: this._getMetricValue(node, 'corruption', 0),
      linkQualityAvg: this._computeAvgLinkQuality(node),
      linkQualityMin: this._computeMinLinkQuality(node),
    };
    quality.updatedAt = now;
  }
  
  /**
   * Component 1: Internal Stability (30%)
   * Combines stability, harmony, and clarity from node metrics
   * @private
   */
  _computeInternalStability(node) {
    const metrics = node.userData?.metrics;
    if (!metrics) {
      return 50; // Default neutral value
    }
    
    // Extract normalized values (0–100)
    const stabilityScore = this._getMetricValue(node, 'stability', 50);
    const harmonyScore = this._getMetricValue(node, 'harmony', 50);
    const clarityScore = this._getMetricValue(node, 'clarity', 50);
    
    // Weighted combination
    const internal =
      stabilityScore * this.config.stabilityFactor +
      harmonyScore * this.config.harmonyFactor +
      clarityScore * this.config.clarityFactor;
    
    return Math.max(0, Math.min(100, internal));
  }
  
  /**
   * Component 2: Energy Factor (15%)
   * Nodes with healthy link flow have better energy
   * @private
   */
  _computeEnergyComponent(node) {
    const metrics = node.userData?.metrics;
    if (!metrics) {
      return 50; // Default neutral value
    }
    
    // Extract energyNorm (0–1)
    const energyNorm = metrics.energyNorm ?? 0.5;
    
    // Convert to 0–100 scale
    const energyComponent = energyNorm * 100;
    
    return Math.max(0, Math.min(100, energyComponent));
  }
  
  /**
   * Component 3: Load Stress Penalty (15%)
   * High load reduces node quality
   * @private
   */
  _computeLoadComponent(node) {
    const loadRatio = this._computeLoadRatio(node);
    const loadPenalty = loadRatio * 100;
    
    // Quality contribution: 100 - penalty
    const loadComponent = 100 - loadPenalty;
    
    return Math.max(0, Math.min(100, loadComponent));
  }
  
  /**
   * Component 4: Corruption Penalty (20%)
   * High corruption reduces node quality
   * @private
   */
  _computeCorruptionComponent(node) {
    const corruptionPenalty = this._getMetricValue(node, 'corruption', 0);
    
    // Quality contribution: 100 - corruption
    const corruptionComponent = 100 - corruptionPenalty;
    
    return Math.max(0, Math.min(100, corruptionComponent));
  }
  
  /**
   * Component 5: Local Link Quality (20%)
   * Average and minimum quality of this node's links
   * @private
   */
  _computeLinkQualityComponent(node) {
    const avgLinkQuality = this._computeAvgLinkQuality(node);
    const minLinkQuality = this._computeMinLinkQuality(node);
    
    // Weighted combination: 70% average, 30% minimum
    const linkComponent =
      avgLinkQuality * this.config.avgLinkQualityFactor +
      minLinkQuality * this.config.minLinkQualityFactor;
    
    return Math.max(0, Math.min(100, linkComponent));
  }
  
  /**
   * Calculate average link quality for this node
   * @private
   */
  _computeAvgLinkQuality(node) {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return 50; // Default neutral value
    }
    
    const nodeId = this._getNodeId(node);
    let totalQuality = 0;
    let linkCount = 0;
    
    // Find all links connected to this node
    for (const link of this.linkingSystem.links) {
      const sourceId = this._getNodeId(link.source);
      const targetId = this._getNodeId(link.target);
      
      // Check if this node is part of the link
      if (sourceId === nodeId || targetId === nodeId) {
        const quality = link.userData?.quality;
        if (quality && quality.score !== undefined) {
          totalQuality += quality.score;
          linkCount++;
        }
      }
    }
    
    // Return average or default if no links
    if (linkCount === 0) {
      return 50; // Default neutral value for nodes without links
    }
    
    return totalQuality / linkCount;
  }
  
  /**
   * Calculate minimum link quality for this node
   * @private
   */
  _computeMinLinkQuality(node) {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return 50; // Default neutral value
    }
    
    const nodeId = this._getNodeId(node);
    let minQuality = 100; // Start at maximum
    let hasLinks = false;
    
    // Find all links connected to this node
    for (const link of this.linkingSystem.links) {
      const sourceId = this._getNodeId(link.source);
      const targetId = this._getNodeId(link.target);
      
      // Check if this node is part of the link
      if (sourceId === nodeId || targetId === nodeId) {
        const quality = link.userData?.quality;
        if (quality && quality.score !== undefined) {
          minQuality = Math.min(minQuality, quality.score);
          hasLinks = true;
        }
      }
    }
    
    // Return minimum or default if no links
    if (!hasLinks) {
      return 50; // Default neutral value for nodes without links
    }
    
    return minQuality;
  }
  
  /**
   * Calculate load ratio (0–1) for this node
   * @private
   */
  _computeLoadRatio(node) {
    const metrics = node.userData?.metrics;
    if (!metrics) {
      return 0.5; // Default neutral value
    }
    
    const loadRatio = metrics.loadRatio ?? 0.5;
    
    return Math.max(0, Math.min(1, loadRatio));
  }
  
  /**
   * Extract metric value from node, with graceful degradation
   * @private
   */
  _getMetricValue(node, metricName, defaultValue = 50) {
    const metrics = node.userData?.metrics;
    if (!metrics) {
      return defaultValue;
    }
    
    const value = metrics[metricName];
    if (value === undefined || value === null) {
      return defaultValue;
    }
    
    // Clamp to [0, 100]
    return Math.max(0, Math.min(100, value));
  }
  
  /**
   * Determine quality level based on score
   * @private
   */
  _getQualityLevel(score) {
    if (score >= this.config.primeThreshold) {
      return 'Prime';
    }
    if (score >= this.config.stableThreshold) {
      return 'Stable';
    }
    if (score >= this.config.weakThreshold) {
      return 'Weak';
    }
    return 'Critical';
  }
  
  /**
   * Create a blank quality object
   * @private
   */
  _createBlankQuality() {
    return {
      score: 50,
      level: 'Weak',
      metrics: {
        stability: 50,
        harmony: 50,
        clarity: 50,
        energy: 50,
        loadPenalty: 50,
        corruptionPenalty: 50,
        linkQualityAvg: 50,
        linkQualityMin: 50,
      },
      updatedAt: Date.now(),
    };
  }
  
  /**
   * Extract node ID safely from node object
   * @private
   */
  _getNodeId(node) {
    if (!node) return null;
    return node.uuid || node.id || node;
  }
  
  /**
   * Get network statistics
   * Useful for debugging and monitoring
   * @return {Object} Statistics about node quality across the network
   */
  getNetworkStatistics() {
    if (!this.aiNodes || !this.aiNodes.nodes) {
      return null;
    }
    
    const scores = this.aiNodes.nodes
      .map(node => node.userData?.quality?.score ?? 50)
      .sort((a, b) => a - b);
    
    if (scores.length === 0) {
      return null;
    }
    
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / scores.length;
    const median = scores[Math.floor(scores.length / 2)];
    const min = scores[0];
    const max = scores[scores.length - 1];
    
    // Count by level
    const levels = { Prime: 0, Stable: 0, Weak: 0, Critical: 0 };
    for (const node of this.aiNodes.nodes) {
      const level = node.userData?.quality?.level ?? 'Weak';
      levels[level] = (levels[level] ?? 0) + 1;
    }
    
    return {
      totalNodes: this.aiNodes.nodes.length,
      averageScore: avg,
      medianScore: median,
      minScore: min,
      maxScore: max,
      standardDeviation: Math.sqrt(
        scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length
      ),
      levelDistribution: levels,
    };
  }
  
  /**
   * Get quality summary for a specific node
   * @param {Object} node - The node to summarize
   * @return {Object} Summary of the node's quality metrics
   */
  getNodeQualitySummary(node) {
    const quality = node.userData?.quality;
    if (!quality) {
      return null;
    }
    
    return {
      nodeId: this._getNodeId(node),
      score: quality.score,
      level: quality.level,
      scorePercentage: (quality.score / 100).toFixed(2),
      components: {
        internalStability: (quality.metrics.stability ?? 50).toFixed(1),
        energy: (quality.metrics.energy ?? 50).toFixed(1),
        loadStress: (quality.metrics.clarity ?? 50).toFixed(1),
        corruption: (quality.metrics.corruptionPenalty ?? 50).toFixed(1),
        linkQualityAverage: (quality.metrics.linkQualityAvg ?? 50).toFixed(1),
        linkQualityMinimum: (quality.metrics.linkQualityMin ?? 50).toFixed(1),
      },
      lastUpdated: new Date(quality.updatedAt ?? Date.now()),
    };
  }
}

/**
 * Factory function for creating and configuring a NodeQualityCalculator
 * @param {AINodes} aiNodes - Reference to the AINodes system
 * @param {NodeLinkingSystem} linkingSystem - Reference to the linking system
 * @param {NodeDynamicMetrics} nodeDynamics - Reference to node metrics source
 * @param {LinkQualityCalculator} linkQuality - Reference to link quality source
 * @param {Object} config - Optional configuration overrides
 * @return {NodeQualityCalculator} Initialized calculator instance
 */
export function getNodeQualityCalculator(aiNodes, linkingSystem, nodeDynamics, linkQuality, config = {}) {
  return new NodeQualityCalculator(aiNodes, linkingSystem, nodeDynamics, linkQuality, config);
}
