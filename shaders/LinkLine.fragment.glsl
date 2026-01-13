/**
 * LinkLine.fragment.glsl - ATOMA Neural Link Fragment Shader
 * 
 * Creates synergy-specific visual effects with glow, pulses, and warping.
 * Procedural effects for all synergy types without texture lookups.
 */

uniform float time;
uniform float load;         // 0.0-1.0 bandwidth
uniform float speed;        // pulse animation speed
uniform float energy;       // synergy energy 0.0-1.0
uniform vec3 baseColor;     // link color from synergy
uniform float warpIntensity;
uniform float glitch;       // glitch/flicker amount
uniform int synergyType;    // 0:linear, 1:complement, 2:fusion, 3:quantum, 4:sigma, 5:fractal

varying vec3 vPosition;
varying vec2 vUv;
varying float vLoad;
varying float vGlitch;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Soft glow falloff
 */
float glow(float dist, float intensity) {
  return exp(-dist * dist * intensity);
}

/**
 * Procedural wave function
 */
float wave(float t, float freq) {
  return sin(t * freq) * 0.5 + 0.5;
}

/**
 * Multi-layer sine wave
 */
float multiWave(float t, float freq) {
  float w1 = sin(t * freq);
  float w2 = sin(t * freq * 0.5) * 0.5;
  float w3 = sin(t * freq * 2.0) * 0.25;
  return (w1 + w2 + w3) / 1.75 * 0.5 + 0.5;
}

/**
 * Hash function for pseudo-random values
 */
float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

/**
 * Chromatic aberration sampling position
 */
vec2 chromaticAberration(vec2 uv, float amount) {
  // Offset based on UV coordinates and time
  vec2 aberration = vec2(
    sin(uv.x * 10.0 + time) * amount,
    cos(uv.y * 10.0 + time) * amount
  );
  return uv + aberration;
}

/**
 * Fracture effect (for sigma)
 */
float fracture(vec2 uv, float scale, float intensity) {
  vec2 fractUv = fract(uv * scale);
  float fract1 = abs(fractUv.x - 0.5) + abs(fractUv.y - 0.5);
  float fract2 = step(0.4, fract1) * step(fract1, 0.6);
  return fract2 * intensity;
}

// ============================================================================
// SYNERGY-SPECIFIC EFFECTS
// ============================================================================

/**
 * Linear: Soft cyan glow, minimal animation
 */
vec3 linearEffect(vec2 uv) {
  float centerGlow = glow(abs(uv.x - 0.5) * 2.0, 3.0);
  float edgeGlow = glow(abs(uv.x - 0.5) * 2.0, 1.0) * 0.3;
  
  float intensity = centerGlow + edgeGlow;
  intensity *= energy * (0.5 + 0.5 * sin(time * speed * 0.5));
  
  return baseColor * intensity;
}

/**
 * Complement: Gradient pulse moving along line
 */
vec3 complementEffect(vec2 uv) {
  // Pulse wave traveling along X
  float pulse = wave(time * speed + uv.x * 5.0, 3.0);
  
  // Gradient from center
  float centerDist = abs(uv.x - 0.5) * 2.0;
  float gradient = exp(-centerDist * centerDist * 2.0);
  
  // Combine
  float intensity = gradient * (0.5 + pulse * 0.5) * energy;
  
  // Add subtle color shift based on position
  vec3 color = baseColor;
  color += vec3(0.2, 0.3, 0.5) * pulse * 0.3;
  
  return color * intensity;
}

/**
 * Fusion: Strong pulse + afterglow trailing
 */
vec3 fusionEffect(vec2 uv) {
  // Primary pulse
  float pulse = sin((time * speed + uv.x * 4.0) * 3.0) * 0.5 + 0.5;
  
  // Glow center
  float centerGlow = glow(abs(uv.x - 0.5) * 2.0, 4.0);
  
  // Afterglow trail (trailing effect)
  float trail = glow((mod(uv.x + time * speed * 0.3, 1.0) - 0.5) * 2.0, 2.0) * 0.6;
  
  // Y-axis brightness gradient
  float yBright = 1.0 - abs(uv.y - 0.5) * 2.0;
  
  float intensity = (centerGlow + trail + pulse) * yBright * energy * load;
  
  // Enhanced color for fusion (bright magenta/yellow blend)
  vec3 color = baseColor * 1.5;
  color += vec3(1.0, 0.8, 0.2) * pulse * 0.4;
  
  return color * intensity;
}

/**
 * Quantum: Warp + chromatic aberration + irregular pulses
 */
vec3 quantumEffect(vec2 uv) {
  // Irregular multi-frequency pulses
  float pulse1 = sin(time * speed * 1.7 + uv.x * 3.0) * 0.5 + 0.5;
  float pulse2 = sin(time * speed * 2.3 + uv.x * 5.0) * 0.3 + 0.3;
  float pulse3 = sin(time * speed * 1.3 + uv.x * 2.0) * 0.4 + 0.4;
  
  float combinedPulse = (pulse1 + pulse2 * 0.5 + pulse3 * 0.3) / 1.8;
  
  // Chromatic aberration effect
  vec2 aberratedUv = chromaticAberration(uv, warpIntensity * 0.05);
  
  // Warped center
  float warpDist = abs(aberratedUv.x - 0.5 + sin(time * speed * 2.0) * 0.1) * 2.0;
  float centerGlow = glow(warpDist, 3.0 + warpIntensity);
  
  // Random color shifts (quantum instability)
  float colorShift = hash(uv.x + time * speed * 0.5);
  
  vec3 color = baseColor;
  color += vec3(colorShift * 0.3, abs(sin(time * speed)) * 0.3, 1.0) * 0.5;
  
  float intensity = (centerGlow + combinedPulse) * energy * (0.5 + warpIntensity * 0.5);
  
  return color * intensity;
}

/**
 * Sigma: Fracture flickers + green rift glow
 */
vec3 sigmaEffect(vec2 uv) {
  // Fracture pattern (validation grid)
  float frac = fracture(uv, 8.0 + glitch * 5.0, 0.6);
  
  // Glitch flicker
  float flickerIntensity = glitch * (0.5 + 0.5 * sin(time * 15.0));
  float flicker = step(0.7, fract(sin(time * 20.0 + uv.x * 10.0) * 12345.0)) * flickerIntensity;
  
  // Green rift glow (intense center)
  float riftDist = abs(uv.x - 0.5) * 2.0;
  float riftGlow = glow(riftDist, 5.0) * (1.0 + flicker);
  
  // Rift color (intense neon green with slight yellow)
  vec3 riftColor = vec3(0.0, 1.0, 0.4);
  riftColor += vec3(0.2, 0.1, 0.0) * flicker;
  
  // Overlay fracture pattern
  float intensity = (riftGlow + frac * 0.3) * energy * load;
  
  return riftColor * intensity;
}

/**
 * Fractal: Multi-layer concentric glow waves
 */
vec3 fractalEffect(vec2 uv) {
  // Layer 1: Outer wave
  float wave1 = multiWave(time * speed * 0.8 + uv.x * 2.0, 2.0);
  float glow1 = glow(abs(uv.x - 0.5) * 2.0, 2.0) * wave1;
  
  // Layer 2: Middle wave (half speed, offset)
  float wave2 = multiWave(time * speed * 0.4 + uv.x * 3.0 + 1.57, 3.0);
  float glow2 = glow(abs(uv.x - 0.4) * 2.0, 1.5) * wave2 * 0.6;
  
  // Layer 3: Inner wave (fast, offset)
  float wave3 = multiWave(time * speed * 1.2 + uv.x * 5.0 + 3.14, 4.0);
  float glow3 = glow(abs(uv.x - 0.6) * 2.0, 3.0) * wave3 * 0.4;
  
  // Combine layers
  float intensity = (glow1 + glow2 + glow3) * energy * (0.6 + load * 0.4);
  
  // Teal-cyan color scheme
  vec3 color = baseColor;
  color += vec3(0.2, 0.5, 0.8) * (wave1 * 0.3 + wave2 * 0.2);
  
  return color * intensity;
}

// ============================================================================
// MAIN FRAGMENT SHADER
// ============================================================================

void main() {
  vec2 uv = vUv;
  
  vec3 finalColor = baseColor;
  
  // =========================================================================
  // SYNERGY TYPE EFFECTS
  // =========================================================================
  
  if (synergyType == 0) {
    // Linear
    finalColor = linearEffect(uv);
  } else if (synergyType == 1) {
    // Complement
    finalColor = complementEffect(uv);
  } else if (synergyType == 2) {
    // Fusion
    finalColor = fusionEffect(uv);
  } else if (synergyType == 3) {
    // Quantum
    finalColor = quantumEffect(uv);
  } else if (synergyType == 4) {
    // Sigma
    finalColor = sigmaEffect(uv);
  } else if (synergyType == 5) {
    // Fractal
    finalColor = fractalEffect(uv);
  }
  
  // =========================================================================
  // GLOBAL MODULATION
  // =========================================================================
  
  // Load affects overall brightness
  finalColor *= (0.5 + load * 0.5);
  
  // Energy affects saturation
  finalColor = mix(finalColor * 0.3, finalColor, energy);
  
  // =========================================================================
  // GLITCH EFFECTS
  // =========================================================================
  
  if (vGlitch > 0.0) {
    // RGB channel shift (chromatic glitch)
    float glitchShift = vGlitch * 0.15;
    
    // Random color corruption
    float corruption = hash(uv.x + time * 30.0) * vGlitch;
    finalColor.r += corruption * 0.3;
    finalColor.b -= corruption * 0.2;
    
    // Scanline glitch
    float scanline = step(0.5, fract(uv.y * 50.0 + time * 20.0)) * vGlitch * 0.3;
    finalColor += vec3(scanline * 0.5);
  }
  
  // =========================================================================
  // EDGE FALLOFF
  // =========================================================================
  
  // Fade out at edges (smooth falloff)
  float edgeFade = smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x);
  edgeFade *= smoothstep(-0.05, 0.05, uv.y - 0.5) * smoothstep(1.05, 0.95, uv.y - 0.5);
  
  finalColor *= edgeFade;
  
  // =========================================================================
  // FINAL OUTPUT
  // =========================================================================
  
  // Clamp to prevent overbright
  finalColor = clamp(finalColor, vec3(0.0), vec3(1.0));
  
  // Alpha based on color intensity
  float alpha = length(finalColor) * (0.7 + load * 0.3);
  
  gl_FragColor = vec4(finalColor, alpha);
}
