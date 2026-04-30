/**
 * FXDebugSandbox.js
 * ============================================================================
 * DEBUG SANDBOX FOR VFX SYSTEMS
 *
 * ⚠️ NODE FX DEBUG HUD - Enable/disable individual node-related FX systems.
 *
 * Provides console-accessible testing interface for all VFX systems.
 * Usage (after enabling):
 *   FX.init(scene, renderer)  - Initialize sandbox
 *   FX.spawn.<system>()      - Spawn specific effect
 *   FX.spawnAll()            - Spawn all effects
 *   FX.clear()               - Clear all spawned effects
 *
 * @author ATOMA VFX Debug Assistant
 * @version 1.0.0
 */

// ============================================================================
// VFX SYSTEM IMPORTS
// ============================================================================

// DEBUG SANDBOX IS DISABLED AND IMPORTS ARE COMMENTED OUT
// to prevent 404 load failures for missing debug modules when the sandbox
// is not in active use.

// import { LinkTrailParticleSystem } from './LinkTrailParticleSystem.js';
// import { WaveParticleEmitter_v1 } from './WaveParticleEmitter_v1.js';
// import { HealingParticleSystem_Session136 } from './HealingParticleSystem_Session136.js';
// import { CascadeParticleSystem_Session120 } from './CascadeParticleSystem_Session120.js';
// Cascade particle emission boost and color tinting are now integrated into CascadeParticleSystem_Session120.
// import { CascadingRuptureSystem } from './CascadingRuptureSystem.js';
// import { CascadeResonanceWaveVisualization_Session146 } from './CascadeResonanceWaveVisualization_Session146.js';
// import { ResonanceCascadeVisualization_Session117B } from './ResonanceCascadeVisualization_Session117B.js';

// import { WaveInterferenceEngine_v1 } from './WaveInterferenceEngine_v1.js';
// import { WaveShaderBridge_v1 } from './WaveShaderBridge_v1.js';
// import { WaveShaderMaterialPatch_v1 } from './WaveShaderMaterialPatch_v1.js';
// import { WaveTravelShaderPack_v1 } from './WaveTravelShaderPack_v1.js';
// import { WaveDynamicsShaderPack_v1 } from './WaveDynamicsShaderPack_v1.js';
// import { SynergyTravelingWaveFX_v1 } from './SynergyTravelingWaveFX_v1.js';
// import { StandingWaveOscillationTrapSystem_Session130 } from './StandingWaveOscillationTrapSystem_Session130.js';
// import { StandingWaveVisualRenderer_Session131 } from './StandingWaveVisualRenderer_Session131.js';
// import { WaveInterferencePatternSystem_Session132 } from './WaveInterferencePatternSystem_Session132.js';

// import { ResonanceEchoTrailSystem } from './ResonanceEchoTrailSystem.js';

// import { HarmonicResonanceCoupling_v1 } from './HarmonicResonanceCoupling_v1.js';
// import { HarmonicResonanceFeedbackSystem } from './HarmonicResonanceFeedbackSystem.js';
// import { ResonanceFeedback_v1 } from './ResonanceFeedback_v1.js';
// import { CompositeGlyphResonanceFeedback } from './CompositeGlyphResonanceFeedback.js';
// import { HarmonicNodeResonanceHalos } from './HarmonicNodeResonanceHalos.js';
// import { HarmonicSyncEffectApplier } from './HarmonicSyncEffectApplier.js';

// import { InterferenceEffectApplier } from './InterferenceEffectApplier.js';
// import { NodeInterferenceManager } from './NodeInterferenceManager.js';

// import { LinkBeadTrailSystem } from './LinkBeadTrailSystem.js';
// import { LinkSparkSystem } from './LinkSparkSystem.js';
// import { LinkDirectionalStreaks } from './LinkDirectionalStreaks.js';
// import { AnimatedLinkFlow } from './AnimatedLinkFlow.js';

// import { LinkCorruptionParticleSystem } from './LinkCorruptionParticleSystem.js';
// import { LinkHealingParticleSystem } from './LinkHealingParticleSystem.js';
// import { LinkBeadSystem } from './LinkBeadSystem.js';

// ============================================================================
// SANDBOX CORE
// ============================================================================

const FX_DEBUG_STATE_KEY = 'atoma.fxDebugSandbox.nodeFxStates.v2';
const FX_DEBUG_PATCH_SYMBOL = Symbol('fxDebugSandboxPatches');

class FXDebugSandbox {
  constructor() {
    this.scene = null;
    this.renderer = null;
    this.activeSystems = new Map(); // name -> { system, updateFn, disposeFn }
    this.initialized = false;
    this.hudVisible = false;
    this.hudRoot = null;
    this.hudList = null;
    this._keyHandler = null;
    this._systemRegistry = [];
    this._registryIndex = new Map();
    this._persistedStates = this._loadPersistedStates();
    this._syncTimer = null;
    this._syncIntervalMs = 1000;
  }

  /**
   * Initialize sandbox with Three.js scene and renderer
   */
  init(scene, renderer = null) {
    this.scene = scene;
    this.renderer = renderer;
    this.initialized = true;
    this._installNodeFxRegistry();
    this._ensureHud();
    this._bindHotkey();
    this._startSyncLoop();
    console.log('[FXDebugSandbox] Initialized with scene:', scene);
    return this;
  }

  /**
   * Check if sandbox is initialized
   */
  checkInit() {
    if (!this.initialized || !this.scene) {
      console.error('[FXDebugSandbox] Not initialized. Call FX.init(scene) first.');
      return false;
    }
    return true;
  }

  /**
   * Register an active system for tracking and cleanup
   */
  register(name, system, updateFn = null, disposeFn = null) {
    this.activeSystems.set(name, {
      system,
      updateFn: updateFn || (system.update ? (dt) => system.update(dt) : null),
      disposeFn: disposeFn || (system.dispose ? () => system.dispose() : null)
    });
    console.log(`[FXDebugSandbox] Registered: ${name}`);
    return system;
  }

  /**
   * Unregister and dispose a system
   */
  unregister(name) {
    const entry = this.activeSystems.get(name);
    if (entry) {
      if (entry.disposeFn) {
        entry.disposeFn();
      }
      this.activeSystems.delete(name);
      console.log(`[FXDebugSandbox] Unregistered: ${name}`);
    }
  }

  /**
   * Clear all spawned effects
   */
  clear() {
    console.log(`[FXDebugSandbox] Clearing ${this.activeSystems.size} effects...`);
    for (const [name] of this.activeSystems) {
      this.unregister(name);
    }
    console.log('[FXDebugSandbox] All effects cleared.');
  }

  /**
   * Update all active systems (call from main loop)
   */
  update(dt) {
    for (const [name, entry] of this.activeSystems) {
      if (entry.updateFn) {
        entry.updateFn(dt);
      }
    }
  }

  /**
   * List all active systems
   */
  listActive() {
    console.log('[FXDebugSandbox] Active systems:', Array.from(this.activeSystems.keys()));
  }

  _installNodeFxRegistry() {
    this._syncNodeFxRegistry(true);
  }

  _loadPersistedStates() {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    try {
      const raw = window.localStorage.getItem(FX_DEBUG_STATE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  _savePersistedStates() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(FX_DEBUG_STATE_KEY, JSON.stringify(this._persistedStates || {}));
    } catch {
      // Ignore storage failures in private mode / quota cases.
    }
  }

  _startSyncLoop() {
    if (typeof window === 'undefined' || this._syncTimer) return;
    this._syncTimer = window.setInterval(() => {
      this._syncNodeFxRegistry(false);
      if (this.hudVisible) this._refreshHud();
    }, this._syncIntervalMs);
  }

  _syncNodeFxRegistry(forceRefresh = false) {
    this._systemRegistry = this._buildNodeFxRegistry();
    this._registryIndex = new Map(this._systemRegistry.map((entry) => [entry.id, entry]));
    this._applyPersistedStatesToRegistry();
    if (forceRefresh && this.hudVisible) {
      this._refreshHud();
    }
    return this._systemRegistry;
  }

  _buildNodeFxRegistry() {
    const manual = this._buildManualNodeFxRegistry();
    const discovered = this._discoverNodeFxDefinitions();
    const merged = new Map();

    for (const entry of [...manual, ...discovered]) {
      if (!entry?.id) continue;
      if (this._isLinkRelatedEntry(entry)) continue;
      if (merged.has(entry.id)) continue;
      merged.set(entry.id, this._normalizeRegistryEntry(entry));
    }

    return Array.from(merged.values()).sort((a, b) => {
      const groupA = String(a.group || '');
      const groupB = String(b.group || '');
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      return String(a.label || a.id).localeCompare(String(b.label || b.id));
    });
  }

  _buildManualNodeFxRegistry() {
    return [
      { id: 'nodeMicroEvents', label: 'Node Micro Events', group: 'Node Core', paths: ['nodeMicroEvents'], hardDisabled: true, muteMethods: ['update', 'triggerMicroEvent', 'triggerSelectionCascade'] },
      { id: 'evolutionManager', label: 'Evolution Manager', group: 'Node Core', paths: ['evolutionManager'], hardDisabled: true, muteMethods: ['update'] },
      { id: 'personalityShaderEffects', label: 'Personality Shader Effects', group: 'Node Core', paths: ['personalityShaderEffects'], hardDisabled: true, muteMethods: ['registerNodeMaterial', 'registerLinkMaterial', 'applyDefaultNodeProfile', 'applyDefaultLinkProfile'] },
      { id: 'advancedShaderFX', label: 'Advanced Node Shader FX', group: 'Node Core', paths: ['advancedShaderFX'], hardDisabled: true, muteMethods: ['update', 'setEnabled'] },
      { id: 'personalityFX', label: 'Safe Node Personality FX', group: 'Node Core', paths: ['personalityFX'], hardDisabled: true, muteMethods: ['update'] },
      { id: 'corruptionFeedback', label: 'Corruption Feedback', group: 'Corruption', paths: ['corruptionFeedback'], hardDisabled: true, muteMethods: ['update', 'displayCorruptionSeed', 'displayCascadeWarning', 'displayHarmonyPulse'] },
      { id: 'phase5CascadePropagationVisuals', label: 'Cascade Propagation Visuals', group: 'Cascade', paths: ['phase5CascadePropagationVisuals', 'cascadePropagationVisuals'], hardDisabled: true, muteMethods: ['update', 'triggerCascade'] },
      { id: 'harmonicRecovery', label: 'Harmonic Recovery', group: 'Healing / Rupture', paths: ['harmonicRecovery'], hardDisabled: true, muteMethods: ['update', 'rebind'] },
      { id: 'resonanceRupture', label: 'Resonance Rupture', group: 'Healing / Rupture', paths: ['resonanceRupture'], muteMethods: ['update', '_triggerRupture', '_triggerNodeReactions'] },
      { id: 'healingParticles', label: 'Healing Particles', group: 'Healing / Rupture', paths: ['healingParticles'], muteMethods: ['update', 'spawnParticle', 'emitHealingTrail', 'emitHealingBurst'] },
      { id: 'harmonicHealing', label: 'Harmonic Healing', group: 'Healing / Rupture', paths: ['harmonicHealing'], muteMethods: ['update', 'rebind'] },
      { id: 'cascadingRuptures', label: 'Cascading Ruptures', group: 'Healing / Rupture', paths: ['cascadingRuptures'], muteMethods: ['update', 'triggerVisualEffect', 'enable', 'disable'] },
      { id: 'standingWaveTrap', label: 'Standing Wave Trap', group: 'Waves / Resonance', paths: ['standingWaveTrap', 'standingWaveTrapSystem'], muteMethods: ['update', 'setup', 'rebind'] },
      { id: 'standingWaveRenderer', label: 'Standing Wave Renderer', group: 'Waves / Resonance', paths: ['standingWaveRenderer'], muteMethods: ['update', 'setup', 'rebind'] },
      { id: 'waveInterference', label: 'Wave Interference Patterns', group: 'Waves / Resonance', paths: ['waveInterference', 'wavePatternSystem'], muteMethods: ['update', 'setup', 'rebind'] },
      { id: 'waveInterferenceEngine', label: 'Wave Interference Engine', group: 'Waves / Resonance', paths: ['waveInterferenceEngine'], muteMethods: ['update'] },
      { id: 'waveParticleEmitter', label: 'Wave Particle Emitter', group: 'Waves / Particles', paths: ['particleEmitter', 'waveParticleEmitter'], muteMethods: ['update'] },
      { id: 'synergyTravelingWaveFX', label: 'Synergy Traveling Wave FX', group: 'Waves / Resonance', paths: ['synergyTravelingWaveFX'], muteMethods: ['update'] },
      { id: 'waveShaderBridge', label: 'Wave Shader Bridge', group: 'Waves / Resonance', paths: ['waveShaderBridge'], muteMethods: ['update', 'registerNodeMaterial', 'registerLinkMaterial'] },
      { id: 'waveShaderMaterialPatch', label: 'Wave Shader Material Patch', group: 'Waves / Resonance', paths: ['waveShaderMaterialPatch'], muteMethods: ['patch', 'update'] },
      { id: 'waveTravelShaderPack', label: 'Wave Travel Shader Pack', group: 'Waves / Resonance', paths: ['waveTravelShaderPack'], muteMethods: ['update'] },
      { id: 'waveDynamicsShaderPack', label: 'Wave Dynamics Shader Pack', group: 'Waves / Resonance', paths: ['waveDynamicsShaderPack'], muteMethods: ['update', 'applyToNode', 'applyToMaterial'] },
      { id: 'resonanceEchoTrailSystem', label: 'Resonance Echo Trail System', group: 'Waves / Resonance', paths: ['resonanceEchoTrailSystem', 'resonanceEchoTrails'], muteMethods: ['update', 'spawnEchoTrail', 'spawnEcho'] },
      { id: 'harmonicResonanceFeedbackSystem', label: 'Harmonic Resonance Feedback', group: 'Resonance', paths: ['harmonicResonanceFeedbackSystem', 'harmonicResonance'], muteMethods: ['update', 'enable', 'disable'] },
      { id: 'harmonicResonanceCoupling', label: 'Harmonic Resonance Coupling', group: 'Resonance', paths: ['harmonicResonanceCoupling'], muteMethods: ['update'] },
      { id: 'harmonicHubAuraSystem', label: 'Harmonic Hub Aura System', group: 'Resonance', paths: ['harmonicHubAuraSystem'], muteMethods: ['update'] },
      { id: 'harmonicInfluencePropagation', label: 'Harmonic Influence Propagation', group: 'Resonance', paths: ['harmonicInfluencePropagation'], muteMethods: ['update'] },
      { id: 'harmonicPhaseSynchronization', label: 'Harmonic Phase Synchronization', group: 'Resonance', paths: ['harmonicPhaseSynchronization'], muteMethods: ['update'] },
      { id: 'harmonicCascadeAmplification', label: 'Harmonic Cascade Amplification', group: 'Resonance', paths: ['harmonicCascadeAmplification'], muteMethods: ['update'] },
      { id: 'harmonicNodeResonanceHalos', label: 'Harmonic Node Resonance Halos', group: 'Resonance', paths: ['harmonicNodeResonanceHalos'], muteMethods: ['update', 'triggerRecoveryWave'] },
      { id: 't2CorruptionVisualIntegration', label: 'T2 Corruption Visual Integration', group: 'Corruption', paths: ['t2CorruptionVisualIntegration'], muteMethods: ['update', 'triggerCorruptionPulse', 'triggerParticleBurst', 'displayCascadeWarning', 'displayCorruptionSeed'] },
      { id: 't2HarmonyVisualConsumer', label: 'T2 Harmony Visual Consumer', group: 'Harmony', paths: ['t2HarmonyVisualConsumer'], muteMethods: ['update', 'setEnabled'] },
      { id: 'adaptiveGlyphRendering', label: 'Adaptive Glyph Rendering', group: 'Glyph / Overlay', paths: ['adaptiveGlyphRendering'], muteMethods: ['update', 'setEnabled'] },
      { id: 'glyphLayer4', label: 'Glyph Layer 4', group: 'Glyph / Overlay', paths: ['glyphLayer4'], muteMethods: ['update', 'enable', 'disable', 'cleanup'] },
      { id: 'glyphFusionOverlay', label: 'Glyph Fusion Overlay', group: 'Glyph / Overlay', paths: ['glyphFusionOverlay'], muteMethods: ['update'] },
      { id: 'nodeShaderActivation', label: 'Node Shader Activation', group: 'Glyph / Overlay', paths: ['nodeShaderActivation'], muteMethods: ['update'] },
      { id: 'nodeAuraSystem', label: 'Node Aura System', group: 'Aura / Visual', paths: ['nodeAuraSystem'], muteMethods: ['update'] },
      { id: 'nodeAuraRenderer', label: 'Node Aura Renderer', group: 'Aura / Visual', paths: ['nodeAuraRenderer'], muteMethods: ['update'] },
      { id: 'metricsVisualFX', label: 'Metrics Visual FX', group: 'Metrics / Overlay', paths: ['metricsVisualFX'], muteMethods: ['update'] },
      { id: 'nodeInspectOverlay', label: 'Node Inspect Overlay', group: 'Metrics / Overlay', paths: ['nodeInspectOverlay'], muteMethods: ['update', 'enable', 'disable', 'hideOverlay', 'showOverlay'] },
      { id: 'visualNetworkTimeElasticity', label: 'Visual Network Time Elasticity', group: 'Metrics / Overlay', paths: ['visualNetworkTimeElasticity'], muteMethods: ['update'] },
      { id: 'cascadeVisualizer', label: 'Cascade Visualizer', group: 'Cascade', paths: ['cascadeVisualizer', 'synergyCascadeVisualizer'], muteMethods: ['update', 'triggerCascade'] },
      { id: 'linkCascadeInfectionSystem', label: 'Link Cascade Infection', group: 'Cascade', paths: ['linkCascadeInfectionSystem'], muteMethods: ['update'] },
      { id: 'linkDegradationSystem', label: 'Link Degradation', group: 'Cascade', paths: ['linkDegradationSystem'], muteMethods: ['update'] },
      { id: 'linkCollapseSystem', label: 'Link Collapse', group: 'Cascade', paths: ['linkCollapseSystem'], muteMethods: ['update'] },
      { id: 'linkCollapseEventFX', label: 'Link Collapse Event FX', group: 'Cascade', paths: ['linkCollapseEventFX'], muteMethods: ['update'] },
      { id: 'corruptionVisualFX', label: 'Corruption Visual FX', group: 'Corruption', paths: ['corruptionVisualFX'], muteMethods: ['update'] },
      { id: 'legendaryLinkFX', label: 'Legendary Link FX', group: 'Aura / Visual', paths: ['legendaryLinkFX'], muteMethods: ['update'] },
      { id: 'dreamDepthPack', label: 'Dream Depth Pack', group: 'Environment', paths: ['dreamDepthPack', 'safeDreamDepthPack'], muteMethods: ['update'] },
      { id: 'dreamDepthEffects', label: 'Dream Depth Effects', group: 'Environment', paths: ['dreamDepthEffects'], muteMethods: ['update'] },
      { id: 'ambientEntityManager', label: 'Ambient Entity Manager', group: 'Environment', paths: ['ambientEntityManager'], muteMethods: ['update'] },
      { id: 'recursiveGlyphSignalSystem', label: 'Recursive Glyph Signal', group: 'Glyph / Overlay', paths: ['recursiveGlyphSignalSystem'], muteMethods: ['update'] },
      { id: 'safeEvolutionManager', label: 'Safe Evolution Manager', group: 'Node Core', paths: ['evolutionManager'], muteMethods: ['update'] },
      { id: 'networkFatigueSystem', label: 'Network Fatigue', group: 'Metrics / Overlay', paths: ['networkFatigueSystem'], muteMethods: ['update'] },
      { id: 'linkTrailParticles', label: 'Link Trail Particles', group: 'Waves / Particles', paths: ['linkTrailParticles'], muteMethods: ['update'] },
      { id: 'proceduralGlyphGenerator', label: 'Procedural Glyph Generator', group: 'Glyph / Overlay', paths: ['proceduralGlyphGenerator', 'proceduralHarmonicGlyphGenerator'], muteMethods: ['update'] },
      { id: 'glyphAnimationModulator', label: 'Glyph Animation Modulator', group: 'Glyph / Overlay', paths: ['glyphAnimationModulator'], muteMethods: ['update'] },
      { id: 'harmonicHubDebugger', label: 'Harmonic Hub Debugger', group: 'Debug', paths: ['harmonicHubDebugger'], muteMethods: ['update'] },
      { id: 'fxPerformance', label: 'FX Performance Controller', group: 'Performance', paths: ['fxPerformance', 'fxPerformanceController'], muteMethods: ['update'] },
      { id: 'visualStateBinder', label: 'Visual State Binder', group: 'Node Core', paths: ['visualStateBinder', 'nodeVisualStateBinder'], muteMethods: ['update', 'bindNode', 'unbindNode'] },
      { id: 'aiConsciousnessLayer', label: 'AI Consciousness Layer', group: 'AI / Orbit', paths: ['consciousnessLayer', 'aiConsciousnessLayer'], muteMethods: ['update'] },
      { id: 'linkSemanticPictogramSystem', label: 'Link Semantic Pictogram', group: 'Glyph / Orbit', paths: ['linkSemanticPictogramSystem'], muteMethods: ['update'] },
      { id: 'linkEnergyRingSystem', label: 'Link Energy Ring', group: 'Link FX', paths: ['linkEnergyRingSystem'], muteMethods: ['update'] },
      { id: 'cascadeResonanceWave', label: 'Cascade Resonance Wave', group: 'Waves / Resonance', paths: ['cascadeResonanceWave', 'cascadeResonanceWaveVisualization'], muteMethods: ['update'] },
      { id: 'resonanceCascadeVisualization', label: 'Resonance Cascade Visualization', group: 'Waves / Resonance', paths: ['resonanceCascadeVisualization', 'resonanceCascade'], muteMethods: ['update'] },
      { id: 'criticalNodeFailure', label: 'Critical Node Failure', group: 'Cascade', paths: ['criticalNodeFailure', 'criticalNodeFailureSystem'], muteMethods: ['update'] },
      { id: 'regionalEquilibrium', label: 'Regional Equilibrium', group: 'Resonance', paths: ['regionalEquilibrium', 'regionalEquilibriumFieldSystem'], muteMethods: ['update'] },
      { id: 'harmonicTopology', label: 'Harmonic Topology', group: 'Resonance', paths: ['harmonicTopology', 'harmonicTopologyLearningSystem'], muteMethods: ['update'] },
      { id: 'linkVisualMoodSystem', label: 'Link Visual Mood', group: 'Link FX', paths: ['linkVisualMoodSystem'], muteMethods: ['update'] },
      { id: 'stressVisualShaderSystem', label: 'Stress Visual Shader', group: 'Aura / Visual', paths: ['stressVisualShaderSystem'], muteMethods: ['update'] },
      { id: 'compositeGlyphGenerator', label: 'Composite Glyph Generator', group: 'Glyph / Overlay', paths: ['compositeGlyphGenerator'], muteMethods: ['update'] },
      { id: 'glyphFusionZoneManager', label: 'Glyph Fusion Zone', group: 'Glyph / Overlay', paths: ['glyphFusionZoneManager', 'glyphFusionZone'], muteMethods: ['update'] },
      { id: 'nodeInterferenceManager', label: 'Node Interference', group: 'Resonance', paths: ['nodeInterferenceManager'], muteMethods: ['update'] },
      { id: 'linkStateVisualLanguage', label: 'Link State Visual Language', group: 'Link FX', paths: ['linkStateVisualLanguage'], muteMethods: ['update'] },
      { id: 'nodeHarmonicManager', label: 'Node Harmonic Manager', group: 'Resonance', paths: ['nodeHarmonicManager'], muteMethods: ['update'] },
      { id: 'harmonicSyncEffectApplier', label: 'Harmonic Sync Effect', group: 'Resonance', paths: ['harmonicSyncEffectApplier', 'harmonicSyncEffect'], muteMethods: ['update'] }
    ];
  }

  _discoverNodeFxDefinitions() {
    const game = this._getGameRoot();
    if (!game) return [];

    const manualIds = new Set(this._buildManualNodeFxRegistry().map((entry) => entry.id));
    const include = /(node|evolution|rupture|healing|harmonic|resonance|cascade|wave|particle|corruption|stress|stability|glyph|aura|personality|adaptive|metrics|inspect)/i;
    const exclude = /(link|linking|bead|spark|directional|trail|runtime|scheduler|registry|authority|engine|controller|context)/i;
    const discovered = [];

    for (const [key, value] of Object.entries(game)) {
      if (manualIds.has(key)) continue;
      if (!value || typeof value !== 'object') continue;
      if (!include.test(key)) continue;
      if (exclude.test(key)) continue;
      discovered.push({
        id: key,
        label: this._humanizeIdentifier(key),
        group: this._guessGroupForIdentifier(key),
        paths: [key],
        muteMethods: ['update']
      });
    }

    return discovered;
  }

  _normalizeRegistryEntry(entry) {
    const paths = Array.isArray(entry.paths) && entry.paths.length > 0
      ? entry.paths
      : [entry.path || entry.id];

    return {
      id: String(entry.id),
      label: entry.label || this._humanizeIdentifier(entry.id),
      group: entry.group || this._guessGroupForIdentifier(entry.id),
      paths,
      muteMethods: Array.isArray(entry.muteMethods) ? entry.muteMethods : ['update'],
      hardDisabled: entry.hardDisabled === true,
      get: () => this._resolveEntrySystem(paths),
      getState: entry.getState || null,
      setState: entry.setState || null
    };
  }

  _getGameRoot() {
    if (typeof window === 'undefined') return null;
    return window.game || globalThis.game || null;
  }

  _resolveEntrySystem(paths) {
    const game = this._getGameRoot();
    if (!game) return null;
    for (const path of paths || []) {
      const resolved = this._resolvePath(game, path);
      if (resolved) return resolved;
    }
    return null;
  }

  _resolvePath(root, path) {
    if (!root || !path) return null;
    const parts = String(path).split('.');
    let current = root;
    for (const part of parts) {
      if (current == null) return null;
      current = current[part];
    }
    return current ?? null;
  }

  _humanizeIdentifier(identifier) {
    return String(identifier || '')
      .replace(/[_\.]+/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (m) => m.toUpperCase())
      .trim();
  }

  _guessGroupForIdentifier(identifier) {
    const id = String(identifier || '').toLowerCase();
    
    // AI / Orbit systems
    if (id.includes('orbit') || id.includes('consciousness') || id.includes('cluster')) return 'AI / Orbit';
    
    // Glyph / Orbit systems
    if (id.includes('semantic') || id.includes('pictogram')) return 'Glyph / Orbit';
    
    // Link FX systems
    if (id.includes('ring') || id.includes('energy') || id.includes('fracture')) return 'Link FX';
    
    // Node Core systems
    if (id.includes('evolution') || id.includes('node')) return 'Node Core';
    
    // Corruption systems
    if (id.includes('corruption')) return 'Corruption';
    
    // Healing / Rupture systems
    if (id.includes('rupture') || id.includes('healing') || id.includes('recovery') || id.includes('restore')) return 'Healing / Rupture';
    
    // Cascade / Wave systems
    if (id.includes('cascade')) return 'Cascade / Wave';
    if (id.includes('wave') || id.includes('particle')) return 'Waves / Particles';
    
    // Resonance systems
    if (id.includes('resonance') || id.includes('harmonic')) return 'Resonance';
    
    // Glyph / Overlay systems
    if (id.includes('glyph') || id.includes('aura') || id.includes('inspect') || id.includes('metrics') || id.includes('personality') || id.includes('shader')) return 'Glyph / Overlay';
    
    return 'Node FX';
  }
 

  _isLinkRelatedEntry(entry) {
    const text = `${entry?.id || ''} ${entry?.label || ''} ${entry?.group || ''}`.toLowerCase();
    return text.includes('link');
  }

  _applyPersistedStatesToRegistry() {
    for (const entry of this._systemRegistry) {
      const persisted = this._persistedStates?.[entry.id];
      if (persisted && typeof persisted.enabled === 'boolean') {
        this._applyEntryState(entry, persisted.enabled, { persist: false });
      } else {
        this._applyEntryState(entry, this._readCurrentEntryEnabled(entry), { persist: false });
      }
    }
  }

  _readCurrentEntryEnabled(entry) {
    const system = entry.get();
    if (!system) return false;
    if (typeof entry.getState === 'function') {
      try {
        const value = entry.getState(system);
        if (typeof value === 'boolean') return value;
      } catch {
        // ignore
      }
    }
    if (typeof system.enabled === 'boolean') return system.enabled;
    if (typeof system.active === 'boolean') return system.active;
    if (typeof system.isEnabled === 'function') {
      try { return !!system.isEnabled(); } catch { /* ignore */ }
    }
    if (system.config && typeof system.config.enabled === 'boolean') return system.config.enabled;
    return true;
  }

  _setBooleanState(system, enabled) {
    if (!system) return;
    if (typeof system.setEnabled === 'function') {
      try { system.setEnabled(enabled); } catch { /* ignore */ }
    }
    if (typeof system.enable === 'function' && typeof system.disable === 'function') {
      try { enabled ? system.enable() : system.disable(); } catch { /* ignore */ }
    }
    if (typeof system.enabled === 'boolean' || 'enabled' in system) {
      system.enabled = enabled;
    }
    if (typeof system.active === 'boolean' || 'active' in system) {
      system.active = enabled;
    }
    if (system.config && typeof system.config === 'object') {
      system.config.enabled = enabled;
    }
  }

  _patchMethods(system, entry, enabled) {
    if (!system) return;
    const methods = new Set(['update', ...(entry.muteMethods || [])]);
    const patchMap = system[FX_DEBUG_PATCH_SYMBOL] || (system[FX_DEBUG_PATCH_SYMBOL] = new Map());

    methods.forEach((methodName) => {
      const original = system[methodName];
      if (typeof original !== 'function') return;

      if (!enabled) {
        if (!patchMap.has(methodName)) {
          patchMap.set(methodName, original);
        }
        system[methodName] = function sandboxNoop() { return undefined; };
      } else if (patchMap.has(methodName)) {
        system[methodName] = patchMap.get(methodName);
        patchMap.delete(methodName);
      }
    });

    if (enabled && patchMap.size === 0) {
      try { delete system[FX_DEBUG_PATCH_SYMBOL]; } catch { /* ignore */ }
    }
  }

  _applyEntryState(entry, enabled, { persist = true } = {}) {
    const system = entry.get();
    if (!system) {
      if (persist) {
        this._persistedStates[entry.id] = {
          enabled: !!enabled,
          updatedAt: Date.now()
        };
        this._savePersistedStates();
      }
      return false;
    }

    if (typeof entry.setState === 'function') {
      try { entry.setState(system, enabled); } catch { /* ignore */ }
    }

    this._setBooleanState(system, enabled);
    this._patchMethods(system, entry, enabled);

    if (persist) {
      this._persistedStates[entry.id] = {
        enabled: !!enabled,
        updatedAt: Date.now()
      };
      this._savePersistedStates();
    }

    return true;
  }

  _getEntryRuntimeStatus(entry) {
    const system = entry.get();
    if (!system) {
      const persisted = this._persistedStates?.[entry.id];
      return {
        label: 'missing',
        enabled: typeof persisted?.enabled === 'boolean' ? persisted.enabled : false,
        system: null
      };
    }

    const persisted = this._persistedStates?.[entry.id];
    const enabled = typeof persisted?.enabled === 'boolean'
      ? persisted.enabled
      : this._readCurrentEntryEnabled(entry);

    if (entry.hardDisabled) {
      return { label: 'forced-off', enabled: false, system };
    }

    return {
      label: enabled ? 'active' : 'disabled',
      enabled: !!enabled,
      system
    };
  }

  _toggleEntry(entry, nextEnabled) {
    const ok = this._applyEntryState(entry, nextEnabled, { persist: true });
    if (this.hudVisible) this._refreshHud();
    return ok;
  }

  toggleNodeFxById(id, nextEnabled) {
    const entry = this._registryIndex?.get?.(id) || this._systemRegistry?.find?.((item) => item.id === id);
    if (!entry) return false;
    const persisted = this._persistedStates[entry.id]?.enabled;
    const next = typeof nextEnabled === 'boolean'
      ? nextEnabled
      : !(typeof persisted === 'boolean' ? persisted : this._readCurrentEntryEnabled(entry));
    const ok = this._applyEntryState(entry, next, { persist: true });
    if (this.hudVisible) this._refreshHud();
    return ok;
  }

  listNodeFxRegistry() {
    return Array.isArray(this._systemRegistry) ? [...this._systemRegistry] : [];
  }

  syncNodeFxRegistry(forceRefresh = false) {
    return this._syncNodeFxRegistry(forceRefresh);
  }

  _ensureHud() {
    if (typeof document === 'undefined' || this.hudRoot) return;

    const root = document.createElement('div');
    root.id = 'fx-debug-sandbox-hud';
    root.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:12px',
      'width:420px',
      'max-height:74vh',
      'overflow:auto',
      'background:rgba(10,14,22,0.94)',
      'border:1px solid rgba(120,160,220,0.35)',
      'color:#d6ebff',
      'font:12px/1.35 monospace',
      'z-index:2147483647',
      'display:none',
      'padding:10px'
    ].join(';');

    const header = document.createElement('div');
    header.textContent = 'NODE FX DEBUG SANDBOX';
    header.style.cssText = 'font-weight:700;margin-bottom:6px;letter-spacing:0.04em;';

    const summary = document.createElement('div');
    summary.id = 'fx-debug-sandbox-summary';
    summary.style.cssText = 'opacity:0.75;margin-bottom:8px;';

    const hint = document.createElement('div');
    hint.textContent = 'L toggles this panel. States persist in localStorage.';
    hint.style.cssText = 'opacity:0.7;margin-bottom:10px;';

    const list = document.createElement('div');
    list.id = 'fx-debug-sandbox-list';
    list.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    root.appendChild(header);
    root.appendChild(summary);
    root.appendChild(hint);
    root.appendChild(list);
    document.body.appendChild(root);

    this.hudRoot = root;
    this.hudSummary = summary;
    this.hudList = list;
    this._refreshHud();
  }

  _bindHotkey() {
    if (typeof window === 'undefined' || this._keyHandler) return;
    this._keyHandler = (event) => {
      if (event?.repeat) return;
      if (event?.code === 'KeyL') {
        this.toggleHud();
      }
    };
    window.addEventListener('keydown', this._keyHandler, true);
  }

  toggleHud(force) {
    const next = typeof force === 'boolean' ? force : !this.hudVisible;
    this.hudVisible = next;
    if (this.hudRoot) this.hudRoot.style.display = next ? 'block' : 'none';
    if (next) {
      this._syncNodeFxRegistry(true);
      this._refreshHud();
    }
    return next;
  }

  _refreshHud() {
    if (!this.hudList) return;
    this.hudList.innerHTML = '';

    const entries = this._systemRegistry || [];
    const grouped = new Map();
    let activeCount = 0;
    let disabledCount = 0;
    let forcedOffCount = 0;
    let missingCount = 0;

    for (const entry of entries) {
      const groupKey = entry.group || 'Node FX';
      const bucket = grouped.get(groupKey) || [];
      bucket.push(entry);
      grouped.set(groupKey, bucket);
    }

    const groupNames = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));

    groupNames.forEach((groupName) => {
      const groupEntries = grouped.get(groupName) || [];
      const header = document.createElement('div');
      header.style.cssText = [
        'position:sticky',
        'top:0',
        'z-index:1',
        'padding:4px 0 6px',
        'margin-top:2px',
        'background:linear-gradient(to bottom, rgba(10,14,22,0.98), rgba(10,14,22,0.82))',
        'color:#8fc2ff',
        'font-size:11px',
        'font-weight:700',
        'letter-spacing:0.05em',
        'text-transform:uppercase',
        'border-bottom:1px solid rgba(255,255,255,0.08)'
      ].join(';');
      const activeInGroup = groupEntries.filter((entry) => this._getEntryRuntimeStatus(entry).label === 'active').length;
      const disabledInGroup = groupEntries.filter((entry) => this._getEntryRuntimeStatus(entry).label === 'disabled').length;
      const forcedInGroup = groupEntries.filter((entry) => this._getEntryRuntimeStatus(entry).label === 'forced-off').length;
      const missingInGroup = groupEntries.filter((entry) => this._getEntryRuntimeStatus(entry).label === 'missing').length;
      header.textContent = `${groupName} · ${groupEntries.length} (${activeInGroup} active, ${disabledInGroup} disabled, ${forcedInGroup} forced-off, ${missingInGroup} missing)`;
      this.hudList.appendChild(header);

      groupEntries.forEach((entry) => {
        const status = this._getEntryRuntimeStatus(entry);
        if (status.label === 'active') activeCount += 1;
        else if (status.label === 'disabled') disabledCount += 1;
        else if (status.label === 'forced-off') forcedOffCount += 1;
        else missingCount += 1;

      const row = document.createElement('div');
      row.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:space-between',
        'gap:10px',
        'padding:6px 0',
        'border-bottom:1px solid rgba(255,255,255,0.08)'
      ].join(';');

      const left = document.createElement('div');
      left.style.cssText = 'display:flex;flex-direction:column;min-width:0;flex:1;';
      const name = document.createElement('div');
      name.textContent = entry.label;
      name.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      const meta = document.createElement('div');
      meta.textContent = `${entry.group || 'Node FX'} · ${status.label}`;
      meta.style.cssText = 'opacity:0.7;font-size:11px;';
      left.appendChild(name);
      left.appendChild(meta);

      const button = document.createElement('button');
      button.textContent = status.enabled ? 'off' : 'on';
      button.title = status.label === 'missing'
        ? 'System is not present yet. Toggle persists the desired state for later.'
        : status.label === 'forced-off'
          ? 'This system is hard-disabled in code. Toggle only persists state until the module becomes active again.'
          : 'Toggle runtime state';
      button.style.cssText = [
        'background:#101826',
        'color:#d6ebff',
        'border:1px solid rgba(120,160,220,0.35)',
        'padding:4px 10px',
        'font:inherit',
        'cursor:pointer',
        'min-width:48px'
      ].join(';');
      button.onclick = () => {
        this.toggleNodeFxById(entry.id);
      };
      if (status.label === 'missing') {
        button.style.opacity = '0.7';
      }

      row.appendChild(left);
      row.appendChild(button);
      this.hudList.appendChild(row);
      });
    });

    if (this.hudSummary) {
      this.hudSummary.textContent = `active ${activeCount} · disabled ${disabledCount} · forced-off ${forcedOffCount} · missing ${missingCount}`;
    }
  }
}

// ============================================================================
// SPAWN METHODS - PARTICLES
// ============================================================================

/**
 * Link Trail Particles - Organic particle trails along links
 */
FXDebugSandbox.prototype.spawnLinkTrailParticles = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning LinkTrailParticles...');
  const system = new LinkTrailParticleSystem(
    this.scene,
    config.maxLinks || 100,
    config.particlesPerLink || 20
  );
  
  this.register('linkTrailParticles', system);
  return system;
};

/**
 * Wave Particle Emitter - 3 particle families for wave interference
 */
FXDebugSandbox.prototype.spawnWaveParticleEmitter = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning WaveParticleEmitter_v1...');
  const system = new WaveParticleEmitter_v1({
    maxParticlesPerFamily: config.maxParticlesPerFamily || 2000,
    emissionRate: config.emissionRate || 1.0,
    debugMode: config.debugMode || true
  });
  
  if (this.renderer) {
    system.init(this.renderer, this.scene);
  }
  
  this.register('waveParticleEmitter', system);
  return system;
};

/**
 * Healing Particles - Healing sparkles and scar dissipation
 */
FXDebugSandbox.prototype.spawnHealingParticles = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning HealingParticles...');
  const system = new HealingParticleSystem_Session136();
  
  this.register('healingParticles', system);
  return system;
};

/**
 * Cascade Particles - Cascade particle emission along links
 */
FXDebugSandbox.prototype.spawnCascadeParticles = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning CascadeParticles...');
  const system = new CascadeParticleSystem_Session120(this.scene, {
    maxParticles: config.maxParticles || 3000,
    baseSize: config.baseSize || 4.0,
    emissionRate: config.emissionRate || 1.0,
    enabled: true,
    debugMode: config.debugMode || true
  });
  
  this.register('cascadeParticles', system);
  return system;
};

/**
 * Link Corruption Particles
 */
FXDebugSandbox.prototype.spawnLinkCorruptionParticles = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning LinkCorruptionParticles...');
  const system = new LinkCorruptionParticleSystem(this.scene, config);
  
  this.register('linkCorruptionParticles', system);
  return system;
};

/**
 * Link Healing Particles (Legacy)
 */
FXDebugSandbox.prototype.spawnLinkHealingParticles = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning LinkHealingParticles...');
  const system = new LinkHealingParticleSystem(this.scene, config);
  
  this.register('linkHealingParticles', system);
  return system;
};

// ============================================================================
// SPAWN METHODS - CASCADE
// ============================================================================

/**
 * Cascade Particle Emission Boost
 */
FXDebugSandbox.prototype.spawnCascadeEmissionBoost = function(config = {}) {
  console.log('[FX] CascadeEmissionBoost - Computation only, no visual spawn');
  const system = {
    name: 'CascadeEmissionBoost',
    update: () => {},
    dispose: () => {},
    getStats: () => ({ note: 'Integrated into CascadeParticleSystem_Session120' }),
  };
  this.register('cascadeEmissionBoost', system);
  return system;
};

/**
 * Cascade Particle Color Tinting
 */
FXDebugSandbox.prototype.spawnCascadeColorTinting = function(config = {}) {
  console.log('[FX] CascadeColorTinting - Computation only, no visual spawn');
  const system = {
    name: 'CascadeColorTinting',
    update: () => {},
    dispose: () => {},
    getStats: () => ({ note: 'Integrated into CascadeParticleSystem_Session120' }),
  };
  this.register('cascadeColorTinting', system);
  return system;
};

/**
 * Cascading Rupture System
 */
FXDebugSandbox.prototype.spawnCascadingRupture = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning CascadingRuptureSystem...');
  const system = new CascadingRuptureSystem();
  this.register('cascadingRupture', system);
  return system;
};

/**
 * Cascade Resonance Wave Visualization
 */
FXDebugSandbox.prototype.spawnCascadeResonanceWave = function(config = {}) {
  console.log('[FX] CascadeResonanceWave - Visual system, spawn status unknown');
  const system = new CascadeResonanceWaveVisualization_Session146();
  this.register('cascadeResonanceWave', system);
  return system;
};

/**
 * Resonance Cascade Visualization
 */
FXDebugSandbox.prototype.spawnResonanceCascade = function(config = {}) {
  console.log('[FX] ResonanceCascade - Visual system, spawn status unknown');
  const system = new ResonanceCascadeVisualization_Session117B();
  this.register('resonanceCascade', system);
  return system;
};

// ============================================================================
// SPAWN METHODS - WAVE
// ============================================================================

/**
 * Wave Interference Engine
 */
FXDebugSandbox.prototype.spawnWaveInterferenceEngine = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning WaveInterferenceEngine...');
  const system = new WaveInterferenceEngine_v1(config);
  
  this.register('waveInterferenceEngine', system);
  return system;
};

/**
 * Wave Shader Bridge
 */
FXDebugSandbox.prototype.spawnWaveShaderBridge = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning WaveShaderBridge...');
  const system = new WaveShaderBridge_v1(config);
  
  this.register('waveShaderBridge', system);
  return system;
};

/**
 * Wave Shader Material Patch
 */
FXDebugSandbox.prototype.spawnWaveShaderMaterialPatch = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning WaveShaderMaterialPatch...');
  const system = new WaveShaderMaterialPatch_v1(config);
  
  this.register('waveShaderMaterialPatch', system);
  return system;
};

/**
 * Wave Travel Shader Pack
 */
FXDebugSandbox.prototype.spawnWaveTravelShaderPack = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning WaveTravelShaderPack...');
  const system = new WaveTravelShaderPack_v1(config);
  
  this.register('waveTravelShaderPack', system);
  return system;
};

/**
 * Wave Dynamics Shader Pack
 */
FXDebugSandbox.prototype.spawnWaveDynamicsShaderPack = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning WaveDynamicsShaderPack...');
  const system = new WaveDynamicsShaderPack_v1(config);
  
  this.register('waveDynamicsShaderPack', system);
  return system;
};

/**
 * Synergy Traveling Wave FX
 */
FXDebugSandbox.prototype.spawnSynergyTravelingWave = function(config = {}) {
  console.log('[FX] SynergyTravelingWave - Material mutation system');
  const system = new SynergyTravelingWaveFX_v1();
  this.register('synergyTravelingWave', system);
  return system;
};

/**
 * Standing Wave Oscillation Trap System
 */
FXDebugSandbox.prototype.spawnStandingWaveTrap = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning StandingWaveOscillationTrap...');
  const system = new StandingWaveOscillationTrapSystem_Session130(config);
  
  this.register('standingWaveTrap', system);
  return system;
};

/**
 * Standing Wave Visual Renderer
 */
FXDebugSandbox.prototype.spawnStandingWaveRenderer = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning StandingWaveVisualRenderer...');
  const system = new StandingWaveVisualRenderer_Session131(config);
  
  this.register('standingWaveRenderer', system);
  return system;
};

/**
 * Wave Interference Pattern System
 */
FXDebugSandbox.prototype.spawnWaveInterferencePattern = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning WaveInterferencePattern...');
  const system = new WaveInterferencePatternSystem_Session132(config);
  
  this.register('waveInterferencePattern', system);
  return system;
};

// ============================================================================
// SPAWN METHODS - RESONANCE
// ============================================================================

/**
 * Harmonic Resonance Coupling
 */
FXDebugSandbox.prototype.spawnHarmonicResonanceCoupling = function(config = {}) {
  console.log('[FX] HarmonicResonanceCoupling - Computation only');
  const system = new HarmonicResonanceCoupling_v1();
  this.register('harmonicResonanceCoupling', system);
  return system;
};

/**
 * Harmonic Resonance Feedback System
 */
FXDebugSandbox.prototype.spawnHarmonicResonanceFeedback = function(config = {}) {
  console.log('[FX] HarmonicResonanceFeedback - Visual feedback system');
  const system = new HarmonicResonanceFeedbackSystem();
  this.register('harmonicResonanceFeedback', system);
  return system;
};

/**
 * Resonance Feedback VFX Layer
 */
FXDebugSandbox.prototype.spawnResonanceFeedback = function(config = {}) {
  console.log('[FX] ResonanceFeedback - Material mutation system');
  const system = new ResonanceFeedback_v1();
  this.register('resonanceFeedback', system);
  return system;
};

/**
 * Composite Glyph Resonance Feedback
 */
FXDebugSandbox.prototype.spawnCompositeGlyphResonance = function(config = {}) {
  console.log('[FX] CompositeGlyphResonance - Visual feedback system');
  const system = new CompositeGlyphResonanceFeedback();
  this.register('compositeGlyphResonance', system);
  return system;
};

/**
 * Harmonic Node Resonance Halos
 */
FXDebugSandbox.prototype.spawnHarmonicNodeHalos = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning HarmonicNodeResonanceHalos...');
  const system = new HarmonicNodeResonanceHalos();
  this.register('harmonicNodeHalos', system);
  return system;
};

/**
 * Harmonic Sync Effect Applier
 */
FXDebugSandbox.prototype.spawnHarmonicSyncEffect = function(config = {}) {
  console.log('[FX] HarmonicSyncEffect - Material mutation system');
  const system = new HarmonicSyncEffectApplier();
  this.register('harmonicSyncEffect', system);
  return system;
};

// ============================================================================
// SPAWN METHODS - RIPPLE
// ============================================================================

/**
 * Echo Ripple Integration Patch
 */
FXDebugSandbox.prototype.spawnEchoRipple = function(config = {}) {
  console.log('[FX] EchoRipple - Status unknown, may spawn visuals');
  const system = new EchoRippleIntegrationPatch_Session125();
  this.register('echoRipple', system);
  return system;
};

/**
 * Resonance Echo Trail System
 */
FXDebugSandbox.prototype.spawnResonanceEchoTrail = function(config = {}) {
  console.log('[FX] ResonanceEchoTrail - May spawn meshes');
  const system = new ResonanceEchoTrailSystem();
  this.register('resonanceEchoTrail', system);
  return system;
};

// ============================================================================
// SPAWN METHODS - INTERFERENCE
// ============================================================================

/**
 * Interference Effect Applier
 */
FXDebugSandbox.prototype.spawnInterferenceEffect = function(config = {}) {
  console.log('[FX] InterferenceEffect - Material mutation system');
  const system = new InterferenceEffectApplier();
  this.register('interferenceEffect', system);
  return system;
};

/**
 * Node Interference Manager
 */
FXDebugSandbox.prototype.spawnNodeInterferenceManager = function(config = {}) {
  console.log('[FX] NodeInterferenceManager - Manager class only');
  const system = new NodeInterferenceManager();
  this.register('nodeInterferenceManager', system);
  return system;
};

// ============================================================================
// SPAWN METHODS - LINK PARTICLES
// ============================================================================

/**
 * Link Bead Trail System
 */
FXDebugSandbox.prototype.spawnLinkBeadTrail = function(config = {}) {
  console.log('[FX] LinkBeadTrail - Spawns particles');
  const system = new LinkBeadTrailSystem();
  this.register('linkBeadTrail', system);
  return system;
};

/**
 * Link Spark System
 */
FXDebugSandbox.prototype.spawnLinkSpark = function(config = {}) {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning LinkSparkSystem...');
  const system = new LinkSparkSystem(this.scene, config.maxSparks || 60);
  
  this.register('linkSpark', system);
  return system;
};

/**
 * Link Directional Streaks
 */
FXDebugSandbox.prototype.spawnLinkDirectionalStreaks = function(config = {}) {
  console.log('[FX] LinkDirectionalStreaks - Spawns particles');
  const system = new LinkDirectionalStreaks();
  this.register('linkDirectionalStreaks', system);
  return system;
};

// REMOVED: AnimatedLinkFlow spawn — moved to LEGACY/april (2026-04-22)

// ============================================================================
// CONVENIENCE ALIASES
// ============================================================================

// Short aliases for quick console testing
FXDebugSandbox.prototype.particles = function() { return this.spawnLinkTrailParticles(); };
FXDebugSandbox.prototype.waves = function() { return this.spawnWaveParticleEmitter(); };
FXDebugSandbox.prototype.cascade = function() { return this.spawnCascadeParticles(); };
FXDebugSandbox.prototype.healing = function() { return this.spawnHealingParticles(); };
FXDebugSandbox.prototype.corruption = function() { return this.spawnLinkCorruptionParticles(); };
FXDebugSandbox.prototype.resonance = function() { return this.spawnHarmonicResonanceFeedback(); };
FXDebugSandbox.prototype.ripples = function() { return this.spawnResonanceEchoTrail(); };
FXDebugSandbox.prototype.interference = function() { return this.spawnInterferenceEffect(); };
FXDebugSandbox.prototype.standingWave = function() { return this.spawnStandingWaveRenderer(); };
FXDebugSandbox.prototype.sparks = function() { return this.spawnLinkSpark(); };
FXDebugSandbox.prototype.halos = function() { return this.spawnHarmonicNodeHalos(); };

// ============================================================================
// SPAWN ALL
// ============================================================================

/**
 * Spawn all VFX systems for comprehensive testing
 */
FXDebugSandbox.prototype.spawnAll = function() {
  if (!this.checkInit()) return;

  console.log('[FX] Spawning ALL VFX systems...');
  
  // Particles
  this.spawnLinkTrailParticles();
  this.spawnWaveParticleEmitter();
  this.spawnHealingParticles();
  this.spawnCascadeParticles();
  this.spawnLinkCorruptionParticles();
  
  // Cascade
  this.spawnCascadingRupture();
  this.spawnCascadeResonanceWave();
  this.spawnResonanceCascade();
  
  // Wave
  this.spawnWaveInterferenceEngine();
  this.spawnWaveShaderBridge();
  this.spawnStandingWaveTrap();
  this.spawnStandingWaveRenderer();
  
  // Resonance
  this.spawnHarmonicNodeHalos();
  this.spawnResonanceEchoTrail();
  
  // Link particles
  this.spawnLinkSpark();
  
  console.log(`[FX] Spawned ${this.activeSystems.size} total effects.`);
};

// ============================================================================
// GLOBAL WINDOW EXPORT
// ============================================================================

// ============================================================================
// INITIALIZATION - DISABLED
// ============================================================================

// Sandbox export stays enabled; spawn helpers remain console-only.
const DISABLED = false;

const sandbox = new FXDebugSandbox();

if (!DISABLED) {
  // Export to window for console access
  if (typeof window !== 'undefined') {
    window.FX = sandbox;

    // Also export spawn aliases at top level for quick access
    window.FX.spawn = {
      particles: () => sandbox.spawnLinkTrailParticles(),
      waves: () => sandbox.spawnWaveParticleEmitter(),
      cascade: () => sandbox.spawnCascadeParticles(),
      healing: () => sandbox.spawnHealingParticles(),
      corruption: () => sandbox.spawnLinkCorruptionParticles(),
      resonance: () => sandbox.spawnHarmonicResonanceFeedback(),
      ripples: () => sandbox.spawnResonanceEchoTrail(),
      interference: () => sandbox.spawnInterferenceEffect(),
      standingWave: () => sandbox.spawnStandingWaveRenderer(),
      sparks: () => sandbox.spawnLinkSpark(),
      halos: () => sandbox.spawnHarmonicNodeHalos(),
      all: () => sandbox.spawnAll()
    };

    // Export spawn methods directly for quick access
    window.FX.harmony = () => sandbox.spawnHealingParticles();
    window.FX.cascade = () => sandbox.spawnCascadeParticles();
    window.FX.wave = () => sandbox.spawnWaveParticleEmitter();
    window.FX.trail = () => sandbox.spawnLinkTrailParticles();
    window.FX.spark = () => sandbox.spawnLinkSpark();
    window.FX.halo = () => sandbox.spawnHarmonicNodeHalos();
    window.FX.toggleNodeFxHud = (force) => sandbox.toggleHud(force);
    window.FX.showNodeFxHud = () => sandbox.toggleHud(true);
    window.FX.hideNodeFxHud = () => sandbox.toggleHud(false);
    window.FX.refreshNodeFxRegistry = () => sandbox.syncNodeFxRegistry(true);
    window.FX.listNodeFxRegistry = () => sandbox.listNodeFxRegistry();
    window.FX.toggleNodeFx = (id, enabled) => sandbox.toggleNodeFxById(id, enabled);
    window.FX.nodeFx = {
      toggle: (id, enabled) => sandbox.toggleNodeFxById(id, enabled),
      list: () => sandbox.listNodeFxRegistry(),
      refresh: () => sandbox.syncNodeFxRegistry(true),
      showHud: () => sandbox.toggleHud(true),
      hideHud: () => sandbox.toggleHud(false)
    };

    console.log('[FXDebugSandbox] Loaded. Use FX.init(scene) then FX.spawn.<method>()');
    console.log('[FXDebugSandbox] Quick access: FX.harmony(), FX.cascade(), FX.wave(), FX.trail(), FX.spark(), FX.halo()');
    console.log('[FXDebugSandbox] Node HUD: press L or call FX.toggleNodeFxHud().');
  }
} else {
  console.log('[FXDebugSandbox] DISABLED - To enable, change DISABLED flag to false at line ~661');
}

export default sandbox;
