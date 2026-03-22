/**
 * — Shader-Level Material Extension
 * ============================================================
 * 
 * Pure shader-level visual enhancement for network link pulses.
 * Adds short-lived echo trails to make pulse flow feel smoother and more alive.
 * 
 * 🎯 DESIGN PRINCIPLES:
 * - Shader-only implementation (no gameplay impact)
 * - Material-level uniforms (no global state pollution)
 * - Additive blending only (safe composition)
 * - Reuses existing pulse infrastructure
 * - Smooth gating by synergy threshold
 * 
 * ✅ GUARANTEES:
 * - No distortion, jitter, or noise
 * - No camera or postprocessing effects
 * - No UI/HUD changes
 * - No gameplay logic modifications
 * - No new global states
 * - Removable by setting uEchoOpacity = 0
 * 
 * 🎨 ECHO MODEL:
 * Main pulse:     fract(time × pulseSpeed)
 * Echo 1:         fract((time - delay1) × pulseSpeed) [medium fade]
 * Echo 2:         fract((time - delay2) × pulseSpeed) [heavy fade]
 * Reverse Echo:   fract(visualTime × pulseSpeed) [extreme fade, synergy > 0.85]
 * 
 * All echoes use smoothstep gating to activate smoothly at synergy 0.7+
 */

// FIX 1: Proper ESM import — THREE was never imported, causing ReferenceError everywhere
import * as THREE from 'three';

export class VisualEchoTrails_v1 {
  constructor() {
    this.enabled = true;
    
    // Default shader parameters
    // These are the values recommended in design spec
    this.defaults = {
      // Pulse parameters
      pulseSpeed: 0.95,           // Cycles per second
      pulseWidth: 0.085,          // Width of pulse band
      baseIntensity: 0.20,        // Base glow strength
      
      // Echo parameters
      echoOpacity: 0.25,          // Max echo visibility
      echoDelay1: 0.10,           // First echo delay (seconds)
      echoDelay2: 0.22,           // Second echo delay (seconds)
      echoAtten1: 0.65,           // First echo attenuation (0-1)
      echoAtten2: 0.35,           // Second echo attenuation (0-1)
      
      // Synergy gating
      echoGateMin: 0.70,          // Minimum synergy for echo activation
      echoGateMax: 0.90,          // Maximum synergy for full echo
      
      // Reverse echo (visual time echo at extreme synergy)
      reverseThreshold: 0.85,     // Synergy threshold for reverse echo
      reverseStrength: 0.60,      // Intensity multiplier for reverse echo
    };
    
    // Current runtime parameters (can be tuned)
    this.params = { ...this.defaults };
  }
  
  /**
   * Get the vertex shader for echo trail pulse rendering
   * Applied to link geometries to modulate along link path
   * @returns {string} GLSL vertex shader code
   */
  getVertexShader() {
    return `
      // Echo Trail Vertex Shader
      // Passes through position, maintains line width
      
      varying vec3 vPosition;
      varying float vTime;
      varying float vSynergy;
      
      uniform float uTime;
      uniform float uSynergy;
      
      void main() {
        vPosition = position;
        vTime = uTime;
        vSynergy = uSynergy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }
  
  /**
   * Get the fragment shader implementing echo trail logic
   * Uses parametric position along line to create trailing echoes
   * @returns {string} GLSL fragment shader code
   */
  getFragmentShader() {
    return `
      // Echo Trail Fragment Shader
      // Implements forward echoes + reverse echo for high synergy
      // Pure additive, no distortion
      
      precision highp float;
      
      varying vec3 vPosition;
      varying float vTime;
      varying float vSynergy;
      
      // Pulse parameters
      uniform float uPulseSpeed;
      uniform float uPulseWidth;
      uniform float uBaseIntensity;
      
      // Echo parameters
      uniform float uEchoOpacity;
      uniform float uEchoDelay1;
      uniform float uEchoDelay2;
      uniform float uEchoAtten1;
      uniform float uEchoAtten2;
      
      // Synergy gating
      uniform float uEchoGateMin;
      uniform float uEchoGateMax;
      
      // Reverse echo (visual time)
      uniform float uVisualTime;
      uniform float uReverseThreshold;
      uniform float uReverseStrength;
      
      // Base color
      uniform vec3 uColor;
      
      /**
       * Create pulse mask at given time offset
       * Uses smooth step for anti-aliasing
       */
      float pulseMask(float timeOffset, float s) {
        // s = normalized position along link (0..1)
        // timeOffset = time value to use for pulse calculation
        
        // Calculate pulse center position along link
        float pulseCenter = fract(timeOffset * uPulseSpeed);
        
        // Distance from pulse center
        float dist = abs(s - pulseCenter);
        
        // Handle wraparound (pulse can wrap from 1.0 → 0.0)
        dist = min(dist, 1.0 - dist);
        
        // Smooth step creates feathered pulse edge
        float mask = smoothstep(uPulseWidth, 0.0, dist);
        
        return mask;
      }
      
      void main() {
        // Get normalized position along link (assuming s is 0..1)
        // This depends on geometry setup; fallback to x coordinate
        float s = fract(vPosition.x + vPosition.y);
        
        // SYNERGY GATING
        // Echo trails activate smoothly when synergy > 0.70
        float echoGate = smoothstep(uEchoGateMin, uEchoGateMax, vSynergy);
        float echoStrength = uEchoOpacity * echoGate;
        
        // PRIMARY PULSE (always at full intensity)
        float p0 = vTime;
        float m0 = pulseMask(p0, s);
        float I0 = 1.0;
        
        // FORWARD ECHO 1 (delayed by uEchoDelay1)
        float p1 = vTime - uEchoDelay1;
        float m1 = pulseMask(p1, s);
        float I1 = echoStrength * uEchoAtten1;
        
        // FORWARD ECHO 2 (delayed by uEchoDelay2)
        float p2 = vTime - uEchoDelay2;
        float m2 = pulseMask(p2, s);
        float I2 = echoStrength * uEchoAtten2;
        
        // REVERSE ECHO (uses visual time, appears when synergy > 0.85)
        // Represents "rewind" effect when harmony is extremely high
        float revGate = smoothstep(uReverseThreshold, 0.95, vSynergy);
        float pr = uVisualTime;
        float mr = pulseMask(pr, s);
        float Ir = echoStrength * 0.18 * uReverseStrength * revGate;
        
        // COMPOSITE: Sum all pulse components
        float pulseSum = 
          I0 * m0 +
          I1 * m1 +
          I2 * m2 +
          Ir * mr;
        
        // SAFE CLAMP: Prevent overdraw while maintaining visibility
        pulseSum = min(pulseSum, 1.25);
        
        // FINAL INTENSITY
        float finalIntensity = uBaseIntensity + pulseSum * 0.80;
        
        // OUTPUT: Additive blend with base color
        gl_FragColor = vec4(uColor * finalIntensity, 1.0);
      }
    `;
  }
  
  /**
   * Create a ShaderMaterial with echo trail uniforms
   * Ready to be applied to line geometries
   * @param {THREE.Color} color - Link color (will be passed to shader)
   * @returns {THREE.ShaderMaterial} Configured material with all uniforms
   */
  createMaterial(color = new THREE.Color(0x00ffff)) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        // Time uniforms (updated per frame)
        uTime: { value: 0.0 },
        uVisualTime: { value: 0.0 },
        uSynergy: { value: 0.0 },
        
        // Pulse shape uniforms
        uPulseSpeed: { value: this.params.pulseSpeed },
        uPulseWidth: { value: this.params.pulseWidth },
        uBaseIntensity: { value: this.params.baseIntensity },
        
        // Echo parameters
        uEchoOpacity: { value: this.params.echoOpacity },
        uEchoDelay1: { value: this.params.echoDelay1 },
        uEchoDelay2: { value: this.params.echoDelay2 },
        uEchoAtten1: { value: this.params.echoAtten1 },
        uEchoAtten2: { value: this.params.echoAtten2 },
        
        // Synergy gating
        uEchoGateMin: { value: this.params.echoGateMin },
        uEchoGateMax: { value: this.params.echoGateMax },
        
        // Reverse echo
        uReverseThreshold: { value: this.params.reverseThreshold },
        uReverseStrength: { value: this.params.reverseStrength },
        
        // Color
        uColor: { value: color.clone() }
      },
      
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      
      side: THREE.FrontSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      fog: false,
      lights: false
    });
    
    return material;
  }
  
  /**
   * Update material uniforms for frame animation
   * Call this once per frame with current time and synergy
   * @param {THREE.ShaderMaterial} material - Material to update
   * @param {number} time - Current game time (seconds)
   * @param {number} visualTime - Visual time (may be reversed for high synergy)
   * @param {number} synergy - Network synergy [0..1]
   */
  updateMaterialUniforms(material, time, visualTime, synergy) {
    if (!material.uniforms) return;
    
    material.uniforms.uTime.value = time;
    material.uniforms.uVisualTime.value = visualTime;
    material.uniforms.uSynergy.value = Math.max(0, Math.min(1, synergy));
  }
  
  /**
   * Update a material's color
   * @param {THREE.ShaderMaterial} material - Material to update
   * @param {THREE.Color|string|number} color - New color
   */
  updateMaterialColor(material, color) {
    if (!material.uniforms) return;
    
    if (!(color instanceof THREE.Color)) {
      color = new THREE.Color(color);
    }
    
    material.uniforms.uColor.value.copy(color);
  }
  
  /**
   * Set echo trail intensity (for tuning)
   * @param {THREE.ShaderMaterial} material - Material to update
   * @param {number} intensity - Echo opacity [0..1]
   */
  setEchoIntensity(material, intensity) {
    if (!material.uniforms) return;
    material.uniforms.uEchoOpacity.value = Math.max(0, Math.min(1, intensity));
  }
  
  /**
   * Set echo trail on/off by opacity
   * @param {THREE.ShaderMaterial} material - Material to update
   * @param {boolean} enabled - Enable echo trails
   */
  setEchoEnabled(material, enabled) {
    if (!material.uniforms) return;
    material.uniforms.uEchoOpacity.value = enabled ? this.params.echoOpacity : 0.0;
  }
  
  /**
   * Get debug information about echo trail configuration
   * @returns {Object} Configuration snapshot
   */
  getDebugInfo() {
    return {
      enabled: this.enabled,
      parameters: { ...this.params },
      shaderSummary: {
        hasForwardEchoes: true,
        hasReverseEcho: true,
        synergyGated: true,
        additiveOnly: true,
        noDistortion: true
      }
    };
  }
  
  /**
   * Reset parameters to defaults
   */
  resetToDefaults() {
    this.params = { ...this.defaults };
  }
  
  /**
   * Apply echo trail material to existing line geometries
   * Converts existing LineBasicMaterial to ShaderMaterial
   * @param {THREE.Object3D} linkGroup - Group containing link meshes
   * @param {THREE.Color} color - Link color for echo material
   * @returns {THREE.ShaderMaterial[]} Array of applied materials
   */
  applyToLinkGroup(linkGroup, color) {
    const materials = [];
    
    linkGroup.traverse((child) => {
      // Only apply to Line objects with materials
      if (!child.material || !child.geometry) return;
      if (!(child instanceof THREE.Line)) return;
      
      // Create echo shader material
      const echoMaterial = this.createMaterial(color);
      
      // Store reference to original material
      echoMaterial.userData = {
        originalMaterial: child.material,
        isEchoTrailMaterial: true
      };
      
      // Apply material
      child.material = echoMaterial;
      materials.push(echoMaterial);
    });
    
    return materials;
  }
  
  /**
   * Console API setup for debugging
   */
  static setupConsoleAPI() {
    // FIX 2: Guard against non-browser environments
    if (typeof window === 'undefined') return;
    window.VisualEchoTrails_v1 = {
      docs: 'Visual Echo Trails v1.0 Shader System',
      info: 'Shader-level pure visual enhancement for link pulses',
      features: [
        'Forward echo trails (2 delayed copies)',
        'Reverse echo (visual time effect)',
        'Synergy gating (0.70–0.90 smooth activation)',
        'Additive blending only',
        'No distortion/jitter'
      ],
      uniforms: {
        uTime: 'Current game time',
        uVisualTime: 'Visual time (may be reversed)',
        uSynergy: 'Network synergy 0–1',
        uPulseSpeed: 'Cycles per second',
        uEchoOpacity: 'Max echo visibility',
        uEchoDelay1: 'First echo delay',
        uEchoDelay2: 'Second echo delay',
        uReverseThreshold: 'Synergy threshold for reverse echo'
      }
    };
  }
}

// FIX 2: Only call in browser context
if (typeof window !== 'undefined') {
  VisualEchoTrails_v1.setupConsoleAPI();
}
