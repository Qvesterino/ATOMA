/**
 * ParticleCascadeFlowDeflection
 * ============================================================================
 * PARTICLE DIRECTIONAL DEFLECTION BASED ON CASCADE FLOW PATTERNS
 * 
 * Deflects particle velocities to align with cascade flow direction, creating
 * visual streams that follow network energy propagation patterns. Particles
 * naturally flow from cascade origins (hubs) through network layers, making
 * cascade structure visually obvious through particle trajectories.
 * 
 * CORE CONCEPT:
 * Cascade resonance propagates outward from harmonic hubs through network
 * topology layers. Particles emitted from nodes in the cascade path are
 * deflected to follow this flow:
 * 
 * - Hub (layer 0): Emit particles outward from hub position
 * - Layer 1-2: Particles flow away from hub (layer-dependent direction)
 * - Layer 3+: Particles continue flowing outward (escape direction)
 * - Multi-cascade: Particles deflect based on strongest local cascade
 * 
 * DEFLECTION MECHANICS:
 * - Compute cascade flow direction per node (from layer to layer)
 * - For each particle: compute deflection force toward flow direction
 * - Blend with existing velocity (don't completely override)
 * - Strength scales with cascade amplitude + synergy
 * - Harmony smooths deflection, corruption adds turbulence
 * 
 * PARAMETERS:
 * - deflectionStrength: 0-1 scale, how much to deflect particles
 * - flowDirectionSmoothing: 0-1, blend old/new flow directions
 * - cascadeInfluence: 0-1, how much cascade strength affects deflection
 * - synergySensitivity: 0-1, how much synergy amplifies deflection
 * 
 * VISUAL EFFECTS:
 * - Constructive bursts: Deflect smoothly along flow lines
 * - Destructive chaos: Deflect with turbulent curves
 * - Standing waves: Expand radially then deflect outward
 * - Multi-cascade interference: Particles curve between cascade paths
 * 
 * INTEGRATION:
 * const flowDeflection = new ParticleCascadeFlowDeflection(
 *   cascadingResonance, nodeDynamicMetrics, linkingSystem
 * );
 * 
 * // Per frame
 * flowDeflection.update(deltaTime);
 * 
 * // Query deflection vector for particle
 * const deflectionVec = flowDeflection.getDeflectionVector(position, nodeId);
 * 
 * ============================================================================
 */

export class ParticleCascadeFlowDeflection {
  constructor(cascadingResonance, nodeDynamicMetrics, linkingSystem, config = {}) {
    this.cascadingResonance = cascadingResonance;
    this.nodeDynamicMetrics = nodeDynamicMetrics;
    this.linkingSystem = linkingSystem;
    this.semanticBus = config.semanticBus ?? globalThis?.semanticBus ?? null;

    this.config = {
      // Deflection parameters
      deflectionStrength: config.deflectionStrength ?? 0.6,
      maxDeflectionAngle: config.maxDeflectionAngle ?? Math.PI / 4, // 45 degrees
      
      // Flow direction computation
      flowDirectionSmoothing: config.flowDirectionSmoothing ?? 0.2, // EMA alpha
      useLocalTopology: config.useLocalTopology ?? true,
      neighborSearchRadius: config.neighborSearchRadius ?? 3, // Hops for topology
      
      // State modulation
      cascadeInfluence: config.cascadeInfluence ?? 0.8,
      synergySensitivity: config.synergySensitivity ?? 0.4,
      harmonySmoothness: config.harmonySmoothness ?? 0.3,
      corruptionTurbulence: config.corruptionTurbulence ?? 0.3,
      
      // Turbulence for chaos particles
      turbulenceScale: config.turbulenceScale ?? 0.15,
      turbulenceFrequency: config.turbulenceFrequency ?? 2.0,
      
      // Performance
      cacheValidTime: config.cacheValidTime ?? 0.05, // 50ms cache validity
      
      debugMode: config.debugMode ?? false,
    };

    // Per-node flow direction cache
    this.flowDirectionCache = new Map(); // nodeId → Vector3
    this.flowStrengthCache = new Map();  // nodeId → strength (0-1)
    
    // Temporal tracking
    this.lastUpdateTime = 0;
    this.noisePhase = 0;
    
    // Topology cache
    this.neighborCache = new Map(); // nodeId → Set<neighborNodeId>
    this.topologyGeneration = -1;
    this._semanticUnsubscribers = [];

    if (this.config.debugMode) {
      console.log('[ParticleCascadeFlowDeflection] Constructor initialized', this.config);
    }

    this._setupSemanticSubscriptions();
  }

  _setupSemanticSubscriptions() {
    if (!this.semanticBus || typeof this.semanticBus.subscribe !== 'function') return;

    const onMetricUpdated = (payload = {}) => {
      const nodeId = payload?.nodeId;
      if (nodeId === undefined || nodeId === null) return;
      this.flowDirectionCache.delete(String(nodeId));
      this.flowStrengthCache.delete(String(nodeId));
    };

    const onTopologyChanged = () => {
      this.flowDirectionCache.clear();
      this.flowStrengthCache.clear();
      this.neighborCache.clear();
    };

    const unsubMetric = this.semanticBus.subscribe('node.metric.updated', onMetricUpdated);
    const unsubLink = this.semanticBus.subscribe('link.created', onTopologyChanged);
    const unsubSpawn = this.semanticBus.subscribe('node.spawned', onTopologyChanged);

    if (typeof unsubMetric === 'function') this._semanticUnsubscribers.push(unsubMetric);
    if (typeof unsubLink === 'function') this._semanticUnsubscribers.push(unsubLink);
    if (typeof unsubSpawn === 'function') this._semanticUnsubscribers.push(unsubSpawn);
  }

  /**
   * Per-frame update: recompute flow directions
   */
  update(deltaTime, time) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    this.lastUpdateTime = time || Date.now() / 1000;
    this.noisePhase += deltaTime * this.config.turbulenceFrequency;

    // Invalidate caches older than validity window
    if (deltaTime > this.config.cacheValidTime) {
      this.flowDirectionCache.clear();
      this.flowStrengthCache.clear();
    }
  }

  /**
   * Get deflection vector for a particle at given position from given node
   * @param {THREE.Vector3} position - Particle world position
   * @param {string} sourceNodeId - ID of node emitting particle
   * @returns {THREE.Vector3} Deflection direction vector (magnitude 0-1)
   */
  getDeflectionVector(position, sourceNodeId) {
    if (!position) return new THREE.Vector3();

    const sourceNode = this.nodeDynamicMetrics?.getNodeById?.(sourceNodeId);
    if (!sourceNode) return new THREE.Vector3();

    // Compute flow direction from this node
    const flowDir = this._getFlowDirection(sourceNodeId);
    if (flowDir.lengthSq() < 0.001) return new THREE.Vector3(); // No flow

    // Get cascade strength at this node
    const cascadeStrength = sourceNode.userData?.cascadeStrength || 0;
    const cascadeLayer = sourceNode._cascadeLayer || 0;
    const cascadeAmplitude = sourceNode.userData?.cascadeAmplitude || 0;

    // Compute deflection strength
    let strength = cascadeStrength * this.config.cascadeInfluence;
    
    // Synergy amplifies deflection
    const synergy = sourceNode.synergy || 0;
    strength *= (1 + synergy * this.config.synergySensitivity);

    // Harmony smooths deflection
    const harmony = sourceNode.harmony || 0;
    strength *= (1 - harmony * this.config.harmonySmoothness * 0.5);

    // Corruption adds turbulence
    const corruption = sourceNode.corruption || 0;
    if (corruption > 0.1) {
      const turbulence = this._getTurbulenceNoise(sourceNodeId, corruption);
      // Create perpendicular deflection from corruption
      const perpDir = new THREE.Vector3(-flowDir.y, flowDir.x, 0).normalize();
      perpDir.multiplyScalar(turbulence * corruption * this.config.corruptionTurbulence);
      flowDir.add(perpDir);
      flowDir.normalize();
    }

    // Clamp strength to 0-1
    strength = Math.max(0, Math.min(1, strength));

    // Apply deflection strength scaling
    const deflectionMagnitude = strength * this.config.deflectionStrength;
    const deflectionVector = flowDir.clone().multiplyScalar(deflectionMagnitude);

    return deflectionVector;
  }

  /**
   * Get deflection influence (for particle lifetime/intensity modulation)
   * @param {string} nodeId - Node ID
   * @returns {number} Influence factor (0-1)
   */
  getDeflectionInfluence(nodeId) {
    const cached = this.flowStrengthCache.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }

    const node = this.nodeDynamicMetrics?.getNodeById?.(nodeId);
    if (!node) return 0;

    const cascadeStrength = node.userData?.cascadeStrength || 0;
    const synergy = node.synergy || 0;
    const influence = cascadeStrength * (1 + synergy * 0.3);

    this.flowStrengthCache.set(nodeId, influence);
    return influence;
  }

  /**
   * INTERNAL: Compute primary flow direction for a node
   * Direction flows from this node toward next layer (away from hub)
   */
  _getFlowDirection(nodeId) {
    // Check cache
    const cached = this.flowDirectionCache.get(nodeId);
    if (cached) {
      return cached.clone();
    }

    const node = this.nodeDynamicMetrics?.getNodeById?.(nodeId);
    if (!node || !node.position) {
      return new THREE.Vector3();
    }

    const cascadeLayer = node._cascadeLayer || 0;
    const cascadeStrength = node.userData?.cascadeStrength || 0;

    // For hub (layer 0), compute average outward direction from all neighbors
    if (cascadeLayer === 0) {
      return this._computeHubFlowDirection(nodeId, node);
    }

    // For non-hubs, compute direction toward next layer (away from cascade source)
    return this._computeLayerFlowDirection(nodeId, node, cascadeLayer);
  }

  /**
   * INTERNAL: For hub, compute radial outward flow direction
   */
  _computeHubFlowDirection(hubNodeId, hubNode) {
    const neighbors = this._getNeighbors(hubNodeId);
    if (neighbors.size === 0) {
      // No neighbors, flow in random outward direction
      const angle = Math.random() * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    }

    // Average direction toward neighbors
    let avgDir = new THREE.Vector3();
    const hubPos = hubNode.position;

    for (const neighborId of neighbors) {
      const neighbor = this.nodeDynamicMetrics?.getNodeById?.(neighborId);
      if (neighbor?.position) {
        const direction = new THREE.Vector3()
          .subVectors(neighbor.position, hubPos)
          .normalize();
        avgDir.add(direction);
      }
    }

    if (avgDir.lengthSq() > 0.001) {
      avgDir.normalize();
    } else {
      // Fallback: random direction
      const angle = Math.random() * Math.PI * 2;
      avgDir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    }

    this.flowDirectionCache.set(hubNodeId, avgDir.clone());
    return avgDir;
  }

  /**
   * INTERNAL: For layer nodes, compute direction to next layer (away from hub)
   */
  _computeLayerFlowDirection(nodeId, node, cascadeLayer) {
    const neighbors = this._getNeighbors(nodeId);
    if (neighbors.size === 0) {
      return new THREE.Vector3();
    }

    // Find neighbors in deeper layers (higher layer number)
    const deeperNeighbors = [];
    for (const neighborId of neighbors) {
      const neighbor = this.nodeDynamicMetrics?.getNodeById?.(neighborId);
      if (neighbor && (neighbor._cascadeLayer ?? 0) > cascadeLayer) {
        deeperNeighbors.push(neighbor);
      }
    }

    // If no deeper neighbors, find any neighbor farther from hub
    if (deeperNeighbors.length === 0) {
      for (const neighborId of neighbors) {
        const neighbor = this.nodeDynamicMetrics?.getNodeById?.(neighborId);
        if (neighbor) {
          deeperNeighbors.push(neighbor);
        }
      }
    }

    // Average direction toward deeper neighbors
    let flowDir = new THREE.Vector3();
    const nodePos = node.position;

    for (const deeperNeighbor of deeperNeighbors) {
      if (deeperNeighbor.position) {
        const direction = new THREE.Vector3()
          .subVectors(deeperNeighbor.position, nodePos)
          .normalize();
        flowDir.add(direction);
      }
    }

    if (flowDir.lengthSq() > 0.001) {
      flowDir.normalize();
    } else {
      // Fallback: radial outward from cascade source
      // (we don't know source, so use general upward direction)
      flowDir = new THREE.Vector3(0, 1, 0);
    }

    this.flowDirectionCache.set(nodeId, flowDir.clone());
    return flowDir;
  }

  /**
   * INTERNAL: Get deterministic turbulence noise for chaos particles
   */
  _getTurbulenceNoise(nodeId, corruption) {
    // Hash nodeId and time to get pseudo-random noise
    let hash = 0;
    for (let i = 0; i < nodeId.length; i++) {
      hash = ((hash << 5) - hash) + nodeId.charCodeAt(i);
      hash |= 0;
    }

    // Combine with phase for temporal variation
    const seed = (hash + Math.floor(this.noisePhase * 10)) % 1000;
    
    // Simple LCG pseudo-random
    const lcg = (seed * 1103515245 + 12345) % 2147483648;
    const normalized = lcg / 2147483648;

    // Map to -1 to 1
    return normalized * 2 - 1;
  }

  /**
   * INTERNAL: Get neighbors for a node (with caching)
   */
  _getNeighbors(nodeId) {
    if (this.neighborCache.has(nodeId)) {
      return this.neighborCache.get(nodeId);
    }

    const neighbors = new Set();

    // Query linking system for connected nodes
    if (this.linkingSystem?.links) {
      for (const link of this.linkingSystem.links) {
        if (link.source?.id === nodeId || link.source === nodeId) {
          const targetId = link.target?.id || link.target;
          if (targetId) neighbors.add(targetId);
        }
        if (link.target?.id === nodeId || link.target === nodeId) {
          const sourceId = link.source?.id || link.source;
          if (sourceId) neighbors.add(sourceId);
        }
      }
    }

    this.neighborCache.set(nodeId, neighbors);
    return neighbors;
  }

  /**
   * Get console API for debugging
   */
  getConsoleAPI() {
    return {
      getFlowDir: (nodeId) => {
        const dir = this._getFlowDirection(nodeId);
        console.log(`Flow direction for ${nodeId}:`, {
          x: dir.x.toFixed(3),
          y: dir.y.toFixed(3),
          z: dir.z.toFixed(3),
        });
      },
      
      getInfluence: (nodeId) => {
        const inf = this.getDeflectionInfluence(nodeId);
        console.log(`Deflection influence for ${nodeId}: ${inf.toFixed(3)}`);
      },
      
      setStrength: (strength) => {
        this.config.deflectionStrength = Math.max(0, Math.min(1, strength));
        console.log(`[FlowDeflection] Strength set to ${this.config.deflectionStrength}`);
      },
      
      setSynergySensitivity: (sensitivity) => {
        this.config.synergySensitivity = Math.max(0, Math.min(1, sensitivity));
        console.log(`[FlowDeflection] Synergy sensitivity set to ${sensitivity}`);
      },
      
      setTurbulence: (scale) => {
        this.config.turbulenceScale = Math.max(0, Math.min(1, scale));
        console.log(`[FlowDeflection] Turbulence scale set to ${scale}`);
      },
      
      status: () => {
        console.log('[FlowDeflection] Configuration:', {
          deflectionStrength: this.config.deflectionStrength,
          synergySensitivity: this.config.synergySensitivity,
          turbulenceScale: this.config.turbulenceScale,
          cachedNodes: this.flowDirectionCache.size,
        });
      },
      
      help: () => {
        console.log(`[FlowDeflection] Available commands:
          getFlowDir(nodeId) - Show flow direction vector
          getInfluence(nodeId) - Show deflection influence
          setStrength(0-1) - Set overall deflection strength
          setSynergySensitivity(0-1) - Set synergy amplification
          setTurbulence(0-1) - Set chaos turbulence scale
          status() - Show current configuration
          help() - Show this message`);
      },
    };
  }

  /**
   * Static setup function for console API
   */
  static setupConsoleAPI(flowDeflectionSystem) {
    window.cascadeFlowDeflection = flowDeflectionSystem.getConsoleAPI();
    console.log('[ParticleCascadeFlowDeflection] Console API attached to window.cascadeFlowDeflection');
  }

  dispose() {
    for (const unsub of this._semanticUnsubscribers) {
      try {
        unsub?.();
      } catch (_) {
        // noop
      }
    }
    this._semanticUnsubscribers.length = 0;
  }
}

export default ParticleCascadeFlowDeflection;
