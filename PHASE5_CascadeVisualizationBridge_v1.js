/**
 * PHASE 5: CASCADE VISUALIZATION BRIDGE v1.0
 * 
 * Orchestrates connection between corruption systems and cascade visuals
 * 
 * Purpose: Wire cascade events into visual rendering
 * - Subscribe to LinkCorruptionTransmission cascade events
 * - Monitor AINodes for cascade-triggering corruption spreads
 * - Forward cascade data to visual effects system
 * - Track cascade history for debugging
 * - Maintain performance within frame budget
 * 
 * Read-only consumer of corruption system state
 */

export class PHASE5_CascadeVisualizationBridge {
  constructor(
    aiNodes,
    linkCorruptionTransmission,
    cascadePropagationVisuals,
    config = {}
  ) {
    this.aiNodes = aiNodes;
    this.linkCorruptionTransmission = linkCorruptionTransmission;
    this.cascadePropagationVisuals = cascadePropagationVisuals;
    this.semanticBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
    
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Cascade detection thresholds
      corruptionCascadeThreshold: config.corruptionCascadeThreshold ?? 0.7,
      threatCascadeThreshold: config.threatCascadeThreshold ?? 0.5,
      harmonyCascadeThreshold: config.harmonyCascadeThreshold ?? 0.8,
      
      // Event tracking
      maxEventHistory: config.maxEventHistory ?? 100,
      enableEventTracking: config.enableEventTracking ?? true
    };
    
    // State tracking
    this.lastProcessedCascadeIndex = 0;
    this.cascadeEventQueue = [];
    this.processedCascadeIds = new Set();
    
    // Performance monitoring
    this.stats = {
      cascadesDetected: 0,
      cascadesVisualized: 0,
      corruptionCascades: 0,
      harmonyCascades: 0,
      threatCascades: 0,
      lastBridgeUpdateDuration: 0,
      eventQueueSize: 0
    };
    
    // Cascade history for debugging
    this.cascadeHistory = [];
    this._semanticUnsubscribers = [];
    this._eventRefreshRequested = false;
    
    // Subscribe to systems
    this.subscribeToEvents();
    
    // Console API
    this.setupConsoleAPI();
  }
  
  /**
   * Subscribe to cascade events from corruption systems
   */
  subscribeToEvents() {
    try {
      // Get initial reference to corruption system
      if (this.linkCorruptionTransmission) {
        if (this.config.enableLogging) {
          console.log('[PHASE5_CascadeVisualizationBridge] Subscribed to LinkCorruptionTransmission');
        }
      }

      if (this.semanticBus && typeof this.semanticBus.subscribe === 'function') {
        const requestRefresh = () => {
          this._eventRefreshRequested = true;
        };

        const unsubMetric = this.semanticBus.subscribe('metric.node.updated', requestRefresh);
        const unsubLink = this.semanticBus.subscribe('link.created', requestRefresh);
        const unsubSpawn = this.semanticBus.subscribe('node.spawned', requestRefresh);

        if (typeof unsubMetric === 'function') this._semanticUnsubscribers.push(unsubMetric);
        if (typeof unsubLink === 'function') this._semanticUnsubscribers.push(unsubLink);
        if (typeof unsubSpawn === 'function') this._semanticUnsubscribers.push(unsubSpawn);
      }
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Subscription error:', err);
      }
    }
  }
  
  /**
   * Update cascade detection and visualization
   * Call from main animation loop
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const updateStart = Date.now();
    
    try {
      // Check for new cascade events
      this.checkCascadeEvents();
      if (this._eventRefreshRequested) {
        this.checkCascadeEvents();
        this._eventRefreshRequested = false;
      }
      
      // Process queued cascade events
      this.processQueuedCascades();
      
      // Update cascade history (keep trim)
      if (this.cascadeHistory.length > this.config.maxEventHistory) {
        this.cascadeHistory.shift();
      }
      
      this.stats.lastBridgeUpdateDuration = Date.now() - updateStart;
      this.stats.eventQueueSize = this.cascadeEventQueue.length;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Update error:', err);
      }
    }
  }
  
  /**
   * Check LinkCorruptionTransmission for cascade events
   */
  checkCascadeEvents() {
    try {
      if (!this.linkCorruptionTransmission) return;
      
      // Get cascade history
      let cascadeHistory = [];
      if (typeof this.linkCorruptionTransmission.getCascadeHistory === 'function') {
        cascadeHistory = this.linkCorruptionTransmission.getCascadeHistory() || [];
      }
      
      // Process new cascades
      for (let i = this.lastProcessedCascadeIndex; i < cascadeHistory.length; i++) {
        const cascade = cascadeHistory[i];
        this.queueCascadeEvent(cascade);
      }
      
      this.lastProcessedCascadeIndex = cascadeHistory.length;
      
      // Also check for threat cascades
      let threatHistory = [];
      if (typeof this.linkCorruptionTransmission.getThreatCascadeHistory === 'function') {
        threatHistory = this.linkCorruptionTransmission.getThreatCascadeHistory() || [];
      }
      
      // Process threat cascades
      for (const threat of threatHistory) {
        this.queueCascadeEvent(threat);
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Cascade check error:', err);
      }
    }
  }
  
  /**
   * Queue a cascade event for processing
   */
  queueCascadeEvent(cascadeData) {
    try {
      if (!cascadeData) return;
      
      // Generate unique ID to avoid duplicates
      const cascadeId = `${cascadeData.timestamp}_${cascadeData.sourceNode?.id || Math.random()}`;
      
      if (this.processedCascadeIds.has(cascadeId)) {
        return; // Already processed
      }
      
      this.processedCascadeIds.add(cascadeId);
      
      // Queue for processing
      this.cascadeEventQueue.push({
        cascadeId: cascadeId,
        data: cascadeData,
        queuedAt: Date.now(),
        visualized: false
      });
      
      this.stats.cascadesDetected++;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Queue error:', err);
      }
    }
  }
  
  /**
   * Process queued cascade events into visuals
   */
  processQueuedCascades() {
    try {
      while (this.cascadeEventQueue.length > 0) {
        const event = this.cascadeEventQueue.shift();
        this.visualizeCascade(event.data);
        event.visualized = true;
        this.stats.cascadesVisualized++;
      }
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Process queue error:', err);
      }
    }
  }
  
  /**
   * Convert cascade data into visual effects
   */
  visualizeCascade(cascadeData) {
    try {
      if (!cascadeData || !this.cascadePropagationVisuals) return;
      
      // Extract cascade information
      const sourceNode = cascadeData.sourceNode;
      const affectedNodes = cascadeData.affectedNodes || [];
      const strength = cascadeData.strength || 1.0;
      const depth = cascadeData.depth || 0;
      
      // Determine cascade type
      let cascadeType = 'corruption';
      if (cascadeData.cascadeType) {
        cascadeType = cascadeData.cascadeType;
      } else if (cascadeData.isHealingCascade) {
        cascadeType = 'harmony';
      } else if (cascadeData.isThreatCascade) {
        cascadeType = 'threat';
      }
      
      // Get source position
      let sourcePosition = null;
      if (sourceNode && sourceNode.position) {
        sourcePosition = sourceNode.position;
      }
      
      if (!sourcePosition) {
        return; // Can't visualize without position
      }
      
      // Track statistics
      switch (cascadeType) {
        case 'corruption':
          this.stats.corruptionCascades++;
          break;
        case 'harmony':
          this.stats.harmonyCascades++;
          break;
        case 'threat':
          this.stats.threatCascades++;
          break;
      }
      
      // Create visual cascade
      this.cascadePropagationVisuals.triggerCascade({
        sourceNodeId: sourceNode?.id || 'unknown',
        sourcePosition: sourcePosition,
        cascadeType: cascadeType,
        cascadeStrength: strength,
        depth: depth,
        targetNodes: affectedNodes
      });
      
      // Track in history
      if (this.config.enableEventTracking) {
        this.cascadeHistory.push({
          timestamp: Date.now(),
          cascadeType: cascadeType,
          sourceNode: sourceNode?.id,
          affectedCount: affectedNodes.length,
          strength: strength,
          depth: depth
        });
      }
      
      if (this.config.enableLogging) {
        console.log(
          `[PHASE5_CascadeVisualizationBridge] Visualized ${cascadeType} cascade ` +
          `(strength: ${strength.toFixed(2)}, depth: ${depth}, affected: ${affectedNodes.length})`
        );
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Visualization error:', err);
      }
    }
  }
  
  /**
   * Manually trigger cascade visualization (for testing)
   */
  manuallyTriggerCascade(sourceNode, cascadeType = 'corruption', strength = 1.0) {
    try {
      if (!sourceNode || !sourceNode.position) return;
      
      // Find affected nodes (nearby nodes)
      const affectedNodes = this.findNearbyNodes(sourceNode, 3);
      
      this.visualizeCascade({
        sourceNode: sourceNode,
        affectedNodes: affectedNodes,
        cascadeType: cascadeType,
        strength: strength,
        depth: 0,
        timestamp: Date.now()
      });
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Manual trigger error:', err);
      }
    }
  }
  
  /**
   * Find nearby nodes (within hop distance)
   */
  findNearbyNodes(sourceNode, maxDepth = 2) {
    const nearby = [];
    const visited = new Set();
    const queue = [{ node: sourceNode, depth: 0 }];
    
    try {
      while (queue.length > 0) {
        const { node, depth } = queue.shift();
        
        if (depth > maxDepth || visited.has(node.id)) {
          continue;
        }
        
        visited.add(node.id);
        if (depth > 0) {
          nearby.push(node);
        }
        
        // Find connected nodes
        if (this.aiNodes && this.aiNodes.nodes) {
          for (const otherNode of this.aiNodes.nodes) {
            if (otherNode && otherNode.id !== node.id && !visited.has(otherNode.id)) {
              // Check if connected
              const dist = node.position.distanceTo(otherNode.position);
              if (dist < 30) { // Arbitrary connection radius
                queue.push({ node: otherNode, depth: depth + 1 });
              }
            }
          }
        }
      }
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Nearby nodes error:', err);
      }
    }
    
    return nearby;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      eventQueueSize: this.cascadeEventQueue.length,
      processedCascadeCount: this.processedCascadeIds.size,
      historySize: this.cascadeHistory.length,
      recentCascades: this.cascadeHistory.slice(-10)
    };
  }
  
  /**
   * Clear state
   */
  clear() {
    try {
      this.cascadeEventQueue = [];
      this.processedCascadeIds.clear();
      this.cascadeHistory = [];
      this.lastProcessedCascadeIndex = 0;
      this._eventRefreshRequested = false;
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Clear error:', err);
      }
    }
  }
  
  /**
   * Setup console API
   */
  setupConsoleAPI() {
    if (typeof window !== 'undefined') {
      window.PHASE5_CascadeVisualizationBridge_API = {
        getStats: () => this.getStats(),
        toggleDebug: () => { this.config.enableDebug = !this.config.enableDebug; },
        manualTrigger: (cascadeType = 'corruption', strength = 1.0) => {
          if (this.aiNodes && this.aiNodes.nodes && this.aiNodes.nodes.length > 0) {
            const node = this.aiNodes.nodes[0];
            this.manuallyTriggerCascade(node, cascadeType, strength);
          }
        },
        clear: () => this.clear(),
        getRecentCascades: () => this.cascadeHistory.slice(-20)
      };
    }
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
