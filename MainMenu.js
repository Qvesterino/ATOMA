import { getUIVisibilitySettingsRows } from './ui/config/UIVisibilityConfig.js';
import {
    getDefaultLoreSectionId,
    getLoreEntriesBySection,
    getLoreSectionById,
    getLoreSections,
} from './LoreRegistry.js';
import { META_PROGRESSION_VERSION, sanitizeMetaProgression } from './RunIdentityProfiles.js';
import { ATOMA_VERSION } from './src/config/version.js';

const MENU_PROFILE_STORAGE_KEY = 'atoma.menu.profile.v1';
const MENU_SNAPSHOT_STORAGE_KEY = 'atoma.menu.snapshot.v1';
const MENU_DEV_UNLOCK_STORAGE_KEY = 'atoma.dev.unlockMaps';
const MENU_STYLE_ID = 'atoma-main-menu-style';
const MENU_PROFILE_VERSION = 1;
const MENU_SNAPSHOT_VERSION = 1;
const MENU_BUILD_LABEL = ATOMA_VERSION;
const VISUAL_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
const SOUND_LEVELS = [0, 20, 40, 60, 80, 100];
const GUIDED_FLOW_VERSION = 1;
export const SETTING_FEEDBACK_STATE = Object.freeze({
    APPLIED: 'APPLIED',
    PENDING: 'PENDING',
    TRANSITIONING: 'TRANSITIONING',
});
const DEFAULT_SETTINGS = Object.freeze({
    soundLevel: 60,
    visuals: 'HIGH',
    particles: true,
    audioMuted: false,
    postProcessing: false,
    luminosityBloom: false,
    nodeRotations: true,
    semanticPictograms: true,
    environmentalHazards: true,
    cinematicNodeShaders: true,
});

const MENU_MAPS = Object.freeze([
    {
        id: 'quantum',
        label: 'QUANTUM ISLAND',
        footerLabel: 'Quantum Island',
        releaseState: 'available',
        description: 'Probabilistic terrain with unstable gradients and uncertain silhouettes.',
        tagline: 'Probability collapses into form',
        mood: ['uncertain', 'electric', 'emergent'],
        fantasy: 'The default proving ground. Unstable gradients force rapid adaptation. Every link is a gamble that might pay off.',
        risk: 'moderate',
        prosperity: 'moderate',
        accentColor: '#00d4ff',
        accentRgb: '0, 212, 255',
        scoreConfig: { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 },  // standard difficulty
    },
    {
        id: 'desert',
        label: 'DREAM DESERT',
        footerLabel: 'Dream Desert',
        releaseState: 'available',
        description: 'Surreal cognitive horizon with wide spacing and soft atmospheric drift.',
        tagline: 'Thoughts drift like dunes',
        mood: ['surreal', 'vast', 'contemplative'],
        fantasy: 'An open dreamscape where nodes have room to breathe. Sparse placement rewards deliberate connection strategy.',
        risk: 'low',
        prosperity: 'moderate',
        accentColor: '#ffc107',
        accentRgb: '255, 193, 7',
        scoreConfig: { sustainDuration: 4.5, rewindSpeed: 4.0, forwardSpeed: 5, synergyThreshold: 0.50 },  // easier: faster rewind, lower threshold, shorter sustain
    },
    {
        id: 'memory',
        label: 'MEMORY LANE',
        footerLabel: 'Memory Lane',
        releaseState: 'coming-soon',
        releaseLabel: 'COMING SOON',
        description: 'Endless corridor of archived echoes, server towers, and slow drifting recollection.',
        tagline: 'Every echo remembers you',
        mood: ['nostalgic', 'linear', 'haunted'],
        fantasy: 'A corridor of archived signals. Linear topology rewards chain-building and sequential harmony propagation.',
        risk: 'low',
        prosperity: 'moderate',
        accentColor: '#b44dff',
        accentRgb: '180, 77, 255',
        scoreConfig: { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 },  // unified release score rule
    },
    {
        id: 'sigma',
        label: 'SIGMA CHAMBER',
        footerLabel: 'Sigma Chamber',
        releaseState: 'coming-soon',
        releaseLabel: 'COMING SOON',
        description: 'Anomalous chamber with sharper tension, instability, and glitch pressure.',
        tagline: 'The system tests itself here',
        mood: ['tense', 'glitched', 'adversarial'],
        fantasy: 'A pressure chamber designed to push networks to failure. High risk, high reward. Only for those who understand cascade mechanics.',
        risk: 'extreme',
        prosperity: 'extreme',
        accentColor: '#ff3d8e',
        accentRgb: '255, 61, 142',
        scoreConfig: { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 },  // unified release score rule
    },
    {
        id: 'desert2',
        label: 'MIRAGE VEIL',
        footerLabel: 'Mirage Veil',
        releaseState: 'coming-soon',
        releaseLabel: 'COMING SOON',
        description: 'A denser second dreamscape with sharper dunes, brighter mirage pressure, and a deeper horizon.',
        tagline: 'Reality shimmers at the edge',
        mood: ['hallucinatory', 'dense', 'shifting'],
        fantasy: 'A compressed dreamscape where mirages distort perception. Dense node placement creates cascade pressure.',
        risk: 'moderate',
        prosperity: 'high',
        accentColor: '#ff9800',
        accentRgb: '255, 152, 0',
        scoreConfig: { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 },  // unified release score rule
    },
    {
        id: 'fractal',
        label: 'FRACTAL VALLEY',
        footerLabel: 'Fractal Valley',
        releaseState: 'coming-soon',
        releaseLabel: 'COMING SOON',
        description: 'Recursive mathematical space. Calm, structured, and self-similar.',
        tagline: 'Where mathematics breathes',
        mood: ['serene', 'infinite', 'geometric'],
        fantasy: 'A contemplative space where patterns repeat into eternity. Ideal for understanding network harmony through observation.',
        risk: 'calm',
        prosperity: 'high',
        accentColor: '#00e5a0',
        accentRgb: '0, 229, 160',
        scoreConfig: { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 },  // unified release score rule
    },
]);

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function lerp(start, end, alpha) {
    return start + (end - start) * alpha;
}

function isTruthyStorageValue(value) {
    if (value == null) return false;
    const normalized = String(value).trim().toLowerCase();
    return normalized !== '' && normalized !== '0' && normalized !== 'false' && normalized !== 'off';
}

function getMenuMapById(mapId) {
    return MENU_MAPS.find((map) => map.id === mapId) || MENU_MAPS[0];
}

function readStorageJSON(key) {
    try {
        if (typeof localStorage === 'undefined') return null;
        const stored = localStorage.getItem(key);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

function writeStorageJSON(key, value) {
    try {
        if (typeof localStorage === 'undefined') return false;
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

function removeStorageKey(key) {
    try {
        if (typeof localStorage === 'undefined') return false;
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

function sanitizeSelectedMapId(value) {
    if (typeof value !== 'string') {
        return MENU_MAPS[0].id;
    }

    const normalized = value.trim().toLowerCase();
    return getMenuMapById(normalized).id;
}

function sanitizeOnboarding(value) {
    const onboarding = value && typeof value === 'object' ? value : {};
    return {
        guidedFlowVersion: Number.isFinite(Number(onboarding.guidedFlowVersion))
            ? Number(onboarding.guidedFlowVersion)
            : GUIDED_FLOW_VERSION,
        firstRunCompleted: onboarding.firstRunCompleted === true,
    };
}

function isFirstRunGuidanceActive(profile) {
    const onboarding = sanitizeOnboarding(profile?.onboarding);
    return onboarding.firstRunCompleted !== true || onboarding.guidedFlowVersion !== GUIDED_FLOW_VERSION;
}

function getFirstRunWorldPromise(mapId) {
    const selectedMap = getMenuMapById(mapId);
    if (selectedMap?.id === 'desert') {
        return 'Dream Desert rewards patience. Build the lattice, open the surge, then prevent collapse through cleaner structure.';
    }
    return 'Quantum Island is the recommended first run. Build the lattice, open the surge, then prevent collapse before dirty momentum tears the hold apart.';
}

function resolveSettingFeedback(feedbackById, settingId) {
    if (!feedbackById) return null;
    if (feedbackById instanceof Map) {
        return feedbackById.get(settingId) || null;
    }
    if (typeof feedbackById === 'object') {
        return feedbackById[settingId] || null;
    }
    return null;
}

function getSettingFeedbackCopy(feedback) {
    switch (feedback?.state) {
        case SETTING_FEEDBACK_STATE.TRANSITIONING:
            return {
                label: 'TRANSITIONING',
                detail: String(feedback?.detail || 'Applying the live runtime transition.'),
                tone: 'transitioning',
            };
        case SETTING_FEEDBACK_STATE.PENDING:
            return {
                label: 'PENDING',
                detail: String(feedback?.detail || 'Preference stored. It will apply when the runtime is ready.'),
                tone: 'pending',
            };
        case SETTING_FEEDBACK_STATE.APPLIED:
            return {
                label: 'APPLIED',
                detail: String(feedback?.detail || 'Live runtime confirmed the change.'),
                tone: 'applied',
            };
        default:
            return null;
    }
}

export function isMapPubliclyAvailable(mapId) {
    return getMenuMapById(sanitizeSelectedMapId(mapId)).releaseState !== 'coming-soon';
}

export function isMenuDevMapUnlockEnabled() {
    try {
        if (typeof localStorage === 'undefined') return false;
        return isTruthyStorageValue(localStorage.getItem(MENU_DEV_UNLOCK_STORAGE_KEY));
    } catch {
        return false;
    }
}

export function setMenuDevMapUnlockEnabled(enabled) {
    const nextEnabled = enabled === true;
    try {
        if (typeof localStorage !== 'undefined') {
            if (nextEnabled) {
                localStorage.setItem(MENU_DEV_UNLOCK_STORAGE_KEY, '1');
            } else {
                localStorage.removeItem(MENU_DEV_UNLOCK_STORAGE_KEY);
            }
        }
    } catch {
        // Ignore persistence failures and still return requested state.
    }
    return nextEnabled;
}

export function canAccessMap(mapId, { devUnlock = isMenuDevMapUnlockEnabled() } = {}) {
    const normalizedMapId = sanitizeSelectedMapId(mapId);
    return isMapPubliclyAvailable(normalizedMapId) || devUnlock === true;
}

export function resolvePublicSelectedMapId(mapId, { devUnlock = isMenuDevMapUnlockEnabled() } = {}) {
    const normalizedMapId = sanitizeSelectedMapId(mapId);
    return canAccessMap(normalizedMapId, { devUnlock }) ? normalizedMapId : MENU_MAPS[0].id;
}

function getAudioEnabledPreference() {
    if (typeof window === 'undefined') return true;

    if (window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ !== undefined) {
        return window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ !== false;
    }

    try {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('atoma.audio.enabled');
            if (stored !== null) {
                return stored !== '0' && stored !== 'false';
            }
        }
    } catch {
        // fall through to destination state
    }

    const destination = window.Tone?.getDestination?.() || window.Tone?.Destination || null;
    if (destination && 'mute' in destination) {
        return !destination.mute;
    }

    return true;
}

export function isMenuAudioMuted() {
    return !getAudioEnabledPreference();
}

function applyAudioEnabledPreference(enabled) {
    const nextEnabled = enabled !== false;

    if (typeof window !== 'undefined' && typeof window.setAudioEnabled === 'function') {
        return window.setAudioEnabled(nextEnabled);
    }

    if (typeof window === 'undefined') {
        return nextEnabled;
    }

    const audioSystem = window.game?.audioSystem || null;
    if (audioSystem?.setEnabled) {
        try {
            audioSystem.setEnabled(nextEnabled);
        } catch {
            // ignore audio-system specific failures and fall back to direct state writes
        }
    }

    window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ = nextEnabled;

    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('atoma.audio.enabled', nextEnabled ? '1' : '0');
        }
    } catch {
        // ignore persistence failures
    }

    const destination = window.Tone?.getDestination?.() || window.Tone?.Destination || null;
    if (destination && 'mute' in destination) {
        destination.mute = !nextEnabled;
    }

    if (audioSystem) {
        audioSystem.enabled = nextEnabled;
    }

    const audioReady = !!audioSystem?.initialized;

    if (window.game?.audioModulation?.setEnabled) {
        window.game.audioModulation.setEnabled(nextEnabled && audioReady);
    }
    if (window.game?.harmonicAudio?.setEnabled) {
        window.game.harmonicAudio.setEnabled(nextEnabled && audioReady);
    }
    if (window.game?.zoneAudioReactivity?.setEnabled) {
        window.game.zoneAudioReactivity.setEnabled(nextEnabled && audioReady);
    }

    window.__ATOMA_UPDATE_AUDIO_MUTE_TOGGLE__?.();
    return nextEnabled;
}

export function setMenuAudioMuted(muted) {
    return applyAudioEnabledPreference(!muted);
}

function sanitizeSettings(value) {
    const settings = value && typeof value === 'object' ? value : {};
    const soundLevel = Number(settings.soundLevel);
    const visuals = typeof settings.visuals === 'string' ? settings.visuals.toUpperCase() : DEFAULT_SETTINGS.visuals;
    const audioMuted = typeof settings.audioMuted === 'boolean' ? settings.audioMuted : isMenuAudioMuted();

    return {
        soundLevel: SOUND_LEVELS.includes(soundLevel) ? soundLevel : DEFAULT_SETTINGS.soundLevel,
        visuals: VISUAL_LEVELS.includes(visuals) ? visuals : DEFAULT_SETTINGS.visuals,
        particles: settings.particles !== false,
        audioMuted,
        postProcessing: settings.postProcessing === true,
        luminosityBloom: settings.luminosityBloom === true,
        nodeRotations: settings.nodeRotations !== false,
        semanticPictograms: settings.semanticPictograms !== false,
        environmentalHazards: settings.environmentalHazards !== false,
        cinematicNodeShaders: settings.cinematicNodeShaders !== false,
    };
}

function sanitizeProfile(value) {
    const profile = value && typeof value === 'object' ? value : {};
    return {
        version: MENU_PROFILE_VERSION,
        selectedMapId: sanitizeSelectedMapId(profile.selectedMapId),
        settings: sanitizeSettings(profile.settings),
        onboarding: sanitizeOnboarding(profile.onboarding),
        metaProgression: sanitizeMetaProgression({
            version: META_PROGRESSION_VERSION,
            ...(profile.metaProgression || {})
        }),
    };
}

function sanitizeSnapshot(value) {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const worldId = sanitizeSelectedMapId(value.worldId || value.selectedMapId);
    const selectedMapId = sanitizeSelectedMapId(value.selectedMapId || worldId);
    const savedAt = Number(value.savedAt);

    return {
        version: MENU_SNAPSHOT_VERSION,
        worldId,
        selectedMapId,
        savedAt: Number.isFinite(savedAt) ? savedAt : Date.now(),
        settingsVersion: MENU_PROFILE_VERSION,
    };
}

export function getMenuMaps() {
    return MENU_MAPS.map((map) => ({ ...map }));
}

export function loadMenuProfile() {
    return sanitizeProfile(readStorageJSON(MENU_PROFILE_STORAGE_KEY));
}

export function saveMenuProfile(profile) {
    const nextProfile = sanitizeProfile(profile);
    writeStorageJSON(MENU_PROFILE_STORAGE_KEY, nextProfile);
    return nextProfile;
}

export function loadContinueSnapshot() {
    return sanitizeSnapshot(readStorageJSON(MENU_SNAPSHOT_STORAGE_KEY));
}

export function saveContinueSnapshot(snapshot) {
    const nextSnapshot = sanitizeSnapshot(snapshot);
    if (!nextSnapshot) return null;
    writeStorageJSON(MENU_SNAPSHOT_STORAGE_KEY, nextSnapshot);
    return nextSnapshot;
}

export function clearContinueSnapshot() {
    removeStorageKey(MENU_SNAPSHOT_STORAGE_KEY);
}

export function ensureMenuStyles() {
    if (document.getElementById(MENU_STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');
    style.id = MENU_STYLE_ID;
    style.textContent = `
        .atoma-main-menu {
            position: fixed;
            inset: 0;
            z-index: 12000;
            overflow: hidden;
            background:
                radial-gradient(circle at top, rgba(18, 44, 58, 0.55), transparent 48%),
                linear-gradient(180deg, rgba(3, 10, 16, 0.96) 0%, rgba(4, 9, 13, 0.98) 100%);
            color: #d8fbff;
            opacity: 1;
            transition: opacity 180ms ease;
            font-family: 'Rajdhani', 'Segoe UI', sans-serif;
        }

        .atoma-main-menu.atoma-pause-menu {
            background: rgba(3, 10, 16, 0.18);
            backdrop-filter: blur(18px) saturate(1.3);
            -webkit-backdrop-filter: blur(18px) saturate(1.3);
        }

        .atoma-main-menu.atoma-pause-menu .atoma-main-menu__canvas {
            display: none;
        }

        .atoma-main-menu.atoma-pause-menu .atoma-main-menu__overlay {
            padding: 36px 24px 24px;
        }

        .atoma-main-menu.atoma-pause-menu .atoma-main-menu__panel {
            min-height: auto;
            max-width: 700px;
            background: linear-gradient(180deg, rgba(7, 17, 24, 0.82), rgba(4, 10, 16, 0.68));
            border-color: rgba(96, 236, 255, 0.12);
        }

        .atoma-main-menu__pause-badge {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px 16px;
            border-radius: 999px;
            background: rgba(255, 61, 142, 0.10);
            border: 1px solid rgba(255, 61, 142, 0.25);
            font-size: 9px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: rgba(255, 130, 175, 0.90);
        }

        .atoma-main-menu__pause-badge-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #ff3d8e;
            animation: atoma-pause-pulse 1.8s ease-in-out infinite;
        }

        @keyframes atoma-pause-pulse {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
        }

        .atoma-main-menu__pause-status {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .atoma-main-menu__pause-status-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 9px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
        }

        .atoma-main-menu__pause-status-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
        }

        .atoma-main-menu__pause-status-dot--paused {
            background: #ff3d8e;
            box-shadow: 0 0 6px rgba(255, 61, 142, 0.5);
        }

        .atoma-main-menu__pause-status-dot--alive {
            background: #00e5a0;
            box-shadow: 0 0 6px rgba(0, 229, 160, 0.5);
            animation: atoma-pause-pulse 2.4s ease-in-out infinite;
        }

        .atoma-main-menu.is-hidden {
            opacity: 0;
            pointer-events: none;
        }

        .atoma-main-menu__canvas {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            opacity: 0.72;
        }

        .atoma-main-menu__overlay {
            position: relative;
            z-index: 1;
            display: flex;
            min-height: 100%;
            padding: 48px 24px 32px;
            align-items: center;
            justify-content: center;
        }

        .atoma-main-menu__panel {
            width: min(760px, 100%);
            min-height: min(82vh, 760px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 22px;
            padding: 36px 30px 28px;
            border: 1px solid rgba(96, 236, 255, 0.18);
            border-radius: 22px;
            background: linear-gradient(180deg, rgba(7, 17, 24, 0.78), rgba(4, 10, 16, 0.62));
            box-shadow:
                0 0 36px rgba(0, 201, 255, 0.10),
                inset 0 0 24px rgba(117, 246, 255, 0.04);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .atoma-main-menu__hero {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        .atoma-main-menu__logo {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background:
                radial-gradient(circle at 35% 35%, rgba(194, 253, 255, 0.92), rgba(62, 214, 231, 0.68) 28%, rgba(14, 112, 128, 0.18) 62%, transparent 74%),
                radial-gradient(circle at center, rgba(77, 238, 255, 0.30), transparent 68%);
            border: 1px solid rgba(147, 247, 255, 0.22);
            box-shadow:
                0 0 28px rgba(77, 238, 255, 0.12),
                inset 0 0 22px rgba(212, 253, 255, 0.08);
        }

        .atoma-main-menu__title {
            font-family: 'Orbitron', 'Segoe UI', sans-serif;
            font-size: clamp(42px, 7vw, 72px);
            letter-spacing: 0.42em;
            text-transform: uppercase;
            padding-left: 0.42em;
            color: #f1feff;
            text-shadow: 0 0 18px rgba(83, 233, 255, 0.22);
        }

        .atoma-main-menu__subtitle,
        .atoma-main-menu__screen-title,
        .atoma-main-menu__hint,
        .atoma-main-menu__description,
        .atoma-main-menu__status {
            text-transform: uppercase;
            letter-spacing: 0.14em;
        }

        .atoma-main-menu__subtitle {
            color: rgba(160, 226, 235, 0.68);
            font-size: 11px;
        }

        .atoma-main-menu__divider {
            width: min(320px, 70%);
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(128, 243, 255, 0.62), transparent);
        }

        .atoma-main-menu__screen-title {
            color: rgba(119, 243, 255, 0.9);
            font-size: 12px;
        }

        .atoma-main-menu__content {
            width: min(520px, 100%);
            display: flex;
            flex-direction: column;
            gap: 14px;
            align-items: stretch;
        }

        .atoma-main-menu__content--scrollable {
            max-height: min(46vh, 480px);
            overflow-y: auto;
            padding-right: 6px;
            min-height: 0;
            scrollbar-width: thin;
            scrollbar-color: rgba(108, 234, 255, 0.5) transparent;
            overscroll-behavior: contain;
        }

        .atoma-main-menu__content--scrollable::-webkit-scrollbar {
            width: 7px;
        }

        .atoma-main-menu__content--scrollable::-webkit-scrollbar-thumb {
            background: rgba(108, 234, 255, 0.42);
            border-radius: 999px;
        }

        .atoma-main-menu__section {
            margin-top: 8px;
            color: rgba(119, 243, 255, 0.88);
            font-size: 12px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            text-align: center;
        }

        .atoma-main-menu__list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: stretch;
        }

        .atoma-main-menu__button {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            width: 100%;
            min-height: 54px;
            padding: 0 18px;
            border: 1px solid transparent;
            border-radius: 16px;
            background: transparent;
            color: #ddfdff;
            cursor: pointer;
            transition: border-color 120ms ease, background 120ms ease;
            transform-origin: center center;
            font: inherit;
            text-align: center;
        }

        .atoma-main-menu__button:hover {
            border-color: rgba(108, 234, 255, 0.18);
            background: rgba(10, 28, 40, 0.32);
        }

        .atoma-main-menu__button--setting {
            justify-content: space-between;
            text-align: left;
        }

        .atoma-main-menu__button--toggle {
            justify-content: space-between;
            text-align: left;
            border-color: rgba(108, 234, 255, 0.10);
            background: rgba(10, 28, 40, 0.12);
        }

        .atoma-main-menu__button--map {
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
        }

        .atoma-main-menu__marker {
            width: 20px;
            color: #8df8ff;
            opacity: 0;
            flex: 0 0 auto;
            text-shadow: 0 0 10px rgba(105, 239, 255, 0.45);
        }

        .atoma-main-menu__label {
            flex: 1 1 auto;
            font-size: clamp(18px, 2.4vw, 28px);
            letter-spacing: 0.18em;
            text-transform: uppercase;
        }

        .atoma-main-menu__button--setting .atoma-main-menu__label,
        .atoma-main-menu__button--map .atoma-main-menu__label {
            font-size: 16px;
        }

        .atoma-main-menu__value {
            color: rgba(204, 248, 255, 0.82);
            letter-spacing: 0.10em;
            text-transform: uppercase;
            flex: 0 0 auto;
            white-space: nowrap;
        }

        .atoma-main-menu__setting-feedback {
            margin-left: 10px;
            padding: 3px 8px 2px;
            border-radius: 999px;
            border: 1px solid rgba(108, 234, 255, 0.16);
            background: rgba(12, 28, 36, 0.42);
            font-size: 8px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: rgba(205, 245, 250, 0.72);
            white-space: nowrap;
        }

        .atoma-main-menu__setting-feedback--applied {
            color: rgba(126, 244, 188, 0.92);
            border-color: rgba(126, 244, 188, 0.24);
            background: rgba(8, 32, 24, 0.42);
        }

        .atoma-main-menu__setting-feedback--pending {
            color: rgba(255, 210, 133, 0.94);
            border-color: rgba(255, 193, 7, 0.22);
            background: rgba(40, 24, 8, 0.38);
        }

        .atoma-main-menu__setting-feedback--transitioning {
            color: rgba(141, 248, 255, 0.95);
            border-color: rgba(108, 234, 255, 0.28);
            background: rgba(8, 30, 36, 0.44);
            animation: atoma-setting-feedback-pulse 1.25s ease-in-out infinite;
        }

        @keyframes atoma-setting-feedback-pulse {
            0%, 100% { opacity: 0.76; }
            50% { opacity: 1; }
        }

        .atoma-main-menu__meta {
            color: rgba(155, 223, 231, 0.62);
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: none;
        }

        .atoma-main-menu__description,
        .atoma-main-menu__hint,
        .atoma-main-menu__status {
            text-align: center;
            font-size: 11px;
            color: rgba(161, 227, 235, 0.64);
        }

        .atoma-main-menu__description {
            min-height: 34px;
            text-transform: none;
            letter-spacing: 0.06em;
            line-height: 1.7;
        }

        .atoma-main-menu__first-run-callout {
            padding: 12px 14px;
            border: 1px solid rgba(108, 234, 255, 0.16);
            border-radius: 16px;
            background: linear-gradient(180deg, rgba(8, 20, 30, 0.58), rgba(6, 14, 22, 0.44));
            box-shadow: inset 0 0 20px rgba(117, 246, 255, 0.03);
            display: flex;
            flex-direction: column;
            gap: 7px;
        }

        .atoma-main-menu__first-run-title {
            font-size: 10px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(119, 243, 255, 0.88);
        }

        .atoma-main-menu__first-run-body,
        .atoma-main-menu__first-run-note {
            font-size: 10px;
            line-height: 1.65;
            letter-spacing: 0.04em;
            text-transform: none;
            color: rgba(196, 241, 247, 0.78);
            text-align: center;
        }

        .atoma-main-menu__first-run-steps {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 6px;
        }

        .atoma-main-menu__first-run-step {
            font-size: 8px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            padding: 4px 8px;
            border-radius: 999px;
            border: 1px solid rgba(108, 234, 255, 0.14);
            color: rgba(208, 247, 252, 0.82);
            background: rgba(10, 28, 40, 0.22);
        }

        .atoma-main-menu__lore-panel {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .atoma-main-menu__lore-tabs {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
            gap: 8px;
        }

        .atoma-main-menu__lore-tab {
            min-height: 42px;
            padding: 0 10px;
            border: 1px solid rgba(108, 234, 255, 0.12);
            border-radius: 14px;
            background: rgba(10, 28, 40, 0.10);
            color: rgba(197, 245, 250, 0.72);
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font: inherit;
            font-size: 11px;
            cursor: pointer;
            transition: border-color 140ms ease, background 140ms ease, color 140ms ease, box-shadow 140ms ease;
        }

        .atoma-main-menu__lore-tab:hover {
            border-color: rgba(108, 234, 255, 0.22);
            color: rgba(225, 252, 255, 0.92);
        }

        .atoma-main-menu__lore-tab.is-active {
            border-color: rgba(108, 234, 255, 0.30);
            background: rgba(12, 32, 44, 0.42);
            color: #f1feff;
            box-shadow: 0 0 18px rgba(90, 236, 255, 0.14);
        }

        .atoma-main-menu__lore-body {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: min(46vh, 520px);
            padding: 16px;
            border: 1px solid rgba(101, 234, 255, 0.16);
            border-radius: 18px;
            background: rgba(8, 20, 28, 0.42);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(108, 234, 255, 0.5) transparent;
        }

        .atoma-main-menu__lore-body::-webkit-scrollbar {
            width: 7px;
        }

        .atoma-main-menu__lore-body::-webkit-scrollbar-thumb {
            background: rgba(108, 234, 255, 0.42);
            border-radius: 999px;
        }

        .atoma-main-menu__lore-section-copy {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 0 4px;
        }

        .atoma-main-menu__lore-kicker {
            color: rgba(119, 243, 255, 0.88);
            font-size: 10px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
        }

        .atoma-main-menu__lore-summary {
            color: rgba(214, 247, 252, 0.84);
            font-size: 13px;
            line-height: 1.65;
            letter-spacing: 0.05em;
            text-transform: none;
        }

        .atoma-main-menu__lore-featured {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(220px, 0.8fr);
            gap: 14px;
            padding: 18px;
            border: 1px solid rgba(108, 234, 255, 0.18);
            border-radius: 20px;
            background:
                radial-gradient(circle at top left, rgba(90, 236, 255, 0.10), transparent 42%),
                linear-gradient(180deg, rgba(10, 26, 36, 0.84), rgba(6, 16, 24, 0.72));
            box-shadow:
                0 0 24px rgba(90, 236, 255, 0.08),
                inset 0 0 28px rgba(117, 246, 255, 0.04);
        }

        .atoma-main-menu__lore-featured-copy {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .atoma-main-menu__lore-featured-label {
            color: rgba(119, 243, 255, 0.9);
            font-size: 10px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
        }

        .atoma-main-menu__lore-featured-title {
            color: #f1feff;
            font-family: 'Orbitron', 'Segoe UI', sans-serif;
            font-size: clamp(22px, 3vw, 34px);
            letter-spacing: 0.14em;
            text-transform: uppercase;
        }

        .atoma-main-menu__lore-featured-subtitle {
            color: rgba(119, 243, 255, 0.84);
            font-size: 11px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
        }

        .atoma-main-menu__lore-featured-order {
            color: rgba(255, 214, 140, 0.92);
            font-size: 11px;
            line-height: 1.6;
            letter-spacing: 0.05em;
            text-transform: none;
        }

        .atoma-main-menu__lore-featured-summary {
            color: rgba(214, 247, 252, 0.86);
            font-size: 13px;
            line-height: 1.7;
            letter-spacing: 0.05em;
            text-transform: none;
        }

        .atoma-main-menu__lore-featured-meta {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 14px;
            border-radius: 16px;
            background: rgba(5, 13, 19, 0.42);
            border: 1px solid rgba(108, 234, 255, 0.10);
        }

        .atoma-main-menu__lore-featured-stat {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .atoma-main-menu__lore-featured-stat-label {
            color: rgba(119, 243, 255, 0.70);
            font-size: 9px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
        }

        .atoma-main-menu__lore-featured-stat-value {
            color: rgba(232, 252, 255, 0.90);
            font-size: 12px;
            line-height: 1.55;
            letter-spacing: 0.04em;
            text-transform: none;
        }

        .atoma-main-menu__lore-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 12px;
        }

        .atoma-main-menu__lore-card {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-height: 180px;
            padding: 16px;
            border: 1px solid rgba(108, 234, 255, 0.14);
            border-radius: 18px;
            background:
                linear-gradient(180deg, rgba(11, 28, 39, 0.74), rgba(7, 19, 28, 0.52));
            box-shadow: inset 0 0 20px rgba(117, 246, 255, 0.03);
        }

        .atoma-main-menu__lore-card-title {
            color: #f1feff;
            font-size: 14px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
        }

        .atoma-main-menu__lore-card-subtitle {
            color: rgba(119, 243, 255, 0.88);
            font-size: 10px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
        }

        .atoma-main-menu__lore-card-order {
            color: rgba(255, 214, 140, 0.90);
            font-size: 10px;
            line-height: 1.55;
            letter-spacing: 0.05em;
            text-transform: none;
        }

        .atoma-main-menu__lore-card-summary {
            color: rgba(210, 244, 248, 0.82);
            font-size: 12px;
            line-height: 1.6;
            letter-spacing: 0.04em;
            text-transform: none;
        }

        .atoma-main-menu__lore-card-block {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding-top: 2px;
        }

        .atoma-main-menu__lore-card-label {
            color: rgba(119, 243, 255, 0.72);
            font-size: 9px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
        }

        .atoma-main-menu__lore-card-text {
            color: rgba(210, 244, 248, 0.82);
            font-size: 12px;
            line-height: 1.6;
            letter-spacing: 0.03em;
            text-transform: none;
        }

        .atoma-main-menu__footer {
            width: min(520px, 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            color: rgba(170, 230, 239, 0.74);
            font-size: 11px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }

        .atoma-main-menu__footer-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-height: 34px;
            padding: 0 12px;
            border: 1px solid rgba(110, 235, 255, 0.14);
            border-radius: 999px;
            background: rgba(7, 17, 24, 0.36);
        }

        /* ── World Cards (MAP screen) ── */

        .atoma-main-menu__world-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
            width: 100%;
        }

        .atoma-main-menu__world-card {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            border: 1px solid rgba(108, 234, 255, 0.10);
            border-radius: 16px;
            background: linear-gradient(180deg, rgba(10, 26, 36, 0.60), rgba(6, 16, 24, 0.40));
            cursor: pointer;
            transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
            overflow: hidden;
        }

        .atoma-main-menu__world-card.is-locked {
            cursor: default;
            opacity: 0.58;
            border-color: rgba(108, 234, 255, 0.08);
            background: linear-gradient(180deg, rgba(10, 18, 24, 0.62), rgba(5, 10, 16, 0.52));
            box-shadow: none;
        }

        .atoma-main-menu__world-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: var(--world-accent, rgba(108, 234, 255, 0.3));
            border-radius: 3px 0 0 3px;
            opacity: 0.4;
            transition: opacity 160ms ease, width 160ms ease;
        }

        .atoma-main-menu__world-card:hover {
            border-color: rgba(108, 234, 255, 0.20);
            background: linear-gradient(180deg, rgba(12, 30, 42, 0.70), rgba(8, 20, 30, 0.50));
        }

        .atoma-main-menu__world-card.is-locked:hover {
            border-color: rgba(108, 234, 255, 0.08);
            background: linear-gradient(180deg, rgba(10, 18, 24, 0.62), rgba(5, 10, 16, 0.52));
            transform: none;
        }

        .atoma-main-menu__world-card.is-selected {
            border-color: rgba(108, 234, 255, 0.30);
            background: linear-gradient(180deg, rgba(14, 34, 48, 0.80), rgba(10, 24, 36, 0.60));
            box-shadow: 0 0 24px rgba(90, 236, 255, 0.10), inset 0 0 20px rgba(117, 246, 255, 0.04);
            transform: scale(1.02);
        }

        .atoma-main-menu__world-card.is-selected::before {
            opacity: 1;
            width: 4px;
        }

        .atoma-main-menu__world-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .atoma-main-menu__world-card-badges {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            flex-wrap: wrap;
        }

        .atoma-main-menu__world-card-name {
            font-family: 'Orbitron', 'Segoe UI', sans-serif;
            font-size: 13px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #f1feff;
        }

        .atoma-main-menu__world-card-risk {
            font-size: 8px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.10);
        }

        .atoma-main-menu__world-card-risk--calm { color: #00e5a0; border-color: rgba(0, 229, 160, 0.25); background: rgba(0, 229, 160, 0.08); }
        .atoma-main-menu__world-card-risk--low { color: #00d4ff; border-color: rgba(0, 212, 255, 0.25); background: rgba(0, 212, 255, 0.08); }
        .atoma-main-menu__world-card-risk--moderate { color: #ffc107; border-color: rgba(255, 193, 7, 0.25); background: rgba(255, 193, 7, 0.08); }
        .atoma-main-menu__world-card-risk--extreme { color: #ff3d8e; border-color: rgba(255, 61, 142, 0.25); background: rgba(255, 61, 142, 0.08); }

        .atoma-main-menu__world-card-release {
            font-size: 8px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.10);
        }

        .atoma-main-menu__world-card-release--coming-soon {
            color: #9fb8c2;
            border-color: rgba(159, 184, 194, 0.18);
            background: rgba(159, 184, 194, 0.08);
        }

        .atoma-main-menu__world-card-tagline {
            font-size: 11px;
            color: rgba(180, 230, 240, 0.70);
            font-style: italic;
            letter-spacing: 0.04em;
        }

        .atoma-main-menu__world-card-fantasy {
            font-size: 11px;
            color: rgba(161, 227, 235, 0.60);
            line-height: 1.6;
            letter-spacing: 0.03em;
        }

        .atoma-main-menu__world-card-mood {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }

        .atoma-main-menu__world-card-mood-tag {
            font-size: 8px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            padding: 2px 7px;
            border-radius: 999px;
            border: 1px solid rgba(108, 234, 255, 0.12);
            color: rgba(160, 226, 235, 0.65);
            background: rgba(10, 28, 40, 0.20);
        }

        .atoma-main-menu__world-card-bars {
            display: flex;
            gap: 10px;
            margin-top: 4px;
        }

        .atoma-main-menu__world-card-bar-group {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .atoma-main-menu__world-card-bar-label {
            font-size: 7px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(119, 243, 255, 0.60);
        }

        .atoma-main-menu__world-card-bar-track {
            height: 3px;
            border-radius: 2px;
            background: rgba(108, 234, 255, 0.08);
            overflow: hidden;
        }

        .atoma-main-menu__world-card-bar-fill {
            height: 100%;
            border-radius: 2px;
            transition: width 300ms ease;
        }

        .atoma-main-menu__world-card-bar-fill--risk {
            background: linear-gradient(90deg, #00e5a0, #ffc107, #ff3d8e);
        }

        .atoma-main-menu__world-card-bar-fill--prosperity {
            background: linear-gradient(90deg, #00d4ff, #00e5a0, #b44dff);
        }

        /* ── Map Preview Panel ── */

        .atoma-main-menu__map-preview {
            width: 100%;
            padding: 14px 18px;
            border: 1px solid rgba(108, 234, 255, 0.12);
            border-radius: 14px;
            background: linear-gradient(180deg, rgba(8, 20, 28, 0.50), rgba(5, 14, 20, 0.30));
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .atoma-main-menu__map-preview-tagline {
            font-family: 'Orbitron', 'Segoe UI', sans-serif;
            font-size: 11px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: rgba(119, 243, 255, 0.80);
        }

        .atoma-main-menu__map-preview-description {
            font-size: 12px;
            color: rgba(180, 230, 240, 0.65);
            line-height: 1.6;
            letter-spacing: 0.03em;
        }

        /* ── Settings Panel Sections ── */

        .atoma-main-menu__settings-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .atoma-main-menu__settings-group-title {
            font-size: 8px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: rgba(119, 243, 255, 0.55);
            padding: 0 4px;
            border-bottom: 1px solid rgba(108, 234, 255, 0.08);
            padding-bottom: 4px;
        }

        /* ── Enhanced Button Selected State ── */

        .atoma-main-menu__button.is-selected {
            border-left: 3px solid rgba(0, 212, 255, 0.50);
            padding-left: 15px;
        }

        .atoma-main-menu__button.is-selected .atoma-main-menu__marker {
            opacity: 1;
            color: #00d4ff;
            text-shadow: 0 0 12px rgba(0, 212, 255, 0.6);
        }

        @media (max-width: 720px) {
            .atoma-main-menu__overlay {
                padding: 28px 16px 20px;
            }

            .atoma-main-menu__panel {
                min-height: auto;
                padding: 28px 18px 22px;
            }

            .atoma-main-menu__button {
                min-height: 50px;
                padding: 0 12px;
            }

            .atoma-main-menu__footer {
                flex-direction: column;
            }

            .atoma-main-menu__button--setting {
                flex-wrap: wrap;
                gap: 10px;
            }

            .atoma-main-menu__lore-tabs {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .atoma-main-menu__lore-grid {
                grid-template-columns: 1fr;
            }

            .atoma-main-menu__lore-card {
                min-height: 0;
            }

            .atoma-main-menu__world-cards {
                grid-template-columns: 1fr;
            }
        }
    `;

    document.head.appendChild(style);
}

export function getSettingsRows(settings, feedbackById = null) {
    return [
        {
            type: 'setting',
            id: 'sound',
            label: 'SOUND',
            value: `[${'='.repeat(settings.soundLevel / 20)}${'-'.repeat(5 - (settings.soundLevel / 20))}] ${String(settings.soundLevel).padStart(3, ' ')}%`,
            description: 'Cycles the master menu-owned audio level in deliberate 20% steps.',
        },
        {
            type: 'toggle',
            id: 'audioMuted',
            label: 'MUTE AUDIO',
            value: `[ ${settings.audioMuted ? 'MUTED' : 'LIVE'} ]`,
            description: 'Silences all ATOMA audio output immediately.',
        },
        {
            type: 'setting',
            id: 'visuals',
            label: 'VISUALS',
            value: `[ ${settings.visuals} ]`,
            description: 'Sets the global visual budget: LOW = base field, MEDIUM = richer layers, HIGH = full premium read.',
        },
        {
            type: 'setting',
            id: 'particles',
            label: 'PARTICLES',
            value: `[ ${settings.particles ? 'ON' : 'OFF'} ]`,
            description: 'Controls secondary atmospheric particles without touching core readability.',
        },
        {
            type: 'toggle',
            id: 'postProcessing',
            label: 'POSTPROCESSING',
            value: `[ ${settings.postProcessing ? 'ON' : 'OFF'} ]`,
            description: 'Toggles the premium composite grading stack and broader final image polish.',
        },
        {
            type: 'toggle',
            id: 'luminosityBloom',
            label: 'LUMINOSITY BLOOM',
            value: `[ ${settings.luminosityBloom ? 'ON' : 'OFF'} ]`,
            description: 'Toggles the selective bloom layer used for high-energy line intensity and glow.',
        },
        {
            type: 'toggle',
            id: 'nodeRotations',
            label: 'NODE ROTATIONS',
            value: `[ ${settings.nodeRotations ? 'ON' : 'OFF'} ]`,
            description: 'Controls slow self-axis rotation on active nodes for ambient motion.',
        },
        {
            type: 'toggle',
            id: 'semanticPictograms',
            label: 'SEMANTIC PICTOGRAMS',
            value: `[ ${settings.semanticPictograms ? 'ON' : 'OFF'} ]`,
            description: 'Toggles the orbiting semantic symbol layer around live links.',
        },
        {
            type: 'toggle',
            id: 'environmentalHazards',
            label: 'ENVIRONMENTAL HAZARDS',
            value: `[ ${settings.environmentalHazards ? 'ON' : 'OFF'} ]`,
            description: 'Controls hazard visuals and environmental warning pressure across the active world.',
        },
        {
            type: 'toggle',
            id: 'cinematicNodeShaders',
            label: 'NODE SHADERS',
            value: `[ ${settings.cinematicNodeShaders ? 'ON' : 'OFF'} ]`,
            description: 'Toggles the premium node shell, edge glow, and cinematic material read.',
        },
        ...getUIVisibilitySettingsRows(),
    ].map((row) => {
        const feedback = getSettingFeedbackCopy(resolveSettingFeedback(feedbackById, row.id));
        if (!feedback) {
            return row;
        }
        return {
            ...row,
            feedbackLabel: feedback.label,
            feedbackTone: feedback.tone,
            feedbackDetail: feedback.detail,
            description: `${row.description} Status: ${feedback.detail}`,
        };
    });
}

export class MainMenu {
    constructor({ actions = {}, buildLabel = MENU_BUILD_LABEL } = {}) {
        ensureMenuStyles();

        const snapshot = loadContinueSnapshot();
        const profile = loadMenuProfile();
        const devUnlock = isMenuDevMapUnlockEnabled();

        this.actions = {
            resume: () => {},
            startNew: () => {},
            exit: () => {},
            ...actions,
        };
        this.buildLabel = buildLabel;
        this.profile = saveMenuProfile({
            ...profile,
            selectedMapId: resolvePublicSelectedMapId(snapshot?.selectedMapId || profile.selectedMapId, { devUnlock }),
            settings: profile.settings,
        });
        this.state = {
            screen: 'MAIN',
            selectedIndex: 0,
            hasSave: Boolean(snapshot),
            loreSectionId: getDefaultLoreSectionId(),
        };

        this._focusableRefs = [];
        this._entryAnimationState = new Map();
        this._screenEntries = [];
        this._rafId = 0;
        this._lastFrameTime = 0;
        this._isVisible = false;
        this._transitionLocked = false;
        this._dpr = 1;
        this._backgroundWidth = 0;
        this._backgroundHeight = 0;
        this._particlePool = [];
        this._strandPool = [];
        this._latticeNodes = [];
        this._latticeEdges = [];
        this._settingFeedback = new Map();
        this._settingFeedbackTimers = new Map();

        this._handleKeyDown = (event) => this._onKeyDown(event);
        this._handleResize = () => this._onResize();
        this._handleVisibilityChange = () => this._onVisibilityChange();

        this._buildDom();
        this._rebuildBackgroundModel();
        this.refresh();
    }

    show() {
        if (!this.root.isConnected) {
            document.body.appendChild(this.root);
        }

        if (this._isVisible) {
            return;
        }

        this._isVisible = true;
        this.root.classList.remove('is-hidden');
        document.addEventListener('keydown', this._handleKeyDown);
        window.addEventListener('resize', this._handleResize);
        document.addEventListener('visibilitychange', this._handleVisibilityChange);
        this._startAnimationLoop();
    }

    hide() {
        if (!this._isVisible) {
            return;
        }

        this._isVisible = false;
        this.root.classList.add('is-hidden');
        document.removeEventListener('keydown', this._handleKeyDown);
        window.removeEventListener('resize', this._handleResize);
        document.removeEventListener('visibilitychange', this._handleVisibilityChange);

        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = 0;
        }
    }

    dispose() {
        this.hide();
        this.root.remove();
        this._focusableRefs = [];
        this._screenEntries = [];
        this._entryAnimationState.clear();
        this._particlePool = [];
        this._strandPool = [];
        this._latticeNodes = [];
        this._latticeEdges = [];
        this._settingFeedbackTimers.forEach((handle) => clearTimeout(handle));
        this._settingFeedbackTimers.clear();
        this._settingFeedback.clear();
    }

    refresh() {
        const loreScrollTop = this.loreBody ? this.loreBody.scrollTop : 0;
        const snapshot = loadContinueSnapshot();
        const devUnlock = isMenuDevMapUnlockEnabled();
        this.state.hasSave = Boolean(snapshot);
        this.profile.settings.audioMuted = isMenuAudioMuted();
        this.profile.selectedMapId = resolvePublicSelectedMapId(this.profile.selectedMapId, { devUnlock });
        this.profile = saveMenuProfile(this.profile);
        this._screenEntries = this._buildScreenEntries();

        if (this._screenEntries.length === 0) {
            this.state.selectedIndex = 0;
        } else {
            this.state.selectedIndex = this._findSelectableIndex(this.state.selectedIndex, 1);
        }

        this._renderScreen();

        if (this.loreBody) {
            this.loreBody.scrollTop = loreScrollTop;
        }

        this._scrollSelectedEntryIntoView();

        this._renderFooter();
        this._rebuildBackgroundModel();
    }

    _setSettingFeedback(settingId, state, detail = '', { persistMs = 0 } = {}) {
        if (!settingId) return;
        const existingTimer = this._settingFeedbackTimers.get(settingId);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this._settingFeedbackTimers.delete(settingId);
        }

        this._settingFeedback.set(settingId, {
            state,
            detail: String(detail || '').trim(),
        });

        if (persistMs > 0) {
            const handle = setTimeout(() => {
                this._settingFeedback.delete(settingId);
                this._settingFeedbackTimers.delete(settingId);
                if (this.state.screen === 'SETTINGS') {
                    this.refresh();
                }
            }, persistMs);
            this._settingFeedbackTimers.set(settingId, handle);
        }
    }

    switchScreen(screen) {
        if (this.state.screen === screen) {
            return;
        }

        this.state.screen = screen;

        if (screen === 'MAP') {
            this.state.selectedIndex = MENU_MAPS.findIndex((map) => map.id === this.profile.selectedMapId);
            if (this.state.selectedIndex < 0) {
                this.state.selectedIndex = 0;
            }
        } else {
            this.state.selectedIndex = 0;
        }

        this.refresh();
    }

    _buildDom() {
        this.root = document.createElement('div');
        this.root.className = 'atoma-main-menu';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'atoma-main-menu__canvas';
        this.canvas.setAttribute('aria-hidden', 'true');

        this.overlay = document.createElement('div');
        this.overlay.className = 'atoma-main-menu__overlay';

        this.panel = document.createElement('div');
        this.panel.className = 'atoma-main-menu__panel';

        this.hero = document.createElement('div');
        this.hero.className = 'atoma-main-menu__hero';

        this.logo = document.createElement('div');
        this.logo.className = 'atoma-main-menu__logo';

        this.title = document.createElement('div');
        this.title.className = 'atoma-main-menu__title';
        this.title.textContent = 'ATOMA';

        this.subtitle = document.createElement('div');
        this.subtitle.className = 'atoma-main-menu__subtitle';

        this.divider = document.createElement('div');
        this.divider.className = 'atoma-main-menu__divider';

        this.screenTitle = document.createElement('div');
        this.screenTitle.className = 'atoma-main-menu__screen-title';

        this.content = document.createElement('div');
        this.content.className = 'atoma-main-menu__content';

        this.description = document.createElement('div');
        this.description.className = 'atoma-main-menu__description';

        this.hint = document.createElement('div');
        this.hint.className = 'atoma-main-menu__hint';

        this.status = document.createElement('div');
        this.status.className = 'atoma-main-menu__status';

        this.footer = document.createElement('div');
        this.footer.className = 'atoma-main-menu__footer';

        this.footerWorld = document.createElement('div');
        this.footerWorld.className = 'atoma-main-menu__footer-pill';

        this.footerBuild = document.createElement('div');
        this.footerBuild.className = 'atoma-main-menu__footer-pill';

        this.hero.append(this.logo, this.title, this.subtitle);
        this.panel.append(this.hero, this.divider, this.screenTitle, this.content, this.description, this.hint, this.status, this.footer);
        this.footer.append(this.footerWorld, this.footerBuild);
        this.overlay.appendChild(this.panel);
        this.root.append(this.canvas, this.overlay);
    }

    _buildScreenEntries() {
        if (this.state.screen === 'MAP') {
            const devUnlock = isMenuDevMapUnlockEnabled();
            return MENU_MAPS.map((map) => ({
                id: map.id,
                label: map.label,
                meta: map.description,
                type: 'map',
                selectable: canAccessMap(map.id, { devUnlock }),
                releaseState: map.releaseState,
                releaseLabel: map.releaseLabel || '',
                publicLocked: map.releaseState === 'coming-soon',
                mapData: map,
            }));
        }

        if (this.state.screen === 'SETTINGS') {
            return getSettingsRows(this.profile.settings, this._settingFeedback).map((row) => ({
                id: row.id,
                label: row.label,
                value: row.value,
                meta: row.description,
                feedbackLabel: row.feedbackLabel || '',
                feedbackTone: row.feedbackTone || '',
                feedbackDetail: row.feedbackDetail || '',
                type: row.type || 'setting',
                selectable: row.selectable !== false,
                action: row.action || null,
            }));
        }

        if (this.state.screen === 'LORE') {
            return [];
        }

        const mainEntries = [];
        if (this.state.hasSave) {
            mainEntries.push({ id: 'continue', label: 'CONTINUE', type: 'main' });
        }
        mainEntries.push(
            { id: 'new-game', label: 'NEW GAME', type: 'main' },
            { id: 'map-selection', label: 'MAP SELECTION', type: 'main' },
            { id: 'settings', label: 'SETTINGS', type: 'main' },
            { id: 'lore', label: 'LORE', type: 'main' },
            { id: 'end-game', label: 'END GAME', type: 'main' },
        );
        return mainEntries;
    }

    _renderScreen() {
        this.content.textContent = '';
        this.content.classList.toggle('atoma-main-menu__content--scrollable', this.state.screen === 'SETTINGS');
        this._focusableRefs = [];
        this.loreBody = null;

        if (this.state.screen === 'MAIN') {
            this.subtitle.textContent = 'Vertical authority flow. Choose a path and wake the system.';
            this.screenTitle.textContent = '';
            this.description.textContent = 'Centered, quiet, and alive. The selected entry becomes the active energy node.';
            this.hint.textContent = 'UP / DOWN TO SELECT  |  ENTER TO ACTIVATE';
            this.status.textContent = this.state.hasSave
                ? 'Continue is available from the last stored world snapshot.'
                : 'Continue appears automatically after the first boot snapshot is written.';
            this._renderEntryList(this._screenEntries);

            if (isFirstRunGuidanceActive(this.profile)) {
                const callout = document.createElement('div');
                callout.className = 'atoma-main-menu__first-run-callout';

                const title = document.createElement('div');
                title.className = 'atoma-main-menu__first-run-title';
                title.textContent = 'First Run / Stabilizer Protocol';

                const body = document.createElement('div');
                body.className = 'atoma-main-menu__first-run-body';
                body.textContent = 'You are stabilizing a living network.';

                const steps = document.createElement('div');
                steps.className = 'atoma-main-menu__first-run-steps';
                ['Build the Lattice', 'Open the Surge', 'Prevent Collapse'].forEach((label) => {
                    const step = document.createElement('span');
                    step.className = 'atoma-main-menu__first-run-step';
                    step.textContent = label;
                    steps.appendChild(step);
                });

                const note = document.createElement('div');
                note.className = 'atoma-main-menu__first-run-note';
                note.textContent = getFirstRunWorldPromise(this.profile.selectedMapId);

                callout.append(title, body, steps, note);
                this.content.appendChild(callout);
            }
            return;
        }

        if (this.state.screen === 'MAP') {
            this.subtitle.textContent = 'Each world shapes the network differently. Choose your proving ground.';
            this.screenTitle.textContent = 'SELECT WORLD';
            this.hint.textContent = '[ UP / DOWN ] SELECT  |  [ ENTER ] LAUNCH  |  [ ESC ] BACK';
            this.status.textContent = isMenuDevMapUnlockEnabled()
                ? 'Dev unlock is active. Coming-soon worlds remain visible and can be launched locally.'
                : 'Only released worlds can launch. Coming-soon worlds remain visible but public-locked.';
            this._renderWorldCards();
            return;
        }

        if (this.state.screen === 'SETTINGS') {
            const selectedSetting = this._getSelectedEntry();
            this.subtitle.textContent = 'Stable, menu-owned preferences with explicit runtime feedback.';
            this.screenTitle.textContent = 'SETTINGS';
            this.description.textContent = selectedSetting ? selectedSetting.meta : 'Audio mute and UI visibility controls persist across reloads.';
            this.hint.textContent = 'UP / DOWN TO SELECT  |  ENTER TO ACTIVATE  |  LEFT / RIGHT FOR BASE SETTINGS  |  ESC TO BACK';
            this.status.textContent = selectedSetting?.feedbackDetail
                ? `Setting status / ${selectedSetting.feedbackDetail}`
                : 'Sound level and mute are stored for boot. Visual changes show whether they are live, pending, or mid-transition.';
            this._renderEntryList(this._screenEntries);
            return;
        }

        const activeSection = this._getLoreSection();
        this.subtitle.textContent = 'System Knowledge Interface. Technical truth observed through the language of the world.';
        this.screenTitle.textContent = 'LORE';
        this.description.textContent = activeSection?.description || 'A structured reading layer for the reality ATOMA exposes.';
        this.hint.textContent = '[ LEFT / RIGHT ] SECTION  |  [ UP / DOWN ] SCROLL  |  [ ESC ] BACK';
        this.status.textContent = 'Lore remains read-only, menu-scoped, and detached from live runtime mutation.';
        this._renderLore();
    }

    _renderEntryList(entries) {
        const list = document.createElement('div');
        list.className = 'atoma-main-menu__list';

        entries.forEach((entry, index) => {
            if (entry.type === 'section') {
                const section = document.createElement('div');
                section.className = 'atoma-main-menu__section';
                section.textContent = entry.label;
                list.appendChild(section);
                return;
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'atoma-main-menu__button';
            button.dataset.entryKey = `${this.state.screen}:${entry.id}`;
            button.dataset.entryIndex = String(index);

        if (entry.type === 'setting') {
            button.classList.add('atoma-main-menu__button--setting');
        }
        if (entry.type === 'visibility' || entry.type === 'toggle') {
            button.classList.add('atoma-main-menu__button--setting', 'atoma-main-menu__button--toggle');
        }
            if (entry.type === 'map') {
                button.classList.add('atoma-main-menu__button--map');
            }
            if (index === this.state.selectedIndex) {
                button.classList.add('is-selected');
            }

            const marker = document.createElement('span');
            marker.className = 'atoma-main-menu__marker';
            marker.textContent = '▶';

            const label = document.createElement('span');
            label.className = 'atoma-main-menu__label';
            label.textContent = entry.label;

            button.append(marker, label);

            if (entry.type === 'setting' || entry.type === 'toggle' || entry.type === 'visibility') {
                const value = document.createElement('span');
                value.className = 'atoma-main-menu__value';
                value.textContent = entry.value;
                button.appendChild(value);

                if (entry.feedbackLabel) {
                    const feedback = document.createElement('span');
                    feedback.className = `atoma-main-menu__setting-feedback atoma-main-menu__setting-feedback--${entry.feedbackTone || 'applied'}`;
                    feedback.textContent = entry.feedbackLabel;
                    button.appendChild(feedback);
                }
            }

            if (entry.type === 'map') {
                const meta = document.createElement('span');
                meta.className = 'atoma-main-menu__meta';
                meta.textContent = entry.meta;
                button.appendChild(meta);
            }

            button.addEventListener('mouseenter', () => {
                this.setSelectedIndex(index);
            });

            button.addEventListener('click', () => {
                this.setSelectedIndex(index);
                void this.activateSelected();
            });

            list.appendChild(button);
            this._focusableRefs.push({
                key: button.dataset.entryKey,
                element: button,
                marker,
                entryIndex: index,
            });
        });

        this.content.appendChild(list);
    }

    _scrollSelectedEntryIntoView() {
        if (this.state.screen !== 'SETTINGS' || !this.content.classList.contains('atoma-main-menu__content--scrollable')) {
            return;
        }

        const selectedRef = this._focusableRefs.find((ref) => ref.entryIndex === this.state.selectedIndex);
        if (!selectedRef?.element?.scrollIntoView) {
            return;
        }

        try {
            selectedRef.element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        } catch {
            // Ignore scroll failures in non-standard DOM environments.
        }
    }

    _renderWorldCards() {
        const RISK_LEVELS = { calm: 15, low: 30, moderate: 55, extreme: 90 };
        const PROSPERITY_LEVELS = { low: 25, moderate: 50, high: 75, extreme: 95 };

        const grid = document.createElement('div');
        grid.className = 'atoma-main-menu__world-cards';

        this._screenEntries.forEach((entry, index) => {
            const map = entry?.mapData;
            if (!map) return;
            const isSelected = index === this.state.selectedIndex;
            const card = document.createElement('div');
            card.className = 'atoma-main-menu__world-card';
            if (isSelected) {
                card.classList.add('is-selected');
            }
            if (!entry.selectable) {
                card.classList.add('is-locked');
                card.setAttribute('aria-disabled', 'true');
            }
            card.style.setProperty('--world-accent', `rgba(${map.accentRgb}, 0.6)`);
            card.dataset.entryKey = `MAP:${map.id}`;
            card.dataset.entryIndex = String(index);

            // Header: name + risk badge
            const header = document.createElement('div');
            header.className = 'atoma-main-menu__world-card-header';

            const name = document.createElement('div');
            name.className = 'atoma-main-menu__world-card-name';
            name.textContent = map.label;

            const badges = document.createElement('div');
            badges.className = 'atoma-main-menu__world-card-badges';

            const riskBadge = document.createElement('div');
            riskBadge.className = `atoma-main-menu__world-card-risk atoma-main-menu__world-card-risk--${map.risk}`;
            riskBadge.textContent = map.risk.toUpperCase();
            badges.appendChild(riskBadge);

            if (entry.publicLocked) {
                const releaseBadge = document.createElement('div');
                releaseBadge.className = 'atoma-main-menu__world-card-release atoma-main-menu__world-card-release--coming-soon';
                releaseBadge.textContent = map.releaseLabel || 'COMING SOON';
                badges.appendChild(releaseBadge);
            }

            header.append(name, badges);

            // Tagline
            const tagline = document.createElement('div');
            tagline.className = 'atoma-main-menu__world-card-tagline';
            tagline.textContent = map.tagline;

            // Fantasy description
            const fantasy = document.createElement('div');
            fantasy.className = 'atoma-main-menu__world-card-fantasy';
            fantasy.textContent = map.fantasy;

            // Mood tags
            const moodContainer = document.createElement('div');
            moodContainer.className = 'atoma-main-menu__world-card-mood';
            for (const mood of map.mood) {
                const tag = document.createElement('span');
                tag.className = 'atoma-main-menu__world-card-mood-tag';
                tag.textContent = mood;
                moodContainer.appendChild(tag);
            }

            // Risk / Prosperity bars
            const bars = document.createElement('div');
            bars.className = 'atoma-main-menu__world-card-bars';

            const riskGroup = document.createElement('div');
            riskGroup.className = 'atoma-main-menu__world-card-bar-group';
            const riskLabel = document.createElement('div');
            riskLabel.className = 'atoma-main-menu__world-card-bar-label';
            riskLabel.textContent = 'RISK';
            const riskTrack = document.createElement('div');
            riskTrack.className = 'atoma-main-menu__world-card-bar-track';
            const riskFill = document.createElement('div');
            riskFill.className = 'atoma-main-menu__world-card-bar-fill atoma-main-menu__world-card-bar-fill--risk';
            riskFill.style.width = `${RISK_LEVELS[map.risk] || 30}%`;
            riskTrack.appendChild(riskFill);
            riskGroup.append(riskLabel, riskTrack);

            const propGroup = document.createElement('div');
            propGroup.className = 'atoma-main-menu__world-card-bar-group';
            const propLabel = document.createElement('div');
            propLabel.className = 'atoma-main-menu__world-card-bar-label';
            propLabel.textContent = 'PROSPERITY';
            const propTrack = document.createElement('div');
            propTrack.className = 'atoma-main-menu__world-card-bar-track';
            const propFill = document.createElement('div');
            propFill.className = 'atoma-main-menu__world-card-bar-fill atoma-main-menu__world-card-bar-fill--prosperity';
            propFill.style.width = `${PROSPERITY_LEVELS[map.prosperity] || 50}%`;
            propTrack.appendChild(propFill);
            propGroup.append(propLabel, propTrack);

            bars.append(riskGroup, propGroup);

            card.append(header, tagline, fantasy, moodContainer, bars);

            // Interaction
            if (entry.selectable) {
                card.addEventListener('mouseenter', () => {
                    this.setSelectedIndex(index);
                });
                card.addEventListener('click', () => {
                    this.setSelectedIndex(index);
                    void this.activateSelected();
                });
            }

            grid.appendChild(card);
            this._focusableRefs.push({
                key: card.dataset.entryKey,
                element: card,
                marker: { style: {} },
                entryIndex: index,
            });
        });

        // Map preview panel for selected world
        const selectedEntry = this._getSelectedEntry();
        if (selectedEntry?.mapData) {
            const map = selectedEntry.mapData;
            const preview = document.createElement('div');
            preview.className = 'atoma-main-menu__map-preview';

            const previewTagline = document.createElement('div');
            previewTagline.className = 'atoma-main-menu__map-preview-tagline';
            previewTagline.textContent = map.tagline;

            const previewDesc = document.createElement('div');
            previewDesc.className = 'atoma-main-menu__map-preview-description';
            previewDesc.textContent = map.description;

            preview.append(previewTagline, previewDesc);

            this.description.textContent = '';
            this.content.append(grid, preview);
        } else {
            this.content.appendChild(grid);
        }
    }

    _getLoreSection() {
        return getLoreSectionById(this.state.loreSectionId) || getLoreSectionById(getDefaultLoreSectionId());
    }

    _setLoreSection(sectionId, { refresh = true } = {}) {
        const nextSection = getLoreSectionById(sectionId);
        if (!nextSection || nextSection.id === this.state.loreSectionId) {
            return false;
        }

        this.state.loreSectionId = nextSection.id;
        if (refresh) {
            this.refresh();
        }
        return true;
    }

    _cycleLoreSection(delta) {
        const sections = getLoreSections();
        if (sections.length === 0) {
            return;
        }

        const currentIndex = Math.max(0, sections.findIndex((section) => section.id === this._getLoreSection()?.id));
        const nextIndex = (currentIndex + delta + sections.length) % sections.length;
        this._setLoreSection(sections[nextIndex].id);
    }

    _renderLore() {
        const activeSection = this._getLoreSection();
        const entries = getLoreEntriesBySection(activeSection?.id);
        const featuredEntry = entries[0] || null;
        const supportingEntries = entries.slice(1);

        const panel = document.createElement('div');
        panel.className = 'atoma-main-menu__lore-panel';

        const tabs = document.createElement('div');
        tabs.className = 'atoma-main-menu__lore-tabs';

        for (const section of getLoreSections()) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'atoma-main-menu__lore-tab';
            if (section.id === activeSection?.id) {
                button.classList.add('is-active');
            }
            button.textContent = section.label;
            button.addEventListener('click', () => {
                this._setLoreSection(section.id);
            });
            tabs.appendChild(button);
        }

        this.loreBody = document.createElement('div');
        this.loreBody.className = 'atoma-main-menu__lore-body';

        const sectionCopy = document.createElement('div');
        sectionCopy.className = 'atoma-main-menu__lore-section-copy';

        const kicker = document.createElement('div');
        kicker.className = 'atoma-main-menu__lore-kicker';
        kicker.textContent = activeSection?.label || 'Lore';

        const summary = document.createElement('div');
        summary.className = 'atoma-main-menu__lore-summary';
        summary.textContent = activeSection?.description || '';

        sectionCopy.append(kicker, summary);

        const featured = document.createElement('div');
        featured.className = 'atoma-main-menu__lore-featured';

        const featuredCopy = document.createElement('div');
        featuredCopy.className = 'atoma-main-menu__lore-featured-copy';

        const featuredLabel = document.createElement('div');
        featuredLabel.className = 'atoma-main-menu__lore-featured-label';
        featuredLabel.textContent = featuredEntry ? `Featured canon / ${activeSection?.label || 'Lore'}` : 'Featured canon';

        const featuredTitle = document.createElement('div');
        featuredTitle.className = 'atoma-main-menu__lore-featured-title';
        featuredTitle.textContent = featuredEntry?.title || 'No entry available';

        const featuredSubtitle = document.createElement('div');
        featuredSubtitle.className = 'atoma-main-menu__lore-featured-subtitle';
        featuredSubtitle.textContent = featuredEntry?.subtitle || '';

        const featuredOrder = document.createElement('div');
        featuredOrder.className = 'atoma-main-menu__lore-featured-order';
        featuredOrder.textContent = activeSection?.id === 'codex' && featuredEntry?.readingOrder
            ? `Reading order: ${featuredEntry.readingOrder}`
            : '';

        const featuredSummary = document.createElement('div');
        featuredSummary.className = 'atoma-main-menu__lore-featured-summary';
        featuredSummary.textContent = featuredEntry?.summary || featuredEntry?.body || '';

        const featuredCopyParts = [featuredLabel, featuredTitle, featuredSubtitle];
        if (featuredOrder.textContent) {
            featuredCopyParts.push(featuredOrder);
        }
        featuredCopyParts.push(featuredSummary);
        featuredCopy.append(...featuredCopyParts);

        const featuredMeta = document.createElement('div');
        featuredMeta.className = 'atoma-main-menu__lore-featured-meta';

        const featuredCanon = document.createElement('div');
        featuredCanon.className = 'atoma-main-menu__lore-featured-stat';
        const featuredCanonLabel = document.createElement('div');
        featuredCanonLabel.className = 'atoma-main-menu__lore-featured-stat-label';
        featuredCanonLabel.textContent = 'Canon';
        const featuredCanonValue = document.createElement('div');
        featuredCanonValue.className = 'atoma-main-menu__lore-featured-stat-value';
        featuredCanonValue.textContent = featuredEntry?.canon || '';
        featuredCanon.append(featuredCanonLabel, featuredCanonValue);

        const featuredMeaning = document.createElement('div');
        featuredMeaning.className = 'atoma-main-menu__lore-featured-stat';
        const featuredMeaningLabel = document.createElement('div');
        featuredMeaningLabel.className = 'atoma-main-menu__lore-featured-stat-label';
        featuredMeaningLabel.textContent = 'Meaning';
        const featuredMeaningValue = document.createElement('div');
        featuredMeaningValue.className = 'atoma-main-menu__lore-featured-stat-value';
        featuredMeaningValue.textContent = featuredEntry?.meaning || '';
        featuredMeaning.append(featuredMeaningLabel, featuredMeaningValue);

        const featuredRelevance = document.createElement('div');
        featuredRelevance.className = 'atoma-main-menu__lore-featured-stat';
        const featuredRelevanceLabel = document.createElement('div');
        featuredRelevanceLabel.className = 'atoma-main-menu__lore-featured-stat-label';
        featuredRelevanceLabel.textContent = 'Relevance';
        const featuredRelevanceValue = document.createElement('div');
        featuredRelevanceValue.className = 'atoma-main-menu__lore-featured-stat-value';
        featuredRelevanceValue.textContent = featuredEntry?.relevance || '';
        featuredRelevance.append(featuredRelevanceLabel, featuredRelevanceValue);

        const featuredReadingOrder = document.createElement('div');
        featuredReadingOrder.className = 'atoma-main-menu__lore-featured-stat';
        const featuredReadingOrderLabel = document.createElement('div');
        featuredReadingOrderLabel.className = 'atoma-main-menu__lore-featured-stat-label';
        featuredReadingOrderLabel.textContent = 'Reading order';
        const featuredReadingOrderValue = document.createElement('div');
        featuredReadingOrderValue.className = 'atoma-main-menu__lore-featured-stat-value';
        featuredReadingOrderValue.textContent = activeSection?.id === 'codex' ? featuredEntry?.readingOrder || '' : '';
        if (featuredReadingOrderValue.textContent) {
            featuredReadingOrder.append(featuredReadingOrderLabel, featuredReadingOrderValue);
        }

        const featuredMetaParts = [featuredCanon, featuredMeaning];
        if (featuredReadingOrderValue.textContent) {
            featuredMetaParts.push(featuredReadingOrder);
        }
        featuredMetaParts.push(featuredRelevance);
        featuredMeta.append(...featuredMetaParts);
        featured.append(featuredCopy, featuredMeta);

        const archive = document.createElement('div');
        archive.className = 'atoma-main-menu__lore-grid';

        supportingEntries.forEach((entry) => {
            const card = document.createElement('article');
            card.className = 'atoma-main-menu__lore-card';

            const title = document.createElement('div');
            title.className = 'atoma-main-menu__lore-card-title';
            title.textContent = entry.title;

            const subtitle = document.createElement('div');
            subtitle.className = 'atoma-main-menu__lore-card-subtitle';
            subtitle.textContent = entry.subtitle || '';

            const order = document.createElement('div');
            order.className = 'atoma-main-menu__lore-card-order';
            order.textContent = activeSection?.id === 'codex' && entry.readingOrder
                ? entry.readingOrder
                : '';

            const summaryBlock = document.createElement('div');
            summaryBlock.className = 'atoma-main-menu__lore-card-summary';
            summaryBlock.textContent = entry.summary || entry.body || '';

            const cardParts = [title, subtitle];
            if (order.textContent) {
                cardParts.push(order);
            }
            cardParts.push(summaryBlock);
            card.append(...cardParts);
            archive.appendChild(card);
        });

        this.loreBody.append(sectionCopy, featured, archive);
        panel.append(tabs, this.loreBody);
        this.content.appendChild(panel);
    }

    _renderFooter() {
        const map = getMenuMapById(this.profile.selectedMapId);
        this.footerWorld.textContent = `WORLD: ${map.footerLabel}`;
        this.footerBuild.textContent = `BUILD: ${this.buildLabel}`;
    }

    _getSelectedEntry() {
        return this._screenEntries[this.state.selectedIndex] || null;
    }

    _isSelectableEntry(entry) {
        return !!entry && entry.selectable !== false;
    }

    _findSelectableIndex(index, direction = 1) {
        if (this._screenEntries.length === 0) {
            return 0;
        }

        const lastIndex = this._screenEntries.length - 1;
        const clampedIndex = clamp(index, 0, lastIndex);
        if (this._isSelectableEntry(this._screenEntries[clampedIndex])) {
            return clampedIndex;
        }

        const step = direction >= 0 ? 1 : -1;
        for (let offset = 1; offset <= lastIndex; offset += 1) {
            const nextIndex = clampedIndex + (offset * step);
            if (nextIndex >= 0 && nextIndex <= lastIndex && this._isSelectableEntry(this._screenEntries[nextIndex])) {
                return nextIndex;
            }
        }

        for (let offset = 1; offset <= lastIndex; offset += 1) {
            const nextIndex = clampedIndex - (offset * step);
            if (nextIndex >= 0 && nextIndex <= lastIndex && this._isSelectableEntry(this._screenEntries[nextIndex])) {
                return nextIndex;
            }
        }

        return 0;
    }

    setSelectedIndex(index, { refresh = true } = {}) {
        if (this._screenEntries.length === 0) {
            this.state.selectedIndex = 0;
            return false;
        }

        const nextIndex = this._findSelectableIndex(index, index >= this.state.selectedIndex ? 1 : -1);
        if (nextIndex === this.state.selectedIndex) {
            return false;
        }

        this.state.selectedIndex = nextIndex;
        if (refresh) {
            this.refresh();
        }
        return true;
    }

    async activateSelected() {
        if (this._transitionLocked) {
            return;
        }

        try {
            await this._activateCurrentEntry();
        } catch (error) {
            console.warn('[MainMenu] activateSelected failed:', error);
        }
    }

    _moveSelection(delta) {
        if (this._screenEntries.length === 0) {
            return;
        }

        const step = delta >= 0 ? 1 : -1;
        for (let offset = 1; offset <= this._screenEntries.length; offset += 1) {
            const candidate = this.state.selectedIndex + (offset * step);
            if (candidate < 0 || candidate >= this._screenEntries.length) {
                break;
            }

            if (this._isSelectableEntry(this._screenEntries[candidate])) {
                this.setSelectedIndex(candidate);
                return;
            }
        }
    }

    async _activateCurrentEntry() {
        const entry = this._getSelectedEntry();
        if (!entry) {
            return;
        }

        if (this.state.screen === 'MAIN') {
            this._activateMainEntry(entry.id);
            return;
        }

        if (this.state.screen === 'MAP') {
            const launchWorldId = resolvePublicSelectedMapId(entry.id);
            if (!canAccessMap(entry.id)) {
                this.profile.selectedMapId = launchWorldId;
                this.profile = saveMenuProfile(this.profile);
                this.refresh();
                return;
            }

            this.profile.selectedMapId = launchWorldId;
            this.profile = saveMenuProfile(this.profile);
            this.actions.startNew({
                worldId: launchWorldId,
                selectedMapId: launchWorldId,
                settings: { ...this.profile.settings },
            });
            return;
        }

        if (this.state.screen === 'SETTINGS') {
            if (entry.type === 'visibility') {
                entry.action?.();
                this.refresh();
                return;
            }

            await this._cycleSetting(entry.id, 1);
        }
    }

    _activateMainEntry(entryId) {
        switch (entryId) {
            case 'continue': {
                const snapshot = loadContinueSnapshot();
                if (!snapshot) {
                    this.refresh();
                    return;
                }

                this.actions.resume({
                    snapshot,
                    selectedMapId: snapshot.selectedMapId,
                    settings: { ...this.profile.settings },
                });
                return;
            }
            case 'new-game':
                this.actions.startNew({
                    worldId: this.profile.selectedMapId,
                    selectedMapId: this.profile.selectedMapId,
                    settings: { ...this.profile.settings },
                });
                return;
            case 'map-selection':
                this.switchScreen('MAP');
                return;
            case 'settings':
                this.switchScreen('SETTINGS');
                return;
            case 'lore':
                this.switchScreen('LORE');
                return;
            case 'end-game':
                this.actions.exit({
                    selectedMapId: this.profile.selectedMapId,
                    settings: { ...this.profile.settings },
                    snapshot: loadContinueSnapshot(),
                });
                this.refresh();
                return;
            default:
                return;
        }
    }

    async _cycleSetting(settingId, direction) {
        if (this._transitionLocked) {
            return;
        }

        const settings = { ...this.profile.settings };
        let transitionPromise = null;

        if (settingId === 'sound') {
            const currentIndex = SOUND_LEVELS.indexOf(settings.soundLevel);
            const nextIndex = clamp(currentIndex + direction, 0, SOUND_LEVELS.length - 1);
            settings.soundLevel = SOUND_LEVELS[nextIndex];
            this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, 'Stored for menu boot and live audio startup.', { persistMs: 1600 });
        } else if (settingId === 'audioMuted') {
            settings.audioMuted = !settings.audioMuted;
            setMenuAudioMuted(settings.audioMuted);
            this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.audioMuted ? 'All ATOMA audio is muted now.' : 'All ATOMA audio is live again.', { persistMs: 1800 });
        } else if (settingId === 'visuals') {
            const currentIndex = VISUAL_LEVELS.indexOf(settings.visuals);
            const nextIndex = (currentIndex + direction + VISUAL_LEVELS.length) % VISUAL_LEVELS.length;
            settings.visuals = VISUAL_LEVELS[nextIndex];
            if (typeof window !== 'undefined') {
                if (window.game?.setVisualQuality) {
                    window.game.setVisualQuality(settings.visuals);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, `Live quality switched to ${settings.visuals}.`, { persistMs: 1600 });
                } else {
                    window.__ATOMA_VISUAL_QUALITY_PENDING__ = settings.visuals;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, `Queued ${settings.visuals} quality for the next active runtime.`);
                }
            }
        } else if (settingId === 'particles') {
            settings.particles = !settings.particles;
            this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.particles ? 'Ambient particles are active.' : 'Ambient particles are suppressed.', { persistMs: 1600 });
        } else if (settingId === 'postProcessing') {
            settings.postProcessing = !settings.postProcessing;
            if (typeof window !== 'undefined') {
                if (window.game?.setPostProcessingEnabled) {
                    transitionPromise = window.game.setPostProcessingEnabled(settings.postProcessing);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.TRANSITIONING, 'Applying the composite grading stack.');
                } else {
                    window.__ATOMA_POSTPROCESSING_PENDING__ = settings.postProcessing;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Post-processing preference stored for the next active runtime.');
                }
            }
        } else if (settingId === 'luminosityBloom') {
            settings.luminosityBloom = !settings.luminosityBloom;
            if (typeof window !== 'undefined') {
                if (window.game?.setLuminosityBloomEnabled) {
                    transitionPromise = window.game.setLuminosityBloomEnabled(settings.luminosityBloom);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.TRANSITIONING, 'Applying the luminosity bloom layer.');
                } else {
                    window.__ATOMA_LUMINOSITY_BLOOM_PENDING__ = settings.luminosityBloom;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Bloom preference stored for the next active runtime.');
                }
            }
        } else if (settingId === 'nodeRotations') {
            settings.nodeRotations = !settings.nodeRotations;
            if (typeof window !== 'undefined') {
                if (window.game?.setNodeRotationsEnabled) {
                    window.game.setNodeRotationsEnabled(settings.nodeRotations);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.nodeRotations ? 'Node motion is active.' : 'Node motion is restrained.', { persistMs: 1600 });
                } else {
                    window.__ATOMA_NODE_ROTATIONS_PENDING__ = settings.nodeRotations;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Node motion preference stored for the next active runtime.');
                }
            }
        } else if (settingId === 'semanticPictograms') {
            settings.semanticPictograms = !settings.semanticPictograms;
            if (typeof window !== 'undefined') {
                if (window.game?.setSemanticPictogramsEnabled) {
                    window.game.setSemanticPictogramsEnabled(settings.semanticPictograms);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.semanticPictograms ? 'Semantic pictograms are visible.' : 'Semantic pictograms are hidden.', { persistMs: 1600 });
                } else {
                    window.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__ = settings.semanticPictograms;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Semantic pictogram preference stored for the next active runtime.');
                }
            }
        } else if (settingId === 'environmentalHazards') {
            settings.environmentalHazards = !settings.environmentalHazards;
            if (typeof window !== 'undefined') {
                if (window.game?.setEnvironmentalHazardsEnabled) {
                    window.game.setEnvironmentalHazardsEnabled(settings.environmentalHazards);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.environmentalHazards ? 'Environmental hazard pressure is visible.' : 'Environmental hazard pressure is visually suppressed.', { persistMs: 1600 });
                } else {
                    window.__ATOMA_ENVIRONMENTAL_HAZARDS_PENDING__ = settings.environmentalHazards;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Hazard preference stored for the next active runtime.');
                }
            }
        } else if (settingId === 'cinematicNodeShaders') {
            settings.cinematicNodeShaders = !settings.cinematicNodeShaders;
            if (typeof window !== 'undefined') {
                if (window.game?.setCinematicNodeShadersEnabled) {
                    window.game.setCinematicNodeShadersEnabled(settings.cinematicNodeShaders);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.cinematicNodeShaders ? 'Premium node shading is active.' : 'Premium node shading is restrained.', { persistMs: 1600 });
                } else {
                    window.__ATOMA_CINEMATIC_NODE_SHADERS_PENDING__ = settings.cinematicNodeShaders;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Node shader preference stored for the next active runtime.');
                }
            }
        }

        this.profile.settings = settings;
        this.profile = saveMenuProfile(this.profile);
        if (transitionPromise && typeof transitionPromise.then === 'function') {
            this._transitionLocked = true;
            this.refresh();
            try {
                await transitionPromise;
                this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, 'Live runtime confirmed the transition.', { persistMs: 1800 });
            } catch (error) {
                console.warn('[MainMenu] setting transition failed:', error);
                this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Runtime did not confirm the transition. Preference is still stored.');
            } finally {
                this._transitionLocked = false;
                this.refresh();
            }
            return;
        }

        this.refresh();
    }

    _scrollLore(delta) {
        if (!this.loreBody) {
            return;
        }

        this.loreBody.scrollTop += delta;
    }

    _onKeyDown(event) {
        if (!this._isVisible) {
            return;
        }

        if (this._transitionLocked) {
            event.preventDefault();
            return;
        }

        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (this.state.screen === 'LORE') {
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                this._cycleLoreSection(1);
                return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                this._cycleLoreSection(-1);
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                this._scrollLore(48);
                return;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                this._scrollLore(-48);
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                this.switchScreen('MAIN');
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this._moveSelection(1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this._moveSelection(-1);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            void this.activateSelected();
            return;
        }

        if (event.key === 'Escape') {
            if (this.state.screen !== 'MAIN') {
                event.preventDefault();
                this.switchScreen('MAIN');
            }
            return;
        }

        if (this.state.screen === 'SETTINGS' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            event.preventDefault();
            const entry = this._getSelectedEntry();
            if (!entry) {
                return;
            }
            void this._cycleSetting(entry.id, event.key === 'ArrowLeft' ? -1 : 1);
        }
    }

    _onResize() {
        this._rebuildBackgroundModel();
    }

    _onVisibilityChange() {
        if (document.hidden) {
            if (this._rafId) {
                cancelAnimationFrame(this._rafId);
                this._rafId = 0;
            }
            return;
        }

        this._startAnimationLoop();
    }

    _startAnimationLoop() {
        if (!this._isVisible || this._rafId) {
            return;
        }

        this._lastFrameTime = performance.now();
        this._rafId = requestAnimationFrame((time) => this._onAnimationFrame(time));
    }

    _onAnimationFrame(time) {
        this._rafId = 0;
        if (!this._isVisible) {
            return;
        }

        const dt = Math.min((time - this._lastFrameTime) / 1000, 0.05);
        this._lastFrameTime = time;
        const pulse = Math.sin(time * 0.0036);

        this._updateHeroVisual(pulse);
        this._updateFocusableVisuals(pulse);
        this._drawBackground(dt, time * 0.001);

        this._rafId = requestAnimationFrame((nextTime) => this._onAnimationFrame(nextTime));
    }

    _updateHeroVisual(pulse) {
        const logoScale = 1 + pulse * 0.035;
        this.logo.style.transform = `scale(${logoScale})`;
        this.logo.style.boxShadow = `0 0 ${24 + pulse * 8}px rgba(77, 238, 255, 0.14), inset 0 0 22px rgba(212, 253, 255, 0.08)`;
    }

    _updateFocusableVisuals(pulse) {
        this._focusableRefs.forEach((ref, index) => {
            const selected = ref.entryIndex === this.state.selectedIndex;
            const isWorldCard = ref.element.classList.contains('atoma-main-menu__world-card');
            const targetScale = selected ? (isWorldCard ? 1.02 : 1.08 + (pulse * 0.018)) : 1;
            const targetOpacity = selected ? 1 : (isWorldCard ? 0.55 : 0.46);
            const targetGlow = selected ? 1 : 0;
            const state = this._entryAnimationState.get(ref.key) || {
                scale: 1,
                opacity: isWorldCard ? 0.55 : 0.46,
                glow: 0,
            };

            state.scale = lerp(state.scale, targetScale, 0.18);
            state.opacity = lerp(state.opacity, targetOpacity, 0.16);
            state.glow = lerp(state.glow, targetGlow, 0.20);
            this._entryAnimationState.set(ref.key, state);

            ref.element.style.transform = `scale(${state.scale})`;
            ref.element.style.opacity = String(state.opacity);

            if (isWorldCard) {
                // World cards use CSS classes for selection state
                if (selected) {
                    ref.element.classList.add('is-selected');
                } else {
                    ref.element.classList.remove('is-selected');
                }
            } else {
                ref.element.style.borderColor = `rgba(108, 234, 255, ${0.12 + (state.glow * 0.22)})`;
                ref.element.style.background = `rgba(10, 28, 40, ${0.10 + (state.glow * 0.22)})`;
                ref.element.style.boxShadow = `0 0 ${10 + (state.glow * 18)}px rgba(90, 236, 255, ${state.glow * 0.22})`;
                if (ref.marker?.style) {
                    ref.marker.style.opacity = selected ? '1' : '0';
                }
                ref.element.style.textShadow = selected
                    ? '0 0 18px rgba(98, 238, 255, 0.28)'
                    : 'none';
            }
        });
    }

    _rebuildBackgroundModel() {
        const rect = this.root.getBoundingClientRect();
        this._dpr = clamp(window.devicePixelRatio || 1, 1, 1.5);
        this._backgroundWidth = Math.max(1, Math.floor(rect.width));
        this._backgroundHeight = Math.max(1, Math.floor(rect.height));

        this.canvas.width = Math.floor(this._backgroundWidth * this._dpr);
        this.canvas.height = Math.floor(this._backgroundHeight * this._dpr);
        this.canvas.style.width = `${this._backgroundWidth}px`;
        this.canvas.style.height = `${this._backgroundHeight}px`;

        const settings = this.profile.settings;
        const quality = settings.visuals;
        const particlesEnabled = settings.particles;

        let particleCount = 0;
        if (particlesEnabled) {
            particleCount = quality === 'HIGH' ? 42 : quality === 'MEDIUM' ? 26 : 14;
        }

        const strandCount = quality === 'HIGH' ? 5 : quality === 'MEDIUM' ? 4 : 3;

        this._particlePool = Array.from({ length: particleCount }, (_, index) => ({
            x: Math.random() * this._backgroundWidth,
            y: Math.random() * this._backgroundHeight,
            vx: 6 + (index % 5) * 3,
            vy: -3 - (index % 3) * 2,
            radius: 0.8 + (index % 4) * 0.5,
            alpha: 0.12 + (index % 6) * 0.03,
        }));

        this._strandPool = Array.from({ length: strandCount }, (_, index) => ({
            baseY: this._backgroundHeight * (0.18 + index * 0.16),
            amplitude: 12 + index * 7,
            speed: 0.14 + index * 0.03,
            phase: Math.random() * Math.PI * 2,
            lengthFactor: 0.48 + index * 0.08,
        }));

        // Link lattice nodes — fixed positions forming a network grid
        const latticeCols = quality === 'HIGH' ? 8 : quality === 'MEDIUM' ? 6 : 4;
        const latticeRows = quality === 'HIGH' ? 5 : quality === 'MEDIUM' ? 4 : 3;
        const marginX = this._backgroundWidth * 0.12;
        const marginY = this._backgroundHeight * 0.10;
        const spacingX = (this._backgroundWidth - marginX * 2) / Math.max(1, latticeCols - 1);
        const spacingY = (this._backgroundHeight - marginY * 2) / Math.max(1, latticeRows - 1);

        this._latticeNodes = [];
        for (let row = 0; row < latticeRows; row++) {
            for (let col = 0; col < latticeCols; col++) {
                this._latticeNodes.push({
                    x: marginX + col * spacingX + (Math.random() - 0.5) * spacingX * 0.3,
                    y: marginY + row * spacingY + (Math.random() - 0.5) * spacingY * 0.3,
                    baseRadius: 1.5 + Math.random() * 1.5,
                    phase: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.5 + Math.random() * 0.8,
                });
            }
        }

        // Pre-compute lattice edges (connections between nearby nodes)
        const maxDist = Math.max(spacingX, spacingY) * 1.6;
        this._latticeEdges = [];
        for (let i = 0; i < this._latticeNodes.length; i++) {
            for (let j = i + 1; j < this._latticeNodes.length; j++) {
                const dx = this._latticeNodes[i].x - this._latticeNodes[j].x;
                const dy = this._latticeNodes[i].y - this._latticeNodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDist) {
                    this._latticeEdges.push({
                        from: i,
                        to: j,
                        pulsePhase: Math.random() * Math.PI * 2,
                        pulseSpeed: 0.3 + Math.random() * 0.5,
                    });
                }
            }
        }
    }

    _drawBackground(dt, timeSeconds) {
        const context = this.canvas.getContext('2d');
        if (!context) {
            return;
        }

        context.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
        context.clearRect(0, 0, this._backgroundWidth, this._backgroundHeight);

        // Draw lattice edges (link connections)
        if (this._latticeEdges && this._latticeNodes) {
            for (const edge of this._latticeEdges) {
                const fromNode = this._latticeNodes[edge.from];
                const toNode = this._latticeNodes[edge.to];
                const pulseT = (Math.sin(timeSeconds * edge.pulseSpeed + edge.pulsePhase) + 1) * 0.5;
                const alpha = 0.03 + pulseT * 0.06;

                context.beginPath();
                context.moveTo(fromNode.x, fromNode.y);
                context.lineTo(toNode.x, toNode.y);
                context.strokeStyle = `rgba(102, 228, 244, ${alpha})`;
                context.lineWidth = 0.6 + pulseT * 0.4;
                context.stroke();

                // Pulse dot traveling along the edge
                if (pulseT > 0.7) {
                    const travelT = (timeSeconds * edge.pulseSpeed * 0.5 + edge.pulsePhase) % 1;
                    const px = fromNode.x + (toNode.x - fromNode.x) * travelT;
                    const py = fromNode.y + (toNode.y - fromNode.y) * travelT;
                    context.beginPath();
                    context.arc(px, py, 1.2, 0, Math.PI * 2);
                    context.fillStyle = `rgba(140, 244, 255, ${(pulseT - 0.7) * 1.5})`;
                    context.fill();
                }
            }

            // Draw lattice nodes (network nodes)
            for (const node of this._latticeNodes) {
                const pulseT = (Math.sin(timeSeconds * node.pulseSpeed + node.phase) + 1) * 0.5;
                const radius = node.baseRadius + pulseT * 1.2;
                const alpha = 0.08 + pulseT * 0.14;

                // Outer glow
                context.beginPath();
                context.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
                context.fillStyle = `rgba(77, 238, 255, ${alpha * 0.15})`;
                context.fill();

                // Core
                context.beginPath();
                context.arc(node.x, node.y, radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(140, 244, 255, ${alpha})`;
                context.fill();
            }
        }

        // Draw bezier strands (atmospheric curves)
        for (const strand of this._strandPool) {
            const startX = this._backgroundWidth * 0.16;
            const endX = this._backgroundWidth * (0.16 + strand.lengthFactor);
            const controlOffset = Math.sin(timeSeconds * strand.speed + strand.phase) * strand.amplitude;
            const y = strand.baseY + controlOffset;

            context.beginPath();
            context.moveTo(startX, y);
            context.bezierCurveTo(
                this._backgroundWidth * 0.34,
                y - strand.amplitude,
                this._backgroundWidth * 0.62,
                y + strand.amplitude,
                endX,
                y,
            );
            context.strokeStyle = 'rgba(102, 228, 244, 0.06)';
            context.lineWidth = 1.0;
            context.stroke();
        }

        // Draw particles
        for (const particle of this._particlePool) {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;

            if (particle.x > this._backgroundWidth + 16) {
                particle.x = -16;
            }
            if (particle.y < -16) {
                particle.y = this._backgroundHeight + 16;
            }

            context.beginPath();
            context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            context.fillStyle = `rgba(140, 244, 255, ${particle.alpha})`;
            context.fill();
        }
    }
}
