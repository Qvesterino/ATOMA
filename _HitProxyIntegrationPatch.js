/**
 * HIT PROXY INTEGRATION PATCH — NodeLinkingSystem Integration
 * 
 * MISSION:
 * Replace all raycasting on real node visuals with STRICT hit-proxy raycasting.
 * 
 * FLOW:
 * 1. Intercept raycaster.intersectObjects() calls
 * 2. Redirect to hit-proxy system
 * 3. Map results back to node IDs
 * 4. Update selection logic to use node IDs
 * 5. Ensure visuals never touched by raycaster
 * 
 * SAFETY GUARANTEES:
 * ✓ Real visuals have raycast = disabled
 * ✓ Only hit-proxies can be raycasted
 * ✓ No geometry.computeBoundingSphere() calls
 * ✓ No frozen BufferGeometry mutations
 * ✓ Perfect separation of concerns
 */

import * as THREE from 'three';
import { setupHitProxySystem } from './_HitProxySystem_v1.js';

// ============================================================================
// PATCH 1: Disable Raycast on Real Visuals
// ============================================================================

/**
 * Disable raycast on all real node visuals (core, aura, glyphs, holograms)
 */
function disableRaycastOnVisuals(scene) {
  const visualMeshes = [];

  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;

    // Check if this is a real visual (not a proxy)
    if (obj.userData?.isHitProxy === true) return;

    // Check if this should be raycasted
    const isNodeCore = obj.userData?.isNodeCore === true;
    const isAura = obj.userData?.isAura === true;
    const isGlyph = obj.userData?.isGlyph === true;
    const isHologram = obj.userData?.isHologram === true;
    const isShell = obj.userData?.isShell === true;

    if (isNodeCore || isAura || isGlyph || isHologram || isShell) {
      // Override raycast to do nothing
      obj.raycast = () => {
        // No-op: Don't raycast on real visuals
      };

      visualMeshes.push(obj);
    }
  });

  console.log(`[HitProxyIntegrationPatch] Disabled raycast on ${visualMeshes.length} visual meshes`);
  return visualMeshes;
}

// ============================================================================
// PATCH 2: Intercept Raycaster Calls
// ============================================================================

/**
 * Create a wrapper raycaster that redirects to hit-proxies
 */
function createProxyRedirectingRaycaster(raycaster, hitProxySystem) {
  const originalIntersectObjects = raycaster.intersectObjects.bind(raycaster);

  // Override intersectObjects
  raycaster.intersectObjects = function(objects, recursive = false, optionalTarget = []) {
    // Always use hit-proxy system if available
    const results = hitProxySystem.raycast(raycaster, null, hitProxySystem.registry.getAllProxies());
    
    // Convert hit-proxy results back to expected format
    return results;
  };

  return raycaster;
}

// ============================================================================
// PATCH 3: Create Hit-Proxy Aware Selection
// ============================================================================

/**
 * Patch NodeLinkingSystem to use hit-proxies
 */
function patchNodeLinkingSystemRaycast(linkingSystem, hitProxySystem) {
  if (!linkingSystem) return;

  // Get the original raycast method
  const originalGetIntersectedNode = linkingSystem.getIntersectedNode;

  // Replace with proxy-aware version
  linkingSystem.getIntersectedNode = function(raycaster, camera) {
    // Raycast against hit-proxies only
    const intersections = hitProxySystem.raycast(raycaster, camera);

    if (intersections.length === 0) return null;

    // Get node ID from first intersection
    const nodeId = intersections[0].nodeId;
    if (!nodeId) return null;

    // Find node by ID
    for (const node of (this.aiNodes?.nodes || [])) {
      if (node.userData?.nodeId === nodeId) {
        return node;
      }
    }

    return null;
  }.bind(linkingSystem);

  console.log('[HitProxyIntegrationPatch] NodeLinkingSystem patched for hit-proxy raycasting');
}

// ============================================================================
// PATCH 4: Create Safe Raycaster
// ============================================================================

/**
 * Create a raycaster that ONLY intersects hit-proxies
 * Guarantees zero intersection with real visuals
 */
function createSafeProxyRaycaster(hitProxySystem) {
  const raycaster = new THREE.Raycaster();
  
  // Store reference to hit-proxy system
  raycaster.__hitProxySystem = hitProxySystem;
  raycaster.__isProxySafeRaycaster = true;

  // Override intersectObjects to use only hit-proxies
  raycaster.intersectObjects = function(objects, recursive = false, optionalTarget = []) {
    // Ignore input objects, use only hit-proxies
    const proxies = this.__hitProxySystem.registry.getAllProxies();
    
    // Use original THREE.Raycaster intersectObjects with proxies
    return THREE.Raycaster.prototype.intersectObjects.call(this, proxies, recursive, optionalTarget);
  };

  // Add convenience method to get node ID
  raycaster.getIntersectedNodeId = function(camera, clientX, clientY, viewport) {
    // Set raycaster from mouse position
    this.setFromCamera({ x: clientX, y: clientY }, camera);

    // Get intersections
    globalThis.console?.log?.("[RAYCAST]", "_HitProxyIntegrationPatch.js", "targets:", this.__hitProxySystem.registry.getAllProxies().length);
    const intersections = this.intersectObjects(this.__hitProxySystem.registry.getAllProxies(), false);

    if (intersections.length === 0) return null;

    return intersections[0].object?.userData?.targetNodeId;
  };

  return raycaster;
}

// ============================================================================
// PATCH 5: Audit Trail
// ============================================================================

/**
 * Create audit trail for raycast interactions
 */
class RaycastAuditTrail {
  constructor() {
    this.interactions = [];
    this.maxEntries = 1000;
  }

  log(eventType, data) {
    this.interactions.push({
      timestamp: performance.now(),
      type: eventType,
      data: data
    });

    // Keep size bounded
    if (this.interactions.length > this.maxEntries) {
      this.interactions.shift();
    }
  }

  getLastInteraction() {
    return this.interactions[this.interactions.length - 1] || null;
  }

  printReport() {
    console.log('[RaycastAuditTrail] Last 10 interactions:');
    const last10 = this.interactions.slice(-10);
    for (const entry of last10) {
      console.log(`  [${entry.type}]`, entry.data);
    }
  }

  clear() {
    this.interactions = [];
  }
}

// ============================================================================
// COMPLETE INTEGRATION
// ============================================================================

/**
 * Apply complete hit-proxy integration to game systems
 */
export function applyHitProxyIntegration(scene, aiNodes, linkingSystem, options = {}) {
  console.log('[HitProxyIntegration] Starting integration...');

  // 1. Setup hit-proxy system
  const hitProxySystem = setupHitProxySystem(scene, aiNodes, {
    proxyRadius: options.proxyRadius ?? 0.7,
    layer: options.layer ?? 10,
    autoSync: options.autoSync ?? true,
    autoHookSpawning: options.autoHookSpawning ?? true
  });

  // 2. Disable raycast on real visuals
  disableRaycastOnVisuals(scene);

  // 3. Patch linking system
  patchNodeLinkingSystemRaycast(linkingSystem, hitProxySystem);

  // 4. Create safe raycaster
  const safeRaycaster = createSafeProxyRaycaster(hitProxySystem);

  // 5. Create audit trail
  const auditTrail = new RaycastAuditTrail();

  // 6. Expose globally for debugging
  window.hitProxySystem = hitProxySystem;
  window.safeProxyRaycaster = safeRaycaster;
  window.raycastAuditTrail = auditTrail;

  console.log('[HitProxyIntegration] Integration complete ✓');
  console.log('[HitProxyIntegration] Global exports:');
  console.log('  - window.hitProxySystem');
  console.log('  - window.safeProxyRaycaster');
  console.log('  - window.raycastAuditTrail');

  return {
    hitProxySystem,
    safeRaycaster,
    auditTrail,
    disableRaycastOnVisuals,
    createSafeProxyRaycaster
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Verify that hit-proxy system is working correctly
 */
export function validateHitProxySystem(hitProxySystem) {
  console.log('[HitProxyValidation] Running validation...');

  const stats = hitProxySystem.getStats();
  const errors = [];
  const warnings = [];

  // Check proxies exist
  if (stats.totalProxies === 0) {
    errors.push('❌ No proxies created');
  } else {
    console.log(`✓ ${stats.totalProxies} proxies active`);
  }

  // Check setup complete
  if (!stats.setupComplete) {
    errors.push('❌ Setup not complete');
  } else {
    console.log('✓ Setup complete');
  }

  // Check auto-sync
  if (!stats.autoSyncEnabled) {
    warnings.push('⚠️  Auto-sync disabled (manual sync required)');
  } else {
    console.log('✓ Auto-sync enabled');
  }

  // Print results
  console.log('[HitProxyValidation] Results:');
  if (errors.length === 0) {
    console.log('✅ All checks passed');
  } else {
    console.log('❌ Errors found:');
    for (const err of errors) {
      console.log(`  ${err}`);
    }
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    for (const warn of warnings) {
      console.log(`  ${warn}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

// ============================================================================
// DEBUG CONSOLE API
// ============================================================================

/**
 * Setup debug console API for hit-proxy system
 */
export function setupHitProxyDebugAPI() {
  window.HitProxyDebug = {
    /**
     * Print hit-proxy statistics
     */
    stats() {
      if (!window.hitProxySystem) {
        console.log('❌ Hit-proxy system not initialized');
        return;
      }
      window.hitProxySystem.printReport();
    },

    /**
     * Validate hit-proxy system
     */
    validate() {
      if (!window.hitProxySystem) {
        console.log('❌ Hit-proxy system not initialized');
        return;
      }
      validateHitProxySystem(window.hitProxySystem);
    },

    /**
     * Get proxy for a node
     */
    getProxy(nodeId) {
      if (!window.hitProxySystem) {
        console.log('❌ Hit-proxy system not initialized');
        return null;
      }
      const proxy = window.hitProxySystem.registry.getProxy(nodeId);
      console.log(`Proxy for node ${nodeId}:`, proxy);
      return proxy;
    },

    /**
     * Test raycast
     */
    testRaycast(clientX = window.innerWidth / 2, clientY = window.innerHeight / 2) {
      if (!window.safeProxyRaycaster || !window.game?.camera) {
        console.log('❌ Raycaster or camera not initialized');
        return;
      }

      const raycaster = window.safeProxyRaycaster;
      const camera = window.game.camera;

      // Convert screen coords to normalized device coords
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -(clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera({ x, y }, camera);
      globalThis.console?.log?.("[RAYCAST]", "_HitProxyIntegrationPatch.js", "targets:", window.hitProxySystem.registry.getAllProxies().length);
      const intersections = raycaster.intersectObjects(window.hitProxySystem.registry.getAllProxies(), false);

      if (intersections.length > 0) {
        const result = intersections[0];
        const nodeId = result.object?.userData?.targetNodeId;
        console.log('✓ Raycast hit:');
        console.log('  Node ID:', nodeId);
        console.log('  Distance:', result.distance.toFixed(2));
        console.log('  Point:', result.point);
        return nodeId;
      } else {
        console.log('❌ No hit');
        return null;
      }
    },

    /**
     * Show audit trail
     */
    auditTrail() {
      if (!window.raycastAuditTrail) {
        console.log('❌ Audit trail not initialized');
        return;
      }
      window.raycastAuditTrail.printReport();
    },

    /**
     * Get all proxies
     */
    allProxies() {
      if (!window.hitProxySystem) {
        console.log('❌ Hit-proxy system not initialized');
        return [];
      }
      return window.hitProxySystem.registry.getAllProxies();
    }
  };

  console.log('[HitProxyDebug] Debug API available at window.HitProxyDebug');
  console.log('  - HitProxyDebug.stats()');
  console.log('  - HitProxyDebug.validate()');
  console.log('  - HitProxyDebug.getProxy(nodeId)');
  console.log('  - HitProxyDebug.testRaycast(x, y)');
  console.log('  - HitProxyDebug.auditTrail()');
  console.log('  - HitProxyDebug.allProxies()');
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  disableRaycastOnVisuals,
  createProxyRedirectingRaycaster,
  patchNodeLinkingSystemRaycast,
  createSafeProxyRaycaster,
  RaycastAuditTrail
};
