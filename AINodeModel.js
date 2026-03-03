import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { createCoreIdentityMaterial, createNodeHologramShell, updateHologramShellMaterial } from './CoreHologramShader.js';
import { CONFIG } from './config.js';
import { tagAllowedSphere } from './VisualSpherePolicy.js';

function vfxFlag(name, def = true) {
  const v = (typeof window !== 'undefined') ? window[name] : undefined;
  return (v === undefined) ? def : !!v;
}

/**
 * AI Node Model - Clean low-poly 3D neural node
 * Elegant, computational, futuristic design
 */
export class AINodeModel {
  /**
   * Create AI node with specified type and color
   * @param {string} type - 'core', 'data', 'memory', 'logic', 'neural'
   * @param {number} color - Hex color for node theme
   */
  static create(type = 'core', color = 0x00ddff) {
    const nodeGroup = new THREE.Group();
    
    switch(type) {
      case 'core':
        return AINodeModel.createCoreNode(nodeGroup, color);
      case 'data':
        return AINodeModel.createDataNode(nodeGroup, color);
      case 'memory':
        return AINodeModel.createMemoryNode(nodeGroup, color);
      case 'logic':
        return AINodeModel.createLogicNode(nodeGroup, color);
      case 'neural':
        return AINodeModel.createNeuralNode(nodeGroup, color);
      default:
        return AINodeModel.createCoreNode(nodeGroup, color);
    }
  }
  
  /**
   * Core Node - Icosahedron with beveled cuts
   */
  static createCoreNode(group, color) {
    // STABLE NODE ROOT - Single source of truth for all visual systems
    if (!group.userData.nodeRoot) {
      const nodeRoot = new THREE.Group();
      group.add(nodeRoot);
      group.userData.nodeRoot = nodeRoot;
    }
    const nodeRoot = group.userData.nodeRoot;
    
    // Main icosahedron body - IDENTITY LAYER (purely solid, core mesh only)
    const mainGeometry = new THREE.IcosahedronGeometry(1, 1);
    const mainMaterial = createCoreIdentityMaterial(color);
    
    // === CRITICAL: ENFORCE CORE OPACITY ===
    mainMaterial.transparent = false;
    mainMaterial.opacity = 1.0;
    mainMaterial.depthWrite = true;
    mainMaterial.depthTest = true;
    // =======================================
    
    const mainBody = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBody.frustumCulled = false;
    mainBody.userData.visualLayer = 'CORE';
    mainBody.userData.isNodeCore = true; // EXPLICIT MARKING
    mainBody.renderOrder = VisualHierarchyRegistry.getRenderOrder('CORE'); // CORE renders first
    
    // === NODE INTERACTION AUTHORITY ===
    // Designate this mesh as the ONLY valid interaction target
    mainBody.userData.interactionCore = true;
    mainBody.layers.enable(10); // INTERACTION_LAYER = 10
    // ================================
    
    nodeRoot.add(mainBody);
    
    // HOLOGRAM SHELL - SEPARATE AURA LAYER (not core)
    const holoShell = createNodeHologramShell(mainBody, color);
    if (holoShell) {
      holoShell.userData.visualLayer = 'AURA';
      holoShell.userData.isAura = true; // MARK AS AURA (allowed to be transparent)
      holoShell.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE'); // AURA renders after core
      
      nodeRoot.add(holoShell);
      
      // === HARD RAYCAST GATE: Hologram Shell ===
      holoShell.traverse((child) => {
        if (child === mainBody) return; // Skip core
        child.userData.nonInteractive = true;
        child.userData.isAura = true;
        child.layers.disable(10); // Remove from INTERACTION_LAYER
        child.raycast = () => null; // Hard gate: no raycasting
      });
      // =========================================
    }
    
    // Edge glow - EFFECTS LAYER (allowed to be transparent)
    const edgeGeometry = new THREE.EdgesGeometry(mainGeometry, 15);
    const pos = edgeGeometry.attributes?.position?.array;
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[GeometrySource] NaN created in EdgesGeometry', edgeGeometry);
          break;
        }
      }
    }
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.userData.visualLayer = 'EFFECT';
    edges.userData.isEffect = true;
    edges.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
    
    // === HARD RAYCAST GATE: Edges ===
    edges.userData.nonInteractive = true;
    edges.layers.disable(10);
    edges.raycast = () => null;
    // =================================
    
    group.add(edges);
    
    // Three floating rings around center - EFFECTS LAYER
    for (let i = 0; i < 3; i++) {
      const ringRadius = 1.3 + i * 0.2;
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.03, 8, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4 - i * 0.1
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (i * 0.1);
      ring.rotation.z = i * 0.3;
      ring.userData.visualLayer = 'EFFECT';
      ring.userData.isEffect = true;
      ring.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
      
      // === HARD RAYCAST GATE: Rings ===
      ring.userData.nonInteractive = true;
      ring.layers.disable(10);
      ring.raycast = () => null;
      // =================================
      
      group.add(ring);
    }
    
    // === INVISIBLE INTERACTION COLLIDER ===
    // Create a single authoritative interaction surface
    // This is the ONLY mesh that should be raycast
    const colliderGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    const colliderMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      wireframe: false,
      depthWrite: false,
      depthTest: false
    });
    const collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
    tagAllowedSphere(collider, { role: 'collider', source: 'AINodeModel.createCoreNode', owner: group.userData?.id || group.uuid });
    collider.userData.interactionAuthority = true;
    collider.userData.isInteractionCollider = true;
    collider.name = 'InteractionCollider';
    nodeRoot.add(collider); // Add to node root for raycasting
    group.userData.interactionCollider = collider;
    // =====================================
    
    group.userData = {
      type: 'core',
      color: color,
      mainBody: mainBody,
      holoShell: holoShell,
      edges: edges,
      interactionCollider: collider
    };
    
    return group;
  }
  
  /**
   * Data Node - Octahedron with panel insets
   */
  static createDataNode(group, color) {
    // STABLE NODE ROOT - Single source of truth for all visual systems
    if (!group.userData.nodeRoot) {
      const nodeRoot = new THREE.Group();
      group.add(nodeRoot);
      group.userData.nodeRoot = nodeRoot;
    }
    const nodeRoot = group.userData.nodeRoot;
    
    // Main octahedron body - IDENTITY LAYER (purely solid)
    const mainGeometry = new THREE.OctahedronGeometry(1, 0);
    const mainMaterial = createCoreIdentityMaterial(color);
    
    // === CRITICAL: ENFORCE CORE OPACITY ===
    mainMaterial.transparent = false;
    mainMaterial.opacity = 1.0;
    mainMaterial.depthWrite = true;
    mainMaterial.depthTest = true;
    // =======================================
    
    const mainBody = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBody.frustumCulled = false;
    mainBody.userData.visualLayer = 'CORE';
    mainBody.userData.isNodeCore = true;
    mainBody.renderOrder = VisualHierarchyRegistry.getRenderOrder('CORE');
    nodeRoot.add(mainBody);
    
    // HOLOGRAM SHELL - SEPARATE AURA LAYER
    const holoShell = createNodeHologramShell(mainBody, color);
    if (holoShell) {
      holoShell.userData.visualLayer = 'AURA';
      holoShell.userData.isAura = true;
      holoShell.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
      nodeRoot.add(holoShell);
    }
    
    // Edge highlights - EFFECTS LAYER
    const edgeGeometry = new THREE.EdgesGeometry(mainGeometry, 1);
    const pos = edgeGeometry.attributes?.position?.array;
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[GeometrySource] NaN created in EdgesGeometry', edgeGeometry);
          break;
        }
      }
    }
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.userData.visualLayer = 'EFFECT';
    edges.userData.isEffect = true;
    edges.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
    group.add(edges);
    
    // Accent panel insets on 4 faces - EFFECTS LAYER
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const panelGeometry = new THREE.PlaneGeometry(0.4, 0.4);
      const panelMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.x = Math.cos(angle) * 0.7;
      panel.position.z = Math.sin(angle) * 0.7;
      panel.lookAt(0, 0, 0);
      panel.userData.visualLayer = 'EFFECT';
      panel.userData.isEffect = true;
      panel.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
      group.add(panel);
    }
    
    group.userData = {
      type: 'data',
      color: color,
      mainBody: mainBody,
      edges: edges
    };
    
    return group;
  }
  
  /**
   * Memory Node - Cube with beveled edges and holographic frame
   */
  static createMemoryNode(group, color) {
    // STABLE NODE ROOT - Single source of truth for all visual systems
    if (!group.userData.nodeRoot) {
      const nodeRoot = new THREE.Group();
      group.add(nodeRoot);
      group.userData.nodeRoot = nodeRoot;
    }
    const nodeRoot = group.userData.nodeRoot;
    
    // Main cube body - IDENTITY LAYER (purely solid)
    const mainGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const mainMaterial = createCoreIdentityMaterial(color);
    
    // === CRITICAL: ENFORCE CORE OPACITY ===
    mainMaterial.transparent = false;
    mainMaterial.opacity = 1.0;
    mainMaterial.depthWrite = true;
    mainMaterial.depthTest = true;
    // =======================================
    
    const mainBody = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBody.frustumCulled = false;
    mainBody.userData.visualLayer = 'CORE';
    mainBody.userData.isNodeCore = true;
    mainBody.renderOrder = VisualHierarchyRegistry.getRenderOrder('CORE');
    nodeRoot.add(mainBody);
    
    // HOLOGRAM SHELL - SEPARATE AURA LAYER
    const holoShell = createNodeHologramShell(mainBody, color);
    if (holoShell) {
      holoShell.userData.visualLayer = 'AURA';
      holoShell.userData.isAura = true;
      holoShell.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
      nodeRoot.add(holoShell);
    }
    
    // Sharp edge outlines - EFFECTS LAYER
    const edgeGeometry = new THREE.EdgesGeometry(mainGeometry);
    const pos = edgeGeometry.attributes?.position?.array;
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[GeometrySource] NaN created in EdgesGeometry', edgeGeometry);
          break;
        }
      }
    }
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.userData.visualLayer = 'EFFECT';
    edges.userData.isEffect = true;
    edges.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
    group.add(edges);
    
    // Holographic wireframe cube slightly larger - EFFECTS LAYER
    const frameGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0,
      wireframe: true
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.userData.visualLayer = 'EFFECT';
    frame.userData.isEffect = true;
    frame.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
    group.add(frame);
    
    // Corner accent spheres - EFFECTS LAYER
    const corners = [
      [0.6, 0.6, 0.6], [-0.6, 0.6, 0.6],
      [0.6, -0.6, 0.6], [-0.6, -0.6, 0.6],
      [0.6, 0.6, -0.6], [-0.6, 0.6, -0.6],
      [0.6, -0.6, -0.6], [-0.6, -0.6, -0.6]
    ];
    
    corners.forEach(pos => {
      const cornerGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const cornerMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
      });
      const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
      tagAllowedSphere(corner, { role: 'canonicalSphere', source: 'AINodeModel.createMemoryNode', owner: group.userData?.id || group.uuid });
      corner.position.set(pos[0], pos[1], pos[2]);
      corner.userData.visualLayer = 'EFFECT';
      corner.userData.isEffect = true;
      corner.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
      group.add(corner);
    });
    
    group.userData = {
      type: 'memory',
      color: color,
      mainBody: mainBody,
      edges: edges,
      frame: frame
    };
    
    return group;
  }
  
  /**
   * Logic Node - Tetrahedron with floating plates
   */
  static createLogicNode(group, color) {
    // STABLE NODE ROOT - Single source of truth for all visual systems
    if (!group.userData.nodeRoot) {
      const nodeRoot = new THREE.Group();
      group.add(nodeRoot);
      group.userData.nodeRoot = nodeRoot;
    }
    const nodeRoot = group.userData.nodeRoot;
    
    // Main tetrahedron body - IDENTITY LAYER (purely solid)
    const mainGeometry = new THREE.TetrahedronGeometry(1.1, 0);
    const mainMaterial = createCoreIdentityMaterial(color);
    
    const mainBody = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBody.frustumCulled = false;
    mainBody.userData.visualLayer = 'CORE';
    nodeRoot.add(mainBody);
    
    // HOLOGRAM SHELL - UNIFIED CREATION (STABLE ICOSPHERE)
    const holoShell = createNodeHologramShell(mainBody, color);
    if (holoShell) {
      nodeRoot.add(holoShell);
    }
    
    // Clean edge lines
    const edgeGeometry = new THREE.EdgesGeometry(mainGeometry);
    const pos = edgeGeometry.attributes?.position?.array;
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[GeometrySource] NaN created in EdgesGeometry', edgeGeometry);
          break;
        }
      }
    }
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    group.add(edges);
    
    // Floating triangular plates around node
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const plateGeometry = new THREE.CircleGeometry(0.3, 3);
      const plateMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
      
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.position.x = Math.cos(angle) * 1.4;
      plate.position.y = Math.sin(angle * 2) * 0.3;
      plate.position.z = Math.sin(angle) * 1.4;
      plate.lookAt(0, 0, 0);
      
      group.add(plate);
      
      // Plate outline
      const plateEdge = new THREE.EdgesGeometry(plateGeometry);
      const pos = plateEdge.attributes?.position?.array;
      if (pos) {
        for (let i = 0; i < pos.length; i++) {
          if (!Number.isFinite(pos[i])) {
            console.error('[GeometrySource] NaN created in EdgesGeometry', plateEdge);
            break;
          }
        }
      }
      const plateEdgeMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5
      });
      const plateEdges = new THREE.LineSegments(plateEdge, plateEdgeMaterial);
      plate.add(plateEdges);
    }
    
    group.userData = {
      type: 'logic',
      color: color,
      mainBody: mainBody,
      edges: edges
    };
    
    return group;
  }
  
  /**
   * Neural Node - Dodecahedron with energy rings
   */
  static createNeuralNode(group, color) {
    // STABLE NODE ROOT - Single source of truth for all visual systems
    if (!group.userData.nodeRoot) {
      const nodeRoot = new THREE.Group();
      group.add(nodeRoot);
      group.userData.nodeRoot = nodeRoot;
    }
    const nodeRoot = group.userData.nodeRoot;
    
    // Main dodecahedron body - IDENTITY LAYER (purely solid)
    const mainGeometry = new THREE.DodecahedronGeometry(0.9, 0);
    const mainMaterial = createCoreIdentityMaterial(color);
    
    const mainBody = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBody.frustumCulled = false;
    mainBody.userData.visualLayer = 'CORE';
    nodeRoot.add(mainBody);
    
    // HOLOGRAM SHELL - UNIFIED CREATION (STABLE ICOSPHERE)
    const holoShell = createNodeHologramShell(mainBody, color);
    if (holoShell) {
      nodeRoot.add(holoShell);
    }
    
    // Subtle edge glow
    const edgeGeometry = new THREE.EdgesGeometry(mainGeometry, 20);
    const pos = edgeGeometry.attributes?.position?.array;
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[GeometrySource] NaN created in EdgesGeometry', edgeGeometry);
          break;
        }
      }
    }
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    group.add(edges);
    
    // Energy rings on 3 axes
    const ringAxes = [
      { axis: 'x', rotation: [0, 0, 0] },
      { axis: 'y', rotation: [Math.PI / 2, 0, 0] },
      { axis: 'z', rotation: [0, Math.PI / 2, 0] }
    ];
    
    ringAxes.forEach((axis, i) => {
      const ringGeometry = new THREE.TorusGeometry(1.2, 0.04, 8, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.set(...axis.rotation);
      group.add(ring);
    });
    
    // Central glowing sphere
    const coreGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    tagAllowedSphere(core, { role: 'canonicalSphere', source: 'AINodeModel.createNeuralNode', owner: group.userData?.id || group.uuid });
    group.add(core);
    
    group.userData = {
      type: 'neural',
      color: color,
      mainBody: mainBody,
      edges: edges,
      core: core
    };
    
    return group;
  }
  
  /**
   * Animate node (rotation, pulse, etc)
   * [SESSION 103] Emergency lockdown: Skip animations, force full visibility
   */
  static animate(nodeGroup, deltaTime, time) {
    if (!nodeGroup.userData.type) return;
    
    // ========================================================================
    // SESSION 103: EMERGENCY VISUAL LOCKDOWN
    // Override all animations - force node cores fully visible
    // ========================================================================
    if (window.DEBUG_VISUAL_MODE) {
      // Force core material to be fully visible
      nodeGroup.traverse((child) => {
        if (child.material && typeof child.material.opacity !== 'undefined') {
          child.material.opacity = 1.0;
        }
        if (child.material && typeof child.material.depthWrite !== 'undefined') {
          child.material.depthWrite = true;
        }
        if (child.material && typeof child.material.depthTest !== 'undefined') {
          child.material.depthTest = true;
        }
      });
      
      // Skip all animations
      return;
    }
    
    const data = nodeGroup.userData;
    
    // Gentle rotation
    nodeGroup.rotation.y += deltaTime * 0.3;
    
    // Main body remains at static scale/emissive (breathing disabled)
    if (data.mainBody) {
      // preserve current scale/emissiveIntensity as initialized
    }
    
    // Edges remain at configured opacity (breathing disabled)
    if (data.edges) {
      // no per-frame opacity modulation
    }
    
    // Special animations per type
    switch(data.type) {
      case 'core':
        // Rotate rings
        nodeGroup.children.forEach((child, i) => {
          if (child.geometry?.type === 'TorusGeometry') {
            child.rotation.z += deltaTime * (0.5 + i * 0.2);
          }
        });
        break;
        
      case 'memory':
        // Wireframe remains at configured opacity (no pulsing)
        break;
        
      case 'neural':
        // Core visuals remain static (no pulsing)
        break;
    }
  }
  
  /**
   * Get node color by type name
   */
  static getColorByType(typeName) {
    const colors = {
      data: 0x00ddff,      // Cyan
      memory: 0xff00dd,    // Magenta
      logic: 0xddff00,     // Yellow
      dream: 0xaa88ff,     // Purple
      core: 0x00ffaa,      // Teal
      neural: 0xff6600     // Orange
    };
    return colors[typeName] || 0x00ffff;
  }

  /**
   * Add interaction collider to ANY node group
   * Creates an invisible sphere that serves as the sole interaction target
   * 
   * Call this on any existing node to add interaction authority
   * @param {THREE.Group} nodeGroup - The node to add collider to
   * @param {number} radius - Collider radius (default: 1.2)
   */
  static ensureInteractionCollider(nodeGroup, radius = 1.2) {
    // Don't add if already has one
    if (nodeGroup.userData.interactionCollider) {
      return nodeGroup.userData.interactionCollider;
    }

    // Find or create nodeRoot
    let nodeRoot = nodeGroup.userData.nodeRoot;
    if (!nodeRoot) {
      nodeRoot = new THREE.Group();
      nodeGroup.add(nodeRoot);
      nodeGroup.userData.nodeRoot = nodeRoot;
    }

    // Create invisible collider
    const colliderGeometry = new THREE.SphereGeometry(radius, 8, 8);
    const colliderMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      wireframe: false,
      depthWrite: false,
      depthTest: false
    });
    const collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
    tagAllowedSphere(collider, { role: 'collider', source: 'AINodeModel.ensureInteractionCollider', owner: nodeGroup.userData?.id || nodeGroup.uuid });
    collider.userData.interactionAuthority = true;
    collider.userData.isInteractionCollider = true;
    collider.name = 'InteractionCollider';
    
    nodeRoot.add(collider);
    nodeGroup.userData.interactionCollider = collider;

    return collider;
  }
}

