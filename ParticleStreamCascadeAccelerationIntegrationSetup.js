/**
 * ParticleStreamCascadeAccelerationIntegrationSetup
 * ============================================================================
 * COMPLETE INTEGRATION SETUP: Cascade Acceleration + Particle System
 * 
 * This module sets up the complete integration chain:
 * CascadingHarmonicResonance → ParticleStreamCascadeAcceleration → WaveParticleEmitter
 * 
 * SETUP FLOW:
 * 1. Initialize CascadingHarmonicResonanceAmplification
 * 2. Initialize ParticleStreamCascadeAcceleration with cascade data
 * 3. Install integration patches into WaveParticleEmitter
 * 4. Set up console APIs for debugging
 * 5. Return system references for main.js
 * 
 * USAGE IN main.js:
 * ```
 * const cascadeAccelSetup = new ParticleStreamCascadeAccelerationIntegrationSetup(
 *   nodeDynamicMetrics, linkingSystem, waveParticleEmitter
 * );
 * 
 * await cascadeAccelSetup.initialize(scene, world);
 * 
 * // Get references for frame update
 * const { cascadingResonance, cascadeAccel, patch } = cascadeAccelSetup.getSystemReferences();
 * ```
 * 
 * ============================================================================
 */

import { CascadingHarmonicResonanceAmplification } from './CascadingHarmonicResonanceAmplification.js';
import { ParticleStreamCascadeAcceleration } from './ParticleStreamCascadeAcceleration.js';
import { ParticleStreamCascadeAccelerationIntegrationPatch } from './ParticleStreamCascadeAccelerationIntegrationPatch.js';
import { ParticleCascadeFlowDeflection } from './ParticleCascadeFlowDeflection.js';

export class ParticleStreamCascadeAccelerationIntegrationSetup {
  constructor(nodeDynamicMetrics, linkingSystem, waveParticleEmitter, config = {}) {
    this.nodeDynamicMetrics = nodeDynamicMetrics;
    this.linkingSystem = linkingSystem;
    this.waveParticleEmitter = waveParticleEmitter;

    this.config = {
      // System enable flags
      enableCascadingResonance: config.enableCascadingResonance ?? true,
      enableCascadeAcceleration: config.enableCascadeAcceleration ?? true,
      enableIntegrationPatch: config.enableIntegrationPatch ?? true,
      
      // Console API setup
      setupConsoleAPIs: config.setupConsoleAPIs ?? true,
      consoleAPIPrefix: config.consoleAPIPrefix ?? 'cascadeParticle',
      
      debugMode: config.debugMode ?? false,
    };

    // System references (initialized in setup)
    this.cascadingResonance = null;
    this.cascadeAccel = null;
    this.flowDeflection = null;
    this.integrationPatch = null;
    this.isInitialized = false;

    if (this.config.debugMode) {
      console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] Constructor initialized', this.config);
    }
  }

  /**
   * Initialize all cascade and particle acceleration systems
   * @param {THREE.Scene} scene - Three.js scene
   * @param {object} world - ATOMA world instance
   */
  async initialize(scene, world) {
    if (this.isInitialized) {
      console.warn('[ParticleStreamCascadeAccelerationIntegrationSetup] Already initialized');
      return;
    }

    try {
      console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] Starting initialization...');

      // Step 1: Initialize CascadingHarmonicResonanceAmplification
      if (this.config.enableCascadingResonance) {
        console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] Initializing CascadingHarmonicResonance...');
        
        try {
          // CascadingHarmonicResonanceAmplification expects the network (nodeDynamicMetrics)
          this.cascadingResonance = new CascadingHarmonicResonanceAmplification(
            this.nodeDynamicMetrics  // Network reference for topology querying
          );
          
          console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] ✓ CascadingHarmonicResonance initialized');
        } catch (err) {
          console.warn('[ParticleStreamCascadeAccelerationIntegrationSetup] CascadingHarmonicResonance initialization warning:', err.message);
          this.cascadingResonance = null;
        }
      }

      // Step 2: Initialize ParticleStreamCascadeAcceleration
      if (this.config.enableCascadeAcceleration && this.cascadingResonance) {
        console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] Initializing ParticleStreamCascadeAcceleration...');
        
        try {
          this.cascadeAccel = new ParticleStreamCascadeAcceleration(
            this.cascadingResonance,
            this.nodeDynamicMetrics,
            this.linkingSystem,
            this.waveParticleEmitter,
            {
              debugMode: this.config.debugMode,
              baseAccelerationRate: 1.0,
              maxAccelerationMultiplier: 3.0,
              depthExponent: 1.5,
            }
          );
          
          console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] ✓ ParticleStreamCascadeAcceleration initialized');
        } catch (err) {
          console.warn('[ParticleStreamCascadeAccelerationIntegrationSetup] ParticleStreamCascadeAcceleration initialization warning:', err.message);
          this.cascadeAccel = null;
        }
      } else if (this.config.enableCascadeAcceleration) {
        console.warn('[ParticleStreamCascadeAccelerationIntegrationSetup] Cannot initialize acceleration: cascading resonance not ready');
      }

      // Step 3: Initialize flow deflection system
      if (this.config.enableCascadeAcceleration && this.cascadingResonance) {
        console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] Initializing ParticleCascadeFlowDeflection...');
        
        try {
          this.flowDeflection = new ParticleCascadeFlowDeflection(
            this.cascadingResonance,
            this.nodeDynamicMetrics,
            this.linkingSystem,
            {
              debugMode: this.config.debugMode,
              deflectionStrength: 0.6,
              synergySensitivity: 0.4,
            }
          );
          
          console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] ✓ ParticleCascadeFlowDeflection initialized');
        } catch (err) {
          console.warn('[ParticleStreamCascadeAccelerationIntegrationSetup] Flow deflection initialization warning:', err.message);
          this.flowDeflection = null;
        }
      }

      // Step 4: Install integration patches
      if (this.config.enableIntegrationPatch && this.cascadeAccel && this.waveParticleEmitter) {
        console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] Installing integration patches...');
        
        try {
          this.integrationPatch = new ParticleStreamCascadeAccelerationIntegrationPatch(
            this.waveParticleEmitter,
            this.cascadeAccel,
            this.nodeDynamicMetrics,
            this.flowDeflection,
            {
              debugMode: this.config.debugMode,
              applyVelocityAcceleration: true,
              modifyLifetime: true,
              scaleIntensity: true,
              applyDirectionalDeflection: this.flowDeflection ? true : false,
            }
          );
          
          this.integrationPatch.installPatches();
          console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] ✓ Integration patches installed');
        } catch (err) {
          console.warn('[ParticleStreamCascadeAccelerationIntegrationSetup] Integration patch installation warning:', err.message);
          // Don't fail - cascade acceleration still works without patching
          this.integrationPatch = null;
        }
      } else if (this.config.enableIntegrationPatch) {
        console.warn('[ParticleStreamCascadeAccelerationIntegrationSetup] Cannot install patches: missing dependencies');
        this.integrationPatch = null;
      }

      // Step 5: Set up console APIs
      if (this.config.setupConsoleAPIs) {
        this._setupConsoleAPIs();
      }

      this.isInitialized = true;
      console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] ✅ Full initialization complete');

    } catch (err) {
      console.error('[ParticleStreamCascadeAccelerationIntegrationSetup] Initialization failed:', err);
      this.isInitialized = false;
      throw err;
    }
  }

  /**
   * Per-frame update: call this in main animation loop
   * @param {number} deltaTime - Frame delta time in seconds
   * @param {number} time - Current simulation time in seconds
   */
  update(deltaTime, time) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (!this.isInitialized) return;

    try {
      // Update cascading resonance (compute cascade propagation)
      if (this.cascadingResonance && typeof this.cascadingResonance.update === 'function') {
        this.cascadingResonance.update(deltaTime);
      }

      // Update cascade acceleration (recompute acceleration multipliers)
      if (this.cascadeAccel && typeof this.cascadeAccel.update === 'function') {
        this.cascadeAccel.update(deltaTime, time);
      }

      // Update flow deflection (recompute flow directions)
      if (this.flowDeflection && typeof this.flowDeflection.update === 'function') {
        this.flowDeflection.update(deltaTime, time);
      }
    } catch (err) {
      console.error('[ParticleStreamCascadeAccelerationIntegrationSetup] Update error:', err);
    }
  }

  /**
   * Get system references for use elsewhere (e.g., main.js)
   */
  getSystemReferences() {
    return {
      cascadingResonance: this.cascadingResonance,
      cascadeAccel: this.cascadeAccel,
      flowDeflection: this.flowDeflection,
      integrationPatch: this.integrationPatch,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * INTERNAL: Set up console APIs
   */
  _setupConsoleAPIs() {
    const prefix = this.config.consoleAPIPrefix;

    // Create comprehensive console API object
    const api = {
      // Cascade acceleration queries
      getAccelMult: (nodeId) => {
        if (!this.cascadeAccel) return null;
        return this.cascadeAccel.getAccelerationMultiplier(nodeId);
      },
      
      getLayerDepth: (nodeId) => {
        if (!this.cascadeAccel) return null;
        return this.cascadeAccel._getCachedLayerDepth(nodeId);
      },
      
      debugNode: (nodeId) => {
        if (!this.cascadeAccel) {
          console.warn(`[${prefix}] CascadeAccel not initialized`);
          return;
        }
        this.cascadeAccel._debugNode(nodeId);
      },

      // Configuration updates
      setBaseAccelerationRate: (rate) => {
        if (this.cascadeAccel) {
          this.cascadeAccel.config.baseAccelerationRate = rate;
          console.log(`[${prefix}] Base acceleration rate set to ${rate}`);
        }
      },
      
      setMaxAccelerationMultiplier: (mult) => {
        if (this.cascadeAccel) {
          this.cascadeAccel.config.maxAccelerationMultiplier = mult;
          console.log(`[${prefix}] Max acceleration multiplier set to ${mult}`);
        }
      },
      
      setDepthExponent: (exp) => {
        if (this.cascadeAccel) {
          this.cascadeAccel.config.depthExponent = exp;
          console.log(`[${prefix}] Depth exponent set to ${exp}`);
        }
      },

      // Patch control
      getPatchStatus: () => {
        if (!this.integrationPatch) return null;
        return this.integrationPatch.getStatus();
      },

      // Cascading resonance queries
      getCascadeStrength: (nodeId) => {
        const node = this.nodeDynamicMetrics.getNodeById(nodeId);
        return node?._cascadeStrength ?? 0;
      },
      
      getCascadeAmplitude: (nodeId) => {
        const node = this.nodeDynamicMetrics.getNodeById(nodeId);
        return node?._cascadeAmplitude ?? 0;
      },

      // Diagnostic
      status: () => {
        console.log(`[${prefix}] System Status:`, {
          initialized: this.isInitialized,
          cascadingResonance: this.cascadingResonance ? 'Active' : 'Inactive',
          cascadeAcceleration: this.cascadeAccel ? 'Active' : 'Inactive',
          flowDeflection: this.flowDeflection ? 'Active' : 'Inactive',
          integrationPatch: this.integrationPatch?.getStatus?.() ?? 'Inactive',
        });
      },

      help: () => {
        console.log(`[${prefix}] Available Commands:
          getAccelMult(nodeId) - Get acceleration multiplier for node
          getLayerDepth(nodeId) - Get cascade layer depth
          debugNode(nodeId) - Debug output for node
          setBaseAccelerationRate(rate) - Set base acceleration rate
          setMaxAccelerationMultiplier(mult) - Set max multiplier
          setDepthExponent(exp) - Set depth curve exponent
          status() - Show system status
          help() - Show this message`);
      },
    };

    // Attach to window for console access
    const apiName = `window.${prefix}`;
    window[prefix] = api;
    console.log(`[ParticleStreamCascadeAccelerationIntegrationSetup] Console API available at: ${apiName}`);

    // Also attach flow deflection console API
    if (this.flowDeflection) {
      ParticleCascadeFlowDeflection.setupConsoleAPI(this.flowDeflection);
    }
  }

  /**
   * Cleanup (if needed)
   */
  dispose() {
    if (this.integrationPatch) {
      this.integrationPatch.uninstallPatches();
    }
    this.isInitialized = false;
    console.log('[ParticleStreamCascadeAccelerationIntegrationSetup] Disposed');
  }
}

export default ParticleStreamCascadeAccelerationIntegrationSetup;
