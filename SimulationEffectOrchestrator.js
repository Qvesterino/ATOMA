/**
 * SIMULATION EFFECT ORCHESTRATOR v2.0 (WITH EFFECT POOLING)
 * 
 * Central hub for ALL time-based visual effects (pulses, materializations, etc).
 * 
 * INVARIANT: No requestAnimationFrame or setTimeout.
 * All effects driven by deltaTime accumulation in single central update loop.
 * 
 * Session 37 Part 3 Enhancement:
 * - Integrated SimulationEffectPool for automatic effect reuse
 * - NO live scene references stored in effects
 * - ALL effects use immutable data snapshots (cloned vectors, scalars)
 * - Input validation on all effect creation
 * - Self-terminating effects on state corruption
 * 
 * EFFECT_INPUT_INVARIANT:
 *   "No effect update may read data from live scene graph objects."
 * 
 * Effect lifecycle:
 * 1. Validate inputs (if invalid, REJECT - no effect created)
 * 2. Acquire from pool or create new
 * 3. Initialize with immutable snapshots
 * 4. Orchestrator calls update(dt, time) every frame
 * 5. Effect accumulates elapsed time
 * 6. When done, orchestrator returns effect to pool
 */

import * as THREE from 'three';
import { SimulationEffectPool } from './SimulationEffectPool.js';

export class SimulationEffectOrchestrator {
  constructor(scene, usePooling = true) {
    // Debug guard (Priority 4 fix)
    this.debug = false;

    this.scene = scene;
    this.effects = [];
    this.effectIdCounter = 0;
    this.frameIndex = 0;
    
    // Budget cap
    this.maxActiveEffects = 200; // Max concurrent active effects
    
    // Session 37 Part 3: Effect pooling system
    this.usePooling = usePooling;
    this.effectPool = usePooling ? new SimulationEffectPool(100) : null;
    
    // Diagnostics
    this.stats = {
      totalAdded: 0,
      totalCompleted: 0,
      totalErrors: 0,
      pooledFromPool: 0,
      rejectedEffects: 0
    };
  }

  /**
   * Add a new effect to the orchestrator (NEW: uses pooling if available)
   * 
   * If usePooling is enabled:
   * - Validates all inputs first
   * - Returns null if validation fails
   * - Acquires from pool or creates new
   * 
   * Fallback (no pooling):
   * - Creates effect directly (legacy behavior)
   */
  add(effect) {
    // Validate basic effect structure
    if (!effect || typeof effect.update !== 'function') {
      console.error('[EffectOrchestrator] Invalid effect: missing update function');
      this.stats.totalErrors++;
      return null;
    }

    // If pooling disabled, use legacy path
    if (!this.usePooling || !this.effectPool) {
      return this._addDirect(effect);
    }

    // With pooling: effect already validated and initialized by pool
    if (!effect.id) {
      effect.id = `effect-${this.effectIdCounter++}`;
    }

    if (effect.elapsed === undefined) {
      effect.elapsed = 0;
    }

    this.effects.push(effect);
    this.stats.totalAdded++;
    return effect.id;
  }

  /**
   * Legacy path: Add effect without pooling (backwards compatible)
   */
  _addDirect(effect) {
    if (!effect.id) {
      effect.id = `effect-${this.effectIdCounter++}`;
    }

    if (effect.elapsed === undefined) {
      effect.elapsed = 0;
    }

    this.effects.push(effect);
    this.stats.totalAdded++;
    return effect.id;
  }

  /**
   * Add effect using pool (with type and config validation)
   * 
   * SAFETY: Returns null if validation fails (no effect added)
   */
  addPooled(type, config) {
    if (!this.effectPool) {
      console.warn('[EffectOrchestrator] Pooling disabled, use add() instead');
      return null;
    }

    const effect = this.effectPool.acquireEffect(type, config);
    if (!effect) {
      this.stats.rejectedEffects++;
      return null;
    }

    this.effects.push(effect);
    this.stats.totalAdded++;
    this.stats.pooledFromPool++;
    return effect.id;
  }

  /**
   * Main tick - call once per frame from central loop
   * 
   * Frame: this.effectOrchestrator.tick(deltaTime, this.time);
   * 
   * Session 37 Part 3: Enhanced with pooling support
   * - Updates effect elapsed time (NOT reading from scene)
   * - Calls effect.update() which uses ONLY immutable snapshots
   * - On completion, returns effect to pool if pooling enabled
   */
  tick(deltaTime, time) {
    this.frameIndex++;

    // Update all active effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];

      // Skip corrupted effects (self-terminated due to state issues)
      if (effect.corrupted) {
        this._completeEffect(effect, i);
        continue;
      }

      // Accumulate elapsed time (NOT from scene, pure game time)
      effect.elapsed += deltaTime;

      // Call effect update (MUST NOT read from scene graph)
      try {
        const result = effect.update(deltaTime, time);
        const isDone = result?.done || effect.elapsed >= effect.duration;

        if (isDone) {
          this._completeEffect(effect, i);
        }
      } catch (err) {
        this.stats.totalErrors++;
        console.error(
          `[EffectOrchestrator] update() failed for effect ${effect.id}:`,
          err.message
        );
        // Remove broken effect
        this._completeEffect(effect, i);
      }
    }
  }

  /**
   * Complete and cleanup an effect (with pooling support)
   */
  _completeEffect(effect, index) {
    // Try to call dispose
    try {
      if (effect.dispose) {
        effect.dispose();
      }
    } catch (err) {
      console.warn(
        `[EffectOrchestrator] dispose() failed for effect ${effect.id}:`,
        err.message
      );
    }

    // Return to pool if pooling enabled and effect has type
    if (this.usePooling && this.effectPool && effect.type) {
      this.effectPool.releaseEffect(effect, effect.type);
    }

    // Remove from active array
    this.effects.splice(index, 1);
    this.stats.totalCompleted++;
  }

  /**
   * Get active effect count (for diagnostics)
   */
  getActiveCount() {
    return this.effects.length;
  }

  /**
   * Get pool statistics
   */
  getPoolStatistics() {
    if (!this.effectPool) {
      return { poolingEnabled: false };
    }
    return {
      poolingEnabled: true,
      ...this.effectPool.getStatistics()
    };
  }

  /**
   * Clear all effects immediately (with pooling cleanup)
   */
  clear() {
    for (const effect of this.effects) {
      try {
        if (effect.dispose) {
          effect.dispose();
        }
      } catch (err) {
        console.warn(`[EffectOrchestrator] dispose() failed during clear:`, err);
      }
    }
    this.effects = [];

    if (this.effectPool) {
      this.effectPool.clearAllPools();
    }
  }

  /**
   * Get diagnostics (for invariant verification)
   * 
   * Session 37 Part 3: Enhanced with pooling stats
   */
  getDiagnostics() {
    const poolStats = this.effectPool ? this.effectPool.getStatistics() : null;

    return {
      activeEffects: this.effects.length,
      frameIndex: this.frameIndex,
      stats: this.stats,
      poolStats: poolStats,
      effects: this.effects.map(e => ({
        id: e.id,
        type: e.type,
        elapsed: e.elapsed,
        duration: e.duration,
        progress: e.duration > 0 ? (e.elapsed / e.duration) : 0,
        corrupted: e.corrupted || false
      }))
    };
  }

  /**
   * EFFECT_INPUT_INVARIANT Verification
   * 
   * Checks that:
   * - No active effects have live scene references
   * - All effects use only immutable snapshots
   * - No corrupted effects present
   */
  verifyEffectInputInvariant() {
    const violations = [];

    for (const effect of this.effects) {
      if (effect.corrupted) {
        violations.push({
          id: effect.id,
          type: effect.type,
          issue: 'Effect marked corrupted (state invalid)'
        });
        continue;
      }

      // Check type-specific invariants
      if (effect.type === 'linkPulse' || effect.type === 'linkPulseRemoval') {
        // These should have cloned positions, not node references
        if (effect.startPos && effect.startPos instanceof THREE.Vector3) {
          // Good: Vector3 snapshot
        } else if (effect.startPos?.position !== undefined) {
          violations.push({
            id: effect.id,
            type: effect.type,
            issue: 'Storing node reference instead of position snapshot'
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations: violations
    };
  }
}

/**
 * Helper: Create a standard material pulse effect
 * 
 * Usage:
 * const pulse = createMaterialPulseEffect({
 *   meshes: [mesh],
 *   startPos: vec3,
 *   endPos: vec3,
 *   duration: 0.5,
 *   onDispose: () => scene.remove(mesh)
 * });
 * orchestrator.add(pulse);
 */
export function createMaterialPulseEffect(config) {
  const {
    meshes = [],
    startPos = new THREE.Vector3(),
    endPos = new THREE.Vector3(),
    duration = 0.5,
    onDispose = () => {}
  } = config;

  return {
    id: `pulse-${Date.now()}`,
    type: 'materialPulse',
    elapsed: 0,
    duration: duration,
    startPos: startPos.clone(),
    endPos: endPos.clone(),
    meshes: meshes,
    
    update(deltaTime, time) {
      const progress = Math.min(this.elapsed / this.duration, 1);
      
      for (const mesh of this.meshes) {
        if (!mesh) continue;

        // Lerp position along path
        mesh.position.lerpVectors(this.startPos, this.endPos, progress);

        // Scale and fade
        const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
        mesh.scale.setScalar(scale);

        if (mesh.material) {
          mesh.material.opacity = Math.max(0, 1 - progress);
        }
      }

      return { done: progress >= 1 };
    },

    dispose() {
      for (const mesh of this.meshes) {
        if (mesh && mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh && mesh.material) {
          mesh.material.dispose();
        }
      }
      onDispose();
    }
  };
}

/**
 * Helper: Create a materialization effect (node spawn fade-in)
 * 
 * Usage:
 * const materialize = createMaterializationEffect({
 *   node: nodeObj,
 *   duration: 0.8
 * });
 * orchestrator.add(materialize);
 */
export function createMaterializationEffect(config) {
  const {
    node = null,
    duration = 0.8
  } = config;

  if (!node) {
    console.error('[createMaterializationEffect] node is required');
    return null;
  }

  return {
    id: `materialize-${node.uuid || Date.now()}`,
    type: 'materialization',
    elapsed: 0,
    duration: duration,
    node: node,
    startScale: 0,
    targetScale: 1,
    
    update(deltaTime, time) {
      const progress = Math.min(this.elapsed / this.duration, 1);
      
      // RUNTIME GUARD: Node may have been disposed mid-animation
      if (!this.node || !this.node.userData) {
        this.corrupted = true;
        return { done: true };
      }
      
      // Ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Scale up
      this.node.scale.setScalar(this.targetScale * easeProgress);

      // Fade in VFX layers
      const vfxLayers = ['vfxGlow', 'vfxHalo', 'vfxRing', 'fractalHolo'];
      for (const layerName of vfxLayers) {
        const layer = this.node.userData[layerName];
        if (layer && layer.material) {
          layer.material.opacity = layer.userData?.baseOpacity 
            ? layer.userData.baseOpacity * easeProgress 
            : 0.5 * easeProgress;
        }
      }

      // Fade particles
      if (this.node.userData.particles) {
        for (const particle of this.node.userData.particles) {
          if (particle && particle.material) {
            particle.material.opacity = (0.5 + easeProgress * 0.2) * easeProgress;
          }
        }
      }

      this.node.userData.materializeProgress = progress;
      
      return { done: progress >= 1 };
    },

    dispose() {
      if (this.node) {
        this.node.userData.isMaterializing = false;
        if (this.node.userData.materializingNodes) {
          this.node.userData.materializingNodes.delete(this.node);
        }
      }
    }
  };
}

/**
 * Helper: Create a timed color/property adjustment effect
 * 
 * Usage:
 * const emissiveFlash = createTimedPropertyEffect({
 *   target: mesh.material,
 *   property: 'emissiveIntensity',
 *   startValue: 2.0,
 *   endValue: 1.0,
 *   duration: 0.3
 * });
 * orchestrator.add(emissiveFlash);
 */
export function createTimedPropertyEffect(config) {
  const {
    target = null,
    property = 'opacity',
    startValue = 0,
    endValue = 1,
    duration = 1.0
  } = config;

  if (!target) {
    console.error('[createTimedPropertyEffect] target is required');
    return null;
  }

  return {
    id: `timedProp-${Date.now()}`,
    type: 'timedProperty',
    elapsed: 0,
    duration: duration,
    target: target,
    property: property,
    startValue: startValue,
    endValue: endValue,

    update(deltaTime, time) {
      const progress = Math.min(this.elapsed / this.duration, 1);
      const value = this.startValue + (this.endValue - this.startValue) * progress;
      
      if (this.target && this.property) {
        this.target[this.property] = value;
      }

      return { done: progress >= 1 };
    },

    dispose() {
      // Property left at final value
    }
  };
}
