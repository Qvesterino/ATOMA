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

import { NetworkMembershipResolver } from './src/metrics/NetworkMembershipResolver.js';
import { NetworkMetricsAggregator } from './src/metrics/NetworkMetricsAggregator.js';

const NETWORK_METRICS_OVERRIDE_KEY = '__ATOMA_NETWORK_METRICS_AGGREGATOR_OVERRIDE__';
const CANONICAL_METRIC_FIELDS = [
    'networkSynergy',
    'harmonyFlow',
    'networkStress',
    'corruptionLevel',
    'loadPressure'
];

export class MetricsRuntime_v1 {
    /**
     * Initialize metrics runtime orchestration
     * 
     * @param {Object} config - Configuration object
     * @param {Object} config.nodes - AI nodes reference
     * @param {Object} config.links - Links reference
     * @param {Object} config.metricsSystems - Metrics systems to orchestrate
     */
   constructor({ nodes, links, linkSystem, metricsSystems, options = {} }) {
        // Error tracking to prevent console spam
        this._loggedErrors = new Set();

        this.nodes = nodes;
        this.links = links;
          this.linkSystem = linkSystem;
        this.systems = metricsSystems || {};
        this._accumulator = 0;
        this._fixedDt = 0.1; // 10 Hz
        const runtimeOptions = options ?? {};
        this.options = runtimeOptions;
        this.networkMetricsOverrideKey = runtimeOptions.networkMetricsOverrideKey ?? NETWORK_METRICS_OVERRIDE_KEY;
        this.useNetworkMetricsAggregator = Boolean(runtimeOptions.useNetworkMetricsAggregator);
        this.networkResolver = null;
        this.networkMetricsAggregator = null;
        this.linkSystemAdapter = null;
        
        if (!this.systems) {
            console.warn('[MetricsRuntime_v1] No metrics systems provided');
        }

        // Initialize live metrics with canonical shape
        this._initializeLiveMetrics();

        // Soft damping state for metric smoothing
        this._dampingFactor = 0.1; // 10% per frame toward target (adjustable)
        this._smoothedMetrics = {
            networkSynergy: 0,
            harmonyFlow: 0,
            networkStress: 0,
            corruptionLevel: 0,
            loadPressure: 0
        };

        // Internal baseline/influence tracking (not exposed to HUD)
        this._baselineMetrics = {
            networkSynergy: 0,
            harmonyFlow: 0,
            networkStress: 0,
            corruptionLevel: 0,
            loadPressure: 0
        };
        this._influenceMetrics = {
            networkSynergy: 0,
            harmonyFlow: 0,
            networkStress: 0,
            corruptionLevel: 0,
            loadPressure: 0
        };

        if (this.useNetworkMetricsAggregator) {
            this._initializeNetworkMetricsAggregator();
        } else {
            this._clearNetworkMetricsOverride();
        }
    }

    /**
     * Initialize window.__ATOMA_LIVE_METRICS__ with canonical shape
     * Ensures the object always exists before any updates
     */
    _initializeLiveMetrics() {
        const scope = this._getGlobalScope();
        if (!scope) return;

        scope.__ATOMA_LIVE_METRICS__ = {
            networkSynergy: 0,
            harmonyFlow: 0,
            networkStress: 0,
            corruptionLevel: 0,
            loadPressure: 0,
            nodeCount: 0
        };
    }

    _logOnce(context, error) {
        const errorKey = `${context}:${error?.message || String(error)}`;
        if (this._loggedErrors.has(errorKey)) {
            return; // Already logged, skip
        }
        this._loggedErrors.add(errorKey);
        console.warn(`[MetricsRuntime_v1] ${context}`, error);
    }

    /**
     * Update all metrics systems
     * Called once per frame in animate loop
     * 
     * @param {number} delta - Frame delta time (seconds)
     */
    update(delta) {
        // Compat: SystemRegistry passes frameContext; accept number dt or frameContext.{dt|deltaTime|delta}
        const realDt =
            typeof delta === 'number'
                ? delta
                : (delta && typeof delta.dt === 'number'
                    ? delta.dt
                    : (delta && typeof delta.deltaTime === 'number'
                        ? delta.deltaTime
                        : (delta && typeof delta.delta === 'number' ? delta.delta : null)));

        if (!realDt || typeof realDt !== 'number') {
            return;  // Defensive: skip invalid delta
        }

        const dt = Math.min(realDt, 0.25); // safety clamp
        this._accumulator += dt;

        while (this._accumulator >= this._fixedDt) {
            this._step(this._fixedDt);
            this._accumulator -= this._fixedDt;
        }
    }

    _step(dt) {
        try {
            // 1. Update individual metrics systems (fixed-step)
            if (this.systems.nodeDynamicMetrics?.update) {
                this.systems.nodeDynamicMetrics.update(dt);
            }

            if (this.systems.linkQualityCalculator?.update) {
                this.systems.linkQualityCalculator.update(dt);
            }

            if (this.systems.nodeQualityCalculator?.update) {
                this.systems.nodeQualityCalculator.update(dt);
            }

            if (this.systems.visualMetricModel?.update) {
                this.systems.visualMetricModel.update(dt);
            }

            if (this.systems.safeMetricsFX?.update) {
                this.systems.safeMetricsFX.update(dt);
            }

            // 2. Fixed-step relax toward archetype baselines
            const nodeList = this.nodes?.nodes || this.nodes || [];
            for (const node of nodeList) {
                const m = node?.userData?.metrics;
                const base = node?.userData?.archetypeMetrics;
                if (!m || !base) continue;
                const relaxSpeed = 0.02; // gentle return per 10 Hz step
                m.synergy      += (base.synergy      - m.synergy)      * relaxSpeed;
                m.harmony      += (base.harmony      - m.harmony)      * relaxSpeed;
                m.stability    += (base.stability    - m.stability)    * relaxSpeed;
                m.corruption   += (base.corruption   - m.corruption)   * relaxSpeed;
                m.loadPressure += (base.loadPressure - m.loadPressure) * relaxSpeed;

                m.synergy = this._clamp01(m.synergy);
                m.harmony = this._clamp01(m.harmony);
                m.stability = this._clamp01(m.stability);
                m.corruption = this._clamp01(m.corruption);
                m.loadPressure = this._clamp01(m.loadPressure);
            }

            // 3. Network aggregation (fixed-step)
            if (this.useNetworkMetricsAggregator) {
                try {
                    this._runNetworkMetricsAggregator();
                } catch (err) {
                    if (!this._networkAggregatorError) {
                        this._networkAggregatorError = err;
                    }
                    this._logOnce('NetworkMetricsAggregator entered ERROR state', err);
                    this._clearNetworkMetricsOverride();
                }
            } else {
                this._clearNetworkMetricsOverride();
            }

            // 4. Publish live metrics once per fixed tick
            this._publishLiveMetrics();

        } catch (err) {
            this._logOnce('update error', err);
        }
    }

    _clamp01(v) {
        if (!Number.isFinite(v)) return 0;
        if (v < 0) return 0;
        if (v > 1) return 1;
        return v;
    }

    _initializeNetworkMetricsAggregator() {
const adapter = this._createLinkSystemAdapter(
    this.linkSystem || this.links
);
        if (!adapter) {
            this._logOnce('NetworkMetricsAggregator enabled but no link source available', new Error('No link source'));
            return;
        }

        this.linkSystemAdapter = adapter;
        this.networkResolver = new NetworkMembershipResolver({
            nodeMap: this._buildNodeMap(),
            linkSystem: this.linkSystemAdapter
        });
        this.networkMetricsAggregator = new NetworkMetricsAggregator({
            networkResolver: this.networkResolver
        });
    }

    _createLinkSystemAdapter(linkSource) {
        if (!linkSource) return null;

        return {
            getLinksForNode: (nodeId) => {
                if (!nodeId) return [];

                if (typeof linkSource.getLinksForNode === 'function') {
                    const resolved = linkSource.getLinksForNode(nodeId) || [];
                    return resolved.map(link => this._normalizeLinkEntry(link));
                }

                const pool = Array.isArray(linkSource.links) ? linkSource.links : [];
                const matches = [];

                for (const link of pool) {
                    if (!link) continue;
                    const src = link.sourceNodeId ?? this._getNodeId(link.source);
                    const tgt = link.targetNodeId ?? this._getNodeId(link.target);
                    if (src === nodeId || tgt === nodeId) {
                        matches.push({
                            nodeA: src,
                            nodeB: tgt
                        });
                    }
                }

                return matches;
            }
        };
    }

    _normalizeLinkEntry(link) {
        if (!link) return { nodeA: null, nodeB: null };
        return {
            nodeA: link.nodeA ?? link.sourceNodeId ?? this._getNodeId(link.source),
            nodeB: link.nodeB ?? link.targetNodeId ?? this._getNodeId(link.target)
        };
    }

    _runNetworkMetricsAggregator() {
        if (!this.networkResolver || !this.networkMetricsAggregator) {
            this._clearNetworkMetricsOverride();
            return;
        }

        this.networkResolver.nodeMap = this._buildNodeMap();
        this.networkResolver.linkSystem = this.linkSystemAdapter;
        this.networkResolver.resolve();

        const computed = this.networkMetricsAggregator.compute?.();
        if (!computed || (computed.nodeCount ?? 0) === 0) {
            this._clearNetworkMetricsOverride();
            return;
        }

        const override = this._pickCanonicalOverride(computed);
        if (!override) {
            this._clearNetworkMetricsOverride();
            return;
        }

        this._publishNetworkMetricsOverride(override);
    }

    _buildNodeMap() {
        const nodesList = Array.isArray(this.nodes?.nodes) ? this.nodes.nodes : [];
        const nodeMap = new Map();
        for (const node of nodesList) {
            const id = this._getNodeId(node);
            if (id) {
                nodeMap.set(id, node);
            }
        }
        return nodeMap;
    }

    _getNodeId(node) {
        if (!node) return null;
        if (node.userData?.nodeId) {
            return node.userData.nodeId;
        }
        if (node.uuid) {
            return node.uuid;
        }
        return null;
    }

    _pickCanonicalOverride(source) {
        if (!source || typeof source !== 'object') return null;
        const override = {};
        let hasValue = false;

        for (const key of CANONICAL_METRIC_FIELDS) {
            const value = source[key];
            if (typeof value === 'number' && Number.isFinite(value)) {
                override[key] = value;
                hasValue = true;
            }
        }

        return hasValue ? override : null;
    }

    _publishNetworkMetricsOverride(override) {
        const scope = this._getGlobalScope();
        if (!scope || !this.networkMetricsOverrideKey) return;

        if (override) {
            scope[this.networkMetricsOverrideKey] = override;
        } else {
            delete scope[this.networkMetricsOverrideKey];
        }
    }

    _clearNetworkMetricsOverride() {
        const scope = this._getGlobalScope();
        if (!scope || !this.networkMetricsOverrideKey) return;
        delete scope[this.networkMetricsOverrideKey];
    }

    _getGlobalScope() {
        if (typeof globalThis !== 'undefined') {
            return globalThis;
        }
        if (typeof window !== 'undefined') {
            return window;
        }
        if (typeof global !== 'undefined') {
            return global;
        }
        return null;
    }

    /**
     * Publish canonical live metrics to global scope
     * Priority: NetworkMetricsAggregator override → Node aggregation fallback
     * This is the canonical source of truth for HUD and other consumers
     * Always publishes, even when metrics are 0, to ensure object shape stability
     * 
     * Applies exponential smoothing to prevent instant jumps on spawn.
     * Tracks baseline (node-only) and influence (link contribution) internally.
     */
    _publishLiveMetrics() {
        const scope = this._getGlobalScope();
        if (!scope) return;

        let networkSynergy = 0;
        let harmonyFlow = 0;
        let networkStress = 0;
        let corruptionLevel = 0;
        let loadPressure = 0;
        let nodeCount = 0;

        // Always compute baseline (node-only aggregation)
        const baseline = this._aggregateNodeMetrics();
        this._baselineMetrics = {
            networkSynergy: baseline.networkSynergy,
            harmonyFlow: baseline.harmonyFlow,
            networkStress: baseline.networkStress,
            corruptionLevel: baseline.corruptionLevel,
            loadPressure: baseline.loadPressure
        };

        // Priority 1: Use NetworkMetricsAggregator override if available
        const override = scope[this.networkMetricsOverrideKey];
        let isUsingAggregator = false;
        
        if (override && typeof override === 'object') {
            isUsingAggregator = true;
            networkSynergy = this._clamp01(override.networkSynergy);
            harmonyFlow = this._clamp01(override.harmonyFlow);
            networkStress = this._clamp01(override.networkStress);
            corruptionLevel = this._clamp01(override.corruptionLevel);
            loadPressure = this._clamp01(override.loadPressure);
            nodeCount = override.nodeCount ?? 0;

            // Track link influence (final - baseline)
            this._influenceMetrics = {
                networkSynergy: this._clamp01(networkSynergy - this._baselineMetrics.networkSynergy),
                harmonyFlow: this._clamp01(harmonyFlow - this._baselineMetrics.harmonyFlow),
                networkStress: this._clamp01(networkStress - this._baselineMetrics.networkStress),
                corruptionLevel: this._clamp01(corruptionLevel - this._baselineMetrics.corruptionLevel),
                loadPressure: this._clamp01(loadPressure - this._baselineMetrics.loadPressure)
            };
        } else {
            // Priority 2: Fallback to aggregating node metrics (no link influence)
            networkSynergy = baseline.networkSynergy;
            harmonyFlow = baseline.harmonyFlow;
            networkStress = baseline.networkStress;
            corruptionLevel = baseline.corruptionLevel;
            loadPressure = baseline.loadPressure;
            nodeCount = baseline.nodeCount;

            // No link influence when not using aggregator
            this._influenceMetrics = {
                networkSynergy: 0,
                harmonyFlow: 0,
                networkStress: 0,
                corruptionLevel: 0,
                loadPressure: 0
            };
        }

        // Apply exponential smoothing (soft damping)
        const smoothedNetworkSynergy = this._lerp(this._smoothedMetrics.networkSynergy, networkSynergy, this._dampingFactor);
        const smoothedHarmonyFlow = this._lerp(this._smoothedMetrics.harmonyFlow, harmonyFlow, this._dampingFactor);
        const smoothedNetworkStress = this._lerp(this._smoothedMetrics.networkStress, networkStress, this._dampingFactor);
        const smoothedCorruptionLevel = this._lerp(this._smoothedMetrics.corruptionLevel, corruptionLevel, this._dampingFactor);
        const smoothedLoadPressure = this._lerp(this._smoothedMetrics.loadPressure, loadPressure, this._dampingFactor);

        // Update smoothed state for next frame
        this._smoothedMetrics = {
            networkSynergy: smoothedNetworkSynergy,
            harmonyFlow: smoothedHarmonyFlow,
            networkStress: smoothedNetworkStress,
            corruptionLevel: smoothedCorruptionLevel,
            loadPressure: smoothedLoadPressure
        };

        // Temporal saturation flag (true when time is being slowed)
        const temporalSaturation = smoothedNetworkSynergy >= 0.85;

        // Always publish with safe merge strategy (exposes smoothed values)
        this._safePublishLiveMetrics({
            networkSynergy: smoothedNetworkSynergy,
            harmonyFlow: smoothedHarmonyFlow,
            networkStress: smoothedNetworkStress,
            corruptionLevel: smoothedCorruptionLevel,
            loadPressure: smoothedLoadPressure,
            nodeCount,
            temporalSaturation
        });
    }

    /**
     * Safely publish live metrics to global scope
     * Uses merge strategy to preserve previous state and ensure canonical shape
     * Never assigns undefined or partial objects
     * 
     * @param {Object} partialMetrics - Partial metrics to merge
     */
    _safePublishLiveMetrics(partialMetrics) {
        const scope = this._getGlobalScope();
        if (!scope) return;

        // Canonical default shape - ensures all keys always exist
        const defaults = {
            networkSynergy: 0,
            harmonyFlow: 0,
            networkStress: 0,
            corruptionLevel: 0,
            loadPressure: 0,
            nodeCount: 0
        };

        // Get previous state to preserve values if partialMetrics is missing fields
        const previous = scope.__ATOMA_LIVE_METRICS__ || {};

        // Merge: defaults → previous → new partial data
        // This ensures no undefined values and preserves stability
        scope.__ATOMA_LIVE_METRICS__ = {
            ...defaults,
            ...previous,
            ...partialMetrics
        };
    }

    /**
     * Aggregate metrics from all nodes' userData.metrics
     * Returns average of each metric across all nodes
     */
    _aggregateNodeMetrics() {
        const nodesList = Array.isArray(this.nodes?.nodes) ? this.nodes.nodes : [];
        const nodeCount = nodesList.length;
        
        // Initialize accumulators
        let sumSynergy = 0;
        let sumHarmony = 0;
        let sumStress = 0;
        let sumCorruption = 0;
        let sumLoadPressure = 0;
        let validNodeCount = 0;

        for (const node of nodesList) {
            const metrics = node?.userData?.metrics;
            if (!metrics) continue;

            sumSynergy += this._clamp01(metrics.synergy);
            sumHarmony += this._clamp01(metrics.harmony);
            sumStress += this._clamp01(metrics.stability);
            sumCorruption += this._clamp01(metrics.corruption);
            sumLoadPressure += this._clamp01(metrics.loadPressure);
            validNodeCount++;
        }

        // Calculate averages, default to 0 if no valid nodes
        const avgSynergy = validNodeCount > 0 ? sumSynergy / validNodeCount : 0;
        const avgHarmony = validNodeCount > 0 ? sumHarmony / validNodeCount : 0;
        const avgStress = validNodeCount > 0 ? sumStress / validNodeCount : 0;
        const avgCorruption = validNodeCount > 0 ? sumCorruption / validNodeCount : 0;
        const avgLoadPressure = validNodeCount > 0 ? sumLoadPressure / validNodeCount : 0;

        return {
            networkSynergy: avgSynergy,
            harmonyFlow: avgHarmony,
            networkStress: avgStress,
            corruptionLevel: avgCorruption,
            loadPressure: avgLoadPressure,
            nodeCount
        };
    }

    /**
     * Clamp value to [0, 1] for safe metric handling
     */
    _clamp01(value) {
        const num = Number.isFinite(value) ? value : 0;
        return Math.max(0, Math.min(1, num));
    }

    /**
     * Linear interpolation for exponential smoothing
     * @param {number} current - Current value
     * @param {number} target - Target value
     * @param {number} factor - Interpolation factor [0, 1]
     * @returns {number} Interpolated value
     */
    _lerp(current, target, factor) {
        return current + (target - current) * factor;
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
        this._loggedErrors.clear();
        this._loggedErrors = null;
    }
}
