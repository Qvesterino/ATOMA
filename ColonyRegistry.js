/**
 * ColonyRegistry.js - External Safe Living Civilization Management System
 * 
 * SAFE: 100% external registry - does NOT modify Node or Link classes
 * - Reads: node positions, link topology, synergy, traffic, legendary status
 * - Writes: Only to ColonyRegistry and scene VFX objects
 * - Architecture: Plain object indexed by colonyId, VFX stored separately
 * 
 * Living civilizations are visual+logical overlays representing clusters of connected nodes
 */

export class ColonyRegistry {
  constructor(scene) {
    this.scene = scene;
    
    // Main civilization registry
    this.colonies = {};           // [colonyId] → civilization state object
    this.nodeToColony = {};       // [nodeId] → colonyId (for quick lookup)
    
    // Civilization counter for generating unique IDs
    this.colonyCounter = 0;
    
    // VFX objects per civilization (kept completely separate)
    this.colonyVFX = {};          // [colonyId] → { atmosphere, rings, particles, glows, core, crown }
    
    // Configuration
    this.config = {
      clusterRadius: 6.0,         // Distance threshold for node clustering
      minNodesPerColony: 3,       // Minimum nodes to form a colony
      minLinkConnectivity: 0.4,   // Min percentage of nodes that must be linked
      
      // Stage thresholds
      stageThresholds: {
        stage0: 3,                // Proto-cluster: ≥3 nodes
        stage1: 4,                // Stable: visible stabilization
        stage2: 6,                // Dense: orbit rings form
        stage3: 10,               // Network Hub: multiple rings + pulses
        stage4: 15                // AI Nexus: complex holographic core
      },
      
      // Mood triggers (synergy/traffic ranges)
      moodThresholds: {
        harmony: 0.3,
        stability: 0.55,
        synergy: 0.78,
        corruption: 0.25,
        loadPressure: 0.7
      },
      
      // Energy mechanics
      energy: {
        accumRate: 0.05,          // Energy per frame from synergy
        decayRate: 0.02,          // Natural decay
        legendaryBonus: 2.0,      // 2x multiplier for legendary nodes
        mergeThreshold: 50        // Energy needed for stable merge
      },
      
      // Spatial merge/split thresholds
      mergeDistance: 8.0,         // Distance to consider merging colonies
      splitLinkFactor: 0.3        // If <30% of nodes are linked, can split
    };
    
    // Statistics for LOD and performance
    this.stats = {
      totalColonies: 0,
      maxColoniesPerFrame: 20,    // LOD cap
      totalParticlesActive: 0,
      maxParticlesPerColony: 100
    };
    
    // Timing
    this.lastClusteringTime = 0;
    this.clusteringInterval = 0.5; // Seconds between cluster recalculations
  }
  
  /**
   * Create a new colony from a cluster of nodes
   * READ-ONLY operations on nodes
   */
  createColony(nodeIds, clusterCenter, colonyType = 'DEFAULT') {
    if (nodeIds.length < this.config.minNodesPerColony) {
      return null;
    }
    
    const colonyId = `colony_${this.colonyCounter++}`;
    
    const colony = {
      id: colonyId,
      nodes: new Set(nodeIds),
      center: clusterCenter.clone(),
      stage: 0,
      mood: 'HARMONY',
      density: nodeIds.length / 10, // Relative density
      energy: 0,
      lastUpdateTime: performance.now(),
      
      // Type classification
      type: colonyType,
      
      // Hierarchy
      parentColonyId: null,
      childColonies: [],
      
      // Lifecycle
      age: 0,
      lastMoodUpdate: performance.now(),
      
      // VFX state
      vfxActive: false,
      vfxStage: 0,
      pulsing: false,
      pulsePhase: 0
    };
    
    // Register in registries
    this.colonies[colonyId] = colony;
    for (const nodeId of nodeIds) {
      this.nodeToColony[nodeId] = colonyId;
    }
    
    // Initialize VFX
    this.colonyVFX[colonyId] = {
      atmosphere: null,
      rings: [],
      particles: [],
      glows: [],
      fieldMembrane: null,
      core: null,
      crown: null,
      sigils: [],
      beam: null,
      distortionQuad: null
    };
    
    this.stats.totalColonies++;
    
    return colonyId;
  }
  
  /**
   * Register a node that joins the colony
   */
  addNodeToColony(nodeId, colonyId) {
    if (!this.colonies[colonyId]) return false;
    
    const colony = this.colonies[colonyId];
    colony.nodes.add(nodeId);
    this.nodeToColony[nodeId] = colonyId;
    
    return true;
  }
  
  /**
   * Remove a node from its colony
   */
  removeNodeFromColony(nodeId, colonyId) {
    if (!this.colonies[colonyId]) return false;
    
    const colony = this.colonies[colonyId];
    colony.nodes.delete(nodeId);
    delete this.nodeToColony[nodeId];
    
    // If colony is empty, mark for cleanup
    if (colony.nodes.size === 0) {
      return 'CLEANUP'; // Signal to cleanupEmptyColonies()
    }
    
    return true;
  }
  
  /**
   * Update colony center based on member node positions
   * READ-ONLY: only reads node positions
   */
  updateColonyCenter(colonyId, nodes) {
    if (!this.colonies[colonyId]) return;
    
    const colony = this.colonies[colonyId];
    if (colony.nodes.size === 0) return;
    
    // Calculate average position of all member nodes
    let centerX = 0, centerY = 0, centerZ = 0;
    let count = 0;
    
    for (const nodeId of colony.nodes) {
      const node = nodes[nodeId];
      if (node && node.position) {
        centerX += node.position.x;
        centerY += node.position.y;
        centerZ += node.position.z;
        count++;
      }
    }
    
    if (count > 0) {
      colony.center.set(centerX / count, centerY / count, centerZ / count);
      colony.density = colony.nodes.size / 10;
    }
  }
  
  /**
   * Update colony energy based on synergy/traffic of member nodes
   * READ-ONLY: only reads node synergy/traffic
   */
  accumulateEnergy(colonyId, nodes, synergyMap) {
    if (!this.colonies[colonyId]) return;
    
    const colony = this.colonies[colonyId];
    let totalSynergy = 0;
    let legendaryCount = 0;
    
    for (const nodeId of colony.nodes) {
      const node = nodes[nodeId];
      const synergy = synergyMap[nodeId] || 0;
      
      totalSynergy += synergy;
      
      // Check if node is legendary (read userData only)
      if (node && node.userData && node.userData.isLegendary) {
        legendaryCount++;
      }
    }
    
    // Average synergy across colony
    const avgSynergy = totalSynergy / Math.max(colony.nodes.size, 1);
    
    // Energy accumulation with legendary bonus
    const baseAccum = avgSynergy * this.config.energy.accumRate;
    const bonus = legendaryCount > 0 ? this.config.energy.legendaryBonus : 1.0;
    
    colony.energy += baseAccum * bonus;
    colony.energy -= this.config.energy.decayRate; // Natural decay
    colony.energy = Math.max(0, colony.energy);
  }
  
  /**
   * Update colony stage based on energy and node count
   */
  updateColonyStage(colonyId) {
    if (!this.colonies[colonyId]) return;
    
    const colony = this.colonies[colonyId];
    const nodeCount = colony.nodes.size;
    const thresholds = this.config.stageThresholds;
    
    let newStage = 0;
    if (nodeCount >= thresholds.stage4) newStage = 4;
    else if (nodeCount >= thresholds.stage3) newStage = 3;
    else if (nodeCount >= thresholds.stage2) newStage = 2;
    else if (nodeCount >= thresholds.stage1) newStage = 1;
    
    // Also consider energy
    if (colony.energy > 30 && newStage < 3) newStage = Math.min(3, newStage + 1);
    if (colony.energy > 60 && newStage < 4) newStage = 4;
    
    colony.stage = Math.max(0, newStage);
  }
  
  /**
   * Update colony mood based on synergy volatility and events
   */
  updateColonyMood(colonyId, nodes, synergyMap, trafficMap, weatherCondition = null, eventActive = false) {
    if (!this.colonies[colonyId]) return;
    
    const colony = this.colonies[colonyId];
    
    let totalSynergy = 0;
    let totalTraffic = 0;
    for (const nodeId of colony.nodes) {
      totalSynergy += synergyMap[nodeId] || 0;
      totalTraffic += trafficMap[nodeId] || 0;
    }
    const avgSynergy = totalSynergy / Math.max(colony.nodes.size, 1);
    const avgTraffic = totalTraffic / Math.max(colony.nodes.size, 1);
    
    let mood = 'HARMONY';
    if (eventActive) {
      mood = 'SYNERGY';
    } else if (avgTraffic > this.config.moodThresholds.loadPressure && avgSynergy > 0.2) {
      mood = 'LOAD_PRESSURE';
    } else if (avgSynergy > this.config.moodThresholds.synergy) {
      mood = 'SYNERGY';
    } else if (avgSynergy > this.config.moodThresholds.stability) {
      mood = 'STABILITY';
    } else if (avgSynergy < this.config.moodThresholds.corrosion) {
      mood = 'CORRUPTION';
    } else {
      mood = 'HARMONY';
    }
    
    colony.mood = mood;
    colony.lastMoodUpdate = performance.now();
  }
  
  /**
   * Merge two colonies into one
   */
  mergeColonies(colonyId1, colonyId2) {
    if (!this.colonies[colonyId1] || !this.colonies[colonyId2]) return null;
    
    const colony1 = this.colonies[colonyId1];
    const colony2 = this.colonies[colonyId2];
    
    // Create new merged colony
    const mergedNodes = new Set([...colony1.nodes, ...colony2.nodes]);
    const mergedCenter = colony1.center.clone()
      .add(colony2.center)
      .multiplyScalar(0.5);
    
    // Determine merged type
    let mergedType = 'DEFAULT';
    if (colony1.type === 'LEGENDARY' || colony2.type === 'LEGENDARY') {
      mergedType = 'LEGENDARY';
    } else if (colony1.type === 'QUANTUM' || colony2.type === 'QUANTUM') {
      mergedType = 'QUANTUM';
    }
    
    const mergedId = this.createColony(Array.from(mergedNodes), mergedCenter, mergedType);
    
    // Set parent references (for history)
    const mergedColony = this.colonies[mergedId];
    mergedColony.parentColonyId = null;
    mergedColony.childColonies = [colonyId1, colonyId2];
    
    // Mark old colonies for removal
    colony1.parentColonyId = mergedId;
    colony2.parentColonyId = mergedId;
    
    return mergedId;
  }
  
  /**
   * Split a colony if nodes are too scattered
   */
  splitColony(colonyId, subClusters) {
    if (!this.colonies[colonyId]) return [];
    
    const colony = this.colonies[colonyId];
    const newColonyIds = [];
    
    for (const subCluster of subClusters) {
      const { nodeIds, center } = subCluster;
      const newId = this.createColony(nodeIds, center, colony.type);
      
      if (newId) {
        const newColony = this.colonies[newId];
        newColony.parentColonyId = colonyId;
        newColonyIds.push(newId);
      }
    }
    
    // Mark original as parent
    if (newColonyIds.length > 0) {
      colony.childColonies = newColonyIds;
    }
    
    return newColonyIds;
  }
  
  /**
   * Get colony by ID
   */
  getColony(colonyId) {
    return this.colonies[colonyId] || null;
  }
  
  /**
   * Get all colonies
   */
  getAllColonies() {
    return Object.values(this.colonies);
  }
  
  /**
   * Get colony for a node
   */
  getNodeColony(nodeId) {
    const colonyId = this.nodeToColony[nodeId];
    return colonyId ? this.colonies[colonyId] : null;
  }
  
  /**
   * Clean up empty colonies
   */
  cleanupEmptyColonies() {
    const toRemove = [];
    
    for (const colonyId in this.colonies) {
      const colony = this.colonies[colonyId];
      if (colony.nodes.size === 0) {
        toRemove.push(colonyId);
      }
    }
    
    for (const colonyId of toRemove) {
      this.removeColony(colonyId);
    }
  }
  
  /**
   * Remove a colony and clean up its VFX
   */
  removeColony(colonyId) {
    if (!this.colonies[colonyId]) return;
    
    const colony = this.colonies[colonyId];
    const vfx = this.colonyVFX[colonyId];
    
    // Remove all node references
    for (const nodeId of colony.nodes) {
      delete this.nodeToColony[nodeId];
    }
    
    // Clean up VFX objects (will be done by ColonyVFXManager)
    if (vfx) {
      vfx.needsCleanup = true;
    }
    
    // Remove from registry
    delete this.colonies[colonyId];
    delete this.colonyVFX[colonyId];
    
    this.stats.totalColonies--;
  }
  
  /**
   * Validate registry integrity
   */
  validateRegistry(nodes) {
    const errors = [];
    
    // Check nodeToColony mapping
    for (const nodeId in this.nodeToColony) {
      const colonyId = this.nodeToColony[nodeId];
      
      if (!this.colonies[colonyId]) {
        errors.push(`Orphaned node ${nodeId} points to non-existent colony ${colonyId}`);
        delete this.nodeToColony[nodeId];
      } else if (!this.colonies[colonyId].nodes.has(nodeId)) {
        errors.push(`nodeToColony mismatch: ${nodeId} → ${colonyId} not in colony.nodes`);
        delete this.nodeToColony[nodeId];
      }
    }
    
    // Check colonies have valid nodes
    for (const colonyId in this.colonies) {
      const colony = this.colonies[colonyId];
      const validNodeIds = [];
      
      for (const nodeId of colony.nodes) {
        if (!nodes[nodeId]) {
          errors.push(`Colony ${colonyId} references deleted node ${nodeId}`);
        } else {
          validNodeIds.push(nodeId);
        }
      }
      
      colony.nodes = new Set(validNodeIds);
    }
    
    if (errors.length > 0) {
      console.warn('[ColonyRegistry] Validation errors:', errors);
    }
    
    return errors;
  }
  
  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalColonies: this.stats.totalColonies,
      totalNodes: Object.keys(this.nodeToColony).length,
      coloniesByStage: this.getColoniesGroupedByStage(),
      coloniesByMood: this.getColoniesGroupedByMood(),
      coloniesByType: this.getColoniesGroupedByType()
    };
  }
  
  /**
   * Group colonies by stage
   */
  getColoniesGroupedByStage() {
    const groups = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    
    for (const colony of Object.values(this.colonies)) {
      groups[colony.stage]++;
    }
    
    return groups;
  }
  
  /**
   * Group colonies by mood
   */
  getColoniesGroupedByMood() {
    const groups = { HARMONY: 0, STABILITY: 0, CORRUPTION: 0, SYNERGY: 0, LOAD_PRESSURE: 0 };
    
    for (const colony of Object.values(this.colonies)) {
      if (groups[colony.mood] !== undefined) {
        groups[colony.mood]++;
      }
    }
    
    return groups;
  }
  
  /**
   * Group colonies by type
   */
  getColoniesGroupedByType() {
    const groups = { DEFAULT: 0, QUANTUM: 0, SIGMA: 0, LEGENDARY: 0 };
    
    for (const colony of Object.values(this.colonies)) {
      groups[colony.type]++;
    }
    
    return groups;
  }
}
