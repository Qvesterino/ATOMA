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
   * Apply a named render profile to a mesh material.
   * Idempotent: if the same key is already applied, no writes occur.
   * Optional overrides allow stable tweaks per mesh while keeping authority centralized.
   */
  apply(mesh, stateKey, overrides = {}) {
    if (!mesh || !mesh.material) return;
    const profile = PROFILES[stateKey];
    if (!profile) {
      if (DEBUG_TRANSPARENT_AUTHORITY) {
        console.warn('[TransparentStateAuthority] Unknown state key:', stateKey);
      }
      return;
    }

    // Domain guard: only overlay/link domains may be mutated
    const domain = mesh.material.userData?.__domain;
    if (domain !== 'overlay' && domain !== 'link') {
      if (!warnedDomain.has(mesh.material)) {
        if (DEBUG_TRANSPARENT_AUTHORITY) {
          console.warn('[TransparentStateAuthority] Blocked apply on non-overlay/link material', {
            stateKey,
            material: mesh.material.uuid,
            domain: domain ?? 'unset'
          });
        }
        warnedDomain.add(mesh.material);
      }
      return;
    }

    const isFrozen = mesh.material.userData?.__flagsFrozen;
    const target = { ...profile, ...overrides };
    const touchesVariantProp = Object.keys(target).some(k => VARIANT_PROPS.includes(k));

    // Respect frozen materials: never mutate shader-variant flags after freeze
    if (isFrozen && touchesVariantProp) {
      if (!warnedFrozen.has(mesh.material)) {
        if (DEBUG_TRANSPARENT_AUTHORITY) {
          console.warn('[MaterialAuthority] Blocked runtime flag change on frozen material', { stateKey, material: mesh.material.uuid });
        }
        warnedFrozen.add(mesh.material);
      }
      return;
    }

    const state = ensureStateContainer(mesh);
    if (state.applied && state.key === stateKey) return;

    if (mesh.material.transparent !== target.transparent) mesh.material.transparent = target.transparent;
    if (mesh.material.depthWrite !== target.depthWrite) mesh.material.depthWrite = target.depthWrite;
    if (mesh.material.depthTest !== target.depthTest) mesh.material.depthTest = target.depthTest;
    if (mesh.material.blending !== target.blending) mesh.material.blending = target.blending;
    if (mesh.renderOrder !== target.renderOrder) mesh.renderOrder = target.renderOrder;

    state.key = stateKey;
    state.applied = true;
  },

  /**
   * Release authority tracking for a mesh.
   * Does not mutate material; simply clears the state marker.
   */
  release(mesh) {
    if (!mesh || !mesh.userData?.__transparentState) return;
    delete mesh.userData.__transparentState;
  },

  /**
   * Get the currently applied state for a mesh.
   */
  getState(mesh) {
    return mesh?.userData?.__transparentState || null;
  }
};
