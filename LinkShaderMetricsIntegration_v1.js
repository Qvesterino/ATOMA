/**
 * LinkShaderMetricsIntegration_v1.js
 * 
 * Real-time integration of network state metrics into link shader uniforms.
 * 
 * Maps CoreMetricsCalculator output to conduit shader state:
 * - networkLoad (0-100%) → uLoad (0-1 normalized)
 * - instability (0-100%) → uStress (0-1 normalized)
 * - corruption (0-100%) → uCorruption (0-1 normalized)
 * - harmony (0-100%) → color blending factor
 * 
 * === DESIGN ===
 * - Read-only access to metrics (no state modification)
 * - Updates shader uniforms in real-time (every frame or on-demand)
 * - Graceful degradation if metrics unavailable
 * - Per-link state mapping (different links can have different stress levels)
 * - Backward compatible with static shader uniforms
 * 
 * === INTEGRATION POINTS ===
 * 1. Initialize in main.js or LinkRenderer
 * 2. Call update() in render loop with current metrics
 * 3. Apply to link materials after update
 * 
 * === EXAMPLE ===
 * 
 * const metricsIntegration = new LinkShaderMetricsIntegration();
 * 
 * // In render loop:
 * metricsIntegration.update(coreMetricsCalculator.getMetrics());
 * metricsIntegration.applyToMaterial(linkMaterial);
 * // or for multiple materials:
 * metricsIntegration.applyToAllMaterials(linkMaterialsMap);
 */

import * as THREE from 'three';

export class LinkShaderMetricsIntegration {
  constructor(options = {}) {
    this.updateFrequency = options.updateFrequency || 'every-frame'; // 'every-frame' or 'manual'
    this.smoothingFactor = options.smoothingFactor || 0.1; // 0-1: higher = smoother transitions
    this.enableLogging = options.enableLogging || false;
    
    // Current normalized metrics (0-1)
    this.normalizedMetrics = {
      load: 0.3,           // Network load
      stress: 0.0,         // Instability/stress
      corruption: 0.0,     // Corruption level
      harmony: 1.0,        // Harmony (1.0 = good, 0.0 = bad)
      synergy: 0.5         // Synergy (0-1)
    };
    
    // Previous frame metrics (for smoothing)
    this.previousMetrics = { ...this.normalizedMetrics };
    
    // Tracked materials
    this.materials = new Map();
    
    // Statistics
    this.stats = {
      updatesApplied: 0,
      materialsTracked: 0,
      lastUpdateTime: 0
    };
  }
  
  /**
   * Update internal metrics from CoreMetricsCalculator output
   * 
   * @param {Object} rawMetrics - Raw metrics from CoreMetricsCalculator
   *   - loadPressure (0-1) or networkLoad (0-100 legacy)
   *   - instability (0-100)
   *   - corruption (0-100)
   *   - harmony (0-100)
   *   - synergy (0-100)
   */
  update(rawMetrics = {}) {
    if (!rawMetrics || typeof rawMetrics !== 'object') {
      if (this.enableLogging) {
        console.warn('[LinkShaderMetrics] Invalid metrics object');
      }
      return;
    }
    
    // Normalize metrics from 0-100 to 0-1
    const newMetrics = {
      load: Math.max(0, Math.min(1,
        rawMetrics.loadPressure !== undefined
          ? rawMetrics.loadPressure
          : (rawMetrics.networkLoad ?? 30) / 100)),
      stress: Math.max(0, Math.min(1, (rawMetrics.instability ?? 0) / 100)),
      corruption: Math.max(0, Math.min(1, (rawMetrics.corruption ?? 0) / 100)),
      harmony: Math.max(0, Math.min(1, (rawMetrics.harmony ?? 100) / 100)),
      synergy: Math.max(0, Math.min(1, (rawMetrics.synergy ?? 50) / 100))
    };
    
    // Apply smoothing (prevent jittery transitions)
    if (this.smoothingFactor > 0 && this.smoothingFactor < 1) {
      Object.keys(newMetrics).forEach(key => {
        this.normalizedMetrics[key] = 
          this.previousMetrics[key] * (1 - this.smoothingFactor) +
          newMetrics[key] * this.smoothingFactor;
      });
    } else {
      this.normalizedMetrics = newMetrics;
    }
    
    // Cache previous for next frame
    this.previousMetrics = { ...this.normalizedMetrics };
    
    this.stats.updatesApplied++;
    this.stats.lastUpdateTime = Date.now();
    
    if (this.enableLogging) {
      console.log('[LinkShaderMetrics] Update:', {
        raw: rawMetrics,
        normalized: this.normalizedMetrics
      });
    }
  }
  
  /**
   * Apply current metrics to a single shader material
   * 
   * @param {THREE.ShaderMaterial} material - Shader material to update
   * @param {Object} overrides - Optional per-link overrides
   */
  applyToMaterial(material, overrides = {}) {
    if (!(material instanceof THREE.ShaderMaterial)) {
      return false;
    }
    
    const uniforms = material.uniforms;
    if (!uniforms) return false;
    
    // Apply normalized metrics (0-1 range)
    const load = overrides.load ?? this.normalizedMetrics.load;
    const stress = overrides.stress ?? this.normalizedMetrics.stress;
    const corruption = overrides.corruption ?? this.normalizedMetrics.corruption;
    const harmony = overrides.harmony ?? this.normalizedMetrics.harmony;
    
    // Update shader uniforms
    if (uniforms.uLoad) {
      uniforms.uLoad.value = load;
    }
    if (uniforms.uStress) {
      uniforms.uStress.value = stress;
    }
    if (uniforms.uCorruption) {
      uniforms.uCorruption.value = corruption;
    }
    
    // Optional: Adjust color based on harmony
    if (uniforms.uColorA && uniforms.uColorB && harmony < 0.5) {
      // When harmony is low, shift slightly toward stress color
      const harmonyInfluence = 1 - harmony;
      // Blend between A (stable) and B (stress)
      uniforms.uColorA.value.lerp(uniforms.uColorB.value, harmonyInfluence * 0.3);
    }
    
    // Update legacy uniforms for compatibility
    if (uniforms.energy) {
      const energyValue = 0.5 + load * 0.5;  // Load drives energy
      uniforms.energy.value = energyValue;
      
      // EMISSIVE / GLOW EFFECT: Boost final color for emissive/glow
      const emissiveBoost = 1.0 + energy * 1.5;  // Emissive glow based on energy
      uniforms.uEmissiveBoost = emissiveBoost;
      
      // DEBUG: Log emissive boost
      if (this.enableLogging) {
        console.log('[LinkShaderMetrics] emissive boost updated:', {
          load: load.toFixed(3),
          energy: energyValue.toFixed(3),
          emissiveBoost: emissiveBoost.toFixed(3),
          calculation: '1.0 + energy * 1.5'
        });
      }
    }
    if (uniforms.intensity) {
      uniforms.intensity.value = 1.0;  // Always full intensity
      
      // DEBUG: Log intensity uniform update
      if (this.enableLogging) {
        console.log('[LinkShaderMetrics] intensity uniform updated:', {
          intensity: 1.0,
          note: 'Always full intensity'
        });
      }
    }
    
    return true;
  }
  
  /**
   * Apply metrics to all tracked materials
   * 
   * @param {Map} materialsMap - Map of linkId → material
   */
  applyToAllMaterials(materialsMap) {
    if (!materialsMap || !(materialsMap instanceof Map)) {
      return 0;
    }
    
    let applied = 0;
    materialsMap.forEach((material, linkId) => {
      if (this.applyToMaterial(material)) {
        applied++;
      }
    });
    
    return applied;
  }
  
  /**
   * Register a material for tracking
   * Allows per-link state customization
   * 
   * @param {string} linkId - Unique link identifier
   * @param {THREE.ShaderMaterial} material - The shader material
   * @param {Object} customState - Optional custom state for this link
   */
  registerMaterial(linkId, material, customState = {}) {
    if (!(material instanceof THREE.ShaderMaterial)) {
      return false;
    }
    
    this.materials.set(linkId, {
      material,
      customState: {
        load: customState.load,
        stress: customState.stress,
        corruption: customState.corruption,
        harmony: customState.harmony
      },
      createdAt: Date.now()
    });
    
    this.stats.materialsTracked = this.materials.size;
    return true;
  }
  
  /**
   * Unregister a material
   * 
   * @param {string} linkId - Link identifier
   */
  unregisterMaterial(linkId) {
    return this.materials.delete(linkId);
  }
  
  /**
   * Update custom state for a specific link
   * Allows per-link stress/load variations
   * 
   * @param {string} linkId - Link identifier
   * @param {Object} customState - { load, stress, corruption, harmony }
   */
  updateLinkState(linkId, customState = {}) {
    const entry = this.materials.get(linkId);
    if (!entry) return false;
    
    Object.assign(entry.customState, customState);
    return true;
  }
  
  /**
   * Apply metrics to all registered materials
   * Call this in the render loop
   */
  updateAllRegisteredMaterials() {
    let applied = 0;
    
    this.materials.forEach((entry, linkId) => {
      if (this.applyToMaterial(entry.material, entry.customState)) {
        applied++;
      }
    });
    
    return applied;
  }
  
  /**
   * Get current normalized metrics
   */
  getMetrics() {
    return { ...this.normalizedMetrics };
  }
  
  /**
   * Get metrics in raw 0-100 scale
   */
  getRawMetrics() {
    return {
      load: this.normalizedMetrics.load * 100,
      stress: this.normalizedMetrics.stress * 100,
      corruption: this.normalizedMetrics.corruption * 100,
      harmony: this.normalizedMetrics.harmony * 100,
      synergy: this.normalizedMetrics.synergy * 100
    };
  }
  
  /**
   * Get statistics about integration
   */
  getStats() {
    return {
      ...this.stats,
      materialsRegistered: this.materials.size
    };
  }
  
  /**
   * Color mapping based on state
   * Useful for UI or debug visualization
   * 
   * @returns {THREE.Color} Color representing current state
   */
  getStateColor() {
    const { stress, corruption, harmony } = this.normalizedMetrics;
    
    // Corruption dominant: shift to red
    if (corruption > 0.5) {
      return new THREE.Color().lerpColors(
        new THREE.Color(0x00ddff), // Stable cyan
        new THREE.Color(0xff1744), // Corruption red
        corruption
      );
    }
    
    // Stress visible: shift to orange
    if (stress > 0.3) {
      return new THREE.Color().lerpColors(
        new THREE.Color(0x00ddff), // Stable cyan
        new THREE.Color(0xff6b35), // Stress orange
        stress / 0.3
      );
    }
    
    // Stable: bright cyan
    return new THREE.Color(0x00ddff);
  }
  
  /**
   * Clear all tracked materials
   */
  clearTrackedMaterials() {
    this.materials.clear();
    this.stats.materialsTracked = 0;
  }
  
  /**
   * Reset metrics to default (stable state)
   */
  reset() {
    this.normalizedMetrics = {
      load: 0.3,
      stress: 0.0,
      corruption: 0.0,
      harmony: 1.0,
      synergy: 0.5
    };
    this.previousMetrics = { ...this.normalizedMetrics };
  }
}

/**
 * Setup global console API for debugging
 */
export function setupLinkShaderMetricsConsoleAPI(metricsIntegration) {
  if (!metricsIntegration) return;
  
  window.__linkShaderMetrics = {
    // Get current metrics
    getMetrics: () => metricsIntegration.getMetrics(),
    getRawMetrics: () => metricsIntegration.getRawMetrics(),
    
    // Manual update
    update: (rawMetrics) => metricsIntegration.update(rawMetrics),
    
    // Apply to all registered materials
    applyToAll: () => metricsIntegration.updateAllRegisteredMaterials(),
    
    // Test with custom values
    testCorruption: (level) => metricsIntegration.update({
      networkLoad: 30,
      instability: 0,
      corruption: level * 100,
      harmony: 100,
      synergy: 50
    }),
    
    testStress: (level) => metricsIntegration.update({
      networkLoad: 30,
      instability: level * 100,
      corruption: 0,
      harmony: 100,
      synergy: 50
    }),
    
    testLoad: (level) => metricsIntegration.update({
      networkLoad: level * 100,
      instability: 0,
      corruption: 0,
      harmony: 100,
      synergy: 50
    }),
    
    // Get statistics
    getStats: () => metricsIntegration.getStats(),
    
    // Get representative color
    getStateColor: () => metricsIntegration.getStateColor(),
    
    // Reset to stable
    reset: () => metricsIntegration.reset(),
    
    // Help
    help: () => {
      console.log(`
        === Link Shader Metrics Integration API ===
        
        Current State:
        - getMetrics()           Get normalized metrics (0-1)
        - getRawMetrics()        Get raw metrics (0-100)
        - getStats()             Get integration statistics
        - getStateColor()        Get representative color
        
        Updates:
        - update(rawMetrics)     Update metrics manually
        - applyToAll()           Apply to all registered materials
        
        Testing:
        - testCorruption(0-1)    Simulate corruption level
        - testStress(0-1)        Simulate stress level
        - testLoad(0-1)          Simulate network load
        
        Reset:
        - reset()                Return to stable state
        
        Example:
          window.__linkShaderMetrics.testCorruption(0.5)
          window.__linkShaderMetrics.applyToAll()
          window.__linkShaderMetrics.getMetrics()
      `);
    }
  };
}

export default LinkShaderMetricsIntegration;
