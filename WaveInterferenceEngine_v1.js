import * as THREE from 'three';

const BURST_TYPES = Object.freeze({
    HARMONIC: 'harmonic',
    SYNERGY: 'synergy',
    CORRUPTION: 'corruption'
});

function clamp01(value) {
    return Math.max(0, Math.min(1, value ?? 0));
}

function asVector3(input, fallback = new THREE.Vector3()) {
    if (input instanceof THREE.Vector3) return input.clone();
    if (Array.isArray(input) && input.length >= 3) {
        return new THREE.Vector3(input[0], input[1], input[2]);
    }
    if (input && typeof input === 'object' &&
        Number.isFinite(input.x) &&
        Number.isFinite(input.y) &&
        Number.isFinite(input.z)) {
        return new THREE.Vector3(input.x, input.y, input.z);
    }
    return fallback.clone();
}

function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const key of Object.keys(value)) {
        deepFreeze(value[key]);
    }
    return value;
}

function getLinkMidpoint(link) {
    if (!link) return null;
    if (link.geometry?.attributes?.position?.array?.length >= 6) {
        const arr = link.geometry.attributes.position.array;
        return new THREE.Vector3(
            (arr[0] + arr[3]) * 0.5,
            (arr[1] + arr[4]) * 0.5,
            (arr[2] + arr[5]) * 0.5
        );
    }
    if (link.sourceNode?.position && link.targetNode?.position) {
        return new THREE.Vector3()
            .copy(link.sourceNode.position)
            .add(link.targetNode.position)
            .multiplyScalar(0.5);
    }
    return null;
}

/**
 * WaveInterferenceEngine_v1
 * Burst-only, event-driven snapshot publisher.
 *
 * Contract:
 * - No per-frame update loop
 * - No global graph traversal
 * - No node.userData/link.userData writes
 * - Immutable snapshot output for rendering systems
 */
export class WaveInterferenceEngine_v1 {
    constructor(options = {}) {
        this.enabled = options.enabled ?? true;
        this.timeSource = options.timeSource || { now: () => performance.now() * 0.001 };
        this.debugEnabled = options.enableDebug ?? false;
        this.warningsEnabled = options.enableWarnings ?? false;
        this.eventBus =
            options.eventBus ||
            options.semanticBus ||
            globalThis?.semanticBus ||
            globalThis?.game?.semanticBus ||
            null;
        this.reflectionSystem =
            options.reflectionSystem ||
            options.influenceReflection ||
            options.waveReflectionSystem ||
            globalThis?.waveReflectionSystem ||
            null;

        this.arbitrationPolicy = {
            allowCoexistence: options.allowCoexistence ?? false,
            supersedeOnHigherPriority: options.supersedeOnHigherPriority ?? true,
            priorityOrder: options.priorityOrder || [
                BURST_TYPES.CORRUPTION,
                BURST_TYPES.SYNERGY,
                BURST_TYPES.HARMONIC
            ]
        };

        this.profileDefaults = {
            harmonic: {
                radius: options.harmonicRadius ?? 18,
                riseSec: options.harmonicRiseSec ?? 0.12,
                decaySec: options.harmonicDecaySec ?? 1.4
            },
            synergy: {
                radius: options.synergyRadius ?? 22,
                riseSec: options.synergyRiseSec ?? 0.08,
                decaySec: options.synergyDecaySec ?? 1.2
            },
            corruption: {
                radius: options.corruptionRadius ?? 26,
                riseSec: options.corruptionRiseSec ?? 0.05,
                decaySec: options.corruptionDecaySec ?? 1.6
            }
        };

        this.triggerPolicies = {
            harmonic: {
                criticalRegimes: new Set(options.harmonicCriticalRegimes || ['coherent', 'aligned', 'resolved']),
                resetRegimes: new Set(options.harmonicResetRegimes || ['baseline', 'diffuse', 'unstable'])
            },
            synergy: {
                criticalRegimes: new Set(options.synergyCriticalRegimes || ['collaborative', 'convergent', 'reinforced']),
                resetRegimes: new Set(options.synergyResetRegimes || ['baseline', 'fragmented', 'decoherent'])
            },
            corruption: {
                criticalRegimes: new Set(options.corruptionCriticalRegimes || ['critical_divergence', 'rupture', 'contaminated']),
                resetRegimes: new Set(options.corruptionResetRegimes || ['baseline', 'contained', 'recovered'])
            }
        };

        this._activeBurst = null;
        this._snapshotCounter = 0;
        this._regimeState = new Map(); // `${type}:${sourceId}` -> { lastRegime, armed }
        this._lifecycleHistory = [];
        this._maxLifecycleEntries = options.maxLifecycleEntries ?? 80;
        this._fieldSuppressed = false;
        this._fieldSuppressionHandler = options.onFieldSuppressionChange || null;
        this._lifecycleHandler = options.onLifecycleEvent || null;
    }

    requestUpdate(reason, context = {}) {
        if (!this.enabled) return null;
        if (context?.burstIntent) return this.requestBurstIntent(context.burstIntent);

        if (context?.type || context?.burstType) {
            return this.requestBurstIntent({
                ...context,
                type: context.type || context.burstType
            });
        }

        if (reason === 'MANUAL_DEBUG' && context?.type) {
            return this.requestBurstIntent(context);
        }

        if (reason === 'PHASE_CHANGED' && context?.toRegime && context?.type) {
            return this.requestBurstIntent(context);
        }

        if (this.warningsEnabled) {
            console.warn('[WaveInterferenceEngine] Unsupported requestUpdate reason for burst mode:', reason);
        }
        return null;
    }

    requestBurstIntent(intent = {}) {
        if (!this.enabled) return null;

        const normalized = this._normalizeIntent(intent);
        if (!normalized) return null;

        this._emitLifecycle('requested', { intent: normalized });

        const crossing = this._evaluateCrossing(normalized);
        if (!crossing.accepted) {
            this._emitLifecycle('rejected', {
                reason: crossing.reason,
                intent: normalized
            });
            return null;
        }

        const arbitration = this._evaluateArbitration(normalized);
        if (!arbitration.accepted) {
            this._emitLifecycle('rejected', {
                reason: arbitration.reason,
                intent: normalized
            });
            return null;
        }

        if (arbitration.superseded) {
            this._completeActiveBurst('superseded');
        }

        const snapshot = this._buildSnapshot(normalized);
        this._activeBurst = {
            snapshot,
            center: asVector3(snapshot.spatial.center),
            direction: snapshot.spatial.directionalBias
                ? asVector3(snapshot.spatial.directionalBias, new THREE.Vector3(0, 0, 0)).normalize()
                : null
        };

        this._setFieldSuppressed(true, snapshot);
        this._registerBoundaryReflection(normalized);
        this._emitLifecycle('accepted', { snapshot, intent: normalized });
        this._emitLifecycle('started', { snapshot, intent: normalized });
        this._emitWavePacketSpawn(normalized, snapshot);

        return snapshot;
    }

    requestBurst(intent = {}) {
        return this.requestBurstIntent(intent);
    }

    getActiveSnapshot() {
        this._syncBurstLifecycle();
        return this._activeBurst?.snapshot || null;
    }

    getNodeWaveField(nodeId, nodeRef = null) {
        this._syncBurstLifecycle();
        if (!this._activeBurst) return null;
        const position = nodeRef?.position ? asVector3(nodeRef.position) : null;
        if (!position) return null;
        return this._sampleBurstAtPosition(position, this.timeSource.now());
    }

    getLinkWaveField(linkId, linkRef = null) {
        this._syncBurstLifecycle();
        if (!this._activeBurst) return null;
        const midpoint = getLinkMidpoint(linkRef);
        if (!midpoint) return null;
        return this._sampleBurstAtPosition(midpoint, this.timeSource.now());
    }

    getWaveFieldForEntity(entity, isLink = false) {
        if (!entity) return null;
        if (isLink) return this.getLinkWaveField(entity.id || entity.uuid || entity.name, entity);
        return this.getNodeWaveField(entity.id || entity.uuid || entity.name, entity);
    }

    isBurstActive() {
        this._syncBurstLifecycle();
        return !!this._activeBurst;
    }

    getBurstLifecycleEvents(limit = 20) {
        if (limit <= 0) return [];
        return this._lifecycleHistory.slice(-limit).map(entry => ({ ...entry }));
    }

    getMetrics() {
        this._syncBurstLifecycle();
        return {
            enabled: this.enabled,
            activeBurstType: this._activeBurst?.snapshot?.type || null,
            activeBurstId: this._activeBurst?.snapshot?.id || null,
            fieldSuppressed: this._fieldSuppressed,
            lifecycleEventsTracked: this._lifecycleHistory.length,
            regimeKeysTracked: this._regimeState.size
        };
    }

    getActiveSources() {
        this._syncBurstLifecycle();
        if (!this._activeBurst) return [];
        const snapshot = this._activeBurst.snapshot;
        return [{
            id: snapshot.id,
            type: snapshot.type,
            sourceId: snapshot.sourceId,
            center: snapshot.spatial.center,
            timeline: snapshot.timeline
        }];
    }

    update() {
        // Burst mode intentionally has no per-frame solver path.
        return false;
    }

    clear() {
        this._completeActiveBurst('cleared');
        this._regimeState.clear();
    }

    dispose() {
        this.clear();
        this._lifecycleHistory = [];
    }

    _normalizeIntent(intent) {
        const rawType = `${intent?.type || ''}`.toLowerCase();
        const type = rawType === 'cascadehop' ? BURST_TYPES.SYNERGY : rawType;
        if (!Object.values(BURST_TYPES).includes(type)) {
            if (this.warningsEnabled) console.warn('[WaveInterferenceEngine] Invalid burst type in intent:', intent?.type);
            return null;
        }

        const sourceId = `${intent?.sourceId || intent?.originId || 'global'}`;
        const prevKey = `${type}:${sourceId}`;
        const prevState = this._regimeState.get(prevKey);
        const fromRegime = `${intent?.fromRegime || prevState?.lastRegime || 'unknown'}`;
        const toRegime = `${intent?.toRegime || intent?.regime || 'unknown'}`;

        return {
            type,
            sourceId,
            reasonClass: intent?.reasonClass || 'regime_transition',
            fromRegime,
            toRegime,
            center: asVector3(intent?.center || intent?.originPosition || intent?.position),
            direction: intent?.direction ? asVector3(intent.direction, new THREE.Vector3(0, 0, 0)) : null,
            scope: intent?.scope || {},
            intensityEnvelope: intent?.intensityEnvelope || {},
            decayProfile: intent?.decayProfile || {},
            renderPayload: intent?.renderPayload || {},
            metadata: intent?.metadata || {},
            timestamp: intent?.timestamp,
            sourceNode: intent?.sourceNode || null,
            targetNode: intent?.targetNode || null,
            linkId: intent?.linkId || intent?.link?.id || intent?.link?.uuid || null
        };
    }

    _registerBoundaryReflection(intent) {
        const reflectionSystem =
            this.reflectionSystem ||
            globalThis?.game?.influenceReflection ||
            globalThis?.waveReflectionSystem ||
            null;
        if (!reflectionSystem) return;
        if (!intent?.linkId) return;

        const reflection = {
            linkId: intent.linkId,
            phase: intent?.metadata?.phase ?? 0,
            intensity: clamp01((intent?.intensityEnvelope?.peak ?? 1.0) * 0.7),
            time: this.timeSource.now()
        };
        if (typeof reflectionSystem.registerReflection === 'function') {
            reflectionSystem.registerReflection(reflection);
            return;
        }

        // Fallback wiring for reflection systems exposing pulse pools.
        const pool = Array.isArray(reflectionSystem.reflectionPulsePool) ? reflectionSystem.reflectionPulsePool : null;
        if (pool) {
            const pulse = pool.find((p) => p && !p.active);
            if (pulse) {
                pulse.active = true;
                pulse.linkId = reflection.linkId;
                pulse.phase = reflection.phase;
                pulse.intensity = reflection.intensity;
                pulse.time = reflection.time;
                pulse.life = 0;
                pulse.maxLife = Number.isFinite(pulse.maxLife) ? pulse.maxLife : 0.5;
                if (Array.isArray(reflectionSystem.reflectionPulses)) {
                    reflectionSystem.reflectionPulses.push(pulse);
                }
            }
        }
    }

    _evaluateCrossing(intent) {
        const key = `${intent.type}:${intent.sourceId}`;
        const policy = this.triggerPolicies[intent.type];
        const state = this._regimeState.get(key) || { lastRegime: intent.fromRegime, armed: true };

        if (intent.fromRegime === intent.toRegime) {
            this._regimeState.set(key, { ...state, lastRegime: intent.toRegime });
            return { accepted: false, reason: 'no_boundary_crossing' };
        }

        const isCriticalEntry = policy.criticalRegimes.has(intent.toRegime);
        const isReset = policy.resetRegimes.has(intent.toRegime);

        if (isReset) {
            this._regimeState.set(key, { lastRegime: intent.toRegime, armed: true });
            return { accepted: false, reason: 'rearmed' };
        }

        if (!isCriticalEntry) {
            this._regimeState.set(key, { ...state, lastRegime: intent.toRegime });
            return { accepted: false, reason: 'not_critical_entry' };
        }

        if (!state.armed) {
            this._regimeState.set(key, { ...state, lastRegime: intent.toRegime });
            return { accepted: false, reason: 'critical_entry_locked_until_reset' };
        }

        this._regimeState.set(key, { lastRegime: intent.toRegime, armed: false });
        return { accepted: true };
    }

    _evaluateArbitration(intent) {
        if (!this._activeBurst) return { accepted: true, superseded: false };
        if (this.arbitrationPolicy.allowCoexistence) return { accepted: true, superseded: false };

        const currentType = this._activeBurst.snapshot.type;
        if (currentType === intent.type) {
            return { accepted: false, reason: 'active_burst_same_type' };
        }

        const incomingPriority = this.arbitrationPolicy.priorityOrder.indexOf(intent.type);
        const activePriority = this.arbitrationPolicy.priorityOrder.indexOf(currentType);
        const incomingIsHigher = incomingPriority >= 0 && activePriority >= 0 && incomingPriority < activePriority;

        if (incomingIsHigher && this.arbitrationPolicy.supersedeOnHigherPriority) {
            return { accepted: true, superseded: true };
        }

        return { accepted: false, reason: 'active_burst_conflict' };
    }

    _buildSnapshot(intent) {
        const typeDefaults = this.profileDefaults[intent.type];
        const startAt = intent.timestamp ?? this.timeSource.now();
        const riseSec = intent.intensityEnvelope?.riseSec ?? typeDefaults.riseSec;
        const decaySec = intent.decayProfile?.decaySec ?? typeDefaults.decaySec;
        const peakAt = startAt + riseSec;
        const endAt = peakAt + decaySec;
        const radius = intent.scope?.radius ?? typeDefaults.radius;

        const snapshot = {
            id: `wave_burst_${++this._snapshotCounter}`,
            type: intent.type,
            sourceId: intent.sourceId,
            reasonClass: intent.reasonClass,
            regime: {
                from: intent.fromRegime,
                to: intent.toRegime
            },
            spatial: {
                center: { x: intent.center.x, y: intent.center.y, z: intent.center.z },
                scope: {
                    mode: intent.scope?.mode || 'local',
                    radius,
                    radiusHint: intent.scope?.radiusHint || 'cluster'
                },
                directionalBias: intent.direction
                    ? { x: intent.direction.x, y: intent.direction.y, z: intent.direction.z }
                    : null
            },
            intensityEnvelope: {
                profile: intent.intensityEnvelope?.profile || 'impulse_peak_fade',
                riseSec
            },
            decayProfile: {
                profile: intent.decayProfile?.profile || 'natural_release',
                decaySec
            },
            renderPayload: {
                palette: intent.renderPayload?.palette || intent.type,
                style: intent.renderPayload?.style || 'burst'
            },
            manifest: {
                layer: 'BURST',
                silencesFields: true,
                coexistenceAllowed: this.arbitrationPolicy.allowCoexistence
            },
            metadata: intent.metadata,
            createdAt: startAt,
            timeline: { startAt, peakAt, endAt }
        };

        return deepFreeze(snapshot);
    }

    _syncBurstLifecycle() {
        if (!this._activeBurst) return;
        const now = this.timeSource.now();
        if (now >= this._activeBurst.snapshot.timeline.endAt) {
            this._completeActiveBurst('completed');
        }
    }

    _sampleBurstAtPosition(position, nowSec) {
        this._syncBurstLifecycle();
        if (!this._activeBurst) return null;

        const snapshot = this._activeBurst.snapshot;
        const timeline = snapshot.timeline;
        if (nowSec < timeline.startAt || nowSec > timeline.endAt) return null;

        const riseDuration = Math.max(0.0001, timeline.peakAt - timeline.startAt);
        const decayDuration = Math.max(0.0001, timeline.endAt - timeline.peakAt);

        let envelope = 0;
        if (nowSec <= timeline.peakAt) {
            envelope = clamp01((nowSec - timeline.startAt) / riseDuration);
        } else {
            envelope = clamp01(1 - ((nowSec - timeline.peakAt) / decayDuration));
        }

        const center = this._activeBurst.center;
        const radius = Math.max(0.001, snapshot.spatial.scope.radius || 1);
        const distance = center.distanceTo(position);
        const radialAttenuation = clamp01(1 - (distance / radius));

        let directionalBias = 1;
        if (this._activeBurst.direction && this._activeBurst.direction.lengthSq() > 0) {
            const toPoint = new THREE.Vector3().copy(position).sub(center);
            if (toPoint.lengthSq() > 0) {
                directionalBias = clamp01((toPoint.normalize().dot(this._activeBurst.direction) + 1) * 0.5);
            }
        }

        const amplitude = clamp01(envelope * radialAttenuation * directionalBias);
        if (amplitude <= 0) return null;

        const totalDuration = Math.max(0.0001, timeline.endAt - timeline.startAt);
        const phase01 = clamp01((nowSec - timeline.startAt) / totalDuration);
        const phaseRadians = phase01 * Math.PI * 2;

        let constructive = amplitude;
        let destructive = amplitude * 0.1;
        let standing = amplitude * 0.5;

        if (snapshot.type === BURST_TYPES.HARMONIC) {
            constructive = amplitude;
            destructive = amplitude * 0.05;
            standing = amplitude * 0.7;
        } else if (snapshot.type === BURST_TYPES.SYNERGY) {
            constructive = amplitude * 0.85;
            destructive = amplitude * 0.12;
            standing = amplitude * 0.55;
        } else if (snapshot.type === BURST_TYPES.CORRUPTION) {
            constructive = amplitude * 0.2;
            destructive = amplitude * 0.95;
            standing = amplitude * 0.35;
        }

        return {
            totalAmplitude: amplitude,
            constructivePower: clamp01(constructive),
            destructivePower: clamp01(destructive),
            interferenceIndex: clamp01((constructive + destructive) * 0.5),
            standingWaveFactor: clamp01(standing),
            travelPhase: phase01,
            sourceCount: 1,
            timestamp: nowSec,
            amplitude,
            constructive: clamp01(constructive),
            destructive: clamp01(destructive),
            standing: clamp01(standing),
            phase: phaseRadians,
            harmonicLevel: snapshot.type === BURST_TYPES.CORRUPTION ? 0 : clamp01(amplitude),
            destructiveInterference: clamp01(destructive)
        };
    }

    _completeActiveBurst(reason) {
        if (!this._activeBurst) return;
        const snapshot = this._activeBurst.snapshot;
        this._emitLifecycle('ended', {
            reason,
            snapshot
        });
        this._activeBurst = null;
        this._setFieldSuppressed(false, snapshot);
    }

    _setFieldSuppressed(active, snapshot = null) {
        if (this._fieldSuppressed === active) return;
        this._fieldSuppressed = active;
        if (typeof this._fieldSuppressionHandler === 'function') {
            try {
                this._fieldSuppressionHandler(active, snapshot);
            } catch (err) {
                console.warn('[WaveInterferenceEngine] field suppression callback error:', err);
            }
        }
    }

    _emitLifecycle(state, payload) {
        const entry = {
            state,
            timestamp: this.timeSource.now(),
            payload: payload || {}
        };
        this._lifecycleHistory.push(entry);
        if (this._lifecycleHistory.length > this._maxLifecycleEntries) {
            this._lifecycleHistory.shift();
        }
        if (typeof this._lifecycleHandler === 'function') {
            try {
                this._lifecycleHandler(entry);
            } catch (err) {
                console.warn('[WaveInterferenceEngine] lifecycle callback error:', err);
            }
        }
        if (this.debugEnabled) {
            console.log('[WaveInterferenceEngine]', state, payload || '');
        }
    }

    _emitWavePacketSpawn(intent, snapshot) {
        const bus =
            this.eventBus ||
            globalThis?.semanticBus ||
            globalThis?.game?.semanticBus ||
            null;
        if (!bus) return;

        const payload = {
            linkId: intent?.linkId || null,
            sourceNode: intent?.sourceNode || null,
            targetNode: intent?.targetNode || null,
            phase: intent?.metadata?.phase ?? 0,
            intensity: clamp01(intent?.intensityEnvelope?.peak ?? 1.0),
            type: intent?.type || snapshot?.type || 'harmonic',
            center: snapshot?.spatial?.center || null
        };

        if (typeof bus.emit === 'function') {
            if (bus.priority) {
                bus.emit('wave.packet.spawn', payload, {
                    priority: bus.priority.INTERACTIVE ?? bus.priority.NORMAL
                });
                return;
            }
            bus.emit('wave.packet.spawn', payload);
            return;
        }

        if (typeof bus.publish === 'function') {
            bus.publish('wave.packet.spawn', payload);
        }
    }
}

export class WaveInterferenceBurstSystem_v1 extends WaveInterferenceEngine_v1 {}
export default WaveInterferenceEngine_v1;
