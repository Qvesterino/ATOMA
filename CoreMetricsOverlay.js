import { CoreMetricsCalculator } from './CoreMetricsCalculator.js';
import { TemporalUnitSystem } from './TemporalUnitSystem.js';
import { CoreMetricsHUD } from './CoreMetricsHUD.js';
import { TemporalEventEffects } from './TemporalEventEffects.js';
import { updateHudMetrics, projectHudMetrics, withGlobalMetricAliases } from './SemanticMetricAdapter.js';
import VisualTime from './src/time/VisualTime.js';

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
    this.hudLinkFallback = { synergyScore: 0 };
    this.lastHudDebugLog = 0;
    this._timeOrigin = undefined;
    this._lastVisualTime = undefined;
    this._nodeMetricCache = new Map();
    this._metricSubscriptionDisposer = null;
    this._hasMetricSubscription = false;
    this._initMetricSubscription();
    
    // Cached data
    this.currentMetrics = {
      synergy: 0,
      harmony: 0,
      stability: 0,
      corruption: 0,
      loadPressure: 0,
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

  _initMetricSubscription() {
    const semanticBus = globalThis.semanticBus;
    const subscribe = semanticBus?.subscribe;
    if (typeof subscribe !== 'function') {
      return;
    }

    const handler = (payload = {}) => {
      const nodeId = payload?.nodeId;
      const metric = payload?.metric;
      const value = payload?.value;
      if (nodeId === undefined || nodeId === null || typeof metric !== 'string') {
        return;
      }

      const normalized = this._sanitizeMetric(metric, value);
      if (normalized === null) return;

      const key = String(nodeId);
      const cached = this._nodeMetricCache.get(key) ?? {};
      cached[metric] = normalized;
      this._nodeMetricCache.set(key, cached);
    };

    this._metricSubscriptionDisposer = subscribe.call(semanticBus, 'metric.node.updated', handler);
    this._hasMetricSubscription = true;
  }

  _sanitizeMetric(metric, value) {
    if (typeof value !== 'number' || !isFinite(value)) return null;
    switch (metric) {
      case 'synergy':
      case 'harmony':
      case 'stability':
      case 'corruption':
      case 'loadPressure':
        return Math.max(0, Math.min(1, value));
      default:
        return null;
    }
  }

  _getNodeMetricKey(node) {
    const key = node?.userData?.nodeId ?? node?.id ?? node?.uuid ?? null;
    return key === null ? null : String(key);
  }

  _getEventDrivenMetrics(aiNodes) {
    const sums = {
      synergy: 0,
      harmony: 0,
      stability: 0,
      corruption: 0,
      loadPressure: 0
    };
    const counts = {
      synergy: 0,
      harmony: 0,
      stability: 0,
      corruption: 0,
      loadPressure: 0
    };

    const nodes = aiNodes?.nodes ?? [];
    for (const node of nodes) {
      const key = this._getNodeMetricKey(node);
      if (!key) continue;

      let snapshot = this._nodeMetricCache.get(key);
      if (!snapshot) {
        const metrics = node?.userData?.metrics;
        if (!metrics) continue;
        snapshot = {
          synergy: this._sanitizeMetric('synergy', metrics.synergy ?? 0.5),
          harmony: this._sanitizeMetric('harmony', metrics.harmony ?? 0.5),
          stability: this._sanitizeMetric('stability', metrics.stability ?? 0.5),
          corruption: this._sanitizeMetric('corruption', metrics.corruption ?? 0),
          loadPressure: this._sanitizeMetric('loadPressure', metrics.loadPressure ?? metrics.load ?? metrics.loadRatio ?? 0)
        };
        this._nodeMetricCache.set(key, snapshot);
      }

      for (const metric of ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure']) {
        const value = snapshot?.[metric];
        if (typeof value !== 'number' || !isFinite(value)) continue;
        sums[metric] += value;
        counts[metric] += 1;
      }
    }

    const getAvg = (metric) => (counts[metric] > 0 ? sums[metric] / counts[metric] : 0);
    return withGlobalMetricAliases({
      synergy: getAvg('synergy'),
      harmony: getAvg('harmony'),
      stability: getAvg('stability'),
      corruption: getAvg('corruption'),
      loadPressure: getAvg('loadPressure')
    });
  }
  
  /**
   * Update overlay state
   * Call this every frame
   */
  update(deltaTime, aiNodes, linkingSystem, nodeEvolution, nodeArchetypes) {
    if (!this.enabled) return;

    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now; // Phase 2A: canonical VisualTime anchor (behavior-preserving)
    }
    const currentVisualTime = VisualTime.now - this._timeOrigin; // Phase 2A: VisualTime canonical clock
    const visualDelta = this._lastVisualTime === undefined
      ? 0
      : Math.max(0, currentVisualTime - this._lastVisualTime); // Phase 2A: derived delta (non-negative)
    this._lastVisualTime = currentVisualTime;


    try {
      const startTime = performance.now();
      
      // Update metrics (event-fed when available, polling fallback otherwise)
      if (this._hasMetricSubscription) {
        this.currentMetrics = this._getEventDrivenMetrics(aiNodes);
      } else {
        this.metricsCalculator.update(visualDelta, aiNodes, linkingSystem, nodeEvolution, nodeArchetypes);
        this.currentMetrics = this.metricsCalculator.getMetrics();
      }
      
      // Update temporal system
      const temporalEvents = this.temporalSystem.update(visualDelta);
      
      // Get current data
      this.currentTemporalDisplay = this.temporalSystem.getFormattedDisplay();
      
      // Update HUD display via SemanticMetricAdapter
      const linkSource = linkingSystem?.activeLink ?? linkingSystem?.selectedLink ?? this.hudLinkFallback;
      const hudMetrics = updateHudMetrics(linkSource, this.currentMetrics);

      this.hud.update(hudMetrics, this.currentTemporalDisplay, temporalEvents, visualDelta);
      this.hud.updateGlow(visualDelta); // Phase 2A: HUD glow uses canonical delta

      if (typeof window !== 'undefined' && window.DEBUG) {
        const now = performance.now();
        if (now - this.lastHudDebugLog >= 1000) {
          console.log('[CoreMetricsHUD] VM metrics:', this.currentMetrics, 'HUD metrics:', hudMetrics);
          this.lastHudDebugLog = now;
        }
      }
      
      // Trigger temporal effects
      this.temporalEffects.update(visualDelta, temporalEvents); // Phase 2A: temporal effects follow VisualTime
      
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
      // Keep HUD visible for diagnostics; do not auto-hide on update errors
      this.hud.show();
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
    if (typeof this._metricSubscriptionDisposer === 'function') {
      this._metricSubscriptionDisposer();
    }
    this._metricSubscriptionDisposer = null;
    this._nodeMetricCache.clear();
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
