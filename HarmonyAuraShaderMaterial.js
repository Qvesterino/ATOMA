/**
 * HARMONY AURA SHADER MATERIAL
 * =============================
 * CANONICAL TEMPLATE #2 — HARMONY AURA INTEGRATION
 * Part of: ATOMA Core Metric Architecture (LOCKED)
 * 
 * Authority: CanonicalVisualTemplateLibrary.md
 * 
 * ✅ LOCKED PROPERTIES:
 * - Soft cyan/teal/mint color palette
 * - Protective, calm, non-aggressive aesthetics
 * - Opacity: smoothstep(0.2, 0.8, harmonyAuraStrength)
 * - Radius scale: lerp(1.0, 1.35, harmonyAuraStrength)
 * - Breathing: frequency lerp(0.15 Hz, 0.45 Hz), amplitude ±3%
 * - NO userData mutations (read-only)
 * - Soft envelope appearance (not reactive)
 * 
 * NOTE: This material should be applied as an overlay to nodes
 * or use as a separate aura layer rendered after nodes.
 */

import * as THREE from 'three';

/**
 * Creates a ShaderMaterial for harmony aura effect on nodes
 * 
 * @returns {THREE.ShaderMaterial} Configured material with uniforms
 */
export function createHarmonyAuraMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending, // Not additive (supportive, not aggressive)
    side: THREE.FrontSide,
    
    uniforms: {
      uTime: { value: 0 },
      uAuraStrength: { value: 0.5 },      // harmonyAuraStrength [0..1]
      uAuraOpacity: { value: 0.3 },       // smoothstep(0.2, 0.8, strength)
      uAuraRadius: { value: 1.0 },        // lerp(1.0, 1.35, strength)
      uAuraPulse: { value: 1.0 },         // breathing multiplier
      uAuraColor: { value: new THREE.Color(0x7fffd4) }, // aquamarine (soft cyan/mint)
    },

    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying float vRimIntensity;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        // Rim intensity based on camera angle (soft at edges)
        vec3 viewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
        vRimIntensity = 1.0 - abs(dot(viewDir, vNormal));
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uTime;
      uniform float uAuraStrength;
      uniform float uAuraOpacity;
      uniform float uAuraRadius;
      uniform float uAuraPulse;
      uniform vec3  uAuraColor;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying float vRimIntensity;

      void main() {
        // Soft envelope based on rim intensity
        // Higher at edges (silhouette), fading toward center
        float aura = vRimIntensity * vRimIntensity; // quadratic fade
        
        // Apply canonical radius scaling (makes envelope thicker at higher harmony)
        aura *= uAuraRadius;
        
        // Apply breathing pulse (gentle, continuous)
        aura *= uAuraPulse;
        
        // Apply canonical opacity (smoothstep easing, not linear)
        aura *= uAuraOpacity;
        
        // Apply strength (overall envelope intensity)
        aura *= uAuraStrength;
        
        // PERFORMANCE FIX: Early exit for near-invisible fragments
        // Prevents blending overhead for pixels barely visible
        if (aura < 0.01) discard;
        
        // Color: calm, supportive (no emissive harshness)
        vec3 col = uAuraColor * aura;
        
        // Opacity matches aura intensity (smooth, no pops)
        float a = clamp(aura, 0.0, 1.0);
        
        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

/**
 * Optional: Create a variant for node spheres with radial aura
 * Use this for spherical node geometries
 */
export function createHarmonyAuraMaterialSphere() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
    
    uniforms: {
      uTime: { value: 0 },
      uAuraStrength: { value: 0.5 },
      uAuraOpacity: { value: 0.3 },
      uAuraRadius: { value: 1.0 },
      uAuraPulse: { value: 1.0 },
      uAuraColor: { value: new THREE.Color(0x7fffd4) },
    },

    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vWorldNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
        vViewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uTime;
      uniform float uAuraStrength;
      uniform float uAuraOpacity;
      uniform float uAuraRadius;
      uniform float uAuraPulse;
      uniform vec3  uAuraColor;
      
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;

      void main() {
        // Rim light effect (silhouette enhancement)
        float rim = 1.0 - dot(normalize(vWorldNormal), normalize(vViewDir));
        rim = smoothstep(0.0, 1.0, rim); // Smooth transition
        
        // Soft halo with radius scale
        float halo = rim * uAuraRadius;
        
        // Apply breathing pulse
        halo *= uAuraPulse;
        
        // Apply opacity easing
        halo *= uAuraOpacity;
        
        // Apply strength
        halo *= uAuraStrength;
        
        // PERFORMANCE FIX: Early exit for near-invisible fragments
        // Prevents blending overhead for pixels barely visible
        if (halo < 0.01) discard;
        
        // Color (calm, protective)
        vec3 col = uAuraColor * halo;
        float a = clamp(halo, 0.0, 1.0);
        
        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

/**
 * Conformance check: Verify material has no unauthorized state
 * Call this in dev mode to ensure template compliance
 */
export function assertHarmonyAuraMaterialConformance(material) {
  if (!material.uniforms) {
    throw new Error('HarmonyAuraMaterial missing uniforms object');
  }

  const requiredUniforms = [
    'uTime',
    'uAuraStrength',
    'uAuraOpacity',
    'uAuraRadius',
    'uAuraPulse',
    'uAuraColor',
  ];

  for (const u of requiredUniforms) {
    if (!(u in material.uniforms)) {
      throw new Error(`HarmonyAuraMaterial missing uniform: ${u}`);
    }
  }

  // Verify blending and depth settings match canonical spec
  if (material.blending !== THREE.NormalBlending) {
    console.warn(
      'HarmonyAuraMaterial blending is not NormalBlending ' +
      '(expected for calm, supportive template)'
    );
  }

  if (material.depthWrite !== false) {
    console.warn(
      'HarmonyAuraMaterial depthWrite should be false ' +
      '(expected for overlay visual)'
    );
  }

  return true;
}

/**
 * Validate color is in soft cyan/teal/mint palette
 */
export function assertHarmonyAuraColorConformance(material) {
  const color = material.uniforms.uAuraColor.value;
  
  // Check approximate color range (should be cyan/teal/mint family)
  const r = color.r;
  const g = color.g;
  const b = color.b;

  // Soft cyan/mint should have high green+blue, lower red
  // Typical: #7fffd4 (aquamarine)
  if (r > g || r > b) {
    console.warn(
      'HarmonyAuraColor may not be in cyan/mint palette. ' +
      'Expected high green+blue, lower red.'
    );
  }

  return true;
}
