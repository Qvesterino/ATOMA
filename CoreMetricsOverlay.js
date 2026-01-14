import { CoreMetricsCalculator } from './CoreMetricsCalculator.js';
import { TemporalUnitSystem } from './TemporalUnitSystem.js';
import { CoreMetricsHUD } from './CoreMetricsHUD.js';
import { TemporalEventEffects } from './TemporalEventEffects.js';

/**
 * ATOMA CORE METRICS OVERLAY 1.0
 * 
 * Complete system for displaying network metrics and temporal units.
 * 100% visual-only, non-intrusive overlay.
 * 
 * Features:
 * - Real-time metric calculation (Synergy, Harmony, stability, Corruption, Network Load)
 * - Temporal tracking (Cycle / Epoch / Aeon)
 * - Diegetic HUD display
 * - Subtle temporal event effects
 * - Comprehensive error handling and fallback
 * 
 * SAFETY: Complete isolation from game logic and physics
 */

export class CoreMetricsOverlay {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    
    // Enable/disable flag
    this.enabled = true;
    this.debugMode = false;
    
    // Core systems
    this.metricsCalculator = new CoreMetricsCalculator();
    this.temporalSystem = new TemporalUnitSystem();
    this.hud = new CoreMetricsHUD(renderer);
    this.temporalEffects = new TemporalEventEffects(scene, renderer);
    
    // Cached data
    this.currentMetrics = {
      synergy: 0,
      harmony: 0,
      stability: 0,
      corruption: 0,
      networkLoad: 0
    };
    
    this.currentTemporalDisplay = {
      cycle: '00:00',
      cycleNumber: 0,
      epoch: '00',
      aeon: '00'
    };
    
    // Performance monitoring
    this.performanceMonitor = {
      lastUpdateTime: performance.now(),
      updateCount: 0,
      averageTimeMs: 0
    };
    
    console.log('✓ ATOMA Core Metrics Overlay 1.0 initialized');
  }
  
  /**
   * Update overlay state
   * Call this every frame
   */
  update(deltaTime, aiNodes, linkingSystem, nodeEvolution, nodeArchetypes) {
    if (!this.enabled) return;
    
    try {
      const startTime = performance.now();
      
      // Update metrics (low frequency)
      this.metricsCalculator.update(deltaTime, aiNodes, linkingSystem, nodeEvolution, nodeArchetypes);
      
      // Update temporal system
      const temporalEvents = this.temporalSystem.update(deltaTime);
      
      // Get current data
      this.currentMetrics = this.metricsCalculator.getMetrics();
      this.currentTemporalDisplay = this.temporalSystem.getFormattedDisplay();
      
      // Update HUD display
      this.hud.update(this.currentMetrics, this.currentTemporalDisplay, temporalEvents);
      
      // Update glow animation
      this.hud.updateGlow(deltaTime);
      
      // Trigger temporal effects
      this.temporalEffects.update(deltaTime, temporalEvents);
      
      // Log events if debugging
      if (this.debugMode) {
        if (temporalEvents.newCycle) console.log('► New Cycle:', this.currentTemporalDisplay.cycle);
        if (temporalEvents.newEpoch) console.log('► New Epoch:', this.currentTemporalDisplay.epoch);
        if (temporalEvents.newAeon) console.log('► New Aeon:', this.currentTemporalDisplay.aeon);
      }
      
      // Monitor performance
      const elapsedTime = performance.now() - startTime;
      this.updatePerformanceMonitor(elapsedTime);
      
    } catch (error) {
      console.error('Error updating Core Metrics Overlay:', error);
      this.disable();
    }
  }
  
  /**
   * Update performance statistics
   */
  updatePerformanceMonitor(elapsedTime) {
    const { performanceMonitor } = this;
    
    performanceMonitor.updateCount++;
    performanceMonitor.averageTimeMs = 
      (performanceMonitor.averageTimeMs * (performanceMonitor.updateCount - 1) + elapsedTime) / 
      performanceMonitor.updateCount;
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.currentMetrics };
  }
  
  /**
   * Get current temporal display
   */
  getTemporalDisplay() {
    return { ...this.currentTemporalDisplay };
  }
  
  /**
   * Get node and link counts
   */
  getNetworkStats() {
    return {
      nodeCounts: this.metricsCalculator.getNodeCounts(),
      linkCounts: this.metricsCalculator.getLinkCounts()
    };
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      averageTimeMs: this.performanceMonitor.averageTimeMs.toFixed(3),
      updateCount: this.performanceMonitor.updateCount
    };
  }
  
  /**
   * Enable overlay
   */
  enable() {
    this.enabled = true;
    this.hud.show();
    this.temporalEffects.enable();
    console.log('✓ Core Metrics Overlay enabled');
  }
  
  /**
   * Disable overlay
   */
  disable() {
    this.enabled = false;
    this.hud.hide();
    this.temporalEffects.disable();
    console.log('✓ Core Metrics Overlay disabled');
  }
  
  /**
   * Toggle overlay
   */
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }
  
  /**
   * Enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      console.log('Debug mode enabled for Core Metrics Overlay');
      this.printStatus();
    }
  }
  
  /**
   * Print current status
   */
  printStatus() {
    console.group('Core Metrics Overlay Status');
    console.log('Enabled:', this.enabled);
    console.log('Metrics:', this.currentMetrics);
    console.log('Temporal:', this.currentTemporalDisplay);
    console.log('Performance (ms):', this.getPerformanceStats());
    console.log('Network Stats:', this.getNetworkStats());
    console.groupEnd();
  }
  
  /**
   * Cleanup resources
   */
  cleanup() {
    this.hud.destroy();
    this.temporalEffects.cleanup();
    console.log('✓ Core Metrics Overlay cleaned up');
  }
}

/**
 * Global toggle function (add to console for easy access)
 */
window.toggleMetricsOverlay = function() {
  if (window.game && window.game.coreMetricsOverlay) {
    window.game.coreMetricsOverlay.toggle();
  }
};

/**
 * Global debug function
 */
window.debugMetricsOverlay = function() {
  if (window.game && window.game.coreMetricsOverlay) {
    window.game.coreMetricsOverlay.printStatus();
  }
};
