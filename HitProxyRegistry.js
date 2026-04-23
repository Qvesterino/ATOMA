/**
 * ============================================================================
 * HIT PROXY REGISTRY — O(1) Interactive Object Registry
 * ============================================================================
 *
 * PURPOSE:
 *   Replace all scene.traverse() calls in HitProxySystem with a deterministic,
 *   Set-based registry. Interactive objects are explicitly registered/unregistered
 *   at creation/disposal time — zero implicit scene scanning.
 *
 * PERFORMANCE:
 *   - register():   O(1) — Set.add
 *   - unregister(): O(1) — Set.delete
 *   - getAll():     O(K) — iterate K interactive objects (not N scene objects)
 *   - No scene.traverse(), no scene.children recursion
 *
 * USAGE:
 *   import { HitProxyRegistry } from './HitProxyRegistry.js';
 *
 *   // Register at creation time
 *   HitProxyRegistry.register(proxyMesh);
 *
 *   // Unregister at disposal time
 *   HitProxyRegistry.unregister(proxyMesh);
 *
 *   // Get all registered objects for raycasting
 *   const targets = HitProxyRegistry.getAll();
 *
 * RULES:
 *   - Only Object3D instances can be registered
 *   - No duplicates (Set guarantees uniqueness)
 *   - Identity: uses userData.nodeId (canonical)
 *   - Safe to call register/unregister with null/undefined (no-op)
 *   - Debug mode: console.log count on demand
 * ============================================================================
 */

/**
 * Global singleton registry for all interactive (hit-proxy) objects.
 * Uses a Set for O(1) add/remove and guaranteed no duplicates.
 * @type {Set<THREE.Object3D>}
 */
const _registry = new Set();

/**
 * Track visual meshes that had raycast disabled (for enforceProxyVisualLock).
 * These are non-proxy meshes whose raycast was overridden to no-op.
 * @type {Set<THREE.Object3D>}
 */
const _disabledVisuals = new Set();

export const HitProxyRegistry = {
  // =========================================================================
  // PROXY REGISTRATION
  // =========================================================================

  /**
   * Register an interactive object (hit-proxy mesh).
   * O(1) operation. No-op if obj is invalid or already registered.
   *
   * @param {THREE.Object3D} obj - The proxy mesh to register
   * @returns {boolean} true if newly registered, false if skipped
   */
  register(obj) {
    if (!obj || typeof obj !== 'object' || !obj.isObject3D) return false;
    if (_registry.has(obj)) return false;

    _registry.add(obj);
    return true;
  },

  /**
   * Unregister an interactive object.
   * O(1) operation. Safe to call with null/undefined or unregistered objects.
   *
   * @param {THREE.Object3D} obj - The proxy mesh to unregister
   * @returns {boolean} true if was registered and removed, false otherwise
   */
  unregister(obj) {
    if (!obj) return false;
    return _registry.delete(obj);
  },

  /**
   * Check if an object is registered.
   * @param {THREE.Object3D} obj
   * @returns {boolean}
   */
  has(obj) {
    return _registry.has(obj);
  },

  /**
   * Get all registered proxy meshes as an array.
   * Returns a shallow copy to prevent mutation of the internal Set.
   * O(K) where K = number of registered proxies.
   *
   * @returns {Array<THREE.Object3D>}
   */
  getAll() {
    return Array.from(_registry);
  },

  /**
   * Get the raw Set iterator (for hot loops where array allocation is wasteful).
   * Use with: for (const obj of HitProxyRegistry.iterate()) { ... }
   *
   * @returns {Iterable<THREE.Object3D>}
   */
  iterate() {
    return _registry;
  },

  /**
   * Get current count of registered proxies.
   * @returns {number}
   */
  get size() {
    return _registry.size;
  },

  // =========================================================================
  // DISABLED VISUALS TRACKING
  // =========================================================================

  /**
   * Track a visual mesh that had its raycast disabled.
   * Used by enforceProxyVisualLock to iterate only known visuals
   * instead of traversing the entire scene.
   *
   * @param {THREE.Object3D} obj - Visual mesh with raycast disabled
   */
  registerDisabledVisual(obj) {
    if (!obj || typeof obj !== 'object') return;
    _disabledVisuals.add(obj);
  },

  /**
   * Untrack a disabled visual (e.g., when mesh is disposed).
   * @param {THREE.Object3D} obj
   */
  unregisterDisabledVisual(obj) {
    if (!obj) return;
    _disabledVisuals.delete(obj);
  },

  /**
   * Get all disabled visual meshes (for enforceProxyVisualLock).
   * @returns {Iterable<THREE.Object3D>}
   */
  iterateDisabledVisuals() {
    return _disabledVisuals;
  },

  /**
   * Get count of disabled visuals.
   * @returns {number}
   */
  get disabledVisualCount() {
    return _disabledVisuals.size;
  },

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * Clear all registrations. Used during scene transitions or full reset.
   */
  clear() {
    _registry.clear();
    _disabledVisuals.clear();
  },

  /**
   * Dispose all registered proxies (remove from parent, dispose geometry/material).
   * Called during scene transitions.
   */
  disposeAll() {
    for (const obj of _registry) {
      if (obj.parent) obj.parent.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose?.());
        } else {
          obj.material.dispose?.();
        }
      }
    }
    _registry.clear();
    _disabledVisuals.clear();
  },

  // =========================================================================
  // DEBUG
  // =========================================================================

  /**
   * Print registry statistics to console.
   */
  printStats() {
    console.log(`[HitProxyRegistry] Proxies: ${_registry.size}, Disabled visuals: ${_disabledVisuals.size}`);
  },

  /**
   * Get debug info object.
   * @returns {Object}
   */
  getDebugInfo() {
    return {
      proxyCount: _registry.size,
      disabledVisualCount: _disabledVisuals.size,
    };
  },
};

export default HitProxyRegistry;
