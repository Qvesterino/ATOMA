/**
 * PHASE 5: INTER-NETWORK CORRUPTION BRIDGE v1.0 (Session 40)
 * 
 * Manages corruption spread between connected networks
 * 
 * Purpose: Simulate corruption/harmony flowing between networks
 * - Corruption spreads along network connections
 * - Harmony can counter corruption across networks
 * - Connection strength affects transfer rate
 * - Bidirectional propagation with asymmetric effects
 * 
 * Read-only consumer of network state — no gameplay logic changes
 */

import { setNodeCorruption } from './src/utils/nodeCorruptionAccessor.js';

export class PHASE5_CorruptionBridge {
  constructor(multiNetworkManager, config = {}) {
    this.multiNetworkManager = multiNetworkManager;
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Corruption transfer settings
      corruptionTransferRate: config.corruptionTransferRate ?? 0.03,    // % per frame per unit distance
      harmonyTransferRate: config.harmonyTransferRate ?? 0.08,         // % per frame (faster than corruption)
      
      // Connection strength multipliers
      minConnectionStrength: config.minConnectionStrength ?? 0.1,
      maxConnectionStrength: config.maxConnectionStrength ?? 1.0,
      
      // Distance-based attenuation
      distanceAttenuationFactor: config.distanceAttenuationFactor ?? 0.1, // per unit distance
      
      // Cascade propagation
      enableCascadePropagation: config.enableCascadePropagation ?? true,
      cascadePropagationThreshold: config.cascadePropagationThreshold ?? 0.75 // corruption level
    };
    
    // Transfer history
    this.transferHistory = [];
    this.activeTransfers = new Map(); // connectionId → {state, progress}
    
    // Performance monitoring
    this.stats = {
      transfersInitiated: 0,
      transfersCompleted: 0,
      corruptionTransferred: 0,
      harmonyTransferred: 0,
      cascadesTriggered: 0,
      totalFramesProcessed: 0,
      lastUpdateDuration: 0
    };
  }
  
  /**
   * Update corruption transfer across all network connections
   * Call from main animation loop
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;

    const updateStart = Date.now();
    
    try {
      const connections = this.multiNetworkManager.getConnections();
      
      for (const connection of connections) {
        this.processConnection(connection, deltaTime);
      }
      
      this.stats.totalFramesProcessed++;
      this.stats.lastUpdateDuration = Date.now() - updateStart;
      
    } catch (err) {
      console.warn('[PHASE5_CorruptionBridge] Update error:', err);
    }
  }
  
  /**
   * Process a single network connection for corruption transfer
   */
  processConnection(connection, deltaTime) {
    const sourceNetwork = this.multiNetworkManager.getNetwork(connection.sourceNetworkId);
    const targetNetwork = this.multiNetworkManager.getNetwork(connection.targetNetworkId);
    
    if (!sourceNetwork || !targetNetwork) {
      return;
    }
    
    try {
      // Get corruption state from source network
      const sourceCorruptionLevel = this.getNetworkCorruptionLevel(sourceNetwork);
      const targetCorruptionLevel = this.getNetworkCorruptionLevel(targetNetwork);
      
      // Calculate transfer amount
      const connectionStrength = connection.strength;
      const transferAmount = this.calculateCorruptionTransfer(
        sourceCorruptionLevel,
        targetCorruptionLevel,
        connectionStrength,
        deltaTime
      );
      
      if (transferAmount > 0) {
        // Apply corruption to target network
        this.applyCorruptionToNetwork(targetNetwork, transferAmount);
        
        connection.lastTransferTime = Date.now();
        connection.totalTransferred += transferAmount;
        
        this.stats.corruptionTransferred += transferAmount;
        this.stats.transfersInitiated++;
        
        if (this.config.enableDebug) {
          console.log(`[PHASE5_CorruptionBridge] Corruption transfer: ${connection.sourceNetworkId} → ${connection.targetNetworkId} (${transferAmount.toFixed(3)})`);
        }
        
        // Check for cascade propagation
        if (this.config.enableCascadePropagation && targetCorruptionLevel + transferAmount > this.config.cascadePropagationThreshold) {
          this.triggerCascadePropagation(connection.targetNetworkId);
        }
      }
      
      // Also handle harmony flowing back (counter-corruption)
      const harmonyTransferAmount = this.calculateHarmonyTransfer(
        targetCorruptionLevel,
        sourceCorruptionLevel,
        connectionStrength,
        deltaTime
      );
      
      if (harmonyTransferAmount > 0) {
        this.applyHarmonyToNetwork(sourceNetwork, harmonyTransferAmount);
        this.stats.harmonyTransferred += harmonyTransferAmount;
      }
      
    } catch (err) {
      console.warn('[PHASE5_CorruptionBridge] Connection processing error:', err);
    }
  }
  
  /**
   * Calculate corruption transfer amount from source to target
   */
  calculateCorruptionTransfer(sourceCorruption, targetCorruption, connectionStrength, deltaTime) {
    if (sourceCorruption <= 0 || targetCorruption >= 1.0) {
      return 0;
    }
    
    // Base transfer rate
    const baseTransfer = this.config.corruptionTransferRate * deltaTime * connectionStrength;
    
    // Corruption drives transfer (higher source corruption = more transfer)
    const corruptionDriven = baseTransfer * sourceCorruption;
    
    // Resistance from target (higher target corruption = less new corruption can enter)
    const targetResistance = 1 - targetCorruption;
    
    // Final transfer amount
    const transfer = corruptionDriven * targetResistance;
    
    // Don't overflow target
    return Math.min(transfer, 1.0 - targetCorruption);
  }
  
  /**
   * Calculate harmony transfer (counter-corruption flow)
   * Harmony flows from high-harmony networks to low-harmony networks
   */
  calculateHarmonyTransfer(sourceCorruption, targetCorruption, connectionStrength, deltaTime) {
    if (sourceCorruption >= 1.0) {
      return 0;
    }
    
    // Harmony is inverse of corruption
    const sourceHarmony = 1 - sourceCorruption;
    const targetHarmony = 1 - targetCorruption;
    
    // Only transfer if source has more harmony than target
    if (sourceHarmony <= targetHarmony) {
      return 0;
    }
    
    // Base transfer rate (faster than corruption)
    const baseTransfer = this.config.harmonyTransferRate * deltaTime * connectionStrength;
    
    // Harmony-driven transfer
    const harmonyDriven = baseTransfer * sourceHarmony;
    
    // Resistance from target
    const targetResistance = 1 - targetHarmony;
    
    return harmonyDriven * targetResistance;
  }
  
  /**
   * Get aggregate corruption level for a network
   */
  getNetworkCorruptionLevel(network) {
    try {
      if (!network.aiNodes?.nodes || network.aiNodes.nodes.length === 0) {
        return 0;
      }
      
      let totalCorruption = 0;
      for (const node of network.aiNodes.nodes) {
        totalCorruption += node.userData?.corruption ?? 0;
      }
      
      return totalCorruption / network.aiNodes.nodes.length;
    } catch (err) {
      console.warn('[PHASE5_CorruptionBridge] Get corruption error:', err);
      return 0;
    }
  }
  
  /**
   * Apply corruption to all nodes in a network
   */
  applyCorruptionToNetwork(network, amount) {
    try {
      if (!network.aiNodes?.nodes) {
        return;
      }
      
      // Distribute corruption evenly across all nodes
      const corruptionPerNode = amount / network.aiNodes.nodes.length;
      
      for (const node of network.aiNodes.nodes) {
        const currentCorruption = node.userData?.metrics?.corruption ?? 0;
        const nextCorruption = Math.min(currentCorruption + corruptionPerNode, 1.0);
        setNodeCorruption(node, nextCorruption);

        // Threshold detection (visual-only event)
        const prev = node.userData?._prevCorruption ?? 0;
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
        if (!node.userData) node.userData = {};
        node.userData._prevCorruption = current;
      }
      
    } catch (err) {
      console.warn('[PHASE5_CorruptionBridge] Apply corruption error:', err);
    }
  }
  
  /**
   * Apply harmony to all nodes in a network
   */
  applyHarmonyToNetwork(network, amount) {
    try {
      if (!network.aiNodes?.nodes) {
        return;
      }
      
      // Distribute harmony evenly across all nodes
      const harmonyPerNode = amount / network.aiNodes.nodes.length;
      
      for (const node of network.aiNodes.nodes) {
        const currentCorruption = node.userData?.metrics?.corruption ?? 0;
        const nextCorruption = Math.max(currentCorruption - harmonyPerNode, 0);
        setNodeCorruption(node, nextCorruption);

        // Update cached previous corruption for threshold tracking
        if (!node.userData) node.userData = {};
        const current = node.userData?.metrics?.corruption ?? 0;
        node.userData._prevCorruption = current;
      }
      
    } catch (err) {
      console.warn('[PHASE5_CorruptionBridge] Apply harmony error:', err);
    }
  }
  
  /**
   * Trigger cascade propagation through connected networks
   */
  triggerCascadePropagation(networkId) {
    try {
      this.stats.cascadesTriggered++;
      
      const outboundConnections = this.multiNetworkManager.getOutboundConnections(networkId);
      
      if (this.config.enableLogging) {
        console.log(`[PHASE5_CorruptionBridge] Cascade propagation from ${networkId} through ${outboundConnections.length} connections`);
      }
      
      // Emit event for other systems to handle cascade
      this.multiNetworkManager.emitEvent({
        type: 'cascadePropagation',
        networkId,
        connectionCount: outboundConnections.length,
        timestamp: Date.now()
      });
      
    } catch (err) {
      console.warn('[PHASE5_CorruptionBridge] Cascade propagation error:', err);
    }
  }
  
  /**
   * Manually trigger corruption transfer on a connection
   */
  manuallyTransferCorruption(sourceNetworkId, targetNetworkId, amount) {
    try {
      const targetNetwork = this.multiNetworkManager.getNetwork(targetNetworkId);
      if (!targetNetwork) {
        return false;
      }
      
      this.applyCorruptionToNetwork(targetNetwork, amount);
      this.stats.corruptionTransferred += amount;
      
      if (this.config.enableDebug) {
        console.log(`[PHASE5_CorruptionBridge] Manual corruption transfer: ${sourceNetworkId} → ${targetNetworkId} (${amount})`);
      }
      
      return true;
    } catch (err) {
      console.warn('[PHASE5_CorruptionBridge] Manual transfer error:', err);
      return false;
    }
  }
  
  /**
   * Manually trigger harmony transfer on a connection
   */
  manuallyTransferHarmony(sourceNetworkId, targetNetworkId, amount) {
    try {
      const targetNetwork = this.multiNetworkManager.getNetwork(targetNetworkId);
      if (!targetNetwork) {
        return false;
      }
      
      this.applyHarmonyToNetwork(targetNetwork, amount);
      this.stats.harmonyTransferred += amount;
      
      if (this.config.enableDebug) {
        console.log(`[PHASE5_CorruptionBridge] Manual harmony transfer: ${sourceNetworkId} → ${targetNetworkId} (${amount})`);
      }
      
      return true;
    } catch (err) {
      console.warn('[PHASE5_CorruptionBridge] Manual harmony transfer error:', err);
      return false;
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeTransferCount: this.activeTransfers.size,
      transferHistorySize: this.transferHistory.length
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      transfersInitiated: 0,
      transfersCompleted: 0,
      corruptionTransferred: 0,
      harmonyTransferred: 0,
      cascadesTriggered: 0,
      totalFramesProcessed: 0,
      lastUpdateDuration: 0
    };
    this.transferHistory = [];
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
    this.transferHistory = [];
    this.activeTransfers.clear();
  }
}

export default PHASE5_CorruptionBridge;
