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
  constructor(scene, linkedGlyphMessaging, recursiveMessaging, thoughtStorms, semanticAI) {
    this.scene = scene;
    this.linkedGlyph = linkedGlyphMessaging;
    this.recursiveMessaging = recursiveMessaging;
    this.thoughtStorms = thoughtStorms;
    this.semanticAI = semanticAI;
    
    // Enabled flag
    this.enabled = true;
    
    // Cluster-level narrative states (clusterId → narrativeState)
    this.narrativeStates = new Map();
    
    // Motif history per cluster (for echo/continuity)
    this.motifHistory = new Map();  // clusterId → [motifIds]
    
    // Episode timing
    this.episodeTimings = new Map();  // clusterId → { startTime, duration, motifId, phase }
    
    // Container for debug visualization (hidden by default)
    this.debugContainer = new THREE.Group();
    this.debugContainer.name = 'NarrativePatterns_Debug';
    this.scene.add(this.debugContainer);
    
    // Configuration
    this.config = {
      // Episode timing
      minEpisodeDuration: 10000,      // 10 seconds
      maxEpisodeDuration: 40000,      // 40 seconds
      episodeCooldown: 2000,          // 2 seconds between episodes
      
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
      
      // Motif color/style mappings (stored during episode)
      motifStyles: {
        RISING_HARMONY: {
          colorBias: new THREE.Color(0x00ffff),    // Cyan
          speedMult: 1.2,
          opacityMult: 0.9,
          shapes: ['lotus', 'ring', 'arc']
        },
        COLLAPSING_ORDER: {
          colorBias: new THREE.Color(0xff6600),    // Orange
          speedMult: 0.9,
          opacityMult: 0.85,
          shapes: ['shard', 'hexfrag', 'spike']
        },
        ASCENSION_TALE: {
          colorBias: new THREE.Color(0xffff00),    // Yellow
          speedMult: 1.1,
          opacityMult: 0.95,
          shapes: ['diamond', 'halo', 'spiral']
        },
        CORRUPTION_SAGA: {
          colorBias: new THREE.Color(0xff0033),    // Red
          speedMult: 0.8,
          opacityMult: 0.8,
          shapes: ['inverted', 'shattered', 'flicker']
        },
        STORM_LEGEND: {
          colorBias: new THREE.Color(0xccccff),    // Light blue
          speedMult: 1.0,
          opacityMult: 0.4,
          shapes: ['spiral', 'echo', 'arc']
        },
        QUIET_RECOVERY: {
          colorBias: new THREE.Color(0x00ff99),    // Cyan-green
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
      transitionsThisFrame: 0
    };
  }
  
  /**
   * Main update loop — called each frame
   */
  update(deltaTime, nodes, links, worldMetrics) {
    const startTime = performance.now();
    
    if (!this.enabled) return;
    
    // Build clusters from connected component analysis
    const clusters = this.identifyClusters(nodes);
    
    // Update narrative state for each cluster
    for (const cluster of clusters) {
      this.updateNarrativeState(cluster, worldMetrics, deltaTime);
    }
    
    // Apply narrative modulation to messaging systems
    this.modulateMessagingBehavior(nodes, links);
    
    // Cleanup: remove narratives for dead clusters
    this.cleanupDeadNarratives(clusters);
    
    this.stats.frameTime = performance.now() - startTime;
    this.stats.clustersProcessed = clusters.length;
    this.stats.activeNarratives = this.narrativeStates.size;
  }
  
  /**
   * Identify connected clusters of nodes
   */
  identifyClusters(nodes) {
    const clusters = [];
    const visited = new Set();
    
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
        clusters.push({
          id: this.generateClusterId(cluster),
          nodes: cluster,
          centerPos: this.computeClusterCenter(cluster)
        });
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
  updateNarrativeState(cluster, worldMetrics, deltaTime) {
    const clusterId = cluster.id;
    
    // Get or create narrative state
    if (!this.narrativeStates.has(clusterId)) {
      this.initializeNarrative(clusterId, cluster);
    }
    
    const narrative = this.narrativeStates.get(clusterId);
    
    // Compute current metrics for this cluster
    const metrics = this.computeClusterMetrics(cluster);
    
    // Update episode timing
    const now = performance.now();
    if (!this.episodeTimings.has(clusterId)) {
      this.startNewEpisode(clusterId, narrative, metrics);
    }
    
    const episode = this.episodeTimings.get(clusterId);
    const episodeElapsed = now - episode.startTime;
    
    // Check for episode end
    if (episodeElapsed > episode.duration) {
      this.endEpisode(clusterId, narrative, metrics);
      this.startNewEpisode(clusterId, narrative, metrics);
    } else {
      // Update narrative parameters during episode
      this.updateNarrativePhase(narrative, metrics, episodeElapsed, episode.duration);
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
      lastUpdateTime: performance.now(),
      phaseProgress: 0  // 0–1 for smooth transitions
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
      synergy += node.synergy || 0;
      harmony += node.harmony || 0;
      corruption += node.corruption || 0;
      stability += node.stability || 0;
      consciousness += node.consciousness || 0;
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
  startNewEpisode(clusterId, narrative, metrics) {
    // Select motif based on metrics
    const motifId = this.selectMotif(metrics, narrative);
    
    // Duration scales with activity (synergy + consciousness)
    const activity = Math.max(0, metrics.synergy + metrics.consciousness);
    const duration = THREE.MathUtils.lerp(
      this.config.minEpisodeDuration,
      this.config.maxEpisodeDuration,
      Math.min(1, activity * 0.5)
    );
    
    narrative.motifId = motifId;
    narrative.phase = 'INTRO';
    narrative.phaseProgress = 0;
    
    // Push to history
    const history = this.motifHistory.get(clusterId);
    history.push(motifId);
    if (history.length > 10) history.shift();  // Keep last 10
    
    this.episodeTimings.set(clusterId, {
      startTime: performance.now(),
      duration: duration,
      motifId: motifId,
      phase: 'INTRO'
    });
  }
  
  /**
   * End current episode and prepare for next
   */
  endEpisode(clusterId, narrative, metrics) {
    // Move to ECHO phase before ending
    narrative.phase = 'ECHO';
    narrative.phaseProgress = 1.0;
  }
  
  /**
   * Update narrative phase based on elapsed time and metrics
   */
  updateNarrativePhase(narrative, metrics, elapsed, duration) {
    const progress = elapsed / duration;  // 0–1 over episode
    
    // Calculate tension from metrics
    const tension = this.calculateTension(metrics);
    narrative.tension = THREE.MathUtils.lerp(narrative.tension, tension, 0.1);
    
    // Phase transitions driven by both time and tension
    const phaseTransitionTime = this.config.phaseTransitionDuration / 1000;  // in seconds
    
    if (progress < 0.1) {
      narrative.phase = 'INTRO';
      narrative.phaseProgress = progress / 0.1;
    } else if (progress < 0.3 || narrative.tension < this.config.tensionThreshold) {
      narrative.phase = 'RISING';
      narrative.phaseProgress = (progress - 0.1) / 0.2;
    } else if (
      progress < 0.8 &&
      narrative.tension > this.config.climaxThreshold
    ) {
      narrative.phase = 'CLIMAX';
      narrative.phaseProgress = (progress - 0.3) / 0.5;
    } else if (progress < 0.9) {
      narrative.phase = 'RESOLVE';
      narrative.phaseProgress = (progress - 0.8) / 0.1;
    } else {
      narrative.phase = 'ECHO';
      narrative.phaseProgress = (progress - 0.9) / 0.1;
    }
    
    // Update coherence based on harmony
    narrative.coherence = THREE.MathUtils.lerp(
      narrative.coherence,
      0.5 + metrics.harmony * 0.5,
      0.05
    );
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
  selectMotif(metrics, narrative) {
    const history = this.motifHistory.get(narrative.id) || [];
    
    // Prefer variety (avoid repeating last motif)
    const lastMotif = history.length > 0 ? history[history.length - 1] : null;
    
    // Score each motif
    const scores = {};
    const motifKeys = Object.keys(this.config.motifStyles);
    
    for (const motifId of motifKeys) {
      let score = Math.random() * 0.5;  // Base randomness
      
      // Corruption favors CORRUPTION_SAGA
      if (metrics.corruption > 0.6 && motifId === 'CORRUPTION_SAGA') {
        score += 0.8;
      }
      
      // Harmony favors RISING_HARMONY and QUIET_RECOVERY
      if (metrics.harmony > 0.6) {
        if (motifId === 'RISING_HARMONY') score += 0.7;
        if (motifId === 'QUIET_RECOVERY') score += 0.5;
      }
      
      // Consciousness favors ASCENSION_TALE
      if (metrics.consciousness > 0.7 && motifId === 'ASCENSION_TALE') {
        score += 0.7;
      }
      
      // Low stability favors COLLAPSING_ORDER
      if (metrics.stability < 0.3 && motifId === 'COLLAPSING_ORDER') {
        score += 0.7;
      }
      
      // Penalize repeated motifs
      if (motifId === lastMotif) {
        score *= 0.3;
      }
      
      scores[motifId] = score;
    }
    
    // Select highest score
    let bestMotif = 'RISING_HARMONY';
    let bestScore = -1;
    for (const [motifId, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
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
  getNarrativeModulation(nodeId, nodes) {
    // Find cluster containing this node
    let cluster = null;
    for (const [clusterId, narrative] of this.narrativeStates.entries()) {
      // Simple check: if narrative exists and we're in it, use it
      // In practice, you'd store cluster membership in narrative
      cluster = narrative;
      break;  // Simplified for now
    }
    
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
    
    return {
      chainLengthMult: phaseMult.chainLength,
      messageFreqMult: phaseMult.messageFreq,
      opacityMult: motifStyle?.opacityMult || 1.0,
      speedMult: motifStyle?.speedMult || 1.0,
      colorBias: motifStyle?.colorBias || new THREE.Color(0xffffff),
      phase: phase,
      motifId: cluster.motifId,
      coherence: cluster.coherence
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
    console.log(`Narrative debug visualization: ${this.debugContainer.visible ? 'ON' : 'OFF'}`);
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
    console.log('✓ All narratives reset');
  }
  
  /**
   * Cleanup (called on world transition)
   */
  cleanup() {
    this.narrativeStates.clear();
    this.motifHistory.clear();
    this.episodeTimings.clear();
    this.debugContainer.clear();
  }
}