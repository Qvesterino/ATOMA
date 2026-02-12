/**
 * SYNERGY-DRIVEN AURA COLOR TRANSITION SYSTEM
 * =============================================
 * Smooth color transitions for node auras based on synergy/harmony state
 * 
 * Architecture:
 * 1. Synergy state (LOW, ACTIVE, STRONG, AWAKENED) → color palette
 * 2. Smooth interpolation between states (prevents jarring switches)
 * 3. Per-node color tracking + animation system
 * 4. Integrates with fresnel rim-lighting shader
 * 
 * Color Language:
 * - LOW (0-0.50):      Muted teal → dormant connection
 * - ACTIVE (0.50-0.75): Cyan → emerging connection
 * - STRONG (0.75-0.85): Bright cyan → strong link
 * - AWAKENED (≥0.85):  Brilliant cyan + accent → peak resonance
 * 
 * Performance: <1ms per 100 nodes
 * Integration: Drop-in compatible with existing aura system
 * 
 * Session 95: Visual Layer Enforcement Integration
 * - Color modifications now checked against enforcement gate
 * - Prevents invalid color/intensity violations per layer hierarchy
 */

import * as THREE from 'three';
const IntegrationHelpers = { createVisualAttachmentRequest: (opts) => opts };

/**
 * Synergy states and their associated colors
 * Maps discrete synergy states to visual color palettes
 */
export const SynergyColorPalette = {
  // LOW: Dormant connection (muted, cool tones)
  LOW: {
    base: new THREE.Color(0x4a7c7e),      // Muted teal
    edge: new THREE.Color(0x3d6366),      // Darker teal
    accent: new THREE.Color(0x6ba3a5),    // Slight teal brightening
    brightness: 0.5,
  },

  // ACTIVE: Emerging connection (clear cyan)
  ACTIVE: {
    base: new THREE.Color(0x20b2aa),      // Light sea green / cyan
    edge: new THREE.Color(0x17a1a1),      // Deeper cyan
    accent: new THREE.Color(0x40c4c0),    // Bright cyan
    brightness: 0.7,
  },

  // STRONG: Strong connection (vibrant cyan)
  STRONG: {
    base: new THREE.Color(0x00d9d9),      // Vibrant cyan
    edge: new THREE.Color(0x00bfbf),      // Deep cyan
    accent: new THREE.Color(0x00ffff),    // Bright cyan
    brightness: 0.85,
  },

  // AWAKENED: Peak resonance (brilliant cyan + prismatic accent)
  AWAKENED: {
    base: new THREE.Color(0x00ffff),      // Brilliant cyan
    edge: new THREE.Color(0x00e6e6),      // Pure cyan
    accent: new THREE.Color(0x7fffff),    // Prismatic light cyan
    brightness: 1.0,
  },
};

/**
 * Synergy state definitions (matches SynergyStateResolver)
 */
export const SynergyState = {
  LOW: 'LOW',
  ACTIVE: 'ACTIVE',
  STRONG: 'STRONG',
  AWAKENED: 'AWAKENED',
};

/**
 * Synergy value thresholds
 */
export const SynergyThresholds = {
  active: 0.50,
  strong: 0.75,
  awakened: 0.85,
};

/**
 * Resolve synergy value to state
 * 
 * @param {number} synergyValue Normalized synergy (0-1)
 * @returns {string} SynergyState
 */
export function resolveSynergyState(synergyValue) {
  const value = Math.max(0, Math.min(1, synergyValue ?? 0));

  if (value >= SynergyThresholds.awakened) {
    return SynergyState.AWAKENED;
  } else if (value >= SynergyThresholds.strong) {
    return SynergyState.STRONG;
  } else if (value >= SynergyThresholds.active) {
    return SynergyState.ACTIVE;
  }
  return SynergyState.LOW;
}

/**
 * Get color palette for synergy state
 * 
 * @param {string} state SynergyState value
 * @returns {Object} Color palette object
 */
export function getColorPaletteForState(state) {
  return SynergyColorPalette[state] || SynergyColorPalette.LOW;
}

/**
 * Smooth color interpolation between synergy states
 * Prevents jarring color switches, creates smooth transitions
 * 
 * @param {number} synergyValue Raw synergy (0-1)
 * @param {THREE.Color} targetColor Output color to set
 * @param {Object} options Configuration
 */
export function computeSynergyDrivenColor(synergyValue, targetColor, options = {}) {
  const {
    enableAccentPulse = true,
    pulseTime = 0,
    pulseAmplitude = 0.15,
  } = options;

  // Clamp synergy to valid range
  const value = Math.max(0, Math.min(1, synergyValue ?? 0));

  // Determine current and next states
  let currentState, nextState, interpolation;

  if (value < SynergyThresholds.active) {
    // LOW state
    currentState = SynergyState.LOW;
    nextState = SynergyState.ACTIVE;
    interpolation = value / SynergyThresholds.active;
  } else if (value < SynergyThresholds.strong) {
    // ACTIVE → STRONG
    currentState = SynergyState.ACTIVE;
    nextState = SynergyState.STRONG;
    interpolation = (value - SynergyThresholds.active) / (SynergyThresholds.strong - SynergyThresholds.active);
  } else if (value < SynergyThresholds.awakened) {
    // STRONG → AWAKENED
    currentState = SynergyState.STRONG;
    nextState = SynergyState.AWAKENED;
    interpolation = (value - SynergyThresholds.strong) / (SynergyThresholds.awakened - SynergyThresholds.strong);
  } else {
    // Fully AWAKENED
    currentState = SynergyState.AWAKENED;
    nextState = SynergyState.AWAKENED;
    interpolation = 1.0;
  }

  // Get color palettes
  const currentPalette = SynergyColorPalette[currentState];
  const nextPalette = SynergyColorPalette[nextState];

  // Smooth interpolation (ease in/out)
  const t = smoothstep(0, 1, interpolation);

  // Interpolate base color
  const baseColor = new THREE.Color();
  baseColor.lerpColors(currentPalette.base, nextPalette.base, t);

  // Optional: Add accent pulse in AWAKENED state
  if (enableAccentPulse && currentState === SynergyState.AWAKENED) {
    const pulse = Math.sin(pulseTime * 2.5) * pulseAmplitude + 1.0;
    baseColor.multiplyScalar(pulse);
    baseColor.clamp();  // Keep in valid range
  }

  targetColor.copy(baseColor);
  return {
    state: currentState,
    targetState: nextState,
    interpolation: t,
    palette: currentPalette,
  };
}

/**
 * Smooth step function for interpolation
 * Creates smooth easing between 0 and 1
 * 
 * @param {number} edge0 Start value
 * @param {number} edge1 End value
 * @param {number} x Input value
 * @returns {number} Interpolated value [0, 1]
 */
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3.0 - 2.0 * t);  // Hermite interpolation
}

/**
 * Per-node aura color controller
 * Tracks color state and manages smooth transitions
 */
export class SynergyAuraColorController {
  constructor(auraMesh, node = null, enforcementGate = null, options = {}) {
    this.auraMesh = auraMesh;
    this.node = node;
    this.enforcementGate = enforcementGate;  // Session 95: Enforcement gate
    this.options = {
      updateInterval: 16,  // ~60fps
      transitionDuration: 0.3,  // seconds
      enablePulsing: true,
      pulseFrequency: 2.5,
      ...options,
    };

    // Color state tracking
    this.currentColor = new THREE.Color(0x4a7c7e);  // Start with LOW state color
    this.targetColor = new THREE.Color(0x4a7c7e);
    this.displayColor = new THREE.Color(0x4a7c7e);

    // Synergy tracking
    this.currentSynergy = 0;
    this.targetSynergy = 0;
    this.synergyVelocity = 0;

    // Animation state
    this.lastUpdateTime = 0;
    this.colorUpdateCount = 0;

    // State history (for smooth transitions)
    this.previousState = SynergyState.LOW;
    this.currentState = SynergyState.LOW;
  }

  /**
   * Update aura color based on current synergy value
   * 
   * @param {number} synergyValue Current synergy (0-1)
   * @param {number} time Current time in seconds
   */
  updateColor(synergyValue, time = 0) {
    // Smooth synergy changes (easing)
    const delta = synergyValue - this.currentSynergy;
    if (Math.abs(delta) > 0.001) {
      this.synergyVelocity = delta * 0.15;  // 15% per update
      this.currentSynergy += this.synergyVelocity;
    } else {
      this.currentSynergy = synergyValue;
      this.synergyVelocity = 0;
    }

    // Clamp to valid range
    this.currentSynergy = Math.max(0, Math.min(1, this.currentSynergy));

    // Compute target color
    const colorInfo = computeSynergyDrivenColor(this.currentSynergy, this.displayColor, {
      enableAccentPulse: this.options.enablePulsing,
      pulseTime: time,
      pulseAmplitude: 0.15,
    });

    this.previousState = this.currentState;
    this.currentState = colorInfo.state;

    // Session 95: Check enforcement gate before applying color modifications
    if (!this._canApplyColorModification()) {
      return;  // Gate rejected, don't apply
    }

    // Apply to shader if available
    if (this.auraMesh?.material?.uniforms?.uAuraColor) {
      this.auraMesh.material.uniforms.uAuraColor.value.copy(this.displayColor);
    }

    // Apply to edge color (multi-band variant)
    if (this.auraMesh?.material?.uniforms?.uEdgeColor) {
      const palette = getColorPaletteForState(this.currentState);
      this.auraMesh.material.uniforms.uEdgeColor.value.copy(palette.edge);
    }

    this.colorUpdateCount++;
  }
  
  /**
   * Session 95: Check if color modification is allowed
   * Synergy color changes affect visual intensity through state transitions
   */
  _canApplyColorModification() {
    if (!this.enforcementGate || !this.node) return true;  // No gate - allow
    
    // Estimate effective opacity from synergy state
    // AWAKENED state has highest visual intensity
    let estimatedOpacity = 0.5;
    if (this.currentState === SynergyState.AWAKENED) {
      estimatedOpacity = 0.6;
    } else if (this.currentState === SynergyState.STRONG) {
      estimatedOpacity = 0.55;
    }
    
    const request = IntegrationHelpers.createVisualAttachmentRequest({
      nodeId: this.node.userData?.id || this.node.uuid,
      nodeCategory: this.node.userData?.category || 'unknown',
      layerType: 'AURA_LAYER',
      geometryType: 'Spheres',
      opacity: estimatedOpacity,
      sourceSystem: 'SynergyDrivenAuraColorSystem',
      description: 'Synergy-driven aura color transition'
    });
    
    return this.enforcementGate.canAttach(request);
  }

  /**
   * Get current state info
   */
  getStateInfo() {
    return {
      state: this.currentState,
      previousState: this.previousState,
      synergyValue: this.currentSynergy,
      color: this.displayColor.clone(),
      palette: getColorPaletteForState(this.currentState),
    };
  }

  /**
   * Reset controller to initial state
   */
  reset() {
    this.currentSynergy = 0;
    this.synergyVelocity = 0;
    this.currentState = SynergyState.LOW;
    this.previousState = SynergyState.LOW;
    this.colorUpdateCount = 0;
  }
}

/**
 * Batch color controller for multiple nodes
 * Optimized for 100+ node updates per frame
 */
export class BatchSynergyAuraColorController {
  constructor(options = {}) {
    this.controllers = new Map();  // nodeId → SynergyAuraColorController
    this.options = options;
    this.lastBatchUpdateTime = 0;
    this.updateCount = 0;
  }

  /**
   * Register a node's aura for color tracking
   */
  register(nodeId, auraMesh, initialSynergy = 0) {
    const controller = new SynergyAuraColorController(auraMesh, this.options);
    controller.updateColor(initialSynergy, 0);
    this.controllers.set(nodeId, controller);
    return controller;
  }

  /**
   * Unregister a node
   */
  unregister(nodeId) {
    this.controllers.delete(nodeId);
  }

  /**
   * Update all tracked auras (batch operation)
   * 
   * @param {Array<Object>} nodeStates Array of {nodeId, synergyValue}
   * @param {number} time Current time in seconds
   */
  updateAll(nodeStates, time = 0) {
    const startTime = performance.now();

    for (const state of nodeStates) {
      const controller = this.controllers.get(state.nodeId);
      if (controller) {
        controller.updateColor(state.synergyValue, time);
      }
    }

    const elapsed = performance.now() - startTime;
    this.lastBatchUpdateTime = elapsed;
    this.updateCount++;

    return {
      count: nodeStates.length,
      elapsedMs: elapsed,
      avgPerNode: elapsed / nodeStates.length,
    };
  }

  /**
   * Get state info for all controllers
   */
  getAllStateInfo() {
    const info = {};
    for (const [nodeId, controller] of this.controllers.entries()) {
      info[nodeId] = controller.getStateInfo();
    }
    return info;
  }

  /**
   * Diagnostics
   */
  getDiagnostics() {
    let stateDistribution = {
      [SynergyState.LOW]: 0,
      [SynergyState.ACTIVE]: 0,
      [SynergyState.STRONG]: 0,
      [SynergyState.AWAKENED]: 0,
    };

    for (const [, controller] of this.controllers.entries()) {
      stateDistribution[controller.currentState]++;
    }

    return {
      totalTracked: this.controllers.size,
      stateDistribution,
      lastBatchTimeMs: this.lastBatchUpdateTime,
      totalUpdates: this.updateCount,
      avgTimePerNode: this.updateCount > 0 ? this.lastBatchUpdateTime / this.controllers.size : 0,
    };
  }

  /**
   * Reset all controllers
   */
  resetAll() {
    for (const [, controller] of this.controllers.entries()) {
      controller.reset();
    }
  }
}

/**
 * Integration helper: Create and manage color transitions for fresnel auras
 * 
 * @param {THREE.Mesh} auraMesh The aura mesh with fresnel shader
 * @param {number} initialSynergy Initial synergy value (0-1)
 * @returns {SynergyAuraColorController} Controller for this aura
 */
export function createSynergyAuraColorController(auraMesh, initialSynergy = 0) {
  const controller = new SynergyAuraColorController(auraMesh);
  controller.updateColor(initialSynergy, 0);
  return controller;
}

/**
 * Quick helper to update all node auras from a scene
 * 
 * @param {THREE.Scene} scene The scene containing nodes
 * @param {number} time Current time in seconds
 * @param {Function} getSynergyForNode Function to get synergy for a node
 */
export function updateAllNodeAuraColors(scene, time, getSynergyForNode) {
  let updateCount = 0;

  scene.traverse(obj => {
    if (obj.userData?.isAura && obj.parent?.data?.id) {
      const parentNode = obj.parent;
      const synergy = getSynergyForNode(parentNode) ?? 0;

      // Update color if this is a controlled aura
      if (!obj.userData.colorController) {
        obj.userData.colorController = createSynergyAuraColorController(obj, synergy);
      }

      obj.userData.colorController.updateColor(synergy, time);
      updateCount++;
    }
  });

  return updateCount;
}

/**
 * Export all for integration
 */
export default {
  SynergyColorPalette,
  SynergyState,
  SynergyThresholds,
  resolveSynergyState,
  getColorPaletteForState,
  computeSynergyDrivenColor,
  SynergyAuraColorController,
  BatchSynergyAuraColorController,
  createSynergyAuraColorController,
  updateAllNodeAuraColors,
};
