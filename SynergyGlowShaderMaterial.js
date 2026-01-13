/**
 * SYNERGY GLOW SHADER MATERIAL
 * =============================
 * CANONICAL TEMPLATE #1 — SYNERGY GLOW INTEGRATION
 * Part of: ATOMA Core Metric Architecture (LOCKED)
 * 
 * Authority: CanonicalVisualTemplateLibrary.md
 * 
 * ✅ LOCKED PROPERTIES:
 * - Cyan-blue color palette (#00ffff base)
 * - Additive blending for structural glow
 * - Opacity: 0.3 + (visualSynergy * 0.7) → [0.3..1.0]
 * - Brightness: visualSynergy * 2.0 → [0..2.0]
 * - Breathing: 1.2 Hz, ±5% modulation
 * - NO userData mutations (read-only)
 * 
 * NOTE: This material should be applied to link geometry in LinkRenderer
 * or used as an overlay material for link rendering.
 */

import * as THREE from 'three';

/**
 * Creates a ShaderMaterial for synergy glow effect on links
 * 
 * @returns {THREE.ShaderMaterial} Configured material with uniforms
 */
export function createSynergyGlowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    
    uniforms: {
      uTime: { value: 0 },
      uGlowIntensity: { value: 0.3 },    // [0.3..1.0] mapped from synergy
      uGlowBrightness: { value: 0.0 },   // [0..2.0] mapped from synergy
      uGlowPulse: { value: 1.0 },        // breathing multiplier
      uGlowColor: { value: new THREE.Color(0x00d4ff) }, // cyan
    },

    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPos;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uTime;
      uniform float uGlowIntensity;
      uniform float uGlowBrightness;
      uniform float uGlowPulse;
      uniform vec3  uGlowColor;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPos;

      void main() {
        // Normalize UVs to center
        vec2 uv = vUv * 2.0 - 1.0;
        float r = length(uv);

        // Soft radial gradient with gentle falloff
        // Creates smoother glow rather than hard edges
        float core = exp(-r * r * 2.5);
        float halo = smoothstep(1.5, 0.0, r);
        
        // Combine core and halo
        float glow = (core * 0.7 + halo * 0.3);
        
        // Apply canonical intensity mapping
        glow *= uGlowIntensity;
        
        // Apply breathing pulse (1.2 Hz, ±5%)
        glow *= uGlowPulse;

        // Color with brightness scaling
        vec3 col = uGlowColor * (glow * uGlowBrightness);

        // Opacity matches intensity (canonical mapping already applied in controller)
        float a = clamp(glow, 0.0, 1.0);

        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

/**
 * Optional: Create a variant for link cylinders with axial glow
 * Use this if links are cylinder geometries extending along an axis
 */
export function createSynergyGlowMaterialCylinder() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    
    uniforms: {
      uTime: { value: 0 },
      uGlowIntensity: { value: 0.3 },
      uGlowBrightness: { value: 0.0 },
      uGlowPulse: { value: 1.0 },
      uGlowColor: { value: new THREE.Color(0x00d4ff) },
    },

    vertexShader: `
      varying vec2 vUv;
      varying float vRadial;

      void main() {
        vUv = uv;
        // For cylinder: xy is radial distance from center
        vRadial = length(position.xy);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uTime;
      uniform float uGlowIntensity;
      uniform float uGlowBrightness;
      uniform float uGlowPulse;
      uniform vec3  uGlowColor;
      
      varying vec2 vUv;
      varying float vRadial;

      void main() {
        // Distance from cylinder axis (vRadial provided by geometry)
        float r = vRadial * 2.0; // scale for falloff
        
        // Smooth falloff from center to edges
        float glow = exp(-r * r * 3.0) * uGlowIntensity * uGlowPulse;
        
        vec3 col = uGlowColor * (glow * uGlowBrightness);
        float a = clamp(glow, 0.0, 1.0);

        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

/**
 * Conformance check: Verify material has no unauthorized state
 * Call this in dev mode to ensure template compliance
 */
export function assertSynergyGlowMaterialConformance(material) {
  if (!material.uniforms) {
    throw new Error('SynergyGlowMaterial missing uniforms object');
  }

  const requiredUniforms = ['uTime', 'uGlowIntensity', 'uGlowBrightness', 'uGlowPulse', 'uGlowColor'];
  for (const u of requiredUniforms) {
    if (!(u in material.uniforms)) {
      throw new Error(`SynergyGlowMaterial missing uniform: ${u}`);
    }
  }

  // Verify blending and depth settings match canonical spec
  if (material.blending !== THREE.AdditiveBlending) {
    console.warn('SynergyGlowMaterial blending is not AdditiveBlending (expected for template compliance)');
  }
  if (material.depthWrite !== false) {
    console.warn('SynergyGlowMaterial depthWrite should be false (expected for template compliance)');
  }

  return true;
}
