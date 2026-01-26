import * as THREE from 'three';

/**
 * ColonyVFXManager.js - Safe Colony Visual Effects System
 * 
 * SAFE: 100% non-destructive VFX overlays
 * - Creates halos, rings, particles, glows, and distortion effects
 * - All meshes stored in scene but completely separate from nodes
 * - Can be removed without affecting core systems
 */

export class ColonyVFXManager {
  constructor(scene) {
    this.scene = scene;
    
    // Container for all colony VFX (for easy cleanup)
    this.vfxContainer = new THREE.Group();
    this.vfxContainer.name = 'colony-vfx-container';
    this.scene.add(this.vfxContainer);
    
    // Texture for particles
    this.particleTexture = this.createParticleTexture();
    
    // Configuration
    this.config = {
      colors: {
        CALM: 0x00d4ff,        // Cyan
        ACTIVE: 0x00ff00,      // Green
        OVERDRIVE: 0xff0099,   // Magenta
        DECLINING: 0x660099,   // Purple
        
        DEFAULT: 0x00d4ff,
        QUANTUM: 0x00ff88,
        SIGMA: 0xff00ff,
        LEGENDARY: 0xffff00
      },
      
      halo: {
        radiusScale: 0.8,      // Multiplier on actual radius
        opacity: 0.6,
        segments: 32
      },
      
      rings: {
        radiusStep: 0.5,
        maxRings: 6,
        opacity: 0.4
      },
      
      particles: {
        count: 50,
        maxPerColony: 100,
        speed: 1.0,
        lifetime: 3.0
      },
      
      pulse: {
        minFrequency: 1.0,
        maxFrequency: 4.0,
        minIntensity: 0.5,
        maxIntensity: 2.0
      }
    };
  }
  
  /**
   * Create particle texture
   */
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,0)';
    ctx.fillRect(0, 0, 64, 64);
    
    // Draw soft circle
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.beginPath();
    ctx.arc(32, 32, 24, 0, Math.PI * 2);
    ctx.fill();
    
    // Blur effect
    ctx.filter = 'blur(8px)';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(32, 32, 20, 0, Math.PI * 2);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * Create halo for colony
   */
  createHalo(colonyId, center, stage, mood, colonyType) {
    const color = this.getColorForMood(mood, colonyType);
    const radius = this.getRadiusForStage(stage);
    
    // Create ring geometry (horizontal halo)
    const geometry = new THREE.TorusGeometry(
      radius,
      0.15,
      16,
      32
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: this.config.halo.opacity,
      fog: false
    });
    
    const halo = new THREE.Mesh(geometry, material);
    halo.position.copy(center);
    halo.rotation.x = Math.random() * 0.2; // Slight tilt
    halo.scale.z = 0.3; // Flatten it
    
    halo.userData = {
      colonyId: colonyId,
      type: 'halo',
      baseMood: mood,
      baseColor: color,
      pulseAmplitude: 0.3
    };
    
    this.vfxContainer.add(halo);
    return halo;
  }
  
  /**
   * Create orbit rings around colony center
   */
  createOrbitRings(colonyId, center, stage, mood, colonyType) {
    const rings = [];
    const color = this.getColorForMood(mood, colonyType);
    const ringCount = Math.min(stage, this.config.rings.maxRings);
    
    for (let i = 0; i < ringCount; i++) {
      const radius = (i + 1) * this.config.rings.radiusStep;
      
      const geometry = new THREE.TorusGeometry(radius, 0.08, 16, 64);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: this.config.rings.opacity * (1 - i / ringCount),
        fog: false
      });
      
      const ring = new THREE.Mesh(geometry, material);
      ring.position.copy(center);
      ring.rotation.x = (Math.PI / 2) * (i % 2); // Alternate orientation
      ring.rotation.z = (Math.PI / 4) * i; // Rotation offset
      
      ring.userData = {
        colonyId: colonyId,
        type: 'orbit-ring',
        ringIndex: i,
        maxRings: ringCount,
        rotationSpeed: 0.5 + Math.random() * 0.5
      };
      
      this.vfxContainer.add(ring);
      rings.push(ring);
    }
    
    return rings;
  }
  
  /**
   * Create floating particles around colony
   */
  createParticles(colonyId, center, stage, mood, colonyType) {
    const particles = [];
    const color = this.getColorForMood(mood, colonyType);
    const count = Math.ceil(
      this.config.particles.count * (stage / 4) *
      (this.config.particles.maxPerColony / 100)
    );
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(3);
      
      // Start at center + offset
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 3 + 1;
      positions[0] = center.x + Math.cos(angle) * distance;
      positions[1] = center.y + Math.random() * 2;
      positions[2] = center.z + Math.sin(angle) * distance;
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.PointsMaterial({
        size: 0.2 + Math.random() * 0.1,
        sizeAttenuation: true,
        map: this.particleTexture,
        color: color,
        transparent: true,
        opacity: 0.6,
        fog: false
      });
      
      const particle = new THREE.Points(geometry, material);
      
      particle.userData = {
        colonyId: colonyId,
        type: 'particle',
        startPos: new THREE.Vector3().copy(center),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.3,
          (Math.random() - 0.5) * 0.5
        ),
        lifetime: this.config.particles.lifetime,
        elapsed: 0,
        maxLifetime: this.config.particles.lifetime
      };
      
      this.vfxContainer.add(particle);
      particles.push(particle);
    }
    
    return particles;
  }
  
  /**
   * Create central glow (for higher stages)
   */
  createCentralGlow(colonyId, center, stage, mood, colonyType) {
    if (stage < 3) return null;
    
    const color = this.getColorForMood(mood, colonyType);
    
    // Sphere glow at center
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      fog: false
    });
    
    const glow = new THREE.Mesh(geometry, material);
    glow.position.copy(center);
    
    glow.userData = {
      colonyId: colonyId,
      type: 'central-glow',
      pulsePhase: 0,
      pulseSpeed: 2.0
    };
    
    this.vfxContainer.add(glow);
    return glow;
  }
  
  /**
   * Create holographic crown for legendary colonies
   */
  createLegendaryCrown(colonyId, center, stage, colonyType) {
    if (colonyType !== 'LEGENDARY') return null;
    
    const color = this.config.colors.LEGENDARY;
    
    // Crown made of small pyramids
    const crown = new THREE.Group();
    crown.position.copy(center);
    crown.position.y += 0.8;
    
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const radius = 0.6;
      
      const geometry = new THREE.ConeGeometry(0.2, 0.4, 8);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        fog: false
      });
      
      const spike = new THREE.Mesh(geometry, material);
      spike.position.x = Math.cos(angle) * radius;
      spike.position.z = Math.sin(angle) * radius;
      spike.rotation.z = angle;
      
      crown.add(spike);
    }
    
    crown.userData = {
      colonyId: colonyId,
      type: 'legendary-crown',
      rotationSpeed: 0.3
    };
    
    this.vfxContainer.add(crown);
    return crown;
  }
  
  /**
   * Update particle positions and lifetimes
   */
  updateParticles(deltaTime) {
    // Find all particle objects
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'particle') {
        const userData = child.userData;
        
        // Update position
        const pos = child.geometry.attributes.position.array;
        pos[0] += userData.velocity.x * deltaTime;
        pos[1] += userData.velocity.y * deltaTime;
        pos[2] += userData.velocity.z * deltaTime;
        child.geometry.attributes.position.needsUpdate = true;
        
        // Update lifetime
        userData.elapsed += deltaTime;
        
        // Fade out as lifetime ends
        const progress = userData.elapsed / userData.lifetime;
        child.material.opacity = 0.6 * (1 - progress);
      }
    }
  }
  
  /**
   * Update halo animations (pulse, rotation)
   */
  updateHalos(deltaTime) {
    const time = performance.now() * 0.001;
    
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'halo') {
        const userData = child.userData;
        
        // Pulsing effect
        const pulse = Math.sin(time * 2) * 0.15 + 1;
        child.scale.setScalar(pulse);
        
        // Slow rotation
        child.rotation.y += deltaTime * 0.3;
      }
    }
  }
  
  /**
   * Update orbit rings (rotation + opacity pulse)
   */
  updateRings(deltaTime) {
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'orbit-ring') {
        const userData = child.userData;
        
        // Rotate each ring
        child.rotation.z += deltaTime * userData.rotationSpeed;
        child.rotation.x += deltaTime * userData.rotationSpeed * 0.3;
      }
    }
  }
  
  /**
   * Update central glow animation
   */
  updateCentralGlows(deltaTime) {
    const time = performance.now() * 0.001;
    
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'central-glow') {
        const userData = child.userData;
        
        // Pulse glow
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        const pulse = Math.sin(userData.pulsePhase) * 0.2 + 0.3;
        child.material.opacity = pulse;
        
        // Scale pulse
        const scaleModifier = 0.9 + Math.sin(userData.pulsePhase) * 0.2;
        child.scale.setScalar(scaleModifier);
      }
    }
  }
  
  /**
   * Update legendary crowns (rotation)
   */
  updateLegendaryCrowns(deltaTime) {
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'legendary-crown') {
        const userData = child.userData;
        child.rotation.y += deltaTime * userData.rotationSpeed;
        child.rotation.z += deltaTime * userData.rotationSpeed * 0.5;
      }
    }
  }
  
  /**
   * Update colony VFX state changes
   */
  updateVFXForColony(colonyId, colony, registryVFX) {
    if (!registryVFX[colonyId]) return;
    
    const vfx = registryVFX[colonyId];
    
    // Update colors based on mood
    const color = this.getColorForMood(colony.mood, colony.type);
    
    if (vfx.halo && vfx.halo.material) {
      vfx.halo.material.color.setHex(color);
    }
    
    for (const ring of vfx.rings) {
      if (ring && ring.material) {
        ring.material.color.setHex(color);
      }
    }
    
    for (const particle of vfx.particles) {
      if (particle && particle.material) {
        particle.material.color.setHex(color);
      }
    }
    
    if (vfx.core && vfx.core.material) {
      vfx.core.material.color.setHex(color);
    }
  }
  
  /**
   * Trigger colony birth event (expanding ring burst)
   */
  triggerBirthEvent(colonyId, center, color) {
    const geometry = new THREE.TorusGeometry(0.1, 0.05, 16, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1.0,
      fog: false
    });
    
    const burst = new THREE.Mesh(geometry, material);
    burst.position.copy(center);
    burst.scale.setScalar(0.1);
    
    burst.userData = {
      type: 'birth-event',
      elapsed: 0,
      lifetime: 0.5,
      expandSpeed: 3.0
    };
    
    this.vfxContainer.add(burst);
    return burst;
  }
  
  /**
   * Trigger colony collapse event (implosion)
   */
  triggerCollapseEvent(colonyId, center, color) {
    const geometry = new THREE.SphereGeometry(1.0, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      fog: false
    });
    
    const collapse = new THREE.Mesh(geometry, material);
    collapse.position.copy(center);
    
    collapse.userData = {
      type: 'collapse-event',
      elapsed: 0,
      lifetime: 0.8,
      collapseSpeed: 2.0
    };
    
    this.vfxContainer.add(collapse);
    return collapse;
  }
  
  /**
   * Update event animations
   */
  updateEvents(deltaTime) {
    const children = [...this.vfxContainer.children];
    
    for (const child of children) {
      if (!child.userData) continue;
      
      const userData = child.userData;
      
      if (userData.type === 'birth-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        
        child.scale.setScalar(0.1 + progress * userData.expandSpeed);
        child.material.opacity = 1 - progress;
        
        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }
      
      if (userData.type === 'collapse-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        
        child.scale.setScalar(1.0 - progress * userData.collapseSpeed);
        child.material.opacity = 0.5 - progress * 0.5;
        
        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }
    }
  }
  
  /**
   * Clean up VFX for a colony
   */
  cleanupColonyVFX(colonyId) {
    const children = [...this.vfxContainer.children];
    
    for (const child of children) {
      if (child.userData && child.userData.colonyId === colonyId) {
        this.vfxContainer.remove(child);
        
        // Dispose geometry and materials
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    }
  }
  
  /**
   * Get color based on mood
   */
  getColorForMood(mood, colonyType) {
    if (this.config.colors[mood]) {
      return this.config.colors[mood];
    }
    
    if (this.config.colors[colonyType]) {
      return this.config.colors[colonyType];
    }
    
    return this.config.colors.DEFAULT;
  }
  
  /**
   * Get radius based on stage
   */
  getRadiusForStage(stage) {
    return 1.0 + stage * 0.3;
  }
  
  /**
   * Full update cycle
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    this.updateParticles(deltaTime);
    this.updateHalos(deltaTime);
    this.updateRings(deltaTime);
    this.updateCentralGlows(deltaTime);
    this.updateLegendaryCrowns(deltaTime);
    this.updateEvents(deltaTime);
  }
  
  /**
   * Full cleanup (remove all VFX)
   */
  cleanup() {
    this.vfxContainer.clear();
    this.scene.remove(this.vfxContainer);
  }
}
