// SAFE SKELETON — Session 145
// Cascade amplification logic with proximity detection foundation
// This file exists to guarantee stable ES module loading

import { HubProximityDetector } from './HubProximityDetector.js';
import { HarmonicPhaseSynchronization_Session146 } from './HarmonicPhaseSynchronization_Session146.js';
import { PreCascadeVisualHint_Session146 } from './PreCascadeVisualHint_Session146.js';
import { CascadeResonanceWaveVisualization_Session146 } from './CascadeResonanceWaveVisualization_Session146.js';

/**
 * Harmonic Cascade Amplification System — Safe Skeleton + Proximity Detection
 * 
 * Detects nearby harmonic hubs and amplifies their resonance effects.
 * Current status: Proximity detection active, cascades disabled.
 * 
 * This implementation:
 * - Parses correctly as an ES module
 * - Can be imported without side effects
 * - Detects hub proximity (no effects yet)
 * - Prepares ground for future cascade activation
 * - Provides debugging API for proximity inspection
 * 
 * Full cascade amplification can be enabled later when needed.
 */

export class HarmonicCascadeAmplification_Session145 {
  /**
   * Constructor
   * @param {THREE.Scene} scene - Three.js scene
   * @param {Object} world - World/AINodes reference
   * @param {Object} harmonicHubSystem - Hub system reference
   * @param {Object} linkResonanceSystem - Link resonance reference
   * @param {Object} nodeAuraSystem - Node aura system reference (for visual hints)
   * @param {Object} config - Configuration object
   */
  constructor(scene, world, harmonicHubSystem, linkResonanceSystem, nodeAuraSystem, config = {}) {
    this.scene = scene;
    this.world = world;
    this.harmonicHubSystem = harmonicHubSystem;
    this.linkResonanceSystem = linkResonanceSystem;
    this.nodeAuraSystem = nodeAuraSystem;
    
    // Store config
    this.config = {
      enabled: config.enabled ?? false,
      debugMode: config.debugMode ?? false,
      maxProximityDistance: config.maxProximityDistance ?? 24.0,
      minHarmonyThreshold: config.minHarmonyThreshold ?? 0.2,
      ...config,
    };
    
    // Initialize proximity detector (always active for detection)
    this.proximityDetector = new HubProximityDetector({
      enabled: true,  // Detection always on
      debugMode: this.config.debugMode,
      maxProximityDistance: this.config.maxProximityDistance,
      minHarmonyThreshold: this.config.minHarmonyThreshold,
      minStabilityThreshold: 0.65,
      maxCorruptionThreshold: 0.25,
    });
    
    // Initialize phase synchronization (runs after proximity detection)
    this.phaseSynchronization = new HarmonicPhaseSynchronization_Session146(
      this,
      harmonicHubSystem,
      {
        enabled: this.config.enabled,
        debugMode: this.config.debugMode,
        syncStrength: 2.0,
        damping: 0.85,
      }
    );
    
    // Initialize pre-cascade visual hint system (provides subtle tension cues)
    this.precastHint = new PreCascadeVisualHint_Session146(
      this,
      harmonicHubSystem,
      nodeAuraSystem,
      linkResonanceSystem,
      {
        enabled: this.config.enabled,
        debugMode: this.config.debugMode,
        hintStrengthMult: 0.15,
      }
    );
    
    // Initialize cascade resonance wave visualization (ghost-level wave suggestion)
    this.cascadeWave = new CascadeResonanceWaveVisualization_Session146(
      this,
      harmonicHubSystem,
      linkResonanceSystem,
      {
        enabled: this.config.enabled,
        debugMode: this.config.debugMode,
        waveOscillationPeriod: 3.0,
        waveInfluenceMin: 0.02,
        waveInfluenceMax: 0.08,
        minHubCorruptionThreshold: 0.25,
        minHubStabilityThreshold: 0.65,
      }
    );
    
    // Minimal state
    this.cascades = new Map();
    this.stats = {
      activeCascades: 0,
      cascadesCreated: 0,
      totalAmplification: 0,
      phaseLocked: 0,
      activeWaves: 0,
      avgCascadeStrength: 0,
      proximityPairsDetected: 0,
    };
  }

  /**
   * Initialize system
   */
  init() {
    // Initialize phase synchronization
    if (this.phaseSynchronization) {
      this.phaseSynchronization.init();
    }
    
    // Pre-cascade hint system (no init needed, starts dormant)
  }

  /**
   * Update system each frame
   * @param {number} deltaTime - Delta time in seconds
   */
  update(deltaTime) {
    if (this.frameScheduler?.shouldRunVisual && !this.frameScheduler.shouldRunVisual()) return;
    // Always run proximity detection (even if cascades disabled)
    if (this.harmonicHubSystem && this.harmonicHubSystem.hubs) {
      const proximityPairs = this.proximityDetector.detectProximity(
        this.harmonicHubSystem.hubs
      );
      this.stats.proximityPairsDetected = proximityPairs.length;
    }
    
    // Run phase synchronization (when enabled)
    // Phase sync provides temporal alignment foundation for future cascades
    if (this.config.enabled && this.phaseSynchronization) {
      this.phaseSynchronization.update(deltaTime);
    }
    
    // Run pre-cascade visual hint system (when enabled)
    // Provides subtle visual tension cues without gameplay impact
    if (this.config.enabled && this.precastHint) {
      this.precastHint.update(deltaTime);
    }
    
    // Run cascade resonance wave visualization (when enabled)
    // Suggests energy pathways between synchronized hubs without transferring energy
    if (this.config.enabled && this.cascadeWave) {
      this.cascadeWave.update(deltaTime);
    }
    
    // Future cascade amplification logic here (currently disabled)
    // if (this.config.enabled) { ... }
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    this.cascades.clear();
    if (this.phaseSynchronization) {
      this.phaseSynchronization.dispose();
    }
    if (this.precastHint) {
      this.precastHint.dispose();
    }
    if (this.cascadeWave) {
      this.cascadeWave.dispose();
    }
  }

  /**
   * Get hub amplification factor
   * @param {string} hubId - Hub identifier
   * @returns {number} Amplification factor (1.0x baseline)
   */
  getHubAmplification(hubId) {
    return 1.0;
  }

  /**
   * Get cascade for hub
   * @param {string} hubId - Hub identifier
   * @returns {Object|null} Cascade object or null
   */
  getCascadeForHub(hubId) {
    return null;
  }

  /**
   * Get proximity pairs
   * @returns {Array} Array of proximity pair objects
   */
  getProximityPairs() {
    return this.proximityDetector.proximityPairs;
  }

  /**
   * Get proximity stats
   * @returns {Object} Proximity detection statistics
   */
  getProximityStats() {
    return this.proximityDetector.getStats();
  }

  /**
   * Check if two hubs are proximal
   * @param {string} hubAId - First hub ID
   * @param {string} hubBId - Second hub ID
   * @returns {boolean} True if proximal
   */
  isHubsProximal(hubAId, hubBId) {
    return this.proximityDetector.isProximal(hubAId, hubBId);
  }

  /**
   * Get hubs proximal to a specific hub
   * @param {string} hubId - Hub ID
   * @returns {Array} Array of proximal hub IDs
   */
  getProximalHubs(hubId) {
    return this.proximityDetector.getProximalHubs(hubId);
  }

  /**
   * Setup console debugging API
   * @param {Object} globalWindow - Window object for API exposure
   */
  setupConsoleAPI(globalWindow) {
    if (!globalWindow) return;
    
    // Global objects
    globalWindow.CASCADE_CONFIG = this.config;
    globalWindow.CASCADE_STATS = this.stats;
    globalWindow.CASCADE_HUBS = this.cascades;
    
    // Cascade system commands
    globalWindow.cascade_toggleDebug = (enabled = true) => {
      this.config.debugMode = enabled;
      this.proximityDetector.config.debugMode = enabled;
      console.log(`[CASCADE] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    };
    
    globalWindow.cascade_info = () => {
      console.log('=== HARMONIC CASCADE STATUS ===');
      console.log(`Status: Proximity detection active (cascades disabled)`);
      console.log(`Proximity pairs detected: ${this.stats.proximityPairsDetected}`);
      const proximityStats = this.proximityDetector.getStats();
      console.log(`Avg proximity strength: ${proximityStats.avgProximityStrength.toFixed(2)}`);
      console.log(`Active Cascades: 0`);
      console.log(`Amplification: 1.0x baseline`);
    };
    
    globalWindow.cascade_tune = (key, value) => {
      if (key in this.config) {
        this.config[key] = value;
        if (key === 'maxProximityDistance' || key === 'minHarmonyThreshold') {
          this.proximityDetector.config[key] = value;
        }
        console.log(`[CASCADE] ${key} = ${value}`);
      }
    };
    
    // Proximity detection commands
    globalWindow.cascadeStatus = () => {
      this.proximityDetector.setupConsoleAPI(globalWindow);
      globalWindow.proximity_info();
    };
    
    globalWindow.toggleCascadeDebug = (enabled = true) => {
      globalWindow.cascade_toggleDebug(enabled);
    };
    
    globalWindow.getHubProximityStats = () => {
      return this.getProximityStats();
    };
    
    globalWindow.getProximityPairs = () => {
      const pairs = this.getProximityPairs();
      console.log(`Found ${pairs.length} proximity pairs:`);
      for (const pair of pairs) {
        console.log(
          `  ${pair.hubAId} <-> ${pair.hubBId}: ` +
          `distance=${pair.distance.toFixed(1)}, ` +
          `harmony=${pair.combinedHarmony.toFixed(2)}, ` +
          `strength=${pair.proximityStrength.toFixed(2)}`
        );
      }
      return pairs;
    };
    
    // Setup proximity detector's own API
    this.proximityDetector.setupConsoleAPI(globalWindow);
    
    // Setup phase synchronization API
    if (this.phaseSynchronization && this.phaseSynchronization.setupConsoleAPI) {
      this.phaseSynchronization.setupConsoleAPI(globalWindow);
    }
    
    // Setup pre-cascade hint API
    if (this.precastHint && this.precastHint.setupConsoleAPI) {
      this.precastHint.setupConsoleAPI(globalWindow);
    }
    
    // Setup cascade resonance wave API
    if (this.cascadeWave && this.cascadeWave.setupConsoleAPI) {
      this.cascadeWave.setupConsoleAPI(globalWindow);
    }
  }
}

/**
 * Console API setup function
 * @param {Object} globalWindow - Window object
 * @param {HarmonicCascadeAmplification_Session145} cascadeSystem - Cascade system instance
 */
export function setupCascadeConsoleAPI(globalWindow, cascadeSystem) {
  if (cascadeSystem && cascadeSystem.setupConsoleAPI) {
    cascadeSystem.setupConsoleAPI(globalWindow);
  }
}
