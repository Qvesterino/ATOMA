import * as THREE from 'three';
import { ColonyRegistry } from './ColonyRegistry.js';
import { ColonyVFXManager } from './ColonyVFXManager.js';

/**
 * SafeColonyExpansion2.js - Complete Living AI Ecosystem
 * 
 * SAFE: 100% external, read-only, non-destructive
 * - Manages colony formation, growth, splitting, merging
 * - All VFX-based, zero core engine modifications
 * - Reacts to world state: weather, events, legendary nodes
 * 
 * Main entry point for colony management in ATOMA
 */

export class SafeColonyExpansion2 {
  constructor(scene) {
    this.scene = scene;
    
    // Initialize subsystems
    this.registry = new ColonyRegistry(scene);
    this.vfxManager = new ColonyVFXManager(scene);
    
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
    this.nodes = worldSystems.nodes || {};
    this.links = worldSystems.links || [];
    this.legendaryRegistry = worldSystems.legendaryRegistry || null;
    this.weatherRegistry = worldSystems.weatherRegistry || null;
    this.worldEvents = worldSystems.worldEvents || null;
    this.evolutionRegistry = worldSystems.evolutionRegistry || null;
    this.synergyMap = worldSystems.synergyMap || {};
    this.trafficMap = worldSystems.trafficMap || {};
  }
  
  /**
   * Main update loop (call once per frame)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const startTime = performance.now();
    
    this.time += deltaTime;
    
    // Step 1: Detect and create clusters (every 0.5s)
    this.clusteringTimer += deltaTime;
    if (this.clusteringTimer >= this.registry.config.clusteringInterval) {
      this.detectAndFormClusters();
      this.clusteringTimer = 0;
    }
    
    // Step 2: Update colony centers based on node positions
    this.updateColonyCenters();
    
    // Step 3: Accumulate energy and update stages
    this.accumulateEnergyAndUpdateStages();
    
    // Step 4: Update moods based on current conditions
    this.moodUpdateTimer += deltaTime;
    if (this.moodUpdateTimer >= 0.3) {
      this.updateColonyMoods();
      this.moodUpdateTimer = 0;
    }
    
    // Step 5: Check for merges
    this.checkAndExecuteMerges();
    
    // Step 6: Check for splits
    this.checkAndExecuteSplits();
    
    // Step 7: Update VFX
    this.updateVFX(deltaTime);
    
    // Step 8: React to world events
    this.reactToWorldEvents();
    
    // Step 9: Cleanup
    this.cleanup();
    
    // Validate registry integrity
    if (this.debugMode) {
      this.registry.validateRegistry(this.nodes);
    }
    
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
          console.log(`[Colony] Birth: ${colonyId} with ${nodeIds.length} nodes (${colonyType})`);
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
          if (link.from && link.from.userData && link.from.userData.nodeId === currentId) {
            otherNodeId = link.to.userData.nodeId;
          } else if (link.to && link.to.userData && link.to.userData.nodeId === currentId) {
            otherNodeId = link.from.userData.nodeId;
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
      if (cluster.length >= this.registry.config.minNodesPerClony) {
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
      const fromId = link.from?.userData?.id;
      const toId = link.to?.userData?.id;
      
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
   * Create VFX for a new colony
   */
  createColonyVFX(colonyId) {
    const colony = this.registry.getColony(colonyId);
    if (!colony) return;
    
    const vfx = this.registry.colonyVFX[colonyId];
    
    // Create halo
    vfx.halo = this.vfxManager.createHalo(
      colonyId,
      colony.center,
      colony.stage,
      colony.mood,
      colony.type
    );
    
    // Create particles
    vfx.particles = this.vfxManager.createParticles(
      colonyId,
      colony.center,
      colony.stage,
      colony.mood,
      colony.type
    );
    
    // If legendary, create crown
    if (colony.type === 'LEGENDARY') {
      vfx.crown = this.vfxManager.createLegendaryCrown(
        colonyId,
        colony.center,
        colony.stage,
        colony.type
      );
    }
    
    colony.vfxActive = true;
  }
  
  /**
   * Update colony centers based on node positions
   */
  updateColonyCenters() {
    for (const colonyId in this.registry.colonies) {
      this.registry.updateColonyCenter(colonyId, this.nodes);
    }
  }
  
  /**
   * Accumulate energy and update stages
   */
  accumulateEnergyAndUpdateStages() {
    for (const colonyId in this.registry.colonies) {
      this.registry.accumulateEnergy(colonyId, this.nodes, this.synergyMap);
      this.registry.updateColonyStage(colonyId);
    }
  }
  
  /**
   * Update colony moods based on conditions
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
        weatherCondition,
        eventActive
      );
    }
  }
  
  /**
   * Check for and execute colony merges
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
              // Cleanup old VFX
              this.vfxManager.cleanupColonyVFX(colony1.id);
              this.vfxManager.cleanupColonyVFX(colony2.id);
              
              // Create new VFX for merged colony
              this.createColonyVFX(mergedId);
              
              this.triggerColonyMerge(mergedId);
              
              processed.add(colony1.id);
              processed.add(colony2.id);
              processed.add(mergedId);
              
              this.stats.coloniesMerged++;
              
              if (this.debugMode) {
                console.log(`[Colony] Merged: ${colony1.id} + ${colony2.id} → ${mergedId}`);
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
          const fromId = link.from?.userData?.id;
          const toId = link.to?.userData?.id;
          
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
   * Check for and execute colony splits
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
          // Execute split
          const newIds = this.registry.splitColony(colonyId, subClusters);
          
          if (newIds.length > 0) {
            // Cleanup old VFX
            this.vfxManager.cleanupColonyVFX(colonyId);
            
            // Create VFX for new colonies
            for (const newId of newIds) {
              this.createColonyVFX(newId);
            }
            
            this.triggerColonySplit(colonyId, newIds);
            
            this.stats.coloniesSplit++;
            
            if (this.debugMode) {
              console.log(`[Colony] Split: ${colonyId} → [${newIds.join(', ')}]`);
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
          
          if (link.from?.userData?.id === currentId) {
            otherNodeId = link.to?.userData?.id;
          } else if (link.to?.userData?.id === currentId) {
            otherNodeId = link.from?.userData?.id;
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
      const fromId = link.from?.userData?.id;
      const toId = link.to?.userData?.id;
      
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
    // Update manager animations
    this.vfxManager.update(deltaTime);
    
    // Update individual colony VFX
    for (const colonyId in this.registry.colonies) {
      const colony = this.registry.colonies[colonyId];
      const vfx = this.registry.colonyVFX[colonyId];
      
      if (!vfx) continue;
      
      // Update colors and states based on mood changes
      this.vfxManager.updateVFXForColony(colonyId, colony, this.registry.colonyVFX);
      
      // Update center positions
      if (vfx.halo) {
        vfx.halo.position.copy(colony.center);
      }
      
      for (const ring of vfx.rings) {
        ring.position.copy(colony.center);
      }
      
      if (vfx.core) {
        vfx.core.position.copy(colony.center);
      }
      
      if (vfx.crown) {
        vfx.crown.position.copy(colony.center);
      }
    }
  }
  
  /**
   * React to world events (read-only)
   */
  reactToWorldEvents() {
    if (!this.worldEvents) return;
    
    const activeEvent = this.worldEvents.getActiveEvent?.();
    if (!activeEvent) return;
    
    // Colonies respond to events
    for (const colonyId in this.registry.colonies) {
      const colony = this.registry.colonies[colonyId];
      
      // Trigger visual reaction based on event type
      if (activeEvent.type === 'COSMIC_PULSE') {
        this.triggerColonyPulse(colonyId);
      } else if (activeEvent.type === 'QUANTUM_ECLIPSE') {
        this.shiftColonyColor(colonyId, 0x9900ff);
      } else if (activeEvent.type === 'SIGMA_INVASION' && colony.type === 'SIGMA') {
        this.intensifyColonyGlow(colonyId);
      }
    }
  }
  
  /**
   * Trigger colony pulse animation
   */
  triggerColonyPulse(colonyId) {
    const vfx = this.registry.colonyVFX[colonyId];
    if (vfx && vfx.halo) {
      vfx.halo.userData.pulseAmplitude = 0.5;
    }
  }
  
  /**
   * Shift colony color (temporary)
   */
  shiftColonyColor(colonyId, targetColor) {
    const vfx = this.registry.colonyVFX[colonyId];
    if (vfx && vfx.halo && vfx.halo.material) {
      vfx.halo.material.color.setHex(targetColor);
    }
  }
  
  /**
   * Intensify colony glow
   */
  intensifyColonyGlow(colonyId) {
    const vfx = this.registry.colonyVFX[colonyId];
    if (vfx && vfx.halo && vfx.halo.material) {
      vfx.halo.material.opacity = Math.min(1, vfx.halo.material.opacity + 0.2);
    }
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
   * Trigger colony merge animation
   */
  triggerColonyMerge(colonyId) {
    // Create a temporary visual
    const colony = this.registry.getColony(colonyId);
    if (!colony) return;
    
    if (this.debugMode) {
      console.log(`[Colony] Merge event for ${colonyId}`);
    }
  }
  
  /**
   * Trigger colony split animation
   */
  triggerColonySplit(colonyId, newIds) {
    const colony = this.registry.getColony(colonyId);
    if (!colony) return;
    
    const color = this.vfxManager.getColorForMood(colony.mood, colony.type);
    this.vfxManager.triggerCollapseEvent(colonyId, colony.center, color);
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
