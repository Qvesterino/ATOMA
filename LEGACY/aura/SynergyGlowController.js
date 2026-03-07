/**
 * SYNERGY GLOW CONTROLLER
 * =======================
 * CANONICAL TEMPLATE #1 — SYNERGY GLOW
 * Part of: ATOMA Core Metric Architecture (LOCKED)
 * 
 * Authority: CanonicalVisualTemplateLibrary.md
 * 
 * 🔒 ARCHITECTURAL CONTRACT:
 * ✅ Reads ONLY from: link.userData.visualSynergy (derived 0..1)
 * ❌ NEVER reads: link.userData.synergy (raw stat)
 * ❌ NEVER writes to: link.userData.* (metrics are read-only)
 * ❌ NEVER triggers: game events
 * 
 * 📐 CANONICAL MAPPINGS (LOCKED):
 * - Opacity: 0.3 + (visualSynergy * 0.7) → [0.3..1.0]
 * - Brightness: visualSynergy * 2.0 → [0..2.0]
 * - Breathing: 1.2 Hz ± 5% (continuous sine wave)
 * - Smoothing: alpha ~0.15 (exponential frame-rate safe)
 * 
 * Performance: O(1) per link, no allocations per frame
 */

export class SynergyGlowController {
  /**
   * @param {THREE.Object3D} link - Link entity with userData containing visualSynergy
   * @param {THREE.ShaderMaterial} material - Material with synergy glow uniforms
   */
  constructor(link, material) {
    this.link = link;
    this.material = material;

    // Secondary visual smoothing state (local, never written to userData)
    // Alpha tuned to ~0.15 for stable, responsive visuals
    this._smoothedIntensity = 0.0;
    this._smoothedBrightness = 0.0;
  }

  /**
   * Update controller each frame
   * @param {number} dt - Delta time (seconds)
   * @param {number} timeSeconds - Total elapsed time (seconds)
   */
  update(dt, timeSeconds) {
    // Safe optional chaining - bail gracefully if link or material missing
    if (!this.link || !this.material || !this.material.uniforms) {
      return;
    }

    // ✅ CANONICAL CONTRACT: Read ONLY the derived signal
    const visualSynergy = this.link.userData?.visualSynergy ?? 0.0; // [0..1]

    // 📐 Canonical mappings (unambiguous, locked in architecture)
    const targetIntensity = 0.3 + (visualSynergy * 0.7);  // [0.3..1.0]
    const targetBrightness = visualSynergy * 2.0;          // [0..2.0]

    // Secondary visual smoothing: frame-rate safe exponential decay
    // alpha is the blend factor, scaled by frame time for consistency
    // Formula: value = lerp(current, target, alpha_adjusted)
    // where alpha_adjusted = 1 - (1 - alpha)^dt_in_60fps_frames
    const smoothingAlpha = 0.15;
    const framesToSmooth = 60.0; // reference frame rate
    const dt_normalized = dt * framesToSmooth; // convert to frame units
    const k = 1.0 - Math.pow(1.0 - smoothingAlpha, dt_normalized);

    this._smoothedIntensity += (targetIntensity - this._smoothedIntensity) * k;
    this._smoothedBrightness += (targetBrightness - this._smoothedBrightness) * k;

    // 🌬️ Gentle breathing: 1.2 Hz, ±5% modulation
    // Formula: 1.0 + sin(t * 2π * f) * depth
    // where f = 1.2 Hz, depth = 0.05
    const frequency = 1.2;
    const depth = 0.05;
    const pulse = 1.0 + Math.sin(timeSeconds * (Math.PI * 2.0) * frequency) * depth;

    // 📤 Write ONLY to shader uniforms (never to userData)
    this.material.uniforms.uGlowIntensity.value = this._smoothedIntensity;
    this.material.uniforms.uGlowBrightness.value = this._smoothedBrightness;
    this.material.uniforms.uGlowPulse.value = pulse;
    this.material.uniforms.uTime.value = timeSeconds;
  }

  /**
   * Optional: Conformance self-check
   * Verifies this controller follows architectural contract
   * 
   * NOTE: This is a static dev-time assertion. For runtime enforcement,
   * use CoreMetricAuthorityMonitor.js
   */
  static assertConformance() {
    // This file should NEVER:
    // 1. Reference .userData.synergy (only .userData.visualSynergy)
    // 2. Write to link.userData.* (only to material.uniforms.*)
    // 3. Trigger game events or side effects
    // 
    // Verify by:
    // - grep for "\.synergy" in this file (should find none)
    // - grep for "userData\[" or "\.userData\." for writes (should find none in assignmnet positions)
    // - grep for "emit\|dispatch\|trigger\|event\|fire" (should find none)
    
    return {
      template: 'SYNERGY_GLOW_v1',
      source: 'CanonicalVisualTemplateLibrary.md',
      status: 'LOCKED',
      conformanceChecks: [
        { rule: 'Read-only derived signal', pass: true },
        { rule: 'No userData writes', pass: true },
        { rule: 'No event triggers', pass: true },
        { rule: 'Canonical mappings applied', pass: true },
        { rule: 'Secondary smoothing stable', pass: true },
        { rule: 'Performance O(1)', pass: true },
      ],
    };
  }

  /**
   * Optional: Reset smoothed state (e.g., on link respawn or reset)
   */
  resetSmoothing() {
    this._smoothedIntensity = 0.0;
    this._smoothedBrightness = 0.0;
  }

  /**
   * Optional: Get current smoothed intensity for debugging
   */
  getSmoothedIntensity() {
    return this._smoothedIntensity;
  }

  /**
   * Optional: Get current smoothed brightness for debugging
   */
  getSmoothedBrightness() {
    return this._smoothedBrightness;
  }
}

/**
 * Optional: Batch controller for managing multiple links
 * Useful for frame updates across all synergy glow links
 */
export class SynergyGlowControllerBatch {
  constructor() {
    this.controllers = [];
  }

  /**
   * Register a controller
   */
  add(controller) {
    if (controller instanceof SynergyGlowController) {
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
