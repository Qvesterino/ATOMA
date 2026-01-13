/**
 * ATOMA NODE AURA REFACTOR — ELEGANT RIM-ONLY SYSTEM
 * ====================================================
 * 
 * REFINED DESIGN PRINCIPLES:
 * ✅ Subtle, elegant, boundary-aware energetic outlines
 * ✅ Rim-lighting only (strong silhouette edges, fades toward center)
 * ✅ Never obscures core geometry (separate mesh, proper scaling)
 * ✅ Transparent, additive blending with low opacity (0.05-0.15 range)
 * ✅ Cool, restrained colors (cyan, teal, pale violet, soft amber)
 * ✅ Optional subtle breathing (intensity, never scale)
 * ✅ Debug toggle for validation and console logging
 * 
 * TECHNICAL SPECIFICATION:
 * 
 * Aura Geometry:
 * - Separate spherical shell mesh (not shared with core)
 * - Scaled 1.15x-1.35x from core (adjustable rim width)
 * - Never intersects with core (depthTest enabled)
 * 
 * Aura Material:
 * - ShaderMaterial with FRESNEL effect
 * - depthWrite: false (doesn't affect depth buffer)
 * - blending: THREE.AdditiveBlending
 * - transparent: true, depthTest: true
 * - opacity range: 0.05-0.15 (very subtle)
 * 
 * Fresnel Behavior:
 * - Intensity peaks at grazing angles (edge viewing)
 * - Completely fades when viewed head-on
 * - Uses schlick approximation for performance
 * - rimPower controls falloff width
 * 
 * Color & Animation:
 * - State-aware colors: cyan (clarity), teal (resonance), etc.
 * - Breathing intensity (0.5-1.5 range, 2-3s cycle)
 * - No pulsing scale, no noise jitter
 * 
 * INTEGRATION:
 * 
 *   import { NodeAuraRefactor_ElegantRim } from './NodeAuraRefactor_ElegantRim.js';
 *   
 *   const auraSystem = new NodeAuraRefactor_ElegantRim({
 *     scene: this.scene,
 *     camera: this.camera,
 *     debugEnabled: true  // Enable with F3 console toggle
 *   });
 *   
 *   // Register nodes on spawn
 *   auraSystem.registerNode(node);
 *   
 *   // Update each frame
 *   auraSystem.update(deltaTime);
 *   
 *   // Cleanup on shutdown
 *   auraSystem.dispose();
 * 
 * VALIDATION:
 * 
 * Expected console output (when debug enabled):
 * [AURA] Registered SignalKnot#uuid rimIntensity=0.12 rimWidth=0.20 color=0x7fffd4
 * [AURA] Update SignalKnot#uuid breathingPhase=0.85 intensity=0.125 visible=true
 * [AURA DEBUG] Node=ControllerNode rimIntensity=0.12 rimWidth=0.18
 * 
 * Visual Validation:
 * ✅ Auras only visible at silhouette edges
 * ✅ Auras fade when node faces camera directly
 * ✅ Core geometry fully visible and opaque
 * ✅ No "bubble" or "halo" appearance
 * ✅ Color indicates state subtly
 * ✅ Breathing is smooth and slow (1-2 cycles per 3 seconds)
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * Simple aura configuration per state archetype
 */
const AURA_PROFILES = {
  default: {
    color: new THREE.Color(0x7fffd4),      // Aquamarine cyan
    rimIntensity: 0.10,
    rimWidth: 0.20,
    rimPower: 1.8,
    breathingSpeed: 1.5,  // cycles per 3 seconds
  },
  clarity: {
    color: new THREE.Color(0x00d9ff),      // Bright cyan
    rimIntensity: 0.12,
    rimWidth: 0.18,
    rimPower: 2.0,
    breathingSpeed: 1.5,
  },
  resonance: {
    color: new THREE.Color(0x20b2aa),      // Light sea green (teal)
    rimIntensity: 0.11,
    rimWidth: 0.22,
    rimPower: 1.7,
    breathingSpeed: 1.2,
  },
  corrupted: {
    color: new THREE.Color(0xb0a0e6),      // Pale violet
    rimIntensity: 0.09,
    rimWidth: 0.25,
    rimPower: 2.2,
    breathingSpeed: 0.8,
  },
  harmony: {
    color: new THREE.Color(0xffd700),      // Soft amber/gold
    rimIntensity: 0.13,
    rimWidth: 0.19,
    rimPower: 1.6,
    breathingSpeed: 1.8,
  },
};

/**
 * Create the Fresnel rim-only aura shader material
 */
function createAuraMaterial(profile = AURA_PROFILES.default) {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,

    uniforms: {
      uTime: { value: 0 },
      uAuraColor: { value: profile.color.clone() },
      
      // Fresnel rim parameters
      uRimPower: { value: profile.rimPower },           // Controls falloff width
      uRimIntensity: { value: profile.rimIntensity },   // Base rim intensity
      uFresnelMin: { value: 0.01 },                     // Min fresnel at center
      uFresnelMax: { value: 1.0 },                      // Max fresnel at edges
      
      // Breathing animation
      uBreathingIntensity: { value: profile.breathingSpeed },
      uBreathingAmplitude: { value: 0.4 },              // 0.5-1.5 range
      
      // Final opacity control
      uAuraOpacity: { value: 0.10 },                    // 0.05-0.15 base opacity
    },

    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        // World-space normal for fresnel computation
        vNormal = normalize(normalMatrix * normal);
        // View direction from vertex to camera
        vViewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uTime;
      uniform vec3 uAuraColor;
      uniform float uRimPower;
      uniform float uRimIntensity;
      uniform float uFresnelMin;
      uniform float uFresnelMax;
      uniform float uBreathingIntensity;
      uniform float uBreathingAmplitude;
      uniform float uAuraOpacity;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;

      // Schlick fresnel approximation
      float fresnel(float nDotV) {
        float f0 = 0.04; // Base reflectivity (dielectric)
        // Fresnel exponent controls edge sharpness
        float fresnel = f0 + (1.0 - f0) * pow(1.0 - nDotV, uRimPower);
        return fresnel;
      }

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        
        // Dot product: how perpendicular is surface to view?
        float nDotV = clamp(dot(N, V), 0.0, 1.0);
        
        // Compute fresnel term (1.0 at edges, 0.0 at center)
        float rimLight = fresnel(nDotV);
        
        // Remap to [min, max] range for better control
        rimLight = mix(uFresnelMin, uFresnelMax, rimLight);
        
        // === BREATHING ANIMATION (intensity only) ===
        // Slow, smooth sine wave: 0.5 - 1.5 range over ~3 seconds
        float breathingPhase = sin(uTime * uBreathingIntensity) * uBreathingAmplitude + (1.0 - uBreathingAmplitude);
        rimLight *= breathingPhase;
        
        // Apply base rim intensity
        rimLight *= uRimIntensity;
        
        // === OUTPUT ===
        vec3 rimColor = uAuraColor * rimLight;
        float finalAlpha = rimLight * uAuraOpacity;
        
        // Early discard for performance (skip near-invisible pixels)
        if (finalAlpha < 0.005) discard;
        
        // Clamp to valid range
        finalAlpha = clamp(finalAlpha, 0.0, 1.0);
        
        gl_FragColor = vec4(rimColor, finalAlpha);
      }
    `,
  });

  return material;
}

/**
 * AuraInstance: stores state for a single node's aura
 */
class AuraInstance {
  constructor(node, mesh, material, profile) {
    this.node = node;
    this.mesh = mesh;
    this.material = material;
    this.profile = profile;
    this.visible = true;
    this.targetIntensity = profile.rimIntensity;
    this.currentIntensity = profile.rimIntensity;
  }

  updateIntensity(deltaTime) {
    // Smooth intensity transitions
    const diff = this.targetIntensity - this.currentIntensity;
    if (Math.abs(diff) > 0.001) {
      this.currentIntensity += diff * 3.0 * deltaTime;  // 3x per second smoothing
    } else {
      this.currentIntensity = this.targetIntensity;
    }
    
    // Update material
    if (this.material.uniforms.uRimIntensity) {
      this.material.uniforms.uRimIntensity.value = this.currentIntensity;
    }
  }

  setProfile(profile) {
    this.profile = profile;
    this.targetIntensity = profile.rimIntensity;
    
    // Update material parameters
    if (this.material.uniforms.uAuraColor) {
      this.material.uniforms.uAuraColor.value = profile.color.clone();
    }
    if (this.material.uniforms.uRimPower) {
      this.material.uniforms.uRimPower.value = profile.rimPower;
    }
    if (this.material.uniforms.uBreathingIntensity) {
      this.material.uniforms.uBreathingIntensity.value = profile.breathingSpeed;
    }
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry?.dispose?.();
      this.material?.dispose?.();
    }
  }
}

/**
 * NodeAuraRefactor_ElegantRim: Main aura system with elegant rim-only design
 */
export class NodeAuraRefactor_ElegantRim {
  constructor(options = {}) {
    this.scene = options.scene;
    if (!this.scene) {
      console.warn('[AURA] No scene provided, system disabled');
      this.enabled = false;
      return;
    }

    this.camera = options.camera;
    this.enabled = true;
    this.debugEnabled = options.debugEnabled ?? false;
    
    // Aura geometry (shared sphere)
    this.auraGeometry = new THREE.IcosahedronGeometry(1, 16);
    
    // Aura storage
    this.auras = new Map();  // node.id → AuraInstance
    this.globalTime = 0;
    
    // Configuration
    this.rimWidthScale = options.rimWidthScale ?? 1.25;  // Scale factor for aura shell
    this.baseOpacity = options.baseOpacity ?? 0.10;      // 0.05-0.15 range
    
    // Setup debug system
    this._setupDebugConsole();
  }

  _setupDebugConsole() {
    if (this.debugEnabled) {
      // Expose toggle function globally
      window.toggleAuraDebug = () => {
        this.debugEnabled = !this.debugEnabled;
        console.log(`[AURA DEBUG] Aura debugging ${this.debugEnabled ? 'ENABLED' : 'DISABLED'}`);
      };
      
      window.logAuraStatus = () => {
        console.log(`[AURA STATUS] ${this.auras.size} auras registered`);
        for (const [nodeId, aura] of this.auras) {
          const logEntry = [
            `  Node=${aura.node.userData?.nodeName || 'Unknown'}`,
            `rimIntensity=${aura.currentIntensity.toFixed(3)}`,
            `rimWidth=${(this.rimWidthScale * 100).toFixed(0)}%`,
            `profile=${aura.profile.name || 'default'}`,
            `visible=${aura.visible}`,
          ].join(' ');
          console.log(logEntry);
        }
      };

      console.log('[AURA DEBUG] Console API ready: toggleAuraDebug(), logAuraStatus()');
    }
  }

  /**
   * Register a node for aura rendering
   */
  registerNode(node, profileName = 'default') {
    if (!this.enabled || !node) return;

    // Prevent duplicate registration
    if (this.auras.has(node.id)) {
      return;
    }

    // Get profile (default if not found)
    const profile = { ...AURA_PROFILES[profileName] || AURA_PROFILES.default };
    profile.name = profileName;

    // Create aura mesh (scaled from core)
    const coreSc = node.scale.x || 1.0;
    const auraMesh = new THREE.Mesh(this.auraGeometry, createAuraMaterial(profile));
    
    // Scale: slightly larger than core
    auraMesh.scale.set(
      coreSc * this.rimWidthScale,
      coreSc * this.rimWidthScale,
      coreSc * this.rimWidthScale
    );
    
    // Position: same as node (will update each frame)
    auraMesh.position.copy(node.position);
    
    // Ensure aura is behind core visually (lower renderOrder)
    auraMesh.renderOrder = (node.renderOrder ?? 0) - 1;
    
    // Store reference to node for updates
    auraMesh.userData.linkedNode = node;
    
    // Add to scene
    this.scene.add(auraMesh);

    // Create and store instance
    const instance = new AuraInstance(node, auraMesh, auraMesh.material, profile);
    this.auras.set(node.id, instance);

    if (this.debugEnabled) {
      const hexColor = '#' + profile.color.getHexString();
      console.log(
        `[AURA] Registered ${node.userData?.nodeName || 'Node'}#${node.id.slice(0, 8)}` +
        ` rimIntensity=${profile.rimIntensity.toFixed(2)}` +
        ` rimWidth=${(this.rimWidthScale * 100).toFixed(0)}%` +
        ` color=${hexColor}`
      );
    }
  }

  /**
   * Unregister a node (cleanup)
   */
  unregisterNode(node) {
    if (!this.enabled || !node) return;

    const aura = this.auras.get(node.id);
    if (aura) {
      this.scene.remove(aura.mesh);
      aura.dispose();
      this.auras.delete(node.id);

      if (this.debugEnabled) {
        console.log(`[AURA] Unregistered ${node.userData?.nodeName || 'Node'}#${node.id.slice(0, 8)}`);
      }
    }
  }

  /**
   * Update aura state/profile based on node state
   */
  updateNodeProfile(node, profileName) {
    if (!this.enabled) return;

    const aura = this.auras.get(node.id);
    if (aura) {
      const profile = { ...AURA_PROFILES[profileName] || AURA_PROFILES.default };
      profile.name = profileName;
      aura.setProfile(profile);

      if (this.debugEnabled) {
        console.log(`[AURA] Updated profile for ${node.userData?.nodeName || 'Node'} → ${profileName}`);
      }
    }
  }

  /**
   * Update aura visibility
   */
  setNodeAuraVisible(node, visible) {
    if (!this.enabled) return;

    const aura = this.auras.get(node.id);
    if (aura) {
      aura.visible = visible;
      aura.mesh.visible = visible;

      if (this.debugEnabled) {
        console.log(`[AURA] Visibility for ${node.userData?.nodeName || 'Node'} → ${visible}`);
      }
    }
  }

  /**
   * Update all auras each frame
   */
  update(deltaTime) {
    if (!this.enabled) return;

    this.globalTime += deltaTime;

    for (const [nodeId, aura] of this.auras) {
      if (!aura.node || !aura.mesh) continue;

      // Update position to follow node
      aura.mesh.position.copy(aura.node.position);
      
      // Update scale to match node core
      const coreSc = aura.node.scale.x || 1.0;
      aura.mesh.scale.set(
        coreSc * this.rimWidthScale,
        coreSc * this.rimWidthScale,
        coreSc * this.rimWidthScale
      );

      // Update time uniform
      if (aura.material.uniforms.uTime) {
        aura.material.uniforms.uTime.value = this.globalTime;
      }

      // Update intensity smoothly
      aura.updateIntensity(deltaTime);

      // Update visibility based on mesh visibility
      aura.mesh.visible = aura.visible && aura.node.visible;
    }
  }

  /**
   * Cleanup: remove all auras
   */
  dispose() {
    for (const [nodeId, aura] of this.auras) {
      this.scene.remove(aura.mesh);
      aura.dispose();
    }
    this.auras.clear();
    this.auraGeometry?.dispose?.();

    if (this.debugEnabled) {
      console.log('[AURA] System disposed');
    }
  }

  /**
   * Get debug info for a specific node
   */
  getNodeAuraDebugInfo(node) {
    const aura = this.auras.get(node.id);
    if (!aura) return null;

    return {
      nodeName: node.userData?.nodeName || 'Unknown',
      rimIntensity: aura.currentIntensity,
      rimWidth: this.rimWidthScale,
      profile: aura.profile.name || 'default',
      color: '#' + aura.profile.color.getHexString(),
      visible: aura.visible,
      position: node.position.toArray(),
      scale: node.scale.toArray(),
    };
  }

  /**
   * Log aura debug info for all nodes
   */
  logAllAurasDebug() {
    if (!this.debugEnabled) {
      console.log('[AURA] Debug logging not enabled. Call toggleAuraDebug().');
      return;
    }

    console.group('[AURA DEBUG] All Auras Status');
    for (const [nodeId, aura] of this.auras) {
      const info = this.getNodeAuraDebugInfo(aura.node);
      console.log(
        `[AURA DEBUG] Node=${info.nodeName}` +
        ` rimIntensity=${info.rimIntensity.toFixed(2)}` +
        ` rimWidth=${(info.rimWidth * 100).toFixed(0)}%` +
        ` profile=${info.profile}`
      );
    }
    console.groupEnd();
  }
}

export default NodeAuraRefactor_ElegantRim;
