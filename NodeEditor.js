import * as THREE from 'three';
import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';

// Policy: NodeEditor must not create real nodes (bypass guard)
const NODE_EDITOR_DEBUG_MARKERS_ENABLED = false;
const VARIANT_PROPS = ['transparent', 'depthWrite', 'depthTest', 'blending', 'alphaTest', 'side'];
const VARIANT_DEBUG_FLAG = '__ATOMA_DEBUG_VARIANTS';

function withSelectionContext(fn) {
  const prev = globalThis.__ATOMA_CTX;
  globalThis.__ATOMA_CTX = 'selection';
  try { return fn(); }
  finally { globalThis.__ATOMA_CTX = prev; }
}

function snapshotVariantProps(material) {
  return VARIANT_PROPS.reduce((acc, p) => { acc[p] = material[p]; return acc; }, {});
}

function guardSelectionVariants(materials, fn) {
  if (!globalThis[VARIANT_DEBUG_FLAG]) return fn();
  const mats = (Array.isArray(materials) ? materials : [materials]).filter(Boolean);
  const before = mats.map(mat => ({ mat, snap: snapshotVariantProps(mat) }));
  const result = fn();
  before.forEach(({ mat, snap }) => {
    const changed = VARIANT_PROPS.filter(p => mat[p] !== snap[p]);
    if (changed.length) {
      console.warn('[SelectionVariantGuard] Variant prop changed during selection', { uuid: mat.uuid, changed, before: snap, after: snapshotVariantProps(mat) });
      console.trace();
    }
  });
  return result;
}

/**
 * ATOMA Node Editor - Interactive 3D Node Graph System
 * Zero-gravity 3D environment for node selection, dragging, and linking
 */
export class NodeEditor {
  constructor(scene, camera, collisionManager) {
    this.scene = scene;
    this.camera = camera;
    this.collisionManager = collisionManager;
    
    // UNIFIED CLEANUP CONTRACT - Track all created objects
    this._createdObjects = [];
    
    // Decorative debug marker management (policy: no real nodes here)
    this.debugMarkers = [];
    this.nodes = this.debugMarkers; // backward compatibility for internal calls
    this.links = [];
    this.nodeGeometry = new THREE.OctahedronGeometry(0.5, 2);
    
    // Selection & interaction state
    this.selectedNode = null;
    this.hoveredNode = null;
    this.isDragging = false;
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.dragOffset = new THREE.Vector3();
    
    // Linking state
    this.isLinking = false;
    this.linkSource = null;
    this.linkPreview = null;
    this.linkPreviewGeometry = null;
    
    // Input handling
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.keyStates = {};
    
    // Visual effects
    this.sparkParticles = [];
    this.pulseEffects = [];
  }
  
  /**
   * UNIFIED CLEANUP CONTRACT - Dispose all resources
   */
  dispose() {
    // Remove and dispose all created objects
    this._createdObjects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this._createdObjects = [];
    
    // Cleanup other resources
    this.debugMarkers = [];
    this.links = [];
    this.sparkParticles = [];
    this.pulseEffects = [];
    
    if (this.nodeGeometry) this.nodeGeometry.dispose();
    if (this.linkPreviewGeometry) this.linkPreviewGeometry.dispose();
  }
  
  /**
   * Create a decorative debug marker (not a Node).
   * When policy flag is false, creation is skipped.
   */
  createDebugMarker(position = new THREE.Vector3(0, 0, 0), data = {}) {
    if (!NODE_EDITOR_DEBUG_MARKERS_ENABLED) {
      console.warn('[Policy] Bypass node creation disabled:', { system: 'NodeEditor' });
      return null;
    }
    
    const markerData = {
      id: `marker-${Math.random().toString(36).substr(2, 9)}`,
      position: position.clone(),
      label: data.label || 'debug-marker',
      ...data
    };
    
    const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5
    });
    const edges = new THREE.EdgesGeometry(geometry);
    const pos = edges.attributes?.position?.array;
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[GeometrySource] NaN created in EdgesGeometry', edges);
          break;
        }
      }
    }
    const marker = new THREE.LineSegments(edges, material);
    marker.position.copy(position);
    marker.userData = {
      ...markerData,
      isDebugMarker: true,
      nonInteractive: true
    };
    
    const debugEntry = { mesh: marker, data: markerData };
    marker.addEventListener('removed', () => {
      if (Array.isArray(this.debugMarkers)) {
        this.debugMarkers = this.debugMarkers.filter((entry) => entry !== debugEntry);
      }
    });
    
    this.scene.add(marker);
    this._createdObjects.push(marker);  // UNIFIED CLEANUP CONTRACT
    this.debugMarkers.push(debugEntry);
    
    return markerData;
  }
  
  // Backward compatibility: legacy callers route to debug marker creator
  createNode(position = new THREE.Vector3(0, 0, 0), data = {}) {
    if (window.__ALLOW_EXTERNAL_SPAWN__ !== true) {
      console.warn('[SpawnAuthority] External spawn blocked');
      return null;
    }
    return this.createDebugMarker(position, data);
  }
  
  /**
   * Create a link between two nodes
   */
  createLink(sourceId, targetId) {
    // Validation
    if (sourceId === targetId) return null;
    
    const linkExists = this.links.some(l => 
      l.sourceId === sourceId && l.targetId === targetId
    );
    if (linkExists) return null;
    
    const linkData = {
      id: Math.random().toString(36).substr(2, 9),
      sourceId,
      targetId,
      synergy: 'linear'
    };
    
    // Create link curve
    const curve = this.createLinkCurve(sourceId, targetId);
    
    this.links.push({
      data: linkData,
      curve,
      source: this.getNodeById(sourceId),
      target: this.getNodeById(targetId)
    });
    
    // Play spark effect
    this.createSparkEffect(this.getNodeById(targetId).mesh.position);
    
    return linkData;
  }
  
  /**
   * Create smooth Bezier curve for link
   */
  createLinkCurve(sourceId, targetId) {
    const source = this.getNodeById(sourceId);
    const target = this.getNodeById(targetId);
    
    if (!source || !target) return null;
    
    const sourcePos = source.mesh.position;
    const targetPos = target.mesh.position;
    
    // Control points for Bezier curve
    const midPoint = new THREE.Vector3()
      .addVectors(sourcePos, targetPos)
      .multiplyScalar(0.5);
    midPoint.y += sourcePos.distanceTo(targetPos) * 0.3;
    
    const curve = new THREE.CubicBezierCurve3(
      sourcePos,
      midPoint.clone().add(new THREE.Vector3(sourcePos.x - midPoint.x, 0, 0)),
      midPoint.clone().add(new THREE.Vector3(targetPos.x - midPoint.x, 0, 0)),
      targetPos
    );
    
    const points = curve.getPoints(32);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const material = new THREE.LineBasicMaterial({
      color: this.getSynergyColor('linear'),
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this._createdObjects.push(line);  // UNIFIED CLEANUP CONTRACT
    
    return { line, curve, points };
  }
  
  /**
   * Get node by ID
   */
  getNodeById(id) {
    return this.nodes.find(n => n.data.id === id);
  }
  
  /**
   * Remove a link
   */
  removeLink(linkId) {
    const linkIndex = this.links.findIndex(l => l.data.id === linkId);
    if (linkIndex === -1) return;
    
    const link = this.links[linkIndex];
    
    // Fade out effect
    this.createFadeOutEffect(link.curve.line);
    
    this.links.splice(linkIndex, 1);
  }
  
  /**
   * Get synergy color for link visualization
   */
  getSynergyColor(synergy) {
    const colors = {
      linear: 0x00ffff,      // Cyan
      complement: 0xff00ff,  // Magenta
      fusion: 0xffff00,      // Yellow
      quantum: 0x00ff00,     // Green
      sigma: 0xff6600,       // Orange
      fractal: 0xff0099      // Pink
    };
    return colors[synergy] || 0x00ffff;
  }
  
  /**
   * Handle mouse movement for raycasting and dragging
   */
  handleMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check for node hover
    if (!this.isDragging && !this.isLinking) {
      this.updateNodeHover();
    }
    
    // Handle dragging
    if (this.isDragging && this.selectedNode) {
      this.updateNodeDrag();
    }
    
    // Update link preview
    if (this.isLinking) {
      this.updateLinkPreview();
    }
  }
  
  /**
   * Update node hover state
   */
  updateNodeHover() {
    const targets = this.nodes.map(n => n.mesh);
    globalThis.console?.log?.("[RAYCAST]", "NodeEditor.js", "targets:", targets.length);
    const intersects = this.raycaster.intersectObjects(
      targets,
      false
    );
    const filtered = filterRaycastIntersections(intersects);
    
    // Unhighlight previous hovered node
    if (this.hoveredNode && this.hoveredNode !== this.selectedNode) {
      this.setNodeOutlineOpacity(this.hoveredNode, 0);
    }
    
    // Highlight new hovered node
    if (filtered.length > 0) {
      this.hoveredNode = filtered[0].object;
      if (this.hoveredNode !== this.selectedNode) {
        this.setNodeOutlineOpacity(this.hoveredNode, 0.5);
      }
    } else {
      this.hoveredNode = null;
    }
  }
  
  /**
   * Update node dragging
   */
  updateNodeDrag() {
    // Project mouse ray onto drag plane
    this.raycaster.ray.intersectPlane(this.dragPlane, this.selectedNode.mesh.position);
    
    // Apply collision response
    if (this.collisionManager) {
      const moveDir = new THREE.Vector3()
        .subVectors(this.selectedNode.mesh.position, this.selectedNode.mesh.userData.position);
      
      const resolution = this.collisionManager.resolveCollision(
        this.selectedNode.mesh.userData.position,
        moveDir.normalize(),
        moveDir.length()
      );
      
      this.selectedNode.mesh.position.copy(this.selectedNode.mesh.userData.position);
      this.selectedNode.mesh.position.add(resolution);
    }
    
    // Update links in real-time
    this.updateNodeLinks(this.selectedNode.data.id);
  }
  
  /**
   * Update all links connected to a node
   */
  updateNodeLinks(nodeId) {
    this.links.forEach(link => {
      if (link.data.sourceId === nodeId || link.data.targetId === nodeId) {
        const sourcePos = this.getNodeById(link.data.sourceId).mesh.position;
        const targetPos = this.getNodeById(link.data.targetId).mesh.position;
        
        // Regenerate curve
        const midPoint = new THREE.Vector3()
          .addVectors(sourcePos, targetPos)
          .multiplyScalar(0.5);
        midPoint.y += sourcePos.distanceTo(targetPos) * 0.3;
        
        const newCurve = new THREE.CubicBezierCurve3(
          sourcePos,
          midPoint.clone().add(new THREE.Vector3(sourcePos.x - midPoint.x, 0, 0)),
          midPoint.clone().add(new THREE.Vector3(targetPos.x - midPoint.x, 0, 0)),
          targetPos
        );
        
        const points = newCurve.getPoints(32);
        link.curve.line.geometry.setFromPoints(points);
      }
    });
  }
  
  /**
   * Update link preview line
   */
  updateLinkPreview() {
    if (!this.linkPreview) {
      this.createLinkPreview();
    }
    
    const startPos = this.linkSource.mesh.position;
    const targets = this.nodes.map(n => n.mesh).filter(m => m !== this.linkSource.mesh);
    globalThis.console?.log?.("[RAYCAST]", "NodeEditor.js", "targets:", targets.length);
    const intersects = this.raycaster.intersectObjects(
      targets,
      false
    );
    const filtered = filterRaycastIntersections(intersects);
    
    let endPos;
    if (filtered.length > 0) {
      endPos = filtered[0].object.position.clone();
      this.linkPreview.material.color.setHex(0x00ff00); // Green when hovering target
    } else {
      endPos = this.raycaster.ray.getPoint(100);
      this.linkPreview.material.color.setHex(0x00ffff); // Cyan normal state
    }
    
    const points = [startPos, endPos];
    this.linkPreview.geometry.setFromPoints(points);
  }
  
  /**
   * Create link preview line
   */
  createLinkPreview() {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });
    
    this.linkPreview = new THREE.Line(geometry, material);
    this.scene.add(this.linkPreview);
    this._createdObjects.push(this.linkPreview);  // UNIFIED CLEANUP CONTRACT
  }
  
  /**
   * Handle mouse click
   */
  handleMouseClick(event) {
    withSelectionContext(() => {
      const targets = this.nodes.map(n => n.mesh);
      globalThis.console?.log?.("[RAYCAST]", "NodeEditor.js", "targets:", targets.length);
      const intersects = this.raycaster.intersectObjects(
        targets,
        false
      );
      const filtered = filterRaycastIntersections(intersects);
      
      // Link mode - click to confirm link
      if (this.isLinking) {
        if (filtered.length > 0) {
          const target = filtered[0].object;
          if (target !== this.linkSource.mesh) {
            this.createLink(this.linkSource.data.id, target.userData.id);
          }
        }
        this.cancelLinking();
        return;
      }
      
      // Normal selection
      if (intersects.length > 0) {
        const clickedNode = intersects[0].object;
        const foundNode = this.nodes.find(n => n.mesh === clickedNode);
        
        // Only proceed if node was found
        if (!foundNode) {
          this.deselectAll();
          return;
        }
        
        // Shift - start linking
        if (event.shiftKey) {
          this.startLinking(foundNode);
          return;
        }
        
        guardSelectionVariants(foundNode.mesh.material, () => this.selectNode(foundNode));
      } else {
        this.deselectAll();
      }
    });
  }
  
  /**
   * Handle mouse down (start dragging)
   */
  handleMouseDown(event) {
    if (this.selectedNode && !this.isLinking) {
      const targets = this.nodes.map(n => n.mesh);
      globalThis.console?.log?.("[RAYCAST]", "NodeEditor.js", "targets:", targets.length);
      const intersects = this.raycaster.intersectObjects(
        targets,
        false
      );
      const filtered = filterRaycastIntersections(intersects);
      
      if (filtered.length > 0 && filtered[0].object === this.selectedNode.mesh) {
        this.isDragging = true;
        this.selectedNode.mesh.userData.position = this.selectedNode.mesh.position.clone();
        
        // Setup drag plane
        this.dragPlane.setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(new THREE.Vector3()).negate(),
          this.selectedNode.mesh.position
        );
      }
    }
  }
  
  /**
   * Handle mouse up (stop dragging)
   */
  handleMouseUp(event) {
    this.isDragging = false;
  }
  
  /**
   * Handle right click (cancel linking)
   */
  handleRightClick(event) {
    event.preventDefault();
    
    if (this.isLinking) {
      this.cancelLinking();
      return;
    }
    
    // Check if clicking on a link
    const targets = this.links.map(l => l.curve.line);
    globalThis.console?.log?.("[RAYCAST]", "NodeEditor.js", "targets:", targets.length);
    const intersects = this.raycaster.intersectObjects(
      targets,
      false
    );
    const filtered = filterRaycastIntersections(intersects);
    
    if (filtered.length > 0) {
      const clickedLine = filtered[0].object;
      const link = this.links.find(l => l.curve.line === clickedLine);
      if (link) {
        this.removeLink(link.data.id);
      }
    }
  }
  
  /**
   * Handle keyboard input
   */
  handleKeyDown(event) {
    this.keyStates[event.key] = true;
    
    if (event.key === 'Escape') {
      if (this.isLinking) {
        this.cancelLinking();
      }
    }
  }
  
  /**
   * Handle keyboard up
   */
  handleKeyUp(event) {
    this.keyStates[event.key] = false;
  }
  
  /**
   * Select a node
   */
  selectNode(node) {
    if (!node || !node.mesh) {
      console.warn('selectNode: Invalid node or missing mesh');
      return;
    }
    
    // Deselect previous
    if (this.selectedNode && this.selectedNode.mesh) {
      this.setNodeOutlineOpacity(this.selectedNode.mesh, 0);
    }
    
    // Select new
    this.selectedNode = node;
    this.setNodeOutlineOpacity(node.mesh, 1);
  }
  
  /**
   * Deselect all nodes
   */
  deselectAll() {
    if (this.selectedNode && this.selectedNode.mesh) {
      this.setNodeOutlineOpacity(this.selectedNode.mesh, 0);
        // material untouched (base immutability)
      this.selectedNode = null;
    }
  }
  
  /**
   * Start linking mode
   */
  startLinking(node) {
    if (!node || !node.mesh) {
      console.warn('startLinking: Invalid node');
      return;
    }
    
    this.isLinking = true;
    this.linkSource = node;
    this.createLinkPreview();
  }
  
  /**
   * Cancel linking mode
   */
  cancelLinking() {
    this.isLinking = false;
    this.linkSource = null;
    
    if (this.linkPreview) {
      this.scene.remove(this.linkPreview);
      this.linkPreview = null;
    }
  }
  
  /**
   * Set node outline opacity
   */
  setNodeOutlineOpacity(node, opacity) {
    if (!node || !node.children) {
      return;
    }
    
    node.children.forEach(child => {
      if (child && child.userData && child.userData.isOutline && child.material) {
        child.material.opacity = opacity;
      }
    });
  }
  
  /**
   * Create spark effect on link creation
   */
  createSparkEffect(position) {
    for (let i = 0; i < 8; i++) {
      const spark = {
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ),
        life: 0.5,
        maxLife: 0.5
      };
      
      this.sparkParticles.push(spark);
    }
  }
  
  /**
   * Create fade out effect on link deletion
   */
  createFadeOutEffect(line) {
    this.pulseEffects.push({
      object: line,
      life: 0.3,
      maxLife: 0.3,
      type: 'fadeOut'
    });
  }
  
  /**
   * Update animation loop
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    // Update spark particles
    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const spark = this.sparkParticles[i];
      spark.life -= deltaTime;
      spark.position.add(spark.velocity);
      
      if (spark.life <= 0) {
        this.sparkParticles.splice(i, 1);
      }
    }
    
    // Update pulse effects
    for (let i = this.pulseEffects.length - 1; i >= 0; i--) {
      const effect = this.pulseEffects[i];
      effect.life -= deltaTime;
      
      if (effect.type === 'fadeOut') {
        effect.object.material.opacity = (effect.life / effect.maxLife) * 0.8;
      }
      
      if (effect.life <= 0) {
        this.scene.remove(effect.object);
        this.pulseEffects.splice(i, 1);
      }
    }
  }
}
