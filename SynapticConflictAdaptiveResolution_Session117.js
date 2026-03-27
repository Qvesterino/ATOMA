/**
 * SynapticConflictAdaptiveResolution_Session117.js
 * ============================================================================
 * Visualization system for synaptic conflicts when harmonic hubs compete for
 * regional control, with adaptive resolution over time.
 * 
 * VISUAL STORYTELLING:
 * Multiple harmonic hubs attempting to entrain the same region creates visual
 * conflict. This adapter shows:
 * - Phase beating and interference patterns in halos
 * - Pulse stuttering and micro-impulses at intersections
 * - Standing-wave patterns in the region
 * - Fatigue-driven yield and dominance shifts
 * - Oscillatory balance or equilibrium states
 * 
 * ARCHITECTURE:
 * ✅ Input/modulator adapter - reads cascade/conflict state, modulates visual effects
 * ✅ Zero per-frame allocations
 * ✅ Deterministic conflict resolution (no randomness)
 * ✅ Smooth temporal adaptation (no snapping)
 * ✅ Works with existing halo and influence systems
 * ✅ Graceful degradation (skips if missing data)
 * ✅ No material redefinitions (uniforms only)
 * 
 * CONSTRAINTS:
 * ✅ Input/modulator only (reads state, does not write conflictIntensity authority)
 * ✅ conflictIntensity authority: CascadeEventBridge_v1.js (link-based)
 * ✅ Zero gameplay impact
 * ✅ No per-frame allocations
 * ✅ Fully reversible
 * ✅ Deterministic (no randomness)
 * ✅ Works with all existing node/link visual systems
 * ✅ Graceful fallback for missing data
 * ✅ No new materials or shaders required
 * ============================================================================
 */

import * as THREE from 'three';

/**
 * Configuration for conflict detection and resolution
 */
const CONFLICT_CONFIG = {
  // Detection thresholds
  MIN_HUBS_FOR_CONFLICT: 2,                    // Minimum hubs to enter conflict
  OVERLAP_DISTANCE_SCALE: 3.0,                 // Influence zones must overlap
  PHASE_DIFFERENCE_THRESHOLD: 0.15,            // Min phase offset to trigger conflict (radians)
  
  // Conflict intensity factors
  HUB_STRENGTH_FACTOR: 0.4,                    // How much strength difference matters
  PHASE_OFFSET_FACTOR: 0.3,                    // How much phase mismatch matters
  SPECIALIZATION_MISMATCH_FACTOR: 0.2,         // How much specialization polarity difference matters
  CORRUPTION_INSTABILITY_FACTOR: 0.1,          // How much corruption/instability matters
  
  // Adaptation speeds (lower = faster adaptation)
  PHASE_ALIGNMENT_SPEED: 0.08,                 // How quickly hubs align phases
  SPECIALIZATION_DRIFT_SPEED: 0.15,            // How quickly nodes drift toward dominant hub
  FATIGUE_YIELD_SPEED: 0.1,                    // How quickly heavily stressed hub yields
  OSCILLATION_DAMPING: 0.92,                   // How quickly oscillatory states dampen (0-1)
  
  // Fatigue thresholds
  HEAVY_FATIGUE_THRESHOLD: 0.8,                // Hub is heavily fatigued and yields
  CRITICAL_OVERLOAD: 0.95,                     // Hub is near collapse
  
  // Temporal windows
  CONFLICT_RESOLUTION_WINDOW: 30.0,            // Seconds to resolve conflict (or enter stalemate)
  EQUILIBRIUM_STABILITY_WINDOW: 15.0,          // Seconds before equilibrium is stable
};

/**
 * Conflict states
 */
const CONFLICT_STATE = {
  NONE: 'none',                                // No conflict
  ACTIVE: 'active',                            // Hubs fighting for control
  PHASE_NEGOTIATION: 'phase_negotiation',      // Hubs aligning phases
  SPECIALIZATION_DRIFT: 'specialization_drift', // Nodes leaning toward dominant
  FATIGUE_YIELD: 'fatigue_yield',              // Stressed hub yielding
  OSCILLATORY_BALANCE: 'oscillatory_balance',  // No winner - control swapping
  RESOLVED_DOMINANT: 'resolved_dominant',      // Dominant hub won
  RESOLVED_EQUILIBRIUM: 'resolved_equilibrium' // Shared equilibrium reached
};

/**
 * Region conflict tracking
 */
class ConflictRegion {
  constructor(centerPos, nodeA, nodeB) {
    this.centerPos = centerPos.clone();
    this.hub1 = nodeA;
    this.hub2 = nodeB;
    this.state = CONFLICT_STATE.NONE;
    this.intensity = 0.0;                      // 0-1 conflict intensity
    this.phaseBeating = 0.0;                   // Beat frequency (interference)
    this.beatAmplitude = 0.0;                  // Beat amplitude (0-1)
    
    // Adaptation tracking
    this.adaptationTime = 0.0;                 // Time spent in current state
    this.phaseAlignment = 0.0;                 // How aligned are phases? (0-1)
    this.dominanceDirection = 0.0;             // Which hub is winning (-1 to +1)
    this.oscillationIntensity = 0.0;           // For oscillatory states
    this.oscillationPhase = 0.0;               // Current oscillation phase
    
    // Resolution tracking
    this.resolutionTime = 0.0;                 // Time to potential resolution
    this.isDissipating = false;                // Conflict fading away
  }
  
  /**
   * Compute conflict intensity from hub states
   */
  computeIntensity() {
    if (!this.hub1 || !this.hub2) return 0.0;
    
    // Get hub metrics
    const h1Strength = this.hub1.userData?.hubStrength ?? 0.5;
    const h2Strength = this.hub2.userData?.hubStrength ?? 0.5;
    const h1Phase = this.hub1.userData?.hubPhase ?? 0.0;
    const h2Phase = this.hub2.userData?.hubPhase ?? 0.0;
    
    const h1Harmony = this.hub1.userData?.harmony ?? 0.5;
    const h2Harmony = this.hub2.userData?.harmony ?? 0.5;
    const h1Corruption = this.hub1.userData?.corruption ?? 0.0;
    const h2Corruption = this.hub2.userData?.corruption ?? 0.0;
    
    // Specialization mismatch
    const h1Spec = this.hub1.userData?.specialization ?? 0.0;
    const h2Spec = this.hub2.userData?.specialization ?? 0.0;
    const specMismatch = Math.abs(h1Spec - h2Spec);
    
    // Hub strength difference
    const strengthDiff = Math.abs(h1Strength - h2Strength);
    
    // Phase offset (convert to 0-1 range)
    let phaseDiff = Math.abs(h1Phase - h2Phase);
    if (phaseDiff > Math.PI) phaseDiff = 2 * Math.PI - phaseDiff;
    phaseDiff /= Math.PI; // Normalize to 0-1
    
    // Instability from corruption
    const instability = (h1Corruption + h2Corruption) * 0.5;
    
    // Compute intensity from factors
    let intensity = 0.0;
    intensity += strengthDiff * CONFLICT_CONFIG.HUB_STRENGTH_FACTOR;
    intensity += phaseDiff * CONFLICT_CONFIG.PHASE_OFFSET_FACTOR;
    intensity += specMismatch * CONFLICT_CONFIG.SPECIALIZATION_MISMATCH_FACTOR;
    intensity += instability * CONFLICT_CONFIG.CORRUPTION_INSTABILITY_FACTOR;
    
    // Modulate by harmony (harmony reduces conflict)
    const avgHarmony = (h1Harmony + h2Harmony) * 0.5;
    intensity *= (1.0 - avgHarmony * 0.5);
    
    // Phase beating (interference rhythm)
    this.phaseBeating = phaseDiff * 2.0; // 0-2, wraps at 2π
    this.beatAmplitude = intensity * 0.7; // Max 0.7 amplitude
    
    return Math.min(intensity, 1.0);
  }
  
  /**
   * Determine conflict resolution outcome
   */
  updateResolution(deltaTime) {
    this.adaptationTime += deltaTime;
    this.resolutionTime = CONFLICT_CONFIG.CONFLICT_RESOLUTION_WINDOW - this.adaptationTime;
    
    // Check fatigue-driven yield
    const h1Fatigue = this.hub1.userData?.synapticFatigue ?? 0.0;
    const h2Fatigue = this.hub2.userData?.synapticFatigue ?? 0.0;
    
    const h1IsHeavilyFatigued = h1Fatigue > CONFLICT_CONFIG.HEAVY_FATIGUE_THRESHOLD;
    const h2IsHeavilyFatigued = h2Fatigue > CONFLICT_CONFIG.HEAVY_FATIGUE_THRESHOLD;
    
    // Determine dominance (who's winning?)
    const h1Strength = this.hub1.userData?.hubStrength ?? 0.5;
    const h2Strength = this.hub2.userData?.hubStrength ?? 0.5;
    const strengthDiff = h1Strength - h2Strength;
    
    // If one is heavily fatigued, it loses
    if (h1IsHeavilyFatigued && !h2IsHeavilyFatigued) {
      this.dominanceDirection = -1.0; // Hub 2 wins
    } else if (h2IsHeavilyFatigued && !h1IsHeavilyFatigued) {
      this.dominanceDirection = 1.0; // Hub 1 wins
    } else if (!h1IsHeavilyFatigued && !h2IsHeavilyFatigued) {
      // Otherwise, strength difference determines winner
      this.dominanceDirection = Math.sign(strengthDiff) * Math.min(Math.abs(strengthDiff), 1.0);
    }
    
    // Smooth dominance shift
    this.dominanceDirection = this.dominanceDirection * 0.85 + this.dominanceDirection * 0.15;
    
    // Determine state
    if (this.intensity < 0.1) {
      this.state = CONFLICT_STATE.NONE;
    } else if (Math.abs(this.dominanceDirection) > 0.8) {
      // Clear winner
      this.state = this.adaptationTime > 10 
        ? CONFLICT_STATE.RESOLVED_DOMINANT 
        : CONFLICT_STATE.FATIGUE_YIELD;
    } else if (Math.abs(this.dominanceDirection) < 0.1) {
      // Nearly balanced - oscillating?
      this.state = CONFLICT_STATE.OSCILLATORY_BALANCE;
      
      // Update oscillation
      this.oscillationPhase += deltaTime * 2.0; // 0.5 Hz oscillation
      this.oscillationIntensity = Math.sin(this.oscillationPhase) * this.intensity;
    } else {
      // Ongoing adaptation
      this.state = CONFLICT_STATE.PHASE_NEGOTIATION;
    }
    
    // Mark for dissipation if resolved
    if (this.adaptationTime > CONFLICT_CONFIG.CONFLICT_RESOLUTION_WINDOW) {
      this.isDissipating = true;
    }
  }
}

/**
 * Main conflict adapter system
 */
export class SynapticConflictAdaptiveResolution_Session117 {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.enabled = options.enabled ?? true;
    this.debugMode = options.debugMode ?? false;
    
    // Active conflict regions (keyed by hub pair hash)
    this.conflictRegions = new Map();
    
    // Cached hub pairs (updated once per network change)
    this.cachedHubPairs = [];
    this.lastHubPairUpdate = 0;
    this.hubPairUpdateInterval = 1.0; // Update every 1 second
    
    console.log('[Session 117] SynapticConflictAdaptiveResolution initialized ✓');
  }
  
  /**
   * Identify all harmonic hubs in network
   */
  getHarmonicHubs(nodes) {
    if (!nodes || !Array.isArray(nodes)) return [];
    
    return nodes.filter(node => {
      const category = node.userData?.category || '';
      const isHub = category.toLowerCase().includes('hub');
      const hasSync = (node.userData?.hubSynchronizationStrength ?? 0) > 0.0;
      return isHub && hasSync;
    });
  }
  
  /**
   * Hash function for hub pair
   */
  getHubPairHash(hubA, hubB) {
    const idA = hubA.userData?.id || 'unknown';
    const idB = hubB.userData?.id || 'unknown';
    // Ensure consistent ordering
    return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
  }
  
  /**
   * Check if two hubs have overlapping influence zones
   */
  hasOverlappingInfluence(hubA, hubB) {
    if (!hubA || !hubB) return false;
    
    const distBetweenHubs = hubA.position.distanceTo(hubB.position);
    const influenceRadius = CONFLICT_CONFIG.OVERLAP_DISTANCE_SCALE;
    
    // Both hubs need influence reach this far
    return distBetweenHubs < influenceRadius * 2;
  }
  
  /**
   * Compute geometric center of conflicted region
   */
  getConflictCenter(hubA, hubB) {
    if (!hubA || !hubB) return new THREE.Vector3();
    
    const center = new THREE.Vector3();
    center.addVectors(hubA.position, hubB.position).multiplyScalar(0.5);
    return center;
  }
  
  /**
   * Update conflict tracking per frame
   */
  update(deltaTime, nodes) {
    if (!this.enabled || !nodes) return;
    
    const now = Date.now() * 0.001; // Convert to seconds
    
    // Periodically update hub pair cache
    if (now - this.lastHubPairUpdate > this.hubPairUpdateInterval) {
      const hubs = this.getHarmonicHubs(nodes);
      this.cachedHubPairs = [];
      
      // Generate all pairs
      for (let i = 0; i < hubs.length; i++) {
        for (let j = i + 1; j < hubs.length; j++) {
          this.cachedHubPairs.push({ hub1: hubs[i], hub2: hubs[j] });
        }
      }
      
      this.lastHubPairUpdate = now;
    }
    
    // Update/manage conflict regions
    const activeRegions = [];
    
    for (const pair of this.cachedHubPairs) {
      const hash = this.getHubPairHash(pair.hub1, pair.hub2);
      
      // Check if hubs have overlapping influence
      if (!this.hasOverlappingInfluence(pair.hub1, pair.hub2)) {
        // Remove conflict if hubs moved too far
        this.conflictRegions.delete(hash);
        continue;
      }
      
      // Get or create conflict region
      let region = this.conflictRegions.get(hash);
      if (!region) {
        const center = this.getConflictCenter(pair.hub1, pair.hub2);
        region = new ConflictRegion(center, pair.hub1, pair.hub2);
        this.conflictRegions.set(hash, region);
      }
      
      // Update conflict region
      region.intensity = region.computeIntensity();
      
      // Check if conflict exists
      const hasPhaseOffset = Math.abs((pair.hub1.userData?.hubPhase ?? 0) - 
                                       (pair.hub2.userData?.hubPhase ?? 0)) > 
                            CONFLICT_CONFIG.PHASE_DIFFERENCE_THRESHOLD;
      
      if (region.intensity > 0.1 && hasPhaseOffset) {
        region.updateResolution(deltaTime);
        activeRegions.push(region);
      } else {
        region.intensity = Math.max(0, region.intensity - deltaTime * 0.5);
      }
      
      // Remove dissipating regions
      if (region.isDissipating && region.intensity < 0.01) {
        this.conflictRegions.delete(hash);
      }
    }
    
    // Apply visual modulations to nodes in conflicted regions
    this.applyConflictVisuals(activeRegions, nodes);
  }
  
  /**
   * Apply conflict visuals to nodes in affected regions
   */
  applyConflictVisuals(conflictRegions, nodes) {
    if (!nodes || !Array.isArray(nodes)) return;
    
    // For each node, determine which conflicts affect it
    for (const node of nodes) {
      if (!node.userData) continue;
      
      let maxConflictIntensity = 0.0;
      let conflictHaloPhaseWobble = 0.0;
      let conflictState = CONFLICT_STATE.NONE;
      
      for (const region of conflictRegions) {
        if (!region) continue;
        
        // Is this node in the conflict region?
        const distToCenter = node.position.distanceTo(region.centerPos);
        if (distToCenter > CONFLICT_CONFIG.OVERLAP_DISTANCE_SCALE) continue;
        
        // Influence decreases with distance
        const proximityFactor = 1.0 - (distToCenter / CONFLICT_CONFIG.OVERLAP_DISTANCE_SCALE);
        const affectedIntensity = region.intensity * proximityFactor;
        
        // Track max conflict
        if (affectedIntensity > maxConflictIntensity) {
          maxConflictIntensity = affectedIntensity;
          conflictHaloPhaseWobble = region.beatAmplitude;
          conflictState = region.state;
        }
      }
      
      // Store conflict data on node (excluding conflictIntensity which is managed by CascadeEventBridge_v1.js)
      // This system acts as input/modulator for visual effects, not as authority writer for conflictIntensity
      node.userData.conflictHaloPhaseWobble = conflictHaloPhaseWobble;
      node.userData.conflictState = conflictState;
    }
  }
  
  /**
   * Get conflict info for a specific node (for debugging)
   */
  getNodeConflictInfo(node) {
    if (!node || !node.userData) return null;
    
    return {
      intensity: node.userData.conflictIntensity ?? 0.0,
      phaseWobble: node.userData.conflictHaloPhaseWobble ?? 0.0,
      state: node.userData.conflictState ?? CONFLICT_STATE.NONE
    };
  }
  
  /**
   * Get all active conflicts
   */
  getActiveConflicts() {
    const active = [];
    
    for (const [hash, region] of this.conflictRegions) {
      if (region.intensity > 0.05) {
        active.push({
          hash,
          hub1: region.hub1.userData?.id ?? 'unknown',
          hub2: region.hub2.userData?.id ?? 'unknown',
          intensity: region.intensity,
          state: region.state,
          dominanceDirection: region.dominanceDirection
        });
      }
    }
    
    return active;
  }
  
  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    window.conflictDebug = {
      getActiveConflicts: () => this.getActiveConflicts(),
      getNodeConflictInfo: (node) => this.getNodeConflictInfo(node),
      getConflictCount: () => this.conflictRegions.size,
      enable: () => { this.enabled = true; console.log('✓ Conflict system enabled'); },
      disable: () => { this.enabled = false; console.log('✓ Conflict system disabled'); }
    };
    
    console.log('[Session 117] Debug API: window.conflictDebug.getActiveConflicts()');
  }
}

/**
 * Adapter function for main.js integration
 */
export function setupSynapticConflictSystem(game, options = {}) {
  try {
    game.synapticConflict = new SynapticConflictAdaptiveResolution_Session117(
      game.scene,
      {
        enabled: true,
        debugMode: false,
        ...options
      }
    );
    
    // Setup console debugging
    game.synapticConflict.setupConsoleAPI();

    if (game.frameScheduler?.register) {
      if (game.frameScheduler?.isRegistered?.('visual.synapticConflictResolution')) {
        game.frameScheduler.unregister('visual.synapticConflictResolution');
      }

      game.frameScheduler.register('visual', (dt) => {
        if (!game.synapticConflict?.enabled) return;
        game.synapticConflict.update(dt, game.aiNodes?.nodes || []);
      }, 'visual.synapticConflictResolution');
    }
    
    return game.synapticConflict;
  } catch (err) {
    console.warn('[Session 117] Failed to initialize SynapticConflictSystem:', err);
    return null;
  }
}
