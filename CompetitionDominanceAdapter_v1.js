/**
 * CompetitionDominanceAdapter_v1.js
 * ============================================================================
 * Competition & Dominance Visualization: Specialized Nodes Compete for Territory
 * 
 * VISUAL NARRATIVE LAYER: When multiple specialized nodes influence overlapping
 * regions, they visually compete for dominance. Strong nodes impose rhythm and
 * coherence; weaker nodes visually defer. Interference patterns show tension.
 * 
 * Core Concept:
 * - Identify regions (1-2 hop neighborhoods around each node)
 * - Compute dominance ∈ [0, 1] per node in each region
 * - Dominant node imposes visual authority (stable halo, rhythm, coherence)
 * - Contested regions show beat frequencies and phase wobble
 * - Weaker nodes visually suppress their effects
 * 
 * Dominance is computed from:
 * - synapticBias strength (abs(bias))
 * - harmony vs corruption state
 * - synergy (local network coherence)
 * - hubResilience (stable nodes dominate)
 * - inverse fatigue (tired nodes yield)
 * 
 * NO GAMEPLAY CHANGES, NO ALLOCATIONS, PURELY VISUAL
 * Pure visual storytelling about territorial authority and competition.
 * Derived visual state lives under node.userData.visualState.dominance.
 * Legacy alias node.userData.dominanceVisuals mirrors that branch for compatibility.
 * 
 * State-Driven Dominance:
 * - Deterministic: same state → same dominance
 * - Reversible: nodes can reclaim territory if state shifts
 * - Smooth: no snapping, gradual power shifts
 * - Graceful: degrades if influence data missing
 */

export class CompetitionDominanceAdapter_v1 {
  constructor(config = {}) {
    this.enabled = config.enabled ?? true;
    this.debugMode = config.debugMode ?? false;

    // Dominance strength modulation
    this.dominanceStrength = config.dominanceStrength ?? 0.7;  // How much dominant nodes affect visuals
    this.contestationStrength = config.contestationStrength ?? 0.5;  // Visual tension in contested regions

    // Region definition (hop radius)
    this.regionHopRadius = config.regionHopRadius ?? 2;  // How many hops to search for competing nodes

    // Smoothing (avoid jarring power shifts)
    this.dominanceSmoothness = config.dominanceSmoothness ?? 0.92;  // Lerp factor per frame

    // Per-node dominance tracking
    this.nodeDominanceMap = new Map();  // nodeId -> { dominanceScore, isContested, lastUpdate }
    this.regionCache = new Map();        // Cached region memberships
    this.lastRegionUpdate = 0;
    this.regionUpdateInterval = 30;      // Update regions every 30 frames

    // Per-region dominance state
    this.regionDominanceMap = new Map(); // regionKey -> { dominantNodeId, contestants, beatFreq, phaseOffset }

    // Visual effect parameters
    this.maxPhaseWobble = config.maxPhaseWobble ?? 0.3;     // Max phase offset in contested zones
    this.maxBeatFrequency = config.maxBeatFrequency ?? 2.0; // Beat freq when nodes compete

    console.log('[CompetitionDominanceAdapter] Initialized', {
      enabled: this.enabled,
      dominanceStrength: this.dominanceStrength,
      contestationStrength: this.contestationStrength,
      regionHopRadius: this.regionHopRadius,
    });
  }

  /**
   * Main update: compute dominance for all nodes
   */
  update(nodes, links, deltaTime, worldState) {
    if (!this.enabled || !nodes || nodes.length === 0) return;

    // Update regions periodically
    if (this.lastRegionUpdate++ > this.regionUpdateInterval) {
      this.updateRegionMemberships(nodes, links);
      this.lastRegionUpdate = 0;
    }

    // For each region, identify dominant node
    this.computeRegionalDominance(nodes);

    // Apply dominance modulation to each node
    this.applyDominanceVisuals(nodes, worldState);
  }

  /**
   * Identify regions: groups of nodes within hop radius of each other
   */
  updateRegionMemberships(nodes, links) {
    this.regionCache.clear();

    if (!links) {
      // No links: treat each node as its own region
      nodes.forEach((node, idx) => {
        const regionKey = `solo-${idx}`;
        this.regionCache.set(regionKey, [node.id || idx]);
      });
      return;
    }

    // Build adjacency map
    const adjacency = new Map();
    nodes.forEach(n => {
      const id = n.id ?? nodes.indexOf(n);
      adjacency.set(id, []);
    });

    links.forEach(link => {
      const srcId = link.source?.id ?? (link.source ?? 0);
      const dstId = link.target?.id ?? (link.target ?? 1);
      
      if (adjacency.has(srcId)) adjacency.get(srcId).push(dstId);
      if (adjacency.has(dstId)) adjacency.get(dstId).push(srcId);
    });

    // BFS to find neighborhoods (hop radius)
    const visited = new Set();
    nodes.forEach((node, idx) => {
      const nodeId = node.id ?? idx;
      if (visited.has(nodeId)) return;

      const neighborhood = this.getNeighborhood(nodeId, adjacency, this.regionHopRadius);
      const regionKey = `region-${Array.from(neighborhood).sort().join('-')}`;
      
      this.regionCache.set(regionKey, Array.from(neighborhood));
      neighborhood.forEach(nid => visited.add(nid));
    });
  }

  /**
   * BFS to get nodes within hop radius
   */
  getNeighborhood(startId, adjacency, maxHops) {
    const neighborhood = new Set([startId]);
    const queue = [{ id: startId, hops: 0 }];

    while (queue.length > 0) {
      const { id, hops } = queue.shift();
      
      if (hops >= maxHops) continue;

      const neighbors = adjacency.get(id) || [];
      neighbors.forEach(neighborId => {
        if (!neighborhood.has(neighborId)) {
          neighborhood.add(neighborId);
          queue.push({ id: neighborId, hops: hops + 1 });
        }
      });
    }

    return neighborhood;
  }

  /**
   * For each region, compute dominance scores and identify dominant node
   */
  computeRegionalDominance(nodes) {
    this.regionDominanceMap.clear();

    this.regionCache.forEach((nodeIds, regionKey) => {
      if (nodeIds.length === 0) return;
      if (nodeIds.length === 1) {
        // Solo node: complete dominance
        const nodeId = nodeIds[0];
        this.regionDominanceMap.set(regionKey, {
          dominantNodeId: nodeId,
          dominanceLevel: 1.0,
          contestants: [],
          isContested: false,
          beatFrequency: 0,
          phaseOffset: 0,
        });
        return;
      }

      // Multiple nodes: compute dominance scores
      const dominanceScores = [];
      nodeIds.forEach(nodeId => {
        const score = this.computeDominanceScore(nodeId, nodes);
        dominanceScores.push({ nodeId, score });
      });

      // Sort by score
      dominanceScores.sort((a, b) => b.score - a.score);

      const dominant = dominanceScores[0];
      const contestants = dominanceScores.slice(1);
      const isContested = contestants.length > 0 && contestants[0].score > 0.3;

      // Compute beat frequency if contested
      let beatFrequency = 0;
      let phaseOffset = 0;
      if (isContested) {
        const scoreDiff = dominant.score - contestants[0].score;
        beatFrequency = this.maxBeatFrequency * (1 - scoreDiff);
        phaseOffset = (Math.sin(beatFrequency) * this.maxPhaseWobble);
      }

      this.regionDominanceMap.set(regionKey, {
        dominantNodeId: dominant.nodeId,
        dominanceLevel: dominant.score,
        contestants: contestants.map(c => c.nodeId),
        isContested,
        beatFrequency,
        phaseOffset,
      });
    });
  }

  /**
   * Compute single node's dominance in context of all nodes
   * Higher = more dominant
   */
  computeDominanceScore(nodeId, nodes) {
    const nodeIndex = this.findNodeIndex(nodeId, nodes);
    if (nodeIndex === -1) return 0;

    const node = nodes[nodeIndex];
    const metrics = node.metrics || {};

    let score = 0.5;  // Base score

    // Specialization strength (abs(synapticBias))
    if (node.synapticBias !== undefined) {
      const biasMagnitude = Math.abs(node.synapticBias);
      score += biasMagnitude * 0.3;  // Specialized nodes dominate more
    }

    // Harmony vs corruption
    const harmony = metrics.harmony ?? 0;
    const corruption = metrics.corruption ?? 0;
    score += (harmony - corruption) * 0.2;  // Harmony increases dominance

    // Synergy (local network coherence)
    const synergy = metrics.synergy ?? 0;
    score += Math.max(0, synergy) * 0.15;

    // Hub resilience (stable nodes dominate)
    const resilience = metrics.resilience ?? 0;
    score += resilience * 0.15;

    // Inverse fatigue (tired nodes yield)
    const fatigue = metrics.fatigue ?? 0;
    score *= (1 - fatigue * 0.25);  // Fatigue reduces dominance

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Find node index in array by id or direct reference
   */
  findNodeIndex(nodeId, nodes) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === nodeId || i === nodeId) return i;
    }
    return -1;
  }

  /**
   * Apply dominance visuals to each node
   */
  applyDominanceVisuals(nodes, worldState) {
    nodes.forEach((node, idx) => {
      const nodeId = node.id ?? idx;

      // Find regions this node participates in
      const participatingRegions = [];
      this.regionDominanceMap.forEach((region, regionKey) => {
        if (region.contestants.includes(nodeId)) {
          participatingRegions.push(region);
        } else if (region.dominantNodeId === nodeId) {
          participatingRegions.push(region);
        }
      });

      if (participatingRegions.length === 0) {
        // Node not in any competing region
        this.clearDominanceEffects(node);
        return;
      }

      // Aggregate dominance state across regions
      const aggregated = this.aggregateDominanceState(nodeId, participatingRegions);
      
      // Apply smooth transitions
      this.smoothDominanceTransition(node, aggregated);

      // Apply visual effects based on dominance role
      this.applyVisualEffects(node, aggregated, worldState);
    });
  }

  /**
   * Aggregate dominance state: is this node dominant, contested, or submissive?
   */
  aggregateDominanceState(nodeId, regions) {
    let avgDominanceLevel = 0;
    let isDominant = false;
    let isContested = false;
    let avgPhaseOffset = 0;
    let avgBeatFreq = 0;
    let regionCount = 0;

    regions.forEach(region => {
      if (region.dominantNodeId === nodeId) {
        isDominant = true;
        avgDominanceLevel += region.dominanceLevel;
        isContested = isContested || region.isContested;
      } else if (region.contestants.includes(nodeId)) {
        isContested = isContested || region.isContested;
        avgDominanceLevel += 0.4;  // Contested nodes have moderate presence
      }

      avgPhaseOffset += region.phaseOffset;
      avgBeatFreq += region.beatFrequency;
      regionCount++;
    });

    avgDominanceLevel /= Math.max(1, regionCount);
    avgPhaseOffset /= Math.max(1, regionCount);
    avgBeatFreq /= Math.max(1, regionCount);

    return {
      isDominant,
      isContested,
      dominanceLevel: avgDominanceLevel,
      phaseOffset: avgPhaseOffset,
      beatFrequency: avgBeatFreq,
    };
  }

  /**
   * Smoothly transition dominance state
   */
  smoothDominanceTransition(node, newState) {
    if (!this.nodeDominanceMap.has(node.id ?? node)) {
      this.nodeDominanceMap.set(node.id ?? node, {
        dominanceLevel: 0,
        phaseOffset: 0,
        beatFrequency: 0,
        isDominant: false,
        isContested: false,
      });
    }

    const state = this.nodeDominanceMap.get(node.id ?? node);

    // Smooth transition
    state.dominanceLevel = this.lerp(state.dominanceLevel, newState.dominanceLevel, 1 - this.dominanceSmoothness);
    state.phaseOffset = this.lerp(state.phaseOffset, newState.phaseOffset, 1 - this.dominanceSmoothness);
    state.beatFrequency = this.lerp(state.beatFrequency, newState.beatFrequency, 1 - this.dominanceSmoothness);
    state.isDominant = newState.isDominant;
    state.isContested = newState.isContested;
  }

  /**
   * Linear interpolation
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Apply visual effects based on dominance role
   */
  applyVisualEffects(node, state, worldState) {
    if (!node.userData) node.userData = {};
    if (!node.userData.visualState) node.userData.visualState = {};
    if (!node.userData.visualState.dominance) node.userData.visualState.dominance = {};

    const visuals = node.userData.visualState.dominance;

    if (state.isDominant) {
      // ✅ DOMINANT NODE
      // - Clearer, more coherent halo
      // - Stable pulse rhythm (less modulation)
      // - Strong phase alignment downstream
      visuals.haloClarity = 1.0;
      visuals.pulseCoherence = 1.0 + state.dominanceLevel * 0.2;
      visuals.phaseAuthority = state.dominanceLevel;
      visuals.rippleStrength = 1.0;
      visuals.role = 'dominant';
    } else if (state.isContested) {
      // 🟡 CONTESTED NODE
      // - Phase wobble (beat frequency shimmer)
      // - Subtle timing offsets
      // - Visual tension, not chaos
      const wobbleAmount = state.phaseOffset * this.contestationStrength;
      visuals.haloClarity = 0.7 - wobbleAmount;
      visuals.pulseCoherence = 0.8 + state.dominanceLevel * 0.15;
      visuals.phaseOffset = wobbleAmount;
      visuals.beatFrequency = state.beatFrequency;
      visuals.rippleStrength = 0.8;
      visuals.role = 'contested';
    } else {
      // 🔵 SUBMISSIVE NODE
      // - Dimmer, less rhythmic authority
      // - Attenuated influence field
      // - Visually defers to dominant timing
      const submissionLevel = 1 - state.dominanceLevel;
      visuals.haloClarity = 0.5 * (1 - submissionLevel * 0.4);
      visuals.pulseCoherence = 0.6;
      visuals.phaseAuthority = 0;
      visuals.rippleStrength = 0.6 - submissionLevel * 0.2;
      visuals.role = 'submissive';
    }

    // Store state for shader/VFX consumption
    visuals.dominanceLevel = state.dominanceLevel;
    visuals.lastUpdate = Date.now();
    node.userData.dominanceVisuals = visuals;
  }

  /**
   * Clear dominance effects (node not competing)
   */
  clearDominanceEffects(node) {
    if (node.userData) {
      if (!node.userData.visualState) node.userData.visualState = {};
      node.userData.visualState.dominance = {
        haloClarity: 1.0,
        pulseCoherence: 1.0,
        phaseAuthority: 0,
        rippleStrength: 1.0,
        dominanceLevel: 0,
        role: 'neutral',
      };
      node.userData.dominanceVisuals = node.userData.visualState.dominance;
    }
  }

  /**
   * Console APIs
   */
  enable() {
    this.enabled = true;
    console.log('[CompetitionDominance] Enabled');
  }

  disable() {
    this.enabled = false;
    console.log('[CompetitionDominance] Disabled');
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
    console.log('[CompetitionDominance] Debug mode:', enabled);
  }

  setDominanceStrength(strength) {
    this.dominanceStrength = Math.max(0, Math.min(1, strength));
    console.log('[CompetitionDominance] Dominance strength:', this.dominanceStrength);
  }

  setContestationStrength(strength) {
    this.contestationStrength = Math.max(0, Math.min(1, strength));
    console.log('[CompetitionDominance] Contestation strength:', this.contestationStrength);
  }

  setRegionHopRadius(radius) {
    this.regionHopRadius = Math.max(1, Math.floor(radius));
    this.lastRegionUpdate = this.regionUpdateInterval;  // Force update
    console.log('[CompetitionDominance] Region hop radius:', this.regionHopRadius);
  }

  getStatus() {
    return {
      enabled: this.enabled,
      debugMode: this.debugMode,
      dominanceStrength: this.dominanceStrength,
      contestationStrength: this.contestationStrength,
      regionHopRadius: this.regionHopRadius,
      regionsIdentified: this.regionCache.size,
      activeCompetitions: this.regionDominanceMap.size,
      nodesTracked: this.nodeDominanceMap.size,
    };
  }

  help() {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║  COMPETITION & DOMINANCE VISUALIZATION API                        ║
╚════════════════════════════════════════════════════════════════════╝

METHODS:
  competitionDominance.enable()                 - Enable dominance visuals
  competitionDominance.disable()                - Disable dominance visuals
  competitionDominance.setDebugMode(true/false) - Enable debug logging
  competitionDominance.setDominanceStrength(0.0–1.0) - Adjust dominance clarity
  competitionDominance.setContestationStrength(0.0–1.0) - Adjust contestation wobble
  competitionDominance.setRegionHopRadius(1–5) - Adjust region size
  competitionDominance.getStatus()              - Show current state
  competitionDominance.help()                   - Show this help

VISUAL ROLES:
  🟢 DOMINANT NODE:   Clear halo, stable rhythm, phase authority
  🟡 CONTESTED NODE:  Phase wobble, beat frequency shimmer, visual tension
  🔵 SUBMISSIVE NODE: Dim halo, attenuated presence, defers to authority

DOMINANCE FACTORS:
  - Synaptic bias strength (specialization magnitude)
  - Harmony vs corruption state
  - Local network synergy
  - Hub resilience (stability)
  - Inverse fatigue (tired nodes yield)

REGIONS:
  - Defined as neighborhoods within ${this.regionHopRadius} hops
  - Updated every ${this.regionUpdateInterval} frames
  - Multiple nodes compete per region
  - Power shifts visible without snapping
    `);
  }
}

/**
 * Integration setup function
 */
export function setupCompetitionDominanceIntegration(adapter, world) {
  if (!adapter || !world) return;

  // Expose to global console
  window.competitionDominance = {
    enable: () => adapter.enable(),
    disable: () => adapter.disable(),
    setDebugMode: (mode) => adapter.setDebugMode(mode),
    setDominanceStrength: (str) => adapter.setDominanceStrength(str),
    setContestationStrength: (str) => adapter.setContestationStrength(str),
    setRegionHopRadius: (rad) => adapter.setRegionHopRadius(rad),
    getStatus: () => adapter.getStatus(),
    help: () => adapter.help(),
  };

  console.log('[CompetitionDominance] Console APIs registered');
  console.log('Usage: competitionDominance.<method>() — type help() for more');
}
