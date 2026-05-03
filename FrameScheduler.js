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
import { debugLog, debugWarn } from './Engine/Debug/DebugLog.js';

const getFrameDebugFlag = () => (typeof window !== 'undefined' && window.ATOMA_DEBUG_FRAME === true);

function frameLog(...args) {
    debugLog(getFrameDebugFlag(), ...args);
}

function frameWarn(...args) {
    debugWarn(getFrameDebugFlag(), ...args);
}

class FrameScheduler {
    // Throttle visual tick debug log to once every 20 seconds
    VISUAL_LOG_INTERVAL_MS = 20000;
    // Phase L.2 load shaping: time gates for non-critical work
    SOFT_INTERVAL_MS = 75;       // soft updates: ~50-100ms
    BACKGROUND_INTERVAL_MS = 300; // background updates: ~250-500ms

    constructor() {
        // Define layer configurations with target frequencies (Hz)
        this.layers = {
            realtime: {
                targetHz: 60,
                interval: 1 / 60,
                accumulator: 0,
                functions: [],
                _pruneCounter: 0
            },
            visual: {
                targetHz: 30,
                interval: 1 / 30,
                accumulator: 0,
                functions: [],
                _pruneCounter: 0
            },
            simulation: {
                targetHz: 10,
                interval: 1 / 10,
                accumulator: 0,
                functions: [],
                _pruneCounter: 0
            },
            background: {
                targetHz: 2,
                interval: 1 / 2,
                accumulator: 0,
                functions: [],
                _pruneCounter: 0
            }
        };
        this._pruneThreshold = 50;
        
        this.totalRegistered = 0;
        this.tickCount = 0;
        
        // Track last visual tick debug log time for throttling
        this._lastVisualLogTime = 0;
        
        // Phase B: Track registered systems with IDs for management
        this.registeredSystems = {}; // id -> { layer, entry }

        // Runtime smoke instrumentation (opt-in via window.ATOMA_FX_AUDIT)
        this._fxAuditState = this._createFxAuditState();
    }

    _createFxAuditState() {
        return {
            enabled: false,
            initializedAt: null,
            sessionStartedAt: null,
            sessionLabel: null,
            entries: [],
            byKey: new Map(),
            seq: 0,
            totalCalls: 0,
            totalErrors: 0,
            windowTimer: null,
            windowDurationMs: 0
        };
    }

    _isFxAuditFlagEnabled() {
        return typeof window !== 'undefined' && window.ATOMA_FX_AUDIT === true;
    }

    _syncFxAuditFlag() {
        if (!this._isFxAuditFlagEnabled()) return;
        if (!this._fxAuditState.enabled) {
            this.enableFxAudit();
            this.startFxAuditWindow(5000, 'auto-5s-smoke');
        }
    }

    _ensureEntryAuditMeta(entry, layerName) {
        if (!entry) return null;
        if (entry._fxAuditMeta) return entry._fxAuditMeta;

        const state = this._fxAuditState;
        const key = entry.id || `${layerName}.anonymous.${++state.seq}`;
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const meta = {
            key,
            id: entry.id || null,
            layer: layerName,
            registeredAt: now,
            callCount: 0,
            firstCallAt: null,
            lastCallAt: null,
            errorCount: 0,
            disabled: false,
            crashed: false,
            lastErrorMessage: null,
            lastErrorAt: null
        };

        entry._fxAuditMeta = meta;
        state.entries.push(meta);
        state.byKey.set(meta.key, meta);
        return meta;
    }

    _markFxAuditCall(entry, layerName) {
        if (!this._fxAuditState.enabled || !entry) return;
        const meta = this._ensureEntryAuditMeta(entry, layerName);
        if (!meta) return;
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        meta.callCount += 1;
        meta.lastCallAt = now;
        if (meta.firstCallAt === null) {
            meta.firstCallAt = now;
        }
        this._fxAuditState.totalCalls += 1;
    }

    _markFxAuditError(entry, layerName, error) {
        if (!this._fxAuditState.enabled || !entry) return;
        const meta = this._ensureEntryAuditMeta(entry, layerName);
        if (!meta) return;
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        meta.errorCount += 1;
        meta.disabled = true;
        meta.crashed = true;
        meta.lastErrorAt = now;
        meta.lastErrorMessage = String(error?.message || error || 'Unknown error');
        this._fxAuditState.totalErrors += 1;
    }

    enableFxAudit() {
        if (!this._isFxAuditFlagEnabled() && typeof window !== 'undefined') {
            window.ATOMA_FX_AUDIT = true;
        }

        const state = this._fxAuditState;
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (!state.initializedAt) {
            state.initializedAt = now;
        }
        state.enabled = true;

        for (const [layerName, layer] of Object.entries(this.layers)) {
            for (const entry of layer.functions) {
                this._ensureEntryAuditMeta(entry, layerName);
            }
        }
    }

    clearFxAuditSession() {
        const state = this._fxAuditState;
        if (state.windowTimer) {
            clearTimeout(state.windowTimer);
            state.windowTimer = null;
        }
        state.sessionStartedAt = null;
        state.sessionLabel = null;
        state.windowDurationMs = 0;
        state.totalCalls = 0;
        state.totalErrors = 0;
        for (const meta of state.entries) {
            meta.callCount = 0;
            meta.firstCallAt = null;
            meta.lastCallAt = null;
            meta.errorCount = 0;
            meta.disabled = false;
            meta.crashed = false;
            meta.lastErrorMessage = null;
            meta.lastErrorAt = null;
        }
        return true;
    }

    startFxAuditWindow(durationMs = 5000, label = 'fx-smoke') {
        this.enableFxAudit();

        const state = this._fxAuditState;
        if (state.windowTimer) {
            clearTimeout(state.windowTimer);
            state.windowTimer = null;
        }

        this.clearFxAuditSession();
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        state.sessionStartedAt = now;
        state.sessionLabel = String(label || 'fx-smoke');
        state.windowDurationMs = Math.max(0, Number(durationMs) || 0);

        state.windowTimer = setTimeout(() => {
            this.dumpFxAuditToConsole(`${state.sessionLabel} (${state.windowDurationMs}ms)`);
            state.windowTimer = null;
        }, state.windowDurationMs);

        return {
            startedAt: state.sessionStartedAt,
            durationMs: state.windowDurationMs,
            label: state.sessionLabel
        };
    }

    getFxAuditSnapshot() {
        const state = this._fxAuditState;
        const entries = state.entries.map((meta) => ({ ...meta }));
        const totalRegistered = entries.length;
        const calledSystems = entries.filter((meta) => meta.callCount > 0).length;
        const silentSystems = entries.filter((meta) => meta.callCount === 0).length;
        const crashedSystems = entries.filter((meta) => meta.crashed === true).length;

        return {
            enabled: state.enabled,
            initializedAt: state.initializedAt,
            sessionStartedAt: state.sessionStartedAt,
            sessionLabel: state.sessionLabel,
            windowDurationMs: state.windowDurationMs,
            totalRegistered,
            calledSystems,
            silentSystems,
            crashedSystems,
            totalCalls: state.totalCalls,
            totalErrors: state.totalErrors,
            entries
        };
    }

    listFxAuditSilentSystems() {
        return this._fxAuditState.entries
            .filter((meta) => meta.callCount === 0)
            .map((meta) => ({
                key: meta.key,
                id: meta.id,
                layer: meta.layer,
                registeredAt: meta.registeredAt
            }));
    }

    dumpFxAuditToConsole(label = 'fx-audit') {
        const snapshot = this.getFxAuditSnapshot();
        const title = `[ATOMA FX AUDIT] ${label}`;
        console.group(title);
        console.log({
            totalRegistered: snapshot.totalRegistered,
            calledSystems: snapshot.calledSystems,
            silentSystems: snapshot.silentSystems,
            crashedSystems: snapshot.crashedSystems,
            totalCalls: snapshot.totalCalls,
            totalErrors: snapshot.totalErrors,
            windowDurationMs: snapshot.windowDurationMs,
            sessionStartedAt: snapshot.sessionStartedAt
        });

        const byLayer = snapshot.entries.reduce((acc, entry) => {
            const key = entry.layer || 'unknown';
            if (!acc[key]) {
                acc[key] = { total: 0, called: 0, silent: 0, calls: 0 };
            }
            acc[key].total += 1;
            acc[key].calls += entry.callCount;
            if (entry.callCount > 0) acc[key].called += 1;
            else acc[key].silent += 1;
            return acc;
        }, {});

        console.log('Layer summary:', byLayer);
        console.table(snapshot.entries
            .slice()
            .sort((a, b) => b.callCount - a.callCount)
            .map((entry) => ({
                id: entry.id || entry.key,
                layer: entry.layer,
                calls: entry.callCount,
                errors: entry.errorCount,
                crashed: entry.crashed
            })));

        const silent = this.listFxAuditSilentSystems();
        if (silent.length > 0) {
            console.log('Silent systems (registered but never called):', silent.length);
            console.table(silent.map((entry) => ({
                id: entry.id || entry.key,
                layer: entry.layer
            })));
        }
        console.groupEnd();
        return snapshot;
    }

    /**
     * Phase L.2: Categorize systems for load shaping
     */
    categorizeSystem(id) {
        if (!id) return 'hard';
        const lowered = id.toLowerCase();
        if (id === 'renderer.render') return 'hard'; // render must always run
        if (id === 'cameraController.update' || id === 'playerController.update') return 'hard';
        if (id === 'aiNodes.update') return 'soft';
        if (lowered.includes('coremetrics') || lowered.includes('metrics')) return 'background';
        return 'hard';
    }

    /**
     * Phase L.2: Decide if a system should run this frame based on gating
     */
    shouldRun(entry, nowMs) {
        switch (entry.category) {
            case 'soft':
                if (nowMs - entry.lastRun < this.SOFT_INTERVAL_MS) return false;
                entry.lastRun = nowMs;
                return true;
            case 'background':
                if (nowMs - entry.lastRun < this.BACKGROUND_INTERVAL_MS) return false;
                entry.lastRun = nowMs;
                return true;
            default:
                entry.lastRun = nowMs;
                return true;
        }
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
        this._syncFxAuditFlag();

        if (!this.layers[layerName]) {
            frameWarn(`[FrameScheduler] Unknown layer: ${layerName}. Available layers: realtime, visual, simulation, background`);
            return false;
        }

        if (typeof fn !== 'function') {
            frameWarn(`[FrameScheduler] Registered item is not a function`);
            return false;
        }

        // Phase B: Track system by ID if provided
        if (id) {
            if (this.registeredSystems[id]) {
                frameWarn(`[FrameScheduler] System with ID '${id}' already registered. Use unregister() first.`);
                return false;
            }
            frameLog(`[FrameScheduler] Registered '${id}' to ${layerName} layer`);
        }

        const entry = {
            fn,
            id,
            layer: layerName,
            category: this.categorizeSystem(id),
            lastRun: -Infinity
        };

        if (this._fxAuditState.enabled) {
            this._ensureEntryAuditMeta(entry, layerName);
        }

        if (id) {
            this.registeredSystems[id] = {
                layer: layerName,
                entry
            };
        }

        this.layers[layerName].functions.push(entry);
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
            frameWarn(`[FrameScheduler] System '${id}' not found`);
            return false;
        }

        const system = this.registeredSystems[id];
        const layerName = system.layer;

        // Remove from layer functions array
        const index = this.layers[layerName].functions.indexOf(system.entry);
        if (index > -1) {
            this.layers[layerName].functions.splice(index, 1);
            this.totalRegistered--;
        }

        // Clean up tracking
        delete this.registeredSystems[id];
        frameLog(`[FrameScheduler] Unregistered '${id}' from ${layerName} layer`);

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
     * Visual gate for particle systems - always returns true.
     * Particle rendering must never be blocked by frame scheduling.
     */
    shouldRunVisual() {
        return true;
    }

    /**
     * Simulation gate - returns true when simulation layer is active.
     * Systems registered in simulation layer (10Hz) should check this.
     */
    shouldRunSimulation() {
        return true;
    }

    /**
     * Realtime gate - returns true when realtime layer is active.
     * Systems registered in realtime layer (60Hz) should check this.
     */
    shouldRunRealtime() {
        return true;
    }

    /**
     * Background gate - returns true when background layer is active.
     * Systems registered in background layer (2Hz) should check this.
     */
    shouldRunBackground() {
        return true;
    }

    /**
     * Main tick - called every frame with deltaTime
     * Executes registered functions when their layer's interval is reached
     * 
     * @param {number} deltaTime - Time since last frame in seconds
     */
    tick(deltaTime) {
        this._syncFxAuditFlag();
        this.tickCount++;

        // Process each layer
        for (const [layerName, layer] of Object.entries(this.layers)) {
            // Accumulate time for this layer
            layer.accumulator += deltaTime;

            // Execute as many intervals as have accumulated (carry remainder)
            while (layer.accumulator >= layer.interval) {
                const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

                if (typeof window !== 'undefined' && window.DEBUG_VISUAL_MODE && layerName === 'visual') {
                    if (now - this._lastVisualLogTime >= this.VISUAL_LOG_INTERVAL_MS) {
                        frameLog('[FrameScheduler] visual tick', now);
                        this._lastVisualLogTime = now;
                    }
                }

                for (const entry of layer.functions) {
                    if (entry._disabled === true) continue;
                    if (!this.shouldRun(entry, now)) continue; // Load shaping gate: skip until interval reached

                    try {
                        if (typeof window !== 'undefined' && window.__DEBUG_WAVE_TASK_CONTEXT__ === true) {
                            window.__ATOMA_ACTIVE_FRAME_TASK__ = {
                                id: entry.id || entry.fn?.name || 'anonymous',
                                layer: layerName
                            };
                        }
                        if (this._fxAuditState.enabled) {
                            this._markFxAuditCall(entry, layerName);
                        }
                        entry.fn(layer.interval);
                    } catch (error) {
                        if (this._fxAuditState.enabled) {
                            this._markFxAuditError(entry, layerName, error);
                        }
                        const jobId = entry.id || entry.fn?.name || 'visual-task';
                        if (!entry._warned) {
                            frameWarn(`[FrameScheduler] Job crashed: ${jobId}`, error);
                            if (error?.stack) frameWarn(error.stack);
                            entry._warned = true;
                        }
                        entry._disabled = true;
                        // Continue execution - do not crash
                    } finally {
                        if (typeof window !== 'undefined' && window.__DEBUG_WAVE_TASK_CONTEXT__ === true) {
                            window.__ATOMA_ACTIVE_FRAME_TASK__ = null;
                        }
                    }
                }

                layer.accumulator -= layer.interval;
            }

            layer._pruneCounter++;
            if (layer._pruneCounter >= this._pruneThreshold) {
                const before = layer.functions.length;
                layer.functions = layer.functions.filter(fn => fn._disabled !== true);
                const pruned = before - layer.functions.length;
                if (pruned > 0) {
                    frameLog(`[FrameScheduler] Pruned ${pruned} disabled entries from ${layerName} layer`);
                }
                layer._pruneCounter = 0;
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
     * ATOMA: Remove entries from a layer based on predicate
     */
    pruneLayer(layerName, predicate = () => false) {
        const layer = this.layers?.[layerName];
        if (!layer || !Array.isArray(layer.functions)) return 0;
        const before = layer.functions.length;
        layer.functions = layer.functions.filter(fn => !predicate(fn));
        const removed = before - layer.functions.length;
        return removed;
    }

    /**
     * ATOMA: Reset a layer by pruning disabled entries and clearing error flags
     */
    resetLayer(layerName) {
        const layer = this.layers?.[layerName];
        if (!layer || !Array.isArray(layer.functions)) return 0;
        const removed = this.pruneLayer(layerName, fn => fn?._disabled === true);
        for (const fn of layer.functions) {
            fn._disabled = false;
            fn._errorCount = 0;
            fn._warned = false;
            fn._lastErrorMsg = undefined;
        }
        return removed;
    }

    /**
     * Print scheduler summary to console
     */
    logSummary() {
        const stats = this.getStats();
        frameLog('%c[FrameScheduler] Initialization Complete', 'color: #00ff00; font-weight: bold');
        frameLog(`[FrameScheduler] Total registered functions: ${stats.total}`);
        frameLog('[FrameScheduler] Layer breakdown:');
        for (const [layerName, layerStats] of Object.entries(stats.layers)) {
            frameLog(`  - ${layerName}: ${layerStats.registered} functions @ ${layerStats.targetHz} Hz`);
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
        frameLog('[FrameScheduler] Cleared all registrations');
    }
}
export { FrameScheduler };
// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrameScheduler;
}
