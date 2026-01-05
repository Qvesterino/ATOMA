/**
 * RAYCAST GUARD SYSTEM v1.0
 * 
 * Prevents crashes caused by Raycaster attempting to compute
 * bounding geometry on frozen canonical geometries.
 * 
 * CRITICAL RULES:
 * 1. Frozen geometries MUST NOT be modified (ever)
 * 2. Bounding spheres/boxes MUST be precomputed BEFORE freeze
 * 3. Never call computeBoundingSphere() on frozen geometry
 * 4. All systems using raycaster must use safe geometry access
 * 
 * INTEGRATION:
 *   import { RaycastGuardSystem } from './RaycastGuardSystem_v1.js';
 *   const raycaster = new THREE.Raycaster();
 *   RaycastGuardSystem.intersectWithGuards(raycaster, meshes);
 */

import * as THREE from 'three';
import { CanonicalGeometryFamilies } from './CanonicalGeometryFamilies_v1.js';

export class RaycastGuardSystem {
  
  /**
   * Safe raycaster intersection that handles frozen geometries
   * Prevents computeBoundingSphere crashes on canonical nodes
   * 
   * @param {THREE.Raycaster} raycaster - The raycaster to use
   * @param {THREE.Object3D[]} objects - Objects to test
   * @param {boolean} recursive - Whether to test descendants
   * @returns {THREE.Intersection[]} Array of intersections
   */
  static intersectWithGuards(raycaster, objects, recursive = false) {
    if (!raycaster || !objects) {
      return [];
    }
    
    const intersects = [];
    
    try {
      // Attempt standard raycasting
      const results = raycaster.intersectObjects(objects, recursive);
      
      // Verify each intersection's geometry is safe
      for (const hit of results) {
        if (hit.object && hit.object.geometry) {
          // Check if geometry is frozen and ready
          if (!this._isGeometrySafeForIntersection(hit.object.geometry)) {
            console.warn('[RaycastGuardSystem] Skipping intersection: unsafe geometry');
            continue;
          }
          intersects.push(hit);
        }
      }
      
      return intersects;
    } catch (err) {
      console.error('[RaycastGuardSystem] Raycasting error:', err);
      
      // Fallback: manual raycast on visible objects
      console.warn('[RaycastGuardSystem] Falling back to manual intersection testing');
      return this._manualIntersectFallback(raycaster, objects, recursive);
    }
  }
  
  /**
   * Alternative: Raycast only safe objects
   * Filters out any frozen canonical geometries
   * 
   * @param {THREE.Raycaster} raycaster
   * @param {THREE.Object3D[]} objects
   * @returns {THREE.Intersection[]} Safe intersections only
   */
  static intersectSafeOnly(raycaster, objects) {
    if (!raycaster || !objects) {
      return [];
    }
    
    // Filter to only safe geometries
    const safeObjects = objects.filter(obj => {
      if (!obj.geometry) return true; // Groups/non-meshes are ok
      return this._isGeometrySafeForIntersection(obj.geometry);
    });
    
    try {
      return raycaster.intersectObjects(safeObjects, false);
    } catch (err) {
      console.error('[RaycastGuardSystem] Safe-only raycasting failed:', err);
      return [];
    }
  }
  
  /**
   * Check if geometry is safe for intersection testing
   * Returns false only if immutable AND missing precomputed bounds
   * 
   * @private
   * @param {THREE.BufferGeometry} geometry
   * @returns {boolean} True if safe to raycast
   */
  static _isGeometrySafeForIntersection(geometry) {
    if (!geometry) return true;
    
    // Check if marked as immutable
    const isImmutable = geometry.userData && geometry.userData.immutable === true;
    
    if (isImmutable) {
      // Immutable geometry is safe IF precomputed
      const hasPrecomputed = geometry.userData && 
                            geometry.userData.precomputedAndFrozen === true;
      const hasBounds = geometry.boundingSphere !== null &&
                       geometry.boundingSphere !== undefined;
      
      if (!hasPrecomputed || !hasBounds) {
        console.warn('[RaycastGuardSystem] Immutable geometry missing precomputed bounds');
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Manual intersection fallback (if standard raycasting fails)
   * Tests ray against mesh bounds manually
   * 
   * @private
   */
  static _manualIntersectFallback(raycaster, objects, recursive) {
    const intersects = [];
    const ray = raycaster.ray;
    
    const traverse = (obj) => {
      if (!obj.visible) return;
      
      if (obj.isMesh && obj.geometry) {
        // Get safe bounds
        const bounds = CanonicalGeometryFamilies.getBoundingSphere(obj.geometry);
        if (!bounds) return;
        
        // Quick sphere test
        if (ray.distanceToPoint(bounds.center) > bounds.radius) {
          return; // Sphere miss
        }
        
        // Geometry might be hit (conservative)
        intersects.push({
          point: ray.origin.clone().add(ray.direction.clone().multiplyScalar(bounds.radius)),
          object: obj,
          distance: bounds.radius,
          uv: null,
          face: null,
          faceIndex: null,
          instanceId: null
        });
      }
      
      if (recursive && obj.children) {
        for (const child of obj.children) {
          traverse(child);
        }
      }
    };
    
    for (const obj of objects) {
      traverse(obj);
    }
    
    return intersects;
  }
  
  /**
   * Audit system: Check all nodes for unsafe geometries
   * Call this during development to catch issues early
   * 
   * @param {THREE.Scene} scene
   * @returns {Object} Audit report
   */
  static auditScene(scene) {
    const report = {
      total: 0,
      immutableCount: 0,
      safeCount: 0,
      unsafeCount: 0,
      unsafeGeometries: [],
      timestamp: new Date().toISOString()
    };
    
    scene.traverse(obj => {
      if (!obj.geometry) return;
      
      report.total++;
      
      const isImmutable = obj.geometry.userData && obj.geometry.userData.immutable === true;
      const isPrecomputed = obj.geometry.userData && 
                           obj.geometry.userData.precomputedAndFrozen === true;
      const hasBounds = obj.geometry.boundingSphere !== null;
      
      if (isImmutable) {
        report.immutableCount++;
        
        if (isPrecomputed && hasBounds) {
          report.safeCount++;
        } else {
          report.unsafeCount++;
          report.unsafeGeometries.push({
            object: obj.name || 'unnamed',
            type: obj.type,
            isImmutable: true,
            isPrecomputed: isPrecomputed,
            hasBounds: hasBounds,
            issue: !isPrecomputed ? 'Missing precomputed flag' : 'Missing boundingSphere'
          });
        }
      } else {
        report.safeCount++;
      }
    });
    
    return report;
  }
  
  /**
   * Log audit report
   * Useful for debugging raycast issues
   */
  static logAuditReport(report) {
    console.group('[RaycastGuardSystem] Scene Audit Report');
    console.log(`Total geometries: ${report.total}`);
    console.log(`Immutable (marked): ${report.immutableCount}`);
    console.log(`Safe: ${report.safeCount}`);
    console.log(`Unsafe: ${report.unsafeCount}`);
    
    if (report.unsafeCount > 0) {
      console.group('⚠️ Unsafe Geometries:');
      for (const geom of report.unsafeGeometries) {
        console.warn(`${geom.object} (${geom.type}): ${geom.issue}`);
      }
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}
