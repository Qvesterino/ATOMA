/**
 * ATOMA AUDIO EVENT MANIFEST
 *
 * Canonical event -> audio trigger contract for the current event-driven path.
 * Keeps audio routing declarative and centralized.
 */

export const AUDIO_EVENT_MANIFEST = {
    version: '2026-03-23',
    events: {
        'node.synergy.high': {
            synth: 'synergySynth',
            envelope: { attack: 0.5, decay: 1.0, sustain: 0.3, release: 2.0 },
            cooldownMs: 1200,
            priority: 'NORMAL',
            action: 'playSynergyActive'
        },
        'synergy.fade': {
            synth: 'synergySynth',
            envelope: { attack: 0.2, decay: 0.4, sustain: 0.0, release: 1.0 },
            cooldownMs: 900,
            priority: 'NORMAL',
            action: 'playSynergyFade'
        }
    }
};

function resolvePriority(bus, priorityName) {
    if (!bus?.priority) return undefined;
    if (!priorityName) return bus.priority.NORMAL;
    return bus.priority[priorityName] ?? bus.priority.NORMAL;
}

export function registerAtomaAudioEventManifest({ semanticBus, audioSystem }) {
    if (!semanticBus?.subscribe || !audioSystem) return () => {};

    const lastTriggerAt = new Map();
    const unsubscribers = [];

    const tryTrigger = (eventName, methodName) => {
        const cfg = AUDIO_EVENT_MANIFEST.events[eventName];
        if (!cfg || !methodName) return;
        if (audioSystem.enabled === false) return;

        const now = performance.now();
        const key = `${eventName}:${methodName}`;
        const lastAt = lastTriggerAt.get(key) ?? -Infinity;
        if (now - lastAt < (cfg.cooldownMs ?? 0)) return;

        const fn = audioSystem[methodName];
        if (typeof fn !== 'function') return;

        fn.call(audioSystem);
        lastTriggerAt.set(key, now);
    };

    Object.entries(AUDIO_EVENT_MANIFEST.events).forEach(([eventName, cfg]) => {
        const priority = resolvePriority(semanticBus, cfg.priority);
        const unsubscribe = semanticBus.subscribe(eventName, (payload) => {
            if (cfg.routeByPayload) {
                const eventType = payload?.type;
                const methodName = cfg.routeByPayload[eventType];
                tryTrigger(eventName, methodName);
                return;
            }
            tryTrigger(eventName, cfg.action);
        }, priority !== undefined ? { priority } : undefined);

        if (typeof unsubscribe === 'function') {
            unsubscribers.push(unsubscribe);
        }
    });

    return () => {
        unsubscribers.forEach((unsub) => {
            try {
                unsub();
            } catch (_) {
                // Ignore individual unsubscribe errors to preserve cleanup path.
            }
        });
    };
}
