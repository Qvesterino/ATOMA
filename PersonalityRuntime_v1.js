/**
 * EXTRACTION PACK V1.0 — PERSONALITY RUNTIME
 * 
 * PersonalityRuntime_v1: Orchestration wrapper for all personality systems
 * 
 * PURPOSE:
 * - Provides unified orchestration interface for personality subsystems
 * - Centralizes personality pipeline (init, update, cleanup)
 * - Maintains separation of concerns without code duplication
 * - Allows personality effects to be managed as a cohesive system
 * 
 * SAFETY:
 * ✅ 100% orchestration wrapper (no logic rewriting)
 * ✅ Reads from provided system references (never modifies them)
 * ✅ Safe optional chaining throughout
 * ✅ Defensive error handling
 * ✅ Fully reversible via dispose()
 * ✅ No dependencies on main.js internals
 * 
 * PERSONALITY PIPELINE:
 * 1. Visual Adapter: Extracts personality signals from nodes
 * 2. VFX Layer: Applies visual effects based on personality
 * 3. Shader Bridge: Binds signals to GPU shaders
 * 4. Shader FX: Advanced GPU-side personality effects
 * 
 * SYSTEMS ORCHESTRATED:
 * - adapter: PersonalityVisualAdapter (signal extraction)
 * - vfx: PersonalityVFXLayer_v1 (visual effects)
 * - shaderBridge: PersonalityShaderBridge_v1 (GPU integration)
 * - shaderFX: PersonalityShaderAdvancedFX_v1 (advanced distortion)
 * 
 * INTEGRATION:
 *   import { PersonalityRuntime_v1 } from './PersonalityRuntime_v1.js';
 *   
 *   this.personalityRuntime_v1 = new PersonalityRuntime_v1({
 *       nodes: this.aiNodes,
 *       personalitySystems: {
 *           adapter: this.personalityVisualAdapter,
 *           vfx: this.personalityVFXLayer,
 *           shaderBridge: this.personalityShaderBridge,
 *           shaderFX: this.advancedShaderFX
 *       }
 *   });
 *   
 *   // In animate loop:
 *   this.personalityRuntime_v1?.update(deltaTime);
 *   
 *   // On cleanup:
 *   this.personalityRuntime_v1?.dispose?.();
 */

export class PersonalityRuntime_v1 {
    /**
     * Initialize personality runtime orchestration
     * 
     * @param {Object} config - Configuration object
     * @param {Object} config.nodes - AI nodes reference
     * @param {Object} config.personalitySystems - Personality systems to orchestrate
     */
    constructor({ nodes, personalitySystems }) {
        this.nodes = nodes;
        this.systems = personalitySystems || {};
        
        if (!this.systems || Object.keys(this.systems).length === 0) {
            console.warn('[PersonalityRuntime_v1] No personality systems provided');
        }
    }

    /**
     * Update all personality systems in order
     * Called once per frame in animate loop
     * 
     * CRITICAL: Update order matters for personality pipeline:
     * 1. Adapter extracts signals → stored in userData
     * 2. VFX applies transforms based on signals
     * 3. Shader bridge reads signals → writes GPU uniforms
     * 4. Shader FX applies GPU-side distortion
     * 
     * @param {number} delta - Frame delta time (seconds)
     */
    update(delta) {
        if (!delta || typeof delta !== 'number') {
            return;  // Defensive: skip invalid delta
        }

        try {
            // Update personality systems in pipeline order
            
            // 1. Visual Adapter: Extract personality signals from nodes
            // Produces: node.userData.personalitySignals
            if (this.systems.adapter?.update) {
                this.systems.adapter.update(delta);
            }

            // 2. VFX Layer: Apply visual effects based on extracted signals
            // Reads: personalitySignals
            // Applies: color, emissive, rotation, jitter, etc.
            if (this.systems.vfx?.update) {
                this.systems.vfx.update(delta, this.nodes);
            }

            // 3. Shader Bridge: Bind personality signals to GPU uniforms
            // Reads: personalitySignals
            // Writes: shader uniforms for emissive, tint, noise
            if (this.systems.shaderBridge?.update) {
                this.systems.shaderBridge.update(delta);
            }

            // 4. Shader FX: Apply advanced GPU distortion effects
            // Reads: personality signals and shader uniforms
            // Applies: procedural distortion, wobble, ripples, etc.
            if (this.systems.shaderFX?.update) {
                this.systems.shaderFX.update(delta);
            }
        } catch (err) {
            // Defensive error handling - log but don't crash
            console.warn('[PersonalityRuntime_v1] update error:', err.message);
        }
    }

    /**
     * Dispose and cleanup personality systems
     * Called during world transitions or shutdown
     */
    dispose() {
        try {
            // Dispose shader FX (most likely to have GPU resources)
            if (this.systems.shaderFX?.dispose) {
                this.systems.shaderFX.dispose();
            }

            // Dispose shader bridge if it has disposal
            if (this.systems.shaderBridge?.dispose) {
                this.systems.shaderBridge.dispose();
            }

            // VFX and adapter typically don't need explicit disposal
            // but check if they have dispose methods
            if (this.systems.vfx?.dispose) {
                this.systems.vfx.dispose();
            }

            if (this.systems.adapter?.dispose) {
                this.systems.adapter.dispose();
            }
        } catch (err) {
            console.warn('[PersonalityRuntime_v1] dispose error:', err.message);
        }

        // Clear references for GC
        this.nodes = null;
        this.systems = null;
    }
}
