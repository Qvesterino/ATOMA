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
 * CORE CONSTRAINT: NODE < 200 < LINKS
 * ==========================================
 * 
 * PRINCÍP:
 *   Node vizuály (nad ARCHETYPE=1) MUSIA byť renderOrder < 200
 *   Link vizuálmi sú vyhradený rozsah 200-300
 *   Node vysoko-level efekty používajú renderOrder >= 10 (SELECTED)
 * 
 * DÔVOD:
 *   - Bezpečnosť: Oddelený priestor pre Node a Link vizuály
 *   - Deterministika: Žiadne prekrytie → stabilné poradie
 *   - Budúcnosť: Linky môžu expandovať v rámci 200-300
 * 
 * VÝNIMKY (NEPOVOLENÉ):
 *   - Link vizuály NEMÔŽU používať < 200
 *   - Node vizuály (nad ARCHETYPE) NEMÔŽU používať 200-300
 * 
 * VIAC: docs/LINK_NODE_RENDER_ORDER_GUIDELINES.md
 * ==========================================
 * // ============================================================
// CANONICAL AURA STACK
//
// hover aura     → NodeAuraSystem_v1
// selected aura  → _UISelectedNodeHighlight3_2
// linked aura    → NodeLinkedAuraSystem
//
// All other halo / glow systems are considered LEGACY_AURA
// and must be explicitly enabled.
// ============================================================
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
 *   NODE LAYERS (< 200):
 *   AURA_BACKGROUND    (-100)  — Reserved for future background effects
 *   AURA/BASELINE_AURA (-10)   — Halos, ambient fields (behind everything)
 *   CORE               (0)     — Primary node geometry (EnhancedNodeModels)
 *   ARCHETYPE          (1)     — Extreme/archetype geometry (in EnhancedNodeModels)
 *   SELECTED           (10)    — Node selection highlighting
 *   NODE_LINKED        (15)    — Node linked state indicators
 *   NODE_LINK_GLOW     (18)    — Node link glow effects
 *   PRIMARY_UI/UI_PRIMARY (80) — Primary UI elements attached to nodes
 *   EVOLUTION          (90)    — Evolution visuals, personality overlays
 *   FX                 (95)    — Particles, pulses, transient effects
 *   DEBUG_NODE         (100)   — Node debug overlays (only if enabled)
 *   
 *   LINK LAYERS (200-300):
   *   LINK_SKIN          (200)   — Link atmosphere aura behind rope
   *   LINK_DIRECTIONAL   (205)   — Flow visualization along links
   *   LINK_STRANDS       (220)   — Braided rope geometry - main link structure
   *   LINK_GLOW          (220)   — Link glow effects
   *   LINK_PULSE         (230)   — Energy carrier ring traveling along link
   *   LINK_ARCS          (235)   — Electric sparks triggered by pulse ring
   *   LINK_PICTO         (238)   — Semantic pictogram overlays on links
   *   LINK_SPARKS        (240)   — Micro-friction and tension indicators
   *   LINK_BEADS         (245)   — Traveling particles along links
 *   LINK_IMPACTS       (250)   — Transient hit effects at nodes
 *   LINK_PARTICLES     (260)   — Ambient particle effects (trail/healing/corruption)
 *   
 *   WORLD LAYERS (400+):
 *   WORLD_BACKGROUND   (400)   — Background world effects
 *   WORLD_OVERLAY      (450)   — Overlay world effects
 *   
 *   UI LAYERS (800+):
 *   UI_PRIMARY         (800)   — Primary UI layer
 *   UI_OVERLAY         (820)   — Overlay UI layer
 *   
 *   DEBUG LAYERS (1000+):
 *   DEBUG_GLOBAL       (1000)  — Global debug overlays
 *   DEBUG_OVERLAY      (1010)  — Overlay debug information
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
  static LAYER_BASELINE_AURA = 'BASELINE_AURA';
  static LAYER_AURA = 'AURA'; // alias to BASELINE_AURA
  static LAYER_NODE_HOVER = 'NODE_HOVER';
  static LAYER_SELECTED = 'SELECTED';
  static LAYER_PRIMARY_UI = 'PRIMARY_UI';
  static LAYER_CORE = 'CORE';
  static LAYER_ARCHETYPE = 'ARCHETYPE';
  static LAYER_NODE_LINKED = 'NODE_LINKED';
  static LAYER_NODE_LINK_GLOW = 'NODE_LINK_GLOW';
  static LAYER_EVOLUTION = 'EVOLUTION';
  static LAYER_FX = 'FX';
  static LAYER_DEBUG_NODE = 'DEBUG_NODE';

  // ========================================================================
  // LINK LAYER IDENTIFIERS (Immutable constants)
  // ========================================================================
  
  static LAYER_LINK_SKIN = 'LINK_SKIN';
  static LAYER_LINK_STRANDS = 'LINK_STRANDS';
  static LAYER_LINK_DIRECTIONAL = 'LINK_DIRECTIONAL';
  static LAYER_LINK_GLOW = 'LINK_GLOW';
  static LAYER_LINK_PULSE = 'LINK_PULSE';
  static LAYER_LINK_ARCS = 'LINK_ARCS';
  static LAYER_LINK_PICTO = 'LINK_PICTO';
  static LAYER_LINK_SPARKS = 'LINK_SPARKS';
  static LAYER_LINK_BEADS = 'LINK_BEADS';
  static LAYER_LINK_BEAD_TRAILS = 'LINK_BEAD_TRAILS';
  static LAYER_LINK_IMPACTS = 'LINK_IMPACTS';
  static LAYER_LINK_PARTICLES = 'LINK_PARTICLES';

  // ========================================================================
  // WORLD / UI / DEBUG IDENTIFIERS
  // ========================================================================
  static LAYER_WORLD_BACKGROUND = 'WORLD_BACKGROUND';
  static LAYER_WORLD_OVERLAY = 'WORLD_OVERLAY';
  static LAYER_UI_PRIMARY = 'UI_PRIMARY';
  static LAYER_UI_OVERLAY = 'UI_OVERLAY';
  static LAYER_DEBUG_GLOBAL = 'DEBUG_GLOBAL';
  static LAYER_DEBUG_OVERLAY = 'DEBUG_OVERLAY';

  // ========================================================================
  // NODE RENDER ORDER VALUES (Immutable)
  // ========================================================================

  static NODE_LAYER_ORDER = {
    AURA_BACKGROUND: -100,
    BASELINE_AURA: -10,
    AURA: -10, // alias
    NODE_HOVER: 8,
    CORE: 0,
    ARCHETYPE: 1,
    SELECTED: 10,
    NODE_LINKED: 15,
    NODE_LINK_GLOW: 18,
    PRIMARY_UI: 80,
    UI_PRIMARY: 80, // alias for consistency
    EVOLUTION: 90,
    FX: 95,
    DEBUG_NODE: 100
  };

  // ========================================================================
  // LINK RENDER ORDER VALUES (Immutable)
  // Range: 200-300 (between NODE layers < 200 and WORLD layers >= 400)
  // ========================================================================

  static LINK_LAYER_ORDER = {
    SKIN: 200,
    STRANDS: 220,
    DIRECTIONAL: 205,
    GLOW: 220,
    PULSE: 230,
    ARCS: 235,
    SPARKS: 240,
    BEADS: 245,
    BEAD_TRAILS: 255,
    IMPACTS: 250,
    PICTO: 258,
    PARTICLES: 260
  };

  // ========================================================================
  // WORLD / UI / DEBUG RENDER ORDER VALUES
  // ========================================================================
  static WORLD_LAYER_ORDER = {
    WORLD_BACKGROUND: 400,
    WORLD_OVERLAY: 450
  };

  static UI_LAYER_ORDER = {
    UI_PRIMARY: 800,
    UI_OVERLAY: 820
  };

  static DEBUG_LAYER_ORDER = {
    DEBUG_GLOBAL: 1000,
    DEBUG_OVERLAY: 1010
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
   *   const strandOrder = VisualHierarchyRegistry.getRenderOrder('LINK_STRANDS');  // Returns 210
   *   mesh.renderOrder = strandOrder;
   */
  static getRenderOrder(layerId) {
    // Node layers
    if (this.NODE_LAYER_ORDER[layerId] !== undefined) {
      return this.NODE_LAYER_ORDER[layerId];
    }
    
    // Link layers (map LAYER_LINK_SKIN → SKIN)
    const linkLayerName = layerId.replace('LINK_', '');
    if (this.LINK_LAYER_ORDER[linkLayerName] !== undefined) {
      return this.LINK_LAYER_ORDER[linkLayerName];
    }

    // World layers
    if (this.WORLD_LAYER_ORDER[layerId] !== undefined) {
      return this.WORLD_LAYER_ORDER[layerId];
    }

    // UI layers
    if (this.UI_LAYER_ORDER[layerId] !== undefined) {
      return this.UI_LAYER_ORDER[layerId];
    }

    // Debug layers
    if (this.DEBUG_LAYER_ORDER[layerId] !== undefined) {
      return this.DEBUG_LAYER_ORDER[layerId];
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

    const worldLayers = Object.entries(this.WORLD_LAYER_ORDER)
      .sort(([, a], [, b]) => a - b)
      .map(([id, renderOrder]) => ({ id, renderOrder, type: 'world' }));

    const uiLayers = Object.entries(this.UI_LAYER_ORDER)
      .sort(([, a], [, b]) => a - b)
      .map(([id, renderOrder]) => ({ id, renderOrder, type: 'ui' }));

    const debugLayers = Object.entries(this.DEBUG_LAYER_ORDER)
      .sort(([, a], [, b]) => a - b)
      .map(([id, renderOrder]) => ({ id, renderOrder, type: 'debug' }));
    
    return {
      node: nodeLayers,
      link: linkLayers,
      world: worldLayers,
      ui: uiLayers,
      debug: debugLayers,
      all: [
        ...nodeLayers,
        ...linkLayers,
        ...worldLayers,
        ...uiLayers,
        ...debugLayers
      ].sort((a, b) => a.renderOrder - b.renderOrder)
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
