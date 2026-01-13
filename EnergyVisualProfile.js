/**
 * EnergyVisualProfile.js
 * ============================================================================
 * UNIFIED VISUAL DEFINITION FOR ENERGY AURAS
 * 
 * Single source of truth for all visual parameters used by:
 * - Node Aura Shader
 * - Link Aura Shader
 * - Trail Particle System
 * - Healing Particle System
 * 
 * Design Principle:
 * Energy in Atoma is ONE MEDIUM. Nodes are fields. Links are flows within
 * the same field. A unified profile ensures the viewer never sees
 * "two different visual systems pretending to be one."
 * 
 * This module provides:
 * - Shared color & opacity definitions
 * - Unified noise parameters (scale, octaves, timing)
 * - Temporal rhythm (pulses, easing, oscillation)
 * - State modulation helpers (harmony, corruption)
 * - Per-system attenuation factors
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

/**
 * UNIFIED ENERGY VISUAL PROFILE
 * ============================================================================
 * All parameters shared across node aura, link aura, and particle systems.
 * Immutable by design - all functions return new values, never mutate.
 */
export const EnergyVisualProfile = {
  // ========================================================================
  // COLOR & OPACITY BASE
  // ========================================================================
  
  /**
   * Base color for all energy auras: neutral gray-white
   * @type {number[]} RGB [0-1]
   */
  baseColor: [0.85, 0.85, 0.9],
  
  /**
   * Base opacity for node aura (link aura uses reduced multiplier)
   * @type {number} [0-1]
   */
  baseOpacity: 0.25,
  
  /**
   * Opacity for link aura: 60% of node opacity
   * @type {number} [0-1]
   */
  linkOpacityMultiplier: 0.6,
  
  /**
   * Hard cap on link opacity (prevents visual hierarchy inversion)
   * @type {number} [0-1]
   */
  linkOpacityCap: 0.16,
  
  // ========================================================================
  // HARMONY INFLUENCE (brightening, smoothing)
  // ========================================================================
  
  /**
   * Harmony target color: brighter, smoother white
   * @type {number[]} RGB [0-1]
   */
  harmonyColor: [0.8, 0.8, 0.88],
  
  /**
   * Harmony color blend strength
   * @type {number} [0-1]
   */
  harmonyBlendStrength: 0.3,
  
  /**
   * Harmony motion dampen: reduces vertex displacement
   * Harmony smooth motion = mix(1.0, 0.6, uHarmony)
   * @type {number} [0-1]
   */
  harmonyMotionDampen: 0.6,
  
  // ========================================================================
  // CORRUPTION INFLUENCE (reddening, roughening)
  // ========================================================================
  
  /**
   * Corruption red-tint color
   * @type {number[]} RGB [0-1]
   */
  corruptionColor: [1.0, 0.4, 0.4],
  
  /**
   * Corruption node blend strength (higher = more red tint)
   * @type {number} [0-1]
   */
  corruptionNodeBlend: 0.4,
  
  /**
   * Corruption link blend strength (lower than node for hierarchy)
   * @type {number} [0-1]
   */
  corruptionLinkBlend: 0.3,
  
  /**
   * Corruption motion enhance: increases vertex displacement (node aura)
   * Corruption rough motion = mix(1.0, 1.4, uCorruption)
   * @type {number} [0-1]
   */
  corruptionMotionEnhanceNode: 1.4,
  
  /**
   * Corruption motion enhance (link aura - slightly less)
   * @type {number} [0-1]
   */
  corruptionMotionEnhanceLink: 1.2,
  
  // ========================================================================
  // DESATURATION (corruption progression)
  // ========================================================================
  
  /**
   * Corrupted gray shift (grayscale + sickly yellow-gray blend)
   * @type {number[]} RGB offset from grayscale
   */
  corruptedGrayShift: [0.15, 0.1, -0.05],
  
  /**
   * Desaturation threshold for shifting to sickly color
   * @type {number} [0-1]
   */
  desaturationColorShiftThreshold: 0.5,
  
  // ========================================================================
  // NOISE & DEFORMATION (shared across all systems)
  // ========================================================================
  
  /**
   * Base noise scale for Simplex evaluation
   * @type {number}
   */
  noiseScale: 2.0,
  
  /**
   * Octave frequencies: [base, 2x, 4x]
   * Applied in shader: snoise(pos * 2), snoise(pos * 4), snoise(pos * 8)
   * @type {number[]}
   */
  noiseOctaves: [2.0, 4.0, 8.0],
  
  /**
   * Octave weights: mix(o1, o2*0.5, o3*0.25) / 1.75
   * @type {number[]}
   */
  noiseOctaveWeights: [1.0, 0.5, 0.25],
  
  /**
   * Noise denominator for octave blending
   * Result = (o1*w1 + o2*w2 + o3*w3) / denominator
   * @type {number}
   */
  noiseOctaveDenominator: 1.75,
  
  /**
   * Base displacement for node aura vertices
   * @type {number}
   */
  baseDisplacement: 0.3,
  
  /**
   * Link aura displacement multiplier: 60% of node
   * @type {number} [0-1]
   */
  linkDisplacementMultiplier: 0.5,  // 0.3 * 0.5 = 0.15
  
  // ========================================================================
  // TEMPORAL RHYTHM
  // ========================================================================
  
  /**
   * Time scale for noise position evolution
   * @type {number}
   */
  noiseTimeScale: 0.3,
  
  /**
   * Global time scale factor (controls animation speed)
   * @type {number}
   */
  globalTimeScale: 0.5,
  
  /**
   * Wave oscillation period (sine wave frequency multiplier)
   * @type {number}
   */
  waveOscillationFrequency: 2.0,
  
  /**
   * Wave oscillation amplitude
   * @type {number}
   */
  waveOscillationAmplitude: 0.15,
  
  // ========================================================================
  // RIM LIGHTING
  // ========================================================================
  
  /**
   * Rim light color for node aura
   * @type {number[]} RGB [0-1]
   */
  rimLightColor: [0.15, 0.15, 0.15],
  
  /**
   * Rim light intensity for link aura (reduced from node)
   * @type {number[]} RGB [0-1]
   */
  rimLightColorLink: [0.12, 0.12, 0.12],
  
  /**
   * Rim light corruption desaturation multiplier
   * Higher corruption → less rim light
   * @type {number} [0-1]
   */
  rimLightDesaturationInfluence: 0.4,
  
  // ========================================================================
  // LINK BIRTH & REMOVAL ANIMATIONS
  // ========================================================================
  
  /**
   * Node aura birth expansion amplitude
   * @type {number}
   */
  birthExpansionAmplitude: 0.35,
  
  /**
   * Link aura birth expansion amplitude (60% of node)
   * @type {number}
   */
  birthExpansionAmplitudeLink: 0.2,
  
  /**
   * Birth ripple amplitude
   * @type {number}
   */
  birthRippleAmplitude: 0.15,
  
  /**
   * Link aura birth ripple amplitude
   * @type {number}
   */
  birthRippleAmplitudeLink: 0.08,
  
  /**
   * Node aura removal contraction amplitude (negative = inward)
   * @type {number}
   */
  removalContractionAmplitude: -0.4,
  
  /**
   * Link aura removal contraction amplitude
   * @type {number}
   */
  removalContractionAmplitudeLink: -0.15,
  
  /**
   * Removal dissipation ripple amplitude
   * @type {number}
   */
  removalDissipationAmplitude: 0.12,
  
  /**
   * Link aura removal dissipation amplitude
   * @type {number}
   */
  removalDissipationAmplitudeLink: 0.06,
  
  // ========================================================================
  // HINT SYSTEM (cascade detection)
  // ========================================================================
  
  /**
   * Hint brightening amount
   * @type {number}
   */
  hintBrighteningAmount: 0.05,
  
  /**
   * Hint brightening influence
   * @type {number}
   */
  hintBrighteningInfluence: 0.3,
  
  /**
   * Hint compression strength (reduces displacement randomness)
   * @type {number} [0-1]
   */
  hintCompressionStrength: 0.6,
};

/**
 * HELPER FUNCTIONS - STATE MODULATION
 * ============================================================================
 * Pure functions that apply harmony/corruption to visual parameters.
 * All functions return new values; never mutate inputs.
 */

/**
 * Apply harmony state to motion parameters
 * Harmony smooths vertex displacement motion
 * 
 * @param {number} harmonyLevel [0-1] where 1.0 = full harmony
 * @returns {number} Motion dampen factor
 */
export function applyHarmonyMotion(harmonyLevel) {
  return mix(1.0, EnergyVisualProfile.harmonyMotionDampen, harmonyLevel);
}

/**
 * Apply corruption state to motion parameters
 * Corruption roughens vertex displacement motion
 * 
 * @param {number} corruptionLevel [0-1] where 1.0 = full corruption
 * @param {boolean} isLink If true, use link-specific enhancement
 * @returns {number} Motion enhancement factor
 */
export function applyCorruptionMotion(corruptionLevel, isLink = false) {
  const enhanceAmount = isLink
    ? EnergyVisualProfile.corruptionMotionEnhanceLink
    : EnergyVisualProfile.corruptionMotionEnhanceNode;
  return mix(1.0, enhanceAmount, corruptionLevel);
}

/**
 * Calculate color blend for corruption influence
 * Progressive red tint based on corruption level
 * 
 * @param {number[]} baseColor Starting color [r, g, b]
 * @param {number} corruptionLevel [0-1]
 * @param {boolean} isLink If true, use link blend strength
 * @returns {number[]} Blended color [r, g, b]
 */
export function applyCorruptionColor(baseColor, corruptionLevel, isLink = false) {
  const blendStrength = isLink
    ? EnergyVisualProfile.corruptionLinkBlend
    : EnergyVisualProfile.corruptionNodeBlend;
  
  const corruptionTint = EnergyVisualProfile.corruptionColor;
  
  return [
    mix(baseColor[0], corruptionTint[0], corruptionLevel * blendStrength),
    mix(baseColor[1], corruptionTint[1], corruptionLevel * blendStrength),
    mix(baseColor[2], corruptionTint[2], corruptionLevel * blendStrength),
  ];
}

/**
 * Apply harmony color influence (brightening)
 * Progressive brightening toward harmony white
 * 
 * @param {number[]} baseColor Starting color [r, g, b]
 * @param {number} harmonyLevel [0-1]
 * @returns {number[]} Blended color [r, g, b]
 */
export function applyHarmonyColor(baseColor, harmonyLevel) {
  const harmonyTint = EnergyVisualProfile.harmonyColor;
  const blendStrength = EnergyVisualProfile.harmonyBlendStrength;
  
  return [
    mix(baseColor[0], harmonyTint[0], harmonyLevel * blendStrength),
    mix(baseColor[1], harmonyTint[1], harmonyLevel * blendStrength),
    mix(baseColor[2], harmonyTint[2], harmonyLevel * blendStrength),
  ];
}

/**
 * Calculate opacity for node aura
 * 
 * @param {number} rimFactor [0-1] Rim lighting contribution
 * @param {number} displacementFactor [0-1] Vertex displacement contribution
 * @returns {number} Final opacity [0-1]
 */
export function calculateNodeOpacity(rimFactor, displacementFactor) {
  const baseOpacity = EnergyVisualProfile.baseOpacity;
  let opacity = baseOpacity * (0.7 + rimFactor * 0.3);
  opacity *= (0.8 + displacementFactor * 0.2);
  return opacity;
}

/**
 * Calculate opacity for link aura
 * Always respects hierarchy: never exceeds node aura opacity
 * 
 * @param {number} rimFactor [0-1] Rim lighting contribution
 * @param {number} displacementFactor [0-1] Vertex displacement contribution
 * @returns {number} Final opacity [0-1], capped at linkOpacityCap
 */
export function calculateLinkOpacity(rimFactor, displacementFactor) {
  const profile = EnergyVisualProfile;
  let opacity = profile.baseOpacity * profile.linkOpacityMultiplier;
  opacity *= (0.6 + rimFactor * 0.2);
  opacity *= (0.7 + displacementFactor * 0.15);
  
  // Hard cap: ensure link never exceeds visual hierarchy
  return Math.min(opacity, profile.linkOpacityCap);
}

/**
 * Apply desaturation based on corruption
 * Progressive shift to grayscale + sickly yellow-gray at high corruption
 * 
 * @param {number[]} color Current color [r, g, b]
 * @param {number} desaturation [0-1] Desaturation amount
 * @returns {number[]} Desaturated color [r, g, b]
 */
export function applyDesaturation(color, desaturation) {
  if (desaturation <= 0.0) return color;
  
  // Convert to grayscale (luminance)
  const gray = color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114;
  const grayscale = [gray, gray, gray];
  
  // Blend toward grayscale
  let result = [
    mix(color[0], grayscale[0], desaturation),
    mix(color[1], grayscale[1], desaturation),
    mix(color[2], grayscale[2], desaturation),
  ];
  
  // At high desaturation, shift toward sickly yellow-gray
  if (desaturation > EnergyVisualProfile.desaturationColorShiftThreshold) {
    const shiftAmount = (desaturation - EnergyVisualProfile.desaturationColorShiftThreshold) * 0.5;
    const shift = EnergyVisualProfile.corruptedGrayShift;
    
    result[0] = mix(result[0], grayscale[0] + shift[0], shiftAmount);
    result[1] = mix(result[1], grayscale[1] + shift[1], shiftAmount);
    result[2] = mix(result[2], grayscale[2] + shift[2], shiftAmount);
  }
  
  return result;
}

/**
 * Simple linear interpolation utility (GLSL-like)
 * Mirrors behavior of mix() in shader code
 * 
 * @param {number} a Start value
 * @param {number} b End value
 * @param {number} t Blend factor [0-1]
 * @returns {number} Interpolated value
 */
function mix(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * CONVENIENCE ACCESSORS
 * ============================================================================
 * Quick access to commonly used profile values
 */

/**
 * Get the shader noise function string (identical across all systems)
 * Copy-paste this into any shader that needs unified noise
 * 
 * @returns {string} GLSL noise function code
 */
export function getNoiseFunction() {
  return `
    // ========================================================================
    // UNIFIED SIMPLEX-LIKE 3D NOISE - SHARED ACROSS ALL SYSTEMS
    // ========================================================================
    // Used by: Node Aura, Link Aura, Trail Particles, Healing Particles
    
    vec3 permute(vec3 x) {
      return mod(((x * 34.0) + 1.0) * x, 289.0);
    }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(i.z + vec3(0., i1.z, i2.z)) + i.y + vec3(i1.y, i2.y, 0.)) + i.x + vec3(0., i1.x, i2.x));
      
      vec4 d = fract(p * 0.024390243);
      d -= 0.5;
      
      vec4 d0 = dot(d, d);
      vec3 d1 = dot(vec4(d.x, d.y, d.z, 0.), vec4(d.x, d.y, d.z, 0.));
      vec3 d2 = dot(vec4(d.x, d.z, 0., d.w), vec4(d.x, d.z, 0., d.w));
      vec3 d3 = dot(vec4(d.y, d.z, 0., d.w), vec4(d.y, d.z, 0., d.w));
      
      vec4 t = max(0.6 - vec4(d0.x, d1.x, d2.x, d3.x), 0.0);
      t *= t;
      t *= t;
      
      return 42.0 * dot(t, vec4(d0.y, d1.y, d2.y, d3.y));
    }
  `;
}

/**
 * Describe this profile for debugging
 * 
 * @returns {string} Human-readable profile description
 */
export function describe() {
  return `
EnergyVisualProfile - Unified Energy Medium Visualization
===========================================================

COLOR SCHEME:
  Base: ${EnergyVisualProfile.baseColor.join(', ')} (neutral gray-white)
  Harmony: ${EnergyVisualProfile.harmonyColor.join(', ')} (bright white-blue)
  Corruption: ${EnergyVisualProfile.corruptionColor.join(', ')} (red tint)

OPACITY HIERARCHY:
  Node Aura: ${EnergyVisualProfile.baseOpacity} max
  Link Aura: ${(EnergyVisualProfile.baseOpacity * EnergyVisualProfile.linkOpacityMultiplier).toFixed(3)} max (${(EnergyVisualProfile.linkOpacityMultiplier * 100).toFixed(0)}% of node)
  Link Cap: ${EnergyVisualProfile.linkOpacityCap} hard cap

MOTION MODULATION:
  Harmony Motion Dampen: ${EnergyVisualProfile.harmonyMotionDampen}
  Corruption Enhance (Node): ${EnergyVisualProfile.corruptionMotionEnhanceNode}
  Corruption Enhance (Link): ${EnergyVisualProfile.corruptionMotionEnhanceLink}

NOISE STRUCTURE:
  Base Scale: ${EnergyVisualProfile.noiseScale}
  Octaves: ${EnergyVisualProfile.noiseOctaves.join(', ')}
  Denominator: ${EnergyVisualProfile.noiseOctaveDenominator}
  Base Displacement: ${EnergyVisualProfile.baseDisplacement}
  Link Displacement: ${(EnergyVisualProfile.baseDisplacement * EnergyVisualProfile.linkDisplacementMultiplier).toFixed(3)}

This single profile ensures perfect visual coherence across all energy systems.
  `;
}
