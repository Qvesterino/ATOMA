/**
 * PreCascadeVisualHint_Session146.js
 * ============================================================================
 * PRE-CASCADE VISUAL HINT SYSTEM
 * 
 * Introduces extremely subtle visual tension cues when proximal harmonic hubs
 * are synchronizing their phases, suggesting latent potential without revealing
 * cascade mechanics or triggering any gameplay changes.
 * 
 * DESIGN PHILOSOPHY:
 * The network feels tense but calm. Players sense anticipation without
 * understanding cause or outcome. The hint communicates potential, not inevitability.
 * 
 * TRIGGER CONDITIONS (ALL REQUIRED):
 * 1. Cascade system enabled
 * 2. ≥2 harmonic hubs detected as proximal
 * 3. Phase synchronization actively converging
 * 
 * VISUAL EXPRESSION (EXTREMELY SUBTLE):
 * 
 * Node Auras:
 * - Temporal coherence increase (not brightness)
 * - Micro-delay reduction in noise layers (tightening)
 * - Barely perceptible aura silhouette compression
 * 
 * Links Between Hubs:
 * - Subtle phase compression along existing link motion
 * - No new motion, no speed changes
 * - Only visible when camera is still/slow
 * 
 * Shared Hub Field:
 * - "Holding of breath" effect: reduced randomness + slight pause
 * - Duration: 300-600ms per cycle
 * - Auto-decays when proximity weakens
 * 
 * CONSTRAINTS:
 * ❌ NO glow, color change, particles, rings, waves, or pulses
 * ❌ NO obvious rhythm, beat, or predictable timing
 * ❌ NO camera effects
 * ❌ NO gameplay impact
 * ❌ NO state persistence
 * 
 * IMPLEMENTATION:
 * - Biases existing animation parameters (noise, phase offset, field deformation)
 * - All biases normalized (0-1) and smoothly eased
 * - Auto-decay when conditions stop being met
 * - Zero per-frame allocations (reuses buffers)
 * 
 * @author VFX Technical Director — ATOMA Project Session 146
 * @version 1.0.0
 */

export class PreCascadeVisualHint_Session146 {
  /**
   * Constructor
   * @param {Object} cascadeSystem - Reference to HarmonicCascadeAmplification_Session145
   * @param {Object} harmonicHubSystem - Reference to HarmonicHubAuraSystem
   * @param {Object} nodeAuraSystem - Reference to node aura system
   * @param {Object} linkResonanceSystem - Reference to link resonance system
   * @param {Object} config - Configuration object
   */
  constructor(cascadeSystem, harmonicHubSystem, nodeAuraSystem, linkResonanceSystem, config = {}) {
    this.cascadeSystem = cascadeSystem;
    this.harmonicHubSystem = harmonicHubSystem;
    this.nodeAuraSystem = nodeAuraSystem;
    this.linkResonanceSystem = linkResonanceSystem;
    
    // Configuration
    this.config = {
      // Hint intensity scaling
      hintStrengthMult: config.hintStrengthMult ?? 0.15,        // 0-1, how strong hint effect
      phaseDeltaThreshold: config.phaseDeltaThreshold ?? 0.05,  // Min phase delta to activate
      
      // Aura effects
      auraCoherenceBias: config.auraCoherenceBias ?? 0.1,       // Tightness bias
      auraSilhouetteCompress: config.auraSilhouetteCompress ?? 0.05,  // Silhouette compression
      noiseLayerDelay: config.noiseLayerDelay ?? 0.02,          // Micro-delay reduction
      
      // Link effects
      linkPhaseCompression: config.linkPhaseCompression ?? 0.08, // Phase travel distance reduction
      
      // Field effects
      fieldBreathingAmplitude: config.fieldBreathingAmplitude ?? 0.12,  // Randomness reduction
      fieldBreathingDuration: config.fieldBreathingDuration ?? 0.45,    // Seconds per cycle
      
      // Decay & easing
      decayRate: config.decayRate ?? 0.92,                      // Auto-decay speed
      easingPower: config.easingPower ?? 2.0,                   // Smoothstep power
      
      // Safety
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      maxAffectedHubs: config.maxAffectedHubs ?? 20,
    };
    
    // Per-hub hint strength tracking (hubId → strength 0-1)
    this.hubHintStrength = new Map();
    
    // Per-link hint strength tracking (linkId → strength 0-1)
    this.linkHintStrength = new Map();
    
    // Field breathing state
    this.fieldBreathingPhase = 0;  // 0-1, for cycling effect
    
    // Statistics
    this.stats = {
      activeHints: 0,
      affectedHubs: 0,
      affectedLinks: 0,
      avgHintStrength: 0,
      lastUpdateTime: 0,
    };
  }

  /**
   * Update visual hints every frame
   * @param {number} deltaTime - Delta time in seconds
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (!this.config.enabled || !this.cascadeSystem) {
      this._decayAllHints(deltaTime);
      return;
    }
    
    const startTime = performance.now();
    
    // Get proximity pairs
    const proximityPairs = this.cascadeSystem.getProximityPairs();
    
    // Early exit if insufficient proximal hubs
    if (!proximityPairs || proximityPairs.length < 1) {
      this._decayAllHints(deltaTime);
      this.stats.activeHints = 0;
      this.stats.affectedHubs = 0;
      this.stats.affectedLinks = 0;
      this.stats.avgHintStrength = 0;
      return;
    }
    
    // Get phase sync data
    const phaseSyncStats = this.cascadeSystem.phaseSynchronization?.getStats?.();
    if (!phaseSyncStats) {
      this._decayAllHints(deltaTime);
      return;
    }
    
    // Update field breathing phase
    this.fieldBreathingPhase = (this.fieldBreathingPhase + deltaTime / this.config.fieldBreathingDuration) % 1.0;
    
    // Compute hint strength from phase sync activity
    // Higher avg phase delta = stronger hint (proximity converging)
    const syncIntensity = Math.min(1.0, phaseSyncStats.avgPhaseDelta / this.config.phaseDeltaThreshold);
    const hintStrength = syncIntensity * this.config.hintStrengthMult;
    
    // Smooth step the hint strength
    const easedHintStrength = this._smoothstep(hintStrength);
    
    // Clear current hint maps
    const previousHubHints = this.hubHintStrength.size;
    const previousLinkHints = this.linkHintStrength.size;
    
    this.hubHintStrength.clear();
    this.linkHintStrength.clear();
    
    // Apply hints to proximal hub pairs
    for (let i = 0; i < Math.min(proximityPairs.length, this.config.maxAffectedHubs); i++) {
      const pair = proximityPairs[i];
      
      // Hub hints
      this.hubHintStrength.set(pair.hubAId, easedHintStrength);
      this.hubHintStrength.set(pair.hubBId, easedHintStrength);
      
      // Link hints (store by a composite key)
      const linkKey = `${pair.hubAId}-${pair.hubBId}`;
      this.linkHintStrength.set(linkKey, easedHintStrength);
    }
    
    // Decay previous hints that are no longer active
    if (previousHubHints > this.hubHintStrength.size) {
      this._decayOrphans(deltaTime);
    }
    
    // Apply hints to visual systems
    this._applyAuraHints(easedHintStrength);
    this._applyLinkHints(easedHintStrength);
    this._applyFieldHints(easedHintStrength, deltaTime);
    
    // Update statistics
    this.stats.activeHints = proximityPairs.length;
    this.stats.affectedHubs = this.hubHintStrength.size;
    this.stats.affectedLinks = this.linkHintStrength.size;
    this.stats.avgHintStrength = easedHintStrength;
    this.stats.lastUpdateTime = performance.now() - startTime;
    
    if (this.config.debugMode) {
      console.log(
        `[PreCascadeHint] active=${this.stats.activeHints} | ` +
        `hubs=${this.stats.affectedHubs} | ` +
        `links=${this.stats.affectedLinks} | ` +
        `strength=${easedHintStrength.toFixed(3)} | ` +
        `time=${this.stats.lastUpdateTime.toFixed(2)}ms`
      );
    }
  }

  /**
   * Apply hints to node auras
   * @private
   * @param {number} hintStrength - Hint strength (0-1)
   */
  _applyAuraHints(hintStrength) {
    if (!this.nodeAuraSystem || !this.harmonicHubSystem) {
      return;
    }
    
    // Apply subtle coherence bias to affected hub auras
    for (const [hubId, strength] of this.hubHintStrength.entries()) {
      const hub = this.harmonicHubSystem.hubs?.get(hubId);
      if (!hub || !hub.nodeId) continue;
      
      // Store hint metadata on hub for aura system to pick up
      hub._precastHintStrength = strength;
      hub._auraCoherenceBias = strength * this.config.auraCoherenceBias;
      hub._auraSilhouetteCompress = strength * this.config.auraSilhouetteCompress;
      hub._noiseDelayReduction = strength * this.config.noiseLayerDelay;
    }
  }

  /**
   * Apply hints to links between hubs
   * @private
   * @param {number} hintStrength - Hint strength (0-1)
   */
  _applyLinkHints(hintStrength) {
    if (!this.linkResonanceSystem || !this.cascadeSystem) {
      return;
    }
    
    // Apply subtle phase compression to links between proximal hubs
    for (const [linkKey, strength] of this.linkHintStrength.entries()) {
      // For each link, store hint for motion compression
      // This reduces phase travel distance slightly without changing speed
      const compression = strength * this.config.linkPhaseCompression;
      
      // Store on link system metadata
      if (this.linkResonanceSystem.linkMetadata) {
        if (!this.linkResonanceSystem.linkMetadata.has(linkKey)) {
          this.linkResonanceSystem.linkMetadata.set(linkKey, {});
        }
        const metadata = this.linkResonanceSystem.linkMetadata.get(linkKey);
        metadata._phaseCompression = compression;
      }
    }
  }

  /**
   * Apply breathing field hint
   * @private
   * @param {number} hintStrength - Hint strength (0-1)
   * @param {number} deltaTime - Delta time in seconds
   */
  _applyFieldHints(hintStrength, deltaTime) {
    if (!this.harmonicHubSystem) {
      return;
    }
    
    // Create "holding of breath" effect on shared fields
    // Reduces randomness and adds micro pauses to animation
    
    // Breathing curve: slight pause, then return
    // Uses sine for smooth, organic feel
    const breathingCycle = Math.sin(this.fieldBreathingPhase * Math.PI * 2);
    const breathingBias = Math.max(0, breathingCycle * 0.5 + 0.5);  // 0.5-1.0
    
    // Apply randomness reduction (field becomes more "held")
    const randomnessReduction = (1 - breathingBias) * this.config.fieldBreathingAmplitude * hintStrength;
    
    // Store on hub fields
    for (const hub of this.harmonicHubSystem.hubs?.values() || []) {
      if (this.hubHintStrength.has(hub.hubId)) {
        hub._fieldRandomnessBias = -randomnessReduction;
        hub._breathingPhase = breathingBias;
      }
    }
  }

  /**
   * Decay all active hints toward zero
   * @private
   * @param {number} deltaTime - Delta time in seconds
   */
  _decayAllHints(deltaTime) {
    // Apply decay to all active hints
    for (const [hubId, strength] of this.hubHintStrength.entries()) {
      const decayed = strength * Math.pow(this.config.decayRate, deltaTime * 60);  // Per-frame decay
      if (decayed < 0.001) {
        this.hubHintStrength.delete(hubId);
      } else {
        this.hubHintStrength.set(hubId, decayed);
      }
    }
    
    for (const [linkKey, strength] of this.linkHintStrength.entries()) {
      const decayed = strength * Math.pow(this.config.decayRate, deltaTime * 60);
      if (decayed < 0.001) {
        this.linkHintStrength.delete(linkKey);
      } else {
        this.linkHintStrength.set(linkKey, decayed);
      }
    }
  }

  /**
   * Decay hints that are no longer in active pairs
   * @private
   * @param {number} deltaTime - Delta time in seconds
   */
  _decayOrphans(deltaTime) {
    // This is called when active hint count drops
    // Existing orphan hints decay naturally
    this._decayAllHints(deltaTime);
  }

  /**
   * Smooth step function (Hermite interpolation)
   * @private
   * @param {number} t - Value 0-1
   * @returns {number} Smoothly eased value 0-1
   */
  _smoothstep(t) {
    const clamped = Math.max(0, Math.min(1, t));
    // Smoothstep: 3t² - 2t³
    return clamped * clamped * (3 - 2 * clamped);
  }

  /**
   * Get current hint status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      activeHints: this.stats.activeHints,
      affectedHubs: this.stats.affectedHubs,
      affectedLinks: this.stats.affectedLinks,
      avgHintStrength: this.stats.avgHintStrength,
      fieldBreathingPhase: this.fieldBreathingPhase,
    };
  }

  /**
   * Get hint strength for a specific hub
   * @param {string} hubId - Hub ID
   * @returns {number} Hint strength 0-1
   */
  getHubHintStrength(hubId) {
    return this.hubHintStrength.get(hubId) || 0;
  }

  /**
   * Setup console debugging API
   * @param {Object} globalWindow - Window object
   */
  setupConsoleAPI(globalWindow) {
    if (!globalWindow) return;
    
    globalWindow.PRECASCADE_HINT_STATS = this.stats;
    globalWindow.PRECASCADE_HINT_CONFIG = this.config;
    
    globalWindow.togglePreCascadeHintDebug = (enabled = true) => {
      this.config.debugMode = enabled;
      console.log(`[PreCascadeHint] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    };
    
    globalWindow.preCascadeHintStatus = () => {
      const status = this.getStatus();
      console.log('=== PRE-CASCADE VISUAL HINT STATUS ===');
      console.log(`Active hints: ${status.activeHints}`);
      console.log(`Affected hubs: ${status.affectedHubs}`);
      console.log(`Affected links: ${status.affectedLinks}`);
      console.log(`Avg hint strength: ${status.avgHintStrength.toFixed(3)}`);
      console.log(`Field breathing phase: ${status.fieldBreathingPhase.toFixed(2)}`);
      return status;
    };
    
    globalWindow.tune_precascade_hint = (key, value) => {
      if (key in this.config) {
        this.config[key] = value;
        console.log(`[PreCascadeHint] ${key} = ${value}`);
      } else {
        console.warn(`Unknown config key: ${key}`);
      }
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    this.hubHintStrength.clear();
    this.linkHintStrength.clear();
  }
}

/**
 * Console API setup function
 * @param {Object} globalWindow - Window object
 * @param {PreCascadeVisualHint_Session146} hintSystem - Hint system instance
 */
export function setupPreCascadeHintConsoleAPI(globalWindow, hintSystem) {
  if (hintSystem && hintSystem.setupConsoleAPI) {
    hintSystem.setupConsoleAPI(globalWindow);
  }
}
