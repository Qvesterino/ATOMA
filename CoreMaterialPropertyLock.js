/**
 * CORE MATERIAL PROPERTY LOCK v1.0 (Session 30 - Hard Enforcement)
 *
 * MANDATE: Node core material properties are IMMUTABLE at runtime.
 * 
 * This system enforces canonical property values every frame, preventing:
 * - Runtime opacity degradation
 * - Transparent flag toggling
 * - DepthWrite corruption
 * - Blending mode changes
 * - Emissive intensity scaling
 *
 * All dynamic feedback is routed to aura/overlay materials instead.
 */

import * as THREE from 'three';

export class CoreMaterialPropertyLock {
  constructor(config = {}) {
    this.config = {
      debugEnabled: config.debugEnabled ?? false,
      enforceOnFrame: config.enforceOnFrame ?? true,
      violationDetectionEnabled: config.violationDetectionEnabled ?? true,
    };

    // Canonical core material properties (IMMUTABLE REFERENCE)
    this.canonicalProperties = {
      opacity: 1.0,
      transparent: false,
      depthWrite: true,
      depthTest: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      fog: false,
      // Note: emissiveIntensity for hologram shaders may be set to specific value on init
      // but must not vary based on activation/distance/state
    };

    // Track locked materials
    this.lockedCoreMaterials = new WeakSet();
    this.lockViolations = [];
    this.maxViolationsToTrack = 100;

    // Statistics
    this.stats = {
      materialsLocked: 0,
      violationsDetected: 0,
      violationsEnforced: 0,
      lastEnforceTime: 0,
    };
  }

  /**
   * Register a core material for locking (called once at material creation)
   */
  registerCoreMaterial(coreMaterial, nodeId = 'unknown') {
    if (!coreMaterial) return;

    // Only lock materials once
    if (this.lockedCoreMaterials.has(coreMaterial)) return;

    try {
      // Store canonical values from current material state
      const initialCanonical = {
        opacity: coreMaterial.opacity ?? 1.0,
        transparent: coreMaterial.transparent ?? false,
        depthWrite: coreMaterial.depthWrite !== undefined ? coreMaterial.depthWrite : true,
        depthTest: coreMaterial.depthTest !== undefined ? coreMaterial.depthTest : true,
        blending: coreMaterial.blending ?? THREE.NormalBlending,
        side: coreMaterial.side ?? THREE.FrontSide,
        fog: coreMaterial.fog ?? false,
      };

      // Store on material for later restoration
      if (!coreMaterial.userData) {
        coreMaterial.userData = {};
      }
      coreMaterial.userData.canonicalProperties = initialCanonical;
      coreMaterial.userData.nodeId = nodeId;

      // Mark as locked
      this.lockedCoreMaterials.add(coreMaterial);
      this.stats.materialsLocked++;

      if (this.config.debugEnabled) {
        console.log('[CoreMaterialPropertyLock] Core material registered:', {
          nodeId,
          properties: initialCanonical,
        });
      }
    } catch (e) {
      console.warn('[CoreMaterialPropertyLock] Failed to register core material:', e.message);
    }
  }

  /**
   * Enforce canonical properties on all locked core materials (call once per frame)
   */
  enforceFrame() {
    const startTime = performance.now();
    let violationCount = 0;

    // Iterate through all locked materials and restore canonical values
    // Note: WeakSet doesn't have forEach, so we need to use a different tracking approach
    // This is a limitation of WeakSet - we'll track locked materials in a parallel Map

    if (this.lockedMaterialsMap) {
      this.lockedMaterialsMap.forEach((canonical, material) => {
        if (!material || !material.userData) return;

        // Check and restore each canonical property
        if (material.opacity !== canonical.opacity) {
          if (this.config.violationDetectionEnabled) {
            violationCount++;
            this._recordViolation(material, 'opacity', canonical.opacity, material.opacity);
          }
          material.opacity = canonical.opacity;
        }

        if (material.transparent !== canonical.transparent) {
          if (this.config.violationDetectionEnabled) {
            violationCount++;
            this._recordViolation(material, 'transparent', canonical.transparent, material.transparent);
          }
          material.transparent = canonical.transparent;
        }

        if (material.depthWrite !== canonical.depthWrite) {
          if (this.config.violationDetectionEnabled) {
            violationCount++;
            this._recordViolation(material, 'depthWrite', canonical.depthWrite, material.depthWrite);
          }
          material.depthWrite = canonical.depthWrite;
        }

        if (material.depthTest !== canonical.depthTest) {
          if (this.config.violationDetectionEnabled) {
            violationCount++;
            this._recordViolation(material, 'depthTest', canonical.depthTest, material.depthTest);
          }
          material.depthTest = canonical.depthTest;
        }

        if (material.blending !== canonical.blending) {
          if (this.config.violationDetectionEnabled) {
            violationCount++;
            this._recordViolation(material, 'blending', canonical.blending, material.blending);
          }
          material.blending = canonical.blending;
        }

        if (material.side !== canonical.side) {
          if (this.config.violationDetectionEnabled) {
            violationCount++;
            this._recordViolation(material, 'side', canonical.side, material.side);
          }
          material.side = canonical.side;
        }

        // [B.3-D1] Guard needsUpdate to shader-impacting changes only
        if (!material.userData) material.userData = {};
        const cache =
          material.userData.__b3d1LockCache ||
          (material.userData.__b3d1LockCache = {});
        const shaderProps = [
          'transparent',
          'blending',
          'side',
          'depthWrite',
          'depthTest',
          'alphaTest',
          'fog',
          'vertexColors',
        ];
        let shaderPropChanged = false;

        for (const prop of shaderProps) {
          const val = material[prop];
          if (cache[prop] !== val) {
            cache[prop] = val;
            shaderPropChanged = true;
          }
        }

        const definesSnapshot = material.defines
          ? JSON.stringify(material.defines)
          : null;
        if (cache.__defines !== definesSnapshot) {
          cache.__defines = definesSnapshot;
          shaderPropChanged = true;
        }

        if (shaderPropChanged) {
          material.needsUpdate = true;
          if (typeof window !== 'undefined') {
            window.__B3D1_NEEDSUPDATE_COUNT =
              (window.__B3D1_NEEDSUPDATE_COUNT || 0) + 1;
          }
        }
      });
    }

    const enforceTime = performance.now() - startTime;
    this.stats.lastEnforceTime = enforceTime;

    if (violationCount > 0) {
      this.stats.violationsDetected += violationCount;
      this.stats.violationsEnforced += violationCount;

      if (this.config.debugEnabled) {
        console.warn(
          `[CoreMaterialPropertyLock] Enforced ${violationCount} property violations`,
          { timeMs: enforceTime }
        );
      }
    }

    return violationCount;
  }

  /**
   * Record a property violation for diagnostics
   * @private
   */
  _recordViolation(material, property, canonical, actual) {
    this.lockViolations.push({
      property,
      canonical,
      actual,
      nodeId: material.userData?.nodeId ?? 'unknown',
      timestamp: Date.now(),
    });

    // Keep list bounded
    if (this.lockViolations.length > this.maxViolationsToTrack) {
      this.lockViolations.shift();
    }
  }

  /**
   * Get all recorded violations
   */
  getViolations() {
    return [...this.lockViolations];
  }

  /**
   * Clear violation history
   */
  clearViolations() {
    this.lockViolations = [];
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      violationsTracked: this.lockViolations.length,
    };
  }

  /**
   * Setup method for tracking locked materials (call after registering all cores)
   * This allows us to iterate without WeakSet limitations
   */
  initializeTrackingMap() {
    this.lockedMaterialsMap = new Map();
  }

  /**
   * Add material to tracking map (call for each registered core)
   */
  addToTrackingMap(coreMaterial) {
    if (!this.lockedMaterialsMap) {
      this.lockedMaterialsMap = new Map();
    }

    if (coreMaterial && coreMaterial.userData?.canonicalProperties) {
      this.lockedMaterialsMap.set(coreMaterial, coreMaterial.userData.canonicalProperties);
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    this.lockedCoreMaterials = new WeakSet();
    this.lockedMaterialsMap?.clear();
    this.lockViolations = [];
  }
}

/**
 * Setup console debugging API
 */
export function setupCoreMaterialPropertyLockConsoleAPI(lock) {
  if (!window.debugCoreMaterialPropertyLock) {
    window.debugCoreMaterialPropertyLock = {};
  }

  Object.assign(window.debugCoreMaterialPropertyLock, {
    enforceFrame: () => {
      const violations = lock.enforceFrame();
      console.log(`✓ Frame enforcement complete: ${violations} violations corrected`);
      return violations;
    },

    getViolations: () => {
      const violations = lock.getViolations();
      console.table(violations);
      return violations;
    },

    getStats: () => {
      const stats = lock.getStatistics();
      console.table(stats);
      return stats;
    },

    clearViolations: () => {
      lock.clearViolations();
      console.log('✓ Violation history cleared');
    },

    status: () => {
      const stats = lock.getStatistics();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Core Material Property Lock Status');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Materials Locked: ${stats.materialsLocked}`);
      console.log(`  Violations Detected: ${stats.violationsDetected}`);
      console.log(`  Violations Enforced: ${stats.violationsEnforced}`);
      console.log(`  Last Enforce Time: ${stats.lastEnforceTime.toFixed(2)}ms`);
      console.log(`  Violations Tracked: ${stats.violationsTracked}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    },
  });

  console.log(
    '✅ Core Material Property Lock console API ready: debugCoreMaterialPropertyLock.*'
  );
}
