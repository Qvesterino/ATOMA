/**
 * EXTREME NODE NORMALIZATION v1.0
 * 
 * EXTREME nodes often have procedural/unstable geometry.
 * This system wraps them into a stable visual container
 * so they behave identically to normal nodes.
 */

import * as THREE from 'three';
import { visualAuthority } from './VisualAuthority.js';

/**
 * 📦 CREATE VISUAL CONTAINER: Wrap procedural geometry
 * 
 * For EXTREME nodes that lack a stable mesh, create one.
 * 
 * @param {THREE.Object3D} node - EXTREME node
 * @param {THREE.Color} color - Base color for container
 * @returns {THREE.Mesh} Visual container (visualRoot)
 */
export function createVisualContainer(node, color) {
  if (!node) {
    throw new Error('[EXTREMENormalization] Cannot create container: node is null');
  }
  
  // Create stable mesh container
  const geometry = new THREE.IcosahedronGeometry(0.5, 4);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 1.0,
    fog: false
  });
  
  const container = new THREE.Mesh(geometry, material);
  
  // Mark as visual root
  container.userData = {
    isCoreMesh: true,
    isVisualContainer: true,
    visualLayer: 'CORE',
    visualLocked: true
  };
  
  // Enforced properties
  container.visible = true;
  container.frustumCulled = false;
  container.renderOrder = 0;
  
  if (container.material) {
    container.material.depthTest = false;
    container.material.depthWrite = false;
  }
  
  return container;
}

/**
 * 🔧 NORMALIZE EXTREME NODE: Ensure it has stable visual root
 * 
 * @param {THREE.Object3D} node - EXTREME node
 * @param {THREE.Color} fallbackColor - Color if no color found
 */
export function normalizeEXTREMENode(node, fallbackColor = new THREE.Color(0x00ddff)) {
  // PRIMARY AUTHORITY FLAG - Soft-deactivate if VisualAuthority.js is running
  if (window.__VISUAL_AUTHORITY_PRIMARY__) return false;
  
  if (!node?.userData?.isExtreme) {
    return false;  // Not an EXTREME node
  }
  
  // CHECK: Does it already have a visual root?
  if (node.userData.visualRoot) {
    console.log('[EXTREMENormalization] EXTREME node already has visualRoot');
    return true;  // Already normalized
  }
  
  // FIND: Try to find existing stable mesh
  let visualRoot = null;
  
  // Strategy 1: Look for named "core" meshes
  node.traverse((child) => {
    if (!visualRoot && child.isMesh && child.name?.toLowerCase().includes('core')) {
      visualRoot = child;
    }
  });
  
  // Strategy 2: Look for spheres or icosahedrons
  if (!visualRoot) {
    node.traverse((child) => {
      if (!visualRoot && child.isMesh) {
        if (child.geometry instanceof THREE.SphereGeometry ||
            child.geometry instanceof THREE.IcosahedronGeometry) {
          visualRoot = child;
        }
      }
    });
  }
  
  // FALLBACK: Create new visual container
  if (!visualRoot) {
    const color = node.userData.baseColor || node.userData.layerColor || fallbackColor;
    visualRoot = createVisualContainer(node, color);
    node.add(visualRoot);
    console.log('[EXTREMENormalization] Created visual container for EXTREME node:', node.uuid);
  }
  
  // REGISTER: Assign as visual root
  visualAuthority.registerNode(node, visualRoot);
  
  console.log('[EXTREMENormalization] ✅ Normalized EXTREME node:', {
    nodeId: node.uuid,
    visualRootId: visualRoot.uuid,
    visualRootType: visualRoot.constructor.name
  });
  
  return true;
}

/**
 * 🔍 CHECK: Audit all EXTREME nodes for normalization
 * 
 * @param {THREE.Scene} scene - Scene to audit
 * @returns {Object} Audit report
 */
export function auditEXTREMENodes(scene) {
  const report = {
    totalEXTREME: 0,
    normalized: 0,
    needsNormalization: [],
    details: []
  };
  
  if (!scene) return report;
  
  scene.traverse((obj) => {
    if (!obj.userData?.isExtreme) return;
    
    report.totalEXTREME++;
    
    if (obj.userData.visualRoot) {
      report.normalized++;
      report.details.push({
        nodeId: obj.uuid,
        status: 'NORMALIZED',
        visualRootId: obj.userData.visualRoot.uuid
      });
    } else {
      report.needsNormalization.push(obj.uuid);
      report.details.push({
        nodeId: obj.uuid,
        status: 'NEEDS_NORMALIZATION'
      });
    }
  });
  
  return report;
}

/**
 * ✅ BATCH NORMALIZE: Fix all EXTREME nodes in scene
 * 
 * @param {THREE.Scene} scene - Scene to normalize
 * @param {THREE.Color} fallbackColor - Fallback color
 * @returns {Object} Results
 */
export function batchNormalizeEXTREMENodes(scene, fallbackColor) {
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  };
  
  if (!scene) return results;
  
  scene.traverse((obj) => {
    if (!obj.userData?.isExtreme) return;
    
    results.processed++;
    
    try {
      const success = normalizeEXTREMENode(obj, fallbackColor);
      if (success) {
        results.successful++;
      } else {
        results.failed++;
      }
    } catch (err) {
      results.failed++;
      results.errors.push({
        nodeId: obj.uuid,
        error: err.message
      });
    }
  });
  
  return results;
}

/**
 * 🎬 CONSOLE API
 */
export function setupEXTREMENormalizationConsoleAPI(scene) {
  if (!window.__extremeNormalization) {
    window.__extremeNormalization = {};
  }
  
  Object.assign(window.__extremeNormalization, {
    /**
     * Audit: window.__extremeNormalization.audit()
     */
    audit: () => {
      const report = auditEXTREMENodes(scene);
      console.log('[EXTREMENormalization] Audit Report:', report);
      return report;
    },
    
    /**
     * Batch normalize: window.__extremeNormalization.batchNormalize()
     */
    batchNormalize: () => {
      const results = batchNormalizeEXTREMENodes(scene);
      console.log('[EXTREMENormalization] Batch normalization complete:', results);
      return results;
    },
    
    /**
     * Normalize single: window.__extremeNormalization.normalize(node)
     */
    normalize: (node) => {
      if (!node) {
        console.error('Please provide a node to normalize');
        return false;
      }
      return normalizeEXTREMENode(node);
    }
  });
  
  console.log('✅ EXTREME Normalization console API: window.__extremeNormalization');
}

export const EXTREMENormalization = {
  createVisualContainer,
  normalizeEXTREMENode,
  auditEXTREMENodes,
  batchNormalizeEXTREMENodes,
  setupEXTREMENormalizationConsoleAPI
};
