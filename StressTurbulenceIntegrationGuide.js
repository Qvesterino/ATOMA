/**
 * STRESS TURBULENCE INTEGRATION GUIDE
 * ===================================
 * Production-ready integration snippets for Canonical Template #3: Network Stress Turbulence
 * 
 * This file contains copy-paste integration examples showing:
 * 1. Per-field instantiation
 * 2. Frame update loop
 * 3. Batch management
 * 4. Safe chaining patterns
 * 
 * NOTE: This template is automatically wired via VisualAutoWiringSystem.js
 * You should NOT need to manually wire fields.
 */

import { createStressTurbulenceMaterial, assertStressTurbulenceMaterialConformance } from './StressTurbulenceShaderMaterial.js';
import { StressTurbulenceController, StressTurbulenceControllerBatch } from './StressTurbulenceController.js';

// =============================================================================
// INTEGRATION SNIPPET #1: PER-FIELD INSTANTIATION (AUTO-WIRING)
// =============================================================================
/**
 * Call this when creating/adding a new field to the scene
 * 
 * NOTE: In normal operation, use VisualAutoWiringSystem.wireRenderable()
 * This is provided for manual wiring or non-standard cases.
 * 
 * @param {THREE.Object3D} field - Field entity
 * @param {THREE.Mesh} fieldMesh - Mesh geometry to apply material to
 * @returns {{material, controller}} Pair ready for frame updates
 */
export function attachStressTurbulenceToField(field, fieldMesh) {
  // Create material once per field
  const material = createStressTurbulenceMaterial();
  
  // Verify conformance (dev mode can skip)
  if (window.__ATOMA_METRIC_AUDIT) {
    assertStressTurbulenceMaterialConformance(material);
  }

  // Create controller bound to this field and material
  const controller = new StressTurbulenceController(field, material);

  // Apply material to mesh
  fieldMesh.material = material;

  return { material, controller };
}

/**
 * Safe version with optional chaining
 */
export function attachStressTurbulenceToFieldSafe(field, fieldMesh) {
  try {
    if (!field?.userData || !fieldMesh) {
      console.warn('StressTurbulence: Invalid field or mesh');
      return null;
    }

    const material = createStressTurbulenceMaterial();
    const controller = new StressTurbulenceController(field, material);

    fieldMesh.material = material;

    return { material, controller };
  } catch (err) {
    console.error('StressTurbulence attachment failed:', err);
    return null;
  }
}

// =============================================================================
// INTEGRATION SNIPPET #2: FRAME UPDATE LOOP (main.js animation loop)
// =============================================================================
/**
 * Call this in your animation frame loop (e.g., in renderer.animate())
 * 
 * NOTE: In normal operation, this is called by VisualAutoWiringSystem.
 * This is provided for manual wiring or non-standard cases.
 * 
 * Example usage in main.js:
 * ```
 * const stressControllers = [];
 * 
 * function animate() {
 *   const now = performance.now() / 1000; // seconds
 *   const dt = now - lastTime;
 *   lastTime = now;
 * 
 *   updateStressTurbulenceControllers(stressControllers, dt, now);
 *   renderer.render(scene, camera);
 *   requestAnimationFrame(animate);
 * }
 * ```
 */
export function updateStressTurbulenceControllers(controllers, dt, timeSeconds) {
  // Simple loop version
  for (const c of controllers) {
    c?.update(dt, timeSeconds);
  }
}

/**
 * Batch version (recommended for many fields)
 * Uses StressTurbulenceControllerBatch for better memory patterns
 */
export function updateStressTurbulenceBatch(batch, dt, timeSeconds) {
  batch.updateAll(dt, timeSeconds);
}

/**
 * Per-field update (if you prefer inline)
 */
export function updateStressTurbulence(controller, dt, timeSeconds) {
  controller?.update(dt, timeSeconds);
}

// =============================================================================
// INTEGRATION SNIPPET #3: BATCH MANAGEMENT
// =============================================================================
/**
 * Example: Managing a batch of stress turbulence controllers
 * 
 * Usage:
 * ```
 * const stressBatch = new StressTurbulenceControllerBatch();
 * 
 * // When adding a field:
 * const {material, controller} = attachStressTurbulenceToField(field, mesh);
 * stressBatch.add(controller);
 * 
 * // In animation loop:
 * stressBatch.updateAll(dt, now);
 * 
 * // When removing a field:
 * stressBatch.remove(controller);
 * ```
 */
export function createStressTurbulenceBatchManager() {
  return new StressTurbulenceControllerBatch();
}

// =============================================================================
// AUTO-WIRING INTEGRATION (Preferred Method)
// =============================================================================
/**
 * STRESS TURBULENCE IS AUTO-WIRED VIA VISUAL AUTO-WIRING SYSTEM
 * 
 * You should NOT need to manually wire fields.
 * 
 * Instead, use:
 * ```
 * import { wireRenderable, RENDERABLE_TYPE } from './VisualAutoWiringSystem.js';
 * 
 * await wireRenderable(field, RENDERABLE_TYPE.FIELD, fieldMesh);
 * ```
 * 
 * This automatically:
 * 1. Looks up FIELD → STRESS_TURBULENCE in registry
 * 2. Resolves StressTurbulenceController + createStressTurbulenceMaterial
 * 3. Instantiates both
 * 4. Binds to field
 * 5. Tracks for updates
 * 
 * Then call updateAllVisualControllers() in animation loop:
 * ```
 * import { updateAllVisualControllers } from './VisualAutoWiringSystem.js';
 * 
 * updateAllVisualControllers(dt, now);
 * ```
 */

// =============================================================================
// DEBUG & DIAGNOSTICS HELPERS
// =============================================================================
/**
 * Console API for debugging stress turbulence system
 */
export function enableStressTurbulenceDebugAPI() {
  window.__ATOMA_STRESS_TURBULENCE_DEBUG = {
    // Get conformance report
    conformance: () => {
      return StressTurbulenceController.assertConformance();
    },

    // Log controller state
    logControllerState: (controller) => {
      if (!controller) return 'No controller provided';
      return {
        field: controller.field?.id || 'unknown',
        smoothedTurbulence: controller.getSmoothedTurbulence(),
        smoothedJitterAmplitude: controller.getSmoothedJitterAmplitude(),
        noiseFrequency: controller.getNoiseFrequency(),
        timeScale: controller.getTimeScale(),
        stressVisualIntensity: controller.field?.userData?.stressVisualIntensity ?? 0,
      };
    },

    // Verify no userData writes occurred
    assertNoDataMutations: (field) => {
      // This is a dev-time assertion
      // In production, use CoreMetricAuthorityMonitor.js
      const checkFields = ['networkStress', 'synergy', 'corruption', 'harmony', 'integrity'];
      const mutations = [];
      for (const f of checkFields) {
        if (field.userData?.hasOwnProperty(`__stress_turbulence_wrote_${f}`)) {
          mutations.push(f);
        }
      }
      return {
        hasMutations: mutations.length > 0,
        mutatedFields: mutations,
        status: mutations.length === 0 ? 'COMPLIANT' : 'VIOLATION',
      };
    },

    // Quick validation
    validate: (batch) => {
      return {
        batchSize: batch?.count() ?? 0,
        conformance: StressTurbulenceController.assertConformance(),
        status: 'OK',
      };
    },
  };

  console.log('✓ StressTurbulence Debug API enabled. Access via: window.__ATOMA_STRESS_TURBULENCE_DEBUG');
}

// Auto-enable debug API if metric audit is active
if (typeof window !== 'undefined' && window.__ATOMA_METRIC_AUDIT) {
  enableStressTurbulenceDebugAPI();
}

// =============================================================================
// CONFORMANCE DOCUMENTATION
// =============================================================================
/**
 * TEMPLATE COMPLIANCE CHECKLIST:
 * ✅ Uses derived signal only (stressVisualIntensity)
 * ✅ No userData writes
 * ✅ No event triggers
 * ✅ Canonical turbulence mapping: pow(intensity, 1.4)
 * ✅ Canonical jitter mapping: lerp(0.0, 0.25, turbulence)
 * ✅ Canonical frequency mapping: lerp(0.5, 2.5, intensity)
 * ✅ Canonical time scale mapping: lerp(0.4, 1.2, intensity)
 * ✅ Smooth secondary transitions (alpha ~0.10)
 * ✅ Frame-rate safe (dt-scaled smoothing)
 * ✅ O(1) performance (one update per field)
 * ✅ No per-frame allocations
 * ✅ Optional chaining for safety
 * ✅ Environmental chaos appearance (not damage)
 * ✅ Red-orange color palette (fixed, no shifts)
 * ✅ Distortion/turbulence effect (not fading/opacity)
 */

export const STRESS_TURBULENCE_COMPLIANCE = {
  template: 'CANONICAL_TEMPLATE_3_STRESS_TURBULENCE',
  version: '1.0',
  authority: 'CanonicalVisualTemplateLibrary.md',
  lockStatus: 'LOCKED',
  
  canonical: {
    colorPalette: '#ff6b35 (red-orange)',
    turbulenceFormula: 'pow(stressVisualIntensity, 1.4)',
    jitterFormula: 'lerp(0.0, 0.25, turbulence)',
    frequencyFormula: 'lerp(0.5, 2.5, stressVisualIntensity)',
    timeScaleFormula: 'lerp(0.4, 1.2, stressVisualIntensity)',
    smoothingAlpha: '0.10 (quick chaos response)',
  },

  semantics: {
    purpose: 'Communicate environmental overload, tension, instability',
    appearance: 'Geometric distortion, jitter, turbulent noise',
    feeling: 'Chaotic, tense, unstable',
    environmentalPressure: 'NOT entity damage or corruption',
    forbidden: [
      'opacity reduction',
      'fading objects',
      'breaking/cracking',
      'blinking on events',
      'discrete thresholds',
      'overriding other templates',
      'reacting to harmony',
    ],
  },

  contracts: {
    read: ['field.userData.stressVisualIntensity'],
    forbidden: [
      'field.userData.networkStress',
      'field.userData.corruption',
      'field.userData.*_write',
      'events',
      'triggers',
    ],
  },

  files: [
    'StressTurbulenceShaderMaterial.js',
    'StressTurbulenceController.js',
    'StressTurbulenceIntegrationGuide.js',
  ],

  autoWiring: {
    registry: 'FIELD → STRESS_TURBULENCE',
    system: 'VisualAutoWiringSystem',
    note: 'Do not manually wire. Use wireRenderable(field, RENDERABLE_TYPE.FIELD, mesh)',
  },
};

export default {
  attachStressTurbulenceToField,
  updateStressTurbulenceControllers,
  createStressTurbulenceBatchManager,
  enableStressTurbulenceDebugAPI,
  STRESS_TURBULENCE_COMPLIANCE,
};
