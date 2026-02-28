/**
 * HIT PROXY SYSTEM v1.0 - Strict Raycast Proxy Architecture
 * 
 * CORE PRINCIPLE:
 * ❌ DO NOT raycast on real node visuals (core, aura, glyphs, holograms)
 * ✅ CREATE invisible hit-proxy geometries for EVERY node
 * ✅ RAYCASTER operates EXCLUSIVELY on hit-proxies
 * ✅ Selection logic maps proxy → node ID
 * 
 * BENEFITS:
 * - Real visuals remain 100% immutable
 * - No shared/frozen BufferGeometry accessed by raycaster
 * - No geometry.computeBoundingSphere() calls possible
 * - Zero boundingSphere mutations
 * - Deterministic interaction behavior
 * - Perfect layer separation
 * 
 * ARCHITECTURE:
 * 1. HitProxyFactory — Creates invisible proxy spheres
 * 2. HitProxyRegistry — Maps proxy meshes ↔ node IDs
 * 3. HitProxyController — Synchronizes proxy positions with nodes
 * 4. HitProxyInteractionLayer — Marks proxies for raycasting
 * 
 * INTEGRATION:
 *   import { setupHitProxySystem } from './_HitProxySystem_v1.js';
 *   
 *   const hitProxySys = setupHitProxySystem(scene, aiNodes, {
 *     proxyRadius: 0.7,
 *     layer: 10,
 *     autoSync: true
 *   });
 *   
 *   // Use with raycaster:
 *   const results = hitProxySys.raycast(raycaster, raycaster.camera);
 *   if (results.length > 0) {
 *     const nodeId = results[0].userData.targetNodeId;
 *   }
 */

import * as THREE from 'three';
import { tagAllowedSphere } from './VisualSpherePolicy.js';

// Shared node identity adapter (aligns with window.getNodeIdentity when present)
const getNodeIdentity = typeof window !== 'undefined' && window.getNodeIdentity
  ? window.getNodeIdentity
  : function(node) {
      if (!node) return null;
      const ud = node.userData || {};
      return ud.nodeId || null;  // Canonical nodeId only (Phase 2: Removed OR-chain fallback)
    };

// ============================================================================
// HIT PROXY FACTORY — Creates Invisible Proxy Geometries
// ============================================================================

class HitProxyFactory {
  static configureProxyMesh(mesh) {
    if (!(mesh instanceof THREE.Mesh)) return mesh;

    mesh.visible = false;
    mesh.renderOrder = -Infinity;
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.raycast = THREE.Mesh.prototype.raycast;
    mesh.userData = mesh.userData || {};
    mesh.userData.isHitProxy = true;
    mesh.userData.__hitProxy = true;

    if (mesh.material && mesh.material.isMaterial) {
      mesh.material.visible = false;
      mesh.material.transparent = true;
      mesh.material.opacity = 0;
      mesh.material.depthWrite = false;
      mesh.material.depthTest = false;
    }
    mesh.userData.__hardInvisibleProxy = true;

    return mesh;
  }

  /**
   * Create an invisible sphere hit-proxy mesh
   * @param {number} radius - Proxy sphere radius
   * @returns {THREE.Mesh} - Invisible proxy sphere
   */
  static createProxySphere(radius = 0.7) {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      visible: false,         // Invisible (no render)
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    tagAllowedSphere(sphere, { role: 'interactionProxy', source: 'HitProxyFactory.createProxySphere' });
    HitProxyFactory.configureProxyMesh(sphere);
    
    return sphere;
  }

  /**
   * Create a proxy cube (optional, for different node shapes)
   * @param {number} size - Proxy cube size
   * @returns {THREE.Mesh} - Invisible proxy cube
   */
  static createProxyCube(size = 1.0) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({
      visible: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const cube = new THREE.Mesh(geometry, material);
    HitProxyFactory.configureProxyMesh(cube);
    
    return cube;
  }

  /**
   * Create a proxy capsule (cylinder + spheres)
   * @param {number} radius - Capsule radius
   * @param {number} height - Capsule height
   * @returns {THREE.Group} - Invisible proxy capsule
   */
  static createProxyCapsule(radius = 0.5, height = 2.0) {
    const group = new THREE.Group();
    group.userData = group.userData || {};
    group.userData.isHitProxy = true;
    
    // Cylinder
    const cylGeometry = new THREE.CylinderGeometry(radius, radius, height, 16);
    const material = new THREE.MeshBasicMaterial({
      visible: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false
    });
    
    const cylinder = new THREE.Mesh(cylGeometry, material);
    HitProxyFactory.configureProxyMesh(cylinder);
    group.add(cylinder);
    
    // Top sphere
    const sphereTop = HitProxyFactory.createProxySphere(radius);
    sphereTop.position.y = height / 2;
    group.add(sphereTop);
    
    // Bottom sphere
    const sphereBottom = HitProxyFactory.createProxySphere(radius);
    sphereBottom.position.y = -height / 2;
    group.add(sphereBottom);
    
    return group;
  }
}

// ============================================================================
// HIT PROXY REGISTRY — Maps Proxy Meshes ↔ Node IDs
// ============================================================================

class HitProxyRegistry {
  constructor() {
    this.proxyToNodeMap = new Map();      // proxy mesh → node ID
    this.nodeToProxyMap = new Map();      // node ID → proxy mesh
    this.proxyMeshes = [];                // All proxy meshes
  }

  /**
   * Register a proxy mesh with its target node ID
   */
  registerProxy(proxyMesh, nodeId) {
    this.proxyToNodeMap.set(proxyMesh, nodeId);
    this.nodeToProxyMap.set(nodeId, proxyMesh);
    this.proxyMeshes.push(proxyMesh);
    
    // Mark proxy with node ID for easy lookup
    proxyMesh.userData = proxyMesh.userData || {};
    proxyMesh.userData.targetNodeId = nodeId;
  }

  /**
   * Get node ID for a proxy mesh
   */
  getNodeId(proxyMesh) {
    return this.proxyToNodeMap.get(proxyMesh);
  }

  /**
   * Get proxy mesh for a node ID
   */
  getProxy(nodeId) {
    return this.nodeToProxyMap.get(nodeId);
  }

  /**
   * Unregister a proxy
   */
  unregisterProxy(proxyMesh) {
    const nodeId = this.proxyToNodeMap.get(proxyMesh);
    if (nodeId) {
      this.proxyToNodeMap.delete(proxyMesh);
      this.nodeToProxyMap.delete(nodeId);
      const idx = this.proxyMeshes.indexOf(proxyMesh);
      if (idx > -1) this.proxyMeshes.splice(idx, 1);
    }
  }

  /**
   * Get all proxy meshes (for raycasting setup)
   */
  getAllProxies() {
    return [...this.proxyMeshes];
  }

  /**
   * Clear registry
   */
  clear() {
    this.proxyToNodeMap.clear();
    this.nodeToProxyMap.clear();
    this.proxyMeshes = [];
  }
}

// ============================================================================
// HIT PROXY CONTROLLER — Synchronizes Proxy Positions
// ============================================================================

class HitProxyController {
  constructor(scene, registry, options = {}) {
    this.scene = scene;
    this.registry = registry;
    this.autoSync = options.autoSync ?? true;
    this.syncInterval = options.syncInterval ?? 0;  // Every frame if 0
    this.lastSyncTime = 0;
    this.positionOffset = options.positionOffset || new THREE.Vector3(0, 0, 0);
  }

  /**
   * Synchronize all proxy positions with their target nodes
   */
  syncProxies(nodes, opts) {
    // Guard: options may be undefined in some builds; default to {} to avoid per-frame crash.
    const options = opts ?? this.options ?? {};

    for (const node of nodes) {
      const nodeId = getNodeIdentity(node);
      if (!nodeId) continue;

      const proxy = this.registry.getProxy(nodeId);
      if (!proxy) continue;

      // Copy node position to proxy
      proxy.position.copy(node.position);
      proxy.position.add(this.positionOffset);

      // Optional: Sync scale
      if (options?.syncScale) {
        proxy.scale.copy(node.scale);
      }
    }
  }

  /**
   * Create and attach proxy to a specific node
   */
  attachProxyToNode(node, proxyRadius = 0.7) {
    // [PHASE 2] AINodes uses userData.nodeId (canonical), not userData.id
    // Fallback generation below is legacy for non-canonical nodes
    let nodeId = getNodeIdentity(node);

    // If still no ID, generate one (legacy fallback - should not happen with canonical nodes)
    if (!nodeId) {
      nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (!node.userData) node.userData = {};
      node.userData.id = nodeId;
    }

    // Check if proxy already exists
    let proxy = this.registry.getProxy(nodeId);
    if (proxy) {
      return proxy;  // Already attached
    }

    // Create new proxy
    proxy = HitProxyFactory.createProxySphere(proxyRadius);
    proxy.position.copy(node.position);
    proxy.position.add(this.positionOffset);

    // Register and attach
    this.registry.registerProxy(proxy, nodeId);
    this.scene.add(proxy);

    return proxy;
  }

  /**
   * Detach proxy from node
   */
  detachProxy(nodeId) {
    const proxy = this.registry.getProxy(nodeId);
    if (proxy) {
      this.scene.remove(proxy);
      this.registry.unregisterProxy(proxy);
    }
  }

  /**
   * Update proxies (call every frame if autoSync enabled)
   */
  update(nodes, deltaTime = 0) {
    if (!this.autoSync) return;

    // Throttle sync if interval specified
    if (this.syncInterval > 0) {
      this.lastSyncTime += deltaTime;
      if (this.lastSyncTime < this.syncInterval) return;
      this.lastSyncTime = 0;
    }

    this.syncProxies(nodes);
  }
}

// ============================================================================
// HIT PROXY INTERACTION LAYER — Marks Proxies for Raycasting
// ============================================================================

class HitProxyInteractionLayer {
  constructor(options = {}) {
    this.interactionLayer = options.layer ?? 10;  // Three.js layer 10
    this.raycasterFilter = null;
  }

  /**
   * Add proxy to raycasting layer
   */
  enableForRaycast(proxyMesh) {
    proxyMesh.layers.enable(this.interactionLayer);
  }

  /**
   * Remove proxy from raycasting layer
   */
  disableFromRaycast(proxyMesh) {
    proxyMesh.layers.disable(this.interactionLayer);
  }

  /**
   * Configure raycaster to only hit proxies
   */
  setupRaycaster(raycaster) {
    // Set raycaster to only hit interaction layer
    raycaster.layers.set(this.interactionLayer);
  }

  /**
   * Filter raycast results to only include hit-proxies
   */
  filterIntersections(intersections) {
    return intersections.filter(intersection => {
      return intersection.object?.userData?.isHitProxy === true;
    });
  }

  /**
   * Create a wrapped raycaster that only hits proxies
   */
  createProxyRaycaster() {
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(this.interactionLayer);
    return raycaster;
  }
}

// ============================================================================
// HIT PROXY SYSTEM — Complete Integration
// ============================================================================

class HitProxySystem {
  constructor(scene, aiNodes, options = {}) {
    this.scene = scene;
    this.aiNodes = aiNodes;
    this.options = options;

    // Initialize components
    this.registry = new HitProxyRegistry();
    this.controller = new HitProxyController(scene, this.registry, options);
    this.layer = new HitProxyInteractionLayer(options);

    this.proxiesCreated = false;
    this.setupDone = false;
    this.isReady = false;
  }

  /**
   * Initialize proxy system — create proxies for all existing nodes
   */
  initialize() {
    if (this.setupDone) return;

    const proxyRadius = this.options.proxyRadius ?? 0.7;

    // Create proxies for all nodes
    if (this.aiNodes?.nodes) {
      for (const node of this.aiNodes.nodes) {
        this.controller.attachProxyToNode(node, proxyRadius);
      }
    }

    // Enable all proxies for raycasting
    for (const proxy of this.registry.getAllProxies()) {
      this.layer.enableForRaycast(proxy);
    }

    const proxies = this.registry.getAllProxies();
    const ready = proxies.length > 0 && proxies.every(p => p?.userData?.targetNodeId);

    this.proxiesCreated = true;
    this.setupDone = true;
    this.isReady = ready;

    if (typeof window !== 'undefined') {
      window.HITPROXY_READY = ready;
      if (ready && !window._HITPROXY_READY_LOGGED) {
        window._HITPROXY_READY_LOGGED = true;
        console.log(`[HitProxySystem] \u2713 HITPROXY_READY = true (setup)`);
      }
    }
    
    console.log(`[HitProxySystem] Initialized with ${proxies.length} proxies`);
  }

  /**
   * Hook into node spawning to auto-create proxies
   */
  hookNodeSpawning() {
    if (!this.aiNodes?.spawnNode) return;

  }

  /**
   * Raycast and get node ID results
   * @param {THREE.Raycaster} raycaster - The raycaster
   * @param {THREE.Camera} camera - The camera (for mouse position)
   * @param {Array<THREE.Object3D>} objects - Objects to raycast against (optional)
   * @returns {Array} - Intersection results with nodeId added
   */
  raycast(raycaster, camera, objects = null, meta = null) {
    // Use proxy meshes if no objects specified
    if (!objects) {
      objects = this.registry.getAllProxies();
    }

    // Perform raycast
    const intersections = raycaster.intersectObjects(objects);

    // Filter to only hit-proxies
    const filtered = this.layer.filterIntersections(intersections);

    // Enrich with node ID mapping
    return filtered.map(intersection => ({
      ...intersection,
      nodeId: intersection.object.userData.targetNodeId,
      proxyMesh: intersection.object
    }));
  }

  /**
   * Get node ID from intersection
   */
  getNodeId(intersection) {
    return intersection.object?.userData?.targetNodeId;
  }

  /**
   * Update proxy positions (call every frame)
   */
  update(deltaTime = 0) {
    this.controller.update(this.aiNodes?.nodes || [], deltaTime);
  }

  /**
   * Remove a node's proxy
   */
  removeNodeProxy(nodeId) {
    this.controller.detachProxy(nodeId);
  }

  /**
   * Clear all proxies
   */
  clear() {
    // Remove all proxies from scene
    for (const proxy of this.registry.getAllProxies()) {
      this.scene.remove(proxy);
    }
    this.registry.clear();
    this.proxiesCreated = false;
    this.setupDone = false;
  }

  /**
   * Get debug statistics
   */
  getStats() {
    return {
      totalProxies: this.registry.getAllProxies().length,
      setupComplete: this.setupDone,
      autoSyncEnabled: this.controller.autoSync,
      interactionLayer: this.layer.interactionLayer
    };
  }

  /**
   * Print debug report
   */
  printReport() {
    const stats = this.getStats();
    console.log('[HitProxySystem] Report:', {
      '📍 Total Proxies': stats.totalProxies,
      '⚙️  Setup Complete': stats.setupComplete,
      '🔄 Auto-Sync': stats.autoSyncEnabled,
      '📡 Interaction Layer': stats.interactionLayer,
      '✓ System Ready': this.setupDone && stats.totalProxies > 0
    });
  }
}

// ============================================================================
// SETUP FUNCTION — Integration Helper
// ============================================================================

export function setupHitProxySystem(scene, aiNodes, options = {}) {
  const system = new HitProxySystem(scene, aiNodes, {
    proxyRadius: options.proxyRadius ?? 0.7,
    layer: options.layer ?? 10,
    autoSync: options.autoSync ?? true,
    syncInterval: options.syncInterval ?? 0,
    ...options
  });

  // Initialize immediately
  system.initialize();
  if (typeof window !== 'undefined') {
    window.__enforceProxyVisualLock = () => enforceProxyVisualLock(scene);
  }

  // Hook node spawning if requested
  if (options.autoHookSpawning !== false) {
    system.hookNodeSpawning();
  }

  return system;
}

export function enforceProxyVisualLock(scene) {
  scene.traverse(obj => {
    if (obj.userData?.__hardInvisibleProxy === true) {
      obj.visible = false;
      if (obj.material) {
        obj.material.visible = false;
        obj.material.opacity = 0;
      }
    }
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  HitProxyFactory,
  HitProxyRegistry,
  HitProxyController,
  HitProxyInteractionLayer,
  HitProxySystem
};

