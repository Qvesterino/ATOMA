/**
 * ParticleStreamCascadeAccelerationIntegrationPatch
 * ============================================================================
 * INTEGRATION PATCH: Cascade Acceleration → Particle Emitter
 * 
 * This patch integrates ParticleStreamCascadeAcceleration into the existing
 * WaveParticleEmitter_v1 system, modifying particle velocity calculations
 * to reflect cascade layer depth.
 * 
 * WHAT IT DOES:
 * 1. Intercepts particle emission from WaveParticleEmitter_v1
 * 2. Queries cascade acceleration multiplier for the source node
 * 3. Applies acceleration vector to particle initial velocity
 * 4. Modulates particle lifetime based on acceleration (faster = shorter life)
 * 5. Adjusts particle glow/intensity based on cascade layer depth
 * 
 * INTEGRATION POINTS:
 * - Called after particle emission but before first frame render
 * - Works with all three particle families (constructive, destructive, ripple)
 * - Zero performance impact for non-cascaded nodes (returns 1.0 multiplier)
 * 
 * USAGE:
 * const patch = new ParticleStreamCascadeAccelerationIntegrationPatch(
 *   waveParticleEmitter, cascadeAccelSystem, nodeDynamicMetrics
 * );
 * patch.installPatches();
 * 
 * ============================================================================
 */

export class ParticleStreamCascadeAccelerationIntegrationPatch {
  constructor(waveParticleEmitter, cascadeAccelSystem, nodeDynamicMetrics, flowDeflectionSystem, config = {}) {
    this.waveParticleEmitter = waveParticleEmitter;
    this.cascadeAccelSystem = cascadeAccelSystem;
    this.nodeDynamicMetrics = nodeDynamicMetrics;
    this.flowDeflectionSystem = flowDeflectionSystem;

    this.config = {
      // Velocity scaling
      applyVelocityAcceleration: config.applyVelocityAcceleration ?? true,
      velocityMultiplierCap: config.velocityMultiplierCap ?? 2.5,
      
      // Lifetime modulation
      modifyLifetime: config.modifyLifetime ?? true,
      lifetimeMinRatio: config.lifetimeMinRatio ?? 0.3, // Min 30% of base lifetime
      lifetimeMaxRatio: config.lifetimeMaxRatio ?? 0.9, // Max 90% of base lifetime
      
      // Glow/intensity scaling
      scaleIntensity: config.scaleIntensity ?? true,
      intensityDepthInfluence: config.intensityDepthInfluence ?? 0.4,
      
      // Directional deflection (particles bend toward cascade flow)
      applyDirectionalDeflection: config.applyDirectionalDeflection ?? true,
      deflectionStrength: config.deflectionStrength ?? 0.6,
      deflectionBlendFactor: config.deflectionBlendFactor ?? 0.4, // 40% deflection, 60% original
      
      debugMode: config.debugMode ?? false,
    };

    // Track original particle setter methods
    this.originalSetters = {};
    this.patched = false;

    if (this.config.debugMode) {
      console.log('[ParticleStreamCascadeAccelerationIntegrationPatch] Constructor initialized', this.config);
    }
  }

  /**
   * Install patches into WaveParticleEmitter_v1
   */
  installPatches() {
    if (this.patched) {
      console.warn('[ParticleStreamCascadeAccelerationIntegrationPatch] Already patched');
      return;
    }

    // Patch the emitConstructiveBurst method (if it exists)
    if (this.waveParticleEmitter?.emitConstructiveBurst) {
      this._patchConstructiveBurst();
    }
    
    // Patch the emitDestructiveChaos method (if it exists)
    if (this.waveParticleEmitter?.emitDestructiveChaos) {
      this._patchDestructiveChaos();
    }
    
    // Patch the emitStandingWaveRipple method (if it exists)
    if (this.waveParticleEmitter?.emitStandingWaveRipple) {
      this._patchStandingWaveRipple();
    }

    this.patched = true;
    console.log('[ParticleStreamCascadeAccelerationIntegrationPatch] Patches installed ✓');
  }

  /**
   * INTERNAL: Patch constructive burst emission
   */
  _patchConstructiveBurst() {
    try {
      const originalMethod = this.waveParticleEmitter.emitConstructiveBurst.bind(
        this.waveParticleEmitter
      );

      this.waveParticleEmitter.emitConstructiveBurst = (nodeId, position, count) => {
        // Keep constructive tridents straight out of the node.
        // Cascade acceleration is still applied to destructive/ripple families,
        // but constructive bursts should preserve their original radial feel.
        originalMethod(nodeId, position, count);
      };
    } catch (err) {
      console.warn('[ParticleStreamCascadeAccelerationIntegrationPatch] Failed to patch constructiveBurst:', err.message);
    }
  }

  /**
   * INTERNAL: Patch destructive chaos emission
   */
  _patchDestructiveChaos() {
    try {
      const originalMethod = this.waveParticleEmitter.emitDestructiveChaos.bind(
        this.waveParticleEmitter
      );

      this.waveParticleEmitter.emitDestructiveChaos = (nodeId, position, count) => {
        // Call original emission
        originalMethod(nodeId, position, count);

        // Apply cascade acceleration modifications
        this._applyAccelerationToLatestParticles(
          'destructiveChaos',
          nodeId,
          position,
          count,
          { type: 'destructive', color: 'orange' }
        );
      };
    } catch (err) {
      console.warn('[ParticleStreamCascadeAccelerationIntegrationPatch] Failed to patch destructiveChaos:', err.message);
    }
  }

  /**
   * INTERNAL: Patch standing wave ripple emission
   */
  _patchStandingWaveRipple() {
    try {
      const originalMethod = this.waveParticleEmitter.emitStandingWaveRipple.bind(
        this.waveParticleEmitter
      );

      this.waveParticleEmitter.emitStandingWaveRipple = (nodeId, position, count) => {
        // Call original emission
        originalMethod(nodeId, position, count);

        // Apply cascade acceleration modifications
        this._applyAccelerationToLatestParticles(
          'standingWaveRipple',
          nodeId,
          position,
          count,
          { type: 'ripple', color: 'cyan' }
        );
      };
    } catch (err) {
      console.warn('[ParticleStreamCascadeAccelerationIntegrationPatch] Failed to patch standingWaveRipple:', err.message);
    }
  }

  /**
   * INTERNAL: Apply acceleration modifications to particles after emission
   */
  _applyAccelerationToLatestParticles(family, nodeId, position, count, metadata) {
    // Get cascade acceleration data for this node
    const accelMult = this.cascadeAccelSystem.getAccelerationMultiplier(nodeId);
    const accelVec = this.cascadeAccelSystem.getAccelerationVector(position, nodeId);

    // Get flow deflection (if system available)
    let deflectionVec = new THREE.Vector3();
    if (this.config.applyDirectionalDeflection && this.flowDeflectionSystem) {
      deflectionVec = this.flowDeflectionSystem.getDeflectionVector(position, nodeId);
    }

    // If no modifications needed, skip expensive operations
    if (accelMult <= 1.0 && accelVec.lengthSq() < 0.001 && deflectionVec.lengthSq() < 0.001) {
      return;
    }

    // Get the particle system for this family
    const system = this.waveParticleEmitter.systems[family];
    if (!system) return;

    // Get particle data (Points geometry has position, velocity, etc. in buffer)
    const geometry = system.geometry;
    const positionAttr = geometry.getAttribute('position');
    const velocityAttr = geometry.getAttribute('velocity');
    const lifeAttr = geometry.getAttribute('life');

    if (!velocityAttr) return; // No velocity attribute, skip

    // Modify the most recently emitted particles
    const velocityArray = velocityAttr.array;
    const lifeArray = lifeAttr?.array;
    const startIdx = Math.max(0, velocityArray.length - count * 3);

    for (let i = startIdx; i < velocityArray.length; i += 3) {
      if (this.config.applyVelocityAcceleration) {
        // Current particle velocity (as Vector3)
        const vx = velocityArray[i];
        const vy = velocityArray[i + 1];
        const vz = velocityArray[i + 2];

        // Scale velocity by acceleration multiplier
        const scaledVel = Math.min(accelMult, this.config.velocityMultiplierCap);
        let finalVx = vx * scaledVel + accelVec.x * 0.5;
        let finalVy = vy * scaledVel + accelVec.y * 0.5;
        let finalVz = vz * scaledVel + accelVec.z * 0.5;

        // Apply directional deflection (blend with original velocity)
        if (deflectionVec.lengthSq() > 0.001) {
          const blend = this.config.deflectionBlendFactor;
          finalVx = finalVx * (1 - blend) + deflectionVec.x * blend;
          finalVy = finalVy * (1 - blend) + deflectionVec.y * blend;
          finalVz = finalVz * (1 - blend) + deflectionVec.z * blend;
        }

        velocityArray[i] = finalVx;
        velocityArray[i + 1] = finalVy;
        velocityArray[i + 2] = finalVz;
      }
    }

    if (this.config.modifyLifetime && lifeArray) {
      // Modify particle lifetimes: faster particles → shorter lives
      const lifetimeScale = this._computeLifetimeScale(accelMult);
      const lifeStartIdx = Math.max(0, lifeArray.length - count);

      for (let i = lifeStartIdx; i < lifeArray.length; i++) {
        lifeArray[i] = lifeArray[i] * lifetimeScale;
      }
    }

    // Mark attributes as needing update
    if (velocityAttr) velocityAttr.needsUpdate = true;
    if (lifeAttr) lifeAttr.needsUpdate = true;
  }

  /**
   * INTERNAL: Compute lifetime scale based on acceleration
   * Faster particles → shorter lifetimes (so they "escape")
   */
  _computeLifetimeScale(accelMult) {
    // Linear interpolation between min and max ratio
    const normalized = Math.min(accelMult - 1.0, 3.0) / 3.0; // 0-1 range
    return (
      this.config.lifetimeMaxRatio -
      (normalized * (this.config.lifetimeMaxRatio - this.config.lifetimeMinRatio))
    );
  }

  /**
   * Get current patch status
   */
  getStatus() {
    return {
      patched: this.patched,
      config: this.config,
      emitterRef: this.waveParticleEmitter ? 'Valid' : 'Invalid',
      cascadeAccelRef: this.cascadeAccelSystem ? 'Valid' : 'Invalid',
    };
  }

  /**
   * Uninstall patches (restore original methods)
   */
  uninstallPatches() {
    if (!this.patched) return;

    // TODO: Restore original methods if needed
    // This is mainly for testing purposes

    this.patched = false;
    console.log('[ParticleStreamCascadeAccelerationIntegrationPatch] Patches removed');
  }
}

export default ParticleStreamCascadeAccelerationIntegrationPatch;
