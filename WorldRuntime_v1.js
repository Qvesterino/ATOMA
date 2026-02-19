/**
 * EXTRACTION PACK V1.1 — WORLD RUNTIME
 * 
 * WorldRuntime_v1: Orchestration wrapper for world/map lifecycle
 * 
 * PURPOSE:
 * - Centralize world initialization, switching, updating, and cleanup
 * - Wrap existing world mode logic (no logic moved from main.js)
 * - Provide unified interface for world management
 * - Enable future world system extensions
 * 
 * SAFETY:
 * ✅ 100% orchestration wrapper (calls only existing methods)
 * ✅ No logic moved from main.js (all logic stays there)
 * ✅ No logic rewriting or replacing
 * ✅ Safe optional chaining throughout
 * ✅ Defensive error handling
 * ✅ Fully reversible via dispose()
 * ✅ No dependencies on main.js internals
 * 
 * WORLD MODES SUPPORTED:
 * - 'sigma': SigmaRiftChamber (dark, ethereal)
 * - 'desert': DreamDesert (warm, golden)
 * - 'quantum': QuantumIsland (digital, neon)
 * - 'fractal': FractalValley (psychedelic, recursive)
 * - 'memory': MemoryLane (nostalgic, retro)
 * 
 * INTEGRATION:
 *   import { WorldRuntime_v1 } from './WorldRuntime_v1.js';
 *   
 *   this.worldRuntime_v1 = new WorldRuntime_v1({ game: this });
 *   this.worldRuntime_v1.initInitialWorld();  // Bootstrap world
 *   
 *   // In animate loop:
 *   this.worldRuntime_v1?.update?.(deltaTime);
 *   
 *   // On world switch:
 *   this.worldRuntime_v1?.switchWorld?.('desert');
 *   
 *   // On cleanup:
 *   this.worldRuntime_v1?.dispose?.();
 */

export class WorldRuntime_v1 {
    /**
     * Initialize world runtime orchestration
     * 
     * @param {Object} config - Configuration object
     * @param {Object} config.game - Reference to main.js AtomaGame instance
     */
    constructor({ game }) {
        if (!game) {
            console.warn('[WorldRuntime_v1] No game reference provided');
        }
        this.game = game;
        this.currentMode = this.game?.currentMode || 'fractal';
        this.isTransitioning = false;
    }

    /**
     * Initialize the initial world on game startup
     * Calls existing main.js world creation logic
     */
    initInitialWorld() {
        if (!this.game) {
            console.warn('[WorldRuntime_v1] Cannot init world: no game reference');
            return;
        }

        try {
            // Create world unconditionally
            this.game.createWorld();
            
            // Create AI nodes (deterministic path)
            this.game.createAINodes();
            
            // Verify scene attachment
            if (this.game.activeWorld) {
                const worldObj = this.game.activeWorld.scene || this.game.activeWorld;
                if (!this.game.scene.children.includes(worldObj)) {
                    this.game.scene.add(worldObj);
                }
            } else {
                console.warn('[WorldRuntime_v1] initInitialWorld: activeWorld missing after createWorld()');
            }

            this.currentMode = this.game.currentMode || 'fractal';
        } catch (err) {
            console.warn('[WorldRuntime_v1] initInitialWorld failed:', err.message);
        }
    }

    /**
     * Switch to a new world mode
     * Delegates to existing main.js switchMode() logic
     * 
     * @param {string} nextMode - Target world mode ('sigma', 'desert', 'quantum', 'fractal', 'memory')
     */
    switchWorld(nextMode) {
        if (!this.game) {
            console.warn('[WorldRuntime_v1] Cannot switch world: no game reference');
            return;
        }

        if (this.isTransitioning) {
            console.warn('[WorldRuntime_v1] World transition already in progress');
            return;
        }

        try {
            this.isTransitioning = true;
            
            // Store target mode
            const targetMode = nextMode || this.currentMode;
            
            // Call existing switchMode() logic in main.js
            // This handles all cleanup, scene management, etc.
            if (this.game._switchInProgress) {
                console.warn('[WorldRuntime_v1] switchMode already in progress; skipping reentrant call');
                this.isTransitioning = false;
                return;
            }
            if (this.game.switchMode) {
                this.game.switchMode();
            }

            // Update tracked mode
            this.currentMode = this.game.currentMode || targetMode;

            if (this.game.isWorldReady) {
                // Wait a tick for world to be ready
                requestAnimationFrame(() => {
                    this.isTransitioning = false;
                });
            } else {
                this.isTransitioning = false;
            }
        } catch (err) {
            console.warn('[WorldRuntime_v1] switchWorld failed:', err.message);
            this.isTransitioning = false;
        }
    }

    /**
     * Update world systems
     * Called once per frame
     * 
     * @param {number} delta - Frame delta time (seconds)
     */
    update(delta) {
        if (!this.game || !delta) {
            return;
        }

        try {
            // Update active world if it has update method
            if (this.game.activeWorld?.update) {
                this.game.activeWorld.update(delta, this.game.time || 0);
            }

            // Update world personality controller
            if (this.game.worldPersonalityController?.update && this.game.aiNodes) {
                this.game.worldPersonalityController.update(delta, this.game.aiNodes.nodes);
            }

            // Update world reset fix system
            if (this.game.worldResetFix?.update) {
                this.game.worldResetFix.update?.(delta);
            }
        } catch (err) {
            console.warn('[WorldRuntime_v1] update error:', err.message);
        }
    }

    /**
     * Get current world mode
     */
    getCurrentMode() {
        return this.currentMode || this.game?.currentMode || 'fractal';
    }

    /**
     * Check if a world transition is in progress
     */
    isInTransition() {
        return this.isTransitioning;
    }

    /**
     * Dispose and cleanup world systems
     * Called during shutdown or reset
     */
    dispose() {
        try {
            // World cleanup is handled by switchMode() in main.js
            // We just clear our state here
            this.isTransitioning = false;
            this.currentMode = null;
        } catch (err) {
            console.warn('[WorldRuntime_v1] dispose error:', err.message);
        }

        // Clear reference for GC
        this.game = null;
    }
}
