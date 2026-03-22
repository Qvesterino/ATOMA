/**
 * PHASE 5: INTER-NETWORK VISUALIZATION BRIDGE v1.0
 * 
 * Orchestrates connection between PHASE5 multi-network systems and visual display
 * 
 * Purpose: Wire multi-network state into inter-network connection visuals
 * - Subscribe to network registration events
 * - Subscribe to connection creation events
 * - Synchronize visual state with network health metrics
 * - Maintain performance within frame budget (target: <0.5ms)
 * 
 * Read-only consumer of multi-network state
 */

import * as THREE from 'three';

export class PHASE5_InterNetworkVisualizationBridge {
  constructor(
    multiNetworkManager,
    corruptionBridge,
    connectionVisuals,
    config = {}
  ) {
    // FIX 3: Always initialize all properties; connectionVisuals is optional
    this.multiNetworkManager = multiNetworkManager;
    this.corruptionBridge = corruptionBridge;
    this.connectionVisuals = connectionVisuals || null;

    if (!connectionVisuals) {
      console.warn('[PHASE5_InterNetworkVisualizationBridge] connectionVisuals not provided — bridge will operate in data-only mode.');
    }
    
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Update timing
      syncInterval: config.syncInterval ?? 32,  // ms between syncs (30 FPS)
      prioritizeCorruptionFlow: config.prioritizeCorruptionFlow ?? true,
      
      // Visual update limits
      maxVisualUpdatesPerFrame: config.maxVisualUpdatesPerFrame ?? 10
    };
    
    // State tracking
    this.networkPositions = new Map();         // networkId → position
    this.lastSyncTime = Date.now();
    this.syncDueTime = Date.now();
    
    // Event subscribers
    this.eventSubscriptions = [];
    
    // Performance monitoring
    this.stats = {
      totalSyncs: 0,
      totalUpdates: 0,
      lastSyncDuration: 0,
      networksSynced: 0,
      connectionsSynced: 0
    };
    
    this.setupEventListeners();
    this.setupConsoleAPI();
  }
  
  /**
   * Setup event listeners from multi-network manager
   */
  setupEventListeners() {
    try {
      if (this.multiNetworkManager && this.multiNetworkManager.onNetworkRegistered) {
        const unsub = this.multiNetworkManager.onNetworkRegistered((networkId, network, metadata) => {
          this.handleNetworkRegistered(networkId, network, metadata);
        });
        // FIX 6: Store unsubscribe handle if provided
        if (typeof unsub === 'function') this.eventSubscriptions.push(unsub);
      }
      
      if (this.multiNetworkManager && this.multiNetworkManager.onConnectionCreated) {
        const unsub = this.multiNetworkManager.onConnectionCreated((connection) => {
          this.handleConnectionCreated(connection);
        });
        if (typeof unsub === 'function') this.eventSubscriptions.push(unsub);
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Event setup error:', err);
      }
    }
  }
  
  /**
   * Handle network registration event
   */
  handleNetworkRegistered(networkId, network, metadata) {
    try {
      // Store network position from metadata
      if (metadata && metadata.position) {
        this.networkPositions.set(networkId, metadata.position.clone());
      } else if (network && network.aiNodes && network.aiNodes.length > 0) {
        // Calculate average position from nodes if not provided
        const pos = this.calculateNetworkCenterPosition(network);
        this.networkPositions.set(networkId, pos);
      }
      
      if (this.config.enableLogging) {
        console.log(`[PHASE5_InterNetworkVisualizationBridge] Network registered: ${networkId}`);
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Network registration error:', err);
      }
    }
  }
  
  /**
   * Handle connection creation event
   */
  handleConnectionCreated(connection) {
    try {
      if (this.config.enableLogging) {
        console.log(
          `[PHASE5_InterNetworkVisualizationBridge] Connection created: ` +
          `${connection.sourceNetworkId} → ${connection.targetNetworkId}`
        );
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Connection creation error:', err);
      }
    }
  }
  
  /**
   * Update visuals based on current multi-network state
   * Call from main animation loop
   */
  update(deltaTime) {
    // FIX 1: Removed this.frameScheduler guard — frameScheduler is never assigned,
    // causing update() to always return immediately. Caller controls when to invoke update().

    const syncStart = Date.now();
    
    try {
      const now = Date.now();
      
      // Check if sync is due
      if (now - this.lastSyncTime < this.config.syncInterval) {
        return;
      }
      
      this.lastSyncTime = now;
      
      // Gather current state from multi-network manager
      const networks = this.gatherNetworkData();
      const connections = this.gatherConnectionData();
      
      // Update visuals
      if (this.connectionVisuals && this.connectionVisuals.sync) {
        this.connectionVisuals.sync(networks, connections);
      }
      
      // Update connection visual animations
      if (this.connectionVisuals && this.connectionVisuals.update) {
        this.connectionVisuals.update(deltaTime);
      }
      
      this.stats.totalSyncs++;
      this.stats.lastSyncDuration = Date.now() - syncStart;
      this.stats.networksSynced = networks.size;
      this.stats.connectionsSynced = connections.length;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Update error:', err);
      }
    }
  }
  
  /**
   * Gather network data for visualization
   */
  gatherNetworkData() {
    const networkData = new Map();
    
    try {
      if (!this.multiNetworkManager || !this.multiNetworkManager.networks) {
        return networkData;
      }
      
      for (const [networkId, network] of this.multiNetworkManager.networks) {
        try {
          // Get position (use stored or calculate)
          let position = this.networkPositions.get(networkId);
          if (!position && network && network.aiNodes) {
            position = this.calculateNetworkCenterPosition(network);
            this.networkPositions.set(networkId, position);
          }
          
          // Get metadata
          const metadata = this.multiNetworkManager.networkMetadata?.get(networkId) || {};
          
          networkData.set(networkId, {
            network: network,
            position: position || new THREE.Vector3(),
            metadata: metadata,
            name: metadata.name || `Network_${networkId}`
          });
          
        } catch (err) {
          if (this.config.enableDebug) {
            console.warn(
              `[PHASE5_InterNetworkVisualizationBridge] Error gathering data for network ${networkId}:`,
              err
            );
          }
        }
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Network data gathering error:', err);
      }
    }
    
    return networkData;
  }
  
  /**
   * Gather connection data for visualization
   */
  gatherConnectionData() {
    const connections = [];
    
    try {
      if (!this.multiNetworkManager || !this.multiNetworkManager.networkConnections) {
        return connections;
      }
      
      for (const connection of this.multiNetworkManager.networkConnections) {
        try {
          // Get source and target networks
          const sourceNetwork = this.multiNetworkManager.getNetwork(connection.sourceNetworkId);
          const targetNetwork = this.multiNetworkManager.getNetwork(connection.targetNetworkId);
          
          if (!sourceNetwork || !targetNetwork) {
            continue;
          }
          
          // Get corruption bridge transfer state if available
          const transferState = this.getConnectionTransferState(connection);
          
          connections.push({
            sourceNetworkId: connection.sourceNetworkId,
            targetNetworkId: connection.targetNetworkId,
            strength: connection.strength || 0.5,
            distance: connection.distance || 0,
            createdAt: connection.createdAt || Date.now(),
            transferState: transferState,
            isActive: this.isConnectionActive(connection)
          });
          
        } catch (err) {
          if (this.config.enableDebug) {
            console.warn(
              `[PHASE5_InterNetworkVisualizationBridge] Error processing connection:`,
              err
            );
          }
        }
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Connection data gathering error:', err);
      }
    }
    
    return connections;
  }
  
  /**
   * Get transfer state for a connection from corruption bridge
   */
  getConnectionTransferState(connection) {
    try {
      if (!this.corruptionBridge) {
        return null;
      }
      
      const connectionId = `${connection.sourceNetworkId}_${connection.targetNetworkId}`;
      const activeTransfer = this.corruptionBridge.activeTransfers?.get(connectionId);
      
      if (activeTransfer) {
        return {
          isTransferring: true,
          corruptionTransferred: activeTransfer.corruptionTransferred || 0,
          harmonyTransferred: activeTransfer.harmonyTransferred || 0,
          progress: activeTransfer.progress || 0
        };
      }
      
      return {
        isTransferring: false,
        corruptionTransferred: 0,
        harmonyTransferred: 0,
        progress: 0
      };
      
    } catch (err) {
      return null;
    }
  }
  
  /**
   * Check if a connection should be visually active
   */
  isConnectionActive(connection) {
    try {
      // FIX 4: Removed 10-second recency check — it caused all persistent connections
      // to go inactive after 10s. Active state is determined by strength alone.
      return (connection.strength ?? 0.5) >= 0.2;

    } catch (err) {
      return false;
    }
  }
  
  /**
   * Calculate network center position from its nodes
   */
  calculateNetworkCenterPosition(network) {
    const centerPos = new THREE.Vector3();
    
    try {
      if (!network || !network.aiNodes || network.aiNodes.length === 0) {
        return centerPos;
      }
      
      let validCount = 0;
      
      for (const node of network.aiNodes) {
        if (node && node.position) {
          centerPos.add(node.position);
          validCount++;
        }
      }
      
      if (validCount > 0) {
        centerPos.divideScalar(validCount);
      }
      
      return centerPos;
      
    } catch (err) {
      return centerPos;
    }
  }
  
  /**
   * Set network position manually (for layout purposes)
   */
  setNetworkPosition(networkId, position) {
    try {
      this.networkPositions.set(networkId, position.clone());
      
      if (this.config.enableLogging) {
        console.log(
          `[PHASE5_InterNetworkVisualizationBridge] Network position set: ${networkId} → `,
          position
        );
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Position setting error:', err);
      }
    }
  }
  
  /**
   * Get performance stats
   */
  getStats() {
    return {
      ...this.stats,
      lastSyncDuration: `${this.stats.lastSyncDuration.toFixed(2)}ms`,
      averageSyncDuration: this.stats.totalSyncs > 0 
        ? `${(this.stats.lastSyncDuration / this.stats.totalSyncs).toFixed(2)}ms`
        : 'N/A'
    };
  }
  
  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    if (typeof window !== 'undefined') {
      window.PHASE5_InterNetworkVisualizationBridge_API = {
        getStats: () => this.getStats(),
        toggleDebug: () => { this.config.enableDebug = !this.config.enableDebug; },
        setNetworkPosition: (networkId, x, y, z) => {
          this.setNetworkPosition(networkId, new THREE.Vector3(x, y, z));
        }
      };
    }
  }

  /**
   * FIX 5: Dispose — clean up for world switch survival
   */
  dispose() {
    // Unsubscribe from all events
    for (const unsub of this.eventSubscriptions) {
      try { unsub(); } catch (_) {}
    }
    this.eventSubscriptions = [];

    // Clear maps
    this.networkPositions.clear();

    // Remove window API
    if (typeof window !== 'undefined') {
      delete window.PHASE5_InterNetworkVisualizationBridge_API;
    }

    // Nullify references
    this.multiNetworkManager = null;
    this.corruptionBridge = null;
    this.connectionVisuals = null;
  }
}
