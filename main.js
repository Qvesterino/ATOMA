// ============================================================================
// [BOOT] SAFETY LOGGING - Module Load Verification
// ============================================================================
// === GLOBAL CONSOLE GATE ===
window.ATOMA_LOG_LEVEL = window.ATOMA_LOG_LEVEL ?? 'error'; 
// levels: 'error' | 'warn' | 'info' | 'log'
window.ATOMA_ENABLE_AINODES = false;
(function () {
    const original = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    console.log = (...args) => {
        if (window.ATOMA_LOG_LEVEL === 'log') original.log(...args);
    };

    console.info = (...args) => {
        if (window.ATOMA_LOG_LEVEL === 'log' || window.ATOMA_LOG_LEVEL === 'info')
            original.info(...args);
    };

    console.warn = (...args) => {
        if (window.ATOMA_LOG_LEVEL !== 'error')
            original.warn(...args);
    };

    console.error = (...args) => {
        original.error(...args);
    };
})();

// ============================================================================
// VISUAL BASELINE MODE (Soft Disable — Reversible)
// ============================================================================
import { debugLog } from './Engine/Debug/DebugLog.js';
import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';
import * as THREE from 'three';
import { systemRegistry } from './Engine/SystemRegistry.js';
window.THREE = THREE;
window.SYSTEM_REGISTRY = systemRegistry;
// TEMP DISABLED: SphereCreatorTrace blocking spawn pipeline
// import { installSphereCreatorTrace } from './SphereCreatorTrace.js';
import { installMaterialMutationDetector } from './MaterialMutationDetector.js';
import { PlayerController, FirstPersonCameraController } from './rosie/controls/rosieControls.js';
import { World } from './World.js';
import { SigmaRiftChamber } from './SigmaRiftChamber.js';
import { DreamDesert } from './DreamDesert.js';
import { DreamDesert2 } from './DreamDesert2.js';
import { QuantumIsland } from './QuantumIsland.js';
import { FractalValley } from './FractalValley.js';
import { MemoryLane } from './MemoryLane.js';
import { EnvironmentDomainController } from './EnvironmentDomainController.js';
import { AINodes } from './AINodes.js';
import { EnhancedNodeModels } from './EnhancedNodeModels.js';
import { NODE_VISUAL_REGISTRY } from './NodeVisualRegistry.js';
// REMOVED: ArchetypeVisualProfiles, ArchetypeVisualDifferentiationSystem, patchArchetypeVisuals — moved to LEGACY/april (2026-04-22)
import { AtomaAudioSystem } from './AtomaAudioSystem.js';
import { AtomaAudioModulation } from './AtomaAudioModulation.js';
import { registerAtomaAudioEventManifest } from './AtomaAudioEventManifest.js';
import { getSharedAtomaLoadingOverlay } from './AtomaLoadingOverlay.js';
import NodeLinkingSystem, { warmUpArchetypeShaders } from './NodeLinkingSystem.js';
import { CONFIG } from './config.js';
import { FrameClock } from './FrameClock.js';
import { FrameScheduler } from './FrameScheduler.js';
import { LinkCollapseSystem } from './LinkCollapseSystem.js';
import { LinkCollapseEventFX, validateLinkCollapseEventFX } from './LinkCollapseEventFX.js';
import { AtomaLeaderboard, validateAtomaLeaderboard } from './AtomaLeaderboard.js';
import { DistanceLODController } from './DistanceLODController.js';
import { VFXRuntimeLoader } from './src/vfx/VFXRuntimeLoader.js';
import { VFX_SYSTEMS } from './src/vfx/VFXSystemRegistry.js';
import { installVFXConsoleAPI } from './src/vfx/VFXConsoleAPI.js';
// PHASE5 CONSOLIDATED: MultiNetworkCore replaces Manager + Sync + Orchestrator
import { PHASE5_MultiNetworkManager, PHASE5_NetworkSynchronization, PHASE5_MultiNetworkOrchestrator } from './PHASE5_MultiNetworkCore.js';
import PHASE5_CorruptionBridge from './PHASE5_CorruptionBridge_v1.js';
import { TIER4_CorruptionFeedbackVisuals } from './TIER4_CorruptionFeedbackVisuals_v1.js';
import { CorruptionVisualFX_v1 } from './CorruptionVisualFX_v1.js';
// REMOVED: CorruptionDrivenAuraDesaturationSystem — moved to LEGACY/april (2026-04-22)
import './Engine/Debug/FXDebugSandbox.js';
// REMOVED (2026-03-01): ShaderFreezeGuard disabled for new visual modules
// import { installShaderFreezeGuard, warmupAllVisualVariants } from './Engine/Debug/ShaderFreezeGuard.js';
// TEMP DISABLED: VisualSpherePolicy blocking spawn pipeline (Object3D.add)
// import { ensureSpherePolicyInstalled, installSpherePolicy } from './VisualSpherePolicy.js';
import { RenderCostProfile } from './RenderCostProfile.js';
import { sanitizeTransmission, findTransmissionMaterials } from './src/render/TransmissionSanitizer.js';
import { checkLateMaterialCreation, installMaterialDebugGuard } from './src/metrics/MaterialDebugGuard_v1.js';
import { setVisualLock } from './Engine/authority/VisualAuthorityFlag.js';

function createMetricDirtyQueue() {
    const nodeIds = new Set();
    const linkIds = new Set();

    return {
        markNode(nodeId) {
            if (nodeId !== undefined && nodeId !== null) {
                nodeIds.add(String(nodeId));
            }
        },
        markNodes(ids) {
            if (!ids) return;
            for (const nodeId of ids) {
                this.markNode(nodeId);
            }
        },
        markLink(linkId) {
            if (linkId !== undefined && linkId !== null) {
                linkIds.add(String(linkId));
            }
        },
        markLinks(ids) {
            if (!ids) return;
            for (const linkId of ids) {
                this.markLink(linkId);
            }
        },
        snapshotNodeIds() {
            return new Set(nodeIds);
        },
        snapshotLinkIds() {
            return new Set(linkIds);
        },
        clearNodes() {
            nodeIds.clear();
        },
        clearLinks() {
            linkIds.clear();
        },
        clear() {
            nodeIds.clear();
            linkIds.clear();
        },
        get nodeCount() {
            return nodeIds.size;
        },
        get linkCount() {
            return linkIds.size;
        }
    };
}

function auditLateMaterialCreation(label) {
    checkLateMaterialCreation(undefined, label);
}

function getCachedVisualMetrics(scope = globalThis) {
    const liveMetrics = scope?.__ATOMA_LIVE_METRICS__;
    if (!liveMetrics) return null;

    return {
        avgSynergy: Number.isFinite(liveMetrics.networkSynergy) ? liveMetrics.networkSynergy : 0,
        avgHarmony: Number.isFinite(liveMetrics.harmonyFlow) ? liveMetrics.harmonyFlow : 0,
        avgCorruption: Number.isFinite(liveMetrics.corruptionLevel) ? liveMetrics.corruptionLevel : 0,
        avgStability: Number.isFinite(liveMetrics.networkStress) ? Math.max(0, 1 - liveMetrics.networkStress) : 0,
        avgLoadPressure: Number.isFinite(liveMetrics.loadPressure) ? liveMetrics.loadPressure : 0
    };
}

function mountAudioMuteToggleHUD(host = document.body) {
    if (typeof document === 'undefined') return null;

    const root = host || document.body;
    if (!root) return null;

    const existing = document.getElementById('atoma-audio-mute-toggle-root');
    if (existing) {
        window.__ATOMA_UPDATE_AUDIO_MUTE_TOGGLE__?.();
        return existing;
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'atoma-audio-mute-toggle-root';
    wrapper.style.position = 'fixed';
    wrapper.style.top = '10px';
    wrapper.style.left = '50%';
    wrapper.style.transform = 'translateX(-50%)';
    wrapper.style.zIndex = '2147483647';
    wrapper.style.pointerEvents = 'none';

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'atoma-audio-mute-toggle';
    button.style.pointerEvents = 'auto';
    button.style.border = '1px solid rgba(120, 255, 255, 0.7)';
    button.style.borderRadius = '999px';
    button.style.padding = '8px 14px';
    button.style.minWidth = '132px';
    button.style.background = 'rgba(8, 16, 28, 0.88)';
    button.style.color = '#c9ffff';
    button.style.font = '600 12px/1.1 system-ui, sans-serif';
    button.style.letterSpacing = '0.12em';
    button.style.textTransform = 'uppercase';
    button.style.cursor = 'pointer';
    button.style.touchAction = 'manipulation';
    button.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
    button.style.backdropFilter = 'blur(10px)';
    button.style.webkitBackdropFilter = 'blur(10px)';

    const getAudioEnabledPreference = () => {
        if (window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ !== undefined) {
            return window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ !== false;
        }

        try {
            if (typeof localStorage === 'undefined') return true;
            const stored = localStorage.getItem('atoma.audio.enabled');
            if (stored === null) return true;
            return stored !== '0' && stored !== 'false';
        } catch {
            return true;
        }
    };

    const update = () => {
        const audio = window.game?.audioSystem || null;
        const enabled = getAudioEnabledPreference();
        const muted = !enabled || !!window.Tone?.getDestination?.()?.mute;

        button.textContent = enabled ? 'AUDIO: ON' : 'AUDIO: OFF';
        button.title = enabled ? 'Turn audio off' : 'Turn audio on';
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.setAttribute('aria-pressed', String(!muted));
    };

    const applyAudioEnabled = (enabled) => {
        const nextEnabled = enabled !== false;

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
    };

    const toggle = () => {
        return applyAudioEnabled(!getAudioEnabledPreference());
    };

    window.setAudioEnabled = applyAudioEnabled;
    window.toggleAudio = () => applyAudioEnabled(!getAudioEnabledPreference());

    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle();
    });

    wrapper.appendChild(button);
    root.appendChild(wrapper);
    window.__ATOMA_UPDATE_AUDIO_MUTE_TOGGLE__ = update;
    update();
    return wrapper;
}

function removeLegacyRuntimeHudElements() {
    if (typeof document === 'undefined') return;

    document.getElementById('world-selector-hud')?.remove();
    document.getElementById('atoma-audio-mute-toggle-root')?.remove();
}

function getLinkCreateCallbackTimingRegistry(scope = globalThis) {
    const existingRegistry = scope?.__ATOMA_LINK_CREATE_CALLBACK_TIMINGS__;
    if (existingRegistry) {
        return existingRegistry;
    }

    const rowsByLabel = new Map();
    const registry = {
        record(label, elapsedMs) {
            if (!label || !Number.isFinite(elapsedMs)) return;

            const existingRow = rowsByLabel.get(label) || {
                label,
                count: 0,
                totalMs: 0,
                minMs: Number.POSITIVE_INFINITY,
                maxMs: 0,
                lastMs: 0
            };

            existingRow.count += 1;
            existingRow.totalMs += elapsedMs;
            existingRow.minMs = Math.min(existingRow.minMs, elapsedMs);
            existingRow.maxMs = Math.max(existingRow.maxMs, elapsedMs);
            existingRow.lastMs = elapsedMs;
            rowsByLabel.set(label, existingRow);
        },
        getRows() {
            return Array.from(rowsByLabel.values())
                .map((row) => ({
                    label: row.label,
                    count: row.count,
                    totalMs: Number(row.totalMs.toFixed(3)),
                    avgMs: Number((row.totalMs / row.count).toFixed(3)),
                    minMs: Number(row.minMs.toFixed(3)),
                    maxMs: Number(row.maxMs.toFixed(3)),
                    lastMs: Number(row.lastMs.toFixed(3))
                }))
                .sort((left, right) => right.avgMs - left.avgMs || right.totalMs - left.totalMs);
        },
        clear() {
            rowsByLabel.clear();
        }
    };

    scope.__ATOMA_LINK_CREATE_CALLBACK_TIMINGS__ = registry;
    scope.getLinkCreateCallbackTimingTable = () => registry.getRows();
    scope.clearLinkCreateCallbackTimings = () => registry.clear();
    return registry;
}

function timeLinkCreateCallback(label, callback) {
    return (...args) => {
        if (globalThis?.__ATOMA_LINK_CREATE_TIMING_ENABLED__ === false) {
            return callback(...args);
        }

        const timingRegistry = getLinkCreateCallbackTimingRegistry();

        const startedAt = performance.now();
        try {
            return callback(...args);
        } finally {
            timingRegistry.record(label, performance.now() - startedAt);
        }
    };
}

function ensureAudioToggleCommands() {
    if (typeof window === 'undefined') return;

    window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ = window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ ?? true;

    window.setAudioEnabled = function (enabled) {
        const nextEnabled = enabled !== false;

        const audioSystem = window.game?.audioSystem || null;
        if (audioSystem?.setEnabled) {
            try {
                audioSystem.setEnabled(nextEnabled);
            } catch {
            }
        }

        window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ = nextEnabled;

        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('atoma.audio.enabled', nextEnabled ? '1' : '0');
            }
        } catch {
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

        console.log(`🔊 Audio System ${nextEnabled ? 'ENABLED' : 'DISABLED'}`);
        window.__ATOMA_UPDATE_AUDIO_MUTE_TOGGLE__?.();
        return nextEnabled;
    };

    window.toggleAudio = function () {
        const currentEnabled = window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ !== undefined
            ? window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ !== false
            : window.game?.audioSystem
                ? window.game.audioSystem.enabled !== false
                : true;
        return window.setAudioEnabled?.(!currentEnabled);
    };

        const startedAt = performance.now();
        try {
            return callback(...args);
        } finally {
            timingRegistry.record(label, performance.now() - startedAt);
        }

    ensureAudioToggleCommands();
    };

if (typeof window !== 'undefined') {
    // Link growth reactivation defaults
    window.ATOMA_LINK_SPAWN_ENABLED = true;
    window.ATOMA_ENABLE_ANIMATED_LINK_FLOW = false;
    window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ = window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ ?? true;
    // Enable diagnostics for first tests; can be turned off in console
    window.__SPAWN_DIAG = window.__SPAWN_DIAG ?? true;
    window.ATOMA_DEBUG_LINK_SPAWN = window.ATOMA_DEBUG_LINK_SPAWN ?? true;

    // ====================================================================
    // ATOMA FLAGS — CONSOLIDATED FLAG SYSTEM (Phase C)
    // ====================================================================
    const releaseContainmentProfile = ensureAtomaReleaseContainmentGlobals(window);
    window.ATOMA_FLAGS = {
      debug: {
        logLevel: window.ATOMA_LOG_LEVEL ?? 'error',
        enabled: window.ATOMA_DEBUG ?? false,
        frame: window.ATOMA_DEBUG_FRAME ?? false,
        shader: window.ATOMA_DEBUG_SHADER ?? false,
        link: window.ATOMA_DEBUG_LINK ?? false,
        world: window.ATOMA_DEBUG_WORLD ?? false,
        cadence: window.ATOMA_DEBUG_CADENCE ?? false,
        materialMutations: window.ATOMA_DEBUG_MATERIAL_MUTATIONS ?? false,
        spawn: window.ATOMA_DEBUG_SPAWN ?? false,
        visual: window.ATOMA_DEBUG_VISUAL ?? false,
        policy: window.ATOMA_DEBUG_POLICY ?? false,
        visualBuild: window.ATOMA_DEBUG_VISUAL_BUILD ?? false,
        spawnLogs: window.ATOMA_DEBUG_SPAWN_LOGS ?? false,
        linkSpawn: window.ATOMA_DEBUG_LINK_SPAWN ?? false,
        visualKill: window.ATOMA_DEBUG_VISUAL_KILL ?? false,
        disableSynergyShaderStacks: window.ATOMA_DISABLE_SYNERGY_SHADER_STACK !== false,
        glyphFusionIntegrity: window.ATOMA_DEBUG_GLYPH_FUSION_INTEGRITY ?? false,
        probeSpawn: window.ATOMA_PROBE_SPAWN ?? false,
        worldProbe: window.ATOMA_WORLD_PROBE ?? false,
        strictNodeGeometry: window.ATOMA_STRICT_NODE_GEOMETRY_MODE ?? false,
        devGuards: window.ATOMA_DEV_GUARDS ?? false,
        silentWarnings: window.ATOMA_SILENT_WARNINGS ?? false,
        visualBaseline: window.ATOMA_VISUAL_BASELINE ?? false
      },
      
      runtime: {
        linkSpawnEnabled: window.ATOMA_LINK_SPAWN_ENABLED ?? true,
        noFallbackSpheres: window.ATOMA_NO_FALLBACK_SPHERES ?? false
      },
      
      safety: {
        disableParasiticHUDs: window.ATOMA_DISABLE_PARASITIC_HUDS ?? true,
        hardKillParasiticDOM: window.ATOMA_HARD_KILL_PARASITIC_DOM ?? false,
        hardOffLanguageEngine: window.ATOMA_HARD_OFF_LANGUAGE_ENGINE ?? false,
                disableMythicRituals: window.ATOMA_DISABLE_MYTHIC_RITUALS ?? false,
        disablePhase8NetworkRituals: window.ATOMA_DISABLE_PHASE8_NETWORK_RITUALS ?? false,
        disableNuclearLock: true
      },

      release: {
        demoProfile: releaseContainmentProfile.demoProfile,
        disableWaveShaderStack: releaseContainmentProfile.systems.waveShaderStack.disabledByPolicy === true,
        disableSynergyChainReaction: releaseContainmentProfile.systems.synergyChainReaction.disabledByPolicy === true
      }
    };
    
    // Debug Log Level (separate for backward compatibility)
    window.ATOMA_LOG_LEVEL = window.ATOMA_FLAGS.debug.logLevel;
    window.ATOMA_DISABLE_SYNERGY_SHADER_STACK = window.ATOMA_FLAGS?.visual?.disableSynergyShaderStacks ?? false;
    window.ATOMA_DEMO_RELEASE_PROFILE = window.ATOMA_FLAGS?.release?.demoProfile ?? true;
    window.ATOMA_DISABLE_WAVE_SHADER_STACK = window.ATOMA_FLAGS?.release?.disableWaveShaderStack ?? true;
    window.ATOMA_DISABLE_SYNERGY_CHAIN_REACTION = window.ATOMA_FLAGS?.release?.disableSynergyChainReaction ?? true;
    window.__ATOMA_RELEASE_CONTAINMENT_PROFILE__ = () => getAtomaReleaseContainmentProfile(window);
    
    debugLog(window.ATOMA_FLAGS.debug.enabled, '[ATOMA] Flags initialized:', window.ATOMA_FLAGS);
}

debugLog(window.ATOMA_DEBUG, '[BOOT] main.js loaded');
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';
import {
    buildAtomaReleaseContainmentStatus,
    createAtomaReleaseContainmentRuntimeState,
    ensureAtomaReleaseContainmentGlobals,
    getAtomaReleaseContainmentProfile,
} from './src/runtime/AtomaReleaseContainmentPolicy.js';
import VisualTime from './src/time/VisualTime.js';
import { FrameUpdateLoopOrderValidator_v1 } from './FrameUpdateLoopOrderValidator_v1.js';
// REMOVED: NodeEditor — moved to LEGACY (2026-05-14)
import { EnvironmentalHazards } from './EnvironmentalHazards.js';
import { CinematicUpgrade } from './CinematicUpgrade.js?rev=2';
import { VisualUpgradeSuperpack } from './VisualUpgradeSuperpack.js?rev=2';
import { SafeEvolutionManager } from './_SafeEvolutionManager.js';
// import { SafeLegendaryNodePack } from './LEGACY/_SafeLegendaryNodePack.js';
import { SafeLegendaryLinkFX } from './_SafeLegendaryLinkFX.js';
import { SafeLegendaryWorldEvents } from './_SafeLegendaryWorldEvents.js';
import { SafeAIWeatherPack } from './_SafeAIWeatherPack.js';
// REMOVED: SafeNodePersonalityFX - moved to LEGACY/ (2026-05-14) - personality now derived from metric tiers in _NodeMicroEvents
// import { SafeNodePersonalityFX } from './LEGACY/_SafeNodePersonalityFX.js';
import { SafeWorldFXPack } from './_SafeWorldFXPack.js';
import { AmbientEntityManager } from './_AmbientEntityManager.js';
// REMOVED: SafeMemoryTrailsManager.js - moved to LEGACY/GRAVEYARD (2026-04-05) - Unused (nodes/links static, FPS player doesn't see trails)
import { SafeQuantumIllusionsPack1 } from './SafeQuantumIllusionsPack1.js';
import { SafeColonyExpansion2 } from './SafeColonyExpansion2.js';
import { SafeDreamDepthPack } from './SafeDreamDepthPack.js';
import { DreamDepthEffectManager } from './DreamDepthEffectManager.js';
import { SafeMobilityPack4 } from './SafeMobilityPack4.js';
// REMOVED: _SIMULATION_INVARIANT_ENFORCEMENT - moved to LEGACY (2026-04-08)
// REMOVED: _TASK_AUDIT_DEBUG_HELPERS - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)
// REMOVED: _TASK_3_RARE_NODE_VERIFICATION - moved to LEGACY (2026-04-03)
// import { setupRareNodeVerificationTracker } from './_TASK_3_RARE_NODE_VERIFICATION.js';
import { SessionVariantEngine } from './SessionVariantEngine.js';
import { setSessionVariantEngine } from './EnhancedNodeModels.js';

// Session-scoped variant engine (deterministic)
const sessionVariantEngine = new SessionVariantEngine(Date.now());
setSessionVariantEngine(sessionVariantEngine);
if (typeof window !== 'undefined') {
    window.sessionVariantEngine = sessionVariantEngine;
}

function markReleaseContainmentRuntime(game, systemKey, patch = {}) {
    if (!game) return null;
    if (!game._releaseContainmentRuntime) {
        game._releaseContainmentRuntime = createAtomaReleaseContainmentRuntimeState();
    }
    const systemState = game._releaseContainmentRuntime[systemKey];
    if (!systemState) return null;
    Object.assign(systemState, patch);
    return systemState;
}
// REMOVED: EvolvingLinkFX2_0 - moved to LEGACY (2026-04-03)
// REMOVED: NodePersonality2_0 - moved to LEGACY (2026-04-03)
// import { NodePersonality2_0 } from './NodePersonality2_0.js';
import { CoreMetricsOverlay } from './HUD/CoreMetricsOverlay.js';
import { GameplayHintLayer } from './HUD/GameplayHintLayer.js';
import { FirstRunGuidanceDirector, GUIDED_FLOW_VERSION } from './HUD/FirstRunGuidanceDirector.js';
import { RunIdentityDirector } from './HUD/RunIdentityDirector.js';
import { createEmptyCoreMetricsViewModel, updateCoreMetricsViewModel } from './HUD/CoreMetricsViewModel.js';
import { loadMenuProfile, saveMenuProfile } from './MainMenu.js';
import { composeRunIdentitySelection, isRunIdentityWorld } from './RunIdentityProfiles.js';
import { SystemStateOverlay } from './SystemStateOverlay.js';
import { ZoneAudioReactivity } from './ZoneAudioReactivity.js';
// DISABLED: Legacy metric reactive system (replaced by Phase 5-7 architecture)
import { MetricReactiveWorldEvents } from './MetricReactiveWorldEvents.js';

if (typeof window !== 'undefined') {
  window.__ALLOW_EXTERNAL_SPAWN__ = false;
}
import { SafeWorldResetFix1_0 } from './SafeWorldResetFix1_0.js';
import { NodeInspectOverlay1_0 } from './NodeInspectOverlay1_0.js';
import { SafeMetricsFX1_1 } from './SafeMetricsFX1_1.js';
// REMOVED: NodePersonalitySystem2_0 - moved to LEGACY (2026-04-03)
// import { NodePersonalitySystem2_0 } from './NodePersonalitySystem2_0.js';
import { NodeMicroEvents } from './_NodeMicroEvents.js';
import { WorldPersonalityController } from './_WorldPersonalityController.js';
import { MythicRitualController } from './_MythicRitualController.js';


import { SimulationEffectOrchestrator } from './SimulationEffectOrchestrator.js';
// import { MythicSeedGlyph } from './_MythicSeedGlyph.js';  // LEGACY/april — disconnected 2026-04-22
// REMOVED: LegacyDebugConeCleanup - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)
// import { FractalHexMarker } from './_FractalHexMarker.js'; // DISABLED - legacy debug system
// import { LegacyGlyphCleanup } from './_LegacyGlyphCleanup.js';  // LEGACY/april — disconnected 2026-04-22
import { AtomaGlyphSystem4_0 } from './_AtomaGlyphSystem4_0.js';
import { GlyphLayer4_MultiFusion } from './_GlyphLayer4_MultiFusion.js';
import { SemanticGlyphAI } from './_SemanticGlyphAI.js';
import { GlyphFusionOverlay4_1 } from './_GlyphFusionOverlay4_1.js';
import { ProceduralMeaningEngine } from './_ProceduralMeaningEngine.js';
import { GlyphPurityMode5_1 } from './_GlyphPurityMode5_1.js';
import { AdaptiveGlyphRendering1_0 } from './_AdaptiveGlyphRendering1_0.js';
import { LinkedGlyphSynchronization1_0 } from './_LinkedGlyphSynchronization1_0.js';
import { LinkedGlyphMessaging3_0 } from './_LinkedGlyphMessaging3_0.js';
import { RecursiveGlyphMessaging4_0 } from './_RecursiveGlyphMessaging4_0.js';
import { RecursiveGlyphSignalSystem } from './_RecursiveGlyphSignalSystem.js';
// import { EmergentThoughtStorms5_0 } from './_EmergentThoughtStorms5_0.js';
import { AINarrativePatterns6_0 } from './_AINarrativePatterns6_0.js';
// REMOVED: ExtremeAIShaderTestSuite - moved to LEGACY (2026-04-03)
// REMOVED: _SafeNewNodeCategories1_0 - moved to LEGACY (2026-04-03)
// import { SafeNewNodeCategories1_0 } from './_SafeNewNodeCategories1_0.js';
// REMOVED: NewNodeCategoryVisuals - moved to LEGACY (2026-04-03)
// import { ExtremeLinkVisualPack3 } from './_ExtremeLinkVisualPack3.js'; // LEGACY
// import { NeuralCurveLinkVisuals, setupNeuralCurveConsoleAPI } from './_NeuralCurveLinkVisuals.js'; // LEGACY
import { AIConsciousnessLayer, setupAIConsciousnessConsoleAPI } from './AIConsciousnessLayer.js';
import { SignatureMomentDirector, installSignatureMomentDirectorDebugAPI } from './SignatureMomentDirector.js';
// DEPRECATED (2026-04-23): _AIThoughtStorms2_0 superseded by _EmergentThoughtStorms5_0
// import { AIThoughtStorms2_0, setupAIThoughtStormsConsoleAPI } from './_AIThoughtStorms2_0.js';
// import { ExtremeLinkVisuals4_0, setupExtremeLinkVisualsV4ConsoleAPI } from './_ExtremeLinkVisuals4_0.js'; // LEGACY
// REMOVED: LinkVisualMoodSystem - moved to LEGACY (2026-04-03)
import { LinkSemanticMetricsBridge_v1 } from './LinkSemanticMetricsBridge_v1.js';
import { LinkCascadeInfectionSystem } from './LinkCascadeInfectionSystem.js';
// REMOVED (2026-03-01): LinkMetricsSanityGuard disabled for new visual modules
import { SemanticActivityFilter_v1 } from './SemanticActivityFilter_v1.js';
import { LinkQualityCalculator } from './LinkQualityCalculator.js';
import { LinkDegradationSystem } from './LinkDegradationSystem.js';
import { NetworkStressAggregator, setupNetworkStressAggregatorConsoleAPI } from './NetworkStressAggregator.js';
// REMOVED: NodeShellSizeAuthority - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)
// REMOVED: ParticleEmissionScaler — moved to LEGACY/april (2026-04-22)
import { mountAIAutomationHUD, updateAIAutomationHUD } from './HUD/AIAutomationHUD.js';
import { mountVariantBAdvisorHUD, updateVariantBAdvisorHUD } from './ui/hud/VariantBAdvisorHUD.js';
import {
    UIVisibilityConfig,
    UI_VISIBILITY_CHANGE_EVENT,
    isHudEffectivelyVisible,
} from './ui/config/UIVisibilityConfig.js';
import { getSharedPostProcessingPipeline } from './PostProcessing.js';
import { getSharedLuminosityBloomPipeline } from './LuminosityBloomPipeline.js';

const ENABLE_SELECTED_NODE_BADGE = false;

// Global camera authority flag: default to first-person only
if (typeof window !== 'undefined') {
    window.CAMERA_AUTHORITY_MODE = window.CAMERA_AUTHORITY_MODE || 'fp_only';
    // Safety flags are now in ATOMA_FLAGS.safety (for backward compatibility, set global aliases)
    window.ATOMA_DISABLE_PARASITIC_HUDS = window.ATOMA_FLAGS?.safety?.disableParasiticHUDs ?? true;
    window.ATOMA_HARD_KILL_PARASITIC_DOM = window.ATOMA_FLAGS?.safety?.hardKillParasiticDOM ?? true;
    window.ATOMA_HARD_OFF_LANGUAGE_ENGINE = window.ATOMA_FLAGS?.safety?.hardOffLanguageEngine ?? true;
}

// Optional logging for program-count checkpoints
const PROGRAM_LOG = true;
const logPrograms = (label, renderer) => {
    if (!PROGRAM_LOG || !renderer?.info) return;
    const info = renderer.info;
    const count = Array.isArray(info.programs) ? info.programs.length : (info.programs ?? 0);
    console.log(`[prog] ${label}: programs=${count}`);
};
// Phase B.3 – program stabilization: dev-only watcher for new program creations
const PROGRAM_WATCH_ENABLED = false;
let __phaseB3LastProgramCount = 0;
// Disable per-frame visual-only ticks to reduce uniform churn/stutters
const VISUAL_TICKS_ENABLED = false;
window.__DEBUG_FRAME_BUDGET_ENABLED = false;   // master switch
window.__DEBUG_FRAME_BUDGET_MS = 3.0;         // max time allowed for heavy systems per frame
window.__DEBUG_FRAME_BUDGET_LOG = true;       // log offenders
window.__DBG_SPIKE_TRACE = false;             // set true to enable RAF spike tracing
window.__DBG_SPIKE_TRACE_THRESHOLD_MS = 200;  // frame duration threshold in ms
// Lightweight parasitic HUD guard: remove unused fullscreen overlays if present
document.addEventListener('DOMContentLoaded', () => {
    const softGate = Boolean(window.ATOMA_FLAGS?.safety?.disableParasiticHUDs);
    const hardGate = Boolean(window.ATOMA_FLAGS?.safety?.hardKillParasiticDOM);
    const hardOffLanguage = Boolean(window.ATOMA_FLAGS?.safety?.hardOffLanguageEngine);
    if (!softGate && !hardGate && !hardOffLanguage) return;

    const targetIds = new Set([
        'atoma-language-engine',
        'auto-link-tooltip-overlay'
    ]);

    if (hardGate || hardOffLanguage) {
        targetIds.add('atoma-language-engine-3-container');
        targetIds.add('auto-link-tooltip-overlay');
        if (!window.ATOMA_DEBUG_HUD_ENABLED) {
            targetIds.add('atoma-debug-hud');
        }
    }

    const targetClassPrefixes = (hardGate || hardOffLanguage)
        ? ['atoma-language-engine', 'atoma-node-poetry', 'atoma-pulse-poetry', 'atoma-link-whisper']
        : [];

    const selectorList = [
        ...Array.from(targetIds).map(id => `#${id}`),
        ...targetClassPrefixes.flatMap(prefix => [
            `[class^=\"${prefix}\"]`,
            `[class*=\" ${prefix}\"]`
        ])
    ];

    const selectors = selectorList.join(',');

    const removeTargets = (root) => {
        if (!selectors) return;
        root.querySelectorAll(selectors).forEach(node => node.parentNode?.removeChild(node));
    };

    removeTargets(document);

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (!(node instanceof Element)) return;
                if (selectors && node.matches?.(selectors)) {
                    node.parentNode?.removeChild(node);
                    return;
                }
                node.querySelectorAll?.(selectors).forEach(child => child.parentNode?.removeChild(child));
            });
        }
    });

    const body = document.body || document.documentElement;
    if (body && selectors) {
        observer.observe(body, { childList: true, subtree: true });
    }
});


// ============================================================================
// PHASE 1 LINK SYSTEMS REACTIVATION (Session 107+)
// Approved infrastructure recovery: LOW + MEDIUM risk systems
// ============================================================================
import { LinkCorrelationEngine1_0 } from './LinkCorrelationEngine1_0.js';
import { LinkHistoryTracker1_0 } from './LinkHistoryTracker1_0.js';

import { AtomaLanguageEngine2_0, setupAtomaNamingConsoleAPI } from './_AtomaLanguageEngine2_0.js';
import { NodeInspectLinguisticOverlay, setupLinguisticOverlayConsoleAPI } from './_NodeInspectLinguisticOverlay.js';
import { atomaNamingEngine } from './_AtomaNamingEngine.js';
import LoreUnlockEngine from './LoreSystem/LoreUnlockEngine.js';
import LoreFragmentEmitter from './LoreSystem/LoreFragmentEmitter.js';
import NetworkChronicle from './LoreSystem/NetworkChronicle.js';
import AtomaLanguageEngine3_0, { setupAtomaLanguageEngine3ConsoleAPI } from './AtomaLanguageEngine3_0.js';
// REMOVED (2026-03-01): CompleteVisualLock disabled for new visual modules
// import { setupCompleteVisualLock, teardownCompleteVisualLock } from './_VisualLockCompleteIntegration.js';

// REMOVED: HologramShellAuthoritySystem - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)
import { setupVisualInteractionIsolation_v2, setupRaycastInteractionFiltering } from './VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js';
import { VisualAudit } from './Engine/Debug/VisualAudit.js';
import { initializeHardInteractionAuthority } from './HARD_INTERACTION_AUTHORITY_SYSTEM.js';
// REMOVED: HARD_AUTHORITY_DEBUG_API - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)
// REMOVED: NodeVisualIntegrityFix - moved to LEGACY (2026-04-03)
// REMOVED: ControlledUnfreezeSystem_v1 - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)

const LORE_TO_LANGUAGE = Object.freeze({
    'codex-index': 'lore.codex.index',
    'codex-philosophical-birth': 'lore.codex.philosophicalBirth',
    'codex-system-psychic': 'lore.codex.systemPsychic',
    'codex-multiversality': 'lore.codex.multiversality',
    'codex-evolution': 'lore.codex.evolution',
    'codex-culture': 'lore.codex.culture',
    'codex-metrics': 'lore.codex.metrics',
    'codex-nodes': 'lore.codex.nodes',
    'link-commitment': 'lore.link.commitment',
    'link-formation': 'lore.link.formation',
    'link-transmission': 'lore.link.transmission',
    'link-collapse': 'lore.link.collapse',
    'world-fractal-valley': 'lore.world.fractalValley',
    'world-dream-desert': 'lore.world.dreamDesert',
    'world-mirage-veil': 'lore.world.mirageVeil',
    'world-quantum-island': 'lore.world.quantumIsland',
    'world-memory-lane': 'lore.world.memoryLane',
    'world-sigma-chamber': 'lore.world.sigmaChamber',
    'event-cascade': 'lore.event.cascade',
    'event-resonance': 'lore.event.resonance',
    'event-outbreak': 'lore.event.outbreak',
    'event-collapse': 'lore.event.collapse',
    'psychology-self-reference': 'lore.psychology.selfReference',
    'psychology-healing': 'lore.psychology.healing',
    'psychology-collapse': 'lore.psychology.collapse',
    'psychology-memory': 'lore.psychology.memory',
    'psychology-burden': 'lore.psychology.burden',
    'psychology-disquiet': 'lore.psychology.disquiet',
    'psychology-reflection': 'lore.psychology.reflection',
    'psychology-threshold': 'lore.psychology.threshold',
    'psychology-resonance': 'lore.psychology.resonance',
    'culture-templates': 'lore.culture.templates',
    'culture-ritual-tone': 'lore.culture.ritualTone',
    'culture-shared-practice': 'lore.culture.sharedPractice',
    'culture-transmission': 'lore.culture.transmission',
    'evolution-differentiation': 'lore.evolution.differentiation',
    'evolution-specialization': 'lore.evolution.specialization',
    'evolution-transcendence': 'lore.evolution.transcendence',
    'evolution-memory': 'lore.evolution.memory',
    'ritual-prelude': 'lore.ritual.prelude',
    'ritual-active': 'lore.ritual.active',
    'ritual-crest': 'lore.ritual.crest',
    'ritual-release': 'lore.ritual.release',
    'node.input.basic': 'lore.node.input',
    'node-input': 'lore.node.input',
    'node.process.basic': 'lore.node.process',
    'node-process': 'lore.node.process',
    'node.control.basic': 'lore.node.control',
    'node-control': 'lore.node.control',
    'node.storage.basic': 'lore.node.storage',
    'node-storage': 'lore.node.storage',
    'node.analytics.basic': 'lore.node.analytics',
    'node-analytics': 'lore.node.analytics',
    'node.integration.basic': 'lore.node.integration',
    'node-integration': 'lore.node.integration',
    'node.memory.basic': 'lore.node.storage',
    'node-memory': 'lore.node.storage',
    'node.higherOrders.basic': 'lore.node.higherOrders',
    'node-higher-orders': 'lore.node.higherOrders',
    'node.quantum.basic': 'lore.node.quantum',
    'node-quantum': 'lore.node.quantum',
    'node.sigma.basic': 'lore.node.sigma',
    'node-sigma': 'lore.node.sigma',
    'node.emotional.basic': 'lore.node.emotional',
    'node-emotional': 'lore.node.emotional',
    'node.mythic.basic': 'lore.node.mythic',
    'node-mythic': 'lore.node.mythic',
    'node.prime.basic': 'lore.node.prime',
    'node-prime': 'lore.node.prime',
    'node.error.basic': 'lore.node.error',
    'node-error': 'lore.node.error',
    'metric.synergy.basic': 'lore.metric.synergy',
    'metric-synergy': 'lore.metric.synergy',
    'metric.harmony.basic': 'lore.metric.harmony',
    'metric-harmony': 'lore.metric.harmony',
    'metric.corruption.basic': 'lore.metric.corruption',
    'metric-corruption': 'lore.metric.corruption',
    'metric.stability.basic': 'lore.metric.stability',
    'metric-stability': 'lore.metric.stability',
    'metric.loadPressure.basic': 'lore.metric.loadPressure',
    'metric-load-pressure': 'lore.metric.loadPressure',
    'link.basic': 'lore.link',
    'phenomena.cascade': 'lore.cascade'
});

// ============================================================================
// SESSION 105: LINK METRICS TO VISUAL BRIDGE (Real-time network metrics)
// ============================================================================
import { LinkMetricsToVisualBridge, setupLinkMetricsBridgeConsoleAPI } from './LinkMetricsToVisualBridge_v1.js';

// ============================================================================
// SESSION 106+: STRESS-BASED PARTICLE SCALER (Particle effects from link stress)
// ============================================================================
// import { StressBasedParticleScaler_v1, setupStressParticleScalerConsoleAPI } from './StressBasedParticleScaler_v1.js';  // LEGACY/april — disconnected 2026-04-22

// ============================================================================
// PARTICLE STREAM CASCADE ACCELERATION (Layer-depth based particle dynamics)
// Accelerates particles based on cascade layer depth, creating visual
// stratification that communicates network hierarchy through motion patterns
// ============================================================================
import { CascadingHarmonicResonanceAmplification } from './harmony/HarmonicHubCascade.js';
// REMOVED: ParticleStreamCascadeAcceleration, ParticleCascadeFlowDeflection,
//   ParticleStreamCascadeAccelerationIntegrationPatch, ParticleStreamCascadeAccelerationIntegrationSetup
//   — moved to LEGACY/april (2026-04-22)

// ============================================================================
// ============================================================================
// SESSION 120: SEMANTIC PARTICLE ENCODING (Shape & Velocity as Meaning)
// Encodes conflict type (shape) and propagation (velocity) into particles
// ============================================================================
import { setupCascadeParticleSystem } from './CascadeParticleSystem_Session120.js';
import { CascadeResonanceWaveVisualization_Session146 } from './CascadeResonanceWaveVisualization_Session146.js';
import { ResonanceCascadeVisualization_Session117B } from './ResonanceCascadeVisualization_Session117B.js';
import { createCascadeEventBridge } from './CascadeEventBridge_v1.js';

// ============================================================================
// SESSION 128: INFLUENCE ATTENUATION & ABSORPTION VISUALS
// Visualizes how harmonic influence weakens/absorbs at non-harmonic nodes
// ============================================================================
import { InfluenceAttenuationAbsorptionSystem_Session128 } from './InfluenceAttenuationAbsorptionSystem_Session128.js';

// ============================================================================
// SESSION 129: INFLUENCE REFLECTION & BACK-PRESSURE VISUALS
// Visualizes how resistant nodes reject influence through elastic reflection
// ============================================================================
import { InfluenceReflectionBackPressureSystem_Session129 } from './InfluenceReflectionBackPressureSystem_Session129.js';

// ============================================================================
// SESSION 130: STANDING WAVE & OSCILLATION TRAP VISUALS
// Visualizes energy trapped between opposing nodes, forming standing waves
// ============================================================================
import { StandingWaveOscillationTrapSystem_Session130 } from './StandingWaveOscillationTrapSystem_Session130.js';

// ============================================================================
// SESSION 131: STANDING WAVE VISUAL RENDERER
// Renders standing wave patterns, antinode glows, and trap zone visuals
// ============================================================================
import { StandingWaveVisualRenderer_Session131 } from './StandingWaveVisualRenderer_Session131.js';

// ============================================================================
// SESSION 146: NODE LINKED AURA RENDERER
// Noise-driven aura meshes that react to harmony/corruption state
// ============================================================================
import { NodeLinkedAuraRenderer_Session146 } from './LEGACY/aura/NodeLinkedAuraRenderer_Session146.js';

// ============================================================================
// PHASE 3C WEEK 10: LINK AURA SYSTEM
// GPU-driven cylindrical halo system around links
// ============================================================================

// ============================================================================
// SESSION 132: WAVE INTERFERENCE PATTERN SYSTEM
// Visualizes constructive/destructive interference from colliding reflections
// ============================================================================
import { WaveInterferencePatternSystem_Session132 } from './WaveInterferencePatternSystem_Session132.js';

// ============================================================================
// SESSION 133: RESONANCE RUPTURE VISUAL SYSTEM
// Visualizes standing wave collapse under extreme pressure
// ============================================================================
import { ResonanceRuptureVisualSystem_Session133 } from './ResonanceRuptureVisualSystem_Session133.js';

// ============================================================================
// MERGED: HARMONIC HEALING + RECOVERY VISUAL SYSTEM
// Replaces HarmonicHealingVisualSystem_Session134 + HarmonicRecoveryVisualSystem_Session138
// 100% event-driven via canonical scoped metric tier events.
// ============================================================================
import { HarmonicHealingRecoveryVisualSystem } from './harmony/HarmonicHealingRecoveryVisualSystem.js';

// ============================================================================
// SESSION 135: HARMONIC AUDIO REACTIVITY SYSTEM
// Transforms network state into living soundscape
// ============================================================================
import { HarmonicAudioReactivitySystem_Session135 } from './harmony/HarmonicAudioReactivitySystem_Session135.js';

// ============================================================================
// SESSION 136: HEALING PARTICLE SYSTEM
// Visual enhancement layer: Particle trails for healing waves and scar sparkles
// ============================================================================
import { HealingParticleSystem_Session136 } from './harmony/HealingParticleSystem_Session136.js';

// ============================================================================
// LINK TRAIL PARTICLE SYSTEM
// Organic particle trails that flow along links
// ============================================================================
import { LinkTrailParticleSystem, LinkTrailEmitter } from './LinkTrailParticleSystem.js';

// ============================================================================
// LINK SPARK SYSTEM
// GPU-driven spark particles for micro-friction and tension
// ============================================================================
import { LinkSparkSystem } from './LinkSparkSystem.js';

// ============================================================================
// NODE SEGMENTED ORBIT RINGS
// Segmented orbital ring visualization around nodes
// ============================================================================
import { NodeSegmentedOrbitRings } from './shaders/NodeSegmentedOrbitRings.js';

// ============================================================================
// REGIONAL EQUILIBRIUM FIELD SYSTEM
// Visualizes long-term power balance and territorial equilibrium shifts
// via subtle ambient volumetric fields for each network region
// ============================================================================
import { RegionalEquilibriumFieldSystem } from './RegionalEquilibriumFieldSystem.js';

// ============================================================================
// CASCADING RUPTURE & CRITICAL NODE FAILURE SYSTEMS (Session 139+)
// Hybrid visual + mechanical systems for network collapse propagation
// ============================================================================
import { CascadingRuptureSystem } from './CascadingRuptureSystem.js';
import { CriticalNodeFailureSystem } from './CriticalNodeFailureSystem.js';
import { setupCascadeSystemConsoleAPI } from './CascadeSystemConsoleAPI.js';

// ============================================================================
// LINK SEMANTIC PICTOGRAM SYSTEM — ENHANCED WITH FUSION (Session 139+)
// Multi-layer semantic visual language with morphing, depth, flow intelligence, and glyph fusion
// ============================================================================
// ============================================================================
// HARMONIC RESONANCE FEEDBACK SYSTEM (Session 140+)
// Composite glyphs emit subtle resonance fields influencing nearby link motion
// Closed visual feedback loop: meaning shapes motion
// ============================================================================
import { HarmonicResonanceFeedbackSystem, setupHarmonicResonanceConsoleAPI } from './harmony/HarmonicResonanceFeedbackSystem.js';

// ============================================================================
// RESONANCE ECHO TRAIL SYSTEM (Session 140+)
// Harmonic afterimages as temporal memory of composite glyph movement
// Stationary echo trails fade quietly, reinforcing continuity
// ============================================================================
import { ResonanceEchoTrailSystem, setupResonanceEchoConsoleAPI } from './ResonanceEchoTrailSystem.js';

// ============================================================================
// HARMONIC TOPOLOGY LEARNING SYSTEM (Session 140+)
// Visualizes long-term network learning through topology evolution
// Shows how repeated resonance, rupture, and fusion reshape flow patterns
// ============================================================================
import { HarmonicTopologyLearningSystem, setupHarmonicTopologyConsoleAPI } from './harmony/HarmonicTopologyLearningSystem.js';

// ============================================================================
// TOPOLOGY BIAS VISUALIZATION LAYER (Session 140+)
// Renders topology bias vectors and flow fields as dedicated visual layer
// Makes learned space perception visible through subtle directional hints
// ============================================================================
import { TopologyBiasVisualizationLayer, setupTopologyBiasVisualizationConsoleAPI } from './TopologyBiasVisualizationLayer.js';

// ============================================================================
// PROCEDURAL HARMONIC GLYPH GENERATOR (Session 140+ Polish)
// Generates emergent visual language from topology learning history
// Creates unique procedural glyphs representing learned network identity
// ============================================================================
import { ProceduralHarmonicGlyphGenerator, setupProceduralGlyphConsoleAPI } from './ProceduralHarmonicGlyphGenerator.js';

// ============================================================================
// REGIONAL HARMONIC CYCLE CONTROLLER (Session 140+ Polish - Animation)
// Manages harmonic activity cycles for regions
// Drives subtle glyph animation through cycle-based modulation
// ============================================================================
import { RegionalHarmonicCycleController, setupRegionalHarmonicCycleConsoleAPI } from './RegionalHarmonicCycleController.js';

// ============================================================================
// GLYPH ANIMATION MODULATOR (Session 140+ Polish - Animation)
// Applies harmonic cycle animations to procedural glyphs
// Makes glyphs breathe with regional harmonic activity
// ============================================================================
import { GlyphAnimationModulator, setupGlyphAnimationConsoleAPI } from './GlyphAnimationModulator.js';

// ============================================================================
// COMPOSITE GLYPH RESONANCE FEEDBACK (Session 140+ Visual-Only Feedback)
// Makes composite glyph resonance perceptible through subtle spatial & temporal cues
// Visual-only adapter: no gameplay logic, no new signals, pure perception
// ============================================================================
import { CompositeGlyphResonanceFeedback } from './CompositeGlyphResonanceFeedback.js';

// ============================================================================
// SYNAPTIC CONFLICT ADAPTIVE RESOLUTION (Session 117)
// Visual adapter for competing harmonic hubs and phase interference
// ============================================================================
import { setupSynapticConflictSystem } from './SynapticConflictAdaptiveResolution_Session117.js';

// ============================================================================
// SESSION 108+: LINK MICRO-IMPULSES (Event-Driven Electrical Nervous Responses)
// ============================================================================
import { setupLinkMicroImpulseIntegration } from './LinkMicroImpulseIntegrationSetup.js';

// ============================================================================
// SESSION 108+ EXTENDED: PULSE INTERSECTION IMPULSES (Neural Firing on Wave Contact)
// ============================================================================
import { setupPulseIntersectionIntegration } from './PulseIntersectionIntegrationSetup.js';
import { setupPulseWaveSystemBridgeIntegration } from './PulseWaveSystemBridge_v1.js';
import { setupPulseBoundaryInteractionIntegration } from './PulseBoundaryInteractionAdapter_v1.js';
import { setupSynapticGatingIntegration } from './SynapticGatingAdapter_v1.js';
import { setupSynapticFatigueIntegration } from './SynapticFatigueAdapter_v1.js';
import { NetworkFatigueSystem, setupNetworkFatigueConsoleAPI } from './NetworkFatigueSystem_v0.js';
import { setupSynapticSpecializationIntegration } from './SynapticSpecializationAdapter_v1.js';
import { setupInterdimensionalConflictIntegration } from './InterdimensionalConflictIntegration.js';

// ============================================================================
// SESSION 113+: COMPETITION & DOMINANCE VISUALIZATION (Territorial Politics)
// Specialized nodes compete for regional influence — pure visual storytelling
// Dominant nodes impose rhythm; contested zones shimmer with tension
// ============================================================================
import { CompetitionDominanceAdapter_v1, setupCompetitionDominanceIntegration } from './CompetitionDominanceAdapter_v1.js';

// ============================================================================
// SESSION 99: EMERGENCY VISUAL STABILIZATION HOTFIX (Critical Opaque Enforcement)
// ============================================================================
// REMOVED: setupEmergencyVisualStabilization from './HOTFIX_EmergencyVisualStabilization_v1.js'
// Legacy spawner consolidation moved to LEGACY folder (2026-03-03)
// Legacy rare node spawner moved to LEGACY folder (2026-03-03)
// REMOVED: NodeVisualFreezeBlockers_v1 - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)
import { NodeLinkedAuraSystem } from './NodeLinkedAuraSystem.js';
// REMOVED: LinkEligibilityGate_v1.js - moved to LEGACY/GRAVEYARD (2026-04-05)
// REMOVED: setupLinkDebugMode - moved to LEGACY (2026-04-03)

// ============================================================================
// HIT PROXY SYSTEM & RAYCAST ISOLATION (Session 61+)
// ============================================================================
import { applyHitProxyIntegration, setupHitProxyDebugAPI } from './_HitProxyIntegrationPatch.js';
import { setupHitProxyAutoRegistrar } from './HitProxyAutoRegistrar.js';
import { setupGpuSanity } from './Engine/Debug/GpuSanityPass.js';

// ============================================================================
// PHASE 8: NETWORK RITUAL VISUAL ORCHESTRATION (Visual Ceremony Layer)
// Pure read-only visual consumption of ritual events — no gameplay logic
// ============================================================================
import { Phase8RitualVisualOrchestration, RITUAL_VISUAL_CONFIG } from './Phase8RitualVisualOrchestration.js';
import { Phase8VisualBridge } from './Phase8VisualBridge.js';
import { NetworkRituals } from './NetworkRituals_v1.js';
import { LinkAuraSystem_v1 } from './LEGACY/aura/LinkAuraSystem_v1.js';

// ============================================================================
// SYNERGY VISUAL EFFECTS — Pure world-space visual feedback
// Non-intrusive breathing pulse + visual time elasticity on extreme synergy
// ============================================================================
// REMOVED: SynergyPulseVisuals_v1 — moved to LEGACY/april (2026-04-22)
import { VisualNetworkTimeElasticity_v1, validateVisualNetworkTimeElasticity } from './VisualNetworkTimeElasticity_v1.js';
import { HarmonicResonanceCoupling_v1 } from './harmony/HarmonicResonanceCoupling_v1.js';
import { HarmonicHubAuraSystem_Session126 } from './harmony/HarmonicHubAuraSystem_Session126.js';
// REMOVED: HarmonicInfluencePropagationSystem_Session127 — moved to LEGACY (2026-05-14)
import { LinkResonanceFlowSystem_Session124 } from './LinkResonanceFlowSystem_Session124.js';
import { applyLinkResonanceFlowHarmonyIntegration } from './LinkResonanceFlowIntegrationPatch_Session124.js';
import { applyEchoRippleIntegration } from './EchoRippleIntegrationPatch_Session125.js';
// REMOVED: CorruptionDesaturationIntegrationPatch — moved to LEGACY/april (2026-04-22)
import { HarmonicCascadeAmplification_Session145, setupCascadeConsoleAPI } from './harmony/HarmonicCascadeAmplification_Session145.js';
import { CascadeBurstVisual_Session147 } from './CascadeBurstVisual_Session147.js';
import { HarmonicPhaseSynchronization_Session146, setupPhaseSyncConsoleAPI } from './harmony/HarmonicHubCascade.js';
// REMOVED: PreCascadeVisualHint_Session146 — moved to LEGACY/april (2026-04-22)
// REMOVED: HarmonicNodeResonanceHalos — moved to LEGACY (2026-05-14)
import { HarmonicHubDebugger } from './Engine/Debug/HarmonicHubDebugger.js';
import { VisualEchoTrails_v1, VisualEchoTrails_v1_Integration, setupVisualEchoTrailsIntegration } from './VisualEchoTrails_v1_Integration.js';

// ============================================================================
// TIER 1 INTEGRATION: CORRUPTION & HARMONY SYSTEMS (Phase A)
// Core active mechanics: corruption propagation + harmony stabilization
// ============================================================================
import { LinkCorruptionTransmission_v1 } from './LinkCorruptionTransmission_v1.js';
import { HarmonyStabilizationSystem_v1 } from './harmony/HarmonyStabilization.js';
import { applyHarmonyStabilizationIntegration } from './harmony/HarmonyStabilization.js';
// REMOVED: _T4003_CORRUPTION_CASCADE_TEST_RUNNER - moved to LEGACY (2026-04-08)
// REMOVED: T4004_HARMONY_HEALING_TEST_RUNNER - moved to DELETE/cleanup (2026-04-18)

// ============================================================================
// TIER 2 VISUAL INTEGRATION — Visual System Wiring
// ============================================================================
// ✅ T2-001: Extreme Node Visuals (via _NodeVisuals4_0.js modifications)
// ✅ T2-002: Corruption Visual FX Integration
// ✅ T2-003: Harmony Visual Feedback Consumer
// ============================================================================
import { T2_CorruptionVisualIntegration_v1 } from './T2_CorruptionVisualIntegration_v1.js';
import { T2_HarmonyVisualConsumer_v1 } from './T2_HarmonyVisualConsumer_v1.js';
import { getGlobalWiringSystem } from './VisualAutoWiringSystem.js';

// ============================================================================
// TIER 4 GAMEPLAY INTEGRATION — Gameplay Layer
// ============================================================================
// ✅ T4-001: Core Gameplay Logic (link actions → mechanics)
// ✅ T4-002: Corruption Feedback Visuals (particle effects + indicators)
// ✅ T4-003: Gameplay Feedback UI (notifications + meters)
// ============================================================================
import { TIER4_GameplayIntegrationBridge } from './TIER4_GameplayIntegrationBridge_v1.js';
import { TIER4_GameplayFeedbackUI } from './TIER4_GameplayFeedbackUI_v1.js';

// ============================================================================
// PHASE 5: MULTI-NETWORK SYNCHRONIZATION — Inter-Network Dynamics
// ============================================================================
// ✅ P5-001: Multi-Network Manager (orchestrate multiple networks)
// ✅ P5-002: Corruption Bridge (spread corruption between networks)
// ✅ P5-003: Network Synchronization (keep networks in sync)
// ✅ P5-004: Inter-Network Connection Visuals (visual network flow)
// ✅ P5-005: Cascade Propagation Visuals (expanding rings on cascades)
// ============================================================================
// CONSOLIDATED: PHASE5_MultiNetworkOrchestrator now imported from PHASE5_MultiNetworkCore.js (line 70)
// CONSOLIDATED: All cascade visuals now imported from PHASE5_CascadeVisuals.js
import { 
  PHASE5_CascadePropagationVisuals,
  PHASE5_CascadeVisualizationBridge,
  PHASE5_InterNetworkVisualizationBridge
} from './PHASE5_CascadeVisuals.js';

const VISUAL_SYSTEMS_ENABLED = true;

// ============================================================================
// DEFENSIVE HARDENING PATCH v1.0 (Session 24)
// Stabilizes runtime: iterable safety + post-link visual dominance correction
// ============================================================================
// [SESSION 56] DISABLED: correctPostLinkLayering - violated base visual state immutability
import { applyAllDefensivePatches } from './DefensiveHardeningPatch_v1.js';
// import { correctPostLinkLayering } from './DefensiveHardeningPatch_v1.js';  // DISABLED

// ============================================================================
// NODE CORE MATERIAL AUTHORITY SYSTEM v1.0 (Session 26)
// Ensures node core holographic materials can NEVER be overridden by auras
// Material-driven solution (NOT depth-buffer hacks)
// REMOVED: NodeCoreMaterialAuthority - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)
// ============================================================================

// ============================================================================
// EVENT VISUAL SUPPRESSION SYSTEM v1.0 (Session 26)
// Prevents event effects from diluting or occluding node cores
// Redirects event intensity to aura system instead
// ============================================================================
import { EventVisualSuppression_v1, setupEventSuppressionConsoleAPI } from './EventVisualSuppression_v1.js';

// ============================================================================
// AURA MODULATION SYSTEM v1.0 (Session 27)
// Receives redirected event intensity and modulates aura visually
// ============================================================================

// ============================================================================
// GLOBAL AURA OPACITY CLAMP v1.0 (Session 28)
// Clamps all aura opacity to ≤ 0.10 after linking
// ============================================================================
//import { GlobalAuraOpacityClamp, setupGlobalAuraOpacityClampConsoleAPI } from './GlobalAuraOpacityClamp.js';
//import { integrateGlobalAuraOpacityClamp, setupGlobalAuraOpacityClampIntegrationConsoleAPI } from './GlobalAuraOpacityClamp_Integration.js';

// ============================================================================
// DYNAMIC LINK COLOR SYSTEM v1.0 (NEW)
// Real-time synergy-driven link color transitions
// ============================================================================
// import { DynamicLinkColorSystem, setupDynamicLinkColorSystemConsoleAPI } from './DynamicLinkColorSystem.js';  // LEGACY/april — disconnected 2026-04-22

// ============================================================================
// SYNERGY CASCADE PROPAGATION VISUALIZER v1.0 (NEW)
// Real-time visualization of synergy energy flowing through linked networks
// ============================================================================
import { SynergyCascadeVisualizer } from './SynergyCascadeVisualizer.js';
import { CascadeWaveParticles } from './CascadeWaveParticles.js';

// ============================================================================
// CORE MATERIAL MUTATION DETECTOR v1.0 (Session 28)
// Automated detection and repair of core material mutations
// ============================================================================
import { CoreMaterialMutationDetector, setupCoreMutationDetectorConsoleAPI } from './Engine/Debug/CoreMaterialMutationDetector.js';

// ============================================================================
// CORE MATERIAL PROPERTY LOCK v1.0 (Session 30 - Hard Enforcement)
// Enforces immutability of core material properties at runtime
// Prevents opacity/transparent/depthWrite/emissive degradation
// ============================================================================
// REMOVED: CoreMaterialPropertyLock - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)

// ============================================================================
// NODE HIERARCHY SYSTEM v1.0 — Parent-Child Node Relationships
// Enables organizational hierarchies, property cascading, metrics aggregation
// ============================================================================
// REMOVED: NodeHierarchyBridge - moved to LEGACY (2026-04-03)



// ============================================================================
// NODE SURFACE PROTECTION RULE — DEPTH ANCHOR SYSTEM (DISABLED - Session 26)
// Replaced by NodeCoreMaterialAuthority (material-driven approach)
// ============================================================================
// import { setupNodeSurfaceProtection } from './NodeSurfaceProtection_DepthAnchor.js';

// ============================================================================
// SESSION 21: VISUAL HIERARCHY REGISTRY v1.0
// Single authoritative source for renderOrder values across visual layers
// ============================================================================
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// ============================================================================
// SESSION 20: VISUAL HIERARCHY CORRECTION SYSTEM v1.0
// Ensures core node geometry is always dominant and never occluded
// ============================================================================
import { VisualHierarchyCorrectionSystem_v1 } from './_VisualHierarchyCorrectionSystem_v1.js';

// ============================================================================
// NODE SURFACE PROTECTION RULE v2.0 (Session 24 Enhanced)
// Ensures node cores are never obscured by auras through dynamic opacity attenuation
// ============================================================================
// DISABLED: 503 server error on file load - will recreate from inline
// import { NodeSurfaceProtectionRule_v2 } from './NodeSurfaceProtectionRule_v2.js';

// REMOVED: PersonalityShaderBridge_v1 - moved to LEGACY/ (2026-05-14) - personalityVisual never written, dead shell
// import { PersonalityShaderBridge_v1 } from './LEGACY/PersonalityShaderBridge_v1.js';

// REMOVED: PersonalityShaderEffects_Pack_v1 - moved to LEGACY/ (2026-05-14) - was enabled=false dormant-unwired
// import { PersonalityShaderEffects_Pack_v1 } from './LEGACY/PersonalityShaderEffects_Pack_v1.js';

// ============================================================================
// PHASE 3C PERFORMANCE MODE (Centralized FX scaling controller)
// ============================================================================
import { FXPerformanceController_v1 } from './FXPerformanceController_v1.js';
// import { FXPerformanceScaler_v1 } from './FXPerformanceScaler_v1.js';  // LEGACY/april — disconnected 2026-04-22

// ============================================================================
// PHASE 3C ADAPTIVE PERFORMANCE MONITOR (FPS-based automatic LowFX toggle)
// ============================================================================
import { AdaptivePerformanceMonitor_v1 } from './AdaptivePerformanceMonitor_v1.js';

// ============================================================================
// PHASE 3C SMOOTH TRANSITION LAYER (Week 4.5 - Visual Polish)
// ============================================================================
import { FXPerformanceSmoothTransition_v1 } from './FXPerformanceSmoothTransition_v1.js';

// REMOVED: PersonalityShaderAdvancedFX_v1 - moved to LEGACY/ (2026-05-14) - personalityVisual never written
// import { PersonalityShaderAdvancedFX_v1 } from './LEGACY/PersonalityShaderAdvancedFX_v1.js';


// ============================================================================
// PHASE 3C ARCHETYPE SHADER MODES (Week 16 - GPU Shader Mode Orchestration)
// ============================================================================
import { ArchetypeShaderModes_v1 } from './ArchetypeShaderModes_v1.js';

// ============================================================================
// WEEK 18: NODE SELECTION SHADER ACTIVATION (Selection-Driven Intensity Boost)
// ============================================================================
import { NodeShaderActivation_v1 } from './NodeShaderActivation_v1.js';

// ============================================================================
// WEEK 18 (ALT): LINK PERSONALITY STATE MACHINE (Dynamic Link Personalities)
// ============================================================================
import { LinkPersonalityStateMachine_v1 } from './LinkPersonalityStateMachine_v1.js';

// REMOVED: SynergyBonusVisualization_v1 — moved to LEGACY/april (2026-04-22)

// ============================================================================
// WEEK 19 (ALT): SYNERGY BONUS FX LAYER (GPU-Based Synergy Flares)
// ============================================================================
import { SynergyBonusFXLayer_v1 } from './SynergyBonusFXLayer_v1.js';

// ============================================================================
// WEEK 20: SYNERGY RESONANCE SHADER PACK (Multi-Frequency Resonance FX)
// ============================================================================
import { SynergyResonanceShaderPack_v1 } from './SynergyResonanceShaderPack_v1.js';

// ============================================================================
// WEEK 21: AI NETWORK RESONANCE FEEDBACK (Network-Level Feedback System)
// ============================================================================
import { ResonanceFeedback_v1 } from './ResonanceFeedback_v1.js';

// ============================================================================
// WEEK 22: SYNERGY CHAIN REACTIONS (Emergent Cascade Events)
// ============================================================================
import { SynergyChainReaction_v1 } from './SynergyChainReaction_v1.js';

// REMOVED: SynergyCascadeFXBridge_v1 — moved to LEGACY/april (2026-04-22)

// ============================================================================
// WEEK 25 (BONUS): WAVE INTERFERENCE ENGINE (Multi-Origin Wave System)
// ============================================================================
import { WaveInterferenceEngine_v1 } from './WaveInterferenceEngine_v1.js';
import { CascadeToWaveBridge_v1 } from './CascadeToWaveBridge_v1.js';

// ============================================================================
// WEEK 25 (BONUS): WAVE SHADER BRIDGE (GPU Uniform Injection)
// ============================================================================
import { WaveShaderBridge_v1 } from './WaveShaderBridge_v1.js';

// ============================================================================
// WEEK 25 (BONUS): WAVE SHADER MATERIAL PATCH (GPU Shader Patching)
// ============================================================================
import { WaveShaderMaterialPatch_v1 } from './WaveShaderMaterialPatch_v1.js';

// ============================================================================
// WEEK 25 (BONUS): WAVE TRAVEL SHADER PACK (GPU Motion Effects)
// ============================================================================
import { WaveTravelShaderPack_v1 } from './WaveTravelShaderPack_v1.js';

// ============================================================================
// WEEK 25 (BONUS): WAVE DYNAMICS SHADER PACK (Advanced FX Layers)
// ============================================================================
import { WaveDynamicsShaderPack_v1 } from './WaveDynamicsShaderPack_v1.js';
import { SynergyTravelingWaveFX_v1 } from './SynergyTravelingWaveFX_v1.js';
import { SynergyHighwayVisuals3D_1_0 } from './SynergyHighwayVisuals3D_1_0.js';

// ============================================================================
// DEBUG: HARMONY OVERLAY (visual readability, gated)
// ============================================================================
import { HarmonyDebugOverlay } from './Engine/Debug/HarmonyDebugOverlay.js';

// ============================================================================
// WEEK 27: WAVE PARTICLE EMITTER (GPU-Reactive Particle FX)
// ============================================================================
import { WaveParticleEmitter_v1 } from './WaveParticleEmitter_v1.js';

// ============================================================================
// EXTRACTION PACK V1.0 — RUNTIME ORCHESTRATION
// ============================================================================
import { MetricsRuntime_v1 } from './MetricsRuntime_v1.js';
// REMOVED: PersonalityRuntime_v1 — moved to LEGACY/april (2026-04-22)
import { MetricInterpretationLayer_v1, setupMetricInterpretationConsoleAPI } from './MetricInterpretationLayer_v1.js';
// Release-disabled: StressVisualShaderSystem bootstrap is intentionally offline.
// Release-disabled: CanonicalTemplate3_StressVisuals moved to LEGACY and replaced by SafeWorldFXPack atmosphere layers.

// ============================================================================
// EXTRACTION PACK V1.1 — RUNTIME ORCHESTRATION (WORLD & FX)
// ============================================================================
import { WorldRuntime_v1 } from './WorldRuntime_v1.js';
// import { FXRuntime_v1 } from './FXRuntime_v1.js';

function createWaveDynamicsPack() {
    return new WaveDynamicsShaderPack_v1({
        enableDebug: false,
        enableWarnings: true
    });
}

// ============================================================================
// EXTRACTION PACK V1.2 — RUNTIME ORCHESTRATION (NODE EDITOR & UI)
// ============================================================================
import { NodeEditorRuntime_v1 } from './NodeEditorRuntime_v1.js';

// ============================================================================
// EXTRACTION PACK V1.3 — RUNTIME ORCHESTRATION (INPUT HANDLING)
// ============================================================================
import { InputRuntime_v1 } from './InputRuntime_v1.js';

// ============================================================================
// HUD COLLAPSE SYSTEM 1.0 (Lightweight collapsible HUD management)
// ============================================================================
import { initializeHudCollapseSystem, verifyHudCollapseSystem } from './HUD/HudCollapseSystem1_0.js';

// ============================================================================
// INTEGRATION NODE SELECTION FIX (Targeted Compatibility)
// Enable selection of INTEGRATION nodes via parent chain resolution
// ============================================================================
import { patchIntegrationNodeSelection, setupIntegrationDebugAPI } from './_IntegrationNodeSelectionFix.js';

// ============================================================================
// SYNERGY ANALYSIS & SCORING SYSTEM (Session 19 Extended)
// ============================================================================
import { computeSynergyScore } from './ComputeSynergyScore2_0.js';
import { LinkRecommendationAI1_0 } from './LinkRecommendationAI1_0.js';
import { LinkMLRecommendationEngine1_0 } from './LinkMLRecommendationEngine1_0.js';
import { PriorityHistoryEngine1_0 } from './PriorityHistoryEngine1_0.js';
import { LinkPriorityDecayEngine } from './LinkPriorityDecayEngine.js';
import { LinkAutomationEngine1_0 } from './LinkAutomationEngine1_0.js';
import LinkAutomationMonitor3_0 from './LinkAutomationMonitor3_0.js';

// ============================================================================
// AUTO LINK VISUALIZATION FEEDBACK UI 1.0 (Session 19 Extended)
// ============================================================================
import { AutoLinkFeedbackUI1_0 } from './HUD/AutoLinkFeedbackUI1_0.js';

// ============================================================================
// LINK QUALITY PREDICTOR 1.0 (Session 19 Extended)
// ============================================================================
import { LinkQualityPredictor1_0 } from './LinkQualityPredictor1_0.js';

// ============================================================================
// HUD SYNCHRONIZATION PATCH 1.0 (Session 27 Continuation)
// ============================================================================
import { SelectedHUDSyncPatch1_0 } from './HUD/SelectedHUDSyncPatch1_0.js';

// ============================================================================
// LINK PRIORITY DECAY ENGINE 1.0 (Session 27 Extended)
// ============================================================================
import { UserAcceptanceTracker1_0 } from './UserAcceptanceTracker1_0.js';
// REMOVED: LinkQualityFeedbackLoop1_0.js - moved to LEGACY/GRAVEYARD (2026-04-05)

// ============================================================================
// SYNERGY RECOMMENDATION DEBUG HUD 1.0 (Session 19 Extended)
// ============================================================================
import { SynergyRecommendationDebugHUD } from './HUD/SynergyRecommendationDebugHUD.js';

// ============================================================================
// ATOMA UI 3.1 - DISABLED (Replaced by 3.4–3.7)
// ============================================================================
// REMOVED: UINodeAutoDetect3_1, NodeLinking2_0, UINodeHoverTooltip3_1
import { UICategoryLegend3_1 } from './_UICategoryLegend3_1.js';
import { AIEmotionalFeed3_1 } from './_AIEmotionalFeed3_1.js';

// ============================================================================
// ATOMA UI 3.2 - Interaction Polishing & Selected Node System
// ============================================================================
// REMOVED: UINodeInspectPanel - moved to LEGACY (2026-04-03)
// import { UINodeInspectPanel } from './UINodeInspectPanel.js';


// ============================================================================
// ATOMA UI 3.3 - Selected Node Identity + Safe Unlinking System
// ============================================================================
// REMOVED: UISelectedNodeLabel3_3 - moved to LEGACY (2026-04-03)
// import { UISelectedNodeLabel3_3 } from './_UISelectedNodeLabel3_3.js';
// REMOVED: SafeNodeUnlinking3_3 - moved to LEGACY (2026-04-03)
// import { SafeNodeUnlinking3_3 } from './_SafeNodeUnlinking3_3.js';

// ============================================================================
// ATOMA UI 3.4–3.7 - ACTIVE SYSTEMS (Core Selection + Primary Node Linking)
// ============================================================================
import { NodeSelectionCore3_4 } from './_NodeSelectionCore3_4.js';
import { getSelectedHUD } from './HUD/UISelectedHUD.js';
// REMOVED: UIPrimaryNodeTopBar3_7 - disabled and moved to LEGACY
// REMOVED: NodeLinking2_0, NodeLinking2_1, NodeLinking2_2 (superseded by 2.3)

// ============================================================================
// ATOMA DEBUG HUD 1.0 (Session 28 - In-Game Debug Monitoring)
// ============================================================================
import { AtomaDebugHUD_1_0 } from './Engine/Debug/AtomaDebugHUD_1_0.js';

/**
 * ATOMA - AI Dream Realm Simulation
 * A minimal, futuristic exploration experience
 * 
 * + Node Inspect Overlay 1.0 (SAFE Edition)
 * Pure HUD overlay for inspecting node archetypes and metrics
 * 
 * + Camera Steady Fix 1.0
 * Ensures camera remains perfectly stable (zero jitter)
 * 
 * + Safe Metrics FX 1.1
 * Subtle visual effects based on node metrics (15Hz throttled)
 * 
 * + Node Personality System 2.0 - SAFE ALL IN
 * Complete personality system with 10 types, safe visual behaviors
 * 
 * + Node Micro-Events 1.0 - SAFE EDITION
 * Personality-driven spontaneous events with event logs
 * 
 * + World Personality Controller 2.0 - SAFE EDITION
 * World reacts to global network mood (7 mood types)
 * 
 * + Mythic Ritual Controller 1.0 - SAFE EDITION
 * Rare ceremonial events (6 ritual types)
 * 
 * + Mythic Ritual Player 2.0 - PLAYER PARTICIPATION
 * Optional player interactions during rituals
 * 
 * + Mythic Node Creation - SAFE ALL-IN EDITION
 * Cinematic ritual to birth new mythic nodes
 */

/**
 * Phase E — Semantic Scheduling
 * Lightweight event bus for meaning-driven triggers.
 *
 * Canonical semantic naming:
 * - Format: `category.eventName` for general events and `scope.metric.tier` for metric tiers
 *   (e.g. `node.spawned`, `node.harmony.high`, `global.loadPressure.high`)
 * - Categories:
  *   - `network:*` high-level network state transitions
  *   - `node:*` node lifecycle/selection/evolution transitions
  *   - `link:*` link lifecycle and semantic threshold transitions
 *   - `metric:*` legacy metric-derived compatibility signals
 * Alias bridge:
 * - legacy threshold / behavior tags are resolved to the canonical scoped tier surface
 * - keep new consumer wiring on `scope.metric.tier`, not on `metric:*`
 *
 * Subscription guidance:
 * - Producers emit only on threshold crossing, meaningful delta, or state change.
 * - Consumers subscribe through `subscribe()` or alias `on()`.
 * - Keep payloads compact and immutable-at-callsite.
 */
const SCOPED_METRIC_EVENT_SCOPES = new Set(['node', 'link', 'global', 'hub']);
const SCOPED_METRIC_EVENT_NAMES = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure'];
const SCOPED_METRIC_TIER_POLICY = Object.freeze({
    cooldownMs: 0,
    aggregateWithinMs: 0,
    aggregationStrategy: 'latest'
});

function buildScopedMetricEventName(scope, metric, tier) {
    const scopeName = String(scope || '').trim().toLowerCase();
    return `${scopeName}.${metric}.${tier}`;
}

function isScopedMetricTierTag(tag) {
    if (typeof tag !== 'string') return false;
    const parts = tag.split('.');
    if (parts.length !== 3) return false;
    const [scope, metric, tier] = parts;
    return SCOPED_METRIC_EVENT_SCOPES.has(scope)
        && SCOPED_METRIC_EVENT_NAMES.includes(metric)
        && (tier === 'low' || tier === 'mid' || tier === 'high');
}

function getMetricContractTagNature(tag) {
    if (tag === 'metric.tier.changed') return 'internal';
    if (tag === 'metric.phase.changed') return 'legacy';
    return null;
}

function isMetricEventValidationEnabled() {
    if (typeof window === 'undefined') return false;
    return Boolean(
        window.ATOMA_FLAGS?.debug?.enabled ||
        window.ATOMA_DEBUG === true ||
        window.ATOMA_DEBUG_POLICY === true
    );
}

function resolveMetricAliasScope(payload, fallbackScope = 'node') {
    const explicitScope = String(payload?.scope || '').trim().toLowerCase();
    if (SCOPED_METRIC_EVENT_SCOPES.has(explicitScope)) {
        return explicitScope;
    }

    const source = String(payload?.source || '').toLowerCase();
    if (source.includes('metricsruntime')) return 'global';
    if (source.includes('linkqualitycalculator')) return 'link';
    if (source.includes('harmonichubaurasystem')) return 'hub';
    if (source.includes('nodemetricengine') || source.includes('linkcorruptiontransmission')) return 'node';

    if (payload?.hubId) return 'hub';
    if (payload?.linkId) return 'link';
    if (payload?.nodeId) return 'node';
    if (Number.isFinite(payload?.nodeCount) || Number.isFinite(payload?.linkCount)) return 'global';

    return fallbackScope;
}

class SemanticEventBus {
    constructor() {
        this.handlers = new Map();
        this.prefixListeners = [];
        this.linkCreatedFanout = {
            edgeBound: false,
            edgeHandler: null,
            edgeUnsubscribe: null,
            idSeq: 0,
            consumers: [new Map(), new Map(), new Map(), new Map()]
        };
        this.stormGovernanceTags = new Set(['cascade.start', 'cascade.hop', 'node.selection']);
        this.eventAliasRegistry = new Map();
        this.metricAliasCatalog = {
            tier: [],
            behavior: [],
            drop: []
        };
        this.priority = {
            CRITICAL: 0,
            INTERACTIVE: 1,
            NORMAL: 2,
            BACKGROUND: 3
        };
        this.eventCounters = {
            nodeSelect: 0,
            nodeDeselect: 0,
            linkCreated: 0,
            linkDestroyed: 0,
            synergyHigh: 0,
            synergyFade: 0
        };
        this.lastAuditLogTime = 0;
        this.auditIntervalMs = 5000;
        this.eventQueues = [
            { items: [], head: 0 },
            { items: [], head: 0 },
            { items: [], head: 0 },
            { items: [], head: 0 }
        ];
        this.taskQueues = [
            { items: [], head: 0 },
            { items: [], head: 0 },
            { items: [], head: 0 },
            { items: [], head: 0 }
        ];
        this.stats = {
            eventsProcessed: [0, 0, 0, 0],
            tasksProcessed: [0, 0, 0, 0],
            lastDrainMsEvents: 0,
            lastDrainMsTasks: 0,
            cooledEvents: 0,
            droppedEvents: 0,
            decayedEvents: 0,
            aggregatedEvents: 0,
            escalatedEvents: 0,
            suppressedEvents: 0,
            budgetDeferredEvents: 0,
            budgetOverflows: 0,
            budgetUsed: 0,
            budgetMax: 0,
            starvedEventsRecovered: 0,
            starvationSkips: 0,
            fairnessBoostsApplied: 0
        };
        // Phase E.2: semantic decay / cooldown defaults
        // Phase E.3: semantic aggregation defaults
        // Phase E.4: semantic escalation / suppression defaults
        this.eventPolicies = new Map([
            ['metrics.spike', { decayStages: [{ afterMs: 500, priority: this.priority.INTERACTIVE }, { afterMs: 1500, priority: this.priority.NORMAL }], expiresMs: 2200, cooldownMs: 120, aggregateWithinMs: 500, aggregationStrategy: 'latest', escalate: { threshold: 2, toPriority: this.priority.CRITICAL, windowMs: 800, maxLevel: 1 }, suppress: { ifOverload: true, maxQueueDepth: 120, dropRateThreshold: 0.25 } }],
            ['node.selection', {
                decayStages: [{ afterMs: 240, priority: this.priority.INTERACTIVE }, { afterMs: 1000, priority: this.priority.NORMAL }],
                expiresMs: 1800,
                cooldownMs: 110,
                aggregateWithinMs: 120,
                aggregationStrategy: 'latest',
                escalate: { threshold: 3, toPriority: this.priority.CRITICAL, windowMs: 800, maxLevel: 1 },
                suppress: { ifOverload: true, maxQueueDepth: 120, dropRateThreshold: 0.2 }
            }],
            ['hud.visibility.change', { decayStages: [{ afterMs: 500, priority: this.priority.NORMAL }], expiresMs: 1500, cooldownMs: 250, aggregateWithinMs: 300, aggregationStrategy: 'latest', escalate: { threshold: 2, toPriority: this.priority.INTERACTIVE, windowMs: 700, maxLevel: 1 }, suppress: { ifOverload: true, maxQueueDepth: 120 } }],
            ['camera.motion', { decayStages: [{ afterMs: 700, priority: this.priority.NORMAL }], expiresMs: 1800, cooldownMs: 120, aggregateWithinMs: 300, aggregationStrategy: 'sum', escalate: { threshold: 4, toPriority: this.priority.INTERACTIVE, windowMs: 600, maxLevel: 1 }, suppress: { ifOverload: true, maxQueueDepth: 160 } }],
            ['link.created', { decayStages: [{ afterMs: 500, priority: this.priority.NORMAL }], expiresMs: 1500, cooldownMs: 100, aggregateWithinMs: 100, aggregationStrategy: 'latest' }],
            ['cascade.start', {
                decayStages: [{ afterMs: 400, priority: this.priority.NORMAL }],
                expiresMs: 1400,
                cooldownMs: 80,
                aggregateWithinMs: 100,
                aggregationStrategy: 'latest',
                suppress: { ifOverload: true, maxQueueDepth: 140, dropRateThreshold: 0.25 }
            }],
            ['cascade.hop', {
                decayStages: [{ afterMs: 360, priority: this.priority.NORMAL }],
                expiresMs: 1200,
                cooldownMs: 70,
                aggregateWithinMs: 90,
                aggregationStrategy: 'latest',
                suppress: { ifOverload: true, maxQueueDepth: 140, dropRateThreshold: 0.25 }
            }],
            ['cascade.end', { decayStages: [{ afterMs: 500, priority: this.priority.NORMAL }], expiresMs: 1500, cooldownMs: 100, aggregateWithinMs: 100, aggregationStrategy: 'latest' }],
            ['network.link.destroyed', { decayStages: [{ afterMs: 500, priority: this.priority.NORMAL }], expiresMs: 1500, cooldownMs: 100, aggregateWithinMs: 100, aggregationStrategy: 'latest' }],
            ['node.spawned', { decayStages: [{ afterMs: 700, priority: this.priority.NORMAL }], expiresMs: 2000, cooldownMs: 150, aggregateWithinMs: 150, aggregationStrategy: 'latest' }],
            ['network.node.destroyed', { decayStages: [{ afterMs: 700, priority: this.priority.NORMAL }], expiresMs: 2000, cooldownMs: 150, aggregateWithinMs: 150, aggregationStrategy: 'latest' }],
            ['semantic.state.changed', { decayStages: [{ afterMs: 300, priority: this.priority.BACKGROUND }], expiresMs: 1000, cooldownMs: 200, aggregateWithinMs: 200, aggregationStrategy: 'latest', escalate: { threshold: 3, toPriority: this.priority.INTERACTIVE, windowMs: 1000, maxLevel: 1 } }],
            ['semantic.cluster.sync', { decayStages: [{ afterMs: 1500, priority: this.priority.NORMAL }], expiresMs: 3000, cooldownMs: 300, aggregateWithinMs: 500, aggregationStrategy: 'latest' }],
            ['semantic.cluster.formation', { decayStages: [{ afterMs: 2000, priority: this.priority.BACKGROUND }], expiresMs: 4000, cooldownMs: 500, aggregateWithinMs: 500, aggregationStrategy: 'latest' }],
            ['semantic.ascension', { decayStages: [{ afterMs: 1500, priority: this.priority.NORMAL }], expiresMs: 3000, cooldownMs: 250, aggregateWithinMs: 300, aggregationStrategy: 'latest' }],
            ['semantic.ritual.started', { decayStages: [{ afterMs: 1000, priority: this.priority.NORMAL }], expiresMs: 2500, cooldownMs: 200, aggregateWithinMs: 300, aggregationStrategy: 'latest' }],
            ['semantic.ritual.completed', { decayStages: [{ afterMs: 1000, priority: this.priority.NORMAL }], expiresMs: 2500, cooldownMs: 200, aggregateWithinMs: 300, aggregationStrategy: 'latest' }],
            ['ritual.autoTriggered', { decayStages: [{ afterMs: 1000, priority: this.priority.NORMAL }], expiresMs: 2500, cooldownMs: 200, aggregateWithinMs: 300, aggregationStrategy: 'latest' }],
            ['ritual.prelude', { decayStages: [{ afterMs: 1000, priority: this.priority.NORMAL }], expiresMs: 2500, cooldownMs: 200, aggregateWithinMs: 300, aggregationStrategy: 'latest' }],
            ['ritual.active', { decayStages: [{ afterMs: 1000, priority: this.priority.NORMAL }], expiresMs: 2500, cooldownMs: 200, aggregateWithinMs: 300, aggregationStrategy: 'latest' }],
            ['ritual.crest', { decayStages: [{ afterMs: 1000, priority: this.priority.NORMAL }], expiresMs: 2500, cooldownMs: 200, aggregateWithinMs: 300, aggregationStrategy: 'latest' }],
            ['ritual.release', { decayStages: [{ afterMs: 1000, priority: this.priority.NORMAL }], expiresMs: 2500, cooldownMs: 200, aggregateWithinMs: 300, aggregationStrategy: 'latest' }],
            ['world.loaded', { decayStages: [{ afterMs: 1000, priority: this.priority.NORMAL }], expiresMs: 2500, cooldownMs: 250, aggregateWithinMs: 300, aggregationStrategy: 'latest' }],

            // Canonical semantic vocabulary (category:event)
            ['network:stabilityDrop', { cooldownMs: 250, aggregateWithinMs: 500, aggregationStrategy: 'latest' }],
            ['network:stressRise', { cooldownMs: 250, aggregateWithinMs: 500, aggregationStrategy: 'latest' }],
            ['network:corruptionSpread', { cooldownMs: 220, aggregateWithinMs: 450, aggregationStrategy: 'latest' }],
            ['network:harmonyShift', { cooldownMs: 250, aggregateWithinMs: 500, aggregationStrategy: 'latest' }],

            ['node:selected', { cooldownMs: 160, aggregateWithinMs: 220, aggregationStrategy: 'latest' }],
            ['node:evolved', { cooldownMs: 180, aggregateWithinMs: 280, aggregationStrategy: 'latest' }],
            ['node:ascended', { cooldownMs: 220, aggregateWithinMs: 320, aggregationStrategy: 'latest' }],

            ['link:collapsed', { cooldownMs: 120, aggregateWithinMs: 200, aggregationStrategy: 'latest' }],
            ['link:synergyThreshold', { cooldownMs: 160, aggregateWithinMs: 260, aggregationStrategy: 'latest' }],
            ['link:harmonicLock', { cooldownMs: 160, aggregateWithinMs: 260, aggregationStrategy: 'latest' }],

            // Canonical scoped metric tiers: primary public surface for metric tier transitions.
            ['node.synergy.low', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.synergy.mid', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.synergy.high', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.harmony.low', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.harmony.mid', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.harmony.high', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.stability.low', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.stability.mid', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.stability.high', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.corruption.low', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.corruption.mid', { ...SCOPED_METRIC_TIER_POLICY }],
            ['node.corruption.high', { ...SCOPED_METRIC_TIER_POLICY }],
            ...['node', 'global', 'link', 'hub'].flatMap((scope) =>
                SCOPED_METRIC_EVENT_NAMES.flatMap((metric) =>
                    ['low', 'mid', 'high'].map((tier) => [
                        buildScopedMetricEventName(scope, metric, tier),
                        { ...SCOPED_METRIC_TIER_POLICY }
                    ])
                )
            ),

            // Internal tier hook: immediate, unbuffered routing for diagnostics/tooling only.
            ['metric.tier.changed', { cooldownMs: 0, aggregateWithinMs: 0, aggregationStrategy: 'latest' }],

            // Legacy adapter lane: keep the normalized phase shape alive only for old consumers.
            ['metric.phase.changed', { cooldownMs: 0, aggregateWithinMs: 0, aggregationStrategy: 'latest' }],

            // Legacy metric thresholds: compatibility fallback, intentionally buffered.
            ['metric:synergySpike', { cooldownMs: 120, aggregateWithinMs: 240, aggregationStrategy: 'latest' }],
            ['metric:harmonyPeak', { cooldownMs: 150, aggregateWithinMs: 300, aggregationStrategy: 'latest' }],
            ['metric:stabilityDrop', { cooldownMs: 120, aggregateWithinMs: 240, aggregationStrategy: 'latest' }],
            ['metric:corruptionRise', { cooldownMs: 120, aggregateWithinMs: 240, aggregationStrategy: 'latest' }],
            ['metric:loadPressureHigh', { cooldownMs: 180, aggregateWithinMs: 320, aggregationStrategy: 'latest' }],
            ['event:loadCollapse', { cooldownMs: 0, aggregateWithinMs: 0, aggregationStrategy: 'latest' }],
            ['topology.healing', { cooldownMs: 0, aggregateWithinMs: 0, aggregationStrategy: 'latest' }],

            // Dramaturgy engine events (P1.4 — 3-phase event lifecycle)
            ['dramaturgy.sequence.start', { cooldownMs: 100, aggregateWithinMs: 100, aggregationStrategy: 'latest' }],
            ['dramaturgy.sequence.end', { cooldownMs: 100, aggregateWithinMs: 100, aggregationStrategy: 'latest' }],
            ['dramaturgy.phase', { cooldownMs: 50, aggregateWithinMs: 50, aggregationStrategy: 'latest' }]
        ]);
        this.cooldownMap = new Map();
        // Phase E.3: aggregation buffers keyed by semantic tag
        this.aggregationBuffers = new Map();
        // Phase E.4: escalation state per semantic key
        this.escalationState = new Map();
        // Phase E.4: suppression tracking (counts/timestamps for observability)
        this.suppressedTags = new Map();
        // Phase E.5: semantic budgets (per-frame meaning quota)
        this.semanticBudget = {
            maxUnitsPerFrame: 100,
            usedUnits: 0,
            costByPriority: {
                [this.priority.CRITICAL]: 50,
                [this.priority.INTERACTIVE]: 20,
                [this.priority.NORMAL]: 10,
                [this.priority.BACKGROUND]: 5
            }
        };
        // Phase E.6: starvation prevention (aging-based fairness)
        this.starvationConfig = {
            thresholdMs: 300,
            maxBoostPriority: this.priority.INTERACTIVE,
            boostStep: 1
        };
        this.starvationTracker = [
            performance.now(),
            performance.now(),
            performance.now(),
            performance.now()
        ];
        // Phase E.8: semantic tracing (bounded, passive time-travel buffer)
        this.semanticTrace = {
            enabled: true,
            maxEntries: 500,
            entries: [],
            drainCycle: 0
        };
        // Phase F.1: semantic → visual contract (frame-stable derived state for visuals)
        this.semanticVisualState = {
            pressure: 0,
            urgency: 0,
            calm: 1,
            congestion: 0,
            volatility: 0,
            focus: 0,
            anomalies: 0,
            __sources: {}
        };
        this.semanticVisualStateTimestamp = performance.now();
        // Phase F.2: semantic → motion intent (camera motion signals only, no direct movement)
        this.semanticMotionIntent = {
            drift: 0,
            pull: 0,
            tremor: 0,
            inertia: 0,
            zoomBias: 0,
            verticalBias: 0,
            __sources: {}
        };
        this.semanticMotionIntentTimestamp = performance.now();
        // Phase F.3: semantic → FX/atmosphere intent (read-only, no visual side effects)
        this.semanticAtmosphereState = {
            exposureBias: 0,
            contrastBias: 0,
            saturationBias: 0,
            fogDensity: 0,
            noiseAmount: 0,
            chromaticShift: 0,
            glowIntensity: 0,
            pulse: 0,
            __sources: {}
        };
        this.semanticAtmosphereTimestamp = performance.now();
        // Phase F.4: semantic → node material intent (read-only, no material mutations)
        this.semanticNodeMaterialIntent = {
            emissiveBoost: 0,
            glowBias: 0,
            wireIntensity: 0,
            opacityBias: 0,
            distortion: 0,
            pulse: 0,
            __sources: {}
        };
        this.semanticNodeMaterialTimestamp = performance.now();
        // Phase F.5: semantic → link/field intent (read-only, no link system mutations)
        this.semanticLinkFieldIntent = {
            tension: 0,
            flow: 0,
            coherence: 0,
            turbulence: 0,
            attenuation: 0,
            directionality: 0,
            __sources: {}
        };
        this.semanticLinkFieldTimestamp = performance.now();
        // Phase F.6: semantic → HUD/UI intent (read-only, no DOM changes)
        this.semanticHUDIntent = {
            alertness: 0,
            readability: 1,
            emphasis: 0,
            jitter: 0,
            density: 0,
            calmness: 1,
            __sources: {}
        };
        this.semanticHUDIntentTimestamp = performance.now();
        // Phase G.1: semantic guardrails & invariants (passive diagnostics only)
        this.semanticInvariants = {
            calmUrgencyMax: 1.2,
            maxEscalationDurationMs: 3000,
            maxJitterGrowthFrames: 10,
            maxSuppressionRatio: 0.6
        };
        this.semanticHealth = {
            score: 1,
            warnings: [],
            violations: [],
            lastCheck: performance.now(),
            profile: {
                active: 'default',
                modifiers: this.semanticProfiles?.default || {}
            },
            transition: {},
            recommendation: null,
            authority: {
                active: null,
                source: null,
                priority: 0,
                locks: {},
                constraints: {},
                remainingMs: null,
                resolved: this.semanticAuthorityState
            }
        };
        this.lastJitter = 0;
        this.jitterGrowthFrames = 0;
        this.escalationActiveSince = new Map();
        // Phase G.2: semantic time smoothing & hysteresis (passive, post-compute)
        this.semanticSmoothing = {
            enabled: true,
            alpha: 0.15,
            hysteresis: 0.05,
            minDeltaMs: 16
        };
        this.semanticSmoothingState = {
            visual: {},
            motion: {},
            atmosphere: {},
            nodeMaterial: {},
            hud: {},
            lastUpdate: 0
        };
        // Phase G.3: semantic profiles/modes (lens-only modulation, no logic changes)
        this.semanticProfiles = {
            default: {},
            zen: {
                smoothingAlphaScale: 1.0,
                volatilityScale: 0.7,
                urgencyScale: 0.8,
                calmBias: 0.05,
                jitterDamping: 0.3,
                motionInertiaScale: 1.1,
                hudEmphasisScale: 0.9,
                fxIntensityScale: 0.9
            },
            chaos: {
                smoothingAlphaScale: 1.0,
                volatilityScale: 1.3,
                urgencyScale: 1.2,
                calmBias: -0.05,
                anomalyAmplification: 1.2,
                jitterDamping: -0.1,
                motionInertiaScale: 0.9,
                hudEmphasisScale: 1.1,
                fxIntensityScale: 1.1
            },
            analytical: {
                smoothingAlphaScale: 1.0,
                volatilityScale: 0.9,
                urgencyScale: 1.0,
                calmBias: 0.02,
                anomalyAmplification: 1.1,
                jitterDamping: 0.2,
                motionInertiaScale: 1.2,
                hudEmphasisScale: 1.05,
                fxIntensityScale: 1.0
            },
            dream: {
                smoothingAlphaScale: 1.0,
                volatilityScale: 0.8,
                urgencyScale: 0.85,
                calmBias: 0.08,
                anomalyAmplification: 1.3,
                jitterDamping: 0.4,
                motionInertiaScale: 0.95,
                hudEmphasisScale: 0.95,
                fxIntensityScale: 1.05
            }
        };
        this.activeSemanticProfile = 'default';
        this.semanticProfileStack = {
            global: 'default',
            local: new Map(),
            context: []
        };
        this.semanticProfileTransition = {
            active: false,
            from: 'default',
            to: 'default',
            startTime: 0,
            durationMs: 600,
            easing: 'smoothstep'
        };
        this.semanticProfileLocalTransitions = new Map();
        this.semanticProfileTriggers = {
            zen: {
                when: (ctx) => ctx.visual.pressure < 0.3 && ctx.motion.inertia < 0.3 && ctx.health.violations.length === 0,
                confidence: (ctx) => 1 - (ctx.visual.volatility || 0),
                minConfidence: 0.6,
                cooldownMs: 4000,
                reason: 'low pressure + low motion + no violations'
            },
            chaos: {
                when: (ctx) => (ctx.visual.volatility || 0) > 0.7 || (ctx.visual.anomalies || 0) > 0.6,
                confidence: (ctx) => ctx.visual.volatility || 0,
                minConfidence: 0.65,
                cooldownMs: 5000,
                reason: 'high volatility or anomalies'
            },
            analytical: {
                when: (ctx) => (ctx.visual.focus || 0) > 0.6 && (ctx.motion.tremor || 0) < 0.3,
                confidence: (ctx) => ctx.visual.focus || 0,
                minConfidence: 0.6,
                cooldownMs: 4000,
                reason: 'focused state with low tremor'
            }
        };
        this.semanticProfileAutoAccept = false;
        this.semanticProfileRecommendation = null;
        this.semanticProfileTriggerCooldowns = new Map();
        // Phase G.7 — Narrative / Authority Locks (passive lens; no behavior change)
        this.semanticAuthorityLockState = {
            active: null,
            priority: 0,
            locks: {},
            constraints: {},
            source: null,
            startTime: 0,
            durationMs: 0
        };
        this.semanticAuthorityPrevious = {};
        this.semanticAuthorityPriorityDefs = {
            narrative: { priority: 100 },
            system: { priority: 80 },
            player: { priority: 60 },
            environment: { priority: 40 },
            ambient: { priority: 20 }
        };
        // Phase G.8: authority blending registry and resolved snapshot (passive only)
        this.semanticAuthorities = new Map();
        this.semanticAuthorityState = {
            global: { strength: 0, sources: [] },
            scopes: {},
            timestamp: performance.now()
        };
        // Phase G.9: profile gating (authority-damped profiles, lens-only)
        this.semanticProfileGate = {
            enabled: true,
            globalFactor: 1,
            perScope: {},
            sources: [],
            timestamp: performance.now()
        };
        // Phase G.10: semantic budgeting/backpressure (passive, lens-only)
        this.semanticBudgetConfig = {
            enabled: true,
            caps: {
                visual: 3,
                motion: 2,
                atmosphere: 3,
                nodeMaterial: 3,
                linkField: 3,
                hud: 2
            },
            decayRate: 0.4,
            recoveryRate: 0.25
        };
        this.semanticBudgetState = {
            factors: {
                visual: 1,
                motion: 1,
                atmosphere: 1,
                nodeMaterial: 1,
                linkField: 1,
                hud: 1
            },
            loads: {},
            timestamp: performance.now()
        };

        // Phase 1 metric alias bridge:
        // legacy threshold events remain the producer-side signal; the bus fans them into the canonical scoped tier surface.
        this._registerLegacyMetricTierAliases();
    }
    incrementEventCounter(tag, payload) {
        // Track cascade.hop for VFX pipeline verification
        if (tag === 'cascade.hop' && typeof window !== 'undefined') {
            const now = performance.now();
            const lastSampleAt = window._cascadeHopLastSampleAt || 0;
            const sampleWindowMs = 250;
            if (now - lastSampleAt >= sampleWindowMs) {
                window._cascadeHopCount = (window._cascadeHopCount || 0) + 1;
                window._cascadeHopLastSampleAt = now;
            }
        }
        switch (tag) {
            case 'node.selection':
                if (payload?.type === 'select') {
                    this.eventCounters.nodeSelect++;
                } else if (payload?.type === 'deselect') {
                    this.eventCounters.nodeDeselect++;
                }
                break;
            case 'link.created':
                this.eventCounters.linkCreated++;
                break;
            case 'network.link.destroyed':
                this.eventCounters.linkDestroyed++;
                break;
            case 'node.synergy.high':
                this.eventCounters.synergyHigh++;
                break;
            case 'synergy.fade':
                this.eventCounters.synergyFade++;
                break;
            default:
                break;
        }
    }
    logEventAudit() {
        const now = performance.now();
        if (now - this.lastAuditLogTime < this.auditIntervalMs) {
            return;
        }
        console.log('[ATOMA EVENT AUDIT]');
        console.log(`nodeSelect: ${this.eventCounters.nodeSelect}`);
        console.log(`nodeDeselect: ${this.eventCounters.nodeDeselect}`);
        console.log(`linkCreated: ${this.eventCounters.linkCreated}`);
        console.log(`linkDestroyed: ${this.eventCounters.linkDestroyed}`);
        console.log(`synergyHigh: ${this.eventCounters.synergyHigh}`);
        console.log(`synergyFade: ${this.eventCounters.synergyFade}`);
        this.lastAuditLogTime = now;
    }
    resetEventCounters() {
        this.eventCounters = {
            nodeSelect: 0,
            nodeDeselect: 0,
            linkCreated: 0,
            linkDestroyed: 0,
            synergyHigh: 0,
            synergyFade: 0
        };
    }
    getEventCounters() {
        return { ...this.eventCounters };
    }
    getMetricAliasCatalog() {
        return {
            tier: [...this.metricAliasCatalog.tier],
            behavior: [...this.metricAliasCatalog.behavior],
            drop: [...this.metricAliasCatalog.drop]
        };
    }
    _registerScopedMetricTierPolicies() {
        for (const scope of ['node', 'global', 'link', 'hub']) {
            for (const metric of SCOPED_METRIC_EVENT_NAMES) {
                for (const tier of ['low', 'mid', 'high']) {
                    const tag = buildScopedMetricEventName(scope, metric, tier);
                    if (!this.eventPolicies.has(tag)) {
                        this.eventPolicies.set(tag, { ...SCOPED_METRIC_TIER_POLICY });
                    }
                }
            }
        }
    }
    _registerLegacyMetricTierAliases() {
        const tierAliases = [
            { legacyTag: 'metric:synergySpike', metric: 'synergy', tier: 'high', fallbackScope: 'node' },
            { legacyTag: 'metric:harmonyPeak', metric: 'harmony', tier: 'high', fallbackScope: 'node' },
            { legacyTag: 'metric:stabilityDrop', metric: 'stability', tier: 'low', fallbackScope: 'node' },
            { legacyTag: 'metric:corruptionRise', metric: 'corruption', tier: 'high', fallbackScope: 'node' },
            { legacyTag: 'metric:loadPressureHigh', metric: 'loadPressure', tier: 'high', fallbackScope: 'global' }
        ];
        const behaviorAliases = [
            { legacyTag: 'metric.synergy.burst', metric: 'synergy', tier: 'high', fallbackScope: 'node' },
            { legacyTag: 'metric.corruption.spike', metric: 'corruption', tier: 'high', fallbackScope: 'node' },
            { legacyTag: 'synergy.fade', metric: 'synergy', tier: 'low', fallbackScope: 'global' }
        ];

        this._registerScopedMetricTierPolicies();

        for (const alias of tierAliases) {
            this.registerEventAlias(
                alias.legacyTag,
                (payload) => buildScopedMetricEventName(
                    resolveMetricAliasScope(payload, alias.fallbackScope),
                    alias.metric,
                    alias.tier
                ),
                { category: 'tier' }
            );
        }

        for (const alias of behaviorAliases) {
            this.registerEventAlias(
                alias.legacyTag,
                (payload) => buildScopedMetricEventName(
                    resolveMetricAliasScope(payload, alias.fallbackScope),
                    alias.metric,
                    alias.tier
                ),
                { category: 'behavior' }
            );
        }

        this.registerEventAlias(
            'metric.node.updated',
            () => 'node.metric.updated',
            { category: 'behavior' }
        );
    }
    animate() {
        requestAnimationFrame(() => this.animate());
        this.logEventAudit();
    }
    subscribe(tag, handler, opts = {}) {
        if (isMetricEventValidationEnabled() && isScopedMetricTierTag(tag) && !this.eventPolicies.has(tag)) {
            console.warn(`[SemanticEventBus] Invalid scoped metric tier subscription tag: ${tag}`);
        }
        if (isMetricEventValidationEnabled()) {
            const contractNature = getMetricContractTagNature(tag);
            if (contractNature === 'internal') {
                console.warn(`[SemanticEventBus] Internal debug event tag subscribed: ${tag}. Use scoped metric tier events instead.`);
            } else if (contractNature === 'legacy') {
                console.warn(`[SemanticEventBus] Legacy compatibility event tag subscribed: ${tag}. Prefer scoped metric tier events for new wiring.`);
            }
        }
        if (!this.handlers.has(tag)) {
            this.handlers.set(tag, []);
        }
        const handlerPriority = this.normalizePriority(opts.priority);
        this.handlers.get(tag).push({ fn: handler, priority: handlerPriority });
        return () => this.unsubscribe(tag, handler);
    }
    on(tag, handler, opts = {}) {
        return this.subscribe(tag, handler, opts);
    }
    onPrefix(prefix, handler, opts = {}) {
        if (typeof prefix !== 'string' || typeof handler !== 'function') return () => {};
        const handlerPriority = this.normalizePriority(opts.priority);
        const entry = { prefix, fn: handler, priority: handlerPriority };
        this.prefixListeners.push(entry);
        return () => {
            const idx = this.prefixListeners.indexOf(entry);
            if (idx >= 0) this.prefixListeners.splice(idx, 1);
        };
    }
    unsubscribe(tag, handler) {
        const list = this.handlers.get(tag);
        if (!list || list.length === 0) return false;
        const next = list.filter(entry => entry.fn !== handler);
        if (next.length === 0) {
            this.handlers.delete(tag);
            return true;
        }
        if (next.length === list.length) return false;
        this.handlers.set(tag, next);
        return true;
    }
    off(tag, handler) {
        this.unsubscribe(tag, handler);
    }
    _getLinkCreatedFanoutCount() {
        if (!this.linkCreatedFanout?.consumers) return 0;
        let total = 0;
        for (const bucket of this.linkCreatedFanout.consumers) {
            total += bucket?.size || 0;
        }
        return total;
    }
    _teardownLinkCreatedFanoutEdge() {
        const fanout = this.linkCreatedFanout;
        if (!fanout?.edgeBound) return;
        try {
            fanout.edgeUnsubscribe?.();
        } catch (_) {}
        fanout.edgeBound = false;
        fanout.edgeHandler = null;
        fanout.edgeUnsubscribe = null;
    }
    _ensureLinkCreatedFanoutEdge() {
        const fanout = this.linkCreatedFanout;
        if (!fanout || fanout.edgeBound) return;

        const edgeHandler = (event = {}) => {
            this.dispatchLinkCreatedFanout(event);
        };

        let edgeUnsubscribe = null;
        if (typeof this.subscribe === 'function') {
            this.subscribe('link.created', edgeHandler, { priority: this.priority.INTERACTIVE });
            edgeUnsubscribe = () => this.unsubscribe('link.created', edgeHandler);
        } else if (typeof this.on === 'function') {
            this.on('link.created', edgeHandler, { priority: this.priority.INTERACTIVE });
            edgeUnsubscribe = () => this.off?.('link.created', edgeHandler);
        }

        if (!edgeUnsubscribe) return;

        fanout.edgeBound = true;
        fanout.edgeHandler = edgeHandler;
        fanout.edgeUnsubscribe = edgeUnsubscribe;
    }
    dispatchLinkCreatedFanout(event = {}) {
        const fanout = this.linkCreatedFanout;
        if (!fanout?.consumers) return;

        for (let priority = 0; priority < fanout.consumers.length; priority++) {
            const bucket = fanout.consumers[priority];
            if (!bucket || bucket.size === 0) continue;
            for (const consumer of bucket.values()) {
                try {
                    consumer?.handler?.(event);
                } catch (err) {
                    console.warn('[SemanticEventBus] link.created fanout consumer failed:', consumer?.id, err);
                }
            }
        }
    }
    registerLinkCreatedConsumer(handler, opts = {}) {
        if (typeof handler !== 'function') return () => {};

        const fanout = this.linkCreatedFanout;
        const priority = this.normalizePriority(opts.priority);
        const id = String(opts.id || `link.created.consumer.${++fanout.idSeq}`);

        this.unregisterLinkCreatedConsumer(id);
        fanout.consumers[priority].set(id, {
            id,
            priority,
            handler
        });

        this._ensureLinkCreatedFanoutEdge();

        return () => {
            this.unregisterLinkCreatedConsumer(id);
        };
    }
    unregisterLinkCreatedConsumer(id) {
        if (!id) return false;
        const fanout = this.linkCreatedFanout;
        const targetId = String(id);
        let removed = false;

        for (const bucket of fanout.consumers) {
            if (!bucket?.has(targetId)) continue;
            bucket.delete(targetId);
            removed = true;
        }

        if (removed && this._getLinkCreatedFanoutCount() === 0) {
            this._teardownLinkCreatedFanoutEdge();
        }

        return removed;
    }
    registerEventAlias(aliasTag, targetResolver, opts = {}) {
        if (typeof aliasTag !== 'string' || !aliasTag) return;
        const category = opts.category || 'tier';
        const rule = {
            category,
            enabled: opts.enabled !== false,
            targetResolver: typeof targetResolver === 'function'
                ? targetResolver
                : () => targetResolver
        };
        if (!this.eventAliasRegistry.has(aliasTag)) {
            this.eventAliasRegistry.set(aliasTag, []);
        }
        this.eventAliasRegistry.get(aliasTag).push(rule);
        const catalog = this.metricAliasCatalog?.[category];
        if (Array.isArray(catalog) && !catalog.includes(aliasTag)) {
            catalog.push(aliasTag);
        }
    }
    resolveEventAliases(tag, payload, opts = {}) {
        const rules = this.eventAliasRegistry.get(tag);
        if (!rules || rules.length === 0) return [];
        const targets = [];
        const seen = new Set();
        for (const rule of rules) {
            if (!rule?.enabled) continue;
            let resolved;
            try {
                resolved = rule.targetResolver(payload, opts, this);
            } catch (err) {
                console.warn('[SemanticEventBus] alias resolver failed for', tag, err);
                continue;
            }
            const values = Array.isArray(resolved) ? resolved : [resolved];
            for (const value of values) {
                if (typeof value !== 'string' || !value) continue;
                if (value === tag) continue;
                if (seen.has(value)) continue;
                seen.add(value);
                targets.push(value);
            }
        }
        return targets;
    }
    dispatchAliasTargets(targets, payload, opts = {}) {
        if (!Array.isArray(targets) || targets.length === 0) return;
        for (const target of targets) {
            const nextOpts = {
                ...opts,
                expandAliases: false
            };
            if (opts.immediate) {
                this.emitImmediate(target, payload, nextOpts);
            } else {
                this.emit(target, payload, nextOpts);
            }
        }
    }
    emit(tag, payload, opts = {}) {
        if (isMetricEventValidationEnabled() && isScopedMetricTierTag(tag) && !this.eventPolicies.has(tag)) {
            console.warn(`[SemanticEventBus] Invalid scoped metric tier emit tag: ${tag}`);
        }
        if (isMetricEventValidationEnabled()) {
            const contractNature = getMetricContractTagNature(tag);
            if (contractNature === 'internal') {
                console.warn(`[SemanticEventBus] Internal debug event tag emitted: ${tag}. Use scoped metric tier events instead.`);
            } else if (contractNature === 'legacy') {
                console.warn(`[SemanticEventBus] Legacy compatibility event tag emitted: ${tag}. Prefer scoped metric tier events for new wiring.`);
            }
        }
        const eventPriority = this.normalizePriority(opts.priority);
        const shouldFastLaneImmediate = this.stormGovernanceTags.has(tag)
            && eventPriority <= this.priority.INTERACTIVE
            && opts.deferCritical !== true;
        if (shouldFastLaneImmediate) {
            this.emitImmediate(tag, payload, { ...opts, expandAliases: opts.expandAliases !== false });
            return;
        }

        const allowAliasExpansion = opts.expandAliases !== false;
        const aliasTargets = allowAliasExpansion ? this.resolveEventAliases(tag, payload, opts) : [];
        const exactHandlers = this.handlers.get(tag) || [];
        const prefixHandlers = [];
        for (const listener of this.prefixListeners) {
            if (!listener || typeof listener.prefix !== 'string' || typeof listener.fn !== 'function') continue;
            if (!tag.startsWith(listener.prefix)) continue;
            prefixHandlers.push({
                priority: listener.priority,
                fn: (forwardedPayload) => listener.fn(tag, forwardedPayload)
            });
        }
        const list = exactHandlers.length > 0
            ? (prefixHandlers.length > 0 ? exactHandlers.concat(prefixHandlers) : exactHandlers)
            : prefixHandlers;
        if ((!list || list.length === 0) && aliasTargets.length === 0) return;
        const now = performance.now();
        const basePolicy = opts.policy || this.eventPolicies.get(tag);
        const policy = basePolicy ? { ...basePolicy } : undefined;
        if (policy) {
            if (opts.cooldownMs !== undefined) policy.cooldownMs = opts.cooldownMs;
            if (opts.cooldownKey !== undefined) policy.cooldownKey = opts.cooldownKey;
        }
        const dispatchList = list && list.length > 0
            ? list
            : [{ fn: () => {}, priority: eventPriority }];

        this.incrementEventCounter(tag, payload);
        // Phase E.4: suppression pre-check before aggregation/cooldown
        if (this.shouldSuppress(tag, policy, eventPriority)) {
            this.stats.suppressedEvents++;
            this.recordTraceEntry({
                tag,
                originalPriority: eventPriority,
                finalPriority: eventPriority,
                queueAtInsert: null,
                queueAtExit: null,
                flags: { suppressed: true },
                policy,
                timestamp: now
            });
            if (aliasTargets.length > 0) {
                this.dispatchAliasTargets(aliasTargets, payload, { ...opts, immediate: true, expandAliases: false });
            }
            return;
        }
        // Phase E.3: semantic aggregation before enqueue
        if (policy?.aggregateWithinMs) {
            this.handleAggregateEmit(tag, payload, dispatchList, eventPriority, policy, now, aliasTargets);
            return;
        }
        this.enqueueEventInstances(tag, payload, dispatchList, eventPriority, policy, now, aliasTargets);
    }

    emitImmediate(tag, payload, opts = {}) {
        if (isMetricEventValidationEnabled() && isScopedMetricTierTag(tag) && !this.eventPolicies.has(tag)) {
            console.warn(`[SemanticEventBus] Invalid scoped metric tier immediate emit tag: ${tag}`);
        }
        if (isMetricEventValidationEnabled()) {
            const contractNature = getMetricContractTagNature(tag);
            if (contractNature === 'internal') {
                console.warn(`[SemanticEventBus] Internal debug event tag immediate emitted: ${tag}. Use scoped metric tier events instead.`);
            } else if (contractNature === 'legacy') {
                console.warn(`[SemanticEventBus] Legacy compatibility event tag immediate emitted: ${tag}. Prefer scoped metric tier events for new wiring.`);
            }
        }
        const allowAliasExpansion = opts.expandAliases !== false;
        const aliasTargets = allowAliasExpansion ? this.resolveEventAliases(tag, payload, opts) : [];
        const exactHandlers = this.handlers.get(tag) || [];
        const prefixHandlers = [];
        for (const listener of this.prefixListeners) {
            if (!listener || typeof listener.prefix !== 'string' || typeof listener.fn !== 'function') continue;
            if (!tag.startsWith(listener.prefix)) continue;
            prefixHandlers.push({
                priority: listener.priority,
                fn: (forwardedPayload) => listener.fn(tag, forwardedPayload)
            });
        }

        const list = exactHandlers.length > 0
            ? (prefixHandlers.length > 0 ? exactHandlers.concat(prefixHandlers) : exactHandlers)
            : prefixHandlers;
        if ((!list || list.length === 0) && aliasTargets.length === 0) return;

        if (list && list.length > 0) {
            this.incrementEventCounter(tag, payload);
            const ordered = list
                .map((handler, index) => ({
                    fn: handler.fn,
                    priority: this.normalizePriority(handler.priority),
                    index
                }))
                .sort((left, right) => left.priority - right.priority || left.index - right.index);

            for (const entry of ordered) {
                try {
                    entry.fn(payload);
                } catch (err) {
                    console.warn(`[SemanticBus] Immediate handler failed for ${tag}:`, err);
                }
            }
        }

        if (aliasTargets.length > 0) {
            this.dispatchAliasTargets(aliasTargets, payload, { ...opts, immediate: true, expandAliases: false });
        }
    }
    // Phase E.3: aggregate similar semantic events within a short window before enqueueing
    handleAggregateEmit(tag, payload, handlers, eventPriority, policy, now, aliasTargets = []) {
        const key = policy.aggregateKey || tag;
        const windowMs = policy.aggregateWithinMs;
        let buffer = this.aggregationBuffers.get(key);
        if (buffer && now - buffer.firstTimestamp >= windowMs) {
            this.flushAggregate(key, buffer, now);
            buffer = null;
        }
        if (!buffer) {
            buffer = {
                tag,
                handlers,
                policy,
                firstTimestamp: now,
                lastTimestamp: now,
                count: 1,
                aggregatedValue: this.initAggregateValue(payload, policy?.aggregationStrategy),
                latestPayload: payload,
                basePriority: eventPriority,
                aliasTargets
            };
            this.aggregationBuffers.set(key, buffer);
            this.recordTraceEntry({
                tag,
                originalPriority: eventPriority,
                finalPriority: eventPriority,
                queueAtInsert: null,
                queueAtExit: null,
                flags: { aggregated: true },
                policy,
                timestamp: now
            });
            return;
        }
        buffer.lastTimestamp = now;
        buffer.count += 1;
        buffer.latestPayload = payload;
        buffer.basePriority = Math.min(buffer.basePriority, eventPriority);
        buffer.aggregatedValue = this.applyAggregationStrategy(buffer.aggregatedValue, payload, policy?.aggregationStrategy);
        if (aliasTargets.length > 0) {
            const mergedTargets = new Set(buffer.aliasTargets || []);
            for (const target of aliasTargets) {
                if (typeof target === 'string' && target) mergedTargets.add(target);
            }
            buffer.aliasTargets = [...mergedTargets];
        }
    }
    enqueueEventInstances(tag, payload, handlers, eventPriority, policy, now, aliasTargets = []) {
        if (this.shouldSuppress(tag, policy, eventPriority)) {
            this.stats.suppressedEvents++;
            return false;
        }
        const cooldownMs = policy?.cooldownMs;
        const cooldownKey = policy?.cooldownKey || tag;
        if (cooldownMs) {
            const last = this.cooldownMap.get(cooldownKey);
            if (last !== undefined && now - last < cooldownMs) {
                this.stats.cooledEvents++;
                return false;
            }
            this.cooldownMap.set(cooldownKey, now);
        }
        const escalatedBase = this.applyEscalation(tag, eventPriority, policy, now);
        for (const handler of handlers) {
            const basePri = handler.priority ?? escalatedBase ?? eventPriority;
            const pri = Math.min(basePri, escalatedBase ?? basePri);
            const queue = this.eventQueues[pri];
            const evt = {
                name: tag,
                payload,
                handler: handler.fn,
                t: now,
                priority: pri,
                originalPriority: pri,
                policy,
                aliasTargets: Array.isArray(aliasTargets) ? [...aliasTargets] : []
            };
            queue.items.push(evt);
            this.recordTraceEntry({
                tag,
                originalPriority: pri,
                finalPriority: pri,
                queueAtInsert: pri,
                queueAtExit: pri,
                flags: { aggregated: !!policy?.aggregateWithinMs },
                policy,
                timestamp: now
            });
        }
        return true;
    }
    scheduleTask(fn, opts = {}) {
        if (!fn) return;
        const pri = this.normalizePriority(opts.priority);
        const queue = this.taskQueues[pri];
        queue.items.push({ fn, priority: pri, label: opts.label });
    }
    drain(budgetMs = 1.0, maxEvents = 64) {
        const now = performance.now();
        this.flushAggregationWindows(now);
        const start = now;
        // Phase E.5: reset per-frame semantic budget before draining
        this.semanticBudget.usedUnits = 0;
        this.stats.budgetUsed = 0;
        this.stats.budgetMax = this.semanticBudget.maxUnitsPerFrame;
        this.semanticTrace.drainCycle += 1;
        let processed = 0;
        for (let pri = 0; pri < this.eventQueues.length; pri++) {
            const queue = this.eventQueues[pri];
            while (queue.head < queue.items.length) {
                if (processed >= maxEvents || performance.now() - start > budgetMs) {
                    this.stats.lastDrainMsEvents = performance.now() - start;
                    this.computeSemanticVisualState();
                    return processed;
                }
                const evt = queue.items[queue.head++];
                const now = performance.now();
                const decayedPriority = this.applyDecay(evt, now);
                if (decayedPriority === null) {
                    this.stats.droppedEvents++;
                    this.recordTraceEntry({
                        tag: evt.name,
                        originalPriority: evt.originalPriority,
                        finalPriority: evt.priority,
                        queueAtInsert: pri,
                        queueAtExit: null,
                        flags: { dropped: true },
                        policy: evt.policy,
                        timestamp: now,
                        age: now - evt.t
                    });
                    continue;
                }
                const fairnessResult = this.maybeBoostForFairness(decayedPriority, pri, evt, now);
                if (fairnessResult === 'requeued') {
                    this.recordTraceEntry({
                        tag: evt.name,
                        originalPriority: evt.originalPriority,
                        finalPriority: evt.priority,
                        queueAtInsert: pri,
                        queueAtExit: evt.priority,
                        flags: { fairnessBoosted: true },
                        policy: evt.policy,
                        timestamp: now,
                        age: now - evt.t
                    });
                    continue;
                }
                const effectivePriority = fairnessResult;
                if (decayedPriority > pri) {
                    evt.priority = decayedPriority;
                    const targetQueue = this.eventQueues[decayedPriority];
                    targetQueue.items.push(evt);
                    this.stats.decayedEvents++;
                    this.recordTraceEntry({
                        tag: evt.name,
                        originalPriority: evt.originalPriority,
                        finalPriority: evt.priority,
                        queueAtInsert: pri,
                        queueAtExit: decayedPriority,
                        flags: { decayed: true },
                        policy: evt.policy,
                        timestamp: now,
                        age: now - evt.t
                    });
                    continue;
                }
                if (!this.consumeBudget(effectivePriority)) {
                    // Defer: push back to end of its priority queue to be tried next frame
                    queue.items.push(evt);
                    this.stats.budgetDeferredEvents++;
                    if (evt.fairnessBoosted) {
                        this.stats.starvationSkips++;
                    }
                    this.recordTraceEntry({
                        tag: evt.name,
                        originalPriority: evt.originalPriority,
                        finalPriority: evt.priority,
                        queueAtInsert: pri,
                        queueAtExit: pri,
                        flags: { budgetDeferred: true },
                        policy: evt.policy,
                        timestamp: now,
                        age: now - evt.t
                    });
                    break;
                }
                try {
                    evt.handler(evt.payload);
                    if (Array.isArray(evt.aliasTargets) && evt.aliasTargets.length > 0) {
                        this.dispatchAliasTargets(evt.aliasTargets, evt.payload, {
                            priority: evt.priority,
                            policy: evt.policy
                        });
                    }
                    this.stats.eventsProcessed[pri]++;
                    if (evt.fairnessBoosted) {
                        this.stats.starvedEventsRecovered++;
                    }
                    this.starvationTracker[pri] = now;
                    this.recordTraceEntry({
                        tag: evt.name,
                        originalPriority: evt.originalPriority,
                        finalPriority: evt.priority,
                        queueAtInsert: pri,
                        queueAtExit: pri,
                        flags: { executed: true, fairnessBoosted: !!evt.fairnessBoosted },
                        policy: evt.policy,
                        timestamp: now,
                        age: now - evt.t
                    });
                } catch (err) {
                    console.warn('[SemanticEventBus] handler error for', evt.name, err);
                }
                processed++;
            }
            if (queue.head > 64 && queue.head > queue.items.length / 2) {
                queue.items = queue.items.slice(queue.head);
                queue.head = 0;
            }
        }
        this.stats.lastDrainMsEvents = performance.now() - start;
        this.computeSemanticVisualState();
        this.computeSemanticMotionIntent();
        this.computeSemanticAtmosphereState();
        this.computeSemanticNodeMaterialIntent();
        this.computeSemanticLinkFieldIntent();
        this.computeSemanticHUDIntent();
        this.applySemanticSmoothing(now);
        this.resolveSemanticAuthorities(now);
        this.computeSemanticProfileGate(now);
        this.applySemanticProfile(now);
        this.applySemanticAuthorityLens(now);
        this.applySemanticBudgeting(now);
        this.evaluateSemanticProfileTriggers(now);
        this.evaluateSemanticInvariants();
        return processed;
    }
    drainTasks(budgetMs = 0.5, maxTasks = 32) {
        const start = performance.now();
        let processed = 0;
        for (let pri = 0; pri < this.taskQueues.length; pri++) {
            const queue = this.taskQueues[pri];
            while (queue.head < queue.items.length) {
                if (processed >= maxTasks || performance.now() - start > budgetMs) {
                    this.stats.lastDrainMsTasks = performance.now() - start;
                    return processed;
                }
                const task = queue.items[queue.head++];
                try {
                    task.fn();
                    this.stats.tasksProcessed[pri]++;
                } catch (err) {
                    console.warn('[SemanticEventBus] task error', err);
                }
                processed++;
            }
            if (queue.head > 64 && queue.head > queue.items.length / 2) {
                queue.items = queue.items.slice(queue.head);
                queue.head = 0;
            }
        }
        this.stats.lastDrainMsTasks = performance.now() - start;
        return processed;
    }
    // Phase E.3: flush aggregation buffers whose windows have elapsed before draining
    flushAggregationWindows(now) {
        if (this.aggregationBuffers.size === 0) return;
        const toFlush = [];
        for (const [key, buffer] of this.aggregationBuffers) {
            const windowMs = buffer.policy?.aggregateWithinMs;
            if (!windowMs || now - buffer.firstTimestamp >= windowMs) {
                toFlush.push([key, buffer]);
            }
        }
        for (const [key, buffer] of toFlush) {
            this.flushAggregate(key, buffer, now);
        }
    }
    flushAggregate(key, buffer, now) {
        if (!buffer) return;
        const aggregatedPayload = this.buildAggregatedPayload(buffer);
        this.enqueueEventInstances(
            buffer.tag,
            aggregatedPayload,
            buffer.handlers,
            buffer.basePriority,
            buffer.policy,
            now,
            buffer.aliasTargets || []
        );
        this.stats.aggregatedEvents++;
        this.aggregationBuffers.delete(key);
    }
    buildAggregatedPayload(buffer) {
        const duration = buffer.lastTimestamp - buffer.firstTimestamp;
        const basePayload =
            buffer.latestPayload && typeof buffer.latestPayload === 'object'
                ? { ...buffer.latestPayload }
                : { value: buffer.latestPayload };
        basePayload.__aggregation = {
            count: buffer.count,
            duration,
            aggregatedValue: buffer.aggregatedValue,
            firstTimestamp: buffer.firstTimestamp,
            lastTimestamp: buffer.lastTimestamp
        };
        return basePayload;
    }
    initAggregateValue(payload, strategy) {
        switch (strategy) {
            case 'sum':
            case 'max':
                return this.toNumber(payload);
            case 'latest':
                return payload;
            case 'count':
            default:
                return 1;
        }
    }
    applyAggregationStrategy(currentValue, payload, strategy) {
        switch (strategy) {
            case 'sum':
                return (this.toNumber(currentValue) || 0) + this.toNumber(payload);
            case 'max':
                return Math.max(this.toNumber(currentValue), this.toNumber(payload));
            case 'latest':
                return payload;
            case 'count':
            default:
                return (typeof currentValue === 'number' && Number.isFinite(currentValue) ? currentValue : 0) + 1;
        }
    }
    toNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (value && typeof value === 'object') {
            if (typeof value.motion === 'number' && Number.isFinite(value.motion)) return value.motion;
            if (typeof value.value === 'number' && Number.isFinite(value.value)) return value.value;
            if (typeof value.severity === 'number' && Number.isFinite(value.severity)) return value.severity;
        }
        return 0;
    }
    getAggregationBufferSummary() {
        const now = performance.now();
        const summary = [];
        for (const [key, buffer] of this.aggregationBuffers) {
            summary.push({
                key,
                count: buffer.count,
                ageMs: now - buffer.firstTimestamp,
                windowMs: buffer.policy?.aggregateWithinMs ?? 0
            });
        }
        return summary;
    }
    // Phase E.8: trace entry creator (compact, ring-buffer)
    recordTraceEntry(data) {
        if (!this.semanticTrace.enabled) return;
        const entry = {
            timestamp: data.timestamp ?? performance.now(),
            frameIndex: this.semanticTrace.drainCycle,
            tag: data.tag,
            originalPriority: data.originalPriority,
            finalPriority: data.finalPriority,
            age: data.age ?? 0,
            queueAtInsert: data.queueAtInsert ?? null,
            queueAtExit: data.queueAtExit ?? null,
            flags: {
                suppressed: !!data.flags?.suppressed,
                cooled: !!data.flags?.cooled,
                aggregated: !!data.flags?.aggregated,
                escalated: !!data.flags?.escalated,
                decayed: !!data.flags?.decayed,
                fairnessBoosted: !!data.flags?.fairnessBoosted,
                budgetDeferred: !!data.flags?.budgetDeferred,
                dropped: !!data.flags?.dropped,
                executed: !!data.flags?.executed
            },
            policySnapshot: this.buildPolicySnapshot(data.policy)
        };
        const buf = this.semanticTrace.entries;
        if (buf.length >= this.semanticTrace.maxEntries) {
            buf.shift();
        }
        buf.push(entry);
    }
    buildPolicySnapshot(policy) {
        if (!policy) return null;
        return {
            hasDecay: !!(policy.decayStages || policy.halfLifeMs),
            hasCooldown: !!policy.cooldownMs,
            hasAggregation: !!policy.aggregateWithinMs,
            hasEscalation: !!policy.escalate,
            hasSuppression: !!policy.suppress
        };
    }
    setSemanticProfile(name) {
        if (!name || !this.semanticProfiles[name]) return this.activeSemanticProfile;
        if (name === this.activeSemanticProfile) return this.activeSemanticProfile;
        this.semanticProfileStack.global = name;
        this.semanticProfileTransition = {
            active: true,
            from: this.activeSemanticProfile,
            to: name,
            startTime: performance.now(),
            durationMs: this.semanticProfileTransition.durationMs || 600,
            easing: this.semanticProfileTransition.easing || 'smoothstep'
        };
        // Keep current profile active during blend; no smoothing reset
        return this.activeSemanticProfile;
    }
    setLocalSemanticProfile(key, name) {
        if (!key || !name || !this.semanticProfiles[name]) return;
        const current = this.semanticProfileStack.local.get(key);
        if (current === name) return;
        this.semanticProfileStack.local.set(key, name);
        this.semanticProfileLocalTransitions.set(key, {
            active: true,
            from: current || 'default',
            to: name,
            startTime: performance.now(),
            durationMs: this.semanticProfileTransition.durationMs || 600,
            easing: this.semanticProfileTransition.easing || 'smoothstep'
        });
    }
    clearLocalSemanticProfile(key) {
        if (!key) return;
        const current = this.semanticProfileStack.local.get(key);
        if (!current) return;
        this.semanticProfileStack.local.delete(key);
        this.semanticProfileLocalTransitions.set(key, {
            active: true,
            from: current,
            to: 'default',
            startTime: performance.now(),
            durationMs: this.semanticProfileTransition.durationMs || 600,
            easing: this.semanticProfileTransition.easing || 'smoothstep'
        });
    }
    pushContextSemanticProfile(name, ttlMs = 1000) {
        if (!name || !this.semanticProfiles[name]) return;
        const expiresAt = performance.now() + ttlMs;
        this.semanticProfileStack.context.push({
            name,
            from: 'default',
            t: 1,
            expiresAt
        });
    }
    // Phase G.7 — Narrative / Authority Locks
    setSemanticAuthority(name, config = {}) {
        if (!name) return this.semanticAuthorityLockState.active;
        const priorityDef = this.semanticAuthorityPriorityDefs[name];
        if (!priorityDef) return this.semanticAuthorityLockState.active;
        const now = performance.now();
        const incomingPriority = priorityDef.priority ?? 0;
        if (incomingPriority < (this.semanticAuthorityLockState.priority || 0)) {
            return this.semanticAuthorityLockState.active;
        }
        this.semanticAuthorityLockState = {
            active: name,
            priority: incomingPriority,
            locks: config.locks || {},
            constraints: config.constraints || {},
            source: config.source || null,
            startTime: now,
            durationMs: config.durationMs || 0
        };
        // register passive authority entry (G.8) as well
        const entryPriority = config.priority !== undefined ? config.priority : (priorityDef.priority || 0);
        const normPriority = entryPriority > 1 ? entryPriority / 100 : entryPriority;
        this.semanticAuthorities.set(name, {
            id: name,
            scope: config.scope || 'global',
            priority: normPriority,
            decayMs: config.decayMs ?? config.durationMs ?? null,
            startTime: now,
            blendMode: config.blendMode || 'max',
            source: config.source || name
        });
        return this.semanticAuthorityLockState.active;
    }
    clearSemanticAuthority(name) {
        if (!name || this.semanticAuthorityLockState.active !== name) return;
        this.semanticAuthorityLockState = {
            active: null,
            priority: 0,
            locks: {},
            constraints: {},
            source: null,
            startTime: 0,
            durationMs: 0
        };
        this.semanticAuthorities.delete(name);
    }
    applySemanticAuthority(state, domain) {
        const authority = this.semanticAuthorityLockState;
        if (!authority.active) return state;
        const now = performance.now();
        if (authority.durationMs && authority.startTime + authority.durationMs < now) {
            this.clearSemanticAuthority(authority.active);
            return state;
        }
        const lock = authority.locks[domain] || authority.locks['*'];
        if (!lock) return state;
        const constraints = authority.constraints[domain] || authority.constraints['*'] || {};
        const prev = this.semanticAuthorityPrevious[domain];
        const result = { ...state };
        if (lock === 'freeze') {
            const frozen = prev ? { ...prev } : { ...result };
            frozen.__authorityApplied = authority.active;
            this.semanticAuthorityPrevious[domain] = frozen;
            return frozen;
        }
        const clampVal = (v) => {
            let out = v;
            if (lock === 'scale' && typeof constraints.scale === 'number') {
                out = v * constraints.scale;
            }
            if (lock === 'clamp') {
                if (typeof constraints.min === 'number') out = Math.max(constraints.min, out);
                if (typeof constraints.max === 'number') out = Math.min(constraints.max, out);
            }
            return out;
        };
        for (const key of Object.keys(result)) {
            if (typeof result[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                result[key] = clampVal(result[key]);
            }
        }
        result.__authorityApplied = authority.active;
        this.semanticAuthorityPrevious[domain] = result;
        return result;
    }
    applySemanticAuthorityLens(now) {
        if (!this.semanticAuthorityLockState.active) return;
        this.semanticVisualState = this.applySemanticAuthority(this.semanticVisualState, 'visual');
        this.semanticMotionIntent = this.applySemanticAuthority(this.semanticMotionIntent, 'motion');
        this.semanticAtmosphereState = this.applySemanticAuthority(this.semanticAtmosphereState, 'atmosphere');
        this.semanticNodeMaterialIntent = this.applySemanticAuthority(this.semanticNodeMaterialIntent, 'nodeMaterial');
        this.semanticHUDIntent = this.applySemanticAuthority(this.semanticHUDIntent, 'hud');
    }
    // Phase G.8: authority blending & decay (passive resolution snapshot only)
    resolveSemanticAuthorities(now) {
        const epsilon = 0.0001;
        const resolved = {
            global: { strength: 0, sources: [] },
            scopes: {},
            timestamp: now
        };
        const scopeBuckets = new Map();
        const toDelete = [];
        for (const [id, entry] of this.semanticAuthorities.entries()) {
            const elapsed = Math.max(0, now - (entry.startTime || now));
            let strength = entry.priority || 0;
            if (entry.decayMs) {
                // linear decay toward 0 over decayMs
                const factor = Math.max(0, 1 - elapsed / entry.decayMs);
                strength = strength * factor;
            }
            if (strength <= epsilon) {
                toDelete.push(id);
                continue;
            }
            const scopes = entry.scope === 'global' ? ['global'] : Array.isArray(entry.scope) ? entry.scope : [entry.scope];
            for (const scope of scopes) {
                if (!scopeBuckets.has(scope)) scopeBuckets.set(scope, []);
                scopeBuckets.get(scope).push({
                    id: entry.id,
                    strength,
                    blendMode: entry.blendMode || 'max',
                    source: entry.source
                });
            }
        }
        for (const id of toDelete) {
            this.semanticAuthorities.delete(id);
        }
        const blendScope = (entries) => {
            let strength = 0;
            let weightedSum = 0;
            let weightTotal = 0;
            const sources = [];
            for (const e of entries) {
                sources.push({ id: e.id, strength: e.strength, blendMode: e.blendMode, source: e.source });
                switch (e.blendMode) {
                    case 'exclusive':
                        if (e.strength > strength) strength = e.strength;
                        break;
                    case 'additive':
                        strength = Math.min(1, strength + e.strength);
                        break;
                    case 'weighted':
                        weightedSum += e.strength * e.strength;
                        weightTotal += e.strength;
                        break;
                    case 'max':
                    default:
                        strength = Math.max(strength, e.strength);
                        break;
                }
            }
            if (weightTotal > 0) {
                strength = Math.max(strength, weightedSum / weightTotal);
            }
            return { strength: Math.min(1, strength), sources };
        };
        for (const [scope, entries] of scopeBuckets.entries()) {
            const blended = blendScope(entries);
            if (scope === 'global') {
                resolved.global = blended;
            } else {
                resolved.scopes[scope] = blended;
            }
        }
        this.semanticAuthorityState = resolved;
    }
    applySemanticBudgeting(now) {
        if (!this.semanticBudgetConfig.enabled) return;
        const clamps = {};
        const computeLoad = (state) => {
            if (!state) return 0;
            let sum = 0;
            for (const [k, v] of Object.entries(state)) {
                if (typeof v === 'number' && k !== '__smoothed' && k !== '__raw') {
                    sum += Math.abs(v);
                }
            }
            return sum;
        };
        const domains = {
            visual: this.semanticVisualState,
            motion: this.semanticMotionIntent,
            atmosphere: this.semanticAtmosphereState,
            nodeMaterial: this.semanticNodeMaterialIntent,
            linkField: this.semanticLinkFieldIntent,
            hud: this.semanticHUDIntent
        };
        const prevFactors = this.semanticBudgetState.factors || {};
        const newFactors = {};
        const loads = {};
        const { decayRate, recoveryRate } = this.semanticBudgetConfig;
        for (const [domain, state] of Object.entries(domains)) {
            const load = computeLoad(state);
            loads[domain] = load;
            const cap = this.semanticBudgetConfig.caps?.[domain] ?? Infinity;
            const targetFactor = load > cap && cap > 0 ? Math.max(0, cap / load) : 1;
            const prev = prevFactors[domain] ?? 1;
            const rate = targetFactor < prev ? decayRate : recoveryRate;
            const factor = prev + (targetFactor - prev) * rate;
            newFactors[domain] = Math.min(1, Math.max(0, factor));
            clamps[domain] = newFactors[domain];
        }
        const applyFactor = (state, domain) => {
            if (!state) return state;
            const factor = clamps[domain] ?? 1;
            if (factor >= 0.999) return state;
            const result = { ...state };
            for (const [k, v] of Object.entries(result)) {
                if (typeof v === 'number' && k !== '__smoothed' && k !== '__raw') {
                    result[k] = v * factor;
                }
            }
            result.__budgeted = true;
            result.budgetFactor = factor;
            return result;
        };
        this.semanticVisualState = applyFactor(this.semanticVisualState, 'visual');
        this.semanticMotionIntent = applyFactor(this.semanticMotionIntent, 'motion');
        this.semanticAtmosphereState = applyFactor(this.semanticAtmosphereState, 'atmosphere');
        this.semanticNodeMaterialIntent = applyFactor(this.semanticNodeMaterialIntent, 'nodeMaterial');
        this.semanticLinkFieldIntent = applyFactor(this.semanticLinkFieldIntent, 'linkField');
        this.semanticHUDIntent = applyFactor(this.semanticHUDIntent, 'hud');
        this.semanticBudgetState = {
            factors: newFactors,
            loads,
            timestamp: now
        };
    }
    computeSemanticProfileGate(now) {
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const globalStrength = this.semanticAuthorityState.global?.strength || 0;
        const globalFactor = clamp01(1 - globalStrength);
        const perScope = {};
        const sources = [];
        for (const [scope, data] of Object.entries(this.semanticAuthorityState.scopes || {})) {
            const factor = clamp01(1 - (data.strength || 0));
            perScope[scope] = factor;
            if (Array.isArray(data.sources)) {
                sources.push(...data.sources);
            }
        }
        this.semanticProfileGate = {
            enabled: this.semanticProfileGate.enabled !== false,
            globalFactor,
            perScope,
            sources,
            timestamp: now
        };
    }
    getProfileGateFactor(domain) {
        if (this.semanticProfileGate.enabled === false) return 1;
        const globalFactor = this.semanticProfileGate.globalFactor ?? 1;
        const scopeFactor = this.semanticProfileGate.perScope?.[domain] ?? 1;
        return Math.min(globalFactor, scopeFactor);
    }
    getSemanticProfileBlend(now) {
        const trans = this.semanticProfileTransition;
        if (!trans || !trans.active) {
            return { from: this.activeSemanticProfile, to: this.activeSemanticProfile, t: 1 };
        }
        const duration = trans.durationMs || 600;
        const elapsed = Math.max(0, now - (trans.startTime || now));
        let t = duration > 0 ? Math.min(1, elapsed / duration) : 1;
        // smoothstep easing
        t = t * t * (3 - 2 * t);
        return { from: trans.from, to: trans.to, t };
    }
    getLocalProfileBlend(key, now) {
        const trans = this.semanticProfileLocalTransitions.get(key);
        if (!trans || !trans.active) {
            const target = this.semanticProfileStack.local.get(key) || 'default';
            return { from: target, to: target, t: 1, name: target };
        }
        const duration = trans.durationMs || 600;
        const elapsed = Math.max(0, now - (trans.startTime || now));
        let t = duration > 0 ? Math.min(1, elapsed / duration) : 1;
        t = t * t * (3 - 2 * t);
        return { from: trans.from, to: trans.to, t, name: trans.to };
    }
    pruneContextProfiles(now) {
        if (!Array.isArray(this.semanticProfileStack.context)) return;
        this.semanticProfileStack.context = this.semanticProfileStack.context.filter(entry => !entry.expiresAt || entry.expiresAt > now);
    }
    resolveSemanticProfiles(now) {
        const layers = [];
        const globalBlend = this.getSemanticProfileBlend(now);
        layers.push({ name: globalBlend.to, from: globalBlend.from, to: globalBlend.to, t: globalBlend.t, source: 'global' });
        // local profiles sorted by specificity (longer key first)
        const locals = Array.from(this.semanticProfileStack.local.entries()).sort((a, b) => b[0].length - a[0].length);
        for (const [key, name] of locals) {
            const blend = this.getLocalProfileBlend(key, now);
            layers.push({ name, from: blend.from, to: blend.to, t: blend.t, source: 'local', key });
            if (blend.t >= 1 && this.semanticProfileLocalTransitions.has(key) && this.semanticProfileLocalTransitions.get(key).active) {
                const st = this.semanticProfileLocalTransitions.get(key);
                st.active = false;
                this.semanticProfileLocalTransitions.set(key, st);
            }
        }
        // context overrides (most recent last)
        this.pruneContextProfiles(now);
        for (const ctx of this.semanticProfileStack.context) {
            layers.push({ name: ctx.name, from: ctx.from || 'default', to: ctx.name, t: ctx.t || 1, source: 'context' });
        }
        return layers;
    }
    getSemanticContextSnapshot(now) {
        return {
            visual: this.semanticVisualState || {},
            motion: this.semanticMotionIntent || {},
            atmosphere: this.semanticAtmosphereState || {},
            nodeMaterial: this.semanticNodeMaterialIntent || {},
            hud: this.semanticHUDIntent || {},
            health: this.semanticHealth || {},
            activeProfile: this.semanticProfileStack.global,
            transition: this.semanticProfileTransition,
            authority: {
                lock: this.semanticAuthorityLockState,
                resolved: this.semanticAuthorityState
            },
            budget: this.semanticBudgetState,
            timestamp: now
        };
    }
    getSemanticProfileStack() {
        return {
            global: this.semanticProfileStack.global,
            local: Array.from(this.semanticProfileStack.local.entries()),
            context: Array.isArray(this.semanticProfileStack.context) ? [...this.semanticProfileStack.context] : []
        };
    }
    evaluateSemanticProfileTriggers(now) {
        if (!this.semanticProfileTriggers) return;
        if (this.semanticProfileTransition?.active) return;
        const ctx = this.getSemanticContextSnapshot(now);
        let best = null;
        for (const [name, trigger] of Object.entries(this.semanticProfileTriggers)) {
            if (!trigger || typeof trigger.when !== 'function' || typeof trigger.confidence !== 'function') continue;
            if (name === this.activeSemanticProfile) continue;
            const last = this.semanticProfileTriggerCooldowns.get(name);
            if (last && trigger.cooldownMs && now - last < trigger.cooldownMs) continue;
            if (!trigger.when(ctx)) continue;
            const conf = Math.min(1, Math.max(0, trigger.confidence(ctx)));
            if (conf < (trigger.minConfidence ?? 0)) continue;
            if (!best || conf > best.confidence) {
                best = { name, confidence: conf, reason: trigger.reason || 'semantic trigger matched' };
            }
        }
        if (best) {
            this.semanticProfileRecommendation = {
                suggested: best.name,
                confidence: best.confidence,
                reason: best.reason,
                timestamp: now
            };
            this.semanticProfileTriggerCooldowns.set(best.name, now);
            if (this.semanticProfileAutoAccept && best.confidence >= 0.75) {
                this.setSemanticProfile(best.name);
            }
        }
    }
    getQueueSizes() {
        return {
            events: this.eventQueues.map(q => q.items.length - q.head),
            tasks: this.taskQueues.map(q => q.items.length - q.head)
        };
    }
    getStats() {
        return {
            eventsProcessed: [...this.stats.eventsProcessed],
            tasksProcessed: [...this.stats.tasksProcessed],
            lastDrainMsEvents: this.stats.lastDrainMsEvents,
            lastDrainMsTasks: this.stats.lastDrainMsTasks,
            queueSizes: this.getQueueSizes(),
            cooledEvents: this.stats.cooledEvents,
            droppedEvents: this.stats.droppedEvents,
            decayedEvents: this.stats.decayedEvents,
            aggregatedEvents: this.stats.aggregatedEvents,
            escalatedEvents: this.stats.escalatedEvents,
            suppressedEvents: this.stats.suppressedEvents,
            budgetDeferredEvents: this.stats.budgetDeferredEvents,
            budgetOverflows: this.stats.budgetOverflows,
            budgetUsed: this.stats.budgetUsed,
            budgetMax: this.stats.budgetMax,
            starvedEventsRecovered: this.stats.starvedEventsRecovered,
            starvationSkips: this.stats.starvationSkips,
            fairnessBoostsApplied: this.stats.fairnessBoostsApplied,
            aggregationBuffers: this.getAggregationBufferSummary()
        };
    }
    normalizePriority(p) {
        if (p === undefined || p === null) return this.priority.NORMAL;
        return Math.min(Math.max(p, 0), 3);
    }
    // Phase E.2: apply semantic decay and expiry at drain time
    applyDecay(evt, now) {
        const policy = evt.policy;
        if (!policy) return evt.priority;
        const age = now - evt.t;
        if (policy.expiresMs !== undefined && age > policy.expiresMs) {
            return null;
        }
        let newPriority = evt.priority;
        if (policy.decayStages && policy.decayStages.length) {
            for (let i = 0; i < policy.decayStages.length; i++) {
                const stage = policy.decayStages[i];
                if (age >= stage.afterMs) {
                    newPriority = this.normalizePriority(stage.priority);
                }
            }
        } else if (policy.halfLifeMs) {
            const steps = Math.floor(age / policy.halfLifeMs);
            newPriority = this.normalizePriority(evt.originalPriority + steps);
        }
        return newPriority;
    }
    // Phase E.4: determine if an event should escalate or be suppressed before enqueue
    applyEscalation(tag, priorityValue, policy, now) {
        if (!policy?.escalate) return priorityValue;
        const esc = policy.escalate;
        let state = this.escalationState.get(tag);
        if (!state || now - state.windowStart > (esc.windowMs ?? 0)) {
            state = { count: 0, windowStart: now, level: 0 };
        }
        state.count += 1;
        let result = priorityValue;
        const cappedTarget = Math.max(0, Math.min(esc.toPriority ?? priorityValue, this.priority.CRITICAL));
        const canEscalate = state.count >= (esc.threshold ?? Infinity) && (esc.maxLevel === undefined || state.level < esc.maxLevel);
        if (canEscalate && priorityValue > cappedTarget) {
            result = cappedTarget;
            state.level += 1;
            state.count = 0; // reset within window after escalation to avoid runaway
            state.windowStart = now;
            this.stats.escalatedEvents++;
        }
        this.escalationState.set(tag, state);
        return result;
    }
    // Phase E.4: suppression gates low-value events under overload conditions
    shouldSuppress(tag, policy, priorityValue) {
        if (!policy?.suppress) return false;
        if (priorityValue === this.priority.CRITICAL) return false;
        const suppress = policy.suppress;
        if (suppress.ifOverload) {
            const depth = this.getTotalQueueDepth();
            if (suppress.maxQueueDepth && depth >= suppress.maxQueueDepth) {
                return true;
            }
            if (suppress.dropRateThreshold !== undefined) {
                const rate = this.getDropRate();
                if (rate >= suppress.dropRateThreshold) {
                    return true;
                }
            }
        }
        const now = performance.now();
        const existing = this.suppressedTags.get(tag) || { count: 0, last: 0 };
        this.suppressedTags.set(tag, { count: existing.count + 1, last: now });
        return false;
    }
    getTotalQueueDepth() {
        let depth = 0;
        for (let i = 0; i < this.eventQueues.length; i++) {
            const q = this.eventQueues[i];
            depth += q.items.length - q.head;
        }
        return depth;
    }
    getDropRate() {
        const totalEvents = this.stats.droppedEvents + this.stats.eventsProcessed.reduce((a, b) => a + b, 0);
        if (totalEvents === 0) return 0;
        return this.stats.droppedEvents / totalEvents;
    }
    // Phase E.6: fairness via aging boost to prevent starvation of lower priorities
    maybeBoostForFairness(decayedPriority, currentQueuePriority, evt, now) {
        if (decayedPriority <= this.starvationConfig.maxBoostPriority) return decayedPriority;
        if (evt.fairnessBoosted) return decayedPriority;
        const lastServiced = this.starvationTracker[currentQueuePriority] ?? 0;
        if (now - lastServiced < this.starvationConfig.thresholdMs) return decayedPriority;
        const step = this.starvationConfig.boostStep || 1;
        const targetPriority = Math.max(this.starvationConfig.maxBoostPriority, decayedPriority - step);
        if (targetPriority >= decayedPriority) return decayedPriority;
        evt.priority = targetPriority;
        evt.fairnessBoosted = true;
        this.eventQueues[targetPriority].items.push(evt);
        this.stats.fairnessBoostsApplied++;
        return 'requeued';
    }
    // Phase E.5: semantic budgets — consume budget units per event before execution
    consumeBudget(priorityValue) {
        const cost = this.semanticBudget.costByPriority[priorityValue] ?? 0;
        if (priorityValue === this.priority.CRITICAL) {
            this.semanticBudget.usedUnits += cost;
            this.stats.budgetUsed = this.semanticBudget.usedUnits;
            if (this.semanticBudget.usedUnits > this.semanticBudget.maxUnitsPerFrame) {
                this.stats.budgetOverflows++;
            }
            return true;
        }
        if (this.semanticBudget.usedUnits + cost > this.semanticBudget.maxUnitsPerFrame) {
            return false;
        }
        this.semanticBudget.usedUnits += cost;
        this.stats.budgetUsed = this.semanticBudget.usedUnits;
        return true;
    }
    // Phase E.7: semantic observability & introspection
    getSemanticSnapshot() {
        const now = performance.now();
        const queues = this.eventQueues.map((q) => {
            const headEvt = q.items[q.head];
            const headAge = headEvt ? now - headEvt.t : 0;
            return { length: q.items.length - q.head, headAge };
        });
        const activePolicies = [];
        for (const [tag, policy] of this.eventPolicies) {
            activePolicies.push({
                tag,
                decay: policy.decayStages || policy.halfLifeMs || null,
                aggregateWithinMs: policy.aggregateWithinMs || null,
                aggregationStrategy: policy.aggregationStrategy || null,
                cooldownMs: policy.cooldownMs || null,
                escalate: policy.escalate || null,
                suppress: policy.suppress || null
            });
        }
        const cooldowns = [];
        for (const [key, last] of this.cooldownMap) {
            const policy = this.eventPolicies.get(key);
            const cooldownMs = policy?.cooldownMs;
            const remaining = cooldownMs ? Math.max(0, cooldownMs - (now - last)) : 0;
            cooldowns.push({ key, remaining });
        }
        const suppressed = [];
        for (const [key, info] of this.suppressedTags) {
            suppressed.push({ key, count: info.count, last: info.last });
        }
        const aggregationBuffers = this.getAggregationBufferSummary();
        const escalation = [];
        for (const [key, state] of this.escalationState) {
            escalation.push({ key, level: state.level, count: state.count, windowStart: state.windowStart });
        }
        return {
            frameTimestamp: now,
            queues,
            activePolicies,
            budget: {
                used: this.semanticBudget.usedUnits,
                max: this.semanticBudget.maxUnitsPerFrame,
                deferred: this.stats.budgetDeferredEvents,
                overflows: this.stats.budgetOverflows
            },
            starvation: {
                lastServed: [...this.starvationTracker],
                boostsApplied: this.stats.fairnessBoostsApplied,
                recovered: this.stats.starvedEventsRecovered,
                skips: this.stats.starvationSkips
            },
            aggregation: {
                buffers: aggregationBuffers
            },
            suppression: {
                active: suppressed,
                cooldowns
            },
            escalation,
            stats: this.getStats()
        };
    }
    explainEvent(evt) {
        if (!evt) return null;
        const now = performance.now();
        const originalPriority = evt.originalPriority ?? evt.priority;
        const currentPriority = evt.priority;
        const policy = evt.policy || this.eventPolicies.get(evt.name);
        const cost = this.semanticBudget.costByPriority[currentPriority] ?? 0;
        const cooldownMs = policy?.cooldownMs;
        const lastCooldown = cooldownMs ? this.cooldownMap.get(policy.cooldownKey || evt.name) : undefined;
        const remainingCooldown = cooldownMs && lastCooldown ? Math.max(0, cooldownMs - (now - lastCooldown)) : 0;
        return {
            tag: evt.name,
            originalPriority,
            currentPriority,
            decayed: currentPriority > originalPriority,
            escalated: currentPriority < originalPriority,
            boosted: !!evt.fairnessBoosted,
            suppressed: false,
            cooled: cooldownMs ? remainingCooldown > 0 : false,
            cooldownRemainingMs: cooldownMs ? remainingCooldown : null,
            aggregated: !!(policy && policy.aggregateWithinMs),
            aggregationKey: policy?.aggregateKey || evt.name,
            budgetCost: cost,
            ageMs: now - evt.t
        };
    }
    // Phase E.8: semantic trace query / replay (observability only)
    getSemanticTrace(options = {}) {
        const { limit, tag, priority, sinceTimestamp } = options;
        const entries = [];
        for (let i = 0; i < this.semanticTrace.entries.length; i++) {
            const entry = this.semanticTrace.entries[i];
            if (tag && entry.tag !== tag) continue;
            if (priority !== undefined && entry.finalPriority !== priority && entry.originalPriority !== priority) continue;
            if (sinceTimestamp !== undefined && entry.timestamp < sinceTimestamp) continue;
            entries.push({ ...entry });
        }
        if (limit && entries.length > limit) {
            return entries.slice(entries.length - limit);
        }
        return entries;
    }
    replaySemanticTrace(callback) {
        if (typeof callback !== 'function') return;
        const snapshot = this.semanticTrace.entries.slice();
        for (let i = 0; i < snapshot.length; i++) {
            callback({ ...snapshot[i] });
        }
    }
    clearSemanticTrace() {
        this.semanticTrace.entries = [];
    }
    // Phase F.1: semantic → visual contract (derived, frame-stable state for visuals)
    computeSemanticVisualState() {
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const queues = this.getQueueSizes();
        const queueDepth = queues.events.reduce((a, b) => a + b, 0);
        const highDepth = queues.events[0] + queues.events[1];
        const budgetRatio = this.semanticBudget.maxUnitsPerFrame > 0 ? clamp01(this.semanticBudget.usedUnits / this.semanticBudget.maxUnitsPerFrame) : 0;
        const backlogRatio = clamp01(queueDepth / 200);
        const pressure = clamp01(budgetRatio * 0.6 + backlogRatio * 0.4);
        const urgency = clamp01((highDepth / (queueDepth + 1)) * 0.7 + backlogRatio * 0.3);
        const congestion = clamp01(backlogRatio * 0.7 + clamp01(this.aggregationBuffers.size / 20) * 0.3);
        const totalEvents = this.stats.droppedEvents + this.stats.eventsProcessed.reduce((a, b) => a + b, 0);
        const anomalies = clamp01((this.stats.droppedEvents + this.stats.starvedEventsRecovered + this.stats.budgetOverflows) / (totalEvents + 1));
        const volatility = clamp01((this.aggregationBuffers.size > 0 ? Math.min(this.aggregationBuffers.size / 10, 0.6) : 0) + clamp01(this.stats.fairnessBoostsApplied / (totalEvents + 1)) * 0.4);
        const focus = clamp01(1 - Math.min((this.aggregationBuffers.size + this.suppressedTags.size) / 10, 1));
        const calm = clamp01(1 - Math.max(pressure, congestion));
        this.semanticVisualState = {
            pressure,
            urgency,
            calm,
            congestion,
            volatility,
            focus,
            anomalies,
            __sources: {
                pressure: ['budgetUsed', 'queueDepth'],
                urgency: ['highPriorityDepth', 'queueDepth'],
                calm: ['pressure', 'congestion'],
                congestion: ['queueDepth', 'aggregationBuffers'],
                volatility: ['aggregationBuffers', 'fairnessBoostsApplied'],
                focus: ['aggregationBuffers', 'suppressedTags'],
                anomalies: ['droppedEvents', 'starvedEventsRecovered', 'budgetOverflows']
            }
        };
        this.semanticVisualStateTimestamp = performance.now();
    }
    getSemanticVisualState() {
        const state = this.semanticVisualState || {};
        return { ...state, __sources: state.__sources ? { ...state.__sources } : {} };
    }
    // Phase F.2: semantic → motion reducer (derived motion intent for camera; no movement applied)
    computeSemanticMotionIntent() {
        const svs = this.semanticVisualState || {};
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const clamp11 = (v) => Math.min(1, Math.max(-1, v));
        const drift = clamp11((svs.volatility || 0) * 0.5 - (svs.calm || 0) * 0.2);
        const pull = clamp01((svs.focus || 0) * 0.6 + (svs.urgency || 0) * 0.4);
        const tremorBase = clamp01((svs.volatility || 0) * 0.6 + (svs.anomalies || 0) * 0.5);
        const tremor = clamp01(Math.max(0, tremorBase - (svs.calm || 0) * 0.3));
        const inertia = clamp01((svs.pressure || 0) * 0.5 + (svs.congestion || 0) * 0.5);
        const zoomBias = clamp11((svs.pressure || 0) * 0.7 - (svs.calm || 0) * 0.3);
        const verticalBias = clamp11(((svs.calm || 0) * 0.5) - ((svs.anomalies || 0) * 0.3));
        this.semanticMotionIntent = {
            drift,
            pull,
            tremor,
            inertia,
            zoomBias,
            verticalBias,
            __sources: {
                drift: ['volatility', 'calm'],
                pull: ['focus', 'urgency'],
                tremor: ['volatility', 'anomalies', 'calm'],
                inertia: ['pressure', 'congestion'],
                zoomBias: ['pressure', 'calm'],
                verticalBias: ['calm', 'anomalies']
            }
        };
        this.semanticMotionIntentTimestamp = performance.now();
    }
    getSemanticMotionIntent() {
        const intent = this.semanticMotionIntent || {};
        return { ...intent, __sources: intent.__sources ? { ...intent.__sources } : {} };
    }
    // Phase F.3: semantic → atmosphere reducer (FX intent only; no rendering side effects)
    computeSemanticAtmosphereState() {
        const svs = this.semanticVisualState || {};
        const smi = this.semanticMotionIntent || {};
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const clamp11 = (v) => Math.min(1, Math.max(-1, v));
        const pressure = svs.pressure || 0;
        const calm = svs.calm || 0;
        const volatility = svs.volatility || 0;
        const anomalies = svs.anomalies || 0;
        const urgency = svs.urgency || 0;
        const exposureBias = clamp01(urgency * 0.6 + pressure * 0.2);
        const contrastBias = clamp01((1 - pressure) * 0.5 + calm * 0.3);
        const saturationBias = clamp01(calm * 0.6 + (1 - volatility) * 0.2);
        const fogDensity = clamp01(pressure * 0.7 + (1 - calm) * 0.2);
        const noiseAmount = clamp01(volatility * 0.6 + anomalies * 0.5);
        const chromaticShift = clamp01(anomalies * 0.7 + volatility * 0.2);
        const glowIntensity = clamp01(svs.focus ? svs.focus * 0.5 + urgency * 0.3 : urgency * 0.3);
        const pulse = clamp01(urgency * 0.5 + volatility * 0.3 + anomalies * 0.2);
        this.semanticAtmosphereState = {
            exposureBias,
            contrastBias,
            saturationBias,
            fogDensity,
            noiseAmount,
            chromaticShift,
            glowIntensity,
            pulse,
            __sources: {
                exposureBias: ['urgency', 'pressure'],
                contrastBias: ['pressure', 'calm'],
                saturationBias: ['calm', 'volatility'],
                fogDensity: ['pressure', 'calm'],
                noiseAmount: ['volatility', 'anomalies'],
                chromaticShift: ['anomalies', 'volatility'],
                glowIntensity: ['focus', 'urgency'],
                pulse: ['urgency', 'volatility', 'anomalies']
            }
        };
        this.semanticAtmosphereTimestamp = performance.now();
    }
    getSemanticAtmosphereState() {
        const state = this.semanticAtmosphereState || {};
        return { ...state, __sources: state.__sources ? { ...state.__sources } : {} };
    }
    // Phase F.4: semantic → node material reducer (intent only; rendering binds later)
    computeSemanticNodeMaterialIntent() {
        const svs = this.semanticVisualState || {};
        const sas = this.semanticAtmosphereState || {};
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const emissiveBoost = clamp01((svs.focus || 0) * 0.6 + (svs.urgency || 0) * 0.4);
        const glowBias = clamp01((sas.glowIntensity || 0) * 0.7 + (svs.calm || 0) * 0.3);
        const wireIntensity = clamp01((svs.pressure || 0) * 0.6 + (svs.congestion || 0) * 0.4);
        const opacityBias = clamp01((svs.calm || 0) * 0.7 - (svs.volatility || 0) * 0.4);
        const distortion = clamp01((svs.anomalies || 0) * 0.6 + (sas.noiseAmount || 0) * 0.4);
        const pulse = clamp01((sas.pulse || 0) * 0.6 + (svs.urgency || 0) * 0.4);
        this.semanticNodeMaterialIntent = {
            emissiveBoost,
            glowBias,
            wireIntensity,
            opacityBias,
            distortion,
            pulse,
            __sources: {
                emissiveBoost: ['focus', 'urgency'],
                glowBias: ['glowIntensity', 'calm'],
                wireIntensity: ['pressure', 'congestion'],
                opacityBias: ['calm', 'volatility'],
                distortion: ['anomalies', 'noiseAmount'],
                pulse: ['pulse', 'urgency']
            }
        };
        this.semanticNodeMaterialTimestamp = performance.now();
    }
    getSemanticNodeMaterialIntent() {
        const state = this.semanticNodeMaterialIntent || {};
        return { ...state, __sources: state.__sources ? { ...state.__sources } : {} };
    }
    // Phase F.5: semantic → link/field reducer (intent layer only; no link/shader changes)
    computeSemanticLinkFieldIntent() {
        const svs = this.semanticVisualState || {};
        const smi = this.semanticMotionIntent || {};
        const sas = this.semanticAtmosphereState || {};
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const tension = clamp01((svs.pressure || 0) * 0.6 + (svs.congestion || 0) * 0.4);
        const flow = clamp01((smi.drift ? Math.abs(smi.drift) : 0) * 0.5 + (svs.focus || 0) * 0.5);
        const coherence = clamp01((svs.calm || 0) * 0.7 - (svs.volatility || 0) * 0.4);
        const turbulence = clamp01((svs.volatility || 0) * 0.6 + (sas.noiseAmount || 0) * 0.4);
        const attenuation = clamp01((svs.calm || 0) * 0.6 - (svs.urgency || 0));
        const directionality = clamp01((smi.inertia || 0) * 0.6 + (svs.focus || 0) * 0.4);
        this.semanticLinkFieldIntent = {
            tension,
            flow,
            coherence,
            turbulence,
            attenuation,
            directionality,
            __sources: {
                tension: ['pressure', 'congestion'],
                flow: ['drift', 'focus'],
                coherence: ['calm', 'volatility'],
                turbulence: ['volatility', 'noiseAmount'],
                attenuation: ['calm', 'urgency'],
                directionality: ['inertia', 'focus']
            }
        };
        this.semanticLinkFieldTimestamp = performance.now();
    }
    getSemanticLinkFieldIntent() {
        const state = this.semanticLinkFieldIntent || {};
        return { ...state, __sources: state.__sources ? { ...state.__sources } : {} };
    }
    // Phase F.6: semantic → HUD/UI reducer (intent only; no DOM/UI mutation)
    computeSemanticHUDIntent() {
        const svs = this.semanticVisualState || {};
        const sas = this.semanticAtmosphereState || {};
        const smi = this.semanticMotionIntent || {};
        const slf = this.semanticLinkFieldIntent || {};
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const alertness = clamp01((svs.urgency || 0) * 0.5 + (svs.anomalies || 0) * 0.3 + (svs.volatility || 0) * 0.2);
        const readability = clamp01((svs.calm || 0) * 0.7 - (sas.noiseAmount || 0) * 0.2 - (slf.turbulence || 0) * 0.2);
        const emphasis = clamp01((svs.focus || 0) * 0.6 + (svs.pressure || 0) * 0.4);
        const jitter = clamp01((svs.volatility || 0) * 0.4 + (smi.tremor || 0) * 0.4 + (sas.noiseAmount || 0) * 0.2);
        const density = clamp01((svs.congestion || 0) * 0.5 + (slf.tension || 0) * 0.5);
        const calmness = clamp01((svs.calm || 0) * 0.7 - (svs.urgency || 0) * 0.3);
        this.semanticHUDIntent = {
            alertness,
            readability,
            emphasis,
            jitter,
            density,
            calmness,
            __sources: {
                alertness: ['urgency', 'anomalies', 'volatility'],
                readability: ['calm', 'noiseAmount', 'turbulence'],
                emphasis: ['focus', 'pressure'],
                jitter: ['volatility', 'tremor', 'noiseAmount'],
                density: ['congestion', 'tension'],
                calmness: ['calm', 'urgency']
            }
        };
        this.semanticHUDIntentTimestamp = performance.now();
    }
    getSemanticHUDIntent() {
        const state = this.semanticHUDIntent || {};
        return { ...state, __sources: state.__sources ? { ...state.__sources } : {} };
    }
    smoothValue(prev, next, alpha, hysteresis) {
        if (prev === undefined || prev === null) return next;
        if (Math.abs(next - prev) < hysteresis) return prev;
        return prev + alpha * (next - prev);
    }
    // Phase G.2: apply smoothing/hysteresis to derived semantic intents (no behavior change)
    applySemanticSmoothing(now) {
        if (!this.semanticSmoothing.enabled) return;
        if (now - this.semanticSmoothingState.lastUpdate < this.semanticSmoothing.minDeltaMs) return;
        const { alpha, hysteresis } = this.semanticSmoothing;
        const smoothState = (target, cacheKey) => {
            const prev = this.semanticSmoothingState[cacheKey] || {};
            const smoothed = { ...target };
            for (const key of Object.keys(smoothed)) {
                if (key === '__sources' || key === '__smoothed' || key === '__raw') continue;
                if (typeof smoothed[key] === 'number') {
                    const prevVal = typeof prev[key] === 'number' ? prev[key] : smoothed[key];
                    smoothed[key] = this.smoothValue(prevVal, smoothed[key], alpha, hysteresis);
                }
            }
            smoothed.__smoothed = true;
            smoothed.__raw = target;
            this.semanticSmoothingState[cacheKey] = smoothed;
            return smoothed;
        };
        this.semanticVisualState = smoothState(this.semanticVisualState, 'visual');
        this.semanticMotionIntent = smoothState(this.semanticMotionIntent, 'motion');
        this.semanticAtmosphereState = smoothState(this.semanticAtmosphereState, 'atmosphere');
        this.semanticNodeMaterialIntent = smoothState(this.semanticNodeMaterialIntent, 'nodeMaterial');
        this.semanticHUDIntent = smoothState(this.semanticHUDIntent, 'hud');
        this.semanticSmoothingState.lastUpdate = now;
    }
    // Phase G.3: apply semantic profile (lens-only modulation; post-smoothing, pre-invariants)
    applySemanticProfile(now) {
        const clamp01 = (v) => Math.min(1, Math.max(0, v));
        const applyScaleBias = (value, scale, bias) => {
            let out = value;
            if (scale !== undefined) out = value * scale;
            if (bias !== undefined) out = out + bias;
            return clamp01(out);
        };
        const blendNumber = (a, b, tVal, biasDefault = 0, scaleDefault = 1) => {
            const va = a === undefined ? (scaleDefault !== 1 ? scaleDefault : biasDefault) : a;
            const vb = b === undefined ? (scaleDefault !== 1 ? scaleDefault : biasDefault) : b;
            return va + (vb - va) * tVal;
        };
        const blendProfileModifiers = (fromName, toName, tVal) => {
            const from = this.semanticProfiles[fromName] || {};
            const to = this.semanticProfiles[toName] || {};
            return {
                volatilityScale: blendNumber(from.volatilityScale, to.volatilityScale, tVal, 0, 1),
                urgencyScale: blendNumber(from.urgencyScale, to.urgencyScale, tVal, 0, 1),
                calmBias: blendNumber(from.calmBias, to.calmBias, tVal, 0, 0),
                anomalyAmplification: blendNumber(from.anomalyAmplification, to.anomalyAmplification, tVal, 0, 1),
                jitterDamping: blendNumber(from.jitterDamping, to.jitterDamping, tVal, 0, 0),
                motionInertiaScale: blendNumber(from.motionInertiaScale, to.motionInertiaScale, tVal, 0, 1),
                hudEmphasisScale: blendNumber(from.hudEmphasisScale, to.hudEmphasisScale, tVal, 0, 1),
                fxIntensityScale: blendNumber(from.fxIntensityScale, to.fxIntensityScale, tVal, 0, 1)
            };
        };
        const resolvedProfiles = this.resolveSemanticProfiles(now);
        const profileStackTag = { global: this.semanticProfileStack.global, local: [], context: [] };
        // Visual
        if (this.semanticVisualState) {
            let svs = { ...this.semanticVisualState };
            const gate = this.getProfileGateFactor('visual');
            for (const layer of resolvedProfiles) {
                const mods = blendProfileModifiers(layer.from, layer.to, layer.t);
                if (mods.volatilityScale !== undefined && typeof svs.volatility === 'number') {
                    svs.volatility = applyScaleBias(svs.volatility, mods.volatilityScale);
                }
                if (mods.urgencyScale !== undefined && typeof svs.urgency === 'number') {
                    svs.urgency = applyScaleBias(svs.urgency, mods.urgencyScale);
                }
                if (mods.calmBias !== undefined && typeof svs.calm === 'number') {
                    svs.calm = applyScaleBias(svs.calm, 1, mods.calmBias);
                }
                if (mods.anomalyAmplification !== undefined && typeof svs.anomalies === 'number') {
                    svs.anomalies = applyScaleBias(svs.anomalies, mods.anomalyAmplification);
                }
                if (layer.source === 'local') profileStackTag.local.push(layer.name);
                if (layer.source === 'context') profileStackTag.context.push(layer.name);
            }
            for (const key of Object.keys(svs)) {
                if (typeof svs[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                    svs[key] = svs[key] * gate;
                }
            }
            svs.__profileStack = profileStackTag;
            this.semanticVisualState = svs;
        }
        // Motion
        if (this.semanticMotionIntent) {
            let smi = { ...this.semanticMotionIntent };
            const gate = this.getProfileGateFactor('motion');
            for (const layer of resolvedProfiles) {
                const mods = blendProfileModifiers(layer.from, layer.to, layer.t);
                if (mods.motionInertiaScale !== undefined && typeof smi.inertia === 'number') {
                    smi.inertia = applyScaleBias(smi.inertia, mods.motionInertiaScale);
                }
            }
            for (const key of Object.keys(smi)) {
                if (typeof smi[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                    smi[key] = smi[key] * gate;
                }
            }
            smi.__profileStack = profileStackTag;
            this.semanticMotionIntent = smi;
        }
        // Atmosphere
        if (this.semanticAtmosphereState) {
            let sas = { ...this.semanticAtmosphereState };
            const gate = this.getProfileGateFactor('atmosphere');
            for (const layer of resolvedProfiles) {
                const mods = blendProfileModifiers(layer.from, layer.to, layer.t);
                if (mods.fxIntensityScale !== undefined) {
                    const applyFx = (key) => {
                        if (typeof sas[key] === 'number') {
                            sas[key] = applyScaleBias(sas[key], mods.fxIntensityScale);
                        }
                    };
                    applyFx('glowIntensity');
                    applyFx('pulse');
                    applyFx('noiseAmount');
                    applyFx('chromaticShift');
                }
            }
            for (const key of Object.keys(sas)) {
                if (typeof sas[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                    sas[key] = sas[key] * gate;
                }
            }
            sas.__profileStack = profileStackTag;
            this.semanticAtmosphereState = sas;
        }
        // Node material
        if (this.semanticNodeMaterialIntent) {
            let nm = { ...this.semanticNodeMaterialIntent };
            const gate = this.getProfileGateFactor('nodeMaterial');
            for (const layer of resolvedProfiles) {
                const mods = blendProfileModifiers(layer.from, layer.to, layer.t);
                if (mods.hudEmphasisScale !== undefined && typeof nm.emissiveBoost === 'number') {
                    nm.emissiveBoost = applyScaleBias(nm.emissiveBoost, mods.hudEmphasisScale);
                }
                if (mods.fxIntensityScale !== undefined && typeof nm.glowBias === 'number') {
                    nm.glowBias = applyScaleBias(nm.glowBias, mods.fxIntensityScale);
                }
            }
            for (const key of Object.keys(nm)) {
                if (typeof nm[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                    nm[key] = nm[key] * gate;
                }
            }
            nm.__profileStack = profileStackTag;
            this.semanticNodeMaterialIntent = nm;
        }
        // HUD
        if (this.semanticHUDIntent) {
            let hud = { ...this.semanticHUDIntent };
            const gate = this.getProfileGateFactor('hud');
            for (const layer of resolvedProfiles) {
                const mods = blendProfileModifiers(layer.from, layer.to, layer.t);
                if (mods.hudEmphasisScale !== undefined && typeof hud.emphasis === 'number') {
                    hud.emphasis = applyScaleBias(hud.emphasis, mods.hudEmphasisScale);
                }
                if (mods.jitterDamping !== undefined && typeof hud.jitter === 'number') {
                    hud.jitter = applyScaleBias(hud.jitter, 1 - mods.jitterDamping);
                }
            }
            for (const key of Object.keys(hud)) {
                if (typeof hud[key] === 'number' && key !== '__smoothed' && key !== '__raw') {
                    hud[key] = hud[key] * gate;
                }
            }
            hud.__profileStack = profileStackTag;
            this.semanticHUDIntent = hud;
        }
        if (this.semanticProfileTransition.active && this.getSemanticProfileBlend(now).t >= 1) {
            this.activeSemanticProfile = this.semanticProfileTransition.to;
            this.semanticProfileStack.global = this.semanticProfileTransition.to;
            this.semanticProfileTransition.active = false;
        }
        this.pruneContextProfiles(now);
    }
    // Phase G.1: evaluate semantic guardrails (passive; records diagnostics only)
    evaluateSemanticInvariants() {
        const now = performance.now();
        const warnings = [];
        const violations = [];
        const hud = this.semanticHUDIntent || {};
        const svs = this.semanticVisualState || {};
        const stats = this.stats || {};
        // Calm + alertness budget check
        if ((hud.calmness || 0) + (hud.alertness || 0) > this.semanticInvariants.calmUrgencyMax) {
            warnings.push('Calmness + alertness exceeds configured maximum.');
        }
        // Jitter growth trend
        const jitter = hud.jitter || 0;
        if (jitter > this.lastJitter) {
            this.jitterGrowthFrames += 1;
        } else {
            this.jitterGrowthFrames = 0;
        }
        this.lastJitter = jitter;
        if (this.jitterGrowthFrames > this.semanticInvariants.maxJitterGrowthFrames) {
            warnings.push('Jitter increasing over multiple frames.');
        }
        // Escalation duration
        if (this.escalationState) {
            for (const [key, state] of this.escalationState) {
                if (state.level > 0) {
                    const start = this.escalationActiveSince.get(key) ?? now;
                    this.escalationActiveSince.set(key, start);
                    if (now - start > this.semanticInvariants.maxEscalationDurationMs) {
                        violations.push(`Escalation active too long for ${key}.`);
                    }
                } else {
                    this.escalationActiveSince.delete(key);
                }
            }
        }
        // Suppression ratio
        const processedCount = Array.isArray(stats.eventsProcessed) ? stats.eventsProcessed.reduce((a, b) => a + b, 0) : 0;
        const totalEvents = processedCount + (stats.droppedEvents || 0) + (stats.suppressedEvents || 0);
        if (totalEvents > 0) {
            const suppressionRatio = (stats.suppressedEvents || 0) / totalEvents;
            if (suppressionRatio > this.semanticInvariants.maxSuppressionRatio) {
                warnings.push('Suppression ratio above threshold.');
            }
        }
        // Health score is informational only
        const score = Math.max(0, 1 - warnings.length * 0.1 - violations.length * 0.2);
        this.semanticHealth = {
            score,
            warnings,
            violations,
            lastCheck: now,
            profile: {
                active: this.semanticProfileStack.global,
                modifiers: this.semanticProfiles[this.semanticProfileStack.global] || {},
                stack: this.getSemanticProfileStack()
            },
            transition: {
                ...this.semanticProfileTransition
            },
            recommendation: this.semanticProfileRecommendation,
            authority: {
                active: this.semanticAuthorityLockState.active,
                source: this.semanticAuthorityLockState.source,
                priority: this.semanticAuthorityLockState.priority,
                locks: this.semanticAuthorityLockState.locks,
                constraints: this.semanticAuthorityLockState.constraints,
                remainingMs: this.semanticAuthorityLockState.durationMs
                    ? Math.max(0, (this.semanticAuthorityLockState.startTime + this.semanticAuthorityLockState.durationMs) - now)
                    : null,
                affectedDomains: Object.keys(this.semanticAuthorityLockState.locks || {}),
                resolved: this.semanticAuthorityState
            }
        };
    }
    getSemanticHealth() {
        return {
            score: this.semanticHealth.score,
            warnings: [...this.semanticHealth.warnings],
            violations: [...this.semanticHealth.violations],
            lastCheck: this.semanticHealth.lastCheck,
            profile: this.semanticHealth.profile,
            transition: this.semanticHealth.transition,
            recommendation: this.semanticHealth.recommendation,
            authority: this.semanticHealth.authority,
            profileGate: {
                active: this.semanticProfileGate.enabled !== false,
                global: this.semanticProfileGate.globalFactor,
                scopes: this.semanticProfileGate.perScope
            },
            budget: {
                factors: this.semanticBudgetState.factors,
                loads: this.semanticBudgetState.loads,
                timestamp: this.semanticBudgetState.timestamp
            }
        };
    }
    getSemanticBudgetState() {
        return {
            factors: this.semanticBudgetState.factors,
            loads: this.semanticBudgetState.loads,
            timestamp: this.semanticBudgetState.timestamp
        };
    }
}
/**
 * RUNTIME API ADAPTER: safeTick()
 * ============================================================================
 * Universal system execution adapter for ATOMA systems.
 * Eliminates runtime errors from mismatched update method names.
 * 
 * Tries execution methods in deterministic order:
 * 1. update(...)   - Standard method
 * 2. tick(...)     - Alternative method
 * 3. process(...) - Processing method
 * 4. step(...)     - Step method
 * 5. None         - Event-driven (silent, no crash)
 * 
 * Accepts variadic arguments, forwards all to the method.
 * 
 * GUARANTEES:
 * - Never throws if system missing or method unavailable
 * - Works with any current or future system
 * - Pure runtime wiring (zero class modifications)
 * - Deterministic behavior (always same method tried first)
 * - Handles single or multiple parameters transparently
 * 
 * Usage:
 *   safeTick(system, deltaTime);                  // Single param
 *   safeTick(system, deltaTime, currentTime);     // Multiple params
 */
function safeTick(system, ...args) {
  if (!system) return;

  if (typeof system.update === 'function') {
    system.update(...args);
    return;
  }

  if (typeof system.tick === 'function') {
    system.tick(...args);
    return;
  }

  if (typeof system.process === 'function') {
    system.process(...args);
    return;
  }

  if (typeof system.step === 'function') {
    system.step(...args);
    return;
  }

  // Event-driven systems or systems with no per-frame method: silent no-op
}

const BOOTABLE_WORLD_IDS = new Set(['fractal', 'quantum', 'desert', 'desert2', 'memory', 'chamber', 'sigma']);

function normalizeStartupWorldId(value) {
    if (typeof value !== 'string') {
        return 'quantum';
    }

    const normalized = value.trim().toLowerCase();
    return BOOTABLE_WORLD_IDS.has(normalized) ? normalized : 'quantum';
}

class AtomaGame {
    constructor(options = {}) {
        this.bootOptions = options && typeof options === 'object' ? options : {};
        // ========================================================================
        // STEP 1 — GLOBAL AUTHORITY FLAGS (CRITICAL STABILIZATION)
        // ========================================================================
        window.DEBUG_VISUAL_MODE = false;
        console.log("⚠️ DEBUG_VISUAL_MODE ENABLED - Visuals Disabled, Interactions Hardened");
        if (typeof window !== 'undefined' && window.DEBUG_VISUAL_MODE) {
            installMaterialDebugGuard();
        }
        document.documentElement.classList.add('atoma-no-blur');
        document.documentElement.classList.add('atoma-no-animated-glow');
        if (window?.ATOMA_FLAGS?.safety?.disableParasiticHUDs) {
            document.documentElement.classList.add('atoma-disable-parasitic-huds');
        }
        if (window?.ATOMA_FLAGS?.safety?.hardKillParasiticDOM) {
            document.documentElement.classList.add('atoma-hard-kill-parasitic-dom');
        }
        if (window?.ATOMA_FLAGS?.safety?.hardOffLanguageEngine) {
            document.documentElement.classList.add('atoma-hard-off-language-engine');
        }
        
        // ========================================================================
        // STEP 1b — HARD INTERACTION AUTHORITY (Session 104 Critical Stabilization)
        // ========================================================================
        setVisualLock(false);
        console.log('🔒 [AtomaGame] VISUAL_AUTHORITY_LOCK ENABLED - Hard interaction authority engaged');

        document.addEventListener("contextmenu", e => e.preventDefault());

        // ================================
        //   🔥 DISABLE MYTHIC RITUALS
        // ================================
        window.ATOMA_DISABLE_MYTHIC_RITUALS = window.ATOMA_FLAGS?.safety?.disableMythicRituals ?? false;
        window.ATOMA_DISABLE_PHASE8_NETWORK_RITUALS = window.ATOMA_FLAGS?.safety?.disablePhase8NetworkRituals ?? false;
        console.log(`🔥 [AtomaGame] Mythic Rituals ${window.ATOMA_DISABLE_MYTHIC_RITUALS ? 'disabled' : 'enabled'}`);
        
        this.clock = new THREE.Clock();
        this.time = 0;
        this.isPaused = false;
        this._switchInProgress = false;
        this._switchCallId = 0;

        // PERFORMANCE: Per-frame memoized caches
        this._activeLinkCountCache = 0;
        this._activeLinkCountFrame = -1;

        // ALPHA CLARITY: Minimal gameplay hint layer
        this.gameplayHintLayer = new GameplayHintLayer();
        this._hintFirstLinkShown = false;
        this._hintRewindBlockShown = false;
        this._hintRewindStartShown = false;
        this.firstRunGuidanceDirector = null;
        this.runIdentityDirector = null;
        this.activeRunIdentitySelection = null;
        this._runIdentityPendingSelection = null;
        this._setupFirstRunGuidanceDirector();
        this._setupRunIdentityDirector();
        
        // ========================================================================
        // PHASE MMD-1: MATERIAL MUTATION DETECTOR
        // Diagnostic-only system for detecting runtime material mutations
        // ========================================================================
        installMaterialMutationDetector(THREE);
        console.log('[MMD] Material Mutation Detector installed (use window.ATOMA_FLAGS.debug.materialMutations = true to enable)');
        
        this.frameClock = new FrameClock();
        this.lastRenderFrame = -1;
        window.frameClock = this.frameClock;
        window.debugFrameClock = () => this.frameClock.getStats();
        this.updateValidator = new FrameUpdateLoopOrderValidator_v1();
        // L.3 OBSERVATION ONLY — DO NOT OPTIMIZE HERE
        this.renderProfile = new RenderCostProfile();
        if (typeof window !== 'undefined') {
            window.__ATOMA_RENDER_PROFILE__ = {
                getSnapshot: () => this.renderProfile.getSnapshot(),
                getAverages: () => this.renderProfile.getAverages(),
                reset: () => this.renderProfile.reset(),
                setEnabled: (enabled) => this.renderProfile.setEnabled(enabled)
            };
        }
        this.materialRegistry = materialRegistry;
        this.semanticBus = new SemanticEventBus();
        window.semanticBus = this.semanticBus;
        const loreEngine = new LoreUnlockEngine();
        this.loreEngine = loreEngine;
        this._loreUnlockBridgeBound = false;
        this._loreUnlockBridgeUnsub = null;
        this._loreUnlockBridgeBus = null;
        this._setupLoreUnlockBridge();
        this.metricDirtyQueue = globalThis.__ATOMA_METRIC_DIRTY_QUEUE__ || createMetricDirtyQueue();
        globalThis.__ATOMA_METRIC_DIRTY_QUEUE__ = this.metricDirtyQueue;
        window.__ATOMA_METRIC_DIRTY_QUEUE__ = this.metricDirtyQueue;
        
        // ========================================================================
        // ATOMA EVENT FIRE FREQUENCY AUDIT
        // Runtime audit to track which events are actually firing
        // ========================================================================
        this.semanticBus.animate(); // Start the 5-second audit logging loop
        
        // ========================================================================
        // CASCADE EVENT AUDIT (Temporary Runtime Check)
        // ========================================================================
        if (window.semanticBus) {
            window.semanticBus.on("cascade.start", (e) => {
                console.log("⚡ CASCADE START", e);
            });

            window.semanticBus.on("cascade.hop", (e) => {
                console.log("⚡ CASCADE HOP", e);
            });

            window.semanticBus.on("cascade.end", (e) => {
                console.log("⚡ CASCADE END", e);
            });

            console.log("CASCADE AUDIT SUBSCRIBED - Monitoring for cascade.start, cascade.hop, cascade.end events");
        }
        
        window.__ATOMA_SEMANTIC_STATS__ = () => this.semanticBus.getStats();
        window.__ATOMA_SEMANTIC_QUEUE__ = () => this.semanticBus.getQueueSizes();
        window.__ATOMA_SEMANTIC_DRAIN__ = (ms = 2) => this.semanticBus.drain(ms);
        // Phase E.7: semantic observability helpers (read-only views for HUD/console/agents)
        window.ATOMA_SEMANTIC_SNAPSHOT = () => this.semanticBus.getSemanticSnapshot();
        window.ATOMA_SEMANTIC_STATS = () => this.semanticBus.getStats();
        window.ATOMA_SEMANTIC_EXPLAIN = (evt) => this.semanticBus.explainEvent(evt);
        // Phase E.8: semantic trace replay APIs (time-travel debugging, read-only)
        window.ATOMA_SEMANTIC_TRACE = (opts) => this.semanticBus.getSemanticTrace(opts);
        window.ATOMA_SEMANTIC_REPLAY = (fn) => this.semanticBus.replaySemanticTrace(fn);
        window.ATOMA_SEMANTIC_TRACE_CLEAR = () => this.semanticBus.clearSemanticTrace();
        // Phase F.1: semantic → visual contract (read-only derived visual state)
        window.ATOMA_SEMANTIC_VISUAL_STATE = () => this.semanticBus.getSemanticVisualState();
        // Phase F.2: semantic → motion intent (read-only derived signals for camera layer)
        window.ATOMA_SEMANTIC_MOTION = () => this.semanticBus.getSemanticMotionIntent();
        // Phase F.3: semantic → FX/atmosphere intent (read-only derived signals for future FX binding)
        window.ATOMA_SEMANTIC_ATMOSPHERE = () => this.semanticBus.getSemanticAtmosphereState();
        // Phase F.4: semantic → node material intent (read-only derived signals for material binding)
        window.ATOMA_SEMANTIC_NODE_MATERIAL = () => this.semanticBus.getSemanticNodeMaterialIntent();
        // Phase F.5: semantic → link/field intent (read-only derived signals for link/field binding)
        window.ATOMA_SEMANTIC_LINK_FIELD = () => this.semanticBus.getSemanticLinkFieldIntent();
        // Phase F.6: semantic → HUD/UI intent (read-only derived signals for HUD binding)
        window.ATOMA_SEMANTIC_HUD = () => this.semanticBus.getSemanticHUDIntent();
        // Phase G.1: semantic guardrails diagnostics (read-only health snapshot)
        window.ATOMA_SEMANTIC_HEALTH = () => this.semanticBus.getSemanticHealth();
        // Phase G.2: semantic smoothing observability (read-only config/state)
        window.ATOMA_SEMANTIC_SMOOTHING = () => ({
            config: this.semanticBus.semanticSmoothing,
            state: this.semanticBus.semanticSmoothingState
        });
        // Phase G.3: semantic profile controls (lens-only modulation)
        window.ATOMA_SEMANTIC_PROFILE_GET = () => this.semanticBus.activeSemanticProfile;
        window.ATOMA_SEMANTIC_PROFILE_SET = (name) => this.semanticBus.setSemanticProfile(name);
        window.ATOMA_SEMANTIC_PROFILES = () => Object.keys(this.semanticBus.semanticProfiles || {});
        window.ATOMA_SEMANTIC_PROFILE_TRANSITION = () => ({ ...this.semanticBus.semanticProfileTransition });
        window.ATOMA_SEMANTIC_PROFILE_RECOMMENDATION = () => this.semanticBus.semanticProfileRecommendation;
        window.ATOMA_SEMANTIC_PROFILE_TRIGGERS = () => Object.keys(this.semanticBus.semanticProfileTriggers || {});
        window.ATOMA_SEMANTIC_PROFILE_STACK = () => this.semanticBus.getSemanticProfileStack();
        window.ATOMA_SEMANTIC_AUTHORITY_GET = () => ({ ...this.semanticBus.semanticAuthorityLockState });
        window.ATOMA_SEMANTIC_AUTHORITY_SET = (name, cfg) => this.semanticBus.setSemanticAuthority(name, cfg);
        window.ATOMA_SEMANTIC_AUTHORITY_CLEAR = (name) => this.semanticBus.clearSemanticAuthority(name);
        window.ATOMA_SEMANTIC_AUTHORITIES = () => ({
            active: Array.from(this.semanticBus.semanticAuthorities.values()),
            resolved: this.semanticBus.semanticAuthorityState
        });
        window.ATOMA_SEMANTIC_PROFILE_GATE = () => ({
            gate: this.semanticBus.semanticProfileGate,
            authority: this.semanticBus.semanticAuthorityState
        });
        window.ATOMA_SEMANTIC_BUDGET = () => this.semanticBus.getSemanticBudgetState();
        this.hudAccumulator = 0;
        this.hudTargetHz = 20;
        this.hudLastPos = new THREE.Vector3();
        this.hudLastRot = new THREE.Euler();
        this.hudTempDelta = new THREE.Vector3();
        this.hudWakeUntil = 0;
        this.hudCriticalAcc = 0;
        this.hudAmbientAcc = 0;
        this.hudVisibility = {
            critical: true,
            ambient: true,
            panels: {
                nodeInspector: false,
                metricsOverlay: true,
                systemState: true,
                zoneOverlay: false
            }
        };
        this._aiHudLastRefresh = 0;
        this.hudDirty = {
            coreMetrics: true,
            nodeInspector: false,
            ambient: true
        };
        this.lastCameraMotionEvent = 0;
        this.semanticDebugLastLog = 0;
        this.hudAccumulator = 0;
        this.hudTargetHz = 20;
        this.hudLastPos = new THREE.Vector3();
        this.hudLastRot = new THREE.Euler();
        this.hudTempDelta = new THREE.Vector3();
        this.nodeUiAcc = 0;
        this.undoUiAcc = 0;
        // Cadence controls: keep motion at 60 Hz; throttle interpretation/UI to lighter rates
        this.semanticVisualAcc = 0;
        this.semanticVisualInterval = 1 / 30; // ~30 Hz for visual/UI recompute
        this.semanticSlowAcc = 0;
        this.semanticSlowInterval = 0.1; // ~10 Hz for deep semantic layers
        this.semanticCadenceLogMs = 5000;
        this.semanticCadenceLastLog = 0;
        this.semanticSlowCadenceLastLog = 0;
        this._runVisualSemanticPending = false;
        this._pendingVisualSemanticDt = 0;
        this._pendingMark = null;
        this._runSlowSemanticPending = false;
        this._pendingSlowSemanticDt = 0;
        this._runElasticityPending = false;
        this._pendingElasticityDt = 0;
        this._runSynergyPulsePending = false;
        this._pendingSynergyPulseDt = 0;
        this._runHarmonicResonancePending = false;
        this._pendingHarmonicResonanceDt = 0;
        this._runHarmonicHubAuraPending = false;
        this._pendingHarmonicHubAuraDt = 0;
        this._runHarmonicInfluencePending = false;
        this._pendingHarmonicInfluenceDt = 0;
        this._runCascadeVisualizerPending = false;
        this._pendingCascadeVisualizerDt = 0;
        this._runLinkResonanceFlowPending = false;
        this._pendingLinkResonanceFlowDt = 0;
        this._runHarmonicPhaseSyncPending = false;
        this._pendingHarmonicPhaseSyncDt = 0;
        this._runHarmonicNodeHalosPending = false;
        this._pendingHarmonicNodeHalosDt = 0;
        this.updateValidator.registerUpdateSystem('cameraController.update', 1, 1.0);
        this.updateValidator.registerUpdateSystem('playerController.update', 2, 1.0);
        this.updateValidator.registerUpdateSystem('aiNodes.update', 3, 4.0);
        this.updateValidator.registerUpdateSystem('coreMetricsOverlay.update', 4, 3.0);
        this.updateValidator.registerUpdateSystem('renderer.render', 5, 16.0);
        
        // ========================================================================
        // PHASE B: FRAME SCHEDULER INTEGRATION (Controlled Registration)
        // === RENDER CONTRACT (LOCKED) ===
// renderer.render() MUST be called:
// 1) EXACTLY ONCE per frame
// 2) ALWAYS as the LAST step of runRenderTick()
// 3) ONLY from FrameScheduler
//
// Any direct or indirect renderer.render() call
// outside this function is a BUG.
//
// Reason:
// - deterministic frame timing
// - no OUT_OF_ORDER_UPDATE
// - stable performance & observability
        // ========================================================================
        this.frameScheduler = new FrameScheduler();
        window.frameScheduler = this.frameScheduler;
        window.debugSchedulerStats = () => this.frameScheduler.getStats();
        window.debugSchedulerList = () => this.frameScheduler.listSystems();
        this.frameScheduler.register('background', () => EnhancedNodeModels.ensureRegistryReady?.(), 'registry-warmup');
        this.frameScheduler.register('background', (dt) => {
            if (this.harmonicTopology?.enabled) {
                this.harmonicTopology.update(
                    dt,
                    this.linkSemanticPictograms?.fusionZoneManager,
                    this.linkingSystem
                );
            }
        }, 'background.harmonicTopology');
        this.frameScheduler.register('visual', (dt) => {
            if (this.proceduralGlyphGenerator?.enabled) {
                this.proceduralGlyphGenerator.update(dt);
            }
        }, 'visual.proceduralGlyphGenerator');
        markReleaseContainmentRuntime(this, 'proceduralHarmonicGlyphGenerator', { scheduled: true });
        this.frameScheduler.register('background', (dt) => {
            if (this.harmonicCycleController?.enabled) {
                const harmonicNetworkState = {
                    harmony: this.nodeDynamicMetrics?.avgHarmony || 0.5,
                    corruption: this.nodeDynamicMetrics?.avgCorruption || 0,
                    stability: this.nodeDynamicMetrics?.avgStability || 0.5,
                    synergy: this.nodeDynamicMetrics?.avgSynergy || 0
                };
                this.harmonicCycleController.update(dt, harmonicNetworkState);
            }
        }, 'background.harmonicCycleController');
        // === UPDATE LANE ORDER (Fáza C, bod 14) ===
        // FrameScheduler order is: realtime -> visual -> simulation -> background.
        // Keep metrics aggregator in SIMULATION lane (single source, no duplicates).
        // This guarantees deterministic ordering for simulation readers in the same lane
        // as long as this registration happens before their registration.
        if (this.frameScheduler?.isRegistered?.('background.networkMetricsAggregator') === true) {
            this.frameScheduler.unregister('background.networkMetricsAggregator');
        }
        if (this.frameScheduler?.isRegistered?.('simulation.metricsAggregator') === true) {
            this.frameScheduler.unregister('simulation.metricsAggregator');
        }
        this.frameScheduler.register(
            'simulation',
            () => this.metricsRuntime_v1?.runNetworkMetricsAggregator?.(),
            'simulation.metricsAggregator'
        );
        this.frameScheduler.register('background', (dt) => {
            this.narrativePatterns?.update?.(dt, this.aiNodes?.nodes, this.linkingSystem?.links, this.worldMetrics || {});
        }, 'background.narrativePatterns');
        this.frameScheduler.register('background', (dt) => {
            if (this.environmentDomain?.instances?.worldEvents) return;
            this.worldEvents?.update?.(dt, this.legendaryPack, this.linkingSystem, this.evolutionManager);
        }, 'background.worldEvents');
        this.frameScheduler.register('background', (dt) => {
            if (this.environmentDomain?.instances?.weatherPack) return;
            this.weatherPack?.update?.(dt, this.scene, this.camera);
        }, 'background.weatherPack');
        this.frameScheduler.register('visual', (dt) => {
            this.ambientEntityManager?.update?.(dt);
        }, 'visual.ambientEntityManager');
        if (this.frameScheduler?.isRegistered?.('background.consciousnessLayer') === true) {
            this.frameScheduler.unregister('background.consciousnessLayer');
        }
        this.frameScheduler.register('visual', (dt) => {
            this.consciousnessLayer?.update?.(dt);
        }, 'visual.consciousnessLayer');
        this.frameScheduler.register('background', (dt) => {
            this.poetryEngine?.update?.(dt);
        }, 'background.poetryEngine');
        this.frameScheduler.register('background', (dt) => {
            this.emotionalFeed?.update?.(dt);
        }, 'background.emotionalFeed');
        this.frameScheduler.register('background', () => {
            if (this._runSlowSemanticPending) {
                this._runSlowSemanticPending = false;
            }
        }, 'background.slowSemanticReset');
        this.frameScheduler.register('background', (dt) => {
            this._coreMaterialMutationSweepAcc = (this._coreMaterialMutationSweepAcc || 0) + dt;
            if (this._coreMaterialMutationSweepAcc < 5) return;
            this._coreMaterialMutationSweepAcc = 0;
            this.coreMaterialMutationDetector?.checkAllCores?.();
        }, 'background.coreMaterialMutationDetector');
        this.frameScheduler.register('background', (dt) => {
            this._coreMaterialPropertyLockAcc = (this._coreMaterialPropertyLockAcc || 0) + dt;
            if (this._coreMaterialPropertyLockAcc < 5) return;
            this._coreMaterialPropertyLockAcc = 0;
            this.coreMaterialPropertyLock?.enforceFrame?.();
        }, 'background.coreMaterialPropertyLock');
        // LEGACY/april — FXPerformanceScaler disconnected 2026-04-22 (was multiplying by 1.0 every tick)
        // this.frameScheduler.register('simulation', (dt) => {
        //     if (this.fxPerformanceScaler) {
        //         this.fxPerformanceScaler.update(dt);
        //     }
        // }, 'simulation.fxPerformanceScaler');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.adaptivePerformanceMonitor) {
                this.adaptivePerformanceMonitor.update(dt);
            }
        }, 'simulation.adaptivePerformanceMonitor');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.fxPerformanceTransition) {
                this.fxPerformanceTransition.update(dt);
            }
        }, 'simulation.fxPerformanceTransition');
        this.frameScheduler.register('simulation', () => {
            if (this.audioSystem) {
                const canonicalWorldContext = this._getAudioWorldContext();
                this.audioSystem.update?.(dt, {
                    ...canonicalWorldContext,
                    semanticBus: this.semanticBus
                });
                this.harmonicAudio?.setAudioIdentityContext?.(canonicalWorldContext.audioIdentity);
            }
            this.metricDirtyQueue?.clear();
        }, 'simulation.metricDirtyQueueReset');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.linkSemanticMetricsBridge) {
                this.linkSemanticMetricsBridge.update(dt);
            }
        }, 'simulation.linkSemanticMetricsBridge');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.synapticGatingAdapter && this.aiNodes) {
                this.synapticGatingAdapter.updateNodeGates(this.aiNodes.nodes || [], this.time * 1000);
            }
        }, 'simulation.synapticGatingAdapter');
        markReleaseContainmentRuntime(this, 'synapticGating', { scheduled: true });
        this.frameScheduler.register('simulation', (dt) => {
            if (this.synapticFatigueAdapter && this.aiNodes) {
                const currentTimeMs = this.time * 1000;
                const gatingResult = this.synapticGatingAdapter?.nodeGateMap
                    ? { gateMap: this.synapticGatingAdapter.nodeGateMap, dirtyNodeIds: this.synapticGatingAdapter.dirtyNodeIds }
                    : this.synapticGatingAdapter?.updateNodeGates(this.aiNodes.nodes || [], currentTimeMs) || null;
                this.metricDirtyQueue?.markNodes(gatingResult?.dirtyNodeIds || this.synapticGatingAdapter?.dirtyNodeIds || null);
                const dirtyNodeIds = this.metricDirtyQueue?.snapshotNodeIds() || gatingResult?.dirtyNodeIds || null;
                this.synapticFatigueAdapter.updateFatigue(
                    this.aiNodes.nodes || [],
                    gatingResult?.gateMap || this.synapticGatingAdapter?.nodeGateMap || new Map(),
                    dt,
                    currentTimeMs,
                    dirtyNodeIds
                );
            }
        }, 'simulation.synapticFatigueAdapter');
        markReleaseContainmentRuntime(this, 'synapticFatigue', { scheduled: true });
        this.frameScheduler.register('simulation', (dt) => {
            if (this.networkFatigueSystem && this.aiNodes) {
                this.networkFatigueSystem.update(dt);
            }
        }, 'simulation.networkFatigueSystem');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.synapticSpecializationAdapter && this.aiNodes) {
                const currentTimeMs = this.time * 1000;
                const gatingResult = this.synapticGatingAdapter?.nodeGateMap
                    ? { gateMap: this.synapticGatingAdapter.nodeGateMap, dirtyNodeIds: this.synapticGatingAdapter.dirtyNodeIds }
                    : this.synapticGatingAdapter?.updateNodeGates(this.aiNodes.nodes || [], currentTimeMs) || null;
                this.metricDirtyQueue?.markNodes(gatingResult?.dirtyNodeIds || this.synapticGatingAdapter?.dirtyNodeIds || null);
                const dirtyNodeIds = this.metricDirtyQueue?.snapshotNodeIds() || gatingResult?.dirtyNodeIds || null;
                this.synapticSpecializationAdapter.updateSpecialization(
                    this.aiNodes.nodes || [],
                    gatingResult?.gateMap || this.synapticGatingAdapter?.nodeGateMap || new Map(),
                    dt,
                    currentTimeMs,
                    dirtyNodeIds
                );
            }
        }, 'simulation.synapticSpecializationAdapter');
        markReleaseContainmentRuntime(this, 'synapticSpecialization', { scheduled: true });
        this.frameScheduler.register('simulation', (dt) => {
            if (this.competitionDominance && this.aiNodes) {
                this.competitionDominance.update(
                    this.aiNodes.nodes || [],
                    Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [],
                    dt,
                    {
                        time: this.time,
                    }
                );
            }
        }, 'simulation.competitionDominance');
        markReleaseContainmentRuntime(this, 'competitionDominance', { scheduled: true });
        this.frameScheduler.register('simulation', (dt) => {
            this.cascadeEventBridge?._decayUpdate?.(dt);
        }, 'simulation.cascadeEventBridge');
        this.frameScheduler.register('visual', (dt) => {
            if (this.linkCorruptionTransmission) {
                if (this.activeLinkCount === 0) return;
                this.linkCorruptionTransmission.updateTransmission(dt);
            }
        }, 'visual.linkCorruptionTransmission');
        this.frameScheduler.register('visual', (dt) => {
            // Lazy-init to avoid constructor when disabled
            if (!this.harmonyCascade) {
                this.harmonyCascade = new CascadingHarmonicResonanceAmplification();
            }

            // Build a fresh, lightweight view of the network each tick (10 Hz)
            const nodesArray = this.aiNodes?.nodes || [];
            const nodeMap = new Map();
            for (const node of nodesArray) {
                const id = node?.id ?? node?.userData?.nodeId;
                if (id !== undefined) nodeMap.set(id, node);
            }

            this.harmonyCascade.network = {
                nodes: nodeMap,
                links: this.linkingSystem?.links || [],
                _topologyGeneration: this.linkingSystem?._topologyGeneration || 0,
                waveEngine: this.waveInterferenceEngine || null
            };

            this.harmonyCascade.update(dt);
        }, 'visual.harmonyCascade');
        this.frameScheduler.register('visual', (dt) => {
            if (this.harmonyStabilizationSystem) {
                safeTick(this.harmonyStabilizationSystem, dt);
            }
        }, 'visual.harmonyStabilizationSystem');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.effectOrchestrator) {
                safeTick(this.effectOrchestrator, dt, this.time);
            }
        }, 'simulation.effectOrchestrator');
        
        // Disabled: renderer now reads only link.userData.metrics directly in link pipelines.
        this.linkRendererMetricsIntegration = null;
        this.coreMetricsCalculator = null;
        // REMOVED (2026-05-14): nodeShellSizeAuthority — file deleted, system null
        // this.frameScheduler.register('simulation', (dt) => {
        //     if (this.nodeShellSizeAuthority) {
        //         this.nodeShellSizeAuthority.enforceShellSizes(null, this.nodeAuraSystem || null);
        //     }
        // }, 'simulation.nodeShellSizeAuthority');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.linkPersonalityStateMachine && this.linkingSystem) {
                this.linkPersonalityStateMachine.update(dt, this.linkingSystem.links || []);
            }
        }, 'simulation.linkPersonalityStateMachine');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.influenceAttenuationAbsorption) {
                this.influenceAttenuationAbsorption.update(dt, this.time);
            }
        }, 'simulation.influenceAttenuationAbsorption');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.influenceReflection) {
                this.influenceReflection.update(dt, this.time);
            }
        }, 'simulation.influenceReflection');
        this.frameScheduler.register('simulation', (dt) => {
            const trapSystem = this.standingWaveTrapSystem || this.standingWaveTrap;
            if (trapSystem) {
                trapSystem.update(dt, this.time);
            }
        }, 'simulation.waveStandingTraps');
        // REMOVED: cascadeAccelSetup frame scheduler — moved to LEGACY/april (2026-04-22)
        this.frameScheduler.register('visual', (dt) => {
            if (this.coreMetricsOverlay) {
                this.runCoreMetricsOverlayTick(dt);
            }
        }, 'visual.coreMetricsOverlay');
        this.frameScheduler.register('visual', (dt) => {
            this.activeWorld?.update?.(dt, this.time);
        }, 'visual.activeWorld');
        this.frameScheduler.register('simulation', (dt) => {
            if (!this.hazards) return;
            this.hazards.update(dt);
            const hazardEffect = this.hazards.getHazardEffect(this.player?.position);
            if (hazardEffect && this.player?.position?.add) {
                this.player.position.add(hazardEffect.multiplyScalar(0.5));
            }
        }, 'simulation.hazards');
        this.frameScheduler.register('visual', (dt) => {
            if (!this.aiNodes) return;
            const aiNodesUpdateStart = performance.now();
            this.aiNodes.update(dt, this.time);
            this.updateValidator?.markSystemUpdate('aiNodes.update', performance.now() - aiNodesUpdateStart);
            this.nodeUiAcc = (this.nodeUiAcc || 0) + dt;
            if (this.nodeUiAcc >= 0.1) {
                this.nodeUiAcc = 0;
                this.updateNodeUI();
            }
        }, 'visual.aiNodes');
        this.frameScheduler.register('simulation', () => {
            this.aiNodes?.updateSpawning?.(Date.now());
        }, 'simulation.aiNodeSpawning');
        // DISABLED: simulation.nodeEditor — moved to LEGACY (2026-05-14)
        this.frameScheduler.register('simulation', (dt) => {
            this.undoUiAcc = (this.undoUiAcc || 0) + dt;
            if (this.undoUiAcc >= 0.1) {
                this.undoUiAcc = 0;
                this.updateUndoRedoUI();
            }
        }, 'simulation.undoRedoUi');
        this.frameScheduler.register('visual', (dt) => {
            this.runVisualOverlayTick(dt);
        }, 'visual.visualOverlayTick');
        this.frameScheduler.register('visual', (dt) => {
            this.linkMetricsToVisualBridge?.update?.(dt);
        }, 'visual.linkMetricsToVisualBridge');
        // this.frameScheduler.register('visual', (dt) => {
        //     this.stressBasedParticleScaler?.update?.(dt);
        // }, 'visual.stressBasedParticleScaler');  // LEGACY/april
        this.frameScheduler.register('simulation', (dt) => {
            this.linkDegradationSystem?.update?.(dt);
        }, 'simulation.linkDegradationSystem');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.audioSystem?.initialized && this.audioSystem.enabled !== false && this.audioModulation && this.nodeDynamicMetrics) {
                this.audioModulation.update(dt, {
                    synergy: this.nodeDynamicMetrics.avgSynergy || 0,
                    harmony: this.nodeDynamicMetrics.avgHarmony || 50,
                    corruption: this.nodeDynamicMetrics.avgCorruption || 0
                }, this._buildAudioIdentityContext());
            }
            if (this.audioSystem && this.nodeDynamicMetrics) {
                const avgSynergy = this.nodeDynamicMetrics?.avgSynergy ?? 0.0;
                if (avgSynergy >= this.synergyActivationThreshold) {
                    this.previousSynergyState = 'active';
                } else if (avgSynergy < this.synergyFadingThreshold && this.previousSynergyState === 'active') {
                    this.semanticBus.emit('synergy.fade', {
                        synergy: avgSynergy
                    }, { priority: this.semanticBus.priority.INTERACTIVE });
                    this.previousSynergyState = 'fading';
                } else if (avgSynergy < this.synergyFadingThreshold && this.previousSynergyState === 'fading') {
                    this.previousSynergyState = 'none';
                }
            }
        }, 'simulation.audioSynergyMonitor');
        this.frameScheduler.register('simulation', (dt) => {
            if (!this._runSlowSemanticPending) return;
            if (this.regionalEquilibrium && this.harmonySystem && this.ruptureSystem) {
                this.regionalEquilibrium.update(
                    dt,
                    this.time,
                    {
                        nodes: this.aiNodes?.nodes || [],
                        links: this.linkingSystem?.links || []
                    },
                    this.harmonySystem,
                    this.ruptureSystem,
                    this.standingWaveSystem
                );

                // IMPROVEMENT: Bridge RegionalEquilibrium → HarmonicHealingRecovery priority
                // Feed most damaged region to healing system so it prioritizes repair there
                if (this.harmonicHealingRecovery?.setRegionalPriority) {
                    const priority = this.regionalEquilibrium.getMostDamagedRegionPriority?.();
                    this.harmonicHealingRecovery.setRegionalPriority(priority);
                }
            }
        }, 'simulation.regionalEquilibrium');
        this.frameScheduler.register('visual', (dt) => {
            if (!this._runSlowSemanticPending) return;
            if (this.cascadingRuptures?.enabled) {
                this.cascadingRuptures.rebind?.({
                    linkingSystem: this.linkingSystem,
                    aiNodes: this.aiNodes,
                    regionalEquilibrium: this.regionalEquilibrium
                });
                this.cascadingRuptures.update(
                    dt,
                    this.time,
                    this.ruptureSystem,
                    this.harmonySystem
                );
            }
        }, 'visual.cascadingRuptures');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.criticalNodeFailure?.enabled) {
                this.criticalNodeFailure.rebind?.({
                    linkingSystem: this.linkingSystem,
                    aiNodes: this.aiNodes,
                    scene: this.scene
                });
                this.criticalNodeFailure.update(dt, this.time);
            }
        }, 'simulation.criticalNodeFailure');
        this.frameScheduler.register('simulation', (dt) => {
            if (!this._runSlowSemanticPending) return;
            if (this.topologyViz?.enabled) {
                const networkState = {
                    harmony: this.nodeDynamicMetrics?.avgHarmony || 0.5,
                    corruption: this.nodeDynamicMetrics?.avgCorruption || 0,
                    synergy: this.nodeDynamicMetrics?.avgSynergy || 0,
                    instability: this.nodeDynamicMetrics?.avgInstability || 0
                };
                this.topologyViz.update(dt, networkState);
            }
        }, 'simulation.topologyViz');
        markReleaseContainmentRuntime(this, 'topologyBiasVisualization', { scheduled: true });
        this.frameScheduler.register('visual', () => {
            // FIX 5: Removed hard gate on nodeDynamicMetrics — falls back to 0.0 if absent
            if (this.echoTrailsIntegration) {
                const visualMetrics = getCachedVisualMetrics() || this.nodeDynamicMetrics || {};
                const avgSynergy = visualMetrics.avgSynergy ?? visualMetrics.networkSynergy ?? 0.0;
                const visualTime = window.VISUAL_TIME ?? this.time;
                this.echoTrailsIntegration.updateAllMaterials(this.time, visualTime, avgSynergy);
            }
        }, 'visual.echoTrailsIntegration');
        this.frameScheduler.register('visual', (dt) => {
            this.worldRuntime_v1?.update?.(dt);
        }, 'visual.worldRuntime_v1');
        this.frameScheduler.register('simulation', (dt) => {
            this.nodeEditorRuntime_v1?.update?.(dt);
        }, 'simulation.nodeEditorRuntime_v1');
        this.frameScheduler.register('simulation', (dt) => {
            this.metricsRuntime_v1?.update?.(dt);
        }, 'simulation.metricsRuntime_v1');
        this.frameScheduler.register('simulation', () => {
            this._refreshAIHudReports?.();
        }, 'simulation.aiHudReports');
        this.frameScheduler.register('simulation', (dt) => {
            this.networkStressAggregator?.update?.(dt);
        }, 'simulation.networkStress');
        this.frameScheduler.register('simulation', () => {
            const stress = this.networkStressAggregator?.getStress?.() ?? 0;
            const emitEvent = (eventName, payload) => {
                if (this.semanticBus?.emit) {
                    this.semanticBus.emit(
                        eventName,
                        payload,
                        { priority: this.semanticBus.priority?.INTERACTIVE ?? this.semanticBus.priority?.NORMAL }
                    );
                }
                if (this.multiNetworkManager?.emitEvent) {
                    this.multiNetworkManager.emitEvent(eventName, payload);
                }
            };

            let tier = 0;
            let tierEvent = null;
            if (stress > 90) {
                tier = 3;
                tierEvent = 'cascade.high';
            } else if (stress > 75) {
                tier = 2;
                tierEvent = 'cascade.medium';
            } else if (stress > 60) {
                tier = 1;
                tierEvent = 'cascade.low';
            }

            const previousTier = this._networkStressCascadeTier ?? 0;
            this._networkStressCascadeTier = tier;
            if (tier <= 0 || tier === previousTier || !tierEvent) {
                return;
            }

            const payload = {
                stress,
                tier,
                source: 'networkStressAggregator',
                timestamp: Date.now()
            };

            emitEvent(tierEvent, payload);
            emitEvent('cascade.start', { ...payload, level: tierEvent });
        }, 'simulation.networkStressCascadeBridge');
        // REMOVED: personalityRuntime_v1 frame scheduler — moved to LEGACY/april (2026-04-22)
        // REMOVED: nodePersonalitySystem scheduler - moved to LEGACY (2026-04-03)
        // this.frameScheduler.register('simulation', (dt) => {
        //     this.nodePersonalitySystem?.update?.(dt, this.aiNodes?.nodes);
        // }, 'simulation.nodePersonalitySystem');
        this.frameScheduler.register('simulation', (dt) => {
            this.phase5MultiNetworkOrchestrator?.update?.(dt);
        }, 'simulation.phase5MultiNetworkOrchestrator');
        this.frameScheduler.register('visual', (dt) => {
            this.phase5InterNetworkVisualizationBridge?.update?.(dt);
        }, 'visual.phase5InterNetworkVisualizationBridge');
        // REMOVED (2026-05-14): emergentThoughtStorms — never instantiated, moved to LEGACY
        // this.frameScheduler.register('visual', (dt) => {
        //     // EmergentThoughtStorms5_0 hard-disabled for release stabilization.
        // }, 'visual.emergentThoughtStorms');
        this.frameScheduler.register('simulation', (dt) => {
            this.colonyManager?.update?.(dt);
        }, 'simulation.colonyManager');
        this.frameScheduler.register('simulation', (dt) => {
            this.nodePersonality?.update?.(dt, this.time);
        }, 'simulation.nodePersonality');
        this.frameScheduler.register('simulation', (dt) => {
            this.mythicRitualController?.update?.(dt, this.aiNodes?.nodes);
        }, 'simulation.mythicRitualController');
        this.frameScheduler.register('simulation', (dt) => {
            this.tier4GameplayIntegration?.update?.(dt);
        }, 'simulation.tier4GameplayIntegration');
        this.frameScheduler.register('simulation', (dt) => {
            this.networkRituals?.updateRituals?.(dt * 1000);
        }, 'simulation.networkRituals');

        this.frameScheduler.register('realtime', this.runCameraControllerTick.bind(this), 'realtime.cameraController');
        this.frameScheduler.register('realtime', this.runPlayerControllerTick.bind(this), 'realtime.playerController');
        this.frameScheduler.register('realtime', (dt) => {
            const runtime = this.inputRuntime ?? this.inputRuntime_v1;
            runtime?.update?.(dt);
        }, 'InputRuntime_v1');
        this.frameScheduler.register('visual', this.runNodeAuraSystemTick.bind(this), 'visual.nodeAuraSystem');
        this.frameScheduler.register('visual', (dt) => {
            this.nodeAuraRenderer?.update?.(dt);
        }, 'visual.nodeAuraRenderer');
        // REMOVED: corruptionAuraDesaturation frame scheduler — moved to LEGACY/april (2026-04-22)
        // REMOVED (2026-05-14): corruptionDesaturation — moved to LEGACY
        // this.frameScheduler.register('visual', () => {
        //     this.corruptionDesaturation?.update?.();
        // }, 'visual.corruptionDesaturation');
        this.frameScheduler.register('visual', (dt) => {
            if (this.metricsVisualFX && this.aiNodes && !this._runVisualSemanticPending) {
                this.metricsVisualFX.update(dt, this.aiNodes.nodes);
            }
        }, 'visual.metricsVisualFX');
        this.frameScheduler.register('visual', (dt) => {
            if (this.synergyBonusFXLayer && this.linkingSystem) {
                this.synergyBonusFXLayer.update(dt, this.linkingSystem.links || []);
            }
        }, 'visual.synergyBonusFXLayer');
        this.frameScheduler.register('visual', (dt) => {
            if (this.synergyResonanceShaderPack && this.nodeLinking) {
                this.synergyResonanceShaderPack.update(dt, this.nodeLinking.links || []);
            }
        }, 'visual.synergyResonanceShaderPack');
        // REMOVED: synergyCascadeFXBridge frame scheduler — moved to LEGACY/april (2026-04-22)
        this.frameScheduler.register('visual', (dt) => this.fxRuntime_v1?.update?.(dt), 'visual.fxRuntime_v1');
        // REMOVED: personalityShaderBridge + advancedShaderFX frameScheduler — moved to LEGACY/ (2026-05-14)
        // this.frameScheduler.register('visual', (dt) => this.personalityShaderBridge?.update?.(dt), 'visual.personalityShaderBridge');
        // this.frameScheduler.register('visual', (dt) => this.advancedShaderFX?.update?.(dt), 'visual.advancedShaderFX');
        this.frameScheduler.register('visual', (dt) => this.archetypeAuraFX?.update?.(dt), 'visual.archetypeAuraFX');
        this.frameScheduler.register('visual', (dt) => this.archetypeColorFX?.update?.(dt), 'visual.archetypeColorFX');
        this.frameScheduler.register('visual', (dt) => this.archetypeShaderModes?.update?.(dt), 'visual.archetypeShaderModes');
        this.frameScheduler.register('visual', (dt) => this.nodeShaderActivation?.update?.(dt), 'visual.nodeShaderActivation');
        this.frameScheduler.register('visual', (dt) => this.glyphLayer4?.update?.(dt), 'visual.glyphLayer4');
        this.frameScheduler.register('visual', (dt) => this.semanticGlyphAI?.update?.(dt, this.aiNodes?.nodes), 'visual.semanticGlyphAI');
        this.frameScheduler.register('visual', (dt) => this.glyphFusionOverlay?.update?.(dt), 'visual.glyphFusionOverlay');
        this.frameScheduler.register('visual', (dt) => this.linkedGlyphSync?.update?.(dt, this.aiNodes, this.linkingSystem), 'visual.linkedGlyphSync');
        this.frameScheduler.register('visual', (dt) => {
            if (this.activeLinkCount === 0) return;
            this.cascadePropagationVisuals?.update?.(dt);
        }, 'visual.cascadePropagation');
        this.frameScheduler.register('simulation', () => {
            if (this.activeLinkCount === 0) return;
            this.cascadePropagationVisuals?.checkCascadeEvents?.();
        }, 'simulation.phase5CascadeEventCheck');
        // REMOVED (2026-05-14): evolvingLinkFX — moved to LEGACY
        // this.frameScheduler.register('visual', (dt) => this.evolvingLinkFX?.update?.(dt, null, null), 'visual.evolvingLinkFX');
        // REMOVED (2026-05-14): linkVisualMoodSystem — moved to LEGACY
        // this.frameScheduler.register('visual', (dt) => this.linkVisualMoodSystem?.update?.(dt), 'visual.linkVisualMoodSystem');
        this.frameScheduler.register('visual', () => { if (this.linkDebugMode?.enabled) this.linkDebugMode.updateDebugVisuals(); }, 'visual.linkDebugMode');
        // REMOVED (2026-05-14): legendaryPack — moved to LEGACY
        // this.frameScheduler.register('visual', (dt) => this.legendaryPack?.update?.(dt, this.scene, this.camera, this.renderer), 'visual.legendaryPack');
        this.frameScheduler.register('visual', (dt) => this.legendaryLinkFX?.update?.(dt, this.scene, this.camera, this.renderer), 'visual.legendaryLinkFX');
        // REMOVED (2026-05-14): personalityFX — moved to LEGACY, replaced by MetricTierClassifier
        // this.frameScheduler.register('visual', (dt) => this.personalityFX?.update?.(dt, this.scene, this.camera), 'visual.personalityFX');
        this.frameScheduler.register('visual', (dt) => {
            if (this.environmentDomain?.instances?.worldFXPack) return;
            this.worldFXPack?.update?.(dt, this.scene, this.camera);
        }, 'visual.worldFXPack');
        this.frameScheduler.register('visual', (dt) => {
            if (this.environmentDomain?.instances?.safeDreamDepthPack) return;
            this.dreamDepthPack?.update?.(dt, this.dreamDepthWorldSystems);
        }, 'visual.dreamDepthPack');
        this.frameScheduler.register('visual', (dt) => {
            if (this.environmentDomain?.instances?.dreamDepthEffectManager) return;
            this.dreamDepthEffects?.update?.(dt);
        }, 'visual.dreamDepthEffects');
        this.frameScheduler.register('visual', (dt) => this.mobilityPack?.update?.(dt), 'visual.mobilityPack');
        // REMOVED: extremeShaderTestSuite - moved to LEGACY (2026-04-03)
        // this.frameScheduler.register('visual', (dt) => this.extremeShaderTestSuite?.update?.(dt), 'visual.extremeShaderTestSuite');
        // REMOVED (2026-05-14): newNodeCategories — moved to LEGACY
        // this.frameScheduler.register('visual', (dt) => this.newNodeCategories?.update?.(dt, this.time), 'visual.newNodeCategories');
        // this.frameScheduler.register('visual', (dt) => this.extremeLinkVisuals?.update?.(dt), 'visual.extremeLinkVisuals');
        // this.frameScheduler.register('visual', (dt) => this.extremeLinkVisuals4?.update?.(dt, this.camera), 'visual.extremeLinkVisuals4');
        this.frameScheduler.register('visual', (dt) => this.phase8RitualOrchestration?.update?.(dt * 1000), 'visual.phase8RitualOrchestration');
        // this.frameScheduler.register('visual', (dt) => this.mythicSeedGlyph?.update?.(dt, this.camera), 'visual.mythicSeedGlyph');  // LEGACY/april
        // Infra/diagnostic: keep in visual for now to avoid sim cadence mismatch
        this.frameScheduler.register('visual', () => this.microImpulseAdapter?.update?.(), 'visual.microImpulseAdapter');
        // Safety net – low frequency; leave in visual until dedicated infra layer exists
        this.frameScheduler.register('visual', () => {
            if (this.hardInteractionAuthority && this.scene && (this.frameCount % 180 === 0)) {
                this.hardInteractionAuthority.safetyNet();
            }
        }, 'visual.hardInteractionAuthority');
        this.frameScheduler.register('visual', (dt) => {
            this.linkAuraSystem?.update?.(dt);
        }, 'visual.linkAuraSystem');
        this.frameScheduler.register('visual', (dt) => {
            if (!this.linkSparkSystems || !this.linkingSystem?.links?.length) return;

            const sparkColorByCategory = {
                input: 0x58e5ff,
                process: 0x24ffd7,
                integration: 0xffd166,
                analytics: 0xbb86ff,
                storage: 0xff5aa5,
                control: 0xff8c42,
                sigma: 0x52ff52,
                emotional: 0xff5c2a,
                quantum: 0x47f5ff,
                mythic: 0xffd84d,
                prime: 0xffffff,
                error: 0xff6b6b
            };

            for (const [linkId, sparkSystem] of this.linkSparkSystems) {
                if (!sparkSystem) {
                    this.linkSparkSystems.delete(linkId);
                    continue;
                }

                const link = this.linkingSystem.links.find((candidate) => candidate?.userData?.id === linkId);
                if (!link || link.active === false) {
                    sparkSystem.dispose?.();
                    this.linkSparkSystems.delete(linkId);
                    continue;
                }

                const sourceCategory = String(link.source?.userData?.category || 'input').toLowerCase();
                const color = new THREE.Color(sparkColorByCategory[sourceCategory] || 0xffaa00);
                const metrics = link.userData?.metrics || {};
                const stats = {
                    synergy: Number.isFinite(metrics.synergy) ? metrics.synergy : 0,
                    traffic: Number.isFinite(metrics.traffic) ? metrics.traffic : 0,
                    intensity: Number.isFinite(metrics.loadPressure) ? metrics.loadPressure : 0.25,
                    load: Number.isFinite(metrics.loadPressure) ? metrics.loadPressure : 0
                };

                sparkSystem.update?.(
                    this.time || 0,
                    dt,
                    link.curve || null,
                    stats,
                    color,
                    true,
                    0
                );
            }
        }, 'visual.linkSparkSystems');
        this.frameScheduler.register('visual', (dt) => this.nodeMicroEvents?.update?.(dt, this.aiNodes?.nodes), 'visual.nodeMicroEvents');
        this.frameScheduler.register('visual', (dt) => this.t2CorruptionVisualIntegration?.update?.(dt, this.linkingSystem?.links), 'visual.t2CorruptionVisualIntegration');
        this.frameScheduler.register('visual', (dt) => this.t2HarmonyVisualConsumer?.update?.(dt, this.aiNodes, this.harmonyStabilizationSystem), 'visual.t2HarmonyVisualConsumer');
        // Cross-layer tick bridges
        this.frameScheduler.register('realtime', (dt) => this.nodeInteractionEngine?.update?.(dt), 'realtime.nodeInteraction');
        this.frameScheduler.register('realtime', (dt) => this.hitProxySystem?.update?.(dt), 'realtime.hitProxy');
        this.frameScheduler.register('simulation', (dt) => {
            if (this._runElasticityPending) {
                this._runElasticityPending = false;
                this.visualNetworkTimeElasticityTick(dt);
            }
        }, 'simulation.visualNetworkTimeElasticity');
        // REMOVED: synergyPulseVisuals frame scheduler — moved to LEGACY/april (2026-04-22)
        this.frameScheduler.register('visual', () => {
            if (this._runVisualSemanticPending) {
                this._runVisualSemanticPending = false;
                this.runVisualSemanticTick(this._pendingVisualSemanticDt, this._pendingMark);
            }
        }, 'visual.semanticVisual30Hz');
        this.frameScheduler.register('visual', () => {
            if (this._runHarmonicResonancePending) {
                this._runHarmonicResonancePending = false;
                this.harmonicResonanceCouplingTick(this._pendingHarmonicResonanceDt);
            }
        }, 'visual.harmonicResonanceCoupling');
        this.frameScheduler.register('visual', () => {
            if (this._runHarmonicHubAuraPending) {
                this._runHarmonicHubAuraPending = false;
                this.harmonicHubAuraSystemTick(this._pendingHarmonicHubAuraDt);
            }
        }, 'visual.harmonicHubAuraSystem');
        // REMOVED: frameScheduler registration for harmonicInfluencePropagation — moved to LEGACY (2026-05-14)
        this.frameScheduler.register('visual', () => {
            if (this._runLinkResonanceFlowPending) {
                this._runLinkResonanceFlowPending = false;
                this.linkResonanceFlowSystemTick(this._pendingLinkResonanceFlowDt);
            }
        }, 'visual.linkResonanceFlowSystem');
        this.frameScheduler.register('visual', () => {
            if (this._runHarmonicPhaseSyncPending) {
                this._runHarmonicPhaseSyncPending = false;
                this.harmonicPhaseSynchronizationTick(this._pendingHarmonicPhaseSyncDt);
            }
        }, 'visual.harmonicPhaseSynchronization');
        // REMOVED: frameScheduler registration for harmonicNodeResonanceHalos — moved to LEGACY (2026-05-14)
        this.frameScheduler.register('visual', (dt) => {
            const pulseWaveBridge = this.pulseWaveBridge || this.pulseWaveSystemBridge;
            if (pulseWaveBridge && this.waveInterferenceEngine && this.pulseIntersectionAdapter) {
                pulseWaveBridge.update(dt, {
                    waveEngine: this.waveInterferenceEngine,
                    links: this.linkingSystem?.links || [],
                    nodeDynamicMetrics: this.nodeDynamicMetrics,
                    pulseIntersectionAdapter: this.pulseIntersectionAdapter
                });
            }
        }, 'visual.pulseWaveBridge');
        this.frameScheduler.register('visual', () => {
            if (this.pulseBoundaryInteractionAdapter && this.aiNodes && this.nodeLinking) {
                this.pulseBoundaryInteractionAdapter.update({
                    links: this.nodeLinking?.links || [],
                    nodes: this.aiNodes?.nodes || [],
                    nodeDynamicMetrics: this.nodeDynamicMetrics,
                    aiNodes: this.aiNodes
                });
            }
        }, 'visual.pulseBoundaryInteractionAdapter');
        this.frameScheduler.register('visual', () => {
            if (this.pulseIntersectionAdapter) {
                this.pulseIntersectionAdapter.update();
            }
        }, 'visual.pulseIntersectionAdapter');
        this.frameScheduler.register('visual', this.runNodeInspectOverlayTick.bind(this), 'visual.nodeInspectOverlay');
        this.frameScheduler.register('visual', (dt) => {
            if (this.resonanceFeedback && this.aiNodes && this.linkingSystem) {
                this.resonanceFeedback.update(
                    dt,
                    this.aiNodes.nodes || [],
                    this.linkingSystem.links || []
                );
            }
        }, 'visual.resonanceFeedback');
        this.frameScheduler.register('visual', (dt) => {
            if (this.resonanceRupture) {
                if (this.resonanceRupture?.config?.debugVisualBoost && (this.time - (this._ruptureRuntimeHeartbeatAt ?? -Infinity) >= 2.0)) {
                    this._ruptureRuntimeHeartbeatAt = this.time;
                    console.log('[main.js] visual.resonanceRupture tick', {
                        time: this.time,
                        dt,
                        initialized: !!this.resonanceRupture.initialized,
                        activeTraps: this.resonanceRupture?.standingWaveTrapSystem?.oscillationTraps?.filter?.(t => t && t.active).length ?? null,
                        links: this.linkingSystem?.links?.length ?? null
                    });
                }
                this.resonanceRupture.update(dt, this.time);
            }
        }, 'visual.resonanceRupture');
        this.frameScheduler.register('visual', (dt) => {
            const resonanceEchoTrailSystem = this.resonanceEchoTrailSystem || this.resonanceEchoTrails;
            if (resonanceEchoTrailSystem?.enabled) {
                resonanceEchoTrailSystem.update(
                    dt,
                    this.linkSemanticPictograms?.fusionZoneManager?.compositeGlyphs
                );
            }
        }, 'visual.resonanceEchoTrailSystem');
        this.frameScheduler.register('visual', (dt) => {
            if (this.compositeResonanceFeedback) {
                this.compositeResonanceFeedback.update(dt);
            }
        }, 'visual.compositeResonanceFeedback');
        this.frameScheduler.register('visual', () => {
            if (this._runCascadeVisualizerPending) {
                this._runCascadeVisualizerPending = false;
                this.cascadeVisualizerTick(this._pendingCascadeVisualizerDt);
            }
        }, 'visual.cascadeVisualizer');
        this.frameScheduler.register('simulation', () => {
            if (this._runSlowSemanticPending) {
                this._runSlowSemanticPending = false;
                this.runSlowSemanticTick(this._pendingSlowSemanticDt);
            }
        }, 'simulation.semanticSlow10Hz');
        this.frameScheduler.register('visual', (dt) => {
            if (this.glyphSystem4 && this.aiNodes) {
                this.glyphSystem4.update(dt, this.aiNodes.nodes);
            }
        }, 'visual.glyphSystem4');
        this.frameScheduler.register('visual', (dt) => {
            if (this.proceduralMeaningEngine && this.aiNodes && this.semanticGlyphAI) {
                this.proceduralMeaningEngine.update(dt, this.aiNodes.nodes, this.semanticGlyphAI);
            }
        }, 'visual.proceduralMeaningEngine');
        this.frameScheduler.register('visual', (dt) => {
            if (this.adaptiveGlyphRendering && this.aiNodes) {
                this.adaptiveGlyphRendering.update(dt, this.aiNodes.nodes);
            }
        }, 'visual.adaptiveGlyphRendering');
        this.frameScheduler.register('visual', (dt) => {
            if (!this._runSlowSemanticPending) return;
            if (this.glyphAnimationModulator?.enabled && this.proceduralGlyphGenerator?.glyphInstances) {
                const harmonicNetworkState = {
                    harmony: this.nodeDynamicMetrics?.avgHarmony || 0.5,
                    corruption: this.nodeDynamicMetrics?.avgCorruption || 0,
                    stability: this.nodeDynamicMetrics?.avgStability || 0.5,
                    synergy: this.nodeDynamicMetrics?.avgSynergy || 0
                };
                this.glyphAnimationModulator.update(
                    this.proceduralGlyphGenerator.glyphInstances,
                    harmonicNetworkState
                );
            }
        }, 'visual.glyphAnimationModulator');
        // REMOVED: particleEmissionScaler frame scheduler — moved to LEGACY/april (2026-04-22)
        this.frameScheduler.register('visual', (dt) => {
            if (this.cascadeParticleSystem) {
                const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];
                const cascadeSystem = this.harmonicCascadeAmplification || this.cascadeVisualizer || null;
                this.cascadeParticleSystem.update(dt, links, this.camera, cascadeSystem, this.conflictSystem || null);
            }
        }, 'visual.cascadeParticleSystem');
        
        // NEW: Update cascade resonance wave visualization
        this.frameScheduler.register(
            'visual',
            (dt) => this.cascadeResonanceWaveVisualization?.update?.(dt),
            'visual.cascadeResonanceWaveVisualization'
        );
        
        // NEW: Update resonance cascade visualization
        this.frameScheduler.register('visual', (dt) => {
            const resonanceCascadeVisualization = this.resonanceCascadeVisualization || this.resonanceCascade;
            if (resonanceCascadeVisualization && resonanceCascadeVisualization.enabled !== false) {
                if (this.activeLinkCount === 0) return;
                resonanceCascadeVisualization.update(dt, this.aiNodes?.nodes, this.linkingSystem?.links);
            }
        }, 'visual.resonanceCascadeVisualization');
        
        this.frameScheduler.register('visual', (dt) => {
            if (this.healingParticles) {
                this.healingParticles.update(dt, this.time, this.networkState || {}, this.camera);
            }
        }, 'visual.healingParticles');
        this.frameScheduler.register('visual', (dt) => {
            if (this.harmonicHealingRecovery) {
                if (this.activeLinkCount === 0) return;
                this.harmonicHealingRecovery.update(dt, this.time, this.networkState || {});
            }
        }, 'visual.harmonicHealingRecovery');
        this.frameScheduler.register('visual', (dt) => {
            if (this.linkTrailParticles) {
                this.linkTrailParticles.update(dt, this.time);
            }
        }, 'visual.linkTrailParticles');
        // LinkTrailEmitter update moved to LinkRendererConduit
        // See: LinkRendererConduit.update()
        // Eliminates race condition - conduit has direct curve access

        // REMOVED: Memory trails update - moved to LEGACY/GRAVEYARD (2026-04-05)
        this.frameScheduler.register('visual', (dt) => {
            if (this.visualSuperpack) {
                const liveMetrics = typeof window !== 'undefined' ? (window.__ATOMA_LIVE_METRICS__ || null) : null;
                const canonicalWorldContext = this._getCanonicalWorldContext();
                this.worldMacroState = canonicalWorldContext.worldMacroState || this.worldMacroState || 'DORMANT';
                this.visualSuperpack.setWorldContext?.(canonicalWorldContext);
                if (liveMetrics) {
                    this.visualSuperpack.setMetrics({
                        harmony: liveMetrics.harmony,
                        corruption: liveMetrics.corruption,
                        synergy: liveMetrics.synergy,
                        stability: liveMetrics.stability
                    });
                }
                this.visualSuperpack.update(dt);
            }
        }, 'visual.visualSuperpack');
        this.frameScheduler.register('visual', (dt) => {
            if (this.cinematicUpgrade) {
                const liveMetrics = typeof window !== 'undefined' ? (window.__ATOMA_LIVE_METRICS__ || null) : null;
                const canonicalWorldContext = this._getCanonicalWorldContext();
                this.cinematicUpgrade.setWorldContext?.(canonicalWorldContext);
                if (liveMetrics) {
                    this.cinematicUpgrade.setMetrics({
                        harmony: liveMetrics.harmony,
                        corruption: liveMetrics.corruption,
                        synergy: liveMetrics.synergy,
                        stability: liveMetrics.stability
                    });
                }
                this.cinematicUpgrade.update(dt);
            }
        }, 'visual.cinematicUpgrade');
        // this.frameScheduler.register('visual', (dt) => {
        //     if (this.dynamicLinkColorSystem) {
        //         this.dynamicLinkColorSystem.update(dt);
        //     }
        // }, 'visual.dynamicLinkColorSystem');  // LEGACY/april
        this.frameScheduler.register('visual', (dt) => {
            this.aiNodes?.updateEdgeCageDistanceFade?.(dt, this.camera);
        }, 'visual.edgeCageDistanceFade');
        if (window.ATOMA_FLAGS?.release?.disableWaveShaderStack !== true) {
            this.frameScheduler.register('visual', (deltaTime) => {
                if (this.waveShaderBridge) {
                    const nodes =
                        this.aiNodes?.nodes ||
                        this.nodes ||
                        this.nodeList ||
                        [];
                    const links = this.linkingSystem?.links || [];
                    this.waveShaderBridge.update(deltaTime, {
                        nodes,
                        links
                    });
                }
            }, 'visual.waveShaderBridge');
            this.frameScheduler.register('visual', (dt) => {
                if (this.waveTravelShaderPack) {
                    this.waveTravelShaderPack.update(dt);
                }
            }, 'visual.waveTravelShaderPack');
            this.frameScheduler.register('visual', (dt) => {
                if (this.waveDynamicsShaderPack) {
                    this.waveDynamicsShaderPack.update(dt);
                }
            }, 'visual.waveDynamicsShaderPack');
            markReleaseContainmentRuntime(this, 'waveShaderStack', { scheduled: true, enabled: true });
        }
        this.frameScheduler.register('visual', (dt) => {
            if (this.synergyTravelingWaveFX) {
                this.synergyTravelingWaveFX.update(dt, this.time || 0);
            }
        }, 'visual.synergyTravelingWaveFX');
        this.frameScheduler.register('visual', (dt) => {
            if (!this.synergyHighwayVisuals3D) return;
            this._synergyHighwayRefreshAcc = (this._synergyHighwayRefreshAcc || 0) + dt;
            if (this._synergyHighwayRefreshAcc >= 0.5) {
                this.synergyHighwayVisuals3D.updateVisuals?.();
                this.synergyHighwayVisuals3D.refreshFromHighways?.();
                this._synergyHighwayRefreshAcc = 0;
            }
            this.synergyHighwayVisuals3D.update?.(dt);
        }, 'visual.synergyHighwayVisuals3D');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.waveInterferenceEngine) {
                this.waveInterferenceEngine.update(dt);
            }
        }, 'simulation.waveInterferenceEngine');
        this.frameScheduler.register('visual', (dt) => {
            const wavePatternSystem = this.wavePatternSystem || this.waveInterference;
            if (wavePatternSystem) {
                wavePatternSystem.update(dt, this.time);
            }
        }, 'visual.waveInterferencePatterns');
        this.frameScheduler.register('visual', (dt) => {
            // Harmonic resonance feedback fields (30 Hz visual cadence)
            const harmonicResonanceFeedbackSystem =
                this.harmonicResonanceFeedbackSystem || this.harmonicResonance;
            if (harmonicResonanceFeedbackSystem) {
                const pictogramSystem = this.linkSemanticPictograms || this.linkPictogramSystem;
                harmonicResonanceFeedbackSystem.update?.(
                    dt,
                    pictogramSystem?.fusionZoneManager,
                    pictogramSystem?.pictograms,
                    this.linkingSystem
                );
            }
        }, 'visual.harmonicResonanceFeedback');
        this.frameScheduler.register('visual', (dt) => {
            if (this.metricInterpretationLayer) {
                const nodes = this.aiNodes?.nodes || [];
                this.metricInterpretationLayer.update(dt, nodes);
            }
        }, 'visual.metricInterpretationLayer');
        this.frameScheduler.register('visual', () => {
            if (this.harmonyDebugOverlay && this.harmonyDebugOverlay.enabled) {
                const nodes = this.aiNodes?.nodes || [];
                const links = this.linkingSystem?.links || [];
                this.harmonyDebugOverlay.update(nodes, links);
            }
        }, 'visual.harmonyDebugOverlay');
        // --- HUD bootstrap (required for realtime overlays) ---
this.wakeHud('coreMetrics');
this.wakeHud('nodeInspect');
this.setHudDirty('coreMetrics');
this.setHudDirty('nodeInspect');

        this.semanticBus.subscribe('camera.motion', () => {
            this.wakeHud('camera-motion');
            this.setHudDirty('coreMetrics');
        });
        this.semanticBus.subscribe('node.selection', () => {
            this.wakeHud('selection');
        });

        // Audio routing is bound after audio system construction.
        
        // Phase B Console API
        window.scheduler = {
            // Register a system to a layer (with optional ID for management)
            register: (layer, fn, id) => this.frameScheduler.register(layer, fn, id),
            
            // Unregister a system by ID
            unregister: (id) => this.frameScheduler.unregister(id),
            
            // Check if system is registered
            isRegistered: (id) => this.frameScheduler.isRegistered(id),
            
            // Get stats
            stats: () => this.frameScheduler.getStats(),
            
            // List all systems by layer
            listSystems: () => this.frameScheduler.listSystems(),
            
            // Clear all registrations
            clear: () => this.frameScheduler.clear(),
            
            // Test registration (example system for Phase B verification)
            registerTestSystems: () => {
                console.group('%c[FrameScheduler] PHASE B TEST REGISTRATION', 'color: #00ff00; font-weight: bold;');
                console.log('No test systems currently registered.');
                console.log('To add test systems, register them via frameScheduler.register()');
                console.groupEnd();
            }
        };
        
        console.log('%c[FrameScheduler] Phase B: Controlled Registration initialized ✓', 'color: #00ff00; font-weight: bold;');
        console.log('  API: scheduler.register(layer, fn, id)');
        console.log('  API: scheduler.unregister(id)');
        console.log('  API: scheduler.registerTestSystems()');
        console.log('  API: scheduler.stats() | scheduler.listSystems() | scheduler.clear()');
        
        const startupWorld = normalizeStartupWorldId(
            this.bootOptions?.continueSnapshot?.worldId || this.bootOptions?.startupWorld,
        );
        this.currentMode = startupWorld;
        this.currentTheme = startupWorld;
        this.worldRegistry = {
            fractal: () => this.initFractalWorld(),
            quantum: () => this.initQuantumWorld(),
            desert: () => this.initDesertWorld(),
            desert2: () => this.initDreamDesert2World(),
            memory: () => this.initMemoryWorld(),
            chamber: () => this.initChamberWorld(),
            sigma: () => this.initSigmaWorld()
        };

        // ========================================================================
        // AUDIO SYSTEM (ATOMA Audio Design)
        // ========================================================================
        this.audioSystem = new AtomaAudioSystem();
        console.log('[ATOMA AUDIO] Audio System created');
        this.audioModulation = null; // Constructed lazily after first user gesture (autoplay-safe)
        this.previousSynergyState = 'none'; // 'none', 'active', 'fading'
        this.audioStartInProgress = false;
        this.audioStartFatalLocked = false;
        this.audioStartLastError = null;
        this.audioOptionalErrors = [];
        this.audioStartupDiagnostics = null;

        this._summarizeAudioError = (stage, error, fatal = false) => ({
            stage,
            fatal,
            name: error?.name || 'Error',
            message: error?.message || String(error)
        });

        this._pushOptionalAudioError = (stage, error) => {
            const summary = this._summarizeAudioError(stage, error, false);
            this.audioOptionalErrors = [summary, ...this.audioOptionalErrors].slice(0, 5);
            this.audioStartLastError = summary;
            return summary;
        };

        this._refreshAudioDiagnostics = () => {
            const coreStatus = this.audioSystem?.getStatus?.() || {};
            this.audioStartupDiagnostics = {
                backend: coreStatus.backend || this.audioSystem?.audioBackend || 'unknown',
                exists: !!this.audioSystem,
                initialized: !!coreStatus.initialized,
                coreReady: !!coreStatus.coreReady,
                enabled: this.audioSystem?.enabled !== false,
                muted: !!coreStatus.muted,
                toneState: coreStatus.toneState ?? 'unknown',
                modulationReady: !!this.audioModulation,
                harmonicReady: !!this.harmonicAudio?.initialized,
                zoneReady: !!this.zoneAudioReactivity,
                fatalLocked: !!this.audioStartFatalLocked,
                lastError: this.audioStartLastError || coreStatus.lastStartError || null,
                optionalErrors: [...this.audioOptionalErrors]
            };
            return this.audioStartupDiagnostics;
        };

        this._startAudioSubsystems = async (source = 'interaction') => {
            if (!this.audioSystem) return false;
            if (this.audioSystem.enabled === false) {
                this._refreshAudioDiagnostics();
                return false;
            }
            if (this.audioStartFatalLocked) {
                console.warn(`[ATOMA AUDIO] Start blocked after fatal init failure (${source})`);
                this._refreshAudioDiagnostics();
                return false;
            }

            let coreReady = false;
            try {
                coreReady = await this.audioSystem.start();
            } catch (error) {
                this.audioStartFatalLocked = true;
                this.audioStartLastError = this._summarizeAudioError('core-start', error, true);
                this._refreshAudioDiagnostics();
                throw error;
            }

            try {
                if (!this.audioModulation) {
                    this.audioModulation = new AtomaAudioModulation(this.audioSystem);
                }
                this.audioModulation?.setAudioIdentityContext?.(this._buildAudioIdentityContext());
            } catch (error) {
                console.warn('[ATOMA AUDIO] Audio modulation init degraded:', error);
                this._pushOptionalAudioError('modulation-init', error);
                this.audioModulation = null;
            }

            try {
                if (this.harmonicAudio?.start) {
                    await this.harmonicAudio.start();
                }
                this.audioSystem?.setWorldContext?.(this._getAudioWorldContext());
                this.harmonicAudio?.setAudioIdentityContext?.(this._buildAudioIdentityContext());
            } catch (error) {
                console.warn('[ATOMA AUDIO] Harmonic audio init degraded:', error);
                this._pushOptionalAudioError('harmonic-audio-start', error);
            }

            this._refreshAudioDiagnostics();
            return coreReady;
        };

        this._refreshAudioDiagnostics();

        // Early audio diagnostics API (available even if later debug setup is interrupted).
        window.startAtomaAudio = async () => {
            if (!this.audioSystem) return false;
            if (this.audioSystem.enabled === false) {
                console.warn('[ATOMA AUDIO] Disabled - start blocked');
                return false;
            }
            try {
                const started = await this._startAudioSubsystems('manual');
                console.log('[ATOMA AUDIO] Manual start successful');
                return started;
            } catch (err) {
                console.error('[ATOMA AUDIO] Manual start failed:', err);
                return false;
            }
        };
        window.audioStatus = () => ({ ...this._refreshAudioDiagnostics() });
        window.__ATOMA_AUDIO_IDENTITY__ = () => ({
            audioSystem: this.audioSystem?.getAudioIdentitySnapshot?.() || null,
            modulation: this.audioModulation?.getStatus?.()?.audioIdentity || null,
            harmonic: this.harmonicAudio?.audioIdentity ? { ...this.harmonicAudio.audioIdentity } : null
        });
        window.resetAtomaAudioStartLock = () => {
            this.audioStartFatalLocked = false;
            this.audioStartLastError = null;
            this.audioOptionalErrors = [];
            this.audioSystem.lastStartError = null;
            return window.audioStatus();
        };
        window.testAudio = (soundName = 'selection') => {
            const audio = this.audioSystem;
            if (!audio) return console.warn('[ATOMA AUDIO] audioSystem missing');
            if (audio.enabled === false) return console.warn('[ATOMA AUDIO] Disabled - test blocked');
            const sounds = {
                hover: () => audio.playHoverEnter?.(),
                hover_exit: () => audio.playHoverExit?.(),
                selection: () => audio.playSelection(),
                primary_set: () => audio.playPrimaryNodeSet?.(),
                deselection: () => audio.playDeselection(),
                link: () => audio.playLinkCreated(),
                unlink: () => audio.playLinkBroken(),
                invalid_link: () => audio.playInvalidLinkAttempt?.(),
                synergy_active: () => audio.playSynergyActive(),
                synergy_fade: () => audio.playSynergyFade()
            };
            const fn = sounds[soundName];
            if (!fn) return console.warn('[ATOMA AUDIO] Unknown sound:', soundName);
            fn();
            console.log('[ATOMA AUDIO] testAudio played:', soundName);
        };

        // Audio System - Canonical manifest-driven routing
        this.audioEventManifestUnsubscribe = registerAtomaAudioEventManifest({
            semanticBus: this.semanticBus,
            audioSystem: this.audioSystem
        });
        // Low-latency audio semantics: disable queue aggregation/cooldown for core click/link sounds.
        this.semanticBus?.eventPolicies?.set('node.selection', {
            aggregateWithinMs: 0,
            cooldownMs: 0
        });
        this.semanticBus?.eventPolicies?.set('link.created', {
            aggregateWithinMs: 0,
            cooldownMs: 0
        });
        this.semanticBus?.eventPolicies?.set('link:synergyThreshold', {
            aggregateWithinMs: 0,
            cooldownMs: 0
        });
        this.semanticBus?.eventPolicies?.set('link:harmonicLock', {
            aggregateWithinMs: 0,
            cooldownMs: 0
        });
        this.semanticBus?.eventPolicies?.set('network.link.destroyed', {
            aggregateWithinMs: 0,
            cooldownMs: 0
        });

        // Keep synergy state machine aligned with semantic events.
        this.semanticBus.subscribe('node.synergy.high', () => {
            this.previousSynergyState = 'active';
        });
        this.semanticBus.subscribe('synergy.fade', () => {
            this.previousSynergyState = 'fading';
        });

        // Event Frequency Audit - Track which events are actually firing
        this.eventCounters = {
            nodeSelect: 0,
            nodeDeselect: 0,
            linkCreated: 0,
            linkDestroyed: 0,
            synergyHigh: 0,
            synergyFade: 0
        };
        this.lastAuditLogTime = 0;
        this.synergyActivationThreshold = 0.5;
        this.synergyFadingThreshold = 0.3;

        // Start audio on first user interaction (pointerdown, click, or keydown)
        const startAudioOnFirstInteraction = async () => {
            if (!this.audioSystem) return;
            if (this.audioSystem.enabled === false) return false;
            if (this.audioSystem.initialized) return;
            if (this.audioStartInProgress) return;
            if (this.audioStartFatalLocked) return false;
            this.audioStartInProgress = true;

            try {
                const started = await this._startAudioSubsystems('first-interaction');
                if (!started) return false;
                document.removeEventListener('pointerdown', startAudioOnFirstInteraction);
                document.removeEventListener('click', startAudioOnFirstInteraction);
                document.removeEventListener('keydown', startAudioOnFirstInteraction);
                console.log('[ATOMA AUDIO] AudioContext started successfully');
            } catch (error) {
                console.error('[Audio] Failed to start AudioContext:', this.audioStartLastError || error);
            } finally {
                this.audioStartInProgress = false;
                this._refreshAudioDiagnostics();
            }
        };
        this.ensureAudioStarted = startAudioOnFirstInteraction;

        // Add event listeners for first interaction
        document.addEventListener('pointerdown', startAudioOnFirstInteraction);
        document.addEventListener('click', startAudioOnFirstInteraction);
        document.addEventListener('keydown', startAudioOnFirstInteraction);

        // Initialize systems
        this.nodeEditor = null;
        this.hazards = null;
        this.cinematicUpgrade = null;
        this.visualSuperpack = null;
        this.evolutionManager = null;
        this.legendaryPack = null;
        this.legendaryLinkFX = null;
        this.worldEvents = null;
        this.weatherPack = null;
        this.personalityFX = null;
        this.worldFXPack = null;

        // Ambient entities
        this.ambientEntityManager = null;

        // Memory trails
        this.memoryTrails = null;

        // Quantum illusions
        this.quantumIllusions = null;

        // Colony ecosystem
        this.colonyManager = null;

        // Dream Depth Pack (AI DOF simulation)
        this.dreamDepthPack = null;
        this.dreamDepthEffects = null;
        this.dreamDepthWorldSystems = null;
        this._teardownDreamDepthDebugBridge();

        // Safe Mobility Pack 4.0 (dash + double jump)
        this.mobilityPack = null;
        this.harmonyDebugOverlay = null;

        // ====================================================================
        // TIER 1 INTEGRATION: Core Active Systems (Phase A)
        // ====================================================================
        this.linkCorruptionTransmission = null;
        this.harmonyStabilizationSystem = null;
        this.harmonyCascade = null;

        // Compatibility bridges for legacy healing/test helpers.
        // These stay read-only from the runtime's perspective and mirror the
        // canonical systems / live visual metrics without introducing a second authority.
        Object.defineProperty(this, 'harmonyStabilization', {
            configurable: true,
            enumerable: true,
            get: () => this.harmonyStabilizationSystem,
            set: (value) => {
                this.harmonyStabilizationSystem = value;
            }
        });
        Object.defineProperty(this, 'nodeDynamicMetrics', {
            configurable: true,
            enumerable: true,
            get: () => this._nodeDynamicMetricsBridge || getCachedVisualMetrics() || {
                avgSynergy: 0,
                avgHarmony: 0,
                avgCorruption: 0,
                avgStability: 0.5,
                avgLoadPressure: 0
            },
            set: (value) => {
                this._nodeDynamicMetricsBridge = value;
            }
        });

        // ====================================================================
        // NETWORK STATE PROPERTY: Unified metrics interface for visual systems
        // ====================================================================
        // Provides canonical network metrics to healing, recovery, and other visual systems
        // Maps nodeDynamicMetrics to canonical field names expected by visual systems
        Object.defineProperty(this, 'networkState', {
            configurable: true,
            enumerable: true,
            get: () => {
                const metrics = this.nodeDynamicMetrics || {};
                const harmony = metrics.avgHarmony ?? 0;
                const synergy = metrics.avgSynergy ?? 0;
                const corruption = metrics.avgCorruption ?? 0;
                const stability = metrics.avgStability ?? 0.5;
                const loadPressure = metrics.avgLoadPressure ?? 0;

                return {
                    // Canonical fields
                    harmony,
                    synergy,
                    corruption,
                    stability,
                    loadPressure,
                    networkStress: 1 - stability,
                    // Alternative field names for compatibility
                    harmonyFlow: harmony,
                    networkSynergy: synergy,
                    corruptionLevel: corruption,
                    avgHarmony: harmony,
                    avgSynergy: synergy,
                    avgCorruption: corruption,
                    avgStability: stability,
                    avgLoadPressure: loadPressure
                };
            }
        });

        // ====================================================================
        // TIER 2 VISUAL INTEGRATION: Visual System Wiring
        // ====================================================================
        // T2-002: Corruption Visual Integration
        this.t2CorruptionVisualIntegration = null;
        
        // T2-003: Harmony Visual Consumer
        this.t2HarmonyVisualConsumer = null;
        
        // ====================================================================
        // TIER 4 GAMEPLAY INTEGRATION: Gameplay Layer
        // ====================================================================
        this.tier4GameplayIntegration = null;
        
        // ====================================================================
        // PHASE 5: MULTI-NETWORK SYNCHRONIZATION
        // ====================================================================
        this.phase5MultiNetworkOrchestrator = null;
        this.phase5InterNetworkConnectionVisuals = null;
        this.phase5InterNetworkVisualizationBridge = null;
        this.phase5CascadePropagationVisuals = null;
        this.phase5CascadeVisualizationBridge = null;
        this._multiNetworkThresholdListener = null;
        this._phase5AutoConnectUnsub = null;

        // ====================================================================
        // NODE HIERARCHY SYSTEM v1.0 — Parent-Child Node Relationships
        // ====================================================================
        this.nodeHierarchyBridge = null;

        // Node Visuals 4.0 (high-quality node visual upgrade)
        this.nodeVisuals4 = null;

        // Node Evolution 2.0 (safe visual node evolution system)
        this.nodeEvolution = null;

        // Safe Node Archetypes Pack (visual diversity system)
        this.nodeArchetypesPack = null;

        // Evolving Link FX 2.0 (visual link evolution system)
        this.evolvingLinkFX = null;

        // Node Personality 2.0 (unique personality signatures)
        this.nodePersonality = null;

        // REMOVED (2026-05-14): personalityShaderBridge, personalityShaderEffects, advancedShaderFX — moved to LEGACY/
        this.personalityShaderBridge = null;
        this.personalityShaderEffects = null;
        this.advancedShaderFX = null;

        // Phase 3c Archetype Shader Modes (Week 16 - GPU shader mode orchestration)
        this.archetypeShaderModes = null;


        // Week 18 Node Selection Shader Activation (selection-driven intensity boost)
        this.nodeShaderActivation = null;

        // Week 18 (Alt) Link Personality State Machine (dynamic link personalities)
        this.linkPersonalityStateMachine = null;

        // REMOVED: synergyBonusVisualization — moved to LEGACY/april (2026-04-22)

        // Week 19 (Alt) Synergy Bonus FX Layer (GPU-based synergy flares)
        this.synergyBonusFXLayer = null;

        // Week 20 Synergy Resonance Shader Pack (multi-frequency resonance FX)
        this.synergyResonanceShaderPack = null;

        // Week 21 AI Network Resonance Feedback (network-level feedback)
        this.resonanceFeedback = null;

        // Week 22 Synergy Chain Reactions (emergent cascade events)
        this.synergyChainReaction = null;
        this._releaseContainmentRuntime = createAtomaReleaseContainmentRuntimeState();

        // REMOVED: synergyCascadeFXBridge — moved to LEGACY/april (2026-04-22)

        // Synergy Highways (route computation) + 3D highway visuals
        this.synergyHighwayVisuals3D = null;
        this.synergyHighwayVisuals3D = null;
        this._synergyHighwayRefreshAcc = 0;

        // Week 25 (Bonus) Wave Interference Engine (multi-origin wave system)
        this.waveInterferenceEngine = null;

        // Week 25 (Bonus) Wave Shader Bridge (GPU uniform injection)
        this.waveShaderBridge = null;

        // Week 25 (Bonus) Wave Shader Material Patch (GPU shader patching)
        this.waveShaderMaterialPatch = null;

        // Week 25 (Bonus) Wave Travel Shader Pack (GPU motion effects)
        this.waveTravelShaderPack = null;

        // Week 25 (Bonus) Wave Dynamics Shader Pack (advanced FX layers)
        this.waveDynamicsShaderPack = null;

        // Week 27: Wave Particle Emitter (GPU-reactive particle FX)
        this.particleEmitter = null;

        // REMOVED: cascadeAccelSetup — moved to LEGACY/april (2026-04-22)

        // Link Micro-Impulses (event-driven electrical responses)
        this.microImpulseAdapter = null;

        // Pulse Intersection Impulses (neural firing on wave contact)
        this.pulseIntersectionAdapter = null;

        // Pulse Wave System Bridge (connects waves to neural firing)
        this.pulseWaveSystemBridge = null;
        this.pulseWaveBridge = null;

        // Pulse Boundary Interaction Adapter (energy dissipation/absorption at nodes)
        this.pulseBoundaryInteractionAdapter = null;

        // Synaptic Gating Adapter (selective pulse amplification/dampening at nodes)
        this.synapticGatingAdapter = null;

        // Synaptic Fatigue Adapter (long-term wear and recovery at nodes)
        this.synapticFatigueAdapter = null;

        // Network Fatigue System (canonical node fatigue writer)
        this.networkFatigueSystem = null;

        // Synaptic Specialization Adapter (visual learning from repeated behavior)
        this.synapticSpecializationAdapter = null;

        // Competition & Dominance Adapter (territorial politics — Session 113+)
        this.competitionDominance = null;

        // ====================================================================
        // SESSION 128: INFLUENCE ATTENUATION & ABSORPTION VISUALS
        // Visualizes how harmonic influence weakens/absorbs at non-harmonic nodes
        // ====================================================================
        this.influenceAttenuationAbsorption = null;

        // ====================================================================
        // SESSION 129: INFLUENCE REFLECTION & BACK-PRESSURE VISUALS
        // Visualizes how resistant nodes reject influence through reflection
        // ====================================================================
        this.influenceReflection = null;

        // ====================================================================
        // SESSION 130: STANDING WAVE & OSCILLATION TRAP VISUALS
        // Visualizes energy trapped between opposing nodes
        // ====================================================================
        this.standingWaveTrap = null;

        // ====================================================================
        // SESSION 131: STANDING WAVE VISUAL RENDERER
        // Renders mesh visuals for standing wave patterns
        // ====================================================================
        this.standingWaveRenderer = null;

        // ====================================================================
        // SESSION 146: NODE LINKED AURA RENDERER
        // Noise-driven aura meshes around nodes
        // ====================================================================
        this.nodeAuraRenderer = null;
        this.linkAuraSystem = null;
        // REMOVED: corruptionAuraDesaturation — moved to LEGACY/april (2026-04-22)

        // ====================================================================
        // PHASE 3C WEEK 10: LINK AURA SYSTEM
        // GPU-driven cylindrical halo system around links
        // ====================================================================

        // ====================================================================
        // SESSION 132: WAVE INTERFERENCE PATTERN SYSTEM
        // Visualizes constructive/destructive wave collision patterns
        // ====================================================================
        this.waveInterference = null;
        this.wavePatternSystem = null;

        // ====================================================================
        // SESSION 133: RESONANCE RUPTURE VISUAL SYSTEM
        // Visualizes standing wave collapse and pressure release
        // ====================================================================
        this.resonanceRupture = null;
        this.harmonicHealingRecovery = null;

        // ====================================================================
        // REGIONAL EQUILIBRIUM FIELD SYSTEM
        // Visualizes territorial equilibrium and power balance shifts
        // ====================================================================
        this.regionalEquilibrium = null;

        // Extraction Pack v1.0 — Runtime Orchestration
        this.metricsRuntime_v1 = null;
        this.networkStressAggregator = null;
        // REMOVED: personalityRuntime_v1 — moved to LEGACY/april (2026-04-22)

        // Extraction Pack v1.1 — Runtime Orchestration (World & FX)
        this.worldRuntime_v1 = null;
        this.fxRuntime_v1 = null;

        // Extraction Pack v1.2 — Runtime Orchestration (Node Editor & UI)
        this.nodeEditorRuntime_v1 = null;

        // Extraction Pack v1.3 — Runtime Orchestration (Input Handling)
        this.inputRuntime_v1 = null;

        // Phase 3c Performance Mode (centralized FX scaling controller)
        this.fxPerformance = null;
        // this.fxPerformanceScaler = null;  // LEGACY/april — disconnected 2026-04-22

        // Phase 3c Adaptive Performance Monitor (automatic FPS-based LowFX toggling)
        this.adaptivePerformanceMonitor = null;

        // Phase 3c Smooth Transition Layer (Week 4.5 - polished quality mode transitions)
        this.fxPerformanceTransition = null;

        // Core Metrics Overlay 1.0 (network metrics + temporal units)
        this.coreMetricsOverlay = null;

        // System State Overlay (visual representation of harmony, synergy, corruption)
        this.systemStateOverlay = null;
        
        // Zone Audio Reactivity (subtle per-zone audio modulation)
        this.zoneAudioReactivity = null;

        // Core Metrics View Model (global read-only snapshot)
        this.coreMetricsVM = createEmptyCoreMetricsViewModel();

        // DISABLED: Metric-Reactive World Events 1.0 (legacy, replaced by Phase 5-7 architecture)
        // this.metricReactiveEvents = null;

        // Safe World Reset Fix 1.0 (safe map transition system)
        this.worldResetFix = new SafeWorldResetFix1_0();

        // World Transition Guard (prevent re-entrant loadWorld/createWorld calls)
        this._worldTransitionInProgress = false;

        // World Event Listener Registry (prevent memory leaks on world switch)
        this._worldEventDisposers = [];

        // Node Inspect Overlay 1.0 (initialized after scene/camera ready)
        this.nodeInspectOverlay = null;

        // Safe Metrics FX 1.1 (subtle metric-based visual effects)
        this.metricsVisualFX = new SafeMetricsFX1_1();

        // REMOVED: Node Personality System 2.0 - moved to LEGACY (2026-04-03)
        // this.nodePersonalitySystem = new NodePersonalitySystem2_0();
        this.nodePersonalitySystem = null;

        // Node Micro-Events 1.0 (personality-driven spontaneous events)
        this.nodeMicroEvents = null; // Initialized after scene/camera ready

        // World Personality Controller 2.0 (world reacts to network mood)
        this.worldPersonalityController = null; // Initialized after scene/camera/renderer ready

        // Mythic Ritual Controller 1.0 (rare ceremonial events)
        this.mythicRitualController = null; // Initialized after world controller ready

        // Signature Moment Director (cinematic event orchestration)
        this.signatureMomentDirector = null;

        // ====================================================================
        // SYNERGY VISUAL EFFECTS v1.0 — Pure world-space visual feedback
        // Soft pulse + visual time elasticity (zero gameplay impact)
        // ====================================================================
        // REMOVED: synergyPulseVisuals — moved to LEGACY/april (2026-04-22)
        this.visualNetworkTimeElasticity = null;  // Extreme synergy time reversal effect
        this.harmonicResonanceCoupling = null;    // Synergy-driven link resonance coupling
        this.harmonicHubAuraSystem = null;        // Harmonic hub resonance fields (Session 126)
        // REMOVED: harmonicInfluencePropagation — moved to LEGACY (2026-05-14)
        this.harmonicCascadeAmplification = null; // Hub-to-hub cascade amplification (Session 145)
        this.linkResonanceFlowSystem = null;      // Directional link resonance flow (Session 124)
        this.harmonicPhaseSynchronization = null; // Hub phase alignment (Session 146)
        // REMOVED: preCascadeVisualHint — moved to LEGACY/april (2026-04-22)
        // REMOVED: harmonicNodeResonanceHalos — moved to LEGACY (2026-05-14)
        this.echoTrailsSystem = null;             // Echo trails shader system
        this.echoTrailsIntegration = null;        // Echo trails integration layer

        // ====================================================================
        // PHASE 8: NETWORK RITUAL VISUAL ORCHESTRATION
        // Pure visual ceremony layer for rituals (no gameplay logic)
        // ====================================================================
        this.networkRituals = null;                        // Initialized after ritual dependencies ready
        this.phase8VisualBridge = null;                    // Initialized after scene ready
        this.phase8RitualOrchestration = null;             // Initialized after wiring ready

        // Mythic Seed Glyph System (elegant visual markers)
        // this.mythicSeedGlyph = null;  // LEGACY/april — disconnected 2026-04-22

        // Legacy Debug Cone Cleanup (removes old debug meshes)
        this.legacyConeCleanup = null; // Initialized after scene ready

        // Fractal Hex Marker System (replaces debug cones with elegant markers)
        this.fractalHexMarker = null; // Initialized after scene ready

        // ATOMA Glyph System 3.0 (unified glyph framework)
        // ATOMA Glyph System 4.0 (animated meaning edition)
        this.glyphSystem4 = null; // Initialized after scene ready

        // ATOMA Glyph Layer 4.0 (multi-glyph fusion)
        this.glyphLayer4 = null; // Initialized after scene ready
        // Glyph stack policy:
        // - Keep Layer4 (hover/semantic pipeline)
        // - Disable legacy/full marker stacks (GlyphSystem4)
        this.enableGlyphSystem4 = false;
        this.enableGlyphLayer4 = true;
        this.enableGlyphLayer4FullVisuals = true;
        if (this.enableGlyphLayer4) {
            this.enableGlyphSystem4 = false;
        }

        // Semantic Glyph AI 5.0 (intelligent visual node communication)
        this.semanticGlyphAI = null; // Initialized after Glyph Layer 4.0 ready

        // Glyph Fusion Overlay 4.1 (semantic fusion layer)
        this.glyphFusionOverlay = null; // Initialized after SemanticGlyphAI ready

        // Procedural Meaning Engine 1.0 (lightweight 3D semantic glyphs)
        this.proceduralMeaningEngine = null; // Initialized after SemanticGlyphAI ready

        // Link Glyph Flow 1.0 (AI communication packets along links)
        this.linkGlyphFlow = null; // Initialized after LinkingSystem ready

        // Glyph Purity Mode 5.1 (enforces minimal atmospheric visuals)
        this.glyphPurityMode = null; // Initialized after scene ready

        // Adaptive Glyph Rendering 1.0 (responsive to node metrics)
        this.adaptiveGlyphRendering = null; // Initialized after scene ready

        // Linked Glyph Synchronization 1.0 (coordinated animations across linked nodes)
        this.linkedGlyphSync = null; // Initialized after scene ready

        // Linked Glyph Messaging 3.0 (ultra symbolic AI language transport)
        this.linkedGlyphMessaging = null; // Initialized after semantic AI ready

        // Recursive Glyph Messaging 4.0 (recursive meaning chains)
        this.recursiveGlyphMessaging = null; // Initialized after semantic AI ready

        // Recursive Glyph Signal System (attention-driven, transient SIGNAL language)
        this.recursiveGlyphSignalSystem = null; // Initialized after semantic AI + linking + selection ready

        // Emergent Thought Storms 5.0 hard-disabled for release stabilization.
        this.emergentThoughtStorms = null;

        // AI Narrative Patterns 6.0 (narrative structure layer)
        this.narrativePatterns = null; // Initialized after recursive messaging ready

        // Extreme AI Shader Test Suite (comprehensive diagnostics)
        this.extremeShaderTestSuite = null; // Initialized after scene ready

        // Safe New Node Categories 1.0 (Mythic, Prime, Error nodes)
        this.newNodeCategories = null; // Initialized after scene ready

        // New Node Category Visuals 1.0 (visual enhancement for new categories)
        this.newNodeVisuals = null; // Initialized after scene ready

        // Extreme Link Visual Pack 3.0 (AAA-quality link visuals)
        this.extremeLinkVisuals = null; // Initialized after scene ready

        // Neural Curve Link Visuals 1.0 (dynamic Bézier curved links)
        this.neuralCurveLinkVisuals = null; // Initialized after scene ready

        // AI Consciousness Layer 1.0 (neural thought visualization)
        this.consciousnessLayer = null; // Initialized after linking system ready

        // Extreme Link Visuals 4.0 (neural curvature & depth)
        this.extremeLinkVisuals4 = null; // Initialized after linking system ready
        
        // Link Visual Mood System 1.0 (calm, premium, intense, meditative presets)
        this.linkVisualMoodSystem = null; // Initialized after all link systems ready

        // ATOMA Language Engine 2.0 (grammar + semantic language processing)
        this.languageEngine = new AtomaLanguageEngine2_0();
        
        // Visual Hierarchy Correction System v1.0 (Session 20 - enforces visual dominance)
        this.visualHierarchyCorrection = null; // Initialized in createAINodes()

        // Node Surface Protection Rule v2.0 (Session 24 Enhanced - prevents aura occlusion)
        this.nodeSurfaceProtection = null; // Initialized after linking system ready

        // Link Recommendation AI 1.0 (AI-driven link pairing suggestions)
        this.linkRecommendationAI = null; // Initialized after linking system ready

        // Link Automation Engine 1.0 (automatic link creation from recommendations)
        this.linkAutomationEngine = null; // Initialized after recommendation AI ready

        // Node Inspect Linguistic Overlay (semantic node inspection display)
        this.linguisticOverlay = null; // Initialized after consciousness layer ready

        // ATOMA Language Engine 3.0 (procedural AI poetry)
        this.poetryEngine = null; // Initialized after consciousness layer ready

        // ========================================================================
        // PHASE 1 LINK SYSTEMS REACTIVATION (Session 107+)
        // ========================================================================
        // Infrastructure recovery: LinkCorrelationEngine + Hardening + History
        this.linkCorrelationEngine = null;  // Synergy cluster detection
        this.linkHistoryTracker = null;     // Temporal link analytics
        // linkingSystemHardening applied inline after linkingSystem init
        
        this.linkQualityFeedbackLoop = null; // Initialized after linking system ready
        this.linkMLRecommendationEngine = null; // Initialized after linking system ready
        this.userAcceptanceTracker = null; // Initialized after linking system ready
        this.nodeLinkerRepairLayer = null; // Initialized after linking system ready

        // ========================================================================
        // ATOMA UI 3.1 - Node Interaction & HUD Systems (PARTIALLY DISABLED)
        // ========================================================================
        // DISABLED: this.autoDetect = null;           // REMOVED - NodeLinking2_3 handles detection
        this.categoryLegend = null;       // Category reference panel (passive display)
        this.emotionalFeed = null;        // AI poetic status feed (passive display)
        this.nodeLinking = null;          // ← REPLACED by NodeLinking2_3 (see UI 3.4–3.7)
        // DISABLED: this.hoverTooltip = null;         // REMOVED - Conflicts with new interaction

        // ========================================================================
        // ATOMA UI 3.2 - Interaction Polishing & Selected Node System
        // ========================================================================
        this.selectedNodeBadge = null;    // Badge under crosshair (QNT-ORB-SYN)
        this.selectedNodeHighlight = null; // Pulsing highlight shader
        this.selectedNodeLabel = null;    // Floating label above node

        // REMOVED: ATOMA UI 3.3 - Safe Unlinking - moved to LEGACY (2026-04-03)
        // (SafeNodeUnlinking3_3 is static, no instance needed)

        // ATOMA UI 3.4 - Core Selection Rewrite
        // ========================================================================
        this.selectionCore = null;        // Single source of truth for selection
        this.selectedNodeTopBar = null;   // Top center bar showing selected node info

        // ATOMA UI 3.7 - Double-Click Primary Node System
        // ========================================================================
        this.primaryNodeTopBar = null;    // Legacy primary node HUD is disabled and removed

        // OLD UI 3.0 - To be disabled
        this.nodeInspectPanel = null;     // Used by UI 3.2 for persistence

        this.init();
        this.setupPlayer();
        // ========================================================================
        // ATOMA DEBUG HUD 1.0 - Initialize after player setup
        // ========================================================================
        this.debugHUD = new AtomaDebugHUD_1_0();
        
        this.createWorld('MAP_SWITCH');
        this.setupVisualSuperpack();
        this.setupCinematicUpgrade();
        // DISABLED: this.setupNodeEditor(); // moved to LEGACY (2026-05-14)
        this.setupEvolutionManager();
        // DISABLED: this.setupLegendaryPack(); // moved to LEGACY (2026-04-03)
        this.setupLegendaryLinkFX();
        this.environmentDomain = new EnvironmentDomainController(
            this.scene,
            this.worldRoot,
            this.environmentRoot,
            this.frameScheduler,
            {
                SafeWorldFXPack,
                SafeAIWeatherPack,
                SafeQuantumIllusionsPack1,
                AmbientEntityManager,
                // EmergentThoughtStorms5_0,
                EnvironmentalHazards,
                SafeLegendaryWorldEvents,
                WorldPersonalityController,
                MythicRitualController,
                MetricReactiveWorldEvents,
                SafeDreamDepthPack,
                DreamDepthEffectManager,
                SafeColonyExpansion2,
                camera: this.camera,
                aiNodes: this.aiNodes,
                linkingSystem: this.linkingSystem,
                worldEvents: this.worldEvents,
                legendaryPack: this.legendaryPack,
                evolutionManager: this.evolutionManager,
                recursiveGlyphMessaging: this.recursiveGlyphMessaging,
                semanticGlyphAI: this.semanticGlyphAI,
                renderer: this.renderer,
                coreMetricsOverlay: this.coreMetricsOverlay,
                semanticBus: this.semanticBus,
                player: this.player,
                audioSystem: this.audioSystem || null,
                synergyMap: this.synergyMap || {},
                trafficMap: this.trafficMap || {},
                worldContextProvider: () => this._getCanonicalWorldContext()
            }
        );
        this.environmentDomain.init();
        this.worldEvents = this.environmentDomain?.instances?.worldEvents || this.worldEvents;
        this.worldPersonalityController = this.environmentDomain?.instances?.worldPersonalityController || this.worldPersonalityController;
        this.metricReactiveEvents = this.environmentDomain?.instances?.metricReactiveEvents || this.metricReactiveEvents;
        this.worldEventCoordinator = this.environmentDomain?.instances?.worldEventCoordinator || this.worldEventCoordinator;
        this.dreamDepthPack = this.environmentDomain?.instances?.safeDreamDepthPack || this.dreamDepthPack;
        this.dreamDepthEffects = this.environmentDomain?.instances?.dreamDepthEffectManager || this.dreamDepthEffects;
        this.quantumIllusions = this.environmentDomain?.instances?.quantumIllusions || this.quantumIllusions;
        this.ambientEntityManager = this.environmentDomain?.instances?.ambientEntityManager || this.ambientEntityManager;
        this.emergentThoughtStorms = null;
        this.colonyManager = this.environmentDomain?.instances?.colonyExpansion || this.colonyManager;
        this.hazards = this.environmentDomain?.instances?.environmentalHazards || this.hazards;
        this._syncDreamDepthRefs();
        if (typeof window !== 'undefined') {
          window.worldEvents = this.worldEvents;
          window.worldEventCoordinator = this.worldEventCoordinator;
        }
        if (this.hazards && this.currentMode === 'fractal') {
            // Fractal Valley world pass: no inherited anomaly set pieces here.
        }
        this.setupPersonalityFX();
        // REMOVED: this.setupMemoryTrails(); - moved to LEGACY/GRAVEYARD (2026-04-05)
        this.setupColonyManager();
        this.setupMobilityPack();
        // DISABLED: this.setupNodeArchetypesPack(); // System permanently disconnected
        // DISABLED: this.setupEvolvingLinkFX(); // moved to LEGACY (2026-04-03)
        this.setupNodePersonality();
        this.setupCoreMetricsOverlay();
        if (this.environmentDomain?.setCoreMetricsOverlay) {
            this.environmentDomain.setCoreMetricsOverlay(this.coreMetricsOverlay);
            this.metricReactiveEvents = this.environmentDomain?.instances?.metricReactiveEvents || this.metricReactiveEvents;
        }
        this.setupSystemStateOverlay();
        this.setupZoneAudioReactivity();
        this.setupMetricReactiveEvents();
        this.setupSemanticGlyphAI();
        this.setupGlyphFusionOverlay();
        this.setupProceduralMeaningEngine();
        try {
            this.setupLinkedGlyphMessaging();
        } catch (err) {
            console.warn('[main.js] LinkedGlyphMessaging setup failed, continuing cascade bootstrap:', err);
        }
        this.setupRecursiveGlyphMessaging();
        this.setupRecursiveGlyphSignalSystem();
        this.registerVisualGlyphSchedulers(); // move glyph/link language systems to FrameScheduler visual (30Hz)
        this.setupEmergentThoughtStorms();
        this.setupAINarrativePatterns();
        this.setupModeSwitch();
        this.setupPerformanceMode();
        // DISABLED: this.setupNodeEditorInput(); // moved to LEGACY (2026-05-14)
        // DISABLED: this.setupExtremeShaderTestSuite(); // moved to LEGACY (2026-04-03)
        this.setupNewNodeCategories();
        // DISABLED: this.setupNewNodeCategoryVisuals(); // moved to LEGACY (2026-04-03)
        // this.setupExtremeLinkVisuals();      // Temporarily disabled for overlay-free link diagnostics
        // this.setupNeuralCurveLinkVisuals();  // Temporarily disabled for overlay-free link diagnostics
        // this.setupExtremeLinkVisuals4();     // Temporarily disabled for overlay-free link diagnostics
        // DISABLED: this.setupLinkVisualMoodSystem(); // moved to LEGACY (2026-04-03)
        this.setupAIConsciousnessLayer();
        this.setupSignatureMomentDirector();
        this.setupLanguageEngine();
        this.setupLinguisticOverlay();
        this.setupPoetryEngine();
        this.setupLoreFragmentEmitter();

        // ========================================================================
        // SESSION 108+: LINK MICRO-IMPULSES (Event-Driven Electrical Responses)
        // ========================================================================
        this.setupLinkMicroImpulses();
        
        // ========================================================================
        // SESSION 108+ EXTENDED: PULSE INTERSECTION IMPULSES
        // ========================================================================
        this.setupPulseIntersectionImpulses();

        // ========================================================================
        // PULSE WAVE SYSTEM BRIDGE — Connect waves to neural firing
        // ========================================================================
        this.setupPulseWaveSystemBridge();

        // ========================================================================
        // PULSE BOUNDARY INTERACTION ADAPTER — Energy dissipation at node boundaries
        // ========================================================================
        this.setupPulseBoundaryInteraction();

        // ========================================================================
        // SYNAPTIC GATING ADAPTER — Selective pulse amplification/dampening at nodes
        // ========================================================================
        this.setupSynapticGating();

        // ========================================================================
        // SYNAPTIC FATIGUE ADAPTER — Long-term wear and recovery at nodes
        // ========================================================================
        this.setupSynapticFatigue();

        // ========================================================================
        // NETWORK FATIGUE SYSTEM — Canonical fatigue writer for node metrics
        // ========================================================================
        this.setupNetworkFatigue();

        // ========================================================================
        // SYNAPTIC SPECIALIZATION ADAPTER — Visual learning from behavior
        // ========================================================================
        this.setupSynapticSpecialization();

        // ========================================================================
        // COMPETITION & DOMINANCE VISUALIZATION — Territorial politics
        // ========================================================================
        this.setupCompetitionDominance();

        // ========================================================================
        // SESSION 120: CASCADE PARTICLE SYSTEM
        // Semantic particles with shape and velocity encoding
        // ========================================================================
        this.setupCascadeParticleSystem();

        // ========================================================================
        // SESSION 117B: RESONANCE CASCADE VISUALIZATION
        // Visualizes resonance cascades from conflict zones
        // ========================================================================
        this.setupResonanceCascadeVisualization();

        // ========================================================================
        // SESSION 146: CASCADE RESONANCE WAVE VISUALIZATION
        // Visualizes subtle wave propagation between synchronized hubs
        // ========================================================================
        this.setupCascadeResonanceWaveVisualization();

        // ========================================================================
        // SESSION 128: INFLUENCE ATTENUATION & ABSORPTION VISUALS
        // Visualizes how harmonic influence weakens/absorbs at non-harmonic nodes
        // ========================================================================
        this.setupInfluenceAttenuationAbsorption();

        // ========================================================================
        // SESSION 129: INFLUENCE REFLECTION & BACK-PRESSURE VISUALS
        // Visualizes how resistant nodes reject influence through reflection
        // ========================================================================
        this.setupInfluenceReflection();

        // ========================================================================
        // SESSION 130: STANDING WAVE & OSCILLATION TRAP VISUALS
        // Visualizes energy trapped between opposing nodes
        // ========================================================================
        this.setupStandingWaveTrap();

        // ========================================================================
        // SESSION 131: STANDING WAVE VISUAL RENDERER
        // Renders mesh visuals for standing wave patterns
        // ========================================================================
        this.setupStandingWaveRenderer();
        this.standingWaveTrap.visualRenderer = this.standingWaveRenderer;
        this.standingWaveTrapSystem.visualRenderer = this.standingWaveRenderer;

        // ========================================================================
        // SESSION 146: NODE LINKED AURA RENDERER
        // Noise-driven aura meshes around nodes
        // ========================================================================
        this.setupNodeAuraRenderer();

        // ========================================================================
        // PHASE 3C WEEK 10: LINK AURA SYSTEM
        // GPU-driven cylindrical halo system around links
        // ========================================================================
        this.setupLinkAuraSystem();

        // ========================================================================
        // SESSION 132: WAVE INTERFERENCE PATTERN SYSTEM
        // Visualizes constructive/destructive wave collision patterns
        // ========================================================================
        this.setupWaveInterference();

        // ========================================================================
        // SESSION 133: RESONANCE RUPTURE VISUAL SYSTEM
        // Visualizes standing wave collapse under pressure
        // ========================================================================
        this.setupResonanceRupture();

        // ========================================================================
        // MERGED: HARMONIC HEALING + RECOVERY VISUAL SYSTEM
        // Replaces Sessions 134 + 138. 100% event-driven via canonical tiered events.
        // ========================================================================
        this.setupHarmonicHealingRecoverySystem();

        // ========================================================================
        // DRAMATURGY → HEALING COUPLING
        // Wire dramaturgy phase events to healing systems so that corruption payoff
        // triggers recovery waves, healing particles, and restoration halos.
        // ========================================================================
        if (this.semanticBus) {
            this.semanticBus.subscribe('dramaturgy.phase', (payload) => {
                const state = {
                    dominantFamily: payload?.family || null,
                    dominantPhase: payload?.phase || null,
                    dominantIntensity: payload?.intensity || 0
                };
                if (this.harmonicHealingRecovery && typeof this.harmonicHealingRecovery.setDramaturgyModulation === 'function') {
                    this.harmonicHealingRecovery.setDramaturgyModulation(state);
                }
            });
        }

        // ========================================================================
        // REGIONAL EQUILIBRIUM FIELD SYSTEM
        // Visualizes territorial equilibrium and long-term power balance shifts
        // ========================================================================
        this.setupRegionalEquilibrium();
        this.setupCascadingRuptureAndFailure();
        this.setupHarmonicResonanceFeedback();
        this.setupResonanceEchoTrails();
        this.setupHarmonicTopologyLearning();
        this.setupSynapticConflictSystem();
        this.setupInterdimensionalConflictSystem();
        this.setupTopologyBiasVisualization();
        this.setupProceduralHarmonicGlyphs();
        this.setupRegionalHarmonicCycles();
        this.setupGlyphAnimationModulator();
        this.setupCompositeGlyphResonanceFeedback();

        // Debug probe: reflection → standing wave traps → resonance ruptures
        if (typeof window !== 'undefined') {
            window.atomaDebug = {
                reflection: this.influenceReflection,
                trap: this.standingWaveTrap || this.standingWaveTrapSystem,
                renderer: this.standingWaveRenderer || null,
                rupture: this.resonanceRupture,
                cascade: this.cascadingRuptures
            };

            const ensureWaveDebugOverlay = () => {
                if (!window.document) return null;
                let overlay = window.document.getElementById('wave-debug-overlay');
                if (overlay) return overlay;

                overlay = window.document.createElement('div');
                overlay.id = 'wave-debug-overlay';
                overlay.setAttribute('aria-live', 'polite');
                overlay.style.cssText = [
                    'position:fixed',
                    'top:calc(12px + 1.5cm)',
                    'right:12px',
                    'z-index:2147483647',
                    'padding:16px 18px',
                    'border-right:2px solid rgba(0,200,220,0.35)',
                    'border-radius:8px 0 0 8px',
                    'background:rgba(8,12,20,0.75)',
                    'backdrop-filter:blur(16px) saturate(1.2)',
                    '-webkit-backdrop-filter:blur(16px) saturate(1.2)',
                    'color:rgba(200,225,245,0.85)',
                    "font-family:'Rajdhani','Segoe UI',sans-serif",
                    'font-size:11px',
                    'line-height:1.5',
                    'letter-spacing:0.03em',
                    'pointer-events:none',
                    'user-select:none',
                    'white-space:pre'
                ].join(';');
                overlay.textContent = 'Loading Wave HUD...';
                const mountPoint = window.document.body || window.document.documentElement;
                mountPoint?.appendChild?.(overlay);
                syncWaveDebugOverlayVisibility();
                return overlay;
            };

            const syncWaveDebugOverlayVisibility = () => {
                if (!window.document) return;

                const overlay = window.document.getElementById('wave-debug-overlay');
                if (!overlay) return;

                const visible = UIVisibilityConfig.waveSystemHUD !== false;
                overlay.style.display = visible ? 'block' : 'none';
                overlay.setAttribute('aria-hidden', String(!visible));
            };

            const readWaveDebugState = () => {
                const dbg = window.atomaDebug || {};
                const activeLinks = this.activeLinkCount;
                const reflectionActive =
                    dbg.reflection?.reflectionPulsePool?.filter?.((p) => p?.active)?.length ??
                    dbg.reflection?.reflectionPulses?.filter?.((p) => p?.active)?.length ??
                    0;
                const resistantNodes = dbg.reflection?.resistantNodes?.size ?? 0;
                const pressureZones = dbg.reflection?.pressureZones?.length ?? 0;
                const activeTraps =
                    dbg.trap?.getActiveTraps?.() ??
                    dbg.trap?.oscillationTraps?.filter?.((t) => t?.active) ??
                    [];
                const traps = activeTraps.length;
                const primaryTrap = activeTraps[0] || null;
                const activeTrapAmplitude = activeTraps.reduce((max, trap) => {
                    const amplitude = Number(trap?.amplitude) || 0;
                    return amplitude > max ? amplitude : max;
                }, 0);
                const activeTrapAverageAmplitude = activeTraps.length > 0
                    ? activeTraps.reduce((sum, trap) => sum + (Number(trap?.amplitude) || 0), 0) / activeTraps.length
                    : 0;
                const primaryTrapState = primaryTrap?.state || 'none';
                const primaryTrapRadius = Number(primaryTrap?.trapRadius) || 0;
                const antinodeMeshes =
                    dbg.renderer?.antinodeMeshPool?.filter?.((entry) => entry?.active && entry?.mesh?.visible)?.length ??
                    0;
                const ruptureCount = dbg.rupture?.ruptures?.length ?? 0;
                const activeCascades = dbg.cascade?.activeCascades?.filter?.((c) => c?.active)?.length ?? 0;
                const preRuptureZones = dbg.rupture?.preRuptureZones?.length ?? 0;
                const recoveryStats = dbg.recovery?.getStats?.() ?? null;
                const healingParticleStats = dbg.healingParticles?.getStats?.() ?? null;
                const recoveringZones = recoveryStats?.recoveringZones ?? 0;
                const wavePoolActive = recoveryStats?.wavePoolActive ?? 0;
                const haloPoolActive = recoveryStats?.haloPoolActive ?? 0;
                const activeParticles = healingParticleStats?.activeParticles ?? 0;

                return {
                    activeLinks,
                    resistantNodes,
                    pressureZones,
                    reflectionActive,
                    pressureZonesActive: pressureZones,
                    traps,
                    primaryTrapState,
                    primaryTrapRadius,
                    activeTrapAmplitude,
                    activeTrapAverageAmplitude,
                    antinodeMeshes
                    ,
                    ruptureCount,
                    activeCascades,
                    preRuptureZones,
                    recoveringZones,
                    wavePoolActive,
                    haloPoolActive,
                    activeParticles
                };
            };

            const updateWaveDebugOverlay = () => {
                const dbg = window.atomaDebug || {};
                dbg.reflection = this.influenceReflection;
                dbg.trap = this.standingWaveTrap || this.standingWaveTrapSystem;
                dbg.renderer = this.standingWaveRenderer || null;
                dbg.rupture = this.resonanceRupture;
                dbg.healingRecovery = this.harmonicHealingRecovery;
                dbg.healingParticles = this.healingParticles;
                window.atomaDebug = dbg;

                const state = readWaveDebugState();

                const overlay = ensureWaveDebugOverlay();
                if (overlay) {
                    overlay.textContent = [
                        `=== WAVE SYSTEM ===`,
                        `Active Links:      ${state.activeLinks}`,
                        `Resistant Nodes:   ${state.resistantNodes}`,
                        `---`,
                        `Reflections:       ${state.reflectionActive}`,
                        `Pressure Zones:    ${state.pressureZonesActive}`,
                        `---`,
                        `Standing Traps:    ${state.traps}`,
                        `Trap State:        ${state.primaryTrapState}`,
                        `Trap Radius:       ${state.primaryTrapRadius.toFixed(2)}`,
                        `Avg Amplitude:     ${state.activeTrapAverageAmplitude.toFixed(2)}`,
                        `Peak Amplitude:    ${state.activeTrapAmplitude.toFixed(2)}`,
                        `Antinodes:         ${state.antinodeMeshes}`,
                        `---`,
                        `Ruptures:          ${state.ruptureCount}`,
                        `Active Cascades:   ${state.activeCascades}`,
                        `Pre-Rupture Zones: ${state.preRuptureZones}`,
                        `---`,
                        `Recovering Zones:  ${state.recoveringZones}`,
                        `Wave Pool:         ${state.wavePoolActive}`,
                        `Halo Pool:         ${state.haloPoolActive}`,
                        `Active Particles:  ${state.activeParticles}`
                    ].join('\n');
                    overlay.title = `Wave System Status - Links: ${state.activeLinks}, Resistant: ${state.resistantNodes}, Reflections: ${state.reflectionActive}, Pressure Zones: ${state.pressureZonesActive}, Traps: ${state.traps}, State: ${state.primaryTrapState}, Radius: ${state.primaryTrapRadius.toFixed(2)}, Avg Amp: ${state.activeTrapAverageAmplitude.toFixed(2)}, Peak Amp: ${state.activeTrapAmplitude.toFixed(2)}, Antinodes: ${state.antinodeMeshes}, Ruptures: ${state.ruptureCount}, Cascades: ${state.activeCascades}, Pre-Zones: ${state.preRuptureZones}, Recovery Zones: ${state.recoveringZones}, Wave Pool: ${state.wavePoolActive}, Halo Pool: ${state.haloPoolActive}, Particles: ${state.activeParticles}`;
                }

                syncWaveDebugOverlayVisibility();

                return state;
            };

            updateWaveDebugOverlay();

            window.waveDebugStatus = () => updateWaveDebugOverlay();
            window.waveDebugState = () => readWaveDebugState();

            if (!window._atomaWaveDebugOverlayProbe) {
                window._atomaWaveDebugOverlayProbe = setInterval(updateWaveDebugOverlay, 250);
            }

            if (!window._atomaWaveDebugOverlayVisibilityListener) {
                window.addEventListener(UI_VISIBILITY_CHANGE_EVENT, syncWaveDebugOverlayVisibility);
                window._atomaWaveDebugOverlayVisibilityListener = true;
            }

            if (!window._atomaPipelineProbe) {
                window._atomaPipelineProbe = setInterval(() => {
                    const dbg = window.atomaDebug || {};
                    const reflectionActive =
                        dbg.reflection?.reflectionPulsePool?.filter?.((p) => p?.active)?.length || 0;
                    const traps = dbg.trap?.oscillationTraps?.length || 0;
                    const ruptures = dbg.rupture?.ruptures?.length || 0;

                    console.log(
                        '[ATOMA PIPELINE]',
                        'reflection:', reflectionActive,
                        'traps:', traps,
                        'ruptures:', ruptures
                    );
                }, 2000);
            }
        }

        // ========================================================================
        // ATOMA UI 3.4 - CORE SELECTION (Initialize FIRST - single source of truth)
        // ========================================================================
        // ========================================================================
        // ATOMA INPUT CLEANUP 3.8 — MOVE UI 3.7 SETUP TO BOTTOM
        // ========================================================================

        // UI CORE
        // --- UI CORE ---
        this.setupSelectionCore();
        this.setupSelectedNodeHUD();

        // --- UI Visual Components ---
        this.setupNodeInspectPanel();
        this.setupSelectedNodeBadge();
        this.setupSelectedNodeLabel();

        // --- Primary Node System (creates final NodeLinking2_3 instance) ---
        this.setupPrimaryNodeSystem();

        // --- Final unified wiring (connects UI + linking) ---
        this.setupUIWiring3_7();

        // --- Setup global double-click fallback ---
        this.setupDoubleClickFallback();

        // REMOVED: setupSynergyPulseVisuals() — moved to LEGACY/april (2026-04-22)
        this.setupVisualNetworkTimeElasticity();
        this.setupHarmonicResonanceCoupling();
        this.setupHarmonicHubAuraSystem();
        // REMOVED: setupHarmonicInfluencePropagation() — moved to LEGACY (2026-05-14)
        this.setupHarmonicCascadeAmplification();
        this.setupLinkResonanceFlowSystem();
        this.setupHarmonicPhaseSynchronization();
        // REMOVED: setupPreCascadeVisualHint() — moved to LEGACY/april (2026-04-22)
        // REMOVED: setupHarmonicNodeResonanceHalos() — moved to LEGACY (2026-05-14)
        this.setupVisualEchoTrails();

        // ========================================================================
        // ATOMA UI 3.1 - CATEGORY LEGEND & EMOTIONAL FEED (Session 28 Restoration)
        // ========================================================================
        // Initialize Category Legend 3.1 (passive reference panel showing all 14 categories)
        this.setupCategoryLegend();
        // Initialize Emotional Feed 3.1 (passive poetic network status reflections)
        this.setupEmotionalFeed();

        // ========================================================================
        // EXPOSE ATOMA ENGINE & SUBSYSTEMS GLOBALLY (Safe Debug Mode)
        // ========================================================================
        // Expose AtomaGame instance and subsystems globally (debug-safe)
        window.game = this;
        if (window.__ATOMA_POSTPROCESSING_PENDING__ !== undefined) {
            void this.setPostProcessingEnabled(!!window.__ATOMA_POSTPROCESSING_PENDING__, { showLoading: false });
            delete window.__ATOMA_POSTPROCESSING_PENDING__;
        }
        if (window.__ATOMA_LUMINOSITY_BLOOM_PENDING__ !== undefined) {
            void this.setLuminosityBloomEnabled(!!window.__ATOMA_LUMINOSITY_BLOOM_PENDING__, { showLoading: false });
            delete window.__ATOMA_LUMINOSITY_BLOOM_PENDING__;
        }
        if (window.__ATOMA_NODE_ROTATIONS_PENDING__ !== undefined) {
            this.setNodeRotationsEnabled(!!window.__ATOMA_NODE_ROTATIONS_PENDING__);
            delete window.__ATOMA_NODE_ROTATIONS_PENDING__;
        }
        if (window.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__ !== undefined) {
            this.setSemanticPictogramsEnabled(!!window.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__);
            delete window.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__;
        }
        if (window.__ATOMA_ENVIRONMENTAL_HAZARDS_PENDING__ !== undefined) {
            this.setEnvironmentalHazardsEnabled(!!window.__ATOMA_ENVIRONMENTAL_HAZARDS_PENDING__);
            delete window.__ATOMA_ENVIRONMENTAL_HAZARDS_PENDING__;
        }
        if (window.__ATOMA_CINEMATIC_NODE_SHADERS_PENDING__ !== undefined) {
            this.setCinematicNodeShadersEnabled(!!window.__ATOMA_CINEMATIC_NODE_SHADERS_PENDING__);
            delete window.__ATOMA_CINEMATIC_NODE_SHADERS_PENDING__;
        }
        if (window.__ATOMA_VISUAL_QUALITY_PENDING__ !== undefined) {
            this.setVisualQuality(window.__ATOMA_VISUAL_QUALITY_PENDING__);
            delete window.__ATOMA_VISUAL_QUALITY_PENDING__;
        }
        removeLegacyRuntimeHudElements();
        window.linkQualityFeedbackLoop = this.linkQualityFeedbackLoop;
        window.linkMLRecommendationEngine = this.linkMLRecommendationEngine;
        window.userAcceptanceTracker = this.userAcceptanceTracker;
        
        // ========================================================================
        // [SESSION 56 FORENSIC] VISUAL AUDIT TOOL - Snapshot & Diff System
        // Forensic analysis of node visual mutations during linking
        // ========================================================================
        VisualAudit.setScene(this.scene);
        window.VisualAudit = VisualAudit;
        console.log('[main.js] ✓ VisualAudit tool initialized (window.VisualAudit.testLink(nodeA, nodeB))');

        // ========================================================================
        // PHASE B.3.A: Disable implicit RenderTransmissionPass (one-time sanitize)
        // ========================================================================
        if (CONFIG?.rendering?.DISABLE_TRANSMISSION_PASS) {
            const offenders = sanitizeTransmission(this.scene, { log: true });
            if (typeof window !== 'undefined') {
                window.__ATOMA_TRANSMISSION_OFFENDERS__ = offenders;
                window.findTransmissionMaterials = () => findTransmissionMaterials(this.scene);
            }
        }

        this.setupDebugCommands();
        
        // ========================================================================
        // HUD COLLAPSE SYSTEM 1.0 - Initialize after all HUDs are created
        // ========================================================================
        // Deferred initialization: Set up collapsible HUDs after all game systems are ready
        setTimeout(() => {
            try {
                initializeHudCollapseSystem();
                
                // Verify system is working (optional)
                if (this.debugMode) {
                    verifyHudCollapseSystem();
                }
            } catch (err) {
                console.warn('⚠ HUD Collapse System initialization error:', err);
            }
        }, 100);
        
        // ========================================================================
        // DEFENSIVE HARDENING PATCH v1.0 - Apply after all systems initialized
        // ========================================================================
        // Apply protective guards against "is not iterable" errors and visual layering
        // This ensures stable runtime without changing gameplay or visual identity
         try {
            applyAllDefensivePatches(this);
        } catch (err) {
            console.warn('⚠ Defensive hardening patch initialization error:', err);
        }
        
        // ========================================================================
        // SESSION 99: NODE VISUAL FREEZE BLOCKERS - REMOVED (2026-03-27)
        // ========================================================================
        // Freeze/Unfreeze systems moved to LEGACY/LOCK and POLICIES to delete
        // Node visuals are now managed through standard authority systems
        
        // ========================================================================
        // SESSION 104: HARD INTERACTION AUTHORITY SYSTEM
        // Critical stabilization - enforce interaction core authority
        // ========================================================================
        try {
            this.hardInteractionAuthority = initializeHardInteractionAuthority(this);
            console.log('🔒 [main.js] Hard Interaction Authority System initialized ✓');
            
            // REMOVED: setupHardAuthorityDebugAPI - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)
        } catch (err) {
            console.warn('⚠ Hard Interaction Authority System initialization error:', err);
        }
        
        // REMOVED (2026-03-01): ShaderFreezeGuard initialization disabled for new visual modules
        // if (typeof window !== 'undefined' && (window.DEBUG_VISUAL_MODE === true || window.__ATOMA_SHADER_FREEZE === true)) {
        //     installShaderFreezeGuard(this.renderer);
        // }

        this._startupWorldRefreshPending = true;
        this.configureSystemRegistry();
        this.animate();

    }

    get activeLinkCount() {
        if (this._activeLinkCountFrame !== this.frameCount) {
            this._activeLinkCountFrame = this.frameCount;
            this._activeLinkCountCache = this.aiNodes?._getActiveLinkCount?.()
                ?? (Array.isArray(this.linkingSystem?.links)
                    ? this.linkingSystem.links.reduce((n, link) => n + (link && link.active !== false ? 1 : 0), 0)
                    : 0);
        }
        return this._activeLinkCountCache;
    }

    /**
     * Initialize Three.js scene, camera, renderer
     */
    init() {
        // ========================================================================
        // LEFT HUD COLUMN v2.5 ULTRA CLEAN PATCH - LEGACY CLEANUP
        // ========================================================================
        // Remove all legacy category HUDs, secondary HUDs, and traffic HUDs from DOM
        // This ensures zero visual overlap and production-ready left column layout
        // P0 HUD SAFE CLEANUP
// ===============================
// P0 HUD HARD KILL (auto-recreated DOM guards)
// ===============================
const HUD_KILL_IDS = [
  'ai-emotional-feed',
  'ui-selected-hud-stats',
 
];

const PROTECTED_HUD_IDS = [
  'core-metrics-hud',
  'core-metrics-overlay',
  'node-inspect-overlay'
];

const killHUD = () => {
  HUD_KILL_IDS.forEach(id => {
    // Preserve realtime HUDs (Core Metrics + Node Inspector)
    if (PROTECTED_HUD_IDS.includes(id)) return;
    document.getElementById(id)?.remove();
  });
};

// initial sweep
killHUD();

// kill on re-injection
const hudObserver = new MutationObserver(killHUD);
hudObserver.observe(document.body, {
  childList: true,
  subtree: true
});
if (!window.__ATOMA_DISABLE_HUD_GUARDS__) {

// ===============================
// P0.5 HUD PERFORMANCE KILLS
// ===============================
const HUD_P05_KILL_SELECTORS = [
  //tento konrketne je na box selection
  '#tier4-gameplay-feedback-hud',


  '#node-inspect-linguistic-overlay',
  '#ui-primary-node-top-bar-3-7',


];

const killHUD_P05 = () => {
  HUD_P05_KILL_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      // Skip realtime HUDs that must persist
      if (el.id && PROTECTED_HUD_IDS.includes(el.id)) return;
      el.remove();
    });
  });
};

killHUD_P05();

const hudP05Observer = new MutationObserver(killHUD_P05);
hudP05Observer.observe(document.body, {
  childList: true,
  subtree: true
});

  // kill-switch block
}
        // Remove legacy category legend versions (v1, v2)
        const legacyCategorySelectors = [
            '.ui-category-legend',
            '.category-panel',
            '.ui-legend',
            '.legend-container',
            '#legacy-category-hud',
            '#category-legend-v1',
            '#category-legend-v2'
        ];
        legacyCategorySelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        // Remove secondary HUD (if it exists)
        document.querySelectorAll('.secondary-hud, #secondary-hud').forEach(el => el.remove());
        
        // Remove traffic HUD (fully verified as non-existent, but clean anyway)
        document.querySelectorAll('#traffic-hud, .traffic-hud, .link-traffic, #link-traffic-hud').forEach(el => el.remove());
        
        // Remove legacy NODE CATEGORIES overlay (session 30 cleanup)
        const legacyNodeCategoriesSelectors = [
            '#node-categories',
            '.node-categories-overlay',
            '.legacy-node-categories',
            '[class*="NodeCategoriesOverlay"]'
        ];
        legacyNodeCategoriesSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Don't remove if it's part of the new UI category legend
                if (!el.closest('#ui-category-legend')) {
                    el.remove();
                }
            });
        });
        
        console.log('✓ [v3.0] Legacy HUD DOM elements cleaned from page');
        
        // Scene
        this.scene = new THREE.Scene();
        this.vfxRoot = new THREE.Group();
        this.vfxRoot.name = 'VFX_ROOT';
        this.scene.add(this.vfxRoot);
        
        // FX Debug Sandbox - Initialize with scene and renderer
        if (typeof window !== 'undefined' && window.FX) {
          window.FX.init(this.scene, this.renderer);
          console.log('[FXDebugSandbox] Initialized. Use FX.harmony(), FX.cascade(), FX.wave(), FX.trail(), FX.spark(), FX.halo()');
        }
        
        // TEMP DISABLED: VisualSpherePolicy blocking spawn pipeline (Object3D.add)
        // ensureSpherePolicyInstalled({ sweepIntervalMs: 100 });
        // this.spherePolicy = installSpherePolicy(this.scene, { sweepIntervalMs: 100 });
        // this.spherePolicy?.registerRoot?.(this.scene, 'main-scene');
        
        // TEMP DISABLED: SphereCreatorTrace blocking spawn pipeline
        // Install sphere creator trace for diagnostics
        // installSphereCreatorTrace({ enabled: true, verbose: false });

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.5,
            1000
        );
        this.camera.position.set(0, 2, 5);
window.__ATOMA_CAMERA__ = this.camera;
        this.distanceLOD = new DistanceLODController(this.camera);
window.ATOMA_DISTANCE_LOD = this.distanceLOD;
window.__ATOMA_SCENE__ = this.scene;
        const visualDebugState = window.__ATOMA_VISUAL_DEBUG__ || {};
        visualDebugState.mode = visualDebugState.mode || 'all';
        visualDebugState.setMode = (mode) => {
            const next = typeof mode === 'string' && mode.trim() ? mode.trim().toLowerCase() : 'all';
            visualDebugState.mode = next;
            window.__ATOMA_VISUAL_DEBUG_MODE__ = next;
            console.log(`[ATOMA VISUAL DEBUG] mode=${next}`);
            return next;
        };
        visualDebugState.getMode = () => visualDebugState.mode || window.__ATOMA_VISUAL_DEBUG_MODE__ || 'all';
        window.__ATOMA_VISUAL_DEBUG__ = visualDebugState;
        window.__ATOMA_VISUAL_DEBUG_MODE__ = visualDebugState.getMode();
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        if (this.renderer?.debug) {
            this.renderer.debug.checkShaderErrors = !!(
                window.DEBUG_VISUAL_MODE === true ||
                window.__ATOMA_SHADER_FREEZE === true ||
                window.ATOMA_FLAGS?.debug?.shader === true
            );
        }
        document.body.appendChild(this.renderer.domElement);
        this.gpuSanity = setupGpuSanity(this.renderer, { materialRegistry: this.materialRegistry });

        if (typeof window !== 'undefined' && (window.DEBUG_VISUAL_MODE === true || window.__ATOMA_SHADER_FREEZE === true) && window.__ATOMA_WARMUP_COMPLETE !== true) {
            warmupAllVisualVariants(this.renderer, this.scene, this.camera);
        }

        // Scene census (every 3 seconds) to identify draw-call owners
        this._sceneAuditTimer = setInterval(() => {
            if (typeof this.auditSceneObjects === 'function') {
                this.auditSceneObjects(this.scene);
            }
        }, 3000);

        // [B.3-C4] Post-processing toggle stabilization (build once)
        if (!this.postProcessing) {
            this.postProcessing = getSharedPostProcessingPipeline(this.renderer, this.scene, this.camera);
            this.postProcessing?.onWindowResize?.(this.renderer.domElement.width, this.renderer.domElement.height);
            this.postProcessingEnabled = false;
        }
        if (!this.luminosityBloom) {
            this.luminosityBloom = getSharedLuminosityBloomPipeline(this.renderer, this.scene, this.camera);
            this.luminosityBloom?.onWindowResize?.(this.renderer.domElement.width, this.renderer.domElement.height);
            this.luminosityBloomEnabled = false;
        }
        this.loadingOverlay = getSharedAtomaLoadingOverlay();
        this._visualTransitionChain = Promise.resolve();
        this._visualTransitionPromises = new Set();
        this._trackVisualTransition = (promise) => {
            if (!promise || typeof promise.then !== 'function') {
                return promise;
            }
            this._visualTransitionPromises.add(promise);
            const cleanup = () => this._visualTransitionPromises.delete(promise);
            promise.then(cleanup, cleanup);
            return promise;
        };
        this.waitForVisualTransitions = async () => {
            const pending = Array.from(this._visualTransitionPromises);
            if (pending.length === 0) {
                return [];
            }
            return Promise.allSettled(pending);
        };
        this._runVisualTransition = (task, overlayConfig = null) => {
            const runTask = async () => {
                if (overlayConfig) {
                    return this.loadingOverlay.run(task, overlayConfig);
                }
                return task({
                    token: null,
                    setPhase: () => {},
                    yieldFrame: async () => {},
                });
            };

            const transitionPromise = this._visualTransitionChain
                .catch(() => {})
                .then(runTask);
            this._visualTransitionChain = transitionPromise.catch(() => {});
            return this._trackVisualTransition(transitionPromise);
        };
        this.cinematicNodeShadersEnabled = true;
        this.performanceDisciplineBaseSettings = null;
        this.performanceDisciplineCurrentTier = 'FULL';
        this.performanceDisciplineState = null;
        this._recordPerformanceDisciplinePreference = (patch = {}) => {
            const base = this.performanceDisciplineBaseSettings || (this.performanceDisciplineBaseSettings = {});
            Object.assign(base, patch);
            return base;
        };
        this.capturePerformanceDisciplineBaseline = (force = false) => {
            if (this.performanceDisciplineBaseSettings && !force) {
                return { ...this.performanceDisciplineBaseSettings };
            }

            this.performanceDisciplineBaseSettings = {
                visuals: this.visualQualityLevel || 'HIGH',
                postProcessing: this.postProcessingEnabled !== false,
                luminosityBloom: this.luminosityBloomEnabled === true,
                cinematicNodeShaders: this.cinematicNodeShadersEnabled !== false,
                nodeRotations: this.nodeRotationsEnabled !== false,
                semanticPictograms: this.semanticPictogramsEnabled !== false,
                environmentalHazards: this.environmentalHazardsEnabled !== false
            };
            return { ...this.performanceDisciplineBaseSettings };
        };
        this.buildPerformanceBudgetSnapshot = () => {
            const renderInfo = this.renderer?.info?.render || {};
            const memoryInfo = this.renderer?.info?.memory || {};
            const programs = Array.isArray(this.renderer?.info?.programs)
                ? this.renderer.info.programs.length
                : (this.renderer?.info?.programs ?? 0);
            const renderAverages = this.renderProfile?.getAverages?.() || {};
            const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];
            const nodes = Array.isArray(this.aiNodes?.nodes) ? this.aiNodes.nodes : [];
            const waveCounts = this.particleEmitter?.activeCount;
            const waveActiveCount = typeof waveCounts === 'number'
                ? waveCounts
                : Object.values(waveCounts || {}).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
            const activeEchoes = Array.isArray(this.resonanceEchoTrailSystem?.echoInstances)
                ? this.resonanceEchoTrailSystem.echoInstances.reduce((sum, echo) => sum + (echo?.active ? 1 : 0), 0)
                : 0;
            const activeVfx = (
                (this.cascadeVisualizer?.stats?.particlesActive ?? 0) +
                (this.cascadeParticleSystem?.activeCount ?? 0) +
                waveActiveCount +
                activeEchoes
            );

            return {
                drawCalls: renderInfo.calls ?? 0,
                triangles: renderInfo.triangles ?? 0,
                geometries: memoryInfo.geometries ?? 0,
                textures: memoryInfo.textures ?? 0,
                programs: Number.isFinite(programs) ? programs : 0,
                nodes: nodes.length,
                links: links.length,
                activeVfx,
                baseSceneMs: renderAverages.baseSceneRender?.avg ?? 0,
                postFXMs: renderAverages.postProcessing?.avg ?? 0,
                finalRenderMs: renderAverages.finalRender?.avg ?? 0,
                visualQualityLevel: this.visualQualityLevel || 'HIGH',
                adaptiveTier: this.performanceDisciplineCurrentTier || 'FULL',
                context: {
                    postProcessingEnabled: this.postProcessingEnabled !== false,
                    luminosityBloomEnabled: this.luminosityBloomEnabled === true,
                    semanticPictogramsEnabled: this.semanticPictogramsEnabled !== false,
                    environmentalHazardsEnabled: this.environmentalHazardsEnabled !== false
                }
            };
        };
        this.applyAdaptivePerformanceTier = (tier = 'FULL', snapshot = null, meta = null) => {
            const normalized = typeof tier === 'string' ? tier.toUpperCase() : 'FULL';
            const nextTier = ['BALANCED', 'PERFORMANCE', 'SAFE'].includes(normalized) ? normalized : 'FULL';
            const previousTier = this.performanceDisciplineCurrentTier || 'FULL';
            this.performanceDisciplineCurrentTier = nextTier;
            this.performanceDisciplineState = {
                tier: nextTier,
                previousTier,
                snapshot: snapshot || null,
                meta: meta || null,
                appliedAt: performance.now?.() ?? Date.now()
            };
            if (this.adaptivePerformanceMonitor) {
                this.adaptivePerformanceMonitor.currentTier = nextTier;
                this.adaptivePerformanceMonitor.pendingTier = nextTier;
                this.adaptivePerformanceMonitor.recommendedTier = nextTier;
            }

            const baseline = this.capturePerformanceDisciplineBaseline();
            const preferredQuality = typeof baseline.visuals === 'string' ? baseline.visuals.toUpperCase() : 'HIGH';
            const clampQuality = (maxTier = 'HIGH') => {
                const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 };
                const cappedMax = rank[maxTier] ?? 2;
                const preferredRank = rank[preferredQuality] ?? 2;
                return preferredRank <= cappedMax
                    ? preferredQuality
                    : Object.keys(rank).find((key) => rank[key] === cappedMax) || maxTier;
            };

            let nextLowFX = false;
            let customMultipliers = null;
            const desired = {
                visuals: preferredQuality,
                postProcessing: baseline.postProcessing !== false,
                luminosityBloom: baseline.luminosityBloom === true,
                cinematicNodeShaders: baseline.cinematicNodeShaders !== false,
                nodeRotations: baseline.nodeRotations !== false,
                semanticPictograms: baseline.semanticPictograms !== false,
                environmentalHazards: baseline.environmentalHazards !== false
            };

            if (nextTier === 'BALANCED') {
                desired.visuals = clampQuality('MEDIUM');
                desired.luminosityBloom = false;
                desired.cinematicNodeShaders = false;
                customMultipliers = {
                    clarity: 0.94,
                    resonance: 0.94,
                    entropy: 0.9,
                    focus: 0.92,
                    corruption: 0.94,
                    vfxIntensity: 0.88,
                    shaderIntensity: 0.9
                };
            } else if (nextTier === 'PERFORMANCE') {
                desired.visuals = 'LOW';
                desired.luminosityBloom = false;
                desired.cinematicNodeShaders = false;
                desired.semanticPictograms = false;
                desired.environmentalHazards = false;
                nextLowFX = true;
                customMultipliers = {
                    clarity: 0.74,
                    resonance: 0.72,
                    entropy: 0.5,
                    focus: 0.62,
                    corruption: 0.7,
                    vfxIntensity: 0.68,
                    shaderIntensity: 0.66
                };
            } else if (nextTier === 'SAFE') {
                desired.visuals = 'LOW';
                desired.postProcessing = false;
                desired.luminosityBloom = false;
                desired.cinematicNodeShaders = false;
                desired.nodeRotations = false;
                desired.semanticPictograms = false;
                desired.environmentalHazards = false;
                nextLowFX = true;
                customMultipliers = {
                    clarity: 0.58,
                    resonance: 0.56,
                    entropy: 0.34,
                    focus: 0.46,
                    corruption: 0.58,
                    vfxIntensity: 0.5,
                    shaderIntensity: 0.48
                };
            } else {
                customMultipliers = {
                    clarity: 1.0,
                    resonance: 1.0,
                    entropy: 1.0,
                    focus: 1.0,
                    corruption: 1.0,
                    vfxIntensity: 1.0,
                    shaderIntensity: 1.0
                };
            }

            this.distanceLOD?.setPerformanceTier?.(nextTier);

            const currentLowFX = this.fxPerformance?.isLowFX?.() ?? false;
            if (currentLowFX !== nextLowFX) {
                this.fxPerformance?.setLowFX?.(nextLowFX);
                this.fxPerformanceTransition?.startTransition?.(nextLowFX);
            }
            if (this.adaptivePerformanceMonitor) {
                this.adaptivePerformanceMonitor.lastAppliedLowFX = nextLowFX;
            }
            if (customMultipliers) {
                this.fxPerformance?.setCustomMultipliers?.(customMultipliers);
            }

            if (this.visualQualityLevel !== desired.visuals) {
                this.setVisualQuality(desired.visuals, { performanceOverride: true });
            }
            if (this.cinematicNodeShadersEnabled !== desired.cinematicNodeShaders) {
                this.setCinematicNodeShadersEnabled(desired.cinematicNodeShaders, { performanceOverride: true });
            }
            if (this.semanticPictogramsEnabled !== desired.semanticPictograms) {
                this.setSemanticPictogramsEnabled(desired.semanticPictograms, { performanceOverride: true });
            }
            if (this.environmentalHazardsEnabled !== desired.environmentalHazards) {
                this.setEnvironmentalHazardsEnabled(desired.environmentalHazards, { performanceOverride: true });
            }
            if (this.nodeRotationsEnabled !== desired.nodeRotations) {
                this.setNodeRotationsEnabled(desired.nodeRotations, { performanceOverride: true });
            }

            if (this.luminosityBloomEnabled !== desired.luminosityBloom) {
                void this.setLuminosityBloomEnabled(desired.luminosityBloom, {
                    showLoading: false,
                    performanceOverride: true
                });
            }
            if (this.postProcessingEnabled !== desired.postProcessing) {
                void this.setPostProcessingEnabled(desired.postProcessing, {
                    showLoading: false,
                    performanceOverride: true
                });
            }

            return this.performanceDisciplineState;
        };
        this.setPostProcessingEnabled = (enabled = true, options = {}) => {
            const next = !!enabled;
            if (!options.performanceOverride) {
                this._recordPerformanceDisciplinePreference({ postProcessing: next });
            }
            if (this.postProcessingEnabled === next) {
                return Promise.resolve(this.postProcessingEnabled);
            }

            this.postProcessingEnabled = next;
            if (!next) {
                this.postProcessing?.setBloomTexture?.(null);
                return Promise.resolve(this.postProcessingEnabled);
            }

            const showLoading = options.showLoading !== false;
            return this._runVisualTransition(
                async ({ setPhase, yieldFrame }) => {
                    setPhase({
                        title: 'POST-PROCESSING ONLINE',
                        subtitle: 'Waking the cinematic composite lattice.',
                        phase: 'WARMING POST-PROCESSING',
                        variant: 'post-processing',
                    });
                    await yieldFrame();
                    await this.postProcessing?.warmup?.(this.renderer);

                    if (this.luminosityBloomEnabled) {
                        setPhase({
                            title: 'POST-PROCESSING ONLINE',
                            subtitle: 'Stitching auxiliary bloom into the composite.',
                            phase: 'COMPILING VISUAL PASSES',
                            variant: 'post-processing',
                        });
                        await yieldFrame();
                        await this.luminosityBloom?.warmup?.(this.renderer);
                    }

                    setPhase({
                        title: 'POST-PROCESSING ONLINE',
                        subtitle: 'Returning control to the live field.',
                        phase: 'RETURNING TO SIMULATION',
                        variant: 'post-processing',
                    });
                    await yieldFrame();
                    return this.postProcessingEnabled;
                },
                showLoading ? {
                    title: 'POST-PROCESSING ONLINE',
                    subtitle: 'Waking the cinematic composite lattice.',
                    phase: 'WARMING POST-PROCESSING',
                    variant: 'post-processing',
                } : null,
            );
        };

        this.setLuminosityBloomEnabled = (enabled = true, options = {}) => {
            const next = !!enabled;
            if (!options.performanceOverride) {
                this._recordPerformanceDisciplinePreference({ luminosityBloom: next });
            }
            if (this.luminosityBloomEnabled === next) {
                return Promise.resolve(this.luminosityBloomEnabled);
            }

            this.luminosityBloomEnabled = next;
            if (!next) {
                this.postProcessing?.setBloomTexture?.(null);
                return Promise.resolve(this.luminosityBloomEnabled);
            }

            if (!this.postProcessingEnabled) {
                return Promise.resolve(this.luminosityBloomEnabled);
            }

            const showLoading = options.showLoading !== false;
            return this._runVisualTransition(
                async ({ setPhase, yieldFrame }) => {
                    setPhase({
                        title: 'LUMINOSITY BLOOM ONLINE',
                        subtitle: 'Charging the selective bloom field.',
                        phase: 'WARMING LUMINOSITY BLOOM',
                        variant: 'luminosity-bloom',
                    });
                    await yieldFrame();
                    await this.luminosityBloom?.warmup?.(this.renderer);
                    setPhase({
                        title: 'LUMINOSITY BLOOM ONLINE',
                        subtitle: 'Binding bloom energy back into the live composite.',
                        phase: 'BINDING BLOOM CHAIN',
                        variant: 'luminosity-bloom',
                    });
                    await yieldFrame();
                    setPhase({
                        title: 'LUMINOSITY BLOOM ONLINE',
                        subtitle: 'Returning control to the live field.',
                        phase: 'RETURNING TO SIMULATION',
                        variant: 'luminosity-bloom',
                    });
                    await yieldFrame();
                    return this.luminosityBloomEnabled;
                },
                showLoading ? {
                    title: 'LUMINOSITY BLOOM ONLINE',
                    subtitle: 'Charging the selective bloom field.',
                    phase: 'WARMING LUMINOSITY BLOOM',
                    variant: 'luminosity-bloom',
                } : null,
            );
        };

        this._syncCinematicNodeShaders = () => {
            const cinematicVisible = this.cinematicUpgrade?.isVisible?.() !== false;
            const next = cinematicVisible && this.cinematicNodeShadersEnabled !== false;
            if (this.cinematicUpgrade?.setNodeShadersEnabled) {
                this.cinematicUpgrade.setNodeShadersEnabled(next);
            } else if (typeof window !== 'undefined') {
                window.ATOMA_VFX_ENABLE_HOLOGRAM_SHELL = next;
                window.ATOMA_VFX_ENABLE_NODE_EDGE_GLOW = next;
            }
            return next;
        };

        this.setCinematicNodeShadersEnabled = (enabled = true, options = {}) => {
            const next = !!enabled;
            if (!options.performanceOverride) {
                this._recordPerformanceDisciplinePreference({ cinematicNodeShaders: next });
            }
            this.cinematicNodeShadersEnabled = next;
            this._syncCinematicNodeShaders();
            return this.cinematicNodeShadersEnabled;
        };

        this.setNodeRotationsEnabled = (enabled = true, options = {}) => {
            const next = !!enabled;
            if (!options.performanceOverride) {
                this._recordPerformanceDisciplinePreference({ nodeRotations: next });
            }
            EnhancedNodeModels.nodeRotationsEnabled = next;
            this.nodeRotationsEnabled = next;
            return this.nodeRotationsEnabled;
        };

        this.setSemanticPictogramsEnabled = (enabled = true, options = {}) => {
            const next = !!enabled;
            if (!options.performanceOverride) {
                this._recordPerformanceDisciplinePreference({ semanticPictograms: next });
            }
            const pictogramSystem = this.linkPictogramSystem || this.linkSemanticPictograms || null;
            if (pictogramSystem) {
                if (next) {
                    pictogramSystem.enable?.();
                    pictogramSystem.fusionZoneManager?.enable?.();
                } else {
                    pictogramSystem.disable?.();
                    pictogramSystem.fusionZoneManager?.disable?.();
                }
            }
            this.semanticPictogramsEnabled = next;
            return this.semanticPictogramsEnabled;
        };

        this.setEnvironmentalHazardsEnabled = (enabled = true, options = {}) => {
            const next = !!enabled;
            if (!options.performanceOverride) {
                this._recordPerformanceDisciplinePreference({ environmentalHazards: next });
            }
            const hazardSystem = this.environmentDomain?.instances?.environmentalHazards || this.hazards || null;
            if (hazardSystem?.setEnabled) {
                hazardSystem.setEnabled(next);
            } else if (hazardSystem) {
                hazardSystem.enabled = next;
                if (hazardSystem.root) {
                    hazardSystem.root.visible = next;
                }
            }
            this.environmentalHazardsEnabled = next;
            return this.environmentalHazardsEnabled;
        };

        // Visual quality: LOW / MEDIUM / HIGH
        // LOW    → VisualUpgradeSuperpack OFF, CinematicUpgrade OFF
        // MEDIUM → VisualUpgradeSuperpack ON,  CinematicUpgrade OFF
        // HIGH   → VisualUpgradeSuperpack ON,  CinematicUpgrade ON
        this.setVisualQuality = (level, options = {}) => {
            const normalized = typeof level === 'string' ? level.toUpperCase() : 'HIGH';
            if (!options.performanceOverride) {
                this._recordPerformanceDisciplinePreference({ visuals: normalized });
            }
            this.visualQualityLevel = normalized;

            const superpackOn = normalized === 'MEDIUM' || normalized === 'HIGH';
            const cinematicOn = normalized === 'HIGH';

            if (this.visualSuperpack?.setQualityTier) {
                this.visualSuperpack.setQualityTier(normalized);
            }
            if (this.cinematicUpgrade?.setQualityTier) {
                this.cinematicUpgrade.setQualityTier(normalized);
            }

            if (this.visualSuperpack) {
                this.visualSuperpack.setVisible(superpackOn);
            }
            if (this.cinematicUpgrade) {
                this.cinematicUpgrade.setVisible(cinematicOn);
            }
            this._syncCinematicNodeShaders();

            // Restore / reset renderer tone mapping based on superpack state
            if (this.renderer) {
                if (superpackOn && this.visualSuperpack) {
                    const s = this.visualSuperpack.getRendererSettings();
                    this.renderer.toneMapping = s.toneMapping;
                    this.renderer.toneMappingExposure = s.toneMappingExposure;
                    this.renderer.outputColorSpace = s.outputColorSpace;
                } else {
                    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
                    this.renderer.toneMappingExposure = 1.2;
                }
            }

            return this.visualQualityLevel;
        };

        if (this.postProcessingEnabled) {
            void this.postProcessing?.warmup?.(this.renderer);
            if (this.luminosityBloomEnabled) {
                void this.luminosityBloom?.warmup?.(this.renderer);
            }
        }

        const bootMenuSettings = this.bootOptions?.menuSettings || null;
        if (bootMenuSettings) {
            if (bootMenuSettings.postProcessing !== undefined) {
                void this.setPostProcessingEnabled(bootMenuSettings.postProcessing !== false, { showLoading: false });
            }
            if (bootMenuSettings.luminosityBloom !== undefined) {
                void this.setLuminosityBloomEnabled(bootMenuSettings.luminosityBloom === true, { showLoading: false });
            }
            if (bootMenuSettings.nodeRotations !== undefined) {
                this.setNodeRotationsEnabled(bootMenuSettings.nodeRotations !== false);
            }
            if (bootMenuSettings.semanticPictograms !== undefined) {
                this.setSemanticPictogramsEnabled(bootMenuSettings.semanticPictograms !== false);
            }
            if (bootMenuSettings.environmentalHazards !== undefined) {
                this.setEnvironmentalHazardsEnabled(bootMenuSettings.environmentalHazards !== false);
            }
            if (bootMenuSettings.cinematicNodeShaders !== undefined) {
                this.setCinematicNodeShadersEnabled(bootMenuSettings.cinematicNodeShaders !== false);
            }
            if (bootMenuSettings.visuals !== undefined) {
                this.setVisualQuality(bootMenuSettings.visuals);
            }
        }
        this.capturePerformanceDisciplineBaseline(true);

        // === Wave shader stack (init early so warm-up uses patched shaders) ===
        try {
            this.waveInterferenceEngine = new WaveInterferenceEngine_v1({
                enabled: true,
                enableDebug: false,
                enableWarnings: false,
                eventBus: this.semanticBus,
                onFieldSuppressionChange: (active) => {
                    // Burst playback suppresses ambient fields to preserve contrast.
                    if (!this.semanticBus) return;
                    if (active) {
                        this.semanticBus.setSemanticAuthority('environment', {
                            source: 'wave-burst',
                            locks: {
                                linkField: 'scale',
                                atmosphere: 'scale',
                                hud: 'scale'
                            },
                            constraints: {
                                linkField: { scale: 0.35 },
                                atmosphere: { scale: 0.55 },
                                hud: { scale: 0.75 }
                            }
                        });
                    } else if (
                        this.semanticBus.semanticAuthorityLockState?.active === 'environment' &&
                        this.semanticBus.semanticAuthorityLockState?.source === 'wave-burst'
                    ) {
                        this.semanticBus.clearSemanticAuthority('environment');
                    }
                },
                onLifecycleEvent: (entry) => {
                    this.semanticBus?.emit?.(
                        'wave.burst.lifecycle',
                        entry,
                        { priority: this.semanticBus.priority.NORMAL }
                    );
                }
            });
            window.getWaveInterferenceBurstState = () => ({
                activeSnapshot: this.waveInterferenceEngine?.getActiveSnapshot?.() || null,
                metrics: this.waveInterferenceEngine?.getMetrics?.() || null
            });
            window.debugWaveSnapshot = () => {
                const snap = this.waveInterferenceEngine?.getActiveSnapshot?.() || null;
                console.log("debugWaveSnapshot", snap);
                return snap;
            };
            window.debugWaveBurstLifecycle = (limit = 12) => {
                const metrics = this.waveInterferenceEngine?.getMetrics?.() || null;
                const lifecycle = this.waveInterferenceEngine?.getBurstLifecycleEvents?.(limit) || [];
                const payload = { metrics, lifecycle };
                console.log('debugWaveBurstLifecycle', payload);
                return payload;
            };
            window.debugWaveRuntimeFlow = (limit = 12) => {
                const activeSnapshot = this.waveInterferenceEngine?.getActiveSnapshot?.() || null;
                const engineMetrics = this.waveInterferenceEngine?.getMetrics?.() || null;
                const lifecycle = this.waveInterferenceEngine?.getBurstLifecycleEvents?.(limit) || [];
                const cascadeBridgeStatus = this.cascadeToWaveBridge
                    ? {
                        enabled: !!this.cascadeToWaveBridge.enabled,
                        attached: !!this.cascadeToWaveBridge.semanticBus,
                        hasWaveEngine: !!this.cascadeToWaveBridge.waveInterferenceEngine
                    }
                    : null;

                const wavePatternSystem = this.wavePatternSystem || this.waveInterference || null;
                const resonanceEchoTrailSystem = this.resonanceEchoTrailSystem || this.resonanceEchoTrails || null;
                const activeEchoes = Array.isArray(resonanceEchoTrailSystem?.echoInstances)
                    ? resonanceEchoTrailSystem.echoInstances.filter((echo) => echo?.active).length
                    : 0;

                const payload = {
                    ingress: {
                        cascadeBridge: cascadeBridgeStatus
                    },
                    engine: {
                        activeSnapshot,
                        metrics: engineMetrics,
                        lifecycle
                    },
                    consumers: {
                        waveShaderBridge: {
                            present: !!this.waveShaderBridge,
                            hasWaveEngine: !!this.waveShaderBridge?.waveEngine,
                            registeredNodeMaterials: this.waveShaderBridge?.registeredNodeMaterialList?.size ?? 0,
                            registeredLinkMaterials: this.waveShaderBridge?.registeredLinkMaterialList?.size ?? 0
                        },
                        waveParticleEmitter: {
                            present: !!this.particleEmitter,
                            activeCount: this.particleEmitter?.activeCount || null,
                            thresholds: this.particleEmitter?.config
                                ? {
                                    constructive: this.particleEmitter.config.constructiveThreshold,
                                    destructive: this.particleEmitter.config.destructiveThreshold,
                                    standing: this.particleEmitter.config.standingWaveThreshold
                                }
                                : null
                        },
                        waveInterferencePatterns: {
                            present: !!wavePatternSystem,
                            hasWaveEngine: !!wavePatternSystem?.waveEngine,
                            initialized: wavePatternSystem?.initialized ?? null,
                            collisionPairs: wavePatternSystem?.collisionPairs?.length ?? 0,
                            interferenceZones: wavePatternSystem?.interferenceZones?.length ?? 0,
                            beatPatterns: wavePatternSystem?.beatPatterns?.length ?? 0
                        },
                        resonanceEchoTrailSystem: {
                            present: !!resonanceEchoTrailSystem,
                            enabled: resonanceEchoTrailSystem?.enabled ?? false,
                            totalEchoes: resonanceEchoTrailSystem?.echoInstances?.length ?? 0,
                            activeEchoes
                        }
                    }
                };

                console.log('debugWaveRuntimeFlow', payload);
                return payload;
            };
            console.log('[main.js] WaveInterferenceEngine_v1 initialized (burst snapshot pipeline)');
        } catch (err) {
            console.warn('[main.js] WaveInterferenceEngine_v1 failed:', err);
        }

        this.cascadeToWaveBridge = null;
        try {
            if (this.semanticBus && this.waveInterferenceEngine) {
                this.cascadeToWaveBridge = new CascadeToWaveBridge_v1({
                    semanticBus: this.semanticBus,
                    waveInterferenceEngine: this.waveInterferenceEngine,
                    linkingSystem: this.linkingSystem
                }).init();
            }
        } catch (err) {
            console.warn('[main.js] CascadeToWaveBridge_v1 init failed:', err?.message || err);
            this.cascadeToWaveBridge = null;
        }

        const waveShaderStackDisabledByPolicy = window.ATOMA_FLAGS?.release?.disableWaveShaderStack === true;
        if (!waveShaderStackDisabledByPolicy) {
            try {
                this.waveShaderBridge = new WaveShaderBridge_v1({
                    renderer: this.renderer,
                    scene: this.scene,
                    waveEngine: this.waveInterferenceEngine,
                    maxSources: 8
                });
                markReleaseContainmentRuntime(this, 'waveShaderStack', { initialized: true, enabled: true });
                console.log('[main.js] WaveShaderBridge_v1 initialized ✓');
            } catch (err) {
                console.warn('[main.js] WaveShaderBridge_v1 failed:', err);
            }

            try {
                this.waveShaderMaterialPatch = new WaveShaderMaterialPatch_v1({
                    enableDebug: false,
                    enableWarnings: false
                });
                console.log('[main] WaveShaderMaterialPatch initialized');
            } catch (err) {
                console.warn('[main.js] WaveShaderMaterialPatch_v1 failed:', err);
            }

            try {
                this.waveTravelShaderPack = new WaveTravelShaderPack_v1({
                    enableDebug: false,
                    enableWarnings: false
                });
                console.log('[main] WaveTravelShaderPack initialized');
            } catch (err) {
                console.warn('[main.js] WaveTravelShaderPack_v1 failed:', err);
            }

            try {
                this.waveDynamicsShaderPack = createWaveDynamicsPack();
                console.log('[main.js] WaveDynamicsShaderPack_v1 initialized ✓');
            } catch (err) {
                console.warn('[main.js] WaveDynamicsShaderPack_v1 failed:', err);
            }
        } else {
            this.waveShaderBridge = null;
            this.waveShaderMaterialPatch = null;
            this.waveTravelShaderPack = null;
            this.waveDynamicsShaderPack = null;
            markReleaseContainmentRuntime(this, 'waveShaderStack', { initialized: false, scheduled: false, enabled: false });
            console.log('[main.js] Wave shader stack disabled via release containment policy');
        }

        try {
            this.synergyTravelingWaveFX = new SynergyTravelingWaveFX_v1({
                debugEnabled: false,
                waveEngine: this.waveInterferenceEngine,
                world: this
            });
            console.log('[main.js] SynergyTravelingWaveFX_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynergyTravelingWaveFX_v1 failed:', err);
        }

        // Harmony debug overlay (disabled by default, toggle via ATOMA_FLAGS.debug.harmonyOverlay)
        try {
            this.harmonyDebugOverlay = new HarmonyDebugOverlay();
            if (window?.ATOMA_FLAGS?.debug?.harmonyOverlay === true) {
                this.harmonyDebugOverlay.enable();
                console.log('[main.js] HarmonyDebugOverlay enabled ✓');
            }
        } catch (err) {
            console.warn('[main.js] HarmonyDebugOverlay init failed:', err);
            this.harmonyDebugOverlay = null;
        }

        // Initialize Node Inspect Overlay (after scene/camera/renderer ready)
        this.nodeInspectOverlay = new NodeInspectOverlay1_0(
            this.scene,
            this.camera,
            this.renderer,
            null,
            this
        );

        // Initialize Node Micro-Events 1.0 (after scene/camera ready)
        this.nodeMicroEvents = new NodeMicroEvents(
            this.scene,
            this.camera
        );
        // Mount AI HUDs
        mountAIAutomationHUD(document.body);
        mountVariantBAdvisorHUD(document.body);

        // Initial paint (live reports are refreshed on the simulation scheduler)
        this._refreshAIHudReports?.();

        // Initialize World Personality Controller 2.0 (after scene/camera/renderer ready)
        // World personality controller is centralized in EnvironmentDomainController.
        this.worldPersonalityController = this.environmentDomain?.instances?.worldPersonalityController || this.worldPersonalityController;

        // Initialize Mythic Ritual Controller 1.0 (after world controller ready)
        this.mythicRitualController = this.environmentDomain?.instances?.mythicRitualController || this.mythicRitualController;

        // LEGACY/april — MythicSeedGlyph + LegacyGlyphCleanup disconnected 2026-04-22
        // this.mythicSeedGlyph = new MythicSeedGlyph(this.scene);
        // this.mythicSeedGlyph.removeOldMarkers();
        // this.legacyGlyphCleanup = new LegacyGlyphCleanup(this.scene);
        // this.legacyGlyphCleanup.cleanupLegacyGlyphs();
        // this.legacyGlyphCleanup.printCleanupReport();

        // DISABLED: Fractal Hex Marker System (legacy debug system - replaced by Glyph Slot System 2.0)
        // this.fractalHexMarker = new FractalHexMarker(this.scene);

        // Enforce single marker stack authority: purge stale legacy glyph roots before init.
        const staleGlyphRoots = [];
        this.scene?.traverse?.((obj) => {
            if (!obj?.isGroup) return;
            if (obj.userData?.isAtomaGlyphContainer || obj.userData?.isAtomaGlyph4Container || obj.name === 'AtomaGlyphSystem' || obj.name === 'AtomaGlyphSystem4') {
                staleGlyphRoots.push(obj);
            }
        });
        staleGlyphRoots.forEach((root) => root.parent?.remove(root));

        if (this.enableGlyphSystem4) {
            this.glyphSystem4 = new AtomaGlyphSystem4_0(this.scene, this.camera);
        } else {
            this.glyphSystem4?.dispose?.();
            this.glyphSystem4 = null;
        }

        if (this.enableGlyphLayer4) {
            // Initialize ATOMA Glyph Layer 4.0 (Multi-Glyph Fusion)
            // Pass resonance feedback system for composite glyph registration
            this.glyphLayer4 = new GlyphLayer4_MultiFusion(
                this.scene,
                this.worldRoot,
                this.compositeResonanceFeedback || null
            );
            this.glyphLayer4.frameScheduler = this.frameScheduler;
            this.glyphLayer4.hoverOnlyMode = !this.enableGlyphLayer4FullVisuals;
        } else {
            this.glyphLayer4?.dispose?.();
            this.glyphLayer4 = null;
        }
        this.setupSemanticGlyphAI();
        this.setupAmbientOrbitGlyphs();
        this.setupGlyphLayer4Fusions();
        this.scheduleSceneShaderWarmup(this.currentMode || 'startup');
        this._lastHoverGlyphTarget = null;
        if (this.semanticGlyphAI?.setHoverTarget) {
            this.semanticGlyphAI.setHoverTarget(null);
        }

        // Initialize Glyph Purity Mode 5.1 (after scene ready)
        // Enforces minimal atmospheric visual identity - ONLY designed glyphs
        // DISABLED: Blocking GlyphLayer4 and node mutations
        this.glyphPurityMode = new GlyphPurityMode5_1(this.scene);
        this.glyphPurityMode.setPurityEnabled(false);  // DISABLED - allow all glyphs
        // this.glyphPurityMode.setPurityLevel(3); // PURE mode (strictest)
        // this.glyphPurityMode.purifyScene();     // First cleanup pass
        // this.glyphPurityMode.printPurityReport();

        // Initialize Adaptive Glyph Rendering 1.0 (after scene ready)
        // Makes glyphs respond to node metrics in real-time
        this.adaptiveGlyphRendering = new AdaptiveGlyphRendering1_0(this.scene);
        this.adaptiveGlyphRendering.setEnabled(true);
        console.log('✓ Adaptive Glyph Rendering 1.0 active — Glyphs now respond to node metrics');

        // Initialize Linked Glyph Synchronization 1.0 (after scene ready)
        // Coordinates animations across linked nodes
        this.linkedGlyphSync = new LinkedGlyphSynchronization1_0(this.scene);
        this.linkedGlyphSync.setEnabled(true);
        this.linkedGlyphMessaging?.setLinkedGlyphSync?.(this.linkedGlyphSync);
        console.log('✓ Linked Glyph Synchronization 1.0 active — Linked glyphs now coordinated');

        // Setup initial environment (Sigma Rift)
        this.setupSigmaRiftEnvironment();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Setup Sigma Rift Chamber environment
     */
    setupSigmaRiftEnvironment() {
        // Vast void with green rift glow
        this.scene.background = new THREE.Color(0x0a0a14);
        this.scene.fog = new THREE.FogExp2(0x0d1a12, 0.008);

        const lightParent = this.worldLightingRoot || this.worldRoot;
        lightParent?.clear?.();

        // Minimal dark ambient
        const ambientLight = new THREE.AmbientLight(0x0d4d40, 0.1);
        lightParent?.add(ambientLight);

        // Soft key light with cyan tint
        const keyLight = new THREE.DirectionalLight(0x00ccdd, 0.3);
        keyLight.position.set(30, 20, 30);
        lightParent?.add(keyLight);

        // Rim light with green tint from Rift
        const rimLight = new THREE.DirectionalLight(0x00ff88, 0.1);
        rimLight.position.set(-30, 20, -30);
        lightParent?.add(rimLight);
    }

    /**
     * Setup Dream Desert environment
     */
    setupDreamDesertEnvironment() {
        // Gradient dream sky
        const skyColors = {
            top: new THREE.Color(0x6633cc),      // Purple
            middle: new THREE.Color(0x3366ff),   // Blue
            bottom: new THREE.Color(0x00cccc)    // Turquoise
        };

        // Create gradient background
        this.scene.background = skyColors.middle;

        // Ground fog
        this.scene.fog = new THREE.FogExp2(0xccbbff, 0.010);

        const lightParent = this.worldLightingRoot || this.worldRoot;
        lightParent?.clear?.();

        // Soft ambient lighting
        const ambientLight = new THREE.AmbientLight(0xffeeff, 0.6);
        lightParent?.add(ambientLight);

        // Soft directional light (no hard shadows)
        const directionalLight = new THREE.DirectionalLight(0xffddff, 0.4);
        directionalLight.position.set(10, 30, 10);
        directionalLight.castShadow = false;
        lightParent?.add(directionalLight);

        // Hemisphere light for sky/ground gradient
        const hemisphereLight = new THREE.HemisphereLight(
            0xccbbff,  // Sky color
            0xf5d0f0,  // Ground color
            0.5
        );
        lightParent?.add(hemisphereLight);
    }



    /**
     * Setup Aether Dunes environment for the chamber world
     */
    setupChamberEnvironment() {
        this.scene.background = new THREE.Color(0x1f0c2f);
        this.scene.fog = new THREE.FogExp2(0x2b102f, 0.008);

        const lightParent = this.worldLightingRoot || this.worldRoot;
        lightParent?.clear?.();

        // Soft ambient glow with violet-magenta tones
        const ambientLight = new THREE.AmbientLight(0x8f4db4, 0.35);
        lightParent?.add(ambientLight);

        // Gentle directional fill for subtle depth
        const directionalLight = new THREE.DirectionalLight(0xcc88ff, 0.14);
        directionalLight.position.set(18, 20, 12);
        lightParent?.add(directionalLight);

        // Additional rim accent to support the dream dune palette
        const rimLight = new THREE.DirectionalLight(0xff99ee, 0.08);
        rimLight.position.set(-20, 18, -10);
        lightParent?.add(rimLight);
    }

    /**
     * Setup Quantum Island environment
     */
    setupQuantumIslandEnvironment() {
        // Gradient energy dome (violet → cyan)
        this.scene.background = new THREE.Color(0x4433aa);

        // Subtle void fog
        this.scene.fog = new THREE.FogExp2(0x2a1a4a, 0.01);

        const lightParent = this.worldLightingRoot || this.worldRoot;
        lightParent?.clear?.();

        // Soft ambient glow
        const ambientLight = new THREE.AmbientLight(0x8866ff, 0.4);
        lightParent?.add(ambientLight);

        // Directional light from above (no hard shadows)
        const directionalLight = new THREE.DirectionalLight(0x00dddd, 0.3);
        directionalLight.position.set(0, 50, 0);
        directionalLight.castShadow = false;
        lightParent?.add(directionalLight);

        // Hemisphere for void gradient
        const hemisphereLight = new THREE.HemisphereLight(
            0x6633cc,  // Sky violet
            0x00cccc,  // Ground cyan
            0.4
        );
        lightParent?.add(hemisphereLight);

        // Subtle point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0x8800ff, 0.3, 50);
        pointLight1.position.set(20, 10, 20);
        lightParent?.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x00dddd, 0.3, 50);
        pointLight2.position.set(-20, 10, -20);
        lightParent?.add(pointLight2);
    }

    /**
     * Create fallback ground plane for Quantum Island (QuantumIsland class disabled)
     * Provides basic ground geometry when QuantumIsland.js fails to load
     */
    createQuantumIslandFallbackGround() {
        // Create a dark, metallic disk as ground placeholder
        const groundRadius = 40;
        const groundGeometry = new THREE.CircleGeometry(groundRadius, 64);
        
        auditLateMaterialCreation('main::QuantumIslandFallbackGround::MeshStandardMaterial');
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0x004455,
            emissiveIntensity: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        
        this.worldRoot?.add(ground);
        
        // Add subtle neon ring edge
        const ringGeometry = new THREE.TorusGeometry(groundRadius - 1, 0.5, 32, 100);
        auditLateMaterialCreation('main::QuantumIslandFallbackGround::MeshBasicMaterial');
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00dddd,
            emissive: 0x00dddd,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01; // Slightly above to prevent z-fighting
        
        this.worldRoot?.add(ring);
    }

    /**
     * Setup Fractal Valley environment
     */
    setupFractalValleyEnvironment() {
        // Gradient sky violet to cyan
        this.scene.background = new THREE.Color(0x5544bb);

        // Distant fog for depth
        this.scene.fog = new THREE.FogExp2(0x7766cc, 0.018);

        const lightParent = this.worldLightingRoot || this.worldRoot;
        lightParent?.clear?.();

        // Soft pastel ambient light
        const ambientLight = new THREE.AmbientLight(0xddccff, 0.6);
        lightParent?.add(ambientLight);

        // Directional light for rim glow (no shadows)
        const directionalLight = new THREE.DirectionalLight(0xffeeff, 0.5);
        directionalLight.position.set(20, 50, 20);
        directionalLight.castShadow = false;
        lightParent?.add(directionalLight);

        // Hemisphere for valley gradient
        const hemisphereLight = new THREE.HemisphereLight(
            0x6633cc,  // Sky violet
            0xd4c8f0,  // Ground pastel
            0.5
        );
        lightParent?.add(hemisphereLight);

        // Subtle fill lights
        const fillLight1 = new THREE.PointLight(0xaa88ff, 0.2, 80);
        fillLight1.position.set(-40, 20, -40);
        lightParent?.add(fillLight1);

        const fillLight2 = new THREE.PointLight(0x88ddff, 0.2, 80);
        fillLight2.position.set(40, 20, 40);
        lightParent?.add(fillLight2);
    }

    /**
     * Setup Memory Lane environment
     */
    setupMemoryLaneEnvironment() {
        // Dark datacenter background
        this.scene.background = new THREE.Color(0x0a0a12);

        // Corridor fog for depth
        this.scene.fog = new THREE.FogExp2(0x0f0f1a, 0.008);

        const lightParent = this.worldLightingRoot || this.worldRoot;
        lightParent?.clear?.();

        // Soft ambient lighting
        const ambientLight = new THREE.AmbientLight(0x3344aa, 0.3);
        lightParent?.add(ambientLight);

        // Directional light from above
        const directionalLight = new THREE.DirectionalLight(0x6666aa, 0.5);
        directionalLight.position.set(0, 20, 10);
        directionalLight.castShadow = false;
        lightParent?.add(directionalLight);

        // Rim lights from sides
        const leftRimLight = new THREE.DirectionalLight(0x00dddd, 0.25);
        leftRimLight.position.set(-20, 5, 0);
        lightParent?.add(leftRimLight);

        const rightRimLight = new THREE.DirectionalLight(0x8800ff, 0.25);
        rightRimLight.position.set(20, 5, 0);
        lightParent?.add(rightRimLight);

        // Ceiling glow
        const ceilingLight = new THREE.PointLight(0x6633aa, 0.3, 50);
        ceilingLight.position.set(0, 9, 0);
        lightParent?.add(ceilingLight);
    }

    /**
     * Setup player with first-person controls
     */
    setupPlayer() {
        // Create invisible player object (we're in first-person)
        const playerGeometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
        auditLateMaterialCreation('main::Player::MeshBasicMaterial');
        const playerMaterial = new THREE.MeshBasicMaterial({
            visible: false
        });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        this.player.position.set(0, 1, 0);
        this.scene.add(this.player);

        // Setup player controller with increased speed
        this.playerController = new PlayerController(this.player, {
            moveSpeed: CONFIG.player.moveSpeed, // Already set to 15 (250% of 6)
            jumpForce: CONFIG.player.jumpForce,
            gravity: CONFIG.player.gravity,
            groundLevel: 1,
            groundHeightProvider: (x, z) => this.activeWorld?.getGroundLevelAt?.(x, z) ?? null,
            maxStepHeightProvider: () => this.activeWorld?.getMaxStepHeight?.() ?? null,
            collisionProvider: () => this.activeWorld?.getCollisionObjects?.() ?? this.activeWorld?.collisionObjects ?? [],
            worldBoundsProvider: () => this.activeWorld?.getMovementBounds?.() ?? null
        });

        // Setup first-person camera
        this.cameraController = new FirstPersonCameraController(
            this.camera,
            this.player,
            this.renderer.domElement,
            {
                eyeHeight: CONFIG.player.eyeHeight,
                mouseSensitivity: 0.002
            }
        );

        // Enable first-person mode
        this.cameraController.enable();
    }

    initSigmaWorld() {
        this.currentMode = 'sigma';
        this.currentTheme = 'sigma';
        this.createWorld('MAP_SWITCH');
        this.setupSigmaRiftEnvironment?.();
    }

    initDesertWorld() {
        this.currentMode = 'desert';
        this.currentTheme = 'desert';
        this.createWorld('MAP_SWITCH');
        this.setupDreamDesertEnvironment();
    }


    initQuantumWorld() {
        this.currentMode = 'quantum';
        this.currentTheme = 'quantum';
        this.createWorld('MAP_SWITCH');
        this.setupQuantumIslandEnvironment();
    }

    initFractalWorld() {
        this.currentMode = 'fractal';
        this.currentTheme = 'fractal';
        this.createWorld('MAP_SWITCH');
        this.setupFractalValleyEnvironment();
    }

    initChamberWorld() {
        this.currentMode = 'chamber';
        this.currentTheme = 'chamber';
        this.createWorld('MAP_SWITCH');
        this.setupChamberEnvironment();
    }

    initDreamDesert2World() {
        this.currentMode = 'desert2';
        this.currentTheme = 'desert2';
        this.createWorld('MAP_SWITCH');
        this.setupChamberEnvironment();
    }

    initMemoryWorld() {
        this.currentMode = 'memory';
        this.currentTheme = 'memory';
        this.createWorld('MAP_SWITCH');
    }

    _rebindWorldLifecycleSystems({
        linkingSystem = this.nodeLinkingSystem ?? this.linkingSystem ?? this.nodeLinking ?? null,
        aiNodes = this.aiNodes ?? null,
        semanticBus = this.semanticBus ?? null,
        frameScheduler = this.frameScheduler ?? null
    } = {}) {
        try {
            if (this.influenceReflection && typeof this.influenceReflection.rebind === 'function') {
                this.influenceReflection.rebind({
                    scene: this.scene,
                    world: this.world,
                    // REMOVED: harmonicInfluenceSystem reference — moved to LEGACY (2026-05-14)
                    aiNodes,
                    linkingSystem,
                    semanticBus,
                    frameScheduler
                });
            }
        } catch (err) {
            console.warn('[main.js] InfluenceReflectionBackPressureSystem rebind failed:', err?.message || err);
        }

        try {
            if (this.cascadeEventBridge && typeof this.cascadeEventBridge.rebind === 'function') {
                this.cascadeEventBridge.rebind({
                    linkingSystem,
                    semanticBus,
                    frameScheduler
                });
            }
        } catch (err) {
            console.warn('[main.js] CascadeEventBridge rebind failed:', err?.message || err);
        }

        try {
            if (this.standingWaveTrap && typeof this.standingWaveTrap.rebind === 'function') {
                this.standingWaveTrap.rebind({
                    aiNodes,
                    linkingSystem
                });
            }
        } catch (err) {
            console.warn('[main.js] StandingWaveTrapSystem rebind failed:', err?.message || err);
        }

        try {
            if (this.resonanceCascadeVisualization && typeof this.resonanceCascadeVisualization.rebind === 'function') {
                this.resonanceCascadeVisualization.rebind({ semanticBus });
            }
        } catch (err) {
            console.warn('[main.js] ResonanceCascadeVisualization rebind failed:', err?.message || err);
        }

        try {
            if (this.resonanceEchoTrailSystem && typeof this.resonanceEchoTrailSystem.rebind === 'function') {
                this.resonanceEchoTrailSystem.rebind({ semanticBus });
            }
        } catch (err) {
            console.warn('[main.js] ResonanceEchoTrailSystem rebind failed:', err?.message || err);
        }

        try {
            if (this.linkCascadeInfectionSystem && typeof this.linkCascadeInfectionSystem.rebind === 'function') {
                this.linkCascadeInfectionSystem.rebind({
                    linkingSystem,
                    semanticBus
                });
            }
        } catch (err) {
            console.warn('[main.js] LinkCascadeInfectionSystem rebind failed:', err?.message || err);
        }

        try {
            if (this.cascadeToWaveBridge && typeof this.cascadeToWaveBridge.rebind === 'function') {
                this.cascadeToWaveBridge.rebind({
                    linkingSystem,
                    semanticBus,
                    waveInterferenceEngine: this.waveInterferenceEngine
                });
            }
        } catch (err) {
            console.warn('[main.js] CascadeToWaveBridge rebind failed:', err?.message || err);
        }

        try {
            if (this.harmonicHealingRecovery && typeof this.harmonicHealingRecovery.rebind === 'function') {
                this.harmonicHealingRecovery.rebind({
                    scene: this.scene,
                    linkingSystem,
                    particleSystem: this.healingParticles,
                    ruptureSystem: this.resonanceRupture,
                    semanticBus,
                    frameScheduler
                });
            }
        } catch (err) {
            console.warn('[main.js] HarmonicHealingRecoveryVisualSystem rebind failed:', err?.message || err);
        }

        try {
            if (this.selectedHUD && typeof this.selectedHUD.rebind === 'function') {
                this.selectedHUD.rebind({
                    linkingSystem,
                    semanticBus
                });
            }
        } catch (err) {
            console.warn('[main.js] SelectedHUD rebind failed:', err?.message || err);
        }

        try {
            if (this.recursiveGlyphSignalSystem && typeof this.recursiveGlyphSignalSystem.rebind === 'function') {
                this.recursiveGlyphSignalSystem.rebind({
                    linkingSystem,
                    semanticBus,
                    frameScheduler,
                    semanticGlyphAI: this.semanticGlyphAI,
                    selectionCore: linkingSystem
                });
            }
        } catch (err) {
            console.warn('[main.js] RecursiveGlyphSignalSystem rebind failed:', err?.message || err);
        }

        try {
            if (this.resonanceRupture && typeof this.resonanceRupture.rebind === 'function') {
                this.resonanceRupture.rebind({
                    linkingSystem,
                    aiNodes,
                    semanticBus
                });
            }
        } catch (err) {
            console.warn('[main.js] ResonanceRupture rebind failed:', err?.message || err);
        }

        try {
            const trapSystem = this.standingWaveTrapSystem || this.standingWaveTrap;
            if (trapSystem && typeof trapSystem.rebind === 'function') {
                trapSystem.rebind({
                    linkingSystem,
                    aiNodes
                });
            }
        } catch (err) {
            console.warn('[main.js] StandingWaveTrapSystem rebind failed:', err?.message || err);
        }

        try {
            if (this.standingWaveRenderer && typeof this.standingWaveRenderer.rebind === 'function') {
                this.standingWaveRenderer.rebind({
                    scene: this.scene,
                    standingWaveTrapSystem: this.standingWaveTrap,
                    linkingSystem,
                    aiNodes
                });
            }
        } catch (err) {
            console.warn('[main.js] StandingWaveVisualRenderer rebind failed:', err?.message || err);
        }

        try {
            if (this.waveInterference && typeof this.waveInterference.rebind === 'function') {
                this.waveInterference.rebind({
                    scene: this.scene,
                    standingWaveTrapSystem: this.standingWaveTrap,
                    linkingSystem,
                    aiNodes
                });
            }
        } catch (err) {
            console.warn('[main.js] WaveInterferencePatternSystem rebind failed:', err?.message || err);
        }

        // Rebind HarmonyStabilizationSystem_v1
        try {
            if (this.harmonyStabilizationSystem && typeof this.harmonyStabilizationSystem.rebind === 'function') {
                this.harmonyStabilizationSystem.rebind({
                    linkingSystem,
                    aiNodes,
                    semanticBus
                });
            }
        } catch (err) {
            console.warn('[main.js] HarmonyStabilizationSystem rebind failed:', err?.message || err);
        }

        // Rebind cascade particle system semantic sources
        try {
            if (this.cascadeParticleSystem && typeof this.cascadeParticleSystem.setSemanticBus === 'function') {
                this.cascadeParticleSystem.setSemanticBus(this.semanticBus ?? globalThis?.semanticBus ?? null);
            }
        } catch (err) {
            console.warn('[main.js] CascadeParticleSystem semantic rebind failed:', err?.message || err);
        }

        // Rebind LinkRendererConduit
        try {
            if (this.linkRendererConduit && typeof this.linkRendererConduit.rebind === 'function') {
                this.linkRendererConduit.rebind({
                    linkSystem: this.linkingSystem,
                    frameScheduler
                });
            }
        } catch (err) {
            console.warn('[main.js] LinkRendererConduit rebind failed:', err?.message || err);
        }

        try {
            if (this.linkTrailParticles && typeof this.linkTrailParticles.rebind === 'function') {
                this.linkTrailParticles.rebind({
                    scene: this.scene,
                    worldRoot: this.worldRoot
                });
            }
        } catch (err) {
            console.warn('[main.js] LinkTrailParticleSystem rebind failed:', err?.message || err);
        }

        try {
            if (this.microImpulseAdapter && typeof this.microImpulseAdapter.rebind === 'function') {
                this.microImpulseAdapter.rebind({
                    scene: this.scene,
                    worldRoot: this.worldRoot
                });
            }
        } catch (err) {
            console.warn('[main.js] LinkMicroImpulseAdapter rebind failed:', err?.message || err);
        }

        try {
            const pictogramSystem = this.linkSemanticPictograms || this.linkPictogramSystem || this.linkingSystem?.conduitRenderer?.pictogramSystem || null;
            if (pictogramSystem && typeof pictogramSystem.resetForWorldSwitch === 'function') {
                pictogramSystem.resetForWorldSwitch({
                    scene: this.scene,
                    worldRoot: this.worldRoot,
                    camera: this.camera,
                    linkingSystem,
                    aiNodes
                });
            }
        } catch (err) {
            console.warn('[main.js] LinkSemanticPictogramSystem resetForWorldSwitch failed:', err?.message || err);
        }

        try {
            if (this.narrativePatterns && typeof this.narrativePatterns.resetForWorldSwitch === 'function') {
                this.narrativePatterns.resetForWorldSwitch();
            }
        } catch (err) {
            console.warn('[main.js] AINarrativePatterns6_0 resetForWorldSwitch failed:', err?.message || err);
        }

        try {
            if (this.echoTrailsIntegration && typeof this.echoTrailsIntegration.rebind === 'function') {
                this.echoTrailsIntegration.rebind({
                    linkingSystem,
                    semanticBus
                });
            }
        } catch (err) {
            console.warn('[main.js] EchoTrailsIntegration rebind failed:', err?.message || err);
        }

        // REMOVED: AnimatedLinkFlow rebind — moved to LEGACY/april (2026-04-22)
    }

    /**
     * Create the ATOMA world
     */
    createWorld(reason) {
        console.log('[CREATEWORLD] start', { reason, mode: this.currentMode });
        // World Transition Guard - prevent re-entrant execution
        if (this._worldTransitionInProgress && reason !== 'MAP_SWITCH') {
            console.warn('[WorldTransition] Ignored re-entrant createWorld call for reason:', reason);
            return;
        }

        this._worldTransitionInProgress = true;

        // ALPHA CLARITY: reset per-world hint flags so hints can re-show
        this._hintFirstLinkShown = false;
        this._hintRewindBlockShown = false;
        this._hintRewindStartShown = false;
        if (this.gameplayHintLayer) {
            this.gameplayHintLayer.reset();
        }

        try {
            // Cleanup old world event listeners
            this.disposeWorldListeners();
            this._rebindWorldLifecycleSystems({
                linkingSystem: null,
                aiNodes: null,
                semanticBus: null,
                frameScheduler: this.frameScheduler ?? null
            });

            const reasonForCreate = reason || this._pendingCreateWorldReason || 'CREATE_WORLD';
            this._pendingCreateWorldReason = null;
            // ATOMA: visual layer prune/reset on world switch
            this.frameScheduler?.resetLayer?.('visual');
            if (this.vfxLoader) {
                this.vfxLoader.onWorldSwitch(reasonForCreate);
            }
            this.registerVisualGlyphSchedulers?.();

            if (this.cascadeParticleSystem && typeof this.cascadeParticleSystem.clearWorldState === 'function') {
                this.cascadeParticleSystem.clearWorldState();
            }

            // NEW: Dispose cascade particle systems
            if (this.cascadeParticleSystem && typeof this.cascadeParticleSystem.dispose === 'function') {
                this.cascadeParticleSystem.dispose();
                console.log('[main.js] CascadeParticleSystem disposed');
            }
             
            if (this.cascadingRuptures && typeof this.cascadingRuptures.dispose === 'function') {
                this.cascadingRuptures.dispose();
                console.log('[main.js] CascadingRuptureSystem disposed');
            }

            // NEW: Dispose cascade event bridge
            if (this.cascadeEventBridge && typeof this.cascadeEventBridge.dispose === 'function') {
                this._unregisterCascadeEventBridgeTick();
                this.cascadeEventBridge.dispose();
                console.log('[main.js] CascadeEventBridge disposed');
            }
            this.cascadeEventBridge = null;

            if (this.cascadeVisualizer && typeof this.cascadeVisualizer.dispose === 'function') {
                this.cascadeVisualizer.dispose();
                console.log('[main.js] SynergyCascadeVisualizer disposed');
            }
            this.cascadeVisualizer = null;

            if (this.cascadePropagationVisuals && typeof this.cascadePropagationVisuals.dispose === 'function') {
                this.cascadePropagationVisuals.dispose();
                console.log('[main.js] CascadePropagationVisuals disposed');
            }
            if (this.phase5CascadePropagationVisuals && this.phase5CascadePropagationVisuals !== this.cascadePropagationVisuals && typeof this.phase5CascadePropagationVisuals.dispose === 'function') {
                this.phase5CascadePropagationVisuals.dispose();
                console.log('[main.js] PHASE5_CascadePropagationVisuals disposed');
            }
            this.cascadePropagationVisuals = null;
            this.phase5CascadePropagationVisuals = null;

            if (this.t2CorruptionVisualIntegration && typeof this.t2CorruptionVisualIntegration.dispose === 'function') {
                this.t2CorruptionVisualIntegration.dispose();
                console.log('[main.js] T2_CorruptionVisualIntegration disposed');
            }
            this.t2CorruptionVisualIntegration = null;

            if (this.corruptionVisualFX && typeof this.corruptionVisualFX.dispose === 'function') {
                this.corruptionVisualFX.dispose();
                console.log('[main.js] CorruptionVisualFX disposed');
            }
            this.corruptionVisualFX = null;
             
            if (this.cascadeResonanceWave && typeof this.cascadeResonanceWave.dispose === 'function') {
                this.cascadeResonanceWave.dispose();
                console.log('[main.js] CascadeResonanceWaveVisualization disposed');
            }
            
            if (this.resonanceCascade && typeof this.resonanceCascade.dispose === 'function') {
                this.resonanceCascade.dispose();
                console.log('[main.js] ResonanceCascadeVisualization disposed');
            }

            // FIX 6: Dispose Visual Echo Trails on world switch
            if (this.echoTrailsIntegration && typeof this.echoTrailsIntegration.dispose === 'function') {
                this.echoTrailsIntegration.dispose();
            }
            this.echoTrailsIntegration = null;
            this.echoTrailsSystem = null;

            // Dispose existing AI nodes before tearing down roots
            if (this.aiNodes && typeof this.aiNodes.dispose === 'function') {
                this.aiNodes.dispose();
            }

            // Cleanup timers to prevent memory leaks
            if (window._atomaWaveDebugOverlayProbe) {
                clearInterval(window._atomaWaveDebugOverlayProbe);
                window._atomaWaveDebugOverlayProbe = null;
            }
            if (window._atomaPipelineProbe) {
                clearInterval(window._atomaPipelineProbe);
                window._atomaPipelineProbe = null;
            }
            if (this._sceneAuditTimer) {
                clearInterval(this._sceneAuditTimer);
                this._sceneAuditTimer = null;
            }

            // Remove previous nodesRoot (node domain only)
            if (this.nodesRoot) {
                this.nodesRoot.clear();
                this.scene.remove(this.nodesRoot);
                this.nodesRoot = null;
            }

            if (this.worldRoot) {
                this.scene.remove(this.worldRoot);
            }
            if (this.vfxRoot) {
                this.vfxRoot.clear();
                this.vfxRoot.parent?.remove(this.vfxRoot);
            }

            // FrameScheduler Stale State Reset (clear simulation/background layer state after old world disposal)
            // NOTE: Do NOT reset 'realtime' layer (camera, player, core systems)
            if (this.frameScheduler) {
                this.frameScheduler.resetLayer('simulation');
                this.frameScheduler.resetLayer('background');
            }

            // Stale Reference Hard Reset (prevent old world references from persisting)
            // Clear references that WILL be recreated immediately
            // NOTE: linkingSystem is NOT recreated, so we DON'T set it to null
            this.aiNodes = null;
            this.worldLightingRoot = null;

        this.worldRoot = new THREE.Group();
        this.worldRoot.name = "ATOMA_WorldRoot";
        this.worldRoot.userData = {
            ...(this.worldRoot.userData || {}),
            currentMode: this.currentMode || 'quantum',
            worldRole: 'worldRoot'
        };
        this.scene.add(this.worldRoot);
        this.environmentRoot = new THREE.Group();
        this.environmentRoot.name = 'ATOMA_EnvironmentRoot';
        this.environmentRoot.userData = {
            ...(this.environmentRoot.userData || {}),
            currentMode: this.currentMode || 'quantum',
            worldRole: 'environmentRoot'
        };
        if (this.scene) {
            this.scene.userData = {
                ...(this.scene.userData || {}),
                currentMode: this.currentMode || 'quantum'
            };
        }
        this.worldRoot.add(this.environmentRoot);
        if (this.vfxRoot) {
            this.worldRoot.add(this.vfxRoot);
            if (this.vfxLoader) {
                this.vfxLoader.world = this.worldRoot;
                this.vfxLoader.vfxRoot = this.vfxRoot;
            }
        }
        this.nodesRoot = new THREE.Group();
        this.nodesRoot.name = 'ATOMA_NodesRoot';
        this.nodesRoot.matrixAutoUpdate = false;
        this.nodesRoot.updateMatrix();
        this.scene.add(this.nodesRoot);
        this.worldLightingRoot = new THREE.Group();
        this.worldLightingRoot.name = "ATOMA_WorldLightingRoot";
        this.worldRoot.add(this.worldLightingRoot);
        if (this.linkingSystem) {
            this.linkingSystem.resetForWorldRebuild({ scene: this.scene, worldRoot: this.worldRoot });
        }
        // Reset linkingSystem to prevent stale references (if resetForWorldSwitch exists)
        if (this.linkingSystem?.resetForWorldSwitch) {
            this.linkingSystem.resetForWorldSwitch();
        }

        if (this.glyphLayer4?.dispose) {
            this.glyphLayer4.dispose();
        }
        const staleGlyphRoots = [];
        this.scene?.traverse?.((obj) => {
            if (!obj?.isGroup) return;
            if (obj.userData?.isAtomaGlyphContainer || obj.userData?.isAtomaGlyph4Container || obj.name === 'AtomaGlyphSystem' || obj.name === 'AtomaGlyphSystem4') {
                staleGlyphRoots.push(obj);
            }
        });
        staleGlyphRoots.forEach((root) => root.parent?.remove(root));
        if (this.enableGlyphLayer4) {
            this.glyphLayer4 = new GlyphLayer4_MultiFusion(
                this.scene,
                this.worldRoot,
                this.compositeResonanceFeedback || null
            );
            this.glyphLayer4.frameScheduler = this.frameScheduler;
            this.glyphLayer4.hoverOnlyMode = !this.enableGlyphLayer4FullVisuals;
        } else {
            this.glyphLayer4 = null;
        }
        // NOTE: Glyph fusion creation moved to AFTER createAINodes to ensure nodes exist
        // See: https://github.com/openclaw/atoma/issues/XXX (Fix: GlyphLayer4 fusionRegistry empty)

        if (this.worldPersonalityController?.root) {
            this.worldPersonalityController.root.parent?.remove(this.worldPersonalityController.root);
            this.worldRoot.add(this.worldPersonalityController.root);
        }

        [this.worldFXPack, this.worldEvents, this.weatherPack, this.metricReactiveEvents].forEach(sys => {
            if (sys?.root) {
                sys.root.parent?.remove(sys.root);
            }
            // Reset reattachable systems to prevent stale references
            if (sys?.resetForWorldSwitch) {
                sys.resetForWorldSwitch();
            }
            // Reattach to new worldRoot after reset
            if (sys?.root) {
                this.worldRoot.add(sys.root);
                if (sys === this.worldEvents) {
                    console.log('[WorldEvents] root reattached after world switch to', this.worldRoot.name || 'worldRoot');
                }
            }
        });

        try {
            if (this.linkTrailParticles && typeof this.linkTrailParticles.rebind === 'function') {
                this.linkTrailParticles.rebind({
                    scene: this.scene,
                    worldRoot: this.worldRoot
                });
            }
        } catch (err) {
            console.warn('[main.js] LinkTrailParticleSystem world rebind failed:', err?.message || err);
        }

        try {
            if (this.microImpulseAdapter && typeof this.microImpulseAdapter.rebind === 'function') {
                this.microImpulseAdapter.rebind({
                    scene: this.scene,
                    worldRoot: this.worldRoot
                });
            }
        } catch (err) {
            console.warn('[main.js] LinkMicroImpulseAdapter world rebind failed:', err?.message || err);
        }

        this.t2HarmonyVisualConsumer?.resetForWorldSwitch?.({
            scene: this.scene,
            harmonySystem: this.harmonyStabilizationSystem,
            attachRootResolver: () => this.vfxRoot || this.worldRoot || this.scene
        });

        // Dispose old world instance before creating new one
        if (this.activeWorld) {
            console.log('[WorldInstance] Disposing old activeWorld:', this.activeWorld);
            
            // If world instance has dispose(), use it
            if (this.activeWorld.dispose) {
                this.activeWorld.dispose();
            } else {
                // Minimal disposal for instances without dispose()
                // 1. Clear world children
                if (this.activeWorld.worldRoot) {
                    this.activeWorld.worldRoot.children.forEach(child => {
                        this.activeWorld.worldRoot.remove(child);
                        if (child.dispose) {
                            child.dispose();
                        }
                    });
                }
                // 2. Clear references
                this.activeWorld.worldRoot = null;
                this.activeWorld.scene = null;
                this.activeWorld.camera = null;
            }
        }
        this.activeWorld = null;

        // Environment FX lifecycle: dispose controller before clearing root
        if (this.environmentDomain) {
            this.environmentDomain.dispose();
            this.environmentDomain = null;
        }

        if (this.signatureMomentDirector?.dispose) {
            this.signatureMomentDirector.dispose();
            this.signatureMomentDirector = null;
        }

        // Clear environment-layer content before rebuilding world
        if (this.environmentRoot) {
            while (this.environmentRoot.children.length > 0) {
                this.environmentRoot.remove(this.environmentRoot.children[0]);
            }
        }

        // Recreate environment FX controller for the new world instance
        this.environmentDomain?.dispose?.();
        this.environmentDomain = new EnvironmentDomainController(
            this.scene,
            this.worldRoot,
            this.environmentRoot,
            this.frameScheduler,
            {
                SafeWorldFXPack,
                SafeAIWeatherPack,
                SafeQuantumIllusionsPack1,
                AmbientEntityManager,
                // EmergentThoughtStorms5_0,
                EnvironmentalHazards,
                SafeLegendaryWorldEvents,
                WorldPersonalityController,
                MythicRitualController,
                MetricReactiveWorldEvents,
                SafeDreamDepthPack,
                DreamDepthEffectManager,
                SafeColonyExpansion2,
                camera: this.camera,
                aiNodes: this.aiNodes,
                linkingSystem: this.linkingSystem,
                worldEvents: this.worldEvents,
                legendaryPack: this.legendaryPack,
                evolutionManager: this.evolutionManager,
                recursiveGlyphMessaging: this.recursiveGlyphMessaging,
                semanticGlyphAI: this.semanticGlyphAI,
                renderer: this.renderer,
                coreMetricsOverlay: this.coreMetricsOverlay,
                semanticBus: this.semanticBus,
                player: this.player,
                audioSystem: this.audioSystem || null,
                synergyMap: this.synergyMap || {},
                trafficMap: this.trafficMap || {},
                worldContextProvider: () => this._getCanonicalWorldContext()
            }
        );
        this.environmentDomain.init();
        this.worldEvents = this.environmentDomain?.instances?.worldEvents || this.worldEvents;
        this.worldPersonalityController = this.environmentDomain?.instances?.worldPersonalityController || this.worldPersonalityController;
        this.metricReactiveEvents = this.environmentDomain?.instances?.metricReactiveEvents || this.metricReactiveEvents;
        this.dreamDepthPack = this.environmentDomain?.instances?.safeDreamDepthPack || this.dreamDepthPack;
        this.dreamDepthEffects = this.environmentDomain?.instances?.dreamDepthEffectManager || this.dreamDepthEffects;
        this.quantumIllusions = this.environmentDomain?.instances?.quantumIllusions || this.quantumIllusions;
        this.ambientEntityManager = this.environmentDomain?.instances?.ambientEntityManager || this.ambientEntityManager;
        this.emergentThoughtStorms = null;
        this.colonyManager = this.environmentDomain?.instances?.colonyExpansion || this.colonyManager;
        this.hazards = this.environmentDomain?.instances?.environmentalHazards || this.hazards;
        this.worldEventCoordinator = this.environmentDomain?.instances?.worldEventCoordinator || this.worldEventCoordinator;
        this.setEnvironmentalHazardsEnabled?.(this.environmentalHazardsEnabled ?? true);
        this._syncDreamDepthRefs();
        if (this.hazards && this.currentMode === 'fractal') {
            // Fractal Valley world pass: no inherited anomaly set pieces here.
        }

        if (this.currentMode === 'sigma') {
            this.sigmaRift = new SigmaRiftChamber(
                this.scene,
                this.worldRoot,
                this.camera
            );
            this.activeWorld = this.sigmaRift;
        } else if (this.currentMode === 'desert') {
            this.dreamDesert = new DreamDesert(
                this.scene,
                this.worldRoot,
                this.camera
            );
            this.activeWorld = this.dreamDesert;
        } else if (this.currentMode === 'quantum') {
            this.quantumIsland = new QuantumIsland(
                this.scene,
                this.worldRoot,
                this.camera
            );
            this.activeWorld = this.quantumIsland;
        } else if (this.currentMode === 'fractal') {
            this.fractalValley = new FractalValley(
                this.scene,
                this.worldRoot,
                this.camera
            );
            this.activeWorld = this.fractalValley;
        } else if (this.currentMode === 'desert2') {
            this.chamber = new DreamDesert2(
                this.scene,
                this.worldRoot,
                this.camera
            );
            this.activeWorld = this.chamber;
        } else if (this.currentMode === 'memory') {
            this.setupMemoryLaneEnvironment?.();
            this.memoryLane = new MemoryLane(
                this.scene,
                this.worldRoot
            );
            this.activeWorld = this.memoryLane;
        } else if (this.currentMode === 'chamber') {
            this.chamber = new DreamDesert2(
                this.scene,
                this.worldRoot,
                this.camera
            );
            this.activeWorld = this.chamber;
        } else {
            this.chamber = new World({
                scene: this.scene,
                worldRoot: this.worldRoot
            });
            this.activeWorld = this.chamber;
        }

        if (window.ATOMA_FLAGS?.debug?.worldProbe) {
            const bounds = new THREE.Box3().setFromObject(this.worldRoot);
            const size = bounds.getSize(new THREE.Vector3());
            const center = bounds.getCenter(new THREE.Vector3()); 
            console.log('[WORLD_PROBE]', {
                mode: this.currentMode,
                childCount: this.worldRoot.children.length,
                min: bounds.min.clone(),
                max: bounds.max.clone(),
                size,
                center,
                cameraPosition: this.camera?.position?.clone()
            });
        }

        // Create AI nodes for this environment
        this._allowRegistryReset = true;
        this.createAINodes(reasonForCreate);
        this._applyRunIdentitySelection(this._runIdentityPendingSelection, { source: 'world-load' });
        this.ensureCascadeEventBridge();
        this._rebindWorldLifecycleSystems();
        this.setupSignatureMomentDirector();

        // GlyphLayer4 runs in hover-only mode: no global fusion creation.
        this.setupSemanticGlyphAI();
        this.setupAmbientOrbitGlyphs();
        this.setupGlyphLayer4Fusions();
        this.scheduleSceneShaderWarmup(reasonForCreate);

        // ====================================================================
        // DEV-ONLY INTEGRITY CHECK: Verify fusion registry coverage
        // ====================================================================
        if (window.ATOMA_FLAGS?.debug?.glyphFusionIntegrity === true) {
            setTimeout(() => {
                if (this.glyphLayer4?.hoverOnlyMode) return;
                const nodeCount = this.aiNodes?.nodes?.length || 0;
                const fusionCount = this.glyphLayer4?.fusionRegistry?.size || 0;
                if (nodeCount !== fusionCount) {
                    console.error('[GlyphLayer4] Integrity mismatch:', {
                        totalNodes: nodeCount,
                        fusedNodes: fusionCount,
                        missing: nodeCount - fusionCount
                    });
                    // Log missing nodeIds
                    const missingNodes = this.aiNodes?.nodes?.filter(n => !n?.userData?.nodeId || !this.glyphLayer4?.fusionRegistry?.has(n.userData.nodeId));
                    if (missingNodes?.length > 0) {
                        console.warn('[GlyphLayer4] Missing fusions for nodes:', missingNodes.map(n => ({
                            nodeId: n.userData?.nodeId,
                            hasNodeId: !!n.userData?.nodeId,
                            category: n.userData?.category
                        })));
                    }
                } else {
                    console.log('[GlyphLayer4] Integrity check passed: all nodes fused');
                }
            }, 2000); // Check after 2 seconds to allow async spawn to complete
        }

        // ====================================================================
        // CONTROLLED UNFREEZE SYSTEM: REMOVED (2026-03-27)
        // ====================================================================
        // Moved to LEGACY/LOCK and POLICIES to delete
        
        console.log('[CREATEWORLD] end', {
            reason,
            mode: this.currentMode,
            worldRootChildren: this.worldRoot?.children?.length
        });

        // ALPHA CLARITY: show start hint on first world load
        if (this.gameplayHintLayer) {
            if (this.firstRunGuidanceDirector?.isActive?.()) {
                this.firstRunGuidanceDirector.handleWorldLoad({ world: this.currentMode });
            } else {
                this.gameplayHintLayer.show('start', { world: this.currentMode });
            }
        }
        this._triggerRunIdentityOverlayForCurrentWorld();
        } finally {
            this._worldTransitionInProgress = false;
        }
    }
/*  createAINodes() {
  console.log("AINodes INIT ONLY");
  return; // tvrdý early exit
 } */
    /**
     * Create interactive AI nodes
     */
    createAINodes(reason = 'UNKNOWN') {
        // AINodes ownership: created in createWorld(); do not create here.
        this._allowRegistryReset = false;

        const allowedReasons = new Set(['CREATE_WORLD', 'MAP_SWITCH']);
        if (!allowedReasons.has(reason)) {
            const stack = new Error().stack;
            if (typeof window !== 'undefined') {
                window.__AINODES_CREATE_COUNT = (window.__AINODES_CREATE_COUNT || 0) + 1;
                window.__AINODES_LAST_STACK = stack;
            }
            console.error("[AINODES_ILLEGAL_CREATE]", reason, stack);
            throw new Error("AINodes may only be created from createWorld()");
        }
        if (typeof window !== 'undefined') {
            window.__AINODES_CREATE_COUNT = (window.__AINODES_CREATE_COUNT || 0) + 1;
            window.__AINODES_LAST_STACK = new Error().stack;
        }

        if (this.aiNodes) {
            console.error('[AINodes] Instance already exists');
            return this.aiNodes;
        }

        if (!this.nodesRoot) {
            throw new Error('[AINodesInit] nodesRoot is missing during AINodes creation');
        }

        this.aiNodes = new AINodes(this.scene, this.nodesRoot, this.player, sessionVariantEngine);
        if (this.activeRunIdentitySelection?.runPackage) {
            this.aiNodes.setRunIdentityProfile(this.activeRunIdentitySelection.runPackage);
        }
        if (this.vfxLoader) {
            this.vfxLoader.aiNodes = this.aiNodes;
        }
        window.__ATOMA_AINODES__ = this.aiNodes;
        this.aiNodes.waveInterferenceEngine = this.waveInterferenceEngine || null;
        systemRegistry.register('aiNodes', this.aiNodes);

        // CRITICAL: Disable aiNodes in SystemRegistry to prevent duplicate execution
        // aiNodes.update() runs EXCLUSIVELY via FrameScheduler.register('aiNodes.update', ...)
        // SystemRegistry execution restored for 118 legacy systems (see SYSTEMREGISTRY_DEPENDENCY_FORENSIC_AUDIT.md)
        systemRegistry.disable('aiNodes');

        // REMOVED: SIMULATION INVARIANT ENFORCEMENT - moved to LEGACY (2026-04-08)

        // ====================================================================
        // REMOVED: TASK 3 Rare Node Verification Tracker - moved to LEGACY (2026-04-03)
        // setupRareNodeVerificationTracker(this.aiNodes);
        
        // REMOVED: patchArchetypeVisuals — moved to LEGACY/april (2026-04-22)
        // Optional: first-spawn program-count log (guarded by PROGRAM_LOG)
        let __loggedFirstSpawn = false;
        const originalCreateNode = this.aiNodes.createNode.bind(this.aiNodes);
        this.aiNodes.createNode = (...args) => {
            const node = originalCreateNode(...args);
            if (!__loggedFirstSpawn) {
                logPrograms('after-first-node', this.renderer);
                __loggedFirstSpawn = true;
            }
            if (window.ATOMA_FLAGS?.release?.disableWaveShaderStack !== true && this.waveDynamicsShaderPack && node) {
                this.waveDynamicsShaderPack.applyToNode(node, 'SYNERGY');
            }
            // Emit canonical node.spawned event for event-driven systems
            if (this.semanticBus && node) {
                const nodeId = node.userData?.nodeId || node.id || node.uuid;
                const category = node.userData?.category;
                const position = node?.position
                    ? { x: node.position.x, y: node.position.y, z: node.position.z }
                    : null;
                this.semanticBus.emit('node.spawned', {
                    nodeId,
                    category,
                    position
                }, { priority: this.semanticBus.priority.INTERACTIVE });
            }
            return node;
        };
        
        // ========================================================================
        // SESSION 20: VISUAL HIERARCHY CORRECTION SYSTEM v1.0
        // Enforces visual dominance of core node geometry over auxiliary layers
        // DEACTIVATED: Replaced by VisualHierarchyRegistry (Daniel request 2026-03-03)
        // ========================================================================
        // this.visualHierarchyCorrection = new VisualHierarchyCorrectionSystem_v1({
        //   enableAutoEnforcement: true,
        //   enableDebug: false, // Set to true for debug logging
        //   enforcementMode: 'constrain', // 'constrain' | 'suppress' | 'relocate'
        //   radiusScaleFactor: 1.8,
        //   suppressLegacyExtremes: true
        // });

        // Register all created nodes with hierarchy system
        // DEACTIVATED: Replaced by VisualHierarchyRegistry (Daniel request 2026-03-03)
        // for (const node of this.aiNodes.nodes) {
        //   this.visualHierarchyCorrection.registerNode(node, node.userData?.category || 'input');
        // }
        console.log('[main.js] Visual Hierarchy Correction System v1.0 initialized ✓');

        // Initialize dynamic node spawning system
        this.aiNodes.initializeNodeSpawning();

        // ====================================================================
        // SIMULATION EFFECT ORCHESTRATOR (Session 37+ FIXED)
        // Central hub for all dt-based animations (no requestAnimationFrame)
        // Consolidates: node materialization, link pulses, mythic effects
        // ====================================================================
        this.effectOrchestrator = new SimulationEffectOrchestrator(this.scene);
        console.log('[main.js] Simulation Effect Orchestrator initialized ✓');

        // Create node linking system
        this.linkingSystem = new NodeLinkingSystem(
            this.scene,
            this.camera,
            this.renderer,
            this.aiNodes
        );
        this.linkRendererConduit = this.linkingSystem?.conduitRenderer || this.linkRendererConduit || null;
        if (this.harmonicHealingRecovery) {
            this.harmonicHealingRecovery.linkingSystem = this.linkingSystem;
        }
        if (this.linkingSystem?.conduitRenderer) {
            this.linkingSystem.conduitRenderer.waveShaderBridge =
                window.ATOMA_FLAGS?.release?.disableWaveShaderStack === true
                    ? null
                    : (this.waveShaderBridge || this.linkingSystem.conduitRenderer.waveShaderBridge);
        }
        if (this.linkRendererConduit && this.linkResonanceFlowSystem) {
            this.linkRendererConduit.linkResonanceFlowSystem = this.linkResonanceFlowSystem;
            this.linkRendererConduit.linkResonanceSystem = this.linkResonanceSystem || this.linkResonanceFlowSystem;
            this.linkResonanceFlowSystem.world = this.linkRendererConduit.linkSystem || this.linkingSystem || this.world || this.linkResonanceFlowSystem.world;
            this.linkResonanceFlowSystem.rebindScene?.(this.scene);
        }
        this.linkingSystem.semanticBus = this.semanticBus;

        // Wire canonical event bus into LinkRendererConduit corruption subsystems
        if (this.linkRendererConduit?.setEventBus) {
            this.linkRendererConduit.setEventBus(this.semanticBus);
        }
        this.linkingSystem.isReady = true;
        if (this.cascadingRuptures?.rebind) {
            this.cascadingRuptures.rebind({
                linkingSystem: this.linkingSystem,
                aiNodes: this.aiNodes,
                regionalEquilibrium: this.regionalEquilibrium
            });
        }
        if (this.criticalNodeFailure?.rebind) {
            this.criticalNodeFailure.rebind({
                linkingSystem: this.linkingSystem,
                aiNodes: this.aiNodes,
                scene: this.scene
            });
        }
        if (this.linkingSystem?.onNodeSelected && !this.linkingSystem.__audioSelectionAuthorityBound) {
            const playSelectionAudio = (type) => {
                if (!this.audioSystem) return;
                if (this.audioSystem.enabled === false) return;
                const play = () => {
                    if (!this.audioSystem?.initialized) return;
                    if (type === 'select') {
                        this.audioSystem.playSelection?.();
                    } else {
                        this.audioSystem.playDeselection?.();
                    }
                };
                if (this.audioSystem.initialized) {
                    play();
                    return;
                }
                this.ensureAudioStarted?.()
                    .then(() => play())
                    .catch(() => {});
            };

            this.linkingSystem.onNodeSelected((node) => {
                playSelectionAudio('select');

                if (!this._recursiveGlyphSignalFirstSelectLogged) {
                    this._recursiveGlyphSignalFirstSelectLogged = true;
                    console.error(
                        '[DEBUG][RecursiveGlyphSignalSystem] first NodeLinkingSystem select received:',
                        node?.userData?.name || node?.name || node?.id || node?.uuid || 'node'
                    );
                }
            });
            this.linkingSystem.onNodeDeselected(() => playSelectionAudio('deselect'));
            this.linkingSystem.__audioSelectionAuthorityBound = true;
        }
        if (this.linkingSystem?.onNodeHoverStart && !this.linkingSystem.__audioHoverAuthorityBound) {
            const playHoverAudio = () => {
                if (!this.audioSystem) return;
                if (this.audioSystem.enabled === false) return;
                if (!this.audioSystem.initialized) return;
                this.audioSystem.playHoverEnter?.();
            };

            this.linkingSystem.onNodeHoverStart(() => playHoverAudio());
            this.linkingSystem.__audioHoverAuthorityBound = true;
        }
        if (this.linkingSystem?.onNodeHoverEnd && !this.linkingSystem.__audioHoverExitAuthorityBound) {
            const playHoverExitAudio = () => {
                if (!this.audioSystem) return;
                if (this.audioSystem.enabled === false) return;
                if (!this.audioSystem.initialized) return;
                this.audioSystem.playHoverExit?.();
            };

            this.linkingSystem.onNodeHoverEnd(() => playHoverExitAudio());
            this.linkingSystem.__audioHoverExitAuthorityBound = true;
        }
        if (this.linkingSystem?.onPrimaryNodeSet && !this.linkingSystem.__audioPrimarySetAuthorityBound) {
            const playPrimarySetAudio = () => {
                if (!this.audioSystem) return;
                if (this.audioSystem.enabled === false) return;
                const play = () => {
                    if (!this.audioSystem?.initialized) return;
                    this.audioSystem.playPrimaryNodeSet?.();
                };
                if (this.audioSystem.initialized) {
                    play();
                    return;
                }
                this.ensureAudioStarted?.()
                    .then(() => play())
                    .catch(() => {});
            };

            this.linkingSystem.onPrimaryNodeSet(() => playPrimarySetAudio());
            this.linkingSystem.__audioPrimarySetAuthorityBound = true;
        }
        if (this.linkingSystem?.onInvalidLinkAttempt && !this.linkingSystem.__audioInvalidLinkAuthorityBound) {
            const playInvalidLinkAudio = () => {
                if (!this.audioSystem) return;
                if (this.audioSystem.enabled === false) return;
                const play = () => {
                    if (!this.audioSystem?.initialized) return;
                    this.audioSystem.playInvalidLinkAttempt?.();
                };
                if (this.audioSystem.initialized) {
                    play();
                    return;
                }
                this.ensureAudioStarted?.()
                    .then(() => play())
                    .catch(() => {});
            };

            this.linkingSystem.onInvalidLinkAttempt(() => playInvalidLinkAudio());
            this.linkingSystem.__audioInvalidLinkAuthorityBound = true;
        }
        if (this.linkingSystem?.registerLinkCreatedCallback && !this.linkingSystem.__audioLinkAuthorityBound) {
            const playLinkAudio = () => {
                if (!this.audioSystem) return;
                if (this.audioSystem.enabled === false) return;
                const play = () => {
                    if (!this.audioSystem?.initialized) return;
                    this.audioSystem.playLinkBroken?.();
                };
                if (this.audioSystem.initialized) {
                    play();
                    return;
                }
                this.ensureAudioStarted?.()
                    .then(() => play())
                    .catch(() => {});
            };

            this.linkingSystem.registerLinkRemovedCallback(() => playLinkAudio(), {
                layerKey: 'LINK_IMPACTS',
                immediate: true
            });
            this.linkingSystem.__audioLinkAuthorityBound = true;
        }
        const hasCascadeBridgeCallback = Array.isArray(this.linkingSystem?.linkCreatedCallbacks)
            && this.linkingSystem.linkCreatedCallbacks.some((callback) => callback?.__linkWorkLayer === 'LINK_CASCADE');
        if (this.linkingSystem?.registerLinkCreatedCallback && (!this.linkingSystem.__tripleCascadeVisualBridgeBound || !hasCascadeBridgeCallback)) {
            this.linkingSystem.registerLinkCreatedCallback(timeLinkCreateCallback('LINK_CASCADE cascade bridge', (sourceNode, targetNode, link) => {
                if (!this.semanticBus?.emit || !sourceNode || !targetNode) return;

                const sourcePos = sourceNode.position || sourceNode.userData?.position || null;
                const targetPos = targetNode.position || targetNode.userData?.position || null;
                const hasValidSourcePos =
                    sourcePos &&
                    Number.isFinite(Number(sourcePos.x)) &&
                    Number.isFinite(Number(sourcePos.y)) &&
                    Number.isFinite(Number(sourcePos.z));
                const hasValidTargetPos =
                    targetPos &&
                    Number.isFinite(Number(targetPos.x)) &&
                    Number.isFinite(Number(targetPos.y)) &&
                    Number.isFinite(Number(targetPos.z));
                const midpoint = hasValidSourcePos && hasValidTargetPos
                    ? {
                        x: (Number(sourcePos.x) + Number(targetPos.x)) * 0.5,
                        y: (Number(sourcePos.y) + Number(targetPos.y)) * 0.5,
                        z: (Number(sourcePos.z) + Number(targetPos.z)) * 0.5
                    }
                    : (hasValidSourcePos ? {
                        x: Number(sourcePos.x),
                        y: Number(sourcePos.y),
                        z: Number(sourcePos.z)
                    } : (hasValidTargetPos ? {
                        x: Number(targetPos.x),
                        y: Number(targetPos.y),
                        z: Number(targetPos.z)
                    } : null));

                const sourceIntensity = Number(
                    sourceNode.userData?.metrics?.synergy ??
                    sourceNode.userData?.synergy ??
                    sourceNode.userData?.harmony ??
                    0
                );
                const targetIntensity = Number(
                    targetNode.userData?.metrics?.synergy ??
                    targetNode.userData?.synergy ??
                    targetNode.userData?.harmony ??
                    0
                );
                const sourceHarmony = Number(sourceNode.userData?.metrics?.harmony ?? sourceNode.userData?.harmony ?? 0);
                const targetHarmony = Number(targetNode.userData?.metrics?.harmony ?? targetNode.userData?.harmony ?? 0);
                const phaseSyncStrength = Math.max(0, Math.min(1, Number.isFinite((sourceIntensity + targetIntensity) * 0.5)
                    ? (sourceIntensity + targetIntensity) * 0.5
                    : 0));
                const phaseSyncStability = Math.max(0, Math.min(1, Number.isFinite((sourceHarmony + targetHarmony) * 0.5)
                    ? (sourceHarmony + targetHarmony) * 0.5
                    : 0));
                const intensity = Math.max(
                    0.18,
                    Math.min(0.85, Number.isFinite((sourceIntensity + targetIntensity) * 0.5)
                        ? (sourceIntensity + targetIntensity) * 0.5
                        : 0.25)
                );
                const cascadeId = sourceNode.userData?.nodeId && targetNode.userData?.nodeId
                    ? `link-${sourceNode.userData.nodeId}-${targetNode.userData.nodeId}`
                    : `link-${sourceNode.uuid || sourceNode.id || 'source'}-${targetNode.uuid || targetNode.id || 'target'}`;
                const payload = {
                    id: cascadeId,
                    cascadeId,
                    link,
                    linkRef: link,
                    linkId: link?.id ?? link?.userData?.id ?? link?.uuid ?? null,
                    sourceNode,
                    targetNode,
                    source: sourceNode.userData?.nodeId ?? sourceNode.id ?? sourceNode.uuid ?? null,
                    target: targetNode.userData?.nodeId ?? targetNode.id ?? targetNode.uuid ?? null,
                    sourceNodeId: sourceNode.userData?.nodeId ?? sourceNode.id ?? sourceNode.uuid ?? null,
                    targetNodeId: targetNode.userData?.nodeId ?? targetNode.id ?? targetNode.uuid ?? null,
                    sourcePosition: sourcePos ? { x: sourcePos.x, y: sourcePos.y, z: sourcePos.z } : null,
                    targetPosition: targetPos ? { x: targetPos.x, y: targetPos.y, z: targetPos.z } : null,
                    center: midpoint,
                    anchor: midpoint,
                    position: null,
                    origin: null,
                    phaseSyncStrength,
                    phaseSyncStability,
                    intensity,
                    value: intensity,
                    hopIndex: 0
                };
                const priority = this.semanticBus.priority?.CRITICAL ?? this.semanticBus.priority?.INTERACTIVE ?? this.semanticBus.priority?.NORMAL;
                const immediatePolicy = {
                    aggregateWithinMs: 0,
                    cooldownMs: 0,
                    aggregationStrategy: 'latest'
                };
                this.cascadeVisualizer?._handleLinkCreated?.(payload);
                if (link?.userData) {
                    link.userData.__cascadeBirthSeeded = true;
                    link.userData.__cascadeBirthSeededAt = performance.now();
                }
                payload.__cascadeDirectRendered = true;
                if (typeof this.semanticBus.emitImmediate === 'function') {
                    this.semanticBus.emitImmediate('cascade.start', payload, { priority });
                    this.semanticBus.emitImmediate('cascade.hop', payload, { priority });
                } else {
                    this.semanticBus.emit('cascade.start', payload, { priority, policy: immediatePolicy });
                    this.semanticBus.emit('cascade.hop', payload, { priority, policy: immediatePolicy });
                }
            }), {
                layerKey: 'LINK_CASCADE',
                immediate: true
            });
            this.linkingSystem.__tripleCascadeVisualBridgeBound = true;
        }
        if (this.linkingSystem?.registerLinkRemovedCallback && !this.linkingSystem.__visualOrphanCleanupBound) {
            this.linkingSystem.registerLinkRemovedCallback((sourceNode, targetNode, link) => {
                const linkId = link?.userData?.id ?? link?.id ?? link?.uuid ?? null;
                const pictogramSystem =
                    this.linkingSystem?.conduitRenderer?.pictogramSystem ||
                    this.linkSemanticPictograms ||
                    this.linkPictogramSystem;
                pictogramSystem?.clearLinkBetweenNodes?.(sourceNode, targetNode, { immediate: true });
                this.linkSemanticPictograms?.fusionZoneManager?.clearLink?.(link, { immediate: true });
                if (linkId) {
                    this.linkedGlyphMessaging?.unregisterLink?.(linkId);
                }
                this.cascadeVisualizer?.clearLink?.(link ?? linkId, sourceNode, targetNode);
                this.resonanceCascadeVisualization?.handleCascadeEnd?.({
                    sourceNode,
                    targetNode,
                    link,
                    linkId,
                    sourceNodeId: sourceNode?.userData?.nodeId ?? sourceNode?.id ?? sourceNode?.uuid ?? null,
                    targetNodeId: targetNode?.userData?.nodeId ?? targetNode?.id ?? targetNode?.uuid ?? null
                });
                this.corruptionFeedback?.clearEffectsForNodes?.([sourceNode, targetNode]);

                if (this.glyphLayer4 && (sourceNode || targetNode)) {
                    const reconcileAmbientGlyphs = () => {
                        this.glyphLayer4?.reconcileAmbientOrbitGlyphs?.([sourceNode, targetNode].filter(Boolean));
                    };
                    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                        window.requestAnimationFrame(reconcileAmbientGlyphs);
                    } else {
                        setTimeout(reconcileAmbientGlyphs, 0);
                    }
                }
            });
            this.linkingSystem.__visualOrphanCleanupBound = true;
        }
        if (this.linkingSystem?.conduitRenderer) {
            this.linkingSystem.conduitRenderer.waveShaderBridge =
                window.ATOMA_FLAGS?.release?.disableWaveShaderStack === true
                    ? null
                    : (this.waveShaderBridge || this.linkingSystem.conduitRenderer.waveShaderBridge);
            this.linkingSystem.conduitRenderer.waveTravelShaderPack =
                window.ATOMA_FLAGS?.release?.disableWaveShaderStack === true
                    ? null
                    : (this.waveTravelShaderPack || this.linkingSystem.conduitRenderer.waveTravelShaderPack);
            this.linkingSystem.conduitRenderer.waveDynamicsShaderPack =
                window.ATOMA_FLAGS?.release?.disableWaveShaderStack === true
                    ? null
                    : (this.waveDynamicsShaderPack || this.linkingSystem.conduitRenderer.waveDynamicsShaderPack);
            this.linkingSystem.conduitRenderer.setTravelingWaveFX?.(this.synergyTravelingWaveFX);
        }
        const enableSynergyHighway3D = window?.ATOMA_FLAGS?.visual?.synergyHighway3D ?? true;
        if (enableSynergyHighway3D) {
            this.synergyHighwayVisuals3D = SynergyHighwayVisuals3D_1_0;
            this.synergyHighwayVisuals3D.init(this.scene, this.camera, this.renderer, this.linkingSystem, this.aiNodes);
            window.SynergyHighwayVisuals3D_1_0 = this.synergyHighwayVisuals3D;
            this.linkingSystem.registerLinkCreatedCallback?.(() => this.synergyHighwayVisuals3D?.scheduleRebuild?.(), {
                layerKey: 'LINK_GLOW'
            });
            this.linkingSystem.registerLinkRemovedCallback?.(() => this.synergyHighwayVisuals3D?.scheduleRebuild?.(), {
                layerKey: 'LINK_GLOW'
            });
            this.synergyHighwayVisuals3D.refreshFromHighways?.();
            window.__ATOMA_SYNERGY_HIGHWAY_VISUALS__ = this.synergyHighwayVisuals3D;
            this._synergyHighwayRefreshAcc = 0;
        } else {
            this.synergyHighwayVisuals3D = null;
        }
        console.log('[main.js] NodeLinkingSystem created');

        // Corruption transmission gameplay system (non-visual)
        const corruptionTransmission = new LinkCorruptionTransmission_v1(
            this.aiNodes,
            this.linkingSystem,
            false,
            this.semanticBus
        );
        this.corruptionTransmission = corruptionTransmission;
        this.corruptionTransmission.setEventBus?.(this.semanticBus);
        this.aiNodes.linkCorruption = corruptionTransmission;
        if (typeof window !== 'undefined') {
            window.__PIC_SYSTEM__ = this.linkingSystem?.conduitRenderer?.pictogramSystem;
            if (window.__PIC_SYSTEM__) {
                this.linkSemanticPictograms = window.__PIC_SYSTEM__;
                this.linkPictogramSystem = window.__PIC_SYSTEM__;
            }
        }
        // Initialize recursive glyph signal system once linking system is available
        this.setupRecursiveGlyphSignalSystem();
        if (this.frameScheduler) {
            this.frameScheduler.register(
                'visual',
                (dt) => {
                    if (this.linkingSystem && this.linkingSystem.isReady === true) {
                        this.linkingSystem.update(dt, this.time);
                    }
                },
                'visual.linkingSystem'
            );
            this.frameScheduler.register('visual', (dt) => {
                if (this.standingWaveRenderer) {
                    if (this.activeLinkCount === 0) return;
                    this.standingWaveRenderer.update(dt, this.time);
                }
            }, 'visual.waveStandingRenderer');
            this.frameScheduler.register(
                'simulation',
                (dt) => this.linkingSystem?.runSimulationMaintenance?.(dt),
                'simulation.linkingSystem.metrics'
            );
            // Corruption transmission (gameplay) — 10 Hz simulation lane
            // Avoid duplicate ticking when canonical simulation.linkCorruptionTransmission is already registered.
            if (this.aiNodes?.linkCorruption && this.frameScheduler?.isRegistered?.('simulation.linkCorruptionTransmission') !== true) {
            this.frameScheduler.register(
                'simulation',
                (dt) => {
                    const sys = this.aiNodes?.linkCorruption;
                    if (this.activeLinkCount === 0) return;
                    if (sys?.updateTransmission) {
                        sys.updateTransmission(dt);
                    }
                    },
                    'simulation.corruptionTransmission'
                );
            }
            this.frameScheduler.register(
                'simulation',
                (dt) => {
                    this.multiNetworkManager?.update?.(dt);
                    this.corruptionBridge?.update?.(dt);
                },
                'simulation.corruptionBridge'
            );
            this.frameScheduler.register(
                'visual',
                (dt) => {
                    if (!this.corruptionVisualFX?.applyCorruptionEffects || !this.aiNodes?.nodes) return;
                    if (this.activeLinkCount === 0) return;
                    const time = this.time ?? performance.now();
                    for (const node of this.aiNodes.nodes) {
                        const visualTarget = node?.traverse ? node : (node?.mesh || node);
                        const corruptionLevel =
                            node?.userData?.metrics?.corruption ??
                            node?.userData?.metrics?.corruption ??
                            node?.userData?.corruption ??
                            0;
                        const isNodeVisual = visualTarget?.userData?.isNode === true ||
                                     visualTarget?.userData?.isNodeRoot === true ||
                                     visualTarget?.userData?.isNodeCore === true ||
                                     visualTarget?.userData?.visualLayer === 'NODE_ROOT' ||
                                     visualTarget?.userData?.visualLayer === 'CORE';

                if (corruptionLevel > 0 && isNodeVisual) {
                    if (this.activeLinkCount === 0) return;
                    this.corruptionVisualFX.applyCorruptionEffects(
                        visualTarget,
                        dt,
                        time
                    );
                } else if (this.corruptionVisualFX?.restoreNodeVisualBaseline && isNodeVisual) {
                    this.corruptionVisualFX.restoreNodeVisualBaseline(visualTarget);
                }
                    }
                },
                'visual.nodeCorruptionFX'
            );
        }
        if (this.frameScheduler && this.linkingSystem?.processNodeTargeting) {
            this.frameScheduler.register('visual', () => this.linkingSystem.processNodeTargeting(), 'node.targeting');
        }
        this.frameScheduler.register('visual', (dt) => this.runRenderTick(dt), 'renderer.render');
        if (this.recursiveGlyphSignalSystem) {
            this.recursiveGlyphSignalSystem.setLinkingSystem(this.linkingSystem);
        }

        // Minimal multi-network scaffolding (single-network registration)
        this.multiNetworkManager = new PHASE5_MultiNetworkManager();
        this.multiNetworkManager.frameScheduler = this.frameScheduler;
        this.multiNetworkManager.registerNetwork(
            'world',
            { aiNodes: this.aiNodes, linkingSystem: this.linkingSystem },
            { name: 'PrimaryNetwork', metrics: {} }
        );

        this.corruptionBridge = new PHASE5_CorruptionBridge(this.multiNetworkManager);
        this.corruptionBridge.frameScheduler = this.frameScheduler;
        this.corruptionBridge.setEventBus?.(this.semanticBus);

        // Corruption feedback visuals are owned by tier4GameplayIntegration.visuals.
        this.corruptionFeedback = null;
        this.corruptionVisualFX = new CorruptionVisualFX_v1(this.scene, this.aiNodes, false);
        this.corruptionVisualFX.setEventBus?.(this.semanticBus);

        // Listen for corruption threshold events
        this._multiNetworkThresholdListener = (event) => {
            if (event?.type === 'corruptionThresholdCrossed') {
                const node = event.node;
                if (!node || !node.position) return;

                if (this.corruptionFeedback?.displayCascadeWarning) {
                    this.corruptionFeedback.displayCascadeWarning(node);
                }

                if (this.corruptionFeedback?.displayCorruptionSeed) {
                    this.corruptionFeedback.displayCorruptionSeed(node);
                }

                if (this.cascadePropagationVisuals?.triggerCascade) {
                    this.cascadePropagationVisuals.triggerCascade({
                        sourceNodeId: node.id,
                        sourcePosition: node.position,
                        cascadeType: 'corruption',
                        cascadeStrength: event.value ?? 1,
                        depth: 0,
                        targetNodes: []
                    });
                }
            }
        };
        this.multiNetworkManager.on(this._multiNetworkThresholdListener);

        // VFX runtime loader (opt-in)
        this.vfxLoader = new VFXRuntimeLoader({
            frameScheduler: this.frameScheduler,
            scene: this.scene,
            vfxRoot: this.vfxRoot,
            world: this.worldRoot,
            aiNodes: this.aiNodes,
            linkingSystem: this.linkingSystem,
            camera: this.camera,
            renderer: this.renderer,
            config: {
                disableOnWorldSwitch: true,
                maxEnabled: 12,
                minEnableIntervalMs: 200
            }
        });
        VFX_SYSTEMS.forEach((def) => this.vfxLoader.register(def));
        this.vfxLoader.attachToScheduler();
        installVFXConsoleAPI(this.vfxLoader);

        // One-time shader warm-up for archetype visuals to avoid first-spawn GPU stalls
        if (
            typeof window !== 'undefined' &&
            window.__shaderWarmupDone !== true &&
            window.__ATOMA_WARMUP_COMPLETE !== true
        ) {
            logPrograms('pre-warmup', this.renderer);
            warmUpArchetypeShaders(this.renderer, {
                waveShaderBridge: window.ATOMA_FLAGS?.release?.disableWaveShaderStack === true ? null : this.waveShaderBridge,
                waveShaderMaterialPatch: window.ATOMA_FLAGS?.release?.disableWaveShaderStack === true ? null : this.waveShaderMaterialPatch,
                waveTravelShaderPack: window.ATOMA_FLAGS?.release?.disableWaveShaderStack === true ? null : this.waveTravelShaderPack,
                waveDynamicsShaderPack: window.ATOMA_FLAGS?.release?.disableWaveShaderStack === true ? null : this.waveDynamicsShaderPack
            });
            logPrograms('post-warmup', this.renderer);
        }
        const nodeCount = this.currentMode === 'chamber' ? 12 : 15;
        this.aiNodes.createNodes(this.currentMode, nodeCount);
        if (window.ATOMA_FLAGS?.debug?.probeSpawn) {
            console.log('[SPAWN_PROBE] mode=', this.currentMode,
                'requested=', nodeCount,
                'created=', this.aiNodes?.nodes?.length);
        }
        // Rebind category legend to fresh aiNodes instance and sync counts
        if (this.categoryLegend) {
            this.categoryLegend.unbind?.();
            this.categoryLegend.bind(this.aiNodes);
        }
        // Enable runtime spawning after init batch
        this.aiNodes.armRuntimeSpawningAfterInit?.(Date.now());

        // Wave shader stack is release-contained for demo; keep baseline link rendering only.

        // Hook audio feedback to link events
        const originalCreateLink = this.linkingSystem.createLink.bind(this.linkingSystem);
        this.linkingSystem.createLink = (sourceNode, targetNode) => {
            const result = originalCreateLink(sourceNode, targetNode);
            if (result) {
                // ALPHA CLARITY: first-link hint
                if (this.gameplayHintLayer && !this._hintFirstLinkShown) {
                    this._hintFirstLinkShown = true;
                    if (this.firstRunGuidanceDirector?.isActive?.()) {
                        this.firstRunGuidanceDirector.handleFirstBond({
                            world: this.currentMode,
                            scoreState: this.visualNetworkTimeElasticity?.getScoreState?.() || null,
                            buildState: this.coreMetricsOverlay?.hud?.getCurrentBuildState?.(
                                this.visualNetworkTimeElasticity?.getScoreState?.() || null
                            ) || null
                        });
                    } else {
                        this.gameplayHintLayer.show('firstLink', { world: this.currentMode });
                    }
                }

                const fanoutLink = () => {
                    if (!this.linkingSystem?.links?.includes(result)) {
                        return;
                    }

                    // Defer heavy per-link visuals out of the createLink call stack.
                    if (!this.linkSparkSystems) {
                        this.linkSparkSystems = new Map();
                    }
                    if (this.linkSparkSystems) {
                        const sparkSystem = new LinkSparkSystem(this.scene, 60);
                        const mesh = sparkSystem.getMesh();
                        this.scene.add(mesh);
                        this.linkSparkSystems.set(result.userData.id, sparkSystem);
                        console.log('[main.js] LinkSparkSystem created for link:', result.userData.id);
                    }

                    this.linkAuraSystem?.registerLink?.(result);
                };
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(fanoutLink);
                } else {
                    setTimeout(fanoutLink, 0);
                }
            }

            // LinkTrailEmitter creation moved to LinkRendererConduit (eliminates race condition)
            // See: LinkRendererConduit.createLinkVisuals()


            // Link creation semantic event is emitted by NodeLinkingSystem (canonical: link.created)
            if (this.semanticBus && result) {
                const sourceId = sourceNode?.userData?.nodeId || sourceNode?.id || sourceNode?.uuid;
                const targetId = targetNode?.userData?.nodeId || targetNode?.id || targetNode?.uuid;
                const linkId = result?.userData?.id || result?.id;
                const timestamp = performance.now();

                const synergyScore = result?.userData?.synergy?.score;
                if (Number.isFinite(synergyScore) && synergyScore >= 0.75) {
                    this.semanticBus.emit('link:synergyThreshold', {
                        sourceId,
                        targetId,
                        linkId,
                        value: synergyScore,
                        threshold: 0.75,
                        timestamp
                    }, { priority: this.semanticBus.priority.NORMAL });
                }

                const sourceHarmony = sourceNode?.userData?.metrics?.harmony;
                const targetHarmony = targetNode?.userData?.metrics?.harmony;
                if (Number.isFinite(sourceHarmony) && Number.isFinite(targetHarmony)) {
                    const harmonicValue = (sourceHarmony + targetHarmony) * 0.5;
                    if (harmonicValue >= 0.8) {
                        this.semanticBus.emit('link:harmonicLock', {
                            sourceId,
                            targetId,
                            linkId,
                            value: harmonicValue,
                            threshold: 0.8,
                            timestamp
                        }, { priority: this.semanticBus.priority.NORMAL });
                    }
                }
            }
            return result;
        };
        
        const originalRemoveLink = this.linkingSystem.removeLink.bind(this.linkingSystem);
        this.linkingSystem.removeLink = (link) => {
            if (this.linkAuraSystem) {
                this.linkAuraSystem.unregisterLink?.(link);
            }
            const result = originalRemoveLink(link);
            const linkId = link?.userData?.id ?? link?.id ?? link?.uuid ?? null;
            // REMOVED: Memory trails cleanup - moved to LEGACY/GRAVEYARD (2026-04-05)
            // Cleanup LinkSparkSystem
            if (this.linkSparkSystems && link?.userData?.id !== undefined) {
                const sparkSystem = this.linkSparkSystems.get(link.userData.id);
                if (sparkSystem) {
                    sparkSystem.dispose();
                    this.linkSparkSystems.delete(link.userData.id);
                }
            }
            if (linkId) {
                this.linkedGlyphMessaging?.unregisterLink?.(linkId);
            }
            this.standingWaveTrapSystem?.clearLink?.(link ?? linkId);
            this.standingWaveRenderer?.clearLink?.(link ?? linkId, link?.source ?? null, link?.target ?? null);
            this.linkResonanceFlowSystem?.clearLink?.(link ?? linkId);
            this.linkSemanticPictograms?.clearLink?.(link ?? linkId);
            this.linkRendererConduit?.clearLinkAuxVisuals?.(link ?? linkId);
            this.cascadeVisualizer?.clearLink?.(link ?? linkId, link?.source ?? null, link?.target ?? null);
            this.resonanceCascadeVisualization?.clearLink?.(link ?? linkId, link?.source ?? null, link?.target ?? null);
            this.resonanceCascadeVisualization?.handleCascadeEnd?.({
                sourceNode: link?.source ?? null,
                targetNode: link?.target ?? null,
                link,
                linkId,
                sourceNodeId: link?.source?.userData?.nodeId ?? link?.source?.id ?? link?.source?.uuid ?? null,
                targetNodeId: link?.target?.userData?.nodeId ?? link?.target?.id ?? link?.target?.uuid ?? null
            });
            // LinkTrailEmitter cleanup moved to LinkRendererConduit
            // See: LinkRendererConduit.disposeLinkVisuals()
            // Emit network.link.destroyed event for event-driven systems
            if (this.semanticBus && result) {
                this.semanticBus.emit('network.link.destroyed', {
                    linkId: link.userData.id,
                    sourceNodeId: link.userData.sourceId,
                    targetNodeId: link.userData.targetId,
                    timestamp: performance.now()
                }, { priority: this.semanticBus.priority.INTERACTIVE });
            }
            return result;
        };
        
        console.log('✓ Audio feedback hooked to link creation/removal');
        
        // [Session 144+] Initialize Node Linked Aura System (ENABLED)
        this.nodeAuraSystem = new NodeLinkedAuraSystem(
            this.scene,
            this.linkingSystem,
            { enabled: true }  // Feature flag - enabled by default
        );
        this.nodeAuraSystem.setEventBus?.(this.semanticBus);
        // REMOVED: CorruptionDrivenAuraDesaturationSystem — moved to LEGACY/april (2026-04-22)
        
        // Wire orchestrator to linking system for effect registration
        this.linkingSystem.effectOrchestrator = this.effectOrchestrator;
        
        // Wire orchestrator to AINodes for materialization effects
        this.aiNodes.effectOrchestrator = this.effectOrchestrator;

        // ============================================================================
        // PHASE 1 LINK SYSTEMS REACTIVATION (Session 107+)
        // Infrastructure recovery: LinkCorrelationEngine + Hardening + History
        // ============================================================================
        
        // === System 1: Link History Tracker 1.0 (LOW RISK) ===
        try {
            this.linkHistoryTracker = new LinkHistoryTracker1_0(this.linkingSystem, this.scene, {
                enabled: true,
                bufferSize: 100,
                trackQualityChanges: true,
                trackPriorityChanges: true,
                trackCorruptionChanges: true
            });
            console.log('[main.js] LinkHistoryTracker1_0 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkHistoryTracker1_0 initialization failed:', err.message);
            this.linkHistoryTracker = null;
        }

        // === System 2: Link Correlation Engine 1.0 (LOW RISK) ===
        try {
            this.linkCorrelationEngine = new LinkCorrelationEngine1_0(
                this.linkingSystem,
                this.linkHistoryTracker,
                {
                    tickIntervalMs: 3000,              // Run analysis every 3 seconds
                    maxWorkPerTickMs: 1.0,             // Limit to 1ms per frame
                    minSamplesForCorrelation: 5,       // Need 5+ samples before correlating
                    correlationMethod: 'pearson',      // Pearson correlation (standard)
                    minCorrelationScore: 0.15,         // Only report correlations > 0.15
                    minClusterSize: 2,                 // Clusters must have 2+ links
                    enabled: true
                }
            );
            console.log('[main.js] LinkCorrelationEngine1_0 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkCorrelationEngine1_0 initialization failed:', err.message);
            this.linkCorrelationEngine = null;
        }


        // REMOVED: LinkEligibilityGate_v1 - moved to LEGACY/GRAVEYARD (2026-04-05)
        // REMOVED: LINK DEBUG MODE v1.0 - moved to LEGACY (2026-04-03)
        /*
        try {
            this.linkDebugMode = setupLinkDebugMode({
                scene: this.scene,
                linkingSystem: this.linkingSystem,
                eligibilityGate: this.linkEligibilityGate,
                enabled: false  // Set to true to enable debug visualization
            });
            console.log('[main.js] LinkDebugMode initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkDebugMode initialization failed:', err);
        }
        */

        // ====================================================================
        // LEGACY/april — DynamicLinkColorSystem disconnected 2026-04-22 (all helpers are no-ops)
        // this.dynamicLinkColorSystem = new DynamicLinkColorSystem(this.linkingSystem);

        // REMOVED: AnimatedLinkFlow console API setup — moved to LEGACY/april (2026-04-22)

        // ====================================================================
        // SYNERGY CASCADE PROPAGATION VISUALIZER v1.0 (NEW)
        // Real-time visualization of synergy energy flowing through networks
        // ====================================================================
        try {
            this.cascadeVisualizer = new SynergyCascadeVisualizer(
                this.scene,
                this.linkingSystem,
                this.camera
            );
            this.cascadeVisualizer.frameScheduler = this.frameScheduler;
            
            // Configure cascade properties
            this.cascadeVisualizer.config.detectionThreshold = 0.7;
            this.cascadeVisualizer.config.propagationSpeed = 2.0;
            this.cascadeVisualizer.config.particleCount = 12;
            
            console.log('[main.js] SynergyCascadeVisualizer initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynergyCascadeVisualizer initialization failed:', err);
            this.cascadeVisualizer = null;
        }

        // ====================================================================
        // HIT PROXY SYSTEM v1.0 (Session 61+)
        // Strict raycast proxy architecture — PHASE 1 PRIMARY SYSTEM
        // Invisible hit-proxies for ALL nodes, real visuals 100% protected
        // ====================================================================
        try {
            const hitProxyResult = applyHitProxyIntegration(
                this.scene,
                this.aiNodes,
                this.linkingSystem,
                { proxyRadius: 0.7, layer: 10, autoSync: true }
            );
            this.hitProxySystem = hitProxyResult.hitProxySystem;
            setupHitProxyDebugAPI();
            console.log('[main.js] ✅ Hit Proxy System v1.0 initialized (Phase 1)');
            console.log(`[main.js] Created ${this.aiNodes.nodes.length} hit-proxy spheres`);
        } catch (err) {
            console.error('[main.js] Hit Proxy System initialization failed:', err);
        }

        // Raycast isolation/failsafe systems removed (handled by consolidated sanitization/registry)

        // ====================================================================
        // HIT-PROXY AUTO-REGISTRAR v1.0 (SESSION 62B - FPS Death Prevention)
        // Ensures every spawned node gets a valid hit-proxy automatically
        // Prevents FPS death from missing/invalid proxies triggering failsafe
        // ====================================================================
        try {
            const hitProxyAutoRegistrar = setupHitProxyAutoRegistrar(this);
            this.hitProxyAutoRegistrar = hitProxyAutoRegistrar;
            console.log('[main.js] ✅ Hit-Proxy Auto-Registrar initialized (Session 62B)');
        } catch (err) {
            console.warn('[main.js] Hit-Proxy Auto-Registrar initialization warning:', err);
        }
        
        // ====================================================================
        // INTEGRATION NODE SELECTION FIX v1.0 (Targeted Compatibility)
        // Enable INTEGRATION nodes to be selected via parent chain resolution
        // ====================================================================
        try {
            patchIntegrationNodeSelection(this.linkingSystem, this.aiNodes);
            setupIntegrationDebugAPI(this.aiNodes);
            console.log('[main.js] INTEGRATION Node Selection Fix applied ✓');
        } catch (err) {
            console.warn('[main.js] INTEGRATION Node Selection Fix failed:', err);
        }
        // REMOVED (2026-03-27): HologramShellAuthoritySystem - moved to LEGACY/LOCK and POLICIES to delete
        // REMOVED (2026-03-27): NodeShellSizeAuthority - moved to LEGACY/LOCK and POLICIES to delete
        
        // ====================================================================
        // VISUAL INTERACTION ISOLATION PATCH v2.0 - CRITICAL FIX (SESSION 46)
        // Uses intersection filtering instead of raycast disabling
        // NO MORE THREE.JS TypeError: r.raycast is not a function
        // ====================================================================
        try {
            this.interactionIsolation = setupVisualInteractionIsolation_v2(
                this.scene,
                this.aiNodes,
                {
                    enabled: true,
                    interactionLayer: 10,
                    debugMode: false,
                    autoProxyRadius: 0.6
                }
            );
            
            // Setup filtering helper for selection systems
            this.raycastFilter = setupRaycastInteractionFiltering(this.interactionIsolation);
            
            console.log('[main.js] Visual Interaction Isolation Patch v2.0 applied ✓');
            console.log('[main.js] ⚠️  CRITICAL: Update raycaster calls with filtering!');
        } catch (err) {
            console.warn('[main.js] Visual Interaction Isolation Patch v2.0 failed:', err.message);
        }
        // REMOVED (2026-03-27): NodeCoreMaterialAuthority - moved to LEGACY/LOCK and POLICIES to delete
        
        // ====================================================================
        // EVENT VISUAL SUPPRESSION SYSTEM v1.0 (Session 26) - DEACTIVATED
        // Suppression disabled per user request - opacity multipliers and suppressed flags removed
        // ====================================================================
        try {
            // DISABLED: No longer suppressing event visual effects
            // All suppression flags set to false to allow full opacity and visual fidelity
            this.eventVisualSuppression = null;
            
            // Register common event sources for monitoring - DISABLED
            // Suppress VFX effects for all nodes - DISABLED
            
            // Register post-spawn observer - DISABLED
            
            // Setup console API for debugging - DISABLED
            // window.debugEventSuppression = setupEventSuppressionConsoleAPI(this.eventVisualSuppression);
            
            console.log('[main.js] EventVisualSuppression DEACTIVATED ✓');
        } catch (err) {
            console.warn('[main.js] EventVisualSuppression deactivation handled:', err);
        }
        
        // ====================================================================
        // AURA MODULATION SYSTEM v1.0 (Session 27)
        // Receives redirected event intensity and applies modulation to auras
        // ====================================================================
        // ====================================================================
        // GLOBAL AURA OPACITY CLAMP v1.0 (Session 28)
        // Clamps all aura opacity to ≤ 0.10 after linking
        // ====================================================================
//        try {
//            this.globalAuraOpacityClamp = new GlobalAuraOpacityClamp();
//            setupGlobalAuraOpacityClampConsoleAPI(this.globalAuraOpacityClamp);
//            
//            // [TASK 1 FIX] Integrate with NodeLinkingSystem for automatic aura clamping on link creation
//           if (this.linkingSystem) {
//                integrateGlobalAuraOpacityClamp(this.linkingSystem, this.globalAuraOpacityClamp);
//                setupGlobalAuraOpacityClampIntegrationConsoleAPI(this.linkingSystem, this.globalAuraOpacityClamp);
//                console.log('[main.js] ✅ GlobalAuraOpacityClamp integrated with NodeLinkingSystem');
//            } else {
//                console.warn('[main.js] ⚠️ linkingSystem not available for GlobalAuraOpacityClamp integration');
//            }
//            
//            console.log('[main.js] GlobalAuraOpacityClamp initialized ✓');
//        } catch (err) {
//            console.warn('[main.js] GlobalAuraOpacityClamp initialization failed:', err);
//        }
        
        // ====================================================================
        // CORE MATERIAL MUTATION DETECTOR v1.0 (Session 28)
        // Automated detection and repair of core material mutations
        // ====================================================================
        try {
            this.coreMaterialMutationDetector = new CoreMaterialMutationDetector({
                debugEnabled: false,
                reportViolations: true,
                autoRepair: false,
                maxViolationsToReport: 100,
            });
            setupCoreMutationDetectorConsoleAPI(this.coreMaterialMutationDetector);
            
            // Register all node cores with detector
            if (this.aiNodes?.nodes) {
                for (const node of this.aiNodes.nodes) {
                    // Find core mesh (usually node.mesh itself or first child)
                    let core = node.mesh || node;
                    if (core && core.material) {
                        this.coreMaterialMutationDetector.registerCore(node, core);
                    }
                }
            }

            if (this.aiNodes?.registerPostSpawnObserver) {
                this.aiNodes.registerPostSpawnObserver(
                    'core-mutation-detector',
                    (newNode) => {
                        if (!newNode || !this.coreMaterialMutationDetector) return;
                        const core = newNode.mesh || newNode;
                        if (core && core.material) {
                            this.coreMaterialMutationDetector.registerCore(newNode, core);
                        }
                    },
                    50
                );
            }
            
            console.log('[main.js] CoreMaterialMutationDetector initialized ✓');
        } catch (err) {
            console.warn('[main.js] CoreMaterialMutationDetector initialization failed:', err);
        }
        
        // ====================================================================
        // CORE MATERIAL PROPERTY LOCK v1.0 - REMOVED (2026-03-27)
        // ====================================================================
        // Moved to LEGACY/LOCK and POLICIES to delete
        
        // Initialize Link Recommendation AI 1.0 (after linking system ready)
        this.linkRecommendationAI = new LinkRecommendationAI1_0(
            this.linkingSystem,
            this.linkCorrelationEngine || null,  // correlationEngine - now connected
            null, // priorityHistoryEngine (not yet implemented in main.js)
            null  // priorityDecayEngine (not yet implemented in main.js)
        );
        console.log('[main.js] LinkRecommendationAI1_0 initialized ✓');

        // Attach linkHistoryTracker for enhanced scoring
        if (this.linkHistoryTracker && this.linkRecommendationAI) {
            this.linkRecommendationAI.linkHistoryTracker = this.linkHistoryTracker;
        }

        // === Initialize PriorityHistoryEngine1_0 ===
        try {
            this.priorityHistoryEngine = new PriorityHistoryEngine1_0(this.linkingSystem, {
                maxHistoryPerNode: 100,
                stabilityWindow: 10,
                enabled: true
            });
            console.log('[main.js] PriorityHistoryEngine1_0 initialized ✓');
            // Attach to recommendation AI
            if (this.linkRecommendationAI) {
                this.linkRecommendationAI.priorityHistoryEngine = this.priorityHistoryEngine;
            }
        } catch (err) {
            console.warn('[main.js] PriorityHistoryEngine1_0 initialization failed:', err.message);
            this.priorityHistoryEngine = null;
        }

        // === Initialize LinkPriorityDecayEngine ===
        try {
            this.linkPriorityDecayEngine = new LinkPriorityDecayEngine(this.linkingSystem, {
                enableAgeBased: true,
                enableIdleBased: true,
                enableStalenessDetection: true,
                halfLifeMinutes: 30
            });
            console.log('[main.js] LinkPriorityDecayEngine initialized ✓');
            // Attach to recommendation AI
            if (this.linkRecommendationAI) {
                this.linkRecommendationAI.priorityDecayEngine = this.linkPriorityDecayEngine;
            }
        } catch (err) {
            console.warn('[main.js] LinkPriorityDecayEngine initialization failed:', err.message);
            this.linkPriorityDecayEngine = null;
        }

        // === Initialize LinkAutomationMonitor3_0 ===
        try {
            this.linkAutomationMonitor = new LinkAutomationMonitor3_0({
                enabled: true,
                acceptanceThresholdGood: 0.7,
                acceptanceThresholdOk: 0.5,
                minThreshold: 0.4,
                maxThreshold: 0.85,
                thresholdAdjustmentStep: 0.05
            });
            this.linkAutomationMonitor.init({
                LinkAutomationEngine1_0: null, // Will be set after engine initialization
                UserAcceptanceTracker1_0: null, // Optional
                LinkQualityFeedbackLoop1_0: null, // Optional
                LinkMLRecommendationEngine1_0: null // Optional
            });
            window.linkAutomationMonitor = this.linkAutomationMonitor;
            console.log('[main.js] LinkAutomationMonitor3_0 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkAutomationMonitor3_0 initialization failed:', err.message);
            this.linkAutomationMonitor = null;
        }

        // === Initialize LinkMLRecommendationEngine1_0 ===
        try {
            LinkMLRecommendationEngine1_0.init({
                LinkHistoryTracker1_0: this.linkHistoryTracker,
                ComputeSynergyScore2_0: computeSynergyScore,
                SynergyHighwayVisuals3D_1_0: this.synergyHighwayVisuals3D,
                NodeLinkingSystem: this.linkingSystem,
                AINodes: this.aiNodes,
                LinkAutomationMonitor3_0: this.linkAutomationMonitor,
            });
            this.linkMLRecommendationEngine = LinkMLRecommendationEngine1_0;
            console.log('[main.js] LinkMLRecommendationEngine1_0 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkMLRecommendationEngine1_0 initialization failed:', err.message);
            this.linkMLRecommendationEngine = null;
        }
        
        // Initialize Link Automation Engine 1.0 (after recommendation AI ready)
        this.linkAutomationEngine = new LinkAutomationEngine1_0(
            this.linkingSystem,
            this.linkRecommendationAI,
            {
                automationThreshold: 0.65,
                maxLinksPerCycle: 3,
                requireUserTrigger: true,
                safetyCooldownMs: 500,
                enabled: false
            }
        );
        console.log('[main.js] LinkAutomationEngine1_0 initialized ✓');

        // Update LinkAutomationMonitor with engine reference
        if (this.linkAutomationMonitor && this.linkAutomationMonitor.init) {
            this.linkAutomationMonitor.init({
                LinkAutomationEngine1_0: this.linkAutomationEngine,
                UserAcceptanceTracker1_0: null,
                LinkQualityFeedbackLoop1_0: null,
                LinkMLRecommendationEngine1_0: null
            });
        }

        // Initialize Link Quality Predictor 1.0 (link viability evaluation)
        this.linkQualityPredictor = new LinkQualityPredictor1_0(
            this.linkingSystem,
            computeSynergyScore,
            this.scene
        );
        console.log('[main.js] LinkQualityPredictor1_0 initialized ✓');
        
        // Integrate quality predictor with recommendation AI
        // (AI will use predictor to rank candidates)
        if (this.linkRecommendationAI && this.linkQualityPredictor) {
            this.linkRecommendationAI.linkQualityPredictor = this.linkQualityPredictor;
        }
        
        // Integrate quality predictor with automation engine
        // (Automation will filter poor-quality links)
        if (this.linkAutomationEngine && this.linkQualityPredictor) {
            this.linkAutomationEngine.linkQualityPredictor = this.linkQualityPredictor;
            this.linkQualityPredictor.setAutomationThreshold(65); // 65+ quality required
        }
        
        // Initialize Synergy Recommendation Debug HUD 1.0 (real-time monitoring)
        this.synergyDebugHUD = new SynergyRecommendationDebugHUD(
            this.linkRecommendationAI,
            this.linkAutomationEngine
        );
        console.log('[main.js] SynergyRecommendationDebugHUD1_0 initialized ✓');
        
        // Initialize Auto Link Feedback UI 1.0 (visual feedback for automation)
        this.autoLinkFeedbackUI = new AutoLinkFeedbackUI1_0(
            this.scene,
            this.neonLinkVisuals || null // Will use if available
        );
        
        // Register callback for link creation feedback
        if (this.linkAutomationEngine && this.autoLinkFeedbackUI) {
            this.linkAutomationEngine.registerOnAutoLinkCreated((sourceNode, targetNode, synergyScore) => {
                this.autoLinkFeedbackUI.registerOnAutoLink(sourceNode, targetNode, synergyScore);
            });
        }
        console.log('[main.js] AutoLinkFeedbackUI1_0 initialized ✓');
        
        // Connect UISelectedHUD to the new linkingSystem
        if (this.selectedHUD) {
            console.log('[main.js] ✓ selectedHUD exists, connecting to linkingSystem');
            this.selectedHUD.setLinkingSystem(this.linkingSystem);
            console.log('[main.js] ✓ HUD successfully connected to linkingSystem');
        } else {
            console.warn('[main.js] ⚠ selectedHUD not initialized! Getting fresh instance');
            this.selectedHUD = getSelectedHUD();
            this.selectedHUD.setLinkingSystem(this.linkingSystem);
            console.log('[main.js] ✓ HUD instance obtained and connected to linkingSystem');
        }

        // Initialize HUD Synchronization Patch 1.0 (single source of truth for HUD updates)
        // AFTER selectedHUD.setLinkingSystem() to ensure both parameters are ready
        this.selectedHUDSyncPatch = new SelectedHUDSyncPatch1_0(
            this.selectedHUD,
            this.linkingSystem
        );
        this.selectedHUDSyncPatch.init();
        console.log('[main.js] SelectedHUDSyncPatch1_0 initialized ✓');
        
        // ====================================================================
        // LINK PRIORITY DECAY ENGINE 1.0 INITIALIZATION (Session 27 Extended)
        // ====================================================================
        // Initialize 4 upstream dependency systems (in dependency order)
        
        // ===================================================================
        // [SESSION 88] LINK QUALITY CALCULATOR - Per-frame quality metrics
        // ===================================================================
        this.linkQualityCalculator = new LinkQualityCalculator(
            this.linkingSystem,
            this.nodeDynamics,
            {
                // Quality component weighting (sums to 1.0)
                structuralWeight: 0.22,          // Link geometry & validity
                harmonyWeight: 0.48,             // Node stability, harmony, and compatibility
                loadWeight: 0.15,                // Load pressure ratio
                corruptionWeight: 0.15,          // Corruption influence
                
                // Structural quality parameters
                baseStructuralScore: 80,
                maxLinkDistance: 50,
                distancePenaltyRate: 0.5,
                stalenessThreshold: 5000,
                
                // EMA smoothing (optional, disabled by default)
                enableEmaSmoothing: false,
                emasAlpha: 0.2
            }
        );
        this.linkQualityCalculator.frameScheduler = this.frameScheduler;
        this.linkQualityCalculator.semanticBus = this.semanticBus;
        if (this.activeRunIdentitySelection?.linkQualityProfile) {
            this.linkQualityCalculator.setRunIdentityProfile(this.activeRunIdentitySelection.linkQualityProfile);
        }
        if (this.frameScheduler) {
            this.frameScheduler.register('simulation', (dt) => {
                this.linkQualityCalculator?.update?.(dt);
            }, 'simulation.linkQualityCalculator');
        }
        console.log('[main.js] LinkQualityCalculator initialized ✓');

        // REMOVED: LinkQualityFeedbackLoop1_0 - moved to LEGACY/GRAVEYARD (2026-04-05)

        // ===================================================================
        // [SESSION 88] LINK DEGRADATION SYSTEM - Quality-based effect scaling
        // ===================================================================
        this.linkDegradationSystem = new LinkDegradationSystem(
            this.linkingSystem,
            this.linkQualityCalculator,
            {
                // Quality thresholds (aligned with LinkQualityCalculator levels)
                fullQualityThreshold: 80,        // 100% efficient
                degradedStartThreshold: 55,      // Degradation begins
                severeThreshold: 30,             // Heavy degradation
                criticalThreshold: 10,           // Near collapse
                
                // Visual effect scaling
                minVisualIntensity: 0.15,        // Don't go fully invisible
                minParticleEmission: 0.20,       // Some particles always
                
                // Load noise/jitter effects
                enableLoadNoise: true,
                maxLoadNoiseIntensity: 0.3,
                
                // Metrics contribution scaling
                enableMetricsScaling: true,
                minMetricsContribution: 0.1,
                
                // Degradation curve shaping
                enableExponentialFalloff: true,
                exponentialPower: 1.5
            }
        );
        console.log('[main.js] LinkDegradationSystem initialized ✓');

        // ===================================================================
        // [SESSION 88+] LINK COLLAPSE SYSTEM - Event-driven collapse arbiter
        // ===================================================================
        this.linkCollapseSystem = new LinkCollapseSystem(
            this.linkingSystem,
            this.linkQualityCalculator,
            this.linkDegradationSystem,
            {
                corruptionHighThreshold: 0.8,
                stabilityLowThreshold: 0.2,
                holdDurationMs: 5000,
                warningThreshold: 0.3,
                criticalThreshold: 0.7,
                collapseThreshold: 1.0,
                stressRecoveryRate: 0.35,
                enableVisualFeedback: true,
                debugMode: false,
                frameScheduler: this.frameScheduler,
                semanticBus: this.semanticBus,
                worldContextProvider: () => this._getCanonicalWorldContext(),
                // Global metrics provider — reads from __ATOMA_LIVE_METRICS__
                globalMetricsEnabled: true,
                globalCorruptionAccelerator: 1.5,
                globalStabilityAccelerator: 1.4,
            }
        );
        this.linkCollapseSystem.frameScheduler = this.frameScheduler;
        this.linkCollapseSystem.semanticBus = this.semanticBus;
        this.linkCollapseSystem.setEventBus?.(this.semanticBus);
        this.linkingSystem.linkCollapseSystem = this.linkCollapseSystem;
        if (this.visualSuperpack?.triggerSpectacle && typeof this.linkCollapseSystem.on === 'function') {
            this.linkCollapseSystem.on('warning', (link, state) => {
                this.visualSuperpack.triggerSpectacle('warning', { link, state, source: 'LinkCollapseSystem' });
            });
            this.linkCollapseSystem.on('critical', (link, state) => {
                this.visualSuperpack.triggerSpectacle('critical', { link, state, source: 'LinkCollapseSystem' });
            });
            this.linkCollapseSystem.on('collapse', (link, state) => {
                this.visualSuperpack.triggerSpectacle('collapse', { link, state, source: 'LinkCollapseSystem' });
            });
            this.linkCollapseSystem.on('recovery', (link, state) => {
                this.visualSuperpack.triggerSpectacle('recovery', { link, state, source: 'LinkCollapseSystem' });
            });
        }
        if (typeof window !== 'undefined') {
            window.linkCollapseSystem = this.linkCollapseSystem;
        }
        console.log('[main.js] LinkCollapseSystem initialized ✓');

        // ===================================================================
        // LINK COLLAPSE EVENT FX — Multi-phase visual/audio for link collapse
        // ===================================================================
        this.linkCollapseEventFX = new LinkCollapseEventFX(
            this.linkCollapseSystem,
            this.audioSystem,
            { semanticBus: this.semanticBus, debugMode: false }
        );
        this.linkCollapseEventFX.attach();
        if (typeof window !== 'undefined') {
            window.linkCollapseEventFX = this.linkCollapseEventFX;
        }
        validateLinkCollapseEventFX();
        console.log('[main.js] LinkCollapseEventFX initialized ✓');

        // ===================================================================
        // LEADERBOARD — Score calculation and persistence
        // ===================================================================
        this.leaderboard = new AtomaLeaderboard({
            maxEntries: 20,
            defaultPlayerName: 'OPERATOR',
        });
        if (typeof window !== 'undefined') {
            window.atomaLeaderboard = this.leaderboard;
        }
        validateAtomaLeaderboard();
        console.log('[main.js] AtomaLeaderboard initialized ✓');
        
        // REMOVED: ParticleEmissionScaler initialization — moved to LEGACY/april (2026-04-22)

        // Canonical semantic link metrics bridge (0-1 normalized)
        this.linkSemanticMetricsBridge = null;
        try {
            if (this.linkingSystem) {
                this.linkSemanticMetricsBridge = new LinkSemanticMetricsBridge_v1(this.linkingSystem);
            }
        } catch (err) {
            console.warn('[main.js] LinkSemanticMetricsBridge_v1 init failed:', err?.message || err);
            this.linkSemanticMetricsBridge = null;
        }

        this.linkCascadeInfectionSystem = null;
        try {
            this.linkCascadeInfectionSystem = new LinkCascadeInfectionSystem(this.linkingSystem, {
                semanticBus: this.semanticBus
            });
        } catch (err) {
            console.warn('[main.js] LinkCascadeInfectionSystem init failed:', err?.message || err);
            this.linkCascadeInfectionSystem = null;
        }
        // REMOVED (2026-03-01): LinkMetricsSanityGuard disabled for new visual modules
        this.semanticActivityFilter = null;
        try {
            if (this.linkingSystem) {
                this.semanticActivityFilter = new SemanticActivityFilter_v1(this.linkingSystem);
                this.semanticActivityFilter.update();
            }
        } catch (err) {
            console.warn('[main.js] SemanticActivityFilter_v1 init failed:', err?.message || err);
            this.semanticActivityFilter = null;
        }
        if (typeof window !== 'undefined') {
            window.semanticActivityFilter = this.semanticActivityFilter;
        }
        
        // ===================================================================
        // [SESSION 105] LINK METRICS TO VISUAL BRIDGE - Real-time metrics-to-visuals
        // ===================================================================
        // Aggregates metrics from LinkDegradationSystem, LinkCollapseSystem, and
        // CorruptionSystem into unified shader uniforms that drive link fracture visualization
        try {
            // Defer initialization until systems are stable
            this.linkMetricsToVisualBridge = null;
            
            // Initialize after animate loop starts (when all systems are ready)
            // LinkCollapseSystem is now event-driven and handled through NodeLinkingSystem.
            // This bridge remains deferred unless a dedicated visual bridge is needed later.
        } catch (err) {
            console.warn('[main.js] LinkMetricsToVisualBridge initialization deferred:', err.message);
            this.linkMetricsToVisualBridge = null;
        }
        
        // ===================================================================
        // [SESSION 106+] STRESS-BASED PARTICLE SCALER - Particle scaling from link stress
        // LEGACY/april — StressBasedParticleScaler disconnected 2026-04-22 (orphaned, no consumers)
        // this.stressBasedParticleScaler = null;
        // setTimeout(() => { ... new StressBasedParticleScaler_v1(...) }, 150);
        
        // 2. User Acceptance Tracker 1.0 - Player interaction metrics
        this.userAcceptanceTracker = new UserAcceptanceTracker1_0();
        console.log('[main.js] UserAcceptanceTracker1_0 initialized ✓');
        
        // Link ML Recommendation Engine removed (unused)
        // ====================================================================
        // TIER 1 INTEGRATION: Core Active Systems (Phase A)
        // Corruption Transmission + Harmony Stabilization
        // ====================================================================
        
        // Initialize Link Corruption Transmission v1.0 (single authority instance)
        try {
            this.linkCorruptionTransmission =
                this.linkCorruptionTransmission ||
                this.corruptionTransmission ||
                this.aiNodes?.linkCorruption ||
                new LinkCorruptionTransmission_v1(
                    this.aiNodes,           // AI nodes system
                    this.linkingSystem,     // Link system
                    false,                  // debug mode
                    this.semanticBus        // semantic bus for topology events
                );
            this.corruptionTransmission = this.linkCorruptionTransmission;
            if (this.aiNodes) this.aiNodes.linkCorruption = this.linkCorruptionTransmission;
            console.log('[main.js] LinkCorruptionTransmission_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkCorruptionTransmission_v1 initialization failed:', err);
        }
        
        // Initialize Harmony Stabilization System v1.0
        try {
            this.harmonyStabilizationSystem = new HarmonyStabilizationSystem_v1(
                this.aiNodes,                               // AI nodes system
                this.linkingSystem,                         // Link system
                false,                                      // Debug mode off
                this.linkCorruptionTransmission             // LinkCorruptionTransmission for category multipliers
            );
            console.log('[main.js] HarmonyStabilizationSystem_v1 initialized ✓');
            
            // Apply harmony stabilization integration patch
            // Connects HarmonyStabilizationSystem with downstream systems
            // Ensures consistent writing of harmonyLevel
            try {
                applyHarmonyStabilizationIntegration(this.harmonyStabilizationSystem, this);
                console.log('[main.js] HarmonyStabilizationIntegrationPatch_v1 applied ✓');
            } catch (err) {
                console.warn('[main.js] HarmonyStabilizationIntegrationPatch_v1 failed:', err);
            }
        } catch (err) {
            console.warn('[main.js] HarmonyStabilizationSystem_v1 initialization failed:', err);
        }
        
        // LinkRenderer metrics integration via CoreMetricsCalculator is disabled.
        // Canonical source for link shader uniforms is link.userData.metrics only.
        this.linkRendererMetricsIntegration = null;
        this.coreMetricsCalculator = null;


        // ====================================================================
        // PHASE 3C ARCHetype shader模式 (Week 16 - GPU shader mode orchestration)
        // ====================================================================
        // Initialize ArchetypeShaderModes_v1 (GPU shader mode controller)
        // T2-002: Initialize Corruption Visual Integration
        try {
            this.t2CorruptionVisualIntegration = new T2_CorruptionVisualIntegration_v1(
                this.scene,
                this.linkingSystem,
                null,  // CorruptionVisualFX reference (optional)
                this.aiNodes
            );
            this.t2CorruptionVisualIntegration.setEventBus?.(this.semanticBus);
            console.log('[main.js] T2_CorruptionVisualIntegration_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] T2_CorruptionVisualIntegration_v1 initialization failed:', err);
        }
        
        try {
            this.t2HarmonyVisualConsumer = new T2_HarmonyVisualConsumer_v1(
                this.scene,
                this.harmonyStabilizationSystem,
                {
                    attachRootResolver: () => this.vfxRoot || this.worldRoot || this.scene
                }
            );
            this.t2HarmonyVisualConsumer.setEventBus?.(this.semanticBus);
            console.log('[main.js] T2_HarmonyVisualConsumer_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] T2_HarmonyVisualConsumer_v1 initialization failed:', err);
        }
        
        // ====================================================================
        // TIER 4 GAMEPLAY INTEGRATION: Gameplay Layer
        // Connect player actions to TIER 1-3 systems
        // ====================================================================
        try {
            this.tier4GameplayIntegration = new TIER4_GameplayIntegrationBridge({
                enableDebug: false,
                enableVisualFeedback: true,
                enableUIFeedback: true,
                enableGameplayLogic: true,
                linkCreationCorruptionSeed: 0.1,
                linkCreationHarmonyBoost: 0.3,
                linkDestructionHarmonyBoost: 0.2,
                cascadeMitigationStrength: 0.15,
                showCorruptionSeedPulse: true,
                showCascadeWarning: true,
                showHarmonyPulse: true,
                uiPosition: 'top-right',
                uiTheme: 'neon'
            });
            
            // Initialize with all required systems
            this.tier4GameplayIntegration.initialize(
                this.linkingSystem,
                this.aiNodes,
                this.scene,
                this.linkCorruptionTransmission,
                this.harmonyStabilizationSystem,
                this.t2HarmonyVisualConsumer
            );
            
            console.log('[main.js] TIER4_GameplayIntegrationBridge initialized ✓');

            // Wire frame scheduler for visual tick control
            this.tier4GameplayIntegration.frameScheduler = this.frameScheduler;
            if (this.tier4GameplayIntegration.core) {
              this.tier4GameplayIntegration.core.frameScheduler = this.frameScheduler;
            }
            if (this.tier4GameplayIntegration.visuals) {
              this.tier4GameplayIntegration.visuals.frameScheduler = this.frameScheduler;
              this.tier4GameplayIntegration.visuals.camera = this.camera;
            }
            if (this.tier4GameplayIntegration.ui) {
              this.tier4GameplayIntegration.ui.frameScheduler = this.frameScheduler;
            }

            const sharedCorruptionFeedback = this.tier4GameplayIntegration.visuals || null;
            this.corruptionFeedback = sharedCorruptionFeedback;
            this.corruptionFeedback?.setEventBus?.(this.semanticBus);
            this.corruptionFeedback?.setHarmonyFieldConsumer?.(this.t2HarmonyVisualConsumer);

            const conduitFeedback = this.linkingSystem?.conduitRenderer?.corruptionFeedbackVisuals;
            if (conduitFeedback && conduitFeedback !== sharedCorruptionFeedback) {
                conduitFeedback.dispose?.();
            }
            if (this.linkingSystem?.conduitRenderer) {
                this.linkingSystem.conduitRenderer.corruptionFeedbackVisuals = sharedCorruptionFeedback;
            }
        } catch (err) {
            console.warn('[main.js] TIER4_GameplayIntegrationBridge initialization failed:', err);
        }

        // ====================================================================
        // PHASE 8: NETWORK RITUAL STACK
        // Core gameplay rituals + visual bridge + orchestration
        // ====================================================================
        try {
            const ritualsDisabled = Boolean(window.ATOMA_FLAGS?.safety?.disablePhase8NetworkRituals ?? false);
            if (ritualsDisabled) {
                this.networkRituals = null;
                this.phase8VisualBridge = null;
                this.phase8RitualOrchestration = null;
                console.log('[main.js] Phase 8 ritual stack skipped (safety flag: disablePhase8NetworkRituals)');
            } else {
                this.networkRituals = this.networkRituals || new NetworkRituals(
                    this.linkCorruptionTransmission,
                    this.tier4GameplayIntegration
                );

                const phase8Wiring = getGlobalWiringSystem();
                this.phase8VisualBridge = this.phase8VisualBridge || new Phase8VisualBridge(
                    phase8Wiring,
                    {
                        getNodeRenderables: (nodeIds) => {
                            if (!Array.isArray(nodeIds) || nodeIds.length === 0) return [];
                            const targetIds = new Set(nodeIds.filter(Boolean));
                            return (this.aiNodes?.nodes || []).filter((node) => {
                                const nodeId = node?.userData?.nodeId || node?.id;
                                return nodeId && targetIds.has(nodeId);
                            });
                        },
                        getLinkRenderables: (linkIds) => {
                            if (!Array.isArray(linkIds) || linkIds.length === 0) return [];
                            const targetIds = new Set(linkIds.filter(Boolean));
                            return (this.linkingSystem?.links || [])
                                .filter((link) => {
                                    const linkId = link?.id || link?.userData?.linkId;
                                    return linkId && targetIds.has(linkId);
                                })
                                .map((link) => link?.group)
                                .filter(Boolean);
                        }
                    }
                );

                if (!this.phase8RitualOrchestration) {
                    this.phase8RitualOrchestration = new Phase8RitualVisualOrchestration(
                        this.phase8VisualBridge,
                        this.networkRituals
                    );
                    this.phase8RitualOrchestration.initialize();
                }

                this._setupRitualAutoTrigger();
                this._setupPhase8RitualDebugAPI();

                console.log('[main.js] Phase 8 ritual stack initialized ✓');
            }
        } catch (err) {
            console.warn('[main.js] Phase 8 ritual stack initialization failed:', err);
        }

        // ====================================================================
        // PHASE 5: MULTI-NETWORK SYNCHRONIZATION INITIALIZATION
        // ====================================================================
        try {
            this.phase5MultiNetworkOrchestrator = new PHASE5_MultiNetworkOrchestrator({
                enableDebug: false,
                enableLogging: false,
                maxNetworks: 10,
                syncInterval: 100,
                enableCorruptionSpread: true,
                enableSynchronization: true,
                enableEventPropagation: true
            });

            // Initialize orchestrator
            this.phase5MultiNetworkOrchestrator.initialize();

            // Wire frame scheduler for tick control
            this.phase5MultiNetworkOrchestrator.frameScheduler = this.frameScheduler;

            // Register primary network (current network as Network 0)
            // This allows future multi-network scenarios
            this.phase5MultiNetworkOrchestrator.registerNetwork(
                'primary',
                {
                    aiNodes: this.aiNodes,
                    linkingSystem: this.linkingSystem,
                    linkCorruptionTransmission: this.linkCorruptionTransmission,
                    harmonyStabilizationSystem: this.harmonyStabilizationSystem
                },
                {
                    name: 'Primary Network',
                    position: { x: 0, y: 0, z: 0 }
                }
            );

            // Auto-connect all PHASE5 networks when multi-network scenarios become available.
            const autoConnectPhase5Networks = () => {
                const orchestrator = this.phase5MultiNetworkOrchestrator;
                if (!orchestrator?.getAllNetworks || !orchestrator?.getConnections || !orchestrator?.connectNetworks) return;
                const networks = orchestrator.getAllNetworks();
                if (!Array.isArray(networks) || networks.length < 2) return;

                const existing = new Set(
                    (orchestrator.getConnections() || []).map((conn) => `${conn.sourceNetworkId}->${conn.targetNetworkId}`)
                );

                for (const source of networks) {
                    for (const target of networks) {
                        if (!source?.id || !target?.id || source.id === target.id) continue;
                        const key = `${source.id}->${target.id}`;
                        if (existing.has(key)) continue;
                        orchestrator.connectNetworks(source.id, target.id, 0.5);
                        existing.add(key);
                    }
                }
            };
            autoConnectPhase5Networks();

            this._phase5AutoConnectUnsub?.();
            const phase5Manager = this.phase5MultiNetworkOrchestrator?.multiNetworkManager;
            if (phase5Manager?.onNetworkRegistered) {
                this._phase5AutoConnectUnsub = phase5Manager.onNetworkRegistered(() => {
                    autoConnectPhase5Networks();
                });
            }

            // Promote PHASE5 orchestrator internals to authoritative runtime stack.
            const legacyMultiNetworkManager = this.multiNetworkManager;
            const legacyCorruptionBridge = this.corruptionBridge;
            const phase5CorruptionBridge = this.phase5MultiNetworkOrchestrator?.corruptionBridge;

            if (phase5Manager && phase5CorruptionBridge) {
                if (legacyMultiNetworkManager && legacyMultiNetworkManager !== phase5Manager && this._multiNetworkThresholdListener) {
                    legacyMultiNetworkManager.off?.(this._multiNetworkThresholdListener);
                }
                if (this.frameScheduler?.isRegistered?.('simulation.corruptionBridge')) {
                    this.frameScheduler.unregister('simulation.corruptionBridge');
                }

                this.multiNetworkManager = phase5Manager;
                this.corruptionBridge = phase5CorruptionBridge;
                this.multiNetworkManager.frameScheduler = this.frameScheduler;
                this.corruptionBridge.frameScheduler = this.frameScheduler;
                this.corruptionBridge.setEventBus?.(this.semanticBus);
                if (this._multiNetworkThresholdListener) {
                    this.multiNetworkManager.on?.(this._multiNetworkThresholdListener);
                }

                if (legacyCorruptionBridge && legacyCorruptionBridge !== this.corruptionBridge) {
                    legacyCorruptionBridge.dispose?.();
                }
                if (legacyMultiNetworkManager && legacyMultiNetworkManager !== this.multiNetworkManager) {
                    legacyMultiNetworkManager.dispose?.();
                }
            }
            
            console.log('[main.js] PHASE5_MultiNetworkOrchestrator initialized ✓');
        } catch (err) {
            console.warn('[main.js] PHASE5_MultiNetworkOrchestrator initialization failed:', err);
        }
        
        // ====================================================================
        // PHASE 5: INTER-NETWORK VISUALIZATION BRIDGE
        // ====================================================================
        try {
            if (!this.phase5InterNetworkConnectionVisuals) {
                const fallbackState = { timestamp: 0, networks: [], connections: [] };
                this.phase5InterNetworkConnectionVisuals = {
                    sync: (networks, connections) => {
                        fallbackState.timestamp = Date.now();
                        fallbackState.networks = Array.from(networks?.keys?.() || []);
                        fallbackState.connections = (connections || []).map((conn) => ({
                            sourceNetworkId: conn.sourceNetworkId,
                            targetNetworkId: conn.targetNetworkId,
                            strength: conn.strength ?? 0
                        }));
                    },
                    update: () => {},
                    getSnapshot: () => ({ ...fallbackState })
                };
            }

            this.phase5InterNetworkVisualizationBridge = new PHASE5_InterNetworkVisualizationBridge(
                this.phase5MultiNetworkOrchestrator?.multiNetworkManager || null,
                this.phase5MultiNetworkOrchestrator?.corruptionBridge || null,
                this.phase5InterNetworkConnectionVisuals
            );
            console.log('[main.js] PHASE5_InterNetworkVisualizationBridge initialized ✓');
        } catch (err) {
            console.warn('[main.js] PHASE5_InterNetworkVisualizationBridge initialization failed:', err);
        }
        
        // ====================================================================
        // PHASE 5: CASCADE PROPAGATION VISUAL EFFECTS
        // ====================================================================
        // Initialize cascade propagation visual effects (expanding rings)
        if (VISUAL_SYSTEMS_ENABLED) {
            try {
                this.phase5CascadePropagationVisuals = new PHASE5_CascadePropagationVisuals(
                    this.scene,
                    {
                        enableDebug: false,
                        enableLogging: false,
                        semanticBus: this.semanticBus,
                        linkingSystem: this.linkingSystem,
                        ringRadius: 1.5,
                        expandSpeed: 8.0,
                        fadeDuration: 0.8,
                        maxRingSize: 15.0,
                        corruptionCascadeColor: 0xff3333,  // Red
                        harmonyCascadeColor: 0x00ffff,     // Cyan
                        threatCascadeColor: 0xff6600,      // Orange
                        maxActiveRings: 50,
                        depthDecayFactor: 0.7,
                        cascadeActivationThreshold: 0.3
                    }
                );
                this.cascadePropagationVisuals = this.phase5CascadePropagationVisuals;
                if (this.cascadePropagationVisuals) {
                    this.cascadePropagationVisuals.frameScheduler = this.frameScheduler;
                    if (this.linkCorruptionTransmission && typeof this.cascadePropagationVisuals.subscribeToCascadeEvents === 'function') {
                        this.cascadePropagationVisuals.subscribeToCascadeEvents(this.linkCorruptionTransmission);
                    }
                }
                if (typeof window !== 'undefined') {
                    window._cascadeVisuals = this.cascadePropagationVisuals;
                }
                this._setupPhase8ToPhase5CascadeBridge();
                console.log('[main.js] PHASE5_CascadePropagationVisuals initialized ✓');
            } catch (err) {
                console.warn('[main.js] PHASE5_CascadePropagationVisuals initialization failed:', err);
                this.cascadePropagationVisuals = null;
            }
        } else {
            this.phase5CascadePropagationVisuals = null;
            this.cascadePropagationVisuals = null;
        }
        
        // Initialize cascade visualization bridge
        if (VISUAL_SYSTEMS_ENABLED) {
            try {
                this.phase5CascadeVisualizationBridge = new PHASE5_CascadeVisualizationBridge(
                    this.aiNodes,
                    this.linkCorruptionTransmission,
                    this.phase5CascadePropagationVisuals,
                    {
                        enableDebug: false,
                        enableLogging: false,
                        semanticBus: this.semanticBus,
                        corruptionCascadeThreshold: 0.7,
                        threatCascadeThreshold: 0.5,
                        harmonyCascadeThreshold: 0.8,
                        maxEventHistory: 100
                    }
                );
                this.phase5CascadeVisualizationBridge.frameScheduler = this.frameScheduler;
                console.log('[main.js] PHASE5_CascadeVisualizationBridge initialized ✓');
            } catch (err) {
                console.warn('[main.js] PHASE5_CascadeVisualizationBridge initialization failed:', err);
            }
        } else {
            this.phase5CascadeVisualizationBridge = null;
        }

        // Connect cascade visuals to multi-network orchestrator for event-driven cascades
        if (this.phase5MultiNetworkOrchestrator?.setCascadeVisuals && this.cascadePropagationVisuals) {
            this.phase5MultiNetworkOrchestrator.setCascadeVisuals(this.cascadePropagationVisuals);
        }
        if (typeof window !== 'undefined') {
            window.PHASE5 = {
                orchestrator: this.phase5MultiNetworkOrchestrator,
                cascadeVisuals: this.cascadePropagationVisuals,
                interNetworkVisuals: this.phase5InterNetworkConnectionVisuals
            };
            console.log('[PHASE5] Systems activated');
        }

        // ====================================================================
        // NODE HIERARCHY SYSTEM v1.0 — Parent-Child Node Relationships
        // Enables organizational hierarchies, property cascading, visualization
        // ====================================================================
        try {
            this.nodeHierarchyBridge = new NodeHierarchyBridge(
                this.scene,
                this.camera,
                this.aiNodes,
                this.linkingSystem
            );
            
            // Initialize after all nodes/links are ready
            this.nodeHierarchyBridge.init();
            
            // Expose console API for debugging
            window.hierarchyDebug = this.nodeHierarchyBridge.getConsoleAPI();
            
            console.log('[main.js] NodeHierarchyBridge v1.0 initialized ✓');
        } catch (err) {
            console.warn('[main.js] NodeHierarchyBridge initialization failed:', err);
        }

        // REMOVED (2026-05-14): PersonalityShaderBridge_v1 init — moved to LEGACY/

        // REMOVED (2026-05-14): PersonalityShaderEffects_Pack_v1 init — moved to LEGACY/

        // REMOVED (2026-05-14): PersonalityShaderAdvancedFX_v1 init — moved to LEGACY/

        // ====================================================================
        // PHASE 3C ARCHETYPE SHADER MODES (Week 16 - GPU Shader Mode Orchestration)
        // ====================================================================
        // Initialize ArchetypeShaderModes_v1 (GPU shader mode controller)
        // This layer depends on Week 15 color palette and orchestrates shader modes
        // across all GPU-rendered nodes and effects
        try {
            this.archetypeShaderModes = new ArchetypeShaderModes_v1({ scene: this.scene, camera: this.camera, renderer: this.renderer });
            console.log('[main.js] ArchetypeShaderModes_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] ArchetypeShaderModes_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 18: NODE SELECTION SHADER ACTIVATION (Selection-Driven Boost)
        // ====================================================================
        // Initialize NodeShaderActivation_v1 (selection-hooked shader intensity boost)
        // This layer listens to node selection events and amplifies the selected node's
        // archetype shader mode with intensity × 1.35 and distortion × 1.25
        try {
            this.nodeShaderActivation = new NodeShaderActivation_v1({
                selectionCore: this.selectionCore,
                archetypeShaderModes: this.archetypeShaderModes,
                debugEnabled: false
            });
            this.nodeShaderActivation.init();
            console.log('[main.js] NodeShaderActivation_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] NodeShaderActivation_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 18 (ALT): LINK PERSONALITY STATE MACHINE (Dynamic Link Personalities)
        // ====================================================================
        // Initialize LinkPersonalityStateMachine_v1 (compute link personality states)
        // This system evaluates 1000+ links in <1.5ms with EMA smoothing
        // Outputs: link.userData.personalityState (state ID, name, stability, turbulence, ascension)
        // Reads from: visualGlow, personalityVisual, archetypeEvolution (no modifications)
        try {
            this.linkPersonalityStateMachine = new LinkPersonalityStateMachine_v1({
                debugEnabled: false
            });
            console.log('[main.js] LinkPersonalityStateMachine_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkPersonalityStateMachine_v1 failed:', err);
        }

        // REMOVED: SynergyBonusVisualization_v1 initialization — moved to LEGACY/april (2026-04-22)

        // ====================================================================
        // WEEK 19 (ALT): SYNERGY BONUS FX LAYER (GPU-Based Synergy Flares)
        // ====================================================================
        // Initialize SynergyBonusFXLayer_v1 (GPU shader effects on synergy links)
        // This system reads canonical synergy data and applies shader-based visual flares
        // Emissive boosting (10–90%), multi-frequency pulsing (0.5–3 Hz), chroma flares
        // Evaluates 1500+ links in <1ms with per-material shader patches
        // Reads from: canonical link.userData.synergy.{score, synergyNorm} via SemanticMetricAdapter
        if (!window.ATOMA_FLAGS?.visual?.disableSynergyShaderStacks) {
            try {
                this.synergyBonusFXLayer = new SynergyBonusFXLayer_v1({
                    maxLinksPerFrame: null,  // No frame limit
                    globalIntensity: 1.0,
                    enableRipples: true,
                    enableChroma: true,
                    debugEnabled: false
                });
                console.log('[main.js] SynergyBonusFXLayer_v1 initialized ✓');
            } catch (err) {
                console.warn('[main.js] SynergyBonusFXLayer_v1 failed:', err);
            }

            // ====================================================================
            // WEEK 20: SYNERGY RESONANCE SHADER PACK (Multi-Frequency Resonance FX)
            // ====================================================================
            // Initialize SynergyResonanceShaderPack_v1 (advanced resonance effects)
            // This system provides multi-frequency pulse, chromatic ripples, and flow mapping
            // Works alongside Week 19 FXLayer for layered, expressive synergy visuals
            // Per-material shader patching with dynamic uniform updates
            // Reads from: canonical link.userData.synergy.{score, synergyNorm} via SemanticMetricAdapter
            try {
                this.synergyResonanceShaderPack = new SynergyResonanceShaderPack_v1({
                    debugEnabled: false,
                    globalMultiFreqStrength: 1.0,    // Multi-frequency pulse intensity
                    globalChromaticStrength: 1.0,    // Chromatic aberration intensity
                    globalFlowSpeed: 1.0             // Coherence flow animation speed
                });
                console.log('[main.js] SynergyResonanceShaderPack_v1 initialized ✓');
            } catch (err) {
                console.warn('[main.js] SynergyResonanceShaderPack_v1 failed:', err);
            }

            try {
                const currentLinks = this.linkingSystem?.links || this.nodeLinking?.links || [];
                this.primeLinkShaderMaterials(currentLinks, 'synergy-shader-prime');
            } catch (err) {
                console.warn('[main.js] Synergy shader priming failed:', err);
            }
        } else {
            this.synergyBonusFXLayer = null;
            this.synergyResonanceShaderPack = null;
            console.log('[main.js] Synergy shader stack disabled via ATOMA_FLAGS.visual.disableSynergyShaderStacks');
        }

        // ====================================================================
        // WEEK 21: AI NETWORK RESONANCE FEEDBACK (Network-Level Feedback)
        // ====================================================================
        // Initialize ResonanceFeedback_v1 (AI network resonance feedback system)
        // This system samples synergy, personality, and shader data across the network
        // Computes local resonance for nodes & links, aggregates into global "network mood"
        // Influences node behavior, link behavior, and overall network state
        // Reads from: node/link userData (all previous Week systems)
        //
        // Harmony Field Lines spawn conditions:
        // - Resonance >= 0.6 (60%+ threshold - more forgiving)
        // - Corruption < 0.3 (low corruption nodes only)
        // - Must have at least one connection
        try {
            this.resonanceFeedback = new ResonanceFeedback_v1({
                scene: this.scene,           // Three.js scene for visual effects
                debugEnabled: false,
                maxNodesPerFrame: null,     // No frame limit
                maxLinksPerFrame: null,     // No frame limit
                enableHarmonyFieldLines: true,  // Enable visual field lines
                fieldLinesConfig: {
                    resonanceThreshold: 0.6,     // More forgiving threshold (60%+)
                    maxConnectionsPerNode: 3,    // Limit connections per node
                    maxTotalLines: 50,           // Total field lines limit
                    pulseSpeed: 2.0,             // Animation speed
                    debugEnabled: false
                }
            });
            console.log('[main.js] ResonanceFeedback_v1 initialized ✓ (Harmony Field Lines enabled)');

            // Console API for field lines control
            window.harmonyFieldLines = {
                enable: () => {
                    this.resonanceFeedback?.setHarmonyFieldLinesEnabled(true);
                    console.log('Harmony Field Lines enabled');
                },
                disable: () => {
                    this.resonanceFeedback?.setHarmonyFieldLinesEnabled(false);
                    console.log('Harmony Field Lines disabled');
                },
                setThreshold: (t) => {
                    this.resonanceFeedback?.setHarmonyFieldLinesThreshold(t);
                    console.log(`Harmony Field Lines threshold set to ${t}`);
                },
                stats: () => {
                    const stats = this.resonanceFeedback?.getHarmonyFieldLinesStats();
                    console.table(stats);
                }
            };
        } catch (err) {
            console.warn('[main.js] ResonanceFeedback_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 22: SYNERGY CHAIN REACTIONS (Emergent Cascade Events)
        // ====================================================================
        // Initialize SynergyChainReaction_v1 (cascade event propagation system)
        // This system monitors synergy thresholds and propagates chain reactions
        // Events cascade through linked nodes with resonance/personality filtering
        // Generates LinkEvents (for shader effects) and NodeEvents (for AI behavior)
        // Reads from: node/link userData (synergy, resonance, personality)
        // Outputs: chainReaction.getActiveReactions() for shader/AI integration
        const releaseContainmentProfile = getAtomaReleaseContainmentProfile(window);
        if (!releaseContainmentProfile.systems.synergyChainReaction.disabledByPolicy) {
            try {
                this.synergyChainReaction = new SynergyChainReaction_v1({
                    enabled: true,               // ENABLED for cascade activation
                    emitEvents: true,            // emit cascade events
                    debugEnabled: false,
                    primaryThreshold: 0.6,      // Node synergy to trigger cascade (znížené pre debug)
                    synergyThreshold: 0.6,      // legacy naming (znížené pre debug)
                    resonanceSimilarityThreshold: 0.6,  // Resonance compatibility
                    personalityCompatibilityThreshold: 0.5,  // Personality filter
                    synergyMinimum: 0.3,        // Min synergy for propagation
                    minimumIntensity: 0.1,      // Stop cascade below this
                    maxHops: 5,                 // Max chain depth (maxDepth: 5)
                    maxReactionsPerFrame: null, // No frame limit
                    maxNodesPerFrame: 30,
                    maxLinksPerFrame: 50,
                    intensityDecayPerHop: 0.75  // propagationFactor: 0.75
                });
                markReleaseContainmentRuntime(this, 'synergyChainReaction', { initialized: true, enabled: true });
                console.log('[main.js] SynergyChainReaction_v1 initialized ✓');
            } catch (err) {
                console.warn('[main.js] SynergyChainReaction_v1 failed:', err);
            }

            this.frameScheduler.register('simulation', (dt) => {
                this.synergyChainReaction?.update?.(dt, this.nodes || this.aiNodes?.nodes || []);
            }, 'simulation.synergyChainReaction');
            markReleaseContainmentRuntime(this, 'synergyChainReaction', { scheduled: true });
        } else {
            console.log('[main.js] SynergyChainReaction_v1 disabled by demo release containment policy');
        }
        window.enableSynergyChainReaction = (flag = false) => {
            if (window.ATOMA_DISABLE_SYNERGY_CHAIN_REACTION !== false) {
                console.warn('[SynergyChainReaction_v1] Disabled by ATOMA_DISABLE_SYNERGY_CHAIN_REACTION demo policy');
                return false;
            }
            if (!this.synergyChainReaction) {
                console.warn('[SynergyChainReaction_v1] instance not ready');
                return false;
            }
            const enable = Boolean(flag);
            this.synergyChainReaction.enabled = enable;
            this.synergyChainReaction.emitEvents = enable;
            markReleaseContainmentRuntime(this, 'synergyChainReaction', { enabled: enable });
            if (enable) {
                console.log('[SynergyChainReaction_v1] ENABLED (<=30Hz, caps: 30 nodes / 50 links)');
            }
            return enable;
        };
        this.frameScheduler.register('simulation', () => this.updateHoverGlyphTarget?.(), 'simulation.semanticHoverGlyph');
        this.frameScheduler.register('simulation', () => this.nodeHierarchyBridge?.update?.(), 'simulation.nodeHierarchyBridge');
        this.frameScheduler.register('visual', (dt) => this.phase5CascadeVisualizationBridge?.update?.(dt), 'visual.phase5CascadeVisualizationBridge');
        // REMOVED: preCascadeVisualHint frame scheduler — moved to LEGACY/april (2026-04-22)

        // REMOVED: SynergyCascadeFXBridge_v1 initialization — moved to LEGACY/april (2026-04-22)

        // ====================================================================
        // WEEK 27: WAVE PARTICLE EMITTER (GPU-Reactive Particle FX)
        // ====================================================================
        // Emits 3 particle families based on real-time wave interference:
        // - Constructive Burst Particles (cyan-white synergy sparks)
        // - Destructive Chaos Sparks (orange-red chaotic explosions)
        // - Standing Wave Ripple Rings (circular harmonic expansion)
        // Reads from: WaveInterferenceEngine burst snapshot sampler
        // Performance: <2ms per frame for 200-400 nodes with ~2000 active particles
        try {
            this.particleEmitter = new WaveParticleEmitter_v1({
                semanticBus: this.semanticBus,
                maxParticlesPerFamily: 2000,
                emissionRate: 1.0,
                constructiveThreshold: 0.15,
                destructiveThreshold: 0.2,
                standingWaveThreshold: 0.25,
                amplitudeSpikeThreshold: 0.12,
                amplitudeEMAAlpha: 0.15,
                debugMode: false,
                // Diagnostic logging for node-origin constructive emissions (temporary).
                debugNodeEmissionLogs: true,
                debugNodeEmissionLogIntervalSec: 0.8,
                debugNodeEmissionNodeIds: [],
                debugNodeEmissionVisualCodes: [1002]
            });
            this.particleEmitter?.init?.(this.renderer, this.scene);
            this.particleEmitter.setEventBus?.(this.semanticBus);
            console.log('[main.js] WaveParticleEmitter_v1 initialized ✓');

            // FrameScheduler: drive particle emitter at visual cadence (30 Hz)
            this.frameScheduler?.register('visual', (dt) => {
                if (this.activeLinkCount === 0) return;
                this.particleEmitter?.update?.(
                    dt,
                    this.aiNodes?.nodes || [],
                    this.linkingSystem?.links || [],
                    this.waveInterferenceEngine
                );
        }, 'visual.harmony.waveParticleEmitter');
        } catch (err) {
            console.warn('[main.js] WaveParticleEmitter_v1 initialization failed:', err);
        }

        // REMOVED: ParticleStreamCascadeAcceleration entire block — moved to LEGACY/april (2026-04-22)

        // ====================================================================
        // PHASE 3C PERFORMANCE MODE (Centralized FX Scaling)
        // ====================================================================
        // Initialize FXPerformanceController_v1 (Scaler moved to LEGACY/april — 2026-04-22)
        try {
            this.fxPerformance = new FXPerformanceController_v1({
                enableDebug: false,
                enableWarnings: false
            });
            console.log('[main.js] FXPerformanceController_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize FXPerformanceController_v1:', err);
        }

        // ====================================================================
        // PHASE 3C ADAPTIVE PERFORMANCE MONITOR (Automatic FPS-based scaling)
        // ====================================================================
        // Initialize AdaptivePerformanceMonitor_v1
        // This layer automatically toggles LowFX based on frame rate
        // User F7 toggle locks system to manual mode (notifyManualToggle)
        // Resets to AUTO mode on map transitions (resetToAuto)
        // Includes callback for smooth transitions (Week 4.5)
        try {
            this.adaptivePerformanceMonitor = new AdaptivePerformanceMonitor_v1(
                this.fxPerformance,
                {
                    targetFPS: 60,
                    hysteresisFPS: 5,
                    lowFXDelaySec: 3.0,
                    highFXDelaySec: 5.0,
                    emaAlpha: 0.1,
                    frameScheduler: this.frameScheduler,
                    snapshotProvider: () => this.buildPerformanceBudgetSnapshot?.() || {},
                    tierCallback: (tier, snapshot, meta) => {
                        this.applyAdaptivePerformanceTier?.(tier, snapshot, meta);
                    }
                }
            );
            console.log('[main.js] AdaptivePerformanceMonitor_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize AdaptivePerformanceMonitor_v1:', err);
        }

        // ====================================================================
        // PHASE 3C SMOOTH TRANSITION LAYER (Week 4.5 - Visual Polish)
        // ====================================================================
        // Initialize FXPerformanceSmoothTransition_v1
        // This layer smoothly interpolates multipliers during LowFX toggles
        // Creates polished fade-in/fade-out effects instead of instant jumps
        // Integrates with both manual F7 and adaptive auto-toggle
        try {
            this.fxPerformanceTransition = new FXPerformanceSmoothTransition_v1(
                this.fxPerformance,
                {
                    duration: 0.6,  // 0.6 second smooth transition
                    enableDebug: false
                }
            );
            this.fxPerformanceTransition.frameScheduler = this.frameScheduler;
            console.log('[main.js] FXPerformanceSmoothTransition_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] Failed to initialize FXPerformanceSmoothTransition_v1:', err);
        }

        // Initialize or update Node Inspect Overlay (with Linguistic Overlay)
        if (!this.nodeInspectOverlay) {
            this.nodeInspectOverlay = new NodeInspectOverlay1_0(
                this.scene,
                this.camera,
                this.renderer,
                this.linguisticOverlay, // Pass linguistic overlay for integration
                this
            );
        }

        // ====================================================================
        // EXTRACTION PACK V1.0 — METRICS RUNTIME ORCHESTRATION
        // ====================================================================
try {
this.metricsRuntime_v1 = new MetricsRuntime_v1({
  nodes: this.aiNodes,
  links: this.links, // fallback / legacy
  linkSystem: this.linkingSystem, // 🔥 KANONICKÝ
  metricsSystems: {
    nodeDynamicMetrics: this.nodeDynamicMetrics,
    linkQualityCalculator: this.linkQualityCalculator,
    nodeQualityCalculator: this.nodeQualityCalculator,
    visualMetricModel: this.visualMetricModel,
    safeMetricsFX: this.safeMetricsFX
  },
  options: {
    useNetworkMetricsAggregator: true,
    externalNetworkMetricsAggregatorControl: true
  }
});

this.metricsRuntime_v1.onSimulationTick = (snapshot) => {
  this.nodeInspectOverlay?.onSimulationTick?.(snapshot);
  this.nodeInspectPanel?.onSimulationTick?.(snapshot);
};

this.coreMetricsOverlay?.setMetricsRuntime?.(this.metricsRuntime_v1);

  console.log('[main.js] MetricsRuntime_v1 initialized ✓');
  // 🔗 Inject canonical link system into NetworkMetricsAggregator
  this.metricsRuntime_v1?.networkMetricsAggregator?.setLinkSource?.(
    this.nodeLinkingSystem
  );

  // fallback (ak setter neexistuje)
  if (this.metricsRuntime_v1?.networkMetricsAggregator) {
    this.metricsRuntime_v1.networkMetricsAggregator.linkSystem =
      this.nodeLinkingSystem;
  }

} catch (err) {
  console.warn('[main.js] MetricsRuntime_v1 failed:', err);
}

        // ====================================================================
        // NETWORK STRESS AGGREGATOR — standalone stress runtime layer
        // ====================================================================
        try {
            this.networkStressAggregator = new NetworkStressAggregator(
                this.linkDegradationSystem,
                null,
                this.nodeDynamicMetrics
            );
            this.networkStressAggregator.frameScheduler = this.frameScheduler;
            if (typeof window !== 'undefined') {
                window.ATOMA_NETWORK_STRESS = () => this.networkStressAggregator?.getStress?.();
            }
            console.log('[main.js] NetworkStressAggregator initialized ✓');
        } catch (err) {
            console.warn('[main.js] NetworkStressAggregator failed:', err);
        }

        // ====================================================================
        // METRIC INTERPRETATION LAYER v1 — Visual Signal Interpretation
        // ====================================================================
        try {
            this.metricInterpretationLayer = new MetricInterpretationLayer_v1({
                debugEnabled: false
            });
            setupMetricInterpretationConsoleAPI(this.metricInterpretationLayer);
            console.log('[main.js] MetricInterpretationLayer_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] MetricInterpretationLayer_v1 failed:', err);
        }

        // ====================================================================
        // RELEASE-DISABLED: legacy stress atmosphere / node stress shader path
        // - StressVisualShaderSystem is intentionally offline for release
        // - CanonicalTemplate3_StressVisuals moved to LEGACY
        // - canopy / horizon atmosphere now lives inside SafeWorldFXPack
        // ====================================================================
        this.stressVisualShaderSystem = null;
        this.canonicalTemplate3_StressVisuals = null;

        // REMOVED: PersonalityRuntime_v1 initialization — moved to LEGACY/april (2026-04-22)

        // ====================================================================
        // EXTRACTION PACK V1.1 — WORLD RUNTIME ORCHESTRATION
        // ====================================================================
        try {
            this.worldRuntime_v1 = new WorldRuntime_v1({ game: this });
            console.log('[main.js] WorldRuntime_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] WorldRuntime_v1 failed:', err);
        }

        // ====================================================================
        // EXTRACTION PACK V1.1 — FX RUNTIME ORCHESTRATION
        // ====================================================================
       // try {
       //     this.fxRuntime_v1 = new FXRuntime_v1({ game: this });
      //      console.log('[main.js] FXRuntime_v1 initialized ✓');
      //  } catch (err) {
      //      console.warn('[main.js] FXRuntime_v1 failed:', err);
      //  }

        // ====================================================================
        // EXTRACTION PACK V1.2 — NODE EDITOR RUNTIME ORCHESTRATION
        // ====================================================================
        try {
            this.nodeEditorRuntime_v1 = new NodeEditorRuntime_v1({ game: this });
            this.nodeEditorRuntime_v1.init?.();
            console.log('[main.js] NodeEditorRuntime_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] NodeEditorRuntime_v1 failed:', err);
        }

        // ====================================================================
        // EXTRACTION PACK V1.3 — INPUT RUNTIME ORCHESTRATION
        // ====================================================================
        try {
            this.inputRuntime_v1 = new InputRuntime_v1({ game: this });
            this.inputRuntime_v1.init?.();
            console.log('[main.js] InputRuntime_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] InputRuntime_v1 failed:', err);
        }

        // ====================================================================
        // WEEK 22B: CASCADE FX BRIDGE TARGET SYSTEM REGISTRATION
        // ====================================================================
        // Second pass: Register all target shader systems with cascade bridge
        // REMOVED: synergyCascadeFXBridge target system registration — moved to LEGACY/april (2026-04-22)

        // ====================================================================
        // CRITICAL VISUAL INTEGRITY ENFORCEMENT (Session X)
        // ====================================================================
        // Ensures nodes retain full visual fidelity even when linked
        // REMOVED: NodeVisualIntegrityFix - moved to LEGACY (2026-04-03)
        // try {
            //     NodeVisualIntegrityFix.initializeVisualIntegrity(this.scene);
            //     console.log('[main.js] NodeVisualIntegrityFix initialized ✓');
        // } catch (err) {
            //     console.warn('[main.js] NodeVisualIntegrityFix initialization failed:', err);
        }
    

    /**
     * Setup mode switching (theme cycle + map hotkey)
     */
    setupModeSwitch() {
        document.addEventListener('keydown', (e) => {
            console.log('[MODEKEY]', e.code, 'shift=', e.shiftKey);
            if (e.code === 'KeyM') {
                if (e.shiftKey) {
                    this.switchWorld();
                } else {
                    this.switchMode();
                }
            } else if (e.code === 'KeyN') {
                this.switchWorld();
            }
        });
    }

    /**
     * Debug helper: prints pictogram system status (uses console.error to bypass log level)
     */
    debugPictograms() {
        const pictos = this.linkPictogramSystem ?? this.linkSemanticPictograms;
        if (!pictos) {
            console.error('[Pictograms] System NOT initialized');
            return;
        }
        const poolSize = pictos.pictogramSystem?.pictograms?.length ?? 'n/a';
        const active = pictos.pictogramSystem?.pictograms?.filter?.(p => p.active)?.length ?? 'n/a';
        const fusionEnabled = pictos.fusionZoneManager?.enabled ?? false;
        const fusionActive = pictos.fusionZoneManager?.zones?.filter?.(z => z.active)?.length ?? 0;
        console.error('[Pictograms] enabled=', pictos.enabled, 'pool=', poolSize, 'active=', active, 'fusionEnabled=', fusionEnabled, 'activeFusionZones=', fusionActive);
    }

    /**
     * Setup performance mode hotkey (F7 key)
     * Toggle LowFX mode for instant quality switching
     * Notifies adaptive monitor of manual override
     * Triggers smooth transition effects
     */
    setupPerformanceMode() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F7') {
                if (this.fxPerformance) {
                    const newState = !this.fxPerformance.isLowFX();
                    this.fxPerformance.setLowFX(newState);
                    this.performanceDisciplineCurrentTier = newState ? 'PERFORMANCE' : 'FULL';
                    console.log(`[FXPerformanceMode] LowFX: ${newState ? 'ON' : 'OFF'} (manual)`);

                    // Notify adaptive monitor that user manually overrode auto system
                    if (this.adaptivePerformanceMonitor?.notifyManualToggle) {
                        this.adaptivePerformanceMonitor.notifyManualToggle(newState);
                    }

                    // Start smooth transition effect
                    if (this.fxPerformanceTransition?.startTransition) {
                        this.fxPerformanceTransition.startTransition(newState);
                    }
                }
            }
        });
    }

    // ── Unified release score config (mirrors MENU_MAPS scoreConfig) ──
    static WORLD_SCORE_CONFIG = Object.freeze({
        fractal:  { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 },
        desert:   { sustainDuration: 4.5, rewindSpeed: 4.0, forwardSpeed: 5, synergyThreshold: 0.50 },  // easier: faster rewind, lower threshold, shorter sustain
        desert2:  { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 },
        quantum:  { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 },  // standard difficulty
        memory:   { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 },
        sigma:    { sustainDuration: 5, rewindSpeed: 3.5, forwardSpeed: 5, synergyThreshold: 0.55 },
    });

    loadWorld(worldId) {
        // World Transition Guard - prevent re-entrant execution
        if (this._worldTransitionInProgress) {
            console.warn('[WorldTransition] Ignored re-entrant loadWorld call for:', worldId);
            return;
        }

        this._worldTransitionInProgress = true;

        try {
            console.log('[LOADWORLD] start', worldId);
            // Cleanup old world event listeners
            this.disposeWorldListeners();

            // Hard cleanup: dispose all registry-tracked event subscriptions
            eventRegistrationRegistry.disposeAll();

            // Dispose systems that have explicit cleanup
            this.phase5InterNetworkVisualizationBridge?.dispose?.();

            const fn = this.worldRegistry?.[worldId];
            console.log('[LOADWORLD] before registry', worldId, 'hasKey=', !!fn);
            if (!fn) {
                console.warn('[LOADWORLD] unknown world', worldId);
                return;
            }

            // Hard reset global scene layer (keep player, lights, existing worldRoot only)
            this.scene.children
                .filter(o =>
                    o !== this.worldRoot &&
                    o !== this.vfxRoot &&
                    o !== this.player &&
                    !(o instanceof THREE.Light)
                )
                .forEach(o => this.scene.remove(o));

            console.log("Loading world:", worldId);

            this.worldResetFix.cleanOldScene();

            const previousWorldId = this.currentMode ?? null;
            this.currentMode = worldId;
            this.currentTheme = worldId;
            this._prepareRunIdentityForWorld(worldId);

            this._pendingCreateWorldReason = 'MAP_SWITCH';
            fn();
            this._rebindWorldLifecycleSystems();

            // Apply per-world score difficulty config
            if (this.visualNetworkTimeElasticity?.applyWorldConfig) {
                const worldScoreConfig = this._getRunIdentityScoreConfigForWorld(worldId);
                if (worldScoreConfig) {
                    this.visualNetworkTimeElasticity.applyWorldConfig(worldScoreConfig);
                }
            }

            if (this.semanticBus?.emit) {
                this.semanticBus.emit('world.loaded', {
                    worldId,
                    previousWorldId,
                    currentMode: this.currentMode,
                    currentTheme: this.currentTheme,
                    timestamp: performance.now()
                }, { priority: this.semanticBus.priority?.NORMAL });
            }

            console.log('[LOADWORLD] after registry', worldId);
        } catch (e) {
            console.error('[LOADWORLD] ERROR', worldId, e);
            throw e;
        } finally {
            this._worldTransitionInProgress = false;
            console.log('[LOADWORLD] end', worldId);
        }
    }

    /**
     * World Event Listener Registry (prevent memory leaks on world switch)
     * Automatically registers listeners and provides cleanup
     */
    addWorldListener(target, type, handler) {
        target.addEventListener(type, handler);
        const disposer = () => {
            target.removeEventListener(type, handler);
        };
        this._worldEventDisposers.push(disposer);
    }

    /**
     * Dispose all registered world event listeners
     * Call this during world switch to prevent memory leaks
     */
    disposeWorldListeners() {
        for (const disposer of this._worldEventDisposers) {
            disposer();
        }
        this._worldEventDisposers.length = 0;
    }

    /**
     * Switch between environments
     * NOW WITH: Safe World Reset Fix 1.0 - Prevents map-switch crashes
     */
    switchMode() {
        const order = ["fractal", "quantum", "desert", "desert2", "memory", "chamber", "sigma"];

        const currentIndex = order.indexOf(this.currentTheme ?? this.currentMode);
        const nextIndex = (currentIndex + 1) % order.length;
        const nextTheme = order[nextIndex];

        this.currentTheme = nextTheme;
        this.applyTheme(nextTheme);
    }

    switchWorld(worldId) {
        console.log('[SWITCHWORLD] called');
        const order = ["fractal", "quantum", "desert", "desert2", "memory", "chamber", "sigma"];
        const nextWorldId = worldId || order[(order.indexOf(this.currentMode) + 1) % order.length];
        const wasPaused = this.isPaused === true;
        this.pause();

        return this._runVisualTransition(
            async ({ setPhase, yieldFrame }) => {
                setPhase({
                    title: 'WORLD TRANSITION',
                    subtitle: 'Collapsing the previous field geometry.',
                    phase: 'COLLAPSING WORLD',
                    variant: 'world-switch',
                });
                await yieldFrame();
                setPhase({
                    title: 'WORLD TRANSITION',
                    subtitle: 'Weaving the next world lattice.',
                    phase: 'WEAVING NEW FIELD',
                    variant: 'world-switch',
                });
                await yieldFrame();
                this.loadWorld(nextWorldId);
                setPhase({
                    title: 'WORLD TRANSITION',
                    subtitle: 'Restoring spatial rhythm and simulation authority.',
                    phase: 'RESTORING SIMULATION',
                    variant: 'world-switch',
                });
                await yieldFrame();
                return true;
            },
            {
                title: 'WORLD TRANSITION',
                subtitle: 'Collapsing the previous field geometry.',
                phase: 'COLLAPSING WORLD',
                variant: 'world-switch',
            },
        ).finally(() => {
            if (!wasPaused) {
                this.resume();
            }
        });
    }

    pause() {
        if (this.isPaused) {
            return;
        }

        this.isPaused = true;
        this.clock.getDelta();
    }

    resume() {
        if (!this.isPaused) {
            return;
        }

        this.isPaused = false;
        this.clock.getDelta();
    }

    applyTheme(themeId) {
        switch (themeId) {
            case 'sigma':
                this.setupSigmaRiftEnvironment?.();
                break;
            case 'desert':
                this.setupDreamDesertEnvironment?.();
                break;
            case 'quantum':
                this.setupQuantumIslandEnvironment?.();
                break;
            case 'fractal':
                this.setupFractalValleyEnvironment?.();
                break;
            case 'desert2':
                this.setupChamberEnvironment?.();
                break;
            case 'memory':
                this.setupMemoryLaneEnvironment?.();
                break;
            case 'chamber':
            default:
                this.setupChamberEnvironment?.();
                break;
        }
    }
    _getCascadeEventBridgeConfig() {
        return {
            linkingSystem: this.nodeLinkingSystem ?? this.linkingSystem ?? this.nodeLinking,
            semanticBus: this.semanticBus,
            decayRate: 0.92,
            minIntensityThreshold: 0.01,
            cascadeWaveThreshold: 0.3,
            cascadeWaveCooldown: 1.0,
            enabled: true
        };
    }

    _unregisterCascadeEventBridgeTick() {
        if (!this.frameScheduler) return;
        if (this.frameScheduler.isRegistered?.('simulation.cascadeEventBridge') !== true) return;
        this.frameScheduler.unregister('simulation.cascadeEventBridge');
    }

    ensureCascadeEventBridge() {
        try {
            const linkingSystem = this.nodeLinkingSystem ?? this.linkingSystem ?? this.nodeLinking;
            if (!linkingSystem || !this.semanticBus) {
                return false;
            }

            // Idempotent rebind: always dispose stale/previous instance first to avoid duplicate subscriptions.
            if (this.cascadeEventBridge && typeof this.cascadeEventBridge.dispose === 'function') {
                this._unregisterCascadeEventBridgeTick();
                this.cascadeEventBridge.dispose();
            }

            this.cascadeEventBridge = createCascadeEventBridge(this._getCascadeEventBridgeConfig());
            console.log('[main.js] CascadeEventBridge re-bound ✓');
            return true;
        } catch (err) {
            console.warn('[main.js] CascadeEventBridge re-bind failed:', err);
            return false;
        }
    }

    setupCascadeParticleSystem() {
        try {
            this.cascadeParticleSystem = setupCascadeParticleSystem(
                this,
                {
                    enabled: true,
                    debugMode: false,
                    maxParticles: 100,
                    emissionRate: 4.8,
                    baseSize: 4.8,
                    visualSizeBoost: 1.6,
                    baseCascadeParticles: 20,
                    distanceSize: {
                        perspectiveBase: 10.0,
                        falloffRate: 0.0,
                        falloffExponent: 1.0,
                        minPointSize: 1.0,
                        maxPointSize: 20.0
                    },
                    lod: {
                        enabled: true,
                        nearDistance: 14.0,
                        farDistance: 42.0,
                        minDensity: 0.42,
                        minOpacity: 0.55
                    }
                }
            );
            this.cascadeParticles = this.cascadeParticleSystem; // compatibility alias
            const lifecycleSource = this.nodeLinkingSystem ?? this.linkingSystem ?? this.nodeLinking ?? null;
            this.cascadeParticleSystem?.setSemanticBus?.(this.semanticBus ?? this.cascadeParticleSystem?.semanticBus ?? null);
            this.cascadeParticleSystem?.attachLinkLifecycleSource?.(lifecycleSource);
            if (this.cascadeParticleSystem?.mesh && this.scene && !this.cascadeParticleSystem.mesh.parent) {
                this.scene.add(this.cascadeParticleSystem.mesh);
            }
            
        } catch (err) {
        }
    }

    /**
     * Setup CASCADE RESONANCE WAVE VISUALIZATION
     * Visualizes subtle wave propagation between synchronized hubs
     */
    setupCascadeResonanceWaveVisualization() {
        try {
            const cascadeSystem = this.harmonicCascadeAmplification;
            const harmonicHubSystem = this.harmonicHubAuraSystem;
            const linkResonanceSystem = this.linkResonanceSystem || this.harmonicResonanceCoupling;

            if (!cascadeSystem || !harmonicHubSystem || !linkResonanceSystem) {
                console.warn('[main.js] CascadeResonanceWaveVisualization pending: dependencies not ready');
                return;
            }

            if (this.cascadeResonanceWave) {
                this.cascadeResonanceWave.rebind({
                    cascadeSystem,
                    harmonicHubSystem,
                    linkResonanceSystem,
                    semanticBus: this.semanticBus,
                    frameScheduler: this.frameScheduler
                });
                this.cascadeResonanceWaveVisualization = this.cascadeResonanceWave;
                this._wireCascadeParticlePipeline(cascadeSystem);
                return;
            }

            this.cascadeResonanceWave = new CascadeResonanceWaveVisualization_Session146(
                cascadeSystem,
                harmonicHubSystem,
                linkResonanceSystem,
                {
                    enabled: true,
                    debugMode: false,
                    waveInfluenceMin: 0.25,
                    waveInfluenceMax: 0.50,
                    waveDecayRate: 0.98,
                    minHubCorruptionThreshold: 0.25,
                    minHubStabilityThreshold: 0.65,
                }
            );
            this.cascadeResonanceWave.rebind({
                cascadeSystem,
                harmonicHubSystem,
                linkResonanceSystem,
                semanticBus: this.semanticBus,
                frameScheduler: this.frameScheduler
            });
            this.cascadeResonanceWave.setEventBus?.(this.semanticBus);
            this.cascadeResonanceWaveVisualization = this.cascadeResonanceWave;

            this._wireCascadeParticlePipeline(cascadeSystem);
            
            console.log('[main.js] CascadeResonanceWaveVisualization initialized ✓');
        } catch (err) {
            console.warn('[main.js] CascadeResonanceWaveVisualization initialization failed:', err);
        }
    }

    _wireCascadeParticlePipeline(cascadeSystem) {
        const linkingSystem = this.nodeLinkingSystem ?? this.linkingSystem ?? this.nodeLinking ?? null;

        if (this.cascadeParticleSystem && linkingSystem) {
            this.cascadeParticleSystem.setSemanticBus?.(this.semanticBus ?? this.cascadeParticleSystem.semanticBus ?? null);
            this.cascadeParticleSystem.attachLinkLifecycleSource(linkingSystem);
            if (this.cascadeParticleSystem.mesh && this.scene && !this.cascadeParticleSystem.mesh.parent) {
                this.scene.add(this.cascadeParticleSystem.mesh);
            }
            console.log('[main.js] CascadeParticleSystem wired to cascade pipeline ✓');
        }
    }

    /**
     * Setup RESONANCE CASCADE VISUALIZATION
     * Visualizes resonance cascades from conflict zones
     */
    setupResonanceCascadeVisualization() {
        try {
            // Create stubs if systems don't exist
            if (!this.conflictSystem) {
                this.conflictSystem = {
                    getConflictState: () => ({ intensity: 0, active: false })
                };
                console.warn('[main.js] ConflictSystem stub created');
            }
            
            if (!this.resonanceSystem) {
                this.resonanceSystem = {
                    getResonanceState: () => ({ intensity: 0, active: false })
                };
                console.warn('[main.js] ResonanceSystem stub created');
            }
            
            // FIX 2: Pass scene as first arg; options as second (matches constructor signature)
            this.resonanceCascadeVisualization = new ResonanceCascadeVisualization_Session117B(
                this.scene,
                {
                    conflictSystem: this.conflictSystem,
                    resonanceSystem: this.resonanceSystem,
                    linkingSystem: this.linkingSystem,
                    enabled: true,
                    debugMode: false,
                    semanticBus: this.semanticBus ?? null
                }
            );
            this.resonanceCascadeVisualization.frameScheduler = this.frameScheduler;
            this.resonanceCascade = this.resonanceCascadeVisualization;
            
            console.log('[main.js] ResonanceCascadeVisualization initialized ✓');
        } catch (err) {
            console.warn('[main.js] ResonanceCascadeVisualization initialization failed:', err);
        }
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.postProcessing?.onWindowResize?.(this.renderer.domElement.width, this.renderer.domElement.height);
        this.luminosityBloom?.onWindowResize?.(this.renderer.domElement.width, this.renderer.domElement.height);
    }

    visualNetworkTimeElasticityTick(deltaTime) {
        // Update Network Time Score system (score counter + visual time elasticity)
        // Score: counts UP at 5/sec, REWINDS at 3.5/sec when canonical global.synergy.high is sustained 5s
        // Visual: animation time reversal during rewind
        if (this.visualNetworkTimeElasticity) {
            const rawNetworkMetrics = this.metricsRuntime_v1?.getRawNetworkMetrics?.() || null;
            const runIdentityMetrics = this._applyRunIdentityMetricsOverlay(rawNetworkMetrics || {});
            this.visualNetworkTimeElasticity.setNetworkMetricsSnapshot(runIdentityMetrics || {});
            this.visualNetworkTimeElasticity.update(deltaTime, this.time);
            
            // Store visual time for use in animation systems
            window.VISUAL_TIME = this.visualNetworkTimeElasticity.getVisualTime();

            // Store score state for HUD and other consumers
            window.__ATOMA_NETWORK_TIME__ = this.visualNetworkTimeElasticity.getNetworkTime();
            window.__ATOMA_SCORE_DIRECTION__ = this.visualNetworkTimeElasticity.getDirection();

            // ALPHA CLARITY: show rewind-block hint once when blocked
            const scoreState = this.visualNetworkTimeElasticity.getScoreState?.() || null;
            const dir = this.visualNetworkTimeElasticity.getDirection();
            const buildState = this.coreMetricsOverlay?.hud?.getCurrentBuildState?.(scoreState) || null;
            this.firstRunGuidanceDirector?.update?.({
                world: this.currentMode,
                scoreState,
                buildState
            });
            if (
                this.gameplayHintLayer
                && !this._hintRewindBlockShown
                && !this.firstRunGuidanceDirector?.isActive?.()
                && dir === 'FORWARD'
                && scoreState?.rewindBlockReason
            ) {
                this._hintRewindBlockShown = true;
                this.gameplayHintLayer.show('rewindBlock', {
                    world: this.currentMode,
                    reason: scoreState.rewindBlockReason
                });
            }
        }

        // Update LinkCollapseEventFX (shockwave animations, burst lifecycle)
        if (this.linkCollapseEventFX) {
            this.linkCollapseEventFX.update(deltaTime);
        }
    }

    // REMOVED: synergyPulseVisualsTick() — moved to LEGACY/april (2026-04-22)

    harmonicResonanceCouplingTick(deltaTime) {
        // Update harmonic resonance coupling (synergy-driven link resonance particles & effects)
        if (this.harmonicResonanceCoupling) {
            const visualMetrics = getCachedVisualMetrics() || this.nodeDynamicMetrics || {};
            const avgSynergy = visualMetrics.avgSynergy ?? visualMetrics.networkSynergy ?? 0.0;
            this.harmonicResonanceCoupling.update(deltaTime, avgSynergy);
        }
    }

    harmonicHubAuraSystemTick(deltaTime) {
        if (this.harmonicHubAuraSystem && this.aiNodes) {
            this.harmonicHubAuraSystem.update(deltaTime, this.aiNodes.nodes);
        }
    }

    // REMOVED: harmonicInfluencePropagationTick — moved to LEGACY (2026-05-14)

    linkResonanceFlowSystemTick(deltaTime) {
        if (this.linkRendererConduit?.updateLinkResonanceFlow && this.linkRendererConduit?.linkResonanceFlowSystem) {
            this.linkRendererConduit.updateLinkResonanceFlow(
                deltaTime,
                VisualTime.now,
                this.linkingSystem?.links || [],
                this.camera
            );
            return;
        }

        if (this.linkResonanceFlowSystem && this.linkingSystem) {
            const links = this.linkingSystem.links || [];
            const camera = this.camera;
            this.linkResonanceFlowSystem.update(deltaTime, links, camera);
        }
    }

    harmonicPhaseSynchronizationTick(deltaTime) {
        if (this.harmonicPhaseSynchronization) {
            this.harmonicPhaseSynchronization.update(deltaTime);
        }
    }

    // REMOVED: harmonicNodeResonanceHalosTick — moved to LEGACY (2026-05-14)

    updateHoverGlyphTarget() {
        const state = (typeof window !== 'undefined') ? window.__crosshairRaycastState : null;
        const node = state?.node || null;
        if (node === this._lastHoverGlyphTarget) return;
        this._lastHoverGlyphTarget = node;
        if (this.semanticGlyphAI?.setHoverTarget) {
            this.semanticGlyphAI.setHoverTarget(node);
        }
        if (this.glyphLayer4?.hoverOnlyMode && this.glyphLayer4?.setHoverNode) {
            this.glyphLayer4.setHoverNode(node);
        }
    }

    cascadeVisualizerTick(deltaTime) {
        if (this.cascadeVisualizer) {
            this.cascadeVisualizer.update(deltaTime);
        }
    }

    synergyChainReactionTick(deltaTime) {
        if (!this.synergyChainReaction || !this.aiNodes) return;
        // emitEvents mirrors enabled unless overridden externally
        this.synergyChainReaction.emitEvents = this.synergyChainReaction.emitEvents && this.synergyChainReaction.enabled;
        this.synergyChainReaction.update(deltaTime, this.aiNodes.nodes || []);
    }

    runVisualSemanticTick(deltaTime, mark) {
        // Semantic/visual 30 Hz logic currently executed inline in animate() when scheduler is unavailable
        // This method exists to satisfy FrameScheduler callbacks.
    }

    runSlowSemanticTick(deltaTime) {
        // Slow semantic 10 Hz logic currently executed inline in animate() when scheduler is unavailable
        // This method exists to satisfy FrameScheduler callbacks.
        if (this.linkCascadeInfectionSystem) {
            this.linkCascadeInfectionSystem.update(deltaTime);
        }
        // REMOVED (2026-03-01): LinkMetricsSanityGuard.update() disabled
        // if (this.linkMetricsSanityGuard) {
        //     this.linkMetricsSanityGuard.update();
        // }
        if (this.semanticActivityFilter) {
            this.semanticActivityFilter.update();
        }
    }

    registerSystem(name, priority, updaterFn) {
        systemRegistry.register(name, { update: updaterFn }, { priority });
    }

    /**
     * Register glyph/link language systems to FrameScheduler (visual layer, 30 Hz)
     * and disable their SystemRegistry tick to avoid double updates.
     */
    registerVisualGlyphSchedulers() {
        if (!this.frameScheduler) return;

        // Visual cadence ~30 Hz
        const fs = this.frameScheduler;

        fs.register('visual', (dt) => this.linkedGlyphMessaging?.update?.(dt, this.aiNodes, this.linkingSystem), 'linkedGlyphMessaging');
        fs.register('visual', (dt) => this.recursiveGlyphMessaging?.update?.(dt, this.aiNodes, this.linkingSystem), 'recursiveGlyphMessaging');
        fs.register('visual', (dt) => {
            const pictos = this.linkPictogramSystem ?? this.linkSemanticPictograms;
            pictos?.update?.(dt, this.time, this.aiNodes?.nodes);
        }, 'linkPictogramSystem');

        // Prevent double-running in SystemRegistry loop
        systemRegistry.disable('linkedGlyphMessaging');
        systemRegistry.disable('recursiveGlyphMessaging');
        systemRegistry.disable('recursiveGlyphSignalSystem');
        systemRegistry.disable('linkPictogramSystem');
    }

    configureSystemRegistry() {
        let priority = 10;
        const reg = (name, fn) => {
            this.registerSystem(name, priority, fn);
            priority += 10;
        };

        // Helper: skip SystemRegistry execution when FrameScheduler already owns the system
        const regGuard = (name, schedulerKey, fn) => {
            reg(name, (dt) => {
                if (this.frameScheduler?.isRegistered?.(schedulerKey)) return;
                fn(dt);
            });
        };

        regGuard('activeWorld', 'visual.activeWorld', (dt) => {
            if (this.activeWorld) this.activeWorld.update(dt, this.time);
        });
        // DISABLED: regGuard nodeEditor — moved to LEGACY (2026-05-14)
        regGuard('hazards', 'simulation.hazards', (dt) => {
            if (this.hazards) {
                this.hazards.update(dt);
                const hazardEffect = this.hazards.getHazardEffect(this.player?.position);
                if (hazardEffect && this.player?.position?.add) {
                    this.player.position.add(hazardEffect.multiplyScalar(0.5));
                }
            }
        });
        regGuard('aiNodes', 'visual.aiNodes', (dt) => {
            if (!this.aiNodes) return;
            const aiNodesUpdateStart = performance.now();
            this.aiNodes.update(dt, this.time);
            this.updateValidator?.markSystemUpdate('aiNodes.update', performance.now() - aiNodesUpdateStart);
            this.nodeUiAcc = (this.nodeUiAcc || 0) + dt;
            if (this.nodeUiAcc >= 0.1) {
                this.nodeUiAcc = 0;
                this.updateNodeUI();
            }
        });
        regGuard('aiNodeSpawning', 'simulation.aiNodeSpawning', () => {
            this.aiNodes?.updateSpawning?.(Date.now());
        });
        regGuard('undoRedoUi', 'simulation.undoRedoUi', (dt) => {
            this.undoUiAcc = (this.undoUiAcc || 0) + dt;
            if (this.undoUiAcc >= 0.1) {
                this.undoUiAcc = 0;
                this.updateUndoRedoUI();
            }
        });
        // SemanticEventBus drain + HUD lanes tick (critical for event-driven audio routing).
        regGuard('visualOverlayTick', 'visual.visualOverlayTick', (dt) => this.runVisualOverlayTick(dt));


        // DEACTIVATED: Replaced by VisualHierarchyRegistry (Daniel request 2026-03-03)
        // reg('visualHierarchyCorrection', (dt) => this.visualHierarchyCorrection?.update?.(dt));
        // regGuard('dynamicLinkColorSystem', 'visual.dynamicLinkColorSystem', (dt) => this.dynamicLinkColorSystem?.update?.(dt));  // LEGACY/april
        regGuard('linkQualityCalculator', 'simulation.linkQualityCalculator', (dt) => this.linkQualityCalculator?.update?.(dt));
        regGuard('linkDegradationSystem', 'simulation.linkDegradationSystem', (dt) => this.linkDegradationSystem?.update?.(dt));

        regGuard('linkMetricsToVisualBridge', 'visual.linkMetricsToVisualBridge', (dt) => this.linkMetricsToVisualBridge?.update?.(dt));
        // regGuard('stressBasedParticleScaler', 'visual.stressBasedParticleScaler', (dt) => this.stressBasedParticleScaler?.update?.(dt));  // LEGACY/april
        regGuard('cascadeVisualizerTick', 'visual.cascadeVisualizer', (dt) => { if (!this._runCascadeVisualizerPending) this.cascadeVisualizerTick?.(dt); });
        regGuard('visualNetworkTimeElasticity', 'simulation.visualNetworkTimeElasticity', (dt) => {
            if (this._runElasticityPending) {
                this._runElasticityPending = false;
                this.visualNetworkTimeElasticityTick?.(dt);
            }
        });
        // REMOVED: synergyPulseVisuals regGuard — moved to LEGACY/april (2026-04-22)
        regGuard('harmonicResonanceCoupling', 'visual.harmonicResonanceCoupling', (_dt) => {
            if (this._runHarmonicResonancePending) {
                this._runHarmonicResonancePending = false;
                this.harmonicResonanceCouplingTick?.(this._pendingHarmonicResonanceDt);
            }
        });
        regGuard('harmonicHubAuraSystem', 'visual.harmonicHubAuraSystem', (_dt) => {
            if (this._runHarmonicHubAuraPending) {
                this._runHarmonicHubAuraPending = false;
                this.harmonicHubAuraSystemTick?.(this._pendingHarmonicHubAuraDt);
            }
        });
        // REMOVED: regGuard for harmonicInfluencePropagation — moved to LEGACY (2026-05-14)
        regGuard('linkResonanceFlowSystem', 'visual.linkResonanceFlowSystem', (_dt) => {
            if (this._runLinkResonanceFlowPending) {
                this._runLinkResonanceFlowPending = false;
                this.linkResonanceFlowSystemTick?.(this._pendingLinkResonanceFlowDt);
            }
        });
        regGuard('harmonicPhaseSynchronization', 'visual.harmonicPhaseSynchronization', (_dt) => {
            if (this._runHarmonicPhaseSyncPending) {
                this._runHarmonicPhaseSyncPending = false;
                this.harmonicPhaseSynchronizationTick?.(this._pendingHarmonicPhaseSyncDt);
            }
        });
        // REMOVED: regGuard for harmonicNodeResonanceHalos — moved to LEGACY (2026-05-14)
        regGuard('audioSynergyMonitor', 'simulation.audioSynergyMonitor', (dt) => {
            if (this.audioSystem) {
                const canonicalWorldContext = this._getAudioWorldContext();
                this.audioSystem.update?.(dt, {
                    ...canonicalWorldContext,
                    semanticBus: this.semanticBus
                });
                this.harmonicAudio?.setAudioIdentityContext?.(canonicalWorldContext.audioIdentity);
            }
            if (this.audioSystem?.initialized && this.audioModulation && this.nodeDynamicMetrics) {
                this.audioModulation.update(dt, {
                    synergy: this.nodeDynamicMetrics.avgSynergy || 0,
                    harmony: this.nodeDynamicMetrics.avgHarmony || 50,
                    corruption: this.nodeDynamicMetrics.avgCorruption || 0
                }, this._buildAudioIdentityContext());
            }
            if (this.audioSystem && this.nodeDynamicMetrics) {
                const avgSynergy = this.nodeDynamicMetrics?.avgSynergy ?? 0.0;
                if (avgSynergy >= this.synergyActivationThreshold) {
                    this.previousSynergyState = 'active';
                } else if (avgSynergy < this.synergyFadingThreshold && this.previousSynergyState === 'active') {
                    this.semanticBus.emit('synergy.fade', {
                        synergy: avgSynergy
                    }, { priority: this.semanticBus.priority.INTERACTIVE });
                    this.previousSynergyState = 'fading';
                } else if (avgSynergy < this.synergyFadingThreshold && this.previousSynergyState === 'fading') {
                    this.previousSynergyState = 'none';
                }
            }
        });
        regGuard('echoTrailsIntegration', 'visual.echoTrailsIntegration', () => {
            // FIX 5: Removed hard gate on nodeDynamicMetrics — falls back to 0.0 if absent
            if (this.echoTrailsIntegration) {
                const visualMetrics = getCachedVisualMetrics() || this.nodeDynamicMetrics || {};
                const avgSynergy = visualMetrics.avgSynergy ?? visualMetrics.networkSynergy ?? 0.0;
                const visualTime = window.VISUAL_TIME ?? this.time;
                this.echoTrailsIntegration.updateAllMaterials(this.time, visualTime, avgSynergy);
            }
        });
        reg('frameAccounting', (_dt) => {
            this.frameCount = (this.frameCount || 0) + 1;
            window.__atomaPerf.frameCount += 1;
            if (window.__atomaPerf.frameCount % 300 === 0) {
                const fc = window.__atomaPerf.frameCount;
                console.log('ATOMA PERF (avg ms per frame):');
                for (const k in window.__atomaPerf.systems) {
                    console.log(k, (window.__atomaPerf.systems[k] / fc).toFixed(3));
                }
            }
        });
        regGuard('metricsVisualFX', 'visual.metricsVisualFX', (dt) => {
            if (this.metricsVisualFX && this.aiNodes && !this._runVisualSemanticPending) {
                this.metricsVisualFX.update(dt, this.aiNodes.nodes);
            }
        });
        regGuard('worldRuntime_v1', 'visual.worldRuntime_v1', (dt) => this.worldRuntime_v1?.update?.(dt));
        regGuard('fxRuntime_v1', 'visual.fxRuntime_v1', (dt) => this.fxRuntime_v1?.update?.(dt));
        regGuard('nodeEditorRuntime_v1', 'simulation.nodeEditorRuntime_v1', (dt) => this.nodeEditorRuntime_v1?.update?.(dt));
        regGuard('inputRuntime', 'InputRuntime_v1', (dt) => {
            const runtime = this.inputRuntime ?? this.inputRuntime_v1;
            runtime?.update?.(dt);
        });
        regGuard('nodeInteraction', 'realtime.nodeInteraction', (dt) => this.nodeInteractionEngine?.update?.(dt));
        regGuard('metricsRuntime_v1', 'simulation.metricsRuntime_v1', (dt) => this.metricsRuntime_v1?.update?.(dt));
        regGuard('aiHudReports', 'simulation.aiHudReports', () => this._refreshAIHudReports?.());
        // REMOVED: personalityRuntime_v1 regGuard — moved to LEGACY/april (2026-04-22)
        // REMOVED: personalityShaderBridge + advancedShaderFX regGuard — moved to LEGACY/ (2026-05-14)
        // regGuard('personalityShaderBridge', 'visual.personalityShaderBridge', (dt) => this.personalityShaderBridge?.update?.(dt));
        // regGuard('advancedShaderFX', 'visual.advancedShaderFX', (dt) => this.advancedShaderFX?.update?.(dt));
        regGuard('archetypeAuraFX', 'visual.archetypeAuraFX', (dt) => this.archetypeAuraFX?.update?.(dt));
        regGuard('archetypeColorFX', 'visual.archetypeColorFX', (dt) => this.archetypeColorFX?.update?.(dt));
        regGuard('archetypeShaderModes', 'visual.archetypeShaderModes', (dt) => this.archetypeShaderModes?.update?.(dt));
        regGuard('nodeShaderActivation', 'visual.nodeShaderActivation', (dt) => this.nodeShaderActivation?.update?.(dt));

        regGuard('synergyBonusFXLayer', 'visual.synergyBonusFXLayer', (dt) => {
            if (this.synergyBonusFXLayer && this.nodeLinking) {
                this.synergyBonusFXLayer.update(dt, this.nodeLinking.links || []);
            }
        });
        regGuard('synergyResonanceShaderPack', 'visual.synergyResonanceShaderPack', (dt) => {
            if (this.synergyResonanceShaderPack && this.nodeLinking) {
                this.synergyResonanceShaderPack.update(dt, this.nodeLinking.links || []);
            }
        });

        // REMOVED: synergyCascadeFXBridge regGuard — moved to LEGACY/april (2026-04-22)

        regGuard('edgeCageDistanceFade', 'visual.edgeCageDistanceFade', (dt) => {
            this.aiNodes?.updateEdgeCageDistanceFade?.(dt, this.camera);
        });
        regGuard('synergyTravelingWaveFX', 'visual.synergyTravelingWaveFX', (dt) => this.synergyTravelingWaveFX?.update?.(dt, this.time || 0));
        regGuard('synergyHighwayVisuals3D', 'visual.synergyHighwayVisuals3D', (dt) => {
            if (!this.synergyHighwayVisuals3D) return;
            this._synergyHighwayRefreshAcc = (this._synergyHighwayRefreshAcc || 0) + dt;
            if (this._synergyHighwayRefreshAcc >= 0.5) {
                this.synergyHighwayVisuals3D?.updateVisuals?.();
                this.synergyHighwayVisuals3D.refreshFromHighways?.();
                this._synergyHighwayRefreshAcc = 0;
            }
            this.synergyHighwayVisuals3D.update?.(dt);
        });




        regGuard('standingWaveRenderer', 'visual.waveStandingRenderer', (dt) => {
            if (this.activeLinkCount === 0) return;
            this.standingWaveRenderer?.update?.(dt, this.time);
        });
        regGuard('nodeAuraRenderer', 'visual.nodeAuraRenderer', (dt) => {
            this.nodeAuraRenderer?.update?.(dt);
        });
        regGuard('nodeAuraSystem', 'visual.nodeAuraSystem', (dt) => {
            this.nodeAuraSystem?.update?.(dt, this.aiNodes?.nodes);
        });
        regGuard('linkAuraSystem', 'visual.linkAuraSystem', (dt) => this.linkAuraSystem?.update?.(dt));
        regGuard('linkTrailParticles', 'visual.linkTrailParticles', (dt) => {
            this.linkTrailParticles?.update?.(dt, this.time);
        });
        regGuard('waveInterference', 'visual.waveInterferencePatterns', (dt) => {
            const wavePatternSystem = this.wavePatternSystem || this.waveInterference;
            wavePatternSystem?.update?.(dt, this.time);
        });
        regGuard('waveParticleEmitter', 'visual.harmony.waveParticleEmitter', (dt) => {
            if (this.activeLinkCount === 0) return;
            this.particleEmitter?.update?.(
                dt,
                this.aiNodes?.nodes || [],
                this.linkingSystem?.links || [],
                this.waveInterferenceEngine
            );
        });


        regGuard('microImpulseAdapter', 'visual.microImpulseAdapter', () => this.microImpulseAdapter?.update?.());
        // REMOVED: nodePersonalitySystem regGuard - moved to LEGACY (2026-04-03)
        // regGuard('nodePersonalitySystem', 'simulation.nodePersonalitySystem', (dt) => this.nodePersonalitySystem?.update?.(dt, this.aiNodes?.nodes));
        regGuard('nodeMicroEvents', 'visual.nodeMicroEvents', (dt) => this.nodeMicroEvents?.update?.(dt, this.aiNodes?.nodes));
        regGuard('mythicRitualController', 'simulation.mythicRitualController', (dt) => this.mythicRitualController?.update?.(dt, this.aiNodes?.nodes));
        regGuard('phase8RitualOrchestration', 'visual.phase8RitualOrchestration', (dt) => this.phase8RitualOrchestration?.update?.(dt * 1000));
        // regGuard('mythicSeedGlyph', 'visual.mythicSeedGlyph', (dt) => this.mythicSeedGlyph?.update?.(dt, this.camera));  // LEGACY/april
        regGuard('glyphLayer4', 'visual.glyphLayer4', (dt) => this.glyphLayer4?.update?.(dt));
        regGuard('semanticHoverGlyph', 'simulation.semanticHoverGlyph', () => this.updateHoverGlyphTarget?.());
        regGuard('semanticGlyphAI', 'visual.semanticGlyphAI', (dt) => this.semanticGlyphAI?.update?.(dt, this.aiNodes?.nodes));
        regGuard('glyphFusionOverlay', 'visual.glyphFusionOverlay', (dt) => this.glyphFusionOverlay?.update?.(dt));

        regGuard('linkedGlyphSync', 'visual.linkedGlyphSync', (dt) => this.linkedGlyphSync?.update?.(dt, this.aiNodes, this.linkingSystem));
        // Moved to FrameScheduler visual layer (30 Hz)
        regGuard('linkedGlyphMessaging', 'linkedGlyphMessaging', (dt) => this.linkedGlyphMessaging?.update?.(dt, this.aiNodes, this.linkingSystem));
        regGuard('recursiveGlyphMessaging', 'recursiveGlyphMessaging', (dt) => this.recursiveGlyphMessaging?.update?.(dt, this.aiNodes, this.linkingSystem));
        regGuard('linkPictogramSystem', 'linkPictogramSystem', (dt) => {
            const conduitPictograms = this.linkingSystem?.conduitRenderer?.pictogramSystem || null;
            if (!this.linkPictogramSystem || this.linkPictogramSystem === conduitPictograms) return;
            this.linkPictogramSystem.update?.(dt, this.time, this.aiNodes?.nodes);
        });
        regGuard('narrativePatterns', 'background.narrativePatterns', (dt) => this.narrativePatterns?.update?.(dt, this.aiNodes?.nodes, this.linkingSystem?.links, this.worldMetrics || {}));
        regGuard('hitProxy', 'realtime.hitProxy', (dt) => this.hitProxySystem?.update?.(dt));
        regGuard('t2CorruptionVisualIntegration', 'visual.t2CorruptionVisualIntegration', (dt) => this.t2CorruptionVisualIntegration?.update?.(dt, this.linkingSystem?.links));
        regGuard('t2HarmonyVisualConsumer', 'visual.t2HarmonyVisualConsumer', (dt) => this.t2HarmonyVisualConsumer?.update?.(dt, this.aiNodes, this.harmonyStabilizationSystem));
        regGuard('tier4GameplayIntegration', 'simulation.tier4GameplayIntegration', (dt) => this.tier4GameplayIntegration?.update?.(dt));
        regGuard('phase5MultiNetworkOrchestrator', 'simulation.phase5MultiNetworkOrchestrator', (dt) => this.phase5MultiNetworkOrchestrator?.update?.(dt));
        regGuard('phase5InterNetworkVisualizationBridge', 'visual.phase5InterNetworkVisualizationBridge', (dt) => this.phase5InterNetworkVisualizationBridge?.update?.(dt));
        regGuard('cascadePropagationVisuals', 'visual.cascadePropagation', (dt) => {
            if (this.activeLinkCount === 0) return;
            this.cascadePropagationVisuals?.update?.(dt);
        });
        regGuard('phase5CascadeVisualizationBridge', 'visual.phase5CascadeVisualizationBridge', (dt) => this.phase5CascadeVisualizationBridge?.update?.(dt));
        // REMOVED: preCascadeVisualHint regGuard — moved to LEGACY/april (2026-04-22)
        regGuard('nodeHierarchyBridge', 'simulation.nodeHierarchyBridge', () => this.nodeHierarchyBridge?.update?.());
        // REMOVED (2026-05-14): legendaryPack regGuard — moved to LEGACY
        // regGuard('legendaryPack', 'visual.legendaryPack', (dt) => this.legendaryPack?.update?.(dt, this.scene, this.camera, this.renderer));
        regGuard('legendaryLinkFX', 'visual.legendaryLinkFX', (dt) => this.legendaryLinkFX?.update?.(dt, this.scene, this.camera, this.renderer));
        regGuard('worldEvents', 'background.worldEvents', (dt) => {
            if (this.environmentDomain?.instances?.worldEvents) return;
            this.worldEvents?.update?.(dt, this.legendaryPack, this.linkingSystem, this.evolutionManager);
        });
        regGuard('weatherPack', 'background.weatherPack', (dt) => {
            if (this.environmentDomain?.instances?.weatherPack) return;
            this.weatherPack?.update?.(dt, this.scene, this.camera);
        });
        // REMOVED (2026-05-14): personalityFX regGuard — moved to LEGACY
        // regGuard('personalityFX', 'visual.personalityFX', (dt) => this.personalityFX?.update?.(dt, this.scene, this.camera));
        regGuard('worldFXPack', 'visual.worldFXPack', (dt) => {
            if (this.environmentDomain?.instances?.worldFXPack) return;
            this.worldFXPack?.update?.(dt, this.scene, this.camera);
        });
        regGuard('ambientEntityManager', 'visual.ambientEntityManager', (dt) => this.ambientEntityManager?.update?.(dt));
        // regGuard('emergentThoughtStorms', 'visual.emergentThoughtStorms', (dt) => this.emergentThoughtStorms?.update?.(dt, this.aiNodes, this.linkingSystem));
        regGuard('colonyManager', 'simulation.colonyManager', (dt) => this.colonyManager?.update?.(dt));
        regGuard('dreamDepthPack', 'visual.dreamDepthPack', (dt) => {
            if (this.environmentDomain?.instances?.safeDreamDepthPack) return;
            this.dreamDepthPack?.update?.(dt, this.dreamDepthWorldSystems);
        });
        regGuard('dreamDepthEffects', 'visual.dreamDepthEffects', (dt) => {
            if (this.environmentDomain?.instances?.dreamDepthEffectManager) return;
            this.dreamDepthEffects?.update?.(dt);
        });
        regGuard('mobilityPack', 'visual.mobilityPack', (dt) => this.mobilityPack?.update?.(dt));
        // REMOVED (2026-05-14): evolvingLinkFX regGuard — moved to LEGACY
        // regGuard('evolvingLinkFX', 'visual.evolvingLinkFX', (dt) => this.evolvingLinkFX?.update?.(dt, null, null));
        regGuard('nodePersonality', 'simulation.nodePersonality', (dt) => this.nodePersonality?.update?.(dt, this.time));
        // REMOVED: extremeShaderTestSuite - moved to LEGACY (2026-04-03)
        // regGuard('extremeShaderTestSuite', 'visual.extremeShaderTestSuite', (dt) => this.extremeShaderTestSuite?.update?.(dt));
        // REMOVED (2026-05-14): newNodeCategories regGuard — moved to LEGACY
        // regGuard('newNodeCategories', 'visual.newNodeCategories', (dt) => this.newNodeCategories?.update?.(dt, this.time));
        // regGuard('extremeLinkVisuals', 'visual.extremeLinkVisuals', (dt) => this.extremeLinkVisuals?.update?.(dt));
        // regGuard('extremeLinkVisuals4', 'visual.extremeLinkVisuals4', (dt) => this.extremeLinkVisuals4?.update?.(dt, this.camera));
        // REMOVED: linkVisualMoodSystem - moved to LEGACY (2026-04-03)
        // regGuard('linkVisualMoodSystem', 'visual.linkVisualMoodSystem', (dt) => this.linkVisualMoodSystem?.update?.(dt));
        regGuard('consciousnessLayer', 'visual.consciousnessLayer', (dt) => this.consciousnessLayer?.update?.(dt));
        regGuard('poetryEngine', 'background.poetryEngine', (dt) => this.poetryEngine?.update?.(dt, this.time));
        regGuard('emotionalFeed', 'background.emotionalFeed', (dt) => this.emotionalFeed?.update?.(dt));
        reg('nodeLinking', (dt) => {
            const linkingSystem = this.linkingSystem ?? this.nodeLinkingSystem ?? this.nodeLinking;
            if (!linkingSystem) return;
            if (this.frameScheduler?.isRegistered?.('visual.linkingSystem') === true && linkingSystem === this.linkingSystem) {
                return;
            }
            linkingSystem?.update?.(dt);
        });
        reg('cameraController', (dt) => {
            if (this.frameScheduler?.isRegistered?.('realtime.cameraController')) return;
            const start = performance?.now?.();
            this.cameraController?.update?.(dt);
            if (start !== undefined) {
                this.updateValidator?.markSystemUpdate(
                    'cameraController.update',
                    performance.now() - start
                );
            }
        });
        regGuard('linkDebugMode', 'visual.linkDebugMode', () => { if (this.linkDebugMode?.enabled) this.linkDebugMode.updateDebugVisuals(); });
        regGuard('hardInteractionAuthority', 'visual.hardInteractionAuthority', () => {
            if (this.hardInteractionAuthority && this.scene && (this.frameCount % 180 === 0)) {
                this.hardInteractionAuthority.safetyNet();
            }
        });
        regGuard('regionalEquilibrium', 'simulation.regionalEquilibrium', (dt) => {
            if (!this._runSlowSemanticPending) return;
            if (this.regionalEquilibrium && this.harmonySystem && this.ruptureSystem) {
                this.regionalEquilibrium.update(
                    dt,
                    this.time,
                    {
                        nodes: this.aiNodes?.nodes || [],
                        links: this.linkingSystem?.links || []
                    },
                    this.harmonySystem,
                    this.ruptureSystem,
                    this.standingWaveSystem
                );
            }
        });
        regGuard('cascadingRuptures', 'visual.cascadingRuptures', (dt) => {
            if (!this._runSlowSemanticPending) return;
            if (this.cascadingRuptures?.enabled) {
                this.cascadingRuptures.rebind?.({
                    linkingSystem: this.linkingSystem,
                    aiNodes: this.aiNodes,
                    regionalEquilibrium: this.regionalEquilibrium
                });
                this.cascadingRuptures.update(
                    dt,
                    this.time,
                    this.ruptureSystem,
                    this.harmonySystem
                );
            }
        });
        regGuard('criticalNodeFailure', 'simulation.criticalNodeFailure', (dt) => {
            if (this.criticalNodeFailure?.enabled) {
                this.criticalNodeFailure.rebind?.({
                    linkingSystem: this.linkingSystem,
                    aiNodes: this.aiNodes,
                    scene: this.scene
                });
                this.criticalNodeFailure.update(dt, this.time);
            }
        });
        regGuard('topologyViz', 'simulation.topologyViz', (dt) => {
            if (!this._runSlowSemanticPending) return;
            if (this.topologyViz?.enabled) {
                const networkState = {
                    harmony: this.nodeDynamicMetrics?.avgHarmony || 0.5,
                    corruption: this.nodeDynamicMetrics?.avgCorruption || 0,
                    synergy: this.nodeDynamicMetrics?.avgSynergy || 0,
                    instability: this.nodeDynamicMetrics?.avgInstability || 0,
                    loadPressure: this.nodeDynamicMetrics?.avgLoadPressure || 0,
                    stressPressure: 0,
                    stressLoadBias: 0
                };
                this.topologyViz.update(dt, networkState);
            }
        });


        regGuard('slowSemanticReset', 'background.slowSemanticReset', () => {
            if (this._runSlowSemanticPending) {
                this._runSlowSemanticPending = false;
            }
        });
        regGuard('coreMaterialMutationDetector', 'background.coreMaterialMutationDetector', (dt) => {
            this._coreMaterialMutationSweepAcc = (this._coreMaterialMutationSweepAcc || 0) + dt;
            if (this._coreMaterialMutationSweepAcc < 5) return;
            this._coreMaterialMutationSweepAcc = 0;
            this.coreMaterialMutationDetector?.checkAllCores?.();
        });
        regGuard('coreMaterialPropertyLock', 'background.coreMaterialPropertyLock', (dt) => {
            this._coreMaterialPropertyLockAcc = (this._coreMaterialPropertyLockAcc || 0) + dt;
            if (this._coreMaterialPropertyLockAcc < 5) return;
            this._coreMaterialPropertyLockAcc = 0;
            this.coreMaterialPropertyLock?.enforceFrame?.();
        });
    }

    /**
     * Main animation loop
     */
    animate() {
        this.updateValidator?.startFrame();
        requestAnimationFrame(() => this.animate());
        // REMOVED: window.__enforceProxyVisualLock?.() — was O(N) scene.traverse every frame
        // Proxy visual lock now uses HitProxyRegistry (O(K)) — enforced at proxy creation time

        if (this._startupWorldRefreshPending) {
            this._startupWorldRefreshPending = false;
            const startupMode = this.currentMode || 'quantum';
            console.log('[main.js] Startup world refresh ->', startupMode);
            this.loadWorld(startupMode);
            return;
        }

        const t0 = performance.now();
        const tracingSpike = window.__DBG_SPIKE_TRACE === true;
        const spikeThresholdMs = window.__DBG_SPIKE_TRACE_THRESHOLD_MS ?? 200;
        const frameStart = tracingSpike ? performance.now() : 0;
        const samples = tracingSpike ? [] : null;
        const mark = tracingSpike
            ? (name, fn) => {
                const t0 = performance.now();
                const result = fn();
                samples.push({ name, ms: performance.now() - t0 });
                return result;
            }
            : (_name, fn) => fn();

        if (!window.__atomaPerf) {
            window.__atomaPerf = {
                frameCount: 0,
                systems: {}
            };
        }
        const measure = (name, fn) => {
            const t0Measure = performance.now();
            const result = fn();
            const dt = performance.now() - t0Measure;
            window.__atomaPerf.systems[name] = (window.__atomaPerf.systems[name] || 0) + dt;
            return result;
        };

        const now = performance.now();
        if (this.frameClock) {
            this.frameClock.tick(now);
            
            // Optional debug: Print FrameClock stats every ~120 frames (~2 seconds at 60fps)
            // Uses FrameClock's internal frame counter to avoid conflict with engine frameCount
            if (this.frameClock.frame % 120 === 0) {
                debugLog(window.ATOMA_FLAGS?.debug?.frame, '[FrameClock]', this.frameClock.getStats());
            }
        }

        // ========================================================================
        // PHASE B: FRAME SCHEDULER TICK (Controlled Registration)
        // ========================================================================
        // Call scheduler.tick() to execute registered systems based on layer frequency
        // This runs side-by-side with existing game logic - no throttling yet
        const deltaTime = Math.min(this.clock.getDelta(), 0.1); // Clamp to max 100ms to prevent tab-inactive spikes
        const deltaTimeMs = deltaTime * 1000;
        if (this.isPaused) {
            this.runRenderTick(deltaTime);
            this.updateValidator?.endFrame(deltaTimeMs);
            return;
        }

        this.time += deltaTime;
        if (typeof performance !== 'undefined' && (this.time < 5)) {
            console.log("DT:", deltaTime);
        }
        if (this.spherePolicy?.sweepAllRoots) {
            this.spherePolicy.sweepAllRoots(false, { phase: 'animate' });
        }

        // MetricsRuntime_v1 is scheduler-owned: simulation.metricsRuntime_v1

        // VisualTime infrastructure (INFRA-ONLY, no behavior change): canonical RAF-driven visual clock
        VisualTime.delta = deltaTime;
        VisualTime.now = this.time;
        VisualTime.frameId += 1;

        // Cadence gates: motion stays 60 Hz; semantic/UI work drops to lighter rates
        this.semanticVisualAcc += deltaTime;
        const runVisualSemantic = this.semanticVisualAcc >= this.semanticVisualInterval;
        if (runVisualSemantic && !this._runVisualSemanticPending) {
            this.semanticVisualAcc -= this.semanticVisualInterval;
            if (performance.now() - this.semanticCadenceLastLog >= this.semanticCadenceLogMs) {
                debugLog(window.ATOMA_FLAGS?.debug?.cadence, '[Cadence] semantic/UI @30Hz tick');
                this.semanticCadenceLastLog = performance.now();
            }
            this._pendingVisualSemanticDt = deltaTime;
            this._pendingMark = mark;
            this._runVisualSemanticPending = true;
            this._pendingSynergyPulseDt = deltaTime;
            this._runSynergyPulsePending = true;
            this._pendingHarmonicResonanceDt = deltaTime;
            this._runHarmonicResonancePending = true;
            this._pendingHarmonicHubAuraDt = deltaTime;
            this._runHarmonicHubAuraPending = true;
            this._pendingHarmonicInfluenceDt = deltaTime;
            this._runHarmonicInfluencePending = true;
            this._pendingCascadeVisualizerDt = deltaTime;
            this._runCascadeVisualizerPending = true;
            this._pendingLinkResonanceFlowDt = deltaTime;
            this._runLinkResonanceFlowPending = true;
            this._pendingHarmonicPhaseSyncDt = deltaTime;
            this._runHarmonicPhaseSyncPending = true;
            this._pendingHarmonicNodeHalosDt = deltaTime;
            this._runHarmonicNodeHalosPending = true;
            this._pendingElasticityDt = deltaTime;
            this._runElasticityPending = true;
        }
        this.semanticSlowAcc += deltaTime;
        const runSlowSemantic = this.semanticSlowAcc >= this.semanticSlowInterval;
        if (runSlowSemantic && !this._runSlowSemanticPending) {
            this.semanticSlowAcc -= this.semanticSlowInterval;
            if (performance.now() - this.semanticSlowCadenceLastLog >= this.semanticCadenceLogMs) {
                debugLog(window.ATOMA_FLAGS?.debug?.cadence, '[Cadence] semantic background @10Hz tick');
                this.semanticSlowCadenceLastLog = performance.now();
            }
            this._pendingSlowSemanticDt = deltaTime;
            this._runSlowSemanticPending = true;
        }

        // FrameScheduler drives layer-gated systems (visual/render integration point)
        if (this.frameScheduler) {
            this.frameScheduler.tick(deltaTime);
        }
        
        // Update player and camera
        // migrated to FrameScheduler (Phase C.1)
        // const cameraRotation = this.cameraController.update();
        // this.playerController.update(deltaTime, cameraRotation);

        // Centralized System Registry execution (deterministic, toggleable)
        // RESTORED: systemRegistry.runFrame(this, deltaTime);
        // REASON: 118 legacy systems depend on SystemRegistry (world appears frozen without this)
        // See: SYSTEMREGISTRY_DEPENDENCY_FORENSIC_AUDIT.md
        // NOTE: aiNodes is DISABLED in SystemRegistry to prevent duplicate execution
        // aiNodes.update() runs EXCLUSIVELY via FrameScheduler.register('aiNodes.update', ...)
        systemRegistry.runFrame(this, deltaTime);

        if (tracingSpike) {
            const frameMs = performance.now() - frameStart;
            if (frameMs > spikeThresholdMs) {
                const top = samples
                    .sort((a, b) => b.ms - a.ms)
                    .slice(0, 8);
                const linksCount =
                    this.nodeLinking?.links?.length ??
                    this.linkingSystem?.links?.length ??
                    null;
                const nodesCount = this.aiNodes?.nodes?.length ?? null;
                const programCount = Array.isArray(this.renderer?.info?.programs)
                    ? this.renderer.info.programs.length
                    : (this.renderer?.info?.programs ?? null);
                console.groupCollapsed(`[SPIKE] ${frameMs.toFixed(0)}ms`);
                console.table(top);
                console.log('counts', {
                    links: linksCount,
                    nodes: nodesCount,
                    programs: programCount
                });
                console.groupEnd();
            }
        }

        this.updateValidator?.endFrame(deltaTimeMs);
    }

    /**
     * Update node info UI
     */
    updateNodeUI() {
        const info = this.aiNodes.getActiveNodeInfo();

        // Update status
        const statusEl = document.getElementById('node-status');
        if (statusEl) {
            statusEl.textContent = `AI NODES: ${info.activeNodes}/${info.totalNodes} ACTIVE`;
        }

        // Update categories
        const typesEl = document.getElementById('node-types');
        if (typesEl && info.activeNodes > 0) {
            let html = '';
            for (const [category, count] of Object.entries(info.nodesByCategory)) {
                if (count > 0) {
                    html += `<span class="node-type node-${category}">${category.toUpperCase()}: ${count}</span> `;
                }
            }
            typesEl.innerHTML = html;
        } else if (typesEl) {
            typesEl.innerHTML = '';
        }
    }

    /**
     * Phase D.3: visibility-driven HUD invalidation
     * Phase D.2: priority HUD lanes (critical vs ambient)
     * Adaptive HUD cadence (10-30Hz) with wake-up + dual-lane scheduling on FrameScheduler.visual.
     */
    runVisualOverlayTick(deltaTime) {
        // Drain semantic events and one-shots within small budgets before HUD work
        this.semanticBus?.drain(0.8, 48);
        this.semanticBus?.drainTasks(0.5, 32);
        // Adaptive cadence: adjust targetHz based on camera motion and wake window for critical lane
        const hudHz = this.getHudTargetHz();
        const criticalInterval = 1 / hudHz;
        const ambientInterval = 1 / 8; // AMBIENT_HZ = 8

        this.hudCriticalAcc += deltaTime;
        this.hudAmbientAcc += deltaTime;

        const shouldRunCritical = this.hudCriticalAcc >= criticalInterval;
        const shouldRunAmbient = this.hudAmbientAcc >= ambientInterval;

        const wakeActive = performance.now() < this.hudWakeUntil;
        const criticalReady = shouldRunCritical && (wakeActive || this.hasCriticalDirty());
        const ambientReady = shouldRunAmbient && (wakeActive || this.hasAmbientDirty());

        if (!criticalReady && !ambientReady) return;

        if (typeof window !== 'undefined' && window.DEBUG_VISUAL_MODE) {
            window.__ATOMA_HUD_HZ__ = hudHz;
            window.__ATOMA_HUD_LANES__ = {
                criticalHz: hudHz,
                ambientHz: 8,
                wakeUntil: this.hudWakeUntil
            };
        }

        if (criticalReady) {
            this.hudCriticalAcc -= criticalInterval;
            this.updateHudCritical(deltaTime);
        }

        if (ambientReady) {
            this.hudAmbientAcc -= ambientInterval;
            this.updateHudAmbient(deltaTime);
        }

    }

    updateHudCritical(deltaTime) {
        if (!this.hudVisibility?.critical) return;
        if (!this.hudVisibility.panels.metricsOverlay && !this.hudVisibility.panels.nodeInspector) return;
        const wakeActive = performance.now() < this.hudWakeUntil;
        if (!wakeActive && !this.hasCriticalDirty()) return;

        // System State Overlay critical signals (warnings/alerts)
        if (this.systemStateOverlay && this.coreMetricsOverlay && this.hudVisibility.panels.systemState) {
            this.systemStateOverlay.update(
                deltaTime,
                this.aiNodes?.nodes || [],
                this.coreMetricsOverlay.currentMetrics
            );
            this.setHudDirty('ambient');
            if (this.coreMetricsOverlay?.currentMetrics?.spikeAlert || this.coreMetricsOverlay?.currentMetrics?.spikeActive || this.coreMetricsOverlay?.currentMetrics?.hasSpike) {
                this.semanticBus.emit('metrics.spike', this.coreMetricsOverlay.currentMetrics, { priority: this.semanticBus.priority.CRITICAL });
            }
        }
        this.hudDirty.nodeInspector = false;
    }

    updateHudAmbient(deltaTime) {
        if (!this.hudVisibility?.ambient) return;
        if (!this.hudVisibility.panels.zoneOverlay) return;
        const wakeActive = performance.now() < this.hudWakeUntil;
        if (!wakeActive && !this.hasAmbientDirty()) return;
        // Ambient HUD: zone audio reactivity + background overlays
        if (this.zoneAudioReactivity && this.player && this.hudVisibility.panels.zoneOverlay) {
            this.zoneAudioReactivity.setPlayerPosition(this.player.position);

            if (this.systemStateOverlay?.regionalHarmonyZones?.zones) {
                this.zoneAudioReactivity.setZones(this.systemStateOverlay.regionalHarmonyZones.zones);
            }

            this.zoneAudioReactivity.update(deltaTime);

            if (this.systemStateOverlay?.regionalHarmonyZones) {
                const zoneInfluences = this.zoneAudioReactivity.getZoneInfluences();
                this.systemStateOverlay.regionalHarmonyZones.setZoneAudioInfluences(zoneInfluences);
                this.wakeHud('hud-toggle');
                this.hudDirty.ambient = false;
            }
        }
    }

    /**
     * Compute adaptive HUD cadence from camera motion + wake window (safe fallback at 20Hz)
     */
    getHudTargetHz() {
        const now = performance.now();
        if (now < this.hudWakeUntil) return 30;
        if (!this.camera) return 20;

        const pos = this.camera.position;
        const rot = this.camera.rotation;

        // Compute deltas without allocations
        const deltaPos = this.hudTempDelta.copy(pos).sub(this.hudLastPos).length();
        const deltaRot =
            Math.abs(rot.x - this.hudLastRot.x) +
            Math.abs(rot.y - this.hudLastRot.y) +
            Math.abs(rot.z - this.hudLastRot.z);

        // Update stored samples
        this.hudLastPos.copy(pos);
        this.hudLastRot.set(rot.x, rot.y, rot.z);

        // Simple motion score
        const motion = deltaPos + deltaRot;
        const HIGH_THRESHOLD = 0.02;
        const LOW_THRESHOLD = 0.005;
        const motionNow = performance.now();
        if (motion > LOW_THRESHOLD && motionNow - this.lastCameraMotionEvent > 200) {
            this.lastCameraMotionEvent = motionNow;
            this.semanticBus?.emit('camera.motion', { motion }, { priority: this.semanticBus.priority.INTERACTIVE });
        }

        if (motion > HIGH_THRESHOLD) return 30;
        if (motion > LOW_THRESHOLD) return 20;
        return 10;
    }

    hasCriticalDirty() {
        return !!(this.hudDirty.coreMetrics || this.hudDirty.nodeInspector);
    }

    hasAmbientDirty() {
        return !!this.hudDirty.ambient;
    }

    /**
     * Phase D.1: event-driven HUD wake-up (extends wake window to force 30Hz temporarily)
     */
    wakeHud(reason = 'generic') {
        const now = performance.now();
        const WAKE_WINDOW_MS = 1000;
        this.hudWakeUntil = Math.max(this.hudWakeUntil, now + WAKE_WINDOW_MS);
        if (reason === 'selection') {
            this.setHudDirty('coreMetrics');
            this.setHudDirty('nodeInspector');
        } else if (reason === 'hud-toggle') {
            this.setHudDirty('ambient');
        } else if (reason === 'metric-spike') {
            this.setHudDirty('coreMetrics');
        }
        if (typeof window !== 'undefined' && window.DEBUG_VISUAL_MODE) {
            window.__ATOMA_HUD_WAKE__ = { reason, until: this.hudWakeUntil };
            window.__ATOMA_HUD_VISIBILITY__ = this.hudVisibility;
            window.__ATOMA_HUD_STATE__ = {
                visibility: this.hudVisibility,
                dirty: this.hudDirty,
                wakeUntil: this.hudWakeUntil
            };
        }
        // Reset accumulator so next visual tick runs immediately
        this.hudAccumulator = 0;
        this.hudCriticalAcc = 0;
    }

    setHudVisible(key, visible) {
        if (!this.hudVisibility?.panels) return;
        if (this.hudVisibility.panels[key] === visible) return;
        this.hudVisibility.panels[key] = visible;
        if (key === 'zoneOverlay') {
            this.setHudDirty('ambient');
        } else if (key === 'nodeInspector') {
            this.setHudDirty('nodeInspector');
        } else {
            this.setHudDirty('coreMetrics');
        }
        this.semanticBus.emit('hud.visibility.change', { key, visible }, { priority: this.semanticBus.priority.CRITICAL });
        this.wakeHud('visibility-change');
    }

    isHudVisible(key) {
        if (!this.hudVisibility?.panels) return false;
        return !!this.hudVisibility.panels[key];
    }

    setHudDirty(section) {
        if (!this.hudDirty) return;
        if (section === 'coreMetrics') this.hudDirty.coreMetrics = true;
        if (section === 'nodeInspector') this.hudDirty.nodeInspector = true;
        if (section === 'ambient') this.hudDirty.ambient = true;
        if (typeof window !== 'undefined' && window.DEBUG_VISUAL_MODE) {
            window.__ATOMA_HUD_STATE__ = {
                visibility: this.hudVisibility,
                dirty: this.hudDirty,
                wakeUntil: this.hudWakeUntil
            };
        }
    }

    scheduleSemanticOnce(fn, opts = {}) {
        this.semanticBus?.scheduleTask(fn, opts);
    }

    scheduleVisualOnce(fn) {
        this.scheduleSemanticOnce(fn, { priority: this.semanticBus?.priority?.NORMAL });
    }

    primeLinkShaderMaterials(links = [], reason = 'link-shader-prime') {
        const linkList = Array.isArray(links) ? links.filter(Boolean) : (links ? [links] : []);
        if (linkList.length === 0) {
            return 0;
        }

        let primedCount = 0;
        if (this.synergyBonusFXLayer?.primeMaterials) {
            primedCount += this.synergyBonusFXLayer.primeMaterials(linkList) || 0;
        }
        if (this.synergyResonanceShaderPack?.primeMaterials) {
            primedCount += this.synergyResonanceShaderPack.primeMaterials(linkList) || 0;
        }

        if (primedCount > 0) {
            this.scheduleSceneShaderWarmup(reason);
        }

        return primedCount;
    }

    scheduleSceneShaderWarmup(reason = 'scene') {
        if (!this.renderer || !this.scene || !this.camera) return;
        if (typeof window !== 'undefined' && (
            window.DEBUG_VISUAL_MODE === true ||
            window.__ATOMA_SHADER_FREEZE === true
        )) {
            return;
        }

        if (this._sceneShaderWarmupInFlight) {
            this._sceneShaderWarmupPending = true;
            this._sceneShaderWarmupReason = reason;
            return;
        }

        if (this._sceneShaderWarmupQueued) return;
        this._sceneShaderWarmupQueued = true;
        this._sceneShaderWarmupComplete = false;

        Promise.resolve().then(async () => {
            this._sceneShaderWarmupQueued = false;

            if (!this.renderer || !this.scene || !this.camera) {
                return;
            }

            if (this._sceneShaderWarmupInFlight) {
                this._sceneShaderWarmupPending = true;
                this._sceneShaderWarmupReason = reason;
                return;
            }

            this._sceneShaderWarmupInFlight = true;
            const startedAt = performance.now();

            try {
                if (typeof this.renderer.compileAsync === 'function') {
                    await this.renderer.compileAsync(this.scene, this.camera);
                } else if (typeof this.renderer.compile === 'function') {
                    this.renderer.compile(this.scene, this.camera);
                }
            } catch (err) {
                console.warn('[main.js] Scene shader warmup failed:', err);
            } finally {
                this._sceneShaderWarmupInFlight = false;
                this._sceneShaderWarmupComplete = true;
                if (typeof window !== 'undefined') {
                    window.__shaderWarmupDone = true;
                    window.__ATOMA_WARMUP_COMPLETE = true;
                    if (typeof window.markAtomaWarmupComplete === 'function') {
                        window.markAtomaWarmupComplete();
                    }
                }
                this._sceneShaderWarmupReport = {
                    reason,
                    durationMs: performance.now() - startedAt
                };

                if (this._sceneShaderWarmupPending) {
                    const nextReason = this._sceneShaderWarmupReason || reason;
                    this._sceneShaderWarmupPending = false;
                    this._sceneShaderWarmupReason = null;
                    this.scheduleSceneShaderWarmup(nextReason);
                }
            }
        });
    }

    /**
     * FrameScheduler-driven render tick (visual layer)
     */
    runRenderTick(deltaTime) {
        const frameId = this.frameCount ?? this.frameClock?.frame ?? 0;
        if (this.lastRenderFrame === frameId) {
            // Guard: enforce single renderer.render per RAF tick (FrameUpdateLoopOrderValidator duplicate fix)
            return;
        }
        this.lastRenderFrame = frameId;
        const profile = this.renderProfile;
        profile?.startFrame();
        let usedPostProcessing = false;
        const renderAuditContext = {
            frameId,
            mode: 'baseScene',
            status: 'ok'
        };

        this.gpuSanity?.beginRenderAudit?.(renderAuditContext);

        try {
            this.standingWaveRenderer?.syncTrapZones?.(deltaTime);
            this.postProcessing?.restoreRenderState?.(this.camera);
            this.luminosityBloom?.restoreRenderState?.(this.camera);

            const liveMetrics = typeof window !== 'undefined' ? (window.__ATOMA_LIVE_METRICS__ || null) : null;

            if (this.postProcessingEnabled && this.postProcessing && typeof this.postProcessing.apply === 'function') {
                const result = this.postProcessing.apply(this.scene, this.camera, liveMetrics);
                if (result && Array.isArray(result.operations) && result.operations.length > 0) {
                    const totalStart = performance.now();
                    let baseSceneDuration = 0;
                    let operations = result.operations;
                    let bloomTexture = null;

                    if (
                        this.luminosityBloomEnabled &&
                        this.luminosityBloom &&
                        typeof this.luminosityBloom.apply === 'function'
                    ) {
                        const bloomResult = this.luminosityBloom.apply(
                            this.postProcessing.mainRenderTarget,
                            this.scene,
                            this.camera,
                            liveMetrics
                        );
                        if (bloomResult && Array.isArray(bloomResult.operations) && bloomResult.operations.length > 0) {
                            operations = operations.concat(bloomResult.operations);
                            bloomTexture = bloomResult.outputTexture || null;
                        }
                    }

                    for (const op of operations) {
                        if (!op) continue;

                        const opStart = performance.now();
                        let beforeApplied = false;
                        try {
                            if (typeof op.before === 'function') {
                                op.before();
                                beforeApplied = true;
                            }

                            this.renderer.setRenderTarget(op.target ?? null);
                            this.renderer.render(op.scene ?? this.scene, op.camera ?? this.camera);
                        } finally {
                            if (beforeApplied && typeof op.after === 'function') {
                                op.after();
                            }
                        }

                        const opDuration = performance.now() - opStart;
                        if (op.label === 'baseSceneRender') {
                            baseSceneDuration = opDuration;
                        }
                    }

                    this.renderer.resetState?.();
                    this.renderer.setViewport(0, 0, this.renderer.domElement.width, this.renderer.domElement.height);
                    this.renderer.setScissorTest(false);
                    this.postProcessing?.setBloomTexture?.(bloomTexture);
                    this.postProcessing?.getCompositeOutput?.(this.postProcessing.mainRenderTarget);

                    this.renderer.setRenderTarget(null);
                    const finalStart = performance.now();
                    this.renderer.render(result.outputScene ?? this.scene, result.outputCamera ?? this.camera);
                    const finalDuration = performance.now() - finalStart;
                    const totalDuration = performance.now() - totalStart;

                    if (profile?.enabled) {
                        if (baseSceneDuration > 0) {
                            profile.record('baseSceneRender', baseSceneDuration);
                        }
                        profile.record('postProcessing', totalDuration);
                        profile.record('finalRender', finalDuration);
                    }

                    this.updateValidator?.markSystemUpdate(
                        'renderer.render',
                        totalDuration,
                        { phase: 'present', mode: 'postProcessing' }
                    );

                    usedPostProcessing = true;
                    renderAuditContext.mode = 'postProcessing';
                }
            }

            if (!usedPostProcessing) {
                const baseStart = performance.now();
                this.renderer.setRenderTarget(null);
                this.renderer.render(this.scene, this.camera);
                const baseDuration = performance.now() - baseStart;

                if (profile?.enabled) {
                    profile.record('baseSceneRender', baseDuration);
                    profile.record('finalRender', baseDuration);
                }

                this.updateValidator?.markSystemUpdate(
                    'renderer.render',
                    baseDuration,
                    { phase: 'present' }
                );
            }
        } catch (err) {
            this.postProcessing?.restoreRenderState?.(this.camera);
            this.luminosityBloom?.restoreRenderState?.(this.camera);
            renderAuditContext.status = 'error';
            renderAuditContext.error = err?.message || String(err);
            this.gpuSanity?.endRenderAudit?.({
                ...renderAuditContext,
                scene: this.scene,
                materialRegistry: this.materialRegistry
            });
            if (!this.__renderWarningLogged) {
                console.warn('[FrameScheduler] renderer.render skipped due to runtime error:', err);
                this.__renderWarningLogged = true;
            }
            profile?.endFrame();
            return;
        }

        this.gpuSanity?.endRenderAudit?.({
            ...renderAuditContext,
            scene: this.scene,
            materialRegistry: this.materialRegistry
        });

        profile?.endFrame();

        // Phase B.3 – program stabilization: optional program creation watch (dev-only)
        if (PROGRAM_WATCH_ENABLED && this.renderer?.info?.programs) {
            const count = Array.isArray(this.renderer.info.programs)
                ? this.renderer.info.programs.length
                : (this.renderer.info.programs ?? 0);
            if (count > __phaseB3LastProgramCount) {
                console.log(`[prog-watch] new programs=${count} (+${count - __phaseB3LastProgramCount})`);
                __phaseB3LastProgramCount = count;
            }
        }
    }

    runNodeAuraSystemTick(deltaTime) {
        if (this.nodeAuraSystem && this.aiNodes) {
            this.nodeAuraSystem.update(deltaTime, this.aiNodes.nodes);
        }
    }

    runCameraControllerTick(_deltaTime) {
        if (!this.cameraController) return;
        const start = performance.now();
        this._lastCameraRotation = this.cameraController.update();
        this.updateValidator?.markSystemUpdate(
            'cameraController.update',
            performance.now() - start
        );
    }

    runPlayerControllerTick(deltaTime) {
        if (!this.playerController) return;
        const start = performance.now();
        this.playerController.update(deltaTime, this._lastCameraRotation);
        this.updateValidator?.markSystemUpdate(
            'playerController.update',
            performance.now() - start
        );
    }

    _setupRitualAutoTrigger() {
        if (!this.networkRituals) return;

        this._ritualAutoTriggerState = {
            lastCheck: 0,
            checkInterval: 5000,
            lastTrigger: 0,
            minTriggerCooldown: 60000,
            corruptionThreshold: 0.4,
            minHarmonyRequired: 0.3,
            minParticipants: 3,
        };

        const checkAndTrigger = () => {
            if (!this.networkRituals || !this.aiNodes?.nodes) return;

            const now = Date.now();
            const state = this._ritualAutoTriggerState;

            if (now - state.lastCheck < state.checkInterval) return;
            state.lastCheck = now;

            if (now - state.lastTrigger < state.minTriggerCooldown) return;

            const activeRituals = this.networkRituals.getActiveRituals();
            if (activeRituals.length > 0) return;

            const nodes = this.aiNodes.nodes;
            const eligibleNodes = nodes.filter(node => {
                const harmony = node.userData?.harmonyLevel ?? 0;
                return harmony >= state.minHarmonyRequired;
            });

            if (eligibleNodes.length < state.minParticipants) return;

            let highCorruptionLinks = 0;
            const links = this.linkingSystem?.links || [];
            for (const link of links) {
                const linkId = link?.id || link?.userData?.linkId;
                const liveCorruption = linkId
                    ? this.linkCorruptionTransmission?.linkCorruption?.get?.(linkId)?.level
                    : null;
                const corruption = liveCorruption ?? link.userData?.corruptionLevel ?? 0;
                if (corruption >= state.corruptionThreshold) {
                    highCorruptionLinks++;
                }
            }

            if (highCorruptionLinks < 2) return;

            const connectedClusters = this._findRitualClusters(eligibleNodes);
            if (connectedClusters.length === 0) return;

            const cluster = connectedClusters[0];
            if (cluster.length < state.minParticipants) return;

            const epicenter = cluster[0];
            const participants = cluster.slice(1, Math.min(cluster.length, 5));

            const result = this.networkRituals.initiateRitual(epicenter, participants);

            if (result.success) {
                state.lastTrigger = now;
                console.log('[Phase 8 Auto-Trigger] Ritual initiated:', result.ritualId);

                if (this.semanticBus) {
                    this.semanticBus.emit('ritual.autoTriggered', {
                        ritualId: result.ritualId,
                        epicenterId: epicenter.id,
                        participantCount: participants.length,
                    }, { priority: this.semanticBus.priority?.NORMAL });
                }
            }
        };

        if (this.frameScheduler) {
            this.frameScheduler.register('background', checkAndTrigger, 'background.ritualAutoTrigger');
        }
    }

    _setupPhase8RitualDebugAPI() {
        if (typeof window === 'undefined') return;

        const game = this;
        window.PHASE8_RITUAL = {
            start(epicenterId, participantIds = []) {
                return game._debugStartPhase8Ritual(epicenterId, participantIds);
            },

            startAuto(options = {}) {
                return game._debugStartPhase8RitualAuto(options);
            },

            cancel(ritualId = null) {
                return game._debugCancelPhase8Ritual(ritualId);
            },

            status(ritualId = null) {
                return game._debugGetPhase8RitualStatus(ritualId);
            },

            list() {
                return game.networkRituals?.getActiveRituals?.().map((ritual) => ({
                    ritualId: ritual.id,
                    stage: ritual.stage,
                    progress: ritual.progress,
                    participantIds: ritual.participants.map((node) => game._getRuntimeNodeId(node)),
                    clusterId: ritual.clusterId,
                })) ?? [];
            },

            stats() {
                return {
                    network: game.networkRituals?.getNetworkRitualStats?.() ?? null,
                    orchestration: game.phase8RitualOrchestration?.getStats?.() ?? null,
                    bridge: game.phase8VisualBridge?.getStats?.() ?? null,
                    autoTrigger: game._ritualAutoTriggerState ?? null,
                };
            },

            pickAuto(options = {}) {
                return game._debugSelectPhase8Cluster(options);
            },

            triggerCompletionCascade(options = {}) {
                return game._debugTriggerPhase8CascadePreview('harmony', options);
            },

            triggerFailureCascade(options = {}) {
                return game._debugTriggerPhase8CascadePreview('threat', options);
            },

            help() {
                return [
                    'PHASE8_RITUAL.start(epicenterId, [participantId1, participantId2, ...])',
                    'PHASE8_RITUAL.startAuto({ minParticipants: 3, maxParticipants: 5, minHarmonyRequired: 0.3 })',
                    'PHASE8_RITUAL.cancel(ritualId)',
                    'PHASE8_RITUAL.cancel() // cancels first active ritual',
                    'PHASE8_RITUAL.status(ritualId)',
                    'PHASE8_RITUAL.status() // returns all active ritual states',
                    'PHASE8_RITUAL.list()',
                    'PHASE8_RITUAL.stats()',
                    'PHASE8_RITUAL.pickAuto() // preview auto-selected cluster',
                    'PHASE8_RITUAL.triggerCompletionCascade({ epicenterId?, participantIds?, strength? })',
                    'PHASE8_RITUAL.triggerFailureCascade({ epicenterId?, participantIds?, strength? })'
                ].join('\n');
            }
        };
    }

    _setupPhase8ToPhase5CascadeBridge() {
        this._phase8ToPhase5CascadeBridgeCleanup?.();
        this._phase8ToPhase5CascadeBridgeCleanup = null;

        if (!this.networkRituals || !this.cascadePropagationVisuals) {
            return;
        }

        const forwardToCascadeVisuals = (event, cascadeType) => {
            const cascadeData = this._buildPhase8CascadeVisualPayload(event, cascadeType);
            if (!cascadeData) return;
            this.cascadePropagationVisuals.triggerCascade(cascadeData);
        };

        const unsubscribers = [
            this.networkRituals.on('ritual:complete', (event) => {
                forwardToCascadeVisuals(event, 'harmony');
            }),
            this.networkRituals.on('ritual:abort', (event) => {
                forwardToCascadeVisuals(event, 'threat');
            })
        ].filter((unsubscribe) => typeof unsubscribe === 'function');

        this._phase8ToPhase5CascadeBridgeCleanup = () => {
            for (const unsubscribe of unsubscribers) {
                try {
                    unsubscribe();
                } catch (_) {}
            }
        };
    }

    _buildPhase8CascadeVisualPayload(event, cascadeType) {
        if (!event?.ritual) return null;

        const ritual = event.ritual;
        const epicenter = ritual.epicenter || this._resolvePhase8NodeById(this._getRuntimeNodeId(ritual.epicenter));
        const participantNodes = (event.nodeIds || [])
            .map((nodeId) => this._resolvePhase8NodeById(nodeId))
            .filter(Boolean);

        const sourceNode = epicenter || participantNodes[0] || null;
        const sourcePosition = sourceNode?.position || null;
        if (!sourcePosition) return null;

        const targetNodes = participantNodes.filter((node) => node && node !== sourceNode);
        const reconstructedLinks = Array.isArray(ritual.cascadeReconstructions) ? ritual.cascadeReconstructions.length : 0;
        const participantCount = Array.isArray(ritual.participants) ? ritual.participants.length : targetNodes.length + 1;

        let cascadeStrength;
        if (cascadeType === 'harmony') {
            cascadeStrength = Math.max(
                0.4,
                Math.min(1.0, 0.32 + reconstructedLinks * 0.14 + participantCount * 0.06)
            );
        } else {
            cascadeStrength = Math.max(
                0.35,
                Math.min(0.9, 0.38 + participantCount * 0.05)
            );
        }

        return {
            sourceNodeId: this._getRuntimeNodeId(sourceNode),
            sourcePosition,
            cascadeType,
            cascadeStrength: Number.isFinite(event?.cascadeStrength)
                ? event.cascadeStrength
                : cascadeStrength,
            depth: 0,
            targetNodes
        };
    }

    _getRuntimeNodeId(node) {
        return node?.userData?.nodeId || node?.id || node?.uuid || null;
    }

    _resolvePhase8NodeById(nodeId) {
        if (!nodeId) return null;
        return (this.aiNodes?.nodes || []).find((node) => {
            const runtimeId = this._getRuntimeNodeId(node);
            return runtimeId === nodeId;
        }) || null;
    }

    _debugSelectPhase8Cluster(options = {}) {
        const minParticipants = Math.max(2, Math.floor(options.minParticipants ?? 3));
        const maxParticipants = Math.max(minParticipants, Math.floor(options.maxParticipants ?? 5));
        const minHarmonyRequired = Number.isFinite(options.minHarmonyRequired)
            ? options.minHarmonyRequired
            : (this._ritualAutoTriggerState?.minHarmonyRequired ?? 0.3);

        const eligibleNodes = (this.aiNodes?.nodes || []).filter((node) => {
            const harmony = node?.userData?.harmonyLevel ?? 0;
            return harmony >= minHarmonyRequired;
        });

        const clusters = this._findRitualClusters(eligibleNodes)
            .filter((cluster) => cluster.length >= minParticipants)
            .sort((a, b) => b.length - a.length);

        const cluster = clusters[0] || null;
        if (!cluster) {
            return {
                success: false,
                reason: 'No eligible ritual cluster found',
                eligibleNodes: eligibleNodes.length,
                minParticipants,
                minHarmonyRequired,
            };
        }

        const epicenter = cluster[0];
        const participants = cluster.slice(1, Math.min(cluster.length, maxParticipants));

        return {
            success: true,
            epicenterId: this._getRuntimeNodeId(epicenter),
            participantIds: participants.map((node) => this._getRuntimeNodeId(node)),
            clusterSize: cluster.length,
            eligibleNodes: eligibleNodes.length,
            minParticipants,
            minHarmonyRequired,
        };
    }

    _debugStartPhase8Ritual(epicenterId, participantIds = []) {
        if (!this.networkRituals) {
            return { success: false, reason: 'Phase 8 ritual system not initialized' };
        }

        const epicenter = this._resolvePhase8NodeById(epicenterId);
        if (!epicenter) {
            return { success: false, reason: `Epicenter node not found: ${epicenterId}` };
        }

        const participants = [];
        for (const participantId of participantIds) {
            const node = this._resolvePhase8NodeById(participantId);
            if (!node) {
                return { success: false, reason: `Participant node not found: ${participantId}` };
            }
            if (node !== epicenter && !participants.includes(node)) {
                participants.push(node);
            }
        }

        const result = this.networkRituals.initiateRitual(epicenter, participants);
        if (result.success) {
            console.log('[Phase 8 Debug API] Ritual started:', result);
        }
        return result;
    }

    _debugStartPhase8RitualAuto(options = {}) {
        const selection = this._debugSelectPhase8Cluster(options);
        if (!selection.success) return selection;
        return this._debugStartPhase8Ritual(selection.epicenterId, selection.participantIds);
    }

    _debugCancelPhase8Ritual(ritualId = null) {
        if (!this.networkRituals) {
            return { success: false, reason: 'Phase 8 ritual system not initialized' };
        }

        const activeRituals = this.networkRituals.getActiveRituals?.() ?? [];
        const targetRitual = ritualId
            ? activeRituals.find((ritual) => ritual.id === ritualId) || this.networkRituals.rituals?.get?.(ritualId)
            : activeRituals[0];

        if (!targetRitual) {
            return { success: false, reason: ritualId ? `Ritual not found: ${ritualId}` : 'No active ritual to cancel' };
        }

        return this.networkRituals.cancelRitual(targetRitual.id);
    }

    _debugGetPhase8RitualStatus(ritualId = null) {
        if (!this.networkRituals) {
            return { success: false, reason: 'Phase 8 ritual system not initialized' };
        }

        if (ritualId) {
            return this.networkRituals.getRitualStatus(ritualId);
        }

        const activeRituals = this.networkRituals.getActiveRituals?.() ?? [];
        return {
            success: true,
            activeRituals: activeRituals.map((ritual) => this.networkRituals.getRitualStatus(ritual.id)),
            orchestration: this.phase8RitualOrchestration?.getStats?.() ?? null,
            bridge: this.phase8VisualBridge?.getStats?.() ?? null,
        };
    }

    _debugTriggerPhase8CascadePreview(cascadeType, options = {}) {
        if (!this.cascadePropagationVisuals) {
            return { success: false, reason: 'Phase 5 cascade propagation visuals not initialized' };
        }

        let epicenterId = options.epicenterId ?? null;
        let participantIds = Array.isArray(options.participantIds) ? options.participantIds.filter(Boolean) : [];

        if (!epicenterId) {
            const selection = this._debugSelectPhase8Cluster(options);
            if (!selection.success) return selection;
            epicenterId = selection.epicenterId;
            if (participantIds.length === 0) {
                participantIds = selection.participantIds;
            }
        }

        const epicenter = this._resolvePhase8NodeById(epicenterId);
        if (!epicenter) {
            return { success: false, reason: `Epicenter node not found: ${epicenterId}` };
        }

        const participants = participantIds
            .map((participantId) => this._resolvePhase8NodeById(participantId))
            .filter((node) => node && node !== epicenter);

        const syntheticEvent = {
            ritual: {
                epicenter,
                participants: [epicenter, ...participants],
                cascadeReconstructions: new Array(
                    Math.max(0, Math.floor(options.reconstructedLinks ?? participants.length))
                ).fill(null)
            },
            nodeIds: [epicenter, ...participants].map((node) => this._getRuntimeNodeId(node)),
            cascadeStrength: Number.isFinite(options.strength) ? options.strength : undefined
        };

        const cascadeData = this._buildPhase8CascadeVisualPayload(syntheticEvent, cascadeType);
        if (!cascadeData) {
            return { success: false, reason: 'Failed to build cascade payload' };
        }

        this.cascadePropagationVisuals.triggerCascade(cascadeData);

        return {
            success: true,
            cascadeType,
            sourceNodeId: cascadeData.sourceNodeId,
            participantIds: participants.map((node) => this._getRuntimeNodeId(node)),
            cascadeStrength: cascadeData.cascadeStrength,
            targetCount: cascadeData.targetNodes.length
        };
    }

    _findRitualClusters(eligibleNodes) {
        if (!this.linkingSystem?.links) return [];

        const adjacency = new Map();
        for (const node of eligibleNodes) {
            adjacency.set(node.id, new Set());
        }

        for (const link of this.linkingSystem.links) {
            const sourceId = link.source?.id;
            const targetId = link.target?.id;

            if (adjacency.has(sourceId) && adjacency.has(targetId)) {
                adjacency.get(sourceId).add(targetId);
                adjacency.get(targetId).add(sourceId);
            }
        }

        const clusters = [];
        const visited = new Set();

        for (const node of eligibleNodes) {
            if (visited.has(node.id)) continue;

            const cluster = [];
            const queue = [node];

            while (queue.length > 0) {
                const current = queue.shift();
                if (visited.has(current.id)) continue;

                visited.add(current.id);
                cluster.push(current);

                const neighbors = adjacency.get(current.id) || new Set();
                for (const neighborId of neighbors) {
                    if (!visited.has(neighborId)) {
                        const neighborNode = eligibleNodes.find(n => n.id === neighborId);
                        if (neighborNode) queue.push(neighborNode);
                    }
                }
            }

            if (cluster.length >= 3) {
                clusters.push(cluster);
            }
        }

        clusters.sort((a, b) => b.length - a.length);
        return clusters;
    }

    /**
     * Update linking system - LEGACY TRAFFIC UI REMOVED (Session 35)
     */
    updateLinkingUI() {
        if (!VISUAL_SYSTEMS_ENABLED) return;
        if (!this.linkingSystem || !this.linkingSystem.links) return;
        // Legacy NODE CATEGORIES and LINK TRAFFIC overlays removed
        // These were deprecated HTML overlays in index.html
    }
    
    /**
     * [Session 144+] Update undo/redo UI counters
     */
    updateUndoRedoUI() {
        if (!this.linkingSystem || !this.linkingSystem.undoRedo) return;
        
        const undoCountEl = document.getElementById('undo-count');
        const redoCountEl = document.getElementById('redo-count');
        
        if (undoCountEl) {
            const undoCount = this.linkingSystem.undoRedo.getUndoCount();
            undoCountEl.textContent = `Undo: ${undoCount}`;
            undoCountEl.style.opacity = undoCount > 0 ? '1' : '0.5';
        }
        
        if (redoCountEl) {
            const redoCount = this.linkingSystem.undoRedo.getRedoCount();
            redoCountEl.textContent = `Redo: ${redoCount}`;
            redoCountEl.style.opacity = redoCount > 0 ? '1' : '0.5';
        }
    }

    /**
     * Setup Visual Upgrade Superpack - ALL 8 ENHANCEMENT PACKS
     */
    setupVisualSuperpack() {
        this.visualSuperpack = new VisualUpgradeSuperpack(
            this.scene,
            this.camera,
            this.renderer
        );

        // Apply all 8 enhancement packs
        this.visualSuperpack.applyFullUpgrade();
        this.visualSuperpack.setQualityTier(this.visualQualityLevel || 'HIGH');
        this.visualSuperpack.attachSemanticBus?.(this.semanticBus);
        this.visualSuperpack.setWorldContext?.(this._getCanonicalWorldContext());

        // Apply renderer settings
        const settings = this.visualSuperpack.getRendererSettings();
        this.renderer.toneMapping = settings.toneMapping;
        this.renderer.toneMappingExposure = settings.toneMappingExposure;
        this.renderer.outputColorSpace = settings.outputColorSpace;
    }

    _getCanonicalWorldContext() {
        const consciousnessState = this.consciousnessLayer?.getConsciousnessState?.()
            || this.consciousnessLayer?.consciousnessState
            || null;
        const worldMoodState = this.worldPersonalityController?.getMoodState?.() || null;
        const liveMetrics = typeof window !== 'undefined' ? (window.__ATOMA_LIVE_METRICS__ || null) : null;
        const visualPayload = this.visualSuperpack?.getMacroPayload?.() || null;
        const macroState = String(
            visualPayload?.macroState
            || visualPayload?.worldMacroState
            || consciousnessState?.worldMacroState
            || this.worldMacroState
            || 'DORMANT'
        ).toUpperCase();
        const worldContext = {
            consciousnessState: consciousnessState || visualPayload?.worldContext?.consciousnessState || null,
            worldMoodState: worldMoodState || visualPayload?.worldContext?.worldMoodState || null,
            networkState: this.networkState || visualPayload?.worldContext?.networkState || null,
            liveMetrics: liveMetrics || visualPayload?.worldContext?.liveMetrics || null,
            worldMacroState: macroState,
            macroState
        };
        const canonicalContext = visualPayload ? { ...visualPayload } : {};

        canonicalContext.macroState = macroState;
        canonicalContext.worldMacroState = macroState;
        canonicalContext.macroProfile = canonicalContext.macroProfile
            ? { ...canonicalContext.macroProfile }
            : (visualPayload?.macroProfile ? { ...visualPayload.macroProfile } : null);
        canonicalContext.consciousnessState = worldContext.consciousnessState;
        canonicalContext.worldMoodState = worldContext.worldMoodState;
        canonicalContext.networkState = worldContext.networkState;
        canonicalContext.liveMetrics = worldContext.liveMetrics;
        canonicalContext.metrics = liveMetrics || canonicalContext.metrics || null;
        canonicalContext.worldContext = {
            ...(canonicalContext.worldContext || {}),
            ...worldContext,
            macroProfile: canonicalContext.macroProfile || null
        };

        return canonicalContext;
    }

    _buildAudioIdentityContext({ scoreState = null, buildState = null, scoreStateLabel = null } = {}) {
        const resolvedScoreState = scoreState || this.visualNetworkTimeElasticity?.getScoreState?.() || null;
        const resolvedBuildState = buildState || this.coreMetricsOverlay?.hud?.getCurrentBuildState?.(resolvedScoreState) || null;
        const direction = String(
            scoreStateLabel
            || resolvedScoreState?.direction
            || this.visualNetworkTimeElasticity?.getDirection?.()
            || 'forward'
        ).trim().toLowerCase();
        return {
            world: String(this.currentMode || '').trim().toLowerCase() || null,
            runPackage: this.activeRunIdentitySelection?.packageId || 'surge_thread',
            worldState: this.activeRunIdentitySelection?.worldStateId || null,
            buildState: resolvedBuildState?.label || resolvedBuildState?.key || resolvedBuildState || null,
            scoreState: direction
        };
    }

    _getAudioWorldContext(options = {}) {
        const canonicalWorldContext = this._getCanonicalWorldContext();
        const audioIdentity = this._buildAudioIdentityContext(options);
        const worldContext = {
            ...(canonicalWorldContext.worldContext || {}),
            audioIdentity
        };
        return {
            ...canonicalWorldContext,
            world: audioIdentity.world,
            audioIdentity,
            worldContext
        };
    }

    /**
     * Setup cinematic visual upgrade
     */
    setupCinematicUpgrade() {
        this.cinematicUpgrade = new CinematicUpgrade(this.scene, this.camera);
        this.cinematicUpgrade.frameScheduler = this.frameScheduler;
        this.cinematicUpgrade.initialize();
        this.cinematicUpgrade.setQualityTier(this.visualQualityLevel || 'HIGH');

        // Apply color grading
        this.cinematicUpgrade.applyColorGrading(this.renderer);
        this._syncCinematicNodeShaders();

        // Wire into post-processing pipeline for real bloom/vignette modulation
        if (this.postProcessing) {
            this.cinematicUpgrade.setPostProcessing(this.postProcessing);
        }
        if (this.luminosityBloom) {
            this.cinematicUpgrade.setLuminosityBloom?.(this.luminosityBloom);
        }
        this.cinematicUpgrade.setWorldContext?.(this._getCanonicalWorldContext());
    }

    /**
     * Setup node editor system — DISABLED (moved to LEGACY 2026-05-14)
     */
    setupNodeEditor() {
        // DISABLED: NodeEditor moved to LEGACY
    }

    /**
     * Setup environmental hazards
     *
     * Legacy fallback helper. The active boot path now reuses the
     * EnvironmentDomainController-owned instance to avoid duplicate ticks.
     */
    setupHazards() {
        if (this.environmentDomain?.instances?.environmentalHazards) {
            this.hazards = this.environmentDomain.instances.environmentalHazards;
            return this.hazards;
        }

        this.hazards = new EnvironmentalHazards(this.scene, this.camera);
        this.hazards.frameScheduler = this.frameScheduler;

        // Create demo hazards in Fractal Valley
        if (this.currentMode === 'fractal') {
            // Fractal Valley world pass: hazards stay disabled by default.
        }
    }

    /**
     * Setup Safe Evolution Manager - External node evolution system
     * SAFE: Zero modifications to Node class, all state external
     * Runs on the visual layer so evolution overlay updates are synchronized with 30Hz visuals.
     */
    setupEvolutionManager() {
        this.evolutionManager = new SafeEvolutionManager(this.scene);

        // Auto-registers nodes on first update, no invasive setup needed
        if (this.frameScheduler) {
            this.frameScheduler.register(
                'visual',
                (dt) => {
                    if (this.evolutionManager && this.linkingSystem && this.aiNodes) {
                        this.evolutionManager.update(dt, this.aiNodes.nodes, this.linkingSystem);
                    }
                },
                'visual.evolutionManager'
            );
        }
    }

    // REMOVED: setupLegendaryPack - moved to LEGACY (2026-04-03)
    /*
    setupLegendaryPack() {
        this.legendaryPack = new SafeLegendaryNodePack(this.scene);

        // Auto-spawns legendary nodes based on activity, no invasive setup needed
    }
    */

    /**
     * Setup Safe Legendary Link FX - Link enhancements
     * SAFE: Zero modifications to Link objects, VFX overlays only
     */
    setupLegendaryLinkFX() {
        this.legendaryLinkFX = new SafeLegendaryLinkFX(this.scene, this.camera);

        // Auto-enhances links connected to legendary nodes, no invasive setup needed
    }

    /**
     * Setup Safe Legendary World Events - Global event system
     * SAFE: Zero modifications to core systems, VFX overlays only
     */
    setupWorldEvents() {
        this.worldEvents = new SafeLegendaryWorldEvents(this.scene, this.worldRoot, this.camera, this.renderer);

        // Auto-triggers rare global events, no invasive setup needed
    }

    /**
     * Setup Safe AI Weather Pack - Dynamic weather system
     * SAFE: Zero modifications to core systems, VFX overlays only
     */
    setupWeatherPack() {
        this.weatherPack = new SafeAIWeatherPack(this.scene, this.worldRoot, this.environmentRoot, this.camera);

        // Auto-generates dynamic weather, no invasive setup needed
    }

    /**
     * Setup Safe Node Personality FX - DEAD (moved to LEGACY/)
     * Personality now derived from metric tiers via MetricTierClassifier
     */
    setupPersonalityFX() {
        // REMOVED (2026-05-14): SafeNodePersonalityFX moved to LEGACY/ - personality derived from MetricTierClassifier in _NodeMicroEvents
        this.personalityFX = null;

        // Auto-assigns personalities and generates behavioral VFX, no invasive setup needed
    }

    /**
     * Setup Safe World FX Pack - Environmental effects
     * SAFE: Zero shader/material modifications, VFX overlays only
     */
    setupWorldFXPack() {
        this.worldFXPack = new SafeWorldFXPack(this.scene, this.worldRoot, this.environmentRoot, this.camera, null, this.semanticBus);
        if (this.worldFXPack) {
            this.worldFXPack.frameScheduler = this.frameScheduler;
        }

        // Auto-generates environmental effects, no setup needed
    }

    /**
     * Setup Ambient Entity Manager - Holographic VFX entities
     * Ghost orbs, spectres, swarms, phantoms, wisps
     */
    setupAmbientEntities() {
        this.ambientEntityManager = new AmbientEntityManager(this.scene, this.environmentRoot, this.camera);

        // Register world systems (read-only)
        if (this.legendaryPack && this.worldEvents && this.weatherPack && this.linkingSystem) {
            this.ambientEntityManager.registerWorldSystems({
                legendaryPack: this.legendaryPack,
                worldEvents: this.worldEvents,
                weatherPack: this.weatherPack,
                linkingSystem: this.linkingSystem,
                colonyExpansion: this.colonyManager || this.environmentDomain?.instances?.colonyExpansion || null,
                semanticBus: this.semanticBus || null
            });
        }
    }



    // REMOVED: setupMemoryTrails() - moved to LEGACY/GRAVEYARD (2026-04-05)
    // Nodes/links are static, FPS player doesn't see trails - unnecessary GPU cost

    /**
     * Setup Safe Quantum Illusions Pack 1.0
     * SAFE: Pure visual VFX, no gameplay modifications
     */
    setupQuantumIllusions() {
        this.quantumIllusions = new SafeQuantumIllusionsPack1(
            this.scene,
            this.environmentRoot,
            this.camera,
            this.aiNodes,
            this.linkingSystem,
            this.worldEvents,
            this.weatherPack,
            this.legendaryPack
        );

        console.log('✓ Quantum Illusions Pack 1.0 initialized');
    }

    /**
     * Setup Safe Colony Expansion 2.0
     * SAFE: Living AI ecosystem with formation, growth, splitting, merging
     */
    setupColonyManager() {
        this.colonyManager = new SafeColonyExpansion2(this.scene);

        // Initialize with world systems (read-only)
        if (this.aiNodes && this.linkingSystem) {
            const worldSystems = {
                nodes: this.aiNodes.nodes.reduce((acc, node) => {
                    acc[node.uuid || node.id] = node;
                    return acc;
                }, {}),
                links: this.linkingSystem.links || [],
                legendaryRegistry: this.legendaryPack?.registry || null,
                weatherRegistry: this.weatherPack?.registry || null,
                worldEvents: this.worldEvents,
                evolutionRegistry: this.evolutionManager?.registry || null,
                synergyMap: this.synergyMap || {},
                trafficMap: this.trafficMap || {},
                semanticBus: this.semanticBus || null
            };

            this.colonyManager.initialize(worldSystems);
        }

        console.log('✓ Safe Colony Expansion 2.0 initialized');
    }

    /**
     * Setup Safe Dream Depth Pack
     * SAFE: Pure VFX DOF simulation, no camera modifications
     */
    setupDreamDepthPack() {
        if (this.environmentDomain?.instances?.safeDreamDepthPack) {
            this.dreamDepthPack = this.environmentDomain.instances.safeDreamDepthPack;
            this.dreamDepthEffects = this.environmentDomain.instances.dreamDepthEffectManager;
            this.dreamDepthWorldSystems = this._buildDreamDepthWorldSystems();
            return;
        }

        this.dreamDepthPack = new SafeDreamDepthPack(this.scene, this.scene, this.camera, this.renderer);
        this.dreamDepthEffects = new DreamDepthEffectManager(this.scene, this.scene, this.camera, this.renderer);
        this.dreamDepthWorldSystems = this._buildDreamDepthWorldSystems();

        console.log('✓ Safe Dream Depth Pack initialized (fallback path)');
    }

    _buildDreamDepthWorldSystems() {
        return {
            aiNodes: this.aiNodes || null,
            legendaryRegistry: this.legendaryPack?.registry || null,
            weatherRegistry: this.weatherPack?.registry || this.environmentDomain?.instances?.weatherPack?.registry || null,
            worldEvents: this.worldEvents || this.environmentDomain?.instances?.worldEvents || null,
            colonies: this.colonyManager?.registry?.getAllColonies?.() || this.environmentDomain?.instances?.colonyExpansion?.registry?.getAllColonies?.() || [],
            frameScheduler: this.frameScheduler || null
        };
    }

    _syncDreamDepthRefs() {
        if (this.environmentDomain?.instances?.safeDreamDepthPack) {
            this.dreamDepthPack = this.environmentDomain.instances.safeDreamDepthPack;
            this.dreamDepthEffects = this.environmentDomain.instances.dreamDepthEffectManager;
        }
        this.dreamDepthWorldSystems = this._buildDreamDepthWorldSystems();
        this._installDreamDepthDebugBridge();
    }

    setDreamDepthWeatherCondition(weatherKey) {
        if (this.environmentDomain && typeof this.environmentDomain.setDreamDepthWeatherCondition === 'function') {
            this.environmentDomain.setDreamDepthWeatherCondition(weatherKey);
        }
        if (this.dreamDepthPack?.setWeatherCondition) this.dreamDepthPack.setWeatherCondition(weatherKey);
        if (this.dreamDepthEffects?.setWeatherCondition) this.dreamDepthEffects.setWeatherCondition(weatherKey);
    }

    setDreamDepthFocusTargets(targets) {
        if (this.environmentDomain && typeof this.environmentDomain.setDreamDepthFocusTargets === 'function') {
            this.environmentDomain.setDreamDepthFocusTargets(targets);
        }
        if (this.dreamDepthPack?.setFocusTargets) this.dreamDepthPack.setFocusTargets(targets);
        if (this.dreamDepthEffects?.setFocusTargets) this.dreamDepthEffects.setFocusTargets(targets);
    }

    onDreamDepthWorldEvent(eventType) {
        if (this.environmentDomain && typeof this.environmentDomain.onDreamDepthWorldEvent === 'function') {
            this.environmentDomain.onDreamDepthWorldEvent(eventType);
        }
        if (this.dreamDepthPack?.onWorldEvent) this.dreamDepthPack.onWorldEvent(eventType);
        if (this.dreamDepthEffects?.onWorldEvent) this.dreamDepthEffects.onWorldEvent(eventType);
    }

    getDreamDepthDebugInfo() {
        if (this.environmentDomain && typeof this.environmentDomain.getDreamDepthDebugInfo === 'function') {
            return this.environmentDomain.getDreamDepthDebugInfo();
        }

        const safeInfo = this.dreamDepthPack?.getDebugInfo?.() || null;
        const richInfo = this.dreamDepthEffects?.getDebugInfo?.() || null;
        const source = safeInfo || richInfo;

        return {
            activeMode: richInfo ? 'rich-primary' : (safeInfo ? 'low-cost-fallback' : 'none'),
            shared: {
                currentWeatherKey: source?.currentWeatherKey ?? 'none',
                currentWorldEvent: source?.currentWorldEvent ?? 'none',
                currentFocus: source?.currentFocus ?? 'none',
                focusTransition: source?.focusTransition ?? 0,
                pulseCount: source?.pulseCount ?? 0,
                schedulerState: source?.schedulerState ?? 'missing',
                stabilityFactor: source?.stabilityFactor ?? 0
            },
            safe: safeInfo || { role: 'low-cost-fallback', enabled: false, note: 'not-instantiated' },
            rich: richInfo || { role: 'rich-primary', enabled: false, note: 'not-instantiated' }
        };
    }

    _installDreamDepthDebugBridge() {
        if (typeof window === 'undefined') return;
        if (!window.__DEBUG) window.__DEBUG = {};
        window.__DEBUG.getDreamDepthDebugInfo = () => this.getDreamDepthDebugInfo();
        window.__DEBUG.setDreamDepthWeatherCondition = (k) => this.setDreamDepthWeatherCondition(k);
        window.__DEBUG.setDreamDepthFocusTargets = (t) => this.setDreamDepthFocusTargets(t);
        window.__DEBUG.onDreamDepthWorldEvent = (e) => this.onDreamDepthWorldEvent(e);
    }

    _teardownDreamDepthDebugBridge() {
        if (typeof window === 'undefined') return;
        if (!window.__DEBUG) return;
        delete window.__DEBUG.getDreamDepthDebugInfo;
        delete window.__DEBUG.setDreamDepthWeatherCondition;
        delete window.__DEBUG.setDreamDepthFocusTargets;
        delete window.__DEBUG.onDreamDepthWorldEvent;
    }



    /**
     * Setup Safe Mobility Pack 4.0
     * SAFE: Enhanced movement with dash/blink on SHIFT and double jump on double SPACE
     * Zero physics modifications, pure movement modifiers + VFX overlays
     */
    setupMobilityPack() {
        if (!this.player || !this.playerController || !this.cameraController) {
            console.warn('Player systems not initialized, deferring Mobility Pack setup');
            return;
        }

        this.mobilityPack = new SafeMobilityPack4(
            this.scene,
            this.camera,
            this.player,
            this.playerController,
            this.cameraController
        );

        // Print comprehensive status report
        this.mobilityPack.printStatusReport();

        console.log('✓ Safe Mobility Pack 4.0 initialized');
    }

    /**
     * Setup node editor input handling
     */
    setupNodeEditorInput() {
        const handler = (method) => (e) => {
            const linkingSystem = this.linkingSystem || this.nodeLinkingSystem || this.nodeLinking;
            if (linkingSystem && typeof linkingSystem[method] === "function") {
                linkingSystem[method](e);
            }
        };

        document.addEventListener("pointermove", handler("handleMouseMove"));
        document.addEventListener("pointerdown", handler("handleMouseDown"));
        document.addEventListener("pointerup", handler("handleMouseUp"));
    }

    // Global double-click fallback (browser-independent)
    setupDoubleClickFallback() {
        document.addEventListener("dblclick", (e) => {
            const linkingSystem = window.game?.linkingSystem || window.game?.nodeLinkingSystem || window.game?.nodeLinking;
            if (linkingSystem && linkingSystem.handleDoubleClick) {
                linkingSystem.handleDoubleClick(e);
            }
        });
    }

    /**
     * Setup Node Visuals 4.0
     * SAFE: High-quality node visual upgrade system
     * ✓ Hologram core with soft inner glow
     * ✓ Spectral energy rings
     * ✓ Levitation field (local oscillation only)
     * ✓ Neon rim-light
     * ✓ Internal pulse (subtle)
     * ✓ Occlusion halo (static shadow)
     */
    setupNodeVisuals4() {
        if (!this.aiNodes || !this.aiNodes.nodes) {
            console.warn('AI Nodes not initialized, deferring Node Visuals 4.0 setup');
            return;
        }

        console.log('⊗ Node Visuals 4.0 DISABLED (runtime kill switch)');
        this.nodeVisuals4 = null;
        return false;
    }

    /**
     * Setup Node Evolution 2.0
     * SAFE: Visual-only node evolution system
     * ✓ 4 evolution stages per node
     * ✓ Time, synergy, and rare event triggers
     * ✓ Pure visual effects (no world/physics/camera changes)
     * ✓ Node-local effects only
     */
    setupNodeEvolution() {
        if (!this.aiNodes || !this.aiNodes.nodes) {
            console.warn('AI Nodes not initialized, deferring Node Evolution 2.0 setup');
            return;
        }

        console.log('⊗ Node Evolution 2.0 DISABLED (runtime kill switch)');
        this.nodeEvolution = null;
        return false;
    }

    /**
     * Setup Safe Node Archetypes Pack
     * SAFE: Pure visual archetype overlays
     * ✓ 10 unique visual archetypes
     * ✓ Random assignment at spawn only
     * ✓ No gameplay modifications
     * ✓ < 0.3ms overhead per frame
     */
    setupNodeArchetypesPack() {
        if (!this.aiNodes || !this.aiNodes.nodes) {
            console.warn('AI Nodes not initialized, deferring Node Archetypes Pack setup');
            return;
        }

        // DISABLED: SafeNodeArchetypesPack system permanently disconnected
        // this.nodeArchetypesPack = new SafeNodeArchetypesPack(this.scene);

        // Assign archetypes to all current nodes
        // this.aiNodes.nodes.forEach((node, index) => {
        //   const nodeId = node.uuid || `node-${index}`;
        //   this.nodeArchetypesPack.assignArchetype(node, nodeId);
        // });

        // this.nodeArchetypesPack.printStatusReport();

        // console.log('✓ Safe Node Archetypes Pack initialized');
        console.log('⊗ Safe Node Archetypes Pack DISABLED (permanently disconnected)');
    }

    // REMOVED: setupEvolvingLinkFX - moved to LEGACY (2026-04-03)
    /*
    setupEvolvingLinkFX() {
        if (!this.linkingSystem || !this.linkingSystem.links) {
            console.warn('Linking system not initialized, deferring Evolving Link FX setup');
            return;
        }

        this.evolvingLinkFX = new EvolvingLinkFX2_0(this.scene);

        // Track all current links
        this.linkingSystem.links.forEach((link, index) => {
            const linkId = link.uuid || `link-${index}`;
            this.evolvingLinkFX.trackLink(link, linkId);
        });

        this.evolvingLinkFX.printStatusReport();

        console.log('✓ Evolving Link FX 2.0 initialized');
    }
    */

    /**
     * REMOVED: Setup Node Personality 2.0 system
     * Moved to LEGACY (2026-04-03)
     */
    setupNodePersonality() {
        // this.nodePersonality = new NodePersonality2_0(this.scene);
        // this.nodePersonality.initialize();
        // const nodes = (this.aiNodes && this.aiNodes.nodes) ? this.aiNodes.nodes : [];
        // if (nodes.length > 0) {
        //     nodes.forEach((node, index) => {
        //         if (node && node.userData) {
        //             const nodeId = node.uuid || `node-${index}`;
        //             const nodeCategory = node.userData.category || 'input';
        //             const archetypeType = node.userData.archetypeType || null;
        //             const evolutionStage = node.userData.evolutionStage || 1;
        //             this.nodePersonality.assignPersonality(
        //                 node,
        //                 nodeId,
        //                 nodeCategory,
        //                 archetypeType,
        //                 evolutionStage
        //             );
        //         }
        //     });
        // }
        // const stats = this.nodePersonality.getStatistics();
        // console.log('✓ Node Personality 2.0 initialized with ' + stats.activePersonalities + ' active personalities');
        this.nodePersonality = null;
        console.log('⊘ Node Personality 2.0 DISABLED (moved to LEGACY)');
    }


    /**
     * Setup Core Metrics Overlay 1.0
     * Non-intrusive HUD showing network metrics and temporal units
     */
    setupCoreMetricsOverlay() {
        this.coreMetricsOverlay = new CoreMetricsOverlay(this.scene, this.renderer);
        this.coreMetricsOverlay.setMetricsRuntime?.(this.metricsRuntime_v1);
        this._setupFirstRunGuidanceDirector();

        // Wire score system to HUD (score system may already be created)
        this._wireScoreSystemToHUD();
        this._setupRunIdentityDirector();

        // Store reference to game in window for console access
        window.game = this;

        console.log('✓ Core Metrics Overlay 1.0 initialized');
        console.log('  - Use toggleMetricsOverlay() to toggle HUD');
        console.log('  - Use debugMetricsOverlay() to see status');
    }

    _setupFirstRunGuidanceDirector() {
        const profile = loadMenuProfile();
        const onboarding = profile?.onboarding || {};
        const shouldActivate = onboarding.firstRunCompleted !== true
            || Number(onboarding.guidedFlowVersion) !== GUIDED_FLOW_VERSION;

        if (!this.firstRunGuidanceDirector) {
            this.firstRunGuidanceDirector = new FirstRunGuidanceDirector({
                active: shouldActivate,
                hintLayer: this.gameplayHintLayer,
                hud: this.coreMetricsOverlay?.hud || null,
                loreFragmentEmitter: this.loreFragmentEmitter || null,
                onComplete: ({ guidedFlowVersion, firstRunCompleted }) => {
                    const nextProfile = loadMenuProfile();
                    nextProfile.onboarding = {
                        guidedFlowVersion: Number.isFinite(Number(guidedFlowVersion))
                            ? Number(guidedFlowVersion)
                            : GUIDED_FLOW_VERSION,
                        firstRunCompleted: firstRunCompleted === true
                    };
                    saveMenuProfile(nextProfile);
                }
            });
            return;
        }

        this.firstRunGuidanceDirector.bind({
            hintLayer: this.gameplayHintLayer,
            hud: this.coreMetricsOverlay?.hud || null,
            loreFragmentEmitter: this.loreFragmentEmitter || null
        });
    }

    _setupRunIdentityDirector() {
        if (!this.runIdentityDirector) {
            this.runIdentityDirector = new RunIdentityDirector({
                hud: this.coreMetricsOverlay?.hud || null,
                onCommitSelection: (selection) => {
                    this._applyRunIdentitySelection(selection, { source: 'overlay' });
                    this.resume();
                }
            });
            return;
        }

        this.runIdentityDirector.bind({
            hud: this.coreMetricsOverlay?.hud || null
        });
    }

    _prepareRunIdentityForWorld(worldId) {
        if (!this.runIdentityDirector || !isRunIdentityWorld(worldId)) {
            this.activeRunIdentitySelection = null;
            this._runIdentityPendingSelection = null;
            this.coreMetricsOverlay?.hud?.clearRunIdentityTag?.();
            return null;
        }

        this._runIdentityPendingSelection = this.runIdentityDirector.prepareWorld(worldId);
        this.activeRunIdentitySelection = this._runIdentityPendingSelection;
        this.coreMetricsOverlay?.hud?.setRunIdentityTag?.({
            title: this._runIdentityPendingSelection?.hudTitle,
            detail: this._runIdentityPendingSelection?.hudDetail
        });
        return this._runIdentityPendingSelection;
    }

    _getRunIdentityScoreConfigForWorld(worldId) {
        const baseConfig = { ...(AtomaGame.WORLD_SCORE_CONFIG?.[worldId] || {}) };
        const identity = this.activeRunIdentitySelection || this._runIdentityPendingSelection || null;
        if (!identity || identity.world !== String(worldId || '').toLowerCase()) {
            return baseConfig;
        }

        const delta = identity.scoreConfigDelta || {};
        const nextConfig = { ...baseConfig };
        for (const [key, value] of Object.entries(delta)) {
            if (!Number.isFinite(Number(value))) continue;
            nextConfig[key] = (Number(nextConfig[key]) || 0) + Number(value);
        }
        return nextConfig;
    }

    _applyRunIdentitySelection(selection = null, { source = 'runtime' } = {}) {
        const nextSelection = selection || this._runIdentityPendingSelection || null;
        if (!nextSelection) {
          this.activeRunIdentitySelection = null;
          this.coreMetricsOverlay?.hud?.clearRunIdentityTag?.();
          return null;
        }

        this.activeRunIdentitySelection = composeRunIdentitySelection(nextSelection.world, nextSelection);
        this._runIdentityPendingSelection = this.activeRunIdentitySelection;

        this.semanticBus?.setSemanticProfile?.(this.activeRunIdentitySelection.semanticProfile);
        this.aiNodes?.setRunIdentityProfile?.(this.activeRunIdentitySelection.runPackage);
        this.linkQualityCalculator?.setRunIdentityProfile?.(this.activeRunIdentitySelection.linkQualityProfile);
        this.environmentDomain?.setReleaseAtmosphereOverlay?.({
            ...(this.activeRunIdentitySelection.atmosphereOverlay || {}),
            environmentSkin: this.activeRunIdentitySelection.worldState?.environmentSkin || null,
            hazards: {
                ...(this.activeRunIdentitySelection.atmosphereOverlay?.hazards || {}),
                ...(this.environmentalHazardsEnabled === false ? { intensity: -1, density: -1 } : {})
            }
        });
        this.coreMetricsOverlay?.hud?.setRunIdentityTag?.({
            title: this.activeRunIdentitySelection.hudTitle,
            detail: this.activeRunIdentitySelection.hudDetail
        });
        this.audioSystem?.setWorldContext?.(this._getAudioWorldContext());
        this.audioModulation?.setAudioIdentityContext?.(this._buildAudioIdentityContext());
        this.harmonicAudio?.setAudioIdentityContext?.(this._buildAudioIdentityContext());

        if (source === 'overlay' && this.visualNetworkTimeElasticity?.applyWorldConfig) {
            this.visualNetworkTimeElasticity.applyWorldConfig(this._getRunIdentityScoreConfigForWorld(this.currentMode));
        }

        if (typeof window !== 'undefined') {
            window.__ATOMA_RUN_IDENTITY__ = this.activeRunIdentitySelection;
        }

        return this.activeRunIdentitySelection;
    }

    _applyRunIdentityMetricsOverlay(rawMetrics = null) {
        const identity = this.activeRunIdentitySelection || this._runIdentityPendingSelection || null;
        if (!rawMetrics || !identity?.metricsOverlay) {
            return rawMetrics || {};
        }

        const overlay = identity.metricsOverlay;
        const nextMetrics = { ...rawMetrics };
        const scaleMetric = (key, scale) => {
            if (!Number.isFinite(Number(scale))) return;
            const current = Number(nextMetrics[key]);
            if (!Number.isFinite(current)) return;
            nextMetrics[key] = Math.max(0, Math.min(1, current * Number(scale)));
        };

        scaleMetric('networkSynergy', overlay.networkSynergyScale);
        scaleMetric('avgLinkQuality', overlay.avgLinkQualityScale);
        scaleMetric('loadPressure', overlay.loadPressureScale);
        scaleMetric('corruption', overlay.corruptionScale);
        scaleMetric('corruptionLevel', overlay.corruptionScale);
        scaleMetric('harmonyFlow', overlay.harmonyScale);
        scaleMetric('networkStress', overlay.stabilityScale);
        return nextMetrics;
    }

    _triggerRunIdentityOverlayForCurrentWorld() {
        if (!this.runIdentityDirector?.handleWorldLoad?.(this.currentMode)) {
            return false;
        }
        this.pause();
        return true;
    }

    _handleRunIdentityMilestone(milestone, world = this.currentMode) {
        this.runIdentityDirector?.handleMilestone?.(milestone, world);
    }

    runCoreMetricsOverlayTick(deltaTime) {
        if (!this.coreMetricsOverlay) return;
        if (!this.hudVisibility?.panels?.metricsOverlay) return;
        if (!UIVisibilityConfig.coreMetrics) return;
        const nodeManager = this.aiNodes || null;
        const start = performance.now();
        this.coreMetricsOverlay.update(
            deltaTime,
            nodeManager,
            this.linkingSystem,
            this.nodeEvolution,
            null
        );
        this.updateValidator?.markSystemUpdate(
            'coreMetricsOverlay.update',
            performance.now() - start
        );
        this.hudDirty.coreMetrics = false;
    }

    runNodeInspectOverlayTick(deltaTime) {
        if (!this.nodeInspectOverlay) return;
        if (!UIVisibilityConfig.nodeInspect) return;
        this._nodeInspectOverlayAcc = (this._nodeInspectOverlayAcc || 0) + deltaTime;
        if (this._nodeInspectOverlayAcc < 0.1) return;
        const tickDelta = this._nodeInspectOverlayAcc;
        this._nodeInspectOverlayAcc = 0;
        const start = performance.now();
        this.nodeInspectOverlay.update(tickDelta);
        this.updateValidator?.markSystemUpdate(
            'nodeInspectOverlay.update',
            performance.now() - start
        );
    }

    /**
     * Setup System State Overlay 1.0
     * Non-intrusive visual representation of system metrics (harmony, synergy, corruption)
     * Disabled by default - enable via window.toggleSystemStateOverlay()
     */
    setupSystemStateOverlay() {
        if (!this.camera) {
            console.warn('Camera not initialized, deferring System State Overlay setup');
            return;
        }

        this.systemStateOverlay = new SystemStateOverlay(this.scene, this.renderer, this.camera);
        this.systemStateOverlay.setEventBus?.(this.semanticBus);

        // Setup console API
        window.toggleSystemStateOverlay = () => {
            if (this.systemStateOverlay) {
                this.systemStateOverlay.toggle();
            }
        };

        window.systemStateOverlayStatus = () => {
            if (this.systemStateOverlay) {
                this.systemStateOverlay.status();
            }
        };

        window.toggleRegionalHarmonyZones = () => {
            if (this.systemStateOverlay) {
                this.systemStateOverlay.toggleRegionalHarmonyZones();
            }
        };

        console.log('✓ System State Overlay 1.0 initialized (disabled by default)');
        console.log('  - Use window.toggleSystemStateOverlay() to enable/disable');
        console.log('  - Use window.toggleRegionalHarmonyZones() to show/hide zones');
        console.log('  - Use window.systemStateOverlayStatus() to see metrics');
    }

    /**
     * Setup Zone Audio Reactivity 1.0
     * Subtle per-zone audio parameter modulation based on harmony zone stability
     * Modulates filter cutoff, Q, and LFO rate—never introduces new sounds or volume changes
     * Disabled by default - enable via window.toggleZoneAudioReactivity()
     */
    setupZoneAudioReactivity() {
        if (!this.audioSystem || !this.coreMetricsOverlay || !this.systemStateOverlay) {
            console.warn('Required systems not initialized, deferring Zone Audio Reactivity setup');
            return;
        }

        this.zoneAudioReactivity = new ZoneAudioReactivity(this.audioSystem, this.coreMetricsOverlay);
        
        // Wire zone data from system state overlay (read-only)
        if (this.systemStateOverlay.regionalHarmonyZones) {
            this.zoneAudioReactivity.setZones(this.systemStateOverlay.regionalHarmonyZones.zones);
        }
        
        // Setup console API
        window.toggleZoneAudioReactivity = () => {
            if (this.zoneAudioReactivity) {
                this.zoneAudioReactivity.toggle();
            }
        };

        window.zoneAudioReactivityStatus = () => {
            if (this.zoneAudioReactivity) {
                const status = this.zoneAudioReactivity.getStatus();
                console.log('Zone Audio Reactivity Status:', status);
                return status;
            }
        };

        console.log('✓ Zone Audio Reactivity 1.0 initialized (disabled by default)');
        console.log('  - Use window.toggleZoneAudioReactivity() to enable/disable');
        console.log('  - Use window.zoneAudioReactivityStatus() to see metrics');
    }

    /**
     * Setup Metric-Reactive World Events 1.0
     * Environment reacts to live metrics in real-time
     */
    setupMetricReactiveEvents() {
        if (!this.coreMetricsOverlay) {
            console.warn('Core Metrics Overlay not initialized, skipping reactive events');
            return;
        }

        // DISABLED: Legacy metric reactive system initialization
        // this.metricReactiveEvents = new MetricReactiveWorldEvents(this.scene, this.worldRoot, this.renderer, this.coreMetricsOverlay);

        // console.log('✓ Metric-Reactive World Events 1.0 initialized');
        // console.log('  - Events trigger based on live metrics');
        // console.log('  - Use toggleWorldEvents() to toggle effects');
    }

    /**
     * Setup Semantic Glyph AI 5.0
     */
    setupSemanticGlyphAI() {
        if (!this.glyphLayer4) {
            console.error('[SemanticGlyphAI] GlyphLayer4 missing - initialization aborted');
            this.semanticGlyphAI = null;
            return;
        }

        try {
            if (this.semanticGlyphAI?.dispose) {
                this.semanticGlyphAI.dispose();
            }

            this.semanticGlyphAI = new SemanticGlyphAI(
                this.scene,
                this.worldRoot,
                this.glyphLayer4
            );

            this.linkedGlyphSync?.resetForWorldSwitch?.();
            this.linkedGlyphMessaging?.resetForWorldSwitch?.({
                scene: this.scene,
                worldRoot: this.worldRoot,
                semanticGlyphAI: this.semanticGlyphAI,
                linkedGlyphSync: this.linkedGlyphSync || null
            });
            this.glyphFusionOverlay?.resetForWorldSwitch?.({
                scene: this.scene,
                worldRoot: this.worldRoot,
                semanticGlyphAI: this.semanticGlyphAI,
                semanticBus: this.semanticBus,
                aiNodes: this.aiNodes
            });

            this.linkedGlyphMessaging?.setLinkedGlyphSync?.(this.linkedGlyphSync || null);

            // Hover-only mode: no post-spawn global fusion registration.
        } catch (error) {
            console.error('[SemanticGlyphAI] Initialization failed:', error);
            this.semanticGlyphAI = null;
        }
    }

    setupAmbientOrbitGlyphs() {
        if (!this.glyphLayer4 || !this.aiNodes?.nodes) {
            return;
        }

        this.glyphLayer4.frameScheduler = this.frameScheduler;
        this.glyphLayer4.ambientOrbitEnabled = true;
        this.glyphLayer4.createAmbientOrbitGlyphsForNodes(this.aiNodes.nodes);

        if (this.aiNodes?.unregisterPostSpawnObserver) {
            this.aiNodes.unregisterPostSpawnObserver('glyph-layer4-ambient-orbit');
        }

        if (this.aiNodes?.registerPostSpawnObserver) {
            this.aiNodes.registerPostSpawnObserver(
                'glyph-layer4-ambient-orbit',
                (newNode) => {
                    const nodeId = newNode?.userData?.nodeId;
                    if (!newNode || !nodeId || !this.glyphLayer4) return;
                    this.glyphLayer4.reconcileAmbientOrbitGlyphs?.(this.aiNodes?.nodes || []);
                },
                90
            );
        }
    }

    setupGlyphLayer4Fusions() {
        if (!this.glyphLayer4 || !this.aiNodes?.nodes) {
            return;
        }

        if (this.glyphLayer4.hoverOnlyMode) {
            if (this.aiNodes?.unregisterPostSpawnObserver) {
                this.aiNodes.unregisterPostSpawnObserver('glyph-layer4-fusions');
            }
            return;
        }

        this.glyphLayer4.createGlyphFusionsForNodes(this.aiNodes.nodes);

        if (this.aiNodes?.unregisterPostSpawnObserver) {
            this.aiNodes.unregisterPostSpawnObserver('glyph-layer4-fusions');
        }

        if (this.aiNodes?.registerPostSpawnObserver) {
            this.aiNodes.registerPostSpawnObserver(
                'glyph-layer4-fusions',
                (newNode) => {
                    const nodeId = newNode?.userData?.nodeId;
                    if (!newNode || !nodeId || !this.glyphLayer4 || this.glyphLayer4.hoverOnlyMode) return;
                    this.glyphLayer4.createGlyphFusion(newNode, nodeId);
                },
                80
            );
        }
    }

    _getHudSelectedNode() {
        return (
            this.linkingSystem?.primaryNode ||
            this.linkingSystem?.selectedNode ||
            this.selectionCore?.primaryNode ||
            this.selectionCore?.selectedNode ||
            window?.game?.selectedNode ||
            null
        );
    }

    _clampHud01(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0;
        return Math.max(0, Math.min(1, numeric));
    }

    _buildHudMetricsSnapshot() {
        const liveMetrics = window?.__ATOMA_LIVE_METRICS__ || {};
        const rawNetworkMetrics = this.metricsRuntime_v1?.getRawNetworkMetrics?.() || null;
        const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];
        const totalLinks = links.length;
        const degradationStats = this.linkDegradationSystem?.getDegradationStatistics?.() || null;
        const stressFallback = Number.isFinite(this.networkStressAggregator?.getStress?.())
            ? this._clampHud01((this.networkStressAggregator.getStress() || 0) / 100)
            : 0;

        const networkSynergy = this._clampHud01(rawNetworkMetrics?.networkSynergy ?? liveMetrics.networkSynergy ?? 0);
        const harmonyFlow = this._clampHud01(liveMetrics.harmonyFlow ?? 0);
        const networkStress = this._clampHud01(
            Number.isFinite(liveMetrics.networkStress) ? liveMetrics.networkStress : stressFallback
        );
        const corruptionLevel = this._clampHud01(liveMetrics.corruptionLevel ?? 0);
        const loadPressure = this._clampHud01(liveMetrics.loadPressure ?? 0);
        const stability = this._clampHud01(1 - networkStress);
        const risk = this._clampHud01((networkStress * 0.55) + (corruptionLevel * 0.3) + (loadPressure * 0.15));

        const recoveryReady = risk >= 0.75
            ? 'CRITICAL'
            : risk >= 0.5
                ? 'LOW'
                : stability >= 0.75
                    ? 'HIGH'
                    : 'MEDIUM';

        const networkState = risk >= 0.75
            ? 'critical'
            : risk >= 0.5
                ? 'stressed'
                : stability >= 0.75
                    ? 'stable'
                    : 'watch';

        const linksCollapsed = Number.isFinite(degradationStats?.linksCriticallyStrained)
            ? degradationStats.linksCriticallyStrained
            : 0;

        const cascadeHopCount = Number.isFinite(window?._cascadeHopCount) ? window._cascadeHopCount : 0;
        const cascadeHopRate = typeof window?.getCascadeHopRate === 'function'
            ? window.getCascadeHopRate()
            : null;
        const cascadeLinks = links.filter((link) => Number.isFinite(link?.userData?.cascadeIntensity) && link.userData.cascadeIntensity > 0);
        const cascadeIntensityLive = Number.isFinite(liveMetrics.cascadeIntensity) ? liveMetrics.cascadeIntensity : null;
        const cascadeIntensityAverage = Number.isFinite(cascadeIntensityLive)
            ? this._clampHud01(cascadeIntensityLive)
            : this._clampHud01(
                cascadeLinks.length > 0
                    ? cascadeLinks.reduce((sum, link) => sum + (link?.userData?.cascadeIntensity || 0), 0) / cascadeLinks.length
                    : 0
            );
        const cascadeIntensityPeak = this._clampHud01(
            cascadeLinks.reduce((max, link) => Math.max(max, link?.userData?.cascadeIntensity || 0), 0)
        );

        const waveBurstState = typeof window?.getWaveInterferenceBurstState === 'function'
            ? window.getWaveInterferenceBurstState()
            : null;
        const waveBurstSnapshot = waveBurstState?.activeSnapshot || null;
        const waveBurstMetrics = waveBurstState?.metrics || null;
        const cascadeBridgeStatus = this.cascadeToWaveBridge
            ? {
                enabled: !!this.cascadeToWaveBridge.enabled,
                attached: !!this.cascadeToWaveBridge.semanticBus,
                hasWaveEngine: !!this.cascadeToWaveBridge.waveInterferenceEngine
            }
            : null;
        const waveBurstLabel = waveBurstSnapshot
            ? `${waveBurstSnapshot.type}${waveBurstSnapshot.sourceId ? ` · ${waveBurstSnapshot.sourceId}` : ''}`
            : waveBurstMetrics?.activeBurstType
                ? `${waveBurstMetrics.activeBurstType} · idle`
                : 'idle';
        const waveFieldLabel = waveBurstMetrics?.activeBurstType
            ? `${waveBurstMetrics.activeBurstType} · ${waveBurstMetrics.fieldSuppressed ? 'suppressed' : 'open'}`
            : 'idle';

        const observation = {
            cascadeHop: `${Number(cascadeHopCount).toLocaleString()} total · ${cascadeHopRate?.rate || '0/s'}`,
            cascadeIntensity: `${Math.round(cascadeIntensityAverage * 100)}% avg · ${Math.round(cascadeIntensityPeak * 100)}% peak · ${cascadeLinks.length}/${totalLinks} links`,
            waveBurst: `${waveBurstLabel} · bridge ${cascadeBridgeStatus?.enabled ? 'on' : 'off'} · lifecycle ${waveBurstMetrics?.lifecycleEventsTracked ?? 0}`,
            waveField: `${waveFieldLabel} · lifecycle ${waveBurstMetrics?.lifecycleEventsTracked ?? 0}`
        };

        const selectedNode = this._getHudSelectedNode();
        const selectedNodeName = selectedNode?.userData?.name || selectedNode?.name || selectedNode?.id || 'none';

        return {
            liveMetrics,
            selectedNode,
            selectedNodeName,
            totalLinks,
            linksCollapsed,
            stability,
            risk,
            recoveryReady,
            networkState,
            networkSynergy,
            harmonyFlow,
            networkStress,
            corruptionLevel,
            loadPressure,
            observation,
            generatedAt: Date.now()
        };
    }

    _buildVariantBAdvisorReport(snapshot = null) {
        const hudSnapshot = snapshot || this._buildHudMetricsSnapshot();
        const topCandidate = this._getTopLinkRecommendation(hudSnapshot.selectedNode);
        const insight = topCandidate
            ? `${hudSnapshot.selectedNodeName} → ${topCandidate.name} (${Math.round(topCandidate.score * 100)}% fit)`
            : hudSnapshot.selectedNode
                ? `${hudSnapshot.selectedNodeName}: awaiting fresh recommendation pass.`
                : 'No primary node selected.';

        return {
            meta: {
                mode: 'LIVE_ADVISOR',
                generatedAt: hudSnapshot.generatedAt,
                source: 'metricsRuntime_v1'
            },
            snapshot: {
                linksCreated: hudSnapshot.totalLinks,
                linksCollapsed: hudSnapshot.linksCollapsed,
                recoveryReady: hudSnapshot.recoveryReady
            },
            network: {
                state: hudSnapshot.networkState
            },
            stability: hudSnapshot.stability,
            risk: hudSnapshot.risk,
            recovery: hudSnapshot.recoveryReady,
            insight
        };
    }

    _getTopLinkRecommendation(selectedNode = null) {
        if (!selectedNode || !this.linkRecommendationAI?.updateRecommendations) {
            return null;
        }

        try {
            this.linkRecommendationAI.updateRecommendations(selectedNode);
        } catch (err) {
            console.warn('[main.js] LinkRecommendationAI update failed:', err?.message || err);
        }

        const candidateScores = this.linkRecommendationAI?.candidateScores;
        if (!candidateScores || candidateScores.size === 0) {
            return null;
        }

        let topCandidate = null;
        for (const entry of candidateScores.values()) {
            if (!entry?.node) continue;
            if (!topCandidate || (entry.score ?? 0) > topCandidate.score) {
                topCandidate = entry;
            }
        }

        if (!topCandidate?.node) {
            return null;
        }

        return {
            name: topCandidate.node.userData?.name || topCandidate.node.name || topCandidate.node.id || 'candidate',
            score: Number.isFinite(topCandidate.score) ? topCandidate.score : 0,
            confidence: Number.isFinite(topCandidate.confidence) ? topCandidate.confidence : 0,
            bonuses: topCandidate.bonuses || {},
            reasonVector: topCandidate.reasonVector || null
        };
    }

    _buildAIAutomationReport(snapshot = null) {
        const hudSnapshot = snapshot || this._buildHudMetricsSnapshot();
        const candidateScores = this.linkRecommendationAI?.candidateScores;
        const recommendations = [];

        if (candidateScores && candidateScores.size > 0) {
            const sortedCandidates = Array.from(candidateScores.values())
                .filter((entry) => entry?.node)
                .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                .slice(0, 4);

            sortedCandidates.forEach((entry, index) => {
                const candidateName = entry.node.userData?.name || entry.node.name || entry.node.id || `node-${index}`;
                const severity = (entry.score ?? 0) >= 0.85
                    ? 'critical'
                    : (entry.score ?? 0) >= 0.7
                        ? 'warn'
                        : 'info';

                const signals = [
                    `Score ${(Math.round((entry.score ?? 0) * 100))}%`,
                    Number.isFinite(entry.confidence) ? `Confidence ${Math.round(entry.confidence * 100)}%` : null,
                    `Target category ${entry.node.userData?.category || 'unknown'}`
                ].filter(Boolean);

                const bonusKeys = entry.bonuses
                    ? Object.entries(entry.bonuses).filter(([, enabled]) => Boolean(enabled)).map(([key]) => key)
                    : [];

                recommendations.push({
                    id: `candidate:${candidateName}:${index}`,
                    severity,
                    message: `${candidateName} is a ${Math.round((entry.score ?? 0) * 100)}% fit`,
                    reasoning: {
                        signals,
                        snapshotRefs: [
                            `selected:${hudSnapshot.selectedNodeName}`,
                            `links:${hudSnapshot.totalLinks}`,
                            `risk:${Math.round(hudSnapshot.risk * 100)}%`
                        ],
                        note: bonusKeys.length > 0 ? `Bonuses: ${bonusKeys.join(', ')}` : 'No extra bonuses detected.'
                    }
                });
            });
        } else if (hudSnapshot.selectedNode) {
            recommendations.push({
                id: 'recommendation:pending',
                severity: 'info',
                message: `Waiting for recommendations for ${hudSnapshot.selectedNodeName}`,
                reasoning: {
                    signals: ['Selected node is present', 'Recommendation cache not populated yet'],
                    snapshotRefs: [`selected:${hudSnapshot.selectedNodeName}`],
                    note: 'Recommendations are refreshed on the 10Hz simulation tick.'
                }
            });
        }

        return {
            meta: {
                mode: 'AUTOMATION_LIVE',
                generatedAt: hudSnapshot.generatedAt,
                source: 'metricsRuntime_v1 + linkRecommendationAI'
            },
            snapshot: {
                linksCreated: hudSnapshot.totalLinks,
                linksCollapsed: hudSnapshot.linksCollapsed,
                recoveryReady: hudSnapshot.recoveryReady
            },
            network: {
                state: hudSnapshot.networkState
            },
            observation: hudSnapshot.observation,
            recommendations
        };
    }

    _refreshAIHudReports() {
        // Visibility guard: skip entirely if both AI HUDs are hidden
        const aiHudVisible = isHudEffectivelyVisible('aiHUD');
        const advisorHudVisible = isHudEffectivelyVisible('advisorHUD');
        if (!aiHudVisible && !advisorHudVisible) return;

        // Throttle: ~5Hz (200ms interval) — AI HUD reports don't need 10Hz updates
        const now = performance.now();
        if (now - this._aiHudLastRefresh < 200) return;
        this._aiHudLastRefresh = now;

        const snapshot = this._buildHudMetricsSnapshot();

        if (advisorHudVisible) {
            const advisorReport = this._buildVariantBAdvisorReport(snapshot);
            window.__ATOMA_AI_ADVISOR__ = advisorReport;
            updateVariantBAdvisorHUD(advisorReport);
        }

        if (aiHudVisible) {
            const automationReport = this._buildAIAutomationReport(snapshot);
            window.__ATOMA_AI_AUTOMATION_REPORT__ = automationReport;
            updateAIAutomationHUD(automationReport);
        }
    }

    /**
     * Setup Glyph Fusion Overlay 4.1
     */
    setupGlyphFusionOverlay() {
        if (!this.semanticGlyphAI) {
            console.warn('Semantic Glyph AI not initialized, deferring Glyph Fusion Overlay setup');
            return;
        }
        if (this.glyphLayer4?.hoverOnlyMode) {
            this.glyphFusionOverlay?.dispose?.();
            this.glyphFusionOverlay = null;
            return;
        }

        this.glyphFusionOverlay = new GlyphFusionOverlay4_1(this.scene, this.worldRoot, this.semanticGlyphAI, this.semanticBus);
        this.glyphFusionOverlay.subscribeToEvents?.();

        // Initialize fusion glyphs for all existing nodes
        if (this.aiNodes) {
            this.glyphFusionOverlay.initializeForNodes(this.aiNodes.nodes);
        }

        console.log('✓ Glyph Fusion Overlay 4.1 initialized');
        console.log('  - Semantic-driven fusion forms');
        console.log('  - 5 fusion geometries per semantic state');
        console.log('  - Use debugFusionGlyph(nodeIndex) to inspect');
        console.log('  - Use debugFusionStats() for statistics');
    }

    /**
     * Setup Procedural Meaning Engine 1.0
     * Replaces legacy 2D hexagon glyphs with lightweight 3D procedural glyphs
     */
    setupProceduralMeaningEngine() {
        if (!this.semanticGlyphAI) {
            console.warn('Semantic Glyph AI not initialized, deferring Procedural Meaning Engine setup');
            return;
        }
        if (this.glyphLayer4?.hoverOnlyMode) {
            this.proceduralMeaningEngine?.dispose?.();
            this.proceduralMeaningEngine = null;
            return;
        }

        this.proceduralMeaningEngine = new ProceduralMeaningEngine(this.scene);

        // Remove all legacy 2D cyan hexagon glyphs
        this.proceduralMeaningEngine.removeLegacyHexagons();

        console.log('✓ Procedural Meaning Engine 1.0 initialized');
        console.log('  - Lightweight 3D semantic glyphs');
        console.log('  - 5 procedural glyph types (consciousness, instability, synergy, corruption, harmony)');
        console.log('  - Auto-attached to node.visualGroup');
        console.log('  - Use debugRemoveLegacyHex() to cleanup old glyphs');
    }

    /**
     * Setup Linked Glyph Messaging 3.0 (SAFE EDITION)
     * Ultra symbolic AI language transport
     */
    setupLinkedGlyphMessaging() {
        if (!this.semanticGlyphAI) {
            console.warn('Semantic Glyph AI not initialized, deferring Linked Glyph Messaging setup');
            return;
        }

        this.linkedGlyphMessaging = new LinkedGlyphMessaging3_0(this.scene, this.worldRoot, this.semanticGlyphAI);
        this.linkedGlyphMessaging.setEnabled(true);
        this.linkedGlyphMessaging.frameScheduler = this.frameScheduler;
        this.linkedGlyphMessaging.setLinkedGlyphSync?.(this.linkedGlyphSync || null);

        // Link to RecursiveGlyphMessaging4_0 if already initialized
        if (this.recursiveGlyphMessaging) {
            this.linkedGlyphMessaging.setRecursiveGlyphMessaging(this.recursiveGlyphMessaging);
            this.recursiveGlyphMessaging.setLinkedGlyphMessaging(this.linkedGlyphMessaging);
        }

        console.log('✓ Linked Glyph Messaging 3.0 active');
        console.log('  - Ultra symbolic AI language transport');
        console.log('  - Messages carry node semantic state');
        console.log('  - Use debugPrintMessages() to view statistics');
        console.log('  - Use toggleMessaging() to enable/disable');
    }

    /**
     * Setup Recursive Glyph Messaging 4.0 (SAFE EDITION)
     * Recursive meaning chains with branching and looping
     */
    setupRecursiveGlyphMessaging() {
        if (!this.semanticGlyphAI) {
            console.warn('Semantic Glyph AI not initialized, deferring Recursive Glyph Messaging setup');
            return;
        }

        this.recursiveGlyphMessaging = new RecursiveGlyphMessaging4_0(this.scene, this.worldRoot, this.semanticGlyphAI);
        this.recursiveGlyphMessaging.setEnabled(true);

        // Link to LinkedGlyphMessaging3_0 if already initialized
        if (this.linkedGlyphMessaging) {
            this.recursiveGlyphMessaging.setLinkedGlyphMessaging(this.linkedGlyphMessaging);
            this.linkedGlyphMessaging.setRecursiveGlyphMessaging(this.recursiveGlyphMessaging);
        }

        console.log('✓ Recursive Glyph Messaging 4.0 active');
        console.log('  - Recursive meaning chains (WORD→PHRASE→SENTENCE→CHAIN)');
        console.log('  - Semantic-driven chain evolution');
        console.log('  - Branching sub-chains & safe looping');
        console.log('  - INTEGRATED with LinkedGlyphMessaging3.0');
        console.log('  - Use debugRecursiveMessages() to view statistics');
        console.log('  - Use toggleRecursiveChains() to enable/disable');
    }

    /**
     * Setup Recursive Glyph Signal System
     * Attention-driven SIGNAL layer: local, transient, meaning-first recursive glyph utterances
     */
    setupRecursiveGlyphSignalSystem() {
        if (!this.semanticGlyphAI || !this.selectionCore || !this.linkingSystem || !this.frameScheduler) {
            console.warn('Recursive Glyph Signal System dependencies not ready, deferring setup');
            return;
        }

        this._recursiveGlyphSignalBootstrapPingSent = false;
        if (this._recursiveGlyphSignalBootstrapTimer) {
            clearTimeout(this._recursiveGlyphSignalBootstrapTimer);
            this._recursiveGlyphSignalBootstrapTimer = null;
        }

        if (!this.recursiveGlyphSignalSystem) {
            this.recursiveGlyphSignalSystem = new RecursiveGlyphSignalSystem(this.scene, {
                camera: this.camera,
                semanticGlyphAI: this.semanticGlyphAI,
                frameScheduler: this.frameScheduler
            });
        }

        this.recursiveGlyphSignalSystem.setSemanticGlyphAI(this.semanticGlyphAI);
        this.recursiveGlyphSignalSystem.setFrameScheduler(this.frameScheduler);
        this.recursiveGlyphSignalSystem.setSelectionCore(this.linkingSystem);
        this.recursiveGlyphSignalSystem.setLinkingSystem(this.linkingSystem);
        this.recursiveGlyphSignalSystem.setDynamicsContext({
            isBurstActive: () => false,
            isFieldActive: () => Boolean(this.regionalEquilibrium?.regions?.size)
        });
        this.recursiveGlyphSignalSystem.setEnabled(true);

        if (this.linkingSystem?.onNodeHoverStart && !this.linkingSystem.__recursiveGlyphSignalHoverAuthorityBound) {
            this.linkingSystem.onNodeHoverStart((node) => {
                this.recursiveGlyphSignalSystem?.triggerAttentionSignal?.(node, 'hover', { bypassBurst: true });
            });
            this.linkingSystem.onNodeHoverEnd((node) => {
                this.recursiveGlyphSignalSystem?.requestSilenceForNode?.(node);
            });
            this.linkingSystem.__recursiveGlyphSignalHoverAuthorityBound = true;
        }

        this._recursiveGlyphSignalFirstSelectLogged = false;

        console.log('✓ Recursive Glyph Signal System active');
        console.log('  - SIGNAL-layer recursive glyph language');
        console.log('  - Triggered by attention and local meaning events');
        console.log('  - Silent by default, auto-clears after communication');
        console.log('  - Uses dynamic tick registration (no idle global glyph loop)');

        this._scheduleRecursiveGlyphSignalBootstrapPing();
    }

    _getRecursiveGlyphSignalBootstrapNode() {
        const selectedNode =
            this.linkingSystem?.selectedNode ||
            this.selectionCore?.selectedNode ||
            this._getHudSelectedNode?.() ||
            window?.game?.selectedNode ||
            null;

        if (selectedNode?.position) {
            return selectedNode;
        }

        const nodes = Array.isArray(this.aiNodes?.nodes) ? this.aiNodes.nodes : [];
        return (
            nodes.find((node) => node?.position && node?.visible !== false && !node?.userData?.hidden && !node?.userData?.isHidden) ||
            nodes.find((node) => node?.position) ||
            null
        );
    }

    _scheduleRecursiveGlyphSignalBootstrapPing(attempt = 0) {
        if (this._recursiveGlyphSignalBootstrapPingSent) return;
        if (!this.recursiveGlyphSignalSystem?.enabled) return;

        const node = this._getRecursiveGlyphSignalBootstrapNode();
        if (node && typeof this.recursiveGlyphSignalSystem.triggerAttentionSignal === 'function') {
            const emitted = this.recursiveGlyphSignalSystem.triggerAttentionSignal(node, 'selection');
            if (emitted) {
                this._recursiveGlyphSignalBootstrapPingSent = true;
                console.log('[main.js] RecursiveGlyphSignalSystem bootstrap ping emitted:', node?.userData?.name || node?.name || node?.id || node?.uuid || 'node');
                return;
            }
        }

        if (attempt >= 8) {
            console.warn('[main.js] RecursiveGlyphSignalSystem bootstrap ping skipped: no eligible node found');
            return;
        }

        this._recursiveGlyphSignalBootstrapTimer = setTimeout(() => {
            this._scheduleRecursiveGlyphSignalBootstrapPing(attempt + 1);
        }, 250);
    }


    /**
     * Setup Emergent Thought Storms 5.0 (SAFE EDITION)
     * Chain collision phenomena with spectacular visual effects
     */
    setupEmergentThoughtStorms() {
        // Hard-disabled for release stabilization. Keep the source file orphaned
        // on disk, but do not import, instantiate, or wire it into runtime.
        this.emergentThoughtStorms = null;
    }

    /**
     * Setup AI Narrative Patterns 6.0 (SAFE EDITION)
     * Visual narrative structure layer with emergent story arcs
     */
    setupAINarrativePatterns() {
        if (!this.recursiveGlyphMessaging ||
            !this.linkedGlyphMessaging || !this.semanticGlyphAI) {
            console.warn('Glyph messaging systems not initialized, deferring Narrative Patterns setup');
            return;
        }

        this.narrativePatterns = new AINarrativePatterns6_0(
            this.scene,
            this.linkedGlyphMessaging,
            this.recursiveGlyphMessaging,
            null,
            this.semanticGlyphAI
        );
        this.narrativePatterns.enabled = true;

        // Connect glyph systems to narrative patterns
        if (this.linkedGlyphMessaging) {
            this.linkedGlyphMessaging.setNarrativePatterns(this.narrativePatterns);
        }
        
        if (this.proceduralGlyphGenerator) {
            this.proceduralGlyphGenerator.setNarrativePatterns(this.narrativePatterns);
        }
        
        // Connect to pictogram system's fusion zone manager
        const pictogramSystem = this.linkingSystem?.conduitRenderer?.pictogramSystem;
        if (pictogramSystem?.fusionZoneManager) {
            pictogramSystem.fusionZoneManager.setNarrativePatterns(this.narrativePatterns);
        }

        console.log('✓ AI Narrative Patterns 6.0 active');
        console.log('  - Visual narrative structure layer');
        console.log('  - 5-phase episodic progression (INTRO→RISING→CLIMAX→RESOLVE→ECHO)');
        console.log('  - 6 narrative motifs (RISING_HARMONY, COLLAPSING_ORDER, ASCENSION_TALE, etc.)');
        console.log('  - Emergent story arcs from network metrics');
        console.log('  - INTEGRATED with LinkedGlyphMessaging, ProceduralGlyphs, GlyphFusion');
        console.log('  - Use debugNarrativePatterns() to view statistics');
        console.log('  - Use toggleNarrativePatterns() to enable/disable');
    }

    /**
     * Setup ATOMA Language Engine 2.0
     * Grammar + semantic language processing for archetype naming system
     * Pure text layer - zero gameplay impact, read-only access only
     */
    setupLanguageEngine() {
        // Language engine already initialized in constructor
        // Just setup console API and expose to window
        window.atomaLang = this.languageEngine;

        // Initialize console API for debugging
        setupAtomaNamingConsoleAPI(this.languageEngine);

        console.log('%c✓ ATOMA Language Engine 2.0 initialized', 'color: cyan; font-weight: bold;');
        console.log('%c  API available via window.lang.*', 'color: cyan;');
        console.log('%c  - lang.info(code) — Get archetype info', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.label(code) — Get short label', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.fullname(code) — Get poetic name', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.phrase(code, metrics) — Get descriptive phrase', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.link(srcCode, tgtCode, metrics) — Get link description', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.stats() — Get cache statistics', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.queryByOrigin(code) — Find by origin', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.queryByPattern(code) — Find by pattern', 'color: cyan; font-size: 11px;');
        console.log('%c  - lang.queryBySignature(code) — Find by signature', 'color: cyan; font-size: 11px;');
    }

    /**
     * Setup Node Inspect Linguistic Overlay 1.0
     * Semantic language enhancement for node inspection HUD
     * Pure visual layer - zero gameplay impact
     */
    setupLinguisticOverlay() {
        if (!this.languageEngine) {
            console.warn('Language Engine not initialized, deferring Linguistic Overlay setup');
            return;
        }

        this.linguisticOverlay = new NodeInspectLinguisticOverlay(
            this.languageEngine,
            this.consciousnessLayer, // Optional: passes AI mood information
            atomaNamingEngine
        );

        // Setup console API
        setupLinguisticOverlayConsoleAPI(this.linguisticOverlay);

        console.log('%c✓ Node Inspect Linguistic Overlay 1.0 initialized', 'color: magenta; font-weight: bold;');
        console.log('%c  API available via window.ling.*', 'color: magenta;');
        console.log('%c  - ling.toggle() — Enable/disable overlay', 'color: magenta; font-size: 11px;');
        console.log('%c  - ling.show() / ling.hide() — Manual control', 'color: magenta; font-size: 11px;');
        console.log('%c  - ling.stats() — View statistics', 'color: magenta; font-size: 11px;');
        console.log('%c  - ling.status() — Print status report', 'color: magenta; font-size: 11px;');
    }

    /**
     * Setup ATOMA Language Engine 3.0
     * Procedural AI Poetry — Emergent whispers from the dream network
     * Pure text/DOM layer - zero gameplay impact, poetic descriptions
     */
    setupPoetryEngine() {
        if (!this.languageEngine) {
            console.warn('Language Engine not initialized, deferring Poetry Engine setup');
            return;
        }

        this.poetryEngine = new AtomaLanguageEngine3_0(
            this.languageEngine,
            this.consciousnessLayer ? this.consciousnessLayer.storms : null,
            this.consciousnessLayer,
            this.semanticBus
        );

        // Enable poetry engine
        this.poetryEngine.enable();

        // Setup console API
        setupAtomaLanguageEngine3ConsoleAPI(this.poetryEngine);

        console.log('%c✓ ATOMA Language Engine 3.0 initialized', 'color: cyan; font-weight: bold;');
        console.log('%c  Procedural AI Poetry — Emergent whispers active', 'color: cyan;');
        console.log('%c  API available via window.poetry.*', 'color: cyan;');
        console.log('%c  - poetry.enable() / poetry.disable() — Toggle', 'color: cyan; font-size: 11px;');
        console.log('%c  - poetry.test() — Generate sample poetry', 'color: cyan; font-size: 11px;');
        console.log('%c  - poetry.stats() — View performance metrics', 'color: cyan; font-size: 11px;');
        console.log('%c  - poetry.show() / poetry.hide() — Manual control', 'color: cyan; font-size: 11px;');
    }

    _setupLoreUnlockBridge() {
        if (!this.semanticBus?.on) {
            return;
        }

        if (this._loreUnlockBridgeBound && this._loreUnlockBridgeBus === this.semanticBus) {
            return;
        }

        try {
            this._loreUnlockBridgeUnsub?.();
        } catch (_) {}
        this._loreUnlockBridgeUnsub = null;

        this._loreUnlockBridgeBound = true;
        this._loreUnlockBridgeBus = this.semanticBus;
        this._loreUnlockBridgeUnsub = this.semanticBus.on('lore.unlocked', ({ id } = {}) => {
            const key = LORE_TO_LANGUAGE[id];
            if (!key) {
                return;
            }

            AtomaLanguageEngine3_0.emit(key);
        });
    }

    /**
     * Setup Lore Fragment Emitter (P1.7)
     * World-aware lore whispers that appear during gameplay.
     * Short, strong sentences — not wiki blocks.
     * Lore as reward for understanding the system.
     */
    setupLoreFragmentEmitter() {
        if (!this.semanticBus) {
            console.warn('LoreFragmentEmitter: no semantic bus, skipping');
            return;
        }

        // Metrics getter for state-mutating fragments (Proposal 6)
        const getMetrics = () => {
            try {
                const m = this.coreMetricsOverlay?.currentMetrics;
                if (m) {
                    return {
                        harmony: m.harmony ?? 0,
                        corruption: m.corruption ?? m.corruptionLevel ?? 0,
                        stability: m.stability ?? 0,
                        synergy: m.synergy ?? 0,
                        loadPressure: m.loadPressure ?? m.load ?? 0,
                    };
                }
            } catch { /* fallback */ }
            return { harmony: 0, corruption: 0, stability: 0, synergy: 0, loadPressure: 0 };
        };

        this.loreFragmentEmitter = new LoreFragmentEmitter(
            this.semanticBus,
            () => this.currentMode || 'quantum',
            () => getMetrics().corruption,
            {}, // default config
            getMetrics
        );
        this._setupFirstRunGuidanceDirector();

        // Wire thought storm → dream lore bridge (Proposal 5)
        this._wireThoughtStormLoreBridge();

        // Debug console API
        if (typeof window !== 'undefined') {
            window.fragments = {
                stats: () => this.loreFragmentEmitter?.getStats(),
                list: () => this.loreFragmentEmitter?.getFragmentIds(),
                world: (w) => this.loreFragmentEmitter?.getFragmentsForWorld(w || this.currentMode),
                show: (id) => this.loreFragmentEmitter?.forceShow(id),
                reset: () => this.loreFragmentEmitter?.reset(),
                enable: () => this.loreFragmentEmitter?.enable(),
                disable: () => this.loreFragmentEmitter?.disable(),
                help: () => {
                    console.log('=== Lore Fragment Emitter (P1.7) ===');
                    console.log('  fragments.stats()           — Show emitter statistics');
                    console.log('  fragments.list()            — List all fragment IDs');
                    console.log('  fragments.world(id?)        — Show fragments for world (default: current)');
                    console.log('  fragments.show(id)          — Force-show a specific fragment');
                    console.log('  fragments.reset()           — Reset session state');
                    console.log('  fragments.enable/disable()  — Toggle emitter');
                },
            };
        }

        console.log('%c✓ Lore Fragment Emitter (P1.7) initialized', 'color: #ffd89c; font-weight: bold;');
        console.log('%c  World-aware lore whispers active', 'color: #ffd89c;');
        console.log('%c  State-mutating fragments enabled (P1.7.6)', 'color: #ffd89c; font-size: 11px;');
        console.log('%c  API: window.fragments.*', 'color: #ffd89c; font-size: 11px;');

        // Setup Network Chronicle (Proposal 7: The Living Chronicle)
        this.setupNetworkChronicle();
    }

    /**
     * Setup Network Chronicle (P1.7 Proposal 7).
     * A procedural diary that builds from the player's actual session.
     * Each playthrough generates a unique, shareable narrative document.
     */
    setupNetworkChronicle() {
        if (!this.semanticBus) {
            console.warn('NetworkChronicle: no semantic bus, skipping');
            return;
        }

        const getMetrics = () => {
            try {
                const m = this.coreMetricsOverlay?.currentMetrics;
                if (m) {
                    return {
                        harmony: m.harmony ?? 0,
                        corruption: m.corruption ?? m.corruptionLevel ?? 0,
                        stability: m.stability ?? 0,
                        synergy: m.synergy ?? 0,
                        loadPressure: m.loadPressure ?? m.load ?? 0,
                    };
                }
            } catch { /* fallback */ }
            return { harmony: 0, corruption: 0, stability: 0, synergy: 0, loadPressure: 0 };
        };

        this.networkChronicle = new NetworkChronicle(
            this.semanticBus,
            () => this.currentMode || 'unknown',
            getMetrics
        );

        // Debug console API
        if (typeof window !== 'undefined') {
            window.chronicle = {
                read: () => this.networkChronicle?.getFullText(),
                entries: () => this.networkChronicle?.getChronicle(),
                stats: () => this.networkChronicle?.getStats(),
                print: () => this.networkChronicle?.print(),
                reset: () => this.networkChronicle?.reset(),
                json: () => this.networkChronicle?.toJSON(),
                help: () => {
                    console.log('=== Network Chronicle (P1.7.7) — The Living Chronicle ===');
                    console.log('  chronicle.read()    — Read the full chronicle text');
                    console.log('  chronicle.entries() — Get structured entries array');
                    console.log('  chronicle.stats()   — Show chronicle statistics');
                    console.log('  chronicle.print()   — Print chronicle to console');
                    console.log('  chronicle.reset()   — Reset chronicle (new session)');
                    console.log('  chronicle.json()    — Export as JSON');
                },
            };
        }

        console.log('%c✓ Network Chronicle (P1.7.7) initialized', 'color: #c0e0ff; font-weight: bold;');
        console.log('%c  The network writes its own history', 'color: #c0e0ff;');
        console.log('%c  API: window.chronicle.*', 'color: #c0e0ff; font-size: 11px;');
    }

    /**
     * Wire thought storm → dream lore bridge (Proposal 5).
     * When EmergentThoughtStorms spawn, the lore emitter shows dream fragments.
     */
    _wireThoughtStormLoreBridge() {
        return false;
    }

    /**
     * Setup Node Auto-Detection 3.1 - DISABLED
     * Replaced by NodeLinking2_3 unified mouse handler
     */
    setupNodeAutoDetect() {
        console.log('⊘ Node Auto-Detection 3.1 DISABLED (replaced by UI 3.7 mouse kernel)');
        // Legacy system disabled - NodeLinking2_3 handles all input
    }

    /**
     * Setup Category Legend 3.1 - PASSIVE DISPLAY ONLY
     * Reference panel showing all 14 node categories with color indicators
     * Categories: Input, Process, Integration, Analytics, Storage, Control,
     *             Sigma, Emotional, Quantum, Mythic, Prime, External, Extreme, Special
     */
    setupCategoryLegend() {
        this.categoryLegend = new UICategoryLegend3_1(this.aiNodes);

        console.log('✓ Category Legend 3.1 initialized (14 categories - passive display)');
    }

    /**
     * Setup Emotional Feed 3.1 - PASSIVE DISPLAY ONLY
     * Dynamic poetic network status reflections (no interaction)
     */
    setupEmotionalFeed() {
        this.emotionalFeed = new AIEmotionalFeed3_1(this.aiNodes);
        this.emotionalFeed.frameScheduler = this.frameScheduler;

        console.log('✓ Emotional Feed 3.1 initialized (passive display - no interaction)');
    }

    /**
     * Setup Node Linking 2.1 - DISABLED
     * Replaced by NodeLinking2_3 (unified mouse kernel with double-click primary)
     */
    setupNodeLinking() {
        console.log('⊘ Node Linking 2.0/2.1 DISABLED (replaced by UI 3.7 NodeLinking2_3)');
        // Legacy system disabled - NodeLinking2_3 handles all LMB/RMB interactions
    }

    /**
     * Setup Node Hover Tooltip 3.1 - DISABLED
     * Conflicts with NodeLinking2_3 unified mouse handler
     */
    setupHoverTooltip() {
        console.log('⊘ Node Hover Tooltip 3.1 DISABLED (conflicts with UI 3.7 mouse kernel)');
        // Legacy system disabled - NodeLinking2_3 handles all mouse detection
    }

    /**
     * Setup Node Inspect Panel
     * Persistent panel showing node details
     */
    // REMOVED: setupNodeInspectPanel - moved to LEGACY (2026-04-03)
    setupNodeInspectPanel() {
        // this.nodeInspectPanel = new UINodeInspectPanel(this.languageEngine, this.poetryEngine, this);
        // console.log('✓ Node Inspect Panel initialized (persistent display)');
        this.nodeInspectPanel = null;
    }

    /**
     * Setup Selected Node Badge 3.2
     * Minimalist badge under crosshair showing QNT-ORB-SYN code + archetype
     */
    setupSelectedNodeBadge() {
        this.selectedNodeBadge = null;
    }

    /**
     * Setup Selected Node Label 3.3
     * Floating label above selected node showing [SELECTED] code
     */
    // REMOVED: setupSelectedNodeLabel - moved to LEGACY (2026-04-03)
    setupSelectedNodeLabel() {
        // this.selectedNodeLabel = new UISelectedNodeLabel3_3(this.scene, this.camera);
        // console.log('✓ Selected Node Label 3.3 initialized (floating above node)');
        this.selectedNodeLabel = null;
        console.log('⊘ Selected Node Label 3.3 DISABLED (moved to LEGACY)');
    }

    /**
     * Setup Synaptic Fatigue Adapter
     * Long-term wear and recovery at nodes
     */
    setupSynapticFatigue() {
        try {
            const adapter = setupSynapticFatigueIntegration(this);
            markReleaseContainmentRuntime(this, 'synapticFatigue', { initialized: Boolean(adapter) });
            console.log('[main.js] SynapticFatigueAdapter initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynapticFatigueAdapter init error:', err);
        }
    }

    /**
     * Setup Network Fatigue System
     * Canonical fatigue writer for node metrics
     */
    setupNetworkFatigue() {
        try {
            const nodeDynamics = { aiNodes: this.aiNodes };
            this.networkFatigueSystem = new NetworkFatigueSystem(nodeDynamics);
            setupNetworkFatigueConsoleAPI(this.networkFatigueSystem, nodeDynamics);

            if (typeof window !== 'undefined') {
                window.networkFatigue = this.networkFatigueSystem;
                window.ATOMA_NETWORK_FATIGUE = this.networkFatigueSystem;
            }

            console.info('[main.js] NetworkFatigueSystem initialized ✓');
        } catch (err) {
            console.warn('[main.js] NetworkFatigueSystem init error:', err);
        }
    }

    /**
     * Setup Synaptic Specialization Adapter
     * Visual learning from repeated behavior (excitatory vs inhibitory)
     */
    setupSynapticSpecialization() {
        try {
            const adapter = setupSynapticSpecializationIntegration(this);
            markReleaseContainmentRuntime(this, 'synapticSpecialization', { initialized: Boolean(adapter) });
            console.log('[main.js] SynapticSpecializationAdapter initialized ✓');
        } catch (err) {
            console.warn('[main.js] SynapticSpecializationAdapter init error:', err);
        }
    }

    /**
     * Setup Influence Attenuation & Absorption Visuals (Session 128)
     * Visualizes how harmonic influence weakens/absorbs at non-harmonic nodes
     * VISUAL-ONLY SYSTEM: Creates attenuation zones and absorption blooms
     */
    setupInfluenceAttenuationAbsorption() {
        try {
            // Initialize system with core world references
            // Harmonic hub detection happens internally via node/link analysis
            this.influenceAttenuationAbsorption = new InfluenceAttenuationAbsorptionSystem_Session128(
                this.scene,
                this.world || { aiNodes: this.aiNodes, linkingSystem: this.linkingSystem },
                null,  // Harmonic hub system (can be null, auto-detected internally)
                null,  // Harmonic influence system (can be null, auto-detected internally)
                {
                    minLinksForHub: 2,
                    harmonyThreshold: 0.3,
                    attenuationZoneRadiusBase: 1.0,
                    attenuationZoneOpacityBase: 0.12,
                    bloomOpacityMin: 0.08,
                    bloomOpacityMax: 0.15,
                    bloomLifetime: 0.6,
                }
            );

            console.log('[main.js] InfluenceAttenuationAbsorptionSystem initialized ✓');
            console.log('  - Attenuation zones around non-harmonic nodes');
            console.log('  - Absorption blooms on influence arrival');
            console.log('  - Link termination softening');
        } catch (err) {
            console.warn('[main.js] InfluenceAttenuationAbsorptionSystem init error:', err);
        }
    }

    /**
     * Setup Influence Reflection & Back-Pressure (Session 129)
     * Visualizes how resistant nodes reject influence through elastic reflection
     */
    setupInfluenceReflection() {
        try {
            // REMOVED: harmonicInfluenceSystem reference — moved to LEGACY (2026-05-14)
            // Initialize reflection system with core world references
            this.influenceReflection = new InfluenceReflectionBackPressureSystem_Session129(
                this.scene,
                this.world || { aiNodes: this.aiNodes, linkingSystem: this.linkingSystem },
                null,
                this.aiNodes,
                this.linkingSystem,
                {
                    pressureZoneStart: 0.7,
                    pressureZoneEnd: 0.95,
                    pressureThickness: 1.2,
                    pressureGlowBase: 0.08,
                    reflectionPulseWidth: 0.15,
                    reflectionPulseOpacity: 0.18,
                    reflectionPulseLifetime: 0.8,
                    reflectionPulseSpeed: 1.2,
                    harmonyDamping: 0.6,
                    corruptionBoost: 1.4,
                    instabilitySpeedup: 0.8,
                    synergyElasticity: 0.7
                }
            );
            
            this.influenceReflection.setup();
            
            console.log('[main.js] InfluenceReflectionBackPressureSystem initialized ✓');
            console.log('  - Pressure zone buildup on resistant nodes');
            console.log('  - Reflection pulses traveling backward');
            console.log('  - Surface ripples on impact');
            console.log('  - State-modulated by harmony/corruption/instability');
        } catch (err) {
            console.warn('[main.js] InfluenceReflectionBackPressureSystem init error:', err);
        }
    }

    /**
     * Setup Standing Wave & Oscillation Trap (Session 130)
     * Visualizes energy trapped between opposing nodes forming standing waves
     */
    setupStandingWaveTrap() {
        try {
            // Initialize trap system with core world references
            this.standingWaveTrap = new StandingWaveOscillationTrapSystem_Session130(
                this.scene,
                this,
                this.influenceReflection || this.waveReflectionSystem || globalThis.waveReflectionSystem,
                this.aiNodes,
                this.linkingSystem,
                {
                    reflectionCountThreshold: 1,
                    detectionWindow: 1.0,
                    trapCenterOffset: 0.5,
                    trapRadiusBase: 0.2,
                    standingWaveAmplitude: 1.1,
                    beatFrequencyBase: 2.2,
                    harmonyDamping: 0.5,
                    corruptionStabilization: 0.7,
                    instabilityWobble: 0.4,
                    synergyClarity: 0.8,
                    dampingRate: 0.15,
                    breakthroughThreshold: 0.8,
                    collapseTriggerInstability: 0.85
                }
            );
            this.standingWaveTrapSystem = this.standingWaveTrap;
            this.standingWaveTrapSystem.waveEngine =
                this.waveInterferenceEngine || this.standingWaveTrapSystem.waveEngine || null;
            
            this.standingWaveTrap.setup();
            
            console.log('[main.js] StandingWaveOscillationTrapSystem initialized ✓');
            console.log('  - Detects standing wave conditions (reflection frequency + phase)');
            console.log('  - Creates oscillation trap zones between opposing nodes');
            console.log('  - Visualizes interference patterns and beat frequencies');
            console.log('  - Tracks resolution paths (damping, breakthrough, collapse)');
        } catch (err) {
            console.warn('[main.js] StandingWaveOscillationTrapSystem init error:', err);
        }
    }

    /**
     * Setup Standing Wave Visual Renderer (Session 131)
     * Renders standing wave meshes, antinode glows, and trap zones
     */
    setupStandingWaveRenderer() {
        try {
            // Initialize visual renderer with core world references
            this.standingWaveRenderer = new StandingWaveVisualRenderer_Session131(
                this.scene,
                this.standingWaveTrapSystem || this.standingWaveTrap,  // Trap system (provides state)
                this.linkingSystem,
                this.aiNodes,
                {
                    antinodeRadius: 0.25,
                    antinodeOpacityBase: 0.65,
                    antinodeGlowIntensity: 3.0,
                    antinodeLODDistance: 80,
                    
                    bandThickness: 0.05,
                    bandTransitionSmoothing: 0.3,
                    brightBandOpacity: 0.45,
                    dimBandOpacity: 0.15,
                    
                    trapZoneThickness: 0.1,
                    trapZoneOpacityBase: 0.28,
                    trapZoneGlowFactor: 1.2,
                    
                    haloPulseFrequency: 3.0,
                    haloPulseAmount: 0.25,
                    
                    dampingFadeRate: 0.5,
                    breakthroughAcceleration: 2.0,
                    collapseInwardRate: 0.3,
                    
                    maxAntinodeMeshes: 100,
                    maxTrapZoneMeshes: 30,
                        enableLOD: true,
                    attachRoot: this.vfxRoot || this.worldRoot || this.scene,
                    attachRootResolver: () => this.vfxRoot || this.worldRoot || this.scene
                }
            );
            
            this.standingWaveRenderer.setup();
            
            console.log('[main.js] StandingWaveVisualRenderer initialized ✓');
            console.log('  - Renders antinode glow meshes in trap zones');
            console.log('  - Applies interference band patterns to links');
            console.log('  - Animates node halo counter-pulsing');
            console.log('  - Handles resolution animations (damping, breakthrough, collapse)');
        } catch (err) {
            console.warn('[main.js] StandingWaveVisualRenderer init error:', err);
        }
    }

    /**
     * Setup Node Linked Aura Renderer (Session 146)
     * Creates noise-driven aura meshes that react to harmony/corruption state
     */
    setupNodeAuraRenderer() {
        try {
            // Initialize aura renderer with scene and node references
            this.nodeAuraRenderer = new NodeLinkedAuraRenderer_Session146(
                this.scene,
                this.aiNodes,
                {
                    enabled: false,
                    // Aura visuals
                    baseRadius: 1.2,
                    baseDisplacement: 0.3,
                    baseOpacity: 0.25,

                    // Behavior
                    linkBoostDuration: 0.7,
                    linkBoostIntensity: 1.8,

                    // Performance & safety
                    enabled: false, // Disabled by default (opt-in)
                    debugMode: false,
                    maxAurasPerFrame: 100,
                    meshSubdivisions: 2
                }
            );

            this.nodeAuraRenderer.init();
            this.nodeAuraRenderer.frameScheduler = this.frameScheduler;

            // Setup console API for debugging
            this.nodeAuraRenderer.setupConsoleAPI(window);

            console.log('[main.js] NodeLinkedAuraRenderer initialized ✓');
            console.log('  - Renders noise-driven aura meshes around nodes');
            console.log('  - Reacts to harmony/corruption state');
            console.log('  - Disabled by default (enable via enableNodeAuras())');
        } catch (err) {
            console.warn('[main.js] NodeLinkedAuraRenderer init error:', err);
        }
    }

    /**
     * Setup Link Aura System (Phase 3C Week 10)
     * Creates GPU-driven cylindrical halo system around links
     */
    setupLinkAuraSystem() {
        try {
            this.linkAuraSystem = new LinkAuraSystem_v1({
                scene: this.scene,
                linkManager: this.linkingSystem,
                fxPerformance: this.fxPerformance,
                debugEnabled: false,
            });
            this.linkAuraSystem.frameScheduler = this.frameScheduler;

            if (this.linkingSystem?.links && Array.isArray(this.linkingSystem.links)) {
                for (const link of this.linkingSystem.links) {
                    this.linkAuraSystem.registerLink?.(link);
                }
            }

            if (this.linkingSystem?.registerLinkCreatedCallback) {
                this.linkingSystem.registerLinkCreatedCallback(timeLinkCreateCallback('LINK_GLOW linkAura.registerLink', (link) => {
                    this.linkAuraSystem?.registerLink?.(link);
                }), {
                    layerKey: 'LINK_GLOW'
                });
            }

            if (this.linkingSystem?.registerLinkRemovedCallback) {
                this.linkingSystem.registerLinkRemovedCallback((link) => {
                    this.linkAuraSystem?.unregisterLink?.(link);
                }, {
                    layerKey: 'LINK_GLOW'
                });
            }

            console.log('[main.js] LinkAuraSystem_v1 initialized ✓');
        } catch (err) {
            console.warn('[main.js] LinkAuraSystem_v1 init error:', err);
            this.linkAuraSystem = null;
        }
    }

    /**
     * Setup Wave Interference Pattern System (Session 132)
     * Visualizes constructive/destructive interference from colliding reflections
     */
    setupWaveInterference() {
        try {
            // Initialize wave interference system
            this.waveInterference = new WaveInterferencePatternSystem_Session132(
                this.scene,
                this.influenceReflection,  // Reflection system (required)
                this.linkingSystem,
                this.aiNodes,
                {
                    collisionWindowSeconds: 0.5,
                    pathProximityThreshold: 0.3,
                    phaseDifferenceThreshold: 0.2,
                    minWaveIntensity: 0.1,
                    
                    constructiveOpacity: 0.25,
                    constructiveGlow: 1.5,
                    constructiveAmplification: 1.8,
                    
                    destructiveOpacity: 0.08,
                    destructiveGlow: 0.3,
                    destructiveDamping: 0.5,
                    
                    beatFrequencyRange: [0.5, 4.0],
                    beatAmplification: 1.2,
                    
                    harmonyCancellation: 0.4,
                    corruptionAmplification: 0.6,
                    instabilityNoise: 0.2,
                    synergyClarity: 0.8,
                    
                    emergenceTime: 0.3,
                    peakDuration: 2.0,
                    dissipateTime: 1.5,
                    
                    maxInterferenceMeshes: 18,
                    maxConcurrentInterferences: 8,
                    enableLOD: true,
                    lodDistance: 28,
                    visualUpdateHz: 20,
                    spikeCount: 3
                }
            );
            this.wavePatternSystem = this.waveInterference;
            this.wavePatternSystem.waveEngine =
                this.waveInterferenceEngine || this.wavePatternSystem.waveEngine || null;
            
            this.waveInterference.setup();
            this.waveInterference.setEventBus?.(this.semanticBus);

            if (this.linkingSystem?.links && Array.isArray(this.linkingSystem.links)) {
                for (const link of this.linkingSystem.links) {
                    this.waveInterference.seedLinkBirth?.(link, { link, linkRef: link });
                }
            }

            if (this.linkingSystem?.registerLinkCreatedCallback && !this.linkingSystem.__waveInterferenceBirthBridgeBound) {
                this.linkingSystem.registerLinkCreatedCallback(timeLinkCreateCallback('LINK_WAVE waveInterference.seedLinkBirth', (sourceNode, targetNode, link) => {
                    this.waveInterference?.seedLinkBirth?.(link ?? {
                        sourceNode,
                        targetNode
                    }, {
                        link,
                        sourceNode,
                        targetNode,
                        sourceNodeId: sourceNode?.userData?.nodeId ?? sourceNode?.id ?? sourceNode?.uuid ?? null,
                        targetNodeId: targetNode?.userData?.nodeId ?? targetNode?.id ?? targetNode?.uuid ?? null,
                        sourcePosition: sourceNode?.position ? { x: sourceNode.position.x, y: sourceNode.position.y, z: sourceNode.position.z } : null,
                        targetPosition: targetNode?.position ? { x: targetNode.position.x, y: targetNode.position.y, z: targetNode.position.z } : null,
                        intensity: link?.userData?.synergy?.score ?? link?.synergyScore ?? link?.userData?.metrics?.synergy ?? 0
                    });
                    if (link) {
                        this.primeLinkShaderMaterials(link, 'link-created-shader-prime');
                    }
                }), {
                    layerKey: 'LINK_WAVE',
                    immediate: true
                });
                this.linkingSystem.__waveInterferenceBirthBridgeBound = true;
            }

            if (this.linkingSystem?.registerLinkRemovedCallback && !this.linkingSystem.__waveInterferenceCleanupBridgeBound) {
                this.linkingSystem.registerLinkRemovedCallback((sourceNode, targetNode, link) => {
                    this.waveInterference?.clearLink?.(link ?? link?.id ?? null, sourceNode, targetNode);
                }, {
                    layerKey: 'LINK_WAVE'
                });
                this.linkingSystem.__waveInterferenceCleanupBridgeBound = true;
            }

            if (this.semanticBus?.on && !this.__waveInterferenceSemanticBirthBound) {
                this.semanticBus.on('link.created', (event = {}) => {
                    this.waveInterference?.seedLinkBirth?.(event.link ?? event.linkRef ?? event, event);
                });
                this.semanticBus.on('network.link.destroyed', (event = {}) => {
                    this.waveInterference?.clearLink?.(event.link ?? event.linkRef ?? event.linkId ?? null, event.sourceNode ?? null, event.targetNode ?? null);
                });
                this.__waveInterferenceSemanticBirthBound = true;
            }

            console.log('[main.js] WaveInterferencePatternSystem initialized ✓');
            console.log('  - Detects wave collision points (converging paths)');
            console.log('  - Visualizes constructive interference (golden amplification)');
            console.log('  - Visualizes destructive interference (dark cancellation)');
            console.log('  - Animates beat frequency patterns from frequency differences');
            console.log('  - Modulated by harmony/corruption/instability/synergy');
        } catch (err) {
            console.warn('[main.js] WaveInterferencePatternSystem init error:', err);
        }
    }

    /**
     * Setup Resonance Rupture Visual System (Session 133)
     * Visualizes standing wave collapse and structural failure under pressure
     */
    setupResonanceRupture() {
        try {
            // Initialize resonance rupture system
            this.resonanceRupture = new ResonanceRuptureVisualSystem_Session133(
                this.scene,
                this.standingWaveTrap,     // Trap system (required)
                this.influenceReflection,  // Reflection system (optional)
                this.linkingSystem,
                this.aiNodes,
                {
                    stressAccumulationRate: 0.3,
                    stressRuptureThreshold: 0.85,
                    corruptionRuptureBoost: 0.4,
                    instabilityRuptureBoost: 0.3,
                    phaseDivergenceThreshold: 0.6,
                    amplitudeRuptureThreshold: 0.9,
                    minTrapLifetime: 1.0,
                    
                    stressIndicatorOpacity: 0.3,
                    stressCompressionFactor: 1.3,
                    stressFrequencyIncrease: 1.5,
                    
                    ruptureDuration: 1.5,
                    ruptureBurst: 0.8,
                    ruptureBurstWidth: 0.2,
                    ruptureBurstGlow: 2.5,
                    
                    propagationSpeed: 2.0,
                    propagationDistance: 3.0,
                    propagationDamping: 0.85,
                    propagationPaths: 2,
                    
                    scarOpacity: 0.15,
                    scarDuration: 60.0,
                    scarDeformation: 0.1,
                    scarFrequencyDamping: 0.4,
                    
                    haloDestabilizationAmount: 0.3,
                    haloDestabilizationDuration: 0.5,
                    haloRecoveryRate: 0.8,
                    
                    harmonyRupturePrevention: 0.6,
                    corruptionRuptureAcceleration: 0.4,
                    instabilityRuptureEarlier: 0.5,
                    synergyRuptureClarity: 0.7,
                    
                    maxConcurrentRuptures: 5,
                    maxRupturePropagations: 20,
                    maxResonanceScarsMeshes: 20,
                    enableLOD: true,
                    lodDistance: 40
                },
                this.semanticBus
            );

            this.resonanceRupture.setup();

            // PATCH 1: Connect resonance rupture to cascading rupture system
            if (this.cascadingRuptures) {
                this.resonanceRupture.cascadingRuptureSystem = this.cascadingRuptures;
            }

            console.log('[main.js] ResonanceRuptureVisualSystem initialized ✓');
            console.log('  - Monitors standing wave stress accumulation');
            console.log('  - Pre-rupture stress zones with visual tension');
            console.log('  - Rupture burst events at convergence points');
            console.log('  - Energy propagation along network paths');
            console.log('  - Resonance scars (persistent visual memory)');
            console.log('  - Node halo destabilization and recovery');
            console.log('  - State-modulated by harmony/corruption/synergy');
        } catch (err) {
            console.warn('[main.js] ResonanceRuptureVisualSystem init error:', err);
        }
    }

    /**
     * Setup Harmonic Healing + Recovery Visual System (Merged)
     * Replaces HarmonicHealingVisualSystem_Session134 + HarmonicRecoveryVisualSystem_Session138
     * 100% event-driven via canonical scoped metric tier events.
     */
    setupHarmonicHealingRecoverySystem() {
        try {
            // 1. Audio System (Session 135)
            if (!this.harmonicAudio) {
                this.harmonicAudio = new HarmonicAudioReactivitySystem_Session135(this.camera);
                if (this.audioSystem?.initialized && this.harmonicAudio.start) {
                    this.harmonicAudio.start().catch((err) => {
                        console.warn('[main.js] HarmonicAudioReactivitySystem start failed:', err);
                    });
                }
                console.log('[main.js] HarmonicAudioReactivitySystem initialized ✓');
            }
            this.harmonicAudio.setEventBus?.(this.semanticBus);

            // 2. Healing Particle System (Session 136)
            if (!this.healingParticles) {
                this.healingParticles = new HealingParticleSystem_Session136(
                    this.scene,
                    this.resonanceRupture,
                    this.harmonicAudio,
                    { maxParticles: 2500 }
                );
                console.log('[main.js] HealingParticleSystem initialized ✓');
            }
            this.healingParticles.setEventBus?.(this.semanticBus);

            // 3. Link Trail Particle System
            if (!this.linkTrailParticles) {
                this.linkTrailParticles = new LinkTrailParticleSystem(this.scene, 200);
                this.linkTrailParticles.rebind?.({
                    scene: this.scene,
                    worldRoot: this.worldRoot
                });
                this.linkTrailParticles.setEventBus?.(this.semanticBus);
                console.log('[main.js] LinkTrailParticleSystem initialized ✓');
            }

            // 4. Merged Healing + Recovery Visual System
            if (!this.harmonicHealingRecovery) {
                this.harmonicHealingRecovery = new HarmonicHealingRecoveryVisualSystem(
                    this.scene,
                    this.linkingSystem,
                    this.healingParticles,
                    this.resonanceRupture,
                    this.semanticBus
                );
                this.harmonicHealingRecovery.frameScheduler = this.frameScheduler;
                this.harmonicHealingRecovery.rebind?.({
                    scene: this.scene,
                    linkingSystem: this.linkingSystem,
                    particleSystem: this.healingParticles,
                    ruptureSystem: this.resonanceRupture,
                    semanticBus: this.semanticBus,
                    frameScheduler: this.frameScheduler
                });
                console.log('[main.js] HarmonicHealingRecoveryVisualSystem initialized (Merged) ✓');
                console.log('  - Traveling waves on canonical tiered metric events');
                console.log('  - Coherence waves + halos on recovery triggers');
                console.log('  - Rupture completion monitoring');
            }
        } catch (err) {
            console.warn('[main.js] Harmonic Healing Recovery System initialization failed:', err);
        }
    }

    /**
     * Setup Regional Equilibrium Field System
     * Visualizes territorial equilibrium and long-term power balance shifts
     */
    setupRegionalEquilibrium() {
        try {
            this.regionalEquilibrium = new RegionalEquilibriumFieldSystem(
                this.scene,
                this.aiNodes,
                this.linkingSystem
            );
            console.log('[main.js] RegionalEquilibriumFieldSystem initialized ✓');
        } catch (err) {
            console.warn('[main.js] RegionalEquilibriumFieldSystem init error:', err);
        }
    }

    /**
     * Setup Cascading Rupture & Critical Node Failure Systems (Session 139+)
     * Hybrid visual + mechanical systems for network collapse propagation
     * ACTIVE BY DEFAULT - Disable via console: game.cascadingRuptures.disable()
     */
    setupCascadingRuptureAndFailure() {
        try {
            // Initialize cascading rupture system (visual propagation)
            this.cascadingRuptures = new CascadingRuptureSystem(
                this.scene,
                this.aiNodes,
                this.linkingSystem,
                this.regionalEquilibrium,
                this.semanticBus,
                () => this._getCanonicalWorldContext()
            );
            this.cascadingRuptures.frameScheduler = this.frameScheduler;
            if (Array.isArray(this.cascadingRuptures.visualEffects)) {
                for (const effect of this.cascadingRuptures.visualEffects) {
                    if (effect) effect.frameScheduler = this.frameScheduler;
                }
            }

            // PATCH: Connect resonance rupture to cascading rupture system (rebind after init)
            if (this.resonanceRupture) {
                this.resonanceRupture.cascadingRuptureSystem = this.cascadingRuptures;
                console.log('[main.js] ResonanceRupture → CascadingRuptureSystem wired ✓');
            }

            // Initialize critical node failure system (link severing)
            this.criticalNodeFailure = new CriticalNodeFailureSystem(
                this.scene,
                this.aiNodes,
                this.linkingSystem
            );
            this.criticalNodeFailure.setEventBus?.(this.semanticBus);

            this.cascadingRuptures.rebind({
                linkingSystem: this.linkingSystem,
                aiNodes: this.aiNodes,
                regionalEquilibrium: this.regionalEquilibrium,
                semanticBus: this.semanticBus,
                worldContextProvider: () => this._getCanonicalWorldContext()
            });
            this.cascadingRuptures.setEventBus?.(this.semanticBus);
            this.criticalNodeFailure.rebind?.({
                linkingSystem: this.linkingSystem,
                aiNodes: this.aiNodes,
                scene: this.scene
            });

            // Wire cascade system to trigger node failure
            this.cascadingRuptures.onNodeCritical = (node) => {
                if (this.criticalNodeFailure && this.criticalNodeFailure.enabled) {
                    this.criticalNodeFailure.markNodeApproachingCritical(node);
                }
            };

            // Wire failure system to record events in cascade history
            this.criticalNodeFailure.onLinksSevered = (node, linkIds) => {
                if (this.cascadingRuptures && this.cascadingRuptures.enabled) {
                    // Link severing can amplify local cascade energy
                    console.log(`[CascadingRupture] Node failure detected, ${linkIds.length} links severed`);
                }
            };

            // Connect rupture cascade callbacks to semantic events + cascade particles
            if (this.cascadingRuptures) {
                this.cascadingRuptures.onCascadeStart = (originNode, energy, worldContext = null) => {
                    const canonicalWorldContext = worldContext || this._getCanonicalWorldContext();
                    this.semanticBus?.emit?.(
                        'cascade.start',
                        {
                            sourceNode: originNode,
                            center: originNode?.position || null,
                            intensity: energy ?? 0,
                            value: energy ?? 0,
                            cascadeStage: 'start',
                            worldContext: canonicalWorldContext,
                            worldMacroState: canonicalWorldContext.worldMacroState || canonicalWorldContext.macroState || 'DORMANT',
                            macroProfile: canonicalWorldContext.macroProfile || null,
                            consciousnessState: canonicalWorldContext.consciousnessState || null,
                            worldMoodState: canonicalWorldContext.worldMoodState || null,
                            liveMetrics: canonicalWorldContext.liveMetrics || null
                        },
                        { priority: this.semanticBus?.priority?.INTERACTIVE ?? this.semanticBus?.priority?.NORMAL }
                    );
                };

                this.cascadingRuptures.onCascadeHop = (fromNode, toNode, energy, link, hopIndex = 0, worldContext = null) => {
                    const canonicalWorldContext = worldContext || this._getCanonicalWorldContext();
                    if (link) {
                        if (!link.userData) link.userData = {};
                        link.userData.cascadeIntensity = Math.max(
                            Number(link.userData.cascadeIntensity ?? 0) || 0,
                            Number(energy ?? 0) || 0
                        );
                        link.userData.cascadeConflictType = link.userData.cascadeConflictType || 'destructive';
                        link.userData.flowState = link.userData.flowState || {};
                        link.userData.flowState.intensity = Math.max(
                            Number(link.userData.flowState.intensity ?? 0) || 0,
                            Number(energy ?? 0) || 0
                        );
                        link.userData.flowState.type = link.userData.flowState.type || 'destructive';
                        this.cascadeParticleSystem?.handleLinkUpdated?.(link);
                    }
                    this.semanticBus?.emit?.(
                        'cascade.hop',
                        {
                            sourceNode: fromNode,
                            targetNode: toNode,
                            link: link || null,
                            intensity: energy ?? 0,
                            value: energy ?? 0,
                            hopIndex,
                            cascadeStage: 'hop',
                            worldContext: canonicalWorldContext,
                            worldMacroState: canonicalWorldContext.worldMacroState || canonicalWorldContext.macroState || 'DORMANT',
                            macroProfile: canonicalWorldContext.macroProfile || null,
                            consciousnessState: canonicalWorldContext.consciousnessState || null,
                            worldMoodState: canonicalWorldContext.worldMoodState || null,
                            liveMetrics: canonicalWorldContext.liveMetrics || null
                        },
                        { priority: this.semanticBus?.priority?.INTERACTIVE ?? this.semanticBus?.priority?.NORMAL }
                    );
                };

                this.cascadingRuptures.onCascadeComplete = (originNode, totalHops, worldContext = null) => {
                    const canonicalWorldContext = worldContext || this._getCanonicalWorldContext();
                    this.semanticBus?.emit?.(
                        'cascade.end',
                        {
                            sourceNode: originNode,
                            targetNode: null,
                            link: null,
                            totalHops: totalHops ?? 0,
                            intensity: 0,
                            value: 0,
                            cascadeStage: 'end',
                            worldContext: canonicalWorldContext,
                            worldMacroState: canonicalWorldContext.worldMacroState || canonicalWorldContext.macroState || 'DORMANT',
                            macroProfile: canonicalWorldContext.macroProfile || null,
                            consciousnessState: canonicalWorldContext.consciousnessState || null,
                            worldMoodState: canonicalWorldContext.worldMoodState || null,
                            liveMetrics: canonicalWorldContext.liveMetrics || null
                        },
                        { priority: this.semanticBus?.priority?.NORMAL }
                    );
                };
            }

            // NOTE: CascadingRuptureSystem is already registered to FrameScheduler
            // in the slow semantic block (simulation.cascadingRuptures).
            // No duplicate registration here — the guard above was redundant.

            // Register HarmonicCascadeAmplification update loop to FrameScheduler
            if (this.frameScheduler && this.harmonicCascadeAmplification) {
                this.frameScheduler.register('simulation', (dt) => {
                    if (this.harmonicCascadeAmplification && this.harmonicCascadeAmplification.config.enabled) {
                        this.harmonicCascadeAmplification.update(dt);
                    }
                }, 'simulation.harmonicCascadeAmplification');
                console.log('[main.js] HarmonicCascadeAmplification registered to FrameScheduler ✓');
            }

            // Enable CascadingRuptureSystem by default
            if (this.cascadingRuptures && typeof this.cascadingRuptures.enable === 'function') {
                this.cascadingRuptures.enable();
                console.log('[main.js] CascadingRuptureSystem enabled by default ✓');
            }

            // Setup console API
            setupCascadeSystemConsoleAPI(this);

            console.log('[main.js] CascadingRuptureSystem & CriticalNodeFailureSystem initialized ✓');
            console.log('[main.js] ⚠️  CriticalNodeFailureSystem DISABLED by default for safety');
            console.log('[main.js] CascadingRuptureSystem ACTIVE by default');
            console.log('[main.js] Disable via console: game.cascadingRuptures.disable()');
            console.log('[main.js] Help: game.cascadeHelp()');
        } catch (err) {
            console.warn('[main.js] Cascading rupture/failure init error:', err);
        }
    }

    /**
     * Setup Link Semantic Pictogram System — Enhanced with Fusion (Session 139+)
     * Multi-layer semantic visual language with morphing, depth, flow intelligence, and glyph fusion
     */
    setupLinkSemanticPictograms() {
        if (!this.linkingSystem) return;
        if (this.linkSemanticPictograms) return;
        try {
            const conduitPictograms = this.linkingSystem?.conduitRenderer?.pictogramSystem || null;
            if (!conduitPictograms) {
                console.warn('[main.js] LinkSemanticPictogramSystem not available from conduitRenderer');
                return;
            }

            this.linkSemanticPictograms = conduitPictograms;
            // ENHANCED PICTOGRAM PATH (preferred)
            // WithFusion wraps LinkSemanticPictogramSystem_Enhanced.
            this.linkPictogramSystem = this.linkSemanticPictograms;
            const semanticPictogramsEnabled =
                window?.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__ !== undefined
                    ? !!window.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__
                    : (this.semanticPictogramsEnabled ?? true);
            this.setSemanticPictogramsEnabled?.(semanticPictogramsEnabled);
            if (typeof window !== 'undefined' && window.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__ !== undefined) {
                delete window.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__;
            }
            // Expose for console debugging
            if (typeof window !== 'undefined') {
                window.linkSemanticPictograms = this.linkSemanticPictograms;
                window.__PIC_SYSTEM__ = this.linkSemanticPictograms;
                window.linkingSystem = this.linkingSystem;
            }
            console.info('[main.js] LinkSemanticPictogramSystem initialized ✓ (conduit pictograms active)');
        } catch (err) {
            console.warn('[main.js] LinkSemanticPictogramSystem init error:', err);
        }
    }

    /**
     * Setup Harmonic Resonance Feedback System (Session 140+)
     * Composite glyphs emit subtle resonance fields influencing nearby link motion
     * Closed visual feedback loop: meaning shapes motion
     */
    setupHarmonicResonanceFeedback() {
        try {
            this.harmonicResonanceFeedbackSystem = new HarmonicResonanceFeedbackSystem(this.scene);
            this.harmonicResonanceFeedbackSystem.frameScheduler = this.frameScheduler;
            if (Array.isArray(this.harmonicResonanceFeedbackSystem.resonanceFields)) {
                for (const field of this.harmonicResonanceFeedbackSystem.resonanceFields) {
                    if (field) field.frameScheduler = this.frameScheduler;
                }
            }
            this.harmonicResonance = this.harmonicResonanceFeedbackSystem;
            setupHarmonicResonanceConsoleAPI(this, this.harmonicResonanceFeedbackSystem);
            console.log('[main.js] HarmonicResonanceFeedbackSystem initialized ✓');
            console.log('[main.js] Features: resonance fields, phase alignment, pictogram influence');
        } catch (err) {
            console.warn('[main.js] HarmonicResonanceFeedbackSystem init error:', err);
        }
    }

    /**
     * Setup Resonance Echo Trail System (Session 140+)
     * Harmonic afterimages as temporal memory of composite glyph movement
     * Stationary echo trails fade quietly, reinforcing continuity
     */
    setupResonanceEchoTrails() {
        try {
            this.resonanceEchoTrailSystem = new ResonanceEchoTrailSystem(this.scene, this.worldRoot);
            this.resonanceEchoTrailSystem.frameScheduler = this.frameScheduler;
            this.resonanceEchoTrails = this.resonanceEchoTrailSystem;
            setupResonanceEchoConsoleAPI(this, this.resonanceEchoTrailSystem);
            console.log('[main.js] ResonanceEchoTrailSystem initialized ✓');
            console.log('[main.js] Features: echo pool, temporal decay, harmony modulation');
        } catch (err) {
            console.warn('[main.js] ResonanceEchoTrailSystem init error:', err);
        }
    }

    /**
     * Setup Harmonic Topology Learning System (Session 140+)
     * Visualizes long-term network learning through topology evolution
     * Shows how repeated resonance, rupture, and fusion reshape flow patterns
     */
    setupHarmonicTopologyLearning() {
        try {
            this.harmonicTopology = new HarmonicTopologyLearningSystem(this.scene);
            this.harmonicTopology.frameScheduler = this.frameScheduler;
            this.harmonicTopology.setEventBus(this.semanticBus);
            setupHarmonicTopologyConsoleAPI(this, this.harmonicTopology);
            console.log('[main.js] HarmonicTopologyLearningSystem initialized ✓');
            console.log('[main.js] Features: flow bias, path reinforcement, scar memory, hub maturation');
        } catch (err) {
            console.warn('[main.js] HarmonicTopologyLearningSystem init error:', err);
        }
    }

    /**
     * Setup Synaptic Conflict Adaptive Resolution (Session 117)
     * Visual adapter for harmonic hub competition and phase interference
     */
    setupSynapticConflictSystem() {
        try {
            if (!this.harmonicTopology) {
                console.warn('[main.js] Topology not ready, skipping synaptic conflict adapter');
                return;
            }

            this.synapticConflict = setupSynapticConflictSystem(this, {
                enabled: true,
                debugMode: false
            });
            if (this.synapticConflict) {
                this.conflictSystem = this.synapticConflict;
            }

            console.log('[main.js] SynapticConflictAdaptiveResolution initialized ✓');
            console.log('[main.js] Features: phase beating, interference, fatigue yield, equilibrium drift');
        } catch (err) {
            console.warn('[main.js] SynapticConflictAdaptiveResolution init error:', err);
        }
    }

    /**
     * Setup Interdimensional Conflict Visualization (Session 118)
     * Epic organic time-space rift effects for harmonic hub conflicts
     */
    setupInterdimensionalConflictSystem() {
        try {
            if (!this.synapticConflict) {
                console.warn('[main.js] SynapticConflict not ready, skipping interdimensional conflict visualizer');
                return;
            }

            this.interdimensionalConflictVisualizer = setupInterdimensionalConflictIntegration(this, {
                enabled: true,
                debugMode: false,
                maxParticles: 500  // Adjust based on hardware (200-800)
            });

            if (this.interdimensionalConflictVisualizer) {
                console.log('[main.js] InterdimensionalConflictVisualizer initialized ✓');
                console.log('[main.js] Features: organic portal beams, time-space rifts, phase-based build-up');
                console.log('[main.js] Debug: window.interdimensionalConflict.getStatus()');
            }
        } catch (err) {
            console.warn('[main.js] InterdimensionalConflictVisualizer init error:', err);
        }
    }

    /**
     * Setup Topology Bias Visualization Layer (Session 140+)
     * Renders topology bias vectors and flow fields as dedicated visual layer
     * Makes learned space perception visible through subtle directional hints
     */
    setupTopologyBiasVisualization() {
        try {
            if (!this.harmonicTopology) {
                console.warn('[main.js] Topology not ready, skipping bias visualization');
                return;
            }

            this.topologyViz = new TopologyBiasVisualizationLayer(
                this.scene,
                this.worldRoot,
                this.camera,
                this.harmonicTopology,
                {
                    linkingSystem: this.linkingSystem,
                    semanticBus: this.semanticBus
                }
            );
            this.topologyViz.frameScheduler = this.frameScheduler;
            markReleaseContainmentRuntime(this, 'topologyBiasVisualization', { initialized: true });
            
            setupTopologyBiasVisualizationConsoleAPI(this);
            
            console.log('[main.js] TopologyBiasVisualizationLayer initialized ✓');
            console.log('[main.js] Features: bias vectors, flow fields, influence interaction');
            console.log('[main.js] Debug: game.toggleTopologyBiasVectorsDebug(), game.toggleTopologyFlowFieldsDebug()');
        } catch (err) {
            console.warn('[main.js] TopologyBiasVisualizationLayer init error:', err);
        }
    }

    /**
     * Setup Procedural Harmonic Glyph Generator (Session 140+ Polish)
     * Generates emergent visual language from topology learning history
     * Creates unique procedural glyphs representing learned network identity
     */
    setupProceduralHarmonicGlyphs() {
        try {
            if (!this.harmonicTopology) {
                console.warn('[main.js] Topology not ready, skipping procedural glyphs');
                return;
            }

            this.proceduralGlyphGenerator = new ProceduralHarmonicGlyphGenerator(
                this.scene,
                this.worldRoot,
                this.harmonicTopology
            );
            this.proceduralGlyphGenerator.frameScheduler = this.frameScheduler;
            markReleaseContainmentRuntime(this, 'proceduralHarmonicGlyphGenerator', { initialized: true });
            
            setupProceduralGlyphConsoleAPI(this);
            
            console.log('[main.js] ProceduralHarmonicGlyphGenerator initialized ✓');
            console.log('[main.js] Features: emergent symbols, topology-derived glyphs, region identity');
            console.log('[main.js] Debug: game.toggleProceduralGlyphDebug(), game.proceduralGlyphStatus()');
        } catch (err) {
            console.warn('[main.js] ProceduralHarmonicGlyphGenerator init error:', err);
        }
    }

    /**
     * Setup Regional Harmonic Cycle Controller (Session 140+ Polish - Animation)
     * Manages harmonic activity cycles for regions
     * Drives subtle glyph animation through cycle-based modulation
     */
    setupRegionalHarmonicCycles() {
        try {
            if (!this.harmonicTopology) {
                console.warn('[main.js] Topology not ready, skipping harmonic cycles');
                return;
            }

            this.harmonicCycleController = new RegionalHarmonicCycleController(
                this.harmonicTopology
            );
            
            setupRegionalHarmonicCycleConsoleAPI(this);
            
            console.log('[main.js] RegionalHarmonicCycleController initialized ✓');
            console.log('[main.js] Features: regional cycles, phase-driven animation, breathing glyphs');
            console.log('[main.js] Debug: game.toggleGlyphCycleDebug(), game.glyphCycleStatus()');
        } catch (err) {
            console.warn('[main.js] RegionalHarmonicCycleController init error:', err);
        }
    }

    /**
     * Setup Glyph Animation Modulator (Session 140+ Polish - Animation)
     * Applies harmonic cycle animations to procedural glyphs
     * Makes glyphs breathe with regional harmonic activity
     */
    setupGlyphAnimationModulator() {
        try {
            if (!this.harmonicCycleController) {
                console.warn('[main.js] Cycle controller not ready, skipping glyph animation');
                return;
            }

            this.glyphAnimationModulator = new GlyphAnimationModulator(
                this.harmonicCycleController
            );

            this.proceduralGlyphGenerator?.setGlyphAnimationModulator?.(this.glyphAnimationModulator);
            
            setupGlyphAnimationConsoleAPI(this);
            
            console.log('[main.js] GlyphAnimationModulator initialized ✓');
            console.log('[main.js] Features: cycle-driven animation, subtle breathing, regional coherence');
            console.log('[main.js] Debug: game.toggleGlyphAnimationDebug(), game.glyphAnimationStatus()');
        } catch (err) {
            console.warn('[main.js] GlyphAnimationModulator init error:', err);
        }
    }

    /**
     * Setup Composite Glyph Resonance Feedback (Session 140+ Visual-Only Feedback)
     * Makes composite glyph resonance perceptible through subtle spatial & temporal cues
     * Read-only visual adapter: no gameplay logic, pure perception
     */
    setupCompositeGlyphResonanceFeedback() {
        try {
            this.compositeResonanceFeedback = new CompositeGlyphResonanceFeedback();
            this.compositeResonanceFeedback.frameScheduler = this.frameScheduler;
            
            // Initialize with core systems
            this.compositeResonanceFeedback.initialize(
                this.scene,
                this.camera,
                this.network || { aiNodes: this.aiNodes, linkingSystem: this.linkingSystem }
            );
            
            console.log('[main.js] CompositeGlyphResonanceFeedback initialized ✓');
            console.log('[main.js] Features: spatial coherence, temporal phase alignment, boundary softening');
            console.log('[main.js] Lifetime: visual decay transitions (stable → fading → dissolving → cleanup)');
            console.log('[main.js] Reabsorption: source glyphs phase-converge during dissolution');
            console.log('[main.js] Optional: Glyph animation influence (disabled by default)');
            console.log('[main.js] Debug: game.toggleCompositeResonanceDebug(), game.compositeResonanceStatus()');
            console.log('[main.js] Decay: game.compositeGlyphDecayStatus()');
            console.log('[main.js] Optional: game.enableGlyphResonanceInfluence(), game.disableGlyphResonanceInfluence()');
        } catch (err) {
            console.warn('[main.js] CompositeGlyphResonanceFeedback init error:', err);
        }
    }

    /**
     * Setup Competition & Dominance Adapter (Session 113+)
     * Specialized nodes compete for territorial influence — pure visual storytelling
     */
    setupCompetitionDominance() {
        try {
            this.competitionDominance = new CompetitionDominanceAdapter_v1({
                dominanceStrength: 0.7,
                contestationStrength: 0.5,
                regionHopRadius: 2,
            });
            markReleaseContainmentRuntime(this, 'competitionDominance', { initialized: true });

            setupCompetitionDominanceIntegration(this.competitionDominance, this);
            console.log('[main.js] CompetitionDominanceAdapter initialized ✓');
        } catch (err) {
            console.warn('[main.js] CompetitionDominanceAdapter init error:', err);
        }
    }

    /**
     * Setup Selection Core 3.4
     * UNIFIED SELECTION KERNEL - Single source of truth for all selection
     */
    setupSelectionCore() {
        this.selectionCore = new NodeSelectionCore3_4();

        this.selectionCore.onSelectCallbacks.push((node) => {
            const nodeId = node?.userData?.nodeId || node?.id || node?.uuid;
            const category = node?.userData?.category;
            const payload = {
                nodeId,
                category,
                position: node?.position
                    ? { x: node.position.x, y: node.position.y, z: node.position.z }
                    : { x: 0, y: 0, z: 0 }
            };
            this.semanticBus.emit('node.selection', { type: 'select', nodeId, category }, { priority: this.semanticBus.priority.CRITICAL });
            this.semanticBus.emit('node:selected', { nodeId, category, timestamp: performance.now() }, { priority: this.semanticBus.priority.CRITICAL });
            this.semanticBus.emit('node.click', payload, { priority: this.semanticBus.priority.INTERACTIVE });
            this.setHudDirty('coreMetrics');
            this.setHudDirty('nodeInspector');
        });
        
        this.selectionCore.onDeselectCallbacks.push((node) => {
            const nodeId = node?.userData?.nodeId || node?.id || node?.uuid;
            const category = node?.userData?.category;
            this.semanticBus.emit('node.selection', { type: 'deselect', nodeId, category }, { priority: this.semanticBus.priority.CRITICAL });
            this.setHudDirty('coreMetrics');
            this.setHudDirty('nodeInspector');
        });

        console.log('✓ Selection Core 3.4 initialized (single source of truth)');
        console.log('✓ Selection Core semantic event bridge active');
    }

    /**
     * Setup Selected Node HUD
     * Displays selected node name and type in top-right corner
     */
    setupSelectedNodeHUD() {
        const selectedHUD = getSelectedHUD();
        console.log('[main.js] setupSelectedNodeHUD called - storing HUD reference');
        this.selectedHUD = selectedHUD;
        
        console.log('[main.js] setupSelectedNodeHUD: linking system is:', this.linkingSystem ? 'SET' : 'NULL');
        if (this.linkingSystem) {
            selectedHUD.setLinkingSystem(this.linkingSystem);
            console.log('[main.js] ✓ HUD connected to existing linkingSystem');
        } else {
            console.log('[main.js] setupSelectedNodeHUD: linkingSystem will be created in createAINodes()');
        }

        console.log('✓ Selected Node HUD initialized (top-right corner)');
    }

    /**
     * Setup Primary Node System 3.7
     * Disabled: UIPrimaryNodeTopBar3_7 has been removed from active use.
     */
    setupPrimaryNodeSystem() {
        // Primary node top bar is fully disabled and no longer registered.
        this.primaryNodeTopBar = null;

        this.nodeLinking = this.linkingSystem;

        console.log("✓ NodeLinking2_3 confirmed active");
        console.log('✓ Primary Node System 3.7 disabled and disconnected');
    }

    /**
     * Setup UI 3.1/3.2/3.3/3.4 Component Wiring
     * Connect all UI systems with selection core
     */
    setupUIWiring3_4() {
        // Set selection core reference for top bar
        // Wire up NodeLinking 2.1 with all UI components
        if (this.nodeLinking) {
            this.nodeLinking.setUIReferences(
                null,
                this.nodeInspectPanel,
                this.selectedNodeBadge,
                this.selectedNodeHighlight,
                this.selectedNodeLabel
            );

            // Set core reference
            this.nodeLinking.setSelectionCore(this.selectionCore);
        }
    }

    /**
     * Setup UI 3.1/3.2/3.3/3.4/3.5/3.7 Component Wiring
     * Connect all systems with unified selection core + 2.3 linking (primary node enabled)
     */
    setupUIWiring3_7() {
        // Set selection core reference for top bar
        // Wire up NodeLinking 2.3 (3.7) with all UI components
        if (this.nodeLinking) {
            this.nodeLinking.setUIReferences(
                null,
                this.nodeInspectPanel,
                this.selectedNodeBadge,
                this.selectedNodeHighlight,
                this.selectedNodeLabel,
                null
            );
            this.nodeLinking.setSelectionCore(this.selectionCore);

            // Set all nodes for unlinking checks from the canonical runtime registry.
            this.nodeLinking.setAllNodes(this.aiNodes?.nodes || []);
        }
    }

    /**
     * Setup UI 3.1/3.2/3.3 Component Wiring (Legacy - for compatibility)
     * Connect all UI systems together after initialization
     */
    setupUIWiring() {
        // Wire up NodeLinking 2.1 with all UI components (upgraded for 3.3)
        if (this.nodeLinking) {
            this.nodeLinking.setUIReferences(
                this.nodeInspectPanel,
                this.selectedNodeBadge,
                this.selectedNodeHighlight,
                this.selectedNodeLabel  // New: floating label
            );
        }
    }

    // REMOVED: setupSynergyPulseVisuals() — moved to LEGACY/april (2026-04-22)
    
    /**
     * Setup Harmonic Resonance Coupling v1.0
     * Synergy-driven visual coupling between linked nodes
     * Creates particle flow and phase-locked shimmer effects
     */
    setupHarmonicResonanceCoupling() {
        this.harmonicResonanceCoupling = new HarmonicResonanceCoupling_v1(this.scene, this.linkingSystem);
        
        // Register all existing links
        if (this.linkingSystem && this.linkingSystem.links) {
            for (const link of this.linkingSystem.links) {
                this.harmonicResonanceCoupling.registerLink(link);
            }
        }
        
        // Register callback for new link creation
        if (this.linkingSystem && this.linkingSystem.registerLinkCreatedCallback) {
            this.linkingSystem.registerLinkCreatedCallback((link) => {
                if (this.harmonicResonanceCoupling) {
                    this.harmonicResonanceCoupling.registerLink(link);
                }
            }, {
                layerKey: 'LINK_RESONANCE'
            });
        }
        
        // Register callback for link removal
        if (this.linkingSystem && this.linkingSystem.registerLinkRemovedCallback) {
            this.linkingSystem.registerLinkRemovedCallback((link) => {
                if (this.harmonicResonanceCoupling) {
                    this.harmonicResonanceCoupling.unregisterLink(link);
                }
            }, {
                layerKey: 'LINK_RESONANCE'
            });
        }
        
        console.log('✓ Harmonic Resonance Coupling v1.0 initialized');
    }
    
    /**
     * Setup Harmonic Hub Aura System (Session 126)
     * Creates shared resonance fields between nearby harmonic hubs
     */
    setupHarmonicHubAuraSystem() {
        try {
            // Dynamic world view: always read current runtime arrays (world rebuild-safe).
            const hubWorld = {};
            Object.defineProperty(hubWorld, 'nodes', {
                get: () => this.aiNodes?.nodes || []
            });
            Object.defineProperty(hubWorld, 'links', {
                get: () => this.linkingSystem?.links || []
            });
            this.harmonicHubAuraSystem = new HarmonicHubAuraSystem_Session126(
                this.scene,
                this.worldRoot,
                hubWorld,
                this.nodeAuraSystem,
                this.harmonicResonanceCoupling,
                {
                    minLinksForHub: 2,
                    harmonyThreshold: 0.3,
                    maxHubDistance: 12.0,
                    fieldMinRadius: 0.8,
                    fieldRadiusSynergyMult: 0.6,
                    fieldMaxRadius: 6.0,
                    fieldOpacityBase: 0.48,
                    fieldOpacitySynergyMult: 0.52,
                    fieldGlowIntensity: 1.05,
                }
            );
            this.harmonicHubAuraSystem.frameScheduler = this.frameScheduler;
            console.log('✓ Harmonic Hub Aura System (Session 126) initialized');
            console.log('[HubAura] Debug preset: game.harmonicHubAuraSystem.enableHighVisDebug() / disableHighVisDebug()');
        } catch (err) {
            console.warn('⚠ Harmonic Hub Aura System initialization failed:', err);
        }
    }
    
    // REMOVED: setupHarmonicInfluencePropagation() — moved to LEGACY (2026-05-14)
    // System was inactive (MOTION_OFF_PHASE1 = true) and redundant with HarmonicHubAuraSystem.

    /**
     * Setup Harmonic Cascade Amplification System (Session 145)
     * Hub-to-hub reinforcement where nearby hubs amplify each other's resonance
     */
    setupHarmonicCascadeAmplification() {
        try {
            this.harmonicCascadeAmplification = new HarmonicCascadeAmplification_Session145(
                this.scene,
                this.aiNodes,
                this.harmonicHubAuraSystem,
                this.harmonicResonanceCoupling,
                this.nodeAuraSystem,
                {
                    enabled: true,
                    debugMode: false,
                }
            );
            this.harmonicCascadeAmplification.frameScheduler = this.frameScheduler;
            this.harmonicCascadeAmplification.init?.();

            // Rebind existing wave visualization to live systems (amplified values — Session 147).
            if (this.cascadeResonanceWave) {
                this.cascadeResonanceWave.cascadeSystem = this.harmonicCascadeAmplification;
                this.cascadeResonanceWave.harmonicHubSystem = this.harmonicHubAuraSystem;
                this.cascadeResonanceWave.linkResonanceSystem = this.linkResonanceSystem || this.harmonicResonanceCoupling;
                this.cascadeResonanceWave.config.waveInfluenceMin = 0.25;
                this.cascadeResonanceWave.config.waveInfluenceMax = 0.50;
                this.cascadeResonanceWave.config.minHubCorruptionThreshold = 0.25;
                this.cascadeResonanceWave.config.minHubStabilityThreshold = 0.65;
            }
            if (this.cascadeResonanceWaveVisualization) {
                this.cascadeResonanceWaveVisualization.cascadeSystem = this.harmonicCascadeAmplification;
                this.cascadeResonanceWaveVisualization.harmonicHubSystem = this.harmonicHubAuraSystem;
                this.cascadeResonanceWaveVisualization.linkResonanceSystem = this.linkResonanceSystem || this.harmonicResonanceCoupling;
                this.cascadeResonanceWaveVisualization.config.waveInfluenceMin = 0.25;
                this.cascadeResonanceWaveVisualization.config.waveInfluenceMax = 0.50;
                this.cascadeResonanceWaveVisualization.config.minHubCorruptionThreshold = 0.25;
                this.cascadeResonanceWaveVisualization.config.minHubStabilityThreshold = 0.65;
            } else {
                this.setupCascadeResonanceWaveVisualization();
            }

            if (this.frameScheduler && !this._harmonicCascadeAmplificationRegistered) {
                this.frameScheduler.register('simulation', (dt) => {
                    if (this.harmonicCascadeAmplification && this.harmonicCascadeAmplification.config.enabled) {
                        this.harmonicCascadeAmplification.update(dt);
                    }
                }, 'simulation.harmonicCascadeAmplification');
                this._harmonicCascadeAmplificationRegistered = true;
            }

            // Wire cascade system reference into hub aura system for cascade reactivity
            if (this.harmonicHubAuraSystem) {
                this.harmonicHubAuraSystem.cascadeAmplificationSystem = this.harmonicCascadeAmplification;
            }

            // Initialize Cascade Burst Visual (Session 147)
            // Dramatic burst effect when cascade triggers from a hub
            if (!this.cascadeBurstVisual) {
                this.cascadeBurstVisual = new CascadeBurstVisual_Session147(this.scene, {
                    enabled: true,
                    debugMode: false,
                });
                console.log('✓ Cascade Burst Visual (Session 147) initialized');
            }

            // Register cascade burst visual update in visual lane
            if (this.frameScheduler && !this._cascadeBurstVisualRegistered) {
                this.frameScheduler.register('visual', (dt) => {
                    if (this.cascadeBurstVisual) {
                        this.cascadeBurstVisual.update(dt, this.camera);
                    }
                }, 'visual.cascadeBurstVisual');
                this._cascadeBurstVisualRegistered = true;
            }

            console.log('✓ Harmonic Cascade Amplification System (Session 145) initialized — CASCADE ACTIVE');
            
            // Setup console API for debugging
            setupCascadeConsoleAPI(window, this.harmonicCascadeAmplification);

            // Setup cascade burst visual console API
            if (this.cascadeBurstVisual?.setupConsoleAPI) {
                this.cascadeBurstVisual.setupConsoleAPI(window);
            }
        } catch (err) {
            console.warn('⚠ Harmonic Cascade Amplification initialization failed:', err);
        }
    }
    
    /**
     * Setup Link Resonance Flow System (Session 124)
     * Directional energy pulses traveling along links based on synergy
     */
    setupLinkResonanceFlowSystem() {
        try {
            const conduitResonanceSystem = this.linkRendererConduit?.linkResonanceFlowSystem
                || this.linkRendererConduit?.linkResonanceSystem
                || null;

            if (conduitResonanceSystem) {
                this.linkResonanceFlowSystem = conduitResonanceSystem;
            } else {
                this.linkResonanceFlowSystem = new LinkResonanceFlowSystem_Session124(
                    this.scene,
                    this.world || { aiNodes: this.aiNodes, linkingSystem: this.linkingSystem },
                    {
                        baseSpawnRate: 2.0,
                        synergySpawnBoost: 1.5,
                        pulseSpeedBase: 1.0,
                        pulseSpeedSynergyMult: 0.8,
                        pulseRadiusBase: 0.3,
                        pulseMaxRadius: 0.8,
                        pulseGlowIntensity: 1.5,
                        pulseLifetime: 2.0,
                        maxPulsesPerLink: 8,
                        maxTotalPulses: 1024,
                        enabled: true,
                    }
                );
            }
            if (this.linkRendererConduit) {
                this.linkRendererConduit.linkResonanceFlowSystem = this.linkResonanceFlowSystem;
                this.linkRendererConduit.linkResonanceSystem = this.linkResonanceSystem;
                this.linkResonanceFlowSystem.world = this.linkRendererConduit.linkSystem || this.linkingSystem || this.world || this.linkResonanceFlowSystem.world;
                this.linkResonanceFlowSystem.rebindScene?.(this.scene);
            }
            // Canonical alias for downstream systems expecting linkResonanceSystem contract.
            this.linkResonanceSystem = this.linkResonanceFlowSystem;

            // Late-wire systems initialized earlier in startup order.
            if (this.harmonicHubAuraSystem) {
                this.harmonicHubAuraSystem.linkResonanceSystem = this.linkResonanceSystem;
            }
            if (this.harmonicCascadeAmplification) {
                this.harmonicCascadeAmplification.linkResonanceSystem = this.linkResonanceSystem;
            }
            // REMOVED: preCascadeVisualHint linkResonanceSystem — moved to LEGACY/april (2026-04-22)
            console.log('✓ Link Resonance Flow System (Session 124) initialized');
            
            // Apply link resonance flow harmony integration
            // Connects LinkResonanceFlowSystem with HarmonyStabilizationSystem
            // Updates link.userData.flowState.energy with harmony levels
            try {
                applyLinkResonanceFlowHarmonyIntegration(this.linkResonanceFlowSystem, this.world || { links: this.linkingSystem?.links });
                console.log('✓ LinkResonanceFlowHarmonyIntegration applied');
            } catch (err) {
                console.warn('⚠ LinkResonanceFlowHarmonyIntegration failed:', err);
            }
            
            // Apply echo ripple integration
            // Connects LinkResonanceFlowSystem with ripple spawning on wave burst and cascade hop
            try {
                applyEchoRippleIntegration(this.linkResonanceFlowSystem, this.cascadeSystem, this.nodeAuraSystem);
                console.log('✓ EchoRippleIntegration applied');
            } catch (err) {
                console.warn('⚠ EchoRippleIntegration failed:', err);
            }
            
            // REMOVED: applyCorruptionDesaturationIntegration — moved to LEGACY/april (2026-04-22)
        } catch (err) {
            console.warn('⚠ Link Resonance Flow System initialization failed:', err);
        }
    }
    
    /**
     * Setup Harmonic Phase Synchronization System (Session 146)
     * Aligns harmonic phases of proximal hubs for coherent visual effects
     */
    setupHarmonicPhaseSynchronization() {
        try {
            this.harmonicPhaseSynchronization = new HarmonicPhaseSynchronization_Session146(
                this.harmonicCascadeAmplification,
                this.harmonicHubAuraSystem,
                {
                    syncStrength: 2.0,
                    damping: 0.85,
                    maxPhaseDelta: Math.PI,
                    phaseVariance: 0.3,
                    enabled: true,
                    debugMode: false,
                }
            );
            
            // Initialize hub phases
            this.harmonicPhaseSynchronization.init();
            
            // Setup console API
            setupPhaseSyncConsoleAPI(window, this.harmonicPhaseSynchronization);
            
            console.log('✓ Harmonic Phase Synchronization (Session 146) initialized');
        } catch (err) {
            console.warn('⚠ Harmonic Phase Synchronization initialization failed:', err);
        }
    }

    // REMOVED: setupPreCascadeVisualHint() — moved to LEGACY/april (2026-04-22)
    
    // REMOVED: setupHarmonicNodeResonanceHalos() — moved to LEGACY (2026-05-14)
    // Redundant with HarmonicHubAuraSystem field meshes.

    /**
     * Setup Visual Echo Trails v1.0
     * Shader-level echo trail enhancement for link pulses
     * Pure additive visual effect, no gameplay impact
     */
    setupVisualEchoTrails() {
        try {
        // Initialize shader system
        this.echoTrailsSystem = new VisualEchoTrails_v1();
        
        // Initialize integration layer
        this.echoTrailsIntegration = setupVisualEchoTrailsIntegration(
            this,
            this.echoTrailsSystem
        );
        
        console.log('✓ Visual Echo Trails v1.0 initialized');
        } catch (err) {
            console.warn('[main.js] Visual Echo Trails init failed:', err);
        }
    }
    
    /**
     * Setup Visual Network Time Elasticity v2.0 — Network Time Score System
     * Gameplay score: counts UP at 5/sec, REWINDS at 3.5/sec when canonical global.synergy.high is sustained for 5s
     * Win condition: Network Time reaches 0
     * Visual: animation time reversal during rewind (preserved from v1)
     */
    setupVisualNetworkTimeElasticity() {
        this.visualNetworkTimeElasticity = new VisualNetworkTimeElasticity_v1();
        
        // Wire score:won event — freeze simulation, play victory audio, show overlay
        this.visualNetworkTimeElasticity.on('score:won', (payload) => {
            console.log('%c🛡️ STABILIZATION ACHIEVED — COLLAPSE PREVENTED', 'color: #00ff88; font-size: 18px; font-weight: bold;');
            console.log('  Game Time:', payload.gameTime.toFixed(1), 'seconds');
            console.log('  Final Synergy:', (payload.avgSynergy * 100).toFixed(1) + '%');
            if (this.audioSystem?.playScoreVictory) {
                this.audioSystem.playScoreVictory({
                    ...this._buildAudioIdentityContext({ scoreStateLabel: 'won' }),
                    scoreSnapshot: this.visualNetworkTimeElasticity?.getScoreState?.() || null
                });
            }
            this._handleGameWon(payload);
        });

        // Wire score:rewinding event — ascending audio cue + slow temporal system
        this.visualNetworkTimeElasticity.on('score:rewinding', (payload) => {
            console.log('%c⏪ STABILIZATION SURGE ACTIVE', 'color: #ff8c00; font-weight: bold;',
                'Time:', payload.networkTime, 'Synergy:', (payload.avgSynergy * 100).toFixed(1) + '%');
            if (this.audioSystem?.playScoreRewindStart) {
                const scoreState = this.visualNetworkTimeElasticity?.getScoreState?.() || null;
                this.audioSystem.playScoreRewindStart({
                    ...this._buildAudioIdentityContext({ scoreState, scoreStateLabel: 'rewinding' }),
                    scoreSnapshot: scoreState
                });
            }
            this._handleRunIdentityMilestone('rewind', this.currentMode);
            if (this.gameplayHintLayer && !this._hintRewindStartShown) {
                this._hintRewindStartShown = true;
                if (this.firstRunGuidanceDirector?.isActive?.()) {
                    this.firstRunGuidanceDirector.handleRewindStart({
                        world: this.currentMode,
                        scoreState: this.visualNetworkTimeElasticity?.getScoreState?.() || null,
                        buildState: this.coreMetricsOverlay?.hud?.getCurrentBuildState?.(
                            this.visualNetworkTimeElasticity?.getScoreState?.() || null
                        ) || null
                    });
                } else {
                    this.gameplayHintLayer.show('rewindStart', { world: this.currentMode });
                }
            }
            // Slow temporal system during rewind (cycle clock ticks slower)
            if (this.coreMetricsOverlay?.temporalSystem?.setTimeScale) {
                this.coreMetricsOverlay.temporalSystem.setTimeScale(0.3, true);
            }
        });

        // Wire score:forward event — descending audio cue (rewind ended) + restore temporal
        this.visualNetworkTimeElasticity.on('score:forward', (payload) => {
            if (this.audioSystem?.playScoreRewindEnd) {
                const scoreState = this.visualNetworkTimeElasticity?.getScoreState?.() || null;
                this.audioSystem.playScoreRewindEnd({
                    ...this._buildAudioIdentityContext({ scoreState, scoreStateLabel: 'forward' }),
                    scoreSnapshot: scoreState
                });
            }
            // Restore temporal system to normal speed
            if (this.coreMetricsOverlay?.temporalSystem?.setTimeScale) {
                this.coreMetricsOverlay.temporalSystem.setTimeScale(1.0, false);
            }
        });

        // Wire score:dramaZone event — heartbeat audio when near win
        this.visualNetworkTimeElasticity.on('score:dramaZone', (payload) => {
            if (payload.active) {
                console.log('%c✨ DRAMA ZONE — Almost there!', 'color: #ffd700; font-weight: bold;',
                    'NT:', payload.networkTime, '/ Threshold:', payload.threshold);
                if (this.audioSystem?.playDramaZoneHeartbeat) this.audioSystem.playDramaZoneHeartbeat();
            }
        });

        // Wire score:milestone event — celebratory chime at rewind progress milestones
        this.visualNetworkTimeElasticity.on('score:milestone', (payload) => {
            console.log(`%c${payload.label}`, `color: #00e5ff; font-weight: bold; font-size: 14px;`,
                `Rewind: ${payload.rewindPercent}% | NT: ${payload.networkTime} / Peak: ${payload.peakNT}`);
            if (this.audioSystem?.playMilestoneChime) this.audioSystem.playMilestoneChime(payload.stars);
        });

        // Wire score system to CoreMetricsHUD (if overlay already created)
        this._wireScoreSystemToHUD();
        
        validateVisualNetworkTimeElasticity();
        console.log('✓ Network Time Score System v2.0 initialized');
        console.log('  - Forward: 5 units/sec (pressure)');
        console.log('  - Rewind: 3.5 units/sec (stabilization surge after canonical global.synergy.high is sustained for 5 seconds)');
        console.log('  - Win: collapse prevented when Network Time reaches 0');
    }

    /**
     * Wire the score system to the CoreMetricsHUD (via CoreMetricsOverlay)
     * Called after both systems are initialized.
     */
    _wireScoreSystemToHUD() {
        if (!this.visualNetworkTimeElasticity) return;
        
        // Direct HUD reference (if CoreMetricsOverlay created one)
        if (this.coreMetricsOverlay?.hud) {
            this.coreMetricsOverlay.hud.setScoreSystem(this.visualNetworkTimeElasticity);
            console.log('✓ Score system wired to CoreMetricsHUD (via overlay)');
        }
    }

    /**
     * Handle game won — calculate score, submit to leaderboard, show victory overlay.
     */
    _handleGameWon(payload) {
        this._handleRunIdentityMilestone('won', this.currentMode);
        this.firstRunGuidanceDirector?.handleWin?.({
            world: this.currentMode,
            scoreState: this.visualNetworkTimeElasticity?.getScoreState?.() || null,
            buildState: this.coreMetricsOverlay?.hud?.getCurrentBuildState?.(
                this.visualNetworkTimeElasticity?.getScoreState?.() || null
            ) || null
        });

        // Pause the simulation — game is won
        if (this.frameScheduler) {
            console.log('[NetworkTimeScore] Simulation paused — victory state active');
        }

        // ── Calculate score and submit to leaderboard ───────────────────
        let leaderboardResult = null;
        if (this.leaderboard) {
            const sessionStats = this.visualNetworkTimeElasticity?.getSessionStats?.() ?? {};
            const collapseStats = this.linkCollapseSystem?.getCollapseStatistics?.() ?? {};
            const runData = {
                gameTime: payload.gameTime ?? 0,
                avgSynergy: payload.avgSynergy ?? 0,
                peakNT: this.visualNetworkTimeElasticity?._peakNT ?? 0,
                maxCombo: this.visualNetworkTimeElasticity?._comboCount ?? 0,
                totalCollapses: collapseStats.totalCollapses ?? 0,
                totalRewindTime: parseFloat(sessionStats.totalRewindTime) || 0,
                averageRewindSynergy: parseFloat(sessionStats.averageRewindSynergy) || 0,
                rewindUptimeRatio: parseFloat(sessionStats.rewindUptimeRatio) || 0,
                world: this.currentMode ?? 'default',
                nodeCount: this.aiNodes?.nodes?.length ?? 0,
                linkCount: this.linkingSystem?.links?.length ?? 0,
            };
            leaderboardResult = this.leaderboard.submitRun(runData);
            console.log('%c📊 Score: ' + leaderboardResult.score.toLocaleString() + ' (Rank #' + leaderboardResult.rank + ')',
                'color: #00d4ff; font-size: 14px; font-weight: bold;');
            if (leaderboardResult.isNewBest) {
                console.log('%c🌟 NEW BEST SCORE!', 'color: #ffd700; font-size: 16px; font-weight: bold;');
            }
        }

        // Dispatch semantic event for other systems to react
        if (this.semanticBus) {
            this.semanticBus.emit('game:won', {
                networkTime: 0,
                gameTime: payload.gameTime,
                avgSynergy: payload.avgSynergy,
                score: leaderboardResult?.score ?? 0,
                rank: leaderboardResult?.rank ?? -1,
                isNewBest: leaderboardResult?.isNewBest ?? false,
                source: 'NetworkTimeScore'
            }, { priority: this.semanticBus.priority?.CRITICAL });
        }

        this._beginVictoryPresentation(payload, leaderboardResult);
    }

    _getActiveWorldFXPack() {
        return this.environmentDomain?.instances?.worldFXPack || this.worldFXPack || null;
    }

    _clearVictoryPresentationTimers() {
        if (!Array.isArray(this._victoryPresentationTimers)) {
            this._victoryPresentationTimers = [];
            return;
        }
        while (this._victoryPresentationTimers.length > 0) {
            const handle = this._victoryPresentationTimers.pop();
            clearTimeout(handle);
        }
    }

    _beginVictoryPresentation(payload, leaderboardResult = null) {
        this._clearVictoryPresentationTimers();
        this._victoryPresentationToken = (this._victoryPresentationToken || 0) + 1;
        const token = this._victoryPresentationToken;
        this._victoryPresentationActive = true;

        try {
            this.signatureMomentDirector?.disable?.('victory-sequence');
        } catch (_) {
            /* keep going */
        }

        const worldFXPack = this._getActiveWorldFXPack();
        const sequence = worldFXPack?.playVictoryTransformationSequence?.({
            worldId: this.currentMode || 'quantum',
            payload
        }) || null;
        const overlayDelayMs = Math.max(2600, sequence?.totalDurationMs || 4200);

        const showOverlayTimer = setTimeout(() => {
            if (this._victoryPresentationToken !== token) return;
            this._showVictoryOverlay(payload, leaderboardResult);
        }, overlayDelayMs);
        this._victoryPresentationTimers.push(showOverlayTimer);
    }

    /**
     * Show full-screen victory overlay with stats, score, and Play Again button.
     * @param {Object} payload - Win event payload
     * @param {Object} [leaderboardResult] - { score, rank, isNewBest, breakdown }
     */
    _showVictoryOverlay(payload, leaderboardResult = null) {
        // Prevent duplicate overlays
        if (document.getElementById('atoma-victory-overlay')) return;

        const gameTimeStr = payload.gameTime ?
            `${Math.floor(payload.gameTime / 60)}:${Math.floor(payload.gameTime % 60).toString().padStart(2, '0')}` : '--:--';
        const synergyStr = payload.avgSynergy ? `${(payload.avgSynergy * 100).toFixed(1)}%` : '--';
        const linkCount = this.linkingSystem?.links?.length ?? 0;
        const nodeCount = this.aiNodes?.nodes?.length ?? 0;

        // Phase 6A: Enhanced stats from session stats
        const sessionStats = this.visualNetworkTimeElasticity?.getSessionStats?.() ?? {};
        const maxSynergy = sessionStats.maxSynergyAchieved ? `${(parseFloat(sessionStats.maxSynergyAchieved) * 100).toFixed(1)}%` : '--';
        const totalRewindTime = sessionStats.totalRewindTime ? `${parseFloat(sessionStats.totalRewindTime).toFixed(1)}s` : '--';
        const bestNT = sessionStats.bestNetworkTime ?? '--';
        const gamesPlayed = sessionStats.gamesPlayed ?? '--';
        const gamesWon = sessionStats.gamesWon ?? '--';
        const worldName = this.currentMode ? String(this.currentMode).toUpperCase() : '--';
        const worldConfig = AtomaGame.WORLD_SCORE_CONFIG?.[this.currentMode];
        const scoreRule = worldConfig
            ? `GLOBAL ${worldConfig.sustainDuration}s / ${worldConfig.rewindSpeed}x`
            : 'GLOBAL 5s / 3.5x';

        // Score display
        const scoreStr = leaderboardResult?.score ? leaderboardResult.score.toLocaleString() : '--';
        const rankStr = leaderboardResult?.rank ? `#${leaderboardResult.rank}` : '--';
        const newBestBadge = leaderboardResult?.isNewBest ? '<div style="color:#ffd700;font-size:12px;font-weight:700;letter-spacing:0.1em;margin-top:4px">★ NEW BEST ★</div>' : '';

        const overlay = document.createElement('div');
        overlay.id = 'atoma-victory-overlay';
        overlay.innerHTML = `
            <style>
                #atoma-victory-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(4, 8, 16, 0.85);
                    backdrop-filter: blur(20px) saturate(1.4);
                    -webkit-backdrop-filter: blur(20px) saturate(1.4);
                    animation: atoma-victory-fadein 1.2s ease-out;
                    font-family: 'Rajdhani', 'Segoe UI', sans-serif;
                    color: rgba(200, 225, 245, 0.9);
                }
                @keyframes atoma-victory-fadein {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .victory-card {
                    text-align: center;
                    max-width: 420px;
                    padding: 48px 40px;
                    animation: atoma-victory-scale 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes atoma-victory-scale {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .victory-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    animation: atoma-victory-glow 2s ease-in-out infinite;
                }
                @keyframes atoma-victory-glow {
                    0%, 100% { filter: brightness(1); }
                    50% { filter: brightness(1.4); }
                }
                .victory-title {
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #00ff88;
                    text-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
                    margin-bottom: 8px;
                }
                .victory-subtitle {
                    font-size: 11px;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: rgba(0, 255, 136, 0.5);
                    margin-bottom: 32px;
                }
                .victory-score {
                    font-size: 36px;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-weight: 700;
                    color: #00d4ff;
                    text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
                    margin-bottom: 4px;
                }
                .victory-rank {
                    font-size: 11px;
                    letter-spacing: 0.15em;
                    color: rgba(0, 212, 255, 0.5);
                    margin-bottom: 24px;
                }
                .victory-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px 24px;
                    margin-bottom: 36px;
                    text-align: left;
                }
                .victory-stat {
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(0, 200, 220, 0.08);
                }
                .victory-stat-label {
                    font-size: 8px;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: rgba(200, 225, 245, 0.35);
                    margin-bottom: 2px;
                }
                .victory-stat-value {
                    font-size: 16px;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-weight: 600;
                    color: #00d4ff;
                }
                .victory-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                .victory-button {
                    display: inline-block;
                    padding: 12px 36px;
                    background: rgba(0, 255, 136, 0.1);
                    border: 1px solid rgba(0, 255, 136, 0.3);
                    border-radius: 4px;
                    color: #00ff88;
                    font-family: 'Rajdhani', 'Segoe UI', sans-serif;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .victory-button:hover {
                    background: rgba(0, 255, 136, 0.2);
                    border-color: rgba(0, 255, 136, 0.6);
                    box-shadow: 0 0 20px rgba(0, 255, 136, 0.15);
                }
                .victory-button.secondary {
                    background: rgba(0, 212, 255, 0.08);
                    border-color: rgba(0, 212, 255, 0.25);
                    color: #00d4ff;
                    padding: 12px 24px;
                }
                .victory-button.secondary:hover {
                    background: rgba(0, 212, 255, 0.15);
                    border-color: rgba(0, 212, 255, 0.5);
                    box-shadow: 0 0 15px rgba(0, 212, 255, 0.1);
                }
            </style>
            <div class="victory-card">
                <div class="victory-icon">🏆</div>
                <div class="victory-title">Stabilization Achieved</div>
                <div class="victory-subtitle">The living network held against collapse</div>
                <div class="victory-score">${scoreStr}</div>
                <div class="victory-rank">Rank ${rankStr}</div>
                ${newBestBadge}
                <div class="victory-stats">
                    <div class="victory-stat">
                        <div class="victory-stat-label">⏱ Game Time</div>
                        <div class="victory-stat-value">${gameTimeStr}</div>
                    </div>
                    <div class="victory-stat">
                        <div class="victory-stat-label">🔥 Max Synergy Peak</div>
                        <div class="victory-stat-value">${maxSynergy}</div>
                    </div>
                    <div class="victory-stat">
                        <div class="victory-stat-label">⚡ Total Surge Time</div>
                        <div class="victory-stat-value">${totalRewindTime}</div>
                    </div>
                    <div class="victory-stat">
                        <div class="victory-stat-label">📊 Lowest Collapse Pressure</div>
                        <div class="victory-stat-value">${bestNT}</div>
                    </div>
                    <div class="victory-stat">
                        <div class="victory-stat-label">Nodes Active</div>
                        <div class="victory-stat-value">${nodeCount}</div>
                    </div>
                    <div class="victory-stat">
                        <div class="victory-stat-label">Links Active</div>
                        <div class="victory-stat-value">${linkCount}</div>
                    </div>
                    <div class="victory-stat">
                        <div class="victory-stat-label">🏆 Games Won / Played</div>
                        <div class="victory-stat-value">${gamesWon} / ${gamesPlayed}</div>
                    </div>
                    <div class="victory-stat">
                        <div class="victory-stat-label">🌍 World / Stabilization Rule</div>
                        <div class="victory-stat-value">${worldName} <span style="font-size:10px;color:rgba(200,225,245,0.4)">${scoreRule}</span></div>
                    </div>
                </div>
                <div class="victory-buttons">
                    <button class="victory-button" id="atoma-victory-play-again">Play Again</button>
                    <button class="victory-button secondary" id="atoma-victory-leaderboard">Leaderboard</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Wire Play Again button
        const playAgainBtn = document.getElementById('atoma-victory-play-again');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this._resetGame();
            });
        }

        // Wire Leaderboard button
        const leaderboardBtn = document.getElementById('atoma-victory-leaderboard');
        if (leaderboardBtn && this.leaderboard) {
            leaderboardBtn.addEventListener('click', () => {
                this.leaderboard.showOverlay({
                    highlightRank: leaderboardResult?.rank ?? null,
                });
            });
        }
    }

    /**
     * Reset game state for a new playthrough.
     */
    _resetGame() {
        this._clearVictoryPresentationTimers();
        this._victoryPresentationActive = false;
        this._victoryPresentationToken = (this._victoryPresentationToken || 0) + 1;

        // Remove victory overlay
        const overlay = document.getElementById('atoma-victory-overlay');
        if (overlay) overlay.remove();

        // Hide leaderboard overlay if open
        if (this.leaderboard) {
            this.leaderboard.hideOverlay();
        }

        // Reset score system
        if (this.visualNetworkTimeElasticity) {
            this.visualNetworkTimeElasticity.reset();
        }

        try {
            this._getActiveWorldFXPack()?.stopVictoryTransformationSequence?.();
        } catch (_) {
            /* ignore */
        }

        try {
            this.signatureMomentDirector?.enable?.();
        } catch (_) {
            /* ignore */
        }

        // Restore temporal system to normal speed
        if (this.coreMetricsOverlay?.temporalSystem?.setTimeScale) {
            this.coreMetricsOverlay.temporalSystem.setTimeScale(1.0, false);
        }

        console.log('[NetworkTimeScore] Game reset — new playthrough started');
    }

    /**
     * Setup debug console commands
     */
    /**
     * Setup Link Micro-Impulses
     * Event-driven electrical nervous responses for links
     */
    setupLinkMicroImpulses() {
        try {
            const setup = setupLinkMicroImpulseIntegration(this);
            this.microImpulseSetup = setup;
            console.log('✅ [main.js] Link Micro-Impulse system initialized');
        } catch (err) {
            console.warn('⚠ Link Micro-Impulse setup error:', err);
        }
    }

    /**
     * Setup Pulse Intersection Impulses
     * Neural firing on pulse wave + link geometry contact
     */
    setupPulseIntersectionImpulses() {
        try {
            const setup = setupPulseIntersectionIntegration(this);
            this.pulseIntersectionSetup = setup;
            console.log('✅ [main.js] Pulse Intersection Impulse system initialized');
        } catch (err) {
            console.warn('⚠ Pulse Intersection Impulse setup error:', err);
        }
    }

    setupPulseWaveSystemBridge() {
        try {
            const bridge = setupPulseWaveSystemBridgeIntegration(this);
            this.pulseWaveSystemBridge = bridge;
            this.pulseWaveBridge = bridge;
            console.log('✅ [main.js] Pulse Wave System Bridge initialized');
        } catch (err) {
            console.warn('⚠ Pulse Wave System Bridge setup error:', err);
        }
    }

    setupPulseBoundaryInteraction() {
        try {
            const adapter = setupPulseBoundaryInteractionIntegration(this);
            this.pulseBoundaryInteractionAdapter = adapter;
            console.log('✅ [main.js] Pulse Boundary Interaction Adapter initialized');
        } catch (err) {
            console.warn('⚠ Pulse Boundary Interaction setup error:', err);
        }
    }

    setupSynapticGating() {
        try {
            const adapter = setupSynapticGatingIntegration(this);
            this.synapticGatingAdapter = adapter;
            markReleaseContainmentRuntime(this, 'synapticGating', { initialized: Boolean(adapter) });
            console.log('✅ [main.js] Synaptic Gating Adapter initialized');
        } catch (err) {
            console.warn('⚠ Synaptic Gating setup error:', err);
        }
    }

    getReleaseContainmentStatus() {
        const runtime = this._releaseContainmentRuntime || createAtomaReleaseContainmentRuntimeState();
        markReleaseContainmentRuntime(this, 'waveShaderStack', {
            enabled: this.waveShaderBridge !== null
                || this.waveShaderMaterialPatch !== null
                || this.waveTravelShaderPack !== null
                || this.waveDynamicsShaderPack !== null,
        });
        markReleaseContainmentRuntime(this, 'synergyChainReaction', {
            enabled: this.synergyChainReaction?.enabled === true,
        });
        return buildAtomaReleaseContainmentStatus(window, runtime);
    }

    setupDebugCommands() {
        // Store game reference for global access
        window.atoma = this;
        window.__ATOMA_RELEASE_CONTAINMENT_PROFILE__ = () => getAtomaReleaseContainmentProfile(window);
        window.__ATOMA_RELEASE_CONTAINMENT_STATUS__ = () => this.getReleaseContainmentStatus();
        window.__ATOMA_PERFORMANCE_DISCIPLINE__ = () => this.adaptivePerformanceMonitor?.getState?.() || null;
        window.__ATOMA_CAPTURE_PERF_BASELINE__ = () => this.capturePerformanceDisciplineBaseline?.(true) || null;
        window.__ATOMA_APPLY_PERF_TIER__ = (tier = 'FULL') => this.applyAdaptivePerformanceTier?.(tier, this.buildPerformanceBudgetSnapshot?.() || null, {
            source: 'window.__ATOMA_APPLY_PERF_TIER__',
            manual: true
        }) || null;
        window.__DEBUG = window.__DEBUG || {};
        window.__DEBUG.getLinkingSystem = () => this.linkingSystem ?? this.nodeLinkingSystem ?? this.nodeLinking ?? null;
        window.__DEBUG.getCollapseSystem = () => this.linkCollapseSystem ?? null;
        window.__DEBUG.getLinkResonanceFlowSystem = () => this.linkResonanceFlowSystem ?? this.linkRendererConduit?.linkResonanceFlowSystem ?? null;
        window.__DEBUG.createLinkById = (idA, idB) => window.__DEBUG.getLinkingSystem()?.createLinkById?.(idA, idB) ?? null;
        window.__DEBUG.createLink = (nodeA, nodeB) => window.__DEBUG.getLinkingSystem()?.createLink?.(nodeA, nodeB) ?? null;
        window.__DEBUG.getNodeById = (id) => window.__DEBUG.getLinkingSystem()?._resolveNodeById?.(id) ?? null;
        const resolveDebugLink = (linkIdOrIndex) => {
            const linkingSystem = window.__DEBUG.getLinkingSystem();
            const links = Array.isArray(linkingSystem?.links) ? linkingSystem.links : [];
            if (typeof linkIdOrIndex === 'number' && Number.isInteger(linkIdOrIndex)) {
                return links[linkIdOrIndex] ?? null;
            }
            if (typeof linkIdOrIndex === 'string' && linkIdOrIndex.trim()) {
                return links.find((entry) => entry?.id === linkIdOrIndex || entry?.linkId === linkIdOrIndex) ?? null;
            }
            return links[0] ?? null;
        };
        const buildActiveLinkSnapshot = (limit = 20) => {
            const linkingSystem = window.__DEBUG.getLinkingSystem();
            const links = Array.isArray(linkingSystem?.links) ? linkingSystem.links : [];
            const safeLimit = Math.max(1, Number(limit) || 20);
            return {
                activeLinkCount: links.length,
                pendingCollapseRequests: Array.isArray(linkingSystem?.pendingCollapseRequests)
                    ? linkingSystem.pendingCollapseRequests.length
                    : 0,
                links: links.slice(0, safeLimit).map((link, index) => ({
                    index,
                    id: link?.id ?? link?.linkId ?? null,
                    sourceNodeId: link?.source?.userData?.nodeId ?? link?.source?.id ?? null,
                    targetNodeId: link?.target?.userData?.nodeId ?? link?.target?.id ?? null,
                    metrics: link?.userData?.metrics ? { ...link.userData.metrics } : {},
                })),
            };
        };
        window.__DEBUG.getActiveLinkSnapshot = (limit = 20) => buildActiveLinkSnapshot(limit);
        window.__DEBUG.removeLink = (linkIdOrIndex = 0) => {
            const linkingSystem = window.__DEBUG.getLinkingSystem();
            const link = resolveDebugLink(linkIdOrIndex);
            if (!linkingSystem?.removeLink || !link) return null;
            const linkId = link?.id ?? link?.linkId ?? null;
            const sourceNodeId = link?.source?.userData?.nodeId ?? link?.source?.id ?? null;
            const targetNodeId = link?.target?.userData?.nodeId ?? link?.target?.id ?? null;
            linkingSystem.removeLink(link);
            return {
                removed: true,
                linkId,
                sourceNodeId,
                targetNodeId,
                snapshot: buildActiveLinkSnapshot(20),
            };
        };
        const buildCanonicalDebugLinkMetrics = (link, metrics = {}) => {
            const baseMetrics = link?.userData?.metrics && typeof link.userData.metrics === 'object'
                ? { ...link.userData.metrics }
                : {};
            const mergedMetrics = {
                ...baseMetrics,
                ...metrics,
            };
            if (typeof mergedMetrics.stability === 'number' && !Number.isFinite(mergedMetrics.instability)) {
                mergedMetrics.instability = Math.max(0, Math.min(1, 1 - mergedMetrics.stability));
            }
            mergedMetrics.__debugForcedAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            return mergedMetrics;
        };
        const applyDebugLinkMetrics = (linkingSystem, collapseSystem, link, metrics = {}, options = {}) => {
            const canonicalMetrics = buildCanonicalDebugLinkMetrics(link, metrics);
            if (link?.userData) {
                link.userData.metrics = canonicalMetrics;
            }
            linkingSystem.updateLinkMetrics(link, canonicalMetrics);
            collapseSystem?.onLinkMetricsUpdated?.(link, canonicalMetrics, {
                debugForced: true,
                source: 'window.__DEBUG.pushLinkMetrics',
            });
            if (options.runCollapseArbiter !== false) {
                linkingSystem.runCollapseArbiter?.();
            }
            return {
                ok: true,
                linkId: link?.id ?? link?.linkId ?? null,
                effectiveMetrics: canonicalMetrics,
                metrics: link?.userData?.metrics ? { ...link.userData.metrics } : {},
                collapseStats: collapseSystem?.getCollapseStatistics?.() ?? null,
                collapseState: collapseSystem?.getCollapseState?.(link) ?? null,
                snapshot: buildActiveLinkSnapshot(20),
            };
        };
        window.__DEBUG.pushLinkMetrics = (linkIdOrIndex, metrics = {}, options = {}) => {
            const linkingSystem = window.__DEBUG.getLinkingSystem();
            const collapseSystem = window.__DEBUG.getCollapseSystem();
            const link = resolveDebugLink(linkIdOrIndex);
            if (!linkingSystem?.updateLinkMetrics || !link) {
                return { ok: false, reason: 'link-not-found' };
            }
            return applyDebugLinkMetrics(linkingSystem, collapseSystem, link, metrics, options);
        };
        window.__DEBUG.sustainLinkMetrics = async (linkIdOrIndex, metrics = {}, options = {}) => {
            const linkingSystem = window.__DEBUG.getLinkingSystem();
            const collapseSystem = window.__DEBUG.getCollapseSystem();
            if (!linkingSystem?.updateLinkMetrics) {
                return { ok: false, reason: 'linking-system-unavailable' };
            }
            const holdMs = Math.max(0, Number(options.holdMs) || 0);
            const pulseIntervalMs = Math.max(50, Number(options.pulseIntervalMs) || 250);
            const maxPulses = Math.max(1, Number(options.maxPulses) || Math.ceil(holdMs / pulseIntervalMs) || 1);
            const pulseSnapshots = [];

            for (let pulseIndex = 0; pulseIndex < maxPulses; pulseIndex += 1) {
                const link = resolveDebugLink(linkIdOrIndex);
                if (!link) {
                    return {
                        ok: false,
                        reason: 'link-not-found',
                        pulseIndex,
                        pulseSnapshots,
                        collapseStats: collapseSystem?.getCollapseStatistics?.() ?? null,
                    };
                }
                const result = applyDebugLinkMetrics(linkingSystem, collapseSystem, link, metrics, options);
                pulseSnapshots.push({
                    pulseIndex,
                    timestamp: Date.now(),
                    collapseState: result.collapseState,
                    collapseStats: result.collapseStats,
                });
                if (holdMs <= 0 || pulseIndex >= maxPulses - 1) {
                    return {
                        ...result,
                        pulseCount: pulseIndex + 1,
                        pulseSnapshots,
                    };
                }
                await new Promise((resolve) => setTimeout(resolve, pulseIntervalMs));
            }

            return {
                ok: true,
                pulseCount: pulseSnapshots.length,
                pulseSnapshots,
                collapseStats: collapseSystem?.getCollapseStatistics?.() ?? null,
                snapshot: buildActiveLinkSnapshot(20),
            };
        };
        window.__DEBUG.listNodeIds = (limit = 20) => {
            const nodes = Array.isArray(this.aiNodes?.nodes) ? this.aiNodes.nodes : [];
            return nodes
                .map((node) => node?.userData?.nodeId ?? node?.id ?? null)
                .filter((id) => id !== null && id !== undefined)
                .slice(0, Math.max(1, Number(limit) || 20));
        };
        window.__DEBUG.startFxAuditWindow = (durationMs = 5000, label = 'fx-smoke') => {
            if (typeof window !== 'undefined') {
                window.ATOMA_FX_AUDIT = true;
            }
            return this.frameScheduler?.startFxAuditWindow?.(durationMs, label) ?? null;
        };
        window.__DEBUG.dumpFxAudit = (label = 'manual-dump') => this.frameScheduler?.dumpFxAuditToConsole?.(label) ?? null;
        window.__DEBUG.clearFxAuditSession = () => this.frameScheduler?.clearFxAuditSession?.() ?? null;
        window.__DEBUG.getFxAuditSnapshot = () => this.frameScheduler?.getFxAuditSnapshot?.() ?? null;
        window.__DEBUG.createSmokeLinks = (linkCount = 3) => {
            const linkingSystem = window.__DEBUG.getLinkingSystem();
            if (!linkingSystem?.createLinkById) return { created: [], attempted: 0 };

            const nodes = Array.isArray(this.aiNodes?.nodes) ? this.aiNodes.nodes : [];
            const ids = nodes
                .map((node) => node?.userData?.nodeId ?? node?.id ?? null)
                .filter((id) => id !== null && id !== undefined);

            const maxLinks = Math.max(0, Math.min(Number(linkCount) || 0, Math.max(0, ids.length - 1)));
            const created = [];
            for (let i = 0; i < maxLinks; i++) {
                const idA = ids[i];
                const idB = ids[i + 1];
                if (idA === undefined || idB === undefined || idA === idB) continue;
                const result = linkingSystem.createLinkById(idA, idB);
                if (result) {
                    created.push({ idA, idB });
                }
            }

            return {
                attempted: maxLinks,
                created
            };
        };
        window.__DEBUG.createReachabilitySmokeLinks = (linkCount = 6) => {
            const linkingSystem = window.__DEBUG.getLinkingSystem();
            if (!linkingSystem?.createLinkById) return { created: [], attempted: 0, candidates: [] };

            const preferredCategories = new Set(['input', 'storage', 'control', 'sigma', 'prime']);
            const deriveReachabilityTarget = (metrics = {}) => {
                const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
                const harmony = clamp01(metrics.harmony);
                const stability = clamp01(metrics.stability);
                const corruption = clamp01(metrics.corruption);
                const loadPressure = clamp01(metrics.loadPressure ?? metrics.load ?? metrics.pressure);
                const derived = harmony * stability * (1 - corruption * 0.70) * (1 - loadPressure * 0.50);
                const archetypeBase = clamp01(metrics.synergy ?? derived);
                return clamp01((archetypeBase * 0.72) + (derived * 0.28));
            };
            const nodes = Array.isArray(this.aiNodes?.nodes) ? this.aiNodes.nodes : [];
            const candidates = nodes
                .map((node) => {
                    const nodeId = node?.userData?.nodeId ?? node?.id ?? null;
                    const registryCode = Number(nodeId);
                    const registryDef = Number.isFinite(registryCode) ? NODE_VISUAL_REGISTRY[registryCode] : null;
                    const category = node?.userData?.category ?? registryDef?.category ?? null;
                    if (!nodeId || !category || category === 'error') return null;

                    const metrics = registryDef?.metrics ?? node?.userData?.archetypeMetrics ?? node?.userData?.metrics ?? {};
                    const synergy = Number(metrics.synergy ?? 0);
                    const corruption = Number(metrics.corruption ?? 1);
                    const loadPressure = Number(metrics.loadPressure ?? metrics.load ?? metrics.pressure ?? 1);
                    const reachabilityTarget = deriveReachabilityTarget(metrics);
                    return {
                        node,
                        nodeId,
                        category,
                        reachabilityTarget,
                        synergy: Number.isFinite(synergy) ? synergy : 0,
                        corruption: Number.isFinite(corruption) ? corruption : 1,
                        loadPressure: Number.isFinite(loadPressure) ? loadPressure : 1
                    };
                })
                .filter(Boolean)
                .sort((a, b) => {
                    const preferredBonusA = preferredCategories.has(a.category) ? 0.01 : 0;
                    const preferredBonusB = preferredCategories.has(b.category) ? 0.01 : 0;
                    const scoreA = preferredBonusA + (a.reachabilityTarget * 1.8) + (a.synergy * 0.4) - (a.corruption * 1.0) - (a.loadPressure * 0.6);
                    const scoreB = preferredBonusB + (b.reachabilityTarget * 1.8) + (b.synergy * 0.4) - (b.corruption * 1.0) - (b.loadPressure * 0.6);
                    return scoreB - scoreA;
                });

            const maxLinks = Math.max(0, Number(linkCount) || 0);
            const targetNodeCount = Math.max(4, Math.min(candidates.length, Math.min(Math.max(5, maxLinks - 1), maxLinks + 1)));
            const selected = candidates.slice(0, targetNodeCount);
            if (selected.length < 2) {
                return { attempted: maxLinks, created: [], candidates: selected.map((entry) => entry.nodeId) };
            }

            const pairs = [];
            for (let i = 0; i < selected.length - 1; i++) {
                pairs.push([selected[i].nodeId, selected[i + 1].nodeId]);
            }
            for (let i = 0; i < selected.length - 2; i++) {
                pairs.push([selected[i].nodeId, selected[i + 2].nodeId]);
            }
            if (selected.length >= 4) {
                pairs.push([selected[0].nodeId, selected[selected.length - 1].nodeId]);
            }
            if (selected.length >= 5) {
                pairs.push([selected[1].nodeId, selected[3].nodeId]);
            }

            const created = [];
            const seenPairs = new Set();
            for (const [idA, idB] of pairs) {
                if (created.length >= maxLinks) break;
                if (idA === undefined || idB === undefined || idA === idB) continue;
                const pairKey = [idA, idB].sort().join('::');
                if (seenPairs.has(pairKey)) continue;
                seenPairs.add(pairKey);
                const result = linkingSystem.createLinkById(idA, idB);
                if (result) {
                    created.push({ idA, idB });
                }
            }

            return {
                attempted: maxLinks,
                created,
                candidates: selected.map((entry) => ({
                    id: entry.nodeId,
                    category: entry.category,
                    reachabilityTarget: Number(entry.reachabilityTarget.toFixed(3)),
                    synergy: Number(entry.synergy.toFixed(3)),
                    corruption: Number(entry.corruption.toFixed(3)),
                    loadPressure: Number(entry.loadPressure.toFixed(3))
                }))
            };
        };
        window.__DEBUG.spawnLinkResonancePulseOnce = (linkIdOrLink, options = {}) => {
            const system = window.__DEBUG.getLinkResonanceFlowSystem();
            if (!system?.spawnSinglePulse) return null;
            const link = typeof linkIdOrLink === 'object'
                ? linkIdOrLink
                : window.__DEBUG.getLinkingSystem()?._resolveLinkById?.(linkIdOrLink)
                    || window.__DEBUG.getLinkingSystem()?.links?.find?.((entry) => entry?.id === linkIdOrLink || entry?.linkId === linkIdOrLink)
                    || null;
            if (!link) return null;
            return system.spawnSinglePulse(link, options);
        };
        window.__DEBUG.setLinkResonanceOnly = (enabled = true) => {
            const scene = window.atoma?.scene ?? null;
            const resonanceSystem = window.__DEBUG.getLinkResonanceFlowSystem();
            if (!scene || !resonanceSystem) return null;

            const state = window.__DEBUG._linkResonanceOnlyState ||= {
                active: false,
                snapshots: new Map(),
                hideTargets: null,
            };

            const isResonanceFlowObject = (obj) => {
                if (!obj) return false;
                const name = String(obj.name || '');
                const ud = obj.userData || {};
                return ud.isLinkResonanceFlow === true ||
                    ud.linkVisualFamily === 'resonanceFlow' ||
                    ud.isLinkResonanceFlowPulse === true ||
                    name === 'LinkResonancePulses_Session124' ||
                    name.startsWith('LinkResonancePulse');
            };

            const shouldHide = (obj) => {
                if (!obj || obj === scene) return false;
                if (isResonanceFlowObject(obj)) return false;
                const name = String(obj.name || '');
                const ud = obj.userData || {};
                return ud.isLinkVisual === true ||
                    ud.isLinkGlow === true ||
                    ud.isLinkCore === true ||
                    ud.isLinkTrail === true ||
                    ud.isNeuralCurve === true ||
                    ud.isLinkGlyphFlow === true ||
                    ud.isLinkAura === true ||
                    ud.isFX === true ||
                    ud.isParticle === true ||
                    ud.isEffect === true ||
                    name.startsWith('LinkVisuals_') ||
                    name.startsWith('NeonLinkVisuals') ||
                    name.startsWith('ExtremeLinkVisuals') ||
                    name.startsWith('NeuralCurveLinkVisuals') ||
                    name.startsWith('LinkTrail') ||
                    name.startsWith('LinkPulse') ||
                    name.startsWith('LinkSpark') ||
                    name.startsWith('LinkHealing') ||
                    name.startsWith('LinkCorruption') ||
                    name.startsWith('LinkRingArc') ||
                    name.startsWith('LinkFlow') ||
                    name.includes('HarmonicResonanceCoupling') ||
                    name.includes('MemoryTrail') ||
                    name.includes('Cascade');
            };

            if (enabled) {
                if (state.active) return true;
                state.snapshots.clear();
                if (!Array.isArray(state.hideTargets) || state.hideTargets.length === 0) {
                    state.hideTargets = [];
                    scene.traverse((obj) => {
                        if (!shouldHide(obj)) return;
                        state.hideTargets.push(obj);
                    });
                }
                for (const obj of state.hideTargets) {
                    if (!obj) continue;
                    state.snapshots.set(obj, obj.visible);
                    obj.visible = false;
                }
                state.active = true;
                return true;
            }

            if (!state.active) return false;
            for (const [obj, visible] of state.snapshots.entries()) {
                if (obj) obj.visible = visible;
            }
            state.snapshots.clear();
            state.active = false;
            return false;
        };
        window.__DEBUG.clearLinkResonanceOnly = () => window.__DEBUG.setLinkResonanceOnly(false);
        window.__DEBUG.setLinkResonancePulseDebug = (enabled, options = {}) => {
            const system = window.__DEBUG.getLinkResonanceFlowSystem();
            if (!system?.setDebugPulseVisuals) return null;
            return system.setDebugPulseVisuals(enabled, options);
        };
        window.__DEBUG.toggleLinkResonancePulseDebug = (options = {}) => {
            const system = window.__DEBUG.getLinkResonanceFlowSystem();
            if (!system?.setDebugPulseVisuals) return null;
            const enabled = !(system.config?.debugPulseVisuals === true);
            return system.setDebugPulseVisuals(enabled, options);
        };
        window.__DEBUG.triggerCascadeAtNodeId = (nodeId, intensity = 1.0) => {
            const node = window.__DEBUG.getNodeById(nodeId);
            if (!node) return null;
            window.atoma?.cascadeVisualizer?.triggerCascadeAtNode?.(node, intensity);
            return node;
        };
        window.__DEBUG.spawnSynergyCascadeAtNodeId = window.__DEBUG.triggerCascadeAtNodeId;

        // Recursive Glyph Messaging 4.0 commands
        window.toggleRecursiveChains = () => {
            if (!window.atoma.recursiveGlyphMessaging) {
                console.warn('Recursive Glyph Messaging not initialized');
                return;
            }
            const enabled = window.atoma.recursiveGlyphMessaging.isEnabled();
            window.atoma.recursiveGlyphMessaging.setEnabled(!enabled);
            console.log(`✓ Recursive chains ${!enabled ? 'ENABLED' : 'DISABLED'}`);
        };

        window.debugRecursiveMessages = () => {
            if (!window.atoma.recursiveGlyphMessaging) {
                console.warn('Recursive Glyph Messaging not initialized');
                return;
            }
            window.atoma.recursiveGlyphMessaging.printStatusReport();
            const stats = window.atoma.recursiveGlyphMessaging.getStats();
            console.group('📊 Recursive Messaging Stats');
            console.table(stats);
            console.groupEnd();
        };

        window.clearRecursiveGlyphs = () => {
            if (!window.atoma.recursiveGlyphMessaging) {
                console.warn('Recursive Glyph Messaging not initialized');
                return;
            }
            window.atoma.recursiveGlyphMessaging.clearAllChains();
            console.log('✓ All recursive chains cleared');
        };

        // Recursive Glyph Signal System commands
        window.toggleRecursiveGlyphSignals = () => {
            if (!window.atoma.recursiveGlyphSignalSystem) {
                console.warn('Recursive Glyph Signal System not initialized');
                return;
            }
            const status = window.atoma.recursiveGlyphSignalSystem.getStatus();
            window.atoma.recursiveGlyphSignalSystem.setEnabled(!status.enabled);
            console.log(`Recursive glyph signals ${status.enabled ? 'DISABLED' : 'ENABLED'}`);
        };

        window.debugRecursiveGlyphSignals = () => {
            if (!window.atoma.recursiveGlyphSignalSystem) {
                console.warn('Recursive Glyph Signal System not initialized');
                return;
            }
            const stats = window.atoma.recursiveGlyphSignalSystem.getStatus();
            console.group('Recursive Glyph Signal Stats');
            console.table(stats);
            console.groupEnd();
        };

        window.clearRecursiveGlyphSignals = () => {
            if (!window.atoma.recursiveGlyphSignalSystem) {
                console.warn('Recursive Glyph Signal System not initialized');
                return;
            }
            window.atoma.recursiveGlyphSignalSystem.clearAllSignals();
            console.log('All recursive glyph signals cleared');
        };

        // Emergent Thought Storms 5.0 commands hard-disabled for release stabilization.

        // AI Narrative Patterns 6.0 commands
        window.toggleNarrativePatterns = () => {
            if (!window.atoma.narrativePatterns) {
                console.warn('AI Narrative Patterns not initialized');
                return;
            }
            window.atoma.narrativePatterns.enabled = !window.atoma.narrativePatterns.enabled;
            console.log(`✓ Narrative patterns ${window.atoma.narrativePatterns.enabled ? 'ENABLED' : 'DISABLED'}`);
        };

        window.debugNarrativePatterns = () => {
            if (!window.atoma.narrativePatterns) {
                console.warn('AI Narrative Patterns not initialized');
                return;
            }
            window.atoma.narrativePatterns.debugNarratives();
        };

        window.resetNarrativePatterns = () => {
            if (!window.atoma.narrativePatterns) {
                console.warn('AI Narrative Patterns not initialized');
                return;
            }
            window.atoma.narrativePatterns.resetNarratives();
        };

        console.log('✓ Debug commands available:');
        console.log('  - __DEBUG.createLinkById(idA, idB) — canonical thin wrapper over NodeLinkingSystem.createLink()');
        console.log('  - __DEBUG.createLink(nodeA, nodeB) — direct runtime passthrough');
        console.log('  - __DEBUG.getNodeById(id) — resolve a node from the runtime lookup');
        console.log('  - __DEBUG.getLinkingSystem() — current link authority instance');
        console.log('  - __DEBUG.getActiveLinkSnapshot(limit?) — inspect live active links and collapse queue');
        console.log('  - __DEBUG.removeLink(linkIdOrIndex?) — remove one live link through linking authority');
        console.log('  - __DEBUG.pushLinkMetrics(linkIdOrIndex, metrics, options?) — canonical metric push + collapse arbiter pass');
        console.log('  - __DEBUG.sustainLinkMetrics(linkIdOrIndex, metrics, { holdMs, pulseIntervalMs }) — sustain collapse-driving metrics through the real link update path');
        console.log('  - toggleRecursiveChains()');
        console.log('  - debugRecursiveMessages()');
        console.log('  - clearRecursiveGlyphs()');
        console.log('  - toggleRecursiveGlyphSignals()');
        console.log('  - debugRecursiveGlyphSignals()');
        console.log('  - clearRecursiveGlyphSignals()');
        console.log('  - toggleNarrativePatterns()');
        console.log('  - debugNarrativePatterns()');
        console.log('  - resetNarrativePatterns()');
        console.log('✓ Extreme Shader Test Suite commands available:');
        console.log('  - debugExtremeShaders() — Run full consistency check');
        console.log('  - enableExtremeShaderDiagnostics() — Enable per-frame validation');
        console.log('  - disableExtremeShaderDiagnostics() — Disable per-frame validation');
        console.log('  - enableExtremeShaderDebugVisuals() — Show debug overlays on nodes');
        console.log('  - disableExtremeShaderDebugVisuals() — Hide debug overlays');
        console.log('  - printExtremeShaderSummary() — Print TL;DR status');
        console.log('✓ New Node Categories commands available:');
        console.log('  - printNewNodeCategoriesStatus() — Print category statistics');
        console.log('  - applyMythicNodeVisuals(node) — Apply Mythic visuals to node');
        console.log('  - applyPrimeNodeVisuals(node) — Apply Prime visuals to node');
        console.log('  - applyErrorNodeVisuals(node) — Apply Error visuals to node');
        console.log('✓ New Node Category Visuals commands available:');
        console.log('  - window.visuals — Access module directly');
        console.log('  - window.visuals.listNewNodeTypes() — List all categories');
        console.log('  - window.visuals.preview("mythic") — Preview category visuals');
        console.log('  - window.visuals.preview("prime")');
        console.log('  - window.visuals.preview("error")');
        console.log('  - window.visuals.status() — Print visual system status');
        console.log('✓ Extreme Link Visual Pack 3.0 commands available:');
        console.log('  - window.extremeLinks — Access module directly');
        console.log('  - window.extremeLinks.enable() / disable()');
        console.log('  - window.extremeLinks.setGlyphDensity(multiplier)');
        console.log('  - window.extremeLinks.setGlobalBrightness(value)');
        console.log('  - window.extremeLinks.printStats()');
        console.log('  - window.extremeLinks.printConfig()');

        // Setup ATOMA Naming Engine console API
        console.log('✓ ATOMA Naming Engine 1.0 commands available:');
        console.log('  - name.show(nodeId) — Show naming code & meaning for node');
        console.log('  - name.random() — Generate random naming code');
        console.log('  - name.archetypes() — List all archetype → code mappings');
        console.log('  - name.reference() — Print full morpheme reference table');
        console.log('  - name.stats() — Print naming engine statistics');
        console.log('  - name.enable() / name.disable() — Toggle naming layer');



        // ============================================================================
        // PHASE 1 LINK SYSTEMS REACTIVATION (Session 107+)
        // Console API setup for LinkCorrelationEngine + History + Hardening
        // ============================================================================
        console.log('✓ Phase 1 Link Systems console API available:');
        
        window.correlationStatus = function() {
            if (!window.game?.linkCorrelationEngine) {
                console.warn('⚠ LinkCorrelationEngine not available');
                return;
            }
            const status = window.game.linkCorrelationEngine.status();
            console.log('🔄 Correlation Engine Status:', status);
            return status;
        };
        console.log('  - correlationStatus() — Get correlation engine status');
        
        window.getClusters = function() {
            if (!window.game?.linkCorrelationEngine) {
                console.warn('⚠ LinkCorrelationEngine not available');
                return;
            }
            const clusters = window.game.linkCorrelationEngine.getClusters();
            console.log('📊 Synergy Clusters:', clusters);
            return clusters;
        };
        console.log('  - getClusters() — Get all synergy clusters');
        
        window.getCorrelationFor = function(linkId) {
            if (!window.game?.linkCorrelationEngine) {
                console.warn('⚠ LinkCorrelationEngine not available');
                return;
            }
            const meta = window.game.linkCorrelationEngine.getCorrelationMeta(linkId);
            console.log(`📈 Correlation for ${linkId}:`, meta);
            return meta;
        };
        console.log('  - getCorrelationFor(linkId) — Get correlation data for link');
        
        window.checkLinkIntegrity = function() {
            if (!window.game?.linkingSystem) {
                console.warn('⚠ LinkingSystem not available');
                return;
            }
            const links = window.game.linkingSystem.getLinkList?.() || [];
            let issues = 0;
            
            links.forEach(link => {
                if (!link.source || !link.target) {
                    console.warn(`⚠ Link ${link.id} has missing source/target`);
                    issues++;
                }
            });
            
            console.log(`✓ Checked ${links.length} links, found ${issues} issues`);
            return { total: links.length, issues };
        };
        console.log('  - checkLinkIntegrity() — Verify link integrity (hardening)');

        // Expose modules for console access
        window.visuals = this.newNodeVisuals;
        window.extremeLinks = this.extremeLinkVisuals;
    }

    // REMOVED: setupExtremeShaderTestSuite - moved to LEGACY (2026-04-03)
    /*
    setupExtremeShaderTestSuite() {
        this.extremeShaderTestSuite = new ExtremeAIShaderTestSuite({
            scene: this.scene,
            nodeManager: this.aiNodes,
            shaderPack: null // Will be set if shader pack is created
        });

        // Build static registries
        this.extremeShaderTestSuite.setup();

        console.log('✓ Extreme AI Shader Test Suite initialized (SAFE diagnostics mode)');
    }
    */

    /**
     * Setup Safe New Node Categories 1.0
     * SAFE: Non-destructive addition of 3 new node categories
     * Mythic (MYT-), Prime (PRM-), Error (ERR-) with spawn rules and visuals
     */
    // REMOVED: setupNewNodeCategories - moved to LEGACY (2026-04-03)
    setupNewNodeCategories() {
        // this.newNodeCategories = new SafeNewNodeCategories1_0(this.scene, this.aiNodes);
        // console.log('✓ Safe New Node Categories 1.0 initialized');
        // console.log('  - MYTHIC NODES (MYT-): Rare ritual stabilizers');
        // console.log('  - PRIME NODES (PRM-): Perfect topology anchors');
        // console.log('  - ERROR NODES (ERR-): Unstable glitch entities');
    }

    // REMOVED: setupNewNodeCategoryVisuals - moved to LEGACY (2026-04-03)
    /*
    setupNewNodeCategoryVisuals() {
        try {
            this.newNodeVisuals = new NewNodeCategoryVisuals(this.scene);
            if (this.newNodeVisuals && this.newNodeVisuals.animate) {
                console.log('✓ New Node Category Visuals 1.0 initialized');
                console.log('  - MYTHIC: Sacred auras + fractal triangle + orbiting rings');
                console.log('  - PRIME: White icosahedron + holographic grid + space-warp');
                console.log('  - ERROR: Broken cube + glitch effects + burst sparks');
            }
        } catch (err) {
            console.warn('NewNodeCategoryVisuals initialization failed:', err);
        }
    }
    */

    /**
     * Setup Extreme Link Visual Pack 3.0
     * SAFE: AAA-quality link visualization with multi-layer neon beams + glyph language
     */
    setupExtremeLinkVisuals() {
        try {
            this.extremeLinkVisuals = new ExtremeLinkVisualPack3({
                coreThickness: 3.0,
                glowThickness: 6.0,
                bloomThickness: 10.0,
                glyphDensity: 1.0,
                glyphSpeed: 1.0
            });

            // Register existing links
            if (this.linkingSystem && this.linkingSystem.links) {
                this.linkingSystem.links.forEach(link => {
                    try {
                        this.extremeLinkVisuals.registerLink(link);
                    } catch (err) {
                        console.warn('Failed to register link:', err);
                    }
                });
            }

            console.log('✓ Extreme Link Visual Pack 3.0 initialized');
            console.log('  - Multi-layer neon beam structure');
            console.log('  - Animated glyph language stream');
            console.log('  - Synergy-reactive intensity & speed');
            console.log('  - Category-aware color blending');
        } catch (err) {
            console.warn('ExtremeLinkVisualPack3 initialization failed:', err);
        }
    }

    /**
     * Setup Neural Curve Link Visuals 1.0
     * SAFE: Dynamic Bézier curved links with AI neural pathways
     */
    setupNeuralCurveLinkVisuals() {
        try {
            this.neuralCurveLinkVisuals = new NeuralCurveLinkVisuals({
                strength: 0.6,
                oscillationAmount: 0.005,
                categoryBias: true
            });

            // Register existing links
            if (this.linkingSystem && this.linkingSystem.links) {
                this.linkingSystem.links.forEach(link => {
                    try {
                        this.neuralCurveLinkVisuals.registerLink(link);
                    } catch (err) {
                        console.warn('Failed to register neural curve for link:', err);
                    }
                });
            }

            // Setup console API
            setupNeuralCurveConsoleAPI(this.neuralCurveLinkVisuals);

            console.log('✓ Neural Curve Link Visuals 1.0 initialized');
            console.log('  - Dynamic Bézier curved links');
            console.log('  - Category-influenced curves');
            console.log('  - Neural micro-oscillations');
            console.log('  - Smooth curvature transitions');
        } catch (err) {
            console.warn('NeuralCurveLinkVisuals initialization failed:', err);
        }
    }

    /**
     * Setup Extreme Link Visuals 4.0
     * SAFE: Neural curvature, depth, and category-aware link visualization
     */
    setupExtremeLinkVisuals4() {
        if (!this.linkingSystem || !this.scene) {
            console.warn('Linking system or scene not initialized, deferring Extreme Link Visuals 4.0 setup');
            return;
        }

        try {
            this.extremeLinkVisuals4 = new ExtremeLinkVisuals4_0(
                this.scene,
                this.linkingSystem,
                null, // metrics system (optional)
                this.aiNodes
            );

            // Set camera for depth calculations
            this.extremeLinkVisuals4.setCamera(this.camera);

            // Attach visuals to existing links
            if (this.linkingSystem.links) {
                for (const link of this.linkingSystem.links) {
                    this.extremeLinkVisuals4.attachToLink(link);
                }
            }

            // Setup console API
            setupExtremeLinkVisualsV4ConsoleAPI(this.extremeLinkVisuals4);

            console.log('✓ Extreme Link Visuals 4.0 initialized');
            console.log('  - 3-layer neural geometry per link');
            console.log('  - Depth-reactive brightness & width');
            console.log('  - Category-aware unified colors');
            console.log('  - Metric-reactive visual accents');
            console.log('  - Animated flow packets');
            console.log('  - Subtle glyph integration');
            console.log('  - Use extremeLinksV4.debugStats() for status');
        } catch (err) {
            console.warn('ExtremeLinkVisuals4_0 initialization failed:', err);
        }
    }

    // REMOVED: setupLinkVisualMoodSystem - moved to LEGACY (2026-04-03)
    /*
    setupLinkVisualMoodSystem() {
        if (!this.linkingSystem || !this.scene || !this.camera || !this.renderer) {
            console.warn('Required systems not initialized, deferring Link Visual Mood System setup');
            return;
        }

        try {
            this.linkVisualMoodSystem = new LinkVisualMoodSystem(
                this.scene,
                this.camera,
                this.renderer
            );
            this.linkVisualMoodSystem.frameScheduler = this.frameScheduler;

            // Wire up to visual systems
            if (this.neonLinkVisuals) {
                this.linkVisualMoodSystem.setNeonLinkVisuals(this.neonLinkVisuals);
            }
            // LEGACY/april — dynamicLinkColorSystem disconnected 2026-04-22
            // if (this.dynamicLinkColorSystem) {
            //     this.linkVisualMoodSystem.setDynamicLinkColorSystem(this.dynamicLinkColorSystem);
            // }
            if (this.linkingSystem) {
                this.linkVisualMoodSystem.setLinkingSystem(this.linkingSystem);
            }
            if (this.postProcessing) {
                this.linkVisualMoodSystem.setPostProcessing(this.postProcessing);
            }

            // Setup console API
            setupLinkMoodSystemConsoleAPI(this.linkVisualMoodSystem);

            // Set default mood
            this.linkVisualMoodSystem.activateMood('premium', 0.5);

            console.log('✓ Link Visual Mood System v1.0 initialized');
            console.log('  - 🧘 Calm: Minimal, zen-like, subtle');
            console.log('  - ✨ Premium: Elegant, refined, professional');
            console.log('  - ⚡ Intense: Aggressive, high-contrast, dramatic');
            console.log('  - 🌙 Meditative: Slow, deep, contemplative');
            console.log('  - Use debugLinkMood.* commands to switch moods');
        } catch (err) {
            console.warn('LinkVisualMoodSystem initialization failed:', err);
        }
    }
    */

    /**
     * Setup AI Consciousness Layer 2.0
     * SAFE: Neural thought visualization + Emergent Thought Storms
     */
    setupAIConsciousnessLayer() {
        if (!this.linkingSystem || !this.scene) {
            console.warn('Linking system or scene not initialized, deferring AI Consciousness Layer setup');
            return;
        }

        try {
            this.consciousnessLayer = new AIConsciousnessLayer(
                this.scene,
                this.linkingSystem,
                this.aiNodes,
                this.glyphLayer4
            );
            this.aiConsciousnessLayer = this.consciousnessLayer;

            // DEPRECATED (2026-04-23): _AIThoughtStorms2_0 removed.
            // Emergent thought storms now provided exclusively by _EmergentThoughtStorms5_0
            // via EnvironmentDomainController.
            //
            // try {
            //     this.consciousnessLayer.initializeStorms(AIThoughtStorms2_0);
            //     if (this.consciousnessLayer.storms) {
            //         setupAIThoughtStormsConsoleAPI(this.consciousnessLayer.storms);
            //     }
            // } catch (err) {
            //     console.warn('Thought Storms sub-system failed to initialize:', err);
            // }

            // Setup consciousness layer console API (which now includes storms toggle)
            setupAIConsciousnessConsoleAPI(this.consciousnessLayer);

            console.log('✓ AI Consciousness Layer 2.0 initialized');
            console.log('  - Neural thought threads on links');
            console.log('  - Cognitive pulse packets flowing');
            console.log('  - Semantic thought patterns');
            console.log('  - Global consciousness field');
            console.log('  - Use conscious.debug() for detailed status');
            console.log('  - Use conscious.enableStorms() / disableStorms()');
        } catch (err) {
            console.warn('AIConsciousnessLayer initialization failed:', err);
        }
    }

    /**
     * Setup Signature Moment Director
     * Cinematic orchestration over existing metric, ritual, audio, and world state.
     */
    setupSignatureMomentDirector() {
        if (!this.semanticBus) {
            console.warn('Semantic bus not initialized, skipping Signature Moment Director setup');
            return;
        }

        try {
            if (this.signatureMomentDirector?.dispose) {
                this.signatureMomentDirector.dispose();
            }

            const getContext = (meta = {}) => {
                const consciousnessState = this.consciousnessLayer?.getConsciousnessState?.()
                    || this.consciousnessLayer?.consciousnessState
                    || null;
                const canonicalWorldContext = this._getCanonicalWorldContext();

                return {
                    timestamp: performance.now(),
                    sourceEvent: meta.sourceEvent || null,
                    sourcePayload: meta.sourcePayload || null,
                    stage: meta.stage || null,
                    force: meta.force === true,
                    preview: meta.preview === true,
                    worldId: this.currentWorldId || this.currentWorldName || this.currentMode || this.world?.name || 'unknown',
                    currentMode: this.currentMode || null,
                    camera: this.camera || null,
                    scene: this.scene || null,
                    metrics: canonicalWorldContext.metrics || this.coreMetricsOverlay?.currentMetrics || this.worldMetrics || this.nodeDynamicMetrics || null,
                    consciousness: canonicalWorldContext.consciousnessState || consciousnessState,
                    worldMacroState: canonicalWorldContext.worldMacroState,
                    macroProfile: canonicalWorldContext.macroProfile || null,
                    worldContext: canonicalWorldContext,
                    consciousnessLayer: this.consciousnessLayer || null,
                    thoughtStorms: this.consciousnessLayer?.storms || null,
                    linkCollapseSystem: this.linkCollapseSystem || null,
                    harmonyStabilizationSystem: this.harmonyStabilizationSystem || null,
                    dramaturgy: this.environmentDomain?.instances?.eventDramaturgy?.getState?.() || null,
                    eventDramaturgy: this.environmentDomain?.instances?.eventDramaturgy || null,
                    ritual: this.mythicRitualController?.getState?.() || null,
                    phase8: this.phase8RitualOrchestration?.getStats?.() || null,
                    audioSystem: this.audioSystem || null,
                    metricReactiveEvents: this.metricReactiveEvents || this.environmentDomain?.instances?.metricReactiveEvents || null,
                    linkCorruptionTransmission: this.linkCorruptionTransmission || this.corruptionTransmission || this.aiNodes?.linkCorruption || null,
                    worldPersonalityController: this.worldPersonalityController || null,
                    worldFXPack: this.environmentDomain?.instances?.worldFXPack || this.worldFXPack || null,
                    worldMoodState: canonicalWorldContext.worldMoodState || this.worldPersonalityController?.getMoodState?.() || null,
                    worldEvents: this.worldEvents || null,
                    networkChronicle: this.networkChronicle || null,
                    chronicleStats: this.networkChronicle?.getStats?.() || null,
                    memoryLane: this.memoryLane || null,
                    memoryWorldActive: this.currentMode === 'memory'
                        || this.currentWorldId === 'memory'
                        || this.activeWorld === this.memoryLane
                        || String(this.currentWorldName || '').toLowerCase() === 'memory lane',
                    memoryPressure: this.coreMetricsOverlay?.currentMetrics?.memoryPressure
                        ?? this.worldMetrics?.memoryPressure
                        ?? this.nodeDynamicMetrics?.memoryPressure
                        ?? null,
                    selectedNode: this.selectedNode || this.linkingSystem?.selectedNode || this.aiNodes?.selectedNode || null,
                    primaryNode: this.linkingSystem?.primaryNode || this.primaryNode || null,
                    selectedLink: this.linkingSystem?.selectedLink || this.selectedLink || null,
                    primaryLink: this.linkingSystem?.primaryLink || this.primaryLink || null,
                    focusNode: this.linkingSystem?.primaryNode || this.selectedNode || this.primaryNode || this.aiNodes?.selectedNode || null,
                    focusLink: this.linkingSystem?.primaryLink || this.linkingSystem?.selectedLink || this.selectedLink || null,
                    linkingSystem: this.linkingSystem || null,
                    nodes: this.aiNodes?.nodes || [],
                    links: this.linkingSystem?.links || [],
                    linkCount: this.linkingSystem?.links?.length || 0,
                    activeLinkCount: consciousnessState?.activeLinkCount
                        ?? this.coreMetricsOverlay?.currentMetrics?.activeLinkCount
                        ?? 0,
                    cameraAuthorityMode: typeof window !== 'undefined' ? (window.CAMERA_AUTHORITY_MODE || 'fp_only') : 'fp_only'
                };
            };

            this.signatureMomentDirector = new SignatureMomentDirector({
                semanticBus: this.semanticBus,
                getContext
            });
            this.signatureMomentDirector.initialize();

            if (this.frameScheduler?.isRegistered?.('background.signatureMomentDirector') === true) {
                this.frameScheduler.unregister('background.signatureMomentDirector');
            }
            this.frameScheduler?.register('background', (dt) => {
                this.signatureMomentDirector?.update?.(dt);
            }, 'background.signatureMomentDirector');

            installSignatureMomentDirectorDebugAPI(this.signatureMomentDirector);

            console.log('✓ Signature Moment Director initialized');
            console.log('  - Blueprints: Synergy Apex / Network Resonance Surge, Cascade Reconstruction Beacon, Memory Recovery Event, Legendary Bond Manifestation, Consciousness Bloom, Harmony Convergence / Ascension Platform, Mythic Signal / Dimensional Gateway, Grand Corruption Breach, Heroic Stabilization Before Collapse, World Personality Shift');
            console.log('  - Use window.signatureMoments.status() for diagnostics');
        } catch (err) {
            console.warn('SignatureMomentDirector initialization failed:', err);
        }
    }

    // ---------------------------------------------------------
    // LEGACY SYSTEMS DISABLED — SAFE VERSION
    // NOTE: setupCategoryLegend() and setupEmotionalFeed() are NOW ACTIVE
    // See main constructor for active initialization
    // ---------------------------------------------------------

    // AUTO-DETECT 3.1 (legacy, disabled)
    setupNodeAutoDetect() {
        console.log('✗ UI Node Auto-Detect 3.1 DISABLED');
        // nothing executed
    }

    // NODE LINKING 2.0 (DO NOT ENABLE – conflicts with 2.3)
    setupNodeLinkingLegacy() {
        console.log('✗ Node Linking 2.0 DISABLED (using NodeLinking2_3)');
        // nothing executed
    }

    // HOVER TOOLTIP 3.1 (blocks clicks, disabled)
    setupHoverTooltipLegacy() {
        console.log('✗ Hover Tooltip 3.1 DISABLED');
        // nothing executed



        // [Sphere Creator Trace] Console API
        window.sphereTrace = {
            enabled: true,
            captureStacks: true,
            maxEntries: 100,
            
            // Get trace statistics
            getStats: () => {
                if (typeof window !== 'undefined' && window.__sphereCreatorTrace) {
                    return window.__sphereCreatorTrace.getStats();
                }
                return null;
            },
            
            // Get all traces
            getTraces: () => {
                if (typeof window !== 'undefined' && window.__sphereCreatorTrace) {
                    return window.__sphereCreatorTrace.getTraces();
                }
                return null;
            },
            
            // Clear traces
            clear: () => {
                if (typeof window !== 'undefined' && window.__sphereCreatorTrace) {
                    window.__sphereCreatorTrace.clear();
                    console.log('✓ Sphere creator trace cleared');
                }
            },
            
            // Print traces as table
            print: () => {
                const traces = window.sphereTrace.getTraces();
                if (traces && traces.length > 0) {
                    console.group('🔍 Sphere Creator Trace');
                    console.table(traces);
                    console.groupEnd();
                } else {
                    console.log('No sphere creator traces recorded');
                }
            },
            
            // Export traces as JSON
            export: () => {
                const traces = window.sphereTrace.getTraces();
                if (traces && traces.length > 0) {
                    const json = JSON.stringify(traces, null, 2);
                    console.log('Sphere Creator Trace JSON:');
                    console.log(json);
                    return json;
                }
                console.log('No traces to export');
                return null;
            },
            
            // Set capture options
            setOptions: (opts) => {
                if (typeof window !== 'undefined' && window.__sphereCreatorTrace) {
                    window.__sphereCreatorTrace.setOptions(opts);
                    console.log('✓ Sphere creator trace options updated:', opts);
                }
            },
            
            // Enable/disable tracing
            setEnabled: (enabled) => {
                if (typeof window !== 'undefined' && window.__sphereCreatorTrace) {
                    window.__sphereCreatorTrace.setEnabled(enabled);
                    window.sphereTrace.enabled = enabled;
                    console.log(`✓ Sphere creator trace ${enabled ? 'enabled' : 'disabled'}`);
                }
            }
        };
        
        console.log('✓ [SphereCreatorTrace] Console API available');
        console.log('  API: sphereTrace.getStats()');
        console.log('  API: sphereTrace.getTraces()');
        console.log('  API: sphereTrace.clear()');
        console.log('  API: sphereTrace.print()');
        console.log('  API: sphereTrace.export()');
        console.log('  API: sphereTrace.setOptions(opts)');
        console.log('  API: sphereTrace.setEnabled(bool)');
        
        // [Sphere Creator Trace] Console API
        window.sphereTrace = {
            enabled: true,
            captureStacks: true,
            maxEntries: 100,
            
            // Get trace statistics
            getStats: () => {
                if (typeof window !== 'undefined' && window.__sphereCreatorTrace) {
                    return window.__sphereCreatorTrace.getStats();
                }
                return null;
            },
            
            // Get all traces
            getTraces: () => {
                if (typeof window !== 'undefined' && window.__sphereCreatorTrace) {
                    return window.__sphereCreatorTrace.getTraces();
                }
                return null;
            },
            
            // Clear traces
            clear: () => {
                if (typeof window !== 'undefined' && window.__sphereCreatorTrace) {
                    window.__sphereCreatorTrace.clear();
                    console.log('✓ Sphere creator trace cleared');
                }
            },
            
            // Print traces as table
            print: () => {
                const traces = window.sphereTrace.getTraces();
                if (traces && traces.length > 0) {
                    console.group('🔍 Sphere Creator Trace');
                    console.table(traces);
                    console.groupEnd();
                } else {
                    console.log('No sphere creator traces recorded');
                }
            },
            
            // Export traces as JSON
            export: () => {
                const traces = window.sphereTrace.getTraces();
                if (traces && traces.length > 0) {
                    const json = JSON.stringify(traces, null, 2);
                    console.log('Sphere Creator Trace JSON:');
                    console.log(json);
                    return json;
                }
                console.log('No traces to export');
                return null;
            },
            
            // Set capture options
            setOptions: (opts) => {
                if (typeof window !== 'undefined' && window.__sphereCreatorTrace) {
                    window.__sphereCreatorTrace.setOptions(opts);
                    console.log('✓ Sphere creator trace options updated:', opts);
                }
            },
            
            // Enable/disable tracing
            setEnabled: (enabled) => {
                if (typeof window !== 'undefined' && window.__sphereCreatorTrace) {
                    window.__sphereCreatorTrace.setEnabled(enabled);
                    window.sphereTrace.enabled = enabled;
                    console.log(`✓ Sphere creator trace ${enabled ? 'enabled' : 'disabled'}`);
                }
            }
        };
        
        console.log('✓ [SphereCreatorTrace] Console API available');
        console.log('  API: sphereTrace.getStats()');
        console.log('  API: sphereTrace.getTraces()');
        console.log('  API: sphereTrace.clear()');
        console.log('  API: sphereTrace.print()');
        console.log('  API: sphereTrace.export()');
        console.log('  API: sphereTrace.setOptions(opts)');
        console.log('  API: sphereTrace.setEnabled(bool)');
        
        // Global toggle function for world events
        window.toggleWorldEvents = function () {
            const coordinator = window.game?.worldEventCoordinator || window.game?.environmentDomain?.instances?.worldEventCoordinator;
            if (coordinator?.toggleMetricReactiveEvents) {
                coordinator.toggleMetricReactiveEvents();
                return;
            }

            if (window.game && window.game.metricReactiveEvents) {
                if (window.game.metricReactiveEvents.enabled) {
                    window.game.metricReactiveEvents.disable?.();
                } else {
                    window.game.metricReactiveEvents.enable?.();
                }
            }
        };

        // Global debug function for world events
        window.debugWorldEvents = function () {
            const coordinator = window.game?.worldEventCoordinator || window.game?.environmentDomain?.instances?.worldEventCoordinator;
            if (coordinator?.getMetricReactiveEventsStatus) {
                const status = coordinator.getMetricReactiveEventsStatus();
                console.group('Metric-Reactive World Events Status (coordinator)');
                console.log('Coordinator initialized:', coordinator._initialized);
                console.log('Ritual active:', coordinator._ritualActive);
                console.log('Pending metric tag:', coordinator._pendingMetricTag);
                console.log('Pending priority:', coordinator._pendingMetricPriority);
                console.log('World event cooldown ms:', coordinator._worldEventCooldownMs);
                console.log('Post-ritual cooldown ms:', coordinator._postRitualCooldownMs);
                console.log('Metric reactive events enabled:', status.enabled);
                console.log('Metric reactive events debug mode:', status.debugMode);
                console.log('Metric reactive events performance:', status.performance);
                console.log('Metric reactive event states:', status.eventStates);
                console.groupEnd();
                return;
            }

            if (window.game && window.game.metricReactiveEvents) {
                console.group('Metric-Reactive World Events Status');
                console.log('Enabled:', window.game.metricReactiveEvents.enabled);
                console.log('Debug Mode:', window.game.metricReactiveEvents.debugMode);
                console.log('Performance:', window.game.metricReactiveEvents.getPerformanceStats?.());
                console.log('Event States:', window.game.metricReactiveEvents.eventStates);
                console.groupEnd();
            }
        };

        // Global debug function for world reset fix
        window.debugWorldResetFix = function () {
            if (window.game && window.game.worldResetFix) {
                console.group('Safe World Reset Fix 1.0 Status');
                const status = window.game.worldResetFix.getStatus();
                console.log('Transition Active:', status.isTransitioning);
                console.log('Scene Ready:', status.sceneReady);
                console.log('Cleanup Queue Length:', status.cleanupQueueLength);
                console.log('Systems Active:', status.systemsActive);
                console.groupEnd();
            }
        };

        // LEGACY/april — debugMythicGlyphs disconnected 2026-04-22
        // window.debugMythicGlyphs = function () {
        //     if (window.game && window.game.mythicSeedGlyph) {
        //         window.game.mythicSeedGlyph.printStatusReport();
        //     }
        // };

        // REMOVED: EXTREME AI SHADER TEST SUITE CONSOLE COMMANDS - moved to LEGACY (2026-04-03)

        // ════════════════════════════════════════════════════════════════════════════════
        // SAFE NEW NODE CATEGORIES 1.0 CONSOLE COMMANDS
        // ════════════════════════════════════════════════════════════════════════════════

        // Print status report for all new node categories
        window.printNewNodeCategoriesStatus = function () {
            if (window.game && window.game.newNodeCategories) {
                window.game.newNodeCategories.printStatusReport();
            } else {
                console.warn('[SafeNewNodeCategories1_0] Not initialized');
            }
        };

        // Apply Mythic node visuals to a specific node (by array index)
        window.applyMythicNodeVisuals = function (nodeIndex = 0) {
            if (window.game && window.game.newNodeCategories && window.game.aiNodes) {
                const nodes = window.game.aiNodes.nodes;
                if (nodeIndex >= 0 && nodeIndex < nodes.length) {
                    const success = window.game.newNodeCategories.createMythicNodeVisuals(nodes[nodeIndex]);
                    if (success) {
                        console.log(`✓ Applied Mythic visuals to node ${nodeIndex} (MYT-${nodeIndex})`);
                    } else {
                        console.warn(`✗ Failed to apply Mythic visuals to node ${nodeIndex}`);
                    }
                } else {
                    console.warn(`Invalid node index: ${nodeIndex} (available: 0-${nodes.length - 1})`);
                }
            } else {
                console.warn('[SafeNewNodeCategories1_0] Not initialized or AI Nodes not available');
            }
        };

        // Apply Prime node visuals to a specific node
        window.applyPrimeNodeVisuals = function (nodeIndex = 0) {
            if (window.game && window.game.newNodeCategories && window.game.aiNodes) {
                const nodes = window.game.aiNodes.nodes;
                if (nodeIndex >= 0 && nodeIndex < nodes.length) {
                    const success = window.game.newNodeCategories.createPrimeNodeVisuals(nodes[nodeIndex]);
                    if (success) {
                        console.log(`✓ Applied Prime visuals to node ${nodeIndex} (PRM-${nodeIndex})`);
                    } else {
                        console.warn(`✗ Failed to apply Prime visuals to node ${nodeIndex}`);
                    }
                } else {
                    console.warn(`Invalid node index: ${nodeIndex} (available: 0-${nodes.length - 1})`);
                }
            } else {
                console.warn('[SafeNewNodeCategories1_0] Not initialized or AI Nodes not available');
            }
        };

        // Apply Error node visuals to a specific node
        window.applyErrorNodeVisuals = function (nodeIndex = 0) {
            if (window.game && window.game.newNodeCategories && window.game.aiNodes) {
                const nodes = window.game.aiNodes.nodes;
                if (nodeIndex >= 0 && nodeIndex < nodes.length) {
                    const success = window.game.newNodeCategories.createErrorNodeVisuals(nodes[nodeIndex]);
                    if (success) {
                        console.log(`✓ Applied Error visuals to node ${nodeIndex} (ERR-${nodeIndex})`);
                    } else {
                        console.warn(`✗ Failed to apply Error visuals to node ${nodeIndex}`);
                    }
                } else {
                    console.warn(`Invalid node index: ${nodeIndex} (available: 0-${nodes.length - 1})`);
                }
            } else {
                console.warn('[SafeNewNodeCategories1_0] Not initialized or AI Nodes not available');
            }
        };

        // Demo: Apply all three categories to demo nodes
        window.demoNewNodeCategories = function () {
            if (window.game && window.game.newNodeCategories && window.game.aiNodes) {
                const nodes = window.game.aiNodes.nodes;
                if (nodes.length >= 3) {
                    console.group('🎨 New Node Categories Demo');

                    window.game.newNodeCategories.createMythicNodeVisuals(nodes[0]);
                    console.log(`✓ Node 0: Mythic (MYT-0) - Gold/Purple/Cyan triple aura`);

                    window.game.newNodeCategories.createPrimeNodeVisuals(nodes[1]);
                    console.log(`✓ Node 1: Prime (PRM-1) - White fractal core with hex rings`);

                    window.game.newNodeCategories.createErrorNodeVisuals(nodes[2]);
                    console.log(`✓ Node 2: Error (ERR-2) - Red/cyan glitch layers`);

                    console.log('');
                    window.game.newNodeCategories.printStatusReport();
                    console.groupEnd();
                } else {
                    console.warn(`Need at least 3 nodes for demo (available: ${nodes.length})`);
                }
            } else {
                console.warn('[SafeNewNodeCategories1_0] Not initialized or AI Nodes not available');
            }
        };

        // ════════════════════════════════════════════════════════════════════════════════
        // LINKED GLYPH SYNCHRONIZATION 1.0 CONSOLE COMMANDS
        // ════════════════════════════════════════════════════════════════════════════════

        // Debug Linked Glyph Synchronization
        window.debugGlyphSync = function () {
            if (window.game && window.game.linkedGlyphSync) {
                window.game.linkedGlyphSync.printStatusReport();
            } else {
                console.warn('Linked Glyph Synchronization not available');
            }
        };

        // Toggle Linked Glyph Synchronization
        window.toggleLinkedGlyphSync = function () {
            if (window.game && window.game.linkedGlyphSync) {
                window.game.linkedGlyphSync.toggle();
            } else {
                console.warn('Linked Glyph Synchronization not available');
            }
        };

        // Resync all glyphs immediately
        window.resyncAllGlyphs = function () {
            if (window.game && window.game.linkedGlyphSync) {
                window.game.linkedGlyphSync.resyncAllGlyphs();
            } else {
                console.warn('Linked Glyph Synchronization not available');
            }
        };

        // ════════════════════════════════════════════════════════════════════════════════
        // LINKED GLYPH MESSAGING 3.0 CONSOLE COMMANDS
        // ════════════════════════════════════════════════════════════════════════════════

        // Debug Linked Glyph Messaging
        window.debugPrintMessages = function () {
            if (window.game && window.game.linkedGlyphMessaging) {
                window.game.linkedGlyphMessaging.printStatusReport();
            } else {
                console.warn('Linked Glyph Messaging not available');
            }
        };

        // Toggle Linked Glyph Messaging
        window.toggleMessaging = function () {
            if (window.game && window.game.linkedGlyphMessaging) {
                window.game.linkedGlyphMessaging.toggle();
            } else {
                console.warn('Linked Glyph Messaging not available');
            }
        };

        // Clear all messages immediately
        window.clearAllGlyphMessages = function () {
            if (window.game && window.game.linkedGlyphMessaging) {
                window.game.linkedGlyphMessaging.clearAllMessages();
            } else {
                console.warn('Linked Glyph Messaging not available');
            }
        };

        // LEGACY/april — removeOldMarkers disconnected 2026-04-22
        // window.removeOldMarkers = function () {
        //     if (window.game && window.game.mythicSeedGlyph) {
        //         window.game.mythicSeedGlyph.removeOldMarkers();
        //         console.log('✓ Old markers removal triggered');
        //     }
        // };

        // Global debug function for legacy cone cleanup
        window.debugLegacyConeCleanup = function () {
            if (window.game && window.game.legacyConeCleanup) {
                window.game.legacyConeCleanup.printStatusReport();
            }
        };

        // Global function to manually trigger cone cleanup
        window.cleanLegacyCones = function () {
            if (window.game && window.game.legacyConeCleanup && window.game.aiNodes) {
                window.game.legacyConeCleanup.manualCleanup(window.game.aiNodes.nodes);
            }
        };

        // DISABLED: Fractal hex markers debug commands (legacy system)
        // window.debugFractalHexMarkers = function() { ... };
        // window.createFractalHexMarkers = function() { ... };

        // ========== LEGACY GLYPH CLEANUP 1.0 DEBUG COMMANDS ==========

        // LEGACY/april — cleanupLegacyGlyphs disconnected 2026-04-22
        // window.cleanupLegacyGlyphs = function () { ... };

        // LEGACY/april — debugLegacyGlyphCleanup disconnected 2026-04-22
        // window.debugLegacyGlyphCleanup = function () { ... };

        // ========== GLYPH PURITY MODE 5.1 DEBUG COMMANDS ==========

        // Main purification command - removes all unauthorized glyphs
        window.purifyGlyphs = function () {
            if (window.game && window.game.glyphPurityMode) {
                const removed = window.game.glyphPurityMode.purifyScene();
                console.group('🎨 Glyph Purity Enforcement');
                console.log(`Unauthorized Glyphs Removed: ${removed}`);
                window.game.glyphPurityMode.printPurityReport();
                console.groupEnd();
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // Set purity enforcement level (0=OFF, 1=MODERATE, 2=STRICT, 3=PURE)
        window.setPurityLevel = function (level) {
            if (window.game && window.game.glyphPurityMode) {
                window.game.glyphPurityMode.setPurityLevel(level);
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // Print comprehensive purity report
        window.debugPurityMode = function () {
            if (window.game && window.game.glyphPurityMode) {
                window.game.glyphPurityMode.printPurityReport();
                window.game.glyphPurityMode.printIntegrityReport();
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // List all approved glyph components
        window.listApprovedGlyphs = function () {
            if (window.game && window.game.glyphPurityMode) {
                window.game.glyphPurityMode.printApprovedComponents();
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // Validate entire scene integrity
        window.validateGlyphIntegrity = function () {
            if (window.game && window.game.glyphPurityMode) {
                const report = window.game.glyphPurityMode.validateSceneIntegrity();
                console.group('✓ Scene Glyph Integrity Validation');
                console.log(`Valid Glyphs: ${report.valid}`);
                console.log(`Invalid Glyphs: ${report.invalid}`);
                console.log(`Scene is Pure: ${report.isPure ? '✓ YES - Perfect!' : '✗ NO - Issues found'}`);
                if (report.issues.length > 0) {
                    console.log('Issues:');
                    report.issues.forEach(issue => console.log(`  ⚠ ${issue}`));
                }
                console.groupEnd();
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // Enable/disable purity enforcement
        window.togglePurityMode = function (enabled) {
            if (window.game && window.game.glyphPurityMode) {
                window.game.glyphPurityMode.setPurityEnabled(enabled !== false);
            } else {
                console.warn('⚠ Glyph Purity Mode 5.1 not initialized');
            }
        };

        // ========== ADAPTIVE GLYPH RENDERING 1.0 DEBUG COMMANDS ==========

        // Debug adaptive glyph rendering status
        window.debugAdaptiveGlyphs = function () {
            if (window.game && window.game.adaptiveGlyphRendering) {
                window.game.adaptiveGlyphRendering.printDebugReport();
            } else {
                console.warn('⚠ Adaptive Glyph Rendering 1.0 not initialized');
            }
        };

        // Toggle adaptive glyph rendering on/off
        window.toggleAdaptiveGlyphs = function (enabled) {
            if (window.game && window.game.adaptiveGlyphRendering) {
                window.game.adaptiveGlyphRendering.setEnabled(enabled !== false);
            } else {
                console.warn('⚠ Adaptive Glyph Rendering 1.0 not initialized');
            }
        };

        // Debug adaptive rendering for a specific node
        window.debugNodeAdaptation = function (nodeIndex = 0) {
            if (!window.game || !window.game.adaptiveGlyphRendering || !window.game.aiNodes) {
                console.warn('⚠ Required systems not found');
                return;
            }

            const node = window.game.aiNodes.nodes[nodeIndex];
            if (!node) {
                console.warn(`⚠ Node at index ${nodeIndex} not found`);
                return;
            }

            const nodeId = node.uuid || `node-${nodeIndex}`;
            window.game.adaptiveGlyphRendering.debugNodeAdaptation(nodeId, node);
        };

        // Global debug function for ATOMA Glyph System
        window.debugGlyphs = function () {
            if (window.game && window.game.glyphSystem) {
                window.game.glyphSystem.printStatus();
            }
        };

        // Global debug function for glyph mapping distribution
        window.debugGlyphMapping = function () {
            if (window.game && window.game.glyphSystem) {
                window.game.glyphSystem.debugGlyphMapping();
            }
        };

        // Global function to auto-assign glyphs to all nodes
        window.autoAssignGlyphs = function () {
            if (window.game && window.game.glyphSystem && window.game.aiNodes) {
                window.game.glyphSystem.assignGlyphsToNodes(window.game.aiNodes.nodes);
                console.log('✓ Auto-assigned glyphs to all nodes');
                window.debugGlyphMapping();
            }
        };

        // Global function to clear all glyphs
        window.clearGlyphs = function () {
            if (window.game && window.game.glyphSystem) {
                window.game.glyphSystem.cleanup();
                console.log('✓ All glyphs cleared');
            }
        };

        // Global debug function for ATOMA Glyph System 4.0
        window.debugGlyphs4 = function () {
            if (window.game && window.game.glyphSystem4) {
                window.game.glyphSystem4.printStatus();
            }
        };

        // Global function to clear all glyphs (4.0)
        window.clearGlyphs4 = function () {
            if (window.game && window.game.glyphSystem4) {
                window.game.glyphSystem4.cleanup();
                console.log('✓ All Glyph System 4.0 glyphs cleared');
            }
        };

        // Global helper to create glyphs with 4.0
        window.createGlyph4 = function (nodeId, glyphType) {
            if (!window.game || !window.game.glyphSystem4 || !window.game.aiNodes) {
                console.warn('Systems not ready');
                return;
            }

            const node = window.game.aiNodes.nodes.find((n, idx) => {
                const nId = n.uuid || `node-${idx}`;
                return nId === nodeId;
            });

            if (!node) {
                console.warn(`Node ${nodeId} not found`);
                return;
            }

            const glyphMethods = {
                aiConsciousness: () => window.game.glyphSystem4.createAIConsciousnessGlyph(node, nodeId),
                mythicSeed: () => window.game.glyphSystem4.createMythicSeedGlyph(node, nodeId),
                ascendedNode: () => window.game.glyphSystem4.createAscendedNodeGlyph(node, nodeId),
                evolutionStage1: () => window.game.glyphSystem4.createEvolutionStage1Glyph(node, nodeId),
                evolutionStage2: () => window.game.glyphSystem4.createEvolutionStage2Glyph(node, nodeId),
                evolutionStage3: () => window.game.glyphSystem4.createEvolutionStage3Glyph(node, nodeId),
                personalityHarmony: () => window.game.glyphSystem4.createPersonalityHarmonyGlyph(node, nodeId),
                personalityInstability: () => window.game.glyphSystem4.createPersonalityInstabilityGlyph(node, nodeId),
                personalityCorruption: () => window.game.glyphSystem4.createPersonalityCorruptionGlyph(node, nodeId),
                personalitySynergy: () => window.game.glyphSystem4.createPersonalitySynergyGlyph(node, nodeId),
                eventMythicRitual: () => window.game.glyphSystem4.createEventMythicRitualGlyph(node, nodeId),
                eventClusterSurge: () => window.game.glyphSystem4.createEventClusterSurgeGlyph(node, nodeId),
                eventWorldEvent: () => window.game.glyphSystem4.createEventWorldEventGlyph(node, nodeId)
            };

            if (glyphMethods[glyphType]) {
                glyphMethods[glyphType]();
                console.log(`✓ Created ${glyphType} glyph (4.0) on node ${nodeId}`);
            } else {
                console.warn(`Unknown glyph type: ${glyphType}`);
                console.log('Available types:', Object.keys(glyphMethods));
            }
        };

        // Global helper to create specific glyph types
        window.createGlyph = function (nodeId, glyphType) {
            if (!window.game || !window.game.glyphSystem || !window.game.aiNodes) {
                console.warn('Systems not ready');
                return;
            }

            const node = window.game.aiNodes.nodes.find((n, idx) => {
                const nId = n.uuid || `node-${idx}`;
                return nId === nodeId;
            });

            if (!node) {
                console.warn(`Node ${nodeId} not found`);
                return;
            }

            const glyphMethods = {
                aiConsciousness: () => window.game.glyphSystem.createAIConsciousnessGlyph(node, nodeId),
                mythicSeed: () => window.game.glyphSystem.createMythicSeedGlyph(node, nodeId),
                ascendedNode: () => window.game.glyphSystem.createAscendedNodeGlyph(node, nodeId),
                evolutionStage1: () => window.game.glyphSystem.createEvolutionStage1Glyph(node, nodeId),
                evolutionStage2: () => window.game.glyphSystem.createEvolutionStage2Glyph(node, nodeId),
                evolutionStage3: () => window.game.glyphSystem.createEvolutionStage3Glyph(node, nodeId),
                personalityHarmony: () => window.game.glyphSystem.createPersonalityHarmonyGlyph(node, nodeId),
                personalityInstability: () => window.game.glyphSystem.createPersonalityInstabilityGlyph(node, nodeId),
                personalityCorruption: () => window.game.glyphSystem.createPersonalityCorruptionGlyph(node, nodeId),
                personalitySynergy: () => window.game.glyphSystem.createPersonalitySynergyGlyph(node, nodeId),
                eventMythicRitual: () => window.game.glyphSystem.createEventMythicRitualGlyph(node, nodeId),
                eventClusterSurge: () => window.game.glyphSystem.createEventClusterSurgeGlyph(node, nodeId),
                eventWorldEvent: () => window.game.glyphSystem.createEventWorldEventGlyph(node, nodeId)
            };

            if (glyphMethods[glyphType]) {
                glyphMethods[glyphType]();
                console.log(`✓ Created ${glyphType} glyph on node ${nodeId}`);
            } else {
                console.warn(`Unknown glyph type: ${glyphType}`);
                console.log('Available types:', Object.keys(glyphMethods));
            }
        };

        // ============================================================
        // GLYPH LAYER 4.0 - MULTI-GLYPH FUSION DEBUG COMMANDS
        // ============================================================

        // Global function to auto-create glyph fusions for all nodes
        window.autoCreateGlyphFusions = function () {
            if (window.game && window.game.glyphLayer4 && window.game.aiNodes) {
                window.game.glyphLayer4.createGlyphFusionsForNodes(window.game.aiNodes.nodes);
                console.log('✓ Auto-created glyph fusions for all nodes');
                window.debugGlyphLayer4Status();
            }
        };

        // Global function to debug glyph fusion on specific node
        window.debugGlyphFusion = function (nodeIndex = 0) {
            if (!window.game || !window.game.glyphLayer4 || !window.game.aiNodes) {
                console.warn('Systems not ready');
                return;
            }

            const node = window.game.aiNodes.nodes[nodeIndex];
            if (!node) {
                console.warn(`Node ${nodeIndex} not found`);
                return;
            }

            const nodeId = node.uuid || `node-${nodeIndex}`;
            window.game.glyphLayer4.debugGlyphFusion(nodeId);
        };

        // Global function to see Glyph Layer 4.0 status
        window.debugGlyphLayer4Status = function () {
            if (window.game && window.game.glyphLayer4) {
                window.game.glyphLayer4.printStatus();
            }
        };

        // Global function to disable Glyph Layer 4.0
        window.disableGlyphLayer4 = function () {
            if (window.game && window.game.glyphLayer4) {
                window.game.glyphLayer4.disable();
            }
        };

        // Global function to enable Glyph Layer 4.0
        window.enableGlyphLayer4 = function () {
            if (window.game && window.game.glyphLayer4) {
                window.game.glyphLayer4.enable();
            }
        };

        // Global function to clean up Glyph Layer 4.0
        window.clearGlyphLayer4 = function () {
            if (window.game && window.game.glyphLayer4) {
                window.game.glyphLayer4.cleanup();
                console.log('✓ Glyph Layer 4.0 cleaned up');
            }
        };

        // ========== SEMANTIC GLYPH AI 5.0 DEBUG COMMANDS ==========

        // Debug a specific node's semantic state
        window.debugSemanticGlyph = function (nodeIndex = 0) {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.debugSemanticGlyph(nodeIndex);
            }
        };

        // Display semantic system statistics
        window.debugSemanticStats = function () {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.debugSemanticStats();
            }
        };

        // Disable semantic AI updates
        window.disableSemanticGlyphAI = function () {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.disable();
                console.log('✓ Semantic Glyph AI disabled');
            }
        };

        // Enable semantic AI updates
        window.enableSemanticGlyphAI = function () {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.enable();
                console.log('✓ Semantic Glyph AI enabled');
            }
        };

        // Record link creation event on a node
        window.recordNodeLink = function (nodeIndex = 0) {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.recordLinkCreated(nodeIndex);
                console.log(`✓ Recorded link creation for node ${nodeIndex}`);
            }
        };

        // Record ritual completion event on a node
        window.recordNodeRitual = function (nodeIndex = 0) {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.recordRitualCompleted(nodeIndex);
                console.log(`✓ Recorded ritual for node ${nodeIndex}`);
            }
        };

        // ===================================================================
        // COMPOSITE GLYPH RESONANCE FEEDBACK DEBUG APIs
        // ===================================================================

        // Toggle debug visualization of resonance influence zones
        window.toggleCompositeResonanceDebug = function () {
            if (window.game && window.game.compositeResonanceFeedback) {
                const cf = window.game.compositeResonanceFeedback;
                const isDebugEnabled = cf.enabled && !cf.debugMode;
                cf.debugMode = !cf.debugMode;
                console.log(`✓ Composite Resonance debug visualization ${cf.debugMode ? 'ENABLED' : 'DISABLED'}`);
                if (cf.debugMode) {
                    console.log('   Visual cues: green wireframe spheres show influence zones');
                    console.log('   Phase vectors show coherence direction');
                }
            }
        };

        // Show status of active composite glyph resonances
        window.compositeResonanceStatus = function () {
            if (window.game && window.game.compositeResonanceFeedback) {
                const cf = window.game.compositeResonanceFeedback;
                console.group('🔮 Composite Glyph Resonance Feedback Status');
                console.log('Enabled:', cf.enabled);
                console.log('Debug Mode:', cf.debugMode);
                console.log('Active Resonances:', cf.resonanceZones.size);
                console.log('Update Counter:', cf.updateCounter);
                
                let activeCount = 0, decayingCount = 0;
                
                if (cf.resonanceZones.size > 0) {
                    console.log('\nZone Details:');
                    for (const [glyphId, zone] of cf.resonanceZones) {
                        const isDecaying = zone.decayStartTime !== null;
                        if (isDecaying) decayingCount++;
                        else activeCount++;
                        
                        console.log(`  [${glyphId}] ${isDecaying ? '🔴 DECAYING' : '🟢 ACTIVE'}`);
                        console.log(`    Strength: ${(zone.strength * 100).toFixed(1)}%`);
                        console.log(`    Radius: ${zone.influenceRadius.toFixed(2)}`);
                        console.log(`    Phase: ${zone.rampPhase}${isDecaying ? ` / Decay: ${zone.decayPhase}` : ''}`);
                        if (isDecaying) {
                            console.log(`    Decay Progress: ${(zone.decayProgress * 100).toFixed(1)}%`);
                            console.log(`    Structural Integrity: ${(zone.structuralIntegrity * 100).toFixed(1)}%`);
                        }
                        console.log(`    Affected: ${zone.affectedElements.length}`);
                    }
                    console.log(`\nSummary: ${activeCount} active, ${decayingCount} decaying`);
                }
                console.groupEnd();
            }
        };

        // Enable optional glyph animation phase influence from composite resonance
        window.enableGlyphResonanceInfluence = function () {
            if (window.game && window.game.compositeResonanceFeedback) {
                window.game.compositeResonanceFeedback.enableGlyphAnimationInfluence(true);
            }
        };

        // Disable optional glyph animation phase influence
        window.disableGlyphResonanceInfluence = function () {
            if (window.game && window.game.compositeResonanceFeedback) {
                window.game.compositeResonanceFeedback.enableGlyphAnimationInfluence(false);
            }
        };

        // Show detailed decay status of composite glyphs
        window.compositeGlyphDecayStatus = function () {
            if (window.game && window.game.compositeResonanceFeedback) {
                const cf = window.game.compositeResonanceFeedback;
                console.group('⏳ Composite Glyph Decay Status');
                
                let hasDecaying = false;
                for (const [glyphId, zone] of cf.resonanceZones) {
                    if (zone.decayStartTime !== null) {
                        hasDecaying = true;
                        console.log(`\n[${glyphId}]`);
                        console.log(`  Status: 🔴 ${zone.decayPhase.toUpperCase()}`);
                        console.log(`  Overall Progress: ${(zone.decayProgress * 100).toFixed(1)}%`);
                        console.log(`  Elapsed: ${zone.decayStartTime.toFixed(2)}s`);
                        console.log(`  Opacity Strength: ${(zone.strength * 100).toFixed(1)}%`);
                        console.log(`  Structural Integrity: ${(zone.structuralIntegrity * 100).toFixed(1)}%`);
                        console.log(`  Phase Decoherence: ${zone.phaseDecoherence.toFixed(3)} rad`);
                        console.log(`  Influence Radius: ${zone.influenceRadius.toFixed(2)}`);
                        
                        // Show reabsorption info if dissolving
                        if (zone.decayPhase === 'dissolving' && zone.sourceGlyphs.length > 0) {
                            console.log(`  📊 Source Reabsorption:`);
                            console.log(`     Sources Found: ${zone.sourceGlyphs.length}`);
                            console.log(`     Source IDs: ${zone.sourceNodeIds.join(', ')}`);
                        }
                    }
                }
                
                if (!hasDecaying) {
                    console.log('No composite glyphs currently decaying.');
                }
                console.groupEnd();
            }
        };

        // Record ascension event on a node
        window.recordNodeAscended = function (nodeIndex = 0) {
            if (window.game && window.game.semanticGlyphAI) {
                window.game.semanticGlyphAI.recordAscended(nodeIndex);
                console.log(`✓ Recorded ascension for node ${nodeIndex}`);
            }
        };

        // ========== GLYPH FUSION OVERLAY 4.1 DEBUG COMMANDS ==========

        // Debug fusion glyph on a specific node
        window.debugFusionGlyph = function (nodeIndex = 0) {
            if (window.game && window.game.glyphFusionOverlay) {
                window.game.glyphFusionOverlay.debugFusionGlyph(nodeIndex);
            }
        };

        // Display fusion glyph system statistics
        window.debugFusionStats = function () {
            if (window.game && window.game.glyphFusionOverlay) {
                window.game.glyphFusionOverlay.debugFusionStats();
            }
        };

        // Enable Glyph Fusion Overlay
        window.enableFusionOverlay = function () {
            if (window.game && window.game.glyphFusionOverlay) {
                window.game.glyphFusionOverlay.enable();
                console.log('✓ Glyph Fusion Overlay 4.1 enabled');
            }
        };

        // Disable Glyph Fusion Overlay
        window.disableFusionOverlay = function () {
            if (window.game && window.game.glyphFusionOverlay) {
                window.game.glyphFusionOverlay.disable();
                console.log('✓ Glyph Fusion Overlay 4.1 disabled');
            }
        };

        // ========== ATOMA GLYPH SYSTEM 4.0 CLEANUP COMMANDS ==========

        // Remove all legacy 2D cyan hexagon glyphs (Glyph System 4.0 only)
        window.glyphCleanupLegacy = function () {
            if (window.game && window.game.glyphSystem4) {
                const removed = window.game.glyphSystem4.removeLegacyHexGlyphs();
                console.log(`🧹 Glyph System 4.0 cleanup complete: ${removed} legacy hex glyphs removed`);
            } else {
                console.warn('⚠ Glyph System 4.0 not found');
            }
        };

        // ========== PROCEDURAL MEANING ENGINE 1.0 DEBUG COMMANDS ==========

        // Debug procedural glyph system statistics
        window.debugProceduralGlyphs = function () {
            if (window.game && window.game.proceduralMeaningEngine) {
                const stats = window.game.proceduralMeaningEngine.getStats();
                console.group('Procedural Meaning Engine 1.0 Stats');
                console.log('Total Glyphs:', stats.totalGlyphs);
                console.log('Active Glyphs:', stats.activeGlyphs);
                console.log('Removed This Frame:', stats.removedThisFrame);
                console.log('Created This Frame:', stats.createdThisFrame);
                console.log('Frame Time (ms):', stats.frameTime.toFixed(3));
                console.log('Registry Size:', stats.registrySize);
                console.groupEnd();
            }
        };

        // Remove legacy 2D cyan hexagon glyphs
        window.debugRemoveLegacyHex = function () {
            if (window.game && window.game.proceduralMeaningEngine) {
                window.game.proceduralMeaningEngine.debugRemoveLegacyHex();
            }
        };

        // Enable Procedural Meaning Engine
        window.enableProceduralGlyphs = function () {
            if (window.game && window.game.proceduralMeaningEngine) {
                window.game.proceduralMeaningEngine.enabled = true;
                console.log('✓ Procedural Meaning Engine 1.0 enabled');
            }
        };

        // ========== ATOMA AUDIO SYSTEM DEBUG COMMANDS ==========

        // Enable/disable audio system
        window.setAudioEnabled = function (enabled) {
            const nextEnabled = enabled !== false;

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

            console.log(`🔊 Audio System ${nextEnabled ? 'ENABLED' : 'DISABLED'}`);
            window.__ATOMA_UPDATE_AUDIO_MUTE_TOGGLE__?.();
            return nextEnabled;
        };

        window.toggleAudio = function () {
            const currentEnabled = window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ !== undefined
                ? window.__ATOMA_AUDIO_ENABLED_PREFERENCE__ !== false
                : window.game?.audioSystem
                    ? window.game.audioSystem.enabled !== false
                    : true;
            return window.setAudioEnabled?.(!currentEnabled);
        };

        document.addEventListener('keydown', (event) => {
            if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.code !== 'KeyM') return;
            const tagName = String(event.target?.tagName || '').toUpperCase();
            if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;
            event.preventDefault();
            window.toggleAudio?.();
        });

        // Start audio context (required on first interaction)
        // Note: AudioContext is started on first user gesture via event listeners in constructor
        // No automatic start - browser autoplay policy requires user gesture

        // Test individual sounds
        window.testAudio = function (soundName = 'all') {
            if (!window.game || !window.game.audioSystem) {
                console.warn('⚠ Audio System not available');
                return;
            }
            
            const audio = window.game.audioSystem;
            if (audio.enabled === false) {
                console.warn('⚠ Audio System disabled');
                return;
            }
            const sounds = {
                'hover': () => audio.playHoverEnter?.(),
                'hover_exit': () => audio.playHoverExit?.(),
                'selection': () => audio.playSelection(),
                'primary_set': () => audio.playPrimaryNodeSet?.(),
                'deselection': () => audio.playDeselection(),
                'link': () => audio.playLinkCreated(),
                'unlink': () => audio.playLinkBroken(),
                'invalid_link': () => audio.playInvalidLinkAttempt?.(),
                'synergy_active': () => audio.playSynergyActive(),
                'synergy_fade': () => audio.playSynergyFade()
            };
            
            if (soundName === 'all') {
                Object.values(sounds).forEach(fn => {
                    setTimeout(fn, 300); // Stagger for audibility
                });
                console.log('🔊 Playing all ATOMA audio tests');
            } else if (sounds[soundName]) {
                sounds[soundName]();
                console.log(`🔊 Played: ${soundName}`);
            } else {
                console.warn(`⚠ Unknown sound: ${soundName}`);
                console.log('Available: hover, hover_exit, selection, primary_set, deselection, link, unlink, invalid_link, synergy_active, synergy_fade');
            }
        };

        // Show audio system status
        window.audioStatus = function () {
            if (window.game && typeof window.game._refreshAudioDiagnostics === 'function') {
                const status = window.game._refreshAudioDiagnostics();
                console.group('🔊 ATOMA Audio System Status');
                console.log('Backend:', status.backend);
                console.log('Initialized:', status.initialized);
                console.log('Core Ready:', status.coreReady);
                console.log('Enabled:', status.enabled);
                console.log('Muted:', status.muted);
                console.log('Tone State:', status.toneState);
                console.log('Modulation Ready:', status.modulationReady);
                console.log('Harmonic Ready:', status.harmonicReady);
                console.log('Zone Ready:', status.zoneReady);
                console.log('Fatal Locked:', status.fatalLocked);
                console.log('Last Error:', status.lastError);
                console.log('Optional Errors:', status.optionalErrors);
                console.log('Synergy Threshold:', window.game.synergyActivationThreshold);
                console.log('Current Synergy State:', window.game.previousSynergyState);
                console.groupEnd();
                return status;
            }
            return null;
        };

        // ========== ATOMA AUDIO MODULATION DEBUG COMMANDS ==========

        // Enable/disable audio modulation (3-layer: synergy, harmony, corruption)
      //  window.toggleAudioModulation = function () {
      //      if (window.game && window.game.audioModulation) {
      //          const enabled = !window.game.audioModulation.enabled;
      //          window.game.audioModulation.setEnabled(enabled);
      //          console.log(`🎼 Audio Modulation ${enabled ? 'ENABLED' : 'DISABLED'}`);
   //         }
    //    };

        // Show audio modulation status
      //  window.audioModulationStatus = function () {
          // if (window.game && window.game.audioModulation) {
          //      const status = window.game.audioModulation.getStatus();
           //     console.group('🎼 ATOMA Audio Modulation Status');
       //         console.log('Enabled:', status.enabled);
     //           console.log('Synergy (Clarity):', status.synergy);
   //             console.log('Harmony (Stability):', status.harmony);
 //               console.log('Corruption (Entropy):', status.corruption);
 //               console.log(status.description);
 //               console.groupEnd();
  //          }
   //     };

        // Test audio modulation layers
        window.testAudioModulation = function () {
            if (window.game && window.game.audioModulation) {
                window.game.audioModulation.testModulation();
                console.log('✓ Audio Modulation test complete (check console for details)');
            }
        };

        // Disable Procedural Meaning Engine
        window.disableProceduralGlyphs = function () {
            if (window.game && window.game.proceduralMeaningEngine) {
                window.game.proceduralMeaningEngine.enabled = false;
                console.log('✓ Procedural Meaning Engine 1.0 disabled');
            }
        };

        window.disableSynergyShaderStacks = function () {
            const game = window.game;
            if (!game) {
                console.warn('Synergy shader stacks disabled flag set, but game is not initialized yet');
                window.ATOMA_DISABLE_SYNERGY_SHADER_STACK = true;
                window.ATOMA_FLAGS = window.ATOMA_FLAGS || {};
                window.ATOMA_FLAGS.visual = window.ATOMA_FLAGS.visual || {};
                window.ATOMA_FLAGS.visual.disableSynergyShaderStacks = true;
                return;
            }

            window.ATOMA_DISABLE_SYNERGY_SHADER_STACK = true;
            window.ATOMA_FLAGS = window.ATOMA_FLAGS || {};
            window.ATOMA_FLAGS.visual = window.ATOMA_FLAGS.visual || {};
            window.ATOMA_FLAGS.visual.disableSynergyShaderStacks = true;

            try {
                game.synergyBonusFXLayer?.dispose?.();
                game.synergyResonanceShaderPack?.dispose?.();
            } catch (err) {
                console.warn('[main.js] Synergy shader stack disposal failed:', err);
            }

            game.synergyBonusFXLayer = null;
            game.synergyResonanceShaderPack = null;
            console.log('✓ Synergy shader stacks disabled');
        };

        // ========== COMPUTE SYNERGY SCORE 2.0 DEBUG COMMANDS ==========

        // Register ComputeSynergyScore2_0 globally
        if (computeSynergyScore) {
            window.ComputeSynergyScore2_0 = computeSynergyScore;
        }

        // Test synergy scoring on a category pair
        window.testSynergyPair = function (cat1, cat2) {
            if (window.ComputeSynergyScore2_0) {
                return window.ComputeSynergyScore2_0.tuning.testPair(cat1, cat2);
            } else {
                console.warn('⚠ ComputeSynergyScore2_0 not available');
            }
        };

        // Test all category pairs (full matrix)
        window.testAllSynergyPairs = function () {
            if (window.ComputeSynergyScore2_0) {
                return window.ComputeSynergyScore2_0.tuning.testAll();
            } else {
                console.warn('⚠ ComputeSynergyScore2_0 not available');
            }
        };

        // Enable synergy score debug logging
        window.enableSynergyDebug = function () {
            if (window.ComputeSynergyScore2_0) {
                window.ComputeSynergyScore2_0.tuning.debug = true;
                console.log('✓ ComputeSynergyScore2_0 debug logging enabled');
            } else {
                console.warn('⚠ ComputeSynergyScore2_0 not available');
            }
        };

        // Disable synergy score debug logging
        window.disableSynergyDebug = function () {
            if (window.ComputeSynergyScore2_0) {
                window.ComputeSynergyScore2_0.tuning.debug = false;
                console.log('✓ ComputeSynergyScore2_0 debug logging disabled');
            } else {
                console.warn('⚠ ComputeSynergyScore2_0 not available');
            }
        };

        // Get synergy score statistics (if available)
        window.getSynergyStats = function () {
            if (window.game && window.game.nodeLinkingSystem) {
                const allLinks = window.game.nodeLinkingSystem.links || [];
                const scores = allLinks
                    .map(link => ({
                        id: link.id || 'unknown',
                        score: link['synergyScore']?.score || 0,
                        tier: link['synergyScore']?.tier || 'unknown'
                    }))
                    .sort((a, b) => b.score - a.score);
                
                console.group('📊 Synergy Score Statistics');
                console.log(`Total Links: ${allLinks.length}`);
                console.log(`Links with Scores: ${scores.filter(s => s.score > 0).length}`);
                
                if (scores.length > 0) {
                    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
                    console.log(`Average Score: ${avgScore.toFixed(3)}`);
                    
                    const tiers = { low: 0, medium: 0, high: 0, critical: 0 };
                    scores.forEach(s => {
                        if (tiers[s.tier] !== undefined) tiers[s.tier]++;
                    });
                    console.log('Tier Distribution:', tiers);
                    
                    console.log('\nTop 10 Synergy Links:');
                    scores.slice(0, 10).forEach((s, i) => {
                        console.log(`  ${i + 1}. ${s.id} → ${s.score.toFixed(3)} [${s.tier}]`);
                    });
                }
                console.groupEnd();
            } else {
                console.warn('⚠ NodeLinkingSystem not available');
            }
        };

        console.log('✓ ComputeSynergyScore2_0 registered');
        console.log('  Commands: testSynergyPair() | testAllSynergyPairs() | getSynergyStats()');
        console.log('  Debug: enableSynergyDebug() | disableSynergyDebug()');

        // ========== LINK RECOMMENDATION AI 1.0 DEBUG COMMANDS ==========

        // Get recommendations for a node by name
        window.recommendFor = function (nodeName) {
            if (!window.game || !window.game.linkRecommendationAI) {
                console.warn('⚠ LinkRecommendationAI not available');
                return;
            }

            const nodes = window.game.aiNodes?.nodes || [];
            const node = nodes.find(n =>
                (n.userData?.name || n.name || n.id || '').toLowerCase().includes(nodeName.toLowerCase())
            );

            if (!node) {
                console.warn(`⚠ Node "${nodeName}" not found`);
                return;
            }

            window.game.linkRecommendationAI.updateRecommendations(node);
            window.game.linkRecommendationAI.debugDump();
        };

        // Get recommendations for currently selected node
        window.recommendActive = function () {
            if (!window.game || !window.game.linkRecommendationAI) {
                console.warn('⚠ LinkRecommendationAI not available');
                return;
            }

            // Try to get selected node from NodeSelectionCore3_4
            const selectedNode = window.game.selectedNode;
            if (!selectedNode) {
                console.warn('⚠ No node currently selected. Use recommendFor(nodeName) instead.');
                return;
            }

            window.game.linkRecommendationAI.updateRecommendations(selectedNode);
            window.game.linkRecommendationAI.debugDump();
        };

        // Print current recommendations
        window.printRecommendations = function () {
            if (!window.game || !window.game.linkRecommendationAI) {
                console.warn('⚠ LinkRecommendationAI not available');
                return;
            }

            window.game.linkRecommendationAI.debugDump();
        };

        // Get recommendation statistics
        window.getRecommendationStats = function () {
            if (!window.game || !window.game.linkRecommendationAI) {
                console.warn('⚠ LinkRecommendationAI not available');
                return;
            }

            const stats = window.game.linkRecommendationAI.getStats();
            console.group('🤖 Link Recommendation AI Statistics');
            console.log('Active Node:', stats.activeNodeName);
            console.log('Candidates:', stats.candidateCount);
            console.log('Total Recommendations:', stats.totalRecommendations);
            console.log('Average Update Time:', stats.averageUpdateTime.toFixed(3) + 'ms');
            console.log('Max Update Time:', stats.maxUpdateTime.toFixed(3) + 'ms');
            console.log('Errors:', stats.errors);
            console.log('Config:', stats.config);
            console.groupEnd();
        };

        // Enable/disable recommendation AI
        window.enableRecommendationAI = function () {
            if (window.game && window.game.linkRecommendationAI) {
                window.game.linkRecommendationAI.setEnabled(true);
                console.log('✓ LinkRecommendationAI enabled');
            } else {
                console.warn('⚠ LinkRecommendationAI not available');
            }
        };

        window.disableRecommendationAI = function () {
            if (window.game && window.game.linkRecommendationAI) {
                window.game.linkRecommendationAI.setEnabled(false);
                console.log('✓ LinkRecommendationAI disabled');
            } else {
                console.warn('⚠ LinkRecommendationAI not available');
            }
        };

        console.log('✓ LinkRecommendationAI1_0 registered');
        console.log('  Commands: recommendFor(name) | recommendActive() | printRecommendations() | getRecommendationStats()');
        console.log('  Control: enableRecommendationAI() | disableRecommendationAI()');

        // ========== LINK AUTOMATION ENGINE 1.0 DEBUG COMMANDS ==========

        // Auto-link for currently selected node
        window.autoLinkActive = function () {
            if (!window.game || !window.game.linkAutomationEngine) {
                console.warn('⚠ LinkAutomationEngine not available');
                return;
            }

            const selectedNode = window.game.selectedNode;
            if (!selectedNode) {
                console.warn('⚠ No node currently selected');
                return;
            }

            const result = window.game.linkAutomationEngine.autoLinkFor(selectedNode);
            console.group('[AutoLink] Results');
            console.log(`Created: ${result.created}`);
            console.log(`Skipped: ${result.skipped}`);
            console.log(`Total Candidates: ${result.total}`);
            if (result.links.length > 0) {
                console.log('Links Created:');
                result.links.forEach(link => {
                    console.log(`  → ${link.sourceCategory} → ${link.targetCategory} (${link['synergyScore'].toFixed(3)})`);
                });
            }
            if (result.reason !== 'ok') {
                console.log('Reason:', result.reason);
            }
            console.groupEnd();
        };

        // Preview what WOULD be created (without creating)
        window.previewAutoLink = function () {
            if (!window.game || !window.game.linkAutomationEngine) {
                console.warn('⚠ LinkAutomationEngine not available');
                return;
            }

            const selectedNode = window.game.selectedNode;
            if (!selectedNode) {
                console.warn('⚠ No node currently selected');
                return;
            }

            const preview = window.game.linkAutomationEngine.preview(selectedNode);
            console.group('[AutoLink] Preview (No Changes Made)');
            console.log(`Would Create: ${preview.wouldCreate} links`);
            if (preview.suggestions.length > 0) {
                console.log('Suggested Links:');
                preview.suggestions.forEach((suggestion, i) => {
                    console.log(`  ${i + 1}. → ${suggestion.targetCategory} (${suggestion.synergyScore})`);
                });
            }
            if (preview.reason !== 'ok') {
                console.log('Reason:', preview.reason);
            }
            console.groupEnd();
        };

        // Enable automation
        window.enableAutoLink = function () {
            if (window.game && window.game.linkAutomationEngine) {
                window.game.linkAutomationEngine.enable();
                console.log('✓ LinkAutomationEngine enabled');
            } else {
                console.warn('⚠ LinkAutomationEngine not available');
            }
        };

        // Disable automation
        window.disableAutoLink = function () {
            if (window.game && window.game.linkAutomationEngine) {
                window.game.linkAutomationEngine.disable();
                console.log('✓ LinkAutomationEngine disabled');
            } else {
                console.warn('⚠ LinkAutomationEngine not available');
            }
        };

        // Toggle automation
        window.toggleAutoLink = function () {
            if (window.game && window.game.linkAutomationEngine) {
                window.game.linkAutomationEngine.toggle();
                const state = window.game.linkAutomationEngine.isEnabled();
                console.log(`✓ LinkAutomationEngine toggled to ${state ? 'ENABLED' : 'DISABLED'}`);
            } else {
                console.warn('⚠ LinkAutomationEngine not available');
            }
        };

        // Get automation statistics
        window.getAutoLinkStats = function () {
            if (!window.game || !window.game.linkAutomationEngine) {
                console.warn('⚠ LinkAutomationEngine not available');
                return;
            }

            const stats = window.game.linkAutomationEngine.getStats();
            console.group('⚙️ Link Automation Engine Statistics');
            console.log('Status:', stats.config.enabled ? '✓ ENABLED' : '✗ DISABLED');
            console.log('Automation Threshold:', stats.config.automationThreshold);
            console.log('Max Links Per Cycle:', stats.config.maxLinksPerCycle);
            console.log('Safe Cooldown (ms):', stats.config.safetyCooldownMs);
            console.log('Cooldown Remaining (ms):', stats.cooldownRemaining);
            console.log('---');
            console.log('Total Auto-Links Created:', stats.totalAutoLinksCreated);
            console.log('Total Cycles:', stats.totalCycles);
            console.log('Average Links Per Cycle:', stats.averageLinksPerCycle.toFixed(2));
            console.log('Last Cycle Created:', stats.lastCycleCreated);
            console.log('Last Cycle Skipped:', stats.lastCycleSkipped);
            console.log('Last Execution Time:', stats.lastExecutionMs.toFixed(3) + 'ms');
            console.log('Total Previews:', stats.totalPreviews);
            console.groupEnd();
        };

        console.log('✓ LinkAutomationEngine1_0 registered');
        console.log('  Commands: autoLinkActive() | previewAutoLink() | getAutoLinkStats()');
        console.log('  Control: enableAutoLink() | disableAutoLink() | toggleAutoLink()');

        // ========== AUTO LINK FEEDBACK UI 1.0 DEBUG COMMANDS ==========

        // Check if feedback UI is active
        window.feedbackUIActive = function () {
            if (!window.game || !window.game.autoLinkFeedbackUI) {
                console.warn('⚠ AutoLinkFeedbackUI not available');
                return;
            }

            const stats = window.game.autoLinkFeedbackUI.getStats();
            console.group('📊 Auto Link Feedback UI Status');
            console.log('Active:', stats.isActive ? '✓ YES' : '✗ NO');
            console.log('Total Feedbacks Triggered:', stats.feedbacksTriggered);
            console.log('Total Feedbacks Processed:', stats.feedbacksProcessed);
            console.log('Pulses Created:', stats.pulsesCreated);
            console.log('Tooltips Created:', stats.tooltipsCreated);
            console.log('HUD Notifications Shown:', stats.hudNotificationsShown);
            console.log('---');
            console.log('Active Pulses:', stats.activePulses);
            console.log('Active Tooltips:', stats.activeTooltips);
            console.log('HUD Queue:', stats.hudNotificationsQueued);
            console.log('Cooldown Remaining (ms):', stats.cooldownRemainingMs);
            console.groupEnd();
        };

        // Test all feedback effects
        window.testAutoLinkFeedback = function () {
            if (!window.game || !window.game.autoLinkFeedbackUI) {
                console.warn('⚠ AutoLinkFeedbackUI not available');
                return;
            }

            console.log('🧪 Testing Auto Link Feedback effects...');
            window.game.autoLinkFeedbackUI.testAllEffects();
        };

        // Enable feedback UI
        window.enableFeedbackUI = function () {
            if (window.game && window.game.autoLinkFeedbackUI) {
                window.game.autoLinkFeedbackUI.enable();
                console.log('✓ AutoLinkFeedbackUI enabled');
            } else {
                console.warn('⚠ AutoLinkFeedbackUI not available');
            }
        };

        // Disable feedback UI
        window.disableFeedbackUI = function () {
            if (window.game && window.game.autoLinkFeedbackUI) {
                window.game.autoLinkFeedbackUI.disable();
                console.log('✓ AutoLinkFeedbackUI disabled');
            } else {
                console.warn('⚠ AutoLinkFeedbackUI not available');
            }
        };

        // Toggle feedback UI
        window.toggleFeedbackUI = function () {
            if (window.game && window.game.autoLinkFeedbackUI) {
                window.game.autoLinkFeedbackUI.toggle();
                const state = window.game.autoLinkFeedbackUI.isActive;
                console.log(`✓ AutoLinkFeedbackUI toggled to ${state ? 'ENABLED' : 'DISABLED'}`);
            } else {
                console.warn('⚠ AutoLinkFeedbackUI not available');
            }
        };

        // Clear all active feedback effects
        window.clearAutoLinkFeedback = function () {
            if (window.game && window.game.autoLinkFeedbackUI) {
                window.game.autoLinkFeedbackUI.clearAll();
                console.log('✓ All auto-link feedback effects cleared');
            } else {
                console.warn('⚠ AutoLinkFeedbackUI not available');
            }
        };

        console.log('✓ AutoLinkFeedbackUI1_0 registered');
        console.log('  Commands: feedbackUIActive() | testAutoLinkFeedback() | clearAutoLinkFeedback()');
        console.log('  Control: enableFeedbackUI() | disableFeedbackUI() | toggleFeedbackUI()');

        // ========== SYNERGY RECOMMENDATION DEBUG HUD 1.0 COMMANDS ==========

        // Toggle debug HUD visibility
        window.toggleSynergyDebug = function () {
            if (!window.game || !window.game.synergyDebugHUD) {
                console.warn('⚠ SynergyRecommendationDebugHUD not available');
                return;
            }

            window.game.synergyDebugHUD.toggle();
            const state = window.game.synergyDebugHUD.visible;
            console.log(`✓ Synergy Debug HUD toggled to ${state ? 'VISIBLE' : 'HIDDEN'}`);
        };

        // Show debug HUD
        window.showSynergyDebug = function () {
            if (window.game && window.game.synergyDebugHUD) {
                window.game.synergyDebugHUD.show();
                console.log('✓ Synergy Debug HUD shown');
            } else {
                console.warn('⚠ SynergyRecommendationDebugHUD not available');
            }
        };

        // Hide debug HUD
        window.hideSynergyDebug = function () {
            if (window.game && window.game.synergyDebugHUD) {
                window.game.synergyDebugHUD.hide();
                console.log('✓ Synergy Debug HUD hidden');
            } else {
                console.warn('⚠ SynergyRecommendationDebugHUD not available');
            }
        };

        // Get debug HUD statistics
        window.getSynergyDebugStats = function () {
            if (!window.game || !window.game.synergyDebugHUD) {
                console.warn('⚠ SynergyRecommendationDebugHUD not available');
                return;
            }

            const stats = window.game.synergyDebugHUD.getStats();
            console.group('⚡ Synergy Debug HUD Statistics');
            console.log('HUD Visible:', stats.hudVisible ? '✓ YES' : '✗ NO');
            console.log('Refresh Interval:', stats.hudRefreshInterval + 'ms');
            console.log('Recommendation Count:', stats.recommendationCount);
            console.log('---');
            console.log('AI Stats:', stats.aiStats);
            console.log('Automation Stats:', stats.automationStats);
            console.groupEnd();
        };

        // Set debug HUD refresh interval
        window.setSynergyDebugRefresh = function (ms) {
            if (!window.game || !window.game.synergyDebugHUD) {
                console.warn('⚠ SynergyRecommendationDebugHUD not available');
                return;
            }

            if (typeof ms !== 'number' || ms < 100) {
                console.warn('⚠ Refresh interval must be >= 100ms');
                return;
            }

            window.game.synergyDebugHUD.setRefreshInterval(ms);
            console.log(`✓ Synergy Debug HUD refresh interval set to ${ms}ms`);
        };

        console.log('✓ SynergyRecommendationDebugHUD1_0 registered');
        console.log('  Commands: toggleSynergyDebug() | showSynergyDebug() | hideSynergyDebug() | getSynergyDebugStats()');
        console.log('  Control: setSynergyDebugRefresh(ms)');

        // ========== LINK QUALITY PREDICTOR 1.0 DEBUG COMMANDS ==========

        const getDebugNodes = () => window.game?.aiNodes?.nodes || [];
        const findDebugNode = (nodeName) => {
            const nodes = getDebugNodes();
            const lowered = String(nodeName || '').toLowerCase();
            return nodes.find((node) =>
                (node.userData?.code || '').toLowerCase() === lowered ||
                (node.userData?.name || '').toLowerCase() === lowered ||
                (node.name || '').toLowerCase() === lowered
            ) || null;
        };

        // Compute quality for two nodes and explain
        window.computeLinkQuality = function (nodeNameA, nodeNameB) {
            if (!window.game || !window.game.linkQualityPredictor) {
                console.warn('⚠ LinkQualityPredictor not available');
                return;
            }

            // Resolve from the canonical AI node registry instead of traversing the scene graph.
            const nodeA = findDebugNode(nodeNameA);
            const nodeB = findDebugNode(nodeNameB);

            if (!nodeA || !nodeB) {
                console.warn('⚠ Could not find both nodes. Use: computeLinkQuality("NODE_CODE_1", "NODE_CODE_2")');
                return;
            }

            const result = window.game.linkQualityPredictor.computeQuality(nodeA, nodeB);
            console.group('🔍 Link Quality Analysis');
            console.log('Quality Score:', `${result.quality}/100`);
            console.log('Explanation:', result.explanation.reason);
            console.log('Categories:', result.explanation.categories);
            console.log('Factors:', result.factors);
            console.log('Rationale:', result.explanation.factors);
            console.log('Execution Time:', result.executionMs.toFixed(2) + 'ms');
            console.groupEnd();
        };

        // Test quality matrix
        window.testQualityMatrix = function () {
            if (!window.game || !window.game.linkQualityPredictor) {
                console.warn('⚠ LinkQualityPredictor not available');
                return;
            }

            console.group('🧪 Link Quality Matrix Test');
            const predictor = window.game.linkQualityPredictor;
            
            // Find diverse nodes from the canonical AI node registry.
            const allNodes = getDebugNodes().filter((node) => !!node?.userData?.isAINode);

            if (allNodes.length < 2) {
                console.warn('Not enough nodes to test');
                console.groupEnd();
                return;
            }

            // Test first few pairs
            const testPairs = Math.min(5, allNodes.length - 1);
            for (let i = 0; i < testPairs; i++) {
                const nodeA = allNodes[i];
                const nodeB = allNodes[i + 1];
                const result = predictor.computeQuality(nodeA, nodeB);
                
                console.log(`${i + 1}. ${nodeA.userData?.code || 'NODE'} → ${nodeB.userData?.code || 'NODE'}: ${result.quality}% (${result.explanation.reason})`);
            }

            console.groupEnd();
        };

        // Test random candidates
        window.testRandomCandidates = function () {
            if (!window.game || !window.game.linkQualityPredictor) {
                console.warn('⚠ LinkQualityPredictor not available');
                return;
            }

            console.group('🎲 Random Candidate Test');
            const predictor = window.game.linkQualityPredictor;
            
            const allNodes = getDebugNodes().filter((node) => !!node?.userData?.isAINode);

            if (allNodes.length < 2) {
                console.warn('Not enough nodes');
                console.groupEnd();
                return;
            }

            // Generate random pairs
            const candidates = [];
            for (let i = 0; i < 5; i++) {
                const a = Math.floor(Math.random() * allNodes.length);
                let b = Math.floor(Math.random() * allNodes.length);
                while (b === a) b = Math.floor(Math.random() * allNodes.length);
                
                candidates.push({ nodeA: allNodes[a], nodeB: allNodes[b] });
            }

            const evaluated = predictor.evaluateCandidates(candidates);
            console.log('Top 5 Random Candidates (by quality):');
            evaluated.forEach((c, i) => {
                console.log(`${i + 1}. ${c.nodeA.userData?.code || 'A'} → ${c.nodeB.userData?.code || 'B'}: ${c.quality}% ✓`);
            });

            console.groupEnd();
        };

        // Get quality predictor stats
        window.getQualityStats = function () {
            if (!window.game || !window.game.linkQualityPredictor) {
                console.warn('⚠ LinkQualityPredictor not available');
                return;
            }

            const stats = window.game.linkQualityPredictor.getStats();
            console.group('📊 Link Quality Predictor Statistics');
            console.log('Total Evaluations:', stats.totalEvaluations);
            console.log('Average Quality:', stats.averageQuality + '%');
            console.log('Excellent Matches:', stats.excellentCount);
            console.log('Good Matches:', stats.goodCount);
            console.log('Fair Matches:', stats.fairCount);
            console.log('Poor Matches:', stats.poorCount);
            console.groupEnd();
        };

        // Set automation quality threshold
        window.setQualityThreshold = function (threshold) {
            if (!window.game || !window.game.linkQualityPredictor) {
                console.warn('⚠ LinkQualityPredictor not available');
                return;
            }

            if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
                console.warn('⚠ Threshold must be 0-100');
                return;
            }

            window.game.linkQualityPredictor.setAutomationThreshold(threshold);
            console.log(`✓ Quality threshold for automation set to ${threshold}`);
        };

        console.log('✓ LinkQualityPredictor1_0 registered');
        console.log('  Commands: computeLinkQuality(nodeA, nodeB) | testQualityMatrix() | testRandomCandidates() | getQualityStats()');
        console.log('  Control: setQualityThreshold(0-100)');

        // [Session 144+] Node Linked Aura System Commands
        window.enableNodeAuras = () => {
            if (this.nodeAuraSystem) {
                this.nodeAuraSystem.setEnabled(true);
            } else {
                console.warn('⚠ Node Aura System not initialized');
            }
        };
        
        
        window.disableNodeAuras = () => {
            if (this.nodeAuraSystem) {
                this.nodeAuraSystem.setEnabled(false);
            } else {
                console.warn('⚠ Node Aura System not initialized');
            }
        };
        
        window.toggleNodeAuraDebug = () => {
            if (this.nodeAuraSystem) {
                const debugMode = this.nodeAuraSystem.toggleDebug();
                console.log(`[NodeAura] Debug mode: ${debugMode ? 'ON (wireframe + bounds)' : 'OFF'}`);
                return debugMode;
            } else {
                console.warn('⚠ Node Aura System not initialized');
                return false;
            }
        };
        
        window.nodeAuraStatus = () => {
            if (this.nodeAuraSystem) {
                const status = this.nodeAuraSystem.getStatus();
                console.group('🌀 Node Linked Aura System Status');
                console.log('Enabled:', status.enabled);
                console.log('Active Auras:', status.activeAuras);
                console.log('Active Boosts (Link Spikes):', status.activeSpikes);
                console.log('Corrupted Auras:', status.corruptedAuras, '(Max influence:', status.maxCorruptionInfluence + ')');
                console.log('Harmonized Auras:', status.harmonizedAuras, '(Max stabilization:', status.maxHarmonyStabilization + ')');
                console.log('Last Update Time:', status.lastUpdateTime);
                console.log('Avg Update Time:', status.avgUpdateTime);
                console.log('Debug Mode:', status.debugMode);
                console.groupEnd();
                return status;
            } else {
                console.warn('⚠ Node Aura System not initialized');
                return null;
            }
        };
        
        console.log('\n🌀 Node Linked Aura System Commands:');
        console.log('  - enableNodeAuras() — Enable living auras on linked nodes');
        console.log('  - disableNodeAuras() — Disable aura system');
        console.log('  - toggleNodeAuraDebug() — Toggle wireframe debug view');
        console.log('  - nodeAuraStatus() — Show system status and metrics');
    }
}

// ============================================================================
// [UTILITY] Node identity helpers (debug-only, behavior-preserving)
// ============================================================================
function getNodeIdentity(node) {
    if (!node) return null;
    const ud = node.userData || {};
    return ud.id || ud.nodeId || node.uuid || null;
}

function debugNodeIdentity(node) {
    if (!node) {
        console.log('[debugNodeIdentity] node is null/undefined');
        return null;
    }
    const ud = node.userData || {};
    const chosen = getNodeIdentity(node);
    console.log('[debugNodeIdentity]', {
        id: ud.id,
        nodeId: ud.nodeId,
        uuid: node.uuid,
        chosen
    });
    return chosen;
}

if (typeof window !== 'undefined') {
    window.getNodeIdentity = getNodeIdentity;
    window.debugNodeIdentity = debugNodeIdentity;

    // ========================================================================
    // [VFX DATA PIPELINE VERIFICATION] Runtime diagnostics
    // ========================================================================
    // Call: window.verifyVFXPipeline() to check data flow
    // Call: window.ATOMA_DEBUG_CASCADE = true to enable continuous logging
    window.verifyVFXPipeline = function() {
        const game = window.game;
        if (!game) {
            console.error('[verifyVFXPipeline] window.game not available');
            return null;
        }

        const links = game.linkingSystem?.links || [];
        const nodes = game.aiNodes?.nodes || [];
        const results = {
            timestamp: new Date().toISOString(),
            links: { total: links.length, withCascade: 0, withWaveField: 0, samples: [] },
            nodes: { total: nodes.length, withWaveField: 0, samples: [] },
            systems: {},
            events: {},
            issues: []
        };

        // Check link data
        links.forEach((link, i) => {
            const ud = link?.userData || {};
            const hasCascade = typeof ud.cascadeIntensity === 'number' && ud.cascadeIntensity > 0;
            const hasWaveField = ud.waveField && (ud.waveField.amplitude > 0 || ud.waveField.constructive > 0);

            if (hasCascade) results.links.withCascade++;
            if (hasWaveField) results.links.withWaveField++;

            if (i < 5 && (hasCascade || hasWaveField)) {
                results.links.samples.push({
                    id: link.id,
                    cascadeIntensity: ud.cascadeIntensity?.toFixed(4),
                    qualityScore: ud.quality?.score?.toFixed(1),
                    waveFieldAmplitude: ud.waveField?.amplitude?.toFixed(4),
                    waveFieldConstructive: ud.waveField?.constructive?.toFixed(4),
                    infectionIntensity: ud.cascadeInfection?.intensity?.toFixed(4)
                });
            }
        });

        // Check node data
        nodes.forEach((node, i) => {
            const ud = node?.userData || {};
            const hasWaveField = ud.waveField && (ud.waveField.amplitude > 0 || ud.waveField.constructive > 0);

            if (hasWaveField) results.nodes.withWaveField++;

            if (i < 3 && hasWaveField) {
                results.nodes.samples.push({
                    nodeId: ud.nodeId,
                    waveFieldAmplitude: ud.waveField?.amplitude?.toFixed(4),
                    waveFieldConstructive: ud.waveField?.constructive?.toFixed(4),
                    cascadeStrength: ud.cascadeStrength?.toFixed(4)
                });
            }
        });

        // Check systems
        results.systems = {
            linkQualityCalculator: {
                present: !!game.linkQualityCalculator,
                hasFrameScheduler: !!game.linkQualityCalculator?.frameScheduler
            },
            linkSemanticMetricsBridge: {
                present: !!game.linkSemanticMetricsBridge,
                enabled: game.linkSemanticMetricsBridge?.enabled
            },
            linkCascadeInfectionSystem: {
                present: !!game.linkCascadeInfectionSystem,
                stats: game.linkCascadeInfectionSystem?.stats || null
            },
            cascadeToWaveBridge: {
                present: !!game.cascadeToWaveBridge,
                enabled: game.cascadeToWaveBridge?.enabled,
                hasWaveEngine: !!game.cascadeToWaveBridge?.waveInterferenceEngine
            },
            waveInterferenceEngine: {
                present: !!game.waveInterferenceEngine,
                enabled: game.waveInterferenceEngine?.enabled,
                hasActiveBurst: game.waveInterferenceEngine?.isBurstActive?.() ?? false
            },
            waveParticleEmitter: {
                present: !!game.particleEmitter,
                thresholds: game.particleEmitter?.config ? {
                    constructive: game.particleEmitter.config.constructiveThreshold,
                    destructive: game.particleEmitter.config.destructiveThreshold,
                    standing: game.particleEmitter.config.standingWaveThreshold
                } : null
            }
        };

        // Detect issues
        if (results.links.total > 0 && results.links.withCascade === 0) {
            results.issues.push('NO_LINKS_WITH_CASCADE_INTENSITY - LinkSemanticMetricsBridge may not be running');
        }
        if (results.links.withCascade > 0 && results.links.withWaveField === 0) {
            results.issues.push('CASCADE_EXISTS_BUT_NO_WAVEFIELD - LinkCascadeInfectionSystem may not be writing waveField');
        }
        if (!results.systems.linkQualityCalculator?.present) {
            results.issues.push('LINK_QUALITY_CALCULATOR_MISSING');
        }
        if (!results.systems.waveInterferenceEngine?.present) {
            results.issues.push('WAVE_INTERFERENCE_ENGINE_MISSING - CascadeToWaveBridge will use fallback');
        }
        if (results.systems.waveParticleEmitter?.thresholds) {
            const t = results.systems.waveParticleEmitter.thresholds;
            if (t.constructive > 0.15 || t.destructive > 0.15 || t.standing > 0.2) {
                results.issues.push(`HIGH_THRESHOLDS - may block emission (c:${t.constructive}, d:${t.destructive}, s:${t.standing})`);
            }
        }

        // Print summary
        console.log('%c[VFX PIPELINE VERIFICATION]', 'color: #00ff00; font-weight: bold; font-size: 14px;');
        console.log('Links:', results.links);
        console.log('Nodes:', results.nodes);
        console.log('Systems:', results.systems);
        if (results.issues.length > 0) {
            console.log('%cIssues:', 'color: #ff6600; font-weight: bold;', results.issues);
        } else {
            console.log('%cNo issues detected', 'color: #00ff00;');
        }

        return results;
    };

    // Track cascade.hop events
    window._cascadeHopCount = 0;
    window._cascadeHopLastSecond = 0;
    window._cascadeHopStartTime = Date.now();

    window.getCascadeHopRate = function() {
        const elapsed = (Date.now() - window._cascadeHopStartTime) / 1000;
        return {
            total: window._cascadeHopCount || 0,
            elapsed: elapsed.toFixed(1) + 's',
            rate: ((window._cascadeHopCount || 0) / Math.max(1, elapsed)).toFixed(2) + '/s'
        };
    };

    // Quick data check - call from console
    window.checkCascadeData = function() {
        const game = window.game;
        if (!game) return 'game not ready';

        const links = game.linkingSystem?.links || [];
        const samples = links.slice(0, 5).map(l => ({
            id: l?.id?.slice(0, 8),
            cascade: l?.userData?.cascadeIntensity?.toFixed(3) ?? 'null',
            waveAmp: l?.userData?.waveField?.amplitude?.toFixed(3) ?? 'null',
            quality: l?.userData?.quality?.score?.toFixed(0) ?? 'null'
        }));

        const stats = {
            totalLinks: links.length,
            withCascade: links.filter(l => (l?.userData?.cascadeIntensity || 0) > 0).length,
            withWaveField: links.filter(l => (l?.userData?.waveField?.amplitude || 0) > 0).length,
            cascadeHops: window._cascadeHopCount || 0,
            samples
        };

        console.table(samples);
        console.log('Stats:', stats);
        return stats;
    };
}

// ============================================================================
// [HUD SAFETY] REMOVE LEGACY AUTOMATION HUD (UI-only cleanup)
// ============================================================================





// ============================================================================
// [BOOT] START GAME INSTANCE
// ============================================================================
let atomaGameInstance = null;

export function startAtomaGame(options = {}) {
    if (atomaGameInstance) {
        return atomaGameInstance;
    }

    atomaGameInstance = new AtomaGame(options);
    return atomaGameInstance;
}

if (window.__ATOMA_SKIP_AUTO_BOOT !== true) {
    startAtomaGame();
}
