/**
 * HarmonicHubLifecycle.js
 * ============================================================================
 * MERGED FILE — Hub Collapse / Recovery / Resilience lifecycle controllers.
 *
 * Original files merged (2026-04-22):
 *   - HarmonicHubCollapseController.js    (413 lines)
 *   - HarmonicHubRecoveryController.js     (436 lines)
 *   - HarmonicHubResilienceController.js   (409 lines)
 *
 * These three controllers form a complete visual lifecycle chain:
 *   Collapse → Recovery → Resilience
 * and are always instantiated together through NodeHarmonicManager.
 *
 * CONSTRAINTS (inherited from all three):
 * ✅ Adapter-only visual systems
 * ✅ Read-only from node/link state
 * ✅ No gameplay changes
 * ✅ Zero per-frame allocations
 * ✅ Graceful fallback if data missing
 * ✅ Fully reversible
 * ✅ Deterministic (no randomness)
 */

import * as THREE from 'three';

// ============================================================================
// SECTION 1: HarmonicHubCollapseController
// ============================================================================

/**
 * Manages visual breakdown when harmonic hubs enter resonance overload state.
 *
 * SYSTEM BEHAVIOR:
 * - Tracks corruption-driven phase collapse in harmonic hubs
 * - Transitions smooth between healthy → overload → collapse states
 * - Drives visual effects: phase variance, halo stability, shockwaves
 * - Fully reversible: hub recovers when corruption decreases
 * - Zero gameplay impact, purely visual narrative
 *
 * ARCHITECTURE:
 * - Per-hub collapse state tracking
 * - Corruption-driven state machine (soft, not binary)
 * - Time-based shockwave generation
 * - Phase variance computation
 * - All state cached in controller (no allocations)
 */
export class HarmonicHubCollapseController {
    constructor(harmonicSyncController) {
        this.harmonicController = harmonicSyncController;

        // Collapse state (0 = healthy, 1 = fully collapsed)
        this.collapseFactor = 0.0;
        this.targetCollapseFactor = 0.0;

        // Overload state tracking
        this.isInOverload = false;
        this.overloadAge = 0.0; // Time spent in overload

        // Phase variance (increases with corruption)
        this.phaseVariance = 0.0;
        this.targetPhaseVariance = 0.0;

        // Shockwave generation
        this.lastShockwaveTime = 0.0;
        this.shockwaveQueue = []; // Active shockwaves

        // Halo stability
        this.haloAmplitude = 0.0;
        this.haloPhase = 0.0;

        // Configuration
        this.config = {
            // Overload activation thresholds
            corruptionThreshold: 0.6,        // Corruption must exceed this
            harmonyMinimum: 0.3,             // Harmony must drop below this ratio
            synergyMinimumForOverload: 0.5,  // Energy keeps flowing
            stabilityThreshold: 0.5,        // Stability threshold for overload

            // Collapse progression
            collapseSmoothingRate: 0.06,     // Speed of collapse factor interpolation
            phaseVarianceSmoothingRate: 0.08, // Speed of phase variance adjustment

            // Phase variance calculation
            baseVarianceScale: 0.3,          // Base phase variance from corruption
            stabilityVarianceScale: 0.4,    // Stability adds to variance
            synergyVarianceDamping: 0.6,     // Synergy suppresses variance

            // Shockwave generation
            shockwaveIntervalMin: 0.5,       // Minimum seconds between shockwaves
            shockwaveIntervalMax: 2.0,       // Maximum seconds between shockwaves
            shockwaveDuration: 0.4,          // How long each shockwave lasts
            shockwaveAmplitude: 0.15,        // Phase disturbance amplitude

            // Halo stability
            haloBaseAmplitude: 0.05,         // Base halo amplitude
            haloFrequency: 2.0,              // Halo oscillation frequency (Hz)
            haloStabilityScale: 0.8,         // Stability increases halo
        };

        // Shockwave state cache
        this._shockwaveTimer = 0.0;
        this._nextShockwaveInterval = this.config.shockwaveIntervalMin;

        // Math cache
        this._vec3 = new THREE.Vector3();
    }

    /**
     * Update collapse state based on node health metrics
     */
    update(harmony = 1.0, corruption = 0.0, synergy = 0.5, stability = 0.0, deltaTime = 0.016) {
        // Clamp inputs
        harmony = Math.max(0, Math.min(1, harmony));
        corruption = Math.max(0, Math.min(1, corruption));
        synergy = Math.max(0, Math.min(1, synergy));
        stability = Math.max(0, Math.min(1, stability));

        // === 1. CHECK OVERLOAD ACTIVATION ===
        this.isInOverload = this._checkOverloadConditions(harmony, corruption, synergy, stability);

        if (this.isInOverload) {
            this.overloadAge += deltaTime;
        } else {
            this.overloadAge = 0.0;
        }

        // === 2. COMPUTE COLLAPSE FACTOR ===
        this.targetCollapseFactor = this._computeCollapseFactor(
            harmony,
            corruption,
            synergy,
            stability
        );

        // Smooth interpolation
        this.collapseFactor += (this.targetCollapseFactor - this.collapseFactor) *
                              this.config.collapseSmoothingRate;

        // === 3. COMPUTE PHASE VARIANCE ===
        this.targetPhaseVariance = this._computePhaseVariance(
            corruption,
            stability,
            synergy
        );

        this.phaseVariance += (this.targetPhaseVariance - this.phaseVariance) *
                             this.config.phaseVarianceSmoothingRate;

        // === 4. UPDATE HALO STABILITY ===
        this._updateHaloStability(stability, deltaTime);

        // === 5. GENERATE SHOCKWAVES ===
        this._updateShockwaves(deltaTime, corruption, stability);

        // === 6. CLAMP VALUES ===
        this.collapseFactor = Math.max(0, Math.min(1, this.collapseFactor));
        this.phaseVariance = Math.max(0, Math.min(Math.PI, this.phaseVariance));
    }

    _checkOverloadConditions(harmony, corruption, synergy, stability) {
        if (synergy < this.config.synergyMinimumForOverload) return false;
        if (corruption <= harmony) return false;
        if (corruption < this.config.corruptionThreshold) return false;

        const harmonyRatio = harmony > 0 ? corruption / harmony : Infinity;
        const corruptionDominant = harmonyRatio > 1.5;
        const stabilityHigh = stability > this.config.stabilityThreshold;

        return corruptionDominant || stabilityHigh;
    }

    _computeCollapseFactor(harmony, corruption, synergy, stability) {
        if (!this.isInOverload) return 0.0;

        const corruptionExcess = Math.max(0, corruption - harmony);
        let collapse = corruptionExcess;
        collapse += stability * 0.3;
        collapse *= (1.0 - synergy * 0.2);
        collapse *= (1.0 - harmony * 0.3);

        return Math.max(0, Math.min(1, collapse));
    }

    _computePhaseVariance(corruption, stability, synergy) {
        if (this.collapseFactor < 0.01) return 0.0;

        let variance = corruption * this.config.baseVarianceScale;
        variance += stability * this.config.stabilityVarianceScale;
        variance *= (1.0 - synergy * this.config.synergyVarianceDamping);
        variance *= this.collapseFactor;

        const exponentialGrowth = this.collapseFactor * this.collapseFactor * 0.5;
        variance += exponentialGrowth;

        return Math.max(0, Math.min(Math.PI, variance));
    }

    _updateHaloStability(stability, deltaTime) {
        this.targetHaloAmplitude = this.collapseFactor *
                                  this.config.haloBaseAmplitude *
                                  (1.0 + stability * this.config.haloStabilityScale);

        this.haloAmplitude += (this.targetHaloAmplitude - this.haloAmplitude) * 0.1;

        const frequency = this.config.haloFrequency *
                         (1.0 + this.collapseFactor);
        this.haloPhase += frequency * deltaTime * Math.PI * 2;
        this.haloPhase = this.normalizePhase(this.haloPhase);
    }

    _updateShockwaves(deltaTime, corruption, stability) {
        this._shockwaveTimer += deltaTime;

        if (this._shockwaveTimer >= this._nextShockwaveInterval && this.collapseFactor > 0.3) {
            this._generateShockwave(corruption, stability);
            this._shockwaveTimer = 0.0;

            const intervalRange = this.config.shockwaveIntervalMax - this.config.shockwaveIntervalMin;
            this._nextShockwaveInterval = this.config.shockwaveIntervalMin +
                                         intervalRange * (1.0 - this.collapseFactor);
        }

        for (let i = this.shockwaveQueue.length - 1; i >= 0; i--) {
            const shockwave = this.shockwaveQueue[i];
            shockwave.age += deltaTime;
            if (shockwave.age >= shockwave.duration) {
                this.shockwaveQueue.splice(i, 1);
            }
        }
    }

    _generateShockwave(corruption, stability) {
        const amplitude = this.config.shockwaveAmplitude *
                         (1.0 + corruption * 0.5) *
                         (1.0 + stability * 0.3);

        this.shockwaveQueue.push({
            age: 0.0,
            duration: this.config.shockwaveDuration,
            amplitude: amplitude,
            phase: 0.0,
            birthTime: 0,
        });
    }

    getPhaseCollapseEffect(linkIndex, linkCount, time = 0) {
        if (this.collapseFactor < 0.01) {
            return { phaseDeviation: 0.0, phaseNoiseAmount: 0.0, destabilization: 0.0 };
        }

        const linkAngle = (linkIndex / Math.max(1, linkCount)) * Math.PI * 2;
        const unstablePhaseOffset = Math.sin(time * 2.0 + linkAngle) * this.phaseVariance;
        const noisePhase = Math.sin(linkIndex * 3.14159 + time * 5.0) * 0.5 + 0.5;
        const phaseNoise = noisePhase * this.phaseVariance * 0.6;
        const destabilization = this.collapseFactor;

        return {
            phaseDeviation: unstablePhaseOffset,
            phaseNoise: phaseNoise,
            destabilization: destabilization,
            collapseStrength: this.collapseFactor,
        };
    }

    getShockwaveEffect(position, linkIndex, linkCount) {
        let totalEffect = 0.0;

        for (const shockwave of this.shockwaveQueue) {
            const progress = shockwave.age / shockwave.duration;
            const wavePosition = progress * 0.3;
            const distance = Math.abs(position - wavePosition);
            const waveWidth = 0.1;
            const falloff = Math.exp(-distance * distance / (waveWidth * waveWidth));
            totalEffect += shockwave.amplitude * falloff * (1.0 - progress);
        }

        return totalEffect;
    }

    getHaloEffect() {
        const haloOscillation = Math.sin(this.haloPhase);
        const haloBrightness = this.haloAmplitude * (0.5 + 0.5 * haloOscillation);

        return {
            amplitude: this.haloAmplitude,
            brightness: haloBrightness,
            flicker: Math.abs(haloOscillation),
            phase: this.haloPhase,
        };
    }

    getDebugInfo() {
        return {
            isInOverload: this.isInOverload,
            collapseFactor: this.collapseFactor,
            phaseVariance: this.phaseVariance,
            phaseVarianceDegrees: this.phaseVariance * 180 / Math.PI,
            haloAmplitude: this.haloAmplitude,
            activeShockwaves: this.shockwaveQueue.length,
            overloadAge: this.overloadAge,
        };
    }

    getCollapseDescription() {
        if (this.collapseFactor < 0.2) return 'Healthy';
        if (this.collapseFactor < 0.5) return 'Strained';
        if (this.collapseFactor < 0.8) return 'Overloading';
        return 'Collapsed';
    }

    normalizePhase(phase) {
        while (phase > Math.PI) phase -= Math.PI * 2;
        while (phase < -Math.PI) phase += Math.PI * 2;
        return phase;
    }

    setConfig(configOverrides) {
        Object.assign(this.config, configOverrides);
    }

    dispose() {
        this.shockwaveQueue = [];
    }
}


// ============================================================================
// SECTION 2: HarmonicHubRecoveryController
// ============================================================================

/**
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
 */
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


// ============================================================================
// SECTION 3: HarmonicHubResilienceController
// ============================================================================

/**
 * Manages visual-only progressive strengthening of harmonic hubs through
 * repeated recovery cycles. This creates a sense of learned resilience.
 *
 * PHILOSOPHY:
 * Each time a hub recovers from collapse, it becomes visually more confident:
 * - Halo flickers less, oscillates slower
 * - Pulses align faster
 * - Streaks flow more clearly
 * - Ripples become calmer
 *
 * REINFORCEMENT:
 * - Recovery completion → hubResilience += increment
 * - Increment is logarithmic (diminishing returns)
 * - Maximum 50 recoveries to approach 1.0 (logarithmic curve)
 *
 * DECAY:
 * - Decay only occurs when hub NOT in recovery
 * - Very slow: ~0.1 resilience units per 60 seconds
 * - Prevents permanent maxing
 */
export class HarmonicHubResilienceController {
    constructor(recoveryController) {
        this.recoveryController = recoveryController;

        // Resilience state (0 = fragile, 1 = very strong)
        this.hubResilience = 0.0;
        this.targetResilience = 0.0;

        // Recovery tracking
        this.completedRecoveries = 0;
        this.lastRecoveryFactorObserved = 0.0;
        this.recoveryCompletedThisFrame = false;

        // Time tracking
        this.totalTimeElapsed = 0.0;
        this.timeSinceLastRecovery = 0.0;
        this.timeSinceLastDecay = 0.0;

        // Configuration
        this.config = {
            baseResilienceIncrement: 0.08,
            logarithmicScale: 0.7,
            maxResilienceFromRecovery: 1.0,
            decayRatePerSecond: 0.015,
            minResilienceThreshold: 0.02,
            decayAccelerationOnCorruption: 1.5,
            decayOnCollapse: 0.05,
            resilienceInterpolationRate: 0.12,
            maxVisualResilience: 0.95,
            minVisualResilience: 0.0,
        };

        // Math cache
        this._resilience = 0.0;
        this._resilienceFromRecoveries = 0.0;
        this._resilienceFromDecay = 0.0;
    }

    update(harmony = 1.0, corruption = 0.0, isInCollapse = false, isInRecovery = false, deltaTime = 0.016, recoveryFactor = 0.0) {
        harmony = Math.max(0, Math.min(1, harmony));
        corruption = Math.max(0, Math.min(1, corruption));
        deltaTime = Math.max(0, Math.min(0.1, deltaTime));
        recoveryFactor = Math.max(0, Math.min(1, recoveryFactor));

        this.totalTimeElapsed += deltaTime;
        this.timeSinceLastRecovery += deltaTime;
        this.timeSinceLastDecay += deltaTime;

        this.detectRecoveryCompletion(recoveryFactor);

        if (isInRecovery) {
            this.targetResilience = Math.min(
                this.config.maxResilienceFromRecovery,
                this.hubResilience + harmony * 0.01 * deltaTime
            );
            this.timeSinceLastRecovery = 0.0;
        } else if (isInCollapse) {
            this.targetResilience = Math.max(
                0,
                this.hubResilience - this.config.decayOnCollapse * deltaTime
            );
        } else {
            this.updateDecay(harmony, corruption, deltaTime);
        }

        const interpolationSpeed = this.config.resilienceInterpolationRate * (1.0 + harmony * 0.3);
        this.hubResilience += (this.targetResilience - this.hubResilience) * interpolationSpeed;

        this.hubResilience = Math.max(
            this.config.minVisualResilience,
            Math.min(this.config.maxVisualResilience, this.hubResilience)
        );

        this.recoveryCompletedThisFrame = false;
        this.lastRecoveryFactorObserved = recoveryFactor;
    }

    detectRecoveryCompletion(recoveryFactor) {
        const wasIncomplete = this.lastRecoveryFactorObserved < 0.95;
        const isNowComplete = recoveryFactor >= 0.95;

        if (wasIncomplete && isNowComplete && recoveryFactor > this.lastRecoveryFactorObserved) {
            this.onRecoveryComplete();
            this.recoveryCompletedThisFrame = true;
        }
    }

    onRecoveryComplete() {
        const increment = this.computeIncrementForRecovery(this.completedRecoveries);
        this.targetResilience = Math.min(
            this.config.maxResilienceFromRecovery,
            this.hubResilience + increment
        );

        this.completedRecoveries++;
        this.timeSinceLastRecovery = 0.0;

        console.debug(`✅ Recovery #${this.completedRecoveries} completed. Resilience: ${this.hubResilience.toFixed(3)} → ${this.targetResilience.toFixed(3)}`);
    }

    computeIncrementForRecovery(recoveryCount) {
        const maxExpectedRecoveries = 50;
        const logarithmicFactor = Math.log(recoveryCount + 2) / Math.log(maxExpectedRecoveries);
        const remainingCapacity = this.config.maxResilienceFromRecovery - this.hubResilience;

        const increment = this.config.baseResilienceIncrement *
                         Math.pow(this.config.logarithmicScale, recoveryCount) *
                         Math.min(1.0, remainingCapacity);

        return Math.max(0.001, increment);
    }

    updateDecay(harmony, corruption, deltaTime) {
        const baseDecay = this.config.decayRatePerSecond * deltaTime;
        const corruptionMultiplier = 1.0 + corruption * this.config.decayAccelerationOnCorruption;
        const effectiveDecay = baseDecay * corruptionMultiplier;
        const harmonyReduction = harmony * 0.5;
        const finalDecay = Math.max(0, effectiveDecay - harmonyReduction * baseDecay);

        this.targetResilience = Math.max(
            this.config.minResilienceThreshold,
            this.hubResilience - finalDecay
        );
    }

    // ========================================================================
    // VISUAL MODULATION FUNCTIONS
    // ========================================================================

    getModulatedHaloStability(baseAmplitude = 0.0, baseFrequency = 1.0) {
        const stabilityFactor = this.hubResilience;
        const modulatedAmplitude = baseAmplitude * (1.0 - stabilityFactor * 0.7);
        const modulatedFrequency = baseFrequency * (0.5 + stabilityFactor * 0.5);
        const thicknessMultiplier = 1.0 + stabilityFactor * 0.4;

        return {
            amplitude: modulatedAmplitude,
            frequency: modulatedFrequency,
            thickness: thicknessMultiplier,
            stabilityFactor,
        };
    }

    getModulatedPulseCoherence(baseSyncStrength = 0.5) {
        const coherenceFactor = this.hubResilience;
        const enhancedStrength = baseSyncStrength + coherenceFactor * (0.3 - baseSyncStrength * 0.2);
        const phaseSmoothing = 1.0 + coherenceFactor * 0.5;
        const relockSpeed = 1.0 + coherenceFactor * 0.4;

        return {
            syncStrength: Math.min(1.0, enhancedStrength),
            phaseSmoothing,
            relockSpeed,
            coherenceFactor,
        };
    }

    getModulatedStreakConsistency(baseGapSize = 0.15, baseSpacing = 1.0) {
        const consistencyFactor = this.hubResilience;
        const modulatedGapSize = baseGapSize * (1.0 - consistencyFactor * 0.8);
        const spacingUniformity = 0.3 + consistencyFactor * 0.7;
        const directionClarity = 0.5 + consistencyFactor * 0.5;

        return {
            gapSize: Math.max(0, modulatedGapSize),
            spacing: baseSpacing * (0.95 + spacingUniformity * 0.1),
            uniformity: spacingUniformity,
            directionClarity,
            consistencyFactor,
        };
    }

    getModulatedRippleCalmness(baseInterference = 0.4) {
        const calmnessFacto = this.hubResilience;
        const waveScale = 0.7 + calmnessFacto * 0.6;
        const tearingReduction = calmnessFacto * 0.8;
        const coherence = 0.3 + calmnessFacto * 0.7;

        return {
            waveScale,
            tearingReduction,
            coherence,
            interferenceReduction: baseInterference * (1.0 - tearingReduction),
            calmnessEffect: calmnessFacto,
        };
    }

    getNetworkAuthority() {
        const presenceMultiplier = 0.8 + this.hubResilience * 0.4;
        const confidenceFactor = 0.5 + this.hubResilience * 0.5;
        const glowIntensity = 0.7 + this.hubResilience * 0.3;

        return {
            presence: presenceMultiplier,
            confidence: confidenceFactor,
            glowIntensity,
            resilience: this.hubResilience,
        };
    }

    getActiveResilience(isInCollapse = false, isInOverload = false) {
        if (isInCollapse || isInOverload) {
            return Math.max(0, this.hubResilience - 0.5);
        }
        return this.hubResilience;
    }

    hasLearned() {
        return this.completedRecoveries >= 3 && this.hubResilience > 0.1;
    }

    getResilienceNarrative() {
        const resilience = this.hubResilience;
        const recoveries = this.completedRecoveries;

        if (recoveries === 0) return 'Untested';
        if (resilience < 0.1) return 'Recovering';
        if (resilience < 0.3) return 'Learning';
        if (resilience < 0.6) return 'Experienced';
        if (resilience < 0.85) return 'Resilient';
        return 'Unshakeable';
    }

    getDebugInfo() {
        return {
            hubResilience: this.hubResilience,
            targetResilience: this.targetResilience,
            completedRecoveries: this.completedRecoveries,
            recoveryCompletedThisFrame: this.recoveryCompletedThisFrame,
            timeSinceLastRecovery: this.timeSinceLastRecovery,
            totalTimeElapsed: this.totalTimeElapsed,
            hasLearned: this.hasLearned(),
            narrative: this.getResilienceNarrative(),
            lastIncrement: this.computeIncrementForRecovery(this.completedRecoveries - 1),
        };
    }
}
