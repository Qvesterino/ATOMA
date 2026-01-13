/**
 * PHASE 5: NETWORK SYNCHRONIZATION v1.0 (Session 40)
 * 
 * Ensures consistency and synchronization across multiple networks
 * 
 * Purpose: Maintain data integrity when multiple networks interact
 * - Synchronize link/node state across connections
 * - Prevent state corruption from inter-network transfers
 * - Manage concurrent updates from multiple networks
 * - Handle conflict resolution
 * 
 * Pure synchronization layer — zero gameplay logic modifications
 */

export class PHASE5_NetworkSynchronization {
  constructor(multiNetworkManager, config = {}) {
    this.multiNetworkManager = multiNetworkManager;
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Sync frequency
      syncInterval: config.syncInterval ?? 500,          // ms
      maxSyncDuration: config.maxSyncDuration ?? 50,     // max ms per sync
      
      // Conflict resolution
      conflictResolutionMode: config.conflictResolutionMode ?? 'average', // 'average', 'conservative', 'aggressive'
      
      // State validation
      enableStateValidation: config.enableStateValidation ?? true,
      enableConflictDetection: config.enableConflictDetection ?? true
    };
    
    // Synchronization state
    this.lastSyncTime = Date.now();
    this.syncInProgress = false;
    
    // Conflict tracking
    this.conflicts = [];
    this.resolutions = [];
    
    // Performance monitoring
    this.stats = {
      syncOperations: 0,
      stateValidations: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      totalSyncTime: 0,
      lastSyncDuration: 0
    };
  }
  
  /**
   * Synchronize state across all connected networks
   */
  synchronize() {
    if (this.syncInProgress) {
      return;
    }
    
    const syncStart = Date.now();
    this.syncInProgress = true;
    
    try {
      // Get all network connections
      const connections = this.multiNetworkManager.getConnections();
      
      // Synchronize each connection
      for (const connection of connections) {
        this.synchronizeConnection(connection);
      }
      
      // Validate all network states
      if (this.config.enableStateValidation) {
        this.validateAllNetworkStates();
      }
      
      this.stats.syncOperations++;
      this.lastSyncTime = Date.now();
      this.stats.lastSyncDuration = Date.now() - syncStart;
      this.stats.totalSyncTime += this.stats.lastSyncDuration;
      
      if (this.config.enableLogging) {
        console.log(`[PHASE5_NetworkSynchronization] Sync completed in ${this.stats.lastSyncDuration}ms`);
      }
      
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Sync error:', err);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Synchronize a single connection between two networks
   */
  synchronizeConnection(connection) {
    const sourceNetwork = this.multiNetworkManager.getNetwork(connection.sourceNetworkId);
    const targetNetwork = this.multiNetworkManager.getNetwork(connection.targetNetworkId);
    
    if (!sourceNetwork || !targetNetwork) {
      return;
    }
    
    try {
      // Detect conflicts in state across the connection
      if (this.config.enableConflictDetection) {
        const conflicts = this.detectConflicts(sourceNetwork, targetNetwork, connection);
        
        if (conflicts.length > 0) {
          this.stats.conflictsDetected += conflicts.length;
          
          // Resolve conflicts
          for (const conflict of conflicts) {
            this.resolveConflict(conflict, sourceNetwork, targetNetwork);
          }
        }
      }
      
      // Synchronize link states
      this.synchronizeLinkStates(sourceNetwork, targetNetwork, connection);
      
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Connection sync error:', err);
    }
  }
  
  /**
   * Detect conflicts between two connected networks
   */
  detectConflicts(sourceNetwork, targetNetwork, connection) {
    const conflicts = [];
    
    try {
      // Check for nodes that exist in both networks
      const sourceNodeIds = new Set(sourceNetwork.aiNodes?.nodes?.map(n => n.userData?.id) ?? []);
      const targetNodeIds = new Set(targetNetwork.aiNodes?.nodes?.map(n => n.userData?.id) ?? []);
      
      // Find overlapping node IDs
      const overlap = new Set([...sourceNodeIds].filter(x => targetNodeIds.has(x)));
      
      if (overlap.size > 0) {
        // These shouldn't normally overlap, but check for state conflicts if they do
        for (const nodeId of overlap) {
          const sourceNode = sourceNetwork.aiNodes.nodes.find(n => n.userData?.id === nodeId);
          const targetNode = targetNetwork.aiNodes.nodes.find(n => n.userData?.id === nodeId);
          
          if (sourceNode && targetNode) {
            // Check for state conflicts
            const sourceCorruption = sourceNode.userData?.corruption ?? 0;
            const targetCorruption = targetNode.userData?.corruption ?? 0;
            
            if (Math.abs(sourceCorruption - targetCorruption) > 0.1) {
              conflicts.push({
                type: 'nodeCorruptionMismatch',
                nodeId,
                sourceNetworkId: connection.sourceNetworkId,
                targetNetworkId: connection.targetNetworkId,
                sourceValue: sourceCorruption,
                targetValue: targetCorruption
              });
            }
          }
        }
      }
      
      return conflicts;
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Conflict detection error:', err);
      return [];
    }
  }
  
  /**
   * Resolve a detected conflict
   */
  resolveConflict(conflict, sourceNetwork, targetNetwork) {
    try {
      const mode = this.config.conflictResolutionMode;
      
      if (conflict.type === 'nodeCorruptionMismatch') {
        const sourceNode = sourceNetwork.aiNodes.nodes.find(n => n.userData?.id === conflict.nodeId);
        const targetNode = targetNetwork.aiNodes.nodes.find(n => n.userData?.id === conflict.nodeId);
        
        if (!sourceNode || !targetNode) {
          return;
        }
        
        let resolvedValue;
        
        switch (mode) {
          case 'average':
            resolvedValue = (conflict.sourceValue + conflict.targetValue) / 2;
            break;
          
          case 'conservative':
            // Use the lower corruption value
            resolvedValue = Math.min(conflict.sourceValue, conflict.targetValue);
            break;
          
          case 'aggressive':
            // Use the higher corruption value
            resolvedValue = Math.max(conflict.sourceValue, conflict.targetValue);
            break;
          
          default:
            resolvedValue = conflict.sourceValue;
        }
        
        // Apply resolved value to both
        sourceNode.userData.corruption = resolvedValue;
        targetNode.userData.corruption = resolvedValue;
        
        this.resolutions.push({
          conflict,
          resolvedValue,
          mode,
          timestamp: Date.now()
        });
        
        this.stats.conflictsResolved++;
        
        if (this.config.enableDebug) {
          console.log(`[PHASE5_NetworkSynchronization] Resolved conflict: ${conflict.type} (${mode})`);
        }
      }
      
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Conflict resolution error:', err);
    }
  }
  
  /**
   * Synchronize link states across networks
   */
  synchronizeLinkStates(sourceNetwork, targetNetwork, connection) {
    try {
      // This synchronizes metadata about links that may be affected by cross-network corruption
      if (sourceNetwork.linkingSystem?.links && targetNetwork.linkingSystem?.links) {
        // Links are typically isolated per network, but we can sync aggregate metrics
        const sourceAvgCorruption = this.getAverageLinkCorruption(sourceNetwork);
        const targetAvgCorruption = this.getAverageLinkCorruption(targetNetwork);
        
        // Store sync metadata for debugging
        connection.lastStateSync = {
          sourceLinkCorruption: sourceAvgCorruption,
          targetLinkCorruption: targetAvgCorruption,
          timestamp: Date.now()
        };
      }
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Link sync error:', err);
    }
  }
  
  /**
   * Get average link corruption level
   */
  getAverageLinkCorruption(network) {
    try {
      if (!network.linkingSystem?.links || network.linkingSystem.links.length === 0) {
        return 0;
      }
      
      let totalCorruption = 0;
      for (const link of network.linkingSystem.links) {
        totalCorruption += link.userData?.corruptionLevel ?? 0;
      }
      
      return totalCorruption / network.linkingSystem.links.length;
    } catch (err) {
      return 0;
    }
  }
  
  /**
   * Validate state across all networks
   */
  validateAllNetworkStates() {
    try {
      const networks = this.multiNetworkManager.getAllNetworks();
      
      for (const { id, network } of networks) {
        this.validateNetworkState(id, network);
      }
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Validation error:', err);
    }
  }
  
  /**
   * Validate a single network's state
   */
  validateNetworkState(networkId, network) {
    try {
      // Validate node corruption values are in valid range
      if (network.aiNodes?.nodes) {
        for (const node of network.aiNodes.nodes) {
          const corruption = node.userData?.corruption;
          if (typeof corruption === 'number') {
            if (corruption < 0 || corruption > 1) {
              // Clamp to valid range
              node.userData.corruption = Math.max(0, Math.min(1, corruption));
            }
          }
        }
      }
      
      // Validate link corruption values
      if (network.linkingSystem?.links) {
        for (const link of network.linkingSystem.links) {
          const corruption = link.userData?.corruptionLevel;
          if (typeof corruption === 'number') {
            if (corruption < 0 || corruption > 1) {
              link.userData.corruptionLevel = Math.max(0, Math.min(1, corruption));
            }
          }
        }
      }
      
      this.stats.stateValidations++;
      
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] State validation error:', err);
    }
  }
  
  /**
   * Get synchronization statistics
   */
  getStats() {
    return {
      ...this.stats,
      syncInProgress: this.syncInProgress,
      conflictsInQueue: this.conflicts.length,
      resolutionHistorySize: this.resolutions.length
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      syncOperations: 0,
      stateValidations: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      totalSyncTime: 0,
      lastSyncDuration: 0
    };
  }
  
  /**
   * Set debug mode
   */
  setDebugMode(enabled) {
    this.config.enableDebug = enabled;
    this.config.enableLogging = enabled;
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.conflicts = [];
    this.resolutions = [];
  }
}

export default PHASE5_NetworkSynchronization;
