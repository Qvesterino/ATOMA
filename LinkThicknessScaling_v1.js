/**
 * LinkThicknessScaling_v1.js
 * 
 * Animated link thickness scaling based on network load.
 * 
 * === DESIGN ===
 * - Scales link linewidth based on uLoad uniform (0-1)
 * - Multiplier range: 1x (min load) → 3x (max load)
 * - Smooth animations using exponential averaging
 * - Per-link custom scale ranges support
 * - GPU-driven via shader uniform (no geometry modifications)
 * 
 * === HOW IT WORKS ===
 * Links use THREE.Line with linewidth property. We track the uLoad uniform
 * and multiply it into linewidth dynamically, creating the visual effect of
 * thickness scaling without modifying geometry.
 * 
 * Alternative (GPU-driven): Could use width attribute in shader for more
 * control, but linewidth approach is simpler and compatible with LineBasicMaterial
 * fallback.
 * 
 * === INTEGRATION ===
 * 1. Create controller: new LinkThicknessScaler(options)
 * 2. Register materials: controller.registerMaterial(linkId, material)
 * 3. In render loop: controller.update(deltaTime, metrics)
 * 4. Optional: controller.setLinkThicknessRange(linkId, min, max)
 */

import * as THREE from 'three';

export class LinkThicknessScaler {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.baseLinewidth = options.baseLinewidth || 2.0;       // Default THREE.Line linewidth
    this.minMultiplier = options.minMultiplier || 1.0;       // 1x at zero load
    this.maxMultiplier = options.maxMultiplier || 3.0;       // 3x at max load
    this.smoothingFactor = options.smoothingFactor || 0.1;   // 0.1 = responsive
    this.enableLogging = options.enableLogging || false;
    
    // Tracked materials with custom ranges
    this.materials = new Map();
    
    // Current global metrics
    this.currentLoad = 0;
    this.targetLoad = 0;
    this.smoothedLoad = 0;
    
    // Statistics
    this.stats = {
      materialsTracked: 0,
      updatesApplied: 0,
      averageUpdateTime: 0,
      lastUpdateTime: 0
    };
  }
  
  /**
   * Register a material for thickness scaling
   * 
   * @param {string} linkId - Link identifier
   * @param {THREE.Material} material - Link material (LineBasicMaterial or ShaderMaterial)
   * @param {Object} customRange - Optional custom scale range
   *   - min: minimum multiplier (default 1.0)
   *   - max: maximum multiplier (default 3.0)
   */
  registerMaterial(linkId, material, customRange = {}) {
    if (!material) return false;
    
    const minMult = customRange.min ?? this.minMultiplier;
    const maxMult = customRange.max ?? this.maxMultiplier;
    
    this.materials.set(linkId, {
      material,
      minMultiplier: minMult,
      maxMultiplier: maxMult,
      currentMultiplier: 1.0,
      smoothedMultiplier: 1.0,
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
   * Update thickness based on network load
   * 
   * @param {number} deltaTime - Frame delta time
   * @param {Object} metrics - Metrics object with load value
   *   - load: 0-1 normalized network load
   *   OR
   *   - networkLoad: 0-100 raw network load
   */
  update(deltaTime = 0.016, metrics = {}) {
    if (!this.enabled || this.materials.size === 0) {
      return;
    }
    
    const startTime = performance.now();
    
    try {
      // Extract load from metrics (normalize if needed)
      let load = metrics.load ?? (metrics.networkLoad ?? 0) / 100;
      load = Math.max(0, Math.min(1, load));
      
      this.targetLoad = load;
      
      // Apply smoothing
      if (this.smoothingFactor > 0 && this.smoothingFactor < 1) {
        this.smoothedLoad = 
          this.smoothedLoad * (1 - this.smoothingFactor) +
          this.targetLoad * this.smoothingFactor;
      } else {
        this.smoothedLoad = this.targetLoad;
      }
      
      // Apply to all materials
      let applied = 0;
      this.materials.forEach((entry, linkId) => {
        if (this.applyThicknessToMaterial(entry, this.smoothedLoad)) {
          applied++;
        }
      });
      
      this.stats.updatesApplied++;
      
      // Update performance stats
      const updateTime = performance.now() - startTime;
      this.stats.averageUpdateTime = 
        (this.stats.averageUpdateTime * 0.9) + (updateTime * 0.1);
      this.stats.lastUpdateTime = updateTime;
      
      if (this.enableLogging && applied > 0) {
        console.log(`[LinkThicknessScaling] Updated ${applied} materials (load: ${this.smoothedLoad.toFixed(2)})`);
      }
      
      return applied;
    } catch (error) {
      console.warn('[LinkThicknessScaling] Error during update:', error);
      return 0;
    }
  }
  
  /**
   * Apply thickness to a single material
   * 
   * @private
   */
  applyThicknessToMaterial(entry, normalizedLoad) {
    const { material, minMultiplier, maxMultiplier } = entry;
    
    // Calculate multiplier based on load
    const multiplier = minMultiplier + 
      (maxMultiplier - minMultiplier) * normalizedLoad;
    
    entry.currentMultiplier = multiplier;
    
    // Apply smoothing to multiplier for even smoother transitions
    if (this.smoothingFactor > 0.1) {
      entry.smoothedMultiplier = 
        entry.smoothedMultiplier * (1 - 0.05) +
        multiplier * 0.05;
    } else {
      entry.smoothedMultiplier = multiplier;
    }
    
    // Update material properties
    if (material instanceof THREE.ShaderMaterial) {
      // For shader materials, scale the uLoad uniform used for glow
      // and optionally add a thickness uniform
      
      if (material.uniforms?.uThicknessMultiplier) {
        material.uniforms.uThicknessMultiplier.value = entry.smoothedMultiplier;
      }
      
      // Also update linewidth if available
      if ('linewidth' in material) {
        material.linewidth = this.baseLinewidth * entry.smoothedMultiplier;
      }
    } else if (material instanceof THREE.LineBasicMaterial) {
      // For basic materials, adjust linewidth directly
      material.linewidth = this.baseLinewidth * entry.smoothedMultiplier;
    }
    
    return true;
  }
  
  /**
   * Set custom thickness range for a specific link
   * 
   * @param {string} linkId - Link identifier
   * @param {number} minMult - Minimum multiplier
   * @param {number} maxMult - Maximum multiplier
   */
  setLinkThicknessRange(linkId, minMult, maxMult) {
    const entry = this.materials.get(linkId);
    if (!entry) return false;
    
    entry.minMultiplier = minMult;
    entry.maxMultiplier = maxMult;
    return true;
  }
  
  /**
   * Apply thickness to all registered materials at once
   * (For manual per-frame control if needed)
   */
  applyToAllMaterials(load = this.smoothedLoad) {
    let applied = 0;
    this.materials.forEach((entry) => {
      if (this.applyThicknessToMaterial(entry, load)) {
        applied++;
      }
    });
    return applied;
  }
  
  /**
   * Get current load value
   */
  getLoad() {
    return this.smoothedLoad;
  }
  
  /**
   * Get load multiplier (1-3x by default)
   */
  getLoadMultiplier() {
    return this.minMultiplier + 
      (this.maxMultiplier - this.minMultiplier) * this.smoothedLoad;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentLoad: this.smoothedLoad,
      currentMultiplier: this.getLoadMultiplier()
    };
  }
  
  /**
   * Enable/disable scaling
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  /**
   * Reset to default state
   */
  reset() {
    this.currentLoad = 0;
    this.targetLoad = 0;
    this.smoothedLoad = 0;
    
    this.materials.forEach(entry => {
      entry.currentMultiplier = 1.0;
      entry.smoothedMultiplier = 1.0;
    });
  }
  
  /**
   * Get all tracked materials
   */
  getMaterials() {
    return Array.from(this.materials.keys());
  }
  
  /**
   * Clear all tracked materials
   */
  clearMaterials() {
    this.materials.clear();
    this.stats.materialsTracked = 0;
  }
}

/**
 * GPU-driven thickness scaling via shader uniforms
 * 
 * Add this to shader for GPU-controlled scaling:
 */
export const THICKNESS_SHADER_FRAGMENT = `
  // In fragment shader:
  uniform float uThicknessMultiplier;  // 1-3x based on load
  
  void main() {
    // ... existing shader code ...
    
    // Apply thickness via brightness modulation
    // (if using LineBasicMaterial with vertex colors)
    vec3 finalColor = baseColor * uThicknessMultiplier;
    
    // Or use for glow intensity
    float glowIntensity = baseGlow * uThicknessMultiplier;
  }
`;

/**
 * Helper: Create shader material with thickness uniform
 */
export function createShaderMaterialWithThickness(baseUniforms = {}) {
  return {
    ...baseUniforms,
    uThicknessMultiplier: { value: 1.0 }  // 1-3x
  };
}

/**
 * Console API for debugging
 */
export function setupLinkThicknessScalingConsoleAPI(scaler) {
  if (!scaler) return;
  
  window.__linkThicknessScaling = {
    // Get current state
    getLoad: () => scaler.getLoad(),
    getMultiplier: () => scaler.getLoadMultiplier(),
    getStats: () => scaler.getStats(),
    
    // Manual updates
    update: (metrics) => scaler.update(0.016, metrics),
    reset: () => scaler.reset(),
    
    // Control
    enable: () => scaler.setEnabled(true),
    disable: () => scaler.setEnabled(false),
    
    // Test scenarios
    testLight: () => scaler.update(0.016, {load: 0.2}),    // Light load
    testModerate: () => scaler.update(0.016, {load: 0.5}), // Moderate load
    testHeavy: () => scaler.update(0.016, {load: 0.8}),    // Heavy load
    testFull: () => scaler.update(0.016, {load: 1.0}),     // Full load
    
    // Per-link customization
    setRange: (linkId, min, max) => scaler.setLinkThicknessRange(linkId, min, max),
    
    // Materials
    getMaterials: () => scaler.getMaterials(),
    getMaterialCount: () => scaler.materials.size,
    
    help: () => {
      console.log(`
        === Link Thickness Scaling API ===
        
        Status:
        - getLoad()           Get normalized load (0-1)
        - getMultiplier()     Get thickness multiplier (1-3x)
        - getStats()          Get performance stats
        
        Updates:
        - update(metrics)     Manual update with metrics
        - testLight()         Test with 0.2 load
        - testModerate()      Test with 0.5 load
        - testHeavy()         Test with 0.8 load
        - testFull()          Test with 1.0 load
        
        Control:
        - enable()            Turn on scaling
        - disable()           Turn off scaling
        - reset()             Reset to default
        
        Per-Link:
        - setRange(id, min, max)  Set custom multiplier range
        - getMaterials()      List tracked link IDs
        - getMaterialCount()   Count tracked links
        
        Example:
          window.__linkThicknessScaling.testHeavy()
          window.__linkThicknessScaling.getMultiplier()
      `);
    }
  };
}

export default LinkThicknessScaler;
