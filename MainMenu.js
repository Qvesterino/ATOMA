import { getUIVisibilitySettingsRows } from './ui/config/UIVisibilityConfig.js';
import {
    getDefaultLoreSectionId,
    getLoreEntriesBySection,
    getLoreSectionById,
    getLoreSections,
} from './LoreRegistry.js';

const MENU_PROFILE_STORAGE_KEY = 'atoma.menu.profile.v1';
const MENU_SNAPSHOT_STORAGE_KEY = 'atoma.menu.snapshot.v1';
const MENU_STYLE_ID = 'atoma-main-menu-style';
const MENU_PROFILE_VERSION = 1;
const MENU_SNAPSHOT_VERSION = 1;
const MENU_BUILD_LABEL = 'v0.x';
const VISUAL_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
const SOUND_LEVELS = [0, 20, 40, 60, 80, 100];
const DEFAULT_SETTINGS = Object.freeze({
    soundLevel: 60,
    visuals: 'HIGH',
    particles: true,
    audioMuted: false,
    postProcessing: false,
    semanticPictograms: true,
    environmentalHazards: true,
});

const MENU_MAPS = Object.freeze([
    {
        id: 'fractal',
        label: 'FRACTAL VALLEY',
        footerLabel: 'Fractal Valley',
        description: 'Recursive mathematical space. Calm, structured, and self-similar.',
    },
    {
        id: 'desert',
        label: 'DREAM DESERT',
        footerLabel: 'Dream Desert',
        description: 'Surreal cognitive horizon with wide spacing and soft atmospheric drift.',
    },
    {
        id: 'desert2',
        label: 'MIRAGE VEIL',
        footerLabel: 'Dream Desert II',
        description: 'A denser second dreamscape with sharper dunes, brighter mirage pressure, and a deeper horizon.',
    },
    {
        id: 'quantum',
        label: 'QUANTUM ISLAND',
        footerLabel: 'Quantum Island',
        description: 'Probabilistic terrain with unstable gradients and uncertain silhouettes.',
    },
    {
        id: 'memory',
        label: 'MEMORY LANE',
        footerLabel: 'Memory Lane',
        description: 'Endless corridor of archived echoes, server towers, and slow drifting recollection.',
    },
    {
        id: 'sigma',
        label: 'SIGMA CHAMBER',
        footerLabel: 'Sigma Chamber',
        description: 'Anomalous chamber with sharper tension, instability, and glitch pressure.',
    },
]);

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function lerp(start, end, alpha) {
    return start + (end - start) * alpha;
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

function getMenuMapById(mapId) {
    return MENU_MAPS.find((map) => map.id === mapId) || MENU_MAPS[0];
}

function sanitizeSelectedMapId(value) {
    if (typeof value !== 'string') {
        return MENU_MAPS[0].id;
    }

    const normalized = value.trim().toLowerCase();
    return getMenuMapById(normalized).id;
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
        semanticPictograms: settings.semanticPictograms !== false,
        environmentalHazards: settings.environmentalHazards !== false,
    };
}

function sanitizeProfile(value) {
    const profile = value && typeof value === 'object' ? value : {};
    return {
        version: MENU_PROFILE_VERSION,
        selectedMapId: sanitizeSelectedMapId(profile.selectedMapId),
        settings: sanitizeSettings(profile.settings),
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
            background: rgba(3, 10, 16, 0.28);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
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
            background: linear-gradient(180deg, rgba(7, 17, 24, 0.76), rgba(4, 10, 16, 0.60));
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
        }
    `;

    document.head.appendChild(style);
}

export function getSettingsRows(settings) {
    return [
        {
            type: 'setting',
            id: 'sound',
            label: 'SOUND',
            value: `[${'='.repeat(settings.soundLevel / 20)}${'-'.repeat(5 - (settings.soundLevel / 20))}] ${String(settings.soundLevel).padStart(3, ' ')}%`,
            description: 'Cycles the stored boot audio level in 20% steps.',
        },
        {
            type: 'toggle',
            id: 'audioMuted',
            label: 'MUTE AUDIO',
            value: `[ ${settings.audioMuted ? 'MUTED' : 'LIVE'} ]`,
            description: 'Completely silences all ATOMA audio output.',
        },
        {
            type: 'setting',
            id: 'visuals',
            label: 'VISUALS',
            value: `[ ${settings.visuals} ]`,
            description: 'Adjusts menu presentation intensity without touching live gameplay systems.',
        },
        {
            type: 'setting',
            id: 'particles',
            label: 'PARTICLES',
            value: `[ ${settings.particles ? 'ON' : 'OFF'} ]`,
            description: 'Enables or disables the menu atmosphere particle drift.',
        },
        {
            type: 'toggle',
            id: 'postProcessing',
            label: 'POSTPROCESSING',
            value: `[ ${settings.postProcessing ? 'ON' : 'OFF'} ]`,
            description: 'Enable or disable bloom/composite postprocessing effects.',
        },
        {
            type: 'toggle',
            id: 'semanticPictograms',
            label: 'SEMANTIC PICTOGRAMS',
            value: `[ ${settings.semanticPictograms ? 'ON' : 'OFF'} ]`,
            description: 'Enable or disable the orbiting link semantic pictogram layer.',
        },
        {
            type: 'toggle',
            id: 'environmentalHazards',
            label: 'ENVIRONMENTAL HAZARDS',
            value: `[ ${settings.environmentalHazards ? 'ON' : 'OFF'} ]`,
            description: 'Enable or disable the hazard visuals and environmental danger overlays.',
        },
        ...getUIVisibilitySettingsRows(),
    ];
}

export class MainMenu {
    constructor({ actions = {}, buildLabel = MENU_BUILD_LABEL } = {}) {
        ensureMenuStyles();

        const snapshot = loadContinueSnapshot();
        const profile = loadMenuProfile();

        this.actions = {
            resume: () => {},
            startNew: () => {},
            exit: () => {},
            ...actions,
        };
        this.buildLabel = buildLabel;
        this.profile = saveMenuProfile({
            selectedMapId: snapshot?.selectedMapId || profile.selectedMapId,
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
        this._dpr = 1;
        this._backgroundWidth = 0;
        this._backgroundHeight = 0;
        this._particlePool = [];
        this._strandPool = [];

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
    }

    refresh() {
        const loreScrollTop = this.loreBody ? this.loreBody.scrollTop : 0;
        this.state.hasSave = Boolean(loadContinueSnapshot());
        this.profile.settings.audioMuted = isMenuAudioMuted();
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

        this._renderFooter();
        this._rebuildBackgroundModel();
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
            return MENU_MAPS.map((map) => ({
                id: map.id,
                label: map.label,
                meta: map.description,
                type: 'map',
                selectable: true,
            }));
        }

        if (this.state.screen === 'SETTINGS') {
            return getSettingsRows(this.profile.settings).map((row) => ({
                id: row.id,
                label: row.label,
                value: row.value,
                meta: row.description,
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
            return;
        }

        if (this.state.screen === 'MAP') {
            const selectedMap = this._getSelectedEntry();
            this.subtitle.textContent = 'Select the world that should boot when the network wakes.';
            this.screenTitle.textContent = 'SELECT MAP';
            this.description.textContent = selectedMap ? selectedMap.meta : '';
            this.hint.textContent = '[ ENTER ] START  |  [ ESC ] BACK';
            this.status.textContent = 'Changing the map updates the main screen footer immediately.';
            this._renderEntryList(this._screenEntries);
            return;
        }

        if (this.state.screen === 'SETTINGS') {
            const selectedSetting = this._getSelectedEntry();
            this.subtitle.textContent = 'Simple menu-owned settings, including audio mute and HUD visibility controls.';
            this.screenTitle.textContent = 'SETTINGS';
            this.description.textContent = selectedSetting ? selectedSetting.meta : 'Audio mute and UI visibility controls persist across reloads.';
            this.hint.textContent = 'UP / DOWN TO SELECT  |  ENTER TO ACTIVATE  |  LEFT / RIGHT FOR BASE SETTINGS  |  ESC TO BACK';
            this.status.textContent = 'Sound level and mute are stored for boot. Visuals and particles affect the menu atmosphere only.';
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

            const marker = document.createElement('span');
            marker.className = 'atoma-main-menu__marker';
            marker.textContent = '▶';

            const label = document.createElement('span');
            label.className = 'atoma-main-menu__label';
            label.textContent = entry.label;

            button.append(marker, label);

            if (entry.type === 'setting' || entry.type === 'toggle') {
                const value = document.createElement('span');
                value.className = 'atoma-main-menu__value';
                value.textContent = entry.value;
                button.appendChild(value);
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
                this.activateSelected();
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

        const featuredSummary = document.createElement('div');
        featuredSummary.className = 'atoma-main-menu__lore-featured-summary';
        featuredSummary.textContent = featuredEntry?.summary || featuredEntry?.body || '';

        featuredCopy.append(featuredLabel, featuredTitle, featuredSubtitle, featuredSummary);

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

        featuredMeta.append(featuredCanon, featuredMeaning, featuredRelevance);
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

            const summaryBlock = document.createElement('div');
            summaryBlock.className = 'atoma-main-menu__lore-card-summary';
            summaryBlock.textContent = entry.summary || entry.body || '';

            card.append(title, subtitle, summaryBlock);
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

    activateSelected() {
        this._activateCurrentEntry();
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

    _activateCurrentEntry() {
        const entry = this._getSelectedEntry();
        if (!entry) {
            return;
        }

        if (this.state.screen === 'MAIN') {
            this._activateMainEntry(entry.id);
            return;
        }

        if (this.state.screen === 'MAP') {
            this.profile.selectedMapId = entry.id;
            this.profile = saveMenuProfile(this.profile);
            this.actions.startNew({
                worldId: entry.id,
                selectedMapId: entry.id,
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

            this._cycleSetting(entry.id, 1);
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

    _cycleSetting(settingId, direction) {
        const settings = { ...this.profile.settings };

        if (settingId === 'sound') {
            const currentIndex = SOUND_LEVELS.indexOf(settings.soundLevel);
            const nextIndex = clamp(currentIndex + direction, 0, SOUND_LEVELS.length - 1);
            settings.soundLevel = SOUND_LEVELS[nextIndex];
        } else if (settingId === 'audioMuted') {
            settings.audioMuted = !settings.audioMuted;
            setMenuAudioMuted(settings.audioMuted);
        } else if (settingId === 'visuals') {
            const currentIndex = VISUAL_LEVELS.indexOf(settings.visuals);
            const nextIndex = (currentIndex + direction + VISUAL_LEVELS.length) % VISUAL_LEVELS.length;
            settings.visuals = VISUAL_LEVELS[nextIndex];
        } else if (settingId === 'particles') {
            settings.particles = !settings.particles;
        } else if (settingId === 'postProcessing') {
            settings.postProcessing = !settings.postProcessing;
            if (typeof window !== 'undefined') {
                if (window.game?.setPostProcessingEnabled) {
                    window.game.setPostProcessingEnabled(settings.postProcessing);
                } else {
                    window.__ATOMA_POSTPROCESSING_PENDING__ = settings.postProcessing;
                }
            }
        } else if (settingId === 'semanticPictograms') {
            settings.semanticPictograms = !settings.semanticPictograms;
            if (typeof window !== 'undefined') {
                if (window.game?.setSemanticPictogramsEnabled) {
                    window.game.setSemanticPictogramsEnabled(settings.semanticPictograms);
                } else {
                    window.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__ = settings.semanticPictograms;
                }
            }
        } else if (settingId === 'environmentalHazards') {
            settings.environmentalHazards = !settings.environmentalHazards;
            if (typeof window !== 'undefined') {
                if (window.game?.setEnvironmentalHazardsEnabled) {
                    window.game.setEnvironmentalHazardsEnabled(settings.environmentalHazards);
                } else {
                    window.__ATOMA_ENVIRONMENTAL_HAZARDS_PENDING__ = settings.environmentalHazards;
                }
            }
        }

        this.profile.settings = settings;
        this.profile = saveMenuProfile(this.profile);
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
            this.activateSelected();
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
            this._cycleSetting(entry.id, event.key === 'ArrowLeft' ? -1 : 1);
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
            const targetScale = selected ? 1.08 + (pulse * 0.018) : 1;
            const targetOpacity = selected ? 1 : 0.46;
            const targetGlow = selected ? 1 : 0;
            const state = this._entryAnimationState.get(ref.key) || {
                scale: 1,
                opacity: 0.46,
                glow: 0,
            };

            state.scale = lerp(state.scale, targetScale, 0.18);
            state.opacity = lerp(state.opacity, targetOpacity, 0.16);
            state.glow = lerp(state.glow, targetGlow, 0.20);
            this._entryAnimationState.set(ref.key, state);

            ref.element.style.transform = `scale(${state.scale})`;
            ref.element.style.opacity = String(state.opacity);
            ref.element.style.borderColor = `rgba(108, 234, 255, ${0.12 + (state.glow * 0.22)})`;
            ref.element.style.background = `rgba(10, 28, 40, ${0.10 + (state.glow * 0.22)})`;
            ref.element.style.boxShadow = `0 0 ${10 + (state.glow * 18)}px rgba(90, 236, 255, ${state.glow * 0.22})`;
            ref.marker.style.opacity = selected ? '1' : '0';
            ref.element.style.textShadow = selected
                ? '0 0 18px rgba(98, 238, 255, 0.28)'
                : 'none';
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
    }

    _drawBackground(dt, timeSeconds) {
        const context = this.canvas.getContext('2d');
        if (!context) {
            return;
        }

        context.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
        context.clearRect(0, 0, this._backgroundWidth, this._backgroundHeight);

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
            context.strokeStyle = 'rgba(102, 228, 244, 0.10)';
            context.lineWidth = 1.2;
            context.stroke();
        }

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
