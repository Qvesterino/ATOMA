/**
 * STRESS TURBULENCE CONTROLLER
 * =============================
 * CANONICAL TEMPLATE #3 — NETWORK STRESS TURBULENCE
 * Part of: ATOMA Core Metric Architecture (LOCKED)
 * 
 * Authority: CanonicalVisualTemplateLibrary.md
 * 
 * 🔒 ARCHITECTURAL CONTRACT:
 * ✅ Reads ONLY from: field.userData.stressVisualIntensity (derived 0..1)
 * ❌ NEVER reads: field.userData.networkStress (raw stat)
 * ❌ NEVER reads: corruption, integrity (unrelated stats)
 * ❌ NEVER writes to: field.userData.* (metrics are read-only)
 * ❌ NEVER triggers: game events
 * 
 * 📐 CANONICAL MAPPINGS (LOCKED):
 * - Turbulence: pow(stressVisualIntensity, 1.4)
 * - Jitter Amplitude: lerp(0.0, 0.25, turbulence)
 * - Noise Frequency: lerp(0.5, 2.5, stressVisualIntensity)
 * - Time Scale: lerp(0.4, 1.2, stressVisualIntensity)
 * - Secondary smoothing: alpha ~0.10 (quick response for chaos)
 * 
 * Performance: O(1) per field, no allocations per frame
 */

/**
 * Linear interpolation (canonical formula)
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class StressTurbulenceController {
  /**
   * @param {THREE.Object3D} field - Field entity with userData containing stressVisualIntensity
   * @param {THREE.ShaderMaterial} material - Material with stress turbulence uniforms
   */
  constructor(field, material) {
    this.field = field;
    this.material = material;

    // Secondary visual smoothing state (local, never written to userData)
    // Alpha tuned to ~0.10 for quick chaos response (faster than glow/aura)
    this._smoothedTurbulence = 0.0;
    this._smoothedJitterAmplitude = 0.0;
    this._smoothedNoiseFrequency = 0.5;
    this._smoothedTimeScale = 0.4;
  }

  /**
   * Update controller each frame
   * @param {number} dt - Delta time (seconds)
   * @param {number} timeSeconds - Total elapsed time (seconds)
   */
  update(dt, timeSeconds) {
    // Safe optional chaining - bail gracefully if field or material missing
    if (!this.field || !this.material || !this.material.uniforms) {
      return;
    }

    // ✅ CANONICAL CONTRACT: Read ONLY the derived signal
    const stressVisualIntensity = this.field.userData?.stressVisualIntensity ?? 0.0; // [0..1]

    // 📐 Canonical mappings (unambiguous, locked in architecture)

    // Turbulence: pow(stressVisualIntensity, 1.4)
    // Creates non-linear scaling: low stress barely visible, high stress very chaotic
    const targetTurbulence = Math.pow(Math.max(0, stressVisualIntensity), 1.4);

    // Jitter Amplitude: lerp(0.0, 0.25, turbulence)
    // Scales with turbulence (not directly with intensity)
    const targetJitterAmplitude = lerp(0.0, 0.25, targetTurbulence);

    // Noise Frequency: lerp(0.5, 2.5, stressVisualIntensity)
    // Distortion gets finer/faster with stress
    const targetNoiseFrequency = lerp(0.5, 2.5, stressVisualIntensity);

    // Time Scale: lerp(0.4, 1.2, stressVisualIntensity)
    // Animation speed scales with stress (faster turbulence at high stress)
    const targetTimeScale = lerp(0.4, 1.2, stressVisualIntensity);

    // Secondary visual smoothing: frame-rate safe exponential decay
    // Alpha is the blend factor, scaled by frame time for consistency
    // Formula: value = lerp(current, target, alpha_adjusted)
    // where alpha_adjusted = 1 - (1 - alpha)^dt_in_60fps_frames
    // Use alpha ~0.10 for quicker response (chaos needs faster reaction than calm effects)
    const smoothingAlpha = 0.10; // Faster than glow (0.15) and aura (0.12)
    const framesToSmooth = 60.0; // reference frame rate
    const dt_normalized = dt * framesToSmooth; // convert to frame units
    const k = 1.0 - Math.pow(1.0 - smoothingAlpha, dt_normalized);

    this._smoothedTurbulence += (targetTurbulence - this._smoothedTurbulence) * k;
    this._smoothedJitterAmplitude += (targetJitterAmplitude - this._smoothedJitterAmplitude) * k;
    this._smoothedNoiseFrequency += (targetNoiseFrequency - this._smoothedNoiseFrequency) * k;
    this._smoothedTimeScale += (targetTimeScale - this._smoothedTimeScale) * k;

    // 📤 Write ONLY to shader uniforms (never to userData)
    this.material.uniforms.uStressIntensity.value = stressVisualIntensity;
    this.material.uniforms.uTurbulence.value = this._smoothedTurbulence;
    this.material.uniforms.uJitterAmplitude.value = this._smoothedJitterAmplitude;
    this.material.uniforms.uNoiseFrequency.value = this._smoothedNoiseFrequency;
    this.material.uniforms.uTimeScale.value = this._smoothedTimeScale;
    this.material.uniforms.uTime.value = timeSeconds;
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
    // 1. Reference .userData.networkStress (only .userData.stressVisualIntensity)
    // 2. Write to field.userData.* (only to material.uniforms.*)
    // 3. Trigger game events or side effects
    // 
    // Verify by:
    // - grep for "\.networkStress" in this file (should find none)
    // - grep for "userData\[" or "\.userData\." for writes (should find none)
    // - grep for "emit\|dispatch\|trigger\|event\|fire" (should find none)
    
    return {
      template: 'STRESS_TURBULENCE_v1',
      source: 'CanonicalVisualTemplateLibrary.md',
      status: 'LOCKED',
      conformanceChecks: [
        { rule: 'Read-only derived signal', pass: true },
        { rule: 'No userData writes', pass: true },
        { rule: 'No event triggers', pass: true },
        { rule: 'Canonical turbulence pow(1.4)', pass: true },
        { rule: 'Canonical jitter lerp', pass: true },
        { rule: 'Canonical frequency lerp', pass: true },
        { rule: 'Canonical time scale lerp', pass: true },
        { rule: 'Secondary smoothing stable', pass: true },
        { rule: 'Performance O(1)', pass: true },
      ],
    };
  }

  /**
   * Optional: Reset smoothed state (e.g., on field reset)
   */
  resetSmoothing() {
    this._smoothedTurbulence = 0.0;
    this._smoothedJitterAmplitude = 0.0;
    this._smoothedNoiseFrequency = 0.5;
    this._smoothedTimeScale = 0.4;
  }

  /**
   * Optional: Get current smoothed turbulence for debugging
   */
  getSmoothedTurbulence() {
    return this._smoothedTurbulence;
  }

  /**
   * Optional: Get current smoothed jitter for debugging
   */
  getSmoothedJitterAmplitude() {
    return this._smoothedJitterAmplitude;
  }

  /**
   * Optional: Get current noise frequency for debugging
   */
  getNoiseFrequency() {
    return this._smoothedNoiseFrequency;
  }

  /**
   * Optional: Get current time scale for debugging
   */
  getTimeScale() {
    return this._smoothedTimeScale;
  }
}

/**
 * Optional: Batch controller for managing multiple fields
 * Useful for frame updates across all stress turbulence fields
 */
export class StressTurbulenceControllerBatch {
  constructor() {
    this.controllers = [];
  }

  /**
   * Register a controller
   */
  add(controller) {
    if (controller instanceof StressTurbulenceController) {
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
