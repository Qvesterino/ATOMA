/**
 * ATOMA — NetworkMembershipResolver
 * ---------------------------------
 * Single source of truth for:
 * - what a network is
 * - which nodes belong to which network
 *
 * This module DOES NOT:
 * - calculate metrics
 * - touch rendering
 * - modify nodes or links
 *
 * It only resolves connectivity.
 */

export class NetworkMembershipResolver {
  constructor({ nodeMap, linkSystem }) {
    this.nodeMap = nodeMap;       // Map<nodeId, node>
    this.linkSystem = linkSystem; // must expose getLinksForNode(nodeId)

    this.networks = new Map();    // networkId -> Set<nodeId>
    this.nodeToNetwork = new Map(); // nodeId -> networkId
  }

  /**
   * Recompute all networks from scratch.
   * Safe to call after:
   * - link creation
   * - link removal
   * - scene reset
   */
  resolve() {
    this.networks.clear();
    this.nodeToNetwork.clear();

    const visited = new Set();
    let networkIndex = 0;

    for (const [nodeId] of this.nodeMap) {
      if (visited.has(nodeId)) continue;

      const connectedNodes = this._collectConnectedComponent(nodeId);

      // Contract rule:
      // A network exists ONLY if at least one link exists
      if (connectedNodes.size < 2) {
        visited.add(nodeId);
        continue;
      }

      const networkId = `network_${networkIndex++}`;
      this.networks.set(networkId, connectedNodes);

      for (const id of connectedNodes) {
        visited.add(id);
        this.nodeToNetwork.set(id, networkId);
      }
    }
  }

  /**
   * DFS over link connectivity
   */
  _collectConnectedComponent(startNodeId) {
    const stack = [startNodeId];
    const component = new Set();

    while (stack.length > 0) {
      const nodeId = stack.pop();
      if (component.has(nodeId)) continue;

      component.add(nodeId);

      const links = this.linkSystem.getLinksForNode(nodeId) || [];
      for (const link of links) {
        const otherNodeId =
          link.nodeA === nodeId ? link.nodeB : link.nodeA;

        if (!component.has(otherNodeId)) {
          stack.push(otherNodeId);
        }
      }
    }

    return component;
  }

  /**
   * Public API
   */

  getNetworks() {
    return this.networks;
  }

  getNetworkForNode(nodeId) {
    return this.nodeToNetwork.get(nodeId) || null;
  }

  getNodesInNetwork(networkId) {
    return this.networks.get(networkId) || new Set();
  }

  hasAnyNetwork() {
    return this.networks.size > 0;
  }

  getNetworkCount() {
    return this.networks.size;
  }
}
