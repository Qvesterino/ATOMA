import * as THREE from 'three';

/**
 * LinkDecayTracker
 * ============================================================================
 * Tracks and visualizes link degradation from sustained corruption exposure.
 * 
 * PHILOSOPHY:
 * Links exposed to prolonged corruption accumulate decay over time.
 * This manifests as visual deterioration: cracks, discoloration, dimming,
 * increased opacity variations, and corrupted material appearance.
 * 
 * Decay is reversible: harmony and clean periods can gradually restore links.
 * 
 * MECHANICS:
 * - Corruption Rate: Accumulation speed based on corruption level
 * - Harmony Mitigation: Reduces decay rate and enables recovery
 * - Decay Stages: Visual effects intensify as decay progresses
 * - Recovery: High harmony over time can restore links
 * 
 * Visual only; no gameplay coupling.
 */
export class LinkDecayTracker {
    constructor() {
        // Cumulative decay state (0.0 = pristine, 1.0 = completely decayed)
        this.decayAmount = 0.0;
        
        // Configuration
        this.config = {
            // Accumulation rates
            corruptionAccumulationRate: 0.5,    // How fast corruption adds to decay (0.5 per unit corruption per second)
            harmonyMitigationRate: 0.3,         // How fast harmony reduces decay (0.3 per unit harmony per second)
            decayAccelerationThreshold: 0.5,    // Decay threshold where acceleration kicks in
            decayAccelerationFactor: 1.3,       // Multiplier for decay rate above threshold
            
            // Recovery parameters
            minHarmonyForRecovery: 0.6,         // Minimum harmony needed to enable recovery
            recoveryRateScale: 0.2,             // Base recovery speed multiplier
            
            // Visual effect intensification
            decayStages: [
                { threshold: 0.0, name: 'pristine', intensity: 0.0 },
                { threshold: 0.2, name: 'worn', intensity: 0.2 },
                { threshold: 0.4, name: 'degraded', intensity: 0.4 },
                { threshold: 0.6, name: 'corrupted', intensity: 0.6 },
                { threshold: 0.8, name: 'critical', intensity: 0.8 },
                { threshold: 1.0, name: 'destroyed', intensity: 1.0 },
            ],
        };
        
        // Decay tracking
        this.timeAtCurrentDecay = 0;
        this.previousDecay = 0;
        this.decayDirection = 0; // 1 = increasing, -1 = decreasing
        
        // Visual manifestation parameters
        this.crackPattern = Math.random(); // Unique per link, stable over time
        this.discolorationHue = 0;
        this.glitchIntensity = 0;
        
        // Math cache
        this._color = new THREE.Color();
    }

    /**
     * Update decay accumulation based on corruption and harmony
     * @param {number} corruptionLevel - Corruption score (0-1)
     * @param {number} harmonyLevel - Harmony score (0-1)
     * @param {number} deltaTime - Frame delta
     */
    update(corruptionLevel = 0.0, harmonyLevel = 1.0, deltaTime = 0.016) {
        // Clamp inputs
        corruptionLevel = Math.max(0, Math.min(1, corruptionLevel));
        harmonyLevel = Math.max(0, Math.min(1, harmonyLevel));

        // === CORRUPTION ACCUMULATION ===
        // Higher corruption increases decay rate
        let accumulationRate = corruptionLevel * this.config.corruptionAccumulationRate * deltaTime;
        
        // Decay accelerates as decay increases (feedback loop)
        if (this.decayAmount > this.config.decayAccelerationThreshold) {
            const accelerationFactor = this.config.decayAccelerationFactor;
            accumulationRate *= accelerationFactor;
        }

        // === HARMONY MITIGATION & RECOVERY ===
        // High harmony reduces decay rate
        let mitigationRate = harmonyLevel * this.config.harmonyMitigationRate * deltaTime;
        
        // If harmony is high enough, enable active recovery
        let recoveryRate = 0;
        if (harmonyLevel > this.config.minHarmonyForRecovery) {
            const harmonyExcess = harmonyLevel - this.config.minHarmonyForRecovery;
            recoveryRate = harmonyExcess * this.config.recoveryRateScale * deltaTime;
        }

        // === APPLY DECAY CHANGES ===
        this.previousDecay = this.decayAmount;
        
        // Decay = accumulation - mitigation - recovery
        const netChange = accumulationRate - mitigationRate - recoveryRate;
        this.decayAmount += netChange;
        
        // Clamp to safe range
        this.decayAmount = Math.max(0, Math.min(1.0, this.decayAmount));

        // Track direction for animation effects
        if (this.decayAmount > this.previousDecay) {
            this.decayDirection = 1; // Decaying
        } else if (this.decayAmount < this.previousDecay) {
            this.decayDirection = -1; // Recovering
        } else {
            this.decayDirection = 0; // Stable
        }

        // Update visual manifestation parameters
        this.updateVisualManifestations(corruptionLevel, harmonyLevel);
    }

    /**
     * Update visual manifestation parameters
     */
    updateVisualManifestations(corruptionLevel, harmonyLevel) {
        // Discoloration hue shift intensifies with decay
        // Shifts toward red/orange as corruption increases
        const baseHueShift = this.decayAmount * 0.15; // Up to 0.15 hue shift (red toward yellow)
        this.discolorationHue = baseHueShift + (corruptionLevel * 0.1);

        // Glitch intensity increases with decay AND corruption volatility
        const decayGlitch = this.decayAmount * 0.4;
        const corruptionGlitch = corruptionLevel * 0.3;
        this.glitchIntensity = Math.min(1.0, decayGlitch + corruptionGlitch);
    }

    /**
     * Get current decay stage
     */
    getCurrentStage() {
        for (let i = this.config.decayStages.length - 1; i >= 0; i--) {
            if (this.decayAmount >= this.config.decayStages[i].threshold) {
                return this.config.decayStages[i];
            }
        }
        return this.config.decayStages[0];
    }

    /**
     * Get decay intensity for use in visual effects
     */
    getDecayIntensity() {
        return this.decayAmount;
    }

    /**
     * Get visual manifestation state
     */
    getVisualState() {
        return {
            decay: this.decayAmount,
            stage: this.getCurrentStage().name,
            intensity: this.getCurrentStage().intensity,
            direction: this.decayDirection,
            discolorationHue: this.discolorationHue,
            glitchIntensity: this.glitchIntensity,
            crackPattern: this.crackPattern,
        };
    }

    /**
     * Set configuration
     */
    setConfig(configOverrides) {
        Object.assign(this.config, configOverrides);
    }

    /**
     * Reset decay (for link restoration/repair)
     */
    reset() {
        this.decayAmount = 0;
        this.previousDecay = 0;
        this.decayDirection = 0;
        this.glitchIntensity = 0;
    }

    /**
     * Dispose
     */
    dispose() {
        // Lightweight tracker; no resources
    }
}
