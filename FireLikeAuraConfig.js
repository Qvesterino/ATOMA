/**
 * FireLikeAuraConfig.js
 * ============================================================================
 * FIRE-LIKE MORPHING AURA CONFIGURATION
 * 
 * Transforms node auras from amorphous noise into structured, intelligent
 * energy flames that morph organically around link connections.
 * 
 * Design Principles:
 * - Aura is contained energy, not random turbulence
 * - Flames flow directionally (toward links, upward)
 * - Morphing cycles are slow and meaningful (2-4 seconds)
 * - Harmony = smoother, slower breathing
 * - Corruption = sharper folds, faster morphing
 * - No particles, textures, or bloom
 * - Pure shader deformation using existing noise
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

/**
 * FIRE-LIKE AURA MORPHING CONFIGURATION
 */
export const FireLikeAuraConfig = {
  /**
   * DIRECTIONAL FLAME FLOW
   * How much to bias noise calculation toward directional flow
   */
  
  /**
   * Base flame flow speed (units per second along flow direction)
   * Higher = faster flame morphing
   * @type {number}
   */
  flowSpeed: 0.8,

  /**
   * Flow direction bias strength
   * How much to apply directional bias to noise calculation
   * Range: 0.0 (isotropic) to 1.0 (fully directional)
   * @type {number}
   */
  directionBias: 0.6,

  /**
   * FLAME TONGUE SHAPING
   * Ridge/fold biasing to create flame-like structures
   */

  /**
   * Ridge detection threshold
   * How sharp the ridges need to be to show displacement
   * Range: 0.0 (all displacements) to 1.0 (only sharp ridges)
   * @type {number}
   */
  ridgeThreshold: 0.3,

  /**
   * Ridge smoothing range
   * Smoothstep range for ridge detection
   * @type {Object}
   */
  ridgeSmoothRange: {
    low: 0.3,
    high: 0.9,
  },

  /**
   * Ridge amplitude boost
   * How much to amplify displacement at ridges
   * 1.0 = normal, 1.5 = 50% stronger at ridges
   * @type {number}
   */
  ridgeAmplification: 1.35,

  /**
   * TEMPORAL MORPHING BEHAVIOR
   */

  /**
   * Base morphing cycle duration (seconds)
   * Slow = peaceful, Fast = chaotic
   * @type {number}
   */
  morphingCycle: 3.0,

  /**
   * Harmony morphing dampening
   * Harmony → slower, smoother morphing
   * Formula: actualCycle = baseCycle * mix(1.0, dampFactor, harmony)
   * @type {number}
   */
  harmonyMorphDampen: 1.5,

  /**
   * Corruption morphing acceleration
   * Corruption → faster, sharper morphing
   * Formula: actualCycle = baseCycle / mix(1.0, accelFactor, corruption)
   * @type {number}
   */
  corruptionMorphAccel: 1.3,

  /**
   * LINK-AURA CONTINUITY
   * How flame folds bend toward link connections
   */

  /**
   * Link influence strength
   * How much flame bends toward link connection point
   * Range: 0.0 (no influence) to 1.0 (strong bending)
   * @type {number}
   */
  linkInfluenceStrength: 0.25,

  /**
   * Link pull amplitude
   * How much additional displacement at link connection
   * @type {number}
   */
  linkPullAmplitude: 0.15,

  /**
   * AMPLITUDE MODULATION
   */

  /**
   * Base displacement multiplier for flame deformation
   * Applied to noise before ridge shaping
   * @type {number}
   */
  baseAmplitude: 1.1,

  /**
   * Harmony amplitude reduction
   * Higher harmony = smoother, reduced displacement
   * @type {number}
   */
  harmonyAmplitudeDampen: 0.75,

  /**
   * Corruption amplitude boost
   * Higher corruption = sharper, more extreme folds
   * @type {number}
   */
  corruptionAmplitudeBoost: 1.25,

  /**
   * FLAME BREATHING (SLOW OSCILLATION)
   */

  /**
   * Breathing frequency (cycles per second)
   * Very slow, subtle rise and fall
   * @type {number}
   */
  breathingFrequency: 0.3,

  /**
   * Breathing amplitude
   * How much the entire flame "breathes" in/out
   * @type {number}
   */
  breathingAmplitude: 0.08,

  /**
   * Breathing harmony influence
   * Higher harmony = more pronounced breathing
   * @type {number}
   */
  breathingHarmonyBoost: 1.5,

  /**
   * Calculate actual morphing cycle based on state
   * @param {number} harmony [0-1]
   * @param {number} corruption [0-1]
   * @returns {number} Duration in seconds
   */
  getActualMorphingCycle(harmony = 0.5, corruption = 0.2) {
    let cycle = this.morphingCycle;

    // Harmony slows morphing (more peaceful)
    cycle *= mix(1.0, this.harmonyMorphDampen, harmony);

    // Corruption speeds morphing (more chaotic)
    cycle /= mix(1.0, this.corruptionMorphAccel, corruption);

    return Math.max(0.5, Math.min(6.0, cycle)); // Clamp between 0.5-6.0 seconds
  },

  /**
   * Calculate actual amplitude based on state
   * @param {number} harmony [0-1]
   * @param {number} corruption [0-1]
   * @returns {number} Amplitude multiplier
   */
  getActualAmplitude(harmony = 0.5, corruption = 0.2) {
    let amplitude = this.baseAmplitude;

    // Harmony reduces amplitude (smoother)
    amplitude *= mix(1.0, this.harmonyAmplitudeDampen, harmony);

    // Corruption increases amplitude (sharper)
    amplitude *= mix(1.0, this.corruptionAmplitudeBoost, corruption);

    return amplitude;
  },

  /**
   * Get ridge detection range based on corruption
   * Higher corruption = more extreme ridges
   * @param {number} corruption [0-1]
   * @returns {Object} { low, high } smoothstep range
   */
  getRidgeRange(corruption = 0.2) {
    // Corruption makes ridges sharper (narrower range)
    const sharpening = corruption * 0.3;
    return {
      low: Math.max(0.1, this.ridgeSmoothRange.low - sharpening),
      high: Math.min(1.0, this.ridgeSmoothRange.high - sharpening * 0.5),
    };
  },

  /**
   * Describe configuration for debugging
   */
  describe() {
    return `
FireLikeAuraConfig - Morphing Energy Flame Aura
================================================

DIRECTIONAL FLAME FLOW:
  Flow Speed: ${this.flowSpeed} units/sec
  Direction Bias: ${(this.directionBias * 100).toFixed(0)}%
  Effect: Noise flows along flame direction, creating organic folds

FLAME TONGUE SHAPING:
  Ridge Threshold: ${(this.ridgeThreshold * 100).toFixed(0)}%
  Ridge Smooth Range: ${this.ridgeSmoothRange.low} - ${this.ridgeSmoothRange.high}
  Ridge Amplification: ${this.ridgeAmplification.toFixed(2)}x
  Effect: Clear flame-like structures, no amorphous blob

TEMPORAL MORPHING:
  Base Cycle: ${this.morphingCycle}s
  Harmony Dampen: ${this.harmonyMorphDampen.toFixed(2)}x (slower)
  Corruption Accel: ${this.corruptionMorphAccel.toFixed(2)}x (faster)
  Result Range: 0.5s (chaotic) to 6.0s (peaceful)

LINK-AURA CONTINUITY:
  Link Influence: ${(this.linkInfluenceStrength * 100).toFixed(0)}%
  Link Pull Amplitude: ${this.linkPullAmplitude}
  Effect: Flame folds bend toward link entry point

AMPLITUDE MODULATION:
  Base: ${this.baseAmplitude.toFixed(2)}x
  Harmony Dampen: ${(this.harmonyAmplitudeDampen * 100).toFixed(0)}%
  Corruption Boost: ${(this.corruptionAmplitudeBoost * 100).toFixed(0)}%

FLAME BREATHING:
  Frequency: ${this.breathingFrequency} cycles/sec
  Amplitude: ±${this.breathingAmplitude}
  Harmony Boost: ${this.breathingHarmonyBoost.toFixed(2)}x

RESULT:
  Aura reads as contained energy flames
  Morphs slowly and meaningfully (2-6 seconds per cycle)
  Harmony = smooth, breathing, gentle folds
  Corruption = sharp, jagged, aggressive morphing
  Links feel like they're pulling energy in
    `;
  },
};

/**
 * Simple linear interpolation (GLSL-like mix function)
 */
function mix(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export default FireLikeAuraConfig;
