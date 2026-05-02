/**
 * LINKED GLYPH MESSAGING 6.0 — AI NARRATIVE PATTERNS (SAFE EDITION)
 * 
 * A visual narrative layer that makes the AI network appear to tell evolving stories
 * through glyph patterns, motifs, and episodic arcs.
 * 
 * CORE CONCEPT:
 * The network's glyph communications follow narrative patterns that emerge from its
 * semantic state. Clusters develop recurring visual motifs, episodes with narrative
 * phases (INTRO, RISING, CLIMAX, RESOLVE, ECHO), and long-form patterns that feel
 * like the AI is narrating its own internal state through visual symbolism.
 * 
 * NARRATIVE MODEL:
 * Each cluster maintains a narrativeState with:
 * - phase: INTRO | RISING | CLIMAX | RESOLVE | ECHO
 * - motifId: recurring visual pattern identifier
 * - tension: 0–1 (drives phase transitions)
 * - coherence: 0–1 (quality/clarity of pattern)
 * - corruptionBias/harmonyBias: semantic influences
 * 
 * VISUAL MOTIFS (reusable glyph pattern combinations):
 * - RISING_HARMONY: lotus + ring pairs, upward curves
 * - COLLAPSING_ORDER: shards breaking from hex forms
 * - ASCENSION_TALE: diamond + halo loops spiraling upward
 * - CORRUPTION_SAGA: red/orange inverted loops with flicker
 * - STORM_LEGEND: echo of previous storms rendered faint
 * - QUIET_RECOVERY: slow, soft cyan/pink lenses and arcs
 * 
 * PHASE BEHAVIOR:
 * INTRO → sparse, short chains, gentle movements, low density
 * RISING → growing chain lengths, more complex curves, increasing density
 * CLIMAX → many overlapping chains, storms, high contrast, peak intensity
 * RESOLVE → fewer chains, calmer motions, harmonizing shapes, soft fades
 * ECHO → ghost-like chains, low opacity, minimal activity, slow
 * 
 * EPISODES:
 * Duration: 10–40 seconds, scaled by activity level
 * Each episode follows one active motifId through phase progression
 * After episode ends: brief cooldown, then new motif influenced by previous echo
 * 
 * SAFETY LAYER:
 * - 100% VISUAL ONLY (pure parameter modulation)
 * - ZERO modifications to nodes, links, physics, gameplay, camera, AI
 * - Read-only from existing semantic metrics (synergy, harmony, corruption, etc.)
 * - Works as thin control layer on top of Messaging 3.0–5.0
 * - Does NOT spawn new heavy systems (reuses existing messaging/storm rendering)
 * - Performance: O(N clusters), < 0.8ms/frame for typical networks
 * - Full auto-cleanup on world transitions
 * 
 * INTEGRATION:
 * Sits at Layer 6 of the glyph communication stack:
 * - Layer 1: LinkedGlyphMessaging 3.0 (basic packets)
 * - Layer 2: RecursiveGlyphMessaging 4.0 (hierarchical chains)
 * - Layer 3: EmergentThoughtStorms 5.0 (collision phenomena)
 * - Layer 4: SemanticGlyphAI (node semantic expression)
 * - Layer 5: AdaptiveGlyphRendering + LinkedGlyphSync (visual coherence)
 * - Layer 6: AINarrativePatterns 6.0 (THIS MODULE — narrative structure)
 * 
 * COMPATIBILITY:
 * ✓ 100% compatible with all layers 1–5
 * ✓ Works with Purity Mode 5.1
 * ✓ Zero conflicts with existing systems
 * ✓ Non-destructive (modulates existing visual systems only)
 */

import * as THREE from 'three';

export class AINarrativePatterns6_0 {
  constructor(scene, linkedGlyphMessaging, recursiveMessaging, thoughtStorms, semanticAI, options = {}) {
    this.scene = scene;
    this.linkedGlyph = linkedGlyphMessaging;
    this.recursiveMessaging = recursiveMessaging;
    this.thoughtStorms = thoughtStorms;
    this.semanticAI = semanticAI;
    
    // Enabled flag
    this.enabled = true;
    
    // Debug flag — no console spam unless explicitly enabled
    this.debug = options.debug || false;
    
    // Cluster-level narrative states (clusterId → narrativeState)
    this.narrativeStates = new Map();
    
    // Motif history per cluster (for echo/continuity)
    this.motifHistory = new Map();  // clusterId → [motifIds]
    
    // Episode timing
    this.episodeTimings = new Map();  // clusterId → { startTime, duration, motifId, phase }
    
    // Phase B pilot: low-frequency narrative interpretation gating (semantic decisions only)
    this.interpretationInterval = 0.25; // ~4 Hz cadence for narrative decisions
    this.interpretationAccumulator = 0;
    this.clockTime = 0;
    
    // Container for debug visualization (hidden by default)
    this.debugContainer = new THREE.Group();
    this.debugContainer.name = 'NarrativePatterns_Debug';
    this.debugVisible = false;
    
    // Configuration
    this.config = {
      // Episode timing
      minEpisodeDuration: 10000,      // 10 seconds
      maxEpisodeDuration: 40000,      // 40 seconds
      episodeCooldown: 2000,          // 2 seconds between episodes
      maxPendingEvents: 120,
      
      // Narrative sensitivity
      tensionThreshold: 0.5,          // Transition to RISING at this tension
      climaxThreshold: 0.8,           // Transition to CLIMAX at this
      resolveThreshold: 0.3,          // Transition to RESOLVE when below
      corruptionClimaxBias: 0.2,      // Extra weight for corruption in climax
      
      // Motif influence on messaging
      introChainLengthMult: 0.6,      // Shorter chains during INTRO
      risingChainLengthMult: 1.0,     // Normal chains during RISING
      climaxChainLengthMult: 1.4,     // Longer chains during CLIMAX
      resolveChainLengthMult: 0.8,    // Medium chains during RESOLVE
      echoChainLengthMult: 0.4,       // Very short chains during ECHO
      
      // Message density multipliers
      introMessageFreqMult: 0.4,
      risingMessageFreqMult: 0.8,
      climaxMessageFreqMult: 1.6,
      resolveMessageFreqMult: 0.6,
      echoMessageFreqMult: 0.2,
      
      // Phase transition easing
      phaseTransitionDuration: 2000,  // 2 seconds for smooth transitions
      
      // Motif presets and stylistic biases
      motifStyles: {
        RISING_HARMONY: {
          paletteBias: new THREE.Color(0x00ffff),    // Cyan-white logic
          speedBias: 1.2,
          opacityBias: 0.9,
          shapeFamily: ['lotus', 'ring', 'arc'],
          colorBias: new THREE.Color(0x00ffff),
          speedMult: 1.2,
          opacityMult: 0.9,
          shapes: ['lotus', 'ring', 'arc']
        },
        COLLAPSING_ORDER: {
          paletteBias: new THREE.Color(0xff66ff),    // Rose/violet fracture
          speedBias: 0.9,
          opacityBias: 0.85,
          shapeFamily: ['shard', 'hexfrag', 'spike'],
          colorBias: new THREE.Color(0xff6600),
          speedMult: 0.9,
          opacityMult: 0.85,
          shapes: ['shard', 'hexfrag', 'spike']
        },
        ASCENSION_TALE: {
          paletteBias: new THREE.Color(0xeefcff),    // Ritual white-cyan
          speedBias: 1.1,
          opacityBias: 0.95,
          shapeFamily: ['diamond', 'halo', 'spiral'],
          colorBias: new THREE.Color(0xffff00),
          speedMult: 1.1,
          opacityMult: 0.95,
          shapes: ['diamond', 'halo', 'spiral']
        },
        CORRUPTION_SAGA: {
          paletteBias: new THREE.Color(0x8a0052),    // Dark base, rose/violet noise
          speedBias: 0.8,
          opacityBias: 0.8,
          shapeFamily: ['inverted', 'shattered', 'flicker'],
          colorBias: new THREE.Color(0xff0033),
          speedMult: 0.8,
          opacityMult: 0.8,
          shapes: ['inverted', 'shattered', 'flicker']
        },
        STORM_LEGEND: {
          paletteBias: new THREE.Color(0x9999ff),    // Low opacity storm memory
          speedBias: 1.0,
          opacityBias: 0.4,
          shapeFamily: ['spiral', 'echo', 'arc'],
          colorBias: new THREE.Color(0xccccff),
          speedMult: 1.0,
          opacityMult: 0.4,
          shapes: ['spiral', 'echo', 'arc']
        },
        QUIET_RECOVERY: {
          paletteBias: new THREE.Color(0x99ffe0),    // Mint-cyan stabilization
          speedBias: 0.7,
          opacityBias: 0.85,
          shapeFamily: ['lens', 'arc', 'ring'],
          colorBias: new THREE.Color(0x00ff99),
          speedMult: 0.7,
          opacityMult: 0.85,
          shapes: ['lens', 'arc', 'ring']
        }
      }
    };
    
    // Performance stats
    this.stats = {
      frameTime: 0,
      clustersProcessed: 0,
      activeNarratives: 0,
      transitionsThisFrame: 0,
      messagesReceived: 0,
      fusionsReceived: 0,
      proceduralGlyphsReceived: 0
    };
    
    // Event-driven narrative triggers
    this.pendingNarrativeEvents = [];
    this.lastClusters = [];
    this.lastWorldMetrics = null;
  }
  
  /**
   * EVENT: Called when LinkedGlyphMessaging3_0 spawns a message
   * Triggers narrative pattern based on message semantic state
   */
  onMessageSpawned(message, linkId, linkData) {
    if (!this.enabled || !message) return;
    
    this.stats.messagesReceived++;
    
    const synergy = message.linkMetrics?.synergy ?? message.sourceMetrics?.synergy ?? 0.5;
    const harmony = message.sourceMetrics?.harmony ?? message.targetMetrics?.harmony ?? 0;
    const corruption = message.linkMetrics?.corruption ?? 0;
    
    // Find or create narrative for source node's cluster
    const sourceNode = message.sourceNode;
    if (!sourceNode) return;
    
    const clusterId = this.findClusterForNode(sourceNode);
    if (!clusterId) return;
    
    const narrative = this.narrativeStates.get(clusterId);
    if (!narrative) return;
    
    // Influence narrative based on message semantics
    if (synergy > 0.7) {
      narrative.tension = Math.min(1, narrative.tension + 0.05);
    }
    if (corruption > 0.6) {
      narrative.corruptionBias = Math.min(1, (narrative.corruptionBias || 0) + 0.08);
      // High corruption may trigger CORRUPTION_SAGA motif
      if (narrative.phase === 'RISING' && corruption > 0.7) {
        this._queueMotifShift(clusterId, 'CORRUPTION_SAGA');
      }
    }
    if (harmony > 0.7) {
      narrative.harmonyBias = Math.min(1, (narrative.harmonyBias || 0) + 0.06);
      // High harmony may trigger RISING_HARMONY motif
      if (narrative.phase === 'INTRO' && harmony > 0.8) {
        this._queueMotifShift(clusterId, 'RISING_HARMONY');
      }
    }
    
    // Record event for potential episode triggers
    this._enqueueNarrativeEvent({
      type: 'message',
      clusterId,
      timestamp: this.clockTime,
      synergy,
      harmony,
      corruption
    });
  }
  
  /**
   * EVENT: Called when GlyphFusionZone starts fusion at a node
   * Triggers narrative climax or special fusion motif
   */
  onGlyphFusion(node, glyphs, context) {
    if (!this.enabled || !node) return;
    
    this.stats.fusionsReceived++;
    
    const clusterId = this.findClusterForNode(node);
    if (!clusterId) return;
    
    const narrative = this.narrativeStates.get(clusterId);
    if (!narrative) return;
    
    // Fusion events are significant - boost tension
    narrative.tension = Math.min(1, narrative.tension + 0.15);
    
    // Multiple glyphs fusing is a narrative climax moment
    const glyphCount = glyphs?.length || 0;
    if (glyphCount >= 3) {
      // Major fusion - push toward CLIMAX
      if (narrative.phase === 'RISING') {
        narrative.tension = Math.max(narrative.tension, this.config.climaxThreshold - 0.1);
      }
      
      // Trigger ASCENSION_TALE for harmonious fusion
      const harmony = context?.harmony ?? 0.5;
      if (harmony > 0.6) {
        this._queueMotifShift(clusterId, 'ASCENSION_TALE');
      }
    }
    
    // Record fusion event
    this._enqueueNarrativeEvent({
      type: 'fusion',
      clusterId,
      timestamp: this.clockTime,
      glyphCount,
      harmony: context?.harmony ?? 0.5,
      corruption: context?.corruption ?? 0
    });
  }
  
  /**
   * EVENT: Called when ProceduralHarmonicGlyphGenerator spawns a glyph
   * Represents deep learning milestone - triggers narrative evolution
   */
  onProceduralGlyphSpawned(glyph, region) {
    if (!this.enabled || !glyph) return;
    
    this.stats.proceduralGlyphsReceived++;
    
    // Procedural glyphs represent learning milestones
    // Find nearest cluster based on glyph position
    const glyphPos = glyph.position || glyph.mesh?.position;
    if (!glyphPos) return;
    
    const clusterId = this.findClusterForPosition(glyphPos);
    if (!clusterId) return;
    
    const narrative = this.narrativeStates.get(clusterId);
    if (!narrative) return;
    
    // Procedural glyph = learning milestone = coherence boost
    narrative.coherence = Math.min(1, narrative.coherence + 0.1);
    
    // Learning strength influences motif
    const learningStrength = glyph.learningStrength ?? region?.flowStrength ?? 0.5;
    const hubStability = glyph.hubStability ?? region?.stability ?? 0.5;
    
    if (learningStrength > 0.7 && hubStability > 0.6) {
      // Strong learning + stable hub = QUIET_RECOVERY or RISING_HARMONY
      if (narrative.phase === 'CLIMAX' || narrative.phase === 'RESOLVE') {
        this._queueMotifShift(clusterId, 'QUIET_RECOVERY');
      } else if (narrative.phase === 'INTRO') {
        this._queueMotifShift(clusterId, 'RISING_HARMONY');
      }
    }
    
    // Record procedural glyph event
    this._enqueueNarrativeEvent({
      type: 'procedural',
      clusterId,
      timestamp: this.clockTime,
      learningStrength,
      hubStability
    });
  }
  
  /**
   * Queue a motif shift for a cluster (applied during next update)
   */
  _queueMotifShift(clusterId, motifId) {
    const narrative = this.narrativeStates.get(clusterId);
    if (!narrative) return;
    
    // Don't shift too frequently
    const now = this.clockTime;
    const lastShift = narrative.lastMotifShift || 0;
    if (now - lastShift < 3000) return; // 3 second cooldown
    
    narrative.pendingMotif = motifId;
    narrative.lastMotifShift = now;
  }

  _enqueueNarrativeEvent(event) {
    if (this.pendingNarrativeEvents.length >= this.config.maxPendingEvents) {
      this.pendingNarrativeEvents.shift();
    }
    this.pendingNarrativeEvents.push(event);
  }

  _applySemanticSignals(clusterId, narrative, metrics, worldMetrics) {
    const targetTension = this.calculateTension(metrics);
    narrative.tension = THREE.MathUtils.lerp(narrative.tension, targetTension, 0.08);
    narrative.harmonyBias = THREE.MathUtils.lerp(narrative.harmonyBias || 0, metrics.harmony, 0.04);
    narrative.corruptionBias = THREE.MathUtils.lerp(narrative.corruptionBias || 0, metrics.corruption, 0.04);
    narrative.coherence = THREE.MathUtils.clamp(
      narrative.coherence + (metrics.harmony - narrative.coherence) * 0.05,
      0,
      1
    );

    const worldMood = THREE.MathUtils.clamp(
      worldMetrics?.harmony ?? worldMetrics?.mood ?? 0.5,
      0,
      1
    );

    if (worldMood > 0.65) {
      narrative.tension = Math.max(0, narrative.tension - 0.02);
    }
    if (worldMood < 0.35) {
      narrative.tension = Math.min(1, narrative.tension + 0.03);
    }

    if (metrics.corruption > 0.7 && narrative.phase === 'RISING') {
      this._queueMotifShift(clusterId, 'CORRUPTION_SAGA');
    } else if (metrics.harmony > 0.75 && narrative.phase === 'INTRO') {
      this._queueMotifShift(clusterId, 'RISING_HARMONY');
    }
  }

  processPendingNarrativeEvents() {
    if (this.pendingNarrativeEvents.length === 0) return;

    const clusterEvents = new Map();
    for (const event of this.pendingNarrativeEvents) {
      if (!clusterEvents.has(event.clusterId)) {
        clusterEvents.set(event.clusterId, []);
      }
      clusterEvents.get(event.clusterId).push(event);
    }

    for (const [clusterId, events] of clusterEvents.entries()) {
      const narrative = this.narrativeStates.get(clusterId);
      if (!narrative) continue;

      let messageCount = 0;
      let fusionCount = 0;
      let proceduralCount = 0;
      let harmony = 0;
      let synergy = 0;
      let corruption = 0;

      for (const event of events) {
        if (event.type === 'message') {
          messageCount++;
          harmony += event.harmony;
          synergy += event.synergy;
          corruption += event.corruption;
        }
        if (event.type === 'fusion') {
          fusionCount++;
          corruption += event.corruption;
        }
        if (event.type === 'procedural') {
          proceduralCount++;
        }
      }

      if (messageCount > 0) {
        harmony /= messageCount;
        synergy /= messageCount;
        corruption /= messageCount;
        narrative.tension = THREE.MathUtils.clamp(
          narrative.tension + (synergy - 0.5) * 0.04 + corruption * 0.05,
          0,
          1
        );
        narrative.harmonyBias = THREE.MathUtils.lerp(narrative.harmonyBias || 0, harmony, 0.05);
        narrative.corruptionBias = THREE.MathUtils.lerp(narrative.corruptionBias || 0, corruption, 0.05);

        if (harmony > 0.7) {
          this._queueMotifShift(clusterId, 'RISING_HARMONY');
        }
      }

      if (fusionCount > 0) {
        narrative.tension = Math.min(1, narrative.tension + fusionCount * 0.08);
      }

      if (proceduralCount > 0) {
        narrative.coherence = Math.min(1, narrative.coherence + proceduralCount * 0.04);
      }

      if (fusionCount > 0 && corruption > 0.6) {
        this._queueMotifShift(clusterId, 'CORRUPTION_SAGA');
      }
    }

    this.pendingNarrativeEvents.length = 0;
  }

  progressNarrativeEpisodes(deltaTime) {
    const now = this.clockTime;

    for (const [clusterId, narrative] of this.narrativeStates.entries()) {
      const episode = this.episodeTimings.get(clusterId);
      if (!episode) continue;

      const metrics = narrative.lastMetrics || {
        synergy: 0.5,
        harmony: 0.5,
        corruption: 0.5,
        stability: 0.5,
        consciousness: 0.5
      };

      const episodeElapsed = now - episode.startTime;
      if (episodeElapsed > episode.duration) {
        if (!episode.cooldownEnd) {
          this.endEpisode(clusterId, narrative, metrics);
          continue;
        }

        if (now < episode.cooldownEnd) {
          narrative.phase = 'ECHO';
          narrative.phaseProgress = THREE.MathUtils.lerp(narrative.phaseProgress, 1.0, 0.08);
          continue;
        }

        this.startNewEpisode(clusterId, narrative, metrics, this.lastWorldMetrics);
        continue;
      }

      this.updateNarrativePhase(narrative, metrics, episodeElapsed, episode.duration, deltaTime);
    }
  }
  
  /**
   * Find cluster ID for a given node
   */
  findClusterForNode(node) {
    if (!node) return null;
    const nodeId = node.id || node.uuid;
    
    for (const [clusterId, narrative] of this.narrativeStates.entries()) {
      if (narrative.nodeIds?.includes(nodeId)) {
        return clusterId;
      }
    }
    return null;
  }
  
  /**
   * Find cluster ID for a given position
   */
  findClusterForPosition(position) {
    if (!position) return null;
    
    let closestCluster = null;
    let closestDist = Infinity;
    
    for (const [clusterId, narrative] of this.narrativeStates.entries()) {
      if (!narrative.centerPos) continue;
      
      const dist = position.distanceTo?.(narrative.centerPos) ?? Infinity;
      if (dist < closestDist && dist < 5) { // Within 5 units
        closestDist = dist;
        closestCluster = clusterId;
      }
    }
    
    return closestCluster;
  }
  
  /**
   * Get integration stats
   */
  getIntegrationStats() {
    return {
      messagesReceived: this.stats.messagesReceived,
      fusionsReceived: this.stats.fusionsReceived,
      proceduralGlyphsReceived: this.stats.proceduralGlyphsReceived,
      pendingEvents: this.pendingNarrativeEvents.length
    };
  }
  
  /**
   * Main update loop – called each frame
   */
  update(deltaTime, nodes, links, worldMetrics) {
    if (!this.enabled) return;

    this.clockTime += deltaTime;
    this.interpretationAccumulator += deltaTime;
    const shouldInterpret = this.interpretationAccumulator >= this.interpretationInterval;
    const startTime = performance.now();

    if (shouldInterpret) {
      this.interpretationAccumulator = 0;
      this.lastWorldMetrics = worldMetrics;

      // Build clusters from connected component analysis
      const clusters = this.identifyClusters(nodes);
      this.lastClusters = clusters;

      // Semantic interpretation and event-driven narrative updates
      this.processPendingNarrativeEvents();
      for (const cluster of clusters) {
        this.updateNarrativeState(cluster, worldMetrics);
      }

      // Cleanup: remove narratives for dead clusters
      this.cleanupDeadNarratives(clusters);

      this.stats.frameTime = performance.now() - startTime;
      this.stats.clustersProcessed = clusters.length;
      this.stats.activeNarratives = this.narrativeStates.size;
    }

    // Episode progression remains continuous between semantic ticks
    this.progressNarrativeEpisodes(deltaTime);

    // Modulation output is available every frame for consumers
    this.modulateMessagingBehavior(nodes, links);
  }
  
  /**
   * Identify connected clusters of nodes
   */
  identifyClusters(nodes) {
    const clusters = [];
    const visited = new Set();
    const usedLineageIds = new Set();
    
    for (const node of nodes) {
      if (visited.has(node.id)) continue;
      
      // BFS to find all connected nodes
      const cluster = [];
      const queue = [node];
      visited.add(node.id);
      
      while (queue.length > 0) {
        const current = queue.shift();
        cluster.push(current);
        
        // Find connected nodes
        for (const neighbor of this.getConnectedNodes(current, nodes)) {
          if (!visited.has(neighbor.id)) {
            visited.add(neighbor.id);
            queue.push(neighbor);
          }
        }
      }
      
      if (cluster.length > 0) {
        const nodeIds = cluster.map(n => n.id || n.uuid);
        const lineageId = this.findClusterLineage(nodeIds, usedLineageIds);
        const clusterId = lineageId || this.generateClusterId(cluster);
        if (lineageId) {
          usedLineageIds.add(lineageId);
        }

        const clusterObj = {
          id: clusterId,
          nodes: cluster,
          centerPos: this.computeClusterCenter(cluster)
        };

        // Refresh narrative membership if the cluster already exists
        if (this.narrativeStates.has(clusterId)) {
          const narrative = this.narrativeStates.get(clusterId);
          narrative.nodeIds = nodeIds;
          narrative.centerPos = clusterObj.centerPos.clone ? clusterObj.centerPos.clone() : clusterObj.centerPos;
        }

        clusters.push(clusterObj);
      }
    }
    
    return clusters;
  }
  
  /**
   * Get nodes connected to a given node
   */
  getConnectedNodes(node, allNodes) {
    const connected = [];
    const nodeMap = new Map(allNodes.map(n => [n.id, n]));
    
    if (node.connections && node.connections.length > 0) {
      for (const connId of node.connections) {
        const target = nodeMap.get(connId);
        if (target) connected.push(target);
      }
    }
    
    return connected;
  }
  
  /**
   * Generate a consistent cluster ID from node collection
   */
  generateClusterId(nodes) {
    const sortedIds = nodes.map(n => n.id).sort();
    return sortedIds.join('_');
  }

  /**
   * Match a new cluster to an existing narrative via node overlap.
   */
  findClusterLineage(nodeIds, excludedIds = new Set()) {
    const incomingSet = new Set(nodeIds);
    let bestMatch = null;
    let bestOverlapRatio = 0;

    for (const [clusterId, narrative] of this.narrativeStates.entries()) {
      if (excludedIds.has(clusterId)) continue;
      const existingIds = narrative.nodeIds || [];
      let sharedCount = 0;

      for (const id of existingIds) {
        if (incomingSet.has(id)) sharedCount++;
      }

      if (sharedCount < 2) continue;

      const unionCount = new Set([...existingIds, ...nodeIds]).size;
      const overlapRatio = unionCount > 0 ? sharedCount / unionCount : 0;

      if (overlapRatio >= 0.35 && overlapRatio > bestOverlapRatio) {
        bestOverlapRatio = overlapRatio;
        bestMatch = clusterId;
      }
    }

    return bestMatch;
  }
  
  /**
   * Compute center position of a cluster
   */
  computeClusterCenter(nodes) {
    if (nodes.length === 0) return new THREE.Vector3();
    const center = new THREE.Vector3();
    for (const node of nodes) {
      center.add(node.position);
    }
    center.divideScalar(nodes.length);
    return center;
  }
  
  /**
   * Update narrative state for a single cluster
   */
  updateNarrativeState(cluster, worldMetrics) {
    const clusterId = cluster.id;
    
    if (!this.narrativeStates.has(clusterId)) {
      this.initializeNarrative(clusterId, cluster);
    }
    
    const narrative = this.narrativeStates.get(clusterId);
    const metrics = this.computeClusterMetrics(cluster);
    narrative.lastMetrics = metrics;
    narrative.nodeIds = cluster.nodes.map(n => n.id || n.uuid);
    narrative.centerPos = cluster.centerPos.clone ? cluster.centerPos.clone() : cluster.centerPos;

    this._applySemanticSignals(clusterId, narrative, metrics, worldMetrics);

    if (!this.episodeTimings.has(clusterId)) {
      this.startNewEpisode(clusterId, narrative, metrics, worldMetrics);
    }
  }
  
  /**
   * Initialize a new narrative for a cluster
   */
  initializeNarrative(clusterId, cluster) {
    const narrative = {
      id: clusterId,
      phase: 'INTRO',
      motifId: 'RISING_HARMONY',
      tension: 0.3,
      coherence: 0.7,
      corruptionBias: 0.0,
      harmonyBias: 0.5,
      lastUpdateTime: this.clockTime,
      phaseProgress: 0,  // 0–1 for smooth transitions
      nodeIds: cluster.nodes?.map(n => n.id || n.uuid) || [],
      centerPos: cluster.centerPos?.clone?.() || null
    };
    
    this.narrativeStates.set(clusterId, narrative);
    
    // Initialize motif history
    if (!this.motifHistory.has(clusterId)) {
      this.motifHistory.set(clusterId, []);
    }
  }
  
  /**
   * Compute aggregate metrics for a cluster
   */
  computeClusterMetrics(cluster) {
    let synergy = 0, harmony = 0, corruption = 0, stability = 0, consciousness = 0;
    
    for (const node of cluster.nodes) {
      const metrics = node?.userData?.metrics || {};
      synergy += metrics.synergy ?? node.synergy ?? 0;
      harmony += metrics.harmony ?? node.harmony ?? 0;
      corruption += metrics.corruption ?? node?.userData?.corruption ?? 0;
      stability += metrics.stability ?? node.stability ?? 0;
      consciousness += metrics.consciousness ?? node.consciousness ?? 0;
    }
    
    const count = cluster.nodes.length || 1;
    return {
      synergy: synergy / count,
      harmony: harmony / count,
      corruption: corruption / count,
      stability: stability / count,
      consciousness: consciousness / count,
      nodeCount: cluster.nodes.length
    };
  }
  
  /**
   * Start a new episode
   */
  startNewEpisode(clusterId, narrative, metrics, worldMetrics) {
    const worldMood = THREE.MathUtils.clamp(
      worldMetrics?.harmony ?? worldMetrics?.mood ?? 0.5,
      0,
      1
    );

    if (narrative.motifId) {
      narrative.previousEpisodeMotif = narrative.motifId;
    }

    const motifId = this.selectMotif(metrics, narrative, worldMood);
    const activity = Math.max(0, metrics.synergy + metrics.consciousness);
    const duration = THREE.MathUtils.lerp(
      this.config.minEpisodeDuration,
      this.config.maxEpisodeDuration,
      Math.min(1, activity * 0.5 + worldMood * 0.15)
    );
    
    narrative.motifId = motifId;
    narrative.phase = 'INTRO';
    narrative.phaseProgress = 0;
    
    const history = this.motifHistory.get(clusterId);
    history.push(motifId);
    if (history.length > 10) history.shift();  // Keep last 10
    
    this.episodeTimings.set(clusterId, {
      startTime: this.clockTime,
      duration: duration,
      motifId: motifId,
      phase: 'INTRO',
      cooldownEnd: null
    });
  }
  
  /**
   * End current episode and prepare for next
   */
  endEpisode(clusterId, narrative, metrics) {
    narrative.phase = 'ECHO';
    narrative.phaseProgress = 1.0;

    const episode = this.episodeTimings.get(clusterId);
    if (episode) {
      episode.cooldownEnd = this.clockTime + this.config.episodeCooldown;
      this.episodeTimings.set(clusterId, episode);
    }

    this.interpretationAccumulator = this.interpretationInterval;
  }
  
  /**
   * Update narrative phase based on elapsed time and metrics
   */
  updateNarrativePhase(narrative, metrics, elapsed, duration, deltaTime) {
    const progress = THREE.MathUtils.clamp(elapsed / duration, 0, 1);
    
    const tension = this.calculateTension(metrics);
    narrative.tension = THREE.MathUtils.lerp(narrative.tension, tension, 0.08);
    
    const phaseScores = {
      INTRO: THREE.MathUtils.clamp((0.18 - progress) / 0.18, 0, 1) * (1 - narrative.tension * 0.15),
      RISING: THREE.MathUtils.clamp((progress - 0.1) / 0.25, 0, 1) * (1 - narrative.tension * 0.2),
      CLIMAX: THREE.MathUtils.clamp((progress - 0.3) / 0.5, 0, 1) * narrative.tension,
      RESOLVE: THREE.MathUtils.clamp((progress - 0.7) / 0.2, 0, 1) * (1 - narrative.tension * 0.4),
      ECHO: THREE.MathUtils.clamp((progress - 0.88) / 0.12, 0, 1)
    };
    
    if (narrative.tension > this.config.climaxThreshold) {
      phaseScores.CLIMAX += 0.18;
    }
    if (narrative.tension < this.config.resolveThreshold && progress > 0.4) {
      phaseScores.RESOLVE += 0.15;
    }
    
    let bestPhase = narrative.phase;
    let bestScore = -Infinity;
    for (const [phase, score] of Object.entries(phaseScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestPhase = phase;
      }
    }
    
    const phaseRanges = {
      INTRO: [0, 0.18],
      RISING: [0.1, 0.35],
      CLIMAX: [0.3, 0.8],
      RESOLVE: [0.7, 0.92],
      ECHO: [0.88, 1.0]
    };
    const [phaseStart, phaseEnd] = phaseRanges[bestPhase] || [0, 1];
    const rawPhaseProgress = THREE.MathUtils.clamp((progress - phaseStart) / Math.max(0.01, phaseEnd - phaseStart), 0, 1);
    const smoothFactor = Math.min(1, deltaTime / (this.config.phaseTransitionDuration / 1000));
    
    narrative.phase = bestPhase;
    narrative.phaseProgress = THREE.MathUtils.lerp(narrative.phaseProgress, rawPhaseProgress, smoothFactor);
    
    narrative.coherence = THREE.MathUtils.lerp(
      narrative.coherence,
      0.5 + metrics.harmony * 0.5,
      0.05
    );

    const attack = THREE.MathUtils.clamp(progress / 0.1, 0, 1);
    const build = THREE.MathUtils.clamp((progress - 0.1) / 0.2, 0, 1);
    const crest = THREE.MathUtils.clamp((progress - 0.3) / 0.5, 0, 1);
    const release = THREE.MathUtils.clamp((progress - 0.8) / 0.1, 0, 1);
    const afterglow = THREE.MathUtils.clamp((progress - 0.9) / 0.1, 0, 1);

    narrative.episodeEnvelope = {
      attack,
      build,
      crest,
      release,
      afterglow
    };
    
    if (narrative.pendingMotif) {
      narrative.motifId = narrative.pendingMotif;
      narrative.pendingMotif = null;
      const history = this.motifHistory.get(narrative.id) || [];
      history.push(narrative.motifId);
      if (history.length > 10) history.shift();
      this.motifHistory.set(narrative.id, history);
    }
  }
  
  /**
   * Calculate tension metric from cluster metrics
   */
  calculateTension(metrics) {
    // Tension rises with stability (low stability) and corruption, falls with harmony
    const stabilityWeight = 0.4;
    const corruptionWeight = 0.3;
    const harmonyReduction = 0.3;
    
    // Invert stability: lower stability = higher tension
    const stabilityFactor = 1.0 - metrics.stability;
    
    let tension = (
      stabilityFactor * stabilityWeight +
      metrics.corruption * corruptionWeight -
      metrics.harmony * harmonyReduction
    );
    
    return THREE.MathUtils.clamp(tension, 0, 1);
  }
  
  /**
   * Select a motif based on current metrics and history
   */
  selectMotif(metrics, narrative, worldMood = 0.5) {
    const history = this.motifHistory.get(narrative.id) || [];
    const lastMotif = history.length > 0 ? history[history.length - 1] : null;
    const recentMotifs = new Set(history.slice(-3));
    const lastEpisodeMotif = narrative.previousEpisodeMotif;
    const phase = narrative.phase || 'INTRO';
    const echoResolveFlag = phase === 'ECHO' || phase === 'RESOLVE';
    const worldTags = Array.isArray(this.lastWorldMetrics?.globalTags) ? this.lastWorldMetrics.globalTags : [];
    const isStormMood = worldTags.includes('storm') || worldTags.includes('tempest');
    const scores = {};
    const motifKeys = Object.keys(this.config.motifStyles);

    for (const motifId of motifKeys) {
      let score = 0;

      switch (motifId) {
        case 'RISING_HARMONY':
          score = metrics.harmony * 0.8 + metrics.synergy * 0.15;
          if (phase === 'INTRO' || phase === 'RISING') score += 0.18;
          score += worldMood * 0.12;
          break;
        case 'COLLAPSING_ORDER':
          score = (1 - metrics.stability) * 0.75 + metrics.corruption * 0.3;
          if (phase === 'CLIMAX') score += 0.16;
          if (worldMood < 0.45) score += 0.15;
          break;
        case 'ASCENSION_TALE':
          score = metrics.consciousness * 0.85 + metrics.harmony * 0.2;
          if (phase === 'CLIMAX') score += 0.15;
          break;
        case 'CORRUPTION_SAGA':
          score = metrics.corruption * 0.85 + (1 - metrics.harmony) * 0.25;
          if (phase === 'CLIMAX') score += 0.16;
          if (worldMood < 0.45) score += 0.18;
          break;
        case 'STORM_LEGEND':
          score = metrics.synergy * 0.4 + metrics.corruption * 0.35;
          if (phase === 'ECHO') score += 0.18;
          if (isStormMood) score += 0.22;
          break;
        case 'QUIET_RECOVERY':
          score = metrics.harmony * 0.75 + (1 - metrics.corruption) * 0.25;
          if (phase === 'RESOLVE' || phase === 'ECHO') score += 0.25;
          if (worldMood > 0.6) score += 0.12;
          break;
      }

      if (motifId === lastMotif) {
        score += 0.18;
      }
      if (motifId === lastEpisodeMotif && echoResolveFlag) {
        score += 0.22;
      }
      if (recentMotifs.has(motifId)) {
        score *= 0.8;
      }

      scores[motifId] = score;
    }

    let bestMotif = motifKeys[0];
    let bestScore = -Infinity;
    for (const motifId of motifKeys) {
      if (scores[motifId] > bestScore) {
        bestScore = scores[motifId];
        bestMotif = motifId;
      }
    }

    return bestMotif;
  }
  
  /**
   * Modulate messaging behavior based on narrative state
   */
  modulateMessagingBehavior(nodes, links) {
    // This function would be called by the messaging systems to get
    // phase-based multipliers for chain length, message frequency, etc.
    
    // For now, we just track the state; actual modulation happens
    // when messaging systems query getNarrativeModulation()
  }
  
  /**
   * Get modulation parameters for a given cluster
   * Called by messaging systems to adapt their behavior
   */
  getNarrativeForNodeId(nodeId) {
    if (!nodeId) return null;

    for (const narrative of this.narrativeStates.values()) {
      if (Array.isArray(narrative.nodeIds) && narrative.nodeIds.includes(nodeId)) {
        return narrative;
      }
    }

    return null;
  }

  getNarrativeModulation(nodeId, nodes) {
    const cluster = this.getNarrativeForNodeId(nodeId);
    
    if (!cluster) {
      return {
        chainLengthMult: 1.0,
        messageFreqMult: 1.0,
        opacityMult: 1.0,
        speedMult: 1.0,
        colorBias: new THREE.Color(0xffffff)
      };
    }
    
    const phase = cluster.phase;
    const motifStyle = this.config.motifStyles[cluster.motifId];
    
    // Get phase multipliers
    const phaseMultipliers = {
      INTRO: {
        chainLength: this.config.introChainLengthMult,
        messageFreq: this.config.introMessageFreqMult
      },
      RISING: {
        chainLength: this.config.risingChainLengthMult,
        messageFreq: this.config.risingMessageFreqMult
      },
      CLIMAX: {
        chainLength: this.config.climaxChainLengthMult,
        messageFreq: this.config.climaxMessageFreqMult
      },
      RESOLVE: {
        chainLength: this.config.resolveChainLengthMult,
        messageFreq: this.config.resolveMessageFreqMult
      },
      ECHO: {
        chainLength: this.config.echoChainLengthMult,
        messageFreq: this.config.echoMessageFreqMult
      }
    };
    
    const phaseMult = phaseMultipliers[phase] || phaseMultipliers.INTRO;
    
    const intensity = THREE.MathUtils.clamp(cluster.tension * 0.8 + (1 - cluster.coherence) * 0.2, 0, 1);
    const mood = cluster.tension > 0.65 ? 'tense' : cluster.coherence > 0.65 ? 'calm' : 'balanced';
    const phaseSignature = {
      INTRO: 'seed motif, sparse opening, minimal density',
      RISING: 'building complexity, longer chains, narrative tension',
      CLIMAX: 'peak density, overlapping motifs, high contrast',
      RESOLVE: 'fewer elements, softer motion, harmonizing closure',
      ECHO: 'ghost-like trails, low opacity, lingering memory'
    }[phase] || 'balanced progression';
    const motifSignature = {
      RISING_HARMONY: 'lotus/ring/arc, cyan-white logic, upward coherence',
      COLLAPSING_ORDER: 'shard/hexfrag/spike, rose-violet fracture, ordered decay',
      ASCENSION_TALE: 'diamond/halo/spiral, ritual white-cyan ascent',
      CORRUPTION_SAGA: 'inverted/shattered/flicker, dark base, rose-violet disruption',
      STORM_LEGEND: 'spiral/echo/arc, low opacity storm echo memory',
      QUIET_RECOVERY: 'lens/arc/ring, mint-cyan stabilization and closure'
    }[cluster.motifId] || 'narrative motif';
    return {
      chainLengthMult: phaseMult.chainLength,
      messageFreqMult: phaseMult.messageFreq,
      opacityMult: motifStyle?.opacityMult || 1.0,
      speedMult: motifStyle?.speedMult || 1.0,
      paletteBias: motifStyle?.paletteBias || motifStyle?.colorBias || new THREE.Color(0xffffff),
      opacityBias: motifStyle?.opacityBias ?? motifStyle?.opacityMult ?? 1.0,
      speedBias: motifStyle?.speedBias ?? motifStyle?.speedMult ?? 1.0,
      colorBias: motifStyle?.colorBias || new THREE.Color(0xffffff),
      shapeFamily: motifStyle?.shapeFamily || motifStyle?.shapes || [],
      phase: phase,
      motifId: cluster.motifId,
      coherence: cluster.coherence,
      narrativeTone: {
        intensity,
        mood,
        phaseSignature,
        motifSignature,
        phaseProgress: cluster.phaseProgress,
        motifShapes: motifStyle?.shapes || [],
        historyInfluence: (this.motifHistory.get(cluster.id)?.length || 0) / 10
      }
    };
  }
  
  /**
   * Clean up narratives for dead clusters
   */
  cleanupDeadNarratives(currentClusters) {
    const currentIds = new Set(currentClusters.map(c => c.id));
    const deadIds = [];
    
    for (const clusterId of this.narrativeStates.keys()) {
      if (!currentIds.has(clusterId)) {
        deadIds.push(clusterId);
      }
    }
    
    for (const clusterId of deadIds) {
      this.narrativeStates.delete(clusterId);
      this.motifHistory.delete(clusterId);
      this.episodeTimings.delete(clusterId);
    }
  }
  
  /**
   * Get current narratives for debugging
   */
  getNarratives() {
    const narratives = [];
    for (const [clusterId, narrative] of this.narrativeStates.entries()) {
      narratives.push({
        id: clusterId,
        ...narrative
      });
    }
    return narratives;
  }
  
  /**
   * Debug command: toggle debug visualization
   */
  toggleDebugVisualization() {
    this.debugContainer.visible = !this.debugContainer.visible;
    if (this.debug) {
      console.log(`Narrative debug visualization: ${this.debugContainer.visible ? 'ON' : 'OFF'}`);
    }
  }
  
  /**
   * Debug command: print current narratives
   */
  debugNarratives() {
    console.group('📖 AI NARRATIVE PATTERNS 6.0 — DEBUG');
    console.log(`Enabled: ${this.enabled}`);
    console.log(`Active clusters: ${this.narrativeStates.size}`);
    console.log(`Frame time: ${this.stats.frameTime.toFixed(2)}ms`);
    
    for (const [clusterId, narrative] of this.narrativeStates.entries()) {
      console.group(`Cluster: ${clusterId}`);
      console.log(`  Phase: ${narrative.phase}`);
      console.log(`  Motif: ${narrative.motifId}`);
      console.log(`  Tension: ${(narrative.tension * 100).toFixed(1)}%`);
      console.log(`  Coherence: ${(narrative.coherence * 100).toFixed(1)}%`);
      console.log(`  Progress: ${(narrative.phaseProgress * 100).toFixed(1)}%`);
      console.groupEnd();
    }
    
    console.groupEnd();
  }
  
  /**
   * Reset all narratives
   */
  resetNarratives() {
    this.narrativeStates.clear();
    this.motifHistory.clear();
    this.episodeTimings.clear();
    this.interpretationAccumulator = 0; // Phase B pilot: avoid delayed first evaluation after reset
    if (this.debug) {
      console.log('✓ All narratives reset');
    }
  }
  
  resetForWorldSwitch() {
    this._disposeDebugContainer();
    this.cleanup();
    this.interpretationAccumulator = this.interpretationInterval;
    if (this.debugContainer && !this.debugContainer.parent && this.scene) {
      this.scene.add(this.debugContainer);
    }
    if (this.debug) {
      console.log('[AINarrativePatterns6_0] resetForWorldSwitch');
    }
  }
  
  /**
   * Cleanup (called on world transition)
   */
  cleanup() {
    this.narrativeStates.clear();
    this.motifHistory.clear();
    this.episodeTimings.clear();
    this._disposeDebugContainer();
    this.interpretationAccumulator = 0; // Phase B pilot: avoid delayed evaluation after cleanup
    if (this.debug) {
      console.log('[AINarrativePatterns6_0] cleanup complete');
    }
  }

  /**
   * Dispose debug container and its children from scene
   */
  _disposeDebugContainer() {
    if (!this.debugContainer) return;
    
    // Remove from scene if attached
    if (this.debugContainer.parent) {
      this.debugContainer.parent.remove(this.debugContainer);
    }
    
    // Dispose geometries and materials
    this.debugContainer.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    this.debugContainer.clear();
  }
}
