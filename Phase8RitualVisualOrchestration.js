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
 * 1. PRELUDE (Network Attunement) — Signal coordinated state
 * 2. ACTIVE (Coherent Resonance) — Show collective action
 * 3. CREST (Peak/Resolution) — Make the peak readable
 * 4. RELEASE (Release/Resolution) — Communicate closure
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
  // Prelude: network attunement layer
  PRELUDE: {
    duration: 1500,                    // 1.5 seconds (slow, intentional)
    linkPulseSync: true,               // Synchronize link pulses
    nodeAttunement: true,              // Gentle node breathing
    jitterReduction: 0.8,              // 80% jitter suppression (feels like "listening")
    colorShift: 0,                     // NO color changes—preserve template identity
  },

  // Active: coherent resonance
  ACTIVE: {
    linkIntensity: 1.35,               // Stronger glow amplification (still controlled)
    nodeRadiusScale: 1.18,             // Slight stability envelope
    globalPhaseSync: true,             // All entities sync to ritual frequency
    stressDamping: 0.55,               // Chaos becomes readable
    waveRippleEffect: true,            // Propagation visible as soft wave patterns
    ribbonTrails: true,
    phaseFlashThreshold: 1200,
  },

  // Crest: readable peak
  CREST: {
    intensityBoost: 1.2,
    ringFocus: true,
    haloBoost: 0.2,
    ribbonPulse: 0.22,
    phaseFlashIntensity: 0.25,
    duration: 1800,
  },

  // Release: resolved closure
  RELEASE: {
    success: {
      releaseDuration: 2200,            // 2.2 second release
      coherenceFade: 1.0,               // Full fade to baseline
      settleDamping: 0.9,               // Gentle settling motion
      calmingBreath: 0.28,              // 28% slower breathing
      colorWarmth: 0,                   // NO color—preserve templates
    },
    failure: {
      releaseDuration: 1600,            // Slightly faster failure decay
      desyncSpread: 0.45,               // Gentle desynchronization
      energyDispersion: 0.38,           // Soft dispersal (not harsh)
      turbulenceBump: 0.18,             // Slight turbulence spike
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

// SUPERNATURAL UPGRADE: Arcane Ritual Convergence
// Transformed from clean digital colors to deep arcane ritual palette.
// Each archetype now carries mystical, ceremonial energy — as if the network
// is performing ancient rites beyond human comprehension.

const RITUAL_ARCHETYPE_PROFILES = {
  Ascension: {
    coreColor: '#FFF8E7',          // Sacred inner light (warm divine white)
    ringColor: '#E8D5B7',          // Ancient parchment ring
    sigilColor: '#C9A84C',         // Ritual gold sigil
    atmosphereColor: '#4A90A4',    // Deep ceremonial teal atmosphere
    ribbonIntensity: 0.16,         // Stronger ritual ribbons
    haloIntensity: 0.24,           // More pronounced divine halo
    phaseFlash: 0.28,              // Brighter ritual flash
    coreShape: 'sigilCrown',
    overlayPattern: 'orbitRings',
    atmospherePattern: 'largeVeil',
    motionProfile: 'slowRise',
    glyphDensity: 0.2,
    ringSupport: 'dominantPlusSupport',
  },
  Convergence: {
    coreColor: '#7B68EE',          // Medium slate blue (arcane convergence)
    ringColor: '#E6E0F0',          // Spectral white ring
    sigilColor: '#9370DB',         // Medium purple sigil
    atmosphereColor: '#F0E6FF',    // Ethereal lavender wash
    ribbonIntensity: 0.18,         // Stronger mystical ribbons
    haloIntensity: 0.16,           // Arcane halo
    phaseFlash: 0.22,              // Mystical flash
    coreShape: 'sphereNucleus',
    overlayPattern: 'symmetricRibbons',
    atmospherePattern: 'wideWash',
    motionProfile: 'steadyBreathing',
    glyphDensity: 0.12,
    ringSupport: 'singleDominantRing',
  },
  QuantumFracture: {
    coreColor: '#8B00FF',          // Deep violet (void fracture)
    ringColor: '#4B0082',          // Indigo void ring
    sigilColor: '#6A0DAD',         // Dark ritual purple sigil
    atmosphereColor: '#0A0012',    // Near-void black atmosphere
    ribbonIntensity: 0.26,         // Intense void ribbons
    haloIntensity: 0.22,           // Void halo
    phaseFlash: 0.35,              // Powerful void flash
    coreShape: 'eclipseRing',
    overlayPattern: 'phaseShards',
    atmospherePattern: 'voidPlate',
    motionProfile: 'phaseInversion',
    glyphDensity: 0.08,
    ringSupport: 'singleDominantRing',
  },
  ChaosCeremony: {
    coreColor: '#DC143C',          // Crimson (blood ceremony)
    ringColor: '#FF6B9D',          // Ceremonial pink ring
    sigilColor: '#8B008B',         // Dark magenta ritual sigil
    atmosphereColor: '#4A0040',    // Deep ceremonial purple atmosphere
    ribbonIntensity: 0.30,         // Intense chaotic ribbons
    haloIntensity: 0.24,           // Chaotic halo
    phaseFlash: 0.38,              // Powerful chaos flash
    coreShape: 'fracturedCore',
    overlayPattern: 'shardFragments',
    atmospherePattern: 'darkVeil',
    motionProfile: 'jitteredPulse',
    glyphDensity: 0.16,
    ringSupport: 'supportRing',
  },
  MemoryEcho: {
    coreColor: '#00CED1',          // Dark turquoise (ethereal memory)
    ringColor: '#B0E0E6',          // Powder blue memory ring
    sigilColor: '#E0FFFF',         // Light cyan ghost sigil
    atmosphereColor: '#D8BFD8',    // Thistle memory atmosphere
    ribbonIntensity: 0.15,         // Gentle memory ribbons
    haloIntensity: 0.18,           // Memory halo
    phaseFlash: 0.22,              // Echo flash
  },
  // SUPERNATURAL: New arcane ritual archetype
  ArcaneRitual: {
    coreColor: '#FFD700',          // Sacred gold core
    ringColor: '#800020',          // Burgundy ritual ring
    sigilColor: '#4B0082',         // Indigo arcane sigil
    atmosphereColor: '#1A0A2E',    // Deep night atmosphere
    ribbonIntensity: 0.28,         // Strong ritual ribbons
    haloIntensity: 0.22,           // Arcane halo
    phaseFlash: 0.32,              // Powerful ritual flash
    coreShape: 'sigilCrown',
    overlayPattern: 'orbitRings',
    atmospherePattern: 'largeVeil',
    motionProfile: 'slowRise',
    glyphDensity: 0.18,
    ringSupport: 'dominantPlusSupport',
  },
  default: {
    coreColor: '#C9A84C',          // Ritual gold (mystical default)
    ringColor: '#E8D5B7',          // Parchment ring
    sigilColor: '#7B68EE',         // Arcane sigil
    atmosphereColor: '#B0C4DE',    // Light steel blue atmosphere
    ribbonIntensity: 0.18,         // Balanced mystical ribbons
    haloIntensity: 0.16,           // Balanced halo
    phaseFlash: 0.24,              // Balanced flash
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
    this.ritualStages = {
      PRELUDE: 'PRELUDE',
      ACTIVE: 'ACTIVE',
      CREST: 'CREST',
      RELEASE: 'RELEASE',
    };

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
   * LAYER 1: PRELUDE — NETWORK ATTUNEMENT
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
    const archetype = this._resolveRitualArchetype(ritual);
    const ritualState = {
      stage: this.ritualStages.PRELUDE,
      archetype,
      startTime: now,
      progress: 0,
      crestTriggered: false,
      phaseOffset: this.globalRitualPhase,
      affectedRenderables,
      modifiers: new Map(),
    };

    this.ritualVisualStates.set(ritualId, ritualState);

    // Phase 1a: Pre-ritual attunement (1.5 seconds)
    // Apply subtle synchronization modifiers
    this._applyPreRitualModifiers(affectedRenderables, ritualId, ritualState.archetype);

    this.stats.activeRituals = this.ritualVisualStates.size;
  }

  /**
   * ========================================================================
   * LAYER 2: ACTIVE — COHERENT RESONANCE
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
    state.stage = this.ritualStages.ACTIVE;
    state.stageStartTime = performance.now();
    state.startTime = state.stageStartTime;

    // Clear pre-ritual modifiers and apply active modifiers
    this._clearModifiersForRitual(ritualId);
    this._applyRitualActiveModifiers(state.affectedRenderables, ritualId, state.archetype);
  }

  /**
   * ========================================================================
   * LAYER 4: RELEASE — RESOLUTION
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

    state.stage = this.ritualStages.RELEASE;
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
      ? RITUAL_VISUAL_CONFIG.RELEASE.success.releaseDuration
      : RITUAL_VISUAL_CONFIG.RELEASE.failure.releaseDuration;

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
  _applyPreRitualModifiers(affectedRenderables, ritualId, archetype) {
    const config = RITUAL_VISUAL_CONFIG.PRELUDE;
    const metricMod = this._getMetricModulation();
    const archetypeProfile = RITUAL_ARCHETYPE_PROFILES[archetype] || RITUAL_ARCHETYPE_PROFILES.default;

    for (const renderable of affectedRenderables) {
      const modifier = {
        ritualId,
        layer: this.ritualStages.PRELUDE,
        intensityMultiplier: metricMod.preRitualIntensity,
        phaseSync: config.linkPulseSync,
        jitterSuppression: metricMod.jitterSuppression,
        coreShape: archetypeProfile.coreShape,
        overlayPattern: archetypeProfile.overlayPattern,
        atmospherePattern: archetypeProfile.atmospherePattern,
        motionProfile: archetypeProfile.motionProfile,
        glyphDensity: archetypeProfile.glyphDensity,
        ringSupport: archetypeProfile.ringSupport,
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
  _applyRitualActiveModifiers(affectedRenderables, ritualId, archetype) {
    const config = RITUAL_VISUAL_CONFIG.ACTIVE;
    const metricMod = this._getMetricModulation();
    const archetypeProfile = RITUAL_ARCHETYPE_PROFILES[archetype] || RITUAL_ARCHETYPE_PROFILES.default;

    for (const renderable of affectedRenderables) {
      const modifier = {
        ritualId,
        layer: this.ritualStages.ACTIVE,
        intensityMultiplier: metricMod.activeIntensity,
        radiusScale: metricMod.radiusScale,
        coreShape: archetypeProfile.coreShape,
        overlayPattern: archetypeProfile.overlayPattern,
        atmospherePattern: archetypeProfile.atmospherePattern,
        motionProfile: archetypeProfile.motionProfile,
        ribbonIntensity: archetypeProfile.ribbonIntensity,
        haloIntensity: archetypeProfile.haloIntensity,
        phaseFlash: archetypeProfile.phaseFlash,
        globalPhaseSync: config.globalPhaseSync,
        phaseOffset: this.globalRitualPhase,
        stressDamping: metricMod.stressDamping,
        waveRipple: config.waveRippleEffect,
        ribbonTrails: config.ribbonTrails,
        composition: {
          core: true,
          rings: true,
          surface: true,
          atmosphere: true,
        },
        envelope: (t) => 1.0,            // Full intensity during active phase
        duration: Infinity,              // Until completion
      };

      this._applyModifierToRenderable(renderable, modifier);
    }
  }

  _applyCrestModifiers(affectedRenderables, ritualId, state) {
    const config = RITUAL_VISUAL_CONFIG.CREST;
    const archetype = RITUAL_ARCHETYPE_PROFILES[state.archetype] || RITUAL_ARCHETYPE_PROFILES.default;

    for (const renderable of affectedRenderables) {
      const modifier = {
        ritualId,
        layer: this.ritualStages.CREST,
        intensityMultiplier: config.intensityBoost,
        radiusScale: 1.1,
        haloBoost: archetype.haloIntensity,
        phaseFlash: archetype.phaseFlash,
        ribbonPulse: config.ribbonPulse,
        composition: {
          rings: true,
          sigils: true,
          atmosphere: true,
        },
        envelope: (t) => this._fadeOutEnvelope(t, config.duration),
        duration: config.duration,
      };
      this._applyModifierToRenderable(renderable, modifier);
    }
  }

  /**
   * Apply completion success modifiers.
   * Coherence pulse, calm settling, return to baseline.
   */
  _applyCompletionSuccessModifiers(affectedRenderables, ritualId) {
    const config = RITUAL_VISUAL_CONFIG.RELEASE.success;

    for (const renderable of affectedRenderables) {
      const modifier = {
        ritualId,
        layer: `${this.ritualStages.RELEASE}_SUCCESS`,
        intensityMultiplier: 1.2,       // Brief brightening (coherence pulse)
        radiusScale: 1.1,               // Slight expansion
        calmingBreath: config.calmingBreath,
        settleDamping: config.settleDamping,
        phaseFlash: 0.15,
        composition: {
          rings: true,
          atmosphere: true,
        },
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
    const config = RITUAL_VISUAL_CONFIG.RELEASE.failure;

    for (const renderable of affectedRenderables) {
      const modifier = {
        ritualId,
        layer: `${this.ritualStages.RELEASE}_FAILURE`,
        intensityMultiplier: 0.9,       // Gentle dimming
        desyncSpread: config.desyncSpread,
        energyDispersion: config.energyDispersion,
        turbulenceBump: config.turbulenceBump,
        phaseFlash: 0.1,
        composition: {
          core: true,
          surface: true,
        },
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
if (state.stage === this.ritualStages.PRELUDE && elapsed > RITUAL_VISUAL_CONFIG.PRELUDE.duration) {
      // Prelude ends, but wait for progress event to transition to ACTIVE
    }

    if (state.stage === this.ritualStages.ACTIVE && !state.crestTriggered && elapsed > RITUAL_VISUAL_CONFIG.ACTIVE.phaseFlashThreshold) {
      state.stage = this.ritualStages.CREST;
      state.crestTriggered = true;
      this._applyCrestModifiers(state.affectedRenderables, ritualId, state);
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
      if (state.stage === this.ritualStages.RELEASE) {
        const completionDuration = state.success
          ? RITUAL_VISUAL_CONFIG.RELEASE.success.releaseDuration
          : RITUAL_VISUAL_CONFIG.RELEASE.failure.releaseDuration;

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

  _resolveRitualArchetype(ritual) {
    if (!ritual) return 'default';
    const rawValue = ritual.type || ritual.archetype || ritual.theme || ritual.name || '';
    const normalized = String(rawValue).trim().toLowerCase();
    const aliasMap = {
      ascension: 'Ascension',
      'ascension rite': 'Ascension',
      convergence: 'Convergence',
      'convergence rite': 'Convergence',
      'quantum fracture': 'QuantumFracture',
      'quantumfracture': 'QuantumFracture',
      'quantum rite': 'QuantumFracture',
      chaos: 'ChaosCeremony',
      'chaos ceremony': 'ChaosCeremony',
      memory: 'MemoryEcho',
      'memory echo': 'MemoryEcho',
      echo: 'MemoryEcho',
    };
    return aliasMap[normalized] || 'default';
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
      jitterSuppression: Math.min(0.9, RITUAL_VISUAL_CONFIG.PRELUDE.jitterReduction + stabilityGuard),
      activeIntensity: Math.min(
        RITUAL_VISUAL_CONFIG.GLOBAL.maxIntensity,
        RITUAL_VISUAL_CONFIG.ACTIVE.linkIntensity + intensityBoost
      ),
      radiusScale: Math.min(
        RITUAL_VISUAL_CONFIG.GLOBAL.maxRadiusScale,
        RITUAL_VISUAL_CONFIG.ACTIVE.nodeRadiusScale + harmonyBoost
      ),
      stressDamping: Math.min(0.8, RITUAL_VISUAL_CONFIG.ACTIVE.stressDamping + stressBoost),
    };
  }
}

export { Phase8RitualVisualOrchestration, RITUAL_VISUAL_CONFIG };
