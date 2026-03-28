import * as THREE from 'three';
import { LinkDecayTracker } from './LinkDecayTracker.js';
import { LinkDecayEffectApplier } from './LinkDecayEffectApplier.js';

// Artistic strand tuning sliders (safe, local, no gameplay impact).
// Adjust these three values for quick visual iteration:
const STRAND_ART = {
    GLOW: 1.0,         // 0.6..1.8  (higher = brighter energetic strands)
    OPACITY: 1.0,      // 0.7..1.3  (higher = less transparent strands)
    PULSE_SPEED: 1.0,  // 0.6..1.8  (higher = faster breathing/pulse motion)
    IRREGULARITY: 0.22 // 0.0..0.5  (higher = more organic non-uniform motion)
};

function claimStrandChannel(material, channel, writer, priority) {
    const ownerState = material?.userData?.__strandOwnerStateRef;
    if (!ownerState) return true;
    ownerState.claims = ownerState.claims || {};
    ownerState.trace = ownerState.trace || {};
    const current = ownerState.claims[channel];
    if (current && Number.isFinite(current.priority) && current.priority > priority) {
        return false;
    }
    ownerState.claims[channel] = { writer, priority };
    ownerState.trace[channel] = writer;
    return true;
}

/**
 * LinkVisualStateAdapter
 * ============================================================================
 * Bridges existing Harmony/Corruption/Stability/Synergy systems with braided link visuals.
 * 
 * DESIGN PHILOSOPHY:
 * - Adapts visual properties ONLY, never touches gameplay or data structures
 * - Reads harmony/corruption/instability/synergy; applies to existing materials
 * - No material redefinition; only updates safe properties and uniforms
 * - Works gracefully if sub-components are missing
 * 
 * VISUAL EFFECT LAYERS:
 * - Harmony: brightness, smoothness, color cohesion, stable flow
 * - Corruption: hue shift, phase jitter, flickering, irregular timing
 * - Instability: overall visual noise, temporal jitter, reduced opacity
 * - Synergy: energy flow rhythm, motion speed, spawn intensity (no state/corruption)
 */
export class LinkVisualStateAdapter {
    constructor() {
        // State cache
        this.previousHarmony = 1.0;
        this.previousCorruption = 0.0;
        this.previousInstability = 0.0;
        this.previousSynergy = 0.5;
        
        // Temporal noise for corruption effects
        this.corruptionPhase = Math.random() * Math.PI * 2;
        this.instabilityPhase = Math.random() * Math.PI * 2;
        
        // Synergy-driven rhythm (independent from corruption/instability noise)
        this.synergyPhase = Math.random() * Math.PI * 2;
        
        // Decay tracking and application
        this.decayTracker = new LinkDecayTracker();
        this.decayEffectApplier = new LinkDecayEffectApplier();
        
        // Math cache
        this._color = new THREE.Color();
    }

    /**
     * Apply visual state adaptations to a link's visual group
     * @param {THREE.Group} linkGroup - The link visual group
     * @param {number} harmonyLevel - Harmony score (0-1)
     * @param {number} corruptionLevel - Corruption score (0-1)
     * @param {number} instability - Instability score (0-1)
     * @param {number} deltaTime - Frame delta
     * @param {number} synergy - Synergy/flow score (0-1), defaults to 0.5
     */
    update(linkGroup, harmonyLevel = 1.0, corruptionLevel = 0.0, instability = 0.0, deltaTime = 0, synergy = undefined) {
        if (!linkGroup || !linkGroup.userData.conduitState) return;

        const state = linkGroup.userData.conduitState;
        const safeDelta = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;

        // Clamp values to safe ranges
        harmonyLevel = Math.max(0, Math.min(1, harmonyLevel));
        corruptionLevel = Math.max(0, Math.min(1, corruptionLevel));
        instability = Math.max(0, Math.min(1, instability));
        synergy = synergy !== undefined ? Math.max(0, Math.min(1, synergy)) : 0.5;

        // Update temporal phases for corruption/instability effects
        this.corruptionPhase += safeDelta * (2.0 + corruptionLevel * 3.0);
        this.instabilityPhase += safeDelta * (1.5 + instability * 2.5);
        
        // Update synergy rhythm phase (independent, clean rhythm)
        this.synergyPhase += safeDelta * (1.0 + synergy * 2.0) * STRAND_ART.PULSE_SPEED;

        // === UPDATE DECAY TRACKER ===
        // Track cumulative corruption exposure over time
        this.decayTracker.update(corruptionLevel, harmonyLevel, safeDelta);

        // Apply effects to each subsystem
        this.applyStrandEffects(state.strands, harmonyLevel, corruptionLevel, instability, synergy);
        this.applyPulseRingEffects(state.pulseRing, harmonyLevel, corruptionLevel, instability, synergy);
        this.applyArcDischargeEffects(state.arcDischarges, harmonyLevel, corruptionLevel, instability, synergy);
        this.applySkinEffects(state.skinMesh, harmonyLevel, corruptionLevel, instability, synergy);
        this.applyEnergyWaveEffects(state.energyWave, harmonyLevel, corruptionLevel, instability, synergy);

        // === APPLY DECAY EFFECTS ===
        // Overlay cumulative corruption damage on all visuals
        const decayState = this.decayTracker.getVisualState();
        this.decayEffectApplier.apply(linkGroup, state, decayState, deltaTime);

        // Cache state for change detection
        this.previousHarmony = harmonyLevel;
        this.previousCorruption = corruptionLevel;
        this.previousInstability = instability;
        this.previousSynergy = synergy;
    }

    /**
     * Apply visual effects to braided strands
     */
    applyStrandEffects(strands, harmony, corruption, instability, synergy) {
        if (!strands || strands.length === 0) return;

        strands.forEach((strand, index) => {
            if (!strand || !strand.material) return;

            // === HARMONY EFFECTS ===
            // Harmony increases brightness and smooths material appearance
            const harmonyBrightness = 0.8 + (harmony * 0.5); // 0.8 -> 1.3
            const harmonyRoughness = 0.5 - (harmony * 0.15); // 0.5 -> 0.35

            // === CORRUPTION EFFECTS ===
            // Corruption introduces hue shift and desaturation
            const corruptionHueShift = Math.sin(this.corruptionPhase + index * 0.5) * corruption * 0.15;
            const corruptionDesaturation = corruption * 0.4;

            // === INSTABILITY EFFECTS ===
            // Instability causes flickering and opacity reduction
            const instabilityFlicker = Math.sin(this.instabilityPhase + index * 0.3) * instability * 0.3;
            const baseOpacity = 0.95 * (1.0 - instability * 0.2);
            const instabilityOpacity = baseOpacity + instabilityFlicker;

            // Apply to material
            const mat = strand.material;
            const ownerState = mat?.userData?.__strandOwnerStateRef || null;
            const dampen = ownerState?.corruptionDampen ?? 1.0;
            const strandNoiseSeed = (strand.userData.__strandNoiseSeed ??= Math.random() * Math.PI * 2);
            const irregularPhase = Math.sin(this.instabilityPhase * 0.63 + strandNoiseSeed + index * 0.37) * STRAND_ART.IRREGULARITY;
            const pulse = 0.5 + 0.5 * Math.sin(this.synergyPhase + index + irregularPhase);
            const viewBoost = 0.3 + 0.7 * Math.abs(Math.sin(this.synergyPhase));
            const microFlicker = 1.0 + (Math.sin(this.corruptionPhase * 0.41 + strandNoiseSeed * 1.9) * 0.12 * STRAND_ART.IRREGULARITY);
            const energyFactor = (0.8 + pulse * 0.6) * viewBoost * microFlicker;
            const targetEmissiveIntensity = (1.2 + synergy * 1.5) * energyFactor * STRAND_ART.GLOW;

            // Emissive Intensity (energy-driven, less material/plastic feel)
            if (claimStrandChannel(mat, 'colorEmissive', 'LinkVisualStateAdapter', 100)) {
                const current = (typeof mat.emissiveIntensity === 'number')
                    ? mat.emissiveIntensity
                    : targetEmissiveIntensity;
                mat.emissiveIntensity = current + (targetEmissiveIntensity - current) * (0.55 * dampen);
            }

            // Matte energy ribbon look (reduce plastic feel)
            if (typeof mat.roughness !== 'undefined') {
                mat.roughness = 0.15;
            }
            if (typeof mat.metalness !== 'undefined') {
                mat.metalness = 0.0;
            }

            // Remove opaque feeling while preserving instability readability
            if (claimStrandChannel(mat, 'opacity', 'LinkVisualStateAdapter', 100)) {
                const targetOpacityBase = (0.75 + synergy * 0.2 - instability * 0.12) * STRAND_ART.OPACITY;
                const targetOpacity = Math.max(0.4, Math.min(0.96, targetOpacityBase + irregularPhase * 0.08));
                mat.opacity = mat.opacity + (targetOpacity - (mat.opacity ?? targetOpacity)) * (0.6 * dampen);
            }

            // Color adjustments (corruption hue-shifts and desaturates)
            if (mat.color && !mat.userData?.__colorLockedByCorruption && claimStrandChannel(mat, 'colorEmissive', 'LinkVisualStateAdapter', 100)) {
                const hsl = {};
                mat.color.getHSL(hsl);
                
                // Hue shift from corruption
                hsl.h += corruptionHueShift;
                
                // Desaturation from corruption
                hsl.s *= (1.0 - corruptionDesaturation * dampen);
                
                // Lightness affected by harmony and corruption
                hsl.l = hsl.l * (1.0 - corruption * 0.15 * dampen) + (harmony * 0.1 * dampen);
                
                mat.color.setHSL(hsl.h, hsl.s, hsl.l);
            }

            // ShaderMaterial path: drive base color as energetic light source.
            if (mat.uniforms?.uBaseColor?.value?.isColor && !mat.userData?.__colorLockedByCorruption && claimStrandChannel(mat, 'colorEmissive', 'LinkVisualStateAdapter', 100)) {
                const base = mat.uniforms.uBaseColor.value;
                const hsl = {};
                base.getHSL(hsl);
                hsl.h += corruptionHueShift;
                hsl.s *= (1.0 - corruptionDesaturation * dampen);
                hsl.l = Math.min(1.0, hsl.l * (0.92 + harmony * 0.18) + (synergy * 0.08));
                base.setHSL(hsl.h, hsl.s, hsl.l);
            }

            // Emissive color also shifts with corruption
            if (mat.emissive && !mat.userData?.__colorLockedByCorruption && claimStrandChannel(mat, 'colorEmissive', 'LinkVisualStateAdapter', 100)) {
                if (mat.color?.isColor) {
                    mat.emissive.copy(mat.color);
                }
                const hsl = {};
                mat.emissive.getHSL(hsl);
                hsl.h += corruptionHueShift * 0.5;
                hsl.s *= (1.0 - corruptionDesaturation * 0.5 * dampen);
                mat.emissive.setHSL(hsl.h, hsl.s, hsl.l);
            }

            // === SYNERGY EFFECTS (Strand Level) ===
            // Synergy creates subtle phase offsets between strands
            // This adds a flowing, wavelike quality without changing base brightness
            // Store synergy phase info on strand for potential use by energy wave
            if (!strand.userData.synergyPhase) {
                strand.userData.synergyPhase = (index / strands.length) * Math.PI * 2;
            }
            
            // Keep material lightweight and non-metallic; glow carries the energy look.
        });
    }

    /**
     * Apply visual effects to pulse ring
     */
    applyPulseRingEffects(pulseRing, harmony, corruption, instability, synergy) {
        if (!pulseRing) return;

        // LinkPulseRing has a material property directly
        const mat = pulseRing.material;
        if (!mat) return;

        // === HARMONY EFFECTS ===
        // Harmony makes ring brighter and more stable
        const harmonyOpacityBoost = harmony * 0.3;
        const harmonyStability = 1.0 + (harmony * 0.2); // Ring scales up slightly with harmony

        // === CORRUPTION EFFECTS ===
        // Corruption introduces flashing/instability and desaturation
        const corruptionFlash = Math.sin(this.corruptionPhase) * corruption * 0.5;
        const corruptionDesaturation = corruption * 0.3;

        // === INSTABILITY EFFECTS ===
        // Instability causes temporal jitter
        const instabilityJitter = Math.sin(this.instabilityPhase) * instability * 0.2;

        // Apply to ring material
        const baseOpacity = 0.4 + (harmony * 0.2);
        const opacity = baseOpacity + harmonyOpacityBoost + corruptionFlash - (instability * 0.15) + instabilityJitter;
        mat.opacity = Math.max(0.0, Math.min(1.0, opacity));

        // Color shift from corruption
        if (mat.color) {
            const hsl = {};
            mat.color.getHSL(hsl);
            
            hsl.h += Math.sin(this.corruptionPhase * 0.5) * corruption * 0.1;
            hsl.s *= (1.0 - corruptionDesaturation);
            hsl.l = hsl.l * (1.0 - corruption * 0.1) + (harmony * 0.05);
            
            mat.color.setHSL(hsl.h, hsl.s, hsl.l);
        }

        // Store scaling factor on mesh for arc discharge access
        if (pulseRing.mesh) {
            pulseRing.mesh.userData.harmonyScale = harmonyStability;
            pulseRing.mesh.userData.instabilityNoise = instabilityJitter;
        }

        // === SYNERGY EFFECTS (Pulse Ring) ===
        // Synergy controls travel speed and adds rhythmic scale pulse
        if (pulseRing.mesh) {
            // Synergy scales the mesh with a subtle pulse (±5%)
            const synergyPulse = Math.sin(this.synergyPhase * 2.0) * synergy * 0.05;
            const baseScaleValue = pulseRing.mesh.scale.x || 0.08;
            
            // Apply rhythmic pulse without overwriting existing scale logic
            pulseRing.mesh.userData.synergyPulseAmount = synergyPulse;
        }

        // Store synergy for speed modulation (on the LinkPulseRing object)
        if (!pulseRing.userData) pulseRing.userData = {};
        pulseRing.userData.synergyFactor = synergy;
    }

    /**
     * Apply visual effects to arc discharges
     */
    applyArcDischargeEffects(arcDischarges, harmony, corruption, instability, synergy) {
        if (!arcDischarges) return;

        // === HARMONY EFFECTS ===
        // Harmony makes arcs more frequent and stable
        const harmonySpawnBoost = harmony * 0.3;
        const harmonyLifetimeBoost = harmony * 0.02;

        // === CORRUPTION EFFECTS ===
        // Corruption introduces irregular timing and hue shifts
        const corruptionSpawnJitter = Math.sin(this.corruptionPhase) * corruption * 0.5;
        const corruptionLifetimeVariance = corruption * 0.03;

        // === INSTABILITY EFFECTS ===
        // Instability reduces arc frequency and intensity
        const instabilitySuppress = instability * 0.4;

        // === SYNERGY EFFECTS (Arc Discharges) ===
        // Synergy linearly scales spawn rate (higher synergy = more frequent arcs)
        const synergySpawnScale = 1.0 - (synergy * 0.3); // Smaller interval = more frequent
        const synergyArcCount = Math.floor(5 * (0.8 + synergy * 0.4)); // 4-7 arcs

        // Modify arc discharge configuration
        const baseSpawnInterval = 0.25;
        const spawnInterval = (baseSpawnInterval - (harmonySpawnBoost * 0.1) + (corruptionSpawnJitter * 0.05) + (instabilitySuppress * 0.05)) * synergySpawnScale;

        arcDischarges.setConfig({
            spawnInterval: Math.max(0.1, Math.min(0.5, spawnInterval)),
            arcLifetime: 0.08 + harmonyLifetimeBoost + corruptionLifetimeVariance - (instabilitySuppress * 0.02),
            arcsPerBurst: Math.max(2, Math.min(8, synergyArcCount)),
            arcLength: 0.15 * (1.0 - instability * 0.3) * (0.8 + synergy * 0.2),
            jitterAmount: 0.05 * (1.0 + corruption * 0.6 + instability * 0.4), // Jitter stays consistent (corruption/instability only)
            radiusScale: 1.0 * (1.0 + harmony * 0.2 - instability * 0.3) * (0.9 + synergy * 0.15),
        });

        // Update active arc colors based on corruption
        if (arcDischarges.activeArcs && arcDischarges.activeArcs.length > 0) {
            arcDischarges.activeArcs.forEach((arc, idx) => {
                if (arc.material && arc.material.color) {
                    const hsl = {};
                    arc.material.color.getHSL(hsl);
                    
                    // Corruption hue-shifts the arcs
                    hsl.h += Math.sin(this.corruptionPhase + idx * 0.2) * corruption * 0.15;
                    hsl.s *= (1.0 - corruption * 0.3);
                    
                    arc.material.color.setHSL(hsl.h, hsl.s, hsl.l);
                    
                    // Harmony increases arc visibility
                    arc.material.opacity = (arc.material.opacity || 0.7) * (0.7 + harmony * 0.3);
                }
            });
        }
    }

    /**
     * Apply visual effects to outer glow skin
     */
    applySkinEffects(skinMesh, harmony, corruption, instability, synergy) {
        if (!skinMesh || !skinMesh.material) return;

        const mat = skinMesh.material;

        // === HARMONY EFFECTS ===
        // Harmony makes the skin more prominent and stable
        const harmonyOpacityBoost = harmony * 0.05;

        // === CORRUPTION EFFECTS ===
        // Corruption causes the skin to flicker and destabilize
        const corruptionFlicker = Math.sin(this.corruptionPhase * 0.8) * corruption * 0.03;
        const corruptionDesaturation = corruption * 0.2;

        // === INSTABILITY EFFECTS ===
        // Instability reduces skin visibility
        const instabilityDim = instability * 0.05;

        // Apply opacity modulation
        const baseSkinOpacity = 0.05;
        const finalOpacity = baseSkinOpacity + harmonyOpacityBoost + corruptionFlicker - instabilityDim;
        mat.opacity = Math.max(0.01, Math.min(0.15, finalOpacity));

        // Color shift from corruption
        if (mat.color) {
            const hsl = {};
            mat.color.getHSL(hsl);
            
            hsl.h += Math.sin(this.corruptionPhase * 0.3) * corruption * 0.08;
            hsl.s *= (1.0 - corruptionDesaturation);
            
            mat.color.setHSL(hsl.h, hsl.s, hsl.l);
        }

        // === SYNERGY EFFECTS (Glow Skin) ===
        // Amplify glow only when harmony > corruption (harmony-positive state)
        // This creates a visual sense of a "clean" link with good flow
        const harmonyAdvantage = Math.max(0, harmony - corruption);
        const synergyGlowAmplify = harmonyAdvantage * synergy * 0.03;
        
        // Apply synergy-driven glow amplification (on top of base harmony effect)
        mat.opacity = Math.max(0.01, Math.min(0.15, mat.opacity + synergyGlowAmplify));
    }

    /**
     * Apply visual effects to energy wave system
     */
    applyEnergyWaveEffects(energyWave, harmony, corruption, instability, synergy) {
        if (!energyWave) return;

        // === SYNERGY EFFECTS (Energy Wave) ===
        // Synergy modulates wave amplitude and frequency
        // Higher synergy = more pronounced wave, smoother motion
        const waveAmplitudeScale = 0.6 + (synergy * 0.4); // 0.6 -> 1.0
        const waveFrequencyScale = 1.0 + (synergy * 0.3); // 1.0 -> 1.3
        const waveSpeedScale = 1.0 + (synergy * 0.5); // 1.0 -> 1.5

        // Modulate config via setConfig (safe, non-allocating)
        energyWave.setConfig({
            baseWaveSpeed: 1.5 * waveSpeedScale,
            waveFrequency: 3.0 * waveFrequencyScale,
            baseIntensity: 0.6 * waveAmplitudeScale,
            peakIntensity: 1.4 * waveAmplitudeScale,
        });

        // Store synergy factor for potential external use
        energyWave.synergyFactor = synergy;
    }

    /**
     * Get current visual state (for debugging/monitoring)
     */
    getVisualState() {
        const decayState = this.decayTracker.getVisualState();
        return {
            harmonyLevel: this.previousHarmony,
            corruptionLevel: this.previousCorruption,
            instabilityLevel: this.previousInstability,
            synergyLevel: this.previousSynergy,
            corruptionPhase: this.corruptionPhase,
            instabilityPhase: this.instabilityPhase,
            synergyPhase: this.synergyPhase,
            decay: decayState.decay,
            decayStage: decayState.stage,
            decayIntensity: decayState.intensity,
        };
    }

    /**
     * Get decay tracker for external monitoring
     */
    getDecayTracker() {
        return this.decayTracker;
    }

    /**
     * Reset decay (for link restoration/repair)
     */
    resetDecay() {
        this.decayTracker.reset();
    }

    /**
     * Reset temporal phases (useful on state transitions)
     */
    reset() {
        this.corruptionPhase = Math.random() * Math.PI * 2;
        this.instabilityPhase = Math.random() * Math.PI * 2;
        this.decayTracker.reset();
    }

    /**
     * Dispose (cleanup if needed)
     */
    dispose() {
        if (this.decayTracker) this.decayTracker.dispose();
        if (this.decayEffectApplier) this.decayEffectApplier.dispose();
    }
}
