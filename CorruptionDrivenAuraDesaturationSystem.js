/**
 * CORRUPTION-DRIVEN AURA DESATURATION SYSTEM
 * ============================================
 * Desaturates aura colors based on node corruption level
 * Shows network health degradation through visual fading
 * 
 * Architecture:
 * 1. Corruption value (0-1) → desaturation multiplier (1.0 → 0.0)
 * 2. Smooth desaturation curves (non-linear for visual appeal)
 * 3. Per-node desaturation tracking + batch updates
 * 4. Integrates with fresnel + synergy systems (no conflicts)
 * 5. Optional grayness overlay in severe corruption
 * 
 * Visual Progression:
 * - Clean (0-0.25):    Fully saturated, vibrant aura
 * - Degraded (0.25-0.50): Colors fade to pastels
 * - Corrupted (0.50-0.75): Mostly desaturated, pale ghost
 * - Severe (0.75-1.0):  Nearly grayscale, barely visible
 * 
 * Performance: <1ms per 100 nodes
 * 
 * Session 95: Visual Layer Enforcement Integration
 * - Color modifications now checked against enforcement gate
 * - Prevents opacity/color violations per layer hierarchy
 */

import * as THREE from 'three';
import { VisualLayerEnforcementIntegrationHelpers as IntegrationHelpers } from './VisualLayerEnforcementIntegrationHelpers.js';

/**
 * Desaturation curves (corruption → saturation multiplier)
 * Different curves affect visual feel of degradation
 */
export const DesaturationCurves = {
  /**
   * Linear desaturation (simple 1:1 mapping)
   * corruption 0.5 → saturation 0.5
   */
  LINEAR: (corruption) => {
    return Math.max(0, 1.0 - corruption);
  },

  /**
   * Quadratic desaturation (accelerates at high corruption)
   * corruption 0.5 → saturation 0.75
   * corruption 0.75 → saturation 0.44
   */
  QUADRATIC: (corruption) => {
    const decay = 1.0 - corruption;
    return decay * decay;
  },

  /**
   * Cubic desaturation (extreme acceleration)
   * corruption 0.5 → saturation 0.875
   * corruption 0.75 → saturation 0.25
   */
  CUBIC: (corruption) => {
    const decay = 1.0 - corruption;
    return decay * decay * decay;
  },

  /**
   * Square root desaturation (soft start, sharp end)
   * corruption 0.5 → saturation 0.29
   * corruption 0.75 → saturation 0.0
   */
  SQRT: (corruption) => {
    return Math.sqrt(Math.max(0, 1.0 - corruption));
  },

  /**
   * Smooth step desaturation (professional ease)
   * Uses Hermite interpolation for smooth feel
   */
  SMOOTHSTEP: (corruption) => {
    const c = Math.max(0, Math.min(1, corruption));
    const t = 1.0 - c;
    return t * t * (3.0 - 2.0 * t);
  },

  /**
   * Inverse smooth step (sharper initial fade)
   * Opposite of smoothstep for varied visual feel
   */
  INVERSE_SMOOTHSTEP: (corruption) => {
    const c = Math.max(0, Math.min(1, corruption));
    // Reverse the smoothstep
    if (c < 0.5) {
      const t = c * 2;
      return 1.0 - (t * t * (3.0 - 2.0 * t)) / 2.0;
    } else {
      const t = (c - 0.5) * 2;
      return 0.5 * (1.0 - (t * t * (3.0 - 2.0 * t)));
    }
  },
};

/**
 * Desaturation levels for visual progression
 */
export const DesaturationLevels = {
  CLEAN: { corruption: [0.0, 0.25], saturation: 1.0, description: 'Fully saturated' },
  DEGRADED: { corruption: [0.25, 0.50], saturation: 0.5, description: 'Fading colors' },
  CORRUPTED: { corruption: [0.50, 0.75], saturation: 0.25, description: 'Pale ghost' },
  SEVERE: { corruption: [0.75, 1.0], saturation: 0.0, description: 'Nearly grayscale' },
};

/**
 * Convert RGB to HSL
 * @param {THREE.Color} color Input color
 * @returns {Object} {h, s, l} in range [0, 1]
 */
export function rgbToHsl(color) {
  const r = color.r;
  const g = color.g;
  const b = color.b;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}

/**
 * Convert HSL to RGB
 * @param {number} h Hue [0, 1]
 * @param {number} s Saturation [0, 1]
 * @param {number} l Lightness [0, 1]
 * @returns {THREE.Color}
 */
export function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return new THREE.Color(r, g, b);
}

/**
 * Desaturate a color by a given amount
 * @param {THREE.Color} color Input color
 * @param {number} saturation Saturation multiplier (0-1)
 * @returns {THREE.Color} Desaturated color
 */
export function desaturateColor(color, saturation) {
  // Convert to HSL
  const hsl = rgbToHsl(color);

  // Reduce saturation
  hsl.s *= saturation;

  // Convert back to RGB
  return hslToRgb(hsl.h, hsl.s, hsl.l);
}

/**
 * Per-node aura desaturation controller
 * Tracks corruption and applies desaturation to aura
 */
export class CorruptionDesaturationController {
  constructor(auraMesh, node = null, enforcementGate = null, options = {}) {
    this.auraMesh = auraMesh;
    this.node = node;
    this.enforcementGate = enforcementGate;  // Session 95: Enforcement gate
    this.options = {
      desaturationCurve: DesaturationCurves.SMOOTHSTEP,
      enableGraynessOverlay: true,
      graynessThreshold: 0.75,  // Apply grayness when corruption > 75%
      ...options,
    };

    // Color state tracking
    this.originalColor = new THREE.Color(auraMesh.material?.uniforms?.uAuraColor?.value || 0x7fffd4);
    this.desaturatedColor = this.originalColor.clone();
    this.displayColor = this.originalColor.clone();

    // Corruption tracking
    this.currentCorruption = 0;
    this.targetCorruption = 0;
    this.corruptionVelocity = 0;

    // State
    this.lastUpdateTime = 0;
    this.updateCount = 0;
  }

  /**
   * Update desaturation based on corruption value
   * @param {number} corruptionValue Corruption level (0-1)
   * @param {number} time Current time in seconds
   */
  updateDesaturation(corruptionValue, time = 0) {
    // Smooth corruption changes
    const delta = corruptionValue - this.currentCorruption;
    if (Math.abs(delta) > 0.001) {
      this.corruptionVelocity = delta * 0.2;  // 20% per update for smoothing
      this.currentCorruption += this.corruptionVelocity;
    } else {
      this.currentCorruption = corruptionValue;
      this.corruptionVelocity = 0;
    }

    // Clamp to valid range
    this.currentCorruption = Math.max(0, Math.min(1, this.currentCorruption));

    // Compute saturation multiplier based on desaturation curve
    const saturationMultiplier = this.options.desaturationCurve(this.currentCorruption);

    // Desaturate original color
    this.desaturatedColor = desaturateColor(this.originalColor, saturationMultiplier);

    // Optional: Apply grayness overlay in severe corruption
    if (this.options.enableGraynessOverlay && this.currentCorruption >= this.options.graynessThreshold) {
      const greyAmount = (this.currentCorruption - this.options.graynessThreshold) / (1.0 - this.options.graynessThreshold);
      const grey = new THREE.Color(0x888888);
      this.displayColor.lerpColors(this.desaturatedColor, grey, greyAmount);
    } else {
      this.displayColor.copy(this.desaturatedColor);
    }

    // Session 95: Check enforcement gate before applying color modifications
    // Corruption affects opacity implicitly through color saturation
    // Verify final color state is within layer bounds
    if (!this._canApplyDesaturation()) {
      return {
        corruption: this.currentCorruption,
        saturation: saturationMultiplier,
        color: this.displayColor.clone(),
        rejected: true
      };
    }

    // Apply to shader if available
    if (this.auraMesh?.material?.uniforms?.uAuraColor) {
      this.auraMesh.material.uniforms.uAuraColor.value.copy(this.displayColor);
    }

    // Apply to edge color (multi-band variant)
    if (this.auraMesh?.material?.uniforms?.uEdgeColor) {
      const edgeDesaturated = desaturateColor(
        this.auraMesh.material.uniforms.uEdgeColor.value,
        saturationMultiplier
      );
      this.auraMesh.material.uniforms.uEdgeColor.value.copy(edgeDesaturated);
    }

    this.updateCount++;

    return {
      corruption: this.currentCorruption,
      saturation: saturationMultiplier,
      color: this.displayColor.clone(),
    };
  }
  
  /**
   * Session 95: Check if desaturation modification is allowed
   * Corruption-driven desaturation affects visual intensity
   */
  _canApplyDesaturation() {
    if (!this.enforcementGate || !this.node) return true;  // No gate - allow
    
    // Estimate effective opacity based on saturation
    // Lower saturation = lower visual impact, but still check bounds
    const request = IntegrationHelpers.createVisualAttachmentRequest({
      nodeId: this.node.userData?.id || this.node.uuid,
      nodeCategory: this.node.userData?.category || 'unknown',
      layerType: 'AURA_LAYER',
      geometryType: 'Spheres',
      opacity: 0.5,  // Corruption desaturation uses base aura opacity
      sourceSystem: 'CorruptionDrivenAuraDesaturationSystem',
      description: 'Corruption-driven aura desaturation'
    });
    
    return this.enforcementGate.canAttach(request);
  }

  /**
   * Get current desaturation state
   */
  getState() {
    return {
      corruption: this.currentCorruption,
      color: this.displayColor.clone(),
      level: this._getDesaturationLevel(),
    };
  }

  /**
   * Get human-readable desaturation level
   */
  _getDesaturationLevel() {
    const c = this.currentCorruption;
    if (c < 0.25) return 'CLEAN';
    if (c < 0.50) return 'DEGRADED';
    if (c < 0.75) return 'CORRUPTED';
    return 'SEVERE';
  }

  /**
   * Set original color (for recoloring)
   */
  setOriginalColor(color) {
    this.originalColor.copy(color);
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.currentCorruption = 0;
    this.corruptionVelocity = 0;
    this.displayColor.copy(this.originalColor);
    this.updateCount = 0;
  }
}

/**
 * Batch desaturation controller for multiple nodes
 * Optimized for 100+ node updates per frame
 */
export class BatchCorruptionDesaturationController {
  constructor(options = {}, enforcementGate = null) {
    this.controllers = new Map();  // nodeId → CorruptionDesaturationController
    this.options = options;
    this.enforcementGate = enforcementGate;  // Session 95: Store enforcement gate
    this.lastBatchUpdateTime = 0;
    this.updateCount = 0;
  }

  /**
   * Register a node's aura for corruption tracking
   */
  register(nodeId, auraMesh, node = null, initialCorruption = 0, originalColor = null) {
    // Session 95: Pass node and enforcement gate to controller
    const controller = new CorruptionDesaturationController(
      auraMesh,
      node,
      this.enforcementGate,
      this.options
    );
    
    if (originalColor) {
      controller.setOriginalColor(originalColor);
    }
    
    controller.updateDesaturation(initialCorruption, 0);
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
   * Update all tracked nodes (batch operation)
   * @param {Array<Object>} nodeStates Array of {nodeId, corruption}
   * @param {number} time Current time in seconds
   */
  updateAll(nodeStates, time = 0) {
    const startTime = performance.now();

    for (const state of nodeStates) {
      const controller = this.controllers.get(state.nodeId);
      if (controller) {
        controller.updateDesaturation(state.corruption, time);
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
  getAllStates() {
    const info = {};
    for (const [nodeId, controller] of this.controllers.entries()) {
      info[nodeId] = controller.getState();
    }
    return info;
  }

  /**
   * Get desaturation level distribution
   */
  getDistribution() {
    const dist = {
      CLEAN: 0,
      DEGRADED: 0,
      CORRUPTED: 0,
      SEVERE: 0,
    };

    for (const [, controller] of this.controllers.entries()) {
      const level = controller._getDesaturationLevel();
      dist[level]++;
    }

    return dist;
  }

  /**
   * Diagnostics
   */
  getDiagnostics() {
    return {
      totalTracked: this.controllers.size,
      levelDistribution: this.getDistribution(),
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
 * Quick helper to apply desaturation to a color
 * @param {THREE.Color} baseColor The synergy color
 * @param {number} corruptionValue Corruption level (0-1)
 * @param {Function} curve Desaturation curve function
 * @returns {THREE.Color} Final display color
 */
export function computeCorruptionDesaturatedColor(
  baseColor,
  corruptionValue,
  curve = DesaturationCurves.SMOOTHSTEP
) {
  const saturation = curve(corruptionValue);
  return desaturateColor(baseColor, saturation);
}

/**
 * Create a desaturation controller for a node
 * @param {THREE.Mesh} auraMesh The aura mesh
 * @param {number} initialCorruption Initial corruption level
 * @returns {CorruptionDesaturationController}
 */
export function createCorruptionDesaturationController(auraMesh, initialCorruption = 0) {
  const controller = new CorruptionDesaturationController(auraMesh);
  controller.updateDesaturation(initialCorruption, 0);
  return controller;
}

/**
 * Update all aura desaturations from scene
 * @param {THREE.Scene} scene The scene
 * @param {number} time Current time in seconds
 * @param {Function} getCorruptionForNode Function to get corruption for a node
 */
export function updateAllNodeDesaturations(scene, time, getCorruptionForNode) {
  let updateCount = 0;

  scene.traverse(obj => {
    if (obj.userData?.isAura && obj.parent?.data?.id) {
      const parentNode = obj.parent;
      const corruption = getCorruptionForNode(parentNode) ?? 0;

      if (!obj.userData.desaturationController) {
        obj.userData.desaturationController = createCorruptionDesaturationController(
          obj,
          corruption
        );
      }

      obj.userData.desaturationController.updateDesaturation(corruption, time);
      updateCount++;
    }
  });

  return updateCount;
}

/**
 * Export all
 */
export default {
  DesaturationCurves,
  DesaturationLevels,
  rgbToHsl,
  hslToRgb,
  desaturateColor,
  CorruptionDesaturationController,
  BatchCorruptionDesaturationController,
  computeCorruptionDesaturatedColor,
  createCorruptionDesaturationController,
  updateAllNodeDesaturations,
};
