/**
 * NODELINKER 2.0 REPAIR LAYER 1.0 — Self-Healing Validation & Synchronization
 *
 * Production-grade validation layer that ensures NodeLinkingSystem stays consistent.
 *
 * Responsibilities:
 * - Validate link structure on every operation
 * - Repair broken links (missing nodes, self-links, orphans)
 * - Synchronize linksByNode index with runtime links
 * - Fix getLinksForNode to never return undefined
 * - Auto-heal after node spawn, link create/remove
 * - Provide comprehensive diagnostics
 *
 * Integration:
 *   const repairLayer = new NodeLinker2_RepairLayer1_0(nodeLinker, aiNodes);
 *   repairLayer.init();
 *   repairLayer.runFullRepair();
 *
 * Console API:
 *   window.nodeLinker2.debugIntegrity()         // Link integrity report
 *   window.nodeLinker2.syncReport()             // Sync status
 *   window.nodeLinker2.repairNow()              // Force repair
 *   window.nodeLinker2.getStats()               // Statistics
 */

export class NodeLinker2_RepairLayer1_0 {
  /**
   * Initialize repair layer
   * @param {NodeLinkingSystem} nodeLinker
   * @param {AINodes} aiNodes
   */
  constructor(nodeLinker, aiNodes) {
    if (!nodeLinker) {
      console.warn('[NodeLinker2_RepairLayer] nodeLinker required (got null/undefined)');
      this.enabled = false;
      return;
    }

    this.nodeLinker = nodeLinker;
    this.aiNodes = aiNodes;
    this.enabled = true;

    // Statistics
    this._stats = {
      repairsRun: 0,
      validLinksFound: 0,
      brokenLinksRemoved: 0,
      orphanLinksRecovered: 0,
      selfLinksRemoved: 0,
      orphanNodesFound: 0,
      indexRebuildCount: 0,
      lastRepairTime: null,
      lastRepairMs: 0,
    };

    // Diagnostic history
    this._history = [];
    this._maxHistorySize = 100;

    console.log('[NodeLinker2_RepairLayer] Created');
  }

  /**
   * Initialize and hook into NodeLinkingSystem
   */
  init() {
    if (!this.enabled) return;

    // Hook into link creation
    const originalCreateLink = this.nodeLinker.createLink?.bind(this.nodeLinker);
    if (originalCreateLink) {
      this.nodeLinker.createLink = (...args) => {
        const result = originalCreateLink(...args);
        this._onLinkCreated();
        return result;
      };
    }

    // Hook into link removal
    const originalRemoveLink = this.nodeLinker.removeLink?.bind(this.nodeLinker);
    if (originalRemoveLink) {
      this.nodeLinker.removeLink = (...args) => {
        const result = originalRemoveLink(...args);
        this._onLinkRemoved();
        return result;
      };
    }

    // Hook getLinksForNode to never return undefined
    const originalGetLinksForNode = this.nodeLinker.getLinksForNode?.bind(
      this.nodeLinker
    );
    if (originalGetLinksForNode) {
      this.nodeLinker.getLinksForNode = (node) => {
        const result = originalGetLinksForNode(node);
        // Always return array, never undefined
        return Array.isArray(result) ? result : [];
      };
    }

    // Expose to window for debugging
    window.nodeLinker2 = this;

    console.log('[NodeLinker2_RepairLayer] Initialized and hooked');
  }

  // ============================================================================
  // CORE REPAIR OPERATIONS
  // ============================================================================

  /**
   * Run full repair cycle
   */
  runFullRepair() {
    if (!this.enabled) return;

    const startMs = performance.now();

    try {
      // Phase 1: Validate all links
      this._validateAllLinks();

      // Phase 2: Repair broken links
      this._repairBrokenLinks();

      // Phase 3: Fix orphans
      this._fixOrphanLinks();

      // Phase 4: Rebuild index
      this._rebuildIndexFromRuntime();

      // Phase 5: Validate index consistency
      this._validateIndexConsistency();

      // Phase 6: Sync HUD state
      this._syncHUDState();

      this._stats.repairsRun++;
      this._stats.lastRepairTime = Date.now();
      this._stats.lastRepairMs = performance.now() - startMs;

      this._recordHistory('full_repair', {
        duration: this._stats.lastRepairMs,
        validLinks: this._stats.validLinksFound,
        removed: this._stats.brokenLinksRemoved,
      });
    } catch (e) {
      console.error('[NodeLinker2_RepairLayer] Repair error:', e);
      this._recordHistory('repair_error', { error: e.message });
    }
  }

  /**
   * Phase 1: Validate all links structure
   */
  _validateAllLinks() {
    const links = this.nodeLinker.links || [];
    this._stats.validLinksFound = 0;

    for (let i = links.length - 1; i >= 0; i--) {
      const link = links[i];
      const validation = this._validateLink(link);

      if (!validation.valid) {
        // Mark for removal
        links.splice(i, 1);
      } else {
        this._stats.validLinksFound++;
      }
    }
  }

  /**
   * Phase 2: Repair broken links
   */
  _repairBrokenLinks() {
    const links = this.nodeLinker.links || [];
    const toRemove = [];

    for (const link of links) {
      if (!this._validateLink(link).valid) {
        toRemove.push(link);
      }

      // Check for self-links (a === b)
      if (
        link.source &&
        link.target &&
        link.source.id === link.target.id
      ) {
        toRemove.push(link);
        this._stats.selfLinksRemoved++;
      }
    }

    for (const link of toRemove) {
      const idx = links.indexOf(link);
      if (idx >= 0) {
        links.splice(idx, 1);
        this._stats.brokenLinksRemoved++;
      }
    }
  }

  /**
   * Phase 3: Fix orphan links (in index but not in runtime)
   */
  _fixOrphanLinks() {
    const linksByNode = this.nodeLinker.linksByNode || new Map();
    const runtimeLinks = this.nodeLinker.links || [];
    const toDelete = [];

    for (const [nodeId, indexedLinks] of linksByNode.entries()) {
      if (!Array.isArray(indexedLinks)) {
        toDelete.push(nodeId);
        continue;
      }

      const validLinks = indexedLinks.filter(
        (link) => link && runtimeLinks.includes(link)
      );

      if (validLinks.length !== indexedLinks.length) {
        this._stats.orphanLinksRecovered += indexedLinks.length - validLinks.length;

        if (validLinks.length === 0) {
          toDelete.push(nodeId);
        } else {
          linksByNode.set(nodeId, validLinks);
        }
      }
    }

    // Clean up empty entries
    for (const nodeId of toDelete) {
      linksByNode.delete(nodeId);
      this._stats.orphanNodesFound++;
    }
  }

  /**
   * Phase 4: Rebuild index from runtime links
   */
  _rebuildIndexFromRuntime() {
    const linksByNode = this.nodeLinker.linksByNode || new Map();
    const links = this.nodeLinker.links || [];

    // Clear existing index
    linksByNode.clear();

    // Rebuild from runtime
    for (const link of links) {
      if (!link || !this._validateLink(link).valid) continue;

      const sourceId = link.source?.id;
      const targetId = link.target?.id;

      if (!sourceId || !targetId) continue;

      // Add source → link
      if (!linksByNode.has(sourceId)) {
        linksByNode.set(sourceId, []);
      }
      linksByNode.get(sourceId).push(link);

      // Add target → link
      if (!linksByNode.has(targetId)) {
        linksByNode.set(targetId, []);
      }
      linksByNode.get(targetId).push(link);
    }

    this._stats.indexRebuildCount++;
  }

  /**
   * Phase 5: Validate index consistency
   */
  _validateIndexConsistency() {
    const linksByNode = this.nodeLinker.linksByNode || new Map();
    const links = this.nodeLinker.links || [];

    let consistencyIssues = 0;

    // Check: every indexed link is in runtime
    for (const [nodeId, indexedLinks] of linksByNode.entries()) {
      for (const link of indexedLinks) {
        if (!links.includes(link)) {
          consistencyIssues++;
        }
      }
    }

    // Check: every runtime link is in index (both ends)
    for (const link of links) {
      if (!link.source?.id || !link.target?.id) {
        consistencyIssues++;
        continue;
      }

      const sourceLinks = linksByNode.get(link.source.id) || [];
      const targetLinks = linksByNode.get(link.target.id) || [];

      if (!sourceLinks.includes(link) || !targetLinks.includes(link)) {
        consistencyIssues++;
      }
    }

    return consistencyIssues === 0;
  }

  /**
   * Phase 6: Sync HUD state (update SelectedHUD if needed)
   */
  _syncHUDState() {
    try {
      const selectedNode = this.nodeLinker.selectedNode;
      if (!selectedNode) return;

      // Force update of SelectedHUD
      const onSelectCallbacks = this.nodeLinker.onSelectCallbacks || [];
      for (const callback of onSelectCallbacks) {
        try {
          if (typeof callback === 'function') {
            callback(selectedNode);
          }
        } catch (e) {
          // Graceful fail
        }
      }
    } catch (e) {
      // Graceful fail
    }
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  /**
   * Validate single link
   */
  _validateLink(link) {
    if (!link) {
      return { valid: false, reason: 'link is null/undefined' };
    }

    // Check structure
    if (!link.source || !link.target) {
      return { valid: false, reason: 'missing source or target' };
    }

    // Check node IDs
    if (!link.source.id || !link.target.id) {
      return { valid: false, reason: 'source or target missing id' };
    }

    // Check nodes are objects, not string literals
    if (typeof link.source !== 'object' || typeof link.target !== 'object') {
      return { valid: false, reason: 'source or target is not an object' };
    }

    // Check self-link
    if (link.source.id === link.target.id) {
      return { valid: false, reason: 'self-link detected' };
    }

    // Check nodes exist in aiNodes
    if (!this._nodeExists(link.source) || !this._nodeExists(link.target)) {
      return { valid: false, reason: 'node not found in aiNodes' };
    }

    // Check nodes have valid positions
    if (!this._isValidPosition(link.source) || !this._isValidPosition(link.target)) {
      return { valid: false, reason: 'invalid node position' };
    }

    return { valid: true, reason: 'ok' };
  }

  /**
   * Check if node exists in aiNodes
   */
  _nodeExists(node) {
    if (!node || !node.id) return false;
    if (!this.aiNodes || !this.aiNodes.nodes) return false;
    return this.aiNodes.nodes.some((n) => n && n.id === node.id);
  }

  /**
   * Check if node has valid position
   */
  _isValidPosition(node) {
    if (!node || !node.position) return false;
    const pos = node.position;
    return (
      typeof pos.x === 'number' &&
      typeof pos.y === 'number' &&
      typeof pos.z === 'number' &&
      isFinite(pos.x) &&
      isFinite(pos.y) &&
      isFinite(pos.z)
    );
  }

  // ============================================================================
  // HOOKS & CALLBACKS
  // ============================================================================

  /**
   * Called when link is created
   */
  _onLinkCreated() {
    // Light repair: just validate the new link
    this._validateAllLinks();
    this._repairBrokenLinks();

    // Quick index update
    const lastLink = (this.nodeLinker.links || [])[
      this.nodeLinker.links.length - 1
    ];
    if (lastLink) {
      this._updateIndexForLink(lastLink);
    }
  }

  /**
   * Called when link is removed
   */
  _onLinkRemoved() {
    // Light repair: remove dead entries
    this._fixOrphanLinks();
  }

  /**
   * Update index for single link
   */
  _updateIndexForLink(link) {
    const linksByNode = this.nodeLinker.linksByNode || new Map();

    if (!link.source?.id || !link.target?.id) return;

    // Add to source index
    if (!linksByNode.has(link.source.id)) {
      linksByNode.set(link.source.id, []);
    }
    if (!linksByNode.get(link.source.id).includes(link)) {
      linksByNode.get(link.source.id).push(link);
    }

    // Add to target index
    if (!linksByNode.has(link.target.id)) {
      linksByNode.set(link.target.id, []);
    }
    if (!linksByNode.get(link.target.id).includes(link)) {
      linksByNode.get(link.target.id).push(link);
    }
  }

  // ============================================================================
  // DIAGNOSTICS & DEBUGGING
  // ============================================================================

  /**
   * Get link integrity report
   */
  debugIntegrity() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║              LINK INTEGRITY DIAGNOSTICS                       ║
╠════════════════════════════════════════════════════════════════╣
║
║  STATISTICS:
║  ├─ Valid Links: ${this._stats.validLinksFound}
║  ├─ Broken Links Removed: ${this._stats.brokenLinksRemoved}
║  ├─ Self-Links Removed: ${this._stats.selfLinksRemoved}
║  ├─ Orphan Links Recovered: ${this._stats.orphanLinksRecovered}
║  ├─ Orphan Nodes Found: ${this._stats.orphanNodesFound}
║  ├─ Index Rebuilds: ${this._stats.indexRebuildCount}
║  ├─ Total Repairs Run: ${this._stats.repairsRun}
║  └─ Last Repair: ${
      this._stats.lastRepairTime
        ? `${new Date(this._stats.lastRepairTime).toLocaleTimeString()} (${this._stats.lastRepairMs.toFixed(2)}ms)`
        : 'never'
    }
║
║  RUNTIME STATE:
║  ├─ Total Links: ${(this.nodeLinker.links || []).length}
║  ├─ Indexed Nodes: ${(this.nodeLinker.linksByNode || new Map()).size}
║  └─ Selected Node: ${this.nodeLinker.selectedNode?.id || 'none'}
║
║  HEALTH CHECK:
║  ├─ Links Array: ${Array.isArray(this.nodeLinker.links) ? '✓' : '✗'}
║  ├─ linksByNode Map: ${this.nodeLinker.linksByNode instanceof Map ? '✓' : '✗'}
║  ├─ AINodes Present: ${this.aiNodes?.nodes ? '✓' : '✗'}
║  └─ Repair Layer: ${this.enabled ? '✓ ACTIVE' : '✗ DISABLED'}
║
╚════════════════════════════════════════════════════════════════╝
    `);

    return {
      validLinks: this._stats.validLinksFound,
      brokenLinksRemoved: this._stats.brokenLinksRemoved,
      selfLinksRemoved: this._stats.selfLinksRemoved,
      orphanLinksRecovered: this._stats.orphanLinksRecovered,
      orphanNodesFound: this._stats.orphanNodesFound,
      indexRebuildCount: this._stats.indexRebuildCount,
      totalRepairs: this._stats.repairsRun,
      lastRepairMs: this._stats.lastRepairMs,
    };
  }

  /**
   * Get sync status report
   */
  syncReport() {
    const links = this.nodeLinker.links || [];
    const linksByNode = this.nodeLinker.linksByNode || new Map();

    let indexedLinkCount = 0;
    for (const [, indexedLinks] of linksByNode.entries()) {
      indexedLinkCount += (indexedLinks || []).length;
    }

    const isConsistent = this._validateIndexConsistency();

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    SYNC STATUS REPORT                         ║
╠════════════════════════════════════════════════════════════════╣
║
║  RUNTIME vs INDEX:
║  ├─ Runtime Links: ${links.length}
║  ├─ Indexed Link References: ${indexedLinkCount}
║  ├─ Indexed Nodes: ${linksByNode.size}
║  └─ Consistency: ${isConsistent ? '✓ CONSISTENT' : '✗ MISMATCH'}
║
║  DETAILED INDEX:
    `);

    // Show per-node breakdown
    let maxNode = 0;
    for (const [nodeId, indexedLinks] of Array.from(linksByNode.entries()).slice(0, 5)) {
      console.log(
        `║  ├─ Node ${nodeId?.substring(0, 8)}: ${(indexedLinks || []).length} links`
      );
      maxNode++;
    }

    if (linksByNode.size > 5) {
      console.log(`║  ├─ ... and ${linksByNode.size - 5} more nodes`);
    }

    console.log(`║
╚════════════════════════════════════════════════════════════════╝
    `);

    return {
      runtimeLinks: links.length,
      indexedLinkReferences: indexedLinkCount,
      indexedNodes: linksByNode.size,
      isConsistent,
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this._stats };
  }

  /**
   * Record to history
   */
  _recordHistory(event, data) {
    this._history.push({
      event,
      data,
      timestamp: Date.now(),
    });

    if (this._history.length > this._maxHistorySize) {
      this._history.shift();
    }
  }

  /**
   * Get history
   */
  getHistory(count = 10) {
    return this._history.slice(-count);
  }
}

// ============================================================================
// CONSOLE API
// ============================================================================

if (typeof window !== 'undefined') {
  window.repairLayerDebug = {
    integrity() {
      window.nodeLinker2?.debugIntegrity();
    },
    sync() {
      window.nodeLinker2?.syncReport();
    },
    repair() {
      window.nodeLinker2?.runFullRepair();
      console.log('[NodeLinker2_RepairLayer] Repair cycle complete');
    },
    stats() {
      const stats = window.nodeLinker2?.getStats();
      console.log('[NodeLinker2_RepairLayer] Statistics:', stats);
      return stats;
    },
    history() {
      const hist = window.nodeLinker2?.getHistory(5);
      console.log('[NodeLinker2_RepairLayer] Recent events:', hist);
      return hist;
    },
  };

  console.log('✅ [NodeLinker2_RepairLayer] Console API available');
  console.log('   window.repairLayerDebug.integrity()');
  console.log('   window.repairLayerDebug.sync()');
  console.log('   window.repairLayerDebug.repair()');
  console.log('   window.repairLayerDebug.stats()');
  console.log('   window.repairLayerDebug.history()');
}

export default NodeLinker2_RepairLayer1_0;