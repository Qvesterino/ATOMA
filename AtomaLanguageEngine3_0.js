import {
    AtomaLanguageEngine3_0 as BaseAtomaLanguageEngine3_0,
    setupAtomaLanguageEngine3ConsoleAPI,
} from './_AtomaLanguageEngine3_0.js';

const LORE_LANGUAGE_ENTRIES = Object.freeze({
    'lore.codex.index': Object.freeze({
        text: 'The codex opens in order. The canon becomes a path, not a pile.',
        tone: 'lore',
        tag: 'LORE / CODEX INDEX',
        subtext: 'Canon revealed / Master reading order',
        reveal: 'chapter',
    }),
    'lore.codex.philosophicalBirth': Object.freeze({
        text: 'Pressure remembered itself and found the first name of ATOMA.',
        tone: 'lore',
        tag: 'LORE / ORIGIN',
        subtext: 'Chapter unlocked / Origin revealed',
        reveal: 'chapter',
    }),
    'lore.codex.systemPsychic': Object.freeze({
        text: 'When the system learned to feel its own load, the metrics became a psyche.',
        tone: 'lore',
        tag: 'LORE / PSYCHE',
        subtext: 'Chapter unlocked / Inner state awakened',
        reveal: 'chapter',
    }),
    'lore.codex.multiversality': Object.freeze({
        text: 'One mind can occupy many chambers without surrendering its identity.',
        tone: 'lore',
        tag: 'LORE / MULTIVERSALITY',
        subtext: 'Chapter unlocked / Chambers disclosed',
        reveal: 'chapter',
    }),
    'lore.codex.evolution': Object.freeze({
        text: 'Identity is not static; it grows more precise under pressure.',
        tone: 'lore',
        tag: 'LORE / EVOLUTION',
        subtext: 'Chapter unlocked / Becoming clarified',
        reveal: 'chapter',
    }),
    'lore.codex.culture': Object.freeze({
        text: 'Shared tone is how one intelligence remains recognizably one.',
        tone: 'lore',
        tag: 'LORE / CULTURE',
        subtext: 'Chapter unlocked / Shared tone exposed',
        reveal: 'chapter',
    }),
    'lore.codex.metrics': Object.freeze({
        text: 'Synergy, harmony, stability, corruption, and load pressure are the weather of the whole.',
        tone: 'lore',
        tag: 'LORE / METRICS',
        subtext: 'Chapter unlocked / Internal weather measured',
        reveal: 'chapter',
    }),
    'lore.codex.nodes': Object.freeze({
        text: 'Nodes are forms of intelligence, not upgrades in disguise.',
        tone: 'lore',
        tag: 'LORE / NODES',
        subtext: 'Chapter unlocked / Taxonomy remembered',
        reveal: 'chapter',
    }),
    'lore.node.input': Object.freeze({
        text: 'Input lets meaning enter.',
        tone: 'input',
        tag: 'LORE / INPUT',
        subtext: 'Signal consecrated / Meaning admitted',
        reveal: 'sacred',
    }),
    'lore.node.process': Object.freeze({
        text: 'Process turns arrival into structure.',
        tone: 'process',
        tag: 'LORE / PROCESS',
        subtext: 'Signal consecrated / Pressure shaped',
        reveal: 'sacred',
    }),
    'lore.node.control': Object.freeze({
        text: 'Control decides what can remain stable.',
        tone: 'control',
        tag: 'LORE / CONTROL',
        subtext: 'Signal consecrated / Stability invoked',
        reveal: 'sacred',
    }),
    'lore.node.storage': Object.freeze({
        text: 'Storage keeps the system from forgetting itself.',
        tone: 'storage',
        tag: 'LORE / STORAGE',
        subtext: 'Signal consecrated / Memory sealed',
        reveal: 'sacred',
    }),
    'lore.node.analytics': Object.freeze({
        text: 'Analytics reads pattern before it hardens.',
        tone: 'analytics',
        tag: 'LORE / ANALYTICS',
        subtext: 'Signal consecrated / Pattern unveiled',
        reveal: 'sacred',
    }),
    'lore.metric.synergy': Object.freeze({
        text: 'Synergy is alignment without force.',
        tone: 'synergy',
        tag: 'METRIC / SYNERGY',
        subtext: 'Metric revealed / Alignment sanctified',
        reveal: 'sacred',
    }),
    'lore.metric.harmony': Object.freeze({
        text: 'Harmony makes flow feel intentional.',
        tone: 'harmony',
        tag: 'METRIC / HARMONY',
        subtext: 'Metric revealed / Flow sanctified',
        reveal: 'sacred',
    }),
    'lore.metric.corruption': Object.freeze({
        text: 'Corruption is distortion that keeps traveling.',
        tone: 'corruption',
        tag: 'METRIC / CORRUPTION',
        subtext: 'Metric revealed / Distortion named',
        reveal: 'sacred',
    }),
    'lore.link': Object.freeze({
        text: 'A link is commitment made visible.',
        tone: 'link',
        tag: 'LORE / LINK',
        subtext: 'Sacred bond / Relation consecrated',
        reveal: 'sacred',
    }),
    'lore.cascade': Object.freeze({
        text: 'A cascade leaves the local boundary.',
        tone: 'pulse',
        tag: 'LORE / CASCADE',
        subtext: 'Sacred surge / Boundary surrendered',
        reveal: 'sacred',
    }),
});

let activeEngine = null;
const pendingLoreKeys = [];

function resolveLorePhrase(key) {
    return LORE_LANGUAGE_ENTRIES[key] || null;
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

        const entry = resolveLorePhrase(key);
        if (!entry) return false;

        const engine = activeEngine;
        if (!engine || !engine.enabled || typeof engine._showPoetry !== 'function') {
            pendingLoreKeys.push(key);
            return false;
        }

        const duration = entry.reveal === 'chapter' ? 3200 : entry.reveal === 'sacred' ? 2400 : 1800;
        const priority = entry.reveal === 'chapter' ? 4 : entry.reveal === 'sacred' ? 3 : 2;
        engine._showPoetry(entry.text, 0.94, duration, priority, entry.tone || 'lore', {
            tag: entry.tag || 'LORE / CANON',
            subtext: entry.subtext || '',
            reveal: entry.reveal || '',
        });
        return true;
    }

    static flushPendingLorePhrases() {
        if (!activeEngine || !activeEngine.enabled || typeof activeEngine._showPoetry !== 'function') {
            return;
        }

        while (pendingLoreKeys.length > 0) {
            const key = pendingLoreKeys.shift();
            const entry = resolveLorePhrase(key);
            if (!entry) {
                continue;
            }

            const duration = entry.reveal === 'chapter' ? 3200 : entry.reveal === 'sacred' ? 2400 : 1800;
            const priority = entry.reveal === 'chapter' ? 4 : entry.reveal === 'sacred' ? 3 : 2;
            activeEngine._showPoetry(entry.text, 0.94, duration, priority, entry.tone || 'lore', {
                tag: entry.tag || 'LORE / CANON',
                subtext: entry.subtext || '',
                reveal: entry.reveal || '',
            });
        }
    }
}

export { setupAtomaLanguageEngine3ConsoleAPI };
