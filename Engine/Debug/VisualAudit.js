/**
 * VISUAL AUDIT TOOL v1.0 — FORENSIC SNAPSHOT & DIFF SYSTEM
 * 
 * Captures complete visual state of nodes before/after linking.
 * Exposes mutations for proof-of-cause analysis.
 */

import * as THREE from 'three';

class VisualSnapshot {
  constructor(nodeId, node) {
    this.timestamp = Date.now();
    this.nodeId = nodeId;
    
    if (!node) {
      this.error = 'Node is null/undefined';
      return;
    }
    
    // Basic node info
    this.nodeUuid = node.uuid;
    this.nodeType = node.type;
    this.nodeName = node.name;
    
    // Find core mesh
    const coreMesh = this.findCoreMesh(node);
    this.coreMesh = coreMesh ? {
      uuid: coreMesh.uuid,
      type: coreMesh.type,
      name: coreMesh.name,
      renderOrder: coreMesh.renderOrder,
      visible: coreMesh.visible,
      castShadow: coreMesh.castShadow,
      receiveShadow: coreMesh.receiveShadow
    } : null;
    
    // Geometry info
    if (coreMesh?.geometry) {
      this.geometry = {
        uuid: coreMesh.geometry.uuid,
        type: coreMesh.geometry.type,
        vertexCount: coreMesh.geometry.attributes?.position?.count ?? 0
      };
    } else {
      this.geometry = null;
    }
    
    // Material info
    if (coreMesh?.material) {
      this.material = this.captureMatInfo(coreMesh.material);
    } else {
      this.material = null;
    }
    
    // Children snapshot
    this.childrenCount = node.children.length;
    this.children = node.children.map(child => ({
      uuid: child.uuid,
      type: child.type,
      name: child.name,
      renderOrder: child.renderOrder,
      visualLayer: child.userData?.visualLayer,
      isAura: child.userData?.isAura,
      isCore: child.userData?.isCore || child.userData?.isNodeCore
    }));
    
    // Aura tracking
    this.auras = node.children
      .filter(c => c.userData?.isAura || c.userData?.visualLayer === 'AURA')
      .map(aura => ({
        uuid: aura.uuid,
        renderOrder: aura.renderOrder,
        opacity: aura.material?.opacity ?? 1.0,
        transparent: aura.material?.transparent ?? false,
        depthWrite: aura.material?.depthWrite ?? true
      }));
    
    // UserData snapshot
    this.userData = {
      nodeId: node.userData?.nodeId,
      category: node.userData?.category,
      hasBaseVisualState: !!node.userData?.baseVisualState,
      visualStateApplied: node.userData?.visualStateApplied,
      linkedState: node.userData?.linkedState
    };
  }
  
  findCoreMesh(node) {
    // Strategy 1: userData marker
    const byUserData = node.children.find(c => 
      c.userData?.isCore || c.userData?.isNodeCore || c.userData?.visualLayer === 'CORE'
    );
    if (byUserData) return byUserData;
    
    // Strategy 2: Name contains "core"
    const byName = node.children.find(c => 
      c instanceof THREE.Mesh && c.name?.toLowerCase().includes('core')
    );
    if (byName) return byName;
    
    // Strategy 3: First mesh that's opaque
    const byOpacity = node.children.find(c => 
      c instanceof THREE.Mesh && (!c.material?.transparent || c.material?.opacity > 0.9)
    );
    if (byOpacity) return byOpacity;
    
    // Fallback: first mesh
    return node.children.find(c => c instanceof THREE.Mesh) || null;
  }
  
  captureMatInfo(material) {
    const mats = Array.isArray(material) ? material : [material];
    return mats.map(mat => {
      const info = {
        uuid: mat.uuid,
        type: mat.type,
        transparent: mat.transparent ?? false,
        opacity: mat.opacity ?? 1.0,
        depthWrite: mat.depthWrite ?? true,
        depthTest: mat.depthTest ?? true,
        blending: mat.blending,
        side: mat.side,
        castShadow: mat.castShadow,
        receiveShadow: mat.receiveShadow
      };
      
      // Color/emissive
      if (mat.color) {
        info.color = mat.color.getHex?.() ?? 0xffffff;
      }
      if (mat.emissive) {
        info.emissive = mat.emissive.getHex?.() ?? 0x000000;
        info.emissiveIntensity = mat.emissiveIntensity ?? 1.0;
      }
      
      // Shader uniforms (if ShaderMaterial)
      if (mat.uniforms) {
        info.uniformKeys = Object.keys(mat.uniforms);
      }
      
      return info;
    })[0]; // Return first material
  }
}

export class VisualAudit {
  static snapshots = new Map();
  static scene = null;
  
  static setScene(scene) {
    this.scene = scene;
  }
  
  /**
   * Snapshot a single node
   */
  static snap(nodeIdOrNode) {
    const node = typeof nodeIdOrNode === 'string' 
      ? this.findNodeById(nodeIdOrNode)
      : nodeIdOrNode;
    
    if (!node) {
      console.warn(`[VisualAudit] Node not found: ${nodeIdOrNode}`);
      return null;
    }
    
    const snapshot = new VisualSnapshot(node.userData?.nodeId || node.uuid, node);
    this.snapshots.set(node.uuid, snapshot);
    return snapshot;
  }
  
  /**
   * Compare two snapshots
   */
  static diff(beforeId, afterId) {
    const before = typeof beforeId === 'string' 
      ? this.snapshots.get(beforeId) 
      : beforeId;
    const after = typeof afterId === 'string' 
      ? this.snapshots.get(afterId) 
      : afterId;
    
    if (!before || !after) {
      console.warn('[VisualAudit] Missing snapshots');
      return null;
    }
    
    const changes = [];
    
    // Check core mesh
    if (before.coreMesh?.uuid !== after.coreMesh?.uuid) {
      changes.push({
        severity: 'CRITICAL',
        type: 'core_mesh_replaced',
        before: before.coreMesh?.uuid,
        after: after.coreMesh?.uuid
      });
    }
    
    // Check geometry
    if (before.geometry?.uuid !== after.geometry?.uuid) {
      changes.push({
        severity: 'CRITICAL',
        type: 'geometry_replaced',
        before: before.geometry?.uuid,
        after: after.geometry?.uuid
      });
    }
    
    // Check material
    if (before.material?.uuid !== after.material?.uuid) {
      changes.push({
        severity: 'CRITICAL',
        type: 'material_replaced',
        before: before.material?.uuid,
        after: after.material?.uuid
      });
    }
    
    // Check material properties
    if (before.material && after.material) {
      if (before.material.opacity !== after.material.opacity) {
        changes.push({
          severity: 'HIGH',
          type: 'material_opacity_changed',
          before: before.material.opacity,
          after: after.material.opacity
        });
      }
      
      if (before.material.transparent !== after.material.transparent) {
        changes.push({
          severity: 'HIGH',
          type: 'material_transparent_changed',
          before: before.material.transparent,
          after: after.material.transparent
        });
      }
      
      if (before.material.depthWrite !== after.material.depthWrite) {
        changes.push({
          severity: 'HIGH',
          type: 'material_depthWrite_changed',
          before: before.material.depthWrite,
          after: after.material.depthWrite
        });
      }
      
      if (before.material.color !== after.material.color) {
        changes.push({
          severity: 'MEDIUM',
          type: 'material_color_changed',
          before: before.material.color?.toString(16),
          after: after.material.color?.toString(16)
        });
      }
      
      if (before.material.emissive !== after.material.emissive) {
        changes.push({
          severity: 'MEDIUM',
          type: 'material_emissive_changed',
          before: before.material.emissive?.toString(16),
          after: after.material.emissive?.toString(16)
        });
      }
    }
    
    // Check renderOrder
    if (before.coreMesh?.renderOrder !== after.coreMesh?.renderOrder) {
      changes.push({
        severity: 'HIGH',
        type: 'renderOrder_changed',
        before: before.coreMesh?.renderOrder,
        after: after.coreMesh?.renderOrder
      });
    }
    
    // Check aura changes
    if (before.auras.length !== after.auras.length) {
      changes.push({
        severity: 'MEDIUM',
        type: 'aura_count_changed',
        before: before.auras.length,
        after: after.auras.length
      });
    }
    
    // Check children count
    if (before.childrenCount !== after.childrenCount) {
      changes.push({
        severity: 'MEDIUM',
        type: 'children_count_changed',
        before: before.childrenCount,
        after: after.childrenCount
      });
    }
    
    return {
      nodeName: before.nodeName,
      timestamp: Date.now(),
      changeCount: changes.length,
      changes
    };
  }
  
  /**
   * Full test: link two nodes and capture diff
   */
  static async testLink(sourceIdOrNode, targetIdOrNode) {
    const source = typeof sourceIdOrNode === 'string' 
      ? this.findNodeById(sourceIdOrNode)
      : sourceIdOrNode;
    const target = typeof targetIdOrNode === 'string' 
      ? this.findNodeById(targetIdOrNode)
      : targetIdOrNode;
    
    if (!source || !target) {
      console.warn('[VisualAudit] Cannot find nodes');
      return;
    }
    
    console.log(`[VisualAudit] TEST LINK: ${source.userData?.category} → ${target.userData?.category}`);
    
    // Before snapshots
    const sourceBefore = this.snap(source);
    const targetBefore = this.snap(target);
    
    console.log('[VisualAudit] BEFORE snapshot captured');
    console.log('Source before:', sourceBefore);
    console.log('Target before:', targetBefore);
    
    // Perform link (call the actual system)
    const linkingSystem = window.game?.linkingSystem;
    if (!linkingSystem) {
      console.warn('[VisualAudit] LinkingSystem not available');
      return;
    }
    
    linkingSystem.attemptLink(source, target);
    
    // Wait a frame for any async updates
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // After snapshots
    const sourceAfter = this.snap(source);
    const targetAfter = this.snap(target);
    
    console.log('[VisualAudit] AFTER snapshot captured');
    console.log('Source after:', sourceAfter);
    console.log('Target after:', targetAfter);
    
    // Diffs
    const sourceDiff = this.diff(sourceBefore, sourceAfter);
    const targetDiff = this.diff(targetBefore, targetAfter);
    
    console.group('[VisualAudit] TEST RESULT');
    console.log('=== SOURCE NODE DIFF ===');
    if (sourceDiff.changeCount === 0) {
      console.log('✅ NO CHANGES (core visuals preserved)');
    } else {
      console.warn(`⚠️ ${sourceDiff.changeCount} CHANGES DETECTED:`);
      sourceDiff.changes.forEach(change => {
        console.warn(`  ${change.severity}: ${change.type}`, change);
      });
    }
    
    console.log('=== TARGET NODE DIFF ===');
    if (targetDiff.changeCount === 0) {
      console.log('✅ NO CHANGES (core visuals preserved)');
    } else {
      console.warn(`⚠️ ${targetDiff.changeCount} CHANGES DETECTED:`);
      targetDiff.changes.forEach(change => {
        console.warn(`  ${change.severity}: ${change.type}`, change);
      });
    }
    console.groupEnd();
    
    return {
      source: sourceDiff,
      target: targetDiff
    };
  }
  
  /**
   * Find node by ID in scene
   */
  static findNodeById(nodeId) {
    if (!this.scene) {
      console.warn('[VisualAudit] Scene not set');
      return null;
    }
    
    let found = null;
    this.scene.traverse(obj => {
      if (obj.userData?.nodeId === nodeId || obj.uuid === nodeId) {
        found = obj;
      }
    });
    return found;
  }
  
  /**
   * Export all snapshots as JSON (for debugging)
   */
  static exportSnapshots() {
    const exported = {};
    this.snapshots.forEach((snap, uuid) => {
      exported[uuid] = snap;
    });
    return exported;
  }
  
  /**
   * Clear all snapshots
   */
  static clear() {
    this.snapshots.clear();
  }
}

export default VisualAudit;
