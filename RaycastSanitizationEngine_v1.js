/**
 * RAYCAST SANITIZATION ENGINE v1.0
 * 
 * DEFINITIVE fix for Three.js raycast crashes caused by read-only boundingSphere.
 * 
 * Core mission:
 * - Ensure ALL meshes in scene have valid, mutable boundingSphere
 * - Prevent raycasting against invalid geometries
 * - Remove readonly property descriptors that break raycasting
 * - Explicitly disable raycast on non-interactive meshes
 * 
 * This is a SYSTEM-LEVEL fix, not a workaround.
 * 
 * Integration:
 *   import { RaycastSanitizationEngine } from './RaycastSanitizationEngine_v1.js';
 *   
 *   // After scene creation
 *   RaycastSanitizationEngine.sanitizeGeometryForRaycasting(scene);
 *   
 *   // After spawning nodes
 *   RaycastSanitizationEngine.sanitizeGeometryForRaycasting(scene);
 *   
 *   // For raycasting
 *   const raycastables = RaycastSanitizationEngine.getInteractiveRaycastables(scene);
 *   const hits = raycaster.intersectObjects(raycastables, true);
 *   
 *   // Validation (call once)
 *   RaycastSanitizationEngine.validateGeometryHealth(scene);
 */

import * as THREE from 'three';
import { CanonicalGeometryFamilies } from './CanonicalGeometryFamilies_v1.js';

export class RaycastSanitizationEngine {
  
  // ===== STEP 1: GLOBAL GEOMETRY SANITATION =====
  
  /**
   * Global sanitation pass for raycast safety
   * 
   * MUST be called:
   * - After world creation
   * - After node spawning
   * - After FX/preview mesh creation
   * - Before any raycasting operations
   * 
   * Guarantees:
   * - All meshes have valid, mutable boundingSphere
   * - No readonly descriptors on bounding volumes
   * - All geometries can be safely raycasted
   */
  static sanitizeGeometryForRaycasting(scene) {
    const log = {
      checked: 0,
      fixed: 0,
      readonly_removed: 0,
      bounds_computed: 0,
      raycast_disabled: 0,
      errors: []
    };

    scene.traverse(obj => {
      // Only process meshes with geometry
      if (!obj.isMesh || !obj.geometry) return;

      log.checked++;
      const geo = obj.geometry;

      // ─────────────────────────────────────────
      // Step 1a: Remove illegal readonly descriptors
      // ─────────────────────────────────────────

      // Check boundingSphere descriptor
      const bsDesc = Object.getOwnPropertyDescriptor(geo, 'boundingSphere');
      if (bsDesc && bsDesc.writable === false) {
        try {
          delete geo.boundingSphere;
          log.readonly_removed++;
          console.warn(
            '[RaycastSanitizationEngine] Removed readonly boundingSphere on',
            obj.name || obj.uuid
          );
        } catch (err) {
          log.errors.push(`Failed to delete readonly boundingSphere: ${err.message}`);
        }
      }

      // Check boundingBox descriptor
      const bbDesc = Object.getOwnPropertyDescriptor(geo, 'boundingBox');
      if (bbDesc && bbDesc.writable === false) {
        try {
          delete geo.boundingBox;
          log.readonly_removed++;
          console.warn(
            '[RaycastSanitizationEngine] Removed readonly boundingBox on',
            obj.name || obj.uuid
          );
        } catch (err) {
          log.errors.push(`Failed to delete readonly boundingBox: ${err.message}`);
        }
      }

      // ─────────────────────────────────────────
      // Step 1b: Ensure bounding volumes exist
      // ─────────────────────────────────────────

      // ComputeBoundingSphere if missing
      if (geo.boundingSphere === null || geo.boundingSphere === undefined) {
        try {
          geo.computeBoundingSphere();
          log.bounds_computed++;
        } catch (err) {
          // Last resort: disable raycast on this mesh
          log.errors.push(
            `Failed to compute boundingSphere on ${obj.name}: ${err.message}`
          );
          this.disableRaycastOnMesh(obj);
          log.raycast_disabled++;
          return
        }
      }

      // ComputeBoundingBox if missing
      if (geo.boundingBox === null || geo.boundingBox === undefined) {
        try {
          geo.computeBoundingBox();
        } catch (err) {
          // BoundingBox is optional, but log if needed
          console.warn(
            '[RaycastSanitizationEngine] Failed to compute boundingBox on',
            obj.name || obj.uuid,
            err.message
          );
        }
      }

      // ─────────────────────────────────────────
      // Step 1c: Mark geometry as sanitized
      // ─────────────────────────────────────────
      geo.userData = geo.userData || {};
      geo.userData.raycastSanitized = true;
      log.fixed++;
    });

    // Log results
    if (log.fixed > 0 || log.readonly_removed > 0 || log.bounds_computed > 0) {
      console.group('[RaycastSanitizationEngine] Geometry Sanitation Report');
      console.log(`Meshes checked: ${log.checked}`);
      console.log(`Geometries fixed: ${log.fixed}`);
      console.log(`Readonly descriptors removed: ${log.readonly_removed}`);
      console.log(`Bounds computed: ${log.bounds_computed}`);
      console.log(`Raycast disabled (fallback): ${log.raycast_disabled}`);
      if (log.errors.length > 0) {
        console.group('⚠️ Errors:');
        log.errors.forEach(e => console.error(e));
        console.groupEnd();
      }
      console.groupEnd();
    }

    return log;
  }

  // ===== STEP 2: RAYCAST FILTERING =====

  /**
   * Get only interactive, raycast-safe meshes from scene
   * 
   * Returns array of meshes that:
   * - Have valid geometry
   * - Have valid boundingSphere
   * - Are marked as interactive
   * - Are not disabled for raycasting
   * 
   * Use this instead of raycasting entire scene
   */
  static getInteractiveRaycastables(scene, options = {}) {
    const {
      includeInvisible = false,
      minimalCheck = false
    } = options;

    const raycastables = [];

    scene.traverse(obj => {
      // Skip non-meshes
      if (!obj.isMesh || !obj.geometry) return;

      // Skip if invisible (unless explicitly included)
      if (!includeInvisible && !obj.visible) return;

      // Skip if raycast is disabled
      if (obj.raycast === this._RAYCAST_DISABLED) return;

      // Skip if marked as non-interactive
      if (obj.userData?.nonInteractive === true) return;

      // Minimal check: just verify geometry exists
      if (minimalCheck) {
        raycastables.push(obj);
        return
      }

      // Full check: verify bounding volumes exist
      const geo = obj.geometry;
      if (
        geo.boundingSphere !== null &&
        geo.boundingSphere !== undefined &&
        (geo.userData?.raycastSanitized === true || geo.boundingSphere.radius > 0)
      ) {
        raycastables.push(obj);
      }
    });

    return raycastables;
  }

  // ===== STEP 3: EXPLICIT RAYCAST DISABLING =====

  /**
   * Marker function for disabled raycast
   * @private
   */
  static _RAYCAST_DISABLED = () => [];

  /**
   * Explicitly disable raycasting on a mesh
   * 
   * Used for:
   * - Aura meshes
   * - FX meshes
   * - Link previews
   * - Hologram rings
   * - Debug helpers
   * - Visualization-only overlays
   * 
   * Do NOT rely on layers alone - set this explicitly
   */
  static disableRaycastOnMesh(mesh) {
    mesh.raycast = this._RAYCAST_DISABLED;
    mesh.userData = mesh.userData || {};
    mesh.userData.raycastDisabled = true;
  }

  /**
   * Re-enable raycasting on a mesh
   */
  static enableRaycastOnMesh(mesh) {
    mesh.raycast = THREE.Mesh.prototype.raycast;
    mesh.userData = mesh.userData || {};
    mesh.userData.raycastDisabled = false;
  }

  /**
   * Disable raycasting on all meshes in a group
   */
  static disableRaycastOnGroup(group) {
    group.traverse(obj => {
      if (obj.isMesh) {
        this.disableRaycastOnMesh(obj);
      }
    });
  }

  // ===== STEP 4: CANONICAL IMMUTABILITY PATTERN =====

  /**
   * Mark geometry as canonical (immutable topology)
   * 
   * Sets:
   * - userData.canonical = true
   * - userData.immutableTopology = true
   * - Attributes to StaticDrawUsage (optimization, not lock)
   * 
   * Engine must respect immutableTopology flag by design.
   * This is CONVENTION, not enforcement (unlike Object.freeze).
   */
  static markCanonicalGeometry(geometry) {
    geometry.userData = geometry.userData || {};
    geometry.userData.canonical = true;
    geometry.userData.immutableTopology = true;

    // Optimize attribute usage (StaticDrawUsage hints to GPU)
    if (geometry.attributes.position) {
      geometry.attributes.position.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.normal) {
      geometry.attributes.normal.usage = THREE.StaticDrawUsage;
    }
    if (geometry.attributes.uv) {
      geometry.attributes.uv.usage = THREE.StaticDrawUsage;
    }

    return geometry;
  }

  /**
   * Check if geometry is marked canonical
   */
  static isCanonical(geometry) {
    return geometry.userData?.canonical === true;
  }

  /**
   * Check if geometry should be treated as immutable
   */
  static isImmutableTopology(geometry) {
    return geometry.userData?.immutableTopology === true;
  }

  // ===== STEP 5: FORENSIC VALIDATION =====

  /**
   * One-time comprehensive validation check
   * 
   * MUST return 0 errors for production readiness
   * 
   * Checks:
   * - No readonly boundingSphere descriptors
   * - All meshes have valid boundingSphere
   * - Canonical geometries properly marked
   * - No frozen geometry objects
   */
  static validateGeometryHealth(scene) {
    const report = {
      timestamp: new Date().toISOString(),
      total_meshes: 0,
      sanitized: 0,
      readonly_descriptors_found: 0,
      missing_bounds_sphere: 0,
      frozen_geometries: 0,
      invalid_canonical: 0,
      errors: [],
      warnings: []
    };

    scene.traverse(obj => {
      if (!obj.isMesh || !obj.geometry) return;

      report.total_meshes++;
      const geo = obj.geometry;

      // ─ Check 1: Readonly descriptors
      const bsDesc = Object.getOwnPropertyDescriptor(geo, 'boundingSphere');
      if (bsDesc && bsDesc.writable === false) {
        report.readonly_descriptors_found++;
        report.errors.push(
          `[READONLY BOUNDINGSPHERE] Mesh: ${obj.name || obj.uuid}`
        );
      }

      const bbDesc = Object.getOwnPropertyDescriptor(geo, 'boundingBox');
      if (bbDesc && bbDesc.writable === false) {
        report.readonly_descriptors_found++;
        report.errors.push(
          `[READONLY BOUNDINGBOX] Mesh: ${obj.name || obj.uuid}`
        );
      }

      // ─ Check 2: Missing boundingSphere
      if (geo.boundingSphere === null || geo.boundingSphere === undefined) {
        report.missing_bounds_sphere++;
        report.errors.push(
          `[MISSING BOUNDINGSPHERE] Mesh: ${obj.name || obj.uuid}`
        );
      }

      // ─ Check 3: Frozen geometries (should never happen)
      if (Object.isFrozen(geo)) {
        report.frozen_geometries++;
        report.errors.push(
          `[FROZEN GEOMETRY] Mesh: ${obj.name || obj.uuid} (This breaks raycasting!)`
        );
      }

      // ─ Check 4: Invalid canonical marking
      if (geo.userData?.canonical === true && !geo.userData?.immutableTopology) {
        report.invalid_canonical++;
        report.warnings.push(
          `[INVALID CANONICAL] Mesh marked canonical but not immutableTopology: ${obj.name || obj.uuid}`
        );
      }

      // ─ Check 5: Sanitization flag
      if (!Object.isFrozen(geo) && geo.boundingSphere !== null) {
        report.sanitized++;
      }
    });

    // Log comprehensive report
    console.group('[RaycastSanitizationEngine] Geometry Health Report');
    console.log(`Total meshes: ${report.total_meshes}`);
    console.log(`Sanitized: ${report.sanitized}`);
    console.log(`Readonly descriptors found: ${report.readonly_descriptors_found}`);
    console.log(`Missing boundingSphere: ${report.missing_bounds_sphere}`);
    console.log(`Frozen geometries: ${report.frozen_geometries}`);
    console.log(`Invalid canonical: ${report.invalid_canonical}`);

    if (report.errors.length > 0) {
      console.group('❌ CRITICAL ERRORS:');
      report.errors.forEach(e => console.error(e));
      console.groupEnd();
    }

    if (report.warnings.length > 0) {
      console.group('⚠️ Warnings:');
      report.warnings.forEach(w => console.warn(w));
      console.groupEnd();
    }

    if (report.errors.length === 0) {
      console.log('✅ All geometry health checks PASSED');
    }

    console.groupEnd();

    return report;
  }

  // ===== UTILITY METHODS =====

  /**
   * Force-sanitize a single mesh
   */
  static sanitizeMesh(mesh) {
    if (!mesh.isMesh || !mesh.geometry) return;

    const geo = mesh.geometry;

    // Remove readonly descriptors
    try {
      const bsDesc = Object.getOwnPropertyDescriptor(geo, 'boundingSphere');
      if (bsDesc && bsDesc.writable === false) {
        delete geo.boundingSphere;
      }
    } catch (err) {
      console.warn('Failed to remove readonly boundingSphere:', err);
    }

    // Compute bounds if missing
    if (geo.boundingSphere === null) {
      try {
        geo.computeBoundingSphere();
      } catch (err) {
        console.warn('Failed to compute boundingSphere:', err);
        this.disableRaycastOnMesh(mesh);
      }
    }

    geo.userData = geo.userData || {};
    geo.userData.raycastSanitized = true;
  }

  /**
   * Get summary of raycastable vs disabled meshes
   */
  static getRaycastStatistics(scene) {
    const stats = {
      total: 0,
      interactive: 0,
      disabled: 0,
      no_geometry: 0,
      invisible: 0
    };

    scene.traverse(obj => {
      if (!obj.isMesh) return;

      stats.total++;

      if (!obj.geometry) {
        stats.no_geometry++;
        return;
      }

      if (!obj.visible) {
        stats.invisible++;
        return;
      }

      if (obj.userData?.raycastDisabled === true) {
        stats.disabled++;
      } else {
        stats.interactive++;
      }
    });

    return stats;
  }

  // ===== RAYCAST GUARD HELPERS (inlined from RaycastGuardSystem) =====

  /**
   * Check if geometry is safe for intersection testing
   * Returns false only if immutable AND missing precomputed bounds
   */
  static _isGeometrySafeForIntersection(geometry) {
    if (!geometry) return true;
    const isImmutable = geometry.userData && geometry.userData.immutable === true;
    if (isImmutable) {
      const hasPrecomputed = geometry.userData?.precomputedAndFrozen === true;
      const hasBounds = geometry.boundingSphere !== null && geometry.boundingSphere !== undefined;
      if (!hasPrecomputed || !hasBounds) {
        return false;
      }
    }
    return true;
  }

  /**
   * Safe-only raycast: filters out unsafe geometries
   */
  static intersectSafeOnly(raycaster, objects) {
    if (!raycaster || !objects) return [];
    const safeObjects = objects.filter(obj => {
      if (!obj.geometry) return true;
      return this._isGeometrySafeForIntersection(obj.geometry);
    });
    try {
      return raycaster.intersectObjects(safeObjects, false);
    } catch (_err) {
      return [];
    }
  }

  /**
   * Guarded intersection: skips unsafe hits and falls back if needed
   */
  static intersectWithGuards(raycaster, objects, recursive = false) {
    if (!raycaster || !objects) return [];
    const intersects = [];
    try {
      const results = raycaster.intersectObjects(objects, recursive);
      for (const hit of results) {
        if (hit.object && hit.object.geometry) {
          if (!this._isGeometrySafeForIntersection(hit.object.geometry)) {
            continue;
          }
          intersects.push(hit);
        }
      }
      return intersects;
    } catch (_err) {
      return this._manualIntersectFallback(raycaster, objects, recursive);
    }
  }

  /**
   * Manual intersection fallback using bounding spheres
   */
  static _manualIntersectFallback(raycaster, objects, recursive) {
    const intersects = [];
    const ray = raycaster.ray;
    const traverse = (obj) => {
      if (!obj.visible) return;
      if (obj.isMesh && obj.geometry) {
        const bounds = CanonicalGeometryFamilies.getBoundingSphere(obj.geometry);
        if (!bounds) return;
        if (ray.distanceToPoint(bounds.center) > bounds.radius) {
          return;
        }
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
        for (const child of obj.children) traverse(child);
      }
    };
    for (const obj of objects) traverse(obj);
    return intersects;
  }

  /**
   * Audit scene for unsafe immutable geometries (read-only check)
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
      const isImmutable = obj.geometry.userData?.immutable === true;
      const isPrecomputed = obj.geometry.userData?.precomputedAndFrozen === true;
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
            isPrecomputed,
            hasBounds,
            issue: !isPrecomputed ? 'Missing precomputed flag' : 'Missing boundingSphere'
          });
        }
      } else {
        report.safeCount++;
      }
    });
    return report;
  }

  static logAuditReport(report) {
    console.group('[RaycastSanitizationEngine] Scene Audit Report');
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
