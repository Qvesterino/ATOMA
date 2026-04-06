/**
 * STRESS VISUAL SHADERS
 * Canonical Template #3 visual effects in GLSL
 * 
 * Shaders for:
 * 1. Network Stress ambient effects (fog, distortion)
 * 2. Node stress overlay (connector glow, pulse)
 */

export const stressAmbientVertexShader = `
  varying vec3 vWorldPosition;
  
  void main() {
    vWorldPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const stressAmbientFragmentShader = `
  uniform float uNetworkStress;
  uniform float uTime;
  
  varying vec3 vWorldPosition;
  
  // Network stress color palette
  vec3 stressColorLow = vec3(0.2, 0.4, 0.6);    // Cool blue
  vec3 stressColorMid = vec3(0.8, 0.5, 0.2);    // Orange
  vec3 stressColorHigh = vec3(1.0, 0.2, 0.2);   // Red
  
  // Lerp between colors based on stress
  vec3 getStressColor(float stress) {
    float warmMix = clamp(stress * 2.0, 0.0, 1.0);
    float hotMix = clamp((stress - 0.5) * 2.0, 0.0, 1.0);
    return mix(mix(stressColorLow, stressColorMid, warmMix), stressColorHigh, hotMix);
  }
  
  // Low-frequency Perlin-like turbulence (approximated)
  float turbulence(vec3 pos, float time) {
    float t = time * 0.3; // Slow frequency
    float noise = sin(pos.x * 0.5 + t) * sin(pos.y * 0.3 + t * 1.57) * sin(pos.z * 0.4);
    return noise * 0.5 + 0.5;
  }
  
  void main() {
    // Clamp network stress to 0–1
    float stress = clamp(uNetworkStress, 0.0, 1.0);
    
    // Get stress-based color
    vec3 stressColor = getStressColor(stress);
    
    // Add subtle turbulence (increases with stress)
    float turb = turbulence(vWorldPosition, uTime);
    float turbInfluence = stress * 0.2; // Max 20% turbulence influence
    stressColor += vec3(turb * turbInfluence);
    
    // Soft color gradient based on world position and stress
    float distortion = sin(vWorldPosition.x * 0.1 + uTime * 0.2) * stress;
    stressColor += vec3(distortion * 0.1);
    
    gl_FragColor = vec4(stressColor, 1.0);
  }
`;

/**
 * Node stress overlay shader - draws stress indicators on node surfaces
 */
export const nodeStressVertexShader = `
  uniform float uStressIntensity;
  uniform float uStressPulsePhase;
  uniform float uStressPulseRate;
  
  varying float vStress;
  varying float vPulse;
  varying vec3 vNormal;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    
    // Pulse effect: oscillate between 0 and 1
    vPulse = sin(uStressPulsePhase) * 0.5 + 0.5;
    
    // Stress intensity flows through
    vStress = uStressIntensity;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const nodeStressFragmentShader = `
  uniform float uStressIntensity;
  uniform float uTime;
  
  varying float vStress;
  varying float vPulse;
  varying vec3 vNormal;
  
  // Stress color: low = cyan, high = red
  vec3 getStressColor(float stress) {
    vec3 colorLow = vec3(0.0, 1.0, 1.0);   // Cyan
    vec3 colorHigh = vec3(1.0, 0.0, 0.0);  // Red
    return mix(colorLow, colorHigh, stress);
  }
  
  void main() {
    // Only render if stress is significant
    if (vStress < 0.1) discard;
    
    // Base stress color
    vec3 stressColor = getStressColor(vStress);
    
    // Pulse modulation
    float pulsedIntensity = vStress * vPulse;
    
    // Fresnel effect: emphasize edges under stress
    float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    fresnel = fresnel * fresnel;
    float fresnelInfluence = fresnel * vStress * 0.5;
    
    // Final color with pulsing and fresnel emphasis
    vec3 finalColor = stressColor * (pulsedIntensity + fresnelInfluence);
    
    gl_FragColor = vec4(finalColor, pulsedIntensity * 0.6);
  }
`;

/**
 * Connector stress shader - emphasizes link connectors under load
 */
export const connectorStressVertexShader = `
  uniform float uConnectorStress;
  
  varying float vStress;
  varying float vConnectorIntensity;
  
  void main() {
    vStress = uConnectorStress;
    
    // Connector position in local space determines intensity
    vConnectorIntensity = length(position) * uConnectorStress;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const connectorStressFragmentShader = `
  varying float vStress;
  varying float vConnectorIntensity;
  
  void main() {
    // Bright glow under stress
    vec3 glowColor = vec3(1.0, 0.5, 0.0); // Orange glow
    float glowIntensity = vStress * 0.8;
    
    gl_FragColor = vec4(glowColor * glowIntensity, glowIntensity * vConnectorIntensity);
  }
`;

export default {
  stressAmbientVertexShader,
  stressAmbientFragmentShader,
  nodeStressVertexShader,
  nodeStressFragmentShader,
  connectorStressVertexShader,
  connectorStressFragmentShader
};
