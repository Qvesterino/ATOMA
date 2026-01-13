/**
 * LINK CORRUPTION TRANSMISSION INTEGRATION PATCH v1.0
 * 
 * Non-breaking integration patch for LinkCorruptionTransmission_v1
 * 
 * Provides:
 * - Automatic system initialization
 * - Safe patches to AINodes and link system
 * - Extension methods for easy integration
 * - Performance monitoring
 * - Lifecycle management
 * 
 * Integration points:
 * 1. AINodes.linkCorruption - Main system instance
 * 2. AINodes.updateLinkCorruption(deltaTime) - Call in main loop
 * 3. Link.userData.corruptionLevel - Corruption value (0-1)
 * 4. Link.userData.corruptionVisualState - Visual parameters
 * 
 * USAGE:
 * 
 * 1. In main.js (after AINodes created):
 *    import { LinkCorruptionTransmissionIntegrationPatch_v1 } from './LinkCorruptionTransmissionIntegrationPatch_v1.js';
 *    LinkCorruptionTransmissionIntegrationPatch_v1.patchAINodes(aiNodes, NodeLinkingSystem);
 * 
 * 2. In main update loop:
 *    if (aiNodes.linkCorruption) {
 *      aiNodes.linkCorruption.updateTransmission(deltaTime);
 *    }
 * 
 * 3. Optional - enable debug API:
 *    aiNodes.linkCorruption.debugMode = true;
 *    // Then use window.linkCorruptionDebug.*
 */

import { LinkCorruptionTransmission_v1 } from './LinkCorruptionTransmission_v1.js';

export class LinkCorruptionTransmissionIntegrationPatch_v1 {
  /**
   * Apply integration patches to AINodes
   * 
   * @param {Object} aiNodesInstance - The AINodes instance
   * @param {Object} linkSystemInstance - NodeLinkingSystem instance
   * @param {Boolean} debugMode - Enable debug logging
   */
  static patchAINodes(aiNodesInstance, linkSystemInstance, debugMode = false) {
    if (!aiNodesInstance) {
      console.error('[LinkCorruptionTransmissionIntegrationPatch_v1] AINodes instance required');
      return;
    }

    // Initialize system
    if (!aiNodesInstance.linkCorruption) {
      aiNodesInstance.linkCorruption = new LinkCorruptionTransmission_v1(
        aiNodesInstance,
        linkSystemInstance,
        debugMode
      );

      if (debugMode) {
        console.log('%c[LinkCorruptionTransmissionIntegrationPatch_v1] Initialized', 'color: #ff00ff;');
      }
    }

    // Add convenience method to AINodes
    if (!aiNodesInstance.updateLinkCorruption) {
      aiNodesInstance.updateLinkCorruption = function(deltaTime) {
        if (this.linkCorruption) {
          this.linkCorruption.updateTransmission(deltaTime);
        }
      };
    }

    // Add method to get link corruption info
    if (!aiNodesInstance.getLinkCorruptionInfo) {
      aiNodesInstance.getLinkCorruptionInfo = function(link) {
        if (this.linkCorruption) {
          return this.linkCorruption.getLinkInfo(link);
        }
        return null;
      };
    }

    // Add method to set link corruption
    if (!aiNodesInstance.setLinkCorruptionLevel) {
      aiNodesInstance.setLinkCorruptionLevel = function(link, level) {
        if (this.linkCorruption) {
          this.linkCorruption.setLinkCorruption(link, level);
        }
      };
    }

    // Add method to trigger cascade
    if (!aiNodesInstance.triggerLinkCascade) {
      aiNodesInstance.triggerLinkCascade = function(node) {
        if (this.linkCorruption) {
          this.linkCorruption.triggeCascadeToOutboundLinks(node);
        }
      };
    }

    // Store reference to link system for later use
    if (!aiNodesInstance.linkSystemInstance) {
      aiNodesInstance.linkSystemInstance = linkSystemInstance;
    }

    return aiNodesInstance.linkCorruption;
  }

  /**
   * Integrate corruption transmission into main game loop
   * Call this in your main update/animate function
   * 
   * @param {Object} aiNodes - AINodes instance
   * @param {Number} deltaTime - Frame delta time
   */
  static updateGameLoop(aiNodes, deltaTime) {
    if (!aiNodes || !aiNodes.linkCorruption) return;
    
    aiNodes.linkCorruption.updateTransmission(deltaTime);
  }

  /**
   * Connect link corruption to visual rendering
   * Patches link rendering to use corruption visuals
   * 
   * @param {Object} linkRenderer - Link rendering system
   * @param {Object} aiNodes - AINodes instance
   */
  static patchLinkRenderer(linkRenderer, aiNodes) {
    if (!linkRenderer || !aiNodes || !aiNodes.linkCorruption) return;

    const originalRender = linkRenderer.render;
    
    linkRenderer.render = function(...args) {
      // Apply corruption visuals before rendering
      if (this.links) {
        for (const link of this.links) {
          const linkData = aiNodes.linkCorruption.linkCorruption.get(link.id);
          if (linkData) {
            // Apply to material if available
            if (link.material) {
              const vis = link.userData?.corruptionVisualState;
              if (vis && link.material.uniforms) {
                if (link.material.uniforms.corruptionTint) {
                  link.material.uniforms.corruptionTint.value.set(vis.colorTint.r, vis.colorTint.g, vis.colorTint.b);
                }
                if (link.material.uniforms.glowIntensity) {
                  link.material.uniforms.glowIntensity.value = vis.glowIntensity;
                }
                if (link.material.uniforms.distortionAmount) {
                  link.material.uniforms.distortionAmount.value = vis.distortionAmount;
                }
              }
            }
          }
        }
      }

      // Call original render
      return originalRender.apply(this, args);
    };
  }

  /**
   * Setup correlation between node corruption and link transmission
   * Automatically spreads node corruption through links
   * 
   * @param {Object} aiNodes - AINodes instance
   */
  static setupCorrelationLoop(aiNodes) {
    if (!aiNodes || !aiNodes.linkCorruption) return;

    // Store original update
    const originalUpdate = aiNodes.linkCorruption.updateTransmission;

    aiNodes.linkCorruption.updateTransmissionWithCorrelation = function(deltaTime) {
      // First update all link corruption
      originalUpdate.call(this, deltaTime);

      // Then propagate back to nodes if enabled
      const allLinks = this.getAllLinks();
      for (const link of allLinks) {
        const targetNode = link.target || link.targetNode;
        const linkData = this.linkCorruption.get(link.id);

        if (targetNode && linkData && linkData.level > 0.5) {
          // Link corruption above 50% begins infecting target node
          const infectionRate = (linkData.level - 0.5) * 0.1; // 0-5% per frame
          const currentCorruption = targetNode.userData?.corruption || 0;
          targetNode.userData.corruption = Math.min(1.0, currentCorruption + infectionRate * deltaTime);
        }
      }
    };

    return aiNodes.linkCorruption;
  }

  /**
   * Setup visual feedback integration
   * Connects corruption effects to visual layer
   * 
   * @param {Object} aiNodes - AINodes instance
   * @param {Object} corruptionVisualFX - CorruptionVisualFX_v1 instance
   */
  static setupVisualIntegration(aiNodes, corruptionVisualFX) {
    if (!aiNodes || !aiNodes.linkCorruption || !corruptionVisualFX) return;

    // Store reference
    aiNodes.linkCorruption.visualFXLayer = corruptionVisualFX;

    // After updating corruption, apply visual effects
    const originalUpdate = aiNodes.linkCorruption.updateTransmission;

    aiNodes.linkCorruption.updateTransmissionWithVisuals = function(deltaTime) {
      originalUpdate.call(this, deltaTime);

      // Apply visual effects to affected nodes
      const allLinks = this.getAllLinks();
      const affectedNodes = new Set();

      for (const link of allLinks) {
        const linkData = this.linkCorruption.get(link.id);
        if (linkData && linkData.level > 0.3) {
          const targetNode = link.target || link.targetNode;
          if (targetNode) affectedNodes.add(targetNode);
        }
      }

      // Update visuals for affected nodes
      for (const node of affectedNodes) {
        if (this.visualFXLayer && node.userData?.corruption) {
          // Let visual layer handle corruption rendering
          this.visualFXLayer.applyCorruptionEffects(node, deltaTime);
        }
      }
    };
  }

  /**
   * Performance monitoring - returns stats
   * 
   * @param {Object} aiNodes - AINodes instance
   * @returns {Object} Performance stats
   */
  static getPerformanceStats(aiNodes) {
    if (!aiNodes || !aiNodes.linkCorruption) return null;

    const system = aiNodes.linkCorruption;
    const allLinks = system.getAllLinks();
    
    let totalCorruption = 0;
    let cascadeCount = 0;
    let maxCorruptionLevel = 0;

    for (const linkData of system.linkCorruption.values()) {
      totalCorruption += linkData.level;
      cascadeCount += linkData.cascadeThresholdsCrossed.size;
      maxCorruptionLevel = Math.max(maxCorruptionLevel, linkData.level);
    }

    return {
      totalLinks: allLinks.length,
      trackedLinks: system.linkCorruption.size,
      averageCorruption: allLinks.length > 0 ? totalCorruption / allLinks.length : 0,
      maxCorruptionLevel: maxCorruptionLevel,
      cascadeEventsTriggered: cascadeCount,
      queuedEvents: system.transmissionQueue.length,
      cascadeHistorySize: system.cascadeHistory.length,
      updateInterval: system.updateInterval
    };
  }

  /**
   * Reset entire system
   * 
   * @param {Object} aiNodes - AINodes instance
   */
  static resetSystem(aiNodes) {
    if (!aiNodes || !aiNodes.linkCorruption) return;

    aiNodes.linkCorruption.linkCorruption.clear();
    aiNodes.linkCorruption.activeCascades.clear();
    aiNodes.linkCorruption.cascadeHistory = [];
    aiNodes.linkCorruption.transmissionQueue = [];

    console.log('[LinkCorruptionTransmissionIntegrationPatch_v1] System reset');
  }

  /**
   * Complete integration example setup
   * Call once at startup after all systems initialized
   * 
   * @param {Object} aiNodes - AINodes instance
   * @param {Object} nodeLinkingSystem - Link system instance
   * @param {Object} corruptionVisualFX - Visual FX instance (optional)
   * @param {Boolean} debugMode - Enable debug logging
   */
  static completeSetup(aiNodes, nodeLinkingSystem, corruptionVisualFX = null, debugMode = false) {
    console.log('%c[LinkCorruptionTransmissionIntegrationPatch_v1] Starting complete setup', 'color: #ffff00;');

    // 1. Patch AINodes with system
    this.patchAINodes(aiNodes, nodeLinkingSystem, debugMode);

    // 2. Setup correlation loop if visual FX available
    if (corruptionVisualFX) {
      this.setupVisualIntegration(aiNodes, corruptionVisualFX);
    } else {
      this.setupCorrelationLoop(aiNodes);
    }

    // 3. Setup debug API
    if (debugMode) {
      window.linkCorruptionIntegrationDebug = {
        stats: () => {
          const stats = LinkCorruptionTransmissionIntegrationPatch_v1.getPerformanceStats(aiNodes);
          console.table(stats);
          return stats;
        },
        reset: () => {
          LinkCorruptionTransmissionIntegrationPatch_v1.resetSystem(aiNodes);
        },
        system: () => aiNodes.linkCorruption
      };
      console.log('%c[LinkCorruptionTransmissionIntegrationPatch_v1] Integration debug API ready', 'color: #00ff00;');
    }

    console.log('%c[LinkCorruptionTransmissionIntegrationPatch_v1] Setup complete', 'color: #00ff00;');
    return aiNodes.linkCorruption;
  }
}

export default LinkCorruptionTransmissionIntegrationPatch_v1;
