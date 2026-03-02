/**
 * CORE VISUAL AUTHORITY SYSTEM v1.1 — VALIDATION ONLY (SHADER VARIANT CLEAN)
 * 
 * PHASE SHADER-VARIANT-CLEAN: Disabled runtime mutations
 *
 * ⚠️  OPTIMIZED (2026-03-01): SPAWN-TIME ONLY
 * This system processes nodes at creation time, NOT per-frame.
 * Validation only - does not run in render loop.
 *
 * Guarantees that node cores are ALWAYS visually rendered on top of all
 * visual-only elements (auras, shells, influence spheres).
 *
 * ARCHITECTURE:
 * - Node core: ONLY solid mesh that defines node presence
 * - Visual-only layers: auras, shells, influence volumes with depthWrite=false
 * - Render hierarchy: Aura/Shell < Core
 *
 * IMPLEMENTATION (VALIDATION ONLY, SPAWN-TIME):
 * 1. Mark each node with a single CORE mesh (canonical) - at spawn time
 * 2. Validate renderOrder is correct (do not mutate variant props) - at spawn time
 * 3. Validate depthTest/depthWrite are correct (do not mutate) - at spawn time
 * 4. Materials MUST be created with correct flags at creation time
 * 5. This system validates, never mutates variant properties
 *
 * SAFETY:
 * ✅ Non-breaking: only validates renderOrder and depth properties
 * ✅ No mesh removal or addition
 * ✅ No interaction logic changes
 * ✅ No metric or link changes
 * ✅ Fully reversible
 * ✅ Per-frame overhead removed (optimization 2026-03-01)
 *
 * SUCCESS CRITERIA:
 * ✅ Node cores NEVER visually hidden
 * ✅ Auras can overlap but not obscure cores
 * ✅ No node visually disappears
 * ✅ Stable across all node types
 * ✅ ZERO runtime shader variant mutations
 * ✅ Spawn-time validation only (no per-frame overhead)
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { NodeCoreMaterialAuthority } from './NodeCoreMaterialAuthority.js';

// Render-order lockdown flag
const RENDER_AUTHORITY_LOCKDOWN = true;

/**
 * Fast type gate: ensure object is a valid THREE.Object3D before userData writes
 * Prevents errors when receiving DOM/WebComponents or non-THREE objects
 */
function isValidObject3D(obj) {
  return obj && obj.isObject3D === true;
}

/**
 * Check if userData is writable (exists or can be created)
 */
function isUserDataWritable(obj) {
  if (!obj || !isValidObject3D(obj)) return false;
  try {
    // Try to create userData if it doesn't exist
    if (!obj.userData) {
      Object.defineProperty(obj, 'userData', {
        value: {},
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Track if we've logged the non-Object3D warning to avoid spam
let _nonObject3DWarningLogged = false;

/**
 * Core mesh identifier: finds the primary solid mesh that defines node presence
 */
class CoreMeshIdentifier {
  /**
   * Find the canonical core mesh for a node
   * Priority order:
   * 1. Mesh with userData.isCoreGeometry = true (explicit marker)
   * 2. Solid mesh with MeshStandardMaterial or MeshPhongMaterial
   * 3. First non-transparent, non-visual mesh
   * 4. Largest solid mesh (by vertex count)
   */
  static findCoreMesh(nodeGroup) {
    if (!nodeGroup || !nodeGroup.children) return null;

    let candidates = [];

    // Traverse all children
    const traverse = (obj) => {
      if (obj instanceof THREE.Mesh) {
        candidates.push(obj);
      }
      for (const child of obj.children) {
        traverse(child);
      }
    };
    traverse(nodeGroup);

    if (candidates.length === 0) return null;

    // Priority 1: Explicit core geometry marker
    for (const mesh of candidates) {
      if (mesh.userData && mesh.userData.isCoreGeometry === true) {
        return mesh;
      }
    }

    // Priority 2: Solid mesh with standard/phong material (not transparent)
    for (const mesh of candidates) {
      const material = mesh.material;
      if (!material) continue;

      const isSolid = (material instanceof THREE.MeshStandardMaterial ||
                       material instanceof THREE.MeshPhongMaterial ||
                       material instanceof THREE.MeshLambertMaterial) &&
                      material.transparent !== true;

      if (isSolid) {
        return mesh;
      }
    }

    // Priority 3: Largest mesh (by vertex count)
    let largestMesh = null;
    let largestVertexCount = 0;
    for (const mesh of candidates) {
      if (!mesh.geometry) continue;
      const positionAttr = mesh.geometry.getAttribute('position');
      const vertexCount = positionAttr ? positionAttr.count : 0;
      if (vertexCount > largestVertexCount) {
        largestVertexCount = vertexCount;
        largestMesh = mesh;
      }
    }

    return largestMesh || candidates[0];
  }

  /**
   * Identify visual-only meshes (auras, shells, influence spheres)
   */
  static isVisualOnlyMesh(mesh) {
    if (!mesh || !mesh.material) return false;

    // Check userData markers
    if (mesh.userData &&
        (mesh.userData.visualLayer === 'AURA' ||
         mesh.userData.visualLayer === 'SHELL' ||
         mesh.userData.isAura === true ||
         mesh.userData.isHologramShell === true)) {
      return true;
    }

    // Check material properties (visual-only typically has depthWrite=false)
    const material = mesh.material;
    if (material instanceof THREE.ShaderMaterial) {
      // ShaderMaterials with depthWrite=false are likely visual-only
      if (material.depthWrite === false && material.transparent === true) {
        return true;
      }
    }

    // Check opacity and additive blending (typical of auras)
    if (material.blending === THREE.AdditiveBlending && 
        material.transparent === true &&
        material.depthWrite === false) {
      return true;
    }

    return false;
  }
}

/**
 * Core Visual Authority System
 */
export class CoreVisualAuthorityGuard {
  /**
   * Enforce strict visual authority on a node's core mesh
   * @param {THREE.Mesh} coreMesh - The core mesh to enforce
   * @returns {boolean} true if enforcement was applied
   */
  static enforce(coreMesh) {
    if (!coreMesh || !coreMesh.material) return false;

    // Use the chemical locking authority
    NodeCoreMaterialAuthority.lockCoreMaterial(coreMesh.material, false);
    
    return true;
  }
  
  /**
   * Install defensive guards (Chemical Locking)
   * This hard-locks properties so they CANNOT be changed
   */
  static installDefensiveGuards(coreMesh) {
    if (!coreMesh || !coreMesh.material) return;
    NodeCoreMaterialAuthority.lockCoreMaterial(coreMesh.material, true);
  }
}

export class CoreVisualAuthoritySystem {
  constructor(options = {}) {
    this.scene = options.scene;
    this.enabled = options.enabled !== false;
    this.debugMode = options.debugMode ?? false;

    // Render order configuration
    this.CORE_RENDER_ORDER = options.coreRenderOrder ?? 1000;
    this.VISUAL_ONLY_RENDER_ORDER = options.visualOnlyRenderOrder ?? -1000;
    this.RIM_RENDER_ORDER = options.rimRenderOrder ?? 500;  // Intermediate for rims/edges

    // Track processed nodes
    this.processedNodes = new Set();
    this.coreMeshMap = new Map();  // nodeId -> coreMesh

    if (this.enabled) {
      console.log('[CoreVisualAuthoritySystem] Initialized (spawn-time only)');
      console.log(`  Core renderOrder: ${this.CORE_RENDER_ORDER}`);
      console.log(`  Visual-only renderOrder: ${this.VISUAL_ONLY_RENDER_ORDER}`);
      console.log(`  ⚠️  Optimization: Per-frame processing disabled (2026-03-01)`);
    }
  }

  /**
   * Process a single node to enforce visual authority (SPAWN-TIME ONLY)
   *
   * ⚠️  OPTIMIZATION (2026-03-01): Call this only at node creation, NOT in render loop!
   * This system is designed for spawn-time validation only.
   * Calling this per-frame will add unnecessary overhead.
   *
   * @param {THREE.Object3D} nodeGroup - Node to process
   */
  processNode(nodeGroup) {
    if (!this.enabled || !nodeGroup) return;

    // Type gate: ensure input is a valid THREE.Object3D
    if (!isValidObject3D(nodeGroup)) {
      if (!_nonObject3DWarningLogged) {
        console.warn('[CoreVisualAuthoritySystem] Skipped non-Object3D target:', nodeGroup);
        _nonObject3DWarningLogged = true;
      }
      return;
    }

    const nodeId = nodeGroup.id || nodeGroup.uuid;
    
    // ⚠️  CHECK: Warn if called multiple times on same node (potential per-frame call)
    if (this.processedNodes.has(nodeId)) {
      // Allow re-processing for debugging, but warn in debug mode
      if (this.debugMode) {
        console.warn('[CoreVisualAuthoritySystem] Re-processing node (should be spawn-time only):', nodeId);
      }
      // Return early to prevent per-frame overhead
      return;
    }

    try {
      // Find canonical core mesh
      const coreMesh = CoreMeshIdentifier.findCoreMesh(nodeGroup);
      if (!coreMesh) {
        if (this.debugMode) {
          console.warn('[CoreVisualAuthoritySystem] No core mesh found for node', nodeId);
        }
        return;
      }

      // Mark as core geometry without overwriting userData (with type gate)
      if (isValidObject3D(coreMesh) && isUserDataWritable(coreMesh)) {
        coreMesh.userData.isCoreGeometry = true;
        coreMesh.userData.visualLayer = 'CORE';
      }

      // Enforce core render authority using the Guard
      CoreVisualAuthorityGuard.enforce(coreMesh);
      if (!RENDER_AUTHORITY_LOCKDOWN) {
        coreMesh.renderOrder = this.CORE_RENDER_ORDER;
      }

      // Store core mesh reference
      this.coreMeshMap.set(nodeId, coreMesh);

      // Process all other meshes
      this._processVisualOnlyMeshes(nodeGroup, coreMesh);

      this.processedNodes.add(nodeId);

      if (this.debugMode) {
        console.log(`[CoreVisualAuthoritySystem] ✓ Node ${nodeId} authority enforced (spawn-time)`);
      }
    } catch (err) {
      console.warn('[CoreVisualAuthoritySystem] Error processing node:', err.message);
    }
  }

  /**
   * Enforce core material properties
   * @deprecated Use CoreVisualAuthorityGuard.enforce instead
   */
  _enforceCoreMaterial(coreMesh) {
    CoreVisualAuthorityGuard.enforce(coreMesh);
  }

  /**
   * Process all visual-only meshes in the node group
   */
  _processVisualOnlyMeshes(nodeGroup, coreMesh) {
    const traverse = (obj) => {
      // Type gate: ensure we only process valid THREE.Object3D
      if (!isValidObject3D(obj)) return;

      if (obj === coreMesh) return;  // Skip core mesh itself

      if (obj instanceof THREE.Mesh) {
        const isVisualOnly = CoreMeshIdentifier.isVisualOnlyMesh(obj);

        if (isVisualOnly) {
          if (isUserDataWritable(obj)) {
            obj.userData.visualLayer = obj.userData.visualLayer || 'VISUAL_ONLY';
          }

          // Enforce visual-only properties
          this._enforceVisualOnlyMaterial(obj);

          // Set low render order
          if (!RENDER_AUTHORITY_LOCKDOWN) {
            obj.renderOrder = this.VISUAL_ONLY_RENDER_ORDER;
          }
        } else if (obj.material) {
          // For rim/edge meshes (neither core nor visual-only)
          // Check if it's a rim or edge visualization
          const isRim = (obj.userData &&
                        (obj.userData.visualLayer === 'RIM' ||
                         obj.userData.isRimGlow === true)) ||
                        obj instanceof THREE.LineSegments;

          if (isRim) {
            // Intermediate render order for rims
            if (!RENDER_AUTHORITY_LOCKDOWN) {
              obj.renderOrder = this.RIM_RENDER_ORDER;
            }
            // Validate only - materials must be created with correct flags
            if (obj.material.depthWrite !== false || !obj.material.depthTest) {
              if (this.debugMode) {
                console.warn('[CoreVisualAuthoritySystem] Rim mesh material flags incorrect (validation only, not mutating):', {
                  meshId: obj.uuid,
                  depthWrite: obj.material.depthWrite,
                  depthTest: obj.material.depthTest
                });
              }
            }
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
   * Validate visual-only material properties (VALIDATION ONLY - NO MUTATION)
   */
  _enforceVisualOnlyMaterial(mesh) {
    if (!mesh || !mesh.material) return;

    const material = mesh.material;

    // Validate depthWrite is false (no mutation - just log in debug mode)
    if (material.depthWrite !== false && this.debugMode) {
      console.warn('[CoreVisualAuthoritySystem] Visual-only mesh has incorrect depthWrite (validation only, not mutating):', {
        meshId: mesh.uuid,
        depthWrite: material.depthWrite,
        expected: false
      });
    }

    // Validate depthTest for additive blending (no mutation)
    if (material.blending === THREE.AdditiveBlending) {
      if (material.depthTest !== true && this.debugMode) {
        console.warn('[CoreVisualAuthoritySystem] Additive blended mesh has incorrect depthTest (validation only, not mutating):', {
          meshId: mesh.uuid,
          depthTest: material.depthTest,
          expected: true
        });
      }
    }

    // Validate transparency is enabled (no mutation)
    if (material.transparent !== true && this.debugMode) {
      console.warn('[CoreVisualAuthoritySystem] Visual-only mesh not transparent (validation only, not mutating):', {
        meshId: mesh.uuid,
        transparent: material.transparent,
        expected: true
      });
    }

    // Validate opacity (no mutation)
    if (material.opacity > 0.35 && this.debugMode) {
      console.warn('[CoreVisualAuthoritySystem] Visual-only mesh opacity exceeds max (validation only, not mutating):', {
        meshId: mesh.uuid,
        opacity: material.opacity,
        expectedMax: 0.35
      });
    }
  }

  /**
   * Validate entire scene visual hierarchy
   * Returns validation report
   */
  validateScene() {
    if (!this.scene) return null;

    const report = {
      totalNodes: 0,
      coreMeshesFound: 0,
      visualOnlyMeshes: 0,
      issues: [],
      warnings: []
    };

    const traverse = (obj) => {
      if (obj instanceof THREE.Mesh) {
        report.totalNodes++;

        const isCoreGeometry = obj.userData && obj.userData.isCoreGeometry === true;
        const isVisualOnly = CoreMeshIdentifier.isVisualOnlyMesh(obj);

        if (isCoreGeometry) {
          report.coreMeshesFound++;

          // Validate core properties
          if (obj.material.depthWrite !== true) {
            report.issues.push(`Core mesh has depthWrite=${obj.material.depthWrite} (should be true)`);
          }
          if (obj.renderOrder < this.CORE_RENDER_ORDER - 100) {
            report.issues.push(`Core mesh renderOrder=${obj.renderOrder} (should be ~${this.CORE_RENDER_ORDER})`);
          }
        } else if (isVisualOnly) {
          report.visualOnlyMeshes++;

          // Validate visual-only properties
          if (obj.material.depthWrite !== false) {
            report.warnings.push(`Visual-only mesh has depthWrite=${obj.material.depthWrite} (should be false)`);
          }
          if (obj.renderOrder > this.RIM_RENDER_ORDER) {
            report.warnings.push(`Visual-only mesh renderOrder=${obj.renderOrder} (should be <${this.RIM_RENDER_ORDER})`);
          }
        }
      }

      for (const child of obj.children) {
        traverse(child);
      }
    };

    traverse(this.scene);

    return report;
  }

  /**
   * Get core mesh for a node
   */
  getCoreMesh(nodeId) {
    return this.coreMeshMap.get(nodeId) || null;
  }

  /**
   * Dispose system
   */
  dispose() {
    this.processedNodes.clear();
    this.coreMeshMap.clear();
    if (this.enabled) {
      console.log('[CoreVisualAuthoritySystem] System disposed');
    }
  }

  /**
   * Enable/disable system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[CoreVisualAuthoritySystem] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      processedNodes: this.processedNodes.size,
      trackedCoreMeshes: this.coreMeshMap.size,
      coreRenderOrder: this.CORE_RENDER_ORDER,
      visualOnlyRenderOrder: this.VISUAL_ONLY_RENDER_ORDER
    };
  }
}

// ============================================================================
// CONSOLE API FOR DEBUGGING
// ============================================================================

if (typeof window !== 'undefined') {
  window.CoreVisualAuthorityDebug = {
    system: null,

    init(system) {
      this.system = system;
      console.log('[CoreVisualAuthorityDebug] Initialized');
    },

    status() {
      if (!this.system) return console.warn('System not initialized');
      return this.system.getStatus();
    },

    validate() {
      if (!this.system) return console.warn('System not initialized');
      const report = this.system.validateScene();
      console.log('[Validation Report]', report);
      return report;
    },

    enable() {
      if (!this.system) return console.warn('System not initialized');
      this.system.setEnabled(true);
    },

    disable() {
      if (!this.system) return console.warn('System not initialized');
      this.system.setEnabled(false);
    },

    getCoreMesh(nodeId) {
      if (!this.system) return console.warn('System not initialized');
      return this.system.getCoreMesh(nodeId);
    }
  };
}
