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
        this.enabled = true;
        
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
        this.selectionSynth.volume.value = -12;

        // 2. LINKING (Harmonic Convergence)
        // DuoSynth for phase alignment texture
        this.linkSynth = new Tone.DuoSynth({
            vibratoAmount: 0,
            vibratoRate: 0,
            harmonicity: 1.005, // Slight detune for phasing
            voice0: {
                oscillator: { type: "sine" },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.3,
                    sustain: 0,
                    release: 0.5
                }
            },
            voice1: {
                oscillator: { type: "sine" },
                filterEnvelope: {
                    attack: 0.05, // Slightly later for "movement"
                    decay: 0.3,
                    sustain: 0,
                    release: 0.5
                }
            }
        }).connect(this.masterReverb);
        this.linkSynth.volume.value = -15;

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
            frequency: 800,
            Q: 0.5
        }).connect(this.masterReverb);
        this.unlinkSynth.disconnect();
        this.unlinkSynth.connect(this.unlinkFilter);
        this.unlinkSynth.volume.value = -18;


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


        console.log('[Audio] System Constructed (Waiting for user interaction)');
    }

    /**
     * Browser audio policy requires user interaction to start AudioContext.
     * Call this on first click/key press.
     */
    async start() {
        if (this.initialized) return;
        
        await Tone.start();
        this.initialized = true;
        console.log('[Audio] AudioContext Started');
        
        // Play a very faint "boot" sound to confirm
        this.playSelection(true); 
    }

    // --- TASK 1: Node Selection (Listening) ---
    playSelection(isBoot = false) {
        if (!this.initialized && !isBoot) return;
        // Soft sine ping, slightly high but soft
        // Freq: 880Hz (A5) - High enough to be clear, soft enough to be calm
        this.selectionSynth.triggerAttackRelease("A5", "32n", undefined, 0.3);
    }

    // --- TASK 2: Node Deselection (Settling) ---
    playDeselection() {
        if (!this.initialized) return;
        // Lower pitch, softer velocity
        // Freq: 440Hz (A4) - One octave down, "settling"
        this.selectionSynth.triggerAttackRelease("A4", "32n", undefined, 0.2);
    }

    // --- TASK 3: Link Creation (Agreement) ---
    playLinkCreated() {
        if (!this.initialized) return;
        // Harmonic interval (Perfect 5th) to signify stability/agreement
        // "C5" + "G5"
        // Slight delay between them handled by synth attack diff, or manually here
        this.linkSynth.triggerAttackRelease("C5", "8n");
    }

    // --- TASK 4: Link Breaking (Diffusing) ---
    playLinkBroken() {
        if (!this.initialized) return;
        // Filtered noise sweep down
        this.unlinkFilter.frequency.rampTo(100, 0.3);
        this.unlinkFilter.frequency.value = 800; // Reset start
        this.unlinkSynth.triggerAttackRelease("16n");
    }

    // --- TASK 5: Synergy Activation (Harmonic Bloom) ---
    playSynergyActive() {
        if (!this.initialized) return;
        // Major 9th chord for "Clarity" and "Expansion"
        // C4, E4, G4, B4, D5
        const chord = ["C4", "G4", "D5"]; 
        this.synergySynth.triggerAttackRelease(chord, "2n", undefined, 0.5);
    }

    // --- TASK 6: Synergy Fading (Dissipate) ---
    playSynergyFade() {
        if (!this.initialized) return;
        // Single lingering low tone fading out
        this.synergySynth.triggerAttackRelease(["C3"], "1n", undefined, 0.2);
    }
}
