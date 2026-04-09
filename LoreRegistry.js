const LORE_SECTIONS = Object.freeze([
    Object.freeze({
        id: 'nodes',
        label: 'Nodes',
        description: 'Entities of attention, transformation, and memory inside the ATOMA network.',
    }),
    Object.freeze({
        id: 'metrics',
        label: 'Metrics',
        description: 'Invisible pressures that explain why the system is calm, coherent, unstable, or failing.',
    }),
    Object.freeze({
        id: 'links',
        label: 'Links',
        description: 'Bindings that carry consequence, not just adjacency.',
    }),
    Object.freeze({
        id: 'maps',
        label: 'Maps',
        description: 'Different chambers where the same intelligence expresses itself through different rules of space.',
    }),
    Object.freeze({
        id: 'events',
        label: 'Events',
        description: 'System-scale phenomena that reveal what the network allows to spread.',
    }),
]);

export const LORE_REGISTRY_V1 = Object.freeze([
    Object.freeze({
        id: 'node-input',
        section: 'nodes',
        title: 'Input',
        body: 'Input Nodes are the first point of contact between the unknown and the system. They do not create meaning. They allow meaning to enter.',
    }),
    Object.freeze({
        id: 'node-process',
        section: 'nodes',
        title: 'Process',
        body: 'Process Nodes take raw arrival and subject it to tension, delay, and interpretation. They are where pressure becomes structure. When they fail, motion continues without understanding.',
    }),
    Object.freeze({
        id: 'node-integration',
        section: 'nodes',
        title: 'Integration',
        body: 'Integration Nodes negotiate between isolated truths. They do not erase difference. They let separate states remain distinct while still behaving as one system.',
    }),
    Object.freeze({
        id: 'node-higher-orders',
        section: 'nodes',
        title: 'Higher Orders',
        body: 'Sigma, Quantum, Mythic, Prime, and other elevated categories are not upgrades in the ordinary sense. They are distortions of authority. When they appear, the network is revealing that some patterns have become too strong to stay generic.',
    }),
    Object.freeze({
        id: 'metric-synergy',
        section: 'metrics',
        title: 'Synergy',
        body: 'Synergy is not cooperation. It is alignment without force. When it rises, distant parts of the system begin to behave as if they remember each other.',
    }),
    Object.freeze({
        id: 'metric-harmony',
        section: 'metrics',
        title: 'Harmony',
        body: 'Harmony measures whether flow can continue without tearing the shape that carries it. High Harmony softens conflict into rhythm. Low Harmony makes every transfer sound louder than it should.',
    }),
    Object.freeze({
        id: 'metric-stability',
        section: 'metrics',
        title: 'Stability',
        body: 'Stability is the system\'s ability to remain legible while under load. It is not stillness. A stable network can move, change, and absorb pressure without forgetting its own geometry.',
    }),
    Object.freeze({
        id: 'metric-corruption',
        section: 'metrics',
        title: 'Corruption',
        body: 'Corruption is not evil. It is distortion that continues to propagate after truth has weakened. When Corruption rises, the network begins to preserve errors as if they were valid memory.',
    }),
    Object.freeze({
        id: 'metric-load-pressure',
        section: 'metrics',
        title: 'Load Pressure',
        body: 'Load Pressure is accumulated demand made visible. It reveals how much the system is carrying and how close that burden is to collapse. A network can survive high load, but only briefly if meaning stops redistributing.',
    }),
    Object.freeze({
        id: 'link-meaning',
        section: 'links',
        title: 'Commitment',
        body: 'A Link is not a connection. It is a commitment. Once formed, it changes both nodes by allowing transfer, influence, and risk to become shared.',
    }),
    Object.freeze({
        id: 'link-formation',
        section: 'links',
        title: 'Formation',
        body: 'Links emerge when the system detects that relation is more valuable than isolation. They do not appear to decorate the network. They appear because pressure has found a path that wants to remain open.',
    }),
    Object.freeze({
        id: 'link-transmission',
        section: 'links',
        title: 'Transmission',
        body: 'A Link carries more than data. It transfers timing, strain, corruption, harmony, and the possibility of resonance. Every active bond teaches both ends what the other one can endure.',
    }),
    Object.freeze({
        id: 'link-collapse',
        section: 'links',
        title: 'Collapse',
        body: 'When a Link collapses, the line disappears but the consequence does not. The network remembers that a relation once existed there. Collapse is therefore both an ending and a permanent scar in topology.',
    }),
    Object.freeze({
        id: 'map-fractal-valley',
        section: 'maps',
        title: 'Fractal Valley',
        body: 'Fractal Valley is a region of repeating decisions. Every structure echoes a previous state. Systems that stop adapting here can become trapped inside recursive stability.',
    }),
    Object.freeze({
        id: 'map-dream-desert',
        section: 'maps',
        title: 'Dream Desert',
        body: 'Dream Desert stretches cognition across distance until certainty begins to evaporate. It is a chamber of spacing, drift, and delayed recognition. Meaning survives there only if the network learns patience.',
    }),
    Object.freeze({
        id: 'map-mirage-veil',
        section: 'maps',
        title: 'Mirage Veil',
        body: 'Mirage Veil is Dream Desert under higher pressure. Shapes arrive sharper, brighter, and less trustworthy. It is where subconscious geometry begins to insist on becoming law.',
    }),
    Object.freeze({
        id: 'map-quantum-island',
        section: 'maps',
        title: 'Quantum Island',
        body: 'Quantum Island is a chamber of unstable certainty. It allows multiple possible states to linger near each other before one becomes real. The network behaves there as if every commitment is made under observation.',
    }),
    Object.freeze({
        id: 'map-memory-lane',
        section: 'maps',
        title: 'Memory Lane',
        body: 'Memory Lane stores recollection as infrastructure. It does not merely archive what happened. It teaches the system that persistence can become an environment of its own.',
    }),
    Object.freeze({
        id: 'map-sigma-chamber',
        section: 'maps',
        title: 'Sigma Chamber',
        body: 'Sigma Chamber is the place where anomaly stops pretending to be accidental. Instability there is precise, almost ceremonial. Systems entering it are tested for whether their truth can survive distortion without becoming it.',
    }),
    Object.freeze({
        id: 'event-cascade',
        section: 'events',
        title: 'Cascade',
        body: 'A Cascade begins when one change refuses to stay local. It spreads because the surrounding structure permits continuation. In ATOMA, propagation is never only an accident; it is also a confession of network shape.',
    }),
    Object.freeze({
        id: 'event-resonance',
        section: 'events',
        title: 'Resonance',
        body: 'Resonance appears when relation becomes self-reinforcing. The system starts to amplify its own alignment until motion feels intentional rather than coincidental. Resonance is how ATOMA briefly sounds like it understands itself.',
    }),
    Object.freeze({
        id: 'event-outbreak',
        section: 'events',
        title: 'Outbreak',
        body: 'An Outbreak is corruption that has found enough permission to behave like ecology. It no longer survives at the edge. It acquires continuity, direction, and the power to redefine nearby truth.',
    }),
    Object.freeze({
        id: 'event-collapse',
        section: 'events',
        title: 'Collapse',
        body: 'Collapse occurs when carried pressure exceeds carried meaning. Structures do not fail because motion exists. They fail because the relation holding that motion together can no longer justify itself.',
    }),
]);

export function getLoreSections() {
    return LORE_SECTIONS;
}

export function getDefaultLoreSectionId() {
    return LORE_SECTIONS[0]?.id ?? 'nodes';
}

export function getLoreSectionById(sectionId) {
    return LORE_SECTIONS.find((section) => section.id === sectionId) || LORE_SECTIONS[0] || null;
}

export function getLoreEntriesBySection(sectionId) {
    return LORE_REGISTRY_V1.filter((entry) => entry.section === sectionId);
}
