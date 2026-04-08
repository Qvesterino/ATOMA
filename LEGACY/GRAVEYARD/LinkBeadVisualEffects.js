/**
 * ============================================================================
 * LINK BEAD VISUAL EFFECTS
 * ============================================================================
 * 
 * Optional visual enhancement layer for beads.
 * Adds subtle effects like soft trails, pulsing, and environmental reactions.
 * 
 * DESIGN:
 * - All effects are optional and configurable
 * - Never creates visual noise
 * - Maintains calm aesthetic
 * - Non-intrusive (disabled by default)
 * 
 * ============================================================================
 */

import * as THREE from 'three';

export const BEAD_EFFECTS_CONFIG = {
  // Soft trail effect (disabled by default)
  trails: {
    enabled: false,
    maxTrailLength: 5,           // Number of trail points
    trailOpacity: 0.15,          // Fade of trail
    updateFrequency: 2            // Update every N frames
  },
  
  // Pulsing glow (subtle)
  pulsing: {
    enabled: false,
    frequency: 2.0,              // Hz
    minIntensity: 0.8,           // Min emissive intensity
    maxIntensity: 1.2            // Max emissive intensity
  },
  
  // Environmental light reaction
  environmentReaction: {
    enabled: false,
    radius: 0.5,                 // Effect radius
    intensity: 0.3               // Light intensity
  },
  
  // Subtle rotation (visual interest)
  rotation: {
    enabled: false,
    speed: 1.0                   // Rotation speed (rad/sec)
  }
};

/**
 * Add visual effects to a bead mesh
 */
export function applyBeadEffects(beadMesh, effectsConfig = BEAD_EFFECTS_CONFIG) {
  if (!beadMesh) return;
  
  // Initialize effects state
  beadMesh.userData.effects = {
    trails: [],
    pulsePhase: 0,
    rotationPhase: 0,
    lastTrailUpdate: 0,
    trailUpdateCounter: 0
  };
  
  // Add trail geometry if enabled
  if (effectsConfig.trails.enabled) {
    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(effectsConfig.trails.maxTrailLength * 3);
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const trailMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: effectsConfig.trails.trailOpacity,
      color: beadMesh.material.color,
      linewidth: 1,
      depthWrite: false
    });
    
    const trailLine = new THREE.Line(trailGeometry, trailMaterial);
    trailLine.userData = { isBeadTrail: true };
    beadMesh.userData.trailLine = trailLine;
    
    // Add to parent for rendering
    if (beadMesh.parent) {
      beadMesh.parent.add(trailLine);
    }
  }
}

/**
 * Update bead visual effects each frame
 */
export function updateBeadEffects(beadMesh, deltaTime, effectsConfig = BEAD_EFFECTS_CONFIG) {
  if (!beadMesh || !beadMesh.userData.effects) return;
  
  const effects = beadMesh.userData.effects;
  
  // Update pulsing effect
  if (effectsConfig.pulsing.enabled && beadMesh.material) {
    effects.pulsePhase += deltaTime * effectsConfig.pulsing.frequency * Math.PI * 2;
    const pulseIntensity = (Math.sin(effects.pulsePhase) + 1) / 2; // 0-1
    const mapped = effectsConfig.pulsing.minIntensity +
                   (effectsConfig.pulsing.maxIntensity - effectsConfig.pulsing.minIntensity) * pulseIntensity;
    beadMesh.material.emissiveIntensity = mapped;
  }
  
  // Update rotation effect
  if (effectsConfig.rotation.enabled && beadMesh.geometry) {
    effects.rotationPhase += deltaTime * effectsConfig.rotation.speed;
    beadMesh.rotation.x = effects.rotationPhase;
    beadMesh.rotation.y = effects.rotationPhase * 0.7;
  }
  
  // Update trail effect
  if (effectsConfig.trails.enabled && beadMesh.userData.trailLine) {
    effects.trailUpdateCounter++;
    
    if (effects.trailUpdateCounter >= effectsConfig.trails.updateFrequency) {
      effects.trailUpdateCounter = 0;
      
      // Add current position to trail
      const newPoint = beadMesh.position.clone();
      effects.trails.unshift(newPoint);
      
      // Keep trail at max length
      if (effects.trails.length > effectsConfig.trails.maxTrailLength) {
        effects.trails.pop();
      }
      
      // Update trail line geometry
      const trailGeometry = beadMesh.userData.trailLine.geometry;
      const positions = trailGeometry.attributes.position.array;
      
      for (let i = 0; i < effects.trails.length; i++) {
        const point = effects.trails[i];
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      }
      
      // Update geometry
      trailGeometry.attributes.position.needsUpdate = true;
      trailGeometry.setDrawRange(0, effects.trails.length);
    }
  }
}

/**
 * Remove visual effects from bead
 */
export function removeBeadEffects(beadMesh) {
  if (!beadMesh) return;
  
  // Remove trail line if it exists
  if (beadMesh.userData.trailLine) {
    if (beadMesh.userData.trailLine.parent) {
      beadMesh.userData.trailLine.parent.remove(beadMesh.userData.trailLine);
    }
    beadMesh.userData.trailLine.geometry.dispose();
    beadMesh.userData.trailLine.material.dispose();
  }
  
  // Clear effects state
  beadMesh.userData.effects = null;
}

/**
 * Enable effects globally
 */
export function enableBeadEffects(config = {}) {
  Object.assign(BEAD_EFFECTS_CONFIG, config);
  BEAD_EFFECTS_CONFIG.trails.enabled = true;
}

/**
 * Disable effects globally
 */
export function disableBeadEffects() {
  BEAD_EFFECTS_CONFIG.trails.enabled = false;
  BEAD_EFFECTS_CONFIG.pulsing.enabled = false;
  BEAD_EFFECTS_CONFIG.rotation.enabled = false;
  BEAD_EFFECTS_CONFIG.environmentReaction.enabled = false;
}

export default {
  BEAD_EFFECTS_CONFIG,
  applyBeadEffects,
  updateBeadEffects,
  removeBeadEffects,
  enableBeadEffects,
  disableBeadEffects
};
