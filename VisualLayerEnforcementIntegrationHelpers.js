/**
 * VISUAL LAYER ENFORCEMENT INTEGRATION HELPERS
 * 
 * Quick-reference utilities for integrating enforcement gate checks
 * into visual rendering systems.
 * 
 * USAGE PATTERN:
 * import { createVisualAttachmentRequest } from './VisualLayerEnforcementIntegrationHelpers.js';
 * import { VisualLayerEnforcementGate } from './VisualLayerEnforcementGate.js';
 * 
 * const request = createVisualAttachmentRequest({
 *   nodeId: node.userData.id,
 *   nodeCategory: node.userData.category,
 *   layerType: 'GLYPH_LAYER',
 *   geometryType: 'Planes',
 *   opacity: 0.6,
 *   sourceSystem: 'GlyphLayer4_MultiFusion'
 * });
 * 
 * if (VisualLayerEnforcementGate.canAttach(request)) {
 *   scene.add(mesh);  // Safe to attach
 * }
 */

export class VisualLayerEnforcementIntegrationHelpers {
  /**
   * Create a standard visual attachment request
   * Validates that all required fields are present
   */
  static createVisualAttachmentRequest(options) {
    const request = {
      nodeId: options.nodeId,
      nodeCategory: options.nodeCategory,
      layerType: options.layerType,
      geometryType: options.geometryType,
      opacity: options.opacity || 1.0,
      sourceSystem: options.sourceSystem || 'UNKNOWN',
      timestamp: performance.now(),
      
      // Optional metadata
      coversCore: options.coversCore || false,
      modifiesNodeSize: options.modifiesNodeSize || false,
      description: options.description || null
    };
    
    return request;
  }
  
  /**
   * Batch-create requests for multiple meshes
   * Useful for systems adding several visuals at once (glyphs, auras, etc)
   */
  static createVisualAttachmentBatch(nodeId, nodeCategory, visuals, sourceSystem) {
    return visuals.map(visual => ({
      nodeId,
      nodeCategory,
      layerType: visual.layerType,
      geometryType: visual.geometryType,
      opacity: visual.opacity || 1.0,
      sourceSystem: sourceSystem,
      timestamp: performance.now(),
      coversCore: visual.coversCore || false,
      modifiesNodeSize: visual.modifiesNodeSize || false,
      description: visual.description || null
    }));
  }
  
  /**
   * Helper: Safely attach a mesh if it passes enforcement
   * Returns true if attached, false if rejected
   */
  static safeAttachMesh(mesh, request, targetGroup, enforcementGate) {
    if (!enforcementGate || !enforcementGate.canAttach(request)) {
      return false; // Rejected by gate
    }
    
    targetGroup.add(mesh);
    return true; // Successfully attached
  }
  
  /**
   * Helper: Safely attach multiple meshes in batch
   * Returns { attached: count, rejected: count }
   */
  static safeAttachMeshBatch(meshes, requests, targetGroup, enforcementGate) {
    if (meshes.length !== requests.length) {
      console.error('Mesh/request count mismatch');
      return { attached: 0, rejected: meshes.length };
    }
    
    let attached = 0;
    let rejected = 0;
    
    for (let i = 0; i < meshes.length; i++) {
      if (this.safeAttachMesh(meshes[i], requests[i], targetGroup, enforcementGate)) {
        attached++;
      } else {
        rejected++;
      }
    }
    
    return { attached, rejected };
  }
  
  /**
   * Generate layer-specific request template
   * Use as a starting point for common layer types
   */
  static createLayerTemplate(layerType) {
    const templates = {
      'GLYPH_LAYER': {
        layerType: 'GLYPH_LAYER',
        geometryType: 'Planes',
        opacity: 0.6,
        allowedOpacityRange: [0.4, 0.7]
      },
      'AURA_LAYER': {
        layerType: 'AURA_LAYER',
        geometryType: 'Spheres',
        opacity: 0.5,
        allowedOpacityRange: [0.3, 0.6]
      },
      'STATE_GLYPH': {
        layerType: 'STATE_GLYPH',
        geometryType: 'Rings',
        opacity: 0.4,
        allowedOpacityRange: [0.2, 0.5]
      },
      'STRESS_INDICATOR': {
        layerType: 'STRESS_INDICATOR',
        geometryType: 'Particles',
        opacity: 0.3,
        allowedOpacityRange: [0.1, 0.4]
      },
      'EDGE_GLOW': {
        layerType: 'EDGE_GLOW',
        geometryType: 'LineSegments',
        opacity: 0.6,
        allowedOpacityRange: [0.4, 0.8]
      }
    };
    
    return templates[layerType] || null;
  }
  
  /**
   * Validate opacity is within layer-specific bounds
   */
  static isOpacityValid(layerType, opacity) {
    const template = this.createLayerTemplate(layerType);
    if (!template) return true; // Unknown layer, let gate decide
    
    const [min, max] = template.allowedOpacityRange;
    return opacity >= min && opacity <= max;
  }
  
  /**
   * Suggest appropriate opacity for a layer
   */
  static getRecommendedOpacity(layerType) {
    const template = this.createLayerTemplate(layerType);
    return template ? template.opacity : 0.5;
  }
  
  /**
   * Debug helper: Format a request for console output
   */
  static formatRequestForDebug(request) {
    return {
      'Node ID': request.nodeId,
      'Category': request.nodeCategory,
      'Layer': request.layerType,
      'Geometry': request.geometryType,
      'Opacity': request.opacity.toFixed(2),
      'Source': request.sourceSystem,
      'Covers Core': request.coversCore,
      'Size Modifying': request.modifiesNodeSize
    };
  }
}

// ============================================================================
// SESSION 101: NODE INTERACTION AUTHORITY HELPERS
// ============================================================================
// These functions apply the strict raycast gating to any node mesh
// Ensures ONLY the interaction core is ever clickable

const INTERACTION_LAYER = 10;

/**
 * Apply hard raycast gate to a visual mesh
 * 
 * Marks the mesh as non-interactive and prevents raycasting:
 * - userData.nonInteractive = true
 * - layers.disable(INTERACTION_LAYER)
 * - raycast = () => null
 * 
 * Call after adding any visual layer mesh (aura, shell, effect, overlay)
 * 
 * @param {THREE.Object3D} mesh - The visual mesh to gate
 * @param {boolean} recursive - If true, gates all children too
 */
export function applyHardRaycastGate(mesh, recursive = true) {
  if (!mesh) return;

  mesh.userData.nonInteractive = true;
  mesh.layers.disable(INTERACTION_LAYER);
  mesh.raycast = () => null;

  if (recursive && mesh.traverse) {
    mesh.traverse((child) => {
      if (child === mesh) return;
      child.userData.nonInteractive = true;
      child.layers.disable(INTERACTION_LAYER);
      child.raycast = () => null;
    });
  }
}

/**
 * Mark a mesh as the interaction core
 * 
 * Call exactly ONCE per node on the primary interaction mesh:
 * - userData.interactionCore = true
 * - layers.enable(INTERACTION_LAYER)
 * 
 * @param {THREE.Mesh} mesh - The core mesh to mark
 * @param {string} nodeId - The node's unique ID
 */
export function markAsInteractionCore(mesh, nodeId) {
  if (!mesh) return false;

  mesh.userData.interactionCore = true;
  mesh.userData.interactionCoreNodeId = nodeId;
  mesh.layers.enable(INTERACTION_LAYER);

  return true;
}

/**
 * Setup complete node interaction authority
 * 
 * Call this ONCE per node after creating it:
 * 1. Marks the core mesh as interactive
 * 2. Gates all other meshes automatically
 * 
 * @param {THREE.Group} nodeGroup - The node's root group
 * @param {string} nodeId - The node's unique ID
 * @param {THREE.Mesh} coreMesh - The core mesh (if null, tries to auto-find)
 * @returns {boolean} True if setup successful
 */
export function setupNodeInteractionAuthority(nodeGroup, nodeId, coreMesh) {
  if (!nodeGroup) return false;

  let core = coreMesh;

  // Auto-find core if not provided
  if (!core) {
    // Look for explicit marker
    let found = false;
    nodeGroup.traverse((child) => {
      if (!found && child.userData?.interactionCore === true) {
        core = child;
        found = true;
      }
    });

    // If not marked, look for solid mesh
    if (!core) {
      nodeGroup.traverse((child) => {
        if (!core && child instanceof THREE.Mesh && child.material) {
          const material = child.material;
          const isSolid = (material instanceof THREE.MeshStandardMaterial ||
                           material instanceof THREE.MeshPhongMaterial ||
                           material instanceof THREE.MeshLambertMaterial) &&
                          material.transparent !== true;
          if (isSolid) {
            core = child;
          }
        }
      });
    }
  }

  if (!core) {
    if (typeof console !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.warn(`[NodeInteractionAuthority] No core found for node ${nodeId}`);
    }
    return false;
  }

  // Mark core
  markAsInteractionCore(core, nodeId);

  // Gate all others
  nodeGroup.traverse((child) => {
    if (child === core) return;
    applyHardRaycastGate(child, false);
  });

  return true;
}

/**
 * Validate node interaction authority (DEV-ONLY, no modifications)
 * 
 * @param {THREE.Group} nodeGroup - The node to validate
 * @param {string} nodeId - The node's ID
 * @returns {object} Validation report
 */
export function validateNodeInteractionAuthority(nodeGroup, nodeId) {
  const report = {
    nodeId,
    valid: true,
    coreCount: 0,
    nonInteractiveCount: 0,
    issues: []
  };

  if (!nodeGroup) {
    report.valid = false;
    report.issues.push('Node group is null');
    return report;
  }

  nodeGroup.traverse((child) => {
    if (child.userData?.interactionCore === true) {
      report.coreCount++;
      if (!child.layers.isEnabled(INTERACTION_LAYER)) {
        report.valid = false;
        report.issues.push(`Core ${child.name} not on INTERACTION_LAYER`);
      }
    }

    if (child.userData?.nonInteractive === true) {
      report.nonInteractiveCount++;
      if (child.layers.isEnabled(INTERACTION_LAYER)) {
        report.valid = false;
        report.issues.push(`Non-interactive ${child.name} still on INTERACTION_LAYER`);
      }
    }
  });

  if (report.coreCount === 0) {
    report.valid = false;
    report.issues.push('No interaction core designated');
  } else if (report.coreCount > 1) {
    report.valid = false;
    report.issues.push(`Multiple cores (${report.coreCount}). Only one expected.`);
  }

  return report;
}
