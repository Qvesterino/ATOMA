import * as THREE from 'three';

/**
 * AI-Tech Distortion Shader
 * Subtle refractive warping with soft ripples
 * Used for Dream Mode distortions, energy waves, singularity warping
 * Clean, minimal chromatic aberration at edges only
 */
export const AITechDistortionShader = {
  uniforms: {
    time: { value: 0 },
    tDiffuse: { value: null },
    tNormal: { value: null },
    distortionAmount: { value: 0.02 },
    rippleFrequency: { value: 2.0 },
    rippleAmplitude: { value: 0.015 },
    waveSpeed: { value: 0.5 },
    chromaticAberration: { value: 0.01 },
    gridBend: { value: 0.03 }
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
    uniform sampler2D tNormal;
    uniform float distortionAmount;
    uniform float rippleFrequency;
    uniform float rippleAmplitude;
    uniform float waveSpeed;
    uniform float chromaticAberration;
    uniform float gridBend;

    varying vec2 vUv;

    // Simplex-like noise function
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // Smooth wave function
    float wave(vec2 p, float t) {
      float freq = rippleFrequency;
      float wave1 = sin((p.x * freq + t * waveSpeed) * 3.14159) * rippleAmplitude;
      float wave2 = sin((p.y * freq + t * waveSpeed * 0.7) * 3.14159) * rippleAmplitude;
      return wave1 + wave2;
    }

    // Grid bending calculation
    vec2 gridBending(vec2 uv, float t) {
      float bend = sin(uv.y * 10.0 + t * waveSpeed) * gridBend;
      return vec2(uv.x + bend, uv.y);
    }

    void main() {
      vec2 uv = vUv;

      // Apply grid bending
      vec2 bentUv = gridBending(uv, time);

      // Create radial ripple effect
      float dist = length(uv - 0.5);
      float ripple = wave(uv, time) * (1.0 - dist * 1.5);

      // Apply distortion
      vec2 distortedUv = uv + ripple * distortionAmount;

      // Main color sample
      vec3 colorBase = texture2D(tDiffuse, distortedUv).rgb;

      // Chromatic aberration - only at edges
      float edgeMask = abs(uv.x - 0.5) + abs(uv.y - 0.5);
      edgeMask = smoothstep(1.0, 0.3, edgeMask);

      vec3 colorRed = texture2D(tDiffuse, distortedUv + vec2(chromaticAberration * edgeMask, 0.0)).r * vec3(1.0, 0.0, 0.0);
      vec3 colorBlue = texture2D(tDiffuse, distortedUv + vec2(-chromaticAberration * edgeMask, 0.0)).b * vec3(0.0, 0.0, 1.0);

      // Blend colors
      vec3 finalColor = colorBase + colorRed * 0.3 + colorBlue * 0.3;

      // Add teal/violet tint based on distortion
      float distortionMask = abs(ripple) * 0.5;
      vec3 tealTint = vec3(0.0, 0.8, 0.9) * distortionMask * 0.2;
      vec3 violetTint = vec3(0.6, 0.0, 0.8) * distortionMask * 0.15;

      finalColor += tealTint + violetTint;

      // Soft falloff at edges
      float vignette = smoothstep(1.0, 0.0, length(uv - 0.5) * 1.5);
      finalColor *= vignette;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

/**
 * Create AI-tech distortion material
 */
export function createAITechDistortionMaterial(options = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(AITechDistortionShader.uniforms),
    vertexShader: AITechDistortionShader.vertexShader,
    fragmentShader: AITechDistortionShader.fragmentShader
  });

  // Apply custom options
  if (options.distortionAmount !== undefined) {
    material.uniforms.distortionAmount.value = options.distortionAmount;
  }
  if (options.rippleFrequency !== undefined) {
    material.uniforms.rippleFrequency.value = options.rippleFrequency;
  }
  if (options.rippleAmplitude !== undefined) {
    material.uniforms.rippleAmplitude.value = options.rippleAmplitude;
  }
  if (options.waveSpeed !== undefined) {
    material.uniforms.waveSpeed.value = options.waveSpeed;
  }
  if (options.chromaticAberration !== undefined) {
    material.uniforms.chromaticAberration.value = options.chromaticAberration;
  }
  if (options.gridBend !== undefined) {
    material.uniforms.gridBend.value = options.gridBend;
  }

  return material;
}

/**
 * Create distortion effect with render target
 */
export function createAITechDistortionEffect(renderer, width, height, options = {}) {
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    stencilBuffer: false
  });

  const material = createAITechDistortionMaterial(options);
  
  const plane = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(plane, material);

  return {
    renderTarget,
    material,
    mesh,
    render: function(renderer, scene, camera) {
      renderer.setRenderTarget(this.renderTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
    }
  };
}

/**
 * Update shader time uniform
 */
export function updateAITechDistortionTime(material, deltaTime) {
  if (material.uniforms.time) {
    material.uniforms.time.value += deltaTime;
  }
}

/**
 * Update distortion parameters
 */
export function setAITechDistortionParams(material, params) {
  if (params.distortionAmount !== undefined && material.uniforms.distortionAmount) {
    material.uniforms.distortionAmount.value = params.distortionAmount;
  }
  if (params.rippleFrequency !== undefined && material.uniforms.rippleFrequency) {
    material.uniforms.rippleFrequency.value = params.rippleFrequency;
  }
  if (params.rippleAmplitude !== undefined && material.uniforms.rippleAmplitude) {
    material.uniforms.rippleAmplitude.value = params.rippleAmplitude;
  }
  if (params.waveSpeed !== undefined && material.uniforms.waveSpeed) {
    material.uniforms.waveSpeed.value = params.waveSpeed;
  }
  if (params.chromaticAberration !== undefined && material.uniforms.chromaticAberration) {
    material.uniforms.chromaticAberration.value = params.chromaticAberration;
  }
  if (params.gridBend !== undefined && material.uniforms.gridBend) {
    material.uniforms.gridBend.value = params.gridBend;
  }
}
