/**
 * harmonic/HarmonicHubRecoveryController.js
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
 * RECOVERY DRIVERS:
 * - Harmony: Primary driver, controls recovery speed and re-lock force
 * - Synergy: Sustains energy flow during recovery (prevents stalling)
 * - Stability: Slows recovery and lags phase alignment
 * - Corruption: Must fall below harmony to allow recovery
 *
 * CONSTRAINTS:
 * ✅ Adapter-only visual system
 * ✅ Read-only from node/link state
 * ✅ No gameplay changes
 * ✅ Zero per-frame allocations
 * ✅ Graceful fallback if data missing
 * ✅ Fully reversible
 * ✅ Deterministic (no randomness)
 */

import * as THREE from 'three';

export class HarmonicHubRecoveryController {
    constructor(harmonicSyncController, collapseController) {
        this.harmonicController = harmonicSyncController;
        this.collapseController = collapseController;

        // Recovery state (0 = no recovery, 1 = fully recovered)
        this.recoveryFactor = 0.0;
        this.targetRecoveryFactor = 0.0;

        // Recovery phase tracking
        this.recoveryPhase = 'idle'; // 'idle', 'dampening', 'realigning', 'relocking'
        this.phaseTransitionTime = 0.0;

        // Re-lock wave state
        this.hasEmittedReLockWave = false;
        this.reLockWaveTime = 0.0;
        this.reLockWaveEmitted = false;

        // Recovery timing
        this.recoveryAge = 0.0;
        this.lastRecoveryConditionMet = false;

        // Phase variance recovery
        this.recoveredPhaseVariance = 0.0;
        this.recoveryVarianceSmoothingRate = 0.12;

        // Hub synchronization recovery
        this.recoveredSyncStrength = 0.0;
        this.recoverySyncSmoothingRate = 0.1;

        // Configuration
        this.config = {
            harmonyCorruptionThreshold: 0.15,
            dampingDuration: 1.5,
            realigningDuration: 2.0,
            relockingDuration: 1.5,
            varianceRecoveryRate: 0.14,
            varianceRecoveryStabilityLag: 0.04,
            syncRecoveryRate: 0.11,
            syncRecoveryHarmonyBoost: 0.3,
            syncRecoverySynergyBoost: 0.2,
            reLockWaveEmitDelay: 0.3,
            reLockWaveDuration: 0.6,
            reLockWaveIntensity: 0.7,
            reLockWaveFrequency: 8.0,
            reLockWaveTravelDistance: 0.3,
            haloStabilizationRate: 0.13,
            haloContractionRate: 0.1,
            recoveryCompletionThreshold: 0.95,
        };

        // Math cache
        this._vec3 = new THREE.Vector3();
        this._tempPhaseVariance = 0.0;
        this._tempSyncStrength = 0.0;
    }

    update(harmony = 1.0, corruption = 0.0, synergy = 0.5, stability = 0.0, deltaTime = 0.016, collapseFactor = 0.0) {
        harmony = Math.max(0, Math.min(1, harmony));
        corruption = Math.max(0, Math.min(1, corruption));
        synergy = Math.max(0, Math.min(1, synergy));
        stability = Math.max(0, Math.min(1, stability));
        deltaTime = Math.max(0, Math.min(0.1, deltaTime));
        collapseFactor = Math.max(0, Math.min(1, collapseFactor));

        const recoveryConditionMet = (harmony > corruption + this.config.harmonyCorruptionThreshold) && collapseFactor > 0;

        if (recoveryConditionMet && !this.lastRecoveryConditionMet) {
            this.onRecoveryEnter();
        } else if (!recoveryConditionMet && this.lastRecoveryConditionMet) {
            this.onRecoveryExit();
        }

        this.lastRecoveryConditionMet = recoveryConditionMet;

        if (recoveryConditionMet) {
            this.updateRecoveryProgression(harmony, corruption, synergy, stability, deltaTime, collapseFactor);
        } else {
            this.targetRecoveryFactor = 0.0;
            this.recoveryFactor = Math.max(0, this.recoveryFactor - deltaTime * 0.3);
            this.recoveryPhase = 'idle';
            this.reLockWaveEmitted = false;
        }
    }

    onRecoveryEnter() {
        this.recoveryAge = 0.0;
        this.targetRecoveryFactor = 1.0;
        this.recoveryPhase = 'dampening';
        this.phaseTransitionTime = 0.0;
        this.hasEmittedReLockWave = false;
        this.reLockWaveEmitted = false;
    }

    onRecoveryExit() {
        this.targetRecoveryFactor = 0.0;
        this.recoveryPhase = 'idle';
        this.reLockWaveEmitted = false;
    }

    updateRecoveryProgression(harmony, corruption, synergy, stability, deltaTime, collapseFactor) {
        const recoverySpeed = 0.08 * (1.0 + harmony * 0.5);
        this.recoveryFactor += (this.targetRecoveryFactor - this.recoveryFactor) * recoverySpeed;

        this.recoveryAge += deltaTime;
        this.phaseTransitionTime += deltaTime;

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
            newPhase = 'relocking';
            this.targetRecoveryFactor = 1.0;
        }

        if (newPhase !== this.recoveryPhase) {
            this.recoveryPhase = newPhase;
            this.phaseTransitionTime = 0.0;
        }

        if (!this.reLockWaveEmitted && this.recoveryAge >= this.config.reLockWaveEmitDelay) {
            this.reLockWaveEmitted = true;
            this.hasEmittedReLockWave = true;
            this.reLockWaveTime = 0.0;
        }

        if (this.reLockWaveEmitted) {
            this.reLockWaveTime += deltaTime;
        }

        this.updatePhaseVarianceRecovery(harmony, stability, deltaTime);
        this.updateSyncStrengthRecovery(harmony, synergy, stability, deltaTime);
    }

    updatePhaseVarianceRecovery(harmony, stability, deltaTime) {
        const baseRate = this.config.varianceRecoveryRate;
        const harmonyBoost = harmony * 0.4;
        const stabilityPenalty = stability * this.config.varianceRecoveryStabilityLag;
        const effectiveRate = (baseRate + harmonyBoost - stabilityPenalty) * deltaTime;

        const collapseVariance = this.collapseController?.phaseVariance ?? 0.0;
        this.recoveredPhaseVariance = Math.max(0, collapseVariance - effectiveRate);
    }

    updateSyncStrengthRecovery(harmony, synergy, stability, deltaTime) {
        const baseRate = this.config.syncRecoveryRate;
        const harmonyBoost = harmony * this.config.syncRecoveryHarmonyBoost;
        const synergyBoost = synergy * this.config.syncRecoverySynergyBoost;
        const stabilityPenalty = stability * 0.2;
        const effectiveRate = (baseRate + harmonyBoost + synergyBoost - stabilityPenalty) * deltaTime;

        const currentStrength = this.harmonicController?.hubStrength ?? 0.0;
        const targetStrength = Math.min(1.0, currentStrength + effectiveRate);
        this.recoveredSyncStrength = Math.max(0, Math.min(1.0, targetStrength));
    }

    getRecoveredPhaseVariance(currentVariance = 0.0) {
        if (!this.isInRecovery()) return currentVariance;

        const phaseProgress = Math.min(1.0, this.phaseTransitionTime / this.config.dampingDuration);
        const varianceDamping = Math.exp(-3.0 * phaseProgress);
        return currentVariance * varianceDamping * (1.0 - this.recoveryFactor);
    }

    getRecoveredSyncStrength(baseStrength = 0.0) {
        if (!this.isInRecovery()) return baseStrength;

        const recoveryPhaseProgress = (this.recoveryAge - this.config.dampingDuration) /
                                     (this.config.realigningDuration + this.config.relockingDuration);
        const syncEnhancement = Math.max(0, Math.min(1.0, recoveryPhaseProgress)) * this.recoveryFactor;
        return baseStrength + syncEnhancement * (1.0 - baseStrength);
    }

    getReLockWaveEffect(linkIndex = 0, linkCount = 1) {
        if (!this.hasEmittedReLockWave || !this.reLockWaveEmitted) return null;
        if (this.reLockWaveTime > this.config.reLockWaveDuration) return null;

        const waveProgress = this.reLockWaveTime / this.config.reLockWaveDuration;
        const travelDistance = waveProgress * this.config.reLockWaveTravelDistance;
        const wavePhase = this.reLockWaveTime * this.config.reLockWaveFrequency * Math.PI * 2.0;
        const waveAmplitude = Math.sin(wavePhase) * this.config.reLockWaveIntensity;
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

    getHaloStabilization(haloPhase = 0.0, haloAmplitude = 0.0) {
        if (!this.isInRecovery()) return { phase: haloPhase, amplitude: haloAmplitude };

        const stabilizationProgress = Math.min(1.0, this.recoveryAge / (this.config.relockingDuration * 2.0));
        const frequencyReduction = 1.0 - stabilizationProgress * 0.6;
        const amplitudeReduction = 1.0 - stabilizationProgress * 0.8;

        return {
            phase: haloPhase * frequencyReduction,
            amplitude: haloAmplitude * amplitudeReduction,
            stabilizationProgress,
            isStabilizing: true,
        };
    }

    getBraidedStrandRecovery(jitterAmplitude = 0.0) {
        if (!this.isInRecovery()) return jitterAmplitude;

        const phaseProgress = Math.min(1.0, this.phaseTransitionTime / this.config.dampingDuration);
        const jitterDamping = Math.exp(-4.0 * phaseProgress);
        return jitterAmplitude * jitterDamping * (1.0 - this.recoveryFactor);
    }

    getDirectionalStreakRecovery(gapSize = 0.0, spacing = 1.0) {
        if (!this.isInRecovery()) return { gapSize, spacing };

        const phaseProgress = Math.min(1.0, (this.phaseTransitionTime - this.config.dampingDuration) /
                                          this.config.realigningDuration);
        const streakUniformity = phaseProgress * this.recoveryFactor;

        return {
            gapSize: Math.max(0, gapSize * (1.0 - streakUniformity)),
            spacing: spacing + (1.0 - spacing) * streakUniformity,
            uniformity: streakUniformity,
        };
    }

    getSurfaceRippleRecovery(interferenceStrength = 0.0) {
        if (!this.isInRecovery()) return interferenceStrength;

        const phaseProgress = Math.min(1.0, (this.phaseTransitionTime - this.config.dampingDuration - this.config.realigningDuration) /
                                          this.config.relockingDuration);
        const healingFactor = phaseProgress * this.recoveryFactor;
        return interferenceStrength * (1.0 - healingFactor);
    }

    isInRecovery() {
        return this.recoveryFactor > 0.01 && this.recoveryPhase !== 'idle';
    }

    isRecoveryComplete() {
        return this.recoveryFactor > this.config.recoveryCompletionThreshold &&
               this.recoveryAge > (this.config.dampingDuration + this.config.realigningDuration + this.config.relockingDuration);
    }

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
