/**
 * NodeAuraParticleImpactBridge.js
 * ============================================================================
 * PARTICLE IMPACT VISUAL FEEDBACK INTEGRATION
 * 
 * Bridges particle arrival impacts directly with node aura shader uniforms.
 * When particles reach destination nodes, this system:
 * 
 * 1. Updates impact managers each frame
 * 2. Gets combined impact state (displacement + color bias)
 * 3. Applies impact uniforms to node aura materials
 * 
 * Design:
 * - Subtle, non-explosive visual feedback
 * - Corruption particles → contraction + red tint
 * - Harmony particles → expansion + cyan tint
 * - 120-200ms ease-in/out animation
 * - Zero per-frame allocations (pooled impacts)
 * - Safe no-op when disabled
 * 
 * Integration:
 * 1. Initialize with linkRendererConduit.impactManager
 * 2. Call update() every frame in animate loop
 * 3. Register node materials as they're rendered
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

/**
 * PARTICLE IMPACT VISUAL FEEDBACK BRIDGE
 * Connects impact managers to node aura shader uniforms
 */
export class NodeAuraParticleImpactBridge {
  /**
   * @param {ImpactManagerCollection} impactManager - Per-node impact manager collection
   */
  constructor(impactManager) {
    this.impactManager = impactManager;
    
    // Node material tracking (nodeId → material)
    this.nodeMaterials = new Map();
    
    // Stats
    this.stats = {
      activeImpacts: 0,
      nodesWithImpacts: 0,
      lastUpdateTime: 0
    };
  }

  /**
   * Register a node's aura material for impact feedback
   * Called whenever a node aura shader material is created/rendered
   * 
   * @param {number} nodeId - Unique node identifier
   * @param {THREE.ShaderMaterial} material - Node aura material with impact uniforms
   */
  registerNodeMaterial(nodeId, material) {
    if (!material || !material.uniforms) {
      return;
    }

    this.nodeMaterials.set(nodeId, material);
  }

  /**
   * Unregister a node's material (e.g., when node is destroyed)
   * 
   * @param {number} nodeId - Unique node identifier
   */
  unregisterNodeMaterial(nodeId) {
    this.nodeMaterials.delete(nodeId);
  }

  /**
   * Update all impacts and apply to node aura materials
   * Called once per frame from main animation loop
   * 
   * @param {number} currentTime - Current simulation time in seconds
   */
  update(currentTime) {
    const startTime = performance.now();

    // Update all impact managers
    if (this.impactManager) {
      this.impactManager.update(currentTime);
    }

    // Track stats
    let activeImpactCount = 0;
    let nodesWithImpacts = 0;

    // Apply impact state to node materials
    for (const [nodeId, material] of this.nodeMaterials.entries()) {
      if (!material || !material.uniforms) continue;

      // Get shader state from impact manager
      const shaderState = this.impactManager?.getShaderState?.(nodeId);

      if (!shaderState) {
        // No impacts for this node - reset to neutral
        this._setNeutralImpactState(material);
        continue;
      }

      // Apply impact state to uniforms
      this._applyImpactState(material, shaderState);

      nodesWithImpacts++;
      activeImpactCount += (shaderState.displacementFactor !== 0 ? 1 : 0);
      activeImpactCount += (shaderState.corruptionBias !== 0 ? 1 : 0);
      activeImpactCount += (shaderState.harmonyBias !== 0 ? 1 : 0);
    }

    // Update stats
    this.stats.activeImpacts = activeImpactCount;
    this.stats.nodesWithImpacts = nodesWithImpacts;
    this.stats.lastUpdateTime = performance.now() - startTime;
  }

  /**
   * Apply impact shader state to a material's uniforms
   * 
   * @private
   * @param {THREE.ShaderMaterial} material - Node aura material
   * @param {Object} shaderState - State from NodeImpactManager.getShaderState()
   */
  _applyImpactState(material, shaderState) {
    if (!material.uniforms) return;

    // Apply displacement (contraction for corruption, expansion for harmony)
    if ('uImpactDisplacement' in material.uniforms) {
      material.uniforms.uImpactDisplacement.value = shaderState.displacementFactor;
    }

    // Apply corruption color bias (red tint)
    if ('uImpactCorruptionBias' in material.uniforms) {
      material.uniforms.uImpactCorruptionBias.value = shaderState.corruptionBias;
    }

    // Apply harmony color bias (cyan/white tint)
    if ('uImpactHarmonyBias' in material.uniforms) {
      material.uniforms.uImpactHarmonyBias.value = shaderState.harmonyBias;
    }
  }

  /**
   * Reset impact uniforms to neutral state
   * 
   * @private
   * @param {THREE.ShaderMaterial} material - Node aura material
   */
  _setNeutralImpactState(material) {
    if (!material.uniforms) return;

    if ('uImpactDisplacement' in material.uniforms) {
      material.uniforms.uImpactDisplacement.value = 0;
    }

    if ('uImpactCorruptionBias' in material.uniforms) {
      material.uniforms.uImpactCorruptionBias.value = 0;
    }

    if ('uImpactHarmonyBias' in material.uniforms) {
      material.uniforms.uImpactHarmonyBias.value = 0;
    }
  }

  /**
   * Get current statistics
   * 
   * @returns {Object} Statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Clear all registered materials
   */
  clear() {
    this.nodeMaterials.clear();
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.nodeMaterials.clear();
  }
}
