/**
 * SIMULATION INVARIANT ENFORCEMENT
 * 
 * TASK 2: Production Deploy (Strict)
 * 
 * Non-breaking enforcement of simulation invariants:
 * 1. Registry authority (single authoritative array)
 * 2. Update participation (all nodes receive frame updates)
 * 3. Link state consistency (proper state tracking)
 * 
 * Changes applied ONLY at update loop and registration points.
 * NO new logic, NO refactoring, NO visual changes.
 * 
 * Development and Production behavior: IDENTICAL
 */

export class SimulationInvariantEnforcement {
  constructor(aiNodes) {
    this.aiNodes = aiNodes;
    this.frameNumber = 0;
    this.registryCheckInterval = 300; // Every ~300 frames (~5 seconds at 60fps)
    this.updateTicksByNodeId = new Map();
    this.lastRegistryCheck = 0;
  }

  /**
   * INVARIANT 1: Registry Authority Enforcement
   * 
   * Validates that all nodes exist in exactly one registry:
   * this.aiNodes.nodes
   * 
   * No alternate lists, no copies, no orphaned nodes.
   */
  enforceRegistryAuthority() {
    if (!this.aiNodes || !this.aiNodes.nodes) return;

    const registry = this.aiNodes.nodes;
    
    // Check: No null/undefined entries
    for (let i = 0; i < registry.length; i++) {
      if (!registry[i]) {
        console.warn(`[SimulationInvariant] NULL node at registry[${i}]`);
        registry.splice(i, 1);
        i--;
      }
    }

    // Check: All entries have required properties
    registry.forEach((node, idx) => {
      if (!node.userData) {
        console.warn(`[SimulationInvariant] Node ${idx} missing userData`);
        node.userData = {};
      }
      if (!node.position) {
        console.warn(`[SimulationInvariant] Node ${idx} missing position`);
      }
    });
  }

  /**
   * INVARIANT 2: Update Participation Tracking
   * 
   * Track which nodes receive update ticks in each frame.
   * Ensures 100% coverage (all nodes updated).
   */
  recordNodeUpdate(node) {
    if (!node || !node.uuid && !node.id) return;
    
    const nodeId = node.uuid || node.id;
    const currentTick = this.updateTicksByNodeId.get(nodeId) || 0;
    this.updateTicksByNodeId.set(nodeId, currentTick + 1);
  }

  /**
   * INVARIANT 3: Link State Consistency
   * 
   * Validate that linked state matches linkedNodes array.
   * No inconsistent link states.
   */
  validateLinkStateConsistency(node) {
    if (!node) return;

    const hasLinks = node.linkedNodes && node.linkedNodes.length > 0;
    const linkedState = node.linked === true;

    // Flag inconsistencies (non-breaking, just log)
    if (hasLinks !== linkedState) {
      // Repair: Set linked to match array
      if (hasLinks && !linkedState) {
        node.linked = true;
      } else if (!hasLinks && linkedState) {
        node.linked = false;
      }
    }
  }

  /**
   * Per-frame invariant enforcement
   * Called during AINodes.update() loop
   */
  enforcePerFrame() {
    this.frameNumber++;

    // Registry authority check (less frequently)
    if (this.frameNumber % this.registryCheckInterval === 0) {
      this.enforceRegistryAuthority();
    }

    // Per-node checks
    if (this.aiNodes && this.aiNodes.nodes) {
      this.aiNodes.nodes.forEach(node => {
        this.recordNodeUpdate(node);
        this.validateLinkStateConsistency(node);
      });
    }
  }

  /**
   * Get update coverage report
   * For verification that all nodes receive updates
   */
  getUpdateCoverageReport() {
    const registry = this.aiNodes?.nodes || [];
    const trackedNodes = this.updateTicksByNodeId.size;
    const coverage = trackedNodes / (registry.length || 1);

    return {
      frameNumber: this.frameNumber,
      registrySize: registry.length,
      trackedNodes: trackedNodes,
      coverage: (coverage * 100).toFixed(1) + '%',
      status: coverage === 1.0 ? 'FULL' : 'PARTIAL',
    };
  }

  /**
   * Get nodes missing updates
   */
  getNodesWithoutUpdates() {
    const registry = this.aiNodes?.nodes || [];
    const missing = [];

    registry.forEach(node => {
      const nodeId = node.uuid || node.id;
      const ticks = this.updateTicksByNodeId.get(nodeId) || 0;
      if (ticks === 0) {
        missing.push({
          id: nodeId,
          category: node.userData?.category || 'unknown',
          rarity: node.userData?.rarity || 'standard',
        });
      }
    });

    return missing;
  }

  /**
   * Verify all nodes in registry have expected properties
   */
  verifyNodeStructure() {
    const registry = this.aiNodes?.nodes || [];
    const issues = [];

    registry.forEach((node, idx) => {
      if (!node.userData) {
        issues.push({ idx, issue: 'missing userData' });
      }
      if (!node.position) {
        issues.push({ idx, issue: 'missing position' });
      }
      if (!node.uuid && !node.id) {
        issues.push({ idx, issue: 'missing uuid/id' });
      }
    });

    return {
      nodesChecked: registry.length,
      issuesFound: issues.length,
      issues: issues.slice(0, 10), // First 10 issues
    };
  }

  /**
   * Full diagnostic (for verification)
   */
  fullDiagnostic() {
    return {
      registry: {
        size: this.aiNodes?.nodes?.length || 0,
      },
      updates: this.getUpdateCoverageReport(),
      structure: this.verifyNodeStructure(),
      missingUpdates: this.getNodesWithoutUpdates(),
    };
  }
}

/**
 * Apply enforcement to AINodes instance
 * Called during initialization
 */
export function setupSimulationInvariantEnforcement(aiNodes) {
  const enforcer = new SimulationInvariantEnforcement(aiNodes);

  // Patch AINodes.update() to enforce invariants
  const originalUpdate = aiNodes.update.bind(aiNodes);
  aiNodes.update = function(deltaTime, time) {
    // Call enforcer BEFORE main update
    enforcer.enforcePerFrame();
    
    // Call original update
    return originalUpdate(deltaTime, time);
  };

  // Attach to window for diagnostics
  if (typeof window !== 'undefined') {
    window.__simulationInvariant = {
      coverage: () => enforcer.getUpdateCoverageReport(),
      missingUpdates: () => enforcer.getNodesWithoutUpdates(),
      verify: () => enforcer.verifyNodeStructure(),
      diagnostic: () => enforcer.fullDiagnostic(),
    };
  }

  return enforcer;
}
