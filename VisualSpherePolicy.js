import * as THREE from 'three';

const ALLOWED_ROLES = new Set([
  'collider',
  'interactionProxy',
  'sensor',
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

const HIDDEN_ONLY_ROLES = new Set(['collider', 'interactionProxy', 'sensor']);

let _policyState = null;
let _object3DAddPatched = false;
let _installingGuard = false;
let _logDedupe = new Map();
let _installAttempts = 0;

if (typeof window !== 'undefined' && window.__ATOMA_SPHERE_POLICY_READY === undefined) {
  window.__ATOMA_SPHERE_POLICY_READY = false;
}

function frameBucket() {
  return Math.floor(performance.now() / 16.7);
}

function cleanupDedupe() {
  const cutoff = performance.now() - 5000;
  for (const [key, ts] of _logDedupe.entries()) {
    if (ts < cutoff) _logDedupe.delete(key);
  }
}

function effectiveOpacity(material) {
  if (!material) return 1;
  if (Array.isArray(material)) {
    let max = 0;
    for (const mat of material) max = Math.max(max, effectiveOpacity(mat));
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

function isSphereMesh(obj) {
  if (!obj || obj.isMesh !== true || !obj.geometry) return false;
  const geo = obj.geometry;
  if (geo.type === 'SphereGeometry') return true;
  // Conservative BufferGeometry heuristic: only if explicitly hinted as sphere.
  if (geo.isBufferGeometry === true) {
    if (obj.userData?.atomaGeometryHint === 'sphere') return true;
    if (geo.userData?.atomaGeometryHint === 'sphere') return true;
  }
  return false;
}

function getRole(mesh) {
  return mesh?.userData?.atomaRole || null;
}

function getOwner(mesh) {
  return mesh?.userData?.atomaOwner || null;
}

function getSource(mesh) {
  return mesh?.userData?.atomaSource || null;
}

function inferNodeMeta(mesh) {
  let cur = mesh;
  while (cur) {
    const ud = cur.userData || {};
    if (ud.category || ud.archetype || ud.nodeId || ud.id) {
      return {
        category: ud.category || null,
        archetype: ud.archetype || null,
        owner: ud.nodeId || ud.id || null,
      };
    }
    cur = cur.parent || null;
  }
  return { category: null, archetype: null, owner: null };
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
  mesh.scale.multiplyScalar(maxRadius / current);
  return true;
}

function clampSphere(mesh) {
  if (!isSphereMesh(mesh)) return false;
  const maxRadius = ROLE_MAX_RADIUS[getRole(mesh)];
  if (!maxRadius) return false;
  return applyRadiusClamp(mesh, maxRadius);
}

function isIllegalVisibleSphere(mesh) {
  if (!isSphereMesh(mesh)) return false;
  return isIllegalSphere(mesh) && isEffectivelyVisible(mesh);
}

function isIllegalSphere(mesh) {
  if (!isSphereMesh(mesh)) return false;
  const role = getRole(mesh);
  if (!ALLOWED_ROLES.has(role)) return true;
  if (HIDDEN_ONLY_ROLES.has(role) && isEffectivelyVisible(mesh)) return true;
  return false;
}

function disposeIfOwned(mesh) {
  if (!mesh || mesh.userData?.atomaOwnsResources !== true) return;
  if (mesh.geometry?.dispose) mesh.geometry.dispose();
  const mat = mesh.material;
  if (Array.isArray(mat)) mat.forEach((m) => m?.dispose?.());
  else mat?.dispose?.();
}

function emitBlockLog(mesh, parent, context) {
  const inferred = inferNodeMeta(mesh);
  const payload = {
    source: getSource(mesh) || 'unknown',
    owner: getOwner(mesh) || inferred.owner || 'unknown',
    parent: parent?.name || parent?.uuid || 'unknown',
    meshName: mesh?.name || 'unknown',
    uuid: mesh?.uuid || 'unknown',
    role: getRole(mesh) || 'unknown',
    category: mesh?.userData?.atomaCategory || inferred.category || 'unknown',
    archetype: mesh?.userData?.atomaArchetype || inferred.archetype || 'unknown',
    phase: context?.phase || 'Object3D.add',
  };
  const key = `${frameBucket()}:${payload.uuid}:${payload.role}:${payload.source}`;
  if (_logDedupe.has(key)) return;
  _logDedupe.set(key, performance.now());
  cleanupDedupe();
  console.warn(`[SPHERE_POLICY_BLOCK] ${JSON.stringify(payload)}`);
}

function emitKillLog(mesh, context) {
  const inferred = inferNodeMeta(mesh);
  const payload = {
    role: getRole(mesh) || 'unknown',
    source: getSource(mesh) || 'unknown',
    owner: getOwner(mesh) || inferred.owner || 'unknown',
    meshName: mesh?.name || 'unknown',
    uuid: mesh?.uuid || 'unknown',
    category: mesh?.userData?.atomaCategory || inferred.category || 'unknown',
    archetype: mesh?.userData?.atomaArchetype || inferred.archetype || 'unknown',
    context: context || null,
  };
  console.warn(`[SPHERE_POLICY_KILL] ${JSON.stringify(payload)}`);
}

function collectIllegalSpheres(root) {
  const illegal = [];
  const clamped = [];
  if (!root || typeof root.traverse !== 'function') return { illegal, clamped };
  root.traverse((obj) => {
    if (!isSphereMesh(obj)) return;
    if (isIllegalSphere(obj)) {
      illegal.push(obj);
    } else if (clampSphere(obj)) {
      clamped.push(obj);
    }
  });
  return { illegal, clamped };
}

function sanitizeCandidateForAdd(candidate, parent, context) {
  const { illegal, clamped } = collectIllegalSpheres(candidate);
  if (clamped.length > 0 && _policyState) _policyState.stats.clamped += clamped.length;
  if (illegal.length === 0) return { allow: true, node: candidate, blocked: 0 };

  let blocked = 0;
  const blockedSet = new Set(illegal);
  for (const mesh of illegal) {
    emitBlockLog(mesh, parent, context);
    blocked++;
  }

  if (blockedSet.has(candidate)) {
    if (_policyState) _policyState.stats.blocked += blocked;
    return { allow: false, node: null, blocked };
  }

  for (const mesh of illegal) {
    if (mesh.parent) mesh.parent.remove(mesh);
    disposeIfOwned(mesh);
  }
  if (_policyState) _policyState.stats.blocked += blocked;
  return { allow: true, node: candidate, blocked };
}

function validateObject3D(root, context = null) {
  if (!root || typeof root.traverse !== 'function') return { removed: 0, clamped: 0 };
  const { illegal, clamped } = collectIllegalSpheres(root);
  let removed = 0;
  for (const mesh of illegal) {
    emitKillLog(mesh, context);
    if (mesh.parent) mesh.parent.remove(mesh);
    disposeIfOwned(mesh);
    removed++;
  }
  return { removed, clamped: clamped.length };
}

function tagAllowedSphere(
  mesh,
  {
    role,
    ownerId = null,
    owner = null,
    system = 'unknown',
    source = null,
    category = null,
    archetype = null,
    radiusHint = null,
  } = {}
) {
  if (!mesh || mesh.isMesh !== true) return mesh;
  mesh.userData = mesh.userData || {};
  mesh.userData.atomaRole = role;
  const resolvedSystem = source ?? system;
  const resolvedOwner = ownerId ?? owner;
  mesh.userData.atomaSource = resolvedSystem;
  if (resolvedOwner !== null && resolvedOwner !== undefined) mesh.userData.atomaOwner = resolvedOwner;
  if (category !== null && category !== undefined) mesh.userData.atomaCategory = category;
  if (archetype !== null && archetype !== undefined) mesh.userData.atomaArchetype = archetype;
  if (radiusHint !== null && Number.isFinite(radiusHint)) mesh.userData.atomaRadiusHint = radiusHint;
  return mesh;
}

// Backward-compatible alias.
function tagSphere(mesh, opts = {}) {
  return tagAllowedSphere(mesh, {
    role: opts.role,
    ownerId: opts.owner,
    system: opts.source,
    category: opts.category,
    archetype: opts.archetype,
    radiusHint: opts.radiusHint,
  });
}

function patchObject3DAdd() {
  if (_object3DAddPatched) return true;
  if (!THREE?.Object3D?.prototype?.add) return false;

  const originalAdd = THREE.Object3D.prototype.add;
  THREE.Object3D.prototype.add = function patchedAdd(...objects) {
    if (this.__ATOMA_SPHERE_POLICY_GUARD === true) {
      return originalAdd.apply(this, objects);
    }
    this.__ATOMA_SPHERE_POLICY_GUARD = true;
    try {
      const filtered = [];
      for (const obj of objects) {
        if (!obj) continue;
        const res = sanitizeCandidateForAdd(obj, this, { phase: 'Object3D.add' });
        if (res.allow && res.node) filtered.push(res.node);
      }
      if (filtered.length === 0) return this;
      const result = originalAdd.apply(this, filtered);
      if (_policyState && this?.isScene === true) {
        for (const obj of filtered) {
          if (!obj) continue;
          if (obj.isScene === true) continue;
          _policyState.roots.set(obj, obj.name || obj.uuid || 'scene-child-root');
        }
      }
      return result;
    } finally {
      this.__ATOMA_SPHERE_POLICY_GUARD = false;
    }
  };
  _object3DAddPatched = true;
  return true;
}

function installSpherePolicy(scene, options = {}) {
  const ready = patchObject3DAdd();
  if (!ready) return null;

  if (!_policyState) {
    _policyState = {
      roots: new Map(),
      stats: {
        blocked: 0,
        removed: 0,
        clamped: 0,
        sweeps: 0,
      },
      lastSweepTime: 0,
      sweepIntervalMs: Number.isFinite(options.sweepIntervalMs) ? options.sweepIntervalMs : 100,
    };
  }
  if (scene) _policyState.roots.set(scene, options.label || 'main-scene');

  const api = {
    validateObject3D: (root, context = null) => {
      const res = validateObject3D(root, context);
      _policyState.stats.removed += res.removed;
      _policyState.stats.clamped += res.clamped;
      return res;
    },
    registerRoot: (root, label = 'unnamed-root') => {
      if (!root) return false;
      _policyState.roots.set(root, label);
      return true;
    },
    unregisterRoot: (root) => {
      if (!root) return false;
      return _policyState.roots.delete(root);
    },
    sweepAllRoots: (force = false, context = null) => {
      const now = performance.now();
      if (!force && now - _policyState.lastSweepTime < _policyState.sweepIntervalMs) return { skipped: true };
      _policyState.lastSweepTime = now;
      let removed = 0;
      let clamped = 0;
      _policyState.stats.sweeps++;
      for (const [root, label] of _policyState.roots.entries()) {
        const res = validateObject3D(root, context || { phase: 'sweep', root: label });
        removed += res.removed;
        clamped += res.clamped;
      }
      _policyState.stats.removed += removed;
      _policyState.stats.clamped += clamped;
      return { removed, clamped };
    },
    sweep: (force = false, context = null) => api.sweepAllRoots(force, context),
    getStats: () => ({ ..._policyState.stats }),
  };

  if (typeof window !== 'undefined') {
    window.__ATOMA_SPHERE_POLICY__ = api;
    window.__ATOMA_SPHERE_POLICY_READY = true;
  }
  return api;
}

function ensureSpherePolicyInstalled(options = {}) {
  if (_policyState) return window?.__ATOMA_SPHERE_POLICY__ || null;
  if (_installingGuard) return null;
  _installingGuard = true;
  try {
    const api = installSpherePolicy(null, options);
    if (api) return api;
  } finally {
    _installingGuard = false;
  }

  if (_installAttempts >= 20) return null;
  _installAttempts++;
  queueMicrotask(() => ensureSpherePolicyInstalled(options));
  setTimeout(() => ensureSpherePolicyInstalled(options), 25);
  return null;
}

// Best-effort early install as soon as module is imported.
ensureSpherePolicyInstalled();

export {
  ensureSpherePolicyInstalled,
  installSpherePolicy,
  validateObject3D,
  tagAllowedSphere,
  tagSphere,
  clampSphere,
  isIllegalVisibleSphere,
};
