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

export class AtomaAudioSystem {
    constructor() {
        this.initialized = false;
        this.storageKey = 'atoma.audio.enabled';
        this.enabled = this._readEnabledPreference();
        this.lastTriggerAt = new Map();
        
        // All Tone.js synths and effects will be created in createSynths()
        // This prevents AudioContext warning before user gesture
        console.log('[Audio] System Constructed (Waiting for user interaction)');
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

    /**
     * Create all Tone.js synths and effects.
     * Called after AudioContext is started (user gesture).
     */
    createSynths() {
        // Master Effects
        this.masterLimiter = new Tone.Limiter(-1).toDestination();
        this.masterReverb = new Tone.Reverb({
            decay: 1.5,
            preDelay: 0.01,
            wet: 0.15
        }).connect(this.masterLimiter);

        // --- SYNTHS ---

        // 1. SELECTION / DESELECTION (Digital Breath / Pulse)
        // PolySynth to handle rapid clicks without cutting off
        this.selectionSynth = new Tone.PolySynth(Tone.MonoSynth, {
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
        }).connect(this.masterReverb);
        this.selectionSynth.volume.value = -5; // TEMP: louder selection for runtime verification

        // 1.5 HOVER ENTER (Glyph flyover)
        this.hoverSynth = new Tone.MonoSynth({
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
        }).connect(this.masterReverb);
        this.hoverSynth.volume.value = -15;

        // 1.6 HOVER EXIT (very subtle air fade)
        this.hoverExitSynth = new Tone.MonoSynth({
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
        }).connect(this.masterReverb);
        this.hoverExitSynth.volume.value = -24;

        // 1.7 PRIMARY NODE SET (anchor lock dual tone)
        this.primarySetSynth = new Tone.PolySynth(Tone.MonoSynth, {
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
        }).connect(this.masterReverb);
        this.primarySetSynth.volume.value = -12;

        // 1.8 INVALID LINK ATTEMPT (muted reject tick)
        this.invalidLinkSynth = new Tone.MonoSynth({
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
        }).connect(this.masterReverb);
        this.invalidLinkSynth.volume.value = -16;

        // 2. LINKING (Harmonic Convergence)
        // DuoSynth for phase alignment texture
        this.linkSynth = new Tone.DuoSynth({
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
        }).connect(this.masterReverb);
        this.linkSynth.volume.value = -12;

        // 3. UNLINKING (Diffusion)
        // Noise source with lowpass filter sweep
        this.unlinkSynth = new Tone.NoiseSynth({
            noise: {
                type: "pink"
            },
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0
            }
        }).connect(this.masterReverb);
        
        // Filter for unlinking
        this.unlinkFilter = new Tone.Filter({
            type: "lowpass",
            frequency: 1400,
            Q: 1.2
        }).connect(this.masterReverb);
        this.unlinkSynth.disconnect();
        this.unlinkSynth.connect(this.unlinkFilter);
        this.unlinkSynth.volume.value = -7;


        // 4. SYNERGY (Harmonic Bloom)
        // PolySynth with Triangle waves for warmth
        this.synergySynth = new Tone.PolySynth(Tone.Synth, {
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
        }).connect(this.masterReverb);
        this.synergySynth.volume.value = -16;
        
        // AutoFilter for subtle movement in synergy
        this.synergyFilter = new Tone.AutoFilter({
            frequency: 0.2,
            baseFrequency: 300,
            octaves: 2
        }).connect(this.masterReverb).start();
        this.synergySynth.disconnect();
        this.synergySynth.connect(this.synergyFilter);

        // 5. WORLD / HAZARD EVENT ROUTING
        this.eventLeadSynth = new Tone.PolySynth(Tone.MonoSynth, {
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
        }).connect(this.masterReverb);
        this.eventLeadSynth.volume.value = -18;

        this.eventAccentSynth = new Tone.MonoSynth({
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
        }).connect(this.masterReverb);
        this.eventAccentSynth.volume.value = -22;

        this.eventNoiseSynth = new Tone.NoiseSynth({
            noise: { type: "pink" },
            envelope: {
                attack: 0.01,
                decay: 0.16,
                sustain: 0.0,
                release: 0.18
            }
        }).connect(this.masterReverb);
        this.eventNoiseFilter = new Tone.Filter({
            type: "bandpass",
            frequency: 900,
            Q: 1.4
        }).connect(this.masterReverb);
        this.eventNoiseSynth.disconnect();
        this.eventNoiseSynth.connect(this.eventNoiseFilter);
        this.eventNoiseSynth.volume.value = -28;

        this._setDestinationMute(!this.enabled);
    }

    /**
     * Browser audio policy requires user interaction to start AudioContext.
     * Call this on first click/key press.
     */
    async start() {
        if (this.initialized) return;
        if (!this.enabled) return false;
        
        // First, start the AudioContext (requires user gesture)
        await Tone.start();
        
        // Then create all synths and effects after AudioContext is running
        this.createSynths();
        
        this.initialized = true;
        console.log('[Audio] AudioContext Started');
        
        // Play a very faint "boot" sound to confirm
        this.playSelection(true); 
        return true;
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
        this.unlinkFilter.frequency.value = 1800;
        this.unlinkFilter.frequency.rampTo(160, 0.14);
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

        this.eventLeadSynth.triggerAttackRelease(["C4", "G4"], "16n", now, velocity * 0.4);
    }

    _resolveRoutedEventCooldown(cue, intensity) {
        if (cue.includes('pressure') || cue.includes('residue')) return 220;
        if (cue.includes('sigma')) return 120;
        if (cue.includes('storm')) return 180;
        if (cue.includes('gravity')) return 240;
        if (cue.includes('chrono')) return 320;
        if (cue.includes('quantum')) return 300;
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
        }

        profile.leadDb += Math.min(1.2, intensity * 0.45);
        profile.accentDb += Math.min(1.0, intensity * 0.35);
        return profile;
    }

    _applyRoutedEventMix(profile, intensity) {
        if (this.eventLeadSynth?.set) {
            this.eventLeadSynth.volume.value = profile.leadDb;
            this.eventLeadSynth.set({
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
            });
        }

        if (this.eventAccentSynth?.set) {
            this.eventAccentSynth.volume.value = profile.accentDb;
            this.eventAccentSynth.set({
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
            });
        }

        if (this.eventNoiseSynth) {
            this.eventNoiseSynth.volume.value = profile.noiseDb - Math.max(0, 0.4 - intensity * 0.08);
        }
        if (this.eventNoiseFilter) {
            this.eventNoiseFilter.Q.value = profile.noiseQ;
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

        this.eventNoiseFilter.frequency.value = Math.max(120, Math.min(4200, targetFrequency));
        this.eventNoiseFilter.Q.value = Math.max(0.8, Math.min(4, 1.1 + intensity * 1.2));
        this.eventNoiseSynth.triggerAttackRelease(duration, undefined, Math.max(0.025, Math.min(0.16, 0.035 + intensity * 0.05)));
    }
}
