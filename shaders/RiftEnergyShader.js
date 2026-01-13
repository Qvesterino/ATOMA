import * as THREE from 'three';

/**
 * Rift Energy Shader
 * Vertical fractal fracture with glowing edges
 * Used for dimensional tears, boss arena effects, Sigma rifts
 * Minimal, geometric, no chaotic explosions
 */
export const RiftEnergyShader = {
  uniforms: {
    time: { value: 0 },
    riftColor: { value: new THREE.Color(0x00ff88) },
    edgeColor: { value: new THREE.Color(0x00ddff) },
    riftPosition: { value: 0.5 },
    riftWidth: { value: 0.15 },
    swirl: { value: 0.3 },
    voidDensity: { value: 0.6 },
    particleThreads: { value: 5 },
    scale: { value: 1.0 }
  },

  vertexShader: `
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
      vPosition = position;
      vUv = uv;
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 riftColor;
    uniform vec3 edgeColor;
    uniform float riftPosition;
    uniform float riftWidth;
    uniform float swirl;
    uniform float voidDensity;
    uniform float particleThreads;
    uniform float scale;

    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    // Fractal-like vertical line
    float fractalLine(vec2 p, float t) {
      float line = abs(p.x - riftPosition) / riftWidth;
      
      // Create fractal jaggedness
      float freq = 5.0;
      for(int i = 0; i < 3; i++) {
        line += sin(p.y * freq + t * 0.3) * 0.05 / float(i + 1);
        freq *= 2.0;
      }
      
      return smoothstep(1.0, 0.0, line);
    }

    // Void swirl pattern
    float voidSwirl(vec2 p, float t) {
      vec2 centered = p - vec2(riftPosition, 0.5);
      float angle = atan(centered.y, centered.x) + t * swirl;
      float radius = length(centered);
      
      float swirl_pattern = sin(angle * 4.0 + radius * 10.0 - t * 2.0) * 0.5 + 0.5;
      return pow(swirl_pattern, 2.0);
    }

    // Particle thread calculation
    float particleThread(vec2 p, float t, int threadIndex) {
      float threadOffset = float(threadIndex) / particleThreads;
      vec2 threadPos = vec2(riftPosition + sin(t * 0.5 + threadOffset) * 0.1, p.y);
      
      float dist = length(p - threadPos);
      float thread = exp(-dist * 20.0) * 0.5;
      
      // Moving particles along threads
      float particlePhase = mod(p.y - t * 2.0 + threadOffset, 1.0);
      thread *= smoothstep(0.2, 0.0, abs(particlePhase - 0.5));
      
      return thread;
    }

    // Combine edge glow
    float edgeGlow(float line) {
      float glow = line;
      glow += pow(line, 2.0) * 0.5;
      return glow;
    }

    void main() {
      vec2 uv = vUv;
      
      // Main rift line
      float rift = fractalLine(uv, time);
      
      // Void interior
      float void_interior = voidSwirl(uv, time) * voidDensity;
      void_interior *= smoothstep(riftWidth * 2.0, 0.0, abs(uv.x - riftPosition));
      
      // Particle threads feeding into rift
      float threads = 0.0;
      for(int i = 0; i < 5; i++) {
        threads += particleThread(uv, time, i);
      }
      
      // Edge glow (bright cyan/green)
      float edge = edgeGlow(rift);
      vec3 edgeRadiance = edgeColor * edge * 1.5;
      
      // Rift body (darker green)
      vec3 riftBody = riftColor * rift * 0.8;
      
      // Void color (dark with swirl)
      vec3 voidColor = mix(
        vec3(0.1, 0.05, 0.2),
        vec3(0.2, 0.1, 0.3),
        void_interior
      );
      
      // Particle thread glow
      vec3 threadGlow = riftColor * threads * 0.6;
      
      // Combine all layers
      vec3 finalColor = edgeRadiance + riftBody + threadGlow;
      finalColor = mix(finalColor, voidColor, void_interior * 0.5);
      
      // Falloff at screen edges
      float falloff = smoothstep(1.2, 0.0, length(uv - 0.5));
      finalColor *= falloff;
      
      float alpha = edge + void_interior * 0.4 + threads;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

/**
 * Create rift energy material
 */
export function createRiftEnergyMaterial(options = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(RiftEnergyShader.uniforms),
    vertexShader: RiftEnergyShader.vertexShader,
    fragmentShader: RiftEnergyShader.fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  // Apply custom options
  if (options.riftColor) {
    material.uniforms.riftColor.value = new THREE.Color(options.riftColor);
  }
  if (options.edgeColor) {
    material.uniforms.edgeColor.value = new THREE.Color(options.edgeColor);
  }
  if (options.riftPosition !== undefined) {
    material.uniforms.riftPosition.value = options.riftPosition;
  }
  if (options.riftWidth !== undefined) {
    material.uniforms.riftWidth.value = options.riftWidth;
  }
  if (options.swirl !== undefined) {
    material.uniforms.swirl.value = options.swirl;
  }
  if (options.voidDensity !== undefined) {
    material.uniforms.voidDensity.value = options.voidDensity;
  }
  if (options.particleThreads !== undefined) {
    material.uniforms.particleThreads.value = options.particleThreads;
  }
  if (options.scale !== undefined) {
    material.uniforms.scale.value = options.scale;
  }

  return material;
}

/**
 * Create rift effect mesh
 */
export function createRiftEffect(geometry, options = {}) {
  const material = createRiftEnergyMaterial(options);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

/**
 * Update shader time
 */
export function updateRiftEnergyTime(material, deltaTime) {
  if (material.uniforms.time) {
    material.uniforms.time.value += deltaTime;
  }
}

/**
 * Update rift parameters
 */
export function setRiftEnergyParams(material, params) {
  if (params.riftColor && material.uniforms.riftColor) {
    material.uniforms.riftColor.value = new THREE.Color(params.riftColor);
  }
  if (params.edgeColor && material.uniforms.edgeColor) {
    material.uniforms.edgeColor.value = new THREE.Color(params.edgeColor);
  }
  if (params.riftPosition !== undefined && material.uniforms.riftPosition) {
    material.uniforms.riftPosition.value = params.riftPosition;
  }
  if (params.riftWidth !== undefined && material.uniforms.riftWidth) {
    material.uniforms.riftWidth.value = params.riftWidth;
  }
  if (params.swirl !== undefined && material.uniforms.swirl) {
    material.uniforms.swirl.value = params.swirl;
  }
  if (params.voidDensity !== undefined && material.uniforms.voidDensity) {
    material.uniforms.voidDensity.value = params.voidDensity;
  }
  if (params.particleThreads !== undefined && material.uniforms.particleThreads) {
    material.uniforms.particleThreads.value = params.particleThreads;
  }
  if (params.scale !== undefined && material.uniforms.scale) {
    material.uniforms.scale.value = params.scale;
  }
}

/**
 * Create Sigma-specific rift (green/cyan)
 */
export function createSigmaRift(geometry, options = {}) {
  return createRiftEnergyMaterial({
    riftColor: 0x00ff88,
    edgeColor: 0x00ddff,
    ...options
  });
}

/**
 * Create Quantum-specific rift (cyan/magenta)
 */
export function createQuantumRift(geometry, options = {}) {
  return createRiftEnergyMaterial({
    riftColor: 0x00ddff,
    edgeColor: 0xff00ff,
    ...options
  });
}
