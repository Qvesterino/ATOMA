/**
 * VISUAL HIERARCHY REGISTRY v1.0
 * 
 * ============================================================================
 * Single authority for canonical renderOrder values across all visual layers.
 * 
 * PURPOSE:
 * - Define visual layer priority in one authoritative place
 * - Eliminate hardcoded renderOrder values scattered across codebase
 * - Provide consistent layering for all visual systems
 * - Enable fallback to safe defaults if registry unavailable
 * 
 * DESIGN PRINCIPLES:
 * ✅ Registry is READ-ONLY (no state management)
 * ✅ Registry is OPTIONAL (systems work without it, with fallback)
 * ✅ Registry provides VALUES ONLY (does not create/manage/own meshes)
 * ✅ Registry is ZERO-CONFIG (constants are immutable)
 * ✅ Registry includes FALLBACK LOGIC (safe degradation)
 * 
 * USAGE:
 *   import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
 *   
 *   // Query for layer renderOrder
 *   const coreOrder = VisualHierarchyRegistry.getRenderOrder('CORE');
 *   mesh.renderOrder = coreOrder;
 *   
 *   // Or use layer descriptor object
 *   const layer = VisualHierarchyRegistry.getLayer('AURA');
 *   mesh.renderOrder = layer.renderOrder;
 *   mesh.userData.visualLayer = layer.id;
 * 
 * LAYER STACK (Bottom to Top):
 *   AURA_BACKGROUND    (-100)  — Reserved for future background effects
 *   AURA               (-1)    — Halos, ambient fields (behind everything)
 *   CORE               (0)     — Primary node geometry (EnhancedNodeModels)
 *   ARCHETYPE          (1)     — Extreme/archetype geometry (in EnhancedNodeModels)
 *   EVOLUTION          (50)    — Evolution visuals, personality overlays
 *   FX                 (100)   — Particles, pulses, transient effects
 *   DEBUG              (200)   — Legacy debug overlays (only if enabled)
 * 
 * INTEGRATION CHECKLIST:
 * ✅ EnhancedNodeModels — use registry for core/archetype renderOrder
 * ✅ NodeAuraSystem_v1 — use registry for aura renderOrder
 * ⚠️  EvolutionRegistry / visual evolution — use registry for evolution renderOrder
 * ⚠️  Ritual/event systems — use registry for FX renderOrder
 * ⚠️  Link aura systems — use registry for appropriate layer
 * 
 * SAFETY:
 * - If registry unavailable, systems fall back to hardcoded values
 * - All queries have sensible defaults
 * - No breaking changes to existing code
 * - Systems can opt-in to using registry gradually
 * 
 * ============================================================================
 */

export class VisualHierarchyRegistry {
  // ========================================================================
  // CANONICAL VISUAL LAYERS (Immutable)
  // ========================================================================
  
  // Layer constants — use these as keys for all registry queries
  static LAYER_AURA_BACKGROUND = 'AURA_BACKGROUND';
  static LAYER_AURA = 'AURA';
  static LAYER_CORE = 'CORE';
  static LAYER_ARCHETYPE = 'ARCHETYPE';
  static LAYER_EVOLUTION = 'EVOLUTION';
  static LAYER_FX = 'FX';
  static LAYER_DEBUG = 'DEBUG';

  // Layer definitions — canonical source of truth
  static LAYERS = {
    AURA_BACKGROUND: {
      id: 'AURA_BACKGROUND',
      name: 'Aura Background',
      renderOrder: -100,
      description: 'Reserved for future background effects behind auras',
      opacity: { min: 0.0, max: 0.3 },
      blending: 'normal'
    },
    AURA: {
      id: 'AURA',
      name: 'Aura / Halo',
      renderOrder: -1,
      description: 'Halos, rings, ambient fields — always behind core',
      opacity: { min: 0.2, max: 0.65 },
      blending: 'additive'
    },
    CORE: {
      id: 'CORE',
      name: 'Core Geometry',
      renderOrder: 0,
      description: 'Primary node geometry from EnhancedNodeModels',
      opacity: { min: 1.0, max: 1.0 },
      blending: 'normal'
    },
    ARCHETYPE: {
      id: 'ARCHETYPE',
      name: 'Archetype / Extreme',
      renderOrder: 1,
      description: 'Extreme/archetype geometry embedded in EnhancedNodeModels',
      opacity: { min: 0.4, max: 0.9 },
      blending: 'normal'
    },
    EVOLUTION: {
      id: 'EVOLUTION',
      name: 'Evolution Visual',
      renderOrder: 50,
      description: 'Evolution state, personality, emotional overlays',
      opacity: { min: 0.3, max: 0.8 },
      blending: 'normal'
    },
    FX: {
      id: 'FX',
      name: 'Effects',
      renderOrder: 100,
      description: 'Particles, pulses, transient visual effects',
      opacity: { min: 0.2, max: 1.0 },
      blending: 'additive'
    },
    DEBUG: {
      id: 'DEBUG',
      name: 'Debug / Legacy',
      renderOrder: 200,
      description: 'Debug visuals, legacy overlays (only if debug enabled)',
      opacity: { min: 0.2, max: 0.5 },
      blending: 'normal'
    }
  };

  // ========================================================================
  // QUERY INTERFACE
  // ========================================================================

  /**
   * Get renderOrder value for a visual layer
   * @param {string} layerId - Layer ID (e.g., 'CORE', 'AURA', 'EVOLUTION')
   * @param {number} fallback - Value to return if layer not found (default: 0)
   * @returns {number} renderOrder value
   * 
   * @example
   *   const order = VisualHierarchyRegistry.getRenderOrder('AURA');  // Returns -1
   *   const order = VisualHierarchyRegistry.getRenderOrder('CORE');  // Returns 0
   */
  static getRenderOrder(layerId, fallback = 0) {
    try {
      const layer = this.LAYERS[layerId];
      if (!layer) {
        console.warn(
          `[VisualHierarchyRegistry] Unknown layer: ${layerId}, using fallback: ${fallback}`
        );
        return fallback;
      }
      return layer.renderOrder;
    } catch (err) {
      console.warn(`[VisualHierarchyRegistry] Query error:`, err.message);
      return fallback;
    }
  }

  /**
   * Get full layer definition object
   * @param {string} layerId - Layer ID
   * @returns {Object|null} Layer definition or null if not found
   * 
   * @example
   *   const layer = VisualHierarchyRegistry.getLayer('AURA');
   *   mesh.renderOrder = layer.renderOrder;
   *   mesh.userData.visualLayer = layer.id;
   */
  static getLayer(layerId) {
    try {
      const layer = this.LAYERS[layerId];
      if (!layer) {
        console.warn(`[VisualHierarchyRegistry] Layer not found: ${layerId}`);
        return null;
      }
      return { ...layer }; // Return copy to prevent accidental mutation
    } catch (err) {
      console.warn(`[VisualHierarchyRegistry] Query error:`, err.message);
      return null;
    }
  }

  /**
   * Get opacity constraints for a layer
   * @param {string} layerId - Layer ID
   * @returns {Object} { min, max } opacity bounds
   * 
   * @example
   *   const opacity = VisualHierarchyRegistry.getOpacityBounds('AURA');
   *   mesh.material.opacity = Math.max(opacity.min, Math.min(opacity.max, targetOpacity));
   */
  static getOpacityBounds(layerId) {
    try {
      const layer = this.LAYERS[layerId];
      if (!layer || !layer.opacity) {
        return { min: 0.0, max: 1.0 };
      }
      return { ...layer.opacity };
    } catch (err) {
      console.warn(`[VisualHierarchyRegistry] Opacity query error:`, err.message);
      return { min: 0.0, max: 1.0 };
    }
  }

  /**
   * Verify renderOrder hierarchy (for debugging/validation)
   * @param {string} layer1 - First layer ID
   * @param {string} layer2 - Second layer ID
   * @returns {number} -1 if layer1 < layer2, 0 if equal, 1 if layer1 > layer2
   * 
   * @example
   *   VisualHierarchyRegistry.compareOrder('CORE', 'EVOLUTION');  // Returns -1 (core is lower)
   */
  static compareOrder(layer1, layer2) {
    try {
      const order1 = this.getRenderOrder(layer1);
      const order2 = this.getRenderOrder(layer2);
      
      if (order1 < order2) return -1;
      if (order1 > order2) return 1;
      return 0;
    } catch (err) {
      console.warn(`[VisualHierarchyRegistry] Comparison error:`, err.message);
      return 0;
    }
  }

  /**
   * Get all layers in priority order (bottom to top)
   * @returns {Array} Array of layer definitions, sorted by renderOrder
   * 
   * @example
   *   const layers = VisualHierarchyRegistry.getAllLayers();
   *   layers.forEach(layer => console.log(layer.id, layer.renderOrder));
   */
  static getAllLayers() {
    try {
      return Object.values(this.LAYERS)
        .sort((a, b) => a.renderOrder - b.renderOrder)
        .map(layer => ({ ...layer })); // Return copies
    } catch (err) {
      console.warn(`[VisualHierarchyRegistry] List error:`, err.message);
      return [];
    }
  }

  /**
   * Print visual hierarchy to console (for debugging)
   * @param {boolean} verbose - If true, include opacity and blending info
   * 
   * @example
   *   VisualHierarchyRegistry.printHierarchy(true);
   */
  static printHierarchy(verbose = false) {
    console.group('[VisualHierarchyRegistry] Visual Layer Hierarchy');
    
    const layers = this.getAllLayers();
    layers.forEach((layer, index) => {
      const prefix = `  ${index + 1}. [RO=${layer.renderOrder}]`;
      if (verbose) {
        console.log(
          `${prefix} ${layer.id.padEnd(20)} — ${layer.name}`,
          `(opacity: ${layer.opacity.min}–${layer.opacity.max})`
        );
      } else {
        console.log(`${prefix} ${layer.id.padEnd(20)} — ${layer.name}`);
      }
    });
    
    console.groupEnd();
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Check if renderOrder is valid for a layer (helper)
   * @param {string} layerId - Layer ID
   * @param {number} value - RenderOrder value to check
   * @returns {boolean} True if value matches canonical renderOrder
   */
  static isValidRenderOrder(layerId, value) {
    try {
      const canonical = this.getRenderOrder(layerId);
      return value === canonical;
    } catch (err) {
      return false;
    }
  }

  /**
   * Get safe opacity clamped to layer bounds
   * @param {string} layerId - Layer ID
   * @param {number} targetOpacity - Desired opacity
   * @returns {number} Opacity clamped to layer bounds
   */
  static clampOpacity(layerId, targetOpacity) {
    try {
      const bounds = this.getOpacityBounds(layerId);
      return Math.max(bounds.min, Math.min(bounds.max, targetOpacity));
    } catch (err) {
      return Math.max(0, Math.min(1, targetOpacity));
    }
  }
}

// ============================================================================
// GLOBAL ATTACHMENT (for console debugging)
// ============================================================================

if (typeof window !== 'undefined') {
  window.VisualHierarchyRegistry = VisualHierarchyRegistry;
  
  // Add convenience method to window for debugging
  window.printVisualHierarchy = (verbose = false) => {
    VisualHierarchyRegistry.printHierarchy(verbose);
  };
}

// ============================================================================
// VALIDATION (ensure canonical values are reasonable)
// ============================================================================

try {
  const layers = VisualHierarchyRegistry.getAllLayers();
  if (layers.length === 0) {
    throw new Error('No layers defined!');
  }
  
  // Verify renderOrder values are monotonically increasing
  for (let i = 1; i < layers.length; i++) {
    if (layers[i].renderOrder <= layers[i - 1].renderOrder) {
      console.warn(
        `[VisualHierarchyRegistry] WARNING: renderOrder not strictly increasing ` +
        `at index ${i} (${layers[i-1].id} = ${layers[i-1].renderOrder}, ` +
        `${layers[i].id} = ${layers[i].renderOrder})`
      );
    }
  }
  
  console.log('[VisualHierarchyRegistry] ✅ Initialized with', layers.length, 'canonical layers');
} catch (err) {
  console.error('[VisualHierarchyRegistry] ❌ Initialization failed:', err.message);
}
