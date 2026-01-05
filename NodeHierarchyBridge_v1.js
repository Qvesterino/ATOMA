import * as THREE from 'three';
import { nodeHierarchySystem } from './NodeHierarchySystem_v1.js';
import { NodeHierarchyVisuals } from './NodeHierarchyVisuals_v1.js';
import { NodeHierarchyVisualFeedback } from './NodeHierarchyVisualFeedback_v1.js';
import { NodeHierarchyEffectsPool } from './NodeHierarchyEffectsPool_v1.js';

/**
 * Node Hierarchy Bridge v1.0 — Integration layer
 * 
 * Connects hierarchy system to:
 * - AINodes (spawning, metrics)
 * - NodeLinkingSystem (link visualization)
 * - Node visual system (position tracking)
 * - Corruption/Harmony systems (property cascading)
 * 
 * Responsibilities:
 * - Listen for node creation/linking events
 * - Map AINode instances to hierarchy nodes
 * - Sync positions for visual updates
 * - Propagate metrics through hierarchy
 * - Manage hierarchy-based gameplay effects
 */
export class NodeHierarchyBridge {
  constructor(scene, camera, aiNodes, linkingSystem) {
    this.scene = scene;
    this.camera = camera;
    this.aiNodes = aiNodes;
    this.linkingSystem = linkingSystem;

    // Visual system
    this.visuals = new NodeHierarchyVisuals(scene, camera);

    // Visual feedback effects (animations, particles, glows)
    this.effectsPool = new NodeHierarchyEffectsPool(scene, {
      maxParticles: 200,
      maxRings: 50,
      maxAnimations: 100,
      particleSize: 0.15,
      ringSegments: 64
    });

    this.visualFeedback = new NodeHierarchyVisualFeedback(scene, camera);

    // Position tracking
    this.nodePositions = new Map(); // nodeId → {x, y, z}
    this.updateNodePositions = new Map(); // Throttled updates

    // Integration tracking
    this.hierarchyInitialized = new Set(); // Nodes added to hierarchy
    this.nodeToAINode = new Map(); // nodeId → aiNodeInstance

    // Configuration
    this.config = {
      // Auto-parent nodes that link (child becomes parent's child)
      autoHierarchyOnLink: true,
      // Visualize hierarchy lines
      visualizeHierarchy: true,
      // Update frequency (Hz)
      updateFrequency: 30,
      // Max visualization distance
      maxVisualizationDistance: 100
    };

    // Performance tracking
    this.stats = {
      hierarchiesCreated: 0,
      nodesReparented: 0,
      lineUpdates: 0,
      propertyCascades: 0
    };

    // Setup event listeners
    this._setupEventListeners();

    // Animation loop
    this.running = false;
  }

  /**
   * Initialize bridge (called after systems are ready)
   */
  init() {
    console.log('[NodeHierarchyBridge] Initializing hierarchy integration...');

    // Register existing nodes
    if (this.aiNodes && this.aiNodes.nodes) {
      for (const aiNode of this.aiNodes.nodes) {
        this._registerNode(aiNode);
      }
    }

    this.running = true;
    console.log(`[NodeHierarchyBridge] ✓ Initialized with ${this.hierarchyInitialized.size} nodes`);
  }

  /**
   * Register a node with the hierarchy system
   */
  _registerNode(aiNode) {
    if (!aiNode || !aiNode.id) return;

    const nodeId = aiNode.id;
    if (this.hierarchyInitialized.has(nodeId)) return;

    // Create hierarchy node
    nodeHierarchySystem.createNode(nodeId, {
      type: aiNode.type || 'standard',
      category: aiNode.category || 'unknown',
      archetype: aiNode.archetype || null
    });

    // Track mapping
    this.nodeToAINode.set(nodeId, aiNode);
    this.hierarchyInitialized.add(nodeId);

    // Initialize position tracking
    if (aiNode.mesh) {
      this._updateNodePosition(nodeId, aiNode.mesh.position);
    }
  }

  /**
   * Establish parent-child relationship between nodes
   */
  setNodeParent(childId, parentId) {
    if (!this.hierarchyInitialized.has(childId)) {
      this._registerNode(this.nodeToAINode.get(childId));
    }
    if (!this.hierarchyInitialized.has(parentId)) {
      this._registerNode(this.nodeToAINode.get(parentId));
    }

    const success = nodeHierarchySystem.setParent(childId, parentId);
    if (success) {
      this.stats.nodesReparented++;
      if (this.config.visualizeHierarchy) {
        this._updateHierarchyLineVisual(childId);
      }
    }
    return success;
  }

  /**
   * Create hierarchy from link (source → target)
   * Usually: target becomes child of source
   */
  createHierarchyFromLink(sourceId, targetId) {
    if (!this.config.autoHierarchyOnLink) return false;

    // Target becomes child of source
    return this.setNodeParent(targetId, sourceId);
  }

  /**
   * Update node position tracking
   */
  _updateNodePosition(nodeId, position) {
    this.nodePositions.set(nodeId, {
      x: position.x,
      y: position.y,
      z: position.z
    });
  }

  /**
   * Update hierarchy line visualization
   */
  _updateHierarchyLineVisual(childId) {
    const parentId = nodeHierarchySystem.getParent(childId);
    if (!parentId) return;

    const childNode = this.nodeToAINode.get(childId);
    const parentNode = this.nodeToAINode.get(parentId);

    if (!childNode?.mesh || !parentNode?.mesh) return;

    const depth = nodeHierarchySystem.getDepth(childId);
    const childPos = [childNode.mesh.position.x, childNode.mesh.position.y, childNode.mesh.position.z];
    const parentPos = [parentNode.mesh.position.x, parentNode.mesh.position.y, parentNode.mesh.position.z];

    this.visuals.createHierarchyLine(parentPos, childPos, depth, childId);
    this.stats.lineUpdates++;
  }

  /**
   * Set inheritable property on node
   */
  setNodeProperty(nodeId, property, value) {
    const success = nodeHierarchySystem.setProperty(nodeId, property, value);

    if (success && this.config.visualizeHierarchy) {
      this.visuals.pulseConnection(nodeId, 200);
    }

    if (success) {
      this.stats.propertyCascades++;
    }

    return success;
  }

  /**
   * Get node's inheritable property (with inheritance from parent)
   */
  getNodeProperty(nodeId, property) {
    return nodeHierarchySystem.getProperty(nodeId, property, true);
  }

  /**
   * Get aggregated metrics for node and all children
   */
  getSubtreeMetrics(nodeId) {
    return nodeHierarchySystem.getAggregatedMetrics(nodeId);
  }

  /**
   * Get entire hierarchy tree structure
   */
  getHierarchyTree() {
    const roots = nodeHierarchySystem.getRoots();
    return {
      roots,
      tree: roots.map(rootId => this._buildTreeNode(rootId))
    };
  }

  /**
   * Update visual representations (called each frame)
   */
  update(deltaTime = 0.016) {
    if (!this.running) return;

    // Update animation state
    this.visuals.updateAnimations();

    // Update visual feedback effects (particles, pulses, glows)
    if (this.visualFeedback) {
      this.visualFeedback.update(deltaTime);
    }

    // Update hierarchy line positions
    for (const [nodeId, _] of this.nodeToAINode) {
      const parentId = nodeHierarchySystem.getParent(nodeId);
      if (!parentId) continue;

      const childNode = this.nodeToAINode.get(nodeId);
      const parentNode = this.nodeToAINode.get(parentId);

      if (childNode?.mesh && parentNode?.mesh) {
        const distance = childNode.mesh.position.distanceTo(parentNode.mesh.position);
        if (distance < this.config.maxVisualizationDistance) {
          this._updateHierarchyLineVisual(nodeId);
        }
      }
    }
  }

  /**
   * Setup event listeners for hierarchy changes
   */
  _setupEventListeners() {
    // Listen for hierarchy changes
    nodeHierarchySystem.onHierarchyChanged.push((event) => {
      console.log(`[NodeHierarchyBridge] Hierarchy changed: ${event.nodeId} (${event.changeType})`);

      if (event.changeType === 'removed') {
        this.visuals.removeHierarchyLine(event.nodeId);
        this.nodeToAINode.delete(event.nodeId);
        this.hierarchyInitialized.delete(event.nodeId);
      }
    });

    // Listen for property inheritance (VISUAL FEEDBACK)
    nodeHierarchySystem.onPropertyInherited.push((event) => {
      const childNode = this.nodeToAINode.get(event.nodeId);
      const parentNode = this.nodeToAINode.get(event.source);

      if (childNode?.mesh && parentNode?.mesh) {
        // Create visual feedback on property inheritance
        this.visualFeedback.createPropertyInheritanceEffect(
          parentNode.mesh.position,
          childNode.mesh.position,
          event.property
        );

        // Glow effect on child
        this.visualFeedback.createGlowEffect(childNode.mesh, this._getPropertyColor(event.property));
      }
    });

    // Listen for reparenting (VISUAL FEEDBACK)
    nodeHierarchySystem.onReparented.push((event) => {
      console.log(`[NodeHierarchyBridge] Node reparented: ${event.nodeId} (${event.oldParent} → ${event.newParent})`);

      const childNode = this.nodeToAINode.get(event.nodeId);
      const parentNode = this.nodeToAINode.get(event.newParent);

      if (this.config.visualizeHierarchy && event.newParent && childNode?.mesh && parentNode?.mesh) {
        this._updateHierarchyLineVisual(event.nodeId);
        this.visuals.pulseConnection(event.nodeId, 400);

        // Visual feedback effects on reparenting
        // 1. Scale pop on child node
        this.visualFeedback.createScaleAnimation(childNode.mesh, 1.0, 1.12);

        // 2. Particle pulse from parent to child
        this.visualFeedback.createParticlePulse(
          parentNode.mesh.position,
          childNode.mesh.position,
          this.visualFeedback.config.hierarchyConnectorColor,
          8
        );

        // 3. Glow effect on both nodes
        this.visualFeedback.createGlowEffect(parentNode.mesh, new THREE.Color(0x88ff00), 0.3);
        this.visualFeedback.createGlowEffect(childNode.mesh, new THREE.Color(0x00ffff), 0.4);

        // 4. Ring expansion at connection point (midpoint)
        const midpoint = new THREE.Vector3().addVectors(parentNode.mesh.position, childNode.mesh.position).multiplyScalar(0.5);
        this.visualFeedback.createRingExpansion(midpoint, new THREE.Color(0x88ff00), 2.5);
      }
    });

    // If linking system exists, listen for links
    if (this.linkingSystem?.onLinkCreatedCallbacks) {
      this.linkingSystem.onLinkCreatedCallbacks.push((link) => {
        if (this.config.autoHierarchyOnLink && link.targetNode) {
          this.createHierarchyFromLink(link.sourceNode.id, link.targetNode.id);
        }
      });
    }

    // If aiNodes exists, listen for spawning
    if (this.aiNodes) {
      const originalSpawn = this.aiNodes.spawnNode?.bind(this.aiNodes);
      if (originalSpawn) {
        this.aiNodes.spawnNode = (...args) => {
          const node = originalSpawn(...args);
          if (node) {
            this._registerNode(node);
          }
          return node;
        };
      }
    }
  }

  /**
   * Build tree structure for serialization
   */
  _buildTreeNode(nodeId) {
    const children = nodeHierarchySystem.getChildren(nodeId);
    const aiNode = this.nodeToAINode.get(nodeId);

    return {
      nodeId,
      type: aiNode?.type || 'unknown',
      category: aiNode?.category || 'unknown',
      depth: nodeHierarchySystem.getDepth(nodeId),
      metrics: nodeHierarchySystem.getAggregatedMetrics(nodeId),
      children: children.map(childId => this._buildTreeNode(childId))
    };
  }

  /**
   * Get console API for debugging/testing
   */
  getConsoleAPI() {
    return {
      // Hierarchy queries
      getHierarchy: () => this.getHierarchyTree(),
      getParent: (nodeId) => nodeHierarchySystem.getParent(nodeId),
      getChildren: (nodeId) => nodeHierarchySystem.getChildren(nodeId),
      getDescendants: (nodeId) => nodeHierarchySystem.getDescendants(nodeId),
      getAncestors: (nodeId) => nodeHierarchySystem.getAncestors(nodeId),
      
      // Property management
      setProperty: (nodeId, prop, value) => this.setNodeProperty(nodeId, prop, value),
      getProperty: (nodeId, prop) => this.getNodeProperty(nodeId, prop),
      getMetrics: (nodeId) => this.getSubtreeMetrics(nodeId),
      
      // Hierarchy manipulation
      setParent: (childId, parentId) => this.setNodeParent(childId, parentId),
      detach: (nodeId) => nodeHierarchySystem.detach(nodeId),
      
      // Visualization
      toggleVisualization: (enabled) => {
        this.config.visualizeHierarchy = enabled;
      },
      
      // Statistics
      getStats: () => this.stats
    };
  }

  /**
   * Get property color
   */
  _getPropertyColor(property) {
    switch (property) {
      case 'corruption':
        return new THREE.Color(0xff3333); // Red
      case 'harmony':
        return new THREE.Color(0x00ff88); // Green
      case 'stress':
        return new THREE.Color(0xff6600); // Orange
      case 'stability':
        return new THREE.Color(0x6666ff); // Blue
      default:
        return new THREE.Color(0x00ffff); // Cyan
    }
  }

  /**
   * Shutdown bridge
   */
  dispose() {
    this.running = false;
    this.visuals.dispose();
    this.visualFeedback?.dispose();
    this.effectsPool?.dispose();
    nodeHierarchySystem.hierarchyNodeMap.clear();
    nodeHierarchySystem.roots.clear();
    this.nodeToAINode.clear();
    console.log('[NodeHierarchyBridge] ✓ Disposed');
  }
}
