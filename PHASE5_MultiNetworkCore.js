/**
 * ============================================================================
 * PHASE 5: MULTI-NETWORK CORE v2.0 (Consolidated)
 * ============================================================================
 * 
 * Consolidated from:
 * - PHASE5_MultiNetworkOrchestrator_v1.js
 * - PHASE5_MultiNetworkManager_v1.js
 * - PHASE5_NetworkSynchronization_v1.js
 * 
 * Purpose: Central hub for multi-network simulation
 * - Register and track multiple independent networks
 * - Coordinate corruption spread between networks
 * - Synchronize state across networks
 * - Handle conflict resolution
 * 
 * @version 2.0.0 (Consolidated)
 * ============================================================================
 */

import { setNodeCorruption } from './src/utils/nodeCorruptionAccessor.js';

function getCanonicalNodeCorruption(node) {
  return node?.userData?.metrics?.corruption ?? node?.userData?.corruption ?? 0;
}

function getCanonicalNodeHarmony(node) {
  return node?.userData?.metrics?.harmony ?? node?.userData?.harmonyLevel ?? 0;
}

function getCanonicalLinkCorruption(link) {
  return link?.userData?.metrics?.corruption ?? link?.userData?.corruptionLevel ?? 0;
}

// ============================================================================
// SECTION 1: MULTI-NETWORK MANAGER
// ============================================================================

/**
 * Central coordination point for multiple network instances
 */
export class PHASE5_MultiNetworkManager {
  constructor(config = {}) {
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      maxNetworks: config.maxNetworks ?? 10,
      syncInterval: config.syncInterval ?? 100,
      maxNetworkDistance: config.maxNetworkDistance ?? 50,
      enableEventPropagation: config.enableEventPropagation ?? true,
      eventPropagationDelay: config.eventPropagationDelay ?? 50
    };
    
    this.networks = new Map();
    this.networkMetadata = new Map();
    this.networkConnections = [];
    this.networkProximityIndex = new Map();
    this.eventQueue = [];
    this.eventHistory = [];
    this.eventCallbacks = [];
    this._networkRegisteredCallbacks = [];
    this._connectionCreatedCallbacks = [];
    
    this.stats = {
      networksRegistered: 0,
      networksActive: 0,
      totalSyncOperations: 0,
      totalEventsPropagated: 0,
      lastSyncTime: Date.now(),
      syncDuration: 0
    };
    
    this.lastSyncTime = Date.now();
    this.syncTimer = null;
  }
  
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
      this.networks.set(networkId, network);
      
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
      
      this.emitEvent({ type: 'networkRegistered', networkId, timestamp: Date.now() });
      return true;
    } catch (err) {
      console.error('[PHASE5_MultiNetworkManager] Register error:', err);
      return false;
    }
  }
  
  unregisterNetwork(networkId) {
    if (!this.networks.has(networkId)) return false;
    
    this.networks.delete(networkId);
    this.networkMetadata.delete(networkId);
    this.networkConnections = this.networkConnections.filter(
      conn => conn.sourceNetworkId !== networkId && conn.targetNetworkId !== networkId
    );
    this.stats.networksActive--;
    return true;
  }
  
  connectNetworks(sourceNetworkId, targetNetworkId, strength = 0.5) {
    if (!this.networks.has(sourceNetworkId) || !this.networks.has(targetNetworkId)) return false;
    if (sourceNetworkId === targetNetworkId) return false;
    
    const exists = this.networkConnections.some(
      conn => conn.sourceNetworkId === sourceNetworkId && conn.targetNetworkId === targetNetworkId
    );
    if (exists) return false;
    
    this.networkConnections.push({
      sourceNetworkId,
      targetNetworkId,
      strength: Math.min(Math.max(strength, 0), 1),
      createdAt: Date.now(),
      lastTransferTime: Date.now(),
      totalTransferred: 0
    });
    
    this.emitEvent({
      type: 'networkConnected',
      sourceNetworkId,
      targetNetworkId,
      strength,
      timestamp: Date.now()
    });
    
    return true;
  }
  
  disconnectNetworks(sourceNetworkId, targetNetworkId) {
    const initialLength = this.networkConnections.length;
    this.networkConnections = this.networkConnections.filter(
      conn => !(conn.sourceNetworkId === sourceNetworkId && conn.targetNetworkId === targetNetworkId)
    );
    return this.networkConnections.length < initialLength;
  }
  
  getNetwork(networkId) { return this.networks.get(networkId); }
  getNetworkMetadata(networkId) { return this.networkMetadata.get(networkId); }
  getConnections() { return [...this.networkConnections]; }
  
  getAllNetworks() {
    return Array.from(this.networks.entries()).map(([id, network]) => ({
      id,
      network,
      metadata: this.networkMetadata.get(id)
    }));
  }
  
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;

    const syncStartTime = Date.now();
    
    try {
      for (const [networkId, network] of this.networks) {
        this._updateNetworkMetrics(networkId, network);
      }
      
      if (this.config.enableEventPropagation) {
        this._processEventQueue();
      }
      
      this.stats.totalSyncOperations++;
      this.stats.lastSyncTime = Date.now();
      this.stats.syncDuration = Date.now() - syncStartTime;
    } catch (err) {
      console.warn('[PHASE5_MultiNetworkManager] Update error:', err);
    }
  }
  
  _updateNetworkMetrics(networkId, network) {
    const metadata = this.networkMetadata.get(networkId);
    if (!metadata) return;
    
    metadata.metrics.nodeCount = network.aiNodes?.nodes?.length ?? 0;
    metadata.metrics.linkCount = network.linkingSystem?.links?.length ?? 0;
    metadata.metrics.lastUpdateTime = Date.now();
    
    if (network.aiNodes?.nodes) {
      let totalCorruption = 0;
      let totalHarmony = 0;
      
      for (const node of network.aiNodes.nodes) {
        totalCorruption += getCanonicalNodeCorruption(node);
        totalHarmony += getCanonicalNodeHarmony(node);
      }
      
      const nodeCount = network.aiNodes.nodes.length || 1;
      metadata.metrics.corruptionLevel = totalCorruption / nodeCount;
      metadata.metrics.harmonyLevel = totalHarmony / nodeCount;
    }
  }
  
  _processEventQueue() {
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
  
  emitEvent(event) {
    for (const callback of this.eventCallbacks) {
      try { callback(event); } catch (err) { /* ignore */ }
    }
  }
  
  on(callback) { this.eventCallbacks.push(callback); }
  off(callback) {
    const index = this.eventCallbacks.indexOf(callback);
    if (index >= 0) this.eventCallbacks.splice(index, 1);
  }

  onNetworkRegistered(callback) {
    const wrapped = (event) => {
      if (event.type === 'networkRegistered') {
        callback(event.networkId, this.networks.get(event.networkId), this.networkMetadata.get(event.networkId));
      }
    };
    this.eventCallbacks.push(wrapped);
    this._networkRegisteredCallbacks.push(wrapped);
    return () => {
      const idx = this._networkRegisteredCallbacks.indexOf(wrapped);
      if (idx >= 0) this._networkRegisteredCallbacks.splice(idx, 1);
      const cbIdx = this.eventCallbacks.indexOf(wrapped);
      if (cbIdx >= 0) this.eventCallbacks.splice(cbIdx, 1);
    };
  }

  onConnectionCreated(callback) {
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
    return () => {
      const idx = this._connectionCreatedCallbacks.indexOf(wrapped);
      if (idx >= 0) this._connectionCreatedCallbacks.splice(idx, 1);
      const cbIdx = this.eventCallbacks.indexOf(wrapped);
      if (cbIdx >= 0) this.eventCallbacks.splice(cbIdx, 1);
    };
  }
  
  getStats() {
    return {
      ...this.stats,
      networkCount: this.networks.size,
      connectionCount: this.networkConnections.length
    };
  }
  
  clear() {
    this.networks.clear();
    this.networkMetadata.clear();
    this.networkConnections = [];
    this.eventQueue = [];
    this.stats.networksActive = 0;
  }
  
  dispose() {
    this.clear();
    this.eventCallbacks = [];
    this._networkRegisteredCallbacks = [];
    this._connectionCreatedCallbacks = [];
  }
}

// ============================================================================
// SECTION 2: NETWORK SYNCHRONIZATION
// ============================================================================

/**
 * Ensures consistency and synchronization across multiple networks
 */
export class PHASE5_NetworkSynchronization {
  constructor(multiNetworkManager, config = {}) {
    this.multiNetworkManager = multiNetworkManager;
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      syncInterval: config.syncInterval ?? 500,
      maxSyncDuration: config.maxSyncDuration ?? 50,
      conflictResolutionMode: config.conflictResolutionMode ?? 'average',
      enableStateValidation: config.enableStateValidation ?? true,
      enableConflictDetection: config.enableConflictDetection ?? true
    };
    
    this.lastSyncTime = Date.now();
    this.syncInProgress = false;
    this.conflicts = [];
    this.resolutions = [];
    
    this.stats = {
      syncOperations: 0,
      stateValidations: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      totalSyncTime: 0,
      lastSyncDuration: 0
    };
  }
  
  synchronize() {
    if (this.syncInProgress) return;
    
    const syncStart = Date.now();
    this.syncInProgress = true;
    
    try {
      const connections = this.multiNetworkManager.getConnections();
      
      for (const connection of connections) {
        this._synchronizeConnection(connection);
      }
      
      if (this.config.enableStateValidation) {
        this._validateAllNetworkStates();
      }
      
      this.stats.syncOperations++;
      this.lastSyncTime = Date.now();
      this.stats.lastSyncDuration = Date.now() - syncStart;
      this.stats.totalSyncTime += this.stats.lastSyncDuration;
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Sync error:', err);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  _synchronizeConnection(connection) {
    const sourceNetwork = this.multiNetworkManager.getNetwork(connection.sourceNetworkId);
    const targetNetwork = this.multiNetworkManager.getNetwork(connection.targetNetworkId);
    
    if (!sourceNetwork || !targetNetwork) return;
    
    try {
      if (this.config.enableConflictDetection) {
        const conflicts = this._detectConflicts(sourceNetwork, targetNetwork, connection);
        
        if (conflicts.length > 0) {
          this.stats.conflictsDetected += conflicts.length;
          
          for (const conflict of conflicts) {
            this._resolveConflict(conflict, sourceNetwork, targetNetwork);
          }
        }
      }
      
      this._synchronizeLinkStates(sourceNetwork, targetNetwork, connection);
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Connection sync error:', err);
    }
  }
  
  _detectConflicts(sourceNetwork, targetNetwork, connection) {
    const conflicts = [];
    
    try {
      const sourceNodeIds = new Set(sourceNetwork.aiNodes?.nodes?.map(n => n.userData?.id) ?? []);
      const targetNodeIds = new Set(targetNetwork.aiNodes?.nodes?.map(n => n.userData?.id) ?? []);
      const overlap = new Set([...sourceNodeIds].filter(x => targetNodeIds.has(x)));
      
      if (overlap.size > 0) {
        for (const nodeId of overlap) {
          const sourceNode = sourceNetwork.aiNodes.nodes.find(n => n.userData?.id === nodeId);
          const targetNode = targetNetwork.aiNodes.nodes.find(n => n.userData?.id === nodeId);
          
          if (sourceNode && targetNode) {
            const sourceCorruption = getCanonicalNodeCorruption(sourceNode);
            const targetCorruption = getCanonicalNodeCorruption(targetNode);
            
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
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Conflict detection error:', err);
    }
    
    return conflicts;
  }
  
  _resolveConflict(conflict, sourceNetwork, targetNetwork) {
    try {
      const mode = this.config.conflictResolutionMode;
      
      if (conflict.type === 'nodeCorruptionMismatch') {
        const sourceNode = sourceNetwork.aiNodes.nodes.find(n => n.userData?.id === conflict.nodeId);
        const targetNode = targetNetwork.aiNodes.nodes.find(n => n.userData?.id === conflict.nodeId);
        
        if (!sourceNode || !targetNode) return;
        
        let resolvedValue;
        
        switch (mode) {
          case 'average':
            resolvedValue = (conflict.sourceValue + conflict.targetValue) / 2;
            break;
          case 'conservative':
            resolvedValue = Math.min(conflict.sourceValue, conflict.targetValue);
            break;
          case 'aggressive':
            resolvedValue = Math.max(conflict.sourceValue, conflict.targetValue);
            break;
          default:
            resolvedValue = conflict.sourceValue;
        }
        
        setNodeCorruption(sourceNode, resolvedValue, { source: 'phase5-network-synchronization' });
        this._emitCorruptionThreshold(sourceNode);
        setNodeCorruption(targetNode, resolvedValue, { source: 'phase5-network-synchronization' });
        this._emitCorruptionThreshold(targetNode);
        
        this.resolutions.push({ conflict, resolvedValue, mode, timestamp: Date.now() });
        this.stats.conflictsResolved++;
      }
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Conflict resolution error:', err);
    }
  }
  
  _synchronizeLinkStates(sourceNetwork, targetNetwork, connection) {
    try {
      if (sourceNetwork.linkingSystem?.links && targetNetwork.linkingSystem?.links) {
        const sourceAvgCorruption = this._getAverageLinkCorruption(sourceNetwork);
        const targetAvgCorruption = this._getAverageLinkCorruption(targetNetwork);
        
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
  
  _getAverageLinkCorruption(network) {
    try {
      if (!network.linkingSystem?.links || network.linkingSystem.links.length === 0) return 0;
      
      let totalCorruption = 0;
      for (const link of network.linkingSystem.links) {
        totalCorruption += getCanonicalLinkCorruption(link);
      }
      
      return totalCorruption / network.linkingSystem.links.length;
    } catch (err) {
      return 0;
    }
  }
  
  _validateAllNetworkStates() {
    try {
      const networks = this.multiNetworkManager.getAllNetworks();
      
      for (const { id, network } of networks) {
        this._validateNetworkState(id, network);
      }
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] Validation error:', err);
    }
  }
  
  _validateNetworkState(networkId, network) {
    try {
      if (network.aiNodes?.nodes) {
        for (const node of network.aiNodes.nodes) {
          const corruption = getCanonicalNodeCorruption(node);
          if (typeof corruption === 'number') {
            if (corruption < 0 || corruption > 1) {
              setNodeCorruption(node, Math.max(0, Math.min(1, corruption)), { source: 'phase5-network-synchronization' });
              this._emitCorruptionThreshold(node);
            }
          }
        }
      }
      
      this.stats.stateValidations++;
    } catch (err) {
      console.warn('[PHASE5_NetworkSynchronization] State validation error:', err);
    }
  }
  
  _emitCorruptionThreshold(node) {
    if (!node?.userData) return;
    const prev = node.userData._prevCorruption ?? 0;
    const current = node.userData?.metrics?.corruption ?? 0;
    const THRESHOLD = 0.7;
    if (prev < THRESHOLD && current >= THRESHOLD) {
      this.multiNetworkManager?.emitEvent?.({
        type: 'corruptionThresholdCrossed',
        node,
        value: current,
        timestamp: Date.now()
      });
    }
    node.userData._prevCorruption = current;
  }
  
  getStats() {
    return {
      ...this.stats,
      syncInProgress: this.syncInProgress,
      conflictsInQueue: this.conflicts.length,
      resolutionHistorySize: this.resolutions.length
    };
  }
  
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
  
  setDebugMode(enabled) {
    this.config.enableDebug = enabled;
    this.config.enableLogging = enabled;
  }
  
  dispose() {
    this.conflicts = [];
    this.resolutions = [];
  }
}

// ============================================================================
// SECTION 3: MULTI-NETWORK ORCHESTRATOR
// ============================================================================

/**
 * Central hub for multi-network simulation
 * Coordinates all PHASE5 subsystems
 */
export class PHASE5_MultiNetworkOrchestrator {
  constructor(config = {}) {
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      maxNetworks: config.maxNetworks ?? 10,
      syncInterval: config.syncInterval ?? 100,
      enableCorruptionSpread: config.enableCorruptionSpread ?? true,
      enableSynchronization: config.enableSynchronization ?? true,
      enableEventPropagation: config.enableEventPropagation ?? true
    };
    
    // Initialize subsystems
    this.multiNetworkManager = new PHASE5_MultiNetworkManager({
      enableDebug: this.config.enableDebug,
      enableLogging: this.config.enableLogging,
      maxNetworks: this.config.maxNetworks,
      syncInterval: this.config.syncInterval
    });
    
    this.synchronization = new PHASE5_NetworkSynchronization(this.multiNetworkManager, {
      enableDebug: this.config.enableDebug,
      enableLogging: this.config.enableLogging,
      enableStateValidation: true,
      enableConflictDetection: true
    });
    
    // External reference (set by main.js)
    this.corruptionBridge = null;
    
    // State
    this.isInitialized = false;
    this.lastUpdateTime = Date.now();
    this.cascadeVisuals = null;
    this.syncTimer = null;
    
    this.stats = {
      initialized: false,
      uptime: 0,
      lastUpdateTime: Date.now()
    };
  }
  
  /**
   * Set corruption bridge reference (called from main.js)
   */
  setCorruptionBridge(bridge) {
    this.corruptionBridge = bridge;
  }
  
  initialize() {
    try {
      this.multiNetworkManager.on((event) => {
        this._handleNetworkEvent(event);
      });
      
      if (this.config.enableSynchronization) {
        this._setupPeriodicSync();
      }
      
      this.isInitialized = true;
      this.stats.initialized = true;
      
      return true;
    } catch (err) {
      console.error('[PHASE5_MultiNetworkOrchestrator] Initialization error:', err);
      return false;
    }
  }
  
  registerNetwork(networkId, network, metadata = {}) {
    return this.multiNetworkManager.registerNetwork(networkId, network, metadata);
  }

  setCascadeVisuals(visualSystem) {
    this.cascadeVisuals = visualSystem;
  }
  
  unregisterNetwork(networkId) {
    return this.multiNetworkManager.unregisterNetwork(networkId);
  }
  
  connectNetworks(sourceNetworkId, targetNetworkId, strength = 0.5) {
    return this.multiNetworkManager.connectNetworks(sourceNetworkId, targetNetworkId, strength);
  }
  
  disconnectNetworks(sourceNetworkId, targetNetworkId) {
    return this.multiNetworkManager.disconnectNetworks(sourceNetworkId, targetNetworkId);
  }
  
  getAllNetworks() {
    return this.multiNetworkManager.getAllNetworks();
  }
  
  getConnections() {
    return this.multiNetworkManager.getConnections();
  }
  
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    if (!this.isInitialized) return;
    
    try {
      this.multiNetworkManager.update(deltaTime);
      
      if (this.config.enableCorruptionSpread && this.corruptionBridge) {
        this.corruptionBridge.update(deltaTime);
      }
      
      this.lastUpdateTime = Date.now();
      this.stats.uptime = Date.now() - this.stats.lastUpdateTime;
    } catch (err) {
      console.warn('[PHASE5_MultiNetworkOrchestrator] Update error:', err);
    }
  }
  
  performSync() {
    if (this.config.enableSynchronization) {
      this.synchronization.synchronize();
    }
  }
  
  _setupPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      this.synchronization.synchronize();
    }, this.config.syncInterval);
  }
  
  _handleNetworkEvent(event) {
    try {
      switch (event.type) {
        case 'networkRegistered':
          if (this.config.enableLogging) {
            console.log(`[PHASE5_MultiNetworkOrchestrator] Network registered: ${event.networkId}`);
          }
          break;
        
        case 'networkConnected':
          if (this.config.enableLogging) {
            console.log(`[PHASE5_MultiNetworkOrchestrator] Networks connected: ${event.sourceNetworkId} ↔ ${event.targetNetworkId}`);
          }
          break;
        
        case 'cascadePropagation':
          if (this.config.enableLogging) {
            console.log(`[PHASE5_MultiNetworkOrchestrator] Cascade propagation from ${event.networkId}`);
          }
          break;

        case 'corruptionThresholdCrossed':
          if (this.cascadeVisuals && event.node) {
            this.cascadeVisuals.triggerCascade({
              sourceNodeId: event.node.userData?.id,
              sourcePosition: event.node.position,
              cascadeType: 'corruption',
              cascadeStrength: event.value ?? 1.0,
              depth: 0,
              targetNodes: []
            });
          }
          break;
      }
    } catch (err) {
      console.warn('[PHASE5_MultiNetworkOrchestrator] Event handling error:', err);
    }
  }
  
  transferCorruptionBetweenNetworks(sourceNetworkId, targetNetworkId, amount) {
    if (!this.corruptionBridge) return false;
    return this.corruptionBridge.manuallyTransferCorruption(sourceNetworkId, targetNetworkId, amount);
  }
  
  transferHarmonyBetweenNetworks(sourceNetworkId, targetNetworkId, amount) {
    if (!this.corruptionBridge) return false;
    return this.corruptionBridge.manuallyTransferHarmony(sourceNetworkId, targetNetworkId, amount);
  }
  
  getStats() {
    return {
      orchestrator: this.stats,
      multiNetworkManager: this.multiNetworkManager.getStats(),
      synchronization: this.synchronization.getStats(),
      corruptionBridge: this.corruptionBridge?.getStats?.() ?? null
    };
  }
  
  getNetworkMetadata(networkId) {
    return this.multiNetworkManager.getNetworkMetadata(networkId);
  }
  
  setDebugMode(enabled) {
    this.config.enableDebug = enabled;
    this.multiNetworkManager.config.enableDebug = enabled;
    this.synchronization.setDebugMode(enabled);
    if (this.corruptionBridge) {
      this.corruptionBridge.setDebugMode(enabled);
    }
  }
  
  clear() {
    this.multiNetworkManager.clear();
    this.synchronization.resetStats();
    if (this.corruptionBridge) {
      this.corruptionBridge.resetStats();
    }
  }
  
  dispose() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.multiNetworkManager.dispose();
    this.synchronization.dispose();
    
    this.isInitialized = false;
  }
}

export default PHASE5_MultiNetworkOrchestrator;
