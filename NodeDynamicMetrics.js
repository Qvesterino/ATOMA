/**
 * ============================================================================
 * NODE DYNAMIC METRICS v1.0
 * ============================================================================
 * Single source of truth for all per-node metrics
 * 
 * RESPONSIBILITY:
 * - Compute structural, dynamic, and time-based metrics once per frame
 * - Store results in node.userData.metrics for read-only access by other systems
 * - Apply EMA smoothing for stable transitions
 * - Never modify external systems or node hierarchy
 * - Apply soft fatigue multipliers (if enabled)
 * 
 * INTEGRATION:
 * const nodeDynamics = new NodeDynamicMetrics(aiNodes, linkingSystem);
 * 
 * UPDATE LOOP (in main game loop, once per frame):
 * nodeDynamics.update(deltaTime);
 * 
 * READ ACCESS (from any other system):
 * const metrics = node.userData.metrics;
 * if (metrics) {
 *   energy, stability, harmony, etc. are all available
 * }
 * ============================================================================
 */

import { 
  updateNetworkFatigue, 
  setupFatigueDebugConsole,
  getFatigueCorruptionDecayMultiplier 
} from './NetworkFatigueSystem_v0_DEBUG.js';

export class NodeDynamicMetrics {
  /**
   * Initialize the metrics system
   * @param {AINodes} aiNodes - Reference to the AINodes system containing all nodes
   * @param {NodeLinkingSystem} linkingSystem - Reference to the linking system for link counts
   * @param {Object} config - Optional configuration overrides
   */
  constructor(aiNodes, linkingSystem, config = {}) {
    // Store references
    this.aiNodes = aiNodes;
    this.linkingSystem = linkingSystem;
    
    // Initialize fatigue debug API
    setupFatigueDebugConsole();
    
    // Configuration with sensible defaults
    this.config = {
      // EMA smoothing factor (0-1): higher = faster response, lower = smoother
      // REBALANCE v1: 0.2 → 0.15 (less flicker, more organic)
      emasAlpha: config.emasAlpha ?? 0.15,
      
      // Energy system parameters
      // REBALANCE v1: Reduced max and per-link gain; slower decay
      energyMaximum: config.energyMaximum ?? 110,
      energyMinimum: config.energyMinimum ?? 0,
      energyDecayRate: config.energyDecayRate ?? 0.08, // per second when idle (was 0.15)
      energyGainPerLink: config.energyGainPerLink ?? 6,   // per link (was 8)
      energyIdleThreshold: config.energyIdleThreshold ?? 2, // seconds before decay
      
      // Stability system parameters
      // REBALANCE v1: Lower base, higher stress factor, lower penalty per link
      baseStability: config.baseStability ?? 55,      // was 60
      loadStressFactor: config.loadStressFactor ?? 55,  // (1-loadRatio) * factor (was 40)
      linkCountPenalty: config.linkCountPenalty ?? 1.5,   // linkCount * factor (was 2)
      
      // Node category defaults
      defaultLoadMax: config.defaultLoadMax ?? 4,
      
      // Corruption system
      // REBALANCE v1: Slower decay, reduced sigma gain for progressive feel
      corruptionDecayRate: config.corruptionDecayRate ?? 0.035, // was 0.05
      corruptionGainRate: config.corruptionGainRate ?? 2.0,
      sigmaCorruptionGain: config.sigmaCorruptionGain ?? 12, // per second for sigma nodes (was 15)
    };
    
    // Internal tracking
    this.nodeMetricsCache = new Map(); // nodeId → { lastActive, lastValues }
    
    // ====================================================================
    // NODE CATEGORY GAMEPLAY MULTIPLIERS
    // Numeric modifiers applied to existing metrics by category
    // Each category has a clear systemic role; defaults = 1.0
    // ====================================================================
    this.categoryMultipliers = {
      input: {
        energyGain: 1.2,        // Fast energy gain
        stability: 0.8,         // Low stability (volatile)
        corruption: 1.2,        // High corruption sensitivity
        harmony: 0.85,          // Disruptive to harmony
        loadTolerance: 0.9      // Lower effective loadMax
      },
      process: {
        energyGain: 1.0,        // Baseline
        stability: 1.0,         // Baseline
        corruption: 1.0,        // Baseline
        harmony: 1.0,           // Baseline
        loadTolerance: 1.0      // Baseline
      },
      integration: {
        energyGain: 0.95,       // Slightly less energy gain
        stability: 1.05,        // Slightly more stable
        corruption: 0.9,        // Better corruption resistance
        harmony: 1.2,           // High harmony affinity
        loadTolerance: 1.1      // More capacity
      },
      analytics: {
        energyGain: 0.9,        // Slower energy gain
        stability: 1.15,        // Very high stability
        corruption: 0.85,       // Low corruption spread
        harmony: 1.3,           // Very high harmony (was clarity)
        loadTolerance: 1.05     // Slightly more capacity
      },
      storage: {
        energyGain: 0.8,        // Very slow energy changes
        stability: 1.3,         // Very high stability (hard to destabilize)
        corruption: 0.7,        // Strong corruption resistance
        harmony: 0.8,           // Hard to heal
        loadTolerance: 1.2      // High capacity
      },
      control: {
        energyGain: 1.0,        // Baseline
        stability: 1.0,         // Baseline
        corruption: 0.85,       // Good corruption suppression
        harmony: 1.1,           // Good harmony flow
        loadTolerance: 1.0      // Baseline
      }
    };
  }
  
  /**
   * Get multipliers for a node's category
   * @private
   */
  _getCategoryMultipliers(node) {
    const category = node.userData?.category || 'process';
    return this.categoryMultipliers[category] || this.categoryMultipliers.process;
  }
  
  /**
   * Get a single multiplier value (with default fallback)
   * @private
   */
  _getMultiplier(node, metricName) {
    const multipliers = this._getCategoryMultipliers(node);
    return multipliers[metricName] ?? 1.0;
  }
  
  /**
   * Main update cycle - call once per frame from game loop
   * @param {number} deltaTime - Time elapsed since last frame (in seconds)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    if (!this.aiNodes || !this.aiNodes.nodes) {
      return;
    }
    
    const now = Date.now();
    
    // Update all nodes
    for (const node of this.aiNodes.nodes) {
      this._updateNodeMetrics(node, deltaTime, now);
    }
  }
  
  /**
   * Update all metrics for a single node
   * @private
   */
  _updateNodeMetrics(node, deltaTime, now) {
    // Initialize userData if needed
    if (!node.userData) {
      node.userData = {};
    }
    
    // Initialize metrics object if needed
    if (!node.userData.metrics) {
      node.userData.metrics = this._createBlankMetrics();
    }
    
    const metrics = node.userData.metrics;
    const nodeId = node.id || node.uuid;
    
    // Get or create cache entry
    if (!this.nodeMetricsCache.has(nodeId)) {
      this.nodeMetricsCache.set(nodeId, {
        lastActiveTime: now,
        previousMetrics: this._createBlankMetrics()
      });
    }
    
    const cache = this.nodeMetricsCache.get(nodeId);
    const previousMetrics = cache.previousMetrics;
    
    // ========== 1. STRUCTURAL METRICS (computed fresh) ==========
    const linkData = this._computeLinkMetrics(node);
    metrics.linkCount = linkData.linkCount;
    metrics.incomingLinks = linkData.incomingLinks;
    metrics.outgoingLinks = linkData.outgoingLinks;
    metrics.loadMax = node.userData.loadMax ?? this.config.defaultLoadMax;
    metrics.loadRatio = Math.min(1, linkData.linkCount / metrics.loadMax);
    
    // ========== 2. ENERGY DYNAMICS ==========
    const isIdle = (now - cache.lastActiveTime) / 1000 > this.config.energyIdleThreshold;
    
    let newEnergy = previousMetrics.energy ?? 50;
    
    // Apply link-based energy gain (with category multiplier)
    const energyGainMultiplier = this._getMultiplier(node, 'energyGain');
    newEnergy += this.config.energyGainPerLink * linkData.linkCount * energyGainMultiplier * deltaTime;
    
    // Apply decay if idle
    if (isIdle) {
      newEnergy -= this.config.energyDecayRate * newEnergy * deltaTime;
    }
    
    // Clamp to valid range
    newEnergy = Math.max(
      this.config.energyMinimum,
      Math.min(this.config.energyMaximum, newEnergy)
    );
    
    // Apply EMA smoothing
    metrics.energy = this._applyEMA(newEnergy, previousMetrics.energy ?? 50);
    
    // ========== 3. STABILITY (load-based) ==========
    const stabilityMultiplier = this._getMultiplier(node, 'stability');
    const loadToleranceMultiplier = this._getMultiplier(node, 'loadTolerance');
    
    const baseStability = this.config.baseStability * stabilityMultiplier;
    const loadStress = (1 - metrics.loadRatio) * this.config.loadStressFactor;
    const linkPenalty = linkData.linkCount * this.config.linkCountPenalty;
    
    let newStability = Math.max(0, baseStability + loadStress - linkPenalty);
    newStability = Math.min(100, newStability);
    
    // Apply EMA smoothing
    metrics.stability = this._applyEMA(newStability, previousMetrics.stability ?? 60);
    
    // ========== 4. REMOVED: INSTABILITY (use stability directly) ==========
    // metrics.instability = 100 - metrics.stability;
    
    // ========== 5. HARMONY (combination of stability & inverse load) ==========
    // REBALANCE v1: Harmony weights adjusted - (stability * 0.6) + ((1 - loadRatio) * 25)
    // Category multiplier applied to final harmony value
    const harmonyMultiplier = this._getMultiplier(node, 'harmony');
    let newHarmony = (metrics.stability * 0.6) + ((1 - metrics.loadRatio) * 25);
    newHarmony *= harmonyMultiplier;
    newHarmony = Math.max(0, Math.min(100, newHarmony));
    
    metrics.harmony = this._applyEMA(newHarmony, previousMetrics.harmony ?? 50);
    
    // ========== 6. HARMONY_B (stability-influenced) ==========
    // Legacy clarity metric - now folded into harmony calculation
    let newHarmonyB = 50 + (metrics.stability * 0.5 - 30);
    newHarmonyB *= harmonyMultiplier;
    newHarmonyB = Math.max(0, Math.min(100, newHarmonyB));
    
    // Merge with existing harmony (weighted average)
    if (previousMetrics.harmony) {
      metrics.harmony = this._applyEMA((metrics.harmony + newHarmonyB) / 2, previousMetrics.harmony ?? 50);
    } else {
      metrics.harmony = this._applyEMA(newHarmonyB, 50);
    }
    
    // ========== 7. CORRUPTION (special handling for sigma nodes + category multipliers) ==========
    const corruptionMultiplier = this._getMultiplier(node, 'corruption');
    let newCorruption = previousMetrics.corruption ?? 0;
    
    // Check if node is sigma-like (various patterns)
    const isSigmaLike = this._isSigmaNode(node);
    
    if (isSigmaLike) {
      // Sigma nodes continuously increase corruption (with category multiplier)
      newCorruption += this.config.sigmaCorruptionGain * corruptionMultiplier * deltaTime;
    } else {
      // Regular nodes slowly decay corruption (with category multiplier)
      // Apply fatigue decay modifier (if enabled, else returns 1.0)
      const fatigueDecayMult = getFatigueCorruptionDecayMultiplier(node);
      newCorruption -= this.config.corruptionDecayRate * newCorruption * corruptionMultiplier * fatigueDecayMult * deltaTime;
    }
    
    // Clamp to 0-100 range
    newCorruption = Math.max(0, Math.min(100, newCorruption));
    
    metrics.corruption = this._applyEMA(newCorruption, previousMetrics.corruption ?? 0);
    
    // ========== 8. TIME-BASED METRICS ==========
    metrics.lastActiveSeconds = (now - cache.lastActiveTime) / 1000;
    metrics.updatedAt = now;
    
    // ========== 9. NETWORK FATIGUE (v0 DEBUG - FLAGGED) ==========
    // Apply fatigue accumulation/recovery based on stress/health
    updateNetworkFatigue(node, deltaTime, metrics);
    
    // ========== 10. CACHE PREVIOUS VALUES ==========
    cache.previousMetrics = { ...metrics };
    
    // Update last active time if node has activity
    if (linkData.linkCount > 0 || metrics.energy > 50) {
      cache.lastActiveTime = now;
    }
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
    
    // Scan all links to find connections
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
   * Check if a node is sigma-like (various detection patterns)
   * @private
   */
  _isSigmaNode(node) {
    if (!node || !node.userData) {
      return false;
    }
    
    // Check direct flag
    if (node.userData.isSigma) return true;
    
    // Check category
    if (node.userData.category === 'sigma') return true;
    
    // Check archetype pattern
    const archetype = node.userData.archetype ?? '';
    if (archetype.includes('SIGMA') || archetype.includes('CHAOS')) {
      return true;
    }
    
    // Check name pattern (heuristic)
    const name = node.userData.name ?? '';
    if (name.toLowerCase().includes('sigma')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Apply Exponential Moving Average smoothing
   * Prevents sudden flickers and creates smooth transitions
   * @private
   */
  _applyEMA(newValue, previousValue) {
    // Clamp alpha to valid range
    const alpha = Math.max(0, Math.min(1, this.config.emasAlpha));
    return alpha * newValue + (1 - alpha) * previousValue;
  }
  
  /**
   * Create a blank metrics object with sensible defaults
   * @private
   */
  _createBlankMetrics() {
    return {
      // Structural
      linkCount: 0,
      incomingLinks: 0,
      outgoingLinks: 0,
      loadMax: this.config.defaultLoadMax,
      loadRatio: 0,
      
      // Dynamic soft metrics (0-100 scale)
      energy: 50,
      stability: 60,
      harmony: 50,
      corruption: 0,
      
      // Time-based
      lastActiveSeconds: 0,
      updatedAt: Date.now()
    };
  }
  
  /**
   * Utility: Get metrics for a specific node
   * Safe to call anytime, returns null if node not found
   * @public
   */
  getNodeMetrics(node) {
    if (!node || !node.userData) {
      return null;
    }
    return node.userData.metrics ?? null;
  }
  
  /**
   * Utility: Reset metrics for a specific node
   * Useful when nodes are recycled or reset in game
   * @public
   */
  resetNodeMetrics(node) {
    if (!node || !node.userData) {
      return;
    }
    node.userData.metrics = this._createBlankMetrics();
    const nodeId = node.id || node.uuid;
    if (this.nodeMetricsCache.has(nodeId)) {
      this.nodeMetricsCache.delete(nodeId);
    }
  }
  
  /**
   * Utility: Get all nodes sorted by a specific metric
   * Useful for debugging or UI displays
   * @public
   */
  getNodesSortedByMetric(metricKey, descending = true) {
    if (!this.aiNodes || !this.aiNodes.nodes) {
      return [];
    }
    
    const sorted = [...this.aiNodes.nodes].filter(node => {
      const metrics = this.getNodeMetrics(node);
      return metrics && metricKey in metrics;
    }).sort((a, b) => {
      const metricsA = this.getNodeMetrics(a);
      const metricsB = this.getNodeMetrics(b);
      const valA = metricsA?.[metricKey] ?? 0;
      const valB = metricsB?.[metricKey] ?? 0;
      return descending ? valB - valA : valA - valB;
    });
    
    return sorted;
  }
  
  /**
   * Utility: Dump all node metrics for debugging
   * @public
   */
  debugDumpAllMetrics() {
    if (!this.aiNodes || !this.aiNodes.nodes) {
      console.warn('[NodeDynamicMetrics] No nodes available');
      return;
    }
    
    console.group('[NodeDynamicMetrics] All Node Metrics');
    
    for (const node of this.aiNodes.nodes) {
      const metrics = this.getNodeMetrics(node);
      if (metrics) {
        const nodeName = node.userData?.name ?? `Node${node.id}`;
        console.log(`${nodeName}:`, {
          energy: metrics.energy.toFixed(2),
          stability: metrics.stability.toFixed(2),
          harmony: metrics.harmony.toFixed(2),
          corruption: metrics.corruption.toFixed(2),
          linkCount: metrics.linkCount,
          loadRatio: metrics.loadRatio.toFixed(2)
        });
      }
    }
    
    console.groupEnd();
  }
  
  /**
   * Dispose: Clean up internal caches if needed
   * Safe to call but typically not necessary (no external resources)
   * @public
   */
  dispose() {
    this.nodeMetricsCache.clear();
  }
}

/**
 * Factory function for convenient initialization
 * Usage: const nodeDynamics = getNodeDynamicMetrics(aiNodes, linkingSystem);
 */
export function getNodeDynamicMetrics(aiNodes, linkingSystem, config = {}) {
  return new NodeDynamicMetrics(aiNodes, linkingSystem, config);
}