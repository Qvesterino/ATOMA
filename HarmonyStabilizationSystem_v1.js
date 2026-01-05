/**
 * HARMONY STABILIZATION & HEALING SYSTEM v1.0
 * 
 * Counter-force to corruption that spreads order, stability, and healing through the network.
 * Represents harmony, resonance, and equilibrium as a balancing mechanic.
 * 
 * Features:
 * - Node-level harmony tracking (0-1 scale)
 * - Link-level harmony flow (spreading stability)
 * - Corruption reduction and blocking
 * - Harmony pulses (radial cleansing waves)
 * - Oasis zones (clustered harmony areas)
 * - Archetype-aware harmony effects
 * - Progressive visual stabilization
 * - Full THREE.js safe mode compatibility
 * - Non-breaking integration with existing systems
 * 
 * Core Mechanics:
 * - Harmony spreads opposite to corruption (high → low)
 * - Reduces/blocks corruption spread on links
 * - Increases node stability and synergy
 * - Triggers healing pulses at thresholds
 * - Dampens cascade events
 * - Creates "Harmony Anchors" at max level
 * 
 * Integration:
 * - Works with CorruptionVisualFX_v1 (overrides/fades corruption tint)
 * - Works with LinkCorruptionTransmission_v1 (reduces linkCorruptionLevel)
 * - Works with ArchetypeGameplayEffects_v1 (uses archetype profiles)
 */

// === THREE SAFE LOADER ===
let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

const THREE = THREE_SAFE;

/**
 * Harmony threshold definitions
 */
const HARMONY_THRESHOLDS = {
  DECAY_BEGIN: 0.2,           // Corruption starts decaying
  LINK_SLOW: 0.4,             // Link corruption slowed
  CASCADE_DAMPEN: 0.6,        // Cascade events dampened
  BLOCKING: 0.8,              // Corruption blocked + healing
  ANCHOR: 1.0                 // Full harmony anchor state
};

/**
 * HARMONY STABILIZATION ENGINE
 */
export class HarmonyStabilizationSystem_v1 {
  /**
   * @param {Object} aiNodes - AINodes instance
   * @param {Object} linkSystem - Link system (NodeLinkingSystem, etc.)
   * @param {Boolean} debugMode - Enable debug logging
   * @param {Object} linkCorruptionTransmission - LinkCorruptionTransmission_v1 for category-aware multipliers
   */
  constructor(aiNodes, linkSystem, debugMode = false, linkCorruptionTransmission = null) {
    this.aiNodes = aiNodes;
    this.linkSystem = linkSystem;
    this.debugMode = debugMode;
    this.linkCorruptionTransmission = linkCorruptionTransmission;

    // Node-level harmony tracking
    this.nodeHarmony = new Map(); // node -> { level: 0-1, pulseActive, oasisActive, healingRate }
    
    // Link-level harmony tracking
    this.linkHarmony = new Map(); // link -> { level: 0-1, flowDirection, flowRate }
    
    // Oasis zone tracking (groups of nearby harmony nodes)
    this.oasisZones = new Map(); // oasisId -> { nodes: Set, centerPos, radius, intensity }
    
    // Pulse tracking
    this.activePulses = []; // Array of active harmony pulses
    
    // Performance
    this.updateInterval = 1 / 60;
    this.lastUpdateTime = 0;
    this.harmonyQueue = [];
    
    // Cache for archetype profiles
    this.archetypeProfiles = null;
    
    if (this.debugMode) {
      console.log('%c[HarmonyStabilizationSystem_v1] Initialized', 'color: #00ffff; font-weight: bold;');
      this.setupConsoleAPI();
    }
  }

  /**
   * Initialize node harmony if not already tracked
   */
  initializeNodeHarmony(node) {
    if (!node || !node.userData) return null;

    const nodeId = node.id || `node_${Math.random()}`;
    
    if (!this.nodeHarmony.has(nodeId)) {
      this.nodeHarmony.set(nodeId, {
        level: 0,
        velocity: 0,
        lastUpdateTime: Date.now(),
        pulseActive: false,
        pulseStartTime: 0,
        oasisActive: false,
        healingRate: 0,
        node: node,
        nodeId: nodeId,
        isAnchor: false
      });
    }

    return this.nodeHarmony.get(nodeId);
  }

  /**
   * Initialize link harmony if not already tracked
   */
  initializeLinkHarmony(link) {
    if (!link || !link.userData) return null;

    const linkId = link.id || `${link.source?.id || 'unknown'}-${link.target?.id || 'unknown'}`;
    
    if (!this.linkHarmony.has(linkId)) {
      this.linkHarmony.set(linkId, {
        level: 0,
        velocity: 0,
        flowDirection: 'forward', // forward or backward
        flowRate: 0,
        lastUpdateTime: Date.now(),
        link: link,
        linkId: linkId
      });
    }

    return this.linkHarmony.get(linkId);
  }

  /**
   * Main update loop - call once per frame
   */
  updateHarmony(deltaTime = 1/60) {
    if (!this.aiNodes) return;

    // Update all nodes
    const allNodes = this.getAllNodes();
    if (allNodes && allNodes.length > 0) {
      for (const node of allNodes) {
        this.updateNodeHarmony(node, deltaTime);
      }
    }

    // Update all links
    const allLinks = this.getAllLinks();
    if (allLinks && allLinks.length > 0) {
      for (const link of allLinks) {
        this.updateLinkHarmony(link, deltaTime);
      }
    }

    // Update pulses
    this.updateHarmonyPulses(deltaTime);

    // Check for oasis zones
    this.updateOasisZones(deltaTime);

    // Process harmony queue
    this.processHarmonyQueue();
  }

  /**
   * Update harmony level for a single node
   * [Tier 4.9] SYNERGY-DRIVEN RECOVERY ACCELERATION
   * - Higher node synergy accelerates harmony regeneration after cascades
   * - Recovery boost applied to all harmony-based recovery rates
   */
  updateNodeHarmony(node, deltaTime) {
    const harmonyData = this.initializeNodeHarmony(node);
    if (!harmonyData) return;

    // Check if node has corruption to counter
    const nodeCorruption = node.userData?.corruption || 0;
    
    // [Tier 4.9] SYNERGY-DRIVEN RECOVERY ACCELERATION
    // Compute recovery boost from average synergy of connected links
    let avgSynergy = 0;
    let linkCount = 0;
    if (node.userData?.links && node.userData.links.length > 0) {
      for (const link of node.userData.links) {
        avgSynergy += (link.synergy ?? 0);
        linkCount++;
      }
      avgSynergy = linkCount > 0 ? avgSynergy / linkCount : 0;
    }
    const recoveryBoost = 1.0 + Math.min(avgSynergy * 0.5, 0.5); // 100% to 150% speed
    
    // Harmony healing: gradually reduce corruption
    if (harmonyData.level > 0) {
      let healAmount = harmonyData.level * 0.1 * deltaTime; // Up to 10% corruption/sec
      healAmount *= recoveryBoost; // [Tier 4.9] Accelerate corruption decay on nodes
      if (nodeCorruption > 0) {
        node.userData.corruption = Math.max(0, nodeCorruption - healAmount);
      }
    }

    // Harmony level changes from:
    // 1. External sources (player actions, harmony pulses)
    // 2. Harmony flow from linked nodes
    // 3. Decay if no maintenance
    
    // Get inbound harmony flow from connected nodes
    const inboundFlow = this.computeInboundHarmonyFlow(node);
    let harmonyIncrease = inboundFlow * deltaTime * 0.05; // Slower than corruption
    harmonyIncrease *= recoveryBoost; // [Tier 4.9] Accelerate harmony regeneration
    
    // Natural decay if no input
    const decayRate = 0.02; // Lose 2% harmony per second if not maintained
    let harmonyDecay = Math.max(0, harmonyData.level * decayRate * deltaTime);
    harmonyDecay /= recoveryBoost; // [Tier 4.9] Reduce decay rate with high synergy (faster net recovery)
    
    // Update harmony level
    harmonyData.level = Math.max(0, Math.min(1.0, harmonyData.level + harmonyIncrease - harmonyDecay));
    harmonyData.velocity = (harmonyIncrease - harmonyDecay) / (deltaTime + 0.001);
    harmonyData.lastUpdateTime = Date.now();

    // Check harmony thresholds
    this.checkHarmonyThresholds(node, harmonyData);

    // Apply visual effects
    this.applyNodeHarmonyVisuals(node, harmonyData.level, Date.now() / 1000);
  }

  /**
   * Update harmony level for a single link
   * [Tier 4.9] SYNERGY-DRIVEN RECOVERY ACCELERATION
   * - Higher link synergy accelerates harmony regeneration after cascades
   * - Recovery boost applied to all harmony spread rates
   */
  updateLinkHarmony(link, deltaTime) {
    const harmonyData = this.initializeLinkHarmony(link);
    if (!harmonyData) return;

    const sourceNode = link.source || link.sourceNode;
    const targetNode = link.target || link.targetNode;
    
    if (!sourceNode || !targetNode) return;

    // [Tier 4.9] SYNERGY-DRIVEN RECOVERY ACCELERATION
    // Compute recovery boost from this link's synergy
    const synergy = link.synergy ?? 0;
    const recoveryBoost = 1.0 + Math.min(synergy * 0.5, 0.5); // 100% to 150% speed

    // Compute harmony flow rate (opposite of corruption flow)
    // High harmony → Low harmony
    const harmonyFlowRate = this.computeHarmonyFlowRate(sourceNode, targetNode, link);

    // Get source and target harmony levels
    const sourceHarmony = this.nodeHarmony.get(sourceNode.id)?.level || 0;
    const targetHarmony = this.nodeHarmony.get(targetNode.id)?.level || 0;
    
    // Harmony spreads from higher → lower
    const harmonyDifference = Math.max(0, sourceHarmony - harmonyData.level);
    
    // Apply category-aware harmony propagation multiplier
    let harmonyMultiplier = 1.0;
    if (this.linkCorruptionTransmission && sourceNode && targetNode) {
      harmonyMultiplier = this.linkCorruptionTransmission.getHarmonyPropagationMultiplier(sourceNode, targetNode);
    }
    
    // Apply harmony flow * time step * category multiplier * recovery boost
    let harmonyIncrease = harmonyDifference * harmonyFlowRate * harmonyMultiplier * deltaTime * 0.1;
    harmonyIncrease *= recoveryBoost; // [Tier 4.9] Accelerate harmony regeneration on links
    
    // Smooth update
    harmonyData.level = Math.min(1.0, harmonyData.level + harmonyIncrease);
    harmonyData.velocity = harmonyIncrease / (deltaTime + 0.001);
    harmonyData.lastUpdateTime = Date.now();

    // Link harmony reduces link corruption
    if (harmonyData.level > 0.2 && this.aiNodes.linkCorruption) {
      const linkCorruptionData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
      if (linkCorruptionData) {
        // Harmony directly reduces corruption on the link
        // [Tier 4.9] Apply synergy-driven recovery acceleration
        let harmonyReduction = harmonyData.level * 0.05 * deltaTime;
        harmonyReduction *= recoveryBoost; // [Tier 4.9] Accelerate corruption decay with high synergy
        linkCorruptionData.level = Math.max(0, linkCorruptionData.level - harmonyReduction);
      }
    }

    // Apply visual effects
    this.applyLinkHarmonyVisuals(link, harmonyData.level, Date.now() / 1000);
  }

  /**
   * Compute inbound harmony flow to a node (from all connected sources)
   */
  computeInboundHarmonyFlow(node) {
    if (!node || !this.linkSystem) return 0;

    let totalFlow = 0;
    const inboundLinks = this.getInboundLinks(node);
    
    for (const link of inboundLinks) {
      const sourceNode = link.source || link.sourceNode;
      const harmonyData = this.linkHarmony.get(link.id);
      
      if (sourceNode && harmonyData) {
        totalFlow += harmonyData.level * harmonyData.flowRate;
      }
    }

    return Math.min(1.0, totalFlow);
  }

  /**
   * Compute harmony flow rate for a link
   * 
   * Based on:
   * - Source/target archetype harmony alignment
   * - Link synergy
   * - Current chaos/harmony balance
   */
  computeHarmonyFlowRate(sourceNode, targetNode, link) {
    let baseRate = 0.5; // Base harmony spread rate

    // Get archetype profiles if available
    if (!this.archetypeProfiles && this.aiNodes.archetypeProfiles) {
      this.archetypeProfiles = this.aiNodes.archetypeProfiles;
    }

    // Source archetype effects
    if (sourceNode.userData?.archetype && this.archetypeProfiles) {
      const sourceProfile = this.archetypeProfiles[sourceNode.userData.archetype];
      if (sourceProfile) {
        // Harmony/Prime/Sigma spread harmony well
        if (sourceProfile.tags?.includes('harmony') || sourceProfile.tags?.includes('resonance')) {
          baseRate *= 2.0;
        }
        if (sourceProfile.tags?.includes('prime') || sourceProfile.tags?.includes('sigma')) {
          baseRate *= 1.5;
        }
        // Chaos/Error resist harmony
        if (sourceProfile.tags?.includes('chaos') || sourceProfile.tags?.includes('error')) {
          baseRate *= 0.3;
        }
        // Quantum adds variance
        if (sourceProfile.tags?.includes('quantum')) {
          baseRate *= (0.5 + Math.random() * 1.5);
        }
      }
    }

    // Target archetype effects
    if (targetNode.userData?.archetype && this.archetypeProfiles) {
      const targetProfile = this.archetypeProfiles[targetNode.userData.archetype];
      if (targetProfile) {
        // Harmony/Prime receive harmony well
        if (targetProfile.tags?.includes('harmony') || targetProfile.tags?.includes('resonance')) {
          baseRate *= 1.5;
        }
        if (targetProfile.tags?.includes('prime') || targetProfile.tags?.includes('sigma')) {
          baseRate *= 1.2;
        }
        // Chaos resists harmony
        if (targetProfile.tags?.includes('chaos')) {
          baseRate *= 0.5;
        }
      }
    }

    // Link synergy improves harmony flow
    if (link.userData?.synergy !== undefined) {
      baseRate *= (0.5 + link.userData.synergy * 0.5);
    }

    return Math.max(0.01, Math.min(2.0, baseRate));
  }

  /**
   * Check and process harmony thresholds
   */
  checkHarmonyThresholds(node, harmonyData) {
    const level = harmonyData.level;

    // Only fire thresholds once
    const thresholds = [
      { value: HARMONY_THRESHOLDS.DECAY_BEGIN, event: 'decay_begin' },
      { value: HARMONY_THRESHOLDS.LINK_SLOW, event: 'link_slow' },
      { value: HARMONY_THRESHOLDS.CASCADE_DAMPEN, event: 'cascade_dampen' },
      { value: HARMONY_THRESHOLDS.BLOCKING, event: 'blocking' },
      { value: HARMONY_THRESHOLDS.ANCHOR, event: 'anchor_achieved' }
    ];

    for (const threshold of thresholds) {
      if (level >= threshold.value && !node.userData.harmonyThresholds?.has?.(threshold.event)) {
        if (!node.userData.harmonyThresholds) {
          node.userData.harmonyThresholds = new Set();
        }
        node.userData.harmonyThresholds.add(threshold.event);

        const event = {
          node: node,
          event: threshold.event,
          level: level,
          timestamp: Date.now()
        };

        this.harmonyQueue.push(event);

        if (this.debugMode) {
          console.log(`[HarmonyStabilization] Threshold: ${threshold.event} at level ${level.toFixed(2)}`);
        }
      }
    }
  }

  /**
   * Process queued harmony events
   */
  processHarmonyQueue() {
    while (this.harmonyQueue.length > 0) {
      const event = this.harmonyQueue.shift();

      switch (event.event) {
        case 'blocking':
          this.triggerHarmonyBlocking(event.node);
          break;
        case 'anchor_achieved':
          this.triggerAnchorState(event.node);
          break;
        case 'cascade_dampen':
          this.triggerCascadeDampening(event.node);
          break;
      }
    }
  }

  /**
   * Trigger harmony blocking and healing at 0.8 threshold
   */
  triggerHarmonyBlocking(node) {
    if (!node || !node.userData) return;

    // Block corruption on this node
    node.userData.corrupted = false;
    node.userData.corruption = Math.max(0, node.userData.corruption - 0.2);

    // Trigger healing pulse
    this.triggerHarmonyPulse(node);

    if (this.debugMode) {
      console.log('[HarmonyStabilization] Blocking triggered - corruption reduced');
    }
  }

  /**
   * Trigger anchor state at 1.0
   */
  triggerAnchorState(node) {
    if (!node || !node.userData) return;

    node.userData.isHarmonyAnchor = true;
    node.userData.corruption = 0;

    // Continuous pulse
    node.userData.anchorPulseActive = true;

    if (this.debugMode) {
      console.log('[HarmonyStabilization] Node became harmony anchor');
    }
  }

  /**
   * Dampen cascade events at 0.6 threshold
   */
  triggerCascadeDampening(node) {
    if (!node || !this.aiNodes.linkCorruption) return;

    // Clear cascade queue for links from this node
    const outboundLinks = this.getOutboundLinks(node);
    for (const link of outboundLinks) {
      const linkData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
      if (linkData) {
        // Reduce cascade queued events
        linkData.cascadeThresholdsCrossed.delete('cascade');
        linkData.cascadeThresholdsCrossed.delete('infection_complete');
      }
    }

    if (this.debugMode) {
      console.log('[HarmonyStabilization] Cascade dampening applied');
    }
  }

  /**
   * Trigger a harmony pulse from a node
   * Cleanses nearby links and reduces corruption in connected nodes
   */
  triggerHarmonyPulse(sourceNode, radius = 2.0, intensity = 0.5) {
    if (!sourceNode) return;

    const harmonyData = this.initializeNodeHarmony(sourceNode);
    if (!harmonyData) return;

    const pulse = {
      sourceNode: sourceNode,
      sourcePos: sourceNode.position || { x: 0, y: 0, z: 0 },
      startTime: Date.now(),
      duration: 1.0,  // 1 second pulse
      radius: radius,
      intensity: Math.min(1.0, harmonyData.level * intensity),
      active: true
    };

    this.activePulses.push(pulse);

    // Immediate cleansing effect
    this.appliesPulseEffect(pulse);

    if (this.debugMode) {
      console.log('[HarmonyStabilization] Harmony pulse triggered from node');
    }

    return pulse;
  }

  /**
   * Apply immediate pulse effect
   */
  appliesPulseEffect(pulse) {
    const allNodes = this.getAllNodes();
    const allLinks = this.getAllLinks();

    // Cleanse nearby nodes
    for (const node of allNodes) {
      if (!node.position) continue;

      const distance = this.distanceToNode(pulse.sourcePos, node.position);
      if (distance <= pulse.radius) {
        // Reduce corruption
        if (node.userData) {
          node.userData.corruption = Math.max(0, node.userData.corruption - pulse.intensity * 0.3);
          // Boost harmony
          const harmonyData = this.initializeNodeHarmony(node);
          if (harmonyData) {
            harmonyData.level = Math.min(1.0, harmonyData.level + pulse.intensity * 0.2);
          }
        }
      }
    }

    // Cleanse nearby links
    for (const link of allLinks) {
      const source = link.source || link.sourceNode;
      const target = link.target || link.targetNode;
      
      if (source && target && source.position && target.position) {
        const mid = {
          x: (source.position.x + target.position.x) / 2,
          y: (source.position.y + target.position.y) / 2,
          z: (source.position.z + target.position.z) / 2
        };
        
        const distance = this.distanceToNode(pulse.sourcePos, mid);
        if (distance <= pulse.radius) {
          // Reduce link corruption
          if (this.aiNodes.linkCorruption) {
            const linkData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
            if (linkData) {
              linkData.level = Math.max(0, linkData.level - pulse.intensity * 0.2);
            }
          }
          // Boost link harmony
          const harmonyData = this.initializeLinkHarmony(link);
          if (harmonyData) {
            harmonyData.level = Math.min(1.0, harmonyData.level + pulse.intensity * 0.3);
          }
        }
      }
    }
  }

  /**
   * Update active harmony pulses
   */
  updateHarmonyPulses(deltaTime) {
    for (let i = this.activePulses.length - 1; i >= 0; i--) {
      const pulse = this.activePulses[i];
      const elapsed = (Date.now() - pulse.startTime) / 1000;

      if (elapsed >= pulse.duration) {
        this.activePulses.splice(i, 1);
      }
    }

    // Apply continuous effects from anchor nodes
    const allNodes = this.getAllNodes();
    for (const node of allNodes) {
      const harmonyData = this.nodeHarmony.get(node.id);
      if (harmonyData && harmonyData.isAnchor && harmonyData.level >= 1.0) {
        // Continuous anchor pulse (weaker)
        const anchorPulse = {
          sourceNode: node,
          sourcePos: node.position || { x: 0, y: 0, z: 0 },
          startTime: Date.now(),
          duration: 0.5,
          radius: 1.5,
          intensity: 0.2,
          isAnchorPulse: true
        };
        this.appliesPulseEffect(anchorPulse);
      }
    }
  }

  /**
   * Update oasis zones (clusters of harmony nodes)
   */
  updateOasisZones(deltaTime) {
    const allNodes = this.getAllNodes();
    const harmonyNodes = allNodes.filter(n => {
      const hdata = this.nodeHarmony.get(n.id);
      return hdata && hdata.level > 0.5;
    });

    if (harmonyNodes.length < 2) return;

    // Find clusters
    const clusters = this.findHarmonyClusters(harmonyNodes);

    // Update zones
    for (const cluster of clusters) {
      if (cluster.length >= 3) {
        // 3+ nodes = oasis zone
        const centroid = this.computeCentroid(cluster);
        const radius = this.computeClusterRadius(cluster);
        
        const zoneId = `oasis_${cluster[0].id}_${cluster[1].id}`;
        
        const zone = {
          nodes: new Set(cluster),
          centerPos: centroid,
          radius: radius,
          intensity: cluster.reduce((sum, n) => sum + (this.nodeHarmony.get(n.id)?.level || 0), 0) / cluster.length
        };

        this.oasisZones.set(zoneId, zone);

        // Apply oasis effects
        this.applyOasisEffects(zone, deltaTime);
      }
    }
  }

  /**
   * Find harmony node clusters
   */
  findHarmonyClusters(harmonyNodes, clusterDistance = 3.0) {
    const clusters = [];
    const visited = new Set();

    for (const node of harmonyNodes) {
      if (visited.has(node.id)) continue;

      const cluster = [node];
      visited.add(node.id);

      for (const other of harmonyNodes) {
        if (visited.has(other.id)) continue;

        const dist = this.distanceToNode(node.position, other.position);
        if (dist <= clusterDistance) {
          cluster.push(other);
          visited.add(other.id);
        }
      }

      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Compute cluster centroid
   */
  computeCentroid(nodes) {
    let x = 0, y = 0, z = 0;
    for (const node of nodes) {
      if (node.position) {
        x += node.position.x || 0;
        y += node.position.y || 0;
        z += node.position.z || 0;
      }
    }
    return {
      x: x / nodes.length,
      y: y / nodes.length,
      z: z / nodes.length
    };
  }

  /**
   * Compute cluster radius
   */
  computeClusterRadius(nodes) {
    const centroid = this.computeCentroid(nodes);
    let maxDist = 0;
    for (const node of nodes) {
      if (node.position) {
        const dist = this.distanceToNode(centroid, node.position);
        maxDist = Math.max(maxDist, dist);
      }
    }
    return maxDist + 1.0;
  }

  /**
   * Apply oasis zone effects
   */
  applyOasisEffects(zone, deltaTime) {
    const allNodes = this.getAllNodes();
    const allLinks = this.getAllLinks();

    // Nodes in oasis get healing
    for (const node of zone.nodes) {
      if (node.userData) {
        // Reduce corruption
        node.userData.corruption = Math.max(0, node.userData.corruption - zone.intensity * 0.01 * deltaTime);
        // Boost harmony
        const harmonyData = this.initializeNodeHarmony(node);
        if (harmonyData) {
          harmonyData.level = Math.min(1.0, harmonyData.level + zone.intensity * 0.005 * deltaTime);
        }
      }
    }

    // Slow corruption spread in oasis
    for (const link of allLinks) {
      const source = link.source || link.sourceNode;
      const target = link.target || link.targetNode;

      if (source && target && source.position && target.position) {
        const mid = {
          x: (source.position.x + target.position.x) / 2,
          y: (source.position.y + target.position.y) / 2,
          z: (source.position.z + target.position.z) / 2
        };

        const distance = this.distanceToNode(zone.centerPos, mid);
        if (distance <= zone.radius) {
          // Slow link corruption spread
          if (this.aiNodes.linkCorruption) {
            const linkData = this.aiNodes.linkCorruption.linkCorruption.get(link.id);
            if (linkData) {
              // 80% slower transmission
              linkData.level *= 0.2;
            }
          }
        }
      }
    }
  }

  /**
   * Apply visual effects to a node
   */
  applyNodeHarmonyVisuals(node, level, time = 0) {
    if (!node || !node.userData) return;

    // Initialize visual state
    if (!node.userData.harmonyVisualState) {
      node.userData.harmonyVisualState = {
        auraTint: { r: 0.2, g: 0.9, b: 0.8 },
        auraIntensity: 0,
        pulseFrequency: 2.0,
        rotationStabilization: 0,
        particleDriftDirection: { x: 0, y: 1, z: 0 }
      };
    }

    const vis = node.userData.harmonyVisualState;

    // Progressive harmony visual effects
    if (level < 0.1) {
      vis.auraIntensity = 0;
      vis.rotationStabilization = 0;
    } else if (level < 0.3) {
      // Subtle cyan aura
      vis.auraIntensity = level * 0.5;
      vis.rotationStabilization = level * 0.2;
      vis.pulseFrequency = 1.0;
    } else if (level < 0.6) {
      // Growing aura + breathing pulse
      const t = (level - 0.3) / 0.3;
      vis.auraIntensity = 0.3 + t * 0.3;
      vis.rotationStabilization = 0.1 + t * 0.3;
      const breathePulse = Math.sin(time * 2.0) * 0.1;
      vis.auraIntensity += breathePulse;
      vis.pulseFrequency = 1.5 + t * 0.5;
    } else if (level < 0.85) {
      // Strong harmonious aura
      const t = (level - 0.6) / 0.25;
      vis.auraIntensity = 0.6 + t * 0.2;
      vis.rotationStabilization = 0.4 + t * 0.3;
      const breathePulse = Math.sin(time * 2.5) * 0.15;
      vis.auraIntensity = Math.min(1.0, vis.auraIntensity + breathePulse);
      vis.pulseFrequency = 2.0 + t * 0.5;
    } else {
      // Anchor state: brilliant harmony
      vis.auraIntensity = 1.0;
      vis.rotationStabilization = 0.8;
      const anchorPulse = Math.sin(time * 3.0) * 0.2;
      vis.auraIntensity = Math.min(1.0, 0.8 + anchorPulse);
      vis.pulseFrequency = 3.0;
    }

    // Clamp values
    vis.auraIntensity = Math.max(0, Math.min(1, vis.auraIntensity));
    vis.rotationStabilization = Math.max(0, Math.min(1, vis.rotationStabilization));
    
    // Store for shader/visual integration
    node.userData.harmonyLevel = level;
    node.userData.isHarmonized = level > 0.2;
  }

  /**
   * Apply visual effects to a link
   */
  applyLinkHarmonyVisuals(link, level, time = 0) {
    if (!link || !link.userData) return;

    if (!link.userData.harmonyVisualState) {
      link.userData.harmonyVisualState = {
        ribbonColor: { r: 0.3, g: 0.9, b: 0.8 },
        ribbonIntensity: 0,
        waveFrequency: 1.0,
        waveAmplitude: 0.2,
        particleDirection: 'resonance' // resonance vs one-direction
      };
    }

    const vis = link.userData.harmonyVisualState;

    // Progressive harmony link effects
    if (level < 0.1) {
      vis.ribbonIntensity = 0;
    } else if (level < 0.4) {
      // Flowing light ribbon
      vis.ribbonIntensity = level * 0.6;
      vis.waveFrequency = 1.5;
      vis.waveAmplitude = 0.15;
    } else if (level < 0.7) {
      // Active resonance waves
      const t = (level - 0.4) / 0.3;
      vis.ribbonIntensity = 0.3 + t * 0.5;
      vis.waveFrequency = 1.5 + t * 1.5;
      vis.waveAmplitude = 0.15 + t * 0.2;
      vis.particleDirection = 'resonance';
    } else {
      // Strong harmony flows
      vis.ribbonIntensity = Math.min(1.0, 0.8 + Math.sin(time * 2.0) * 0.2);
      vis.waveFrequency = 3.0;
      vis.waveAmplitude = 0.35;
    }

    vis.ribbonIntensity = Math.max(0, Math.min(1, vis.ribbonIntensity));
    
    link.userData.harmonyLevel = level;
  }

  /**
   * Manually set node harmony level
   */
  setNodeHarmony(node, level) {
    const harmonyData = this.initializeNodeHarmony(node);
    if (harmonyData) {
      harmonyData.level = Math.max(0, Math.min(1, level));
    }
  }

  /**
   * Manually set link harmony level
   */
  setLinkHarmony(link, level) {
    const harmonyData = this.initializeLinkHarmony(link);
    if (harmonyData) {
      harmonyData.level = Math.max(0, Math.min(1, level));
    }
  }

  /**
   * Get all nodes
   */
  getAllNodes() {
    if (!this.aiNodes) return [];

    if (Array.isArray(this.aiNodes.nodes)) {
      return this.aiNodes.nodes;
    }
    if (this.aiNodes.allNodes && Array.isArray(this.aiNodes.allNodes)) {
      return this.aiNodes.allNodes;
    }
    if (this.aiNodes.nodesByCategory) {
      const allNodes = [];
      // Try to get all categories
      for (const category of ['root', 'core', 'extended']) {
        const nodes = this.aiNodes.nodesByCategory(category);
        if (nodes) allNodes.push(...nodes);
      }
      return allNodes;
    }

    return [];
  }

  /**
   * Get all links
   */
  getAllLinks() {
    if (!this.linkSystem) return [];

    if (this.linkSystem.allLinks && Array.isArray(this.linkSystem.allLinks)) {
      return this.linkSystem.allLinks;
    }
    if (this.linkSystem.links && Array.isArray(this.linkSystem.links)) {
      return this.linkSystem.links;
    }
    if (this.linkSystem.linksBySourceId) {
      const allLinks = [];
      for (const sourceLinks of this.linkSystem.linksBySourceId.values()) {
        allLinks.push(...sourceLinks);
      }
      return allLinks;
    }

    return [];
  }

  /**
   * Get inbound links to a node
   */
  getInboundLinks(node) {
    if (!node || !this.linkSystem) return [];

    if (this.linkSystem.linksByTargetId && this.linkSystem.linksByTargetId.has(node.id)) {
      return Array.from(this.linkSystem.linksByTargetId.get(node.id));
    }
    if (Array.isArray(this.linkSystem.allLinks)) {
      return this.linkSystem.allLinks.filter(l => 
        (l.target?.id === node.id || l.targetNode?.id === node.id)
      );
    }

    return [];
  }

  /**
   * Get outbound links from a node
   */
  getOutboundLinks(node) {
    if (!node || !this.linkSystem) return [];

    if (this.linkSystem.linksBySourceId && this.linkSystem.linksBySourceId.has(node.id)) {
      return Array.from(this.linkSystem.linksBySourceId.get(node.id));
    }
    if (Array.isArray(this.linkSystem.allLinks)) {
      return this.linkSystem.allLinks.filter(l => 
        (l.source?.id === node.id || l.sourceNode?.id === node.id)
      );
    }

    return [];
  }

  /**
   * Distance calculation helper
   */
  distanceToNode(pos1, pos2) {
    if (!pos1 || !pos2) return 999;

    const dx = (pos1.x || 0) - (pos2.x || 0);
    const dy = (pos1.y || 0) - (pos2.y || 0);
    const dz = (pos1.z || 0) - (pos2.z || 0);

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get harmony info for a node
   */
  getNodeHarmonyInfo(node) {
    const harmonyData = this.nodeHarmony.get(node.id) || this.initializeNodeHarmony(node);
    if (!harmonyData) return null;

    return {
      nodeId: harmonyData.nodeId,
      harmonyLevel: harmonyData.level.toFixed(3),
      velocity: harmonyData.velocity.toFixed(3),
      isAnchor: harmonyData.isAnchor,
      pulseActive: harmonyData.pulseActive
    };
  }

  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    window.harmonyDebug = {
      // Set node harmony
      setHarmony: (node, value) => {
        this.setNodeHarmony(node, value);
        console.log(`[HarmonyStabilization] Node harmony set to ${value.toFixed(3)}`);
      },

      // Trigger harmony pulse
      pulse: (node) => {
        this.triggerHarmonyPulse(node);
        console.log(`[HarmonyStabilization] Pulse triggered from node`);
      },

      // Fully cleanse a node
      cleanseNode: (node) => {
        if (node.userData) {
          node.userData.corruption = 0;
        }
        this.setNodeHarmony(node, 1.0);
        console.log(`[HarmonyStabilization] Node cleansed`);
      },

      // Cleanse a link
      cleanseLink: (link) => {
        this.setLinkHarmony(link, 1.0);
        if (this.aiNodes.linkCorruption) {
          this.aiNodes.linkCorruption.setLinkCorruption(link, 0);
        }
        console.log(`[HarmonyStabilization] Link cleansed`);
      },

      // Create oasis zone around node
      createOasis: (node) => {
        this.setNodeHarmony(node, 0.9);
        const outboundLinks = this.getOutboundLinks(node);
        for (const link of outboundLinks) {
          this.setLinkHarmony(link, 0.8);
        }
        console.log(`[HarmonyStabilization] Oasis zone created`);
      },

      // Get network harmony stats
      networkHarmonyStats: () => {
        const allNodes = this.getAllNodes();
        const allLinks = this.getAllLinks();

        let totalNodeHarmony = 0;
        let totalLinkHarmony = 0;
        let maxNodeHarmony = 0;
        let anchors = 0;

        for (const node of allNodes) {
          const hdata = this.nodeHarmony.get(node.id);
          if (hdata) {
            totalNodeHarmony += hdata.level;
            maxNodeHarmony = Math.max(maxNodeHarmony, hdata.level);
            if (hdata.isAnchor) anchors++;
          }
        }

        for (const link of allLinks) {
          const hdata = this.linkHarmony.get(link.id);
          if (hdata) {
            totalLinkHarmony += hdata.level;
          }
        }

        const stats = {
          totalNodes: allNodes.length,
          trackedNodes: this.nodeHarmony.size,
          averageNodeHarmony: allNodes.length > 0 ? totalNodeHarmony / allNodes.length : 0,
          maxNodeHarmony: maxNodeHarmony,
          harmonyAnchors: anchors,
          totalLinks: allLinks.length,
          trackedLinks: this.linkHarmony.size,
          averageLinkHarmony: allLinks.length > 0 ? totalLinkHarmony / allLinks.length : 0,
          activePulses: this.activePulses.length,
          oasisZones: this.oasisZones.size
        };

        console.table(stats);
        return stats;
      },

      // Toggle debug
      toggleDebug: () => {
        this.debugMode = !this.debugMode;
        console.log(`[HarmonyStabilization] Debug mode: ${this.debugMode}`);
      }
    };

    console.log('%c[HarmonyStabilizationSystem_v1] Debug API ready at window.harmonyDebug', 'color: #00ff00;');
  }
}

export default HarmonyStabilizationSystem_v1;
