/**
 * ============================================================================
 * NODE SHELL SIZE AUTHORITY SYSTEM v1.0
 * ============================================================================
 * 
 * RESPONSIBILITY:
 * Enforce static, immutable shell sizes that are derived ONLY from:
 * - Node base geometry size
 * - Node category/archetype (static)
 * - Optional visual tier (static)
 * 
 * NOT affected by:
 * - Load pressure
 * - Network stress
 * - Corruption
 * - Link count
 * - Link quality
 * - Any other dynamic network metric
 * 
 * DESIGN:
 * - Shells maintain consistent world-space size
 * - Visual hierarchy remains readable (no excessive growth)
 * - Opacity/intensity MAY vary, but NOT scale
 * - Node identity preserved through consistent sizing
 * 
 * INTEGRATION:
 * const shellAuthority = new NodeShellSizeAuthority();
 * 
 * // Per-node registration
 * shellAuthority.registerNode(node, category, baseSize);
 * 
 * // Per-frame enforcement
 * shellAuthority.enforceShellSizes(scene, nodeAuraSystem);
 * 
 * ============================================================================
 */

export class NodeShellSizeAuthority {
  constructor(config = {}) {
    // Category-based shell size mapping (static)
    this.categoryShellSizes = {
      'crystal': 1.0,           // Standard baseline
      'harmonic': 1.0,
      'fractal': 0.95,          // Slightly smaller
      'quantum': 0.85,          // Compact
      'umbra': 1.1,             // Slightly larger
      'solar': 1.05,
      'glyph': 0.9,
      'echo': 0.95,
      'convergence': 1.0,
      'ascended': 1.15,         // Larger for special status
      
      // Extended categories
      'input': 0.95,
      'process': 1.0,
      'integration': 1.05,
      'analytics': 0.95,
      'storage': 1.1,
      'control': 1.0,
      'emotional': 1.0,
      'sigma': 1.0,
      'quantum': 0.85,
    };
    
    // Node-specific overrides (if needed)
    this.nodeOverrides = new Map();   // nodeId → shellSize
    
    // Configuration
    this.config = {
      // Base shell size (before category/tier multipliers)
      baseShellSize: config.baseShellSize ?? 1.0,
      
      // Tier-based multipliers (evolution level)
      tierMultipliers: config.tierMultipliers ?? {
        1: 0.9,      // Tier 1: 90% of base
        2: 1.0,      // Tier 2: 100% (standard)
        3: 1.1,      // Tier 3: 110%
        4: 1.2,      // Tier 4: 120%
        5: 1.3,      // Tier 5: 130%
      },
      
      // Size range clamps (never allow extreme values)
      minShellSize: config.minShellSize ?? 0.6,
      maxShellSize: config.maxShellSize ?? 1.5,
      
      // Enable enforcement (can be toggled)
      enabled: config.enabled !== false,
      
      // Debug mode
      debugMode: config.debugMode ?? false,

      // Minimum interval between enforcement passes (milliseconds)
      minEnforceIntervalMs: config.minEnforceIntervalMs ?? 250,
    };
    
    // Computed shell sizes per node (cached)
    this.computedSizes = new Map();   // nodeId → computedShellSize
    this.registeredNodes = new Map(); // nodeId -> node reference
    this._lastEnforceAt = 0;
    
    if (this.config.enabled) {
      console.log('[NodeShellSizeAuthority] Initialized');
      console.log(`  Base shell size: ${this.config.baseShellSize}`);
      console.log(`  Min clamp: ${this.config.minShellSize}, Max clamp: ${this.config.maxShellSize}`);
    }
  }
  
  /**
   * Compute static shell size for a node based on category and tier
   * Result is cached and never changes based on dynamic metrics
   * @param {Object} node - Node to compute size for
   * @param {string} category - Node category (archetype)
   * @param {number} tier - Evolution tier (1-5)
   * @returns {number} Static shell size (1.0 baseline)
   */
  computeNodeShellSize(node, category, tier = 2) {
    const nodeId = this._resolveNodeId(node);
    if (!nodeId) return this.config.baseShellSize;
    
    // Check for node-specific override
    if (this.nodeOverrides.has(nodeId)) {
      return this.nodeOverrides.get(nodeId);
    }
    
    // Check cached computation
    if (this.computedSizes.has(nodeId)) {
      return this.computedSizes.get(nodeId);
    }
    
    // ===== COMPUTE STATIC SIZE =====
    let shellSize = this.config.baseShellSize;
    
    // Apply category multiplier (normalized category name)
    const normalizedCategory = (category || 'crystal').toLowerCase();
    const categoryMult = this.categoryShellSizes[normalizedCategory] ?? 1.0;
    shellSize *= categoryMult;
    
    // Apply tier multiplier
    const tierMult = this.config.tierMultipliers[tier] ?? 1.0;
    shellSize *= tierMult;
    
    // Clamp to valid range
    shellSize = Math.max(this.config.minShellSize, 
                        Math.min(this.config.maxShellSize, shellSize));
    
    // Cache result
    this.computedSizes.set(nodeId, shellSize);
    
    if (this.config.debugMode) {
      console.log(`[NodeShellSizeAuthority] Computed shell size for ${nodeId}`);
      console.log(`  Category: ${normalizedCategory} (${categoryMult}x)`);
      console.log(`  Tier: ${tier} (${tierMult}x)`);
      console.log(`  Final size: ${shellSize.toFixed(3)}`);
    }
    
    return shellSize;
  }
  
  /**
   * Register a node with its static shell size
   * Should be called when node is created/spawned
   * @param {Object} node - Node to register
   * @param {string} category - Node category (archetype)
   * @param {number} tier - Evolution tier (optional, default 2)
   */
  registerNode(node, category, tier = 2) {
    const shellSize = this.computeNodeShellSize(node, category, tier);
    const nodeId = this._resolveNodeId(node);
    
    // Store in node userData for later reference
    if (node.userData) {
      node.userData.staticShellSize = shellSize;
      node.userData.shellCategory = category;
      node.userData.shellTier = tier;
    }

    if (nodeId) {
      this.registeredNodes.set(nodeId, node);
    }
    
    return shellSize;
  }
  
  /**
   * Set a node-specific shell size override
   * Useful for special cases or editor adjustments
   * @param {Object} node - Node to override
   * @param {number} size - Custom shell size
   */
  setNodeOverride(node, size) {
    const nodeId = this._resolveNodeId(node);
    if (!nodeId) return;
    const clampedSize = Math.max(this.config.minShellSize,
                                Math.min(this.config.maxShellSize, size));
    this.nodeOverrides.set(nodeId, clampedSize);
    this.computedSizes.set(nodeId, clampedSize);
  }
  
  /**
   * Get the static shell size for a node
   * @param {Object} node - Node to query
   * @returns {number} Static shell size
   */
  getNodeShellSize(node) {
    const nodeId = this._resolveNodeId(node);
    if (!nodeId) return this.config.baseShellSize;
    return this.computedSizes.get(nodeId) ?? this.config.baseShellSize;
  }
  
  /**
   * Enforce all shell sizes in the scene
   * CRITICAL: Call this after aura updates to override any dynamic scaling
   * @param {THREE.Scene} scene - Scene containing shells
   * @param {NodeAuraSystem_v1} auraSystem - Aura system (optional, for direct enforcement)
   */
  enforceShellSizes(scene, auraSystem = null) {
    if (typeof window !== 'undefined' && window.ATOMA_VISUAL_BASELINE) return;

    if (!this.config.enabled) return;
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (now - this._lastEnforceAt < this.config.minEnforceIntervalMs) return;
    this._lastEnforceAt = now;
    
    // Direct enforcement via aura system if available
    if (auraSystem && auraSystem.auras) {
      for (const [nodeKey, aura] of auraSystem.auras) {
        const shellSize = this.getNodeShellSize(aura.node);
        
        // Override the aura's radius with static size
        // THIS PREVENTS DYNAMIC METRIC COUPLING
        aura.radius = shellSize;
        aura.targetRadius = shellSize;
        
        // Apply to mesh immediately
        if (aura.mesh) {
          aura.mesh.scale.setScalar(shellSize);
        }
      }
    }

    // Enforce child shell/aura meshes only for registered nodes.
    for (const [nodeId, node] of this.registeredNodes.entries()) {
      if (!node || node.parent == null) continue;
      const staticSize = this.computedSizes.get(nodeId);
      if (!staticSize) continue;
      this._enforceNodeShells(node, staticSize);
    }
  }

  _enforceNodeShells(node, staticSize) {
    if (!node || !node.traverse) return;
    node.traverse((obj) => {
      if (!obj || obj === node || !obj.isMesh || !obj.userData) return;

      // Never mutate root scale from this system.
      if (obj.userData.isNodeRoot === true) return;

      const isShell =
        obj.userData.isHologramShell ||
        obj.userData.visualLayer === 'SHELL' ||
        obj.userData.visualLayer === 'AURA';

      if (!isShell) return;
      if (Math.abs(obj.scale.x - staticSize) > 0.0001 ||
          Math.abs(obj.scale.y - staticSize) > 0.0001 ||
          Math.abs(obj.scale.z - staticSize) > 0.0001) {
        obj.scale.setScalar(staticSize);
      }
    });
  }

  _resolveNodeId(node) {
    if (node == null) return null;
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    return String(node.userData?.nodeId || node.userData?.id || node.id || node.uuid || '');
  }
  
  /**
   * Get statistics about shell sizing
   * @returns {Object} Statistics
   */
  getStatistics() {
    if (this.computedSizes.size === 0) {
      return {
        totalNodes: 0,
        averageSize: 0,
        minSize: 0,
        maxSize: 0,
      };
    }
    
    const sizes = Array.from(this.computedSizes.values());
    const sum = sizes.reduce((a, b) => a + b, 0);
    
    return {
      totalNodes: sizes.length,
      averageSize: (sum / sizes.length).toFixed(3),
      minSize: Math.min(...sizes).toFixed(3),
      maxSize: Math.max(...sizes).toFixed(3),
      overrides: this.nodeOverrides.size,
    };
  }
  
  /**
   * Reset all shell sizes (clears cache)
   * Useful for world resets or configuration changes
   */
  reset() {
    this.computedSizes.clear();
    this.nodeOverrides.clear();
    this.registeredNodes.clear();
    this._lastEnforceAt = 0;
  }
  
  /**
   * Destroy system
   */
  destroy() {
    this.reset();
  }
}
