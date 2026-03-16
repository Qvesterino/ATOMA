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
const CASCADE_CORRUPTION_THRESHOLD = 0.35;

// Private symbols for one-time corruption shader binding metadata
const CORRUPTION_BINDING = Symbol('corruptionBinding');
const CORRUPTION_ORIGINAL_ON_BEFORE_RENDER = Symbol('corruptionOriginalOnBeforeRender');

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
  constructor(sceneOrAiNodes, aiNodesOrDebugMode = false, debugMode = false) {
    if (Array.isArray(sceneOrAiNodes?.nodes) || sceneOrAiNodes?.nodes instanceof Map || Array.isArray(sceneOrAiNodes)) {
      this.scene = null;
      this.aiNodes = sceneOrAiNodes;
      this.debugMode = !!aiNodesOrDebugMode;
    } else {
      this.scene = sceneOrAiNodes || null;
      this.aiNodes = aiNodesOrDebugMode;
      this.debugMode = !!debugMode;
    }
    
    // Visual state tracking
    this.nodeVisualState = new Map(); // node -> { jitterOffset, particleEmitTime, etc }
    this.activeParticles = [];
    
    // Performance settings
    this.updateInterval = 1 / 30; // 30Hz updates for performance
    this.lastUpdateTime = 0;
    // DEV NOTE: Corruption visuals require realtime (RAF) visual time per AtomaShaderTimingContract.
    // VisualTime is the canonical source (Phase 2A); external time/delta params are maintained for legacy signatures only.
    this.visualTime = VisualTime;
    this.corruptionShaderVariant = THREE ? this._createCorruptionShaderVariant() : null;
    this._semanticSubscriptions = [];
    this._bindSemanticBus();
    
    if (this.debugMode) {
      console.log('%c[CorruptionVisualFX_v1] Initialized', 'color: #ff4400; font-weight: bold;');
      this.setupConsoleAPI();
    }
  }

  _getSemanticBus() {
    return globalThis?.semanticBus || null;
  }

  _bindSemanticBus() {
    const bus = this._getSemanticBus();
    if (!bus) return;
    const on = bus.on?.bind(bus) || bus.subscribe?.bind(bus);
    if (!on) return;

    const handleCorruptionSpike = (data = {}) => {
      this.triggerCorruptionPulse(data.nodeId);
    };

    on('metric.corruption.spike', handleCorruptionSpike, { priority: bus.priority?.NORMAL });
    this._semanticSubscriptions.push(['metric.corruption.spike', handleCorruptionSpike]);
  }

  _resolveNodeById(nodeId) {
    if (nodeId === undefined || nodeId === null || !this.aiNodes) return null;
    const idToken = String(nodeId);

    const candidates = [];
    if (Array.isArray(this.aiNodes?.nodes)) candidates.push(...this.aiNodes.nodes);
    else if (this.aiNodes?.nodes instanceof Map) candidates.push(...this.aiNodes.nodes.values());
    else if (this.aiNodes instanceof Map) candidates.push(...this.aiNodes.values());
    else if (Array.isArray(this.aiNodes)) candidates.push(...this.aiNodes);

    for (const node of candidates) {
      if (!node) continue;
      const nid = node?.nodeId ?? node?.id ?? node?.uuid ?? node?.userData?.nodeId;
      if (nid !== undefined && String(nid) === idToken) return node;
    }
    return null;
  }

  triggerCorruptionPulse(nodeId) {
    if (!THREE) return;
    const node = this._resolveNodeById(nodeId);
    if (!node) return;

    const baseCorruption = Math.max(
      0,
      Math.min(
        1,
        node?.userData?.metrics?.corruption ??
        node?.userData?.corruption ??
        0.7
      )
    );
    const pulseLevel = Math.max(0.65, baseCorruption);
    for (let i = 0; i < 4; i++) {
      this.emitChaosParticle(node, pulseLevel, i < 2);
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

    const corruptionLevel = (
      nodeModel.userData?.metrics?.corruption ??
      nodeModel.userData?.corruption ??
      0
    );

    // Phase 2A: use canonical RAF visual time (VisualTime) for all internal timing (behavior-preserving).
    const visualNow = this.visualTime.now;
    const visualDelta = this.visualTime.delta;

    // Uniform-only corruption shader updates (no runtime shader mutation).
    this.applyShaderDistortion(nodeModel, corruptionLevel, visualDelta);

    if (corruptionLevel <= 0) return; // No corruption, skip

    // Get or create visual state
    const visualState = this.getOrCreateNodeVisualState(nodeModel);

    // Apply color distortion
    this.applyCorruptionColor(nodeModel, corruptionLevel);

    // Apply glow flicker
    this.applyGlowFlicker(nodeModel, corruptionLevel, visualNow, visualState);

    // Apply mesh jitter
    if (THREE && corruptionLevel > 0.15) {
      this.applyMeshJitter(nodeModel, corruptionLevel, visualNow, visualState);
    }

    // Spawn chaos particles
    if (this._hasCascadeCorruptionLink(nodeModel) && corruptionLevel > CASCADE_CORRUPTION_THRESHOLD) {
      this.spawnChaosParticles(nodeModel, corruptionLevel, visualDelta, visualState);
    }
  }

  _hasCascadeCorruptionLink(nodeModel) {
    const links = nodeModel?.userData?.links;
    if (!Array.isArray(links)) return false;
    return links.some((link) => (
      (link?.userData?.corruptionLevel ?? 0) > CASCADE_CORRUPTION_THRESHOLD
    ));
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
   * Apply corruption shader distortion using precompiled uniforms only.
   */
  applyShaderDistortion(nodeModel, corruptionLevel, deltaTime) {
    if (!THREE || !nodeModel?.traverse || !this.corruptionShaderVariant) return;

    nodeModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      // Bind once, then drive effect strength/time strictly by uniform values.
      const binding = child.userData?.[CORRUPTION_BINDING] || this._bindCorruptionVariantToMesh(child);
      if (!binding?.uniformState) return;

      binding.uniformState.uCorruptionLevel = Math.max(0, Math.min(1, corruptionLevel || 0));
      binding.uniformState.uCorruptionTime += Math.max(0, deltaTime || 0);

      if (child.material?.uniforms?.uCorruptionLevel) {
        child.material.uniforms.uCorruptionLevel.value = binding.uniformState.uCorruptionLevel;
      }
      if (child.material?.uniforms?.uCorruptionTime) {
        child.material.uniforms.uCorruptionTime.value = binding.uniformState.uCorruptionTime;
      }
    });
  }

  _createCorruptionShaderVariant() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null },
        uUseMap: { value: 0.0 },
        uBaseColor: { value: new THREE.Color(1.0, 1.0, 1.0) },
        uEmissive: { value: new THREE.Color(0.0, 0.0, 0.0) },
        uOpacity: { value: 1.0 },
        uCorruptionLevel: { value: 0.0 },
        uCorruptionTime: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vPosW;

        void main() {
          vUv = uv;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vPosW = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uUseMap;
        uniform vec3 uBaseColor;
        uniform vec3 uEmissive;
        uniform float uOpacity;
        uniform float uCorruptionLevel;
        uniform float uCorruptionTime;

        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vPosW;

        vec3 applyCorruption(vec3 color, vec2 uv) {
          float level = clamp(uCorruptionLevel, 0.0, 1.0);
          float t = uCorruptionTime;
          float warp = sin((uv.x + vPosW.y) * 20.0 + t * 10.0) * 0.5 + 0.5;
          float stripe = sin((uv.y + vPosW.x) * 28.0 - t * 7.5);
          float distortion = warp * stripe * level;
          vec3 tint = vec3(1.0, 0.2, 0.5) * distortion * level;
          return color + tint;
        }

        void main() {
          vec4 texel = vec4(1.0);
          if (uUseMap > 0.5) {
            texel = texture2D(uMap, vUv);
          }

          vec3 baseColor = uBaseColor * texel.rgb;
          vec3 normal = normalize(vNormalW);
          vec3 lightDir = normalize(vec3(0.25, 0.75, 0.6));
          float ndl = max(dot(normal, lightDir), 0.0);
          vec3 lit = baseColor * (0.35 + 0.65 * ndl) + uEmissive;
          vec3 finalColor = applyCorruption(lit, vUv);
          gl_FragColor = vec4(finalColor, texel.a * uOpacity);
        }
      `,
      transparent: true
    });
  }

  _bindCorruptionVariantToMesh(mesh) {
    if (!mesh || !mesh.material || !this.corruptionShaderVariant) return null;
    if (mesh.userData?.[CORRUPTION_BINDING]) return mesh.userData[CORRUPTION_BINDING];
    if (Array.isArray(mesh.material)) return null;

    const sourceMaterial = mesh.material;
    const binding = {
      sourceMaterial,
      uniformState: {
        uCorruptionLevel: 0,
        uCorruptionTime: 0
      },
      renderState: {
        transparent: sourceMaterial.transparent === true,
        depthWrite: sourceMaterial.depthWrite !== false,
        depthTest: sourceMaterial.depthTest !== false,
        side: sourceMaterial.side ?? THREE.FrontSide,
        blending: sourceMaterial.blending ?? THREE.NormalBlending
      },
      baseState: {
        color: sourceMaterial.color ? sourceMaterial.color.clone() : new THREE.Color(1, 1, 1),
        emissive: sourceMaterial.emissive ? sourceMaterial.emissive.clone() : new THREE.Color(0, 0, 0),
        opacity: sourceMaterial.opacity !== undefined ? sourceMaterial.opacity : 1,
        map: sourceMaterial.map || null
      }
    };

    mesh.userData[CORRUPTION_BINDING] = binding;

    // Preserve existing onBeforeRender behavior and inject per-mesh uniforms.
    mesh[CORRUPTION_ORIGINAL_ON_BEFORE_RENDER] = mesh.onBeforeRender;
    mesh.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      const b = mesh.userData?.[CORRUPTION_BINDING];
      const variant = this.corruptionShaderVariant;
      if (b && variant?.uniforms) {
        const source = b.sourceMaterial;
        const uniforms = variant.uniforms;
        const baseColor = source?.color ? source.color : b.baseState.color;
        const emissive = source?.emissive ? source.emissive : b.baseState.emissive;
        const map = source?.map || b.baseState.map;
        const opacity = source?.opacity !== undefined ? source.opacity : b.baseState.opacity;

        uniforms.uBaseColor.value.copy(baseColor);
        uniforms.uEmissive.value.copy(emissive);
        uniforms.uOpacity.value = opacity;
        uniforms.uMap.value = map;
        uniforms.uUseMap.value = map ? 1.0 : 0.0;
        uniforms.uCorruptionLevel.value = b.uniformState.uCorruptionLevel;
        uniforms.uCorruptionTime.value = b.uniformState.uCorruptionTime;

        variant.transparent = b.renderState.transparent;
        variant.depthWrite = b.renderState.depthWrite;
        variant.depthTest = b.renderState.depthTest;
        variant.side = b.renderState.side;
        variant.blending = b.renderState.blending;
      }

      const original = mesh[CORRUPTION_ORIGINAL_ON_BEFORE_RENDER];
      if (typeof original === 'function') {
        original.call(mesh, renderer, scene, camera, geometry, material, group);
      }
    };

    mesh.material = this.corruptionShaderVariant;
    return binding;
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

    // Keep node anchored; no per-frame additive position changes
    if (!nodeModel.userData.originalPosition) {
      nodeModel.userData.originalPosition = nodeModel.position.clone();
    }
    const basePos = nodeModel.userData.originalPosition;
    nodeModel.position.set(basePos.x, basePos.y, basePos.z);
  }

  /**
   * Spawn chaos particles at high corruption levels
   */
  spawnChaosParticles(nodeModel, corruptionLevel, deltaTime, visualState) {
    if (!THREE || !nodeModel.position) return;

    const now = performance.now();

    // Determine particle emission rate based on corruption
    if (this._hasCascadeCorruptionLink(nodeModel) && corruptionLevel > CASCADE_CORRUPTION_THRESHOLD) {
      const baseEmitRate = 5;  // particles per second at cascade corruption threshold
      const maxEmitRate = 30;  // particles per second at full corruption
      const thresholdRange = Math.max(0.001, 1.0 - CASCADE_CORRUPTION_THRESHOLD);
      const emitRate = baseEmitRate + (maxEmitRate - baseEmitRate) * ((corruptionLevel - CASCADE_CORRUPTION_THRESHOLD) / thresholdRange);

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
      startPosition: null, // will be set to position after creation
      baseVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * (isBurst ? 0.5 : 0.2),
        (Math.random() - 0.5) * (isBurst ? 0.5 : 0.2),
        (Math.random() - 0.5) * (isBurst ? 0.5 : 0.2)
      ),
      age: 0,
      life: 1.0,
      maxLife: 0.5 + Math.random() * 0.5,
      color: new THREE.Color(1.0, 0.2 * corruptionLevel, 0.6 * corruptionLevel),
      size: 0.1 + Math.random() * 0.1
    };

    this.activeParticles.push(particle);
    particle.startPosition = particle.position.clone();

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
      particle.age = (particle.age || 0) + dt;
      
      // Update particle life
      particle.life = 1 - (particle.age / particle.maxLife);

      // Update position with gravity using base position (no incremental adds)
      const start = particle.startPosition || new THREE.Vector3();
      const vx = particle.baseVelocity?.x || 0;
      const vy = particle.baseVelocity?.y || 0;
      const vz = particle.baseVelocity?.z || 0;
      const dispX = vx * particle.age;
      const dispZ = vz * particle.age;
      const gravity = -0.5; // matches prior acceleration
      const dispY = vy * particle.age + 0.5 * gravity * particle.age * particle.age;
      particle.position.set(
        start.x + dispX,
        start.y + dispY,
        start.z + dispZ
      );

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

  dispose() {
    const bus = this._getSemanticBus();
    const off = bus?.off?.bind(bus) || bus?.unsubscribe?.bind(bus);
    if (off) {
      for (const [eventName, handler] of this._semanticSubscriptions) {
        off(eventName, handler);
      }
    }
    this._semanticSubscriptions = [];
  }
}

export default CorruptionVisualFX_v1;
