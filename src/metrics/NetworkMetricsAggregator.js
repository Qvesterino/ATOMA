/**
 * ATOMA — NetworkMetricsAggregator
 * --------------------------------
 * Computes canonical NETWORK metrics strictly from resolved networks.
 */

// Debug flag - set to true for console output during development
const DEBUG_NETWORK_METRICS = false;

export class NetworkMetricsAggregator {
  constructor({ networkResolver }) {
    this.networkResolver = networkResolver;
  }

  // ============================================================
  // SIMPLE MODE (with link influence)
  // ============================================================
  compute() {
    const networks = this.networkResolver.getNetworks();
    if (!networks || networks.size === 0) {
      return this._emptyMetrics();
    }

    let totals = this._createTotals();
    let contributingNodes = 0;
    const processedLinks = new Set(); // Track links to avoid double-counting

    // Aggregate node metrics
    for (const nodes of networks.values()) {
      for (const nodeId of nodes) {
        const node = this._getNode(nodeId);
        if (!node || !node.userData?.metrics) continue;

        this._accumulateNodeMetrics(totals, node.userData.metrics, 1);
        contributingNodes++;
      }
    }

    // Add link influence to totals
    for (const nodes of networks.values()) {
      for (const nodeId of nodes) {
        const node = this._getNode(nodeId);
        if (!node) continue;

        // Get links for this node
        const links = this.networkResolver.linkSystem?.getLinksForNode(nodeId);
        if (!links || links.length === 0) continue;

        for (const link of links) {
          // Avoid processing same link twice
          const linkId = link.id || `${nodeId}-${this._getNodeId(link.source === node ? link.target : link.source)}`;
          if (processedLinks.has(linkId)) continue;
          processedLinks.add(linkId);

          // Calculate and add link influence
          const influence = this._calculateLinkInfluence(link.source, link.target);
          totals.synergy += influence.synergy;
          totals.harmony += influence.harmony;
          totals.stability += influence.stress; // Negative stress reduces stability
        }
      }
    }

    if (contributingNodes === 0) {
      return this._emptyMetrics();
    }

    const result = this._finalizeMetrics(
      totals,
      contributingNodes,
      networks.size
    );

    this._debugLog("SIMPLE", totals, contributingNodes, networks.size, result);
    return result;
  }

  // ============================================================
  // WEIGHTED MODE (link quality + link influence)
  // ============================================================
  computeWeighted() {
    const networks = this.networkResolver.getNetworks();
    if (!networks || networks.size === 0) {
      return this._emptyMetrics();
    }

    let totals = this._createTotals();
    let totalWeight = 0;
    const processedLinks = new Set(); // Track links to avoid double-counting

    for (const nodes of networks.values()) {
      for (const nodeId of nodes) {
        const node = this._getNode(nodeId);
        if (!node || !node.userData?.metrics) continue;

        const links = this.networkResolver.linkSystem?.getLinksForNode(nodeId);
        if (!links || links.length === 0) continue;

        const nodeWeight = links.reduce((sum, l) => sum + (l.quality ?? 0.5), 0) / links.length;

        this._accumulateNodeMetrics(
          totals,
          node.userData.metrics,
          nodeWeight
        );

        totalWeight += nodeWeight;

        // Add link influence (weighted by link quality)
        for (const link of links) {
          // Avoid processing same link twice
          const linkId = link.id || `${nodeId}-${this._getNodeId(link.source === node ? link.target : link.source)}`;
          if (processedLinks.has(linkId)) continue;
          processedLinks.add(linkId);

          // Calculate link influence
          const baseInfluence = this._calculateLinkInfluence(link.source, link.target);
          
          // Weight influence by link quality
          const linkQuality = link.quality ?? 0.5;
          const weightedInfluence = {
            synergy: baseInfluence.synergy * linkQuality,
            harmony: baseInfluence.harmony * linkQuality,
            stress: baseInfluence.stress * linkQuality
          };

          // Add to totals
          totals.synergy += weightedInfluence.synergy;
          totals.harmony += weightedInfluence.harmony;
          totals.stability += weightedInfluence.stress;
        }
      }
    }

    if (totalWeight === 0) {
      return this._emptyMetrics();
    }

    const result = this._finalizeMetrics(
      totals,
      totalWeight,
      networks.size
    );

    this._debugLog("WEIGHTED", totals, totalWeight, networks.size, result);
    return result;
  }

  // ============================================================
  // HELPERS
  // ============================================================
  /**
   * Calculate link influence on network metrics
   * Links provide bonus synergy/harmony and reduce stability (increase stress)
   * 
   * @param {Object} sourceNode - Source node object
   * @param {Object} targetNode - Target node object
   * @returns {Object} Influence values { synergy, harmony, stress }
   * @private
   */
  _calculateLinkInfluence(sourceNode, targetNode) {
    if (!sourceNode?.userData?.category || !targetNode?.userData?.category) {
      return { synergy: 0, harmony: 0, stress: 0 };
    }

    const sourceCategory = sourceNode.userData.category;
    const targetCategory = targetNode.userData.category;

    // Category matching: 1.0x if match, 0.5x if differ
    const categoriesMatch = sourceCategory === targetCategory;
    const categoryMultiplier = categoriesMatch ? 1.0 : 0.5;

    // Base influence per link
    const baseInfluence = {
      synergy: 0.05,
      harmony: 0.04,
      stress: -0.02
    };

    return {
      synergy: baseInfluence.synergy * categoryMultiplier,
      harmony: baseInfluence.harmony * categoryMultiplier,
      stress: baseInfluence.stress * categoryMultiplier
    };
  }

  _getNode(nodeId) {
    return this.networkResolver.nodeMap.get(nodeId);
  }

  _getNodeId(node) {
    if (!node || !node.userData) return undefined;
    return node.userData.id || node.id;
  }

  _createTotals() {
    return {
      synergy: 0,
      harmony: 0,
      stability: 0,
      corruption: 0,
      loadPressure: 0,
    };
  }

  _accumulateNodeMetrics(totals, metrics, weight) {
    totals.synergy += (metrics.synergy ?? 0) * weight;
    totals.harmony += (metrics.harmony ?? 0) * weight;
    totals.stability += (metrics.stability ?? 0) * weight;
    totals.corruption += (metrics.corruption ?? 0) * weight;
    totals.loadPressure += (metrics.loadPressure ?? 0) * weight;
  }

  _finalizeMetrics(totals, divisor, networkCount) {
    if (divisor === 0) {
      return this._emptyMetrics();
    }

    const result = {
      networkSynergy: this._clamp(totals.synergy / divisor),
      harmonyFlow: this._clamp(totals.harmony / divisor),
      networkStress: this._clamp(totals.stability / divisor),
      corruptionLevel: this._clamp(totals.corruption / divisor),
      loadPressure: this._clamp(totals.loadPressure / divisor),

      // 🔍 safe introspection
      nodeCount: divisor,
      networkCount,
    };

    if (DEBUG_NETWORK_METRICS) {
      console.groupCollapsed(
        "%c[NETWORK METRICS DEBUG]",
        "color:#00ffff;font-weight:bold"
      );
      console.log("Totals:", totals);
      console.log("Divisor:", divisor);
      console.log("Network count:", networkCount);
      console.log("Result:", result);
      console.groupEnd();
    }

    return result;
  }

  _emptyMetrics() {
    return {
      networkSynergy: 0,
      harmonyFlow: 0,
      networkStress: 0,
      corruptionLevel: 0,
      loadPressure: 0,
      nodeCount: 0,
      networkCount: 0,
    };
  }

  _clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  _debugLog(mode, totals, divisor, networkCount, result) {
    if (!DEBUG_NETWORK_METRICS) return;

    console.groupCollapsed(
      `%c[AGGREGATOR ${mode}]`,
      "color:#ff66ff;font-weight:bold"
    );
    console.log("Totals:", totals);
    console.log("Divisor:", divisor);
    console.log("Networks:", networkCount);
    console.log("Result:", result);
    console.groupEnd();
  }
}