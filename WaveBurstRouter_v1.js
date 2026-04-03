import * as THREE from 'three';
import { SynergyStateResolver, SynergyState } from './SynergyStateResolver.js';

export function setupWaveBurstRouter(game) {
    const synergyResolver = new SynergyStateResolver();

    const EXPECTED_EVENT_TAGS = [
        'node.synergy.high',
        'node.harmony.high',
        'link:synergyThreshold',
        'link:harmonicLock',
        'network:harmonyShift',
        'cascade.start',
        'harmonic.cascade.start',
        'cascade.hop',
        'global.stability.low',
        'global.loadPressure.high',
        'network:stressRise',
        'node.corruption.high',
        'network:corruptionSpread',
        'metrics.spike',
        'link:collapsed'
    ];

    const config = {
        cooldownSeconds: 1.5,
        phaseDedupSeconds: 0.35,
        maxRecentIntents: 24
    };

    const state = {
        lastBurstTime: 0,
        lastBurstByKey: new Map(),
        regimeBySource: new Map(),
        recentMetricSignals: new Map(),
        recentIntents: [],
        boundBus: null,
        subscribed: false,
        unsubscribers: []
    };

    function getSemanticBus() {
        return game.semanticBus || null;
    }

    function getWaveEngine() {
        return game.waveInterferenceEngine || null;
    }

    function clamp01(value) {
        const num = Number(value);
        if (!Number.isFinite(num)) return 0;
        return Math.max(0, Math.min(1, num));
    }

    function isOnCooldown(key, nowSec) {
        const last = state.lastBurstByKey.get(key);
        if (!Number.isFinite(last)) return false;
        return (nowSec - last) < config.cooldownSeconds;
    }

    function markBurst(key, nowSec) {
        state.lastBurstByKey.set(key, nowSec);
        state.lastBurstTime = nowSec;
    }

    function recordIntent(entry) {
        state.recentIntents.push(entry);
        if (state.recentIntents.length > config.maxRecentIntents) {
            state.recentIntents.splice(0, state.recentIntents.length - config.maxRecentIntents);
        }
    }

    function normalizeMetricName(metric) {
        return String(metric ?? '').trim().toLowerCase();
    }

    function getMetricSignalKey(metric, sourceId, phase) {
        return `${normalizeMetricName(metric)}:${String(sourceId ?? '')}:${String(phase ?? '')}`;
    }

    function pruneRecentMetricSignals(nowSec) {
        if (state.recentMetricSignals.size <= 96) return;
        for (const [key, last] of state.recentMetricSignals.entries()) {
            if ((nowSec - last) > config.phaseDedupSeconds * 2) {
                state.recentMetricSignals.delete(key);
            }
        }
    }

    function shouldSkipMetricSignal(metric, sourceId, phase, nowSec) {
        const key = getMetricSignalKey(metric, sourceId, phase);
        const last = state.recentMetricSignals.get(key);
        if (Number.isFinite(last) && (nowSec - last) < config.phaseDedupSeconds) {
            return true;
        }
        state.recentMetricSignals.set(key, nowSec);
        pruneRecentMetricSignals(nowSec);
        return false;
    }

    function asVector3(candidate) {
        if (!candidate) return null;
        if (candidate instanceof THREE.Vector3) return candidate;
        const x = Number(candidate.x);
        const y = Number(candidate.y);
        const z = Number(candidate.z);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
        return new THREE.Vector3(x, y, z);
    }

    function resolveNodeId(node) {
        if (!node) return null;
        return String(node?.userData?.nodeId || node?.id || node?.uuid || '');
    }

    function getAllNodes() {
        const aiNodes = game?.aiNodes?.nodes;
        const nodeList = game?.nodes || game?.nodeList;
        if (Array.isArray(aiNodes) && aiNodes.length > 0) return aiNodes;
        if (Array.isArray(nodeList) && nodeList.length > 0) return nodeList;
        return [];
    }

    function getAllLinks() {
        const linkingLinks = game?.linkingSystem?.links;
        const linkList = game?.links || game?.linkList;
        if (Array.isArray(linkingLinks) && linkingLinks.length > 0) return linkingLinks;
        if (Array.isArray(linkList) && linkList.length > 0) return linkList;
        return [];
    }

    function findNodeById(nodeId) {
        if (nodeId === undefined || nodeId === null || nodeId === '') return null;
        const id = String(nodeId);
        const nodes = getAllNodes();
        for (const node of nodes) {
            if (!node) continue;
            const candidateId = resolveNodeId(node);
            if (candidateId && candidateId === id) return node;
        }
        return null;
    }

    function findLinkById(linkId) {
        if (linkId === undefined || linkId === null || linkId === '') return null;
        const id = String(linkId);
        const links = getAllLinks();
        for (const link of links) {
            if (!link) continue;
            const candidateId = String(link.id || link.uuid || link?.userData?.id || '');
            if (candidateId && candidateId === id) return link;
        }
        return null;
    }

    function resolveLinkId(payload = {}) {
        const linkId =
            payload.linkId ||
            payload.link?.id ||
            payload.link?.uuid ||
            payload.link?.userData?.id ||
            null;
        return linkId !== undefined && linkId !== null && linkId !== '' ? String(linkId) : null;
    }

    function resolveSourceNode(payload = {}) {
        if (payload.sourceNode?.position) return payload.sourceNode;

        if (payload.link?.source || payload.link?.sourceNode || payload.link?.from) {
            return payload.link.source || payload.link.sourceNode || payload.link.from || null;
        }

        return findNodeById(
            payload.sourceNodeId ||
            payload.nodeId ||
            payload.source ||
            payload.from ||
            payload.sourceId ||
            payload.id
        );
    }

    function resolveTargetNode(payload = {}) {
        if (payload.targetNode?.position) return payload.targetNode;

        if (payload.link?.target || payload.link?.targetNode || payload.link?.to) {
            return payload.link.target || payload.link.targetNode || payload.link.to || null;
        }

        return findNodeById(
            payload.targetNodeId ||
            payload.target ||
            payload.to ||
            payload.targetId
        );
    }

    function resolveLinkFromPayload(payload = {}) {
        if (payload.link) return payload.link;

        const linkId = resolveLinkId(payload);
        if (linkId) {
            const linked = findLinkById(linkId);
            if (linked) return linked;
        }

        const sourceNode = resolveSourceNode({ ...payload, link: null });
        const targetNode = resolveTargetNode({ ...payload, link: null });
        if (!sourceNode || !targetNode) return null;

        const sourceId = resolveNodeId(sourceNode);
        const targetId = resolveNodeId(targetNode);
        if (!sourceId || !targetId) return null;

        const links = getAllLinks();
        for (const link of links) {
            const linkSourceId = resolveNodeId(link?.source || link?.sourceNode || link?.from);
            const linkTargetId = resolveNodeId(link?.target || link?.targetNode || link?.to);
            if (
                (linkSourceId === sourceId && linkTargetId === targetId) ||
                (linkSourceId === targetId && linkTargetId === sourceId)
            ) {
                return link;
            }
        }

        return null;
    }

    function readNodeMetrics(node) {
        const metrics = node?.userData?.metrics || node?.metrics || {};
        return {
            synergy: clamp01(metrics.synergy),
            harmony: clamp01(metrics.harmony),
            corruption: clamp01(metrics.corruption),
            stability: clamp01(metrics.stability ?? metrics.resilience),
            loadPressure: clamp01(metrics.loadPressure ?? metrics.load ?? metrics.loadRatio)
        };
    }

    function resolveSynergyRegime(value, corruption = 0) {
        const synergyState = synergyResolver.resolve(value);
        if (synergyState === SynergyState.AWAKENED) return 'reinforced';
        if (synergyState === SynergyState.STRONG) return 'convergent';
        if (synergyState === SynergyState.ACTIVE) return 'collaborative';
        if (corruption >= 0.45) return 'decoherent';
        return 'baseline';
    }

    function resolveHarmonicRegime(harmony, stability, explicitType = '') {
        if (explicitType === 'resolved_harmony') return 'resolved';
        if (harmony >= 0.85 && stability >= 0.55) return 'aligned';
        if (harmony >= 0.55) return 'coherent';
        return 'diffuse';
    }

    function resolveCorruptionRegime(value, destructive = false) {
        if (destructive || value >= 0.85) return 'rupture';
        if (value >= 0.6) return 'critical_divergence';
        if (value >= 0.3) return 'contaminated';
        return 'contained';
    }

    function resolveStabilityRegime(stability, loadPressure, intensity = 0) {
        const instability = Math.max(1 - clamp01(stability), clamp01(loadPressure), clamp01(intensity));
        if (instability >= 0.85) return 'turbulent';
        if (instability >= 0.6) return 'fragmented';
        if (instability >= 0.3) return 'unstable';
        return 'stable';
    }

    function resolveNodeFamily(payload = {}) {
        const node = resolveSourceNode(payload);
        if (!node) return 'synergy';

        const metrics = readNodeMetrics(node);
        const instability = Math.max(1 - metrics.stability, metrics.loadPressure);

        if (metrics.corruption >= 0.45 && metrics.corruption >= Math.max(metrics.synergy, metrics.harmony)) {
            return 'corruption';
        }
        if (instability >= 0.55 && instability > metrics.harmony) {
            return 'stability';
        }
        if (metrics.harmony >= metrics.synergy) {
            return 'harmonic';
        }
        return 'synergy';
    }

    function resolveCascadeFamily(payload = {}, eventTag = '') {
        const flowType = `${
            payload.conflictType ||
            payload.link?.userData?.flowState?.type ||
            payload.link?.userData?.cascadeConflictType ||
            ''
        }`.toLowerCase();

        if (flowType === 'corruption' || flowType === 'destructive') return 'corruption';
        if (flowType === 'oscillatory_balance' || flowType === 'resolved_harmony') return 'harmonic';
        if (flowType === 'fatigue_yield' || flowType === 'stability') return 'stability';
        if (flowType === 'specialization_drift') return 'synergy';

        if (eventTag === 'cascade.start') {
            return resolveNodeFamily(payload);
        }

        const link = resolveLinkFromPayload(payload);
        if (link?.userData?.flowState?.type) {
            return resolveCascadeFamily({ ...payload, conflictType: link.userData.flowState.type }, eventTag);
        }

        return 'synergy';
    }

    function resolveType(type, payload = {}, eventTag = '') {
        if (type === 'cascade') return resolveCascadeFamily(payload, eventTag);
        return type;
    }

    function resolvePhaseRoute(metric, phase) {
        const normalizedMetric = normalizeMetricName(metric);
        const normalizedPhase = normalizeMetricName(phase);

        if (!normalizedMetric || !normalizedPhase) return null;
        if (normalizedMetric === 'synergy' && normalizedPhase === 'high') return { type: 'synergy', phase: 'high' };
        if (normalizedMetric === 'harmony' && normalizedPhase === 'high') return { type: 'harmonic', phase: 'high' };
        if (normalizedMetric === 'corruption' && normalizedPhase === 'high') return { type: 'corruption', phase: 'high' };
        if (normalizedMetric === 'loadpressure' && normalizedPhase === 'high') return { type: 'stability', phase: 'high' };
        if (normalizedMetric === 'stability' && normalizedPhase === 'low') return { type: 'stability', phase: 'low' };
        return null;
    }

    function resolveNodeRegimeForType(type, payload = {}) {
        const node = resolveSourceNode(payload);
        if (!node) return null;

        const metrics = readNodeMetrics(node);
        if (type === 'harmonic') {
            return resolveHarmonicRegime(metrics.harmony, metrics.stability);
        }
        if (type === 'corruption') {
            return resolveCorruptionRegime(metrics.corruption);
        }
        if (type === 'stability') {
            return resolveStabilityRegime(metrics.stability, metrics.loadPressure);
        }
        return resolveSynergyRegime(metrics.synergy, metrics.corruption);
    }

    function resolveLinkRegimeForType(type, payload = {}) {
        const link = resolveLinkFromPayload(payload);
        if (!link) return null;

        const flowState = link?.userData?.flowState || {};
        const intensity = clamp01(payload.intensity ?? payload.strength ?? flowState.intensity);
        const energy = clamp01(payload.energy ?? flowState.energy);
        const value = Math.max(intensity, energy);
        const flowType = `${payload.conflictType || flowState.type || ''}`.toLowerCase();

        if (type === 'harmonic') {
            return resolveHarmonicRegime(value, 1 - value, flowType);
        }
        if (type === 'corruption') {
            return resolveCorruptionRegime(value, flowType === 'destructive');
        }
        if (type === 'stability') {
            return resolveStabilityRegime(1 - value, value, value);
        }
        return resolveSynergyRegime(value, clamp01(flowType === 'corruption' ? value : 0));
    }

    function resolveCurrentRegime(type, payload = {}, eventTag = '') {
        if (eventTag.startsWith('node.') || eventTag.startsWith('link.') || eventTag.startsWith('global.') || eventTag.startsWith('hub.')) {
            const scopedMetric = normalizeMetricName(payload.metric || eventTag.split('.')[1]);
            const tier = normalizeMetricName(payload.tier || eventTag.split('.')[2]);
            const value = clamp01(payload.value ?? payload.intensity ?? payload.strength ?? 0);

            if (scopedMetric === 'synergy') {
                return resolveSynergyRegime(value, clamp01(payload.corruption ?? payload.corruptionLevel ?? 0));
            }
            if (scopedMetric === 'harmony') {
                return resolveHarmonicRegime(value, clamp01(payload.stability ?? 1));
            }
            if (scopedMetric === 'corruption') {
                return resolveCorruptionRegime(value);
            }
            if (scopedMetric === 'stability' || scopedMetric === 'loadpressure') {
                return tier === 'low'
                    ? resolveStabilityRegime(value, 1 - value, value)
                    : resolveStabilityRegime(1 - value, value, value);
            }
        }

        if (eventTag === 'cascade.hop' || eventTag === 'cascade.start' || eventTag === 'harmonic.cascade.start') {
            return resolveLinkRegimeForType(type, payload) || resolveNodeRegimeForType(type, payload);
        }

        return resolveNodeRegimeForType(type, payload) || resolveLinkRegimeForType(type, payload);
    }

    function resolveBoundary(type, payload = {}, eventTag = '', sourceId = '') {
        const currentRegime = resolveCurrentRegime(type, payload, eventTag);
        if (!currentRegime) {
            if (type === 'corruption') {
                return { fromRegime: 'baseline', toRegime: 'rupture' };
            }
            if (type === 'stability') {
                return { fromRegime: 'baseline', toRegime: 'unstable' };
            }
            if (type === 'harmonic') {
                return { fromRegime: 'baseline', toRegime: 'aligned' };
            }
            return { fromRegime: 'baseline', toRegime: 'collaborative' };
        }

        const regimeKey = `${type}:${sourceId}`;
        const previousRegime = state.regimeBySource.get(regimeKey) || 'baseline';
        state.regimeBySource.set(regimeKey, currentRegime);
        return {
            fromRegime: previousRegime,
            toRegime: currentRegime
        };
    }

    function resolveIntentContext(payload = {}, eventTag = '') {
        const link = resolveLinkFromPayload(payload);
        const sourceNode = resolveSourceNode({ ...payload, link });
        const targetNode = resolveTargetNode({ ...payload, link });
        const linkId = resolveLinkId({ ...payload, link });
        const travel = !!linkId && (eventTag === 'cascade.hop' || eventTag === 'cascade.start' || eventTag === 'harmonic.cascade.start');

        return {
            link,
            linkId,
            sourceNode,
            targetNode,
            travel
        };
    }

    function handleSemanticMetricSignal(type, payload = {}, eventTag = '', phase = null) {
        const semanticPayload = payload?.detail && typeof payload.detail === 'object'
            ? payload.detail
            : payload;

        const resolvedPhase = phase ?? semanticPayload?.tier ?? semanticPayload?.phase ?? null;
        const sourceId = resolveSourceId(type, semanticPayload, eventTag);
        const nowSec = performance.now() * 0.001;
        if (resolvedPhase) {
            const metricKey = semanticPayload?.metric ?? type;
            if (shouldSkipMetricSignal(metricKey, sourceId, resolvedPhase, nowSec)) {
                return;
            }
        }

        emitIntent(type, semanticPayload, eventTag);
    }

    function resolveFromLinkPayload(link) {
        if (!link) return null;
        const sourceNode = link?.source || link?.sourceNode || link?.from || null;
        const targetNode = link?.target || link?.targetNode || link?.to || null;
        const sourcePos = asVector3(sourceNode?.position);
        const targetPos = asVector3(targetNode?.position);
        if (!sourcePos || !targetPos) return null;
        return new THREE.Vector3(
            (sourcePos.x + targetPos.x) * 0.5,
            (sourcePos.y + targetPos.y) * 0.5,
            (sourcePos.z + targetPos.z) * 0.5
        );
    }

    function resolveFromSourceTargetIds(payload = {}) {
        const sourceNode = findNodeById(payload.source || payload.sourceId || payload.from || payload.fromId);
        const targetNode = findNodeById(payload.target || payload.targetId || payload.to || payload.toId);
        if (!sourceNode || !targetNode) return null;
        return resolveFromLinkPayload({ source: sourceNode, target: targetNode });
    }

    function resolveFromNodeIdPayload(payload = {}) {
        const node = findNodeById(payload.nodeId || payload.sourceNodeId || payload.sourceId || payload.id);
        return asVector3(node?.position);
    }

    function resolveFromLinkIdPayload(payload = {}) {
        const link = findLinkById(payload.linkId || payload.id);
        return resolveFromLinkPayload(link);
    }

    function resolveSourcePosition(payload = {}) {
        return (
            asVector3(payload.sourcePosition) ||
            asVector3(payload.position) ||
            asVector3(payload.midpoint) ||
            asVector3(payload.center) ||
            asVector3(payload.origin) ||
            asVector3(payload.sourceNode?.position) ||
            asVector3(payload.node?.position) ||
            resolveFromLinkPayload(payload.link) ||
            resolveFromNodeIdPayload(payload) ||
            resolveFromLinkIdPayload(payload) ||
            resolveFromSourceTargetIds(payload)
        );
    }

    function resolveStrength(payload = {}) {
        const candidates = [
            payload.strength,
            payload.intensity,
            payload.value,
            payload.synergy,
            payload.corruption,
            payload.amount,
            payload.loadPressure,
            payload.load,
            payload.stress
        ];

        for (const candidate of candidates) {
            const strength = clamp01(candidate);
            if (strength > 0) return strength;
        }

        return 0;
    }

    function resolveSourceId(type, payload = {}, eventTag = '') {
        const intentContext = resolveIntentContext(payload, eventTag);
        const id =
            (intentContext.travel ? intentContext.linkId : null) ||
            resolveLinkId(payload) ||
            resolveNodeId(intentContext.sourceNode) ||
            payload.sourceNodeId ||
            payload.nodeId ||
            payload.sourceId ||
            payload.id ||
            payload.source;
        if (id !== undefined && id !== null && id !== '') return String(id);
        return `${type}:semantic`;
    }

    function emitIntent(type, payload = {}, eventTag = '') {
        const waveEngine = getWaveEngine();
        // DEBUG BYPASS: ak waveEngine existuje → nikdy neblokuj call
        if (!waveEngine) return;

        const nowSec = performance.now() * 0.001;

        // Fallback: ak sourcePosition neexistuje → použijeme payload.center alebo {0,0,0}
        const sourcePosition = resolveSourcePosition(payload) || payload?.center || { x: 0, y: 0, z: 0 };

        // Fallback: ak strength neexistuje → minimálne 0.5
        const safeStrength = Math.max(0.5, resolveStrength(payload) || 0.5);

        const resolvedType = resolveType(type, payload, eventTag);
        const sourceId = resolveSourceId(resolvedType, payload, eventTag);
        const cooldownKey = `${resolvedType}:${sourceId}`;
        // DEBUG: ignorujeme cooldown

        const intentContext = resolveIntentContext(payload, eventTag);
        const boundary = resolveBoundary(resolvedType, payload, eventTag, sourceId);

        const safePosition = {
            x: Number.isFinite(sourcePosition?.x) ? sourcePosition.x : 0,
            y: Number.isFinite(sourcePosition?.y) ? sourcePosition.y : 0,
            z: Number.isFinite(sourcePosition?.z) ? sourcePosition.z : 0
        };

        const intent = {
            type: resolvedType,
            reasonClass: 'semantic_event',
            strength: safeStrength,
            sourcePosition: safePosition,
            ...boundary,
            intensity: safeStrength,
            center: safePosition,
            sourceId,
            linkId: intentContext.linkId,
            link: intentContext.link,
            sourceNode: intentContext.sourceNode,
            targetNode: intentContext.targetNode,
            travel: intentContext.travel,
            metadata: {
                semanticEvent: eventTag,
                semanticType: type,
                resolvedType,
                conflictType: payload.conflictType || payload.link?.userData?.flowState?.type || null,
                metric: payload.metric || null,
                phase: payload.phase || payload.semanticPhase || null
            }
        };

        const snapshot = waveEngine.requestBurstIntent?.(intent) ?? null;
        recordIntent({
            timeSec: nowSec,
            semanticEvent: eventTag,
            semanticType: type,
            resolvedType,
            sourceId,
            fromRegime: boundary.fromRegime,
            toRegime: boundary.toRegime,
            intensity: safeStrength,
            linkId: intentContext.linkId || null,
            travel: intentContext.travel === true,
            accepted: !!snapshot,
            snapshotId: snapshot?.id || null
        });
        if (!snapshot) return;
        // DEBUG: ignorujeme markBurst (cooldown)
    }

    function subscribeToEvents() {
        const semanticBus = getSemanticBus();
        if (!semanticBus || state.subscribed) return false;

        const subscribeFn =
            (typeof semanticBus.subscribe === 'function' && semanticBus.subscribe.bind(semanticBus)) ||
            (typeof semanticBus.on === 'function' && semanticBus.on.bind(semanticBus)) ||
            null;
        const unsubscribeFn =
            (typeof semanticBus.unsubscribe === 'function' && semanticBus.unsubscribe.bind(semanticBus)) ||
            (typeof semanticBus.off === 'function' && semanticBus.off.bind(semanticBus)) ||
            null;

        if (!subscribeFn) return false;

        const bind = (tag, type, priority) => {
            const handler = (payload = {}) => emitIntent(type, payload, tag);
            subscribeFn(tag, handler, { priority });
            if (unsubscribeFn) {
                state.unsubscribers.push(() => unsubscribeFn(tag, handler));
            }
        };

        const bindSignal = (tag, type, phase, priority) => {
            const handler = (payload = {}) => handleSemanticMetricSignal(type, payload, tag, phase);
            subscribeFn(tag, handler, { priority });
            if (unsubscribeFn) {
                state.unsubscribers.push(() => unsubscribeFn(tag, handler));
            }
        };

        // Synergy gameplay events
        bindSignal('node.synergy.high', 'synergy', 'high', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        bindSignal('node.harmony.high', 'harmonic', 'high', semanticBus.priority?.NORMAL);
        bindSignal('link:synergyThreshold', 'synergy', 'high', semanticBus.priority?.NORMAL);
        bindSignal('link:harmonicLock', 'harmonic', 'high', semanticBus.priority?.NORMAL);
        bind('network:harmonyShift', 'harmonic', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);

        // Cascade gameplay events
        bind('cascade.start', 'cascade', semanticBus.priority?.NORMAL);
        bind('harmonic.cascade.start', 'cascade', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        bind('cascade.start', 'cascade', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        bind('cascade.hop', 'cascade', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);

        // Corruption gameplay events
        bindSignal('global.stability.low', 'stability', 'low', semanticBus.priority?.NORMAL);
        bindSignal('global.loadPressure.high', 'stability', 'high', semanticBus.priority?.NORMAL);
        bind('network:stressRise', 'stability', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        bindSignal('node.corruption.high', 'corruption', 'high', semanticBus.priority?.NORMAL);
        bind('network:corruptionSpread', 'corruption', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        bind('metrics.spike', 'corruption', semanticBus.priority?.CRITICAL ?? semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        bind('link:collapsed', 'corruption', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);

        state.subscribed = true;
        state.boundBus = semanticBus;
        return true;
    }

    function hasExpectedBindings(semanticBus) {
        const handlers = semanticBus?.handlers;
        if (!handlers || typeof handlers.get !== 'function') return true;
        for (const tag of EXPECTED_EVENT_TAGS) {
            const list = handlers.get(tag);
            if (!Array.isArray(list) || list.length === 0) return false;
        }
        return true;
    }

    function update() {
        const semanticBus = getSemanticBus();
        if (!semanticBus) {
            if (state.subscribed) dispose();
            return;
        }
        if (state.boundBus && state.boundBus !== semanticBus) {
            dispose();
        }
        if (state.subscribed && !hasExpectedBindings(semanticBus)) {
            dispose();
        }
        if (!state.subscribed) {
            subscribeToEvents();
        }
    }

    function dispose() {
        for (const unsubscribe of state.unsubscribers) {
            try {
                unsubscribe();
            } catch (_err) {
                // no-op
            }
        }
        state.unsubscribers = [];
        state.subscribed = false;
        state.boundBus = null;
    }

    subscribeToEvents();

    return {
        update,
        getStatus: () => ({
            subscribed: state.subscribed,
            lastBurstTime: state.lastBurstTime,
            activeCooldownKeys: state.lastBurstByKey.size,
            trackedRegimes: state.regimeBySource.size,
            cooldownSeconds: config.cooldownSeconds,
            subscriptions: state.unsubscribers.length
        }),
        getRecentIntents: (limit = 12) => {
            if (limit <= 0) return [];
            return state.recentIntents.slice(-limit).map(entry => ({ ...entry }));
        },
        dispose
    };
}
