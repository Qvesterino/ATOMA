/**
 * LinkThicknessMetricsIntegrationPatch_v1.js
 * 
 * Integrates LinkThicknessScaler with LinkShaderMetricsIntegration
 * to provide automated, metrics-driven link thickness scaling.
 * 
 * === INTEGRATION ===
 * Bridges three systems:
 * 1. CoreMetricsCalculator (provides networkLoad)
 * 2. LinkThicknessScaler (scales thickness based on load)
 * 3. LinkRenderer (renders links with scaled thickness)
 * 
 * === WORKFLOW ===
 * CoreMetricsCalculator
 *   ↓ (networkLoad: 0-100)
 * LinkThicknessMetricsIntegration
 *   ↓ (normalize + smooth)
 * LinkThicknessScaler
 *   ↓ (apply to materials)
 * LinkRenderer
 *   ↓ (renders with scaled thickness)
 * Visual Feedback
 *   (Thicker links = more network activity)
 */

import { LinkThicknessScaler, setupLinkThicknessScalingConsoleAPI } 
  from './LinkThicknessScaling_v1.js';

export class LinkThicknessMetricsIntegrationBridge {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    
    // The thickness scaler
    this.thicknessScaler = new LinkThicknessScaler({
      baseLinewidth: options.baseLinewidth || 2.0,
      minMultiplier: options.minMultiplier || 1.0,
      maxMultiplier: options.maxMultiplier || 3.0,
      smoothingFactor: options.smoothingFactor || 0.1,
      enableLogging: options.enableLogging || false
    });
    
    // References to key systems
    this.coreMetricsCalculator = null;
    this.linkMaterials = null;
    
    // Statistics
    this.stats = {
      framesUpdated: 0,
      lastUpdateTime: 0,
      averageUpdateTime: 0
    };
  }
  
  /**
   * Initialize the integration
   * 
   * @param {CoreMetricsCalculator} coreMetrics - Metrics calculator
   * @param {Map} linkMaterials - Map of linkId → material
   */
  initialize(coreMetrics, linkMaterials) {
    if (!coreMetrics) {
      console.warn('[LinkThicknessMetrics] No CoreMetricsCalculator provided');
      this.enabled = false;
      return false;
    }
    
    if (!linkMaterials || !(linkMaterials instanceof Map)) {
      console.warn('[LinkThicknessMetrics] No link materials map provided');
      this.enabled = false;
      return false;
    }
    
    this.coreMetricsCalculator = coreMetrics;
    this.linkMaterials = linkMaterials;
    
    // Register all materials with thickness scaler
    linkMaterials.forEach((material, linkId) => {
      this.thicknessScaler.registerMaterial(linkId, material);
    });
    
    console.log(`[LinkThicknessMetrics] ✅ Initialized with ${linkMaterials.size} link materials`);
    
    return true;
  }
  
  /**
   * Update thickness scaling from current metrics
   * Call this in the render loop
   */
  update() {
    if (!this.enabled || !this.coreMetricsCalculator) {
      return false;
    }
    
    const startTime = performance.now();
    
    try {
      // Get current metrics from calculator
      const metrics = this.coreMetricsCalculator.getMetrics();
      
      // Extract network load (convert 0-100 to 0-1)
      const load = (metrics.networkLoad ?? 30) / 100;
      
      // Update thickness scaler
      const applied = this.thicknessScaler.update(0.016, {load});
      
      // Update statistics
      this.stats.framesUpdated++;
      const updateTime = performance.now() - startTime;
      this.stats.lastUpdateTime = updateTime;
      this.stats.averageUpdateTime = 
        (this.stats.averageUpdateTime * 0.95) + (updateTime * 0.05);
      
      return applied > 0;
    } catch (error) {
      console.warn('[LinkThicknessMetrics] Error during update:', error);
      return false;
    }
  }
  
  /**
   * Register a new link material
   * Called when a link is created
   */
  registerLinkMaterial(linkId, material, customRange = {}) {
    if (!this.enabled) return false;
    
    return this.thicknessScaler.registerMaterial(linkId, material, customRange);
  }
  
  /**
   * Unregister a link material
   * Called when a link is deleted
   */
  unregisterLinkMaterial(linkId) {
    if (!this.enabled) return false;
    
    return this.thicknessScaler.unregisterMaterial(linkId);
  }
  
  /**
   * Set custom thickness range for a specific link
   * Override global min/max multipliers
   */
  setLinkThicknessRange(linkId, minMultiplier, maxMultiplier) {
    if (!this.enabled) return false;
    
    return this.thicknessScaler.setLinkThicknessRange(linkId, minMultiplier, maxMultiplier);
  }
  
  /**
   * Get current thickness multiplier
   */
  getThicknessMultiplier() {
    return this.thicknessScaler.getLoadMultiplier();
  }
  
  /**
   * Get current network load (0-1)
   */
  getLoad() {
    return this.thicknessScaler.getLoad();
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      scalerStats: this.thicknessScaler.getStats()
    };
  }
  
  /**
   * Enable/disable scaling
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.thicknessScaler.setEnabled(enabled);
  }
  
  /**
   * Check if enabled
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Reset to defaults
   */
  reset() {
    this.thicknessScaler.reset();
  }
}

/**
 * Factory function for convenient initialization
 * 
 * @example
 * 
 * import { createLinkThicknessMetricsIntegration } 
 *   from './LinkThicknessMetricsIntegrationPatch_v1.js';
 * 
 * const thickness = createLinkThicknessMetricsIntegration({
 *   coreMetricsCalculator: metricsCalc,
 *   linkMaterials: linkMaterials,
 *   minMultiplier: 1.0,
 *   maxMultiplier: 3.5,
 *   smoothingFactor: 0.1
 * });
 * 
 * // In render loop:
 * thickness.update();
 */
export function createLinkThicknessMetricsIntegration(options = {}) {
  const {
    coreMetricsCalculator,
    linkMaterials,
    baseLinewidth = 2.0,
    minMultiplier = 1.0,
    maxMultiplier = 3.0,
    smoothingFactor = 0.1,
    enableLogging = false
  } = options;
  
  const bridge = new LinkThicknessMetricsIntegrationBridge({
    baseLinewidth,
    minMultiplier,
    maxMultiplier,
    smoothingFactor,
    enableLogging
  });
  
  if (coreMetricsCalculator && linkMaterials) {
    bridge.initialize(coreMetricsCalculator, linkMaterials);
  }
  
  // Setup console API
  setupLinkThicknessScalingConsoleAPI(bridge.thicknessScaler);
  
  return bridge;
}

/**
 * Combined metrics + thickness integration
 * 
 * For convenience, this manages both shader metrics AND thickness scaling
 * in one unified system.
 */
export class LinkMetricsAndThicknessIntegration {
  constructor(options = {}) {
    this.shaderMetrics = options.shaderMetrics || null;
    this.thicknessMetrics = null;
    this.enabled = options.enabled !== false;
  }
  
  /**
   * Initialize both systems
   */
  initialize(coreMetrics, linkMaterials, options = {}) {
    // Initialize thickness scaling
    this.thicknessMetrics = new LinkThicknessMetricsIntegrationBridge(
      options.thickness || {}
    );
    
    this.thicknessMetrics.initialize(coreMetrics, linkMaterials);
    
    // Initialize shader metrics if provided
    if (this.shaderMetrics) {
      this.shaderMetrics.initialize(coreMetrics, linkMaterials);
    }
    
    console.log('[LinkMetricsAndThickness] ✅ Combined integration initialized');
    return true;
  }
  
  /**
   * Update both systems from metrics
   * Call this once per frame
   */
  update() {
    if (!this.enabled) return false;
    
    let updated = false;
    
    // Update thickness scaling
    if (this.thicknessMetrics?.isEnabled()) {
      this.thicknessMetrics.update();
      updated = true;
    }
    
    // Update shader metrics (color, stress, etc.)
    if (this.shaderMetrics?.isEnabled()) {
      this.shaderMetrics.update();
      updated = true;
    }
    
    return updated;
  }
  
  /**
   * Register new link
   */
  registerLink(linkId, material, options = {}) {
    this.thicknessMetrics?.registerLinkMaterial(linkId, material, options.thickness);
    this.shaderMetrics?.registerLinkMaterial(linkId, material);
  }
  
  /**
   * Unregister link
   */
  unregisterLink(linkId) {
    this.thicknessMetrics?.unregisterLinkMaterial(linkId);
    this.shaderMetrics?.unregisterLinkMaterial(linkId);
  }
  
  /**
   * Get combined statistics
   */
  getStats() {
    return {
      thickness: this.thicknessMetrics?.getStats(),
      shaderMetrics: this.shaderMetrics?.getStats(),
      enabled: this.enabled
    };
  }
  
  /**
   * Control
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.thicknessMetrics) this.thicknessMetrics.setEnabled(enabled);
    if (this.shaderMetrics) this.shaderMetrics.setEnabled(enabled);
  }
}

/**
 * Setup console API for combined system
 */
export function setupLinkMetricsAndThicknessConsoleAPI(combined) {
  if (!combined) return;
  
  window.__linkMetricsAndThickness = {
    // Get state
    getStats: () => combined.getStats(),
    isEnabled: () => combined.enabled,
    
    // Control
    enable: () => combined.setEnabled(true),
    disable: () => combined.setEnabled(false),
    
    // Access sub-systems
    thickness: window.__linkThicknessScaling,
    shader: window.__linkShaderMetrics,
    
    help: () => {
      console.log(`
        === Link Metrics + Thickness Integration API ===
        
        Combined Control:
        - isEnabled()         Check if active
        - getStats()          Get performance stats
        - enable()            Turn on both systems
        - disable()           Turn off both systems
        
        Sub-Systems:
        - window.__linkThicknessScaling   Link thickness control
        - window.__linkShaderMetrics      Shader metrics control
        
        See help on each sub-system for detailed commands.
        
        Example:
          window.__linkMetricsAndThickness.enable()
          window.__linkThicknessScaling.testHeavy()
          window.__linkShaderMetrics.testCorruption(0.8)
      `);
    }
  };
}

export default LinkThicknessMetricsIntegrationBridge;
