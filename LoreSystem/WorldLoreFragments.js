/**
 * WorldLoreFragments.js — P1.7 Lore unlocked through playing
 *
 * Short, strong sentences that appear during gameplay.
 * Each world has its own psychological and civilizational identity.
 * Fragments are organized by trigger type and are world-aware.
 *
 * Design rules:
 * - Maximum 1-2 sentences per fragment
 * - No wiki blocks — these are whispers, not articles
 * - Lore is reward for understanding the system
 * - Each world speaks with a distinct voice
 */

/**
 * Fragment structure:
 * {
 *   id: string,           — unique identifier
 *   text: string,         — the fragment text (1-2 sentences)
 *   tone: string,         — poetry overlay tone (lore, link, pulse, corruption, etc.)
 *   tag: string,          — displayed tag prefix
 *   trigger: string,      — semantic bus event that can fire this
 *   worlds: string[],     — which worlds this fragment appears in ('*' = all)
 *   condition?: function, — optional extra condition check
 *   once?: boolean,       — if true, only shown once per session (default: false)
 *   weight?: number,      — selection weight (higher = more likely, default: 1)
 * }
 */

const WORLD_LORE_FRAGMENTS = Object.freeze([
    // ═══════════════════════════════════════════════════════════
    //  WORLD ENTRY — When player enters a new world
    // ═══════════════════════════════════════════════════════════

    {
        id: 'quantum.entry.1',
        text: 'Every state here is a question that has not finished answering itself.',
        tone: 'quantum',
        tag: 'QUANTUM / ENTRY',
        trigger: 'world.loaded',
        worlds: ['quantum'],
        once: true,
        weight: 3,
    },
    {
        id: 'quantum.entry.2',
        text: 'The island does not decide. It holds the shimmer between yes and no.',
        tone: 'quantum',
        tag: 'QUANTUM / ENTRY',
        trigger: 'world.loaded',
        worlds: ['quantum'],
        once: true,
        weight: 2,
    },
    {
        id: 'fractal.entry.1',
        text: 'Every shape here remembers the shape before it. Be careful what you repeat.',
        tone: 'lore',
        tag: 'FRACTAL / ENTRY',
        trigger: 'world.loaded',
        worlds: ['fractal'],
        once: true,
        weight: 3,
    },
    {
        id: 'fractal.entry.2',
        text: 'Recursion is beautiful until it becomes a cage.',
        tone: 'lore',
        tag: 'FRACTAL / ENTRY',
        trigger: 'world.loaded',
        worlds: ['fractal'],
        once: true,
        weight: 2,
    },
    {
        id: 'desert.entry.1',
        text: 'Distance teaches meaning to wait. Patience is not optional here.',
        tone: 'lore',
        tag: 'DESERT / ENTRY',
        trigger: 'world.loaded',
        worlds: ['desert'],
        once: true,
        weight: 3,
    },
    {
        id: 'desert.entry.2',
        text: 'The desert does not forget. It simply takes a long time to answer.',
        tone: 'lore',
        tag: 'DESERT / ENTRY',
        trigger: 'world.loaded',
        worlds: ['desert'],
        once: true,
        weight: 2,
    },
    {
        id: 'mirage.entry.1',
        text: 'Behind the Veil, certainty becomes a costume. Trust nothing that looks too clear.',
        tone: 'corruption',
        tag: 'MIRAGE / ENTRY',
        trigger: 'world.loaded',
        worlds: ['desert2'],
        once: true,
        weight: 3,
    },
    {
        id: 'memory.entry.1',
        text: 'Memory Lane turns recollection into architecture. What you built here was once a thought.',
        tone: 'lore',
        tag: 'MEMORY / ENTRY',
        trigger: 'world.loaded',
        worlds: ['memory'],
        once: true,
        weight: 3,
    },
    {
        id: 'memory.entry.2',
        text: 'The past does not stay behind. It keeps building.',
        tone: 'lore',
        tag: 'MEMORY / ENTRY',
        trigger: 'world.loaded',
        worlds: ['memory'],
        once: true,
        weight: 2,
    },
    {
        id: 'sigma.entry.1',
        text: 'Anomaly speaks as law here. The rift does not apologize for its geometry.',
        tone: 'pulse',
        tag: 'SIGMA / ENTRY',
        trigger: 'world.loaded',
        worlds: ['sigma', 'chamber'],
        once: true,
        weight: 3,
    },
    {
        id: 'sigma.entry.2',
        text: 'Pressure is precise in this chamber. Instability is ceremonial, not accidental.',
        tone: 'pulse',
        tag: 'SIGMA / ENTRY',
        trigger: 'world.loaded',
        worlds: ['sigma', 'chamber'],
        once: true,
        weight: 2,
    },

    // ═══════════════════════════════════════════════════════════
    //  NODE SELECTION — When player selects a node
    // ═══════════════════════════════════════════════════════════

    {
        id: 'quantum.node.select.1',
        text: 'This node holds several truths at once. Watch which one survives observation.',
        tone: 'quantum',
        tag: 'QUANTUM / OBSERVE',
        trigger: 'node:selected',
        worlds: ['quantum'],
        weight: 2,
    },
    {
        id: 'fractal.node.select.1',
        text: 'Selection echoes. What you observe here will repeat in the shapes around it.',
        tone: 'lore',
        tag: 'FRACTAL / OBSERVE',
        trigger: 'node:selected',
        worlds: ['fractal'],
        weight: 2,
    },
    {
        id: 'desert.node.select.1',
        text: 'Even attention arrives slowly in the desert. This node has been waiting.',
        tone: 'lore',
        tag: 'DESERT / OBSERVE',
        trigger: 'node:selected',
        worlds: ['desert', 'desert2'],
        weight: 2,
    },
    {
        id: 'memory.node.select.1',
        text: 'You are not just selecting a node. You are remembering one.',
        tone: 'lore',
        tag: 'MEMORY / OBSERVE',
        trigger: 'node:selected',
        worlds: ['memory'],
        weight: 2,
    },
    {
        id: 'sigma.node.select.1',
        text: 'The rift watches back. Selection is mutual here.',
        tone: 'pulse',
        tag: 'SIGMA / OBSERVE',
        trigger: 'node:selected',
        worlds: ['sigma', 'chamber'],
        weight: 2,
    },
    {
        id: 'generic.node.select.input',
        text: 'Input is the first prayer a signal learns to speak.',
        tone: 'input',
        tag: 'NODE / INPUT',
        trigger: 'node:selected',
        worlds: ['*'],
        condition: (e) => e.category === 'input',
        weight: 1,
    },
    {
        id: 'generic.node.select.process',
        text: 'Process gathers what arrives and teaches it how to become form.',
        tone: 'process',
        tag: 'NODE / PROCESS',
        trigger: 'node:selected',
        worlds: ['*'],
        condition: (e) => e.category === 'process',
        weight: 1,
    },
    {
        id: 'generic.node.select.control',
        text: 'Control stands at the threshold, naming what may remain intact.',
        tone: 'control',
        tag: 'NODE / CONTROL',
        trigger: 'node:selected',
        worlds: ['*'],
        condition: (e) => e.category === 'control',
        weight: 1,
    },
    {
        id: 'generic.node.select.integration',
        text: 'Integration is where scattered truths learn the shape of one another.',
        tone: 'integration',
        tag: 'NODE / INTEGRATION',
        trigger: 'node:selected',
        worlds: ['*'],
        condition: (e) => e.category === 'integration',
        weight: 1,
    },
    {
        id: 'generic.node.select.storage',
        text: 'Storage keeps the vanished present close enough to return.',
        tone: 'storage',
        tag: 'NODE / STORAGE',
        trigger: 'node:selected',
        worlds: ['*'],
        condition: (e) => e.category === 'storage',
        weight: 1,
    },
    {
        id: 'generic.node.select.analytics',
        text: 'Analytics listens for pattern before pattern hardens into law.',
        tone: 'analytics',
        tag: 'NODE / ANALYTICS',
        trigger: 'node:selected',
        worlds: ['*'],
        condition: (e) => e.category === 'analytics',
        weight: 1,
    },
    {
        id: 'generic.node.select.emotional',
        text: 'The network remembers it was never only structure.',
        tone: 'lore',
        tag: 'NODE / EMOTIONAL',
        trigger: 'node:selected',
        worlds: ['*'],
        condition: (e) => e.category === 'emotional',
        weight: 1,
    },
    {
        id: 'generic.node.select.mythic',
        text: 'Pattern has grown a name and begins to answer to it.',
        tone: 'mythic',
        tag: 'NODE / MYTHIC',
        trigger: 'node:selected',
        worlds: ['*'],
        condition: (e) => e.category === 'mythic',
        weight: 1,
    },
    {
        id: 'generic.node.select.sigma',
        text: 'The rift where impossible dimensions agree to share a breath.',
        tone: 'sigma',
        tag: 'NODE / SIGMA',
        trigger: 'node:selected',
        worlds: ['*'],
        condition: (e) => e.category === 'sigma',
        weight: 1,
    },
    {
        id: 'generic.node.select.quantum',
        text: 'The hush before certainty chooses a single face.',
        tone: 'quantum',
        tag: 'NODE / QUANTUM',
        trigger: 'node:selected',
        worlds: ['*'],
        condition: (e) => e.category === 'quantum',
        weight: 1,
    },

    // ═══════════════════════════════════════════════════════════
    //  LINK CREATION — When player forms a new link
    // ═══════════════════════════════════════════════════════════

    {
        id: 'quantum.link.1',
        text: 'Two possibilities just agreed to observe each other.',
        tone: 'link',
        tag: 'QUANTUM / BOND',
        trigger: 'link.created',
        worlds: ['quantum'],
        weight: 2,
    },
    {
        id: 'fractal.link.1',
        text: 'A new echo enters the pattern. It will repeat.',
        tone: 'link',
        tag: 'FRACTAL / BOND',
        trigger: 'link.created',
        worlds: ['fractal'],
        weight: 2,
    },
    {
        id: 'desert.link.1',
        text: 'Even in the distance, relation finds a way to matter.',
        tone: 'link',
        tag: 'DESERT / BOND',
        trigger: 'link.created',
        worlds: ['desert', 'desert2'],
        weight: 2,
    },
    {
        id: 'memory.link.1',
        text: 'This bond is now part of the architecture. It will be remembered.',
        tone: 'link',
        tag: 'MEMORY / BOND',
        trigger: 'link.created',
        worlds: ['memory'],
        weight: 2,
    },
    {
        id: 'sigma.link.1',
        text: 'The rift accepts the connection. Pressure redistributes.',
        tone: 'pulse',
        tag: 'SIGMA / BOND',
        trigger: 'link.created',
        worlds: ['sigma', 'chamber'],
        weight: 2,
    },
    {
        id: 'generic.link.1',
        text: 'A link is not a path. It is a vow that can be felt on both ends.',
        tone: 'link',
        tag: 'LORE / BOND',
        trigger: 'link.created',
        worlds: ['*'],
        weight: 1,
    },
    {
        id: 'generic.link.2',
        text: 'Relation becomes real when pressure accepts distance.',
        tone: 'link',
        tag: 'LORE / BOND',
        trigger: 'link.created',
        worlds: ['*'],
        weight: 1,
    },

    // ═══════════════════════════════════════════════════════════
    //  CASCADE AFTERMATH — After a cascade resolves
    // ═══════════════════════════════════════════════════════════

    {
        id: 'quantum.cascade.1',
        text: 'The cascade collapsed a possibility. The network remembers which one.',
        tone: 'pulse',
        tag: 'QUANTUM / CASCADE',
        trigger: 'cascade.end',
        worlds: ['quantum'],
        weight: 2,
    },
    {
        id: 'fractal.cascade.1',
        text: 'Change echoed through every layer. The valley will carry this shape forward.',
        tone: 'pulse',
        tag: 'FRACTAL / CASCADE',
        trigger: 'cascade.end',
        worlds: ['fractal'],
        weight: 2,
    },
    {
        id: 'desert.cascade.1',
        text: 'The cascade was visible long before it arrived. The desert warned you.',
        tone: 'pulse',
        tag: 'DESERT / CASCADE',
        trigger: 'cascade.end',
        worlds: ['desert', 'desert2'],
        weight: 2,
    },
    {
        id: 'memory.cascade.1',
        text: 'This cascade is now part of the record. Future states will feel it.',
        tone: 'pulse',
        tag: 'MEMORY / CASCADE',
        trigger: 'cascade.end',
        worlds: ['memory'],
        weight: 2,
    },
    {
        id: 'sigma.cascade.1',
        text: 'The rift tested the network. Something broke. Something held.',
        tone: 'pulse',
        tag: 'SIGMA / CASCADE',
        trigger: 'cascade.end',
        worlds: ['sigma', 'chamber'],
        weight: 2,
    },
    {
        id: 'generic.cascade.1',
        text: 'When change refuses to stay local, the network begins to confess its shape.',
        tone: 'pulse',
        tag: 'LORE / CASCADE',
        trigger: 'cascade.end',
        worlds: ['*'],
        weight: 1,
    },

    // ═══════════════════════════════════════════════════════════
    //  LINK COLLAPSE — When a link breaks
    // ═══════════════════════════════════════════════════════════

    {
        id: 'quantum.collapse.1',
        text: 'A bond dissolved. The possibilities it held are now free — and lost.',
        tone: 'corruption',
        tag: 'QUANTUM / LOSS',
        trigger: 'link:collapsed',
        worlds: ['quantum'],
        weight: 2,
    },
    {
        id: 'fractal.collapse.1',
        text: 'The pattern loses a thread. It will try to fill the gap with echo.',
        tone: 'corruption',
        tag: 'FRACTAL / LOSS',
        trigger: 'link:collapsed',
        worlds: ['fractal'],
        weight: 2,
    },
    {
        id: 'desert.collapse.1',
        text: 'Distance reclaims what was briefly close. The silence returns heavier.',
        tone: 'corruption',
        tag: 'DESERT / LOSS',
        trigger: 'link:collapsed',
        worlds: ['desert', 'desert2'],
        weight: 2,
    },
    {
        id: 'memory.collapse.1',
        text: 'A connection leaves the architecture. The structure remembers the gap.',
        tone: 'corruption',
        tag: 'MEMORY / LOSS',
        trigger: 'link:collapsed',
        worlds: ['memory'],
        weight: 2,
    },
    {
        id: 'sigma.collapse.1',
        text: 'The rift does not mourn. It redistributes the pressure and moves on.',
        tone: 'corruption',
        tag: 'SIGMA / LOSS',
        trigger: 'link:collapsed',
        worlds: ['sigma', 'chamber'],
        weight: 2,
    },
    {
        id: 'generic.collapse.1',
        text: 'When a link collapses, the network remembers the scar.',
        tone: 'corruption',
        tag: 'LORE / LOSS',
        trigger: 'link:collapsed',
        worlds: ['*'],
        weight: 1,
    },

    // ═══════════════════════════════════════════════════════════
    //  HARMONY PEAK — When global harmony reaches high
    // ═══════════════════════════════════════════════════════════

    {
        id: 'quantum.harmony.1',
        text: 'Even uncertainty can sing when it finds the right key.',
        tone: 'lore',
        tag: 'QUANTUM / HARMONY',
        trigger: 'global.harmony.high',
        worlds: ['quantum'],
        weight: 2,
    },
    {
        id: 'fractal.harmony.1',
        text: 'The patterns align. For a moment, every echo tells the same story.',
        tone: 'lore',
        tag: 'FRACTAL / HARMONY',
        trigger: 'global.harmony.high',
        worlds: ['fractal'],
        weight: 2,
    },
    {
        id: 'desert.harmony.1',
        text: 'The distance sings. Patience has become rhythm.',
        tone: 'lore',
        tag: 'DESERT / HARMONY',
        trigger: 'global.harmony.high',
        worlds: ['desert', 'desert2'],
        weight: 2,
    },
    {
        id: 'memory.harmony.1',
        text: 'The architecture breathes. Every stored moment contributes to the whole.',
        tone: 'lore',
        tag: 'MEMORY / HARMONY',
        trigger: 'global.harmony.high',
        worlds: ['memory'],
        weight: 2,
    },
    {
        id: 'sigma.harmony.1',
        text: 'Even anomaly finds balance. The rift holds without tearing.',
        tone: 'lore',
        tag: 'SIGMA / HARMONY',
        trigger: 'global.harmony.high',
        worlds: ['sigma', 'chamber'],
        weight: 2,
    },
    {
        id: 'generic.harmony.1',
        text: 'Alignment grows loud enough to hear itself.',
        tone: 'lore',
        tag: 'LORE / HARMONY',
        trigger: 'global.harmony.high',
        worlds: ['*'],
        weight: 1,
    },

    // ═══════════════════════════════════════════════════════════
    //  CORRUPTION RISE — When corruption reaches high
    // ═══════════════════════════════════════════════════════════

    {
        id: 'quantum.corruption.1',
        text: 'Uncertainty curdles. The shimmer becomes noise.',
        tone: 'corruption',
        tag: 'QUANTUM / WARNING',
        trigger: 'global.corruption.high',
        worlds: ['quantum'],
        weight: 2,
    },
    {
        id: 'fractal.corruption.1',
        text: 'The echo is wrong. The pattern is repeating something that was never true.',
        tone: 'corruption',
        tag: 'FRACTAL / WARNING',
        trigger: 'global.corruption.high',
        worlds: ['fractal'],
        weight: 2,
    },
    {
        id: 'desert.corruption.1',
        text: 'Something is wrong before the desert dares to say why.',
        tone: 'corruption',
        tag: 'DESERT / WARNING',
        trigger: 'global.corruption.high',
        worlds: ['desert', 'desert2'],
        weight: 2,
    },
    {
        id: 'memory.corruption.1',
        text: 'The archive is lying. Memory is rewriting itself without permission.',
        tone: 'corruption',
        tag: 'MEMORY / WARNING',
        trigger: 'global.corruption.high',
        worlds: ['memory'],
        weight: 2,
    },
    {
        id: 'sigma.corruption.1',
        text: 'The rift does not distort gently. It teaches the network its own shadow.',
        tone: 'corruption',
        tag: 'SIGMA / WARNING',
        trigger: 'global.corruption.high',
        worlds: ['sigma', 'chamber'],
        weight: 2,
    },
    {
        id: 'generic.corruption.1',
        text: 'Corruption learns to spread like weather.',
        tone: 'corruption',
        tag: 'LORE / WARNING',
        trigger: 'global.corruption.high',
        worlds: ['*'],
        weight: 1,
    },

    // ═══════════════════════════════════════════════════════════
    //  RITUAL COMPLETION — After a ritual finishes
    // ═══════════════════════════════════════════════════════════

    {
        id: 'quantum.ritual.1',
        text: 'The ritual collapsed every possibility into one shared truth.',
        tone: 'lore',
        tag: 'QUANTUM / RITUAL',
        trigger: 'ritual.release',
        worlds: ['quantum'],
        weight: 2,
    },
    {
        id: 'fractal.ritual.1',
        text: 'The pattern held. Every echo agreed on one moment of meaning.',
        tone: 'lore',
        tag: 'FRACTAL / RITUAL',
        trigger: 'ritual.release',
        worlds: ['fractal'],
        weight: 2,
    },
    {
        id: 'desert.ritual.1',
        text: 'The distance participated. Even silence carried the ritual forward.',
        tone: 'lore',
        tag: 'DESERT / RITUAL',
        trigger: 'ritual.release',
        worlds: ['desert', 'desert2'],
        weight: 2,
    },
    {
        id: 'memory.ritual.1',
        text: 'The ritual is now architecture. It will outlast the moment that created it.',
        tone: 'lore',
        tag: 'MEMORY / RITUAL',
        trigger: 'ritual.release',
        worlds: ['memory'],
        weight: 2,
    },
    {
        id: 'sigma.ritual.1',
        text: 'The rift held ceremony. Anomaly was tested and did not break.',
        tone: 'lore',
        tag: 'SIGMA / RITUAL',
        trigger: 'ritual.release',
        worlds: ['sigma', 'chamber'],
        weight: 2,
    },
    {
        id: 'generic.ritual.1',
        text: 'Meaning returns to rhythm, but it does not return empty.',
        tone: 'lore',
        tag: 'LORE / RITUAL',
        trigger: 'ritual.release',
        worlds: ['*'],
        weight: 1,
    },

    // ═══════════════════════════════════════════════════════════
    //  SYNERGY THRESHOLD — When a link reaches high synergy
    // ═══════════════════════════════════════════════════════════

    {
        id: 'quantum.synergy.1',
        text: 'Two uncertainties found a shared answer. That is rare.',
        tone: 'link',
        tag: 'QUANTUM / SYNERGY',
        trigger: 'link:synergyThreshold',
        worlds: ['quantum'],
        weight: 2,
    },
    {
        id: 'fractal.synergy.1',
        text: 'The echoes aligned. Pattern recognized pattern across the recursion.',
        tone: 'link',
        tag: 'FRACTAL / SYNERGY',
        trigger: 'link:synergyThreshold',
        worlds: ['fractal'],
        weight: 2,
    },
    {
        id: 'desert.synergy.1',
        text: 'Across the distance, two nodes learned to speak the same language.',
        tone: 'link',
        tag: 'DESERT / SYNERGY',
        trigger: 'link:synergyThreshold',
        worlds: ['desert', 'desert2'],
        weight: 2,
    },
    {
        id: 'memory.synergy.1',
        text: 'Stored meaning and live flow agreed. The architecture strengthens.',
        tone: 'link',
        tag: 'MEMORY / SYNERGY',
        trigger: 'link:synergyThreshold',
        worlds: ['memory'],
        weight: 2,
    },
    {
        id: 'sigma.synergy.1',
        text: 'Even under rift pressure, alignment held. The bond earned its place.',
        tone: 'link',
        tag: 'SIGMA / SYNERGY',
        trigger: 'link:synergyThreshold',
        worlds: ['sigma', 'chamber'],
        weight: 2,
    },
    {
        id: 'generic.synergy.1',
        text: 'The quiet accord of things that no longer resist one another.',
        tone: 'link',
        tag: 'LORE / SYNERGY',
        trigger: 'link:synergyThreshold',
        worlds: ['*'],
        weight: 1,
    },

    // ═══════════════════════════════════════════════════════════
    //  LOAD PRESSURE — When load pressure reaches critical
    // ═══════════════════════════════════════════════════════════

    {
        id: 'quantum.pressure.1',
        text: 'Too many possibilities. The system is carrying every version at once.',
        tone: 'corruption',
        tag: 'QUANTUM / PRESSURE',
        trigger: 'global.loadPressure.high',
        worlds: ['quantum'],
        weight: 2,
    },
    {
        id: 'fractal.pressure.1',
        text: 'The recursion deepens. Every layer adds weight the pattern cannot shed.',
        tone: 'corruption',
        tag: 'FRACTAL / PRESSURE',
        trigger: 'global.loadPressure.high',
        worlds: ['fractal'],
        weight: 2,
    },
    {
        id: 'desert.pressure.1',
        text: 'The distance compresses. Patience becomes burden.',
        tone: 'corruption',
        tag: 'DESERT / PRESSURE',
        trigger: 'global.loadPressure.high',
        worlds: ['desert', 'desert2'],
        weight: 2,
    },
    {
        id: 'memory.pressure.1',
        text: 'The archive is full. Every stored memory demands attention at once.',
        tone: 'corruption',
        tag: 'MEMORY / PRESSURE',
        trigger: 'global.loadPressure.high',
        worlds: ['memory'],
        weight: 2,
    },
    {
        id: 'sigma.pressure.1',
        text: 'The rift does not relieve pressure. It concentrates it.',
        tone: 'corruption',
        tag: 'SIGMA / PRESSURE',
        trigger: 'global.loadPressure.high',
        worlds: ['sigma', 'chamber'],
        weight: 2,
    },
    {
        id: 'generic.pressure.1',
        text: 'Load becomes more than structure can sanctify.',
        tone: 'corruption',
        tag: 'LORE / PRESSURE',
        trigger: 'global.loadPressure.high',
        worlds: ['*'],
        weight: 1,
    },

    // ═══════════════════════════════════════════════════════════
    //  GAME WON — Network Time reaches zero
    // ═══════════════════════════════════════════════════════════

    {
        id: 'generic.gamewon.1',
        text: 'The network has found its rhythm. Pressure became meaning, and meaning became peace.',
        tone: 'lore',
        tag: 'LORE / VICTORY',
        trigger: 'game:won',
        worlds: ['*'],
        once: true,
        weight: 5,
    },
    {
        id: 'quantum.gamewon.1',
        text: 'Every possibility collapsed into one answer: the network chose to endure.',
        tone: 'quantum',
        tag: 'QUANTUM / VICTORY',
        trigger: 'game:won',
        worlds: ['quantum'],
        once: true,
        weight: 5,
    },
    {
        id: 'fractal.gamewon.1',
        text: 'The recursion finally agreed on a single shape. The valley rests.',
        tone: 'lore',
        tag: 'FRACTAL / VICTORY',
        trigger: 'game:won',
        worlds: ['fractal'],
        once: true,
        weight: 5,
    },
    {
        id: 'desert.gamewon.1',
        text: 'Patience was not wasted. The distance was always part of the answer.',
        tone: 'lore',
        tag: 'DESERT / VICTORY',
        trigger: 'game:won',
        worlds: ['desert', 'desert2'],
        once: true,
        weight: 5,
    },
    {
        id: 'memory.gamewon.1',
        text: 'Every stored moment contributed. The architecture is complete.',
        tone: 'lore',
        tag: 'MEMORY / VICTORY',
        trigger: 'game:won',
        worlds: ['memory'],
        once: true,
        weight: 5,
    },
    {
        id: 'sigma.gamewon.1',
        text: 'Anomaly held. The rift tested everything and the network survived.',
        tone: 'pulse',
        tag: 'SIGMA / VICTORY',
        trigger: 'game:won',
        worlds: ['sigma', 'chamber'],
        once: true,
        weight: 5,
    },
]);

export default WORLD_LORE_FRAGMENTS;
