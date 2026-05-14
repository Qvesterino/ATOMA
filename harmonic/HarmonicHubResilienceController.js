/**
 * harmonic/HarmonicHubResilienceController.js
 * ============================================================================
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
