/**
 * LINK ML RECOMMENDATION ENGINE 1.0 — Machine Learning-Style Link Prediction
 * 
 * Production-grade ML-inspired recommendation engine that predicts link quality
 * using feature engineering over all existing ATOMA telemetry systems.
 * 
 * Features:
 * - ML-style feature vector extraction for each candidate link
 * - Weighted scoring pipeline with configurable weights
 * - Integration with LinkHistoryTracker1_0, ComputeSynergyScore2_0, SynergyHighways2_0
 * - Candidate generation with constraints (distance, categories, layer rules)
 * - Quality prediction (0–1) using logistic transformation
 * - Top-N recommendations with human-readable explanations
 * - Per-node recommendations for focused suggestions
 * - Auto-link batch for LinkAutomationEngine1_0
 * - Multiple weight presets (balanced, history_heavy, structure_first)
 * - 100% null-safe with graceful fallbacks
 * - <2ms per cycle performance target
 * 
 * Usage:
 *   LinkMLRecommendationEngine1_0.init({
 *     LinkHistoryTracker1_0: historyTracker,
 *     ComputeSynergyScore2_0: computeSync,
 *     SynergyHighways2_0: highways,
 *     NodeLinkingSystem: linkingSys,
 *     AINodes: aiNodes,
 *     LinkAutomationMonitor2_0: monitor,
 *   });
 *   
 *   const recs = LinkMLRecommendationEngine1_0.getTopRecommendations(10);
 *   const nodeRecs = LinkMLRecommendationEngine1_0.getRecommendationsForNode('node-1', 5);
 *   
 *   // Auto-link batch for automation engine
 *   const autoLinks = LinkMLRecommendationEngine1_0.getAutoLinkBatch(5);
 * 
 * Console API:
 *   window.testMLRecommendations()
 *   window.testMLRecommendationsFor(nodeId)
 *   window.tuneMLWeights(presetName)
 *   window.printMLStats()
 *   window.getMLDebugInfo()
 */

export const LinkMLRecommendationEngine1_0 = {
  // ============================================================================
  // INTERNAL STATE
  // ============================================================================

  _initialized: false,
  _systemReferences: {
    LinkHistoryTracker1_0: null,
    ComputeSynergyScore2_0: null,
    SynergyHighways2_0: null,
    NodeLinkingSystem: null,
    AINodes: null,
    LinkAutomationMonitor2_0: null,
  },

  _config: {
    minQualityThreshold: 0.65,
    highQualityThreshold: 0.8,
    maxCandidatesPerTick: 100,
    maxRecommendationsPerNode: 10,
    maxWorldDistance: 100,        // Normalized: 0–1
    useHistoryWeight: 0.25,
    useDistanceWeight: 0.15,
    useTrendWeight: 0.2,
    throttleMs: 500,              // Rebuild candidates at most every 500ms
  },

  // ============================================================================
  // WEIGHT PRESETS
  // ============================================================================

  _weightPresets: {
    balanced: {
      categoryBonus: 0.3,
      synergyWeight: 0.35,
      historyWeight: 0.2,
      distanceWeight: 0.15,
      trendWeight: 0.15,
      degreeBalance: 0.1,
      highwayRouteBonus: 0.25,
      automationHealth: 0.05,
    },

    history_heavy: {
      categoryBonus: 0.2,
      synergyWeight: 0.25,
      historyWeight: 0.4,          // Heavily weight past successes
      distanceWeight: 0.05,
      trendWeight: 0.25,
      degreeBalance: 0.05,
      highwayRouteBonus: 0.15,
      automationHealth: 0.05,
    },

    structure_first: {
      categoryBonus: 0.4,           // Prioritize proper category paths
      synergyWeight: 0.2,
      historyWeight: 0.1,
      distanceWeight: 0.1,
      trendWeight: 0.1,
      degreeBalance: 0.2,           // Balance network topology
      highwayRouteBonus: 0.4,        // Strongly prefer highway routes
      automationHealth: 0.05,
    },
  },

  _currentWeights: null,  // Initialized to 'balanced' preset

  // ============================================================================
  // RUNTIME STATE
  // ============================================================================

  _candidates: [],                 // Current candidate pool
  _lastCandidateRebuild: 0,
  _recommendations: [],            // Last computed recommendations
  _recommendationsByNode: {},      // Per-node caching

  _stats: {
    totalCandidatesEvaluated: 0,
    avgPredictedQuality: 0,
    highQualityCount: 0,
    lastBatchSize: 0,
    lastUpdateMs: 0,
    candidateRebuildCount: 0,
  },

  // Category hierarchy for synergy bonuses
  _categoryPairs: {
    'input,process': 0.9,
    'process,integration': 0.85,
    'integration,analytics': 0.8,
    'analytics,storage': 0.75,
    'storage,control': 0.7,
    'control,input': 0.65,
    'input,integration': 0.7,
    'process,analytics': 0.75,
    'process,storage': 0.65,
  },

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  init(config = {}) {
    if (this._initialized) return;

    // Store system references
    if (config.LinkHistoryTracker1_0) {
      this._systemReferences.LinkHistoryTracker1_0 = config.LinkHistoryTracker1_0;
    }
    if (config.ComputeSynergyScore2_0) {
      this._systemReferences.ComputeSynergyScore2_0 = config.ComputeSynergyScore2_0;
    }
    if (config.SynergyHighways2_0) {
      this._systemReferences.SynergyHighways2_0 = config.SynergyHighways2_0;
    }
    if (config.NodeLinkingSystem) {
      this._systemReferences.NodeLinkingSystem = config.NodeLinkingSystem;
    }
    if (config.AINodes) {
      this._systemReferences.AINodes = config.AINodes;
    }
    if (config.LinkAutomationMonitor2_0) {
      this._systemReferences.LinkAutomationMonitor2_0 = config.LinkAutomationMonitor2_0;
    }

    // Merge user config with defaults
    Object.assign(this._config, config);

    // Initialize weights to balanced preset
    this._currentWeights = { ...this._weightPresets.balanced };

    this._initialized = true;
    window.LinkMLRecommendationEngine1_0 = this;

    console.log('✅ [LinkMLRecommendationEngine1_0] Initialized - ML recommendation engine active');
  },

  shutdown() {
    this._initialized = false;
    this._candidates = [];
    this._recommendations = [];
    this._recommendationsByNode = {};
    console.log('✅ [LinkMLRecommendationEngine1_0] Shutdown complete');
  },

  // ============================================================================
  // PUBLIC API: RECOMMENDATIONS
  // ============================================================================

  /**
   * Get top N recommendations globally across entire network.
   */
  getTopRecommendations(limit = 10) {
    if (!this._initialized) return [];

    try {
      // Rebuild candidates if needed (throttled)
      this._rebuildCandidatesIfNeeded();

      // Score all candidates
      const scored = this._candidates
        .map(candidate => ({
          ...candidate,
          features: this._extractFeatures(candidate),
        }))
        .map(candidate => ({
          ...candidate,
          predictedQuality: this._predictQuality(candidate.features),
        }))
        .sort((a, b) => b.predictedQuality - a.predictedQuality)
        .slice(0, limit);

      // Build recommendation objects with reasons
      const recommendations = scored.map(item => ({
        id: this._generateCandidateId(item.fromNode.id, item.toNode.id),
        fromNodeId: item.fromNode.id,
        toNodeId: item.toNode.id,
        fromNodeName: item.fromNode.name || item.fromNode.id,
        toNodeName: item.toNode.name || item.toNode.id,
        predictedQuality: item.predictedQuality,
        synergyScore: item.features.synergy || 0,
        highwayRouteId: item.features.highwayRouteId,
        reasons: this._buildReasons(item.features, item.predictedQuality),
        features: item.features,
        timestamp: Date.now(),
      }));

      // Update stats
      this._stats.lastBatchSize = recommendations.length;
      this._stats.lastUpdateMs = Date.now();
      this._stats.avgPredictedQuality = recommendations.length > 0
        ? recommendations.reduce((sum, r) => sum + r.predictedQuality, 0) / recommendations.length
        : 0;
      this._stats.highQualityCount = recommendations.filter(r => r.predictedQuality > this._config.highQualityThreshold).length;

      this._recommendations = recommendations;
      return recommendations;
    } catch (e) {
      console.warn('[LinkMLRecommendationEngine1_0] Error in getTopRecommendations:', e.message);
      return [];
    }
  },

  /**
   * Get recommendations for a specific node (incoming or outgoing).
   */
  getRecommendationsForNode(nodeId, limit = 5) {
    if (!this._initialized || !nodeId) return [];

    try {
      // Check cache first
      if (this._recommendationsByNode[nodeId]?.timestamp > Date.now() - 1000) {
        return this._recommendationsByNode[nodeId].recs.slice(0, limit);
      }

      // Get all candidates involving this node
      const nodes = this._systemReferences.AINodes?.nodes || [];
      const thisNode = nodes.find(n => n.id === nodeId);
      if (!thisNode) return [];

      const nodeCandidates = this._candidates
        .filter(c => c.fromNode.id === nodeId || c.toNode.id === nodeId)
        .map(c => ({
          ...c,
          features: this._extractFeatures(c),
        }))
        .map(c => ({
          ...c,
          predictedQuality: this._predictQuality(c.features),
        }))
        .sort((a, b) => b.predictedQuality - a.predictedQuality)
        .slice(0, limit);

      const recs = nodeCandidates.map(item => ({
        id: this._generateCandidateId(item.fromNode.id, item.toNode.id),
        fromNodeId: item.fromNode.id,
        toNodeId: item.toNode.id,
        fromNodeName: item.fromNode.name || item.fromNode.id,
        toNodeName: item.toNode.name || item.toNode.id,
        predictedQuality: item.predictedQuality,
        synergyScore: item.features.synergy || 0,
        reasons: this._buildReasons(item.features, item.predictedQuality),
        timestamp: Date.now(),
      }));

      // Cache result
      this._recommendationsByNode[nodeId] = {
        recs,
        timestamp: Date.now(),
      };

      return recs;
    } catch (e) {
      console.warn('[LinkMLRecommendationEngine1_0] Error in getRecommendationsForNode:', e.message);
      return [];
    }
  },

  /**
   * Get high-quality link batch for automation engine.
   * Returns only links above highQualityThreshold.
   */
  getAutoLinkBatch(maxLinks = 5) {
    if (!this._initialized) return [];

    try {
      const recs = this.getTopRecommendations(maxLinks * 2); // Get more to filter
      return recs
        .filter(r => r.predictedQuality > this._config.highQualityThreshold)
        .slice(0, maxLinks)
        .map(r => ({
          sourceNodeId: r.fromNodeId,
          targetNodeId: r.toNodeId,
          quality: r.predictedQuality,
          synergyScore: r.synergyScore,
        }));
    } catch (e) {
      console.warn('[LinkMLRecommendationEngine1_0] Error in getAutoLinkBatch:', e.message);
      return [];
    }
  },

  /**
   * Get statistics about the recommendation engine.
   */
  getStats() {
    return {
      initialized: this._initialized,
      totalCandidatesEvaluated: this._stats.totalCandidatesEvaluated,
      avgPredictedQuality: this._stats.avgPredictedQuality,
      highQualityCount: this._stats.highQualityCount,
      lastBatchSize: this._stats.lastBatchSize,
      lastUpdateMs: this._stats.lastUpdateMs,
      candidateRebuildCount: this._stats.candidateRebuildCount,
      currentWeightPreset: Object.keys(this._weightPresets).find(
        key => this._currentWeights === this._weightPresets[key]
      ) || 'custom',
      config: { ...this._config },
    };
  },

  /**
   * Get last computed batch (for HUD/console display).
   */
  debugGetLastBatch() {
    return [...this._recommendations];
  },

  // ============================================================================
  // WEIGHT MANAGEMENT
  // ============================================================================

  /**
   * Switch to a named weight preset.
   */
  setWeightPreset(presetName = 'balanced') {
    if (!this._weightPresets[presetName]) {
      console.warn(`[LinkMLRecommendationEngine1_0] Unknown preset: ${presetName}`);
      return false;
    }

    this._currentWeights = { ...this._weightPresets[presetName] };
    console.log(`✅ [LinkMLRecommendationEngine1_0] Switched to preset: ${presetName}`);
    return true;
  },

  /**
   * Set custom weights.
   */
  setCustomWeights(weights) {
    if (!weights || typeof weights !== 'object') return false;
    this._currentWeights = { ...this._weightPresets.balanced, ...weights };
    console.log('✅ [LinkMLRecommendationEngine1_0] Custom weights set');
    return true;
  },

  /**
   * Get current weights.
   */
  getCurrentWeights() {
    return { ...this._currentWeights };
  },

  // ============================================================================
  // PRIVATE: CANDIDATE GENERATION
  // ============================================================================

  _rebuildCandidatesIfNeeded() {
    const now = Date.now();
    if (now - this._lastCandidateRebuild < this._config.throttleMs) {
      return; // Still fresh
    }

    this._candidates = this._generateCandidates();
    this._lastCandidateRebuild = now;
    this._stats.candidateRebuildCount++;
  },

  /**
   * Generate all candidate link pairs (unlinked nodes).
   */
  _generateCandidates() {
    const nodes = this._systemReferences.AINodes?.nodes || [];
    const linkingSystem = this._systemReferences.NodeLinkingSystem;
    if (!nodes || !linkingSystem) return [];

    const candidates = [];
    const existingLinks = new Set();

    // Build set of existing links (both directions)
    (linkingSystem.links || []).forEach(link => {
      existingLinks.add(`${link.sourceNode.id}-${link.targetNode.id}`);
      existingLinks.add(`${link.targetNode.id}-${link.sourceNode.id}`);
    });

    // Generate all possible pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // Skip self-links
        if (nodeA.id === nodeB.id) continue;

        // Skip existing links (both directions)
        if (existingLinks.has(`${nodeA.id}-${nodeB.id}`)) continue;
        if (existingLinks.has(`${nodeB.id}-${nodeA.id}`)) continue;

        // Check distance constraint (if available)
        const distance = this._calculateNormalizedDistance(nodeA, nodeB);
        if (distance > this._config.maxWorldDistance) continue;

        // Create candidate (bidirectional - consider both directions)
        candidates.push({
          fromNode: nodeA,
          toNode: nodeB,
          distance: distance,
          id: this._generateCandidateId(nodeA.id, nodeB.id),
        });

        candidates.push({
          fromNode: nodeB,
          toNode: nodeA,
          distance: distance,
          id: this._generateCandidateId(nodeB.id, nodeA.id),
        });
      }
    }

    // Limit candidate pool
    this._stats.totalCandidatesEvaluated = candidates.length;

    return candidates.slice(0, this._config.maxCandidatesPerTick);
  },

  // ============================================================================
  // PRIVATE: FEATURE EXTRACTION (ML-STYLE)
  // ============================================================================

  /**
   * Extract feature vector for a candidate link.
   */
  _extractFeatures(candidate) {
    const { fromNode, toNode, distance } = candidate;

    const features = {
      // Category features
      categoryPair: `${fromNode.category || 'unknown'},${toNode.category || 'unknown'}`,
      categoryBonus: this._getCategoryBonus(fromNode.category, toNode.category),

      // Synergy features
      synergy: this._estimateSynergy(fromNode, toNode),

      // History features
      historyScore: this._getHistoricalQuality(fromNode.id, toNode.id),
      historicalVolatility: this._getHistoricalVolatility(fromNode.id, toNode.id),
      historicalTrend: this._getHistoricalTrend(fromNode.id, toNode.id),

      // Distance features
      distance: distance,
      distanceDecay: Math.exp(-distance * 2), // Exponential decay

      // Degree balance features
      fromNodeDegree: (fromNode.linkedNodes?.size || 0) + (fromNode.incomingLinks?.size || 0),
      toNodeDegree: (toNode.linkedNodes?.size || 0) + (toNode.incomingLinks?.size || 0),
      degreeBalance: 1 / (1 + Math.abs((fromNode.linkedNodes?.size || 0) - (toNode.linkedNodes?.size || 0))),

      // Highway route features
      highwayRouteId: this._findHighwayRoute(fromNode, toNode),
      highwayBonus: this._findHighwayRoute(fromNode, toNode) ? 1.0 : 0.0,

      // Automation context features
      automationHealth: this._getAutomationHealth(),
    };

    return features;
  },

  /**
   * Get category synergy bonus.
   */
  _getCategoryBonus(catA, catB) {
    if (!catA || !catB) return 0.3; // Default for unknown categories

    const key = `${catA},${catB}`;
    const reverseKey = `${catB},${catA}`;

    return this._categoryPairs[key] || this._categoryPairs[reverseKey] || 0.4;
  },

  /**
   * Estimate synergy using ComputeSynergyScore2_0.
   */
  _estimateSynergy(fromNode, toNode) {
    try {
      const scorer = this._systemReferences.ComputeSynergyScore2_0;
      if (!scorer) return 0.5; // Default midpoint

      // Try to get score if available
      if (typeof scorer.computeScore === 'function') {
        const score = scorer.computeScore(fromNode, toNode);
        return Math.max(0, Math.min(1, score || 0.5));
      }

      // Fallback to estimated score
      return 0.5;
    } catch (e) {
      return 0.5;
    }
  },

  /**
   * Get historical quality for this node pair (if exists).
   */
  _getHistoricalQuality(fromId, toId) {
    try {
      const tracker = this._systemReferences.LinkHistoryTracker1_0;
      if (!tracker?.getAggregateHistory) return 0.5;

      const history = tracker.getAggregateHistory(fromId, toId);
      if (!history || history.totalInstances === 0) return 0.5;

      return Math.max(0, Math.min(1, history.avgQuality || 0.5));
    } catch (e) {
      return 0.5;
    }
  },

  /**
   * Get historical volatility for this node pair.
   */
  _getHistoricalVolatility(fromId, toId) {
    try {
      const tracker = this._systemReferences.LinkHistoryTracker1_0;
      if (!tracker?.getAggregateHistory) return 0.5;

      const history = tracker.getAggregateHistory(fromId, toId);
      if (!history || history.totalInstances === 0) return 0.5;

      // Lower volatility = more stable = higher score
      return 1 - (history.volatility || 0.5);
    } catch (e) {
      return 0.5;
    }
  },

  /**
   * Get historical trend for this node pair.
   */
  _getHistoricalTrend(fromId, toId) {
    try {
      const tracker = this._systemReferences.LinkHistoryTracker1_0;
      if (!tracker?.getAggregateHistory) return 0.5;

      const history = tracker.getAggregateHistory(fromId, toId);
      if (!history) return 0.5;

      // Map trend to numeric: rising=1.0, stable=0.5, falling=0.0
      const trend = history.trend || 'stable';
      if (trend === 'rising') return 1.0;
      if (trend === 'falling') return 0.0;
      return 0.5;
    } catch (e) {
      return 0.5;
    }
  },

  /**
   * Find if there's a synergy highway route between nodes.
   */
  _findHighwayRoute(fromNode, toNode) {
    try {
      const highways = this._systemReferences.SynergyHighways2_0;
      if (!highways || !highways.highways) return null;

      for (const highway of highways.highways) {
        const nodeIds = new Set((highway.nodes || []).map(n => n.id));
        if (nodeIds.has(fromNode.id) && nodeIds.has(toNode.id)) {
          return highway.id;
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Get automation engine health for context weighting.
   */
  _getAutomationHealth() {
    try {
      const monitor = this._systemReferences.LinkAutomationMonitor2_0;
      if (!monitor?.getStats) return 0.5;

      const stats = monitor.getStats();
      const health = stats?.metrics?.engineHealth || 50;

      return Math.max(0, Math.min(1, health / 100));
    } catch (e) {
      return 0.5;
    }
  },

  /**
   * Calculate normalized distance (0–1) between nodes.
   */
  _calculateNormalizedDistance(nodeA, nodeB) {
    try {
      const posA = nodeA.position;
      const posB = nodeB.position;

      if (!posA || !posB) return 0.5; // Unknown distance

      const dx = (posA.x || 0) - (posB.x || 0);
      const dy = (posA.y || 0) - (posB.y || 0);
      const dz = (posA.z || 0) - (posB.z || 0);

      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Normalize: assume max interesting distance ~100
      return Math.min(1.0, distance / 100);
    } catch (e) {
      return 0.5;
    }
  },

  // ============================================================================
  // LEARNING: FEEDBACK-DRIVEN WEIGHT ADAPTATION
  // ============================================================================

  /**
   * Learning configuration and state
   */
  _learningState: {
    enabled: true,
    learningRate: 0.05,              // How much to adjust weights per feedback
    weightLowerBound: 0.01,          // Prevent weights from collapsing
    weightUpperBound: 1.0,           // Prevent weights from exploding
    presetDeltas: {                  // Weight adjustments per preset
      balanced: {},
      history_heavy: {},
      structure_first: {},
    },
    feedbackCount: 0,                // Total feedback records processed
    lastUpdateTime: 0,
  },

  /**
   * Apply feedback from a single LinkFeedbackRecord to update weights
   * Called by LinkQualityFeedbackLoop1_0 after a link is removed
   * 
   * @param {Object} feedbackRecord
   *   - linkId: string
   *   - predictedQuality: number (0–1) or null
   *   - outcomeScore: number (-1 to +1)
   *   - createdByAutomation: boolean
   *   - categories: string[]
   *   - etc.
   */
  applyFeedback(feedbackRecord = {}) {
    if (!this._initialized || !this._learningState.enabled) return;

    const { predictedQuality, outcomeScore, createdByAutomation } = feedbackRecord;

    // Only learn from automated links (manual links are player choices)
    if (!createdByAutomation) return;

    // Only learn if we have a prediction to compare against
    if (predictedQuality === null || predictedQuality === undefined) return;

    try {
      // Compute prediction error
      // Map outcome (-1 to +1) to quality space (0 to 1)
      const normalizedOutcome = (outcomeScore + 1) / 2; // [-1, +1] → [0, 1]
      const predictionError = normalizedOutcome - predictedQuality;

      // Determine if this is a success or failure to learn from
      const isSuccess = outcomeScore > 0.3;      // Outcome was good
      const isPredictionWrong = Math.abs(predictionError) > 0.2; // Significant error

      if (isSuccess && isPredictionWrong) {
        // We predicted low but it turned out good → boost relevant features
        this._boostWeightsForSuccess(feedbackRecord);
      } else if (!isSuccess && predictedQuality > 0.7) {
        // We predicted high but it turned out bad → penalize involved features
        this._penalizeWeightsForFailure(feedbackRecord);
      }

      this._learningState.feedbackCount++;
      this._learningState.lastUpdateTime = Date.now();
    } catch (e) {
      console.warn('[LinkMLRecommendationEngine1_0] Feedback learning error:', e);
    }
  },

  /**
   * Apply batch feedback (multiple records at once)
   */
  applyFeedbackBatch(feedbackArray = []) {
    if (!Array.isArray(feedbackArray)) return;
    for (const record of feedbackArray) {
      this.applyFeedback(record);
    }
  },

  /**
   * Boost weights when prediction was low but outcome was good
   */
  _boostWeightsForSuccess(feedbackRecord) {
    const currentPreset = this._getCurrentPresetName();
    const deltas = this._learningState.presetDeltas[currentPreset] || {};
    const lr = this._learningState.learningRate;

    // Slightly boost all weights (good link happened)
    for (const key in this._currentWeights) {
      const oldWeight = this._currentWeights[key];
      const delta = deltas[key] || 0;
      const adjustment = delta + lr * 0.02; // Small positive adjustment
      this._currentWeights[key] = this._clampWeight(oldWeight + adjustment * oldWeight);
      deltas[key] = adjustment;
    }

    // Extra boost for specific successful features (if available)
    if (feedbackRecord.averageLifetimeSynergy > 0.7) {
      this._currentWeights.synergyWeight = this._clampWeight(
        this._currentWeights.synergyWeight + lr * 0.05
      );
    }

    if (feedbackRecord.tags?.highway) {
      this._currentWeights.highwayRouteBonus = this._clampWeight(
        this._currentWeights.highwayRouteBonus + lr * 0.05
      );
    }
  },

  /**
   * Penalize weights when prediction was high but outcome was bad
   */
  _penalizeWeightsForFailure(feedbackRecord) {
    const currentPreset = this._getCurrentPresetName();
    const deltas = this._learningState.presetDeltas[currentPreset] || {};
    const lr = this._learningState.learningRate;

    // Slightly penalize all weights (bad link happened despite prediction)
    for (const key in this._currentWeights) {
      const oldWeight = this._currentWeights[key];
      const delta = deltas[key] || 0;
      const adjustment = delta - lr * 0.02; // Small negative adjustment
      this._currentWeights[key] = this._clampWeight(oldWeight + adjustment * oldWeight);
      deltas[key] = adjustment;
    }

    // Extra penalize for misleading features
    if (feedbackRecord.volatileSynergy || feedbackRecord.tags?.unstable) {
      this._currentWeights.synergyWeight = this._clampWeight(
        this._currentWeights.synergyWeight - lr * 0.05
      );
    }

    if (feedbackRecord.createdByAutomation && feedbackRecord.removedByPlayer) {
      this._currentWeights.automationHealth = this._clampWeight(
        this._currentWeights.automationHealth - lr * 0.03
      );
    }
  },

  /**
   * Clamp weight to safe bounds
   */
  _clampWeight(value) {
    return Math.max(
      this._learningState.weightLowerBound,
      Math.min(this._learningState.weightUpperBound, value)
    );
  },

  /**
   * Get the name of the currently active weight preset
   */
  _getCurrentPresetName() {
    // Simple heuristic: check which preset the current weights most closely match
    // For now, we'll assume we track this explicitly
    return this._currentPresetName || 'balanced';
  },

  /**
   * Get current learning state for debugging
   */
  getLearningState() {
    return {
      enabled: this._learningState.enabled,
      learningRate: this._learningState.learningRate,
      feedbackCount: this._learningState.feedbackCount,
      lastUpdateTime: this._learningState.lastUpdateTime,
      currentWeights: { ...this._currentWeights },
      presetDeltas: { ...this._learningState.presetDeltas },
    };
  },

  /**
   * Reset learning state to default weights
   */
  resetLearningState() {
    this._currentWeights = { ...this._weightPresets.balanced };
    this._learningState.presetDeltas = {
      balanced: {},
      history_heavy: {},
      structure_first: {},
    };
    this._learningState.feedbackCount = 0;
    this._learningState.lastUpdateTime = 0;
    console.log('[LinkMLRecommendationEngine1_0] Learning state reset to defaults');
  },

  // ============================================================================
  // PRIVATE: ML-STYLE QUALITY PREDICTION
  // ============================================================================

  /**
   * Predict link quality using weighted feature scoring.
   * Implements: score = w0 + Σ (wi * feature_i)
   * Then applies logistic curve for 0–1 output.
   */
  _predictQuality(features) {
    const w = this._currentWeights;

    // Compute weighted sum
    let score = 0;

    // Category component
    score += (w.categoryBonus || 0.3) * features.categoryBonus;

    // Synergy component (highest weight)
    score += (w.synergyWeight || 0.35) * features.synergy;

    // History components
    score += (w.historyWeight || 0.2) * features.historyScore;
    score += (w.trendWeight || 0.15) * features.historicalTrend;

    // Distance component (lower distance = better)
    score += (w.distanceWeight || 0.15) * features.distanceDecay;

    // Degree balance (prefer balanced nodes)
    score += (w.degreeBalance || 0.1) * features.degreeBalance;

    // Highway route (if exists, strong bonus)
    score += (w.highwayRouteBonus || 0.25) * features.highwayBonus;

    // Automation health (context modifier)
    score += (w.automationHealth || 0.05) * features.automationHealth;

    // Apply logistic transformation for smooth 0–1 output
    // logistic(x) = 1 / (1 + e^(-x))
    // Scaled to approximately match input range
    const logistic = 1 / (1 + Math.exp(-score * 2));

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, logistic));
  },

  // ============================================================================
  // PRIVATE: EXPLANATION GENERATION
  // ============================================================================

  /**
   * Build human-readable explanation reasons for a recommendation.
   */
  _buildReasons(features, quality) {
    const reasons = [];

    try {
      // High synergy
      if (features.synergy > 0.75) {
        reasons.push(`High synergy potential: ${(features.synergy * 100).toFixed(0)}%`);
      }

      // Strong history
      if (features.historyScore > 0.8) {
        reasons.push(`Proven successful connection in history`);
      }

      // Rising trend
      if (features.historicalTrend > 0.75) {
        reasons.push(`Historically improving connection quality`);
      }

      // Highway route
      if (features.highwayBonus > 0) {
        reasons.push(`Part of established synergy highway`);
      }

      // Low volatility (stable)
      if (features.historicalVolatility > 0.7) {
        reasons.push(`Historically stable and reliable`);
      }

      // Degree balance
      if (features.degreeBalance > 0.8) {
        reasons.push(`Balanced network topology`);
      }

      // Short distance
      if (features.distanceDecay > 0.7) {
        reasons.push(`Proximal nodes (short distance)`);
      }

      // Category bonus
      if (features.categoryBonus > 0.8) {
        reasons.push(`Natural category progression: ${features.categoryPair}`);
      }

      // Fallback
      if (reasons.length === 0) {
        reasons.push(`Promising ML prediction: ${(quality * 100).toFixed(0)}% confidence`);
      }
    } catch (e) {
      reasons.push('ML prediction available');
    }

    return reasons;
  },

  // ============================================================================
  // PRIVATE: UTILITIES
  // ============================================================================

  _generateCandidateId(fromId, toId) {
    return `cand-${fromId.slice(0, 8)}-${toId.slice(0, 8)}`;
  },

  // ============================================================================
  // SHUTDOWN & CLEANUP
  // ============================================================================

  destroy() {
    this.shutdown();
  },
};

// ============================================================================
// CONSOLE API SETUP
// ============================================================================

if (typeof window !== 'undefined') {
  window.testMLRecommendations = function() {
    const engine = window.LinkMLRecommendationEngine1_0;
    if (!engine._initialized) {
      console.log('❌ ML Recommendation Engine not initialized');
      return;
    }

    const recs = engine.getTopRecommendations(10);
    console.log(`\n📊 TOP 10 ML RECOMMENDATIONS\n`);

    recs.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec.fromNodeName} → ${rec.toNodeName}`);
      console.log(`   Quality: ${(rec.predictedQuality * 100).toFixed(1)}% | Synergy: ${(rec.synergyScore * 100).toFixed(1)}%`);
      rec.reasons.forEach(r => console.log(`   • ${r}`));
      console.log();
    });
  };

  window.testMLRecommendationsFor = function(nodeId) {
    const engine = window.LinkMLRecommendationEngine1_0;
    if (!engine._initialized) {
      console.log('❌ ML Recommendation Engine not initialized');
      return;
    }

    const recs = engine.getRecommendationsForNode(nodeId, 5);
    console.log(`\n📊 ML RECOMMENDATIONS FOR NODE: ${nodeId}\n`);

    recs.forEach((rec, idx) => {
      const direction = rec.fromNodeId === nodeId ? '→' : '←';
      const otherNode = rec.fromNodeId === nodeId ? rec.toNodeName : rec.fromNodeName;
      console.log(`${idx + 1}. ${direction} ${otherNode}`);
      console.log(`   Quality: ${(rec.predictedQuality * 100).toFixed(1)}%`);
      rec.reasons.forEach(r => console.log(`   • ${r}`));
      console.log();
    });
  };

  window.tuneMLWeights = function(presetName) {
    const engine = window.LinkMLRecommendationEngine1_0;
    if (!engine._initialized) {
      console.log('❌ ML Recommendation Engine not initialized');
      return;
    }

    const success = engine.setWeightPreset(presetName);
    if (success) {
      console.log(`✅ Weights tuned to preset: ${presetName}`);
      console.log('Weights:', engine.getCurrentWeights());
    }
  };

  window.printMLStats = function() {
    const engine = window.LinkMLRecommendationEngine1_0;
    if (!engine._initialized) {
      console.log('❌ ML Recommendation Engine not initialized');
      return;
    }

    const stats = engine.getStats();
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║           ML RECOMMENDATION ENGINE STATISTICS                  ║
╠════════════════════════════════════════════════════════════════╣
║  Total Candidates Evaluated: ${stats.totalCandidatesEvaluated}
║  Avg Predicted Quality: ${(stats.avgPredictedQuality * 100).toFixed(1)}%
║  High Quality Count: ${stats.highQualityCount}
║  Last Batch Size: ${stats.lastBatchSize}
║  Candidate Rebuilds: ${stats.candidateRebuildCount}
║  Current Preset: ${stats.currentWeightPreset}
║  Min Quality Threshold: ${(stats.config.minQualityThreshold * 100).toFixed(0)}%
║  High Quality Threshold: ${(stats.config.highQualityThreshold * 100).toFixed(0)}%
╚════════════════════════════════════════════════════════════════╝
    `);
  };

  window.getMLDebugInfo = function() {
    const engine = window.LinkMLRecommendationEngine1_0;
    if (!engine._initialized) {
      console.log('❌ ML Recommendation Engine not initialized');
      return {};
    }

    const batch = engine.debugGetLastBatch();
    return {
      stats: engine.getStats(),
      lastBatch: batch,
      weights: engine.getCurrentWeights(),
    };
  };

  console.log('✅ [LinkMLRecommendationEngine1_0] Console API available');
  console.log('   window.testMLRecommendations()');
  console.log('   window.testMLRecommendationsFor(nodeId)');
  console.log('   window.tuneMLWeights(presetName)');
  console.log('   window.printMLStats()');
  console.log('   window.getMLDebugInfo()');
}

export default LinkMLRecommendationEngine1_0;
