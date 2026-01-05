import * as THREE from 'three';

/**
 * Node Hierarchy Effects Pool v1.0 — High-performance effect pooling
 * 
 * Manages reusable effect objects to minimize garbage collection:
 * - Particle systems (reusable geometries, materials)
 * - Ring geometries (expanding circles)
 * - Material instances (optimized clones)
 * - Animation states (reusable effect containers)
 * 
 * Performance:
 * - Zero GC allocations after warm-up
 * - O(1) object acquisition and release
 * - Automatic cleanup on dispose
 */
export class NodeHierarchyEffectsPool {
  constructor(scene, config = {}) {
    this.scene = scene;

    // Pool configuration
    this.config = {
      maxParticles: config.maxParticles || 200,
      maxRings: config.maxRings || 50,
      maxAnimations: config.maxAnimations || 100,
      particleSize: config.particleSize || 0.15,
      ringSegments: config.ringSegments || 64,
    };

    // Particle pool
    this.particles = {
      available: [],
      inUse: new Set(),
    };

    // Ring pool
    this.rings = {
      available: [],
      inUse: new Set(),
    };

    // Material pool
    this.materials = {
      particleBase: null,
      ringBase: null,
    };

    // Animation state pool
    this.animationStates = {
      available: [],
      inUse: new Set(),
    };

    // Statistics
    this.stats = {
      particlesCreated: 0,
      ringsCreated: 0,
      particlesAcquired: 0,
      particlesReleased: 0,
      ringsAcquired: 0,
      ringsReleased: 0,
    };

    // Initialize
    this._initializeMaterials();
    this._prewarmPools();
  }

  /**
   * Acquire particle from pool
   */
  acquireParticle(color) {
    let particle;

    if (this.particles.available.length > 0) {
      particle = this.particles.available.pop();
    } else if (this.particles.inUse.size < this.config.maxParticles) {
      particle = this._createParticle();
      this.stats.particlesCreated++;
    } else {
      console.warn('[EffectsPool] Particle pool exhausted, recycling oldest');
      return null;
    }

    particle.visible = true;
    if (particle.material) {
      particle.material.color.copy(color);
      particle.material.opacity = 1.0;
    }

    this.particles.inUse.add(particle);
    this.stats.particlesAcquired++;

    return particle;
  }

  /**
   * Release particle back to pool
   */
  releaseParticle(particle) {
    if (!particle || !this.particles.inUse.has(particle)) return;

    particle.visible = false;
    this.particles.inUse.delete(particle);

    if (this.particles.available.length < this.config.maxParticles) {
      this.particles.available.push(particle);
    } else {
      particle.geometry.dispose();
      particle.material.dispose();
      this.scene.remove(particle);
    }

    this.stats.particlesReleased++;
  }

  /**
   * Acquire ring from pool
   */
  acquireRing(color) {
    let ring;

    if (this.rings.available.length > 0) {
      ring = this.rings.available.pop();
    } else if (this.rings.inUse.size < this.config.maxRings) {
      ring = this._createRing();
      this.stats.ringsCreated++;
    } else {
      console.warn('[EffectsPool] Ring pool exhausted');
      return null;
    }

    ring.visible = true;
    if (ring.material) {
      ring.material.color.copy(color);
      ring.material.opacity = 1.0;
    }

    this.rings.inUse.add(ring);
    this.stats.ringsAcquired++;

    return ring;
  }

  /**
   * Release ring back to pool
   */
  releaseRing(ring) {
    if (!ring || !this.rings.inUse.has(ring)) return;

    ring.visible = false;
    this.rings.inUse.delete(ring);

    if (this.rings.available.length < this.config.maxRings) {
      this.rings.available.push(ring);
    } else {
      ring.geometry.dispose();
      ring.material.dispose();
      this.scene.remove(ring);
    }

    this.stats.ringsReleased++;
  }

  /**
   * Get animation state object (reusable)
   */
  acquireAnimationState() {
    let state;

    if (this.animationStates.available.length > 0) {
      state = this.animationStates.available.pop();
    } else {
      state = this._createAnimationState();
    }

    this.animationStates.inUse.add(state);
    return state;
  }

  /**
   * Release animation state back to pool
   */
  releaseAnimationState(state) {
    if (!state || !this.animationStates.inUse.has(state)) return;

    this.animationStates.inUse.delete(state);

    if (this.animationStates.available.length < this.config.maxAnimations) {
      this.animationStates.available.push(state);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      particles: {
        inUse: this.particles.inUse.size,
        available: this.particles.available.length,
        total: this.particles.inUse.size + this.particles.available.length,
        created: this.stats.particlesCreated,
      },
      rings: {
        inUse: this.rings.inUse.size,
        available: this.rings.available.length,
        total: this.rings.inUse.size + this.rings.available.length,
        created: this.stats.ringsCreated,
      },
      animations: {
        inUse: this.animationStates.inUse.size,
        available: this.animationStates.available.length,
        total: this.animationStates.inUse.size + this.animationStates.available.length,
      },
      lifetime: {
        particlesAcquired: this.stats.particlesAcquired,
        particlesReleased: this.stats.particlesReleased,
        ringsAcquired: this.stats.ringsAcquired,
        ringsReleased: this.stats.ringsReleased,
      },
    };
  }

  /**
   * Clear all pools
   */
  clear() {
    // Release all particles
    for (const particle of this.particles.inUse) {
      particle.geometry.dispose();
      particle.material.dispose();
      this.scene.remove(particle);
    }
    for (const particle of this.particles.available) {
      particle.geometry.dispose();
      particle.material.dispose();
      this.scene.remove(particle);
    }

    // Release all rings
    for (const ring of this.rings.inUse) {
      ring.geometry.dispose();
      ring.material.dispose();
      this.scene.remove(ring);
    }
    for (const ring of this.rings.available) {
      ring.geometry.dispose();
      ring.material.dispose();
      this.scene.remove(ring);
    }

    this.particles.available = [];
    this.particles.inUse.clear();
    this.rings.available = [];
    this.rings.inUse.clear();
    this.animationStates.available = [];
    this.animationStates.inUse.clear();
  }

  /**
   * Dispose system completely
   */
  dispose() {
    this.clear();

    if (this.materials.particleBase) {
      this.materials.particleBase.dispose();
    }
    if (this.materials.ringBase) {
      this.materials.ringBase.dispose();
    }
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Initialize base materials
   */
  _initializeMaterials() {
    this.materials.particleBase = new THREE.PointsMaterial({
      size: this.config.particleSize,
      transparent: true,
      sizeAttenuation: true,
      fog: false,
    });

    this.materials.ringBase = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      fog: false,
      linewidth: 2,
    });
  }

  /**
   * Create particle object
   */
  _createParticle() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));

    const material = this.materials.particleBase.clone();
    const particle = new THREE.Points(geometry, material);

    return particle;
  }

  /**
   * Create ring object
   */
  _createRing() {
    const geometry = new THREE.BufferGeometry();
    const points = [];

    for (let i = 0; i <= this.config.ringSegments; i++) {
      const angle = (i / this.config.ringSegments) * Math.PI * 2;
      points.push(Math.cos(angle), 0, Math.sin(angle));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    const material = this.materials.ringBase.clone();
    const ring = new THREE.Line(geometry, material);

    return ring;
  }

  /**
   * Create animation state object
   */
  _createAnimationState() {
    return {
      type: '',
      elapsed: 0,
      duration: 0,
      target: null,
      startValue: 0,
      endValue: 0,
      easing: 'linear',
      callback: null,
    };
  }

  /**
   * Prewarm pools for better performance
   */
  _prewarmPools() {
    // Prewarm 50% of max capacity
    const particleCount = Math.floor(this.config.maxParticles * 0.5);
    const ringCount = Math.floor(this.config.maxRings * 0.5);

    for (let i = 0; i < particleCount; i++) {
      const particle = this._createParticle();
      this.particles.available.push(particle);
    }

    for (let i = 0; i < ringCount; i++) {
      const ring = this._createRing();
      this.rings.available.push(ring);
    }

    console.log(`[EffectsPool] Prewarmed: ${particleCount} particles, ${ringCount} rings`);
  }
}
