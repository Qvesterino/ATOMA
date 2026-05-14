/**
 * ============================================================================
 * LINK COLLAPSE SYSTEM v1.1
 * ============================================================================
 * 
 * RESPONSIBILITY:
 * Implement conditional link collapse based on sustained link corruption
 * and low link stability. Links fail when conditions persist, not randomly.
 * 
 * DESIGN PHILOSOPHY:
 * - Collapse is EARNED, not punishing
 * - Player can predict failure through visible degradation
 * - Network feels alive and fragile under abuse
 * - Collapse is consequence, not random event
 * 
 * COLLAPSE CONDITIONS (release default):
 * 1. Link corruption is high (`link.corruption.high`) OR
 * 2. Link stability is low (`link.stability.low`)
 * 3. The active condition must persist for the full hold duration
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
 * - LinkCollapseSystem emits scoped tier events when thresholds are entered
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
    this.worldContextProvider = typeof config.worldContextProvider === 'function'
      ? config.worldContextProvider
      : (typeof config.getWorldContext === 'function' ? config.getWorldContext : null);
    
    // Global metrics provider — reads from MetricsRuntime or __ATOMA_LIVE_METRICS__
    this.globalMetricsProvider = typeof config.globalMetricsProvider === 'function'
      ? config.globalMetricsProvider
      : null;

    // Configuration with sensible defaults
    this.config = {
      // Scoped tier thresholds for collapse eligibility
      corruptionHighThreshold: config.corruptionHighThreshold ?? config.corruptionThreshold ?? 0.8,
      stabilityLowThreshold: config.stabilityLowThreshold ?? 0.2,
      
      // Temporal requirements (milliseconds)
      holdDurationMs: config.holdDurationMs ?? config.collapseWindowMs ?? config.minStressAccumulation ?? 5000,
      maxStressWindow: config.maxStressWindow ?? 5000,               // Upper bound for stale state cleanup
      
      // Collapse progression (0.0 - 1.0 scale)
      warningThreshold: config.warningThreshold ?? 0.3,
      criticalThreshold: config.criticalThreshold ?? 0.7,
      collapseThreshold: config.collapseThreshold ?? 1.0,
      
      // Recovery rate when conditions improve (progress per second)
      stressRecoveryRate: config.stressRecoveryRate ?? 0.35,        // -0.35 per sec

      // ── Global metrics influence on collapse ──────────────────────────
      // When network-level corruption is high, collapse stress accumulates faster.
      // When network-level stability is low, collapse stress accumulates faster.
      // Both create a multiplier on the base stress accumulation rate.
      globalCorruptionAccelerator: config.globalCorruptionAccelerator ?? 1.5,   // stress speed multiplier at max global corruption
      globalStabilityAccelerator: config.globalStabilityAccelerator ?? 1.4,     // stress speed multiplier at min global stability
      globalMetricsEnabled: config.globalMetricsEnabled ?? true,                 // set false to disable global influence
      
      // Enable visual feedback hooks
      enableVisualFeedback: config.enableVisualFeedback ?? true,

      // Debug logging
      debugMode: config.debugMode ?? false,
    };
    
    // Per-link collapse tracking
    this.collapseStates = new Map();           // linkId → collapseState
    this.linkWarningStates = new Set();        // linkIds currently in warning state
    this.linkCriticalStates = new Set();       // linkIds currently in critical state
    this.totalCollapses = 0;                   // completed collapse events this run
    
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
    this._eventBus = null;
    this._eventDisposers = [];

    this._debugLog('initialized', {
      linksTracked: this.linkingSystem?.links?.length ?? 0,
      enableVisualFeedback: this.config.enableVisualFeedback,
    });

    this.attachToLinkingSystem(this.linkingSystem);
  }

  setEventBus(bus) {
    if (!bus || this._eventBus) return;
    this._eventBus = bus;
    this.semanticBus = bus;

    const register = (tag, handler) => {
      if (typeof bus.subscribe === 'function') {
        const unsub = bus.subscribe(tag, handler, { priority: bus.priority?.NORMAL });
        this._eventDisposers.push(() => unsub?.());
      } else if (typeof bus.on === 'function') {
        bus.on(tag, handler, { priority: bus.priority?.NORMAL });
        this._eventDisposers.push(() => bus.off?.(tag, handler));
      }
    };

    // Canonical tiered events → immediate collapse evaluation
    // Note: LinkCollapseSystem is already event-driven via onLinkMetricsUpdated,
    // but canonical events allow external systems to force re-evaluation.
    register('link.corruption.high', (payload) => {
      const link = payload?.link;
      if (link) this.onLinkMetricsUpdated(link, payload, { forceEvaluate: true });
    });

    register('link.corruption.mid', (payload) => {
      const link = payload?.link;
      if (link) this.onLinkMetricsUpdated(link, payload, { forceEvaluate: true });
    });

    register('link.stability.low', (payload) => {
      const link = payload?.link;
      if (link) this.onLinkMetricsUpdated(link, payload, { forceEvaluate: true });
    });
  }

  _debugLog(message, details = null) {
    if (!this.config.debugMode) return;
    if (details) {
      console.log(`[LinkCollapseSystem] ${message}`, details);
    } else {
      console.log(`[LinkCollapseSystem] ${message}`);
    }
  }

  _resolveWorldContext() {
    const snapshot = this.worldContextProvider?.() || null;
    const worldContext = snapshot?.worldContext && typeof snapshot.worldContext === 'object'
      ? snapshot.worldContext
      : snapshot && typeof snapshot === 'object'
        ? snapshot
        : null;
    const macroState = String(
      snapshot?.macroState
      || snapshot?.worldMacroState
      || worldContext?.macroState
      || worldContext?.worldMacroState
      || worldContext?.consciousnessState?.worldMacroState
      || 'DORMANT'
    ).toUpperCase();
    const macroProfile = snapshot?.macroProfile && typeof snapshot.macroProfile === 'object'
      ? { ...snapshot.macroProfile }
      : worldContext?.macroProfile && typeof worldContext.macroProfile === 'object'
        ? { ...worldContext.macroProfile }
        : null;
    const consciousnessState = worldContext?.consciousnessState || snapshot?.consciousnessState || null;
    const worldMoodState = worldContext?.worldMoodState || snapshot?.worldMoodState || null;
    const networkState = worldContext?.networkState || snapshot?.networkState || null;
    const liveMetrics = worldContext?.liveMetrics || snapshot?.liveMetrics || snapshot?.metrics || null;
    const normalizedWorldContext = worldContext ? { ...worldContext } : null;

    if (normalizedWorldContext) {
      normalizedWorldContext.worldMacroState = macroState;
      normalizedWorldContext.macroState = macroState;
      normalizedWorldContext.macroProfile = macroProfile;
    }

    return {
      worldContext: normalizedWorldContext,
      worldMacroState: macroState,
      macroState,
      macroProfile,
      consciousnessState,
      worldMoodState,
      networkState,
      liveMetrics,
      metrics: liveMetrics
    };
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
  _emit(eventType, link, state, extra = {}) {
    const handlers = this.eventHandlers[eventType];
    if (Array.isArray(handlers) && handlers.length > 0) {
      for (const handler of handlers) {
        try {
          handler(link, state);
        } catch (err) {
          console.warn('[LinkCollapseSystem] event handler failed:', err);
        }
      }
    }

    const semanticBus = this.semanticBus || (typeof globalThis !== 'undefined' ? globalThis.semanticBus : null);
    if (!semanticBus?.emit) return;

    const worldContextSnapshot = this._resolveWorldContext();

    semanticBus.emit(`link.collapse.${eventType}`, {
      link,
      state,
      eventType,
      linkId: this._getLinkId(link),
      sourceId: link?.source?.userData?.nodeId ?? link?.source?.userData?.id ?? link?.source?.uuid ?? null,
      targetId: link?.target?.userData?.nodeId ?? link?.target?.userData?.id ?? link?.target?.uuid ?? null,
      stressAccumulation: state?.stressAccumulation ?? 0,
      collapseStage: state?.collapseStage ?? null,
      corruption: state?.lastObservedCorruption ?? 0,
      stability: state?.lastObservedStability ?? 1,
      loadPressure: state?.lastObservedLoad ?? 0,
      progress: state?.progress ?? state?.stressAccumulation ?? 0,
      ...worldContextSnapshot,
      source: 'LinkCollapseSystem',
      timestamp: Date.now(),
      ...extra
    }, {
      priority: semanticBus.priority?.NORMAL ?? semanticBus.priority?.BACKGROUND ?? 2
    });
  }

  _emitScopedTierEvent(scope, metric, tier, link, state, extra = {}) {
    const semanticBus = this.semanticBus || (typeof globalThis !== 'undefined' ? globalThis.semanticBus : null);
    if (!semanticBus?.emit) return;

    const worldContextSnapshot = this._resolveWorldContext();

    const linkId = this._getLinkId(link);
    const payload = {
      link,
      collapseState: state,
      linkId,
      sourceId: link?.source?.userData?.nodeId ?? link?.source?.userData?.id ?? link?.source?.uuid ?? null,
      targetId: link?.target?.userData?.nodeId ?? link?.target?.userData?.id ?? link?.target?.uuid ?? null,
      corruption: state?.lastObservedCorruption ?? 0,
      stability: state?.lastObservedStability ?? 1,
      loadPressure: state?.lastObservedLoad ?? 0,
      progress: state?.stressAccumulation ?? 0,
      tier,
      threshold: extra.threshold ?? null,
      state: extra.state ?? 'active',
      ...worldContextSnapshot,
      source: 'LinkCollapseSystem',
      timestamp: Date.now(),
      ...extra,
    };

    semanticBus.emit(`${scope}.${metric}.${tier}`, payload, {
      priority: semanticBus.priority?.NORMAL
    });
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
  onLinkMetricsUpdated(link, metrics = null, options = {}) {
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

    this._advanceCollapseState(link, state, normalized, now, options);
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
   * Read global network metrics from MetricsRuntime or __ATOMA_LIVE_METRICS__.
   * Returns { corruption, stability } normalized to [0..1].
   * @private
   */
  _readGlobalMetrics() {
    const defaults = { corruption: 0, stability: 1 };

    // Priority 1: explicit provider function
    if (this.globalMetricsProvider) {
      try {
        const m = this.globalMetricsProvider();
        if (m && typeof m === 'object') {
          return {
            corruption: this._clamp01(m.corruption ?? m.corruptionLevel ?? 0),
            stability: this._clamp01(m.stability ?? 1),
          };
        }
      } catch (_e) { /* fall through */ }
    }

    // Priority 2: __ATOMA_LIVE_METRICS__ global
    try {
      const live = (typeof globalThis !== 'undefined') ? globalThis.__ATOMA_LIVE_METRICS__ : null;
      if (live && typeof live === 'object') {
        return {
          corruption: this._clamp01(live.corruptionLevel ?? live.corruption ?? 0),
          stability: this._clamp01(live.networkStress != null ? (1 - live.networkStress) : (live.stability ?? 1)),
        };
      }
    } catch (_e) { /* fall through */ }

    return defaults;
  }

  /**
   * Compute global metrics stress multiplier.
   * When global corruption is high and global stability is low,
   * collapse stress accumulates faster (network-wide pressure).
   * Returns a multiplier >= 1.0.
   * @private
   */
  _computeGlobalStressMultiplier() {
    if (!this.config.globalMetricsEnabled) return 1.0;

    const gm = this._readGlobalMetrics();
    // corruption contribution: 0→1.0, 1→globalCorruptionAccelerator
    const corruptionFactor = 1 + (gm.corruption * (this.config.globalCorruptionAccelerator - 1));
    // stability contribution: 1→1.0, 0→globalStabilityAccelerator
    const stabilityFactor = 1 + ((1 - gm.stability) * (this.config.globalStabilityAccelerator - 1));

    return corruptionFactor * stabilityFactor;
  }

  /**
   * Update collapse state for a single link (meaning-only; enqueue collapse request)
   * @private
   */
  _advanceCollapseState(link, state, metrics, now, options = {}) {
    const previousStage = state.collapseStage;
    const previousProgress = state.stressAccumulation;
    const eligibility = this._isCollapseEligible(link, metrics, state);
    const isEligible = eligibility.isEligible;

    state.lastObservedLoad = metrics.loadPressure ?? 0;
    state.lastObservedCorruption = metrics.corruption ?? 0;
    state.lastObservedStability = metrics.stability ?? 1;
    state.activeEligibilityReason = eligibility.activeReason;

    this._syncTierSignals(link, state, metrics, now, eligibility, options);

    // Global stress multiplier — accelerates collapse under network-wide pressure
    const globalMultiplier = this._computeGlobalStressMultiplier();

    if (isEligible) {
      if (state.eligibleSince == null) {
        state.eligibleSince = now;
      }
      const elapsed = Math.max(0, now - state.eligibleSince);
      // Base accumulation + global acceleration
      const effectiveDuration = this.config.holdDurationMs / globalMultiplier;
      state.stressAccumulation = this._clamp01(elapsed / effectiveDuration);
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

    this._applyVisualState(link, state, metrics);

    if (previousStage !== state.collapseStage) {
      if (state.collapseStage === 'warning' && previousStage === 'stable') {
        this._onEnterWarning(link, state);
      } else if (state.collapseStage === 'critical' && previousStage !== 'critical') {
        this._onEnterCritical(link, state);
      } else if (state.collapseStage === 'stable' && previousStage !== 'stable') {
        this._onRecovery(link, state, previousProgress);
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
   * Release default:
   * 1. Corruption is in the high tier OR
   * 2. Stability is in the low tier
   * 3. The active condition has been held continuously
   * @private
   */
  _isCollapseEligible(link, metrics, state) {
    const corruption = this._clamp01(this._readMetric(
      metrics?.corruption,
      link.userData?.metrics?.corruption,
      link.corruptionLevel,
      link.corruptionIntensity
    ));
    const stability = this._clamp01(this._readMetric(
      metrics?.stability,
      link.userData?.metrics?.stability,
      link.stability,
      link.stabilityLevel,
      1 - this._clamp01(metrics?.instability),
      1 - this._clamp01(link.userData?.metrics?.instability),
      1 - this._clamp01(link.instability),
      1 - this._clamp01(link.instabilityLevel)
    ));

    const corruptionHigh = corruption >= this.config.corruptionHighThreshold;
    const stabilityLow = stability <= this.config.stabilityLowThreshold;

    return {
      corruption,
      stability,
      corruptionHigh,
      stabilityLow,
      isEligible: corruptionHigh || stabilityLow,
      activeReason: corruptionHigh
        ? 'corruption-high'
        : (stabilityLow ? 'stability-low' : null),
    };
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
  _onRecovery(link, state, previousProgress = 0) {
    const linkId = this._getLinkId(link);
    this.linkWarningStates.delete(linkId);
    this.linkCriticalStates.delete(linkId);
    const recoverySignal = Math.max(0, Math.min(1, Number(previousProgress) || 0));
    
    if (this.config.enableVisualFeedback) {
      this._clearVisualFlags(link);
    }

    this._debugLog('recovery', {
      linkId,
      stressAccumulation: state?.stressAccumulation,
      recoverySignal,
    });
    
    this._emit('recovery', link, state, {
      recoverySignal,
      recoveryProgress: recoverySignal,
      intensity: recoverySignal,
      value: recoverySignal,
      source: 'LinkCollapseSystem'
    });
  }
  
  /**
   * Link has collapsed - prepare for removal
   * @private
   */
  _onCollapse(link, state) {
    const linkId = this._getLinkId(link);
    this.linkWarningStates.delete(linkId);
    this.linkCriticalStates.delete(linkId);
    this.totalCollapses += 1;
    
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
      stability: state?.lastObservedStability,
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
  getCollapseProgress(linkOrId) {
    const state = typeof linkOrId === 'string'
      ? this.collapseStates.get(linkOrId) || null
      : this.getCollapseState(linkOrId);
    if (!state) return 0;
    return state.stressAccumulation;
  }

  getAverageCollapseProgress() {
    if (this.collapseStates.size === 0) return 0;
    return this._computeAverageStress();
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
      totalCollapses: this.totalCollapses,
      averageStress: this._computeAverageStress(),
      averageCollapseProgress: this._computeAverageStress(),
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
      lastObservedStability: 1,
      activeEligibilityReason: null,
      corruptionHighActive: false,
      stabilityLowActive: false,
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
      this.onLinkMetricsUpdated(link, link?.userData?.metrics || null, { silent: true });
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

    const endpointStability = this._readMetric(
      link?.source?.userData?.metrics?.stability,
      link?.sourceNode?.userData?.metrics?.stability,
      link?.nodeA?.userData?.metrics?.stability,
      link?.target?.userData?.metrics?.stability,
      link?.targetNode?.userData?.metrics?.stability,
      link?.nodeB?.userData?.metrics?.stability
    );

    const stability = this._clamp01(this._readMetric(
      metrics?.stability,
      link?.userData?.metrics?.stability,
      link?.stability,
      link?.stabilityLevel,
      endpointStability,
      1 - this._clamp01(metrics?.instability),
      1 - this._clamp01(link?.userData?.metrics?.instability),
      1 - this._clamp01(link?.instability),
      1 - this._clamp01(link?.instabilityLevel)
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
      stability,
      loadPressure,
    };
  }

  _buildMetricSignature(link, metrics) {
    const linkId = this._getLinkId(link);
    const corruption = Math.round((metrics?.corruption ?? 0) * 1000);
    const stability = Math.round((metrics?.stability ?? 0) * 1000);
    const loadPressure = Math.round((metrics?.loadPressure ?? 0) * 1000);
    return `${linkId}:${corruption}:${stability}:${loadPressure}`;
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
      stability: metrics?.stability ?? 1,
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

  _syncTierSignals(link, state, metrics, now, eligibility, options = {}) {
    const corruptionHigh = !!eligibility?.corruptionHigh;
    const stabilityLow = !!eligibility?.stabilityLow;

    if (corruptionHigh !== state.corruptionHighActive) {
      state.corruptionHighActive = corruptionHigh;
      if (corruptionHigh && !options.silent) {
        this._emitScopedTierEvent('link', 'corruption', 'high', link, state, {
          threshold: this.config.corruptionHighThreshold,
          state: 'active',
          triggeredAt: now,
        });
      }
    }

    if (stabilityLow !== state.stabilityLowActive) {
      state.stabilityLowActive = stabilityLow;
      if (stabilityLow && !options.silent) {
        this._emitScopedTierEvent('link', 'stability', 'low', link, state, {
          threshold: this.config.stabilityLowThreshold,
          state: 'active',
          triggeredAt: now,
        });
      }
    }

    if (!corruptionHigh && !stabilityLow) {
      state.eligibleSince = null;
    }
  }
  
  /**
   * Reset collapse tracking (useful for world resets)
   */
  reset() {
    this.collapseStates.clear();
    this.linkWarningStates.clear();
    this.linkCriticalStates.clear();
    this.totalCollapses = 0;
  }
  
  /**
   * Destroy system (cleanup)
   */
  destroy() {
    for (const dispose of this._eventDisposers) {
      try { dispose(); } catch (_e) {}
    }
    this._eventDisposers = [];
    this._eventBus = null;
    this.semanticBus = null;

    this.reset();
    this.eventHandlers = {
      warning: [],
      critical: [],
      collapse: [],
      recovery: [],
    };
  }
}
