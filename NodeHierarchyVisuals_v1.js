import * as THREE from 'three';

/**
 * Node Hierarchy Visuals v1.0 — Render parent-child relationships
 * 
 * Visual representation of node hierarchies:
 * - Parent-child connection lines (tubes)
 * - Depth-based color coding
 * - Ancestor highlight trails
 * - Hierarchical grouping indicators
 * - Animated transitions when hierarchy changes
 * 
 * Performance:
 * - Line pooling to prevent GC pressure
 * - Throttled updates (~30 FPS)
 * - Efficient material reuse
 * - Single scene addition per hierarchy update
 */
export class NodeHierarchyVisuals {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Connection visualization
    this.hierarchyLines = new Map();     // nodeId → {line, material}
    this.ancestorHighlights = new Map(); // nodeId → ancestorLine

    // Visual configuration
    this.config = {
      lineThickness: 0.08,
      parentChildColor: new THREE.Color(0x00ffff),      // Cyan
      ancestorColor: new THREE.Color(0xffff00),         // Yellow
      depthColors: [
        new THREE.Color(0x00ff88),  // Root: bright green
        new THREE.Color(0x00ccff), // L1: cyan
        new THREE.Color(0x0088ff), // L2: blue
        new THREE.Color(0x8800ff), // L3: purple
        new THREE.Color(0xff0088)  // L4+: magenta
      ],
      lineOpacity: 0.6,
      ancestorOpacity: 0.4,
      animationSpeed: 0.15
    };

    // Line pool for reuse
    this.linePool = {
      available: [],
      inUse: new Set(),
      maxLines: 500
    };

    // Update throttling
    this.lastUpdateTime = 0;
    this.updateThrottle = 1000 / 30; // 30 FPS

    // Animation tracking
    this.animations = new Map(); // nodeId → animationState
  }

  /**
   * Create or update parent-child connection line
   */
  createHierarchyLine(fromPosition, toPosition, depth, nodeId) {
    // Throttle updates
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateThrottle) {
      return;
    }
    this.lastUpdateTime = now;

    // Get or create line
    let lineData = this.hierarchyLines.get(nodeId);
    if (!lineData) {
      lineData = this._createLine();
      this.hierarchyLines.set(nodeId, lineData);
    }

    // Update geometry
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(...fromPosition),
      new THREE.Vector3(...toPosition)
    );
    const points = curve.getPoints(16);
    
    lineData.line.geometry.dispose();
    lineData.line.geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Update color based on depth
    const color = this.config.depthColors[Math.min(depth, this.config.depthColors.length - 1)];
    lineData.material.color.copy(color);
    lineData.material.opacity = this.config.lineOpacity;

    // Ensure line is in scene
    if (!this.scene.children.includes(lineData.line)) {
      this.scene.add(lineData.line);
    }

    return lineData.line;
  }

  /**
   * Show ancestor chain highlight (parent → grandparent → ...)
   */
  highlightAncestors(nodeId, ancestorPositions) {
    let highlightData = this.ancestorHighlights.get(nodeId);

    if (!highlightData && ancestorPositions.length > 0) {
      highlightData = this._createLine();
      this.ancestorHighlights.set(nodeId, highlightData);
    }

    if (ancestorPositions.length === 0) {
      // Remove highlight
      if (highlightData) {
        this.scene.remove(highlightData.line);
        this._releaseLine(highlightData);
        this.ancestorHighlights.delete(nodeId);
      }
      return;
    }

    // Build curve through ancestor positions
    const curve = new THREE.CatmullRomCurve3(
      ancestorPositions.map(p => new THREE.Vector3(...p))
    );
    const points = curve.getPoints(Math.max(32, ancestorPositions.length * 8));

    highlightData.line.geometry.dispose();
    highlightData.line.geometry = new THREE.BufferGeometry().setFromPoints(points);
    highlightData.material.color.copy(this.config.ancestorColor);
    highlightData.material.opacity = this.config.ancestorOpacity;
    highlightData.line.material.linewidth = this.config.lineThickness * 2;

    if (!this.scene.children.includes(highlightData.line)) {
      this.scene.add(highlightData.line);
    }
  }

  /**
   * Remove hierarchy line visualization
   */
  removeHierarchyLine(nodeId) {
    const lineData = this.hierarchyLines.get(nodeId);
    if (lineData) {
      this.scene.remove(lineData.line);
      this._releaseLine(lineData);
      this.hierarchyLines.delete(nodeId);
    }

    const highlightData = this.ancestorHighlights.get(nodeId);
    if (highlightData) {
      this.scene.remove(highlightData.line);
      this._releaseLine(highlightData);
      this.ancestorHighlights.delete(nodeId);
    }
  }

  /**
   * Animate hierarchy transition
   */
  animateHierarchyTransition(nodeId, startPos, endPos, duration = 400) {
    let animation = this.animations.get(nodeId);
    if (!animation) {
      animation = {
        startPos: new THREE.Vector3(...startPos),
        endPos: new THREE.Vector3(...endPos),
        startTime: Date.now(),
        duration
      };
      this.animations.set(nodeId, animation);
    }
  }

  /**
   * Update all animations
   */
  updateAnimations() {
    const now = Date.now();
    const toRemove = [];

    for (const [nodeId, animation] of this.animations) {
      const elapsed = now - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);

      if (progress >= 1) {
        toRemove.push(nodeId);
        continue;
      }

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      // Interpolate position (would be applied to node visual)
      const currentPos = animation.startPos.clone().lerp(animation.endPos, eased);

      // Update any visual effects based on currentPos
      // (This is a hook for visual system integration)
    }

    // Clean up finished animations
    for (const nodeId of toRemove) {
      this.animations.delete(nodeId);
    }
  }

  /**
   * Create depth-based grouping visualization
   */
  createDepthGroupVisual(depth, boundingBox) {
    // Create a subtle bounding box around nodes at same depth
    const geometry = new THREE.BoxGeometry(
      boundingBox.max.x - boundingBox.min.x,
      boundingBox.max.y - boundingBox.min.y,
      boundingBox.max.z - boundingBox.min.z
    );

    const color = this.config.depthColors[Math.min(depth, this.config.depthColors.length - 1)];
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 2,
      transparent: true,
      opacity: 0.15,
      fog: false
    });

    const edges = new THREE.EdgesGeometry(geometry);
    const wireframe = new THREE.LineSegments(edges, material);

    const centerX = (boundingBox.min.x + boundingBox.max.x) / 2;
    const centerY = (boundingBox.min.y + boundingBox.max.y) / 2;
    const centerZ = (boundingBox.min.z + boundingBox.max.z) / 2;
    wireframe.position.set(centerX, centerY, centerZ);

    return wireframe;
  }

  /**
   * Animate connection pulse (notification of hierarchy change)
   */
  pulseConnection(nodeId, duration = 300) {
    const lineData = this.hierarchyLines.get(nodeId);
    if (!lineData) return;

    const startTime = Date.now();
    const originalOpacity = this.config.lineOpacity;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        lineData.material.opacity = originalOpacity;
        return;
      }

      // Pulse: bright → dim → bright
      const pulse = Math.sin(progress * Math.PI);
      lineData.material.opacity = originalOpacity + pulse * 0.3;

      requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Dispose all resources
   */
  dispose() {
    // Dispose hierarchy lines
    for (const [nodeId, lineData] of this.hierarchyLines) {
      this.scene.remove(lineData.line);
      this._releaseLine(lineData);
    }
    this.hierarchyLines.clear();

    // Dispose ancestor highlights
    for (const [nodeId, highlightData] of this.ancestorHighlights) {
      this.scene.remove(highlightData.line);
      this._releaseLine(highlightData);
    }
    this.ancestorHighlights.clear();

    // Dispose line pool
    for (const line of this.linePool.available) {
      line.geometry.dispose();
      line.material.dispose();
    }
    this.linePool.available = [];
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Create or get pooled line from pool
   */
  _createLine() {
    let line;

    if (this.linePool.available.length > 0) {
      line = this.linePool.available.pop();
    } else {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        linewidth: this.config.lineThickness,
        transparent: true,
        fog: false
      });
      line = new THREE.Line(geometry, material);
    }

    this.linePool.inUse.add(line);

    return {
      line,
      material: line.material
    };
  }

  /**
   * Return line to pool
   */
  _releaseLine(lineData) {
    if (this.linePool.available.length < this.linePool.maxLines) {
      this.linePool.available.push(lineData.line);
    } else {
      lineData.line.geometry.dispose();
      lineData.line.material.dispose();
    }
    this.linePool.inUse.delete(lineData.line);
  }
}
