/**
 * ============================================================================
 * LINK COLLAPSE SYSTEM v1.1
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
 * EVENT FLOW:
 * - NodeLinkingSystem emits link update callbacks with normalized metrics
 * - LinkCollapseSystem evaluates only on those updates
 * - LinkCollapseSystem enqueues collapse requests into NodeLinkingSystem
 * - NodeLinkingSystem runs the collapse arbiter and performs unlinking
 *
 * UPDATE LOOP:
 * The system does not need a per-frame scan. It can be attached to link
 * lifecycle callbacks and run in an event-driven way.
 *
 * CALLBACKS (optional):
 * collapseSystem.on('warning', (link) => { // visual warning });
 * collapseSystem.on('collapse', (link) => { // handle disconnection });
 */

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
      collapseWindowMs: config.collapseWindowMs ?? 5000,             // Time to reach full collapse under continuous stress
      maxStressWindow: config.maxStressWindow ?? 10000,              // Upper bound for stale state cleanup
      
      // Load pressure thresholds
      criticalLoadThreshold: config.criticalLoadThreshold ?? 1.0,   // 100% capacity
      
      // Collapse progression (0.0 - 1.0 scale)
      warningThreshold: config.warningThreshold ?? 0.3,
      criticalThreshold: config.criticalThreshold ?? 0.7,
      collapseThreshold: config.collapseThreshold ?? 1.0,
      
      // Recovery rate when conditions improve (progress per second)
      stressRecoveryRate: config.stressRecoveryRate ?? 0.35,        // -0.35 per sec
      
      // Enable visual feedback hooks
      enableVisualFeedback: config.enableVisualFeedback ?? true,

      // Debug logging
      debugMode: config.debugMode ?? false,
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

    this._boundLinkingSystem = null;
    this._linkHooksBound = false;
    this._initialLinkPrimeDone = false;

    this._debugLog('initialized', {
      linksTracked: this.linkingSystem?.links?.length ?? 0,
      enableVisualFeedback: this.config.enableVisualFeedback,
    });

    this.attachToLinkingSystem(this.linkingSystem);
  }

  _debugLog(message, details = null) {
    if (!this.config.debugMode) return;
    if (details) {
      console.log(`[LinkCollapseSystem] ${message}`, details);
    } else {
      console.log(`[LinkCollapseSystem] ${message}`);
    }
  }
  
  /**
   * Register event callback
   * @param {string} eventType - 'warning', 'critical', 'collapse', 'recovery'
   * @param {function} callback - (link, state) => void
   */
  on(eventType, callback) {
    if (typeof callback !== 'function') return;
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = [];
    }
    this.eventHandlers[eventType].push(callback);
  }
  
  /**
   * Emit event to all registered handlers
   * @private
   */
  _emit(eventType, link, state) {
    const handlers = this.eventHandlers[eventType];
    if (!Array.isArray(handlers) || handlers.length === 0) return;
    for (const handler of handlers) {
      try {
        handler(link, state);
      } catch (err) {
        console.warn('[LinkCollapseSystem] event handler failed:', err);
      }
    }
  }

  /**
   * Attach to the runtime linking system using passive callbacks.
   */
  attachToLinkingSystem(linkingSystem = this.linkingSystem) {
    if (!linkingSystem || this._linkHooksBound) {
      return this;
    }

    this._boundLinkingSystem = linkingSystem;
    this._linkHooksBound = true;

    if (typeof linkingSystem.onLinkCreated === 'function') {
      linkingSystem.onLinkCreated((source, target, link) => this.registerLink(link || source || target), {
        layerKey: 'LINK_CORE',
        immediate: true
      });
    }

    if (typeof linkingSystem.onLinkUpdated === 'function') {
      linkingSystem.onLinkUpdated((link, metrics) => this.onLinkMetricsUpdated(link, metrics));
    }

    if (typeof linkingSystem.onLinkRemoved === 'function') {
      linkingSystem.onLinkRemoved((source, target, link) => this.unregisterLink(link || this._resolveLinkFromPair(source, target)));
    }

    this._primeExistingLinks();
    return this;
  }

  /**
   * Register a link in the collapse cache without evaluating it yet.
   */
  registerLink(link) {
    if (!link) return;
    const linkId = this._getLinkId(link);
    if (!this.collapseStates.has(linkId)) {
      this.collapseStates.set(linkId, this._createBlankCollapseState());
    }
    this._clearVisualFlags(link);
  }

  /**
   * Remove all collapse tracking for a link.
   */
  unregisterLink(link) {
    if (!link) return;
    const linkId = this._getLinkId(link);
    this.collapseStates.delete(linkId);
    this.linkWarningStates.delete(linkId);
    this.linkCriticalStates.delete(linkId);
    if (link.userData) {
      delete link.userData.collapseWarning;
      delete link.userData.collapseCritical;
      delete link.userData.collapseActive;
      delete link.userData.collapseProgress;
      delete link.userData.collapseStage;
      delete link.userData.collapseState;
    }
  }

  /**
   * Event-driven entry point. Called from NodeLinkingSystem link update callbacks.
   */
  onLinkMetricsUpdated(link, metrics = null) {
    if (!link || !this._isLinkAlive(link)) {
      return;
    }

    const now = Date.now();
    const linkId = this._getLinkId(link);
    if (!this.collapseStates.has(linkId)) {
      this.collapseStates.set(linkId, this._createBlankCollapseState());
    }

    const state = this.collapseStates.get(linkId);
    const normalized = this._readNormalizedMetrics(link, metrics);
    const signature = this._buildMetricSignature(link, normalized);

    this._advanceCollapseState(link, state, normalized, now);
    state.lastMetricSignature = signature;
    state.lastUpdatedAt = now;
  }
  
  /**
   * Main update cycle - call once per frame from game loop
   * @param {number} deltaTime - Time elapsed since last frame (in seconds)
   */
  update(deltaTime) {
    // Event-driven system: no per-frame scan required.
    // Kept for API compatibility only.
    return;
  }
  
  /**
   * Update collapse state for a single link (meaning-only; enqueue collapse request)
   * @private
   */
  _advanceCollapseState(link, state, metrics, now) {
    const previousStage = state.collapseStage;
    const previousProgress = state.stressAccumulation;
    const isEligible = this._isCollapseEligible(link, metrics, state);

    if (isEligible) {
      if (!state.eligibleSince) {
        state.eligibleSince = now;
      }
      const elapsed = Math.max(0, now - state.eligibleSince);
      state.stressAccumulation = this._clamp01(elapsed / this.config.collapseWindowMs);
      state.lastStressTime = now;
    } else {
      const deltaMs = Math.max(0, now - (state.lastUpdatedAt ?? now));
      state.stressAccumulation = Math.max(0, state.stressAccumulation - ((deltaMs / 1000) * this.config.stressRecoveryRate));
      if (state.stressAccumulation <= 0) {
        state.eligibleSince = null;
      }
    }

    state.collapseStage = this._getCollapseStage(state.stressAccumulation);
    state.progress = state.stressAccumulation;
    state.isEligible = isEligible;
    state.lastObservedLoad = metrics.loadPressure ?? 0;
    state.lastObservedCorruption = metrics.corruption ?? 0;

    this._applyVisualState(link, state, metrics);

    if (previousStage !== state.collapseStage) {
      if (state.collapseStage === 'warning' && previousStage === 'stable') {
        this._onEnterWarning(link, state);
      } else if (state.collapseStage === 'critical' && previousStage !== 'critical') {
        this._onEnterCritical(link, state);
      } else if (state.collapseStage === 'stable' && previousStage !== 'stable') {
        this._onRecovery(link, state);
      }
    }

    if (state.stressAccumulation >= this.config.collapseThreshold && isEligible && !state.hasCollapsed) {
      state.hasCollapsed = true;
      this._onCollapse(link, state);
      return;
    }

    if (!isEligible && previousProgress > 0 && state.stressAccumulation === 0) {
      state.hasCollapsed = false;
    }
  }
  
  /**
   * Check if link is eligible for collapse
   * ALL of these must be true:
   * 1. Corruption > 0.8
   * 2. Either critical load on one/both nodes OR sustained network stress
   * @private
   */
  _isCollapseEligible(link, metrics, state) {
    const corruption = this._clamp01(this._readMetric(metrics?.corruption, link.userData?.metrics?.corruption, link.corruptionLevel, link.corruptionIntensity));
    if (corruption <= this.config.corruptionThreshold) {
      return false;
    }

    const sourceLoad = this._readLoadMetric(link.source);
    const targetLoad = this._readLoadMetric(link.target);
    const nodeCritical = sourceLoad >= this.config.criticalLoadThreshold ||
      targetLoad >= this.config.criticalLoadThreshold ||
      (this._readMetric(metrics?.loadPressure, link.userData?.metrics?.loadPressure) >= this.config.criticalLoadThreshold);

    const sustainedStress = state.eligibleSince
      ? ((Date.now() - state.eligibleSince) >= this.config.minStressAccumulation)
      : false;

    return nodeCritical || sustainedStress;
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
      this._setVisualFlag(link, 'collapseWarning', true);
      this._setVisualFlag(link, 'collapseCritical', false);
      this._setVisualFlag(link, 'collapseActive', false);
    }

    this._debugLog('warning', {
      linkId,
      stressAccumulation: state?.stressAccumulation,
      corruption: state?.lastObservedCorruption ?? 0,
    });
    
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
      this._setVisualFlag(link, 'collapseCritical', true);
      this._setVisualFlag(link, 'collapseWarning', false);
      this._setVisualFlag(link, 'collapseActive', false);
    }

    this._debugLog('critical', {
      linkId,
      stressAccumulation: state?.stressAccumulation,
      corruption: state?.lastObservedCorruption ?? 0,
    });
    
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
      this._clearVisualFlags(link);
    }

    this._debugLog('recovery', {
      linkId,
      stressAccumulation: state?.stressAccumulation,
    });
    
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
      this._setVisualFlag(link, 'collapseWarning', false);
      this._setVisualFlag(link, 'collapseCritical', false);
      this._setVisualFlag(link, 'collapseActive', true); // Signal for visual collapse FX
    }

    this._debugLog('collapse', {
      linkId,
      stressAccumulation: state?.stressAccumulation,
      source: link.source?.userData?.id ?? link.source?.uuid ?? null,
      target: link.target?.userData?.id ?? link.target?.uuid ?? null,
    });
    
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

      this.collapseStates.delete(linkId);
      this.linkWarningStates.delete(linkId);
      this.linkCriticalStates.delete(linkId);

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
    this._debugLog('enqueue-collapse-request', {
      linkId,
      stressAccumulation: state?.stressAccumulation,
    });
    this.linkingSystem.enqueueCollapseRequest(link, {
      reason: 'collapse-threshold',
      severity: 'critical',
      source: 'LinkCollapseSystem',
      stressAccumulation: state?.stressAccumulation,
      corruption: state?.lastObservedCorruption,
      loadPressure: state?.lastObservedLoad,
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
      lastUpdatedAt: Date.now(),
      lastMetricSignature: null,
      eligibleSince: null,
      progress: 0,
      isEligible: false,
      lastObservedLoad: 0,
      lastObservedCorruption: 0,
      hasCollapsed: false,
      createdAt: Date.now(),
    };
  }
  
  /**
   * Generate consistent link ID
   * @private
   */
  _getLinkId(link) {
    if (!link) {
      return 'unknown';
    }
    if (link.id) {
      return String(link.id);
    }
    if (!link.source || !link.target) {
      return 'unknown';
    }

    const id1 = link.source.userData?.nodeId ?? link.source.userData?.id ?? link.source.uuid ?? 'src';
    const id2 = link.target.userData?.nodeId ?? link.target.userData?.id ?? link.target.uuid ?? 'tgt';

    return `${id1}→${id2}`;
  }

  _primeExistingLinks() {
    if (this._initialLinkPrimeDone) return;
    this._initialLinkPrimeDone = true;
    const links = this.linkingSystem?.links;
    if (!Array.isArray(links)) return;
    for (const link of links) {
      this.registerLink(link);
      this.onLinkMetricsUpdated(link, link?.userData?.metrics || null);
    }
  }

  _resolveLinkFromPair(source, target) {
    const links = this.linkingSystem?.links;
    if (!Array.isArray(links) || !source || !target) return null;
    return links.find((link) => link?.source === source && link?.target === target) || null;
  }

  _readMetric(...values) {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }
    return 0;
  }

  _readLoadMetric(node) {
    const raw = this._readMetric(
      node?.userData?.load,
      node?.userData?.metrics?.loadRatio,
      node?.userData?.metrics?.loadPressure,
      node?.userData?.loadRatio
    );

    if (raw > 1) {
      return Math.max(0, Math.min(1, raw / 100));
    }
    return this._clamp01(raw);
  }

  _readNormalizedMetrics(link, metrics = null) {
    const corruption = this._clamp01(this._readMetric(
      metrics?.corruption,
      link?.userData?.metrics?.corruption,
      link?.corruptionLevel,
      link?.corruptionIntensity
    ));

    const loadPressure = this._clamp01(this._readMetric(
      metrics?.loadPressure,
      link?.userData?.metrics?.loadPressure,
      link?.loadPressure,
      this._readLoadMetric(link?.source),
      this._readLoadMetric(link?.target)
    ));

    return {
      corruption,
      loadPressure,
    };
  }

  _buildMetricSignature(link, metrics) {
    const linkId = this._getLinkId(link);
    const corruption = Math.round((metrics?.corruption ?? 0) * 1000);
    const loadPressure = Math.round((metrics?.loadPressure ?? 0) * 1000);
    return `${linkId}:${corruption}:${loadPressure}`;
  }

  _applyVisualState(link, state, metrics) {
    if (!link?.userData) {
      if (link) {
        link.userData = {};
      } else {
        return;
      }
    }

    const progress = this._clamp01(state.progress ?? state.stressAccumulation ?? 0);
    const stage = state.collapseStage || 'stable';
    const isWarning = stage === 'warning';
    const isCritical = stage === 'critical';
    const isActive = !!state.hasCollapsed;

    link.userData.collapseState = {
      linkId: this._getLinkId(link),
      stage,
      progress,
      corruption: metrics?.corruption ?? 0,
      loadPressure: metrics?.loadPressure ?? 0,
      eligible: !!state.isEligible,
      hasCollapsed: isActive,
      updatedAt: state.lastUpdatedAt ?? Date.now(),
    };
    link.userData.collapseProgress = progress;
    link.userData.collapseWarning = isWarning;
    link.userData.collapseCritical = isCritical;
    link.userData.collapseActive = isActive;
    link.userData.collapseStage = stage;
  }

  _setVisualFlag(link, key, value) {
    if (!link) return;
    if (!link.userData) link.userData = {};
    link.userData[key] = value;
  }

  _clearVisualFlags(link) {
    if (!link?.userData) return;
    this._setVisualFlag(link, 'collapseWarning', false);
    this._setVisualFlag(link, 'collapseCritical', false);
    this._setVisualFlag(link, 'collapseActive', false);
    this._setVisualFlag(link, 'collapseProgress', 0);
    this._setVisualFlag(link, 'collapseStage', 'stable');
    this._setVisualFlag(link, 'collapseState', null);
  }

  _isLinkAlive(link) {
    return !!(link && (link.active !== false) && (link.source || link.target));
  }

  _clamp01(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
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
