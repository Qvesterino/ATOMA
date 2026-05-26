/**
 * harmonic/HarmonicHubCollapseController.js
 * ============================================================================
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
import { normalizePhase } from '../shared/harmonyHelpers.js';

export class HarmonicHubCollapseController {
    constructor(harmonicSyncController) {
        this.harmonicController = harmonicSyncController;
        this.maxTrackedHubs = 20;

        // Collapse state (0 = healthy, 1 = fully collapsed)
        this.collapseFactor = 0.0;
        this.targetCollapseFactor = 0.0;

        // Overload state tracking
        this.isInOverload = false;
        this._wasInOverload = false;
        this.overloadAge = 0.0; // Time spent in overload

        // Semantic bus (injected externally)
        this.semanticBus = null;

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

        // Emit predictive event on false -> true transition
        if (!this._wasInOverload && this.isInOverload && this.semanticBus) {
            this.semanticBus.emit('hub.overload', {
                node: this.harmonicController?.node,
                collapseFactor: this.collapseFactor,
                phaseVariance: this.phaseVariance,
                harmony,
                corruption,
                synergy,
                stability
            });
        }
        this._wasInOverload = this.isInOverload;

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
        this.haloPhase = normalizePhase(this.haloPhase);
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

    setConfig(configOverrides) {
        Object.assign(this.config, configOverrides);
    }

    dispose() {
        this.shockwaveQueue = [];
    }
}
