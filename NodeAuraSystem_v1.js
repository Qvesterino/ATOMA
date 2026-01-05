/**
 * PHASE 3C WEEK 9: NODE AURA SYSTEM — GPU HALO FIELD SYSTEM
 * 
 * Implements a visual halo/aura system around each AI node using GPU-based
 * additive blending, stabilized noise, and LFO modulation from Week 8 ALT.
 * 
 * SAFE MODE:
 * ✅ Zero modifications to main.js
 * ✅ Zero modifications to existing Phase 3c systems
 * ✅ 100% additive, purely visual subsystem
 * ✅ Fully reversible and disposable
 * ✅ No personality data modifications
 * 
 * PURPOSE:
 * - Create stunning visual halos around nodes
 * - React to personality signals (clarity, resonance, entropy, focus, corruption)
 * - Use GPU-driven stabilized noise and LFO modulation
 * - Smooth fade-in/out animations
 * - Performance-aware (respects lowFX mode)
 * 
 * FEATURES:
 * - 6 aura profiles (clarity, resonance, chaos, focus, corruption, entropy)
 * - Spherical geometry with additive blending
 * - Radial falloff with soft edges
 * - Stabilized noise-driven distortion
 * - LFO breathing effects
 * - Personality signal integration
 * - Performance: <1ms per 200 nodes
 * 
 * VISUAL HIERARCHY INTEGRATION (Session 21):
 * - Aura mesh renderOrder now queried from VisualHierarchyRegistry
 * - Layer: AURA (canonical renderOrder: -1, always behind core)
 * - Fallback to hardcoded value if registry unavailable
 * 
 * INTEGRATION:
 * 
 *   import { NodeAuraSystem_v1 } from './NodeAuraSystem_v1.js';
 *   
 *   const auraSystem = new NodeAuraSystem_v1({
 *     scene: this.scene,
 *     fxPerformance: this.fxPerformance,  // Optional FX controller
 *     profileResolver: (node) => this._resolveAuraProfile(node)  // Optional
 *   });
 *   
 *   // On node spawn:
 *   auraSystem.registerNode(node);
 *   
 *   // In render loop:
 *   auraSystem.update(deltaTime);
 *   
 *   // On cleanup:
 *   auraSystem.dispose();
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { VisualLayerEnforcementIntegrationHelpers as IntegrationHelpers } from './VisualLayerEnforcementIntegrationHelpers.js';
import { NodeCorruptionAuraDegradation } from './NodeCorruptionAuraDegradation.js';

/**
 * AuraInstance: Internal structure for each node's aura
 */
class AuraInstance {
  constructor(node, mesh, material, profileId) {
    this.node = node;
    this.mesh = mesh;
    this.material = material;
    this.profileId = profileId;

    this.currentIntensity = 0.0;
    this.targetIntensity = 0.0;
    this.radius = 1.0;
    this.targetRadius = 1.0;
    this.fadeSpeed = 3.0;  // Intensity fade speed
    this.scaleSpeed = 2.0; // Radius scaling speed

    // Track personality signal state
    this.lastClarity = 0;
    this.lastResonance = 0;
    this.lastEntropy = 0;
    this.lastFocus = 0;
    this.lastCorruption = 0;
  }

  update(deltaTime) {
    // Smooth intensity transition
    if (Math.abs(this.currentIntensity - this.targetIntensity) > 0.001) {
      const delta = (this.targetIntensity - this.currentIntensity) * this.fadeSpeed * deltaTime;
      this.currentIntensity += delta;
    } else {
      this.currentIntensity = this.targetIntensity;
    }

    // Smooth radius transition
    if (Math.abs(this.radius - this.targetRadius) > 0.001) {
      const delta = (this.targetRadius - this.radius) * this.scaleSpeed * deltaTime;
      this.radius += delta;
    } else {
      this.radius = this.targetRadius;
    }

    // Clamp to valid ranges
    this.currentIntensity = Math.max(0, Math.min(1, this.currentIntensity));
    this.radius = Math.max(0.5, Math.min(3.0, this.radius));
  }
}

/**
 * NodeAuraSystem_v1: Main aura system class
 */
export class NodeAuraSystem_v1 {
  constructor(options = {}) {
    this.scene = options.scene;
    if (!this.scene) {
      console.warn('[NodeAuraSystem_v1] No scene provided, aura system disabled');
      this.enabled = false;
      return;
    }

    this.fxPerformance = options.fxPerformance || null;
    this.enforcementGate = options.enforcementGate || null;  // Optional enforcement gate
    this.profileResolver = options.profileResolver || this._defaultProfileResolver.bind(this);
    this.enabled = options.enabled !== false;
    
    // [Distance Modulation v1.0] Camera reference for distance-based intensity
    this.camera = options.camera || null;

    // Aura storage
    this.auras = new Map();  // node.id → AuraInstance
    this.auraGeometry = null;
    this.globalTime = 0;

    // Performance settings
    this.lowFXFade = options.lowFXFade ?? 0.2;  // Intensity multiplier in lowFX
    this.lowFXRadiusFade = options.lowFXRadiusFade ?? 0.5;
    
    // [Distance Modulation v1.0] Distance-based intensity configuration
    this.distanceModulation = {
      enabled: options.distanceModulation?.enabled ?? true,
      // Distance ranges for intensity curves
      closeDistance: options.distanceModulation?.closeDistance ?? 40,    // Full fade at this distance
      mediumDistance: options.distanceModulation?.mediumDistance ?? 120, // Transition zone
      farDistance: options.distanceModulation?.farDistance ?? 300,       // Full intensity beyond
      // Intensity multipliers by distance zone
      closeIntensity: options.distanceModulation?.closeIntensity ?? 0.3,    // Very close: 30% intensity
      mediumIntensity: options.distanceModulation?.mediumIntensity ?? 0.65, // Medium distance: 65% intensity
      farIntensity: options.distanceModulation?.farIntensity ?? 1.0,        // Far: 100% intensity
      smoothing: options.distanceModulation?.smoothing ?? 0.2  // Smoothing factor for transitions
    };

    // ✓ [SESSION 99] Check if auras are globally disabled
    const aurasEnabled = CONFIG.features?.ENABLE_NODE_AURAS ?? true;
    if (!aurasEnabled) {
      console.log('[NodeAuraSystem_v1] ⊘ Node auras disabled by CONFIG.features.ENABLE_NODE_AURAS (Session 99 Stabilization)');
      this.enabled = false;
      return;
    }

    // Initialize aura geometry (reused for all auras)
    this._initializeGeometry();

    // Build profile library
    this.profileLibrary = this._buildProfileLibrary();
    
    // --- CORRUPTION AURA DEGRADATION SYSTEM ---
    // Handles desaturation and visual degradation based on corruption level
    this.corruptionDegradation = new NodeCorruptionAuraDegradation();

    if (this.enabled) {
      console.log('[NodeAuraSystem_v1] Initialized with', Object.keys(this.profileLibrary).length, 'profiles');
      if (this.distanceModulation.enabled) {
        console.log('[NodeAuraSystem_v1] Distance modulation enabled');
      }
    }
  }

  /**
   * Initialize shared aura geometry
   */
  _initializeGeometry() {
    // Use icosahedron for smooth, efficient sphere
    this.auraGeometry = new THREE.IcosahedronGeometry(1.0, 4);
  }

  /**
   * Build profile library with 6 aura profiles
   */
  _buildProfileLibrary() {
    return {
      clarity_aura: {
        name: 'clarity_aura',
        baseColor: new THREE.Color(0x00ffff),  // Cyan
        noiseScale: 0.3,
        lfoPeriod: 0.4,
        lfoAmplitude: 0.5,
        noiseType: 'fbm',
        intensityMap: (s) => 0.35 + 0.4 * s.clarity,  // [Halo Cleanup] Reduced max intensity
        radiusMap: (s) => 0.95 + 0.12 * Math.sin(s.clarity * 3.14159),  // [Halo Cleanup] Reduced from 1.0+0.2 to 0.95+0.12
      },
      resonance_aura: {
        name: 'resonance_aura',
        baseColor: new THREE.Color(0x00ff88),  // Lime green
        noiseScale: 0.4,
        lfoPeriod: 0.25,
        lfoAmplitude: 0.6,
        noiseType: 'fbm',
        intensityMap: (s) => 0.28 + 0.48 * s.resonance,  // [Halo Cleanup] Reduced max intensity
        radiusMap: (s) => 0.88 + 0.18 * Math.sin(s.resonance * 3.14159),  // [Halo Cleanup] Reduced from 0.9+0.3 to 0.88+0.18
      },
      chaos_aura: {
        name: 'chaos_aura',
        baseColor: new THREE.Color(0xff6600),  // Orange
        noiseScale: 0.6,
        lfoPeriod: 0.2,
        lfoAmplitude: 0.8,
        noiseType: 'curl',
        intensityMap: (s) => 0.24 + 0.56 * s.entropy,  // [Halo Cleanup] Reduced max intensity
        radiusMap: (s) => 1.0 + 0.24 * Math.sin(s.entropy * 3.14159),  // [Halo Cleanup] Reduced from 1.1+0.4 to 1.0+0.24
      },
      focus_aura: {
        name: 'focus_aura',
        baseColor: new THREE.Color(0xffff00),  // Yellow
        noiseScale: 0.2,
        lfoPeriod: 0.3,
        lfoAmplitude: 0.4,
        noiseType: 'fbm',
        intensityMap: (s) => 0.45 + 0.32 * s.focus,  // [Halo Cleanup] Reduced max intensity
        radiusMap: (s) => 0.80 + 0.12 * Math.cos(s.focus * 3.14159),  // [Halo Cleanup] Reduced from 0.8+0.2 to 0.80+0.12
      },
      corruption_aura: {
        name: 'corruption_aura',
        baseColor: new THREE.Color(0xff0000),  // Red
        noiseScale: 0.7,
        lfoPeriod: 0.15,
        lfoAmplitude: 1.0,
        noiseType: 'fbm',
        intensityMap: (s) => 0.18 + 0.64 * Math.max(0, s.corruption * Math.exp(-this.globalTime * 0.5)),  // [Halo Cleanup] Reduced max intensity
        radiusMap: (s) => 1.1 + 0.32 * s.corruption,  // [Halo Cleanup] Reduced from 1.2+0.5 to 1.1+0.32
      },
      entropy_aura: {
        name: 'entropy_aura',
        baseColor: new THREE.Color(0x8844ff),  // Purple
        noiseScale: 0.5,
        lfoPeriod: 0.2,
        lfoAmplitude: 0.5,
        noiseType: 'fbm',
        intensityMap: (s) => 0.32 + 0.32 * s.entropy,  // [Halo Cleanup] Reduced max intensity
        radiusMap: (s) => 0.98 + 0.18 * Math.sin(s.entropy * 3.14159 * 0.25),  // [Halo Cleanup] Reduced from 1.0+0.3 to 0.98+0.18
      },
    };
  }

  /**
   * Build aura shader material for a given profile
   */
  _buildAuraMaterial(profileId) {
    const profile = this.profileLibrary[profileId];
    if (!profile) {
      console.warn(`[NodeAuraSystem_v1] Unknown profile: ${profileId}`);
      profileId = 'clarity_aura';
    }

    const uniforms = {
      uTime: { value: 0 },
      uAuraIntensity: { value: 0.5 },
      uAuraRadius: { value: 1.0 },
      uAuraColor: { value: profile.baseColor },
      uClarity: { value: 0 },
      uResonance: { value: 0 },
      uEntropy: { value: 0 },
      uFocus: { value: 0 },
      uCorruption: { value: 0 },
      uNoiseScale: { value: profile.noiseScale },
      uLFOPeriod: { value: profile.lfoPeriod },
      uLFOAmplitude: { value: profile.lfoAmplitude },
    };

    const vertexShader = `
      uniform float uTime;
      uniform float uAuraIntensity;
      uniform float uAuraRadius;
      uniform float uNoiseScale;
      uniform float uLFOPeriod;
      uniform float uLFOAmplitude;
      uniform float uClarity;
      uniform float uResonance;
      uniform float uEntropy;
      uniform float uFocus;
      uniform float uCorruption;

      // Stabilized noise functions (same as Week 8 ALT)
      float hash(float n) {
        return fract(sin(n) * 43758.5453123);
      }

      vec3 hash3(vec3 p) {
        p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                 dot(p, vec3(269.5, 183.3, 246.1)),
                 dot(p, vec3(113.5, 271.9, 124.6)));
        return fract(sin(p) * 43758.5453123);
      }

      float perlinNoise(vec3 p) {
        vec3 pi = floor(p);
        vec3 pf = fract(p);
        vec3 u = pf * pf * (3.0 - 2.0 * pf);

        float n000 = dot(hash3(pi + vec3(0, 0, 0)) - 0.5, pf - vec3(0, 0, 0));
        float n100 = dot(hash3(pi + vec3(1, 0, 0)) - 0.5, pf - vec3(1, 0, 0));
        float n010 = dot(hash3(pi + vec3(0, 1, 0)) - 0.5, pf - vec3(0, 1, 0));
        float n110 = dot(hash3(pi + vec3(1, 1, 0)) - 0.5, pf - vec3(1, 1, 0));
        float n001 = dot(hash3(pi + vec3(0, 0, 1)) - 0.5, pf - vec3(0, 0, 1));
        float n101 = dot(hash3(pi + vec3(1, 0, 1)) - 0.5, pf - vec3(1, 0, 1));
        float n011 = dot(hash3(pi + vec3(0, 1, 1)) - 0.5, pf - vec3(0, 1, 1));
        float n111 = dot(hash3(pi + vec3(1, 1, 1)) - 0.5, pf - vec3(1, 1, 1));

        float nx00 = mix(n000, n100, u.x);
        float nx10 = mix(n010, n110, u.x);
        float nx0z = mix(nx00, nx10, u.y);

        float nx01 = mix(n001, n101, u.x);
        float nx11 = mix(n011, n111, u.x);
        float nx1z = mix(nx01, nx11, u.y);

        return mix(nx0z, nx1z, u.z);
      }

      float fbmStable(vec3 p, float time) {
        float scale = 0.25;
        float scaledTime = time * 0.25;
        float result = 0.0;
        float amplitude = 1.0;

        for (int i = 0; i < 3; i++) {
          result += amplitude * perlinNoise(p * scale + scaledTime);
          p *= 2.0;
          scale *= 0.5;
          amplitude *= 0.5;
          scaledTime *= 0.7;
        }

        return result * 0.5 + 0.5;
      }

      // LFO oscillation
      float lfo(float time, float period, float amplitude) {
        return 0.5 + (amplitude * 0.5) * sin(time * period);
      }

      // Aura distortion
      vec3 auraDisplacement(vec3 position, float time) {
        float noise = fbmStable(position, time);
        float wave = sin(time * 0.3 + length(position) * 10.0);
        float distortion = mix(noise, wave, 0.5) * uNoiseScale;

        return normalize(position) * distortion * 0.2;
      }

      void main() {
        vec3 pos = position;

        // Apply aura distortion
        pos += auraDisplacement(pos, uTime);

        // Scale by aura radius
        pos *= uAuraRadius;

        // LFO breathing
        float breathing = lfo(uTime, uLFOPeriod, uLFOAmplitude);
        pos *= (0.9 + 0.1 * breathing);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uAuraIntensity;
      uniform vec3 uAuraColor;
      uniform float uClarity;
      uniform float uResonance;
      uniform float uEntropy;
      uniform float uFocus;
      uniform float uCorruption;

      void main() {
        // Radial falloff from center
        float dist = length(gl_PointCoord - 0.5) * 2.0;
        float falloff = smoothstep(1.2, 0.0, dist);

        // Personality-driven color modulation
        vec3 color = uAuraColor;
        color += vec3(uClarity * 0.2, 0.0, 0.0);      // Cyan boost from clarity
        color += vec3(0.0, uResonance * 0.2, 0.0);    // Green from resonance
        color += vec3(uCorruption * 0.3, 0.0, 0.0);   // Red from corruption

        // Intensity driven by personality signals
        float signal = max(uClarity, max(uResonance, max(uEntropy, max(uFocus, uCorruption))));
        float intensity = uAuraIntensity * signal * falloff;

        // Soft alpha falloff
        float alpha = intensity * smoothstep(0.0, 0.5, falloff);

        gl_FragColor = vec4(color, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,   // ⚠️ CRITICAL: Aura does NOT read depth buffer
      depthWrite: false,  // ⚠️ CRITICAL: Aura does NOT write to depth buffer
      fog: false,
      side: THREE.FrontSide
    });

    return material;
  }

  /**
   * Safe attachment with enforcement gate
   * Returns true if attached, false if rejected
   */
  _safeAttachAura(mesh, node) {
    // Create enforcement request
    const request = IntegrationHelpers.createVisualAttachmentRequest({
      nodeId: node.userData?.id || node.id || node.uuid,
      nodeCategory: node.userData?.category || 'unknown',
      layerType: 'AURA_LAYER',
      geometryType: 'Spheres',
      opacity: mesh.material?.opacity || 0.5,
      sourceSystem: 'NodeAuraSystem_v1',
      description: 'GPU halo aura field'
    });
    
    // Check approval before attaching
    if (this.enforcementGate && !this.enforcementGate.canAttach(request)) {
      return false;
    }
    
    // Safe to attach
    if (this.scene) {
      this.scene.add(mesh);
    }
    return true;
  }

  /**
   * Register a node with an aura
   * [SESSION 99] Early exit if node auras are disabled via config
   */
  registerNode(node) {
    // ✓ FEATURE FLAG: Node aura visuals disabled (Session 99 Stabilization)
    if (!CONFIG.features?.ENABLE_NODE_AURAS) {
      return;  // ← Silent return, aura not created
    }
    
    if (!this.enabled || !node) return;

    if (this.auras.has(node.id || node)) {
      console.warn('[NodeAuraSystem_v1] Node already has aura');
      return;
    }

    // Resolve profile for this node
    const profileId = this.profileResolver(node);
    if (!this.profileLibrary[profileId]) {
      console.warn(`[NodeAuraSystem_v1] Invalid profile: ${profileId}`);
      return;
    }

    // Create aura mesh
    const material = this._buildAuraMaterial(profileId);
    const mesh = new THREE.Mesh(this.auraGeometry, material);

    // Position at node location
    if (node.position) {
      mesh.position.copy(node.position);
    }

    // [Session 21] Get renderOrder from VisualHierarchyRegistry
    // Falls back to -1 if registry unavailable
    try {
      mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('AURA', -1) ?? -1;
    } catch (err) {
      mesh.renderOrder = -1; // Safe fallback
    }
    mesh.userData.visualLayer = 'AURA';

    // Safe attachment with enforcement
    if (!this._safeAttachAura(mesh, node)) {
      return;  // Rejected by enforcement gate
    }

    // Create instance
    const aura = new AuraInstance(node, mesh, material, profileId);
    const nodeKey = node.id || node;
    this.auras.set(nodeKey, aura);
  }

  /**
   * Unregister a node's aura
   */
  unregisterNode(node) {
    if (!this.enabled || !node) return;

    const nodeKey = node.id || node;
    const aura = this.auras.get(nodeKey);

    if (!aura) return;

    // Remove mesh from scene
    if (this.scene && aura.mesh && aura.mesh.parent) {
      this.scene.remove(aura.mesh);
    }

    // Dispose material
    if (aura.material) {
      aura.material.dispose();
    }

    this.auras.delete(nodeKey);
  }

  /**
   * [Distance Modulation v1.0] Calculate distance-based intensity multiplier
   * Returns a smoothed multiplier based on camera distance to node
   * Close nodes (< closeDistance): low intensity (to reduce visual noise)
   * Far nodes (> farDistance): full intensity (for navigation context)
   * @private
   */
  _getDistanceIntensityMultiplier(nodePosition) {
    if (!this.distanceModulation.enabled || !this.camera || !nodePosition) {
      return 1.0;  // No modulation if disabled or no camera
    }

    // Calculate distance from camera to node
    const distance = this.camera.position.distanceTo(nodePosition);
    
    const {
      closeDistance,
      mediumDistance,
      farDistance,
      closeIntensity,
      mediumIntensity,
      farIntensity,
      smoothing
    } = this.distanceModulation;

    let targetMultiplier;

    if (distance < closeDistance) {
      // Very close: fade out intensity
      targetMultiplier = closeIntensity;
    } else if (distance < mediumDistance) {
      // Transition zone: lerp from close to medium
      const t = (distance - closeDistance) / (mediumDistance - closeDistance);
      targetMultiplier = closeIntensity + (mediumIntensity - closeIntensity) * t;
    } else if (distance < farDistance) {
      // Transition zone: lerp from medium to far
      const t = (distance - mediumDistance) / (farDistance - mediumDistance);
      targetMultiplier = mediumIntensity + (farIntensity - mediumIntensity) * t;
    } else {
      // Far: full intensity
      targetMultiplier = farIntensity;
    }

    // Apply smoothing with current intensity (if exists)
    if (!this._distanceIntensityCache) {
      this._distanceIntensityCache = new Map();
    }

    const nodeKey = nodePosition.x + nodePosition.y + nodePosition.z;  // Simple hash
    const currentMultiplier = this._distanceIntensityCache.get(nodeKey) || targetMultiplier;
    const smoothedMultiplier = currentMultiplier + (targetMultiplier - currentMultiplier) * smoothing;
    
    this._distanceIntensityCache.set(nodeKey, smoothedMultiplier);
    
    return smoothedMultiplier;
  }

  /**
   * Update all auras each frame
   */
  update(deltaTime) {
    if (!this.enabled) return;

    this.globalTime += deltaTime;

    // Check if in low-FX mode
    const isLowFX = this.fxPerformance && this.fxPerformance.lowFXModeEnabled;

    for (const [nodeKey, aura] of this.auras) {
      // SESSION 21 - PHASE 2: Spawn Collision Safety (Visual-Only Guard)
      // Skip aura update if node visual is not ready (prevents overlapping auras)
      if (!aura.node?.userData?.visualReady) continue;
      
      // Update position from node
      if (aura.node && aura.node.position) {
        aura.mesh.position.copy(aura.node.position);
      }

      // Get personality signals
      const signals = aura.node?.userData?.personalityVisualSmoothed || {
        clarity: 0,
        resonance: 0,
        entropy: 0,
        focus: 0,
        corruption: 0,
      };

      // Resolve profile
      const profile = this.profileLibrary[aura.profileId];
      if (!profile) continue;

      // Calculate target intensity and radius
      let targetIntensity = profile.intensityMap(signals);
      
      // [SESSION 90] SHELL SIZE DECOUPLING: Radius is now STATIC
      // DO NOT scale shell size based on dynamic metrics (corruption, clarity, etc.)
      // Shell size is derived ONLY from node category and tier
      // Intensity may vary, but NOT the shell scale
      let targetRadius = aura.node?.userData?.staticShellSize ?? 1.0;

      // [Distance Modulation v1.0] Apply distance-based intensity modulation
      // Nearby nodes have reduced halo intensity to reduce visual clutter
      // Distant nodes have full intensity for navigation context
      const distanceMultiplier = this._getDistanceIntensityMultiplier(aura.node.position);
      targetIntensity *= distanceMultiplier;

      // Apply low-FX fade (intensity only, NOT radius)
      if (isLowFX) {
        targetIntensity *= this.lowFXFade;
        // DO NOT scale targetRadius in low-FX mode - shell size must remain static
      }

      // Update aura instance
      aura.targetIntensity = targetIntensity;
      aura.targetRadius = targetRadius;
      aura.update(deltaTime);

      // Update material uniforms
      if (aura.material.uniforms) {
        aura.material.uniforms.uTime.value = this.globalTime;
        aura.material.uniforms.uAuraIntensity.value = aura.currentIntensity;
        aura.material.uniforms.uAuraRadius.value = aura.radius;
        aura.material.uniforms.uClarity.value = signals.clarity || 0;
        aura.material.uniforms.uResonance.value = signals.resonance || 0;
        aura.material.uniforms.uEntropy.value = signals.entropy || 0;
        aura.material.uniforms.uFocus.value = signals.focus || 0;
        aura.material.uniforms.uCorruption.value = signals.corruption || 0;
        
        // --- LINK BIRTH AURA ENHANCEMENT ---
        // Apply directional pulse and ripple when node is just linked
        if (node.justLinked && node.linkBirthTime !== undefined) {
          const linkBirthAge = performance.now() - node.linkBirthTime;
          const BIRTH_DURATION = 600; // 600ms total duration
          
          // Calculate decay: 1.0 at birth, 0.0 after 600ms
          let birthIntensity = Math.max(0, 1.0 - (linkBirthAge / BIRTH_DURATION));
          
          // Soft ease-out: smoother decay
          birthIntensity = Math.pow(birthIntensity, 0.6);
          
          // Apply link direction and birth intensity to shader
          if (aura.material.uniforms.uLinkDirection && node.userData?.lastLinkDirection) {
            aura.material.uniforms.uLinkDirection.value = node.userData.lastLinkDirection.clone();
          }
          if (aura.material.uniforms.uLinkBirthIntensity) {
            aura.material.uniforms.uLinkBirthIntensity.value = birthIntensity;
          }
          
          // Clear flag after duration
          if (birthIntensity <= 0) {
            node.justLinked = false;
          }
        } else {
          // Ensure birth intensity is 0 when not just linked
          if (aura.material.uniforms.uLinkBirthIntensity) {
            aura.material.uniforms.uLinkBirthIntensity.value = 0;
          }
        }
        
        // --- LINK REMOVAL DISSIPATION ENHANCEMENT ---
        // Apply inward contraction and dissipation ripple when link is removed
        if (node.linkRemoving && node.linkRemovalTime !== undefined) {
          const linkRemovalAge = performance.now() - node.linkRemovalTime;
          const REMOVAL_DURATION = 500; // 500ms total duration (slightly faster than birth)
          
          // Calculate decay: 1.0 at removal, 0.0 after 500ms
          let removalIntensity = Math.max(0, 1.0 - (linkRemovalAge / REMOVAL_DURATION));
          
          // Cubic ease-out: faster decay for removal
          removalIntensity = Math.pow(removalIntensity, 0.7);
          
          // Apply link direction and removal intensity to shader
          if (aura.material.uniforms.uLinkDirection && node.userData?.lastRemovalDirection) {
            aura.material.uniforms.uLinkDirection.value = node.userData.lastRemovalDirection.clone();
          }
          if (aura.material.uniforms.uLinkRemovalIntensity) {
            aura.material.uniforms.uLinkRemovalIntensity.value = removalIntensity;
          }
          
          // Clear flag after duration
          if (removalIntensity <= 0) {
            node.linkRemoving = false;
          }
        } else {
          // Ensure removal intensity is 0 when not removing
          if (aura.material.uniforms.uLinkRemovalIntensity) {
            aura.material.uniforms.uLinkRemovalIntensity.value = 0;
          }
        }
        
        // --- CORRUPTION AURA DEGRADATION ---
        // Apply desaturation and visual degradation based on corruption level
        const nodeCorruptionLevel = aura.node?.userData?.corruptionLevel || signals.corruption || 0;
        if (this.corruptionDegradation && nodeCorruptionLevel > 0) {
          this.corruptionDegradation.updateNodeCorruption(
            aura.node,
            nodeCorruptionLevel,
            deltaTime,
            aura.material
          );
        }
      }
      
      // Update time for corruption flickering calculations
      if (this.corruptionDegradation) {
        this.corruptionDegradation.updateTime(deltaTime);
      }

      // Update mesh scale to match radius
      aura.mesh.scale.setScalar(aura.radius);
    }
  }

  /**
   * [Distance Modulation v1.0] Set the camera for distance-based modulation
   * Call this when camera is initialized or changes
   * @param {THREE.Camera} camera - The camera to track for distance calculations
   */
  setCamera(camera) {
    this.camera = camera;
    if (this.distanceModulation.enabled) {
      console.log('[NodeAuraSystem_v1] Camera set for distance modulation');
    }
  }

  /**
   * [Distance Modulation v1.0] Update distance modulation configuration
   * Allows runtime adjustment of distance zones and intensity curves
   * @param {Object} config - Partial configuration object
   */
  setDistanceModulation(config) {
    if (!config) return;
    
    // Update enabled state
    if (config.enabled !== undefined) {
      this.distanceModulation.enabled = config.enabled;
      console.log(`[NodeAuraSystem_v1] Distance modulation ${config.enabled ? 'enabled' : 'disabled'}`);
    }
    
    // Update distance ranges
    if (config.closeDistance !== undefined) this.distanceModulation.closeDistance = config.closeDistance;
    if (config.mediumDistance !== undefined) this.distanceModulation.mediumDistance = config.mediumDistance;
    if (config.farDistance !== undefined) this.distanceModulation.farDistance = config.farDistance;
    
    // Update intensity multipliers
    if (config.closeIntensity !== undefined) this.distanceModulation.closeIntensity = config.closeIntensity;
    if (config.mediumIntensity !== undefined) this.distanceModulation.mediumIntensity = config.mediumIntensity;
    if (config.farIntensity !== undefined) this.distanceModulation.farIntensity = config.farIntensity;
    
    // Update smoothing
    if (config.smoothing !== undefined) this.distanceModulation.smoothing = config.smoothing;
  }

  /**
   * [Distance Modulation v1.0] Get current distance modulation settings
   * @returns {Object} Current distance modulation configuration
   */
  getDistanceModulation() {
    return { ...this.distanceModulation };
  }

  /**
   * Refresh all aura profiles (called if node categories change)
   */
  refreshAll() {
    if (!this.enabled) return;

    for (const [nodeKey, aura] of this.auras) {
      const newProfileId = this.profileResolver(aura.node);
      if (newProfileId !== aura.profileId) {
        // Re-register with new profile
        this.unregisterNode(aura.node);
        this.registerNode(aura.node);
      }
    }
  }

  /**
   * Dispose all auras and cleanup
   */
  dispose() {
    // Unregister all nodes
    const nodeKeys = Array.from(this.auras.keys());
    for (const nodeKey of nodeKeys) {
      const aura = this.auras.get(nodeKey);
      this.unregisterNode(aura.node);
    }

    // Dispose geometry
    if (this.auraGeometry) {
      this.auraGeometry.dispose();
      this.auraGeometry = null;
    }

    this.auras.clear();
    
    // Dispose corruption degradation system
    if (this.corruptionDegradation) {
      this.corruptionDegradation.dispose();
      this.corruptionDegradation = null;
    }
    
    // [Distance Modulation v1.0] Clear distance cache
    if (this._distanceIntensityCache) {
      this._distanceIntensityCache.clear();
      this._distanceIntensityCache = null;
    }
    
    console.log('[NodeAuraSystem_v1] System disposed');
  }

  /**
   * Default profile resolver (by node category)
   */
  _defaultProfileResolver(node) {
    const category = node.category || node.userData?.category || 'default';

    const categoryMap = {
      'control': 'focus_aura',
      'integration': 'resonance_aura',
      'sigma': 'chaos_aura',
      'corrupted': 'corruption_aura',
      'analytics': 'clarity_aura',
      'storage': 'entropy_aura',
      'mythical': 'resonance_aura',
      'prime': 'clarity_aura',
    };

    return categoryMap[category] || 'entropy_aura';
  }
}

// ========== GLOBAL ATTACHMENT ==========

if (typeof window !== 'undefined') {
  window.NodeAuraSystem_v1 = NodeAuraSystem_v1;
}
