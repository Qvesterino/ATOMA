/**
 * EchoRippleSystem_Session125.js
 * ============================================================================
 * Compatibility stub for EchoRippleIntegrationPatch_Session125.
 *
 * This file preserves the expected constructor/API surface so imports resolve
 * cleanly even when the full ripple implementation is not present.
 *
 * The stub is intentionally no-op:
 * - keeps config/state objects available
 * - exposes the methods the integration patch expects
 * - does not allocate runtime visuals
 * - does not mutate link or node state
 */

export class EchoRippleSystem_Session125 {
  constructor(scene, world, linkResonanceSystem, nodeAuraSystem, config = {}) {
    this.scene = scene || null;
    this.world = world || null;
    this.linkResonanceSystem = linkResonanceSystem || null;
    this.nodeAuraSystem = nodeAuraSystem || null;

    this.config = {
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      maxRipplesPerNode: config.maxRipplesPerNode ?? 6,
      maxTotalRipples: config.maxTotalRipples ?? 512,
      propagationDelay: config.propagationDelay ?? 0.15,
      auraDeformationStrength: config.auraDeformationStrength ?? 0.35,
      ...config
    };

    this.stats = {
      activeRipples: 0,
      spawnedRipples: 0,
      propagatedRipples: 0
    };

    this._installed = true;
    this._disposed = false;
  }

  update(_deltaTime) {
    if (this._disposed || !this.config.enabled) return;
    // Compatibility stub: intentionally no-op.
  }

  dispose() {
    this._disposed = true;
    this.stats.activeRipples = 0;
  }

  getStats() {
    return {
      enabled: !!this.config.enabled,
      disposed: !!this._disposed,
      ...this.stats
    };
  }

  createRippleEffect(_position, _options = {}) {
    if (this._disposed || !this.config.enabled) return null;
    this.stats.spawnedRipples += 1;
    return {
      active: false,
      disposed: false,
      update() {},
      dispose() {
        this.disposed = true;
      }
    };
  }

  spawnRippleOnWaveBurst(link) {
    if (!link || this._disposed || !this.config.enabled) return null;
    this.stats.spawnedRipples += 1;
    return null;
  }

  spawnRippleOnCascadeHop(node) {
    if (!node || this._disposed || !this.config.enabled) return null;
    this.stats.propagatedRipples += 1;
    return null;
  }

  clearLink(_link) {
    // Compatibility stub: nothing to clean up.
  }
}

export default EchoRippleSystem_Session125;
