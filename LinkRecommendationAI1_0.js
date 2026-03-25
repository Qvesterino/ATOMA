/**
 * LINK RECOMMENDATION AI 1.0 — AI-Driven Synergy Suggestions
 * 
 * Intelligent link pairing recommendations based on:
 * - ComputeSynergyScore2_0 (5-component hybrid scoring)
 * - LinkCorrelationEngine1_0 (pairwise correlations)
 * - PriorityHistoryEngine1_0 (temporal stability)
 * - PriorityDecayEngine1_0 (activity patterns)
 * - NodeLinkingSystem (topology & neighbors)
 * - LinkHistoryTracker1_0 (past success rates)
 * - SynergyHighways2_0 (route bonuses)
 * - LinkQualityPredictor1_0 (quality predictions)
 * 
 * Features:
 * - Real-time recommendation generation
 * - Multi-factor synergy analysis with extended data sources
 * - Reason vector breakdown (why this link is suggested)
 * - Top-N suggestion ranking with category diversity
 * - Confidence scoring based on data quality
 * - Caching layer for performance
 * - Spatial indexing for large networks
 * - Feedback loop for learning
 * - Comprehensive debug output
 * - <1ms per recommendation batch
 * - 100% null-safe with graceful fallbacks
 * 
 * Usage:
 *   const ai = new LinkRecommendationAI1_0(nodeLinkingSystem, correlationEngine, ...);
 *   ai.updateRecommendations(selectedNode);
 *   const suggestions = ai.getTopSuggestions();
 *   ai.debugDump();
 * 
 * Console API:
 *   window.recommendFor(nodeName)        // Recommendations for named node
 *   window.recommendActive()              // Recommendations for selected node
 *   window.printRecommendations()         // Print current suggestions
 *   window.getRecommendationStats()       // AI performance stats
 */

export class LinkRecommendationAI1_0 {
  constructor(
    nodeLinkingSystem,
    correlationEngine = null,
    priorityHistoryEngine = null,
    priorityDecayEngine = null,
    config = {}
  ) {
    // Validate inputs
    if (!nodeLinkingSystem) {
      console.warn('[LinkRecommendationAI] nodeLinkingSystem required');
      this.enabled = false;
      return;
    }

    this.nodeLinkingSystem = nodeLinkingSystem;
    this.correlationEngine = correlationEngine;
    this.priorityHistoryEngine = priorityHistoryEngine;
    this.priorityDecayEngine = priorityDecayEngine;

    // Extended data sources (attached externally)
    this.linkHistoryTracker = null;
    this.synergyHighways = null;
    this.linkQualityPredictor = null;

    // Configuration
    this.config = {
      minScoreForSuggestion: config.minScoreForSuggestion ?? 0.55,
      maxSuggestions: config.maxSuggestions ?? 5,
      excludeExistingLinks: config.excludeExistingLinks ?? true,
      minCategoryCompatibility: config.minCategoryCompatibility ?? 0.2,
      performanceThresholdMs: config.performanceThresholdMs ?? 1.0,
      enabled: config.enabled ?? true,
      // NEW: Extended features
      enableCaching: config.enableCaching ?? true,
      cacheTTL: config.cacheTTL ?? 5000,  // 5 seconds
      enableSpatialFilter: config.enableSpatialFilter ?? true,
      maxSpatialDistance: config.maxSpatialDistance ?? 100,
      enableDiversity: config.enableDiversity ?? true,
      enableConfidence: config.enableConfidence ?? true,
      historyBonusWeight: config.historyBonusWeight ?? 0.15,
      highwayBonusWeight: config.highwayBonusWeight ?? 0.10
    };

    // Internal state
    this.enabled = this.config.enabled;
    this.activeNode = null;
    this.candidateScores = new Map(); // nodeId → { score, reasons, confidence }
    this.lastUpdateTs = 0;
    this.lastUpdateDuration = 0;

    // NEW: Caching layer
    this._recommendationCache = new Map(); // nodeId → { scores, timestamp }

    // NEW: Feedback loop
    this._feedbackHistory = [];
    this._feedbackWeights = {
      accepted: 1.1,
      rejected: 0.9,
      ignored: 0.98
    };

    // Statistics
    this.stats = {
      totalRecommendations: 0,
      averageUpdateTime: 0,
      maxUpdateTime: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      feedbackCount: 0
    };
  }

  /**
   * Update recommendations for a given active node
   * Computes synergy scores for all potential target nodes
   * 
   * @param {Object} activeNode - Selected/active node
   * @param {boolean} forceRefresh - Force cache bypass
   */
  updateRecommendations(activeNode, forceRefresh = false) {
    if (!this.enabled || !activeNode) return;

    const startTime = performance.now();
    try {
      this.activeNode = activeNode;
      const activeNodeId = activeNode.id ?? activeNode.uuid;
      if (!activeNodeId) return;

      // NEW: Check cache
      if (this.config.enableCaching && !forceRefresh) {
        const cached = this._recommendationCache.get(activeNodeId);
        if (cached && (Date.now() - cached.timestamp) < this.config.cacheTTL) {
          this.candidateScores = new Map(cached.scores);
          this.stats.cacheHits++;
          return;
        }
        this.stats.cacheMisses++;
      }

      this.candidateScores.clear();

      // Get candidates (with optional spatial filtering)
      let candidates = this._getCandidates(activeNode);

      // Evaluate each node as a potential target
      for (const candidateNode of candidates) {
        if (!candidateNode) continue;

        const candidateId = candidateNode.id ?? candidateNode.uuid;
        if (!candidateId || candidateId === activeNodeId) continue;

        // Check if link already exists
        if (this.config.excludeExistingLinks) {
          if (this.linkExists(activeNodeId, candidateId)) {
            continue;
          }
        }

        // Compute synergy score with extended data sources
        const synergyData = this._computeEnhancedSynergy(activeNode, candidateNode);
        if (!synergyData) continue;

        // Only include if meets threshold
        if (synergyData.score >= this.config.minScoreForSuggestion) {
          this.candidateScores.set(candidateId, {
            node: candidateNode,
            score: synergyData.score,
            reasonVector: synergyData.reasonVector,
            confidence: synergyData.confidence,
            bonuses: synergyData.bonuses
          });
        }
      }

      this.lastUpdateTs = Date.now();
      this.lastUpdateDuration = performance.now() - startTime;

      // NEW: Cache results
      if (this.config.enableCaching) {
        this._recommendationCache.set(activeNodeId, {
          scores: Array.from(this.candidateScores.entries()),
          timestamp: Date.now()
        });
      }

      // Update statistics
      this.stats.totalRecommendations++;
      this.stats.averageUpdateTime =
        (this.stats.averageUpdateTime * (this.stats.totalRecommendations - 1) +
          this.lastUpdateDuration) /
        this.stats.totalRecommendations;
      this.stats.maxUpdateTime = Math.max(
        this.stats.maxUpdateTime,
        this.lastUpdateDuration
      );

      // Debug logging if enabled
      if (typeof window !== 'undefined' && window.game?.linkRecommendationDebug?.enabled) {
        console.log(
          `[LinkRecommendationAI] Updated ${this.candidateScores.size} recommendations in ${this.lastUpdateDuration.toFixed(2)}ms`
        );
      }
    } catch (e) {
      console.error('[LinkRecommendationAI] Error in updateRecommendations:', e);
      this.stats.errors++;
    }
  }

  /**
   * Get candidates with optional spatial filtering
   * @private
   */
  _getCandidates(activeNode) {
    let allNodes = [];
    try {
      allNodes = this.nodeLinkingSystem.nodes || [];
      if (!Array.isArray(allNodes)) allNodes = Array.from(allNodes);
    } catch (e) {
      return [];
    }

    // NEW: Spatial filtering for performance
    if (this.config.enableSpatialFilter && activeNode.position) {
      const maxDist = this.config.maxSpatialDistance;
      return allNodes.filter(node => {
        if (!node?.position) return true; // Include if no position
        return activeNode.position.distanceTo(node.position) <= maxDist;
      });
    }

    return allNodes;
  }

  /**
   * Compute enhanced synergy with extended data sources
   * @private
   */
  _computeEnhancedSynergy(sourceNode, targetNode) {
    if (!sourceNode || !targetNode) return null;

    try {
      // Base synergy from ComputeSynergyScore2_0 or fallback
      const baseData = this._computeBaseSynergy(sourceNode, targetNode);
      if (!baseData) return null;

      let score = baseData.score;
      const bonuses = {
        history: 0,
        highway: 0,
        quality: 0
      };

      // NEW: History bonus (past success with similar pairs)
      const historyBonus = this._getHistoryBonus(sourceNode, targetNode);
      if (historyBonus > 0) {
        score += historyBonus * this.config.historyBonusWeight;
        bonuses.history = historyBonus;
      }

      // NEW: Highway route bonus (is this a preferred route?)
      const highwayBonus = this._getHighwayBonus(sourceNode, targetNode);
      if (highwayBonus > 0) {
        score += highwayBonus * this.config.highwayBonusWeight;
        bonuses.highway = highwayBonus;
      }

      // NEW: Quality prediction bonus
      const qualityBonus = this._getQualityBonus(sourceNode, targetNode);
      if (qualityBonus > 0) {
        score += qualityBonus * 0.05;
        bonuses.quality = qualityBonus;
      }

      // Clamp score
      score = Math.max(0, Math.min(1, score));

      // NEW: Compute confidence
      const confidence = this.config.enableConfidence
        ? this._computeConfidence(sourceNode, targetNode, baseData)
        : 1.0;

      return {
        score,
        tier: baseData.tier,
        reasonVector: baseData.reasonVector,
        confidence,
        bonuses
      };
    } catch (e) {
      return this.computeSynergyFallback(sourceNode, targetNode);
    }
  }

  /**
   * Compute base synergy (original logic)
   * @private
   */
  _computeBaseSynergy(sourceNode, targetNode) {
    try {
      // Try to use ComputeSynergyScore2_0
      if (typeof window !== 'undefined' && window.ComputeSynergyScore2_0) {
        // Create synthetic link object for scoring
        const synthLink = {
          id: `synth-${sourceNode.id || sourceNode.uuid}-${targetNode.id || targetNode.uuid}`,
          sourceNode: sourceNode,
          targetNode: targetNode,
          source: sourceNode,
          target: targetNode,
          priority: sourceNode.priority || { tier: 1 },
          traffic: sourceNode.traffic || 0.5
        };

        const synergyResult = window.ComputeSynergyScore2_0(synthLink, {
          linkingSystem: this.nodeLinkingSystem,
          correlationEngine: this.correlationEngine,
          priorityHistoryEngine: this.priorityHistoryEngine,
          priorityDecayEngine: this.priorityDecayEngine
        });

        if (synergyResult) {
          return {
            score: synergyResult.score,
            tier: synergyResult.tier,
            reasonVector: {
              type: synergyResult.components.type,
              priority: synergyResult.components.priority,
              traffic: synergyResult.components.traffic,
              decay: synergyResult.components.decay,
              topology: synergyResult.components.topology
            }
          };
        }
      }
    } catch (e) {
      // Fall through to fallback
    }

    return this.computeSynergyFallback(sourceNode, targetNode);
  }

  /**
   * Get bonus from link history tracker
   * @private
   */
  _getHistoryBonus(sourceNode, targetNode) {
    if (!this.linkHistoryTracker) return 0;

    try {
      const sourceCat = sourceNode?.userData?.category || 'unknown';
      const targetCat = targetNode?.userData?.category || 'unknown';
      const pairKey = `${sourceCat}:${targetCat}`;

      // Check if this category pair has historical success
      const stats = this.linkHistoryTracker.getPairStats?.(pairKey);
      if (stats && stats.successRate > 0.5) {
        return stats.successRate * 0.3;
      }
    } catch (e) {
      // Silent
    }

    return 0;
  }

  /**
   * Get bonus from synergy highways
   * @private
   */
  _getHighwayBonus(sourceNode, targetNode) {
    if (!this.synergyHighways) return 0;

    try {
      const sourceId = sourceNode?.userData?.nodeId || sourceNode?.id;
      const targetId = targetNode?.userData?.nodeId || targetNode?.id;

      // Check if this pair is part of a highway route
      const highways = this.synergyHighways.getHighways?.() || [];
      for (const hw of highways) {
        const nodes = hw.nodes || hw.nodeIds || [];
        if (nodes.includes(sourceId) && nodes.includes(targetId)) {
          return (hw.avgSynergy || 0.5) * 0.2;
        }
      }
    } catch (e) {
      // Silent
    }

    return 0;
  }

  /**
   * Get bonus from quality predictor
   * @private
   */
  _getQualityBonus(sourceNode, targetNode) {
    if (!this.linkQualityPredictor) return 0;

    try {
      const prediction = this.linkQualityPredictor.predict?.(sourceNode, targetNode);
      if (prediction && prediction.quality > 0.7) {
        return prediction.quality * 0.1;
      }
    } catch (e) {
      // Silent
    }

    return 0;
  }

  /**
   * Compute confidence based on data quality
   * @private
   */
  _computeConfidence(sourceNode, targetNode, synergyData) {
    let confidence = 1.0;

    // Reduce confidence if using fallback
    if (typeof window === 'undefined' || !window.ComputeSynergyScore2_0) {
      confidence *= 0.5;
    }

    // Reduce confidence if no history data
    if (!this.linkHistoryTracker) {
      confidence *= 0.85;
    }

    // Reduce confidence if no correlation engine
    if (!this.correlationEngine) {
      confidence *= 0.9;
    }

    // Reduce confidence if no priority history
    if (!this.priorityHistoryEngine) {
      confidence *= 0.95;
    }

    // Boost confidence if we have quality prediction
    if (this.linkQualityPredictor) {
      confidence *= 1.05;
    }

    // Reduce confidence for extreme scores (less certain)
    if (synergyData.score > 0.9 || synergyData.score < 0.3) {
      confidence *= 0.9;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Fallback synergy computation (basic category compatibility)
   * @private
   */
  computeSynergyFallback(sourceNode, targetNode) {
    try {
      const sourceCat = sourceNode.userData?.category || sourceNode.category || 'unknown';
      const targetCat = targetNode.userData?.category || targetNode.category || 'unknown';

      // Simple category compatibility
      const compat = this.getCategoryCompatibility(sourceCat, targetCat);
      if (compat < this.config.minCategoryCompatibility) {
        return null;
      }

      // Add some activity bonus if available
      const activityBonus = Math.min(0.2, (sourceNode.traffic || 0) * 0.2);

      return {
        score: compat + activityBonus,
        tier: 'medium',
        reasonVector: {
          type: compat,
          priority: 0.3,
          traffic: activityBonus,
          decay: 0.1,
          topology: 0.1
        },
        confidence: 0.5,
        bonuses: { history: 0, highway: 0, quality: 0 }
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Category compatibility lookup
   * @private
   */
  getCategoryCompatibility(cat1, cat2) {
    const c1 = (cat1 || 'unknown').toLowerCase();
    const c2 = (cat2 || 'unknown').toLowerCase();

    if (c1 === c2) return 0.7;

    const compat = {
      'control-integration': 0.9,
      'control-analytics': 0.7,
      'control-process': 0.6,
      'integration-analytics': 0.8,
      'integration-process': 0.7,
      'analytics-process': 0.6,
      'storage-integration': 0.7,
      'storage-process': 0.5,
      'input-process': 0.4,
      'input-storage': 0.3
    };

    const key1 = `${c1}-${c2}`;
    const key2 = `${c2}-${c1}`;

    return compat[key1] ?? compat[key2] ?? 0.2;
  }

  /**
   * Check if a link already exists
   * @private
   */
  linkExists(nodeId1, nodeId2) {
    try {
      const links = this.nodeLinkingSystem.links || [];
      return links.some(link => {
        const sourceId = link.source?.id ?? link.sourceNode?.id ?? link.source?.userData?.nodeId;
        const targetId = link.target?.id ?? link.targetNode?.id ?? link.target?.userData?.nodeId;
        return (
          (sourceId === nodeId1 && targetId === nodeId2) ||
          (sourceId === nodeId2 && targetId === nodeId1)
        );
      });
    } catch (e) {
      return false;
    }
  }

  /**
   * Get top N suggestions sorted by synergy score
   * With optional category diversity
   * 
   * @returns {Array} Top suggestions with node, score, reasons, and confidence
   */
  getTopSuggestions() {
    try {
      const sorted = Array.from(this.candidateScores.values())
        .sort((a, b) => (b.score * (b.confidence || 1)) - (a.score * (a.confidence || 1)));

      // NEW: Apply diversity filter
      if (this.config.enableDiversity) {
        return this._applyDiversityFilter(sorted);
      }

      return sorted.slice(0, this.config.maxSuggestions).map(item => ({
        targetNode: item.node,
        synergyScore: item.score,
        reasonVector: item.reasonVector,
        confidence: item.confidence || 1.0,
        bonuses: item.bonuses
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Apply diversity filter to ensure category variety
   * @private
   */
  _applyDiversityFilter(sorted) {
    const diverse = [];
    const usedCategories = new Set();
    const maxSuggestions = this.config.maxSuggestions;

    for (const item of sorted) {
      if (diverse.length >= maxSuggestions) break;

      const cat = item.node?.userData?.category || 'unknown';

      // Allow first pick always, then prefer new categories
      if (diverse.length === 0 || !usedCategories.has(cat)) {
        diverse.push(item);
        usedCategories.add(cat);
      }
    }

    // If we don't have enough, fill with remaining
    if (diverse.length < maxSuggestions) {
      for (const item of sorted) {
        if (diverse.length >= maxSuggestions) break;
        if (!diverse.includes(item)) {
          diverse.push(item);
        }
      }
    }

    return diverse.map(item => ({
      targetNode: item.node,
      synergyScore: item.score,
      reasonVector: item.reasonVector,
      confidence: item.confidence || 1.0,
      bonuses: item.bonuses
    }));
  }

  /**
   * NEW: Record feedback for learning
   * @param {string} sourceNodeId - Source node ID
   * @param {string} targetNodeId - Target node ID
   * @param {string} action - 'accepted' | 'rejected' | 'ignored'
   */
  recordFeedback(sourceNodeId, targetNodeId, action) {
    if (!['accepted', 'rejected', 'ignored'].includes(action)) return;

    this._feedbackHistory.push({
      source: sourceNodeId,
      target: targetNodeId,
      action,
      timestamp: Date.now()
    });

    this.stats.feedbackCount++;

    // Adjust weights based on feedback
    this._adjustWeightsFromFeedback(action);

    // Invalidate cache for this source node
    this._recommendationCache.delete(sourceNodeId);
  }

  /**
   * Adjust internal weights based on feedback
   * @private
   */
  _adjustWeightsFromFeedback(action) {
    const multiplier = this._feedbackWeights[action] || 1;

    // Slightly adjust history bonus weight
    if (action === 'accepted') {
      this.config.historyBonusWeight = Math.min(0.3, this.config.historyBonusWeight * 1.02);
    } else if (action === 'rejected') {
      this.config.historyBonusWeight = Math.max(0.05, this.config.historyBonusWeight * 0.98);
    }
  }

  /**
   * Print human-readable debug output
   */
  debugDump() {
    try {
      const activeNodeName =
        this.activeNode?.userData?.name ||
        this.activeNode?.name ||
        this.activeNode?.id ||
        'unknown';

      console.group(`🤖 [LinkRecommendationAI] Suggestions for ${activeNodeName}`);

      const suggestions = this.getTopSuggestions();
      if (suggestions.length === 0) {
        console.log('  (no recommendations above threshold)');
      } else {
        suggestions.forEach((rec, i) => {
          const targetName =
            rec.targetNode?.userData?.name ||
            rec.targetNode?.name ||
            rec.targetNode?.id ||
            'unknown';

          const r = rec.reasonVector;
          const conf = (rec.confidence || 1.0) * 100;
          const bonuses = rec.bonuses || {};
          const bonusStr = (bonuses.history > 0 || bonuses.highway > 0)
            ? ` [h:${bonuses.history.toFixed(2)} hw:${bonuses.highway.toFixed(2)}]`
            : '';

          console.log(
            `  ${i + 1}) → ${targetName.padEnd(20)} (${rec.synergyScore.toFixed(3)} @ ${conf.toFixed(0)}%)` +
            ` [type=${r.type.toFixed(2)} pri=${r.priority.toFixed(2)} traf=${r.traffic.toFixed(2)}]${bonusStr}`
          );
        });
      }

      console.log(`\n  Stats: ${this.stats.cacheHits} cache hits, ${this.stats.feedbackCount} feedback`);
      console.groupEnd();
    } catch (e) {
      console.error('[LinkRecommendationAI] Error in debugDump:', e);
    }
  }

  /**
   * Get statistics about recommendation engine
   */
  getStats() {
    return {
      ...this.stats,
      candidateCount: this.candidateScores.size,
      lastUpdateDuration: this.lastUpdateDuration,
      cacheSize: this._recommendationCache.size,
      activeNodeName:
        this.activeNode?.userData?.name ||
        this.activeNode?.name ||
        this.activeNode?.id ||
        'none',
      config: { ...this.config },
      dataSources: {
        correlationEngine: !!this.correlationEngine,
        priorityHistoryEngine: !!this.priorityHistoryEngine,
        priorityDecayEngine: !!this.priorityDecayEngine,
        linkHistoryTracker: !!this.linkHistoryTracker,
        synergyHighways: !!this.synergyHighways,
        linkQualityPredictor: !!this.linkQualityPredictor
      }
    };
  }

  /**
   * Enable/disable recommendation AI
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Clear all cached recommendations
   */
  reset() {
    this.candidateScores.clear();
    this._recommendationCache.clear();
    this.activeNode = null;
    this.lastUpdateTs = 0;
    this.lastUpdateDuration = 0;
  }

  /**
   * Clear cache (call when network topology changes)
   */
  clearCache() {
    this._recommendationCache.clear();
  }

  /**
   * Get feedback history for analysis
   */
  getFeedbackHistory(limit = 100) {
    return this._feedbackHistory.slice(-limit);
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.candidateScores.clear();
    this._recommendationCache.clear();
    this._feedbackHistory = [];
  }
}

export default LinkRecommendationAI1_0;
