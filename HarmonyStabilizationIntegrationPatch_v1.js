/**
 * HARMONY STABILIZATION INTEGRATION PATCH v1.0
 * 
 * Non-breaking integration patch for HarmonyStabilizationSystem_v1
 * 
 * Provides:
 * - Automatic system initialization
 * - Safe patches to AINodes and link system
 * - Extension methods for easy integration
 * - Performance monitoring
 * - Lifecycle management
 * 
 * Integration points:
 * 1. AINodes.harmonySystem - Main system instance
 * 2. AINodes.updateNodeHarmony(deltaTime) - Call in main loop
 * 3. Node.userData.harmonyLevel - Harmony value (0-1)
 * 4. Node.userData.harmonyVisualState - Visual parameters
 * 5. Link.userData.harmonyLevel - Link harmony (0-1)
 * 
 * USAGE:
 * 
 * 1. In main.js (after AINodes created):
 *    import { HarmonyStabilizationIntegrationPatch_v1 } from './HarmonyStabilizationIntegrationPatch_v1.js';
 *    HarmonyStabilizationIntegrationPatch_v1.patchAINodes(aiNodes, NodeLinkingSystem);
 * 
 * 2. In main update loop:
 *    if (aiNodes.harmonySystem) {
 *      aiNodes.harmonySystem.updateHarmony(deltaTime);
 *    }
 * 
 * 3. Optional - enable debug API:
 *    aiNodes.harmonySystem.debugMode = true;
 *    // Then use window.harmonyDebug.*
 */

import { HarmonyStabilizationSystem_v1 } from './HarmonyStabilizationSystem_v1.js';

export class HarmonyStabilizationIntegrationPatch_v1 {
  /**
   * Apply integration patches to AINodes
   * 
   * @param {Object} aiNodesInstance - The AINodes instance
   * @param {Object} linkSystemInstance - NodeLinkingSystem instance
   * @param {Boolean} debugMode - Enable debug logging
   */
  static patchAINodes(aiNodesInstance, linkSystemInstance, debugMode = false) {
    if (!aiNodesInstance) {
      console.error('[HarmonyStabilizationIntegrationPatch_v1] AINodes instance required');
      return;
    }

    // Initialize system
    if (!aiNodesInstance.harmonySystem) {
      aiNodesInstance.harmonySystem = new HarmonyStabilizationSystem_v1(
        aiNodesInstance,
        linkSystemInstance,
        debugMode
      );

      if (debugMode) {
        console.log('%c[HarmonyStabilizationIntegrationPatch_v1] Initialized', 'color: #00ffff;');
      }
    }

    // Add convenience method to AINodes
    if (!aiNodesInstance.updateNodeHarmony) {
      aiNodesInstance.updateNodeHarmony = function(deltaTime) {
        if (this.harmonySystem) {
          this.harmonySystem.updateHarmony(deltaTime);
        }
      };
    }

    // Add method to get node harmony info
    if (!aiNodesInstance.getNodeHarmonyInfo) {
      aiNodesInstance.getNodeHarmonyInfo = function(node) {
        if (this.harmonySystem) {
          return this.harmonySystem.getNodeHarmonyInfo(node);
        }
        return null;
      };
    }

    // Add method to set node harmony
    if (!aiNodesInstance.setNodeHarmonyLevel) {
      aiNodesInstance.setNodeHarmonyLevel = function(node, level) {
        if (this.harmonySystem) {
          this.harmonySystem.setNodeHarmony(node, level);
        }
      };
    }

    // Add method to set link harmony
    if (!aiNodesInstance.setLinkHarmonyLevel) {
      aiNodesInstance.setLinkHarmonyLevel = function(link, level) {
        if (this.harmonySystem) {
          this.harmonySystem.setLinkHarmony(link, level);
        }
      };
    }

    // Add method to trigger pulse
    if (!aiNodesInstance.triggerHarmonyPulse) {
      aiNodesInstance.triggerHarmonyPulse = function(node, radius = 2.0, intensity = 0.5) {
        if (this.harmonySystem) {
          return this.harmonySystem.triggerHarmonyPulse(node, radius, intensity);
        }
      };
    }

    // Store reference to link system for later use
    if (!aiNodesInstance.linkSystemInstance) {
      aiNodesInstance.linkSystemInstance = linkSystemInstance;
    }

    return aiNodesInstance.harmonySystem;
  }

  /**
   * Integrate harmony into main game loop
   * Call this in your main update/animate function
   * 
   * @param {Object} aiNodes - AINodes instance
   * @param {Number} deltaTime - Frame delta time
   */
  static updateGameLoop(aiNodes, deltaTime) {
    if (!aiNodes || !aiNodes.harmonySystem) return;
    
    aiNodes.harmonySystem.updateHarmony(deltaTime);
  }

  /**
   * Setup correlation between corruption and harmony
   * Harmony automatically fights corruption
   * 
   * @param {Object} aiNodes - AINodes instance
   */
  static setupCorruptionCounterplay(aiNodes) {
    if (!aiNodes || !aiNodes.harmonySystem) return;

    // This is automatic - harmony reduces corruption on nodes/links
    // during updateHarmony() calls
    
    console.log('[HarmonyStabilizationIntegrationPatch_v1] Corruption counterplay active');
  }

  /**
   * Setup visual integration
   * Harmony visuals fade/override corruption visuals
   * 
   * @param {Object} aiNodes - AINodes instance
   * @param {Object} corruptionVisualFX - CorruptionVisualFX_v1 instance
   */
  static setupVisualIntegration(aiNodes, corruptionVisualFX) {
    if (!aiNodes || !aiNodes.harmonySystem || !corruptionVisualFX) return;

    // Store reference
    aiNodes.harmonySystem.visualFXLayer = corruptionVisualFX;

    console.log('[HarmonyStabilizationIntegrationPatch_v1] Visual integration setup');
  }

  /**
   * Performance monitoring - returns stats
   * 
   * @param {Object} aiNodes - AINodes instance
   * @returns {Object} Performance stats
   */
  static getPerformanceStats(aiNodes) {
    if (!aiNodes || !aiNodes.harmonySystem) return null;

    return aiNodes.harmonySystem.getNodeHarmonyInfo ? 
      window.harmonyDebug?.networkHarmonyStats?.() : null;
  }

  /**
   * Reset entire harmony system
   * 
   * @param {Object} aiNodes - AINodes instance
   */
  static resetSystem(aiNodes) {
    if (!aiNodes || !aiNodes.harmonySystem) return;

    aiNodes.harmonySystem.nodeHarmony.clear();
    aiNodes.harmonySystem.linkHarmony.clear();
    aiNodes.harmonySystem.oasisZones.clear();
    aiNodes.harmonySystem.activePulses = [];
    aiNodes.harmonySystem.harmonyQueue = [];

    console.log('[HarmonyStabilizationIntegrationPatch_v1] System reset');
  }

  /**
   * Complete integration setup
   * Call once at startup after all systems initialized
   * 
   * @param {Object} aiNodes - AINodes instance
   * @param {Object} nodeLinkingSystem - Link system instance
   * @param {Object} corruptionVisualFX - Visual FX instance (optional)
   * @param {Boolean} debugMode - Enable debug logging
   */
  static completeSetup(aiNodes, nodeLinkingSystem, corruptionVisualFX = null, debugMode = false) {
    console.log('%c[HarmonyStabilizationIntegrationPatch_v1] Starting complete setup', 'color: #00ffff;');

    // 1. Patch AINodes with system
    this.patchAINodes(aiNodes, nodeLinkingSystem, debugMode);

    // 2. Setup counterplay to corruption
    this.setupCorruptionCounterplay(aiNodes);

    // 3. Setup visual integration if available
    if (corruptionVisualFX) {
      this.setupVisualIntegration(aiNodes, corruptionVisualFX);
    }

    // 4. Setup debug API
    if (debugMode) {
      window.harmonyIntegrationDebug = {
        stats: () => {
          return window.harmonyDebug?.networkHarmonyStats?.();
        },
        reset: () => {
          HarmonyStabilizationIntegrationPatch_v1.resetSystem(aiNodes);
        },
        system: () => aiNodes.harmonySystem
      };
      console.log('%c[HarmonyStabilizationIntegrationPatch_v1] Integration debug API ready', 'color: #00ff00;');
    }

    console.log('%c[HarmonyStabilizationIntegrationPatch_v1] Setup complete', 'color: #00ff00;');
    return aiNodes.harmonySystem;
  }

  /**
   * Create a harmony network - seeds multiple harmony nodes
   * 
   * @param {Object} aiNodes - AINodes instance
   * @param {Array} seedNodes - Nodes to start harmony from
   * @param {Number} harmonyLevel - Starting level (0-1)
   */
  static seedHarmonyNetwork(aiNodes, seedNodes, harmonyLevel = 0.7) {
    if (!aiNodes || !aiNodes.harmonySystem) return;

    const system = aiNodes.harmonySystem;
    
    for (const node of seedNodes) {
      system.setNodeHarmony(node, harmonyLevel);
    }

    console.log(`[HarmonyStabilizationIntegrationPatch_v1] Seeded ${seedNodes.length} nodes with harmony`);
  }

  /**
   * Trigger network-wide harmony wave
   * 
   * @param {Object} aiNodes - AINodes instance
   * @param {Number} intensity - Wave intensity (0-1)
   */
  static triggerNetworkHarmonyWave(aiNodes, intensity = 0.5) {
    if (!aiNodes || !aiNodes.harmonySystem) return;

    const system = aiNodes.harmonySystem;
    const allNodes = system.getAllNodes();

    for (const node of allNodes) {
      system.triggerHarmonyPulse(node, 2.0, intensity);
    }

    console.log(`[HarmonyStabilizationIntegrationPatch_v1] Network harmony wave triggered (intensity: ${intensity})`);
  }

  /**
   * Create regional harmony oasis
   * 
   * @param {Object} aiNodes - AINodes instance
   * @param {Array} oasisNodes - Central nodes for oasis
   */
  static createRegionalOasis(aiNodes, oasisNodes) {
    if (!aiNodes || !aiNodes.harmonySystem) return;

    const system = aiNodes.harmonySystem;

    // Boost oasis nodes to high harmony
    for (const node of oasisNodes) {
      system.setNodeHarmony(node, 0.9);
    }

    // Trigger pulses from each
    for (const node of oasisNodes) {
      system.triggerHarmonyPulse(node, 3.0, 0.6);
    }

    console.log(`[HarmonyStabilizationIntegrationPatch_v1] Regional oasis created with ${oasisNodes.length} nodes`);
  }
}

/**
 * Apply harmony stabilization integration to main instance
 * 
 * This function connects HarmonyStabilizationSystem_v1 with downstream systems
 * and ensures consistent writing of harmonyLevel.
 * 
 * @param {Object} harmonySystem - HarmonyStabilizationSystem_v1 instance
 * @param {Object} mainInstance - Main application instance
 * 
 * Integration points:
 * - Stores reference to harmony system on main instance
 * - Sets up update loop integration
 * - Ensures harmonyLevel is properly distributed to downstream systems
 * - Guards against duplicate writes
 * - Does not override existing values without checking
 */
export function applyHarmonyStabilizationIntegration(harmonySystem, mainInstance) {
  if (!harmonySystem) {
    console.error('[HarmonyStabilizationIntegration] harmonySystem parameter is required');
    return;
  }

  if (!mainInstance) {
    console.error('[HarmonyStabilizationIntegration] mainInstance parameter is required');
    return;
  }

  // Store reference to harmony system on main instance (guarded)
  if (!mainInstance.harmonySystem) {
    mainInstance.harmonySystem = harmonySystem;
  } else if (mainInstance.harmonySystem !== harmonySystem) {
    console.warn('[HarmonyStabilizationIntegration] mainInstance.harmonySystem already exists and is different. Skipping assignment.');
  }

  // Store reference to aiNodes if available (guarded)
  if (mainInstance.aiNodes && !mainInstance.aiNodes.harmonySystem) {
    mainInstance.aiNodes.harmonySystem = harmonySystem;
  }

  // Ensure linkCorruptionTransmission is connected if available (guarded)
  if (mainInstance.linkCorruptionTransmission && !harmonySystem.linkCorruptionTransmission) {
    harmonySystem.linkCorruptionTransmission = mainInstance.linkCorruptionTransmission;
  }

  // Setup update loop integration - add method to main instance if not exists
  if (!mainInstance.updateHarmonySystem) {
    mainInstance.updateHarmonySystem = function(deltaTime = 1/60) {
      if (this.harmonySystem) {
        this.harmonySystem.updateHarmony(deltaTime);
      }
    };
  }

  // Add convenience method to get node harmony info (guarded)
  if (mainInstance.aiNodes && !mainInstance.aiNodes.getNodeHarmonyInfo) {
    mainInstance.aiNodes.getNodeHarmonyInfo = function(node) {
      if (this.harmonySystem) {
        return this.harmonySystem.getNodeHarmonyInfo ? 
               this.harmonySystem.getNodeHarmonyInfo(node) : 
               this.harmonySystem.nodeHarmony.get(node.id);
      }
      return null;
    };
  }

  // Add method to set node harmony (guarded)
  if (mainInstance.aiNodes && !mainInstance.aiNodes.setNodeHarmonyLevel) {
    mainInstance.aiNodes.setNodeHarmonyLevel = function(node, level) {
      if (this.harmonySystem) {
        this.harmonySystem.setNodeHarmony(node, level);
      }
    };
  }

  // Add method to set link harmony (guarded)
  if (mainInstance.aiNodes && !mainInstance.aiNodes.setLinkHarmonyLevel) {
    mainInstance.aiNodes.setLinkHarmonyLevel = function(link, level) {
      if (this.harmonySystem) {
        this.harmonySystem.setLinkHarmony(link, level);
      }
    };
  }

  // Add method to trigger harmony pulse (guarded)
  if (mainInstance.aiNodes && !mainInstance.aiNodes.triggerHarmonyPulse) {
    mainInstance.aiNodes.triggerHarmonyPulse = function(node, radius = 2.0, intensity = 0.5) {
      if (this.harmonySystem) {
        return this.harmonySystem.triggerHarmonyPulse(node, radius, intensity);
      }
    };
  }

  console.log('[HarmonyStabilizationIntegration] Integration applied successfully');
  console.log('[HarmonyStabilizationIntegration] - Harmony system connected to main instance');
  console.log('[HarmonyStabilizationIntegration] - Update loop integration ready');
  console.log('[HarmonyStabilizationIntegration] - Downstream system integration complete');

  return harmonySystem;
}

export default HarmonyStabilizationIntegrationPatch_v1;
