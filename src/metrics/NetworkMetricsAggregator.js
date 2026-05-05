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

  compute() {
    const totalLinks = this._countTotalLinks();
    if (totalLinks === 0) {
      return this._emptyMetrics();
    }

    if (typeof this.networkResolver?.resolve === 'function') {
      this.networkResolver.resolve();
    }

    const networks = this.networkResolver.getNetworks();
    if (!networks || networks.size === 0) {
      return this._emptyMetrics();
    }

    const totals = this._createTotals();
    let totalWeight = 0;
    let contributingNodes = 0;
    let totalLinkQuality = 0;
    let processedLinkCount = 0;
    const processedLinks = new Set();

    for (const nodes of networks.values()) {
      for (const nodeId of nodes) {
        const node = this._getNode(nodeId);
        if (!node) continue;
        if (!node.userData?.metrics) continue;
        const links = this._getLinksForNode(nodeId);
        const degree = links?.length || 0;
        if (degree === 0) continue;

        const nodeWeight = this._calculateNodeWeight(links);
        this._accumulateNodeMetrics(totals, node.userData.metrics, nodeWeight, node);
        totalWeight += nodeWeight;
        contributingNodes++;
      }
    }

    for (const nodes of networks.values()) {
      for (const nodeId of nodes) {
        const node = this._getNode(nodeId);
        if (!node) continue;
        const links = this.networkResolver.linkSystem?.getLinksForNode(nodeId);
        if (!links || links.length === 0) continue;

        for (const link of links) {
          const linkId = this._getLinkId(link, nodeId, node);
          if (processedLinks.has(linkId)) continue;
          processedLinks.add(linkId);

          const linkQuality = this._resolveLinkQuality(link);
          const influence = this._calculateLinkInfluence(link.source, link.target, linkQuality);
          totals.synergy += influence.synergy;
          totals.harmony += influence.harmony;
          totals.stability += influence.stress;
          totalLinkQuality += linkQuality;
          processedLinkCount++;
        }
      }
    }

    if (contributingNodes === 0 || totalWeight === 0) {
      return this._emptyMetrics();
    }

    const result = this._finalizeMetrics(
      totals,
      totalWeight,
      networks.size,
      {
        contributingNodes,
        avgLinkQuality: processedLinkCount > 0 ? totalLinkQuality / processedLinkCount : 0,
        aggregatorMode: 'hybrid'
      }
    );

    this._debugLog("HYBRID", totals, totalWeight, networks.size, result);
    return result;
  }

  computeWeighted() {
    // Backward-compatible alias for any older debug tooling.
    return this.compute();
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
  _calculateLinkInfluence(sourceNode, targetNode, quality = 0.5) {
    if (!sourceNode?.userData?.category || !targetNode?.userData?.category) {
      return { synergy: 0, harmony: 0, stress: 0 };
    }

    const sourceCategory = sourceNode.userData.category;
    const targetCategory = targetNode.userData.category;

    // Category matching: mixed-category links are still slightly weaker,
    // but they should remain viable for release gameplay networks.
    const categoriesMatch = sourceCategory === targetCategory;
    const categoryMultiplier = categoriesMatch ? 1.0 : 0.65;
    const baseInfluence = {
      synergy: 0.07,
      harmony: 0.05,
      stress: -0.015
    };
    const qualityMultiplier = this._clamp(quality);

    return {
      synergy: baseInfluence.synergy * categoryMultiplier * qualityMultiplier,
      harmony: baseInfluence.harmony * categoryMultiplier * qualityMultiplier,
      stress: baseInfluence.stress * categoryMultiplier * qualityMultiplier
    };
  }

  _getNode(nodeId) {
    return this.networkResolver.nodeMap.get(nodeId);
  }

  _getLinksForNode(nodeId) {
    return this.networkResolver.linkSystem?.getLinksForNode(nodeId) || [];
  }

  _getLinkId(link, nodeId = 'a', node = null) {
    if (link?.id != null) return link.id;
    const sourceNode = link?.source === node ? link?.target : link?.source;
    return `${nodeId}-${this._getNodeId(sourceNode) ?? this._getNodeId(link?.target) ?? this._getNodeId(link?.nodeB) ?? 'b'}`;
  }

  _getNodeId(node) {
    if (!node || !node.userData) return undefined;
    return node.userData.id || node.id;
  }

  _resolveLinkQuality(link) {
    const quality = link?.userData?.quality;
    const candidates = [
      quality?.normalizedScore,
      link?.quality,
      quality?.score,
      quality?.qualityScore,
      quality
    ];
    for (const candidate of candidates) {
      const numeric = Number(candidate);
      if (!Number.isFinite(numeric)) continue;
      return this._clamp(numeric > 1 ? numeric / 100 : numeric);
    }
    return 0.5;
  }

  _calculateNodeWeight(links) {
    const safeLinks = Array.isArray(links) ? links : [];
    if (!safeLinks.length) return 0.6;
    const avgConnectedLinkQuality = safeLinks.reduce((sum, link) => sum + this._resolveLinkQuality(link), 0) / safeLinks.length;
    const degreeBonus = Math.min(0.20, 0.05 * Math.max(0, safeLinks.length - 1));
    return this._clamp(0.6 + (0.4 * avgConnectedLinkQuality) + degreeBonus, 0.6, 1.2);
  }

  _countTotalLinks() {
    // direct list if available
    if (Array.isArray(this.networkResolver?.linkSystem?.links)) {
      return this.networkResolver.linkSystem.links.length;
    }
    const getLinksForNode = this.networkResolver?.linkSystem?.getLinksForNode;
    const nodeMap = this.networkResolver?.nodeMap;
    if (typeof getLinksForNode === 'function' && nodeMap instanceof Map) {
      const seen = new Set();
      for (const nodeId of nodeMap.keys()) {
        const links = getLinksForNode(nodeId) || [];
        for (const l of links) {
          const id = l?.id || `${l?.nodeA ?? l?.source ?? 'a'}-${l?.nodeB ?? l?.target ?? 'b'}`;
          if (id) seen.add(id);
        }
      }
      return seen.size;
    }
    return 0;
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

  _accumulateNodeMetrics(totals, metrics, weight, node = null) {
    const archetypeMetrics = node?.userData?.archetypeMetrics || {};
    totals.synergy += (metrics.synergy ?? 0) * weight;
    totals.harmony += (metrics.harmony ?? 0) * weight;
    totals.stability += (metrics.stability ?? 0) * weight;
    totals.corruption += Math.max(metrics.corruption ?? 0, archetypeMetrics.corruption ?? 0) * weight;
    totals.loadPressure += (metrics.loadPressure ?? 0) * weight;
  }

  _finalizeMetrics(totals, divisor, networkCount, diagnostics = {}) {
    if (divisor === 0) {
      return this._emptyMetrics();
    }
    const stability = this._clamp(totals.stability / divisor);

    const result = {
      networkSynergy: this._clamp(totals.synergy / divisor),
      harmonyFlow: this._clamp(totals.harmony / divisor),
      networkStress: this._clamp(1 - stability),
      stability,
      stabilityNorm: stability,
      corruptionLevel: this._clamp(totals.corruption / divisor),
      loadPressure: this._clamp(totals.loadPressure / divisor),

      // 🔍 safe introspection
      nodeCount: diagnostics.contributingNodes ?? divisor,
      networkCount,
      avgLinkQuality: this._clamp(diagnostics.avgLinkQuality ?? 0),
      aggregatorMode: diagnostics.aggregatorMode ?? 'hybrid',
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
      stability: 1,
      stabilityNorm: 1,
      corruptionLevel: 0,
      loadPressure: 0,
      nodeCount: 0,
      networkCount: 0,
    };
  }

  _clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
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
