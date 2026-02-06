// === THREE SAFE LOADER (v1.1) ===
let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

if (!THREE_SAFE) {
  console.warn('[ArchetypeVisualTransitionEngine_v2] THREE not detected – enabling SAFE MODE.');
}

const THREE = THREE_SAFE;

/**
 * ARCHETYPE VISUAL TRANSITION ENGINE v2.0
 * 
 * Handles smooth visual transitions between archetype profiles.
 * Features:
 * - Color blending (RGB or HSL)
 * - Glow transitions (intensity, radius, breathing)
 * - Animation speed easing (rotation, pulse, float)
 * - Particle count & velocity interpolation
 * - Shader parameter blending
 * - Multiple easing curves
 * - Visual FX burst on completion
 * - Full SAFE MODE support (no crashes when THREE missing)
 */

import { ArchetypeVisualProfiles } from './ArchetypeVisualProfiles_v1.js';

export class ArchetypeVisualTransitionEngine_v2 {
  constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.activeTransitions = new Map(); // Map<node, transitionState>
    
    if (this.debugMode) {
      console.log('%c[ArchetypeVisualTransitionEngine_v2] Initialized', 'color: #ff9900; font-weight: bold;');
    }
  }

  /**
   * Easing curve functions
   */
  getEasingFunction(curveName) {
    const curves = {
      'linear': (t) => t,
      'easeInOutQuad': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      'easeOutCubic': (t) => 1 + (--t) * t * t,
      'easeInCubic': (t) => t * t * t,
      'easeInOutCubic': (t) => t < 0.5 ? 4 * t * t * t : 1 + (--t) * (2 * (--t)) * (2 * t),
    };
    return curves[curveName] || curves['easeInOutQuad'];
  }

  /**
   * Start an archetype transition on a node
   */
  startTransition(nodeModel, fromProfile, toProfile, duration = 1.0, curveName = 'easeInOutQuad') {
    if (!nodeModel || !nodeModel.userData) return;

    // Create transition state
    const transitionState = {
      node: nodeModel,
      from: this.deepClone(fromProfile),
      to: this.deepClone(toProfile),
      duration: duration,
      elapsed: 0,
      curve: this.getEasingFunction(curveName),
      started: true
    };

    this.activeTransitions.set(nodeModel, transitionState);

    if (this.debugMode) {
      console.log(`%c[Transition] Started on node (duration: ${duration}s)`, 'color: #00ff88;', {
        from: fromProfile,
        to: toProfile
      });
    }
  }

  /**
   * Update all active transitions
   */
  updateTransitions(deltaTime, differentiationSystem) {
    const completedNodes = [];

    for (const [node, state] of this.activeTransitions.entries()) {
      state.elapsed += deltaTime;
      const progress = Math.min(state.elapsed / state.duration, 1.0);
      const eased = state.curve(progress);

      // Apply interpolated visual state
      this.applyTransitionFrame(node, state, eased, differentiationSystem);

      // Check if transition complete
      if (progress >= 1.0) {
        completedNodes.push(node);
      }
    }

    // Finalize and clean up completed transitions
    for (const node of completedNodes) {
      this.finalizeTransition(node);
    }
  }

  /**
   * Apply interpolated visual state for current frame
   */
  applyTransitionFrame(node, state, progress, differentiationSystem) {
    if (!node) return;

    const params = differentiationSystem.overlayParams?.get(node);
    if (!params) return;

    // Blend and store into overlay params (no base writes)
    if (state.from.colorShift && state.to.colorShift) {
      params.colorShift = this.blendColorShift(state.from.colorShift, state.to.colorShift, progress);
    }
    if (state.from.animation && state.to.animation) {
      params.animation = this.blendAnimationParameters(state.from.animation, state.to.animation, progress);
    }
    if (state.from.glow && state.to.glow) {
      params.glow = this.blendGlowCharacteristics(state.from.glow, state.to.glow, progress);
    }
    if (state.from.particles && state.to.particles) {
      params.particles = this.blendParticleConfig(state.from.particles, state.to.particles, progress);
    }
  }

  /**
   * Blend color shifts between two profiles
   */
  blendColorShift(node, fromShift, toShift, progress) {
    if (!THREE) return;

    const blend = (a, b) => a + (b - a) * progress;

    const blendedShift = {
      hueRotation: blend(fromShift.hueRotation, toShift.hueRotation),
      saturation: blend(fromShift.saturation, toShift.saturation),
      luminance: blend(fromShift.luminance, toShift.luminance)
    };

    node.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (child.userData.isVFX || child.userData.edgeGlow) return;

      const material = child.material;
      if (!material || !material.color) return;

      if (material.isMeshStandardMaterial || material.isMeshPhongMaterial || material.isMeshLambertMaterial) {
        // Get original color
        const originalColor = child.userData.originalColor || material.color.getHex();
        const color = new THREE.Color(originalColor);

        // Apply blended shift
        const rgb = { r: color.r, g: color.g, b: color.b };
        const hsl = this.rgbToHSL(rgb);

        const newHue = (hsl.h + blendedShift.hueRotation / 360) % 1;
        const newSat = Math.max(0, Math.min(1, hsl.s * blendedShift.saturation));
        const newLum = Math.max(0, Math.min(1, hsl.l * blendedShift.luminance));

        const newRGB = this.hslToRGB({ h: newHue, s: newSat, l: newLum });
        material.color.setRGB(newRGB.r, newRGB.g, newRGB.b);
      }
    });
  }

  /**
   * Blend animation parameters
   */
  blendAnimationParameters(node, fromAnim, toAnim, progress) {
    const blend = (a, b) => a + (b - a) * progress;

    node.userData.rotationSpeedMult = blend(fromAnim.rotationSpeed / 0.3, toAnim.rotationSpeed / 0.3);
    node.userData.pulseSpeedMult = blend(fromAnim.pulseSpeed / 1.0, toAnim.pulseSpeed / 1.0);
    node.userData.floatAmplitudeMult = blend(fromAnim.floatAmplitude / 0.1, toAnim.floatAmplitude / 0.1);
  }

  /**
   * Blend glow characteristics
   */
  blendGlowCharacteristics(node, fromGlow, toGlow, progress) {
    if (!THREE) return;

    const blend = (a, b) => a + (b - a) * progress;

    node.userData.glowIntensityMult = blend(fromGlow.intensity / 0.3, toGlow.intensity / 0.3);
    node.userData.glowRadiusMult = blend(fromGlow.radius, toGlow.radius);
    node.userData.breathingAmountMult = blend(fromGlow.breathingAmount / 0.2, toGlow.breathingAmount / 0.2);

    // Apply to glow mesh
    if (node.userData.vfxGlow) {
      const glowMat = node.userData.vfxGlow.material;
      if (glowMat && glowMat.isMeshBasicMaterial) {
        const originalOpacity = node.userData.originalGlowOpacity || glowMat.opacity;
        glowMat.opacity = originalOpacity * node.userData.glowIntensityMult;
      }
    }

    // Apply to halo
    if (node.userData.vfxHalo) {
      const haloBat = node.userData.vfxHalo.material;
      if (haloBat && haloBat.isMeshBasicMaterial) {
        const originalOpacity = node.userData.originalHaloOpacity || haloBat.opacity;
        haloBat.opacity = originalOpacity * node.userData.glowIntensityMult * 0.5;
      }
    }
  }

  /**
   * Blend particle configuration
   */
  blendParticleConfig(node, fromParticles, toParticles, progress) {
    const blend = (a, b) => a + (b - a) * progress;

    if (!node.userData.particles || node.userData.particles.length === 0) return;

    const blendedVelocity = blend(fromParticles.velocity, toParticles.velocity);
    const blendedLifetime = blend(fromParticles.lifetime, toParticles.lifetime);
    const blendedSpread = blend(fromParticles.spread, toParticles.spread);

    node.userData.particles.forEach((particle) => {
      if (!particle.userData) particle.userData = {};
      particle.userData.velocityMult = blendedVelocity;
      particle.userData.lifetimeMult = blendedLifetime;
      particle.userData.spreadMult = blendedSpread;
    });

    // Gradually adjust particle count target
    const targetCount = blend(fromParticles.count, toParticles.count);
    node.userData.particleCountTarget = Math.round(targetCount);
  }

  /**
   * Blend shader parameters
   */
  blendShaderParameters(node, fromShader, toShader, progress) {
    const blend = (a, b) => a + (b - a) * progress;

    node.userData.shaderDistortionMult = blend(fromShader.distortion, toShader.distortion);
    node.userData.shaderFrequencyMult = blend(fromShader.frequency, toShader.frequency);
    node.userData.shaderAmplitudeMult = blend(fromShader.amplitude, toShader.amplitude);
  }

  /**
   * Finalize transition and apply full target profile
   */
  finalizeTransition(node) {
    const state = this.activeTransitions.get(node);
    if (!state) return;

    // Update archetype metadata
    node.userData.currentArchetype = state.to;

    // Emit visual FX burst (if THREE available)
    if (THREE) {
      this.emitTransitionFXBurst(node, state.to);
    }

    // Remove transition state
    this.activeTransitions.delete(node);

    if (this.debugMode) {
      console.log('%c[Transition] Completed', 'color: #00ff88;');
    }
  }

  /**
   * Emit visual FX burst on transition completion
   */
  emitTransitionFXBurst(node, toProfile) {
    if (!THREE) return;

    // Temporary glow pulse
    if (node.userData.vfxGlow && node.userData.vfxGlow.material) {
      const originalOpacity = node.userData.vfxGlow.material.opacity;
      node.userData.vfxGlow.material.opacity = Math.min(originalOpacity * 1.5, 1.0);

      // Fade back over 200ms
      setTimeout(() => {
        if (node.userData.vfxGlow && node.userData.vfxGlow.material) {
          node.userData.vfxGlow.material.opacity = originalOpacity;
        }
      }, 200);
    }

    // Temporary scale pulse
    if (node.userData.vfxGlow) {
      const originalScale = node.userData.vfxGlow.scale.clone();
      node.userData.vfxGlow.scale.multiplyScalar(1.2);

      setTimeout(() => {
        if (node.userData.vfxGlow) {
          node.userData.vfxGlow.scale.copy(originalScale);
        }
      }, 150);
    }
  }

  /**
   * Check if node has active transition
   */
  hasActiveTransition(node) {
    return this.activeTransitions.has(node);
  }

  /**
   * Get all active transitions
   */
  getActiveTransitions() {
    return Array.from(this.activeTransitions.entries());
  }

  /**
   * Stop transition on a node
   */
  stopTransition(node) {
    this.activeTransitions.delete(node);
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
    const { h, s, l } = hsl;
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
   * Deep clone an object (for profile copying)
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    const clone = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clone[key] = this.deepClone(obj[key]);
      }
    }
    return clone;
  }
}
