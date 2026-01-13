import * as THREE from 'three';

/**
 * InterferenceEffectApplier
 * ============================================================================
 * Applies node synergy interference feedback to link visuals.
 * 
 * Translates interference metrics into visual effects on:
 * - Braided strands (amplitude modulation, phase alignment)
 * - Energy waves (frequency pulling, amplitude scaling)
 * - Pulse rings (regularity, timing alignment)
 * 
 * This is a lightweight adapter that modifies existing visual state based on
 * interference feedback from the connected node.
 */
export class InterferenceEffectApplier {
    constructor() {
        // No state needed—this is purely functional
    }

    /**
     * Apply interference effects to a link's visual components
     * @param {THREE.Group} linkGroup - The link visual group
     * @param {Object} linkState - The link's conduit state
     * @param {Object} interferenceFeedback - Feedback from NodeSynergyInterferenceController
     */
    apply(linkGroup, linkState, interferenceFeedback) {
        if (!linkGroup || !linkState || !interferenceFeedback) return;

        const { interferenceFactor, syncBias, averagePhase } = interferenceFeedback;

        // Apply to each subsystem
        this.applyStrandEffects(linkState.strands, interferenceFactor, syncBias, averagePhase);
        this.applyEnergyWaveEffects(linkState.energyWave, interferenceFactor, syncBias);
        this.applyPulseRingEffects(linkState.pulseRing, interferenceFactor, syncBias, averagePhase);
    }

    /**
     * Apply interference effects to braided strands
     */
    applyStrandEffects(strands, interferenceFactor, syncBias, averagePhase) {
        if (!strands || strands.length === 0) return;

        strands.forEach((strand, index) => {
            if (!strand || !strand.material) return;

            // === CONSTRUCTIVE INTERFERENCE ===
            // interferenceFactor > 1.0 means constructive
            // Effects: smoother wave motion, synchronized phases
            const constructiveStrength = Math.max(0, interferenceFactor - 1.0); // 0-0.5 range
            
            // === DESTRUCTIVE INTERFERENCE ===
            // interferenceFactor < 1.0 means destructive
            // Effects: reduced amplitude, dampened motion
            const destructiveStrength = Math.max(0, 1.0 - interferenceFactor); // 0-1.0 range

            // Store interference state on strand for external use
            strand.userData.interferenceFactor = interferenceFactor;
            strand.userData.syncBias = syncBias;
            strand.userData.phaseAlignment = averagePhase;

            // === VISUAL EFFECT: Emissive Intensity Modulation ===
            // Constructive: brighter (amplified)
            // Destructive: dimmer (dampened)
            if (strand.material.emissiveIntensity !== undefined) {
                const baseIntensity = strand.material.emissiveIntensity || 1.2;
                
                // Constructive brightens, destructive dims
                const intensityMod = (interferenceFactor - 1.0) * 0.3; // -0.3 to +0.15 range
                strand.material.emissiveIntensity = Math.max(0.3, baseIntensity * (1.0 + intensityMod));
            }

            // === VISUAL EFFECT: Opacity Modulation ===
            // Constructive: sharper (higher opacity)
            // Destructive: softer (lower opacity, as if scattered)
            if (strand.material.opacity !== undefined) {
                const baseOpacity = strand.material.opacity || 0.95;
                
                // Destructive reduces opacity
                const opacityMod = -destructiveStrength * 0.15; // 0 to -0.15
                strand.material.opacity = Math.max(0.5, baseOpacity * (1.0 + opacityMod));
            }

            // === VISUAL EFFECT: Roughness Modulation ===
            // Constructive: smoother (lower roughness)
            // Destructive: rougher (higher roughness, jagged appearance)
            if (strand.material.roughness !== undefined) {
                const baseRoughness = strand.material.roughness || 0.35;
                
                // Destructive increases roughness
                const roughnessMod = destructiveStrength * 0.25; // 0 to +0.25
                strand.material.roughness = Math.max(0.2, Math.min(0.6, baseRoughness + roughnessMod));
            }

            // === PHASE ALIGNMENT ===
            // Under syncBias, strands align their phase offset toward node average
            // This creates visual synchronization across connected links
            if (!strand.userData.synergyPhaseSync) {
                strand.userData.synergyPhaseSync = 0;
            }
            
            const targetPhaseSync = averagePhase * syncBias;
            strand.userData.synergyPhaseSync += (targetPhaseSync - strand.userData.synergyPhaseSync) * 0.1;
        });
    }

    /**
     * Apply interference effects to energy wave
     */
    applyEnergyWaveEffects(energyWave, interferenceFactor, syncBias) {
        if (!energyWave) return;

        // Store interference factors for wave computation
        energyWave.userData = energyWave.userData || {};
        energyWave.userData.interferenceFactor = interferenceFactor;
        energyWave.userData.syncBias = syncBias;

        // === AMPLITUDE MODULATION ===
        // Multiply wave amplitude by interference factor
        // Constructive (>1.0): amplified wave
        // Destructive (<1.0): dampened wave
        const currentConfig = energyWave.getConfig();
        const newConfig = {
            baseIntensity: (currentConfig.baseIntensity || 0.6) * interferenceFactor,
            peakIntensity: (currentConfig.peakIntensity || 1.4) * interferenceFactor,
        };

        // === FREQUENCY PULLING ===
        // Under high syncBias, frequency gently pulls toward node rhythm
        // This is a subtle effect: small frequency adjustment
        if (syncBias > 0.1) {
            const frequencyPull = syncBias * 0.15; // 0-0.15 shift
            newConfig.waveFrequency = (currentConfig.waveFrequency || 3.0) * (1.0 + frequencyPull);
        }

        energyWave.setConfig(newConfig);
    }

    /**
     * Apply interference effects to pulse ring
     */
    applyPulseRingEffects(pulseRing, interferenceFactor, syncBias, averagePhase) {
        if (!pulseRing || !pulseRing.material) return;

        const mat = pulseRing.material;

        // === REGULARITY MODULATION ===
        // Constructive: more regular, predictable motion
        // Destructive: more staggered, irregular motion
        const regularityBoost = (interferenceFactor - 1.0) * 0.5; // -0.5 to +0.25
        
        // Store interference state
        pulseRing.userData = pulseRing.userData || {};
        pulseRing.userData.interferenceFactor = interferenceFactor;
        pulseRing.userData.syncBias = syncBias;
        pulseRing.userData.regularityMod = regularityBoost;

        // === OPACITY MODULATION ===
        // Constructive: brighter, more visible
        // Destructive: dimmer, less prominent
        const baseOpacity = mat.opacity || 0.4;
        const opacityMod = (interferenceFactor - 1.0) * 0.15; // -0.15 to +0.075
        mat.opacity = Math.max(0.05, Math.min(1.0, baseOpacity * (1.0 + opacityMod)));

        // === COLOR SATURATION MODULATION ===
        // Constructive: more saturated
        // Destructive: less saturated (desaturated)
        if (mat.color) {
            const hsl = {};
            mat.color.getHSL(hsl);
            
            const saturationMod = (interferenceFactor - 1.0) * 0.3; // -0.3 to +0.15
            hsl.s = Math.max(0.3, Math.min(1.0, hsl.s * (1.0 + saturationMod)));
            
            mat.color.setHSL(hsl.h, hsl.s, hsl.l);
        }

        // === TIMING SYNCHRONIZATION ===
        // Under high syncBias, ring tries to align with node average phase
        // Store target phase for potential speed adjustment
        pulseRing.userData.targetSyncPhase = averagePhase;
    }

    /**
     * Apply interference effects to arc discharges
     */
    applyArcDischargeEffects(arcDischarges, interferenceFactor, syncBias) {
        if (!arcDischarges) return;

        // === ARC FREQUENCY & INTENSITY MODULATION ===
        // Constructive: more frequent, brighter arcs
        // Destructive: less frequent, dimmer arcs
        const currentConfig = arcDischarges.getConfig();

        const newConfig = {
            // Spawn interval inversely scaled by interference
            // Lower spawn interval = more frequent
            spawnInterval: (currentConfig.spawnInterval || 0.25) / interferenceFactor,
            
            // Arc lifetime affected by interference
            arcLifetime: (currentConfig.arcLifetime || 0.08) * interferenceFactor,
            
            // Arc count scaled
            arcsPerBurst: Math.max(2, Math.floor((currentConfig.arcsPerBurst || 5) * interferenceFactor)),
            
            // Radius affected
            radiusScale: (currentConfig.radiusScale || 1.0) * interferenceFactor,
            
            // Jitter reduced under constructive interference (cleaner arcs)
            jitterAmount: (currentConfig.jitterAmount || 0.05) / (1.0 + interferenceFactor * 0.5),
        };

        arcDischarges.setConfig(newConfig);
    }

    /**
     * Dispose/cleanup
     */
    dispose() {
        // Lightweight applier; no resources
    }
}
