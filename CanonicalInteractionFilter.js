/**
 * CANONICAL INTERACTION FILTER v1.0
 * 
 * Single source of truth for filtering raycast intersections.
 * Ensures ONLY interactive objects pass through all selection logic.
 * 
 * PRINCIPLE: One filter, applied everywhere, no exceptions.
 * 
 * This is the authoritative filter used by:
 * - Node selection
 * - Node linking
 * - Crosshair targeting
 * - Any raycaster.intersectObjects() result
 * 
 * SAFETY:
 * ✅ Pure function (no side effects)
 * ✅ Defensive checks (handles null/undefined)
 * ✅ Deterministic (same input → same output always)
 * ✅ Non-breaking (only adds filtering, no logic changes)
 */

import * as THREE from 'three';

/**
 * Check if an intersection object is interactive (not visual-only)
 * 
 * @param {THREE.Object3D} obj - Object to check
 * @returns {boolean} true if object is interactive, false if visual-only
 */
export function isInteractiveObject(obj) {
  // Defensive: ensure object exists
  if (!obj) return false;

  // Check for explicit interactive marker
  if (obj.userData?.interactive === true) {
    // But confirm it's not marked non-interactive
    if (obj.userData?.nonInteractive === true) {
      return false;
    }
    return true;
  }

  // Inverse check: reject if marked as visual-only
  if (obj.userData?.nonInteractive === true ||
      obj.userData?.isAura === true ||
      obj.userData?.isShell === true ||
      obj.userData?.isHologramShell === true ||
      obj.userData?.isFX === true ||
      obj.userData?.isParticle === true ||
      obj.userData?.isEffect === true ||
      obj.userData?.isGlyph === true ||
      obj.userData?.isLinkVisual === true ||
      obj.userData?.isLinkGlow === true ||
      obj.userData?.isNeuralCurve === true ||
      obj.userData?.isHarmonyField === true ||
      obj.userData?.isIntegrationField === true ||
      obj.userData?.visualLayer === 'AURA' ||
      obj.userData?.visualLayer === 'SHELL' ||
      obj.userData?.visualLayer === 'VISUAL_ONLY') {
    return false;
  }

  // Material-based detection (fallback)
  const material = obj.material;
  if (material && 
      material.transparent === true &&
      material.blending === THREE.AdditiveBlending &&
      material.depthWrite === false) {
    // Likely visual-only
    return false;
  }

  // Default: accept if no negative markers
  return true;
}

/**
 * Filter raycaster intersection results to only include interactive objects
 * 
 * USAGE:
 *   let intersections = raycaster.intersectObjects(scene.children, true);
 *   intersections = filterRaycastIntersections(intersections);
 * 
 * @param {THREE.Intersection[]} intersections - Raw raycaster results
 * @returns {THREE.Intersection[]} Filtered intersections (interactive only)
 */
export function filterRaycastIntersections(intersections) {
  if (!intersections || !Array.isArray(intersections)) {
    return [];
  }

  return intersections.filter(intersection => {
    return isInteractiveObject(intersection.object);
  });
}

/**
 * Get the first interactive intersection (highest priority hit)
 * 
 * USAGE:
 *   const hit = getFirstInteractiveIntersection(raycaster.intersectObjects(...));
 *   if (hit) selectNode(hit.object);
 * 
 * @param {THREE.Intersection[]} intersections - Raw raycaster results
 * @returns {THREE.Intersection|null} First interactive intersection or null
 */
export function getFirstInteractiveIntersection(intersections) {
  const filtered = filterRaycastIntersections(intersections);
  return filtered.length > 0 ? filtered[0] : null;
}

/**
 * Check if an intersection is interactive
 * 
 * @param {THREE.Intersection} intersection - Single intersection
 * @returns {boolean} true if interactive
 */
export function isInteractiveIntersection(intersection) {
  return intersection && isInteractiveObject(intersection.object);
}

/**
 * Get all interactive intersections
 * 
 * @param {THREE.Intersection[]} intersections - Raw raycaster results
 * @returns {THREE.Intersection[]} All interactive intersections
 */
export function getInteractiveIntersections(intersections) {
  return filterRaycastIntersections(intersections);
}

/**
 * Runtime assertion: check if object has valid raycast function
 * Call this in dev mode only
 * 
 * @param {THREE.Object3D} obj - Object to check
 * @returns {boolean} true if valid, logs error if not
 */
export function assertValidRaycast(obj) {
  if (!obj) return true;  // Null is acceptable

  if (typeof obj.raycast !== 'function') {
    console.error(
      '[RAYCAST INTEGRITY ERROR] Object missing valid raycast function',
      {
        name: obj.name,
        type: obj.constructor.name,
        raycast: obj.raycast,
        uuid: obj.uuid
      }
    );
    return false;
  }

  return true;
}

/**
 * Validate all objects in array have valid raycast functions (dev mode)
 * 
 * @param {THREE.Object3D[]} objects - Objects to validate
 * @returns {boolean} true if all valid
 */
export function assertValidRaycastBatch(objects) {
  if (!objects || !Array.isArray(objects)) return true;

  let allValid = true;
  for (const obj of objects) {
    if (!assertValidRaycast(obj)) {
      allValid = false;
    }
  }
  return allValid;
}

// ============================================================================
// EXPORT HELPERS OBJECT FOR CONVENIENCE
// ============================================================================

export const InteractionFilter = {
  isInteractive: isInteractiveObject,
  filter: filterRaycastIntersections,
  getFirst: getFirstInteractiveIntersection,
  getAll: getInteractiveIntersections,
  isHit: isInteractiveIntersection,
  assert: assertValidRaycast,
  assertBatch: assertValidRaycastBatch
};

// ============================================================================
// GLOBAL API (Optional - for console debugging)
// ============================================================================

if (typeof window !== 'undefined') {
  window.CanonicalInteractionFilter = {
    isInteractive: isInteractiveObject,
    filter: filterRaycastIntersections,
    getFirst: getFirstInteractiveIntersection,
    getAll: getInteractiveIntersections,

    // Quick test
    test() {
      console.log('[CanonicalInteractionFilter] Filter function available');
      return {
        isInteractive: typeof isInteractiveObject === 'function',
        filter: typeof filterRaycastIntersections === 'function',
        getFirst: typeof getFirstInteractiveIntersection === 'function'
      };
    }
  };

  console.log('[CanonicalInteractionFilter] Global API initialized: window.CanonicalInteractionFilter');
}
