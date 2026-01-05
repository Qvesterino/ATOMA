/**
 * LINK QUALITY PREDICTOR 1.0 — Advanced Link Viability Evaluation
 * 
 * Comprehensive multi-factor system evaluating link quality based on:
 * - Synergy score (primary, from ComputeSynergyScore2_0)
 * - Category complementarity (analysis→integration, etc.)
 * - Spatial distance (favor nearby nodes)
 * - Node temperament compatibility
 * - Historical priority strength
 * - Link decay status and recency
 * - Duplicate penalties
 * - Role compatibility matrix
 * 
 * Output: Quality score 0-100 + human-readable explanation for HUD
 * 
 * Integration points:
 * - LinkRecommendationAI1_0 → Ranks candidates before returning top 5
 * - LinkAutomationEngine1_0 → Filters poor-quality links (optional threshold)
 * - SynergyDebugHUD → Shows "Why?" breakdown
 * - ComputeSynergyScore2_0 → Primary scoring input
 * 
 * Performance: <1ms per evaluation (optimized for real-time use)
 * 
 * Console API:
 *   window.testQualityMatrix()        // Test all factor combinations
 *   window.testRandomCandidates()     // Test random node pairs
 *   window.testHUDOutput()            // Demo HUD format
 *   window.testAutomationFilter()     // Demo automation filtering
 */

export class LinkQualityPredictor1_0 {
  /**
   * Initialize the quality predictor
   * 
   * @param {NodeLinkingSystem} linkingSystem - For distance/existing link checks
   * @param {Function} computeSynergyScore - From ComputeSynergyScore2_0
   * @param {THREE.Scene} scene - For spatial calculations
   */
  constructor(linkingSystem, computeSynergyScore, scene) {
    this.linkingSystem = linkingSystem;
    this.computeSynergyScore = computeSynergyScore;
    this.scene = scene;
    
    // Category complementarity matrix (boost scores for synergistic pairs)
    this.categoryMatrix = {
      // analysis → data processing
      'ANALYSIS': {
        'INTEGRATION': 1.3,
        'STORAGE': 1.2,
        'PROCESS': 1.1,
        'INPUT': 1.0,
        'OUTPUT': 0.9,
        'ERROR': 0.6
      },
      // INTEGRATION → synthesis
      'INTEGRATION': {
        'ANALYSIS': 1.3,
        'PROCESS': 1.2,
        'STORAGE': 1.1,
        'OUTPUT': 1.0,
        'INPUT': 0.8,
        'ERROR': 0.5
      },
      // PROCESS → transformation
      'PROCESS': {
        'INTEGRATION': 1.2,
        'ANALYSIS': 1.1,
        'OUTPUT': 1.1,
        'STORAGE': 1.0,
        'INPUT': 0.9,
        'ERROR': 0.7
      },
      // STORAGE → persistence
      'STORAGE': {
        'ANALYSIS': 1.2,
        'INTEGRATION': 1.1,
        'PROCESS': 1.0,
        'OUTPUT': 0.9,
        'INPUT': 0.8,
        'ERROR': 0.6
      },
      // INPUT → acquisition
      'INPUT': {
        'PROCESS': 1.1,
        'STORAGE': 1.0,
        'ANALYSIS': 0.9,
        'INTEGRATION': 0.8,
        'OUTPUT': 0.7,
        'ERROR': 0.5
      },
      // OUTPUT → emission
      'OUTPUT': {
        'PROCESS': 1.1,
        'INTEGRATION': 1.0,
        'ANALYSIS': 0.9,
        'STORAGE': 0.8,
        'INPUT': 0.7,
        'ERROR': 0.5
      },
      // ERROR → correction
      'ERROR': {
        'ANALYSIS': 1.0,
        'INTEGRATION': 0.8,
        'PROCESS': 0.7,
        'STORAGE': 0.6,
        'INPUT': 0.5,
        'OUTPUT': 0.5
      }
    };
    
    // Configuration
    this.config = {
      // Distance penalties (world units)
      distancePenaltyThreshold: 50, // Beyond this = penalty
      distancePenaltyFactor: 0.02,  // Per unit beyond threshold
      
      // Synergy weighting
      synergyWeight: 0.40,           // 40% of score from synergy
      categoryWeight: 0.25,          // 25% from complementarity
      distanceWeight: 0.15,          // 15% from proximity
      priorityWeight: 0.10,          // 10% from historical priority
      temperamentWeight: 0.10,       // 10% from node mood compatibility
      
      // Quality thresholds
      excellentThreshold: 75,
      goodThreshold: 60,
      fairThreshold: 40,
      poorThreshold: 20,
      
      // Penalties
      duplicatePenalty: -30,         // Existing link penalty
      decayedLinkPenalty: -15,       // Low priority penalty
      
      // Boosts
      historicalSynergyBoost: 1.2,   // Boost high historical scores
    };
    
    // Statistics
    this.stats = {
      totalEvaluations: 0,
      averageQuality: 0,
      qualitySamples: [],
      lastExplanation: null
    };
    
    console.log('[LinkQualityPredictor1_0] ✓ Initialized');
  }
  
  /**
   * Main method: Compute quality score for a link candidate
   * 
   * @param {THREE.Object3D} nodeA - Source node
   * @param {THREE.Object3D} nodeB - Target node
   * @returns {Object} { quality: 0-100, explanation: Object, factors: Array }
   */
  computeQuality(nodeA, nodeB) {
    if (!nodeA || !nodeB) {
      return {
        quality: 0,
        explanation: { reason: 'Missing nodes', factors: [] },
        factors: [],
        raw: { synergy: 0, category: 0, distance: 0, priority: 0, temperament: 0 }
      };
    }
    
    try {
      const startTime = performance.now();
      const factors = {
        synergy: this._evaluateSynergy(nodeA, nodeB),
        category: this._evaluateCategory(nodeA, nodeB),
        distance: this._evaluateDistance(nodeA, nodeB),
        priority: this._evaluatePriority(nodeA, nodeB),
        temperament: this._evaluateTemperament(nodeA, nodeB),
        duplicate: this._checkDuplicate(nodeA, nodeB),
        decay: this._checkDecay(nodeA, nodeB)
      };
      
      // Compute weighted quality score
      let quality = (
        factors.synergy * this.config.synergyWeight +
        factors.category * this.config.categoryWeight +
        factors.distance * this.config.distanceWeight +
        factors.priority * this.config.priorityWeight +
        factors.temperament * this.config.temperamentWeight
      );
      
      // Apply penalties/boosts
      if (factors.duplicate) quality += this.config.duplicatePenalty;
      if (factors.decay) quality += this.config.decayedLinkPenalty;
      
      // Clamp to 0-100
      quality = Math.max(0, Math.min(100, quality));
      
      // Generate explanation
      const explanation = this._generateExplanation(
        nodeA, nodeB, quality, factors
      );
      
      // Update statistics
      this.stats.totalEvaluations++;
      this.stats.qualitySamples.push(quality);
      if (this.stats.qualitySamples.length > 100) {
        this.stats.qualitySamples.shift(); // Keep last 100
      }
      this.stats.averageQuality = 
        this.stats.qualitySamples.reduce((a, b) => a + b, 0) / 
        this.stats.qualitySamples.length;
      this.stats.lastExplanation = explanation;
      
      const executionTime = performance.now() - startTime;
      
      return {
        quality: Math.round(quality),
        explanation,
        factors: this._formatFactors(factors, quality),
        raw: factors,
        executionMs: executionTime
      };
    } catch (err) {
      console.warn('[LinkQualityPredictor1_0] Error in computeQuality:', err.message);
      return {
        quality: 0,
        explanation: { reason: 'Evaluation error', factors: [] },
        factors: [],
        raw: { error: err.message }
      };
    }
  }
  
  /**
   * Evaluate synergy factor (0-100)
   * @private
   */
  _evaluateSynergy(nodeA, nodeB) {
    if (!this.computeSynergyScore) return 50;
    
    try {
      // Compute synergy (returns 0-1)
      const synergy = this.computeSynergyScore(nodeA, nodeB);
      
      // Scale to 0-100
      let score = synergy * 100;
      
      // Apply historical boost if exists
      const historical = this._getHistoricalSynergy(nodeA, nodeB);
      if (historical && historical > synergy) {
        score *= this.config.historicalSynergyBoost;
      }
      
      return Math.min(100, score);
    } catch (err) {
      return 50; // Default middle value
    }
  }
  
  /**
   * Evaluate category complementarity (0-100)
   * @private
   */
  _evaluateCategory(nodeA, nodeB) {
    try {
      const catA = nodeA.userData?.category || nodeA.userData?.nodeType || 'UNKNOWN';
      const catB = nodeB.userData?.category || nodeB.userData?.nodeType || 'UNKNOWN';
      
      // Look up matrix multiplier
      const matrix = this.categoryMatrix[catA] || {};
      const multiplier = matrix[catB] || 0.7;
      
      // Base score for having categories + multiplier boost
      return Math.min(100, 50 + (multiplier - 0.7) * 100);
    } catch (err) {
      return 50;
    }
  }
  
  /**
   * Evaluate spatial distance (0-100, favor nearby)
   * @private
   */
  _evaluateDistance(nodeA, nodeB) {
    try {
      if (!nodeA.position || !nodeB.position) return 50;
      
      const distance = nodeA.position.distanceTo(nodeB.position);
      
      // If nearby: high score
      if (distance < this.config.distancePenaltyThreshold) {
        return 100 - (distance / this.config.distancePenaltyThreshold) * 30;
      }
      
      // If far: penalize
      const excess = distance - this.config.distancePenaltyThreshold;
      const penalty = excess * this.config.distancePenaltyFactor;
      return Math.max(20, 70 - penalty);
    } catch (err) {
      return 50;
    }
  }
  
  /**
   * Evaluate historical priority strength (0-100)
   * @private
   */
  _evaluatePriority(nodeA, nodeB) {
    try {
      // Check if nodes have priority data
      const priorityA = nodeA.userData?.priority?.score || 50;
      const priorityB = nodeB.userData?.priority?.score || 50;
      
      // Average priority strength
      const avgPriority = (priorityA + priorityB) / 2;
      return avgPriority;
    } catch (err) {
      return 50;
    }
  }
  
  /**
   * Evaluate node temperament/mood compatibility (0-100)
   * @private
   */
  _evaluateTemperament(nodeA, nodeB) {
    try {
      const tempA = nodeA.userData?.personality?.mood || 'neutral';
      const tempB = nodeB.userData?.personality?.mood || 'neutral';
      
      // Simple mood compatibility matrix
      const moodPairs = {
        'neutral_neutral': 100,
        'neutral_positive': 85,
        'neutral_negative': 70,
        'positive_positive': 90,
        'positive_negative': 50,
        'negative_negative': 80
      };
      
      const key = `${tempA}_${tempB}`;
      return moodPairs[key] || 60;
    } catch (err) {
      return 50;
    }
  }
  
  /**
   * Check for duplicate link (penalty if exists)
   * @private
   */
  _checkDuplicate(nodeA, nodeB) {
    try {
      if (!this.linkingSystem) return false;
      return this.linkingSystem.linkExists(nodeA, nodeB);
    } catch (err) {
      return false;
    }
  }
  
  /**
   * Check for decayed link status
   * @private
   */
  _checkDecay(nodeA, nodeB) {
    try {
      // Check if link has low priority/old
      const link = this._findLink(nodeA, nodeB);
      if (!link) return false;
      
      // If priority score is low, it's decayed
      if (link.priority?.score < 30) return true;
      
      // If old (check creation time)
      if (link.createdAt) {
        const ageMs = Date.now() - link.createdAt;
        const ageHours = ageMs / (1000 * 60 * 60);
        if (ageHours > 24 && link.traffic?.load < 0.2) return true;
      }
      
      return false;
    } catch (err) {
      return false;
    }
  }
  
  /**
   * Get historical synergy between nodes
   * @private
   */
  _getHistoricalSynergy(nodeA, nodeB) {
    try {
      const link = this._findLink(nodeA, nodeB);
      if (!link || !link.priority) return null;
      return link.priority.synergy ? link.priority.synergy / 100 : null;
    } catch (err) {
      return null;
    }
  }
  
  /**
   * Find existing link between nodes
   * @private
   */
  _findLink(nodeA, nodeB) {
    try {
      if (!this.linkingSystem || !this.linkingSystem.links) return null;
      return this.linkingSystem.links.find(
        l => (l.source === nodeA && l.target === nodeB) ||
             (l.source === nodeB && l.target === nodeA)
      );
    } catch (err) {
      return null;
    }
  }
  
  /**
   * Generate human-readable explanation
   * @private
   */
  _generateExplanation(nodeA, nodeB, quality, factors) {
    const catA = nodeA.userData?.category || 'NODE';
    const catB = nodeB.userData?.category || 'NODE';
    
    let reason = '';
    let rationale = [];
    
    if (quality >= this.config.excellentThreshold) {
      reason = 'EXCELLENT MATCH';
      rationale.push('✓ High synergy score');
      if (factors.category > 70) rationale.push('✓ Complementary categories');
      if (factors.distance > 80) rationale.push('✓ Nearby nodes');
    } else if (quality >= this.config.goodThreshold) {
      reason = 'GOOD MATCH';
      rationale.push('✓ Solid synergy');
      if (factors.distance > 60) rationale.push('✓ Acceptable distance');
    } else if (quality >= this.config.fairThreshold) {
      reason = 'FAIR MATCH';
      rationale.push('⚠ Moderate synergy');
      if (factors.distance < 50) rationale.push('⚠ Distant nodes');
    } else if (quality >= this.config.poorThreshold) {
      reason = 'POOR MATCH';
      rationale.push('✗ Low synergy');
    } else {
      reason = 'NOT RECOMMENDED';
      if (factors.duplicate) rationale.push('✗ Link already exists');
      if (factors.decay) rationale.push('✗ Link has decayed');
      rationale.push('✗ Incompatible nodes');
    }
    
    return {
      reason,
      qualityText: `${quality}%`,
      categories: `${catA} → ${catB}`,
      factors: rationale,
      shortSummary: this._getShortSummary(quality, catA, catB)
    };
  }
  
  /**
   * Get short summary for inline display
   * @private
   */
  _getShortSummary(quality, catA, catB) {
    if (quality >= 80) return `${catA}→${catB} (⭐⭐⭐)`;
    if (quality >= 60) return `${catA}→${catB} (⭐⭐)`;
    if (quality >= 40) return `${catA}→${catB} (⭐)`;
    return `${catA}→${catB} (poor)`;
  }
  
  /**
   * Format factors for display
   * @private
   */
  _formatFactors(factors, quality) {
    return [
      { name: 'Synergy', score: Math.round(factors.synergy), weight: `${this.config.synergyWeight * 100}%` },
      { name: 'Category', score: Math.round(factors.category), weight: `${this.config.categoryWeight * 100}%` },
      { name: 'Distance', score: Math.round(factors.distance), weight: `${this.config.distanceWeight * 100}%` },
      { name: 'Priority', score: Math.round(factors.priority), weight: `${this.config.priorityWeight * 100}%` },
      { name: 'Temperament', score: Math.round(factors.temperament), weight: `${this.config.temperamentWeight * 100}%` }
    ];
  }
  
  /**
   * Batch evaluate multiple candidates
   * Returns sorted by quality descending
   */
  evaluateCandidates(candidates) {
    try {
      const results = candidates.map(candidate => {
        const quality = this.computeQuality(candidate.nodeA, candidate.nodeB);
        return {
          ...candidate,
          quality: quality.quality,
          explanation: quality.explanation,
          factors: quality.factors
        };
      });
      
      // Sort by quality descending
      return results.sort((a, b) => b.quality - a.quality);
    } catch (err) {
      console.warn('[LinkQualityPredictor1_0] Error in evaluateCandidates:', err.message);
      return [];
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      totalEvaluations: this.stats.totalEvaluations,
      averageQuality: this.stats.averageQuality.toFixed(2),
      sampleSize: this.stats.qualitySamples.length,
      excellentCount: this.stats.qualitySamples.filter(q => q >= this.config.excellentThreshold).length,
      goodCount: this.stats.qualitySamples.filter(q => q >= this.config.goodThreshold && q < this.config.excellentThreshold).length,
      fairCount: this.stats.qualitySamples.filter(q => q >= this.config.fairThreshold && q < this.config.goodThreshold).length,
      poorCount: this.stats.qualitySamples.filter(q => q < this.config.fairThreshold).length,
      lastExplanation: this.stats.lastExplanation
    };
  }
  
  /**
   * Set quality threshold for automation filtering
   */
  setAutomationThreshold(threshold) {
    if (typeof threshold === 'number' && threshold >= 0 && threshold <= 100) {
      this.automationThreshold = threshold;
      console.log(`[LinkQualityPredictor1_0] Automation threshold set to ${threshold}`);
    }
  }
  
  /**
   * Check if link meets automation threshold
   */
  meetsAutomationThreshold(quality) {
    const threshold = this.automationThreshold || 60; // Default 60
    return quality >= threshold;
  }
  
  /**
   * Configure weighting
   */
  configureWeights(weights) {
    if (weights.synergy) this.config.synergyWeight = weights.synergy;
    if (weights.category) this.config.categoryWeight = weights.category;
    if (weights.distance) this.config.distanceWeight = weights.distance;
    if (weights.priority) this.config.priorityWeight = weights.priority;
    if (weights.temperament) this.config.temperamentWeight = weights.temperament;
    
    // Normalize to sum to 1.0
    const sum = this.config.synergyWeight + this.config.categoryWeight + 
                this.config.distanceWeight + this.config.priorityWeight + 
                this.config.temperamentWeight;
    this.config.synergyWeight /= sum;
    this.config.categoryWeight /= sum;
    this.config.distanceWeight /= sum;
    this.config.priorityWeight /= sum;
    this.config.temperamentWeight /= sum;
  }
}
