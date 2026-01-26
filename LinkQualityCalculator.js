/**
 * ============================================================================
 * LINK QUALITY CALCULATOR v1.0
 * ============================================================================
 * Single authoritative source for link quality metrics (0–100)
 * 
 * RESPONSIBILITY:
 * - Compute per-link quality once per frame
 * - Use NodeDynamicMetrics as input source
 * - Store results in link.userData.quality for read-only access
 * - Never modify external systems
 * 
 * INTEGRATION:
 * const linkQuality = new LinkQualityCalculator(linkingSystem, nodeDynamics);
 * 
 * UPDATE LOOP (in main game loop, once per frame):
 * linkQuality.update(deltaTime);
 * 
 * READ ACCESS (from any other system):
 * const quality = link.userData.quality;
 * if (quality) {
 *   console.log(quality.score, quality.level);
 * }
 * ============================================================================
 */

export class LinkQualityCalculator {
  /**
   * Initialize the link quality calculator
   * @param {NodeLinkingSystem} linkingSystem - Reference to the linking system
   * @param {NodeDynamicMetrics} nodeDynamics - Reference to node metrics source
   * @param {Object} config - Optional configuration overrides
   */
  constructor(linkingSystem, nodeDynamics, config = {}) {
    // Store references
    this.linkingSystem = linkingSystem;
    this.nodeDynamics = nodeDynamics;
    
    // Configuration with sensible defaults
    this.config = {
      // Weighting for quality components
      structuralWeight: config.structuralWeight ?? 0.30,    // 30%
      harmonyWeight: config.harmonyWeight ?? 0.40,          // 40%
      loadWeight: config.loadWeight ?? 0.15,                // 15%
      corruptionWeight: config.corruptionWeight ?? 0.15,    // 15%
      
      // Distance-based penalties (structural quality)
      maxLinkDistance: config.maxLinkDistance ?? 50,         // Units beyond which penalty applies
      distancePenaltyRate: config.distancePenaltyRate ?? 0.5, // Points per unit (0-100 scale)
      
      // Structural quality baseline
      baseStructuralScore: config.baseStructuralScore ?? 80,  // Before distance penalty
      
      // Staleness detection (links that don't update)
      stalenessThreshold: config.stalenessThreshold ?? 5000,  // Milliseconds (5 sec)
      
      // EMA smoothing (optional, default disabled for quality)
      enableEmaSmoothing: config.enableEmaSmoothing ?? false,
      emasAlpha: config.emasAlpha ?? 0.2,
    };
    
    // Internal tracking
    this.linkQualityCache = new Map(); // linkId → { lastUpdate, previousScore }
  }
  
  /**
   * Main update cycle - call once per frame from game loop
   * @param {number} deltaTime - Time elapsed since last frame (in seconds)
   */
  update(deltaTime) {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return;
    }
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    const now = Date.now();
    
    // Update all links
    for (const link of this.linkingSystem.links) {
      this._updateLinkQuality(link, deltaTime, now);
    }
  }
  
  /**
   * Update quality score for a single link
   * @private
   */
  _updateLinkQuality(link, deltaTime, now) {
    // Initialize userData if needed
    if (!link.userData) {
      link.userData = {};
    }
    
    // Initialize quality object if needed
    if (!link.userData.quality) {
      link.userData.quality = this._createBlankQuality();
    }
    
    const quality = link.userData.quality;
    const linkId = this._getLinkId(link);
    
    // Get or create cache entry
    if (!this.linkQualityCache.has(linkId)) {
      this.linkQualityCache.set(linkId, {
        lastUpdate: now,
        previousScore: 50
      });
    }
    
    const cache = this.linkQualityCache.get(linkId);
    const previousScore = cache.previousScore;
    
    // ========== 1. STRUCTURAL QUALITY (30%) ==========
    const structuralScore = this._computeStructuralQuality(link, now);
    
    // ========== 2. NODE HARMONY & STABILITY (40%) ==========
    const harmonyScore = this._computeHarmonyQuality(link);
    
    // ========== 3. LOAD STRESS FACTOR (15%) ==========
    const loadScore = this._computeLoadQuality(link);
    
    // ========== 4. CORRUPTION FACTOR (15%) ==========
    const corruptionScore = this._computeCorruptionQuality(link);
    
    // ========== 5. WEIGHTED FINAL SCORE ==========
    const newScore = this._calculateFinalScore(
      structuralScore,
      harmonyScore,
      loadScore,
      corruptionScore
    );
    
    // Apply optional EMA smoothing
    let finalScore = newScore;
    if (this.config.enableEmaSmoothing) {
      finalScore = this._applyEMA(newScore, previousScore);
    }
    
    // Clamp to valid range
    finalScore = Math.max(0, Math.min(100, finalScore));
    
    // ========== 6. DETERMINE QUALITY LEVEL ==========
    const level = this._getQualityLevel(finalScore);
    
    // ========== 7. STORE RESULTS ==========
    quality.score = finalScore;
    quality.level = level;
    quality.structural = structuralScore;
    quality.harmony = harmonyScore;
    quality.load = loadScore;
    quality.corruption = corruptionScore;
    quality.updatedAt = now;
    
    // ========== 8. UPDATE CACHE ==========
    cache.previousScore = finalScore;
    cache.lastUpdate = now;
  }
  
  /**
   * Compute structural quality (link validity, distance, staleness)
   * Range: 0-100
   * @private
   */
  _computeStructuralQuality(link, now) {
    // Base structural quality
    let score = this.config.baseStructuralScore;
    
    // Check 1: Link validity
    if (!link || !link.source || !link.target) {
      return 0; // Dead link
    }
    
    if (!link.source.parent || !link.target.parent) {
      return 0; // Nodes removed from scene
    }
    
    // Check 2: Distance-based penalty
    const distance = link.source.position.distanceTo(link.target.position);
    const maxDist = this.config.maxLinkDistance;
    
    if (distance > maxDist) {
      const excess = distance - maxDist;
      const penalty = excess * this.config.distancePenaltyRate;
      score -= penalty;
    }
    
    // Check 3: Staleness detection
    const lastUpdate = link.userData?.quality?.updatedAt ?? now;
    const staleness = (now - lastUpdate) / 1000; // in seconds
    
    if (staleness > (this.config.stalenessThreshold / 1000)) {
      // Link hasn't been updated in a while - reduce quality
      score -= 20;
    }
    
    // Clamp to valid range
    score = Math.max(0, Math.min(100, score));
    
    return score;
  }
  
  /**
   * Compute harmony quality based on node stability and harmony metrics
   * Range: 0-100
   * @private
   */
  _computeHarmonyQuality(link) {
    // Get metrics for both nodes
    const metricsA = this.nodeDynamics?.getNodeMetrics(link.source);
    const metricsB = this.nodeDynamics?.getNodeMetrics(link.target);
    
    // Fallback if metrics unavailable
    if (!metricsA || !metricsB) {
      return 50; // Neutral score
    }
    
    // Extract stability metrics
    const stabA = metricsA.stability ?? 60;
    const stabB = metricsB.stability ?? 60;
    const nodePairStability = (stabA + stabB) / 2;
    
    // Extract harmony metrics
    const harmA = metricsA.harmony ?? 50;
    const harmB = metricsB.harmony ?? 50;
    const nodePairHarmony = (harmA + harmB) / 2;
    
    // Weighted average: 60% stability, 40% harmony
    const score = (nodePairStability * 0.6) + (nodePairHarmony * 0.4);
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Compute load quality (inverse of load ratio penalty)
   * Range: 0-100
   * @private
   */
  _computeLoadQuality(link) {
    const metricsA = this.nodeDynamics?.getNodeMetrics(link.source);
    const metricsB = this.nodeDynamics?.getNodeMetrics(link.target);
    
    // Fallback if metrics unavailable
    if (!metricsA || !metricsB) {
      return 60; // Moderate score
    }
    
    // Get load ratios (0-1 scale)
    const loadA = metricsA.loadRatio ?? 0;
    const loadB = metricsB.loadRatio ?? 0;
    const averageLoad = (loadA + loadB) / 2;
    
    // Convert to quality: high load = low quality
    // 0 load → 100 quality
    // 0.5 load → 50 quality
    // 1.0 load → 0 quality
    const score = 100 * (1 - averageLoad);
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Compute corruption quality (higher corruption = lower quality)
   * Range: 0-100
   * @private
   */
  _computeCorruptionQuality(link) {
    const metricsA = this.nodeDynamics?.getNodeMetrics(link.source);
    const metricsB = this.nodeDynamics?.getNodeMetrics(link.target);
    
    // Fallback if metrics unavailable
    if (!metricsA || !metricsB) {
      return 70; // Assume some corruption
    }
    
    // Get corruption for both nodes (0-100 scale)
    const corrA = metricsA.corruption ?? 0;
    const corrB = metricsB.corruption ?? 0;
    
    // Use maximum corruption (worst node determines link quality)
    const maxCorruption = Math.max(corrA, corrB);
    
    // Convert to quality: corruption is inversely related
    // 0 corruption → 100 quality
    // 50 corruption → 50 quality
    // 100 corruption → 0 quality
    const score = 100 - maxCorruption;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate final weighted score
   * @private
   */
  _calculateFinalScore(structuralScore, harmonyScore, loadScore, corruptionScore) {
    const score =
      (structuralScore * this.config.structuralWeight) +
      (harmonyScore * this.config.harmonyWeight) +
      (loadScore * this.config.loadWeight) +
      (corruptionScore * this.config.corruptionWeight);
    
    // Clamp to valid range
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Get quality level label from score
   * @private
   */
  _getQualityLevel(score) {
    if (score >= 80) return "High";
    if (score >= 55) return "Medium";
    if (score >= 30) return "Low";
    return "Critical";
  }
  
  /**
   * Get unique link identifier
   * @private
   */
  _getLinkId(link) {
    if (!link) return null;
    
    // Try using stable node IDs if available
    if (link.sourceNodeId && link.targetNodeId) {
      return `${link.sourceNodeId}_to_${link.targetNodeId}`;
    }
    
    // Fallback: Use node references
    const sourceId = link.source?.id || link.source?.uuid || 'unknown';
    const targetId = link.target?.id || link.target?.uuid || 'unknown';
    
    return `${sourceId}_to_${targetId}`;
  }
  
  /**
   * Apply Exponential Moving Average smoothing
   * @private
   */
  _applyEMA(newValue, previousValue) {
    const alpha = Math.max(0, Math.min(1, this.config.emasAlpha));
    return alpha * newValue + (1 - alpha) * previousValue;
  }
  
  /**
   * Create a blank quality object
   * @private
   */
  _createBlankQuality() {
    return {
      score: 50,
      level: "Medium",
      structural: 80,
      harmony: 50,
      load: 60,
      corruption: 70,
      updatedAt: Date.now()
    };
  }
  
  /**
   * Utility: Get quality for a specific link
   * Safe to call anytime, returns null if link not found
   * @public
   */
  getLinkQuality(link) {
    if (!link || !link.userData) {
      return null;
    }
    return link.userData.quality ?? null;
  }
  
  /**
   * Utility: Reset quality for a specific link
   * Useful when links are recycled or reset in game
   * @public
   */
  resetLinkQuality(link) {
    if (!link || !link.userData) {
      return;
    }
    link.userData.quality = this._createBlankQuality();
    const linkId = this._getLinkId(link);
    if (this.linkQualityCache.has(linkId)) {
      this.linkQualityCache.delete(linkId);
    }
  }
  
  /**
   * Utility: Get all links sorted by quality
   * Useful for AI systems and UI displays
   * @public
   */
  getLinksSortedByQuality(descending = true) {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return [];
    }
    
    const sorted = [...this.linkingSystem.links].filter(link => {
      const quality = this.getLinkQuality(link);
      return quality && 'score' in quality;
    }).sort((a, b) => {
      const qualityA = this.getLinkQuality(a);
      const qualityB = this.getLinkQuality(b);
      const scoreA = qualityA?.score ?? 0;
      const scoreB = qualityB?.score ?? 0;
      return descending ? scoreB - scoreA : scoreA - scoreB;
    });
    
    return sorted;
  }
  
  /**
   * Utility: Get links by quality level
   * @public
   */
  getLinksByLevel(level) {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return [];
    }
    
    return this.linkingSystem.links.filter(link => {
      const quality = this.getLinkQuality(link);
      return quality && quality.level === level;
    });
  }
  
  /**
   * Utility: Get quality statistics for all links
   * @public
   */
  getQualityStatistics() {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return null;
    }
    
    const links = this.linkingSystem.links.filter(link => {
      const q = this.getLinkQuality(link);
      return q && 'score' in q;
    });
    
    if (links.length === 0) {
      return null;
    }
    
    const scores = links.map(link => this.getLinkQuality(link).score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    
    const levels = {
      'High': 0,
      'Medium': 0,
      'Low': 0,
      'Critical': 0
    };
    
    links.forEach(link => {
      const level = this.getLinkQuality(link).level;
      levels[level]++;
    });
    
    return {
      totalLinks: links.length,
      averageScore: avgScore,
      minScore: minScore,
      maxScore: maxScore,
      levelDistribution: levels,
      timestamp: Date.now()
    };
  }
  
  /**
   * Utility: Dump all link qualities for debugging
   * @public
   */
  debugDumpAllQualities() {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      console.warn('[LinkQualityCalculator] No links available');
      return;
    }
    
    console.group('[LinkQualityCalculator] All Link Qualities');
    
    for (const link of this.linkingSystem.links) {
      const quality = this.getLinkQuality(link);
      if (quality) {
        const sourceName = link.source?.userData?.name ?? `Node${link.source?.id}`;
        const targetName = link.target?.userData?.name ?? `Node${link.target?.id}`;
        
        console.log(`${sourceName} → ${targetName}:`, {
          score: quality.score.toFixed(1),
          level: quality.level,
          structural: quality.structural.toFixed(1),
          harmony: quality.harmony.toFixed(1),
          load: quality.load.toFixed(1),
          corruption: quality.corruption.toFixed(1)
        });
      }
    }
    
    console.groupEnd();
  }
  
  /**
   * Dispose: Clean up internal caches if needed
   * Safe to call but typically not necessary
   * @public
   */
  dispose() {
    this.linkQualityCache.clear();
  }
}

/**
 * Factory function for convenient initialization
 * Usage: const lq = getLinkQualityCalculator(linkingSystem, nodeDynamics);
 */
export function getLinkQualityCalculator(linkingSystem, nodeDynamics, config = {}) {
  return new LinkQualityCalculator(linkingSystem, nodeDynamics, config);
}
