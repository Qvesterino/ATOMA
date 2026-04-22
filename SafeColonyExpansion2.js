import * as THREE from 'three';
import { ColonyRegistry } from './ColonyRegistry.js';
import { ColonyVFXManager } from './ColonyVFXManager.js';

/**
 * SafeColonyExpansion2.js - Complete Living AI Ecosystem
 * 
 * SAFE: 100% external, read-only, non-destructive
 * - Manages living civilization formation, growth, splitting, merging
 * - All VFX-based, zero core engine modifications
 * - Reacts to world state: weather, events, legendary nodes
 * 
 * Main entry point for living civilization overlay in ATOMA
 */

export class SafeColonyExpansion2 {
  constructor(scene, environmentRoot) {
    this.scene = scene;
    this.environmentRoot = environmentRoot || scene;
    
    // Initialize subsystems
    this.registry = new ColonyRegistry(this.environmentRoot);
    this.vfxManager = new ColonyVFXManager(this.environmentRoot);
    
    // Cached references to world systems
    this.nodes = {};           // nodeId → node object
    this.links = [];           // Array of link objects
    this.synergyMap = {};      // nodeId → synergy value
    this.trafficMap = {};      // nodeId → traffic value
    this.legendaryRegistry = null;
    this.weatherRegistry = null;
    this.worldEvents = null;
    this.evolutionRegistry = null;
    
    // Timing
    this.time = 0;
    this.clusteringTimer = 0;
    this.moodUpdateTimer = 0;

    // CPU OPTIMIZATION: throttle non-visual colony logic to ~5Hz
    // Visual animation (updateVFX) stays at full 30Hz for smooth rendering
    this._logicAccumulator = 0;
    this._logicInterval = 0.2; // 200ms = ~5Hz
    
    // Performance tracking
    this.stats = {
      clustersCreated: 0,
      coloniesMerged: 0,
      coloniesSplit: 0,
      lastUpdateTime: 0
    };
    
    // Debug
    this.debugMode = false;
  }
  
  /**
   * Initialize with external systems
   * Call this after all systems are created
   */
  initialize(worldSystems) {
    const sourceNodes = worldSystems.nodes || {};
    this.nodes = {};

    if (Array.isArray(sourceNodes)) {
      for (const node of sourceNodes) {
        const nodeId = this.getNodeId(node);
        if (nodeId) {
          this.nodes[nodeId] = node;
        }
      }
    } else {
      for (const [key, node] of Object.entries(sourceNodes)) {
        if (!node) continue;
        const nodeId = this.getNodeId(node) || String(key);
        if (nodeId) {
          this.nodes[nodeId] = node;
        }
      }
    }

    this.links = worldSystems.links || [];
    this.legendaryRegistry = worldSystems.legendaryRegistry || null;
    this.weatherRegistry = worldSystems.weatherRegistry || null;
    this.worldEvents = worldSystems.worldEvents || null;
    this.evolutionRegistry = worldSystems.evolutionRegistry || null;
    this.synergyMap = worldSystems.synergyMap || {};
    this.trafficMap = worldSystems.trafficMap || {};

    if (worldSystems.frameScheduler) {
      this.setFrameScheduler(worldSystems.frameScheduler);
    }
  }

  setFrameScheduler(frameScheduler) {
    this.frameScheduler = frameScheduler;
    if (this.vfxManager) {
      this.vfxManager.frameScheduler = frameScheduler;
    }
  }

  getNodeId(node) {
    if (!node) return null;
    if (typeof node === 'string') return node;

    return node.userData?.nodeId || node.uuid || null;
  }
  
  /**
   * Main update loop (call once per frame)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const startTime = performance.now();
    
    this.time += deltaTime;

    // CPU OPTIMIZATION: throttle non-visual colony logic to ~5Hz.
    // Clustering, centers, energy, moods, merges, splits, events, cleanup
    // don't need 30Hz — only VFX animation does.
    this._logicAccumulator += deltaTime;
    const runLogic = this._logicAccumulator >= this._logicInterval;
    if (runLogic) {
      this._logicAccumulator = 0;

      // Step 1: Detect and create clusters (every 0.5s)
      this.clusteringTimer += this._logicInterval;
      if (this.clusteringTimer >= this.registry.config.clusteringInterval) {
        this.detectAndFormClusters();
        this.clusteringTimer = 0;
      }
      
      // Step 2: Update colony centers based on node positions
      this.updateColonyCenters();
      
      // Step 3: Accumulate energy and update stages
      this.accumulateEnergyAndUpdateStages();
      
      // Step 4: Update moods based on current conditions
      this.moodUpdateTimer += this._logicInterval;
      if (this.moodUpdateTimer >= 0.3) {
        this.updateColonyMoods();
        this.moodUpdateTimer = 0;
      }
      
      // Step 5: Check for merges
      this.checkAndExecuteMerges();
      
      // Step 6: Check for splits
      this.checkAndExecuteSplits();

      // Step 8: React to world events
      this.reactToWorldEvents();
      
      // Step 9: Cleanup
      this.cleanup();
      
      // Validate registry integrity
      if (this.debugMode) {
        this.registry.validateRegistry(this.nodes);
      }
    }
    
    // Step 7: Update VFX (every tick — smooth 30Hz animation)
    this.updateVFX(deltaTime);
    
    this.stats.lastUpdateTime = performance.now() - startTime;
  }
  
  /**
   * Detect node clusters and form colonies
   */
  detectAndFormClusters() {
    const clusters = this.findNodeClusters();
    
    for (const cluster of clusters) {
      const { nodeIds, center } = cluster;
      
      // Check if these nodes already belong to same colony
      const existingColony = this.getCommonColony(nodeIds);
      if (existingColony) {
        continue; // Already in a colony
      }
      
      // Determine colony type
      const colonyType = this.classifyColonyType(nodeIds);
      
      // Create new colony
      const colonyId = this.registry.createColony(nodeIds, center, colonyType);
      
      if (colonyId) {
        // Create initial VFX
        this.createColonyVFX(colonyId);
        
        // Trigger birth event
        this.triggerColonyBirth(colonyId);
        
        this.stats.clustersCreated++;
        
        if (this.debugMode) {
          console.log(`[Civilization] Birth: ${colonyId} with ${nodeIds.length} nodes (${colonyType})`);
        }
      }
    }
  }
  
  /**
   * Find clusters of nearby interconnected nodes
   */
  findNodeClusters() {
    const clusters = [];
    const visited = new Set();
    const nodeIds = Object.keys(this.nodes);
    
    for (const startNodeId of nodeIds) {
      if (visited.has(startNodeId)) continue;
      
      // BFS to find connected nearby nodes
      const cluster = [];
      const queue = [startNodeId];
      visited.add(startNodeId);
      
      while (queue.length > 0) {
        const currentId = queue.shift();
        const currentNode = this.nodes[currentId];
        
        if (!currentNode || !currentNode.position) continue;
        
        cluster.push(currentId);
        
        // Find nearby linked nodes
        for (const link of this.links) {
          let otherNodeId = null;

          // Check link endpoints (use canonical nodeId)
          if (this.getNodeId(link.from) === currentId) {
            otherNodeId = this.getNodeId(link.to);
          } else if (this.getNodeId(link.to) === currentId) {
            otherNodeId = this.getNodeId(link.from);
          }
          
          if (!otherNodeId) continue;
          if (visited.has(otherNodeId)) continue;
          
          const otherNode = this.nodes[otherNodeId];
          if (!otherNode || !otherNode.position) continue;
          
          // Check distance
          const distance = currentNode.position.distanceTo(otherNode.position);
          if (distance < this.registry.config.clusterRadius) {
            visited.add(otherNodeId);
            queue.push(otherNodeId);
          }
        }
      }
      
      // Check if cluster meets minimum requirements
      if (cluster.length >= this.registry.config.minNodesPerColony) {
        // Verify connectivity threshold
        const connectivityRatio = this.calculateConnectivityRatio(cluster);
        if (connectivityRatio >= this.registry.config.minLinkConnectivity) {
          const center = this.calculateClusterCenter(cluster);
          clusters.push({ nodeIds: cluster, center });
        }
      }
    }
    
    return clusters;
  }
  
  /**
   * Calculate connectivity ratio for a cluster
   */
  calculateConnectivityRatio(nodeIds) {
    let linkedCount = 0;
    const nodeSet = new Set(nodeIds);
    
    for (const link of this.links) {
      const fromId = this.getNodeId(link.from);
      const toId = this.getNodeId(link.to);
      
      if (nodeSet.has(fromId) && nodeSet.has(toId)) {
        linkedCount++;
      }
    }
    
    // Ratio of actual links to potential links
    const maxLinks = nodeIds.length * (nodeIds.length - 1) / 2;
    return linkedCount / Math.max(maxLinks, 1);
  }
  
  /**
   * Calculate center of cluster
   */
  calculateClusterCenter(nodeIds) {
    let x = 0, y = 0, z = 0;
    let count = 0;
    
    for (const nodeId of nodeIds) {
      const node = this.nodes[nodeId];
      if (node && node.position) {
        x += node.position.x;
        y += node.position.y;
        z += node.position.z;
        count++;
      }
    }
    
    return new THREE.Vector3(x / count, y / count, z / count);
  }
  
  /**
   * Get common colony if nodes belong to same one
   */
  getCommonColony(nodeIds) {
    const colonies = new Set();
    
    for (const nodeId of nodeIds) {
      const colonyId = this.registry.nodeToColony[nodeId];
      if (colonyId) {
        colonies.add(colonyId);
      }
    }
    
    // If all belong to same colony, return it
    if (colonies.size === 1) {
      return Array.from(colonies)[0];
    }
    
    return null;
  }
  
  /**
   * Classify colony type based on member nodes
   */
  classifyColonyType(nodeIds) {
    let legendaryCount = 0;
    let quantumCount = 0;
    let sigmaCount = 0;
    
    for (const nodeId of nodeIds) {
      const node = this.nodes[nodeId];
      if (!node) continue;
      
      // Check node type from userData
      if (node.userData) {
        if (node.userData.isLegendary) legendaryCount++;
        if (node.userData.type === 'quantum') quantumCount++;
        if (node.userData.type === 'sigma') sigmaCount++;
      }
    }
    
    if (legendaryCount > 0) return 'LEGENDARY';
    if (quantumCount > nodeIds.length * 0.3) return 'QUANTUM';
    if (sigmaCount > nodeIds.length * 0.3) return 'SIGMA';
    
    return 'DEFAULT';
  }
  
  /**
   * Create VFX for a new living civilization
   */
  createColonyVFX(colonyId) {
    const colony = this.registry.getColony(colonyId);
    if (!colony) return;

    const vfx = this.registry.colonyVFX[colonyId];
    const stage = Math.max(0, Math.min(4, colony.stage));
    const energy = colony.energy;
    const type = colony.type;
    const mood = colony.mood;
    const seedBase = parseInt(colonyId.split('_')[1] || '0', 10) || 0;
    const phaseSeed = ((seedBase * 0.61803398875) % 1 + 1) % 1;
    const pulseOffset = ((seedBase * 0.321) % 1 + 1) % 1;
    const ringSpeedBias = 0.08 + ((seedBase % 5) * 0.04);
    const particleBias = 0.75 + ((seedBase % 6) * 0.05);

    vfx.phaseSeed = phaseSeed;
    vfx.pulseOffset = pulseOffset;
    vfx.ringSpeedBias = ringSpeedBias;
    vfx.particleBias = particleBias;

    vfx.halo = this.vfxManager.createAtmosphere(
      colonyId,
      colony.center,
      stage,
      mood,
      type,
      energy
    );
    vfx.atmosphere = vfx.halo;
    vfx.particles = this.vfxManager.createParticles(
      colonyId,
      colony.center,
      stage,
      mood,
      type,
      energy
    );
    vfx.rings = stage >= 1
      ? this.vfxManager.createOrbitRings(
          colonyId,
          colony.center,
          stage,
          mood,
          type,
          energy
        )
      : [];
    vfx.canopy = stage >= 1
      ? this.vfxManager.createMoodCanopy(
          colonyId,
          colony.center,
          stage,
          mood,
          type,
          energy
        )
      : null;
    vfx.core = stage >= 2
      ? this.vfxManager.createCentralGlow(
          colonyId,
          colony.center,
          stage,
          mood,
          type,
          energy
        )
      : null;
    vfx.crown = null;

    if (type === 'LEGENDARY') {
      vfx.crown = this.vfxManager.createLegendaryCrown(
        colonyId,
        colony.center,
        stage,
        type,
        energy
      );
      vfx.legendaryHalo = this.vfxManager.createLegendaryHalo(
        colonyId,
        colony.center,
        stage,
        energy
      );
      vfx.legendaryPresence = this.vfxManager.createLegendaryPresence(
        colonyId,
        colony.center,
        stage
      );
      if (!vfx.sigils) {
        vfx.sigils = [];
      }
      vfx.sigils.push(
        this.vfxManager.createSigilRing(
          colonyId,
          colony.center,
          stage,
          mood,
          type,
          energy
        )
      );
      if (!vfx.beam) {
        vfx.beam = this.vfxManager.createAscensionBeam(
          colonyId,
          colony.center,
          stage,
          mood,
          type,
          energy
        );
      }
    }

    if (type === 'QUANTUM') {
      vfx.quantumAccent = this.vfxManager.createQuantumEdge(
        colonyId,
        colony.center,
        stage,
        mood,
        type,
        energy
      );
    } else if (type === 'SIGMA') {
      vfx.sigmaAccent = this.vfxManager.createSigmaCrackAccent(
        colonyId,
        colony.center,
        stage,
        mood,
        type,
        energy
      );
    }

    colony.vfxActive = true;
  }
  
  /**
   * Update civilization centers based on node positions
   */
  updateColonyCenters() {
    for (const colonyId in this.registry.colonies) {
      this.registry.updateColonyCenter(colonyId, this.nodes);
    }
  }
  
  /**
   * Accumulate energy and update civilization stages
   */
  accumulateEnergyAndUpdateStages() {
    for (const colonyId in this.registry.colonies) {
      const colony = this.registry.colonies[colonyId];
      if (!colony) continue;

      const previousStage = colony.stage;
      this.registry.accumulateEnergy(colonyId, this.nodes, this.synergyMap);
      this.registry.updateColonyStage(colonyId);

      if (colony.stage > previousStage) {
        this.triggerColonyGrowth(colonyId, previousStage, colony.stage);
      }
    }
  }
  
  /**
   * Update civilization moods based on conditions
   */
  updateColonyMoods() {
    for (const colonyId in this.registry.colonies) {
      const colony = this.registry.colonies[colonyId];
      
      // Check if world event is active
      const eventActive = this.worldEvents && this.worldEvents.isEventActive();
      
      // Get weather condition
      const weatherCondition = this.weatherRegistry ?
        this.weatherRegistry.currentWeather : null;
      
      this.registry.updateColonyMood(
        colonyId,
        this.nodes,
        this.synergyMap,
        this.trafficMap,
        weatherCondition,
        eventActive
      );
    }
  }
  
  /**
   * Check for and execute civilization merges
   */
  checkAndExecuteMerges() {
    const colonies = this.registry.getAllColonies();
    const processed = new Set();
    
    for (let i = 0; i < colonies.length; i++) {
      const colony1 = colonies[i];
      if (processed.has(colony1.id)) continue;
      
      for (let j = i + 1; j < colonies.length; j++) {
        const colony2 = colonies[j];
        if (processed.has(colony2.id)) continue;
        
        // Check merge conditions
        const distance = colony1.center.distanceTo(colony2.center);
        if (distance < this.registry.config.mergeDistance) {
          // Calculate interconnectedness
          const interconnection = this.calculateInterconnection(colony1, colony2);
          
          if (interconnection > 0.5) {
            // Execute merge
            const mergedId = this.registry.mergeColonies(colony1.id, colony2.id);
            
            if (mergedId) {
              const mergedColony = this.registry.colonies[mergedId];

              // Dramatic merge flash for source colonies
              this.vfxManager.triggerMergeFlash(colony1.id, colony1.center, 1.2);
              this.vfxManager.triggerMergeFlash(colony2.id, colony2.center, 1.2);

              // Create new VFX for merged colony and animate old visuals into it
              this.createColonyVFX(mergedId);
              this.vfxManager.triggerMergeTransition([colony1.id, colony2.id], mergedColony.center, 1.0);
              this.vfxManager.triggerColonyTransformation(mergedId, mergedColony.center, 1.1);
              this.vfxManager.triggerRebirthEvent(mergedId, mergedColony.center, 0.9);
              this.vfxManager.cleanupColonyVFX(colony1.id, { soft: true, duration: 1.0 });
              this.vfxManager.cleanupColonyVFX(colony2.id, { soft: true, duration: 1.0 });
              
              this.triggerColonyMerge(mergedId);
              
              processed.add(colony1.id);
              processed.add(colony2.id);
              processed.add(mergedId);
              
              this.stats.coloniesMerged++;
              
              if (this.debugMode) {
                console.log(`[Civilization] Merged: ${colony1.id} + ${colony2.id} → ${mergedId}`);
              }
              
              break;
            }
          }
        }
      }
    }
  }
  
  /**
   * Calculate interconnection between two colonies
   */
  calculateInterconnection(colony1, colony2) {
    let linkedPairs = 0;
    let totalPairs = 0;
    
    for (const nodeId1 of colony1.nodes) {
      for (const nodeId2 of colony2.nodes) {
        totalPairs++;
        
        // Check if linked
        for (const link of this.links) {
          const fromId = this.getNodeId(link.from);
          const toId = this.getNodeId(link.to);
          
          if ((fromId === nodeId1 && toId === nodeId2) ||
              (fromId === nodeId2 && toId === nodeId1)) {
            linkedPairs++;
            break;
          }
        }
      }
    }
    
    return totalPairs > 0 ? linkedPairs / totalPairs : 0;
  }
  
  /**
   * Check for and execute civilization splits
   */
  checkAndExecuteSplits() {
    for (const colonyId in this.registry.colonies) {
      const colony = this.registry.colonies[colonyId];
      
      // Only split if colony has enough nodes
      if (colony.nodes.size < 6) continue;
      
      // Find sub-clusters
      const subClusters = this.findSubClusters(colony);
      
      if (subClusters.length > 1) {
        // Check if split should happen (weak connectivity)
        const connectivity = this.calculateColonyConnectivity(colony);
        
        if (connectivity < this.registry.config.splitLinkFactor) {
          // Dramatic split rupture moment before creating child colonies
          this.vfxManager.triggerSplitRupture(colonyId, colony.center, 1.5, 1.0);

          // Execute split
          const newIds = this.registry.splitColony(colonyId, subClusters);
          
          if (newIds.length > 0) {
            // Create VFX for new colonies before old visuals dissolve
            for (const newId of newIds) {
              this.createColonyVFX(newId);
              this.vfxManager.triggerColonyTransformation(newId, this.registry.colonies[newId].center, 0.9);
              this.vfxManager.triggerRebirthEvent(newId, this.registry.colonies[newId].center, 0.9);
            }
            
            this.vfxManager.triggerSplitTransition(colonyId, 1.2);
            this.vfxManager.cleanupColonyVFX(colonyId, { soft: true, duration: 1.2 });
            
            this.triggerColonySplit(colonyId, newIds);
            
            this.stats.coloniesSplit++;
            
            if (this.debugMode) {
              console.log(`[Civilization] Split: ${colonyId} → [${newIds.join(', ')}]`);
            }
          }
        }
      }
    }
  }
  
  /**
   * Find sub-clusters within a colony
   */
  findSubClusters(colony) {
    // BFS within colony to find connected components
    const visited = new Set();
    const subClusters = [];
    const nodeArray = Array.from(colony.nodes);
    
    for (const startNodeId of nodeArray) {
      if (visited.has(startNodeId)) continue;
      
      const subCluster = [];
      const queue = [startNodeId];
      visited.add(startNodeId);
      
      while (queue.length > 0) {
        const currentId = queue.shift();
        const currentNode = this.nodes[currentId];
        
        if (!currentNode) continue;
        
        subCluster.push(currentId);
        
        // Find linked nodes within colony
        for (const link of this.links) {
          let otherNodeId = null;
          
          if (this.getNodeId(link.from) === currentId) {
            otherNodeId = this.getNodeId(link.to);
          } else if (this.getNodeId(link.to) === currentId) {
            otherNodeId = this.getNodeId(link.from);
          }
          
          if (otherNodeId && colony.nodes.has(otherNodeId) && !visited.has(otherNodeId)) {
            visited.add(otherNodeId);
            queue.push(otherNodeId);
          }
        }
      }
      
      if (subCluster.length > 0) {
        const center = this.calculateClusterCenter(subCluster);
        subClusters.push({ nodeIds: subCluster, center });
      }
    }
    
    return subClusters;
  }
  
  /**
   * Calculate connectivity within colony
   */
  calculateColonyConnectivity(colony) {
    let linkedCount = 0;
    const nodeArray = Array.from(colony.nodes);
    
    for (const link of this.links) {
      const fromId = this.getNodeId(link.from);
      const toId = this.getNodeId(link.to);
      
      if (nodeArray.includes(fromId) && nodeArray.includes(toId)) {
        linkedCount++;
      }
    }
    
    const maxLinks = nodeArray.length * (nodeArray.length - 1) / 2;
    return linkedCount / Math.max(maxLinks, 1);
  }
  
  /**
   * Update VFX for all colonies
   */
  updateVFX(deltaTime) {
    const envelopes = {};

    // Phase 1: sync position and base state
    for (const colonyId in this.registry.colonies) {
      const colony = this.registry.colonies[colonyId];
      const vfx = this.registry.colonyVFX[colonyId];
      if (!vfx) continue;

      const envelope = this.calculateVisualEnvelope(colony, deltaTime);
      envelopes[colonyId] = envelope;
      this.syncColonyVFXPosition(colony, vfx);
      this.vfxManager.updateVFXForColony(colonyId, colony, this.registry.colonyVFX, envelope);
    }

    // Phase 2: animate the VFX bundle
    this.vfxManager.update(deltaTime);

    // Phase 3: apply animated offsets and keep particles attached to the colony
    for (const colonyId in this.registry.colonies) {
      const colony = this.registry.colonies[colonyId];
      const vfx = this.registry.colonyVFX[colonyId];
      const envelope = envelopes[colonyId];
      if (!vfx || !envelope) continue;

      this.applyColonyVFXAnimation(colony, vfx, envelope, deltaTime);
    }
  }

  syncColonyVFXPosition(colony, vfx) {
    if (vfx.halo) {
      vfx.halo.position.copy(colony.center);
    }

    if (vfx.rings) {
      for (const ring of vfx.rings) {
        if (ring) ring.position.copy(colony.center);
      }
    }

    if (vfx.core) {
      vfx.core.position.copy(colony.center);
    }

    if (vfx.crown) {
      vfx.crown.position.copy(colony.center);
    }

    if (vfx.beam) {
      vfx.beam.position.copy(colony.center);
    }

    if (vfx.particles) {
      for (const particle of vfx.particles) {
        if (particle?.userData?.startPos) {
          particle.userData.startPos.copy(colony.center);
        }
      }
    }
  }

  applyColonyVFXAnimation(colony, vfx, envelope, deltaTime) {
    const offset = this.calculateBreathingOffset(colony, envelope);

    if (vfx.halo) {
      vfx.halo.position.copy(colony.center).add(offset);
    }

    if (vfx.rings) {
      for (const ring of vfx.rings) {
        if (ring) ring.position.copy(colony.center).add(offset);
      }
    }

    if (vfx.sigils) {
      for (const sigil of vfx.sigils) {
        if (sigil) sigil.position.copy(colony.center).add(offset);
      }
    }

    if (vfx.beam) {
      vfx.beam.position.copy(colony.center).add(offset);
    }

    if (vfx.core) {
      vfx.core.position.copy(colony.center).add(offset.clone().multiplyScalar(0.55));
    }

    if (vfx.crown) {
      vfx.crown.position.copy(colony.center).add(offset.clone().multiplyScalar(0.65));
    }
  }
  
  /**
   * Calculate visual envelope for stage and energy
   */
  calculateVisualEnvelope(colony, deltaTime) {
    const energyFactor = Math.min(1, colony.energy / 100);
    const speed = 0.85 + colony.stage * 0.12 + energyFactor * 0.18;
    const cycle = (this.time * speed + (parseInt(colony.id?.split('_')[1] || '0', 10) * 0.4)) % 1.0;
    const attack = this.smoothstep(0.0, 0.18, cycle);
    const release = this.smoothstep(0.76, 1.0, cycle);
    const crest = Math.max(0, 1 - Math.abs((cycle - 0.5) / 0.28));
    return {
      attack,
      crest,
      release,
      energyFactor,
      moodFactor: colony.mood === 'SYNERGY' ? 1.2 : colony.mood === 'LOAD_PRESSURE' ? 0.8 : 1.0
    };
  }

  /**
   * Get a small breathing offset for colony VFX
   */
  calculateBreathingOffset(colony, envelope) {
    const base = 0.02 + colony.stage * 0.01 + envelope.energyFactor * 0.02;
    const x = Math.sin(this.time * (0.6 + colony.stage * 0.1)) * base;
    const y = Math.cos(this.time * (0.9 + colony.stage * 0.12)) * base * 0.55;
    const z = Math.sin(this.time * (0.4 + colony.stage * 0.08)) * base * 0.7;
    return new THREE.Vector3(x, y, z);
  }

  smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  /**
   * React to world events (read-only)
   */
  reactToWorldEvents() {
    if (!this.worldEvents) return;

    const activeEvent = this.worldEvents.getActiveEvent?.() || this.worldEvents.getActiveEventInfo?.();
    const activeEventSource = this.worldEvents.getActiveEventType?.() || activeEvent?.type || activeEvent?.eventType || activeEvent?.name;
    const activeEventType = typeof activeEventSource === 'string'
      ? activeEventSource.toUpperCase().replace(/\s+/g, '_')
      : activeEventSource;
    const eventIntensity = this.worldEvents.getEventIntensity?.() ?? activeEvent?.intensity ?? 1.0;
    if (!activeEventType) return;

    const eventType = String(activeEventType).toUpperCase();
    const reaction = this.getWorldEventReaction(eventType, eventIntensity);

    for (const colonyId in this.registry.colonies) {
      const colony = this.registry.colonies[colonyId];
      const typeBonus = colony.type === 'LEGENDARY' ? 1.2 : colony.type === 'QUANTUM' ? 1.1 : colony.type === 'SIGMA' ? 1.05 : 1.0;
      const pulseIntensity = reaction.pulseIntensity * typeBonus;
      const glowIntensity = reaction.glowIntensity * typeBonus;
      const ringDeform = reaction.deformAmount;
      const duration = reaction.duration;

      this.vfxManager.triggerEventPulse(colonyId, pulseIntensity, duration);
      this.vfxManager.triggerEventColorShift(colonyId, reaction.color, duration * 0.9);
      this.vfxManager.intensifyEventGlow(colonyId, glowIntensity, duration);
      this.vfxManager.deformEventRings(colonyId, ringDeform, duration);
      this.vfxManager.boostEventRingSpin(colonyId, reaction.ringSpin, duration);

      if (reaction.activateCrown && colony.type === 'LEGENDARY') {
        this.vfxManager.activateEventCrown(colonyId, duration * 1.1);
      }

      if (reaction.extraPulseOnType && colony.type === reaction.extraPulseOnType) {
        this.vfxManager.triggerEventPulse(colonyId, reaction.extraPulseIntensity, duration * 0.8);
      }
    }
  }

  getWorldEventReaction(eventType, intensity = 1.0) {
    const baseIntensity = Math.min(1.2, Math.max(0.65, intensity));
    switch (eventType) {
      case 'COSMIC_PULSE':
        return {
          color: 0x66ccff,
          duration: 1.1,
          pulseIntensity: 1.1 * baseIntensity,
          glowIntensity: 0.9 * baseIntensity,
          deformAmount: 0.22,
          ringSpin: 0.15,
          activateCrown: true
        };
      case 'QUANTUM_ECLIPSE':
        return {
          color: 0x9900ff,
          duration: 1.4,
          pulseIntensity: 0.95 * baseIntensity,
          glowIntensity: 1.05 * baseIntensity,
          deformAmount: 0.18,
          ringSpin: 0.28,
          extraPulseOnType: 'QUANTUM',
          extraPulseIntensity: 1.05 * baseIntensity
        };
      case 'SIGMA_INVASION':
        return {
          color: 0xff3366,
          duration: 1.3,
          pulseIntensity: 1.25 * baseIntensity,
          glowIntensity: 0.85 * baseIntensity,
          deformAmount: 0.48,
          ringSpin: 0.32,
          activateCrown: true
        };
      case 'AURORA_STATE':
        return {
          color: 0x44ffcc,
          duration: 1.3,
          pulseIntensity: 0.75 * baseIntensity,
          glowIntensity: 1.1 * baseIntensity,
          deformAmount: 0.12,
          ringSpin: 0.08
        };
      case 'FRACTAL_STORM':
        return {
          color: 0xffcc44,
          duration: 1.4,
          pulseIntensity: 1.3 * baseIntensity,
          glowIntensity: 0.88 * baseIntensity,
          deformAmount: 0.6,
          ringSpin: 0.4
        };
      default:
        return {
          color: 0xffffff,
          duration: 1.0,
          pulseIntensity: 0.9,
          glowIntensity: 0.7,
          deformAmount: 0.2,
          ringSpin: 0.12
        };
    }
  }

  /**
   * Trigger colony pulse animation
   */
  triggerColonyPulse(colonyId) {
    this.vfxManager.triggerEventPulse(colonyId, 1.0, 0.8);
  }

  /**
   * Shift colony color (temporary)
   */
  shiftColonyColor(colonyId, targetColor) {
    this.vfxManager.triggerEventColorShift(colonyId, targetColor, 1.2);
  }

  /**
   * Intensify colony glow
   */
  intensifyColonyGlow(colonyId) {
    this.vfxManager.intensifyEventGlow(colonyId, 0.6, 1.6);
  }
  
  /**
   * Trigger colony birth event
   */
  triggerColonyBirth(colonyId) {
    const colony = this.registry.getColony(colonyId);
    if (!colony) return;
    
    const color = this.vfxManager.getColorForMood(colony.mood, colony.type);
    this.vfxManager.triggerBirthEvent(colonyId, colony.center, color);
  }
  
  /**
   * Trigger colony growth animation
   */
  triggerColonyGrowth(colonyId, fromStage, toStage) {
    const colony = this.registry.getColony(colonyId);
    if (!colony) return;

    const color = this.vfxManager.getColorForMood(colony.mood, colony.type);
    this.vfxManager.triggerGrowthEvent(colonyId, colony.center, color, toStage);

    if (this.debugMode) {
      console.log(`[Civilization] Growth: ${colonyId} from stage ${fromStage} to ${toStage}`);
    }
  }

  getColonyDebugLines(colony) {
    return [
      colony.id,
      `mood: ${colony.mood}`,
      `stage: ${colony.stage}`,
      `type: ${colony.type}`,
      `energy: ${Math.round(colony.energy)}`
    ];
  }

  /**
   * Trigger colony merge animation
   */
  triggerColonyMerge(colonyId) {
    const colony = this.registry.getColony(colonyId);
    if (!colony) return;

    const color = this.vfxManager.getColorForMood(colony.mood, colony.type);
    this.vfxManager.triggerMergeEvent(colonyId, colony.center, color);

    if (this.debugMode) {
      console.log(`[Civilization] Merge event for ${colonyId}`);
    }
  }

  /**
   * Trigger colony split animation
   */
  triggerColonySplit(colonyId, newIds) {
    const colony = this.registry.getColony(colonyId);
    if (!colony) return;
    
    const color = this.vfxManager.getColorForMood(colony.mood, colony.type);
    this.vfxManager.triggerSplitEvent(colonyId, colony.center, color);
    this.vfxManager.triggerCollapseEvent(colonyId, colony.center, color);
  }

  triggerColonyTransformation(colonyId, targetCenter, duration = 1.0) {
    const colony = this.registry.getColony(colonyId);
    if (!colony) return;
    this.vfxManager.triggerTransformationEvent(colonyId, targetCenter, duration);
    this.vfxManager.triggerEventPulse(colonyId, 0.8, duration * 0.9);
  }

  triggerColonyRebirth(colonyId, targetCenter, duration = 0.9) {
    const colony = this.registry.getColony(colonyId);
    if (!colony) return;
    this.vfxManager.triggerRebirthEvent(colonyId, targetCenter, duration);
  }
  
  /**
   * Cleanup and validation
   */
  cleanup() {
    // Remove empty colonies
    this.registry.cleanupEmptyColonies();
    
    // Cleanup expired VFX
    for (const colonyId in this.registry.colonies) {
      const vfx = this.registry.colonyVFX[colonyId];
      if (vfx && vfx.needsCleanup) {
        this.vfxManager.cleanupColonyVFX(colonyId);
        delete this.registry.colonyVFX[colonyId];
      }
    }
  }
  
  /**
   * Get debug information
   */
  getDebugInfo() {
    const stats = this.registry.getStats();
    return {
      ...stats,
      updateTime: this.stats.lastUpdateTime.toFixed(2) + 'ms',
      clustersCreated: this.stats.clustersCreated,
      coloniesMerged: this.stats.coloniesMerged,
      coloniesSplit: this.stats.coloniesSplit
    };
  }
  
  /**
   * Full cleanup on shutdown
   */
  shutdown() {
    this.vfxManager.cleanup();
    this.registry.colonies = {};
    this.registry.nodeToColony = {};
    this.registry.colonyVFX = {};
  }
}
