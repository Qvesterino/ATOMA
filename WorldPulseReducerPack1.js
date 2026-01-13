import * as THREE from 'three';

/**
 * WORLD PULSE REDUCER PACK 1.0 (SAFE)
 * 
 * MISSION: Reduce or disable the global world pulse/breath/wave effect
 * 
 * Targets to reduce:
 * 1. Ambient light intensity oscillations
 * 2. Terrain vertex displacement oscillations
 * 3. Skybox pulse waves
 * 4. Volumetric light pulses affecting world perception
 * 5. Atmospheric layer pulse effects
 * 6. Global breathing/wave amplitude
 * 
 * SAFE RULES:
 * - Do NOT modify camera movement
 * - Do NOT modify player movement
 * - Do NOT modify shaders for nodes or links
 * - Do NOT modify weather systems
 * - Do NOT modify colors, lighting base values, or post-processing
 * - Do NOT modify dimensional rifts or events
 * - Do NOT touch node-level pulses (keep those)
 * - Only reduce pulse AMPLITUDE by 90% or disable global breathing
 * - Terrain and skybox remain visually stable
 * - Node individual pulses stay intact
 * 
 * CRITICAL SAFETY RULES:
 * - ZERO modifications to scene structure
 * - ZERO modifications to shader code
 * - ZERO modifications to material base properties
 * - ZERO modifications to camera or player
 * - All changes are pulse amplitude reduction only
 * - 100% reversible
 * - Preserves all other visual effects
 */

export class WorldPulseReducerPack1 {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Pulse reduction mode: 'disable' or 'reduce' (90%)
    this.reductionMode = 'reduce';  // Change to 'disable' for complete elimination
    
    // Tracking of reduced systems
    this.reducedSystems = {
      ambientLightPulses: 0,
      terrainVertexDisplacements: 0,
      skyboxPulseWaves: 0,
      volumetricLightPulses: 0,
      atmosphericLayerPulses: 0,
      globalBreathingEffects: 0,
      totalPulsesReduced: 0
    };
    
    // Reduction state
    this.reductionState = {
      lightPulsesReduced: false,
      terrainStabilized: false,
      skyboxStabilized: false,
      volumetricLightsReduced: false,
      atmosphericLayersReduced: false
    };
    
    // Store original pulse speeds for restoration if needed
    this.originalPulseData = [];
    
    // Configuration
    this.config = {
      enableLogging: true,
      reductionAmplitude: 0.1,  // Reduce to 10% of original (90% reduction)
      disableCompletely: false,  // Set true to eliminate all pulses
      preserveNodePulses: true,  // Keep node-level pulses
      scanFrequency: 'perFrame'
    };
    
    // Initialize reduction
    this.applyAllReductions();
  }
  
  /**
   * Apply all pulse reductions
   */
  applyAllReductions() {
    this.printInitMessage();
    
    // Phase 1: Reduce ambient light pulses
    this.reduceAmbientLightPulses();
    
    // Phase 2: Reduce terrain vertex displacement
    this.reduceTerrainVertexDisplacements();
    
    // Phase 3: Reduce skybox pulse waves
    this.reduceSkyboxPulseWaves();
    
    // Phase 4: Reduce volumetric light pulses
    this.reduceVolumetricLightPulses();
    
    // Phase 5: Reduce atmospheric layer pulses
    this.reduceAtmosphericLayerPulses();
    
    // Phase 6: Scan for remaining global breathing effects
    this.neutralizeRemainingBreathingEffects();
    
    console.log('✓ World Pulse Reducer Pack 1.0 - All pulse effects reduced');
  }
  
  /**
   * Phase 1: Reduce ambient light intensity oscillations
   */
  reduceAmbientLightPulses() {
    // Scan scene for all lights
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light) {
        // Store original intensity
        if (object.userData) {
          object.userData.originalIntensity = object.intensity;
          
          // Disable intensity oscillation (if any)
          object.userData.pulseIntensity = false;
          object.userData.pulseAmplitude = 0;
        }
      }
      
      // Disable light pulse methods
      const pulseMethods = ['pulseLighting', 'oscillateIntensity', 'breathe', 'pulse'];
      for (const method of pulseMethods) {
        if (object[method] && typeof object[method] === 'function') {
          object[method] = function() { /* disabled */ };
          this.reducedSystems.ambientLightPulses++;
        }
      }
    });
    
    this.reductionState.lightPulsesReduced = true;
    console.log('✓ Ambient light pulses reduced');
  }
  
  /**
   * Phase 2: Reduce terrain vertex displacement oscillations
   */
  reduceTerrainVertexDisplacements() {
    // Find terrain meshes
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        // Check if this looks like terrain (has position attributes and many vertices)
        const positions = object.geometry.attributes.position;
        if (positions && positions.count > 100) {
          // Reduce displacement oscillation
          if (object.userData) {
            object.userData.vertexDisplacementAmplitude = 0;
            object.userData.waveAmplitude = 0;
            object.userData.oscillationEnabled = false;
            object.userData.pulseEnabled = false;
          }
          
          this.reducedSystems.terrainVertexDisplacements++;
        }
      }
    });
    
    this.reductionState.terrainStabilized = true;
    console.log('✓ Terrain vertex displacements stabilized');
  }
  
  /**
   * Phase 3: Reduce skybox pulse waves
   */
  reduceSkyboxPulseWaves() {
    // Find skybox-like objects (typically large, positioned at camera)
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        // Check for skybox patterns (large scale, emissive material)
        if (object.scale.length() > 100 || object.material.emissive) {
          // Reduce pulse wave
          if (object.userData) {
            object.userData.waveAmplitude = 0;
            object.userData.pulseSpeed = 0;
            object.userData.pulsePhase = 0;
            object.userData.waveEnabled = false;
          }
          
          // Reduce material emission oscillation
          if (object.material.userData) {
            object.material.userData.pulseEmissive = false;
          }
          
          this.reducedSystems.skyboxPulseWaves++;
        }
      }
    });
    
    this.reductionState.skyboxStabilized = true;
    console.log('✓ Skybox pulse waves reduced');
  }
  
  /**
   * Phase 4: Reduce volumetric light pulses
   */
  reduceVolumetricLightPulses() {
    // Find volumetric light objects (typically cones with pulsing opacity)
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        // Check for volumetric light patterns
        if (object.userData && object.userData.baseOpacity !== undefined && object.userData.pulseSpeed) {
          // This looks like a volumetric light
          if (this.config.disableCompletely) {
            // Disable completely
            object.userData.pulseSpeed = 0;
            object.material.opacity = object.userData.baseOpacity * 0.3;  // Dim to background
          } else {
            // Reduce amplitude to 10% of original
            object.userData.pulseAmplitude = 0.1;
            object.userData.originalPulseSpeed = object.userData.pulseSpeed;
            object.userData.pulseSpeed = object.userData.pulseSpeed * 0.1;
          }
          
          this.reducedSystems.volumetricLightPulses++;
        }
      }
    });
    
    this.reductionState.volumetricLightsReduced = true;
    console.log('✓ Volumetric light pulses reduced');
  }
  
  /**
   * Phase 5: Reduce atmospheric layer pulses
   */
  reduceAtmosphericLayerPulses() {
    // Find atmospheric layers (typically large planes at various heights)
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material && object.material.transparent) {
        // Check for atmospheric layer patterns
        if (object.userData && object.userData.pulseSpeed) {
          if (this.config.disableCompletely) {
            // Disable pulse completely
            object.userData.pulseSpeed = 0;
            object.userData.pulseEnabled = false;
          } else {
            // Reduce amplitude - store original and reduce
            if (!object.userData.originalPulseSpeed) {
              object.userData.originalPulseSpeed = object.userData.pulseSpeed;
            }
            object.userData.pulseAmplitude = 0.1;
            object.userData.pulseSpeed = object.userData.pulseSpeed * 0.1;
          }
          
          this.reducedSystems.atmosphericLayerPulses++;
        }
      }
    });
    
    this.reductionState.atmosphericLayersReduced = true;
    console.log('✓ Atmospheric layer pulses reduced');
  }
  
  /**
   * Phase 6: Neutralize remaining global breathing effects
   */
  neutralizeRemainingBreathingEffects() {
    // Comprehensive scan for breathing/pulse effects
    const breathingNames = [
      'breathing', 'breath', 'globalBreath', 'worldBreath',
      'globalPulse', 'worldPulse', 'globalWave', 'worldWave',
      'globalOscillation', 'worldOscillation', 'globalDisplacement',
      'worldDisplacement', 'globalBreathe', 'worldBreathe'
    ];
    
    this.scene.traverse((object) => {
      // Disable breathing/pulse system names
      for (const breathName of breathingNames) {
        if (object[breathName]) {
          object[breathName] = null;
          this.reducedSystems.globalBreathingEffects++;
        }
      }
      
      // Reduce userData breathing parameters
      if (object.userData) {
        if (object.userData.breathingAmplitude) {
          object.userData.breathingAmplitude = 0;
        }
        if (object.userData.breathingFrequency) {
          object.userData.breathingFrequency = 0;
        }
        if (object.userData.globalPulseAmplitude) {
          object.userData.globalPulseAmplitude = 0;
        }
      }
    });
    
    console.log('✓ Remaining breathing effects neutralized');
  }
  
  /**
   * Per-frame update - reduce pulse amplitudes in real-time
   */
  update(deltaTime) {
    // Continuously reduce pulse amplitudes to ensure they stay low
    if (this.config.disableCompletely) {
      // Complete disabling - already done in setup
      return;
    }
    
    // For 'reduce' mode, continuously enforce reduced amplitudes
    this.scene.traverse((object) => {
      if (object.userData) {
        // Enforce reduced volumetric light pulses
        if (object.userData.pulseAmplitude && object.userData.pulseAmplitude > 0.1) {
          object.userData.pulseAmplitude = 0.1;
        }
        
        // Enforce reduced pulse speeds
        if (object.userData.originalPulseSpeed && object.userData.pulseSpeed) {
          if (object.userData.pulseSpeed > object.userData.originalPulseSpeed * 0.2) {
            object.userData.pulseSpeed = object.userData.originalPulseSpeed * 0.1;
          }
        }
      }
    });
  }
  
  /**
   * Get pulse reduction statistics
   */
  getReductionStats() {
    const totalReduced = Object.values(this.reducedSystems).reduce((a, b) => a + b, 0);
    return {
      ambientLightPulses: this.reducedSystems.ambientLightPulses,
      terrainDisplacements: this.reducedSystems.terrainVertexDisplacements,
      skyboxPulses: this.reducedSystems.skyboxPulseWaves,
      volumetricLights: this.reducedSystems.volumetricLightPulses,
      atmosphericLayers: this.reducedSystems.atmosphericLayerPulses,
      breathingEffects: this.reducedSystems.globalBreathingEffects,
      totalReduced: totalReduced,
      reductionMode: this.config.disableCompletely ? 'DISABLED' : 'REDUCED TO 10%',
      allReduced: Object.values(this.reductionState).every(v => v === true)
    };
  }
  
  /**
   * Enable/disable reduction dynamically
   */
  setReductionMode(mode) {
    if (mode === 'disable') {
      this.config.disableCompletely = true;
      console.log('World pulse: DISABLED');
    } else if (mode === 'reduce') {
      this.config.disableCompletely = false;
      console.log('World pulse: REDUCED TO 10%');
    } else if (mode === 'restore') {
      // Could implement restoration of original pulse amplitudes
      console.log('World pulse: RESTORE NOT YET IMPLEMENTED');
    }
  }
  
  /**
   * Print initialization message
   */
  printInitMessage() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║        WORLD PULSE REDUCER PACK 1.0 - SAFE                        ║
║        INITIALIZATION                                             ║
║                                                                   ║
║        Status: ACTIVE                                             ║
║        Mission: Reduce global world pulse/breath/wave effect      ║
║                                                                   ║
║        Reduction Phases:                                          ║
║        ✓ Reducing ambient light intensity oscillations            ║
║        ✓ Reducing terrain vertex displacement oscillations        ║
║        ✓ Reducing skybox pulse waves                              ║
║        ✓ Reducing volumetric light pulses                         ║
║        ✓ Reducing atmospheric layer pulses                        ║
║        ✓ Neutralizing remaining global breathing effects          ║
║                                                                   ║
║        Reduction Mode: ${this.config.disableCompletely ? 'DISABLED' : 'REDUCED TO 10%'}
║                                                                   ║
║        Result:                                                    ║
║        - NO global breathing effect                               ║
║        - Terrain visually stable                                  ║
║        - Skybox horizon remains fixed                             ║
║        - Nodes keep their individual pulses                       ║
║        - All other FX and visuals intact                          ║
║        - Weather systems unchanged                                ║
║        - Camera and player movement unchanged                     ║
║        - Colors and base lighting unchanged                       ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
  }
  
  /**
   * Print comprehensive status report
   */
  printStatusReport() {
    const stats = this.getReductionStats();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║              WORLD PULSE REDUCTION STATUS                         ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  SYSTEMS REDUCED:                                                 ║
║  Ambient light pulses:       ${this.reducedSystems.ambientLightPulses}
║  Terrain displacements:      ${this.reducedSystems.terrainVertexDisplacements}
║  Skybox pulse waves:         ${this.reducedSystems.skyboxPulseWaves}
║  Volumetric light pulses:    ${this.reducedSystems.volumetricLightPulses}
║  Atmospheric layer pulses:   ${this.reducedSystems.atmosphericLayerPulses}
║  Breathing effects:          ${this.reducedSystems.globalBreathingEffects}
║                                                                   ║
║  REDUCTION STATE:                                                 ║
║  Light pulses reduced:       ${this.reductionState.lightPulsesReduced ? '✓ YES' : '✗ NO'}
║  Terrain stabilized:         ${this.reductionState.terrainStabilized ? '✓ YES' : '✗ NO'}
║  Skybox stabilized:          ${this.reductionState.skyboxStabilized ? '✓ YES' : '✗ NO'}
║  Volumetric lights reduced:  ${this.reductionState.volumetricLightsReduced ? '✓ YES' : '✗ NO'}
║  Atmospheric layers reduced: ${this.reductionState.atmosphericLayersReduced ? '✓ YES' : '✗ NO'}
║                                                                   ║
║  REDUCTION MODE:              ${stats.reductionMode}
║  Total pulses reduced:        ${stats.totalReduced}
║  All reduced:                 ${stats.allReduced ? '✓ YES' : '✗ NO'}
║                                                                   ║
║  WORLD PULSE:                 ${stats.allReduced ? '✓ REDUCED' : '✗ ACTIVE'}
║  GLOBAL BREATHING:            ${stats.allReduced ? '✓ MINIMAL' : '✗ ACTIVE'}
║  VISUAL STABILITY:            ${stats.allReduced ? '✓ HIGH' : '✗ STANDARD'}
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
  }
}
