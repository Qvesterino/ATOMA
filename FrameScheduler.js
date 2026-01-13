/**
 * FrameScheduler - Layered frequency control for ATOMA engine
 * 
 * Provides time-based layer scheduling to control update frequency
 * of different system types without modifying their internals.
 * 
 * ====================================
 * PHASE B: Controlled Registration
 * ====================================
 * - Explicit registration of systems to layers
 * - Per-layer execution based on frequency
 * - Side-by-side execution (parallel to existing flow)
 * - No throttling of existing systems
 * - No authority over game loop (Phase C)
 * 
 * Layers:
 * - realtime: 60 Hz (critical systems: camera, input, core rendering)
 * - visual: 30 Hz (visual effects, shaders, auras)
 * - simulation: 10 Hz (AI, glyphs, metrics, slow simulation)
 * - background: 2 Hz (rare events, narrative, consciousness)
 */
class FrameScheduler {
    constructor() {
        // Define layer configurations with target frequencies (Hz)
        this.layers = {
            realtime: {
                targetHz: 60,
                interval: 1 / 60,
                accumulator: 0,
                functions: []
            },
            visual: {
                targetHz: 30,
                interval: 1 / 30,
                accumulator: 0,
                functions: []
            },
            simulation: {
                targetHz: 10,
                interval: 1 / 10,
                accumulator: 0,
                functions: []
            },
            background: {
                targetHz: 2,
                interval: 1 / 2,
                accumulator: 0,
                functions: []
            }
        };
        
        this.totalRegistered = 0;
        this.tickCount = 0;
        
        // Phase B: Track registered systems with IDs for management
        this.registeredSystems = {}; // id -> { layer, fn }
    }

    /**
     * Phase B: Register a function to a specific layer
     * 
     * @param {string} layerName - Name of layer (realtime, visual, simulation, background)
     * @param {Function} fn - Function to execute. Will receive deltaTime as argument.
     * @param {string} [id] - Optional unique identifier for the system (enables unregister)
     * @returns {boolean} - True if registration successful, false otherwise
     */
    register(layerName, fn, id = undefined) {
        if (!this.layers[layerName]) {
            console.error(`[FrameScheduler] Unknown layer: ${layerName}. Available layers: realtime, visual, simulation, background`);
            return false;
        }

        if (typeof fn !== 'function') {
            console.error(`[FrameScheduler] Registered item is not a function`);
            return false;
        }

        // Phase B: Track system by ID if provided
        if (id) {
            if (this.registeredSystems[id]) {
                console.warn(`[FrameScheduler] System with ID '${id}' already registered. Use unregister() first.`);
                return false;
            }
            this.registeredSystems[id] = {
                layer: layerName,
                fn: fn
            };
            console.log(`[FrameScheduler] Registered '${id}' to ${layerName} layer`);
        }

        this.layers[layerName].functions.push(fn);
        this.totalRegistered++;

        return true;
    }

    /**
     * Phase B: Unregister a system by ID
     * 
     * @param {string} id - System identifier to unregister
     * @returns {boolean} - True if unregistered, false if not found
     */
    unregister(id) {
        if (!this.registeredSystems[id]) {
            console.warn(`[FrameScheduler] System '${id}' not found`);
            return false;
        }

        const system = this.registeredSystems[id];
        const layerName = system.layer;

        // Remove from layer functions array
        const index = this.layers[layerName].functions.indexOf(system.fn);
        if (index > -1) {
            this.layers[layerName].functions.splice(index, 1);
            this.totalRegistered--;
        }

        // Clean up tracking
        delete this.registeredSystems[id];
        console.log(`[FrameScheduler] Unregistered '${id}' from ${layerName} layer`);

        return true;
    }

    /**
     * Phase B: Check if a system is registered
     * 
     * @param {string} id - System identifier
     * @returns {boolean}
     */
    isRegistered(id) {
        return this.registeredSystems[id] !== undefined;
    }

    /**
     * Main tick - called every frame with deltaTime
     * Executes registered functions when their layer's interval is reached
     * 
     * @param {number} deltaTime - Time since last frame in seconds
     */
    tick(deltaTime) {
        this.tickCount++;

        // Process each layer
        for (const [layerName, layer] of Object.entries(this.layers)) {
            // Accumulate time for this layer
            layer.accumulator += deltaTime;

            // Check if interval reached
            if (layer.accumulator >= layer.interval) {
                // Execute all functions in this layer
                for (const fn of layer.functions) {
                    try {
                        fn(deltaTime);
                    } catch (error) {
                        console.error(`[FrameScheduler] Error in ${layerName} layer function:`, error);
                        // Continue execution - do not crash
                    }
                }

                // Subtract the interval (handle potential multiple ticks)
                layer.accumulator -= layer.interval;
            }
        }
    }

    /**
     * Phase B: Get registration statistics with system IDs
     * @returns {Object} Statistics about registered functions per layer
     */
    getStats() {
        const stats = {
            total: this.totalRegistered,
            ticks: this.tickCount,
            layers: {},
            registeredSystems: Object.keys(this.registeredSystems)
        };

        for (const [layerName, layer] of Object.entries(this.layers)) {
            stats.layers[layerName] = {
                targetHz: layer.targetHz,
                registered: layer.functions.length
            };
        }

        return stats;
    }

    /**
     * Phase B: List all registered systems organized by layer
     * @returns {Object} Layer-organized system list
     */
    listSystems() {
        const result = {};

        Object.keys(this.layers).forEach(layer => {
            result[layer] = {
                systems: [],
                count: 0
            };
        });

        // Populate with registered system IDs
        Object.entries(this.registeredSystems).forEach(([id, system]) => {
            if (result[system.layer]) {
                result[system.layer].systems.push(id);
                result[system.layer].count++;
            }
        });

        return result;
    }

    /**
     * Print scheduler summary to console
     */
    logSummary() {
        const stats = this.getStats();
        console.log('%c[FrameScheduler] Initialization Complete', 'color: #00ff00; font-weight: bold');
        console.log(`[FrameScheduler] Total registered functions: ${stats.total}`);
        console.log('[FrameScheduler] Layer breakdown:');
        for (const [layerName, layerStats] of Object.entries(stats.layers)) {
            console.log(`  - ${layerName}: ${layerStats.registered} functions @ ${layerStats.targetHz} Hz`);
        }
    }

    /**
     * Phase B: Clear all registered functions (for reset scenarios)
     */
    clear() {
        for (const layer of Object.values(this.layers)) {
            layer.functions = [];
            layer.accumulator = 0;
        }
        this.registeredSystems = {};
        this.totalRegistered = 0;
        this.tickCount = 0;
        console.log('[FrameScheduler] Cleared all registrations');
    }
}
export { FrameScheduler };
// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrameScheduler;
}

