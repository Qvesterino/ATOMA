/**
 * ============================================================================
 * EVENT DRAMATURGY ENGINE
 * ============================================================================
 *
 * World-class events are not just "something happens." They are properly
 * prepared (telegraph), delivered (escalation), and resolved (payoff).
 *
 * This engine wraps major ATOMA events in a 3-phase dramaturgy lifecycle:
 *   TELEGRAPH  — subtle environmental hints that something is coming
 *   ESCALATION — the main event arrives with full impact
 *   PAYOFF     — aftermath, environment change, resolution
 *
 * SUPPORTED EVENT FAMILIES:
 *   - cascade       (cascade.start → cascade.end)
 *   - corruption    (network:corruptionSpread → topology.healing)
 *   - resonance     (event:harmonyResonance, hub.harmony.high)
 *   - ritual        (semantic.ritual.started → semantic.ritual.completed)
 *   - hazard        (environment.hazard.active, event:loadCollapse, event:instabilityTrap)
 *
 * INTEGRATION:
 *   - Reads: SemanticEventBus events (trigger + end signals)
 *   - Writes: dramaturgy.phase, dramaturgy.sequence.start, dramaturgy.sequence.end
 *   - Drives: visual overlay (vignette + directional glow), audio cues, environment VFX modulation
 *   - Owned by: EnvironmentDomainController
 *   - Scheduler: visual lane (30Hz update)
 *
 * DESIGN PRINCIPLES:
 *   - Every phase is optional — profiles can skip telegraph or payoff
 *   - Intensity is always bounded [0, 1]
 *   - Visual overlay: CSS vignette + directional glow — no camera manipulation
 *   - Audio cues use existing AtomaAudioSystem routing with spatial panning
 *   - Environment modulation is additive — never overrides base state
 *
 * @author ATOMA Evolution V2 — P1.4 Event Dramaturgy
 * @version 1.0.0
 */

// ============================================================================
// PHASE ENUM
// ============================================================================

export const DRAMATURGY_PHASE = Object.freeze({
  TELEGRAPH: 'telegraph',
  ESCALATION: 'escalation',
  PAYOFF: 'payoff',
  COMPLETE: 'complete'
});

// ============================================================================
// DRAMATURGY PROFILES — per-event-family configuration
// ============================================================================

const DRAMATURGY_PROFILES = Object.freeze({
  cascade: {
    label: 'Cascade',
    triggerEvents: ['cascade.start'],
    endEvents: ['cascade.end'],
    telegraph: { durationMs: 800, intensity: 0.3 },
    escalation: { durationMs: 2000, intensity: 1.0 },
    payoff: { durationMs: 1500, intensity: 0.4 },
    camera: {
      telegraph: { shake: 0.015, drift: 0.3 },
      escalation: { shake: 0.06, drift: 0.0 },
      payoff: { shake: 0.008, drift: 0.5 }
    },
    environment: {
      telegraph: { desaturation: 0.05, fogShift: 0.02 },
      escalation: { desaturation: 0.15, fogShift: 0.08 },
      payoff: { desaturation: -0.03, fogShift: -0.02 }
    },
    audioCue: 'dramaturgy.cascade',
    maxConcurrent: 3
  },

  corruption: {
    label: 'Corruption Surge',
    triggerEvents: ['network:corruptionSpread', 'node.corruption.high'],
    endEvents: ['topology.healing'],
    telegraph: { durationMs: 1200, intensity: 0.4 },
    escalation: { durationMs: 3000, intensity: 1.0 },
    payoff: { durationMs: 2000, intensity: 0.3 },
    camera: {
      telegraph: { shake: 0.02, drift: 0.4 },
      escalation: { shake: 0.05, drift: 0.0 },
      payoff: { shake: 0.0, drift: 0.6 }
    },
    environment: {
      telegraph: { desaturation: 0.08, fogShift: 0.03 },
      escalation: { desaturation: 0.2, fogShift: 0.1 },
      payoff: { desaturation: -0.05, fogShift: -0.03 }
    },
    audioCue: 'dramaturgy.corruption',
    maxConcurrent: 2
  },

  resonance: {
    label: 'Resonance Bloom',
    triggerEvents: ['event:harmonyResonance', 'hub.harmony.high'],
    endEvents: [],
    telegraph: { durationMs: 600, intensity: 0.25 },
    escalation: { durationMs: 1500, intensity: 0.8 },
    payoff: { durationMs: 1200, intensity: 0.35 },
    camera: {
      telegraph: { shake: 0.0, drift: 0.2 },
      escalation: { shake: 0.02, drift: 0.0 },
      payoff: { shake: 0.0, drift: 0.4 }
    },
    environment: {
      telegraph: { desaturation: -0.02, fogShift: -0.01 },
      escalation: { desaturation: -0.05, fogShift: -0.03 },
      payoff: { desaturation: -0.03, fogShift: -0.02 }
    },
    audioCue: 'dramaturgy.resonance',
    maxConcurrent: 2
  },

  ritual: {
    label: 'Mythic Ritual',
    triggerEvents: ['semantic.ritual.started'],
    endEvents: ['semantic.ritual.completed'],
    telegraph: { durationMs: 1500, intensity: 0.35 },
    escalation: { durationMs: 4000, intensity: 1.0 },
    payoff: { durationMs: 2500, intensity: 0.5 },
    camera: {
      telegraph: { shake: 0.008, drift: 0.5 },
      escalation: { shake: 0.03, drift: 0.0 },
      payoff: { shake: 0.0, drift: 0.8 }
    },
    environment: {
      telegraph: { desaturation: -0.03, fogShift: -0.02 },
      escalation: { desaturation: -0.1, fogShift: -0.05 },
      payoff: { desaturation: -0.05, fogShift: -0.03 }
    },
    audioCue: 'dramaturgy.ritual',
    maxConcurrent: 1
  },

  hazard: {
    label: 'World Hazard',
    triggerEvents: ['environment.hazard.active', 'event:loadCollapse', 'event:instabilityTrap'],
    endEvents: [],
    telegraph: { durationMs: 1000, intensity: 0.4 },
    escalation: { durationMs: 2500, intensity: 1.0 },
    payoff: { durationMs: 1800, intensity: 0.3 },
    camera: {
      telegraph: { shake: 0.03, drift: 0.2 },
      escalation: { shake: 0.08, drift: 0.0 },
      payoff: { shake: 0.01, drift: 0.3 }
    },
    environment: {
      telegraph: { desaturation: 0.06, fogShift: 0.04 },
      escalation: { desaturation: 0.18, fogShift: 0.12 },
      payoff: { desaturation: -0.04, fogShift: -0.03 }
    },
    audioCue: 'dramaturgy.hazard',
    maxConcurrent: 2
  }
});

// ============================================================================
// ACTIVE SEQUENCE — tracks a single dramaturgy sequence through its lifecycle
// ============================================================================

class DramaturgySequence {
  /**
   * @param {string} id - Unique sequence identifier
   * @param {string} family - Event family (cascade, corruption, etc.)
   * @param {object} profile - The dramaturgy profile for this family
   * @param {object} [origin] - Optional origin data { position, nodeId, linkId }
   */
  constructor(id, family, profile, origin = null) {
    this.id = id;
    this.family = family;
    this.profile = profile;
    this.origin = origin;

    this.phase = DRAMATURGY_PHASE.TELEGRAPH;
    this.phaseStartTime = performance.now();
    this.sequenceStartTime = performance.now();
    this.intensity = profile.telegraph.intensity;
    this.elapsed = 0;
    this.phaseElapsed = 0;
    this.active = true;

    // Computed per-frame
    this.vignetteIntensity = 0;
    this.glowStrength = 0;
    this.desaturation = 0;
    this.fogShift = 0;
  }

  /**
   * Advance the sequence by dt milliseconds.
   * Returns the current phase after advancement.
   */
  tick(dt) {
    if (!this.active) return DRAMATURGY_PHASE.COMPLETE;

    this.elapsed += dt;
    this.phaseElapsed += dt;

    const profile = this.profile;
    let currentPhaseConfig;

    switch (this.phase) {
      case DRAMATURGY_PHASE.TELEGRAPH:
        currentPhaseConfig = profile.telegraph;
        if (this.phaseElapsed >= currentPhaseConfig.durationMs) {
          this._transitionTo(DRAMATURGY_PHASE.ESCALATION);
          return DRAMATURGY_PHASE.ESCALATION;
        }
        this._updateInterpolation(currentPhaseConfig);
        break;

      case DRAMATURGY_PHASE.ESCALATION:
        currentPhaseConfig = profile.escalation;
        if (this.phaseElapsed >= currentPhaseConfig.durationMs) {
          this._transitionTo(DRAMATURGY_PHASE.PAYOFF);
          return DRAMATURGY_PHASE.PAYOFF;
        }
        this._updateInterpolation(currentPhaseConfig);
        break;

      case DRAMATURGY_PHASE.PAYOFF:
        currentPhaseConfig = profile.payoff;
        if (this.phaseElapsed >= currentPhaseConfig.durationMs) {
          this._transitionTo(DRAMATURGY_PHASE.COMPLETE);
          this.active = false;
          return DRAMATURGY_PHASE.COMPLETE;
        }
        this._updatePayoffDecay(currentPhaseConfig);
        break;

      default:
        this.active = false;
        return DRAMATURGY_PHASE.COMPLETE;
    }

    return this.phase;
  }

  /**
   * Force-skip to escalation (used when a trigger event has no telegraph
   * or when the event arrives faster than expected).
   */
  skipToEscalation() {
    if (this.phase === DRAMATURGY_PHASE.TELEGRAPH) {
      this._transitionTo(DRAMATURGY_PHASE.ESCALATION);
    }
  }

  /**
   * Force-end the sequence (used when an end event arrives early).
   */
  forceEnd() {
    if (this.phase === DRAMATURGY_PHASE.TELEGRAPH || this.phase === DRAMATURGY_PHASE.ESCALATION) {
      this._transitionTo(DRAMATURGY_PHASE.PAYOFF);
    }
  }

  // --- Private ---

  _transitionTo(newPhase) {
    const prevPhase = this.phase;
    this.phase = newPhase;
    this.phaseStartTime = performance.now();
    this.phaseElapsed = 0;
    this._onPhaseTransition(prevPhase, newPhase);
  }

  _onPhaseTransition(from, to) {
    // Intensity snap at phase boundaries
    const profile = this.profile;
    switch (to) {
      case DRAMATURGY_PHASE.TELEGRAPH:
        this.intensity = profile.telegraph.intensity;
        break;
      case DRAMATURGY_PHASE.ESCALATION:
        this.intensity = profile.escalation.intensity;
        break;
      case DRAMATURGY_PHASE.PAYOFF:
        this.intensity = profile.payoff.intensity;
        break;
      case DRAMATURGY_PHASE.COMPLETE:
        this.intensity = 0;
        break;
    }

    // Visual overlay values snap at boundaries (repurposed from camera config)
    const cam = profile.camera[to];
    if (cam) {
      this.vignetteIntensity = cam.shake;   // shake → vignette darkness
      this.glowStrength = cam.drift;         // drift → directional glow
    } else {
      this.vignetteIntensity = 0;
      this.glowStrength = 0;
    }

    // Environment values snap at boundaries
    const env = profile.environment[to];
    if (env) {
      this.desaturation = env.desaturation;
      this.fogShift = env.fogShift;
    } else {
      this.desaturation = 0;
      this.fogShift = 0;
    }
  }

  _updateInterpolation(phaseConfig) {
    const t = Math.min(1, this.phaseElapsed / phaseConfig.durationMs);
    // Smooth ease-in during telegraph and escalation
    const eased = t * t;
    this.intensity = phaseConfig.intensity * eased;
  }

  _updatePayoffDecay(phaseConfig) {
    const t = Math.min(1, this.phaseElapsed / phaseConfig.durationMs);
    // Exponential decay during payoff
    const decayed = 1 - Math.pow(t, 0.5);
    this.intensity = phaseConfig.intensity * decayed;

    // Visual overlay and environment also decay
    const cam = this.profile.camera.payoff;
    if (cam) {
      this.vignetteIntensity = cam.shake * decayed;
      this.glowStrength = cam.drift * (1 - t);
    }
    const env = this.profile.environment.payoff;
    if (env) {
      this.desaturation = env.desaturation * decayed;
      this.fogShift = env.fogShift * decayed;
    }
  }
}

// ============================================================================
// EVENT DRAMATURGY ENGINE
// ============================================================================

export class EventDramaturgyEngine {
  /**
   * @param {object} config
   * @param {object} config.semanticBus - The SemanticEventBus instance
   * @param {object} [config.camera] - THREE.Camera for micro-reactions
   * @param {object} [config.audioSystem] - AtomaAudioSystem for audio cues
   * @param {object} [config.environmentDomain] - EnvironmentDomainController reference
   */
  constructor(config = {}) {
    this.semanticBus = config.semanticBus || this._resolveBus();
    this.camera = config.camera || null;
    this.audioSystem = config.audioSystem || null;
    this.environmentDomain = config.environmentDomain || null;

    // Active sequences keyed by id
    this.activeSequences = new Map();
    // Sequence counter for unique IDs
    this._sequenceCounter = 0;
    // Event subscriptions for cleanup
    this._subscriptions = [];
    // Trigger-to-family reverse map
    this._triggerToFamily = new Map();
    this._endToFamily = new Map();
    // Per-family concurrent count
    this._familyConcurrentCount = new Map();
    // Cooldown per family to prevent spam
    this._familyLastTrigger = new Map();
    this._familyCooldownMs = 2000;

    // Aggregated environment state (additive across all active sequences)
    this.aggregatedState = {
      vignette: 0,
      glow: 0,
      desaturation: 0,
      fogShift: 0,
      dominantFamily: null,
      dominantIntensity: 0,
      activeCount: 0
    };

    // Visual overlay state (CSS-based vignette + directional glow)
    this._overlayRoot = null;
    this._overlayVignette = null;
    this._overlayGlow = null;
    this._overlayState = { vignette: 0, glow: 0, glowAngle: 0, tintR: 0, tintG: 0, tintB: 0 };

    this._initialized = false;
    this._enabled = true;

    this._buildReverseMaps();
  }

  /**
   * Initialize the engine — subscribes to semantic bus events.
   */
  init() {
    if (this._initialized) return;
    if (!this.semanticBus) {
      console.warn('[EventDramaturgyEngine] No semanticBus available — engine disabled');
      return;
    }

    this._subscribeToTriggers();
    this._subscribeToEndEvents();

    this._initialized = true;
    console.log('[EventDramaturgyEngine] Initialized — monitoring event families:',
      Object.keys(DRAMATURGY_PROFILES).join(', '));
  }

  /**
   * Set or update the camera reference.
   */
  setCamera(camera) {
    this.camera = camera;
  }

  /**
   * Set or update the audio system reference.
   */
  setAudioSystem(audioSystem) {
    this.audioSystem = audioSystem;
  }

  /**
   * Enable or disable the engine.
   */
  setEnabled(enabled) {
    this._enabled = enabled;
    if (!enabled) {
      this._clearAllSequences();
    }
  }

  /**
   * Main update tick — call from visual scheduler lane (30Hz).
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this._enabled || !this._initialized) return;

    const dtMs = dt * 1000;

    // Tick all active sequences
    const completedIds = [];
    let dominantIntensity = 0;
    let dominantFamily = null;

    for (const [id, seq] of this.activeSequences) {
      const prevPhase = seq.phase;
      const newPhase = seq.tick(dtMs);

      // Emit phase transition events
      if (newPhase !== prevPhase && newPhase !== DRAMATURGY_PHASE.COMPLETE) {
        this._emitPhaseEvent(seq, newPhase);
      }

      if (!seq.active || newPhase === DRAMATURGY_PHASE.COMPLETE) {
        completedIds.push(id);
        this._emitSequenceEnd(seq);
        continue;
      }

      // Track dominant sequence for camera focus
      if (seq.intensity > dominantIntensity) {
        dominantIntensity = seq.intensity;
        dominantFamily = seq.family;
      }
    }

    // Clean completed sequences
    for (const id of completedIds) {
      const seq = this.activeSequences.get(id);
      if (seq) {
        this._decrementFamilyCount(seq.family);
      }
      this.activeSequences.delete(id);
    }

    // Aggregate state from all active sequences
    this._aggregateState(dominantFamily, dominantIntensity);

    // Apply visual overlay (vignette + directional glow)
    this._applyVisualOverlay(dt);

    // Apply environment modulation
    this._applyEnvironmentModulation();
  }

  /**
   * Get current aggregated dramaturgy state.
   * Useful for VFX systems that want to read the current mood.
   */
  getState() {
    return { ...this.aggregatedState };
  }

  /**
   * Get all active sequences (for debugging/inspection).
   */
  getActiveSequences() {
    return Array.from(this.activeSequences.values()).map(seq => ({
      id: seq.id,
      family: seq.family,
      phase: seq.phase,
      intensity: seq.intensity,
      elapsed: seq.elapsed,
      origin: seq.origin
    }));
  }

  /**
   * Dispose — clean up all subscriptions and sequences.
   */
  dispose() {
    this._clearAllSequences();
    for (const unsub of this._subscriptions) {
      try { unsub(); } catch (_) { /* ignore */ }
    }
    this._subscriptions = [];
    this._initialized = false;

    // Destroy visual overlay DOM
    this._destroyOverlay();
  }

  // ==========================================================================
  // PRIVATE — Event subscription
  // ==========================================================================

  _resolveBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }
    if (typeof window !== 'undefined') {
      return window.ATOMA_BUS || window.semanticBus || null;
    }
    return null;
  }

  _buildReverseMaps() {
    for (const [family, profile] of Object.entries(DRAMATURGY_PROFILES)) {
      for (const trigger of profile.triggerEvents) {
        this._triggerToFamily.set(trigger, family);
      }
      for (const endEvent of profile.endEvents) {
        this._endToFamily.set(endEvent, family);
      }
    }
  }

  _subscribeToTriggers() {
    const bus = this.semanticBus;
    if (!bus) return;

    // Subscribe to each unique trigger event
    const subscribed = new Set();
    for (const [triggerEvent, family] of this._triggerToFamily) {
      if (subscribed.has(triggerEvent)) continue;
      subscribed.add(triggerEvent);

      const handler = (payload) => {
        if (!this._enabled) return;
        this._handleTrigger(triggerEvent, family, payload);
      };

      this._busSubscribe(triggerEvent, handler);
    }
  }

  _subscribeToEndEvents() {
    const bus = this.semanticBus;
    if (!bus) return;

    const subscribed = new Set();
    for (const [endEvent, family] of this._endToFamily) {
      if (subscribed.has(endEvent)) continue;
      subscribed.add(endEvent);

      const handler = (payload) => {
        if (!this._enabled) return;
        this._handleEnd(endEvent, family, payload);
      };

      this._busSubscribe(endEvent, handler);
    }
  }

  _busSubscribe(eventName, handler) {
    const bus = this.semanticBus;
    if (!bus) return;

    if (typeof bus.subscribe === 'function') {
      const unsub = bus.subscribe(eventName, handler);
      if (typeof unsub === 'function') {
        this._subscriptions.push(unsub);
      } else {
        this._subscriptions.push(() => {
          try { bus.unsubscribe(eventName, handler); } catch (_) {}
        });
      }
    } else if (typeof bus.on === 'function') {
      bus.on(eventName, handler);
      this._subscriptions.push(() => {
        try { bus.off(eventName, handler); } catch (_) {}
      });
    }
  }

  // ==========================================================================
  // PRIVATE — Event handling
  // ==========================================================================

  _handleTrigger(triggerEvent, family, payload) {
    const profile = DRAMATURGY_PROFILES[family];
    if (!profile) return;

    // Check cooldown
    const now = performance.now();
    const lastTrigger = this._familyLastTrigger.get(family) || 0;
    if (now - lastTrigger < this._familyCooldownMs) return;

    // Check concurrent limit
    const currentCount = this._familyConcurrentCount.get(family) || 0;
    if (currentCount >= profile.maxConcurrent) return;

    // Extract origin from payload
    const origin = this._extractOrigin(payload);

    // Create new sequence
    const id = `dramaturgy_${family}_${++this._sequenceCounter}`;
    const sequence = new DramaturgySequence(id, family, profile, origin);

    this.activeSequences.set(id, sequence);
    this._familyConcurrentCount.set(family, currentCount + 1);
    this._familyLastTrigger.set(family, now);

    // Emit sequence start
    this._emitSequenceStart(sequence, triggerEvent);

    // Emit initial telegraph phase
    this._emitPhaseEvent(sequence, DRAMATURGY_PHASE.TELEGRAPH);

    // Audio cue for telegraph
    this._playAudioCue(sequence, DRAMATURGY_PHASE.TELEGRAPH);
  }

  _handleEnd(endEvent, family, payload) {
    // Find active sequences for this family and force them to payoff
    for (const [id, seq] of this.activeSequences) {
      if (seq.family === family && seq.active) {
        if (seq.phase === DRAMATURGY_PHASE.TELEGRAPH || seq.phase === DRAMATURGY_PHASE.ESCALATION) {
          seq.forceEnd();
          this._emitPhaseEvent(seq, DRAMATURGY_PHASE.PAYOFF);
          this._playAudioCue(seq, DRAMATURGY_PHASE.PAYOFF);
        }
      }
    }
  }

  _extractOrigin(payload) {
    if (!payload) return null;

    const origin = {};

    if (payload.position) {
      origin.position = {
        x: payload.position.x || 0,
        y: payload.position.y || 0,
        z: payload.position.z || 0
      };
    } else if (payload.sourcePosition) {
      origin.position = {
        x: payload.sourcePosition.x || 0,
        y: payload.sourcePosition.y || 0,
        z: payload.sourcePosition.z || 0
      };
    }

    if (payload.nodeId) origin.nodeId = payload.nodeId;
    if (payload.linkId) origin.linkId = payload.linkId;
    if (payload.hubId) origin.hubId = payload.hubId;
    if (payload.sourceId) origin.sourceId = payload.sourceId;

    return Object.keys(origin).length > 0 ? origin : null;
  }

  // ==========================================================================
  // PRIVATE — State aggregation
  // ==========================================================================

  _aggregateState(dominantFamily, dominantIntensity) {
    let totalVignette = 0;
    let totalGlow = 0;
    let totalDesat = 0;
    let totalFog = 0;

    for (const [, seq] of this.activeSequences) {
      if (!seq.active) continue;
      totalVignette += seq.vignetteIntensity * seq.intensity;
      totalGlow += seq.glowStrength * seq.intensity;
      totalDesat += seq.desaturation * seq.intensity;
      totalFog += seq.fogShift * seq.intensity;
    }

    this.aggregatedState = {
      vignette: Math.min(0.15, totalVignette),
      glow: Math.min(1.0, totalGlow),
      desaturation: Math.max(-0.15, Math.min(0.3, totalDesat)),
      fogShift: Math.max(-0.1, Math.min(0.2, totalFog)),
      dominantFamily,
      dominantIntensity: Math.min(1.0, dominantIntensity),
      activeCount: this.activeSequences.size
    };
  }

  // ==========================================================================
  // PRIVATE — Visual overlay (vignette + directional glow)
  // ==========================================================================

  /** Family → overlay tint colors */
  static OVERLAY_COLORS = {
    cascade:    { r: 68,  g: 136, b: 255 },   // Blue
    corruption: { r: 170, g: 68,  b: 255 },   // Purple
    resonance:  { r: 255, g: 204, b: 68  },   // Gold
    ritual:     { r: 200, g: 220, b: 255 },   // Silver
    hazard:     { r: 255, g: 102, b: 68  }    // Red-orange
  };

  _ensureOverlay() {
    if (this._overlayRoot) return;

    const root = document.createElement('div');
    root.id = 'dramaturgy-overlay';
    root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:100;overflow:hidden;';

    // Vignette layer — radial darkening from center
    const vignette = document.createElement('div');
    vignette.style.cssText =
      'position:absolute;inset:0;opacity:0;transition:opacity 0.4s ease-out;' +
      'background:radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%);';
    root.appendChild(vignette);

    // Directional glow layer — colored light from event direction
    const glow = document.createElement('div');
    glow.style.cssText =
      'position:absolute;inset:0;opacity:0;transition:opacity 0.3s ease-out, background 0.5s ease-out;';
    root.appendChild(glow);

    document.body.appendChild(root);
    this._overlayRoot = root;
    this._overlayVignette = vignette;
    this._overlayGlow = glow;
  }

  _applyVisualOverlay(dt) {
    const state = this.aggregatedState;
    if (state.vignette < 0.001 && state.glow < 0.001) {
      this._clearOverlay();
      return;
    }

    this._ensureOverlay();

    // Vignette — scale intensity for visible effect (profile values are 0-0.15, map to 0-0.8 opacity)
    const vignetteOpacity = Math.min(0.8, state.vignette * 5.5 * state.dominantIntensity);
    this._overlayVignette.style.opacity = vignetteOpacity.toFixed(3);

    // Directional glow — compute angle from dominant event origin relative to camera
    const dominantSeq = this._findDominantSequence();
    let glowAngle = 180; // default: from bottom
    let tintR = 100, tintG = 100, tintB = 255;

    if (dominantSeq?.origin?.position && this.camera?.position) {
      const ox = dominantSeq.origin.position.x - this.camera.position.x;
      const oz = dominantSeq.origin.position.z - this.camera.position.z;
      glowAngle = Math.atan2(ox, oz) * (180 / Math.PI);
      if (glowAngle < 0) glowAngle += 360;

      // Camera forward direction for relative angle
      if (this.camera.getWorldDirection) {
        const dir = { x: 0, y: 0, z: 0 };
        this.camera.getWorldDirection(dir);
        const camAngle = Math.atan2(dir.x, dir.z) * (180 / Math.PI);
        glowAngle = glowAngle - camAngle + 180;
        if (glowAngle < 0) glowAngle += 360;
        if (glowAngle >= 360) glowAngle -= 360;
      }
    }

    // Family tint color
    const family = state.dominantFamily;
    const colors = EventDramaturgyEngine.OVERLAY_COLORS[family];
    if (colors) {
      tintR = colors.r;
      tintG = colors.g;
      tintB = colors.b;
    }

    // Glow — scale intensity for visible effect
    const glowOpacity = Math.min(0.6, state.glow * 0.7 * state.dominantIntensity);
    const glowStop = Math.min(70, 30 + state.dominantIntensity * 40);
    this._overlayGlow.style.opacity = glowOpacity.toFixed(3);
    this._overlayGlow.style.background =
      `linear-gradient(${glowAngle.toFixed(0)}deg, ` +
      `rgba(${tintR},${tintG},${tintB},0.5) 0%, ` +
      `rgba(${tintR},${tintG},${tintB},0.15) ${glowStop.toFixed(0)}%, ` +
      `transparent 100%)`;

    // Smooth interpolation for overlay state
    this._overlayState.vignette = vignetteOpacity;
    this._overlayState.glow = glowOpacity;
    this._overlayState.glowAngle = glowAngle;
    this._overlayState.tintR = tintR;
    this._overlayState.tintG = tintG;
    this._overlayState.tintB = tintB;
  }

  _clearOverlay() {
    if (!this._overlayRoot) return;

    // Fade out via CSS transitions
    this._overlayVignette.style.opacity = '0';
    this._overlayGlow.style.opacity = '0';

    this._overlayState.vignette = 0;
    this._overlayState.glow = 0;
  }

  _destroyOverlay() {
    if (!this._overlayRoot) return;
    this._overlayRoot.remove();
    this._overlayRoot = null;
    this._overlayVignette = null;
    this._overlayGlow = null;
  }

  _findDominantSequence() {
    let best = null;
    let bestIntensity = 0;
    for (const [, seq] of this.activeSequences) {
      if (seq.active && seq.intensity > bestIntensity) {
        bestIntensity = seq.intensity;
        best = seq;
      }
    }
    return best;
  }

  // ==========================================================================
  // PRIVATE — Environment modulation
  // ==========================================================================

  _applyEnvironmentModulation() {
    const state = this.aggregatedState;

    // Push modulation to dream depth systems via environment domain
    if (this.environmentDomain) {
      const safe = this.environmentDomain.instances?.safeDreamDepthPack;
      const rich = this.environmentDomain.instances?.dreamDepthEffectManager;

      if (safe && typeof safe.setDramaturgyModulation === 'function') {
        safe.setDramaturgyModulation(state);
      }
      if (rich && typeof rich.setDramaturgyModulation === 'function') {
        rich.setDramaturgyModulation(state);
      }
    }

    // Push to weather pack for fog modulation
    if (this.environmentDomain?.instances?.weatherPack) {
      const weather = this.environmentDomain.instances.weatherPack;
      if (typeof weather.setDramaturgyModulation === 'function') {
        weather.setDramaturgyModulation(state);
      }
    }

    // Push to stress visuals for color mood
    if (this.environmentDomain?.instances?.worldFXPack) {
      const worldFX = this.environmentDomain.instances.worldFXPack;
      if (typeof worldFX.setDramaturgyModulation === 'function') {
        worldFX.setDramaturgyModulation(state);
      }
    }

    // Push to thought storms for threshold/type modulation
    if (this.environmentDomain?.instances?.emergentThoughtStorms) {
      const storms = this.environmentDomain.instances.emergentThoughtStorms;
      if (typeof storms.setDramaturgyModulation === 'function') {
        storms.setDramaturgyModulation(state);
      }
    }

    // Push to quantum illusions for conditional activation
    if (this.environmentDomain?.instances?.quantumIllusions) {
      const illusions = this.environmentDomain.instances.quantumIllusions;
      if (typeof illusions.setDramaturgyModulation === 'function') {
        illusions.setDramaturgyModulation(state);
      }
    }

    // Push to world personality controller for emotional response
    if (this.environmentDomain?.instances?.worldPersonalityController) {
      const personality = this.environmentDomain.instances.worldPersonalityController;
      if (typeof personality.setDramaturgyModulation === 'function') {
        personality.setDramaturgyModulation(state);
      }
    }
  }

  // ==========================================================================
  // PRIVATE — Audio cues
  // ==========================================================================

  _playAudioCue(sequence, phase) {
    if (!this.audioSystem || !this._enabled) return;

    const profile = sequence.profile;
    const cue = `${profile.audioCue}.${phase}`;

    // Set spatial context for position-aware audio
    if (typeof this.audioSystem.setDramaturgySpatialContext === 'function') {
      const origin = sequence.origin?.position || sequence.origin || null;
      this.audioSystem.setDramaturgySpatialContext(origin, this._camera);
    }

    if (typeof this.audioSystem.playRoutedEventAudio === 'function') {
      const intensity = this._phaseIntensity(sequence, phase);
      this.audioSystem.playRoutedEventAudio({
        audioCue: cue,
        audioLayer: `dramaturgy-${sequence.family}`,
        audioIntensity: intensity
      }, cue);
    }
  }

  _phaseIntensity(sequence, phase) {
    const profile = sequence.profile;
    switch (phase) {
      case DRAMATURGY_PHASE.TELEGRAPH: return profile.telegraph.intensity;
      case DRAMATURGY_PHASE.ESCALATION: return profile.escalation.intensity;
      case DRAMATURGY_PHASE.PAYOFF: return profile.payoff.intensity;
      default: return 0;
    }
  }

  // ==========================================================================
  // PRIVATE — Event emission
  // ==========================================================================

  _emitSequenceStart(sequence, triggerEvent) {
    const bus = this.semanticBus;
    if (!bus?.emit) return;

    bus.emit('dramaturgy.sequence.start', {
      sequenceId: sequence.id,
      family: sequence.family,
      label: sequence.profile.label,
      triggerEvent,
      origin: sequence.origin,
      timestamp: performance.now()
    }, { priority: bus.priority?.NORMAL });
  }

  _emitSequenceEnd(sequence) {
    const bus = this.semanticBus;
    if (!bus?.emit) return;

    bus.emit('dramaturgy.sequence.end', {
      sequenceId: sequence.id,
      family: sequence.family,
      label: sequence.profile.label,
      totalDurationMs: sequence.elapsed,
      timestamp: performance.now()
    }, { priority: bus.priority?.NORMAL });
  }

  _emitPhaseEvent(sequence, phase) {
    const bus = this.semanticBus;
    if (!bus?.emit) return;

    bus.emit('dramaturgy.phase', {
      sequenceId: sequence.id,
      family: sequence.family,
      label: sequence.profile.label,
      phase,
      intensity: sequence.intensity,
      origin: sequence.origin,
      camera: sequence.profile.camera[phase] || null,
      environment: sequence.profile.environment[phase] || null,
      timestamp: performance.now()
    }, { priority: bus.priority?.NORMAL });
  }

  // ==========================================================================
  // PRIVATE — Utilities
  // ==========================================================================

  _clearAllSequences() {
    for (const [id, seq] of this.activeSequences) {
      this._emitSequenceEnd(seq);
    }
    this.activeSequences.clear();
    this._familyConcurrentCount.clear();
    this._clearOverlay();
    this.aggregatedState = {
      vignette: 0,
      glow: 0,
      desaturation: 0,
      fogShift: 0,
      dominantFamily: null,
      dominantIntensity: 0,
      activeCount: 0
    };
  }

  _decrementFamilyCount(family) {
    const count = this._familyConcurrentCount.get(family) || 0;
    this._familyConcurrentCount.set(family, Math.max(0, count - 1));
  }
}

// ============================================================================
// CONSOLE DEBUG API
// ============================================================================

export function installDramaturgyDebugAPI(engine) {
  if (typeof window === 'undefined') return;

  window.dramaturgy = {
    status: () => {
      const state = engine.getState();
      const sequences = engine.getActiveSequences();
      console.log('=== EVENT DRAMATURGY ENGINE ===');
      console.log(`Active sequences: ${sequences.length}`);
      console.log(`Dominant family: ${state.dominantFamily || 'none'}`);
      console.log(`Dominant intensity: ${state.dominantIntensity.toFixed(3)}`);
      console.log(`Vignette: ${state.vignette.toFixed(4)}`);
      console.log(`Directional glow: ${state.glow.toFixed(4)}`);
      console.log(`Desaturation: ${state.desaturation.toFixed(4)}`);
      console.log(`Fog shift: ${state.fogShift.toFixed(4)}`);
      if (sequences.length > 0) {
        console.table(sequences);
      }
      return { state, sequences };
    },
    trigger: (family) => {
      const profile = DRAMATURGY_PROFILES[family];
      if (!profile) {
        console.warn(`Unknown family: ${family}. Available: ${Object.keys(DRAMATURGY_PROFILES).join(', ')}`);
        return;
      }
      // Manually trigger a dramaturgy sequence for testing
      const id = `dramaturgy_debug_${family}_${++engine._sequenceCounter}`;
      const sequence = new DramaturgySequence(id, family, profile, null);
      engine.activeSequences.set(id, sequence);
      const count = engine._familyConcurrentCount.get(family) || 0;
      engine._familyConcurrentCount.set(family, count + 1);
      engine._emitSequenceStart(sequence, 'debug.manual');
      engine._emitPhaseEvent(sequence, DRAMATURGY_PHASE.TELEGRAPH);
      console.log(`✓ Triggered debug ${family} dramaturgy sequence: ${id}`);
    },
    clear: () => {
      engine._clearAllSequences();
      console.log('✓ Cleared all dramaturgy sequences');
    },
    enable: () => { engine.setEnabled(true); console.log('✓ Dramaturgy enabled'); },
    disable: () => { engine.setEnabled(false); console.log('✓ Dramaturgy disabled'); },
    help: () => {
      console.log(`
╔═══════════════════════════════════════╗
║   EVENT DRAMATURGY ENGINE — DEBUG     ║
╠═══════════════════════════════════════╣
║ dramaturgy.status()   — Active state  ║
║ dramaturgy.trigger(f) — Test sequence ║
║   families: cascade, corruption,      ║
║     resonance, ritual, hazard         ║
║ dramaturgy.clear()    — Clear all     ║
║ dramaturgy.enable()   — Enable        ║
║ dramaturgy.disable()  — Disable       ║
╚═══════════════════════════════════════╝
      `);
    }
  };

  console.log('[EventDramaturgyEngine] Debug API available: dramaturgy.help()');
}
