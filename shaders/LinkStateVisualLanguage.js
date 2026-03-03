/**
 * LINK STATE VISUAL LANGUAGE — Canonical Shader System
 * 
 * Encodes internal network state into link appearance through distinct visual channels:
 * 
 * 1. Network Stress → Global Color Shift (cool → warm → red)
 * 2. Load Pressure → Local Thickness + Pulse
 * 3. Corruption → Noise / Edge Decay (directional distortion)
 * 4. Synergy → Smoothness / Coherence (edge stability)
 * 5. Harmony → Damping (reduces all chaos effects)
 * 
 * Design: Biological nervous system, not alarm lights
 * Aesthetic: Readable at a glance; predictive, not reactive
 */

/**
 * LINK VERTEX SHADER
 * 
 * Inputs:
 * - uNetworkStress (0–1): global network tension
 * - uLocalLoad (0–1): node-local load pressure
 * - uCorruption (0–1): link corruption level
 * - uSynergy (0–100): link affinity/quality
 * - uHarmony (0–1): stabilizing influence
 * - uTime: animation time
 * 
 * Outputs to fragment shader for composition
 */
export const linkStateVertexShader = `
  // === UNIFORMS ===
  uniform float uNetworkStress;      // Global 0–1
  uniform float uLocalLoad;          // Local 0–1 (from connected nodes)
  uniform float uCorruption;         // 0–1
  uniform float uSynergy;            // 0–100
  uniform float uHarmony;            // 0–1
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
    vSynergy = clamp(uSynergy / 100.0, 0.0, 1.0);  // Normalize 0–100 → 0–1
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
    vNormal = normal;
    
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
  varying vec3 vNormal;
  
  // === COLOR PALETTE ===
  // Network stress interpolation
  vec3 stressColorCool = vec3(0.2, 0.5, 0.8);     // Cool blue (low stress)
  vec3 stressColorWarm = vec3(0.9, 0.6, 0.2);     // Warm orange (medium)
  vec3 stressColorHot = vec3(1.0, 0.3, 0.2);      // Muted red (high stress)
  
  // Get color based on network stress
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
    // === CHANNEL 1: NETWORK STRESS → COLOR HUE ===
    // Global color shift (slow, applied to all links uniformly)
    vec3 baseColor = getStressColor(vNetworkStress);
    
    // === CHANNEL 2: LOAD PRESSURE → THICKNESS + PULSE ===
    // Pulse effect (pulsing glow, not color change)
    float pulseIntensity = vPulsePhase * vLocalLoad;
    
    // === CHANNEL 3: CORRUPTION → NOISE / EDGE DECAY ===
    // Edge breakup and directional distortion
    // Corruption makes edges irregular and unstable
    float edgeNoise = vNoise;  // This was calculated in vertex shader
    
    // === CHANNEL 4: SYNERGY → SMOOTHNESS / COHERENCE ===
    // High synergy = smooth, stable link appearance
    // Low synergy = subtle jitter in edges
    // Synergy doesn't change color; it affects stability
    float coherence = vSynergy;  // 0–1, already normalized
    float instability = 1.0 - coherence;  // Low synergy = high instability
    
    // === CHANNEL 5: HARMONY → DAMPING ===
    // Harmony reduces ALL chaotic effects (never amplifies)
    // Damping factor: 0.0 (no damping) to 1.0 (maximum chaos reduction)
    float chaos = edgeNoise + pulseIntensity + instability;
    float damping = vHarmony;  // 0–1: more harmony = more damping
    float dampedChaos = chaos * (1.0 - damping);
    
    // === COMPOSITION (NO MATHEMATICAL MULTIPLICATION) ===
    // Layer effects perceptually, not mathematically
    
    // Base color from network stress
    vec3 finalColor = baseColor;
    
    // Add subtle glow from load pulse (perceptual layering)
    float glowFromLoad = pulseIntensity * 0.3;
    finalColor += vec3(glowFromLoad);
    
    // Reduce brightness if corrupted (edge effect)
    float corruptionDim = vCorruption * 0.4;
    finalColor *= (1.0 - corruptionDim);
    
    // Add edge breakup from corruption (texture, not color)
    finalColor += vec3(edgeNoise * vCorruption * 0.2);
    
    // Instability adds subtle shimmer (perceptual, not mathematical)
    finalColor += vec3(instability * 0.1) * sin(vPosition.x * 10.0);
    
    // === ALPHA (TRANSPARENCY) ===
    // High synergy = fully opaque (confident, solid)
    // Low synergy = more transparent (uncertain, fragile)
    // Corruption adds haziness
    float alpha = mix(0.6, 1.0, coherence);  // 0.6 to 1.0 range
    alpha *= (1.0 - vCorruption * 0.3);  // Corruption reduces opacity
    
    // Harmony damping affects overall appearance, not just alpha
    alpha *= (1.0 + damping * 0.1);  // Harmony slightly increases clarity
    
    // === FINAL OUTPUT ===
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
  uniform vec3 uBaseColor;
  
  varying float vNetworkStress;
  varying float vLocalLoad;
  varying float vCorruption;
  varying float vPulsePhase;
  varying vec3 vBaseColor;
  varying vec3 vNormal;
  
  void main() {
    vNetworkStress = uNetworkStress;
    vLocalLoad = uLocalLoad;
    vCorruption = uCorruption;
    vBaseColor = uBaseColor;
    vNormal = normalize(normalMatrix * normal);
    
    // Simple pulse
    float freq = 2.0 + uLocalLoad * 6.0;
    vPulsePhase = sin(uTime * freq) * 0.5 + 0.5;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const linkStateFragmentShaderSimple = `
  varying float vNetworkStress;
  varying float vLocalLoad;
  varying float vCorruption;
  varying float vPulsePhase;
  varying vec3 vBaseColor;
  varying vec3 vNormal;
  
  vec3 getStressColor(float stress) {
    vec3 cool = vec3(0.2, 0.5, 0.8);
    vec3 warm = vec3(0.9, 0.6, 0.2);
    vec3 hot = vec3(1.0, 0.3, 0.2);
    
    if (stress < 0.5) {
      return mix(cool, warm, stress * 2.0);
    } else {
      return mix(warm, hot, (stress - 0.5) * 2.0);
    }
  }
  
  void main() {
    float effectiveStress = max(vNetworkStress, 0.08);
    vec3 color = vBaseColor * 0.8 + getStressColor(effectiveStress) * 0.2;
    
    // Fake light shading
    float lightFactor = dot(normalize(vNormal), normalize(vec3(0.2, 0.6, 1.0)));
    lightFactor = clamp(lightFactor, 0.3, 1.0);
    color *= lightFactor;
    
    // Add pulse glow from load
    color += vec3(vPulsePhase * vLocalLoad * 0.3);
    
    // Dim from corruption
    color *= (1.0 - vCorruption * 0.3);
    
    // Alpha based on coherence (1 - corruption)
    float alpha = mix(0.6, 1.0, 1.0 - vCorruption);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default {
  linkStateVertexShader,
  linkStateFragmentShader,
  linkStateVertexShaderSimple,
  linkStateFragmentShaderSimple
};
