/**
 * LINK PRIORITY SYSTEM v1.0 (SAFE EDITION)
 * 
 * Non-invasive priority model for node connections in ATOMA.
 * Integrates seamlessly with existing Linking Stack:
 * - Audit 6.2 guards (preserved)
 * - Stabilization Pack 2.0 (preserved)
 * - Patch 3.1 Safe Dispose (preserved)
 * - Patch 3.2 Hybrid Link Lookup (preserved)
 * 
 * Features:
 * - Priority scoring based on category strength, synergy, traffic, stability
 * - Four-tier visual weight system (tier 0-3)
 * - Automatic traffic decay (0.95x every 500ms)
 * - Background stability penalty tracking (hooks ready for future use)
 * - Defensive guards: null checks, fallbacks, safe type coercion
 * 
 * API:
 * - initializeLinkPriority(link) - Called when link is created
 * - registerLinkUsage(link) - Called when link transmits data
 * - computePriorityScore(link) - Recompute priority tier
 * - getVisualWeightForPriority(link) - Get VFX multipliers (width, glow, pulse)
 * - getPriorityLabel(tier) - Get human-readable tier label
 * 
 * Safety: All new data added to link.priority sub-object (non-destructive).
 * Existing API unchanged. Full backward compatibility.
 */

export class LinkPrioritySystem {
  /**
   * Category base priority mapping
   * Higher values = more important connections
   */
  static CATEGORY_BASE_PRIORITY = {
    'control':     0.7,     // Core system control
    'sigma':       0.7,     // Special node
    'prime':       0.7,     // Special node
    'integration': 0.5,     // Integration hub
    'analytics':   0.5,     // Analysis tier
    'quantum':     0.5,     // Special node
    'process':     0.4,     // Process tier
    'storage':     0.4,     // Storage tier
    'input':       0.3,     // Input tier (default entry)
    'error':       0.3,     // Error handlers
    'mythic':      0.3,     // Mythic tier (fallback)
  };

  /**
   * Synergy multiplier mapping
   * Maps synergy labels to multiplier values
   */
  static SYNERGY_MULTIPLIER = {
    'ULTRA':   1.4,   // Extreme synergy
    'EXTREME': 1.4,   // Extreme synergy (same as ULTRA)
    'HIGH':    1.2,   // High synergy
    'NORMAL':  1.0,   // Normal synergy (neutral)
    'LOW':     0.9,   // Low synergy (slight penalty)
  };

  /**
   * Visual tier system
   * tier: { widthMultiplier, glowMultiplier, pulseSpeedMultiplier }
   */
  static TIER_VISUALS = {
    0: { widthMultiplier: 0.7,  glowMultiplier: 0.8,  pulseSpeedMultiplier: 0.9  },
    1: { widthMultiplier: 1.0,  glowMultiplier: 1.0,  pulseSpeedMultiplier: 1.0  },
    2: { widthMultiplier: 1.4,  glowMultiplier: 1.2,  pulseSpeedMultiplier: 1.2  },
    3: { widthMultiplier: 1.8,  glowMultiplier: 1.4,  pulseSpeedMultiplier: 1.5  },
  };
  static PRIORITY_TICK_MS = 500;

  /**
   * Tier labels for HUD display
   */
  static TIER_LABELS = {
    0: 'LOW',
    1: 'NORMAL',
    2: 'HIGH',
    3: 'CRITICAL',
  };

  /**
   * Internal authority funnel for all link.priority mutations.
   * Filters allowed fields and applies updates atomically within this system.
   *
   * @param {Object} link - Link object
   * @param {Object} patch - Fields to update on link.priority
   * @param {string} [source='LinkPrioritySystem'] - Optional source tag for debugging
   * @returns {void}
   */
  static applyPriorityUpdate(link, patch, source = 'LinkPrioritySystem') {
    if (!link || !patch || typeof patch !== 'object') {
      return;
    }

    // Ensure priority container exists (non-destructive)
    link.priority = link.priority || {};

    // Allowed fields for mutation
    const allowedFields = new Set([
      'score',
      'tier',
      'traffic',
      'stabilityPenalty',
      '_lastScoreUpdate',
      '_lastTrafficUpdate',
      'base',
      'synergyMultiplier',
      'decayAmount',
      'staleness',
    ]);

    for (const [key, value] of Object.entries(patch)) {
      if (!allowedFields.has(key)) continue;
      link.priority[key] = value;
    }
    // Clear dirty flag after authoritative apply
    if (link.priority._dirty === true && ('score' in patch || 'tier' in patch || 'traffic' in patch || 'stabilityPenalty' in patch)) {
      link.priority._dirty = false;
    }
  }

  /**
   * Marks a link's priority as dirty for deferred recomputation.
   * @param {Object} link - Link object
   */
  static markPriorityDirty(link) {
    if (!link) return;
    link.priority = link.priority || {};
    link.priority._dirty = true;
  }

  /**
   * Initialize priority system (internal structure)
   * Called automatically when link is created
   * 
   * @param {Object} link - Link object to initialize
   * @returns {void}
   */
  static initializeLinkPriority(link) {
    if (!link) {
      console.warn('[LinkPriority] Cannot initialize null link');
      return;
    }

    // Create priority sub-object (non-destructive: only adds new fields)
    this.applyPriorityUpdate(link, {
      traffic: 0,
      stabilityPenalty: 0,
      _lastScoreUpdate: Date.now(),
    });

    // Initial score computation
    this.computePriorityScore(link);

    console.debug(`[LinkPriority] Link initialized: tier=${link.priority.tier} | score=${link.priority.score.toFixed(2)}`);
  }

  /**
   * Get base priority from source/target categories
   * Safe fallback to 0.3 if category not found
   * 
   * @param {Object} link - Link object with source/target
   * @returns {number} Base priority (0.0–0.7)
   */
  static getBasePriorityFromCategories(link) {
    if (!link || !link.source || !link.target) {
      return 0.3; // Safe fallback
    }

    try {
      const sourceCategory = link.source?.userData?.category || 'input';
      const targetCategory = link.target?.userData?.category || 'input';

      // Get base priority for source (start point is more important)
      const sourceBase = this.CATEGORY_BASE_PRIORITY[sourceCategory] ?? 0.3;

      // Get base priority for target (destination matters too)
      const targetBase = this.CATEGORY_BASE_PRIORITY[targetCategory] ?? 0.3;

      // Combine: avg of source and target
      return (sourceBase + targetBase) / 2;
    } catch (err) {
      console.warn('[LinkPriority] Error getting base priority:', err);
      return 0.3;
    }
  }

  /**
   * Get synergy multiplier from link's recorded synergy
   * Safe extraction with NORMAL fallback
   * 
   * @param {Object} link - Link object (may have link.synergy or link.synergyLabel)
   * @returns {number} Synergy multiplier (0.9–1.4)
   */
  static getSynergyMultiplier(link) {
    if (!link) {
      return 1.0; // Neutral
    }

    try {
      // Try multiple possible synergy field locations
      let synergyValue = link.synergy 
        || link.synergyLabel 
        || link.userData?.synergy 
        || link.userData?.synergyLabel;

      if (!synergyValue) {
        return 1.0; // Default neutral
      }

      // Convert to string and uppercase for safe lookup
      const synergyKey = String(synergyValue).toUpperCase();

      // Lookup with fallback to NORMAL
      return this.SYNERGY_MULTIPLIER[synergyKey] ?? 1.0;
    } catch (err) {
      console.warn('[LinkPriority] Error getting synergy multiplier:', err);
      return 1.0;
    }
  }

  /**
   * Compute priority score and tier for a link
   * Called during initialization and when conditions change
   * 
   * @param {Object} link - Link to score
   * @returns {void}
   */
  static computePriorityScore(link) {
    if (!link) {
      return;
    }

    // Initialize if missing
    if (!link.priority) {
      link.priority = {};
    }

    try {
      // Get components
      const base = this.getBasePriorityFromCategories(link);
      const synergy = this.getSynergyMultiplier(link);
      const traffic = (link.priority?.traffic ?? 0);
      const penalty = Math.min(link.priority?.stabilityPenalty ?? 0, 0.7);

      // Compute raw score: base * synergy * (1 + traffic) * (1 - penalty)
      let raw = base * synergy * (1 + traffic) * (1 - penalty);

      // Clamp to 0.0–1.0
      const score = Math.max(0.0, Math.min(1.0, raw));

      // Determine tier
      let tier = 0;
      if (score >= 0.75) {
        tier = 3;
      } else if (score >= 0.5) {
        tier = 2;
      } else if (score >= 0.25) {
        tier = 1;
      } else {
        tier = 0;
      }

      // Update link
      this.applyPriorityUpdate(link, {
        score,
        tier,
        _lastScoreUpdate: Date.now(),
      });
      if (link.priority) {
        link.priority._dirty = false;
        link.priority._lastPriorityTick = Date.now();
        // Refresh read-only snapshot after authoritative recompute
        this._updatePrioritySnapshot(link);
      }

      console.debug(`[LinkPriority] Score: ${score.toFixed(2)} | tier=${tier} | traffic=${traffic.toFixed(2)} | synergy=${synergy}`);
    } catch (err) {
      console.warn('[LinkPriority] Error computing priority score:', err);
      // Fallback to tier 0 on error
      this.applyPriorityUpdate(link, {
        score: 0,
        tier: 0,
      });
    }
  }

  /**
   * Register link usage (called when link transmits data)
   * Increments traffic counter for short-term boost
   * 
   * @param {Object} link - Link that is being used
   * @returns {void}
   */
  static registerLinkUsage(link) {
    if (!link || !link.priority) {
      return;
    }

    // Throttle: only update once per 50ms to avoid per-frame spam
    const now = Date.now();
    const lastUpdate = link.priority._lastTrafficUpdate ?? 0;
    if (now - lastUpdate < 50) {
      return; // Too soon, skip
    }

    // Increment traffic (0–1 range)
    const newTraffic = Math.min(1.0, (link.priority.traffic ?? 0) + 0.05);
    this.applyPriorityUpdate(link, {
      _lastTrafficUpdate: now,
      traffic: newTraffic,
    });
    // Mark for deferred recompute (handled on priority tick)
    this.markPriorityDirty(link);
  }

  /**
   * Apply decay to link traffic (background process)
   * Called every ~500ms to simulate traffic fade
   * 
   * @param {Array<Object>} links - Array of all links in system
   * @returns {void}
   */
  static applyTrafficDecay(links) {
    if (!Array.isArray(links)) {
      return;
    }

    try {
      let decayedCount = 0;

      for (const link of links) {
        if (!link?.priority) continue;

        const oldTraffic = link.priority.traffic ?? 0;

        // Apply decay: multiply by 0.95 (5% fade per cycle)
        const decayedTraffic = Math.max(0, oldTraffic * 0.95);
        this.applyPriorityUpdate(link, { traffic: decayedTraffic });

        // Recompute if traffic significantly changed
        if (Math.abs(oldTraffic - decayedTraffic) > 0.01) {
          this.markPriorityDirty(link);
          decayedCount++;
        }
      }

      // Process all dirty priorities once per tick
      this.processDirtyPriorities(links);

      if (decayedCount > 0) {
        console.debug(`[LinkPriority] Traffic decay: ${decayedCount} links updated`);
      }
    } catch (err) {
      console.warn('[LinkPriority] Error in traffic decay:', err);
    }
  }

  /**
   * Apply stability penalty to a link
   * Hook for future corruption/instability tracking
   * 
   * @param {Object} link - Link to penalize
   * @param {number} penalty - Penalty value (0.0–0.7)
   * @returns {void}
   */
  static applyInstabilityPenalty(link, penalty) {
    if (!link || !link.priority) {
      return;
    }

    try {
      // Clamp penalty to safe range
      const safePenalty = Math.max(0, Math.min(0.7, penalty));
      this.applyPriorityUpdate(link, { stabilityPenalty: safePenalty });

      // Mark for deferred recompute
      this.markPriorityDirty(link);

      console.debug(`[LinkPriority] Stability penalty applied: ${safePenalty.toFixed(2)}`);
    } catch (err) {
      console.warn('[LinkPriority] Error applying stability penalty:', err);
    }
  }

  /**
   * Get visual weight parameters for a link's priority
   * Used by NeonLinkVisuals to scale VFX
   * 
   * @param {Object} link - Link to get visuals for
   * @returns {Object} { widthMultiplier, glowMultiplier, pulseSpeedMultiplier }
   */
  static getVisualWeightForPriority(link) {
    if (!link || !link.priority) {
      // Fallback to tier 1 (neutral)
      return this.TIER_VISUALS[1];
    }

    try {
      const tier = link.priority.tier ?? 1;
      const visual = this.TIER_VISUALS[tier] || this.TIER_VISUALS[1];

      console.debug(`[LinkPriority][VFX] Tier ${tier} weight applied`);

      return visual;
    } catch (err) {
      console.warn('[LinkPriority] Error getting visual weight:', err);
      return this.TIER_VISUALS[1]; // Safe fallback
    }
  }

  /**
   * Get priority tier label for HUD display
   * 
   * @param {number} tier - Priority tier (0–3)
   * @returns {string} Human-readable label
   */
  static getPriorityLabel(tier) {
    if (typeof tier !== 'number' || tier < 0 || tier > 3) {
      return 'UNKNOWN';
    }
    return this.TIER_LABELS[tier] || 'UNKNOWN';
  }

  /**
   * Get max priority tier among multiple links
   * Useful for HUD display (show highest priority)
   * 
   * @param {Array<Object>} links - Array of links
   * @returns {number} Highest tier found (0–3) or 0 if empty
   */
  static getMaxPriorityTier(links) {
    if (!Array.isArray(links) || links.length === 0) {
      return 0;
    }

    let maxTier = 0;
    for (const link of links) {
      if (link?.priority?.tier != null) {
        maxTier = Math.max(maxTier, link.priority.tier);
      }
    }
    return maxTier;
  }

  /**
   * Get average priority score among links
   * Useful for detailed HUD stats
   * 
   * @param {Array<Object>} links - Array of links
   * @returns {number} Average score (0.0–1.0) or 0 if empty
   */
  static getAveragePriorityScore(links) {
    if (!Array.isArray(links) || links.length === 0) {
      return 0;
    }

    try {
      let sum = 0;
      let count = 0;

      for (const link of links) {
        if (link?.priority?.score != null) {
          sum += link.priority.score;
          count++;
        }
      }

      return count > 0 ? sum / count : 0;
    } catch (err) {
      console.warn('[LinkPriority] Error computing average score:', err);
      return 0;
    }
  }

  /**
   * Reset priority for a link (used on reinitialization)
   * 
   * @param {Object} link - Link to reset
   * @returns {void}
   */
  static resetLinkPriority(link) {
    if (!link) {
      return;
    }

    link.priority = {};
    this.applyPriorityUpdate(link, {
      base: 0.3,
      synergyMultiplier: 1.0,
      traffic: 0,
      stabilityPenalty: 0,
      score: 0.3,
      tier: 0,
      _lastScoreUpdate: Date.now(),
      _lastTrafficUpdate: Date.now(),
    });

    this._updatePrioritySnapshot(link);

    console.debug('[LinkPriority] Link priority reset');
  }

  /**
   * Process all dirty priorities once per priority tick (called from decay tick).
   * @param {Array<Object>} links - Array of links
   */
  static processDirtyPriorities(links) {
    if (!Array.isArray(links)) return;
    for (const link of links) {
      if (!link?.priority || !link.priority._dirty) continue;
      this.computePriorityScore(link);
    }
  }

  /**
   * Update read-only snapshot for a link after authoritative recompute.
   * Snapshot is derived only; never authoritative.
   * @param {Object} link
   * @private
   */
  static _updatePrioritySnapshot(link) {
    if (!link || !link.priority) return;
    link.prioritySnapshot = {
      score: link.priority.score ?? 0,
      tier: link.priority.tier ?? 0,
      traffic: link.priority.traffic ?? 0,
      stabilityPenalty: link.priority.stabilityPenalty ?? 0,
      staleness: link.priority.staleness ?? 'unknown',
      decayAmount: link.priority.decayAmount ?? 0,
      lastScoreUpdate: link.priority._lastScoreUpdate ?? 0,
      lastTrafficUpdate: link.priority._lastTrafficUpdate ?? 0,
      lastPriorityTick: link.priority._lastPriorityTick ?? 0,
    };
    Object.freeze(link.prioritySnapshot);
  }

  /**
   * Read-only accessor for priority snapshot.
   * @param {Object} link
   * @returns {Object|null} Snapshot object (frozen) or null if unavailable
   */
  static getPrioritySnapshot(link) {
    if (!link) return null;
    return link.prioritySnapshot || null;
  }
}

export default LinkPrioritySystem;
