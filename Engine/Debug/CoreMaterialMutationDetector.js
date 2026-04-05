/**
 * CORE MATERIAL MUTATION DETECTOR v1.0
 * 
 * Automated runtime detection of unauthorized core material modifications.
 * Monitors all node cores for contract violations and reports violations
 * with detailed diagnostics.
 * 
 * Features:
 * - Continuous monitoring of core material properties
 * - Mutation detection with timestamps
 * - Violation classification and severity
 * - Detailed diagnostic reporting
 * - Console APIs for debugging
 * - Integration with NodeCoreMaterialAuthority
 * 
 * Zero performance impact in production (event-driven, not per-frame).
 */

import * as THREE from 'three';

// [B.3-M2] Frame-level cap for shader-invalidating updates
let __B3_MUTATION_NEEDSUPDATE_THIS_FRAME = 0;
let __B3_MUTATION_RAF_SCHEDULED = false;
function __b3MutationResetFrameCounter() {
  __B3_MUTATION_NEEDSUPDATE_THIS_FRAME = 0;
  __B3_MUTATION_RAF_SCHEDULED = false;
}

// [B.3-M2] NeedsUpdate guard with per-frame cap and debug counters
function __b3MutationFlagNeedsUpdate(material) {
  if (!material) return;
  if (!__B3_MUTATION_RAF_SCHEDULED && typeof requestAnimationFrame === 'function') {
    __B3_MUTATION_RAF_SCHEDULED = true;
    requestAnimationFrame(__b3MutationResetFrameCounter);
  }
  const CAP = 8;
  if (__B3_MUTATION_NEEDSUPDATE_THIS_FRAME >= CAP) return;
  __B3_MUTATION_NEEDSUPDATE_THIS_FRAME++;
  material.needsUpdate = true;
  if (typeof window !== 'undefined') {
    window.__B3_MUTATION_NEEDSUPDATE = (window.__B3_MUTATION_NEEDSUPDATE || 0) + 1;
  }
}

// [B.3-M2] Apply property changes with per-material cache to avoid redundant enforcement
function __b3MutationApply(material, changes) {
  if (!material) return { shaderChanged: false, anyChanged: false };
  if (!material.userData) material.userData = {};
  const cache =
    material.userData.__b3MutationCache || (material.userData.__b3MutationCache = {});

  const shaderProps = ['transparent', 'blending', 'side', 'depthWrite', 'depthTest'];
  let shaderChanged = false;
  let anyChanged = false;

  for (const [prop, val] of Object.entries(changes)) {
    const current = material[prop];
    const cached = cache[prop];
    if (current === val && cached === val) continue;

    material[prop] = val;
    cache[prop] = val;
    anyChanged = true;
    if (shaderProps.includes(prop)) {
      shaderChanged = true;
    }

    if (typeof window !== 'undefined') {
      window.__B3_MUTATION_ENFORCEMENTS = (window.__B3_MUTATION_ENFORCEMENTS || 0) + 1;
    }
  }

  return { shaderChanged, anyChanged };
}

export class CoreMaterialMutationDetector {
  constructor(config = {}) {
    this.config = {
      debugEnabled: config.debugEnabled ?? false,
      reportViolations: config.reportViolations ?? true,
      autoRepair: config.autoRepair ?? true,
      maxViolationsToReport: config.maxViolationsToReport ?? 100,
    };

    // Track baseline core material states
    // Using Map instead of WeakMap to enable iteration (.forEach)
    // in checkAllCores() and clearHistory()
    this.coreSnapshots = new Map();

    // Violation history
    this.violations = [];

    // Mutable core registry (for tracking state changes)
    this.trackedCores = new WeakMap();

    // Statistics
    this.stats = {
      coresMonitored: 0,
      violationsDetected: 0,
      violationsRepaired: 0,
      lastCheckTime: 0,
      totalCheckTime: 0,
      checkCount: 0,
    };

    // Immutable property definitions
    this.immutableProperties = [
      'opacity',
      'emissiveIntensity',
      'blendMode',
      'transparent',
      'depthWrite',
      'depthTest',
      'toneMapped',
      'fog',
      'side',
    ];
  }

  /**
   * Register a core mesh for monitoring
   */
  registerCore(node, coreMesh) {
    if (!node || !coreMesh || !coreMesh.material) {
      return;
    }

    try {
      // Snapshot the baseline state
      const snapshot = this._captureSnapshot(coreMesh);
      this.coreSnapshots.set(node, {
        mesh: coreMesh,
        baseline: snapshot,
        lastSnapshot: snapshot,
        lastCheckTime: Date.now(),
        violations: [],
      });

      // Track mutable state
      this.trackedCores.set(coreMesh, {
        nodeRef: node,
        registeredAt: Date.now(),
        checkCount: 0,
      });

      this.stats.coresMonitored++;

      if (this.config.debugEnabled) {
        console.log('[CoreMutationDetector] Core registered:', {
          nodeId: node.userData?.id,
          properties: Object.keys(snapshot),
        });
      }
    } catch (e) {
      console.warn('[CoreMutationDetector] Failed to register core:', e.message);
    }
  }

  /**
   * Check a single core for mutations
   */
  checkCore(node) {
    if (!node) return null;

    const coreData = this.coreSnapshots.get(node);
    if (!coreData) return null;

    try {
      const { mesh, baseline, lastSnapshot } = coreData;
      if (!mesh || !mesh.material) return null;

      // Capture current state
      const currentSnapshot = this._captureSnapshot(mesh);

    // Compare with baseline
    const violations = this._detectMutations(
      baseline,
      currentSnapshot,
      mesh
    );

      // Update tracking
      coreData.lastSnapshot = currentSnapshot;
      coreData.lastCheckTime = Date.now();

      // Report violations
      if (violations.length > 0) {
        this._handleViolations(node, mesh, violations);
        return violations;
      }

      return null;
    } catch (e) {
      console.warn('[CoreMutationDetector] Check failed:', e.message);
      return null;
    }
  }

  /**
   * Check all registered cores
   */
  checkAllCores() {
    let violationCount = 0;
    const startTime = performance.now();

    this.coreSnapshots.forEach((coreData, node) => {
      const violations = this.checkCore(node);
      if (violations && violations.length > 0) {
        violationCount += violations.length;
      }
    });

    const checkTime = performance.now() - startTime;
    this.stats.totalCheckTime += checkTime;
    this.stats.checkCount++;
    this.stats.lastCheckTime = checkTime;

    if (this.config.debugEnabled && violationCount > 0) {
      console.log(
        `[CoreMutationDetector] Check complete: ${violationCount} violations detected`,
        { checkTimeMs: checkTime }
      );
    }

    return violationCount;
  }

  /**
   * Capture snapshot of core material properties
   */
  _captureSnapshot(coreMesh) {
    if (!coreMesh || !coreMesh.material) return {};

    const material = coreMesh.material;
    const snapshot = {};

    for (const prop of this.immutableProperties) {
      if (prop in material) {
        const value = material[prop];

        // Handle THREE.js color/vector types
        if (value && typeof value.clone === 'function') {
          snapshot[prop] = value.clone();
        } else if (value !== null && typeof value === 'object') {
          snapshot[prop] = JSON.parse(JSON.stringify(value));
        } else {
          snapshot[prop] = value;
        }
      }
    }

    // Also track scale for reference
    snapshot._scale = coreMesh.scale.clone();

    return snapshot;
  }

  /**
   * Detect mutations by comparing snapshots
   */
  _detectMutations(baseline, current, coreMesh) {
    const violations = [];
    const material = coreMesh.material;

    for (const prop of this.immutableProperties) {
      if (!(prop in baseline)) continue;

      const baselineValue = baseline[prop];
      const currentValue = current[prop];

      // Compare values
      if (!this._valuesEqual(baselineValue, currentValue)) {
        violations.push({
          property: prop,
          baseline: baselineValue,
          current: currentValue,
          severity: this._getSeverity(prop),
          type: this._classifyMutation(prop, baselineValue, currentValue),
          timestamp: Date.now(),
          coreMesh: coreMesh,
        });
      }
    }

    return violations;
  }

  /**
   * Compare two values (handles THREE.js types and primitives)
   */
  _valuesEqual(a, b) {
    // Handle THREE.js colors
    if (a && b && typeof a.equals === 'function') {
      return a.equals(b);
    }

    // Handle primitives
    if (a === b) return true;

    // Handle numbers with epsilon for floating point
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) < 0.0001;
    }

    return false;
  }

  /**
   * Classify mutation type
   */
  _classifyMutation(property, baseline, current) {
    if (property === 'opacity') {
      if (current < baseline) return 'opacity_reduced';
      if (current > baseline) return 'opacity_increased';
      return 'opacity_changed';
    }

    if (property === 'emissiveIntensity') {
      if (current < baseline) return 'emissive_dimmed';
      if (current > baseline) return 'emissive_boosted';
      return 'emissive_changed';
    }

    if (property === 'blendMode') {
      return 'blend_mode_changed';
    }

    if (property === 'depthWrite') {
      return 'depth_write_changed';
    }

    if (property === 'transparent') {
      return 'transparency_changed';
    }

    return 'property_changed';
  }

  /**
   * Get severity level
   */
  _getSeverity(property) {
    const criticalProperties = [
      'blendMode',
      'depthWrite',
      'opacity',
      'emissiveIntensity',
    ];

    return criticalProperties.includes(property) ? 'CRITICAL' : 'HIGH';
  }

  /**
   * Handle detected violations
   */
  _handleViolations(node, coreMesh, violations) {
    const coreData = this.coreSnapshots.get(node);
    if (!coreData) return;

    this.stats.violationsDetected += violations.length;

    // Store violations
    coreData.violations.push(...violations);
    if (coreData.violations.length > 100) {
      coreData.violations.shift(); // Keep size bounded
    }

    // Report violations
    if (this.config.reportViolations) {
      for (const violation of violations) {
        this._reportViolation(node, violation);
      }
    }

    // Auto-repair if enabled
    if (this.config.autoRepair) {
      this._repairViolation(coreMesh, violations[0]);
    }
  }

  /**
   * Report a single violation
   */
  _reportViolation(node, violation) {
    if (this.violations.length >= this.config.maxViolationsToReport) {
      return; // Don't spam
    }

    const record = {
      nodeId: node.userData?.id,
      property: violation.property,
      baseline: violation.baseline,
      current: violation.current,
      type: violation.type,
      severity: violation.severity,
      timestamp: violation.timestamp,
      repaired: false,
    };

    this.violations.push(record);

    // [B.3-M2] Detection counter (no logging)
    if (typeof window !== 'undefined') {
      window.__B3_MUTATION_DETECTIONS = (window.__B3_MUTATION_DETECTIONS || 0) + 1;
    }
  }

  /**
   * Repair a violation
   */
  _repairViolation(coreMesh, violation) {
    if (!coreMesh || !coreMesh.material) return;

    try {
      const material = coreMesh.material;
      const { property, baseline } = violation;

      // [B.3-M2] Restore baseline with caching to avoid redundant invalidation
      const { shaderChanged, anyChanged } = __b3MutationApply(material, { [property]: baseline });
      if (anyChanged && shaderChanged) {
        __b3MutationFlagNeedsUpdate(material);
      }

      this.stats.violationsRepaired++;

      if (typeof window !== 'undefined') {
        window.__B3_MUTATION_DETECTIONS = (window.__B3_MUTATION_DETECTIONS || 0) + 1;
      }
    } catch (e) {
      console.error('[CoreMutationDetector] Failed to repair violation:', e);
    }
  }

  /**
   * Get violation history for a node
   */
  getViolationHistory(node) {
    if (!node) return [];

    const coreData = this.coreSnapshots.get(node);
    return coreData ? coreData.violations : [];
  }

  /**
   * Get all violations
   */
  getAllViolations() {
    return [...this.violations];
  }

  /**
   * Clear violation history
   */
  clearHistory() {
    this.violations = [];

    this.coreSnapshots.forEach((coreData) => {
      coreData.violations = [];
    });
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      averageCheckTimeMs:
        this.stats.checkCount > 0
          ? this.stats.totalCheckTime / this.stats.checkCount
          : 0,
      totalViolations: this.violations.length,
    };
  }

  /**
   * Unregister a core
   */
  unregisterCore(node) {
    this.coreSnapshots.delete(node);
    this.stats.coresMonitored--;
  }

  /**
   * Clear all registrations
   */
  dispose() {
    this.coreSnapshots = new Map();
    this.trackedCores = new WeakMap();
    this.violations = [];
    this.stats.coresMonitored = 0;
  }
}

/**
 * Setup console debugging API
 */
export function setupCoreMutationDetectorConsoleAPI(detector) {
  if (!window.debugCoreMutationDetector) {
    window.debugCoreMutationDetector = {};
  }

  Object.assign(window.debugCoreMutationDetector, {
    checkAllCores: () => {
      const violations = detector.checkAllCores();
      console.log(`✓ Mutation check complete: ${violations} violations detected`);
      return violations;
    },

    getViolations: (node) => {
      if (node) {
        const violations = detector.getViolationHistory(node);
        console.table(violations);
        return violations;
      } else {
        const all = detector.getAllViolations();
        console.table(all);
        return all;
      }
    },

    getStats: () => {
      const stats = detector.getStatistics();
      console.table(stats);
      return stats;
    },

    clearHistory: () => {
      detector.clearHistory();
      console.log('✓ Violation history cleared');
    },

    registerCore: (node, coreMesh) => {
      detector.registerCore(node, coreMesh);
      console.log('✓ Core registered for monitoring');
    },

    unregisterCore: (node) => {
      detector.unregisterCore(node);
      console.log('✓ Core unregistered');
    },

    setAutoRepair: (enabled) => {
      detector.config.autoRepair = enabled;
      console.log(`✓ Auto-repair: ${enabled ? 'ON' : 'OFF'}`);
    },

    setReportViolations: (enabled) => {
      detector.config.reportViolations = enabled;
      console.log(`✓ Violation reporting: ${enabled ? 'ON' : 'OFF'}`);
    },

    setDebugMode: (enabled) => {
      detector.config.debugEnabled = enabled;
      console.log(`✓ Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    },

    status: () => {
      const stats = detector.getStatistics();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Core Material Mutation Detector Status');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Cores Monitored: ${stats.coresMonitored}`);
      console.log(`  Violations Detected: ${stats.violationsDetected}`);
      console.log(`  Violations Repaired: ${stats.violationsRepaired}`);
      console.log(
        `  Last Check Time: ${stats.lastCheckTime.toFixed(2)}ms`
      );
      console.log(
        `  Average Check Time: ${stats.averageCheckTimeMs.toFixed(2)}ms`
      );
      console.log(`  Total Checks: ${stats.checkCount}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    },
  });

  console.log(
    '✅ Core Material Mutation Detector console API ready: debugCoreMutationDetector.*'
  );
}
