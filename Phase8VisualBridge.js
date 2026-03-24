/**
 * PHASE 8 VISUAL BRIDGE
 * ====================
 * 
 * Bridges Phase 8 Ritual Orchestration to VisualAutoWiringSystem.
 * Translates ritual modifiers into canonical template modifications.
 * 
 * Authority:
 * - VisualTemplateRegistry.js: Template identity authority
 * - VisualAutoWiringSystem.js: Controller routing
 * - Canonical Templates: #1 (Synergy), #2 (Harmony), #3 (Stress)
 * 
 * Design:
 * - Non-invasive: Does not override existing template logic
 * - Transient: All modifications are reversible
 * - Safe: Graceful degradation if controllers unavailable
 * - Read-only: Never mutates stat systems
 */

import {
  CANONICAL_TEMPLATE,
  getTemplateForRenderable,
} from './VisualTemplateRegistry.js';

/**
 * Phase 8 Visual Bridge
 * Implements the modifier application interface for ritual orchestration.
 */
class Phase8VisualBridge {
  constructor(visualAutoWiringSystem, options = {}) {
    this.wiring = visualAutoWiringSystem;
    this.nodeRenderableResolver = options.getNodeRenderables ?? null;
    this.linkRenderableResolver = options.getLinkRenderables ?? null;

    // Cache: renderableId → { controller, template, baseSignal }
    this.renderableControllerCache = new Map();

    // Active ritual modifiers: renderableId → { ritualId, modifier }
    this.activeModifiers = new Map();
  }

  /**
   * Apply a ritual modifier to a renderable.
   * Modulates the visual signal without changing template semantics.
   */
  applyRitualModifier(renderable, modifier) {
    if (!renderable || !modifier) return;

    const renderableId = renderable.id || renderable.uuid;
    if (!renderableId) return;

    // Get controller for this renderable
    const controller = this._getControllerForRenderable(renderable);
    if (!controller) return;

    // Determine template type
    const template = getTemplateForRenderable(this._resolveRenderableType(renderable));
    if (!template) return;

    // Cache the pairing
    this.renderableControllerCache.set(renderableId, {
      controller,
      template,
      renderable,
      appliedAt: performance.now(),
    });

    // Track modifier
    this.activeModifiers.set(renderableId, {
      ritualId: modifier.ritualId,
      modifier,
    });

    // Apply template-specific modifications
    this._applyTemplateModification(controller, template, modifier, renderable);
  }

  /**
   * Clear all modifiers for a specific ritual.
   */
  clearRitualModifier(ritualId) {
    const toRemove = [];

    for (const [renderableId, effect] of this.activeModifiers.entries()) {
      if (effect.ritualId === ritualId) {
        toRemove.push(renderableId);
      }
    }

    for (const renderableId of toRemove) {
      this._removeModifier(renderableId);
    }
  }

  /**
   * Get node renderables from wiring system.
   */
  getNodeRenderables(nodeIds) {
    if (!nodeIds || nodeIds.length === 0) return [];
    if (typeof this.nodeRenderableResolver === 'function') {
      try {
        return this.nodeRenderableResolver(nodeIds) ?? [];
      } catch {
        return [];
      }
    }
    if (!this.wiring) return [];
    if (typeof this.wiring.getNodeRenderables !== 'function') return [];

    try {
      return this.wiring.getNodeRenderables(nodeIds);
    } catch {
      return [];
    }
  }

  /**
   * Get link renderables from wiring system.
   */
  getLinkRenderables(linkIds) {
    if (!linkIds || linkIds.length === 0) return [];
    if (typeof this.linkRenderableResolver === 'function') {
      try {
        return this.linkRenderableResolver(linkIds) ?? [];
      } catch {
        return [];
      }
    }
    if (!this.wiring) return [];
    if (typeof this.wiring.getLinkRenderables !== 'function') return [];

    try {
      return this.wiring.getLinkRenderables(linkIds);
    } catch {
      return [];
    }
  }

  /**
   * ========================================================================
   * TEMPLATE-SPECIFIC MODIFICATIONS
   * ========================================================================
   * Apply modifiers in a way that respects each template's semantics.
   */

  /**
   * Apply modification to SYNERGY_GLOW (Template #1).
   * Modifies: intensity, phase synchronization, wave propagation.
   */
  _applyTemplateModification(controller, template, modifier, renderable) {
    switch (template) {
      case CANONICAL_TEMPLATE.SYNERGY_GLOW:
        this._modifySynergyGlow(controller, modifier, renderable);
        break;

      case CANONICAL_TEMPLATE.HARMONY_AURA:
        this._modifyHarmonyAura(controller, modifier, renderable);
        break;

      case CANONICAL_TEMPLATE.STRESS_TURBULENCE:
        this._modifyStressTurbulence(controller, modifier, renderable);
        break;

      default:
        // Unknown template—silently skip
        break;
    }
  }

  /**
   * Modify SYNERGY_GLOW (cyan structural quality).
   * Allowed: intensity, phase sync, wave ripple, envelope.
   * Forbidden: color changes, blinking, pattern replacement.
   */
  _modifySynergyGlow(controller, modifier, renderable) {
    if (!controller || typeof controller.setModifier !== 'function') return;

    try {
      const glowModifier = {
        // Brightness modulation
        intensityMultiplier: modifier.intensityMultiplier ?? 1.0,

        // Phase synchronization (ritual-wide coherence)
        globalPhaseSync: modifier.globalPhaseSync ?? false,
        phaseOffset: modifier.phaseOffset ?? 0,

        // Wave propagation (gentle ripple effect)
        waveRipple: modifier.waveRipple ?? false,
        waveAmplitude: 0.15,           // Subtle ripple

        // Temporal envelope (smooth fade in/out)
        envelope: modifier.envelope ?? ((t) => 1.0),

        // Preserve: color, pattern, base frequency—do not override
        preserveSemantics: true,
      };

      controller.setModifier(glowModifier);
    } catch (e) {
      // Silently ignore if controller doesn't support modifier API
    }
  }

  /**
   * Modify HARMONY_AURA (aquamarine stability).
   * Allowed: phase sync, radius scale, breathing modulation, damping.
   * Forbidden: jitter injection, urgency signals, color changes.
   */
  _modifyHarmonyAura(controller, modifier, renderable) {
    if (!controller || typeof controller.setModifier !== 'function') return;

    try {
      const auraModifier = {
        // Radius amplification (stability envelope)
        radiusScale: modifier.radiusScale ?? 1.0,

        // Breathing phase synchronization
        globalPhaseSync: modifier.globalPhaseSync ?? false,
        phaseOffset: modifier.phaseOffset ?? 0,

        // Calming effect (slower breathing)
        calmingBreath: modifier.calmingBreath ?? 0,

        // Settling damping (smooth decay after ritual)
        settleDamping: modifier.settleDamping ?? 0,

        // Temporal envelope
        envelope: modifier.envelope ?? ((t) => 1.0),

        // Preserve: color, base frequency, jitter characteristics
        preserveSemantics: true,
      };

      controller.setModifier(auraModifier);
    } catch (e) {
      // Silently ignore if controller doesn't support modifier API
    }
  }

  /**
   * Modify STRESS_TURBULENCE (red-orange chaos).
   * Allowed: synchronization, damping, temporal coherence, gentle amplification.
   * Forbidden: color changes, damage indicators, threshold spikes.
   */
  _modifyStressTurbulence(controller, modifier, renderable) {
    if (!controller || typeof controller.setModifier !== 'function') return;

    try {
      const stressModifier = {
        // Temporal synchronization (chaos becomes readable)
        globalPhaseSync: modifier.globalPhaseSync ?? false,
        phaseOffset: modifier.phaseOffset ?? 0,

        // Turbulence damping (±30% allowed)
        // Positive = damping (reduce chaos), negative = amplify
        damping: Math.max(-0.3, Math.min(0.3, modifier.stressDamping ?? 0)),

        // Energy dispersal (failure state)
        energyDispersion: modifier.energyDispersion ?? 0,

        // Slight turbulence spike (not punishment, just signal)
        turbulenceBump: Math.max(0, Math.min(0.3, modifier.turbulenceBump ?? 0)),

        // Temporal envelope
        envelope: modifier.envelope ?? ((t) => 1.0),

        // Preserve: color, base chaos rate, damage semantics
        preserveSemantics: true,
      };

      controller.setModifier(stressModifier);
    } catch (e) {
      // Silently ignore if controller doesn't support modifier API
    }
  }

  /**
   * ========================================================================
   * INTERNAL HELPERS
   * ========================================================================
   */

  /**
   * Get or retrieve controller for a renderable.
   * Tries multiple lookup paths for robustness.
   */
  _getControllerForRenderable(renderable) {
    if (!this.wiring) return null;

    try {
      if (this.wiring?.wiringStore?.get) {
        return this.wiring.wiringStore.get(renderable)?.controller ?? null;
      }

      // Try primary lookup
      if (typeof this.wiring.getControllerForRenderable === 'function') {
        return this.wiring.getControllerForRenderable(renderable);
      }

      if (typeof this.wiring.getWiring === 'function') {
        return this.wiring.getWiring(renderable)?.controller ?? null;
      }

      // Try alternative lookup
      if (typeof this.wiring.getController === 'function') {
        return this.wiring.getController(renderable);
      }

      // Try direct controller attachment
      if (renderable.controller) {
        return renderable.controller;
      }

      // Try visual system attachment
      if (renderable.visualController) {
        return renderable.visualController;
      }
    } catch (e) {
      // Silently fail
    }

    return null;
  }

  _resolveRenderableType(renderable) {
    const explicitType = renderable?.userData?.renderableType;
    if (explicitType) return explicitType;

    if (
      renderable?.userData?.isLinkVisual === true ||
      renderable?.userData?.linkId ||
      renderable?.userData?.conduitState
    ) {
      return 'LINK';
    }

    if (renderable?.source || renderable?.target) {
      return 'LINK';
    }

    if (
      renderable?.userData?.isNode === true ||
      renderable?.userData?.isNodeRoot === true ||
      renderable?.userData?.nodeId ||
      renderable?.userData?.category
    ) {
      return 'NODE';
    }

    if (typeof renderable?.userData?.type === 'string' && renderable.userData.type.toLowerCase().includes('field')) {
      return 'FIELD';
    }

    return null;
  }

  /**
   * Remove a modifier from a renderable and restore baseline.
   */
  _removeModifier(renderableId) {
    const cached = this.renderableControllerCache.get(renderableId);
    if (!cached) return;

    const { controller, template } = cached;

    try {
      if (typeof controller.clearModifier === 'function') {
        controller.clearModifier();
      } else if (typeof controller.setModifier === 'function') {
        // Fallback: set null/identity modifier
        controller.setModifier({
          intensityMultiplier: 1.0,
          radiusScale: 1.0,
          damping: 0,
          preserveSemantics: true,
        });
      }
    } catch (e) {
      // Silently ignore
    }

    this.activeModifiers.delete(renderableId);
    this.renderableControllerCache.delete(renderableId);
  }

  /**
   * Get current modifier for a renderable (for debugging).
   */
  getActiveModifier(renderableId) {
    return this.activeModifiers.get(renderableId);
  }

  /**
   * Get statistics (for monitoring/debugging).
   */
  getStats() {
    return {
      activeModifiers: this.activeModifiers.size,
      cachedControllers: this.renderableControllerCache.size,
    };
  }

  /**
   * Reset all modifiers (for cleanup/reset).
   */
  reset() {
    for (const renderableId of this.activeModifiers.keys()) {
      this._removeModifier(renderableId);
    }
    this.activeModifiers.clear();
    this.renderableControllerCache.clear();
  }
}

export { Phase8VisualBridge };
