import * as THREE from 'three';

/**
 * HarmonicSyncEffectApplier
 * ============================================================================
 * Applies harmonic synchronization effects to link components based on hub feedback.
 * 
 * VISUAL MANIFESTATIONS OF SYNCHRONIZATION:
 * - Energy waves: Phase-locked, moving coherently with hub frequency
 * - Pulse rings: Aligned timing, synchronized traversal
 * - Arc discharges: Rhythmic, coordinated spawning
 * - Strands: Subtle glow synchronization
 * 
 * Synchronization is never hard-locked; links maintain individual character
 * while being gently pulled toward hub rhythm.
 */
export class HarmonicSyncEffectApplier {
    constructor() {
        // No per-instance state needed
    }

    /**
     * Apply harmonic sync effects to a link
     */
    apply(linkGroup, linkState, syncFeedback) {
        if (!linkGroup || !linkState || !syncFeedback) return;

        const { syncTargetPhase, syncFrequency, syncStrength, isActive } = syncFeedback;

        if (!isActive || syncStrength < 0.05) {
            // Hub inactive or too weak to affect link
            return;
        }

        // Apply to each subsystem
        this.applySyncToEnergyWave(linkState.energyWave, syncFeedback);
        this.applySyncToPulseRing(linkState.pulseRing, syncFeedback);
        this.applySyncToArcDischarges(linkState.arcDischarges, syncFeedback);
        this.applySyncToStrands(linkState.strands, syncFeedback);
    }

    /**
     * Apply harmonic sync to energy wave
     * Frequency is gently pulled toward hub frequency
     */
    applySyncToEnergyWave(energyWave, syncFeedback) {
        if (!energyWave) return;

        const { syncFrequency, syncStrength } = syncFeedback;

        // Verify methods exist
        if (typeof energyWave.getConfig !== 'function' || typeof energyWave.setConfig !== 'function') {
            return;
        }

        const currentConfig = energyWave.getConfig();
        if (!currentConfig) return;

        // === FREQUENCY SYNCHRONIZATION ===
        // Gently pull wave frequency toward hub frequency
        // Stronger sync = more aggressive frequency pulling
        const currentFreq = currentConfig.waveFrequency || 3.0;
        const syncAmount = (syncFrequency - currentFreq) * syncStrength * 0.2;
        const newFrequency = currentFreq + syncAmount;

        // === AMPLITUDE ENHANCEMENT ===
        // Synchronized links get slightly boosted amplitude (visual emphasis)
        const amplitudeBoost = 1.0 + syncStrength * 0.15;

        const newConfig = {
            waveFrequency: Math.max(1.0, Math.min(5.0, newFrequency)),
            baseIntensity: (currentConfig.baseIntensity || 0.6) * amplitudeBoost,
            peakIntensity: (currentConfig.peakIntensity || 1.4) * amplitudeBoost,
        };

        energyWave.setConfig(newConfig);

        // Store sync state
        if (!energyWave.userData) energyWave.userData = {};
        energyWave.userData.harmonySync = syncStrength;
        energyWave.userData.targetFrequency = syncFrequency;
    }

    /**
     * Apply harmonic sync to pulse ring
     * Ring timing is gently aligned with hub phase
     */
    applySyncToPulseRing(pulseRing, syncFeedback) {
        if (!pulseRing || !pulseRing.material) return;

        const { syncTargetPhase, syncStrength } = syncFeedback;

        // Store sync info for timing adjustments
        if (!pulseRing.userData) pulseRing.userData = {};
        pulseRing.userData.harmonySyncStrength = syncStrength;
        pulseRing.userData.harmonySyncPhase = syncTargetPhase;

        // === VISUAL EFFECT: Opacity boost during sync ===
        // Synchronized rings become slightly brighter (visual indication)
        const mat = pulseRing.material;
        const baseOpacity = 0.4;
        const syncBrightness = baseOpacity * (1.0 + syncStrength * 0.25);
        
        // Apply smoothly to avoid sudden jumps
        const currentOpacity = mat.opacity || baseOpacity;
        mat.opacity = currentOpacity + (syncBrightness - currentOpacity) * 0.1;

        // === COLOR SATURATION ===
        // Higher sync = more saturated ring color (visual harmony)
        if (mat.color) {
            const hsl = {};
            mat.color.getHSL(hsl);
            
            // Boost saturation with sync
            hsl.s = Math.min(1.0, hsl.s * (1.0 + syncStrength * 0.3));
            
            // Slight lightness boost
            hsl.l = Math.min(1.0, hsl.l * (1.0 + syncStrength * 0.1));
            
            mat.color.setHSL(hsl.h, hsl.s, hsl.l);
        }
    }

    /**
     * Apply harmonic sync to arc discharges
     * Spawning becomes more rhythmic and coordinated
     */
    applySyncToArcDischarges(arcDischarges, syncFeedback) {
        if (!arcDischarges) return;

        // Verify methods exist
        if (typeof arcDischarges.getConfig !== 'function' || typeof arcDischarges.setConfig !== 'function') {
            return;
        }

        const { syncStrength } = syncFeedback;

        const currentConfig = arcDischarges.getConfig();
        if (!currentConfig) return;

        // === SPAWN REGULARITY ===
        // Synchronized arcs spawn more regularly (rhythmic pattern)
        // Reduce jitter when sync is strong
        const jitterReduction = syncStrength * 0.6; // Reduces jitter by up to 60%
        const newJitter = Math.max(0.01, (currentConfig.jitterAmount || 0.05) * (1.0 - jitterReduction));

        // === SPAWN COORDINATION ===
        // Under strong sync, arc count becomes more regular (predictable)
        const arcCountStability = syncStrength * 0.2;

        const newConfig = {
            jitterAmount: newJitter,
            arcsPerBurst: Math.max(3, Math.round((currentConfig.arcsPerBurst || 5) + arcCountStability)),
            arcLength: (currentConfig.arcLength || 0.15) * (1.0 + syncStrength * 0.1),
            radiusScale: (currentConfig.radiusScale || 1.0) * (1.0 + syncStrength * 0.1),
        };

        arcDischarges.setConfig(newConfig);

        // Store sync state
        if (!arcDischarges.activeArcs) return;
        arcDischarges.userData = arcDischarges.userData || {};
        arcDischarges.userData.harmonySyncStrength = syncStrength;
    }

    /**
     * Apply harmonic sync to strands
     * Subtle glow synchronization to indicate harmonic connection
     */
    applySyncToStrands(strands, syncFeedback) {
        if (!strands || strands.length === 0) return;

        const { syncStrength } = syncFeedback;

        strands.forEach((strand, index) => {
            if (!strand || !strand.material) return;

            const mat = strand.material;

            // === EMISSIVE SYNCHRONIZATION ===
            // Synchronized strands pulse slightly brighter (harmonic glow)
            const baseEmissive = mat.emissiveIntensity || 1.2;
            const syncGlow = baseEmissive * (1.0 + syncStrength * 0.2);
            
            // Smooth interpolation
            mat.emissiveIntensity = baseEmissive + (syncGlow - baseEmissive) * 0.08;

            // === METALNESS ENHANCEMENT ===
            // Sync increases reflectivity (harmonic resonance visual)
            if (mat.metalness !== undefined) {
                const baseMetal = mat.metalness || 0.8;
                const syncedMetal = baseMetal * (1.0 + syncStrength * 0.15);
                mat.metalness = baseMetal + (syncedMetal - baseMetal) * 0.08;
            }

            // === PHASE INFORMATION ===
            // Store sync data for potential future use
            if (!strand.userData.harmonySync) {
                strand.userData.harmonySync = 0;
            }
            strand.userData.harmonySync += (syncStrength - strand.userData.harmonySync) * 0.05;
        });
    }

    /**
     * Dispose
     */
    dispose() {
        // Lightweight applier; no resources
    }
}
