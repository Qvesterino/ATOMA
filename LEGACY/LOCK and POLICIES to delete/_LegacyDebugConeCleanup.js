/**
 * LEGACY DEBUG CONE CLEANUP SYSTEM
 * 
 * Removes old debug cones, cylinders, and gold/yellow markers from nodes.
 * Pure visual cleanup - zero impact on gameplay, physics, or node data.
 * 
 * STRICT SAFETY RULES:
 * - Do NOT modify createNode(), updateNode(), AINodes.js, or node lifecycle
 * - Do NOT touch physics or movement
 * - Only remove visual-only leftover meshes
 * - Only operate on node.visualGroup or node.mesh.children
 * - All removals null-checked and harmless
 * - Do not remove any object that is part of official NodeVisuals or NodeArchetypes
 * 
 * REMOVAL CRITERIA:
 * - THREE.Mesh with ConeGeometry (height < 2, radius < 1.2)
 * - THREE.Mesh with CylinderGeometry (height < 2, radius < 1.2)
 * - Materials with gold/yellow colors (#FFD700 or similar)
 * - One-time cleanup per node (marked to avoid repeated checks)
 */

import * as THREE from 'three';

export class LegacyDebugConeCleanup {
  constructor(scene) {
    this.scene = scene;
    
    // Registry: nodeId → cleanup status
    this.cleanupRegistry = new Map();
    
    // Statistics
    this.stats = {
      totalConesRemoved: 0,
      totalCylindersRemoved: 0,
      totalGoldMeshesRemoved: 0,
      nodesScanned: 0,
      nodesCleaned: 0
    };
    
    // Color tolerance for gold/yellow detection
    this.goldColorTolerance = 0.2;
    
    // Gold/yellow color reference (#FFD700)
    this.goldColor = new THREE.Color(0xFFD700);
    this.yellowColor = new THREE.Color(0xFFFF00);
    
    console.log('✓ Legacy Debug Cone Cleanup System initialized');
  }
  
  /**
   * Check if a color is close to gold/yellow
   * @param {THREE.Color} color - Color to check
   * @returns {boolean}
   */
  isGoldOrYellow(color) {
    if (!color || !color.r) return false;
    
    // Check distance to gold (#FFD700: r=1, g=0.843, b=0)
    const distToGold = Math.sqrt(
      Math.pow(color.r - 1.0, 2) +
      Math.pow(color.g - 0.843, 2) +
      Math.pow(color.b - 0.0, 2)
    );
    
    // Check distance to yellow (#FFFF00: r=1, g=1, b=0)
    const distToYellow = Math.sqrt(
      Math.pow(color.r - 1.0, 2) +
      Math.pow(color.g - 1.0, 2) +
      Math.pow(color.b - 0.0, 2)
    );
    
    return distToGold < this.goldColorTolerance || distToYellow < this.goldColorTolerance;
  }
  
  /**
   * Check if a mesh is a legacy debug cone/cylinder
   * @param {THREE.Mesh} mesh - Mesh to check
   * @returns {boolean}
   */
  isLegacyDebugMesh(mesh) {
    if (!mesh || !mesh.geometry) return false;
    
    // Skip if part of official systems
    if (mesh.userData) {
      // Official systems (DO NOT REMOVE)
      if (
        mesh.userData.isNodeVisual4 ||
        mesh.userData.isArchetypeVisual ||
        mesh.userData.isMythicSeedGlyph ||
        mesh.userData.isVFX ||
        mesh.userData.isPersonalityFX ||
        mesh.userData.isMetricFX ||
        mesh.userData.isRitualFX ||
        mesh.userData.isWorldFX ||
        mesh.userData.noCleanup
      ) {
        return false;
      }
    }
    
    const geometry = mesh.geometry;
    
    // Check for ConeGeometry
    if (geometry.type === 'ConeGeometry' || geometry.parameters?.radiusTop !== undefined) {
      const params = geometry.parameters || {};
      const radius = params.radius || params.radiusBottom || 1;
      const height = params.height || 1;
      
      // Legacy debug cones are small (radius < 1.2, height < 2)
      if (radius < 1.2 && height < 2.0) {
        return true;
      }
    }
    
    // Check for CylinderGeometry (small debug cylinders)
    if (geometry.type === 'CylinderGeometry') {
      const params = geometry.parameters || {};
      const radiusTop = params.radiusTop || 1;
      const radiusBottom = params.radiusBottom || 1;
      const height = params.height || 1;
      
      // Legacy debug cylinders are small
      if (radiusTop < 1.2 && radiusBottom < 1.2 && height < 2.0) {
        return true;
      }
    }
    
    // Check for gold/yellow materials
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      
      for (const mat of materials) {
        if (!mat) continue;
        
        // Check color property
        if (mat.color && this.isGoldOrYellow(mat.color)) {
          return true;
        }
        
        // Check emissive property
        if (mat.emissive && this.isGoldOrYellow(mat.emissive)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Clean a single node of legacy debug meshes
   * @param {THREE.Object3D} node - Node to clean
   * @param {string} nodeId - Unique node identifier
   * @returns {number} Number of meshes removed
   */
  cleanNode(node, nodeId) {
    if (!node) return 0;
    
    // Check if already cleaned
    if (this.cleanupRegistry.has(nodeId)) {
      return 0; // Already cleaned, skip
    }
    
    let removedCount = 0;
    const meshesToRemove = [];
    
    // Search in node.visualGroup first (preferred)
    const visualGroup = node.children?.find(child => 
      child.userData?.isVisualGroup || child.name === 'visualGroup'
    );
    
    const searchTargets = [];
    if (visualGroup) {
      searchTargets.push(visualGroup);
    }
    
    // Search in node.mesh.children if exists
    if (node.mesh && node.mesh.children) {
      searchTargets.push(node.mesh);
    }
    
    // Search in node directly
    if (node.children) {
      searchTargets.push(node);
    }
    
    // Scan all targets for legacy debug meshes
    for (const target of searchTargets) {
      if (!target || !target.children) continue;
      
      target.traverse((child) => {
        if (child instanceof THREE.Mesh && this.isLegacyDebugMesh(child)) {
          meshesToRemove.push(child);
        }
      });
    }
    
    // Remove found meshes
    for (const mesh of meshesToRemove) {
      try {
        // Identify mesh type for stats
        let meshType = 'unknown';
        if (mesh.geometry?.type === 'ConeGeometry') {
          meshType = 'cone';
          this.stats.totalConesRemoved++;
        } else if (mesh.geometry?.type === 'CylinderGeometry') {
          meshType = 'cylinder';
          this.stats.totalCylindersRemoved++;
        } else if (mesh.material) {
          meshType = 'gold';
          this.stats.totalGoldMeshesRemoved++;
        }
        
        // Remove from parent
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
        
        // Dispose material
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => {
              if (mat && mat.dispose) mat.dispose();
            });
          } else if (mesh.material.dispose) {
            mesh.material.dispose();
          }
        }
        
        // Dispose geometry
        if (mesh.geometry && mesh.geometry.dispose) {
          mesh.geometry.dispose();
        }
        
        removedCount++;
      } catch (error) {
        console.warn('LegacyDebugConeCleanup: Error removing mesh', error);
      }
    }
    
    // Mark node as cleaned
    this.cleanupRegistry.set(nodeId, {
      cleaned: true,
      removedCount,
      timestamp: Date.now()
    });
    
    if (removedCount > 0) {
      this.stats.nodesCleaned++;
      console.log(`✓ Cleaned ${removedCount} legacy debug meshes from node ${nodeId}`);
    }
    
    return removedCount;
  }
  
  /**
   * Clean all nodes (one-time scan)
   * @param {Array} nodes - Array of node objects
   */
  cleanAllNodes(nodes) {
    if (!nodes || !Array.isArray(nodes)) return;
    
    let totalRemoved = 0;
    
    nodes.forEach((node, index) => {
      if (!node) return;
      
      const nodeId = node.uuid || `node-${index}`;
      this.stats.nodesScanned++;
      
      const removed = this.cleanNode(node, nodeId);
      totalRemoved += removed;
    });
    
    if (totalRemoved > 0) {
      console.log(`✓ Legacy cleanup complete: ${totalRemoved} debug meshes removed from ${this.stats.nodesCleaned} nodes`);
    }
  }
  
  /**
   * NEUTRALIZED: Per-frame update disabled (Rule 1)
   * 
   * Legacy: This method used to run every frame traversing all nodes.
   * Now: Cleanup is dormant unless explicitly triggered.
   * 
   * Call via manual methods instead:
   * - onDemandCleanup(): Run only if legacy visuals detected
   * - manualCleanup(): Run when user/system requests cleanup
   * 
   * @param {Array} nodes - Array of node objects (IGNORED in dormant mode)
   */
  update(nodes) {
    // DORMANT: Per-frame execution DISABLED
    // This method is now a no-op to eliminate per-frame scene traversal
    // Cleanup only runs on explicit manual trigger
    return;
  }
  
  /**
   * On-demand cleanup: Only run if legacy visuals are actually present
   * @param {Array} nodes - Array of node objects
   * @returns {boolean} - True if cleanup performed
   */
  onDemandCleanup(nodes) {
    if (!nodes || !Array.isArray(nodes)) return false;
    
    // GUARD: Early exit if no nodes to clean
    if (nodes.length === 0) return false;
    
    // GUARD: Sample first few nodes to detect legacy geometry types
    const sampleSize = Math.min(5, nodes.length);
    let legacyDetected = false;
    
    for (let i = 0; i < sampleSize; i++) {
      const node = nodes[i];
      if (!node) continue;
      
      // Quick check: does this node have any legacy cones/cylinders/gold?
      if (this._hasLegacyGeometry(node)) {
        legacyDetected = true;
        break;
      }
    }
    
    // GUARD: Exit early if no legacy visuals found
    if (!legacyDetected) {
      return false;
    }
    
    // Legacy detected: run full cleanup
    let totalRemoved = 0;
    nodes.forEach((node, index) => {
      if (!node) return;
      
      const nodeId = node.uuid || `node-${index}`;
      
      // Skip if already cleaned
      if (!this.cleanupRegistry.has(nodeId)) {
        totalRemoved += this.cleanNode(node, nodeId);
      }
    });
    
    return totalRemoved > 0;
  }
  
  /**
   * Quick detection: Does this node contain legacy geometry?
   * @private
   */
  _hasLegacyGeometry(node) {
    if (!node) return false;
    
    let hasLegacy = false;
    
    // Quick traverse (limit to direct children only, not deep)
    node.traverse((child) => {
      if (hasLegacy) return; // Stop early if found
      if (!(child instanceof THREE.Mesh)) return;
      
      if (this.isLegacyDebugMesh(child)) {
        hasLegacy = true;
      }
    });
    
    return hasLegacy;
  }
  
  /**
   * Reset cleanup registry (for world transitions)
   */
  reset() {
    this.cleanupRegistry.clear();
    console.log('✓ Legacy Debug Cone Cleanup registry reset');
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      nodesCleaned: this.cleanupRegistry.size
    };
  }
  
  /**
   * Print status report
   */
  printStatusReport() {
    const stats = this.getStats();
    console.group('🧹 Legacy Debug Cone Cleanup Status');
    console.log(`Nodes Scanned: ${stats.nodesScanned}`);
    console.log(`Nodes Cleaned: ${stats.nodesCleaned}`);
    console.log(`Total Cones Removed: ${stats.totalConesRemoved}`);
    console.log(`Total Cylinders Removed: ${stats.totalCylindersRemoved}`);
    console.log(`Total Gold/Yellow Meshes Removed: ${stats.totalGoldMeshesRemoved}`);
    console.log(`Total Meshes Removed: ${stats.totalConesRemoved + stats.totalCylindersRemoved + stats.totalGoldMeshesRemoved}`);
    console.groupEnd();
  }
  
  /**
   * Manual cleanup trigger (for testing)
   * @param {Array} nodes - Array of node objects
   */
  manualCleanup(nodes) {
    console.log('🧹 Manual legacy cleanup triggered...');
    this.reset(); // Clear registry to allow re-scanning
    this.cleanAllNodes(nodes);
    this.printStatusReport();
  }
}
