import * as THREE from 'three';
import { MemoryTrailRegistry } from './MemoryTrailRegistry.js';
import { SafeNodeMemoryTrails } from './SafeNodeMemoryTrails.js';
import { SafeLinkMemoryTrails } from './SafeLinkMemoryTrails.js';
import { SafePlayerMemoryTrails } from './SafePlayerMemoryTrails.js';

/**
 * SAFE MEMORY TRAILS MANAGER (PACK 1.0)
 * 
 * Central manager coordinating all memory trail systems.
 * Orchestrates node trails, link trails, player trails, and world imprints.
 * 
 * ABSOLUTE SAFETY:
 * - ZERO modifications to any game systems
 * - ZERO modifications to Node, Link, Player classes
 * - ZERO modifications to physics or gameplay
 * - All trails are pure VFX
 * - All state external (MemoryTrailRegistry)
 * - Completely non-invasive and reversible
 */

export class SafeMemoryTrailsManager {
  constructor(scene, worldRoot, camera) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    const attachRoot = worldRoot || scene;
    
    // Central registry for all trail state
    this.registry = new MemoryTrailRegistry();
    
    // Trail systems
    this.nodeTrails = new SafeNodeMemoryTrails(scene, worldRoot, this.registry);
    this.linkTrails = new SafeLinkMemoryTrails(scene, worldRoot, this.registry);
    this.playerTrails = new SafePlayerMemoryTrails(scene, worldRoot, camera, this.registry);
    
    // World event imprint system
    this.eventImprintContainer = new THREE.Group();
    this.eventImprintContainer.name = 'EventImprintContainer';
    attachRoot.add(this.eventImprintContainer);
    this.root = this.eventImprintContainer;
    
    // Integration tracking
    this.aiNodesRef = null;
    this.linkingSystemRef = null;
    this.playerControllerRef = null;
    this.personalityFXRef = null;
    this.weatherPackRef = null;
    this.worldEventsRef = null;
    this.legendaryPackRef = null;
    
    // Update tracking
    this.lastNodeUpdateTime = 0;
    this.nodeUpdateInterval = 0.1; // Update node trails every 0.1s
    
    // Configuration
    this.enabled = true;
    this.config = {
      enableNodeTrails: true,
      enableLinkTrails: true,
      enablePlayerTrails: true,
      enableEventImprints: true,
      trailOpacity: 1.0,
      reactToWeather: true,
      reactToEvents: true,
      lodMode: 'HIGH' // HIGH, MEDIUM, LOW
    };
    
    console.log('✓ SafeMemoryTrailsManager 1.0 initialized');
  }
  
  /**
   * Register world system references (read-only)
   */
  registerWorldSystems(aiNodes, linkingSystem, playerController, personalityFX, weatherPack, worldEvents, legendaryPack) {
    this.aiNodesRef = aiNodes;
    this.linkingSystemRef = linkingSystem;
    this.playerControllerRef = playerController;
    this.personalityFXRef = personalityFX;
    this.weatherPackRef = weatherPack;
    this.worldEventsRef = worldEvents;
    this.legendaryPackRef = legendaryPack;
    
    console.log('✓ Memory Trails Manager: World systems registered (read-only)');
  }
  
  /**
   * Main update loop
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (!this.enabled) return;
    
    // Update registry (aging and cleanup)
    this.registry.update(deltaTime);
    
    // Update node trails
    if (this.config.enableNodeTrails && this.aiNodesRef) {
      this.updateNodeTrails(deltaTime);
    }
    
    // Update link trails
    if (this.config.enableLinkTrails && this.linkingSystemRef) {
      this.updateLinkTrails(deltaTime);
    }
    
    // Update player trail
    if (this.config.enablePlayerTrails && this.playerControllerRef) {
      this.updatePlayerTrail(deltaTime);
    }
    
    // Update event imprints
    if (this.config.enableEventImprints) {
      this.updateEventImprints(deltaTime);
    }
    
    // Apply LOD if needed
    this.applyLOD();
  }
  
  /**
   * Update node trails from active nodes
   */
  updateNodeTrails(deltaTime) {
    this.lastNodeUpdateTime += deltaTime;
    
    if (this.lastNodeUpdateTime < this.nodeUpdateInterval) return;
    this.lastNodeUpdateTime = 0;
    
    if (!this.aiNodesRef || !this.aiNodesRef.nodes) return;
    
    for (const node of this.aiNodesRef.nodes) {
      if (!node || !node.position) continue;
      
      const nodeId = node.id;
      
      // Register node trail if not already registered
      if (!this.nodeTrails.activeNodeIds.has(nodeId)) {
        let personalityColor = null;
        
        if (this.personalityFXRef && this.personalityFXRef.getNodeColor) {
          personalityColor = this.personalityFXRef.getNodeColor(nodeId);
        }
        
        this.nodeTrails.addNodeTrail(nodeId, node, personalityColor);
      }
      
      // Update trail with current position
      let intensity = 1.0;
      
      // React to personality changes
      if (this.personalityFXRef && this.personalityFXRef.getNodeIntensity) {
        intensity = this.personalityFXRef.getNodeIntensity(nodeId);
      }
      
      this.nodeTrails.updateNodeTrail(nodeId, node, intensity);
      
      // Create pulse when node is evolving
      if (this.legendaryPackRef && this.legendaryPackRef.isNodeLegendary && this.legendaryPackRef.isNodeLegendary(nodeId)) {
        // Legendary nodes create more intense trails
        this.nodeTrails.createPulseEcho(nodeId, node, 1.5);
      }
    }
    
    // Clean up trails for deleted nodes
    const deletedNodes = new Set();
    for (const nodeId of this.nodeTrails.activeNodeIds) {
      if (!this.aiNodesRef.nodes.find(n => n.id === nodeId)) {
        deletedNodes.add(nodeId);
      }
    }
    for (const nodeId of deletedNodes) {
      this.nodeTrails.removeNodeTrail(nodeId);
    }
    
    // Update node trails visuals
    this.nodeTrails.update(deltaTime, this.aiNodesRef.nodes, this.personalityFXRef, this.getWeatherIntensity());
  }
  
  /**
   * Update link trails from active links
   */
  updateLinkTrails(deltaTime) {
    if (!this.linkingSystemRef || !this.linkingSystemRef.links) return;
    
    for (const link of this.linkingSystemRef.links) {
      if (!link || !link.source || !link.target) continue;
      
      const linkId = link.id;
      
      // Register link trail if not already
      if (!this.linkTrails.activeLinkIds.has(linkId)) {
        let color = { r: 0.0, g: 1.0, b: 1.0 };
        
        // Get color from legendary link status
        if (this.legendaryPackRef && this.legendaryPackRef.getGlowColor) {
          color = this.legendaryPackRef.getGlowColor(linkId) || color;
        }
        
        this.linkTrails.addLinkTrail(linkId, link, color);
      }
      
      // Capture glow snapshot
      let glowIntensity = 0;
      let trafficLoad = 0;
      
      if (link.glowData) {
        glowIntensity = link.glowData.intensity || 0;
      }
      
      if (link.traffic) {
        trafficLoad = link.traffic.load || 0;
      }
      
      this.linkTrails.captureGlowSnapshot(linkId, glowIntensity, trafficLoad);
      
      // Add distortion for special link types
      if (this.legendaryPackRef && this.legendaryPackRef.getLinkType) {
        const linkType = this.legendaryPackRef.getLinkType(linkId);
        if (linkType === 'SIGMA') {
          this.linkTrails.createLinkDistortion(linkId, 'SIGMA');
        } else if (linkType === 'FRACTAL') {
          this.linkTrails.createLinkDistortion(linkId, 'FRACTAL');
        }
      }
    }
    
    // Clean up trails for deleted links
    const deletedLinks = new Set();
    for (const linkId of this.linkTrails.activeLinkIds) {
      if (!this.linkingSystemRef.links.find(l => l.id === linkId)) {
        deletedLinks.add(linkId);
      }
    }
    for (const linkId of deletedLinks) {
      this.linkTrails.removeLinkTrail(linkId);
    }
    
    // Update link trails visuals
    this.linkTrails.update(deltaTime, this.legendaryPackRef);
  }
  
  /**
   * Update player trail
   */
  updatePlayerTrail(deltaTime) {
    if (!this.playerControllerRef || !this.playerControllerRef.position) return;
    
    const playerPos = this.playerControllerRef.position;
    
    // Calculate movement speed
    let speed = 0;
    if (this.playerControllerRef.velocity) {
      speed = this.playerControllerRef.velocity.length();
    }
    
    // Update trail position
    this.playerTrails.updatePlayerTrail(playerPos, speed);
    
    // React to player actions (defensive checks)
    if (this.playerControllerRef.justJumped === true) {
      this.playerTrails.createJumpPulse(playerPos);
      this.playerControllerRef.justJumped = false;
    }
    
    if (this.playerControllerRef.isDashing === true) {
      const direction = this.playerControllerRef.getForwardDirection && typeof this.playerControllerRef.getForwardDirection === 'function'
        ? this.playerControllerRef.getForwardDirection() 
        : new THREE.Vector3(0, 0, -1);
      this.playerTrails.createDashPulse(playerPos, direction);
    }
    
    if (this.playerControllerRef.justBlinked === true) {
      const lastPos = (this.playerControllerRef.lastPosition && this.playerControllerRef.lastPosition.clone) 
        ? this.playerControllerRef.lastPosition.clone() 
        : playerPos.clone();
      this.playerTrails.createBlinkEffect(lastPos, playerPos);
      this.playerControllerRef.justBlinked = false;
    }
    
    // React to world events
    if (this.worldEventsRef && this.worldEventsRef.isEventActive()) {
      const eventType = this.worldEventsRef.getActiveEventType();
      const intensity = this.worldEventsRef.getEventIntensity();
      this.playerTrails.reactToWorldEvent(eventType, intensity);
    }
    
    // Update player trail visuals
    const eventData = this.worldEventsRef ? {
      isActive: this.worldEventsRef.isEventActive(),
      type: this.worldEventsRef.getActiveEventType(),
      intensity: this.worldEventsRef.getEventIntensity()
    } : null;
    
    this.playerTrails.update(deltaTime, eventData);
  }
  
  /**
   * Update world event imprints
   */
  updateEventImprints(deltaTime) {
    if (!this.worldEventsRef) return;
    
    if (this.worldEventsRef.isEventActive()) {
      const eventType = this.worldEventsRef.getActiveEventType();
      const intensity = this.worldEventsRef.getEventIntensity();
      
      // Occasionally add imprints during events
      if (Math.random() < intensity * 0.01) {
        const position = this.getRandomEventPosition();
        this.registry.addEventImprint(position, eventType, intensity);
      }
    }
  }
  
  /**
   * Get random position for event imprints (around nodes or player)
   */
  getRandomEventPosition() {
    if (Math.random() > 0.5 && this.aiNodesRef && this.aiNodesRef.nodes.length > 0) {
      // Random node
      const node = this.aiNodesRef.nodes[Math.floor(Math.random() * this.aiNodesRef.nodes.length)];
      return node.position.clone();
    } else if (this.playerControllerRef) {
      // Player position
      return this.playerControllerRef.position.clone();
    } else {
      return new THREE.Vector3(0, 0, 0);
    }
  }
  
  /**
   * Apply LOD based on performance budget
   */
  applyLOD() {
    const currentLOD = this.config.lodMode || 'HIGH';
    this.registry.enforceLOD(currentLOD);
  }
  
  /**
   * Get weather intensity for trail modulation
   */
  getWeatherIntensity() {
    if (this.weatherPackRef && this.weatherPackRef.isWeatherActive && this.weatherPackRef.isWeatherActive()) {
      return this.weatherPackRef.getWeatherIntensity ? this.weatherPackRef.getWeatherIntensity() : 0.5;
    }
    return 0;
  }
  
  /**
   * Get current stats
   */
  getStats() {
    return {
      registryStats: this.registry.getStats(),
      nodeTrailStats: this.nodeTrails.getStats(),
      linkTrailStats: this.linkTrails.getStats(),
      playerTrailStats: this.playerTrails.getStats(),
      eventImprints: this.registry.eventImprints.length,
      enabled: this.enabled
    };
  }
  
  /**
   * Enable/disable all trails
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  /**
   * Clear all trails
   */
  clearAllTrails() {
    this.nodeTrails.clearAllTrails();
    this.linkTrails.clearAllTrails();
    this.playerTrails.clearTrail();
    this.registry.clearAllTrails();
  }
  
  /**
   * Dispose all resources
   */
  dispose() {
    this.clearAllTrails();
    this.nodeTrails.dispose();
    this.linkTrails.dispose();
    this.playerTrails.dispose();
    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this.root?.clear?.();
  }
}
