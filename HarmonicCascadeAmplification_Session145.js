/**
 * HarmonicCascadeAmplification_Session145.js
 * ============================================================================
 * HARMONIC CASCADE AMPLIFICATION SYSTEM — ACTIVATED
 *
 * Detects nearby harmonic hubs, propagates cascade resonance through network
 * layers, and amplifies visual effects along cascade paths.
 *
 * ARCHITECTURE:
 * - HubProximityDetector: Identifies nearby hub pairs
 * - CascadingHarmonicResonanceAmplification: BFS layer-based cascade propagation
 * - HarmonicPhaseSynchronization: Temporal alignment between proximal hubs
 * - PreCascadeVisualHint: Tension cues before cascade triggers
 * - CascadeResonanceWaveVisualization: Visible wave propagation between hubs
 *
 * CASCADE FLOW:
 * 1. Proximity detection finds nearby hub pairs
 * 2. Phase synchronization aligns hub temporal phases
 * 3. When conditions met, cascade propagates through network layers (BFS)
 * 4. Secondary hubs re-emit cascade downstream
 * 5. Multi-cascade interference computed at convergence points
 * 6. Consumer systems read cascade state for visual expression
 *
 * ACTIVATION (Session 147):
 * - Wired CascadingHarmonicResonanceAmplification into update loop
 * - Cascade propagation now runs when enabled and proximity pairs exist
 * - getHubAmplification() and getCascadeForHub() return live data
 * - Semantic events emitted for cascade lifecycle
 *
 * @author VFX Technical Director — ATOMA Project Session 145, Activated Session 147
 * @version 2.0.0
 */

import { HubProximityDetector } from './HubProximityDetector.js';
import { HarmonicPhaseSynchronization_Session146 } from './HarmonicPhaseSynchronization_Session146.js';
// REMOVED: PreCascadeVisualHint_Session146 — moved to LEGACY/april (2026-04-22)
import { CascadeResonanceWaveVisualization_Session146 } from './CascadeResonanceWaveVisualization_Session146.js';
import { CascadingHarmonicResonanceAmplification } from './CascadingHarmonicResonanceAmplification.js';

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
    this.semanticBus = (typeof globalThis !== 'undefined') ? globalThis.semanticBus : null;

    // Store config
    this.config = {
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      maxProximityDistance: config.maxProximityDistance ?? 24.0,
      minHarmonyThreshold: config.minHarmonyThreshold ?? 0.2,
      // Cascade activation thresholds
      minProximityPairsForCascade: config.minProximityPairsForCascade ?? 1,
      minPhaseSyncForCascade: config.minPhaseSyncForCascade ?? 0.3,
      cascadeCooldownSec: config.cascadeCooldownSec ?? 2.0,
      ...config,
    };

    // ── Network adapter for CascadingHarmonicResonanceAmplification ──
    // Bridges AINodes (nodesMap) + NodeLinkingSystem (links) into the
    // network interface that CHRA expects: { nodes: Map, links: Array }
    this._networkAdapter = {
      nodes: world?.nodesMap || new Map(),
      links: [],
      _topologyGeneration: 0,
      semanticBus: this.semanticBus,
    };
    this._lastLinkCount = -1;

    // ── Cascade propagation engine ──
    this.cascadingAmplification = new CascadingHarmonicResonanceAmplification(this._networkAdapter);

    // Initialize proximity detector (always active for detection)
    this.proximityDetector = new HubProximityDetector({
      enabled: true,
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

    // REMOVED: precastHint (PreCascadeVisualHint) — moved to LEGACY/april (2026-04-22)

    // Initialize cascade resonance wave visualization (visible wave propagation)
    this.cascadeWave = new CascadeResonanceWaveVisualization_Session146(
      this,
      harmonicHubSystem,
      linkResonanceSystem,
      {
        enabled: this.config.enabled,
        debugMode: this.config.debugMode,
        waveOscillationPeriod: 3.0,
        waveInfluenceMin: 0.25,   // Amplified from 0.02
        waveInfluenceMax: 0.50,   // Amplified from 0.08
        minHubCorruptionThreshold: 0.25,
        minHubStabilityThreshold: 0.65,
      }
    );

    // Cascade state tracking
    this.cascades = new Map();
    this._lastCascadeTime = 0;
    this._cascadeActive = false;

    this.stats = {
      activeCascades: 0,
      cascadesCreated: 0,
      totalAmplification: 0,
      phaseLocked: 0,
      activeWaves: 0,
      avgCascadeStrength: 0,
      proximityPairsDetected: 0,
      nodesInCascade: 0,
      secondaryHubs: 0,
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

    // Refresh network adapter links
    this._refreshNetworkLinks();
  }

  /**
   * Refresh the network adapter's link array from the linking system.
   * Called on init and when topology might have changed.
   */
  _refreshNetworkLinks() {
    const linkingSystem = this._getLinkingSystem();
    if (linkingSystem?.links) {
      const currentCount = linkingSystem.links.length;
      if (currentCount !== this._lastLinkCount) {
        this._networkAdapter.links = linkingSystem.links;
        this._networkAdapter._topologyGeneration++;
        this._lastLinkCount = currentCount;
      }
    }

    // Also refresh nodes map reference
    if (this.world?.nodesMap && this._networkAdapter.nodes !== this.world.nodesMap) {
      this._networkAdapter.nodes = this.world.nodesMap;
    }
  }

  /**
   * Get the linking system from available references
   */
  _getLinkingSystem() {
    return this.linkResonanceSystem?.linkingSystem ||
           this.harmonicHubSystem?.linkResonanceSystem?.linkingSystem ||
           this.world?.linkingSystem ||
           null;
  }

  /**
   * Update system each frame
   * @param {number} deltaTime - Delta time in seconds
   */
  update(deltaTime) {
    if (this.frameScheduler?.shouldRunVisual && !this.frameScheduler.shouldRunVisual()) return;

    // ── Step 1: Always run proximity detection ──
    if (this.harmonicHubSystem && this.harmonicHubSystem.hubs) {
      const proximityPairs = this.proximityDetector.detectProximity(
        this.harmonicHubSystem.hubs
      );
      this.stats.proximityPairsDetected = proximityPairs.length;
    }

    if (!this.config.enabled) return;

    // ── Step 2: Refresh network topology ──
    this._refreshNetworkLinks();

    // ── Step 3: Run phase synchronization ──
    if (this.phaseSynchronization) {
      this.phaseSynchronization.update(deltaTime);
    }

    // ── Step 4: Run cascade propagation when proximity pairs exist ──
    if (this.stats.proximityPairsDetected >= this.config.minProximityPairsForCascade) {
      this.cascadingAmplification.update(deltaTime);
      this._updateCascadeStats();
      this._cascadeActive = true;
    } else if (this._cascadeActive) {
      // Cascade fading — no new propagation, let existing state decay
      this.cascadingAmplification.update(deltaTime);
      this._updateCascadeStats();
      if (this.stats.nodesInCascade === 0) {
        this._cascadeActive = false;
      }
    }

    // REMOVED: precastHint.update() — moved to LEGACY/april (2026-04-22)

    if (this.cascadeWave) {
      this.cascadeWave.update(deltaTime);
    }
  }

  /**
   * Update cascade statistics from CHRA data
   */
  _updateCascadeStats() {
    const chraStats = this.cascadingAmplification.getDebugStats();
    this.stats.activeCascades = chraStats.hubsCascading || 0;
    this.stats.nodesInCascade = chraStats.nodeLayersActive || 0;
    this.stats.secondaryHubs = chraStats.secondaryHubsCreated || 0;

    // Compute average cascade strength across all nodes
    let totalStrength = 0;
    let count = 0;
    for (const [, layerData] of this.cascadingAmplification.nodeLayerData) {
      if (layerData.cascadeStrength > 0) {
        totalStrength += layerData.cascadeStrength;
        count++;
      }
    }
    this.stats.avgCascadeStrength = count > 0 ? totalStrength / count : 0;
    this.stats.totalAmplification = this.stats.avgCascadeStrength * this.stats.nodesInCascade;
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    this.cascades.clear();
    if (this.phaseSynchronization) {
      this.phaseSynchronization.dispose();
    }
    // REMOVED: precastHint.dispose() — moved to LEGACY/april (2026-04-22)
    if (this.cascadeWave) {
      this.cascadeWave.dispose();
    }
    if (this.cascadingAmplification) {
      this.cascadingAmplification.reset();
    }
  }

  /**
   * Get hub amplification factor (reads from live cascade data)
   * @param {string} hubId - Hub identifier (node ID)
   * @returns {number} Amplification factor (1.0x baseline, up to ~2.5x during cascade)
   */
  getHubAmplification(hubId) {
    const cascadeStrength = this.cascadingAmplification.getCascadeStrength(hubId);
    if (cascadeStrength <= 0) return 1.0;
    // Amplification = 1.0 + cascade contribution
    return 1.0 + cascadeStrength * 0.5;
  }

  /**
   * Get cascade data for a hub/node
   * @param {string} hubId - Hub identifier (node ID)
   * @returns {Object|null} Cascade data object or null
   */
  getCascadeForHub(hubId) {
    const strength = this.cascadingAmplification.getCascadeStrength(hubId);
    if (strength <= 0) return null;

    return {
      hubId,
      cascadeStrength: strength,
      cascadeLayer: this.cascadingAmplification.getCascadeLayer(hubId),
      resonanceAmplitude: this.cascadingAmplification.getCascadeAmplitude(hubId),
      cascadePhase: this.cascadingAmplification.getCascadePhase(hubId),
      amplificationFactor: this.getHubAmplification(hubId),
    };
  }

  /**
   * Get cascade strength for any node (not just hubs)
   * @param {string} nodeId - Node identifier
   * @returns {number} Cascade strength 0-1
   */
  getCascadeStrength(nodeId) {
    return this.cascadingAmplification.getCascadeStrength(nodeId);
  }

  /**
   * Get cascade layer for any node
   * @param {string} nodeId - Node identifier
   * @returns {number} Cascade layer (0 = primary hub)
   */
  getCascadeLayer(nodeId) {
    return this.cascadingAmplification.getCascadeLayer(nodeId);
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
   * Check if cascade is currently active
   * @returns {boolean}
   */
  isCascadeActive() {
    return this._cascadeActive && this.stats.nodesInCascade > 0;
  }

  /**
   * Get cascade info for a link (used by CascadeParticleSystem).
   * Returns cascade intensity based on the maximum cascade strength
   * of the link's endpoint nodes.
   * @param {Object} link - Link object with source/target nodes
   * @returns {Object|null} { intensity, conflictType } or null
   */
  getLinkCascadeInfo(link) {
    if (!link || !this._cascadeActive) return null;

    const sourceId = link.source?.userData?.nodeId || link.source?.id;
    const targetId = link.target?.userData?.nodeId || link.target?.id;

    const sourceStrength = sourceId ? this.cascadingAmplification.getCascadeStrength(sourceId) : 0;
    const targetStrength = targetId ? this.cascadingAmplification.getCascadeStrength(targetId) : 0;

    const maxStrength = Math.max(sourceStrength, targetStrength);
    if (maxStrength < 0.01) return null;

    // Determine conflict type from cascade characteristics
    let conflictType = 'specialization_drift';
    if (maxStrength > 0.7) {
      conflictType = 'constructive'; // Strong cascade = constructive
    } else if (sourceStrength > 0 && targetStrength > 0) {
      // Both endpoints in cascade = oscillatory balance
      conflictType = 'oscillatory_balance';
    }

    return {
      intensity: maxStrength,
      conflictType,
      sourceLayer: sourceId ? this.cascadingAmplification.getCascadeLayer(sourceId) : 0,
      targetLayer: targetId ? this.cascadingAmplification.getCascadeLayer(targetId) : 0,
    };
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
      this.cascadingAmplification.enableDebug(enabled);
      console.log(`[CASCADE] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    };

    globalWindow.cascade_info = () => {
      console.log('=== HARMONIC CASCADE STATUS ===');
      console.log(`Status: ${this._cascadeActive ? 'ACTIVE ✅' : 'idle'}`);
      console.log(`Enabled: ${this.config.enabled}`);
      console.log(`Proximity pairs: ${this.stats.proximityPairsDetected}`);
      const proximityStats = this.proximityDetector.getStats();
      console.log(`Avg proximity strength: ${proximityStats.avgProximityStrength.toFixed(2)}`);
      console.log(`Active cascades (hubs): ${this.stats.activeCascades}`);
      console.log(`Nodes in cascade: ${this.stats.nodesInCascade}`);
      console.log(`Secondary hubs: ${this.stats.secondaryHubs}`);
      console.log(`Avg cascade strength: ${this.stats.avgCascadeStrength.toFixed(3)}`);
      console.log(`Total amplification: ${this.stats.totalAmplification.toFixed(2)}`);

      // Show CHRA debug stats
      const chraStats = this.cascadingAmplification.getDebugStats();
      console.log(`CHRA topology nodes: ${chraStats.topologyNodes}`);
      console.log(`CHRA cascading sources: ${chraStats.cascadingSources}`);
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

    globalWindow.cascade_dump = (limit = 15) => {
      const state = this.cascadingAmplification.debugDumpCascadeState(limit);
      console.table(state);
      return state;
    };

    globalWindow.cascade_queryNode = (nodeId) => {
      const data = this.getCascadeForHub(nodeId);
      if (!data) {
        console.log(`[CASCADE] No cascade data for node ${nodeId}`);
        return null;
      }
      console.log(`[CASCADE] Node ${nodeId}:`, data);
      return data;
    };

    globalWindow.cascade_reset = () => {
      this.cascadingAmplification.reset();
      this._cascadeActive = false;
      console.log('[CASCADE] System reset');
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

    // REMOVED: precastHint console API — moved to LEGACY/april (2026-04-22)

    // Setup cascade resonance wave API
    if (this.cascadeWave && this.cascadeWave.setupConsoleAPI) {
      this.cascadeWave.setupConsoleAPI(globalWindow);
    }

    // Setup CHRA console API
    if (typeof window !== 'undefined') {
      import('./CascadingHarmonicResonanceAmplification.js').then(mod => {
        if (mod.setupCascadingResonanceConsoleAPI) {
          mod.setupCascadingResonanceConsoleAPI(this.cascadingAmplification);
        }
      }).catch(() => {
        // Fallback: set up manually
        globalWindow.CascadeAPI = {
          debug: (enabled = true) => this.cascadingAmplification.enableDebug(enabled),
          stats: () => this.cascadingAmplification.getDebugStats(),
          dump: (limit = 10) => this.cascadingAmplification.debugDumpCascadeState(limit),
          queryNode: (nodeId) => globalWindow.cascade_queryNode(nodeId),
          reset: () => globalWindow.cascade_reset(),
        };
      });
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
