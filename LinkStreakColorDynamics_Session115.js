import * as THREE from 'three';

/**
 * Link Directional Streak Color Dynamics (Session 115)
 * ============================================================================
 * Dynamic color modulation for link streaks based on harmony and specialization.
 * 
 * VISUAL ENCODING:
 * - Harmony: Controls saturation and brightness (harmonious = vivid, discordant = washed out)
 * - Specialization: Controls hue shifts (excitatory = warm, inhibitory = cool)
 * - Corruption: Desaturation and color noise
 * - Synergy: Intensity and color confidence
 * 
 * DESIGN PHILOSOPHY:
 * - Colors tell a story about link state
 * - No magic numbers (all values configurable)
 * - Smooth transitions (no snapping)
 * - Pure visual feedback (no gameplay changes)
 */

export class LinkStreakColorDynamics {
  constructor(config = {}) {
    this.config = {
      // Harmony-driven dynamics
      harmonyBrightnessMin: config.harmonyBrightnessMin ?? 0.3,
      harmonyBrightnessMax: config.harmonyBrightnessMax ?? 1.0,
      harmonySaturationMin: config.harmonySaturationMin ?? 0.2,
      harmonySaturationMax: config.harmonySaturationMax ?? 1.0,
      
      // Specialization-driven hue shifts
      excitatoryCoolness: config.excitatoryCoolness ?? 0.15,  // Red/yellow tint
      inhibitoryCoolness: config.inhibitoryCoolness ?? -0.25, // Blue/cyan tint
      
      // Corruption dynamics
      corruptionDesaturation: config.corruptionDesaturation ?? 0.5,
      corruptionNoiseIntensity: config.corruptionNoiseIntensity ?? 0.1,
      
      // Synergy dynamics
      synergyIntensityMin: config.synergyIntensityMin ?? 0.4,
      synergyIntensityMax: config.synergyIntensityMax ?? 1.0,
      
      // Color confidence (affects how strongly colors are expressed)
      colorConfidenceMin: config.colorConfidenceMin ?? 0.1,
      colorConfidenceMax: config.colorConfidenceMax ?? 1.0,
      
      // Enable/disable
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false
    };
    
    // Reusable color objects (avoid allocations)
    this._hsl = {};
    this._workColor = new THREE.Color();
    this._baseHSL = {};
    this._finalHSL = {};
  }

  /**
   * Compute dynamic streak color based on all state factors
   * 
   * @param {THREE.Color} baseColor - Base streak color
   * {number} harmony - Link harmony (0-1)
   * @param {number} specialization - Link specialization bias (-1 to +1)
   * @param {number} corruption - Corruption level (0-1)
   * @param {number} synergy - Synergy level (0-1)
   * @returns {THREE.Color} Computed dynamic color
   */
  computeStreakColor(baseColor, harmony = 1.0, specialization = 0, corruption = 0, synergy = 0.5) {
    if (!this.config.enabled || !baseColor) {
      return baseColor || new THREE.Color(0x00ff88);
    }

    // Start with base color (convert to HSL for manipulation)
    this._workColor.copy(baseColor);
    this._workColor.getHSL(this._hsl);

    // === HARMONY DYNAMICS ===
    // Harmony controls saturation and brightness
    const harmonyBrightness = this.config.harmonyBrightnessMin + 
      (harmony * (this.config.harmonyBrightnessMax - this.config.harmonyBrightnessMin));
    
    const harmonySaturation = this.config.harmonySaturationMin + 
      (harmony * (this.config.harmonySaturationMax - this.config.harmonySaturationMin));

    // === SPECIALIZATION HUE DYNAMICS ===
    // Excitatory nodes: warm shift (increase hue toward red/yellow)
    // Inhibitory nodes: cool shift (decrease hue toward blue/cyan)
    let hueShift = 0;
    if (specialization > 0) {
      // Excitatory: warm (red/yellow)
      hueShift = specialization * this.config.excitatoryCoolness;
    } else {
      // Inhibitory: cool (blue/cyan)
      hueShift = specialization * this.config.inhibitoryCoolness;
    }

    // === CORRUPTION DESATURATION ===
    // Corruption reduces color purity
    const corruptionFactor = Math.max(0, 1.0 - (corruption * this.config.corruptionDesaturation));

    // === SYNERGY INTENSITY ===
    // Synergy drives overall intensity
    const synergyIntensity = this.config.synergyIntensityMin + 
      (synergy * (this.config.synergyIntensityMax - this.config.synergyIntensityMin));

    // === COMPUTE FINAL HSL ===
    const finalH = (this._hsl.h + hueShift) % 1.0; // Hue wraps 0-1
    const finalS = this._hsl.s * harmonySaturation * corruptionFactor;
    const finalL = harmonyBrightness * synergyIntensity;

    // Convert back to RGB
    this._workColor.setHSL(finalH, finalS, finalL);

    if (this.config.debugMode) {
      console.log('[LinkStreakColorDynamics] Color computation:', {
        baseH: this._hsl.h, baseSat: this._hsl.s, baseL: this._hsl.l,
        harmony, specialization, corruption, synergy,
        hueShift, harmonySaturation, finalS, finalL,
        finalColor: this._workColor.getHexString()
      });
    }

    return this._workColor;
  }

  /**
   * Apply color dynamics to streak material
   * Updates both color and emissive properties
   * 
   * @param {THREE.Material} material - Streak material
   * @param {THREE.Color} baseColor - Base streak color
   * @param {number} harmony - Link harmony (0-1)
   * @param {number} specialization - Link specialization bias (-1 to +1)
   * @param {number} corruption - Corruption level (0-1)
   * @param {number} synergy - Synergy level (0-1)
   * @param {number} emissiveIntensity - Base emissive intensity
   */
  updateMaterialColors(material, baseColor, harmony = 1.0, specialization = 0, corruption = 0, synergy = 0.5, emissiveIntensity = 0.8) {
    if (!this.config.enabled) return;

    // Compute dynamic color
    const dynamicColor = this.computeStreakColor(baseColor, harmony, specialization, corruption, synergy);

    // Apply to material
    material.color.copy(dynamicColor);
    material.emissive.copy(dynamicColor);

    // Emissive intensity also responds to harmony and synergy
    const harmonyFactor = 0.5 + (harmony * 0.5); // 0.5-1.0
    const synergyFactor = 0.5 + (synergy * 0.5);  // 0.5-1.0
    const corruptionDamp = Math.max(0.2, 1.0 - (corruption * 0.6)); // Min 0.2, reduces with corruption

    material.emissiveIntensity = emissiveIntensity * harmonyFactor * synergyFactor * corruptionDamp;
  }

  /**
   * Compute color confidence (how strongly colors are expressed)
   * Based on harmony and specialization clarity
   * 
   * @param {number} harmony - Link harmony (0-1)
   * @param {number} specialization - Link specialization bias (-1 to +1)
   * @returns {number} Color confidence (0-1)
   */
  computeColorConfidence(harmony, specialization) {
    // Harmony stabilizes color expression
    const harmonyConfidence = harmony * 0.5; // 0-0.5 contribution
    
    // Strong specialization (far from 0) increases confidence
    const specializationClarity = Math.abs(specialization);
    const specializationConfidence = specializationClarity * 0.5; // 0-0.5 contribution
    
    const baseConfidence = harmonyConfidence + specializationConfidence;
    return Math.max(this.config.colorConfidenceMin, Math.min(this.config.colorConfidenceMax, baseConfidence));
  }

  /**
   * Get color description for debugging
   * 
   * @param {number} harmony - Link harmony (0-1)
   * @param {number} specialization - Link specialization bias (-1 to +1)
   * @returns {string} Human-readable color description
   */
  getColorDescription(harmony, specialization) {
    let harmonyDesc = '';
    if (harmony > 0.7) harmonyDesc = 'Vivid';
    else if (harmony > 0.4) harmonyDesc = 'Moderate';
    else harmonyDesc = 'Washed';

    let specializationDesc = '';
    if (specialization > 0.3) specializationDesc = 'Excitatory (warm)';
    else if (specialization < -0.3) specializationDesc = 'Inhibitory (cool)';
    else specializationDesc = 'Neutral';

    return `${harmonyDesc} ${specializationDesc}`;
  }

  /**
   * Get recommended base color for link based on specialization
   * Useful for initial link color assignment
   * 
   * @param {number} specialization - Link specialization bias (-1 to +1)
   * @returns {THREE.Color} Recommended base color
   */
  getRecommendedColor(specialization) {
    if (specialization > 0.3) {
      // Excitatory: warm (red/yellow)
      return new THREE.Color(0xff6600); // Orange
    } else if (specialization < -0.3) {
      // Inhibitory: cool (blue/cyan)
      return new THREE.Color(0x00aaff); // Cyan
    } else {
      // Neutral: green (default)
      return new THREE.Color(0x00ff88); // Green
    }
  }

  /**
   * Apply color transition (smooth fade to new color values)
   * For state changes that should be animated
   * 
   * @param {THREE.Color} fromColor - Starting color
   * @param {THREE.Color} toColor - Target color
   * @param {number} transitionProgress - 0-1 blend factor
   * @returns {THREE.Color} Interpolated color
   */
  transitionColor(fromColor, toColor, transitionProgress) {
    const result = new THREE.Color();
    result.lerpColors(fromColor, toColor, transitionProgress);
    return result;
  }

  /**
   * Enable/disable color dynamics
   * 
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
  }

  /**
   * Set debug mode
   * 
   * @param {boolean} debugMode
   */
  setDebugMode(debugMode) {
    this.config.debugMode = debugMode;
  }

  /**
   * Get current configuration
   * 
   * @returns {Object} Configuration object
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   * 
   * @param {Object} updates - Partial config updates
   */
  updateConfig(updates) {
    Object.assign(this.config, updates);
  }
}

export default LinkStreakColorDynamics;
