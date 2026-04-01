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
import { updateNodeMetrics } from './src/metrics/NodeMetricEngine.js';
import { MetricValidationRuntime } from './MetricValidationRuntime.js';

const NETWORK_METRICS_OVERRIDE_KEY = '__ATOMA_NETWORK_METRICS_AGGREGATOR_OVERRIDE__';
const CANONICAL_METRIC_FIELDS = [
    'networkSynergy',
    'harmonyFlow',
    'networkStress',
    'corruptionLevel',
    'loadPressure'
];

const SEMANTIC_DELTA = {
    networkSynergy: 0.05,
    harmonyFlow: 0.05,
    networkStress: 0.05,
    corruptionLevel: 0.05,
    loadPressure: 0.05
};
const NODE_EVENT_COOLDOWN_MS = 2000;
const NODE_METRIC_UPDATED_COOLDOWN_MS = 100; // 10 Hz per node
const LINK_SPREAD_DELTA_MIN = 0.01;

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
        this.externalNetworkMetricsAggregatorControl = Boolean(runtimeOptions.externalNetworkMetricsAggregatorControl);
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
        // Additional publish smoothing to prevent HUD jitter
        this._publishedMetrics = {
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
        this._semanticSignalState = {
            last: {
                networkSynergy: null,
                harmonyFlow: null,
                networkStress: null,
                corruptionLevel: null,
                loadPressure: null
            },
            flags: {
                harmonyPeak: false,
                corruptionSpread: false,
                loadPressureHigh: false
            }
        };

        // Canonical field audit (orphan/stale detection for high-impact node fields)
        this._canonicalFieldAudit = {
            accumulator: 0,
            intervalSec: 5.0,
            staleMs: 4000,
            lastWarnAtByKey: new Map()
        };

        // Runtime validator (low-frequency, warnings only)
        this.metricValidator = new MetricValidationRuntime(runtimeOptions.metricValidation);
        this._validationAccumulator = 0;
        this._validationInterval = 1.0; // seconds (1 Hz)

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

        // Low-frequency validation (1 Hz)
        this._validationAccumulator += dt;
        if (this.metricValidator && this._validationAccumulator >= this._validationInterval) {
            const nodeList = this.nodes?.nodes || this.nodes || [];
            const linkList =
                this.linkSystem?.links ||
                this.links?.links ||
                this.links ||
                [];
            this.metricValidator.validate({ nodes: nodeList, links: linkList });
            this._validationAccumulator -= this._validationInterval;
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

            // 2. Canonical node metrics update (single-writer: NodeMetricEngine)
            updateNodeMetrics(this.nodes, this.linkSystem || this.links, dt);
            this._emitCorruptionSpreadEvents();

            const nodeList = this.nodes?.nodes || this.nodes || [];
            for (const node of nodeList) {
                const m = node?.userData?.metrics;
                if (!m) continue;
                const id = node?.userData?.nodeId || node?.uuid || node?.id || 'unknown-node';
                this._sanitizeMetrics(m, id);
            }
            this._ensureNodeCanonicalFallbacks(nodeList);

            // 2.5. Canonical link corruption/integrity metrics update
            const linkList =
                this.linkSystem?.links ||
                this.links?.links ||
                this.links ||
                [];
            this._canonicalWriteLinkCorruptionMetrics(linkList);

            // 2.6. Canonical network metrics update (fatigue, hubId, activeLinkCount)
            this._canonicalWriteNetworkMetrics(nodeList);

            this._runCanonicalFieldAudit(dt, nodeList);
            this._emitNodeMetricUpdatedEvents(nodeList);

            // 3. Network aggregation (fixed-step)
            // NOTE: networkMetricsAggregator now runs via FrameScheduler.background layer (2Hz)
            // Use this.runNetworkMetricsAggregator() to trigger manually from FrameScheduler
            if (this.useNetworkMetricsAggregator && !this.externalNetworkMetricsAggregatorControl) {
                try {
                    this._runNetworkMetricsAggregator();
                } catch (err) {
                    if (!this._networkAggregatorError) {
                        this._networkAggregatorError = err;
                    }
                    this._logOnce('NetworkMetricsAggregator entered ERROR state', err);
                    this._clearNetworkMetricsOverride();
                }
            } else if (!this.useNetworkMetricsAggregator) {
                this._clearNetworkMetricsOverride();
            }

            // 4. Publish live metrics once per fixed tick
            this._captureSimulationSnapshot(nodeList);
            if (typeof this.onSimulationTick === 'function') {
                this.onSimulationTick(this.lastSimulationSnapshot);
            }
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

    _sanitizeMetrics(metricsObj, nodeId = 'unknown-node') {
        if (!metricsObj) return;
        const keys = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure'];
        for (const key of keys) {
            const val = metricsObj[key];
            const clamped = this._clamp01(val);
            if (!Number.isFinite(val) || val !== clamped) {
                console.warn('Metric drift detected', { nodeId, key, value: val, expectedRange: '0..1' });
            }
        }
    }

    _captureSimulationSnapshot(nodeList) {
        const list = Array.isArray(nodeList) ? nodeList : [];
        this.lastSimulationSnapshot = {
            nodes: list
                .filter(n => n?.userData)
                .map(n => ({
                    id: n.userData.nodeId || n.userData.id || n.id,
                    metrics: { ...(n.userData.metrics) }
                }))
        };
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
        // Run NetworkMetricsAggregator.compute() and store result for publishing
        if (!this.networkMetricsAggregator) {
            console.warn('[MetricsRuntime_v1] NetworkMetricsAggregator not initialized');
            return;
        }
        
        try {
            const result = this.networkMetricsAggregator.compute();
            this._lastNetworkMetricsResult = result;
        } catch (err) {
            console.warn('[MetricsRuntime_v1] NetworkMetricsAggregator.compute() failed:', err.message);
            this._lastNetworkMetricsResult = null;
        }
    }

    /**
     * Public method to run networkMetricsAggregator manually
     * Used by FrameScheduler.background layer for 2Hz execution
     */
    runNetworkMetricsAggregator() {
        if (!this.useNetworkMetricsAggregator) return;
        try {
            this._runNetworkMetricsAggregator();
        } catch (err) {
            if (!this._networkAggregatorError) {
                this._networkAggregatorError = err;
            }
            this._logOnce('NetworkMetricsAggregator entered ERROR state', err);
            this._clearNetworkMetricsOverride();
        }
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

    _canEmitNodeCooldown(node, key, nowMs, cooldownMs = NODE_EVENT_COOLDOWN_MS) {
        if (!node?.userData) return false;
        if (!node.userData.__metricEventCooldowns) {
            node.userData.__metricEventCooldowns = {};
        }
        const last = Number(node.userData.__metricEventCooldowns[key] ?? 0);
        if (nowMs - last < cooldownMs) return false;
        node.userData.__metricEventCooldowns[key] = nowMs;
        return true;
    }

    _emitNodeMetricUpdatedEvents(nodeList) {
        const scope = this._getGlobalScope();
        const semanticBus = scope?.semanticBus;
        if (!semanticBus?.emit) return;
        if (!Array.isArray(nodeList) || nodeList.length === 0) return;

        const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const metricKeys = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure'];

        for (const node of nodeList) {
            const metrics = node?.metrics ?? node?.userData?.metrics;
            if (!metrics || !node?.userData) continue;

            const nodeId = node?.id ?? this._getNodeId(node);
            if (!nodeId) continue;

            const previous = node.userData.__lastMetricNodeUpdatedValues || (node.userData.__lastMetricNodeUpdatedValues = {});
            let changedMetric = null;
            let changedValue = null;
            const synergyValue = this._clamp01(metrics.synergy);

            if (synergyValue > 0.60 && this._canEmitNodeCooldown(node, 'nodeSynergyHigh', nowMs, NODE_METRIC_UPDATED_COOLDOWN_MS)) {
                semanticBus.emit('node.synergy.high', {
                    nodeId,
                    synergy: synergyValue,
                    position: node?.position
                        ? { x: node.position.x, y: node.position.y, z: node.position.z }
                        : undefined
                }, { priority: semanticBus.priority?.INTERACTIVE });
            }

            for (const metric of metricKeys) {
                const value = this._clamp01(metrics[metric]);
                const previousValue = previous[metric];
                if (changedMetric === null && previousValue !== value) {
                    changedMetric = metric;
                    changedValue = value;
                }
                previous[metric] = value;
            }

            if (changedMetric === null) continue;
            if (!this._canEmitNodeCooldown(node, 'metricNodeUpdated', nowMs, NODE_METRIC_UPDATED_COOLDOWN_MS)) continue;

            semanticBus.emit('metric.node.updated', {
                nodeId,
                metric: changedMetric,
                value: changedValue
            }, { priority: semanticBus.priority?.NORMAL });
        }
    }

    _touchCanonicalWrite(userData, fieldKey) {
        if (!userData) return;
        userData.__canonicalWriteAt = userData.__canonicalWriteAt || {};
        userData.__canonicalWriteAt[fieldKey] = Date.now();
    }

    _touchCanonicalWrites(userData, fieldKeys = []) {
        if (!userData || !Array.isArray(fieldKeys)) return;
        for (const fieldKey of fieldKeys) {
            this._touchCanonicalWrite(userData, fieldKey);
        }
    }

    _ensureNodeCanonicalFallbacks(nodeList) {
        if (!Array.isArray(nodeList)) return;

        for (const node of nodeList) {
            if (!node) continue;
            node.userData = node.userData || {};
            const userData = node.userData;
            const metrics = userData.metrics || (userData.metrics = {});
            const harmony = this._clamp01(metrics.harmony ?? userData.harmony ?? userData.harmonyLevel ?? 0);
            const corruption = this._clamp01(metrics.corruption ?? userData.corruption ?? userData.corruptionLevel ?? 0);
            const stability = this._clamp01(metrics.stability ?? (1 - this._clamp01(userData.instability ?? 0)));
            const load = this._clamp01(metrics.loadPressure ?? userData.loadPressure ?? userData.pressure ?? 0);
            const instability = this._clamp01(1 - stability);

            // Canonical harmony/corruption write + legacy mirrors
            metrics.harmony = harmony;
            metrics.corruption = corruption;
            userData.harmony = harmony;
            userData.harmonyLevel = harmony;
            userData.corruption = corruption;
            userData.corruptionLevel = corruption;

            // Harmony stabilization canonical defaults
            if (typeof userData.harmonyStabilized !== 'boolean') {
                userData.harmonyStabilized = false;
            }
            if (!Number.isFinite(userData.harmonyDampingFactor)) {
                userData.harmonyDampingFactor = 0;
            }
            userData.harmonyDampingFactor = this._clamp01(userData.harmonyDampingFactor);

            // Canonical load aliases for legacy readers
            userData.loadPressure = load;
            metrics.loadPressure = load;
            metrics.load = load;
            metrics.loadRatio = load;
            userData.load = load;
            userData.loadRatio = load;
            userData.pressure = load;

            // Keep stability/instability readable from both canonical and legacy paths
            metrics.stability = stability;
            metrics.instability = instability;
            userData.instability = instability;

            this._touchCanonicalWrite(userData, 'harmony');
            this._touchCanonicalWrite(userData, 'harmonyLevel');
            this._touchCanonicalWrite(userData, 'corruption');
            this._touchCanonicalWrite(userData, 'corruptionLevel');
            this._touchCanonicalWrite(userData, 'harmonyStabilized');
            this._touchCanonicalWrite(userData, 'harmonyDampingFactor');
            this._touchCanonicalWrite(userData, 'loadPressure');
            this._touchCanonicalWrite(userData, 'load');
            this._touchCanonicalWrite(userData, 'loadRatio');
            this._touchCanonicalWrite(userData, 'pressure');
            this._touchCanonicalWrite(userData, 'instability');
        }
    }

    /**
     * Canonical writer for link corruption metrics.
     * Integrity is treated as a legacy compatibility alias, not a canonical metric.
     * Single-source write authority lives in MetricsRuntime_v1.
     */
    _canonicalWriteLinkCorruptionMetrics(linkList) {
        if (!Array.isArray(linkList)) return;

        for (const link of linkList) {
            if (!link) continue;
            link.userData = link.userData || {};
            const userData = link.userData;
            const metrics = userData.metrics || {};

            // Read corruption/integrity from LinkCorruptionTransmission if available
            const linkCorruption = link?.group?.userData?.conduitState?.corruptionLevel ??
                metrics?.corruption ??
                userData?.corruptionLevel ??
                0;
            const linkIntegrity = metrics?.integrity ?? userData?.integrity ?? 100;

            // Canonical corruption write + legacy mirrors
            const nextCorruption = Number.isFinite(linkCorruption) ? Math.max(0, Math.min(1, linkCorruption)) : 0;
            userData.metrics = userData.metrics || {};
            userData.metrics.corruption = nextCorruption;
            userData.corruptionLevel = nextCorruption;
            userData.corruption = nextCorruption;

            // Legacy integrity alias only (not part of canonical metric schema)
            const nextIntegrity = Number.isFinite(linkIntegrity) ? Math.max(0, Math.min(100, linkIntegrity)) : 100;
            userData.integrity = nextIntegrity;

            // Update corrupted flag based on corruption level
            const corrupted = nextCorruption >= 0.5;
            userData.corrupted = corrupted;
            if (userData.metrics) {
                userData.metrics.corrupted = corrupted;
            }

            // Particle canonical fallbacks (reader-safe when density adapter is idle)
            const particleIntensity = Number.isFinite(userData.particleIntensity) ? this._clamp01(userData.particleIntensity) : 0;
            const particleUrgency = Number.isFinite(userData.particleUrgency) ? this._clamp01(userData.particleUrgency) : 0;
            userData.particleIntensity = particleIntensity;
            userData.particleUrgency = particleUrgency;
            userData.metrics.particleIntensity = particleIntensity;
            userData.metrics.particleUrgency = particleUrgency;

            this._touchCanonicalWrites(userData, [
                'corruption',
                'integrity',
                'corrupted',
                'particleIntensity',
                'particleUrgency'
            ]);
        }
    }

    /**
     * Canonical writer for network metrics (fatigue, hubId, activeLinkCount).
     * Ensures these metrics are defined and not stale after world switch.
     * Reads from NetworkFatigueSystem if available, otherwise uses defaults.
     */
    _canonicalWriteNetworkMetrics(nodeList) {
        if (!Array.isArray(nodeList)) return;
        const linkList =
            this.linkSystem?.links ||
            this.links?.links ||
            this.links ||
            [];

        const activeLinkCountByNodeId = new Map();
        if (Array.isArray(linkList)) {
            for (const link of linkList) {
                if (!link) continue;
                const sourceId =
                    link.nodeA ??
                    link.sourceNodeId ??
                    this._getNodeId(link.source ?? link.sourceNode ?? link.from);
                const targetId =
                    link.nodeB ??
                    link.targetNodeId ??
                    this._getNodeId(link.target ?? link.targetNode ?? link.to);

                if (sourceId !== undefined && sourceId !== null) {
                    const key = String(sourceId);
                    activeLinkCountByNodeId.set(key, (activeLinkCountByNodeId.get(key) || 0) + 1);
                }
                if (targetId !== undefined && targetId !== null) {
                    const key = String(targetId);
                    activeLinkCountByNodeId.set(key, (activeLinkCountByNodeId.get(key) || 0) + 1);
                }
            }
        }

        for (const node of nodeList) {
            if (!node) continue;
            node.userData = node.userData || {};
            const userData = node.userData;
            const metrics = userData.metrics || (userData.metrics = {});

            // Read fatigue from NetworkFatigueSystem (node.userData.fatigue)
            // If not available, use default 0.0
            const fatigue = typeof userData.fatigue === 'number'
                ? Math.max(0, Math.min(1, userData.fatigue))
                : 0.0;

            // Write to metrics (canonical location)
            metrics.fatigue = fatigue;
            userData.fatigue = fatigue; // Legacy mirror

            // Read networkFatigue if available (aggregate network fatigue)
            // If not available, use node fatigue as fallback
            const networkFatigue = typeof metrics.networkFatigue === 'number'
                ? metrics.networkFatigue
                : fatigue;
            metrics.networkFatigue = networkFatigue;
            userData.networkFatigue = networkFatigue; // Legacy mirror

            // Initialize hub-related fields (used by HarmonicHubAuraSystem)
            if (typeof metrics.clusterMembershipID !== 'number' || metrics.clusterMembershipID === null) {
                metrics.clusterMembershipID = -1; // -1 means not assigned to any cluster
            }
            if (typeof metrics.hubId !== 'number' || metrics.hubId === null) {
                metrics.hubId = -1; // -1 means not a hub
            }
            userData.clusterMembershipID = metrics.clusterMembershipID; // Legacy mirror
            userData.hubId = metrics.hubId; // Legacy mirror

            // Canonical activeLinkCount (recomputed every frame from current active links)
            const nodeId = node?.userData?.nodeId ?? node?.uuid ?? node?.id ?? null;
            const activeLinkCount = nodeId !== null && nodeId !== undefined
                ? (activeLinkCountByNodeId.get(String(nodeId)) || 0)
                : 0;
            metrics.activeLinkCount = activeLinkCount;
            userData.activeLinkCount = metrics.activeLinkCount; // Legacy mirror

            // Initialize loadPressure and pressure (already in _ensureNodeCanonicalFallbacks)
            // But ensure they have defaults if not set
            if (typeof metrics.loadPressure !== 'number') {
                metrics.loadPressure = 0.0;
            }
            if (typeof metrics.pressure !== 'number') {
                metrics.pressure = 0.0;
            }

            this._touchCanonicalWrites(userData, [
                'fatigue',
                'networkFatigue',
                'clusterMembershipID',
                'hubId',
                'activeLinkCount'
            ]);
        }
    }

    _runCanonicalFieldAudit(deltaTime, nodeList) {
        this._canonicalFieldAudit.accumulator += deltaTime;
        if (this._canonicalFieldAudit.accumulator < this._canonicalFieldAudit.intervalSec) {
            return;
        }
        this._canonicalFieldAudit.accumulator = 0;

        if (!Array.isArray(nodeList) || nodeList.length === 0) return;

        const now = Date.now();

        // "Critical + 2nd wave" metrics - node fields
        const nodeFields = [
            // Harmonic node metrics (from HarmonyStabilizationSystem_v1.js)
            'harmonicPhase',
            'harmonicHub',
            'harmonicResilience',
            'harmonicCollapse',
            'harmonicRecovery',
            'isHarmonyAnchor',
            'anchorPulseActive',
            // Halo/pulse metrics (from HarmonyStabilizationSystem_v1.js)
            'haloAmplitude',
            'haloFrequency',
            'pulsePhase',
            'pulseCoherence',
            'pulseStreak',
            // Network metrics (from MetricsRuntime_v1.js)
            'fatigue',
            'networkFatigue',
            'clusterMembershipID',
            'hubId',
            'activeLinkCount',
            // Core metrics (from NodeMetricEngine.js)
            'harmony',
            'harmonyLevel',
            'corruption',
            'corruptionLevel',
            'harmonyStabilized',
            'harmonyDampingFactor',
            'loadPressure',
            'pressure',
            'instability'
        ];

        // "Critical + 2nd wave" metrics - link fields
        const linkFields = [
            // Wave metrics (from LinkRendererConduit.js)
            'waveDirection',
            'waveLength',
            'wavePhaseOffset',
            // Cascade/conflict metrics (from CascadeEventBridge_v1.js)
            'cascadeIntensity',
            'cascadeConflictType',
            'conflictIntensity',
            'synergyCollapse',
            'synergyCascadeTime',
            // Corruption/integrity metrics (from MetricsRuntime_v1.js)
            'corruption',
            'integrity',
            'corrupted'
        ];

        const missingByField = new Map();
        const staleByField = new Map();
        nodeFields.forEach((f) => {
            missingByField.set(f, 0);
            staleByField.set(f, 0);
        });
        linkFields.forEach((f) => {
            missingByField.set(f, 0);
            staleByField.set(f, 0);
        });

        // Audit node metrics
        for (const node of nodeList) {
            const userData = node?.userData;
            if (!userData) {
                nodeFields.forEach((f) => missingByField.set(f, (missingByField.get(f) || 0) + 1));
                continue;
            }

            const writeMap = userData.__canonicalWriteAt || {};
            for (const field of nodeFields) {
                if (userData[field] === undefined) {
                    missingByField.set(field, (missingByField.get(field) || 0) + 1);
                    continue;
                }
                const lastWriteAt = Number(writeMap[field] || 0);
                if (lastWriteAt <= 0 || now - lastWriteAt > this._canonicalFieldAudit.staleMs) {
                    staleByField.set(field, (staleByField.get(field) || 0) + 1);
                }
            }
        }

        // Audit link metrics
        const linkList =
            this.linkSystem?.links ||
            this.links?.links ||
            this.links ||
            [];
        for (const link of linkList) {
            if (!link) continue;
            const userData = link?.userData;
            if (!userData) {
                linkFields.forEach((f) => missingByField.set(f, (missingByField.get(f) || 0) + 1));
                continue;
            }

            const writeMap = userData.__canonicalWriteAt || {};
            for (const field of linkFields) {
                if (userData[field] === undefined) {
                    missingByField.set(field, (missingByField.get(field) || 0) + 1);
                    continue;
                }
                const lastWriteAt = Number(writeMap[field] || 0);
                if (lastWriteAt <= 0 || now - lastWriteAt > this._canonicalFieldAudit.staleMs) {
                    staleByField.set(field, (staleByField.get(field) || 0) + 1);
                }
            }
        }

        // Report warnings for node metrics
        for (const field of nodeFields) {
            const missing = missingByField.get(field) || 0;
            const stale = staleByField.get(field) || 0;
            if (missing <= 0 && stale <= 0) continue;

            const key = `${field}:${missing}:${stale}`;
            const lastWarnAt = this._canonicalFieldAudit.lastWarnAtByKey.get(key) || 0;
            if (now - lastWarnAt < this._canonicalFieldAudit.staleMs) continue;
            this._canonicalFieldAudit.lastWarnAtByKey.set(key, now);

            console.warn('[MetricsRuntime_v1] Canonical node field audit warning', {
                field,
                type: 'node',
                missingNodes: missing,
                staleNodes: stale,
                totalNodes: nodeList.length
            });
        }

        // Report warnings for link metrics
        for (const field of linkFields) {
            const missing = missingByField.get(field) || 0;
            const stale = staleByField.get(field) || 0;
            if (missing <= 0 && stale <= 0) continue;

            const key = `${field}:${missing}:${stale}`;
            const lastWarnAt = this._canonicalFieldAudit.lastWarnAtByKey.get(key) || 0;
            if (now - lastWarnAt < this._canonicalFieldAudit.staleMs) continue;
            this._canonicalFieldAudit.lastWarnAtByKey.set(key, now);

            console.warn('[MetricsRuntime_v1] Canonical link field audit warning', {
                field,
                type: 'link',
                missingLinks: missing,
                staleLinks: stale,
                totalLinks: linkList.length
            });
        }
    }

    _emitCorruptionSpreadEvents() {
        const scope = this._getGlobalScope();
        const semanticBus = scope?.semanticBus;
        if (!semanticBus?.emit) return;

        const linksList =
            this.linkSystem?.links ||
            this.links?.links ||
            this.links ||
            [];
        if (!Array.isArray(linksList) || linksList.length === 0) return;

        const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());

        for (const link of linksList) {
            if (!link) continue;
            const linkData = link.userData || (link.userData = {});
            const current = this._clamp01(linkData.corruptionLevel);
            const prev = Number.isFinite(linkData.__lastCorruptionSpreadLevel)
                ? this._clamp01(linkData.__lastCorruptionSpreadLevel)
                : null;
            linkData.__lastCorruptionSpreadLevel = current;
            if (prev === null) continue;

            const delta = current - prev;
            if (delta < LINK_SPREAD_DELTA_MIN) continue;

            const sourceNode = link.source || link.nodeA;
            const targetNode = link.target || link.nodeB;
            if (!sourceNode || !targetNode) continue;

            const sourceCorruption = this._clamp01(sourceNode?.userData?.metrics?.corruption ?? 0);
            const targetCorruption = this._clamp01(targetNode?.userData?.metrics?.corruption ?? 0);
            const fromNode = sourceCorruption >= targetCorruption ? sourceNode : targetNode;
            const toNode = fromNode === sourceNode ? targetNode : sourceNode;

            if (!this._canEmitNodeCooldown(fromNode, 'corruptionSpread', nowMs)) continue;

            semanticBus.emit('metric.corruption.spread', {
                source: fromNode?.id ?? this._getNodeId(fromNode),
                target: toNode?.id ?? this._getNodeId(toNode),
                amount: delta
            }, { priority: semanticBus.priority?.NORMAL });
        }
    }

    _emitCanonicalSemanticMetrics(metricsPayload, context = {}) {
        const scope = this._getGlobalScope();
        const semanticBus = scope?.semanticBus;
        if (!semanticBus?.emit) return;

        const now = performance.now();
        const current = {
            networkSynergy: this._clamp01(metricsPayload.networkSynergy),
            harmonyFlow: this._clamp01(metricsPayload.harmonyFlow),
            networkStress: this._clamp01(metricsPayload.networkStress),
            corruptionLevel: this._clamp01(metricsPayload.corruptionLevel),
            loadPressure: this._clamp01(metricsPayload.loadPressure)
        };
        const last = this._semanticSignalState.last;
        const flags = this._semanticSignalState.flags;

        const nodeCount = context.nodeCount ?? 0;
        const linkCount = context.linkCount ?? 0;
        const emit = (eventName, value, delta, extra = {}, priority = semanticBus.priority?.NORMAL) => {
            semanticBus.emit(eventName, {
                value,
                delta,
                nodeCount,
                linkCount,
                timestamp: now,
                ...extra
            }, { priority });
        };

        const prevSynergy = last.networkSynergy;
        const prevHarmony = last.harmonyFlow;
        const prevStress = last.networkStress;
        const prevCorruption = last.corruptionLevel;
        const prevLoad = last.loadPressure;

        if (prevSynergy !== null) {
            const delta = current.networkSynergy - prevSynergy;
            if (delta >= SEMANTIC_DELTA.networkSynergy) {
                emit('metric:synergySpike', current.networkSynergy, delta, { metric: 'synergy' });
            }
        }

        if (!flags.harmonyPeak && current.harmonyFlow >= 0.85) {
            emit('metric:harmonyPeak', current.harmonyFlow, prevHarmony === null ? 0 : current.harmonyFlow - prevHarmony, { metric: 'harmony' });
            flags.harmonyPeak = true;
        } else if (flags.harmonyPeak && current.harmonyFlow <= 0.78) {
            flags.harmonyPeak = false;
        }

        if (prevStress !== null) {
            const prevStability = 1 - prevStress;
            const stability = 1 - current.networkStress;
            const stabilityDrop = prevStability - stability;
            if (stabilityDrop >= SEMANTIC_DELTA.networkStress) {
                emit('metric:stabilityDrop', stability, -stabilityDrop, { metric: 'stability' });
            }
        }

        if (prevCorruption !== null) {
            const delta = current.corruptionLevel - prevCorruption;
            if (delta >= SEMANTIC_DELTA.corruptionLevel) {
                emit('metric:corruptionRise', current.corruptionLevel, delta, { metric: 'corruption' });
            }
        }

        if (!flags.loadPressureHigh && current.loadPressure >= 0.75) {
            emit('metric:loadPressureHigh', current.loadPressure, prevLoad === null ? 0 : current.loadPressure - prevLoad, { metric: 'loadPressure' });
            flags.loadPressureHigh = true;
        } else if (flags.loadPressureHigh && current.loadPressure <= 0.65) {
            flags.loadPressureHigh = false;
        }

        if (prevStress !== null) {
            const stressDelta = current.networkStress - prevStress;
            if (stressDelta >= SEMANTIC_DELTA.networkStress) {
                emit('network:stressRise', current.networkStress, stressDelta, { metric: 'networkStress' }, semanticBus.priority?.INTERACTIVE);
            }

            const prevStability = 1 - prevStress;
            const stability = 1 - current.networkStress;
            const stabilityDrop = prevStability - stability;
            if (stabilityDrop >= SEMANTIC_DELTA.networkStress) {
                emit('network:stabilityDrop', stability, -stabilityDrop, { metric: 'networkStability' }, semanticBus.priority?.INTERACTIVE);
            }
        }

        if (prevCorruption !== null) {
            const corruptionDelta = current.corruptionLevel - prevCorruption;
            const crossedCorruption = prevCorruption < 0.6 && current.corruptionLevel >= 0.6;
            if (corruptionDelta >= SEMANTIC_DELTA.corruptionLevel || crossedCorruption) {
                emit('network:corruptionSpread', current.corruptionLevel, corruptionDelta, { metric: 'corruptionLevel' }, semanticBus.priority?.INTERACTIVE);
            }
        }

        if (prevHarmony !== null) {
            const harmonyDelta = current.harmonyFlow - prevHarmony;
            if (Math.abs(harmonyDelta) >= SEMANTIC_DELTA.harmonyFlow) {
                emit('network:harmonyShift', current.harmonyFlow, harmonyDelta, { metric: 'harmonyFlow' }, semanticBus.priority?.INTERACTIVE);
            }
        }

        this._emitGameplayTriggers(current, context);
        this._semanticSignalState.last = current;
    }

    _emitGameplayTriggers(metricsPayload, context = {}) {
        const semanticBus = globalThis?.semanticBus;
        if (!semanticBus?.emit) return;

        const current = {
            networkSynergy: this._clamp01(metricsPayload?.networkSynergy),
            harmonyFlow: this._clamp01(metricsPayload?.harmonyFlow),
            networkStress: this._clamp01(metricsPayload?.networkStress),
            corruptionLevel: this._clamp01(metricsPayload?.corruptionLevel),
            loadPressure: this._clamp01(metricsPayload?.loadPressure)
        };
        const last = this._semanticSignalState?.last || {};

        if (current.networkSynergy >= 0.82 && (last.networkSynergy ?? 0) < 0.82) {
            semanticBus.emit('event:synergyCascade', {
                value: current.networkSynergy
            });
        }

        if (current.harmonyFlow >= 0.85 && (last.harmonyFlow ?? 0) < 0.85) {
            semanticBus.emit('event:harmonyResonance', {
                value: current.harmonyFlow
            });
        }

        if (current.corruptionLevel >= 0.6 && (last.corruptionLevel ?? 0) < 0.6) {
            semanticBus.emit('event:corruptionOutbreak', {
                value: current.corruptionLevel
            });
        }

        const loadCollapseNow = current.loadPressure >= 0.8 && current.networkStress >= 0.6;
        const loadCollapseBefore = (last.loadPressure ?? 0) >= 0.8 && (last.networkStress ?? 0) >= 0.6;
        if (loadCollapseNow && !loadCollapseBefore) {
            semanticBus.emit('event:loadCollapse', {
                load: current.loadPressure,
                stress: current.networkStress
            });
        }

        if (current.networkStress >= 0.75 && (last.networkStress ?? 0) < 0.75) {
            semanticBus.emit('event:instabilityTrap', {
                value: current.networkStress
            });
        }
    }

    /**
     * Publish canonical live metrics to global scope
     * Priority: NetworkMetricsAggregator override → Node aggregation fallback
     * This is the canonical source of truth for HUD and other consumers
     * Always publishes, even when metrics are 0, to ensure object shape stability
     */
    _publishLiveMetrics() {
        const scope = this._getGlobalScope();
        if (!scope) return;

        // Use NetworkMetricsAggregator result if available, otherwise use node aggregation
        let result;
        
        if (this._lastNetworkMetricsResult) {
            result = this._lastNetworkMetricsResult;
        } else {
            // Fallback: aggregate from nodes
            result = this._aggregateNodeMetrics();
        }

        this._safePublishLiveMetrics({
            networkSynergy: this._clamp01(result.networkSynergy ?? result.synergy ?? 0),
            harmonyFlow: this._clamp01(result.harmonyFlow ?? result.harmony ?? 0),
            networkStress: this._clamp01(result.networkStress ?? (1 - (result.stability ?? 0))),
            corruptionLevel: this._clamp01(result.corruptionLevel ?? result.corruption ?? 0),
            loadPressure: this._clamp01(result.loadPressure ?? result.load ?? result.pressure ?? 0),
            nodeCount: Number.isFinite(result.nodeCount) ? result.nodeCount : 0,
            linkCount: Number.isFinite(result.linkCount) ? result.linkCount : this._countLinks()
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
            nodeCount: 0,
            linkCount: 0
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

        // Mirror into world.metrics.global for canonical consumers
        scope.world = scope.world || {};
        scope.world.metrics = scope.world.metrics || {};
        scope.world.metrics.global = {
            networkSynergy: scope.__ATOMA_LIVE_METRICS__.networkSynergy,
            harmonyFlow: scope.__ATOMA_LIVE_METRICS__.harmonyFlow,
            networkStress: scope.__ATOMA_LIVE_METRICS__.networkStress,
            corruptionLevel: scope.__ATOMA_LIVE_METRICS__.corruptionLevel,
            loadPressure: scope.__ATOMA_LIVE_METRICS__.loadPressure,
            nodeCount: scope.__ATOMA_LIVE_METRICS__.nodeCount,
            linkCount: scope.__ATOMA_LIVE_METRICS__.linkCount,
        };
    }

    /**
     * Aggregate metrics from all nodes' userData.metrics
     * Returns average of each metric across all nodes
     */
    _aggregateNodeMetrics() {
        const nodesList = Array.isArray(this.nodes?.nodes) ? this.nodes.nodes : [];
        const nodeCount = nodesList.length;

        const readNodeMetric = (node, canonicalKey, fallbackKeys = []) => {
            const userData = node?.userData || {};
            const metrics = userData.metrics || {};

            const candidates = [
                userData[canonicalKey],
                metrics[canonicalKey]
            ];

            for (const fallbackKey of fallbackKeys) {
                candidates.push(userData[fallbackKey], metrics[fallbackKey]);
            }

            for (const value of candidates) {
                if (Number.isFinite(value)) return value;
            }

            return undefined;
        };
        
        // Initialize accumulators
        let sumSynergy = 0;
        let sumHarmony = 0;
        let sumStress = 0;
        let sumCorruption = 0;
        let sumLoadPressure = 0;
        let validNodeCount = 0;

        for (const node of nodesList) {
            const synergy = readNodeMetric(node, 'synergy', ['synergyLevel']);
            const harmony = readNodeMetric(node, 'harmony', ['harmonyLevel']);
            const stability = readNodeMetric(node, 'stability', ['stabilityLevel']);
            const instability = readNodeMetric(node, 'instability', ['instabilityLevel']);
            const corruption = readNodeMetric(node, 'corruption', ['corruptionLevel']);
            const loadPressure = readNodeMetric(node, 'loadPressure', ['load', 'loadRatio', 'pressure']);

            const resolvedStress = Number.isFinite(stability)
                ? 1 - stability
                : (Number.isFinite(instability) ? instability : undefined);

            if (
                synergy === undefined &&
                harmony === undefined &&
                resolvedStress === undefined &&
                corruption === undefined &&
                loadPressure === undefined
            ) {
                continue;
            }

            sumSynergy += this._clamp01(synergy ?? 0);
            sumHarmony += this._clamp01(harmony ?? 0);
            sumStress += this._clamp01(resolvedStress ?? 0);
            sumCorruption += this._clamp01(corruption ?? 0);
            sumLoadPressure += this._clamp01(loadPressure ?? 0);
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
            stability: 1 - avgStress,
            corruptionLevel: avgCorruption,
            loadPressure: avgLoadPressure,
            nodeCount
        };
    }

    /**
     * Aggregate link synergy from canonical link.userData.synergy.score
     */
    _aggregateLinkSynergy() {
        const linksList = Array.isArray(this.links) ? this.links : (this.linkSystem?.links || []);
        let sumSynergy = 0;
        let linkCount = 0;

        for (const link of linksList) {
            const score = link?.userData?.synergy?.score;
            if (!Number.isFinite(score)) continue;
            sumSynergy += this._clamp01(score);
            linkCount++;
        }

        const avgSynergy = linkCount > 0 ? sumSynergy / linkCount : 0;
        return { avgSynergy, linkCount };
    }

    /**
     * Clamp value to [0, 1] for safe metric handling
     */
    _clamp01(value) {
        const num = Number.isFinite(value) ? value : 0;
        return Math.max(0, Math.min(1, num));
    }

    _countLinks() {
        // Prefer direct link system if available
        if (Array.isArray(this.linkSystem?.links)) {
            return this.linkSystem.links.length;
        }
        if (Array.isArray(this.networkResolver?.linkSystem?.links)) {
            return this.networkResolver.linkSystem.links.length;
        }
        // Fallback: count unique links via getLinksForNode
        const getLinksForNode = this.networkResolver?.linkSystem?.getLinksForNode;
        const nodeMap = this.networkResolver?.nodeMap;
        if (typeof getLinksForNode === 'function' && nodeMap instanceof Map) {
            const seen = new Set();
            for (const nodeId of nodeMap.keys()) {
                const links = getLinksForNode(nodeId) || [];
                for (const l of links) {
                    const id = l?.id || `${l?.nodeA ?? l?.source ?? 'a'}-${l?.nodeB ?? l?.target ?? 'b'}`;
                    if (id) seen.add(id);
                }
            }
            return seen.size;
        }
        return 0;
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
