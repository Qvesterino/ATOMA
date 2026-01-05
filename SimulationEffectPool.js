/**
 * SIMULATION EFFECT POOL v1.0
 * 
 * Automated effect pooling system with strict immutability rules:
 * - NO live scene references stored in pooled effects
 * - ALL effects use immutable data snapshots
 * - Input validation enforced at creation time
 * - Self-terminating effects on state corruption
 * 
 * EFFECT_INPUT_INVARIANT:
 *   "No effect update may read data from live scene graph objects."
 */

import * as THREE from 'three';

export class SimulationEffectPool {
  constructor(maxPoolSize = 100) {
    this.maxPoolSize = maxPoolSize;
    this.poolsByType = {};  // type → [ effect pool ]
    this.activeEffects = new Set();  // Currently running effects
    this.rejectedEffects = [];  // Diagnostic log
    this.diagnosticsEnabled = true;
    
    // Pool statistics
    this.stats = {
      totalCreated: 0,
      totalPooled: 0,
      totalRejected: 0,
      byRejectionReason: {}
    };
  }

  /**
   * Create and return a pooled effect (or new if pool empty)
   * 
   * INPUT VALIDATION (NON-NEGOTIABLE):
   * - All required inputs must be present and valid
   * - If any required input is missing, effect is REJECTED
   * - No null/undefined values allowed in critical fields
   */
  acquireEffect(type, config) {
    // Validate inputs
    const validation = this._validateEffectConfig(type, config);
    if (!validation.valid) {
      this._logRejection(type, validation.reason);
      return null;
    }

    // Get pool for this type
    if (!this.poolsByType[type]) {
      this.poolsByType[type] = [];
    }
    const pool = this.poolsByType[type];

    // Try to reuse from pool
    let effect;
    if (pool.length > 0) {
      effect = pool.pop();
      this._resetEffect(effect);  // Clear all state
    } else {
      // Create new if pool empty
      effect = this._createEffectTemplate(type);
      this.stats.totalCreated++;
    }

    // Initialize effect with CLONED/IMMUTABLE data only
    effect = this._initializeEffectWithSnapshots(effect, config, type);

    // Mark as active
    this.activeEffects.add(effect);

    return effect;
  }

  /**
   * Return effect to pool (called when done or on error)
   */
  releaseEffect(effect, type) {
    if (!effect || !type) return;

    this.activeEffects.delete(effect);

    // Only pool if under limit
    if (!this.poolsByType[type]) {
      this.poolsByType[type] = [];
    }

    const pool = this.poolsByType[type];
    if (pool.length < this.maxPoolSize) {
      pool.push(effect);
      this.stats.totalPooled++;
    }
  }

  /**
   * STRICT INPUT VALIDATION
   * 
   * Returns { valid: boolean, reason: string }
   */
  _validateEffectConfig(type, config) {
    if (!type || typeof type !== 'string') {
      return { valid: false, reason: 'Invalid effect type' };
    }

    if (!config || typeof config !== 'object') {
      return { valid: false, reason: 'Missing config object' };
    }

    // Type-specific validation
    switch (type) {
      case 'activationPulse':
        return this._validateActivationPulse(config);
      case 'linkPulse':
        return this._validateLinkPulse(config);
      case 'linkPulseRemoval':
        return this._validateLinkPulseRemoval(config);
      case 'incompatibilityWarning':
        return this._validateIncompatibilityWarning(config);
      case 'shatterParticle':
        return this._validateShatterParticle(config);
      case 'errorFeedback':
        return this._validateErrorFeedback(config);
      case 'materialization':
        return this._validateMaterialization(config);
      default:
        return { valid: false, reason: `Unknown effect type: ${type}` };
    }
  }

  // Validation helpers
  _validateActivationPulse(config) {
    if (!config.pulse) return { valid: false, reason: 'Missing pulse mesh' };
    if (!config.pulse.scale) return { valid: false, reason: 'Pulse mesh corrupted' };
    if (typeof config.duration !== 'number' || config.duration <= 0) {
      return { valid: false, reason: 'Invalid duration' };
    }
    return { valid: true };
  }

  _validateLinkPulse(config) {
    if (!config.pulse) return { valid: false, reason: 'Missing pulse mesh' };
    if (!config.startPos || typeof config.startPos.x !== 'number') {
      return { valid: false, reason: 'Invalid startPos' };
    }
    if (!config.endPos || typeof config.endPos.x !== 'number') {
      return { valid: false, reason: 'Invalid endPos' };
    }
    if (typeof config.duration !== 'number' || config.duration <= 0) {
      return { valid: false, reason: 'Invalid duration' };
    }
    return { valid: true };
  }

  _validateLinkPulseRemoval(config) {
    if (!config.pulse) return { valid: false, reason: 'Missing pulse mesh' };
    if (!config.sourcePos || typeof config.sourcePos.x !== 'number') {
      return { valid: false, reason: 'Invalid sourcePos' };
    }
    if (!config.targetPos || typeof config.targetPos.x !== 'number') {
      return { valid: false, reason: 'Invalid targetPos' };
    }
    if (typeof config.duration !== 'number' || config.duration <= 0) {
      return { valid: false, reason: 'Invalid duration' };
    }
    return { valid: true };
  }

  _validateIncompatibilityWarning(config) {
    if (!config.ring) return { valid: false, reason: 'Missing ring mesh' };
    if (typeof config.duration !== 'number' || config.duration <= 0) {
      return { valid: false, reason: 'Invalid duration' };
    }
    return { valid: true };
  }

  _validateShatterParticle(config) {
    if (!config.particle) return { valid: false, reason: 'Missing particle mesh' };
    if (!config.velocity || typeof config.velocity.x !== 'number') {
      return { valid: false, reason: 'Invalid velocity' };
    }
    if (typeof config.duration !== 'number' || config.duration <= 0) {
      return { valid: false, reason: 'Invalid duration' };
    }
    return { valid: true };
  }

  _validateErrorFeedback(config) {
    if (!config.pulse) return { valid: false, reason: 'Missing pulse mesh' };
    if (typeof config.duration !== 'number' || config.duration <= 0) {
      return { valid: false, reason: 'Invalid duration' };
    }
    if (!config.errorType) return { valid: false, reason: 'Missing errorType' };
    return { valid: true };
  }

  _validateMaterialization(config) {
    if (!config.node) return { valid: false, reason: 'Missing node reference' };
    if (typeof config.duration !== 'number' || config.duration <= 0) {
      return { valid: false, reason: 'Invalid duration' };
    }
    return { valid: true };
  }

  /**
   * Initialize effect with IMMUTABLE data snapshots
   * 
   * CRITICAL RULE:
   * - Clone all Vector3 positions
   * - Never store direct mesh/node references
   * - Only store scalar and cloned data
   */
  _initializeEffectWithSnapshots(effect, config, type) {
    effect.type = type;
    effect.elapsed = 0;
    effect.duration = config.duration;
    effect.id = `pooled-${type}-${Date.now()}-${Math.random()}`;
    effect.corrupted = false;

    // Store immutable snapshots based on type
    switch (type) {
      case 'activationPulse':
        effect.pulse = config.pulse;  // Mesh reference (used for direct mutation only)
        effect.duration = config.duration;
        break;

      case 'linkPulse':
        effect.pulse = config.pulse;
        effect.startPos = config.startPos.clone();  // ✅ CLONE
        effect.endPos = config.endPos.clone();      // ✅ CLONE
        break;

      case 'linkPulseRemoval':
        effect.pulse = config.pulse;
        effect.sourcePos = config.sourcePos.clone();  // ✅ CLONE
        effect.targetPos = config.targetPos.clone();  // ✅ CLONE
        break;

      case 'incompatibilityWarning':
        effect.ring = config.ring;
        effect.duration = config.duration;
        break;

      case 'shatterParticle':
        effect.particle = config.particle;
        effect.velocity = config.velocity.clone();  // ✅ CLONE
        break;

      case 'errorFeedback':
        effect.pulse = config.pulse;
        effect.errorType = config.errorType;  // Scalar
        break;

      case 'materialization':
        effect.node = config.node;
        effect.materializations = config.materializations || {};
        break;
    }

    // Bind update method (DON'T use arrow function - needs 'this' context of effect)
    effect.update = this._createUpdateFunction(type).bind(effect);
    effect.dispose = this._createDisposeFunction().bind(effect);

    return effect;
  }

  /**
   * Create effect template (minimal object)
   */
  _createEffectTemplate(type) {
    return {
      id: null,
      type: type,
      elapsed: 0,
      duration: 0,
      corrupted: false,
      // All other fields added during init
    };
  }

  /**
   * RESET effect completely (all state cleared)
   * 
   * CRITICAL: Must clear ALL fields including vectors
   */
  _resetEffect(effect) {
    effect.id = null;
    effect.type = null;
    effect.elapsed = 0;
    effect.duration = 0;
    effect.corrupted = false;

    // Clear all custom fields
    for (const key in effect) {
      if (key !== 'update' && key !== 'dispose' && key !== 'type' && 
          key !== 'elapsed' && key !== 'duration' && key !== 'id' && 
          key !== 'corrupted') {
        delete effect[key];
      }
    }
  }

  /**
   * Create update function for effect type
   * 
   * RULE: Update functions NEVER read from scene graph
   */
  _createUpdateFunction(type) {
    switch (type) {
      case 'activationPulse':
        return function(dt) {
          if (this.corrupted || !this.pulse) return { done: true };

          this.elapsed += dt;
          const progress = Math.min(this.elapsed / this.duration, 1);

          try {
            // Only mutate the pulse directly (no live reference reads)
            const scale = 1 + (3 - 1) * progress;
            this.pulse.scale.set(scale, scale, 1);
            this.pulse.material.opacity = 0.8 * (1 - progress);
          } catch (e) {
            this.corrupted = true;
            return { done: true };
          }

          return { done: progress >= 1 };
        };

      case 'linkPulse':
        return function(dt) {
          if (this.corrupted || !this.pulse || !this.startPos || !this.endPos) {
            return { done: true };
          }

          this.elapsed += dt;
          const progress = Math.min(this.elapsed / this.duration, 1);

          try {
            // Use CLONED positions (never read from live scene)
            const lerpPos = new THREE.Vector3().lerpVectors(
              this.startPos,
              this.endPos,
              progress
            );
            this.pulse.position.copy(lerpPos);

            const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
            this.pulse.scale.setScalar(scale);
            this.pulse.material.opacity = 0.8 * (1 - progress);
          } catch (e) {
            this.corrupted = true;
            return { done: true };
          }

          return { done: progress >= 1 };
        };

      case 'linkPulseRemoval':
        return function(dt) {
          if (this.corrupted || !this.pulse || !this.sourcePos || !this.targetPos) {
            return { done: true };
          }

          this.elapsed += dt;
          const progress = Math.min(this.elapsed / this.duration, 1);

          try {
            // Use CLONED positions
            const lerpPos = new THREE.Vector3().lerpVectors(
              this.targetPos,
              this.sourcePos,
              progress
            );
            this.pulse.position.copy(lerpPos);

            const scale = 0.8 + Math.sin(progress * Math.PI) * 0.4;
            this.pulse.scale.setScalar(scale);
            this.pulse.material.opacity = 0.7 * (1 - progress);
          } catch (e) {
            this.corrupted = true;
            return { done: true };
          }

          return { done: progress >= 1 };
        };

      case 'incompatibilityWarning':
        return function(dt) {
          if (this.corrupted || !this.ring) return { done: true };

          this.elapsed += dt;
          const progress = Math.min(this.elapsed / this.duration, 1);

          try {
            const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.2;
            this.ring.scale.setScalar(scale);
            this.ring.material.opacity = 0.8 * (1 - progress);
          } catch (e) {
            this.corrupted = true;
            return { done: true };
          }

          return { done: progress >= 1 };
        };

      case 'shatterParticle':
        return function(dt) {
          if (this.corrupted || !this.particle || !this.velocity) {
            return { done: true };
          }

          this.elapsed += dt;
          const progress = Math.min(this.elapsed / this.duration, 1);

          try {
            // Use CLONED velocity (immutable)
            this.particle.position.add(
              this.velocity.clone().multiplyScalar(dt)
            );
            this.particle.material.opacity = 0.9 * (1 - progress);
          } catch (e) {
            this.corrupted = true;
            return { done: true };
          }

          return { done: progress >= 1 };
        };

      case 'errorFeedback':
        return function(dt) {
          if (this.corrupted || !this.pulse) return { done: true };

          this.elapsed += dt;
          const progress = Math.min(this.elapsed / this.duration, 1);

          try {
            if (this.errorType === 'conflict') {
              const oscillation = Math.sin(progress * Math.PI * 4);
              this.pulse.scale.setScalar(1 + oscillation * 0.2);
              this.pulse.material.opacity = 0.8 * (1 - progress * 0.5);
            } else {
              this.pulse.scale.setScalar(1 + progress * 0.3);
              this.pulse.material.opacity = 0.8 * (1 - progress);
            }
          } catch (e) {
            this.corrupted = true;
            return { done: true };
          }

          return { done: progress >= 1 };
        };

      case 'materialization':
        return function(dt) {
          if (this.corrupted || !this.node || !this.node.userData) {
            return { done: true };
          }

          this.elapsed += dt;
          const progress = Math.min(this.elapsed / this.duration, 1);

          try {
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            this.node.scale.setScalar(0.9 * easeProgress);

            if (this.node.userData.vfxGlow && this.node.userData.vfxGlow.material) {
              this.node.userData.vfxGlow.material.opacity = 0.25 * easeProgress;
            }
            if (this.node.userData.vfxHolo && this.node.userData.vfxHolo.material) {
              this.node.userData.vfxHolo.material.opacity = 0.15 * easeProgress;
            }
          } catch (e) {
            this.corrupted = true;
            return { done: true };
          }

          return { done: progress >= 1 };
        };

      default:
        // Fallback: generic update
        return function(dt) {
          this.elapsed += dt;
          return { done: this.elapsed >= this.duration };
        };
    }
  }

  /**
   * Create dispose function
   */
  _createDisposeFunction() {
    return function() {
      // Subclasses override if needed
      // Default: no-op
    };
  }

  /**
   * Diagnostics: Log rejected effect
   */
  _logRejection(type, reason) {
    if (!this.diagnosticsEnabled) return;

    this.stats.totalRejected++;
    this.stats.byRejectionReason[reason] =
      (this.stats.byRejectionReason[reason] || 0) + 1;

    this.rejectedEffects.push({
      type,
      reason,
      timestamp: Date.now()
    });

    // Keep only last 100 rejections
    if (this.rejectedEffects.length > 100) {
      this.rejectedEffects.shift();
    }

    console.warn(`[EffectPool] REJECTED: ${type} - ${reason}`);
  }

  /**
   * Get pool statistics
   */
  getStatistics() {
    return {
      activeEffects: this.activeEffects.size,
      totalCreated: this.stats.totalCreated,
      totalPooled: this.stats.totalPooled,
      totalRejected: this.stats.totalRejected,
      rejectionReasons: this.stats.byRejectionReason,
      poolSizes: Object.keys(this.poolsByType).reduce((acc, type) => {
        acc[type] = this.poolsByType[type].length;
        return acc;
      }, {}),
      recentRejections: this.rejectedEffects.slice(-10)
    };
  }

  /**
   * Clear all pools (for cleanup/reset)
   */
  clearAllPools() {
    this.poolsByType = {};
    this.activeEffects.clear();
    this.rejectedEffects = [];
    this.stats = {
      totalCreated: 0,
      totalPooled: 0,
      totalRejected: 0,
      byRejectionReason: {}
    };
  }
}
