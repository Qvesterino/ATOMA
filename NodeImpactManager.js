/**
 * NodeImpactManager.js
 * ============================================================================
 * PARTICLE IMPACT EFFECTS AT DESTINATION NODES
 * 
 * When link particles (corruption trails or healing particles) reach their
 * destination node, trigger a subtle, state-aware impact response on the
 * node aura. Uses the unified EnergyVisualProfile for all visual parameters.
 * 
 * Design Principles:
 * - Non-explosive, organic energy absorption effect
 * - Corruption particles → subtle contraction + red bias
 * - Healing particles → gentle expansion + cyan/white bias
 * - Duration: 120-200ms smooth ease-in/out
 * - Pooled impact objects (no per-frame allocations)
 * - Never overpowers node aura or core material
 * - Fully safe no-op when disabled
 * 
 * Technical:
 * - Single unified noise from EnergyVisualProfile
 * - Shader-driven via uniforms (no new vertex/fragment code needed)
 * - Impact state tracked per-node
 * - Multiple simultaneous impacts blended together
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';
import { EnergyVisualProfile } from './EnergyVisualProfile.js';

/**
 * Single impact event - pooled and reused
 */
class Impact {
  constructor() {
    this.type = 'corruption';        // 'corruption' or 'harmony'
    this.startTime = 0;               // When impact started
    this.duration = 0.15;             // 150-220ms polished duration
    this.intensity = 1.0;             // [0-1] strength
    this.active = false;
    this.incomingDirection = null;    // Direction from which particle came (for bias)
    this.lastCooldownCheckTime = 0;   // Time of last cooldown smoothing check
  }

  /**
   * Initialize this impact
   * @param {string} type - 'corruption' or 'harmony'
   * @param {number} startTime - Current time in seconds
   * @param {number} duration - Duration in seconds (default 0.15)
   * @param {number} intensity - [0-1] strength
   * @param {THREE.Vector3} incomingDirection - Direction particle came from (optional)
   */
  reset(type, startTime, duration = 0.15, intensity = 1.0, incomingDirection = null) {
    this.type = type;
    this.startTime = startTime;
    this.duration = duration;
    this.intensity = Math.max(0, Math.min(1, intensity));
    this.active = true;
    this.incomingDirection = incomingDirection;
  }

  /**
   * Get current progress [0-1]
   * @param {number} currentTime
   * @returns {number} Progress, or -1 if expired
   */
  getProgress(currentTime) {
    const elapsed = currentTime - this.startTime;
    if (elapsed < 0) return 0;
    if (elapsed > this.duration) {
      this.active = false;
      return -1;
    }
    return elapsed / this.duration;
  }

  /**
   * Get ease-in/out factor [0-1]
   * Polished curve: smooth in, subtle hold, longer ease-out
   * Creates a "breathing in" effect: quick response, gentle decay
   * @param {number} progress [0-1]
   * @returns {number} Eased value [0-1]
   */
  getEasedFactor(progress) {
    if (progress < 0 || progress > 1) return 0;
    
    // Polished timing: 25% ease-in, 25% hold, 50% ease-out
    // Longer decay for gentler settling
    if (progress < 0.25) {
      // Quick ease-in: 0 → 1 over first 25%
      const t = progress / 0.25;
      return t * t * (3 - 2 * t); // Smoothstep in
    } else if (progress < 0.5) {
      // Brief hold: 1.0 for next 25%
      return 1.0;
    } else {
      // Longer ease-out: 1 → 0 over last 50%
      // Creates gentle settling effect (no sharp drop)
      const t = (progress - 0.5) / 0.5;
      
      // Smooth cubic ease-out for graceful decay
      const easeOut = 1.0 - t * t * t;  // Cubic ease-out (smoother than smoothstep)
      
      // Optional: add subtle rebound (energy oscillation) - very gentle
      const rebound = Math.sin(t * Math.PI) * 0.05 * (1 - t);  // ~5% secondary pulse
      
      return easeOut + rebound;
    }
  }

  /**
   * Get displacement multiplier for this impact
   * Corruption: contraction (negative), Harmony: expansion (positive)
   * @param {number} progress [0-1]
   * @returns {number} Displacement factor
   */
  getDisplacementFactor(progress) {
    const eased = this.getEasedFactor(progress);
    
    if (this.type === 'corruption') {
      // Contraction: shrink inward during impact
      // Range: 0 → -0.2 → 0
      return -0.2 * eased * this.intensity;
    } else {
      // Expansion: grow outward during impact
      // Range: 0 → +0.15 → 0
      return 0.15 * eased * this.intensity;
    }
  }

  /**
   * Blend this impact with another (for cooldown smoothing)
   * When rapid arrivals occur, smooth blend instead of restart/spike
   * @param {Impact} newImpact - The incoming impact to blend with
   * @param {number} currentTime - Current time for blending calculation
   */
  blendWith(newImpact, currentTime) {
    const progress = this.getProgress(currentTime);
    
    // If this impact is in the middle of decay, smoothly blend toward the stronger
    if (progress > 0 && progress < 1) {
      // Never fully restart timing - preserve decay phase
      // But shift toward longer duration if new impact is stronger
      if (newImpact.intensity > this.intensity) {
        // New impact is stronger - extend duration slightly but preserve phase
        const currentElapsed = currentTime - this.startTime;
        this.duration = Math.max(
          this.duration,
          currentElapsed + (newImpact.duration * 0.5)  // Add 50% of new duration
        );
        // Update intensity to stronger value
        this.intensity = Math.max(this.intensity, newImpact.intensity * 0.95);  // 95% blend
      } else {
        // Current impact is stronger - maintain it but slightly boost
        this.intensity = Math.min(1.0, this.intensity + (newImpact.intensity * 0.2));  // +20% reinforcement
      }
      
      // Transfer direction from new impact if stronger
      if (newImpact.incomingDirection && (!this.incomingDirection || newImpact.intensity > 0.7)) {
        this.incomingDirection = newImpact.incomingDirection;
      }
      
      return true;  // Blended successfully
    }
    
    return false;  // Impact too old or too new for blending
  }

  /**
   * Get color bias for this impact
   * Corruption: red tint, Harmony: cyan/white tint
   * @param {number} progress [0-1]
   * @returns {number} Color influence [0-1]
   */
  getColorBias(progress) {
    const eased = this.getEasedFactor(progress);
    
    if (this.type === 'corruption') {
      // Red bias at peak impact
      return eased * 0.3 * this.intensity;
    } else {
      // Cyan/white bias at peak impact
      return eased * 0.25 * this.intensity;
    }
  }
}

/**
 * IMPACT POOL
 * Reusable set of impact objects, no per-frame allocations
 */
class ImpactPool {
  constructor(capacity = 32) {
    this.capacity = capacity;
    this.pool = [];
    this.active = [];
    
    // Pre-allocate all impacts
    for (let i = 0; i < capacity; i++) {
      this.pool.push(new Impact());
    }
  }

  /**
   * Request an impact from the pool
   * @param {string} type
   * @param {number} startTime
   * @param {number} duration
   * @param {number} intensity
   * @returns {Impact} Pooled impact object
   */
  acquire(type, startTime, duration = 0.15, intensity = 1.0) {
    let impact;
    
    if (this.pool.length > 0) {
      // Reuse from pool
      impact = this.pool.pop();
    } else {
      // Pool exhausted, create new (shouldn't happen with good capacity)
      impact = new Impact();
    }
    
    impact.reset(type, startTime, duration, intensity);
    this.active.push(impact);
    return impact;
  }

  /**
   * Update all active impacts, return expired ones to pool
   * @param {number} currentTime
   * @returns {Impact[]} All currently active impacts
   */
  update(currentTime) {
    const stillActive = [];
    
    for (const impact of this.active) {
      const progress = impact.getProgress(currentTime);
      if (progress >= 0) {
        stillActive.push(impact);
      } else {
        this.pool.push(impact);
      }
    }
    
    this.active = stillActive;
    return this.active;
  }

  /**
   * Get all active impacts
   * @returns {Impact[]}
   */
  getActive() {
    return this.active;
  }

  /**
   * Clear all impacts
   */
  clear() {
    this.pool.push(...this.active);
    this.active = [];
  }
}

/**
 * ============================================================================
 * NODE IMPACT MANAGER
 * ============================================================================
 * Manages impacts for a single node, blending multiple simultaneous effects
 */
export class NodeImpactManager {
  constructor(nodeId = 0) {
    this.nodeId = nodeId;
    this.impactPool = new ImpactPool(32);
    this.currentTime = 0;
  }

  /**
   * Trigger a particle impact at this node
   * Implements cooldown smoothing to prevent spam from rapid particle arrivals
   * @param {string} type - 'corruption' or 'harmony'
   * @param {number} currentTime - Current time in seconds
   * @param {number} intensity - [0-1] impact strength
   * @param {number} duration - Duration in seconds (default 0.15)
   * @param {THREE.Vector3} incomingDirection - Direction particle came from (optional)
   */
  triggerImpact(type, currentTime, intensity = 1.0, duration = 0.15, incomingDirection = null) {
    if (!['corruption', 'harmony'].includes(type)) {
      console.warn(`Invalid impact type: ${type}`);
      return;
    }
    
    // ========================================================================
    // COOLDOWN SMOOTHING - BLEND RAPID ARRIVALS INSTEAD OF STACKING
    // ========================================================================
    // Check if there's an active impact of the same type currently decaying
    // If so, smoothly blend instead of creating a new impact (anti-spam)
    
    const activeImpacts = this.impactPool.getActive();
    let blended = false;
    
    for (const activeImpact of activeImpacts) {
      // Only blend impacts of the same type (corruption with corruption, etc.)
      if (activeImpact.type === type) {
        const progress = activeImpact.getProgress(currentTime);
        
        // Check if impact is in "decay" phase (past 50% and still active)
        // This prevents spam by blending rather than restarting
        if (progress > 0.5 && progress < 1.0) {
          // Create temporary impact for blending (won't be added to pool)
          const tempImpact = new Impact();
          tempImpact.reset(type, currentTime, duration, intensity, incomingDirection);
          
          // Blend the active impact with this new one
          if (activeImpact.blendWith(tempImpact, currentTime)) {
            blended = true;
            break;  // Only blend with first matching active impact
          }
        }
      }
    }
    
    // If not blended with existing impact, create new impact
    if (!blended) {
      const impact = this.impactPool.acquire(type, currentTime, duration, intensity);
      if (impact && incomingDirection) {
        impact.incomingDirection = incomingDirection;
      }
    }
  }

  /**
   * Update all impacts for this node
   * @param {number} currentTime - Current time in seconds
   */
  update(currentTime) {
    this.currentTime = currentTime;
    this.impactPool.update(currentTime);
  }

  /**
   * Get combined impact state for shader uniforms
   * Includes adaptive scaling based on node stability
   * @param {number} nodeStability [0-1] - Node stability/health metric (0=unstable, 1=stable)
   * @returns {Object} { displacementFactor, corruptionBias, harmonyBias, incomingDirection, rippleAmplitude, rippleTriggerTime }
   */
  getShaderState(nodeId, nodeStability = 0.5) {
    const impacts = this.impactPool.getActive();
    let displacementFactor = 0;
    let corruptionBias = 0;
    let harmonyBias = 0;
    let incomingDirection = null;
    let rippleAmplitude = 0;
    let rippleTriggerTime = -1;

    // ========================================================================
    // ADAPTIVE SCALING BASED ON NODE STABILITY
    // ========================================================================
    // Clamp stability to [0-1]
    const clampedStability = Math.max(0, Math.min(1, nodeStability));
    
    // Adaptive multiplier:
    // - Stable (1.0): softer impact (×0.75)
    // - Unstable (0.0): sharper impact (×1.25)
    // - Linear interpolation between
    const stabilityMultiplier = THREE.MathUtils.lerp(1.25, 0.75, clampedStability);

    for (const impact of impacts) {
      const progress = impact.getProgress(this.currentTime);
      if (progress < 0) continue;

      // Apply adaptive scaling to displacement
      const scaledDisplacement = impact.getDisplacementFactor(progress) * stabilityMultiplier;
      displacementFactor += scaledDisplacement;

      if (impact.type === 'corruption') {
        corruptionBias += impact.getColorBias(progress);
      } else {
        harmonyBias += impact.getColorBias(progress);
      }
      
      // Store incoming direction from first active impact (for directional bias)
      if (!incomingDirection && impact.incomingDirection) {
        incomingDirection = impact.incomingDirection;
      }
      
      // Ripple: trigger at impact start (progress near 0), fade over time
      // Amplitude scales with impact intensity and inverse of stability
      // Unstable nodes ripple more strongly
      if (progress < 0.3) {  // Only during early phase
        const rippleIntensity = impact.intensity * (1.0 - clampedStability * 0.5);  // 0.5–1.0 range
        rippleAmplitude = Math.max(rippleAmplitude, rippleIntensity);
        
        // Record trigger time from most recent strong impact
        if (rippleAmplitude > 0.5 && rippleTriggerTime < 0) {
          rippleTriggerTime = this.currentTime;
        }
      }
    }

    // Clamp to prevent over-strong effects
    return {
      displacementFactor: Math.max(-0.3, Math.min(0.2, displacementFactor)),
      corruptionBias: Math.min(1.0, corruptionBias),
      harmonyBias: Math.min(1.0, harmonyBias),
      incomingDirection: incomingDirection,  // Direction bias for aura deformation
      rippleAmplitude: rippleAmplitude,      // [0-1] ripple strength
      rippleTriggerTime: rippleTriggerTime,  // Time when ripple should trigger
      stability: clampedStability,           // Current stability for shader use
    };
  }

  /**
   * Check if this node has any active impacts
   * @returns {boolean}
   */
  hasActiveImpacts() {
    return this.impactPool.getActive().length > 0;
  }

  /**
   * Clear all impacts
   */
  clear() {
    this.impactPool.clear();
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.impactPool.clear();
  }
}

/**
 * ============================================================================
 * MULTI-NODE IMPACT MANAGER
 * ============================================================================
 * Manages impacts for all nodes in the network
 */
export class ImpactManagerCollection {
  constructor() {
    this.managers = new Map();  // nodeId → NodeImpactManager
    this.profile = EnergyVisualProfile;
    this.maxManagers = 100; // Budget cap for tracked node managers
  }

  /**
   * Get or create impact manager for a node
   * @param {number} nodeId
   * @returns {NodeImpactManager}
   */
  getManager(nodeId) {
    if (!this.managers.has(nodeId)) {
      this.managers.set(nodeId, new NodeImpactManager(nodeId));
    }
    return this.managers.get(nodeId);
  }

  /**
   * Trigger an impact on a node
   * @param {number} nodeId
   * @param {string} type - 'corruption' or 'harmony'
   * @param {number} currentTime
   * @param {number} intensity - [0-1]
   * @param {number} duration - Duration in seconds
   * @param {THREE.Vector3} incomingDirection - Direction particle came from (optional)
   */
  triggerImpact(nodeId, type, currentTime, intensity = 1.0, duration = 0.15, incomingDirection = null) {
    this.getManager(nodeId).triggerImpact(type, currentTime, intensity, duration, incomingDirection);
  }

  /**
   * Update all impact managers
   * @param {number} currentTime
   */
  update(currentTime) {
    for (const manager of this.managers.values()) {
      manager.update(currentTime);
    }
  }

  /**
   * Get shader state for a node
   * @param {number} nodeId
   * @param {number} nodeStability [0-1] - Node stability for adaptive scaling
   * @returns {Object} { displacementFactor, corruptionBias, harmonyBias, rippleAmplitude, rippleTriggerTime, stability }
   */
  getShaderState(nodeId, nodeStability = 0.5) {
    const manager = this.managers.get(nodeId);
    if (!manager) {
      return { 
        displacementFactor: 0, 
        corruptionBias: 0, 
        harmonyBias: 0,
        rippleAmplitude: 0,
        rippleTriggerTime: -1,
        stability: nodeStability
      };
    }
    return manager.getShaderState(nodeId, nodeStability);
  }

  /**
   * Check if any node has active impacts
   * @returns {boolean}
   */
  hasAnyActiveImpacts() {
    for (const manager of this.managers.values()) {
      if (manager.hasActiveImpacts()) return true;
    }
    return false;
  }

  /**
   * Clear all impacts
   */
  clear() {
    for (const manager of this.managers.values()) {
      manager.clear();
    }
  }

  /**
   * Remove a node's impact manager
   * @param {number} nodeId
   */
  removeNode(nodeId) {
    const manager = this.managers.get(nodeId);
    if (manager) {
      manager.dispose();
      this.managers.delete(nodeId);
    }
  }

  /**
   * Dispose all managers
   */
  dispose() {
    for (const manager of this.managers.values()) {
      manager.dispose();
    }
    this.managers.clear();
  }

  /**
   * Debug info
   */
  getDebugInfo() {
    let totalActive = 0;
    const activeByType = { corruption: 0, harmony: 0 };

    for (const manager of this.managers.values()) {
      for (const impact of manager.impactPool.getActive()) {
        totalActive++;
        activeByType[impact.type]++;
      }
    }

    return {
      totalManagers: this.managers.size,
      totalActiveImpacts: totalActive,
      activeByType,
    };
  }
}

/**
 * ============================================================================
 * IMPACT CONFIGURATION (from EnergyVisualProfile)
 * ============================================================================
 */
export const ImpactConfig = {
  // Duration ranges (seconds)
  durationMin: 0.12,
  durationMax: 0.20,
  durationDefault: 0.15,

  // Intensity modulation
  corruptionIntensity: 1.0,    // Full strength
  harmonyIntensity: 0.85,      // Slightly gentler

  // Displacement ranges
  corruptionContraction: -0.2,  // Inward pull
  harmonyExpansion: 0.15,       // Outward push

  // Color bias ranges
  corruptionColorBias: 0.3,     // Red tint intensity
  harmonyColorBias: 0.25,       // Cyan/white tint intensity

  // Temporal curves
  easeInDuration: 0.3,          // 30% of impact is ease-in
  holdDuration: 0.4,            // 40% at peak
  easeOutDuration: 0.3,         // 30% is ease-out

  /**
   * Get duration based on state
   * @param {number} harmony [0-1]
   * @param {number} corruption [0-1]
   * @returns {number} Duration in seconds
   */
  getDuration(harmony = 0.5, corruption = 0.5) {
    // Base duration
    let duration = this.durationDefault;
    
    // Harmony makes impacts slightly longer (more resonance)
    duration += (harmony * 0.02);
    
    // Corruption makes impacts slightly shorter (sharp)
    duration -= (corruption * 0.02);
    
    return Math.max(this.durationMin, Math.min(this.durationMax, duration));
  },

  /**
   * Get intensity based on particle system state
   * @param {number} particleCount Active particles
   * @param {number} maxParticles Maximum particles
   * @param {string} type 'corruption' or 'harmony'
   * @returns {number} Intensity [0-1]
   */
  getIntensity(particleCount, maxParticles, type = 'corruption') {
    // Scale by how "full" the particle pool is
    const fillRatio = Math.min(1, particleCount / maxParticles);
    
    // Stronger when many particles arrive
    const intensityBase = 0.5 + (fillRatio * 0.5);
    
    // Apply type modifier
    const modifier = type === 'corruption' ? this.corruptionIntensity : this.harmonyIntensity;
    
    return Math.min(1, intensityBase * modifier);
  },

  /**
   * Describe this configuration for debugging
   */
  describe() {
    return `
ImpactConfig - Particle Impact Effects
=======================================

TIMING:
  Default Duration: ${this.durationDefault * 1000}ms
  Range: ${this.durationMin * 1000}ms - ${this.durationMax * 1000}ms
  Ease-In: ${this.easeInDuration * 100}% of duration
  Hold: ${this.holdDuration * 100}% of duration
  Ease-Out: ${this.easeOutDuration * 100}% of duration

INTENSITY:
  Corruption Base: ${this.corruptionIntensity}
  Harmony Base: ${this.harmonyIntensity}

DISPLACEMENT:
  Corruption (contraction): ${this.corruptionContraction}
  Harmony (expansion): ${this.harmonyExpansion}

COLOR BIAS:
  Corruption (red tint): ${this.corruptionColorBias}
  Harmony (cyan/white): ${this.harmonyColorBias}

STATE-AWARE MODULATION:
  Duration affected by harmony/corruption levels
  Intensity scales with particle pool fullness
    `;
  },
};

export default ImpactManagerCollection;
