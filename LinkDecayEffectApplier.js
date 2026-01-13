import * as THREE from 'three';

/**
 * LinkDecayEffectApplier
 * ============================================================================
 * Applies visual decay effects to link components based on accumulated corruption exposure.
 * 
 * VISUAL DECAY MANIFESTATIONS:
 * 1. Discoloration: Hue shift toward red/orange, desaturation
 * 2. Material Degradation: Increased roughness, reduced metalness, opacity variations
 * 3. Energy Disruption: Reduced wave amplitude, unstable glow
 * 4. Structural Breakdown: Strand flickering, ring instability
 * 5. Glitch Effects: Visual artifacts, temporal noise
 * 
 * These effects accumulate and intensify with sustained corruption.
 */
export class LinkDecayEffectApplier {
    constructor() {
        // Glitch animation state
        this.glitchPhase = Math.random() * Math.PI * 2;
    }

    /**
     * Apply decay effects to all link components
     */
    apply(linkGroup, linkState, decayState, deltaTime = 0) {
        if (!linkGroup || !linkState || !decayState) return;

        // Update glitch phase for temporal effects
        this.glitchPhase += deltaTime * 5.0;

        const decayIntensity = decayState.intensity;

        // Apply to each subsystem
        this.applyStrandDecay(linkState.strands, decayState, deltaTime);
        this.applySkinDecay(linkState.skinMesh, decayState);
        this.applyEnergyWaveDecay(linkState.energyWave, decayState);
        this.applyPulseRingDecay(linkState.pulseRing, decayState, deltaTime);
        this.applyArcDischargeDecay(linkState.arcDischarges, decayState);
    }

    /**
     * Apply decay effects to braided strands
     */
    applyStrandDecay(strands, decayState, deltaTime) {
        if (!strands || strands.length === 0) return;

        const decayIntensity = decayState.intensity;

        strands.forEach((strand, index) => {
            if (!strand || !strand.material) return;

            const mat = strand.material;

            // === DISCOLORATION ===
            // Strands shift toward red/orange as they decay
            if (mat.color) {
                const hsl = {};
                mat.color.getHSL(hsl);

                // Hue shift toward orange/red
                hsl.h += decayState.discolorationHue;

                // Desaturation increases with decay
                hsl.s *= (1.0 - decayIntensity * 0.5);

                // Lightness reduction (darkens with decay)
                hsl.l *= (1.0 - decayIntensity * 0.3);

                mat.color.setHSL(hsl.h, hsl.s, hsl.l);
            }

            // === EMISSIVE DEGRADATION ===
            // Emissive intensity flickers and reduces with decay
            if (mat.emissiveIntensity !== undefined) {
                const baseIntensity = (mat.emissiveIntensity || 1.2);
                
                // Glitch flickering increases with decay
                const glitchFlicker = Math.sin(this.glitchPhase + index * 0.7) * decayIntensity * 0.5;
                const decayedIntensity = baseIntensity * (1.0 - decayIntensity * 0.4) + glitchFlicker;
                
                mat.emissiveIntensity = Math.max(0.1, decayedIntensity);
            }

            // === MATERIAL DEGRADATION ===
            // Roughness increases (surface becomes worn)
            if (mat.roughness !== undefined) {
                const baseRoughness = mat.roughness || 0.35;
                mat.roughness = Math.min(0.9, baseRoughness + decayIntensity * 0.5);
            }

            // Metalness decreases (surface oxidizes/corrodes)
            if (mat.metalness !== undefined) {
                const baseMetalness = mat.metalness || 0.8;
                mat.metalness = Math.max(0.2, baseMetalness - decayIntensity * 0.6);
            }

            // === OPACITY VARIATIONS ===
            // Decay causes opacity fluctuations (structural instability)
            if (mat.opacity !== undefined) {
                const baseOpacity = mat.opacity || 0.95;
                
                // Higher decay = more opacity noise
                const opacityNoise = Math.sin(this.glitchPhase * 1.5 + index) * decayIntensity * 0.2;
                const decayedOpacity = baseOpacity * (1.0 - decayIntensity * 0.1) + opacityNoise;
                
                mat.opacity = Math.max(0.4, Math.min(1.0, decayedOpacity));
            }

            // === CRACK PATTERN VISUALIZATION ===
            // Store crack pattern data for potential use
            if (!strand.userData.crackPattern) {
                strand.userData.crackPattern = Math.random();
            }
            strand.userData.decayLevel = decayIntensity;
        });
    }

    /**
     * Apply decay effects to glow skin
     */
    applySkinDecay(skinMesh, decayState) {
        if (!skinMesh || !skinMesh.material) return;

        const mat = skinMesh.material;
        const decayIntensity = decayState.intensity;

        // === GLOW DESTABILIZATION ===
        // Decay causes glow to flicker and dim
        const baseOpacity = 0.05;
        const glitchFlicker = Math.sin(this.glitchPhase * 0.8) * decayIntensity * 0.03;
        const decayedOpacity = baseOpacity * (1.0 - decayIntensity * 0.5) + glitchFlicker;
        
        mat.opacity = Math.max(0.01, Math.min(0.08, decayedOpacity));

        // === COLOR CORRUPTION ===
        if (mat.color) {
            const hsl = {};
            mat.color.getHSL(hsl);

            // Hue shift toward corruption color (red)
            hsl.h += decayState.discolorationHue * 0.7;
            
            // Severe desaturation
            hsl.s *= (1.0 - decayIntensity * 0.7);

            mat.color.setHSL(hsl.h, hsl.s, hsl.l);
        }
    }

    /**
     * Apply decay effects to energy wave
     */
    applyEnergyWaveDecay(energyWave, decayState) {
        if (!energyWave) return;

        // Verify energy wave has required methods
        if (typeof energyWave.getConfig !== 'function' || typeof energyWave.setConfig !== 'function') {
            return; // Component doesn't support configuration
        }

        const decayIntensity = decayState.intensity;

        // === WAVE DISRUPTION ===
        // Energy waves are disrupted by decay
        // Amplitude reduces, frequency becomes unstable
        const currentConfig = energyWave.getConfig();
        if (!currentConfig) return; // Safety check

        const newConfig = {
            // Amplitude diminishes with decay
            baseIntensity: (currentConfig.baseIntensity || 0.6) * (1.0 - decayIntensity * 0.6),
            peakIntensity: (currentConfig.peakIntensity || 1.4) * (1.0 - decayIntensity * 0.5),
            
            // Frequency becomes erratic with high decay
            waveFrequency: (currentConfig.waveFrequency || 3.0) * (1.0 + Math.sin(this.glitchPhase * 2.0) * decayIntensity * 0.3),
            
            // Wave speed becomes irregular
            baseWaveSpeed: (currentConfig.baseWaveSpeed || 1.5) * (1.0 + (Math.sin(this.glitchPhase * 0.5) - 0.5) * decayIntensity * 0.2),
        };

        energyWave.setConfig(newConfig);
        
        // Safely initialize and set decay level
        if (!energyWave.userData) energyWave.userData = {};
        energyWave.userData.decayLevel = decayIntensity;
    }

    /**
     * Apply decay effects to pulse ring
     */
    applyPulseRingDecay(pulseRing, decayState, deltaTime) {
        if (!pulseRing) return;

        // Verify pulse ring has a material
        const mat = pulseRing.material;
        if (!mat) return; // Component missing material

        const decayIntensity = decayState.intensity;

        // === RING INSTABILITY ===
        // Ring becomes less regular and visible
        const baseOpacity = 0.4;
        
        // Glitch causes opacity to flicker dramatically at high decay
        const glitchFlicker = Math.sin(this.glitchPhase * 3.0) * decayIntensity * 0.3;
        const decayedOpacity = baseOpacity * (1.0 - decayIntensity * 0.5) + glitchFlicker;
        
        mat.opacity = Math.max(0.0, Math.min(1.0, decayedOpacity));

        // === COLOR CORRUPTION ===
        if (mat.color) {
            const hsl = {};
            mat.color.getHSL(hsl);

            // Hue shifts toward red as decay increases
            hsl.h += decayState.discolorationHue * 0.8;
            
            // Desaturation
            hsl.s *= (1.0 - decayIntensity * 0.6);
            
            // Darkness increases
            hsl.l *= (1.0 - decayIntensity * 0.2);

            mat.color.setHSL(hsl.h, hsl.s, hsl.l);
        }

        // Store decay state for external use (e.g., timing adjustments)
        // Safely initialize userData
        if (!pulseRing.userData) pulseRing.userData = {};
        pulseRing.userData.decayLevel = decayIntensity;
        
        // High decay causes ring speed to become erratic
        if (decayIntensity > 0.5) {
            pulseRing.userData.speedJitter = Math.sin(this.glitchPhase) * decayIntensity * 0.3;
        }
    }

    /**
     * Apply decay effects to arc discharges
     */
    applyArcDischargeDecay(arcDischarges, decayState) {
        if (!arcDischarges) return;

        // Verify arc discharge has required methods
        if (typeof arcDischarges.getConfig !== 'function' || typeof arcDischarges.setConfig !== 'function') {
            return; // Component doesn't support configuration
        }

        const decayIntensity = decayState.intensity;

        // === ARC DISRUPTION ===
        // Decay disrupts arc generation and appearance
        const currentConfig = arcDischarges.getConfig();
        if (!currentConfig) return; // Safety check

        const newConfig = {
            // Spawn interval increases (fewer arcs) as decay increases
            spawnInterval: (currentConfig.spawnInterval || 0.25) * (1.0 + decayIntensity * 0.8),
            
            // Arc lifetime reduced
            arcLifetime: (currentConfig.arcLifetime || 0.08) * (1.0 - decayIntensity * 0.4),
            
            // Fewer arcs spawned per burst
            arcsPerBurst: Math.max(1, Math.floor((currentConfig.arcsPerBurst || 5) * (1.0 - decayIntensity * 0.5))),
            
            // Arcs become smaller and jerkier
            arcLength: (currentConfig.arcLength || 0.15) * (1.0 - decayIntensity * 0.4),
            
            // Much higher jitter (erratic paths)
            jitterAmount: (currentConfig.jitterAmount || 0.05) * (1.0 + decayIntensity * 1.5),
            
            // Radius reduced with decay
            radiusScale: (currentConfig.radiusScale || 1.0) * (1.0 - decayIntensity * 0.5),
        };

        arcDischarges.setConfig(newConfig);

        // Update arc colors with decay-based corruption
        // Safely check for activeArcs array
        if (arcDischarges.activeArcs && Array.isArray(arcDischarges.activeArcs) && arcDischarges.activeArcs.length > 0) {
            arcDischarges.activeArcs.forEach((arc, idx) => {
                // Verify arc has required properties before accessing
                if (!arc || !arc.material || !arc.material.color) return;
                
                const hsl = {};
                arc.material.color.getHSL(hsl);
                
                // Shift toward red/orange corruption
                hsl.h += decayState.discolorationHue * 1.2;
                
                // Desaturate
                hsl.s *= (1.0 - decayIntensity * 0.7);
                
                arc.material.color.setHSL(hsl.h, hsl.s, hsl.l);
                
                // Reduce visibility
                arc.material.opacity = (arc.material.opacity || 0.7) * (1.0 - decayIntensity * 0.4);
            });
        }
    }

    /**
     * Dispose
     */
    dispose() {
        // Lightweight applier; no resources
    }
}
