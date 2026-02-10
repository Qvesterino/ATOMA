import * as THREE from 'three';

const ALLOWED_ROLES = new Set([
  'collider',
  'interactionProxy',
  'highlight',
  'ghost',
  'vfx',
  'canonicalSphere',
]);

const ROLE_MAX_RADIUS = Object.freeze({
  highlight: 2.5,
  ghost: 2.0,
  vfx: 3.0,
});

let _globalInstall = null;
let _object3DAddPatched = false;

function isSphereMesh(obj) {
  return !!obj && obj.isMesh === true && obj.geometry?.type === 'SphereGeometry';
}

function effectiveOpacity(material) {
  if (!material) return 1;
  if (Array.isArray(material)) {
    let max = 0;
    for (const mat of material) {
      max = Math.max(max, effectiveOpacity(mat));
    }
    return max;
  }
  if (material.transparent === true && material.opacity === 0) return 0;
  if (typeof material.opacity === 'number') return material.opacity;
  return 1;
}

function isEffectivelyVisible(mesh) {
  if (!mesh || mesh.visible === false) return false;
  return effectiveOpacity(mesh.material) > 0;
}

function getRole(mesh) {
  return mesh?.userData?.atomaRole || null;
}

function getOwner(mesh) {
  return mesh?.userData?.atomaOwner || null;
}

function getSource(mesh) {
  return mesh?.userData?.atomaSource || 'unknown';
}

function worldSphereRadius(mesh) {
  if (!mesh?.geometry) return 0;
  if (!mesh.geometry.boundingSphere && typeof mesh.geometry.computeBoundingSphere === 'function') {
    try {
      mesh.geometry.computeBoundingSphere();
    } catch (e) {
      return 0;
    }
  }
  const base = mesh.geometry.boundingSphere?.radius || 0;
  if (base <= 0) return 0;
  const scale = new THREE.Vector3(1, 1, 1);
  if (typeof mesh.getWorldScale === 'function') {
    mesh.getWorldScale(scale);
  } else {
    scale.copy(mesh.scale || new THREE.Vector3(1, 1, 1));
  }
  const factor = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z), 1e-6);
  return base * factor;
}

function applyRadiusClamp(mesh, maxRadius) {
  if (!mesh || !Number.isFinite(maxRadius) || maxRadius <= 0) return false;
  const current = worldSphereRadius(mesh);
  if (!Number.isFinite(current) || current <= 0 || current <= maxRadius) return false;

  const factor = maxRadius / current;
  mesh.scale.multiplyScalar(factor);
  return true;
}

function roleVisibilityViolation(mesh, role) {
  const visible = isEffectivelyVisible(mesh);
  if ((role === 'collider' || role === 'interactionProxy') && visible) return true;
  return false;
}

function safelyDisposeMesh(mesh) {
  if (!mesh || mesh.userData?.atomaOwnsResources !== true) return;
  if (mesh.geometry?.dispose) mesh.geometry.dispose();
  const mat = mesh.material;
  if (Array.isArray(mat)) {
    for (const m of mat) m?.dispose?.();
  } else {
    mat?.dispose?.();
  }
}

function removeIllegal(mesh, context) {
  const payload = {
    role: getRole(mesh),
    source: getSource(mesh),
    owner: getOwner(mesh),
    context: context || null,
    meshName: mesh?.name || null,
    meshUuid: mesh?.uuid || null,
  };
  console.warn('[SPHERE_POLICY_KILL]', payload);
  if (mesh?.parent) mesh.parent.remove(mesh);
  safelyDisposeMesh(mesh);
}

function clampSphere(mesh) {
  if (!isSphereMesh(mesh)) return false;
  const role = getRole(mesh);
  const maxRadius = ROLE_MAX_RADIUS[role];
  if (!maxRadius) return false;
  return applyRadiusClamp(mesh, maxRadius);
}

function isIllegalVisibleSphere(mesh) {
  if (!isSphereMesh(mesh)) return false;
  if (!isEffectivelyVisible(mesh)) return false;

  const role = getRole(mesh);
  if (!ALLOWED_ROLES.has(role)) return true;
  if (roleVisibilityViolation(mesh, role)) return true;

  return false;
}

function validateObject3D(root, context = null) {
  if (!root || typeof root.traverse !== 'function') return { removed: 0, clamped: 0 };
  let removed = 0;
  let clamped = 0;
  const victims = [];

  root.traverse((obj) => {
    if (!isSphereMesh(obj)) return;

    if (isIllegalVisibleSphere(obj)) {
      victims.push(obj);
      return;
    }
    if (clampSphere(obj)) clamped++;
  });

  for (const victim of victims) {
    removeIllegal(victim, context);
    removed++;
  }
  return { removed, clamped };
}

function tagSphere(mesh, { role, owner = null, source = 'unknown', radiusHint = null } = {}) {
  if (!mesh || mesh.isMesh !== true) return mesh;
  mesh.userData = mesh.userData || {};
  mesh.userData.atomaRole = role;
  mesh.userData.atomaSource = source;
  if (owner !== null && owner !== undefined) {
    mesh.userData.atomaOwner = owner;
  }
  if (radiusHint !== null && Number.isFinite(radiusHint)) {
    mesh.userData.atomaRadiusHint = radiusHint;
  }
  return mesh;
}

function patchObject3DAdd(policyState) {
  if (_object3DAddPatched) return;
  if (!THREE?.Object3D?.prototype?.add) return;

  const originalAdd = THREE.Object3D.prototype.add;
  THREE.Object3D.prototype.add = function patchedAdd(...objects) {
    const result = originalAdd.apply(this, objects);
    for (const obj of objects) {
      if (!obj) continue;
      const res = validateObject3D(obj, { phase: 'Object3D.add', parent: this?.name || this?.uuid || null });
      policyState.stats.removed += res.removed;
      policyState.stats.clamped += res.clamped;
    }
    return result;
  };
  _object3DAddPatched = true;
}

function installSpherePolicy(scene, options = {}) {
  if (_globalInstall) return _globalInstall;

  const policyState = {
    scene,
    options,
    stats: {
      removed: 0,
      clamped: 0,
      sweeps: 0,
    },
    lastSweepTime: 0,
    sweepIntervalMs: Number.isFinite(options.sweepIntervalMs) ? options.sweepIntervalMs : 100,
  };

  patchObject3DAdd(policyState);

  const api = {
    validateObject3D: (root, context = null) => {
      const res = validateObject3D(root, context);
      policyState.stats.removed += res.removed;
      policyState.stats.clamped += res.clamped;
      return res;
    },
    sweep: (force = false, context = null) => {
      const now = performance.now();
      if (!force && now - policyState.lastSweepTime < policyState.sweepIntervalMs) return { skipped: true };
      policyState.lastSweepTime = now;
      policyState.stats.sweeps++;
      if (!policyState.scene) return { removed: 0, clamped: 0 };
      const res = validateObject3D(policyState.scene, context || { phase: 'sweep' });
      policyState.stats.removed += res.removed;
      policyState.stats.clamped += res.clamped;
      return res;
    },
    getStats: () => ({ ...policyState.stats }),
  };

  if (typeof window !== 'undefined') {
    window.__ATOMA_SPHERE_POLICY__ = api;
  }
  _globalInstall = api;
  return api;
}

export {
  installSpherePolicy,
  validateObject3D,
  tagSphere,
  clampSphere,
  isIllegalVisibleSphere,
};

