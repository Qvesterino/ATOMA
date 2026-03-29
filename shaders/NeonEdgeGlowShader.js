import * as THREE from 'three';
import { VisualHierarchyRegistry } from '../VisualHierarchyRegistry.js';

/**
 * Neon Edge Glow Shader
 * Minimal, futuristic edge highlighting with smooth gradients
 * Used for node highlighting, UI outlines, interactive object glow
 */
export const NeonEdgeGlowShader = {
  uniforms: {
    time: { value: 0 },
    glowColor: { value: new THREE.Color(0x00ddff) },
    glowIntensity: { value: 1.5 },
    edgeWidth: { value: 0.15 },
    pulseSpeed: { value: 2.0 },
    pulseAmount: { value: 0.3 }
  },

  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 glowColor;
    uniform float glowIntensity;
    uniform float edgeWidth;
    uniform float pulseSpeed;
    uniform float pulseAmount;

    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      // Calculate edge detection via normal direction
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float edgeFactor = 1.0 - dot(vNormal, viewDir);

      // Sharp edge detection with falloff
      float edge = smoothstep(0.0, edgeWidth, edgeFactor);
      edge *= smoothstep(edgeWidth * 2.0, edgeWidth * 0.5, edgeFactor);

      // Gentle pulsation
      float pulse = sin(time * pulseSpeed) * pulseAmount + 1.0;

      // Create smooth gradient from edge inward
      float gradient = smoothstep(edgeWidth * 2.0, 0.0, edgeFactor);
      
      // Combine edge brightness with inner glow
      float brightness = edge * pulse + gradient * 0.4;

      // Apply color with bloom
      vec3 finalColor = glowColor * brightness * glowIntensity;

      // Smooth alpha falloff
      float alpha = max(edge, gradient * 0.6);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

/**
 * Create neon edge glow material
 */
export function createNeonEdgeGlowMaterial(options = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(NeonEdgeGlowShader.uniforms),
    vertexShader: NeonEdgeGlowShader.vertexShader,
    fragmentShader: NeonEdgeGlowShader.fragmentShader,
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  });

  // Apply custom options
  if (options.glowColor) {
    material.uniforms.glowColor.value = new THREE.Color(options.glowColor);
  }
  if (options.glowIntensity !== undefined) {
    material.uniforms.glowIntensity.value = options.glowIntensity;
  }
  if (options.edgeWidth !== undefined) {
    material.uniforms.edgeWidth.value = options.edgeWidth;
  }
  if (options.pulseSpeed !== undefined) {
    material.uniforms.pulseSpeed.value = options.pulseSpeed;
  }
  if (options.pulseAmount !== undefined) {
    material.uniforms.pulseAmount.value = options.pulseAmount;
  }

  return material;
}

/**
 * Create a node-specific neon edge glow shell.
 * Mirrors the hologram shell flow but stays edge-focused and static.
 */
export function createNodeNeonEdgeGlowShell(coreMesh, baseColor = 0x00ddff, options = {}) {
  if (!coreMesh || !coreMesh.geometry) return null;

  const material = createNeonEdgeGlowMaterial({
    glowColor: baseColor,
    ...options
  });

  const shell = new THREE.Mesh(coreMesh.geometry, material);
  shell.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
  shell.frustumCulled = false;
  shell.userData.visualLayer = 'CORE_EDGE';
  shell.userData.isNeonEdgeGlow = true;
  shell.userData.nonInteractive = true;
  shell.layers.disable(10);
  shell.raycast = () => null;

  return shell;
}

/**
 * Apply neon edge glow to existing material (as overlay)
 */
export function createNeonEdgeOverlay(geometry, options = {}) {
  const overlay = new THREE.Mesh(geometry, createNeonEdgeGlowMaterial(options));
  const overlayScale = options.scale ?? 1.0;
  if (overlayScale !== 1.0) {
    overlay.scale.multiplyScalar(overlayScale);
  }
  return overlay;
}

/**
 * Update shader time uniform
 */
export function updateNeonEdgeGlowTime(material, deltaTime) {
  if (material.uniforms.time) {
    material.uniforms.time.value += deltaTime;
  }
}

/**
 * Reassert a node neon edge glow shell if runtime mutation removed it.
 */
export function reassertNodeNeonEdgeGlow(nodeGroup, coreMesh, baseColor = 0x00ddff) {
  if (!nodeGroup || !coreMesh) {
    return false;
  }

  const existingShell = nodeGroup.children.find((child) => child?.userData?.isNeonEdgeGlow === true);
  const isValid = Boolean(
    existingShell &&
    existingShell.material &&
    existingShell.material.isShaderMaterial &&
    existingShell.frustumCulled === false
  );

  if (isValid) {
    return true;
  }

  if (existingShell) {
    nodeGroup.remove(existingShell);
  }

  const newShell = createNodeNeonEdgeGlowShell(coreMesh, baseColor);
  if (newShell) {
    nodeGroup.add(newShell);
    return false;
  }

  return false;
}

/**
 * Update glow parameters dynamically
 */
export function setNeonEdgeGlowParams(material, params) {
  if (params.glowColor && material.uniforms.glowColor) {
    material.uniforms.glowColor.value = new THREE.Color(params.glowColor);
  }
  if (params.glowIntensity !== undefined && material.uniforms.glowIntensity) {
    material.uniforms.glowIntensity.value = params.glowIntensity;
  }
  if (params.edgeWidth !== undefined && material.uniforms.edgeWidth) {
    material.uniforms.edgeWidth.value = params.edgeWidth;
  }
  if (params.pulseSpeed !== undefined && material.uniforms.pulseSpeed) {
    material.uniforms.pulseSpeed.value = params.pulseSpeed;
  }
  if (params.pulseAmount !== undefined && material.uniforms.pulseAmount) {
    material.uniforms.pulseAmount.value = params.pulseAmount;
  }
}
