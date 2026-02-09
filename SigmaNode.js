import * as THREE from 'three';

/**
 * SigmaNode - Specialized ATOMA Node
 * Represents critical system nodes with enhanced visual presence
 */
export class SigmaNode {
  constructor(scene, position = new THREE.Vector3()) {
    this.scene = scene;
    this.position = position.clone();
    this.id = Math.random().toString(36).substr(2, 9);
    
    this.mesh = null;
    this.outlineGroup = null;
    this.pulseEffect = 0;
    this.isSelected = false;
    this.isHovered = false;
    
    this.createGeometry();
  }
  
  /**
   * Create Sigma node geometry and materials
   */
  createGeometry() {
    // Create multi-layer geometry
    const layers = [];
    
    // Core octahedron
    const coreGeo = new THREE.OctahedronGeometry(0.6, 3);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,           // Orange
      emissive: 0xff3300,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    
    // Outer glow sphere
    const glowGeo = new THREE.IcosahedronGeometry(0.8, 2);
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xff9933,
      emissive: 0xff6600,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.4,
      transparent: true,
      opacity: 0.6
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    
    // Create group
    this.outlineGroup = new THREE.Group();
    this.outlineGroup.add(coreMesh);
    this.outlineGroup.add(glowMesh);
    this.outlineGroup.position.copy(this.position);
    
    // Edge lines for neon effect
    const edges = new THREE.EdgesGeometry(coreGeo);
    const pos = edges.attributes?.position?.array;
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[GeometrySource] NaN created in EdgesGeometry', edges);
          break;
        }
      }
    }
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    const edgeMesh = new THREE.LineSegments(edges, lineMat);
    this.outlineGroup.add(edgeMesh);
    
    this.mesh = this.outlineGroup;
    this.scene.add(this.mesh);
  }
  
  /**
   * Update node animation
   */
  update(deltaTime, time) {
    // Pulse glow
    this.pulseEffect = Math.sin(time * 2) * 0.5 + 0.5;
    
    if (this.mesh && this.mesh.children.length > 1) {
      const glowMesh = this.mesh.children[1];
      glowMesh.material.emissiveIntensity = 0.3 + this.pulseEffect * 0.4;
      glowMesh.scale.set(
        1 + this.pulseEffect * 0.1,
        1 + this.pulseEffect * 0.1,
        1 + this.pulseEffect * 0.1
      );
    }
    
    // Scale on hover
    if (this.isHovered) {
      this.mesh.scale.lerp(
        new THREE.Vector3(1.2, 1.2, 1.2),
        deltaTime * 4
      );
    } else if (this.isSelected) {
      this.mesh.scale.lerp(
        new THREE.Vector3(1.1, 1.1, 1.1),
        deltaTime * 4
      );
    } else {
      this.mesh.scale.lerp(
        new THREE.Vector3(1, 1, 1),
        deltaTime * 4
      );
    }
  }
  
  /**
   * Set hover state
   */
  setHovered(hovered) {
    this.isHovered = hovered;
  }
  
  /**
   * Set selected state
   */
  setSelected(selected) {
    this.isSelected = selected;
  }
  
  /**
   * Destroy node
   */
  destroy() {
    this.scene.remove(this.mesh);
  }
}
