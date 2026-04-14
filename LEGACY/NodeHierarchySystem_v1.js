import * as THREE from 'three';

/**
 * Node Hierarchy System v1.0 — Parent-Child Node Relationships
 * 
 * Sophisticated hierarchical structure for organizing nodes into parent-child relationships.
 * Enables:
 * - Parent node aggregation of child metrics
 * - Cascading property inheritance (corruption, harmony, stress)
 * - Hierarchical visualization and interaction
 * - Parent-child event propagation
 * - Dynamic reparenting and tree restructuring
 * 
 * Architecture:
 * - Pure data system (no rendering)
 * - Maintains forest of hierarchies (multiple roots)
 * - Event-driven property updates
 * - Efficient ancestor/descendant queries
 */
export class NodeHierarchySystem {
  constructor() {
    // ========== CORE DATA STRUCTURES ==========
    // Node ID → hierarchy node wrapper
    this.hierarchyNodeMap = new Map();
    
    // Root nodes (parents with no parent)
    this.roots = new Set();
    
    // Event system
    this.onHierarchyChanged = [];  // { nodeId, changeType, parent, children }
    this.onPropertyInherited = [];  // { nodeId, property, value, source }
    this.onReparented = [];         // { nodeId, oldParent, newParent }
    
    // Configuration
    this.config = {
      // Enable cascading property propagation
      cascadeProperties: true,
      // Enable ancestor-descendant event notification
      cascadeEvents: true,
      // Maximum hierarchy depth (prevents infinite cycles)
      maxDepth: 16,
      // Property inheritance rules
      inheritableProperties: ['corruption', 'harmony', 'stress', 'stability']
    };
    
    // Metrics aggregation
    this.aggregationCache = new Map();  // nodeId → aggregated metrics
    this._aggregationDirty = new Set(); // Nodes needing recalculation
  }

  /**
   * Create a new hierarchy node
   */
  createNode(nodeId, metadata = {}) {
    if (this.hierarchyNodeMap.has(nodeId)) {
      console.warn(`[NodeHierarchySystem] Node ${nodeId} already exists in hierarchy`);
      return this.hierarchyNodeMap.get(nodeId);
    }

    const hierarchyNode = {
      nodeId,
      parent: null,
      children: new Set(),
      metadata: { ...metadata },
      depth: 0,
      createdAt: Date.now(),
      properties: {
        corruption: 0,
        harmony: 0,
        stress: 0,
        stability: 1,
        inheritedFrom: new Map()  // Track property sources
      }
    };

    this.hierarchyNodeMap.set(nodeId, hierarchyNode);
    this.roots.add(hierarchyNode);
    this.aggregationCache.set(nodeId, this._createAggregationEntry());
    
    return hierarchyNode;
  }

  /**
   * Set a node's parent (establishes parent-child relationship)
   * Returns success boolean
   */
  setParent(nodeId, parentId) {
    const child = this.hierarchyNodeMap.get(nodeId);
    const parent = this.hierarchyNodeMap.get(parentId);

    if (!child || !parent) {
      console.error(`[NodeHierarchySystem] Invalid node IDs for reparenting: ${nodeId} → ${parentId}`);
      return false;
    }

    // Prevent cycles
    if (this._wouldCreateCycle(child, parent)) {
      console.error(`[NodeHierarchySystem] Cannot set parent (would create cycle): ${nodeId} → ${parentId}`);
      return false;
    }

    // Prevent depth overflow
    const parentDepth = parent.depth + 1;
    if (parentDepth > this.config.maxDepth) {
      console.error(`[NodeHierarchySystem] Cannot set parent (exceeds max depth): ${parentDepth}`);
      return false;
    }

    const oldParent = child.parent;
    
    // Remove from old parent
    if (oldParent) {
      oldParent.children.delete(child);
    }
    
    // If was a root, remove from roots
    if (this.roots.has(child)) {
      this.roots.delete(child);
    }

    // Set new parent
    child.parent = parent;
    parent.children.add(child);
    
    // Update depth (recalculate subtree)
    this._updateSubtreeDepth(child);
    
    // Mark aggregation dirty (propagate up)
    this._markAggregationDirty(parentId);

    // Notify listeners
    this._notifyReparented(nodeId, oldParent, parent);

    return true;
  }

  /**
   * Remove parent (detach from hierarchy, becomes new root)
   */
  detach(nodeId) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node || !node.parent) return false;

    const oldParent = node.parent;
    
    // Remove from parent's children
    oldParent.children.delete(node);
    
    // Become a root
    node.parent = null;
    node.depth = 0;
    this.roots.add(node);
    
    // Mark aggregation dirty
    this._markAggregationDirty(oldParent.nodeId);
    
    // Notify
    this._notifyReparented(nodeId, oldParent, null);
    
    return true;
  }

  /**
   * Get all ancestors (parent, grandparent, etc.)
   */
  getAncestors(nodeId) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node) return [];

    const ancestors = [];
    let current = node.parent;
    while (current) {
      ancestors.push(current.nodeId);
      current = current.parent;
    }
    return ancestors;
  }

  /**
   * Get all descendants (children, grandchildren, etc.)
   */
  getDescendants(nodeId) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node) return [];

    const descendants = [];
    const queue = [node];

    while (queue.length > 0) {
      const current = queue.shift();
      for (const child of current.children) {
        descendants.push(child.nodeId);
        queue.push(child);
      }
    }

    return descendants;
  }

  /**
   * Get all direct children
   */
  getChildren(nodeId) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node) return [];
    return Array.from(node.children).map(c => c.nodeId);
  }

  /**
   * Get parent node ID
   */
  getParent(nodeId) {
    const node = this.hierarchyNodeMap.get(nodeId);
    return node?.parent?.nodeId ?? null;
  }

  /**
   * Get hierarchy depth (0 = root, increases downward)
   */
  getDepth(nodeId) {
    const node = this.hierarchyNodeMap.get(nodeId);
    return node?.depth ?? -1;
  }

  /**
   * Set inheritable property (corrupton, harmony, stress, stability)
   * Cascades to descendants if configured
   */
  setProperty(nodeId, property, value) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node) return false;

    if (!this.config.inheritableProperties.includes(property)) {
      console.warn(`[NodeHierarchySystem] Property not inheritable: ${property}`);
      return false;
    }

    const oldValue = node.properties[property];
    node.properties[property] = value;
    
    // Mark aggregation dirty
    this._markAggregationDirty(nodeId);

    // Cascade to descendants if enabled
    if (this.config.cascadeProperties) {
      this._cascadePropertyToDescendants(nodeId, property, value);
    }

    return true;
  }

  /**
   * Get property (with potential inheritance from parent)
   */
  getProperty(nodeId, property, includeInheritance = true) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node) return null;

    const value = node.properties[property];
    if (value !== undefined) return value;

    // Try to inherit from parent
    if (includeInheritance && node.parent) {
      return this.getProperty(node.parent.nodeId, property, true);
    }

    return null;
  }

  /**
   * Get aggregated metrics for node + all children
   */
  getAggregatedMetrics(nodeId) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node) return null;

    // Check if aggregation is dirty
    if (this._aggregationDirty.has(nodeId)) {
      this._recalculateAggregation(nodeId);
    }

    return this.aggregationCache.get(nodeId);
  }

  /**
   * Get subtree size (node + all descendants)
   */
  getSubtreeSize(nodeId) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node) return 0;

    let size = 1;
    for (const child of node.children) {
      size += this.getSubtreeSize(child.nodeId);
    }
    return size;
  }

  /**
   * Reorganize hierarchy to balance tree depth
   * (Moves children up if parent is heavily nested)
   */
  rebalanceHierarchy() {
    const rebalanced = [];

    for (const root of this.roots) {
      this._rebalanceSubtree(root, rebalanced);
    }

    return rebalanced;
  }

  /**
   * Get all hierarchy roots (top-level parents)
   */
  getRoots() {
    return Array.from(this.roots).map(r => r.nodeId);
  }

  /**
   * Serialize hierarchy to JSON
   */
  serialize() {
    const data = {
      nodes: {},
      roots: Array.from(this.roots).map(r => r.nodeId)
    };

    for (const [nodeId, node] of this.hierarchyNodeMap) {
      data.nodes[nodeId] = {
        parent: node.parent?.nodeId ?? null,
        children: Array.from(node.children).map(c => c.nodeId),
        depth: node.depth,
        metadata: node.metadata,
        properties: {
          corruption: node.properties.corruption,
          harmony: node.properties.harmony,
          stress: node.properties.stress,
          stability: node.properties.stability
        }
      };
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Remove node from hierarchy
   */
  removeNode(nodeId) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node) return false;

    // Detach from parent (makes children new roots)
    if (node.parent) {
      node.parent.children.delete(node);
      for (const child of node.children) {
        child.parent = null;
        child.depth = 0;
        this.roots.add(child);
      }
    }

    // Remove from hierarchy
    this.hierarchyNodeMap.delete(nodeId);
    this.roots.delete(node);
    this.aggregationCache.delete(nodeId);
    this._aggregationDirty.delete(nodeId);

    // Notify
    this._notifyHierarchyChanged(nodeId, 'removed', null, []);

    return true;
  }

  // =========== PRIVATE HELPERS ===========

  /**
   * Detect if setting parent would create a cycle
   */
  _wouldCreateCycle(child, potentialParent) {
    let current = potentialParent;
    while (current) {
      if (current === child) return true;
      current = current.parent;
    }
    return false;
  }

  /**
   * Update depth for entire subtree after reparenting
   */
  _updateSubtreeDepth(node) {
    const parentDepth = node.parent ? node.parent.depth : -1;
    node.depth = parentDepth + 1;

    for (const child of node.children) {
      this._updateSubtreeDepth(child);
    }
  }

  /**
   * Cascade property value to all descendants
   */
  _cascadePropertyToDescendants(nodeId, property, value) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node) return;

    const multiplier = property === 'stability' ? 0.95 : 1.0;  // Reduce stability slightly per level
    
    for (const child of node.children) {
      const cascadedValue = value * multiplier;
      child.properties[property] = cascadedValue;
      child.properties.inheritedFrom.set(property, nodeId);
      this._markAggregationDirty(child.nodeId);
      
      // Recursively cascade
      this._cascadePropertyToDescendants(child.nodeId, property, cascadedValue);
    }
  }

  /**
   * Mark node and ancestors as needing aggregation recalculation
   */
  _markAggregationDirty(nodeId) {
    let current = this.hierarchyNodeMap.get(nodeId);
    while (current) {
      this._aggregationDirty.add(current.nodeId);
      current = current.parent;
    }
  }

  /**
   * Recalculate aggregated metrics
   */
  _recalculateAggregation(nodeId) {
    const node = this.hierarchyNodeMap.get(nodeId);
    if (!node) return;

    const metrics = this._createAggregationEntry();
    
    // Add self
    metrics.nodeCount = 1;
    metrics.corruption += node.properties.corruption;
    metrics.harmony += node.properties.harmony;
    metrics.stress += node.properties.stress;
    metrics.stability *= node.properties.stability;

    // Add all descendants
    for (const child of node.children) {
      const childMetrics = this.getAggregatedMetrics(child.nodeId);
      metrics.nodeCount += childMetrics.nodeCount;
      metrics.corruption += childMetrics.corruption;
      metrics.harmony += childMetrics.harmony;
      metrics.stress += childMetrics.stress;
      metrics.stability *= (childMetrics.stability / childMetrics.nodeCount);
    }

    // Average some metrics
    metrics.corruption /= metrics.nodeCount;
    metrics.harmony /= metrics.nodeCount;
    metrics.stress /= metrics.nodeCount;

    this.aggregationCache.set(nodeId, metrics);
    this._aggregationDirty.delete(nodeId);
  }

  /**
   * Create empty aggregation entry
   */
  _createAggregationEntry() {
    return {
      nodeCount: 0,
      corruption: 0,
      harmony: 0,
      stress: 0,
      stability: 1
    };
  }

  /**
   * Rebalance subtree to minimize depth
   */
  _rebalanceSubtree(node, rebalanced) {
    // If depth > 4 and has siblings, move children up
    if (node.depth > 4 && node.parent && node.parent.children.size > 1) {
      for (const child of Array.from(node.children)) {
        this.setParent(child.nodeId, node.parent.nodeId);
        rebalanced.push({ nodeId: child.nodeId, action: 'moved_up' });
      }
    }

    // Recursively rebalance children
    for (const child of node.children) {
      this._rebalanceSubtree(child, rebalanced);
    }
  }

  // =========== EVENT NOTIFICATIONS ===========

  /**
   * Notify listeners of hierarchy changes
   */
  _notifyHierarchyChanged(nodeId, changeType, parent, children) {
    for (const callback of this.onHierarchyChanged) {
      try {
        callback({ nodeId, changeType, parent: parent?.nodeId ?? null, children });
      } catch (err) {
        console.error('[NodeHierarchySystem] Callback error:', err);
      }
    }
  }

  /**
   * Notify of property inheritance
   */
  _notifyPropertyInherited(nodeId, property, value, source) {
    for (const callback of this.onPropertyInherited) {
      try {
        callback({ nodeId, property, value, source });
      } catch (err) {
        console.error('[NodeHierarchySystem] Property callback error:', err);
      }
    }
  }

  /**
   * Notify of reparenting
   */
  _notifyReparented(nodeId, oldParent, newParent) {
    for (const callback of this.onReparented) {
      try {
        callback({ nodeId, oldParent: oldParent?.nodeId ?? null, newParent: newParent?.nodeId ?? null });
      } catch (err) {
        console.error('[NodeHierarchySystem] Reparent callback error:', err);
      }
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================
export const nodeHierarchySystem = new NodeHierarchySystem();
