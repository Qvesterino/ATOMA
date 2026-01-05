import * as THREE from 'three';

/**
 * Neon Pulse Shader
 * Thin glowing lines with alternating bright pulses
 * Data stream visualization with rhythmic motion
 * Used for node activity, link traffic, dream pulse FX
 */
export const NeonPulseShader = {
  uniforms: {
    time: { value: 0 },
    pulseColor: { value: new THREE.Color(0x00ddff) },
    lineWidth: { value: 0.02 },
    pulseSpeed: { value: 2.0 },
    pulseIntensity: { value: 2.0 },
    glowFalloff: { value: 0.3 },
    scrollSpeed: { value: 0.5 },
    direction: { value: new THREE.Vector3(0, 1, 0) }
  },

  vertexShader: `
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vPosition = position;
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 pulseColor;
    uniform float lineWidth;
    uniform float pulseSpeed;
    uniform float pulseIntensity;
    uniform float glowFalloff;
    uniform float scrollSpeed;
    uniform vec3 direction;

    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      // Create flowing data stream along direction
      float flow = dot(vPosition, direction) + time * scrollSpeed;
      
      // Pulse pattern - create spikes
      float pulse = abs(sin(flow * 10.0));
      float spike = pow(pulse, 3.0) * pulseIntensity;

      // Modulate spike brightness
      float brightness = sin(time * pulseSpeed) * 0.5 + 0.5;
      spike *= brightness;

      // Thin line with soft edges
      float line = fract(flow);
      line = min(line, 1.0 - line);
      line = smoothstep(lineWidth * 2.0, 0.0, abs(line - 0.5));

      // Add afterglow tail
      float tail = exp(-line * 5.0) * glowFalloff;
      
      // Combine line brightness with spike
      float finalBrightness = line * spike + tail;

      // Apply color with bloom
      vec3 finalColor = pulseColor * finalBrightness;

      gl_FragColor = vec4(finalColor, finalBrightness);
    }
  `
};

/**
 * Create neon pulse material
 */
export function createNeonPulseMaterial(options = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(NeonPulseShader.uniforms),
    vertexShader: NeonPulseShader.vertexShader,
    fragmentShader: NeonPulseShader.fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  // Apply custom options
  if (options.pulseColor) {
    material.uniforms.pulseColor.value = new THREE.Color(options.pulseColor);
  }
  if (options.lineWidth !== undefined) {
    material.uniforms.lineWidth.value = options.lineWidth;
  }
  if (options.pulseSpeed !== undefined) {
    material.uniforms.pulseSpeed.value = options.pulseSpeed;
  }
  if (options.pulseIntensity !== undefined) {
    material.uniforms.pulseIntensity.value = options.pulseIntensity;
  }
  if (options.glowFalloff !== undefined) {
    material.uniforms.glowFalloff.value = options.glowFalloff;
  }
  if (options.scrollSpeed !== undefined) {
    material.uniforms.scrollSpeed.value = options.scrollSpeed;
  }
  if (options.direction) {
    material.uniforms.direction.value = new THREE.Vector3(...options.direction).normalize();
  }

  return material;
}

/**
 * Create activity indicator with neon pulse
 */
export function createNeonPulseIndicator(geometry, options = {}) {
  const material = createNeonPulseMaterial(options);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

/**
 * Update shader time
 */
export function updateNeonPulseTime(material, deltaTime) {
  if (material.uniforms.time) {
    material.uniforms.time.value += deltaTime;
  }
}

/**
 * Update pulse parameters
 */
export function setNeonPulseParams(material, params) {
  if (params.pulseColor && material.uniforms.pulseColor) {
    material.uniforms.pulseColor.value = new THREE.Color(params.pulseColor);
  }
  if (params.lineWidth !== undefined && material.uniforms.lineWidth) {
    material.uniforms.lineWidth.value = params.lineWidth;
  }
  if (params.pulseSpeed !== undefined && material.uniforms.pulseSpeed) {
    material.uniforms.pulseSpeed.value = params.pulseSpeed;
  }
  if (params.pulseIntensity !== undefined && material.uniforms.pulseIntensity) {
    material.uniforms.pulseIntensity.value = params.pulseIntensity;
  }
  if (params.glowFalloff !== undefined && material.uniforms.glowFalloff) {
    material.uniforms.glowFalloff.value = params.glowFalloff;
  }
  if (params.scrollSpeed !== undefined && material.uniforms.scrollSpeed) {
    material.uniforms.scrollSpeed.value = params.scrollSpeed;
  }
  if (params.direction && material.uniforms.direction) {
    material.uniforms.direction.value = new THREE.Vector3(...params.direction).normalize();
  }
}

/**
 * Create multi-color pulse system (for different layers)
 */
export function createMultiColorNeonPulse(geometry, colorLayers = ['cyan', 'green', 'violet']) {
  const meshes = [];
  const materials = [];

  const colors = {
    cyan: 0x00ddff,
    green: 0x00ff88,
    violet: 0xaa00ff,
    orange: 0xff8800,
    magenta: 0xff00ff
  };

  colorLayers.forEach((colorName, index) => {
    const color = colors[colorName] || colors.cyan;
    const material = createNeonPulseMaterial({
      pulseColor: color,
      scrollSpeed: 0.5 + index * 0.2,
      lineWidth: 0.02 - index * 0.003
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.multiplyScalar(1.0 + index * 0.05);
    meshes.push(mesh);
    materials.push(material);
  });

  return {
    meshes,
    materials,
    update: function(deltaTime) {
      materials.forEach(material => updateNeonPulseTime(material, deltaTime));
    }
  };
}
