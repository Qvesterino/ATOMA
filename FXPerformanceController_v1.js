/**
 * ============================================================================
 * FX PERFORMANCE CONTROLLER v1.0 – Phase 3c Performance Mode
 * ============================================================================
 * Centralized controller for global performance mode (LowFX ON/OFF).
 * 
 * PURPOSE:
 * - Provides unified interface for toggling Performance Mode
 * - Manages multiplier values for all Phase 3c personality effects
 * - Non-invasive (reads/writes only, never modifies systems)
 * - Reversible (instant toggle without reinitializing shaders)
 * - Future-proof (ready for Weeks 1–5 and beyond)
 * 
 * RESPONSIBILITY:
 * - Maintain two multiplier sets (full quality vs low FX)
 * - Switch between sets when setLowFX() called
 * - Provide getMultiplier() for scaler layer
 * - Track current state (isLowFX())
 * - Be stateless and thread-safe
 * 
 * SIGNALS AFFECTED (when LowFX ON):
 * - clarityBoost:     1.0 → 0.4 (60% reduction)
 * - resonanceBoost:   1.0 → 0.4 (60% reduction)
 * - entropyPenalty:   1.0 → 0.2 (80% reduction)
 * - focusShift:       1.0 → 0.3 (70% reduction)
 * - corruptionSignal: 1.0 → 0.5 (50% reduction)
 * 
 * VFX/SHADER EFFECTS (when LowFX ON):
 * - vfxIntensity:     1.0 → 0.3 (70% reduction)
 * - shaderIntensity:  1.0 → 0.25 (75% reduction)
 * 
 * INTEGRATION:
 * const perfCtrl = new FXPerformanceController_v1(options);
 * 
 * // Toggle performance mode
 * perfCtrl.setLowFX(true);   // Activate low FX
 * perfCtrl.setLowFX(false);  // Restore full quality
 * 
 * // Query current multipliers
 * const clarityMult = perfCtrl.getMultiplier('clarity');
 * 
 * // Check state
 * if (perfCtrl.isLowFX()) { ... }
 * 
 * SAFETY:
 * - Stateless (no persistent side effects)
 * - Reversible (instantly toggle any time)
 * - Non-invasive (never modifies other systems)
 * - Zero dependencies (standalone)
 * - Safe defaults (1.0 multiplier for unknown keys)
 * 
 * ============================================================================
 */

export class FXPerformanceController_v1 {
  /**
   * Initialize the performance controller
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Current state: LowFX mode ON/OFF
    this.lowFX = options.lowFXInitial ?? false;

    // Current active multipliers (default 1.0 = full quality)
    this.multipliers = {
      clarity: 1.0,
      resonance: 1.0,
      entropy: 1.0,
      focus: 1.0,
      corruption: 1.0,
      vfxIntensity: 1.0,
      shaderIntensity: 1.0,
    };

    // Reduced values for Performance Mode (LowFX ON)
    // These are the target multipliers when low FX mode is activated
    this.lowFXMultipliers = {
      clarity: options.clarityLowFX ?? 0.4,          // 60% reduction
      resonance: options.resonanceLowFX ?? 0.4,      // 60% reduction
      entropy: options.entropyLowFX ?? 0.2,          // 80% reduction
      focus: options.focusLowFX ?? 0.3,              // 70% reduction
      corruption: options.corruptionLowFX ?? 0.5,    // 50% reduction
      vfxIntensity: options.vfxIntensityLowFX ?? 0.3,  // 70% reduction
      shaderIntensity: options.shaderIntensityLowFX ?? 0.25, // 75% reduction
    };

    // Full quality multipliers (all 1.0)
    this.fullQualityMultipliers = {
      clarity: 1.0,
      resonance: 1.0,
      entropy: 1.0,
      focus: 1.0,
      corruption: 1.0,
      vfxIntensity: 1.0,
      shaderIntensity: 1.0,
    };

    // Configuration
    this.config = {
      enableDebug: options.enableDebug ?? false,
      enableWarnings: options.enableWarnings ?? false,
    };

    // Statistics
    this.stats = {
      toggleCount: 0,
      lastToggleTime: 0,
    };

    // Initialize multipliers based on initial state
    this._applyState();
  }

  /**
   * Toggle LowFX mode on/off
   * @param {boolean} state - true for LowFX ON, false for full quality
   */
  setLowFX(state) {
    if (this.lowFX === state) {
      if (this.config.enableDebug) {
        console.log('[FXPerformanceController] Already in requested state, skipping');
      }
      return;
    }

    this.lowFX = state;
    this._applyState();

    this.stats.toggleCount++;
    this.stats.lastToggleTime = Date.now();

    if (this.config.enableDebug) {
      console.log(`[FXPerformanceController] LowFX Mode: ${state ? 'ON' : 'OFF'}`);
      console.log('[FXPerformanceController] Active multipliers:', this.multipliers);
    }
  }

  /**
   * Get current LowFX state
   * @returns {boolean} true if LowFX mode is ON
   */
  isLowFX() {
    return this.lowFX;
  }

  /**
   * Get multiplier for a specific signal/effect
   * @param {string} key - Signal key (clarity, resonance, entropy, focus, corruption, vfxIntensity, shaderIntensity)
   * @returns {number} Multiplier value (0–1)
   */
  getMultiplier(key) {
    const value = this.multipliers[key];
    if (value === undefined) {
      if (this.config.enableWarnings) {
        console.warn(`[FXPerformanceController] Unknown multiplier key: ${key}, returning 1.0`);
      }
      return 1.0;
    }
    return value;
  }

  /**
   * Get all current multipliers
   * @returns {Object} Current multiplier set
   */
  getAllMultipliers() {
    return { ...this.multipliers };
  }

  /**
   * Directly set custom multiplier values
   * @param {Object} customMultipliers - Custom multiplier overrides
   */
  setCustomMultipliers(customMultipliers) {
    if (typeof customMultipliers !== 'object' || customMultipliers === null) {
      if (this.config.enableWarnings) {
        console.warn('[FXPerformanceController] Invalid multiplier object');
      }
      return false;
    }

    // Merge custom values into current multipliers
    for (const [key, value] of Object.entries(customMultipliers)) {
      if (typeof value === 'number' && value >= 0 && value <= 1) {
        this.multipliers[key] = value;
      } else if (this.config.enableWarnings) {
        console.warn(`[FXPerformanceController] Invalid multiplier value for ${key}: ${value}`);
      }
    }

    if (this.config.enableDebug) {
      console.log('[FXPerformanceController] Custom multipliers applied:', this.multipliers);
    }

    return true;
  }

  /**
   * Reset to LowFX defaults
   */
  resetLowFXDefaults() {
    this.lowFXMultipliers = {
      clarity: 0.4,
      resonance: 0.4,
      entropy: 0.2,
      focus: 0.3,
      corruption: 0.5,
      vfxIntensity: 0.3,
      shaderIntensity: 0.25,
    };

    if (this.lowFX) {
      this._applyState();
    }

    if (this.config.enableDebug) {
      console.log('[FXPerformanceController] LowFX defaults reset');
    }
  }

  /**
   * Reset to full quality defaults
   */
  resetFullQualityDefaults() {
    this.fullQualityMultipliers = {
      clarity: 1.0,
      resonance: 1.0,
      entropy: 1.0,
      focus: 1.0,
      corruption: 1.0,
      vfxIntensity: 1.0,
      shaderIntensity: 1.0,
    };

    if (!this.lowFX) {
      this._applyState();
    }

    if (this.config.enableDebug) {
      console.log('[FXPerformanceController] Full quality defaults reset');
    }
  }

  /**
   * Get debug information
   * @returns {Object} Debug stats and current state
   */
  getDebugInfo() {
    return {
      lowFXEnabled: this.lowFX,
      currentMultipliers: this.multipliers,
      lowFXMultipliers: this.lowFXMultipliers,
      fullQualityMultipliers: this.fullQualityMultipliers,
      stats: this.stats,
    };
  }

  /**
   * Log debug information to console
   */
  logDebugInfo() {
    console.log('[FXPerformanceController] Debug Info:', this.getDebugInfo());
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Apply current state (LowFX ON/OFF) to multipliers
   * @private
   */
  _applyState() {
    if (this.lowFX) {
      this.multipliers = { ...this.lowFXMultipliers };
    } else {
      this.multipliers = { ...this.fullQualityMultipliers };
    }
  }
}
