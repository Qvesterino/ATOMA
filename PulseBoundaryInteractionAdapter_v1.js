/**
 * PulseBoundaryInteractionAdapter_v1.js
 * ============================================================================
 * Pulse Wave Energy Dissipation & Absorption at Node Boundaries
 * 
 * VISUAL NARRATIVE LAYER: When pulses reach node endpoints, they produce
 * energy interaction effects:
 * - Absorption: node halo briefly intensifies
 * - Dissipation: pulse fades over endpoint
 * - Reflection (rare): weaker pulse rebounds
 * - Split (hubs): energy fans into outgoing links
 * 
 * NO GAMEPLAY CHANGES, NO ALLOCATIONS, DETERMINISTIC ONLY
 * Pure visual storytelling about energy flow and network state.
 * 
 * State-Driven Behavior:
 * - Harmony/Corruption determine absorption vs dissipation
 * - Instability suppresses absorption, increases dissipation
 * - Synergy amplifies absorption and split likelihood
 * - Hub status controls split behavior
 */

/**
 * Transient boundary effect tracker
 * Cached pool, no per-frame allocations
 */
class BoundaryEffectPool {
  constructor(maxEffects = 50) {
    this.maxEffects = maxEffects;
    this.active = [];           // Currently active effects
    this.pool = [];             // Pre-allocated pool
    this.nextIndex = 0;
    
    // Pre-allocate pool
    for (let i = 0; i < maxEffects; i++) {
      this.pool.push({
        type: '',               // 'absorption', 'dissipation', 'reflection', 'split'
        nodeId: '',
        linkId: '',
        startTime: 0,
        duration: 0,
        intensity: 0,
        phase: 0,               // For wave-like effects
        data: {}                // Effect-specific data
      });
    }
  }

  /**
   * Get or create effect
   */
  spawn(type, config) {
    let effect;
    if (this.active.length < this.maxEffects) {
      effect = this.pool[this.nextIndex];
      this.nextIndex = (this.nextIndex + 1) % this.maxEffects;
    } else {
      // Reuse oldest active if at limit
      effect = this.active.shift();
    }

    // Configure
    effect.type = type;
    effect.nodeId = config.nodeId || '';
    effect.linkId = config.linkId || '';
    effect.startTime = Date.now();
    effect.duration = config.duration || 200;
    effect.intensity = config.intensity || 1.0;
    effect.phase = 0;
    Object.assign(effect.data, config.data || {});

    this.active.push(effect);
    return effect;
  }

  /**
   * Update all active effects (decay, expire)
   */
  update() {
    const now = Date.now();
    this.active = this.active.filter(effect => {
      const elapsed = now - effect.startTime;
      if (elapsed > effect.duration) return false;

      // Decay intensity from 1 to 0
      effect.intensity = 1 - (elapsed / effect.duration);
      effect.phase = (elapsed / effect.duration) * Math.PI * 2;
      return true;
    });
  }

  /**
   * Get active effects for a node
   */
  getNodeEffects(nodeId) {
    return this.active.filter(e => e.nodeId === nodeId);
  }

  /**
   * Get active effects for a link
   */
  getLinkEffects(linkId) {
    return this.active.filter(e => e.linkId === linkId);
  }

  /**
   * Clear all
   */
  clear() {
    this.active.length = 0;
    this.nextIndex = 0;
  }
}

/**
 * Main boundary interaction adapter
 */
export class PulseBoundaryInteractionAdapter_v1 {
  constructor(config = {}) {
    this.enabled = config.enabled ?? true;
    this.debugMode = config.debugMode ?? false;
    
    // Effect pool (cached, no allocations)
    this.effectPool = new BoundaryEffectPool(config.maxBoundaryEffects ?? 50);
    
    // Configuration
    this.minAmplitudeToInteract = config.minAmplitudeToInteract ?? 0.15;
    this.absorptionDuration = config.absorptionDuration ?? 180;      // ms
    this.dissipationDuration = config.dissipationDuration ?? 120;    // ms
    this.reflectionAmplitudeFactor = config.reflectionAmplitudeFactor ?? 0.45;
    this.maxReflectionCount = config.maxReflectionCount ?? 1;
    this.maxSplitCount = config.maxSplitCount ?? 3;
    
    // Tracking (lightweight)
    this.pulseStates = new Map();  // linkId → { pulseT, direction, reflectionCount, ... }
    
    // Console API
    this.setupConsoleAPI();
    
    console.log('[PulseBoundaryInteractionAdapter] Initialized ✓');
  }

  /**
   * Process pulse boundary interactions
   * Call once per frame AFTER pulses have moved
   * 
   * @param {Object} context - { links, nodes, nodeDynamicMetrics, ... }
   */
  update(context = {}) {
    if (!this.enabled) return;
    
    const {
      links = [],
      nodes = [],
      nodeDynamicMetrics,
      aiNodes
    } = context;
    
    try {
      // Update effect pool (decay active effects)
      this.effectPool.update();
      
      // Process each link for boundary interactions
      for (const link of links) {
        if (!link || !link.userData) continue;
        
        const linkId = link.id || link.uuid || link.name;
        if (!linkId) continue;
        
        // Get pulse data from link
        const pulseData = link.userData.pulseTravelData;
        if (!pulseData || pulseData.length === 0) continue;
        
        // Process each active pulse on this link
        for (const pulse of pulseData) {
          this.processPulseBoundary(
            pulse,
            link,
            linkId,
            nodes,
            nodeDynamicMetrics,
            aiNodes
          );
        }
      }
      
      // Apply boundary effect modulations to nodes and links
      this.applyBoundaryEffectModulations(links, nodes);
      
    } catch (err) {
      console.warn('[PulseBoundaryInteractionAdapter] update error:', err);
    }
  }

  /**
   * Check if pulse reached a boundary and trigger interactions
   */
  processPulseBoundary(pulse, link, linkId, nodes, metrics, aiNodes) {
    const amplitude = pulse.amplitude ?? 0;
    if (amplitude < this.minAmplitudeToInteract) return;
    
    const pulseT = pulse.position ?? pulse.pulseT ?? 0;
    const endNodeId = pulse.endNodeId || link.userData.endNode;
    const startNodeId = pulse.startNodeId || link.userData.startNode;
    
    // Determine direction and boundary arrival
    let boundaryReached = false;
    let targetNodeId = null;
    let oppositeNodeId = null;
    
    // Forward motion (0→1)
    if (pulseT >= 1.0) {
      boundaryReached = true;
      targetNodeId = endNodeId;
      oppositeNodeId = startNodeId;
    }
    // Backward motion (1→0)
    else if (pulseT <= 0.0) {
      boundaryReached = true;
      targetNodeId = startNodeId;
      oppositeNodeId = endNodeId;
    }
    
    if (!boundaryReached || !targetNodeId) return;
    
    // Get target node
    const targetNode = nodes.find(n => (n.id || n.uuid || n.name) === targetNodeId);
    if (!targetNode) return;
    
    // Determine interaction mode (deterministic, state-driven)
    const mode = this.determineInteractionMode(
      pulse,
      targetNode,
      metrics
    );
    
    if (!mode || mode === 'none') return;
    
    if (this.debugMode) {
      console.log(
        `[PulseBoundaryInteraction] ${mode}: link=${linkId}, node=${targetNodeId}, amplitude=${amplitude.toFixed(2)}`
      );
    }
    
    // Execute interaction
    switch (mode) {
      case 'absorption':
        this.executeAbsorption(targetNode, targetNodeId, linkId, pulse, metrics);
        break;
      case 'dissipation':
        this.executeDissipation(targetNode, targetNodeId, linkId, pulse, metrics);
        break;
      case 'reflection':
        this.executeReflection(targetNode, targetNodeId, linkId, pulse, metrics, oppositeNodeId);
        break;
      case 'split':
        this.executeSplit(targetNode, targetNodeId, link, pulse, metrics, aiNodes);
        break;
    }
  }

  /**
   * Determine interaction mode (deterministic)
   * Uses state metrics only, no randomness
   */
  determineInteractionMode(pulse, node, metrics) {
    const harmony = pulse.harmony ?? 0.5;
    const synergy = pulse.synergy ?? 0.5;
    const corruption = pulse.corruption ?? 0.0;
    const stability = pulse.stability ?? 0.5;
    const nodeHarmony = node.userData?.harmony ?? 0.5;
    const nodeStability = node.userData?.stability ?? 0.5;
    
    // Combined metrics
    const avgHarmony = (harmony + nodeHarmony) / 2;
    const avgCorruption = corruption;
    const avgStability = (stability + nodeStability) / 2;
    const hubStrength = node.userData?.hubResilience ?? 0;
    
    // Decision tree (deterministic thresholds)
    
    // Reflection only when heavily corrupted AND somewhat unstable (rare)
    if (corruption >= 0.65 && avgStability <= 0.6 && avgStability >= 0.2) {
      return 'reflection';
    }
    
    // Split only at harmonic hubs with outgoing links
    const outgoingLinks = (node.userData?.linkedNodes?.length ?? 0);
    if (hubStrength >= 0.6 && outgoingLinks >= 2 && synergy >= 0.5) {
      return 'split';
    }
    
    // Dissipation dominant when stability is low OR synergy is low
    if (avgStability < 0.4 || synergy < 0.3) {
      return 'dissipation';
    }
    
    // Absorption dominant when harmony >= corruption and stability is high
    if (avgHarmony >= avgCorruption && avgStability >= 0.5) {
      return 'absorption';
    }
    
    // Default fallback
    return avgHarmony > avgCorruption ? 'absorption' : 'dissipation';
  }

  /**
   * Absorption: Node halo briefly intensifies
   */
  executeAbsorption(node, nodeId, linkId, pulse, metrics) {
    const intensity = Math.max(0.3, 1.0 - (pulse.corruption ?? 0) * 0.5);
    const synergy = pulse.synergy ?? 0.5;
    
    // Boost absorption with synergy
    const boost = 0.6 + (synergy * 0.4);
    
    this.effectPool.spawn('absorption', {
      nodeId: nodeId,
      linkId: linkId,
      duration: this.absorptionDuration,
      intensity: intensity * boost,
      data: {
        haloBoost: 0.3 * boost,      // Emissive boost
        haloScale: 1.08,              // Subtle inward pulse
        rippleCoherence: 0.4          // Resonance increase
      }
    });
  }

  /**
   * Dissipation: Pulse fades as heat/noise
   */
  executeDissipation(node, nodeId, linkId, pulse, metrics) {
    const intensity = Math.min(1.0, (1.0 - (pulse.stability ?? 0.5)) * 1.2);
    const stability = pulse.stability ?? 0.5;
    
    this.effectPool.spawn('dissipation', {
      nodeId: nodeId,
      linkId: linkId,
      duration: this.dissipationDuration,
      intensity: intensity,
      data: {
        streakFlicker: 0.15 + ((1.0 - stability) * 0.3),  // Heat haze flicker (worse with low stability)
        endpointFade: true,                                // Fade over last 20% of link
        microImpulseDensity: Math.floor(2 + (1.0 - stability) * 3)  // More impulses when unstable
      }
    });
  }

  /**
   * Reflection: Spawn weaker pulse rebounding back
   */
  executeReflection(node, nodeId, linkId, pulse, metrics, oppositeNodeId) {
    const reflectionAmplitude = (pulse.amplitude ?? 0) * this.reflectionAmplitudeFactor;
    
    // Create transient reflected pulse data
    const reflectedPulse = {
      type: 'reflection',
      position: pulse.position >= 1.0 ? 1.0 : 0.0,  // Start at boundary
      amplitude: reflectionAmplitude,
      harmony: pulse.harmony,
      synergy: pulse.synergy * 0.7,  // Reduced synergy
      corruption: pulse.corruption * 1.2,  // Increased corruption
      stability: pulse.stability ?? 0.5,
      direction: pulse.position >= 1.0 ? -1 : 1,  // Reverse direction
      reflectionCount: (pulse.reflectionCount ?? 0) + 1,
      sourceNodeId: nodeId,
      targetNodeId: oppositeNodeId
    };
    
    this.effectPool.spawn('reflection', {
      nodeId: nodeId,
      linkId: linkId,
      duration: 100,
      intensity: 0.8,
      data: {
        reflectedPulse: reflectedPulse,
        strength: reflectionAmplitude,
        glowColor: 'amber'  // Reflected pulses glow amber
      }
    });
    
    if (this.debugMode) {
      console.log(
        `[Reflection] amplitude=${reflectionAmplitude.toFixed(2)}, count=${reflectedPulse.reflectionCount}`
      );
    }
  }

  /**
   * Split: Energy fans into outgoing links (harmonic hubs only)
   */
  executeSplit(node, nodeId, link, pulse, metrics, aiNodes) {
    const outgoingLinks = node.userData?.linkedNodes ?? [];
    const hubStrength = node.userData?.hubResilience ?? 0;
    const synergy = pulse.synergy ?? 0.5;
    
    // Limit outgoing splits
    const splitCount = Math.min(
      this.maxSplitCount,
      Math.floor(2 + synergy * 2)  // More splits with higher synergy
    );
    
    if (outgoingLinks.length === 0 || splitCount === 0) return;
    
    // Create split pulses into other connected links
    for (let i = 0; i < Math.min(splitCount, outgoingLinks.length); i++) {
      const outgoingNodeId = outgoingLinks[i];
      const outgoingLink = this.findLinkBetweenNodes(aiNodes, nodeId, outgoingNodeId);
      
      if (!outgoingLink) continue;
      
      const splitAmplitude = (pulse.amplitude ?? 0) * (0.4 + hubStrength * 0.4);
      
      const splitPulse = {
        type: 'split',
        position: 0.01,  // Start near node boundary
        amplitude: splitAmplitude,
        harmony: pulse.harmony,
        synergy: synergy * (0.7 + hubStrength * 0.3),
        corruption: pulse.corruption * 0.7,
        stability: pulse.stability ?? 0.5,
        direction: 1,  // Forward
        originNodeId: nodeId,
        sourceType: 'split'
      };
      
      this.effectPool.spawn('split', {
        nodeId: nodeId,
        linkId: outgoingLink.id || outgoingLink.uuid || outgoingLink.name,
        duration: 150,
        intensity: 0.9,
        data: {
          splitPulse: splitPulse,
          targetNodeId: outgoingNodeId,
          strength: splitAmplitude
        }
      });
    }
    
    if (this.debugMode) {
      console.log(
        `[Split] node=${nodeId}, outgoing=${splitCount}, hubStrength=${hubStrength.toFixed(2)}`
      );
    }
  }

  /**
   * Apply boundary effect modulations to nodes and links
   * Modifies userData but NOT core geometry/materials
   */
  applyBoundaryEffectModulations(links, nodes) {
    // Apply absorption effects to nodes
    for (const node of nodes) {
      if (!node || !node.userData) continue;
      
      const nodeId = node.id || node.uuid || node.name;
      const effects = this.effectPool.getNodeEffects(nodeId);
      
      if (effects.length === 0) {
        // Clear modulations if no active effects
        node.userData.boundaryHaloBoost = 0;
        node.userData.boundaryHaloScale = 1.0;
        continue;
      }
      
      // Blend active effects
      let totalHaloBoost = 0;
      let avgScale = 1.0;
      
      for (const effect of effects) {
        if (effect.type === 'absorption') {
          const haloBoost = effect.data.haloBoost * effect.intensity;
          const scale = 1.0 + ((effect.data.haloScale - 1.0) * effect.intensity);
          
          totalHaloBoost += haloBoost;
          avgScale = (avgScale + scale) / 2;
        }
      }
      
      node.userData.boundaryHaloBoost = totalHaloBoost;
      node.userData.boundaryHaloScale = avgScale;
    }
    
    // Apply dissipation effects to links
    for (const link of links) {
      if (!link || !link.userData) continue;
      
      const linkId = link.id || link.uuid || link.name;
      const effects = this.effectPool.getLinkEffects(linkId);
      
      if (effects.length === 0) {
        link.userData.boundaryStreakFlicker = 0;
        link.userData.boundaryEndpointFade = 0;
        continue;
      }
      
      // Blend dissipation effects
      let maxFlicker = 0;
      let maxFade = 0;
      
      for (const effect of effects) {
        if (effect.type === 'dissipation') {
          const flicker = effect.data.streakFlicker * effect.intensity;
          const fade = effect.data.endpointFade ? effect.intensity : 0;
          
          maxFlicker = Math.max(maxFlicker, flicker);
          maxFade = Math.max(maxFade, fade);
        }
      }
      
      link.userData.boundaryStreakFlicker = maxFlicker;
      link.userData.boundaryEndpointFade = maxFade;
    }
  }

  /**
   * Find link between two nodes
   */
  findLinkBetweenNodes(aiNodes, nodeId1, nodeId2) {
    if (!aiNodes?.links) return null;
    
    for (const link of aiNodes.links) {
      const n1 = link.userData?.startNode || link.userData?.nodeA || '';
      const n2 = link.userData?.endNode || link.userData?.nodeB || '';
      
      if ((n1 === nodeId1 && n2 === nodeId2) ||
          (n1 === nodeId2 && n2 === nodeId1)) {
        return link;
      }
    }
    
    return null;
  }

  /**
   * Setup console API
   */
  setupConsoleAPI() {
    window.pulseBoundary = {
      enable: () => {
        this.enabled = true;
        console.log('✓ Pulse Boundary Interactions enabled');
      },
      disable: () => {
        this.enabled = false;
        console.log('✓ Pulse Boundary Interactions disabled');
      },
      setDebugMode: (mode) => {
        this.debugMode = mode;
        console.log(`✓ Pulse Boundary debug: ${mode ? 'ON' : 'OFF'}`);
      },
      setReflectionAmplitude: (factor) => {
        this.reflectionAmplitudeFactor = Math.max(0.1, Math.min(0.8, factor));
        console.log(`✓ Reflection amplitude: ${(factor * 100).toFixed(0)}%`);
      },
      getStatus: () => {
        console.log(`
Pulse Boundary Interaction Status:
  Enabled: ${this.enabled}
  Debug: ${this.debugMode}
  Active Effects: ${this.effectPool.active.length}
  Absorption Duration: ${this.absorptionDuration}ms
  Dissipation Duration: ${this.dissipationDuration}ms
  Reflection Amplitude: ${(this.reflectionAmplitudeFactor * 100).toFixed(0)}%
  Max Splits: ${this.maxSplitCount}
        `);
      },
      help: () => {
        console.log(`
Pulse Boundary Interaction Console API:
  pulseBoundary.enable()                    - Enable interactions
  pulseBoundary.disable()                   - Disable interactions
  pulseBoundary.setDebugMode(bool)          - Toggle debug logging
  pulseBoundary.setReflectionAmplitude(0-0.8) - Adjust reflection strength
  pulseBoundary.getStatus()                 - Show current settings
  pulseBoundary.help()                      - Show this help
        `);
      }
    };
  }
}

/**
 * Setup integration
 */
export function setupPulseBoundaryInteractionIntegration(game) {
  try {
    const adapter = new PulseBoundaryInteractionAdapter_v1({
      enabled: true,
      debugMode: false,
      maxBoundaryEffects: 50,
      minAmplitudeToInteract: 0.15,
      absorptionDuration: 180,
      dissipationDuration: 120,
      reflectionAmplitudeFactor: 0.45,
      maxReflectionCount: 1,
      maxSplitCount: 3
    });
    
    game.pulseBoundaryInteractionAdapter = adapter;
    console.log('[main.js] PulseBoundaryInteractionAdapter initialized ✓');
    return adapter;
  } catch (err) {
    console.warn('[main.js] PulseBoundaryInteractionAdapter init error:', err);
    return null;
  }
}