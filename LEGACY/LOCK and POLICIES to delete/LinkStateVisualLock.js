/**
 * LINK STATE VISUAL LOCK 1.0 — ABSOLUTE HARD CONTRACT
 * 
 * Enforcement system that prevents ANY link-state mutation outside linkTarget.
 * 
 * CORE RULE (NON-NEGOTIABLE):
 * - If node.userData.linkTarget does NOT exist → link-state MUST NOT mutate visuals
 * - All mutations must go through linkTarget ONLY
 * - No traversal, no fallbacks, no guessing
 * 
 * ⚠️ DEACTIVATED: 2026-03-04 - Link State Visual Lock disabled by user request
 * All functions now bypass restrictions.
 */

/**
 * ABSOLUTE GATEWAY: Check linkTarget exists (MUST PASS or exit)
 * 
 * @param {THREE.Object3D} node - Node to check
 * @returns {boolean} True if node has valid linkTarget
 */
export function hasValidLinkTarget(node) {
  // DEACTIVATED: Always return true to bypass restrictions
  return true;
}

/**
 * GET LINK TARGET: Returns target or null (never throws)
 * 
 * @param {THREE.Object3D} node - Node to get target for
 * @returns {THREE.Object3D|null} Link target or null
 */
export function getLinkTarget(node) {
  // DEACTIVATED: Return node directly to bypass linkTarget check
  if (!node || !node.userData) return node || null;
  return node.userData.linkTarget || node || null;
}

/**
 * SILENT ABORT PATTERN: Use in all link-state mutations
 * 
 * Example:
 * const linkTarget = getLinkTarget(node);
 * if (!linkTarget) return;  // ← SILENT ABORT (no logging, no fallback)
 * linkTarget.material.opacity = 0.5;
 * 
 * NOTE: Since lock is deactivated, getLinkTarget will always return a value,
 * so silent abort pattern will never trigger.
 */

/**
 * ABSOLUTE LOCK: Verify NO node-root mutations occur
 * Call this in testing/debugging to verify compliance
 * 
 * @param {THREE.Object3D} node - Node to verify
 * @returns {Object} Violation report
 */
export function detectNodeRootMutationViolations(node) {
  // DEACTIVATED: No violations detected
  return [];
}

/**
 * ENFORCEMENT: Lock down linkTarget mutations only
 * Apply this at runtime to catch violations
 */
export function enforceAbsoluteLinkTargetLock(node) {
  // DEACTIVATED: No enforcement performed
  return;
}

/**
 * AUDIT: Verify all nodes in scene comply with contract
 * 
 * @param {THREE.Scene} scene - Scene to audit
 * @returns {Object} Audit report
 */
export function auditLinkTargetCompliance(scene) {
  // DEACTIVATED: Always return clean report
  return {
    totalNodes: 0,
    nodesWithLinkTarget: 0,
    nodesWithoutLinkTarget: 0,
    immutableNodes: 0,
    violations: [],
    timestamp: Date.now(),
    deactivated: true
  };
}

/**
 * PRINT COMPLIANCE REPORT
 */
export function printComplianceReport(report) {
  console.log('[LinkStateVisualLock] DEACTIVATED - No compliance checks performed');
}

export const LinkStateVisualLock = {
  hasValidLinkTarget,
  getLinkTarget,
  detectNodeRootMutationViolations,
  enforceAbsoluteLinkTargetLock,
  auditLinkTargetCompliance,
  printComplianceReport,
  deactivated: true
};