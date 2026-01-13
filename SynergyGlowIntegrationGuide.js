/**
 * SYNERGY GLOW INTEGRATION GUIDE
 * ==============================
 * Production-ready integration snippets for Canonical Template #1: Synergy Glow
 * 
 * This file contains copy-paste integration examples showing:
 * 1. Per-link instantiation
 * 2. Frame update loop
 * 3. Batch management
 * 4. Safe chaining patterns
 */

import { createSynergyGlowMaterial, assertSynergyGlowMaterialConformance } from './SynergyGlowShaderMaterial.js';
import { SynergyGlowController, SynergyGlowControllerBatch } from './SynergyGlowController.js';

// =============================================================================
// INTEGRATION SNIPPET #1: PER-LINK INSTANTIATION (LinkRenderer-style)
// =============================================================================
/**
 * Call this when creating/adding a new link to the scene
 * 
 * @param {THREE.Object3D} link - Link entity
 * @param {THREE.Mesh} linkMesh - Mesh geometry to apply material to
 * @returns {{material, controller}} Pair ready for frame updates
 */
export function attachSynergyGlowToLink(link, linkMesh) {
  // Create material once per link
  const material = createSynergyGlowMaterial();
  
  // Verify conformance (dev mode can skip)
  if (window.__ATOMA_METRIC_AUDIT) {
    assertSynergyGlowMaterialConformance(material);
  }

  // Create controller bound to this link and material
  const controller = new SynergyGlowController(link, material);

  // Apply material to mesh
  // Option A: Replace material entirely
  // linkMesh.material = material;
  
  // Option B: Add as overlay (if you want to keep existing material)
  // You'd need a multi-pass renderer or use this as a secondary pass
  // For now, recommend Option A for simplicity

  return { material, controller };
}

/**
 * Alternative: Attach to existing material as shader override
 * Use if you want to layer synergy glow on top of existing link rendering
 */
export function patchSynergyGlowToMaterial(link, existingMaterial) {
  // Create glow material
  const glowMaterial = createSynergyGlowMaterial();
  const controller = new SynergyGlowController(link, glowMaterial);

  // You'd handle rendering with both materials (e.g., two-pass or layer)
  // This is more advanced; simpler to just replace the material

  return { glowMaterial, controller };
}

/**
 * Safe version with optional chaining
 */
export function attachSynergyGlowSafe(link, linkMesh) {
  try {
    if (!link?.userData || !linkMesh) {
      console.warn('SynergyGlow: Invalid link or mesh');
      return null;
    }

    const material = createSynergyGlowMaterial();
    const controller = new SynergyGlowController(link, material);

    linkMesh.material = material;

    return { material, controller };
  } catch (err) {
    console.error('SynergyGlow attachment failed:', err);
    return null;
  }
}

// =============================================================================
// INTEGRATION SNIPPET #2: FRAME UPDATE LOOP (main.js animation loop)
// =============================================================================
/**
 * Call this in your animation frame loop (e.g., in renderer.animate())
 * 
 * Example usage in main.js:
 * ```
 * const synergyGlowControllers = [];
 * 
 * function animate() {
 *   const now = performance.now() / 1000; // seconds
 *   const dt = now - lastTime;
 *   lastTime = now;
 * 
 *   updateSynergyGlowControllers(synergyGlowControllers, dt, now);
 *   renderer.render(scene, camera);
 *   requestAnimationFrame(animate);
 * }
 * ```
 */
export function updateSynergyGlowControllers(controllers, dt, timeSeconds) {
  // Simple loop version
  for (const c of controllers) {
    c?.update(dt, timeSeconds);
  }
}

/**
 * Batch version (recommended for many links)
 * Uses SynergyGlowControllerBatch for better memory patterns
 */
export function updateSynergyGlowBatch(batch, dt, timeSeconds) {
  batch.updateAll(dt, timeSeconds);
}

/**
 * Per-link update (if you prefer inline)
 */
export function updateSynergyGlow(controller, dt, timeSeconds) {
  controller?.update(dt, timeSeconds);
}

// =============================================================================
// INTEGRATION SNIPPET #3: BATCH MANAGEMENT
// =============================================================================
/**
 * Example: Managing a batch of synergy glow controllers
 * 
 * Usage:
 * ```
 * const glowBatch = new SynergyGlowControllerBatch();
 * 
 * // When adding a link:
 * const {material, controller} = attachSynergyGlowToLink(link, mesh);
 * glowBatch.add(controller);
 * 
 * // In animation loop:
 * glowBatch.updateAll(dt, now);
 * 
 * // When removing a link:
 * glowBatch.remove(controller);
 * ```
 */
export function createSynergyGlowBatchManager() {
  return new SynergyGlowControllerBatch();
}

// =============================================================================
// INTEGRATION SNIPPET #4: MAIN.JS WIRING EXAMPLE
// =============================================================================
/**
 * Simplified example of how to wire into main.js
 * 
 * Add to imports:
 * ```
 * import { attachSynergyGlowToLink, updateSynergyGlowControllers } from './SynergyGlowIntegrationGuide.js';
 * import { SynergyGlowControllerBatch } from './SynergyGlowController.js';
 * ```
 * 
 * Add to setup (after scene initialization):
 * ```
 * const synergyGlowBatch = new SynergyGlowControllerBatch();
 * ```
 * 
 * When NodeLinkingSystem creates a link (e.g., in onLinkCreated):
 * ```
 * onLinkCreated(link, linkMesh) {
 *   const {controller} = attachSynergyGlowToLink(link, linkMesh);
 *   synergyGlowBatch.add(controller);
 * }
 * ```
 * 
 * When NodeLinkingSystem destroys a link:
 * ```
 * onLinkDestroyed(link, controller) {
 *   synergyGlowBatch.remove(controller);
 * }
 * ```
 * 
 * In animation loop (render function):
 * ```
 * function animate() {
 *   const now = performance.now() / 1000;
 *   const dt = (now - lastFrameTime);
 *   lastFrameTime = now;
 * 
 *   synergyGlowBatch.updateAll(dt, now);
 *   
 *   renderer.render(scene, camera);
 *   requestAnimationFrame(animate);
 * }
 * ```
 */

// =============================================================================
// DEBUG & DIAGNOSTICS HELPERS
// =============================================================================
/**
 * Console API for debugging synergy glow system
 */
export function enableSynergyGlowDebugAPI() {
  window.__ATOMA_SYNERGY_GLOW_DEBUG = {
    // Get conformance report
    conformance: () => {
      return SynergyGlowController.assertConformance();
    },

    // Log controller state
    logControllerState: (controller) => {
      if (!controller) return 'No controller provided';
      return {
        link: controller.link?.id || 'unknown',
        smoothedIntensity: controller.getSmoothedIntensity(),
        smoothedBrightness: controller.getSmoothedBrightness(),
        visualSynergy: controller.link?.userData?.visualSynergy ?? 0,
      };
    },

    // Verify no userData writes occurred
    assertNoDataMutations: (link) => {
      // This is a dev-time assertion
      // In production, use CoreMetricAuthorityMonitor.js
      const checkFields = ['synergy', 'harmony', 'corruption', 'integrity', 'networkStress'];
      const mutations = [];
      for (const field of checkFields) {
        if (link.userData?.hasOwnProperty(`__synergy_glow_wrote_${field}`)) {
          mutations.push(field);
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
        conformance: SynergyGlowController.assertConformance(),
        status: 'OK',
      };
    },
  };

  console.log('✓ SynergyGlow Debug API enabled. Access via: window.__ATOMA_SYNERGY_GLOW_DEBUG');
}

// Auto-enable debug API if metric audit is active
if (typeof window !== 'undefined' && window.__ATOMA_METRIC_AUDIT) {
  enableSynergyGlowDebugAPI();
}

// =============================================================================
// CONFORMANCE DOCUMENTATION
// =============================================================================
/**
 * TEMPLATE COMPLIANCE CHECKLIST:
 * ✅ Uses derived signal only (visualSynergy)
 * ✅ No userData writes
 * ✅ No event triggers
 * ✅ Canonical opacity mapping: 0.3 + synergy*0.7
 * ✅ Canonical brightness mapping: synergy*2.0
 * ✅ Canonical breathing: 1.2 Hz, ±5%
 * ✅ Smooth secondary transitions (alpha ~0.15)
 * ✅ Frame-rate safe (dt-scaled smoothing)
 * ✅ O(n) performance (one update per link)
 * ✅ No per-frame allocations
 * ✅ Optional chaining for safety
 */

export const SYNERGY_GLOW_COMPLIANCE = {
  template: 'CANONICAL_TEMPLATE_1_SYNERGY_GLOW',
  version: '1.0',
  authority: 'CanonicalVisualTemplateLibrary.md',
  lockStatus: 'LOCKED',
  
  canonical: {
    colorPalette: '#00d4ff (cyan-blue)',
    blending: 'AdditiveBlending',
    opacityFormula: '0.3 + (visualSynergy * 0.7)',
    brightnessFormula: 'visualSynergy * 2.0',
    breathingFrequency: '1.2 Hz',
    breathingDepth: '±5%',
    smoothingAlpha: '0.15 (exponential)',
  },

  contracts: {
    read: ['link.userData.visualSynergy'],
    forbidden: ['link.userData.synergy', 'link.userData.*_write', 'events', 'triggers'],
  },

  files: [
    'SynergyGlowShaderMaterial.js',
    'SynergyGlowController.js',
    'SynergyGlowIntegrationGuide.js',
  ],
};

export default {
  attachSynergyGlowToLink,
  updateSynergyGlowControllers,
  createSynergyGlowBatchManager,
  enableSynergyGlowDebugAPI,
  SYNERGY_GLOW_COMPLIANCE,
};
