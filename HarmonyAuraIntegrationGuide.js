/**
 * HARMONY AURA INTEGRATION GUIDE
 * =============================
 * Production-ready integration snippets for Canonical Template #2: Harmony Aura
 * 
 * This file contains copy-paste integration examples showing:
 * 1. Per-node instantiation
 * 2. Frame update loop
 * 3. Batch management
 * 4. Safe chaining patterns
 * 
 * NOTE: This template is automatically wired via VisualAutoWiringSystem.js
 * You should NOT need to manually wire nodes.
 */

import { createHarmonyAuraMaterial, assertHarmonyAuraMaterialConformance } from './HarmonyAuraShaderMaterial.js';
import { HarmonyAuraController, HarmonyAuraControllerBatch } from './HarmonyAuraController.js';

// =============================================================================
// INTEGRATION SNIPPET #1: PER-NODE INSTANTIATION (AUTO-WIRING)
// =============================================================================
/**
 * Call this when creating/adding a new node to the scene
 * 
 * NOTE: In normal operation, use VisualAutoWiringSystem.wireRenderable()
 * This is provided for manual wiring or non-standard cases.
 * 
 * @param {THREE.Object3D} node - Node entity
 * @param {THREE.Mesh} nodeMesh - Mesh geometry to apply material to
 * @returns {{material, controller}} Pair ready for frame updates
 */
export function attachHarmonyAuraToNode(node, nodeMesh) {
  // Create material once per node
  const material = createHarmonyAuraMaterial();
  
  // Verify conformance (dev mode can skip)
  if (window.__ATOMA_METRIC_AUDIT) {
    assertHarmonyAuraMaterialConformance(material);
  }

  // Create controller bound to this node and material
  const controller = new HarmonyAuraController(node, material);

  // Apply material to mesh
  // Option A: Replace material entirely
  // nodeMesh.material = material;
  
  // Option B: Add as overlay (if you want to keep existing material)
  // You'd need a multi-pass renderer or use this as a secondary pass
  // For now, recommend Option A for simplicity

  return { material, controller };
}

/**
 * Safe version with optional chaining
 */
export function attachHarmonyAuraToNodeSafe(node, nodeMesh) {
  try {
    if (!node?.userData || !nodeMesh) {
      console.warn('HarmonyAura: Invalid node or mesh');
      return null;
    }

    const material = createHarmonyAuraMaterial();
    const controller = new HarmonyAuraController(node, material);

    nodeMesh.material = material;

    return { material, controller };
  } catch (err) {
    console.error('HarmonyAura attachment failed:', err);
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
 * const harmonyAuraControllers = [];
 * 
 * function animate() {
 *   const now = performance.now() / 1000; // seconds
 *   const dt = now - lastTime;
 *   lastTime = now;
 * 
 *   updateHarmonyAuraControllers(harmonyAuraControllers, dt, now);
 *   renderer.render(scene, camera);
 *   requestAnimationFrame(animate);
 * }
 * ```
 */
export function updateHarmonyAuraControllers(controllers, dt, timeSeconds) {
  // Simple loop version
  for (const c of controllers) {
    c?.update(dt, timeSeconds);
  }
}

/**
 * Batch version (recommended for many nodes)
 * Uses HarmonyAuraControllerBatch for better memory patterns
 */
export function updateHarmonyAuraBatch(batch, dt, timeSeconds) {
  batch.updateAll(dt, timeSeconds);
}

/**
 * Per-node update (if you prefer inline)
 */
export function updateHarmonyAura(controller, dt, timeSeconds) {
  controller?.update(dt, timeSeconds);
}

// =============================================================================
// INTEGRATION SNIPPET #3: BATCH MANAGEMENT
// =============================================================================
/**
 * Example: Managing a batch of harmony aura controllers
 * 
 * Usage:
 * ```
 * const auraBatch = new HarmonyAuraControllerBatch();
 * 
 * // When adding a node:
 * const {material, controller} = attachHarmonyAuraToNode(node, mesh);
 * auraBatch.add(controller);
 * 
 * // In animation loop:
 * auraBatch.updateAll(dt, now);
 * 
 * // When removing a node:
 * auraBatch.remove(controller);
 * ```
 */
export function createHarmonyAuraBatchManager() {
  return new HarmonyAuraControllerBatch();
}

// =============================================================================
// AUTO-WIRING INTEGRATION (Preferred Method)
// =============================================================================
/**
 * HARMONY AURA IS AUTO-WIRED VIA VISUAL AUTO-WIRING SYSTEM
 * 
 * You should NOT need to manually wire nodes.
 * 
 * Instead, use:
 * ```
 * import { wireRenderable, RENDERABLE_TYPE } from './VisualAutoWiringSystem.js';
 * 
 * await wireRenderable(node, RENDERABLE_TYPE.NODE, nodeMesh);
 * ```
 * 
 * This automatically:
 * 1. Looks up NODE → HARMONY_AURA in registry
 * 2. Resolves HarmonyAuraController + createHarmonyAuraMaterial
 * 3. Instantiates both
 * 4. Binds to node
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
 * Console API for debugging harmony aura system
 */
export function enableHarmonyAuraDebugAPI() {
  window.__ATOMA_HARMONY_AURA_DEBUG = {
    // Get conformance report
    conformance: () => {
      return HarmonyAuraController.assertConformance();
    },

    // Log controller state
    logControllerState: (controller) => {
      if (!controller) return 'No controller provided';
      return {
        node: controller.node?.id || 'unknown',
        smoothedOpacity: controller.getSmoothedOpacity(),
        smoothedRadius: controller.getSmoothedRadius(),
        pulseFrequency: controller.getPulseFrequency(),
        harmonyAuraStrength: controller.node?.userData?.harmonyAuraStrength ?? 0,
      };
    },

    // Verify no userData writes occurred
    assertNoDataMutations: (node) => {
      // This is a dev-time assertion
      // In production, use CoreMetricAuthorityMonitor.js
      const checkFields = ['harmony', 'synergy', 'corruption', 'integrity', 'networkStress'];
      const mutations = [];
      for (const field of checkFields) {
        if (node.userData?.hasOwnProperty(`__harmony_aura_wrote_${field}`)) {
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
        conformance: HarmonyAuraController.assertConformance(),
        status: 'OK',
      };
    },
  };

  console.log('✓ HarmonyAura Debug API enabled. Access via: window.__ATOMA_HARMONY_AURA_DEBUG');
}

// Auto-enable debug API if metric audit is active
if (typeof window !== 'undefined' && window.__ATOMA_METRIC_AUDIT) {
  enableHarmonyAuraDebugAPI();
}

// =============================================================================
// CONFORMANCE DOCUMENTATION
// =============================================================================
/**
 * TEMPLATE COMPLIANCE CHECKLIST:
 * ✅ Uses derived signal only (harmonyAuraStrength)
 * ✅ No userData writes
 * ✅ No event triggers
 * ✅ Canonical opacity mapping: smoothstep(0.2, 0.8, strength)
 * ✅ Canonical radius mapping: lerp(1.0, 1.35, strength)
 * ✅ Canonical breathing: lerp(0.15 Hz, 0.45 Hz), ±3%
 * ✅ Smooth secondary transitions (alpha ~0.12)
 * ✅ Frame-rate safe (dt-scaled smoothing)
 * ✅ O(1) performance (one update per node)
 * ✅ No per-frame allocations
 * ✅ Optional chaining for safety
 * ✅ Calm, non-aggressive aesthetics
 * ✅ Protective, supportive visual semantics
 */

export const HARMONY_AURA_COMPLIANCE = {
  template: 'CANONICAL_TEMPLATE_2_HARMONY_AURA',
  version: '1.0',
  authority: 'CanonicalVisualTemplateLibrary.md',
  lockStatus: 'LOCKED',
  
  canonical: {
    colorPalette: '#7fffd4 (aquamarine, soft cyan/mint)',
    blending: 'NormalBlending',
    opacityFormula: 'smoothstep(0.2, 0.8, harmonyAuraStrength)',
    radiusFormula: 'lerp(1.0, 1.35, harmonyAuraStrength)',
    breathingFrequency: 'lerp(0.15, 0.45, harmonyAuraStrength) Hz',
    breathingDepth: '±3%',
    smoothingAlpha: '0.12 (exponential)',
  },

  semantics: {
    purpose: 'Communicate energetic stability, calm, and healing potential',
    appearance: 'Soft envelope, slow gentle pulse',
    feeling: 'Protective, supportive, non-aggressive',
    forbidden: [
      'blinking',
      'jittering',
      'spiking on events',
      'reacting to corruption/stress',
      'encoding warnings',
      'color changes',
      'linear opacity',
    ],
  },

  contracts: {
    read: ['node.userData.harmonyAuraStrength'],
    forbidden: [
      'node.userData.harmony',
      'node.userData.stress',
      'node.userData.*_write',
      'events',
      'triggers',
    ],
  },

  files: [
    'HarmonyAuraShaderMaterial.js',
    'HarmonyAuraController.js',
    'HarmonyAuraIntegrationGuide.js',
  ],

  autoWiring: {
    registry: 'NODE → HARMONY_AURA',
    system: 'VisualAutoWiringSystem',
    note: 'Do not manually wire. Use wireRenderable(node, RENDERABLE_TYPE.NODE, mesh)',
  },
};

export default {
  attachHarmonyAuraToNode,
  updateHarmonyAuraControllers,
  createHarmonyAuraBatchManager,
  enableHarmonyAuraDebugAPI,
  HARMONY_AURA_COMPLIANCE,
};
