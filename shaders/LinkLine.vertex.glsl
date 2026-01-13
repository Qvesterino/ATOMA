/**
 * LinkLine.vertex.glsl - ATOMA Neural Link Vertex Shader
 * 
 * Animates link lines with warping, pulsing, and dynamic deformation.
 * Synergy-aware vertex displacement for emergent AI visualization.
 */

uniform float time;
uniform float speed;
uniform float warpIntensity;
uniform float thickness;

varying vec3 vPosition;
varying vec2 vUv;
varying float vLoad;
varying float vGlitch;

// Attributes passed from geometry
attribute float load;
attribute float glitch;
attribute float energy;
attribute vec3 baseColor;

/**
 * Smooth sine wave for warping effects
 */
float smoothWave(float t, float freq, float amplitude) {
  return sin(t * freq) * amplitude;
}

/**
 * Perlin-like noise using sin/cos (procedural)
 */
float noise2D(vec2 p) {
  return sin(p.x * 12.9898 + p.y * 78.233) * 43758.5453;
}

/**
 * Main vertex shader
 */
void main() {
  vUv = uv;
  vLoad = load;
  vGlitch = glitch;
  
  vec3 pos = position;
  
  // =========================================================================
  // WARP DEFORMATION
  // =========================================================================
  
  // Primary wave deformation
  float waveFreq = 3.0 + speed * 2.0;
  float waveAmp = 0.1 * warpIntensity * (0.5 + 0.5 * sin(time * speed));
  
  // Displace perpendicular to line
  vec3 waveDir = normalize(cross(pos, vec3(0.0, 1.0, 0.0)));
  if (length(waveDir) < 0.1) {
    waveDir = normalize(cross(pos, vec3(1.0, 0.0, 0.0)));
  }
  
  pos += waveDir * smoothWave(time * speed + vUv.x * waveFreq, 1.0, waveAmp);
  
  // =========================================================================
  // QUANTUM WARPING (irregular, high intensity)
  // =========================================================================
  
  if (glitch > 0.5) {
    // Quantum: chaotic warping
    float quantumWarp = sin(time * speed * 3.0 + vUv.x * 5.0) * 0.05;
    quantumWarp += sin(time * speed * 2.3 + vUv.x * 3.0) * 0.03;
    
    pos += waveDir * quantumWarp * (glitch - 0.5) * 2.0;
    
    // Perpendicular displacement (quantum instability)
    vec3 perpDir = normalize(cross(waveDir, vec3(0.0, 0.0, 1.0)));
    pos += perpDir * sin(time * speed * 1.7 + vUv.x * 7.0) * 0.02 * (glitch - 0.5) * 2.0;
  }
  
  // =========================================================================
  // PULSING DISPLACEMENT
  // =========================================================================
  
  // Energy-based pulse outward from line
  float pulseFreq = speed * 2.0;
  float pulse = sin((time * speed + vUv.x) * pulseFreq) * 0.5 + 0.5;
  pulse *= energy * 0.05;
  
  // Radial expansion pulse
  pos += normalize(pos) * pulse;
  
  // =========================================================================
  // THICKNESS APPLICATION
  // =========================================================================
  
  // Apply thickness to line width (for tube-like effect)
  vec3 thickDir = normalize(cross(normalize(pos), vec3(0.0, 1.0, 0.0)));
  if (length(thickDir) < 0.1) {
    thickDir = normalize(cross(normalize(pos), vec3(1.0, 0.0, 0.0)));
  }
  
  // Thickness varies with load
  float thickMod = thickness * (0.5 + load * 0.5);
  pos += thickDir * vUv.y * thickMod;
  
  // =========================================================================
  // GLITCH UNDULATION (STABILIZED - was causing high-freq jitter)
  // =========================================================================
  
  if (glitch > 0.0) {
    // STABILITY FIX: Reduced frequency (2-3 Hz instead of 20-30 Hz)
    // Smooth undulation instead of visible jitter
    // Amplitude reduced to 1/3 to eliminate micro-shake
    float jitterFreq = 2.0 + glitch * 1.0;  // 2-3 Hz (was 20-30 Hz)
    float jitter = sin(time * jitterFreq * 0.8 + vUv.x * 3.0) * 0.003;     // Amplitude 1/3
    jitter += cos(time * jitterFreq * 0.6 + vUv.y * 2.5) * 0.003;          // Amplitude 1/3
    
    pos += jitter * glitch;  // Smooth undulation, not jitter
  }
  
  // =========================================================================
  // OUTPUT
  // =========================================================================
  
  vPosition = pos;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
