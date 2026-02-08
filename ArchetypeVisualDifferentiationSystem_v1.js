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
    this.overlayGroups = new Map();          // node -> overlay group
    this.overlayParams = new Map();          // node -> param state for animation/transitions
    this.metrics = {
      activeOverlayCount: 0,
      duplicateOverlayPreventedCount: 0,
      disposeCount: 0
    };
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
    if (nodeModel.userData._archetypeApplied === true && !nodeModel.userData._archetypeDirty) {
      if (typeof window !== 'undefined' && window.ATOMA_DEBUG_ARCHETYPE_REAPPLY) {
        console.log('[ARCHETYPE] apply skipped (already applied)', nodeModel.id || nodeModel.uuid);
      }
      return;
    }

    const profile = ArchetypeVisualProfiles.getProfileForArchetype(archetypeName);
    
    // Track overlay parameters (deterministic, overlay-only)
    this.overlayParams.set(nodeModel, {
      archetypeName,
      profile,
      colorShift: profile.colorShift,
      animation: { ...profile.animation },
      glow: { ...profile.glow },
      particles: { ...profile.particles }
    });

    // Ensure single overlay group
    const overlayGroup = this.ensureOverlayGroup(nodeModel);

    // Build / rebuild overlay visuals based on profile
    this.buildOverlayForProfile(nodeModel, overlayGroup, profile);

    this.appliedArchetypes.set(nodeModel, archetypeName);
    this.modifiedNodes.add(nodeModel);
    nodeModel.userData._archetypeApplied = true;
    nodeModel.userData._archetypeDirty = false;
    if (typeof window !== 'undefined' && window.ATOMA_DEBUG_ARCHETYPE_REAPPLY) {
      console.log('[ARCHETYPE] apply executed', nodeModel.id || nodeModel.uuid, archetypeName);
    }

    if (this.debugMode) {
      console.log(`%c[Archetype] Applied ${archetypeName} (overlay-only)`, 'color: #00ff88;', {
        overlayId: overlayGroup?.name,
        animationSpeed: profile.animation.rotationSpeed,
        particleCount: profile.particles.count,
        glowIntensity: profile.glow.intensity
      });
    }
  }

  /**
   * Apply HSL color shifts to node materials
   */
  // Overlay-only color application: handled in buildOverlayForProfile

  /**
   * Apply animation speed modifiers
   */
  // Animation parameters now live in overlayParams; no direct base writes

  /**
   * Modify particle system characteristics
   */
  // Particle modifications handled by overlay particles only

  /**
   * Modify glow/aura characteristics
   */
  applyGlowModifications(nodeModel, glowConfig) {
    // Overlay-only: store params; application happens in build/update overlay
    const params = this.overlayParams.get(nodeModel);
    if (params) {
      params.glow = { ...params.glow, ...glowConfig };
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
    const overlayGroup = this.overlayGroups.get(nodeModel);
    const params = this.overlayParams.get(nodeModel);
    if (!overlayGroup || !params) return;

    const profile = params.profile;
    const overlayData = overlayGroup.userData;

    // Rotation of overlay shell (simulate prior node rotation mult)
    const rotationSpeedMult = profile?.animation?.rotationSpeed ? (profile.animation.rotationSpeed / 0.3) : 1;
    overlayGroup.rotation.y += deltaTime * 0.3 * rotationSpeedMult;

    // Breathing glow scale/opacity on overlay glow
    if (overlayData.glowMesh) {
      const pulseSpeed = profile?.animation?.pulseSpeed || 1.0;
      const breathe = Math.sin(time * pulseSpeed) * (profile?.glow?.breathingAmount || 0.2);
      const radiusMult = (profile?.glow?.radius || 1.0);
      const scaleVal = 1 + breathe * radiusMult * 0.1;
      overlayData.glowMesh.scale.set(scaleVal, scaleVal, scaleVal);
      const baseOpacity = profile?.glow?.intensity ?? 0.3;
      overlayData.glowMesh.material.opacity = Math.max(0, Math.min(1, baseOpacity));
    }

    // Overlay particles orbit update
    if (overlayData.particles && overlayData.particles.length > 0) {
      overlayData.particles.forEach((particle, idx) => {
        const vel = particle.userData.velocityMult || 1.0;
        const spread = particle.userData.spreadMult || 1.0;
        const angle = (time * 0.5 * vel) + particle.userData.phase;
        const radius = (particle.userData.orbitRadius || 1.4) * spread;
        particle.position.x = Math.cos(angle) * radius;
        particle.position.z = Math.sin(angle) * radius;
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
   * Remove archetype overlay from a node
   */
  removeArchetypeFromNode(nodeModel) {
    const overlayGroup = this.overlayGroups.get(nodeModel);
    if (overlayGroup) {
      this.disposeGroup(overlayGroup);
      if (overlayGroup.parent) overlayGroup.parent.remove(overlayGroup);
      this.overlayGroups.delete(nodeModel);
      this.metrics.disposeCount++;
      this.metrics.activeOverlayCount = Math.max(0, this.metrics.activeOverlayCount - 1);
    }
    this.overlayParams.delete(nodeModel);
    this.appliedArchetypes.delete(nodeModel);
    this.modifiedNodes.delete(nodeModel);
  }

  /**
   * Ensure overlay group exists (one per node)
   */
  ensureOverlayGroup(nodeModel) {
    // Guard: return null if THREE is not available (SAFE MODE)
    if (!THREE) return null;

    let group = this.overlayGroups.get(nodeModel);
    const nodeId = nodeModel.uuid || nodeModel.id || 'node';
    if (group && group.parent !== nodeModel) {
      if (group.parent) group.parent.remove(group);
      group = null;
    }
    if (!group) {
      group = new THREE.Group();
      group.name = `ArchetypeOverlay::${nodeId}`;
      nodeModel.add(group);
      this.overlayGroups.set(nodeModel, group);
      this.metrics.activeOverlayCount++;
    } else {
      // clear existing children to avoid duplication
      this.disposeGroup(group);
      this.metrics.duplicateOverlayPreventedCount++;
    }
    group.userData = group.userData || {};
    group.userData.glowMesh = null;
    group.userData.particles = [];
    return group;
  }

  /**
   * Build overlay meshes to represent the archetype profile
   */
  buildOverlayForProfile(nodeModel, overlayGroup, profile) {
    if (!THREE || !overlayGroup || !profile) return;
    this.disposeGroup(overlayGroup);

    // derive tint from color shift applied to a base color sample (read-only)
    const baseColor = this.readBaseColor(nodeModel);
    const targetColor = this.shiftHSL(new THREE.Color(baseColor), profile.colorShift || { hueRotation:0, saturation:1, luminance:1 });

    // Glow sphere
    const glowGeom = new THREE.SphereGeometry(1.0, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: targetColor,
      transparent: true,
      opacity: profile.glow?.intensity ?? 0.25,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeom, glowMat);
    glowMesh.userData.type = 'archetypeGlow';
    overlayGroup.add(glowMesh);
    overlayGroup.userData.glowMesh = glowMesh;

    // Rim/halo torus
    const rimGeom = new THREE.TorusGeometry(1.2, 0.05, 12, 64);
    const rimMat = new THREE.MeshBasicMaterial({
      color: targetColor,
      transparent: true,
      opacity: (profile.glow?.opacity ?? 0.25),
      emissive: targetColor,
      emissiveIntensity: profile.glow?.intensity ?? 0.25
    });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.userData.type = 'archetypeRim';
    overlayGroup.add(rim);

    // Particles (lightweight)
    const particles = [];
    const count = profile.particles?.count ?? 0;
    if (count > 0) {
      const pGeom = new THREE.SphereGeometry(0.05, 6, 6);
      for (let i = 0; i < count; i++) {
        const phase = this.seededRandom(nodeModel.uuid || nodeModel.id || 'node', `p-phase-${i}`) * Math.PI * 2;
        const pMat = new THREE.MeshBasicMaterial({
          color: targetColor,
          transparent: true,
          opacity: 0.25
        });
        const p = new THREE.Mesh(pGeom, pMat);
        p.userData = {
          velocityMult: profile.particles?.velocity || 1.0,
          spreadMult: profile.particles?.spread || 1.0,
          orbitRadius: 1.4,
          phase
        };
        p.position.set(Math.cos(phase) * 1.4, 0, Math.sin(phase) * 1.4);
        overlayGroup.add(p);
        particles.push(p);
      }
    }
    overlayGroup.userData.particles = particles;
  }

  /**
   * Read a representative base color without mutating it
   */
  readBaseColor(nodeModel) {
    if (nodeModel.userData?.layerColors?.primary) return nodeModel.userData.layerColors.primary;
    if (nodeModel.userData?.baseColor) return nodeModel.userData.baseColor;
    let sampled = 0x00ffff;
    nodeModel.traverse((child) => {
      if (child.isMesh && child.material?.color) {
        sampled = child.material.color.getHex();
      }
    });
    return sampled;
  }

  disposeGroup(group) {
    if (!group) return;
    const children = [...group.children];
    children.forEach(c => {
      group.remove(c);
      this.disposeObject(c);
    });
  }

  disposeObject(obj) {
    if (!obj) return;
    obj.traverse((child) => {
      if (child.geometry) child.geometry.dispose?.();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.());
        else child.material.dispose?.();
      }
    });
  }

  seededRandom(id, salt = '') {
    const str = `${id || 'node'}:${salt}`;
    let h = 0;
    for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    const x = Math.sin(h) * 10000;
    return x - Math.floor(x);
  }
 //  * Get statistics
 //  */
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
