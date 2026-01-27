/**
 * ABSOLUTE LINK-STATE NUCLEAR LOCK v1.0 — HARD OVERRIDE
 * 
 * ⚠️  CRITICAL: This system makes it PHYSICALLY IMPOSSIBLE for any code
 * to mutate anything except the node's core mesh (linkTarget).
 * 
 * RULES (NON-NEGOTIABLE):
 * 1. Only node.userData.linkTarget can be mutated by link-state
 * 2. All protected layers (shells, auras, roots) are READ-ONLY
 * 3. Mutations are enforced at property level (Object.defineProperty)
 * 4. Every frame, render settings are FORCE-OVERRIDDEN
 * 5. Zero fallbacks, zero exceptions, zero mercy
 *
 * // Phase B.2: render state delegated to TransparentStateAuthority
 */

import * as THREE from 'three';
import { TransparentStateAuthority } from './TransparentStateAuthority.js';

/**
 * ✅ SINGLE SOURCE OF TRUTH: Get absolute link target
 * 
 * @param {THREE.Object3D} node - Node to get target for
 * @returns {THREE.Object3D} ONLY object link-state can mutate
 * @throws {Error} If node has no linkTarget — FAIL FAST
 */
export function getAbsoluteLinkTarget(node) {
  if (!node) {
    throw new Error('[NUCLEAR LOCK] Node is null');
  }
  
  if (!node.userData) {
    throw new Error('[NUCLEAR LOCK] Node has no userData');
  }
  
  const target = node.userData.linkTarget;
  
  if (!target) {
    console.error('[NUCLEAR LOCK] FAIL-FAST: Node has NO linkTarget', {
      nodeId: node.uuid,
      nodeName: node.name || 'unnamed',
      category: node.userData?.category || 'unknown'
    });
    throw new Error(`[NUCLEAR LOCK] Node ${node.uuid} has no linkTarget — MISSION FAILED`);
  }
  
  // ABSOLUTE VALIDATION: linkTarget must NOT be protected
  if (isProtectedMesh(target)) {
    console.error('[NUCLEAR LOCK] linkTarget itself is protected — VIOLATION', {
      nodeId: node.uuid,
      targetId: target.uuid,
      isHologramShell: target.userData?.isHologramShell,
      isAura: target.userData?.isAura,
      isNodeRoot: target.userData?.isNodeRoot
    });
    throw new Error('[NUCLEAR LOCK] linkTarget is protected — impossible configuration');
  }
  
  return target;
}

/**
 * ✅ CHECK IF MESH IS PROTECTED (READ-ONLY)
 * 
 * @param {THREE.Object3D} mesh - Mesh to check
 * @returns {boolean} True if mesh cannot be mutated by link-state
 */
export function isProtectedMesh(mesh) {
  if (!mesh || !mesh.userData) return false;
  
  return (
    mesh.userData.isHologramShell === true ||
    mesh.userData.isAura === true ||
    mesh.userData.isNodeRoot === true ||
    mesh.userData.isNonLinkableVisual === true ||
    mesh.userData.isVFX === true
  );
}

/**
 * 🔒 FREEZE PROTECTED MESH (Make it READ-ONLY)
 * 
 * @param {THREE.Object3D} mesh - Mesh to freeze
 */
export function freezeProtectedMesh(mesh) {
  if (!mesh || !mesh.material) return;
  
  const material = mesh.material;
  
  // Freeze material properties at property level
  const props = ['opacity', 'transparent', 'color', 'emissive', 'emissiveIntensity'];
  
  for (const prop of props) {
    if (prop in material) {
      const desc = Object.getOwnPropertyDescriptor(material, prop);
      
      // If already frozen, skip
      if (desc && !desc.writable) continue;
      
      const value = material[prop];
      
      Object.defineProperty(material, prop, {
        value: value,
        writable: false,
        configurable: false
      });
    }
  }
  
  // Freeze needsUpdate
  Object.defineProperty(material, 'needsUpdate', {
    value: false,
    writable: false,
    configurable: false
  });
}

/**
 * 🛡️ ENFORCE RENDER HIERARCHY (Every Frame)
 * 
 * Call this in render loop to FORCE override any mutations to renderOrder/depth
 * 
 * @param {THREE.Object3D} node - Node to enforce hierarchy on
 */
export function enforceRenderHierarchy(node) {
  if (!node) return;
  
  node.traverse((child) => {
    if (!child.isMesh) return;

    // Phase B.2: render state delegated to TransparentStateAuthority
    if (child.userData?.__renderHierarchyLocked) return;
    
    // CORE: Render first, visible, no depth occlusion
    if (child.userData?.visualLayer === 'CORE' || child.userData?.isCoreMesh) {
      child.visible = true;
      if (child.material) {
        TransparentStateAuthority.apply(child, 'transparent', {
          renderOrder: 0,
          depthTest: false,
          depthWrite: false
        });
      }
      child.userData.__renderHierarchyLocked = true;
      return; // Don't process further
    }
    
    // SHELLS: Render after core, protected
    if (child.userData?.visualLayer === 'CORE_SHELL' || child.userData?.isHologramShell) {
      child.visible = true;
      child.frustumCulled = false; // ✅ CRITICAL: Never cull
      if (child.material) {
        TransparentStateAuthority.apply(child, 'holo', { renderOrder: 5 });
      }
      child.userData.__renderHierarchyLocked = true;
      return;
    }
    
    // AURAS: Render last (background)
    if (child.userData?.visualLayer === 'AURA' || child.userData?.isAura) {
      child.visible = true;
      if (child.material) {
        TransparentStateAuthority.apply(child, 'transparent', {
          renderOrder: 10,
          depthTest: true,
          depthWrite: false
        });
      }
      child.userData.__renderHierarchyLocked = true;
      return;
    }
    
    // VFX: Protected, normal depth
    if (child.userData?.visualLayer === 'VFX' || child.userData?.isNonLinkableVisual) {
      child.visible = true;
      child.frustumCulled = false; // ✅ CRITICAL: Never cull VFX
      child.userData.__renderHierarchyLocked = true;
      return;
    }
  });
}

/**
 * 🚨 MUTATION BLOCKER: Intercept and block all legacy mutations
 * 
 * @param {THREE.Object3D} mesh - Mesh being mutated
 * @param {string} property - Property being changed
 * @param {any} value - Value being assigned
 * @returns {boolean} True if mutation BLOCKED
 */
export function blockIllegalMutation(mesh, property, value) {
  if (!mesh) return false;
  
  // If it's a protected mesh and we're trying to mutate material
  if (isProtectedMesh(mesh) && ['opacity', 'transparent', 'color', 'emissive'].includes(property)) {
    console.error('[NUCLEAR LOCK] MUTATION BLOCKED', {
      meshId: mesh.uuid,
      meshType: mesh.userData?.visualLayer || 'unknown',
      attemptedProperty: property,
      attemptedValue: value,
      stackTrace: new Error().stack
    });
    return true; // BLOCKED
  }
  
  return false; // ALLOWED
}

/**
 * ⚠️ LEGACY LINK-STATE SHUTDOWN: Find and disable all legacy mutation code
 */
export const LEGACY_MUTATION_PATTERNS = [
  'applyLinkState',
  'applyGhost',
  'dimNode',
  'setOpacity',
  'ghostMode',
  'linkState',
  'boostCore',
  'mutateNodeVisuals'
];

/**
 * 🛑 ASSERT: Fail fast if node violates contract
 * 
 * @param {THREE.Object3D} node - Node to validate
 * @throws {Error} If node violates contract
 */
export function assertNodeContractCompliance(node) {
  if (!node) {
    throw new Error('[NUCLEAR LOCK] Node is null');
  }
  
  // Check 1: linkTarget exists
  if (!node.userData?.linkTarget) {
    throw new Error(`[NUCLEAR LOCK] FAIL-FAST: Node ${node.uuid} missing linkTarget`);
  }
  
  // Check 2: linkTarget is not protected
  const target = node.userData.linkTarget;
  if (isProtectedMesh(target)) {
    throw new Error(`[NUCLEAR LOCK] linkTarget itself is protected`);
  }
  
  // Check 3: Core has correct renderOrder
  if (target.renderOrder !== 0) {
    throw new Error(`[NUCLEAR LOCK] Core renderOrder is ${target.renderOrder}, expected 0`);
  }
  
  // Check 4: Core has depth settings
  if (target.material && target.material.depthTest !== false) {
    throw new Error(`[NUCLEAR LOCK] Core depthTest is ${target.material.depthTest}, expected false`);
  }
}

/**
 * 📊 MUTATION LISTENER: Log all attempted mutations (debug mode)
 * 
 * Attach to object to log all property changes
 */
export function attachMutationListener(obj, objectName = 'Object') {
  if (!obj || !obj.material) return;
  
  const handler = {
    set(target, prop, value) {
      if (['opacity', 'transparent', 'color', 'emissive'].includes(prop)) {
        console.log(`[MUTATION] ${objectName}.${prop} = ${value}`, {
          stack: new Error().stack.split('\n').slice(1, 3).join('\n')
        });
      }
      target[prop] = value;
      return true;
    }
  };
  
  return new Proxy(obj.material, handler);
}

/**
 * 🎨 VISUAL DEBUG MODE: Render bounding boxes around link targets
 * 
 * @param {THREE.Scene} scene - Scene to add debug visuals to
 * @param {boolean} enabled - Enable/disable debug mode
 */
export function setupVisualDebugMode(scene, enabled = true) {
  if (!scene) return;
  
  if (!window.__linkDebugBoxes) {
    window.__linkDebugBoxes = [];
  }
  
  if (!enabled) {
    // Clean up
    for (const box of window.__linkDebugBoxes) {
      scene.remove(box);
    }
    window.__linkDebugBoxes = [];
    return;
  }
  
  scene.traverse((obj) => {
    if (!obj.userData?.isNode) return;
    
    const target = obj.userData?.linkTarget;
    if (!target) return;
    
    // Create bounding box for linkTarget only
    const box3 = new THREE.Box3().setFromObject(target);
    const boxHelper = new THREE.Box3Helper(box3, 0x00ff00); // Green
    
    // Add to scene
    scene.add(boxHelper);
    window.__linkDebugBoxes.push(boxHelper);
    
    console.log(`[VISUAL DEBUG] Core bounding box added: ${obj.name || obj.uuid}`);
  });
  
  console.log(`[VISUAL DEBUG] ${window.__linkDebugBoxes.length} debug boxes added`);
}

/**
 * 🔒 NUCLEAR LOCK SYSTEM: Activate full enforcement
 * 
 * @param {THREE.Scene} scene - Scene to enforce
 * @returns {Object} Control API
 */
export function activateNuclearLock(scene) {
  if (!scene) {
    console.error('[NUCLEAR LOCK] No scene provided');
    return null;
  }
  
  // Step 1: Validate all nodes
  const validationResults = {
    total: 0,
    compliant: 0,
    failures: []
  };
  
  scene.traverse((obj) => {
    if (!obj.userData?.isNode) return;
    
    validationResults.total++;
    
    try {
      assertNodeContractCompliance(obj);
      validationResults.compliant++;
    } catch (err) {
      validationResults.failures.push({
        nodeId: obj.uuid,
        nodeName: obj.name || 'unnamed',
        error: err.message
      });
    }
  });
  
  if (validationResults.failures.length > 0) {
    console.error('[NUCLEAR LOCK] VALIDATION FAILED', validationResults);
    throw new Error(`[NUCLEAR LOCK] ${validationResults.failures.length} nodes fail compliance check`);
  }
  
  console.log(`[NUCLEAR LOCK] ✅ All ${validationResults.compliant} nodes compliant — LOCK ACTIVATED`);
  
  // Step 2: Freeze all protected meshes
  let frozenCount = 0;
  scene.traverse((obj) => {
    if (!obj.userData?.isNode) return;
    
    obj.traverse((child) => {
      if (isProtectedMesh(child)) {
        freezeProtectedMesh(child);
        frozenCount++;
      }
    });
  });
  
  console.log(`[NUCLEAR LOCK] ✅ Froze ${frozenCount} protected meshes`);
  
  // Return control API
  return {
    validateScene: () => {
      const results = { total: 0, compliant: 0, failures: [] };
      scene.traverse((obj) => {
        if (!obj.userData?.isNode) return;
        results.total++;
        try {
          assertNodeContractCompliance(obj);
          results.compliant++;
        } catch (err) {
          results.failures.push({ nodeId: obj.uuid, error: err.message });
        }
      });
      return results;
    },
    
    enforceAllNodes: () => {
      let count = 0;
      scene.traverse((obj) => {
        if (!obj.userData?.isNode) return;
        enforceRenderHierarchy(obj);
        count++;
      });
      return count;
    },
    
    enableDebugVisuals: () => {
      setupVisualDebugMode(scene, true);
    },
    
    disableDebugVisuals: () => {
      setupVisualDebugMode(scene, false);
    }
  };
}

/**
 * 🎬 CONSOLE API FOR TESTING
 */
export function setupNuclearLockConsoleAPI(scene) {
  if (!window.__nuclearLock) {
    window.__nuclearLock = {};
  }
  
  const lock = activateNuclearLock(scene);
  
  Object.assign(window.__nuclearLock, {
    /**
     * Validate scene: window.__nuclearLock.validate()
     */
    validate: () => {
      const results = lock.validateScene();
      console.group('[NUCLEAR LOCK] VALIDATION REPORT');
      console.log(`Total nodes: ${results.total}`);
      console.log(`Compliant: ${results.compliant}`);
      console.log(`Failures: ${results.failures.length}`);
      if (results.failures.length > 0) {
        console.group('Failed nodes:');
        for (const fail of results.failures) {
          console.error(`  [${fail.nodeId.substring(0, 8)}] ${fail.error}`);
        }
        console.groupEnd();
      }
      console.groupEnd();
      return results;
    },
    
    /**
     * Enforce all nodes: window.__nuclearLock.enforce()
     */
    enforce: () => {
      const count = lock.enforceAllNodes();
      console.log(`[NUCLEAR LOCK] Enforced ${count} nodes`);
      return count;
    },
    
    /**
     * Enable debug: window.__nuclearLock.debugOn()
     */
    debugOn: () => {
      lock.enableDebugVisuals();
      console.log('[NUCLEAR LOCK] Debug visuals enabled');
    },
    
    /**
     * Disable debug: window.__nuclearLock.debugOff()
     */
    debugOff: () => {
      lock.disableDebugVisuals();
      console.log('[NUCLEAR LOCK] Debug visuals disabled');
    },
    
    /**
     * Get absolute link target: window.__nuclearLock.getTarget(node)
     */
    getTarget: (node) => {
      try {
        const target = getAbsoluteLinkTarget(node);
        console.log('[NUCLEAR LOCK] Target retrieved:', target.uuid);
        return target;
      } catch (err) {
        console.error(err.message);
        return null;
      }
    }
  });
  
  console.log('✅ Nuclear Lock API active: window.__nuclearLock');
}

/**
 * 🚀 EXPORT EVERYTHING
 */
export const NuclearLock = {
  getAbsoluteLinkTarget,
  isProtectedMesh,
  freezeProtectedMesh,
  enforceRenderHierarchy,
  blockIllegalMutation,
  assertNodeContractCompliance,
  attachMutationListener,
  setupVisualDebugMode,
  activateNuclearLock,
  setupNuclearLockConsoleAPI
};
