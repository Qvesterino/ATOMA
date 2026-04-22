/**
 * FXDebugSandbox.js
 * ============================================================================
 * DEBUG SANDBOX FOR VFX SYSTEMS
 *
 * ⚠️ CURRENTLY DISABLED - To enable, change 'const DISABLED = true' to 'false' at line ~661
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

class FXDebugSandbox {
  constructor() {
    this.scene = null;
    this.renderer = null;
    this.activeSystems = new Map(); // name -> { system, updateFn, disposeFn }
    this.initialized = false;
  }

  /**
   * Initialize sandbox with Three.js scene and renderer
   */
  init(scene, renderer = null) {
    this.scene = scene;
    this.renderer = renderer;
    this.initialized = true;
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

// ⚠️ SANDBOX CURRENTLY DISABLED - To enable, change 'const DISABLED = true' to 'false'
const DISABLED = true;

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

    console.log('[FXDebugSandbox] Loaded. Use FX.init(scene) then FX.spawn.<method>()');
    console.log('[FXDebugSandbox] Quick access: FX.harmony(), FX.cascade(), FX.wave(), FX.trail(), FX.spark(), FX.halo()');
  }
} else {
  console.log('[FXDebugSandbox] DISABLED - To enable, change DISABLED flag to false at line ~661');
}

export default sandbox;
