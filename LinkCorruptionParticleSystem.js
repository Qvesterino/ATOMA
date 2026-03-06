/**
 * LINK CORRUPTION PARTICLE SYSTEM
 * ============================================================================
 * Emits and animates corruption particles that travel along links from
 * source to target nodes, visualizing the spread of corruption
 * 
 * Features:
 * - Particles flow source → target along link curves
 * - Emission rate scales with corruption level
 * - Particle speed varies by corruption intensity
 * - Color shifts: clean → tainted → corrupted
 * - Opacity modulation with distance traveled
 * - Independent particle trajectories per link
 * - Efficient pooling and reuse
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';

export class LinkCorruptionParticleSystem {
  constructor(scene) {
    this.scene = scene;
    
    // Per-link particle state
    this.linkParticles = new Map(); // link.id → { particles[], emissionTime, lastSpawnTime }
    
    // Particle pool for reuse
    this.particlePool = [];
    this.maxPoolSize = 500;
    
    // Configuration
    this.config = {
      // Emission
      emissionStartThreshold: 0.2,      // Corruption % that triggers particles
      baseEmissionRate: 15,             // Particles per second at full corruption
      maxEmissionRate: 50,              // Cap on emission rate
      
      // Particle lifecycle
      particleLifetime: 2.0,            // Seconds before particle dies
      particleTrailLength: 0.15,        // Fraction of link to occupy
      
      // Speed
      baseParticleSpeed: 0.8,           // Units per second (clean)
      maxParticleSpeed: 2.5,            // Units per second (fully corrupted)
      
      // Size
      baseParticleSize: 0.04,
      maxParticleSize: 0.12,
      
      // Color progression
      cleanColor: new THREE.Color(0x00ffff),
      taintedColor: new THREE.Color(0xff6633),
      corruptedColor: new THREE.Color(0xff0044),
      
      // Spread variation
      speedVariation: 0.2,              // ±20% speed randomness
      sizeVariation: 0.3,               // ±30% size randomness
      angleSpread: 0.15,                // Radial spread angle in radians
    };
    
    // Shared geometry and material for all particles
    this._initializeGeometry();
    
    // Time tracking
    this.time = 0;
  }
  
  /**
   * Initialize shared geometry and material
   * @private
   */
  _initializeGeometry() {
    // Use small spheres for particles
    this.particleGeometry = new THREE.SphereGeometry(1.0, 4, 4);
    
    // Instanced material for efficiency
    this.particleMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: 0xff0044,
      emissiveIntensity: 0.8,
      roughness: 0.4,
      metalness: 0.6,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
  }
  
  /**
   * Update corruption particles for a link
   * @param {Object} link - Link object with source, target, curve, corruptionLevel
   * @param {number} deltaTime - Delta time in seconds
   * @returns {Object} Particle state for this link
   */
  updateLinkParticles(link, deltaTime) {
    if (!link.id || !link.source || !link.target || !link.curve) {
      return null;
    }
    
    const corruptionLevel = Math.max(0, link.corruptionLevel ?? link.corruption ?? 0);
    
    // Initialize if first time
    let linkState = this.linkParticles.get(link.id);
    if (!linkState) {
      linkState = {
        particles: [],
        emissionTime: 0,
        lastSpawnTime: performance.now(),
        corruptionLevel: 0
      };
      this.linkParticles.set(link.id, linkState);
    }
    
    // Spawn new particles based on corruption level
    if (corruptionLevel > this.config.emissionStartThreshold) {
      this._spawnParticles(link, linkState, corruptionLevel, deltaTime);
    }
    
    // Update existing particles
    this._updateParticles(link, linkState, corruptionLevel, deltaTime);
    
    // Remove dead particles
    linkState.particles = linkState.particles.filter(p => !p.isDead);
    
    // Clean up empty link states
    if (linkState.particles.length === 0 && corruptionLevel === 0) {
      this.linkParticles.delete(link.id);
      return null;
    }
    
    linkState.corruptionLevel = corruptionLevel;
    return linkState;
  }
  
  /**
   * Spawn new particles for a link
   * @private
   */
  _spawnParticles(link, linkState, corruptionLevel, deltaTime) {
    // Calculate emission rate based on corruption
    const emissionRate = Math.min(
      this.config.maxEmissionRate,
      this.config.baseEmissionRate * corruptionLevel
    );
    
    const particlesToSpawn = Math.floor(emissionRate * deltaTime);
    
    for (let i = 0; i < particlesToSpawn; i++) {
      const particle = this._createParticle(link, corruptionLevel);
      if (particle) {
        linkState.particles.push(particle);
      }
    }
  }
  
  /**
   * Create a single corruption particle
   * @private
   */
  _createParticle(link, corruptionLevel) {
    let particle = this.particlePool.length > 0 
      ? this.particlePool.pop() 
      : this._createNewParticle();
    
    if (!particle) return null;
    
    // Start at source node position
    particle.position.copy(link.source.position);
    
    // Randomize starting position slightly around source
    const startSpread = 0.3;
    particle.position.x += (Math.random() - 0.5) * startSpread;
    particle.position.y += (Math.random() - 0.5) * startSpread;
    particle.position.z += (Math.random() - 0.5) * startSpread;
    
    // Set particle properties based on corruption
    particle.corruption = corruptionLevel;
    particle.speed = this.config.baseParticleSpeed + 
                     (corruptionLevel * (this.config.maxParticleSpeed - this.config.baseParticleSpeed)) +
                     (Math.random() - 0.5) * this.config.speedVariation;
    
    particle.size = this.config.baseParticleSize +
                    (corruptionLevel * (this.config.maxParticleSize - this.config.baseParticleSize)) +
                    (Math.random() - 0.5) * this.config.sizeVariation;
    
    particle.size = Math.max(0.02, Math.min(0.2, particle.size));
    particle.progress = 0; // 0-1 along the link
    particle.age = 0;
    particle.lifetime = this.config.particleLifetime;
    particle.isDead = false;
    
    // Store reference to link for trajectory
    particle.link = link;
    
    // Random angle spread for visual variance
    particle.angleX = (Math.random() - 0.5) * this.config.angleSpread;
    particle.angleY = (Math.random() - 0.5) * this.config.angleSpread;
    particle.angleZ = (Math.random() - 0.5) * this.config.angleSpread;
    
    this.scene.add(particle.mesh);
    
    return particle;
  }
  
  /**
   * Create a new particle mesh for pooling
   * @private
   */
  _createNewParticle() {
    const mesh = new THREE.Mesh(this.particleGeometry, this.particleMaterial.clone());
    tagAllowedSphere(mesh, { role: 'vfx', source: 'LinkCorruptionParticleSystem._createNewParticle' });
    clampSphere(mesh);
    mesh.castShadow = true;
    const particlesOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
    mesh.renderOrder = particlesOrder;
    
    return {
      mesh: mesh,
      position: new THREE.Vector3(),
      startPos: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      progress: 0,
      age: 0,
      lifetime: 2.0,
      speed: 1.0,
      size: 0.05,
      corruption: 0,
      isDead: false,
      link: null,
      angleX: 0,
      angleY: 0,
      angleZ: 0
    };
  }
  
  /**
   * Update particle positions and properties
   * @private
   */
  _updateParticles(link, linkState, corruptionLevel, deltaTime) {
    const linkLength = link.source.position.distanceTo(link.target.position);
    const trailLength = Math.max(0.1, this.config.particleTrailLength);
    
    for (const particle of linkState.particles) {
      // Update age and lifetime
      particle.age += deltaTime;
      
      // Calculate progress along link based on speed and age
      const distanceTraveled = particle.speed * particle.age;
      particle.progress = Math.min(1.0, distanceTraveled / linkLength);
      
      // Mark dead if reached target or exceeded lifetime
      if (particle.progress >= 1.0 || particle.age >= particle.lifetime) {
        particle.isDead = true;
        this.scene.remove(particle.mesh);
        this.particlePool.push(particle);
        continue;
      }
      
      // Get position along curve
      if (link.curve && typeof link.curve.getPointAt === 'function') {
        try {
          particle.mesh.position.copy(link.curve.getPointAt(particle.progress));
        } catch (e) {
          particle.isDead = true;
          this.scene.remove(particle.mesh);
          this.particlePool.push(particle);
          continue;
        }
      } else {
        // Fallback: linear interpolation
        particle.mesh.position.lerpVectors(
          link.source.position,
          link.target.position,
          particle.progress
        );
      }
      
      // Add small positional jitter for organic motion
      const jitterAmount = 0.05;
      particle.mesh.position.x += Math.sin(particle.age * 3 + particle.progress) * jitterAmount;
      particle.mesh.position.y += Math.cos(particle.age * 2.5 + particle.progress * 2) * jitterAmount;
      particle.mesh.position.z += Math.sin(particle.age * 2 + particle.progress * 3) * jitterAmount;
      
      // Update scale based on size and fade
      const fadeFactor = this._calculateFade(particle);
      particle.mesh.scale.setScalar(particle.size * fadeFactor);
      
      // Update color based on corruption level
      this._updateParticleColor(particle, corruptionLevel);
      
      // Update opacity with fade
      particle.mesh.material.opacity = 0.8 * fadeFactor;
      
      // Add slight rotation
      particle.mesh.rotation.x += 0.1;
      particle.mesh.rotation.y += 0.15;
      particle.mesh.rotation.z += 0.08;
    }
  }
  
  /**
   * Calculate fade factor for particle (bright at trail start, fades to end)
   * @private
   */
  _calculateFade(particle) {
    // Brightness concentrated at particle trail
    const trailStart = Math.max(0, particle.progress - this.config.particleTrailLength);
    const trailEnd = particle.progress;
    
    // Also fade by lifetime
    const lifeFade = 1.0 - (particle.age / particle.lifetime);
    
    // Peak brightness at trail front
    const distFromFront = Math.max(0, particle.progress - (particle.progress - 0.02));
    const trailBrightness = Math.exp(-distFromFront * distFromFront * 50);
    
    return Math.max(0.1, Math.min(1.0, trailBrightness * lifeFade));
  }
  
  /**
   * Update particle color based on corruption level
   * @private
   */
  _updateParticleColor(particle, corruptionLevel) {
    let color;
    
    if (corruptionLevel < 0.4) {
      // Tainted: blend clean → tainted
      const t = corruptionLevel / 0.4;
      color = new THREE.Color().lerpColors(
        this.config.cleanColor,
        this.config.taintedColor,
        t
      );
    } else if (corruptionLevel < 0.8) {
      // Corrupted: blend tainted → corrupted
      const t = (corruptionLevel - 0.4) / 0.4;
      color = new THREE.Color().lerpColors(
        this.config.taintedColor,
        this.config.corruptedColor,
        t
      );
    } else {
      // Fully corrupted
      color = this.config.corruptedColor.clone();
    }
    
    if (particle.mesh.material.color) {
      particle.mesh.material.color.copy(color);
    }
    if (particle.mesh.material.emissive) {
      particle.mesh.material.emissive.copy(color).multiplyScalar(0.7);
    }
  }
  
  /**
   * Update global time for animations
   * @param {number} deltaTime - Delta time in seconds
   */
  updateTime(deltaTime) {
    this.time += deltaTime;
  }
  
  /**
   * Get particle count for a link
   * @param {string} linkId - Link ID
   * @returns {number} Current particle count
   */
  getParticleCount(linkId) {
    const state = this.linkParticles.get(linkId);
    return state ? state.particles.length : 0;
  }
  
  /**
   * Get total particle count across all links
   * @returns {number} Total particles
   */
  getTotalParticleCount() {
    let total = 0;
    for (const state of this.linkParticles.values()) {
      total += state.particles.length;
    }
    return total;
  }
  
  /**
   * Clear particles for a link (on link removal)
   * @param {string} linkId - Link ID
   */
  clearLinkParticles(linkId) {
    const state = this.linkParticles.get(linkId);
    if (!state) return;
    
    // Remove all particles for this link
    for (const particle of state.particles) {
      this.scene.remove(particle.mesh);
      this.particlePool.push(particle);
    }
    
    state.particles = [];
    this.linkParticles.delete(linkId);
  }
  
  /**
   * Clear all particles and reset
   */
  dispose() {
    // Remove all particles from scene
    for (const state of this.linkParticles.values()) {
      for (const particle of state.particles) {
        this.scene.remove(particle.mesh);
      }
    }
    
    this.linkParticles.clear();
    this.particlePool.forEach(p => {
      if (p.mesh.parent) this.scene.remove(p.mesh);
    });
    this.particlePool = [];
    
    // Dispose geometry and materials
    if (this.particleGeometry) {
      this.particleGeometry.dispose();
    }
    if (this.particleMaterial) {
      this.particleMaterial.dispose();
    }
  }
}

