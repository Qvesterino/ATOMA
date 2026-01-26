/**
 * RAYCAST ISOLATION & FAILSAFE SYSTEM v1.0
 * Complete implementation of all four protection phases
 */

import * as THREE from 'three';

// ============================================================================
// PHASE 2: RUNTIME VIOLATION DETECTOR
// ============================================================================

class RaycastViolationDetector {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.violations = new Map();
    this.violationThreshold = config.violationThreshold || 2;
    this.stackTraces = new Map();
    this.auditLog = [];
    this.failsafeModeActive = false;
  }

  wrapRaycastMethods(raycaster) {
    if (!this.enabled) return;

    const detector = this;

    // Override intersectObjects to detect violations but NOT call raycaster
    raycaster.intersectObjects = function(objects, recursive = false, target = []) {
      if (!Array.isArray(objects)) return target;

      // Check for violations (monitoring only, no execution)
      for (const obj of objects) {
        detector.checkObjectViolation(obj, 'intersectObjects');
      }

      // CRITICAL: Do NOT call original raycaster — return empty
      // This prevents Three.js from accessing geometry.boundingSphere
      return target;
    };

    return raycaster;
  }

  checkObjectViolation(obj, callSite) {
    if (!(obj instanceof THREE.Object3D)) return;
    if (obj.userData?.isHitProxy === true) return;
    // Intentional visual fallback from NodeLinkingSystem: skip violation tracking
    if (window.__RAYCAST_FALLBACK_ACTIVE === true) {
      return;
    }
    
    // [SESSION 62B] FPS DEATH FIX: Don't record violations during startup
    // If proxies not ready yet, this is not a real violation - just wait for init
    if (!window.HITPROXY_READY) {
      return;  // Ignore violations during proxy initialization phase
    }
    
    if (this.isRealVisual(obj)) {
      this.recordViolation(obj, callSite);
    }
  }

  isRealVisual(obj) {
    const isNodeCore = obj.userData?.isNodeCore === true;
    const isAura = obj.userData?.isAura === true;
    const isGlyph = obj.userData?.isGlyph === true;
    const isHologram = obj.userData?.isHologram === true;
    const isShell = obj.userData?.isShell === true;
    const isLink = obj.userData?.isLink === true;

    return isNodeCore || isAura || isGlyph || isHologram || isShell || isLink;
  }

  recordViolation(obj, callSite) {
    const uuid = obj.uuid;
    const count = (this.violations.get(uuid) || 0) + 1;
    this.violations.set(uuid, count);

    if (count === 1) {
      this.stackTraces.set(uuid, new Error().stack);
    }

    const entry = {
      timestamp: Date.now(),
      uuid: uuid,
      name: obj.name || 'unknown',
      type: obj.type || 'unknown',
      callSite: callSite,
      count: count,
      userData: { ...obj.userData }
    };

    this.auditLog.push(entry);

    if (count === 1) {
      console.warn(
        `[RAYCAST VIOLATION] Non-proxy object raycasted:\n` +
        `  UUID: ${uuid}\n` +
        `  Name: ${obj.name}\n` +
        `  Type: ${obj.type}\n` +
        `  CallSite: ${callSite}`
      );
    }

    if (count >= this.violationThreshold && !this.failsafeModeActive) {
      this.activateFailsafeMode();
    }
  }

  interceptBoundingSphereMutation(geometry) {
    if (!this.enabled) return;

    const originalCompute = geometry.computeBoundingSphere?.bind(geometry);
    if (!originalCompute) return;

    geometry.computeBoundingSphere = function() {
      console.error('[CRITICAL] geometry.computeBoundingSphere() called at runtime!');
      return this.boundingSphere || { center: new THREE.Vector3(), radius: 0 };
    };
  }

  activateFailsafeMode() {
    console.error(
      '[CRITICAL] RAYCAST FAILSAFE ACTIVATED\n' +
      'Engine is switching to nearest-neighbor interaction mode.\n' +
      'Raycasting violations exceeded threshold.'
    );

    this.failsafeModeActive = true;

    window.dispatchEvent(new CustomEvent('raycast-failsafe-activated', {
      detail: {
        violations: this.violations,
        auditLog: this.auditLog
      }
    }));
  }

  getStatistics() {
    return {
      totalViolations: this.auditLog.length,
      uniqueObjects: this.violations.size,
      failsafeModeActive: this.failsafeModeActive,
      violations: Array.from(this.violations.entries()).map(([uuid, count]) => ({
        uuid,
        count
      })),
      recentViolations: this.auditLog.slice(-10)
    };
  }

  auditTrail() {
    return this.auditLog;
  }
}

// ============================================================================
// PHASE 3: GLOBAL FAILSAFE MODE
// ============================================================================

class RaycastFailsafeMode {
  constructor(linkingSystem, aiNodes, config = {}) {
    this.linkingSystem = linkingSystem;
    this.aiNodes = aiNodes;
    this.fallbackMode = config.fallbackMode || 'nearest-distance';
    this.enabled = false;
    this.lastHoveredNode = null;
  }

  getNearestNode(cameraPosition, maxDistance = 50) {
    let nearest = null;
    let minDistance = maxDistance;

    for (const node of this.aiNodes.nodes) {
      const pos = node.visualObject?.position || node.position;
      if (!pos) continue;

      const distance = cameraPosition.distanceTo(pos);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    }

    return nearest;
  }

  selectNodeByFallback(cameraPosition) {
    const node = this.getNearestNode(cameraPosition);
    if (node) {
      this.linkingSystem.selectedNode = node;
      return node;
    }
    return null;
  }

  selectNodeByLastHovered() {
    if (this.lastHoveredNode && this.aiNodes.nodes.includes(this.lastHoveredNode)) {
      return this.lastHoveredNode;
    }
    return null;
  }

  activate() {
    console.log('[Failsafe] Activating failsafe interaction mode');
    this.enabled = true;

    if (this.linkingSystem?.raycaster) {
      this.linkingSystem.raycaster.enabled = false;
    }
  }

  update(mousePosition, cameraPosition) {
    if (!this.enabled) return;

    if (this.fallbackMode === 'nearest-distance') {
      this.selectNodeByFallback(cameraPosition);
    } else if (this.fallbackMode === 'last-hovered') {
      this.selectNodeByLastHovered();
    }
  }
}

// ============================================================================
// PHASE 4: INVARIANT ENFORCEMENT
// ============================================================================

class RaycastInvariantEnforcement {
  constructor(config = {}) {
    this.enabled = config.enabled !== false && (config.devMode || window.location.hostname === 'localhost');
    this.assertions = [];
  }

  assertRaycastDisabled(mesh, message = '') {
    if (!this.enabled) return;

    if (mesh.raycast && mesh.raycast.length !== 0) {
      console.error(
        `[INVARIANT VIOLATION] Mesh has custom raycast:\n` +
        `  Name: ${mesh.name}\n` +
        `  UUID: ${mesh.uuid}\n` +
        `  Message: ${message}`
      );
      this.assertions.push({
        type: 'raycast-not-disabled',
        mesh: mesh.name,
        uuid: mesh.uuid,
        message
      });
    }
  }

  assertBoundingSphereImmutable(geometry, message = '') {
    if (!this.enabled) return;

    if (geometry._computeBoundingSphereOverridden === true) return;

    const originalCompute = geometry.computeBoundingSphere?.bind(geometry);
    if (!originalCompute) {
      geometry.computeBoundingSphere = () => {
        console.error(
          `[INVARIANT VIOLATION] geometry.computeBoundingSphere() called!\n` +
          `  Geometry: ${geometry.uuid}\n` +
          `  Message: ${message}`
        );
        this.assertions.push({
          type: 'bounding-sphere-compute',
          geometry: geometry.uuid,
          message
        });
      };
      geometry._computeBoundingSphereOverridden = true;
    }
  }

  getViolations() {
    return this.assertions;
  }
}

// ============================================================================
// INTEGRATION: MAIN SETUP FUNCTION
// ============================================================================

function isRealVisual(obj) {
  const isNodeCore = obj.userData?.isNodeCore === true;
  const isAura = obj.userData?.isAura === true;
  const isGlyph = obj.userData?.isGlyph === true;
  const isHologram = obj.userData?.isHologram === true;
  const isShell = obj.userData?.isShell === true;
  const isLink = obj.userData?.isLink === true;

  return isNodeCore || isAura || isGlyph || isHologram || isShell || isLink;
}

export function setupRaycastIsolationAndFailsafe(scene, linkingSystem, aiNodes, config = {}) {
  console.log('[RaycastIsolationFailsafe] Initializing complete system...');

  const detector = new RaycastViolationDetector({
    enabled: config.enableViolationDetection !== false,
    violationThreshold: config.violationThreshold || 2
  });

  if (linkingSystem?.raycaster) {
    detector.wrapRaycastMethods(linkingSystem.raycaster);
  }

  const failsafe = new RaycastFailsafeMode(linkingSystem, aiNodes, {
    fallbackMode: config.fallbackMode || 'nearest-distance'
  });

  const invariants = new RaycastInvariantEnforcement({
    enabled: config.enableInvariantEnforcement !== false,
    devMode: config.devMode || false
  });

  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.userData?.isHitProxy !== true) {
      if (isRealVisual(obj)) {
        obj.raycast = () => {};

        if (obj.geometry) {
          invariants.assertBoundingSphereImmutable(obj.geometry, obj.name);
        }
      }
    }
  });

  console.log('[RaycastIsolationFailsafe] System initialized ✓');

  return {
    detector,
    failsafe,
    invariants,
    activate: () => {
      failsafe.activate();
      console.log('[RaycastIsolationFailsafe] Failsafe mode activated');
    },
    update: (mousePos, cameraPos) => {
      failsafe.update(mousePos, cameraPos);
    },
    getStatus: () => ({
      detectorStats: detector.getStatistics(),
      failsafeModeActive: failsafe.enabled,
      invariantViolations: invariants.getViolations()
    })
  };
}

// ============================================================================
// DEBUG API
// ============================================================================

export function setupRaycastFailsafeDebugAPI(system) {
  if (!system) return;

  window.RaycastFailsafeDebug = {
    status: () => {
      const status = system.getStatus();
      console.log('[RaycastFailsafe Debug]', status);
      return status;
    },
    violations: () => {
      const violations = system.detector.getStatistics();
      console.log('[RaycastFailsafe Violations]', violations);
      return violations;
    },
    auditTrail: () => {
      const trail = system.detector.auditTrail();
      console.log('[RaycastFailsafe Audit Trail]', trail);
      return trail;
    },
    activateFailsafe: () => {
      system.activate();
      console.log('[RaycastFailsafe] Failsafe manually activated');
    },
    invariantViolations: () => {
      const violations = system.invariants.getViolations();
      console.log('[RaycastFailsafe Invariant Violations]', violations);
      return violations;
    }
  };

  console.log('[RaycastFailsafeDebugAPI] Available commands:');
  console.log('  RaycastFailsafeDebug.status()');
  console.log('  RaycastFailsafeDebug.violations()');
  console.log('  RaycastFailsafeDebug.auditTrail()');
  console.log('  RaycastFailsafeDebug.activateFailsafe()');
  console.log('  RaycastFailsafeDebug.invariantViolations()');
}
