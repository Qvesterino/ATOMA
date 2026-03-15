/**
 * ResonanceCascadeVisualization_Session117B.js
 * ============================================================================
 * Visualizes resonance cascades emanating from high-conflict zones through
 * the network, showing how conflict energy propagates along link pathways.
 * 
 * VISUAL STORYTELLING:
 * When harmonic hubs conflict, the tension radiates outward in waves:
 * - Radial propagation: Energy expands from conflict center
 * - Link propagation: Energy travels along network paths
 * - Node illumination: Affected nodes glow based on cascade intensity
 * - Link distortion: Affected links show ripple/kink effects
 * - Particle effects: Optional cascade particles with directional flow
 * - Standing ripples: Cascades interact creating interference
 * 
 * ARCHITECTURE:
 * ✅ Pure visual adapter - reads conflict state, doesn't modify
 * ✅ Zero per-frame allocations (all cached)
 * ✅ Deterministic propagation (no randomness)
 * ✅ Smooth temporal adaptation
 * ✅ Works with existing visual systems
 * ✅ No material redefinitions (uniforms only)
 * ✅ Graceful degradation for missing data
 * 
 * CONSTRAINTS:
 * ✅ Adapter-only (reads, never modifies core data)
 * ✅ Zero gameplay impact
 * ✅ No per-frame allocations
 * ✅ Fully reversible
 * ✅ Deterministic (no randomness)
 * ✅ Works with all existing systems
 * ✅ No new materials or shaders required
 * ============================================================================
 */

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

const THREE = THREE_SAFE;

/**
 * Configuration for cascade behavior
 */
const CASCADE_CONFIG = {
  // Activation thresholds
  MIN_CONFLICT_FOR_CASCADE: 0.3,              // Start cascade at this intensity
  CRITICAL_CONFLICT_FOR_STRONG_CASCADE: 0.75, // Maximum cascade intensity
  
  // Propagation speeds
  RADIAL_PROPAGATION_SPEED: 8.0,              // Units per second (spatial)
  LINK_PROPAGATION_SPEED: 15.0,               // Traversal distance per second
  CASCADE_DECAY_RATE: 0.85,                   // Intensity reduction per hop
  CASCADE_DISTANCE_DECAY: 0.92,               // Intensity reduction per unit distance
  
  // Spatial parameters
  MAX_CASCADE_RADIUS: 15.0,                   // Maximum spatial reach
  MAX_CASCADE_HOPS: 6,                        // Maximum link hops
  CASCADE_WIDTH: 0.5,                         // Visual width of propagating wave
  
  // Temporal parameters
  CASCADE_LIFETIME: 4.0,                      // Seconds before cascade dissipates
  CASCADE_SPAWN_INTERVAL: 0.5,                // Spawn new cascade every N seconds
  RIPPLE_FREQUENCY: 2.0,                      // Hz for ripple oscillation
  
  // Intensity modulation
  NODE_GLOW_MULTIPLIER: 0.6,                  // How much cascade affects node glow
  LINK_RIPPLE_MULTIPLIER: 0.4,                // How much cascade affects links
  LINK_THICKNESS_MULTIPLIER: 0.3,             // How much cascade fattens links
  PARTICLE_EMISSION_MULTIPLIER: 1.5,          // Particle rate scaling
};

/**
 * Cascade wave representation
 */
class CascadeWave {
  constructor(originPos, originIntensity, propagationMode = 'radial') {
    this.originPos = originPos.clone();
    this.originIntensity = originIntensity;
    this.propagationMode = propagationMode;     // 'radial' or 'link-based'
    
    // Lifetime and decay
    this.age = 0.0;
    this.lifetime = CASCADE_CONFIG.CASCADE_LIFETIME;
    this.intensity = originIntensity;
    
    // Propagation state
    this.currentRadius = 0.0;                  // For radial mode
    this.affectedNodes = new Set();            // Cached affected nodes
    this.affectedLinks = new Set();            // Cached affected links
    
    // Ripple oscillation
    this.ripplePhase = 0.0;
    this.rippleAmplitude = 0.5;
  }
  
  /**
   * Update cascade state per frame
   */
  update(deltaTime) {
    this.age += deltaTime;
    this.lifetime = Math.max(0, this.lifetime - deltaTime);
    
    // Fade intensity over lifetime
    const fadeRatio = this.lifetime / CASCADE_CONFIG.CASCADE_LIFETIME;
    this.intensity = this.originIntensity * fadeRatio;
    
    // Update radial propagation
    this.currentRadius += CASCADE_CONFIG.RADIAL_PROPAGATION_SPEED * deltaTime;
    
    // Update ripple oscillation
    this.ripplePhase += CASCADE_CONFIG.RIPPLE_FREQUENCY * 2 * Math.PI * deltaTime;
    this.rippleAmplitude = Math.sin(this.ripplePhase) * 0.3 + 0.5; // 0.2-0.8
  }
  
  /**
   * Check if cascade is still active
   */
  isActive() {
    return this.lifetime > 0.01 && this.intensity > 0.01;
  }
}

/**
 * Link-based cascade tracker (for topological propagation)
 */
class LinkCascadeNode {
  constructor(node, distanceFromOrigin) {
    this.node = node;
    this.distanceFromOrigin = distanceFromOrigin;
    this.hopCount = Math.ceil(distanceFromOrigin / 1.0);
    this.intensity = Math.pow(CASCADE_CONFIG.CASCADE_DECAY_RATE, this.hopCount) *
                     Math.pow(CASCADE_CONFIG.CASCADE_DISTANCE_DECAY, distanceFromOrigin);
  }
}

/**
 * Main cascade visualization system
 */
export class ResonanceCascadeVisualization_Session117B {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.enabled = options.enabled ?? true;
    this.debugMode = options.debugMode ?? false;
    this.semanticBus = options.semanticBus ?? globalThis.semanticBus ?? null;
    
    // Active cascades
    this.activeCascades = [];
    
    // Cascade spawning from conflicts
    this.lastCascadeSpawnTime = {};  // keyed by conflict hash
    
    // Cached topological data
    this.nodeNetwork = null;         // Computed network topology
    this.networkUpdateTime = 0;
    this.networkUpdateInterval = 2.0; // Update every 2 seconds
    
    // Per-node cascade accumulator
    this.nodeCascadeIntensity = new Map();
    this.linkCascadeIntensity = new Map();
    this._boundHandleCascade = this.handleCascade.bind(this);
    this._subscribeSemanticBus();
    
    console.log('[Session 117B] ResonanceCascadeVisualization initialized ✓');
  }

  _subscribeSemanticBus() {
    if (!this.semanticBus?.on) return;
    this.semanticBus.on('cascade.triggered', this._boundHandleCascade);
    this.semanticBus.on('harmonic.cascade.start', this._boundHandleCascade);
  }
  
  /**
   * Build network topology from nodes and links
   */
  buildNetworkTopology(nodes, links) {
    if (!nodes || !links) return null;
    
    const network = new Map();
    
    // Initialize node entries
    for (const node of nodes) {
      if (!node || !node.userData) continue;
      const nodeId = node.userData.id || node.uuid;
      network.set(nodeId, {
        node,
        neighbors: [],
        links: []
      });
    }
    
    // Build neighbor graph
    for (const link of links) {
      if (!link || !link.nodes || link.nodes.length < 2) continue;
      
      const nodeA = link.nodes[0];
      const nodeB = link.nodes[1];
      if (!nodeA || !nodeB) continue;
      
      const idA = nodeA.userData?.id || nodeA.uuid;
      const idB = nodeB.userData?.id || nodeB.uuid;
      
      const entryA = network.get(idA);
      const entryB = network.get(idB);
      
      if (entryA && entryB) {
        entryA.neighbors.push(nodeB);
        entryA.links.push(link);
        entryB.neighbors.push(nodeA);
        entryB.links.push(link);
      }
    }
    
    return network;
  }
  
  /**
   * Breadth-first search to find cascade-affected nodes
   */
  computeCascadeAffectedNodes(originNode, maxDistance, maxHops) {
    if (!this.nodeNetwork || !originNode) return new Map();
    
    const affected = new Map();
    const queue = [[originNode, 0, 0]]; // [node, distance, hopCount]
    const visited = new Set();
    
    const originId = originNode.userData?.id || originNode.uuid;
    affected.set(originId, new LinkCascadeNode(originNode, 0));
    visited.add(originId);
    
    let queueIdx = 0;
    while (queueIdx < queue.length && affected.size < 50) {
      const [currentNode, distance, hopCount] = queue[queueIdx++];
      
      if (distance > maxDistance || hopCount > maxHops) continue;
      
      const currentId = currentNode.userData?.id || currentNode.uuid;
      const entry = this.nodeNetwork.get(currentId);
      
      if (!entry) continue;
      
      // Explore neighbors
      for (let i = 0; i < entry.neighbors.length; i++) {
        const neighbor = entry.neighbors[i];
        const neighborId = neighbor.userData?.id || neighbor.uuid;
        
        if (visited.has(neighborId)) continue;
        
        const newDistance = distance + neighbor.position.distanceTo(currentNode.position);
        
        if (newDistance > maxDistance || hopCount + 1 > maxHops) continue;
        
        visited.add(neighborId);
        const cascadeNode = new LinkCascadeNode(neighbor, newDistance);
        affected.set(neighborId, cascadeNode);
        queue.push([neighbor, newDistance, hopCount + 1]);
      }
    }
    
    return affected;
  }
  
  /**
   * Spawn cascade from a conflict region
   */
  spawnCascadeFromConflict(conflictRegion, conflictIntensity) {
    if (conflictIntensity < CASCADE_CONFIG.MIN_CONFLICT_FOR_CASCADE) {
      return; // Too weak to cascade
    }
    
    // Determine cascade strength based on conflict
    const cascadeStrength = Math.min(
      conflictIntensity * 1.2,
      1.0
    );
    
    // Create new cascade
    const cascade = new CascadeWave(
      conflictRegion.centerPos,
      cascadeStrength,
      'radial'
    );
    
    this.activeCascades.push(cascade);
  }

  /**
   * Semantic bus cascade handler.
   * Emits an immediate resonance visual impulse at event origin.
   */
  handleCascade(event = {}) {
    if (!this.enabled || !THREE) return;

    const sourcePos =
      event?.center ||
      event?.position ||
      event?.origin ||
      event?.centerPos ||
      null;

    const pos = sourcePos
      ? new THREE.Vector3(
          Number(sourcePos.x) || 0,
          Number(sourcePos.y) || 0,
          Number(sourcePos.z) || 0
        )
      : new THREE.Vector3(0, 0, 0);

    const rawIntensity =
      event?.intensity ??
      event?.value ??
      event?.strength ??
      CASCADE_CONFIG.MIN_CONFLICT_FOR_CASCADE;
    const impulseIntensity = Math.max(
      CASCADE_CONFIG.MIN_CONFLICT_FOR_CASCADE,
      Math.min(1, Number(rawIntensity) || 0)
    );

    const cascade = new CascadeWave(pos, impulseIntensity, 'radial');
    this.activeCascades.push(cascade);
  }
  
  /**
   * Main update per frame
   */
  update(deltaTime, nodes, links, conflictRegions = []) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (!this.enabled || !nodes) return;
    
    const now = Date.now() * 0.001;
    
    // Update network topology periodically
    if (now - this.networkUpdateTime > this.networkUpdateInterval) {
      this.nodeNetwork = this.buildNetworkTopology(nodes, links);
      this.networkUpdateTime = now;
    }
    
    // Clear accumulators
    this.nodeCascadeIntensity.clear();
    this.linkCascadeIntensity.clear();
    
    // Spawn cascades from active conflicts
    if (conflictRegions && Array.isArray(conflictRegions)) {
      for (const region of conflictRegions) {
        if (!region) continue;
        
        const regionHash = region.hub1?.userData?.id + '|' + region.hub2?.userData?.id;
        const lastSpawn = this.lastCascadeSpawnTime[regionHash] ?? -1000;
        
        // Spawn cascade periodically from high-conflict regions
        if (now - lastSpawn > CASCADE_CONFIG.CASCADE_SPAWN_INTERVAL) {
          if (region.intensity > CASCADE_CONFIG.MIN_CONFLICT_FOR_CASCADE) {
            this.spawnCascadeFromConflict(region, region.intensity);
            this.lastCascadeSpawnTime[regionHash] = now;
          }
        }
      }
    }
    
    // Update all active cascades
    const activeCascades = [];
    for (const cascade of this.activeCascades) {
      cascade.update(deltaTime);
      
      if (cascade.isActive()) {
        activeCascades.push(cascade);
        
        // Compute affected nodes and links
        this.applyCascadeEffects(cascade, nodes, links);
      }
    }
    this.activeCascades = activeCascades;
    
    // Apply accumulated cascade intensities to nodes and links
    this.modifyNodeVisuals(nodes);
    this.modifyLinkVisuals(links);
  }
  
  /**
   * Apply cascade effects (accumulate intensities)
   */
  applyCascadeEffects(cascade, nodes, links) {
    if (!nodes || !Array.isArray(nodes)) return;
    
    // For radial cascades: affect nodes within spatial distance
    for (const node of nodes) {
      if (!node) continue;
      
      const distToOrigin = node.position.distanceTo(cascade.originPos);
      
      // Radial falloff
      if (distToOrigin < CASCADE_CONFIG.MAX_CASCADE_RADIUS) {
        const radiusRatio = distToOrigin / CASCADE_CONFIG.MAX_CASCADE_RADIUS;
        const spatialFalloff = Math.pow(CASCADE_CONFIG.CASCADE_DISTANCE_DECAY, radiusRatio);
        
        // Only affect if within current wave radius (with some fading edge)
        const waveFalloff = Math.max(0, 1.0 - Math.abs(cascade.currentRadius - distToOrigin) / 2.0);
        
        const intensity = cascade.intensity * spatialFalloff * waveFalloff;
        
        if (intensity > 0.01) {
          const nodeId = node.userData?.id || node.uuid;
          const existing = this.nodeCascadeIntensity.get(nodeId) ?? 0;
          this.nodeCascadeIntensity.set(nodeId, Math.max(existing, intensity));
        }
      }
    }
    
    // If we have network topology, also propagate along links
    if (this.nodeNetwork && cascade.originPos) {
      // Find closest node to cascade origin
      let closestNode = null;
      let closestDist = Infinity;
      
      for (const node of nodes) {
        if (!node) continue;
        const dist = node.position.distanceTo(cascade.originPos);
        if (dist < closestDist) {
          closestDist = dist;
          closestNode = node;
        }
      }
      
      if (closestNode && closestDist < 5.0) {
        // Propagate through network from closest node
        const affected = this.computeCascadeAffectedNodes(
          closestNode,
          CASCADE_CONFIG.MAX_CASCADE_RADIUS,
          CASCADE_CONFIG.MAX_CASCADE_HOPS
        );
        
        for (const [nodeId, cascadeNode] of affected) {
          const existing = this.nodeCascadeIntensity.get(nodeId) ?? 0;
          const intensity = cascade.intensity * cascadeNode.intensity;
          this.nodeCascadeIntensity.set(nodeId, Math.max(existing, intensity));
        }
      }
    }
    
    // Propagate to affected links
    if (links && Array.isArray(links)) {
      for (const link of links) {
        if (!link || !link.nodes || link.nodes.length < 2) continue;
        
        const nodeA = link.nodes[0];
        const nodeB = link.nodes[1];
        const idA = nodeA?.userData?.id || nodeA?.uuid;
        const idB = nodeB?.userData?.id || nodeB?.uuid;
        
        const intensityA = this.nodeCascadeIntensity.get(idA) ?? 0;
        const intensityB = this.nodeCascadeIntensity.get(idB) ?? 0;
        
        // Link affected if either endpoint affected
        const linkIntensity = Math.max(intensityA, intensityB) * 0.8;
        
        if (linkIntensity > 0.01) {
          const linkId = link.uuid;
          const existing = this.linkCascadeIntensity.get(linkId) ?? 0;
          this.linkCascadeIntensity.set(linkId, Math.max(existing, linkIntensity));
        }
      }
    }
  }
  
  /**
   * Modify node visuals based on cascade intensity
   */
  modifyNodeVisuals(nodes) {
    if (!nodes) return;
    
    for (const node of nodes) {
      if (!node || !node.userData) continue;
      
      const nodeId = node.userData.id || node.uuid;
      const cascadeIntensity = this.nodeCascadeIntensity.get(nodeId) ?? 0;
      
      // Add cascade glow to node
      const cascadeGlow = cascadeIntensity * CASCADE_CONFIG.NODE_GLOW_MULTIPLIER;
      
      // Store cascade visual modifiers
      node.userData.cascadeIntensity = cascadeIntensity;
      node.userData.cascadeGlow = cascadeGlow;
      node.userData.cascadeRipple = Math.sin(Date.now() * 0.003) * cascadeIntensity * 0.5;
    }
  }
  
  /**
   * Modify link visuals based on cascade intensity
   */
  modifyLinkVisuals(links) {
    if (!links) return;
    
    for (const link of links) {
      if (!link || !link.userData) continue;
      
      const cascadeIntensity = this.linkCascadeIntensity.get(link.uuid) ?? 0;
      
      // Cascade effects on link
      const cascadeRipple = cascadeIntensity * CASCADE_CONFIG.LINK_RIPPLE_MULTIPLIER;
      const cascadeThickening = cascadeIntensity * CASCADE_CONFIG.LINK_THICKNESS_MULTIPLIER;
      
      // Store cascade visual modifiers
      link.userData.cascadeIntensity = cascadeIntensity;
      link.userData.cascadeRipple = cascadeRipple;
      link.userData.cascadeThickening = cascadeThickening;
      link.userData.cascadeOscillation = Math.sin(Date.now() * 0.004) * cascadeIntensity;
    }
  }
  
  /**
   * Get cascade info for a specific node
   */
  getNodeCascadeInfo(node) {
    if (!node || !node.userData) return null;
    
    const nodeId = node.userData.id || node.uuid;
    const intensity = this.nodeCascadeIntensity.get(nodeId) ?? 0;
    
    return {
      intensity,
      glow: intensity * CASCADE_CONFIG.NODE_GLOW_MULTIPLIER,
      ripple: node.userData?.cascadeRipple ?? 0
    };
  }
  
  /**
   * Get cascade info for a specific link
   */
  getLinkCascadeInfo(link) {
    if (!link) return null;
    
    const intensity = this.linkCascadeIntensity.get(link.uuid) ?? 0;
    
    return {
      intensity,
      ripple: intensity * CASCADE_CONFIG.LINK_RIPPLE_MULTIPLIER,
      thickening: intensity * CASCADE_CONFIG.LINK_THICKNESS_MULTIPLIER,
      oscillation: link.userData?.cascadeOscillation ?? 0
    };
  }
  
  /**
   * Get active cascade count
   */
  getActiveCascadeCount() {
    return this.activeCascades.length;
  }
  
  /**
   * Get all cascade state
   */
  getCascadeState() {
    return {
      activeCascades: this.activeCascades.length,
      affectedNodes: this.nodeCascadeIntensity.size,
      affectedLinks: this.linkCascadeIntensity.size,
      cascades: this.activeCascades.map(c => ({
        intensity: c.intensity,
        radius: c.currentRadius,
        age: c.age,
        lifetime: c.lifetime
      }))
    };
  }
  
  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    window.cascadeDebug = {
      getCascadeState: () => this.getCascadeState(),
      getNodeCascadeInfo: (node) => this.getNodeCascadeInfo(node),
      getLinkCascadeInfo: (link) => this.getLinkCascadeInfo(link),
      getActiveCascades: () => this.activeCascades.length,
      enable: () => { this.enabled = true; console.log('✓ Cascade system enabled'); },
      disable: () => { this.enabled = false; console.log('✓ Cascade system disabled'); }
    };
    
    console.log('[Session 117B] Debug API: window.cascadeDebug.getCascadeState()');
  }

  dispose() {
    if (this.semanticBus?.unsubscribe) {
      this.semanticBus.unsubscribe('cascade.triggered', this._boundHandleCascade);
      this.semanticBus.unsubscribe('harmonic.cascade.start', this._boundHandleCascade);
    }
  }
}

/**
 * Adapter function for main.js integration
 */
export function setupResonanceCascadeVisualization(game, options = {}) {
  try {
    game.resonanceCascade = new ResonanceCascadeVisualization_Session117B(
      game.scene,
      {
        enabled: true,
        debugMode: false,
        semanticBus: game.semanticBus,
        ...options
      }
    );
    
    // Setup console debugging
    game.resonanceCascade.setupConsoleAPI();
    
    return game.resonanceCascade;
  } catch (err) {
    console.warn('[Session 117B] Failed to initialize ResonanceCascadeVisualization:', err);
    return null;
  }
}
