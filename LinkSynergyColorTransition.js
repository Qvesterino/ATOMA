/**
 * ============================================================================
 * LINK SYNERGY COLOR TRANSITION SYSTEM v1.0
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * - Synergy is the PRIMARY visual signal for link quality
 * - Low synergy (0.0) → Cold colors (cyan, blue)
 * - Medium synergy (0.5) → Neutral colors (white, purple)
 * - High synergy (1.0) → Warm colors (yellow, orange, red)
 * - Color transitions are smooth Lerp operations
 * 
 * INTEGRATION POINTS:
 * - Applied on link creation in createLink()
 * - Updated dynamically when synergy changes
 * - Synergy values stored in link['synergyScore'] (0-1 normalized)
 * 
 * TECHNICAL APPROACH:
 * - 3-point color gradient: cold → neutral → warm
 * - Fast material updates on link.coreLine and link.midGlowLine
 * - Optional: particle colors synced with synergy
 * 
 * VISUAL RESULT:
 * - User sees immediate, intuitive feedback on link quality
 * - Colors match node core glow intensity (Session 76 synergy glow)
 * - Creates cohesive "synergy language" across system
 * 
 * ============================================================================
 */

import * as THREE from 'three';

/**
 * Color palette for synergy gradient
 * - Low: Cool cyan/blue (low synergy, weak connection)
 * - Mid: Purple/white (medium synergy, balanced connection)
 * - High: Yellow/orange/red (high synergy, strong connection)
 */
export const SYNERGY_COLOR_PALETTE = {
  low: {
    // Cool cyan - weak synergy
    primary: 0x00ddff,    // Cyan
    secondary: 0x0099ff,  // Blue
  },
  mid: {
    // Purple/white - medium synergy
    primary: 0xaa88ff,    // Purple
    secondary: 0xffffff,  // White
  },
  high: {
    // Warm yellows/oranges/reds - strong synergy
    primary: 0xffff00,    // Yellow
    secondary: 0xff8800,  // Orange
    tertiary: 0xff4400,   // Orange-red
  }
};

/**
 * Compute color from synergy value using 3-point gradient
 * synergy 0.0 → cyan
 * synergy 0.5 → purple/white
 * synergy 1.0 → red
 * 
 * @param {number} synergy - Synergy value (0-1)
 * @returns {THREE.Color} Interpolated color
 */
export function computeSynergyColor(synergy) {
  // Clamp synergy to 0-1
  synergy = Math.max(0, Math.min(1, synergy));
  
  if (synergy < 0.5) {
    // Low → Mid: Cyan to Purple
    const t = synergy * 2; // 0-1 in first half
    const color1 = new THREE.Color(SYNERGY_COLOR_PALETTE.low.primary);
    const color2 = new THREE.Color(SYNERGY_COLOR_PALETTE.mid.primary);
    return color1.lerp(color2, t);
  } else {
    // Mid → High: Purple to Red
    const t = (synergy - 0.5) * 2; // 0-1 in second half
    const color1 = new THREE.Color(SYNERGY_COLOR_PALETTE.mid.primary);
    const color2 = new THREE.Color(SYNERGY_COLOR_PALETTE.high.tertiary);
    return color1.lerp(color2, t);
  }
}

/**
 * Apply synergy-driven color to a link's visual meshes
 * Updates: coreLine, midGlowLine, and optionally particles
 * 
 * @param {Object} link - Link object with mesh references
 * @param {number} synergy - Synergy value (0-1)
 * @returns {THREE.Color} The computed color
 */
export function applySynergyColorToLink(link, synergy) {
  if (!link) return null;
  
  // Compute color from synergy
  const synergyColor = computeSynergyColor(synergy);
  
  // [BRAIDED CONDUIT SUPPORT]
  if (link.group && link.group.userData.conduitState) {
    const strands = link.group.userData.conduitState.strands;
    if (strands && Array.isArray(strands)) {
      strands.forEach(strand => {
        if (strand.material) {
          strand.material.color.copy(synergyColor);
          if (strand.material.emissive) {
            strand.material.emissive.copy(synergyColor);
          }
        }
      });
    }
    // Also update state color for regeneration
    link.group.userData.conduitState.baseColor = synergyColor.getHex();
  }
  
  // Apply to main core line (primary visual)
  if (link.coreLine && link.coreLine.material) {
    link.coreLine.material.color.copy(synergyColor);
  }
  
  // Apply to mid-glow line (secondary visual)
  if (link.midGlowLine && link.midGlowLine.material) {
    link.midGlowLine.material.color.copy(synergyColor);
  }
  
  // Apply to halo line (tertiary visual)
  if (link.haloLine && link.haloLine.material) {
    link.haloLine.material.color.copy(synergyColor);
  }
  
  // Apply to bloom aura line (soft background)
  if (link.bloomAuraLine && link.bloomAuraLine.material) {
    link.bloomAuraLine.material.color.copy(synergyColor);
  }
  
  // Apply to edge line (fine detail)
  if (link.edgeLine && link.edgeLine.material) {
    link.edgeLine.material.color.copy(synergyColor);
  }
  
  // Store for animations/updates
  link['synergyColor'] = synergyColor;
  link.lastSynergyValue = synergy;
  
  return synergyColor;
}

/**
 * Update link color when synergy changes
 * Smoothly transitions between colors based on new synergy value
 * 
 * @param {Object} link - Link object
 * @param {number} newSynergy - New synergy value (0-1)
 * @param {number} transitionDuration - Optional transition time in seconds (default: immediate)
 */
export function updateLinkSynergyColor(link, newSynergy, transitionDuration = 0) {
  if (!link) return;
  
  // Immediate color update
  if (transitionDuration <= 0) {
    applySynergyColorToLink(link, newSynergy);
    return;
  }
  
  // Smooth transition (store state for animation)
  const oldSynergy = link.lastSynergyValue ?? link['synergyScore'] ?? 0.5;
  const oldColor = link['synergyColor'] || computeSynergyColor(oldSynergy);
  
  link.colorTransition = {
    startSynergy: oldSynergy,
    targetSynergy: newSynergy,
    startColor: oldColor.clone(),
    targetColor: computeSynergyColor(newSynergy),
    elapsed: 0,
    duration: transitionDuration,
    active: true
  };
}

/**
 * Update link color transition animation
 * Call from main update loop
 * 
 * @param {Object} link - Link object
 * @param {number} deltaTime - Time since last frame (seconds)
 */
export function updateLinkColorTransition(link, deltaTime) {
  if (!link || !link.colorTransition || !link.colorTransition.active) {
    return;
  }
  
  const transition = link.colorTransition;
  transition.elapsed += deltaTime;
  
  const progress = Math.min(transition.elapsed / transition.duration, 1);
  
  // Interpolate color
  const currentColor = transition.startColor.clone()
    .lerp(transition.targetColor, progress);
  
  // [BRAIDED CONDUIT SUPPORT]
  if (link.group && link.group.userData.conduitState) {
    const strands = link.group.userData.conduitState.strands;
    if (strands && Array.isArray(strands)) {
      strands.forEach(strand => {
        if (strand.material) {
          strand.material.color.copy(currentColor);
          if (strand.material.emissive) {
            strand.material.emissive.copy(currentColor);
          }
        }
      });
    }
  }

  // Apply to all link meshes
  if (link.coreLine?.material) link.coreLine.material.color.copy(currentColor);
  if (link.midGlowLine?.material) link.midGlowLine.material.color.copy(currentColor);
  if (link.haloLine?.material) link.haloLine.material.color.copy(currentColor);
  if (link.bloomAuraLine?.material) link.bloomAuraLine.material.color.copy(currentColor);
  if (link.edgeLine?.material) link.edgeLine.material.color.copy(currentColor);
  
  // Mark as complete when done
  if (progress >= 1) {
    link.colorTransition.active = false;
    link['synergyColor'] = transition.targetColor;
    link.lastSynergyValue = transition.targetSynergy;
  }
}

/**
 * Apply synergy color to particle stream (optional aesthetic enhancement)
 * Works with both link.particles and link.particleStream systems
 * 
 * @param {Object} link - Link object
 * @param {number} synergy - Synergy value (0-1)
 */
export function applySynergyColorToParticles(link, synergy) {
  if (!link) return;
  
  const synergyColor = computeSynergyColor(synergy);
  
  // Method 1: Direct particles array (extreme mode)
  if (link.particles && Array.isArray(link.particles)) {
    for (const particle of link.particles) {
      if (particle && particle.material && particle.material.color) {
        particle.material.color.copy(synergyColor);
        // Also update emissive for consistent glow
        if (particle.material.emissive) {
          particle.material.emissive.copy(synergyColor);
        }
      }
    }
  }
  
  // Method 2: Particle stream group (SAFE VFX)
  if (link.particleStream && link.particleStream.userData?.particles) {
    const particles = link.particleStream.userData.particles;
    for (const particle of particles) {
      if (particle && particle.material && particle.material.color) {
        particle.material.color.copy(synergyColor);
        // Also update emissive for consistent glow
        if (particle.material.emissive) {
          particle.material.emissive.copy(synergyColor);
        }
      }
    }
  }
}

/**
 * Get human-readable synergy level from numeric value
 * Useful for debugging and UI display
 * 
 * @param {number} synergy - Synergy value (0-1)
 * @returns {string} Level name
 */
export function getSynergyLevel(synergy) {
  if (synergy < 0.25) return 'critical';
  if (synergy < 0.50) return 'weak';
  if (synergy < 0.75) return 'moderate';
  if (synergy < 0.90) return 'strong';
  return 'excellent';
}

/**
 * Batch update colors for multiple links
 * Efficient when synergy changes across network
 * 
 * @param {Array} links - Array of link objects
 * @param {Function} synergyGetter - Function(link) → synergy value
 */
export function batchUpdateLinkColors(links, synergyGetter) {
  for (const link of links) {
    const synergy = synergyGetter(link);
    applySynergyColorToLink(link, synergy);
  }
}

/**
 * Initialize link color system on a link
 * Called during createLink() to set initial synergy color
 * 
 * @param {Object} link - Link object
 */
export function initializeLinkSynergyColor(link) {
  if (!link) return;
  
  // Get synergy from link (default to 0.5 if not set)
  const synergy = link['synergyScore'] ?? 0.5;
  
  // Apply initial color
  applySynergyColorToLink(link, synergy);
  
  // Store animation state
  link.colorTransition = {
    active: false,
    elapsed: 0,
    duration: 0
  };
}

/**
 * Verify link color system is properly initialized
 * Dev-mode assertion for catching integration bugs
 * 
 * @param {Object} link - Link object to verify
 * @returns {boolean} True if properly initialized
 */
export function verifyLinkColorInitialization(link) {
  if (!link) return false;
  
  const hasColorMetadata = link.lastSynergyValue !== undefined;
  const hasColorTransitionState = link.colorTransition !== undefined;
  const hasMaterials = link.coreLine?.material && link.midGlowLine?.material;
  
  const isValid = hasColorMetadata && hasColorTransitionState && hasMaterials;
  
  if (!isValid && typeof window !== 'undefined' && window.DEBUG_SYNERGY_COLORS) {
    console.warn('[LinkSynergyColorTransition] Incomplete initialization:', {
      hasColorMetadata,
      hasColorTransitionState,
      hasMaterials,
      link
    });
  }
  
  return isValid;
}

/**
 * Synchronize particle stream colors during smooth color transitions
 * Animates particle colors alongside link mesh colors
 * 
 * @param {Object} link - Link object
 * @param {number} deltaTime - Time since last frame (seconds)
 */
export function updateParticleColorTransition(link, deltaTime) {
  if (!link || !link.colorTransition || !link.colorTransition.active) {
    return;
  }
  
  const transition = link.colorTransition;
  transition.elapsed += deltaTime;
  
  const progress = Math.min(transition.elapsed / transition.duration, 1);
  
  // Interpolate color
  const currentColor = transition.startColor.clone()
    .lerp(transition.targetColor, progress);
  
  // Apply to all particles - Method 1: Direct particles array
  if (link.particles && Array.isArray(link.particles)) {
    for (const particle of link.particles) {
      if (particle && particle.material) {
        if (particle.material.color) {
          particle.material.color.copy(currentColor);
        }
        if (particle.material.emissive) {
          particle.material.emissive.copy(currentColor);
        }
      }
    }
  }
  
  // Apply to all particles - Method 2: Particle stream group
  if (link.particleStream && link.particleStream.userData?.particles) {
    const particles = link.particleStream.userData.particles;
    for (const particle of particles) {
      if (particle && particle.material) {
        if (particle.material.color) {
          particle.material.color.copy(currentColor);
        }
        if (particle.material.emissive) {
          particle.material.emissive.copy(currentColor);
        }
      }
    }
  }
}

/**
 * Initialize particle colors on link creation
 * Called during link setup to sync particles with synergy
 * 
 * @param {Object} link - Link object
 */
export function initializeParticleSynergyColors(link) {
  if (!link) return;
  
  // Get synergy from link (default to 0.5)
  const synergy = link['synergyScore'] ?? 0.5;
  
  // Apply initial color to particles
  applySynergyColorToParticles(link, synergy);
}

/**
 * Update particle stream opacity based on synergy magnitude
 * Higher synergy → brighter, more visible particles
 * Lower synergy → dimmer, more subtle particles
 * 
 * @param {Object} link - Link object
 * @param {number} synergy - Synergy value (0-1)
 * @param {number} baseOpacity - Base opacity value (default: 0.6)
 */
export function updateParticleSynergyOpacity(link, synergy, baseOpacity = 0.6) {
  if (!link) return;
  
  // Scale opacity: 0.3-0.9 range based on synergy
  const scaledOpacity = 0.3 + synergy * 0.6;
  const finalOpacity = baseOpacity * scaledOpacity;
  
  // Method 1: Direct particles array
  if (link.particles && Array.isArray(link.particles)) {
    for (const particle of link.particles) {
      if (particle && particle.material) {
        particle.material.opacity = finalOpacity;
      }
    }
  }
  
  // Method 2: Particle stream group
  if (link.particleStream && link.particleStream.userData?.particles) {
    const particles = link.particleStream.userData.particles;
    for (const particle of particles) {
      if (particle && particle.material) {
        particle.material.opacity = finalOpacity;
      }
    }
  }
}

/**
 * Update particle emissive intensity based on synergy
 * High synergy → particles glow brightly
 * Low synergy → particles barely glow
 * 
 * @param {Object} link - Link object
 * @param {number} synergy - Synergy value (0-1)
 */
export function updateParticleSynergyEmissive(link, synergy) {
  if (!link) return;
  
  // Scale emissive intensity: 0.1-0.5 range
  const emissiveIntensity = 0.1 + synergy * 0.4;
  
  // Method 1: Direct particles array
  if (link.particles && Array.isArray(link.particles)) {
    for (const particle of link.particles) {
      if (particle && particle.material) {
        particle.material.emissiveIntensity = emissiveIntensity;
      }
    }
  }
  
  // Method 2: Particle stream group
  if (link.particleStream && link.particleStream.userData?.particles) {
    const particles = link.particleStream.userData.particles;
    for (const particle of particles) {
      if (particle && particle.material) {
        particle.material.emissiveIntensity = emissiveIntensity;
      }
    }
  }
}

/**
 * Update particle speed inversely correlated with corruption
 * High corruption → Slow particles (degraded link)
 * Low corruption → Fast particles (healthy link)
 * 
 * @param {Object} link - Link object
 * @param {number} corruption - Corruption value (0-1)
 */
export function updateParticleCorruptionSpeed(link, corruption) {
  if (!link) return;
  
  // Clamp corruption to 0-1
  corruption = Math.max(0, Math.min(1, corruption));
  
  // Inverse correlation: 1.0 - corruption
  // corruption 0.0 → speedScale 1.0 (full speed)
  // corruption 0.5 → speedScale 0.5 (half speed)
  // corruption 1.0 → speedScale 0.0 (stopped)
  const speedScale = 1.0 - corruption;
  
  // Method 1: Direct particles array (extreme mode)
  if (link.particles && Array.isArray(link.particles)) {
    for (const particle of link.particles) {
      if (particle && particle.userData) {
        // Store base speed if not already stored
        if (particle.userData.baseSpeed === undefined) {
          particle.userData.baseSpeed = particle.userData.speed || 0.4;
        }
        // Apply corruption-based speed scale
        particle.userData.speed = particle.userData.baseSpeed * speedScale;
      }
    }
  }
  
  // Method 2: Particle stream group (SAFE VFX)
  if (link.particleStream && link.particleStream.userData) {
    // Store base flow speed if not already stored
    if (link.particleStream.userData.baseFlowSpeed === undefined) {
      link.particleStream.userData.baseFlowSpeed = link.particleStream.userData.flowSpeed || 0.5;
    }
    // Apply corruption-based speed scale
    link.particleStream.userData.flowSpeed = link.particleStream.userData.baseFlowSpeed * speedScale;
    
    // Also update individual particle speeds in stream
    if (link.particleStream.userData.particles) {
      for (const particle of link.particleStream.userData.particles) {
        if (particle && particle.userData) {
          if (particle.userData.baseSpeed === undefined) {
            particle.userData.baseSpeed = particle.userData.speed || 0.4;
          }
          particle.userData.speed = particle.userData.baseSpeed * speedScale;
        }
      }
    }
  }
}

/**
 * Get corruption-based speed multiplier
 * Useful for monitoring or conditional logic
 * 
 * @param {number} corruption - Corruption value (0-1)
 * @returns {number} Speed multiplier (0-1)
 */
export function getCorruptionSpeedMultiplier(corruption) {
  corruption = Math.max(0, Math.min(1, corruption));
  return 1.0 - corruption;
}

/**
 * Get count of particles in link
 * Useful for debugging or conditional logic
 * 
 * @param {Object} link - Link object
 * @returns {number} Total particle count
 */
export function getParticleCount(link) {
  if (!link) return 0;
  
  let count = 0;
  
  // Count direct particles
  if (link.particles && Array.isArray(link.particles)) {
    count += link.particles.length;
  }
  
  // Count particle stream particles
  if (link.particleStream && link.particleStream.userData?.particles) {
    count += link.particleStream.userData.particles.length;
  }
  
  return count;
}

/**
 * Batch update particle colors and properties across multiple links
 * Efficient for network-wide particle synchronization
 * 
 * @param {Array} links - Array of link objects
 * @param {Function} synergyGetter - Function(link) → synergy value
 * @param {Object} options - Optional parameters
 * @param {boolean} options.updateOpacity - Also update opacity (default: false)
 * @param {boolean} options.updateEmissive - Also update emissive (default: false)
 */
export function batchUpdateParticleColors(links, synergyGetter, options = {}) {
  const { updateOpacity = false, updateEmissive = false } = options;
  
  for (const link of links) {
    const synergy = synergyGetter(link);
    
    // Update particle colors
    applySynergyColorToParticles(link, synergy);
    
    // Optional: update opacity
    if (updateOpacity) {
      updateParticleSynergyOpacity(link, synergy);
    }
    
    // Optional: update emissive
    if (updateEmissive) {
      updateParticleSynergyEmissive(link, synergy);
    }
  }
}

/**
 * Verify particle color system is properly initialized
 * Dev-mode assertion for catching integration bugs
 * 
 * @param {Object} link - Link object to verify
 * @returns {boolean} True if particles are properly set up
 */
export function verifyParticleColorInitialization(link) {
  if (!link) return false;
  
  const hasDirectParticles = link.particles && Array.isArray(link.particles) && link.particles.length > 0;
  const hasParticleStream = link.particleStream && link.particleStream.userData?.particles;
  const hasAnySynergyColor = link['synergyColor'] !== undefined;
  
  const isValid = (hasDirectParticles || hasParticleStream) && hasAnySynergyColor;
  
  if (!isValid && typeof window !== 'undefined' && window.DEBUG_SYNERGY_COLORS) {
    console.warn('[LinkSynergyColorTransition] Incomplete particle initialization:', {
      hasDirectParticles,
      hasParticleStream,
      hasAnySynergyColor,
      link
    });
  }
  
  return isValid;
}

/**
 * Export synergy color system as a complete module
 * For easy injection into NodeLinkingSystem
 */
export const LinkSynergyColorTransitionSystem = {
  // Color computation
  computeSynergyColor,
  
  // Link mesh updates
  applySynergyColorToLink,
  updateLinkSynergyColor,
  updateLinkColorTransition,
  
  // Particle updates
  applySynergyColorToParticles,
  updateParticleColorTransition,
  initializeParticleSynergyColors,
  updateParticleSynergyOpacity,
  updateParticleSynergyEmissive,
  
  // Particle corruption speed
  updateParticleCorruptionSpeed,
  getCorruptionSpeedMultiplier,
  
  // Utilities
  getParticleCount,
  batchUpdateParticleColors,
  getSynergyLevel,
  batchUpdateLinkColors,
  initializeLinkSynergyColor,
  verifyLinkColorInitialization,
  verifyParticleColorInitialization
};

export default LinkSynergyColorTransitionSystem;
