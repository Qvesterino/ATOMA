/**
 * ============================================================================
 * LINK EMISSION PULSING SYSTEM v1.0
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * - Links pulse visually in sync with particle emission intensity
 * - High emission → Fast, intense pulsing
 * - Low emission → Slow, subtle pulsing
 * - Creates rhythmic visual feedback of network activity
 * 
 * INTEGRATION POINTS:
 * - Works with ParticleEmissionRateScaling system
 * - Drives pulsing on all link mesh layers (coreLine, midGlowLine, etc.)
 * - Synchronized through emission intensity metric
 * - Called from main link update loop
 * 
 * TECHNICAL APPROACH:
 * - Emission intensity (0-1) → Pulse frequency (0.5-4 Hz)
 * - Pulsing implemented as sine wave on material properties
 * - Multiple pulsing channels: thickness, glow intensity, opacity
 * - Smooth transitions between emission states
 * 
 * VISUAL RESULT:
 * - Idle links: Barely perceptible slow pulse (breathing effect)
 * - Busy links: Noticeable, rhythmic pulsing (heartbeat effect)
 * - Critical traffic: Fast, intense pulsing (emergency effect)
 * - Creates intuitive connection between activity and visual feedback
 * 
 * SESSIONS INTEGRATION:
 * - Session 76: Core glow intensity (baseline for pulsing)
 * - Session 77: Link color (pulsing on colored mesh)
 * - Session 78: Particle color/opacity (pulsing coordinates with particles)
 * - Session 79: Particle corruption speed (pulsing influenced by corruption)
 * - Session 80 Task 1: Emission intensity (primary driver for pulsing)
 * - Session 80 NEW: Link pulsing synchronized with emission
 * 
 * ============================================================================
 */

import * as THREE from 'three';

/**
 * Configuration for link emission pulsing
 */
export const EMISSION_PULSING_CONFIG = {
  // Enable/disable pulsing globally
  enabled: true,
  
  // Pulsing channels (which properties pulse)
  channels: {
    thickness: true,      // Pulsing link thickness (via linewidth)
    glow: true,           // Pulsing glow intensity (via emissiveIntensity)
    opacity: true,        // Pulsing opacity
    color: false          // Optional: pulsing color saturation (expensive)
  },
  
  // Pulse frequency scaling
  frequencyMin: 0.5,      // Hz - minimum pulse frequency (idle)
  frequencyMax: 4.0,      // Hz - maximum pulse frequency (saturated)
  
  // Thickness pulsing
  thicknessMin: 0.8,      // Minimum thickness multiplier (80% of base)
  thicknessMax: 1.2,      // Maximum thickness multiplier (120% of base)
  
  // Glow intensity pulsing
  glowMin: 0.5,           // Minimum glow intensity multiplier
  glowMax: 1.5,           // Maximum glow intensity multiplier
  
  // Opacity pulsing
  opacityMin: 0.7,        // Minimum opacity multiplier
  opacityMax: 1.0,        // Maximum opacity multiplier
  
  // Color saturation pulsing (if enabled)
  colorSaturationMin: 0.8,
  colorSaturationMax: 1.2,
  
  // Easing function for pulse wave
  // 'sine' = smooth sine wave (natural breathing)
  // 'square' = sharp on/off pulse (mechanical)
  // 'triangle' = linear ramp up/down (electronic)
  easingType: 'sine',
  
  // Pulse phase offset (0-1)
  // 0 = all links pulse in sync
  // 1 = each link has random phase
  // 0.5 = some variation
  phaseRandomization: 0.3,
  
  // Amplitude modulation by corruption (if available)
  // true = pulsing amplitude decreases with corruption
  // false = pulsing independent of corruption
  amplitudeModulationByCorruption: true,
  
  // Update frequency (milliseconds)
  // Set high to reduce per-frame calculations
  updateFrequency: 16  // ~60 FPS sync
};

/**
 * Compute pulse frequency from emission intensity
 * Linear interpolation between min and max frequencies
 * 
 * @param {number} emissionIntensity - Normalized intensity (0-1)
 * @returns {number} Pulse frequency in Hz
 */
export function computePulseFrequency(emissionIntensity) {
  emissionIntensity = Math.max(0, Math.min(1, emissionIntensity));
  
  return EMISSION_PULSING_CONFIG.frequencyMin + 
    (EMISSION_PULSING_CONFIG.frequencyMax - EMISSION_PULSING_CONFIG.frequencyMin) * emissionIntensity;
}

/**
 * Compute pulse wave value (0-1) at current time
 * Uses sine wave or other easing function
 * 
 * @param {number} time - Elapsed time in seconds
 * @param {number} frequency - Pulse frequency in Hz
 * @param {number} phase - Phase offset (0-1)
 * @returns {number} Wave value (0-1)
 */
export function computePulseWave(time, frequency, phase = 0) {
  const period = 1.0 / frequency;
  const localTime = (time + phase * period) % period;
  const normalizedTime = localTime / period;
  
  switch (EMISSION_PULSING_CONFIG.easingType) {
    case 'sine':
      // Smooth sine wave: -1 to 1 → 0 to 1
      return (Math.sin(normalizedTime * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    
    case 'square':
      // Sharp on/off: on for 0.5 period, off for 0.5 period
      return normalizedTime < 0.5 ? 1.0 : 0.0;
    
    case 'triangle':
      // Linear ramp up then down
      return normalizedTime < 0.5 
        ? normalizedTime * 2 
        : (1 - normalizedTime) * 2;
    
    default:
      return (Math.sin(normalizedTime * Math.PI * 2 - Math.PI / 2) + 1) / 2;
  }
}

/**
 * Initialize link emission pulsing state
 * Called during link creation or when adding pulsing to existing link
 * 
 * @param {Object} link - Link object
 * @param {number} emissionIntensity - Initial emission intensity (0-1)
 */
export function initializeLinkEmissionPulsing(link, emissionIntensity = 0.5) {
  if (!link) return;
  
  // Initialize pulsing state
  link.emissionPulsing = {
    enabled: EMISSION_PULSING_CONFIG.enabled,
    intensity: emissionIntensity,
    frequency: computePulseFrequency(emissionIntensity),
    phase: Math.random() * EMISSION_PULSING_CONFIG.phaseRandomization,
    
    // Store base material properties
    baseThickness: link.coreLine?.material?.linewidth ?? 2,
    baseGlowIntensity: link.coreLine?.material?.emissiveIntensity ?? 0.3,
    baseOpacity: link.coreLine?.material?.opacity ?? 1.0,
    
    // Animation time tracking
    startTime: Date.now() / 1000,
    lastUpdateTime: 0
  };
  
  // Also store state for other link layers
  if (link.midGlowLine) {
    link.emissionPulsing.midGlowBaseGlow = link.midGlowLine.material?.emissiveIntensity ?? 0.2;
    link.emissionPulsing.midGlowBaseOpacity = link.midGlowLine.material?.opacity ?? 0.8;
  }
  
  if (link.haloLine) {
    link.emissionPulsing.haloBaseGlow = link.haloLine.material?.emissiveIntensity ?? 0.1;
    link.emissionPulsing.haloBaseOpacity = link.haloLine.material?.opacity ?? 0.6;
  }
}

/**
 * Update link pulsing based on current emission intensity
 * Called from main link update loop
 * 
 * @param {Object} link - Link object
 * @param {number} emissionIntensity - Current emission intensity (0-1)
 * @param {number} deltaTime - Time since last update (seconds)
 */
export function updateLinkEmissionPulsing(link, emissionIntensity, deltaTime = 0.016) {
  if (!link || !link.emissionPulsing || !link.emissionPulsing.enabled) {
    return;
  }
  
  if (!EMISSION_PULSING_CONFIG.enabled) {
    return;
  }
  
  // Clamp emission intensity
  emissionIntensity = Math.max(0, Math.min(1, emissionIntensity));
  
  // Update emission intensity smoothly
  const pulsing = link.emissionPulsing;
  const smoothing = 0.1; // 0-1, higher = smoother transitions
  pulsing.intensity = pulsing.intensity * (1 - smoothing) + emissionIntensity * smoothing;
  
  // Update frequency based on new intensity
  pulsing.frequency = computePulseFrequency(pulsing.intensity);
  
  // Current elapsed time
  const currentTime = Date.now() / 1000;
  const elapsedTime = currentTime - pulsing.startTime;
  
  // Compute pulse wave value (0-1)
  const pulseWave = computePulseWave(elapsedTime, pulsing.frequency, pulsing.phase);
  
  // Apply pulsing to link meshes
  if (link.group && link.group.userData.conduitState) {
    // [BRAIDED CONDUIT SUPPORT]
    // For procedural conduits, we pass the pulse data to the renderer via userData
    // The LinkRendererConduit will read this and modulate radius/emissive during generation
    applyConduitPulsing(link, pulseWave, emissionIntensity);
  } else {
    // [LEGACY / STANDARD LINKS]
    if (EMISSION_PULSING_CONFIG.channels.thickness && link.coreLine) {
      applyThicknessPulsing(link, pulseWave);
    }
    
    if (EMISSION_PULSING_CONFIG.channels.glow) {
      applyGlowPulsing(link, pulseWave, emissionIntensity);
    }
    
    if (EMISSION_PULSING_CONFIG.channels.opacity) {
      applyOpacityPulsing(link, pulseWave);
    }
  }
  
  // Update animation state
  pulsing.lastUpdateTime = currentTime;
}

/**
 * Apply pulsing to Braided Conduit links
 * Writes pulse data to userData for the renderer to consume
 * 
 * @private
 * @param {Object} link - Link object
 * @param {number} pulseWave - Wave value (0-1)
 * @param {number} emissionIntensity - Emission intensity
 */
function applyConduitPulsing(link, pulseWave, emissionIntensity) {
  // Store the calculated pulse value (0-1)
  // This is read by LinkRendererConduit.update()
  link.userData.emissionPulse = pulseWave;
  
  // Also store intensity for frequency visualization
  link.userData.emissionIntensity = emissionIntensity;
}

/**
 * Apply thickness pulsing to link
 * Modulates linewidth on all link layers
 * 
 * @private
 * @param {Object} link - Link object
 * @param {number} pulseWave - Wave value (0-1)
 */
function applyThicknessPulsing(link, pulseWave) {
  const pulsing = link.emissionPulsing;
  
  const setStaticLinewidth = (mat, value) => {
    if (!mat || typeof mat.linewidth === 'undefined') return;
    if (mat._baseLinewidth === undefined) mat._baseLinewidth = value;
    mat.linewidth = mat._baseLinewidth;
  };
  
  const pulsedThickness = pulsing.baseThickness;
  
  // Apply to all link line meshes
  if (link.coreLine && link.coreLine.material) {
    setStaticLinewidth(link.coreLine.material, pulsedThickness);
  }
  
  if (link.midGlowLine && link.midGlowLine.material) {
    setStaticLinewidth(link.midGlowLine.material, pulsedThickness * 0.8);
  }
  
  if (link.haloLine && link.haloLine.material) {
    setStaticLinewidth(link.haloLine.material, pulsedThickness * 0.6);
  }
  
  if (link.bloomAuraLine && link.bloomAuraLine.material) {
    setStaticLinewidth(link.bloomAuraLine.material, pulsedThickness * 0.5);
  }
  
  if (link.edgeLine && link.edgeLine.material) {
    setStaticLinewidth(link.edgeLine.material, pulsedThickness * 0.3);
  }
}

/**
 * Apply glow intensity pulsing to link
 * Modulates emissiveIntensity on all link layers
 * 
 * @private
 * @param {Object} link - Link object
 * @param {number} pulseWave - Wave value (0-1)
 * @param {number} emissionIntensity - Emission intensity for modulation
 */
function applyGlowPulsing(link, pulseWave, emissionIntensity) {
  const pulsing = link.emissionPulsing;
  
  // Compute glow multiplier from pulse wave
  let glowMultiplier = 
    EMISSION_PULSING_CONFIG.glowMin + 
    (EMISSION_PULSING_CONFIG.glowMax - EMISSION_PULSING_CONFIG.glowMin) * pulseWave;
  
  // Optional: modulate amplitude by corruption
  if (EMISSION_PULSING_CONFIG.amplitudeModulationByCorruption && link.corruption !== undefined) {
    const corruptionFactor = 1.0 - link.corruption; // Reduce glow if corrupted
    glowMultiplier = 1.0 + (glowMultiplier - 1.0) * corruptionFactor;
  }
  
  // Apply to core line
  if (link.coreLine && link.coreLine.material) {
    link.coreLine.material.emissiveIntensity = pulsing.baseGlowIntensity * glowMultiplier;
  }
  
  // Apply to mid-glow line with reduced multiplier
  if (link.midGlowLine && link.midGlowLine.material) {
    const midGlowGlow = pulsing.midGlowBaseGlow * glowMultiplier * 0.8;
    link.midGlowLine.material.emissiveIntensity = midGlowGlow;
  }
  
  // Apply to halo line with reduced multiplier
  if (link.haloLine && link.haloLine.material) {
    const haloGlow = pulsing.haloBaseGlow * glowMultiplier * 0.5;
    link.haloLine.material.emissiveIntensity = haloGlow;
  }
  
  // Apply to bloom aura line
  if (link.bloomAuraLine && link.bloomAuraLine.material) {
    const bloomGlow = (pulsing.baseGlowIntensity * 0.5) * glowMultiplier * 0.6;
    link.bloomAuraLine.material.emissiveIntensity = bloomGlow;
  }
  
  // Apply to edge line
  if (link.edgeLine && link.edgeLine.material) {
    const edgeGlow = (pulsing.baseGlowIntensity * 0.3) * glowMultiplier * 0.4;
    link.edgeLine.material.emissiveIntensity = edgeGlow;
  }
}

/**
 * Apply opacity pulsing to link
 * Modulates opacity on all link layers
 * 
 * @private
 * @param {Object} link - Link object
 * @param {number} pulseWave - Wave value (0-1)
 */
function applyOpacityPulsing(link, pulseWave) {
  const pulsing = link.emissionPulsing;
  
  // Interpolate between min and max opacity
  const opacityMultiplier = 
    EMISSION_PULSING_CONFIG.opacityMin + 
    (EMISSION_PULSING_CONFIG.opacityMax - EMISSION_PULSING_CONFIG.opacityMin) * pulseWave;
  
  // Apply to core line
  if (link.coreLine && link.coreLine.material) {
    link.coreLine.material.opacity = pulsing.baseOpacity * opacityMultiplier;
  }
  
  // Apply to mid-glow line
  if (link.midGlowLine && link.midGlowLine.material) {
    link.midGlowLine.material.opacity = pulsing.midGlowBaseOpacity * opacityMultiplier * 0.8;
  }
  
  // Apply to halo line
  if (link.haloLine && link.haloLine.material) {
    link.haloLine.material.opacity = pulsing.haloBaseOpacity * opacityMultiplier * 0.9;
  }
  
  // Apply to bloom aura line
  if (link.bloomAuraLine && link.bloomAuraLine.material) {
    link.bloomAuraLine.material.opacity = (pulsing.baseOpacity * 0.6) * opacityMultiplier * 0.7;
  }
  
  // Apply to edge line
  if (link.edgeLine && link.edgeLine.material) {
    link.edgeLine.material.opacity = (pulsing.baseOpacity * 0.4) * opacityMultiplier * 0.5;
  }
}

/**
 * Enable pulsing for a link
 * 
 * @param {Object} link - Link object
 */
export function enableLinkEmissionPulsing(link) {
  if (link && link.emissionPulsing) {
    link.emissionPulsing.enabled = true;
  }
}

/**
 * Disable pulsing for a link
 * 
 * @param {Object} link - Link object
 */
export function disableLinkEmissionPulsing(link) {
  if (link && link.emissionPulsing) {
    link.emissionPulsing.enabled = false;
    // Reset materials to base state
    resetLinkMaterialsToBaseState(link);
  }
}

/**
 * Reset link materials to base state (no pulsing)
 * Useful when disabling pulsing
 * 
 * @private
 * @param {Object} link - Link object
 */
function resetLinkMaterialsToBaseState(link) {
  const pulsing = link.emissionPulsing;
  if (!pulsing) return;
  
  if (link.coreLine && link.coreLine.material) {
    link.coreLine.material.linewidth = pulsing.baseThickness;
    link.coreLine.material.emissiveIntensity = pulsing.baseGlowIntensity;
    link.coreLine.material.opacity = pulsing.baseOpacity;
  }
  
  if (link.midGlowLine && link.midGlowLine.material) {
    link.midGlowLine.material.emissiveIntensity = pulsing.midGlowBaseGlow;
    link.midGlowLine.material.opacity = pulsing.midGlowBaseOpacity;
  }
  
  if (link.haloLine && link.haloLine.material) {
    link.haloLine.material.emissiveIntensity = pulsing.haloBaseGlow;
    link.haloLine.material.opacity = pulsing.haloBaseOpacity;
  }
}

/**
 * Batch update pulsing for multiple links
 * Efficient when updating many links at once
 * 
 * @param {Array} links - Array of link objects
 * @param {Function} intensityGetter - Function(link) → emissionIntensity
 * @param {number} deltaTime - Time since last update
 */
export function batchUpdateLinkEmissionPulsing(links, intensityGetter, deltaTime = 0.016) {
  for (const link of links) {
    const intensity = intensityGetter(link);
    updateLinkEmissionPulsing(link, intensity, deltaTime);
  }
}

/**
 * Get current pulsing state for a link
 * Useful for debugging or UI display
 * 
 * @param {Object} link - Link object
 * @returns {Object|null} Pulsing state object or null if not initialized
 */
export function getLinkPulsingState(link) {
  if (!link || !link.emissionPulsing) return null;
  
  const pulsing = link.emissionPulsing;
  const currentTime = Date.now() / 1000;
  const elapsedTime = currentTime - pulsing.startTime;
  
  return {
    enabled: pulsing.enabled,
    intensity: pulsing.intensity,
    frequency: pulsing.frequency,
    phase: pulsing.phase,
    elapsedTime: elapsedTime,
    currentWave: computePulseWave(elapsedTime, pulsing.frequency, pulsing.phase)
  };
}

/**
 * Set pulsing intensity directly
 * Useful for manual control or special effects
 * 
 * @param {Object} link - Link object
 * @param {number} intensity - New emission intensity (0-1)
 */
export function setLinkPulsingIntensity(link, intensity) {
  if (link && link.emissionPulsing) {
    link.emissionPulsing.intensity = Math.max(0, Math.min(1, intensity));
    link.emissionPulsing.frequency = computePulseFrequency(link.emissionPulsing.intensity);
  }
}

/**
 * Get human-readable pulsing description
 * 
 * @param {number} emissionIntensity - Emission intensity (0-1)
 * @returns {string} Description of pulsing behavior
 */
export function getPulsingDescription(emissionIntensity) {
  const frequency = computePulseFrequency(emissionIntensity);
  
  if (emissionIntensity < 0.2) {
    return `Idle - barely perceptible pulse (${frequency.toFixed(2)} Hz)`;
  } else if (emissionIntensity < 0.4) {
    return `Light - gentle breathing pulse (${frequency.toFixed(2)} Hz)`;
  } else if (emissionIntensity < 0.6) {
    return `Moderate - steady pulse (${frequency.toFixed(2)} Hz)`;
  } else if (emissionIntensity < 0.8) {
    return `Heavy - noticeable pulse (${frequency.toFixed(2)} Hz)`;
  } else {
    return `Critical - rapid intense pulse (${frequency.toFixed(2)} Hz)`;
  }
}

/**
 * Verify pulsing system is properly initialized
 * Dev-mode assertion for catching integration bugs
 * 
 * @param {Object} link - Link object to verify
 * @returns {boolean} True if properly initialized
 */
export function verifyLinkEmissionPulsingInitialization(link) {
  if (!link) return false;
  
  const hasPulsingState = link.emissionPulsing !== undefined;
  const hasBaseMaterials = link.emissionPulsing?.baseThickness !== undefined;
  const hasAnimationState = link.emissionPulsing?.startTime !== undefined;
  
  const isValid = hasPulsingState && hasBaseMaterials && hasAnimationState;
  
  if (!isValid && typeof window !== 'undefined' && window.DEBUG_LINK_PULSING) {
    console.warn('[LinkEmissionPulsingSystem] Incomplete initialization:', {
      hasPulsingState,
      hasBaseMaterials,
      hasAnimationState,
      link
    });
  }
  
  return isValid;
}

/**
 * Create pulsing curve visualization for debugging
 * Shows how emission intensity maps to pulse frequency and wave
 * 
 * @param {number} samples - Number of sample points
 * @returns {Array} Array of diagnostic points
 */
export function generatePulsingCurve(samples = 50) {
  const curve = [];
  
  for (let i = 0; i <= samples; i++) {
    const intensity = i / samples;
    const frequency = computePulseFrequency(intensity);
    
    // Sample pulse wave at t=0, t=0.5 period
    const wave0 = computePulseWave(0, frequency);
    const waveHalf = computePulseWave(0.5 / frequency, frequency);
    
    curve.push({
      intensity,
      frequency,
      waveMinValue: Math.min(wave0, waveHalf),
      waveMaxValue: Math.max(wave0, waveHalf),
      description: getPulsingDescription(intensity)
    });
  }
  
  return curve;
}

/**
 * Configure pulsing system globally
 * 
 * @param {Object} config - Partial configuration object
 */
export function configureEmissionPulsing(config) {
  Object.assign(EMISSION_PULSING_CONFIG, config);
}

/**
 * Export pulsing system as complete module
 */
export const LinkEmissionPulsingSystem = {
  // Core operations
  initializeLinkEmissionPulsing,
  updateLinkEmissionPulsing,
  batchUpdateLinkEmissionPulsing,
  
  // Control
  enableLinkEmissionPulsing,
  disableLinkEmissionPulsing,
  setLinkPulsingIntensity,
  
  // Computation
  computePulseFrequency,
  computePulseWave,
  
  // Information
  getLinkPulsingState,
  getPulsingDescription,
  getAvailableEasingTypes: () => ['sine', 'square', 'triangle'],
  
  // Verification & diagnostics
  verifyLinkEmissionPulsingInitialization,
  generatePulsingCurve,
  
  // Configuration
  configureEmissionPulsing,
  getConfiguration: () => ({ ...EMISSION_PULSING_CONFIG }),
  
  // Configuration object (for direct access)
  config: EMISSION_PULSING_CONFIG
};

export default LinkEmissionPulsingSystem;
