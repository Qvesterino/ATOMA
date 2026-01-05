/**
 * HarmonicHubResilienceController
 * ============================================================================
 * Manages visual-only progressive strengthening of harmonic hubs through
 * repeated recovery cycles. This creates a sense of learned resilience.
 * 
 * SYSTEM BEHAVIOR:
 * - Tracks successful recoveries (purely visual counter)
 * - Increases visual resilience after each recovery completion
 * - Resilience decays slowly over long time (never permanent)
 * - Modulates visual systems: halo stability, pulse coherence, streak flow
 * - NO gameplay impact, NO data mutations, NO allocations
 * 
 * PHILOSOPHY:
 * Each time a hub recovers from collapse, it becomes visually more confident:
 * - Halo flickers less, oscillates slower
 * - Pulses align faster
 * - Streaks flow more clearly
 * - Ripples become calmer
 * 
 * This creates narrative resonance: "This network remembers how to heal itself."
 * 
 * ARCHITECTURE:
 * - Per-hub resilience state tracking
 * - Recovery completion detection
 * - Time-based decay (very slow)
 * - Logarithmic reinforcement (diminishing returns)
 * - Visual modulator functions (zero allocation)
 * 
 * CONSTRAINTS:
 * ✅ Adapter-only visual system
 * ✅ Read-only from node/link state
 * ✅ No gameplay changes
 * ✅ Zero per-frame allocations
 * ✅ No data mutations
 * ✅ Deterministic (no randomness)
 * ✅ Graceful fallback if recovery missing
 * ✅ Reversible (all effects conditional)
 * 
 * REINFORCEMENT:
 * - Recovery completion → hubResilience += increment
 * - Increment is logarithmic (diminishing returns)
 * - Maximum 50 recoveries to approach 1.0 (logarithmic curve)
 * - Each recovery has smaller effect than previous
 * 
 * DECAY:
 * - Decay only occurs when hub NOT in recovery
 * - Very slow: ~0.1 resilience units per 60 seconds
 * - Prevents permanent maxing
 * - Gives network "living memory" feel
 * 
 * MODULATION:
 * - Resilience modulates (not replaces) existing visual values
 * - Always multiplicative or additive (safe, reversible)
 * - Never hard-locks visual state
 * - Stack safely with collapse/recovery effects
 */

import * as THREE from 'three';

export class HarmonicHubResilienceController {
    constructor(recoveryController) {
        this.recoveryController = recoveryController;
        
        // Resilience state (0 = fragile, 1 = very strong)
        this.hubResilience = 0.0;
        this.targetResilience = 0.0;
        
        // Recovery tracking
        this.completedRecoveries = 0;  // Total count (for visual narration)
        this.lastRecoveryFactorObserved = 0.0;  // Previous recovery factor
        this.recoveryCompletedThisFrame = false;
        
        // Time tracking
        this.totalTimeElapsed = 0.0;  // Total lifetime (for decay)
        this.timeSinceLastRecovery = 0.0;  // For decay rate calculation
        this.timeSinceLastDecay = 0.0;
        
        // Configuration
        this.config = {
            // Reinforcement (after recovery completion)
            baseResilienceIncrement: 0.08,      // Base increment per recovery
            logarithmicScale: 0.7,              // How aggressively diminishing returns
            maxResilienceFromRecovery: 1.0,     // Cap for recovery-driven resilience
            
            // Decay (when not in recovery)
            decayRatePerSecond: 0.015,          // How fast resilience fades (per second)
            minResilienceThreshold: 0.02,       // Don't decay below this
            decayAccelerationOnCorruption: 1.5, // Faster decay under stress
            
            // Resilience interaction
            decayOnCollapse: 0.05,              // Loss when entering collapse (temporary)
            
            // Smoothing
            resilienceInterpolationRate: 0.12,  // How fast resilience changes
            
            // Visual bounds
            maxVisualResilience: 0.95,          // Never max out completely
            minVisualResilience: 0.0,           // But can go to zero
        };
        
        // Math cache
        this._resilience = 0.0;
        this._resilienceFromRecoveries = 0.0;
        this._resilienceFromDecay = 0.0;
    }

    /**
     * Update resilience state each frame
     * Call after recovery controller update
     */
    update(harmony = 1.0, corruption = 0.0, isInCollapse = false, isInRecovery = false, deltaTime = 0.016, recoveryFactor = 0.0) {
        // Clamp inputs
        harmony = Math.max(0, Math.min(1, harmony));
        corruption = Math.max(0, Math.min(1, corruption));
        deltaTime = Math.max(0, Math.min(0.1, deltaTime));
        recoveryFactor = Math.max(0, Math.min(1, recoveryFactor));

        // Track total time
        this.totalTimeElapsed += deltaTime;
        this.timeSinceLastRecovery += deltaTime;
        this.timeSinceLastDecay += deltaTime;

        // Detect recovery completion (recovery transitioned from incomplete → complete)
        this.detectRecoveryCompletion(recoveryFactor);

        // Update resilience based on conditions
        if (isInRecovery) {
            // During recovery, maintain or slightly increase resilience
            this.targetResilience = Math.min(
                this.config.maxResilienceFromRecovery,
                this.hubResilience + harmony * 0.01 * deltaTime
            );
            this.timeSinceLastRecovery = 0.0; // Reset decay timer
        } else if (isInCollapse) {
            // During collapse, temporary resilience loss
            this.targetResilience = Math.max(
                0,
                this.hubResilience - this.config.decayOnCollapse * deltaTime
            );
        } else {
            // Normal state: apply slow decay
            this.updateDecay(harmony, corruption, deltaTime);
        }

        // Smooth interpolate toward target
        const interpolationSpeed = this.config.resilienceInterpolationRate * (1.0 + harmony * 0.3);
        this.hubResilience += (this.targetResilience - this.hubResilience) * interpolationSpeed;

        // Clamp to safe bounds
        this.hubResilience = Math.max(
            this.config.minVisualResilience,
            Math.min(this.config.maxVisualResilience, this.hubResilience)
        );

        this.recoveryCompletedThisFrame = false;
        this.lastRecoveryFactorObserved = recoveryFactor;
    }

    /**
     * Detect when recovery completes (goes from partial to full)
     */
    detectRecoveryCompletion(recoveryFactor) {
        // Recovery completion = recoveryFactor goes from < 0.95 to >= 0.95
        const wasIncomplete = this.lastRecoveryFactorObserved < 0.95;
        const isNowComplete = recoveryFactor >= 0.95;

        if (wasIncomplete && isNowComplete && recoveryFactor > this.lastRecoveryFactorObserved) {
            this.onRecoveryComplete();
            this.recoveryCompletedThisFrame = true;
        }
    }

    /**
     * Called when a recovery completes successfully
     */
    onRecoveryComplete() {
        // Increment with logarithmic diminishing returns
        const increment = this.computeIncrementForRecovery(this.completedRecoveries);
        this.targetResilience = Math.min(
            this.config.maxResilienceFromRecovery,
            this.hubResilience + increment
        );

        this.completedRecoveries++;
        this.timeSinceLastRecovery = 0.0;

        console.debug(`✅ Recovery #${this.completedRecoveries} completed. Resilience: ${this.hubResilience.toFixed(3)} → ${this.targetResilience.toFixed(3)}`);
    }

    /**
     * Compute increment with logarithmic diminishing returns
     * First recovery: big gain
     * Later recoveries: smaller gains
     * Asymptotically approaches max
     */
    computeIncrementForRecovery(recoveryCount) {
        // Logarithmic curve: log(n+2) / log(maxCount)
        // This gives diminishing but never-zero increments
        const maxExpectedRecoveries = 50;
        const logarithmicFactor = Math.log(recoveryCount + 2) / Math.log(maxExpectedRecoveries);
        const remainingCapacity = this.config.maxResilienceFromRecovery - this.hubResilience;

        // Increment = base * logarithmic decay * remaining capacity
        const increment = this.config.baseResilienceIncrement *
                         Math.pow(this.config.logarithmicScale, recoveryCount) *
                         Math.min(1.0, remainingCapacity);

        return Math.max(0.001, increment); // Never zero (always some gain)
    }

    /**
     * Update resilience decay over time
     */
    updateDecay(harmony, corruption, deltaTime) {
        // Decay is slow and only happens when NOT in active recovery
        const baseDecay = this.config.decayRatePerSecond * deltaTime;

        // Corruption accelerates decay (hubs under stress lose resilience faster)
        const corruptionMultiplier = 1.0 + corruption * this.config.decayAccelerationOnCorruption;
        const effectiveDecay = baseDecay * corruptionMultiplier;

        // Harmony slows decay (healthy hubs maintain resilience better)
        const harmonyReduction = harmony * 0.5;
        const finalDecay = Math.max(0, effectiveDecay - harmonyReduction * baseDecay);

        // Apply decay
        this.targetResilience = Math.max(
            this.config.minResilienceThreshold,
            this.hubResilience - finalDecay
        );
    }

    // ========================================================================
    // VISUAL MODULATION FUNCTIONS (Applied to visual subsystems)
    // ========================================================================

    /**
     * Get modulated halo stability
     * High resilience → less flicker, slower, thicker
     */
    getModulatedHaloStability(baseAmplitude = 0.0, baseFrequency = 1.0) {
        const stabilityFactor = this.hubResilience;

        // Amplitude reduces with resilience (less flicker)
        const modulatedAmplitude = baseAmplitude * (1.0 - stabilityFactor * 0.7);

        // Frequency slows with resilience (more confident)
        const modulatedFrequency = baseFrequency * (0.5 + stabilityFactor * 0.5);

        // Thickness increases with resilience (stronger presence)
        const thicknessMultiplier = 1.0 + stabilityFactor * 0.4;

        return {
            amplitude: modulatedAmplitude,
            frequency: modulatedFrequency,
            thickness: thicknessMultiplier,
            stabilityFactor,
        };
    }

    /**
     * Get modulated pulse phase coherence
     * High resilience → faster alignment, smoother
     */
    getModulatedPulseCoherence(baseSyncStrength = 0.5) {
        const coherenceFactor = this.hubResilience;

        // Sync strength increases with resilience (better alignment)
        const enhancedStrength = baseSyncStrength + coherenceFactor * (0.3 - baseSyncStrength * 0.2);

        // Phase variance is reduced (smoother)
        const phaseSmoothing = 1.0 + coherenceFactor * 0.5;

        // Recovery re-lock is faster (more confident)
        const relockSpeed = 1.0 + coherenceFactor * 0.4;

        return {
            syncStrength: Math.min(1.0, enhancedStrength),
            phaseSmoothing,
            relockSpeed,
            coherenceFactor,
        };
    }

    /**
     * Get modulated directional streak consistency
     * High resilience → uniform spacing, less dropout
     */
    getModulatedStreakConsistency(baseGapSize = 0.15, baseSpacing = 1.0) {
        const consistencyFactor = this.hubResilience;

        // Gaps reduce with resilience (fewer dropouts)
        const modulatedGapSize = baseGapSize * (1.0 - consistencyFactor * 0.8);

        // Spacing becomes more uniform
        const spacingUniformity = 0.3 + consistencyFactor * 0.7; // 0.3-1.0 range

        // Flow direction clarity increases
        const directionClarity = 0.5 + consistencyFactor * 0.5;

        return {
            gapSize: Math.max(0, modulatedGapSize),
            spacing: baseSpacing * (0.95 + spacingUniformity * 0.1),
            uniformity: spacingUniformity,
            directionClarity,
            consistencyFactor,
        };
    }

    /**
     * Get modulated ripple calmness
     * High resilience → broader patterns, less tearing
     */
    getModulatedRippleCalmness(baseInterference = 0.4) {
        const calmnessFacto = this.hubResilience;

        // Interference patterns broaden (less tight/chaotic)
        const waveScale = 0.7 + calmnessFacto * 0.6; // 0.7-1.3 scale

        // Tearing reduces (less angular chaos)
        const tearingReduction = calmnessFacto * 0.8;

        // Coherence improves
        const coherence = 0.3 + calmnessFacto * 0.7;

        return {
            waveScale,
            tearingReduction,
            coherence,
            interferenceReduction: baseInterference * (1.0 - tearingReduction),
            calmnessEffect: calmnessFacto,
        };
    }

    /**
     * Get modulated overall network authority
     * High resilience → presence, confidence
     */
    getNetworkAuthority() {
        // Overall presence multiplier
        const presenceMultiplier = 0.8 + this.hubResilience * 0.4; // 0.8-1.2

        // Confidence factor (affects all visual subsystems subtly)
        const confidenceFactor = 0.5 + this.hubResilience * 0.5; // 0.5-1.0

        // Glow intensity (subtle emphasis)
        const glowIntensity = 0.7 + this.hubResilience * 0.3; // 0.7-1.0

        return {
            presence: presenceMultiplier,
            confidence: confidenceFactor,
            glowIntensity,
            resilience: this.hubResilience,
        };
    }

    /**
     * Get transient resilience suppression during collapse
     * Resilience becomes dormant while in collapse/overload
     */
    getActiveResilience(isInCollapse = false, isInOverload = false) {
        if (isInCollapse || isInOverload) {
            // During crisis, resilience suppressed but not lost
            return Math.max(0, this.hubResilience - 0.5); // Half dormant
        }
        return this.hubResilience;
    }

    /**
     * Check if hub has "learned" (has memory of recoveries)
     */
    hasLearned() {
        return this.completedRecoveries >= 3 && this.hubResilience > 0.1;
    }

    /**
     * Get resilience narrative (for optional HUD)
     */
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

    /**
     * Get debug info
     */
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
