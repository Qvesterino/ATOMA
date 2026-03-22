/**
 * TIER 4: GAMEPLAY INTEGRATION BRIDGE v1.0 (Session 40)
 * 
 * Central orchestration point for all TIER 4 systems
 * 
 * Purpose: Initialize and wire all TIER 4 gameplay layers
 * - Core gameplay logic (link actions → mechanics)
 * - Visual feedback (effects + particles)
 * - UI feedback (notifications + meters)
 * 
 * One-stop integration point for main.js
 */

import { TIER4_GameplayIntegrationCore } from './TIER4_GameplayIntegrationCore_v1.js';
import { TIER4_CorruptionFeedbackVisuals } from './TIER4_CorruptionFeedbackVisuals_v1.js';
import { TIER4_GameplayFeedbackUI } from './TIER4_GameplayFeedbackUI_v1.js';

export class TIER4_GameplayIntegrationBridge {
  constructor(config = {}) {
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableVisualFeedback: config.enableVisualFeedback ?? true,
      enableUIFeedback: config.enableUIFeedback ?? true,
      enableGameplayLogic: config.enableGameplayLogic ?? true,
      
      // Gameplay configuration
      linkCreationCorruptionSeed: config.linkCreationCorruptionSeed ?? 0.1,
      linkCreationHarmonyBoost: config.linkCreationHarmonyBoost ?? 0.3,
      linkDestructionHarmonyBoost: config.linkDestructionHarmonyBoost ?? 0.2,
      cascadeMitigationStrength: config.cascadeMitigationStrength ?? 0.15,
      
      // Visual configuration
      showCorruptionSeedPulse: config.showCorruptionSeedPulse ?? true,
      showCascadeWarning: config.showCascadeWarning ?? true,
      showHarmonyPulse: config.showHarmonyPulse ?? true,
      
      // UI configuration
      uiPosition: config.uiPosition ?? 'top-right',
      uiTheme: config.uiTheme ?? 'neon'
    };
    
    // Subsystems
    this.core = null;
    this.visuals = null;
    this.ui = null;
    
    // System references (wired externally)
    this.linkingSystem = null;
    this.aiNodes = null;
    this.scene = null;
    this.linkCorruptionTransmission = null;
    this.harmonyStabilizationSystem = null;
    this.harmonyVisualConsumer = null;
    
    // Event tracking
    this.isInitialized = false;
  }
  
  /**
   * Initialize all TIER 4 subsystems
   * Call from main.js after all TIER 1-3 systems are ready
   */
  initialize(linkingSystem, aiNodes, scene, linkCorruptionTransmission, harmonyStabilizationSystem, harmonyVisualConsumer = null) {
    if (!linkingSystem || !aiNodes || !scene) {
      console.error('[TIER4_GameplayIntegrationBridge] Missing required systems');
      return false;
    }
    
    this.linkingSystem = linkingSystem;
    this.aiNodes = aiNodes;
    this.scene = scene;
    this.linkCorruptionTransmission = linkCorruptionTransmission;
    this.harmonyStabilizationSystem = harmonyStabilizationSystem;
    this.harmonyVisualConsumer = harmonyVisualConsumer;
    
    try {
      // ====================================================================
      // Initialize Core Gameplay Logic
      // ====================================================================
      if (this.config.enableGameplayLogic) {
        this.core = new TIER4_GameplayIntegrationCore({
          enableDebug: this.config.enableDebug,
          enableLogging: this.config.enableDebug,
          linkCreationCorruptionSeed: this.config.linkCreationCorruptionSeed,
          harmonyBoostOnLinkCreation: this.config.linkCreationHarmonyBoost,
          linkDestructionHarmonyBoost: this.config.linkDestructionHarmonyBoost,
          cascadeMitigationStrength: this.config.cascadeMitigationStrength
        });
        
        // Wire to TIER 1 systems
        this.core.initialize(
          this.linkingSystem,
          this.aiNodes,
          this.linkCorruptionTransmission,
          this.harmonyStabilizationSystem
        );
        
        console.log('[TIER4_GameplayIntegrationBridge] Core gameplay logic initialized ✓');
      }
      
      // ====================================================================
      // Initialize Visual Feedback Systems
      // ====================================================================
      if (this.config.enableVisualFeedback) {
        this.visuals = new TIER4_CorruptionFeedbackVisuals(scene, {
          enableDebug: this.config.enableDebug,
          showCorruptionSeedPulse: this.config.showCorruptionSeedPulse,
          showCascadeWarning: this.config.showCascadeWarning,
          showHarmonyPulse: this.config.showHarmonyPulse,
          harmonyFieldConsumer: this.harmonyVisualConsumer
        });
        
        // Wire to core for visual event triggers
        if (this.core) {
          this.core.visualFeedback = this.visuals;
        }
        
        console.log('[TIER4_GameplayIntegrationBridge] Visual feedback initialized ✓');
      }
      
      // ====================================================================
      // Initialize UI Feedback Systems
      // ====================================================================
      if (this.config.enableUIFeedback) {
        this.ui = new TIER4_GameplayFeedbackUI({
          enableDebug: this.config.enableDebug,
          position: this.config.uiPosition,
          theme: this.config.uiTheme
        });
        
        // Wire to core for UI event triggers
        if (this.core) {
          this.core.uiFeedback = this.ui;
        }
        
        console.log('[TIER4_GameplayIntegrationBridge] UI feedback initialized ✓');
      }
      
      // ====================================================================
      // Wire Event Callbacks Between Systems
      // ====================================================================
      this.wireEventCallbacks();
      
      this.isInitialized = true;
      
      console.log('[TIER4_GameplayIntegrationBridge] All TIER 4 systems initialized ✓');
      return true;
      
    } catch (err) {
      console.error('[TIER4_GameplayIntegrationBridge] Initialization error:', err);
      return false;
    }
  }
  
  /**
   * Wire event callbacks between core logic and visual/UI systems
   */
  wireEventCallbacks() {
    if (!this.core) return;

    // Hook into core events to trigger visual feedback
    const originalOnLinkCreated = this.core.onLinkCreated.bind(this.core);
    this.core.onLinkCreated = (sourceNode, targetNode) => {
      originalOnLinkCreated(sourceNode, targetNode);

      // Trigger visual feedback
      if (this.visuals && sourceNode) {
        this.visuals.displayCorruptionSeed(sourceNode);
        this.visuals.displayHarmonyPulse(targetNode);
      }

      // Trigger UI feedback
      if (this.ui && sourceNode && targetNode) {
        this.ui.notifyLinkCreated(
          sourceNode,
          targetNode,
          this.config.linkCreationCorruptionSeed
        );

        this.ui.notifyHarmonyBoost(2, this.config.linkCreationHarmonyBoost);
      }
    };

    const originalOnLinkRemoved = this.core.onLinkRemoved.bind(this.core);
    this.core.onLinkRemoved = (sourceNode, targetNode) => {
      originalOnLinkRemoved(sourceNode, targetNode);

      // Get link corruption level before removal
      let wasCorrupted = false;
      let corruptionLevel = 0;
      const link = this.core?.getLink(sourceNode, targetNode);
      if (link) {
        corruptionLevel = link.userData?.corruptionLevel ?? 0;
        wasCorrupted = corruptionLevel > 0.6;
      }

      if (wasCorrupted && this.visuals && sourceNode) {
        this.visuals.displayCascadeWarning(sourceNode);
        this.visuals.displayCascadeWarning(targetNode);
      }

      // Trigger UI feedback
      if (this.ui && sourceNode && targetNode) {
        this.ui.notifyLinkDestroyed(
          sourceNode,
          targetNode,
          this.config.linkDestructionHarmonyBoost
        );

        if (wasCorrupted) {
          this.ui.notifyCascadeWarning(
            sourceNode,
            corruptionLevel
          );
        }
      }
    };
  }
  
  /**
   * Update all subsystems per frame
   * Call from main.js animation loop
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (!this.isInitialized) return;

    // Update visual effects
    if (this.visuals) {
      this.visuals.update(deltaTime);
    }

    // Update UI health meter (corruption + harmony)
    if (this.ui && this.linkCorruptionTransmission && this.harmonyStabilizationSystem) {
      const corruptionLevel = this.linkCorruptionTransmission.getNetworkCorruption() || 0;
      const harmonyLevel = this.harmonyStabilizationSystem.getNetworkHarmony() || 0;
      this.ui.updateNetworkHealthMeter(corruptionLevel, harmonyLevel);
    }

    // Core updates happen via event callbacks (no per-frame update needed currently)
  }
  
  /**
   * Get statistics from all subsystems
   */
  getStats() {
    const stats = {
      initialized: this.isInitialized,
      subsystems: {}
    };
    
    if (this.core) {
      stats.subsystems.core = this.core.getStats();
    }
    
    if (this.visuals) {
      stats.subsystems.visuals = this.visuals.getStats();
    }
    
    if (this.ui) {
      stats.subsystems.ui = this.ui.getStats();
    }
    
    return stats;
  }
  
  /**
   * Reset all statistics
   */
  resetStats() {
    if (this.core) {
      this.core.resetStats();
    }
  }
  
  /**
   * Set debug mode for all subsystems
   */
  setDebugMode(enabled) {
    if (this.core) {
      this.core.setDebugMode(enabled);
    }
    if (this.visuals) {
      this.visuals.config.enableDebug = enabled;
    }
    if (this.ui) {
      this.ui.config.enableDebug = enabled;
    }
  }
  
  /**
   * Clear all visual and UI effects
   */
  clear() {
    if (this.visuals) {
      this.visuals.clear();
    }
    
    if (this.ui) {
      this.ui.clear();
    }
  }
  
  /**
   * Dispose all resources
   */
  dispose() {
    this.clear();
    
    if (this.visuals) {
      this.visuals.dispose();
    }
    
    if (this.ui) {
      this.ui.dispose();
    }
    
    this.isInitialized = false;
  }
}

export default TIER4_GameplayIntegrationBridge;
