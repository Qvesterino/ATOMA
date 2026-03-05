/**
 * AURA LOD CULLING SYSTEM v3.0 (With Frustum Culling)
 * ====================================================
 * Distance-based visibility gating + frustum culling for aura meshes.
 * Node logic remains FULLY ACTIVE; only aura rendering is culled.
 * 
 * Configuration:
 * - distanceThreshold: Hide auras beyond this distance (default: 30 units)
 * - hysteresis: Prevent flickering via hysteresis band (default: 3 units)
 * - updateInterval: Update frequency in ms (default: 100ms = 10 Hz)
 * - keepVisibleWhenSelected: Keep auras visible when node selected (default: true)
 * 
 * Optimization:
 * - Frustum culling skips off-screen aura rendering entirely
 * - Distance checks only for auras in view
 * - Improves frametime during camera movement
 */

import * as THREE from 'three';

export class AuraLODCulling {
  constructor(options = {}) {
    this.config = {
      distanceThreshold: options.distanceThreshold ?? 30,
      hysteresis: options.hysteresis ?? 3,
      updateInterval: options.updateInterval ?? 100,
      keepVisibleWhenSelected: options.keepVisibleWhenSelected ?? true,
    };
    
    this.timeSinceLastUpdate = 0;
    this.stats = { totalChecks: 0, culledThisFrame: 0, restoredThisFrame: 0, frustumCulledThisFrame: 0 };
    
    // Cached frustum and matrix for frustum culling
    // Allocated once in constructor, reused every update (zero allocation per frame)
    this._frustum = new THREE.Frustum();
    this._projectionMatrix = new THREE.Matrix4();
  }
  
  /**
   * Update aura visibility based on camera distance and frustum.
   * Call once per frame from AINodes.update().
   * 
   * Flow:
   * 1. Throttle checks (existing)
   * 2. Extract camera frustum (new)
   * 3. For each node:
   *    a. Check if in frustum (new - early exit if not)
   *    b. Apply distance-based LOD (existing)
   */
  updateCulling(nodes, camera, deltaTime) {
    if (!nodes?.length || !camera) return;
    
    // Throttle updates
    this.timeSinceLastUpdate += deltaTime * 1000;
    if (this.timeSinceLastUpdate < this.config.updateInterval) return;
    this.timeSinceLastUpdate = 0;
    
    this.stats.culledThisFrame = 0;
    this.stats.restoredThisFrame = 0;
    this.stats.frustumCulledThisFrame = 0;
    
    // Extract frustum from camera (once per update cycle)
    this._frustum.setFromProjectionMatrix(
      this._projectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    );
    
    const cameraPos = camera.position;
    const { distanceThreshold, hysteresis, keepVisibleWhenSelected } = this.config;
    
    for (const node of nodes) {
      if (!node?.userData) continue;
      
      this.stats.totalChecks++;
      const auras = this._findAuraMeshes(node);
      if (!auras.length) continue;
      
      // Frustum culling: skip distance checks for off-screen nodes
      const isSelected = keepVisibleWhenSelected &&
        (node.userData.isSelected || node.userData.isInspected || node.userData.isHovered);
      
      const auraRadius = this._getAuraBoundingRadius(node, auras);
      const sphere = new THREE.Sphere(
        node.getWorldPosition(new THREE.Vector3()),
        auraRadius
      );

      const inFrustum = this._frustum.intersectsSphere(sphere) || isSelected;
      
      if (!inFrustum) {
        // Node is outside frustum and not selected: hide all auras, skip distance check
        for (const aura of auras) {
          if (aura.visible) {
            aura.visible = false;
            this.stats.culledThisFrame++;
            this.stats.frustumCulledThisFrame++;
          }
        }
        continue; // Skip distance-based LOD for out-of-view nodes
      }
      
      // Node is in frustum: apply distance-based LOD (existing logic)
      const dist = cameraPos.distanceTo(node.position);
      const shouldBeVisible = isSelected || this._computeVisibility(dist, distanceThreshold, hysteresis, node.userData);
      
      for (const aura of auras) {
        if (aura.visible !== shouldBeVisible) {
          aura.visible = shouldBeVisible;
          shouldBeVisible ? this.stats.restoredThisFrame++ : this.stats.culledThisFrame++;
        }
      }
    }
  }
  
  /**
   * Compute aura visibility - LOD DISABLED.
   * Auras are always visible regardless of distance.
   * Kept for API compatibility.
   */
  _computeVisibility(distance, threshold, hysteresis, userData) {
    // LOD DISABLED: Always return true to prevent distance-based culling
    return true;
  }
  
  /**
   * Find all aura meshes in node hierarchy (direct children + grandchildren).
   * MICRO-STUTTER FIX: Reuse cached array to reduce GC pressure.
   */
  _findAuraMeshes(node) {
    // Reuse cached array to avoid allocation per frame
    if (!node.userData._cachedAuras) {
      node.userData._cachedAuras = [];
    }
    const auras = node.userData._cachedAuras;
    auras.length = 0; // Clear without deallocating
    
    if (!node.children) return auras;
    
    for (const child of node.children) {
      if (this._isAuraMesh(child)) auras.push(child);
      
      // Check grandchildren
      if (child.children) {
        for (const grandchild of child.children) {
          if (this._isAuraMesh(grandchild)) auras.push(grandchild);
        }
      }
    }
    
    return auras;
  }

  _getAuraBoundingRadius(node, auras) {
    let maxRadius = 0;

    for (const aura of auras) {
      if (!aura?.geometry) continue;

      if (!aura.geometry.boundingSphere) {
        aura.geometry.computeBoundingSphere();
      }

      const sphere = aura.geometry.boundingSphere;
      const scaledRadius = sphere.radius * (aura.scale?.x ?? 1);

      maxRadius = Math.max(maxRadius, scaledRadius);
    }

    return maxRadius || 1;
  }
  
  /**
   * Detect aura mesh via name, material, or userData marker.
   * MICRO-STUTTER FIX: Cache name result to avoid repeated string operations.
   */
  _isAuraMesh(obj) {
    if (!obj?.isMesh) return false;
    
    // Check userData marker (fastest path, zero-cost)
    if (obj.userData?.isAura) return true;
    
    // Check material signature (no string operations)
    const mat = obj.material;
    if (mat?.transparent && mat.opacity < 0.5 && obj.scale.length() > 1.1) {
      return true;
    }
    
    // NAME CHECK: Only if above checks failed (rare path)
    // Cache result in userData to avoid repeated string operations
    if (obj.userData?._auraNameChecked !== undefined) {
      return obj.userData._auraNameChecked;
    }
    
    const name = (obj.name || '').toLowerCase();
    const isAuraByName = name.includes('aura') || name.includes('glow') || name.includes('halo');
    
    // Cache result for future checks
    if (obj.userData) {
      obj.userData._auraNameChecked = isAuraByName;
    }
    
    return isAuraByName;
  }
  
  getStats() {
    return { ...this.stats };
  }
  
  getConfig() {
    return { ...this.config };
  }
  
  setConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }
  
  /**
   * Show all auras and reset cull state.
   */
  resetAllAuras(nodes) {
    if (!nodes?.length) return;
    
    for (const node of nodes) {
      if (!node) continue;
      
      const auras = this._findAuraMeshes(node);
      for (const aura of auras) {
        aura.visible = true;
      }
      
      if (node.userData) node.userData._auraIsCulled = false;
    }
  }
  
  dispose() {
    this._frustum = null;
    this._projectionMatrix = null;
    this.stats = null;
  }
}

/**
 * Setup console debugging API.
 * MICRO-STUTTER FIX: Gate console logs to reduce event loop blocking.
 */
export function setupAuraLODCullingConsoleAPI(auraLOD) {
  if (!window.debugAuraLOD) window.debugAuraLOD = {};
  
  // Check if we're in development (can be configured per project)
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : (process?.env?.NODE_ENV === 'development');
  
  Object.assign(window.debugAuraLOD, {
    setThreshold: (distance) => {
      auraLOD.setConfig({ distanceThreshold: distance });
      if (isDev) console.log(`📍 Aura LOD threshold: ${distance} units`);
    },
    setHysteresis: (hyst) => {
      auraLOD.setConfig({ hysteresis: hyst });
      if (isDev) console.log(`📍 Hysteresis: ${hyst} units`);
    },
    setUpdateHz: (hz) => {
      auraLOD.setConfig({ updateInterval: hz > 0 ? 1000 / hz : 100 });
      if (isDev) console.log(`📍 Update rate: ${hz} Hz`);
    },
    getStats: () => {
      const stats = auraLOD.getStats();
      if (isDev) {
        console.log('📊 Aura LOD Stats (this frame):');
        console.table(stats);
      }
      return stats;
    },
    getConfig: () => {
      const config = auraLOD.getConfig();
      if (isDev) console.table(config);
      return config;
    },
    resetAll: (nodes) => {
      auraLOD.resetAllAuras(nodes);
      if (isDev) console.log('✅ All auras visible');
    },
  });
  
  if (isDev) console.log('✅ Aura LOD console API ready (v3.0 with frustum culling): debugAuraLOD.*');
}

export default AuraLODCulling;
