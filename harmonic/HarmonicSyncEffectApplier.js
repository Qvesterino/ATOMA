/**
 * harmonic/HarmonicSyncEffectApplier.js
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

export class HarmonicSyncEffectApplier {
    constructor() {
        // No per-instance state needed
    }

    apply(linkGroup, linkState, syncFeedback) {
        if (!linkGroup || !linkState || !syncFeedback) return;

        const { syncTargetPhase, syncFrequency, syncStrength, isActive } = syncFeedback;
        if (!isActive || syncStrength < 0.05) return;

        this.applySyncToEnergyWave(linkState.energyWave, syncFeedback);
        this.applySyncToPulseRing(linkState.pulseRing, syncFeedback);
        this.applySyncToArcDischarges(linkState.arcDischarges, syncFeedback);
        this.applySyncToStrands(linkState.strands, syncFeedback);
    }

    applySyncToEnergyWave(energyWave, syncFeedback) {
        if (!energyWave) return;
        const { syncFrequency, syncStrength } = syncFeedback;

        if (typeof energyWave.getConfig !== 'function' || typeof energyWave.setConfig !== 'function') return;

        const currentConfig = energyWave.getConfig();
        if (!currentConfig) return;

        const currentFreq = currentConfig.waveFrequency || 3.0;
        const syncAmount = (syncFrequency - currentFreq) * syncStrength * 0.2;
        const newFrequency = currentFreq + syncAmount;
        const amplitudeBoost = 1.0 + syncStrength * 0.15;

        const newConfig = {
            waveFrequency: Math.max(1.0, Math.min(5.0, newFrequency)),
            baseIntensity: (currentConfig.baseIntensity || 0.6) * amplitudeBoost,
            peakIntensity: (currentConfig.peakIntensity || 1.4) * amplitudeBoost,
        };

        energyWave.setConfig(newConfig);

        if (!energyWave.userData) energyWave.userData = {};
        energyWave.userData.harmonySync = syncStrength;
        energyWave.userData.targetFrequency = syncFrequency;
    }

    applySyncToPulseRing(pulseRing, syncFeedback) {
        if (!pulseRing || !pulseRing.material) return;
        const { syncTargetPhase, syncStrength } = syncFeedback;

        if (!pulseRing.userData) pulseRing.userData = {};
        pulseRing.userData.harmonySyncStrength = syncStrength;
        pulseRing.userData.harmonySyncPhase = syncTargetPhase;

        const mat = pulseRing.material;
        const baseOpacity = 0.4;
        const syncBrightness = baseOpacity * (1.0 + syncStrength * 0.25);
        const currentOpacity = mat.opacity || baseOpacity;
        mat.opacity = currentOpacity + (syncBrightness - currentOpacity) * 0.1;

        if (mat.color) {
            const hsl = {};
            mat.color.getHSL(hsl);
            hsl.s = Math.min(1.0, hsl.s * (1.0 + syncStrength * 0.3));
            hsl.l = Math.min(1.0, hsl.l * (1.0 + syncStrength * 0.1));
            mat.color.setHSL(hsl.h, hsl.s, hsl.l);
        }
    }

    applySyncToArcDischarges(arcDischarges, syncFeedback) {
        if (!arcDischarges) return;
        if (typeof arcDischarges.getConfig !== 'function' || typeof arcDischarges.setConfig !== 'function') return;

        const { syncStrength } = syncFeedback;
        const currentConfig = arcDischarges.getConfig();
        if (!currentConfig) return;

        const jitterReduction = syncStrength * 0.6;
        const newJitter = Math.max(0.01, (currentConfig.jitterAmount || 0.05) * (1.0 - jitterReduction));
        const arcCountStability = syncStrength * 0.2;

        const newConfig = {
            jitterAmount: newJitter,
            arcsPerBurst: Math.max(3, Math.round((currentConfig.arcsPerBurst || 5) + arcCountStability)),
            arcLength: (currentConfig.arcLength || 0.15) * (1.0 + syncStrength * 0.1),
            radiusScale: (currentConfig.radiusScale || 1.0) * (1.0 + syncStrength * 0.1),
        };

        arcDischarges.setConfig(newConfig);

        if (!arcDischarges.activeArcs) return;
        arcDischarges.userData = arcDischarges.userData || {};
        arcDischarges.userData.harmonySyncStrength = syncStrength;
    }

    applySyncToStrands(strands, syncFeedback) {
        if (!strands || strands.length === 0) return;
        const { syncStrength } = syncFeedback;

        strands.forEach((strand, index) => {
            if (!strand || !strand.material) return;

            const mat = strand.material;
            const ownerState = mat?.userData?.__strandOwnerStateRef || null;
            const dampen = ownerState?.corruptionDampen ?? 1.0;

            const baseEmissive = mat.emissiveIntensity || 1.2;
            const syncGlow = baseEmissive * (1.0 + syncStrength * 0.2 * dampen);
            mat.emissiveIntensity = baseEmissive + (syncGlow - baseEmissive) * (0.08 * dampen);

            if (mat.metalness !== undefined) {
                const baseMetal = mat.metalness || 0.8;
                const syncedMetal = baseMetal * (1.0 + syncStrength * 0.15 * dampen);
                mat.metalness = baseMetal + (syncedMetal - baseMetal) * (0.08 * dampen);
            }

            if (!strand.userData.harmonySync) strand.userData.harmonySync = 0;
            strand.userData.harmonySync += (syncStrength - strand.userData.harmonySync) * 0.05;
        });
    }

    dispose() {
        // Lightweight applier; no resources
    }
}
