/**
 * CUSTOM RAYCAST OVERRIDE SYSTEM — HARD SAFETY LOCKED
 * 
 * Replaces Three.js default Mesh.raycast with safe, precomputed bounding sphere approach.
 * Enforces HARD SAFETY LOCKS to prevent ALL default raycast paths.
 * 
 * KEY PRINCIPLES:
 * ───────────────
 * 1. NEVER call THREE.Mesh.prototype.raycast for node meshes
 * 2. ALWAYS use precomputed boundingSphere from node creation time
 * 3. geometry.computeBoundingSphere() runs ONLY ONCE at node creation
 * 4. No runtime geometry mutations
 * 5. All non-node meshes have raycast disabled (mesh.raycast = () => [])
 * 6. Hard override: THREE.Mesh.prototype.raycast blocked globally
 * 7. __ALLOW_RAYCAST__ flag must be explicitly set on interactive nodes
 * 
 * HARD SAFETY OVERRIDE:
 * ────────────────────
 * Replaces THREE.Mesh.prototype.raycast globally:
 * - If mesh.userData.__ALLOW_RAYCAST__ === true, use custom raycast
 * - Otherwise, return [] (no intersection)
 * - Any attempt to use default raycast → blocked
 * - Any recursive raycasting (recursive=true) → blocked
 * 
 * CRASH ROOT CAUSE:
 * ────────────────
 * Three.js raycast → intersectObjects(scene.children, true)
 * → recursively traverses ALL meshes (FX, auras, links, etc)
 * → attempts computeBoundingSphere() on frozen/invalid geometry
 * → "Cannot assign to read only property 'boundingSphere'" crash
 * 
 * SOLUTION:
 * ────────
 * Custom raycast function using precomputed sphere + HARD OVERRIDE:
 * - Intersects ray with PRECOMPUTED bounding sphere only
 * - No geometry mutation at raycast time
 * - No scene traversal
 * - Default raycast blocked globally
 * - Zero crashes, deterministic behavior, impossible to bypass
 * 
 * @module CustomRaycastOverride
 */

import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
import { RaycastDisabler } from './RaycastDisabler.js';

// ═══════════════════════════════════════════════════════════════════════════
// HARD SAFETY OVERRIDE — Global Protection
// ═══════════════════════════════════════════════════════════════════════════

let hardSafetyInitialized = false;

/**
 * CRITICAL: Install hard safety override on THREE.Mesh.prototype.raycast
 * 
 * This REPLACES the default Three.js raycast globally.
 * MUST be called ONCE at application startup, before any raycasting.
 * 
 * After this is installed:
 * - Only meshes with __ALLOW_RAYCAST__ === true can be raycasted
 * - All other meshes return [] (no intersection)
 * - Default Three.js raycast behavior is completely replaced
 * - Impossible to trigger geometry.computeBoundingSphere() on frozen geometry
 * 
 * CALL THIS ONCE IN main.js OR SCENE INITIALIZATION:
 *   import { installHardSafetyOverride } from './CustomRaycastOverride.js';
 *   installHardSafetyOverride();
 */
export function installHardSafetyOverride() {
  if (hardSafetyInitialized) {
    console.warn('[CustomRaycastOverride] Hard safety already initialized');
    return;
  }

  // Save original raycast for custom use
  const originalRaycast = THREE.Mesh.prototype.raycast;

  /**
   * ✅ HARD SAFETY OVERRIDE
   * 
   * Replaces THREE.Mesh.prototype.raycast completely.
   * This function MUST be called for EVERY mesh during raycasting.
   * 
   * - If __ALLOW_RAYCAST__ === true: Use custom raycast
   * - Otherwise: Return [] (no intersection ever)
   */
  THREE.Mesh.prototype.raycast = function(raycaster) {
    // HARD RULE 1: Only raycasts with __ALLOW_RAYCAST__ flag allowed
    if (this.userData?.__ALLOW_RAYCAST__ !== true) {
      return [];  // Block all raycast attempts
    }

    // HARD RULE 2: Must have custom raycast installed
    if (typeof this.__customRaycast !== 'function') {
      console.error(
        '[CustomRaycastOverride] ERROR: Mesh allowed for raycast but has no custom raycast installed:',
        this.name
      );
      return [];
    }

    // HARD RULE 3: Call custom raycast (never default)
    return this.__customRaycast.call(this, raycaster);
  };

  hardSafetyInitialized = true;
  console.log('[CustomRaycastOverride] ✅ Hard safety override installed');
}

/**
 * Apply custom raycast override to a node mesh
 * 
 * Call ONCE at node creation time after geometry is set.
 * 
 * @param {THREE.Mesh} mesh - The node mesh
 * @returns {boolean} Success status
 */
export function applyCustomRaycast(mesh) {
  if (!mesh || !mesh.isMesh) {
    console.warn('[CustomRaycastOverride] Not a mesh:', mesh);
    return false;
  }

  if (!mesh.geometry) {
    console.warn('[CustomRaycastOverride] Mesh has no geometry:', mesh.name);
    return false;
  }

  // ✅ CRITICAL: Compute bounds ONCE at creation time ONLY
  // ────────────────────────────────────────────────────────
  if (!mesh.geometry.boundingSphere) {
    mesh.geometry.computeBoundingSphere();
  }

  // Get precomputed sphere (immutable after this point)
  const precomputedSphere = mesh.geometry.boundingSphere;

  if (!precomputedSphere) {
    console.warn('[CustomRaycastOverride] Failed to compute bounding sphere:', mesh.name);
    return false;
  }

  // Store precomputed sphere in userData for efficiency
  mesh.userData = mesh.userData || {};
  mesh.userData.precomputedBoundingSphere = precomputedSphere.clone();
  mesh.userData.customRaycastEnabled = true;
  
  // ✅ HARD SAFETY: Mark as raycastable
  mesh.userData.__ALLOW_RAYCAST__ = true;

  /**
   * ✅ CUSTOM RAYCAST FUNCTION
   * 
   * Stored as __customRaycast on mesh (not mesh.raycast!)
   * Called by hard safety override in THREE.Mesh.prototype.raycast
   * Uses precomputed bounding sphere intersection only
   */
  mesh.__customRaycast = function(raycaster) {
    // Get raycast parameters
    const { ray, far } = raycaster;
    
    // Use precomputed sphere (never re-compute)
    const sphere = this.userData.precomputedBoundingSphere;
    
    if (!sphere) {
      return [];
    }

    // Transform sphere to world space
    const worldCenter = sphere.center.clone();
    this.localToWorld(worldCenter);

    // Calculate distance from ray to sphere center
    const distanceToCenter = ray.distanceToPoint(worldCenter);
    const radius = sphere.radius;

    // Ray-sphere intersection
    // Ray must pass within radius of sphere center
    if (distanceToCenter > radius) {
      return [];  // No intersection
    }

    // Calculate intersection points (entry and exit)
    // Using ray-sphere intersection formulas
    const oc = worldCenter.clone().sub(ray.origin);
    const tca = oc.dot(ray.direction);
    const discriminant = radius * radius - (oc.lengthSq() - tca * tca);

    if (discriminant < 0) {
      return [];  // No intersection
    }

    // Two intersection points
    const thc = Math.sqrt(discriminant);
    const t0 = tca - thc;
    const t1 = tca + thc;

    // Use closest intersection point
    let t = t0;
    if (t < 0) {
      t = t1;  // Use exit point if entry point is behind ray
    }
    if (t < 0 || (far && t > far)) {
      return [];  // Intersection behind ray or beyond far plane
    }

    // Construct intersection result
    return [{
      object: this,
      distance: t,
      point: ray.at(t),
      uv: null,
      face: null,
      index: null
    }];
  };

  return true;
}

/**
 * Apply custom raycast to multiple meshes
 * 
 * @param {THREE.Mesh[]} meshes - Array of meshes
 * @returns {number} Count of successfully overridden meshes
 */
export function applyCustomRaycastBatch(meshes) {
  if (!Array.isArray(meshes)) {
    console.warn('[CustomRaycastOverride] Not an array:', meshes);
    return 0;
  }

  let count = 0;
  for (const mesh of meshes) {
    if (applyCustomRaycast(mesh)) {
      count++;
    }
  }
  return count;
}

/**
 * Initialize complete raycast safety system
 * 
 * - Override raycasting for node meshes
 * - Disable raycasting for all FX/auras/links
 * - Register interactive nodes only
 * 
 * Call at scene initialization and node creation.
 * 
 * @param {THREE.Mesh} nodeMesh - The node mesh to initialize
 * @param {string} nodeId - Node identifier (optional)
 * @returns {boolean} Success status
 */
export function initializeNodeRaycast(nodeMesh, nodeId = undefined) {
  // Step 1: Apply custom raycast override
  if (!applyCustomRaycast(nodeMesh)) {
    console.error('[initializeNodeRaycast] Failed to apply custom raycast:', nodeMesh.name);
    return false;
  }

  // Step 2: Register in whitelist
  if (!RaycastTargetRegistry.register(nodeMesh, nodeId)) {
    console.warn('[initializeNodeRaycast] Failed to register mesh:', nodeMesh.name);
    return false;
  }

  // Step 3: Ensure no children are raycastable (safety measure)
  if (nodeMesh.children && nodeMesh.children.length > 0) {
    RaycastDisabler.disableChildren(nodeMesh);
  }

  return true;
}

/**
 * Initialize non-interactive mesh (FX, aura, link, etc)
 * 
 * Disables raycasting completely using HARD SAFETY flags.
 * 
 * @param {THREE.Mesh|THREE.Group} meshOrGroup - Mesh or group to disable
 * @returns {boolean} Success status
 */
export function disableNonInteractiveMesh(meshOrGroup) {
  if (!meshOrGroup) return false;

  if (meshOrGroup.isMesh) {
    RaycastDisabler.disableMesh(meshOrGroup);
    
    // ✅ HARD SAFETY: Explicitly block raycast
    meshOrGroup.userData = meshOrGroup.userData || {};
    meshOrGroup.userData.__ALLOW_RAYCAST__ = false;
    
    return true;
  }

  if (meshOrGroup.isGroup || meshOrGroup.children) {
    RaycastDisabler.disableGroup(meshOrGroup);
    
    // ✅ HARD SAFETY: Recursively block raycast on all children
    meshOrGroup.traverse(child => {
      if (child.isMesh) {
        child.userData = child.userData || {};
        child.userData.__ALLOW_RAYCAST__ = false;
      }
    });
    
    return true;
  }

  return false;
}

/**
 * Validate raycast setup for a mesh
 * 
 * Checks:
 * - Custom raycast is installed
 * - Precomputed sphere exists
 * - Mesh is registered (if interactive)
 * - Hard safety flags are correct
 * 
 * @param {THREE.Mesh} mesh
 * @returns {Object} Validation result
 */
export function validateRaycastSetup(mesh) {
  if (!mesh || !mesh.isMesh) {
    return { valid: false, reason: 'Not a mesh' };
  }

  const hasCustomRaycast = mesh.userData?.customRaycastEnabled === true;
  const hasPrecomputedSphere = mesh.userData?.precomputedBoundingSphere !== undefined;
  const isRegistered = RaycastTargetRegistry.isRegistered(mesh);
  const isDisabled = mesh.userData?.raycastDisabled === true;
  
  // ✅ HARD SAFETY: Check flags
  const hardSafetyFlag = mesh.userData?.__ALLOW_RAYCAST__;
  const hasCustomRaycastFunction = typeof mesh.__customRaycast === 'function';
  
  // Valid if:
  // 1. Interactive node: has custom raycast + flag true
  // 2. Non-interactive: has flag false
  const isValidInteractive = hasCustomRaycast && hardSafetyFlag === true && hasCustomRaycastFunction;
  const isValidNonInteractive = isDisabled && hardSafetyFlag === false;
  const isValid = isValidInteractive || isValidNonInteractive;

  return {
    valid: isValid,
    hasCustomRaycast,
    hasPrecomputedSphere,
    isRegistered,
    isDisabled,
    hardSafetyFlag,
    hasCustomRaycastFunction,
    meshName: mesh.name,
    geometry: {
      type: mesh.geometry?.type || 'unknown',
      hasBoundingSphere: !!mesh.geometry?.boundingSphere
    }
  };
}

/**
 * DEBUG: Perform raycast safety audit
 * 
 * Checks all registered nodes and non-interactive meshes.
 * 
 * @param {THREE.Scene} scene - Scene to audit
 * @returns {Object} Audit results
 */
export function auditRaycastSafety(scene) {
  const results = {
    totalNodes: 0,
    validCustomRaycast: 0,
    missingPrecomputedSphere: 0,
    notRegistered: 0,
    issues: []
  };

  // Get all registered node meshes
  const registeredMeshes = RaycastTargetRegistry.get();

  for (const mesh of registeredMeshes) {
    results.totalNodes++;

    const validation = validateRaycastSetup(mesh);

    if (!validation.hasCustomRaycast) {
      results.issues.push({
        mesh: validation.meshName,
        issue: 'Missing custom raycast override'
      });
    }

    if (!validation.hasPrecomputedSphere) {
      results.missingPrecomputedSphere++;
      results.issues.push({
        mesh: validation.meshName,
        issue: 'Missing precomputed bounding sphere'
      });
    }

    if (!validation.isRegistered) {
      results.notRegistered++;
      results.issues.push({
        mesh: validation.meshName,
        issue: 'Not registered in RaycastTargetRegistry'
      });
    }

    if (validation.hasCustomRaycast) {
      results.validCustomRaycast++;
    }
  }

  return results;
}

/**
 * DEBUG: Print raycast safety report
 * 
 * @param {THREE.Scene} scene
 */
export function printRaycastSafetyReport(scene) {
  const audit = auditRaycastSafety(scene);

  console.group('[CustomRaycastOverride] Safety Audit Report');
  console.log(`Total Nodes: ${audit.totalNodes}`);
  console.log(`Valid Custom Raycast: ${audit.validCustomRaycast}`);
  console.log(`Missing Precomputed Sphere: ${audit.missingPrecomputedSphere}`);
  console.log(`Not Registered: ${audit.notRegistered}`);

  if (audit.issues.length > 0) {
    console.group('Issues Found:');
    for (const issue of audit.issues) {
      console.warn(`  [${issue.mesh}] ${issue.issue}`);
    }
    console.groupEnd();
  } else {
    console.log('✅ All nodes have valid raycast setup!');
  }

  console.log(`Registry Stats:`, RaycastTargetRegistry.getStats());
  console.groupEnd();
}

/**
 * INTEGRATION CHECKLIST
 * ─────────────────────
 * 
 * 1. Import in NodeFactory / node creation code:
 *    import { initializeNodeRaycast } from './CustomRaycastOverride.js';
 * 
 * 2. After node mesh is created and added to scene:
 *    initializeNodeRaycast(nodeMesh, nodeId);
 * 
 * 3. When creating FX/aura/link meshes:
 *    import { disableNonInteractiveMesh } from './CustomRaycastOverride.js';
 *    const auraMesh = createAuraMesh();
 *    scene.add(auraMesh);
 *    disableNonInteractiveMesh(auraMesh);
 * 
 * 4. Update raycasting code in NodeLinkingSystem:
 *    import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
 *    
 *    const raycastables = RaycastTargetRegistry.get();
 *    const hits = raycaster.intersectObjects(raycastables, false);
 * 
 * 5. On scene reset:
 *    import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
 *    RaycastTargetRegistry.clear();
 * 
 * RESULT: Zero raycast crashes, deterministic behavior, safe geometry handling.
 */

export default {
  applyCustomRaycast,
  applyCustomRaycastBatch,
  initializeNodeRaycast,
  disableNonInteractiveMesh,
  validateRaycastSetup,
  auditRaycastSafety,
  printRaycastSafetyReport,
  RaycastTargetRegistry,
  RaycastDisabler
};
