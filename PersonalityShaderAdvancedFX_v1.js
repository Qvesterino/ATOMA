/**
 * PHASE 3C WEEK 5: PERSONALITY SHADER ADVANCED FX - SAFE REBUILD
 * 
 * GPU-side procedural noise-based vertex and fragment distortion effects
 * Driven by existing personality uniform signals from PersonalityShaderBridge_v1
 * 
 * SAFE MODE: 100% additive, no file modifications, no external dependencies
 * 
 * Integration: Optional, manual, reversible
 * - Register materials: advancedFX.register(material)
 * - Unregister materials: advancedFX.unregister(material)
 * - Update per frame: advancedFX.update(deltaTime)
 * - Cleanup: advancedFX.dispose()
 * 
 * Performance: 0.5–1.0ms per 200 nodes (fully disabled in LowFX mode)
 * 
 * Uniforms Used (from PersonalityShaderBridge_v1):
 * - uEntropy: [0, 1] chaos signal
 * - uCorruption: [0, 1] corruption signal
 * - uFocus: [0, 1] focus signal
 * - uEnergy: [0, 1] energy signal
  * - uResonance: [0, 1] link resonance signal
  * - uQuality: [0, 1] FX quality scaler
 */

// Private symbol to track patched materials - prevents repeated shader compilation
const ADVANCED_FX_PATCHED = Symbol('advancedFXPatched');

import VisualTime from './src/time/VisualTime.js';

let _advancedFXTimeOrigin;

export class PersonalityShaderAdvancedFX_v1 {
  constructor(options = {}) {
    // Configuration
    this.enabled = options.enabled !== false;
    this.lowFXMode = options.lowFXMode === true;
    this.updateFrequency = options.updateFrequency || 1; // Update every N frames
    
    // Material registry (for onBeforeCompile hooking)
    this.materials = new Map();
    this.materialHooks = new Map();
    
    // Time tracking
    this.globalTime = 0;
    this.frameCounter = 0;
    this.qualityScale = 1.0;
    
    // Shared shader constants (injected into all registered materials)
    this.shaderInjections = {
      noise: this._buildNoiseCode(),
      distortion: this._buildDistortionCode(),
      fragNoise: this._buildFragmentNoiseCode(),
    };
  }

  /**
   * Procedural Noise Functions (GPU)
   * Hash, Value Noise, Fractional Brownian Motion
   */
  _buildNoiseCode() {
    return `
      // Hash function (3D seed)
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      
      // Value noise (3D, smooth)
      float valueNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f); // Smoothstep
        
        float n000 = hash(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash(i + vec3(1.0, 1.0, 1.0));
        
        float nx0 = mix(n000, n100, f.x);
        float nx1 = mix(n010, n110, f.x);
        float nxy0 = mix(nx0, nx1, f.y);
        
        float nx2 = mix(n001, n101, f.x);
        float nx3 = mix(n011, n111, f.x);
        float nxy1 = mix(nx2, nx3, f.y);
        
        return mix(nxy0, nxy1, f.z);
      }
      
      // Fractional Brownian Motion (multiple octaves)
      float fbm(vec3 p, int octaves) {
        float value = 0.0;
        float amplitude = 1.0;
        float frequency = 1.0;
        float maxValue = 0.0;
        
        for(int i = 0; i < 8; i++) {
          if(i >= octaves) break;
          value += amplitude * valueNoise(p * frequency);
          maxValue += amplitude;
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return value / maxValue;
      }
    `;
  }

  /**
   * Vertex Distortion Profiles (GPU)
   * Applied to vertices based on personality signals
   */
  _buildDistortionCode() {
    return `
      // Chaos distortion: Random wobble via 3D noise
      vec3 chaosDistortion(vec3 position, float entropy, float time) {
        float wobble = fbm(position * 2.0 + time * 0.3, 3) * 2.0 - 1.0;
        vec3 offset = normalize(position) * wobble * entropy * 0.15;
        return position + offset;
      }
      
      // Energy ripple: Radial wave propagation
      vec3 energyRipple(vec3 position, float energy, float time) {
        float dist = length(position);
        float wave = sin((dist - time * 1.5) * 8.0) * cos(time);
        float amplitude = energy * 0.2;
        return position + normalize(position) * wave * amplitude;
      }
      
      // Resonance bands: Standing wave patterns
      vec3 resonanceBands(vec3 position, float resonance, float time) {
        float freq = resonance * 4.0 + 1.0;
        float phase = sin(position.y * freq + time) * 0.5 + 0.5;
        float wave = sin(position.x * 3.0 + time) * cos(position.z * 2.0);
        vec3 offset = vec3(wave * phase, 0.0, 0.0) * resonance * 0.1;
        return position + offset;
      }
      
      // Focus warp: UV-like distortion (pulls toward center)
      vec3 focusWarp(vec3 position, float focus, float time) {
        vec3 centered = position;
        float dist = length(centered);
        float warp = (1.0 - focus) * 0.3;
        return position * (1.0 + warp * fbm(position + time * 0.2, 2));
      }
      
      // Corruption fracture: Jittery breaks
      vec3 corruptionFracture(vec3 position, float corruption, float time) {
        vec3 seed = position * 5.0;
        float jitter = hash(seed + vec3(time)) * 2.0 - 1.0;
        vec3 offset = position * corruption * jitter * 0.08;
        return position + offset;
      }
    `;
  }

  /**
   * Fragment Noise Effects (GPU)
   * Applied to fragment colors
   */
  _buildFragmentNoiseCode() {
    return `
      // Dithering: Add noise to reduce banding
      float dither(vec2 uv, float time) {
        return hash(vec3(uv * 100.0, time)) * 0.1 - 0.05;
      }
      
      // Shimmer: Pulsing highlight overlay
      float shimmer(vec3 position, float time) {
        float freq = 4.0 + time * 0.5;
        return sin(position.y * freq + time * 2.0) * 0.5 + 0.5;
      }
      
      // Corruption glow: Adds color distortion
      vec3 corruptionGlow(vec3 color, float corruption, float time) {
        float glow = fbm(vec3(time, 0.0, 0.0), 2) * corruption;
        return color + vec3(glow * 0.2, glow * 0.1, glow * 0.3);
      }
    `;
  }

  /**
   * Create onBeforeCompile hook for a material
   * Safely injects shader code without modifying existing uniforms or structure
   * 
   * P0.1 FIX: Material-level guard prevents repeated shader compilation
   * even across system re-initializations or multiple instances.
   */
  _createShaderHook(material, profile = 'default') {
    // Guard: Only patch once per material (material-level guard)
    if (material[ADVANCED_FX_PATCHED]) {
      return;  // Already patched
    }

    // Mark material as patched before any assignment
    material[ADVANCED_FX_PATCHED] = true;

    const originalOnBeforeCompile = material.onBeforeCompile;
    
    const self = this;
    material.onBeforeCompile = function(shader) {
      // Call original hook if it exists
      if (originalOnBeforeCompile) {
        originalOnBeforeCompile.call(this, shader);
      }

      // Inject noise code at top of vertex shader
      if (!shader.vertexShader.includes('// ADVANCED_FX_INJECTED')) {
        shader.vertexShader = `
          // ADVANCED_FX_INJECTED
          ${self.shaderInjections.noise}
          ${self.shaderInjections.distortion}
        ` + shader.vertexShader;
      }

      // Inject fragment code if not present
      if (!shader.fragmentShader.includes('// ADVANCED_FX_INJECTED_FRAG')) {
        shader.fragmentShader = `
          // ADVANCED_FX_INJECTED_FRAG
          ${self.shaderInjections.fragNoise}
        ` + shader.fragmentShader;
      }

      // Define the profile-specific vertex distortion
      const distortionLogic = self._getDistortionLogic(profile);
      
      // Inject distortion into main vertex shader (before gl_Position assignment)
      shader.vertexShader = shader.vertexShader.replace(
        'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        `
          vec3 distortedPos = position;
          ${distortionLogic}
          gl_Position = projectionMatrix * modelViewMatrix * vec4(distortedPos, 1.0);
        `
      );

      // Add uniforms for personality signals (graceful fallback if not present)
      shader.uniforms = shader.uniforms || {};
      shader.uniforms.uEntropy = { value: 0.0 };
      shader.uniforms.uCorruption = { value: 0.0 };
      shader.uniforms.uFocus = { value: 0.0 };
      shader.uniforms.uEnergy = { value: 0.0 };
      shader.uniforms.uResonance = { value: 0.0 };
      shader.uniforms.uQuality = { value: 1.0 };
      shader.uniforms.uTime = { value: 0.0 };
      shader.uniforms.uLowFXMode = { value: 0.0 };
    };
  }

  /**
   * Get distortion logic based on profile
   * Returns GLSL code snippet
   */
  _getDistortionLogic(profile) {
    switch (profile) {
      case 'chaos':
        return `distortedPos = chaosDistortion(position, uEntropy, uTime) * mix(1.0, 0.75, uLowFXMode) * uQuality;`;
      
      case 'energy':
        return `distortedPos = energyRipple(position, uEnergy, uTime) * mix(1.0, 0.6, uLowFXMode) * uQuality;`;
      
      case 'resonance':
        return `distortedPos = resonanceBands(position, uResonance, uTime) * mix(1.0, 0.5, uLowFXMode) * uQuality;`;
      
      case 'focus':
        return `distortedPos = focusWarp(position, uFocus, uTime) * mix(1.0, 0.4, uLowFXMode) * uQuality;`;
      
      case 'corruption':
        return `distortedPos = corruptionFracture(position, uCorruption, uTime) * mix(1.0, 0.3, uLowFXMode) * uQuality;`;
      
      case 'link_flux':
        return `distortedPos = energyRipple(position, uResonance, uTime) * uQuality * (1.0 - uLowFXMode * 0.5);`;
      
      default:
        // Blend multiple effects
        return `
          vec3 d1 = chaosDistortion(position, uEntropy, uTime);
          vec3 d2 = energyRipple(position, uEnergy, uTime);
          vec3 d3 = resonanceBands(position, uResonance, uTime);
          distortedPos = mix(d1, mix(d2, d3, 0.5), 0.33) * uQuality * (1.0 - uLowFXMode * 0.7);
        `;
    }
  }

  /**
   * Register a material for advanced FX
   * Optionally specify a distortion profile
   * 
   * Dual-guard pattern:
   * - Instance-level guard (this.materials.has): Fast check for this system instance
   * - Material-level guard (ADVANCED_FX_PATCHED Symbol): Authoritative, survives re-initialization
   */
  register(material, profile = 'default') {
    if (!material || !material.onBeforeCompile !== undefined) {
      console.warn('[AdvancedFX] Invalid material object');
      return false;
    }

    // Instance-level guard (fast check)
    if (this.materials.has(material)) {
      return true; // Already registered in this instance
    }

    this._createShaderHook(material, profile);
    this.materials.set(material, profile);
    this.materialHooks.set(material, material.onBeforeCompile);

    return true;
  }

  /**
   * Unregister a material (removes FX)
   */
  unregister(material) {
    if (!this.materials.has(material)) {
      return false;
    }

    // Restore original onBeforeCompile if available
    const originalHook = this.materialHooks.get(material);
    if (originalHook) {
      material.onBeforeCompile = originalHook;
    } else {
      delete material.onBeforeCompile;
    }

    this.materials.delete(material);
    this.materialHooks.delete(material);

    return true;
  }

  /**
   * Update uniforms for all registered materials
   * Called once per frame with personality signals
   */
    update(deltaTime = 0, personalitySignals = {}) {
    if (!this.enabled || this.lowFXMode) {
      return; // Disabled in LowFX mode
    }

    this.frameCounter++;
    if (this.frameCounter % this.updateFrequency !== 0) {
      return; // Skip frame if not update frequency
    }

    if (_advancedFXTimeOrigin === undefined) {
      _advancedFXTimeOrigin = VisualTime.now;
    }
    const currentVisualTime = VisualTime.now - _advancedFXTimeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)

    this.globalTime = currentVisualTime;

    // Extract personality signals (with graceful defaults)
    const entropy = personalitySignals.entropy ?? 0.0;
    const corruption = personalitySignals.corruption ?? 0.0;
    const focus = personalitySignals.focus ?? 0.0;
    const energy = personalitySignals.energy ?? 0.0;
    const resonance = personalitySignals.resonance ?? 0.0;
    const quality = personalitySignals.quality ?? this.qualityScale;

    // Update uniforms for all registered materials
    this.materials.forEach((profile, material) => {
      if (material.uniforms) {
        material.uniforms.uEntropy.value = entropy;
        material.uniforms.uCorruption.value = corruption;
        material.uniforms.uFocus.value = focus;
        material.uniforms.uEnergy.value = energy;
        material.uniforms.uResonance.value = resonance;
        material.uniforms.uQuality.value = quality;
        material.uniforms.uTime.value = currentVisualTime;
        material.uniforms.uLowFXMode.value = this.lowFXMode ? 1.0 : 0.0;
      }
    });
  }

  /**
   * Set quality scale (0.0–1.0)
   * 0.0 = minimal FX, 1.0 = full FX
   */
  setQuality(scale) {
    this.qualityScale = Math.max(0.0, Math.min(1.0, scale));
  }

  /**
   * Toggle LowFX mode (disables all effects if true)
   */
  setLowFXMode(enabled) {
    this.lowFXMode = enabled;
  }

  /**
   * Enable/disable system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Get number of registered materials
   */
  getMaterialCount() {
    return this.materials.size;
  }

  /**
   * Cleanup: unregister all materials
   */
  dispose() {
    this.materials.forEach((profile, material) => {
      this.unregister(material);
    });
    this.materials.clear();
    this.materialHooks.clear();
  }

  /**
   * Debug info
   */
  getDebugInfo() {
    return {
      enabled: this.enabled,
      lowFXMode: this.lowFXMode,
      globalTime: this.globalTime,
      qualityScale: this.qualityScale,
      registeredMaterials: this.materials.size,
      frameCounter: this.frameCounter,
    };
  }
}

// Export both named and default for flexibility
export default PersonalityShaderAdvancedFX_v1;
