import * as THREE from 'three';

/**
 * Node Grouping System
 * Organize related connections into collapsible clusters
 * Helps manage complex networks with many nodes and links
 */
export class NodeGroup {
  constructor(id, name, options = {}) {
    this.id = id;
    this.name = name;
    this.nodes = new Set();
    this.links = new Set();
    this.parentGroup = null;
    this.childGroups = new Set();
    this.color = options.color || 0x00ddff;
    this.isExpanded = true;
    this.metadata = options.metadata || {};

    // Visual properties
    this.outline = null;
    this.containerMesh = null;
  }

  /**
   * Add node to group
   */
  addNode(node) {
    if (!this.nodes.has(node)) {
      this.nodes.add(node);
      node.userData.group = this.id;
      return true;
    }
    return false;
  }

  /**
   * Remove node from group
   */
  removeNode(node) {
    if (this.nodes.has(node)) {
      this.nodes.delete(node);
      if (node.userData.group === this.id) {
        delete node.userData.group;
      }
      return true;
    }
    return false;
  }

  /**
   * Add link to group
   */
  addLink(link) {
    if (!this.links.has(link)) {
      this.links.add(link);
      link.userData.group = this.id;
      return true;
    }
    return false;
  }

  /**
   * Remove link from group
   */
  removeLink(link) {
    if (this.links.has(link)) {
      this.links.delete(link);
      if (link.userData.group === this.id) {
        delete link.userData.group;
      }
      return true;
    }
    return false;
  }

  /**
   * Set parent group
   */
  setParent(parentGroup) {
    if (this.parentGroup) {
      this.parentGroup.childGroups.delete(this);
    }
    this.parentGroup = parentGroup;
    if (parentGroup) {
      parentGroup.childGroups.add(this);
    }
  }

  /**
   * Collapse group (hide children)
   */
  collapse() {
    this.isExpanded = false;
    this.setNodesVisibility(false);
    this.setLinksVisibility(false);
  }

  /**
   * Expand group (show children)
   */
  expand() {
    this.isExpanded = true;
    this.setNodesVisibility(true);
    this.setLinksVisibility(true);
  }

  /**
   * Set visibility of all nodes in group
   */
  setNodesVisibility(visible) {
    this.nodes.forEach(node => {
      node.visible = visible;
    });
  }

  /**
   * Set visibility of all links in group
   */
  setLinksVisibility(visible) {
    this.links.forEach(link => {
      if (link.group) {
        link.group.visible = visible;
      }
    });
  }

  /**
   * Get all nodes (including nested)
   */
  getAllNodes() {
    const allNodes = new Set(this.nodes);
    this.childGroups.forEach(child => {
      child.getAllNodes().forEach(node => allNodes.add(node));
    });
    return allNodes;
  }

  /**
   * Get all links (including nested)
   */
  getAllLinks() {
    const allLinks = new Set(this.links);
    this.childGroups.forEach(child => {
      child.getAllLinks().forEach(link => allLinks.add(link));
    });
    return allLinks;
  }

  /**
   * Calculate bounds of all nodes in group
   */
  getBounds() {
    if (this.nodes.size === 0) {
      return { center: new THREE.Vector3(), radius: 1 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    this.nodes.forEach(node => {
      const pos = node.position;
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
      minZ = Math.min(minZ, pos.z);
      maxZ = Math.max(maxZ, pos.z);
    });

    const center = new THREE.Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    );

    const radius = Math.sqrt(
      Math.pow(maxX - minX, 2) +
      Math.pow(maxY - minY, 2) +
      Math.pow(maxZ - minZ, 2)
    ) / 2;

    return { center, radius };
  }

  /**
   * Create visual container for group
   */
  createVisualContainer() {
    const bounds = this.getBounds();
    
    // Create bounding sphere outline
    const geometry = new THREE.SphereGeometry(bounds.radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });

    this.containerMesh = new THREE.Mesh(geometry, material);
    this.containerMesh.position.copy(bounds.center);
    this.containerMesh.userData.isGroupContainer = true;
    this.containerMesh.userData.groupId = this.id;

    return this.containerMesh;
  }

  /**
   * Update visual container
   */
  updateVisualContainer() {
    if (this.containerMesh) {
      const bounds = this.getBounds();
      this.containerMesh.position.copy(bounds.center);
      this.containerMesh.scale.setScalar(bounds.radius);
    }
  }

  /**
   * Get group stats
   */
  getStats() {
    return {
      id: this.id,
      name: this.name,
      nodeCount: this.nodes.size,
      linkCount: this.links.size,
      isExpanded: this.isExpanded,
      childGroupCount: this.childGroups.size,
      totalNodes: this.getAllNodes().size,
      totalLinks: this.getAllLinks().size
    };
  }

  /**
   * Dispose
   */
  dispose() {
    if (this.containerMesh) {
      this.containerMesh.geometry.dispose();
      this.containerMesh.material.dispose();
    }
    this.nodes.clear();
    this.links.clear();
    this.childGroups.clear();
  }
}

/**
 * Node Grouping Manager
 * Manages collections of node groups
 */
export class NodeGroupingManager {
  constructor(scene) {
    this.scene = scene;
    this.groups = new Map();
    this.groupHierarchy = [];
    this.groupsLayer = new THREE.Group();
    this.scene.add(this.groupsLayer);

    // Interaction
    this.selectedGroup = null;
    this.collapsedGroups = new Set();
  }

  /**
   * Create new group
   */
  createGroup(name, options = {}) {
    const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const group = new NodeGroup(id, name, options);
    this.groups.set(id, group);
    this.groupHierarchy.push(group);
    
    console.log(`✓ Created group: ${name} (${id})`);
    return group;
  }

  /**
   * Get group by id
   */
  getGroup(id) {
    return this.groups.get(id);
  }

  /**
   * Delete group
   */
  deleteGroup(id) {
    const group = this.groups.get(id);
    if (group) {
      group.dispose();
      this.groups.delete(id);
      this.groupHierarchy = this.groupHierarchy.filter(g => g.id !== id);
      return true;
    }
    return false;
  }

  /**
   * Add nodes to group
   */
  addNodesToGroup(groupId, nodes) {
    const group = this.getGroup(groupId);
    if (!group) return 0;

    let added = 0;
    nodes.forEach(node => {
      if (group.addNode(node)) added++;
    });
    return added;
  }

  /**
   * Create automatic groups based on connectivity
   */
  createAutoGroups(nodes, linkingSystem) {
    // Simple clustering: find connected components
    const visited = new Set();
    const clusters = [];

    nodes.forEach(node => {
      if (!visited.has(node)) {
        const cluster = this.dfsCluster(node, visited, linkingSystem);
        clusters.push(cluster);
      }
    });

    // Create groups for each cluster
    clusters.forEach((cluster, index) => {
      const group = this.createGroup(`Cluster_${index + 1}`, {
        color: this.getClusterColor(index)
      });
      cluster.forEach(node => group.addNode(node));
    });

    return clusters;
  }

  /**
   * Depth-first search for clustering
   */
  dfsCluster(startNode, visited, linkingSystem) {
    const cluster = [];
    const stack = [startNode];

    while (stack.length > 0) {
      const node = stack.pop();
      if (visited.has(node)) continue;

      visited.add(node);
      cluster.push(node);

      // Find connected nodes via links
      const connectedNodes = linkingSystem.links
        .filter(link => link.source === node || link.target === node)
        .map(link => link.source === node ? link.target : link.source)
        .filter(n => !visited.has(n));

      stack.push(...connectedNodes);
    }

    return cluster;
  }

  /**
   * Get color for cluster index
   */
  getClusterColor(index) {
    const colors = [
      0x00ddff,  // Cyan
      0xff00ff,  // Magenta
      0x00ff88,  // Green
      0xffaa00,  // Orange
      0xaa00ff,  // Violet
      0xff0088   // Pink
    ];
    return colors[index % colors.length];
  }

  /**
   * Toggle group expansion
   */
  toggleGroupExpansion(groupId) {
    const group = this.getGroup(groupId);
    if (!group) return false;

    if (group.isExpanded) {
      group.collapse();
      this.collapsedGroups.add(groupId);
    } else {
      group.expand();
      this.collapsedGroups.delete(groupId);
    }

    return group.isExpanded;
  }

  /**
   * Collapse all groups
   */
  collapseAll() {
    this.groups.forEach(group => {
      group.collapse();
      this.collapsedGroups.add(group.id);
    });
  }

  /**
   * Expand all groups
   */
  expandAll() {
    this.groups.forEach(group => {
      group.expand();
      this.collapsedGroups.delete(group.id);
    });
  }

  /**
   * Select group
   */
  selectGroup(groupId) {
    if (this.selectedGroup) {
      // Deselect previous
      const prevGroup = this.getGroup(this.selectedGroup);
      if (prevGroup && prevGroup.containerMesh) {
        prevGroup.containerMesh.material.opacity = 0.3;
      }
    }

    this.selectedGroup = groupId;
    const group = this.getGroup(groupId);
    if (group && group.containerMesh) {
      group.containerMesh.material.opacity = 0.6;
    }
  }

  /**
   * Visualize all groups
   */
  visualizeAllGroups() {
    this.groups.forEach(group => {
      const container = group.createVisualContainer();
      this.groupsLayer.add(container);
    });
  }

  /**
   * Clear all visualizations
   */
  clearVisualizations() {
    this.groupsLayer.clear();
  }

  /**
   * Update all group visualizations
   */
  updateVisualizations() {
    this.groups.forEach(group => {
      group.updateVisualContainer();
    });
  }

  /**
   * Get group stats for all groups
   */
  getAllStats() {
    const stats = [];
    this.groups.forEach(group => {
      stats.push(group.getStats());
    });
    return stats;
  }

  /**
   * Get network summary
   */
  getNetworkSummary() {
    let totalNodes = 0;
    let totalLinks = 0;
    
    this.groups.forEach(group => {
      totalNodes += group.nodes.size;
      totalLinks += group.links.size;
    });

    return {
      groupCount: this.groups.size,
      totalNodes,
      totalLinks,
      expandedGroups: this.groups.size - this.collapsedGroups.size,
      collapsedGroups: this.collapsedGroups.size
    };
  }

  /**
   * Export group structure
   */
  exportGroupStructure() {
    const exported = [];
    this.groups.forEach(group => {
      exported.push({
        id: group.id,
        name: group.name,
        nodes: Array.from(group.nodes).map(n => n.userData.id || n.uuid),
        links: Array.from(group.links).map(l => ({ source: l.source.uuid, target: l.target.uuid })),
        isExpanded: group.isExpanded,
        metadata: group.metadata
      });
    });
    return exported;
  }

  /**
   * Dispose
   */
  dispose() {
    this.groups.forEach(group => group.dispose());
    this.groups.clear();
    this.groupsLayer.removeFromParent();
  }
}
