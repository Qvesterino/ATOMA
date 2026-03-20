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
  uniform float uSegmentCount;
  uniform float uStrandIndex;
  uniform float uStrandCount;
  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  
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
  uniform float uSegmentCount;
  uniform float uTime;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

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
    float strandCountSafe = max(1.0, vStrandCount);
    float strandPhase = (vStrandIndex / strandCountSafe) * 6.28318;
    float travel = vUv.x;
    float flowBand = sin((travel * 24.0) - (uTime * (2.6 + vLocalLoad * 2.2)) + strandPhase);
    float flowT = flowBand * 0.5 + 0.5;
    vec3 strandFlowColor = mix(vBaseColor, vAccentColor, flowT);
    vec3 stressTint = getStressColor(effectiveStress);
    vec3 color = mix(strandFlowColor, stressTint, 0.14 + vCorruption * 0.08);
    
    // Simple Lambert + rim for plasticity
    vec3 n = normalize(vNormal);
    vec3 lightDir = normalize(vec3(0.3, 0.7, 0.6));
    float lambert = clamp(dot(n, lightDir), 0.45, 1.0);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(max(0.0, 1.0 - dot(n, viewDir)), 2.2);
    float rim = pow(1.0 - abs(dot(n, lightDir)), 2.0) * 0.5 + fresnel * 0.75;
    float lighting = lambert * 0.95 + rim * 0.45;
    color *= lighting;
    color += strandFlowColor * (0.15 + vLocalLoad * 0.12);
    
    // Hot energetic streaks that travel along strands (orchestral spark lanes).
    float streakCoord = fract((travel * 36.0) - (uTime * (4.2 + vLocalLoad * 2.8)) + strandPhase * 0.28);
    float streak = 1.0 - smoothstep(0.08, 0.28, abs(streakCoord - 0.5));
    vec3 streakColor = mix(vBaseColor, vAccentColor, 0.5 + 0.5 * sin(strandPhase + uTime * 0.8));
    streakColor = mix(streakColor, vec3(1.0), 0.22);
    color += streakColor * streak * (0.24 + vLocalLoad * 0.34 + vPulsePhase * 0.18);

    // Thin slash-like segment mask (static in UV, low-cost).
    // Keep roughly world-stable spacing by driving segment cell count from conduit.
    float cells = max(24.0, uSegmentCount);
    float x = vUv.x * cells;
    float cellId = floor(x);
    float localX = fract(x);

    float seed = hash11(cellId + 7.13);
    float seedB = hash11(cellId + 17.91);
    // Two narrow opposite lanes so slashes are visible from both view sides.
    float laneDist = min(abs(vUv.y - 0.25), abs(vUv.y - 0.75));
    float laneMask = 1.0 - smoothstep(0.070, 0.180, laneDist);

    // Narrow diagonal slash per segment cell.
    float skew = mix(2.6, 3.4, seedB);
    float slashCoord = fract(localX + (vUv.y - 0.5) * skew + seed * 0.22);
    float slash = 1.0 - smoothstep(0.032, 0.145, abs(slashCoord - 0.5));

    // Small width/phase variance without morphing feel.
    float slashTrim = 1.0 - smoothstep(0.24, 0.48, abs(localX - 0.5 + (seed - 0.5) * 0.12));
    float segmentMask = clamp(slash * slashTrim * laneMask, 0.0, 1.0);
    segmentMask = smoothstep(0.38, 0.88, segmentMask);

    float darken = segmentMask * (0.09 + vCorruption * 0.06 + vLocalLoad * 0.01);
    color *= (1.0 - darken);
    
    // Corruption front warms the strand palette rather than only dimming it.
    vec3 corruptionHue = mix(vBaseColor, vAccentColor, 0.5 + 0.5 * sin(uTime * 0.7 + strandPhase));
    color = mix(color, mix(color, corruptionHue * (0.7 + vPulsePhase * 0.3), 0.55), vCorruption * 0.75);
    color *= (1.0 - vCorruption * 0.18);
    
    // Alpha based on coherence (1 - corruption)
    float alpha = mix(0.86, 1.0, 1.0 - vCorruption) + fresnel * 0.12;
    alpha = clamp(alpha, 0.0, 1.0);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default {
  linkStateVertexShader,
  linkStateFragmentShader,
  linkStateVertexShaderSimple,
  linkStateFragmentShaderSimple
};
