import * as THREE from 'three';

const DEBUG_TRANSPARENT_AUTHORITY = false;

// Centralized render-state profiles
const PROFILES = {
  opaque: {
    transparent: false,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending,
    renderOrder: 0
  },
  transparent: {
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    renderOrder: 0
  },
  additive: {
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    renderOrder: 40
  },
  ui: {
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    renderOrder: 10000
  },
  holo: {
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    renderOrder: -500
  },
  link: {
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    renderOrder: 10
  }
};

const VARIANT_PROPS = ['transparent', 'depthWrite', 'depthTest', 'blending', 'alphaTest', 'side'];
const warnedFrozen = new WeakSet();
const warnedDomain = new WeakSet();

function ensureStateContainer(mesh) {
  if (!mesh.userData) mesh.userData = {};
  if (!mesh.userData.__transparentState) {
    mesh.userData.__transparentState = { key: null, applied: false };
  }
  return mesh.userData.__transparentState;
}

export const TransparentStateAuthority = {
  /**
   * Validate that a mesh material matches a named render profile.
   * ARCHITECTURAL CHANGE: This is now a VALIDATOR ONLY.
   * NO runtime mutations occur - materials must be created with correct flags.
   * 
   * If material flags differ from target, this function:
   * - Logs a single warning in debug mode
   * - Returns validation result
   * - Does NOT mutate the material
   * 
   * @param {THREE.Mesh} mesh - The mesh to validate
   * @param {string} stateKey - The expected profile key
   * @param {Object} overrides - Optional property overrides for validation
   * @returns {boolean} true if material matches target, false otherwise
   */
  apply(mesh, stateKey, overrides = {}) {
    if (!mesh || !mesh.material) return false;
    
    const profile = PROFILES[stateKey];
    if (!profile) {
      if (DEBUG_TRANSPARENT_AUTHORITY) {
        console.warn('[TransparentStateAuthority] Unknown state key:', stateKey);
      }
      return false;
    }

    const target = { ...profile, ...overrides };
    const material = mesh.material;
    
    // Check if all variant properties match
    const mismatches = [];
    if (material.transparent !== target.transparent) {
      mismatches.push(`transparent (actual: ${material.transparent}, expected: ${target.transparent})`);
    }
    if (material.depthWrite !== target.depthWrite) {
      mismatches.push(`depthWrite (actual: ${material.depthWrite}, expected: ${target.depthWrite})`);
    }
    if (material.depthTest !== target.depthTest) {
      mismatches.push(`depthTest (actual: ${material.depthTest}, expected: ${target.depthTest})`);
    }
    if (material.blending !== target.blending) {
      const blendName = material.blending === THREE.AdditiveBlending ? 'AdditiveBlending' : 
                        material.blending === THREE.NormalBlending ? 'NormalBlending' : 
                        material.blending;
      const targetBlendName = target.blending === THREE.AdditiveBlending ? 'AdditiveBlending' :
                             target.blending === THREE.NormalBlending ? 'NormalBlending' :
                             target.blending;
      mismatches.push(`blending (actual: ${blendName}, expected: ${targetBlendName})`);
    }
    
    // If mismatches found, log once and return false
    if (mismatches.length > 0) {
      if (!warnedDomain.has(material)) {
        if (DEBUG_TRANSPARENT_AUTHORITY) {
          console.warn('[TransparentStateAuthority] Material does not match expected profile:', {
            mesh: mesh.name || mesh.uuid,
            material: material.uuid,
            stateKey,
            mismatches: mismatches.join(', '),
            note: 'Materials must be created with correct variant flags at creation time'
          });
        }
        warnedDomain.add(material);
      }
      return false;
    }
    
    // Mark as validated (no mutation)
    const state = ensureStateContainer(mesh);
    state.key = stateKey;
    state.applied = true;
    
    return true;
  },

  /**
   * Release validation tracking for a mesh.
   * Does not mutate material; simply clears the state marker.
   */
  release(mesh) {
    if (!mesh || !mesh.userData?.__transparentState) return;
    delete mesh.userData.__transparentState;
  },

  /**
   * Get the currently validated state for a mesh.
   */
  getState(mesh) {
    return mesh?.userData?.__transparentState || null;
  },
  
  /**
   * Validate a material matches expected profile without tracking state.
   * Useful for one-time checks.
   */
  validate(mesh, stateKey, overrides = {}) {
    return this.apply(mesh, stateKey, overrides);
  }
};
