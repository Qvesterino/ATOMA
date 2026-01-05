/**
 * RAYCAST TARGET REGISTRY
 * 
 * Canonical whitelist of raycast-safe meshes.
 * 
 * ONLY meshes explicitly registered here can be raycasted.
 * All other meshes automatically disabled.
 * 
 * This eliminates unsafe intersection against:
 * - Frozen geometries
 * - FX meshes
 * - Aura meshes
 * - Link meshes
 * - Preview meshes
 * - Glyph meshes
 * - Helper meshes
 * 
 * Raycaster intersects ONLY this registry.
 * No scene traversal. No fallback logic. No mutations.
 */

export class RaycastTargetRegistry {
  
  static #targets = new Set();  // Private registry
  static #targetArray = [];      // Cached array for raycasting
  static #dirty = false;         // Cache invalidation flag
  
  /**
   * Register an interactive node mesh
   * 
   * ONLY call for:
   * - THREE.Mesh instances
   * - Visually selectable nodes
   * - Created by NodeFactory / EnhancedNodeModel
   * 
   * Called at node spawn time (once per node).
   * 
   * @param {THREE.Mesh} mesh - The mesh to register
   * @param {string} nodeId - Corresponding node ID (for tracking)
   */
  static register(mesh, nodeId = undefined) {
    if (!mesh || !mesh.isMesh) {
      console.warn('[RaycastTargetRegistry] Cannot register non-Mesh object:', mesh);
      return false;
    }

    // Already registered?
    if (this.#targets.has(mesh)) {
      return false;
    }

    // Mark mesh as raycastable
    mesh.userData = mesh.userData || {};
    mesh.userData.raycastTarget = true;
    mesh.userData.raycastTargetNodeId = nodeId;

    // Add to registry
    this.#targets.add(mesh);
    this.#dirty = true;

    return true;
  }

  /**
   * Unregister a mesh (e.g., when node deleted)
   * 
   * @param {THREE.Mesh} mesh - The mesh to remove
   */
  static unregister(mesh) {
    if (!mesh) return false;

    const removed = this.#targets.delete(mesh);
    if (removed) {
      this.#dirty = true;
      mesh.userData.raycastTarget = false;
    }
    return removed;
  }

  /**
   * Get array of registered meshes for raycasting
   * 
   * CRITICAL: Raycaster MUST use this, never scene.children
   * 
   * Usage:
   *   const raycastables = RaycastTargetRegistry.get();
   *   const hits = raycaster.intersectObjects(raycastables, false);
   * 
   * @returns {THREE.Mesh[]} Array of registered target meshes
   */
  static get() {
    // Rebuild cache if dirty
    if (this.#dirty) {
      this.#targetArray = Array.from(this.#targets);
      this.#dirty = false;
    }
    return this.#targetArray;
  }

  /**
   * Check if mesh is registered
   * 
   * @param {THREE.Mesh} mesh
   * @returns {boolean}
   */
  static isRegistered(mesh) {
    return this.#targets.has(mesh);
  }

  /**
   * Get count of registered meshes
   * 
   * @returns {number}
   */
  static count() {
    return this.#targets.size;
  }

  /**
   * Clear all registrations
   * 
   * Used for scene reset / cleanup.
   */
  static clear() {
    this.#targets.clear();
    this.#targetArray = [];
    this.#dirty = false;
  }

  /**
   * Get statistics
   * 
   * @returns {Object}
   */
  static getStats() {
    return {
      registered: this.#targets.size,
      cacheValid: !this.#dirty,
      arraySize: this.#targetArray.length
    };
  }

  /**
   * DEBUG: List all registered meshes
   */
  static debug() {
    console.group('[RaycastTargetRegistry] Registered Meshes');
    console.log(`Total: ${this.#targets.size}`);
    
    let index = 0;
    for (const mesh of this.#targets) {
      const nodeId = mesh.userData?.raycastTargetNodeId || 'unknown';
      const name = mesh.name || 'unnamed';
      console.log(`[${index}] ${name} (${nodeId})`);
      index++;
    }
    
    console.groupEnd();
  }
}

/**
 * GLOBAL USAGE PATTERN
 * 
 * At game initialization:
 * ────────────────────────
 * import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
 * 
 * // Clear on scene reset
 * RaycastTargetRegistry.clear();
 * 
 * 
 * When creating a node:
 * ─────────────────────
 * const nodeMesh = createNodeMesh(...);
 * scene.add(nodeMesh);
 * 
 * // Register for raycasting
 * RaycastTargetRegistry.register(nodeMesh, nodeId);
 * 
 * 
 * When raycasting:
 * ────────────────
 * const raycaster = new THREE.Raycaster();
 * raycaster.setFromCamera(mouse, camera);
 * 
 * // ONLY use registry, never scene
 * const raycastables = RaycastTargetRegistry.get();
 * const hits = raycaster.intersectObjects(raycastables, false);
 * 
 * if (hits.length > 0) {
 *   const targetNode = hits[0].object;
 *   // Handle selection
 * }
 * 
 * 
 * When node is deleted:
 * ────────────────────
 * RaycastTargetRegistry.unregister(nodeMesh);
 * scene.remove(nodeMesh);
 */
