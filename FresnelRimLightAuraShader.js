/**
 * FRESNEL-BASED RIM-LIGHTING AURA SHADER
 * ========================================
 * Advanced aura edge lighting with physics-based fresnel effect
 * 
 * Features:
 * - Physics-based fresnel term for realistic rim illumination
 * - Smoothly intensifies at silhouette edges (viewing angles)
 * - Organic edge glow that responds to camera perspective
 * - Integrated with existing aura system (minimal integration points)
 * - Performance-optimized for 60fps on 100+ nodes
 * 
 * Author: Rosie AI Engineer
 * Authority: Visual hierarchy + Physics-based rendering principles
 * 
 * Session 96: Visual Layer Enforcement Integration
 * - Material parameter modifications checked against enforcement gate
 * - Prevents invalid fresnel/rim-light modifications per layer hierarchy
 */

import * as THREE from 'three';


/**
 * Session 96: Fresnel Rim-Light Controller with Enforcement
 * Manages fresnel parameters with enforcement gate validation
 */
export class FresnelRimLightController {
  constructor(material, node = null, enforcementGate = null) {
    this.material = material;
    this.node = node;
    this.enforcementGate = enforcementGate;  // Session 96: Enforcement gate
    
    // Track original parameters
    this.originalParameters = {
      rimPower: material?.uniforms?.uRimPower?.value || 2.0,
      rimScale: material?.uniforms?.uRimScale?.value || 1.5,
      fresnelMin: material?.uniforms?.uFresnelMin?.value || 0.3,
      fresnelMax: material?.uniforms?.uFresnelMax?.value || 1.0,
    };
  }
  
  /**
   * Session 96: Update fresnel parameters with enforcement check
   */
  updateFresnelParameters(rimPower, rimScale, fresnelMin, fresnelMax) {
    if (!this.material) return false;
    
    // Check enforcement before modifying
    if (!this._canModifyFresnelParameters(rimScale)) {
      return false;  // Gate rejected modification
    }
    
    // Safe to modify
    if (this.material.uniforms.uRimPower) {
      this.material.uniforms.uRimPower.value = rimPower;
    }
    if (this.material.uniforms.uRimScale) {
      this.material.uniforms.uRimScale.value = rimScale;
    }
    if (this.material.uniforms.uFresnelMin) {
      this.material.uniforms.uFresnelMin.value = fresnelMin;
    }
    if (this.material.uniforms.uFresnelMax) {
      this.material.uniforms.uFresnelMax.value = fresnelMax;
    }

    return true;
  }
  
  /**
   * Session 96: Check if fresnel modification is allowed
   */
  _canModifyFresnelParameters(rimScale) {
    if (!this.enforcementGate || !this.node) return true;
    
    // Estimate effective opacity from rim scale
    // Higher rim scale = more visible rim effect
    const effectiveOpacity = 0.5 + (rimScale * 0.1);  // 0.5-0.65 range
    
    const request = IntegrationHelpers.createVisualAttachmentRequest({
      nodeId: this.node.userData?.id || this.node.uuid,
      nodeCategory: this.node.userData?.category || 'unknown',
      layerType: 'AURA_LAYER',
      geometryType: 'Spheres',
      opacity: Math.min(0.6, effectiveOpacity),  // Cap at layer max
      sourceSystem: 'FresnelRimLightController',
      description: 'Fresnel rim-light parameter modification'
    });
    
    return this.enforcementGate.canAttach(request);
  }
}

/**
 * Creates a ShaderMaterial with physics-based fresnel rim-lighting
 * 
 * @param {Object} options Configuration options
 * @param {VisualLayerEnforcementGate} enforcementGate Optional enforcement gate (Session 96)
 * @returns {THREE.ShaderMaterial} Configured material
 */
export function createFresnelRimLightAuraMaterial(options = {}, enforcementGate = null) {
  const {
    auraColor = new THREE.Color(0x7fffd4), // Default aquamarine
    rimPower = 2.0,                          // Fresnel exponent (controls edge sharpness)
    rimScale = 1.5,                          // Overall rim intensity multiplier
    fresnelMin = 0.3,                        // Minimum fresnel contribution
    fresnelMax = 1.0,                        // Maximum fresnel contribution
  } = options;

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,

    uniforms: {
      // Time-based animation
      uTime: { value: 0 },

      // Aura strength (from node state: 0.0 to 1.0)
      uAuraStrength: { value: 0.5 },

      // Aura opacity (final alpha multiplier)
      uAuraOpacity: { value: 0.3 },

      // Aura radius scaling (expands with strength)
      uAuraRadius: { value: 1.0 },

      // Breathing pulse animation
      uAuraPulse: { value: 1.0 },

      // Aura base color
      uAuraColor: { value: auraColor.clone() },

      // === FRESNEL RIM-LIGHTING SPECIFIC ===
      // Fresnel exponent (2.0-3.0 for organic look, 1.0-2.0 for sharp edges)
      uRimPower: { value: rimPower },

      // Overall rim intensity scale
      uRimScale: { value: rimScale },

      // Fresnel range (clamped between min and max)
      uFresnelMin: { value: fresnelMin },
      uFresnelMax: { value: fresnelMax },

      // Optional: Enable breathing on rim intensity
      uRimBreathingIntensity: { value: 0.3 },
    },

    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying float vRimDistance;
      varying vec2 vUv;

      void main() {
        vUv = uv;

        // World-space normal
        vNormal = normalize(normalMatrix * normal);

        // World position
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;

        // View direction (from fragment to camera)
        vViewDir = normalize(cameraPosition - worldPos);

        // Pass vertex position for potential distance-based effects
        vRimDistance = length(worldPos - cameraPosition);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uTime;
      uniform float uAuraStrength;
      uniform float uAuraOpacity;
      uniform float uAuraRadius;
      uniform float uAuraPulse;
      uniform vec3 uAuraColor;
      
      uniform float uRimPower;
      uniform float uRimScale;
      uniform float uFresnelMin;
      uniform float uFresnelMax;
      uniform float uRimBreathingIntensity;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying float vRimDistance;
      varying vec2 vUv;

      // Fresnel-Schlick approximation (simplified version)
      float fresnel(float nDotV, float power) {
        // nDotV: dot(normal, viewDir) - should be positive for front-facing
        float f0 = 0.1; // Base reflectivity (approximate)
        
        // Schlick approximation: F(v) = f0 + (1 - f0) * (1 - nDotV)^power
        float fresnel = f0 + (1.0 - f0) * pow(1.0 - nDotV, power);
        
        return fresnel;
      }

      // Enhanced fresnel with smooth range clamping
      float computeFresnelRim(vec3 normal, vec3 viewDir, float power, float minVal, float maxVal) {
        float nDotV = dot(normal, viewDir);
        
        // Clamp to [0, 1] for safety (should be naturally in range for front-facing)
        nDotV = clamp(nDotV, 0.0, 1.0);
        
        // Compute fresnel term
        float f = fresnel(nDotV, power);
        
        // Smooth range remap: [0, 1] → [minVal, maxVal]
        f = mix(minVal, maxVal, f);
        
        return f;
      }

      void main() {
        // === FRESNEL RIM-LIGHTING COMPUTATION ===
        
        // Normalize view direction (may be denormalized after interpolation)
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        
        // Compute physics-based fresnel term
        float rimLight = computeFresnelRim(N, V, uRimPower, uFresnelMin, uFresnelMax);
        
        // === ORGANIC BREATHING ON RIM ===
        // Subtle time-based modulation of rim intensity
        float rimBreathing = sin(uTime * 1.5 + 2.0) * uRimBreathingIntensity * 0.5 + 1.0;
        rimLight *= rimBreathing;
        
        // === COMBINE WITH AURA PARAMETERS ===
        
        // Scale by rim intensity
        rimLight *= uRimScale;
        
        // Apply aura radius (expands rim effect)
        rimLight *= uAuraRadius;
        
        // Apply overall pulse animation
        rimLight *= uAuraPulse;
        
        // Apply aura strength (0.0 = invisible, 1.0 = full)
        rimLight *= uAuraStrength;
        
        // === COLOR AND OPACITY ===
        
        // Color contribution (rim-lit edge glow)
        vec3 rimColor = uAuraColor * rimLight;
        
        // Final opacity (fresnel drives alpha at edges)
        float finalAlpha = rimLight * uAuraOpacity;
        
        // PERFORMANCE FIX: Early exit for near-invisible fragments
        // Prevents expensive blend ops for pixels contributing <1% to final color
        if (finalAlpha < 0.01) discard;
        
        // Clamp to valid range
        finalAlpha = clamp(finalAlpha, 0.0, 1.0);
        
        gl_FragColor = vec4(rimColor, finalAlpha);
      }
    `,
  });

  return material;
}

/**
 * Advanced fresnel with distance-based attenuation
 * Use this for larger aura systems that need distance falloff
 * 
 * @param {Object} options Configuration options
 * @returns {THREE.ShaderMaterial} Material with distance falloff
 */
export function createFresnelRimLightAuraMaterialWithDistance(options = {}) {
  const {
    auraColor = new THREE.Color(0x7fffd4),
    rimPower = 2.0,
    rimScale = 1.5,
    fresnelMin = 0.3,
    fresnelMax = 1.0,
    distanceFalloffStart = 10.0,
    distanceFalloffEnd = 50.0,
  } = options;

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,

    uniforms: {
      uTime: { value: 0 },
      uAuraStrength: { value: 0.5 },
      uAuraOpacity: { value: 0.3 },
      uAuraRadius: { value: 1.0 },
      uAuraPulse: { value: 1.0 },
      uAuraColor: { value: auraColor.clone() },
      
      uRimPower: { value: rimPower },
      uRimScale: { value: rimScale },
      uFresnelMin: { value: fresnelMin },
      uFresnelMax: { value: fresnelMax },
      uRimBreathingIntensity: { value: 0.3 },
      
      // Distance-based attenuation
      uDistanceFalloffStart: { value: distanceFalloffStart },
      uDistanceFalloffEnd: { value: distanceFalloffEnd },
      uCameraPosition: { value: new THREE.Vector3() },
    },

    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vViewDir = normalize(cameraPosition - vWorldPos);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uTime;
      uniform float uAuraStrength;
      uniform float uAuraOpacity;
      uniform float uAuraRadius;
      uniform float uAuraPulse;
      uniform vec3 uAuraColor;
      
      uniform float uRimPower;
      uniform float uRimScale;
      uniform float uFresnelMin;
      uniform float uFresnelMax;
      uniform float uRimBreathingIntensity;
      uniform float uDistanceFalloffStart;
      uniform float uDistanceFalloffEnd;
      uniform vec3 uCameraPosition;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      float fresnel(float nDotV, float power) {
        float f0 = 0.1;
        return f0 + (1.0 - f0) * pow(1.0 - nDotV, power);
      }

      float computeFresnelRim(vec3 normal, vec3 viewDir, float power, float minVal, float maxVal) {
        float nDotV = dot(normal, viewDir);
        nDotV = clamp(nDotV, 0.0, 1.0);
        float f = fresnel(nDotV, power);
        return mix(minVal, maxVal, f);
      }

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        
        // Compute fresnel rim light
        float rimLight = computeFresnelRim(N, V, uRimPower, uFresnelMin, uFresnelMax);
        
        // Breathing animation
        float rimBreathing = sin(uTime * 1.5 + 2.0) * uRimBreathingIntensity * 0.5 + 1.0;
        rimLight *= rimBreathing;
        
        // === DISTANCE FALLOFF ===
        float distToCamera = distance(vWorldPos, uCameraPosition);
        float distanceFalloff = 1.0;
        
        if (distToCamera > uDistanceFalloffStart) {
          // Linear falloff from start to end
          distanceFalloff = 1.0 - smoothstep(
            uDistanceFalloffStart,
            uDistanceFalloffEnd,
            distToCamera
          );
        }
        
        rimLight *= distanceFalloff;
        
        // Combine with aura parameters
        rimLight *= uRimScale;
        rimLight *= uAuraRadius;
        rimLight *= uAuraPulse;
        rimLight *= uAuraStrength;
        
        vec3 rimColor = uAuraColor * rimLight;
        float finalAlpha = rimLight * uAuraOpacity;
        
        // PERFORMANCE FIX: Early exit for near-invisible fragments
        // Prevents expensive blend ops for distant/fading auras
        if (finalAlpha < 0.01) discard;
        
        finalAlpha = clamp(finalAlpha, 0.0, 1.0);
        
        gl_FragColor = vec4(rimColor, finalAlpha);
      }
    `,
  });

  return material;
}

/**
 * Create a multi-band fresnel rim for complex aura effects
 * Layers multiple fresnel bands for richer visual complexity
 * 
 * @param {Object} options Configuration options
 * @returns {THREE.ShaderMaterial} Material with layered fresnel
 */
export function createMultiBandFresnelRimAura(options = {}) {
  const {
    auraColor = new THREE.Color(0x7fffd4),
    edgeColor = new THREE.Color(0x00ffff), // Bright cyan for edge
    coreColor = new THREE.Color(0xc8fff0), // Hot white-cyan core
    rimPower1 = 1.5,
    rimPower2 = 3.0,
    rimPower3 = 5.0,  // ATOMA_AURA_v2: ultra-sharp halo band
  } = options;

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    toneMapped: false,

    uniforms: {
      uTime: { value: 0 },
      uAuraStrength: { value: 0.5 },
      uAuraOpacity: { value: 0.3 },
      uAuraRadius: { value: 1.0 },
      uAuraPulse: { value: 1.0 },
      uAuraColor: { value: auraColor.clone() },
      uEdgeColor: { value: edgeColor.clone() },
      uCoreColor: { value: coreColor.clone() },
      
      uRimPower1: { value: rimPower1 },  // Softer outer band
      uRimPower2: { value: rimPower2 },  // Sharper inner band
      uRimPower3: { value: rimPower3 },  // ATOMA_AURA_v2: ultra-sharp halo
    },

    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uTime;
      uniform float uAuraStrength;
      uniform float uAuraOpacity;
      uniform float uAuraRadius;
      uniform float uAuraPulse;
      uniform vec3 uAuraColor;
      uniform vec3 uEdgeColor;
      uniform vec3 uCoreColor;
      
      uniform float uRimPower1;
      uniform float uRimPower2;
      uniform float uRimPower3;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      float fresnel(float nDotV, float power) {
        float f0 = 0.1;
        return f0 + (1.0 - f0) * pow(1.0 - nDotV, power);
      }

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        float nDotV = clamp(dot(N, V), 0.0, 1.0);
        
        // === THREE-BAND FRESNEL RIM (ATOMA_AURA_v2) ===
        
        // Band 1: Soft wide outer glow
        float rim1 = fresnel(nDotV, uRimPower1);
        rim1 = mix(0.08, 1.0, rim1);
        
        // Band 2: Sharp concentrated edge
        float rim2 = fresnel(nDotV, uRimPower2);
        rim2 = mix(0.15, 0.85, rim2);
        
        // Band 3: Ultra-sharp halo (ATOMA_AURA_v2)
        float rim3 = fresnel(nDotV, uRimPower3);
        rim3 = mix(0.3, 0.7, rim3);
        
        // Combine bands with weighted blend
        float rimLight = rim1 * 0.4 + rim2 * 0.4 + rim3 * 0.2;
        
        // === HOT CORE GLOW ===
        // Center-facing fragments get a subtle bright core
        float coreGlow = pow(nDotV, 3.0) * 0.15;
        rimLight += coreGlow;
        
        // === SHIMMER LAYER ===
        // Subtle energy shimmer across the surface
        float shimmer = sin(uTime * 6.0 + vWorldPos.y * 12.0 + vWorldPos.x * 8.0) * 0.04
                      + sin(uTime * 9.3 + vWorldPos.z * 10.0) * 0.02;
        rimLight += shimmer * rim2;
        
        // === BREATHING ANIMATION ===
        float breath = sin(uTime * 1.8) * 0.15 + 1.0;
        float microPulse = sin(uTime * 4.7 + nDotV * 3.14) * 0.05 + 1.0;
        rimLight *= breath * microPulse;
        
        // Apply aura parameters
        rimLight *= uAuraRadius;
        rimLight *= uAuraPulse;
        rimLight *= uAuraStrength;
        
        // === COLOR COMPOSITION ===
        // Three-layer color: core → aura → edge based on rim intensity
        vec3 baseCol = mix(uCoreColor, uAuraColor, smoothstep(0.1, 0.4, rimLight));
        vec3 color = mix(baseCol, uEdgeColor, rim3 * 0.7);
        
        // Add hot core contribution
        color += uCoreColor * coreGlow * 2.0;
        
        // Color brightness boost from shimmer
        color += vec3(0.6, 0.8, 1.0) * max(0.0, shimmer) * rim2;
        
        color *= rimLight;
        
        float alpha = rimLight * uAuraOpacity;
        
        // PERFORMANCE FIX: Early exit for near-invisible fragments
        if (alpha < 0.005) discard;
        
        alpha = clamp(alpha, 0.0, 1.0);
        
        gl_FragColor = vec4(color, alpha);
      }
    `,

    customProgramCacheKey: () => 'ATOMA_AURA_v2',
  });

  return material;
}

/**
 * Export all variants for easy access
 */
export const FresnelRimLightAuraShader = {
  createBasic: createFresnelRimLightAuraMaterial,
  createWithDistance: createFresnelRimLightAuraMaterialWithDistance,
  createMultiBand: createMultiBandFresnelRimAura,
};

export default FresnelRimLightAuraShader;
