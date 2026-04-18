/**
 * LoreFragmentEmitter.js — P1.7 Lore unlocked through playing
 *
 * Listens to gameplay events on the semantic bus and emits
 * world-aware lore fragments through the poetry overlay.
 *
 * Design principles:
 * - Fragments are short, strong sentences — not wiki blocks
 * - World-specific voice: each map has its own psychology
 * - Cooldowns prevent spam; once-fragments only show once per session
 * - Lore is reward for understanding the system
 *
 * Owned by: main.js (created after LoreUnlockEngine and poetry engine)
 * Display: AtomaLanguageEngine3_0.showFragment()
 */

import WORLD_LORE_FRAGMENTS from './WorldLoreFragments.js';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = Object.freeze({
    /** Minimum ms between any two fragment displays */
    globalCooldownMs: 12000,
    /** Minimum ms between fragments of the same trigger type */
    triggerCooldownMs: 25000,
    /** Maximum fragments shown per session (0 = unlimited) */
    maxPerSession: 0,
    /** Probability of showing a fragment when a trigger fires (0-1) */
    triggerChance: 0.55,
    /** Duration of fragment display in ms */
    fragmentDurationMs: 1400,
    /** Priority for poetry overlay (1 = lowest, below lore unlocks at 2-4) */
    fragmentPriority: 1,
    /** Whether the system is enabled */
    enabled: true,
});

/**
 * Collect all unique trigger event names from the fragment registry.
 */
function collectTriggerNames(fragments) {
    const triggers = new Set();
    for (const fragment of fragments) {
        if (fragment.trigger) {
            triggers.add(fragment.trigger);
        }
    }
    return Array.from(triggers);
}

export default class LoreFragmentEmitter {
    /**
     * @param {object} semanticBus - The semantic event bus
     * @param {function} getCurrentWorldId - Returns current world ID string
     * @param {object} config - Optional config overrides
     */
    constructor(semanticBus, getCurrentWorldId, config = {}) {
        this.semanticBus = semanticBus || null;
        this.getCurrentWorldId = typeof getCurrentWorldId === 'function'
            ? getCurrentWorldId
            : () => 'quantum';

        this.config = Object.freeze({ ...DEFAULT_CONFIG, ...config });
        this.enabled = this.config.enabled;

        // Session state
        this._shownOnce = new Set();        // fragment IDs shown as once
        this._lastGlobalShow = 0;           // timestamp of last shown fragment
        this._lastTriggerShow = new Map();   // trigger -> timestamp
        this._totalShown = 0;               // total fragments shown this session
        this._subscriptions = [];            // cleanup references

        // Index: trigger -> fragments[]
        this._triggerIndex = new Map();
        // Index: id -> fragment (for once tracking)
        this._idIndex = new Map();

        this._buildIndex();
        this._subscribe();
    }

    /**
     * Build lookup indices from the fragment registry.
     */
    _buildIndex() {
        for (const fragment of WORLD_LORE_FRAGMENTS) {
            // Trigger index
            const trigger = fragment.trigger;
            if (trigger) {
                if (!this._triggerIndex.has(trigger)) {
                    this._triggerIndex.set(trigger, []);
                }
                this._triggerIndex.get(trigger).push(fragment);
            }

            // ID index
            if (fragment.id) {
                this._idIndex.set(fragment.id, fragment);
            }
        }
    }

    /**
     * Subscribe to all relevant semantic bus events.
     */
    _subscribe() {
        if (!this.semanticBus?.on) return;

        const triggers = collectTriggerNames(WORLD_LORE_FRAGMENTS);
        for (const trigger of triggers) {
            const unsub = this.semanticBus.on(trigger, (eventData) => {
                this._handleTrigger(trigger, eventData);
            });
            if (typeof unsub === 'function') {
                this._subscriptions.push(unsub);
            }
        }
    }

    /**
     * Handle an incoming trigger event.
     */
    _handleTrigger(trigger, eventData = {}) {
        if (!this.enabled) return;

        // Chance gate
        if (Math.random() > this.config.triggerChance) return;

        // Session limit
        if (this.config.maxPerSession > 0 && this._totalShown >= this.config.maxPerSession) {
            return;
        }

        // Global cooldown
        const now = performance.now();
        if (now - this._lastGlobalShow < this.config.globalCooldownMs) return;

        // Trigger cooldown
        const lastTriggerTime = this._lastTriggerShow.get(trigger) || 0;
        if (now - lastTriggerTime < this.config.triggerCooldownMs) return;

        // Pick a fragment
        const fragment = this._selectFragment(trigger, eventData);
        if (!fragment) return;

        // Once gate
        if (fragment.once && this._shownOnce.has(fragment.id)) return;

        // Emit
        this._emitFragment(fragment);

        // Update state
        this._lastGlobalShow = now;
        this._lastTriggerShow.set(trigger, now);
        this._totalShown++;
        if (fragment.once) {
            this._shownOnce.add(fragment.id);
        }
    }

    /**
     * Select the best fragment for a trigger + event data.
     *
     * Priority:
     * 1. World-specific fragments matching current world
     * 2. Generic fragments (worlds: ['*'])
     *
     * Within a priority level, use weighted random selection.
     */
    _selectFragment(trigger, eventData = {}) {
        const candidates = this._triggerIndex.get(trigger);
        if (!candidates || candidates.length === 0) return null;

        const currentWorld = this.getCurrentWorldId().toLowerCase();

        // Separate world-specific and generic candidates
        const worldSpecific = [];
        const generic = [];

        for (const fragment of candidates) {
            // Skip once-fragments already shown
            if (fragment.once && this._shownOnce.has(fragment.id)) continue;

            // Check condition
            if (typeof fragment.condition === 'function') {
                try {
                    if (!fragment.condition(eventData)) continue;
                } catch {
                    continue;
                }
            }

            const worlds = fragment.worlds || ['*'];
            if (worlds.includes('*')) {
                generic.push(fragment);
            } else if (worlds.some(w => w.toLowerCase() === currentWorld)) {
                worldSpecific.push(fragment);
            }
        }

        // Prefer world-specific, fall back to generic
        const pool = worldSpecific.length > 0 ? worldSpecific : generic;
        if (pool.length === 0) return null;

        // Weighted random selection
        return this._weightedRandom(pool);
    }

    /**
     * Weighted random selection from a pool of fragments.
     */
    _weightedRandom(pool) {
        const totalWeight = pool.reduce((sum, f) => sum + (f.weight || 1), 0);
        if (totalWeight <= 0) return pool[0] || null;

        let roll = Math.random() * totalWeight;
        for (const fragment of pool) {
            roll -= (fragment.weight || 1);
            if (roll <= 0) return fragment;
        }
        return pool[pool.length - 1];
    }

    /**
     * Emit a fragment through the poetry overlay.
     */
    _emitFragment(fragment) {
        // Use the static showFragment method on AtomaLanguageEngine3_0
        const Engine = this._getEngineClass();
        if (Engine && typeof Engine.showFragment === 'function') {
            Engine.showFragment(
                fragment.text,
                fragment.tone || 'lore',
                {
                    tag: fragment.tag || 'LORE / FRAGMENT',
                    duration: this.config.fragmentDurationMs,
                    priority: this.config.fragmentPriority,
                }
            );
        }
    }

    /**
     * Get the AtomaLanguageEngine3_0 class reference.
     * Lazy import to avoid circular dependencies.
     */
    _getEngineClass() {
        // The engine class is stored globally by its constructor
        return globalThis?.__AtomaLanguageEngine3_0 || null;
    }

    /**
     * Enable the emitter.
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable the emitter.
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Force-show a specific fragment by ID.
     * Useful for testing and debug API.
     */
    forceShow(fragmentId) {
        const fragment = this._idIndex.get(fragmentId);
        if (!fragment) return false;

        this._emitFragment(fragment);
        this._totalShown++;
        if (fragment.once) {
            this._shownOnce.add(fragment.id);
        }
        return true;
    }

    /**
     * Get current state for debugging.
     */
    getStats() {
        return {
            enabled: this.enabled,
            totalShown: this._totalShown,
            onceShown: this._shownOnce.size,
            triggerIndexSize: this._triggerIndex.size,
            totalFragments: WORLD_LORE_FRAGMENTS.length,
            lastGlobalShow: this._lastGlobalShow,
            globalCooldownMs: this.config.globalCooldownMs,
            triggerCooldownMs: this.config.triggerCooldownMs,
            triggerChance: this.config.triggerChance,
        };
    }

    /**
     * Get all available fragment IDs (for debug).
     */
    getFragmentIds() {
        return WORLD_LORE_FRAGMENTS.map(f => f.id);
    }

    /**
     * Get fragments for a specific world (for debug).
     */
    getFragmentsForWorld(worldId) {
        const lower = (worldId || '').toLowerCase();
        return WORLD_LORE_FRAGMENTS.filter(f => {
            const worlds = f.worlds || ['*'];
            return worlds.includes('*') || worlds.some(w => w.toLowerCase() === lower);
        }).map(f => ({ id: f.id, text: f.text, trigger: f.trigger, tag: f.tag }));
    }

    /**
     * Reset session state (for testing).
     */
    reset() {
        this._shownOnce.clear();
        this._lastGlobalShow = 0;
        this._lastTriggerShow.clear();
        this._totalShown = 0;
    }

    /**
     * Dispose and clean up.
     */
    dispose() {
        this.enabled = false;
        for (const unsub of this._subscriptions) {
            if (typeof unsub === 'function') {
                try { unsub(); } catch { /* ignore */ }
            }
        }
        this._subscriptions = [];
        this._triggerIndex.clear();
        this._idIndex.clear();
        this._shownOnce.clear();
        this._lastTriggerShow.clear();
    }
}
