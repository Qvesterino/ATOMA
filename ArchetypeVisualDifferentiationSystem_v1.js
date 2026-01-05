// === THREE SAFE LOADER (v1.1) ===
// The system must NOT crash if THREE is missing (e.g. Rosebud runtime)
// Try to import THREE safely, fallback to window/globalThis, otherwise disable features.

let THREE_SAFE = null;

// Try global THREE first (works in browser + Atoma engine immediately)
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

if (!THREE_SAFE) {
  console.warn('[ArchetypeVisualSystem] THREE not detected – enabling SAFE MODE (no Color, no Material edits).');
}

// Expose as THREE
const THREE = THREE_SAFE;

/**
 * ARCHETYPE VISUAL DIFFERENTIATION SYSTEM v1.0
 * 
 * Applies distinct visual treatments to nodes based on their extreme archetype.
 * Integrates seamlessly with existing visual bootstrap and personality systems.
 * 
 * Features:
 * - Per-archetype color shifts with HSL adjustments
 * - Customized animation parameters (rotation, pulse, float)
 * - Dynamic particle system modifications
 * - Archetype-specific glow characteristics
 * - Shader parameter customization
 * - Non-breaking integration with existing code
 * - Performance optimized with safe material handling
 */

import { ArchetypeVisualProfiles } from './ArchetypeVisualProfiles_v1.js';
import { ArchetypeVisualTransitionEngine_v2 } from './ArchetypeVisualTransitionEngine_v2.js';

export class ArchetypeVisualDifferentiationSystem_v1 {
  constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.appliedArchetypes = new Map();
    this.modifiedNodes = new Set();
    this.transitionEngine = new ArchetypeVisualTransitionEngine_v2(debugMode);
    
    if (this.debugMode) {
      console.log('%c[ArchetypeVisualDifferentiationSystem_v1] Initialized with Transition Engine v2.0', 'color: cyan; font-weight: bold;');
    }
  }

  /**
   * Apply archetype visual differentiation to a node
   */
  applyArchetypeToNode(nodeModel, archetypeName) {
    if (!nodeModel || !nodeModel.userData) return;

    const profile = ArchetypeVisualProfiles.getProfileForArchetype(archetypeName);
    
    // Store original values for reference
    if (!nodeModel.userData.originalArchetype) {
      nodeModel.userData.originalArchetype = archetypeName;
      nodeModel.userData.archetypeProfile = profile;
      nodeModel.userData.archetypeVisualsApplied = true;
    }

    // Apply color shifts
    this.applyColorShifts(nodeModel, profile.colorShift);

    // Apply animation parameters
    this.applyAnimationParameters(nodeModel, profile.animation);

    // Apply particle modifications
    this.applyParticleModifications(nodeModel, profile.particles);

    // Apply glow characteristics
    this.applyGlowModifications(nodeModel, profile.glow);

    // Apply shader parameters
    this.applyShaderParameters(nodeModel, profile.shader);

    this.appliedArchetypes.set(nodeModel, archetypeName);
    this.modifiedNodes.add(nodeModel);

    if (this.debugMode) {
      console.log(`%c[Archetype] Applied ${archetypeName} to node`, 'color: #00ff88;', {
        colorShift: profile.colorShift,
        animationSpeed: profile.animation.rotationSpeed,
        particleCount: profile.particles.count,
        glowIntensity: profile.glow.intensity
      });
    }
  }

  /**
   * Apply HSL color shifts to node materials
   */
  applyColorShifts(nodeModel, colorShift) {
    if (!colorShift || !THREE) return;  // Guard: skip if THREE missing

    nodeModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      // Skip edge lines and VFX elements
      if (child.userData.isVFX || child.userData.edgeGlow) return;

      const material = child.material;
      if (!material || !material.color) return;  // Guard: skip if material not ready

      // Only modify standard materials (not basic)
      if (material.isMeshStandardMaterial || 
          material.isMeshPhongMaterial || 
          material.isMeshLambertMaterial) {
        
        // Store original color if not already stored
        if (!child.userData.originalColor) {
          child.userData.originalColor = material.color.getHex();
        }

        // Apply HSL shift
        const originalColor = new THREE.Color(child.userData.originalColor);
        const shifted = this.shiftHSL(originalColor, colorShift);
        
        material.color.copy(shifted);

        // Adjust emissive with same shift
        if (material.emissive && this.isMaterialEmissiveCapable(material)) {
          if (!child.userData.originalEmissive) {
            child.userData.originalEmissive = material.emissive.getHex();
          }
          const emissiveShifted = this.shiftHSL(
            new THREE.Color(child.userData.originalEmissive),
            colorShift
          );
          material.emissive.copy(emissiveShifted);
        }
      }
    });
  }

  /**
   * Apply animation speed modifiers
   */
  applyAnimationParameters(nodeModel, animation) {
    if (!animation) return;

    if (!nodeModel.userData) nodeModel.userData = {};

    // Store original values
    if (!nodeModel.userData.originalAnimation) {
      nodeModel.userData.originalAnimation = {
        rotationSpeed: nodeModel.userData.rotationSpeed || 0.3,
        pulseSpeed: nodeModel.userData.pulseSpeed || 1.0,
        floatAmplitude: nodeModel.userData.floatAmplitude || 0.1
      };
    }

    // Apply modifiers
    nodeModel.userData.rotationSpeedMult = animation.rotationSpeed / 0.3;
    nodeModel.userData.pulseSpeedMult = animation.pulseSpeed / 1.0;
    nodeModel.userData.floatAmplitudeMult = animation.floatAmplitude / 0.1;

    if (this.debugMode) {
      console.log(`%c[Animation] Mults:`, 'color: #ffaa00;', {
        rotation: nodeModel.userData.rotationSpeedMult.toFixed(2),
        pulse: nodeModel.userData.pulseSpeedMult.toFixed(2),
        float: nodeModel.userData.floatAmplitudeMult.toFixed(2)
      });
    }
  }

  /**
   * Modify particle system characteristics
   */
  applyParticleModifications(nodeModel, particleConfig) {
    if (!particleConfig || !nodeModel.userData.particles) return;

    const { count, velocity, lifetime, spread } = particleConfig;

    // Adjust existing particles
    nodeModel.userData.particles.forEach((particle, index) => {
      if (!particle.userData) particle.userData = {};

      // Store original if needed
      if (!particle.userData.originalVelocity) {
        particle.userData.originalVelocity = 1.0;
        particle.userData.originalLifetime = 2.0;
      }

      // Apply modifiers
      particle.userData.velocityMult = velocity || 1.0;
      particle.userData.lifetimeMult = lifetime || 1.0;
      particle.userData.spreadMult = spread || 1.0;
    });

    // Store particle target count (may add/remove particles dynamically)
    nodeModel.userData.particleCountTarget = count || nodeModel.userData.particles.length;
  }

  /**
   * Modify glow/aura characteristics
   */
  applyGlowModifications(nodeModel, glowConfig) {
    if (!glowConfig) return;
    if (!THREE) return;  // Guard: skip if THREE missing

    if (!nodeModel.userData) nodeModel.userData = {};

    nodeModel.userData.glowIntensityMult = glowConfig.intensity / 0.3 || 1.0;
    nodeModel.userData.glowRadiusMult = glowConfig.radius || 1.0;
    nodeModel.userData.breathingAmountMult = glowConfig.breathingAmount / 0.2 || 1.0;

    // Apply to glow mesh if exists
    if (nodeModel.userData.vfxGlow) {
      const glowMat = nodeModel.userData.vfxGlow.material;
      if (glowMat && glowMat.isMeshBasicMaterial) {
        // Store original opacity
        if (!nodeModel.userData.originalGlowOpacity) {
          nodeModel.userData.originalGlowOpacity = glowMat.opacity;
        }
        // Apply intensity modifier
        glowMat.opacity = nodeModel.userData.originalGlowOpacity * nodeModel.userData.glowIntensityMult;
      }
    }

    // Apply to halo if exists
    if (nodeModel.userData.vfxHalo) {
      const haloBat = nodeModel.userData.vfxHalo.material;
      if (haloBat && haloBat.isMeshBasicMaterial) {
        if (!nodeModel.userData.originalHaloOpacity) {
          nodeModel.userData.originalHaloOpacity = haloBat.opacity;
        }
        haloBat.opacity = nodeModel.userData.originalHaloOpacity * nodeModel.userData.glowIntensityMult * 0.5;
      }
    }
  }

  /**
   * Apply shader parameter customizations
   */
  applyShaderParameters(nodeModel, shaderConfig) {
    if (!shaderConfig) return;

    if (!nodeModel.userData) nodeModel.userData = {};

    nodeModel.userData.shaderDistortionMult = shaderConfig.distortion || 0.0;
    nodeModel.userData.shaderFrequencyMult = shaderConfig.frequency || 1.0;
    nodeModel.userData.shaderAmplitudeMult = shaderConfig.amplitude || 0.5;
  }

  /**
   * HSL color shifting utility
   */
  shiftHSL(color, shift) {
    if (!THREE) return color;  // Guard: return unchanged if THREE missing
    
    const rgb = { r: color.r, g: color.g, b: color.b };
    const { h, s, l } = this.rgbToHSL(rgb);

    // Apply shifts
    const newHue = (h + shift.hueRotation / 360) % 1;
    const newSat = Math.max(0, Math.min(1, s * shift.saturation));
    const newLum = Math.max(0, Math.min(1, l * shift.luminance));

    const newRGB = this.hslToRGB({ h: newHue, s: newSat, l: newLum });
    return new THREE.Color(newRGB.r, newRGB.g, newRGB.b);
  }

  /**
   * RGB to HSL conversion
   */
  rgbToHSL(rgb) {
    const r = rgb.r, g = rgb.g, b = rgb.b;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h, s, l };
  }

  /**
   * HSL to RGB conversion
   */
  hslToRGB(hsl) {
    const h = hsl.h, s = hsl.s, l = hsl.l;
    let r, g, b;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r, g, b };
  }

  /**
   * Check if material supports emissive
   */
  isMaterialEmissiveCapable(material) {
    return material.isMeshStandardMaterial ||
           material.isMeshPhongMaterial ||
           material.isMeshLambertMaterial ||
           material.isMeshToonMaterial;
  }

  /**
   * Remove archetype visual differentiation from a node
   */
  removeArchetypeFromNode(nodeModel) {
    if (!nodeModel || !nodeModel.userData) return;

    // Restore original colors
    nodeModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (child.userData.originalColor) {
        child.material.color.setHex(child.userData.originalColor);
      }
      if (child.userData.originalEmissive && child.material.emissive) {
        child.material.emissive.setHex(child.userData.originalEmissive);
      }
    });

    // Clear archetype data
    nodeModel.userData.archetypeVisualsApplied = false;
    delete nodeModel.userData.originalArchetype;
    delete nodeModel.userData.archetypeProfile;
    delete nodeModel.userData.rotationSpeedMult;
    delete nodeModel.userData.pulseSpeedMult;
    delete nodeModel.userData.floatAmplitudeMult;

    this.modifiedNodes.delete(nodeModel);
    this.appliedArchetypes.delete(nodeModel);
  }

  /**
   * Update archetype visual effects per frame
   */
  updateArchetypeEffects(nodeModel, deltaTime, time) {
    if (!nodeModel.userData || !nodeModel.userData.archetypeVisualsApplied) return;

    const userData = nodeModel.userData;
    const profile = userData.archetypeProfile;

    // Update rotation multiplier
    if (userData.rotationSpeedMult) {
      const baseMult = 0.3;
      nodeModel.rotation.y += deltaTime * baseMult * userData.rotationSpeedMult;
    }

    // Update breathing glow
    if (userData.glowIntensityMult && userData.vfxGlow) {
      const breathe = Math.sin(time * (userData.pulseSpeedMult || 1.0)) * 
                      (profile.glow.breathingAmount || 0.2);
      userData.vfxGlow.scale.set(
        1 + breathe * (userData.glowRadiusMult || 1.0) * 0.1,
        1 + breathe * (userData.glowRadiusMult || 1.0) * 0.1,
        1 + breathe * (userData.glowRadiusMult || 1.0) * 0.1
      );
    }

    // Update particle orbital dynamics if custom velocity set
    if (userData.particles && userData.particles.length > 0) {
      userData.particles.forEach((particle) => {
        if (particle.userData && particle.userData.velocityMult) {
          const angle = (time * 0.5 * particle.userData.velocityMult) || 0;
          const radius = particle.userData.orbitRadius || 1.4;
          particle.position.x = Math.cos(angle) * radius * particle.userData.spreadMult;
          particle.position.z = Math.sin(angle) * radius * particle.userData.spreadMult;
        }
      });
    }
  }

  /**
   * Update all active archetype transitions (call once per frame)
   */
  updateTransitions(deltaTime) {
    this.transitionEngine.updateTransitions(deltaTime, this);
  }

  /**
   * Get archetype info for a node
   */
  getArchetypeInfo(nodeModel) {
    if (!nodeModel.userData || !nodeModel.userData.originalArchetype) {
      return null;
    }
    const profile = ArchetypeVisualProfiles.getProfileForArchetype(nodeModel.userData.originalArchetype);
    return {
      name: nodeModel.userData.originalArchetype,
      traitName: profile.traitName,
      description: profile.description,
      profile: profile
    };
  }

  /**
   * Get all modified nodes
   */
  getModifiedNodes() {
    return Array.from(this.modifiedNodes);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const stats = {
      totalModifiedNodes: this.modifiedNodes.size,
      archetypesApplied: new Map()
    };

    this.appliedArchetypes.forEach((archetype) => {
      const count = stats.archetypesApplied.get(archetype) || 0;
      stats.archetypesApplied.set(archetype, count + 1);
    });

    return stats;
  }

  /**
   * Setup console API for debugging
   */
  static setupConsoleAPI(instance) {
    if (!window.archetypeVisualDebug) {
      window.archetypeVisualDebug = {
        instance: instance,
        
        // Get info about a node's archetype
        info: function(nodeModel) {
          const info = instance.getArchetypeInfo(nodeModel);
          if (info) {
            console.log('%cArchetype Information:', 'font-weight: bold; color: cyan;', info);
          } else {
            console.log('Node has no archetype applied');
          }
        },

        // List all modified nodes
        list: function() {
          const stats = instance.getStatistics();
          console.log('%cArchetype Visual System Statistics:', 'font-weight: bold; color: cyan;');
          console.log('Modified nodes:', stats.totalModifiedNodes);
          console.log('Archetypes applied:', stats.archetypesApplied);
        },

        // Get profile for an archetype
        profile: function(archetypeName) {
          const profile = ArchetypeVisualProfiles.getProfileForArchetype(archetypeName);
          console.log(`%cProfile for ${archetypeName}:`, 'font-weight: bold; color: #ffaa00;', profile);
        }
      };
      console.log('%c[ArchetypeVisualDifferentiationSystem] Console API available at window.archetypeVisualDebug', 'color: cyan;');
    }
  }
}
