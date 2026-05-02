import * as THREE from 'three';

// Private symbol to track patched materials - prevents repeated shader compilation
const SHADER_MODE_PATCHED = Symbol('shaderModePatched');

/**
 * ShaderModeState: Per-node/link shader mode state tracking
 */
class ShaderModeState {
    constructor(archetypeId = 0) {
        this.archetypeId = archetypeId;

        // Current uniform values (smoothed)
        this.currentIntensity = 0.5;
        this.targetIntensity = 0.5;

        this.currentDistortion = 0.0;
        this.targetDistortion = 0.0;

        this.currentBloom = 0.5;
        this.targetBloom = 0.5;

        this.currentHueShift = 0.0;
        this.targetHueShift = 0.0;

        this.currentNoiseShift = 0.0;
        this.targetNoiseShift = 0.0;

        this.currentGradientMix = 0.5;
        this.targetGradientMix = 0.5;

        this.currentIridescence = 0.0;
        this.targetIridescence = 0.0;

        // EMA smoothing constant (α ∈ [0, 1])
        this.emaAlpha = 0.12;
    }

    /**
     * Smoothly interpolate current → target using EMA
     */
    smooth(deltaTime) {
        const factor = Math.min(1.0, this.emaAlpha * deltaTime * 60.0);  // Normalize to 60 FPS

        this.currentIntensity += (this.targetIntensity - this.currentIntensity) * factor;
        this.currentDistortion += (this.targetDistortion - this.currentDistortion) * factor;
        this.currentBloom += (this.targetBloom - this.currentBloom) * factor;
        this.currentHueShift += (this.targetHueShift - this.currentHueShift) * factor;
        this.currentNoiseShift += (this.targetNoiseShift - this.currentNoiseShift) * factor;
        this.currentGradientMix += (this.targetGradientMix - this.currentGradientMix) * factor;
        this.currentIridescence += (this.targetIridescence - this.currentIridescence) * factor;
    }
}

/**
 * ArchetypeShaderModes_v1: GPU-driven personality shader modes
 */
export class ArchetypeShaderModes_v1 {
    constructor(config = {}) {
        this.archetypeCurves = config.archetypeCurves;
        this.archetypeAuraFX = config.archetypeAuraFX;
        this.archetypeColorFX = config.archetypeColorFX;
        this.nodeAuraSystem = config.nodeAuraSystem;
        this.linkAuraSystem = config.linkAuraSystem;
        this.debugEnabled = config.debugEnabled || false;
        this.frameScheduler = config.frameScheduler || null;

        // Per-node/link shader mode state (WeakMap for automatic GC)
        this.nodeStates = new WeakMap();
        this.linkStates = new WeakMap();

        // Performance monitoring
        this.lastUpdateTime = 0;
        this.frameUpdateTime = 0;

        if (this.debugEnabled) {
            console.log('✓ [ArchetypeShaderModes_v1] Initialized');
        }
    }

    /**
     * Get or create shader mode state for a node
     */
    getNodeState(node) {
        if (!this.nodeStates.has(node)) {
            const archetypeId = this._getArchetypeId(node);
            this.nodeStates.set(node, new ShaderModeState(archetypeId));
        }
        return this.nodeStates.get(node);
    }

    /**
     * Get or create shader mode state for a link
     */
    getLinkState(link) {
        if (!this.linkStates.has(link)) {
            this.linkStates.set(link, new ShaderModeState(0));  // Links default to Sage
        }
        return this.linkStates.get(link);
    }

    /**
     * Extract archetype ID from node's archetype evolution data
     */
    _getArchetypeId(node) {
        if (!node || !node.userData || !node.userData.archetypeEvolution) {
            return 0;  // Default to Sage
        }

        const archetypeId = node.userData.archetypeEvolution.archetypeId;
        if (typeof archetypeId === 'string') {
            const archetypeMap = {
                'sage': 0,
                'warlock': 1,
                'sentinel': 2,
                'empath': 3,
                'invoker': 4,
                'mythic': 5,
            };
            return archetypeMap[archetypeId.toLowerCase()] || 0;
        }
        return archetypeId || 0;
    }

    /**
     * Compute shader mode parameters from ascension + personality signals
     */
    _computeModeParams(node) {
        const state = this.getNodeState(node);

        if (!node || !node.userData) {
            return;  // Graceful fallback
        }

        const archetypeEv = node.userData.archetypeEvolution || {};
        const ascensionMult = archetypeEv.ascensionMultiplier || 1.0;
        const tier = archetypeEv.ascensionTier || 0;
        const archetypeId = state.archetypeId;

        // Base personality signals (defensive)
        const clarity = node.userData.personalitySignals?.clarity || 0.5;
        const harmony = node.userData.personalitySignals?.harmony || 0.5;
        const resonance = node.userData.personalitySignals?.resonance || 0.5;
        const corruption = node.userData.personalitySignals?.corruption || 0.0;
        const entropy = node.userData.personalitySignals?.entropy || 0.0;
        const focus = node.userData.personalitySignals?.focus || 0.5;
        const energy = node.userData.personalitySignals?.energy || 0.5;

        // ========================================================================
        // ARCHETYPE-SPECIFIC SHADER MODE COMPUTATION
        // ========================================================================

        switch (archetypeId) {
            case 0:  // SAGE MODE: Clarity-Shifting Bloom
                state.targetIntensity = 0.4 + clarity * 0.4;
                state.targetDistortion = 0.1 * (1.0 - clarity);
                state.targetBloom = 0.3 + clarity * 0.5;
                state.targetHueShift = clarity * 0.3;
                state.targetNoiseShift = 0.1 * (1.0 - clarity);
                state.targetGradientMix = 0.3 + clarity * 0.4;
                state.targetIridescence = 0.0;
                break;

            case 1:  // WARLOCK MODE: Chaos Tearing
                state.targetIntensity = 0.6 + entropy * 0.6;
                state.targetDistortion = 0.5 + corruption * 0.5;
                state.targetBloom = 0.7 + entropy * 0.3;
                state.targetHueShift = -0.3 + corruption * 0.6;
                state.targetNoiseShift = 0.8 + entropy * 0.2;
                state.targetGradientMix = 0.7 + (1.0 - corruption) * 0.2;
                state.targetIridescence = 0.0;
                break;

            case 2:  // SENTINEL MODE: Ordered Waveform
                state.targetIntensity = 0.5 + harmony * 0.3;
                state.targetDistortion = 0.1 * harmony;
                state.targetBloom = 0.4 * harmony;
                state.targetHueShift = 0.1;
                state.targetNoiseShift = 0.05 * (1.0 - harmony);
                state.targetGradientMix = 0.4 + harmony * 0.2;
                state.targetIridescence = 0.0;
                break;

            case 3:  // EMPATH MODE: Harmonic Resonance
                state.targetIntensity = 0.5 + resonance * 0.5;
                state.targetDistortion = 0.2 * resonance;
                state.targetBloom = 0.5 + resonance * 0.3;
                state.targetHueShift = 0.2 * resonance;
                state.targetNoiseShift = 0.3 * resonance;
                state.targetGradientMix = 0.5 + resonance * 0.3;
                state.targetIridescence = 0.0;
                break;

            case 4:  // INVOKER MODE: Radiant Energy
                state.targetIntensity = 0.6 + energy * 0.4;
                state.targetDistortion = 0.3 + focus * 0.2;
                state.targetBloom = 0.8 + energy * 0.2;
                state.targetHueShift = 0.3 + focus * 0.2;
                state.targetNoiseShift = 0.2 * energy;
                state.targetGradientMix = 0.7 + focus * 0.2;
                state.targetIridescence = 0.0;
                break;

            case 5:  // MYTHIC MODE: Transcendent Iridescent
                state.targetIntensity = 0.7 + ascensionMult * 0.2;
                state.targetDistortion = 0.4 + (tier > 0 ? 0.2 : 0);
                state.targetBloom = 0.9 + ascensionMult * 0.1;
                state.targetHueShift = 0.5 + ascensionMult * 0.3;
                state.targetNoiseShift = 0.5 + ascensionMult * 0.2;
                state.targetGradientMix = 0.6 + ascensionMult * 0.3;
                state.targetIridescence = 0.5 + Math.min(1.0, ascensionMult * 0.5);
                break;

            default:
                state.targetIntensity = 0.5;
                state.targetDistortion = 0.2;
                state.targetBloom = 0.5;
                state.targetHueShift = 0.0;
                state.targetNoiseShift = 0.2;
                state.targetGradientMix = 0.5;
                state.targetIridescence = 0.0;
        }

        // Apply ascension level scaling (all modes respond to ascension)
        const ascensionScale = Math.min(2.0, 0.5 + ascensionMult * 1.5);
        state.targetIntensity *= ascensionScale * 0.7 + 0.3;  // Scale but keep baseline
        state.targetBloom *= ascensionScale;
    }

    /**
     * Patch a material with shader mode uniforms
     * 
     * P0.1 FIX: Idempotent patching - only patches once per material to prevent
     * repeated shader recompilation and GPU frame spikes.
     */
    _patchMaterial(material, archetypeId = 0) {
        // Guard: Only patch once per material
        if (material[SHADER_MODE_PATCHED]) {
            return;  // Already patched
        }

        // Mark material as patched
        material[SHADER_MODE_PATCHED] = true;

        // Store original onBeforeCompile (if any)
        const originalOnBeforeCompile = material.onBeforeCompile;

        material.onBeforeCompile = (shader) => {
            // Call original if it exists
            if (originalOnBeforeCompile) {
                originalOnBeforeCompile.call(material, shader);
            }

            // Inject shader mode uniforms into vertex shader
            shader.uniforms.uShaderModeId = { value: archetypeId };
            shader.uniforms.uModeIntensity = { value: 0.5 };
            shader.uniforms.uModeDistortion = { value: 0.2 };
            shader.uniforms.uModeBloom = { value: 0.5 };
            shader.uniforms.uModeHueShift = { value: 0.0 };
            shader.uniforms.uModeNoiseShift = { value: 0.2 };
            shader.uniforms.uModeGradientMix = { value: 0.5 };
            shader.uniforms.uModeIridescence = { value: 0.0 };

            // Inject into vertex shader
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `
        #include <common>
        
        uniform int uShaderModeId;
        uniform float uModeIntensity;
        uniform float uModeDistortion;
        uniform float uModeBloom;
        uniform float uModeHueShift;
        uniform float uModeNoiseShift;
        uniform float uModeGradientMix;
        uniform float uModeIridescence;
        `
            );

            // Inject into fragment shader
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `
        #include <common>
        
        uniform int uShaderModeId;
        uniform float uModeIntensity;
        uniform float uModeDistortion;
        uniform float uModeBloom;
        uniform float uModeHueShift;
        uniform float uModeNoiseShift;
        uniform float uModeGradientMix;
        uniform float uModeIridescence;
        `
            );
        };
    }

    /**
     * Update node aura materials with shader mode uniforms
     */
    _updateNodeAuraMaterials(deltaTime) {
        if (!this.nodeAuraSystem || !this.nodeAuraSystem.auras) {
            return;  // No node aura system
        }

        for (const [node, auraInstance] of this.nodeAuraSystem.auras) {
            if (!node || !auraInstance || !auraInstance.material) {
                continue;
            }

            const state = this.getNodeState(node);
            this._computeModeParams(node);
            state.smooth(deltaTime);

            // Patch material if not already done
            if (!auraInstance.material[SHADER_MODE_PATCHED]) {
                this._patchMaterial(auraInstance.material, state.archetypeId);
            }

            // Update uniforms (safe: material has uniforms after compilation)
            if (auraInstance.material.uniforms) {
                auraInstance.material.uniforms.uShaderModeId.value = state.archetypeId;
                auraInstance.material.uniforms.uModeIntensity.value = Math.max(0, Math.min(1, state.currentIntensity));
                auraInstance.material.uniforms.uModeDistortion.value = Math.max(0, Math.min(1, state.currentDistortion));
                auraInstance.material.uniforms.uModeBloom.value = Math.max(0, Math.min(1, state.currentBloom));
                auraInstance.material.uniforms.uModeHueShift.value = Math.max(-1, Math.min(1, state.currentHueShift));
                auraInstance.material.uniforms.uModeNoiseShift.value = Math.max(0, Math.min(1, state.currentNoiseShift));
                auraInstance.material.uniforms.uModeGradientMix.value = Math.max(0, Math.min(1, state.currentGradientMix));
                auraInstance.material.uniforms.uModeIridescence.value = Math.max(0, Math.min(1, state.currentIridescence));
            }
        }
    }

    /**
     * Update link aura materials with shader mode uniforms
     */
    _updateLinkAuraMaterials(deltaTime) {
        if (!this.linkAuraSystem || !this.linkAuraSystem.auras) {
            return;  // No link aura system
        }

        for (const [link, auraInstance] of this.linkAuraSystem.auras) {
            if (!link || !auraInstance || !auraInstance.material) {
                continue;
            }

            const state = this.getLinkState(link);
            state.smooth(deltaTime);

            // Patch material if not already done
            if (!auraInstance.material[SHADER_MODE_PATCHED]) {
                this._patchMaterial(auraInstance.material, 0);  // Links default to Sage
            }

            // Update uniforms (safe: material has uniforms after compilation)
            if (auraInstance.material.uniforms) {
                auraInstance.material.uniforms.uShaderModeId.value = 0;
                auraInstance.material.uniforms.uModeIntensity.value = Math.max(0, Math.min(1, state.currentIntensity));
                auraInstance.material.uniforms.uModeDistortion.value = Math.max(0, Math.min(1, state.currentDistortion));
                auraInstance.material.uniforms.uModeBloom.value = Math.max(0, Math.min(1, state.currentBloom));
                auraInstance.material.uniforms.uModeHueShift.value = Math.max(-1, Math.min(1, state.currentHueShift));
                auraInstance.material.uniforms.uModeNoiseShift.value = Math.max(0, Math.min(1, state.currentNoiseShift));
                auraInstance.material.uniforms.uModeGradientMix.value = Math.max(0, Math.min(1, state.currentGradientMix));
                auraInstance.material.uniforms.uModeIridescence.value = Math.max(0, Math.min(1, state.currentIridescence));
            }
        }
    }

    /**
     * Main update loop (call once per frame, AFTER archetypeColorFX.update)
     */
    update(deltaTime = 0.016) {
        // FrameScheduler gate
        if (this.frameScheduler && typeof this.frameScheduler.shouldRunVisual === 'function') {
            if (!this.frameScheduler.shouldRunVisual()) return;
        }

        const startTime = performance.now();

        try {
            this._updateNodeAuraMaterials(deltaTime);
            this._updateLinkAuraMaterials(deltaTime);
        } catch (err) {
            if (this.debugEnabled) {
                console.error('[ArchetypeShaderModes_v1] Update error:', err);
            }
        }

        this.frameUpdateTime = performance.now() - startTime;

        if (this.debugEnabled && Math.random() < 0.01) {  // Log ~1% of frames
            console.log(`[ArchetypeShaderModes_v1] Update: ${this.frameUpdateTime.toFixed(2)}ms`);
        }
    }

    /**
     * Cleanup and dispose
     */
    dispose() {
        // Clear WeakMaps (will be GC'd automatically)
        // We don't need explicit cleanup since WeakMaps auto-expire with GC

        if (this.debugEnabled) {
            console.log('✓ [ArchetypeShaderModes_v1] Disposed');
        }
    }
}

export default ArchetypeShaderModes_v1;