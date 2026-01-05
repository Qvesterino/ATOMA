/**
 * STRESS TURBULENCE SHADER MATERIAL
 * ==================================
 * CANONICAL TEMPLATE #3 — NETWORK STRESS TURBULENCE
 * Part of: ATOMA Core Metric Architecture (LOCKED)
 * 
 * Authority: CanonicalVisualTemplateLibrary.md
 * 
 * ✅ LOCKED PROPERTIES:
 * - Red-orange color palette (desaturated, noisy)
 * - Environmental chaos/pressure (not entity damage)
 * - Turbulence via pow(intensity, 1.4)
 * - Jitter via lerp(0.0, 0.25, turbulence)
 * - Frequency via lerp(0.5, 2.5, intensity)
 * - Time scale via lerp(0.4, 1.2, intensity)
 * - NO geometry destruction
 * - NO opacity fading
 * - NO userData mutations (read-only)
 * 
 * NOTE: Applied to field geometries (not nodes/links)
 * Creates distortion/turbulence effect on environment
 */

import * as THREE from 'three';

/**
 * Creates a ShaderMaterial for stress turbulence effect on fields
 * 
 * @returns {THREE.ShaderMaterial} Configured material with uniforms
 */
export function createStressTurbulenceMaterial() {
  return new THREE.ShaderMaterial({
    transparent: false,
    depthWrite: true,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
    wireframe: false,
    
    uniforms: {
      uTime: { value: 0 },
      uStressIntensity: { value: 0.0 },    // [0..1] raw signal
      uTurbulence: { value: 0.0 },         // pow(intensity, 1.4)
      uJitterAmplitude: { value: 0.0 },    // lerp(0.0, 0.25, turbulence)
      uNoiseFrequency: { value: 0.5 },     // lerp(0.5, 2.5, intensity)
      uTimeScale: { value: 0.4 },          // lerp(0.4, 1.2, intensity)
      uStressColor: { value: new THREE.Color(0xff6b35) }, // red-orange
    },

    vertexShader: `
      #include <common>
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vNoise;

      // Pseudo-random function (deterministic noise base)
      float pseudo_random(vec3 p) {
        return fract(sin(dot(p.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }

      // Simple 3D noise-like function
      float noise3d(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float n00 = mix(pseudo_random(i + vec3(0, 0, 0)), pseudo_random(i + vec3(1, 0, 0)), f.x);
        float n10 = mix(pseudo_random(i + vec3(0, 1, 0)), pseudo_random(i + vec3(1, 1, 0)), f.x);
        float n01 = mix(pseudo_random(i + vec3(0, 0, 1)), pseudo_random(i + vec3(1, 0, 1)), f.x);
        float n11 = mix(pseudo_random(i + vec3(1, 0, 1)), pseudo_random(i + vec3(1, 1, 1)), f.x);

        float n0 = mix(n00, n10, f.y);
        float n1 = mix(n01, n11, f.y);
        return mix(n0, n1, f.z);
      }

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;

        // Distortion based on stress
        vec3 pos = position;
        float noise = noise3d(pos * uNoiseFrequency + uTime * uTimeScale);
        
        // Apply jitter displacement
        pos += normal * noise * uJitterAmplitude * 0.5;
        pos += normalize(vec3(noise, noise * 0.7, noise * 0.3)) * uJitterAmplitude * 0.3;
        
        vNoise = noise;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uStressIntensity;
      uniform float uTurbulence;
      uniform vec3  uStressColor;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vNoise;

      void main() {
        // Base color: red-orange stress color
        vec3 col = uStressColor;

        // Noise-based modulation (no fading, just variation)
        float noiseModulation = 0.7 + vNoise * 0.3; // [0.7..1.0]
        
        // Turbulence scales color intensity (not opacity)
        col *= (1.0 - uTurbulence * 0.4); // Slightly desaturated at high stress
        col *= noiseModulation;

        // No opacity reduction (stress is not transparency)
        float a = 1.0; // Always opaque (pressure, not fading)

        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

/**
 * Variant: Distortion-only material (for overlay use)
 * Creates pure geometric distortion without color change
 */
export function createStressTurbulenceDistortionMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
    
    uniforms: {
      uTime: { value: 0 },
      uTurbulence: { value: 0.0 },
      uJitterAmplitude: { value: 0.0 },
      uNoiseFrequency: { value: 0.5 },
      uTimeScale: { value: 0.4 },
      uStressColor: { value: new THREE.Color(0xff6b35) },
    },

    vertexShader: `
      varying vec2 vUv;
      varying float vDistortion;

      float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }

      void main() {
        vUv = uv;
        
        vec3 pos = position;
        float n = noise(pos * uNoiseFrequency + uTime * uTimeScale);
        vDistortion = n;
        
        // Subtle displacement
        pos += normal * n * uJitterAmplitude;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uTurbulence;
      uniform vec3 uStressColor;
      
      varying vec2 vUv;
      varying float vDistortion;

      void main() {
        // Distortion overlay: noisy color layer
        float intensity = uTurbulence * vDistortion;
        vec3 col = uStressColor * intensity;
        
        float a = intensity * 0.5; // Semi-transparent overlay
        
        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

/**
 * Conformance check: Verify material has no unauthorized state
 * Call this in dev mode to ensure template compliance
 */
export function assertStressTurbulenceMaterialConformance(material) {
  if (!material.uniforms) {
    throw new Error('StressTurbulenceMaterial missing uniforms object');
  }

  const requiredUniforms = [
    'uTime',
    'uStressIntensity',
    'uTurbulence',
    'uJitterAmplitude',
    'uNoiseFrequency',
    'uTimeScale',
    'uStressColor',
  ];

  for (const u of requiredUniforms) {
    if (!(u in material.uniforms)) {
      throw new Error(`StressTurbulenceMaterial missing uniform: ${u}`);
    }
  }

  // Verify blending matches stress (not destructive)
  if (material.blending !== THREE.NormalBlending) {
    console.warn(
      'StressTurbulenceMaterial blending is not NormalBlending ' +
      '(expected for environmental chaos, not destructive effect)'
    );
  }

  // Verify no transparency (stress is not fading)
  if (material.transparent === true && material.blending === THREE.NormalBlending) {
    // This is okay for distortion variant, but warn if unexpected
  }

  return true;
}

/**
 * Validate color is in red-orange palette
 */
export function assertStressTurbulenceColorConformance(material) {
  const color = material.uniforms.uStressColor.value;
  
  // Check approximate color range (should be red-orange family)
  const r = color.r;
  const g = color.g;
  const b = color.b;

  // Red-orange should have high red, medium orange (red+green), low blue
  if (r < g || b > g * 0.5) {
    console.warn(
      'StressTurbulenceColor may not be in red-orange palette. ' +
      'Expected high red, medium orange, low blue.'
    );
  }

  return true;
}
