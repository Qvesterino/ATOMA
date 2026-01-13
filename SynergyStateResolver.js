/**
 * ============================================================================
 * SYNERGY STATE RESOLVER — Single Source of Truth for Synergy State
 * ============================================================================
 * 
 * PROBLEM SOLVED:
 * - 6+ conflicting threshold sets scattered across codebase
 * - Hard-coded magic numbers (0.50, 0.75, 0.85, etc.) in visual code
 * - No centralized state representation
 * - Visuals reading raw numeric synergy in 25+ places
 * 
 * SOLUTION:
 * Translates continuous numeric synergy (0–1) into discrete SynergyState.
 * Single source of truth for all threshold decisions.
 * Visuals read STATE, not raw synergy.
 * 
 * ============================================================================
 */

/**
 * Discrete synergy states — semantic representation of connection quality
 * @readonly
 */
export const SynergyState = {
  LOW: "LOW",           // synergy < 0.50  — Barely connected
  ACTIVE: "ACTIVE",     // 0.50 ≤ synergy < 0.75  — Connected, working
  STRONG: "STRONG",     // 0.75 ≤ synergy < 0.85  — High quality connection
  AWAKENED: "AWAKENED"  // synergy ≥ 0.85  — Peak connection, fully synchronized
};

/**
 * SynergyStateResolver — Centralized threshold logic
 * 
 * SINGLE RESPONSIBILITY:
 * - Convert numeric synergy (0–1) into discrete SynergyState
 * - Provide utility functions for state queries
 * - Track state transitions (for future animation/feedback)
 * 
 * NO SIDE EFFECTS:
 * - Pure function: same input → same output, always
 * - No external state modification
 * - No file I/O, network, or timer logic
 * 
 * EXTENSIBILITY:
 * - Add hysteresis (prevent flickering) later if needed
 * - Add transition callbacks for animations
 * - Add decay/recovery logic later
 */
export class SynergyStateResolver {
  constructor(options = {}) {
    /**
     * Threshold configuration (single source of truth for synergy thresholds)
     * These match observed break points across the system:
     *   - 0.50: Link becomes "active" (established connection)
     *   - 0.75: Glyph begins reveal (stronger connection)
     *   - 0.85: Link/glyph fully awakened (peak connection)
     */
    this.thresholds = {
      active: options.activeThreshold ?? 0.50,
      strong: options.strongThreshold ?? 0.75,
      awakened: options.awakenedThreshold ?? 0.85
    };
    
    // Statistics for monitoring
    this.stats = {
      resolveCount: 0,
      stateTransitions: new Map(),  // state → count
      averageTimeMs: 0
    };
    
    // Initialize state transition tracking
    Object.values(SynergyState).forEach(state => {
      this.stats.stateTransitions.set(state, 0);
    });
  }
  
  /**
   * Resolve numeric synergy to discrete SynergyState
   * 
   * @param {number} synergyValue - Normalized synergy (0–1)
   * @returns {string} SynergyState value
   * 
   * @example
   * resolver.resolve(0.45)  // → SynergyState.LOW
   * resolver.resolve(0.65)  // → SynergyState.ACTIVE
   * resolver.resolve(0.80)  // → SynergyState.STRONG
   * resolver.resolve(0.88)  // → SynergyState.AWAKENED
   */
  resolve(synergyValue) {
    const startTime = performance.now();
    
    // Clamp to valid range
    const clamped = Math.max(0, Math.min(1, synergyValue ?? 0));
    
    // Determine state from thresholds
    let state;
    if (clamped >= this.thresholds.awakened) {
      state = SynergyState.AWAKENED;
    } else if (clamped >= this.thresholds.strong) {
      state = SynergyState.STRONG;
    } else if (clamped >= this.thresholds.active) {
      state = SynergyState.ACTIVE;
    } else {
      state = SynergyState.LOW;
    }
    
    // Track statistics
    this.stats.resolveCount++;
    this.stats.stateTransitions.set(state, (this.stats.stateTransitions.get(state) ?? 0) + 1);
    const elapsedTime = performance.now() - startTime;
    this.stats.averageTimeMs = (this.stats.averageTimeMs * 0.99) + (elapsedTime * 0.01);
    
    return state;
  }
  
  /**
   * Check if synergy is in a specific state or higher
   * 
   * @param {number} synergyValue - Normalized synergy (0–1)
   * @param {string} minState - Minimum state to check ('LOW', 'ACTIVE', 'STRONG', 'AWAKENED')
   * @returns {boolean} True if synergy meets or exceeds minState
   * 
   * @example
   * resolver.isAtLeast(0.76, SynergyState.STRONG)   // → true
   * resolver.isAtLeast(0.50, SynergyState.AWAKENED) // → false
   */
  isAtLeast(synergyValue, minState) {
    const current = this.resolve(synergyValue);
    
    const stateRank = {
      [SynergyState.LOW]: 0,
      [SynergyState.ACTIVE]: 1,
      [SynergyState.STRONG]: 2,
      [SynergyState.AWAKENED]: 3
    };
    
    return stateRank[current] >= stateRank[minState];
  }
  
  /**
   * Get detailed state information
   * Returns additional context beyond the discrete state
   * 
   * @param {number} synergyValue - Normalized synergy (0–1)
   * @returns {Object} State info object
   * 
   * @example
   * resolver.getStateInfo(0.80)
   * // Returns:
   * // {
   * //   state: 'STRONG',
   * //   progress: 0.67,  // (0.80 - 0.75) / (0.85 - 0.75)
   * //   nextState: 'AWAKENED',
   * //   progressToNext: 0.67,
   * //   distanceFromPrevious: 0.05,
   * //   isTransitioning: false
   * // }
   */
  getStateInfo(synergyValue) {
    const clamped = Math.max(0, Math.min(1, synergyValue ?? 0));
    const state = this.resolve(clamped);
    
    // Determine previous and next state
    let prevState, nextState, lowerThreshold, upperThreshold;
    
    if (state === SynergyState.AWAKENED) {
      prevState = SynergyState.STRONG;
      nextState = null;
      lowerThreshold = this.thresholds.awakened;
      upperThreshold = 1.0;
    } else if (state === SynergyState.STRONG) {
      prevState = SynergyState.ACTIVE;
      nextState = SynergyState.AWAKENED;
      lowerThreshold = this.thresholds.strong;
      upperThreshold = this.thresholds.awakened;
    } else if (state === SynergyState.ACTIVE) {
      prevState = SynergyState.LOW;
      nextState = SynergyState.STRONG;
      lowerThreshold = this.thresholds.active;
      upperThreshold = this.thresholds.strong;
    } else {
      // LOW state
      prevState = null;
      nextState = SynergyState.ACTIVE;
      lowerThreshold = 0.0;
      upperThreshold = this.thresholds.active;
    }
    
    const stateRange = upperThreshold - lowerThreshold;
    const progress = stateRange > 0 ? (clamped - lowerThreshold) / stateRange : 0;
    const distanceFromPrevious = prevState ? clamped - (lowerThreshold - 0.01) : 0;
    const distanceToNext = nextState ? (upperThreshold - clamped) : 0;
    
    return {
      state,
      value: clamped,
      progress: Math.max(0, Math.min(1, progress)),
      previousState: prevState,
      nextState,
      distanceFromPrevious: Math.max(0, distanceFromPrevious),
      distanceToNext: Math.max(0, distanceToNext),
      isNearTransition: distanceToNext < 0.05,
      threshold: {
        lower: lowerThreshold,
        upper: upperThreshold,
        range: stateRange
      }
    };
  }
  
  /**
   * Reconfigure thresholds at runtime
   * Useful for difficulty scaling, playtesting, or balancing
   * 
   * @param {Object} newThresholds - { activeThreshold, strongThreshold, awakenedThreshold }
   * 
   * @example
   * // Make synergy harder to achieve (higher thresholds)
   * resolver.setThresholds({
   *   activeThreshold: 0.60,
   *   strongThreshold: 0.80,
   *   awakenedThreshold: 0.90
   * });
   */
  setThresholds(newThresholds) {
    if (newThresholds.activeThreshold !== undefined) {
      this.thresholds.active = Math.max(0, Math.min(1, newThresholds.activeThreshold));
    }
    if (newThresholds.strongThreshold !== undefined) {
      this.thresholds.strong = Math.max(0, Math.min(1, newThresholds.strongThreshold));
    }
    if (newThresholds.awakenedThreshold !== undefined) {
      this.thresholds.awakened = Math.max(0, Math.min(1, newThresholds.awakenedThreshold));
    }
    
    // Validate ordering
    if (!(this.thresholds.active < this.thresholds.strong && this.thresholds.strong < this.thresholds.awakened)) {
      console.warn('⚠️ Synergy thresholds not in ascending order! May cause unexpected behavior.');
    }
  }
  
  /**
   * Get current threshold configuration
   * 
   * @returns {Object} Current thresholds
   */
  getThresholds() {
    return { ...this.thresholds };
  }
  
  /**
   * Get human-readable description of a state
   * Useful for UI, debug output, documentation
   * 
   * @param {string} state - SynergyState value
   * @returns {string} Description
   */
  static getStateDescription(state) {
    const descriptions = {
      [SynergyState.LOW]: "Barely connected — Link exists but minimal synergy",
      [SynergyState.ACTIVE]: "Connected — Link is working and synchronized",
      [SynergyState.STRONG]: "High quality — Connection is smooth and stable",
      [SynergyState.AWAKENED]: "Peak connection — Nodes fully synchronized and resonant"
    };
    return descriptions[state] ?? "Unknown state";
  }
  
  /**
   * Get statistics about resolver usage
   * For monitoring and debugging
   * 
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      stateDistribution: Object.fromEntries(this.stats.stateTransitions)
    };
  }
}

/**
 * INTEGRATION GUIDE
 * ================
 * 
 * For Visual Systems (NeonLinkVisuals, _AtomaGlyphSystem4_0, etc):
 * 
 * OLD (Hard-coded, scattered):
 *   if (link.synergy >= 0.85) { applyAwakeningEffect(); }
 *   if (link.synergy >= 0.75) { applyRevealEffect(); }
 * 
 * NEW (Centralized, maintainable):
 *   const state = synergyResolver.resolve(link.synergy);
 *   if (state === SynergyState.AWAKENED) { applyAwakeningEffect(); }
 *   if (state === SynergyState.STRONG || state === SynergyState.AWAKENED) { applyRevealEffect(); }
 * 
 * Or more elegantly:
 *   if (synergyResolver.isAtLeast(link.synergy, SynergyState.STRONG)) { applyRevealEffect(); }
 * 
 * ================
 */
