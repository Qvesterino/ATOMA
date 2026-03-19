import * as THREE from 'three';

export function setupWaveBurstRouter(game) {
    const EXPECTED_EVENT_TAGS = [
        'node.synergy.high',
        'link:synergyThreshold',
        'metric:synergySpike',
        'metric.synergy.burst',
        'link:harmonicLock',
        'metric:harmonyPeak',
        'network:harmonyShift',
        'cascade.triggered',
        'harmonic.cascade.start',
        'cascade.start',
        'cascade.hop',
        'metric:stabilityDrop',
        'metric:loadPressureHigh',
        'network:stressRise',
        'metric:corruptionRise',
        'metric.corruption.spike',
        'metric.corruption.spread',
        'network:corruptionSpread',
        'metrics.spike',
        'link:collapsed'
    ];

    const config = {
        cooldownSeconds: 1.5
    };

    const state = {
        lastBurstTime: 0,
        lastBurstByKey: new Map(),
        boundBus: null,
        emitHookRestore: null,
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
        const nodeLinkingLinks = game?.nodeLinking?.links;
        const linkList = game?.links || game?.linkList;
        if (Array.isArray(linkingLinks) && linkingLinks.length > 0) return linkingLinks;
        if (Array.isArray(nodeLinkingLinks) && nodeLinkingLinks.length > 0) return nodeLinkingLinks;
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

    function resolveType(type) {
        if (type === 'cascade') return 'synergy';
        return type;
    }

    function resolveBoundary(type) {
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

    function resolveSourceId(type, payload = {}) {
        const id = payload.sourceId || payload.nodeId || payload.id || payload.linkId || payload.source;
        if (id !== undefined && id !== null && id !== '') return String(id);
        return `${type}:semantic`;
    }

    function emitIntent(type, payload = {}, eventTag = '') {
        const waveEngine = getWaveEngine();
        if (!waveEngine || typeof waveEngine.requestBurstIntent !== 'function') return;

        const nowSec = performance.now() * 0.001;

        const sourcePosition = resolveSourcePosition(payload);
        if (!sourcePosition) return;

        const strength = resolveStrength(payload);
        if (strength <= 0) return;

        const sourceId = resolveSourceId(type, payload);
        const cooldownKey = `${type}:${sourceId}`;
        if (isOnCooldown(cooldownKey, nowSec)) return;

        const intent = {
            type: resolveType(type),
            reasonClass: 'semantic_event',
            strength,
            sourcePosition: {
                x: sourcePosition.x,
                y: sourcePosition.y,
                z: sourcePosition.z
            },
            ...resolveBoundary(type),
            intensity: strength,
            center: {
                x: sourcePosition.x,
                y: sourcePosition.y,
                z: sourcePosition.z
            },
            sourceId,
            metadata: {
                semanticEvent: eventTag,
                semanticType: type
            }
        };

        const snapshot = waveEngine.requestBurstIntent(intent);
        if (!snapshot) return;
        markBurst(cooldownKey, nowSec);
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

        const EVENT_TYPE_BY_TAG = new Map([
            ['node.synergy.high', 'synergy'],
            ['link:synergyThreshold', 'synergy'],
            ['metric:synergySpike', 'synergy'],
            ['metric.synergy.burst', 'synergy'],
            ['link:harmonicLock', 'harmonic'],
            ['metric:harmonyPeak', 'harmonic'],
            ['network:harmonyShift', 'harmonic'],
            ['cascade.triggered', 'cascade'],
            ['harmonic.cascade.start', 'cascade'],
            ['cascade.start', 'cascade'],
            ['cascade.hop', 'cascade'],
            ['metric:stabilityDrop', 'stability'],
            ['metric:loadPressureHigh', 'stability'],
            ['network:stressRise', 'stability'],
            ['metric:corruptionRise', 'corruption'],
            ['metric.corruption.spike', 'corruption'],
            ['metric.corruption.spread', 'corruption'],
            ['network:corruptionSpread', 'corruption'],
            ['metrics.spike', 'corruption'],
            ['link:collapsed', 'corruption']
        ]);

        const emitFn = semanticBus.emit;
        if (typeof emitFn === 'function' && !state.emitHookRestore) {
            const originalEmit = emitFn.bind(semanticBus);
            semanticBus.emit = (tag, payload, opts) => {
                const eventType = EVENT_TYPE_BY_TAG.get(tag);
                if (eventType) {
                    emitIntent(eventType, payload || {}, tag);
                }
                return originalEmit(tag, payload, opts);
            };
            state.emitHookRestore = () => {
                semanticBus.emit = emitFn;
            };
        }

        // Synergy gameplay events
        bind('node.synergy.high', 'synergy', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        bind('link:synergyThreshold', 'synergy', semanticBus.priority?.NORMAL);
        bind('metric:synergySpike', 'synergy', semanticBus.priority?.NORMAL);
        bind('metric.synergy.burst', 'synergy', semanticBus.priority?.NORMAL);
        bind('link:harmonicLock', 'harmonic', semanticBus.priority?.NORMAL);
        bind('metric:harmonyPeak', 'harmonic', semanticBus.priority?.NORMAL);
        bind('network:harmonyShift', 'harmonic', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);

        // Cascade gameplay events
        bind('cascade.triggered', 'cascade', semanticBus.priority?.NORMAL);
        bind('harmonic.cascade.start', 'cascade', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        bind('cascade.start', 'cascade', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        bind('cascade.hop', 'cascade', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);

        // Corruption gameplay events
        bind('metric:stabilityDrop', 'stability', semanticBus.priority?.NORMAL);
        bind('metric:loadPressureHigh', 'stability', semanticBus.priority?.NORMAL);
        bind('network:stressRise', 'stability', semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        bind('metric:corruptionRise', 'corruption', semanticBus.priority?.NORMAL);
        bind('metric.corruption.spike', 'corruption', semanticBus.priority?.NORMAL);
        bind('metric.corruption.spread', 'corruption', semanticBus.priority?.NORMAL);
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
        if (typeof state.emitHookRestore === 'function') {
            try {
                state.emitHookRestore();
            } catch (_err) {
                // no-op
            }
        }
        state.emitHookRestore = null;
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
            cooldownSeconds: config.cooldownSeconds,
            subscriptions: state.unsubscribers.length
        }),
        dispose
    };
}
