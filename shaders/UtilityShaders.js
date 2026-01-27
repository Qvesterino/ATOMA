import * as THREE from 'three';

/**
 * Radial Bloom Shader
 * Glowing center expanding outward with circular neon rings
 * Used for power sources, core effects, energy centers
 */
export const RadialBloomShader = {
  uniforms: {
    time: { value: 0 },
    bloomColor: { value: new THREE.Color(0x00ddff) },
    bloomIntensity: { value: 2.0 },
    pulseSpeed: { value: 2.0 },
    ringCount: { value: 5 },
    ringWidth: { value: 0.08 }
  },

  vertexShader: `
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 bloomColor;
    uniform float bloomIntensity;
    uniform float pulseSpeed;
    uniform float ringCount;
    uniform float ringWidth;

    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vec2 centerDist = vUv - 0.5;
      float radius = length(centerDist);

      // Pulsing center glow
      float centerGlow = exp(-radius * 10.0);
      centerGlow *= sin(time * pulseSpeed) * 0.5 + 0.5;

      // Expanding rings
      float rings = sin(radius * ringCount * 3.14159 - time * pulseSpeed) * 0.5 + 0.5;
      rings *= smoothstep(ringWidth, 0.0, mod(radius, 1.0 / ringCount));
      rings *= smoothstep(1.0, 0.0, radius);

      // Combine
      float brightness = centerGlow + rings;
      vec3 finalColor = bloomColor * brightness * bloomIntensity;

      gl_FragColor = vec4(finalColor, brightness);
    }
  `
};

/**
 * Hologram Flicker Shader
 * Pixel grid slices with scanlines and subtle glitches
 * Used for holographic displays, UI overlays, data visualization
 */
export const HologramFlickerShader = {
  uniforms: {
    time: { value: 0 },
    tDiffuse: { value: null },
    gridSize: { value: 8.0 },
    scanlineIntensity: { value: 0.3 },
    glitchAmount: { value: 0.05 },
    glitchSpeed: { value: 5.0 },
    pixelSliceHeight: { value: 0.02 }
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform sampler2D tDiffuse;
    uniform float gridSize;
    uniform float scanlineIntensity;
    uniform float glitchAmount;
    uniform float glitchSpeed;
    uniform float pixelSliceHeight;

    varying vec2 vUv;

    // Hash function for pseudo-random
    float hash(float n) {
      return fract(sin(n) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // Horizontal scanlines
      float scanline = sin(uv.y * 100.0) * 0.5 + 0.5;
      scanline = mix(1.0, scanline, scanlineIntensity);

      // Pixel grid slices
      float gridMask = mod(uv.y, pixelSliceHeight);
      gridMask = step(pixelSliceHeight * 0.1, gridMask);

      // Glitch effect - random horizontal shifts
      float glitch = hash(floor(uv.y * 10.0 + time * glitchSpeed)) * glitchAmount;
      vec2 glitchUv = uv + vec2(glitch * sin(time * glitchSpeed), 0.0);

      // Sample texture
      vec3 color = texture2D(tDiffuse, glitchUv).rgb;

      // Apply scanlines and grid
      color *= scanline;
      color = mix(color, vec3(0.0), 1.0 - gridMask) * 0.8;

      // Hologram color shift (cyan dominant)
      color = mix(color, vec3(0.0, 1.0, 1.0), 0.2);

      // Flicker
      float flicker = sin(time * glitchSpeed * 2.0) * 0.3 + 0.7;
      color *= flicker;

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

/**
 * Dream Mist Shader
 * Slow drifting fog ribbons with pastel gradients
 * Used for atmosphere, background effects, dream state visualization
 */
export const DreamMistShader = {
  uniforms: {
    time: { value: 0 },
    mistColor1: { value: new THREE.Color(0xaa88dd) },
    mistColor2: { value: new THREE.Color(0x88ccff) },
    density: { value: 0.3 },
    driftSpeed: { value: 0.1 },
    noiseScale: { value: 2.0 },
    layerCount: { value: 3 }
  },

  vertexShader: `
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 mistColor1;
    uniform vec3 mistColor2;
    uniform float density;
    uniform float driftSpeed;
    uniform float noiseScale;
    uniform float layerCount;

    varying vec3 vPosition;
    varying vec2 vUv;

    // Improved perlin-like noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);

      float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);
      float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
      float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
      float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);

      float ab = mix(a, b, f.x);
      float cd = mix(c, d, f.x);
      return mix(ab, cd, f.y);
    }

    void main() {
      vec2 uv = vUv;
      
      // Multi-layer mist with different speeds
      float mistAmount = 0.0;
      // [B.3-B] WebGL1-safe loop: fixed bound with runtime break
      const int MAX_LAYERS = 8;
      for(int i = 0; i < MAX_LAYERS; i++) {
        if (float(i) >= layerCount) break;
        float layer = float(i) / layerCount;
        vec2 layerUv = uv * (1.0 + layer) + time * driftSpeed * (1.0 - layer);
        
        float n = noise(layerUv * noiseScale);
        n = pow(n, 1.5); // Soften
        
        mistAmount += n * (1.0 - layer);
      }
      
      mistAmount /= layerCount;
      mistAmount = smoothstep(0.3, 0.7, mistAmount);

      // Color gradient between two colors
      vec3 mistColor = mix(mistColor1, mistColor2, sin(time * 0.5) * 0.5 + 0.5);
      
      // Apply mist with density
      vec3 finalColor = mistColor * mistAmount * density;
      
      // Soft falloff at edges
      float vignette = smoothstep(1.0, 0.0, length(uv - 0.5) * 1.5);
      finalColor *= vignette;

      gl_FragColor = vec4(finalColor, mistAmount * density);
    }
  `
};

/**
 * Create radial bloom material
 */
export function createRadialBloomMaterial(options = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(RadialBloomShader.uniforms),
    vertexShader: RadialBloomShader.vertexShader,
    fragmentShader: RadialBloomShader.fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  if (options.bloomColor) {
    material.uniforms.bloomColor.value = new THREE.Color(options.bloomColor);
  }
  if (options.bloomIntensity !== undefined) {
    material.uniforms.bloomIntensity.value = options.bloomIntensity;
  }
  if (options.ringCount !== undefined) {
    material.uniforms.ringCount.value = options.ringCount;
  }
  if (options.ringWidth !== undefined) {
    material.uniforms.ringWidth.value = options.ringWidth;
  }

  return material;
}

/**
 * Create hologram flicker material
 */
export function createHologramFlickerMaterial(options = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(HologramFlickerShader.uniforms),
    vertexShader: HologramFlickerShader.vertexShader,
    fragmentShader: HologramFlickerShader.fragmentShader
  });

  if (options.gridSize !== undefined) {
    material.uniforms.gridSize.value = options.gridSize;
  }
  if (options.scanlineIntensity !== undefined) {
    material.uniforms.scanlineIntensity.value = options.scanlineIntensity;
  }
  if (options.glitchAmount !== undefined) {
    material.uniforms.glitchAmount.value = options.glitchAmount;
  }

  return material;
}

/**
 * Create dream mist material
 */
export function createDreamMistMaterial(options = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(DreamMistShader.uniforms),
    vertexShader: DreamMistShader.vertexShader,
    fragmentShader: DreamMistShader.fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  if (options.mistColor1) {
    material.uniforms.mistColor1.value = new THREE.Color(options.mistColor1);
  }
  if (options.mistColor2) {
    material.uniforms.mistColor2.value = new THREE.Color(options.mistColor2);
  }
  if (options.density !== undefined) {
    material.uniforms.density.value = options.density;
  }
  if (options.driftSpeed !== undefined) {
    material.uniforms.driftSpeed.value = options.driftSpeed;
  }

  return material;
}

/**
 * Update utility shader times
 */
export function updateUtilityShaderTime(material, deltaTime) {
  if (material.uniforms && material.uniforms.time) {
    material.uniforms.time.value += deltaTime;
  }
}

/**
 * Update utility shader parameters
 */
export function setUtilityShaderParams(material, params) {
  if (!material.uniforms) return;

  // Color parameters
  if (params.bloomColor && material.uniforms.bloomColor) {
    material.uniforms.bloomColor.value = new THREE.Color(params.bloomColor);
  }
  if (params.mistColor1 && material.uniforms.mistColor1) {
    material.uniforms.mistColor1.value = new THREE.Color(params.mistColor1);
  }
  if (params.mistColor2 && material.uniforms.mistColor2) {
    material.uniforms.mistColor2.value = new THREE.Color(params.mistColor2);
  }

  // Numeric parameters
  const numericParams = [
    'bloomIntensity', 'density', 'driftSpeed', 'noiseScale',
    'scanlineIntensity', 'glitchAmount', 'ringCount', 'ringWidth'
  ];

  numericParams.forEach(param => {
    if (params[param] !== undefined && material.uniforms[param]) {
      material.uniforms[param].value = params[param];
    }
  });
}
