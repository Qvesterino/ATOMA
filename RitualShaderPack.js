/**
 * RitualShaderPack.js
 * Custom GLSL shaders for MythicRitualController.
 * Transforms flat MeshBasicMaterial rituals into living energy phenomena.
 *
 * DESIGN PHILOSOPHY:
 * - Every ritual is a living energy system, not a static mesh
 * - Shaders use noise, traveling waves, and chromatic aberration
 * - Colors derive from ATOMAColorPalette for coherence
 * - All materials use AdditiveBlending + depthWrite:false for ethereal feel
 */

import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED GLSL UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const NOISE_GLSL = /* glsl */ `
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

float fbm3(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * hash3(vec3(p.xy * (1.0 + float(i)), p.z + float(i) * 3.7));
    p *= 1.8;
    amplitude *= 0.5;
  }
  return value;
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. RITUAL BEAM SHADER — Volumetric god rays with dust and traveling pulses
// Used for: Ascension, Harmony Convergence, Echo Ritual
// ═══════════════════════════════════════════════════════════════════════════════

const BeamVertex = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vHeight;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vHeight = position.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const BeamFragment = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform vec3 uAccentColor;
uniform float uPhase;
uniform float uDustDensity;
uniform float uPulseSpeed;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vHeight;

${NOISE_GLSL}

void main() {
  // Radial distance from beam center (0 = center, 1 = edge)
  float radialDist = length(vUv - 0.5) * 2.0;

  // Core intensity — sharp peak in center, soft exponential falloff
  float core = exp(-radialDist * radialDist * 5.0);

  // Traveling energy pulses (multiple harmonics for organic feel)
  float pulse1 = sin(vHeight * 0.25 - uTime * uPulseSpeed * 1.0) * 0.5 + 0.5;
  float pulse2 = sin(vHeight * 0.55 - uTime * uPulseSpeed * 0.7 + 2.1) * 0.5 + 0.5;
  float pulse3 = sin(vHeight * 1.1 - uTime * uPulseSpeed * 1.3 + 4.3) * 0.5 + 0.5;
  float pulse = pulse1 * 0.5 + pulse2 * 0.3 + pulse3 * 0.2;

  // Dust motes floating in the light volume
  float dust = fbm(vec2(vHeight * 0.4 + uTime * 0.15, radialDist * 4.0 + uTime * 0.08));
  dust = pow(dust, 3.5) * 3.0 * uDustDensity;

  // Fresnel edge glow — beam is brighter at grazing angles
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

  // Phase-based breathing (ritual intensity modulation)
  float phaseGlow = 1.0 + sin(uPhase * 6.28318) * 0.25;
  float phaseBreath = 1.0 + sin(uPhase * 3.14159 + uTime * 0.5) * 0.15;

  // Color composition
  vec3 color = uPrimaryColor * core * (0.7 + pulse * 0.5) * phaseBreath;
  color += uSecondaryColor * fresnel * 0.6 * uIntensity;
  color += uAccentColor * dust * 0.35 * uIntensity;

  // Subtle chromatic aberration at beam edges
  float aberration = fresnel * 0.12 * uIntensity;
  color.r += aberration * 0.3;
  color.b -= aberration * 0.2;

  // Alpha — core + fresnel + dust, modulated by intensity and phase
  float alpha = (core * 0.75 + fresnel * 0.25 + dust * 0.12) * uIntensity * phaseGlow;
  alpha = clamp(alpha, 0.0, 0.95);

  gl_FragColor = vec4(color, alpha);
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// 2. RITUAL FISSURE SHADER — Energy crack with glitch and chromatic aberration
// Used for: Quantum Fissure, Chaos Ritual
// ═══════════════════════════════════════════════════════════════════════════════

const FissureVertex = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FissureFragment = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform vec3 uAccentColor;
uniform float uPhase;
uniform float uGlitchIntensity;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;

${NOISE_GLSL}

void main() {
  // Center crack — intense line down the middle
  float crack = 1.0 - abs(vUv.x - 0.5) * 10.0;
  crack = max(0.0, crack);
  crack = pow(crack, 0.7);

  // Glitch blocks — horizontal displacement bands
  float glitchBlock = step(0.94, hash(vec2(floor(vUv.y * 30.0), floor(uTime * 10.0))));
  float glitchOffset = sin(vUv.y * 60.0 + uTime * 20.0) * glitchBlock * uGlitchIntensity;

  // Energy tendrils branching from crack
  float tendril = fbm(vec2(vUv.y * 4.0 + uTime * 2.0, vUv.x * 12.0 + glitchOffset));
  tendril = pow(tendril, 2.5) * crack * 2.0;

  // Electric flashes — sharp, brief
  float flash = step(0.96, hash(vec2(vUv.y * 80.0 + glitchOffset * 10.0, uTime * 15.0)));
  flash *= crack;

  // Traveling energy surge
  float surge = sin(vUv.y * 8.0 - uTime * 6.0) * 0.5 + 0.5;
  surge = pow(surge, 4.0) * crack;

  // Chromatic aberration — RGB split intensifies near crack
  float aberration = crack * 0.2 * uIntensity;
  vec3 color;
  color.r = (tendril * 1.1 + surge * 0.6 + flash * 0.8) * (1.0 + aberration);
  color.g = (tendril * 0.85 + surge * 0.5 + flash * 0.4);
  color.b = (tendril * 0.6 + surge * 0.8 + flash * 1.0) * (1.0 - aberration * 0.5);

  // Map to palette colors
  color = mix(uPrimaryColor, uSecondaryColor, tendril + surge * 0.5);
  color += uAccentColor * (flash + surge * 0.3) * 0.8;

  // Phase-based intensity flicker
  float phaseFlicker = 1.0 + sin(uPhase * 12.566 + uTime * 8.0) * 0.2 * uGlitchIntensity;

  float alpha = (crack * 0.9 + tendril * 0.5 + flash * 0.7 + surge * 0.4) * uIntensity * phaseFlicker;
  alpha = clamp(alpha, 0.0, 0.95);

  gl_FragColor = vec4(color, alpha);
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RITUAL RING SHADER — Rotating energy arcs with traveling waves
// Used for: Ascension rings, Fissure rings, all ritual ring geometry
// ═══════════════════════════════════════════════════════════════════════════════

const RingVertex = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RingFragment = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform vec3 uAccentColor;
uniform float uPhase;
uniform float uRotationSpeed;
uniform float uWaveCount;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;

${NOISE_GLSL}

void main() {
  // Angular position around ring (0-1)
  float angle = vUv.x;

  // Radial thickness falloff
  float radialDist = abs(vUv.y - 0.5) * 2.0;
  float thickness = 1.0 - smoothstep(0.0, 0.8, radialDist);

  // Rotating energy arcs
  float rotation = uTime * uRotationSpeed;
  float arc1 = sin((angle + rotation * 0.1) * uWaveCount * 6.28318) * 0.5 + 0.5;
  float arc2 = sin((angle - rotation * 0.07 + 0.33) * uWaveCount * 4.0 * 6.28318) * 0.5 + 0.5;
  float arc = arc1 * 0.6 + arc2 * 0.4;
  arc = pow(arc, 2.0);

  // Traveling pulse around ring
  float pulse = sin(angle * 6.28318 * 2.0 - uTime * 3.0 + uPhase * 6.28318) * 0.5 + 0.5;
  pulse = pow(pulse, 3.0);

  // Surface shimmer
  float shimmer = fbm(vec2(angle * 10.0 + uTime * 0.3, radialDist * 5.0));
  shimmer = pow(shimmer, 4.0) * 2.0;

  // Fresnel for edge glow
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.5);

  // Color composition
  vec3 color = uPrimaryColor * arc * thickness * (0.6 + pulse * 0.4);
  color += uSecondaryColor * fresnel * 0.5 * uIntensity;
  color += uAccentColor * shimmer * 0.25 * uIntensity;

  // Phase-based brightness surge
  float phaseSurge = 1.0 + sin(uPhase * 3.14159) * 0.35;

  float alpha = (arc * thickness * 0.8 + fresnel * 0.3 + shimmer * 0.15 + pulse * thickness * 0.2) * uIntensity * phaseSurge;
  alpha = clamp(alpha, 0.0, 0.9);

  gl_FragColor = vec4(color, alpha);
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CONSCIOUSNESS FIELD SHELL SHADER — Organic breathing sphere
// Used for: AIConsciousnessLayer global field
// ═══════════════════════════════════════════════════════════════════════════════

const FieldShellVertex = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FieldShellFragment = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform vec3 uBaseColor;
uniform vec3 uRitualColor;
uniform float uRitualBlend;
uniform float uBreathSpeed;
uniform float uPulseIntensity;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;

${NOISE_GLSL}

void main() {
  // Organic surface noise
  float surfaceNoise = fbm3(vec3(vUv * 3.0, uTime * 0.2));
  surfaceNoise = surfaceNoise * 0.5 + 0.5;

  // Breathing pulse — sphere expands/contracts visually through opacity
  float breath = sin(uTime * uBreathSpeed) * 0.5 + 0.5;
  breath = pow(breath, 2.0);

  // Traveling energy ripples across surface
  float ripple = sin(vUv.x * 6.28318 * 3.0 + vUv.y * 6.28318 * 2.0 - uTime * 2.0) * 0.5 + 0.5;
  ripple = pow(ripple, 3.0) * 0.4;

  // Fresnel — stronger at edges, weaker at center
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);

  // Color — base + ritual blend
  vec3 color = mix(uBaseColor, uRitualColor, uRitualBlend);
  color = color * (0.4 + surfaceNoise * 0.6) * (0.7 + breath * 0.3);
  color += uRitualColor * ripple * uPulseIntensity;

  // Alpha — very subtle shell
  float alpha = (0.03 + fresnel * 0.08 + ripple * 0.04) * uIntensity * (0.8 + breath * 0.2);
  alpha = clamp(alpha, 0.0, 0.25);

  gl_FragColor = vec4(color, alpha);
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class RitualShaderPack {
  /**
   * Create a ritual beam material (volumetric god rays)
   */
  static createBeamMaterial(primaryHex, secondaryHex, accentHex, opts = {}) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: opts.intensity ?? 1.0 },
        uPrimaryColor: { value: new THREE.Color(primaryHex) },
        uSecondaryColor: { value: new THREE.Color(secondaryHex) },
        uAccentColor: { value: new THREE.Color(accentHex) },
        uPhase: { value: 0 },
        uDustDensity: { value: opts.dustDensity ?? 1.0 },
        uPulseSpeed: { value: opts.pulseSpeed ?? 3.0 }
      },
      vertexShader: BeamVertex,
      fragmentShader: BeamFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false
    });
  }

  /**
   * Create a ritual fissure material (energy crack with glitch)
   */
  static createFissureMaterial(primaryHex, secondaryHex, accentHex, opts = {}) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: opts.intensity ?? 1.0 },
        uPrimaryColor: { value: new THREE.Color(primaryHex) },
        uSecondaryColor: { value: new THREE.Color(secondaryHex) },
        uAccentColor: { value: new THREE.Color(accentHex) },
        uPhase: { value: 0 },
        uGlitchIntensity: { value: opts.glitchIntensity ?? 1.0 }
      },
      vertexShader: FissureVertex,
      fragmentShader: FissureFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false
    });
  }

  /**
   * Create a ritual ring material (rotating energy arcs)
   */
  static createRingMaterial(primaryHex, secondaryHex, accentHex, opts = {}) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: opts.intensity ?? 1.0 },
        uPrimaryColor: { value: new THREE.Color(primaryHex) },
        uSecondaryColor: { value: new THREE.Color(secondaryHex) },
        uAccentColor: { value: new THREE.Color(accentHex) },
        uPhase: { value: 0 },
        uRotationSpeed: { value: opts.rotationSpeed ?? 1.0 },
        uWaveCount: { value: opts.waveCount ?? 3.0 }
      },
      vertexShader: RingVertex,
      fragmentShader: RingFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false
    });
  }

  /**
   * Create consciousness field shell material (organic breathing sphere)
   */
  static createFieldShellMaterial(baseHex, ritualHex, opts = {}) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: opts.intensity ?? 1.0 },
        uBaseColor: { value: new THREE.Color(baseHex) },
        uRitualColor: { value: new THREE.Color(ritualHex) },
        uRitualBlend: { value: opts.ritualBlend ?? 0.0 },
        uBreathSpeed: { value: opts.breathSpeed ?? 0.8 },
        uPulseIntensity: { value: opts.pulseIntensity ?? 0.5 }
      },
      vertexShader: FieldShellVertex,
      fragmentShader: FieldShellFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false
    });
  }

  /**
   * Update any ritual shader material with time, intensity, and phase.
   * Call this from the ritual controller's update loop.
   */
  static updateMaterial(material, time, intensity, phase) {
    if (!material || !material.uniforms) return;
    if (material.uniforms.uTime !== undefined) material.uniforms.uTime.value = time;
    if (material.uniforms.uIntensity !== undefined) material.uniforms.uIntensity.value = intensity;
    if (material.uniforms.uPhase !== undefined) material.uniforms.uPhase.value = phase;
  }

  /**
   * Update field shell specifically (has extra uniforms)
   */
  static updateFieldShell(material, time, intensity, ritualBlend) {
    if (!material || !material.uniforms) return;
    if (material.uniforms.uTime !== undefined) material.uniforms.uTime.value = time;
    if (material.uniforms.uIntensity !== undefined) material.uniforms.uIntensity.value = intensity;
    if (material.uniforms.uRitualBlend !== undefined) material.uniforms.uRitualBlend.value = ritualBlend;
  }

  /**
   * Dispose a ritual material safely
   */
  static disposeMaterial(material) {
    if (material) material.dispose();
  }
}
