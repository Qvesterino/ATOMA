/**
 * CORRUPTION DESATURATION INTEGRATION PATCH
 * ==========================================
 * Seamlessly integrates corruption-driven desaturation with aura system
 * 
 * Integration Points:
 * 1. Corruption value → desaturation multiplier
 * 2. Combines with synergy colors (both apply to final result)
 * 3. Per-frame uniform updates
 * 4. Batch optimization for 100+ nodes
 * 5. Zero breaking changes
 * 
 * Works With:
 * - FresnelRimLightAuraShader.js
 * - SynergyDrivenAuraColorSystem.js
 * - CorruptionDrivenAuraDesaturationSystem.js
 */

import * as THREE from 'three';
import {
  CorruptionDesaturationController,
  BatchCorruptionDesaturationController,
  desaturateColor,
  DesaturationCurves,
} from './LEGACY/aura/CorruptionDrivenAuraDesaturationSystem.js';

/**
 * Global integration state
 */
const integrationState = {
  enabled: false,
  batchController: null,
  nodeControllers: new Map(),  // nodeId → CorruptionDesaturationController
  config: {},
};

/**
 * Configure integration
 */
export function configureCorruptionDesaturationPatch(options = {}) {
  Object.assign(integrationState.config, options);
}

/**
 * Initialize corruption-driven desaturation
 * Call this after fresnel aura and synergy color patches
 * 
 * @param {Object} options Configuration
 * @returns {Object} Initialization report
 */
export function initializeCorruptionDesaturation(options = {}) {
  const {
    enabled = true,
    useBatchController = true,
    desaturationCurve = 'SMOOTHSTEP',
    enableGraynessOverlay = true,
    graynessThreshold = 0.75,
  } = options;

  integrationState.enabled = enabled;
  integrationState.config = {
    enabled,
    useBatchController,
    desaturationCurve,
    enableGraynessOverlay,
    graynessThreshold,
  };

  // Get curve function
  const curveFunc = DesaturationCurves[desaturationCurve] || DesaturationCurves.SMOOTHSTEP;

  if (useBatchController) {
    integrationState.batchController = new BatchCorruptionDesaturationController({
      desaturationCurve: curveFunc,
      enableGraynessOverlay,
      graynessThreshold,
    });
  }

  console.log('[CorruptionDesaturation] Initialized', {
    enabled,
    useBatchController,
    desaturationCurve,
    enableGraynessOverlay,
  });

  return {
    initialized: true,
    config: integrationState.config,
  };
}

/**
 * Register a node's aura for corruption tracking
 * 
 * @param {string} nodeId Unique node identifier
 * @param {THREE.Mesh} auraMesh The aura mesh
 * @param {number} initialCorruption Initial corruption value (0-1)
 * @param {THREE.Color} originalColor Original aura color (for desaturation)
 * @returns {CorruptionDesaturationController} Controller for this node
 */
export function registerNodeAuraForDesaturationTracking(
  nodeId,
  auraMesh,
  initialCorruption = 0,
  originalColor = null
) {
  if (!integrationState.enabled) {
    return null;
  }

  let controller;

  if (integrationState.batchController) {
    // Use batch controller
    controller = integrationState.batchController.register(
      nodeId,
      auraMesh,
      initialCorruption,
      originalColor
    );
  } else {
    // Use individual controller
    controller = new CorruptionDesaturationController(auraMesh);
    if (originalColor) {
      controller.setOriginalColor(originalColor);
    }
    controller.updateDesaturation(initialCorruption, 0);
    integrationState.nodeControllers.set(nodeId, controller);
  }

  return controller;
}

/**
 * Update a single node's aura desaturation
 * 
 * @param {string} nodeId Node identifier
 * @param {number} corruptionValue New corruption value (0-1)
 * @param {number} time Current time in seconds
 */
export function updateNodeDesaturation(nodeId, corruptionValue, time = 0) {
  if (!integrationState.enabled) return;

  let controller = integrationState.nodeControllers.get(nodeId);

  if (!controller && integrationState.batchController) {
    controller = integrationState.batchController.controllers.get(nodeId);
  }

  if (controller) {
    controller.updateDesaturation(corruptionValue, time);
  }
}

/**
 * Update all node desaturations (batch operation)
 * Optimized for 100+ nodes per frame
 * 
 * @param {Array<{nodeId: string, corruption: number}>} nodeStates Node corruption states
 * @param {number} time Current time in seconds
 * @returns {Object} Update statistics
 */
export function updateAllNodeDesaturations(nodeStates, time = 0) {
  if (!integrationState.enabled) return null;

  if (integrationState.batchController) {
    // Batch update (fast)
    const stats = integrationState.batchController.updateAll(
      nodeStates.map(s => ({
        nodeId: s.nodeId,
        corruption: s.corruption,
      })),
      time
    );
    return stats;
  } else {
    // Individual updates (slower)
    let count = 0;
    for (const state of nodeStates) {
      updateNodeDesaturation(state.nodeId, state.corruption, time);
      count++;
    }
    return { count, batchMode: false };
  }
}

/**
 * Quick update from node objects directly
 * Assumes nodes have .data.id and .data.corruption properties
 * 
 * @param {Array<THREE.Object3D>} nodeObjects Array of node objects
 * @param {number} time Current time in seconds
 * @returns {Object} Update statistics
 */
export function updateDesaturationsFromNodes(nodeObjects, time = 0) {
  if (!integrationState.enabled) return null;

  const nodeStates = nodeObjects
    .filter(n => n.data?.id && n.data?.corruption !== undefined)
    .map(n => ({
      nodeId: n.data.id,
      corruption: n.data.corruption,
    }));

  return updateAllNodeDesaturations(nodeStates, time);
}

/**
 * Unregister a node from desaturation tracking
 * Call when node is destroyed
 * 
 * @param {string} nodeId Node identifier
 */
export function unregisterNodeDesaturation(nodeId) {
  if (integrationState.batchController) {
    integrationState.batchController.unregister(nodeId);
  } else {
    integrationState.nodeControllers.delete(nodeId);
  }
}

/**
 * Get desaturation state for a node's aura
 * 
 * @param {string} nodeId Node identifier
 * @returns {Object} State information
 */
export function getNodeDesaturationState(nodeId) {
  let controller = integrationState.nodeControllers.get(nodeId);

  if (!controller && integrationState.batchController) {
    controller = integrationState.batchController.controllers.get(nodeId);
  }

  if (controller) {
    return controller.getState();
  }

  return null;
}

/**
 * Get diagnostics for all tracked desaturations
 */
export function getDesaturationTrackingDiagnostics() {
  const result = {
    integrationEnabled: integrationState.enabled,
    totalTracked: 0,
    levelDistribution: {},
    usingBatchController: !!integrationState.batchController,
  };

  if (integrationState.batchController) {
    const diag = integrationState.batchController.getDiagnostics();
    result.totalTracked = diag.totalTracked;
    result.levelDistribution = diag.levelDistribution;
    result.lastBatchTimeMs = diag.lastBatchTimeMs;
    result.avgTimePerNode = diag.avgTimePerNode;
  } else {
    result.totalTracked = integrationState.nodeControllers.size;
  }

  return result;
}

/**
 * Auto-wiring helper: Scan scene and register all auras
 * 
 * @param {THREE.Scene} scene The scene containing nodes
 * @param {Function} getOriginalColor Optional function to get original color per node
 */
export function autoWireAllNodeDesaturations(scene, getOriginalColor = null) {
  if (!integrationState.enabled) {
    console.warn('[CorruptionDesaturation] Integration not enabled, skipping auto-wire');
    return 0;
  }

  let registeredCount = 0;

  scene.traverse(obj => {
    if (obj.userData?.isAura && obj.parent?.data?.id) {
      const parentNode = obj.parent;
      const corruption = parentNode.data?.corruption ?? 0;

      // Get original color from synergy system if available
      let originalColor = null;
      if (getOriginalColor) {
        originalColor = getOriginalColor(parentNode);
      } else if (obj.material?.uniforms?.uAuraColor) {
        originalColor = obj.material.uniforms.uAuraColor.value.clone();
      }

      registerNodeAuraForDesaturationTracking(
        parentNode.data.id,
        obj,
        corruption,
        originalColor
      );
      registeredCount++;
    }
  });

  console.log(`[CorruptionDesaturation] Auto-wired ${registeredCount} node desaturations`);
  return registeredCount;
}

/**
 * Advanced: Set custom desaturation curve for a node
 * 
 * @param {string} nodeId Node identifier
 * @param {Function} curveFunction Custom desaturation curve
 */
export function setCustomDesaturationCurveForNode(nodeId, curveFunction) {
  let controller = integrationState.nodeControllers.get(nodeId);

  if (!controller && integrationState.batchController) {
    controller = integrationState.batchController.controllers.get(nodeId);
  }

  if (controller) {
    controller.options.desaturationCurve = curveFunction;
  }
}

/**
 * Advanced: Combine synergy color with corruption desaturation
 * Use this to apply both effects to final display color
 * 
 * @param {THREE.Color} synergyColor Base color from synergy system
 * @param {number} corruptionValue Corruption level (0-1)
 * @param {Function} curve Desaturation curve
 * @returns {THREE.Color} Final color with both effects applied
 */
export function applyCombinedSynergyCorruptionColor(synergyColor, corruptionValue, curve = DesaturationCurves.SMOOTHSTEP) {
  // Apply desaturation based on corruption
  return desaturateColor(synergyColor, curve(corruptionValue));
}

/**
 * Console API for real-time testing
 */
export const corruptionDesaturationConsole = {
  /**
   * Manually set corruption for a node
   */
  setCorruptionForNode(nodeId, corruptionValue, time = 0) {
    updateNodeDesaturation(nodeId, corruptionValue, time);
    console.log(`[CorruptionDesaturation] Set corruption for ${nodeId} to ${corruptionValue.toFixed(2)}`);
  },

  /**
   * Simulate corruption increase (for testing)
   */
  animateCorruptionIncrease(nodeId, duration = 3.0) {
    const startTime = performance.now() / 1000;
    let animating = true;

    const animate = () => {
      const elapsed = performance.now() / 1000 - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      updateNodeDesaturation(nodeId, progress, progress);

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        animating = false;
        console.log(`[CorruptionDesaturation] Animation complete for ${nodeId}`);
      }
    };

    requestAnimationFrame(animate);
  },

  /**
   * Print desaturation state for all tracked nodes
   */
  printAllDesaturationStates() {
    console.log('[CorruptionDesaturation] Desaturation States:');

    if (integrationState.batchController) {
      const allStates = integrationState.batchController.getAllStates();
      for (const [nodeId, state] of Object.entries(allStates)) {
        console.log(`  ${nodeId}: ${state.level} (corruption: ${state.corruption.toFixed(2)})`);
      }
    } else {
      for (const [nodeId, controller] of integrationState.nodeControllers.entries()) {
        const state = controller.getState();
        console.log(`  ${nodeId}: ${state.level} (corruption: ${state.corruption.toFixed(2)})`);
      }
    }
  },

  /**
   * Print diagnostics
   */
  printDiagnostics() {
    const diag = getDesaturationTrackingDiagnostics();
    console.log('[CorruptionDesaturation] Diagnostics:', diag);
  },

  /**
   * Get all states
   */
  getAllStates() {
    if (integrationState.batchController) {
      return integrationState.batchController.getAllStates();
    } else {
      const result = {};
      for (const [nodeId, controller] of integrationState.nodeControllers.entries()) {
        result[nodeId] = controller.getState();
      }
      return result;
    }
  },

  /**
   * Get level distribution
   */
  getLevelDistribution() {
    if (integrationState.batchController) {
      return integrationState.batchController.getDistribution();
    } else {
      const dist = { CLEAN: 0, DEGRADED: 0, CORRUPTED: 0, SEVERE: 0 };
      for (const [, controller] of integrationState.nodeControllers.entries()) {
        dist[controller._getDesaturationLevel()]++;
      }
      return dist;
    }
  },
};

/**
 * Export all functions
 */
export default {
  // Configuration
  configure: configureCorruptionDesaturationPatch,
  initialize: initializeCorruptionDesaturation,

  // Node management
  register: registerNodeAuraForDesaturationTracking,
  unregister: unregisterNodeDesaturation,
  getState: getNodeDesaturationState,

  // Updates
  updateSingle: updateNodeDesaturation,
  updateBatch: updateAllNodeDesaturations,
  updateFromNodes: updateDesaturationsFromNodes,

  // Advanced
  autoWire: autoWireAllNodeDesaturations,
  setCustomCurve: setCustomDesaturationCurveForNode,
  applyCombinedColor: applyCombinedSynergyCorruptionColor,

  // Diagnostics
  getDiagnostics: getDesaturationTrackingDiagnostics,
  console: corruptionDesaturationConsole,
};
