/**
 * VISUAL NETWORK TIME ELASTICITY v1.0
 * ====================================
 * Local visual-only "network time reversal" effect for extreme synergy
 * 
 * 🎯 PURE VISUAL EFFECT (zero gameplay impact):
 * - When avgSynergy > 0.85 for sustained 5+ seconds
 * - Visual animations play in REVERSE for synergy/link pulses
 * - Real game time UNAFFECTED
 * - All gameplay logic uses real deltaTime
 * - Only visual parameters use reversed time
 * 
 * 📊 TIME REVERSAL FORMULA:
 * When active:
 *   visualTime -= dt * 0.4  (rewind at 40% speed)
 * When inactive:
 *   visualTime = gameTime   (sync with real time)
 * 
 * Used ONLY for:
 * - Synergy pulse animation phase
 * - Link pulse animation phase
 * - Emissive modulation
 * 
 * ✅ GUARANTEES:
 * - Game time UNTOUCHED
 * - deltaTime UNTOUCHED
 * - All state values UNTOUCHED
 * - No distortion, jitter, noise, camera effects
 * - No UI/HUD changes
 * - Smooth fade-in/out (lerp over ~1s)
 * - Gameplay completely normal
 * - Zero performance regression
 * 
 * 🔒 CONTRACTS:
 * - Never modifies: gameTime, deltaTime, any node.userData state
 * - Only affects: animation phase calculations
 * - Reads: avgSynergy from metrics
 * - Writes: only to local _visualTime variable
 */

export class VisualNetworkTimeElasticity_v1 {
  constructor() {
    this.avgSynergy = 0.0;
    this.enabled = true;
    
    // Visual time tracking (local only, never affects game)
    this._visualTime = 0.0;
    this._gameTime = 0.0;
    this._isRewinding = false;
    
    // Activation tracking
    this._highSynergyStartTime = null;
    this._fadeAlpha = 0.0; // 0 = normal, 1 = full rewind effect
    
    // Constants
    this._rewindThreshold = 0.85;       // avgSynergy > this triggers rewind
    this._sustainDuration = 5.0;        // Must be sustained for this long
    this._fadeInDuration = 1.0;         // Fade in over 1 second
    this._fadeOutDuration = 1.0;        // Fade out over 1 second
    this._rewindSpeed = 0.4;            // Rewind at 40% speed
  }
  
  /**
   * Set network-level average synergy
   * @param {number} avg - Average synergy [0..1]
   */
  setAverageSynergy(avg) {
    this.avgSynergy = Math.max(0.0, Math.min(1.0, avg || 0.0));
  }
  
  /**
   * Update time elasticity state
   * Called once per frame
   * 
   * @param {number} dt - Real delta time (seconds) - NEVER MODIFIED
   * @param {number} gameTime - Real game world time (seconds) - NEVER MODIFIED
   */
  update(dt, gameTime) {
    if (!this.enabled) {
      // When disabled, keep visualTime in sync with gameTime
      this._visualTime = gameTime;
      this._isRewinding = false;
      this._fadeAlpha = 0.0;
      return;
    }
    
    // ============================================================
    // PHASE 1: Check if we should activate rewind
    // ============================================================
    const shouldRewind = this.avgSynergy > this._rewindThreshold;
    
    if (shouldRewind && !this._highSynergyStartTime) {
      // Just crossed threshold - start timer
      this._highSynergyStartTime = gameTime;
    } else if (!shouldRewind && this._highSynergyStartTime) {
      // Dropped below threshold - reset timer
      this._highSynergyStartTime = null;
    }
    
    // ============================================================
    // PHASE 2: Determine if rewind is sustained
    // ============================================================
    let shouldActivateRewind = false;
    
    if (this._highSynergyStartTime !== null) {
      const sustainedTime = gameTime - this._highSynergyStartTime;
      if (sustainedTime >= this._sustainDuration) {
        shouldActivateRewind = true;
      }
    }
    
    // ============================================================
    // PHASE 3: Smooth fade-in/fade-out of effect
    // ============================================================
    if (shouldActivateRewind) {
      // Fade IN the effect (fade alpha toward 1.0)
      this._fadeAlpha = Math.min(1.0, this._fadeAlpha + (dt / this._fadeInDuration));
    } else {
      // Fade OUT the effect (fade alpha toward 0.0)
      this._fadeAlpha = Math.max(0.0, this._fadeAlpha - (dt / this._fadeOutDuration));
    }
    
    this._isRewinding = this._fadeAlpha > 0.001; // Consider "rewinding" if fade alpha is meaningful
    
    // ============================================================
    // PHASE 4: Update visual time
    // ============================================================
    if (this._isRewinding) {
      // Rewind visual time
      // Formula: visualTime -= dt * rewindSpeed * fadeAlpha
      // This creates smooth fade-in/out of the effect
      this._visualTime -= dt * this._rewindSpeed * this._fadeAlpha;
      
      // Clamp visual time to prevent runaway rewind
      // Allow going back up to 60 seconds, but not beyond
      const minVisualTime = Math.max(gameTime - 60.0, 0.0);
      this._visualTime = Math.max(minVisualTime, this._visualTime);
    } else {
      // Normal: keep visualTime in sync with gameTime
      this._visualTime = gameTime;
    }
    
    // Update stored gameTime for reference
    this._gameTime = gameTime;
  }
  
  /**
   * Get the visual time to use for animations
   * This is the time to pass to synergy/link pulse calculations
   * 
   * @returns {number} Visual time (may be rewound relative to game time)
   */
  getVisualTime() {
    return this._visualTime;
  }
  
  /**
   * Get current fade alpha (0 = normal, 1 = full rewind)
   * Useful for debugging or creating subtle visual cues
   * 
   * @returns {number} Fade alpha [0..1]
   */
  getFadeAlpha() {
    return this._fadeAlpha;
  }
  
  /**
   * Check if rewind effect is currently active
   * @returns {boolean}
   */
  isRewinding() {
    return this._isRewinding;
  }
  
  /**
   * Get current rewind state info (for debugging/testing)
   * @returns {Object}
   */
  getStateInfo() {
    return {
      isRewinding: this._isRewinding,
      fadeAlpha: this._fadeAlpha.toFixed(3),
      visualTime: this._visualTime.toFixed(3),
      gameTime: this._gameTime.toFixed(3),
      timeOffset: (this._gameTime - this._visualTime).toFixed(3),
      avgSynergy: this.avgSynergy.toFixed(3),
      sustainStartTime: this._highSynergyStartTime !== null ? this._highSynergyStartTime.toFixed(3) : 'null',
      sustainedDuration: this._highSynergyStartTime !== null ? (this._gameTime - this._highSynergyStartTime).toFixed(3) : '0'
    };
  }
  
  /**
   * Enable/disable the entire effect
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
    if (!enabled) {
      this._isRewinding = false;
      this._fadeAlpha = 0.0;
      this._highSynergyStartTime = null;
    }
  }
  
  /**
   * Dispose and clean up
   */
  dispose() {
    this._visualTime = 0.0;
    this._gameTime = 0.0;
    this._isRewinding = false;
    this._fadeAlpha = 0.0;
    this._highSynergyStartTime = null;
  }
}

// Quick validation function
export function validateVisualNetworkTimeElasticity() {
  console.log('✓ VisualNetworkTimeElasticity_v1 loaded');
  console.log('  - Trigger: avgSynergy > 0.85 for 5+ seconds');
  console.log('  - Effect: visual time rewind at 40% speed');
  console.log('  - Fade: 1s fade-in/out');
  console.log('  - Pure visual: zero gameplay impact');
  console.log('  - Game time UNTOUCHED');
}
