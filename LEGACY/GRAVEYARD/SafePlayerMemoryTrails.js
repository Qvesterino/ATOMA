import * as THREE from 'three';

/**
 * SAFE PLAYER MEMORY TRAILS
 * 
 * Creates subtle neon tail following player movement.
 * Fast movement = longer/brighter trail.
 * Jumping/dashing = pulse effects.
 * 
 * SAFETY RULES:
 * - ZERO modifications to Player/Controller
 * - ZERO modifications to physics or input
 * - All trails are independent VFX objects
 * - All state stored in MemoryTrailRegistry
 * - Non-invasive and completely reversible
 */

export class SafePlayerMemoryTrails {
  constructor(scene, worldRoot, camera, memoryTrailRegistry) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.registry = memoryTrailRegistry;
    const attachRoot = worldRoot || scene;
    
    // VFX container
    this.trailContainer = new THREE.Group();
    this.trailContainer.name = 'PlayerMemoryTrailContainer';
    attachRoot.add(this.trailContainer);
    this.root = this.trailContainer;
    
    // Trail line renderer
    this.trailLine = null;
    
    // Particle system
    this.particles = [];
    this.maxParticles = 200;
    
    // Movement tracking
    this.lastPlayerPos = new THREE.Vector3();
    this.currentSpeed = 0;
    this.lastSegmentDistance = 0;
    
    // Configuration
    this.config = {
      segmentDistance: 0.15,  // Distance between trail points
      maxSegments: 50,
      baseOpacity: 0.4,
      speedMultiplier: 0.02,  // Speed affects brightness
      dualColorMode: false,   // Dual color for legendary events
    };
  }
  
  /**
   * Update player trail with current position and velocity
   */
  updatePlayerTrail(playerPos, movementSpeed = 0) {
    if (!this.lastPlayerPos) {
      this.lastPlayerPos = playerPos.clone();
      return;
    }
    
    const distance = playerPos.distanceTo(this.lastPlayerPos);
    this.currentSpeed = movementSpeed;
    this.lastSegmentDistance += distance;
    
    // Add segment if distance threshold reached
    if (this.lastSegmentDistance >= this.config.segmentDistance) {
      this.registry.addPlayerTrailPosition(playerPos, movementSpeed);
      this.lastSegmentDistance = 0;
      
      // Create particles at segment point
      if (movementSpeed > 5) {
        this.createTrailParticles(playerPos, movementSpeed);
      }
    }
    
    this.lastPlayerPos = playerPos.clone();
  }
  
  /**
   * Create jump pulse effect
   */
  createJumpPulse(playerPos) {
    // Expanding rings
    const pulseCount = 6;
    for (let i = 0; i < pulseCount; i++) {
      this.particles.push({
        position: playerPos.clone(),
        startPosition: playerPos.clone(),
        baseVelocity: new THREE.Vector3(0, 0, 0),
        age: 0,
        maxAge: 0.6,
        radius: 0,
        maxRadius: 0.8 + (i * 0.3),
        opacity: 1.0 - (i * 0.15),
        color: { r: 0.0, g: 1.0, b: 1.0 },
        type: 'ring'
      });
    }
  }
  
  /**
   * Create dash pulse effect
   */
  createDashPulse(playerPos, dashDirection) {
    // Forward cone of particles
    const coneCount = 12;
    for (let i = 0; i < coneCount; i++) {
      const angle = (i / coneCount) * Math.PI * 2;
      const coneAngle = Math.PI * 0.15; // 15 degree cone
      
      const velocity = dashDirection.clone().multiplyScalar(15);
      velocity.addScaledVector(
        new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)),
        5
      );
      
      this.particles.push({
        position: playerPos.clone(),
        startPosition: playerPos.clone(),
        baseVelocity: velocity.clone(),
        age: 0,
        maxAge: 0.5,
        size: 0.12,
        initialSize: 0.12,
        opacity: 0.8,
        color: { r: 0.0, g: 1.0, b: 1.0 },
        type: 'dash'
      });
    }
  }
  
  /**
   * Create blink teleport effect
   */
  createBlinkEffect(startPos, endPos) {
    // Teleport trace from start to end
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t);
      
      this.particles.push({
        position: pos.clone(),
        startPosition: pos.clone(),
        baseVelocity: new THREE.Vector3(0, 0, 0),
        age: 0,
        maxAge: 0.4,
        size: 0.15 * (1 - t),
        initialSize: 0.15 * (1 - t),
        opacity: 1 - t,
        color: { r: 0.5, g: 0.0, b: 1.0 }, // Magenta for blink
        type: 'blink'
      });
    }
  }
  
  /**
   * Create trail particles during movement
   */
  createTrailParticles(position, speed) {
    const particleCount = Math.floor(2 + speed * 0.1);
    
    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length >= this.maxParticles) break;
      
      // Deterministic fan perpendicular to camera
      const angle = (i / Math.max(1, particleCount)) * Math.PI * 2;
      const elevation = 0;
      
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed * 0.3,
        elevation * speed,
        Math.sin(angle) * speed * 0.3
      );
      
      this.particles.push({
        position: position.clone(),
        startPosition: position.clone(),
        baseVelocity: velocity.clone(),
        age: 0,
        maxAge: 0.4,
        size: 0.12,
        initialSize: 0.12,
        opacity: speed * this.config.speedMultiplier,
        color: { r: 0.0, g: 1.0, b: 1.0 },
        type: 'trail'
      });
    }
  }
  
  /**
   * Update all player trails
   */
  update(deltaTime, eventData = null) {
    // Update particles
    this.updateParticles(deltaTime);
    
    // Build trail mesh
    this.buildTrailMesh(eventData);
  }
  
  /**
   * Build trail mesh from registry positions
   */
  buildTrailMesh(eventData) {
    // Remove old trail
    if (this.trailLine) {
      this.trailContainer.remove(this.trailLine);
      this.trailLine.geometry.dispose();
      this.trailLine.material.dispose();
      this.trailLine = null;
    }
    
    const positions = this.registry.playerTrail.positions;
    if (positions.length < 2) return;
    
    // Build trail geometry
    const geometry = new THREE.BufferGeometry();
    const verts = [];
    const colors = [];
    
    const baseColor = { r: 0.0, g: 1.0, b: 1.0 };
    const eventActive = eventData && eventData.isActive;
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const fadeOut = 1 - (pos.age / pos.maxAge);
      
      // Speed-based brightness
      const speedBrightness = Math.min(1, pos.speed * this.config.speedMultiplier);
      const intensity = fadeOut * (0.3 + speedBrightness * 0.7);
      
      verts.push(pos.position.x, pos.position.y, pos.position.z);
      
      if (eventActive) {
        // Multi-layer colors during events
        const layerColor = i % 2 === 0 ? baseColor : { r: 0.5, g: 0.0, b: 1.0 };
        colors.push(layerColor.r, layerColor.g, layerColor.b, intensity);
      } else {
        colors.push(baseColor.r, baseColor.g, baseColor.b, intensity);
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4));
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      fog: false,
      linewidth: 2,
      depthWrite: false
    });
    
    this.trailLine = new THREE.Line(geometry, material);
    this.trailContainer.add(this.trailLine);
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
        // Update position from base instead of incremental adds
        const dispX = (particle.baseVelocity?.x || 0) * particle.age;
        const dispY = (particle.baseVelocity?.y || 0) * particle.age;
        const dispZ = (particle.baseVelocity?.z || 0) * particle.age;
        const base = particle.startPosition || new THREE.Vector3();
        particle.position.set(base.x + dispX, base.y + dispY, base.z + dispZ);
        
        // Apply physics
        if (particle.type === 'ring') {
          // Expand rings outward
          const progress = particle.age / particle.maxAge;
          particle.radius = particle.maxRadius * progress;
          particle.opacity = (1 - progress) * particle.initialOpacity;
        } else if (particle.type === 'dash') {
          // Fast decay (opacity only; velocity remains constant)
          particle.opacity = (1 - particle.age / particle.maxAge) * 0.8;
        } else if (particle.type === 'blink') {
          // Slow fade
          particle.opacity = (1 - particle.age / particle.maxAge);
        } else {
          // Normal trail particles (opacity decay only)
          particle.opacity = (1 - particle.age / particle.maxAge) * particle.initialOpacity;
        }
      }
    }
  }
  
  /**
   * React to world events
   */
  reactToWorldEvent(eventType, intensity = 1.0) {
    // Intensify trail during events
    this.config.baseOpacity = Math.min(0.8, 0.4 + intensity * 0.3);
    
    if (eventType === 'QUANTUM_STORM') {
      this.config.dualColorMode = true;
    } else {
      this.config.dualColorMode = false;
    }
  }
  
  /**
   * Get current stats
   */
  getStats() {
    return {
      playerTrailSegments: this.registry.playerTrail.positions.length,
      trailParticles: this.particles.length,
      currentSpeed: this.currentSpeed
    };
  }
  
  /**
   * Clear player trail
   */
  clearTrail() {
    this.registry.playerTrail.positions = [];
    this.particles = [];
    
    if (this.trailLine) {
      this.trailContainer.remove(this.trailLine);
      this.trailLine.geometry.dispose();
      this.trailLine.material.dispose();
      this.trailLine = null;
    }
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.clearTrail();
    this.clearParticles();
    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this.root?.clear?.();
  }
}
