/**
 * VISUAL HIERARCHY REGISTRY v2.0
 * MINIMALISTA VERZIA - iba layer id + renderOrder
 * 
 * ============================================================================
 * Single authority for canonical renderOrder values across all visual layers.
 * 
 * PURPOSE:
 * - Define visual layer priority in one authoritative place
 * - Eliminate hardcoded renderOrder values scattered across codebase
 * - Provide consistent layering for all visual systems
 * - Support both Node and Link layers
 * 
 * DESIGN PRINCIPLES (v2.0):
 * ✅ Registry is READ-ONLY (no state management)
 * ✅ Registry provides ONLY id + renderOrder (no opacity/blending/logic)
 * ✅ Registry is ZERO-CONFIG (constants are immutable)
 * ✅ Unified interface for Node and Link layers
 * 
 * USAGE:
 *   import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
 *   
 *   // Query for layer renderOrder (Node)
 *   const coreOrder = VisualHierarchyRegistry.getRenderOrder('CORE');
 *   mesh.renderOrder = coreOrder;
 *   
 *   // Query for layer renderOrder (Link)
 *   const strandOrder = VisualHierarchyRegistry.getRenderOrder('LINK_STRANDS');
 *   mesh.renderOrder = strandOrder;
 * 
 * LAYER STACK (Bottom to Top):
 *   NODE LAYERS:
 *   AURA_BACKGROUND    (-100)  — Reserved for future background effects
 *   AURA               (-1)    — Halos, ambient fields (behind everything)
 *   CORE               (0)     — Primary node geometry (EnhancedNodeModels)
 *   ARCHETYPE          (1)     — Extreme/archetype geometry (in EnhancedNodeModels)
 *   
 *   LINK LAYERS (between ARCHETYPE=1 and EVOLUTION=50):
 *   LINK_SKIN          (2)     — Link atmosphere aura behind rope
 *   LINK_STRANDS        (3)     — Braided rope geometry - main link structure
 *   LINK_DIRECTIONAL    (10)    — Flow visualization along links
 *   LINK_PULSE          (11)    — Energy carrier ring traveling along link
 *   LINK_ARCS           (12)    — Electric sparks triggered by pulse ring
 *   LINK_SPARKS         (13)    — Micro-friction and tension indicators
 *   LINK_BEADS          (14)    — Traveling particles along links
 *   LINK_IMPACTS        (15)    — Transient hit effects at nodes
 *   LINK_PARTICLES      (20)    — Ambient particle effects (trail/healing/corruption)
 *   
 *   NODE LAYERS (continued):
 *   EVOLUTION          (50)    — Evolution visuals, personality overlays
 *   FX                 (100)   — Particles, pulses, transient effects
 *   DEBUG              (200)   — Legacy debug overlays (only if enabled)
 * 
 * INTEGRATION CHECKLIST:
 * ✅ EnhancedNodeModels — use registry for core/archetype renderOrder
 * ✅ NodeAuraSystem_v1 — use registry for aura renderOrder
 * ✅ LinkRendererConduit — use registry for link layers
 * ✅ All Link subsystems — use registry for link renderOrder
 * 
 * SAFETY:
 * - If layer not found, systems get safe default (0)
 * - No breaking changes to existing code
 * - Systems can opt-in to using registry gradually
 * 
 * ============================================================================
 */

export class VisualHierarchyRegistry {
  // ========================================================================
  // NODE LAYER IDENTIFIERS (Immutable constants)
  // ========================================================================
  
  static LAYER_AURA_BACKGROUND = 'AURA_BACKGROUND';
  static LAYER_AURA = 'AURA';
  static LAYER_CORE = 'CORE';
  static LAYER_ARCHETYPE = 'ARCHETYPE';
  static LAYER_EVOLUTION = 'EVOLUTION';
  static LAYER_FX = 'FX';
  static LAYER_DEBUG = 'DEBUG';

  // ========================================================================
  // LINK LAYER IDENTIFIERS (Immutable constants)
  // ========================================================================
  
  static LAYER_LINK_SKIN = 'LINK_SKIN';
  static LAYER_LINK_STRANDS = 'LINK_STRANDS';
  static LAYER_LINK_DIRECTIONAL = 'LINK_DIRECTIONAL';
  static LAYER_LINK_PULSE = 'LINK_PULSE';
  static LAYER_LINK_ARCS = 'LINK_ARCS';
  static LAYER_LINK_SPARKS = 'LINK_SPARKS';
  static LAYER_LINK_BEADS = 'LINK_BEADS';
  static LAYER_LINK_IMPACTS = 'LINK_IMPACTS';
  static LAYER_LINK_PARTICLES = 'LINK_PARTICLES';

  // ========================================================================
  // NODE RENDER ORDER VALUES (Immutable)
  // ========================================================================

  static NODE_LAYER_ORDER = {
    AURA_BACKGROUND: -100,
    AURA: -1,
    CORE: 0,
    ARCHETYPE: 1,
    EVOLUTION: 50,
    FX: 100,
    DEBUG: 200
  };

  // ========================================================================
  // LINK RENDER ORDER VALUES (Immutable)
  // Range: 2-20 (between ARCHETYPE=1 and EVOLUTION=50)
  // ========================================================================

  static LINK_LAYER_ORDER = {
    SKIN: 2,
    STRANDS: 3,
    DIRECTIONAL: 10,
    PULSE: 11,
    ARCS: 12,
    SPARKS: 13,
    BEADS: 14,
    IMPACTS: 15,
    PARTICLES: 20
  };

  // ========================================================================
  // UNIFIED QUERY INTERFACE
  // ========================================================================

  /**
   * Get renderOrder value for a visual layer (Node or Link)
   * 
   * Node layers: use layerId directly (e.g., 'CORE', 'AURA')
   * Link layers: use 'LINK_*' format (e.g., 'LINK_STRANDS', 'LINK_PULSE')
   * 
   * @param {string} layerId - Layer ID (e.g., 'CORE', 'LINK_STRANDS')
   * @returns {number} renderOrder value
   * 
   * @example
   *   // Node layer
   *   const coreOrder = VisualHierarchyRegistry.getRenderOrder('CORE');  // Returns 0
   *   mesh.renderOrder = coreOrder;
   *   
   *   // Link layer
   *   const strandOrder = VisualHierarchyRegistry.getRenderOrder('LINK_STRANDS');  // Returns 3
   *   mesh.renderOrder = strandOrder;
   */
  static getRenderOrder(layerId) {
    // Check node layers first
    if (this.NODE_LAYER_ORDER[layerId] !== undefined) {
      return this.NODE_LAYER_ORDER[layerId];
    }
    
    // Check link layers (map LAYER_LINK_SKIN → SKIN)
    const linkLayerName = layerId.replace('LINK_', '');
    if (this.LINK_LAYER_ORDER[linkLayerName] !== undefined) {
      return this.LINK_LAYER_ORDER[linkLayerName];
    }
    
    // Unknown layer - log and return safe default
    console.warn(
      `[VisualHierarchyRegistry] Unknown layer: ${layerId}, returning default: 0`
    );
    return 0;
  }

  /**
   * Get all layers in priority order (bottom to top)
   * @returns {Object} { node: Array, link: Array } sorted by renderOrder
   * 
   * @example
   *   const layers = VisualHierarchyRegistry.getAllLayers();
   *   console.log('Node layers:', layers.node);
   *   console.log('Link layers:', layers.link);
   */
  static getAllLayers() {
    const nodeLayers = Object.entries(this.NODE_LAYER_ORDER)
      .sort(([, a], [, b]) => a - b)
      .map(([id, renderOrder]) => ({ id, renderOrder, type: 'node' }));
    
    const linkLayers = Object.entries(this.LINK_LAYER_ORDER)
      .sort(([, a], [, b]) => a - b)
      .map(([id, renderOrder]) => ({ 
        id: `LINK_${id}`, 
        renderOrder, 
        type: 'link' 
      }));
    
    return {
      node: nodeLayers,
      link: linkLayers,
      all: [...nodeLayers, ...linkLayers].sort((a, b) => a.renderOrder - b.renderOrder)
    };
  }

  /**
   * Verify renderOrder hierarchy (for debugging/validation)
   * 
   * @param {string} layerId1 - First layer ID
   * @param {string} layerId2 - Second layer ID
   * @returns {number} -1 if layer1 < layer2, 0 if equal, 1 if layer1 > layer2
   * 
   * @example
   *   VisualHierarchyRegistry.compareOrder('CORE', 'EVOLUTION');  // Returns -1 (core is lower)
   *   VisualHierarchyRegistry.compareOrder('LINK_STRANDS', 'LINK_PULSE');  // Returns -1 (strands lower)
   */
  static compareOrder(layerId1, layerId2) {
    try {
      const order1 = this.getRenderOrder(layerId1);
      const order2 = this.getRenderOrder(layerId2);
      
      if (order1 < order2) return -1;
      if (order1 > order2) return 1;
      return 0;
    } catch (err) {
      console.warn(`[VisualHierarchyRegistry] Comparison error:`, err.message);
      return 0;
    }
  }

  /**
   * Print visual hierarchy to console (for debugging)
   * 
   * @param {boolean} verbose - If true, print node and link separately
   * 
   * @example
   *   VisualHierarchyRegistry.printHierarchy(true);
   */
  static printHierarchy(verbose = false) {
    console.group('[VisualHierarchyRegistry] Visual Layer Hierarchy');
    
    const layers = this.getAllLayers();
    
    if (verbose) {
      // Print node and link layers separately
      console.group('Node Layers:');
      layers.node.forEach((layer, index) => {
        console.log(`  ${index + 1}. [RO=${layer.renderOrder}] ${layer.id}`);
      });
      console.groupEnd();
      
      console.group('Link Layers:');
      layers.link.forEach((layer, index) => {
        console.log(`  ${index + 1}. [RO=${layer.renderOrder}] ${layer.id}`);
      });
      console.groupEnd();
    } else {
      // Print all layers combined
      layers.all.forEach((layer, index) => {
        const prefix = layer.type === 'link' ? '[LINK] ' : '[NODE] ';
        console.log(`  ${index + 1}. [RO=${layer.renderOrder}] ${prefix}${layer.id}`);
      });
    }
    
    console.groupEnd();
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default VisualHierarchyRegistry;

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
  if (layers.all.length === 0) {
    throw new Error('No layers defined!');
  }
  
  // Verify renderOrder values are monotonically increasing
  for (let i = 1; i < layers.all.length; i++) {
    if (layers.all[i].renderOrder <= layers.all[i - 1].renderOrder) {
      console.warn(
        `[VisualHierarchyRegistry] WARNING: renderOrder not strictly increasing ` +
        `at index ${i} (${layers.all[i-1].id} = ${layers.all[i-1].renderOrder}, ` +
        `${layers.all[i].id} = ${layers.all[i].renderOrder})`
      );
    }
  }
  
  console.log(
    '[VisualHierarchyRegistry] ✅ Initialized v2.0 with',
    layers.node.length, 'node layers +',
    layers.link.length, 'link layers =',
    layers.all.length, 'total layers'
  );
} catch (err) {
  console.error('[VisualHierarchyRegistry] ❌ Initialization failed:', err.message);
}
