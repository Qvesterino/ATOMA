/**
 * OBJECT EXTENSIBILITY GUARD v1.0
 * 
 * CRITICAL: Prevents accidental freezing of Three.js engine objects
 * 
 * Three.js needs to attach event listeners (_listeners) to:
 * - Object3D (and subclasses: Mesh, Group, etc.)
 * - Material (and subclasses: MeshPhongMaterial, etc.)
 * - Geometry (and subclasses: BufferGeometry, etc.)
 * - Camera (and subclasses: PerspectiveCamera, etc.)
 * - Scene
 * - Uniform
 * 
 * If these are frozen, Three.js crashes with:
 * "TypeError: Cannot add property _listeners, object is not extensible"
 */

import * as THREE from 'three';

// ============================================================================
// EXTENSIBILITY GUARD
// ============================================================================

/**
 * Check if an object is a Three.js engine object
 */
export function isThreeJsEngineObject(obj) {
  if (!obj || typeof obj !== 'object') return false;

  // Check instance types
  if (obj instanceof THREE.Object3D) return true;
  if (obj instanceof THREE.Material) return true;
  if (obj instanceof THREE.Geometry) return true;
  if (obj instanceof THREE.BufferGeometry) return true;
  if (obj instanceof THREE.Camera) return true;
  if (obj instanceof THREE.Scene) return true;
  if (obj instanceof THREE.Light) return true;
  if (obj instanceof THREE.Texture) return true;

  // Check if it's in userData or properties (indirect Three.js objects)
  if (obj.geometry instanceof THREE.BufferGeometry) return true;
  if (obj.material instanceof THREE.Material) return true;

  return false;
}

/**
 * Safe Object.freeze wrapper
 * Prevents freezing Three.js engine objects
 */
export function safeFreeze(obj, message = '') {
  if (!obj) return obj;

  // NEVER freeze Three.js engine objects
  if (isThreeJsEngineObject(obj)) {
    console.error(
      `[ObjectExtensibilityGuard] BLOCKED: Attempted to freeze Three.js engine object!\n` +
      `  Object Type: ${obj.constructor.name}\n` +
      `  Context: ${message}\n` +
      `  Action: Freeze operation cancelled (would break Three.js event listeners)`
    );
    return obj; // Return unfrozen
  }

  // Only freeze pure data objects
  return Object.freeze(obj);
}

/**
 * Check if an object is extensible (safe to use)
 */
export function isExtensible(obj) {
  if (!obj || typeof obj !== 'object') return true;
  return Object.isExtensible(obj);
}

/**
 * Ensure a Three.js object remains extensible
 */
export function ensureExtensible(obj, message = '') {
  if (!obj || typeof obj !== 'object') return true;

  const ext = Object.isExtensible(obj);

  if (!ext && isThreeJsEngineObject(obj)) {
    console.error(
      `[ObjectExtensibilityGuard] CRITICAL: Three.js engine object is not extensible!\n` +
      `  Object Type: ${obj.constructor.name}\n` +
      `  Context: ${message}\n` +
      `  This may cause: TypeError: Cannot add property _listeners\n` +
      `  Solution: Remove Object.freeze/seal/preventExtensions on Three.js objects`
    );
    return false;
  }

  return ext;
}

/**
 * Dev-mode validation hook
 * Warn if any Three.js object is frozen
 */
export function validateObjectExtensibility(scene, config = {}) {
  if (!config.enabled && !window.location.hostname === 'localhost') return;

  const violations = [];
  let checkedCount = 0;

  scene.traverse((obj) => {
    checkedCount++;

    // Check the object itself
    if (!Object.isExtensible(obj) && isThreeJsEngineObject(obj)) {
      violations.push({
        object: obj,
        name: obj.name || 'unnamed',
        type: obj.constructor.name,
        location: 'object'
      });
    }

    // Check geometry
    if (obj.geometry && !Object.isExtensible(obj.geometry)) {
      violations.push({
        object: obj.geometry,
        name: obj.name || 'unnamed',
        type: 'BufferGeometry',
        location: `${obj.name}.geometry`
      });
    }

    // Check material(s)
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach((mat, idx) => {
      if (mat && !Object.isExtensible(mat)) {
        violations.push({
          object: mat,
          name: obj.name || 'unnamed',
          type: mat.constructor.name,
          location: `${obj.name}.material[${idx}]`
        });
      }
    });
  });

  if (violations.length > 0) {
    console.error(
      `[ObjectExtensibilityGuard] VIOLATIONS DETECTED!\n` +
      `  Checked: ${checkedCount} objects\n` +
      `  Violations: ${violations.length}\n` +
      `  Fix: Remove Object.freeze/seal/preventExtensions calls`
    );

    violations.forEach((v) => {
      console.error(
        `  ❌ ${v.location} (${v.type}) — NOT extensible\n` +
        `     Risk: Will crash when Three.js tries to attach _listeners`
      );
    });

    return false;
  }

  if (config.verbose) {
    console.log(
      `[ObjectExtensibilityGuard] ✓ All ${checkedCount} objects are extensible`
    );
  }

  return true;
}

// ============================================================================
// DEBUG API (Console Commands)
// ============================================================================

export function setupObjectExtensibilityDebugAPI() {
  window.ObjectExtensibilityGuard = {
    isThreeJsEngineObject,
    safeFreeze,
    isExtensible,
    ensureExtensible,
    validate: (scene) => {
      const result = validateObjectExtensibility(scene, { verbose: true });
      console.log('[ObjectExtensibilityGuard] Validation result:', result);
      return result;
    },
    checkObject: (obj) => {
      const isEngine = isThreeJsEngineObject(obj);
      const isExt = Object.isExtensible(obj);
      console.log('[ObjectExtensibilityGuard] Object Check:', {
        isThreeJsEngineObject: isEngine,
        isExtensible: isExt,
        type: obj?.constructor?.name,
        risk: !isExt && isEngine ? 'CRITICAL' : 'safe'
      });
      return { isEngine, isExt };
    }
  };

  console.log('[ObjectExtensibilityGuard] Debug API available:');
  console.log('  ObjectExtensibilityGuard.validate(scene) — Check all objects');
  console.log('  ObjectExtensibilityGuard.checkObject(obj) — Check specific object');
  console.log('  ObjectExtensibilityGuard.isExtensible(obj) — Check extensibility');
  console.log('  ObjectExtensibilityGuard.ensureExtensible(obj) — Verify safety');
}
