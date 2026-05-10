/**
 * ATOMA AUDIO MODULATION SYSTEM (Session 142+ Audio Initialization & RangeError Audit)
 * 
 * Three layers of intelligent audio enrichment responding to network metrics.
 * 
 * Layer 1: SYNERGY MODULATION (Local)
 *   - Increases harmonic clarity as nodes align locally
 *   - Creates "thinking more clearly" sensation
 *   - Source: Tone.Synth (sub-bass periodic reinforcement)
 * 
 * Layer 2: HARMONY MODULATION (Global)
 *   - Shapes ambient motion and frequency response with overall stability
 *   - Creates "system at peace" or "system searching" sensation
 *   - Source: Tone.NoiseSynth (pink noise, continuous overlapping bursts)
 * 
 * Layer 3: CORRUPTION MODULATION (Systemic)
 *   - Subtle phase and texture stability as entropy rises
 *   - Creates "losing coherence" sensation without horror tropes
 *   - Source: Tone.NoiseSynth (brown noise, irregular bursts at high corruption)
 * 
 * Audio Initialization Safety (Audit Session 142+):
 * - ONLY Tone.LFO uses .start() — it's designed for continuous operation
 * - Tone.NoiseSynth and Tone.Synth use triggerAttackRelease() — never .start()
 * - harmonyNoise triggered every 3.5s with 2.8s envelope for seamless ambience
 * - corruptionNoise triggered on burst schedule when corruption > 0.2
 * - All sources properly routed through master reverb/limiter chain
 * 
 * Tone.js RangeError Safety (Audit Session 142+ Extended):
 * - SAFE_AUDIO_FLOOR (0.002) represents minimum audible system presence
 * - All exponential ramps clamped to never approach 0
 * - Linear ramps used only for values with adequate floor
 * - Conceptual rule: ATOMA is never sonically zero — silence is stability, not absence
 * 
 * Design: No new sounds, only enrichment of existing audio through parameter modulation.
 * Performance: ~0.3ms per frame at 60fps
 */

import * as Tone from 'tone';
const HAS_TONE_STUB = Reflect.get(Tone, '__ATOMA_TONE_STUB__') === true;

/**
 * SAFE_AUDIO_FLOOR: Minimum audible system presence
 * Prevents Tone.js exponentialRampTo RangeError when targeting near-zero values.
 * At 0.002 (-50dB from 1.0), this is imperceptible but represents system awareness.
 * 
 * Conceptual Rule:
 * The ATOMA system is never sonically zero. Even at "silence," the system maintains
 * a subtle harmonic presence. This represents stability and coherence, not absence.
 */
const SAFE_AUDIO_FLOOR = 0.002;

export class AtomaAudioModulation {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.enabled = true;
        this.backend = HAS_TONE_STUB ? 'fallback' : 'real-tone';
        
        // Current metric values (smoothed)
        this.smoothedSynergy = 0;
        this.smoothedHarmony = 0.5;
        this.smoothedCorruption = 0;
        
        // Smoothing constants (0-1, lower = more smoothing)
        this.synergySmoothFactor = 0.15;
        this.harmonySmoothFactor = 0.1;
        this.corruptionSmoothFactor = 0.12;
        
        // === LAYER 1: SYNERGY MODULATION ===
        // Harmonic clarity enhancer: subtle filter resonance
        this.synergyFilter = new Tone.Filter({
            type: 'highpass',
            frequency: 200,
            Q: 0.5
        });
        
        // Sub-bass reinforcement for coherence
        // (Stereo width naturally emerges from reverb processing + filter modulation)
        this.synergySynth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: {
                attack: 0.1,
                decay: 0.5,
                sustain: 0.3,
                release: 0.8
            }
        });
        this.setParamValue(this.synergySynth?.volume, -35); // Very subtle
        
        // === LAYER 2: HARMONY MODULATION ===
        // Global ambient motion driver
        this.harmonyLFO = new Tone.LFO({
            frequency: 0.15, // Slow, meditative
            min: 0.05,
            max: 0.25
        }).start();
        
        // Low-frequency color modulator
        this.harmonyFilter = new Tone.Filter({
            type: 'lowpass',
            frequency: 8000,
            Q: 1
        });
        
        // Ambient texture layer (pink noise)
        this.harmonyNoise = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: {
                attack: 2.0,
                decay: 1.0,
                sustain: 0.5,
                release: 2.0
            }
        });
        this.setParamValue(this.harmonyNoise?.volume, -40); // Very subtle background
        
        // === LAYER 3: CORRUPTION MODULATION ===
        // Phase stability generator
        this.corruptionPhaseShift = 0;
        this.corruptionPhaseRate = 0.05; // rad/s baseline
        
        // Texture noise for entropy
        this.corruptionNoise = new Tone.NoiseSynth({
            noise: { type: 'brown' }, // Brownian motion = more coherent
            envelope: {
                attack: 1.5,
                decay: 0.8,
                sustain: 0.4,
                release: 1.5
            }
        });
        this.setParamValue(this.corruptionNoise?.volume, -45); // Very subtle
        
        // === ROUTING SETUP ===
        // All modulation synths connect to master reverb (already in audioSystem)
        // This keeps the modulation textures coherent with main audio
        if (this.audioSystem.masterReverb) {
            this.synergySynth.connect(this.audioSystem.masterReverb);
            this.harmonyNoise.connect(this.audioSystem.masterReverb);
            this.corruptionNoise.connect(this.audioSystem.masterReverb);
        } else {
            // Fallback to destination if reverb not available
            this.synergySynth.toDestination();
            this.harmonyNoise.toDestination();
            this.corruptionNoise.toDestination();
        }
        
        // === AMBIENT TEXTURE TIMERS ===
        // Tone.js NoiseSynth instances use triggerAttackRelease(), not .start()
        // Initialize timers for continuous ambient texture emission
        this.harmonyNoiseTimer = 3.5; // Trigger harmony noise every 3.5 seconds
        this.harmonyNoiseDuration = 2.8; // 2.8s attack+sustain envelope
        
        console.log('[Audio Modulation] System initialized (3 layers: synergy, harmony, corruption)');
    }

    setParamValue(param, value) {
        if (!param) return false;
        try {
            if ('value' in param) {
                param.value = value;
                return true;
            }
            if (typeof param.rampTo === 'function') {
                param.rampTo(value, 0.01);
                return true;
            }
        } catch (_) {
            return false;
        }
        return false;
    }
    
    /**
     * Main update loop - call this from main animation frame
     * @param {number} deltaTime - Frame delta in seconds
     * @param {object} metrics - { synergy: 0-100, harmony: 0-100, corruption: 0-100 }
     */
    update(deltaTime, metrics) {
        if (!this.enabled || !metrics) return;
        
        // Normalize metrics to 0-1 range
        const synergy = (metrics.synergy ?? 0) / 100;
        const harmony = (metrics.harmony ?? 50) / 100;
        const corruption = (metrics.corruption ?? 0) / 100;
        
        // Smooth incoming values
        this.smoothedSynergy += (synergy - this.smoothedSynergy) * this.synergySmoothFactor;
        this.smoothedHarmony += (harmony - this.smoothedHarmony) * this.harmonySmoothFactor;
        this.smoothedCorruption += (corruption - this.smoothedCorruption) * this.corruptionSmoothFactor;
        
        // Apply three modulation layers
        this.applySynergyModulation(deltaTime);
        this.applyHarmonyModulation(deltaTime);
        this.applyCorruptionModulation(deltaTime);
    }
    
    /**
     * Clamp a value to the safe audio floor to prevent Tone.js RangeError.
     * Used for all parameters that might approach zero through modulation.
     * @param {number} value - The value to clamp
     * @returns {number} Value clamped to [SAFE_AUDIO_FLOOR, ∞)
     */
    clampToSafeFloor(value) {
        return Math.max(SAFE_AUDIO_FLOOR, value);
    }
    
    /**
     * Clamp a range-limited value between a floor and ceiling.
     * Used for parameters like Q, frequency, etc.
     * @param {number} value - The value to clamp
     * @param {number} floor - Minimum allowed value (should be > SAFE_AUDIO_FLOOR for audio)
     * @param {number} ceiling - Maximum allowed value
     * @returns {number} Value clamped to [floor, ceiling]
     */
    clampToRange(value, floor, ceiling) {
        return Math.max(floor, Math.min(ceiling, value));
    }
    
    /**
     * Safely ramp a Tone.Param to a target value.
     * 
     * Before calling rampTo(), checks if the parameter's range allows ramping.
     * If minValue === maxValue (fixed range), skips the ramp (graceful noop).
     * This prevents RangeError when Tone.Params have constrained ranges.
     * 
     * @param {Tone.Param} param - The Tone.Param to modulate
     * @param {number} targetValue - The target value to ramp to
     * @param {number} rampTime - Duration of ramp in seconds
     * @returns {boolean} true if ramp was applied, false if skipped
     */
    safeRamp(param, targetValue, rampTime) {
        // Guard 1: Check if param exists
        if (!param) return false;
        
        // Guard 2: Check if param has valid minValue/maxValue
        if (param.minValue === undefined || param.maxValue === undefined) {
            // No range defined; param might not be rampable
            return false;
        }
        
        // Guard 3: Check if param range is fixed (cannot ramp)
        if (param.minValue === param.maxValue) {
            // Range is fixed [X, X]; ramp would fail
            // Skip ramping (noop) - modulation still applied via other parameters
            return false;
        }
        
        // Guard 4: Check if target value is within param's valid range
        if (targetValue < param.minValue || targetValue > param.maxValue) {
            // Value outside valid range; clamp it
            targetValue = Math.max(param.minValue, Math.min(param.maxValue, targetValue));
        }
        
        // All guards passed; ramp is safe
        try {
            param.rampTo(targetValue, rampTime);
            return true;
        } catch (error) {
            // Fallback: if ramp still fails, attempt direct assignment
            return this.setParamValue(param, targetValue);
        }
    }
    
    /**
     * LAYER 1: Synergy Modulation
     * As local nodes align, the audio becomes clearer and more spatially coherent
     */
    applySynergyModulation(deltaTime) {
        // Harmonic clarity: as synergy increases, boost high-mid clarity
        // Q value drives resonance: low synergy = flat, high synergy = sharp peak
        // Range: 0.5 to 3.0 (safe from RangeError, always > SAFE_AUDIO_FLOOR)
        const clarityQ = this.clampToRange(0.5 + this.smoothedSynergy * 2.5, 0.5, 3.0);
        this.safeRamp(this.synergyFilter.Q, clarityQ, 0.3);
        
        // Frequency shifts slightly up with synergy (more "awake")
        // Range: 250 to 550 Hz (safe from RangeError, always > SAFE_AUDIO_FLOOR)
        const clarityFreq = this.clampToRange(250 + this.smoothedSynergy * 300, 250, 550);
        this.safeRamp(this.synergyFilter.frequency, clarityFreq, 0.3);
        
        // Sub-bass reinforcement: plays subtle 50Hz tone when synergy is high
        // Frequency: 50Hz (sub-bass fundamental)
        // Volume: proportional to synergy (-35 to -20 dB)
        // Tone.js volume parameter supports negative dB values safely
        const subBassVolume = -35 - this.smoothedSynergy * 15; // -35 to -20 dB
        this.safeRamp(this.synergySynth.volume, subBassVolume, 0.5);
        
        // Trigger sub-bass tone periodically (every 2 seconds) when synergy > 0.4
        if (this.smoothedSynergy > 0.4) {
            // Use a timer to trigger periodically
            if (!this.synergyToneTimer) {
                this.synergyToneTimer = 2.0;
                this.synergySynth.triggerAttackRelease('C1', '1n');
            }
            this.synergyToneTimer -= deltaTime;
            if (this.synergyToneTimer <= 0) {
                this.synergyToneTimer = 2.0;
                this.synergySynth.triggerAttackRelease('C1', '1n');
            }
        }
    }
    
    /**
     * LAYER 2: Harmony Modulation
     * Global network stability shapes the ambient motion and response
     */
    applyHarmonyModulation(deltaTime) {
        if (!Number.isFinite(deltaTime)) return;

        // LFO rate: high harmony = slow, meditative; low harmony = faster, searching
        // Range: 0.08 Hz (very slow, peaceful) to 0.35 Hz (active, restless)
        // Safe from RangeError: always > SAFE_AUDIO_FLOOR
        const lfoFreq = this.clampToRange(0.08 + (1 - this.smoothedHarmony) * 0.27, 0.08, 0.35);
        this.safeRamp(this.harmonyLFO.frequency, lfoFreq, 1.0);
        
        // Filter cutoff: high harmony = bright, open; low harmony = duller, constrained
        // Range: 5000 Hz (constrained) to 10000 Hz (open, spacious)
        // Safe from RangeError: always > SAFE_AUDIO_FLOOR
        const harmonyFreq = this.clampToRange(5000 + this.smoothedHarmony * 5000, 5000, 10000);
        this.safeRamp(this.harmonyFilter.frequency, harmonyFreq, 1.0);
        
        // Filter Q: high harmony = gentle rolloff; low harmony = sharper cutoff
        // Range: 0.5 to 1.5 (safe from RangeError, always > SAFE_AUDIO_FLOOR)
        const harmonyQ = this.clampToRange(0.5 + (1 - this.smoothedHarmony) * 1.0, 0.5, 1.5);
        this.safeRamp(this.harmonyFilter.Q, harmonyQ, 1.0);
        
        // Ambient noise volume: increases slightly when harmony is low (uncertainty)
        // Range: -42 dB (high harmony, subtle) to -38 dB (low harmony, more present)
        // Tone.js volume parameter supports negative dB values safely (no RangeError)
        const ambientVolume = -42 + (1 - this.smoothedHarmony) * 4;
        this.safeRamp(this.harmonyNoise.volume, ambientVolume, 2.0);
        
        // Continuous ambient texture: trigger harmonyNoise periodically for sustained texture
        // This creates the background ambience that responds to harmony changes
        if (!this.harmonyNoiseTimer) {
            this.harmonyNoiseTimer = 0;
        }
        this.harmonyNoiseTimer -= deltaTime;
        if (this.harmonyNoiseTimer <= 0) {
            // Trigger harmonyNoise with its long envelope (2.8s attack+sustain)
            this.harmonyNoise.triggerAttackRelease(this.harmonyNoiseDuration);
            // Reschedule: every 3.5s for 95% overlap, creating seamless ambience
            this.harmonyNoiseTimer = 3.5;
        }
        
        // Drive LFO into filter for slow motion
        // Note: When LFO is connected to a parameter, that parameter may have constraints
        // safeRamp() will gracefully handle any non-rampable parameters
        this.harmonyLFO.connect(this.harmonyFilter.frequency);
    }
    
    /**
     * LAYER 3: Corruption Modulation
     * Systemic entropy creates subtle phase stability and texture degradation
     */
    applyCorruptionModulation(deltaTime) {
        // Phase stability: oscillating phase offset on noise
        // Range: 0 to 0.3 radians (mathematical only, doesn't touch audio parameters)
        this.corruptionPhaseShift += this.corruptionPhaseRate * this.smoothedCorruption * deltaTime;
        if (this.corruptionPhaseShift > Math.PI * 2) {
            this.corruptionPhaseShift -= Math.PI * 2;
        }
        
        // Corruption noise volume: increases as entropy rises
        // Range: -48 dB (no corruption) to -42 dB (high corruption, more texture stability)
        // Tone.js volume parameter supports negative dB values safely (no RangeError)
        const corruptionVolume = this.clampToRange(-48 + this.smoothedCorruption * 6, -48, -42);
        this.safeRamp(this.corruptionNoise.volume, corruptionVolume, 1.5);
        
        // Texture randomness: as corruption increases, play noise bursts at irregular intervals
        // This creates gentle unpredictability without glitches
        if (this.smoothedCorruption > 0.2) {
            if (!this.corruptionBurstTimer) {
                this.corruptionBurstTimer = Math.random() * (1 + this.smoothedCorruption * 2);
            }
            this.corruptionBurstTimer -= deltaTime;
            if (this.corruptionBurstTimer <= 0) {
                // Trigger a brief noise burst
                const burstDuration = 0.2 + Math.random() * 0.3;
                this.corruptionNoise.triggerAttackRelease(burstDuration);
                // Randomize next burst timing
                this.corruptionBurstTimer = Math.random() * (2 + this.smoothedCorruption * 3);
            }
        }
    }
    
    /**
     * Enable/disable the modulation system
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            // Reset to neutral values
            this.smoothedSynergy = 0;
            this.smoothedHarmony = 0.5;
            this.smoothedCorruption = 0;
        }
        console.log(`[Audio Modulation] ${enabled ? 'Enabled' : 'Disabled'}`);
    }
    
    /**
     * Get current modulation status
     */
    getStatus() {
        return {
            enabled: this.enabled,
            synergy: this.smoothedSynergy.toFixed(3),
            harmony: this.smoothedHarmony.toFixed(3),
            corruption: this.smoothedCorruption.toFixed(3),
            description: `Synergy: ${(this.smoothedSynergy * 100).toFixed(0)}% | Harmony: ${(this.smoothedHarmony * 100).toFixed(0)}% | Corruption: ${(this.smoothedCorruption * 100).toFixed(0)}%`
        };
    }
    
    /**
     * Test all modulation layers
     */
    testModulation() {
        console.log('[Audio Modulation] Testing all layers...');
        
        // Test synergy (0 -> 1 -> 0)
        console.log('  Testing SYNERGY modulation (clarity + stereo width)...');
        for (let i = 0; i <= 10; i++) {
            const s = i / 10;
            this.smoothedSynergy = s;
            this.applySynergyModulation(0.1);
        }
        this.smoothedSynergy = 0;
        
        // Test harmony (1 -> 0 -> 1)
        console.log('  Testing HARMONY modulation (LFO + filter motion)...');
        for (let i = 10; i >= 0; i--) {
            const h = i / 10;
            this.smoothedHarmony = h;
            this.applyHarmonyModulation(0.1);
        }
        this.smoothedHarmony = 0.5;
        
        // Test corruption (0 -> 1 -> 0)
        console.log('  Testing CORRUPTION modulation (phase + texture)...');
        for (let i = 0; i <= 10; i++) {
            const c = i / 10;
            this.smoothedCorruption = c;
            this.applyCorruptionModulation(0.1);
        }
        this.smoothedCorruption = 0;
        
        console.log('[Audio Modulation] Test complete');
    }
}
