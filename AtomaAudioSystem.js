/**
 * ATOMA AUDIO SYSTEM
 * 
 * Procedural audio generation using Tone.js.
 * Design Philosophy:
 * - Intelligent, intentional, systemic, calm.
 * - No arcade clicks or loops.
 * - Silence and restraint as core tools.
 */

import * as Tone from 'tone';

const WORLD_MACRO_STATE_DEFAULT = 'DORMANT';

const WORLD_MACRO_AUDIO_PROFILES = {
    DORMANT: {
        oscillatorType: 'sine',
        droneNotes: ['C2'],
        droneInterval: 7.2,
        droneVelocity: 0.12,
        droneDuration: '2n',
        droneVolume: -37,
        droneFrequency: 180,
        droneOctaves: 1.4,
        droneQ: 0.8,
        impulseNotes: ['C3'],
        impulseInterval: 8.4,
        impulseVelocity: 0.08,
        impulseDuration: '16n',
        impulseVolume: -35,
        impulseFrequency: 420,
        impulseOctaves: 1.6,
        impulseQ: 1.1,
        noiseInterval: 12,
        noiseVelocity: 0.05,
        noiseDuration: '32n',
        noiseVolume: -48,
        noiseFrequency: 220,
        noiseQ: 0.9,
        transitionNotes: ['C3', 'G3'],
        transitionIntensity: 0.18,
        transitionCue: 'world-state-transition'
    },
    AWAKENING: {
        oscillatorType: 'triangle',
        droneNotes: ['D2', 'A2'],
        droneInterval: 5.2,
        droneVelocity: 0.14,
        droneDuration: '2n',
        droneVolume: -33,
        droneFrequency: 240,
        droneOctaves: 1.7,
        droneQ: 0.95,
        impulseNotes: ['D3', 'A3'],
        impulseInterval: 4.6,
        impulseVelocity: 0.12,
        impulseDuration: '16n',
        impulseVolume: -31,
        impulseFrequency: 560,
        impulseOctaves: 2.0,
        impulseQ: 1.2,
        noiseInterval: 8.2,
        noiseVelocity: 0.08,
        noiseDuration: '32n',
        noiseVolume: -43,
        noiseFrequency: 320,
        noiseQ: 1.0,
        transitionNotes: ['D3', 'A3'],
        transitionIntensity: 0.26,
        transitionCue: 'world-state-transition'
    },
    COMMUNION: {
        oscillatorType: 'triangle',
        droneNotes: ['C2', 'G2', 'C3'],
        droneInterval: 4.4,
        droneVelocity: 0.16,
        droneDuration: '1n',
        droneVolume: -31,
        droneFrequency: 320,
        droneOctaves: 2.1,
        droneQ: 1.1,
        impulseNotes: ['E3', 'G3', 'B3'],
        impulseInterval: 3.8,
        impulseVelocity: 0.14,
        impulseDuration: '8n',
        impulseVolume: -28,
        impulseFrequency: 760,
        impulseOctaves: 2.4,
        impulseQ: 1.4,
        noiseInterval: 6.8,
        noiseVelocity: 0.11,
        noiseDuration: '16n',
        noiseVolume: -41,
        noiseFrequency: 460,
        noiseQ: 1.1,
        transitionNotes: ['E3', 'G3', 'B3'],
        transitionIntensity: 0.34,
        transitionCue: 'world-state-transition'
    },
    SCHISM: {
        oscillatorType: 'sawtooth',
        droneNotes: ['C2', 'C#2', 'G2'],
        droneInterval: 3.9,
        droneVelocity: 0.18,
        droneDuration: '1n',
        droneVolume: -29,
        droneFrequency: 480,
        droneOctaves: 2.4,
        droneQ: 1.5,
        impulseNotes: ['C3', 'F#3'],
        impulseInterval: 2.9,
        impulseVelocity: 0.16,
        impulseDuration: '8n',
        impulseVolume: -26,
        impulseFrequency: 1100,
        impulseOctaves: 2.8,
        impulseQ: 1.9,
        noiseInterval: 3.4,
        noiseVelocity: 0.14,
        noiseDuration: '16n',
        noiseVolume: -38,
        noiseFrequency: 980,
        noiseQ: 1.7,
        transitionNotes: ['C3', 'C#3', 'G3'],
        transitionIntensity: 0.48,
        transitionCue: 'world-state-transition'
    },
    REVELATION: {
        oscillatorType: 'triangle',
        droneNotes: ['C3', 'G3', 'D4'],
        droneInterval: 3.2,
        droneVelocity: 0.2,
        droneDuration: '1n',
        droneVolume: -28,
        droneFrequency: 720,
        droneOctaves: 2.8,
        droneQ: 1.8,
        impulseNotes: ['D4', 'A4', 'E5'],
        impulseInterval: 2.4,
        impulseVelocity: 0.18,
        impulseDuration: '8n',
        impulseVolume: -24,
        impulseFrequency: 1480,
        impulseOctaves: 3.2,
        impulseQ: 2.2,
        noiseInterval: 2.8,
        noiseVelocity: 0.16,
        noiseDuration: '16n',
        noiseVolume: -35,
        noiseFrequency: 1560,
        noiseQ: 2.0,
        transitionNotes: ['D4', 'A4', 'E5'],
        transitionIntensity: 0.56,
        transitionCue: 'world-state-transition'
    }
};

export class AtomaAudioSystem {
    constructor() {
        if (typeof window !== 'undefined' && !window.Tone) {
            window.Tone = Tone;
        }

        this.initialized = false;
        this.storageKey = 'atoma.audio.enabled';
        this.enabled = this._readEnabledPreference();
        this.lastTriggerAt = new Map();
        this.audioBackend = Tone.__ATOMA_TONE_STUB__ ? 'fallback' : 'real-tone';
        this.lastStartError = null;
        this._audioWarnings = new Set();
        this._worldContext = {
            consciousnessState: null,
            worldMoodState: null,
            networkState: null,
            liveMetrics: null,
            worldMacroState: WORLD_MACRO_STATE_DEFAULT,
            macroState: WORLD_MACRO_STATE_DEFAULT,
            macroProfile: { ...WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT] }
        };
        this._worldMacroState = WORLD_MACRO_STATE_DEFAULT;
        this._worldMacroProfile = { ...WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT] };
        this._worldMacroTimers = {
            drone: 0,
            impulse: 0,
            noise: 0
        };
        this._worldMacroBlend = {
            droneVolume: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].droneVolume,
            droneFrequency: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].droneFrequency,
            droneQ: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].droneQ,
            impulseVolume: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].impulseVolume,
            impulseFrequency: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].impulseFrequency,
            impulseQ: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].impulseQ,
            noiseVolume: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].noiseVolume,
            noiseFrequency: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].noiseFrequency,
            noiseQ: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].noiseQ,
            eventLeadVolume: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].impulseVolume + 4,
            eventAccentVolume: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].noiseVolume + 6,
            eventNoiseVolume: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].noiseVolume,
            eventLeadFrequency: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].impulseFrequency,
            eventAccentFrequency: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].noiseFrequency,
            eventNoiseFrequency: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].noiseFrequency,
            eventLeadQ: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].impulseQ,
            eventAccentQ: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].noiseQ,
            eventNoiseQ: WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT].noiseQ
        };
        
        // All Tone.js synths and effects will be created in createSynths()
        // This prevents AudioContext warning before user gesture
        console.log('[Audio] System Constructed (Waiting for user interaction)');
    }

    _warnAudioIssue(tag, error) {
        if (this._audioWarnings.has(tag)) return;
        this._audioWarnings.add(tag);
        console.warn(`[Audio] ${tag}`, error);
    }

    _createAudioNode(tag, factory, { critical = false } = {}) {
        try {
            return factory();
        } catch (error) {
            this._warnAudioIssue(`Node creation failed: ${tag}`, error);
            if (critical) throw error;
            return null;
        }
    }

    _connectNode(node, target, tag = 'audio connection') {
        if (!node || !target || typeof node.connect !== 'function') return node;
        try {
            node.connect(target);
        } catch (error) {
            this._warnAudioIssue(`Connect failed: ${tag}`, error);
        }
        return node;
    }

    _disconnectNode(node, target = undefined, tag = 'audio disconnect') {
        if (!node || typeof node.disconnect !== 'function') return node;
        try {
            if (target !== undefined) {
                node.disconnect(target);
            } else {
                node.disconnect();
            }
        } catch (error) {
            this._warnAudioIssue(`Disconnect failed: ${tag}`, error);
        }
        return node;
    }

    _routeToDestination(node, tag = 'audio destination') {
        if (!node || typeof node.toDestination !== 'function') return node;
        try {
            node.toDestination();
        } catch (error) {
            this._warnAudioIssue(`Destination routing failed: ${tag}`, error);
        }
        return node;
    }

    _routeToMaster(node, tag = 'audio master route') {
        if (!node) return node;
        const target = this.masterReverb || this.masterLimiter || null;
        if (target) {
            this._connectNode(node, target, tag);
        } else {
            this._routeToDestination(node, `${tag}:fallbackDestination`);
        }
        return node;
    }

    _hasWritableParam(param) {
        return !!param && typeof param === 'object' && 'value' in param;
    }

    _setParamValue(param, value, tag = 'audio param') {
        if (this._hasWritableParam(param)) {
            try {
                param.value = value;
                return true;
            } catch (error) {
                this._warnAudioIssue(`Param write failed: ${tag}`, error);
            }
        }
        if (param && typeof param.rampTo === 'function') {
            try {
                param.rampTo(value, 0.01);
                return true;
            } catch (error) {
                this._warnAudioIssue(`Param ramp failed: ${tag}`, error);
            }
        }
        return false;
    }

    _setNodeVolume(node, value, tag = 'audio volume') {
        return this._setParamValue(node?.volume, value, tag);
    }

    _safeNodeSet(node, payload, tag = 'audio node set') {
        if (!node || typeof node.set !== 'function') return false;
        try {
            node.set(payload);
            return true;
        } catch (error) {
            this._warnAudioIssue(`Node set failed: ${tag}`, error);
            return false;
        }
    }

    _recordStartError(stage, error) {
        this.lastStartError = {
            stage,
            name: error?.name || 'Error',
            message: error?.message || String(error)
        };
        return this.lastStartError;
    }

    getStatus() {
        const destination = typeof Tone.getDestination === 'function'
            ? Tone.getDestination()
            : Tone.Destination;
        const toneContext = typeof Tone.getContext === 'function'
            ? Tone.getContext()
            : Tone.context || null;

        return {
            backend: this.audioBackend,
            exists: true,
            initialized: this.initialized === true,
            coreReady: this.initialized === true,
            enabled: this.enabled !== false,
            muted: !!destination?.mute,
            toneState: toneContext?.state ?? 'unknown',
            lastStartError: this.lastStartError
        };
    }

    _readEnabledPreference() {
        try {
            if (typeof localStorage === 'undefined') return true;
            const stored = localStorage.getItem(this.storageKey);
            if (stored === null) return true;
            return stored !== '0' && stored !== 'false';
        } catch {
            return true;
        }
    }

    _setDestinationMute(muted) {
        const destination = typeof Tone.getDestination === 'function'
            ? Tone.getDestination()
            : Tone.Destination;
        if (destination && 'mute' in destination) {
            destination.mute = muted;
        }
    }

    _createDramaturgyPanner() {
        const toneContext = typeof Tone.getContext === 'function'
            ? Tone.getContext()
            : Tone.context || null;
        const rawContext = toneContext?.rawContext || null;

        if (typeof Tone.Panner === 'function') {
            try {
                return new Tone.Panner(0);
            } catch (_) {
                try {
                    return new Tone.Panner({ pan: 0 });
                } catch (_) {
                    // continue to fallback
                }
            }
        }

        if (typeof Tone.PanVol === 'function') {
            try {
                return new Tone.PanVol({ pan: 0, volume: 0 });
            } catch (_) {
                // continue to fallback
            }
        }

        if (typeof Tone.Channel === 'function') {
            try {
                return new Tone.Channel({ pan: 0, volume: 0 });
            } catch (_) {
                // continue to fallback
            }
        }

        if (rawContext && typeof rawContext.createStereoPanner === 'function') {
            const panner = rawContext.createStereoPanner();
            panner.pan.value = 0;
            return panner;
        }

        if (rawContext && typeof rawContext.createGain === 'function') {
            const gainNode = rawContext.createGain();
            gainNode.gain.value = 1;
            return gainNode;
        }

        return {
            connect: () => this,
            disconnect: () => this
        };
    }

    _setDramaturgyPanValue(value) {
        if (!this._dramaturgyPanner || !this._dramaturgyPanner.pan) return;
        this._setParamValue(this._dramaturgyPanner.pan, Math.max(-1, Math.min(1, value)), 'dramaturgy.pan');
    }

    setEnabled(enabled) {
        const nextEnabled = enabled !== false;
        this.enabled = nextEnabled;

        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.storageKey, nextEnabled ? '1' : '0');
            }
        } catch {
            // ignore persistence failures
        }

        if (!nextEnabled) {
            this.lastTriggerAt.clear();
            this._worldMacroTimers.drone = 0;
            this._worldMacroTimers.impulse = 0;
            this._worldMacroTimers.noise = 0;
        }

        this._setDestinationMute(!nextEnabled);
        return this.enabled;
    }

    toggleEnabled() {
        return this.setEnabled(!this.enabled);
    }

    canTrigger(key, cooldownMs) {
        const now = performance.now();
        const last = this.lastTriggerAt.get(key) ?? -Infinity;
        if (now - last < cooldownMs) return false;
        this.lastTriggerAt.set(key, now);
        return true;
    }

    _lerp(current, target, amount) {
        const alpha = Math.max(0, Math.min(1, Number(amount) || 0));
        return current + (target - current) * alpha;
    }

    _resolveWorldMacroState(context = {}) {
        const normalized = context && typeof context === 'object' ? context : {};
        const worldContext = normalized.worldContext && typeof normalized.worldContext === 'object'
            ? normalized.worldContext
            : normalized;
        return String(
            normalized.macroState
            || normalized.worldMacroState
            || worldContext.macroState
            || worldContext.worldMacroState
            || worldContext.consciousnessState?.worldMacroState
            || worldContext.consciousnessState?.macroState
            || WORLD_MACRO_STATE_DEFAULT
        ).toUpperCase();
    }

    _resolveWorldMacroProfile(macroState = WORLD_MACRO_STATE_DEFAULT) {
        const state = String(macroState || WORLD_MACRO_STATE_DEFAULT).toUpperCase();
        return { ...(WORLD_MACRO_AUDIO_PROFILES[state] || WORLD_MACRO_AUDIO_PROFILES[WORLD_MACRO_STATE_DEFAULT]) };
    }

    setWorldContext(context = {}) {
        const normalized = context && typeof context === 'object' ? context : {};
        const worldContext = normalized.worldContext && typeof normalized.worldContext === 'object'
            ? normalized.worldContext
            : normalized;
        const macroState = this._resolveWorldMacroState(normalized);
        const macroProfile = normalized.macroProfile && typeof normalized.macroProfile === 'object'
            ? { ...normalized.macroProfile }
            : this._resolveWorldMacroProfile(macroState);

        this._worldContext = {
            consciousnessState: worldContext.consciousnessState || normalized.consciousnessState || null,
            worldMoodState: worldContext.worldMoodState || normalized.worldMoodState || null,
            networkState: worldContext.networkState || normalized.networkState || null,
            liveMetrics: worldContext.liveMetrics || normalized.liveMetrics || normalized.metrics || null,
            worldMacroState: macroState,
            macroState,
            macroProfile: { ...macroProfile }
        };

        return {
            ...this._worldContext,
            worldContext: { ...this._worldContext }
        };
    }

    update(deltaTime = 0, context = {}) {
        const normalizedContext = this.setWorldContext(context);
        const semanticBus = context?.semanticBus || this.semanticBus || null;
        const nextState = normalizedContext.worldMacroState || WORLD_MACRO_STATE_DEFAULT;
        const nextProfile = this._resolveWorldMacroProfile(nextState);
        const previousState = this._worldMacroState;

        this._worldMacroState = nextState;
        this._worldMacroProfile = { ...nextProfile };

        this._applyWorldMacroMix(nextProfile, deltaTime);

        if (!this.initialized || !this.enabled) {
            return normalizedContext;
        }

        if (previousState && previousState !== nextState) {
            const transitionPayload = {
                previousState,
                nextState,
                macroState: nextState,
                worldMacroState: nextState,
                macroProfile: { ...nextProfile },
                worldContext: { ...this._worldContext },
                audioCue: 'world-state-transition',
                audioLayer: 'world-state-transition',
                audioIntensity: Number(nextProfile.transitionIntensity) || 0.4,
                transitionCue: nextProfile.transitionCue || 'world-state-transition',
                source: 'AtomaAudioSystem'
            };

            if (semanticBus?.emit) {
                const priority = semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL ?? undefined;
                semanticBus.emit('world.macroState.changed', transitionPayload, priority !== undefined ? { priority } : undefined);
            } else {
                this.playWorldMacroStateChanged(transitionPayload, 'world.macroState.changed');
            }

            this._primeWorldMacroAudio(nextProfile, transitionPayload.audioIntensity);
            return normalizedContext;
        }

        this._advanceWorldMacroAudio(nextProfile, deltaTime);
        return normalizedContext;
    }

    _applyWorldMacroMix(profile, deltaTime = 0) {
        if (!profile) return;

        const blend = Math.max(0.05, Math.min(1, Number(deltaTime) > 0 ? Number(deltaTime) * 4 : 0.16));
        const mix = this._worldMacroBlend;
        mix.droneVolume = this._lerp(mix.droneVolume, profile.droneVolume, blend);
        mix.droneFrequency = this._lerp(mix.droneFrequency, profile.droneFrequency, blend);
        mix.droneQ = this._lerp(mix.droneQ, profile.droneQ, blend);
        mix.impulseVolume = this._lerp(mix.impulseVolume, profile.impulseVolume, blend);
        mix.impulseFrequency = this._lerp(mix.impulseFrequency, profile.impulseFrequency, blend);
        mix.impulseQ = this._lerp(mix.impulseQ, profile.impulseQ, blend);
        mix.noiseVolume = this._lerp(mix.noiseVolume, profile.noiseVolume, blend);
        mix.noiseFrequency = this._lerp(mix.noiseFrequency, profile.noiseFrequency, blend);
        mix.noiseQ = this._lerp(mix.noiseQ, profile.noiseQ, blend);
        mix.eventLeadVolume = this._lerp(mix.eventLeadVolume, profile.impulseVolume + 4, blend);
        mix.eventAccentVolume = this._lerp(mix.eventAccentVolume, profile.noiseVolume + 6, blend);
        mix.eventNoiseVolume = this._lerp(mix.eventNoiseVolume, profile.noiseVolume, blend);
        mix.eventLeadFrequency = this._lerp(mix.eventLeadFrequency, profile.impulseFrequency, blend);
        mix.eventAccentFrequency = this._lerp(mix.eventAccentFrequency, profile.noiseFrequency, blend);
        mix.eventNoiseFrequency = this._lerp(mix.eventNoiseFrequency, profile.noiseFrequency, blend);
        mix.eventLeadQ = this._lerp(mix.eventLeadQ, profile.impulseQ, blend);
        mix.eventAccentQ = this._lerp(mix.eventAccentQ, profile.noiseQ, blend);
        mix.eventNoiseQ = this._lerp(mix.eventNoiseQ, profile.noiseQ, blend);

        if (this.worldDroneSynth) {
            this._setNodeVolume(this.worldDroneSynth, mix.droneVolume, 'worldDroneSynth.mixVolume');
            this._safeNodeSet(this.worldDroneSynth, {
                oscillator: { type: profile.oscillatorType || 'sine' },
                filterEnvelope: {
                    baseFrequency: mix.droneFrequency,
                    octaves: profile.droneOctaves ?? 1.4,
                    exponent: 2
                },
                filter: {
                    Q: mix.droneQ
                }
            }, 'worldDroneSynth.mixSet');
        }

        if (this.worldImpulseSynth) {
            this._setNodeVolume(this.worldImpulseSynth, mix.impulseVolume, 'worldImpulseSynth.mixVolume');
            this._safeNodeSet(this.worldImpulseSynth, {
                oscillator: { type: profile.oscillatorType || 'triangle' },
                filterEnvelope: {
                    baseFrequency: mix.impulseFrequency,
                    octaves: profile.impulseOctaves ?? 2.0,
                    exponent: 2
                },
                filter: {
                    Q: mix.impulseQ
                }
            }, 'worldImpulseSynth.mixSet');
        }

        if (this.worldNoiseSynth) {
            this._setNodeVolume(this.worldNoiseSynth, mix.noiseVolume, 'worldNoiseSynth.mixVolume');
        }
        if (this.worldNoiseFilter) {
            this._setParamValue(this.worldNoiseFilter.frequency, mix.noiseFrequency, 'worldNoiseFilter.frequency');
            this._setParamValue(this.worldNoiseFilter.Q, mix.noiseQ, 'worldNoiseFilter.Q');
        }

        if (this.eventLeadSynth) {
            this._setNodeVolume(this.eventLeadSynth, mix.eventLeadVolume, 'eventLeadSynth.mixVolume');
            this._safeNodeSet(this.eventLeadSynth, {
                filterEnvelope: {
                    baseFrequency: mix.eventLeadFrequency,
                    octaves: profile.impulseOctaves ?? 2.0,
                    exponent: 2
                },
                filter: {
                    Q: mix.eventLeadQ
                }
            }, 'eventLeadSynth.mixSet');
        }
        if (this.eventAccentSynth) {
            this._setNodeVolume(this.eventAccentSynth, mix.eventAccentVolume, 'eventAccentSynth.mixVolume');
            this._safeNodeSet(this.eventAccentSynth, {
                filterEnvelope: {
                    baseFrequency: mix.eventAccentFrequency,
                    octaves: profile.noiseOctaves ?? 2.8,
                    exponent: 2
                },
                filter: {
                    Q: mix.eventAccentQ
                }
            }, 'eventAccentSynth.mixSet');
        }
        if (this.eventNoiseSynth) {
            this._setNodeVolume(this.eventNoiseSynth, mix.eventNoiseVolume, 'eventNoiseSynth.mixVolume');
        }
        if (this.eventNoiseFilter) {
            this._setParamValue(this.eventNoiseFilter.frequency, mix.eventNoiseFrequency, 'eventNoiseFilter.frequency');
            this._setParamValue(this.eventNoiseFilter.Q, mix.eventNoiseQ, 'eventNoiseFilter.Q');
        }
    }

    _primeWorldMacroAudio(profile, intensity = 0.4) {
        if (!profile) return;
        this._worldMacroTimers.drone = 0;
        this._worldMacroTimers.impulse = 0;
        this._worldMacroTimers.noise = 0;
        this._triggerWorldMacroDrone(profile, intensity);
        this._triggerWorldMacroImpulse(profile, Math.max(0.12, intensity * 0.86));
        this._triggerWorldMacroNoise(profile, Math.max(0.08, intensity * 0.5));
    }

    _advanceWorldMacroAudio(profile, deltaTime = 0) {
        if (!profile) return;
        const dt = Math.max(0, Number(deltaTime) || 0);
        this._worldMacroTimers.drone += dt;
        this._worldMacroTimers.impulse += dt;
        this._worldMacroTimers.noise += dt;

        while (this._worldMacroTimers.drone >= profile.droneInterval) {
            this._worldMacroTimers.drone -= profile.droneInterval;
            this._triggerWorldMacroDrone(profile, profile.droneVelocity);
        }

        while (this._worldMacroTimers.impulse >= profile.impulseInterval) {
            this._worldMacroTimers.impulse -= profile.impulseInterval;
            this._triggerWorldMacroImpulse(profile, profile.impulseVelocity);
        }

        while (this._worldMacroTimers.noise >= profile.noiseInterval) {
            this._worldMacroTimers.noise -= profile.noiseInterval;
            this._triggerWorldMacroNoise(profile, profile.noiseVelocity);
        }
    }

    _triggerWorldMacroDrone(profile, intensity = 0.4) {
        if (!this.initialized || !this.enabled || !this.worldDroneSynth) return;
        const now = Tone.now();
        const notes = Array.isArray(profile?.droneNotes) && profile.droneNotes.length > 0 ? profile.droneNotes : ['C2'];
        const velocity = Math.max(0.12, Math.min(0.6, Number(intensity) || profile.droneVelocity || 0.2));
        this.worldDroneSynth.triggerAttackRelease(notes, profile.droneDuration || '2n', now, velocity);
    }

    _triggerWorldMacroImpulse(profile, intensity = 0.4) {
        if (!this.initialized || !this.enabled || !this.worldImpulseSynth) return;
        const now = Tone.now();
        const notes = Array.isArray(profile?.impulseNotes) && profile.impulseNotes.length > 0 ? profile.impulseNotes : ['C3'];
        const velocity = Math.max(0.1, Math.min(0.62, Number(intensity) || profile.impulseVelocity || 0.18));
        this.worldImpulseSynth.triggerAttackRelease(notes, profile.impulseDuration || '16n', now, velocity);
    }

    _triggerWorldMacroNoise(profile, intensity = 0.3) {
        if (!this.initialized || !this.enabled || !this.worldNoiseSynth) return;
        const now = Tone.now();
        const velocity = Math.max(0.05, Math.min(0.32, Number(intensity) || profile.noiseVelocity || 0.12));
        const currentNoiseVolume = Number(this.worldNoiseSynth?.volume?.value);
        this._setNodeVolume(
            this.worldNoiseSynth,
            this._lerp(Number.isFinite(currentNoiseVolume) ? currentNoiseVolume : profile.noiseVolume, profile.noiseVolume, 0.25),
            'worldNoiseSynth.triggerVolume'
        );
        if (this.worldNoiseFilter) {
            this._setParamValue(this.worldNoiseFilter.frequency, profile.noiseFrequency, 'worldNoiseFilter.triggerFrequency');
            this._setParamValue(this.worldNoiseFilter.Q, profile.noiseQ, 'worldNoiseFilter.triggerQ');
        }
        this.worldNoiseSynth.triggerAttackRelease(profile.noiseDuration || '32n', now, velocity);
    }

    playWorldMacroStateChanged(payload = {}, eventName = 'world.macroState.changed') {
        if (!this.initialized || !this.enabled) return;
        const nextState = this._resolveWorldMacroState(payload);
        const profile = this._resolveWorldMacroProfile(nextState);
        return this.playRoutedEventAudio({
            ...payload,
            audioCue: 'world-state-transition',
            audioLayer: 'world-state-transition',
            audioIntensity: Number(payload?.audioIntensity ?? profile.transitionIntensity ?? 0.4) || 0.4,
            macroState: nextState,
            worldMacroState: nextState,
            macroProfile: profile,
            transitionCue: profile.transitionCue || 'world-state-transition'
        }, eventName);
    }

    /**
     * Create all Tone.js synths and effects.
     * Called after AudioContext is started (user gesture).
     */
    createSynths() {
        // Master Effects
        this.masterLimiter = this._createAudioNode('masterLimiter', () => new Tone.Limiter(-1), { critical: true });
        this._routeToDestination(this.masterLimiter, 'masterLimiter');
        this.masterReverb = this._createAudioNode('masterReverb', () => new Tone.Reverb({
            decay: 1.5,
            preDelay: 0.01,
            wet: 0.15
        }), { critical: true });
        this._connectNode(this.masterReverb, this.masterLimiter, 'masterReverb->masterLimiter');

        // --- SYNTHS ---

        // 1. SELECTION / DESELECTION (Digital Breath / Pulse)
        // PolySynth to handle rapid clicks without cutting off
        this.selectionSynth = this._createAudioNode('selectionSynth', () => new Tone.PolySynth(Tone.MonoSynth, {
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.05,
                decay: 0.1,
                sustain: 0,
                release: 0.5
            },
            filterEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0,
                release: 0.5,
                baseFrequency: 300,
                octaves: 2,
                exponent: 2
            },
            filter: {
                type: "lowpass",
                rolloff: -12,
                Q: 1
            }
        }));
        this._routeToMaster(this.selectionSynth, 'selectionSynth');
        this._setNodeVolume(this.selectionSynth, -5, 'selectionSynth.volume');

        // 1.5 HOVER ENTER (Glyph flyover)
        this.hoverSynth = this._createAudioNode('hoverSynth', () => new Tone.MonoSynth({
            oscillator: {
                type: "triangle"
            },
            portamento: 0.05,
            envelope: {
                attack: 0.004,
                decay: 0.11,
                sustain: 0,
                release: 0.18
            },
            filterEnvelope: {
                attack: 0.002,
                decay: 0.12,
                sustain: 0,
                release: 0.14,
                baseFrequency: 650,
                octaves: 3.2
            },
            filter: {
                type: "bandpass",
                rolloff: -12,
                Q: 1.1
            }
        }));
        this._routeToMaster(this.hoverSynth, 'hoverSynth');
        this._setNodeVolume(this.hoverSynth, -15, 'hoverSynth.volume');

        // 1.6 HOVER EXIT (very subtle air fade)
        this.hoverExitSynth = this._createAudioNode('hoverExitSynth', () => new Tone.MonoSynth({
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.002,
                decay: 0.05,
                sustain: 0,
                release: 0.08
            },
            filterEnvelope: {
                attack: 0.001,
                decay: 0.05,
                sustain: 0,
                release: 0.08,
                baseFrequency: 480,
                octaves: 1.6
            },
            filter: {
                type: "bandpass",
                rolloff: -12,
                Q: 0.9
            }
        }));
        this._routeToMaster(this.hoverExitSynth, 'hoverExitSynth');
        this._setNodeVolume(this.hoverExitSynth, -24, 'hoverExitSynth.volume');

        // 1.7 PRIMARY NODE SET (anchor lock dual tone)
        this.primarySetSynth = this._createAudioNode('primarySetSynth', () => new Tone.PolySynth(Tone.MonoSynth, {
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.005,
                decay: 0.14,
                sustain: 0,
                release: 0.18
            },
            filterEnvelope: {
                attack: 0.004,
                decay: 0.12,
                sustain: 0,
                release: 0.16,
                baseFrequency: 420,
                octaves: 1.8
            },
            filter: {
                type: "lowpass",
                rolloff: -12,
                Q: 1
            }
        }));
        this._routeToMaster(this.primarySetSynth, 'primarySetSynth');
        this._setNodeVolume(this.primarySetSynth, -12, 'primarySetSynth.volume');

        // 1.8 INVALID LINK ATTEMPT (muted reject tick)
        this.invalidLinkSynth = this._createAudioNode('invalidLinkSynth', () => new Tone.MonoSynth({
            oscillator: {
                type: "square"
            },
            envelope: {
                attack: 0.001,
                decay: 0.07,
                sustain: 0,
                release: 0.06
            },
            filterEnvelope: {
                attack: 0.001,
                decay: 0.05,
                sustain: 0,
                release: 0.05,
                baseFrequency: 700,
                octaves: 1.2
            },
            filter: {
                type: "bandpass",
                rolloff: -12,
                Q: 2.4
            }
        }));
        this._routeToMaster(this.invalidLinkSynth, 'invalidLinkSynth');
        this._setNodeVolume(this.invalidLinkSynth, -16, 'invalidLinkSynth.volume');

        // 2. LINKING (Harmonic Convergence)
        // DuoSynth for phase alignment texture
        this.linkSynth = this._createAudioNode('linkSynth', () => new Tone.DuoSynth({
            vibratoAmount: 0,
            vibratoRate: 0,
            harmonicity: 1.005, // Slight detune for phasing
            voice0: {
                oscillator: { type: "sine" },
                envelope: {
                    attack: 0.005,
                    decay: 0.08,
                    sustain: 0,
                    release: 0.08
                },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.12,
                    sustain: 0,
                    release: 0.1
                }
            },
            voice1: {
                oscillator: { type: "sine" },
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0,
                    release: 0.1
                },
                filterEnvelope: {
                    attack: 0.02, // Slightly later for "movement"
                    decay: 0.12,
                    sustain: 0,
                    release: 0.1
                }
            }
        }));
        this._routeToMaster(this.linkSynth, 'linkSynth');
        this._setNodeVolume(this.linkSynth, -12, 'linkSynth.volume');

        // 3. UNLINKING (Diffusion)
        // Noise source with lowpass filter sweep
        this.unlinkSynth = this._createAudioNode('unlinkSynth', () => new Tone.NoiseSynth({
            noise: {
                type: "pink"
            },
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0
            }
        }));
        this._routeToMaster(this.unlinkSynth, 'unlinkSynth');
        
        // Filter for unlinking
        this.unlinkFilter = this._createAudioNode('unlinkFilter', () => new Tone.Filter({
            type: "lowpass",
            frequency: 1400,
            Q: 1.2
        }));
        this._routeToMaster(this.unlinkFilter, 'unlinkFilter');
        this._disconnectNode(this.unlinkSynth, undefined, 'unlinkSynth:clearDefaultRoute');
        this._connectNode(this.unlinkSynth, this.unlinkFilter, 'unlinkSynth->unlinkFilter');
        this._setNodeVolume(this.unlinkSynth, -7, 'unlinkSynth.volume');


        // 4. SYNERGY (Harmonic Bloom)
        // PolySynth with Triangle waves for warmth
        this.synergySynth = this._createAudioNode('synergySynth', () => new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "fatcustom",
                partials: [0.2, 1, 0, 0.5, 0.1],
                spread: 20,
                count: 3
            },
            envelope: {
                attack: 0.5,
                decay: 1.0,
                sustain: 0.3,
                release: 2.0
            }
        }));
        this._routeToMaster(this.synergySynth, 'synergySynth');
        this._setNodeVolume(this.synergySynth, -16, 'synergySynth.volume');
        
        // AutoFilter for subtle movement in synergy
        this.synergyFilter = this._createAudioNode('synergyFilter', () => new Tone.AutoFilter({
            frequency: 0.2,
            baseFrequency: 300,
            octaves: 2
        }));
        this._routeToMaster(this.synergyFilter, 'synergyFilter');
        try {
            this.synergyFilter?.start?.();
        } catch (error) {
            this._warnAudioIssue('synergyFilter.start failed', error);
        }
        this._disconnectNode(this.synergySynth, undefined, 'synergySynth:clearDefaultRoute');
        this._connectNode(this.synergySynth, this.synergyFilter, 'synergySynth->synergyFilter');

        // 5. WORLD / HAZARD EVENT ROUTING
        this.eventLeadSynth = this._createAudioNode('eventLeadSynth', () => new Tone.PolySynth(Tone.MonoSynth, {
            oscillator: { type: "triangle" },
            envelope: {
                attack: 0.01,
                decay: 0.22,
                sustain: 0.08,
                release: 0.35
            },
            filterEnvelope: {
                attack: 0.01,
                decay: 0.18,
                sustain: 0.0,
                release: 0.28,
                baseFrequency: 340,
                octaves: 2.4
            },
            filter: {
                type: "bandpass",
                rolloff: -12,
                Q: 1.6
            }
        }));
        this._routeToMaster(this.eventLeadSynth, 'eventLeadSynth');
        this._setNodeVolume(this.eventLeadSynth, -18, 'eventLeadSynth.volume');

        this.eventAccentSynth = this._createAudioNode('eventAccentSynth', () => new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            envelope: {
                attack: 0.004,
                decay: 0.12,
                sustain: 0.0,
                release: 0.18
            },
            filterEnvelope: {
                attack: 0.003,
                decay: 0.1,
                sustain: 0.0,
                release: 0.14,
                baseFrequency: 480,
                octaves: 3.1
            },
            filter: {
                type: "bandpass",
                rolloff: -12,
                Q: 2.2
            }
        }));
        this._routeToMaster(this.eventAccentSynth, 'eventAccentSynth');
        this._setNodeVolume(this.eventAccentSynth, -22, 'eventAccentSynth.volume');

        this.eventNoiseSynth = this._createAudioNode('eventNoiseSynth', () => new Tone.NoiseSynth({
            noise: { type: "pink" },
            envelope: {
                attack: 0.01,
                decay: 0.16,
                sustain: 0.0,
                release: 0.18
            }
        }));
        this._routeToMaster(this.eventNoiseSynth, 'eventNoiseSynth');
        this.eventNoiseFilter = this._createAudioNode('eventNoiseFilter', () => new Tone.Filter({
            type: "bandpass",
            frequency: 900,
            Q: 1.4
        }));
        this._routeToMaster(this.eventNoiseFilter, 'eventNoiseFilter');
        this._disconnectNode(this.eventNoiseSynth, undefined, 'eventNoiseSynth:clearDefaultRoute');
        this._connectNode(this.eventNoiseSynth, this.eventNoiseFilter, 'eventNoiseSynth->eventNoiseFilter');
        this._setNodeVolume(this.eventNoiseSynth, -28, 'eventNoiseSynth.volume');

        this.worldDroneSynth = this._createAudioNode('worldDroneSynth', () => new Tone.PolySynth(Tone.MonoSynth, {
            oscillator: { type: 'sine' },
            envelope: {
                attack: 0.7,
                decay: 0.3,
                sustain: 0.55,
                release: 2.8
            },
            filterEnvelope: {
                attack: 0.18,
                decay: 0.32,
                sustain: 0.32,
                release: 1.8,
                baseFrequency: 180,
                octaves: 1.4,
                exponent: 2
            },
            filter: {
                type: 'lowpass',
                rolloff: -12,
                Q: 0.85
            }
        }));
        this._routeToMaster(this.worldDroneSynth, 'worldDroneSynth');
        this._setNodeVolume(this.worldDroneSynth, -37, 'worldDroneSynth.volume');

        this.worldImpulseSynth = this._createAudioNode('worldImpulseSynth', () => new Tone.PolySynth(Tone.MonoSynth, {
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.004,
                decay: 0.12,
                sustain: 0,
                release: 0.28
            },
            filterEnvelope: {
                attack: 0.004,
                decay: 0.1,
                sustain: 0,
                release: 0.2,
                baseFrequency: 420,
                octaves: 2.0,
                exponent: 2
            },
            filter: {
                type: 'bandpass',
                rolloff: -12,
                Q: 1.2
            }
        }));
        this._routeToMaster(this.worldImpulseSynth, 'worldImpulseSynth');
        this._setNodeVolume(this.worldImpulseSynth, -35, 'worldImpulseSynth.volume');

        this.worldNoiseSynth = this._createAudioNode('worldNoiseSynth', () => new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: {
                attack: 0.01,
                decay: 0.18,
                sustain: 0,
                release: 0.22
            }
        }));
        this._routeToMaster(this.worldNoiseSynth, 'worldNoiseSynth');
        this.worldNoiseFilter = this._createAudioNode('worldNoiseFilter', () => new Tone.Filter({
            type: 'bandpass',
            frequency: 220,
            Q: 0.9
        }));
        this._routeToMaster(this.worldNoiseFilter, 'worldNoiseFilter');
        this._disconnectNode(this.worldNoiseSynth, undefined, 'worldNoiseSynth:clearDefaultRoute');
        this._connectNode(this.worldNoiseSynth, this.worldNoiseFilter, 'worldNoiseSynth->worldNoiseFilter');
        this._setNodeVolume(this.worldNoiseSynth, -48, 'worldNoiseSynth.volume');

        // Dramaturgy spatial panner — routes event synths through position-aware panning.
        this._dramaturgyPanner = this._createDramaturgyPanner();
        this._connectNode(this._dramaturgyPanner, this.masterReverb, '_dramaturgyPanner->masterReverb');
        this._dramaturgySpatialOrigin = null; // { x, y, z } or null
        this._dramaturgyCamera = null;
        this._dramaturgyRoutingActive = false;
        this._dramaturgyRoutingTimeout = null;

        this._setDestinationMute(!this.enabled);
    }

    /**
     * Browser audio policy requires user interaction to start AudioContext.
     * Call this on first click/key press.
     */
    async start() {
        if (this.initialized) return true;
        if (!this.enabled) return false;

        this.lastStartError = null;

        try {
            // First, start the AudioContext (requires user gesture)
            await Tone.start();

            // Then create all synths and effects after AudioContext is running
            this.createSynths();

            this.initialized = true;
            this._applyWorldMacroMix(this._worldMacroProfile || this._resolveWorldMacroProfile(this._worldMacroState), 1);
            this._primeWorldMacroAudio(this._worldMacroProfile || this._resolveWorldMacroProfile(this._worldMacroState), Number(this._worldMacroProfile?.transitionIntensity) || 0.4);
            console.log('[Audio] AudioContext Started');

            // Play a very faint "boot" sound to confirm
            this.playSelection(true);
            return true;
        } catch (error) {
            this.initialized = false;
            this._recordStartError('core-start', error);
            throw error;
        }
    }

    // --- TASK 1: Node Selection (Listening) ---
    playSelection(isBoot = false) {
        if (!this.initialized || !this.enabled) return;
        if (!isBoot && !this.canTrigger('selection', 45)) return;
        // Soft sine ping, slightly high but soft
        // Slightly lower and softer than before to avoid harshness on small speakers
        this.selectionSynth.triggerAttackRelease("E5", "8n", undefined, 0.72);
    }

    // --- TASK 1.5: Node Hover Enter (Glyph Flyover) ---
    playHoverEnter() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('hoverEnter', 140)) return;
        const now = Tone.now();
        this.hoverSynth.triggerAttackRelease("A5", "32n", now, 0.3);
        this.hoverSynth.triggerAttackRelease("E6", "16n", now + 0.018, 0.2);
    }

    playHoverExit() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('hoverExit', 120)) return;
        this.hoverExitSynth.triggerAttackRelease("E4", "32n", undefined, 0.1);
    }

    playPrimaryNodeSet() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('primaryNodeSet', 180)) return;
        const now = Tone.now();
        this.primarySetSynth.triggerAttackRelease("C4", "16n", now, 0.28);
        this.primarySetSynth.triggerAttackRelease("G4", "16n", now + 0.03, 0.22);
    }

    playInvalidLinkAttempt() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('invalidLinkAttempt', 100)) return;
        this.invalidLinkSynth.triggerAttackRelease("B3", "32n", undefined, 0.2);
    }

    // --- TASK 2: Node Deselection (Settling) ---
    playDeselection() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('deselection', 45)) return;
        // Lower pitch, still clearly audible for runtime verification
        this.selectionSynth.triggerAttackRelease("E4", "16n", undefined, 0.45);
    }

    // --- TASK 3: Link Creation (Agreement) ---
    playLinkCreated() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('linkCreated', 60)) return;
        // Harmonic interval (Perfect 5th) to signify stability/agreement
        // "C5" + "G5"
        // Slight delay between them handled by synth attack diff, or manually here
        this.linkSynth.triggerAttackRelease(["C5", "G5"], "16n");
    }

    // --- TASK 4: Link Breaking (Diffusing) ---
    playLinkBroken() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('linkBroken', 80)) return;
        // Filtered noise sweep down
        this._setParamValue(this.unlinkFilter?.frequency, 1800, 'unlinkFilter.frequency');
        try {
            this.unlinkFilter?.frequency?.rampTo?.(160, 0.14);
        } catch (error) {
            this._warnAudioIssue('unlinkFilter.frequency ramp failed', error);
            this._setParamValue(this.unlinkFilter?.frequency, 160, 'unlinkFilter.frequency:fallback');
        }
        this.unlinkSynth.triggerAttackRelease("16n");
    }

    // --- TASK 5: Synergy Activation (Harmonic Bloom) ---
    playSynergyActive() {
        if (!this.initialized || !this.enabled) return;
        // Major 9th chord for "Clarity" and "Expansion"
        // C4, E4, G4, B4, D5
        const chord = ["C4", "G4", "D5"]; 
        this.synergySynth.triggerAttackRelease(chord, "2n", undefined, 0.5);
    }

    // --- TASK 6: Synergy Fading (Dissipate) ---
    playSynergyFade() {
        if (!this.initialized || !this.enabled) return;
        // Single lingering low tone fading out
        this.synergySynth.triggerAttackRelease(["C3"], "1n", undefined, 0.2);
    }

    // --- NETWORK TIME SCORE AUDIO CUES ---

    /**
     * Play ascending tone when Network Time starts rewinding (synergy sustained 7s).
     * Bright, hopeful — the reward moment.
     */
    playScoreRewindStart() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('score:rewind', 2000)) return;
        const now = Tone.now();
        // Ascending arpeggio: C5 → E5 → G5 (bright, hopeful)
        this.synergySynth.triggerAttackRelease("C5", "16n", now, 0.4);
        this.synergySynth.triggerAttackRelease("E5", "16n", now + 0.08, 0.35);
        this.synergySynth.triggerAttackRelease("G5", "8n", now + 0.16, 0.45);
    }

    /**
     * Play descending tone when rewind stops (synergy dropped).
     * Subtle, fading — the loss moment.
     */
    playScoreRewindEnd() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('score:forward', 2000)) return;
        const now = Tone.now();
        // Descending: G4 → E4 → C4 (gentle fade)
        this.synergySynth.triggerAttackRelease("G4", "16n", now, 0.25);
        this.synergySynth.triggerAttackRelease("E4", "16n", now + 0.1, 0.2);
        this.synergySynth.triggerAttackRelease("C4", "8n", now + 0.2, 0.15);
    }

    /**
     * Play victory chord when Network Time reaches 0.
     * Full, resonant, satisfying — the completion moment.
     */
    playScoreVictory() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('score:won', 10000)) return;
        const now = Tone.now();
        // Major chord spread: C4 → E4 → G4 → C5 (full resolution)
        this.synergySynth.triggerAttackRelease("C4", "4n", now, 0.35);
        this.synergySynth.triggerAttackRelease("E4", "4n", now + 0.06, 0.3);
        this.synergySynth.triggerAttackRelease("G4", "4n", now + 0.12, 0.35);
        this.synergySynth.triggerAttackRelease("C5", "2n", now + 0.2, 0.45);
        // Add high shimmer
        this.selectionSynth.triggerAttackRelease("E6", "2n", now + 0.3, 0.2);
    }

    /**
     * Play milestone chime — celebratory tone when rewind progress milestone is reached.
     * More stars = richer chord.
     */
    playMilestoneChime(stars = 1) {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('score:milestone', 3000)) return;
        const now = Tone.now();
        if (stars >= 3) {
            // ⭐⭐⭐ Almost there — full triumphant chord
            this.synergySynth.triggerAttackRelease("E5", "8n", now, 0.3);
            this.synergySynth.triggerAttackRelease("G5", "8n", now + 0.05, 0.28);
            this.synergySynth.triggerAttackRelease("B5", "8n", now + 0.1, 0.32);
            this.synergySynth.triggerAttackRelease("E6", "4n", now + 0.15, 0.25);
        } else if (stars >= 2) {
            // ⭐⭐ Halfway — major triad
            this.synergySynth.triggerAttackRelease("C5", "8n", now, 0.28);
            this.synergySynth.triggerAttackRelease("E5", "8n", now + 0.06, 0.25);
            this.synergySynth.triggerAttackRelease("G5", "4n", now + 0.12, 0.3);
        } else {
            // ⭐ Three quarters — single bright tone
            this.synergySynth.triggerAttackRelease("G5", "8n", now, 0.25);
            this.synergySynth.triggerAttackRelease("C6", "8n", now + 0.08, 0.2);
        }
    }

    /**
     * Play drama zone heartbeat — subtle low pulse when near win.
     * Uses a soft bass thud at ~40BPM (1.5s interval).
     */
    playDramaZoneHeartbeat() {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('score:dramaZone', 1500)) return;
        const now = Tone.now();
        // Soft bass heartbeat: low E2 thud with gentle resonance
        this.synergySynth.triggerAttackRelease("E2", "8n", now, 0.2);
        this.synergySynth.triggerAttackRelease("E2", "8n", now + 0.15, 0.12);
    }

    // ====================================================================
    // LINK COLLAPSE AUDIO — Multi-phase dramatic event sounds
    // ====================================================================

    /**
     * Phase 1: Warning — Low tension drone, subtle dissonance.
     * Link is unstable, corruption is rising.
     */
    playCollapseWarning(link, state) {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('collapse:warning', 3000)) return;
        const now = Tone.now();
        // Dissonant minor second: B2 → C3 (uneasy tension)
        this.eventLeadSynth.triggerAttackRelease("B2", "2n", now, 0.18);
        this.eventLeadSynth.triggerAttackRelease("C3", "2n", now + 0.05, 0.14);
    }

    /**
     * Phase 2: Critical — Rising tension, metallic scrape, heartbeat pulse.
     * Link is about to collapse.
     */
    playCollapseCritical(link, state) {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('collapse:critical', 2000)) return;
        const now = Tone.now();
        // Metallic scrape: filtered noise burst
        this.eventNoiseSynth.triggerAttackRelease("8n", now, 0.15);
        // Rising tension: tritone A2 → D#3 → A3 (danger escalation)
        this.eventAccentSynth.triggerAttackRelease("A2", "8n", now + 0.1, 0.2);
        this.eventAccentSynth.triggerAttackRelease("D#3", "16n", now + 0.2, 0.22);
        this.eventAccentSynth.triggerAttackRelease("A3", "16n", now + 0.3, 0.18);
        // Heartbeat thud
        this.worldDroneSynth.triggerAttackRelease("E2", "8n", now + 0.15, 0.15);
        this.worldDroneSynth.triggerAttackRelease("E2", "8n", now + 0.35, 0.1);
    }

    /**
     * Phase 3: Collapse — Deep impact, resonance decay, silence after.
     * The link breaks. This is the dramatic climax.
     */
    playLinkCollapse(link, state, position) {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('collapse:final', 5000)) return;
        const now = Tone.now();
        // Deep impact: low C1-C2 rumble
        this.worldDroneSynth.triggerAttackRelease("C1", "4n", now, 0.35);
        this.worldDroneSynth.triggerAttackRelease("C2", "4n", now + 0.03, 0.28);
        // Noise burst: energy discharge
        this.unlinkSynth.triggerAttackRelease("4n", now, 0.3);
        // Resonance decay: high harmonic fading
        this.synergySynth.triggerAttackRelease("E5", "2n", now + 0.15, 0.15);
        this.synergySynth.triggerAttackRelease("C5", "2n", now + 0.2, 0.12);
        // Final low decay
        this.worldDroneSynth.triggerAttackRelease("A1", "1n", now + 0.4, 0.1);
    }

    /**
     * Recovery — Gentle resolution when link recovers from warning/critical.
     */
    playCollapseRecovery(link, state) {
        if (!this.initialized || !this.enabled) return;
        if (!this.canTrigger('collapse:recovery', 2000)) return;
        const now = Tone.now();
        // Gentle ascending resolution: C4 → E4 (relief)
        this.synergySynth.triggerAttackRelease("C4", "8n", now, 0.15);
        this.synergySynth.triggerAttackRelease("E4", "8n", now + 0.08, 0.12);
    }

    playRoutedEventAudio(payload = {}, eventName = 'semantic.event') {
        if (!this.initialized || !this.enabled) return;

        const cue = String(payload?.audioCue || eventName || 'audio.event');
        const layer = String(payload?.audioLayer || 'worldfx-bed');
        const intensity = Math.max(0.12, Math.min(1.6, Number(payload?.audioIntensity) || 0.6));
        if (!this.canTrigger(`routed:${cue}`, this._resolveRoutedEventCooldown(cue, intensity))) return;
        if (!this.canTrigger(`routed-layer:${layer}`, this._resolveRoutedEventLayerCooldown(layer, cue, intensity))) return;

        const now = Tone.now();
        const profile = this._resolveRoutedEventProfile(cue, layer, intensity);
        this._applyRoutedEventMix(profile, intensity);
        const velocity = this._scaleEventVelocity(intensity, profile);

        if (cue.includes('world-state') || layer === 'world-state-transition') {
            this._playWorldMacroTransition(payload, now, velocity, intensity, profile);
            return;
        }

        if (cue.includes('fold')) {
            this.eventLeadSynth.triggerAttackRelease(["C3", "G3"], "8n", now, velocity * 0.7);
            this.eventAccentSynth.triggerAttackRelease("D4", "16n", now + 0.03, velocity * 0.42);
            this._triggerEventNoise(layer, intensity * profile.noiseScale, 420 + intensity * 220, "16n");
            return;
        }

        if (cue.includes('wave')) {
            this.eventLeadSynth.triggerAttackRelease(["G3", "D4"], "16n", now, velocity * 0.62);
            this.eventLeadSynth.triggerAttackRelease(["A3", "E4"], "16n", now + 0.06, velocity * 0.46);
            return;
        }

        if (cue.includes('pulse')) {
            this.eventLeadSynth.triggerAttackRelease(["C4", "E4", "G4"], "8n", now, velocity * 0.52);
            return;
        }

        if (cue.includes('pressure') || cue.includes('residue') || cue.includes('phase-burst') || layer === 'pressure-rumble' || layer === 'residue-choir') {
            if (cue.includes('burst') || cue.includes('phase-burst') || layer === 'pressure-rumble') {
                this.eventLeadSynth.triggerAttackRelease(["C3", "G3", "D4"], "8n", now, velocity * 0.66);
                this.eventAccentSynth.triggerAttackRelease("A4", "16n", now + 0.025, velocity * 0.34);
                this._triggerEventNoise(layer, intensity * profile.noiseScale, 560 + intensity * 180, "16n");
            } else {
                this.eventLeadSynth.triggerAttackRelease(["E4", "B4"], "8n", now, velocity * 0.42);
                this.eventAccentSynth.triggerAttackRelease("G5", "16n", now + 0.04, velocity * 0.22);
                this._triggerEventNoise(layer, intensity * profile.noiseScale, 1240 + intensity * 220, "32n");
            }
            return;
        }

        if (cue.includes('quantum') || cue.includes('revelation')) {
            this.eventLeadSynth.triggerAttackRelease(["D5", "A5"], "8n", now, velocity * 0.55);
            this.eventAccentSynth.triggerAttackRelease("F#5", "16n", now + 0.04, velocity * 0.34);
            this._triggerEventNoise(layer, intensity * profile.noiseScale, 1600 + intensity * 600, "32n");
            return;
        }

        if (cue.includes('sigma')) {
            this.eventAccentSynth.triggerAttackRelease("F#4", "32n", now, velocity * 0.42);
            this.eventAccentSynth.triggerAttackRelease("C5", "32n", now + 0.018, velocity * 0.3);
            this._triggerEventNoise(layer, intensity * profile.noiseScale, 2200 + intensity * 900, "32n");
            return;
        }

        if (cue.includes('storm')) {
            this.eventLeadSynth.triggerAttackRelease(["E4", "B4"], "16n", now, velocity * 0.55);
            this.eventAccentSynth.triggerAttackRelease("E5", "32n", now + 0.028, velocity * 0.28);
            this._triggerEventNoise(layer, intensity * profile.noiseScale, 1800 + intensity * 300, "32n");
            return;
        }

        if (cue.includes('gravity') || cue.includes('singularity')) {
            this.eventLeadSynth.triggerAttackRelease(["C2", "G2"], "8n", now, velocity * 0.58);
            this.eventAccentSynth.triggerAttackRelease("D3", "16n", now + 0.05, velocity * 0.22);
            this._triggerEventNoise(layer, intensity * profile.noiseScale, 280 + intensity * 140, "16n");
            return;
        }

        if (cue.includes('chrono') || cue.includes('bloom')) {
            this.eventLeadSynth.triggerAttackRelease(["C5", "G5"], "8n", now, velocity * 0.46);
            this.eventAccentSynth.triggerAttackRelease("E5", "16n", now + 0.04, velocity * 0.28);
            return;
        }

        // Dramaturgy phase cues — distinct sound per phase and family
        if (cue.includes('dramaturgy')) {
            this._playDramaturgyCue(cue, now, velocity, intensity);
            return;
        }

        this.eventLeadSynth.triggerAttackRelease(["C4", "G4"], "16n", now, velocity * 0.4);
    }

    _playWorldMacroTransition(payload, now, velocity, intensity, routedProfile = null) {
        const nextState = this._resolveWorldMacroState(payload);
        const profile = this._resolveWorldMacroProfile(nextState);
        const transitionNotes = Array.isArray(profile.transitionNotes) && profile.transitionNotes.length > 0
            ? profile.transitionNotes
            : Array.isArray(profile.impulseNotes) && profile.impulseNotes.length > 0
                ? profile.impulseNotes
                : ['C3'];
        const droneNotes = Array.isArray(profile.droneNotes) && profile.droneNotes.length > 0 ? profile.droneNotes : transitionNotes;
        const impulseNotes = Array.isArray(profile.impulseNotes) && profile.impulseNotes.length > 0 ? profile.impulseNotes : transitionNotes;
        const worldVelocity = Math.max(0.12, Math.min(0.62, Number(intensity) || profile.transitionIntensity || 0.4));

        if (this.worldDroneSynth) {
            this._setNodeVolume(this.worldDroneSynth, profile.droneVolume, 'worldDroneSynth.transitionVolume');
            this._safeNodeSet(this.worldDroneSynth, {
                oscillator: { type: profile.oscillatorType || 'triangle' },
                filterEnvelope: {
                    baseFrequency: profile.droneFrequency,
                    octaves: profile.droneOctaves ?? 1.4,
                    exponent: 2
                },
                filter: {
                    Q: profile.droneQ
                }
            }, 'worldDroneSynth.transitionSet');
            this.worldDroneSynth.triggerAttackRelease(droneNotes, profile.droneDuration || '2n', now, worldVelocity * 0.82);
        }

        if (this.worldImpulseSynth) {
            this._setNodeVolume(this.worldImpulseSynth, profile.impulseVolume, 'worldImpulseSynth.transitionVolume');
            this._safeNodeSet(this.worldImpulseSynth, {
                oscillator: { type: profile.oscillatorType || 'triangle' },
                filterEnvelope: {
                    baseFrequency: profile.impulseFrequency,
                    octaves: profile.impulseOctaves ?? 2.0,
                    exponent: 2
                },
                filter: {
                    Q: profile.impulseQ
                }
            }, 'worldImpulseSynth.transitionSet');
            this.worldImpulseSynth.triggerAttackRelease(impulseNotes, profile.impulseDuration || '16n', now + 0.02, worldVelocity * 0.62);
        }

        if (this.worldNoiseSynth) {
            this._setNodeVolume(this.worldNoiseSynth, profile.noiseVolume, 'worldNoiseSynth.transitionVolume');
            if (this.worldNoiseFilter) {
                this._setParamValue(this.worldNoiseFilter.frequency, profile.noiseFrequency, 'worldNoiseFilter.transitionFrequency');
                this._setParamValue(this.worldNoiseFilter.Q, profile.noiseQ, 'worldNoiseFilter.transitionQ');
            }
            this.worldNoiseSynth.triggerAttackRelease(profile.noiseDuration || '32n', now + 0.01, Math.max(0.05, Math.min(0.28, worldVelocity * 0.45)));
        }

        if (this.eventLeadSynth) {
            const routedLead = routedProfile || this._resolveRoutedEventProfile('world-state-transition', 'world-state-transition', Math.max(0.12, intensity));
            const currentLeadDb = Number(this.eventLeadSynth?.volume?.value);
            this._setNodeVolume(
                this.eventLeadSynth,
                this._lerp(Number.isFinite(currentLeadDb) ? currentLeadDb : routedLead.leadDb, routedLead.leadDb, 0.35),
                'eventLeadSynth.transitionVolume'
            );
        }
    }

    /**
     * Play dramaturgy phase cue — distinct sound per family and phase.
     * Telegraph: subtle warning hint
     * Escalation: full impact
     * Payoff: resolution / settling
     */
    // ---------------------------------------------------------------------------
    // Dramaturgy Spatial Audio
    // ---------------------------------------------------------------------------

    /**
     * Set the spatial context for dramaturgy audio.
     * Called by EventDramaturgyEngine before playing a cue.
     */
    setDramaturgySpatialContext(origin, camera) {
        this._dramaturgySpatialOrigin = origin || null;
        this._dramaturgyCamera = camera || null;
    }

    /**
     * Compute stereo pan value from event origin relative to camera.
     * Returns -1 (left) to 1 (right).
     *
     * Telegraph: directional — audio comes from event direction
     * Escalation: center/wide — audio fills full stereo field
     * Payoff: fading — audio drifts toward event origin
     */
    _computeDramaturgyPan(phase) {
        const origin = this._dramaturgySpatialOrigin;
        const camera = this._dramaturgyCamera;

        if (!origin || !camera || !camera.position) return 0;

        const camPos = camera.position;
        const dx = (origin.x || 0) - camPos.x;
        const dz = (origin.z || 0) - camPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.5) return 0;

        // Get camera forward direction for left/right determination
        let fwdX = 0, fwdZ = -1;
        if (camera.getWorldDirection) {
            const dir = { x: 0, y: 0, z: 0 };
            camera.getWorldDirection(dir);
            fwdX = dir.x;
            fwdZ = dir.z;
        }

        // Cross product (2D) determines left vs right
        const cross = fwdX * dz - fwdZ * dx;
        const panRaw = Math.max(-1, Math.min(1, cross / dist));

        // Phase-dependent spatial behavior
        switch (phase) {
            case 'telegraph':  return panRaw * 0.8;   // Directional — from event direction
            case 'escalation': return panRaw * 0.12;   // Center/wide — fills stereo field
            case 'payoff':     return panRaw * 0.5;    // Fading toward origin
            default:           return 0;
        }
    }

    /**
     * Route event synths through dramaturgy panner for spatial audio.
     */
    _routeDramaturgySpatial(panValue) {
        if (this._dramaturgyRoutingActive) {
            // Already routed — just update pan
            this._setDramaturgyPanValue(panValue);
            return;
        }

        this._setDramaturgyPanValue(panValue);

        // Route event synths through panner
        this._disconnectNode(this.eventLeadSynth, this.masterReverb, 'eventLeadSynth<-masterReverb');
        this._connectNode(this.eventLeadSynth, this._dramaturgyPanner, 'eventLeadSynth->_dramaturgyPanner');
        this._disconnectNode(this.eventAccentSynth, this.masterReverb, 'eventAccentSynth<-masterReverb');
        this._connectNode(this.eventAccentSynth, this._dramaturgyPanner, 'eventAccentSynth->_dramaturgyPanner');
        this._disconnectNode(this.eventNoiseFilter, this.masterReverb, 'eventNoiseFilter<-masterReverb');
        this._connectNode(this.eventNoiseFilter, this._dramaturgyPanner, 'eventNoiseFilter->_dramaturgyPanner');

        this._dramaturgyRoutingActive = true;

        // Auto-restore normal routing after 2.5s (longest dramaturgy note duration)
        if (this._dramaturgyRoutingTimeout) clearTimeout(this._dramaturgyRoutingTimeout);
        this._dramaturgyRoutingTimeout = setTimeout(() => {
            this._restoreDramaturgyRouting();
        }, 2500);
    }

    _restoreDramaturgyRouting() {
        if (!this._dramaturgyRoutingActive) return;
        this._disconnectNode(this.eventLeadSynth, this._dramaturgyPanner, 'eventLeadSynth<-dramaturgyPanner');
        this._connectNode(this.eventLeadSynth, this.masterReverb, 'eventLeadSynth->masterReverb');
        this._disconnectNode(this.eventAccentSynth, this._dramaturgyPanner, 'eventAccentSynth<-dramaturgyPanner');
        this._connectNode(this.eventAccentSynth, this.masterReverb, 'eventAccentSynth->masterReverb');
        this._disconnectNode(this.eventNoiseFilter, this._dramaturgyPanner, 'eventNoiseFilter<-dramaturgyPanner');
        this._connectNode(this.eventNoiseFilter, this.masterReverb, 'eventNoiseFilter->masterReverb');
        this._dramaturgyRoutingActive = false;
        this._dramaturgyRoutingTimeout = null;
    }

    _playDramaturgyCue(cue, now, velocity, intensity) {
        const isTelegraph = cue.includes('telegraph');
        const isEscalation = cue.includes('escalation');
        const isPayoff = cue.includes('payoff');

        // Compute and apply spatial panning
        const phase = isTelegraph ? 'telegraph' : isEscalation ? 'escalation' : isPayoff ? 'payoff' : 'telegraph';
        const panValue = this._computeDramaturgyPan(phase);
        this._routeDramaturgySpatial(panValue);

        // Cascade — tearing energy
        if (cue.includes('cascade')) {
            if (isTelegraph) {
                this.eventLeadSynth.triggerAttackRelease(["C3"], "32n", now, velocity * 0.18);
                this._triggerEventNoise('dramaturgy-cascade', intensity * 0.15, 200, "32n");
            } else if (isEscalation) {
                this.eventLeadSynth.triggerAttackRelease(["C3", "G3", "D4"], "16n", now, velocity * 0.55);
                this.eventAccentSynth.triggerAttackRelease("A4", "16n", now + 0.03, velocity * 0.3);
                this._triggerEventNoise('dramaturgy-cascade', intensity * 0.4, 350 + intensity * 200, "16n");
            } else if (isPayoff) {
                this.eventLeadSynth.triggerAttackRelease(["E4", "B4"], "8n", now, velocity * 0.22);
            }
            return;
        }

        // Corruption — dark dissonance
        if (cue.includes('corruption')) {
            if (isTelegraph) {
                this.eventLeadSynth.triggerAttackRelease(["C#2"], "16n", now, velocity * 0.15);
                this._triggerEventNoise('dramaturgy-corruption', intensity * 0.12, 180, "16n");
            } else if (isEscalation) {
                this.eventLeadSynth.triggerAttackRelease(["C#2", "G#2", "D#3"], "8n", now, velocity * 0.5);
                this.eventAccentSynth.triggerAttackRelease("F#3", "16n", now + 0.04, velocity * 0.28);
                this._triggerEventNoise('dramaturgy-corruption', intensity * 0.45, 250 + intensity * 150, "16n");
            } else if (isPayoff) {
                this.eventLeadSynth.triggerAttackRelease(["E4", "G4"], "4n", now, velocity * 0.18);
            }
            return;
        }

        // Resonance — bright harmonic bloom
        if (cue.includes('resonance')) {
            if (isTelegraph) {
                this.eventLeadSynth.triggerAttackRelease(["E5"], "32n", now, velocity * 0.15);
            } else if (isEscalation) {
                this.eventLeadSynth.triggerAttackRelease(["C5", "E5", "G5"], "8n", now, velocity * 0.4);
                this.eventAccentSynth.triggerAttackRelease("B5", "16n", now + 0.05, velocity * 0.22);
            } else if (isPayoff) {
                this.eventLeadSynth.triggerAttackRelease(["G5", "C6"], "4n", now, velocity * 0.2);
            }
            return;
        }

        // Ritual — ceremonial / transcendent
        if (cue.includes('ritual')) {
            if (isTelegraph) {
                this.eventLeadSynth.triggerAttackRelease(["A3", "E4"], "4n", now, velocity * 0.2);
            } else if (isEscalation) {
                this.eventLeadSynth.triggerAttackRelease(["A3", "C#4", "E4", "A4"], "2n", now, velocity * 0.45);
                this.eventAccentSynth.triggerAttackRelease("C#5", "4n", now + 0.1, velocity * 0.25);
            } else if (isPayoff) {
                this.eventLeadSynth.triggerAttackRelease(["E4", "A4", "C#5"], "2n", now, velocity * 0.3);
                this.selectionSynth.triggerAttackRelease("E5", "4n", now + 0.15, velocity * 0.15);
            }
            return;
        }

        // Hazard — warning / impact
        if (cue.includes('hazard')) {
            if (isTelegraph) {
                this.eventLeadSynth.triggerAttackRelease(["C2", "G2"], "16n", now, velocity * 0.25);
                this._triggerEventNoise('dramaturgy-hazard', intensity * 0.2, 220, "16n");
            } else if (isEscalation) {
                this.eventLeadSynth.triggerAttackRelease(["C2", "G2", "D3"], "8n", now, velocity * 0.6);
                this.eventAccentSynth.triggerAttackRelease("A3", "16n", now + 0.02, velocity * 0.35);
                this._triggerEventNoise('dramaturgy-hazard', intensity * 0.5, 300 + intensity * 200, "16n");
            } else if (isPayoff) {
                this.eventLeadSynth.triggerAttackRelease(["G3", "D4"], "8n", now, velocity * 0.2);
            }
            return;
        }

        // Generic dramaturgy fallback
        this.eventLeadSynth.triggerAttackRelease(["C4", "G4"], "16n", now, velocity * 0.3);
    }

    _resolveRoutedEventCooldown(cue, intensity) {
        if (cue.includes('pressure') || cue.includes('residue')) return 220;
        if (cue.includes('sigma')) return 120;
        if (cue.includes('storm')) return 180;
        if (cue.includes('gravity')) return 240;
        if (cue.includes('chrono')) return 320;
        if (cue.includes('quantum')) return 300;
        if (cue.includes('dramaturgy')) return cue.includes('telegraph') ? 600 : cue.includes('escalation') ? 400 : 500;
        return Math.max(140, 260 - intensity * 40);
    }

    _resolveRoutedEventLayerCooldown(layer, cue, intensity) {
        if (cue.includes('pressure') || layer === 'pressure-rumble' || layer === 'residue-choir') return 220;
        if (cue.includes('sigma') || layer === 'digital-shear') return 110;
        if (cue.includes('storm') || layer === 'charged-choir') return 170;
        if (cue.includes('gravity') || layer === 'void-drag') return 220;
        if (cue.includes('quantum') || layer === 'halo-choir') return 260;
        if (cue.includes('chrono') || layer === 'sigil-bells') return 320;
        if (cue.includes('pulse') || layer === 'ambient-bloom') return 260;
        if (layer?.includes('dramaturgy')) return 400;
        return Math.max(130, 210 - intensity * 30);
    }

    _resolveRoutedEventProfile(cue, layer, intensity) {
        const profile = {
            leadDb: -24,
            accentDb: -30,
            noiseDb: -37,
            leadBaseFrequency: 360,
            leadOctaves: 2.2,
            leadQ: 1.5,
            accentBaseFrequency: 620,
            accentOctaves: 2.8,
            accentQ: 2.3,
            noiseQ: 1.2,
            velocityScale: 0.78,
            noiseScale: 0.42
        };

        if (cue.includes('fold') || layer === 'fold-rumble') {
            Object.assign(profile, {
                leadDb: -22,
                accentDb: -31,
                noiseDb: -39,
                leadBaseFrequency: 240,
                leadOctaves: 1.7,
                leadQ: 1.2,
                accentBaseFrequency: 440,
                accentOctaves: 2.1,
                accentQ: 1.8,
                noiseQ: 0.95,
                velocityScale: 0.74,
                noiseScale: 0.5
            });
        } else if (cue.includes('pressure') || cue.includes('residue') || layer === 'pressure-rumble' || layer === 'residue-choir') {
            Object.assign(profile, {
                leadDb: cue.includes('burst') ? -22 : -27,
                accentDb: cue.includes('burst') ? -29 : -34,
                noiseDb: cue.includes('burst') ? -38 : -44,
                leadBaseFrequency: cue.includes('burst') ? 260 : 980,
                leadOctaves: cue.includes('burst') ? 1.8 : 2.1,
                leadQ: cue.includes('burst') ? 1.25 : 1.05,
                accentBaseFrequency: cue.includes('burst') ? 620 : 1320,
                accentOctaves: cue.includes('burst') ? 2.2 : 2.5,
                accentQ: cue.includes('burst') ? 1.9 : 1.4,
                noiseQ: cue.includes('burst') ? 1.35 : 0.82,
                velocityScale: cue.includes('burst') ? 0.76 : 0.56,
                noiseScale: cue.includes('burst') ? 0.34 : 0.12
            });
        } else if (cue.includes('wave') || cue.includes('pulse') || layer === 'ambient-bloom' || layer === 'seam-sweep') {
            Object.assign(profile, {
                leadDb: -27,
                accentDb: -34,
                noiseDb: -42,
                leadBaseFrequency: 520,
                leadOctaves: 1.9,
                leadQ: 1.1,
                accentBaseFrequency: 760,
                accentOctaves: 2.2,
                accentQ: 1.7,
                noiseQ: 0.8,
                velocityScale: 0.62,
                noiseScale: 0.18
            });
        } else if (cue.includes('quantum') || cue.includes('revelation') || layer === 'halo-choir') {
            Object.assign(profile, {
                leadDb: -25,
                accentDb: -32,
                noiseDb: -41,
                leadBaseFrequency: 760,
                leadOctaves: 2.7,
                leadQ: 1.8,
                accentBaseFrequency: 1240,
                accentOctaves: 3.2,
                accentQ: 2.6,
                noiseQ: 1.1,
                velocityScale: 0.7,
                noiseScale: 0.22
            });
        } else if (cue.includes('sigma') || layer === 'digital-shear') {
            Object.assign(profile, {
                leadDb: -30,
                accentDb: -26,
                noiseDb: -36,
                leadBaseFrequency: 900,
                leadOctaves: 2.1,
                leadQ: 2.0,
                accentBaseFrequency: 1680,
                accentOctaves: 3.4,
                accentQ: 3.0,
                noiseQ: 2.5,
                velocityScale: 0.68,
                noiseScale: 0.34
            });
        } else if (cue.includes('storm') || layer === 'charged-choir' || layer === 'pressure-rumble') {
            Object.assign(profile, {
                leadDb: -24,
                accentDb: -30,
                noiseDb: -37,
                leadBaseFrequency: 520,
                leadOctaves: 2.3,
                leadQ: 1.7,
                accentBaseFrequency: 980,
                accentOctaves: 3.0,
                accentQ: 2.4,
                noiseQ: 1.8,
                velocityScale: 0.74,
                noiseScale: 0.38
            });
        } else if (cue.includes('gravity') || cue.includes('singularity') || layer === 'void-drag') {
            Object.assign(profile, {
                leadDb: -23,
                accentDb: -33,
                noiseDb: -40,
                leadBaseFrequency: 180,
                leadOctaves: 1.4,
                leadQ: 1.25,
                accentBaseFrequency: 340,
                accentOctaves: 1.7,
                accentQ: 1.5,
                noiseQ: 0.9,
                velocityScale: 0.7,
                noiseScale: 0.28
            });
        } else if (cue.includes('chrono') || cue.includes('bloom') || layer === 'sigil-bells') {
            Object.assign(profile, {
                leadDb: -26,
                accentDb: -33,
                noiseDb: -46,
                leadBaseFrequency: 840,
                leadOctaves: 2.4,
                leadQ: 1.15,
                accentBaseFrequency: 1480,
                accentOctaves: 2.7,
                accentQ: 1.8,
                noiseQ: 0.7,
                velocityScale: 0.58,
                noiseScale: 0.08
            });
        } else if (cue.includes('world-state') || layer === 'world-state-transition') {
            Object.assign(profile, {
                leadDb: -28,
                accentDb: -32,
                noiseDb: -42,
                leadBaseFrequency: 420,
                leadOctaves: 2.0,
                leadQ: 1.4,
                accentBaseFrequency: 840,
                accentOctaves: 2.6,
                accentQ: 1.8,
                noiseQ: 1.05,
                velocityScale: 0.64,
                noiseScale: 0.18
            });
        }

        profile.leadDb += Math.min(1.2, intensity * 0.45);
        profile.accentDb += Math.min(1.0, intensity * 0.35);
        return profile;
    }

    _applyRoutedEventMix(profile, intensity) {
        if (this.eventLeadSynth?.set) {
            this._setNodeVolume(this.eventLeadSynth, profile.leadDb, 'eventLeadSynth.routedVolume');
            this._safeNodeSet(this.eventLeadSynth, {
                filter: {
                    type: "bandpass",
                    rolloff: -12,
                    Q: profile.leadQ
                },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.18,
                    sustain: 0.0,
                    release: 0.28,
                    baseFrequency: profile.leadBaseFrequency,
                    octaves: profile.leadOctaves
                }
            }, 'eventLeadSynth.routedSet');
        }

        if (this.eventAccentSynth?.set) {
            this._setNodeVolume(this.eventAccentSynth, profile.accentDb, 'eventAccentSynth.routedVolume');
            this._safeNodeSet(this.eventAccentSynth, {
                filter: {
                    type: "bandpass",
                    rolloff: -12,
                    Q: profile.accentQ
                },
                filterEnvelope: {
                    attack: 0.003,
                    decay: 0.1,
                    sustain: 0.0,
                    release: 0.14,
                    baseFrequency: profile.accentBaseFrequency,
                    octaves: profile.accentOctaves
                }
            }, 'eventAccentSynth.routedSet');
        }

        if (this.eventNoiseSynth) {
            this._setNodeVolume(this.eventNoiseSynth, profile.noiseDb - Math.max(0, 0.4 - intensity * 0.08), 'eventNoiseSynth.routedVolume');
        }
        if (this.eventNoiseFilter) {
            this._setParamValue(this.eventNoiseFilter.Q, profile.noiseQ, 'eventNoiseFilter.routedQ');
        }
    }

    _scaleEventVelocity(intensity, profile = null) {
        const base = 0.2 + intensity * 0.22;
        const scaled = base * (profile?.velocityScale ?? 0.78);
        return Math.max(0.12, Math.min(0.62, scaled));
    }

    _triggerEventNoise(layer, intensity, frequency, duration = "32n") {
        if (!this.eventNoiseSynth || !this.eventNoiseFilter) return;

        let targetFrequency = frequency;
        if (layer === 'fold-rumble') targetFrequency *= 0.6;
        if (layer === 'void-drag') targetFrequency *= 0.45;
        if (layer === 'digital-shear') targetFrequency *= 1.35;
        if (layer === 'sigil-bells') targetFrequency *= 1.1;

        this._setParamValue(this.eventNoiseFilter.frequency, Math.max(120, Math.min(4200, targetFrequency)), 'eventNoiseFilter.triggerFrequency');
        this._setParamValue(this.eventNoiseFilter.Q, Math.max(0.8, Math.min(4, 1.1 + intensity * 1.2)), 'eventNoiseFilter.triggerQ');
        this.eventNoiseSynth.triggerAttackRelease(duration, undefined, Math.max(0.025, Math.min(0.16, 0.035 + intensity * 0.05)));
    }
}
