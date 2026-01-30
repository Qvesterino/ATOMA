import { filterReadyNodes } from './NodeVisualReadinessGate_v1.js';

/**
 * EXTRACTION PACK V1.1 — FX RUNTIME
 * 
 * FXRuntime_v1: Centralized orchestration for all global FX systems
 * 
 * PURPOSE:
 * - Provide unified interface for global FX management
 * - Initialize all FX systems in consistent order
 * - Update all FX systems with single call
 * - Centralize FX cleanup on transitions/shutdown
 * - No FX logic is moved or rewritten (purely orchestration)
 * 
 * SAFETY:
 * ✅ 100% orchestration wrapper (calls only existing methods)
 * ✅ No FX logic moved from main.js
 * ✅ No logic rewriting or replacing
 * ✅ Safe optional chaining throughout
 * ✅ Defensive error handling with logging
 * ✅ Fully reversible via dispose()
 * ✅ No dependencies on main.js internals
 * 
 * FX SYSTEMS ORCHESTRATED:
 * - Node FX: Node-level visual effects
 * - Link FX: Link-level visual effects
 * - World FX: Global world effects
 * - Personality FX: Personality-driven effects
 * - Shader FX: GPU shader effects
 * - Aura FX: Node/link aura effects
 * - Event FX: Event-driven effects
 * - Camera FX: Camera effects
 * - Weather FX: Environment effects
 * - Legendary FX: Special effects
 * 
 * INTEGRATION:
 *   import { FXRuntime_v1 } from './FXRuntime_v1.js';
 *   
 *   this.fxRuntime_v1 = new FXRuntime_v1({ game: this });
 *   this.fxRuntime_v1.init?.();  // Initialize all FX
 *   
 *   // In animate loop:
 *   this.fxRuntime_v1?.update?.(deltaTime);
 *   
 *   // On cleanup:
 *   this.fxRuntime_v1?.dispose?.();
 */
console.log("FXRuntime LOADED");
export class FXRuntime_v1 {
    /**
     * Initialize FX runtime orchestration
     * 
     * @param {Object} config - Configuration object
     * @param {Object} config.game - Reference to main.js AtomaGame instance
     */
    constructor({ game }) {
        if (!game) {
            console.warn('[FXRuntime_v1] No game reference provided');
        }
        this.game = game;
        
        // Build FX system registry from main.js references
        this.fxSystems = {
            // World FX Systems
            worldFXPack: game?.worldFXPack || null,
            worldEvents: game?.worldEvents || null,
            worldPersonalityController: game?.worldPersonalityController || null,
            
            // Visual FX Systems
            personalityFX: game?.personalityFX || null,
            personalityVFXLayer: game?.personalityVFXLayer || null,
            personalityShaderBridge: game?.personalityShaderBridge || null,
            advancedShaderFX: game?.advancedShaderFX || null,
            
            // Aura FX Systems
            nodeAuraSystem: game?.nodeAuraSystem || null,
            linkAuraSystem: game?.linkAuraSystem || null,
            archetypeAuraFX: game?.archetypeAuraFX || null,
            
            // Color & Shader FX
            archetypeColorFX: game?.archetypeColorFX || null,
            archetypeShaderModes: game?.archetypeShaderModes || null,
            
            // Environmental FX
            weatherPack: game?.weatherPack || null,
            
            // Event FX
            legendaryPack: game?.legendaryPack || null,
            legendaryLinkFX: game?.legendaryLinkFX || null,
            evolvingLinkFX: game?.evolvingLinkFX || null,
            
            // Metrics & Visual FX
            metricsVisualFX: game?.metricsVisualFX || null,
            safeMetricsFX: game?.safeMetricsFX || null,
            
            // Memory & Quantum FX
            memoryTrails: game?.memoryTrails || null,
            quantumIllusions: game?.quantumIllusions || null,
            
            // Ambient FX
            ambientEntityManager: game?.ambientEntityManager || null,
            
            // Dream Depth FX
            dreamDepthEffects: game?.dreamDepthEffects || null,
            
            // Glyph FX
            glyphLayer: game?.glyphLayer || null,
            
            // Narrative & AI FX
            narrativePatterns: game?.narrativePatterns || null,
            aiConsciousnessLayer: game?.aiConsciousnessLayer || null,
            thoughtStorms: game?.emergentThoughtStorms || null,
        };

        const activeSystems = Object.values(this.fxSystems).filter(s => s !== null).length;
        if (activeSystems === 0) {
            console.warn('[FXRuntime_v1] No FX systems available for orchestration');
        }
    }

    /**
     * Initialize all FX systems
     * Called once during game startup
     */
    init() {
        if (!this.game) {
            console.warn('[FXRuntime_v1] Cannot init: no game reference');
            return;
        }

        try {
            for (const [name, fx] of Object.entries(this.fxSystems)) {
                if (!fx) continue;  // Skip null/undefined systems
                
                try {
                    // Call init if it exists
                    if (fx.init && typeof fx.init === 'function') {
                        fx.init();
                    }
                    // Some systems may use initialize instead
                    else if (fx.initialize && typeof fx.initialize === 'function') {
                        fx.initialize();
                    }
                } catch (err) {
                    // Log individual system failures but continue with others
                    console.warn(`[FXRuntime_v1] Failed to init ${name}:`, err.message);
                }
            }
        } catch (err) {
            console.warn('[FXRuntime_v1] init error:', err.message);
        }
    }

    /**
     * Update all FX systems
     * Called once per frame in animate loop
     * 
     * @param {number} delta - Frame delta time (seconds)
     */

update(delta) {
    try {
        for (const [name, fx] of Object.entries(this.fxSystems)) {
            if (!fx) continue;

            try {
                // Prefer update(delta, nodes) if supported
                if (fx.update.length >= 2) {
                    const nodes = this.game?.nodeManager?.nodes;

                    if (!nodes) continue;

                    let nodeArray = nodes;
                    if (nodes instanceof Map) {
                        nodeArray = Array.from(nodes.values());
                    }

                    if (!Array.isArray(nodeArray) || nodeArray.length === 0) continue;

                    fx.update(delta, nodeArray);
                } else {
                    fx.update(delta);
                }

            } catch (err) {
                // 🔇 MUTE ERROR AFTER FIRST OCCURRENCE
                if (!this._fxErrorOnce) this._fxErrorOnce = {};

                if (!this._fxErrorOnce[name]) {
                    console.warn(
                        `[FXRuntime_v1] Update failed for ${name} (muted after first):`,
                        err.message
                    );
                    this._fxErrorOnce[name] = true;
                }
            }
        }
    } catch (err) {
        console.warn('[FXRuntime_v1] update error:', err.message);
    }
}

    /**
     * Dispose and cleanup all FX systems
     * Called during world transitions or shutdown
     */
    dispose() {
        try {
            for (const [name, fx] of Object.entries(this.fxSystems)) {
                if (!fx) continue;  // Skip null/undefined systems
                
                try {
                    // Call dispose if it exists
                    if (fx.dispose && typeof fx.dispose === 'function') {
                        fx.dispose();
                    }
                    // Some systems may use cleanup or disable instead
                    else if (fx.disableAll && typeof fx.disableAll === 'function') {
                        fx.disableAll();
                    }
                    else if (fx.cleanup && typeof fx.cleanup === 'function') {
                        fx.cleanup();
                    }
                    else if (fx.disable && typeof fx.disable === 'function') {
                        fx.disable();
                    }
                } catch (err) {
                    // Log individual system failures but continue with others
                    console.warn(`[FXRuntime_v1] Failed to dispose ${name}:`, err.message);
                }
            }
        } catch (err) {
            console.warn('[FXRuntime_v1] dispose error:', err.message);
        }

        // Clear FX system references for GC
        for (const key of Object.keys(this.fxSystems)) {
            this.fxSystems[key] = null;
        }
        this.fxSystems = null;
        this.game = null;
    }

    /**
     * Get count of active FX systems
     */
    getActiveSystemCount() {
        return Object.values(this.fxSystems || {}).filter(s => s !== null).length;
    }

    /**
     * Get list of active FX system names
     */
    getActiveSystemNames() {
        return Object.entries(this.fxSystems || {})
            .filter(([_, fx]) => fx !== null)
            .map(([name, _]) => name);
    }

    /**
     * Pause/mute all FX systems
     */
    pauseAll() {
        try {
            for (const fx of Object.values(this.fxSystems)) {
                if (!fx) continue;
                if (fx.pause && typeof fx.pause === 'function') {
                    fx.pause();
                }
                if (fx.mute && typeof fx.mute === 'function') {
                    fx.mute();
                }
                if (fx.disable && typeof fx.disable === 'function') {
                    fx.disable();
                }
            }
        } catch (err) {
            console.warn('[FXRuntime_v1] pauseAll error:', err.message);
        }
    }

    /**
     * Resume/unmute all FX systems
     */
    resumeAll() {
        try {
            for (const fx of Object.values(this.fxSystems)) {
                if (!fx) continue;
                if (fx.resume && typeof fx.resume === 'function') {
                    fx.resume();
                }
                if (fx.unmute && typeof fx.unmute === 'function') {
                    fx.unmute();
                }
                if (fx.enable && typeof fx.enable === 'function') {
                    fx.enable();
                }
            }
        } catch (err) {
            console.warn('[FXRuntime_v1] resumeAll error:', err.message);
        }
    }
}
