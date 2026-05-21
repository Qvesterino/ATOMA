/**
 * ATOMA AUDIO EVENT MANIFEST
 *
 * Canonical event -> audio trigger contract for the current event-driven path.
 * Keeps audio routing declarative and centralized.
 */

import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

export const AUDIO_EVENT_MANIFEST = {
    version: '2026-04-24',
    events: {
        'node.synergy.high': {
            synth: 'synergySynth',
            envelope: { attack: 0.5, decay: 1.0, sustain: 0.3, release: 2.0 },
            cooldownMs: 1200,
            priority: 'NORMAL',
            action: 'playSynergyActive'
        },
        'link.created': {
            cooldownMs: 140,
            priority: 'INTERACTIVE',
            action: 'playLinkCreated',
            passPayload: true
        },
        'link:synergyThreshold': {
            cooldownMs: 260,
            priority: 'INTERACTIVE',
            action: 'playLinkSynergyThreshold',
            passPayload: true
        },
        'link:harmonicLock': {
            cooldownMs: 340,
            priority: 'INTERACTIVE',
            action: 'playLinkHarmonicLock',
            passPayload: true
        },
        'node.harmony.mid': {
            cooldownMs: 420,
            priority: 'NORMAL',
            action: 'playNodeHarmonyMid',
            passPayload: true
        },
        'node.harmony.high': {
            cooldownMs: 720,
            priority: 'NORMAL',
            action: 'playNodeHarmonyHigh',
            passPayload: true
        },
        'global.harmony.mid': {
            cooldownMs: 1200,
            priority: 'NORMAL',
            action: 'playGlobalHarmonyMid',
            passPayload: true
        },
        'global.harmony.high': {
            cooldownMs: 1800,
            priority: 'NORMAL',
            action: 'playGlobalHarmonyHigh',
            passPayload: true
        },
        'link.corruption.high': {
            cooldownMs: 680,
            priority: 'INTERACTIVE',
            action: 'playLinkCorruptionHigh',
            passPayload: true
        },
        'synergy.fade': {
            synth: 'synergySynth',
            envelope: { attack: 0.2, decay: 0.4, sustain: 0.0, release: 1.0 },
            cooldownMs: 900,
            priority: 'NORMAL',
            action: 'playSynergyFade'
        },
        'world.macroState.changed': {
            cooldownMs: 0,
            priority: 'INTERACTIVE',
            action: 'playWorldMacroStateChanged',
            passPayload: true
        },
        'worldFX.event': {
            cooldownMs: 180,
            priority: 'NORMAL',
            action: 'playRoutedEventAudio',
            passPayload: true
        },
        'environment.hazard.active': {
            cooldownMs: 220,
            priority: 'NORMAL',
            action: 'playRoutedEventAudio',
            passPayload: true
        },
        'environment.pressure.phase': {
            cooldownMs: 180,
            priority: 'NORMAL',
            action: 'playRoutedEventAudio',
            passPayload: true
        },
        'environment.hazard.phase': {
            cooldownMs: 180,
            priority: 'NORMAL',
            action: 'playRoutedEventAudio',
            passPayload: true
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
    eventRegistrationRegistry.disposeOwner('AtomaAudioEventManifest');

    const tryTrigger = (eventName, methodName, payload = undefined) => {
        const cfg = AUDIO_EVENT_MANIFEST.events[eventName];
        if (!cfg || !methodName) return;
        if (audioSystem.enabled === false) return;

        const now = performance.now();
        const key = `${eventName}:${methodName}`;
        const lastAt = lastTriggerAt.get(key) ?? -Infinity;
        if (now - lastAt < (cfg.cooldownMs ?? 0)) return;

        const fn = audioSystem[methodName];
        if (typeof fn !== 'function') return;

        if (cfg.passPayload) {
            fn.call(audioSystem, payload, eventName, cfg);
        } else {
            fn.call(audioSystem);
        }
        lastTriggerAt.set(key, now);
    };

    Object.entries(AUDIO_EVENT_MANIFEST.events).forEach(([eventName, cfg]) => {
        const priority = resolvePriority(semanticBus, cfg.priority);
        const unsubscribe = eventRegistrationRegistry.register(
            'AtomaAudioEventManifest',
            eventName,
            (payload) => {
            if (cfg.routeByPayload) {
                const eventType = payload?.type;
                const methodName = cfg.routeByPayload[eventType];
                tryTrigger(eventName, methodName, payload);
                return;
            }
            tryTrigger(eventName, cfg.action, payload);
            },
            semanticBus,
            priority !== undefined ? { priority } : undefined
        );

        if (typeof unsubscribe === 'function') {
            unsubscribers.push(unsubscribe);
        }
    });

    return () => {
        eventRegistrationRegistry.disposeOwner('AtomaAudioEventManifest');
        unsubscribers.forEach((unsub) => {
            try {
                unsub();
            } catch (_) {
                // Ignore individual unsubscribe errors to preserve cleanup path.
            }
        });
    };
}
