/**
 * NODE SPAWN VALIDATION GATE v1.0
 * ===============================
 * [SESSION 99 TASK 2 PART A] — Node Spawn Source Enforcement
 * 
 * OBJECTIVE:
 * - Ensure ONLY nodes defined in enhancedNodeModel can ever spawn
 * - Apply validation gate to ALL node creation paths
 * - Reject invalid spawns before node creation proceeds
 * 
 * ARCHITECTURE:
 * ✅ Single source of truth: enhancedNodeModel registry
 * ✅ Centralized validation: canSpawnNode(nodeType)
 * ✅ Feature-flag controlled: ENFORCE_NODE_MODEL_SOURCE
 * ✅ Safe fallback: permissive mode for legacy compatibility
 * 
 * INTEGRATION:
 * 1. Initialize gate with enhancedNodeModel reference
 * 2. Call gate.canSpawnNode(type) before any node creation
 * 3. Reject spawn if returns false (DEV: log, PROD: silent)
 * 
 * CONSTRAINTS:
 * ✗ No fallback nodes
 * ✗ No category-based implicit spawning
 * ✗ No auto-substitution
 * ✗ No orphan nodes
 * 
 * PERFORMANCE: O(1) lookup per spawn attempt
 */

import { CONFIG } from './config.js';

/**
 * NodeSpawnValidationGate: Central validation for node spawning
 */
export class NodeSpawnValidationGate_v1 {
  /**
   * @param {Map|Object} enhancedNodeModel - Node registry (nodeType → config)
   * @param {Object} options - Configuration
   */
  constructor(enhancedNodeModel, options = {}) {
    this.nodeModel = enhancedNodeModel;
    this.enforced = CONFIG.features?.ENFORCE_NODE_MODEL_SOURCE ?? true;
    this.debugMode = options.debugMode ?? false;
    this.stats = {
      validSpawns: 0,
      rejectedSpawns: 0,
      totalValidations: 0,
      lastRejection: null
    };

    const mode = this.enforced ? 'ENFORCED' : 'PERMISSIVE';
    console.log(`[NodeSpawnValidationGate_v1] Initialized (${mode}), node model size: ${this._getModelSize()}`);
  }

  /**
   * Get size of node model registry
   * @private
   */
  _getModelSize() {
    if (!this.nodeModel) return 0;
    if (this.nodeModel instanceof Map) return this.nodeModel.size;
    return Object.keys(this.nodeModel).length;
  }

  /**
   * CHECK if node type is allowed to spawn
   * Returns false if:
   * - ENFORCE_NODE_MODEL_SOURCE is true AND node not in model
   * Returns true if:
   * - ENFORCE_NODE_MODEL_SOURCE is false (permissive)
   * - OR node exists in model
   * 
   * @param {string} nodeType - Node type/ID to validate
   * @returns {boolean} True if spawn is allowed, false if rejected
   */
  canSpawnNode(nodeType) {
    if (!nodeType) {
      this.stats.rejectedSpawns++;
      this.stats.totalValidations++;
      this.stats.lastRejection = { nodeType: null, reason: 'NULL_TYPE' };
      if (this.debugMode) console.warn('[NodeSpawnValidationGate] Null nodeType rejected');
      return false;
    }

    this.stats.totalValidations++;

    // If enforcement disabled, allow all (legacy compatibility)
    if (!this.enforced) {
      this.stats.validSpawns++;
      return true;
    }

    // Check if node type exists in model
    const exists = this._nodeExists(nodeType);
    if (!exists) {
      this.stats.rejectedSpawns++;
      this.stats.lastRejection = { nodeType, reason: 'NOT_IN_MODEL' };
      if (this.debugMode) {
        console.warn(`[NodeSpawnValidationGate] ⊘ Spawn rejected: ${nodeType} not in enhancedNodeModel`);
      }
      return false;
    }

    this.stats.validSpawns++;
    return true;
  }

  /**
   * Internal: Check if node type exists in model
   * @private
   */
  _nodeExists(nodeType) {
    if (!this.nodeModel) return false;
    
    if (this.nodeModel instanceof Map) {
      return this.nodeModel.has(nodeType);
    }
    
    return nodeType in this.nodeModel;
  }

  /**
   * Get node configuration from model (if available)
   * Returns null if node not found
   * 
   * @param {string} nodeType - Node type to look up
   * @returns {Object|null} Node configuration or null
   */
  getNodeConfig(nodeType) {
    if (!this.nodeModel) return null;
    
    if (this.nodeModel instanceof Map) {
      return this.nodeModel.get(nodeType) || null;
    }
    
    return this.nodeModel[nodeType] || null;
  }

  /**
   * Get all valid node types from model
   * @returns {Array<string>} List of allowed node types
   */
  getValidNodeTypes() {
    if (!this.nodeModel) return [];
    
    if (this.nodeModel instanceof Map) {
      return Array.from(this.nodeModel.keys());
    }
    
    return Object.keys(this.nodeModel);
  }

  /**
   * Get validation statistics
   * @returns {Object} Stats object
   */
  getStats() {
    return {
      ...this.stats,
      enforced: this.enforced,
      modelSize: this._getModelSize(),
      successRate: this.stats.totalValidations > 0 
        ? (this.stats.validSpawns / this.stats.totalValidations * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      validSpawns: 0,
      rejectedSpawns: 0,
      totalValidations: 0,
      lastRejection: null
    };
  }

  /**
   * Set enforcement mode at runtime
   * @param {boolean} enabled - Enable or disable enforcement
   */
  setEnforced(enabled) {
    this.enforced = enabled;
    const mode = enabled ? 'ENFORCED' : 'PERMISSIVE';
    console.log(`[NodeSpawnValidationGate_v1] Enforcement set to ${mode}`);
  }

  /**
   * Set debug mode
   * @param {boolean} enabled - Enable debug logging
   */
  setDebug(enabled) {
    this.debugMode = enabled;
  }
}

export default NodeSpawnValidationGate_v1;
