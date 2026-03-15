/**
 * ParticleStreamCascadeAcceleration
 * ============================================================================
 * PARTICLE STREAM ACCELERATION BASED ON CASCADE LAYER DEPTH
 * 
 * Implements dynamic acceleration of particle streams based on their position
 * in the cascading harmonic resonance network layers. Particles accelerate
 * differently depending on cascade depth, creating visual stratification that
 * communicates network hierarchy and energy flow patterns.
 * 
 * CORE CONCEPT:
 * The cascading resonance system propagates harmonic state through network
 * topology layers. Particles emitted from nodes/links at different cascade
 * depths experience different acceleration patterns:
 * 
 * - Layer 0 (hubs): Slow, steady acceleration (strong harmonic control)
 * - Layer 1-2: Medium acceleration (cascade propagating)
 * - Layer 3-4: Faster acceleration (cascade attenuating, particles escape)
 * - Layer 5+: Maximum acceleration (far field, weak constraint)
 * 
 * PHYSICS INTERPRETATION:
 * - Deeper in cascade = stronger harmonic "gravity well" = slower particles
 * - Nodes near cascade origin hold particles with harmonic resonance
 * - Particles far from origin experience less resonant pull, accelerate away
 * - Visual result: Cascade depth visible through particle motion patterns
 * 
 * PARAMETERS:
 * - baseAcceleration: 0-1 scale, particle base acceleration rate
 * - cascadeStrength: 0-1 scale, node's cascade amplitude (from CascadingResonance)
 * - cascadeLayer: 0-N integer, layer depth in cascade
 * - cascadeAmplitude: 0-1 scale, resonance amplitude at this layer
 * 
 * ACCELERATION FORMULA:
 * AccelMult = 1 + (1 - cascadeStrength) × layerDepthCurve × stateMod
 * 
 * Where:
 * - (1 - cascadeStrength) = escape velocity factor (weak cascades → fast)
 * - layerDepthCurve = f(cascadeLayer) = deeper → faster
 * - stateMod = f(harmony, synergy, corruption)
 *   - Harmony: smooths acceleration (1 - 0.2 × harmony)
 *   - Synergy: amplifies acceleration (1 + 0.3 × synergy)
 *   - Corruption: adds turbulence (1 + 0.4 × corruption noise)
 * 
 * VISUAL EFFECTS:
 * - Constructive bursts from hub layers: slow, controlled
 * - Standing wave ripples: layer-dependent speeds
 * - Destructive chaos: accelerates away rapidly at deeper layers
 * - Standing wave rings: expand faster at peripheral layers
 * 
 * INTEGRATION:
 * const cascadeAccel = new ParticleStreamCascadeAcceleration(
 *   cascadingResonance, nodeDynamicMetrics, linkingSystem, waveParticleEmitter
 * );
 * 
 * // Per frame
 * cascadeAccel.update(deltaTime, time);
 * 
 * // Query acceleration modifier for particle system
 * const accelMult = cascadeAccel.getAccelerationMultiplier(nodeId);
 * const accelVec = cascadeAccel.getAccelerationVector(position, nodeId);
 * 
 * ============================================================================
 */

export class ParticleStreamCascadeAcceleration {
  constructor(
    cascadingResonance,
    nodeDynamicMetrics,
    linkingSystem,
    waveParticleEmitter,
    config = {}
  ) {
    this.cascadingResonance = cascadingResonance;
    this.nodeDynamicMetrics = nodeDynamicMetrics;
    this.linkingSystem = linkingSystem;
    this.waveParticleEmitter = waveParticleEmitter;

    // Configuration
    this.config = {
      // Base acceleration parameters
      baseAccelerationRate: config.baseAccelerationRate ?? 1.0,
      maxAccelerationMultiplier: config.maxAccelerationMultiplier ?? 3.0,
      
      // Layer depth curves
      useExponentialDepth: config.useExponentialDepth ?? true,
      depthExponent: config.depthExponent ?? 1.5,
      maxLayerDepth: config.maxLayerDepth ?? 6,
      
      // State modulation
      harmonyDamping: config.harmonyDamping ?? 0.2,
      synergyAmplification: config.synergyAmplification ?? 0.3,
      corruptionTurbulence: config.corruptionTurbulence ?? 0.4,
      
      // Cascade strength influence
      cascadeStrengthInfluence: config.cascadeStrengthInfluence ?? 0.8,
      
      // Directional acceleration
      useDirectionalAcceleration: config.useDirectionalAcceleration ?? true,
      accelerationDuration: config.accelerationDuration ?? 2.0, // seconds
      
      // Velocity direction (outward from cascade origin or radial from node)
      accelerationDirection: config.accelerationDirection ?? 'radial', // 'radial' or 'outward'
      
      debugMode: config.debugMode ?? false,
    };

    // Per-node acceleration caches
    this.accelCache = new Map(); // nodeId → { mult, vec, time }
    this.cacheValidTime = 0.05; // 50ms cache validity

    // Layer depth cache
    this.layerDepthCache = new Map(); // nodeId → layer

    // Time tracking
    this.lastUpdateTime = 0;

    // Console API registry
    this.consoleAPI = {
      getAccelMult: (nodeId) => this.getAccelerationMultiplier(nodeId),
      getLayerDepth: (nodeId) => this._getCachedLayerDepth(nodeId),
      setBaseRate: (rate) => { this.config.baseAccelerationRate = rate; },
      setMaxMult: (mult) => { this.config.maxAccelerationMultiplier = mult; },
      debugNode: (nodeId) => this._debugNode(nodeId),
    };

    if (this.config.debugMode) {
      console.log('[ParticleStreamCascadeAcceleration] Constructor initialized', this.config);
    }
  }

  /**
   * Per-frame update: invalidate caches, compute new acceleration multipliers
   */
  update(deltaTime, time) {
    this.lastUpdateTime = time;

    // Invalidate caches older than validity window
    for (const [nodeId, entry] of this.accelCache) {
      if (time - entry.time > this.cacheValidTime) {
        this.accelCache.delete(nodeId);
      }
    }

    // Optionally clear layer depth cache on slow cycle
    if (Math.floor(time * 10) % 5 === 0) {
      this.layerDepthCache.clear();
    }
  }

  /**
   * Get acceleration multiplier for particle emission at a node
   * @param {string} nodeId - Node identifier
   * @returns {number} Acceleration multiplier (1.0 = no acceleration)
   */
  getAccelerationMultiplier(nodeId) {
    // Return cached value if valid
    const cached = this.accelCache.get(nodeId);
    if (cached && this.lastUpdateTime - cached.time < this.cacheValidTime) {
      return cached.mult;
    }

    // Compute fresh acceleration multiplier
    const mult = this._computeAccelerationMultiplier(nodeId);

    // Cache result
    this.accelCache.set(nodeId, {
      mult,
      vec: null,
      time: this.lastUpdateTime,
    });

    return mult;
  }

  /**
   * Get acceleration vector (direction + magnitude) for a particle
   * @param {THREE.Vector3} position - Particle position
   * @param {string} nodeId - Originating node ID
   * @returns {THREE.Vector3} Acceleration vector
   */
  getAccelerationVector(position, nodeId) {
    const mult = this.getAccelerationMultiplier(nodeId);
    if (mult <= 1.0) return new THREE.Vector3(); // No acceleration

    const node = this.nodeDynamicMetrics.getNodeById(nodeId);
    if (!node) return new THREE.Vector3();

    const nodePos = node.position || new THREE.Vector3();
    const direction = new THREE.Vector3();

    if (this.config.accelerationDirection === 'outward') {
      // Direction: away from node origin
      direction.subVectors(position, nodePos).normalize();
    } else {
      // Direction: radial from node (same as outward in this case)
      direction.subVectors(position, nodePos).normalize();
    }

    // Scale by acceleration multiplier
    const baseMagnitude = this.config.baseAccelerationRate;
    direction.multiplyScalar((mult - 1.0) * baseMagnitude);

    return direction;
  }

  /**
   * INTERNAL: Compute acceleration multiplier for a specific node
   */
  _computeAccelerationMultiplier(nodeId) {
    const node = this.nodeDynamicMetrics.getNodeById(nodeId);
    if (!node) return 1.0;

    // Get cascade data for this node
    const cascadeStrength = node.userData?.cascadeStrength || 0;
    const cascadeLayer = node._cascadeLayer || 0;
    const cascadeAmplitude = node.userData?.cascadeAmplitude || 0;

    // Compute layer depth curve (deeper = faster acceleration)
    const layerDepthCurve = this._getLayerDepthCurve(cascadeLayer);

    // Escape velocity factor: weak cascades → fast particles
    const escapeVelocity = 1 - (cascadeStrength * this.config.cascadeStrengthInfluence);

    // Base acceleration multiplier
    let mult = 1.0 + escapeVelocity * layerDepthCurve;

    // Apply state modulation (harmony, synergy, corruption)
    mult *= this._getStateModulation(nodeId);

    // Clamp to max multiplier
    mult = Math.min(mult, this.config.maxAccelerationMultiplier);

    // Ensure minimum is 1.0 (no deceleration)
    mult = Math.max(mult, 1.0);

    return mult;
  }

  /**
   * INTERNAL: Layer depth curve function
   * Maps cascade layer (0-N) to acceleration multiplier component
   */
  _getLayerDepthCurve(cascadeLayer) {
    if (cascadeLayer === 0) {
      return 0; // Hub: no acceleration (strongest cascade hold)
    }

    // Normalize layer to 0-1 range
    const normalizedLayer = Math.min(cascadeLayer, this.config.maxLayerDepth) / this.config.maxLayerDepth;

    if (this.config.useExponentialDepth) {
      // Exponential curve: deeper layers accelerate faster
      return Math.pow(normalizedLayer, this.config.depthExponent);
    } else {
      // Linear curve
      return normalizedLayer;
    }
  }

  /**
   * INTERNAL: Get state-based modulation (harmony, synergy, corruption)
   */
  _getStateModulation(nodeId) {
    const node = this.nodeDynamicMetrics.getNodeById(nodeId);
    if (!node) return 1.0;

    // Get state metrics
    const harmony = node.harmony || 0;
    const synergy = node.synergy || 0;
    const corruption = node.corruption || 0;

    // Harmony: smooths acceleration (dampens particles)
    // High harmony → lower acceleration multiplier
    const harmonyEffect = 1 - (harmony * this.config.harmonyDamping);

    // Synergy: amplifies acceleration (speeds up particles)
    // High synergy → higher acceleration multiplier
    const synergyEffect = 1 + (synergy * this.config.synergyAmplification);

    // Corruption: adds turbulence (random acceleration spikes)
    // High corruption → higher acceleration variance
    const corruptionNoise = this._getCorruptionNoise(nodeId, corruption);
    const corruptionEffect = 1 + (corruption * this.config.corruptionTurbulence * corruptionNoise);

    // Combined modulation
    return harmonyEffect * synergyEffect * corruptionEffect;
  }

  /**
   * INTERNAL: Get deterministic corruption noise for this node
   */
  _getCorruptionNoise(nodeId, corruption) {
    // Deterministic pseudo-random based on nodeId and time
    // Hash nodeId to get base seed
    let hash = 0;
    for (let i = 0; i < nodeId.length; i++) {
      hash = ((hash << 5) - hash) + nodeId.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }

    // Combine with time for slow variation
    const timePhase = Math.floor(this.lastUpdateTime * 2) % 100;
    const seed = (hash + timePhase) % 1000;

    // Simple LCG pseudo-random generator
    const lcg = (seed * 1103515245 + 12345) % 2147483648;
    const normalized = lcg / 2147483648;

    // Map to -1 to 1 range
    return normalized * 2 - 1;
  }

  /**
   * INTERNAL: Cache and get layer depth for a node
   */
  _getCachedLayerDepth(nodeId) {
    if (this.layerDepthCache.has(nodeId)) {
      return this.layerDepthCache.get(nodeId);
    }

    const node = this.nodeDynamicMetrics.getNodeById(nodeId);
    const layer = node?._cascadeLayer ?? -1;

    this.layerDepthCache.set(nodeId, layer);
    return layer;
  }

  /**
   * INTERNAL: Debug output for a specific node
   */
  _debugNode(nodeId) {
    const node = this.nodeDynamicMetrics.getNodeById(nodeId);
    if (!node) {
      console.warn(`[ParticleStreamCascadeAcceleration] Node not found: ${nodeId}`);
      return;
    }

    const mult = this.getAccelerationMultiplier(nodeId);
    const layer = this._getCachedLayerDepth(nodeId);
    const cascadeStrength = node.userData?.cascadeStrength || 0;
    const cascadeAmplitude = node.userData?.cascadeAmplitude || 0;

    console.log(`[ParticleStreamCascadeAcceleration] Node ${nodeId}:`, {
      accelerationMultiplier: mult.toFixed(2),
      cascadeLayer: layer,
      cascadeStrength: cascadeStrength.toFixed(3),
      cascadeAmplitude: cascadeAmplitude.toFixed(3),
      harmony: (node.harmony || 0).toFixed(2),
      synergy: (node.synergy || 0).toFixed(2),
      corruption: (node.corruption || 0).toFixed(2),
    });
  }

  /**
   * Get console API for debugging (attach to window for console access)
   */
  getConsoleAPI() {
    return this.consoleAPI;
  }

  /**
   * Configure cascade acceleration via console
   */
  static setupConsoleAPI(cascadeAccelSystem) {
    window.cascadeAccelConsole = {
      ...cascadeAccelSystem.getConsoleAPI(),
      setDepthExponent: (exp) => {
        cascadeAccelSystem.config.depthExponent = exp;
        console.log(`[CascadeAccel] Depth exponent set to ${exp}`);
      },
      setMaxLayer: (maxLayer) => {
        cascadeAccelSystem.config.maxLayerDepth = maxLayer;
        console.log(`[CascadeAccel] Max layer depth set to ${maxLayer}`);
      },
      status: () => {
        console.log('[CascadeAccel] Configuration:', cascadeAccelSystem.config);
      },
    };
    console.log('[ParticleStreamCascadeAcceleration] Console API attached to window.cascadeAccelConsole');
  }
}

// Export for use in main.js
export default ParticleStreamCascadeAcceleration;
