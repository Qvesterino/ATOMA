/**
 * AURA BASELINE INVALIDATION FIX v1.0 (Session 52B - Emergency Forensic)
 *
 * PROBLEM:
 * AuraModulationSystem captures baseline aura opacity at node spawn time (HIGH value).
 * When node is linked, applyFinalNodeVisualState() reduces aura opacity to 0.06.
 * BUT the baseline is never updated, so aura modulation restores HIGH opacity.
 *
 * SOLUTION:
 * Invalidate aura baselines after visual state rebinding.
 * Force recapture of baselines with the NEW (clamped) opacity values.
 * This ensures aura animations respect the new visual authority.
 *
 * INTEGRATION:
 * Call invalidateAuraBaseline(node) after applyFinalNodeVisualState(node)
 */

import * as THREE from 'three';

/**
 * Invalidate aura baseline for a node
 * Forces recapture with current (correct) opacity values
 * 
 * @param {THREE.Group} node - Node whose aura baseline should be invalidated
 * @param {AuraModulationSystem} auraModulationSystem - System to update baselines in
 */
export function invalidateAuraBaseline(node, auraModulationSystem) {
  if (!node || !auraModulationSystem) return;

  // Find all aura meshes in node
  node.traverse((child) => {
    if (!child.isMesh) return;

    const isAura = child.userData?.isAura ||
                   child.userData?.visualLayer === 'AURA' ||
                   (child.name && child.name.toLowerCase().includes('aura')) ||
                   (child.name && child.name.toLowerCase().includes('halo'));

    if (isAura && child.material) {
      // Recapture baseline with CURRENT opacity
      // This ensures animations use the new clamped value (0.06) not the old high value (0.5+)
      const baseline = {
        opacity: child.material.opacity,  // NOW 0.06, not 0.5
        scale: child.scale.clone(),
        color: child.material.color?.clone() ?? new THREE.Color(0xffffff),
        emissive: child.material.emissive?.clone() ?? new THREE.Color(0x000000),
      };

      // Update baseline in AuraModulationSystem
      if (auraModulationSystem.baselineMap && typeof auraModulationSystem.baselineMap.set === 'function') {
        auraModulationSystem.baselineMap.set(child, baseline);
      }
    }
  });
}

/**
 * CRITICAL: Patch NodeVisualStateBinder to automatically invalidate baselines
 * This ensures the fix is applied transparently without requiring code changes elsewhere
 * 
 * @param {Function} originalApplyFinalNodeVisualState - Original function
 * @param {AuraModulationSystem} auraModulationSystem - System to invalidate baselines in
 * @returns {Function} Patched function
 */
export function createBaselineInvalidatingWrapper(
  originalApplyFinalNodeVisualState,
  auraModulationSystem
) {
  return function patchedApplyFinalNodeVisualState(node, options = {}) {
    // Call original function first
    const result = originalApplyFinalNodeVisualState(node, options);

    // CRITICAL FIX: Invalidate aura baseline AFTER visual state is applied
    // This forces recapture with the new clamped opacity
    if (result && auraModulationSystem) {
      try {
        invalidateAuraBaseline(node, auraModulationSystem);
      } catch (err) {
        console.warn('[AuraBaselineInvalidationFix] Failed to invalidate baseline:', err.message);
        // Non-fatal - continue anyway
      }
    }

    return result;
  };
}

/**
 * EMERGENCY: Repair all nodes that have stale baselines
 * Call this if you detect nodes with mismatched opacity
 * 
 * @param {THREE.Scene} scene - Scene to scan
 * @param {AuraModulationSystem} auraModulationSystem - System to repair baselines in
 * @returns {number} Count of nodes repaired
 */
export function repairAllStaleBaselines(scene, auraModulationSystem) {
  if (!scene || !auraModulationSystem) return 0;

  let repaired = 0;

  scene.traverse((obj) => {
    if (!obj.userData?.isNodeRoot && !obj.userData?.category) return;

    try {
      invalidateAuraBaseline(obj, auraModulationSystem);
      repaired++;
    } catch (err) {
      // Silent continue
    }
  });

  return repaired;
}

export default {
  invalidateAuraBaseline,
  createBaselineInvalidatingWrapper,
  repairAllStaleBaselines,
};
