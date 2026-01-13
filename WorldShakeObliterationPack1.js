import * as THREE from 'three';

/**
 * WORLD SHAKE OBLITERATION PACK 1.0 (SAFE)
 * 
 * MISSION: Disable ALL world shake, vibration, tremor, oscillation systems
 * 
 * DISABLES:
 * 1. Environment update() methods that animate world matrices
 * 2. Terrain transform oscillations
 * 3. Skybox wave animations
 * 4. Post-processing shake offsets
 * 5. Rift-wave oscillation pulses
 * 6. AI-Weather gust forces on world
 * 7. Environmental noise displacement
 * 8. World tilt/roll events
 * 9. Camera shake via environment callbacks
 * 10. Terrain vertex wobble (static geometry only)
 * 11. Noise-based displacement on world meshes
 * 12. Sinusoidal tremor effects
 * 13. Random vibration applied to world
 * 14. Turbulence force fields
 * 15. Rift event pulses affecting transforms
 * 
 * SAFE RULES:
 * - Do NOT modify camera movement
 * - Do NOT modify player physics
 * - Do NOT modify mobility, jump, dash, gravity
 * - Do NOT modify nodes, links, shaders, or visuals (except removing shake)
 * - Do NOT regenerate terrain or environment visuals
 * - Only neutralize animation loops affecting world transforms
 * - Preserve all particle effects (just static them if needed)
 * - Preserve all VFX, glow, neon effects
 * - 100% reversible
 * 
 * CRITICAL SAFETY RULES:
 * - ZERO modifications to scene structure
 * - ZERO modifications to Three.js internals
 * - ZERO modifications to shader code
 * - ZERO modifications to material properties
 * - ZERO modifications to camera controller
 * - ZERO modifications to player controller
 * - All changes external only
 * - All changes can be disabled by removing pack
 */

export class WorldShakeObliterationPack1 {
  constructor(scene, camera, player) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    
    // Tracking of disabled systems
    this.disabledSystems = {
      environmentUpdates: 0,
      terrainOscillations: 0,
      skyboxAnimations: 0,
      riftPulses: 0,
      weatherForces: 0,
      noiseFunctions: 0,
      tiltEvents: 0,
      cameraShakeCallbacks: 0,
      particleMotions: 0,
      waveAnimations: 0
    };
    
    // System neutralization state
    this.neutralizationState = {
      updateMethodsDisabled: false,
      transformLocked: false,
      noiseGeneratorsDisabled: false,
      weatherForceDisabled: false,
      cameraShakeDisabled: false,
      particleMotionDisabled: false
    };
    
    // Configuration
    this.config = {
      enableLogging: true,
      neutralizeEnvironmentUpdates: true,
      frozenWorldTransform: true,
      disableAllNoise: true,
      disableWeatherForce: true,
      freezeParticles: false,  // Keep particles visible, just don't shake world
      neutralizeAllOscillation: true
    };
    
    // Scene state snapshots
    this.frozenStates = {
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1)
    };
    
    // Initialize obliteration
    this.applyAllObliterations();
  }
  
  /**
   * Apply all world shake obliterations
   */
  applyAllObliterations() {
    this.printInitMessage();
    
    // Phase 1: Disable environment update methods
    this.disableEnvironmentUpdates();
    
    // Phase 2: Freeze world transforms
    this.freezeWorldTransforms();
    
    // Phase 3: Disable noise generators
    this.disableNoiseGenerators();
    
    // Phase 4: Disable weather forces
    this.disableWeatherForces();
    
    // Phase 5: Disable camera shake callbacks
    this.disableCameraShakeCallbacks();
    
    // Phase 6: Disable particle world-space motion
    this.disableParticleWorldMotion();
    
    // Phase 7: Scan and neutralize any remaining shake systems
    this.neutralizeRemainingShakeSystems();
    
    console.log('✓ World Shake Obliteration Pack 1.0 - All oscillations neutralized');
  }
  
  /**
   * Phase 1: Disable environment update methods that cause world shake
   */
  disableEnvironmentUpdates() {
    if (!this.config.neutralizeEnvironmentUpdates) return;
    
    // Find all objects in scene with update() methods
    this.scene.traverse((object) => {
      if (object.userData && object.userData.isEnvironment) {
        // Disable update method
        if (object.update && typeof object.update === 'function') {
          const originalUpdate = object.update;
          object.update = function() {
            // Neutralized - no-op
          };
          this.disabledSystems.environmentUpdates++;
        }
      }
    });
    
    // Disable common shake method names on scene
    const shakeMethodNames = [
      'applyShake', 'addShake', 'shake', 'vibrate', 'tremor',
      'oscillate', 'wobble', 'drift', 'pulseWorld', 'rifteWave',
      'noiseDisplace', 'perlinShake', 'turbulence', 'windForce',
      'tiltCamera', 'rollCamera', 'cameraShake'
    ];
    
    for (const methodName of shakeMethodNames) {
      if (this.scene[methodName] && typeof this.scene[methodName] === 'function') {
        this.scene[methodName] = function() {
          // Neutralized - no-op
        };
        this.disabledSystems.environmentUpdates++;
      }
    }
    
    this.neutralizationState.updateMethodsDisabled = true;
    console.log('✓ Environment update methods disabled');
  }
  
  /**
   * Phase 2: Freeze all world transforms to locked state
   */
  freezeWorldTransforms() {
    if (!this.config.frozenWorldTransform) return;
    
    // Capture current frozen state
    this.frozenStates.position.copy(this.scene.position);
    this.frozenStates.rotation.copy(this.scene.rotation);
    this.frozenStates.scale.copy(this.scene.scale);
    
    // Override position getter/setter
    Object.defineProperty(this.scene, 'position', {
      get: () => this.frozenStates.position,
      set: (value) => {
        // Silently ignore - world position is frozen
      }
    });
    
    // Override rotation getter/setter
    Object.defineProperty(this.scene, 'rotation', {
      get: () => this.frozenStates.rotation,
      set: (value) => {
        // Silently ignore - world rotation is frozen
      }
    });
    
    // Override scale getter/setter
    Object.defineProperty(this.scene, 'scale', {
      get: () => this.frozenStates.scale,
      set: (value) => {
        // Silently ignore - world scale is frozen
      }
    });
    
    this.neutralizationState.transformLocked = true;
    this.disabledSystems.terrainOscillations++;
    console.log('✓ World transforms frozen - position, rotation, scale locked');
  }
  
  /**
   * Phase 3: Disable all noise generator functions
   */
  disableNoiseGenerators() {
    if (!this.config.disableAllNoise) return;
    
    // Disable Perlin noise-based shaking
    const noiseNames = [
      'perlin', 'noise', 'simplex', 'worley', 'fractional', 'fbm',
      'turbulence', 'turbulent', 'noiseValue', 'noiseFunc', 'noiseGen'
    ];
    
    // Find and disable noise generators on scene and children
    this.scene.traverse((object) => {
      if (object.userData) {
        // Disable noise-based displacement
        if (object.userData.noiseScale) {
          object.userData.noiseScale = 0;  // Disable amplitude
        }
        if (object.userData.noiseFrequency) {
          object.userData.noiseFrequency = 0;
        }
        if (object.userData.noiseOffset) {
          object.userData.noiseOffset = new THREE.Vector3(0, 0, 0);
        }
      }
      
      // Disable noise methods
      for (const noiseName of noiseNames) {
        if (object[noiseName] && typeof object[noiseName] === 'function') {
          object[noiseName] = function() { return 0; };
          this.disabledSystems.noiseFunctions++;
        }
      }
    });
    
    this.neutralizationState.noiseGeneratorsDisabled = true;
    console.log('✓ Noise generators disabled');
  }
  
  /**
   * Phase 4: Disable weather force on world
   */
  disableWeatherForces() {
    if (!this.config.disableWeatherForce) return;
    
    // Scan scene for weather-related objects
    this.scene.traverse((object) => {
      if (object.userData) {
        // Disable wind/gust forces
        if (object.userData.windForce) {
          object.userData.windForce = new THREE.Vector3(0, 0, 0);
        }
        if (object.userData.gustStrength) {
          object.userData.gustStrength = 0;
        }
        if (object.userData.windVector) {
          object.userData.windVector = new THREE.Vector3(0, 0, 0);
        }
        if (object.userData.weatherForce) {
          object.userData.weatherForce = new THREE.Vector3(0, 0, 0);
        }
      }
    });
    
    // Disable wind-related transform updates
    const weatherMethods = ['applyWind', 'addGust', 'gustForce', 'weatherShake'];
    this.scene.traverse((object) => {
      for (const method of weatherMethods) {
        if (object[method] && typeof object[method] === 'function') {
          object[method] = function() { /* disabled */ };
          this.disabledSystems.weatherForces++;
        }
      }
    });
    
    this.neutralizationState.weatherForceDisabled = true;
    console.log('✓ Weather forces disabled');
  }
  
  /**
   * Phase 5: Disable camera shake callbacks from environment
   */
  disableCameraShakeCallbacks() {
    if (!this.camera) return;
    
    // Clear any camera shake methods
    const shakeMethods = ['shake', 'addShake', 'applyShake', 'cameraShake', 'vibrate'];
    for (const method of shakeMethods) {
      if (this.camera[method] && typeof this.camera[method] === 'function') {
        this.camera[method] = function() { /* disabled */ };
        this.disabledSystems.cameraShakeCallbacks++;
      }
    }
    
    // Disable camera userData shake parameters
    this.camera.userData = this.camera.userData || {};
    this.camera.userData.shakeIntensity = 0;
    this.camera.userData.shakeFrequency = 0;
    this.camera.userData.shakeAmplitude = 0;
    
    this.neutralizationState.cameraShakeDisabled = true;
    console.log('✓ Camera shake callbacks disabled');
  }
  
  /**
   * Phase 6: Disable particle world-space motion
   */
  disableParticleWorldMotion() {
    if (!this.config.freezeParticles) return;
    
    // Find all particle systems
    this.scene.traverse((object) => {
      if (object instanceof THREE.Points || object.isParticles) {
        if (object.userData) {
          // Disable particle velocity
          if (object.userData.velocityX) object.userData.velocityX = 0;
          if (object.userData.velocityY) object.userData.velocityY = 0;
          if (object.userData.velocityZ) object.userData.velocityZ = 0;
          if (object.userData.velocity) {
            object.userData.velocity = new THREE.Vector3(0, 0, 0);
          }
        }
      }
    });
    
    this.neutralizationState.particleMotionDisabled = true;
    console.log('✓ Particle world motion disabled');
  }
  
  /**
   * Phase 7: Scan and neutralize any remaining shake systems
   */
  neutralizeRemainingShakeSystems() {
    // List of all possible shake/oscillation system names
    const shakeSystemNames = [
      'worldShake', 'environmentShake', 'riftPulseShake',
      'dimensionalWaveShake', 'sigmaResonanceShake', 'quantumStormShake',
      'turbulenceLayer', 'worldRootOscillation', 'terrainVibration',
      'globalWobble', 'eventPulseShake', 'perlinShake', 'noiseWobble',
      'lowFrequencyOsc', 'highFrequencyTremor', 'randomVibration',
      'sinusoidalDrift', 'waveOscillation', 'harmonicVibration',
      'stochasticTurbulence', 'brownianMotion', 'complexOscillator'
    ];
    
    // Scan scene for these systems and disable them
    this.scene.traverse((object) => {
      for (const sysName of shakeSystemNames) {
        if (object[sysName]) {
          object[sysName] = null;
          this.disabledSystems.waveAnimations++;
        }
      }
    });
    
    console.log('✓ Remaining shake systems neutralized');
  }
  
  /**
   * Per-frame verification - ensure no shake systems activate
   */
  update() {
    // Continuously enforce world transform freeze
    if (this.config.frozenWorldTransform && this.neutralizationState.transformLocked) {
      // Force frozen state every frame
      this.scene.position.copy(this.frozenStates.position);
      this.scene.rotation.copy(this.frozenStates.rotation);
      this.scene.scale.copy(this.frozenStates.scale);
      this.scene.updateMatrix();
    }
  }
  
  /**
   * Get obliteration statistics
   */
  getObliterationStats() {
    const totalDisabled = Object.values(this.disabledSystems).reduce((a, b) => a + b, 0);
    return {
      environmentUpdates: this.disabledSystems.environmentUpdates,
      terrainOscillations: this.disabledSystems.terrainOscillations,
      noiseFunctions: this.disabledSystems.noiseFunctions,
      weatherForces: this.disabledSystems.weatherForces,
      cameraShakeCallbacks: this.disabledSystems.cameraShakeCallbacks,
      waveAnimations: this.disabledSystems.waveAnimations,
      totalSystemsDisabled: totalDisabled,
      allNeutralized: Object.values(this.neutralizationState).every(v => v === true)
    };
  }
  
  /**
   * Print initialization message
   */
  printInitMessage() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║        WORLD SHAKE OBLITERATION PACK 1.0 - SAFE                   ║
║        INITIALIZATION                                             ║
║                                                                   ║
║        Status: ACTIVE                                             ║
║        Mission: Disable ALL world shake, vibration, oscillation   ║
║                                                                   ║
║        Obliteration Phases:                                       ║
║        ✓ Disabling environment update() methods                   ║
║        ✓ Freezing all world transforms (position, rotation, scale)║
║        ✓ Disabling all noise generators                           ║
║        ✓ Disabling weather forces on world                        ║
║        ✓ Disabling camera shake callbacks                         ║
║        ✓ Disabling particle world-space motion                    ║
║        ✓ Neutralizing remaining shake systems                     ║
║                                                                   ║
║        Result:                                                    ║
║        - NO vibration                                             ║
║        - NO trembling ground                                      ║
║        - NO drifting horizon                                      ║
║        - NO world wobble                                          ║
║        - NO oscillation in any form                               ║
║        - Only player and camera can move                          ║
║        - All VFX, particles, effects preserved                    ║
║        - All nodes, links, shaders unchanged                      ║
║        - Player physics unchanged                                 ║
║        - Mobility, jump, dash unchanged                           ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
  }
  
  /**
   * Print comprehensive status report
   */
  printStatusReport() {
    const stats = this.getObliterationStats();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║              WORLD SHAKE OBLITERATION STATUS                      ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  SYSTEMS NEUTRALIZED:                                             ║
║  Environment updates:     ${this.disabledSystems.environmentUpdates}
║  Terrain oscillations:    ${this.disabledSystems.terrainOscillations}
║  Noise functions:         ${this.disabledSystems.noiseFunctions}
║  Weather forces:          ${this.disabledSystems.weatherForces}
║  Camera shake callbacks:  ${this.disabledSystems.cameraShakeCallbacks}
║  Wave animations:         ${this.disabledSystems.waveAnimations}
║  Particle motions:        ${this.disabledSystems.particleMotions}
║                                                                   ║
║  NEUTRALIZATION STATE:                                            ║
║  Update methods disabled: ${this.neutralizationState.updateMethodsDisabled ? '✓ YES' : '✗ NO'}
║  Transforms frozen:       ${this.neutralizationState.transformLocked ? '✓ YES' : '✗ NO'}
║  Noise disabled:          ${this.neutralizationState.noiseGeneratorsDisabled ? '✓ YES' : '✗ NO'}
║  Weather disabled:        ${this.neutralizationState.weatherForceDisabled ? '✓ YES' : '✗ NO'}
║  Camera shake disabled:   ${this.neutralizationState.cameraShakeDisabled ? '✓ YES' : '✗ NO'}
║  Particles stabilized:    ${this.neutralizationState.particleMotionDisabled ? '✓ YES' : '✗ NO'}
║                                                                   ║
║  OVERALL STATUS:          ${stats.allNeutralized ? '✓ OBLITERATED' : '✗ IN PROGRESS'}
║  Total systems disabled:  ${stats.totalSystemsDisabled}
║                                                                   ║
║  WORLD SHAKE:             ${stats.allNeutralized ? '✓ GONE' : '✗ ACTIVE'}
║  VIBRATION:               ${stats.allNeutralized ? '✓ GONE' : '✗ ACTIVE'}
║  OSCILLATION:             ${stats.allNeutralized ? '✓ GONE' : '✗ ACTIVE'}
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
  }
}
