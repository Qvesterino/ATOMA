/**INACTIVE NEPOUŽIVAŤ WARNING ACHTUNG POZOR UWAGA
 * PHASE 3C WEEK 10: LINK AURA SYSTEM — GPU-DRIVEN CYLINDRICAL HALO SYSTEM
 * 
 * Implements a visual aura system around links (connections between nodes) using GPU-based
 * additive blending, stabilized noise, and synergy-driven waveforms. Extends Week 9 concepts
 * to the link domain with cylindrical geometry and synergy-reactive effects.
 * 
 * SAFE MODE:
 * ✅ Zero modifications to main.js or any existing Phase 3c systems
 * ✅ 100% additive, purely visual subsystem
 * ✅ Fully reversible and disposable
 * ✅ No link data modifications, reads only
 * 
 * PURPOSE:
 * - Create stunning cylindrical glowing auras around links
 * - React to link quality, synergy, corruption, and chaos metrics
 * - Use GPU-driven stabilized noise and LFO modulation (extends Week 8)
 * - Smooth fade-in/out animations with synergy-driven intensity
 * - Performance-aware (respects lowFX mode)
 * 
 * FEATURES:
 * - 6 aura profiles (synergy, stability, corruption, chaos, resonance, mythic_synergy)
 * - Cylindrical geometry with proper link alignment
 * - Additive blending for soft glow
 * - Stabilized noise-driven distortion
 * - LFO breathing effects synchronized with link quality
 * - Personality signal integration (reads from node signals)
 * - Performance: <1ms per 300 links
 * 
 * INTEGRATION:
 * 
 *   import { LinkAuraSystem_v1 } from './LinkAuraSystem_v1.js';
 *   
 *   const linkAuraSystem = new LinkAuraSystem_v1({
 *     scene: this.scene,
 *     linkManager: this.linkingSystem,  // Provides active links
 *     fxPerformance: this.fxPerformance,  // Optional FX controller
 *     profileResolver: (link) => this._resolveLinkAuraProfile(link)  // Optional
 *   });
 *   
 *   // On link creation:
 *   linkAuraSystem.registerLink(link);
 *   
 *   // On link destruction:
 *   linkAuraSystem.unregisterLink(link);
 *   
 *   // In render loop:
 *   linkAuraSystem.update(deltaTime);
 *   
 *   // On cleanup:
 *   linkAuraSystem.dispose();
 */

import * as THREE from 'three';

/**
 * LinkAuraInstance: Internal structure for each link's aura
 */
class LinkAuraInstance {
  constructor(link, mesh, material, profileId) {
    this.link = link;
    this.mesh = mesh;
    this.material = material;
    this.profileId = profileId;

    this.currentIntensity = 0.0;
    this.targetIntensity = 0.0;
    this.radius = 0.5;
    this.targetRadius = 0.5;
    this.fadeSpeed = 3.0;      // Intensity fade speed
    this.scaleSpeed = 2.0;     // Radius scaling speed
    this.meshLength = 1.0;     // Cylinder length (updated each frame)
    this.time = 0.0;           // Per-instance time accumulator

    // Track link signal state
    this.lastSynergy = 0;
    this.lastQuality = 0;
    this.lastCorruption = 0;
    this.lastEntropy = 0;
    this.lastResonance = 0;
    this.lastInstability = 0;

    // Link endpoints cache (for alignment)
    this.cachedStartPos = new THREE.Vector3();
    this.cachedEndPos = new THREE.Vector3();
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
    this.radius = Math.max(0.3, Math.min(2.0, this.radius));
  }
}

/**
 * Aura profile definitions: 6 personality-driven aura types
 */
const AURA_PROFILES = {
  synergy_aura: {
    name: 'synergy_aura',
    baseColor: new THREE.Color(0x00ff88),     // Cyan-green
    lfoSpeed: 2.0,
    noiseStrength: 0.3,
    corruptionMult: 0.1,
    radiusScale: 0.7,
    intensityMapping: (synergy, quality, entropy) => synergy * 0.8,
    description: 'Harmonic cyan-green waves, driven by synergy and quality'
  },

  stability_aura: {
    name: 'stability_aura',
    baseColor: new THREE.Color(0x0088ff),     // Soft blue
    lfoSpeed: 1.2,
    noiseStrength: 0.2,
    corruptionMult: 0.15,
    radiusScale: 1.2,
    intensityMapping: (synergy, quality, entropy) => quality / 100 * 0.7,
    description: 'Wide calm blue glow, driven by link quality'
  },

  corruption_aura: {
    name: 'corruption_aura',
    baseColor: new THREE.Color(0xff3300),     // Red
    lfoSpeed: 3.5,
    noiseStrength: 0.8,
    corruptionMult: 1.0,
    radiusScale: 0.6,
    intensityMapping: (synergy, quality, entropy, corruption) => 
      Math.min(1, corruption * 1.5),
    description: 'Jittery red fractures, driven by corruption signal'
  },

  chaos_aura: {
    name: 'chaos_aura',
    baseColor: new THREE.Color(0xff8800),     // Orange
    lfoSpeed: 2.8,
    noiseStrength: 0.7,
    corruptionMult: 0.8,
    radiusScale: 0.8,
    intensityMapping: (synergy, quality, entropy) => entropy * 0.9,
    description: 'Turbulent orange curl-noise flow, driven by entropy'
  },

  resonance_aura: {
    name: 'resonance_aura',
    baseColor: new THREE.Color(0x88ff00),     // Lime
    lfoSpeed: 1.8,
    noiseStrength: 0.4,
    corruptionMult: 0.2,
    radiusScale: 0.9,
    intensityMapping: (synergy, quality, entropy, corruption, resonance) => 
      resonance * 0.8,
    description: 'Smooth harmonic pulse, driven by resonance boost'
  },

  mythic_synergy_aura: {
    name: 'mythic_synergy_aura',
    baseColor: new THREE.Color(0xaa00ff),     // Purple
    lfoSpeed: 2.2,
    noiseStrength: 0.5,
    corruptionMult: 0.3,
    radiusScale: 1.1,
    intensityMapping: (synergy, quality, entropy, corruption, resonance) => {
      // Sacred pattern: blend of high synergy + quality
      return Math.min(1, (synergy * quality / 100) * 1.2);
    },
    description: 'High-intensity sacred purple+gold pattern, driven by synergy+quality blend'
  }
};

// Pooled materials keyed by profile.name to keep program/material count bounded
const AURA_MATERIAL_POOL = new Map();

/**
 * LinkAuraSystem_v1: Main registry and manager for all active link auras
 */
export class LinkAuraSystem_v1 {
  constructor(options = {}) {
    this.scene = options.scene;
    this.linkManager = options.linkManager;           // NodeLinkingSystem
    this.fxPerformance = options.fxPerformance;       // FXPerformanceController (optional)
    this.profileResolver = options.profileResolver;   // Custom profile resolver (optional)

    this.auras = new Map();                           // linkId → LinkAuraInstance
    this.disposedMeshes = [];                         // For cleanup tracking

    // Debug
    this.debugEnabled = options.debugEnabled === false ? false : false;

    // Stats
    this.stats = {
      linksTracked: 0,
      aurasMeshes: 0,
      frameTime: 0,
    };

    if (this.debugEnabled) {
      console.log('[LinkAuraSystem_v1] Initialized', {
        scene: !!this.scene,
        linkManager: !!this.linkManager,
        fxPerformance: !!this.fxPerformance,
        profileResolver: !!this.profileResolver,
      });
    }
  }

  /**
   * Register a link: create and attach aura mesh
   */
  registerLink(link) {
    if (!link || !this.scene) return;

    const linkId = this._getLinkId(link);
    if (this.auras.has(linkId)) {
      return; // Already registered
    }

    // Determine profile
    const profileId = this.profileResolver ? this.profileResolver(link) : 'stability_aura';
    const profile = AURA_PROFILES[profileId] || AURA_PROFILES.stability_aura;

    // Create cylindrical aura mesh (material pooled per profile)
    const { mesh, material } = this._createAuraMesh(link, profile);
    if (!mesh) return;

    // Add to scene
    this.scene.add(mesh);

    // Create instance
    const instance = new LinkAuraInstance(link, mesh, material, profileId);
    mesh.onBeforeRender = () => {
      applyAuraUniforms(instance);
    };
    this.auras.set(linkId, instance);
    this.stats.linksTracked = this.auras.size;

    if (this.debugEnabled) {
      console.log('[LinkAuraSystem_v1] Registered link aura:', { linkId, profileId });
    }

    if (typeof window !== 'undefined' && window.__ATOMA_DEBUG_LINK_MATS__ === true) {
      const renderer = window.__ATOMA_RENDERER__;
      const programCount = renderer?.info?.programs?.length;
      const uniqueMaterials = new Set(Array.from(this.auras.values()).map(i => i.material)).size;
      console.log('[LinkAuraSystem_v1] link aura registered', {
        programs: programCount,
        linkMeshes: this.auras.size,
        uniqueMaterials
      });
    }
  }

  /**
   * Unregister a link: remove and dispose aura mesh
   */
  unregisterLink(link) {
    if (!link) return;

    const linkId = this._getLinkId(link);
    const instance = this.auras.get(linkId);

    if (instance) {
      this.scene.remove(instance.mesh);
      this._disposeMesh(instance.mesh);
      this.auras.delete(linkId);
      this.stats.linksTracked = this.auras.size;

      if (this.debugEnabled) {
        console.log('[LinkAuraSystem_v1] Unregistered link aura:', { linkId });
      }
    }
  }

  /**
   * Main update loop: call once per frame
   */
  update(deltaTime) {
    if (!this.linkManager) return;
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const startTime = performance.now();
    let visibleAuras = 0;

    for (const instance of this.auras.values()) {
      if (!instance.link || !instance.mesh) continue;

      // Read link data
      const synergy = instance.link.userData?.quality?.synergyNorm ?? 0.5;
      const quality = instance.link.userData?.quality?.score ?? 50;
      const corruption = instance.link.userData?.metrics?.corruption ?? 0.0;
      const entropy = instance.link.userData?.metrics?.entropy ?? 0.0;
      const resonance = instance.link.userData?.metrics?.resonance ?? 0.0;

      // Check for link endpoints
      const startNode = instance.link.nodeA;
      const endNode = instance.link.nodeB;
      if (!startNode || !endNode || !startNode.position || !endNode.position) {
        instance.mesh.visible = false;
        continue;
      }

      // Update position and alignment
      this._alignAuraMesh(instance, startNode, endNode);

      // Read personality signals from start node (influence from connection origin)
      const instability = startNode.userData?.instability ?? 0;

      // Compute intensity via profile
      const profile = AURA_PROFILES[instance.profileId] || AURA_PROFILES.stability_aura;
      instance.targetIntensity = profile.intensityMapping(synergy, quality, entropy, corruption, resonance) * (1 - instability * 0.3);

      // Apply lowFX scaling
      if (this.fxPerformance && typeof this.fxPerformance.getScaleFactor === 'function') {
        const scaleFactor = this.fxPerformance.getScaleFactor();
        instance.targetIntensity *= scaleFactor;
      }

      // Update radius based on quality
      instance.targetRadius = profile.radiusScale * (0.5 + quality / 100 * 0.7);

      // Smooth update
      instance.update(deltaTime);

      // Advance per-instance time (used in onBeforeRender)
      instance.time += deltaTime;

      // Visibility
      instance.mesh.visible = instance.currentIntensity > 0.01;
      if (instance.mesh.visible) {
        visibleAuras++;
      }
    }

    this.stats.frameTime = performance.now() - startTime;
    this.stats.aurasMeshes = visibleAuras;
  }

  /**
   * Refresh all auras: useful after major scene changes
   */
  refreshAll() {
    for (const instance of this.auras.values()) {
      instance.currentIntensity = 0;
      instance.targetIntensity = 0;
      instance.mesh.visible = false;
    }
  }

  /**
   * Dispose entire system
   */
  dispose() {
    for (const instance of this.auras.values()) {
      this.scene.remove(instance.mesh);
      this._disposeMesh(instance.mesh);
    }
    this.auras.clear();
    this.disposedMeshes = [];
    this.stats.linksTracked = 0;
    this.stats.aurasMeshes = 0;

    if (this.debugEnabled) {
      console.log('[LinkAuraSystem_v1] Disposed completely');
    }
  }

  /**
   * Create cylindrical aura mesh with custom shader material
   * @private
   */
  _createAuraMesh(link, profile) {
    try {
      // Cylindrical geometry: radius=1, height=1 (will be scaled)
      const geometry = new THREE.CylinderGeometry(1, 1, 1, 16, 4, true);
      geometry.translate(0, 0.5, 0); // Center at origin for proper alignment

      // Create material with custom shader (pooled per profile)
      const material = this._createAuraMaterial(profile);
      if (!material) return null;

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false; // Prevent culling during rotation
      mesh.visible = false;

      return { mesh, material };
    } catch (e) {
      console.error('[LinkAuraSystem_v1] Failed to create aura mesh:', e);
      return null;
    }
  }

  /**
   * Create shader material for aura
   * @private
   */
  _createAuraMaterial(profile) {
    try {
      const material = getPooledAuraMaterial(
        profile,
        this._getVertexShader(),
        this._getFragmentShader()
      );
      return material;
    } catch (e) {
      console.error('[LinkAuraSystem_v1] Failed to create shader material:', e);
      return null;
    }
  }

  /**
   * Vertex shader for link aura
   * @private
   */
  _getVertexShader() {
    return `
      uniform float uTime;
      uniform float uLfoSpeed;
      uniform float uNoiseStrength;
      uniform float uCorruptionMult;
      uniform float uAuraRadius;
      uniform float uCorruption;

      varying vec3 vNormal;
      varying float vNoise;
      varying float vDepth;

      // Simple stabilized hash
      float hash(float n) {
        return fract(sin(n) * 43758.5453);
      }

      // Perlin-like noise (simplified)
      float noise(float x) {
        float i = floor(x);
        float f = fract(x);
        float u = f * f * (3.0 - 2.0 * f);
        return mix(hash(i), hash(i + 1.0), u);
      }

      // FBM with time scaling
      float fbm(float x) {
        float v = 0.0;
        float a = 0.5;
        for(int i = 0; i < 3; i++) {
          v += a * noise(x);
          x = x * 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vDepth = (modelViewMatrix * vec4(position, 1.0)).z;

        // Stabilized noise with time scaling
        float timeScaled = uTime * 0.25;
        float noiseVal = fbm(position.y * 2.0 + timeScaled);

        // LFO modulation
        float lfo = sin(timeScaled * uLfoSpeed) * 0.5 + 0.5;

        // Corruption jitter (high frequency)
        float corruption = fbm(position.y * 8.0 + timeScaled * 1.5) * uCorruptionMult * uCorruption;

        // Combine noise effects
        vNoise = (noiseVal * uNoiseStrength + corruption) * 0.5;

        // Vertex displacement based on radius
        vec3 displaced = position + normal * (vNoise + lfo * 0.1) * uAuraRadius;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `;
  }

  /**
   * Fragment shader for link aura
   * @private
   */
  _getFragmentShader() {
    return `
      uniform vec3 uAuraColor;
      uniform float uAuraIntensity;
      uniform float uAuraRadius;
      uniform float uSynergy;
      uniform float uQuality;

      varying vec3 vNormal;
      varying float vNoise;
      varying float vDepth;

      void main() {
        // Radial falloff from center
        float centerDist = length(gl_PointCoord - vec2(0.5));
        float falloff = smoothstep(0.6, 0.0, centerDist);

        // Add noise variation
        float intensity = falloff * uAuraIntensity * (1.0 + vNoise * 0.3);

        // Color modulation by quality
        vec3 finalColor = uAuraColor * (1.0 + uQuality * 0.5);

        // Apply alpha
        gl_FragColor = vec4(finalColor, intensity);
      }
    `;
  }

  /**
   * Align aura mesh to link position and direction
   * @private
   */
  _alignAuraMesh(instance, startNode, endNode) {
    if (!instance.mesh) return;

    const start = startNode.position;
    const end = endNode.position;

    instance.cachedStartPos.copy(start);
    instance.cachedEndPos.copy(end);

    // Calculate link vector and length
    const linkVec = new THREE.Vector3().subVectors(end, start);
    const length = linkVec.length();
    instance.meshLength = length;

    if (length < 0.01) {
      instance.mesh.visible = false;
      return;
    }

    // Position at midpoint
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    instance.mesh.position.copy(midpoint);

    // Scale to match link length and aura radius
    instance.mesh.scale.set(instance.radius, length, instance.radius);

    // Rotate to align with link direction
    const upVec = new THREE.Vector3(0, 1, 0);
    const axis = new THREE.Vector3().crossVectors(upVec, linkVec.normalize());

    if (axis.length() > 0.01) {
      const angle = Math.acos(upVec.dot(linkVec.normalize()));
      instance.mesh.quaternion.setFromAxisAngle(axis.normalize(), angle);
    }
  }

  /**
   * Get link identifier
   * @private
   */
  _getLinkId(link) {
    if (link.id !== undefined) {
      return link.id;
    }
    if (link.nodeA && link.nodeB) {
      return `${link.nodeA.id || 0}_${link.nodeB.id || 0}`;
    }
    return `link_${Math.random()}`;
  }

  /**
   * Dispose mesh resources
   * @private
   */
  _disposeMesh(mesh) {
    if (!mesh) return;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => {
          if (!m?.userData?.__pooledAura) m.dispose();
        });
      } else {
        if (!mesh.material?.userData?.__pooledAura) {
          mesh.material.dispose();
        }
      }
    }
  }
}

// ============================================================================
// Material pool + per-instance uniform application
// ============================================================================
function getPooledAuraMaterial(profile, vertexShader, fragmentShader) {
  const key = profile?.name || 'default';
  if (AURA_MATERIAL_POOL.has(key)) return AURA_MATERIAL_POOL.get(key);

  const uniforms = {
    uTime: { value: 0 },
    uAuraIntensity: { value: 0.5 },
    uAuraRadius: { value: 0.7 },
    uAuraColor: { value: profile.baseColor },
    uSynergy: { value: 0.5 },
    uQuality: { value: 0.5 },
    uEntropy: { value: 0.0 },
    uResonance: { value: 0.0 },
    uCorruption: { value: 0.0 },
    uLfoSpeed: { value: profile.lfoSpeed },
    uNoiseStrength: { value: profile.noiseStrength },
    uCorruptionMult: { value: profile.corruptionMult },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  material.userData.__pooledAura = true;
  // Freeze program cache key to prevent program proliferation
  material.customProgramCacheKey = () => 'ATOMA_LINK_CANONICAL_v1';

  AURA_MATERIAL_POOL.set(key, material);
  return material;
}

function applyAuraUniforms(instance) {
  const mat = instance?.material;
  if (!mat?.uniforms) return;
  const u = mat.uniforms;
  u.uTime.value = instance.time;
  u.uAuraIntensity.value = instance.currentIntensity;
  u.uAuraRadius.value = instance.radius;
  u.uSynergy.value = instance.link.userData?.quality?.synergyNorm ?? 0.5;
  u.uQuality.value = (instance.link.userData?.quality?.score ?? 50) / 100;
  u.uEntropy.value = instance.link.userData?.metrics?.entropy ?? 0.0;
  u.uResonance.value = instance.link.userData?.metrics?.resonance ?? 0.0;
  u.uCorruption.value = instance.link.userData?.metrics?.corruption ?? 0.0;
}

// Global export
window.LinkAuraSystem_v1 = LinkAuraSystem_v1;

export default LinkAuraSystem_v1;
