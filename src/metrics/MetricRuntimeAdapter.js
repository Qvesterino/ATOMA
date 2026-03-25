/**
 * METRIC RUNTIME ADAPTER v2.0
 * 
 * PURPOSE:
 * - Manages runtime visual state ONLY (node.userData.runtime.*, link.userData.runtime.*)
 * - All metric reads delegated to SemanticMetricAdapter
 * 
 * ARCHITECTURAL CONTRACT:
 * - Canonical metrics: Use SemanticMetricAdapter.getNodeCanonicalMetrics() / getLinkSynergy() / getLinkCorruption()
 * - Canonical link visual profile: Use SemanticMetricAdapter.getLinkSynergyVisualMetrics()
 * - Runtime visual state: This adapter manages runtime.* paths
 * - NO metric reading logic in this file
 * 
 * MIGRATION NOTES:
 * - getMetric() → Use SemanticMetricAdapter.getNodeCanonicalMetrics()
 * - getSynergy() → Use SemanticMetricAdapter.getLinkSynergy()
 * - getCorruption() → Use SemanticMetricAdapter.getLinkCorruption()
 */

import {
  getNodeCanonicalMetrics,
  getLinkSynergy,
  getLinkCorruption,
  getLinkCanonicalMetrics,
  getLinkSynergyVisualMetrics,
  clearLegacyWarningCache
} from '../../SemanticMetricAdapter.js';

// ============================================================================
// NODE RUNTIME STATE ADAPTER
// ============================================================================

/**
 * Adapter for node runtime visual state management
 */
export class NodeMetricRuntimeAdapter {
  /**
   * Get canonical metric (DELEGATED to SemanticMetricAdapter)
   * @deprecated Use SemanticMetricAdapter.getNodeCanonicalMetrics() directly
   */
  static getMetric(node, metric) {
    const metrics = getNodeCanonicalMetrics(node);
    return metrics[metric] ?? 0;
  }

  /**
   * Get all canonical metrics as object (DELEGATED to SemanticMetricAdapter)
   * @deprecated Use SemanticMetricAdapter.getNodeCanonicalMetrics() directly
   */
  static getAllMetrics(node) {
    return getNodeCanonicalMetrics(node);
  }

  /**
   * Get runtime visual state
   * @param {THREE.Object3D} node - Node object
   * @param {string} path - Runtime state path (e.g., 'effectsState.synergyPulse.active')
   * @returns {*} Runtime state value
   */
  static getRuntimeState(node, path) {
    if (!node?.userData?.runtime) {
      return undefined;
    }

    const parts = path.split('.');
    let current = node.userData.runtime;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Set runtime visual state
   * @param {THREE.Object3D} node - Node object
   * @param {string} path - Runtime state path
   * @param {*} value - Value to set
   */
  static setRuntimeState(node, path, value) {
    if (!node) {
      console.warn('[NodeMetricRuntimeAdapter] Cannot set runtime state on null node');
      return;
    }

    if (!node.userData) node.userData = {};
    if (!node.userData.runtime) node.userData.runtime = this._initializeRuntimeState();

    const parts = path.split('.');
    let current = node.userData.runtime;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Initialize runtime state structure
   * @returns {Object} Initialized runtime state
   */
  static _initializeRuntimeState() {
    return {
      visualState: {
        ready: false,
        readyAt: 0,
        applied: false,
        appliedAt: 0,
        restoredAt: 0
      },
      effectsState: {
        synergyPulse: {
          active: false,
          score: 0,
          lastPulseTime: 0
        },
        harmonyStabilized: {
          active: false,
          dampingFactor: 0
        },
        corruptionVisual: {
          colorTint: { r: 1, g: 1, b: 1 },
          intensity: 0
        },
        harmonyVisual: {
          auraTint: { r: 0.2, g: 0.9, b: 0.8 },
          intensity: 0
        }
      },
      animationState: {
        bobPhase: 0,
        destabilization: 0,
        tearPhase: 0
      },
      metadata: {
        visualRoot: null,
        visualType: null,
        visualLocked: false,
        visualCode: null,
        visualProfile: null,
        visualCoreImmutable: false
      }
    };
  }

  /**
   * Ensure runtime state is initialized
   * @param {THREE.Object3D} node - Node object
   */
  static ensureRuntimeState(node) {
    if (!node?.userData?.runtime) {
      if (!node.userData) node.userData = {};
      node.userData.runtime = this._initializeRuntimeState();
    }
  }

  /**
   * Migrate scattered legacy runtime state to structured format
   * @param {THREE.Object3D} node - Node object
   * @returns {Object} Migration report
   */
  static migrateRuntimeState(node) {
    if (!node?.userData) {
      return { migrated: false, reason: 'Node has no userData' };
    }

    const report = {
      migrated: false,
      fieldsMigrated: [],
      warnings: []
    };

    this.ensureRuntimeState(node);
    const runtime = node.userData.runtime;
    const userData = node.userData;

    // Migrate synergy pulse state
    if (userData.synergyPulseActive !== undefined || userData.synergyScore !== undefined || userData.lastPulseTime !== undefined) {
      runtime.effectsState.synergyPulse.active = userData.synergyPulseActive ?? false;
      runtime.effectsState.synergyPulse.score = userData.synergyScore ?? 0;
      runtime.effectsState.synergyPulse.lastPulseTime = userData.lastPulseTime ?? 0;
      report.fieldsMigrated.push('synergyPulse');
    }

    // Migrate harmony stabilized state
    if (userData.harmonyStabilized !== undefined || userData.harmonyDampingFactor !== undefined) {
      runtime.effectsState.harmonyStabilized.active = userData.harmonyStabilized ?? false;
      runtime.effectsState.harmonyStabilized.dampingFactor = userData.harmonyDampingFactor ?? 0;
      report.fieldsMigrated.push('harmonyStabilized');
    }

    // Migrate visual state flags
    if (userData.visualReady !== undefined) {
      runtime.visualState.ready = userData.visualReady;
      runtime.visualState.readyAt = userData.visualReadyAt ?? 0;
      report.fieldsMigrated.push('visualReady');
    }

    if (userData.visualStateApplied !== undefined) {
      runtime.visualState.applied = userData.visualStateApplied;
      runtime.visualState.appliedAt = userData.visualStateAppliedAt ?? 0;
      report.fieldsMigrated.push('visualStateApplied');
    }

    if (userData.visualStateRestoredAt !== undefined) {
      runtime.visualState.restoredAt = userData.visualStateRestoredAt;
      report.fieldsMigrated.push('visualStateRestoredAt');
    }

    // Migrate visual metadata
    if (userData.visualRoot !== undefined) {
      runtime.metadata.visualRoot = userData.visualRoot;
      report.fieldsMigrated.push('visualRoot');
    }

    if (userData.visualType !== undefined) {
      runtime.metadata.visualType = userData.visualType;
      report.fieldsMigrated.push('visualType');
    }

    if (userData.visualLocked !== undefined) {
      runtime.metadata.visualLocked = userData.visualLocked;
      report.fieldsMigrated.push('visualLocked');
    }

    if (userData.visualCode !== undefined) {
      runtime.metadata.visualCode = userData.visualCode;
      report.fieldsMigrated.push('visualCode');
    }

    if (userData.visualProfile !== undefined) {
      runtime.metadata.visualProfile = userData.visualProfile;
      report.fieldsMigrated.push('visualProfile');
    }

    if (userData.visualCoreImmutable !== undefined) {
      runtime.metadata.visualCoreImmutable = userData.visualCoreImmutable;
      report.fieldsMigrated.push('visualCoreImmutable');
    }

    report.migrated = report.fieldsMigrated.length > 0;
    return report;
  }

  /**
   * Clear legacy warnings cache (delegated to SemanticMetricAdapter)
   */
  static clearWarningCache() {
    clearLegacyWarningCache();
  }
}

// ============================================================================
// LINK RUNTIME STATE ADAPTER
// ============================================================================

/**
 * Adapter for link runtime visual state management
 */
export class LinkMetricRuntimeAdapter {
  /**
   * Get canonical synergy (DELEGATED to SemanticMetricAdapter)
   * @deprecated Use SemanticMetricAdapter.getLinkSynergy() directly
   */
  static getSynergy(link) {
    return getLinkSynergy(link);
  }

  /**
   * Get canonical link visual synergy profile (DELEGATED to SemanticMetricAdapter)
   * @deprecated Use SemanticMetricAdapter.getLinkSynergyVisualMetrics() directly
   */
  static getSynergyVisualMetrics(link) {
    return getLinkSynergyVisualMetrics(link);
  }

  /**
   * Get corruption level (DELEGATED to SemanticMetricAdapter)
   * @deprecated Use SemanticMetricAdapter.getLinkCorruption() directly
   */
  static getCorruption(link) {
    return getLinkCorruption(link);
  }

  /**
   * Get runtime visual state
   * @param {Object} link - Link object
   * @param {string} path - Runtime state path (e.g., 'effectsState.synergyCollapse.active')
   * @returns {*} Runtime state value
   */
  static getRuntimeState(link, path) {
    if (!link?.userData?.runtime) {
      return undefined;
    }

    const parts = path.split('.');
    let current = link.userData.runtime;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Set runtime visual state
   * @param {Object} link - Link object
   * @param {string} path - Runtime state path
   * @param {*} value - Value to set
   */
  static setRuntimeState(link, path, value) {
    if (!link) {
      console.warn('[LinkMetricRuntimeAdapter] Cannot set runtime state on null link');
      return;
    }

    if (!link.userData) link.userData = {};
    if (!link.userData.runtime) link.userData.runtime = this._initializeRuntimeState();

    const parts = path.split('.');
    let current = link.userData.runtime;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Initialize runtime state structure
   * @returns {Object} Initialized runtime state
   */
  static _initializeRuntimeState() {
    return {
      visualState: {
        intensity: 0,
        corruptionLevel: 0
      },
      effectsState: {
        synergyCollapse: {
          active: false,
          cascadeTime: 0
        },
        corruptionVisual: {
          colorTint: { r: 1, g: 1, b: 1 },
          wavePhase: 0,
          waveIntensity: 0
        },
        glow: {
          glowIntensity: 0,
          qualityNorm: 0,
          corruptionPulse: 0
        }
      },
      animationState: {
        tearPhase: 0,
        coherenceLoss: 0,
        strainIntensity: 0
      },
      metadata: {}
    };
  }

  /**
   * Ensure runtime state is initialized
   * @param {Object} link - Link object
   */
  static ensureRuntimeState(link) {
    if (!link?.userData?.runtime) {
      if (!link.userData) link.userData = {};
      link.userData.runtime = this._initializeRuntimeState();
    }
  }

  /**
   * Migrate scattered legacy runtime state to structured format
   * @param {Object} link - Link object
   * @returns {Object} Migration report
   */
  static migrateRuntimeState(link) {
    if (!link?.userData) {
      return { migrated: false, reason: 'Link has no userData' };
    }

    const report = {
      migrated: false,
      fieldsMigrated: [],
      warnings: []
    };

    this.ensureRuntimeState(link);
    const runtime = link.userData.runtime;
    const userData = link.userData;

    // Migrate synergy collapse state
    if (userData.synergyCollapse !== undefined || userData.synergyCascadeTime !== undefined) {
      runtime.effectsState.synergyCollapse.active = userData.synergyCollapse ?? false;
      runtime.effectsState.synergyCollapse.cascadeTime = userData.synergyCascadeTime ?? 0;
      report.fieldsMigrated.push('synergyCollapse');
    }

    // Migrate corruption visual state
    if (userData.corruptionVisualState !== undefined) {
      runtime.effectsState.corruptionVisual.colorTint = userData.corruptionVisualState.colorTint ?? { r: 1, g: 1, b: 1 };
      runtime.effectsState.corruptionVisual.intensity = userData.corruptionVisualState.intensity ?? 0;
      report.fieldsMigrated.push('corruptionVisualState');
    }

    // Migrate visual intensity
    if (userData.visualIntensity !== undefined) {
      runtime.visualState.intensity = userData.visualIntensity;
      report.fieldsMigrated.push('visualIntensity');
    }

    // Migrate animation state
    if (userData.visualTear !== undefined) {
      runtime.animationState.tearPhase = userData.visualTear;
      report.fieldsMigrated.push('visualTear');
    }

    if (userData.visualCoherenceLoss !== undefined) {
      runtime.animationState.coherenceLoss = userData.visualCoherenceLoss;
      report.fieldsMigrated.push('visualCoherenceLoss');
    }

    if (userData.visualStrain !== undefined) {
      runtime.animationState.strainIntensity = userData.visualStrain;
      report.fieldsMigrated.push('visualStrain');
    }

    report.migrated = report.fieldsMigrated.length > 0;
    return report;
  }

  /**
   * Clear legacy warnings cache (delegated to SemanticMetricAdapter)
   */
  static clearWarningCache() {
    clearLegacyWarningCache();
  }
}

// ============================================================================
// MIGRATION UTILITY
// ============================================================================

/**
 * Migration utility for batch operations
 */
export class MetricMigrationUtility {
  /**
   * Migrate all nodes in a collection
   * @param {Array<THREE.Object3D>} nodes - Node array
   * @returns {Object} Migration summary
   */
  static migrateAllNodes(nodes) {
    const summary = {
      totalNodes: nodes.length,
      migratedNodes: 0,
      totalFieldsMigrated: 0,
      details: []
    };

    for (const node of nodes) {
      const report = NodeMetricRuntimeAdapter.migrateRuntimeState(node);
      if (report.migrated) {
        summary.migratedNodes++;
        summary.totalFieldsMigrated += report.fieldsMigrated.length;
        summary.details.push({
          nodeId: node?.userData?.nodeId || node?.id || 'unknown',
          fields: report.fieldsMigrated
        });
      }
    }

    return summary;
  }

  /**
   * Migrate all links in a collection
   * @param {Array<Object>} links - Link array
   * @returns {Object} Migration summary
   */
  static migrateAllLinks(links) {
    const summary = {
      totalLinks: links.length,
      migratedLinks: 0,
      totalFieldsMigrated: 0,
      details: []
    };

    for (const link of links) {
      const report = LinkMetricRuntimeAdapter.migrateRuntimeState(link);
      if (report.migrated) {
        summary.migratedLinks++;
        summary.totalFieldsMigrated += report.fieldsMigrated.length;
        summary.details.push({
          linkId: link?.id || 'unknown',
          fields: report.fieldsMigrated
        });
      }
    }

    return summary;
  }

  /**
   * Validate all nodes have canonical metrics
   * @param {Array<THREE.Object3D>} nodes - Node array
   * @returns {Object} Validation report
   */
  static validateNodes(nodes) {
    const CANONICAL_NODE_METRICS = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure'];
    const report = {
      totalNodes: nodes.length,
      validNodes: 0,
      invalidNodes: 0,
      issues: []
    };

    for (const node of nodes) {
      const issues = [];

      if (!node?.userData?.metrics) {
        issues.push('Missing userData.metrics');
      } else {
        for (const metric of CANONICAL_NODE_METRICS) {
          if (node.userData.metrics[metric] === undefined) {
            issues.push(`Missing metric: ${metric}`);
          }
        }
      }

      if (issues.length === 0) {
        report.validNodes++;
      } else {
        report.invalidNodes++;
        report.issues.push({
          nodeId: node?.userData?.nodeId || node?.id || 'unknown',
          issues
        });
      }
    }

    return report;
  }

  /**
   * Validate all links have canonical metrics
   * @param {Array<Object>} links - Link array
   * @returns {Object} Validation report
   */
  static validateLinks(links) {
    const report = {
      totalLinks: links.length,
      validLinks: 0,
      invalidLinks: 0,
      issues: []
    };

    for (const link of links) {
      const issues = [];

      if (!link?.userData?.synergy) {
        issues.push('Missing userData.synergy');
      }

      if (link?.userData?.corruptionLevel === undefined) {
        issues.push('Missing userData.corruptionLevel');
      }

      if (issues.length === 0) {
        report.validLinks++;
      } else {
        report.invalidLinks++;
        report.issues.push({
          linkId: link?.id || 'unknown',
          issues
        });
      }
    }

    return report;
  }
}

// ============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Re-export SemanticMetricAdapter functions for convenience
export {
  getNodeCanonicalMetrics,
  getLinkSynergy,
  getLinkCorruption,
  getLinkCanonicalMetrics,
  getLinkSynergyVisualMetrics
} from '../../SemanticMetricAdapter.js';

// Console API for debugging
if (typeof window !== 'undefined') {
  window.__ATOMA_METRIC_ADAPTER = {
    NodeMetricRuntimeAdapter,
    LinkMetricRuntimeAdapter,
    MetricMigrationUtility,
    // Direct access to SemanticMetricAdapter functions
    getNodeCanonicalMetrics,
    getLinkSynergy,
    getLinkCorruption,
    getLinkCanonicalMetrics,
    getLinkSynergyVisualMetrics,
    clearWarnings: clearLegacyWarningCache
  };
  
  console.log('[MetricRuntimeAdapter] v2.0 - Console API ready: window.__ATOMA_METRIC_ADAPTER');
}
