import * as THREE from 'three';

/**
 * LinkEnergyWave
 * ============================================================================
 * A unified energy flow effect that propagates along the full length of a link.
 * 
 * SYSTEM BEHAVIOR:
 * - Single continuous wave travels from source node (t=0) to target node (t=1)
 * - Each braided strand receives a phase-shifted version of the wave
 * - Modulates emissive intensity per-strand using sine waves
 * - Creates visual impression of rotating/spiraling energy through the rope
 * - Zero geometry spawning; modifies only material properties
 * 
 * PHYSICS:
 * - Wave frequency and intensity scale with synergy/traffic
 * - No particles, no additional meshes
 * - Uses existing strand materials for all effects
 */
export class LinkEnergyWave {
    constructor() {
        // Flow state
        this.flowTime = 0;
        
        // Configuration (exposed for future tuning)
        this.config = {
            baseWaveSpeed: 1.5,      // Full traversal per N seconds
            waveFrequency: 3.0,       // Oscillations per traversal
            baseIntensity: 0.6,       // Base emissive modulation (0-1)
            peakIntensity: 1.4,       // Peak emissive intensity multiplier
            trafficBoost: 1.2,        // Multiplier per traffic unit
            synergyBoost: 0.8,        // Multiplier per synergy unit
        };
        
        // Math cache
        this._vec3Cache = new THREE.Vector3();
    }

    /**
     * Update the energy wave state and apply to strands
     * @param {Array} strands - Array of THREE.Mesh objects (the braided strands)
     * @param {number} deltaTime - Frame time delta
     * @param {number} synergy - Synergy score (0-1)
     * @param {number} traffic - Traffic load (0-1)
     * @param {number} baseEmissiveIntensity - Starting emissive intensity for materials
     */
    update(strands, deltaTime, synergy = 0.5, traffic = 0, baseEmissiveIntensity = 1.2) {
        if (!strands || strands.length === 0) return;

        // Advance global wave time
        this.flowTime += deltaTime;

        // Calculate wave parameters
        const speedMult = 1.0 + (traffic * this.config.trafficBoost) + (synergy * this.config.synergyBoost);
        const waveSpeed = this.config.baseWaveSpeed * speedMult;
        
        // Normalized wave position (0 -> 1 over one cycle)
        const wavePosition = (this.flowTime / waveSpeed) % 1.0;

        // Modulation intensity increases with synergy and traffic
        const intensityMult = this.config.baseIntensity + (synergy * 0.3) + (traffic * 0.2);

        // Apply wave to each strand with phase offset
        strands.forEach((strand, strandIndex) => {
            if (!strand || !strand.material) return;

            // Phase offset for this strand (spreads the wave across all strands)
            // Creates the spiraling/rotating effect
            const strandCount = strands.length;
            const phaseOffset = (strandIndex / strandCount) * Math.PI * 2;

            // Calculate wave influence at this strand
            // sin(flowT + phaseOffset) creates the phase-shifted oscillation
            const flowInfluence = Math.sin(wavePosition * Math.PI * 2 + phaseOffset);
            
            // Also add a secondary high-frequency component for more complex motion
            const ripple = Math.sin(wavePosition * Math.PI * this.config.waveFrequency + phaseOffset) * 0.4;
            
            // Combine influences: base + primary wave + ripple
            const totalInfluence = flowInfluence + ripple;
            
            // Map influence (-1 to +1 range) to emissive intensity
            // Normalized: 0.0 at -1.0, 1.0 at +1.0
            const normalizedInfluence = (totalInfluence + 1.0) / 2.0;
            
            // Final emissive intensity: base + modulation
            const modulation = this.config.baseIntensity + (normalizedInfluence * this.config.peakIntensity - this.config.baseIntensity);
            const finalIntensity = baseEmissiveIntensity * (modulation * intensityMult);

            // Apply to material
            strand.material.emissiveIntensity = Math.max(0.2, Math.min(3.0, finalIntensity));
        });
    }

    /**
     * Update using a curve reference (alternative if you have curve data)
     * This can be extended for curve-based wave analysis in future
     */
    updateWithCurve(strands, curve, deltaTime, synergy = 0.5, traffic = 0) {
        // Currently same as regular update, but curve reference is available for future
        // extended effects like curvature-based intensity modulation
        this.update(strands, deltaTime, synergy, traffic);
    }

    /**
     * Get current wave progress (0-1)
     */
    getWaveProgress(waveSpeed = this.config.baseWaveSpeed) {
        return (this.flowTime / waveSpeed) % 1.0;
    }

    /**
     * Reset wave state (useful for link state changes)
     */
    reset() {
        this.flowTime = 0;
    }

    /**
     * Set configuration parameters for tuning
     */
    setConfig(configOverrides) {
        Object.assign(this.config, configOverrides);
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
