/**
 * ============================================================================
 * BEAD SYSTEM TUNING
 * ============================================================================
 * 
 * This file provides easy access to tuning parameters for the LinkBeadSystem.
 * Adjust these values to refine the visual appearance and behavior of beads.
 * 
 * USAGE:
 * Import and modify BEAD_CONFIG in LinkBeadSystem before creating links,
 * or use these tuning presets for quick adjustments.
 * 
 * ============================================================================
 */

import { BEAD_CONFIG } from './LinkBeadSystem.js';

/**
 * TUNING PRESETS
 * ============================================================================
 */

/**
 * Conservative: Few beads, subtle effect
 * Use for: High node density, visual clarity priority
 */
export const PRESET_CONSERVATIVE = {
  spawn: {
    baseRate: 1.5,
    minActivityThreshold: 0.2
  },
  opacity: 0.6,
  emissiveIntensity: 0.25,
  maxBeadsPerLink: 10,
  synergyCoupling: {
    enabled: true,
    minMultiplier: 0.5,
    maxMultiplier: 1.0
  }
};

/**
 * Balanced: Default, good for most cases
 * Use for: Standard network visualization
 */
export const PRESET_BALANCED = {
  spawn: {
    baseRate: 3.0,
    minActivityThreshold: 0.15
  },
  opacity: 0.7,
  emissiveIntensity: 0.35,
  maxBeadsPerLink: 20,
  synergyCoupling: {
    enabled: true,
    minMultiplier: 0.6,
    maxMultiplier: 1.2
  }
};

/**
 * Expressive: More beads, more visible
 * Use for: Low node density, flow clarity priority
 */
export const PRESET_EXPRESSIVE = {
  spawn: {
    baseRate: 5.0,
    minActivityThreshold: 0.1
  },
  opacity: 0.8,
  emissiveIntensity: 0.4,
  maxBeadsPerLink: 30,
  synergyCoupling: {
    enabled: true,
    minMultiplier: 0.7,
    maxMultiplier: 1.3
  }
};

/**
 * Busy: Maximum beads, constant activity
 * Use for: Very low density networks, dramatic effect
 */
export const PRESET_BUSY = {
  spawn: {
    baseRate: 8.0,
    minActivityThreshold: 0.05
  },
  opacity: 0.85,
  emissiveIntensity: 0.45,
  maxBeadsPerLink: 50,
  synergyCoupling: {
    enabled: true,
    minMultiplier: 0.8,
    maxMultiplier: 1.4
  }
};

/**
 * Apply a tuning preset
 * @param {Object} preset - One of the PRESET_* constants
 */
export function applyPreset(preset) {
  if (preset.spawn) Object.assign(BEAD_CONFIG.spawn, preset.spawn);
  if (preset.opacity !== undefined) BEAD_CONFIG.opacity = preset.opacity;
  if (preset.emissiveIntensity !== undefined) BEAD_CONFIG.emissiveIntensity = preset.emissiveIntensity;
  if (preset.maxBeadsPerLink !== undefined) BEAD_CONFIG.maxBeadsPerLink = preset.maxBeadsPerLink;
  if (preset.synergyCoupling) Object.assign(BEAD_CONFIG.synergyCoupling, preset.synergyCoupling);
}

/**
 * ============================================================================
 * INDIVIDUAL TUNING PARAMETERS
 * ============================================================================
 */

/**
 * Adjust spawn rate
 * @param {number} rate - Beads per second at max activity (0.5 - 10.0)
 */
export function setSpawnRate(rate) {
  BEAD_CONFIG.spawn.baseRate = Math.max(0.1, Math.min(10, rate));
}

/**
 * Adjust bead opacity
 * @param {number} opacity - 0.0 - 1.0 (0 = invisible, 1 = fully opaque)
 */
export function setOpacity(opacity) {
  BEAD_CONFIG.opacity = Math.max(0.1, Math.min(1.0, opacity));
}

/**
 * Adjust glow intensity
 * @param {number} intensity - 0.0 - 1.0+ (0 = no glow, 1 = strong glow)
 */
export function setEmissiveIntensity(intensity) {
  BEAD_CONFIG.emissiveIntensity = Math.max(0, Math.min(2, intensity));
}

/**
 * Adjust bead roughness (surface finish)
 * @param {number} roughness - 0.0 - 1.0 (0 = mirror-like, 1 = matte)
 */
export function setRoughness(roughness) {
  BEAD_CONFIG.roughness = Math.max(0, Math.min(1, roughness));
}

/**
 * Adjust bead metalness
 * @param {number} metalness - 0.0 - 1.0 (0 = non-metallic, 1 = fully metallic)
 */
export function setMetalness(metalness) {
  BEAD_CONFIG.metalness = Math.max(0, Math.min(1, metalness));
}

/**
 * Adjust maximum beads per link
 * @param {number} max - 1 - 100
 */
export function setMaxBeadsPerLink(max) {
  BEAD_CONFIG.maxBeadsPerLink = Math.max(1, Math.min(100, Math.floor(max)));
}

/**
 * Toggle synergy coupling (opacity scales with link health)
 * @param {boolean} enabled
 */
export function setSynergyCoupling(enabled) {
  BEAD_CONFIG.synergyCoupling.enabled = enabled;
}

/**
 * Set synergy coupling range
 * @param {number} minMultiplier - Opacity multiplier at low synergy
 * @param {number} maxMultiplier - Opacity multiplier at high synergy
 */
export function setSynergyCouplingRange(minMultiplier, maxMultiplier) {
  BEAD_CONFIG.synergyCoupling.minMultiplier = Math.max(0.1, Math.min(2, minMultiplier));
  BEAD_CONFIG.synergyCoupling.maxMultiplier = Math.max(0.1, Math.min(2, maxMultiplier));
}

/**
 * Get current bead configuration
 * @returns {Object} Copy of BEAD_CONFIG
 */
export function getConfig() {
  return JSON.parse(JSON.stringify(BEAD_CONFIG));
}

/**
 * Reset to default configuration
 */
export function resetToDefaults() {
  applyPreset(PRESET_BALANCED);
}

export default {
  // Presets
  PRESET_CONSERVATIVE,
  PRESET_BALANCED,
  PRESET_EXPRESSIVE,
  PRESET_BUSY,
  applyPreset,
  
  // Tuning functions
  setSpawnRate,
  setOpacity,
  setEmissiveIntensity,
  setRoughness,
  setMetalness,
  setMaxBeadsPerLink,
  setSynergyCoupling,
  setSynergyCouplingRange,
  
  // Utilities
  getConfig,
  resetToDefaults
};
