/**
 * VISUAL ROOT AUTO-REGISTER v1.0
 * 
 * Ensures EVERY spawned node gets proper visualRoot assignment.
 * Runs at spawn-time (safe creation) and runtime (repair/discovery).
 * 
 * Key guarantees:
 * - Every node gets node.userData.visualRoot = <root mesh>
 * - Every node gets node.userData.visualType = 'legacy'|'enhanced'|'extreme'|'mythic'|'prime'
 * - visualAuthority.registerNode() called immediately after assignment
 * - Auto-discovery for orphaned nodes (runtime repair)
 */

import * as THREE from 'three';

export class VisualRootAutoRegister {
  constructor(visualAuthority) {
    this.visualAuthority = visualAuthority;
    
    // Track assignments
    this.registeredCount = 0;
    this.failedCount = 0;
    this.autodiscoveredCount = 0;
  }
  
  /**
   * SPAWN-TIME: Register node immediately after creation
   * Should be called in AINodes.spawnNode() right after mesh creation
   * 
   * @param {THREE.Object3D} node - The node group/container
   * @param {string} nodeType - 'legacy'|'enhanced'|'extreme'|'mythic'|'prime'|'special'
   * @returns {boolean} Success
   */
  registerNodeOnSpawn(node, nodeType = 'legacy') {
    if (!node) {
      console.warn('[VisualRootAutoRegister] Cannot register: node is null');
      return false;
    }
    
    // Step 1: Discover or use existing visualRoot
    let visualRoot = node.userData?.visualRoot;
    
    if (!visualRoot) {
      visualRoot = this.discoverVisualRoot(node, nodeType);
      if (!visualRoot) {
        console.error('[VisualRootAutoRegister] Could not discover visualRoot for node', node.uuid);
        this.failedCount++;
        return false;
      }
    }
    
    // Step 2: Mark the visual root
    node.userData.visualRoot = visualRoot;
    node.userData.visualType = nodeType;
    node.userData.visualLocked = true;
    
    // Step 3: Enforce visual properties
    this.enforceVisualContract(visualRoot);
    
    // Step 4: Register with authority
    if (this.visualAuthority) {
      try {
        this.visualAuthority.registerNode(node, visualRoot);
      } catch (e) {
        console.warn('[VisualRootAutoRegister] Authority registration failed:', e.message);
        this.failedCount++;
        return false;
      }
    }
    
    this.registeredCount++;
    return true;
  }
  
  /**
   * RUNTIME: Auto-discover and register unregistered nodes (repair)
   * Should be called periodically or when violations detected
   * 
   * @param {THREE.Object3D} node - Node to repair
   * @returns {boolean} Success
   */
  autodiscoverAndRegister(node) {
    if (!node || node.userData?.visualRoot) {
      return false; // Already registered or null
    }
    
    const visualRoot = this.discoverVisualRoot(node, 'unknown');
    if (!visualRoot) {
      return false;
    }
    
    node.userData.visualRoot = visualRoot;
    node.userData.visualType = 'autodiscovered';
    node.userData.visualLocked = true;
    
    this.enforceVisualContract(visualRoot);
    
    if (this.visualAuthority) {
      try {
        this.visualAuthority.registerNode(node, visualRoot);
      } catch (e) {
        console.warn('[VisualRootAutoRegister] Authority registration failed:', e.message);
        return false;
      }
    }
    
    this.autodiscoveredCount++;
    return true;
  }
  
  /**
   * Discover visualRoot using multi-strategy approach
   */
  discoverVisualRoot(node, nodeType) {
    // Strategy 1: By node structure type
    let root = this.discoverByNodeType(node, nodeType);
    if (root) return root;
    
    // Strategy 2: By naming convention
    root = this.discoverByName(node);
    if (root) return root;
    
    // Strategy 3: By mesh properties
    root = this.discoverByMaterial(node);
    if (root) return root;
    
    // Strategy 4: Largest mesh by vertex count
    root = this.discoverBySize(node);
    if (root) return root;
    
    // Strategy 5: First mesh found
    root = this.discoverFirst(node);
    return root;
  }
  
  /**
   * Strategy 1: Discover by node type hints
   */
  discoverByNodeType(node, nodeType) {
    if (nodeType.includes('extreme')) {
      // EXTREME: Usually wrapped in stable container
      const stable = node.children.find(c => 
        c.userData?.isStableContainer || c.name?.includes('stable') || c.name?.includes('container')
      );
      if (stable) return stable;
      
      // Fallback to first child with children
      const wrapped = node.children.find(c => c.children.length > 0);
      if (wrapped) return wrapped;
    }
    
    if (nodeType.includes('enhanced')) {
      // ENHANCED: Direct mesh child with material
      const mesh = node.children.find(c => c.isMesh && c.material);
      if (mesh) return mesh;
    }
    
    if (nodeType.includes('mythic')) {
      // MYTHIC: Usually the first/largest mesh
      return null; // Fall through to other strategies
    }
    
    return null;
  }
  
  /**
   * Strategy 2: Discover by naming convention
   */
  discoverByName(node) {
    // Core names
    const coreNames = ['core', 'sphere', 'nucleus', 'center', 'root', 'main'];
    
    for (const name of coreNames) {
      const found = node.children.find(c => c.name?.toLowerCase().includes(name));
      if (found && (found.isMesh || found.children.length > 0)) {
        return found;
      }
    }
    
    return null;
  }
  
  /**
   * Strategy 3: Discover by material properties
   */
  discoverByMaterial(node) {
    // Look for mesh with material (especially glow/emissive)
    for (const child of node.children) {
      if (child.isMesh && child.material) {
        // Prefer meshes with emissive (hologram-like)
        if (child.material.emissive) {
          return child;
        }
      }
    }
    
    // Fallback: any mesh with material
    for (const child of node.children) {
      if (child.isMesh && child.material) {
        return child;
      }
    }
    
    return null;
  }
  
  /**
   * Strategy 4: Discover by size (vertex count)
   */
  discoverBySize(node) {
    let largest = null;
    let maxVertices = 0;
    
    node.traverse((obj) => {
      if (obj === node) return; // Skip self
      if (!obj.isMesh || !obj.geometry) return;
      
      const count = obj.geometry.attributes?.position?.count || 0;
      if (count > maxVertices) {
        maxVertices = count;
        largest = obj;
      }
    });
    
    return largest;
  }
  
  /**
   * Strategy 5: Discover first mesh
   */
  discoverFirst(node) {
    for (const child of node.children) {
      if (child.isMesh) return child;
    }
    
    // Try deeper
    for (const child of node.children) {
      const found = this.discoverFirst(child);
      if (found) return found;
    }
    
    return null;
  }
  
  /**
   * Enforce visual contract on discovered root
   * Ensures properties match authority expectations
   */
  enforceVisualContract(visualRoot) {
    if (!visualRoot) return;
    
    // Mark as locked visual layer
    visualRoot.userData.visualLayer = 'CORE';
    visualRoot.userData.visualLocked = true;
    
    // Enforce visibility
    visualRoot.visible = true;
    
    // Enforce frustum culling
    visualRoot.frustumCulled = false;
    
    // Enforce material properties
    if (visualRoot.material) {
      visualRoot.material.opacity = 1.0;
      visualRoot.material.transparent = true;
      visualRoot.material.depthTest = false;
      visualRoot.material.depthWrite = false;
    }
    
    // Enforce render order for core
    visualRoot.renderOrder = 0;
  }
  
  /**
   * Get registration statistics
   */
  getStats() {
    return {
      registered: this.registeredCount,
      autodiscovered: this.autodiscoveredCount,
      failed: this.failedCount,
      total: this.registeredCount + this.autodiscoveredCount + this.failedCount
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.registeredCount = 0;
    this.autodiscoveredCount = 0;
    this.failedCount = 0;
  }
}
