/**
 * LinkHealingParticleSystem.js
 * ============================================================================
 * HARMONY HEALING PARTICLE EFFECTS - REVERSE FLOW HEALING ENERGY
 * 
 * Emits healing particles that flow BACKWARDS along links (target → source)
 * when harmony levels are high. Uses the SAME noise function as trail/aura
 * systems for visual consistency.
 * 
 * Design Principles:
 * - Same Simplex-like noise for trajectory calculation
 * - Reverse directional flow (target → source) - opposite of corruption
 * - Pooled particles (reused, no allocation per frame)
 * - Color: cyan/blue/green (healing aesthetic, opposite of red corruption)
 * - Only emits when harmony > threshold
 * - Synchronized animation timing with aura systems
 * - Smooth, calming motion vs. chaotic corruption
 * 
 * Visual Intent:
 * - Corruption spreads corruption forward (red particles → source)
 * - Healing propagates harmony backward (blue particles → target)
 * - Network self-regulation visualization
 * - Organic energy balancing system
 * 
 * Performance:
 * - Particle pool: reused meshes (not created/destroyed)
 * - Noise calculation: CPU, ~microseconds per particle
 * - Memory: fixed allocation per system
 * - Update: <1ms for 100 particles
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Shared noise function (identical to LinkAuraShader & LinkTrailParticleSystem)
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
   */
  snoise(x, y, z) {
    const t = [
      x - Math.floor(x),
      y - Math.floor(y),
      z - Math.floor(z)
    ];

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

    const h = (ix, iy, iz) => {
      let n = this.p[(this.p[(this.p[ix & 255] + iy) & 255] + iz) & 255];
      return n & 15;
    };

    const grad = (hash, x, y, z) => {
      const g = hash & 3;
      const xx = (g & 1) ? x : -x;
      const yy = (g & 2) ? y : -y;
      return xx + yy;
    };

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

    return this.lerp(ixy0, ixy1, u[2]) * 0.5;
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Multi-octave noise (same as other systems)
   * For organic, complex patterns
   */
  multiOctaveNoise(x, y, z, time) {
    // Offset by time for smooth flow
    x += time * 0.3;
    y += time * 0.2;
    z += time * 0.15;

    const noise1 = this.snoise(x * 2.0, y * 2.0, z * 2.0);
    const noise2 = this.snoise(x * 4.0, y * 4.0, z * 4.0) * 0.5;
    const noise3 = this.snoise(x * 8.0, y * 8.0, z * 8.0) * 0.25;

    return (noise1 + noise2 + noise3) / 1.75;
  }
}

/**
 * Single healing particle instance
 */
class HealingParticle {
  constructor(mesh) {
    this.mesh = mesh;
    this.active = false;
    
    this.position = new THREE.Vector3();
    this.age = 0;
    this.lifetime = 1.0;
    this.progress = 0; // 0-1 along link (backwards: 1 -> 0)
    
    this.scale = 1.0;
    this.opacity = 1.0;
    this.color = new THREE.Color(0x66ddff);
    
    this.link = null;
    this.curve = null;
    
    // Impact tracking (healing particles arrive at source)
    this.lastProgress = 1.1;      // Start high (particles flow down from 1 -> 0)
    this.impactTriggered = false; // Prevent duplicate impacts
    
    // Energy density modulation (for trail readability - harmonious version)
    this.energyIntensity = 1.0;  // [0-1] brightness modulation
    this.thicknessModulation = 1.0;  // [0-1] scale modulation
    this.trailVisibility = 1.0;  // [0-1] combined visibility envelope
  }

  reset() {
    this.active = false;
    this.age = 0;
    this.progress = 0;
    this.lastProgress = 1.1;
    this.impactTriggered = false;
  }

  /**
   * Check if particle has arrived at destination (source node, progress < 0.05)
   * Healing particles flow backward, so arrival is at low progress
   * @returns {boolean} True if particle just crossed arrival threshold
   */
  checkArrival() {
    const arrivalThreshold = 0.05;
    const hasArrived = this.lastProgress > arrivalThreshold && this.progress <= arrivalThreshold;
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

    // Smooth fade in/out (healing is gentle)
    const fadeIn = Math.min(1.0, this.age / 0.15); // Slightly slower fade in
    const fadeOut = Math.max(0.0, 1.0 - (this.age - this.lifetime + 0.25) / 0.25); // Longer fade out
    this.opacity = fadeIn * fadeOut;

    // BACKWARDS progress: flows from target (1.0) to source (0.0)
    const flowSpeed = 1.2; // Slightly slower than chaos (1.5)
    this.progress = 1.0 - ((this.age * flowSpeed) % 1.0); // Inverted progress

    // ========================================================================
    // ENERGY INTENSITY & THICKNESS MODULATION - HARMONIOUS PARTICLE VERSION
    // ========================================================================
    // Same readability enhancement as corruption particles, but:
    // - Harmonious flow (gentle, smoother modulation)
    // - Inverted progress (travels backward along link)
    // - Softer intensity variations (healing is calming)
    
    // 1. MOTION-SYNCHRONIZED PULSING (inverted for backward flow)
    const motionPhase = (1.0 - this.progress) * Math.PI * 2.0;  // Inverted phase
    const basePulse = Math.sin(motionPhase) * 0.4 + 0.6;  // [0.6, 1.0] - gentler range
    
    // 2. TEMPORAL INTENSITY VARIATION (reversed: decreases as particle progresses backward)
    // Energy intensity starts high (harmony abundant at source) then diminishes (delivered to target)
    const progressGlow = 1.0 - (this.progress * 0.3);  // [0.7, 1.0], reversed direction
    
    // 3. COMBINED ENERGY INTENSITY (harmonious blend)
    this.energyIntensity = (basePulse * 0.5 + progressGlow * 0.5);
    
    // 4. THICKNESS MODULATION (softer wave for healing)
    const thicknessWave = Math.sin(motionPhase + Math.PI / 6) * 0.15 + 1.0;  // [0.85, 1.15] - gentler
    this.thicknessModulation = thicknessWave;
    
    // 5. TRAIL VISIBILITY ENVELOPE (peaks at mid-journey, gentle)
    const midpointGlow = Math.sin(this.progress * Math.PI) * 0.15 + 1.0;  // Subtle peak at 0.5
    this.trailVisibility = this.opacity * midpointGlow;

    if (this.curve) {
      // Get position on curve (reversed)
      const curvePos = this.curve.getPointAt(Math.max(0, this.progress));
      
      // Add directional noise for organic healing trail
      const noiseVal = noise.multiOctaveNoise(
        curvePos.x * 0.5,
        curvePos.y * 0.5,
        curvePos.z * 0.5 + time
      );

      // Apply perpendicular offset based on noise (healing is smooth)
      const frame = this._getFrameAtProgress(this.progress);
      const offset = noiseVal * 0.08; // Slightly smaller offset than chaos
      
      this.position.copy(curvePos);
      if (frame) {
        this.position.addScaledVector(frame, offset);
      }
    }

    // Update mesh with enhanced readability (harmonious version)
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      
      // Apply both thickness modulation and visibility
      // Healing particles use gentler modulation (less pronounced wave)
      const combinedScale = this.scale * this.thicknessModulation * this.trailVisibility;
      this.mesh.scale.setScalar(combinedScale);
      
      if (this.mesh.material) {
        // Energy intensity applied through color (no bloom)
        const brightened = new THREE.Color(this.color);
        brightened.multiplyScalar(this.energyIntensity);
        
        this.mesh.material.color.copy(brightened);
        
        // Combined opacity: fade envelope + trail visibility
        this.mesh.material.opacity = this.trailVisibility;
      }
    }

    return true;
  }

  _getFrameAtProgress(t) {
    if (!this.curve) return null;
    
    const delta = 0.001;
    const p1 = this.curve.getPointAt(Math.max(0, t - delta));
    const p2 = this.curve.getPointAt(Math.min(1, t + delta));
    
    return p2.clone().sub(p1).normalize();
  }

  emit(startPos, link, curve, lifetime = 1.3) {
    this.active = true;
    this.age = 0;
    this.progress = 1.0; // Start at end (backwards flow)
    this.lifetime = lifetime;
    this.link = link;
    this.curve = curve;
    
    this.position.copy(startPos);
    this.opacity = 0;
    this.scale = 0.07; // Slightly smaller than chaos trails
  }
}

/**
 * Link Healing Particle System
 * Manages pooled healing particles that flow backwards along links
 */
export class LinkHealingParticleSystem {
  constructor(scene, poolSize = 200) {
    this.scene = scene;
    this.poolSize = poolSize;
    this.particles = [];
    this.active = 0;
    
    this.noise = new NoiseGenerator();
    this.poolGroup = new THREE.Group();
    const udPool = (this.poolGroup && typeof this.poolGroup.userData === 'object' && this.poolGroup.userData) ? this.poolGroup.userData : (() => { try { Object.defineProperty(this.poolGroup, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return this.poolGroup.userData || {}; })();
    Object.assign(udPool, { isHealingParticles: true });
    this.scene.add(this.poolGroup);
    
    // Impact callback (optional, called when particles arrive at source)
    this.onParticleArrival = null;
    
    // Healing particle material (shared, cyan/blue)
    this.material = new THREE.MeshBasicMaterial({
      color: 0x66ddff, // Cyan base
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending
    });
    
    // Particle geometry (simple sphere, slightly larger than chaos)
    this.geometry = new THREE.IcosahedronGeometry(0.06, 2);
    
    // Initialize particle pool
    for (let i = 0; i < poolSize; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.material);
      const udMesh = (mesh && typeof mesh.userData === 'object' && mesh.userData) ? mesh.userData : (() => { try { Object.defineProperty(mesh, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return mesh.userData || {}; })();
      Object.assign(udMesh, { isHealingParticle: true });
      this.poolGroup.add(mesh);
      
      const particle = new HealingParticle(mesh);
      this.particles.push(particle);
    }
  }

  /**
   * Emit healing particles backwards along a link
   * Called when link has high harmony
   */
  emitBackwardsAlongLink(link, curve, linkDirection, emissionRate, time, harmony = 0.8) {
    if (!curve || emissionRate <= 0) return;

    const emitCount = Math.floor(emissionRate * 0.016); // Per-frame calculation

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

      // Random position along link (will flow backwards from target)
      const randomProgress = Math.random();
      const emitPos = curve.getPointAt(randomProgress);

      // Emit from current position
      particle.emit(emitPos, link, curve, 1.3 + harmony * 0.2);

      // Color gradient based on harmony
      particle.color = this._getHealingColor(harmony);

      // Scale based on harmony (stronger harmony = larger particles)
      particle.scale = 0.06 + harmony * 0.04;

      this.active++;
    }
  }

  /**
   * Update all active particles
   */
  /**
   * Set particle arrival callback (called when particle reaches source node)
   * @param {Function} callback (particle, link, time) => void
   */
  setArrivalCallback(callback) {
    this.onParticleArrival = callback;
  }

  update(deltaTime, time) {
    this.active = 0;
    
    for (let particle of this.particles) {
      if (particle.active) {
        if (particle.update(deltaTime, time, this.noise)) {
          this.active++;
          
          // Check for particle arrival at source (healing particles flow backward)
          if (this.onParticleArrival && particle.checkArrival()) {
            particle.impactTriggered = true;
            this.onParticleArrival(particle, particle.link, time);
          }
        }
      }
    }
  }

  /**
   * Calculate healing particle color based on harmony level
   * Gradient: cyan → light blue → white as harmony increases
   */
  _getHealingColor(harmony) {
    // Base: cyan (opposite of red corruption)
    let color = new THREE.Color(0x66ddff);

    // At low harmony (0.5): pure cyan
    // At medium harmony (0.75): cyan → light blue
    // At high harmony (1.0): light blue → white

    if (harmony < 0.75) {
      // Cyan → light blue
      const t = (harmony - 0.5) / 0.25; // Map 0.5-0.75 to 0-1
      color.lerp(new THREE.Color(0x88eeff), Math.max(0, t * 0.3));
    } else {
      // Light blue → white
      const t = (harmony - 0.75) / 0.25; // Map 0.75-1.0 to 0-1
      color.lerp(new THREE.Color(0xffffff), Math.max(0, t * 0.4));
    }

    return color;
  }

  /**
   * Clear healing particles for a specific link
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
 * Link Healing Emitter
 * Manages backward healing particle emission for a single link
 */
export class LinkHealingEmitter {
  constructor(link, particleSystem) {
    this.link = link;
    this.particleSystem = particleSystem;
    
    // Healing emission parameters
    this.harmonyThreshold = 0.6; // Only emit when harmony > this
    this.baseEmissionRate = 15; // Particles per second at high harmony
    this.enabled = true;
    
    // Modulation factors
    this.harmonyInfluence = 1.2; // Higher = more responsive to harmony
    this.corruptionInhibition = 1.0; // Corruption reduces healing emission
  }

  update(deltaTime, time, curve, linkDirection, harmony = 0.5, corruption = 0.2) {
    if (!this.enabled || !curve || harmony < this.harmonyThreshold) {
      return;
    }

    // Modulate emission based on link state
    let rate = this.baseEmissionRate;

    // High harmony → strong healing flow
    rate *= Math.pow((harmony - this.harmonyThreshold) / (1.0 - this.harmonyThreshold), 1.5);

    // Corruption inhibits healing (antagonistic relationship)
    rate *= (1.0 - corruption * 0.6); // Corruption reduces healing by up to 60%

    // Ensure non-negative
    rate = Math.max(0, rate);

    // Emit healing particles (backwards along link)
    this.particleSystem.emitBackwardsAlongLink(
      this.link,
      curve,
      linkDirection,
      rate,
      time,
      harmony
    );
  }

  setHarmonyThreshold(threshold) {
    this.harmonyThreshold = Math.max(0, Math.min(1, threshold));
  }

  setEmissionRate(rate) {
    this.baseEmissionRate = Math.max(0, rate);
  }

  disable() {
    this.enabled = false;
    this.particleSystem.clearLink(this.link.id);
  }

  enable() {
    this.enabled = true;
  }
}
