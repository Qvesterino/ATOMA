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
}
