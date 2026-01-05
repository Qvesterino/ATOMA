/**
 * EXTRACTION PACK V1.0 — METRICS RUNTIME
 * 
 * MetricsRuntime_v1: Orchestration wrapper for all metrics systems
 * 
 * PURPOSE:
 * - Provides unified orchestration interface for metrics subsystems
 * - Centralizes metrics lifecycle (init, update, cleanup)
 * - Maintains separation of concerns without code duplication
 * - Allows metrics to be managed as a cohesive unit
 * 
 * SAFETY:
 * ✅ 100% orchestration wrapper (no logic rewriting)
 * ✅ Reads from provided system references (never modifies them)
 * ✅ Safe optional chaining throughout
 * ✅ Defensive error handling
 * ✅ Fully reversible via dispose()
 * ✅ No dependencies on main.js internals
 * 
 * SYSTEMS ORCHESTRATED:
 * - nodeDynamicMetrics: Runtime dynamics calculation
 * - linkQualityCalculator: Link quality scoring
 * - nodeQualityCalculator: Node quality metrics
 * - visualMetricModel: Visual metric integration
 * - safeMetricsFX: Metrics-driven visual effects
 * 
 * INTEGRATION:
 *   import { MetricsRuntime_v1 } from './MetricsRuntime_v1.js';
 *   
 *   this.metricsRuntime_v1 = new MetricsRuntime_v1({
 *       nodes: this.aiNodes,
 *       links: this.links,
 *       metricsSystems: {
 *           nodeDynamicMetrics: this.nodeDynamicMetrics,
 *           linkQualityCalculator: this.linkQualityCalculator,
 *           nodeQualityCalculator: this.nodeQualityCalculator,
 *           visualMetricModel: this.visualMetricModel,
 *           safeMetricsFX: this.safeMetricsFX
 *       }
 *   });
 *   
 *   // In animate loop:
 *   this.metricsRuntime_v1?.update(deltaTime);
 *   
 *   // On cleanup:
 *   this.metricsRuntime_v1?.dispose?.();
 */

export class MetricsRuntime_v1 {
    /**
     * Initialize metrics runtime orchestration
     * 
     * @param {Object} config - Configuration object
     * @param {Object} config.nodes - AI nodes reference
     * @param {Object} config.links - Links reference
     * @param {Object} config.metricsSystems - Metrics systems to orchestrate
     */
    constructor({ nodes, links, metricsSystems }) {
        this.nodes = nodes;
        this.links = links;
        this.systems = metricsSystems || {};
        
        if (!this.systems) {
            console.warn('[MetricsRuntime_v1] No metrics systems provided');
        }
    }

    /**
     * Update all metrics systems
     * Called once per frame in animate loop
     * 
     * @param {number} delta - Frame delta time (seconds)
     */
    update(delta) {
        if (!delta || typeof delta !== 'number') {
            return;  // Defensive: skip invalid delta
        }

        try {
            // Update individual metrics systems in order
            // Each system is called safely with optional chaining
            
            // 1. Node dynamic metrics (runtime behavior tracking)
            if (this.systems.nodeDynamicMetrics?.update) {
                this.systems.nodeDynamicMetrics.update(delta);
            }

            // 2. Link quality calculation (connection quality scoring)
            if (this.systems.linkQualityCalculator?.update) {
                this.systems.linkQualityCalculator.update(delta);
            }

            // 3. Node quality calculation (node quality metrics)
            if (this.systems.nodeQualityCalculator?.update) {
                this.systems.nodeQualityCalculator.update(delta);
            }

            // 4. Visual metric model (metric visualization integration)
            if (this.systems.visualMetricModel?.update) {
                this.systems.visualMetricModel.update(delta);
            }

            // 5. Metrics-driven FX (visual effects based on metrics)
            if (this.systems.safeMetricsFX?.update) {
                this.systems.safeMetricsFX.update(delta);
            }
        } catch (err) {
            // Defensive error handling - log but don't crash
            console.warn('[MetricsRuntime_v1] update error:', err.message);
        }
    }

    /**
     * Dispose and cleanup metrics systems
     * Called during world transitions or shutdown
     */
    dispose() {
        try {
            // Only explicitly dispose safeMetricsFX (others are typically stateless or self-managing)
            if (this.systems.safeMetricsFX?.dispose) {
                this.systems.safeMetricsFX.dispose();
            }
        } catch (err) {
            console.warn('[MetricsRuntime_v1] dispose error:', err.message);
        }

        // Clear references for GC
        this.nodes = null;
        this.links = null;
        this.systems = null;
    }
}
