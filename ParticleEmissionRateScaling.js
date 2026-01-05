/**
 * ============================================================================
 * PARTICLE EMISSION RATE SCALING v1.0
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * - Particle emission rate should scale with link traffic magnitude
 * - High traffic → More particles (visual intensity)
 * - Low traffic → Fewer particles (visual quiet)
 * - Non-linear scaling creates dramatic visual feedback
 * 
 * INTEGRATION POINTS:
 * - Called from NodeLinkingSystem during link update cycles
 * - Traffic magnitude comes from existing traffic simulation
 * - Updates both particle emission rate and visual intensity
 * 
 * TECHNICAL APPROACH:
 * - Traffic magnitude (0-1) maps to emission rate (base-max)
 * - Uses non-linear curves (power function) for dramatic feedback
 * - Applies to both direct particle systems and particle streams
 * - No material modifications, only emission property changes
 * 
 * VISUAL RESULT:
 * - Users see particle intensity correlate with network activity
 * - Creates intuitive feedback: busy links look busy
 * - Combines with Session 76-79 color system for full multi-dimensional feedback
 * 
 * ============================================================================
 */

import * as THREE from 'three';

/**
 * Configuration for particle emission scaling
 */
export const EMISSION_SCALING_CONFIG = {
  // Base emission rate (minimum, when traffic = 0)
  baseEmissionRate: 2,
  
  // Maximum emission rate (when traffic = 1.0, max saturation)
  maxEmissionRate: 15,
  
  // Non-linear scaling exponent
  // 1.0 = linear
  // > 1.0 = power curve (subtle at low traffic, explosive at high)
  scalingExponent: 1.8,
  
  // Minimum particle count maintained (visual baseline)
  minParticleCount: 3,
  
  // Maximum particle count per link
  maxParticleCount: 50,
  
  // Update frequency (milliseconds between updates)
  // Set high to avoid per-frame calculations
  updateFrequency: 500,
  
  // Particle lifetime (seconds) - independent of emission rate
  particleLifetime: 3.0
};

/**
 * Get emission rate from traffic magnitude using non-linear scaling
 * Creates dramatic feedback at high traffic levels
 * 
 * Formula: emissionRate = base + (max - base) * traffic^exponent
 * 
 * @param {number} trafficMagnitude - Normalized traffic value (0-1)
 * @returns {number} Emission rate (particles per second equivalent)
 */
export function computeEmissionRateFromTraffic(trafficMagnitude) {
  // Clamp traffic to valid range
  trafficMagnitude = Math.max(0, Math.min(1, trafficMagnitude));
  
  // Apply non-linear scaling for dramatic feedback
  const scaledTraffic = Math.pow(trafficMagnitude, EMISSION_SCALING_CONFIG.scalingExponent);
  
  // Interpolate between base and max rates
  const emissionRate = 
    EMISSION_SCALING_CONFIG.baseEmissionRate + 
    (EMISSION_SCALING_CONFIG.maxEmissionRate - EMISSION_SCALING_CONFIG.baseEmissionRate) * scaledTraffic;
  
  return emissionRate;
}

/**
 * Get particle count from traffic magnitude
 * Ensures minimum visual presence even at low traffic
 * 
 * @param {number} trafficMagnitude - Normalized traffic value (0-1)
 * @returns {number} Target particle count (integer)
 */
export function computeParticleCountFromTraffic(trafficMagnitude) {
  trafficMagnitude = Math.max(0, Math.min(1, trafficMagnitude));
  
  // Non-linear scaling for dramatic effect
  const scaledTraffic = Math.pow(trafficMagnitude, EMISSION_SCALING_CONFIG.scalingExponent);
  
  // Interpolate between min and max particle counts
  const particleCount = 
    EMISSION_SCALING_CONFIG.minParticleCount + 
    (EMISSION_SCALING_CONFIG.maxParticleCount - EMISSION_SCALING_CONFIG.minParticleCount) * scaledTraffic;
  
  return Math.round(particleCount);
}

/**
 * Update particle emission rate for a link based on traffic
 * Works with both direct particle systems and particle streams
 * 
 * @param {Object} link - Link object with particle references
 * @param {number} trafficMagnitude - Current traffic magnitude (0-1)
 */
export function updateLinkParticleEmissionRate(link, trafficMagnitude) {
  if (!link) return;
  
  // Compute new emission rate
  const emissionRate = computeEmissionRateFromTraffic(trafficMagnitude);
  
  // Store for tracking
  link.trafficMagnitude = trafficMagnitude;
  link.particleEmissionRate = emissionRate;
  
  // Method 1: Direct particles array (extreme mode)
  if (link.particles && Array.isArray(link.particles)) {
    for (const particle of link.particles) {
      if (particle && particle.userData) {
        particle.userData.emissionRate = emissionRate;
      }
    }
  }
  
  // Method 2: Particle stream group (SAFE VFX)
  if (link.particleStream && link.particleStream.userData) {
    link.particleStream.userData.emissionRate = emissionRate;
    
    // Also apply to individual particles in stream
    if (link.particleStream.userData.particles) {
      for (const particle of link.particleStream.userData.particles) {
        if (particle && particle.userData) {
          particle.userData.emissionRate = emissionRate;
        }
      }
    }
  }
}

/**
 * Update particle spawn frequency for a link
 * Controls how often new particles are spawned
 * 
 * @param {Object} link - Link object
 * @param {number} trafficMagnitude - Current traffic magnitude (0-1)
 * @param {number} deltaTime - Time since last frame (seconds)
 */
export function updateLinkParticleSpawnFrequency(link, trafficMagnitude, deltaTime = 0.016) {
  if (!link) return;
  
  const emissionRate = computeEmissionRateFromTraffic(trafficMagnitude);
  
  // Initialize spawn accumulator if not present
  if (link.particleSpawnAccumulator === undefined) {
    link.particleSpawnAccumulator = 0;
  }
  
  // Accumulate spawn credit
  link.particleSpawnAccumulator += emissionRate * deltaTime;
  
  // Determine how many particles to spawn this frame
  const particlesToSpawn = Math.floor(link.particleSpawnAccumulator);
  link.particleSpawnAccumulator -= particlesToSpawn;
  
  // Store for particle system to consume
  if (link.particleStream) {
    link.particleStream.userData.particlesToSpawnThisFrame = particlesToSpawn;
  }
  
  return particlesToSpawn;
}

/**
 * Scale particle speed alongside emission rate
 * Faster particles at higher traffic (optional visual enhancement)
 * 
 * @param {Object} link - Link object
 * @param {number} trafficMagnitude - Current traffic magnitude (0-1)
 * @param {number} baseSpeed - Base particle speed (default: 0.4)
 */
export function scaleParticleSpeedWithTraffic(link, trafficMagnitude, baseSpeed = 0.4) {
  if (!link) return;
  
  trafficMagnitude = Math.max(0, Math.min(1, trafficMagnitude));
  
  // Subtle speed increase: 0.8x to 1.2x multiplier
  const speedMultiplier = 0.8 + (trafficMagnitude * 0.4);
  const scaledSpeed = baseSpeed * speedMultiplier;
  
  // Apply to direct particles
  if (link.particles && Array.isArray(link.particles)) {
    for (const particle of link.particles) {
      if (particle && particle.userData) {
        particle.userData.speed = scaledSpeed;
      }
    }
  }
  
  // Apply to particle stream
  if (link.particleStream && link.particleStream.userData?.particles) {
    for (const particle of link.particleStream.userData.particles) {
      if (particle && particle.userData) {
        particle.userData.speed = scaledSpeed;
      }
    }
  }
}

/**
 * Initialize particle emission tracking on a link
 * Called during link creation
 * 
 * @param {Object} link - Link object
 * @param {number} initialTraffic - Initial traffic magnitude (default: 0.5)
 */
export function initializeParticleEmissionTracking(link, initialTraffic = 0.5) {
  if (!link) return;
  
  // Initialize emission state
  link.trafficMagnitude = initialTraffic;
  link.particleEmissionRate = computeEmissionRateFromTraffic(initialTraffic);
  link.particleSpawnAccumulator = 0;
  link.lastEmissionUpdateTime = Date.now();
  
  // Apply initial emission rate
  updateLinkParticleEmissionRate(link, initialTraffic);
}

/**
 * Get emission intensity (0-1) for visual representation
 * Useful for UI indicators or secondary visual effects
 * 
 * @param {number} trafficMagnitude - Current traffic magnitude (0-1)
 * @returns {number} Emission intensity (0-1)
 */
export function getEmissionIntensity(trafficMagnitude) {
  trafficMagnitude = Math.max(0, Math.min(1, trafficMagnitude));
  
  // Non-linear intensity curve
  return Math.pow(trafficMagnitude, EMISSION_SCALING_CONFIG.scalingExponent);
}

/**
 * Batch update particle emission for multiple links
 * Efficient for network-wide updates
 * 
 * @param {Array} links - Array of link objects
 * @param {Function} trafficGetter - Function(link) → traffic magnitude
 * @param {number} deltaTime - Optional time delta for spawn frequency
 */
export function batchUpdateParticleEmission(links, trafficGetter, deltaTime = 0) {
  for (const link of links) {
    const traffic = trafficGetter(link);
    updateLinkParticleEmissionRate(link, traffic);
    
    if (deltaTime > 0) {
      updateLinkParticleSpawnFrequency(link, traffic, deltaTime);
    }
  }
}

/**
 * Get human-readable traffic level from numeric value
 * 
 * @param {number} trafficMagnitude - Traffic magnitude (0-1)
 * @returns {string} Traffic level name
 */
export function getTrafficLevel(trafficMagnitude) {
  if (trafficMagnitude < 0.15) return 'idle';
  if (trafficMagnitude < 0.35) return 'light';
  if (trafficMagnitude < 0.60) return 'moderate';
  if (trafficMagnitude < 0.80) return 'heavy';
  return 'critical';
}

/**
 * Verify particle emission system is properly initialized
 * Dev-mode assertion for catching integration bugs
 * 
 * @param {Object} link - Link object to verify
 * @returns {boolean} True if properly initialized
 */
export function verifyParticleEmissionInitialization(link) {
  if (!link) return false;
  
  const hasTrafficTracking = link.trafficMagnitude !== undefined;
  const hasEmissionRate = link.particleEmissionRate !== undefined;
  const hasAccumulator = link.particleSpawnAccumulator !== undefined;
  
  const isValid = hasTrafficTracking && hasEmissionRate && hasAccumulator;
  
  if (!isValid && typeof window !== 'undefined' && window.DEBUG_PARTICLE_EMISSION) {
    console.warn('[ParticleEmissionRateScaling] Incomplete initialization:', {
      hasTrafficTracking,
      hasEmissionRate,
      hasAccumulator,
      link
    });
  }
  
  return isValid;
}

/**
 * Create emission curve visualization for debugging
 * Shows how traffic maps to emission rate
 * 
 * @param {number} samples - Number of sample points
 * @returns {Array} Array of {traffic, emissionRate} objects
 */
export function generateEmissionCurve(samples = 50) {
  const curve = [];
  
  for (let i = 0; i <= samples; i++) {
    const traffic = i / samples;
    const emissionRate = computeEmissionRateFromTraffic(traffic);
    
    curve.push({
      traffic,
      emissionRate,
      particleCount: computeParticleCountFromTraffic(traffic),
      intensity: getEmissionIntensity(traffic)
    });
  }
  
  return curve;
}

/**
 * Export particle emission system as a complete module
 * For easy injection into NodeLinkingSystem
 */
export const ParticleEmissionRateScalingSystem = {
  // Core computation
  computeEmissionRateFromTraffic,
  computeParticleCountFromTraffic,
  getEmissionIntensity,
  
  // Link updates
  updateLinkParticleEmissionRate,
  updateLinkParticleSpawnFrequency,
  scaleParticleSpeedWithTraffic,
  initializeParticleEmissionTracking,
  
  // Batch operations
  batchUpdateParticleEmission,
  
  // Utilities
  getTrafficLevel,
  verifyParticleEmissionInitialization,
  generateEmissionCurve,
  
  // Configuration access
  config: EMISSION_SCALING_CONFIG
};

export default ParticleEmissionRateScalingSystem;
