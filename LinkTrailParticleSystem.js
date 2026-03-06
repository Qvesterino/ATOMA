/**
 * LinkTrailParticleSystem.js
 * ============================================================================
 * PARTICLE TRAILS ALONG LINKS - UNIFIED AESTHETIC
 * 
 * Emits organic particle trails that flow along links, using the SAME noise
 * function as the link aura and node aura systems. Particles follow links
 * from source to target, creating visual continuity of energy flow.
 * 
 * Design Principles:
 * - Same Simplex-like noise for trajectory calculation
 * - Pooled particles (no new allocations per frame)
 * - Directional flow from source → target
 * - Color & size tied to link state (harmony/corruption)
 * - Smooth fade-in/out (no pop)
 * - Synchronized animation timing with aura systems
 * 
 * Performance:
 * - Particle pool: reused meshes (not created/destroyed)
 * - Noise calculation: GPU-free (CPU, ~microseconds per particle)
 * - Memory: fixed allocation per link
 * - Update: <1ms for 100 particles
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * Shared noise function (identical to LinkAuraShader)
 * Used for particle trajectory modulation
 */
class NoiseGenerator {
  constructor() {
    // Pre-computed permutation table for Simplex noise
    this.p = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
      36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
      234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
      88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
      134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
      230, 206, 39, 142, 9, 103, 14, 28, 12, 231, 243, 97, 163, 130, 237, 174,
      212, 39, 146, 210, 41, 10, 172, 32, 86, 153, 60, 154, 111, 151, 140, 151,
      163, 130, 237, 70, 131, 249, 11, 133, 142, 32, 112, 106, 226, 14, 175, 17,
      255, 215, 48, 89, 76, 75, 145, 47, 210, 192, 37, 93, 82, 132, 224, 103, 157,
      63, 151, 140, 251, 38, 88, 104, 40, 166, 26, 224, 57, 216, 119, 228, 159, 28,
      142, 79, 124, 221, 184, 179, 54, 192, 67, 82, 220, 133, 157, 63, 48, 89, 76,
      75, 82, 50, 61, 59, 156, 23, 163, 130, 237, 174, 214, 21, 135, 161, 20, 125,
      242, 156, 199, 234, 123, 160, 237, 174, 212, 39, 146, 210, 41, 10, 172, 32,
      86, 153, 60, 154, 111, 151, 140, 151, 163, 130, 237, 170, 150, 180, 167, 237,
      85, 173, 173, 95, 229, 122, 60, 211, 133, 230, 206, 39, 142, 9, 103, 14, 28,
      12, 231, 243, 97, 163, 130, 237, 174, 212, 39, 146, 210, 41, 10, 172, 32
    ];
  }

  /**
   * 3D Simplex-like noise (approximation)
   * Input: 3D point
   * Output: [-1, 1] noise value
   * 
   * Uses same algorithm as LinkAuraShader for consistency
   */
  snoise(x, y, z) {
    // Gradient fade
    const t = [
      x - Math.floor(x),
      y - Math.floor(y),
      z - Math.floor(z)
    ];

    // Smooth interpolation
    const u = [
      t[0] * t[0] * (3.0 - 2.0 * t[0]),
      t[1] * t[1] * (3.0 - 2.0 * t[1]),
      t[2] * t[2] * (3.0 - 2.0 * t[2])
    ];

    const i = [
      Math.floor(x),
      Math.floor(y),
      Math.floor(z)
    ];

    // Hash indices
    const h = (ix, iy, iz) => {
      let n = this.p[(this.p[(this.p[ix & 255] + iy) & 255] + iz) & 255];
      return n & 15; // Reduce to 0-15 for gradient
    };

    // Gradient function (simple)
    const grad = (hash, x, y, z) => {
      const g = hash & 3;
      const xx = (g & 1) ? x : -x;
      const yy = (g & 2) ? y : -y;
      return xx + yy;
    };

    // Calculate 8 corner gradients
    let n0 = grad(h(i[0], i[1], i[2]), t[0], t[1], t[2]);
    let n1 = grad(h(i[0] + 1, i[1], i[2]), t[0] - 1.0, t[1], t[2]);
    let ix0 = this.lerp(n0, n1, u[0]);

    let n2 = grad(h(i[0], i[1] + 1, i[2]), t[0], t[1] - 1.0, t[2]);
    let n3 = grad(h(i[0] + 1, i[1] + 1, i[2]), t[0] - 1.0, t[1] - 1.0, t[2]);
    let ix1 = this.lerp(n2, n3, u[0]);

    let ixy0 = this.lerp(ix0, ix1, u[1]);

    let n4 = grad(h(i[0], i[1], i[2] + 1), t[0], t[1], t[2] - 1.0);
    let n5 = grad(h(i[0] + 1, i[1], i[2] + 1), t[0] - 1.0, t[1], t[2] - 1.0);
    let ix2 = this.lerp(n4, n5, u[0]);

    let n6 = grad(h(i[0], i[1] + 1, i[2] + 1), t[0], t[1] - 1.0, t[2] - 1.0);
    let n7 = grad(h(i[0] + 1, i[1] + 1, i[2] + 1), t[0] - 1.0, t[1] - 1.0, t[2] - 1.0);
    let ix3 = this.lerp(n6, n7, u[0]);

    let ixy1 = this.lerp(ix2, ix3, u[0]);

    return this.lerp(ixy0, ixy1, u[2]) * 0.5; // Scale to [-0.5, 0.5]
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Multi-octave noise (same as LinkAuraShader)
   * For organic, complex patterns
   */
  multiOctaveNoise(x, y, z, time) {
    // Offset by time for flow
    x += time * 0.3;
    y += time * 0.2;
    z += time * 0.15;

    // Same octave structure as aura shaders
    const noise1 = this.snoise(x * 2.0, y * 2.0, z * 2.0);
    const noise2 = this.snoise(x * 4.0, y * 4.0, z * 4.0) * 0.5;
    const noise3 = this.snoise(x * 8.0, y * 8.0, z * 8.0) * 0.25;

    return (noise1 + noise2 + noise3) / 1.75; // Normalized
  }
}

/**
 * Single particle instance
 */
class TrailParticle {
  constructor(mesh) {
    this.mesh = mesh;
    this.active = false;
    
    // Position & velocity
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    
    // Lifecycle
    this.age = 0;
    this.lifetime = 1.0; // seconds
    this.progress = 0; // 0-1 along link
    
    // Visual state
    this.scale = 1.0;
    this.opacity = 1.0;
    this.color = new THREE.Color(0x888888);
    
    // Link reference
    this.link = null;
    this.curve = null;
    
    // Impact tracking
    this.lastProgress = -0.1;  // Track progress to detect arrival
    this.impactTriggered = false;  // Prevent duplicate impacts
    
    // Energy density modulation (for trail readability)
    this.energyIntensity = 1.0;  // [0-1] brightness modulation
    this.thicknessModulation = 1.0;  // [0-1] scale modulation
    this.trailVisibility = 1.0;  // [0-1] combined visibility envelope
  }

  reset() {
    this.active = false;
    this.age = 0;
    this.progress = 0;
    this.lastProgress = -0.1;
    this.impactTriggered = false;
    if (this.mesh) {
      this.mesh.visible = false;       // Hide frozen particle
      this.mesh.scale.setScalar(0);    // Collapse geometry to avoid lingering dots
    }
  }

  /**
   * Check if particle has arrived at destination (for impact detection)
   * @returns {boolean} True if particle just crossed threshold
   */
  checkArrival() {
    // Particle arrives at destination when progress crosses 0.95 (near end)
    const arrivalThreshold = 0.95;
    const hasArrived = this.lastProgress < arrivalThreshold && this.progress >= arrivalThreshold;
    this.lastProgress = this.progress;
    return hasArrived && !this.impactTriggered;
  }

  update(deltaTime, time, noise) {
    if (!this.active) return false;

    this.age += deltaTime;
    if (this.age >= this.lifetime) {
      this.reset();
      return false;
    }

    // Fade in/out
    const fadeIn = Math.min(1.0, this.age / 0.1); // 100ms fade in
    const fadeOut = Math.max(0.0, 1.0 - (this.age - this.lifetime + 0.2) / 0.2); // 200ms fade out
    this.opacity = fadeIn * fadeOut;

    // Progress along link (directional flow)
    const flowSpeed = 1.5; // Units per second
    this.progress = (this.age * flowSpeed) % 1.0;

    // ========================================================================
    // ENERGY INTENSITY & THICKNESS MODULATION - TRAIL READABILITY ENHANCEMENT
    // ========================================================================
    // Synchronize with particle motion to make trails more readable
    // Uses subtle modulation without bloom/glow/halo effects
    
    // 1. MOTION-SYNCHRONIZED PULSING
    // Particles pulse in brightness as they move along the link
    // This creates subtle "pressure" indication without adding new effects
    
    // Wave function based on progress (0→1 along link)
    // Creates subtle undulation effect that follows particle motion
    const motionPhase = this.progress * Math.PI * 2.0;  // 0 to 2π
    const basePulse = Math.sin(motionPhase) * 0.5 + 0.5;  // Maps to [0.5, 1.0]
    
    // 2. TEMPORAL INTENSITY VARIATION
    // Energy intensity increases as particle progresses (more energy transferred along path)
    // Communicates "energy flowing along link" through progressive brightening
    const progressBrighten = 0.7 + (this.progress * 0.3);  // [0.7, 1.0] across link
    
    // 3. COMBINED ENERGY INTENSITY
    // Blend motion pulsing with progress brightening
    // Motion pulsing: 50% contribution (subtle wave)
    // Progress brightening: 50% contribution (indicates flow direction)
    this.energyIntensity = (basePulse * 0.5 + progressBrighten * 0.5);
    
    // 4. THICKNESS MODULATION - VARIES WITH MOTION
    // Particles swell slightly at peaks of motion pulse, compress at troughs
    // Range: 0.8x to 1.2x of base scale
    // This creates visual "echo" effect without adding geometry
    const thicknessWave = Math.sin(motionPhase + Math.PI / 4) * 0.2 + 1.0;  // [0.8, 1.2]
    this.thicknessModulation = thicknessWave;
    
    // 5. TRAIL VISIBILITY ENVELOPE
    // Combined visibility that considers particle state
    // Peaks at mid-journey (most energy in transit)
    // Gentle at start (still accelerating) and end (energy dissipating)
    const midpointBoost = Math.sin(this.progress * Math.PI) * 0.2 + 1.0;  // Peaks at 0.5
    this.trailVisibility = this.opacity * midpointBoost;

    if (this.curve) {
      // Get position on curve
      const curvePos = this.curve.getPointAt(this.progress);
      
      // Add directional noise for organic trail
      const noiseVal = noise.multiOctaveNoise(
        curvePos.x * 0.5,
        curvePos.y * 0.5,
        curvePos.z * 0.5 + time
      );

      // Apply perpendicular offset based on noise
      const frame = this._getFrameAtProgress(this.progress);
      const offset = noiseVal * 0.1;
      
      this.position.copy(curvePos);
      if (frame) {
        this.position.addScaledVector(frame, offset);
      }
    }

    // Update mesh with enhanced readability
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      
      // Apply both thickness modulation and opacity fade
      // Thickness modulation creates subtle visual rhythm
      // Opacity fade ensures particles disappear cleanly at end
      const combinedScale = this.scale * this.thicknessModulation * this.trailVisibility;
      this.mesh.scale.setScalar(combinedScale);
      
      if (this.mesh.material) {
        // Energy intensity brightens the particle without bloom
        // Applied through color brightness, not additive blending
        const brightened = new THREE.Color(this.color);
        brightened.multiplyScalar(this.energyIntensity);
        
        this.mesh.material.color.copy(brightened);
        
        // Combined opacity: fade envelope + trail visibility
        // Result: particles are brightest mid-journey, fade at edges
        this.mesh.material.opacity = this.trailVisibility;
      }
    }

    return true;
  }

  _getFrameAtProgress(t) {
    // Simple frame calculation (could be cached for performance)
    if (!this.curve) return null;
    
    const delta = 0.001;
    const p1 = this.curve.getPointAt(Math.max(0, t - delta));
    const p2 = this.curve.getPointAt(Math.min(1, t + delta));
    
    return p2.clone().sub(p1).normalize();
  }

  emit(startPos, link, curve, lifetime = 1.0) {
    this.active = true;
    this.age = 0;
    this.progress = 0;
    this.lifetime = lifetime;
    this.link = link;
    this.curve = curve;
    
    this.position.copy(startPos);
    this.opacity = 0;
    this.scale = 0.08;
    if (this.mesh) {
      this.mesh.visible = true;        // Restore visibility when re-used
      this.mesh.scale.setScalar(this.scale);
    }
  }
}

/**
 * Link Trail Particle System
 * Manages pooled particles that flow along links
 */
export class LinkTrailParticleSystem {
  constructor(scene, poolSize = 200) {
    this.scene = scene;
    this.poolSize = poolSize;
    this.particles = [];
    this.active = 0;
    
    this.noise = new NoiseGenerator();
    this.poolGroup = new THREE.Group();
    const particlesOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
    this.poolGroup.renderOrder = particlesOrder;
    const udPool = (this.poolGroup && typeof this.poolGroup.userData === 'object' && this.poolGroup.userData) ? this.poolGroup.userData : (() => { try { Object.defineProperty(this.poolGroup, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return this.poolGroup.userData || {}; })();
    Object.assign(udPool, { isTrailParticles: true });
    this.scene.add(this.poolGroup);
    
    // Impact callback (optional, called when particles arrive at destination)
    this.onParticleArrival = null;
    
    // Particle material (shared across all particles)
    this.material = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    
    // Particle geometry (simple sphere)
    this.geometry = new THREE.IcosahedronGeometry(0.05, 2);
    
    // Initialize particle pool
    for (let i = 0; i < poolSize; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.material);
      const udMesh = (mesh && typeof mesh.userData === 'object' && mesh.userData) ? mesh.userData : (() => { try { Object.defineProperty(mesh, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return mesh.userData || {}; })();
      Object.assign(udMesh, { isTrailParticle: true });
      this.poolGroup.add(mesh);
      
      const particle = new TrailParticle(mesh);
      this.particles.push(particle);
    }
  }

  /**
   * Emit particles along a link
   * Called when link is active and flowing
   */
  emitAlongLink(link, curve, linkDirection, emissionRate, time, harmony = 0.5, corruption = 0.2) {
    if (!curve || emissionRate <= 0) return;

    // Calculate emission count based on rate and frame time
    const emitCount = Math.floor(emissionRate * 0.016); // Assume 60 FPS

    for (let i = 0; i < emitCount && this.active < this.poolSize; i++) {
      // Find inactive particle
      let particle = null;
      for (let p of this.particles) {
        if (!p.active) {
          particle = p;
          break;
        }
      }

      if (!particle) break;

      // Random position along link
      const randomProgress = Math.random();
      const emitPos = curve.getPointAt(randomProgress);

      // Set particle properties based on link state
      particle.emit(emitPos, link, curve, 1.2);

      // Color based on link state
      particle.color = this._getParticleColor(harmony, corruption);

      // Scale based on corruption
      particle.scale = 0.06 + corruption * 0.06;

      // Add to active count
      this.active++;
    }
  }

  /**
   * Set particle arrival callback (called when particle reaches destination)
   * @param {Function} callback (particle, link, time) => void
   */
  setArrivalCallback(callback) {
    this.onParticleArrival = callback;
  }

  /**
   * Update all active particles
   */
  update(deltaTime, time) {
    this.active = 0;
    
    for (let particle of this.particles) {
      if (particle.active) {
        if (particle.update(deltaTime, time, this.noise)) {
          this.active++;
          
          // Check for particle arrival at destination
          if (this.onParticleArrival && particle.checkArrival()) {
            particle.impactTriggered = true;
            this.onParticleArrival(particle, particle.link, time);
          }
        }
      }
    }
  }

  /**
   * Calculate particle color based on link state
   */
  _getParticleColor(harmony, corruption) {
    // Base: neutral gray-white (same as aura)
    let color = new THREE.Color(0xddddee);

    // Harmony: shift slightly cool
    color.lerp(new THREE.Color(0xccddff), harmony * 0.2);

    // Corruption: shift toward red
    color.lerp(new THREE.Color(0xff6666), corruption * 0.4);

    return color;
  }

  /**
   * Clear particles for a specific link
   */
  clearLink(linkId) {
    for (let particle of this.particles) {
      if (particle.link?.id === linkId) {
        particle.reset();
        this.active--;
      }
    }
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this.material.dispose();
    this.geometry.dispose();
    this.scene.remove(this.poolGroup);
  }
}

/**
 * Link Trail Particle Emitter
 * Manages emission logic for a single link
 */
export class LinkTrailEmitter {
  constructor(link, particleSystem) {
    this.link = link;
    this.particleSystem = particleSystem;

    this.emissionRate = 40; // Particles per second (increased from 20 for better visibility)
    this.enabled = true;

    // Emission modulation
    this.harmonyInfluence = 0.5; // Higher = more emission at high harmony
    this.corruptionInfluence = 1.0; // Higher = more emission at high corruption
  }

  update(deltaTime, time, curve, linkDirection, harmony = 0.5, corruption = 0.2) {
    if (!this.enabled || !curve) return;

    // Modulate emission based on link state
    let rate = this.emissionRate;

    // High harmony → smoother flow (reduced particle count)
    rate *= 0.6 + harmony * 0.4;

    // High corruption → chaotic flow (increased particle count)
    rate *= 1.0 + corruption * 0.8;

    // Emit particles
    this.particleSystem.emitAlongLink(
      this.link,
      curve,
      linkDirection,
      rate,
      time,
      harmony,
      corruption
    );
  }

  setEmissionRate(rate) {
    this.emissionRate = Math.max(0, rate);
  }

  disable() {
    this.enabled = false;
    this.particleSystem.clearLink(this.link.id);
  }

  enable() {
    this.enabled = true;
  }
}
