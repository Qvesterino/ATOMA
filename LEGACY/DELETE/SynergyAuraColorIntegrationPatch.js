/**
 * SYNERGY AURA COLOR INTEGRATION PATCH
 * =====================================
 * Seamlessly integrates synergy-driven color transitions with fresnel aura system
 * 
 * Integration Points:
 * 1. Synergy value → color state resolution
 * 2. Smooth color interpolation (prevents jarring transitions)
 * 3. Per-frame uniform updates to fresnel shader
 * 4. Batch optimization for 100+ nodes
 * 5. Zero breaking changes
 * 
 * Architecture:
 * - SynergyDrivenAuraColorSystem: Color computation
 * - This patch: Integration + wiring
 * - FresnelRimLightAuraShader: Visual rendering
 */

import * as THREE from 'three';
import {
  SynergyAuraColorController,
  BatchSynergyAuraColorController,
  computeSynergyDrivenColor,
  resolveSynergyState,
} from './SynergyDrivenAuraColorSystem.js';

/**
 * Global integration state
 */
const integrationState = {
  enabled: false,
  batchController: null,
  nodeControllers: new Map(),  // nodeId → SynergyAuraColorController
  config: {},
};

/**
 * Configure integration
 */
export function configureSynergyAuraColorPatch(options = {}) {
  Object.assign(integrationState.config, options);
}

/**
 * Initialize synergy-driven aura colors
 * Call this after fresnel aura patch is applied
 * 
 * @param {Object} options Configuration
 * @returns {Object} Initialization report
 */
export function initializeSynergyAuraColors(options = {}) {
  const {
    enabled = true,
    useBatchController = true,
    enablePulsing = true,
    pulseFrequency = 2.5,
  } = options;

  integrationState.enabled = enabled;
  integrationState.config = {
    enabled,
    useBatchController,
    enablePulsing,
    pulseFrequency,
  };

  if (useBatchController) {
    integrationState.batchController = new BatchSynergyAuraColorController({
      enablePulsing,
      pulseFrequency,
    });
  }

  console.log('[SynergyAuraColor] Initialized', {
    enabled,
    useBatchController,
    enablePulsing,
  });

  return {
    initialized: true,
    config: integrationState.config,
  };
}

/**
 * Register a node's aura for synergy-driven color updates
 * 
 * @param {string} nodeId Unique node identifier
 * @param {THREE.Mesh} auraMesh The aura mesh
 * @param {number} initialSynergy Initial synergy value (0-1)
 * @returns {SynergyAuraColorController} Color controller for this node
 */
export function registerNodeAuraForColorTracking(nodeId, auraMesh, initialSynergy = 0) {
  if (!integrationState.enabled) {
    return null;
  }

  let controller;

  if (integrationState.batchController) {
    // Use batch controller
    controller = integrationState.batchController.register(nodeId, auraMesh, initialSynergy);
  } else {
    // Use individual controller
    controller = new SynergyAuraColorController(auraMesh);
    controller.updateColor(initialSynergy, 0);
    integrationState.nodeControllers.set(nodeId, controller);
  }

  return controller;
}

/**
 * Update a single node's aura color
 * 
 * @param {string} nodeId Node identifier
 * @param {number} synergyValue New synergy value (0-1)
 * @param {number} time Current time in seconds
 */
export function updateNodeAuraColor(nodeId, synergyValue, time = 0) {
  if (!integrationState.enabled) return;

  let controller = integrationState.nodeControllers.get(nodeId);

  if (!controller && integrationState.batchController) {
    controller = integrationState.batchController.controllers.get(nodeId);
  }

  if (controller) {
    controller.updateColor(synergyValue, time);
  }
}

/**
 * Update all node aura colors (batch operation)
 * Optimized for 100+ nodes per frame
 * 
 * @param {Array<{nodeId: string, synergy: number}>} nodeStates Node synergy states
 * @param {number} time Current time in seconds
 * @returns {Object} Update statistics
 */
export function updateAllNodeAuraColors(nodeStates, time = 0) {
  if (!integrationState.enabled) return null;

  if (integrationState.batchController) {
    // Batch update (fast)
    const stats = integrationState.batchController.updateAll(
      nodeStates.map(s => ({
        nodeId: s.nodeId,
        synergyValue: s.synergy,
      })),
      time
    );
    return stats;
  } else {
    // Individual updates (slower)
    let count = 0;
    for (const state of nodeStates) {
      updateNodeAuraColor(state.nodeId, state.synergy, time);
      count++;
    }
    return { count, batchMode: false };
  }
}

/**
 * Quick update from node objects directly
 * Assumes nodes have .data.id and .data.synergy properties
 * 
 * @param {Array<THREE.Object3D>} nodeObjects Array of node objects
 * @param {number} time Current time in seconds
 * @returns {Object} Update statistics
 */
export function updateAuraColorsFromNodes(nodeObjects, time = 0) {
  if (!integrationState.enabled) return null;

  const nodeStates = nodeObjects
    .filter(n => n.data?.id && n.data?.synergy !== undefined)
    .map(n => ({
      nodeId: n.data.id,
      synergy: n.data.synergy,
    }));

  return updateAllNodeAuraColors(nodeStates, time);
}

/**
 * Unregister a node from color tracking
 * Call when node is destroyed
 * 
 * @param {string} nodeId Node identifier
 */
export function unregisterNodeAura(nodeId) {
  if (integrationState.batchController) {
    integrationState.batchController.unregister(nodeId);
  } else {
    integrationState.nodeControllers.delete(nodeId);
  }
}

/**
 * Get state info for a node's aura
 * 
 * @param {string} nodeId Node identifier
 * @returns {Object} State information
 */
export function getNodeAuraColorState(nodeId) {
  let controller = integrationState.nodeControllers.get(nodeId);

  if (!controller && integrationState.batchController) {
    controller = integrationState.batchController.controllers.get(nodeId);
  }

  if (controller) {
    return controller.getStateInfo();
  }

  return null;
}

/**
 * Get diagnostics for all tracked auras
 */
export function getColorTrackingDiagnostics() {
  const result = {
    integrationEnabled: integrationState.enabled,
    totalTracked: 0,
    stateDistribution: {},
    usingBatchController: !!integrationState.batchController,
  };

  if (integrationState.batchController) {
    const diag = integrationState.batchController.getDiagnostics();
    result.totalTracked = diag.totalTracked;
    result.stateDistribution = diag.stateDistribution;
    result.lastBatchTimeMs = diag.lastBatchTimeMs;
    result.avgTimePerNode = diag.avgTimePerNode;
  } else {
    result.totalTracked = integrationState.nodeControllers.size;
  }

  return result;
}

/**
 * Auto-wiring helper: Scan scene and register all auras
 * Use this if you want automatic integration without per-node setup
 * 
 * @param {THREE.Scene} scene The scene containing nodes
 */
export function autoWireAllNodeAuras(scene) {
  if (!integrationState.enabled) {
    console.warn('[SynergyAuraColor] Integration not enabled, skipping auto-wire');
    return 0;
  }

  let registeredCount = 0;

  scene.traverse(obj => {
    if (obj.userData?.isAura && obj.parent?.data?.id) {
      const parentNode = obj.parent;
      const synergy = parentNode.data?.synergy ?? 0;

      registerNodeAuraForColorTracking(parentNode.data.id, obj, synergy);
      registeredCount++;
    }
  });

  console.log(`[SynergyAuraColor] Auto-wired ${registeredCount} node auras`);
  return registeredCount;
}

/**
 * Advanced: Create custom color palette per node
 * Allows per-node color customization
 * 
 * @param {string} nodeId Node identifier
 * @param {Object} customPalette Custom SynergyColorPalette
 */
export function setCustomColorPaletteForNode(nodeId, customPalette) {
  let controller = integrationState.nodeControllers.get(nodeId);

  if (!controller && integrationState.batchController) {
    controller = integrationState.batchController.controllers.get(nodeId);
  }

  if (controller && controller.auraMesh?.material?.uniforms) {
    // Store custom palette for next update
    if (!controller.customPalette) {
      controller.customPalette = {};
    }
    Object.assign(controller.customPalette, customPalette);
  }
}

/**
 * Advanced: Create category-specific color schemes
 * Define colors per node archetype
 * 
 * @param {string} nodeCategory Node category/archetype
 * @returns {Object} Color palette for this category
 */
export function getColorPaletteForCategory(nodeCategory) {
  // Synergy-based colors that work for all categories
  // Category can add subtle shifts if needed
  const baseColors = {
    control: { hueShift: 30 },      // Magenta tint
    prime: { hueShift: 120 },       // Green tint
    emotional: { hueShift: 330 },   // Pink tint
    axiom: { hueShift: 60 },        // Yellow tint
    // ... more categories ...
  };

  return baseColors[nodeCategory] || {};
}

/**
 * Console API for real-time testing
 */
export const synergyAuraColorConsole = {
  /**
   * Manually trigger a synergy value change for a node
   */
  setSynergyForNode(nodeId, synergyValue, time = 0) {
    updateNodeAuraColor(nodeId, synergyValue, time);
    console.log(`[SynergyAuraColor] Set synergy for ${nodeId} to ${synergyValue}`);
  },

  /**
   * Simulate synergy animation (for testing)
   */
  animateSynergy(nodeId, duration = 3.0) {
    const startTime = performance.now() / 1000;
    let animating = true;

    const animate = () => {
      const elapsed = performance.now() / 1000 - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const synergy = progress;

      updateNodeAuraColor(nodeId, synergy, progress);

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        animating = false;
        console.log(`[SynergyAuraColor] Animation complete for ${nodeId}`);
      }
    };

    requestAnimationFrame(animate);
  },

  /**
   * Print color state for all tracked nodes
   */
  printAllColorStates() {
    console.log('[SynergyAuraColor] Color States:');

    if (integrationState.batchController) {
      const allStates = integrationState.batchController.getAllStateInfo();
      for (const [nodeId, state] of Object.entries(allStates)) {
        console.log(`  ${nodeId}: ${state.state} (synergy: ${state.synergyValue.toFixed(2)})`);
      }
    } else {
      for (const [nodeId, controller] of integrationState.nodeControllers.entries()) {
        const state = controller.getStateInfo();
        console.log(`  ${nodeId}: ${state.state} (synergy: ${state.synergyValue.toFixed(2)})`);
      }
    }
  },

  /**
   * Print diagnostics
   */
  printDiagnostics() {
    const diag = getColorTrackingDiagnostics();
    console.log('[SynergyAuraColor] Diagnostics:', diag);
  },

  /**
   * Get all state info
   */
  getAllStates() {
    if (integrationState.batchController) {
      return integrationState.batchController.getAllStateInfo();
    } else {
      const result = {};
      for (const [nodeId, controller] of integrationState.nodeControllers.entries()) {
        result[nodeId] = controller.getStateInfo();
      }
      return result;
    }
  },
};

/**
 * Export all functions
 */
export default {
  // Configuration
  configure: configureSynergyAuraColorPatch,
  initialize: initializeSynergyAuraColors,

  // Node management
  register: registerNodeAuraForColorTracking,
  unregister: unregisterNodeAura,
  getState: getNodeAuraColorState,

  // Updates
  updateSingle: updateNodeAuraColor,
  updateBatch: updateAllNodeAuraColors,
  updateFromNodes: updateAuraColorsFromNodes,

  // Advanced
  autoWire: autoWireAllNodeAuras,
  setCustomPalette: setCustomColorPaletteForNode,
  getCategoryPalette: getColorPaletteForCategory,

  // Diagnostics
  getDiagnostics: getColorTrackingDiagnostics,
  console: synergyAuraColorConsole,
};
