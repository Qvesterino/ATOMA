import * as THREE from 'three';

/**
 * NODE CATEGORY AUDIT SYSTEM - Session 32
 * 
 * Comprehensive visual anomaly detection and reporting
 * Audits all node types for consistency, integrity, and compliance
 * 
 * Usage:
 *   const audit = new NodeCategoryAudit(scene);
 *   const report = audit.auditAllNodes();
 *   console.log(report);
 */
export class NodeCategoryAudit {
  constructor(scene) {
    this.scene = scene;
    this.report = {
      timestamp: new Date().toISOString(),
      totalNodesAudited: 0,
      anomaliesFound: 0,
      anomaliesByCategory: {},
      detailedIssues: [],
      categoryStats: {}
    };
  }

  /**
   * Main audit entry point
   * Traverses all nodes and performs comprehensive checks
   */
  auditAllNodes() {
    this.report.detailedIssues = [];
    this.report.anomaliesFound = 0;
    this.report.anomaliesByCategory = {};
    this.report.categoryStats = {};

    const nodesToAudit = [];
    this.scene.traverse((child) => {
      if (child.userData && child.userData.nodeId) {
        nodesToAudit.push(child);
      }
    });

    this.report.totalNodesAudited = nodesToAudit.length;

    nodesToAudit.forEach(node => {
      this.auditNode(node);
    });

    return this.report;
  }

  /**
   * Audit a single node for all visual anomalies
   */
  auditNode(node) {
    const nodeId = node.userData.nodeId;
    const category = node.userData.category || 'unknown';
    const color = node.userData.color || 0x00ffff;

    // Initialize category stats
    if (!this.report.categoryStats[category]) {
      this.report.categoryStats[category] = {
        total: 0,
        healthy: 0,
        anomalous: 0,
        issues: []
      };
    }
    this.report.categoryStats[category].total++;

    const issues = [];

    // Check 1: Node Root Container
    issues.push(...this.checkNodeRootContainer(node, nodeId, category));

    // Check 2: Core Mesh Integrity
    issues.push(...this.checkCoreMesh(node, nodeId, category));

    // Check 3: Hologram Shell Integrity
    issues.push(...this.checkHologramShell(node, nodeId, category));

    // Check 4: Render Order Hierarchy
    issues.push(...this.checkRenderOrderHierarchy(node, nodeId, category));

    // Check 5: Material Properties
    issues.push(...this.checkMaterialProperties(node, nodeId, category));

    // Check 6: Frustum Culling
    issues.push(...this.checkFrustumCulling(node, nodeId, category));

    // Check 7: Visual Layer Markers
    issues.push(...this.checkVisualLayerMarkers(node, nodeId, category));

    // Check 8: Aura System
    issues.push(...this.checkAuraSystem(node, nodeId, category));

    // Check 9: Link System
    issues.push(...this.checkLinkSystem(node, nodeId, category));

    // Check 10: Category-Specific Checks
    issues.push(...this.checkCategorySpecific(node, nodeId, category));

    // Record issues
    if (issues.length > 0) {
      this.report.anomaliesFound += issues.length;
      if (!this.report.anomaliesByCategory[category]) {
        this.report.anomaliesByCategory[category] = [];
      }
      this.report.anomaliesByCategory[category].push({
        nodeId,
        issues
      });
      this.report.categoryStats[category].anomalous++;
      this.report.categoryStats[category].issues.push(...issues);
      this.report.detailedIssues.push(...issues.map(issue => ({
        nodeId,
        category,
        ...issue
      })));
    } else {
      this.report.categoryStats[category].healthy++;
    }
  }

  /**
   * Check 1: Node Root Container
   */
  checkNodeRootContainer(node, nodeId, category) {
    const issues = [];

    // Verify nodeRoot exists
    if (!node.userData.nodeRoot) {
      issues.push({
        severity: 'CRITICAL',
        type: 'MISSING_NODE_ROOT',
        description: 'Node root container not found',
        suggestion: 'Re-create node or initialize nodeRoot'
      });
      return issues;
    }

    const nodeRoot = node.userData.nodeRoot;

    // Verify nodeRoot is a Group
    if (!(nodeRoot instanceof THREE.Group)) {
      issues.push({
        severity: 'CRITICAL',
        type: 'INVALID_NODE_ROOT_TYPE',
        description: 'nodeRoot is not a THREE.Group',
        actual: nodeRoot.constructor.name,
        suggestion: 'Replace with valid THREE.Group'
      });
    }

    // Verify nodeRoot is marked
    if (nodeRoot.userData.isNodeRoot !== true) {
      issues.push({
        severity: 'HIGH',
        type: 'UNMARKED_NODE_ROOT',
        description: 'nodeRoot not marked with isNodeRoot flag',
        suggestion: 'Set nodeRoot.userData.isNodeRoot = true'
      });
    }

    return issues;
  }

  /**
   * Check 2: Core Mesh Integrity
   */
  checkCoreMesh(node, nodeId, category) {
    const issues = [];
    const nodeRoot = node.userData.nodeRoot || node;

    // Find core mesh
    const coreMesh = nodeRoot.children.find(child =>
      child.isMesh && child.userData.visualLayer === 'CORE'
    );

    if (!coreMesh) {
      issues.push({
        severity: 'CRITICAL',
        type: 'MISSING_CORE_MESH',
        description: 'Core identity mesh not found',
        suggestion: 'Re-create core mesh with visualLayer: "CORE"'
      });
      return issues;
    }

    // Check core mesh properties
    if (!coreMesh.geometry) {
      issues.push({
        severity: 'CRITICAL',
        type: 'CORE_MESH_NO_GEOMETRY',
        description: 'Core mesh has no geometry',
        suggestion: 'Assign valid THREE.BufferGeometry'
      });
    }

    if (!coreMesh.material) {
      issues.push({
        severity: 'CRITICAL',
        type: 'CORE_MESH_NO_MATERIAL',
        description: 'Core mesh has no material',
        suggestion: 'Assign valid THREE.Material'
      });
    }

    // Check frustum culling
    if (coreMesh.frustumCulled !== false) {
      issues.push({
        severity: 'MEDIUM',
        type: 'CORE_MESH_FRUSTUM_CULL_ENABLED',
        description: 'Core mesh frustum culling is enabled',
        actual: coreMesh.frustumCulled,
        suggestion: 'Set coreMesh.frustumCulled = false'
      });
    }

    return issues;
  }

  /**
   * Check 3: Hologram Shell Integrity
   */
  checkHologramShell(node, nodeId, category) {
    const issues = [];
    const nodeRoot = node.userData.nodeRoot || node;

    // Find hologram shell
    const holoShell = nodeRoot.children.find(child =>
      child.isMesh && child.userData.isHologramShell === true
    );

    if (!holoShell) {
      issues.push({
        severity: 'CRITICAL',
        type: 'MISSING_HOLOGRAM_SHELL',
        description: 'Hologram shell not found',
        suggestion: 'Re-create hologram shell via createNodeHologramShell()'
      });
      return issues;
    }

    // Check hologram shell properties
    if (!holoShell.geometry) {
      issues.push({
        severity: 'CRITICAL',
        type: 'HOLOGRAM_SHELL_NO_GEOMETRY',
        description: 'Hologram shell has no geometry',
        suggestion: 'Ensure createNodeHologramShell() assigns geometry'
      });
    }

    if (!holoShell.material) {
      issues.push({
        severity: 'CRITICAL',
        type: 'HOLOGRAM_SHELL_NO_MATERIAL',
        description: 'Hologram shell has no material',
        suggestion: 'Ensure createNodeHologramShell() creates material'
      });
    }

    // Verify it's a shader material
    if (holoShell.material && !holoShell.material.isShaderMaterial) {
      issues.push({
        severity: 'HIGH',
        type: 'HOLOGRAM_SHELL_WRONG_MATERIAL_TYPE',
        description: 'Hologram shell material is not ShaderMaterial',
        actual: holoShell.material.constructor.name,
        suggestion: 'Use createHologramShellMaterial() for material creation'
      });
    }

    return issues;
  }

  /**
   * Check 4: Render Order Hierarchy
   */
  checkRenderOrderHierarchy(node, nodeId, category) {
    const issues = [];
    const nodeRoot = node.userData.nodeRoot || node;

    const coreMesh = nodeRoot.children.find(child =>
      child.isMesh && child.userData.visualLayer === 'CORE'
    );
    const holoShell = nodeRoot.children.find(child =>
      child.isMesh && child.userData.isHologramShell === true
    );

    // Check core mesh render order
    if (coreMesh && coreMesh.renderOrder !== 0) {
      issues.push({
        severity: 'MEDIUM',
        type: 'CORE_MESH_WRONG_RENDER_ORDER',
        description: 'Core mesh renderOrder is not 0',
        actual: coreMesh.renderOrder,
        expected: 0,
        suggestion: 'Set coreMesh.renderOrder = 0'
      });
    }

    // Check hologram shell render order
    if (holoShell && holoShell.renderOrder !== 5) {
      issues.push({
        severity: 'HIGH',
        type: 'HOLOGRAM_SHELL_WRONG_RENDER_ORDER',
        description: 'Hologram shell renderOrder is not 5',
        actual: holoShell.renderOrder,
        expected: 5,
        suggestion: 'Set holoShell.renderOrder = 5'
      });
    }

    // Check aura render order (if present)
    const aura = nodeRoot.children.find(child =>
      child.userData && child.userData.isAura === true
    );
    if (aura && aura.renderOrder !== 10) {
      issues.push({
        severity: 'MEDIUM',
        type: 'AURA_WRONG_RENDER_ORDER',
        description: 'Aura renderOrder is not 10',
        actual: aura.renderOrder,
        expected: 10,
        suggestion: 'Set aura.renderOrder = 10'
      });
    }

    return issues;
  }

  /**
   * Check 5: Material Properties (Hologram Shell)
   */
  checkMaterialProperties(node, nodeId, category) {
    const issues = [];
    const nodeRoot = node.userData.nodeRoot || node;

    const holoShell = nodeRoot.children.find(child =>
      child.isMesh && child.userData.isHologramShell === true
    );

    if (!holoShell || !holoShell.material) {
      return issues;
    }

    const mat = holoShell.material;

    // Check locked properties
    if (mat.depthTest !== false) {
      issues.push({
        severity: 'HIGH',
        type: 'HOLOGRAM_MATERIAL_DEPTH_TEST_ENABLED',
        description: 'Hologram shell depthTest should be false',
        actual: mat.depthTest,
        expected: false,
        suggestion: 'Set material.depthTest = false'
      });
    }

    if (mat.depthWrite !== false) {
      issues.push({
        severity: 'HIGH',
        type: 'HOLOGRAM_MATERIAL_DEPTH_WRITE_ENABLED',
        description: 'Hologram shell depthWrite should be false',
        actual: mat.depthWrite,
        expected: false,
        suggestion: 'Set material.depthWrite = false'
      });
    }

    if (mat.transparent !== true) {
      issues.push({
        severity: 'HIGH',
        type: 'HOLOGRAM_MATERIAL_NOT_TRANSPARENT',
        description: 'Hologram shell transparent should be true',
        actual: mat.transparent,
        expected: true,
        suggestion: 'Set material.transparent = true'
      });
    }

    if (mat.side !== THREE.DoubleSide) {
      issues.push({
        severity: 'MEDIUM',
        type: 'HOLOGRAM_MATERIAL_WRONG_SIDE',
        description: 'Hologram shell side should be DoubleSide',
        actual: mat.side,
        expected: THREE.DoubleSide,
        suggestion: 'Set material.side = THREE.DoubleSide'
      });
    }

    if (mat.blending !== THREE.AdditiveBlending) {
      issues.push({
        severity: 'MEDIUM',
        type: 'HOLOGRAM_MATERIAL_WRONG_BLENDING',
        description: 'Hologram shell blending should be AdditiveBlending',
        actual: mat.blending,
        expected: THREE.AdditiveBlending,
        suggestion: 'Set material.blending = THREE.AdditiveBlending'
      });
    }

    return issues;
  }

  /**
   * Check 6: Frustum Culling
   */
  checkFrustumCulling(node, nodeId, category) {
    const issues = [];
    const nodeRoot = node.userData.nodeRoot || node;

    const coreMesh = nodeRoot.children.find(child =>
      child.isMesh && child.userData.visualLayer === 'CORE'
    );
    const holoShell = nodeRoot.children.find(child =>
      child.isMesh && child.userData.isHologramShell === true
    );

    if (coreMesh && coreMesh.frustumCulled !== false) {
      issues.push({
        severity: 'MEDIUM',
        type: 'CORE_MESH_FRUSTUM_CULL_ENABLED',
        description: 'Core mesh frustum culling should be disabled',
        actual: coreMesh.frustumCulled,
        suggestion: 'Set coreMesh.frustumCulled = false'
      });
    }

    if (holoShell && holoShell.frustumCulled !== false) {
      issues.push({
        severity: 'HIGH',
        type: 'HOLOGRAM_SHELL_FRUSTUM_CULL_ENABLED',
        description: 'Hologram shell frustum culling should be disabled',
        actual: holoShell.frustumCulled,
        suggestion: 'Set holoShell.frustumCulled = false'
      });
    }

    return issues;
  }

  /**
   * Check 7: Visual Layer Markers
   */
  checkVisualLayerMarkers(node, nodeId, category) {
    const issues = [];
    const nodeRoot = node.userData.nodeRoot || node;

    const coreMesh = nodeRoot.children.find(child =>
      child.isMesh && child.userData.visualLayer === 'CORE'
    );
    const holoShell = nodeRoot.children.find(child =>
      child.isMesh && child.userData.isHologramShell === true
    );

    if (coreMesh && coreMesh.userData.visualLayer !== 'CORE') {
      issues.push({
        severity: 'MEDIUM',
        type: 'CORE_MESH_MISSING_VISUAL_LAYER',
        description: 'Core mesh visualLayer not set to "CORE"',
        actual: coreMesh.userData.visualLayer,
        expected: 'CORE',
        suggestion: 'Set coreMesh.userData.visualLayer = "CORE"'
      });
    }

    if (holoShell && holoShell.userData.visualLayer !== 'CORE_SHELL') {
      issues.push({
        severity: 'MEDIUM',
        type: 'HOLOGRAM_SHELL_MISSING_VISUAL_LAYER',
        description: 'Hologram shell visualLayer not set to "CORE_SHELL"',
        actual: holoShell.userData.visualLayer,
        expected: 'CORE_SHELL',
        suggestion: 'Set holoShell.userData.visualLayer = "CORE_SHELL"'
      });
    }

    return issues;
  }

  /**
   * Check 8: Aura System
   */
  checkAuraSystem(node, nodeId, category) {
    const issues = [];
    const nodeRoot = node.userData.nodeRoot || node;

    // Check if aura exists in node data
    if (node.userData.vfxAura) {
      const aura = node.userData.vfxAura;

      if (!aura.material) {
        issues.push({
          severity: 'MEDIUM',
          type: 'AURA_NO_MATERIAL',
          description: 'Aura mesh has no material',
          suggestion: 'Verify aura material creation'
        });
      }

      if (aura.renderOrder !== 10) {
        issues.push({
          severity: 'MEDIUM',
          type: 'AURA_WRONG_RENDER_ORDER',
          description: 'Aura renderOrder should be 10',
          actual: aura.renderOrder,
          expected: 10,
          suggestion: 'Set aura.renderOrder = 10'
        });
      }
    }

    return issues;
  }

  /**
   * Check 9: Link System
   */
  checkLinkSystem(node, nodeId, category) {
    const issues = [];

    // Check if links are present
    if (node.userData.linkedNodes && Array.isArray(node.userData.linkedNodes)) {
      const linkedCount = node.userData.linkedNodes.length;

      if (linkedCount > 0) {
        // Verify link visuals exist
        if (!node.userData.linkMeshes) {
          issues.push({
            severity: 'LOW',
            type: 'LINK_MESHES_MISSING',
            description: `Node has ${linkedCount} linked nodes but no link meshes`,
            suggestion: 'Verify link visualization system'
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check 10: Category-Specific Checks
   */
  checkCategorySpecific(node, nodeId, category) {
    const issues = [];

    // EXTREME node checks
    if (category.toLowerCase().includes('extreme')) {
      const nodeRoot = node.userData.nodeRoot || node;

      // Verify procedural nodes still have holograms
      const holoShell = nodeRoot.children.find(child =>
        child.isMesh && child.userData.isHologramShell === true
      );

      if (!holoShell) {
        issues.push({
          severity: 'HIGH',
          type: 'EXTREME_NODE_MISSING_HOLOGRAM',
          description: 'EXTREME node missing hologram shell',
          suggestion: 'Ensure hologram shell is re-created after procedural generation'
        });
      }
    }

    // QUANTUM node checks
    if (category.toLowerCase().includes('quantum')) {
      const nodeRoot = node.userData.nodeRoot || node;
      const holoShell = nodeRoot.children.find(child =>
        child.isMesh && child.userData.isHologramShell === true
      );

      if (!holoShell) {
        issues.push({
          severity: 'HIGH',
          type: 'QUANTUM_NODE_MISSING_HOLOGRAM',
          description: 'QUANTUM node missing hologram shell',
          suggestion: 'Ensure hologram shell is created with stable geometry'
        });
      }
    }

    // Input nodes checks
    if (category.toLowerCase().includes('input')) {
      const nodeRoot = node.userData.nodeRoot || node;
      const coreMesh = nodeRoot.children.find(child =>
        child.isMesh && child.userData.visualLayer === 'CORE'
      );

      if (coreMesh && !coreMesh.geometry.boundingSphere) {
        coreMesh.geometry.computeBoundingSphere();
      }
    }

    return issues;
  }

  /**
   * Generate human-readable audit report
   */
  generateReport() {
    let report = '';
    report += `\n${'='.repeat(80)}\n`;
    report += `NODE CATEGORY AUDIT REPORT\n`;
    report += `Timestamp: ${this.report.timestamp}\n`;
    report += `${'='.repeat(80)}\n\n`;

    report += `SUMMARY:\n`;
    report += `  Total Nodes Audited: ${this.report.totalNodesAudited}\n`;
    report += `  Anomalies Found: ${this.report.anomaliesFound}\n`;
    report += `  Categories Scanned: ${Object.keys(this.report.categoryStats).length}\n\n`;

    report += `CATEGORY BREAKDOWN:\n`;
    Object.entries(this.report.categoryStats).forEach(([category, stats]) => {
      report += `\n  ${category.toUpperCase()}:\n`;
      report += `    Total: ${stats.total}\n`;
      report += `    Healthy: ${stats.healthy}\n`;
      report += `    Anomalous: ${stats.anomalous}\n`;
      if (stats.issues.length > 0) {
        report += `    Issues:\n`;
        stats.issues.forEach(issue => {
          report += `      - [${issue.severity}] ${issue.type}: ${issue.description}\n`;
          if (issue.actual !== undefined && issue.expected !== undefined) {
            report += `        (actual: ${issue.actual}, expected: ${issue.expected})\n`;
          }
        });
      }
    });

    if (this.report.anomaliesFound > 0) {
      report += `\n\nDETAILED ANOMALIES:\n`;
      this.report.detailedIssues.forEach((issue, idx) => {
        report += `\n  [${idx + 1}] Node: ${issue.nodeId} (${issue.category})\n`;
        report += `      Type: ${issue.type}\n`;
        report += `      Severity: ${issue.severity}\n`;
        report += `      Description: ${issue.description}\n`;
        if (issue.suggestion) {
          report += `      Suggestion: ${issue.suggestion}\n`;
        }
      });
    }

    report += `\n${'='.repeat(80)}\n`;
    return report;
  }

  /**
   * Get severity count
   */
  getSeveritySummary() {
    const summary = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    this.report.detailedIssues.forEach(issue => {
      if (summary.hasOwnProperty(issue.severity)) {
        summary[issue.severity]++;
      }
    });

    return summary;
  }

  /**
   * Get issues by type
   */
  getIssuesByType() {
    const byType = {};

    this.report.detailedIssues.forEach(issue => {
      if (!byType[issue.type]) {
        byType[issue.type] = [];
      }
      byType[issue.type].push(issue);
    });

    return byType;
  }

  /**
   * Export report as JSON
   */
  exportJSON() {
    return JSON.stringify(this.report, null, 2);
  }

  /**
   * Export report as CSV
   */
  exportCSV() {
    let csv = 'NodeID,Category,Type,Severity,Description,Suggestion\n';

    this.report.detailedIssues.forEach(issue => {
      csv += `"${issue.nodeId}","${issue.category}","${issue.type}","${issue.severity}","${issue.description}","${issue.suggestion || ''}"\n`;
    });

    return csv;
  }
}

/**
 * Quick audit shortcut function
 */
export function auditNodeVisuals(scene) {
  const audit = new NodeCategoryAudit(scene);
  const report = audit.auditAllNodes();
  return {
    report,
    summary: audit.getSeveritySummary(),
    byType: audit.getIssuesByType(),
    print: () => console.log(audit.generateReport())
  };
}
