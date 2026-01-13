/**
 * NODE SURFACE PROTECTION RULE — DEPTH ANCHOR SYSTEM
 * 
 * Solves: Transparent/holographic node cores being visually occluded by auras
 * despite correct renderOrder, because transparent materials don't write to depth.
 * 
 * Solution: Inject invisible depth anchor meshes that DO write to depth,
 * preventing auras from rendering over core area.
 * 
 * CONSTRAINTS:
 * ✓ No aura modifications
 * ✓ No event system changes
 * ✓ No per-frame logic
 * ✓ One-time setup only
 * ✓ Silent failures
 * ✓ Opt-in via node.visualProfile.requiresDepthAnchor flag
 */

import * as THREE from 'three';

export class NodeSurfaceProtection_DepthAnchor {
  constructor(config = {}) {
    this.config = {
      debugEnabled: config.debugEnabled ?? false,
      anchorOpacity: 0.001,  // Nearly invisible
      anchorScale: config.anchorScale ?? 1.05,  // Slightly larger than core to catch all aura overlap
      enableLogging: config.enableLogging ?? false
    };
    
    // Track which nodes have anchors (prevent duplicates)
    this.protectedNodes = new WeakSet();
  }
  
  /**
   * STEP 1: Create invisible depth anchor mesh
   * 
   * This mesh:
   * - Is invisible (opacity ~0)
   * - Writes to depth buffer (solid material)
   * - Follows node core geometry
   * - Prevents auras from rendering over it
   * @private
   */
  _createDepthAnchor(coreGeometry, coreScale = 1.0) {
    if (!coreGeometry) return null;
    
    try {
      // Clone core geometry for anchor
      const anchorGeometry = coreGeometry.clone();
      
      // Create solid, invisible material
      const anchorMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: this.config.anchorOpacity,
        transparent: true,
        depthWrite: true,      // ← KEY: Write to depth buffer
        depthTest: true,
        fog: false,
        side: THREE.FrontSide
      });
      
      // Create anchor mesh
      const anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
      anchor.userData.isDepthAnchor = true;
      anchor.userData.visualLayer = 'DEPTH_ANCHOR';
      anchor.name = 'depthAnchor';
      
      // Render at same order as core (prevents aura occlusion)
      anchor.renderOrder = 100;
      
      // Scale slightly larger than core to catch all aura overlap
      anchor.scale.multiplyScalar(this.config.anchorScale);
      
      return anchor;
    } catch (e) {
      // Silent failure - incompatible geometry
      return null;
    }
  }
  
  /**
   * STEP 2: Find core mesh and inject depth anchor
   * 
   * Scans node tree for core geometry, creates invisible anchor,
   * positions it at node origin, adds to node group.
   */
  protectNode(node) {
    if (!node) return false;
    
    // Already protected? Skip
    if (this.protectedNodes.has(node)) {
      return false;
    }
    
    try {
      // Check opt-in flag
      const requiresProtection = node.userData?.requiresDepthAnchor || 
                                  node.visualProfile?.requiresDepthAnchor;
      
      if (!requiresProtection) {
        return false;
      }
      
      // Find core mesh in node tree
      let coreMesh = null;
      let coreScale = 1.0;
      
      node.traverse((child) => {
        if (coreMesh) return;  // Already found
        
        if (!child.isMesh) return;
        
        // Detect core by name or userData
        const isCore = child.name?.includes('core') || 
                       child.userData?.isNodeCore || 
                       child.userData?.visualLayer === 'CORE';
        
        if (isCore && child.geometry) {
          coreMesh = child;
          coreScale = Math.max(
            child.scale.x,
            child.scale.y,
            child.scale.z
          );
        }
      });
      
      if (!coreMesh) {
        return false;  // No core found
      }
      
      // Check if core uses transparent/problematic material
      const needsAnchor = this._checkNeedsDepthAnchor(coreMesh);
      
      if (!needsAnchor) {
        return false;  // Core is solid, no anchor needed
      }
      
      // Create depth anchor
      const anchor = this._createDepthAnchor(coreMesh.geometry, coreScale);
      
      if (!anchor) {
        return false;  // Failed to create anchor
      }
      
      // Add anchor to node at same position as core
      node.add(anchor);
      
      // Mark as protected
      this.protectedNodes.add(node);
      
      if (this.config.debugEnabled) {
        console.log(`[NodeSurfaceProtection] Depth anchor injected for ${node.name || 'unnamed'}`);
      }
      
      return true;
    } catch (e) {
      // Silent failure
      return false;
    }
  }
  
  /**
   * Detect if core mesh needs depth anchor
   * Returns true if material is transparent/additive (won't write depth properly)
   * @private
   */
  _checkNeedsDepthAnchor(mesh) {
    if (!mesh || !mesh.material) return false;
    
    try {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      
      for (const mat of materials) {
        if (!mat || typeof mat !== 'object') continue;
        
        // Transparent materials often don't write depth properly
        if (mat.transparent && mat.opacity < 0.95) {
          return true;
        }
        
        // Additive blending materials
        if (mat.blending === THREE.AdditiveBlending) {
          return true;
        }
        
        // Custom shader materials (may not write depth)
        if (mat.isShaderMaterial) {
          return true;
        }
      }
    } catch (e) {
      // Silent failure
    }
    
    return false;
  }
  
  /**
   * Apply protection to multiple nodes
   */
  protectNodes(nodes) {
    if (!Array.isArray(nodes)) return;
    
    let protected_count = 0;
    for (const node of nodes) {
      if (this.protectNode(node)) {
        protected_count++;
      }
    }
    
    if (this.config.debugEnabled && protected_count > 0) {
      console.log(`[NodeSurfaceProtection] Protected ${protected_count} nodes with depth anchors`);
    }
  }
  
  /**
   * Force-protect a node (ignore requiresDepthAnchor flag)
   */
  forceProtectNode(node) {
    if (!node) return false;
    
    try {
      const wasRequired = node.userData?.requiresDepthAnchor;
      node.userData.requiresDepthAnchor = true;
      
      const result = this.protectNode(node);
      
      // Restore flag
      if (!wasRequired) {
        node.userData.requiresDepthAnchor = false;
      }
      
      return result;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Check if node is protected
   */
  isProtected(node) {
    return this.protectedNodes.has(node);
  }
  
  /**
   * Debug: Print protection status
   */
  printStatus(nodes) {
    if (!this.config.debugEnabled || !Array.isArray(nodes)) return;
    
    console.log('[NodeSurfaceProtection] Status:');
    nodes.forEach(node => {
      const protected_status = this.isProtected(node) ? '✓ Protected' : '  Unprotected';
      const flag = node.userData?.requiresDepthAnchor ? '[FLAG]' : '';
      console.log(`  ${protected_status} ${flag} ${node.name || 'unnamed'}`);
    });
  }
}

/**
 * Helper: Apply depth anchor protection to nodes with transparent cores
 * 
 * Usage:
 *   const protection = new NodeSurfaceProtection_DepthAnchor();
 *   protection.protectNodes(game.aiNodes.nodes);
 *   
 * Or, mark nodes opt-in:
 *   node.userData.requiresDepthAnchor = true;
 *   protection.protectNode(node);
 */
export function setupNodeSurfaceProtection(game, config = {}) {
  if (!game || !game.aiNodes || !game.scene) {
    console.warn('[NodeSurfaceProtection] Missing game/aiNodes/scene');
    return null;
  }
  
  try {
    const protection = new NodeSurfaceProtection_DepthAnchor(config);
    
    // Protect all nodes with transparent cores
    protection.protectNodes(game.aiNodes.nodes);
    
    // Hook node spawn for automatic protection
    const originalSpawnNode = game.aiNodes?.spawnNode;
    if (originalSpawnNode && typeof originalSpawnNode === 'function') {
      game.aiNodes.spawnNode = function(...args) {
        const newNode = originalSpawnNode.apply(this, args);
        if (newNode) {
          protection.protectNode(newNode);
        }
        return newNode;
      };
    }
    
    // Hook link events for post-link correction
    if (game.linkingSystem && game.linkingSystem.registerObserver) {
      game.linkingSystem.registerObserver({
        onLinkCreated: (link) => {
          try {
            if (link?.nodes?.[0]) protection.protectNode(link.nodes[0]);
            if (link?.nodes?.[1]) protection.protectNode(link.nodes[1]);
          } catch (e) {
            // Silent failure
          }
        }
      });
    }
    
    console.log('[NodeSurfaceProtection] ✓ Initialized');
    return protection;
  } catch (err) {
    console.warn('[NodeSurfaceProtection] Initialization failed:', err);
    return null;
  }
}

export default {
  NodeSurfaceProtection_DepthAnchor,
  setupNodeSurfaceProtection
};
