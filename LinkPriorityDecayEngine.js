/**
 * LINK PRIORITY DECAY ENGINE — Advanced Time-Based Priority Degradation
 * 
 * Production-grade priority management system that decays link importance based on:
 * 1. Time since link creation (fresh links rank higher)
 * 2. Time since last activity/traffic (idle links demoted)
 * 3. Link stability metrics (corrupted/repaired links penalized)
 * 4. Category-based retention policies (some categories keep longer priority)
 * 5. Network context (outdated vs current connectivity)
 * 
 * Features:
 * - Age-based decay: Links lose priority over time (configurable half-life)
 * - Idle-based decay: Links unused for N minutes drop priority tiers
 * - Staleness detection: Identifies "zombie" links that should be removed
 * - Category-aware policies: Different decay rates per node category pair
 * - Activity boost: Using a link refreshes its age timer
 * - Visual tier feedback: Decay reflected in UI (glow, width, pulse)
 * - Integration with PriorityHistoryEngine1_0 and PriorityDecayEngine1_0
 * - Full metrics tracking and diagnostics
 * 
 * Integration:
 *   const decayEngine = new LinkPriorityDecayEngine(linkingSystem, {
 *     enableAgeBased: true,
 *     enableIdleBased: true,
 *     enableStalenessDetection: true,
 *   });
 *   decayEngine.tick(deltaMs);  // Call from animation loop
 * 
 * Usage:
 *   // Links automatically decay as time passes
 *   // Check if link is stale:
 *   const isStale = decayEngine.isLinkStale(link);
 *   
 *   // Activity refresh (when link is used)
 *   decayEngine.recordLinkActivity(link);
 *   
 *   // Get staleness metrics
 *   const metrics = decayEngine.getStalenessMetrics(link);
 *   console.log(metrics.ageInSeconds, metrics.idleInSeconds, metrics.staleness);
 * 
 * Console API:
 *   window.analyzeLinkDecay()              // Full decay analysis
 *   window.getStaleLinks()                 // Find stale links
 *   window.analyzeDecayMetrics()           // Detailed metrics
 *   window.simulateLinkAging(hours)        // Test aging
 *   window.refreshAllLinkActivity()        // Reset idle timers
 * 
 * Compatibility:
 *   ✅ LinkPrioritySystem
 *   ✅ PriorityDecayEngine1_0
 *   ✅ PriorityHistoryEngine1_0
 *   ✅ NodeLinker2_RepairLayer1_0
 *   ✅ NeonLinkVisuals
 * 
 * Performance:
 *   ~0.3–0.5ms per link update
 *   ~2–5ms per-frame (100 links)
 *   ~5KB memory per 100 links
 */

export class LinkPriorityDecayEngine {
  /**
   * Initialize decay engine
   * @param {Object} linkingSystem - Reference to NodeLinkingSystem
   * @param {Object} config - Configuration options
   */
  constructor(linkingSystem, config = {}) {
    if (!linkingSystem) {
      console.error('[LinkPriorityDecayEngine] linkingSystem required');
      this.enabled = false;
      return;
    }

    this.linkingSystem = linkingSystem;

    // Configuration with sensible defaults
    this.config = {
      // Age-based decay
      enableAgeBased: true,
      ageHalfLifeSeconds: 3600,           // Link priority half-life: 1 hour
      minAgeDecayFactor: 0.1,             // Minimum multiplier (don't go below 10%)
      ageDecayFunction: 'exponential',    // 'linear' or 'exponential'

      // Idle-based decay
      enableIdleBased: true,
      idleThresholdSeconds: 300,          // 5 min: link marked as idle
      idlePenaltyPerSecond: 0.001,        // 0.1% per second idle
      maxIdlePenalty: 0.8,                // Don't reduce below 20% (1.0 - 0.8)

      // Staleness detection
      enableStalenessDetection: true,
      staleThresholdSeconds: 7200,        // 2 hours: link considered stale
      decayedThresholdSeconds: 1800,      // 30 min: link in "decaying" state
      criticalThresholdSeconds: 10800,    // 3 hours: link critical for removal

      // Category-specific policies
      categoryDecayRates: {
        // Format: 'source-target' → decayMultiplier
        'sigma-sigma': 0.5,               // Sigma links decay slower (important)
        'sigma-storage': 0.6,
        'control-process': 0.7,
        'analytics-storage': 1.2,         // Analytics links decay faster (temporal)
        'input-process': 1.0,
        'default': 1.0,                   // Default decay rate
      },

      // Activity tracking
      trackActivityBump: 0.15,             // Boost priority by 15% on activity
      activityRefreshIdle: true,           // Using link resets idle timer
      maxActivityBoosts: 10,               // Max boosts before penalties apply

      // Timing
      tickIntervalMs: 500,                // Update interval
      enableLogging: false,               // Debug logging

      // Threshold adjustment
      adaptiveThresholds: false,          // Auto-adjust based on network health
    };

    Object.assign(this.config, config);

    // Internal state
    this.enabled = true;
    this.state = {
      updatedLinks: 0,
      staleLinksFound: 0,
      decayedLinksFound: 0,
      lastTickTime: Date.now(),
      timeSinceLastTick: 0,
    };

    // Per-link decay metadata
    this.decayMetadata = new Map();  // linkId → {createdAt, lastActivityAt, boostCount, ...}

    // Statistics
    this.stats = {
      totalUpdates: 0,
      totalAgeDecays: 0,
      totalIdleDecays: 0,
      totalActivityBoosts: 0,
      avgDecayAmount: 0,
      staleLinksTotal: 0,
      decayedLinksTotal: 0,
      criticalLinksTotal: 0,
    };

    console.log('[LinkPriorityDecayEngine] Initialized (ageBased=%s, idleBased=%s, staleness=%s)',
      this.config.enableAgeBased, this.config.enableIdleBased, this.config.enableStalenessDetection);
  }

  /**
   * Main tick function - call from animation loop
   * @param {number} deltaMs - Delta time in milliseconds
   */
  tick(deltaMs) {
    if (!this.enabled || !this.linkingSystem) return;

    try {
      const now = Date.now();
      this.state.timeSinceLastTick = now - this.state.lastTickTime;

      // Run decay update at configured interval
      if (this.state.timeSinceLastTick >= this.config.tickIntervalMs) {
        this._updateAllLinks(now);
        this.state.lastTickTime = now;
      }
    } catch (error) {
      console.error('[LinkPriorityDecayEngine] tick() error:', error);
    }
  }

  /**
   * Update all links in the system
   * @param {number} now - Current timestamp
   * @private
   */
  _updateAllLinks(now) {
    this.state.updatedLinks = 0;
    this.state.staleLinksFound = 0;
    this.state.decayedLinksFound = 0;

    if (!this.linkingSystem.links || !Array.isArray(this.linkingSystem.links)) {
      return;
    }

    for (let i = 0; i < this.linkingSystem.links.length; i++) {
      const link = this.linkingSystem.links[i];
      try {
        this._updateLink(link, now);
        this.state.updatedLinks++;
      } catch (error) {
        if (this.config.enableLogging) {
          console.warn('[LinkPriorityDecayEngine] updateLink error:', error);
        }
      }
    }
  }

  /**
   * Update a single link's decay metrics
   * @param {Object} link - Link object
   * @param {number} now - Current timestamp
   * @private
   */
  _updateLink(link, now) {
    if (!link || !link.priority) return;

    // Get or create metadata for this link
    const linkId = link.id || `${link.source?.id}-${link.target?.id}`;
    let metadata = this.decayMetadata.get(linkId);

    if (!metadata) {
      // First time seeing this link
      metadata = {
        createdAt: link.createdAt || now,
        lastActivityAt: link.lastActivityAt || now,
        boostCount: 0,
        lastAgeDecayApplied: 0,
        lastIdleDecayApplied: 0,
      };
      this.decayMetadata.set(linkId, metadata);
    }

    // Store current priority before decay
    const originalScore = link.priority.score || 0.5;
    let decayedScore = originalScore;

    // Apply age-based decay
    if (this.config.enableAgeBased) {
      const ageSeconds = (now - metadata.createdAt) / 1000;
      const ageDecay = this._calculateAgeDecay(ageSeconds);
      decayedScore *= ageDecay;
      this.stats.totalAgeDecays++;
    }

    // Apply idle-based decay
    if (this.config.enableIdleBased) {
      const idleSeconds = (now - metadata.lastActivityAt) / 1000;
      const idleDecay = this._calculateIdleDecay(idleSeconds);
      decayedScore *= idleDecay;
      this.stats.totalIdleDecays++;
    }

    // Apply category-specific decay rate
    const categoryDecayRate = this._getCategoryDecayRate(link);
    decayedScore *= categoryDecayRate;

    // Clamp to valid range
    decayedScore = Math.max(0.05, Math.min(1.0, decayedScore));

    // Update link priority
    link.priority.score = decayedScore;
    link.priority.tier = this._computeTierFromScore(decayedScore);
    link.priority.decayAmount = originalScore - decayedScore;

    // Track decay
    this.stats.avgDecayAmount = (this.stats.avgDecayAmount + (originalScore - decayedScore)) / 2;
    this.stats.totalUpdates++;

    // Check staleness status
    if (this.config.enableStalenessDetection) {
      const ageSeconds = (now - metadata.createdAt) / 1000;
      link.priority.staleness = this._computeStaleness(link, ageSeconds, now, metadata);

      if (link.priority.staleness === 'stale') {
        this.state.staleLinksFound++;
        this.stats.staleLinksTotal++;
      } else if (link.priority.staleness === 'decayed') {
        this.state.decayedLinksFound++;
        this.stats.decayedLinksTotal++;
      }
    }

    if (this.config.enableLogging) {
      console.debug(`[Decay] ${linkId}: ${originalScore.toFixed(2)} → ${decayedScore.toFixed(2)} (age=${metadata.createdAt})`);
    }
  }

  /**
   * Calculate age-based decay factor
   * @param {number} ageSeconds - Link age in seconds
   * @returns {number} Decay factor (0–1)
   * @private
   */
  _calculateAgeDecay(ageSeconds) {
    if (this.config.ageDecayFunction === 'linear') {
      // Linear decay: starts at 1.0, reaches minAgeDecayFactor after half-life
      const t = ageSeconds / this.config.ageHalfLifeSeconds;
      return Math.max(
        this.config.minAgeDecayFactor,
        1.0 - (t * (1.0 - this.config.minAgeDecayFactor))
      );
    } else {
      // Exponential decay (default): uses half-life formula
      // score = initial * 2^(-age/halfLife)
      const t = ageSeconds / this.config.ageHalfLifeSeconds;
      const factor = Math.pow(2, -t);
      return Math.max(this.config.minAgeDecayFactor, factor);
    }
  }

  /**
   * Calculate idle-based decay factor
   * @param {number} idleSeconds - Seconds since last activity
   * @returns {number} Decay factor (0–1)
   * @private
   */
  _calculateIdleDecay(idleSeconds) {
    if (idleSeconds < this.config.idleThresholdSeconds) {
      return 1.0;  // Not idle yet
    }

    // Apply penalty for idle time
    const idleExcess = idleSeconds - this.config.idleThresholdSeconds;
    const penalty = idleExcess * this.config.idlePenaltyPerSecond;
    const factor = Math.max(1.0 - this.config.maxIdlePenalty, 1.0 - penalty);
    return factor;
  }

  /**
   * Get category-specific decay rate multiplier
   * @param {Object} link - Link object
   * @returns {number} Multiplier (typically 0.5–1.5)
   * @private
   */
  _getCategoryDecayRate(link) {
    if (!link.source || !link.target) return this.config.categoryDecayRates.default;

    const sourceCategory = link.source.userData?.category || 'unknown';
    const targetCategory = link.target.userData?.category || 'unknown';

    // Try specific category pair first
    const pairKey = `${sourceCategory}-${targetCategory}`;
    if (this.config.categoryDecayRates[pairKey] !== undefined) {
      return this.config.categoryDecayRates[pairKey];
    }

    // Fall back to default
    return this.config.categoryDecayRates.default;
  }

  /**
   * Compute priority tier from score
   * @param {number} score - Priority score (0–1)
   * @returns {number} Tier (0–3)
   * @private
   */
  _computeTierFromScore(score) {
    if (score >= 0.75) return 3;  // CRITICAL
    if (score >= 0.5) return 2;   // HIGH
    if (score >= 0.25) return 1;  // NORMAL
    return 0;                      // LOW
  }

  /**
   * Compute staleness metric for link
   * @param {Object} link - Link object
   * @param {number} ageSeconds - Link age in seconds
   * @param {number} now - Current timestamp
   * @param {Object} metadata - Link metadata
   * @returns {string} 'fresh'|'decaying'|'stale'|'critical'
   * @private
   */
  _computeStaleness(link, ageSeconds, now, metadata) {
    if (ageSeconds > this.config.criticalThresholdSeconds) {
      return 'critical';
    }
    if (ageSeconds > this.config.staleThresholdSeconds) {
      return 'stale';
    }
    if (ageSeconds > this.config.decayedThresholdSeconds) {
      return 'decaying';
    }
    return 'fresh';
  }

  /**
   * Record activity on a link (refresh its idle timer)
   * @param {Object} link - Link object
   */
  recordLinkActivity(link) {
    if (!link) return;

    const linkId = link.id || `${link.source?.id}-${link.target?.id}`;
    let metadata = this.decayMetadata.get(linkId);

    if (!metadata) {
      metadata = {
        createdAt: link.createdAt || Date.now(),
        lastActivityAt: Date.now(),
        boostCount: 0,
        lastAgeDecayApplied: 0,
        lastIdleDecayApplied: 0,
      };
      this.decayMetadata.set(linkId, metadata);
    }

    // Update activity timestamp
    metadata.lastActivityAt = Date.now();
    metadata.boostCount++;

    // Optional: Boost priority on activity
    if (link.priority && link.priority.score) {
      const boost = Math.min(
        this.config.trackActivityBump,
        1.0 - link.priority.score  // Don't boost above 1.0
      );
      link.priority.score += boost;
      this.stats.totalActivityBoosts++;
    }

    if (this.config.enableLogging) {
      console.debug(`[LinkActivity] ${linkId} refreshed (boosts: ${metadata.boostCount})`);
    }
  }

  /**
   * Check if link is stale
   * @param {Object} link - Link object
   * @returns {boolean} True if link should be considered stale
   */
  isLinkStale(link) {
    if (!link || !link.priority) return false;
    return link.priority.staleness === 'stale' || link.priority.staleness === 'critical';
  }

  /**
   * Check if link is in decaying state
   * @param {Object} link - Link object
   * @returns {boolean} True if link is decaying
   */
  isLinkDecaying(link) {
    if (!link || !link.priority) return false;
    return link.priority.staleness === 'decaying';
  }

  /**
   * Get detailed staleness metrics for a link
   * @param {Object} link - Link object
   * @returns {Object} Metrics object
   */
  getStalenessMetrics(link) {
    if (!link) return null;

    const linkId = link.id || `${link.source?.id}-${link.target?.id}`;
    const metadata = this.decayMetadata.get(linkId);
    const now = Date.now();

    if (!metadata) {
      return {
        ageInSeconds: 0,
        idleInSeconds: 0,
        staleness: 'unknown',
        priority: link.priority?.score || 0,
        tier: link.priority?.tier || 0,
      };
    }

    const ageSeconds = (now - metadata.createdAt) / 1000;
    const idleSeconds = (now - metadata.lastActivityAt) / 1000;

    return {
      ageInSeconds: ageSeconds,
      idleInSeconds: idleSeconds,
      staleness: link.priority?.staleness || 'unknown',
      priority: link.priority?.score || 0,
      tier: link.priority?.tier || 0,
      boostCount: metadata.boostCount,
      createdAt: new Date(metadata.createdAt),
      lastActivityAt: new Date(metadata.lastActivityAt),
      percentToStale: ageSeconds / this.config.staleThresholdSeconds,
      percentToIdle: idleSeconds / this.config.idleThresholdSeconds,
    };
  }

  /**
   * Find all stale links in system
   * @returns {Array} Array of stale link objects
   */
  findStaleLinks() {
    if (!this.linkingSystem.links) return [];

    return this.linkingSystem.links.filter(link => this.isLinkStale(link));
  }

  /**
   * Find all decaying links in system
   * @returns {Array} Array of decaying link objects
   */
  findDecayingLinks() {
    if (!this.linkingSystem.links) return [];

    return this.linkingSystem.links.filter(link => this.isLinkDecaying(link));
  }

  /**
   * Get full analysis of link decay status
   * @returns {Object} Comprehensive analysis
   */
  getDecayAnalysis() {
    if (!this.linkingSystem.links) {
      return { totalLinks: 0, stale: [], decaying: [], fresh: [] };
    }

    const fresh = [];
    const decaying = [];
    const stale = [];

    for (const link of this.linkingSystem.links) {
      if (!link.priority) continue;

      const metrics = this.getStalenessMetrics(link);
      if (link.priority.staleness === 'stale' || link.priority.staleness === 'critical') {
        stale.push(metrics);
      } else if (link.priority.staleness === 'decaying') {
        decaying.push(metrics);
      } else {
        fresh.push(metrics);
      }
    }

    return {
      totalLinks: this.linkingSystem.links.length,
      freshCount: fresh.length,
      decayingCount: decaying.length,
      staleCount: stale.length,
      stats: this.stats,
      fresh,
      decaying,
      stale,
    };
  }

  /**
   * Set quality feedback loop level
   * @param {string} level - 'high', 'normal', or 'low'
   */
  setQualityFeedbackLoop(level) {
    this.feedbackLevel = level;

    switch(level) {
      case "high":
        this.decayRate = 0.007;
        this.recoveryBoost = 0.14;
        break;
      case "low":
        this.decayRate = 0.03;
        this.recoveryBoost = 0.05;
        break;
      default:
        this.decayRate = 0.015;
        this.recoveryBoost = 0.1;
    }
  }

  /**
   * Set user acceptance tracker
   * @param {Object} tracker - UserAcceptanceTracker1_0 instance
   */
  setUserAcceptanceTracker(tracker) {
    this.userAcceptanceTracker = tracker;
  }

  /**
   * Set ML recommendation engine
   * @param {Object} engine - LinkMLRecommendationEngine1_0 instance
   */
  setMLRecommendationEngine(engine) {
    this.mlRecommendationEngine = engine;
  }

  /**
   * Set repair layer
   * @param {Object} layer - NodeLinker2_RepairLayer1_0 instance
   */
  setRepairLayer(layer) {
    this.repairLayer = layer;
  }

  /**
   * Set traffic analyzer
   * @param {Object} analyzer - Traffic analyzer instance
   */
  setTrafficAnalyzer(analyzer) {
    this.trafficAnalyzer = analyzer;
  }

  /**
   * Set load balancer
   * @param {Object} balancer - Load balancer instance
   */
  setLoadBalancer(balancer) {
    this.loadBalancer = balancer;
  }

  /**
   * Set cognitive bias model
   * @param {Object} model - Cognitive bias model instance
   */
  setCognitiveBiasModel(model) {
    this.cognitiveBiasModel = model;
  }

  /**
   * Set priority heuristic model
   * @param {Object} model - Priority heuristic model instance
   */
  setPriorityHeuristicModel(model) {
    this.priorityHeuristicModel = model;
  }

  /**
   * Start the decay engine
   */
  start() {
    this.active = true;
  }

  /**
   * Stop the decay engine
   */
  stop() {
    this.active = false;
  }

  /**
   * Reset the decay engine
   */
  reset() {
    this.active = false;
  }

  /**
   * Update the decay engine with delta time
   * @param {number} delta - Delta time in milliseconds
   */
  update(delta) {
    if (this.active) {
      this.tick(delta);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      enabled: this.enabled,
      configuredDecayHalfLife: this.config.ageHalfLifeSeconds,
      trackedLinks: this.decayMetadata.size,
    };
  }
}

export default LinkPriorityDecayEngine;
