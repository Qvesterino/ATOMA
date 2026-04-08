import * as THREE from 'three';

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
            baseIntensity: 1.0,       // Enhanced base emissive modulation (increased from 0.6)
            peakIntensity: 2.0,       // Enhanced peak emissive intensity (increased from 1.4)
            trafficBoost: 1.4,        // Enhanced multiplier per traffic unit (increased from 1.2)
            synergyBoost: 1.0,        // Enhanced multiplier per synergy unit (increased from 0.8)
            // Keep wave readable even on very low-signal links.
            minimumBaseEmissive: 0.55,
            minimumVisibleIntensity: 0.35,
        };
        
        // Math cache
        this._vec3Cache = new THREE.Vector3();
        this._shaderLoadBaseline = new WeakMap();
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
        const DEBUG_WAVE_VISIBLE = true;
        if (!strands || strands.length === 0) return;
        const safeDelta = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
        const safeSynergy = Math.max(0, Math.min(1, Number.isFinite(synergy) ? synergy : 0.5));
        const safeTraffic = Math.max(0, Math.min(1, Number.isFinite(traffic) ? traffic : 0));
        const safeBase = Math.max(this.config.minimumBaseEmissive, Number.isFinite(baseEmissiveIntensity) ? baseEmissiveIntensity : 0);

        // Advance global wave time
        this.flowTime += safeDelta;

        // Calculate wave parameters
        const speedMult = 1.0 + (safeTraffic * this.config.trafficBoost) + (safeSynergy * this.config.synergyBoost);
        const waveSpeed = this.config.baseWaveSpeed * speedMult;
        
        // Normalized wave position (0 -> 1 over one cycle)
        const wavePosition = (this.flowTime / waveSpeed) % 1.0;

        // Modulation intensity increases with synergy and traffic (enhanced impact)
        const intensityMult = this.config.baseIntensity + (safeSynergy * 0.6) + (safeTraffic * 0.4);

        // Apply wave to each strand with phase offset
        strands.forEach((strand, strandIndex) => {
            if (!strand || !strand.material) return;
            const material = strand.material;

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
            const finalIntensity = safeBase * (modulation * intensityMult);
            const boosted = DEBUG_WAVE_VISIBLE
                ? finalIntensity * 3.5
                : finalIntensity;

            // ShaderMaterial path (ATOMA strand shader): drive uLocalLoad pulse directly.
            if (material.uniforms?.uLocalLoad) {
                if (!claimStrandChannel(material, 'uLocalLoad', 'LinkEnergyWave', 200)) {
                    return;
                }
                const rawBaseLoad = material.uniforms.uLocalLoad.value;
                const baseLoad = this._shaderLoadBaseline.has(material)
                    ? this._shaderLoadBaseline.get(material)
                    : Math.max(0, Math.min(1, Number.isFinite(rawBaseLoad) ? rawBaseLoad : safeTraffic));
                this._shaderLoadBaseline.set(material, baseLoad);

                const pulseLoad = Math.max(
                    0,
                    Math.min(1, baseLoad + (normalizedInfluence * 0.65 * (0.6 + safeSynergy * 0.4)))
                );
                material.uniforms.uLocalLoad.value = pulseLoad;
                material.userData = material.userData || {};
                material.userData.__uLocalLoadOwnedByEnergyWave = true;
                return;
            }

            // Lit material fallback (legacy strands with emissive pipeline).
            material.emissiveIntensity = Math.max(
                this.config.minimumVisibleIntensity,
                Math.min(6.0, boosted)
            );
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
