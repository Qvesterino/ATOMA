/**
 * PHASE 5: MULTI-NETWORK ORCHESTRATOR v1.0 (Session 40)
 * 
 * Central hub for multi-network simulation
 * 
 * Purpose: Orchestrate all Phase 5 subsystems
 * - Manages multiple independent networks
 * - Coordinates corruption spread between networks
 * - Synchronizes state across networks
 * - Provides unified API for multi-network operations
 * 
 * Additive integration layer — no gameplay logic changes
 */

import { PHASE5_MultiNetworkManager } from './PHASE5_MultiNetworkManager_v1.js';
import { PHASE5_CorruptionBridge } from './PHASE5_CorruptionBridge_v1.js';
import { PHASE5_NetworkSynchronization } from './PHASE5_NetworkSynchronization_v1.js';

export class PHASE5_MultiNetworkOrchestrator {
  constructor(config = {}) {
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Component settings
      maxNetworks: config.maxNetworks ?? 10,
      syncInterval: config.syncInterval ?? 100,
      
      // Feature toggles
      enableCorruptionSpread: config.enableCorruptionSpread ?? true,
      enableSynchronization: config.enableSynchronization ?? true,
      enableEventPropagation: config.enableEventPropagation ?? true
    };
    
    // Subsystems
    this.multiNetworkManager = new PHASE5_MultiNetworkManager({
      enableDebug: this.config.enableDebug,
      enableLogging: this.config.enableLogging,
      maxNetworks: this.config.maxNetworks,
      syncInterval: this.config.syncInterval
    });
    
    this.corruptionBridge = new PHASE5_CorruptionBridge(this.multiNetworkManager, {
      enableDebug: this.config.enableDebug,
      enableLogging: this.config.enableLogging,
      enableCascadePropagation: true
    });
    
    this.synchronization = new PHASE5_NetworkSynchronization(this.multiNetworkManager, {
      enableDebug: this.config.enableDebug,
      enableLogging: this.config.enableLogging,
      enableStateValidation: true,
      enableConflictDetection: true
    });
    
    // State
    this.isInitialized = false;
    this.lastUpdateTime = Date.now();
    this.cascadeVisuals = null;
    
    // Synchronization timer
    this.syncTimer = null;
    
    // Statistics
    this.stats = {
      initialized: false,
      uptime: 0,
      lastUpdateTime: Date.now()
    };
  }
  
  /**
   * Initialize the orchestrator
   */
  initialize() {
    try {
      // Setup event listeners
      this.multiNetworkManager.on((event) => {
        this.handleNetworkEvent(event);
      });
      
      // Setup periodic synchronization
      if (this.config.enableSynchronization) {
        this.setupPeriodicSync();
      }
      
      this.isInitialized = true;
      this.stats.initialized = true;
      
      if (this.config.enableLogging) {
        console.log('[PHASE5_MultiNetworkOrchestrator] Initialized ✓');
      }
      
      return true;
    } catch (err) {
      console.error('[PHASE5_MultiNetworkOrchestrator] Initialization error:', err);
      return false;
    }
  }
  
  /**
   * Register a network instance
   */
  registerNetwork(networkId, network, metadata = {}) {
    return this.multiNetworkManager.registerNetwork(networkId, network, metadata);
  }

  /**
   * Attach cascade visuals system (visual-only consumer)
   */
  setCascadeVisuals(visualSystem) {
    this.cascadeVisuals = visualSystem;
  }
  
  /**
   * Unregister a network
   */
  unregisterNetwork(networkId) {
    return this.multiNetworkManager.unregisterNetwork(networkId);
  }
  
  /**
   * Connect two networks
   */
  connectNetworks(sourceNetworkId, targetNetworkId, strength = 0.5) {
    return this.multiNetworkManager.connectNetworks(sourceNetworkId, targetNetworkId, strength);
  }
  
  /**
   * Disconnect two networks
   */
  disconnectNetworks(sourceNetworkId, targetNetworkId) {
    return this.multiNetworkManager.disconnectNetworks(sourceNetworkId, targetNetworkId);
  }
  
  /**
   * Get all networks
   */
  getAllNetworks() {
    return this.multiNetworkManager.getAllNetworks();
  }
  
  /**
   * Get all connections
   */
  getConnections() {
    return this.multiNetworkManager.getConnections();
  }
  
  /**
   * Update per frame
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;

    if (!this.isInitialized) {
      return;
    }
    
    try {
      // Update multi-network manager (metrics)
      this.multiNetworkManager.update(deltaTime);
      
      // Update corruption spread if enabled
      if (this.config.enableCorruptionSpread) {
        this.corruptionBridge.update(deltaTime);
      }
      
      this.lastUpdateTime = Date.now();
      this.stats.uptime = Date.now() - this.stats.lastUpdateTime;
      
    } catch (err) {
      console.warn('[PHASE5_MultiNetworkOrchestrator] Update error:', err);
    }
  }
  
  /**
   * Perform a full synchronization
   */
  performSync() {
    if (this.config.enableSynchronization) {
      this.synchronization.synchronize();
    }
  }
  
  /**
   * Setup periodic synchronization
   */
  setupPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      this.synchronization.synchronize();
    }, this.config.syncInterval);
  }
  
  /**
   * Handle network events
   */
  handleNetworkEvent(event) {
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
  
  /**
   * Manually transfer corruption between networks
   */
  transferCorruptionBetweenNetworks(sourceNetworkId, targetNetworkId, amount) {
    return this.corruptionBridge.manuallyTransferCorruption(
      sourceNetworkId,
      targetNetworkId,
      amount
    );
  }
  
  /**
   * Manually transfer harmony between networks
   */
  transferHarmonyBetweenNetworks(sourceNetworkId, targetNetworkId, amount) {
    return this.corruptionBridge.manuallyTransferHarmony(
      sourceNetworkId,
      targetNetworkId,
      amount
    );
  }
  
  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      orchestrator: this.stats,
      multiNetworkManager: this.multiNetworkManager.getStats(),
      corruptionBridge: this.corruptionBridge.getStats(),
      synchronization: this.synchronization.getStats()
    };
  }
  
  /**
   * Get network metadata
   */
  getNetworkMetadata(networkId) {
    return this.multiNetworkManager.getNetworkMetadata(networkId);
  }
  
  /**
   * Set debug mode for all subsystems
   */
  setDebugMode(enabled) {
    this.config.enableDebug = enabled;
    this.multiNetworkManager.config.enableDebug = enabled;
    this.corruptionBridge.setDebugMode(enabled);
    this.synchronization.setDebugMode(enabled);
  }
  
  /**
   * Clear all networks
   */
  clear() {
    this.multiNetworkManager.clear();
    this.corruptionBridge.resetStats();
    this.synchronization.resetStats();
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.multiNetworkManager.dispose();
    this.corruptionBridge.dispose();
    this.synchronization.dispose();
    
    this.isInitialized = false;
  }
}

export default PHASE5_MultiNetworkOrchestrator;
