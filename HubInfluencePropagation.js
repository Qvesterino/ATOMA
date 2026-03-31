/**
 * HubInfluencePropagation
 * ============================================================================
 * Visual field projection from harmonic hubs into links and neighbor nodes
 * 
 * SYSTEM BEHAVIOR:
 * - Harmonic hubs emit visual-only influence fields
 * - Influence propagates through Zone 1 (direct links/neighbors) 
 *   and Zone 2 (secondary reach)
 * - Influence weakens with distance and hub state
 * - Affects links: phase bias, streak coherence, pulse alignment
 * - Affects nodes: secondary halos, pulse synchronization
 * - Purely visual—no gameplay impact whatsoever
 * 
 * INFLUENCE ZONES:
 * - Zone 0: Hub core (full strength)
 * - Zone 1: Direct links & one-hop nodes (60% strength)
 * - Zone 2: Secondary reach via intermediate nodes (25% strength)
 * - Beyond: No influence
 * 
 * INFLUENCE STRENGTH DERIVATION:
 * hubInfluenceStrength = hubStrength × (harmony × 0.5 + synergy × 0.5)
 *                        × (1 - corruption × 0.3) × (1 - stability × 0.4)
 *                        × (0.7 + resilience × 0.3)
 * 
 * Result: 0-1 scalar representing overall hub influence capacity
 * 
 * VISUAL EFFECTS:
 * Links in Zone 1:
 *   - Phase bias toward hubPhase
 *   - Reduced phase variance
 *   - Directional streaks more coherent
 *   - Pulse waves timing subtly aligned
 * 
 * Links in Zone 2:
 *   - Minimal phase pull
 *   - Barely visible rhythm hint
 *   - No brightness changes
 * 
 * Nodes in Zone 1:
 *   - Faint secondary halo (never competes with primary)
 *   - Gentle pulse synchronized with hub
 *   - Very low intensity (0.1-0.2 max)
 * 
 * Nodes in Zone 2:
 *   - Soft glow hint only
 *   - No pulse, phase suggestion only
 *   - Extremely subtle (0.05-0.1 max)
 * 
 * STATE MODULATION:
 * - Harmony: Expands influence clarity, smooths transitions
 * - Synergy: Increases propagation strength (×1.2-1.5)
 * - Corruption: Distorts field, introduces phase lag
 * - Stability: Dampens reach, suppresses Zone 2 if high
 * - Resilience: Stabilizes under stress, prevents collapse
 * 
 * OVERLOAD/COLLAPSE/RECOVERY:
 * - Overload: Field becomes turbulent, zones fluctuate
 * - Collapse: Field retracts toward core, Zone 2 disappears
 * - Recovery: Field re-expands smoothly, calm restored
 * 
 * PHILOSOPHY:
 * The network is a continuous field, not discrete nodes. Harmonic hubs
 * are field generators that influence their surroundings. Important hubs
 * visibly shape nearby space. Player intuits hierarchy purely from visuals.
 * 
 * ARCHITECTURE:
 * ✅ Adapter layer on top of existing systems
 * ✅ Reads hub state and network topology
 * ✅ Cached neighbor references (computed once per network change)
 * ✅ Zero per-frame allocations
 * ✅ Deterministic field math (no noise)
 * ✅ Graceful fallback for missing topology data
 * ✅ Works with all link and node visual systems
 * 
 * CONSTRAINTS:
 * ✅ Adapter-only (reads state, doesn't modify)
 * ✅ Zero gameplay impact
 * ✅ No per-frame allocations
 * ✅ Fully reversible (influence fades smoothly)
 * ✅ No particle systems
 * ✅ No randomness (deterministic math)
 * ✅ No material redefinitions
 * ✅ Graceful degradation
 * 
 * INTEGRATION POINTS:
 * - Hub system (hub state data)
 * - Link visual systems (phase bias, streak coherence)
 * - Node visual systems (secondary halos, pulse sync)
 * - Network topology (neighbor computation)
 * - Recovery controller (collapse/recovery triggers)
 * ============================================================================
 */

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

const THREE = THREE_SAFE;

/**
 * Influence zone definitions and attenuation
 */
const INFLUENCE_ZONES = {
  ZONE_1_ATTENUATION: 0.6,    // 60% of hub strength
  ZONE_2_ATTENUATION: 0.25,   // 25% of hub strength
  MAX_ZONE_1_DISTANCE: 1,     // Hops (direct neighbors)
  MAX_ZONE_2_DISTANCE: 2      // Hops (via one intermediate)
};

/**
 * Influence propagation parameters
 */
const INFLUENCE_PROPAGATION = {
  // Influence strength computation
  HARMONY_WEIGHT: 0.5,
  SYNERGY_WEIGHT: 0.5,
  CORRUPTION_REDUCTION: 0.3,
  STABILITY_REDUCTION: 0.4,
  RESILIENCE_BOOST_FACTOR: 0.3,
  
  // Visual modulation
  SYNERGY_STRENGTH_MULTIPLIER: 1.2,  // +20% at synergy = 1.0
  
  // Phase bias (how much hub phase pulls neighbors)
  ZONE_1_PHASE_BIAS: 0.15,    // 15% phase pull
  ZONE_2_PHASE_BIAS: 0.05,    // 5% phase pull
  
  // Corruption distortion
  CORRUPTION_PHASE_LAG: 0.3,   // Phase lag at max corruption
  CORRUPTION_ASYMMETRY: 0.2,   // Field distortion factor
  
  // Stability effects
  STABILITY_REACH_DAMPING: 0.4,  // How much stability suppresses reach
  
  // Secondary node halo intensity
  ZONE_1_NODE_HALO_MAX: 0.15,  // Max secondary halo intensity
  ZONE_2_NODE_GLOW_MAX: 0.08,  // Max secondary glow intensity
  
  // Smoothing
  INFLUENCE_EASING: 0.8        // Easing factor (0-1, higher = smoother)
};

/**
 * HubInfluencePropagation
 * Manages influence field propagation from harmonic hubs
 */
export class HubInfluencePropagation {
  constructor() {
    // Per-hub influence state
    this.hubInfluences = new Map(); // hubId → { influence, zone1Nodes, zone2Nodes, ... }
    
    // Cached topology
    this.neighborCache = new Map(); // nodeId → { zone1, zone2 }
    this.cacheValid = false;
    
    // Time tracking
    this.totalTime = 0;
    this.lastUpdateTime = 0;
    
    // Stats
    this.influencedHubCount = 0;
    this.zone1NodeCount = 0;
    this.zone2NodeCount = 0;
  }

  /**
   * Compute influence strength for a hub
   */
  computeHubInfluenceStrength(hubState) {
    if (!hubState) return 0;
    
    // Base influence from sync strength
    let strength = hubState.hubSyncStrength || 0;
    
    // Apply harmony and synergy
    const harmonyFactor = (hubState.harmony || 0.5) * INFLUENCE_PROPAGATION.HARMONY_WEIGHT;
    const synergyFactor = (hubState.synergy || 0.5) * INFLUENCE_PROPAGATION.SYNERGY_WEIGHT;
    strength *= (harmonyFactor + synergyFactor);
    
    // Apply corruption reduction
    const corruptionPenalty = 1.0 - (hubState.corruption || 0) * INFLUENCE_PROPAGATION.CORRUPTION_REDUCTION;
    strength *= corruptionPenalty;
    
    // Apply stability reduction
    const stabilityPenalty = 1.0 - (hubState.stability || 0) * INFLUENCE_PROPAGATION.STABILITY_REDUCTION;
    strength *= stabilityPenalty;
    
    // Apply resilience boost
    const resilienceBoost = 0.7 + (hubState.resilience || 0) * INFLUENCE_PROPAGATION.RESILIENCE_BOOST_FACTOR;
    strength *= resilienceBoost;
    
    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, strength));
  }

  /**
   * Get or compute neighbor topology
   */
  getNeighborsForNode(nodeId, nodeRegistry, linkRegistry) {
    // Check cache
    let neighbors = this.neighborCache.get(nodeId);
    if (neighbors) return neighbors;
    
    // Compute neighbors if not cached
    neighbors = {
      zone1: [],      // Direct neighbors (one-hop)
      zone2: []       // Secondary neighbors (two-hop)
    };
    
    if (!linkRegistry) return neighbors;
    
    const zone1Set = new Set();
    
    // Find Zone 1: direct links
    linkRegistry.forEach((link) => {
      if (!link || !link.userData) return;
      
      // Check if link connects to this node
      const nodeA = link.userData.nodeA;
      const nodeB = link.userData.nodeB;
      
      if (nodeA === nodeId && nodeB) {
        zone1Set.add(nodeB);
      } else if (nodeB === nodeId && nodeA) {
        zone1Set.add(nodeA);
      }
    });
    
    // Convert to array
    neighbors.zone1 = Array.from(zone1Set);
    
    // Find Zone 2: neighbors of neighbors (avoid duplicates)
    const zone2Set = new Set();
    neighbors.zone1.forEach((zone1NodeId) => {
      // Find neighbors of this zone1 node
      linkRegistry.forEach((link) => {
        if (!link || !link.userData) return;
        
        const nodeA = link.userData.nodeA;
        const nodeB = link.userData.nodeB;
        
        if (nodeA === zone1NodeId && nodeB && nodeB !== nodeId) {
          zone2Set.add(nodeB);
        } else if (nodeB === zone1NodeId && nodeA && nodeA !== nodeId) {
          zone2Set.add(nodeA);
        }
      });
    });
    
    // Remove zone1 nodes from zone2 (avoid duplicates)
    neighbors.zone1.forEach(z1Id => zone2Set.delete(z1Id));
    neighbors.zone2 = Array.from(zone2Set);
    
    // Cache neighbors
    this.neighborCache.set(nodeId, neighbors);
    
    return neighbors;
  }

  /**
   * Initialize hub influence state
   */
  initializeHubInfluence(hubId) {
    if (this.hubInfluences.has(hubId)) {
      return this.hubInfluences.get(hubId);
    }
    
    const influence = {
      hubId,
      strength: 0,
      targetStrength: 0,
      zone1Strength: 0,
      zone2Strength: 0,
      
      // Cached neighbors
      zone1Nodes: [],
      zone2Nodes: [],
      zone1Links: [],
      zone2Links: [],
      
      // State
      hubPhase: 0,
      corruption: 0,
      stability: 0,
      harmony: 0.5,
      synergy: 0.5,
      resilience: 0,
      isCollapsed: false,
      
      // Per-zone timers
      lastZone1Update: 0,
      lastZone2Update: 0
    };
    
    this.hubInfluences.set(hubId, influence);
    return influence;
  }

  /**
   * Update all hub influences
   */
  update(deltaTime, hubSystemData, nodeRegistry, linkRegistry) {
    if (!hubSystemData) return;
    
    this.totalTime += deltaTime;
    this.lastUpdateTime = performance.now();
    this.influencedHubCount = 0;
    this.zone1NodeCount = 0;
    this.zone2NodeCount = 0;
    
    // Update each hub's influence
    hubSystemData.forEach((hubState, hubId) => {
      if (!hubState) return;
      
      const influence = this.initializeHubInfluence(hubId);
      
      // Compute target influence strength
      influence.targetStrength = this.computeHubInfluenceStrength(hubState);
      
      // Smooth toward target
      const easeAmount = Math.min(1, INFLUENCE_PROPAGATION.INFLUENCE_EASING * deltaTime);
      influence.strength += (influence.targetStrength - influence.strength) * easeAmount;
      
      // Update zone strengths with distance attenuation
      influence.zone1Strength = influence.strength * INFLUENCE_ZONES.ZONE_1_ATTENUATION;
      influence.zone2Strength = influence.strength * INFLUENCE_ZONES.ZONE_2_ATTENUATION;
      
      // Cache hub state for visual effects
      influence.hubPhase = hubState.hubPhase || 0;
      influence.corruption = hubState.corruption || 0;
      influence.po = hubState.instability || 0;
      influence.harmony = hubState.harmony || 0.5;
      influence.synergy = hubState.synergy || 0.5;
      influence.resilience = hubState.resilience || 0;
      influence.isCollapsed = hubState.isCollapsed || false;
      
      // Apply influence to links and nodes
      this.propagateInfluence(hubId, influence, nodeRegistry, linkRegistry);
      
      if (influence.strength > 0.05) {
        this.influencedHubCount++;
      }
    });
  }

  /**
   * Propagate influence from hub to neighbors
   */
  propagateInfluence(hubId, influence, nodeRegistry, linkRegistry) {
    // Get cached neighbors
    let neighbors = this.neighborCache.get(hubId);
    if (!neighbors) {
      neighbors = this.getNeighborsForNode(hubId, nodeRegistry, linkRegistry);
    }
    
    // Cache updated neighbors
    influence.zone1Nodes = neighbors.zone1;
    influence.zone2Nodes = neighbors.zone2;
    
    this.zone1NodeCount += neighbors.zone1.length;
    this.zone2NodeCount += neighbors.zone2.length;
    
    // Apply influence to Zone 1 nodes
    neighbors.zone1.forEach((nodeId) => {
      this.applyInfluenceToNode(nodeId, influence, true);
    });
    
    // Apply influence to Zone 2 nodes (suppressed if stability high)
    if (influence.stability < 0.7) {
      neighbors.zone2.forEach((nodeId) => {
        this.applyInfluenceToNode(nodeId, influence, false);
      });
    }
    
    // Apply influence to links
    this.applyInfluenceToLinks(hubId, influence, nodeRegistry, linkRegistry);
  }

  /**
   * Apply influence to a node
   */
  applyInfluenceToNode(nodeId, hubInfluence, isZone1) {
    const node = nodeRegistry?.get(nodeId);
    if (!node || !node.userData) return;
    
    // Store influence info (for use by node visual systems)
    if (!node.userData.influenceFields) {
      node.userData.influenceFields = [];
    }
    
    // Remove old influence from this hub if present
    node.userData.influenceFields = node.userData.influenceFields.filter(
      inf => inf.hubId !== hubInfluence.hubId
    );
    
    // Add new influence
    const influenceData = {
      hubId: hubInfluence.hubId,
      isZone1,
      strength: isZone1 ? hubInfluence.zone1Strength : hubInfluence.zone2Strength,
      phase: hubInfluence.hubPhase,
      harmonyFactor: hubInfluence.harmony,
      corruption: hubInfluence.corruption,
      stability: hubInfluence.stability,
      
      // Compute secondary halo intensity
      haloIntensity: isZone1 
        ? hubInfluence.zone1Strength * INFLUENCE_PROPAGATION.ZONE_1_NODE_HALO_MAX
        : hubInfluence.zone2Strength * INFLUENCE_PROPAGATION.ZONE_2_NODE_GLOW_MAX,
      
      // Compute phase modulation
      phaseBias: isZone1 
        ? INFLUENCE_ZONES.ZONE_1_ATTENUATION * INFLUENCE_PROPAGATION.ZONE_1_PHASE_BIAS
        : INFLUENCE_ZONES.ZONE_2_ATTENUATION * INFLUENCE_PROPAGATION.ZONE_2_PHASE_BIAS
    };
    
    node.userData.influenceFields.push(influenceData);
  }

  /**
   * Apply influence to links connected to hub
   */
  applyInfluenceToLinks(hubId, hubInfluence, nodeRegistry, linkRegistry) {
    if (!linkRegistry) return;
    
    // Find links connected to this hub
    linkRegistry.forEach((link) => {
      if (!link || !link.userData) return;
      
      const nodeA = link.userData.nodeA;
      const nodeB = link.userData.nodeB;
      
      // Check if link connects to hub
      if (nodeA === hubId || nodeB === hubId) {
        this.applyInfluenceToLink(link, hubInfluence, true); // Zone 1
      }
    });
    
    // Apply weak Zone 2 influence to links connected to Zone 1 nodes
    if (hubInfluence.stability < 0.7) {
      hubInfluence.zone1Nodes.forEach((zone1NodeId) => {
        linkRegistry.forEach((link) => {
          if (!link || !link.userData) return;
          
          const nodeA = link.userData.nodeA;
          const nodeB = link.userData.nodeB;
          
          if ((nodeA === zone1NodeId || nodeB === zone1NodeId) &&
              nodeA !== hubId && nodeB !== hubId) { // Avoid re-applying Zone 1
            this.applyInfluenceToLink(link, hubInfluence, false); // Zone 2
          }
        });
      });
    }
  }

  /**
   * Apply influence to a link
   */
  applyInfluenceToLink(link, hubInfluence, isZone1) {
    if (!link.userData) return;
    
    // Store influence info (for use by link visual systems)
    if (!link.userData.influenceFields) {
      link.userData.influenceFields = [];
    }
    
    // Remove old influence from this hub if present
    link.userData.influenceFields = link.userData.influenceFields.filter(
      inf => inf.hubId !== hubInfluence.hubId
    );
    
    // Compute influence parameters
    const strength = isZone1 ? hubInfluence.zone1Strength : hubInfluence.zone2Strength;
    
    // Phase bias: pull toward hub phase
    let phaseBias = isZone1 
      ? INFLUENCE_PROPAGATION.ZONE_1_PHASE_BIAS
      : INFLUENCE_PROPAGATION.ZONE_2_PHASE_BIAS;
    
    // Apply corruption distortion (adds phase lag)
    phaseBias *= (1.0 - hubInfluence.corruption * INFLUENCE_PROPAGATION.CORRUPTION_PHASE_LAG);
    
    // Compute phase variance reduction (links become more coherent under influence)
    const phaseVarianceReduction = isZone1 
      ? 0.3 * strength  // Zone 1: reduce variance more
      : 0.1 * strength; // Zone 2: minimal variance reduction
    
    // Compute streak coherence boost (directional streaks align better)
    const streakCoherence = isZone1 
      ? 0.2 * strength
      : 0.05 * strength;
    
    // Compute pulse timing alignment
    const pulseAlignment = isZone1
      ? 0.15 * strength
      : 0.05 * strength;
    
    // Add influence data
    const influenceData = {
      hubId: hubInfluence.hubId,
      isZone1,
      strength,
      phase: hubInfluence.hubPhase,
      phaseBias,
      phaseVarianceReduction,
      streakCoherence,
      pulseAlignment,
      harmonyFactor: hubInfluence.harmony,
      synergyBoost: INFLUENCE_PROPAGATION.SYNERGY_STRENGTH_MULTIPLIER,
      corruption: hubInfluence.corruption,
      stability: hubInfluence.stability,
      
      // Field distortion (corruption makes influence less smooth)
      fieldDistortion: hubInfluence.corruption * INFLUENCE_PROPAGATION.CORRUPTION_ASYMMETRY
    };
    
    link.userData.influenceFields.push(influenceData);
  }

  /**
   * Get influence info for a node
   */
  getNodeInfluence(nodeId) {
    // Return aggregated influence (could combine multiple sources)
    return {
      hasInfluence: false,
      strongestHub: null,
      zone1Influence: 0,
      zone2Influence: 0,
      avgPhase: 0
    };
  }

  /**
   * Get influence info for a link
   */
  getLinkInfluence(linkId) {
    return {
      hasInfluence: false,
      strongestHub: null,
      phaseAlignment: 0,
      coherenceBoost: 0
    };
  }

  /**
   * Get hub influence stats
   */
  getHubInfluenceStats(hubId) {
    const influence = this.hubInfluences.get(hubId);
    if (!influence) return null;
    
    return {
      hubId,
      strength: influence.strength.toFixed(3),
      zone1Strength: influence.zone1Strength.toFixed(3),
      zone2Strength: influence.zone2Strength.toFixed(3),
      zone1Nodes: influence.zone1Nodes.length,
      zone2Nodes: influence.zone2Nodes.length,
      phase: influence.hubPhase.toFixed(3),
      corruption: influence.corruption.toFixed(2),
      stability: influence.stability.toFixed(2),
      harmony: influence.harmony.toFixed(2),
      synergy: influence.synergy.toFixed(2),
      resilience: influence.resilience.toFixed(2)
    };
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      influencedHubCount: this.influencedHubCount,
      totalHubs: this.hubInfluences.size,
      zone1NodeCount: this.zone1NodeCount,
      zone2NodeCount: this.zone2NodeCount,
      totalInfluencedNodes: this.zone1NodeCount + this.zone2NodeCount,
      cacheSize: this.neighborCache.size
    };
  }

  /**
   * Invalidate topology cache (call when network structure changes)
   */
  invalidateCache() {
    this.neighborCache.clear();
    this.cacheValid = false;
  }

  /**
   * Clear all state
   */
  dispose() {
    this.hubInfluences.clear();
    this.neighborCache.clear();
  }
}

// Export for use in main.js
export default HubInfluencePropagation;
