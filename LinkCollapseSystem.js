/**
 * ============================================================================
 * LINK COLLAPSE SYSTEM v1.0
 * ============================================================================
 * 
 * RESPONSIBILITY:
 * Implement conditional link collapse based on sustained extreme stress
 * and high corruption. Links fail when conditions persist, not randomly.
 * 
 * DESIGN PHILOSOPHY:
 * - Collapse is EARNED, not punishing
 * - Player can predict failure through visible degradation
 * - Network feels alive and fragile under abuse
 * - Collapse is consequence, not random event
 * 
 * COLLAPSE CONDITIONS (ALL must be true):
 * 1. Link corruption > 0.8 (80%)
 * 2. AND either:
 *    a) One or both nodes at critical load (load >= 1.0)
 *    b) OR network stress remains critical for sustained duration (3-5 sec)
 * 3. Conditions must persist for minimum duration (stress accumulation)
 * 4. Collapse threshold reached → link disconnects
 * 
 * COLLAPSE PROCESS (NOT instant):
 * Stage 1: Warning (0.0-0.3) - Visual instability begins
 * Stage 2: Critical (0.3-0.7) - Severe degradation, player can intervene
 * Stage 3: Collapse (0.7-1.0) - Link becomes unstable and disconnects
 * 
 * INTEGRATION:
 * const collapseSystem = new LinkCollapseSystem(linkingSystem, linkQualityCalc, linkDegradationSystem);
 * 
 * UPDATE LOOP (in main game loop, once per frame):
 * collapseSystem.update(deltaTime);
 * 
 * CALLBACKS (optional):
 // collapseSystem.on('warning', (link) => { /* visual warning */
 // collapseSystem.on('collapse', (link) => { /* handle disconnection */ });


export class LinkCollapseSystem {
  constructor(linkingSystem, linkQualityCalculator, linkDegradationSystem, config = {}) {
    this.linkingSystem = linkingSystem;
    this.linkQualityCalculator = linkQualityCalculator;
    this.linkDegradationSystem = linkDegradationSystem;
    
    // Configuration with sensible defaults
    this.config = {
      // Corruption threshold for collapse eligibility
      corruptionThreshold: config.corruptionThreshold ?? 0.8,        // 80%
      
      // Temporal requirements (milliseconds)
      minStressAccumulation: config.minStressAccumulation ?? 3000,   // 3 seconds
      maxStressWindow: config.maxStressWindow ?? 10000,             // 10 second window
      
      // Load pressure thresholds
      criticalLoadThreshold: config.criticalLoadThreshold ?? 1.0,   // 100% capacity
      
      // Collapse progression (0.0 - 1.0 scale)
      warningThreshold: config.warningThreshold ?? 0.3,
      criticalThreshold: config.criticalThreshold ?? 0.7,
      collapseThreshold: config.collapseThreshold ?? 1.0,
      
      // Stress accumulation rate (per second of extreme conditions)
      stressAccumulationRate: config.stressAccumulationRate ?? 0.15, // +0.15 per sec
      
      // Recovery rate when conditions improve
      stressRecoveryRate: config.stressRecoveryRate ?? 0.05,        // -0.05 per sec
      
      // Enable visual feedback hooks
      enableVisualFeedback: config.enableVisualFeedback ?? true,
    };
    
    // Per-link collapse tracking
    this.collapseStates = new Map();           // linkId → collapseState
    this.linkWarningStates = new Set();        // linkIds currently in warning state
    this.linkCriticalStates = new Set();       // linkIds currently in critical state
    
    // Event system
    this.eventHandlers = {
      warning: [],    // Link entered warning state
      critical: [],   // Link entered critical state
      collapse: [],   // Link collapsed (will be removed)
      recovery: [],   // Link recovered from warning/critical
    };
  }
  
  /**
   * Register event callback
   * @param {string} eventType - 'warning', 'critical', 'collapse', 'recovery'
   * @param {function} callback - (link, state) => void
   */
  on(eventType, callback) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers.eventType.push(callback);
    }
  }
  
  /**
   * Emit event to all registered handlers
   * @private
   */
  _emit(eventType, link, state) {
    if (this.eventHandlers[eventType]) {
      for (const handler of this.eventHandlers[eventType]) {
        try {
          handler(link, state);
        } catch (e) {
          console.warn(`[LinkCollapseSystem] Event handler error for ${eventType}:`, e);
        }
      }
    }
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
    
    // Update collapse state for all links (meaning-only: enqueue requests, no unlink)
    for (const link of this.linkingSystem.links) {
      this._updateLinkCollapseState(link, deltaTime, now);
    }
  }
  
  /**
   * Update collapse state for a single link (meaning-only; enqueue collapse request)
   * @private
   */
  _updateLinkCollapseState(link, deltaTime, now) {
    const linkId = this._getLinkId(link);
    
    // Initialize collapse state if needed
    if (!this.collapseStates.has(linkId)) {
      this.collapseStates.set(linkId, this._createBlankCollapseState());
    }
    
    const state = this.collapseStates.get(linkId);
    const quality = link.userData?.quality;
    
    if (!quality) {
      // No quality data yet - can't collapse
      return false;
    }
    
    // ===== STEP 1: Check collapse eligibility =====
    const isEligible = this._isCollapseEligible(link, quality, state);
    
    // ===== STEP 2: Update stress accumulation =====
    if (isEligible) {
      // Conditions persist - accumulate stress
      state.stressAccumulation += (this.config.stressAccumulationRate * deltaTime);
      state.lastStressTime = now;
    } else {
      // Conditions improved - recover stress
      state.stressAccumulation -= (this.config.stressRecoveryRate * deltaTime);
      state.stressAccumulation = Math.max(0, state.stressAccumulation);
    }
    
    // Clamp stress to valid range
    state.stressAccumulation = Math.max(0, Math.min(1.0, state.stressAccumulation));
    
    // ===== STEP 3: Track state transitions =====
    const previousStage = state.collapseStage;
    state.collapseStage = this._getCollapseStage(state.stressAccumulation);
    
    // Emit events on state changes
    if (previousStage !== state.collapseStage) {
      if (state.collapseStage === 'warning' && previousStage === 'stable') {
        this._onEnterWarning(link, state);
      } else if (state.collapseStage === 'critical' && previousStage === 'warning') {
        this._onEnterCritical(link, state);
      } else if (previousStage === 'warning' && state.collapseStage === 'stable') {
        this._onRecovery(link, state);
      } else if (previousStage === 'critical' && state.collapseStage === 'warning') {
        this._onRecovery(link, state);
      }
    }
    
    // ===== STEP 4: Check for actual collapse =====
    if (state.stressAccumulation >= this.config.collapseThreshold && isEligible) {
      state.hasCollapsed = true;
      this._onCollapse(link, state);
      return; // No structural action; collapse request enqueued
    }
  }
  
  /**
   * Check if link is eligible for collapse
   * ALL of these must be true:
   * 1. Corruption > 0.8
   * 2. Either critical load on one/both nodes OR sustained network stress
   * @private
   */
  _isCollapseEligible(link, quality, state) {
    // Requirement 1: High corruption
    const avgCorruption = (quality.corruption || 0) / 100; // Normalize to 0-1
    
    if (avgCorruption <= this.config.corruptionThreshold) {
      // Corruption not high enough
      return false;
    }
    
    // Requirement 2: Either critical load or sustained stress
    const sourceLoad = link.source?.userData?.load ?? 0;
    const targetLoad = link.target?.userData?.load ?? 0;
    const nodeCritical = sourceLoad >= this.config.criticalLoadThreshold ||
                         targetLoad >= this.config.criticalLoadThreshold;
    
    const now = Date.now();
    const stressDuration = (now - state.lastStressTime) / 1000; // in seconds
    const sustainedStress = stressDuration <= (this.config.minStressAccumulation / 1000);
    
    // Both corruption AND (critical load OR sustained stress)
    return nodeCritical || (state.stressAccumulation > 0 && sustainedStress);
  }
  
  /**
   * Get current collapse stage based on stress accumulation
   * @private
   */
  _getCollapseStage(stressAccumulation) {
    if (stressAccumulation >= this.config.criticalThreshold) {
      return 'critical';
    } else if (stressAccumulation >= this.config.warningThreshold) {
      return 'warning';
    } else {
      return 'stable';
    }
  }
  
  /**
   * Link entered warning state (0.3 stress)
   * @private
   */
  _onEnterWarning(link, state) {
    const linkId = this._getLinkId(link);
    this.linkWarningStates.add(linkId);
    
    if (this.config.enableVisualFeedback) {
      // Store visual warning flag for NeonLinkVisuals to display
      link.userData.collapseWarning = true;
    }
    
    this._emit('warning', link, state);
  }
  
  /**
   * Link entered critical state (0.7 stress)
   * @private
   */
  _onEnterCritical(link, state) {
    const linkId = this._getLinkId(link);
    this.linkCriticalStates.add(linkId);
    this.linkWarningStates.delete(linkId);
    
    if (this.config.enableVisualFeedback) {
      // Store critical flag for NeonLinkVisuals to display
      link.userData.collapseCritical = true;
      link.userData.collapseWarning = false;
    }
    
    this._emit('critical', link, state);
  }
  
  /**
   * Link recovered from warning/critical state
   * @private
   */
  _onRecovery(link, state) {
    const linkId = this._getLinkId(link);
    this.linkWarningStates.delete(linkId);
    this.linkCriticalStates.delete(linkId);
    
    if (this.config.enableVisualFeedback) {
      link.userData.collapseWarning = false;
      link.userData.collapseCritical = false;
    }
    
    this._emit('recovery', link, state);
  }
  
  /**
   * Link has collapsed - prepare for removal
   * @private
   */
  _onCollapse(link, state) {
    const linkId = this._getLinkId(link);
    this.linkWarningStates.delete(linkId);
    this.linkCriticalStates.delete(linkId);
    
    if (this.config.enableVisualFeedback) {
      link.userData.collapseWarning = false;
      link.userData.collapseCritical = false;
      link.userData.collapseActive = true; // Signal for visual collapse FX
    }
    
    // Meaning-only: enqueue collapse request for structural systems to handle
    this._enqueueCollapseRequest(link, state);

    this._emit('collapse', link, state);
  }
  
  /**
   * Remove a link from the network
   * @private
   */
  _removeLinkSafely(link) {
    try {
      const linkId = this._getLinkId(link);
      
      // Remove from collapse tracking
      this.collapseStates.delete(linkId);
      this.linkWarningStates.delete(linkId);
      this.linkCriticalStates.delete(linkId);
      
      // Disconnect the link (handled by linking system)
      if (this.linkingSystem && this.linkingSystem.unlinkNodes) {
        this.linkingSystem.unlinkNodes(link.source, link.target);
      }
    } catch (e) {
      console.warn('[LinkCollapseSystem] Error removing link:', e);
    }
  }

  /**
   * Enqueue a collapse request (meaning-only; no structural unlink here).
   * @private
   */
  _enqueueCollapseRequest(link, state) {
    if (!this.linkingSystem || !this.linkingSystem.enqueueCollapseRequest) return;
    const linkId = this._getLinkId(link);
    this.linkingSystem.enqueueCollapseRequest(link, {
      reason: 'collapse-threshold',
      severity: 'critical',
      source: 'LinkCollapseSystem',
      stressAccumulation: state?.stressAccumulation,
    });
  }
  
  /**
   * Get current collapse state for a link (for debugging/testing)
   * @param {Object} link - Link to query
   * @returns {Object|null} Collapse state or null if not initialized
   */
  getCollapseState(link) {
    const linkId = this._getLinkId(link);
    return this.collapseStates.get(linkId) || null;
  }
  
  /**
   * Get collapse progress (0.0-1.0) for visual effects
   * @param {Object} link - Link to query
   * @returns {number} Collapse progress (0.0 = stable, 1.0 = collapsed)
   */
  getCollapseProgress(link) {
    const state = this.getCollapseState(link);
    if (!state) return 0;
    return state.stressAccumulation;
  }
  
  /**
   * Get all links currently in warning state
   * @returns {Array<Object>} Array of links in warning state
   */
  getWarningLinks() {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return [];
    }
    
    const result = [];
    for (const link of this.linkingSystem.links) {
      const linkId = this._getLinkId(link);
      if (this.linkWarningStates.has(linkId)) {
        result.push(link);
      }
    }
    return result;
  }
  
  /**
   * Get all links currently in critical state
   * @returns {Array<Object>} Array of links in critical state
   */
  getCriticalLinks() {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return [];
    }
    
    const result = [];
    for (const link of this.linkingSystem.links) {
      const linkId = this._getLinkId(link);
      if (this.linkCriticalStates.has(linkId)) {
        result.push(link);
      }
    }
    return result;
  }
  
  /**
   * Get statistics about network collapse state
   * @returns {Object} Collapse statistics
   */
  getCollapseStatistics() {
    return {
      totalLinks: this.linkingSystem?.links?.length ?? 0,
      warningLinks: this.linkWarningStates.size,
      criticalLinks: this.linkCriticalStates.size,
      collapsedLinksTracked: this.collapseStates.size,
      averageStress: this._computeAverageStress(),
    };
  }
  
  /**
   * Compute average stress across all tracked links
   * @private
   */
  _computeAverageStress() {
    if (this.collapseStates.size === 0) return 0;
    
    let total = 0;
    for (const state of this.collapseStates.values()) {
      total += state.stressAccumulation;
    }
    return total / this.collapseStates.size;
  }
  
  /**
   * Create blank collapse state for a new link
   * @private
   */
  _createBlankCollapseState() {
    return {
      collapseStage: 'stable',           // 'stable', 'warning', 'critical'
      stressAccumulation: 0.0,            // 0.0 - 1.0
      lastStressTime: Date.now(),
      hasCollapsed: false,
      createdAt: Date.now(),
    };
  }
  
  /**
   * Generate consistent link ID
   * @private
   */
  _getLinkId(link) {
    if (!link.source || !link.target) {
      return 'unknown';
    }
    
    const id1 = link.source.userData?.id ?? link.source.uuid ?? 'src';
    const id2 = link.target.userData?.id ?? link.target.uuid ?? 'tgt';
    
    return `${id1}→${id2}`;
  }
  
  /**
   * Reset collapse tracking (useful for world resets)
   */
  reset() {
    this.collapseStates.clear();
    this.linkWarningStates.clear();
    this.linkCriticalStates.clear();
  }
  
  /**
   * Destroy system (cleanup)
   */
  destroy() {
    this.reset();
    this.eventHandlers = {
      warning: [],
      critical: [],
      collapse: [],
      recovery: [],
    };
  }
}
