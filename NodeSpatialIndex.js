/**
 * NodeSpatialIndex - Octree-based spatial indexing for ATOMA nodes
 * 
 * Provides O(log n) raycasting and spatial queries instead of O(n)
 * 
 * Performance improvements:
 * - Raycast acceleration using octree traversal
 * - Distance-based culling before detailed checks
 * - Cached bounding spheres for fast rejection
 * 
 * @version 1.0
 */

import * as THREE from 'three';

/**
 * Simple Octree node for spatial partitioning
 */
class OctreeNode {
  constructor(bounds, depth = 0, maxDepth = 6) {
    this.bounds = bounds; // THREE.Box3
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.objects = []; // Objects in this node (if leaf)
    this.children = null; // Child octants (null if leaf)
    this.objectCount = 0;
  }

  /**
   * Check if this node should subdivide
   */
  shouldSubdivide() {
    return this.depth < this.maxDepth && 
           this.objects.length > 8 && 
           this.children === null;
  }

  /**
   * Subdivide this node into 8 children
   */
  subdivide() {
    if (this.children) return; // Already subdivided

    const { min, max } = this.bounds;
    const centerX = (min.x + max.x) / 2;
    const centerY = (min.y + max.y) / 2;
    const centerZ = (min.z + max.z) / 2;

    // Create 8 octants
    this.children = [];
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          const childMin = new THREE.Vector3(
            x === 0 ? min.x : centerX,
            y === 0 ? min.y : centerY,
            z === 0 ? min.z : centerZ
          );
          const childMax = new THREE.Vector3(
            x === 0 ? centerX : max.x,
            y === 0 ? centerY : max.y,
            z === 0 ? centerZ : max.z
          );
          const childBounds = new THREE.Box3(childMin, childMax);
          this.children.push(new OctreeNode(childBounds, this.depth + 1, this.maxDepth));
        }
      }
    }

    // Redistribute objects to children
    for (const obj of this.objects) {
      this.insertIntoChildren(obj);
    }
    this.objects = [];
  }

  /**
   * Insert object into appropriate child
   */
  insertIntoChildren(obj) {
    if (!this.children) return false;

    const sphere = obj.userData._spatialSphere;
    if (!sphere) return false;

    let inserted = false;
    for (const child of this.children) {
      if (child.bounds.intersectsSphere(sphere)) {
        child.insert(obj);
        inserted = true;
      }
    }
    return inserted;
  }

  /**
   * Insert an object into this node
   */
  insert(obj) {
    const sphere = obj.userData._spatialSphere;
    if (!sphere) {
      // Create bounding sphere if not exists
      obj.userData._spatialSphere = new THREE.Sphere();
      obj.updateMatrixWorld();
      obj.userData._spatialSphere.setFromCenterAndRadius(
        obj.getWorldPosition(new THREE.Vector3()),
        1.5 // Default radius for nodes
      );
    }

    this.objectCount++;

    // If we have children, try to insert into them
    if (this.children) {
      const inserted = this.insertIntoChildren(obj);
      if (inserted) return;
    }

    // Add to this node
    this.objects.push(obj);

    // Subdivide if needed
    if (this.shouldSubdivide()) {
      this.subdivide();
    }
  }

  /**
   * Remove an object from this node
   */
  remove(obj) {
    const sphere = obj.userData._spatialSphere;
    if (!sphere) return false;

    // If we have children, try to remove from them
    if (this.children) {
      for (const child of this.children) {
        if (child.bounds.intersectsSphere(sphere)) {
          if (child.remove(obj)) {
            this.objectCount--;
            return true;
          }
        }
      }
    }

    // Try to remove from this node
    const idx = this.objects.indexOf(obj);
    if (idx !== -1) {
      this.objects.splice(idx, 1);
      this.objectCount--;
      return true;
    }

    return false;
  }

  /**
   * Update an object's position in the tree
   */
  update(obj) {
    // Remove and re-insert for simplicity
    this.remove(obj);
    this.insert(obj);
  }

  /**
   * Get all objects that intersect with a ray
   */
  raycast(raycaster, results) {
    // Check if ray intersects this node's bounds
    if (!raycaster.ray.intersectsBox(this.bounds)) {
      return;
    }

    // If we have children, recurse
    if (this.children) {
      for (const child of this.children) {
        child.raycast(raycaster, results);
      }
      return;
    }

    // Leaf node: check all objects
    for (const obj of this.objects) {
      const sphere = obj.userData._spatialSphere;
      if (sphere && raycaster.ray.intersectsSphere(sphere)) {
        results.push(obj);
      }
    }
  }

  /**
   * Get all objects within a distance of a point
   */
  querySphere(center, radius, results) {
    // Quick rejection: check if sphere intersects this node's bounds
    if (!this.bounds.intersectsSphere(new THREE.Sphere(center, radius))) {
      return;
    }

    // If we have children, recurse
    if (this.children) {
      for (const child of this.children) {
        child.querySphere(center, radius, results);
      }
      return;
    }

    // Leaf node: check all objects
    for (const obj of this.objects) {
      const sphere = obj.userData._spatialSphere;
      if (sphere) {
        const dist = center.distanceTo(sphere.center);
        if (dist < radius + sphere.radius) {
          results.push(obj);
        }
      }
    }
  }

  /**
   * Get statistics about this node
   */
  getStats() {
    const stats = {
      depth: this.depth,
      objectCount: this.objectCount,
      hasChildren: this.children !== null,
      localObjectCount: this.objects.length
    };

    if (this.children) {
      stats.children = this.children.map(c => c.getStats());
    }

    return stats;
  }
}

/**
 * Main spatial index class for managing node spatial queries
 */
export class NodeSpatialIndex {
  constructor(options = {}) {
    this.root = null;
    this.objects = new Set();
    this.options = {
      worldSize: options.worldSize || 200,
      maxDepth: options.maxDepth || 6,
      maxObjectsPerNode: options.maxObjectsPerNode || 8,
      ...options
    };

    // Initialize root bounds
    const halfSize = this.options.worldSize / 2;
    this.root = new OctreeNode(
      new THREE.Box3(
        new THREE.Vector3(-halfSize, -halfSize, -halfSize),
        new THREE.Vector3(halfSize, halfSize, halfSize)
      ),
      0,
      this.options.maxDepth
    );

    // Performance tracking
    this.stats = {
      inserts: 0,
      removes: 0,
      updates: 0,
      raycasts: 0,
      sphereQueries: 0
    };
  }

  /**
   * Insert an object into the spatial index
   */
  insert(obj) {
    if (!obj) return false;
    if (this.objects.has(obj)) return false;

    this.root.insert(obj);
    this.objects.add(obj);
    this.stats.inserts++;
    return true;
  }

  /**
   * Remove an object from the spatial index
   */
  remove(obj) {
    if (!obj) return false;
    if (!this.objects.has(obj)) return false;

    const removed = this.root.remove(obj);
    if (removed) {
      this.objects.delete(obj);
      this.stats.removes++;
    }
    return removed;
  }

  /**
   * Update an object's position in the spatial index
   */
  update(obj) {
    if (!obj) return false;
    if (!this.objects.has(obj)) return false;

    this.root.update(obj);
    this.stats.updates++;
    return true;
  }

  /**
   * Perform raycast query with distance-based culling
   * Returns array of objects that may intersect with the ray
   */
  raycast(raycaster, maxDistance = Infinity) {
    this.stats.raycasts++;

    // Set raycaster far limit for early rejection
    const originalFar = raycaster.far;
    raycaster.far = Math.min(raycaster.far, maxDistance);

    // Collect candidates using octree
    const candidates = [];
    this.root.raycast(raycaster, candidates);

    // Restore original far value
    raycaster.far = originalFar;

    return candidates;
  }

  /**
   * Query for objects within a sphere
   */
  querySphere(center, radius) {
    this.stats.sphereQueries++;

    const results = [];
    this.root.querySphere(center, radius, results);
    return results;
  }

  /**
   * Clear all objects from the index
   */
  clear() {
    const halfSize = this.options.worldSize / 2;
    this.root = new OctreeNode(
      new THREE.Box3(
        new THREE.Vector3(-halfSize, -halfSize, -halfSize),
        new THREE.Vector3(halfSize, halfSize, halfSize)
      ),
      0,
      this.options.maxDepth
    );
    this.objects.clear();
  }

  /**
   * Get the number of objects in the index
   */
  size() {
    return this.objects.size;
  }

  /**
   * Get statistics about the spatial index
   */
  getStats() {
    return {
      ...this.stats,
      objectCount: this.objects.size,
      treeStats: this.root.getStats()
    };
  }

  /**
   * Log statistics for debugging
   */
  logStats() {
    const stats = this.getStats();
    console.log('[NodeSpatialIndex] Stats:', {
      objectCount: stats.objectCount,
      inserts: stats.inserts,
      removes: stats.removes,
      updates: stats.updates,
      raycasts: stats.raycasts,
      sphereQueries: stats.sphereQueries,
      tree: stats.treeStats
    });
  }
}

/**
 * Helper function to create a spatial index from an array of nodes
 */
export function createSpatialIndexFromNodes(nodes, options = {}) {
  const index = new NodeSpatialIndex(options);
  
  for (const node of nodes) {
    if (node) {
      index.insert(node);
    }
  }
  
  return index;
}

/**
 * Helper function to perform accelerated raycast
 * Returns the same format as THREE.Raycaster.intersectObjects
 */
export function acceleratedRaycast(raycaster, spatialIndex, recursive = false) {
  // Get candidate objects from spatial index
  const candidates = spatialIndex.raycast(raycaster);
  
  // Perform actual raycast on candidates only
  const intersects = [];
  for (const obj of candidates) {
    const raycastResults = [];
    obj.raycast(raycaster, raycastResults);
    for (const result of raycastResults) {
      intersects.push(result);
    }
  }
  
  // Sort by distance
  intersects.sort((a, b) => a.distance - b.distance);
  
  return intersects;
}

// Export for global access if needed
if (typeof window !== 'undefined') {
  window.NodeSpatialIndex = NodeSpatialIndex;
  window.createSpatialIndexFromNodes = createSpatialIndexFromNodes;
  window.acceleratedRaycast = acceleratedRaycast;
}
