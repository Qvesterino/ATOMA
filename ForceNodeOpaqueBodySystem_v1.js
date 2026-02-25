/**
 * FORCE NODE OPAQUE BODY SYSTEM v1.0
 * ===================================
 * [HOTFIX] Ensure node bodies are NEVER transparent
 * 
 * Implementation:
 * 1. Override node materials immediately after creation
 * 2. Force opaque state (transparent=false, opacity=1.0)
 * 3. Lock depth testing
 * 4. Re-apply per frame to prevent later mutations
 * 
 * EXCEPTION: Glyphs, outlines, selection may remain translucent
 */

import * as THREE from 'three';

/**
 * Identify core node body meshes (as opposed to glyphs/outlines)
 */
function isCoreNodeMesh(mesh) {
  if (!mesh.isMesh) return false;
  
  const name = (mesh.name || '').toLowerCase();
  const type = (mesh.userData?.type || '').toLowerCase();
  
  // EXCLUDE these patterns
  const excluded = [
    'glyph',
    'outline',
    'selection',
    'wireframe',
    'highlight',
    'marker'
  ];
  
  for (const ex of excluded) {
    if (name.includes(ex) || type.includes(ex)) {
      return false;
    }
  }
  
  // INCLUDE if it matches core patterns
  const included = [
    'core',
    'shell',
    'body',
    'geometry',
    'mesh',
    'node'
  ];
  
  for (const inc of included) {
    if (name.includes(inc) || type.includes(inc)) {
      return true;
    }
  }
  
  // Default: if it's in node.group and not excluded, treat as core
  return true;
}

/**
 * Force Node Opaque Body System
 */
export class ForceNodeOpaqueBodySystem_v1 {
  constructor() {
    this.enabled = true;
    this.enableRuntimeEnforce = false; // manual-only; never auto-enabled
    this.stats = {
      nodesProcessed: 0,
      materialsForced: 0,
      updates: 0
    };
    
    this.nodeStates = new Map();  // Track which nodes we've seen
    this._enforcedMaterials = new WeakSet(); // Ensure one-shot material enforcement
    
    console.log('[ForceNodeOpaqueBodySystem] Initialized - Node bodies will be forced opaque');
  }

  /**
   * Apply opaque override to node group
   * Call immediately after node creation
   */
  forceNodeOpaque(nodeGroup) {
    if (!nodeGroup) return 0;
    
    let count = 0;
    
    // Traverse node's children
    if (nodeGroup.children) {
      for (const child of nodeGroup.children) {
        if (isCoreNodeMesh(child)) {
          this._forceOpaqueOnMesh(child);
          count++;
        }
      }
    }
    
    // Also check nested geometry
    nodeGroup.traverse((obj) => {
      if (obj !== nodeGroup && isCoreNodeMesh(obj)) {
        this._forceOpaqueOnMesh(obj);
        count++;
      }
    });
    
    if (count > 0) {
      this.stats.nodesProcessed++;
      this.stats.materialsForced += count;
      console.log(`[ForceNodeOpaqueBodySystem] Node ${nodeGroup.name || nodeGroup.uuid}: forced opaque on ${count} meshes`);
    }
    
    // Remember this node
    this.nodeStates.set(nodeGroup.uuid || nodeGroup.id, {
      group: nodeGroup,
      lastUpdate: Date.now(),
      meshCount: count
    });
    
    return count;
  }

  /**
   * Internal: Force single mesh to be opaque
   */
  _forceOpaqueOnMesh(mesh) {
    if (!mesh.material) return;
    
    const materials = Array.isArray(mesh.material) 
      ? mesh.material 
      : [mesh.material];
    
    for (const mat of materials) {
      if (!mat) continue;
      if (this._enforcedMaterials.has(mat)) continue;
      
      // Store original state for potential restoration
      if (!mat.userData.__originalState) {
        mat.userData.__originalState = {
          transparent: mat.transparent,
          opacity: mat.opacity,
          depthWrite: mat.depthWrite,
          depthTest: mat.depthTest
        };
      }
      
      // FORCE OPAQUE
      const nextTransparent = false;
      const nextOpacity = 1.0;
      const nextDepthWrite = true;
      const nextDepthTest = true;

      let variantChanged = false;

      if (mat.transparent !== nextTransparent) {
        mat.transparent = nextTransparent;
        variantChanged = true;
      }
      if (mat.depthWrite !== nextDepthWrite) {
        mat.depthWrite = nextDepthWrite;
        variantChanged = true;
      }
      if (mat.depthTest !== nextDepthTest) {
        mat.depthTest = nextDepthTest;
        variantChanged = true;
      }

      if (mat.opacity !== nextOpacity) {
        mat.opacity = nextOpacity; // opacity-only change; no needsUpdate
      }

      if (variantChanged) {
        mat.needsUpdate = true;
      }

      this._enforcedMaterials.add(mat);
    }
  }

  /**
   * Continuous enforcement - re-apply opaque state each frame
   * Prevents later systems from making node transparent
   */
  enforceOpaque(scene) {
    // Disabled by default; manual-only. Prevents per-frame traversal.
    if (!this.enableRuntimeEnforce) return 0;
    if (!this.enabled || !scene) return 0;
    
    let enforced = 0;
    
    // Check all tracked nodes
    for (const [uuid, state] of this.nodeStates) {
      const group = state.group;
      if (!group || !group.parent) continue;
      
      group.traverse((obj) => {
        if (isCoreNodeMesh(obj) && obj.material) {
          const materials = Array.isArray(obj.material) 
            ? obj.material 
            : [obj.material];
          
          for (const mat of materials) {
            if (this._enforcedMaterials.has(mat)) continue;
            this._forceOpaqueOnMesh(obj);
            enforced++;
          }
        }
      });
    }
    
    if (enforced > 0) {
      this.stats.updates++;
    }
    
    return enforced;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      trackedNodes: this.nodeStates.size
    };
  }

  /**
   * Restore original material states
   */
  restore() {
    for (const [uuid, state] of this.nodeStates) {
      const group = state.group;
      if (!group) continue;
      
      group.traverse((obj) => {
        if (obj.material) {
          const materials = Array.isArray(obj.material) 
            ? obj.material 
            : [obj.material];
          
          for (const mat of materials) {
            if (mat.userData.__originalState) {
              const orig = mat.userData.__originalState;
              mat.transparent = orig.transparent;
              mat.opacity = orig.opacity;
              mat.depthWrite = orig.depthWrite;
              mat.depthTest = orig.depthTest;
              mat.needsUpdate = true;
            }
          }
        }
      });
    }
    
    console.log('[ForceNodeOpaqueBodySystem] Materials restored to original state');
  }
}

export default ForceNodeOpaqueBodySystem_v1;
