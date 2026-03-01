/**
 * VisualSpherePolicy (stub)
 * ------------------------------------------------------------------
 * Original policy was removed/disabled. This stub keeps imports alive
 * without mutating runtime behavior. All helpers are no-ops.
 */

export function tagAllowedSphere(obj, _meta = {}) {
  return obj;
}

export function clampSphere(obj) {
  return obj;
}

export function validateObject3D(obj) {
  return true;
}

export function ensureSpherePolicyInstalled() {
  return true;
}

export function installSpherePolicy() {
  return true;
}

export default {
  tagAllowedSphere,
  clampSphere,
  validateObject3D,
  ensureSpherePolicyInstalled,
  installSpherePolicy
};
