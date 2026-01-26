/**
 * ============================================================================
 * NETWORK STRESS AGGREGATOR v1.0
 * ============================================================================
 * 
 * PURPOSE:
 * Single authoritative source for network-wide stress metric computation.
 * Aggregates stress from LinkDegradationSystem, LinkCollapseSystem, and 
 * nodeDynamicMetrics into a unified 0-100 stress scale.
 * 
 * Exposes via: window.NETWORK_STRESS (updated every frame)
 * 
 * INTEGRATION:
 * const aggregator = new NetworkStressAggregator(
 *   linkDegradationSystem,
 *   linkCollapseSystem,
 *   nodeDynamicMetrics
 * );
 * 
 * UPDATE LOOP (in main game loop, once per frame):
 * aggregator.update(deltaTime);
 * 
 * CONSUMPTION (from visual systems):
 * const stress = window.NETWORK_STRESS; // 0-100 scale
 * 
 * ============================================================================
 */

export class NetworkStressAggregator {
  /**
   * Initialize the network stress aggregator
   * @param {LinkDegradationSystem} linkDegradationSystem - Tracks link degradation
   * @param {LinkCollapseSystem} linkCollapseSystem - Tracks link collapse risk
   * @param {Object} nodeDynamicMetrics - Network metrics (load, etc)
   * @param {Object} config - Optional configuration
   */
  constructor(linkDegradationSystem, linkCollapseSystem, nodeDynamicMetrics, config = {}) {
    this.degradationSystem = linkDegradationSystem;
    this.collapseSystem = linkCollapseSystem;
    this.nodeDynamicMetrics = nodeDynamicMetrics;
    
    // Configuration with sensible defaults
    this.config = {
      // Weighting (should sum to 1.0)
      // Each component contributes differently to total stress
      degradationWeight: config.degradationWeight ?? 0.40,  // Link quality degradation
      collapseWeight: config.collapseWeight ?? 0.30,        // Collapse risk/progress
      loadWeight: config.loadWeight ?? 0.30,                // Network load pressure
      
      // Minimum threshold (ignore noise)
      minStressThreshold: config.minStressThreshold ?? 0.05,
      
      // Temporal smoothing (EMA - Exponential Moving Average)
      // Lower = slower response, less jittery
      // Higher = faster response, more reactive
      smoothingAlpha: config.smoothingAlpha ?? 0.15,
      
      // Debug and monitoring
      enableLogging: config.enableLogging ?? false,
      logInterval: config.logInterval ?? 60  // Log every 60 frames
    };
    
    // State tracking
    this.currentStress = 0;           // Raw stress (0-1)
    this.smoothedStress = 0;          // EMA-smoothed stress (0-1)
    this.updateCount = 0;             // Frame counter for logging
    
    // Component breakdown (for debugging)
    this.degradationStress = 0;
    this.collapseStress = 0;
    this.loadStress = 0;
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.maxUpdateTime = 0;
    
    console.log('[NetworkStressAggregator] Initialized ✓');
  }
  
  /**
   * Update stress aggregation (call once per frame)
   * @param {number} deltaTime - Frame delta time
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    const startTime = performance.now();
    
    // Compute three stress components from underlying systems
    this.degradationStress = this.computeDegradationStress();
    this.collapseStress = this.computeCollapseStress();
    this.loadStress = this.computeLoadStress();
    
    // Aggregate with configured weights
    const rawStress = 
      this.degradationStress * this.config.degradationWeight +
      this.collapseStress * this.config.collapseWeight +
      this.loadStress * this.config.loadWeight;
    
    // Apply minimum threshold (ignore small noise)
    this.currentStress = rawStress < this.config.minStressThreshold ? 0 : rawStress;
    
    // Apply temporal smoothing (EMA)
    // smoothedStress += (currentStress - smoothedStress) * alpha
    // alpha close to 0 = very smooth, slow response
    // alpha close to 1 = instant response, twitchy
    this.smoothedStress += (this.currentStress - this.smoothedStress) * this.config.smoothingAlpha;
    
    // Expose globally (0-100 scale for accessibility)
    window.NETWORK_STRESS = Math.round(this.smoothedStress * 100);
    
    // Performance tracking
    const updateTime = performance.now() - startTime;
    this.lastUpdateTime = updateTime;
    if (updateTime > this.maxUpdateTime) {
      this.maxUpdateTime = updateTime;
    }
    
    // Optional: Debug logging
    if (this.config.enableLogging) {
      this.updateCount++;
      if (this.updateCount % this.config.logInterval === 0) {
        console.log(
          `[NetworkStressAggregator] Stress: ${window.NETWORK_STRESS}` +
          ` (degradation: ${(this.degradationStress * 100).toFixed(0)}% ` +
          `collapse: ${(this.collapseStress * 100).toFixed(0)}% ` +
          `load: ${(this.loadStress * 100).toFixed(0)}%)`
        );
      }
    }
  }
  
  /**
   * Compute degradation stress component (0-1)
   * 
   * Represents how much links are degraded due to network load.
   * Based on LinkDegradationSystem efficiency values.
   * 
   * - Efficiency 1.0 (fully efficient) → stress 0.0
   * - Efficiency 0.5 (half degraded) → stress 0.5
   * - Efficiency 0.0 (fully degraded) → stress 1.0
   * 
   * @private
   * @returns {number} Stress value 0-1
   */
  computeDegradationStress() {
    if (!this.degradationSystem) return 0;
    
    try {
      // Get average efficiency across all links
      // LinkDegradationSystem.getAverageEfficiency() returns 0-1
      // where 1.0 = all links fully efficient, 0 = all fully degraded
      const avgEfficiency = this.degradationSystem.getAverageEfficiency?.() ?? 1.0;
      
      // Convert efficiency to stress
      // High efficiency = low stress
      const stress = 1.0 - avgEfficiency;
      
      return Math.max(0, Math.min(1, stress));
    } catch (err) {
      console.warn('[NetworkStressAggregator] computeDegradationStress error:', err);
      return 0;
    }
  }
  
  /**
   * Compute collapse stress component (0-1)
   * 
   * Represents how close the network is to link collapse.
   * Based on LinkCollapseSystem collapse progress values.
   * 
   * - Progress 0.0 (no risk) → stress 0.0
   * - Progress 0.5 (critical state) → stress 0.5
   * - Progress 1.0 (collapsed) → stress 1.0
   * 
   * @private
   * @returns {number} Stress value 0-1
   */
  computeCollapseStress() {
    if (!this.collapseSystem) return 0;
    
    try {
      // Get average collapse progress across at-risk links
      // LinkCollapseSystem.getAverageCollapseProgress() returns 0-1
      // where 0 = no collapse risk, 1 = collapsed
      const avgCollapseProgress = this.collapseSystem.getAverageCollapseProgress?.() ?? 0;
      
      return Math.max(0, Math.min(1, avgCollapseProgress));
    } catch (err) {
      console.warn('[NetworkStressAggregator] computeCollapseStress error:', err);
      return 0;
    }
  }
  
  /**
   * Compute load stress component (0-1)
   * 
   * Represents network-wide utilization pressure.
   * Based on nodeDynamicMetrics node load ratios.
   * 
   * - Load 0.0 (idle) → stress 0.0
   * - Load 0.5 (half capacity) → stress 0.5
   * - Load 1.0 (full capacity) → stress 1.0
   * 
   * @private
   * @returns {number} Stress value 0-1
   */
  computeLoadStress() {
    if (!this.nodeDynamicMetrics) return 0;
    
    try {
      // Sum up load ratios across all nodes
      const nodes = this.nodeDynamicMetrics.nodes || [];
      
      if (nodes.length === 0) {
        return 0;  // No nodes = no load stress
      }
      
      let totalLoad = 0;
      for (const node of nodes) {
        // Try various method names (defensive)
        const loadRatio = 
          node.getCurrentLoadRatio?.() ??
          node.getLoadRatio?.() ??
          node.loadRatio ??
          0;
        
        totalLoad += Math.max(0, Math.min(1, loadRatio));
      }
      
      // Average load across all nodes
      const averageLoad = totalLoad / nodes.length;
      
      return Math.max(0, Math.min(1, averageLoad));
    } catch (err) {
      console.warn('[NetworkStressAggregator] computeLoadStress error:', err);
      return 0;
    }
  }
  
  /**
   * Get current stress as 0-100 scale (for external consumption)
   * @returns {number} Stress 0-100
   */
  getStress() {
    return window.NETWORK_STRESS ?? 0;
  }
  
  /**
   * Get detailed stress breakdown for debugging
   * @returns {Object} { total, degradation, collapse, load, smoothed }
   */
  getStressBreakdown() {
    return {
      total: window.NETWORK_STRESS,
      degradation: Math.round(this.degradationStress * 100),
      collapse: Math.round(this.collapseStress * 100),
      load: Math.round(this.loadStress * 100),
      smoothed: Math.round(this.smoothedStress * 100),
      raw: Math.round(this.currentStress * 100)
    };
  }
  
  /**
   * Enable debug logging for stress computation
   */
  enableDebugLogging() {
    this.config.enableLogging = true;
    console.log('[NetworkStressAggregator] Debug logging enabled');
  }
  
  /**
   * Disable debug logging
   */
  disableDebugLogging() {
    this.config.enableLogging = false;
    console.log('[NetworkStressAggregator] Debug logging disabled');
  }
  
  /**
   * Get performance metrics
   * @returns {Object} { lastUpdateTime, maxUpdateTime }
   */
  getPerformanceMetrics() {
    return {
      lastUpdateTime: this.lastUpdateTime.toFixed(3),
      maxUpdateTime: this.maxUpdateTime.toFixed(3),
      updateCount: this.updateCount
    };
  }
}

/**
 * Setup console API for NetworkStressAggregator debugging
 * @param {NetworkStressAggregator} aggregator - Instance to debug
 */
export function setupNetworkStressAggregatorConsoleAPI(aggregator) {
  // Get current network stress (0-100)
  window.getNetworkStress = () => {
    return window.NETWORK_STRESS ?? 0;
  };
  
  // Get detailed stress breakdown
  window.getStressBreakdown = () => {
    return aggregator.getStressBreakdown();
  };
  
  // Enable debug logging
  window.enableStressLogging = () => {
    aggregator.enableDebugLogging();
  };
  
  // Disable debug logging
  window.disableStressLogging = () => {
    aggregator.disableDebugLogging();
  };
  
  // Get performance metrics
  window.getStressAggregatorPerf = () => {
    return aggregator.getPerformanceMetrics();
  };
  
  // Force high stress for testing (overrides computation)
  window.setFakeNetworkStress = (value) => {
    const newStress = Math.min(100, Math.max(0, value));
    window.NETWORK_STRESS = newStress;
    console.log(`[Stress Debug] Forced stress to ${newStress}`);
  };
  
  // Show all link stresses (if degradation/collapse systems available)
  window.showAllLinkStresses = () => {
    if (!window.game?.linkDegradationSystem) {
      console.warn('[Stress Debug] LinkDegradationSystem not available');
      return;
    }
    
    const degradation = window.game.linkDegradationSystem;
    const collapse = window.game.linkCollapseSystem;
    const links = window.game.linkingSystem?.links || [];
    
    console.group('[Stress Debug] All Link Stresses');
    links.forEach((link, i) => {
      const eff = degradation.getLinkEfficiency?.(link) ?? 1.0;
      const col = collapse?.getCollapseProgress?.(link) ?? 0;
      const stress = (1 - eff) * 0.6 + col * 0.4;
      console.log(
        `Link ${i}: Eff=${(eff * 100).toFixed(0)}% ` +
        `Col=${(col * 100).toFixed(0)}% ` +
        `Stress=${(stress * 100).toFixed(0)}%`
      );
    });
    console.groupEnd();
  };
  
  console.log('[NetworkStressAggregator] Console API available:');
  console.log('  getNetworkStress() - Get current stress (0-100)');
  console.log('  getStressBreakdown() - Get component breakdown');
  console.log('  enableStressLogging() / disableStressLogging()');
  console.log('  getStressAggregatorPerf() - Performance metrics');
  console.log('  setFakeNetworkStress(value) - Force stress for testing');
  console.log('  showAllLinkStresses() - View all link stress values');
}
