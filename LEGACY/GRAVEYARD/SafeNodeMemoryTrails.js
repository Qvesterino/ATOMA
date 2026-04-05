import * as THREE from 'three';

/**
 * SAFE NODE MEMORY TRAILS
 * 
 * Creates holographic memory trails for nodes.
 * Each node leaves behind a trail of faint geometry when moving or pulsing.
 * 
 * SAFETY RULES:
 * - ZERO modifications to Node class
 * - ZERO modifications to physics or gameplay
 * - All trails are independent VFX objects
 * - All state stored in MemoryTrailRegistry
 * - Non-invasive and completely reversible
 */

export class SafeNodeMemoryTrails {
  constructor(scene, worldRoot, memoryTrailRegistry) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.registry = memoryTrailRegistry;
    const attachRoot = worldRoot || scene;
    
    // VFX container
    this.trailContainer = new THREE.Group();
    this.trailContainer.name = 'NodeMemoryTrailsContainer';
    attachRoot.add(this.trailContainer);
    this.root = this.trailContainer;
    
    // Material cache for trails
    this.materials = {
      trailRibbon: new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        fog: false,
        depthWrite: false
      }),
      trailGlow: new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        fog: false,
        depthWrite: false
      })
    };
    
    // Particle system
    this.particles = [];
    this.maxParticles = 500;
    
    // Tracking
    this.activeNodeIds = new Set();
    this.lastUpdateTime = 0;
  }
  
  /**
   * Add trail for a node
   */
  addNodeTrail(nodeId, node, personalityData = null) {
    if (!this.activeNodeIds.has(nodeId)) {
      // Determine trail color from personality or node type
      let color = { r: 0.0, g: 1.0, b: 1.0 }; // Default cyan
      
      if (personalityData && personalityData.color) {
        color = personalityData.color;
      }
      
      this.registry.registerNodeTrail(nodeId, node.position, color);
      this.activeNodeIds.add(nodeId);
    }
  }
  
  /**
   * Update node trail with new position
   */
  updateNodeTrail(nodeId, node, intensity = 1.0) {
    if (!this.activeNodeIds.has(nodeId)) return;
    
    this.registry.addNodeTrailSegment(nodeId, node.position, intensity);
  }
  
  /**
   * Create pulse echo when node evolves or changes mood
   */
  createPulseEcho(nodeId, node, intensity = 1.0) {
    const trail = this.registry.getNodeTrail(nodeId);
    if (!trail) return;
    
    // Add multiple segments quickly to create pulse effect
    for (let i = 0; i < 3; i++) {
      this.registry.addNodeTrailSegment(nodeId, node.position, intensity * (1 - i * 0.2));
    }
    
    // Create expanding rings of particles
    this.createPulseParticles(node.position, trail.color, intensity);
  }
  
  /**
   * Create spiral effect for long-duration interactions
   */
  createSpiralTrail(nodeId, node) {
    const trail = this.registry.getNodeTrail(nodeId);
    if (!trail) return;
    
    // Add segments in spiral pattern (creates visual spiral)
    const spiralSegments = 8;
    for (let i = 0; i < spiralSegments; i++) {
      const angle = (i / spiralSegments) * Math.PI * 2;
      const radius = 0.5;
      
      const offset = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.5,
        Math.sin(angle) * radius
      );
      
      const spiralPos = node.position.clone().add(offset);
      this.registry.addNodeTrailSegment(nodeId, spiralPos, 0.8 - (i / spiralSegments) * 0.5);
    }
  }
  
  /**
   * Create pulse particles expanding outward
   */
  createPulseParticles(position, color, intensity = 1.0) {
    const particleCount = Math.floor(12 * intensity);
    
    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length >= this.maxParticles) break;
      
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const vertAngle = Math.random() * Math.PI;
      
      const velocity = new THREE.Vector3(
        Math.sin(vertAngle) * Math.cos(angle) * 5,
        Math.sin(vertAngle) * Math.sin(angle) * 5,
        Math.cos(vertAngle) * 5
      );
      
      this.particles.push({
        position: position.clone(),
        velocity: velocity,
        age: 0,
        maxAge: 0.8,
        size: 0.1 + Math.random() * 0.1,
        initialSize: 0.1 + Math.random() * 0.1,
        opacity: intensity,
        color: { ...color },
        type: 'pulse'
      });
    }
  }
  
  /**
   * Remove trail for deleted node
   */
  removeNodeTrail(nodeId) {
    this.registry.clearNodeTrails(nodeId);
    this.activeNodeIds.delete(nodeId);
  }
  
  /**
   * Update all trails - build meshes and render
   */
  update(deltaTime, nodes, personalityFX = null, weatherIntensity = 0) {
    // Update particles
    this.updateParticles(deltaTime);
    
    // Build trail meshes from registry data
    this.buildTrailMeshes(deltaTime, personalityFX, weatherIntensity);
  }
  
  /**
   * Build trail meshes from registry segments
   */
  buildTrailMeshes(deltaTime, personalityFX, weatherIntensity) {
    // Clear previous meshes
    this.trailContainer.children = this.trailContainer.children.filter(child => {
      if (child.userData.trailMesh) {
        child.geometry.dispose();
        child.material.dispose();
        return false;
      }
      return true;
    });
    
    // Build meshes for each active trail
    for (const [nodeId, trail] of this.registry.nodeTrails.entries()) {
      if (trail.segments.length < 2) continue;
      
      // Get personality color if available
      let trailColor = trail.color;
      if (personalityFX && personalityFX.getNodeColor && typeof personalityFX.getNodeColor === 'function') {
        const personalityColor = personalityFX.getNodeColor(nodeId);
        if (personalityColor) {
          trailColor = personalityColor;
        }
      }
      
      // Create ribbon mesh from segments
      const ribbonMesh = this.createRibbonMesh(trail.segments, trailColor, weatherIntensity);
      if (ribbonMesh) {
        ribbonMesh.userData.trailMesh = true;
        this.trailContainer.add(ribbonMesh);
        trail.meshes.push(ribbonMesh);
      }
    }
  }
  
  /**
   * Create ribbon mesh from trail segments
   */
  createRibbonMesh(segments, color, weatherIntensity = 0) {
    if (segments.length < 2) return null;
    
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const indices = [];
    
    const ribbonWidth = 0.3;
    
    // Build ribbon vertices
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const nextSeg = segments[i + 1] || seg;
      
      // Calculate ribbon normal
      const direction = new THREE.Vector3().subVectors(nextSeg.position, seg.position).normalize();
      const normal = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
      
      const fadeOut = 1 - (seg.age / seg.maxAge);
      const intensity = seg.intensity * fadeOut;
      
      // Add weather shimmer
      const weatherShimmer = Math.sin(seg.age * 3 + weatherIntensity) * 0.1;
      const finalIntensity = Math.max(0, intensity + weatherShimmer);
      
      // Two vertices per segment (ribbon width)
      const v1 = seg.position.clone().addScaledVector(normal, ribbonWidth);
      const v2 = seg.position.clone().addScaledVector(normal, -ribbonWidth);
      
      positions.push(v1.x, v1.y, v1.z);
      positions.push(v2.x, v2.y, v2.z);
      
      // Color with intensity
      colors.push(color.r, color.g, color.b, finalIntensity);
      colors.push(color.r, color.g, color.b, finalIntensity * 0.7);
    }
    
    // Build indices
    for (let i = 0; i < segments.length - 1; i++) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      
      indices.push(v0, v2, v1);
      indices.push(v2, v3, v1);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  /**
   * Update particles
   */
  updateParticles(deltaTime) {
    // Age and remove dead particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.age += deltaTime;
      
      if (particle.age >= particle.maxAge) {
        this.particles.splice(i, 1);
      } else {
        // Update physics
        particle.position.addScaledVector(particle.velocity, deltaTime);
        particle.velocity.multiplyScalar(0.95); // Drag
        particle.opacity = (1 - particle.age / particle.maxAge);
      }
    }
  }
  
  /**
   * Get current stats
   */
  getStats() {
    return {
      activeNodeTrails: this.registry.stats.activeNodeTrails,
      totalMeshes: this.registry.stats.totalMeshes,
      totalParticles: this.particles.length
    };
  }
  
  /**
   * Clear all node trails
   */
  clearAllTrails() {
    this.registry.clearAllTrails();
    this.activeNodeIds.clear();
    this.trailContainer.clear();
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.clearAllTrails();
    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this.root?.clear?.();
    Object.values(this.materials).forEach(mat => mat.dispose());
  }
}
