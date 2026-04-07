/**
 * MaterialCache — lightweight per-key material deduplication.
 *
 * Purpose:
 *   Avoid duplicate THREE.Material instances that share identical configuration.
 *   Each material is stored once under a stable key and reused across all consumers.
 *
 * Contract:
 *   - Materials are NEVER mutated after creation.
 *   - No .clone() — consumers share the same instance.
 *   - Keys follow the format: "<category>_<variant>_<state>"
 *   - Thread-safe by design (single-threaded JS, no async in factory).
 *
 * Usage:
 *   const mat = MaterialCache.get("input_signal_core_default", () => new THREE.MeshStandardMaterial({...}));
 */
export class MaterialCache {
  /** @type {Map<string, THREE.Material>} */
  static _cache = new Map();

  /**
   * Retrieve or create a cached material.
   *
   * @param {string} key — stable cache key (e.g. "input_signal_core_default")
   * @param {function(): THREE.Material} factoryFn — called only on cache miss
   * @returns {THREE.Material}
   */
  static get(key, factoryFn) {
    const existing = MaterialCache._cache.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const material = factoryFn();
    material.userData = material.userData || {};
    material.userData.__materialKey = key;

    MaterialCache._cache.set(key, material);
    return material;
  }

  /**
   * Check if a key exists in the cache.
   * @param {string} key
   * @returns {boolean}
   */
  static has(key) {
    return MaterialCache._cache.has(key);
  }

  /**
   * Current number of cached materials.
   * @returns {number}
   */
  static get size() {
    return MaterialCache._cache.size;
  }

  /**
   * Dispose all cached materials and clear the cache.
   * Should only be called during scene teardown.
   */
  static clear() {
    for (const material of MaterialCache._cache.values()) {
      if (material && typeof material.dispose === 'function') {
        material.dispose();
      }
    }
    MaterialCache._cache.clear();
  }
}