/**
 * LinkCorrelationEngine1_0 - Pairwise Synergy Correlation Analysis
 * 
 * Analyzes historical priority data to compute automatic pairwise correlations
 * between links, enabling discovery of synergy clusters and coupled behaviors.
 * 
 * Features:
 * - Per-link correlation tracking with candidate selection
 * - Pearson/Cosine similarity correlation computation
 * - Automatic tier assignment (0-3 scale)
 * - Synergy cluster detection via graph analysis
 * - Efficient tick-based processing (<1ms)
 * - 100% null-safe with graceful fallbacks
 * - Non-invasive read-only integration
 * 
 * Integration Points:
 * - PriorityHistoryEngine1_0 (read link priority history)
 * - NodeLinkingSystem (read active links)
 * - NodeSynergyIntegration1_0 (optional feedback)
 * 
 * Performance:
 * - Per-tick: <1ms (distributed work)
 * - Memory per link: ~100 bytes
 * - Tick interval: 2000-5000ms (configurable)
 * 
 * API:
 * - status() — Engine status
 * - getCorrelationMeta(linkId) — Correlation data for link
 * - getTopCorrelatedLinks(linkId, limit) — Top N correlated links
 * - getClusters() — All synergy clusters
 * - getClustersForNode(nodeId) — Clusters involving node
 * - enable/disable/reset() — Control
 */

export class LinkCorrelationEngine1_0 {
  constructor(linkingSystem, priorityHistoryEngine, config = {}) {
    // Required systems
    this.linkingSystem = linkingSystem;
    this.priorityHistoryEngine = priorityHistoryEngine;
    
    // Configuration
    this.config = {
      // Tick model
      tickIntervalMs: config.tickIntervalMs ?? 3000,
      maxWorkPerTickMs: config.maxWorkPerTickMs ?? 1.0,
      
      // Correlation computation
      minSamplesForCorrelation: config.minSamplesForCorrelation ?? 5,
      correlationMethod: config.correlationMethod ?? 'pearson', // 'pearson' or 'cosine'
      
      // Tier thresholds
      tierThresholds: config.tierThresholds ?? [0.15, 0.40, 0.70],
      
      // Candidate selection
      candidateStrategy: config.candidateStrategy ?? 'nodeShared', // 'nodeShared' or 'global'
      maxCandidatesPerLink: config.maxCandidatesPerLink ?? 20,
      includeGlobalTopLinks: config.includeGlobalTopLinks ?? false,
      globalTopLinkCount: config.globalTopLinkCount ?? 10,
      
      // Cluster detection
      minClusterTier: config.minClusterTier ?? 2,
      minClusterSize: config.minClusterSize ?? 2,
      
      // Filtering
      minCorrelationScore: config.minCorrelationScore ?? 0.0,
      maxCorrelationScore: config.maxCorrelationScore ?? 1.0,
      
      // Enable/disable
      enabled: config.enabled ?? true,
    };
    
    // Internal state
    this._enabled = this.config.enabled;
    this._lastTickTime = 0;
    this._nextTickTime = Date.now() + this.config.tickIntervalMs;
    
    // Per-link correlation data
    this.correlationData = new Map(); // linkId → { partners: [...], clusterId: null }
    
    // Clusters
    this.clusters = new Map(); // clusterId → { linkIds: [], avgScore: 0, centroidNodes: [] }
    this._nextClusterId = 0;
    
    // Work distribution
    this._workQueue = [];
    this._workIndex = 0;
    
    // Statistics
    this.stats = {
      lastTickTime: 0,
      linksAnalyzed: 0,
      correlationsComputed: 0,
      clustersFound: 0,
      tickCount: 0,
    };
  }
  
  /**
   * Main tick function - call periodically (NOT every frame)
   * Distributes correlation computation work across ticks
   * 
   * @param {number} deltaMs - Time since last tick
   */
  tick(deltaMs) {
    if (!this._enabled) return;
    
    const now = Date.now();
    
    // Check if it's time to process
    if (now < this._nextTickTime) {
      return;
    }
    
    try {
      const tickStartTime = performance.now();
      
      // Get active links
      const activeLinks = this.linkingSystem?.links?.filter(l => l?.active) || [];
      
      if (activeLinks.length === 0) {
        this._nextTickTime = now + this.config.tickIntervalMs;
        return;
      }
      
      // Initialize work queue on first tick or when links change
      if (this._workQueue.length === 0) {
        this._initializeWorkQueue(activeLinks);
      }
      
      // Process work items until time budget exhausted
      const maxMs = this.config.maxWorkPerTickMs;
      let workDone = 0;
      
      while (this._workIndex < this._workQueue.length && performance.now() - tickStartTime < maxMs) {
        const work = this._workQueue[this._workIndex];
        
        try {
          this._processWorkItem(work);
          workDone++;
        } catch (e) {
          console.error('[LinkCorrelationEngine] Error processing work item:', e);
        }
        
        this._workIndex++;
      }
      
      // If work queue complete, rebuild clusters
      if (this._workIndex >= this._workQueue.length) {
        this.buildClusters();
        
        // Reset for next cycle
        this._workQueue = [];
        this._workIndex = 0;
        this._nextTickTime = now + this.config.tickIntervalMs;
        
        this.stats.tickCount++;
      }
      
      this.stats.lastTickTime = performance.now() - tickStartTime;
    } catch (e) {
      console.error('[LinkCorrelationEngine] Error in tick:', e);
      this._nextTickTime = now + this.config.tickIntervalMs;
    }
  }
  
  /**
   * Initialize work queue with link pairs to analyze
   * @private
   */
  _initializeWorkQueue(activeLinks) {
    this._workQueue = [];
    this._workIndex = 0;
    
    // For each link, select candidates based on strategy
    for (let i = 0; i < activeLinks.length; i++) {
      const linkA = activeLinks[i];
      const linkIdA = this._getLinkId(linkA);
      
      if (!linkIdA) continue;
      
      // Select candidate links
      let candidates = [];
      
      if (this.config.candidateStrategy === 'nodeShared') {
        // Links sharing a source or target node
        candidates = this._getCandidatesBySharedNode(linkA, activeLinks);
      } else if (this.config.candidateStrategy === 'global') {
        // All other links
        candidates = activeLinks.filter((_, idx) => idx !== i);
      }
      
      // Add global top links if enabled
      if (this.config.includeGlobalTopLinks) {
        const topGlobal = this._getGlobalTopLinks(activeLinks, this.config.globalTopLinkCount);
        candidates = Array.from(new Set([...candidates, ...topGlobal]));
      }
      
      // Limit candidate count
      candidates = candidates.slice(0, this.config.maxCandidatesPerLink);
      
      // Create work items
      for (const linkB of candidates) {
        const linkIdB = this._getLinkId(linkB);
        if (linkIdB && linkIdB !== linkIdA) {
          this._workQueue.push({
            linkIdA,
            linkIdB,
            linkA,
            linkB,
          });
        }
      }
    }
    
    // Record analysis start
    this.stats.linksAnalyzed = activeLinks.length;
  }
  
  /**
   * Get candidate links by shared node
   * @private
   */
  _getCandidatesBySharedNode(linkA, allLinks) {
    const candidates = [];
    const sourceNodeA = linkA.source;
    const targetNodeA = linkA.target;
    
    for (const linkB of allLinks) {
      if (!linkB || !linkB.active) continue;
      
      // Check if shares source or target
      if (linkB.source === sourceNodeA || linkB.source === targetNodeA ||
          linkB.target === sourceNodeA || linkB.target === targetNodeA) {
        candidates.push(linkB);
      }
    }
    
    return candidates;
  }
  
  /**
   * Get globally top-active links by priority history
   * @private
   */
  _getGlobalTopLinks(allLinks, limit) {
    try {
      const topLinks = [];
      
      // Score each link by average priority
      const scored = allLinks
        .filter(l => l?.active)
        .map(link => {
          const linkId = this._getLinkId(link);
          let avgPriority = 0;
          
          try {
            const history = this.priorityHistoryEngine?.getLinkHistory?.(linkId);
            if (history?.length > 0) {
              avgPriority = history.reduce((sum, s) => sum + (s.score || 0), 0) / history.length;
            }
          } catch (e) {
            // Graceful fallback
          }
          
          return { link, score: avgPriority };
        });
      
      // Sort by score and take top
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, limit).map(s => s.link);
    } catch (e) {
      console.error('[LinkCorrelationEngine] Error getting global top links:', e);
      return [];
    }
  }
  
  /**
   * Process a single work item (compute correlation for one link pair)
   * @private
   */
  _processWorkItem(work) {
    const { linkIdA, linkIdB, linkA, linkB } = work;
    
    if (!linkIdA || !linkIdB || !linkA || !linkB) {
      return;
    }
    
    // Compute correlation
    const score = this.computePair(linkA, linkB);
    
    if (score === null) {
      return; // Insufficient data
    }
    
    // Filter by min/max thresholds
    if (score < this.config.minCorrelationScore || score > this.config.maxCorrelationScore) {
      return;
    }
    
    // Assign tier
    const tier = this.assignTier(score);
    
    // Store in both directions
    this._addCorrelationPartner(linkIdA, linkIdB, score, tier);
    this._addCorrelationPartner(linkIdB, linkIdA, score, tier);
    
    this.stats.correlationsComputed++;
  }
  
  /**
   * Add correlation partner to link's data
   * @private
   */
  _addCorrelationPartner(linkId, partnerId, score, tier) {
    if (!this.correlationData.has(linkId)) {
      this.correlationData.set(linkId, {
        linkId,
        partners: [],
        clusterId: null,
      });
    }
    
    const data = this.correlationData.get(linkId);
    
    // Check if already exists
    const existing = data.partners.find(p => p.otherLinkId === partnerId);
    
    if (existing) {
      // Update with higher score
      existing.corrScore = Math.max(existing.corrScore, score);
      existing.tier = Math.max(existing.tier, tier);
    } else {
      // Add new
      data.partners.push({
        otherLinkId: partnerId,
        corrScore: score,
        tier,
      });
    }
  }
  
  /**
   * Compute correlation between two links
   * Returns null if insufficient data
   * 
   * @param {Object} linkA - Link object
   * @param {Object} linkB - Link object
   * @returns {number|null} Correlation score 0-1 or null
   */
  computePair(linkA, linkB) {
    try {
      const linkIdA = this._getLinkId(linkA);
      const linkIdB = this._getLinkId(linkB);
      
      if (!linkIdA || !linkIdB) return null;
      
      // Get historical priority data
      const historyA = this.priorityHistoryEngine?.getLinkHistory?.(linkIdA) || [];
      const historyB = this.priorityHistoryEngine?.getLinkHistory?.(linkIdB) || [];
      
      // Check minimum sample count
      const minSamples = this.config.minSamplesForCorrelation;
      if (historyA.length < minSamples || historyB.length < minSamples) {
        return null;
      }
      
      // Extract score vectors (common timeline)
      const vecA = historyA.map(s => s.score || 0);
      const vecB = historyB.map(s => s.score || 0);
      
      // Truncate to common length
      const len = Math.min(vecA.length, vecB.length);
      const trimmedA = vecA.slice(-len);
      const trimmedB = vecB.slice(-len);
      
      if (trimmedA.length < minSamples) {
        return null;
      }
      
      // Compute correlation
      const correlation = this.computeCorrelationVector(trimmedA, trimmedB);
      
      // Normalize to 0-1 (Pearson returns -1 to 1, Cosine already 0-1)
      if (this.config.correlationMethod === 'pearson') {
        return (correlation + 1) / 2;
      } else {
        return correlation;
      }
    } catch (e) {
      // Graceful failure on missing data
      return null;
    }
  }
  
  /**
   * Compute Pearson or Cosine correlation between two vectors
   * 
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} Correlation coefficient
   */
  computeCorrelationVector(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length !== vecA.length) {
      return 0;
    }
    
    const n = vecA.length;
    
    if (this.config.correlationMethod === 'cosine') {
      return this._computeCosineCorrelation(vecA, vecB);
    } else {
      // Default: Pearson
      return this._computePearsonCorrelation(vecA, vecB);
    }
  }
  
  /**
   * Compute Pearson correlation coefficient
   * @private
   */
  _computePearsonCorrelation(vecA, vecB) {
    const n = vecA.length;
    let sumA = 0, sumB = 0, sumAB = 0, sumAA = 0, sumBB = 0;
    
    for (let i = 0; i < n; i++) {
      sumA += vecA[i];
      sumB += vecB[i];
      sumAB += vecA[i] * vecB[i];
      sumAA += vecA[i] * vecA[i];
      sumBB += vecB[i] * vecB[i];
    }
    
    const numerator = n * sumAB - sumA * sumB;
    const denominator = Math.sqrt((n * sumAA - sumA * sumA) * (n * sumBB - sumB * sumB));
    
    if (denominator === 0) return 0;
    
    return numerator / denominator;
  }
  
  /**
   * Compute Cosine similarity
   * @private
   */
  _computeCosineCorrelation(vecA, vecB) {
    const n = vecA.length;
    let dotProduct = 0, magA = 0, magB = 0;
    
    for (let i = 0; i < n; i++) {
      dotProduct += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }
    
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    
    if (magA === 0 || magB === 0) return 0;
    
    return dotProduct / (magA * magB);
  }
  
  /**
   * Assign tier based on correlation score
   * 
   * @param {number} score - Correlation score 0-1
   * @returns {number} Tier 0-3
   */
  assignTier(score) {
    if (score < this.config.tierThresholds[0]) {
      return 0; // None
    } else if (score < this.config.tierThresholds[1]) {
      return 1; // Weak
    } else if (score < this.config.tierThresholds[2]) {
      return 2; // Strong
    } else {
      return 3; // Resonant
    }
  }
  
  /**
   * Build synergy clusters from high-correlation links
   * Uses graph traversal to find connected components
   * @private
   */
  buildClusters() {
    try {
      this.clusters.clear();
      this._nextClusterId = 0;
      
      // Clear previous cluster assignments
      for (const data of this.correlationData.values()) {
        data.clusterId = null;
      }
      
      // Find connected components (clusters)
      const visited = new Set();
      
      for (const [linkId, data] of this.correlationData) {
        if (visited.has(linkId)) {
          continue;
        }
        
        // Get high-correlation partners (tier >= minTier)
        const partners = data.partners
          .filter(p => p.tier >= this.config.minClusterTier)
          .map(p => p.otherLinkId);
        
        if (partners.length === 0) {
          continue;
        }
        
        // BFS to find all connected links
        const cluster = new Set([linkId]);
        const queue = [linkId];
        
        while (queue.length > 0) {
          const currentId = queue.shift();
          
          if (visited.has(currentId)) {
            continue;
          }
          
          visited.add(currentId);
          const currentData = this.correlationData.get(currentId);
          
          if (!currentData) continue;
          
          // Add high-correlation partners to cluster
          for (const partner of currentData.partners) {
            if (partner.tier >= this.config.minClusterTier && !visited.has(partner.otherLinkId)) {
              cluster.add(partner.otherLinkId);
              queue.push(partner.otherLinkId);
            }
          }
        }
        
        // Only create cluster if meets minimum size
        if (cluster.size >= this.config.minClusterSize) {
          const clusterId = `cluster_${this._nextClusterId++}`;
          
          // Compute cluster properties
          const linkIds = Array.from(cluster);
          const avgScore = this._computeClusterAverageScore(linkIds);
          const centroidNodes = this._computeClusterCentroidNodes(linkIds);
          
          // Store cluster
          this.clusters.set(clusterId, {
            clusterId,
            linkIds,
            avgScore,
            centroidNodes,
            size: linkIds.length,
          });
          
          // Assign cluster to all links
          for (const linkId of linkIds) {
            const data = this.correlationData.get(linkId);
            if (data) {
              data.clusterId = clusterId;
            }
            visited.add(linkId);
          }
        }
      }
      
      this.stats.clustersFound = this.clusters.size;
    } catch (e) {
      console.error('[LinkCorrelationEngine] Error building clusters:', e);
    }
  }
  
  /**
   * Compute average correlation score within cluster
   * @private
   */
  _computeClusterAverageScore(linkIds) {
    if (linkIds.length === 0) return 0;
    
    let totalScore = 0;
    let count = 0;
    
    for (const linkId of linkIds) {
      const data = this.correlationData.get(linkId);
      if (data && data.partners.length > 0) {
        const avgPartnerScore = data.partners
          .filter(p => linkIds.includes(p.otherLinkId))
          .reduce((sum, p) => sum + p.corrScore, 0) / data.partners.length;
        totalScore += avgPartnerScore;
        count++;
      }
    }
    
    return count > 0 ? totalScore / count : 0;
  }
  
  /**
   * Compute centroid nodes (most frequently shared)
   * @private
   */
  _computeClusterCentroidNodes(linkIds) {
    const nodeFreq = new Map();
    
    for (const linkId of linkIds) {
      // Parse link ID (format: sourceId-targetId)
      const parts = linkId.split('-');
      if (parts.length === 2) {
        const sourceId = parts[0];
        const targetId = parts[1];
        
        nodeFreq.set(sourceId, (nodeFreq.get(sourceId) || 0) + 1);
        nodeFreq.set(targetId, (nodeFreq.get(targetId) || 0) + 1);
      }
    }
    
    // Sort by frequency and take top 3
    const sorted = Array.from(nodeFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);
    
    return sorted;
  }
  
  /**
   * Get correlation metadata for a link
   * 
   * @param {string} linkId - Link ID
   * @returns {Object} Correlation data with partners and cluster
   */
  getCorrelationMeta(linkId) {
    try {
      const data = this.correlationData.get(linkId);
      
      if (!data) {
        return {
          linkId,
          partners: [],
          clusterId: null,
        };
      }
      
      return {
        linkId: data.linkId,
        partners: [...data.partners],
        clusterId: data.clusterId,
      };
    } catch (e) {
      console.error('[LinkCorrelationEngine] Error getting correlation meta:', e);
      return { linkId, partners: [], clusterId: null };
    }
  }
  
  /**
   * Get top N correlated links for a given link
   * 
   * @param {string} linkId - Link ID
   * @param {number} limit - Maximum results to return
   * @returns {Array} Top correlated links
   */
  getTopCorrelatedLinks(linkId, limit = 10) {
    try {
      const data = this.correlationData.get(linkId);
      
      if (!data) {
        return [];
      }
      
      // Sort by correlation score, descending
      const sorted = [...data.partners]
        .sort((a, b) => b.corrScore - a.corrScore)
        .slice(0, limit);
      
      return sorted;
    } catch (e) {
      console.error('[LinkCorrelationEngine] Error getting top correlated links:', e);
      return [];
    }
  }
  
  /**
   * Get all synergy clusters
   * 
   * @returns {Array} Array of cluster objects
   */
  getClusters() {
    try {
      return Array.from(this.clusters.values());
    } catch (e) {
      console.error('[LinkCorrelationEngine] Error getting clusters:', e);
      return [];
    }
  }
  
  /**
   * Get clusters involving a specific node
   * 
   * @param {string|number} nodeId - Node ID
   * @returns {Array} Clusters containing this node
   */
  getClustersForNode(nodeId) {
    try {
      const nodeIdStr = String(nodeId);
      const result = [];
      
      for (const cluster of this.clusters.values()) {
        if (cluster.centroidNodes.includes(nodeIdStr)) {
          result.push(cluster);
        }
      }
      
      return result;
    } catch (e) {
      console.error('[LinkCorrelationEngine] Error getting clusters for node:', e);
      return [];
    }
  }
  
  /**
   * Get engine status
   * 
   * @returns {Object} Status information
   */
  status() {
    return {
      enabled: this._enabled,
      linksTracked: this.correlationData.size,
      clustersFound: this.clusters.size,
      correlationsComputed: this.stats.correlationsComputed,
      linksAnalyzed: this.stats.linksAnalyzed,
      lastTickTime: this.stats.lastTickTime.toFixed(2) + 'ms',
      tickCount: this.stats.tickCount,
      config: {
        tickIntervalMs: this.config.tickIntervalMs,
        correlationMethod: this.config.correlationMethod,
        candidateStrategy: this.config.candidateStrategy,
      },
    };
  }
  
  /**
   * Enable the engine
   */
  enable() {
    this._enabled = true;
  }
  
  /**
   * Disable the engine
   */
  disable() {
    this._enabled = false;
  }
  
  /**
   * Reset all correlation data and clusters
   */
  reset() {
    try {
      this.correlationData.clear();
      this.clusters.clear();
      this._workQueue = [];
      this._workIndex = 0;
      this._nextClusterId = 0;
      
      this.stats = {
        lastTickTime: 0,
        linksAnalyzed: 0,
        correlationsComputed: 0,
        clustersFound: 0,
        tickCount: 0,
      };
    } catch (e) {
      console.error('[LinkCorrelationEngine] Error during reset:', e);
    }
  }
  
  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    if (typeof window === 'undefined') return;
    
    if (!window.game) window.game = {};
    
    window.game.correlationEngine = {
      status: this.status.bind(this),
      getCorrelationMeta: this.getCorrelationMeta.bind(this),
      getTopCorrelatedLinks: this.getTopCorrelatedLinks.bind(this),
      getClusters: this.getClusters.bind(this),
      getClustersForNode: this.getClustersForNode.bind(this),
      enable: this.enable.bind(this),
      disable: this.disable.bind(this),
      reset: this.reset.bind(this),
      tick: (dt) => this.tick(dt),
      getConfig: () => this.config,
      setConfig: (key, value) => {
        if (key in this.config) {
          this.config[key] = value;
          console.log(`[LinkCorrelationEngine] ${key} = ${value}`);
        }
      },
    };
  }
  
  /**
   * Get unique link ID
   * @private
   */
  _getLinkId(link) {
    if (!link) return null;
    
    try {
      const sourceId = link.source?.id ?? link.source?.userData?.id ?? 'unknown';
      const targetId = link.target?.id ?? link.target?.userData?.id ?? 'unknown';
      
      return `${sourceId}-${targetId}`;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Dispose and cleanup
   */
  dispose() {
    try {
      this.reset();
      this.correlationData.clear();
      this.clusters.clear();
    } catch (e) {
      console.error('[LinkCorrelationEngine] Error during dispose:', e);
    }
  }
}
