/**
 * LINK TARGET CONTRACT 1.0 — FINAL AUTHORITATIVE ARCHITECTURE
 * 
 * ✅ CORE RULE (NON-NEGOTIABLE):
 * Link-state systems are ONLY allowed to operate on ONE explicit object:
 * → node.userData.linkTarget
 * 
 * If linkTarget does not exist → link-state MUST NOT touch the node visually.
 * 
 * This is the SINGLE GATEWAY for all link-state visual mutations.
 */

/**
 * GATEWAY FUNCTION: Get the explicit link-state target for a node
 * 
 * Returns the ONLY object that link-state systems are allowed to mutate.
 * Enforces the immutable contract: no traversal, no implicit assumptions.
 * 
 * @param {THREE.Object3D} node - The node to get link target for
 * @returns {THREE.Object3D|null} The link target (or null if node is immutable)
 */
export function getLinkStateTarget(node) {
  if (!node || !node.userData) return null;
  
  // EXPLICIT CONTRACT: linkTarget is the only mutable object
  const target = node.userData.linkTarget;
  
  if (!target) {
    // Node has no linkTarget → it is visually immutable
    return null;
  }
  
  // Validate target exists and is valid for mutation
  if (target.material === undefined && !target.isMesh && !target.isLine && !target.isGroup) {
    console.warn('[LinkTargetContract] Invalid linkTarget on node:', {
      nodeId: node.uuid,
      hasUserData: !!node.userData,
      targetType: typeof target,
      isObject3D: target instanceof THREE.Object3D
    });
    return null;
  }
  
  return target;
}

/**
 * VALIDATE: Check if an object is protected from link-state mutations
 * 
 * @param {THREE.Object3D} obj - Object to check
 * @returns {boolean} True if object is protected
 */
export function isProtectedFromLinkState(obj) {
  if (!obj || !obj.userData) return false;
  
  return (
    obj.userData.isHologramShell ||
    obj.userData.isAura ||
    obj.userData.isCoreMesh ||
    obj.userData.isNodeRoot ||
    obj.userData.isNonLinkableVisual ||
    obj.userData.isVFX
  );
}

/**
 * SAFE APPLY: Apply link-state visual mutations ONLY to linkTarget
 * 
 * This is the ONLY approved way to modify node visuals in link-state context.
 * 
 * @param {THREE.Object3D} node - Node to modify
 * @param {Function} mutationFn - Function that takes target and applies mutations
 * @returns {boolean} True if mutation was applied, false if node is immutable
 */
export function applyLinkStateMutation(node, mutationFn) {
  const target = getLinkStateTarget(node);
  
  if (!target) {
    // Node is immutable to link-state — operation skipped silently
    return false;
  }
  
  // Check protection flags one more time before mutation
  if (isProtectedFromLinkState(target)) {
    console.warn('[LinkTargetContract] Attempted mutation of protected object:', {
      nodeId: node.uuid,
      targetId: target.uuid
    });
    return false;
  }
  
  try {
    mutationFn(target);
    return true;
  } catch (err) {
    console.error('[LinkTargetContract] Mutation failed:', err.message);
    return false;
  }
}

/**
 * ASSERT: Verify a node has valid linkTarget (for debugging)
 * 
 * @param {THREE.Object3D} node - Node to check
 * @returns {Object} Diagnostic info
 */
export function assertNodeLinkTarget(node) {
  return {
    hasNode: !!node,
    hasUserData: !!node?.userData,
    hasLinkTarget: !!node?.userData?.linkTarget,
    targetId: node?.userData?.linkTarget?.uuid || null,
    targetType: node?.userData?.linkTarget?.type || null,
    isProtected: isProtectedFromLinkState(node?.userData?.linkTarget)
  };
}

/**
 * ASSIGN: Explicitly assign linkTarget to a node (at spawn time)
 * 
 * This MUST be called during node creation to establish the contract.
 * 
 * @param {THREE.Object3D} node - Node being spawned
 * @param {THREE.Object3D} visualTarget - The object to designate as link-state target
 */
export function assignLinkTarget(node, visualTarget) {
  if (!node || !node.userData) {
    console.warn('[LinkTargetContract] Cannot assign linkTarget: node has no userData');
    return;
  }
  
  if (!visualTarget) {
    console.warn('[LinkTargetContract] Cannot assign linkTarget: visualTarget is null');
    return;
  }
  
  node.userData.linkTarget = visualTarget;
}

/**
 * CLEAR: Remove linkTarget (makes node immutable to link-state)
 * 
 * @param {THREE.Object3D} node - Node to clear
 */
export function clearLinkTarget(node) {
  if (node && node.userData) {
    delete node.userData.linkTarget;
  }
}

/**
 * BATCH VERIFY: Check all nodes in scene for linkTarget compliance
 * 
 * @param {THREE.Scene} scene - Scene to audit
 * @returns {Object} Audit report
 */
export function auditLinkTargets(scene) {
  const report = {
    totalNodes: 0,
    withLinkTarget: 0,
    withoutLinkTarget: 0,
    protectedTargets: 0,
    invalidTargets: [],
    timestamp: Date.now()
  };
  
  if (!scene) return report;
  
  scene.traverse((obj) => {
    if (!obj.userData?.isNode) return;
    
    report.totalNodes++;
    
    const target = obj.userData.linkTarget;
    
    if (!target) {
      report.withoutLinkTarget++;
      return;
    }
    
    report.withLinkTarget++;
    
    if (isProtectedFromLinkState(target)) {
      report.protectedTargets++;
    }
    
    // Validate target is still attached to scene
    if (target.parent === null && obj !== target) {
      report.invalidTargets.push({
        nodeId: obj.uuid,
        targetId: target.uuid,
        reason: 'Target detached from hierarchy'
      });
    }
  });
  
  return report;
}

export const LinkTargetContract = {
  getLinkStateTarget,
  isProtectedFromLinkState,
  applyLinkStateMutation,
  assertNodeLinkTarget,
  assignLinkTarget,
  clearLinkTarget,
  auditLinkTargets
};
