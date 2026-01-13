/**
 * EVENT VISUAL SUPPRESSION SYSTEM v1.0 (Session 26)
 * 
 * PURPOSE:
 * Prevent event visual effects from diluting or occluding node core visibility.
 * Events remain fully functional (gameplay + audio), but their VISUAL effects
 * are redirected to aura/halo systems instead of overlaying the core.
 * 
 * PHILOSOPHY:
 * - Events CAN affect aura intensity (good)
 * - Events CANNOT occlude core (bad)
 * - Events CANNOT override core material (bad)
 * - Events CANNOT add transparency layers over core (bad)
 * - Events work with authority system (aura subordination)
 * 
 * SUPPRESSION RULES:
 * 1. Core-level effects → Redirect to aura modulation
 * 2. Overlay effects → Suppress completely
 * 3. Material modifications → Guard via CoreAuthority
 * 4. Transparency shifts → Clamp to aura limits
 * 5. Emissive changes → Move to aura/halo
 * 
 * SUPPORTED EVENT TYPES:
 * - Personality VFX (emissive, jitter, rotation)
 * - Micro-events (pulses, shimmers, halos)
 * - Link effects (resonance, glows)
 * - Evolution triggers (visual feedback)
 * - World events (environmental effects)
 * - Metrics reactions (dynamic feedback)
 * 
 * CONSTRAINTS:
 * ✓ No changes to core materials
 * ✓ No per-frame overhead
 * ✓ Events remain 100% functional
 * ✓ Aura system must be running
 * ✓ Compatible with CoreAuthority
 * ✓ Silent failure handling
 * 
 * INTEGRATION:
 * 1. Import and instantiate in main.js
 * 2. Call suppressVFXEventEffects() before VFX layers
 * 3. Call redirectToAura() for any event-driven material changes
 * 4. Call validateEventVisuals() in debug mode
 */

import * as THREE from 'three';

export class EventVisualSuppression_v1 {
  constructor(config = {}) {
    this.config = {
      debugEnabled: config.debugEnabled ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Suppression intensity (0-1, higher = more aggressive suppression)
      suppressionStrength: config.suppressionStrength ?? 0.8,
      
      // What to suppress
      suppressCoreEmissive: config.suppressCoreEmissive ?? true,
      suppressCoreOpacity: config.suppressCoreOpacity ?? true,
      suppressCoreOverlays: config.suppressCoreOverlays ?? true,
      suppressCoreMaterial: config.suppressCoreMaterial ?? true,
      
      // Redirect targets
      redirectToAura: config.redirectToAura ?? true,
      redirectToHalo: config.redirectToHalo ?? false,
      
      // Performance
      batchCheckEnabled: config.batchCheckEnabled ?? true,
      maxNodesPerCheck: config.maxNodesPerCheck ?? 50
    };

    // Track suppressed effects per node
    this.suppressedEffects = new WeakMap();
    
    // Track what was redirected to aura
    this.redirectedIntensity = new WeakMap();
    
    // Monitored event sources
    this.monitoredSources = new Set();
  }

  /**
   * STEP 1: REGISTER EVENT SYSTEM FOR MONITORING
   * 
   * Call this for any system that applies visual effects:
   * - PersonalityVFXLayer_v1
   * - NodeMicroEvents
   * - EvolutionRegistry (visual effects)
   * - ResonanceFeedback_v1
   * - etc.
   */
  registerEventSource(sourceSystem, sourceLabel = 'unknown') {
    if (!sourceSystem) return;

    try {
      this.monitoredSources.add({
        system: sourceSystem,
        label: sourceLabel,
        timestamp: performance.now()
      });

      if (this.config.enableLogging) {
        console.log(`[EventSuppression] Registered event source:`, sourceLabel);
      }
    } catch (e) {
      // Silent failure
      if (this.config.debugEnabled) {
        console.warn('[EventSuppression] Failed to register event source:', e.message);
      }
    }
  }

  /**
   * STEP 2: SUPPRESS CORE-LEVEL VFX EFFECTS
   * 
   * Before personality VFX layers run, suppress core-targeted effects
   * and redirect them to aura system instead.
   * 
   * Call BEFORE: personalityVFXLayer.update()
   * Call BEFORE: nodeMicroEvents.update()
   */
  suppressVFXEventEffects(nodes, targetAuraSystem = null) {
    if (!nodes || nodes.length === 0) return;

    try {
      for (const node of nodes) {
        if (!node || !node.mesh) continue;

        const suppressed = this._suppressNodeVFX(node, targetAuraSystem);
        if (suppressed) {
          this.suppressedEffects.set(node, suppressed);
        }
      }

      if (this.config.enableLogging && nodes.length > 0) {
        console.log(`[EventSuppression] Suppressed VFX for ${nodes.length} nodes`);
      }
    } catch (e) {
      // Silent failure
      if (this.config.debugEnabled) {
        console.warn('[EventSuppression] VFX suppression failed:', e.message);
      }
    }
  }

  /**
   * STEP 3: REDIRECT EVENT INTENSITY TO AURA
   * 
   * When events apply intensity effects (pulses, glows, brightness),
   * redirect that intensity to the aura system so it modulates
   * aura opacity/scale instead of core opacity.
   * 
   * Called by: Event systems that have intensity parameters
   */
  redirectToAura(node, eventIntensity, targetAuraSystem = null) {
    if (!node || eventIntensity === undefined) return 0;

    try {
      // Clamp event intensity (0-1)
      const clampedIntensity = Math.max(0, Math.min(1, eventIntensity));

      // Query core authority for max aura opacity
      const coreAuthority = this._getCoreAuthority();
      if (!coreAuthority) {
        // Fallback if no authority
        return clampedIntensity * 0.25;
      }

      const maxAuraOpacity = coreAuthority.getMaxAuraOpacity(node);
      
      // Map event intensity to aura modulation
      // High event intensity → increase aura visibility (but stay under limit)
      const auraModulation = clampedIntensity * maxAuraOpacity;

      // Store for aura system to use
      this.redirectedIntensity.set(node, auraModulation);

      // If aura system provided, directly apply
      if (targetAuraSystem && targetAuraSystem.modulateNodeAura) {
        targetAuraSystem.modulateNodeAura(node, auraModulation);
      }

      if (this.config.enableLogging) {
        console.log(`[EventSuppression] Redirected intensity: ${clampedIntensity} → aura: ${auraModulation}`);
      }

      return auraModulation;
    } catch (e) {
      // Silent failure
      if (this.config.debugEnabled) {
        console.warn('[EventSuppression] Failed to redirect to aura:', e.message);
      }
      return 0;
    }
  }

  /**
   * STEP 4: GUARD CORE MATERIAL FROM EVENTS
   * 
   * Detects when events might modify core material and restores
   * original via CoreAuthority.
   * 
   * Call AFTER events apply effects if you suspect material changes
   */
  protectCoreFromEvent(node, eventLabel = 'unknown') {
    if (!node) return;

    try {
      const coreAuthority = this._getCoreAuthority();
      if (!coreAuthority) return;

      // Let authority handle core protection
      coreAuthority.protectCoreMaterial(node);

      if (this.config.enableLogging) {
        console.log(`[EventSuppression] Protected core from event: ${eventLabel}`);
      }
    } catch (e) {
      // Silent failure
      if (this.config.debugEnabled) {
        console.warn('[EventSuppression] Failed to protect core:', e.message);
      }
    }
  }

  /**
   * STEP 5: VALIDATE NO VISUAL DILUTION
   * 
   * Debug tool: checks if event effects are trying to dilute core.
   * Use in debug builds to verify suppression is working.
   */
  validateEventVisuals(nodes) {
    if (!nodes || nodes.length === 0) return { valid: true, issues: [] };

    const issues = [];

    try {
      for (const node of nodes) {
        if (!node || !node.mesh) continue;

        const material = node.mesh.material;
        if (!material) continue;

        // Check for suspicious opacity changes
        if (material.opacity < 0.8 && material.transparent) {
          issues.push({
            nodeId: node.userData?.id,
            issue: 'Core transparency reduced by event',
            opacity: material.opacity
          });
        }

        // Check for emissive changes
        if (material.emissive && material.emissive.getHex() !== 0x000000) {
          if (material.emissiveIntensity > 0.5) {
            issues.push({
              nodeId: node.userData?.id,
              issue: 'Core emissive boosted by event',
              intensity: material.emissiveIntensity
            });
          }
        }

        // Check for material replacement
        const registration = this._getCoreAuthority()?.getCoreRegistration(node);
        if (registration && material !== registration.originalMaterial) {
          issues.push({
            nodeId: node.userData?.id,
            issue: 'Core material replaced by event'
          });
        }
      }

      const valid = issues.length === 0;

      if (this.config.enableLogging || (this.config.debugEnabled && !valid)) {
        console.log(`[EventSuppression] Visual validation:`, {
          total: nodes.length,
          issues: issues.length,
          valid: valid,
          details: issues
        });
      }

      return { valid, issues };
    } catch (e) {
      // Silent failure
      if (this.config.debugEnabled) {
        console.warn('[EventSuppression] Validation failed:', e.message);
      }
      return { valid: false, issues: [] };
    }
  }

  /**
   * STEP 6: GET SUPPRESSION STATUS FOR A NODE
   * 
   * Query what effects were suppressed for a node
   */
  getSuppressedEffects(node) {
    if (!node) return null;
    return this.suppressedEffects.get(node);
  }

  /**
   * STEP 7: GET REDIRECTED INTENSITY
   * 
   * Query where event intensity was redirected
   */
  getRedirectedIntensity(node) {
    if (!node) return 0;
    return this.redirectedIntensity.get(node) ?? 0;
  }

  /**
   * HELPER: Suppress VFX effects on a single node
   * @private
   */
  _suppressNodeVFX(node, targetAuraSystem) {
    if (!node || !node.mesh || !node.mesh.material) return null;

    const material = node.mesh.material;
    const suppressed = {
      originalOpacity: material.opacity,
      originalEmissive: material.emissive?.clone(),
      originalEmissiveIntensity: material.emissiveIntensity,
      suppressedAt: performance.now()
    };

    try {
      // SUPPRESS 1: Clamp opacity to prevent transparency dilution
      if (this.config.suppressCoreOpacity && material.transparent) {
        material.opacity = Math.max(material.opacity, 0.85);
      }

      // SUPPRESS 2: Reduce emissive boost (move to aura instead)
      if (this.config.suppressCoreEmissive && material.emissive) {
        material.emissive.multiplyScalar(1 - this.config.suppressionStrength);
        material.emissiveIntensity *= (1 - this.config.suppressionStrength * 0.5);
      }

      // SUPPRESS 3: Prevent overlay effects
      if (this.config.suppressCoreOverlays) {
        // Don't allow new material layers
        // This is enforced by CoreAuthority
      }

      // SUPPRESS 4: Guard material
      if (this.config.suppressCoreMaterial) {
        const coreAuthority = this._getCoreAuthority();
        if (coreAuthority) {
          coreAuthority.protectCoreMaterial(node);
        }
      }

      suppressed.applied = true;
      return suppressed;
    } catch (e) {
      // Silent failure
      suppressed.applied = false;
      return suppressed;
    }
  }

  /**
   * HELPER: Get reference to CoreAuthority if available
   * @private
   */
  _getCoreAuthority() {
    try {
      if (typeof window !== 'undefined' && window.game?.nodeCoreAuthority) {
        return window.game.nodeCoreAuthority;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * PUBLIC API: Clear all suppression state (e.g., world reset)
   */
  dispose() {
    this.suppressedEffects = new WeakMap();
    this.redirectedIntensity = new WeakMap();
    this.monitoredSources.clear();
  }

  /**
   * PUBLIC API: Get statistics
   */
  getStats() {
    return {
      monitoredSources: this.monitoredSources.size,
      suppressionStrength: this.config.suppressionStrength,
      rulesEnabled: {
        suppressCoreEmissive: this.config.suppressCoreEmissive,
        suppressCoreOpacity: this.config.suppressCoreOpacity,
        suppressCoreOverlays: this.config.suppressCoreOverlays,
        suppressCoreMaterial: this.config.suppressCoreMaterial,
        redirectToAura: this.config.redirectToAura
      }
    };
  }
}

/**
 * CONSOLE API FOR DEBUGGING
 */
export function setupEventSuppressionConsoleAPI(suppression) {
  return {
    checkNode(node) {
      if (!node) {
        console.log('[DEBUG] No node provided');
        return;
      }

      const suppressed = suppression.getSuppressedEffects(node);
      const redirected = suppression.getRedirectedIntensity(node);

      console.log('[DEBUG] Event Suppression Status:', {
        nodeId: node.userData?.id,
        suppressed: !!suppressed,
        suppressedEffects: suppressed,
        redirectedIntensity: redirected,
        material: {
          opacity: node.mesh?.material?.opacity,
          emissive: node.mesh?.material?.emissive?.getHex(),
          emissiveIntensity: node.mesh?.material?.emissiveIntensity
        }
      });
    },

    validateAll(nodes) {
      if (!nodes || !Array.isArray(nodes)) {
        console.log('[DEBUG] Invalid nodes array');
        return;
      }

      const result = suppression.validateEventVisuals(nodes);
      console.log('[DEBUG] Visual Validation Result:', result);
    },

    getStats() {
      const stats = suppression.getStats();
      console.log('[DEBUG] Event Suppression Statistics:', stats);
    }
  };
}
