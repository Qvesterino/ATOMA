/**
 * LINK ELIGIBILITY GATE v1.0
 * ===========================
 * 
 * SINGLE AUTHORITATIVE SOURCE for all link eligibility decisions
 * All link creation MUST go through canLink() — no exceptions
 * 
 * Purpose: Logic-first repair of linking system
 * - Provide explicit eligibility reasons
 * - Enable debug mode for visibility
 * - Block invalid links at gate, not downstream
 * - Zero visual changes
 */

export class LinkEligibilityGate_v1 {
  constructor(options = {}) {
    this.debugMode = options.debugMode ?? false;
    this.aiNodes = options.aiNodes || null;
    this.linkingSystem = options.linkingSystem || null;
    
    // Statistics
    this.stats = {
      totalAttempts: 0,
      allowed: 0,
      blocked: 0,
      rejectionReasons: {}
    };
    
    console.log('[LinkEligibilityGate] Initialized — Single authoritative link gate active');
  }

  /**
   * MAIN GATE FUNCTION
   * All link decisions MUST go through here
   */
  canLink(nodeA, nodeB, context = {}) {
    this.stats.totalAttempts++;

    // ========================================================================
    // VALIDATION 1: Node Identity
    // ========================================================================
    if (!nodeA || !nodeB) {
      return this._reject('nodes_null', 'One or both nodes are null');
    }

    if (!nodeA.userData || !nodeB.userData) {
      return this._reject('invalid_node_structure', 'Node missing userData');
    }

    if (nodeA.uuid === nodeB.uuid) {
      return this._reject('self_link_blocked', 'Cannot link node to itself');
    }

    // ========================================================================
    // VALIDATION 2: Node Status
    // ========================================================================
    if (nodeA.userData.visualFrozen === false || nodeB.userData.visualFrozen === false) {
      // Both nodes must be in valid state (if tracking freezing)
    }

    // Check if nodes are active/valid
    const nodeAValid = this._isNodeValid(nodeA);
    const nodeBValid = this._isNodeValid(nodeB);

    if (!nodeAValid) {
      return this._reject('nodeA_invalid', 'Node A is not in valid state for linking');
    }

    if (!nodeBValid) {
      return this._reject('nodeB_invalid', 'Node B is not in valid state for linking');
    }

    // ========================================================================
    // VALIDATION 3: Category Compatibility
    // ========================================================================
    const catA = nodeA.userData.category || 'unknown';
    const catB = nodeB.userData.category || 'unknown';

    const categoryCheck = this._checkCategoryCompatibility(catA, catB);
    if (!categoryCheck.allowed) {
      return this._reject(categoryCheck.reason, categoryCheck.message);
    }

    // ========================================================================
    // VALIDATION 4: Existing Link Prevention (No Duplicates)
    // ========================================================================
    if (this.linkingSystem && this.linkingSystem.links) {
      for (const link of this.linkingSystem.links) {
        if (link.active && link.nodeA && link.nodeB) {
          // Check for exact duplicate
          if ((link.nodeA.uuid === nodeA.uuid && link.nodeB.uuid === nodeB.uuid) ||
              (link.nodeA.uuid === nodeB.uuid && link.nodeB.uuid === nodeA.uuid)) {
            return this._reject('link_exists', 'Link between these nodes already exists');
          }
        }
      }
    }

    // ========================================================================
    // VALIDATION 5: Network Load Pressure
    // ========================================================================
    const loadPressure = this._getNetworkLoadPressure();
    if (loadPressure > 0.95) {
      return this._reject('load_pressure_exceeded', 'Network load at critical level (>95%)');
    }

    // ========================================================================
    // VALIDATION 6: Node Degree Limits (max links per node)
    // ========================================================================
    const nodeADegree = this._getNodeDegree(nodeA);
    const nodeBDegree = this._getNodeDegree(nodeB);
    
    const maxDegree = 8; // Max links per node
    if (nodeADegree >= maxDegree) {
      return this._reject('node_degree_limit', `Node A has reached max link degree (${maxDegree})`);
    }
    if (nodeBDegree >= maxDegree) {
      return this._reject('node_degree_limit', `Node B has reached max link degree (${maxDegree})`);
    }

    // ========================================================================
    // VALIDATION 7: Corruption Blocking (extreme corruption prevents new links)
    // ========================================================================
    const nodeACorruption = nodeA.userData.corruption ?? 0;
    const nodeBCorruption = nodeB.userData.corruption ?? 0;

    if (nodeACorruption > 0.9 || nodeBCorruption > 0.9) {
      return this._reject('corruption_extreme', 'Node corruption too high to link (>90%)');
    }

    // ========================================================================
    // VALIDATION 8: Distance Check (nodes must not be too far apart)
    // ========================================================================
    const distance = nodeA.position.distanceTo(nodeB.position);
    const maxDistance = 100; // Max link distance
    if (distance > maxDistance) {
      return this._reject('distance_exceeded', `Nodes too far apart (${distance.toFixed(1)} > ${maxDistance})`);
    }

    // ========================================================================
    // ALL CHECKS PASSED
    // ========================================================================
    this.stats.allowed++;
    if (this.debugMode) {
      console.log(`[LinkEligibilityGate] ✅ ALLOWED: ${catA} → ${catB}`);
    }
    return {
      allowed: true,
      reason: 'all_checks_passed',
      details: {
        distance: distance.toFixed(2),
        loadPressure: (loadPressure * 100).toFixed(1) + '%',
        nodeADegree,
        nodeBDegree,
        nodeACorruption: (nodeACorruption * 100).toFixed(1) + '%',
        nodeBCorruption: (nodeBCorruption * 100).toFixed(1) + '%'
      }
    };
  }

  /**
   * Check if a node is valid for linking
   */
  _isNodeValid(node) {
    if (!node || !node.parent) return false;
    if (!node.userData) return false;

    // Node must be in scene
    if (node.parent.uuid !== this.linkingSystem?.scene?.uuid && 
        !this._isInScene(node)) {
      return false;
    }

    return true;
  }

  /**
   * Check if node is in scene
   */
  _isInScene(node) {
    if (!this.linkingSystem || !this.linkingSystem.scene) return false;
    let current = node;
    while (current) {
      if (current === this.linkingSystem.scene) return true;
      current = current.parent;
    }
    return false;
  }

  /**
   * Check category compatibility
   */
  _checkCategoryCompatibility(catA, catB) {
    // All same-network categories can link together
    const validCategories = [
      'input', 'process', 'integration', 'analytics', 'storage', 
      'control', 'quantum', 'sigma', 'mythic', 'prime', 'error'
    ];

    if (!validCategories.includes(catA)) {
      return { 
        allowed: false, 
        reason: 'category_unknown_A',
        message: `Unknown category: ${catA}`
      };
    }

    if (!validCategories.includes(catB)) {
      return { 
        allowed: false, 
        reason: 'category_unknown_B',
        message: `Unknown category: ${catB}`
      };
    }

    // All categories are compatible within same network
    return { allowed: true };
  }

  /**
   * Get network load pressure (0.0 to 1.0)
   */
  _getNetworkLoadPressure() {
    if (!this.linkingSystem || !this.linkingSystem.links) return 0;

    // Pressure = links / (maxPossibleLinks)
    // For n nodes, max links = n * (n-1) / 2
    const n = this.aiNodes?.nodes?.length || 1;
    const maxPossibleLinks = (n * (n - 1)) / 2;
    const currentLinks = this.linkingSystem.links.filter(l => l.active).length;
    
    return Math.min(1.0, currentLinks / maxPossibleLinks);
  }

  /**
   * Get number of active links on a node
   */
  _getNodeDegree(node) {
    if (!this.linkingSystem || !this.linkingSystem.links) return 0;

    let degree = 0;
    for (const link of this.linkingSystem.links) {
      if (link.active && (link.nodeA?.uuid === node.uuid || link.nodeB?.uuid === node.uuid)) {
        degree++;
      }
    }
    return degree;
  }

  /**
   * Internal rejection handler
   */
  _reject(reason, message) {
    this.stats.blocked++;
    this.stats.rejectionReasons[reason] = (this.stats.rejectionReasons[reason] || 0) + 1;

    if (this.debugMode) {
      console.warn(`[LinkEligibilityGate] ❌ BLOCKED: ${reason} — ${message}`);
    }

    return {
      allowed: false,
      reason,
      message
    };
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    const blocked = this.stats.rejectionReasons;
    return {
      totalAttempts: this.stats.totalAttempts,
      allowed: this.stats.allowed,
      blocked: this.stats.blocked,
      allowanceRate: this.stats.totalAttempts > 0 
        ? (this.stats.allowed / this.stats.totalAttempts * 100).toFixed(1) + '%'
        : '0%',
      rejectionBreakdown: blocked
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalAttempts: 0,
      allowed: 0,
      blocked: 0,
      rejectionReasons: {}
    };
  }

  /**
   * Get human-readable report
   */
  getReport() {
    const stats = this.getStats();
    console.log('\n════════════════════════════════════════');
    console.log('  LINK ELIGIBILITY GATE — STATISTICS');
    console.log('════════════════════════════════════════');
    console.log(`Total Link Attempts:     ${stats.totalAttempts}`);
    console.log(`Allowed:                 ${stats.allowed}`);
    console.log(`Blocked:                 ${stats.blocked}`);
    console.log(`Allowance Rate:          ${stats.allowanceRate}`);
    console.log('\nRejection Reasons:');
    
    const reasons = Object.entries(stats.rejectionBreakdown)
      .sort((a, b) => b[1] - a[1]);
    
    for (const [reason, count] of reasons) {
      console.log(`  • ${reason}: ${count}`);
    }
    console.log('════════════════════════════════════════\n');
    
    return stats;
  }
}

/**
 * Quick setup function
 */
export function setupLinkEligibilityGate(options = {}) {
  const gate = new LinkEligibilityGate_v1(options);
  window.__linkEligibilityGate__ = gate;
  
  console.log('[LinkEligibilityGate] Ready — Access via window.__linkEligibilityGate__');
  console.log('  Methods: canLink(nodeA, nodeB), getStats(), getReport()');
  
  return gate;
}

export default LinkEligibilityGate_v1;
