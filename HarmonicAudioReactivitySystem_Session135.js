/**
 * ============================================================================
 * SESSION 135: HARMONIC AUDIO REACTIVITY SYSTEM
 * Transforms network state into living soundscape
 * ============================================================================
 * 
 * CORE CONCEPT:
 * - Creates procedural 432Hz harmonic healing sounds
 * - Generates harsh rupture impact sounds for stress/corruption
 * - Uses Web Audio API 3D spatial audio for immersive positioning
 * - Modulates audio based on network harmony/corruption state
 * 
 * FEATURES:
 * - Procedural tone generation (no external audio files)
 * - 432Hz harmonic fundamental frequency
 * - 3D spatial panning relative to camera
 * - State-driven modulation (harmony → purity, corruption → harshness)
 * - Web Audio PannerNode for immersive 3D positioning
 * 
 * INTEGRATION:
 * - Healing system triggers harmonic healing tones
 * - Rupture events trigger directional impact sounds
 * - Network chaos level drives tonal dissonance
 */

export class HarmonicAudioReactivitySystem_Session135 {
    constructor(camera) {
        // ====================================================================
        // WEB AUDIO CONTEXT
        // ====================================================================
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.camera = camera;
        
        // ====================================================================
        // MASTER VOLUME & STATE
        // ====================================================================
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3; // Conservative volume (30% of max)
        this.masterGain.connect(this.audioContext.destination);
        
        this.isActive = true;
        this.networkHarmony = 0.5; // 0 = chaos, 1 = harmony
        this.networkCorruption = 0; // 0 = clean, 1 = fully corrupt
        
        // ====================================================================
        // HEALING TONE STATE
        // ====================================================================
        this.healingVoices = []; // Array of active voice objects { osc, gain, panner, startTime }
        this.maxHealingVoices = 3; // Polyphony limit to prevent clutter
        
        this.healingFrequency = 432; // Pure harmonic frequency
        
        // ====================================================================
        // RUPTURE IMPACT STATE
        // ====================================================================
        this.ruptureOscillators = []; // Multiple frequency ruptures
        this.ruptureGain = this.audioContext.createGain();
        this.ruptureGain.gain.value = 0;
        this.ruptureGain.connect(this.masterGain);
        
        this.rupturePanner = this.audioContext.createPanner();
        this.rupturePanner.connect(this.ruptureGain);
        
        // ====================================================================
        // AMBIENT HUM STATE
        // ====================================================================
        this.ambientOscillator = null;
        this.ambientGain = this.audioContext.createGain();
        this.ambientGain.gain.value = 0.1;
        this.ambientGain.connect(this.masterGain);
        
        // Start ambient hum immediately
        this._startAmbientHum();
        
        // ====================================================================
        // FILTER CHAIN FOR TONAL MODULATION
        // ====================================================================
        this.filterBiquad = this.audioContext.createBiquadFilter();
        this.filterBiquad.type = 'lowpass';
        this.filterBiquad.frequency.value = 2000;
        this.filterBiquad.Q.value = 1;
        
        console.log('✓ [S135] HarmonicAudioReactivitySystem initialized');
    }
    
    /**
     * Start continuous ambient hum (network baseline)
     * Frequency modulated by harmony level
     */
    _startAmbientHum() {
        if (this.ambientOscillator) {
            this.ambientOscillator.stop();
            this.ambientOscillator.disconnect();
        }
        
        this.ambientOscillator = this.audioContext.createOscillator();
        this.ambientOscillator.type = 'sine';
        this.ambientOscillator.frequency.value = 108; // 432 / 4 harmonic
        
        this.ambientOscillator.connect(this.ambientGain);
        this.ambientOscillator.start();
    }
    
    /**
     * Trigger healing wave sound
     * Uses 432Hz fundamental with harmonic overtones
     * 
     * @param {THREE.Vector3} position - World position of heal source
     * @param {number} intensity - Healing wave strength (0-1)
     */
    triggerHealingTone(position, intensity = 0.7) {
        if (!this.isActive) return;
        
        // Stop existing healing tone
        if (this.healingOscillator) {
            this.healingOscillator.stop();
            this.healingOscillator.disconnect();
        }
        
        // Calculate 3D spatial position relative to camera
        const relativePos = position.clone().sub(this.camera.position);
        
        // Create new healing oscillator
        this.healingOscillator = this.audioContext.createOscillator();
        this.healingOscillator.type = 'sine';
        
        // Modulate frequency based on network harmony
        // Harmony increases tone purity and coherence
        const harmonyModulation = 1 + (this.networkHarmony * 0.2); // ±20% frequency shift
        this.healingOscillator.frequency.value = this.healingFrequency * harmonyModulation;
        
        // Connect through panner for 3D spatial audio
        this.healingOscillator.connect(this.healingPanner);
        
        // Set 3D panning position
        this.healingPanner.setPosition(relativePos.x, relativePos.y, relativePos.z);
        
        // Set gain (intensity modulated)
        const gainValue = intensity * (0.5 + this.networkHarmony * 0.5); // Harmony boosts volume
        this.healingGain.gain.setValueAtTime(gainValue, this.audioContext.currentTime);
        this.healingGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
        
        this.healingOscillator.start();
        this.healingOscillator.stop(this.audioContext.currentTime + 2);
    }
    
    /**
     * Trigger rupture impact sound
     * Creates dissonant, harsh frequencies that decay
     * 
     * @param {THREE.Vector3} position - World position of rupture
     * @param {number} intensity - Impact severity (0-1)
     */
    triggerRuptureSound(position, intensity = 0.8) {
        if (!this.isActive) return;
        
        // Stop existing rupture oscillators
        for (const osc of this.ruptureOscillators) {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {
                // Already stopped
            }
        }
        this.ruptureOscillators = [];
        
        // Calculate 3D spatial position
        const relativePos = position.clone().sub(this.camera.position);
        
        // Create multiple dissonant frequencies for harsh impact
        const frequencies = [
            150,  // Low fundamental
            247,  // Minor second (dissonant)
            389,  // Tritone (very dissonant)
            600   // High dissonance
        ];
        
        for (const freq of frequencies) {
            const osc = this.audioContext.createOscillator();
            osc.type = 'square'; // Square wave for harsh sound
            
            // Corruption increases dissonance
            const dissonanceModulation = 1 + (this.networkCorruption * 0.3);
            osc.frequency.value = freq * dissonanceModulation;
            
            osc.connect(this.rupturePanner);
            
            this.ruptureOscillators.push(osc);
            osc.start();
        }
        
        // Set 3D panning position
        this.rupturePanner.setPosition(relativePos.x, relativePos.y, relativePos.z);
        
        // Set rupture gain envelope (quick attack, fast decay)
        const gainValue = intensity * (0.6 + this.networkCorruption * 0.4);
        this.ruptureGain.gain.setValueAtTime(gainValue, this.audioContext.currentTime);
        this.ruptureGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
        
        // Stop all oscillators after decay
        const stopTime = this.audioContext.currentTime + 0.5;
        for (const osc of this.ruptureOscillators) {
            osc.stop(stopTime);
        }
    }
    
    /**
     * Update network state (called each frame)
     * Modulates ambient sound based on harmony/corruption levels
     * 
     * @param {number} harmony - Network harmony level (0-1)
     * @param {number} corruption - Network corruption level (0-1)
     */
    updateNetworkState(harmony, corruption) {
        this.networkHarmony = Math.max(0, Math.min(1, harmony));
        this.networkCorruption = Math.max(0, Math.min(1, corruption));
        
        // Update ambient hum based on harmony
        // Higher harmony = cleaner, purer tone
        // Higher corruption = more dissonant frequencies
        if (this.ambientOscillator) {
            // Harmony drives base frequency upward (purity)
            const baseFreq = 108 + (this.networkHarmony * 54); // 108-162 Hz range
            const corruptionShift = this.networkCorruption * 20; // Corruption adds harshness
            
            this.ambientOscillator.frequency.setTargetAtTime(
                baseFreq + corruptionShift,
                this.audioContext.currentTime,
                0.3 // Smooth 0.3s transition
            );
        }
        
        // Update ambient gain based on chaos level
        const ambientIntensity = 0.1 + (this.networkHarmony * 0.1); // 0.1-0.2 range
        this.ambientGain.gain.setTargetAtTime(
            ambientIntensity,
            this.audioContext.currentTime,
            0.5
        );
        
        // Modulate filter cutoff based on corruption
        // Higher corruption = lower cutoff (muddier sound)
        const cutoff = 2000 - (this.networkCorruption * 1500); // 2000-500 Hz range
        this.filterBiquad.frequency.setTargetAtTime(
            cutoff,
            this.audioContext.currentTime,
            0.3
        );
    }
    
    /**
     * Update camera position for spatial audio
     * Must be called when camera moves
     * 
     * @param {THREE.Vector3} position - New camera position
     */
    updateCameraPosition(position) {
        this.camera.position.copy(position);
        
        // Update panner listener position
        const listener = this.audioContext.listener;
        listener.setPosition(position.x, position.y, position.z);
        
        // Update camera forward/up vectors for directional audio
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        
        const up = this.camera.up;
        listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
    
    /**
     * Enable/disable audio system
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.isActive = enabled;
        
        if (!enabled) {
            // Fade out all active sounds
            this.healingGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
            this.ruptureGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
            this.ambientGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5);
        } else {
            // Resume ambient hum
            this.ambientGain.gain.setTargetAtTime(0.1, this.audioContext.currentTime, 0.3);
        }
        
        console.log(`[S135] Audio system ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Set master volume (0-1)
     * @param {number} volume
     */
    setMasterVolume(volume) {
        this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
    
    /**
     * Clean up audio resources
     */
    dispose() {
        try {
            if (this.healingOscillator) {
                this.healingOscillator.stop();
                this.healingOscillator.disconnect();
            }
            if (this.ambientOscillator) {
                this.ambientOscillator.stop();
                this.ambientOscillator.disconnect();
            }
            for (const osc of this.ruptureOscillators) {
                try {
                    osc.stop();
                    osc.disconnect();
                } catch (e) {
                    // Already stopped
                }
            }
            
            this.masterGain.disconnect();
            this.healingGain.disconnect();
            this.ruptureGain.disconnect();
            this.ambientGain.disconnect();
            
            console.log('✓ [S135] Audio resources disposed');
        } catch (err) {
            console.warn('[S135] Error disposing audio:', err);
        }
    }
}
