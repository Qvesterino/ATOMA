/**
 * VISUAL INTERACTION ISOLATION PATCH v2.0 - CRITICAL FIX
 * 
 * CRITICAL CHANGE FROM v1.0:
 * ❌ NO LONGER sets mesh.raycast = null (causes THREE.js TypeError)
 * ✅ NOW restores default raycast function
 * ✅ NOW uses intersection filtering instead of raycast disabling
 * 
 * MECHANISM (CORRECTED):
 * 1. Keep mesh.raycast = THREE.Mesh.prototype.raycast (default)
 * 2. Mark visual meshes: userData.nonInteractive = true
 * 3. Disable interaction layer: mesh.layers.disable(INTERACTION_LAYER)
 * 4. Filter intersections: remove nonInteractive results
 * 
 * SAFETY:
 * ✅ No THREE.js Raycaster errors
 * ✅ No "r.raycast is not a function" crashes
 * ✅ Visual meshes still part of raycasting (but filtered out)
 * ✅ Deterministic interaction behavior
 * ✅ All node types supported
 * 
 * INTEGRATION:
 *   import { setupVisualInteractionIsolation_v2 } from './VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js';
 *   import { setupRaycastInteractionFiltering } from './VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js';
 *   
 *   // Setup isolation on nodes
 *   setupVisualInteractionIsolation_v2(scene, aiNodes, options);
 *   
 *   // Setup filtering on selection system
 *   setupRaycastInteractionFiltering(linkingSystem, selectionSystem);
 */

import * as THREE from 'three';
import { tagAllowedSphere } from './VisualSpherePolicy.js';

// ============================================================================
// INTERACTION CORE IDENTIFIER (SIMPLIFIED - READ-ONLY)
// ============================================================================

class InteractionCoreIdentifier {
  /**
   * Get the interaction core for a node (READ-ONLY)
   * No longer creates or finds - just reads the marker set by AINodes
   */
  static getInteractionCore(nodeGroup) {
    let foundCore = null;

    const traverse = (obj) => {
      if (foundCore) return;
      if (obj.userData?.isInteractionCore === true) {
        foundCore = obj;
        return;
      }
      for (const child of obj.children) {
        traverse(child);
      }
    };

    traverse(nodeGroup);

    if (!foundCore) {
      return {
        mesh: null,
        reason: 'no_core_marker'
      };
    }

    return {
      mesh: foundCore,
      isProxy: foundCore.userData?.isInteractionProxy === true,
      reason: 'explicit_marker'
    };
  }

  /**
   * Identify visual-only meshes that should NOT be interactive
   */
  static isVisualOnlyMesh(mesh) {
    if (!mesh || !mesh.material) return false;

    // Explicit visual-only markers
    if (mesh.userData.visualLayer === 'AURA' ||
        mesh.userData.visualLayer === 'SHELL' ||
        mesh.userData.visualLayer === 'VISUAL_ONLY' ||
        mesh.userData.isAura === true ||
        mesh.userData.isHologramShell === true ||
        mesh.userData.visualLayer === 'RIM' ||
        mesh.userData.isRimGlow === true) {
      return true;
    }

    // Glyph/symbol meshes
    if (mesh.userData.isGlyph === true) {
      return true;
    }

    // Link visual meshes
    if (mesh.userData.isLinkVisual === true ||
        mesh.userData.isLinkGlow === true ||
        mesh.userData.isNeuralCurve === true) {
      return true;
    }

    // Harmony/integration field meshes
    if (mesh.userData.isHarmonyField === true ||
        mesh.userData.isIntegrationField === true) {
      return true;
    }

    // Particle/FX meshes
    if (mesh.userData.isFX === true ||
        mesh.userData.isParticle === true ||
        mesh.userData.isEffect === true) {
      return true;
    }

    // Material indicators
    const material = mesh.material;
    if (material) {
      const isAdditiveBlend = material.blending === THREE.AdditiveBlending;
      const isTransparent = material.transparent === true;
      const hasLowOpacity = material.opacity < 0.7;
      const noDepthWrite = material.depthWrite === false;

      const visualIndicators = [
        isAdditiveBlend,
        isTransparent,
        hasLowOpacity,
        noDepthWrite
      ].filter(x => x).length;

      if (visualIndicators >= 2) {
        return true;
      }
    }

    return false;
  }
}

// ============================================================================
// INTERACTION ISOLATION ENGINE v2.0 - CRITICAL FIX
// ============================================================================

class InteractionIsolationEngine_v2 {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.interactionLayer = options.interactionLayer ?? 10;
    this.debugMode = options.debugMode ?? false;
    this.autoProxyRadius = options.autoProxyRadius ?? 0.6;

    this.processedNodes = new Set();
    this.coreMeshMap = new Map();
    this.nonInteractiveMeshes = new Set();

    if (this.enabled) {
      console.log('[InteractionIsolation v2.0] Engine initialized (CRITICAL FIX)');
      console.log(`  Interaction layer: ${this.interactionLayer}`);
      console.log(`  ⚠️  Using intersection filtering (NOT raycast disabling)`);
    }
  }

  /**
   * Process a single node to isolate interaction
   */
  processNode(nodeGroup) {
    if (!this.enabled || !nodeGroup) return;

    const nodeId = nodeGroup.id || nodeGroup.uuid;
    if (this.processedNodes.has(nodeId)) {
      return;
    }

    try {
      // Get interaction core (READ-ONLY - created by AINodes)
      const coreInfo = InteractionCoreIdentifier.getInteractionCore(nodeGroup);

      if (!coreInfo?.mesh) {
        if (this.debugMode) {
          console.warn('[InteractionIsolation v2.0] No interaction core found for node', nodeId);
        }
        return;
      }

      const coreMesh = coreInfo.mesh;

      // CRITICAL FIX: Restore default raycast function (don't set to null!)
      coreMesh.raycast = THREE.Mesh.prototype.raycast;

      // Enable interaction layer on core
      coreMesh.layers.enable(this.interactionLayer);

      this.coreMeshMap.set(nodeId, {
        mesh: coreMesh,
        isProxy: coreInfo.isProxy,
        reason: coreInfo.reason
      });

      // Mark and disable interaction on visual-only meshes
      this._markVisualOnlyMeshes(nodeGroup, coreMesh);

      this.processedNodes.add(nodeId);

      if (this.debugMode) {
        console.log(
          `[InteractionIsolation v2.0] ✓ Node ${nodeId} isolated ` +
          `(core: ${coreInfo.reason}, proxy: ${coreInfo.isProxy})`
        );
      }
    } catch (err) {
      console.warn('[InteractionIsolation v2.0] Error processing node:', err.message);
    }
  }

  /**
   * Mark visual-only meshes as non-interactive (CRITICAL FIX v2.0)
   */
  _markVisualOnlyMeshes(nodeGroup, coreMesh) {
    const traverse = (obj) => {
      if (obj === coreMesh) return;

      if (obj instanceof THREE.Mesh) {
        const isVisualOnly = InteractionCoreIdentifier.isVisualOnlyMesh(obj);

        if (isVisualOnly) {
          // CRITICAL FIX v2.0: Mark as non-interactive
          obj.userData.nonInteractive = true;
          obj.userData.isVisualOnly = true;

          // CRITICAL FIX v2.0: Restore default raycast (don't set to null!)
          obj.raycast = THREE.Mesh.prototype.raycast;

          // Disable from interaction layer
          obj.layers.disable(this.interactionLayer);

          // Track for filtering
          this.nonInteractiveMeshes.add(obj.uuid);

          if (this.debugMode) {
            console.log(`[InteractionIsolation v2.0]   Marked non-interactive: ${obj.name || obj.constructor.name}`);
          }
        }
      }

      for (const child of obj.children) {
        traverse(child);
      }
    };

    traverse(nodeGroup);
  }

  /**
   * Filter raycast intersections to remove non-interactive meshes
   * CRITICAL: Call this on intersection results from raycaster
   */
  filterIntersections(intersections) {
    if (!this.enabled || !intersections) return intersections;

    return intersections.filter(intersection => {
      const mesh = intersection.object;
      // Keep intersection if mesh is NOT marked non-interactive
      return mesh.userData.nonInteractive !== true;
    });
  }

  /**
   * Estimate core radius
   */
  _estimateCoreRadius(nodeGroup) {
    let maxRadius = 0.7;

    const hasFinitePositions = (geometry) => {
      const arr = geometry?.attributes?.position?.array;
      if (!arr) return false;
      for (let i = 0; i < arr.length; i++) {
        if (!Number.isFinite(arr[i])) return false;
      }
      return true;
    };

    const traverse = (obj) => {
      if (obj instanceof THREE.Mesh && obj.geometry) {
        if (hasFinitePositions(obj.geometry)) {
          obj.geometry.computeBoundingSphere();
        }
        if (obj.geometry.boundingSphere) {
          maxRadius = Math.max(maxRadius, obj.geometry.boundingSphere.radius * 1.5);
        }
      }

      for (const child of obj.children) {
        traverse(child);
      }
    };

    traverse(nodeGroup);
    return Math.min(maxRadius, 2.0);
  }

  /**
   * Validate scene
   */
  validateScene() {
    const report = {
      totalProcessed: this.processedNodes.size,
      totalCores: this.coreMeshMap.size,
      totalNonInteractive: this.nonInteractiveMeshes.size,
      issues: [],
      warnings: []
    };

    // Check all cores
    for (const [nodeId, coreInfo] of this.coreMeshMap) {
      if (!coreInfo.mesh.raycast) {
        report.issues.push(`Core mesh missing raycast function: ${nodeId}`);
      }
      if (coreInfo.mesh.userData.isInteractionCore !== true) {
        report.issues.push(`Core mesh marker missing: ${nodeId}`);
      }
    }

    return report;
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      processedNodes: this.processedNodes.size,
      trackedCores: this.coreMeshMap.size,
      nonInteractiveMeshes: this.nonInteractiveMeshes.size,
      interactionLayer: this.interactionLayer
    };
  }

  /**
   * Dispose
   */
  dispose() {
    this.processedNodes.clear();
    this.coreMeshMap.clear();
    this.nonInteractiveMeshes.clear();
    if (this.enabled) {
      console.log('[InteractionIsolation v2.0] System disposed');
    }
  }
}

// ============================================================================
// PUBLIC SETUP FUNCTIONS
// ============================================================================

export function setupVisualInteractionIsolation_v2(scene, aiNodes, options = {}) {
  if (!scene || !aiNodes) {
    console.warn('[InteractionIsolation v2.0] Missing scene or aiNodes');
    return null;
  }

  // Create isolation engine
  const engine = new InteractionIsolationEngine_v2({
    enabled: options.enabled !== false,
    interactionLayer: options.interactionLayer ?? 10,
    debugMode: options.debugMode ?? false,
    autoProxyRadius: options.autoProxyRadius ?? 0.6
  });

  // Process all existing nodes
  if (aiNodes.nodes && Array.isArray(aiNodes.nodes)) {
    for (const node of aiNodes.nodes) {
      engine.processNode(node);
    }
  }

  // Log completion
  console.log('[InteractionIsolation v2.0] Visual layers marked non-interactive ✓');
  console.log(`[InteractionIsolation v2.0] Processed ${engine.processedNodes.size} nodes`);
  console.log(`[InteractionIsolation v2.0] ${engine.nonInteractiveMeshes.size} visual meshes marked`);
  console.log('[InteractionIsolation v2.0] ⚠️  REMEMBER: Filter intersections in selection system!');

  // Setup debug API
  if (typeof window !== 'undefined') {
    window.InteractionIsolationDebug = {
      engine,

      status() {
        return engine.getStatus();
      },

      validate() {
        return engine.validateScene();
      },

      filterIntersections(intersections) {
        return engine.filterIntersections(intersections);
      }
    };

    console.log('[InteractionIsolation v2.0] Console API available: window.InteractionIsolationDebug');
  }

  return engine;
}

/**
 * Setup raycaster intersection filtering
 * CRITICAL: Call this on all raycast intersection handling
 */
export function setupRaycastInteractionFiltering(engine) {
  if (!engine) {
    console.warn('[InteractionIsolation v2.0] No engine provided for filtering setup');
    return null;
  }

  return {
    /**
     * Filter intersections to remove non-interactive meshes
     * USE THIS: intersects = filterRaycastResults(intersects);
     */
    filterRaycastResults(intersections) {
      return engine.filterIntersections(intersections);
    },

    /**
     * Check if intersection is interactive
     */
    isInteractive(intersection) {
      return intersection.object.userData.nonInteractive !== true;
    },

    /**
     * Get only interactive intersections
     */
    getInteractiveIntersections(intersections) {
      return intersections.filter(i => this.isInteractive(i));
    }
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export { InteractionIsolationEngine_v2, InteractionCoreIdentifier };

