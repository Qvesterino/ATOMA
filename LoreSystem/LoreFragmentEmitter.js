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
import { corruptText } from './CorruptedTextRenderer.js';

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
     * @param {function} getCorruption - Returns current corruption level 0-1
     * @param {object} config - Optional config overrides
     */
    constructor(semanticBus, getCurrentWorldId, getCorruption = () => 0, config = {}) {
        this.semanticBus = semanticBus || null;
        this.getCurrentWorldId = typeof getCurrentWorldId === 'function'
            ? getCurrentWorldId
            : () => 'quantum';
        this.getCorruption = typeof getCorruption === 'function'
            ? getCorruption
            : () => 0;

        this.config = Object.freeze({ ...DEFAULT_CONFIG, ...config });
        this.enabled = this.config.enabled;

        // Session state
        this._shownOnce = new Set();        // fragment IDs shown as once
        this._lastGlobalShow = 0;           // timestamp of last shown fragment
        this._lastTriggerShow = new Map();   // trigger -> timestamp
        this._totalShown = 0;               // total fragments shown this session
        this._subscriptions = [];            // cleanup references
        this._sessionStart = performance.now();

        // Session statistics (for Lore Archaeology hidden conditions)
        this._stats = {
            totalLinksCreated: 0,
            totalCollapses: 0,
            totalCascades: 0,
            totalRituals: 0,
            totalNodeSelections: 0,
            consecutiveCategorySelections: 0,
            lastSelectedCategory: null,
            corruptionFreeSince: performance.now(),  // timestamp of last corruption > 0.1
            longestCorruptionFreeMs: 0,
            relinkedCollapsedPairs: new Set(),       // "sourceId-targetId" pairs that were collapsed then re-linked
            collapsedPairs: new Set(),               // "sourceId-targetId" pairs that collapsed
            gamesWon: 0,
            allMetricsHighAt: null,                  // timestamp when all 5 metrics were high simultaneously
        };

        // Narrative stage (for Lore Echoes)
        // Stages: awakening → discovery → crisis → understanding → transcendence
        this._stage = 'awakening';
        this._stageHistory = ['awakening'];

        // Index: trigger -> fragments[]
        this._triggerIndex = new Map();
        // Index: id -> fragment (for once tracking)
        this._idIndex = new Map();

        this._buildIndex();
        this._subscribeStats();
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
     * Subscribe to statistics-tracking events for Lore Archaeology.
     * These listeners update session stats regardless of whether a fragment is shown.
     */
    _subscribeStats() {
        if (!this.semanticBus?.on) return;

        const track = (event, handler) => {
            const unsub = this.semanticBus.on(event, handler);
            if (typeof unsub === 'function') this._subscriptions.push(unsub);
        };

        // Link creation
        track('link.created', (e = {}) => {
            this._stats.totalLinksCreated++;
            // Track re-linked collapsed pairs (archaeology condition)
            const sourceId = e.sourceId ?? e.sourceNode?.userData?.nodeId;
            const targetId = e.targetId ?? e.targetNode?.userData?.nodeId;
            if (sourceId && targetId) {
                const pairKey = [sourceId, targetId].sort().join('-');
                if (this._stats.collapsedPairs.has(pairKey)) {
                    this._stats.relinkedCollapsedPairs.add(pairKey);
                }
            }
        });

        // Link collapse
        track('link:collapsed', (e = {}) => {
            this._stats.totalCollapses++;
            const sourceId = e.sourceId ?? e.link?.source?.userData?.nodeId;
            const targetId = e.targetId ?? e.link?.target?.userData?.nodeId;
            if (sourceId && targetId) {
                const pairKey = [sourceId, targetId].sort().join('-');
                this._stats.collapsedPairs.add(pairKey);
            }
        });

        // Cascade
        track('cascade.end', () => { this._stats.totalCascades++; });

        // Ritual
        track('ritual.release', () => { this._stats.totalRituals++; });

        // Node selection — track consecutive same-category
        track('node:selected', (e = {}) => {
            this._stats.totalNodeSelections++;
            const cat = e.category || null;
            if (cat && cat === this._stats.lastSelectedCategory) {
                this._stats.consecutiveCategorySelections++;
            } else {
                this._stats.consecutiveCategorySelections = 1;
            }
            this._stats.lastSelectedCategory = cat;
        });

        // Game won
        track('game:won', () => { this._stats.gamesWon++; });
    }

    /**
     * Update the narrative stage based on session progress.
     * Stages: awakening → discovery → crisis → understanding → transcendence
     */
    _updateStage() {
        const s = this._stats;
        const sessionMinutes = (performance.now() - this._sessionStart) / 60000;
        const prevStage = this._stage;

        // Stage progression rules
        if (s.gamesWon > 0) {
            this._stage = 'transcendence';
        } else if (s.totalRituals >= 3 && s.totalCascades >= 3 && sessionMinutes >= 15) {
            this._stage = 'understanding';
        } else if (s.totalCollapses >= 2 || s.totalCascades >= 2) {
            this._stage = 'crisis';
        } else if (s.totalLinksCreated >= 5 || s.totalNodeSelections >= 8) {
            this._stage = 'discovery';
        } else {
            this._stage = 'awakening';
        }

        // Track stage transitions
        if (this._stage !== prevStage) {
            this._stageHistory.push(this._stage);
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

        // Update narrative stage before selection
        this._updateStage();

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
     * 1. First-person voice + world-specific (highest)
     * 2. First-person voice + generic
     * 3. World-specific (any voice)
     * 4. Generic (any voice)
     *
     * Within a priority level, use weighted random selection.
     */
    _selectFragment(trigger, eventData = {}) {
        const candidates = this._triggerIndex.get(trigger);
        if (!candidates || candidates.length === 0) return null;

        const currentWorld = this.getCurrentWorldId().toLowerCase();

        // Separate into 4 priority tiers
        const firstPersonWorld = [];
        const firstPersonGeneric = [];
        const worldSpecific = [];
        const generic = [];

        for (const fragment of candidates) {
            // Skip once-fragments already shown
            if (fragment.once && this._shownOnce.has(fragment.id)) continue;

            // Check standard condition
            if (typeof fragment.condition === 'function') {
                try {
                    if (!fragment.condition(eventData)) continue;
                } catch {
                    continue;
                }
            }

            // Check stage requirement (Lore Echoes)
            if (fragment.stage && fragment.stage !== this._stage) continue;

            // Check hidden condition (Lore Archaeology)
            if (typeof fragment.hiddenCondition === 'function') {
                try {
                    if (!fragment.hiddenCondition(this._stats, this._stage)) continue;
                } catch {
                    continue;
                }
            }

            const worlds = fragment.worlds || ['*'];
            const isWorldMatch = worlds.includes('*') || worlds.some(w => w.toLowerCase() === currentWorld);
            const isFirstPerson = fragment.voice === 'first-person';
            const isHidden = typeof fragment.hiddenCondition === 'function';

            if (!isWorldMatch) continue;

            // Hidden fragments get highest priority
            if (isHidden) {
                // Hidden fragments bypass normal priority — they are rewards
                return fragment;
            }

            if (isFirstPerson && !worlds.includes('*')) {
                firstPersonWorld.push(fragment);
            } else if (isFirstPerson && worlds.includes('*')) {
                firstPersonGeneric.push(fragment);
            } else if (!worlds.includes('*')) {
                worldSpecific.push(fragment);
            } else {
                generic.push(fragment);
            }
        }

        // Prefer first-person voice, then world-specific, then generic
        const pool = firstPersonWorld.length > 0 ? firstPersonWorld
            : firstPersonGeneric.length > 0 ? firstPersonGeneric
            : worldSpecific.length > 0 ? worldSpecific
            : generic;
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
     * Applies corruption distortion to the text if corruption is elevated.
     */
    _emitFragment(fragment) {
        const Engine = this._getEngineClass();
        if (Engine && typeof Engine.showFragment === 'function') {
            // Apply corruption distortion to the text
            let displayText = fragment.text;
            try {
                const corruption = this.getCorruption();
                if (corruption > 0.20) {
                    displayText = corruptText(fragment.text, corruption);
                }
            } catch {
                // If corruption getter fails, show clean text
            }

            Engine.showFragment(
                displayText,
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
            // Lore Echoes
            stage: this._stage,
            stageHistory: [...this._stageHistory],
            // Lore Archaeology
            sessionStats: {
                totalLinksCreated: this._stats.totalLinksCreated,
                totalCollapses: this._stats.totalCollapses,
                totalCascades: this._stats.totalCascades,
                totalRituals: this._stats.totalRituals,
                totalNodeSelections: this._stats.totalNodeSelections,
                consecutiveCategorySelections: this._stats.consecutiveCategorySelections,
                relinkedCollapsedPairs: this._stats.relinkedCollapsedPairs.size,
                gamesWon: this._stats.gamesWon,
            },
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
        this._stage = 'awakening';
        this._stageHistory = ['awakening'];
        this._stats.totalLinksCreated = 0;
        this._stats.totalCollapses = 0;
        this._stats.totalCascades = 0;
        this._stats.totalRituals = 0;
        this._stats.totalNodeSelections = 0;
        this._stats.consecutiveCategorySelections = 0;
        this._stats.lastSelectedCategory = null;
        this._stats.relinkedCollapsedPairs.clear();
        this._stats.collapsedPairs.clear();
        this._stats.gamesWon = 0;
        this._sessionStart = performance.now();
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
