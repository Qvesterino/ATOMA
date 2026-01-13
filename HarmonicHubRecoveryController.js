/**
 * HarmonicHubRecoveryController
 * ============================================================================
 * Manages visual recovery when harmonic hubs transition from collapse → healthy.
 * 
 * SYSTEM BEHAVIOR:
 * - Detects recovery condition: harmony > corruption AND collapseFactor > 0
 * - Implements three visual phases: Phase Dampening → Re-Alignment → Re-Lock
 * - Gradually reduces phase variance and re-establishes harmonic synchronization
 * - Emits one-time re-lock wave at entry to recovery state
 * - Smooth, deterministic transitions (no snapping or hard resets)
 * 
 * RECOVERY DRIVERS (State Mapping):
 * - Harmony: Primary driver, controls recovery speed and re-lock force
 * - Synergy: Sustains energy flow during recovery (prevents stalling)
 * - Instability: Slows recovery and lags phase alignment
 * - Corruption: Must fall below harmony to allow recovery
 * 
 * ARCHITECTURE:
 * - Per-hub recovery state tracking
 * - Time-based phase smoothing
 * - One-time wave emission on recovery entry
 * - All state cached in controller (no allocations)
 * - Graceful integration with HarmonicHubCollapseController
 * 
 * CONSTRAINTS:
 * ✅ Adapter-only visual system
 * ✅ Read-only from node/link state
 * ✅ No gameplay changes
 * ✅ Zero per-frame allocations
 * ✅ No data mutations
 * ✅ Graceful fallback if systems missing
 * 
 * VISUAL EFFECTS:
 * - Braided strands: Jitter amplitude decays exponentially
 * - Pulse waves: Fragmented pulses reconnect, cadence stabilizes
 * - Directional streaks: Irregular gaps close, spacing becomes uniform
 * - Surface ripples: Torn patterns heal, angular continuity restored
 * - Resonance re-lock wave: Soft expanding phase wave from node
 * - Harmonic halo: Contracts smoothly, brightness evens, frequency stabilizes
 */

import * as THREE from 'three';

export class HarmonicHubRecoveryController {
    constructor(harmonicSyncController, collapseController) {
        this.harmonicController = harmonicSyncController;
        this.collapseController = collapseController;
        
        // Recovery state (0 = no recovery, 1 = fully recovered)
        this.recoveryFactor = 0.0;
        this.targetRecoveryFactor = 0.0;
        
        // Recovery phase tracking (for visual effect progression)
        this.recoveryPhase = 'idle'; // 'idle', 'dampening', 'realigning', 'relocking'
        this.phaseTransitionTime = 0.0;
        
        // Re-lock wave state
        this.hasEmittedReLockWave = false;
        this.reLockWaveTime = 0.0;
        this.reLockWaveEmitted = false;
        
        // Recovery timing
        this.recoveryAge = 0.0; // Time spent in recovery (resets on entry)
        this.lastRecoveryConditionMet = false;
        
        // Phase variance recovery
        this.recoveredPhaseVariance = 0.0;
        this.recoveryVarianceSmoothingRate = 0.12; // Faster than degradation
        
        // Hub synchronization recovery
        this.recoveredSyncStrength = 0.0;
        this.recoverySyncSmoothingRate = 0.1;
        
        // Configuration
        this.config = {
            // Recovery activation
            harmonyCorruptionThreshold: 0.15,   // Harmony must exceed corruption by this margin
            
            // Recovery progression speeds (per phase)
            dampingDuration: 1.5,               // Phase 1: Jitter subsides (seconds)
            realigningDuration: 2.0,            // Phase 2: Phase alignment (seconds)
            relockingDuration: 1.5,             // Phase 3: Harmonic re-establishment (seconds)
            
            // Phase variance recovery
            varianceRecoveryRate: 0.14,         // Speed of variance reduction
            varianceRecoveryInstabilityLag: 0.04, // Instability slows variance recovery
            
            // Sync strength recovery
            syncRecoveryRate: 0.11,             // Speed of sync strength restoration
            syncRecoveryHarmonyBoost: 0.3,      // Harmony accelerates sync recovery
            syncRecoverySynergyBoost: 0.2,      // Synergy supports sync recovery
            
            // Re-lock wave
            reLockWaveEmitDelay: 0.3,           // Delay after recovery start (seconds)
            reLockWaveDuration: 0.6,            // Wave travel duration
            reLockWaveIntensity: 0.7,           // Phase wave amplitude (0-1)
            reLockWaveFrequency: 8.0,           // Wave oscillation frequency
            reLockWaveTravelDistance: 0.3,      // How far wave travels along link (fraction)
            
            // Halo stabilization
            haloStabilizationRate: 0.13,        // Halo oscillation smooths out
            haloContractionRate: 0.1,           // Halo size reduces toward baseline
            
            // Overall recovery completion
            recoveryCompletionThreshold: 0.95,  // When to consider recovery "done"
        };
        
        // Math cache
        this._vec3 = new THREE.Vector3();
        this._tempPhaseVariance = 0.0;
        this._tempSyncStrength = 0.0;
    }

    /**
     * Update recovery state based on node health
     * Called per-frame for hubs being tracked
     */
    update(harmony = 1.0, corruption = 0.0, synergy = 0.5, instability = 0.0, deltaTime = 0.016, collapseFactor = 0.0) {
        // Clamp inputs
        harmony = Math.max(0, Math.min(1, harmony));
        corruption = Math.max(0, Math.min(1, corruption));
        synergy = Math.max(0, Math.min(1, synergy));
        instability = Math.max(0, Math.min(1, instability));
        deltaTime = Math.max(0, Math.min(0.1, deltaTime));
        collapseFactor = Math.max(0, Math.min(1, collapseFactor));

        // Detect recovery entry condition
        const recoveryConditionMet = (harmony > corruption + this.config.harmonyCorruptionThreshold) && collapseFactor > 0;
        
        if (recoveryConditionMet && !this.lastRecoveryConditionMet) {
            // Entering recovery
            this.onRecoveryEnter();
        } else if (!recoveryConditionMet && this.lastRecoveryConditionMet) {
            // Exiting recovery (relapsed into overload)
            this.onRecoveryExit();
        }
        
        this.lastRecoveryConditionMet = recoveryConditionMet;

        if (recoveryConditionMet) {
            // Update recovery progression
            this.updateRecoveryProgression(harmony, corruption, synergy, instability, deltaTime, collapseFactor);
        } else {
            // Decay recovery state when condition not met
            this.targetRecoveryFactor = 0.0;
            this.recoveryFactor = Math.max(0, this.recoveryFactor - deltaTime * 0.3);
            this.recoveryPhase = 'idle';
            this.reLockWaveEmitted = false;
        }
    }

    /**
     * Called when recovery condition is first met
     */
    onRecoveryEnter() {
        this.recoveryAge = 0.0;
        this.targetRecoveryFactor = 1.0;
        this.recoveryPhase = 'dampening';
        this.phaseTransitionTime = 0.0;
        this.hasEmittedReLockWave = false;
        this.reLockWaveEmitted = false;
    }

    /**
     * Called when recovery condition is lost
     */
    onRecoveryExit() {
        this.targetRecoveryFactor = 0.0;
        this.recoveryPhase = 'idle';
        this.reLockWaveEmitted = false;
    }

    /**
     * Update recovery progression through phases
     */
    updateRecoveryProgression(harmony, corruption, synergy, instability, deltaTime, collapseFactor) {
        // Smooth toward target recovery factor
        const recoverySpeed = 0.08 * (1.0 + harmony * 0.5); // Harmony accelerates recovery
        this.recoveryFactor += (this.targetRecoveryFactor - this.recoveryFactor) * recoverySpeed;

        // Advance recovery age
        this.recoveryAge += deltaTime;
        this.phaseTransitionTime += deltaTime;

        // Update recovery phase based on elapsed time
        const dampingEnd = this.config.dampingDuration;
        const realigningEnd = dampingEnd + this.config.realigningDuration;
        const relockingEnd = realigningEnd + this.config.relockingDuration;

        let newPhase = this.recoveryPhase;
        if (this.recoveryAge < dampingEnd) {
            newPhase = 'dampening';
        } else if (this.recoveryAge < realigningEnd) {
            newPhase = 'realigning';
        } else if (this.recoveryAge < relockingEnd) {
            newPhase = 'relocking';
        } else {
            // Recovery complete
            newPhase = 'relocking'; // Stay in relocking phase
            this.targetRecoveryFactor = 1.0;
        }

        // Transition phase if changed
        if (newPhase !== this.recoveryPhase) {
            this.recoveryPhase = newPhase;
            this.phaseTransitionTime = 0.0;
        }

        // Emit re-lock wave once at recovery start
        if (!this.reLockWaveEmitted && this.recoveryAge >= this.config.reLockWaveEmitDelay) {
            this.reLockWaveEmitted = true;
            this.hasEmittedReLockWave = true;
            this.reLockWaveTime = 0.0;
        }

        // Update re-lock wave if active
        if (this.reLockWaveEmitted) {
            this.reLockWaveTime += deltaTime;
        }

        // Update phase variance recovery
        this.updatePhaseVarianceRecovery(harmony, instability, deltaTime);

        // Update sync strength recovery
        this.updateSyncStrengthRecovery(harmony, synergy, instability, deltaTime);
    }

    /**
     * Reduce phase variance gradually
     */
    updatePhaseVarianceRecovery(harmony, instability, deltaTime) {
        // Calculate recovery rate modulated by harmony and instability
        const baseRate = this.config.varianceRecoveryRate;
        const harmonyBoost = harmony * 0.4;
        const instabilityPenalty = instability * this.config.varianceRecoveryInstabilityLag;
        const effectiveRate = (baseRate + harmonyBoost - instabilityPenalty) * deltaTime;

        // Smooth phase variance toward zero
        const collapseVariance = this.collapseController?.phaseVariance ?? 0.0;
        this.recoveredPhaseVariance = Math.max(0, collapseVariance - effectiveRate);
    }

    /**
     * Restore harmonic synchronization strength
     */
    updateSyncStrengthRecovery(harmony, synergy, instability, deltaTime) {
        // Calculate recovery rate modulated by harmony and synergy
        const baseRate = this.config.syncRecoveryRate;
        const harmonyBoost = harmony * this.config.syncRecoveryHarmonyBoost;
        const synergyBoost = synergy * this.config.syncRecoverySynergyBoost;
        const instabilityPenalty = instability * 0.2;
        const effectiveRate = (baseRate + harmonyBoost + synergyBoost - instabilityPenalty) * deltaTime;

        // Restore sync strength toward healthy levels
        const currentStrength = this.harmonicController?.hubStrength ?? 0.0;
        const targetStrength = Math.min(1.0, currentStrength + effectiveRate);
        this.recoveredSyncStrength = Math.max(0, Math.min(1.0, targetStrength));
    }

    /**
     * Get phase variance effect during recovery
     * Returns reduced variance when in recovery phase
     */
    getRecoveredPhaseVariance(currentVariance = 0.0) {
        if (!this.isInRecovery()) {
            return currentVariance;
        }

        // During dampening phase, variance drops exponentially
        const phaseProgress = Math.min(1.0, this.phaseTransitionTime / this.config.dampingDuration);
        const varianceDamping = Math.exp(-3.0 * phaseProgress); // Exponential decay
        
        return currentVariance * varianceDamping * (1.0 - this.recoveryFactor);
    }

    /**
     * Get enhanced sync strength during recovery re-alignment
     */
    getRecoveredSyncStrength(baseStrength = 0.0) {
        if (!this.isInRecovery()) {
            return baseStrength;
        }

        // In realigning/relocking phases, sync strength is enhanced
        const recoveryPhaseProgress = (this.recoveryAge - this.config.dampingDuration) / 
                                     (this.config.realigningDuration + this.config.relockingDuration);
        const syncEnhancement = Math.max(0, Math.min(1.0, recoveryPhaseProgress)) * this.recoveryFactor;
        
        return baseStrength + syncEnhancement * (1.0 - baseStrength);
    }

    /**
     * Get re-lock wave parameters for visual effects
     */
    getReLockWaveEffect(linkIndex = 0, linkCount = 1) {
        if (!this.hasEmittedReLockWave || !this.reLockWaveEmitted) {
            return null;
        }

        // Check if wave is still active
        if (this.reLockWaveTime > this.config.reLockWaveDuration) {
            return null;
        }

        // Wave travels along link with sinusoidal amplitude
        const waveProgress = this.reLockWaveTime / this.config.reLockWaveDuration;
        const travelDistance = waveProgress * this.config.reLockWaveTravelDistance;
        
        // Sinusoidal wave with frequency
        const wavePhase = this.reLockWaveTime * this.config.reLockWaveFrequency * Math.PI * 2.0;
        const waveAmplitude = Math.sin(wavePhase) * this.config.reLockWaveIntensity;
        
        // Fade out as wave travels
        const fadeFactor = Math.max(0, 1.0 - waveProgress);
        
        return {
            isActive: true,
            travelDistance,
            amplitude: waveAmplitude * fadeFactor,
            intensity: this.config.reLockWaveIntensity * fadeFactor,
            phase: wavePhase,
            frequency: this.config.reLockWaveFrequency,
        };
    }

    /**
     * Get halo stabilization parameters
     */
    getHaloStabilization(haloPhase = 0.0, haloAmplitude = 0.0) {
        if (!this.isInRecovery()) {
            return { phase: haloPhase, amplitude: haloAmplitude };
        }

        // Halo oscillation frequency slows and amplitude reduces
        const stabilizationProgress = Math.min(1.0, this.recoveryAge / (this.config.relockingDuration * 2.0));
        
        // Reduce oscillation frequency
        const frequencyReduction = 1.0 - stabilizationProgress * 0.6;
        
        // Reduce amplitude
        const amplitudeReduction = 1.0 - stabilizationProgress * 0.8;
        
        return {
            phase: haloPhase * frequencyReduction,
            amplitude: haloAmplitude * amplitudeReduction,
            stabilizationProgress,
            isStabilizing: true,
        };
    }

    /**
     * Get braided strand jitter decay
     */
    getBraidedStrandRecovery(jitterAmplitude = 0.0) {
        if (!this.isInRecovery()) {
            return jitterAmplitude;
        }

        // During dampening phase, jitter decays exponentially
        const phaseProgress = Math.min(1.0, this.phaseTransitionTime / this.config.dampingDuration);
        const jitterDamping = Math.exp(-4.0 * phaseProgress);
        
        return jitterAmplitude * jitterDamping * (1.0 - this.recoveryFactor);
    }

    /**
     * Get directional streak recovery
     */
    getDirectionalStreakRecovery(gapSize = 0.0, spacing = 1.0) {
        if (!this.isInRecovery()) {
            return { gapSize, spacing };
        }

        // Irregular gaps close and spacing normalizes
        const phaseProgress = Math.min(1.0, (this.phaseTransitionTime - this.config.dampingDuration) / 
                                          this.config.realigningDuration);
        const streakUniformity = phaseProgress * this.recoveryFactor;
        
        return {
            gapSize: Math.max(0, gapSize * (1.0 - streakUniformity)),
            spacing: spacing + (1.0 - spacing) * streakUniformity,
            uniformity: streakUniformity,
        };
    }

    /**
     * Get surface ripple healing effect
     */
    getSurfaceRippleRecovery(interferenceStrength = 0.0) {
        if (!this.isInRecovery()) {
            return interferenceStrength;
        }

        // Torn interference patterns heal
        const phaseProgress = Math.min(1.0, (this.phaseTransitionTime - this.config.dampingDuration - this.config.realigningDuration) / 
                                          this.config.relockingDuration);
        const healingFactor = phaseProgress * this.recoveryFactor;
        
        return interferenceStrength * (1.0 - healingFactor);
    }

    /**
     * Check if currently in recovery state
     */
    isInRecovery() {
        return this.recoveryFactor > 0.01 && this.recoveryPhase !== 'idle';
    }

    /**
     * Check if recovery is complete
     */
    isRecoveryComplete() {
        return this.recoveryFactor > this.config.recoveryCompletionThreshold &&
               this.recoveryAge > (this.config.dampingDuration + this.config.realigningDuration + this.config.relockingDuration);
    }

    /**
     * Get recovery state for debugging
     */
    getDebugInfo() {
        return {
            recoveryFactor: this.recoveryFactor,
            targetRecoveryFactor: this.targetRecoveryFactor,
            recoveryPhase: this.recoveryPhase,
            recoveryAge: this.recoveryAge,
            isInRecovery: this.isInRecovery(),
            isRecoveryComplete: this.isRecoveryComplete(),
            phaseVariance: this.recoveredPhaseVariance,
            syncStrength: this.recoveredSyncStrength,
            reLockWaveActive: this.hasEmittedReLockWave && this.reLockWaveTime < this.config.reLockWaveDuration,
            reLockWaveTime: this.reLockWaveTime,
        };
    }
}
