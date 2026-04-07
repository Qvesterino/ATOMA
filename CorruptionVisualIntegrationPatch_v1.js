/**
 * CORRUPTION VISUAL INTEGRATION PATCH v1.0
 * 
 * Integrates CorruptionVisualFX_v1 into the ArchetypeVisualDifferentiationSystem_v1
 * and AINodes system.
 * 
 * Features:
 * - Automatic corruption effect application during visual updates
 * - Non-breaking integration with existing visual systems
 * - Safe mode compatible
 * - Optional particle system integration
 * - Debug console API
 */

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

if (!THREE_SAFE) {
  console.warn('[CorruptionVisualIntegrationPatch] THREE not detected – enabling SAFE MODE.');
}

const THREE = THREE_SAFE;

import { CorruptionVisualFX_v1 } from './CorruptionVisualFX_v1.js';
import { setMetric } from './src/metrics/NodeMetricEngine.js';

function readNodeCorruptionLevel(node) {
  return (
    node?.userData?.metrics?.corruption ??
    node?.userData?.gameplay?.corruptionLevel ??
    node?.userData?.corruptionLevel ??
    node?.userData?.corruption ??
    0
  );
}

function ensureCorruptionBranches(node) {
  if (!node?.userData) return null;
  const userData = node.userData;
  if (!userData.metrics) userData.metrics = {};
  if (!userData.gameplay) userData.gameplay = {};
  if (!userData.visualState) userData.visualState = {};
  return userData;
}

function writeCanonicalCorruption(node, value, isCorrupted = null) {
  const userData = ensureCorruptionBranches(node);
  if (!userData) return;

  const normalized = Math.max(0, Math.min(1, Number(value) || 0));
  setMetric(node, 'corruption', normalized, { source: 'CorruptionVisualIntegrationPatch' });

  // Compatibility mirror for legacy consumers while canonical data lives in metrics.
  userData.corruption = normalized;
  userData.corruptionLevel = normalized;
  userData.gameplay.corruptionLevel = normalized;
  userData.visualState.corruptionLevel = normalized;

  if (isCorrupted !== null) {
    userData.gameplay.isCorrupted = !!isCorrupted;
    userData.visualState.isCorrupted = !!isCorrupted;
  }
}

/**
 * Patch ArchetypeVisualDifferentiationSystem to include corruption effects
 */
export function patchArchetypeVisualWithCorruptionFX(archetypeVisualSystem, aiNodesInstance, debugMode = false) {
  if (!archetypeVisualSystem) {
    console.error('[CorruptionVisualIntegrationPatch] ArchetypeVisualDifferentiationSystem required');
    return null;
  }

  // Create corruption FX engine
  const corruptionFX = new CorruptionVisualFX_v1(aiNodesInstance, debugMode);
  archetypeVisualSystem.corruptionFX = corruptionFX;

  if (debugMode) {
    console.log('%c[CorruptionVisualIntegrationPatch] Patching archetype visual system', 
      'color: #ff4400; font-weight: bold;');
  }

  // ═══════════════════════════════════════════════════════════════════
  // PATCH: updateArchetypeEffects
  // Inject corruption FX into visual update pipeline
  // ═══════════════════════════════════════════════════════════════════
  const originalUpdateArchetypeEffects = archetypeVisualSystem.updateArchetypeEffects?.bind(archetypeVisualSystem);
  
  if (originalUpdateArchetypeEffects) {
    archetypeVisualSystem.updateArchetypeEffects = function(nodeModel, deltaTime, time) {
      // Call original effect updates
      originalUpdateArchetypeEffects(nodeModel, deltaTime, time);

      // Apply corruption effects on top
      if (corruptionFX && readNodeCorruptionLevel(nodeModel) > 0) {
        corruptionFX.applyCorruptionEffects(nodeModel, deltaTime, time);
      }
    };

    if (debugMode) {
      console.log('%c[Patch] updateArchetypeEffects wrapped with corruption FX', 'color: #00ff88;');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PATCH: update (main visual loop)
  // Update particles and maintain visual state
  // ═══════════════════════════════════════════════════════════════════
  const originalUpdate = archetypeVisualSystem.update?.bind(archetypeVisualSystem) ||
                        archetypeVisualSystem.constructor.prototype.update?.bind(archetypeVisualSystem);

  if (originalUpdate) {
    archetypeVisualSystem.update = function(deltaTime, time) {
      // Call original update
      if (originalUpdate) originalUpdate(deltaTime, time);

      // Update corruption particles
      corruptionFX.updateParticles(deltaTime);

      if (debugMode && Math.random() < 0.01) { // Occasional debug log
        console.log(`%c[Particles] Active: ${corruptionFX.activeParticles.length}`, 'color: #ffaa00;');
      }
    };

    if (debugMode) {
      console.log('%c[Patch] update wrapped with particle updates', 'color: #00ff88;');
    }
  }

  if (debugMode) {
    console.log('%c[CorruptionVisualIntegrationPatch] Integration complete', 
      'color: #ff4400; font-weight: bold;', {
      corruptionFX: corruptionFX
    });
  }

  return corruptionFX;
}

/**
 * Patch AINodes to include corruption FX system
 */
export function patchAINodesWithCorruptionFX(aiNodesInstance, debugMode = false) {
  if (!aiNodesInstance) {
    console.error('[CorruptionVisualIntegrationPatch] AINodes instance required');
    return null;
  }

  // Create corruption FX engine
  const corruptionFX = new CorruptionVisualFX_v1(aiNodesInstance, debugMode);
  aiNodesInstance.corruptionFX = corruptionFX;

  if (debugMode) {
    console.log('%c[CorruptionVisualIntegrationPatch] Patching AINodes', 
      'color: #ff4400; font-weight: bold;');
  }

  // ═══════════════════════════════════════════════════════════════════
  // PATCH: updateNodeVisuals
  // Apply corruption effects during node visual updates
  // ═══════════════════════════════════════════════════════════════════
  const originalUpdateNodeVisuals = aiNodesInstance.updateNodeVisuals?.bind(aiNodesInstance);

  if (originalUpdateNodeVisuals) {
    aiNodesInstance.updateNodeVisuals = function(node, data, time, deltaTime) {
      // Call original visual update
      originalUpdateNodeVisuals(node, data, time, deltaTime);

      // Apply corruption effects
      if (corruptionFX && readNodeCorruptionLevel(node) > 0) {
        corruptionFX.applyCorruptionEffects(node, deltaTime, time);
      }
    };

    if (debugMode) {
      console.log('%c[Patch] updateNodeVisuals wrapped with corruption FX', 'color: #00ff88;');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PATCH: update (main loop)
  // Update particles and corruption visual state each frame
  // ═══════════════════════════════════════════════════════════════════
  const originalUpdate = aiNodesInstance.update?.bind(aiNodesInstance);

  if (originalUpdate) {
    aiNodesInstance.update = function(deltaTime, time) {
      // Call original update
      originalUpdate(deltaTime, time);

      // Update corruption FX particles
      corruptionFX.updateParticles(deltaTime);

      // Apply corruption effects to all nodes
      if (this.nodes) {
        this.nodes.forEach(node => {
          if (readNodeCorruptionLevel(node) > 0) {
            corruptionFX.applyCorruptionEffects(node, deltaTime, time);
          }

          // PATCH 4: Emit corruption threshold crossed event
          const currentCorruption = readNodeCorruptionLevel(node);
          const previousCorruption = node.userData?._lastCorruption ?? 0;

          // Check if corruption crossed 0.35 threshold
          if (previousCorruption < 0.35 && currentCorruption >= 0.35) {
            if (this.multiNetworkManager && typeof this.multiNetworkManager.emitEvent === 'function') {
              this.multiNetworkManager.emitEvent({
                type: 'corruptionThresholdCrossed',
                node: node,
                value: currentCorruption
              });
            }
          }

          node.userData._lastCorruption = currentCorruption;
        });
      }
    };

    if (debugMode) {
      console.log('%c[Patch] update wrapped with corruption FX', 'color: #00ff88;');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // NEW METHODS: Corruption control APIs
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Increase corruption on a node
   */
  aiNodesInstance.increaseCorruption = function(node, amount = 0.1) {
    if (node && node.userData) {
      const previousCorruption = readNodeCorruptionLevel(node);
      const nextCorruption = Math.min(1, previousCorruption + amount);
      writeCanonicalCorruption(node, nextCorruption, nextCorruption > 0);

      // PATCH 4: Emit event if threshold crossed
      if (previousCorruption < 0.35 && nextCorruption >= 0.35) {
        if (this.multiNetworkManager && typeof this.multiNetworkManager.emitEvent === 'function') {
          this.multiNetworkManager.emitEvent({
            type: 'corruptionThresholdCrossed',
            node: node,
            value: nextCorruption
          });
        }
      }
    }
  }.bind(aiNodesInstance);

  /**
   * Decrease corruption on a node
   */
  aiNodesInstance.decreaseCorruption = function(node, amount = 0.1) {
    if (node && node.userData) {
      const nextCorruption = Math.max(0, readNodeCorruptionLevel(node) - amount);
      writeCanonicalCorruption(node, nextCorruption, nextCorruption > 0);
    }
  };

  /**
   * Set corruption to specific level
   */
  aiNodesInstance.setCorruptionLevel = function(node, level) {
    if (node && node.userData) {
      const nextCorruption = Math.max(0, Math.min(1, level));
      writeCanonicalCorruption(node, nextCorruption, nextCorruption > 0);
    }
  };

  /**
   * Clear all corruption from a node
   */
  aiNodesInstance.cleanNode = function(node) {
    if (node && node.userData) {
      writeCanonicalCorruption(node, 0, false);
    }
  };

  /**
   * Get corruption level of a node
   */
  aiNodesInstance.getCorruptionLevel = function(node) {
    return readNodeCorruptionLevel(node);
  };

  if (debugMode) {
    console.log('%c[CorruptionVisualIntegrationPatch] AINodes integration complete', 
      'color: #ff4400; font-weight: bold;', {
      newMethods: [
        'increaseCorruption',
        'decreaseCorruption',
        'setCorruptionLevel',
        'cleanNode',
        'getCorruptionLevel'
      ]
    });
  }

  return corruptionFX;
}

/**
 * Setup unified corruption visual system
 * This is the main entry point for integration
 */
export function setupCorruptionVisualSystem(aiNodesInstance, debugMode = false) {
  if (!aiNodesInstance) {
    console.error('[CorruptionVisualIntegrationPatch] AINodes instance required');
    return null;
  }

  if (debugMode) {
    console.log('%c[CorruptionVisualIntegrationPatch] Setting up corruption visual system', 
      'color: #ff4400; font-weight: bold;');
  }

  // Patch AINodes
  const corruptionFX = patchAINodesWithCorruptionFX(aiNodesInstance, debugMode);

  // Patch archetype visual system if available
  if (aiNodesInstance.archetypeVisualSystem) {
    patchArchetypeVisualWithCorruptionFX(aiNodesInstance.archetypeVisualSystem, aiNodesInstance, debugMode);
  }

  if (debugMode) {
    console.log('%c[CorruptionVisualIntegrationPatch] Complete', 
      'color: #00ff88; font-weight: bold;');
  }

  return corruptionFX;
}

export default setupCorruptionVisualSystem;
