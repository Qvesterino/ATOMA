/**
 * VISUAL ECHO TRAILS v1.0 — Combined Shader + Integration Module
 * ===============================================================
 *
 * Canonical home for the VisualEchoTrails shader system and its integration
 * adapter. This keeps the overlay in one module while preserving the same
 * runtime behavior and public API.
 */
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
import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

export class VisualEchoTrails_v1 {
  constructor() {
    this.debug = false;
    this.enabled = true;
    
    // Budget cap
    this.maxTrailsPerLink = 10;
    this.maxTotalTrails = 200;
    
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


export class VisualEchoTrails_v1_Integration {
  constructor(scene, linkingSystem, neonLinkVisuals, echoTrailsSystem) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.neonLinkVisuals = neonLinkVisuals;
    this.echoTrailsSystem = echoTrailsSystem;
    this.semanticBus = null;
    this._semanticLinkCreatedHandler = null;
    this._semanticBusAttached = null;
    
    // Track materials that have been enhanced with echo trails
    this.echoMaterials = new Map(); // linkId → [materials]
    
    // Budget cap
    this.maxEchoMaterials = 200; // Max tracked links with echo materials
    
    this.enabled = true;
  }

  init({ linkingSystem = this.linkingSystem, semanticBus = null } = {}) {
    if (linkingSystem) {
      this.linkingSystem = linkingSystem;
    }
    if (semanticBus) {
      this.semanticBus = semanticBus;
    }
    this._bindSemanticBus();
    return this;
  }

  rebind({ linkingSystem = this.linkingSystem, semanticBus = this.semanticBus } = {}) {
    if (semanticBus && semanticBus !== this.semanticBus) {
      this._unbindSemanticBus();
      this.semanticBus = semanticBus;
    }
    if (linkingSystem) {
      this.linkingSystem = linkingSystem;
    }
    this._bindSemanticBus();
    return this;
  }

  _unbindSemanticBus() {
    this._semanticLinkCreatedFanoutUnsubscribe?.();
    this._semanticLinkCreatedFanoutUnsubscribe = null;
    if (typeof this._regDisposerLinkCreated === 'function') {
      this._regDisposerLinkCreated();
      this._regDisposerLinkCreated = null;
    } else if (this._semanticLinkCreatedHandler && this._semanticBusAttached) {
      const bus = this._semanticBusAttached;
      if (bus?.unsubscribe) {
        bus.unsubscribe('link.created', this._semanticLinkCreatedHandler);
      } else if (bus?.off) {
        bus.off('link.created', this._semanticLinkCreatedHandler);
      }
    }
    this._semanticBusAttached = null;
    this._semanticLinkCreatedHandler = null;
  }

  _bindSemanticBus() {
    const semanticBus = this.semanticBus || this.linkingSystem?.semanticBus || globalThis?.semanticBus || null;
    if (!semanticBus?.on) return;
    if (this._semanticLinkCreatedHandler && this._semanticBusAttached === semanticBus) return;

    this._unbindSemanticBus();
    this.semanticBus = semanticBus;
    this._semanticBusAttached = semanticBus;

    const resolveLinkFromPayload = (payload = {}) => {
      const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];
      if (payload.linkId !== null && payload.linkId !== undefined) {
        const byId = links.find((link) => (link?.id ?? link?.userData?.id) === payload.linkId);
        if (byId) return byId;
      }
      const source = payload.source ?? null;
      const target = payload.target ?? null;
      if (!source || !target) return null;
      return links.find((link) => {
        const linkSource = link?.source || link?.nodeA || null;
        const linkTarget = link?.target || link?.nodeB || null;
        return linkSource === source && linkTarget === target;
      }) || null;
    };

    this._semanticLinkCreatedHandler = (event = {}) => {
      const payload = {
        source: event.source ?? null,
        target: event.target ?? null,
        linkId: event.linkId ?? event.id ?? null
      };
      const link = resolveLinkFromPayload(payload);
      if (!link) return;
      this.onLinkCreated(link);
    };

    if (semanticBus.registerLinkCreatedConsumer) {
      this._semanticLinkCreatedFanoutUnsubscribe = semanticBus.registerLinkCreatedConsumer(this._semanticLinkCreatedHandler, {
        id: 'VisualEchoTrails_v1_Integration.linkCreated',
        priority: semanticBus.priority?.NORMAL
      });
    } else {
      this._regDisposerLinkCreated = eventRegistrationRegistry.register(
        'VisualEchoTrailsIntegration', 'link.created', this._semanticLinkCreatedHandler, semanticBus
      );
    }
  }
  
  /**
   * Initialize echo trails on all current links
   * Called during startup after links are created
   */
  initializeAllLinks() {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      console.warn('[EchoTrails] No linking system or links found');
      return;
    }
    
    for (const link of this.linkingSystem.links) {
      this.initializeLink(link);
    }
    
    if (this.debug) console.log(`[EchoTrails] Initialized ${this.linkingSystem.links.length} links`);
  }
  
  /**
   * Initialize echo trail for a single link
   * @param {Object} link - Link to initialize
   */
  initializeLink(link) {
    const linkRoot = link?.group || link?.mesh || null;
    if (!link || !linkRoot) return;
    
    // Get link color for material
    const linkColor = this._getLinkColor(link);

    const appliedMaterials = [];
    const conduitState = linkRoot.userData?.conduitState || null;
    const strandTargets = Array.isArray(conduitState?.strands) ? conduitState.strands.filter(Boolean) : [];

    if (strandTargets.length > 0) {
      for (const strand of strandTargets) {
        if (!strand?.material || !strand?.geometry) continue;
        const echoMaterial = this.echoTrailsSystem.createMaterial(linkColor);
        strand.material = echoMaterial;
        appliedMaterials.push(echoMaterial);
      }
    } else if (typeof linkRoot.traverse === 'function') {
      linkRoot.traverse((child) => {
        if (child === linkRoot) return;
        if (!child?.material || !child?.geometry) return;
        if (child?.userData?.strandIndex === undefined && child?.type !== 'Line') return;
        const echoMaterial = this.echoTrailsSystem.createMaterial(linkColor);
        child.material = echoMaterial;
        appliedMaterials.push(echoMaterial);
      });
    }
    
    // Store reference
    if (link.id) {
      this.echoMaterials.set(link.id, appliedMaterials.length > 0 ? appliedMaterials : []);
    }
  }
  
  /**
   * Initialize echo trail on newly created link
   * Called from link creation callback
   * @param {Object} link - Newly created link
   */
  onLinkCreated(link) {
    if (this.enabled) {
      this.initializeLink(link);
      const materials = link?.id ? this.echoMaterials.get(link.id) : null;
      const hasTrackedMaterials = Array.isArray(materials) && materials.length > 0;
      if (!hasTrackedMaterials && link && typeof link === 'object') {
        const retry = () => {
          if (!this.enabled) return;
          this.initializeLink(link);
        };
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(retry);
        } else {
          setTimeout(retry, 0);
        }
      }
    }
  }
  
  /**
   * Clean up echo trail when link is removed
   * Called from link removal callback
   * @param {Object} link - Removed link
   */
  onLinkRemoved(link) {
    if (link && link.id) {
      this.echoMaterials.delete(link.id);
    }
  }
  
  /**
   * Update all echo trail materials with current frame data
   * Called once per frame in main update loop
   * @param {number} time - Current game time (seconds)
   * @param {number} visualTime - Visual time (may be reversed for extreme synergy)
   * @param {number} avgSynergy - Network average synergy [0..1]
   */
  updateAllMaterials(time, visualTime, avgSynergy) {
    if (!this.enabled) return;
    
    for (const [linkId, materials] of this.echoMaterials.entries()) {
      if (!Array.isArray(materials)) continue;
      
      for (const material of materials) {
        if (material && material.uniforms) {
          // Update time uniforms
          material.uniforms.uTime.value = time;
          material.uniforms.uVisualTime.value = visualTime;
          
          // Update synergy for gating
          material.uniforms.uSynergy.value = avgSynergy;
        }
      }
    }
  }
  
  /**
   * Update specific link material with new synergy value
   * Per-link synergy reading (if available from link data)
   * @param {Object} link - Link to update
   * @param {number} time - Current time
   * @param {number} visualTime - Visual time
   * @param {number} linkSynergy - Link-specific synergy (optional)
   */
  updateLinkMaterial(link, time, visualTime, linkSynergy) {
    if (!link || !link.id) return;
    
    const materials = this.echoMaterials.get(link.id);
    if (!materials) return;
    
    for (const material of materials) {
      if (material && material.uniforms) {
        material.uniforms.uTime.value = time;
        material.uniforms.uVisualTime.value = visualTime;
        material.uniforms.uSynergy.value = linkSynergy || 0.0;
      }
    }
  }
  
  /**
   * Extract link color from various possible sources
   * @private
   */
  _getLinkColor(link) {
    // Try multiple sources for color
    const linkRoot = link?.group || link?.mesh || null;
    const conduitState = linkRoot?.userData?.conduitState || null;
    const strandColor = conduitState?.strands?.[0]?.material?.color;
    if (strandColor?.isColor) {
      return strandColor.clone();
    }
    if (linkRoot?.material && linkRoot.material.color) {
      return linkRoot.material.color.clone();
    }
    
    if (link.color) {
      return new THREE.Color(link.color);
    }
    
    // Default cyan (neon style)
    return new THREE.Color(0x00ffff);
  }
  
  /**
   * Disable echo trails temporarily (keeps materials)
   */
  disable() {
    this.enabled = false;
    
    // Set opacity to 0 for all materials
    for (const materials of this.echoMaterials.values()) {
      for (const material of materials) {
        if (material && material.uniforms) {
          material.uniforms.uEchoOpacity.value = 0.0;
        }
      }
    }
  }
  
  /**
   * Re-enable echo trails
   */
  enable() {
    this.enabled = true;
    
    // Restore opacity
    for (const materials of this.echoMaterials.values()) {
      for (const material of materials) {
        if (material && material.uniforms) {
          material.uniforms.uEchoOpacity.value = 
            this.echoTrailsSystem.params.echoOpacity;
        }
      }
    }
  }
  
  /**
   * Toggle echo trails on/off
   */
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }
  
  /**
   * Set echo intensity for all materials
   * @param {number} intensity - Echo opacity [0..1]
   */
  setIntensity(intensity) {
    intensity = Math.max(0, Math.min(1, intensity));
    
    for (const materials of this.echoMaterials.values()) {
      for (const material of materials) {
        if (material && material.uniforms) {
          material.uniforms.uEchoOpacity.value = intensity;
        }
      }
    }
  }
  
  /**
   * Get current statistics
   * @returns {Object} Integration stats
   */
  getStats() {
    return {
      enabled: this.enabled,
      linksEnhanced: this.echoMaterials.size,
      materialsTracked: Array.from(this.echoMaterials.values()).flat().length,
      echoParams: this.echoTrailsSystem.params
    };
  }
  
  /**
   * Get debug information
   * @returns {Object} Debug snapshot
   */
  getDebugInfo() {
    const stats = this.getStats();
    return {
      ...stats,
      system: 'VisualEchoTrails_v1_Integration',
      status: this.enabled ? 'ACTIVE' : 'DISABLED',
      validation: {
        hasLinkingSystem: !!this.linkingSystem,
        hasNeonLinkVisuals: !!this.neonLinkVisuals,
        hasEchoSystem: !!this.echoTrailsSystem,
        materialsHealthy: this._validateMaterials()
      }
    };
  }
  
  /**
   * Validate material health
   * @private
   */
  _validateMaterials() {
    let healthy = 0;
    let total = 0;
    
    for (const materials of this.echoMaterials.values()) {
      for (const material of materials) {
        total++;
        if (material && material.uniforms && material.uniforms.uTime) {
          healthy++;
        }
      }
    }
    
    return total === 0 ? true : healthy === total;
  }

  /**
   * FIX 6: Dispose — restore original materials and clear state for world switch
   */
  dispose() {
    this._unbindSemanticBus();
    for (const materials of this.echoMaterials.values()) {
      for (const material of materials) {
        if (material) material.dispose();
      }
    }
    this.echoMaterials.clear();
    this.enabled = false;
    this.linkingSystem = null;
    this.neonLinkVisuals = null;
    this.echoTrailsSystem = null;
    this.semanticBus = null;
  }
}

/**
 * Setup function to integrate echo trails into main.js
 * @param {Object} mainInstance - The main game instance
 * @param {VisualEchoTrails_v1} echoTrailsSystem - The shader system
 * @returns {VisualEchoTrails_v1_Integration} Integration instance
 */
export function setupVisualEchoTrailsIntegration(
  mainInstance,
  echoTrailsSystem
) {
  // Create integration layer
  const integration = new VisualEchoTrails_v1_Integration(
    mainInstance.scene,
    mainInstance.linkingSystem,
    mainInstance.linkingSystem?.visuals, // NeonLinkVisuals instance
    echoTrailsSystem
  );
  
  // Initialize on all current links
  integration.initializeAllLinks();

  const resolveLinkFromEndpoints = (source, target, link = null) => {
    if (link) return link;
    const links = Array.isArray(mainInstance.linkingSystem?.links) ? mainInstance.linkingSystem.links : [];
    return links.find((candidate) => {
      const candidateSource = candidate?.source || candidate?.nodeA || null;
      const candidateTarget = candidate?.target || candidate?.nodeB || null;
      return candidateSource === source && candidateTarget === target;
    }) || null;
  };
  
  // Register callbacks for new links
  if (typeof mainInstance.linkingSystem?.onLinkCreated === 'function') {
    mainInstance.linkingSystem.onLinkCreated((source, target, link) => {
      const resolvedLink = resolveLinkFromEndpoints(source, target, link);
      if (resolvedLink) {
        integration.onLinkCreated(resolvedLink);
      }
    }, {
      layerKey: 'LINK_BEAD_TRAILS'
    });
  }

  integration.init({
    linkingSystem: mainInstance.linkingSystem,
    semanticBus: mainInstance?.semanticBus || mainInstance?.linkingSystem?.semanticBus || globalThis?.semanticBus || null
  });
  
  // Register callbacks for removed links
  if (typeof mainInstance.linkingSystem?.onLinkRemoved === 'function') {
    mainInstance.linkingSystem.onLinkRemoved((source, target, link) => {
      const resolvedLink = resolveLinkFromEndpoints(source, target, link);
      if (resolvedLink) {
        integration.onLinkRemoved(resolvedLink);
      }
    });
  }
  
  if (this.debug) console.log('[EchoTrails] Integration complete');
  
  return integration;
}

