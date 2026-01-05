/**
 * SPAWN AUTHORITY COMPLIANCE GATE
 * 
 * Runtime enforcement layer that validates every spawn attempt against
 * hard requirements. Prevents any spawn that doesn't originate from
 * EnhancedNodeModel or violates safety guarantees.
 * 
 * HARD RULES (NON-NEGOTIABLE):
 * 1. All spawns must come from EnhancedNodeModel
 * 2. Unknown categories must fallback silently to 'input'
 * 3. Missing dependencies must abort cleanly (return null)
 * 4. Every node MUST have binding metadata
 * 5. Visual meshes MUST NEVER block raycasts
 * 6. Every node MUST be clickable
 */

import { EnhancedNodeModels } from './EnhancedNodeModels.js';
import { disableRaycastOnMesh } from './RaycastAuthorityInit.js';
import { nodeSpawnRegistry } from './NodeSpawnRegistry.js';

export class SpawnAuthorityComplianceGate {
  constructor() {
    // Registry of all supported node categories from EnhancedNodeModel
    this.SUPPORTED_CATEGORIES = [
      'input', 'process', 'integration', 'analytics', 'storage', 'control',
      'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'
    ];
    
    // Metrics for compliance auditing
    this.spawnAttempts = 0;
    this.successfulSpawns = 0;
    this.rejectedSpawns = 0;
    this.fallbackSpawns = 0;
    this.failedValidations = [];
    
    // Per-spawn validation log
    this.lastValidationResult = null;
  }

  /**
   * GATE 1: Validate spawn request against hard requirements
   * Returns normalized category or null if spawn must abort
   */
  validateSpawnRequest(requestedCategory, position) {
    this.spawnAttempts++;
    
    // ================================================================
    // RULE 1: EnhancedNodeModel must be available
    // ================================================================
    if (!EnhancedNodeModels || typeof EnhancedNodeModels.create !== 'function') {
      this.rejectedSpawns++;
      this.lastValidationResult = {
        valid: false,
        reason: 'EnhancedNodeModel unavailable',
        category: null,
        action: 'ABORT'
      };
      return null;  // HARD ABORT
    }

    // ================================================================
    // RULE 2: Category must be in supported list (with fallback)
    // ================================================================
    let finalCategory = (requestedCategory || '').toLowerCase().trim();
    let wasFallback = false;

    if (!finalCategory) {
      // No category provided - use default
      finalCategory = 'input';
      wasFallback = true;
    } else if (!this.SUPPORTED_CATEGORIES.includes(finalCategory)) {
      // Unknown category - FALLBACK SILENTLY (no logging)
      finalCategory = 'input';
      wasFallback = true;
      this.fallbackSpawns++;
    }

    // ================================================================
    // RULE 3: Position must be valid (no null/undefined)
    // ================================================================
    if (!position || typeof position.x !== 'number' || 
        typeof position.y !== 'number' || 
        typeof position.z !== 'number') {
      this.rejectedSpawns++;
      this.lastValidationResult = {
        valid: false,
        reason: 'Invalid position',
        category: finalCategory,
        action: 'ABORT'
      };
      return null;
    }

    // ================================================================
    // VALIDATION PASSED: Return normalized category
    // ================================================================
    this.successfulSpawns++;
    this.lastValidationResult = {
      valid: true,
      reason: 'Validation passed',
      category: finalCategory,
      wasFallback: wasFallback,
      action: 'SPAWN'
    };

    return finalCategory;
  }

  /**
   * GATE 2: Validate spawned node has all required properties
   * Called AFTER spawn to verify node meets compliance
   */
  validateSpawnedNode(node, category) {
    const violations = [];

    // ================================================================
    // REQUIREMENT 1: Node must exist
    // ================================================================
    if (!node || !node.isMesh === undefined) {
      violations.push('Node is null or not a valid Three.js object');
      this.failedValidations.push({
        violation: 'Node existence',
        category: category,
        severity: 'CRITICAL'
      });
      return { compliant: false, violations };
    }

    // ================================================================
    // REQUIREMENT 2: Node must have binding metadata
    // ================================================================
    const binding = node.userData?.enhancedNodeModelBinding;
    if (!binding) {
      violations.push('Missing enhancedNodeModelBinding metadata');
      this.failedValidations.push({
        violation: 'Binding metadata',
        category: category,
        severity: 'CRITICAL'
      });
    } else {
      // Validate binding structure
      if (binding.sourceModel !== 'EnhancedNodeModel') {
        violations.push(`Invalid source model: ${binding.sourceModel}`);
      }
      if (!binding.category) {
        violations.push('Binding missing category');
      }
      if (binding.variantIndex === undefined) {
        violations.push('Binding missing variantIndex');
      }
      if (!binding.spawnTime) {
        violations.push('Binding missing spawnTime');
      }
    }

    // ================================================================
    // REQUIREMENT 3: Node must have category
    // ================================================================
    if (!node.userData?.category) {
      violations.push('Node missing category in userData');
      this.failedValidations.push({
        violation: 'Category assignment',
        category: category,
        severity: 'CRITICAL'
      });
    }

    // ================================================================
    // REQUIREMENT 4: Node must have core mesh (clickable)
    // ================================================================
    let hasCoreMesh = false;
    node.traverse(child => {
      if (child.isMesh && !child.userData?.isAura && 
          !child.userData?.isShell && !child.userData?.isParticle &&
          !child.userData?.isFX && !child.userData?.isGlyph &&
          !child.userData?.isLinkVisual) {
        hasCoreMesh = true;
      }
    });

    if (!hasCoreMesh) {
      violations.push('Node has no core mesh for interaction');
      this.failedValidations.push({
        violation: 'Core mesh',
        category: category,
        severity: 'CRITICAL'
      });
    }

    // ================================================================
    // REQUIREMENT 5: Visual meshes must be disabled for raycasting
    // ================================================================
    node.traverse(child => {
      if (!child.isMesh) return;
      
      const userData = child.userData || {};
      const isVisualOnly = 
        userData.isAura === true ||
        userData.isShell === true ||
        userData.isHologramShell === true ||
        userData.isFX === true ||
        userData.isParticle === true ||
        userData.isGlyph === true ||
        userData.isLinkVisual === true;

      if (isVisualOnly && child.raycast !== undefined && 
          typeof child.raycast === 'function' && 
          child.raycast.toString().indexOf('null') === -1) {
        // Visual mesh can still raycast - needs fixing
        violations.push(`Visual mesh ${child.name} not disabled for raycasting`);
        // Auto-fix: disable it now
        disableRaycastOnMesh(child);
      }
    });

    // ================================================================
    // COMPLIANCE RESULT
    // ================================================================
    const compliant = violations.length === 0;
    if (!compliant) {
      this.failedValidations.push({
        violations: violations,
        category: category,
        nodeId: node.userData?.id,
        severity: 'VALIDATION_FAILED'
      });
    }

    return {
      compliant: compliant,
      violations: violations,
      metadata: binding,
      hasCoreMesh: hasCoreMesh
    };
  }

  /**
   * AUDIT: Check all nodes in scene for compliance
   * Returns audit report with violations and statistics
   */
  auditAllNodes(nodes) {
    const report = {
      totalNodes: nodes.length,
      compliantNodes: 0,
      violatingNodes: 0,
      violations: [],
      statistics: {
        bindingMetadataOK: 0,
        bindingMetadataFailed: 0,
        raycasingOK: 0,
        raycasingFailed: 0,
        coreMeshOK: 0,
        coreMeshFailed: 0
      }
    };

    nodes.forEach((node, index) => {
      const validation = this.validateSpawnedNode(node, node.userData?.category);
      
      if (validation.compliant) {
        report.compliantNodes++;
        report.statistics.bindingMetadataOK++;
        report.statistics.raycasingOK++;
        report.statistics.coreMeshOK++;
      } else {
        report.violatingNodes++;
        report.violations.push({
          nodeIndex: index,
          nodeId: node.userData?.id,
          category: node.userData?.category,
          violations: validation.violations
        });

        if (!validation.metadata) {
          report.statistics.bindingMetadataFailed++;
        }
        if (!validation.hasCoreMesh) {
          report.statistics.coreMeshFailed++;
        }
      }
    });

    return report;
  }

  /**
   * CONSOLE API: Get compliance status
   */
  getComplianceStatus() {
    return {
      spawnAttempts: this.spawnAttempts,
      successfulSpawns: this.successfulSpawns,
      rejectedSpawns: this.rejectedSpawns,
      fallbackSpawns: this.fallbackSpawns,
      successRate: this.spawnAttempts > 0 
        ? ((this.successfulSpawns / this.spawnAttempts) * 100).toFixed(2) + '%'
        : 'N/A',
      failedValidations: this.failedValidations.length,
      lastValidation: this.lastValidationResult
    };
  }

  /**
   * CONSOLE API: Print audit report
   */
  printAuditReport(nodes) {
    const report = this.auditAllNodes(nodes);
    
    console.group('%c[SPAWN AUTHORITY AUDIT]', 'color: #00ff00; font-weight: bold');
    console.log(`Total Nodes: ${report.totalNodes}`);
    console.log(`Compliant: ${report.compliantNodes} ✓`);
    console.log(`Violating: ${report.violatingNodes} ✗`);
    
    if (report.violations.length > 0) {
      console.group('Violations:');
      report.violations.forEach(v => {
        console.error(`  Node ${v.nodeIndex} (${v.category}):`, v.violations);
      });
      console.groupEnd();
    }
    
    console.table(report.statistics);
    console.groupEnd();
    
    return report;
  }

  /**
   * COMPLIANCE CHECK: Should reject spawn?
   * Hard decision point: spawn or abort?
   */
  shouldRejectSpawn(requestedCategory) {
    // Never reject if category can be validated
    const validated = this.validateSpawnRequest(requestedCategory, { x: 0, y: 0, z: 0 });
    return validated === null;  // Only reject if validation returned null
  }

  /**
   * GATE 3: Uniqueness Check
   * Returns true if unique spawn is allowed (or if it's not unique type)
   * Returns false if duplicate unique spawn is detected
   */
  checkSpawnUniqueness(category, archetype) {
    return nodeSpawnRegistry.isSpawnAllowed(category, archetype);
  }

  /**
   * REGISTER: Mark a unique spawn as active
   */
  registerSpawn(category, archetype, nodeId) {
    nodeSpawnRegistry.registerSpawn(category, archetype, nodeId);
  }

  /**
   * DEREGISTER: Remove from active unique list
   */
  deregisterSpawn(category, archetype) {
    nodeSpawnRegistry.deregisterSpawn(category, archetype);
  }

  /**
   * Reset metrics (for testing)
   */
  reset() {
    this.spawnAttempts = 0;
    this.successfulSpawns = 0;
    this.rejectedSpawns = 0;
    this.fallbackSpawns = 0;
    this.failedValidations = [];
    this.lastValidationResult = null;
  }
}

// Export singleton instance
export const spawnAuthorityComplianceGate = new SpawnAuthorityComplianceGate();
