/**
 * LINK STATE VISUAL LANGUAGE INTEGRATION
 *
 * Wires runtime metrics to link shaders:
 * - Network stress → global color shift
 * - Load pressure → thickness + pulse
 * - Corruption → edge noise
 * - Synergy → smoothness
 * - Harmony → damping
 *
 * Read-only consumer of existing metrics.
 * No gameplay modifications, no stat mutations.
 */

import * as THREE from 'three';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';

/**
 * LINK STATE VISUAL LANGUAGE â€” Canonical Shader System
 * 
 * Encodes internal network state into link appearance through distinct visual channels:
 * 
 * 1. Network Stress â†’ Global Color Shift (cool â†’ warm â†’ red)
 * 2. Load Pressure â†’ Local Thickness + Pulse
 * 3. Corruption â†’ Noise / Edge Decay (directional distortion)
 * 4. Synergy â†’ Smoothness / Coherence (edge stability)
 * 5. Harmony â†’ Damping (reduces all chaos effects)
 * 
 * Design: Biological nervous system, not alarm lights
 * Aesthetic: Readable at a glance; predictive, not reactive
 */

/**
 * LINK VERTEX SHADER
 * 
 * Inputs:
 * - uNetworkStress (0â€“1): global network tension
 * - uLocalLoad (0â€“1): node-local load pressure
 * - uCorruption (0â€“1): link corruption level
 * - uSynergy (0â€“100): link affinity/quality
 * - uHarmony (0â€“1): stabilizing influence
 * - uTime: animation time
 * 
 * Outputs to fragment shader for composition
 */
export const linkStateVertexShader = `
  // === UNIFORMS ===
  uniform float uNetworkStress;      // Global 0â€“1
  uniform float uLocalLoad;          // Local 0â€“1 (from connected nodes)
  uniform float uCorruption;         // 0â€“1
  uniform float uSynergy;            // 0â€“100
  uniform float uHarmony;            // 0â€“1
  uniform float uTime;
  
  // === VARYINGS (pass to fragment) ===
  varying float vNetworkStress;
  varying float vLocalLoad;
  varying float vCorruption;
  varying float vSynergy;
  varying float vHarmony;
  varying float vNoise;
  varying float vPulsePhase;
  varying vec3 vPosition;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  
  // Pseudo-random function for noise
  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }
  
  // Perlin-like noise (simplified)
  float noise(vec3 p) {
    vec3 pi = floor(p);
    vec3 pf = fract(p);
    pf = pf * pf * (3.0 - 2.0 * pf);
    
    float n = pi.x + pi.y * 157.0 + 113.0 * pi.z;
    return mix(
      mix(
        mix(hash(n + 0.0), hash(n + 1.0), pf.x),
        mix(hash(n + 157.0), hash(n + 158.0), pf.x),
        pf.y
      ),
      mix(
        mix(hash(n + 113.0), hash(n + 114.0), pf.x),
        mix(hash(n + 270.0), hash(n + 271.0), pf.x),
        pf.y
      ),
      pf.z
    );
  }
  
  void main() {
    // === PASS METRICS TO FRAGMENT ===
    vNetworkStress = uNetworkStress;
    vLocalLoad = uLocalLoad;
    vCorruption = uCorruption;
    vSynergy = clamp(uSynergy / 100.0, 0.0, 1.0);  // Normalize 0â€“100 â†’ 0â€“1
    vHarmony = uHarmony;
    
    // === CORRUPTION NOISE (directional drift) ===
    // Higher corruption = more distorted edges
    vec3 noisePos = position + uTime * uCorruption * 0.5;
    vNoise = noise(noisePos * 2.0) * uCorruption;
    
    // === LOAD PULSE ===
    // Higher load = faster pulse
    const float BASE_PULSE_FREQ = 2.0;
    const float MAX_PULSE_FREQ = 8.0;
    float pulseFreq = BASE_PULSE_FREQ + uLocalLoad * (MAX_PULSE_FREQ - BASE_PULSE_FREQ);
    vPulsePhase = sin(uTime * pulseFreq) * 0.5 + 0.5;
    
    // === POSITION MODIFICATION ===
    // Load pressure causes subtle lateral shifting (pulse amplitude)
    vec3 pos = position;
    
    // Corruption causes positional jitter (edge breakdown)
    pos += normal * vNoise * 0.02;
    
    // Load causes expansion/compression
    pos += normal * (uLocalLoad * 0.03) * vPulsePhase;
    
    vPosition = pos;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/**
 * LINK FRAGMENT SHADER
 * 
 * Composes all visual channels:
 * 1. Color shift (network stress)
 * 2. Thickness pulse (load pressure)
 * 3. Edge noise (corruption)
 * 4. Smoothness (synergy)
 * 5. Damping (harmony reduces chaos)
 */
export const linkStateFragmentShader = `
  // === INCOMING VARYINGS ===
  varying float vNetworkStress;
  varying float vLocalLoad;
  varying float vCorruption;
  varying float vSynergy;
  varying float vHarmony;
  varying float vNoise;
  varying float vPulsePhase;
  varying vec3 vPosition;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  
  uniform float uTime;
  uniform float u_rippleIntensity;
  uniform float u_ripplesActive;
  uniform float u_rippleSaturation;
  uniform float u_ripplePhase;
  uniform float u_rippleEnergy;
  uniform float u_rippleLength;
  uniform float u_rippleVisibility;
  uniform float u_rippleBandCount;
  uniform float u_rippleSignature;
  uniform float u_stressFieldBias;
  uniform float u_stressFieldTension;
  uniform vec3 u_stressFieldColor;
  uniform float u_rippleSignature;
  uniform float u_stressFieldBias;
  uniform float u_stressFieldTension;
  uniform vec3 u_stressFieldColor;
  
  // === COLOR PALETTE ===
  vec3 stressColorCool = vec3(0.22, 0.95, 1.0);
  vec3 stressColorWarm = vec3(0.76, 0.34, 1.0);
  vec3 stressColorHot = vec3(0.96, 0.98, 1.0);
  
  vec3 getStressColor(float stress) {
    if (stress < 0.5) {
      float t = stress * 2.0;
      return mix(stressColorCool, stressColorWarm, t);
    } else {
      float t = (stress - 0.5) * 2.0;
      return mix(stressColorWarm, stressColorHot, t);
    }
  }
  
  void main() {
    float coherence = clamp(vSynergy, 0.0, 1.0);
    float harmony = clamp(vHarmony, 0.0, 1.0);
    float corruption = clamp(vCorruption, 0.0, 1.0);
    float load = clamp(vLocalLoad, 0.0, 1.0);
    float pulse = 0.5 + 0.5 * vPulsePhase;

    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(max(0.0, 1.0 - dot(n, viewDir)), 2.4);

    vec3 baseColor = getStressColor(vNetworkStress);
    vec3 spectralTint = mix(baseColor, u_stressFieldColor, clamp(0.25 + u_stressFieldBias * 0.35 + u_stressFieldTension * 0.15, 0.0, 1.0));
    vec3 pearl = vec3(0.96, 0.98, 1.0);
    vec3 membraneColor = mix(spectralTint, pearl, 0.16 + fresnel * 0.22 + pulse * 0.08 + u_rippleSaturation * 0.04);

    float chaos = vNoise + pulse * 0.35 + (1.0 - coherence) * 0.4;
    float dampedChaos = chaos * (1.0 - harmony * 0.85);
    float membraneEnergy = clamp(1.0 - dampedChaos * 0.18, 0.58, 1.14);

    float rippleMask = clamp(u_ripplesActive * u_rippleVisibility, 0.0, 1.0);
    float rippleBandCount = max(2.0, u_rippleBandCount);
    float rippleTravel = vPosition.x * (0.72 + rippleBandCount * 0.14) + vPosition.y * 0.22 + uTime * (0.8 + load * 0.7) + u_ripplePhase * 0.11 + u_rippleSignature * 6.28318;
    float rippleWave = 0.5 + 0.5 * sin(rippleTravel * 6.28318);
    rippleWave = pow(rippleWave, mix(2.0, 1.4, load));
    float rippleStrength = rippleMask * rippleWave * (0.14 + abs(u_rippleIntensity) * 0.22 + u_rippleEnergy * 0.18 + load * 0.08);

    float fractureSeed = fract(sin(dot(vPosition.xy, vec2(17.31, 41.97)) + u_rippleSignature * 11.3) * 43758.5453);
    float fractureGate = smoothstep(0.12, 0.95, corruption + u_stressFieldTension * 0.55 + vNoise * 0.25);
    float crackWave = fract(vPosition.x * (3.8 + rippleBandCount * 0.35) + vPosition.y * (2.2 + fractureSeed * 1.4) + uTime * (0.06 + fractureGate * 0.12) + fractureSeed);
    float fractureLine = 1.0 - smoothstep(0.03, 0.18, abs(crackWave - 0.5));
    vec3 fractureColor = mix(vec3(1.0, 0.98, 0.92), u_stressFieldColor, 0.42 + fractureSeed * 0.2);

    vec3 finalColor = membraneColor;
    finalColor += spectralTint * rippleStrength * (0.34 + pulse * 0.18);
    finalColor += pearl * fresnel * (0.22 + load * 0.08 + rippleStrength * 0.14);
    finalColor += fractureColor * fractureLine * fractureGate * (0.22 + rippleStrength * 0.34);
    finalColor += spectralTint * vNoise * 0.08;
    finalColor *= membraneEnergy * (1.0 + rippleStrength * 0.1);
    finalColor = mix(finalColor, spectralTint, corruption * 0.08 + load * 0.05);

    float alpha = 0.74 + coherence * 0.16 + fresnel * 0.08;
    alpha *= 1.0 - corruption * 0.12;
    alpha *= 1.0 + harmony * 0.05;
    alpha = clamp(alpha + rippleStrength * 0.06, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/**
 * SIMPLIFIED LINK SHADER (Performance-optimized variant)
 * Use this if full shader causes performance issues
 */
export const linkStateVertexShaderSimple = `
  uniform float uNetworkStress;
  uniform float uLocalLoad;
  uniform float uCorruption;
  uniform float uTime;
  uniform float uSegmentCount;
  uniform float uStrandIndex;
  uniform float uStrandCount;
  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  uniform float u_rippleIntensity;
  uniform float u_ripplesActive;
  uniform float u_rippleSaturation;
  uniform float u_ripplePhase;
  uniform float u_rippleEnergy;
  uniform float u_rippleLength;
  uniform float u_rippleVisibility;
  uniform float u_rippleBandCount;
  
  varying float vNetworkStress;
  varying float vLocalLoad;
  varying float vCorruption;
  varying float vPulsePhase;
  varying float vStrandIndex;
  varying float vStrandCount;
  varying vec3 vBaseColor;
  varying vec3 vAccentColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying float vRippleWave;
  varying float vRippleMask;
  
  void main() {
    vNetworkStress = uNetworkStress;
    vLocalLoad = uLocalLoad;
    vCorruption = uCorruption;
    vStrandIndex = uStrandIndex;
    vStrandCount = uStrandCount;
    vBaseColor = uBaseColor;
    vAccentColor = uAccentColor;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    float rippleBandCount = max(2.0, u_rippleBandCount);
    float ripplePhase = (u_ripplePhase * 0.18) + (u_rippleLength * 0.03);
    float rippleTravel = (vUv.x * rippleBandCount) - ripplePhase;
    vRippleWave = sin(rippleTravel * 6.28318);
    vRippleMask = step(0.5, u_ripplesActive) * u_rippleVisibility;
    
    // Simple pulse
    float freq = 2.0 + uLocalLoad * 6.0;
    vPulsePhase = sin(uTime * freq) * 0.5 + 0.5;

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const linkStateFragmentShaderSimple = `
  varying float vNetworkStress;
  varying float vLocalLoad;
  varying float vCorruption;
  varying float vPulsePhase;
  varying float vStrandIndex;
  varying float vStrandCount;
  varying vec3 vBaseColor;
  varying vec3 vAccentColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying float vRippleWave;
  varying float vRippleMask;
  uniform float uSegmentCount;
  uniform float uTime;
  uniform float u_rippleIntensity;
  uniform float u_ripplesActive;
  uniform float u_rippleSaturation;
  uniform float u_ripplePhase;
  uniform float u_rippleEnergy;
  uniform float u_rippleLength;
  uniform float u_rippleVisibility;
  uniform float u_rippleBandCount;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  vec3 getStressColor(float stress) {
    vec3 cool = vec3(0.22, 0.95, 1.0);
    vec3 warm = vec3(0.76, 0.34, 1.0);
    vec3 hot = vec3(0.96, 0.98, 1.0);

    float warmMix = clamp(stress * 2.0, 0.0, 1.0);
    float hotMix = clamp((stress - 0.5) * 2.0, 0.0, 1.0);
    return mix(mix(cool, warm, warmMix), hot, hotMix);
  }
  
  void main() {
    float effectiveStress = max(vNetworkStress, 0.08);
    float strandCountSafe = max(1.0, vStrandCount);
    float strandPhase = (vStrandIndex / strandCountSafe) * 6.28318;
    float travel = vUv.x;
    float flowSpeed = 2.6 + vLocalLoad * 2.2;
    float flowBand = sin((travel * 24.0) - (uTime * flowSpeed) + strandPhase);
    float flowT = flowBand * 0.5 + 0.5;
    vec3 strandFlowColor = mix(vBaseColor, vAccentColor, flowT);
    float stressMix = clamp(0.2 + effectiveStress * 0.55 + u_stressFieldBias * 0.25, 0.0, 1.0);
    vec3 stressTint = getStressColor(stressMix);
    vec3 membraneColor = mix(strandFlowColor, stressTint, 0.38);
    membraneColor = mix(membraneColor, u_stressFieldColor, clamp(0.18 + u_stressFieldTension * 0.5, 0.0, 1.0));

    vec3 n = normalize(vNormal);
    vec3 lightDir = normalize(vec3(0.3, 0.7, 0.6));
    float lambert = clamp(dot(n, lightDir), 0.38, 1.0);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnelBase = max(0.0, 1.0 - dot(n, viewDir));
    float fresnel = fresnelBase * fresnelBase;
    float lightRim = 1.0 - abs(dot(n, lightDir));
    float rim = (lightRim * lightRim) * 0.5 + fresnel * 0.85;
    float lighting = lambert * 0.9 + rim * 0.55;
    vec3 color = membraneColor * lighting;

    float ripplePulse = 0.5 + 0.5 * vRippleWave;
    float rippleLengthFactor = clamp(12.0 / max(1.0, u_rippleLength), 0.75, 1.25);
    float rippleStrength = vRippleMask * pow(ripplePulse, mix(1.8, 2.8, vLocalLoad)) * rippleLengthFactor * (0.12 + abs(u_rippleIntensity) * 0.24 + u_rippleEnergy * 0.18);
    vec3 rippleColor = mix(stressTint, vec3(0.96, 0.98, 1.0), clamp(0.34 + u_rippleSaturation * 0.32 + u_rippleIntensity * 0.08, 0.0, 1.0));
    color += rippleColor * rippleStrength;
    color += vec3(rippleStrength * 0.18);

    float cells = max(24.0, uSegmentCount);
    float x = vUv.x * cells;
    float cellId = floor(x);
    float localX = fract(x);

    float seed = hash11(cellId + 7.13 + u_rippleSignature * 19.0);
    float seedB = hash11(cellId + 17.91 + u_rippleSignature * 31.0);
    float laneDist = min(abs(vUv.y - 0.25), abs(vUv.y - 0.75));
    float laneMask = 1.0 - smoothstep(0.070, 0.180, laneDist);

    float skew = mix(2.2, 3.0, seedB);
    float slashCoord = fract(localX + (vUv.y - 0.5) * skew + seed * 0.22 + uTime * 0.01 * (0.5 + vLocalLoad));
    float slash = 1.0 - smoothstep(0.022, 0.128, abs(slashCoord - 0.5));
    float slashTrim = 1.0 - smoothstep(0.22, 0.5, abs(localX - 0.5 + (seed - 0.5) * 0.12));
    float segmentMask = clamp(slash * slashTrim * laneMask, 0.0, 1.0);

    float seamGlow = segmentMask * (0.12 + vCorruption * 0.18 + u_stressFieldTension * 0.22);
    vec3 seamColor = mix(vec3(0.98, 1.0, 0.96), rippleColor, 0.55);
    color += seamColor * seamGlow;

    float fractureGate = smoothstep(0.25, 0.92, vCorruption + u_stressFieldTension * 0.45);
    float crackCoord = fract(localX * (1.0 + seed * 0.55) + vUv.y * (1.6 + seedB * 1.2) + uTime * (0.05 + fractureGate * 0.08) + u_rippleSignature);
    float crack = 1.0 - smoothstep(0.03, 0.16, abs(crackCoord - 0.5));
    vec3 crackColor = mix(vec3(1.0, 0.98, 0.92), seamColor, 0.35 + seed * 0.25);
    color += crackColor * crack * fractureGate * (0.18 + rippleStrength * 0.34);

    color = mix(color, membraneColor, vCorruption * 0.12);
    color *= 1.0 + max(0.0, u_rippleIntensity) * rippleStrength * 0.12;
    color *= 1.0 - max(0.0, -u_rippleIntensity) * rippleStrength * 0.05;

    float alpha = 0.88 + (1.0 - vCorruption) * 0.08 + fresnel * 0.05;
    alpha = clamp(alpha + rippleStrength * 0.05, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

export class LinkStateVisualLanguageIntegration {
  /**
   * @param {Object} linkingSystem - NodeLinkingSystem or equivalent
   * @param {Object} config - Configuration
   */
  constructor(linkingSystem, config = {}) {
    this.linkingSystem = linkingSystem;
    this.debugMode = config.debugMode || false;

    // Link material references (all links share a canonical material)
    this.linkMaterials = new Map();  // link → ShaderMaterial (shared instance)

    // State tracking (for efficient updates)
    this.currentNetworkStress = 0;
    this.linkMetrics = new Map();   // link → { corruption, synergy, harmonyA, harmonyB, loadA, loadB }

    if (this.debugMode) {
      console.log('%c[LinkStateVisualLanguage] Initialized', 'color: #00dd88; font-weight: bold;');
    }
  }

  /**
   * Update network stress (applied to all links)
   * 
   * @param {number} networkStress - Global stress (0–1)
   */
  updateNetworkStress(networkStress) {
    this.currentNetworkStress = Math.max(0, Math.min(1, networkStress ?? 0));
    __currentNetworkStress = this.currentNetworkStress;
    // uniforms applied per-link at draw time via onBeforeRender
  }

  /**
   * Update link-level metrics
   * 
   * @param {Object} link - Link object
   * @param {number} corruption - Link corruption (0–1)
   * @param {number} synergy - Link synergy (0–100)
   */
  updateLinkMetrics(link, corruption, synergy) {
    if (!link) return;

    // Extract harmony from endpoint nodes
    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    
    const harmonyA = sourceNode?.userData?.harmonyLevel ?? 0;
    const harmonyB = targetNode?.userData?.harmonyLevel ?? 0;
    const harmonyAvg = (harmonyA + harmonyB) / 2;
    
    // Extract load from endpoint nodes
    const loadA = sourceNode?.userData?.stressIntensity ?? 0;
    const loadB = targetNode?.userData?.stressIntensity ?? 0;
    const loadMax = Math.max(loadA, loadB);

    // Store metrics
    this.linkMetrics.set(link, {
      corruption: Math.max(0, Math.min(1, corruption ?? 0)),
      synergy: Math.max(0, Math.min(100, synergy ?? 0)),
      harmonyAvg: harmonyAvg,
      loadMax: loadMax
    });
    // Uniforms are set lazily per draw in onBeforeRender

    // Update per-link override snapshot if registered
    const override = __linkStateOverrides.get(link);
    if (override) {
      const metrics = this.linkMetrics.get(link);
      override.corruption = metrics.corruption;
      override.synergy = metrics.synergy;
      override.harmonyAvg = metrics.harmonyAvg;
      override.loadMax = metrics.loadMax;
    }
  }

  /**
   * Register a link for visual language rendering
   * 
   * Creates a shader material with all necessary uniforms
   * 
   * @param {Object} link - Link to register
   * @param {THREE.ShaderMaterial} optionalMaterial - Use existing material if provided
   * @returns {THREE.ShaderMaterial} Shader material with state uniforms
   */
  registerLink(link, optionalMaterial = null) {
    if (!link) return null;

    // Reuse canonical material (bounded program & material count)
    const material = optionalMaterial || getCanonicalLinkStateMaterial();

    // Store reference
    this.linkMaterials.set(link, material);

    // Initialize metrics
    this.updateLinkMetrics(link, 0, 50);

    return material;
  }

  /**
   * Unregister a link from visual language (cleanup)
   * 
   * @param {Object} link - Link to unregister
   */
  unregisterLink(link) {
    if (!link) return;

    this.linkMaterials.delete(link);
    this.linkMetrics.delete(link);
    __linkStateOverrides.delete(link);
  }

  /**
   * Update time uniforms for all animated effects
   * 
   * @param {number} currentTime - Current elapsed time
   */
  updateAnimationTime(currentTime) {
    // Store time; applied per-draw in onBeforeRender
    for (const [link, state] of this.linkMetrics.entries()) {
      state.time = currentTime;
      const override = __linkStateOverrides.get(link);
      if (override) override.time = currentTime;
    }
  }

  /**
   * Get visual state of a specific link (for debugging)
   * 
   * @param {Object} link - Link to query
   * @returns {Object} Visual state snapshot
   */
  getLinkVisualState(link) {
    if (!link) return null;

    const metrics = this.linkMetrics.get(link);
    const material = this.linkMaterials.get(link);

    if (!metrics || !material) return null;

    return {
      networkStress: this.currentNetworkStress,
      corruption: metrics.corruption,
      synergy: metrics.synergy,
      harmony: metrics.harmonyAvg,
      load: metrics.loadMax,
      // Describe what the player sees
      colorShift: this.describeColorShift(this.currentNetworkStress),
      edgeQuality: metrics.corruption > 0.3 ? 'Degraded' : 'Clean',
      coherence: metrics.synergy > 60 ? 'High' : metrics.synergy > 30 ? 'Medium' : 'Low',
      stability: metrics.harmonyAvg > 0.5 ? 'Stabilized' : 'Chaotic'
    };
  }

  /**
   * Describe color shift for debugging
   * 
   * @param {number} stress - Network stress (0–1)
   * @returns {string} Color description
   */
  describeColorShift(stress) {
    if (stress < 0.3) return 'Neon cyan (calm)';
    if (stress < 0.6) return 'Violet membrane (active)';
    return 'Pearl fracture (critical)';
  }

  /**
   * Debug: Print visual state of all registered links
   */
  debugPrintLinkStates() {
    console.log('%c[LinkStateVisualLanguage] LINK VISUAL STATES', 'color: #00dd88; font-weight: bold;');
    console.log(`Network Stress: ${this.currentNetworkStress.toFixed(3)}`);
    console.log(`Registered Links: ${this.linkMaterials.size}`);

    for (const [link, material] of this.linkMaterials.entries()) {
      const state = this.getLinkVisualState(link);
      if (state) {
        console.log(`Link: corruption=${state.corruption.toFixed(2)}, synergy=${state.synergy.toFixed(0)}, harmony=${state.harmony.toFixed(2)}, load=${state.load.toFixed(2)}`);
        console.log(`  → ${state.colorShift} | ${state.edgeQuality} edges | ${state.coherence} coherence | ${state.stability}`);
      }
    }
  }
}

// =============================================================================
// CANONICAL MATERIAL (POOL OF ONE) WITH PER-LINK OVERRIDES
// =============================================================================
let __linkStateMaterial = null;
let __currentNetworkStress = 0;
const __linkStateOverrides = new WeakMap(); // link(object) -> state

function getCanonicalLinkStateMaterial() {
  if (__linkStateMaterial) return __linkStateMaterial;

  // Shaders imported at module level (ES6)

  __linkStateMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uNetworkStress: { value: 0 },
      uLocalLoad: { value: 0 },
      uCorruption: { value: 0 },
      uSynergy: { value: 50 },
      uHarmony: { value: 0 },
      uTime: { value: 0 },
      u_rippleIntensity: { value: 0 },
      u_ripplesActive: { value: 0 },
      u_rippleSaturation: { value: 0.5 },
      u_ripplePhase: { value: 0 },
      u_rippleEnergy: { value: 0 },
      u_rippleLength: { value: 1 },
      u_rippleVisibility: { value: 0 },
      u_rippleBandCount: { value: 2 },
      u_rippleSignature: { value: 0 },
      u_stressFieldBias: { value: 0 },
      u_stressFieldTension: { value: 0 },
      u_stressFieldColor: { value: new THREE.Color(0x7be6ff) }
    },
    vertexShader: linkStateVertexShader,
    fragmentShader: linkStateFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  });
  applyLinkRenderLayer(__linkStateMaterial, 'LINK_SKIN', {
    materialOverrides: { blending: THREE.NormalBlending }
  });

  // Freeze program cache to a single entry for all links
  __linkStateMaterial.customProgramCacheKey = () => 'ATOMA_LINK_CANONICAL_v2';

  // Per-draw uniform application to avoid shared-uniform crosstalk
  __linkStateMaterial.onBeforeRender = (renderer, scene, camera, geometry, object) => {
    const state = __linkStateOverrides.get(object);
    if (!state) return;
    const u = __linkStateMaterial.uniforms;
    u.uNetworkStress.value = __currentNetworkStress;
    u.uLocalLoad.value = state.loadMax ?? 0;
    u.uCorruption.value = state.corruption ?? 0;
    u.uSynergy.value = state.synergy ?? 50;
    u.uHarmony.value = state.harmonyAvg ?? 0;
    u.uTime.value = state.time ?? 0;
  };

  return __linkStateMaterial;
}

// Hook into registerLink to bind per-link overrides
const _originalRegisterLink = LinkStateVisualLanguageIntegration.prototype.registerLink;
LinkStateVisualLanguageIntegration.prototype.registerLink = function(link, optionalMaterial = null) {
  const material = _originalRegisterLink.call(this, link, optionalMaterial);

  // Capture current metrics for this link to apply at draw time
  const metrics = this.linkMetrics.get(link) || {
    corruption: 0, synergy: 50, harmonyAvg: 0, loadMax: 0, time: 0
  };

  __linkStateOverrides.set(link, {
    corruption: metrics.corruption,
    synergy: metrics.synergy,
    harmonyAvg: metrics.harmonyAvg,
    loadMax: metrics.loadMax,
    networkStress: this.currentNetworkStress,
    time: metrics.time ?? 0
  });

  // Optional debug log
  if (typeof window !== 'undefined' && window.__ATOMA_DEBUG_LINK_MATS__ === true) {
    const renderer = window.__ATOMA_RENDERER__;
    const programCount = renderer?.info?.programs?.length;
    const uniqueMaterials = new Set(Array.from(this.linkMaterials.values())).size;
    console.log('[LinkStateVisualLanguageIntegration] link registered',
      { programs: programCount, linkCount: this.linkMaterials.size, uniqueMaterials });
  }

  return material;
};

export default LinkStateVisualLanguageIntegration;
