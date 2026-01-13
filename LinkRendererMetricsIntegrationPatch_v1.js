/**
 * LinkRendererMetricsIntegrationPatch_v1.js
 * 
 * Integration layer connecting CoreMetricsCalculator to LinkRenderer shader uniforms.
 * 
 * This patch enhances the existing LinkRenderer with real-time metric updates,
 * enabling shader uniforms (uLoad, uStress, uCorruption) to reflect current
 * network state dynamically.
 * 
 * === INTEGRATION POINTS ===
 * 1. In main.js: Initialize after CoreMetricsCalculator
 * 2. In render loop: Call update() with metrics
 * 3. Applied automatically to all link materials
 * 
 * === ZERO BREAKING CHANGES ===
 * - LinkRenderer remains unchanged
 * - All existing link functionality preserved
 * - Metrics only ENHANCE the shader (optional)
 * - Graceful fallback if metrics unavailable
 */

import { LinkShaderMetricsIntegration, setupLinkShaderMetricsConsoleAPI } from './LinkShaderMetricsIntegration_v1.js';

/**
 * LinkRendererMetricsIntegrationBridge
 * 
 * Manages the connection between:
 * - CoreMetricsCalculator (reads network state)
 * - LinkRenderer (renders links with state-driven shader)
 * - LinkShaderMetricsIntegration (maps metrics to uniforms)
 */
export class LinkRendererMetricsIntegrationBridge {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.autoUpdate = options.autoUpdate !== false;
    
    // The integration system
    this.metricsIntegration = new LinkShaderMetricsIntegration({
      updateFrequency: 'every-frame',
      smoothingFactor: options.smoothingFactor || 0.15,
      enableLogging: options.enableLogging || false
    });
    
    // References to key systems
    this.coreMetricsCalculator = null;
    this.linkRendererMaterials = null;  // Map of linkId → material
    
    // Statistics
    this.stats = {
      framesUpdated: 0,
      lastMetricsUpdateTime: 0,
      averageUpdateTime: 0
    };
  }
  
  /**
   * Initialize the integration
   * 
   * @param {CoreMetricsCalculator} coreMetrics - Metrics calculator instance
   * @param {Map} linkMaterials - Map of linkId → THREE.ShaderMaterial
   */
  initialize(coreMetrics, linkMaterials) {
    if (!coreMetrics) {
      console.warn('[LinkRendererMetrics] No CoreMetricsCalculator provided');
      this.enabled = false;
      return false;
    }
    
    if (!linkMaterials || !(linkMaterials instanceof Map)) {
      console.warn('[LinkRendererMetrics] No link materials map provided');
      this.enabled = false;
      return false;
    }
    
    this.coreMetricsCalculator = coreMetrics;
    this.linkRendererMaterials = linkMaterials;
    
    // Register all materials for tracking
    linkMaterials.forEach((material, linkId) => {
      this.metricsIntegration.registerMaterial(linkId, material);
    });
    
    console.log(`[LinkRendererMetrics] Initialized with ${linkMaterials.size} link materials`);
    
    return true;
  }
  
  /**
   * Update shader uniforms from current metrics
   * Call this in the render loop (e.g., in main.js animate function)
   * 
   * @returns {boolean} True if update was applied
   */
  update() {
    if (!this.enabled || !this.coreMetricsCalculator) {
      return false;
    }
    
    const startTime = performance.now();
    
    try {
      // Get current metrics from calculator
      const metrics = this.coreMetricsCalculator.getMetrics();
      
      // Update integration
      this.metricsIntegration.update(metrics);
      
      // Apply to all registered materials
      const applied = this.metricsIntegration.updateAllRegisteredMaterials();
      
      // Update statistics
      this.stats.framesUpdated++;
      this.stats.lastMetricsUpdateTime = Date.now();
      
      const updateTime = performance.now() - startTime;
      this.stats.averageUpdateTime = 
        (this.stats.averageUpdateTime * 0.9) + (updateTime * 0.1);
      
      return applied > 0;
    } catch (error) {
      console.warn('[LinkRendererMetrics] Error during update:', error);
      return false;
    }
  }
  
  /**
   * Register a new link material (called when link is created)
   * 
   * @param {string} linkId - Link identifier
   * @param {THREE.ShaderMaterial} material - Link shader material
   */
  registerLinkMaterial(linkId, material) {
    if (!this.enabled) return false;
    
    return this.metricsIntegration.registerMaterial(linkId, material);
  }
  
  /**
   * Unregister a link material (called when link is deleted)
   * 
   * @param {string} linkId - Link identifier
   */
  unregisterLinkMaterial(linkId) {
    if (!this.enabled) return false;
    
    return this.metricsIntegration.unregisterMaterial(linkId);
  }
  
  /**
   * Set custom per-link state
   * Allows specific links to have different stress/load
   * 
   * @param {string} linkId - Link identifier
   * @param {Object} state - { load, stress, corruption }
   */
  setLinkState(linkId, state) {
    if (!this.enabled) return false;
    
    return this.metricsIntegration.updateLinkState(linkId, state);
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return this.metricsIntegration.getMetrics();
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      integrationStats: this.metricsIntegration.getStats()
    };
  }
  
  /**
   * Check if enabled
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Disable/enable integration
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

/**
 * Create and initialize the metrics integration
 * 
 * This is the recommended entry point for setup in main.js
 * 
 * @example
 * 
 * import { createLinkRendererMetricsIntegration } from './LinkRendererMetricsIntegrationPatch_v1.js';
 * 
 * // In main.js setup:
 * const metricsIntegration = createLinkRendererMetricsIntegration({
 *   coreMetricsCalculator: metricsCalc,
 *   linkMaterials: linkRenderer.materialsMap,  // From LinkRenderer
 *   enableLogging: false
 * });
 * 
 * // In animation loop:
 * metricsIntegration.update();
 */
export function createLinkRendererMetricsIntegration(options = {}) {
  const {
    coreMetricsCalculator,
    linkMaterials,
    smoothingFactor = 0.15,
    enableLogging = false
  } = options;
  
  const bridge = new LinkRendererMetricsIntegrationBridge({
    smoothingFactor,
    enableLogging
  });
  
  if (coreMetricsCalculator && linkMaterials) {
    bridge.initialize(coreMetricsCalculator, linkMaterials);
  }
  
  // Setup console API
  setupLinkShaderMetricsConsoleAPI(bridge.metricsIntegration);
  
  return bridge;
}

/**
 * Integration helper for LinkRenderer.ts
 * 
 * Modifies LinkRenderer to expose materials map and support metrics integration
 * 
 * @example
 * 
 * // In LinkRenderer, store materials ref:
 * useEffect(() => {
 *   if (groupRef.current) {
 *     groupRef.current.userData.materialsMap = materialsRef.current;
 *   }
 * }, []);
 * 
 * // Then in main.js:
 * const linkRendererGroup = scene.getObjectByName('links');
 * const linkMaterials = linkRendererGroup.userData.materialsMap;
 */
export function setupLinkRendererMaterialsExport(linkRendererGroup) {
  if (!linkRendererGroup) return null;
  
  // Extract materials from all lines in the group
  const materials = new Map();
  
  linkRendererGroup.traverse(child => {
    if (child instanceof THREE.Line && child.userData.linkId) {
      materials.set(child.userData.linkId, child.material);
    }
  });
  
  // Store on group
  linkRendererGroup.userData.materialsMap = materials;
  
  return materials;
}

/**
 * Console API setup (if not using LinkShaderMetricsIntegration directly)
 */
export function setupLinkRendererMetricsConsoleAPI(bridge) {
  if (!bridge) return;
  
  window.__linkRendererMetrics = {
    // Get current state
    getMetrics: () => bridge.getMetrics(),
    getStats: () => bridge.getStats(),
    isEnabled: () => bridge.isEnabled(),
    
    // Control
    enable: () => bridge.setEnabled(true),
    disable: () => bridge.setEnabled(false),
    
    // Manual update
    update: () => bridge.update(),
    
    // Per-link customization
    setLinkState: (linkId, state) => bridge.setLinkState(linkId, state),
    
    // Debug
    help: () => {
      console.log(`
        === Link Renderer Metrics Integration API ===
        
        Status:
        - isEnabled()            Check if integration active
        - getMetrics()           Get current normalized metrics (0-1)
        - getStats()             Get performance statistics
        
        Control:
        - enable()               Enable metric updates
        - disable()              Disable metric updates
        - update()               Manual update (called automatically)
        
        Per-Link Customization:
        - setLinkState(id, {load, stress, corruption})
          Set custom state for specific link
        
        Example:
          window.__linkRendererMetrics.enable()
          window.__linkRendererMetrics.setLinkState('link-1', {
            stress: 0.8,
            corruption: 0.2
          })
          window.__linkRendererMetrics.getMetrics()
      `);
    }
  };
}

export default LinkRendererMetricsIntegrationBridge;
