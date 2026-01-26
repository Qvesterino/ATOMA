/**
 * CORRUPTION VISUAL FX LAYER v1.0
 * 
 * Complete visual effects system for displaying gameplay corruption in real-time.
 * Integrates with ArchetypeVisualDifferentiationSystem_v1 and ArchetypeGameplaySystem_v1.
 * 
 * Features:
 * - Dynamic color distortion/tinting based on corruption level
 * - Glow flicker with frequency/amplitude tied to corruption
 * - Shader-based UV distortion and warping (when THREE available)
 * - Chaos particle emission at medium-high corruption
 * - Subtle mesh jitter/micro-shake for visual feedback
 * - Full THREE.js safe mode compatibility (graceful degradation)
 * - Non-breaking integration with existing systems
 * 
 * Visual Effects Progression:
 * 0.0-0.25: Subtle color shift + mild glow
 * 0.25-0.45: Color intensifies + glow flickers
 * 0.45-0.65: Shader distortion + particle emission
 * 0.65-0.85: Strong glitch effects + particle bursts
 * 0.85-1.0: Extreme corruption + constant visual breakdown
 */

import VisualTime from './src/time/VisualTime.js';

// === THREE SAFE LOADER (v1.1) ===
let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

if (!THREE_SAFE) {
  console.warn('[CorruptionVisualFX_v1] THREE not detected – enabling SAFE MODE.');
}

const THREE = THREE_SAFE;

// Private symbol to track patched materials - prevents repeated shader compilation
const CORRUPTION_PATCHED = Symbol('corruptionPatched');

/**
 * Corruption color palette (HSL-friendly)
 * Ranges from healthy to fully corrupted
 */
const CORRUPTION_COLOR_PALETTE = {
  healthy: { r: 0.2, g: 0.8, b: 0.3 },     // Green
  mild: { r: 1.0, g: 0.6, b: 0.0 },        // Orange
  moderate: { r: 1.0, g: 0.2, b: 0.6 },    // Magenta
  strong: { r: 0.9, g: 0.1, b: 0.1 },      // Deep red
  severe: { r: 0.5, g: 0.0, b: 0.5 }       // Purple/void
};

/**
 * CORRUPTION VISUAL FX ENGINE
 * Main class for all corruption visual effects
 */
export class CorruptionVisualFX_v1 {
  constructor(aiNodesInstance, debugMode = false) {
    this.aiNodes = aiNodesInstance;
    this.debugMode = debugMode;
    
    // Visual state tracking
    this.nodeVisualState = new Map(); // node -> { jitterOffset, particleEmitTime, etc }
    this.activeParticles = [];
    
    // Performance settings
    this.updateInterval = 1 / 30; // 30Hz updates for performance
    this.lastUpdateTime = 0;
    // DEV NOTE: Corruption visuals require realtime (RAF) visual time per AtomaShaderTimingContract.
    // VisualTime is the canonical source (Phase 2A); external time/delta params are maintained for legacy signatures only.
    this.visualTime = VisualTime;
    
    if (this.debugMode) {
      console.log('%c[CorruptionVisualFX_v1] Initialized', 'color: #ff4400; font-weight: bold;');
      this.setupConsoleAPI();
    }
  }

  /**
   * Get or create visual state for a node
   */
  getOrCreateNodeVisualState(nodeModel) {
    if (this.nodeVisualState.has(nodeModel)) {
      return this.nodeVisualState.get(nodeModel);
    }

    const state = {
      jitterOffset: new (THREE?.Vector3 || Object)(0, 0, 0),
      jitterFrequency: Math.random() * 0.5 + 0.5,
      jitterPhase: Math.random() * Math.PI * 2,
      lastParticleEmitTime: 0,
      particleEmitRate: 0,
      originalPosition: nodeModel.position?.clone?.() || { x: 0, y: 0, z: 0 },
      shaderApplied: false,
      glowBaseIntensity: 0.3
    };

    this.nodeVisualState.set(nodeModel, state);
    return state;
  }

  /**
   * Apply all corruption effects to a node
   * Timing: expects realtime visual time (RAF). VisualTime is available for Phase 2 enforcement.
   */
  applyCorruptionEffects(nodeModel, deltaTime, time = 0) {
    if (!nodeModel || !nodeModel.userData) return;

    const corruptionLevel = nodeModel.userData?.gameplay?.corruptionLevel || 0;
    if (corruptionLevel <= 0) return; // No corruption, skip

    // Phase 2A: use canonical RAF visual time (VisualTime) for all internal timing (behavior-preserving).
    const visualNow = this.visualTime.now;
    const visualDelta = this.visualTime.delta;

    // Get or create visual state
    const visualState = this.getOrCreateNodeVisualState(nodeModel);

    // Apply color distortion
    this.applyCorruptionColor(nodeModel, corruptionLevel);

    // Apply glow flicker
    this.applyGlowFlicker(nodeModel, corruptionLevel, visualNow, visualState);

    // Apply shader distortion (if THREE available)
    if (THREE && corruptionLevel > 0.45) {
      this.applyShaderDistortion(nodeModel, corruptionLevel, visualState);
    }

    // Apply mesh jitter
    if (THREE && corruptionLevel > 0.15) {
      this.applyMeshJitter(nodeModel, corruptionLevel, visualNow, visualState);
    }

    // Spawn chaos particles
    if (corruptionLevel > 0.45) {
      this.spawnChaosParticles(nodeModel, corruptionLevel, visualDelta, visualState);
    }
  }

  /**
   * Compute corruption color based on level
   * Interpolates through color palette
   */
  computeCorruptionColor(baseColor, corruptionLevel) {
    if (!THREE || !baseColor) return baseColor;

    let targetColor;
    if (corruptionLevel < 0.25) {
      // Healthy to mild
      targetColor = this.lerpColor(CORRUPTION_COLOR_PALETTE.healthy, CORRUPTION_COLOR_PALETTE.mild, corruptionLevel / 0.25);
    } else if (corruptionLevel < 0.45) {
      // Mild to moderate
      targetColor = this.lerpColor(CORRUPTION_COLOR_PALETTE.mild, CORRUPTION_COLOR_PALETTE.moderate, (corruptionLevel - 0.25) / 0.2);
    } else if (corruptionLevel < 0.65) {
      // Moderate to strong
      targetColor = this.lerpColor(CORRUPTION_COLOR_PALETTE.moderate, CORRUPTION_COLOR_PALETTE.strong, (corruptionLevel - 0.45) / 0.2);
    } else if (corruptionLevel < 0.85) {
      // Strong to severe
      targetColor = this.lerpColor(CORRUPTION_COLOR_PALETTE.strong, CORRUPTION_COLOR_PALETTE.severe, (corruptionLevel - 0.65) / 0.2);
    } else {
      // Fully severe
      targetColor = CORRUPTION_COLOR_PALETTE.severe;
    }

    // Blend with base color
    const blendFactor = Math.min(1, corruptionLevel);
    const result = new THREE.Color(baseColor);
    const corruptColor = new THREE.Color(targetColor.r, targetColor.g, targetColor.b);
    result.lerp(corruptColor, blendFactor);

    return result;
  }

  /**
   * Apply corruption color tinting to node materials
   */
  applyCorruptionColor(nodeModel, corruptionLevel) {
    if (!THREE || corruptionLevel <= 0) return;

    nodeModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      
      const material = child.material;
      if (!material.color) return;

      // Store original color if not stored
      if (!child.userData.originalColor) {
        child.userData.originalColor = material.color.getHex();
      }

      // Get base color
      const baseColor = new THREE.Color(child.userData.originalColor);

      // Compute corrupted color
      const corruptedColor = this.computeCorruptionColor(baseColor, corruptionLevel);

      // Apply with intensity scaling
      const intensity = Math.min(1, corruptionLevel * 1.5); // Boost color intensity
      material.color.copy(baseColor).lerp(corruptedColor, intensity);

      // Also tint emissive if available
      if (material.emissive && this.isMaterialEmissiveCapable(material)) {
        const emissiveColor = new THREE.Color(0.5, 0.0, 0.3).multiplyScalar(corruptionLevel);
        material.emissive.copy(emissiveColor);
      }
    });
  }

  /**
   * Apply glow flicker effect to node materials
   */
  applyGlowFlicker(nodeModel, corruptionLevel, time, visualState) {
    if (!THREE) return;

    // VisualTime provides monotonic RAF time to preserve smooth glow oscillation.
    const t = this.visualTime.now;

    // Frequency and amplitude scale with corruption
    const baseFreq = 1; // Base oscillation frequency
    const maxFreq = 8;  // Maximum frequency at full corruption
    const frequency = baseFreq + (maxFreq - baseFreq) * corruptionLevel;

    const baseAmp = 0.05;
    const maxAmp = 0.6;
    const amplitude = baseAmp + (maxAmp - baseAmp) * corruptionLevel;

    // Add random flicker at high corruption
    const flicker = corruptionLevel > 0.7 ? Math.random() * 0.3 : 0;

    // Compute glow intensity
    const oscillation = Math.sin(t * frequency) * amplitude;
    const glowIntensity = visualState.glowBaseIntensity * (1 + oscillation + flicker);

    // Apply to materials
    nodeModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const material = child.material;
      
      // Apply emissive intensity if capable
      if (material.emissive && this.isMaterialEmissiveCapable(material)) {
        const emissiveColor = material.emissive.clone().multiplyScalar(glowIntensity);
        material.emissive.copy(emissiveColor);
      }

      // For meshPhong/standard materials, modulate intensity
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = glowIntensity;
      }
    });
  }

  /**
   * Apply UV distortion shader effect (if THREE available)
   * 
   * P0.1 FIX: Idempotent patching - only patches once per material to prevent
   * repeated shader recompilation, GPU frame spikes, and hook conflicts with other systems.
   * Preserves and chains any existing onBeforeCompile hook.
   */
  applyShaderDistortion(nodeModel, corruptionLevel, visualState) {
    if (!THREE || !nodeModel.traverse) return;

    nodeModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const material = child.material;

      // Guard: Only patch once per material
      if (material[CORRUPTION_PATCHED]) {
        return;  // Already patched
      }

      // Try to apply shader modification via onBeforeCompile
      if (material.onBeforeCompile && corruptionLevel > 0.45) {
        // Store original onBeforeCompile (if any)
        const originalOnBeforeCompile = material.onBeforeCompile;

        const onBeforeCompile = (shader) => {
          // Call original first (preserves other systems' hooks)
          if (originalOnBeforeCompile) {
            originalOnBeforeCompile.call(material, shader);
          }

          // Add distortion uniforms
          shader.uniforms.corruptionLevel = { value: corruptionLevel };
          shader.uniforms.time = { value: performance.now() * 0.001 };

          // Modify vertex shader for UV distortion
          shader.vertexShader = `
            uniform float corruptionLevel;
            uniform float time;
            ${shader.vertexShader}
          `.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vec3 distorted = position;
            float glitch = sin(time * 10.0 + position.y * 20.0) * 0.5 + 0.5;
            distorted.x += glitch * corruptionLevel * 0.1;
            distorted.y += sin(time * 7.5 + position.x * 15.0) * corruptionLevel * 0.08;
            position = distorted;
            `
          );

          // Modify fragment shader for color distortion
          shader.fragmentShader = shader.fragmentShader.replace(
            'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
            `
            vec4 fragColor = vec4( outgoingLight, diffuseColor.a );
            float distortion = sin(gl_FragCoord.x * 0.01 + time) * sin(gl_FragCoord.y * 0.01 + time) * corruptionLevel;
            fragColor.rgb += distortion * vec3(1.0, 0.2, 0.5) * corruptionLevel;
            gl_FragColor = fragColor;
            `
          );
        };

        // Mark material as patched before assignment
        material[CORRUPTION_PATCHED] = true;
        material.onBeforeCompile(onBeforeCompile);
      }
    });
  }

  /**
   * Apply subtle mesh jitter/micro-shake
   */
  applyMeshJitter(nodeModel, corruptionLevel, time, visualState) {
    if (!THREE || !nodeModel.position) return;

    // VisualTime ensures jitter uses RAF-aligned time to avoid scheduler quantization.
    const t = this.visualTime.now;

    // Amplitude scales with corruption (very subtle)
    const jitterAmplitude = corruptionLevel * 0.007;

    // Compute jitter offset using sine waves at different frequencies
    const jitterX = Math.sin(t * visualState.jitterFrequency + visualState.jitterPhase) * jitterAmplitude;
    const jitterY = Math.sin(t * (visualState.jitterFrequency * 0.7) + visualState.jitterPhase + 1) * jitterAmplitude;
    const jitterZ = Math.sin(t * (visualState.jitterFrequency * 1.3) + visualState.jitterPhase + 2) * jitterAmplitude;

    // Apply offset (don't modify actual position, use temporary offset for rendering)
    if (visualState.jitterOffset) {
      visualState.jitterOffset.set(jitterX, jitterY, jitterZ);
      
      // Apply offset temporarily (will be reset each frame)
      if (!nodeModel.userData.originalPosition) {
        nodeModel.userData.originalPosition = nodeModel.position.clone();
      }
      
      nodeModel.position.copy(nodeModel.userData.originalPosition);
      nodeModel.position.add(visualState.jitterOffset);
    }
  }

  /**
   * Spawn chaos particles at high corruption levels
   */
  spawnChaosParticles(nodeModel, corruptionLevel, deltaTime, visualState) {
    if (!THREE || !nodeModel.position) return;

    const now = performance.now();

    // Determine particle emission rate based on corruption
    if (corruptionLevel > 0.45) {
      const baseEmitRate = 5;  // particles per second at 0.45 corruption
      const maxEmitRate = 30;  // particles per second at full corruption
      const emitRate = baseEmitRate + (maxEmitRate - baseEmitRate) * ((corruptionLevel - 0.45) / 0.55);

      // Emit particles based on rate
      const timeSinceLastEmit = now - visualState.lastParticleEmitTime;
      const emitInterval = 1000 / emitRate;

      if (timeSinceLastEmit > emitInterval) {
        const particleCount = Math.floor(timeSinceLastEmit / emitInterval);
        
        for (let i = 0; i < particleCount; i++) {
          this.emitChaosParticle(nodeModel, corruptionLevel);
        }

        visualState.lastParticleEmitTime = now;
      }
    }

    // Emit burst particles at extreme corruption
    if (corruptionLevel > 0.85 && Math.random() < corruptionLevel * 0.1) {
      // Occasional burst of 5-10 particles
      const burstCount = Math.floor(Math.random() * 5) + 5;
      for (let i = 0; i < burstCount; i++) {
        this.emitChaosParticle(nodeModel, corruptionLevel, true);
      }
    }
  }

  /**
   * Emit a single chaos particle
   */
  emitChaosParticle(nodeModel, corruptionLevel, isBurst = false) {
    if (!THREE || !nodeModel.position) return;

    // Particle properties
    const particle = {
      position: nodeModel.position.clone().add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        )
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * (isBurst ? 0.5 : 0.2),
        (Math.random() - 0.5) * (isBurst ? 0.5 : 0.2),
        (Math.random() - 0.5) * (isBurst ? 0.5 : 0.2)
      ),
      life: 1.0,
      maxLife: 0.5 + Math.random() * 0.5,
      color: new THREE.Color(1.0, 0.2 * corruptionLevel, 0.6 * corruptionLevel),
      size: 0.1 + Math.random() * 0.1
    };

    this.activeParticles.push(particle);

    // Keep particles list from getting too large
    if (this.activeParticles.length > 1000) {
      this.activeParticles.shift();
    }
  }

  /**
   * Update all active particles
   */
  updateParticles(deltaTime) {
    // VisualTime.delta keeps particle integration aligned with RAF cadence.
    const dt = this.visualTime.delta;

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      
      // Update particle life
      particle.life -= dt / particle.maxLife;

      // Update position with gravity
      particle.position.add(particle.velocity.clone().multiplyScalar(dt));
      particle.velocity.y -= 0.5 * dt; // Gravity effect

      // Fade out
      particle.color.multiplyScalar(particle.life);

      // Remove dead particles
      if (particle.life <= 0) {
        this.activeParticles.splice(i, 1);
      }
    }
  }

  /**
   * Linear interpolation between two color objects
   */
  lerpColor(colorA, colorB, t) {
    return {
      r: colorA.r + (colorB.r - colorA.r) * t,
      g: colorA.g + (colorB.g - colorA.g) * t,
      b: colorA.b + (colorB.b - colorA.b) * t
    };
  }

  /**
   * Check if material supports emissive property
   */
  isMaterialEmissiveCapable(material) {
    if (!material) return false;
    return material.isMeshStandardMaterial ||
           material.isMeshPhongMaterial ||
           material.isMeshLambertMaterial;
  }

  /**
   * Render corruption particles (visual debug/demonstration)
   */
  renderCorruptionParticles(scene, camera, renderer) {
    if (!THREE || !scene || !this.activeParticles.length) return;

    // This would be called from main render loop if particle visualization desired
    // For now, particles are tracked but not rendered (they can be added to visual system later)
  }

  /**
   * Debug console API
   */
  setupConsoleAPI() {
    if (typeof window === 'undefined') return;

    window.corruptionVisualDebug = {
      corrupt: (node, amount = 0.1) => {
        if (!node.userData.gameplay) node.userData.gameplay = {};
        node.userData.gameplay.corruptionLevel = Math.min(1, 
          (node.userData.gameplay.corruptionLevel || 0) + amount);
        console.log(`%c[Corruption +${amount}] Level: ${node.userData.gameplay.corruptionLevel.toFixed(2)}`, 
          'color: #ff4400;');
      },

      clean: (node, amount = 0.1) => {
        if (!node.userData.gameplay) node.userData.gameplay = {};
        node.userData.gameplay.corruptionLevel = Math.max(0,
          (node.userData.gameplay.corruptionLevel || 0) - amount);
        console.log(`%c[Cleaned -${amount}] Level: ${node.userData.gameplay.corruptionLevel.toFixed(2)}`,
          'color: #00ff88;');
      },

      setCorruption: (node, value) => {
        if (!node.userData.gameplay) node.userData.gameplay = {};
        node.userData.gameplay.corruptionLevel = Math.max(0, Math.min(1, value));
        console.log(`%c[Set Corruption] Level: ${value.toFixed(2)}`, 'color: #ffaa00;');
      },

      pulse: (node) => {
        if (!node.userData.gameplay) node.userData.gameplay = {};
        node.userData.gameplay.corruptionLevel = 1.0;
        setTimeout(() => {
          node.userData.gameplay.corruptionLevel = 0.0;
        }, 500);
        console.log('%c[Corruption Pulse] 0 → 1 → 0', 'color: #ff0000; font-weight: bold;');
      },

      particles: () => {
        const particleCount = (window.corruptionFX?.activeParticles?.length) || 0;
        console.log(`%c[Particles] Active: ${particleCount}`, 'color: #ffaa00;');
      },

      stats: () => {
        const states = window.corruptionFX?.nodeVisualState?.size || 0;
        const particles = window.corruptionFX?.activeParticles?.length || 0;
        console.log('%c[Corruption FX Stats]', 'color: #ff4400; font-weight: bold;', {
          trackedNodes: states,
          activeParticles: particles
        });
      }
    };

    console.log('%c[CorruptionVisualDebug] API available: window.corruptionVisualDebug', 
      'color: #ff4400;');
  }
}

export default CorruptionVisualFX_v1;
