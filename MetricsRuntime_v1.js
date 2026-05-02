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
import { buildScopedMetricEventName, classifyMetricTier, getDefaultMetricThresholds, normalizeMetricTier } from './src/metrics/MetricTierClassifier.js';
import { updateNodeMetrics, ensureMetrics } from './src/metrics/NodeMetricEngine.js';
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
        // Debug guard (Priority 4 fix)
        this.debug = false;

        this._loggedErrors = new Set();
        this._liveMetricsRefreshDisposers = [];

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
        
        // Performance optimization: cached node list and link list
        this._cachedNodesList = null;
        this._cachedLinksList = null;
        this._cachedLinkSystem = null;
        
        if (!this.systems) {
            console.warn('[MetricsRuntime_v1] No metrics systems provided');
        }

        // Initialize live metrics with canonical shape
        this._initializeLiveMetrics();
        this._bindLiveMetricsRefreshListeners();

        // Soft damping state for metric smoothing
        this._dampingFactor = 0.04; // 4% per tick → ~2-3s smooth transition at 10Hz
        this._smoothedMetrics = {
            networkSynergy: 0,
            harmonyFlow: 0,
            networkStress: 0,
            corruptionLevel: 0,
            loadPressure: 0
        };
        this._liveMetricsPublishAccumulator = 0;
        this._liveMetricsPublishInterval = Math.max(0.1, Number(runtimeOptions.liveMetricsPublishInterval ?? 0.2));
        this._liveMetricsPublishRequested = true;
        this._networkCanonicalRefreshAccumulator = 0;
        this._networkCanonicalRefreshInterval = Math.max(0.5, Number(runtimeOptions.networkCanonicalRefreshInterval ?? 1.0));
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
            tiers: {
                synergy: null,
                harmony: null,
                stability: null,
                corruption: null,
                loadPressure: null
            },
            flags: {
                harmonyPeak: false,
                corruptionSpread: false,
                loadPressureHigh: false
            }
        };
        this._semanticSignalState.phases = this._semanticSignalState.tiers;

        // Canonical field audit (orphan/stale detection for high-impact node fields)
        this._canonicalFieldAudit = {
            accumulator: 0,
            intervalSec: 5.0,
            staleMs: 4000,
            lastWarnAtByKey: new Map()
        };

        // Runtime metric authority audit
        this._runtimeAudit = {
            accumulator: 0,
            intervalSec: 5.0,
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

            const linkAuthority = this.linkSystem || this.links || null;
            const nodesDirty = linkAuthority?.nodesDirty === true;
            const linksDirty = linkAuthority?.linksDirty === true;
            const networkDirty = nodesDirty || linksDirty;
            const shouldRefreshCanonicalNetworkState =
                networkDirty ||
                (this._networkCanonicalRefreshAccumulator >= this._networkCanonicalRefreshInterval);

            if (networkDirty) {
                this._networkCanonicalRefreshAccumulator = 0;
            } else {
                this._networkCanonicalRefreshAccumulator += dt;
            }

            // Performance optimization: cache node and link lists
            const nodeList = this._getCachedNodeList();
            const linkList = this._getCachedLinkList();

            // Phase 1: Sanitize metrics (single pass)
            this._sanitizeNodeMetrics(nodeList);

            // Phase 2: Canonical writes (conditional on network state)
            if (nodesDirty || shouldRefreshCanonicalNetworkState) {
                this._ensureNodeCanonicalFallbacks(nodeList);
            }
            this._canonicalWriteLinkCorruptionMetrics(linkList);
            if (networkDirty || shouldRefreshCanonicalNetworkState) {
                this._canonicalWriteNetworkMetrics(nodeList, linkList);
            }

            // Phase 3: Audit and events
            this._runCanonicalFieldAudit(dt, nodeList);
            this._runMetricAuthorityAudit(dt, nodeList, linkList);
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
            this._publishLiveMetrics(dt);

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

    /**
     * Sanitize metrics for all nodes (single pass optimization)
     */
    _sanitizeNodeMetrics(nodeList) {
        for (const node of nodeList) {
            const m = node?.userData?.metrics;
            if (!m) continue;
            const id = this._getNodeId(node);
            this._sanitizeMetrics(m, id);
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
                    const src = link.sourceNodeId ?? (link.source ? this._getNodeId(link.source) : null);
                    const tgt = link.targetNodeId ?? (link.target ? this._getNodeId(link.target) : null);
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
            nodeA: link.nodeA ?? link.sourceNodeId ?? (link.source ? this._getNodeId(link.source) : null),
            nodeB: link.nodeB ?? link.targetNodeId ?? (link.target ? this._getNodeId(link.target) : null)
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

            semanticBus.emit('node.metric.updated', {
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

    _writeCanonicalField(target, fieldKey, value) {
        if (!target) return false;
        if (target[fieldKey] === value) return false;
        target[fieldKey] = value;
        return true;
    }

    _ensureNodeCanonicalFallbacks(nodeList) {
        if (!Array.isArray(nodeList)) return;

        for (const node of nodeList) {
            if (!node) continue;
            node.userData = node.userData || {};
            const metrics = ensureMetrics(node);
            if (!metrics) continue;
            const userData = node.userData;
            const archetypeMetrics = userData.archetypeMetrics || {};
            const isActiveMetricNode = userData._metricActiveLink === true;
            const touchedFields = new Set();

            const harmonyCurrent = metrics.harmony ?? userData.harmony ?? userData.harmonyLevel;
            const corruptionCurrent = metrics.corruption ?? userData.corruption ?? userData.corruptionLevel;
            const harmony = this._clamp01(
                Number.isFinite(harmonyCurrent)
                    ? harmonyCurrent
                    : (!isActiveMetricNode && Number.isFinite(archetypeMetrics.harmony)
                        ? archetypeMetrics.harmony
                        : 0)
            );
            const corruption = this._clamp01(
                Number.isFinite(corruptionCurrent)
                    ? corruptionCurrent
                    : (!isActiveMetricNode && Number.isFinite(archetypeMetrics.corruption)
                        ? archetypeMetrics.corruption
                        : 0)
            );
            const stabilitySource = Number.isFinite(metrics.stability)
                ? metrics.stability
                : (Number.isFinite(userData.stability)
                    ? userData.stability
                    : (Number.isFinite(userData.stabilityNorm)
                        ? userData.stabilityNorm
                        : (!isActiveMetricNode && Number.isFinite(archetypeMetrics.stability)
                            ? archetypeMetrics.stability
                            : undefined)));
            const instabilitySource = Number.isFinite(userData.instability)
                ? userData.instability
                : (Number.isFinite(metrics.instability)
                    ? metrics.instability
                    : (Number.isFinite(stabilitySource)
                        ? 1 - stabilitySource
                        : 0));
            const stability = this._clamp01(Number.isFinite(stabilitySource) ? stabilitySource : 1 - instabilitySource);
            const instability = this._clamp01(Number.isFinite(stabilitySource) ? 1 - stabilitySource : instabilitySource);
            const loadCurrent = metrics.loadPressure ?? userData.loadPressure ?? userData.pressure;
            const load = this._clamp01(
                Number.isFinite(loadCurrent)
                    ? loadCurrent
                    : (!isActiveMetricNode && Number.isFinite(archetypeMetrics.loadPressure)
                        ? archetypeMetrics.loadPressure
                        : 0)
            );

            // Canonical harmony/corruption write + canonical harmonyLevel mirror only
            if (this._writeCanonicalField(metrics, 'harmony', harmony)) touchedFields.add('harmony');
            if (this._writeCanonicalField(metrics, 'corruption', corruption)) touchedFields.add('corruption');
            if (this._writeCanonicalField(userData, 'harmonyLevel', harmony)) touchedFields.add('harmonyLevel');

            // Harmony stabilization canonical defaults (inlined)
            if (typeof userData.harmonyStabilized !== 'boolean') {
                userData.harmonyStabilized = false;
                touchedFields.add('harmonyStabilized');
            }
            if (!Number.isFinite(userData.harmonyDampingFactor)) {
                userData.harmonyDampingFactor = 0;
                touchedFields.add('harmonyDampingFactor');
            } else {
                userData.harmonyDampingFactor = this._clamp01(userData.harmonyDampingFactor);
                touchedFields.add('harmonyDampingFactor');
            }

            // Canonical load metrics only; remove root-level legacy alias writes
            if (this._writeCanonicalField(metrics, 'loadPressure', load)) touchedFields.add('loadPressure');
            if (this._writeCanonicalField(metrics, 'load', load)) touchedFields.add('load');
            if (this._writeCanonicalField(metrics, 'loadRatio', load)) touchedFields.add('loadRatio');

            // Canonical stability/instability only; remove root-level legacy alias writes
            if (this._writeCanonicalField(metrics, 'stability', stability)) touchedFields.add('stability');
            if (this._writeCanonicalField(metrics, 'instability', instability)) touchedFields.add('instability');

            if (touchedFields.size > 0) {
                this._touchCanonicalWrites(userData, Array.from(touchedFields));
            }
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
            const metrics = userData.metrics || (userData.metrics = {});
            const touchedFields = new Set();

            // Read corruption/integrity from LinkCorruptionTransmission if available
            const linkCorruption = this._readLinkCorruption(link, metrics, userData);
            const linkIntegrity = metrics?.integrity ?? userData?.integrity ?? 100;

            // Write canonical corruption metric
            this._writeCanonicalLinkCorruptionFields(userData, metrics, linkCorruption, touchedFields);

            // Write legacy integrity alias
            this._writeLegacyIntegrityField(userData, linkIntegrity, touchedFields);

            // Write corrupted flag
            this._writeCorruptedFlag(userData, metrics, linkCorruption, touchedFields);

            // Write particle fallbacks
            this._writeParticleFallbacks(userData, metrics, touchedFields);

            if (touchedFields.size > 0) {
                this._touchCanonicalWrites(userData, Array.from(touchedFields));
            }
        }
    }

    /**
     * Read link corruption from multiple possible sources
     */
    _readLinkCorruption(link, metrics, userData) {
        return link?.group?.userData?.conduitState?.corruptionLevel ??
            metrics?.corruption ??
            userData?.corruptionLevel ??
            0;
    }

    /**
     * Write canonical corruption field.
     */
    _writeCanonicalLinkCorruptionFields(userData, metrics, corruption, touchedFields) {
        const nextCorruption = Number.isFinite(corruption) ? Math.max(0, Math.min(1, corruption)) : 0;
        userData.metrics = userData.metrics || {};
        userData.metrics.corruption = nextCorruption;
        touchedFields.add('corruption');
    }

    /**
     * Write legacy integrity alias (not canonical)
     */
    _writeLegacyIntegrityField(userData, integrity, touchedFields) {
        const nextIntegrity = Number.isFinite(integrity) ? Math.max(0, Math.min(100, integrity)) : 100;
        userData.integrity = nextIntegrity;
        touchedFields.add('integrity');
    }

    /**
     * Write corrupted flag based on corruption level
     */
    _writeCorruptedFlag(userData, metrics, corruption, touchedFields) {
        const nextCorruption = Number.isFinite(corruption) ? Math.max(0, Math.min(1, corruption)) : 0;
        const corrupted = nextCorruption >= 0.5;
        userData.corrupted = corrupted;
        touchedFields.add('corrupted');
        userData.metrics.corrupted = corrupted;
        touchedFields.add('corrupted');
    }

    /**
     * Write particle canonical fallbacks
     */
    _writeParticleFallbacks(userData, metrics, touchedFields) {
        const particleIntensity = Number.isFinite(userData.particleIntensity) ? this._clamp01(userData.particleIntensity) : 0;
        const particleUrgency = Number.isFinite(userData.particleUrgency) ? this._clamp01(userData.particleUrgency) : 0;
        userData.particleIntensity = particleIntensity;
        userData.particleUrgency = particleUrgency;
        userData.metrics.particleIntensity = particleIntensity;
        userData.metrics.particleUrgency = particleUrgency;
        touchedFields.add('particleIntensity');
        touchedFields.add('particleUrgency');
    }

    /**
     * Canonical writer for network metrics (fatigue, hubId, activeLinkCount).
     * Ensures these metrics are defined and not stale after world switch.
     * Reads from NetworkFatigueSystem if available, otherwise uses defaults.
     */
    _canonicalWriteNetworkMetrics(nodeList, linkList = null) {
        if (!Array.isArray(nodeList)) return;
        const resolvedLinkList =
            Array.isArray(linkList) ? linkList :
            this.linkSystem?.links ||
            this.links?.links ||
            this.links ||
            [];

        // Performance optimization: reuse activeNodeIds from _aggregateNodeMetrics if available
        const activeNodeIds = this._cachedActiveNodeIds || new Set();
        this._cachedActiveNodeIds = activeNodeIds;
        activeNodeIds.clear();

        if (Array.isArray(resolvedLinkList)) {
            for (const link of resolvedLinkList) {
                if (!link) continue;
                const sourceId =
                    link.nodeA ??
                    link.sourceNodeId ??
                    this._getNodeId(link.source ?? link.sourceNode ?? link.from);
                const targetId =
                    link.nodeB ??
                    link.targetNodeId ??
                    this._getNodeId(link.target ?? link.targetNode ?? link.to);

                if ((sourceId !== undefined && sourceId !== null) || (targetId !== undefined && targetId !== null)) {
                    const key = String(sourceId);
                    if (sourceId !== undefined && sourceId !== null) activeNodeIds.set(key, (activeNodeIds.get(key) || 0) + 1);
                    if (targetId !== undefined && targetId !== null) activeNodeIds.set(String(targetId), (activeNodeIds.get(String(targetId)) || 0) + 1);
                }
            }
        }

        for (const node of nodeList) {
            if (!node) continue;
            node.userData = node.userData || {};
            const userData = node.userData;
            const metrics = userData.metrics || (userData.metrics = {});
            const touchedFields = new Set();

            // Write fatigue metrics
            this._writeFatigueMetrics(userData, metrics, touchedFields);

            // Write hub-related fields
            this._writeHubFields(metrics, userData, touchedFields);

            // Write active link count
            const nodeId = this._getNodeId(node);
            this._writeActiveLinkCount(userData, metrics, nodeId, activeNodeIds, touchedFields);

            // Ensure loadPressure defaults
            this._ensureLoadPressureDefaults(metrics, touchedFields);

            if (touchedFields.size > 0) {
                this._touchCanonicalWrites(userData, Array.from(touchedFields));
            }
        }
    }

    /**
     * Write fatigue and networkFatigue metrics
     */
    _writeFatigueMetrics(userData, metrics, touchedFields) {
        const fatigue = typeof userData.fatigue === 'number'
            ? Math.max(0, Math.min(1, userData.fatigue))
            : 0.0;
        userData.fatigue = fatigue;
        touchedFields.add('fatigue');
        const networkFatigue = typeof metrics.networkFatigue === 'number'
            ? metrics.networkFatigue
            : fatigue;
        userData.networkFatigue = networkFatigue;
        touchedFields.add('networkFatigue');
    }

    /**
     * Write hub-related fields (clusterMembershipID, hubId)
     */
    _writeHubFields(metrics, userData, touchedFields) {
        if (typeof metrics.clusterMembershipID !== 'number' || metrics.clusterMembershipID === null) {
            metrics.clusterMembershipID = -1;
            touchedFields.add('clusterMembershipID');
        }
        if (typeof metrics.hubId !== 'number' || metrics.hubId === null) {
            metrics.hubId = -1;
            touchedFields.add('hubId');
        }
        userData.clusterMembershipID = metrics.clusterMembershipID;
        touchedFields.add('clusterMembershipID');
        userData.hubId = metrics.hubId;
        touchedFields.add('hubId');
    }

    /**
     * Write active link count from cached link aggregation
     */
    _writeActiveLinkCount(userData, metrics, nodeId, activeNodeIds, touchedFields) {
        const activeLinkCount = nodeId !== null && nodeId !== undefined
            ? (activeNodeIds.get(String(nodeId)) || 0)
            : 0;
        metrics.activeLinkCount = activeLinkCount;
        userData.activeLinkCount = activeLinkCount;
        touchedFields.add('activeLinkCount');
        touchedFields.add('activeLinkCount');
    }

    /**
     * Ensure loadPressure and pressure have defaults
     */
    _ensureLoadPressureDefaults(metrics, touchedFields) {
        if (typeof metrics.loadPressure !== 'number') {
            metrics.loadPressure = 0.0;
            touchedFields.add('loadPressure');
        }
        if (typeof metrics.pressure !== 'number') {
            metrics.pressure = 0.0;
            touchedFields.add('pressure');
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
        const nodeFields = this._getCanonicalNodeFields();
        const linkFields = this._getCanonicalLinkFields();
        const missingByField = this._initializeAuditMaps(nodeFields, linkFields);
        const staleByField = missingByField.stale;

        // Audit node metrics
        this._auditNodeFields(nodeList, nodeFields, missingByField.missing, staleByField, now);

        // Audit link metrics
        const linkList = this._getCachedLinkList();
        this._auditLinkFields(linkList, linkFields, missingByField.missing, staleByField, now);

        // Report warnings
        this._reportNodeFieldWarnings(nodeFields, missingByField.missing, staleByField, nodeList.length, now);
        this._reportLinkFieldWarnings(linkFields, missingByField.missing, staleByField, linkList.length, now);
    }

    /**
     * Get list of canonical node fields to audit
     */
    _getCanonicalNodeFields() {
        return [
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
    }

    /**
     * Get list of canonical link fields to audit
     */
    _getCanonicalLinkFields() {
        return [
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
    }

    /**
     * Initialize audit maps for missing/stale field tracking
     */
    _initializeAuditMaps(nodeFields, linkFields) {
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
        return { missing: missingByField, stale: staleByField };
    }

    /**
     * Audit node fields for missing/stale data
     */
    _auditNodeFields(nodeList, nodeFields, missingByField, staleByField, now) {
        for (const node of nodeList) {
            const userData = node?.userData;
            if (!userData) {
                nodeFields.forEach((f) => missingByField.set(f, (missingByField.get(f) || 0) + 1));
                continue;
            }
            this._auditFieldsForEntity(userData, nodeFields, missingByField, staleByField, now);
        }
    }

    /**
     * Audit link fields for missing/stale data
     */
    _auditLinkFields(linkList, linkFields, missingByField, staleByField, now) {
        for (const link of linkList) {
            if (!link) continue;
            const userData = link?.userData;
            if (!userData) {
                linkFields.forEach((f) => missingByField.set(f, (missingByField.get(f) || 0) + 1));
                continue;
            }
            this._auditFieldsForEntity(userData, linkFields, missingByField, staleByField, now);
        }
    }

    /**
     * Audit fields for a single entity (node or link)
     */
    _auditFieldsForEntity(userData, fields, missingByField, staleByField, now) {
        const writeMap = userData.__canonicalWriteAt || {};
        for (const field of fields) {
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

    /**
     * Report warnings for node field audit
     */
    _reportNodeFieldWarnings(nodeFields, missingByField, staleByField, totalNodes, now) {
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
                totalNodes
            });
        }
    }

    /**
     * Report warnings for link field audit
     */
    _reportLinkFieldWarnings(linkFields, missingByField, staleByField, totalLinks, now) {
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
                totalLinks
            });
        }
    }

    _runMetricAuthorityAudit(deltaTime, nodeList, linkList) {
        const audit = this._runtimeAudit;
        if (!audit || audit.intervalSec <= 0) return;

        audit.accumulator += deltaTime;
        if (audit.accumulator < audit.intervalSec) {
            return;
        }
        audit.accumulator = 0;

        const nodes = Array.isArray(nodeList) ? nodeList : [];
        const links = Array.isArray(linkList) ? linkList : [];
        const now = Date.now();
        const expectedCanonicalNodeFields = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure'];
        const legacyMirrorFields = {
            harmony: 'harmony',
            harmonyLevel: 'harmony',
            corruption: 'corruption',
            corruptionLevel: 'corruption',
            loadPressure: 'loadPressure',
            load: 'loadPressure',
            pressure: 'loadPressure',
            instability: 'instability'
        };

        let missingMetricsCount = 0;
        const missingCanonicalCounts = new Map(expectedCanonicalNodeFields.map((field) => [field, 0]));
        const unauthorizedWrites = [];

        for (const node of nodes) {
            const userData = node?.userData;
            const nodeId = node?.userData?.nodeId || node?.uuid || node?.id || 'unknown-node';
            if (!userData) {
                missingMetricsCount += 1;
                continue;
            }

            const metrics = userData.metrics;
            if (!metrics || typeof metrics !== 'object') {
                missingMetricsCount += 1;
                continue;
            }

            for (const field of expectedCanonicalNodeFields) {
                if (metrics[field] === undefined) {
                    missingCanonicalCounts.set(field, (missingCanonicalCounts.get(field) || 0) + 1);
                }
            }

            const writeMap = userData.__canonicalWriteAt || {};
            for (const [field, canonicalKey] of Object.entries(legacyMirrorFields)) {
                if (userData[field] === undefined) {
                    continue;
                }
                const expected = canonicalKey === 'instability'
                    ? this._clamp01(1 - this._clamp01(metrics.stability ?? 1))
                    : this._clamp01(metrics[canonicalKey] ?? 0);
                const actual = userData[field];
                if (actual !== expected) {
                    unauthorizedWrites.push({ nodeId, field, expected, actual, type: 'mismatch' });
                }
                if (!writeMap[field]) {
                    unauthorizedWrites.push({ nodeId, field, expected, actual, type: 'missingCanonicalStamp' });
                } else if (now - writeMap[field] > this._canonicalFieldAudit.staleMs) {
                    unauthorizedWrites.push({ nodeId, field, expected, actual, type: 'staleCanonicalWrite' });
                }
            }
        }

        if (missingMetricsCount > 0) {
            const key = `runtimeAudit:missingMetrics:${missingMetricsCount}`;
            const lastWarnAt = audit.lastWarnAtByKey.get(key) || 0;
            if (now - lastWarnAt >= audit.intervalSec * 1000) {
                audit.lastWarnAtByKey.set(key, now);
                console.warn('[MetricsRuntime_v1] Runtime metric authority audit: missing canonical node.userData.metrics', {
                    missingNodes: missingMetricsCount,
                    totalNodes: nodes.length
                });
            }
        }

        for (const [field, count] of missingCanonicalCounts.entries()) {
            if (count <= 0) continue;
            const key = `runtimeAudit:missingCanonicalField:${field}:${count}`;
            const lastWarnAt = audit.lastWarnAtByKey.get(key) || 0;
            if (now - lastWarnAt < audit.intervalSec * 1000) continue;
            audit.lastWarnAtByKey.set(key, now);
            console.warn('[MetricsRuntime_v1] Runtime metric authority audit: missing canonical metric field on node metrics', {
                field,
                missingNodes: count,
                totalNodes: nodes.length
            });
        }

        if (unauthorizedWrites.length > 0) {
            const grouped = unauthorizedWrites.slice(0, 10);
            const key = `runtimeAudit:unauthorizedWrites:${grouped.length}`;
            const lastWarnAt = audit.lastWarnAtByKey.get(key) || 0;
            if (now - lastWarnAt >= audit.intervalSec * 1000) {
                audit.lastWarnAtByKey.set(key, now);
                console.warn('[MetricsRuntime_v1] Runtime metric authority audit: detected unauthorized legacy writes or stale metric mirrors', {
                    sampleIssues: grouped,
                    totalIssues: unauthorizedWrites.length,
                    totalNodes: nodes.length
                });
            }
        }

        this._auditGlobalPublishShape();
    }

    _auditGlobalPublishShape() {
        const scope = this._getGlobalScope();
        if (!scope) return;

        const liveMetrics = scope.__ATOMA_LIVE_METRICS__ || {};
        const missingFields = CANONICAL_METRIC_FIELDS.filter((field) => liveMetrics[field] === undefined);
        if (missingFields.length > 0) {
            const key = `runtimeAudit:globalPublishShape:${missingFields.join(',')}`;
            const now = Date.now();
            const lastWarnAt = this._runtimeAudit.lastWarnAtByKey.get(key) || 0;
            if (now - lastWarnAt >= this._runtimeAudit.intervalSec * 1000) {
                this._runtimeAudit.lastWarnAtByKey.set(key, now);
                console.warn('[MetricsRuntime_v1] Runtime metric authority audit: __ATOMA_LIVE_METRICS__ is missing canonical fields', {
                    missingFields,
                    currentKeys: Object.keys(liveMetrics).sort()
                });
            }
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
            semanticBus.emit('link.corruption.spread', {
                source: fromNode?.id ?? this._getNodeId(fromNode),
                target: toNode?.id ?? this._getNodeId(toNode),
                amount: delta
            }, { priority: semanticBus.priority?.NORMAL });
        }
    }

    _trackDisposer(disposer) {
        if (!disposer) return;
        if (typeof disposer === 'function') {
            this._liveMetricsRefreshDisposers.push(disposer);
            return;
        }
        if (typeof disposer?.dispose === 'function') {
            this._liveMetricsRefreshDisposers.push(() => {
                try {
                    disposer.dispose();
                } catch (err) {
                    console.warn('[MetricsRuntime_v1] refresh listener dispose error:', err?.message || err);
                }
            });
            return;
        }
        if (typeof disposer?.unsubscribe === 'function') {
            this._liveMetricsRefreshDisposers.push(() => {
                try {
                    disposer.unsubscribe();
                } catch (err) {
                    console.warn('[MetricsRuntime_v1] refresh listener unsubscribe error:', err?.message || err);
                }
            });
        }
    }

    _bindLiveMetricsRefreshListeners() {
        const semanticBus = globalThis?.semanticBus;
        if (!semanticBus?.subscribe) return;

        const refreshLiveMetrics = () => {
            try {
                this._publishLiveMetrics(0, true);
            } catch (err) {
                console.warn('[MetricsRuntime_v1] live metrics refresh failed:', err?.message || err);
            }
        };

        const refreshAfterLinkChange = () => {
            try {
                if (this.useNetworkMetricsAggregator && !this.externalNetworkMetricsAggregatorControl) {
                    this._runNetworkMetricsAggregator();
                }
                this._publishLiveMetrics(0, true);
            } catch (err) {
                console.warn('[MetricsRuntime_v1] link-driven live metrics refresh failed:', err?.message || err);
            }
        };

        this._trackDisposer(semanticBus.subscribe('link.created', refreshAfterLinkChange));
        this._trackDisposer(semanticBus.subscribe('link.removed', refreshAfterLinkChange));
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

        // Rebalanced: 0.75→0.55, exit 0.65→0.45 per METRICS_REBALANCE_V2_FINAL.md
        if (!flags.loadPressureHigh && current.loadPressure >= 0.55) {
            emit('metric:loadPressureHigh', current.loadPressure, prevLoad === null ? 0 : current.loadPressure - prevLoad, { metric: 'loadPressure' });
            flags.loadPressureHigh = true;
        } else if (flags.loadPressureHigh && current.loadPressure <= 0.45) {
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
            // Rebalanced: 0.6→0.25 per METRICS_REBALANCE_V2_FINAL.md
            const crossedCorruption = prevCorruption < 0.25 && current.corruptionLevel >= 0.25;
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
        this._emitMetricTierSignals(current, context);
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

        // Rebalanced per METRICS_REBALANCE_V2_FINAL.md R2
        // Network averages: synergy~0.35, harmony~0.48, corruption~0.08, load~0.40, stress~0.40
        if (current.networkSynergy >= 0.45 && (last.networkSynergy ?? 0) < 0.45) {
            semanticBus.emit('event:synergyCascade', {
                value: current.networkSynergy
            });
        }

        if (current.harmonyFlow >= 0.55 && (last.harmonyFlow ?? 0) < 0.55) {
            semanticBus.emit('event:harmonyResonance', {
                value: current.harmonyFlow
            });
        }

        if (current.corruptionLevel >= 0.25 && (last.corruptionLevel ?? 0) < 0.25) {
            semanticBus.emit('event:corruptionOutbreak', {
                value: current.corruptionLevel
            });
        }

        const loadCollapseNow = current.loadPressure >= 0.55 && current.networkStress >= 0.40;
        const loadCollapseBefore = (last.loadPressure ?? 0) >= 0.55 && (last.networkStress ?? 0) >= 0.40;
        if (loadCollapseNow && !loadCollapseBefore) {
            semanticBus.emit('event:loadCollapse', {
                load: current.loadPressure,
                stress: current.networkStress
            });
        }

        if (current.networkStress >= 0.50 && (last.networkStress ?? 0) < 0.50) {
            semanticBus.emit('event:instabilityTrap', {
                value: current.networkStress
            });
        }
    }

    _emitMetricTierSignals(metricsPayload, context = {}) {
        const semanticBus = globalThis?.semanticBus;
        if (!semanticBus?.emit) return;

        const now = typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        const nodeCount = Number.isFinite(context.nodeCount) ? context.nodeCount : 0;
        const linkCount = Number.isFinite(context.linkCount) ? context.linkCount : 0;
        const tiers = this._semanticSignalState?.tiers || this._semanticSignalState?.phases;
        if (!tiers) return;

        const entries = [
            { metric: 'synergy', value: this._clamp01(metricsPayload?.networkSynergy) },
            { metric: 'harmony', value: this._clamp01(metricsPayload?.harmonyFlow) },
            { metric: 'stability', value: this._clamp01(1 - this._clamp01(metricsPayload?.networkStress)) },
            { metric: 'corruption', value: this._clamp01(metricsPayload?.corruptionLevel) },
            { metric: 'loadPressure', value: this._clamp01(metricsPayload?.loadPressure) }
        ];

        for (const entry of entries) {
            const previousTier = normalizeMetricTier(tiers[entry.metric] ?? null);
            const nextTier = classifyMetricTier(entry.value, previousTier, getDefaultMetricThresholds(entry.metric));

            // Emit on initial classification (previousTier === null) and on tier transitions.
            // Skip only when the tier is unchanged from a previous classification.
            if (previousTier !== null && nextTier === previousTier) {
                continue;
            }

            tiers[entry.metric] = nextTier;
            this._semanticSignalState.phases = tiers;
            const payload = {
                scope: 'global',
                metric: entry.metric,
                tier: nextTier,
                previousTier,
                value: entry.value,
                nodeId: null,
                nodeCount,
                linkCount,
                timestamp: now,
                source: 'MetricsRuntime_v1',
                initial: previousTier === null
            };
            // Internal hook only:
            // - use this when tooling needs a generic tier transition feed
            // - global consumers should still prefer the scoped metric alias events provided by semanticBus
            // - keep the event available for diagnostics, not as the main wiring path
            semanticBus.emit('metric.tier.changed', payload, { priority: semanticBus.priority?.NORMAL });
            semanticBus.emit(buildScopedMetricEventName('global', entry.metric, nextTier), payload, { priority: semanticBus.priority?.NORMAL });
        }
    }

    /**
     * Publish canonical live metrics to global scope
     * Priority: NetworkMetricsAggregator override → Node aggregation fallback
     * This is the canonical source of truth for HUD and other consumers
     * Always publishes, even when metrics are 0, to ensure object shape stability
     */
    _publishLiveMetrics(deltaTime = 0, force = false) {
        const scope = this._getGlobalScope();
        if (!scope) return;

        if (force) {
            this._liveMetricsPublishRequested = true;
        } else {
            this._liveMetricsPublishAccumulator += Number.isFinite(deltaTime) ? deltaTime : 0;
        }

        if (
            !this._liveMetricsPublishRequested &&
            this._liveMetricsPublishAccumulator < this._liveMetricsPublishInterval
        ) {
            return;
        }

        this._liveMetricsPublishAccumulator = 0;
        this._liveMetricsPublishRequested = false;

        const fallbackResult = this._aggregateNodeMetrics();
        const currentLinkCount = this._countLinks();
        const result = fallbackResult;

        // Raw targets from aggregation
        const rawMetrics = {
            networkSynergy: this._clamp01(result.networkSynergy ?? result.synergy ?? 0),
            harmonyFlow: this._clamp01(result.harmonyFlow ?? result.harmony ?? 0),
            networkStress: this._clamp01(result.networkStress ?? (1 - (result.stability ?? 0))),
            corruptionLevel: this._clamp01(result.corruptionLevel ?? result.corruption ?? 0),
            loadPressure: this._clamp01(result.loadPressure ?? result.load ?? result.pressure ?? 0)
        };

        // Apply exponential smoothing toward raw targets
        // _dampingFactor controls convergence speed (0.04 ≈ ~2-3s smooth transition)
        const df = this._dampingFactor;
        this._smoothedMetrics.networkSynergy  += (rawMetrics.networkSynergy  - this._smoothedMetrics.networkSynergy)  * df;
        this._smoothedMetrics.harmonyFlow     += (rawMetrics.harmonyFlow     - this._smoothedMetrics.harmonyFlow)     * df;
        this._smoothedMetrics.networkStress   += (rawMetrics.networkStress   - this._smoothedMetrics.networkStress)   * df;
        this._smoothedMetrics.corruptionLevel += (rawMetrics.corruptionLevel - this._smoothedMetrics.corruptionLevel) * df;
        this._smoothedMetrics.loadPressure    += (rawMetrics.loadPressure    - this._smoothedMetrics.loadPressure)    * df;

        this._safePublishLiveMetrics({
            networkSynergy:  this._clamp01(this._smoothedMetrics.networkSynergy),
            harmonyFlow:     this._clamp01(this._smoothedMetrics.harmonyFlow),
            networkStress:   this._clamp01(this._smoothedMetrics.networkStress),
            corruptionLevel: this._clamp01(this._smoothedMetrics.corruptionLevel),
            loadPressure:    this._clamp01(this._smoothedMetrics.loadPressure),
            nodeCount: Number.isFinite(result.nodeCount) ? result.nodeCount : 0,
            linkCount: currentLinkCount
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
        scope.globalMetrics = {
            synergy: scope.__ATOMA_LIVE_METRICS__.networkSynergy,
            harmony: scope.__ATOMA_LIVE_METRICS__.harmonyFlow,
            stability: this._clamp01(1 - scope.__ATOMA_LIVE_METRICS__.networkStress),
            corruption: scope.__ATOMA_LIVE_METRICS__.corruptionLevel,
            load: scope.__ATOMA_LIVE_METRICS__.loadPressure
        };
        scope.world.metrics.globalMetrics = { ...scope.globalMetrics };
    }

    /**
     * Public live-metrics refresh hook.
     * Use this when an event should immediately invalidate the HUD snapshot,
     * such as link creation/removal.
     */
    refreshLiveMetrics() {
        this._publishLiveMetrics(0, true);
    }

    /**
     * Aggregate metrics from all nodes' userData.metrics
     * Returns average of each metric across all nodes
     */
    _aggregateNodeMetrics() {
        // Performance optimization: use cached node list
        const nodesList = this._getCachedNodeList();
        const nodeCount = nodesList.length;
        const linkList = this._getCachedLinkList();

        // Performance optimization: reuse activeNodeIds Set from _canonicalWriteNetworkMetrics
        const activeNodeIds = this._cachedActiveNodeIds || new Set();
        this._cachedActiveNodeIds = activeNodeIds;
        activeNodeIds.clear();
        for (const link of linkList) {
            if (!link || link.active === false) continue;
            const sourceId = this._getNodeId(link.source ?? link.nodeA ?? link.sourceNode);
            const targetId = this._getNodeId(link.target ?? link.nodeB ?? link.targetNode);
            if (sourceId !== null && sourceId !== undefined) activeNodeIds.add(String(sourceId));
            if (targetId !== null && targetId !== undefined) activeNodeIds.add(String(targetId));
        }

        if (activeNodeIds.size === 0) {
            return {
                networkSynergy: 0,
                harmonyFlow: 0,
                networkStress: 0,
                stability: 0,
                corruptionLevel: 0,
                loadPressure: 0,
                nodeCount,
                linkCount: this._countLinks()
            };
        }

        const readNodeMetric = (node, canonicalKey, fallbackKeys = []) => {
            const userData = node?.userData || {};
            const metrics = userData.metrics || {};

            // Prefer the canonical metrics container over legacy top-level aliases.
            // Legacy fields may be stale or partially populated, so the metrics object is authoritative.
            const candidates = [
                metrics[canonicalKey],
                userData[canonicalKey]
            ];

            for (const fallbackKey of fallbackKeys) {
                candidates.push(metrics[fallbackKey], userData[fallbackKey]);
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
            const nodeId = this._getNodeId(node);
            if (nodeId !== null && nodeId !== undefined && !activeNodeIds.has(String(nodeId))) {
                continue;
            }
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
        // Performance optimization: use cached link list
        const linkList = this._getCachedLinkList();
        return Array.isArray(linkList) ? linkList.length : 0;
    }

    /**
     * Performance optimization: cache node list to avoid repeated Array.isArray checks
     */
    _getCachedNodeList() {
        if (this._cachedNodesList !== null) {
            return this._cachedNodesList;
        }
        const nodesList = Array.isArray(this.nodes?.nodes)
            ? this.nodes.nodes
            : Array.isArray(this.nodes)
                ? this.nodes
                : [];
        this._cachedNodesList = nodesList;
        return nodesList;
    }

    /**
     * Performance optimization: cache link list to avoid repeated Array.isArray checks
     */
    _getCachedLinkList() {
        if (this._cachedLinksList !== null) {
            return this._cachedLinksList;
        }
        const linkList =
            this.linkSystem?.links ||
            this.links?.links ||
            this.links ||
            [];
        this._cachedLinksList = linkList;
        return linkList;
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
            if (Array.isArray(this._liveMetricsRefreshDisposers)) {
                for (const dispose of this._liveMetricsRefreshDisposers) {
                    try {
                        dispose?.();
                    } catch (err) {
                        console.warn('[MetricsRuntime_v1] live metrics refresh cleanup error:', err?.message || err);
                    }
                }
                this._liveMetricsRefreshDisposers.length = 0;
            }

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
        this.linkSystem = null;
        this.systems = null;
        this._loggedErrors.clear();
        this._loggedErrors = null;
        this._cachedNodesList = null;
        this._cachedLinksList = null;
        this._cachedActiveNodeIds = null;
    }
}
