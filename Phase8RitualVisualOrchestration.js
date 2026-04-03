/**
 * PHASE 8: NETWORK RITUAL VISUAL ORCHESTRATION
 * ==============================================
 * 
 * Purely visual ceremony layer for network rituals.
 * Makes large-scale network actions feel intentional, meaningful, and alive.
 * 
 * DESIGN CONSTRAINTS:
 * ✅ READ-ONLY consumption of Phase 8 ritual events
 * ✅ NO gameplay logic modifications
 * ✅ NO stat mutations
 * ✅ NO new mechanics or conditions
 * ✅ NO UI panels or text
 * ✅ RESPECTS canonical visual templates (#1, #2, #3)
 * ✅ All visuals fully reversible and transient
 * ✅ Silent failure if events unavailable
 * 
 * SEMANTIC FOUNDATION:
 * A ritual is NOT:
 *   - A spell, explosion, or cutscene
 * 
 * A ritual IS:
 *   - Network synchronization
 *   - Collective intention
 *   - Emergent resonance
 * 
 * VISUAL ORCHESTRATION LAYERS:
 * 1. PRE-RITUAL (Network Attunement) — Signal coordinated state
 * 2. RITUAL ACTIVE (Coherent Resonance) — Show collective action
 * 3. RITUAL COMPLETION (Release/Resolution) — Communicate closure
 * 
 * INTEGRATION POINTS:
 * - NetworkRituals_v1.js: Ritual lifecycle events
 * - VisualTemplateRegistry.js: Canonical template authority
 * - VisualAutoWiringSystem.js: Controller management
 * - SynergyGlowController.js: Template #1 (cyan glow)
 * - HarmonyAuraController.js: Template #2 (aquamarine stability)
 * - StressTurbulenceController.js: Template #3 (red-orange chaos)
 * 
 * PERFORMANCE:
 * - O(n) where n = affected renderables (links + nodes in ritual cluster)
 * - No per-frame allocations
 * - Efficient state tracking via Map
 */

/**
 * VISUAL ORCHESTRATION CONFIGURATION
 * Must respect canonical semantics—these are modulation envelopes only.
 */
const RITUAL_VISUAL_CONFIG = {
  // Pre-Ritual: Network Attunement
  PRE_RITUAL: {
    duration: 1500,                    // 1.5 seconds (slow, intentional)
    linkPulseSync: true,               // Synchronize link pulses
    nodeAttunement: true,              // Gentle node breathing
    jitterReduction: 0.7,              // 70% jitter suppression (feels like "listening")
    colorShift: 0,                     // NO color changes—preserve template identity
  },

  // Ritual Active: Coherent Resonance
  RITUAL_ACTIVE: {
    linkIntensity: 1.3,                // Modest glow amplification (≤ 1.5×)
    nodeRadiusScale: 1.15,             // Slight stability envelope (≤ 1.25×)
    globalPhaseSync: true,             // All entities sync to ritual frequency
    stressDamping: 0.5,                // Chaos becomes readable (50% damping)
    waveRippleEffect: true,            // Propagation visible as soft wave patterns
  },

  // Ritual Completion: Release/Resolution
  COMPLETION: {
    success: {
      releaseDuration: 2000,            // 2 second release
      coherenceFade: 1.0,               // Full fade to baseline
      settleDamping: 0.8,               // Gentle settling motion
      calmingBreath: 0.3,               // 30% slower breathing
      colorWarmth: 0,                   // NO color—preserve templates
    },
    failure: {
      releaseDuration: 1500,            // Faster failure decay
      desyncSpread: 0.5,                // Gentle desynchronization
      energyDispersion: 0.4,            // Soft dispersal (not harsh)
      turbulenceBump: 0.2,              // Slight turbulence spike (not punishment)
      colorShift: 0,                    // NO color warnings
    },
  },

  // Global constraints
  GLOBAL: {
    maxIntensity: 1.5,                 // Cap all intensity multipliers
    maxRadiusScale: 1.25,              // Cap all radius scales
    minIntensity: 0.3,                 // Never drop below threshold
    silentFail: true,                  // No error logging—fail gracefully
    performanceMode: 'balanced',       // 'light', 'balanced', 'rich'
  },
};

/**
 * RITUAL ORCHESTRATION CORE
 * Conducts the visual ensemble—reuses existing controllers, doesn't rewrite them.
 */
class Phase8RitualVisualOrchestration {
  constructor(visualAutoWiringSystem, networkRituals) {
    this.wiring = visualAutoWiringSystem;
    this.rituals = networkRituals;
    this.metricBus = this._resolveMetricBus();
    this.metricSubscriptions = [];
    this.metricSignals = {
      synergyHigh: false,
      synergyMid: false,
      harmonyHigh: false,
      harmonyMid: false,
      stabilityHigh: false,
      loadPressureHigh: false,
      lastUpdatedAt: 0,
    };

    // Map of active ritual visual states
    // ritualId → { stage, progress, startTime, affectedRenderables, modifiers }
    this.ritualVisualStates = new Map();

    // Tracked effects per renderable to prevent stacking
    // renderableId → { ritualId, modifier, appliedAt }
    this.renderableEffects = new Map();

    // Global ritual pulse frequency (shared across all rituals)
    this.globalRitualPhase = 0;
    this.ritualFrequency = 2.5;        // Hz (2.5 pulses per second, feels coordinated)

    // Event listeners for Phase 8 lifecycle
    this.listenerSetup = false;

    // Performance tracking
    this.stats = {
      activeRituals: 0,
      affectedRenderables: 0,
      lastUpdateTime: 0,
    };
  }

  /**
   * Initialize orchestration and attach to Phase 8 events.
   * Safe initialization—works even if partial systems are missing.
   */
  initialize() {
    if (this.listenerSetup) return;
    if (!this.wiring) {
      console.warn('[Phase8 Visual] AutoWiring system not available—visual orchestration disabled');
      return;
    }

    // Try to subscribe to ritual lifecycle events
    if (this.rituals && typeof this.rituals.on === 'function') {
      this.rituals.on('ritual:start', (e) => this._onRitualStart(e));
      this.rituals.on('ritual:progress', (e) => this._onRitualProgress(e));
      this.rituals.on('ritual:complete', (e) => this._onRitualComplete(e));
      this.rituals.on('ritual:abort', (e) => this._onRitualAbort(e));
    } else {
      // Fallback: Try to poll ritual state if event system unavailable
      this._setupPollingFallback();
    }

    this._subscribeMetricTag('global.synergy.high', () => this._setMetricSignal('synergyHigh', true));
    this._subscribeMetricTag('global.synergy.mid', () => this._setMetricSignal('synergyMid', true));
    this._subscribeMetricTag('global.harmony.high', () => this._setMetricSignal('harmonyHigh', true));
    this._subscribeMetricTag('global.harmony.mid', () => this._setMetricSignal('harmonyMid', true));
    this._subscribeMetricTag('global.stability.high', () => this._setMetricSignal('stabilityHigh', true));
    this._subscribeMetricTag('global.loadPressure.high', () => this._setMetricSignal('loadPressureHigh', true));

    this.listenerSetup = true;
  }

  /**
   * Per-frame update orchestration.
   * Modulates visual signals based on ritual progression.
   */
  update(deltaTime) {
    if (!Number.isFinite(deltaTime) || deltaTime <= 0) return;

    const now = performance.now();
    this.stats.lastUpdateTime = now;

    // Advance global ritual phase (shared frequency)
    this.globalRitualPhase += (this.ritualFrequency * deltaTime * 0.001) % 1.0;

    // Update each active ritual's visual state
    for (const [ritualId, state] of this.ritualVisualStates.entries()) {
      this._updateRitualVisuals(ritualId, state, deltaTime);
    }

    // Cleanup completed rituals
    this._cleanupExpiredRituals();
  }

  /**
   * ========================================================================
   * LAYER 1: PRE-RITUAL — NETWORK ATTUNEMENT
   * ========================================================================
   * Signal that network is entering coordinated state.
   * 
   * Visuals:
   * - Gradual synchronization of link pulses
   * - Subtle slowing of random jitter
   * - Gentle convergence toward shared rhythm
   * 
   * Semantics: "The network is listening before acting"
   */
  _onRitualStart(event) {
    const { ritual, nodeIds, linkIds } = event;
    if (!ritual) return;

    const ritualId = ritual.id;
    const now = performance.now();

    // Identify all affected renderables
    const affectedRenderables = this._identifyAffectedRenderables(nodeIds, linkIds);

    // Create ritual visual state
    const ritualState = {
      stage: 'PRE_RITUAL',
      startTime: now,
      progress: 0,
      phaseOffset: this.globalRitualPhase,
      affectedRenderables,
      modifiers: new Map(),
    };

    this.ritualVisualStates.set(ritualId, ritualState);

    // Phase 1a: Pre-ritual attunement (1.5 seconds)
    // Apply subtle synchronization modifiers
    this._applyPreRitualModifiers(affectedRenderables, ritualId);

    this.stats.activeRituals = this.ritualVisualStates.size;
  }

  /**
   * ========================================================================
   * LAYER 2: RITUAL ACTIVE — COHERENT RESONANCE
   * ========================================================================
   * Show that network is acting as one system.
   * 
   * Visuals:
   * - Synchronized wave propagation across links (canonical #1)
   * - Resonance rings / fields (very subtle)
   * - Temporary amplification of existing visuals:
   *   - Synergy glow: intensity boost
   *   - Harmony aura: radius amplification
   *   - Stress turbulence: temporal synchronization
   * 
   * Semantics: "The network is acting together"
   */
  _onRitualProgress(event) {
    const { ritual } = event;
    if (!ritual) return;

    const ritualId = ritual.id;
    const state = this.ritualVisualStates.get(ritualId);
    if (!state) return;

    // Transition to active stage
    state.stage = 'RITUAL_ACTIVE';
    state.stageStartTime = performance.now();
    state.startTime = state.stageStartTime;

    // Clear pre-ritual modifiers and apply active modifiers
    this._clearModifiersForRitual(ritualId);
    this._applyRitualActiveModifiers(state.affectedRenderables, ritualId);
  }

  /**
   * ========================================================================
   * LAYER 3: RITUAL COMPLETION — RELEASE / RESOLUTION
   * ========================================================================
   * Communicate closure and consequence (success vs failure).
   * 
   * SUCCESS:
   * - Coherence pulse
   * - Gradual return to baseline
   * - Calm settling moment
   * 
   * FAILURE / ABORT:
   * - Desynchronization (not harsh)
   * - Gentle decay of coherence
   * - NO punishment visuals
   * 
   * Semantics: "The network has decided"
   */
  _onRitualComplete(event) {
    const { ritual, success } = event;
    if (!ritual) return;

    const ritualId = ritual.id;
    const state = this.ritualVisualStates.get(ritualId);
    if (!state) return;

    state.stage = 'COMPLETION';
    state.stageStartTime = performance.now();
    state.startTime = state.stageStartTime;
    state.success = success;

    // Clear active modifiers
    this._clearModifiersForRitual(ritualId);

    // Apply completion modifiers based on outcome
    if (success) {
      this._applyCompletionSuccessModifiers(state.affectedRenderables, ritualId);
    } else {
      this._applyCompletionFailureModifiers(state.affectedRenderables, ritualId);
    }

    // Schedule cleanup after completion visuals fade
    const completionDuration = success
      ? RITUAL_VISUAL_CONFIG.COMPLETION.success.releaseDuration
      : RITUAL_VISUAL_CONFIG.COMPLETION.failure.releaseDuration;

    setTimeout(() => {
      this._clearModifiersForRitual(ritualId);
      this.ritualVisualStates.delete(ritualId);
    }, completionDuration);
  }

  _onRitualAbort(event) {
    const { ritual } = event;
    if (!ritual) return;

    // Treat abort as failure
    this._onRitualComplete({ ritual, success: false });
  }

  /**
   * ========================================================================
   * MODIFIER APPLICATION LAYER
   * ========================================================================
   * Applies template-respecting visual modifications.
   * All modifications are:
   * - Transient (temporary)
   * - Reversible (cleanable)
   * - Non-semantic (don't change template identity)
   * - Read-only (never mutate stats)
   */

  /**
   * Apply pre-ritual attunement modifiers.
   * Synchronize pulses, reduce jitter, create "listening" feel.
   */
  _applyPreRitualModifiers(affectedRenderables, ritualId) {
    const config = RITUAL_VISUAL_CONFIG.PRE_RITUAL;
    const metricMod = this._getMetricModulation();

    for (const renderable of affectedRenderables) {
      const modifier = {
        ritualId,
        layer: 'PRE_RITUAL',
        intensityMultiplier: metricMod.preRitualIntensity,
        phaseSync: config.linkPulseSync,
        jitterSuppression: metricMod.jitterSuppression,
        envelope: (t) => this._fadeInEnvelope(t, config.duration),
        duration: config.duration,
      };

      this._applyModifierToRenderable(renderable, modifier);
    }
  }

  /**
   * Apply ritual active resonance modifiers.
   * Amplify signals, synchronize globally, propagate waves.
   */
  _applyRitualActiveModifiers(affectedRenderables, ritualId) {
    const config = RITUAL_VISUAL_CONFIG.RITUAL_ACTIVE;
    const metricMod = this._getMetricModulation();

    for (const renderable of affectedRenderables) {
      const modifier = {
        ritualId,
        layer: 'RITUAL_ACTIVE',
        intensityMultiplier: metricMod.activeIntensity,
        radiusScale: metricMod.radiusScale,
        globalPhaseSync: config.globalPhaseSync,
        phaseOffset: this.globalRitualPhase,
        stressDamping: metricMod.stressDamping,
        waveRipple: config.waveRippleEffect,
        envelope: (t) => 1.0,            // Full intensity during active phase
        duration: Infinity,              // Until completion
      };

      this._applyModifierToRenderable(renderable, modifier);
    }
  }

  /**
   * Apply completion success modifiers.
   * Coherence pulse, calm settling, return to baseline.
   */
  _applyCompletionSuccessModifiers(affectedRenderables, ritualId) {
    const config = RITUAL_VISUAL_CONFIG.COMPLETION.success;

    for (const renderable of affectedRenderables) {
      const modifier = {
        ritualId,
        layer: 'COMPLETION_SUCCESS',
        intensityMultiplier: 1.2,       // Brief brightening (coherence pulse)
        radiusScale: 1.1,               // Slight expansion
        calmingBreath: config.calmingBreath,
        settleDamping: config.settleDamping,
        envelope: (t) => this._fadeOutEnvelope(t, config.releaseDuration),
        duration: config.releaseDuration,
      };

      this._applyModifierToRenderable(renderable, modifier);
    }
  }

  /**
   * Apply completion failure modifiers.
   * Gentle desynchronization, soft energy dispersal, no punishment.
   */
  _applyCompletionFailureModifiers(affectedRenderables, ritualId) {
    const config = RITUAL_VISUAL_CONFIG.COMPLETION.failure;

    for (const renderable of affectedRenderables) {
      const modifier = {
        ritualId,
        layer: 'COMPLETION_FAILURE',
        intensityMultiplier: 0.9,       // Gentle dimming
        desyncSpread: config.desyncSpread,
        energyDispersion: config.energyDispersion,
        turbulenceBump: config.turbulenceBump,
        envelope: (t) => this._fadeOutEnvelope(t, config.releaseDuration),
        duration: config.releaseDuration,
      };

      this._applyModifierToRenderable(renderable, modifier);
    }
  }

  /**
   * Apply modifier to a single renderable.
   * Routes through appropriate visual controller (if available).
   */
  _applyModifierToRenderable(renderable, modifier) {
    if (!renderable) return;

    // Track effect
    const renderableId = renderable.id || renderable.uuid;
    if (!renderableId) return;

    this.renderableEffects.set(renderableId, {
      ritualId: modifier.ritualId,
      modifier,
      appliedAt: performance.now(),
    });

    // Try to route through visual controller
    if (this.wiring && typeof this.wiring.applyRitualModifier === 'function') {
      this.wiring.applyRitualModifier(renderable, modifier);
    }

    this.stats.affectedRenderables = this.renderableEffects.size;
  }

  /**
   * Clear all modifiers for a specific ritual.
   * Restores all renderables to baseline state.
   */
  _clearModifiersForRitual(ritualId) {
    const toRemove = [];

    for (const [renderableId, effect] of this.renderableEffects.entries()) {
      if (effect.ritualId === ritualId) {
        toRemove.push(renderableId);
      }
    }

    for (const renderableId of toRemove) {
      this.renderableEffects.delete(renderableId);
    }

    // Try to signal through wiring system
    if (this.wiring && typeof this.wiring.clearRitualModifier === 'function') {
      this.wiring.clearRitualModifier(ritualId);
    }
  }

  /**
   * ========================================================================
   * HELPER METHODS
   * ========================================================================
   */

  /**
   * Identify all renderables affected by a ritual.
   * Includes both nodes and links in the ritual cluster.
   */
  _identifyAffectedRenderables(nodeIds, linkIds) {
    const affectedRenderables = [];

    if (!this.wiring) return affectedRenderables;

    // Try to get renderables from wiring system
    if (typeof this.wiring.getNodeRenderables === 'function') {
      const nodeRenderables = this.wiring.getNodeRenderables(nodeIds);
      affectedRenderables.push(...nodeRenderables);
    }

    if (typeof this.wiring.getLinkRenderables === 'function') {
      const linkRenderables = this.wiring.getLinkRenderables(linkIds);
      affectedRenderables.push(...linkRenderables);
    }

    return affectedRenderables;
  }

  /**
   * Update visual state for a single ritual each frame.
   * Modulates phase, progress, and envelope functions.
   */
  _updateRitualVisuals(ritualId, state, deltaTime) {
    const now = performance.now();
    const elapsed = now - state.startTime;

    // Update progress (0 to 1 over ritual lifetime)
    state.progress = Math.min(elapsed / 24000, 1.0);  // 24s total ritual duration

    // Update stage transitions if needed
    if (state.stage === 'PRE_RITUAL' && elapsed > RITUAL_VISUAL_CONFIG.PRE_RITUAL.duration) {
      // Pre-ritual ends, but wait for progress event to transition to ACTIVE
    }

    // Modulate global phase for all affected renderables in this ritual
    for (const renderable of state.affectedRenderables) {
      const renderableId = renderable.id || renderable.uuid;
      const effect = this.renderableEffects.get(renderableId);

      if (effect && effect.modifier) {
        const modifier = effect.modifier;
        modifier.phaseOffset = this.globalRitualPhase;
        modifier.progress = state.progress;
        this._applyModifierToRenderable(renderable, modifier);
      }
    }
  }

  /**
   * Clean up expired rituals (those past their completion phase).
   */
  _cleanupExpiredRituals() {
    const now = performance.now();
    const toDelete = [];

    for (const [ritualId, state] of this.ritualVisualStates.entries()) {
      if (state.stage === 'COMPLETION') {
        const completionDuration = state.success
          ? RITUAL_VISUAL_CONFIG.COMPLETION.success.releaseDuration
          : RITUAL_VISUAL_CONFIG.COMPLETION.failure.releaseDuration;

        const stageElapsed = now - state.stageStartTime;
        if (stageElapsed > completionDuration) {
          toDelete.push(ritualId);
        }
      }
    }

    for (const ritualId of toDelete) {
      this._clearModifiersForRitual(ritualId);
      this.ritualVisualStates.delete(ritualId);
    }

    this.stats.activeRituals = this.ritualVisualStates.size;
  }

  /**
   * ENVELOPE FUNCTIONS
   * Smooth temporal curves for visual transitions.
   */

  /**
   * Fade-in envelope: starts at 0, ramps to 1.
   */
  _fadeInEnvelope(t, duration) {
    if (!duration) return 1.0;
    const phase = Math.min(t / duration, 1.0);
    return Math.sin(phase * Math.PI * 0.5);  // Smooth easing
  }

  /**
   * Fade-out envelope: starts at 1, ramps to 0.
   */
  _fadeOutEnvelope(t, duration) {
    if (!duration) return 0.0;
    const phase = Math.min(t / duration, 1.0);
    return Math.cos(phase * Math.PI * 0.5);  // Smooth easing
  }

  /**
   * Setup polling fallback if event system unavailable.
   */
  _setupPollingFallback() {
    // Check periodically if rituals exist
    setInterval(() => {
      if (!this.rituals) return;

      // Try to access ritual state via polling
      // This is a safe no-op if ritual system doesn't expose polling
      if (typeof this.rituals.getActiveRituals === 'function') {
        const active = this.rituals.getActiveRituals();
        // Could implement polling-based updates here
      }
    }, 500);
  }

  /**
   * Get orchestration statistics (for debugging/monitoring).
   */
  getStats() {
    return {
      ...this.stats,
      activeRituals: this.ritualVisualStates.size,
      affectedRenderables: this.renderableEffects.size,
    };
  }

  /**
   * Reset orchestration state (for scene changes/cleanup).
   */
  reset() {
    this.ritualVisualStates.clear();
    this.renderableEffects.clear();
    this.globalRitualPhase = 0;
    this.metricSignals.synergyHigh = false;
    this.metricSignals.synergyMid = false;
    this.metricSignals.harmonyHigh = false;
    this.metricSignals.harmonyMid = false;
    this.metricSignals.stabilityHigh = false;
    this.metricSignals.loadPressureHigh = false;
    this.stats.activeRituals = 0;
    this.stats.affectedRenderables = 0;
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _subscribeMetricTag(eventName, handler) {
    const bus = this.metricBus;
    if (!bus || !eventName || typeof handler !== 'function') return;

    if (typeof bus.on === 'function') {
      const unsubscribe = bus.on(eventName, handler);
      if (typeof unsubscribe === 'function') {
        this.metricSubscriptions.push(unsubscribe);
      }
      return;
    }

    if (typeof bus.subscribe === 'function') {
      const unsubscribe = bus.subscribe(eventName, handler);
      if (typeof unsubscribe === 'function') {
        this.metricSubscriptions.push(unsubscribe);
      }
    }
  }

  _setMetricSignal(key, value) {
    this.metricSignals[key] = value;
    this.metricSignals.lastUpdatedAt = performance.now();
  }

  _getMetricModulation() {
    const intensityBoost = this.metricSignals.synergyHigh ? 0.15 : (this.metricSignals.synergyMid ? 0.05 : 0);
    const harmonyBoost = this.metricSignals.harmonyHigh ? 0.08 : (this.metricSignals.harmonyMid ? 0.04 : 0);
    const stressBoost = this.metricSignals.loadPressureHigh ? 0.15 : 0;
    const stabilityGuard = this.metricSignals.stabilityHigh ? 0.1 : 0;

    return {
      preRitualIntensity: Math.max(
        RITUAL_VISUAL_CONFIG.GLOBAL.minIntensity,
        0.9 + harmonyBoost
      ),
      jitterSuppression: Math.min(0.9, RITUAL_VISUAL_CONFIG.PRE_RITUAL.jitterReduction + stabilityGuard),
      activeIntensity: Math.min(
        RITUAL_VISUAL_CONFIG.GLOBAL.maxIntensity,
        RITUAL_VISUAL_CONFIG.RITUAL_ACTIVE.linkIntensity + intensityBoost
      ),
      radiusScale: Math.min(
        RITUAL_VISUAL_CONFIG.GLOBAL.maxRadiusScale,
        RITUAL_VISUAL_CONFIG.RITUAL_ACTIVE.nodeRadiusScale + harmonyBoost
      ),
      stressDamping: Math.min(0.8, RITUAL_VISUAL_CONFIG.RITUAL_ACTIVE.stressDamping + stressBoost),
    };
  }
}

export { Phase8RitualVisualOrchestration, RITUAL_VISUAL_CONFIG };
