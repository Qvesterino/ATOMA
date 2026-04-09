import {
    AtomaLanguageEngine3_0 as BaseAtomaLanguageEngine3_0,
    setupAtomaLanguageEngine3ConsoleAPI,
} from './_AtomaLanguageEngine3_0.js';

const LORE_LANGUAGE_PHRASES = Object.freeze({
    'lore.node.input': 'Input lets meaning enter.',
    'lore.node.process': 'Process turns arrival into structure.',
    'lore.node.control': 'Control decides what can remain stable.',
    'lore.node.storage': 'Storage keeps the system from forgetting itself.',
    'lore.node.analytics': 'Analytics reads pattern before it hardens.',
    'lore.metric.synergy': 'Synergy is alignment without force.',
    'lore.metric.harmony': 'Harmony makes flow feel intentional.',
    'lore.metric.corruption': 'Corruption is distortion that keeps traveling.',
    'lore.link': 'A link is commitment made visible.',
    'lore.cascade': 'A cascade leaves the local boundary.',
});

let activeEngine = null;
const pendingLoreKeys = [];

function resolveLorePhrase(key) {
    return LORE_LANGUAGE_PHRASES[key] || null;
}

export default class AtomaLanguageEngine3_0 extends BaseAtomaLanguageEngine3_0 {
    constructor(...args) {
        super(...args);
        activeEngine = this;
    }

    enable() {
        super.enable();
        this.constructor.flushPendingLorePhrases();
    }

    disable() {
        super.disable();
        if (activeEngine === this) {
            activeEngine = null;
        }
    }

    static emit(key) {
        if (!key) return false;

        const phrase = resolveLorePhrase(key);
        if (!phrase) return false;

        const engine = activeEngine;
        if (!engine || !engine.enabled || typeof engine._showPoetry !== 'function') {
            pendingLoreKeys.push(key);
            return false;
        }

        engine._showPoetry(phrase, 0.92, 1800, 2);
        return true;
    }

    static flushPendingLorePhrases() {
        if (!activeEngine || !activeEngine.enabled || typeof activeEngine._showPoetry !== 'function') {
            return;
        }

        while (pendingLoreKeys.length > 0) {
            const key = pendingLoreKeys.shift();
            const phrase = resolveLorePhrase(key);
            if (!phrase) {
                continue;
            }

            activeEngine._showPoetry(phrase, 0.92, 1800, 2);
        }
    }
}

export { setupAtomaLanguageEngine3ConsoleAPI };
