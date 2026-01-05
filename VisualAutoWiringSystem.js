/**
 * VISUAL AUTO-WIRING SYSTEM
 * ==========================
 * Mechanical Renderable → Canonical Controller + Material Wiring
 * 
 * Authority: CanonicalVisualTemplateLibrary.md (LOCKED)
 * 
 * Responsibility:
 * ✅ Wire renderables on creation
 * ✅ Update controllers per frame
 * ✅ Cleanup on destruction
 * ✅ Forward time + delta only
 * ✅ No metric access, no conditionals, no logic
 * 
 * Principle:
 * Connect things. Never interpret them.
 */

import {
  RENDERABLE_TYPE,
  getTemplateForRenderable,
  validateRegistryConformance,
} from './VisualTemplateRegistry.js';

import {
  getTemplateSpec,
  resolveTemplate,
  isTemplateLocked,
  validateTemplateSpecs,
} from './VisualTemplateResolver.js';

// =============================================================================
// WIRING STORE (Per-Renderable Controller Management)
// =============================================================================

class WiringStore {
  constructor() {
    this.wiring = new Map(); // renderable → {material, controller, templateId}
  }

  /**
   * Store wiring for a renderable.
   */
  add(renderable, material, controller, templateId) {
    this.wiring.set(renderable, {
      material,
      controller,
      templateId,
      createdAt: performance.now(),
    });
  }

  /**
   * Retrieve wiring for a renderable.
   */
  get(renderable) {
    return this.wiring.get(renderable) ?? null;
  }

  /**
   * Check if renderable is wired.
   */
  has(renderable) {
    return this.wiring.has(renderable);
  }

  /**
   * Remove wiring for a renderable.
   */
  remove(renderable) {
    return this.wiring.delete(renderable);
  }

  /**
   * Get all wired renderables.
   */
  getAll() {
    return Array.from(this.wiring.values());
  }

  /**
   * Get count for diagnostics.
   */
  count() {
    return this.wiring.size;
  }

  /**
   * Clear all wirings.
   */
  clear() {
    this.wiring.clear();
  }
}

// =============================================================================
// AUTO-WIRING SYSTEM
// =============================================================================

export class VisualAutoWiringSystem {
  constructor() {
    this.wiringStore = new WiringStore();
    this._initialized = false;
  }

  /**
   * Initialize system (verify conformance + validate).
   * Call once during setup.
   */
  async initialize() {
    if (this._initialized) return;

    // Validate registry
    if (!validateRegistryConformance()) {
      throw new Error(
        'VisualTemplateRegistry conformance failed. ' +
        'See console for violations.'
      );
    }

    // Validate resolver specs
    if (!validateTemplateSpecs()) {
      throw new Error(
        'VisualTemplateResolver conformance failed. ' +
        'See console for violations.'
      );
    }

    this._initialized = true;
    console.log('✓ VisualAutoWiringSystem initialized');
  }

  /**
   * Wire a renderable to its canonical visual template.
   * 
   * Atomic operation:
   * 1. Identify renderable type
   * 2. Resolve canonical template
   * 3. Load controller + material
   * 4. Instantiate + store
   * 5. Apply to renderable
   * 
   * @param {THREE.Object3D} renderable - Renderable entity
   * @param {string} renderableType - From RENDERABLE_TYPE
   * @param {THREE.Mesh} mesh - Mesh to apply material to (optional)
   * @returns {Promise<{material, controller}>} Wired components
   */
  async wireRenderable(renderable, renderableType, mesh = null) {
    // Verify system initialized
    if (!this._initialized) {
      await this.initialize();
    }

    // Step 1: Already wired?
    if (this.wiringStore.has(renderable)) {
      console.warn(`Renderable already wired (skipping)`);
      return this.wiringStore.get(renderable);
    }

    // Step 2: Get canonical template
    const templateId = getTemplateForRenderable(renderableType);
    if (!templateId) {
      throw new Error(
        `No canonical template for renderable type: ${renderableType}`
      );
    }

    // Step 3: Verify template is locked
    if (!isTemplateLocked(templateId)) {
      throw new Error(`Template not locked: ${templateId}`);
    }

    // Step 4: Resolve template → controller + material
    let ControllerClass, createMaterial;
    try {
      ({ ControllerClass, createMaterial } = await resolveTemplate(templateId));
    } catch (err) {
      throw new Error(
        `Failed to resolve template "${templateId}": ${err.message}`
      );
    }

    // Step 5: Instantiate material
    let material;
    try {
      material = createMaterial();
    } catch (err) {
      throw new Error(
        `Failed to create material for template "${templateId}": ${err.message}`
      );
    }

    // Step 6: Instantiate controller
    let controller;
    try {
      controller = new ControllerClass(renderable, material);
    } catch (err) {
      throw new Error(
        `Failed to create controller for template "${templateId}": ${err.message}`
      );
    }

    // Step 7: Apply material to mesh (if provided)
    if (mesh) {
      mesh.material = material;
    }

    // Step 8: Store wiring
    this.wiringStore.add(renderable, material, controller, templateId);

    // Step 9: Return components
    return { material, controller };
  }

  /**
   * Update all wired controllers (per frame).
   * 
   * @param {number} dt - Delta time (seconds)
   * @param {number} timeSeconds - Total elapsed time (seconds)
   */
  updateAllControllers(dt, timeSeconds) {
    const wirings = this.wiringStore.getAll();
    for (const wiring of wirings) {
      try {
        wiring.controller?.update(dt, timeSeconds);
      } catch (err) {
        console.error(
          `Failed to update controller for template "${wiring.templateId}":`,
          err
        );
      }
    }
  }

  /**
   * Unwire a renderable (cleanup).
   * 
   * @param {THREE.Object3D} renderable - Renderable to unwire
   * @returns {boolean} Was wired (true) or not (false)
   */
  unwireRenderable(renderable) {
    const wiring = this.wiringStore.get(renderable);
    if (!wiring) {
      return false;
    }

    // Optional: Call cleanup on controller if available
    if (wiring.controller?.cleanup) {
      try {
        wiring.controller.cleanup();
      } catch (err) {
        console.warn('Controller cleanup error:', err);
      }
    }

    // Optional: Dispose material if needed
    // Note: Mesh disposal handled by caller

    this.wiringStore.remove(renderable);
    return true;
  }

  /**
   * Get wiring for a renderable (for debugging).
   * 
   * @param {THREE.Object3D} renderable - Renderable to inspect
   * @returns {object|null} Wiring info or null
   */
  getWiring(renderable) {
    const wiring = this.wiringStore.get(renderable);
    if (!wiring) return null;

    return {
      templateId: wiring.templateId,
      hasController: !!wiring.controller,
      hasMaterial: !!wiring.material,
      createdAt: wiring.createdAt,
    };
  }

  /**
   * Get all wirings (for diagnostics).
   * 
   * @returns {array} Array of wiring info
   */
  getAllWirings() {
    return this.wiringStore.getAll().map(w => ({
      templateId: w.templateId,
      createdAt: w.createdAt,
    }));
  }

  /**
   * Get wiring count.
   * 
   * @returns {number}
   */
  getWiringCount() {
    return this.wiringStore.count();
  }

  /**
   * Clear all wirings (e.g., on world reset).
   */
  clearAllWirings() {
    this.wiringStore.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE (Shared globally)
// =============================================================================
let globalWiringSystem = null;

/**
 * Get or create global wiring system.
 */
export function getGlobalWiringSystem() {
  if (!globalWiringSystem) {
    globalWiringSystem = new VisualAutoWiringSystem();
  }
  return globalWiringSystem;
}

/**
 * Initialize global system once.
 */
export async function initializeGlobalWiringSystem() {
  const system = getGlobalWiringSystem();
  await system.initialize();
  return system;
}

// =============================================================================
// CONVENIENCE FUNCTIONS (No global state)
// =============================================================================

/**
 * Wire a renderable using global system.
 * 
 * @param {THREE.Object3D} renderable - Renderable entity
 * @param {string} renderableType - From RENDERABLE_TYPE
 * @param {THREE.Mesh} mesh - Mesh to apply material (optional)
 * @returns {Promise<{material, controller}>}
 */
export async function wireRenderable(renderable, renderableType, mesh = null) {
  const system = getGlobalWiringSystem();
  return system.wireRenderable(renderable, renderableType, mesh);
}

/**
 * Update all wired controllers using global system.
 * 
 * @param {number} dt - Delta time (seconds)
 * @param {number} timeSeconds - Total elapsed time (seconds)
 */
export function updateAllVisualControllers(dt, timeSeconds) {
  const system = getGlobalWiringSystem();
  system.updateAllControllers(dt, timeSeconds);
}

/**
 * Unwire a renderable using global system.
 * 
 * @param {THREE.Object3D} renderable - Renderable to unwire
 * @returns {boolean}
 */
export function unwireRenderable(renderable) {
  const system = getGlobalWiringSystem();
  return system.unwireRenderable(renderable);
}

// =============================================================================
// BATCH WIRING (Convenience)
// =============================================================================

/**
 * Wire multiple renderables of the same type.
 * 
 * @param {array<THREE.Object3D>} renderables - Array of renderables
 * @param {string} renderableType - Shared renderable type
 * @param {array<THREE.Mesh>} meshes - Optional meshes (parallel array)
 * @returns {Promise<array>} Array of {material, controller} pairs
 */
export async function wireRenderablesBatch(
  renderables,
  renderableType,
  meshes = null
) {
  const results = [];

  for (let i = 0; i < renderables.length; i++) {
    const renderable = renderables[i];
    const mesh = meshes ? meshes[i] : null;

    try {
      const wiring = await wireRenderable(renderable, renderableType, mesh);
      results.push(wiring);
    } catch (err) {
      console.error(`Failed to wire renderable ${i}:`, err);
      results.push(null);
    }
  }

  return results;
}

// =============================================================================
// DEBUG API (Dev Mode)
// =============================================================================
if (typeof window !== 'undefined') {
  window.__ATOMA_VISUAL_WIRING_DEBUG = {
    async wireAsync(renderable, type, mesh = null) {
      return wireRenderable(renderable, type, mesh);
    },

    update(dt, time) {
      updateAllVisualControllers(dt, time);
    },

    unwire(renderable) {
      return unwireRenderable(renderable);
    },

    getWiring(renderable) {
      const system = getGlobalWiringSystem();
      return system.getWiring(renderable);
    },

    listWirings() {
      const system = getGlobalWiringSystem();
      return system.getAllWirings();
    },

    count() {
      const system = getGlobalWiringSystem();
      return system.getWiringCount();
    },

    clear() {
      const system = getGlobalWiringSystem();
      system.clearAllWirings();
    },

    async initialize() {
      return initializeGlobalWiringSystem();
    },

    help: () => `
      ✓ Visual Auto-Wiring System Debug API
      
      Setup:
        await window.__ATOMA_VISUAL_WIRING_DEBUG.initialize()
      
      Wiring:
        await wireAsync(renderable, 'LINK', mesh)
        unwire(renderable)
        listWirings()
        count()
      
      Updates:
        update(dt, timeSeconds)
      
      Inspection:
        getWiring(renderable)
        listWirings()
        count()
      
      Reset:
        clear()
    `,
  };
}

// =============================================================================
// CONFORMANCE SELF-CHECK
// =============================================================================

export const WIRING_SYSTEM_CONFORMANCE = {
  layer: 'VisualAutoWiringSystem',
  purpose: 'Renderable → canonical controller + material auto-wiring',
  deterministic: true,
  branchingOnMetrics: false,
  branchingOnGameplay: false,
  feedbackLoops: false,
  directMetricAccess: false,
  statWriting: false,
  eventTriggers: false,
  conformanceStatus: 'LOCKED',
  authority: 'CanonicalVisualTemplateLibrary.md',
};
