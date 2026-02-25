/**
 * TIER 4: GAMEPLAY INTEGRATION CORE v1.0 (Session 40)
 * 
 * Connects player actions to TIER 1 mechanics (corruption/harmony)
 * 
 * Purpose: Bridge between link UI interactions and gameplay state
 * - Link creation triggers corruption seeding on source
 * - Link destruction triggers cascade mitigation
 * - Harmony pulses triggered by successful connections
 * - Visual + mechanical feedback for player actions
 * 
 * No gameplay logic modifications — purely connection layer
 */

export class TIER4_GameplayIntegrationCore {
  constructor(config = {}) {
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Corruption seeding on link creation
      linkCreationCorruptionSeed: config.linkCreationCorruptionSeed ?? 0.1,
      linkCreationCorruptionSpread: config.linkCreationCorruptionSpread ?? 0.05,
      
      // Harmony boost on successful connection
      harmonyBoostOnLinkCreation: config.harmonyBoostOnLinkCreation ?? 0.3,
      harmonyBoostRadius: config.harmonyBoostRadius ?? 2.0,
      
      // Corruption cleanup on link destruction
      linkDestructionHarmonyBoost: config.linkDestructionHarmonyBoost ?? 0.2,
      linkDestructionHarmonyRadius: config.linkDestructionHarmonyRadius ?? 1.5,
      
      // Cascade mitigation on damage
      cascadeMitigationStrength: config.cascadeMitigationStrength ?? 0.15,
      cascadeMitigationRadius: config.cascadeMitigationRadius ?? 3.0
    };
    
    // System references (wired externally)
    this.linkingSystem = null;
    this.aiNodes = null;
    this.linkCorruptionTransmission = null;
    this.harmonyStabilizationSystem = null;
    
    // Event tracking
    this.linkCreationHistory = [];
    this.linkDestructionHistory = [];
    this.cascadeEventsTriggered = [];
    
    // Performance monitoring
    this.stats = {
      linksCreatedThisFrame: 0,
      linksRemovedThisFrame: 0,
      corruptionSeedsApplied: 0,
      harmonyBoostsApplied: 0,
      cascadesDetected: 0,
      totalCorruptionSeeded: 0,
      totalHarmonyRestored: 0,
      frameUpdateTime: 0
    };
  }
  
  /**
   * Initialize all system integrations
   * Call after: linkingSystem, aiNodes, TIER 1 systems ready
   */
  initialize(linkingSystem, aiNodes, linkCorruptionTransmission, harmonyStabilizationSystem) {
    if (!linkingSystem || !aiNodes) {
      console.error('[TIER4_GameplayIntegrationCore] Missing required systems');
      return false;
    }
    
    this.linkingSystem = linkingSystem;
    this.aiNodes = aiNodes;
    this.linkCorruptionTransmission = linkCorruptionTransmission;
    this.harmonyStabilizationSystem = harmonyStabilizationSystem;
    
    // Wire link creation events
    if (this.linkingSystem.onLinkCreated) {
      this.linkingSystem.onLinkCreated((link) => {
        this.onLinkCreated(link);
      });
    }
    
    // Wire link removal events
    if (this.linkingSystem.onLinkRemoved) {
      this.linkingSystem.onLinkRemoved((link) => {
        this.onLinkRemoved(link);
      });
    }
    
    if (this.config.enableLogging) {
      console.log('[TIER4_GameplayIntegrationCore] Initialized ✓');
    }
    
    return true;
  }
  
  /**
   * Called when a link is created by player action
   * Applies: corruption seeding, harmony boost
   */
  onLinkCreated(link) {
    if (!link || !this.linkingSystem) return;
    
    try {
      const sourceNode = link.nodes?.[0];
      const targetNode = link.nodes?.[1];
      
      if (!sourceNode || !targetNode) return;
      
      // ====================================================================
      // [1] Apply Corruption Seed on Source Node
      // New links begin with baseline corruption from creation "stress"
      // ====================================================================
      if (this.linkCorruptionTransmission) {
        const sourceCorruptionSeed = this.config.linkCreationCorruptionSeed;
        this.linkCorruptionTransmission.setLinkCorruption(link, sourceCorruptionSeed);
        
        this.stats.corruptionSeedsApplied++;
        this.stats.totalCorruptionSeeded += sourceCorruptionSeed;
        
        if (this.config.enableDebug) {
          console.log(`[TIER4] Link corruption seeded: ${sourceNode.userData?.id} → ${targetNode.userData?.id} (${sourceCorruptionSeed})`);
        }
      }
      
      // ====================================================================
      // [2] Trigger Harmony Boost on Both Nodes
      // Successful connection heals both nodes
      // ====================================================================
      if (this.harmonyStabilizationSystem) {
        const harmonyBoost = this.config.harmonyBoostOnLinkCreation;
        const radius = this.config.harmonyBoostRadius;
        
        // Boost source node
        this.harmonyStabilizationSystem.triggerHarmonyPulse(sourceNode, radius, harmonyBoost);
        
        // Boost target node
        this.harmonyStabilizationSystem.triggerHarmonyPulse(targetNode, radius, harmonyBoost);
        
        this.stats.harmonyBoostsApplied += 2;
        this.stats.totalHarmonyRestored += harmonyBoost * 2;
        
        if (this.config.enableDebug) {
          console.log(`[TIER4] Harmony boost applied: both nodes get +${harmonyBoost}`);
        }
      }
      
      // Track creation event
      this.linkCreationHistory.push({
        link,
        timestamp: Date.now(),
        sourceNode,
        targetNode,
        corruptionApplied: this.config.linkCreationCorruptionSeed,
        harmonyApplied: this.config.harmonyBoostOnLinkCreation * 2
      });
      
      this.stats.linksCreatedThisFrame++;
      
    } catch (err) {
      console.warn('[TIER4_GameplayIntegrationCore] onLinkCreated error:', err);
    }
  }
  
  /**
   * Called when a link is destroyed by player action
   * Applies: cascade cleanup, harmony restoration
   */
  onLinkRemoved(link) {
    if (!link || !this.linkingSystem) return;
    
    try {
      const sourceNode = link.nodes?.[0];
      const targetNode = link.nodes?.[1];
      
      if (!sourceNode || !targetNode) return;
      
      // ====================================================================
      // [1] Detect and Mitigate Cascades
      // Removing corrupted links can prevent cascades
      // ====================================================================
      let cascadeDetected = false;
      if (this.linkCorruptionTransmission) {
        const linkCorruptionLevel = link.userData?.corruptionLevel ?? 0;
        
        // High corruption links are cascade risks
        if (linkCorruptionLevel > 0.6) {
          cascadeDetected = true;
          
          // Apply mitigation to nearby nodes
          this.applyCascadeMitigation(sourceNode);
          this.applyCascadeMitigation(targetNode);
          
          this.stats.cascadesDetected++;
          
          if (this.config.enableDebug) {
            console.log(`[TIER4] Cascade mitigation applied (link corruption: ${linkCorruptionLevel})`);
          }
        }
      }
      
      // ====================================================================
      // [2] Trigger Harmony Restoration
      // Removing bad links heals the network
      // ====================================================================
      if (this.harmonyStabilizationSystem) {
        const harmonyRestore = this.config.linkDestructionHarmonyBoost;
        const radius = this.config.linkDestructionHarmonyRadius;
        
        // Restore source node
        this.harmonyStabilizationSystem.triggerHarmonyPulse(sourceNode, radius, harmonyRestore);
        
        // Restore target node
        this.harmonyStabilizationSystem.triggerHarmonyPulse(targetNode, radius, harmonyRestore);
        
        this.stats.harmonyBoostsApplied += 2;
        this.stats.totalHarmonyRestored += harmonyRestore * 2;
        
        if (this.config.enableDebug) {
          console.log(`[TIER4] Link removal harmony: both nodes get +${harmonyRestore}`);
        }
      }
      
      // Track removal event
      this.linkDestructionHistory.push({
        link,
        timestamp: Date.now(),
        sourceNode,
        targetNode,
        wasCorrupted: cascadeDetected,
        harmonyRestored: this.config.linkDestructionHarmonyBoost * 2
      });
      
      if (cascadeDetected) {
        this.cascadeEventsTriggered.push({
          timestamp: Date.now(),
          sourceNode,
          targetNode
        });
      }
      
      this.stats.linksRemovedThisFrame++;
      
    } catch (err) {
      console.warn('[TIER4_GameplayIntegrationCore] onLinkRemoved error:', err);
    }
  }
  
  /**
   * Apply cascade mitigation to a node and its neighbors
   */
  applyCascadeMitigation(node) {
    if (!node || !this.harmonyStabilizationSystem) return;
    
    const radius = this.config.cascadeMitigationRadius;
    const strength = this.config.cascadeMitigationStrength;
    
    // Apply healing pulse to mitigate cascade
    this.harmonyStabilizationSystem.triggerHarmonyPulse(node, radius, strength);
  }
  
  /**
   * Update per frame (optional for future expansions)
   * Currently all updates are event-driven
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    // Reset frame stats
    this.stats.linksCreatedThisFrame = 0;
    this.stats.linksRemovedThisFrame = 0;
  }
  
  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      linkCreationHistorySize: this.linkCreationHistory.length,
      linkDestructionHistorySize: this.linkDestructionHistory.length,
      cascadeEventsTotal: this.cascadeEventsTriggered.length,
      averageCorruptionPerLink: this.stats.corruptionSeedsApplied > 0 
        ? this.stats.totalCorruptionSeeded / this.stats.corruptionSeedsApplied 
        : 0,
      averageHarmonyPerAction: this.stats.harmonyBoostsApplied > 0 
        ? this.stats.totalHarmonyRestored / this.stats.harmonyBoostsApplied 
        : 0
    };
  }
  
  /**
   * Reset all statistics and history
   */
  resetStats() {
    this.linkCreationHistory = [];
    this.linkDestructionHistory = [];
    this.cascadeEventsTriggered = [];
    
    this.stats = {
      linksCreatedThisFrame: 0,
      linksRemovedThisFrame: 0,
      corruptionSeedsApplied: 0,
      harmonyBoostsApplied: 0,
      cascadesDetected: 0,
      totalCorruptionSeeded: 0,
      totalHarmonyRestored: 0,
      frameUpdateTime: 0
    };
  }
  
  /**
   * Enable/disable debug output
   */
  setDebugMode(enabled) {
    this.config.enableDebug = enabled;
  }
  
  /**
   * Set corruption seed amount on link creation
   */
  setLinkCreationCorruptionSeed(amount) {
    this.config.linkCreationCorruptionSeed = amount;
  }
  
  /**
   * Set harmony boost on link creation
   */
  setLinkCreationHarmonyBoost(amount) {
    this.config.harmonyBoostOnLinkCreation = amount;
  }
  
  /**
   * Set harmony boost on link destruction
   */
  setLinkDestructionHarmonyBoost(amount) {
    this.config.linkDestructionHarmonyBoost = amount;
  }
}

export default TIER4_GameplayIntegrationCore;
