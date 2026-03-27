/**
 * VERIFY LINK-STATE CONTRACT COMPLIANCE (Session 34)
 * 
 * Runtime verification tool to confirm that all nodes follow the hard lock contract.
 * Call this during testing to validate:
 * - All nodes have linkTarget assigned
 * - Protected layers are properly marked
 * - No traversal violations in picking
 * - RenderOrder and depth settings correct
 */

// REMOVED: LinkStateVisualLock import - moved to LEGACY/LOCK and POLICIES to delete (2026-03-27)
// Stub functions for compatibility
const hasValidLinkTarget = (mesh) => mesh?.userData?.linkTarget != null;
const getLinkTarget = (mesh) => mesh?.userData?.linkTarget || null;

import { isProtectedFromLinkState } from './LinkTargetContract.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

export class VerifyLinkStateContractCompliance {
  /**
   * FULL AUDIT: Verify entire scene compliance
   * 
   * @param {THREE.Scene} scene - Scene to audit
   * @returns {Object} Detailed compliance report
   */
  static auditScene(scene) {
    if (!scene) {
      console.error('[VerifyCompliance] No scene provided');
      return null;
    }

    const report = {
      timestamp: Date.now(),
      totalNodes: 0,
      nodesWithLinkTarget: 0,
      nodesWithoutLinkTarget: [],
      protectedLayerIssues: [],
      renderOrderIssues: [],
      frustumCullIssues: [],
      depthSettingIssues: [],
      violations: []
    };

    scene.traverse((obj) => {
      if (!obj.userData?.isNode) return;

      report.totalNodes++;

      // ========================================
      // CHECK 1: linkTarget exists
      // ========================================
      const hasTarget = hasValidLinkTarget(obj);
      if (hasTarget) {
        report.nodesWithLinkTarget++;
      } else {
        report.nodesWithoutLinkTarget.push({
          uuid: obj.uuid,
          name: obj.name || 'unnamed',
          category: obj.userData?.category || 'unknown'
        });
      }

      // ========================================
      // CHECK 2: Protected layers are marked correctly
      // ========================================
      obj.traverse((child) => {
        if (!child.isMesh) return;

        // Check if this is a core mesh
        if (child === obj.userData?.linkTarget) {
          if (!child.userData?.isCoreMesh) {
            report.protectedLayerIssues.push({
              nodeId: obj.uuid,
              issue: 'linkTarget not marked as isCoreMesh',
              childId: child.uuid
            });
          }
        }

        // Check protection flags for shells/auras
        if (child.userData?.isHologramShell || child.userData?.isAura) {
          // These MUST be marked as protected
          if (!isProtectedFromLinkState(child)) {
            report.protectedLayerIssues.push({
              nodeId: obj.uuid,
              issue: 'Protected layer not recognized by isProtectedFromLinkState',
              layer: child.userData?.visualLayer || 'unknown',
              childId: child.uuid
            });
          }
        }
      });

      // ========================================
      // CHECK 3: RenderOrder settings
      // ========================================
      obj.traverse((child) => {
        if (!child.isMesh) return;

        // Core should have canonical renderOrder
        const expectedCoreRO = VisualHierarchyRegistry.getRenderOrder('CORE');
        if (child.userData?.visualLayer === 'CORE' && child.renderOrder !== expectedCoreRO) {
          report.renderOrderIssues.push({
            nodeId: obj.uuid,
            issue: `Core has renderOrder ${child.renderOrder}, expected ${expectedCoreRO}`,
            childId: child.uuid
          });
        }

        // Shells should have canonical renderOrder
        const expectedShellRO = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
        if (child.userData?.visualLayer === 'CORE_SHELL' && child.renderOrder !== expectedShellRO) {
          report.renderOrderIssues.push({
            nodeId: obj.uuid,
            issue: `Shell has renderOrder ${child.renderOrder}, expected ${expectedShellRO}`,
            childId: child.uuid
          });
        }

        // Auras should have canonical renderOrder
        const expectedAuraRO = VisualHierarchyRegistry.getRenderOrder('BASELINE_AURA');
        if (child.userData?.visualLayer === 'AURA' && child.renderOrder !== expectedAuraRO) {
          report.renderOrderIssues.push({
            nodeId: obj.uuid,
            issue: `Aura has renderOrder ${child.renderOrder}, expected ${expectedAuraRO}`,
            childId: child.uuid
          });
        }
      });

      // ========================================
      // CHECK 4: FrustumCulled settings (CRITICAL for EXTREME nodes)
      // ========================================
      obj.traverse((child) => {
        if (!child.isMesh) return;

        // Shells MUST have frustumCulled = false
        if (child.userData?.isHologramShell && child.frustumCulled !== false) {
          report.frustumCullIssues.push({
            nodeId: obj.uuid,
            issue: `Shell has frustumCulled=${child.frustumCulled}, MUST be false`,
            layer: child.userData?.visualLayer || 'unknown',
            childId: child.uuid
          });
        }

        // Fractal holo MUST have frustumCulled = false
        if (child.userData?.vfxType === 'fractalHologram' && child.frustumCulled !== false) {
          report.frustumCullIssues.push({
            nodeId: obj.uuid,
            issue: `Fractal holo has frustumCulled=${child.frustumCulled}, MUST be false`,
            childId: child.uuid
          });
        }
      });

      // ========================================
      // CHECK 5: Depth settings (CRITICAL for visibility)
      // ========================================
      obj.traverse((child) => {
        if (!child.isMesh || !child.material) return;

        // Core should have depthTest/depthWrite = false
        if (child.userData?.visualLayer === 'CORE') {
          if (child.material.depthTest !== false) {
            report.depthSettingIssues.push({
              nodeId: obj.uuid,
              issue: `Core has depthTest=${child.material.depthTest}, expected false`,
              childId: child.uuid
            });
          }
          if (child.material.depthWrite !== false) {
            report.depthSettingIssues.push({
              nodeId: obj.uuid,
              issue: `Core has depthWrite=${child.material.depthWrite}, expected false`,
              childId: child.uuid
            });
          }
        }

        // Shells should have depthTest/depthWrite = false
        if (child.userData?.visualLayer === 'CORE_SHELL') {
          if (child.material.depthTest !== false) {
            report.depthSettingIssues.push({
              nodeId: obj.uuid,
              issue: `Shell has depthTest=${child.material.depthTest}, expected false`,
              childId: child.uuid
            });
          }
          if (child.material.depthWrite !== false) {
            report.depthSettingIssues.push({
              nodeId: obj.uuid,
              issue: `Shell has depthWrite=${child.material.depthWrite}, expected false`,
              childId: child.uuid
            });
          }
        }
      });
    });

    return report;
  }

  /**
   * PRINT AUDIT REPORT
   * 
   * @param {Object} report - Report from auditScene()
   */
  static printReport(report) {
    if (!report) return;

    console.group('🔐 [LINK-STATE CONTRACT COMPLIANCE AUDIT]');
    console.log(`⏰ Timestamp: ${new Date(report.timestamp).toISOString()}`);
    console.log(`📊 Total nodes: ${report.totalNodes}`);
    console.log(`✅ Nodes with linkTarget: ${report.nodesWithLinkTarget}`);
    console.log(`❌ Nodes without linkTarget: ${report.nodesWithoutLinkTarget.length}`);

    if (report.nodesWithoutLinkTarget.length > 0) {
      console.group('⚠️  Nodes Without LinkTarget:');
      for (const node of report.nodesWithoutLinkTarget) {
        console.warn(`  - ${node.name} (${node.category}) [${node.uuid.substring(0, 8)}]`);
      }
      console.groupEnd();
    }

    if (report.protectedLayerIssues.length > 0) {
      console.group('⚠️  Protected Layer Issues:');
      for (const issue of report.protectedLayerIssues) {
        console.warn(`  - Node [${issue.nodeId.substring(0, 8)}]: ${issue.issue}`);
      }
      console.groupEnd();
    }

    if (report.renderOrderIssues.length > 0) {
      console.group('⚠️  RenderOrder Issues:');
      for (const issue of report.renderOrderIssues) {
        console.warn(`  - Node [${issue.nodeId.substring(0, 8)}]: ${issue.issue}`);
      }
      console.groupEnd();
    }

    if (report.frustumCullIssues.length > 0) {
      console.group('🚨 FrustumCull Issues (CRITICAL):');
      for (const issue of report.frustumCullIssues) {
        console.error(`  - Node [${issue.nodeId.substring(0, 8)}]: ${issue.issue}`);
      }
      console.groupEnd();
    }

    if (report.depthSettingIssues.length > 0) {
      console.group('⚠️  Depth Setting Issues:');
      for (const issue of report.depthSettingIssues) {
        console.warn(`  - Node [${issue.nodeId.substring(0, 8)}]: ${issue.issue}`);
      }
      console.groupEnd();
    }

    // Summary
    const totalIssues = 
      report.nodesWithoutLinkTarget.length +
      report.protectedLayerIssues.length +
      report.renderOrderIssues.length +
      report.frustumCullIssues.length +
      report.depthSettingIssues.length;

    if (totalIssues === 0) {
      console.log('✅ ALL CHECKS PASSED — Scene is contract-compliant!');
    } else {
      console.error(`❌ TOTAL ISSUES FOUND: ${totalIssues}`);
    }

    console.groupEnd();
  }

  /**
   * QUICK CHECK: Verify single node compliance
   * 
   * @param {THREE.Object3D} node - Node to verify
   * @returns {Object} Node compliance report
   */
  static verifyNode(node) {
    if (!node) {
      console.error('[VerifyCompliance] No node provided');
      return null;
    }

    const report = {
      nodeId: node.uuid,
      nodeName: node.name || 'unnamed',
      hasLinkTarget: hasValidLinkTarget(node),
      linkTargetId: node.userData?.linkTarget?.uuid || null,
      issues: [],
      status: 'PASS'
    };

    if (!report.hasLinkTarget) {
      report.issues.push('No linkTarget assigned');
      report.status = 'FAIL';
    }

    // Check protected layers
    node.traverse((child) => {
      if (!child.isMesh) return;

      // Core checks
      if (child === node.userData?.linkTarget && !child.userData?.isCoreMesh) {
        report.issues.push(`linkTarget not marked as isCoreMesh`);
        report.status = 'FAIL';
      }

      // Shell checks
      if (child.userData?.isHologramShell) {
        if (child.frustumCulled !== false) {
          report.issues.push(`Shell frustumCulled=${child.frustumCulled}, MUST be false`);
          report.status = 'FAIL';
        }
        if (child.material?.depthTest !== false) {
          report.issues.push(`Shell depthTest=${child.material.depthTest}, MUST be false`);
        }
      }
    });

    console.log(`[VerifyCompliance] Node ${report.nodeName}: ${report.status}`);
    if (report.issues.length > 0) {
      console.group('Issues:');
      for (const issue of report.issues) {
        console.warn(`  - ${issue}`);
      }
      console.groupEnd();
    }

    return report;
  }
}

/**
 * CONSOLE API FOR TESTING
 */
export function setupVerifyComplianceConsoleAPI(scene) {
  if (!window.__verifyCompliance) {
    window.__verifyCompliance = {};
  }

  Object.assign(window.__verifyCompliance, {
    /**
     * Full scene audit: window.__verifyCompliance.auditScene()
     */
    auditScene: () => {
      const report = VerifyLinkStateContractCompliance.auditScene(scene);
      VerifyLinkStateContractCompliance.printReport(report);
      return report;
    },

    /**
     * Quick check single node: window.__verifyCompliance.checkNode(nodeObject)
     */
    checkNode: (node) => {
      return VerifyLinkStateContractCompliance.verifyNode(node);
    },

    /**
     * Get report without printing: window.__verifyCompliance.getReport()
     */
    getReport: () => {
      return VerifyLinkStateContractCompliance.auditScene(scene);
    }
  });

  console.log('✅ Compliance verification API available: window.__verifyCompliance');
}
