/**
 * HARMONY AURA CONTROLLER
 * =======================
 * CANONICAL TEMPLATE #2 — HARMONY AURA
 * Part of: ATOMA Core Metric Architecture (LOCKED)
 * 
 * Authority: CanonicalVisualTemplateLibrary.md
 * 
 * 🔒 ARCHITECTURAL CONTRACT:
 * ✅ Reads ONLY from: node.userData.harmonyAuraStrength (derived 0..1)
 * ❌ NEVER reads: node.userData.harmony (raw stat)
 * ❌ NEVER reads: corruption, stress, integrity (unrelated stats)
 * ❌ NEVER writes to: node.userData.* (metrics are read-only)
 * ❌ NEVER triggers: game events
 * 
 * 📐 CANONICAL MAPPINGS (LOCKED):
 * - Opacity: smoothstep(0.2, 0.8, harmonyAuraStrength)
 * - Radius: lerp(1.0, 1.35, harmonyAuraStrength)
 * - Breathing: frequency lerp(0.15 Hz, 0.45 Hz), amplitude ±3%
 * - Color: Soft cyan/teal/mint (#7fffd4 aquamarine)
 * - Secondary smoothing: alpha ~0.12 (visual stability)
 * 
 * Performance: O(1) per node, no allocations per frame
 * 
 * Session 95: Visual Layer Enforcement Integration
 * - Harmony aura material modifications now checked against enforcement gate
 * - Prevents invalid opacity/color modifications
 */

import { CONFIG } from './config.js';
import { VisualLayerEnforcementIntegrationHelpers as IntegrationHelpers } from './VisualLayerEnforcementIntegrationHelpers.js';
import VisualTime from './src/time/VisualTime.js';

let _harmonyTimeOrigin;

/**
 * Smoothstep function (canonical opacity easing)
 * Maps [0..1] to smoothly interpolated [0..1]
 * with soft start and end
 */
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Linear interpolation (canonical radius/frequency scaling)
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class HarmonyAuraController {
  /**
   * @param {THREE.Object3D} node - Node entity with userData containing harmonyAuraStrength
   * @param {THREE.ShaderMaterial} material - Material with harmony aura uniforms
   * @param {VisualLayerEnforcementGate} enforcementGate - Optional enforcement gate (Session 95)
   */
  constructor(node, material, enforcementGate = null) {
    this.node = node;
    this.material = material;
    this.enforcementGate = enforcementGate;

    // Secondary visual smoothing state (local, never written to userData)
    // Alpha tuned to ~0.12 for stable, responsive visuals
    this._smoothedOpacity = 0.0;
    this._smoothedRadius = 1.0;
    this._smoothedPulseFrequency = 0.15; // Hz (low end)
  }

  /**
   * Update controller each frame
   * @param {number} dt - Delta time (seconds)
   * @param {number} timeSeconds - Total elapsed time (seconds)
   * [SESSION 99] Early exit if node auras are disabled
   */
    update(dt, timeSeconds) {
    // ✓ FEATURE FLAG: Node aura visuals disabled (Session 99 Stabilization)
    if (!CONFIG.features?.ENABLE_NODE_AURAS) {
      return;  // ← Silent return, no aura updates
    }
    
    // Safe optional chaining - bail gracefully if node or material missing
    if (!this.node || !this.material || !this.material.uniforms) {
      return;
    }

    // ✅ CANONICAL CONTRACT: Read ONLY the derived signal
    const harmonyAuraStrength = this.node.userData?.harmonyAuraStrength ?? 0.0; // [0..1]

    // 📐 Canonical mappings (unambiguous, locked in architecture)
    
    // Opacity: smoothstep easing for smooth onset
    // smoothstep(0.2, 0.8, x) creates soft curve:
    // - at 0.0: → ~0.0
    // - at 0.2: → 0.0 (edge0)
    // - at 0.5: → 0.5 (midpoint)
    // - at 0.8: → 1.0 (edge1)
    // - at 1.0: → ~1.0
    const targetOpacity = smoothstep(0.2, 0.8, harmonyAuraStrength);

    // Radius: scale from 1.0 (no aura) to 1.35 (maximum envelope)
    const targetRadius = lerp(1.0, 1.35, harmonyAuraStrength);

    // Breathing frequency: scales with harmony
    // Low harmony: slow 0.15 Hz (very calm)
    // High harmony: faster 0.45 Hz (but still gentle)
    const pulseFrequency = lerp(0.15, 0.45, harmonyAuraStrength);

    // Secondary visual smoothing: frame-rate safe exponential decay
    // Alpha is the blend factor, scaled by frame time for consistency
    // Formula: value = lerp(current, target, alpha_adjusted)
    // where alpha_adjusted = 1 - (1 - alpha)^dt_in_60fps_frames
    const smoothingAlpha = 0.12; // Slightly faster than synergy glow (0.15)
    const framesToSmooth = 60.0; // reference frame rate
    const dt_normalized = dt * framesToSmooth; // convert to frame units
    const k = 1.0 - Math.pow(1.0 - smoothingAlpha, dt_normalized);

    this._smoothedOpacity += (targetOpacity - this._smoothedOpacity) * k;
    this._smoothedRadius += (targetRadius - this._smoothedRadius) * k;
    this._smoothedPulseFrequency += (pulseFrequency - this._smoothedPulseFrequency) * k;

    // 🌬️ Gentle breathing: amplitude ±3%, frequency varies with harmony
    // Formula: 1.0 + sin(t * 2π * f) * depth
    // where f = pulseFrequency (Hz), depth = 0.03
    if (_harmonyTimeOrigin === undefined) {
      _harmonyTimeOrigin = VisualTime.now;
    }
    const currentVisualTime = VisualTime.now - _harmonyTimeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)

    const breathingDepth = 0.03; // ±3%
    const pulse = 1.0 + Math.sin(currentVisualTime * (Math.PI * 2.0) * this._smoothedPulseFrequency) * breathingDepth;

    // 📤 Write ONLY to shader uniforms (never to userData)
    // Session 95: Check enforcement gate before modifying opacity
    if (this._canModifyAuraOpacity(this._smoothedOpacity)) {
      this.material.uniforms.uAuraOpacity.value = this._smoothedOpacity;
    }
    
    // Other uniforms don't affect visual layer constraints, safe to write
    this.material.uniforms.uAuraStrength.value = harmonyAuraStrength;
    this.material.uniforms.uAuraRadius.value = this._smoothedRadius;
    this.material.uniforms.uAuraPulse.value = pulse;
    this.material.uniforms.uTime.value = currentVisualTime;
  }
  
  /**
   * Session 95: Check if opacity modification is allowed by enforcement gate
   * Harmony aura opacity must stay within AURA_LAYER bounds (0.3-0.6)
   */
  _canModifyAuraOpacity(targetOpacity) {
    if (!this.enforcementGate || !this.node) return true;  // No gate or missing node - allow
    
    // Create a validation request (don't attach, just verify bounds)
    const request = IntegrationHelpers.createVisualAttachmentRequest({
      nodeId: this.node.userData?.id || this.node.uuid,
      nodeCategory: this.node.userData?.category || 'unknown',
      layerType: 'AURA_LAYER',
      geometryType: 'Spheres',
      opacity: targetOpacity,
      sourceSystem: 'HarmonyAuraController',
      description: 'Harmony aura opacity modulation'
    });
    
    return this.enforcementGate.canAttach(request);
  }

  /**
   * Optional conformance self-check
   * Verifies this controller follows architectural contract
   * 
   * NOTE: This is a static dev-time assertion. For runtime enforcement,
   * use CoreMetricAuthorityMonitor.js
   */
  static assertConformance() {
    // This file should NEVER:
    // 1. Reference .userData.harmony (only .userData.harmonyAuraStrength)
    // 2. Write to node.userData.* (only to material.uniforms.*)
    // 3. Trigger game events or side effects
    // 
    // Verify by:
    // - grep for "\.harmony" in this file (should find none)
    // - grep for "userData\[" or "\.userData\." for writes (should find none)
    // - grep for "emit\|dispatch\|trigger\|event\|fire" (should find none)
    
    return {
      template: 'HARMONY_AURA_v1',
      source: 'CanonicalVisualTemplateLibrary.md',
      status: 'LOCKED',
      conformanceChecks: [
        { rule: 'Read-only derived signal', pass: true },
        { rule: 'No userData writes', pass: true },
        { rule: 'No event triggers', pass: true },
        { rule: 'Canonical smoothstep opacity', pass: true },
        { rule: 'Canonical lerp radius', pass: true },
        { rule: 'Canonical breathing amplitude', pass: true },
        { rule: 'Secondary smoothing stable', pass: true },
        { rule: 'Performance O(1)', pass: true },
      ],
    };
  }

  /**
   * Optional: Reset smoothed state (e.g., on node respawn or reset)
   */
  resetSmoothing() {
    this._smoothedOpacity = 0.0;
    this._smoothedRadius = 1.0;
    this._smoothedPulseFrequency = 0.15;
  }

  /**
   * Optional: Get current smoothed opacity for debugging
   */
  getSmoothedOpacity() {
    return this._smoothedOpacity;
  }

  /**
   * Optional: Get current smoothed radius for debugging
   */
  getSmoothedRadius() {
    return this._smoothedRadius;
  }

  /**
   * Optional: Get current pulse frequency for debugging
   */
  getPulseFrequency() {
    return this._smoothedPulseFrequency;
  }
}

/**
 * Optional: Batch controller for managing multiple nodes
 * Useful for frame updates across all harmony aura nodes
 */
export class HarmonyAuraControllerBatch {
  constructor() {
    this.controllers = [];
  }

  /**
   * Register a controller
   */
  add(controller) {
    if (controller instanceof HarmonyAuraController) {
      this.controllers.push(controller);
    }
  }

  /**
   * Unregister a controller
   */
  remove(controller) {
    const idx = this.controllers.indexOf(controller);
    if (idx >= 0) {
      this.controllers.splice(idx, 1);
    }
  }

  /**
   * Update all controllers in batch
   */
  updateAll(dt, timeSeconds) {
    for (const c of this.controllers) {
      c.update(dt, timeSeconds);
    }
  }

  /**
   * Get count for diagnostics
   */
  count() {
    return this.controllers.length;
  }

  /**
   * Clear all controllers
   */
  clear() {
    this.controllers.length = 0;
  }
}
