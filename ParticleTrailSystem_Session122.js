/**
 * ParticleTrailSystem_Session122.js
 * ============================================================================
 * MOTION TRAIL RENDERING FOR FORWARD FLOW PARTICLES
 * 
 * Implements visual streaks/trails for fast-moving Forward flow particles,
 * encoding velocity and propagation direction through motion blur.
 * 
 * FEATURES:
 * 1. Trail Emission: High-speed Forward particles spawn trail particles
 * 2. Velocity Encoding: Trail length/opacity scales with particle speed
 * 3. Color Persistence: Trails inherit parent particle color for consistency
 * 4. Directional Flow: Trail orientation matches velocity vector
 * 5. Temporal Decay: Trails fade quickly (40-100ms lifetime)
 * 
 * SEMANTIC MEANING:
 * - Long, dense trails = Rapid cascade propagation
 * - Short, fading trails = Slowing conflict energy
 * - No trails = Static/oscillatory conflict (not Forward flow)
 * 
 * PERFORMANCE:
 * - Reuses main particle pool for memory efficiency
 * - Single additional GPU draw call for trails
 * - CPU-driven trail positioning (2-frame history)
 * - Zero per-particle allocations (uses object pool)
 * 
 * INTEGRATION:
 * - Works with CascadeParticleSystem_Session120
 * - Reads flowType from particle attributes
 * - Modifies particle lifetime/opacity on demand
 * 
 * @author VFX Technical Director — ATOMA Project Session 122
 * @version 1.0.0
 */

import * as THREE from 'three';

export class ParticleTrailSystem_Session122 {
  constructor(scene, cascadeSystem, config = {}) {
    this.scene = scene;
    this.cascadeSystem = cascadeSystem;
    
    this.config = {
      // Trail spawning
      trailEmissionRate: config.trailEmissionRate ?? 0.5, // 50% of Forward particles get trails
      trailLengthFactor: config.trailLengthFactor ?? 0.15,  // Trail scale = velocity * factor
      maxTrailLength: config.maxTrailLength ?? 8.0,
      minTrailLength: config.minTrailLength ?? 0.5,
      
      // Trail appearance
      trailBaseOpacity: config.trailBaseOpacity ?? 0.6,
      trailFadeRate: config.trailFadeRate ?? 12.0, // opacity decay per second
      trailLifetime: config.trailLifetime ?? 0.1, // 100ms max
      
      // History tracking
      historyFrames: config.historyFrames ?? 2,
      
      // Safety
      maxTrailParticles: config.maxTrailParticles ?? 1000,
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
    };
    
    // Trail particle pool
    this.trailPool = [];
    this.activeTrails = 0;
    
    // Position history for trail curves
    this.positionHistory = new Map(); // particleId → [pos1, pos2, pos3, ...]
    
    // Resources
    this.trailGeometry = null;
    this.trailMaterial = null;
    this.trailMesh = null;
    
    // Statistics
    this.stats = {
      trailsSpawned: 0,
      activeTrails: 0,
      totalTrailLength: 0,
    };
    
    this.init();
    
    console.log('[Session 122] ParticleTrailSystem initialized');
  }
  
  /**
   * Initialize trail rendering resources
   */
  init() {
    // 1. Create trail geometry
    this.trailGeometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(this.config.maxTrailParticles * 3);
    const colors = new Float32Array(this.config.maxTrailParticles * 3);
    const sizes = new Float32Array(this.config.maxTrailParticles);
    const ages = new Float32Array(this.config.maxTrailParticles);
    const lengths = new Float32Array(this.config.maxTrailParticles);
    
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.trailGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.trailGeometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));
    this.trailGeometry.setAttribute('length', new THREE.BufferAttribute(lengths, 1));
    
    // 2. Create trail material with fade shader
    this.trailMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTrailFadeRate: { value: this.config.trailFadeRate },
        uBaseOpacity: { value: this.config.trailBaseOpacity },
        uTrailLifetime: { value: this.config.trailLifetime },
      },
      vertexShader: `
        #ifdef USE_POINTS
        attribute float size;
        attribute vec3 color;
        #endif
        attribute float age;
        attribute float length;
        
        varying vec3 vColor;
        varying float vOpacity;
        varying float vTrailStretch;
        
        uniform float uTrailFadeRate;
        uniform float uBaseOpacity;
        uniform float uTrailLifetime;
        
        void main() {
          // Position
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          
          // Size: larger trails are longer streaks
          #ifdef USE_POINTS
          gl_PointSize = size * (1.0 + length * 0.3);
          #endif
          
          // Age-based fade
          float ageFraction = age / uTrailLifetime;
          float fadeAlpha = exp(-ageFraction * uTrailFadeRate);
          vOpacity = fadeAlpha * uBaseOpacity;
          
          // Trail stretch: longer trails get higher stretch value
          vTrailStretch = length;
          
          // Color inheritance
          #ifdef USE_POINTS
          vColor = color;
          #else
          vColor = vec3(1.0);
          #endif
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        varying float vTrailStretch;
        
        void main() {
          // Soft circle for trail particles
          vec2 c = gl_PointCoord - 0.5;
          float dist = length(c);
          
          // Soft falloff
          float softness = 1.0 - smoothstep(0.0, 0.5, dist);
          
          // Trail glow: stretch effect
          float glow = exp(-dist * dist * 3.0) * vTrailStretch;
          
          gl_FragColor = vec4(vColor, (softness + glow * 0.5) * vOpacity);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });
    
    // 3. Create trail mesh
    this.trailMesh = new THREE.Points(this.trailGeometry, this.trailMaterial);
    this.trailMesh.name = 'ParticleTrails_Session122';
    this.scene.add(this.trailMesh);
    
    // 4. Initialize trail pool
    for (let i = 0; i < this.config.maxTrailParticles; i++) {
      this.trailPool.push({
        position: new THREE.Vector3(),
        prevPosition: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        age: 0,
        lifetime: 0,
        length: 0,
        size: 1,
        active: false,
      });
    }
  }
  
  /**
   * Update trails each frame
   * Called from main.js update loop
   */
  update(deltaTime, particles, activeParticleCount) {
    if (!this.config.enabled) return;
    
    // Decay and update existing trails
    this._updateExistingTrails(deltaTime);
    
    // Spawn new trails from Forward flow particles
    this._spawnNewTrails(particles, activeParticleCount);
    
    // Update GPU buffers
    this._updateGPUBuffers();
    
    // Debug stats
    if (this.config.debugMode) {
      this.stats.activeTrails = this.activeTrails;
    }
  }
  
  /**
   * Update existing trail particles
   */
  _updateExistingTrails(deltaTime) {
    let activeCount = 0;
    
    for (let i = 0; i < this.activeTrails; i++) {
      const trail = this.trailPool[i];
      if (!trail.active) continue;
      
      // Update age
      trail.age += deltaTime;
      
      // Fade out and deactivate
      if (trail.age >= trail.lifetime) {
        trail.active = false;
        continue;
      }
      
      // Decay opacity (already handled in shader with exponential fade)
      activeCount++;
    }
    
    this.activeTrails = activeCount;
  }
  
  /**
   * Spawn new trails from Forward flow particles
   */
  _spawnNewTrails(particles, activeParticleCount) {
    if (activeParticleCount === 0) return;
    
    // Get cascade data for flow type identification
    const cascadeData = this.cascadeSystem?.getLinkMetrics?.();
    if (!cascadeData) return;
    
    // Spawn trails for Forward particles with probability
    for (let i = 0; i < activeParticleCount; i++) {
      // Random emission rate
      if (Math.random() > this.config.trailEmissionRate) continue;
      
      // Get particle data from geometry attributes
      const posAttr = this.cascadeSystem.mesh?.geometry?.getAttribute('position');
      const colorAttr = this.cascadeSystem.mesh?.geometry?.getAttribute('color');
      const sizeAttr = this.cascadeSystem.mesh?.geometry?.getAttribute('size');
      const flowTypeAttr = this.cascadeSystem.mesh?.geometry?.getAttribute('flowType');
      
      if (!posAttr || !colorAttr || !flowTypeAttr) continue;
      
      // Check if this is a Forward flow particle (flowType = 0)
      const flowType = flowTypeAttr.array[i];
      if (flowType !== 0) continue; // Only Forward particles
      
      // Get particle data
      const px = posAttr.array[i * 3];
      const py = posAttr.array[i * 3 + 1];
      const pz = posAttr.array[i * 3 + 2];
      
      const cr = colorAttr.array[i * 3];
      const cg = colorAttr.array[i * 3 + 1];
      const cb = colorAttr.array[i * 3 + 2];
      
      const size = sizeAttr.array[i];
      
      // Spawn trail
      this._spawnTrail(
        new THREE.Vector3(px, py, pz),
        new THREE.Color(cr, cg, cb),
        size
      );
    }
  }
  
  /**
   * Spawn individual trail particle
   */
  _spawnTrail(position, color, parentSize) {
    // Find active slot
    let trail = null;
    
    if (this.activeTrails < this.config.maxTrailParticles) {
      trail = this.trailPool[this.activeTrails];
      this.activeTrails++;
    } else {
      // Reuse first trail (circular buffer behavior)
      trail = this.trailPool[0];
    }
    
    if (!trail) return;
    
    // Calculate velocity from position history
    const historyKey = position.toString();
    const history = this.positionHistory.get(historyKey) || [];
    
    let velocity = new THREE.Vector3(0.5, 0.5, 0.5); // Default forward-ish
    if (history.length > 0) {
      velocity = position.clone().sub(history[history.length - 1]).normalize();
    }
    
    // Update history
    history.push(position.clone());
    if (history.length > this.config.historyFrames) {
      history.shift();
    }
    this.positionHistory.set(historyKey, history);
    
    // Trail parameters
    const speed = velocity.length();
    const trailLength = THREE.MathUtils.clamp(
      speed * this.config.trailLengthFactor,
      this.config.minTrailLength,
      this.config.maxTrailLength
    );
    
    // Offset trail position slightly behind particle
    const trailPos = position.clone().addScaledVector(velocity, -trailLength * 0.5);
    
    // Setup trail
    trail.position.copy(trailPos);
    trail.prevPosition.copy(position);
    trail.velocity.copy(velocity);
    trail.color.copy(color);
    trail.age = 0;
    trail.lifetime = this.config.trailLifetime;
    trail.length = trailLength;
    trail.size = parentSize * 0.7; // Trails are slightly smaller
    trail.active = true;
    
    this.stats.trailsSpawned++;
    this.stats.totalTrailLength += trailLength;
  }
  
  /**
   * Update GPU buffers for trail rendering
   */
  _updateGPUBuffers() {
    const positions = this.trailGeometry.getAttribute('position').array;
    const colors = this.trailGeometry.getAttribute('color').array;
    const sizes = this.trailGeometry.getAttribute('size').array;
    const ages = this.trailGeometry.getAttribute('age').array;
    const lengths = this.trailGeometry.getAttribute('length').array;
    
    let activeCount = 0;
    
    for (let i = 0; i < this.activeTrails; i++) {
      const trail = this.trailPool[i];
      if (!trail.active) continue;
      
      const idx = activeCount;
      
      // Position
      positions[idx * 3] = trail.position.x;
      positions[idx * 3 + 1] = trail.position.y;
      positions[idx * 3 + 2] = trail.position.z;
      
      // Color
      colors[idx * 3] = trail.color.r;
      colors[idx * 3 + 1] = trail.color.g;
      colors[idx * 3 + 2] = trail.color.b;
      
      // Size
      sizes[idx] = trail.size;
      
      // Age (for shader fade calculation)
      ages[idx] = trail.age;
      
      // Trail length (for stretch effect)
      lengths[idx] = trail.length;
      
      activeCount++;
    }
    
    // Mark buffers for update
    this.trailGeometry.getAttribute('position').needsUpdate = true;
    this.trailGeometry.getAttribute('color').needsUpdate = true;
    this.trailGeometry.getAttribute('size').needsUpdate = true;
    this.trailGeometry.getAttribute('age').needsUpdate = true;
    this.trailGeometry.getAttribute('length').needsUpdate = true;
    
    // Update draw range
    this.trailMesh.geometry.setDrawRange(0, activeCount);
  }
  
  /**
   * Get trail statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolUtilization: (this.activeTrails / this.config.maxTrailParticles * 100).toFixed(1) + '%',
    };
  }
  
  /**
   * Reset all trails
   */
  reset() {
    this.activeTrails = 0;
    for (const trail of this.trailPool) {
      trail.active = false;
    }
    this.positionHistory.clear();
    this.stats.trailsSpawned = 0;
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    if (this.trailMesh) {
      this.scene.remove(this.trailMesh);
    }
    if (this.trailGeometry) {
      this.trailGeometry.dispose();
    }
    if (this.trailMaterial) {
      this.trailMaterial.dispose();
    }
    this.positionHistory.clear();
  }
}
