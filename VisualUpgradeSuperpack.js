import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

// Typed array safety helpers (local-only)
function isValidTypedArray(arr) {
  return !!(arr && arr.buffer && typeof arr.byteLength === 'number' && arr.byteLength > 0);
}

function isValidBufferAttrArray(attr) {
  const arr = attr && attr.array;
  return isValidTypedArray(arr);
}

const __edgesOffenders = new Set();

const WORLD_MACRO_PROFILES = Object.freeze({
    DORMANT: Object.freeze({
        masterScale: 0.68,
        edgeGlowScale: 0.72,
        volumetricScale: 0.58,
        fogScale: 0.62,
        distortionScale: 0.5,
        riftScale: 0.52,
        particleScale: 0.56,
        cameraAuraScale: 0.6
    }),
    AWAKENING: Object.freeze({
        masterScale: 0.9,
        edgeGlowScale: 0.92,
        volumetricScale: 0.88,
        fogScale: 0.92,
        distortionScale: 0.78,
        riftScale: 0.82,
        particleScale: 0.9,
        cameraAuraScale: 0.86
    }),
    COMMUNION: Object.freeze({
        masterScale: 1.02,
        edgeGlowScale: 1.0,
        volumetricScale: 1.08,
        fogScale: 1.06,
        distortionScale: 0.72,
        riftScale: 0.92,
        particleScale: 1.04,
        cameraAuraScale: 1.06
    }),
    SCHISM: Object.freeze({
        masterScale: 1.08,
        edgeGlowScale: 1.06,
        volumetricScale: 0.82,
        fogScale: 0.8,
        distortionScale: 1.22,
        riftScale: 1.18,
        particleScale: 0.9,
        cameraAuraScale: 0.86
    }),
    REVELATION: Object.freeze({
        masterScale: 1.18,
        edgeGlowScale: 1.12,
        volumetricScale: 1.16,
        fogScale: 1.1,
        distortionScale: 0.68,
        riftScale: 1.0,
        particleScale: 1.12,
        cameraAuraScale: 1.16
    })
});

const SPECTACLE_PRESETS = Object.freeze({
    generic: Object.freeze({
        priority: 0,
        masterScale: 1.0,
        edgeGlowScale: 1.0,
        volumetricScale: 1.0,
        fogScale: 1.0,
        distortionScale: 1.0,
        riftScale: 1.0,
        particleScale: 1.0,
        cameraAuraScale: 1.0,
        attack: 0.08,
        sustain: 0.18,
        release: 0.42,
        heroBurstMs: 900
    }),
    'link.created': Object.freeze({
        priority: 10,
        masterScale: 0.68,
        edgeGlowScale: 1.16,
        volumetricScale: 1.05,
        fogScale: 1.02,
        distortionScale: 0.98,
        riftScale: 1.04,
        particleScale: 1.16,
        cameraAuraScale: 1.02,
        attack: 0.08,
        sustain: 0.16,
        release: 0.34,
        heroBurstMs: 900
    }),
    warning: Object.freeze({
        priority: 20,
        masterScale: 0.42,
        edgeGlowScale: 1.06,
        volumetricScale: 1.03,
        fogScale: 1.01,
        distortionScale: 1.08,
        riftScale: 1.03,
        particleScale: 1.02,
        cameraAuraScale: 1.02,
        attack: 0.1,
        sustain: 0.08,
        release: 0.42,
        heroBurstMs: 700
    }),
    critical: Object.freeze({
        priority: 50,
        masterScale: 0.88,
        edgeGlowScale: 1.14,
        volumetricScale: 0.96,
        fogScale: 0.92,
        distortionScale: 1.18,
        riftScale: 1.18,
        particleScale: 0.92,
        cameraAuraScale: 0.94,
        attack: 0.06,
        sustain: 0.12,
        release: 0.76,
        heroBurstMs: 1200
    }),
    collapse: Object.freeze({
        priority: 90,
        masterScale: 1.16,
        edgeGlowScale: 1.18,
        volumetricScale: 0.9,
        fogScale: 0.88,
        distortionScale: 1.32,
        riftScale: 1.36,
        particleScale: 0.84,
        cameraAuraScale: 0.9,
        attack: 0.05,
        sustain: 0.12,
        release: 1.34,
        heroBurstMs: 2000
    }),
    recovery: Object.freeze({
        priority: 30,
        masterScale: 0.84,
        edgeGlowScale: 1.0,
        volumetricScale: 1.08,
        fogScale: 1.1,
        distortionScale: 0.86,
        riftScale: 0.94,
        particleScale: 1.04,
        cameraAuraScale: 1.08,
        attack: 0.12,
        sustain: 0.24,
        release: 0.9,
        heroBurstMs: 1500
    }),
    'cascade.start': Object.freeze({
        priority: 60,
        masterScale: 0.96,
        edgeGlowScale: 1.1,
        volumetricScale: 1.16,
        fogScale: 1.05,
        distortionScale: 1.08,
        riftScale: 1.16,
        particleScale: 1.08,
        cameraAuraScale: 1.06,
        attack: 0.14,
        sustain: 0.18,
        release: 0.82,
        heroBurstMs: 1600
    }),
    'cascade.hop': Object.freeze({
        priority: 35,
        masterScale: 0.82,
        edgeGlowScale: 1.05,
        volumetricScale: 1.04,
        fogScale: 1.01,
        distortionScale: 1.04,
        riftScale: 1.08,
        particleScale: 1.02,
        cameraAuraScale: 1.01,
        attack: 0.06,
        sustain: 0.08,
        release: 0.5,
        heroBurstMs: 650
    }),
    'cascade.end': Object.freeze({
        priority: 25,
        masterScale: 0.74,
        edgeGlowScale: 1.02,
        volumetricScale: 1.02,
        fogScale: 1.02,
        distortionScale: 0.96,
        riftScale: 0.98,
        particleScale: 1.01,
        cameraAuraScale: 1.0,
        attack: 0.1,
        sustain: 0.14,
        release: 0.9,
        heroBurstMs: 1000
    }),
    rupture: Object.freeze({
        priority: 80,
        masterScale: 1.08,
        edgeGlowScale: 1.12,
        volumetricScale: 0.95,
        fogScale: 0.93,
        distortionScale: 1.22,
        riftScale: 1.28,
        particleScale: 0.9,
        cameraAuraScale: 0.96,
        attack: 0.05,
        sustain: 0.14,
        release: 1.12,
        heroBurstMs: 1800
    })
});

function logEdgeOffender(ctx = {}, reason, details = {}) {
  const meshUUID = ctx.meshUUID || 'noMesh';
  const geoUUID = ctx.geoUUID || ctx.geometry?.uuid || 'noGeo';
  const key = `${meshUUID}|${geoUUID}|${reason}`;
  if (__edgesOffenders.has(key)) return;
  __edgesOffenders.add(key);

  // Toggle window.__ATOMA_DEBUG_EDGES = true to reveal offender details (rate-limited per mesh)
  if (window?.__ATOMA_DEBUG_EDGES === true) {
    console.warn('[EdgeVFX][Offender]', reason, {
      meshName: ctx.meshName || 'unnamed',
      meshUUID,
      geoUUID,
      sourceTag: ctx.sourceTag,
      ...details
    });
  }
}

/**
 * ATOMA Visual Upgrade Superpack
 * 8 Complete Enhancement Packs - 100% Safe, Non-Destructive
 * All layers added ON TOP of existing environment
 */

function safeEdgesGeometry(geometry, ctx = {}) {
  if (!geometry || !(geometry.isBufferGeometry || geometry instanceof THREE.BufferGeometry)) {
    logEdgeOffender(ctx, 'missingGeometry', {
      drawRange: geometry?.drawRange
    });
    return null;
  }

  const posAttr = geometry.attributes?.position;
  if (!isValidBufferAttrArray(posAttr) || posAttr.array.length < 6) {
    logEdgeOffender(ctx, 'missingPositions', {
      posLength: posAttr?.array?.length || 0
    });
    return null;
  }

  for (let i = 0; i < posAttr.array.length; i++) {
    if (!Number.isFinite(posAttr.array[i])) {
      logEdgeOffender(ctx, 'invalidPosition', {
        value: posAttr.array[i],
        idx: i,
        posLength: posAttr.array.length
      });
      return null;
    }
  }

  const indexAttr = geometry.index;
  if (indexAttr && !isValidTypedArray(indexAttr.array)) {
    logEdgeOffender(ctx, 'invalidIndex', {
      indexLength: indexAttr?.array?.length || 0
    });
    return null;
  }
  if (indexAttr && indexAttr.array?.length === 0) {
    logEdgeOffender(ctx, 'emptyIndex', {});
    return null;
  }

  const src = geometry.clone();
  const drawRange = geometry.drawRange;
  if (drawRange && (!Number.isFinite(drawRange.count) || drawRange.count <= 0)) {
    const count = src.attributes?.position?.count || (posAttr.array.length / 3);
    src.setDrawRange(0, count);
  }

  const edges = new THREE.EdgesGeometry(src);
  src.dispose();

  const edgePos = edges.attributes?.position;
  if (!isValidBufferAttrArray(edgePos) || edgePos.array.length === 0) {
    logEdgeOffender(ctx, 'edgesEmpty', {
      drawRange: edges.drawRange,
      posLength: edgePos?.array?.length || 0
    });
    edges.dispose();
    return null;
  }

  for (let i = 0; i < edgePos.array.length; i++) {
    if (!Number.isFinite(edgePos.array[i])) {
      logEdgeOffender(ctx, 'edgesNaN', {
        value: edgePos.array[i],
        idx: i,
        length: edgePos.array.length
      });
      edges.dispose();
      return null;
    }
  }

  return edges;
}

export class VisualUpgradeSuperpack {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.root = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.time = 0;
        this._timeOrigin = undefined;
        this._lastVisualTime = undefined;

        // Cached vectors — zero per-frame allocations
        this._vec3a = new THREE.Vector3();
        this._vec3b = new THREE.Vector3();
        this._vec3c = new THREE.Vector3();

        // Pack components
        this.volumetricLights = [];
        this.atmosphericLayers = [];
        this.edgeGlowObjects = [];
        this.distortionZones = [];
        this.rifts = [];
        this.particles = [];
        this.spectralCaustics = [];
        this.cameraAura = null;
        this.sharedTextures = {};
        this.postEffects = {
            bloom: null,
            vignette: null,
            chromatic: null,
            shimmer: null
        };
        this.qualityTier = 'HIGH';
        this._qualityProfile = this._getQualityProfile(this.qualityTier);
        this._applied = false;

        // Smooth fade
        this._fadeOpacity = 1;
        this._targetOpacity = 1;
        this._fadeSpeed = 2.5;

        // Metrics reactivity (smoothed)
        this._metrics = {
            harmony: 0.5,
            corruption: 0,
            synergy: 0.5,
            stability: 0.5
        };

        this._worldContext = {
            consciousnessState: null,
            worldMoodState: null,
            networkState: null,
            worldMacroState: 'DORMANT'
        };
        this._macroState = 'DORMANT';
        this._macroProfile = WORLD_MACRO_PROFILES.DORMANT;
        this._macroPayload = null;
        this._semanticBus = null;
        this._semanticBusUnsubs = [];
        this._spectacleState = null;
        this._spectacleQueue = [];

        // Hero layer state machine — world-state-gated atmosphere
        // Dormant = hero objects hidden, zero per-frame cost
        // Active = hero objects visible, metrics modulate intensity
        this._heroState = 'dormant'; // 'dormant' | 'activating' | 'active' | 'fading'
        this._heroOpacity = 0;
        this._heroTargetOpacity = 0;
        this._heroFadeInSpeed = 2.0;   // opacity units/sec (fade in ~0.5s)
        this._heroFadeOutSpeed = 1.0;  // opacity units/sec (fade out ~1.0s)
        this._heroHoldTimer = 0;
        this._heroHoldDuration = 3.0;  // seconds to stay active after trigger
        this._heroTriggerFlags = {
            corruption: false,
            instability: false,
            synergy: false,
            manual: false
        };
        this._heroThresholds = {
            corruptionHigh: 0.5,
            stabilityLow: 0.3,
            synergyHigh: 0.75
        };
    }

    /**
     * Receive live metrics from the game loop.
     * Expected shape: { harmony, corruption, synergy, stability } (all 0..1)
     * Also evaluates hero layer activation triggers.
     */
    setMetrics(metrics) {
        if (!metrics) return;
        if (metrics.harmony !== undefined) this._metrics.harmony = metrics.harmony;
        if (metrics.corruption !== undefined) this._metrics.corruption = metrics.corruption;
        if (metrics.synergy !== undefined) this._metrics.synergy = metrics.synergy;
        if (metrics.stability !== undefined) this._metrics.stability = metrics.stability;

        // Evaluate hero layer triggers from metrics
        this._heroTriggerFlags.corruption = this._metrics.corruption > this._heroThresholds.corruptionHigh;
        this._heroTriggerFlags.instability = this._metrics.stability < this._heroThresholds.stabilityLow;
        this._heroTriggerFlags.synergy = this._metrics.synergy > this._heroThresholds.synergyHigh;
    }

    setWorldContext(context = {}) {
        const normalized = context && typeof context === 'object' ? context : {};
        this._worldContext = {
            consciousnessState: normalized.consciousnessState || null,
            worldMoodState: normalized.worldMoodState || null,
            networkState: normalized.networkState || null,
            liveMetrics: normalized.liveMetrics || null,
            worldMacroState: normalized.worldMacroState || normalized.macroState || normalized.consciousnessState?.worldMacroState || 'DORMANT'
        };
        this._macroState = this._resolveWorldMacroState(this._worldContext);
        this._macroProfile = WORLD_MACRO_PROFILES[this._macroState] || WORLD_MACRO_PROFILES.DORMANT;
        this._worldContext.worldMacroState = this._macroState;
        this._worldContext.macroState = this._macroState;
        return this.getMacroPayload();
    }

    getMacroState() {
        return this._macroState;
    }

    getMacroPayload() {
        const macroProfile = this._resolveMacroProfile(this._macroState);
        return {
            macroState: this._macroState,
            macroProfile: { ...macroProfile },
            worldContext: {
                ...this._worldContext,
                worldMacroState: this._macroState,
                macroState: this._macroState
            },
            metrics: { ...this._metrics },
            heroState: this.getHeroState(),
            spectacleState: this._spectacleState ? { ...this._spectacleState } : null
        };
    }

    attachSemanticBus(semanticBus) {
        if (semanticBus === this._semanticBus) {
            return this;
        }

        this.detachSemanticBus();
        this._semanticBus = semanticBus || null;
        if (!this._semanticBus) {
            return this;
        }

        const bind = (eventName, spectacleType) => {
            const unsubscribe = this._bindSemanticBusEvent(this._semanticBus, eventName, (payload) => {
                this.triggerSpectacle(spectacleType, payload);
            });
            if (unsubscribe) {
                this._semanticBusUnsubs.push(unsubscribe);
            }
        };

        bind('link.created', 'link.created');
        bind('link.collapse.warning', 'warning');
        bind('link.collapse.critical', 'critical');
        bind('link.collapse.collapse', 'collapse');
        bind('link.collapse.recovery', 'recovery');
        bind('cascade.start', 'cascade.start');
        bind('cascade.hop', 'cascade.hop');
        bind('cascade.end', 'cascade.end');
        bind('topology.rupture', 'rupture');

        return this;
    }

    detachSemanticBus() {
        while (this._semanticBusUnsubs.length > 0) {
            const unsubscribe = this._semanticBusUnsubs.pop();
            try {
                unsubscribe?.();
            } catch (error) {
                console.warn('[VisualUpgradeSuperpack] Semantic bus cleanup failed:', error);
            }
        }
        this._semanticBus = null;
    }

    triggerSpectacle(eventType, payload = {}) {
        const preset = this._resolveSpectaclePreset(eventType);
        const event = {
            type: preset.type,
            priority: preset.priority,
            masterScale: preset.masterScale,
            edgeGlowScale: preset.edgeGlowScale,
            volumetricScale: preset.volumetricScale,
            fogScale: preset.fogScale,
            distortionScale: preset.distortionScale,
            riftScale: preset.riftScale,
            particleScale: preset.particleScale,
            cameraAuraScale: preset.cameraAuraScale,
            attack: preset.attack,
            sustain: preset.sustain,
            release: preset.release,
            heroBurstMs: preset.heroBurstMs,
            focus: this._resolveSpectacleFocus(payload),
            payload,
            elapsed: 0,
            mix: 0,
            phase: 'rise',
            startedAt: typeof performance !== 'undefined' ? performance.now() : Date.now()
        };

        if (this._spectacleState && this._spectacleState.type === event.type) {
            this._spectacleState = {
                ...this._spectacleState,
                ...event,
                elapsed: 0,
                mix: 0,
                phase: 'rise'
            };
            if (Number.isFinite(event.heroBurstMs) && event.heroBurstMs > 0) {
                this.triggerHeroBurst(event.heroBurstMs);
            }
            return this._spectacleState;
        }

        if (!this._spectacleState || event.priority >= this._spectacleState.priority || this._spectacleState.phase === 'afterglow') {
            this._spectacleState = event;
        } else {
            this._spectacleQueue = this._spectacleQueue.filter((queued) => queued.type !== event.type);
            this._spectacleQueue.push(event);
            this._spectacleQueue.sort((a, b) => b.priority - a.priority || a.startedAt - b.startedAt);
            if (this._spectacleQueue.length > 4) {
                this._spectacleQueue.length = 4;
            }
        }

        if (Number.isFinite(event.heroBurstMs) && event.heroBurstMs > 0) {
            this.triggerHeroBurst(event.heroBurstMs);
        }

        return event;
    }

    /**
     * Manually trigger a hero burst for a given duration.
     * Use for world transitions, cascade events, or dramatic moments.
     * @param {number} duration - Duration in milliseconds (default 3000)
     */
    triggerHeroBurst(duration = 3000) {
        this._heroTriggerFlags.manual = true;
        this._heroHoldDuration = duration / 1000;
        this._heroHoldTimer = this._heroHoldDuration;
    }

    _bindSemanticBusEvent(bus, eventName, handler) {
        if (!bus || !eventName || typeof handler !== 'function') return null;

        if (typeof bus.subscribe === 'function') {
            const unsubscribe = bus.subscribe(eventName, handler);
            if (typeof unsubscribe === 'function') {
                return unsubscribe;
            }
            return () => {
                if (typeof bus.unsubscribe === 'function') {
                    bus.unsubscribe(eventName, handler);
                } else if (typeof bus.off === 'function') {
                    bus.off(eventName, handler);
                }
            };
        }

        if (typeof bus.on === 'function') {
            bus.on(eventName, handler);
            return () => {
                if (typeof bus.off === 'function') {
                    bus.off(eventName, handler);
                } else if (typeof bus.unsubscribe === 'function') {
                    bus.unsubscribe(eventName, handler);
                }
            };
        }

        if (typeof bus.addEventListener === 'function') {
            bus.addEventListener(eventName, handler);
            return () => {
                if (typeof bus.removeEventListener === 'function') {
                    bus.removeEventListener(eventName, handler);
                }
            };
        }

        return null;
    }

    _resolveWorldMacroState(context = {}) {
        const explicitState = String(
            context?.worldMacroState
            || context?.consciousnessState?.worldMacroState
            || ''
        ).toUpperCase();

        if (WORLD_MACRO_PROFILES[explicitState]) {
            return explicitState;
        }

        const consciousness = context?.consciousnessState || {};
        const mood = String(context?.worldMoodState?.mood || context?.worldMoodState?.label || consciousness.networkMood || '').toUpperCase();
        const heroPhase = String(consciousness.heroPhase || '').toUpperCase();
        const heroIntensity = Number(consciousness.heroIntensity) || 0;
        const coherence = Number(consciousness.coherence) || 0;
        const ritualIntensity = Number(consciousness.ritualIntensity) || 0;
        const patternDensity = Number(consciousness.patternDensity) || 0;
        const networkPressure = Number(consciousness.networkPressure) || 0;

        if (networkPressure >= 0.72 || mood === 'CRITICAL' || mood === 'CHAOTIC' || heroPhase === 'FRACTURE' || heroPhase === 'DEFENSE') {
            return 'SCHISM';
        }

        if (heroIntensity >= 0.8 && coherence >= 0.6 && ritualIntensity >= 0.35 && patternDensity >= 0.18) {
            return 'REVELATION';
        }

        if (ritualIntensity >= 0.48 || mood === 'SYNERGIC' || heroPhase === 'RITUAL') {
            return 'COMMUNION';
        }

        if (heroIntensity >= 0.42 || mood === 'FOCUSED' || mood === 'TENSE' || heroPhase === 'AWAKENING') {
            return 'AWAKENING';
        }

        return 'DORMANT';
    }

    _resolveMacroProfile(macroState = this._macroState) {
        return WORLD_MACRO_PROFILES[macroState] || WORLD_MACRO_PROFILES.DORMANT;
    }

    _resolveSpectaclePreset(eventType) {
        const normalized = String(eventType || '').toLowerCase();
        const alias = {
            'link.created': 'link.created',
            'link.warning': 'warning',
            'link.critical': 'critical',
            'link.collapse': 'collapse',
            'link.collapse.warning': 'warning',
            'link.collapse.critical': 'critical',
            'link.collapse.collapse': 'collapse',
            'link.collapse.recovery': 'recovery',
            'cascade.start': 'cascade.start',
            'cascade.hop': 'cascade.hop',
            'cascade.end': 'cascade.end',
            'topology.rupture': 'rupture',
            'rupture': 'rupture',
            'warning': 'warning',
            'critical': 'critical',
            'collapse': 'collapse',
            'recovery': 'recovery'
        };

        const presetKey = alias[normalized] || normalized || 'generic';
        const preset = SPECTACLE_PRESETS[presetKey] || SPECTACLE_PRESETS.generic;
        return {
            type: presetKey,
            ...preset
        };
    }

    _resolveSpectacleFocus(payload = {}) {
        const extract = (candidate) => {
            const position = candidate?.position || candidate?.worldPosition || candidate?.center || null;
            if (!position) return null;
            return {
                x: Number(position.x) || 0,
                y: Number(position.y) || 0,
                z: Number(position.z) || 0
            };
        };

        const link = payload?.link || null;
        if (payload?.position) return extract(payload);
        if (payload?.center) return extract(payload);
        if (payload?.sourceNode?.position) return extract(payload.sourceNode);
        if (payload?.targetNode?.position) return extract(payload.targetNode);
        if (link?.source?.position && link?.target?.position) {
            return {
                x: ((link.source.position.x || 0) + (link.target.position.x || 0)) * 0.5,
                y: ((link.source.position.y || 0) + (link.target.position.y || 0)) * 0.5,
                z: ((link.source.position.z || 0) + (link.target.position.z || 0)) * 0.5
            };
        }

        return null;
    }

    _getIdleSpectacleState() {
        return {
            type: 'idle',
            priority: -1,
            masterScale: 1,
            edgeGlowScale: 1,
            volumetricScale: 1,
            fogScale: 1,
            distortionScale: 1,
            riftScale: 1,
            particleScale: 1,
            cameraAuraScale: 1,
            attack: 0,
            sustain: 0,
            release: 0,
            heroBurstMs: 0,
            focus: null,
            payload: null,
            elapsed: 0,
            mix: 0,
            phase: 'idle'
        };
    }

    _advanceSpectacleState(deltaTime) {
        if (!this._spectacleState) {
            return this._getIdleSpectacleState();
        }

        const current = this._spectacleState;
        current.elapsed = Math.max(0, current.elapsed + Math.max(0, Number(deltaTime) || 0));

        const attack = Math.max(0.001, Number(current.attack) || 0.001);
        const sustain = Math.max(0, Number(current.sustain) || 0);
        const release = Math.max(0.001, Number(current.release) || 0.001);
        const total = attack + sustain + release;

        if (current.elapsed > total) {
            if (this._spectacleQueue.length > 0) {
                this._spectacleState = this._spectacleQueue.shift();
                return this._advanceSpectacleState(0);
            }

            this._spectacleState = null;
            return this._getIdleSpectacleState();
        }

        if (current.elapsed <= attack) {
            const progress = current.elapsed / attack;
            current.mix = progress * progress * (3 - 2 * progress);
            current.phase = 'rise';
        } else if (current.elapsed <= attack + sustain) {
            current.mix = 1;
            current.phase = 'impact';
        } else {
            const progress = (current.elapsed - attack - sustain) / release;
            current.mix = Math.max(0, 1 - (progress * progress * (3 - 2 * progress)));
            current.phase = 'afterglow';
        }

        return current;
    }

    _applySpectacleScale(baseScale, eventScale, mix) {
        const base = Number.isFinite(baseScale) ? baseScale : 1;
        const target = Number.isFinite(eventScale) ? eventScale : 1;
        const amount = Math.max(0, Math.min(1, mix || 0));
        return base * (1 + (target - 1) * amount);
    }

    /**
     * Get current hero layer state for debugging.
     */
    getHeroState() {
        return {
            state: this._heroState,
            opacity: this._heroOpacity,
            triggers: { ...this._heroTriggerFlags },
            holdTimer: this._heroHoldTimer
        };
    }

    /**
     * Evaluate and transition hero state machine.
     * Called once per update tick.
     */
    _evaluateHeroState(deltaTime) {
        const anyTrigger = Object.values(this._heroTriggerFlags).some(v => v) || this._macroState !== 'DORMANT';

        switch (this._heroState) {
            case 'dormant':
                if (anyTrigger) {
                    this._heroState = 'activating';
                    this._heroTargetOpacity = 1;
                    this._showHeroObjects();
                }
                break;

            case 'activating':
                this._heroOpacity = Math.min(1, this._heroOpacity + this._heroFadeInSpeed * deltaTime);
                if (this._heroOpacity >= 1) {
                    this._heroOpacity = 1;
                    this._heroState = 'active';
                    this._heroHoldTimer = this._heroHoldDuration;
                }
                // If trigger released during fade-in, shorten hold
                if (!anyTrigger) this._heroHoldTimer = Math.min(this._heroHoldTimer, 0.5);
                break;

            case 'active':
                this._heroHoldTimer -= deltaTime;
                // Reset hold timer if trigger is still active
                if (anyTrigger) this._heroHoldTimer = this._heroHoldDuration;
                if (this._heroHoldTimer <= 0) {
                    this._heroState = 'fading';
                    this._heroTargetOpacity = 0;
                }
                break;

            case 'fading':
                this._heroOpacity = Math.max(0, this._heroOpacity - this._heroFadeOutSpeed * deltaTime);
                // Re-trigger during fade-out
                if (anyTrigger) {
                    this._heroState = 'activating';
                    this._heroTargetOpacity = 1;
                }
                if (this._heroOpacity <= 0) {
                    this._heroOpacity = 0;
                    this._heroState = 'dormant';
                    this._hideHeroObjects();
                }
                break;
        }

        // Clear manual trigger after one evaluation cycle (it's a pulse, not sustained)
        this._heroTriggerFlags.manual = false;
    }

    /**
     * Show all hero layer objects (volumetric, atmospheric, particles, etc.)
     */
    _showHeroObjects() {
        const show = obj => { obj.visible = true; };
        this.volumetricLights.forEach(show);
        this.atmosphericLayers.forEach(show);
        this.distortionZones.forEach(show);
        this.rifts.forEach(show);
        this.particles.forEach(show);
        this.spectralCaustics.forEach(show);
        if (this.cameraAura) this.cameraAura.visible = true;
    }

    /**
     * Hide all hero layer objects — zero GPU cost when dormant
     */
    _hideHeroObjects() {
        const hide = obj => { obj.visible = false; };
        this.volumetricLights.forEach(hide);
        this.atmosphericLayers.forEach(hide);
        this.distortionZones.forEach(hide);
        this.rifts.forEach(hide);
        this.particles.forEach(hide);
        this.spectralCaustics.forEach(hide);
        if (this.cameraAura) this.cameraAura.visible = false;
    }

    _getQualityProfile(level = 'HIGH') {
        const normalized = typeof level === 'string' ? level.toUpperCase() : 'HIGH';

        const profiles = {
            LOW: {
                renderer: {
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.08,
                    outputColorSpace: THREE.SRGBColorSpace
                },
                volumetricOpacity: 0.88,
                volumetricScale: 0.94,
                fogOpacity: 0.84,
                fogScale: 0.96,
                edgeGlowOpacity: 0.9,
                edgeGlowMaxObjects: 10,
                distortionIntensity: 0.88,
                riftOpacity: 0.86,
                particleOpacity: 0.9,
                causticOpacity: 0.72,
                cameraAuraOpacity: 0.9,
                colorGrading: {
                    contrast: 1.0,
                    saturation: 0.98,
                    brightness: 0.96
                },
                postEffects: {
                    bloom: { strength: 0.98, threshold: 0.28, radius: 0.42 },
                    chromatic: { enabled: true, amount: 0.001, frequency: 0.3 },
                    vignette: { enabled: true, darkness: 0.46, offset: 0.32 },
                    shimmer: { enabled: true, intensity: 0.05, frequency: 1.8, scale: 0.96 }
                }
            },
            MEDIUM: {
                renderer: {
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.16,
                    outputColorSpace: THREE.SRGBColorSpace
                },
                volumetricOpacity: 1.0,
                volumetricScale: 1.0,
                fogOpacity: 1.0,
                fogScale: 1.0,
                edgeGlowOpacity: 1.08,
                edgeGlowMaxObjects: 18,
                distortionIntensity: 1.0,
                riftOpacity: 1.02,
                particleOpacity: 1.0,
                causticOpacity: 1.0,
                cameraAuraOpacity: 1.0,
                colorGrading: {
                    contrast: 1.06,
                    saturation: 1.01,
                    brightness: 0.95
                },
                postEffects: {
                    bloom: { strength: 1.2, threshold: 0.2, radius: 0.5 },
                    chromatic: { enabled: true, amount: 0.0022, frequency: 0.3 },
                    vignette: { enabled: true, darkness: 0.4, offset: 0.3 },
                    shimmer: { enabled: true, intensity: 0.08, frequency: 2.0, scale: 1.0 }
                }
            },
            HIGH: {
                renderer: {
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.26,
                    outputColorSpace: THREE.SRGBColorSpace
                },
                volumetricOpacity: 1.34,
                volumetricScale: 1.08,
                fogOpacity: 1.18,
                fogScale: 1.06,
                edgeGlowOpacity: 1.28,
                edgeGlowMaxObjects: 28,
                distortionIntensity: 1.16,
                riftOpacity: 1.18,
                particleOpacity: 1.12,
                causticOpacity: 1.22,
                cameraAuraOpacity: 1.18,
                colorGrading: {
                    contrast: 1.12,
                    saturation: 1.06,
                    brightness: 0.98
                },
                postEffects: {
                    bloom: { strength: 1.45, threshold: 0.14, radius: 0.62 },
                    chromatic: { enabled: true, amount: 0.0032, frequency: 0.3 },
                    vignette: { enabled: true, darkness: 0.3, offset: 0.28 },
                    shimmer: { enabled: true, intensity: 0.12, frequency: 2.2, scale: 1.08 }
                }
            }
        };

        return profiles[normalized] || profiles.HIGH;
    }

    setQualityTier(level = 'HIGH') {
        const normalized = typeof level === 'string' ? level.toUpperCase() : 'HIGH';

        if (normalized === 'LOW') {
            this.qualityTier = 'LOW';
        } else if (normalized === 'MEDIUM') {
            this.qualityTier = 'MEDIUM';
        } else {
            this.qualityTier = 'HIGH';
        }

        this._qualityProfile = this._getQualityProfile(this.qualityTier);
        this.colorGrading = {
            tealMagentaBalance: {
                shadows: new THREE.Vector3(0.92, 0.94, 1.06),
                midtones: new THREE.Vector3(1.02, 1.0, 0.96),
                highlights: new THREE.Vector3(1.08, 0.96, 0.88)
            },
            contrast: this._qualityProfile.colorGrading.contrast,
            saturation: this._qualityProfile.colorGrading.saturation,
            brightness: this._qualityProfile.colorGrading.brightness
        };
        this.postEffects = {
            bloom: { ...this._qualityProfile.postEffects.bloom },
            chromatic: { ...this._qualityProfile.postEffects.chromatic },
            vignette: { ...this._qualityProfile.postEffects.vignette },
            shimmer: { ...this._qualityProfile.postEffects.shimmer }
        };

        return this.qualityTier;
    }

    /**
     * ROTATION SAFETY: Ensures any object with a rotation always has a valid order
     */
    ensureRotationOrder(obj) {
        if (obj && obj.rotation && typeof obj.rotation.order !== "string") {
            obj.rotation.order = "XYZ";
        }
    }

    _toRgba(color, alpha) {
        const rgb = new THREE.Color(color);
        return `rgba(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}, ${alpha})`;
    }

    _createRadialGradientTexture(cacheKey, stops, size = 256) {
        if (this.sharedTextures[cacheKey]) {
            return this.sharedTextures[cacheKey];
        }

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d');
        if (!context) {
            return null;
        }

        const gradient = context.createRadialGradient(
            size * 0.5,
            size * 0.5,
            size * 0.02,
            size * 0.5,
            size * 0.5,
            size * 0.5
        );

        stops.forEach(([offset, color, alpha]) => {
            gradient.addColorStop(offset, this._toRgba(color, alpha));
        });

        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        this.sharedTextures[cacheKey] = texture;
        return texture;
    }

    _createMysticSpriteTexture(cacheKey, kind, size = 256) {
        if (this.sharedTextures[cacheKey]) {
            return this.sharedTextures[cacheKey];
        }

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const cx = size * 0.5;
        const cy = size * 0.5;
        ctx.clearRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';

        const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
        radial.addColorStop(0, 'rgba(255,255,255,1)');
        radial.addColorStop(0.32, 'rgba(255,255,255,0.72)');
        radial.addColorStop(0.74, 'rgba(255,255,255,0.14)');
        radial.addColorStop(1, 'rgba(255,255,255,0)');

        if (kind === 'anamorphicStreak') {
            const streak = ctx.createLinearGradient(0, cy, size, cy);
            streak.addColorStop(0, 'rgba(255,255,255,0)');
            streak.addColorStop(0.38, 'rgba(255,255,255,0.16)');
            streak.addColorStop(0.5, 'rgba(255,255,255,0.9)');
            streak.addColorStop(0.62, 'rgba(255,255,255,0.16)');
            streak.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = streak;
            ctx.fillRect(0, cy - size * 0.085, size, size * 0.17);
            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, size, size);
        } else if (kind === 'causticVeil') {
            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, size, size);
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = 'rgba(255,255,255,0.28)';
            ctx.lineWidth = size * 0.01;
            for (let i = 0; i < 7; i++) {
                const y = size * (0.22 + i * 0.09);
                ctx.beginPath();
                ctx.moveTo(size * 0.12, y);
                ctx.bezierCurveTo(size * 0.32, y - size * 0.13, size * 0.58, y + size * 0.16, size * 0.88, y - size * 0.04);
                ctx.stroke();
            }
        } else if (kind === 'softStarKernel') {
            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, size, size);
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = 'rgba(255,255,255,0.62)';
            ctx.lineWidth = size * 0.018;
            for (let i = 0; i < 8; i++) {
                const a = i * Math.PI / 4;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * size * 0.08, cy + Math.sin(a) * size * 0.08);
                ctx.lineTo(cx + Math.cos(a) * size * 0.42, cy + Math.sin(a) * size * 0.42);
                ctx.stroke();
            }
        } else if (kind === 'runeSpark') {
            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, size, size);
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = 'rgba(255,255,255,0.76)';
            ctx.lineWidth = size * 0.024;
            ctx.beginPath();
            ctx.moveTo(cx, size * 0.23);
            ctx.lineTo(size * 0.66, cy);
            ctx.lineTo(cx, size * 0.77);
            ctx.lineTo(size * 0.34, cy);
            ctx.closePath();
            ctx.stroke();
        } else {
            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, size, size);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = -Math.PI / 2 + i * Math.PI / 4;
                const r = size * (i % 2 === 0 ? 0.46 : 0.39);
                const x = cx + Math.cos(a) * r;
                const y = cy + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        this.sharedTextures[cacheKey] = texture;
        return texture;
    }

    _createOrganicVeilGeometry(width, height, seed = 0, points = 28) {
        const vertices = [0, 0, 0];
        const indices = [];
        const halfW = width * 0.5;
        const halfH = height * 0.5;

        for (let i = 0; i < points; i++) {
            const t = i / points;
            const angle = t * Math.PI * 2;
            const axisX = Math.cos(angle) >= 0 ? halfW : -halfW;
            const axisY = Math.sin(angle) >= 0 ? halfH : -halfH;
            const cornerBlend = 0.72 + 0.18 * Math.sin(seed + i * 1.73);
            const x = Math.cos(angle) * Math.abs(axisX) * cornerBlend + Math.sin(seed * 0.7 + i * 2.1) * width * 0.035;
            const y = Math.sin(angle) * Math.abs(axisY) * cornerBlend + Math.cos(seed * 0.9 + i * 1.9) * height * 0.035;
            vertices.push(x, y, 0);
        }

        for (let i = 1; i <= points; i++) {
            indices.push(0, i, i === points ? 1 : i + 1);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    _createCausticLineGeometry(radius, layers = 3, segments = 72, seed = 0) {
        const vertices = [];
        for (let layer = 0; layer < layers; layer++) {
            const r = radius * (0.72 + layer * 0.18);
            for (let i = 0; i < segments; i++) {
                if (i % 5 === 4) continue;
                const a0 = (i / segments) * Math.PI * 2;
                const a1 = ((i + 0.68) / segments) * Math.PI * 2;
                const warp0 = 1 + Math.sin(seed + layer * 1.7 + i * 0.41) * 0.055;
                const warp1 = 1 + Math.cos(seed + layer * 1.3 + i * 0.37) * 0.055;
                vertices.push(Math.cos(a0) * r * warp0, Math.sin(a0) * r * warp0, 0);
                vertices.push(Math.cos(a1) * r * warp1, Math.sin(a1) * r * warp1, 0);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return geometry;
    }

    _disposeObject3D(object3D) {
        if (!object3D) return;

        object3D.traverse(child => {
            if (child.geometry && typeof child.geometry.dispose === 'function') {
                child.geometry.dispose();
            }

            if (Array.isArray(child.material)) {
                child.material.forEach(material => {
                    if (material && typeof material.dispose === 'function') {
                        material.dispose();
                    }
                });
            } else if (child.material && typeof child.material.dispose === 'function') {
                child.material.dispose();
            }
        });
    }

    /**
     * Apply ALL enhancement packs
     */
    applyFullUpgrade() {
        if (this._applied) return;
        this._applied = true;

        this.applyHolographicEdgeGlowPack();
        this.applyVolumetricLightPack();
        this.applyAmbientFogPack();
        this.applyCinematicColorGradingPack();
        this.applyNeonDreamPostfxPack();
        this.applyQuantumDistortionPack();
        this.applySigmaRiftVisualPack();
        this.applyDreamParticlesPack();
        this.applySpectralCausticFieldPack();
        this.applyCinematicCameraAuraPack();
        this.setQualityTier(this.qualityTier);

        // Start hero objects in dormant state (hidden, zero GPU cost)
        // They will activate only when world-state triggers fire
        this._hideHeroObjects();
    }

    // ============================================================
    // PACK 1: SOFT VOLUMETRIC LIGHT PACK
    // ============================================================
    applyVolumetricLightPack() {
        const glowTexture = this._createRadialGradientTexture('vsuVolumetricGlow', [
            [0.0, 0xffffff, 1.0],
            [0.16, 0xffffff, 0.84],
            [0.42, 0xffffff, 0.28],
            [1.0, 0xffffff, 0.0]
        ], 256);
        const causticTexture = this._createMysticSpriteTexture('vsuCausticVeil', 'causticVeil', 256);
        const streakTexture = this._createMysticSpriteTexture('vsuAnamorphicStreak', 'anamorphicStreak', 256);

        // SACRED_SUPERPACK: Sacred spectral volumetric light colors
        const lightConfigs = [
            {
                pos: new THREE.Vector3(60, 50, 40),
                color: 0xFFD700,    // Sacred gold (was 0x00ffff)
                intensity: 0.5,
                size: 50,
                rotation: new THREE.Vector3(0.3, 0.2, 0)
            },
            {
                pos: new THREE.Vector3(-60, 45, -50),
                color: 0x40E0D0,    // Celestial teal (was 0xff00ff)
                intensity: 0.45,
                size: 45,
                rotation: new THREE.Vector3(-0.2, -0.3, 0)
            },
            {
                pos: new THREE.Vector3(0, 55, -70),
                color: 0x9466EB,    // Mystic violet (was 0xff99ff)
                intensity: 0.4,
                size: 48,
                rotation: new THREE.Vector3(0.1, 0, 0.2)
            },
            {
                pos: new THREE.Vector3(-40, 40, 50),
                color: 0xFFF0D0,    // Spectral white-gold (was 0x99ffff)
                intensity: 0.35,
                size: 40,
                rotation: new THREE.Vector3(-0.15, 0.25, 0)
            }
        ];

        lightConfigs.forEach(config => {
            const geometry = new THREE.ConeGeometry(config.size, config.size * 2, 32, 32);
            const motionSeed = Math.random() * Math.PI * 2;
            const motion = {
                basePosition: config.pos.clone(),
                baseRotation: {
                    x: config.rotation.x,
                    y: config.rotation.y,
                    z: config.rotation.z
                },
                tint: new THREE.Color(config.color),
                phase: motionSeed,
                pulseSpeed: 0.35 + Math.random() * 0.25,
                driftSpeed: 0.08 + Math.random() * 0.05,
                driftRadius: 0.9 + Math.random() * 1.4,
                driftHeight: 0.5 + Math.random() * 0.6,
                spinSpeed: 0.008 + Math.random() * 0.012,
                scalePulse: 0.035 + Math.random() * 0.03
            };

            const material = new THREE.MeshBasicMaterial({
                color: config.color,
                map: glowTexture || null,
                alphaMap: glowTexture || null,
                transparent: true,
                opacity: config.intensity * 0.55,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false,
                fog: false,
                toneMapped: false
            });

            const cone = new THREE.Mesh(geometry, material);
            cone.position.copy(config.pos);
            cone.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z, "XYZ");
            cone.renderOrder = 10;
            cone.userData = {
                isVisualSuperpack: true,
                kind: 'volumetricCone',
                baseOpacity: config.intensity * 0.55,
                baseScale: 1,
                color: config.color,
                ...motion
            };

            this.root.add(cone);
            this.volumetricLights.push(cone);

            const rayGeometry = this._createOrganicVeilGeometry(config.size * 0.92, config.size * 1.72, motionSeed + 0.9, 22);
            const rayMaterial = new THREE.MeshBasicMaterial({
                color: config.color,
                map: causticTexture || glowTexture || null,
                alphaMap: causticTexture || glowTexture || null,
                transparent: true,
                opacity: config.intensity * 0.42,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
                fog: false,
                toneMapped: false
            });

            const rays = new THREE.Mesh(rayGeometry, rayMaterial);
            rays.position.copy(config.pos);
            rays.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z, "XYZ");
            rays.rotation.x -= Math.PI / 6;
            rays.renderOrder = 11;
            rays.userData = {
                isVisualSuperpack: true,
                kind: 'volumetricRays',
                baseOpacity: config.intensity * 0.42,
                baseScale: 1,
                color: config.color,
                baseRotation: {
                    x: config.rotation.x - Math.PI / 6,
                    y: config.rotation.y,
                    z: config.rotation.z
                },
                ...motion
            };

            this.root.add(rays);
            this.volumetricLights.push(rays);

            for (let band = 0; band < 2; band++) {
                const bandGeometry = this._createOrganicVeilGeometry(config.size * (1.6 + band * 0.55), config.size * 0.18, motionSeed + band * 2.7, 18);
                const bandMaterial = new THREE.MeshBasicMaterial({
                    color: band === 0 ? 0xfff0d0 : config.color,
                    map: streakTexture || glowTexture || null,
                    alphaMap: streakTexture || glowTexture || null,
                    transparent: true,
                    opacity: config.intensity * (0.18 - band * 0.035),
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    fog: false,
                    toneMapped: false
                });
                const bandMesh = new THREE.Mesh(bandGeometry, bandMaterial);
                bandMesh.position.copy(config.pos);
                bandMesh.rotation.set(
                    config.rotation.x - Math.PI / 7 + band * 0.09,
                    config.rotation.y + band * 0.18,
                    config.rotation.z + Math.PI / 2 + band * 0.32,
                    "XYZ"
                );
                bandMesh.renderOrder = 11 + band;
                bandMesh.userData = {
                    isVisualSuperpack: true,
                    kind: 'cathedralLightBand',
                    baseOpacity: config.intensity * (0.18 - band * 0.035),
                    baseScale: 1,
                    color: band === 0 ? 0xfff0d0 : config.color,
                    baseRotation: {
                        x: config.rotation.x - Math.PI / 7 + band * 0.09,
                        y: config.rotation.y + band * 0.18,
                        z: config.rotation.z + Math.PI / 2 + band * 0.32
                    },
                    ...motion
                };

                this.root.add(bandMesh);
                this.volumetricLights.push(bandMesh);
            }

            const core = new THREE.Mesh(
                new THREE.SphereGeometry(config.size * 0.14, 16, 16),
                new THREE.MeshBasicMaterial({
                    color: config.color,
                    map: glowTexture || null,
                    alphaMap: glowTexture || null,
                    transparent: true,
                    opacity: config.intensity * 0.85,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    fog: false,
                    toneMapped: false
                })
            );
            core.position.copy(config.pos);
            core.renderOrder = 12;
            core.userData = {
                isVisualSuperpack: true,
                kind: 'volumetricCore',
                baseOpacity: config.intensity * 0.85,
                baseScale: 1,
                color: config.color,
                ...motion
            };

            this.root.add(core);
            this.volumetricLights.push(core);
        });
    }

    // ============================================================
    // PACK 2: AMBIENT FOG + DEPTH LAYERING PACK
    // ============================================================
    applyAmbientFogPack() {
        const mistTexture = this._createRadialGradientTexture('vsuFogMist', [
            [0.0, 0xffffff, 0.24],
            [0.32, 0xffffff, 0.16],
            [0.68, 0xffffff, 0.05],
            [1.0, 0xffffff, 0.0]
        ], 512);
        const veilTexture = this._createMysticSpriteTexture('vsuDreamStrataVeil', 'causticVeil', 512);

        // SACRED_SUPERPACK: Sacred spectral mist colors
        const fogLayers = [
            {
                name: 'groundMist',
                height: 0.5,
                color: 0x2A1840,    // Deep violet base (was 0xf0d8e8)
                opacity: 0.35,
                size: 300,
                speed: 0.2
            },
            {
                name: 'midHaze',
                height: 30,
                color: 0x1A3030,    // Teal haze (was 0xe8c0d8)
                opacity: 0.25,
                size: 350,
                speed: 0.15
            },
            {
                name: 'distantGlow',
                height: 60,
                color: 0xffffff,
                opacity: 0.18,
                size: 400,
                speed: 0.1
            },
            {
                name: 'horizonFade',
                height: 80,
                color: 0x302810,    // Gold horizon (was 0xf5e8ff)
                opacity: 0.12,
                size: 500,
                speed: 0.05
            }
        ];

        fogLayers.forEach(layer => {
            const geometry = this._createOrganicVeilGeometry(layer.size * 1.18, layer.size * 0.82, Math.random() * 1000, 34);
            const material = new THREE.MeshBasicMaterial({
                color: layer.color,
                map: veilTexture || mistTexture || null,
                alphaMap: veilTexture || mistTexture || null,
                transparent: true,
                opacity: layer.opacity,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
                fog: false,
                toneMapped: false
            });

            const plane = new THREE.Mesh(geometry, material);
            plane.position.y = layer.height;
            plane.rotation.x = -Math.PI / 2;
            plane.userData = {
                isVisualSuperpack: true,
                layer: layer.name,
                baseOpacity: layer.opacity,
                pulseSpeed: layer.speed,
                phase: Math.random() * Math.PI * 2,
                followFactor: layer.height < 10 ? 0.95 : layer.height < 40 ? 0.55 : 0.25,
                driftRadius: layer.size * 0.01,
                driftSpeed: 0.02 + Math.random() * 0.02,
                wobble: 0.01 + Math.random() * 0.01,
                basePosition: new THREE.Vector3(0, layer.height, 0)
            };
            plane.renderOrder = 4;

            this.root.add(plane);
            this.atmosphericLayers.push(plane);
        });
    }

    // ============================================================
    // PACK 3: HOLOGRAPHIC EDGE GLOW PACK
    // ============================================================
    applyHolographicEdgeGlowPack() {
        if (this.edgeGlowObjects.length > 0) return;
        const quality = this._qualityProfile || this._getQualityProfile(this.qualityTier);
        const maxEdgeObjects = Math.max(0, Math.min(32, quality.edgeGlowMaxObjects || 18));
        let edgeCount = 0;

        // Create edge glow overlays for scene geometry
        // SACRED_SUPERPACK: Sacred teal edge glow (was 0x00ffff)
        const edgeGlowMaterialTemplate = new THREE.LineBasicMaterial({
            color: 0x40E0D0,
            transparent: true,
            opacity: 0.38,
            linewidth: 1.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
            toneMapped: false
        });

        // Scan scene for geometric objects and add edge glows
        this.scene.traverse(child => {
            if (edgeCount >= maxEdgeObjects) return;
            if (child.isMesh && child.geometry && !child.userData.isVolumetric && child.userData?.isVisualSuperpack !== true) {
                // Skip certain objects
                const name = child.name || '';
                if (name.includes('Particle') || name.includes('particle') || name.includes('HUD') || name.includes('Overlay')) return;
                if (child.isSprite || child.isPoints || child.userData?.isHUD || child.userData?.isParticleSystem) return;
                if (child.material?.transparent && child.material?.opacity < 0.35) return;

                try {
                    const ctx = {
                        meshName: child.name,
                        meshUUID: child.uuid,
                        geoUUID: child.geometry?.uuid,
                        sourceTag: 'VSU.applyHolographicEdgeGlowPack'
                    };
                    const edges = safeEdgesGeometry(child.geometry, ctx);
                    if (!edges) return;
                    const edgeGlowMaterial = edgeGlowMaterialTemplate.clone();
                    const wireframe = new THREE.LineSegments(edges, edgeGlowMaterial);
                    wireframe.position.copy(child.position);
                    if (child.quaternion) {
                        wireframe.rotation.setFromQuaternion(child.quaternion, "XYZ");
                    }
                    wireframe.scale.copy(child.scale);
                    wireframe.renderOrder = 20;
                    wireframe.userData = {
                        isVisualSuperpack: true,
                        linkedMesh: child,
                        baseOpacity: 0.55,
                        fresnel: true,
                        pulsePhase: Math.random() * Math.PI * 2,
                        baseScale: child.scale.clone()
                    };

                    this.root.add(wireframe);
                    this.edgeGlowObjects.push(wireframe);
                    edgeCount += 1;
                } catch (e) {
                    // Skip geometries that can't be converted to edges
                }
            }
        });

        edgeGlowMaterialTemplate.dispose();
    }

    // ============================================================
    // PACK 4: CINEMATIC COLOR GRADING PACK
    // ============================================================
    applyCinematicColorGradingPack() {
        // Apply tone mapping and color grading
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Store color grading parameters
        // SACRED_SUPERPACK: Sacred gold-teal color grading (was teal-magenta)
        this.colorGrading = {
            tealMagentaBalance: {
                shadows: new THREE.Vector3(0.92, 0.94, 1.06),    // Sacred teal in shadows (was cyan)
                midtones: new THREE.Vector3(1.02, 1.0, 0.96),    // Warm neutral (was neutral)
                highlights: new THREE.Vector3(1.08, 0.96, 0.88)  // Sacred gold in highlights (was magenta)
            },
            contrast: 1.06,
            saturation: 1.0,
            brightness: 0.92
        };
    }

    // ============================================================
    // PACK 5: NEON DREAM POSTFX PACK
    // ============================================================
    applyNeonDreamPostfxPack() {
        // Bloom parameters for neon glow
        this.postEffects.bloom = {
            strength: 1.2,
            threshold: 0.2,
            radius: 0.5
        };

        // Subtle chromatic aberration
        this.postEffects.chromatic = {
            enabled: true,
            amount: 0.002,
            frequency: 0.3
        };

        // Vignette for atmosphere
        this.postEffects.vignette = {
            enabled: true,
            darkness: 0.4,
            offset: 0.3
        };

        // Shimmer effect in luminous regions
        this.postEffects.shimmer = {
            enabled: true,
            intensity: 0.08,
            frequency: 2.0,
            scale: 1.0
        };
    }

    // ============================================================
    // PACK 6: QUANTUM DISTORTION PACK
    // ============================================================
    applyQuantumDistortionPack() {
        const distortionZones = [
            { pos: new THREE.Vector3(30, 10, -30), radius: 20, intensity: 0.35 },
            { pos: new THREE.Vector3(-40, 8, 40), radius: 18, intensity: 0.3 },
            { pos: new THREE.Vector3(0, 15, 0), radius: 25, intensity: 0.25 }
        ];

        distortionZones.forEach(zone => {
            // Create distortion effect through shader overlay
            const geometry = new THREE.IcosahedronGeometry(zone.radius, 3);
            const material = new THREE.MeshStandardMaterial({
                // SACRED_SUPERPACK: Mystic violet distortion (was 0x00ffff)
                color: 0x9466EB,
                transparent: true,
                opacity: 0,
                emissive: 0x9466EB,
                emissiveIntensity: zone.intensity * 0.35,
                wireframe: false,
                fog: false
            });

            const distortionMesh = new THREE.Mesh(geometry, material);
            distortionMesh.position.copy(zone.pos);
            distortionMesh.userData = {
                radius: zone.radius,
                intensity: zone.intensity,
                frequency: 1.5 + Math.random() * 1.0,
                phase: Math.random() * Math.PI * 2,
                type: 'distortionZone'
            };

            this.root.add(distortionMesh);
            this.distortionZones.push(distortionMesh);
        });
    }

    // ============================================================
    // PACK 7: SIGMA RIFT VISUAL PACK
    // ============================================================
    applySigmaRiftVisualPack() {
        // SACRED_SUPERPACK: Sacred spectral rift colors (was generic green)
        const riftConfigs = [
            { pos: new THREE.Vector3(50, 20, 50), color: 0x9466EB, scale: 1.0 },     // Mystic violet (was 0x00ff88)
            { pos: new THREE.Vector3(-50, 25, -50), color: 0xFFD700, scale: 0.9 },    // Sacred gold (was 0x00dd99)
            { pos: new THREE.Vector3(0, 30, -60), color: 0x40E0D0, scale: 0.8 }       // Celestial teal (was 0x00ffaa)
        ];

        riftConfigs.forEach(config => {
            // Create fracture-like rift visual
            const geometry = new THREE.IcosahedronGeometry(15 * config.scale, 4);
            const material = new THREE.LineBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: 0.4,
                linewidth: 1,
                blending: THREE.AdditiveBlending,
                fog: false
            });

            // Convert to wireframe
            const ctx = {
                meshName: 'sigmaRift',
                meshUUID: null,
                geoUUID: geometry?.uuid,
                sourceTag: 'VSU.applySigmaRiftVisualPack'
            };
            const edges = safeEdgesGeometry(geometry, ctx);
            if (!edges) return;
            const rift = new THREE.LineSegments(edges, material);
            rift.position.copy(config.pos);
            rift.userData = {
                baseOpacity: 0.3,
                pulseSpeed: 0.3,
                phase: Math.random() * Math.PI * 2,
                color: config.color,
                type: 'sigmaRift'
            };

            this.root.add(rift);
            this.rifts.push(rift);

            // Add glow field around rift
            const glowGeometry = new THREE.SphereGeometry(20 * config.scale, 16, 16);
            const glowMaterial = new THREE.MeshStandardMaterial({
                color: config.color,
                emissive: config.color,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.15,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                fog: false
            });

            const glowField = new THREE.Mesh(glowGeometry, glowMaterial);
            glowField.position.copy(config.pos);
            glowField.userData = {
                baseOpacity: 0.15,
                pulseSpeed: 0.25,
                phase: Math.random() * Math.PI * 2,
                type: 'riftGlow'
            };

            this.root.add(glowField);
            this.rifts.push(glowField);
        });
    }

    // ============================================================
    // PACK 8: DREAM PARTICLES PACK
    // ============================================================
    applyDreamParticlesPack() {
        const spectralMoteTexture = this._createMysticSpriteTexture('vsuSpectralMote', 'spectralMote', 128);
        const starKernelTexture = this._createMysticSpriteTexture('vsuSoftStarKernel', 'softStarKernel', 128);
        const runeSparkTexture = this._createMysticSpriteTexture('vsuRuneSpark', 'runeSpark', 128);
        const particleTexture = this._createRadialGradientTexture('vsuDreamParticle', [
            [0.0, 0xffffff, 0.9],
            [0.2, 0xffffff, 0.45],
            [0.55, 0xffffff, 0.08],
            [1.0, 0xffffff, 0.0]
        ], 128);

        // SACRED_SUPERPACK: Sacred spectral dream particles (was pink/white)
        const particleSystems = [
            {
                count: 200,
                height: new THREE.Vector2(5, 40),
                color: 0xFFD700,    // Sacred gold (was 0xffc8dd)
                speed: 0.008,
                size: 0.12,
                texture: starKernelTexture || particleTexture
            },
            {
                count: 150,
                height: new THREE.Vector2(20, 60),
                color: 0x40E0D0,    // Celestial teal (was 0xffb8d8)
                speed: 0.006,
                size: 0.08,
                texture: spectralMoteTexture || particleTexture
            },
            {
                count: 100,
                height: new THREE.Vector2(40, 80),
                color: 0x9466EB,    // Mystic violet (was 0xffffff)
                speed: 0.004,
                size: 0.06,
                texture: runeSparkTexture || particleTexture
            }
        ];

        particleSystems.forEach(system => {
            const geometry = new THREE.BufferGeometry();

            const positions = new Float32Array(system.count * 3);
            const velocities = new Float32Array(system.count * 3);

            for (let i = 0; i < system.count; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 300;
                positions[i * 3 + 1] = system.height.x + Math.random() * (system.height.y - system.height.x);
                positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

                velocities[i * 3] = (Math.random() - 0.5) * system.speed;
                velocities[i * 3 + 1] = (Math.random() - 0.5) * system.speed * 0.5;
                velocities[i * 3 + 2] = (Math.random() - 0.5) * system.speed;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

            const material = new THREE.PointsMaterial({
                color: system.color,
                map: system.texture || null,
                alphaMap: system.texture || null,
                size: system.size * 1.55,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.75,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                alphaTest: 0.02,
                fog: true,
                toneMapped: false
            });

            const points = new THREE.Points(geometry, material);
            points.userData = {
                isVisualSuperpack: true,
                velocities: velocities,
                bounds: 150,
                system: system
            };

            this.root.add(points);
            this.particles.push(points);
        });
    }

    // ============================================================
    // PACK 8B: HERO SPECTRAL CAUSTIC FIELD
    // ============================================================
    applySpectralCausticFieldPack() {
        if (this.spectralCaustics.length > 0) return;

        const causticConfigs = [
            { pos: new THREE.Vector3(0, 22, -38), radius: 34, color: 0x40e0d0, opacity: 0.28, tilt: -0.42 },
            { pos: new THREE.Vector3(42, 32, 36), radius: 28, color: 0xffd700, opacity: 0.22, tilt: -0.28 },
            { pos: new THREE.Vector3(-46, 28, 24), radius: 31, color: 0x9466eb, opacity: 0.24, tilt: -0.36 }
        ];

        causticConfigs.forEach((config, index) => {
            const geometry = this._createCausticLineGeometry(config.radius, 3, 64, index * 17.31);
            const material = new THREE.LineBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: config.opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                fog: false,
                toneMapped: false
            });

            const field = new THREE.LineSegments(geometry, material);
            field.position.copy(config.pos);
            field.rotation.set(config.tilt, index * 0.42, Math.PI * (0.16 + index * 0.18), "XYZ");
            field.renderOrder = 13;
            field.userData = {
                isVisualSuperpack: true,
                type: 'spectralCausticField',
                baseOpacity: config.opacity,
                baseScale: 1,
                pulseSpeed: 0.18 + index * 0.04,
                spinSpeed: 0.006 + index * 0.002,
                phase: Math.random() * Math.PI * 2
            };

            this.root.add(field);
            this.spectralCaustics.push(field);
        });
    }

    // ============================================================
    // PACK 9: CAMERA CINEMATIC AURA PACK
    // ============================================================
    applyCinematicCameraAuraPack() {
        if (this.cameraAura) return;

        const auraTexture = this._createRadialGradientTexture('vsuCameraAura', [
            [0.0, 0xffffff, 1.0],
            [0.16, 0xffffff, 0.8],
            [0.42, 0xffffff, 0.26],
            [1.0, 0xffffff, 0.0]
        ], 512);

        const auraGroup = new THREE.Group();
        auraGroup.name = 'VisualSuperpackCameraAura';
        auraGroup.renderOrder = 9999;
        auraGroup.position.set(0, 0, -1.85);
        auraGroup.userData = {
            pulsePhase: Math.random() * Math.PI * 2,
            driftPhase: Math.random() * Math.PI * 2
        };

        const makeAuraSprite = (color, opacity, scaleX, scaleY, offsetX, offsetY) => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: auraTexture || null,
                color,
                transparent: true,
                opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: false,
                fog: false,
                toneMapped: false
            }));

            sprite.scale.set(scaleX, scaleY, 1);
            sprite.position.set(offsetX, offsetY, 0);
            sprite.userData = {
                baseOpacity: opacity,
                baseScale: new THREE.Vector3(scaleX, scaleY, 1),
                phase: Math.random() * Math.PI * 2
            };

            return sprite;
        };

        // SACRED_SUPERPACK: Sacred spectral camera aura (was generic cyan/pink)
        auraGroup.add(makeAuraSprite(0xFFD700, 0.4, 3.1, 3.1, 0.0, 0.0));       // Sacred gold (was 0.16)
        auraGroup.add(makeAuraSprite(0x9466EB, 0.3, 4.6, 3.2, 0.18, -0.08));    // Mystic violet (was 0.1)
        auraGroup.add(makeAuraSprite(0x40E0D0, 0.25, 6.8, 1.2, -0.24, 0.12));   // Celestial teal (was 0.08)
        auraGroup.add(makeAuraSprite(0xFFF0D0, 0.18, 9.6, 0.72, 0.0, 0.0));     // Spectral white-gold (was 0.055)

        if (this.camera) {
            this.camera.add(auraGroup);
        } else {
            this.root.add(auraGroup);
        }

        this.cameraAura = auraGroup;
    }

    /**
     * Update all effects each frame
     */
    update(deltaTime) {
        if (this.frameScheduler?.shouldRunVisual?.() === false) return;

        if (this._timeOrigin === undefined) {
            this._timeOrigin = VisualTime.now; // Phase 2A: VisualTime canonical clock (behavior-preserving)
        }
        const currentTime = VisualTime.now - this._timeOrigin;
        const visualDelta = this._lastVisualTime === undefined
            ? 0
            : Math.max(0, currentTime - this._lastVisualTime);
        this._lastVisualTime = currentTime;
        this.time = currentTime;
        const cameraPosition = this.camera?.position || this._vec3a.set(0, 0, 0);
        const cameraDirection = this._vec3b.set(0, 0, 0);

        if (this.camera) {
            this.camera.getWorldDirection(cameraDirection);
        }

        // --- Global visibility fade (setVisible / quality toggle) ---
        if (Math.abs(this._fadeOpacity - this._targetOpacity) > 0.001) {
            const fadeDir = this._targetOpacity > this._fadeOpacity ? 1 : -1;
            this._fadeOpacity += fadeDir * this._fadeSpeed * deltaTime;
            this._fadeOpacity = Math.max(0, Math.min(1, this._fadeOpacity));

            if (this._fadeOpacity <= 0) {
                this._hideHeroObjects();
                this.edgeGlowObjects.forEach(obj => { obj.visible = false; });
                return; // Skip rest of update when invisible
            }
        }

        const fade = this._fadeOpacity;

        // --- Hero layer state machine evaluation ---
        this._evaluateHeroState(deltaTime);
        let heroFade = this._heroOpacity * fade; // Combined hero × global fade
        const heroActive = this._heroState !== 'dormant';

        const quality = this._qualityProfile || this._getQualityProfile(this.qualityTier);
        const macroProfile = this._resolveMacroProfile();
        const spectacle = this._advanceSpectacleState(visualDelta);
        const spectacleMix = Math.max(0, Math.min(1, spectacle.mix ?? 0));
        const masterScale = this._applySpectacleScale(macroProfile.masterScale, spectacle.masterScale, spectacleMix);
        const edgeGlowScale = masterScale * this._applySpectacleScale(macroProfile.edgeGlowScale, spectacle.edgeGlowScale, spectacleMix);
        const volumetricScale = this._applySpectacleScale(macroProfile.volumetricScale, spectacle.volumetricScale, spectacleMix);
        const fogScale = this._applySpectacleScale(macroProfile.fogScale, spectacle.fogScale, spectacleMix);
        const distortionScale = this._applySpectacleScale(macroProfile.distortionScale, spectacle.distortionScale, spectacleMix);
        const riftScale = this._applySpectacleScale(macroProfile.riftScale, spectacle.riftScale, spectacleMix);
        const particleScale = this._applySpectacleScale(macroProfile.particleScale, spectacle.particleScale, spectacleMix);
        const cameraAuraScale = this._applySpectacleScale(macroProfile.cameraAuraScale, spectacle.cameraAuraScale, spectacleMix);
        heroFade *= masterScale;

        // --- Metrics-driven parameters ---
        const { harmony, corruption, synergy, stability } = this._metrics;
        const pulseMultiplier = 1 + (1 - stability) * 0.25;

        // ================================================================
        // BASELINE TIER (always-on, cheap)
        // ================================================================

        // GLOBAL SAFETY: Ensure all animated objects have valid rotation order
        this.edgeGlowObjects.forEach(o => this.ensureRotationOrder(o));

        // Update edge glows to follow linked meshes (baseline — always runs)
        this.edgeGlowObjects.forEach(glow => {
            if (!glow.userData || !glow.userData.linkedMesh) return;

            const mesh = glow.userData.linkedMesh;

            // Position
            if (mesh.position) {
                glow.position.copy(mesh.position);
            }

            // ⚠ SAFE ROTATION SYNC (bez undefined Euler.order)
            if (mesh.quaternion) {
                glow.quaternion.copy(mesh.quaternion);
            } else if (mesh.rotation) {
                const srcRot = mesh.rotation;
                const safeOrder = srcRot.order || 'XYZ';
                glow.rotation.set(srcRot.x, srcRot.y, srcRot.z, safeOrder);
            }

            // Scale
            if (mesh.scale) {
                glow.scale.copy(mesh.scale);
            }

            if (glow.userData?.baseScale) {
                const pulse = Math.sin(this.time * 0.7 + glow.userData.pulsePhase) * 0.5 + 0.5;
                glow.scale.multiplyScalar(0.985 + pulse * 0.03);
            }

            // Fresnel effect based on camera angle
            if (glow.material && this.camera) {
                const surfaceNormal = this._vec3c.set(0, 1, 0);
                const fresnel = Math.abs(cameraDirection.dot(surfaceNormal));
                const distance = this.camera.position.distanceTo(mesh.position || glow.position);
                const distanceFactor = THREE.MathUtils.clamp(1 - distance / 260, 0.25, 1);
                glow.material.opacity = glow.userData.baseOpacity * quality.edgeGlowOpacity * edgeGlowScale * (0.18 + fresnel * 0.82) * distanceFactor * fade;
            }
        });

        // ================================================================
        // HERO TIER (world-state-gated, burst only)
        // All loops below are SKIPPED when hero is dormant → zero cost
        // ================================================================
        if (!heroActive) return;

        // Safety: ensure rotation orders for hero objects
        this.distortionZones.forEach(o => this.ensureRotationOrder(o));
        this.rifts.forEach(o => this.ensureRotationOrder(o));
        this.particles.forEach(o => this.ensureRotationOrder(o));
        this.volumetricLights.forEach(o => this.ensureRotationOrder(o));
        this.atmosphericLayers.forEach(o => this.ensureRotationOrder(o));
        this.spectralCaustics.forEach(o => this.ensureRotationOrder(o));

        // Update volumetric lights
        this.volumetricLights.forEach(light => {
            if (!light.userData?.pulseSpeed) return;

            const phase = light.userData.phase || 0;
            const pulse = Math.sin(this.time * light.userData.pulseSpeed + phase) * 0.5 + 0.5;
            const driftX = Math.cos(this.time * light.userData.driftSpeed + phase) * light.userData.driftRadius;
            const driftY = Math.sin(this.time * light.userData.driftSpeed * 0.75 + phase * 0.7) * light.userData.driftHeight;
            const driftZ = Math.sin(this.time * light.userData.driftSpeed * 0.9 + phase * 1.3) * (light.userData.driftRadius * 0.6);

            if (light.userData.basePosition) {
                light.position.set(
                    light.userData.basePosition.x + driftX,
                    light.userData.basePosition.y + driftY,
                    light.userData.basePosition.z + driftZ
                );
            }

            if (light.userData.baseRotation) {
                light.rotation.set(
                    light.userData.baseRotation.x + Math.sin(this.time * 0.08 + phase) * 0.04,
                    light.userData.baseRotation.y + this.time * light.userData.spinSpeed,
                    light.userData.baseRotation.z + Math.cos(this.time * 0.09 + phase) * 0.06,
                    "XYZ"
                );
            }

            if (light.userData.baseScale) {
                const scalePulse = 1 + pulse * light.userData.scalePulse * quality.volumetricScale;
                light.scale.setScalar(scalePulse);
            }

            light.material.opacity = light.userData.baseOpacity * quality.volumetricOpacity * volumetricScale * (0.55 + pulse * 0.45) * heroFade;

            if (light.material?.color && light.userData?.tint) {
                const tint = 0.96 + pulse * 0.06;
                light.material.color.setRGB(
                    THREE.MathUtils.clamp(light.userData.tint.r * tint + harmony * 0.045 + corruption * 0.025, 0, 1),
                    THREE.MathUtils.clamp(light.userData.tint.g * tint + synergy * 0.045, 0, 1),
                    THREE.MathUtils.clamp(light.userData.tint.b * tint + corruption * 0.075 + (1 - stability) * 0.025, 0, 1)
                );
            }

            light.rotation.x += visualDelta * 0.01;
        });

        // Update atmospheric layers
        this.atmosphericLayers.forEach(layer => {
            const pulse = Math.sin(this.time * layer.userData.pulseSpeed + layer.userData.phase) * 0.5 + 0.5;
            const driftX = Math.cos(this.time * layer.userData.driftSpeed + layer.userData.phase) * layer.userData.driftRadius;
            const driftZ = Math.sin(this.time * layer.userData.driftSpeed * 0.9 + layer.userData.phase * 1.2) * layer.userData.driftRadius;
            const driftY = Math.sin(this.time * layer.userData.pulseSpeed * 0.5 + layer.userData.phase) * layer.userData.wobble;

            layer.position.x = cameraPosition.x * layer.userData.followFactor + driftX;
            layer.position.y = layer.userData.basePosition.y + driftY;
            layer.position.z = cameraPosition.z * layer.userData.followFactor + driftZ;
            layer.rotation.z = Math.sin(this.time * 0.02 + layer.userData.phase) * 0.01;
            layer.scale.setScalar(0.985 + pulse * 0.03 * quality.fogScale);
            layer.material.opacity = layer.userData.baseOpacity * quality.fogOpacity * fogScale * (0.65 + pulse * 0.35) * heroFade;
        });

        // Update distortion zones
        this.distortionZones.forEach(zone => {
            const pulse = Math.sin(this.time * zone.userData.frequency + zone.userData.phase) * 0.5 + 0.5;
            zone.material.emissiveIntensity = pulse * zone.userData.intensity * 0.2 * quality.distortionIntensity * distortionScale;

            // Rotating distortion
            zone.rotation.x += visualDelta * 0.1;
            zone.rotation.y += visualDelta * 0.15;
            zone.rotation.z += visualDelta * 0.08;
        });

        // Update rifts
        this.rifts.forEach(rift => {
            if (!rift.userData.pulseSpeed) return;

            const pulse = Math.sin(this.time * rift.userData.pulseSpeed + rift.userData.phase) * 0.5 + 0.5;

            if (rift.material.opacity !== undefined) {
                rift.material.opacity = rift.userData.baseOpacity * quality.riftOpacity * riftScale * (0.5 + pulse * 0.5) * heroFade;
            }

            if (rift.material.emissiveIntensity !== undefined) {
                rift.material.emissiveIntensity = pulse * 0.2;
            }

            // Fractal motion
            rift.rotation.x += visualDelta * 0.05;
            rift.rotation.z += visualDelta * 0.08;
        });

        // Update hero caustic fields
        this.spectralCaustics.forEach(field => {
            if (!field.userData?.pulseSpeed) return;
            const pulse = Math.sin(this.time * field.userData.pulseSpeed + field.userData.phase) * 0.5 + 0.5;
            field.rotation.z += visualDelta * field.userData.spinSpeed * (1 + spectacleMix * 1.8);
            field.rotation.x += Math.sin(this.time * 0.05 + field.userData.phase) * 0.00025;
            field.scale.setScalar(0.94 + pulse * 0.08 + spectacleMix * 0.045);
            if (field.material) {
                field.material.opacity = field.userData.baseOpacity * quality.causticOpacity * masterScale * (0.48 + pulse * 0.52) * heroFade;
            }
        });

        // Update dream particles
        this.particles.forEach(system => {
            const geom = system?.geometry;
            const posAttr = geom?.attributes?.position;
            const positions = posAttr?.array;
            const velocities = system?.userData?.velocities;
            const bounds = system?.userData?.bounds;

            if (!isValidBufferAttrArray(posAttr)) return;
            if (!isValidTypedArray(velocities)) return;
            if (!Number.isFinite(bounds)) return;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];

                // Wrap around with smooth transition
                if (Math.abs(positions[i]) > bounds) {
                    positions[i] = -positions[i];
                    velocities[i] = -velocities[i];
                }
                if (Math.abs(positions[i + 2]) > bounds) {
                    positions[i + 2] = -positions[i + 2];
                    velocities[i + 2] = -velocities[i + 2];
                }
            }

            posAttr.needsUpdate = true;

            const systemPulse = Math.sin(this.time * (0.35 + system.userData.system.speed * 20) + system.id) * 0.5 + 0.5;
            if (system.material) {
                system.material.opacity = quality.particleOpacity * particleScale * (0.55 + systemPulse * 0.25) * heroFade;
            }
            system.rotation.y += visualDelta * 0.01;
            system.scale.setScalar(0.98 + systemPulse * 0.03);
        });

        // Update camera aura
        if (this.cameraAura) {
            const auraPhase = this.cameraAura.userData.pulsePhase || 0;
            const auraPulse = Math.sin(this.time * 0.4 + auraPhase) * 0.5 + 0.5;

            this.cameraAura.position.set(0, 0, -1.85 - auraPulse * 0.12);
            this.cameraAura.rotation.z = Math.sin(this.time * 0.08 + this.cameraAura.userData.driftPhase) * 0.03;

            this.cameraAura.children.forEach((sprite, index) => {
                const spritePulse = Math.sin(this.time * (0.5 + index * 0.09) + sprite.userData.phase) * 0.5 + 0.5;
                const baseScale = sprite.userData.baseScale;
                sprite.material.opacity = sprite.userData.baseOpacity * quality.cameraAuraOpacity * cameraAuraScale * (0.62 + spritePulse * 0.38) * heroFade;
                sprite.scale.set(
                    baseScale.x * (0.94 + auraPulse * 0.08),
                    baseScale.y * (0.94 + auraPulse * 0.08),
                    1
                );
                sprite.material.rotation = Math.sin(this.time * 0.12 + index) * 0.12;
            });
        }
    }

    /**
     * Toggle visibility with smooth fade transition.
     * Hero objects respect their own state machine — only baseline (edge glows)
     * is directly toggled here. Hero objects will show/hide via _evaluateHeroState().
     */
    setVisible(visible) {
        this._targetOpacity = visible ? 1 : 0;
        if (visible) {
            // Show baseline objects immediately so fade-in is visible
            this.edgeGlowObjects.forEach(obj => { obj.visible = true; });
            // Hero objects are managed by the hero state machine
            // They will become visible when a trigger fires
        }
    }

    /**
     * Check if effects are targeted to be visible
     */
    isVisible() {
        return this._targetOpacity > 0;
    }

    /**
     * Get renderer settings for post-processing
     */
    getRendererSettings() {
        const quality = this._qualityProfile || this._getQualityProfile(this.qualityTier);
        return {
            toneMapping: quality.renderer.toneMapping,
            toneMappingExposure: quality.renderer.toneMappingExposure,
            outputColorSpace: THREE.SRGBColorSpace
        };
    }

    /**
     * Cleanup all effects
     */
    dispose() {
        this.detachSemanticBus();

        const cleanupArray = (arr) => {
            arr.forEach(obj => {
                if (obj.parent) {
                    obj.parent.remove(obj);
                } else {
                    this.scene.remove(obj);
                }
                this._disposeObject3D(obj);
            });
            arr.length = 0;
        };

        cleanupArray(this.volumetricLights);
        cleanupArray(this.atmosphericLayers);
        cleanupArray(this.edgeGlowObjects);
        cleanupArray(this.distortionZones);
        cleanupArray(this.rifts);
        cleanupArray(this.particles);
        cleanupArray(this.spectralCaustics);

        if (this.cameraAura) {
            if (this.cameraAura.parent) {
                this.cameraAura.parent.remove(this.cameraAura);
            } else {
                this.scene.remove(this.cameraAura);
            }
            this._disposeObject3D(this.cameraAura);
            this.cameraAura = null;
        }

        Object.values(this.sharedTextures).forEach(texture => {
            if (texture && typeof texture.dispose === 'function') {
                texture.dispose();
            }
        });

        this.sharedTextures = {};
        this._applied = false;
    }
}
