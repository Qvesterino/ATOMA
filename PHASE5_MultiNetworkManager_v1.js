/**
 * PHASE 5: MULTI-NETWORK MANAGER v1.0 (Session 40)
 * 
 * Central coordination point for multiple network instances
 * 
 * Purpose: Orchestrate multiple AI networks interacting with each other
 * - Register and track multiple independent networks
 * - Synchronize state across networks
 * - Manage inter-network communication
 * - Coordinate cross-network events
 * 
 * Zero gameplay logic changes — purely coordination layer
 */

export class PHASE5_MultiNetworkManager {
  constructor(config = {}) {
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      maxNetworks: config.maxNetworks ?? 10,
      
      // Synchronization settings
      syncInterval: config.syncInterval ?? 100,          // ms between syncs
      maxNetworkDistance: config.maxNetworkDistance ?? 50, // units for inter-network range
      
      // Event propagation
      enableEventPropagation: config.enableEventPropagation ?? true,
      eventPropagationDelay: config.eventPropagationDelay ?? 50 // ms delay
    };
    
    // Network registry
    this.networks = new Map();        // networkId → network instance
    this.networkMetadata = new Map(); // networkId → {name, position, state, metrics}
    
    // Inter-network connections
    this.networkConnections = [];     // Array of {sourceNetworkId, targetNetworkId, strength}
    this.networkProximityIndex = new Map(); // spatially indexed networks
    
    // Event system
    this.eventQueue = [];             // Events pending propagation
    this.eventHistory = [];           // Historical events
    this.eventCallbacks = [];         // Observer callbacks
    
    // Performance monitoring
    this.stats = {
      networksRegistered: 0,
      networksActive: 0,
      totalSyncOperations: 0,
      totalEventsPropagated: 0,
      lastSyncTime: Date.now(),
      syncDuration: 0
    };
    
    // Synchronization state
    this.lastSyncTime = Date.now();
    this.syncTimer = null;
  }
  
  /**
   * Register a new network instance
   * @param {string} networkId - Unique identifier for network
   * @param {Object} network - Network instance (contains aiNodes, linkingSystem, etc)
   * @param {Object} metadata - Network metadata (name, position, etc)
   */
  registerNetwork(networkId, network, metadata = {}) {
    if (this.networks.size >= this.config.maxNetworks) {
      console.warn('[PHASE5_MultiNetworkManager] Max networks reached:', this.config.maxNetworks);
      return false;
    }
    
    if (this.networks.has(networkId)) {
      console.warn('[PHASE5_MultiNetworkManager] Network already registered:', networkId);
      return false;
    }
    
    try {
      // Register network
      this.networks.set(networkId, network);
      
      // Store metadata
      this.networkMetadata.set(networkId, {
        id: networkId,
        name: metadata.name ?? `Network_${networkId}`,
        position: metadata.position ?? { x: 0, y: 0, z: 0 },
        state: 'initialized',
        metrics: {
          nodeCount: network.aiNodes?.nodes?.length ?? 0,
          linkCount: network.linkingSystem?.links?.length ?? 0,
          corruptionLevel: 0,
          harmonyLevel: 0,
          lastUpdateTime: Date.now()
        },
        createdAt: Date.now()
      });
      
      this.stats.networksRegistered++;
      this.stats.networksActive++;
      
      if (this.config.enableLogging) {
        console.log(`[PHASE5_MultiNetworkManager] Network registered: ${networkId} (Total: ${this.stats.networksRegistered})`);
      }
      
      // Trigger event
      this.emitEvent({
        type: 'networkRegistered',
        networkId,
        timestamp: Date.now()
      });
      
      return true;
    } catch (err) {
      console.error('[PHASE5_MultiNetworkManager] Register error:', err);
      return false;
    }
  }
  
  /**
   * Unregister a network
   */
  unregisterNetwork(networkId) {
    if (!this.networks.has(networkId)) {
      return false;
    }
    
    try {
      this.networks.delete(networkId);
      this.networkMetadata.delete(networkId);
      
      // Remove connections
      this.networkConnections = this.networkConnections.filter(
        conn => conn.sourceNetworkId !== networkId && conn.targetNetworkId !== networkId
      );
      
      this.stats.networksActive--;
      
      if (this.config.enableLogging) {
        console.log(`[PHASE5_MultiNetworkManager] Network unregistered: ${networkId}`);
      }
      
      return true;
    } catch (err) {
      console.error('[PHASE5_MultiNetworkManager] Unregister error:', err);
      return false;
    }
  }
  
  /**
   * Create a connection between two networks
   * Allows corruption/harmony to spread between them
   */
  connectNetworks(sourceNetworkId, targetNetworkId, strength = 0.5) {
    if (!this.networks.has(sourceNetworkId) || !this.networks.has(targetNetworkId)) {
      console.warn('[PHASE5_MultiNetworkManager] Invalid network IDs for connection');
      return false;
    }
    
    if (sourceNetworkId === targetNetworkId) {
      console.warn('[PHASE5_MultiNetworkManager] Cannot connect network to itself');
      return false;
    }
    
    // Check if connection already exists
    const exists = this.networkConnections.some(
      conn => conn.sourceNetworkId === sourceNetworkId && conn.targetNetworkId === targetNetworkId
    );
    
    if (exists) {
      return false;
    }
    
    try {
      this.networkConnections.push({
        sourceNetworkId,
        targetNetworkId,
        strength: Math.min(Math.max(strength, 0), 1),
        createdAt: Date.now(),
        lastTransferTime: Date.now(),
        totalTransferred: 0
      });
      
      if (this.config.enableLogging) {
        console.log(`[PHASE5_MultiNetworkManager] Networks connected: ${sourceNetworkId} → ${targetNetworkId} (strength: ${strength})`);
      }
      
      this.emitEvent({
        type: 'networkConnected',
        sourceNetworkId,
        targetNetworkId,
        strength,
        timestamp: Date.now()
      });
      
      return true;
    } catch (err) {
      console.error('[PHASE5_MultiNetworkManager] Connect error:', err);
      return false;
    }
  }
  
  /**
   * Disconnect two networks
   */
  disconnectNetworks(sourceNetworkId, targetNetworkId) {
    const initialLength = this.networkConnections.length;
    
    this.networkConnections = this.networkConnections.filter(
      conn => !(conn.sourceNetworkId === sourceNetworkId && conn.targetNetworkId === targetNetworkId)
    );
    
    if (this.networkConnections.length < initialLength) {
      if (this.config.enableLogging) {
        console.log(`[PHASE5_MultiNetworkManager] Networks disconnected: ${sourceNetworkId} → ${targetNetworkId}`);
      }
      return true;
    }
    
    return false;
  }
  
  /**
   * Get network by ID
   */
  getNetwork(networkId) {
    return this.networks.get(networkId);
  }
  
  /**
   * Get metadata for a network
   */
  getNetworkMetadata(networkId) {
    return this.networkMetadata.get(networkId);
  }
  
  /**
   * Get all networks
   */
  getAllNetworks() {
    return Array.from(this.networks.entries()).map(([id, network]) => ({
      id,
      network,
      metadata: this.networkMetadata.get(id)
    }));
  }
  
  /**
   * Get all connections
   */
  getConnections() {
    return [...this.networkConnections];
  }
  
  /**
   * Get outbound connections from a network
   */
  getOutboundConnections(networkId) {
    return this.networkConnections.filter(conn => conn.sourceNetworkId === networkId);
  }
  
  /**
   * Get inbound connections to a network
   */
  getInboundConnections(networkId) {
    return this.networkConnections.filter(conn => conn.targetNetworkId === networkId);
  }
  
  /**
   * Synchronize state across all networks
   * Call once per frame from main loop
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;

    const syncStartTime = Date.now();
    
    try {
      // Update network metrics
      for (const [networkId, network] of this.networks) {
        this.updateNetworkMetrics(networkId, network);
      }
      
      // Process queued events
      if (this.config.enableEventPropagation) {
        this.processEventQueue();
      }
      
      this.stats.totalSyncOperations++;
      this.stats.lastSyncTime = Date.now();
      this.stats.syncDuration = Date.now() - syncStartTime;
      
    } catch (err) {
      console.warn('[PHASE5_MultiNetworkManager] Update error:', err);
    }
  }
  
  /**
   * Update metrics for a network
   */
  updateNetworkMetrics(networkId, network) {
    const metadata = this.networkMetadata.get(networkId);
    if (!metadata) return;
    
    try {
      // Update basic metrics
      metadata.metrics.nodeCount = network.aiNodes?.nodes?.length ?? 0;
      metadata.metrics.linkCount = network.linkingSystem?.links?.length ?? 0;
      metadata.metrics.lastUpdateTime = Date.now();
      
      // Compute aggregate corruption/harmony
      if (network.aiNodes?.nodes) {
        let totalCorruption = 0;
        let totalHarmony = 0;
        
        for (const node of network.aiNodes.nodes) {
          totalCorruption += node.userData?.metrics?.corruption ?? 0;
          totalHarmony += node.userData?.harmonyLevel ?? 0;
        }
        
        const nodeCount = network.aiNodes.nodes.length || 1;
        metadata.metrics.corruptionLevel = totalCorruption / nodeCount;
        metadata.metrics.harmonyLevel = totalHarmony / nodeCount;
      }
      
      if (network.linkingSystem?.links) {
        let totalLinkCorruption = 0;
        
        for (const link of network.linkingSystem.links) {
          totalLinkCorruption += link.userData?.corruptionLevel ?? 0;
        }
        
        const linkCount = network.linkingSystem.links.length || 1;
        metadata.metrics.linkCorruptionLevel = totalLinkCorruption / linkCount;
      }
      
    } catch (err) {
      console.warn('[PHASE5_MultiNetworkManager] Metrics update error:', err);
    }
  }
  
  /**
   * Process queued events for propagation
   */
  processEventQueue() {
    // Implementation will be in inter-network corruption bridge
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      
      try {
        this.emitEvent(event);
        this.stats.totalEventsPropagated++;
        this.eventHistory.push(event);
      } catch (err) {
        console.warn('[PHASE5_MultiNetworkManager] Event processing error:', err);
      }
    }
  }
  
  /**
   * Queue an event for propagation
   */
  queueEvent(event) {
    this.eventQueue.push({
      ...event,
      queuedAt: Date.now()
    });
  }
  
  /**
   * Emit an event to all listeners
   */
  emitEvent(event) {
    for (const callback of this.eventCallbacks) {
      try {
        callback(event);
      } catch (err) {
        console.warn('[PHASE5_MultiNetworkManager] Event callback error:', err);
      }
    }
  }
  
  /**
   * Register event callback
   */
  on(callback) {
    this.eventCallbacks.push(callback);
  }
  
  /**
   * Unregister event callback
   */
  off(callback) {
    const index = this.eventCallbacks.indexOf(callback);
    if (index >= 0) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * Register callback for network registration events
   */
  onNetworkRegistered(callback) {
    // Store callback for network registration events
    this._networkRegisteredCallbacks = this._networkRegisteredCallbacks || [];

    // Wrap to emit as standard event
    const wrapped = (event) => {
      if (event.type === 'networkRegistered') {
        callback(event.networkId, this.networks.get(event.networkId), this.networkMetadata.get(event.networkId));
      }
    };

    this.eventCallbacks.push(wrapped);
    this._networkRegisteredCallbacks.push(wrapped);

    // Return unsubscribe function
    return () => {
      const idx = this._networkRegisteredCallbacks.indexOf(wrapped);
      if (idx >= 0) {
        this._networkRegisteredCallbacks.splice(idx, 1);
      }
      const cbIdx = this.eventCallbacks.indexOf(wrapped);
      if (cbIdx >= 0) {
        this.eventCallbacks.splice(cbIdx, 1);
      }
    };
  }

  /**
   * Register callback for connection creation events
   */
  onConnectionCreated(callback) {
    // Store callback for connection events
    this._connectionCreatedCallbacks = this._connectionCreatedCallbacks || [];

    // Wrap to emit as standard event
    const wrapped = (event) => {
      if (event.type === 'networkConnected') {
        const connection = this.networkConnections.find(c =>
          c.sourceNetworkId === event.sourceNetworkId && c.targetNetworkId === event.targetNetworkId
        );
        callback(connection || event);
      }
    };

    this.eventCallbacks.push(wrapped);
    this._connectionCreatedCallbacks.push(wrapped);

    // Return unsubscribe function
    return () => {
      const idx = this._connectionCreatedCallbacks.indexOf(wrapped);
      if (idx >= 0) {
        this._connectionCreatedCallbacks.splice(idx, 1);
      }
      const cbIdx = this.eventCallbacks.indexOf(wrapped);
      if (cbIdx >= 0) {
        this.eventCallbacks.splice(cbIdx, 1);
      }
    };
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      networkCount: this.networks.size,
      connectionCount: this.networkConnections.length,
      eventQueueLength: this.eventQueue.length,
      eventHistoryLength: this.eventHistory.length
    };
  }
  
  /**
   * Clear all networks and connections
   */
  clear() {
    this.networks.clear();
    this.networkMetadata.clear();
    this.networkConnections = [];
    this.eventQueue = [];
    this.stats.networksActive = 0;
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.clear();
    this.eventCallbacks = [];
    this._networkRegisteredCallbacks = [];
    this._connectionCreatedCallbacks = [];
  }
}

export default PHASE5_MultiNetworkManager;
