/**
 * LINK STATE VISUAL LOCK 1.0 — ABSOLUTE HARD CONTRACT
 * 
 * Enforcement system that prevents ANY link-state mutation outside linkTarget.
 * 
 * CORE RULE (NON-NEGOTIABLE):
 * - If node.userData.linkTarget does NOT exist → link-state MUST NOT mutate visuals
 * - All mutations must go through linkTarget ONLY
 * - No traversal, no fallbacks, no guessing
 */

/**
 * ABSOLUTE GATEWAY: Check linkTarget exists (MUST PASS or exit)
 * 
 * @param {THREE.Object3D} node - Node to check
 * @returns {boolean} True if node has valid linkTarget
 */
export function hasValidLinkTarget(node) {
  return !!(node && node.userData && node.userData.linkTarget);
}

/**
 * GET LINK TARGET: Returns target or null (never throws)
 * 
 * @param {THREE.Object3D} node - Node to get target for
 * @returns {THREE.Object3D|null} Link target or null
 */
export function getLinkTarget(node) {
  if (!node || !node.userData) return null;
  return node.userData.linkTarget || null;
}

/**
 * SILENT ABORT PATTERN: Use in all link-state mutations
 * 
 * Example:
 * const linkTarget = getLinkTarget(node);
 * if (!linkTarget) return;  // ← SILENT ABORT (no logging, no fallback)
 * linkTarget.material.opacity = 0.5;
 */

/**
 * ABSOLUTE LOCK: Verify NO node-root mutations occur
 * Call this in testing/debugging to verify compliance
 * 
 * @param {THREE.Object3D} node - Node to verify
 * @returns {Object} Violation report
 */
export function detectNodeRootMutationViolations(node) {
  const violations = [];

  // Check direct mutations on node
  if (node._linkStateModified) {
    violations.push('node._linkStateModified flag set (indicates direct mutation attempt)');
  }

  // Check node.children mutations
  if (node._childrenMutated) {
    violations.push('node.children array was traversed/mutated');
  }

  // Check node visibility mutations
  if (node._visibilityChanged) {
    violations.push('node.visible was modified');
  }

  // Check node scale mutations
  if (node._scaleChanged) {
    violations.push('node.scale was modified');
  }

  return violations;
}

/**
 * ENFORCEMENT: Lock down linkTarget mutations only
 * Apply this at runtime to catch violations
 */
export function enforceAbsoluteLinkTargetLock(node) {
  if (!node || !node.userData) return;

  const linkTarget = node.userData.linkTarget;

  // If no linkTarget exists, make node IMMUTABLE to link-state
  if (!linkTarget) {
    // Mark as immutable
    node.userData._immutableToLinkState = true;
    // Do NOT define linkTarget fallback or it becomes a violation
    return;
  }

  // Only linkTarget is allowed to be mutated
  // Verify linkTarget has no circular references
  if (linkTarget === node) {
    console.error('[LinkStateVisualLock] VIOLATION: linkTarget cannot be the node itself!');
    node.userData.linkTarget = null;  // DISABLE
  }
}

/**
 * AUDIT: Verify all nodes in scene comply with contract
 * 
 * @param {THREE.Scene} scene - Scene to audit
 * @returns {Object} Audit report
 */
export function auditLinkTargetCompliance(scene) {
  const report = {
    totalNodes: 0,
    nodesWithLinkTarget: 0,
    nodesWithoutLinkTarget: 0,
    immutableNodes: 0,
    violations: [],
    timestamp: Date.now()
  };

  if (!scene) return report;

  scene.traverse((obj) => {
    if (!obj.userData || !obj.userData.isNode) return;

    report.totalNodes++;

    const hasTarget = !!obj.userData.linkTarget;
    if (hasTarget) {
      report.nodesWithLinkTarget++;
    } else {
      report.nodesWithoutLinkTarget++;
      if (obj.userData._immutableToLinkState) {
        report.immutableNodes++;
      }
    }

    const violations = detectNodeRootMutationViolations(obj);
    if (violations.length > 0) {
      report.violations.push({
        nodeId: obj.uuid,
        category: obj.userData.category || 'unknown',
        issues: violations
      });
    }
  });

  return report;
}

/**
 * PRINT COMPLIANCE REPORT
 */
export function printComplianceReport(report) {
  console.group('[LinkStateVisualLock] COMPLIANCE AUDIT');
  console.log(`Total nodes: ${report.totalNodes}`);
  console.log(`With linkTarget: ${report.nodesWithLinkTarget}`);
  console.log(`Without linkTarget: ${report.nodesWithoutLinkTarget}`);
  console.log(`Immutable (no linkTarget, no mutations): ${report.immutableNodes}`);
  console.log(`Violations detected: ${report.violations.length}`);

  if (report.violations.length > 0) {
    console.group('VIOLATIONS:');
    for (const v of report.violations) {
      console.log(`  Node ${v.nodeId.substring(0, 8)} (${v.category}):`);
      for (const issue of v.issues) {
        console.warn(`    - ${issue}`);
      }
    }
    console.groupEnd();
  }

  console.groupEnd();
}

export const LinkStateVisualLock = {
  hasValidLinkTarget,
  getLinkTarget,
  detectNodeRootMutationViolations,
  enforceAbsoluteLinkTargetLock,
  auditLinkTargetCompliance,
  printComplianceReport
};
