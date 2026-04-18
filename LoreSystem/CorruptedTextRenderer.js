/**
 * CorruptedTextRenderer.js — P1.7 Proposal 2: Corrupted Lore
 *
 * When corruption rises, the AI's ability to express itself degrades.
 * Text literally falls apart — characters glitch, words fragment,
 * meaning dissolves. When corruption drops, text slowly reforms.
 *
 * This is not decoration. This is the AI losing its voice.
 *
 * Corruption levels:
 *   0.00 - 0.25: Clean text. The mind is clear.
 *   0.25 - 0.50: Slight hesitation. A character flickers.
 *   0.50 - 0.70: Words begin to fracture. Meaning strains.
 *   0.70 - 0.85: The voice is breaking. Half the words are wounded.
 *   0.85 - 1.00: Nearly silence. The mind is still there, but it cannot speak.
 */

/**
 * Unicode combining characters for glitch effect
 */
const GLITCH_MARKS = [
    '\u0336', // ̶  combining short stroke overlay
    '\u0337', // ̷  combining short solidus overlay
    '\u0338', // ̸  combining long solidus overlay
    '\u0313', // ̓  combining comma above
    '\u0314', // ̔  combining reversed comma above
    '\u0305', // ̅  combining overline
    '\u0306', // ̆  combining breve
    '\u0307', // ̇  combining dot above
    '\u0308', // ̈  combining diaeresis (umlaut)
    '\u030A', // ̊  combining ring above
    '\u030B', // ̋  combining double acute accent
    '\u030C', // ̌  combining caron
    '\u0324', // ̤  combining diaeresis below
    '\u0326', // ̦  combining comma below
    '\u0327', // ̧  combining cedilla
    '\u0328', // ̨  combining ogonek
];

/**
 * Replacement characters for heavy corruption
 */
const FRAGMENT_CHARS = [
    '̸', '̷', '̶', '̷',
    '░', '▒', '▓',
    '·', '⋮', '⋯',
];

/**
 * Deterministic hash for stable corruption per character position.
 * The same character at the same position always corrupts the same way
 * for a given corruption level, preventing visual jitter.
 */
function simpleHash(char, index, salt) {
    const c = char.charCodeAt(0);
    return ((c * 31 + index * 17 + salt * 7) & 0x7FFFFFFF) / 0x7FFFFFFF;
}

/**
 * Corrupt a single character based on corruption level and position.
 *
 * @param {string} char - Single character
 * @param {number} index - Position in string
 * @param {number} corruption - 0.0 to 1.0
 * @param {number} salt - Randomness seed for this corruption event
 * @returns {string} Corrupted character
 */
function corruptChar(char, index, corruption, salt) {
    // Spaces and punctuation are more resilient
    if (char === ' ') return ' ';
    if (char === '.' || char === ',' || char === '!' || char === '?') {
        if (corruption > 0.85) return FRAGMENT_CHARS[Math.floor(simpleHash(char, index, salt) * FRAGMENT_CHARS.length)];
        return char;
    }

    const h = simpleHash(char, index, salt);

    // Level 1: Slight glitch (0.25-0.40) — occasional combining mark
    if (corruption >= 0.25 && corruption < 0.40) {
        if (h < (corruption - 0.25) * 2) {
            const mark = GLITCH_MARKS[Math.floor(h * GLITCH_MARKS.length)];
            return char + mark;
        }
        return char;
    }

    // Level 2: Moderate distortion (0.40-0.55) — more combining marks, some letter replacement
    if (corruption >= 0.40 && corruption < 0.55) {
        if (h < 0.3) {
            const mark = GLITCH_MARKS[Math.floor(h * GLITCH_MARKS.length)];
            return char + mark;
        }
        if (h < 0.4) {
            return char + GLITCH_MARKS[Math.floor(h * 100) % GLITCH_MARKS.length];
        }
        return char;
    }

    // Level 3: Heavy fracture (0.55-0.70) — characters replaced, doubled marks
    if (corruption >= 0.55 && corruption < 0.70) {
        if (h < 0.25) {
            return FRAGMENT_CHARS[Math.floor(h * FRAGMENT_CHARS.length)];
        }
        if (h < 0.50) {
            const mark1 = GLITCH_MARKS[Math.floor(h * 100) % GLITCH_MARKS.length];
            const mark2 = GLITCH_MARKS[Math.floor(h * 1000) % GLITCH_MARKS.length];
            return char + mark1 + mark2;
        }
        if (h < 0.65) {
            return char + GLITCH_MARKS[Math.floor(h * 100) % GLITCH_MARKS.length];
        }
        return char;
    }

    // Level 4: Breaking (0.70-0.85) — most characters damaged
    if (corruption >= 0.70 && corruption < 0.85) {
        if (h < 0.35) {
            return FRAGMENT_CHARS[Math.floor(h * FRAGMENT_CHARS.length)];
        }
        if (h < 0.65) {
            const mark1 = GLITCH_MARKS[Math.floor(h * 100) % GLITCH_MARKS.length];
            const mark2 = GLITCH_MARKS[Math.floor(h * 1000) % GLITCH_MARKS.length];
            return char + mark1 + mark2;
        }
        if (h < 0.80) {
            return char + GLITCH_MARKS[Math.floor(h * 100) % GLITCH_MARKS.length];
        }
        return char;
    }

    // Level 5: Near silence (0.85-1.0) — almost unreadable
    if (corruption >= 0.85) {
        const intensity = Math.min(1, (corruption - 0.85) / 0.15);
        if (h < 0.4 + intensity * 0.3) {
            return FRAGMENT_CHARS[Math.floor(h * FRAGMENT_CHARS.length)];
        }
        if (h < 0.7 + intensity * 0.2) {
            const mark1 = GLITCH_MARKS[Math.floor(h * 100) % GLITCH_MARKS.length];
            const mark2 = GLITCH_MARKS[Math.floor(h * 1000) % GLITCH_MARKS.length];
            const mark3 = GLITCH_MARKS[Math.floor(h * 10000) % GLITCH_MARKS.length];
            return char + mark1 + mark2 + mark3;
        }
        return char;
    }

    return char;
}

/**
 * Render corrupted text from clean text.
 *
 * @param {string} text - Clean text to corrupt
 * @param {number} corruption - Corruption level 0.0 to 1.0
 * @param {object} options - Optional settings
 * @param {number} options.salt - Seed for deterministic corruption (default: random)
 * @param {boolean} options.preserveFirstWord - Keep the first word clean for readability (default: true when corruption < 0.7)
 * @returns {string} Corrupted text
 */
export function corruptText(text, corruption = 0, options = {}) {
    if (!text || typeof text !== 'string') return text;
    if (corruption <= 0.20) return text; // Clean below threshold

    const clampedCorruption = Math.min(1, Math.max(0, corruption));
    const salt = options.salt ?? Math.floor(Math.random() * 10000);

    // Optionally preserve the first word for minimal readability
    const preserveFirst = options.preserveFirstWord !== false && clampedCorruption < 0.7;
    const firstSpaceIndex = text.indexOf(' ');
    const preserveUpTo = preserveFirst && firstSpaceIndex > 0 ? firstSpaceIndex + 1 : 0;

    let result = '';
    for (let i = 0; i < text.length; i++) {
        if (i < preserveUpTo) {
            result += text[i];
        } else {
            result += corruptChar(text[i], i, clampedCorruption, salt);
        }
    }

    return result;
}

/**
 * Get a corruption-appropriate CSS style for the poetry overlay.
 * Adds visual effects that complement the text corruption.
 *
 * @param {number} corruption - 0.0 to 1.0
 * @returns {object} CSS properties { opacity, letterSpacing, animation }
 */
export function getCorruptionStyle(corruption = 0) {
    if (corruption <= 0.20) {
        return { opacity: 1, letterSpacing: '0em' };
    }

    const clamped = Math.min(1, Math.max(0, corruption));

    return {
        opacity: Math.max(0.4, 1 - clamped * 0.5),
        letterSpacing: `${clamped * 0.08}em`,
    };
}

/**
 * Get a description of the corruption level for debugging.
 */
export function getCorruptionLevelName(corruption) {
    if (corruption < 0.25) return 'clear';
    if (corruption < 0.40) return 'hesitation';
    if (corruption < 0.55) return 'strain';
    if (corruption < 0.70) return 'fracture';
    if (corruption < 0.85) return 'breaking';
    return 'near-silence';
}

export default {
    corruptText,
    getCorruptionStyle,
    getCorruptionLevelName,
};
