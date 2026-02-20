import * as THREE from 'three';

/**
 * SAFE LINK MEMORY TRAILS
 * 
 * Creates neon afterimages for link pulses.
 * As links pulse with traffic/energy, they leave ghost-traces.
 * 
 * SAFETY RULES:
 * - ZERO modifications to Link class
 * - ZERO modifications to linking system
 * - All trails are independent VFX objects
 * - All state stored in MemoryTrailRegistry
 * - Non-invasive and completely reversible
 */

export class SafeLinkMemoryTrails {
  constructor(scene, worldRoot, memoryTrailRegistry) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.registry = memoryTrailRegistry;
    const attachRoot = worldRoot || scene;
    
    // VFX container
    this.trailContainer = new THREE.Group();
    this.trailContainer.name = 'LinkMemoryTrailsContainer';
    attachRoot.add(this.trailContainer);
    this.root = this.trailContainer;
    
    // Material cache
    this.materials = {
      linkStreak: new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6,
        fog: false,
        linewidth: 2
      }),
      linkGhost: new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2,
        fog: false,
        depthWrite: false
      })
    };
    
    // Particle system
    this.particles = [];
    this.maxParticles = 300;
    
    // Tracking
    this.activeLinkIds = new Set();
    this.linkColorCache = new Map();
  }
  
  /**
   * Register trail for a link
   */
  addLinkTrail(linkId, link, color = null) {
    if (!this.activeLinkIds.has(linkId)) {
      const startPos = link.source ? link.source.position : link.geometry.attributes.position.array.slice(0, 3);
      const endPos = link.target ? link.target.position : link.geometry.attributes.position.array.slice(-3);
      
      this.registry.registerLinkTrail(linkId, startPos, endPos);
      this.activeLinkIds.add(linkId);
      
      if (color) {
        this.linkColorCache.set(linkId, color);
      }
    }
  }
  
  /**
   * Capture link state as trail snapshot
   */
  captureGlowSnapshot(linkId, glowIntensity, trafficLoad = 0) {
    this.registry.addLinkTrailGlowSnapshot(linkId, glowIntensity);
    
    // Create spark particles during strong pulses
    if (glowIntensity > 0.5) {
      this.createLinkSparkles(linkId, glowIntensity, trafficLoad);
    }
  }
  
  /**
   * Create spark particles along link during pulse
   */
  createLinkSparkles(linkId, intensity, trafficLoad = 0) {
    const trail = this.registry.getLinkTrail(linkId);
    if (!trail) return;
    
    const sparkCount = Math.floor(8 * intensity * (1 + trafficLoad));
    const color = this.linkColorCache.get(linkId) || { r: 0.0, g: 1.0, b: 1.0 };
    
    for (let i = 0; i < sparkCount; i++) {
      if (this.particles.length >= this.maxParticles) break;
      
      // Random position along link
      const t = Math.random();
      const position = new THREE.Vector3().lerpVectors(trail.startPos, trail.endPos, t);
      
      // Random direction away from link
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      
      this.particles.push({
        position: position.clone(),
        velocity: velocity,
        age: 0,
        maxAge: 0.6,
        size: 0.08 + Math.random() * 0.08,
        initialSize: 0.08 + Math.random() * 0.08,
        opacity: intensity,
        color: color,
        type: 'spark'
      });
    }
  }
  
  /**
   * Create distortion effect for special link types
   */
  createLinkDistortion(linkId, distortionType = 'FRACTAL') {
    const trail = this.registry.getLinkTrail(linkId);
    if (!trail) return;
    
    const particleCount = distortionType === 'SIGMA' ? 20 : 12;
    const color = distortionType === 'SIGMA' 
      ? { r: 0.8, g: 0.0, b: 1.0 }  // Magenta for Sigma
      : { r: 1.0, g: 0.5, b: 0.0 }; // Orange for Fractal
    
    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length >= this.maxParticles) break;
      
      const t = Math.random();
      const position = new THREE.Vector3().lerpVectors(trail.startPos, trail.endPos, t);
      
      if (distortionType === 'SIGMA') {
        // Sigma: glitchy, jumpy particles
        position.addScaledVector(
          new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5),
          0.5
        );
      } else {
        // Fractal: swirly, circular patterns
        const angle = Math.random() * Math.PI * 2;
        const offset = new THREE.Vector3(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0);
        position.add(offset);
      }
      
      this.particles.push({
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        ),
        age: 0,
        maxAge: distortionType === 'SIGMA' ? 0.3 : 0.8,
        size: 0.15,
        initialSize: 0.15,
        opacity: 0.7,
        color: color,
        type: 'distortion'
      });
    }
  }
  
  /**
   * Remove trail for deleted link
   */
  removeLinkTrail(linkId) {
    this.registry.clearLinkTrails(linkId);
    this.activeLinkIds.delete(linkId);
    this.linkColorCache.delete(linkId);
  }
  
  /**
   * Update all link trails
   */
  update(deltaTime, legendaryLinkData = null) {
    // Update particles
    this.updateParticles(deltaTime);
    
    // Build trail meshes from registry data
    this.buildTrailMeshes(legendaryLinkData);
  }
  
  /**
   * Build trail meshes from link glow history
   */
  buildTrailMeshes(legendaryLinkData) {
    // Clear previous meshes
    for (let i = this.trailContainer.children.length - 1; i >= 0; i--) {
      const child = this.trailContainer.children[i];
      if (child.userData.linkTrail) {
        child.geometry.dispose();
        if (child.material.dispose) child.material.dispose();
        this.trailContainer.remove(child);
      }
    }
    
    // Build meshes for active trails
    for (const [linkId, trail] of this.registry.linkTrails.entries()) {
      if (trail.glowHistory.length < 2) continue;
      
      // Build ghost curve from glow history
      const ghostMesh = this.createGhostCurve(trail, linkId);
      if (ghostMesh) {
        ghostMesh.userData.linkTrail = true;
        this.trailContainer.add(ghostMesh);
      }
    }
  }
  
  /**
   * Create ghost curve mesh from glow history
   */
  createGhostCurve(trail, linkId) {
    const positions = [];
    const colors = [];
    const indices = [];
    
    const glowCount = trail.glowHistory.length;
    if (glowCount < 2) return null;
    
    const color = this.linkColorCache.get(linkId) || { r: 0.0, g: 1.0, b: 1.0 };
    const ribbonWidth = 0.2;
    
    // Create tube along link path with glow intensity varying
    for (let i = 0; i < glowCount; i++) {
      const glow = trail.glowHistory[i];
      const t = i / (glowCount - 1);
      
      // Position along link
      const pos = new THREE.Vector3().lerpVectors(trail.startPos, trail.endPos, t);
      
      // Fade based on age
      const fadeOut = 1 - (glow.age / glow.maxAge);
      const intensity = glow.intensity * fadeOut;
      
      // Create ribbon perpendicular to link
      const linkDir = new THREE.Vector3().subVectors(trail.endPos, trail.startPos).normalize();
      const normal = new THREE.Vector3(0, 1, 0).cross(linkDir).normalize();
      
      const v1 = pos.clone().addScaledVector(normal, ribbonWidth * intensity);
      const v2 = pos.clone().addScaledVector(normal, -ribbonWidth * intensity);
      
      positions.push(v1.x, v1.y, v1.z);
      positions.push(v2.x, v2.y, v2.z);
      
      colors.push(color.r, color.g, color.b, intensity * 0.5);
      colors.push(color.r, color.g, color.b, intensity * 0.3);
    }
    
    // Build indices
    for (let i = 0; i < glowCount - 1; i++) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      
      indices.push(v0, v2, v1);
      indices.push(v2, v3, v1);
    }
    
    const geometry = new THREE.BufferGeometry();
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
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.age += deltaTime;
      
      if (particle.age >= particle.maxAge) {
        this.particles.splice(i, 1);
      } else {
        // Update physics
        particle.position.addScaledVector(particle.velocity, deltaTime);
        
        if (particle.type === 'distortion') {
          // Glitch effect - random jitter
          particle.position.x += (Math.random() - 0.5) * 0.05;
          particle.position.y += (Math.random() - 0.5) * 0.05;
          particle.position.z += (Math.random() - 0.5) * 0.05;
        } else {
          // Normal drag
          particle.velocity.multiplyScalar(0.93);
        }
        
        particle.opacity = (1 - particle.age / particle.maxAge) * particle.initialOpacity;
      }
    }
  }
  
  /**
   * Get current stats
   */
  getStats() {
    return {
      activeLinkTrails: this.registry.stats.activeLinkTrails,
      totalParticles: this.particles.length
    };
  }
  
  /**
   * Clear all link trails
   */
  clearAllTrails() {
    this.registry.clearAllTrails();
    this.activeLinkIds.clear();
    this.linkColorCache.clear();
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
