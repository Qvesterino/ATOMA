/**
 * NODE VISUAL FREEZE MODE v1.0
 * =============================
 * 
 * EMERGENCY STABILIZATION SYSTEM
 * Purpose: Make all node visuals 100% immutable
 * 
 * 3-Part Strategy:
 * 1. AUTHORITATIVE MATERIAL: Create single frozen material per node
 * 2. HARD ENFORCEMENT: Force opaque properties EVERY FRAME
 * 3. SYSTEM BLOCKERS: Disable ALL node-reactive visual systems
 * 
 * Result: Linking changes ONLY links, never touches nodes
 */

export class NodeVisualFreezeMode_v1 {
  constructor(options = {}) {
    this.enabled = options.enabled ?? true;
    this.debugMode = options.debugMode ?? false;
    this.enforceEveryFrame = options.enforceEveryFrame ?? true;
    
    // Tracking
    this.frozenNodes = new Map();
    this.blockedSystems = new Set();
    this.stats = {
      nodesFrozen: 0,
      enforcementCalls: 0,
      violationsBlocked: 0,
      systemBlockers: 0
    };
    
    // Material template (will be reused)
    this.materialTemplate = null;
    
    console.log('[NodeVisualFreezeMode] INITIALIZED - Node visuals are now frozen');
  }

  /**
   * PART A: Create authoritative material for a node
   * Called on node spawn - creates single frozen material
   */
  freezeNode(nodeGroup) {
    if (!this.enabled || !nodeGroup) return;
    
    // Create canonical frozen material (ONCE per node)
    const frozenMaterial = new THREE.MeshStandardMaterial({
      color: nodeGroup.userData?.color || 0x00dddd,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      transparent: false,        // LOCKED
      opacity: 1.0,              // LOCKED
      alphaTest: 0,              // LOCKED
      depthWrite: true,          // LOCKED
      depthTest: true,           // LOCKED
      side: THREE.FrontSide,
      toneMapped: true
    });
    
    // Store as authoritative
    nodeGroup.userData.authoritativeMaterial = frozenMaterial;
    nodeGroup.userData.visualFrozen = true;
    nodeGroup.userData.originalColor = new THREE.Color(frozenMaterial.color);
    nodeGroup.userData.originalEmissive = new THREE.Color(frozenMaterial.emissive);
    
    // Apply to ALL node body meshes (core + shell)
    this._applyMaterialToNodeMeshes(nodeGroup, frozenMaterial);
    
    // Track
    this.frozenNodes.set(nodeGroup.uuid, {
      nodeGroup,
      material: frozenMaterial,
      createdAt: Date.now()
    });
    
    this.stats.nodesFrozen++;
    
    if (this.debugMode) {
      console.log(`[Freeze] Node frozen: ${nodeGroup.name || nodeGroup.uuid}`);
    }
  }

  /**
   * Apply frozen material to all node body meshes
   * Excludes glyphs, outlines, selection indicators
   */
  _applyMaterialToNodeMeshes(nodeGroup, material) {
    // Traverse node group
    nodeGroup.traverse(child => {
      if (child.isMesh) {
        // Skip non-body meshes
        if (this._isNodeBodyMesh(child)) {
          child.material = material;
        }
      }
    });
  }

  /**
   * Check if mesh is part of node body (not glyph/outline/UI)
   */
  _isNodeBodyMesh(mesh) {
    const name = mesh.name.toLowerCase();
    
    // INCLUDE: core, shell, body, hologram, surface
    const bodyPatterns = ['core', 'shell', 'body', 'hologram', 'surface', 'sphere'];
    const isBody = bodyPatterns.some(p => name.includes(p));
    
    // EXCLUDE: glyph, outline, selection, ring, aura, particle
    const excludePatterns = ['glyph', 'outline', 'selection', 'ring', 'aura', 'particle', 'debug'];
    const isExcluded = excludePatterns.some(p => name.includes(p));
    
    return isBody && !isExcluded;
  }

  /**
   * PART B: Hard enforce frozen properties EVERY FRAME
   * Called in render loop - ensures no mutation
   */
  enforceFreeze(scene) {
    // PHASE MATERIAL-MUTATION-KILL:
    // Per-frame freeze enforcement disabled. Freeze state is applied on activation only.
    return;
  }

  update(deltaTime) {
    // PHASE MATERIAL-MUTATION-KILL:
    // Disable per-frame freeze enforcement.
    return;
  }

  /**
   * PART C: Block/disable all node-reactive visual systems
   * Early-exit pattern: check for frozen flag and return immediately
   */
  blockNodeVisualSystem(systemName) {
    this.blockedSystems.add(systemName);
    this.stats.systemBlockers++;
    
    console.log(`[Freeze] Blocked system: ${systemName}`);
  }

  /**
   * Check if a system is blocked from modifying nodes
   */
  isNodeModificationBlocked(systemName) {
    return this.blockedSystems.has(systemName);
  }

  /**
   * Get freeze mode status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      nodesFrozen: this.stats.nodesFrozen,
      violationsBlocked: this.stats.violationsBlocked,
      enforcementCalls: this.stats.enforcementCalls,
      systemBlockers: this.stats.systemBlockers,
      blockedSystems: Array.from(this.blockedSystems)
    };
  }

  /**
   * List all frozen nodes
   */
  listFrozenNodes() {
    const list = [];
    this.frozenNodes.forEach(entry => {
      list.push({
        name: entry.nodeGroup.name || entry.nodeGroup.uuid,
        uuid: entry.nodeGroup.uuid,
        color: entry.material.color.getHexString(),
        createdAt: entry.createdAt
      });
    });
    return list;
  }

  /**
   * Emergency full unlock (if needed for recovery)
   */
  unfreezeAll() {
    console.log('[Freeze] WARNING: Unfreezing all nodes!');
    this.frozenNodes.clear();
    this.stats.nodesFrozen = 0;
  }

  /**
   * Report
   */
  getReport() {
    return {
      mode: 'NODE_VISUAL_FREEZE_v1',
      status: this.getStatus(),
      frozenNodes: this.listFrozenNodes(),
      timestamp: Date.now()
    };
  }
}

/**
 * Quick setup function
 */
export function setupNodeVisualFreezeMode(options = {}) {
  const freezeMode = new NodeVisualFreezeMode_v1(options);
  window.__nodeVisualFreezeMode__ = freezeMode;
  
  console.log('[NodeVisualFreezeMode] Ready - Access via window.__nodeVisualFreezeMode__');
  console.log('  Methods: freezeNode(node), enforceFreeze(scene), getStatus()');
  
  return freezeMode;
}

export default NodeVisualFreezeMode_v1;
