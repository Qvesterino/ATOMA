import * as THREE from 'three';

/**
 * Node Hierarchy Visual Feedback v1.0 — Animated effects on hierarchy changes
 * 
 * Provides real-time visual feedback when:
 * - Nodes are reparented (parent-child established)
 * - Properties cascade through hierarchy
 * - Hierarchy depth changes
 * - Metrics update after aggregation
 * 
 * Effects include:
 * - Connection pulse animations
 * - Particle trails between parent/child
 * - Glow intensification
 * - Scale animations (pop/shrink)
 * - Color transitions
 * - Ring expansions
 * 
 * Performance:
 * - Effect pooling (reuse particles, rings, etc.)
 * - Throttled updates
 * - Automatic cleanup after duration
 */
export class NodeHierarchyVisualFeedback {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Active effects tracking
    this.activeEffects = [];
    this.effectsByNode = new Map(); // nodeId → [effects]

    // Configuration
    this.config = {
      // Enable/disable effect categories
      enableParticlePulses: true,
      enableConnectionPulses: true,
      enableScaleAnimations: true,
      enableGlowEffects: true,
      enableRingExpansions: true,

      // Timing
      particleLifetime: 0.8,           // seconds
      connectionPulseDuration: 0.5,    // seconds
      scaleAnimationDuration: 0.6,     // seconds
      glowFadeDuration: 0.4,           // seconds
      ringExpansionDuration: 0.8,      // seconds

      // Visual parameters
      particleColor: new THREE.Color(0x00ffff),      // Cyan
      hierarchyConnectorColor: new THREE.Color(0x88ff00), // Lime green
      cascadeColor: new THREE.Color(0xff6600),       // Orange
      harmonyColor: new THREE.Color(0x00ff88),       // Green
      glowIntensity: 1.5,
      particleSize: 0.15,
      particleCount: 8,                // Per effect
      ringSegments: 64,
      ringRadius: 1.0,
    };

    // Effect pools
    this.pools = {
      particles: { available: [], inUse: new Set(), max: 200 },
      rings: { available: [], inUse: new Set(), max: 50 },
      materials: {}
    };

    // Initialize material pool
    this._initializeMaterials();

    // Update throttling
    this.lastUpdateTime = 0;
    this.updateThrottle = 1000 / 60; // 60 FPS
  }

  /**
   * Trigger particle pulse effect when hierarchy changes
   */
  createParticlePulse(fromPosition, toPosition, color, count) {
    if (!this.config.enableParticlePulses) return;

    const direction = new THREE.Vector3().subVectors(toPosition, fromPosition).normalize();
    const distance = fromPosition.distanceTo(toPosition);

    // Create particles
    for (let i = 0; i < count; i++) {
      const particle = this._createParticle(color);
      
      // Random offset along line
      const t = Math.random();
      const startPos = new THREE.Vector3().lerpVectors(fromPosition, toPosition, t);
      
      // Random perpendicular offset
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
      perpendicular.multiplyScalar((Math.random() - 0.5) * distance * 0.3);
      
      startPos.add(perpendicular);
      particle.position.copy(startPos);

      // Velocity outward from line
      const velocity = perpendicular.clone().normalize().multiplyScalar(5 + Math.random() * 3);
      velocity.y += 2 + Math.random() * 2; // Upward bias

      const effect = {
        type: 'particle-pulse',
        particle,
        velocity,
        gravity: -5,
        lifetime: this.config.particleLifetime,
        elapsed: 0,
        startOpacity: 0.8,
      };

      this.activeEffects.push(effect);
      this.pools.particles.inUse.add(particle);
      this.scene.add(particle);
    }
  }

  /**
   * Create connection pulse (animation on established link)
   */
  createConnectionPulse(fromNode, toNode, connectionLine) {
    if (!this.config.enableConnectionPulses) return;

    const effect = {
      type: 'connection-pulse',
      connectionLine,
      originalMaterial: connectionLine?.material,
      duration: this.config.connectionPulseDuration,
      elapsed: 0,
      pulseDirection: 'outward', // 'outward' or 'inward'
      originalOpacity: connectionLine?.material?.opacity || 0.6,
    };

    this.activeEffects.push(effect);
  }

  /**
   * Create scale animation (pop effect on node)
   */
  createScaleAnimation(nodeMesh, fromScale = 1.0, toScale = 1.15) {
    if (!this.config.enableScaleAnimations) return;

    const effect = {
      type: 'scale-animation',
      nodeMesh,
      fromScale,
      toScale,
      duration: this.config.scaleAnimationDuration,
      elapsed: 0,
      originalScale: nodeMesh.scale.clone(),
      easing: 'easeOutCubic',
    };

    this.activeEffects.push(effect);
  }

  /**
   * Create glow intensification effect
   */
  createGlowEffect(nodeMesh, color, duration = null) {
    if (!this.config.enableGlowEffects) return;

    duration = duration || this.config.glowFadeDuration;

    const effect = {
      type: 'glow-effect',
      nodeMesh,
      color: color.clone(),
      duration,
      elapsed: 0,
      originalEmissive: nodeMesh.material?.emissive?.clone() || new THREE.Color(0x000000),
      targetIntensity: this.config.glowIntensity,
    };

    this.activeEffects.push(effect);
  }

  /**
   * Create expanding ring effect (cascade visualization)
   */
  createRingExpansion(position, color, maxRadius = 3.0) {
    if (!this.config.enableRingExpansions) return;

    const ring = this._createRing(color);
    ring.position.copy(position);

    const effect = {
      type: 'ring-expansion',
      ring,
      color,
      startRadius: 0.1,
      maxRadius,
      duration: this.config.ringExpansionDuration,
      elapsed: 0,
      startOpacity: 0.8,
    };

    this.activeEffects.push(effect);
    this.pools.rings.inUse.add(ring);
    this.scene.add(ring);
  }

  /**
   * Create hierarchy cascade visualization (cascading glow down tree)
   */
  createHierarchyCascade(nodePositions, color, cascadeDirection = 'down') {
    if (nodePositions.length < 2) return;

    // Stagger effects down the hierarchy
    for (let i = 0; i < nodePositions.length - 1; i++) {
      const delay = i * 0.1; // 100ms between each

      setTimeout(() => {
        const from = nodePositions[i];
        const to = nodePositions[i + 1];

        // Create connecting pulse
        this.createParticlePulse(from, to, color, 4);

        // Glow at destination
        if (i === nodePositions.length - 2) {
          // Last node gets stronger effect
          this.createRingExpansion(to, color, 2.5);
        }
      }, delay * 1000);
    }
  }

  /**
   * Create property inheritance visualization
   */
  createPropertyInheritanceEffect(parentPos, childPos, property) {
    // Color based on property
    let color;
    switch (property) {
      case 'corruption':
        color = new THREE.Color(0xff3333); // Red
        break;
      case 'harmony':
        color = new THREE.Color(0x00ff88); // Green
        break;
      case 'stress':
        color = new THREE.Color(0xff6600); // Orange
        break;
      case 'stability':
        color = new THREE.Color(0x6666ff); // Blue
        break;
      default:
        color = new THREE.Color(0x00ffff); // Cyan
    }

    // Create particle trail from parent to child
    this.createParticlePulse(parentPos, childPos, color, 6);
  }

  /**
   * Update all active effects (called each frame)
   */
  update(deltaTime) {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateThrottle) {
      return;
    }
    this.lastUpdateTime = now;

    const dt = Math.min(deltaTime, 0.05); // Cap delta time

    // Update effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.elapsed += dt;

      let isComplete = false;

      switch (effect.type) {
        case 'particle-pulse':
          isComplete = this._updateParticlePulse(effect, dt);
          break;
        case 'connection-pulse':
          isComplete = this._updateConnectionPulse(effect, dt);
          break;
        case 'scale-animation':
          isComplete = this._updateScaleAnimation(effect, dt);
          break;
        case 'glow-effect':
          isComplete = this._updateGlowEffect(effect, dt);
          break;
        case 'ring-expansion':
          isComplete = this._updateRingExpansion(effect, dt);
          break;
      }

      if (isComplete) {
        this._cleanupEffect(effect);
        this.activeEffects.splice(i, 1);
      }
    }
  }

  /**
   * Dispose system
   */
  dispose() {
    // Clean up active effects
    for (const effect of this.activeEffects) {
      this._cleanupEffect(effect);
    }
    this.activeEffects = [];

    // Clean up pools
    for (const particle of this.pools.particles.available) {
      particle.geometry.dispose();
      particle.material.dispose();
      this.scene.remove(particle);
    }
    for (const ring of this.pools.rings.available) {
      ring.geometry.dispose();
      ring.material.dispose();
      this.scene.remove(ring);
    }

    this.pools.particles.available = [];
    this.pools.rings.available = [];
    this.effectsByNode.clear();
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Initialize material pool
   */
  _initializeMaterials() {
    this.pools.materials.particle = new THREE.PointsMaterial({
      size: this.config.particleSize,
      transparent: true,
      sizeAttenuation: true,
      fog: false,
    });

    this.pools.materials.ring = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      fog: false,
      linewidth: 2,
    });
  }

  /**
   * Create or get particle from pool
   */
  _createParticle(color) {
    let particle;

    if (this.pools.particles.available.length > 0) {
      particle = this.pools.particles.available.pop();
    } else {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));

      const material = this.pools.materials.particle.clone();
      material.color.copy(color);

      particle = new THREE.Points(geometry, material);
    }

    particle.visible = true;
    particle.material.color.copy(color);
    particle.material.opacity = 1.0;

    return particle;
  }

  /**
   * Create ring for expansion effect
   */
  _createRing(color) {
    let ring;

    if (this.pools.rings.available.length > 0) {
      ring = this.pools.rings.available.pop();
    } else {
      const geometry = new THREE.BufferGeometry();
      const points = [];

      for (let i = 0; i <= this.config.ringSegments; i++) {
        const angle = (i / this.config.ringSegments) * Math.PI * 2;
        points.push(
          Math.cos(angle) * this.config.ringRadius,
          0,
          Math.sin(angle) * this.config.ringRadius
        );
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

      const material = this.pools.materials.ring.clone();
      ring = new THREE.Line(geometry, material);
    }

    ring.visible = true;
    ring.material.color.copy(color);
    ring.material.opacity = 1.0;

    return ring;
  }

  /**
   * Update particle pulse effect
   */
  _updateParticlePulse(effect, dt) {
    const progress = effect.elapsed / effect.lifetime;

    if (progress >= 1.0) {
      effect.particle.visible = false;
      return true;
    }

    // Move particle
    effect.particle.position.add(effect.velocity.clone().multiplyScalar(dt));

    // Apply gravity
    effect.velocity.y += effect.gravity * dt;

    // Fade out
    const opacity = effect.startOpacity * (1.0 - progress);
    effect.particle.material.opacity = opacity;

    return false;
  }

  /**
   * Update connection pulse
   */
  _updateConnectionPulse(effect, dt) {
    const progress = effect.elapsed / effect.duration;

    if (progress >= 1.0) {
      if (effect.originalMaterial) {
        effect.originalMaterial.opacity = effect.originalOpacity;
      }
      return true;
    }

    // Pulse animation: bright → dim → bright
    const pulse = Math.sin(progress * Math.PI);
    const opacity = effect.originalOpacity + pulse * 0.3;

    if (effect.connectionLine?.material) {
      effect.connectionLine.material.opacity = opacity;
    }

    return false;
  }

  /**
   * Update scale animation
   */
  _updateScaleAnimation(effect, dt) {
    const progress = effect.elapsed / effect.duration;

    if (progress >= 1.0) {
      effect.nodeMesh.scale.copy(effect.originalScale);
      return true;
    }

    // Easing
    const eased = this._easeOutCubic(progress);

    // Interpolate scale
    const scale = THREE.MathUtils.lerp(effect.fromScale, effect.toScale, eased);
    effect.nodeMesh.scale.multiplyScalar(scale / effect.originalScale.length());

    return false;
  }

  /**
   * Update glow effect
   */
  _updateGlowEffect(effect, dt) {
    const progress = effect.elapsed / effect.duration;

    if (progress >= 1.0) {
      if (effect.nodeMesh.material?.emissive) {
        effect.nodeMesh.material.emissive.copy(effect.originalEmissive);
      }
      return true;
    }

    // Fade: full glow → original
    const glowAmount = effect.targetIntensity * (1.0 - progress);
    const r = effect.color.r * glowAmount;
    const g = effect.color.g * glowAmount;
    const b = effect.color.b * glowAmount;

    if (effect.nodeMesh.material?.emissive) {
      effect.nodeMesh.material.emissive.setRGB(r, g, b);
    }

    return false;
  }

  /**
   * Update ring expansion
   */
  _updateRingExpansion(effect, dt) {
    const progress = effect.elapsed / effect.duration;

    if (progress >= 1.0) {
      effect.ring.visible = false;
      return true;
    }

    // Expand ring
    const radius = effect.startRadius + (effect.maxRadius - effect.startRadius) * progress;
    this._updateRingRadius(effect.ring, radius);

    // Fade out
    const opacity = effect.startOpacity * (1.0 - progress);
    effect.ring.material.opacity = opacity;

    return false;
  }

  /**
   * Update ring radius (regenerate geometry)
   */
  _updateRingRadius(ring, radius) {
    const points = [];
    for (let i = 0; i <= this.config.ringSegments; i++) {
      const angle = (i / this.config.ringSegments) * Math.PI * 2;
      points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }

    ring.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    ring.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Cleanup effect resources
   */
  _cleanupEffect(effect) {
    switch (effect.type) {
      case 'particle-pulse':
        if (this.pools.particles.available.length < this.pools.particles.max) {
          effect.particle.visible = false;
          this.pools.particles.available.push(effect.particle);
        } else {
          effect.particle.geometry.dispose();
          effect.particle.material.dispose();
          this.scene.remove(effect.particle);
        }
        this.pools.particles.inUse.delete(effect.particle);
        break;

      case 'ring-expansion':
        if (this.pools.rings.available.length < this.pools.rings.max) {
          effect.ring.visible = false;
          this.pools.rings.available.push(effect.ring);
        } else {
          effect.ring.geometry.dispose();
          effect.ring.material.dispose();
          this.scene.remove(effect.ring);
        }
        this.pools.rings.inUse.delete(effect.ring);
        break;
    }
  }

  /**
   * Easing function (ease out cubic)
   */
  _easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
}
