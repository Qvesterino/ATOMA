/**
 * ENFORCEMENT GATE AUTO-RECOVERY BRIDGE — Session 98
 * 
 * Integrates EnforcementViolationAutoRecovery with VisualLayerEnforcementGate.
 * Automatically detects violations and triggers recovery without manual intervention.
 * 
 * INTEGRATION PATTERN:
 * 1. Gate checks if visual is valid: canAttach(request)
 * 2. If DENIED → Auto-recovery notified via bridge
 * 3. Recovery system attempts multiple strategies
 * 4. Valid state restored automatically
 * 5. System resumes with valid visuals
 * 
 * FEATURES:
 * - Transparent violation detection
 * - Automatic recovery attempt coordination
 * - No changes needed to enforcement gate API
 * - Works with all existing systems (Sessions 94-97)
 * - Zero performance impact when no violations
 * - Comprehensive monitoring and debugging
 * 
 * USAGE:
 * const bridge = new EnforcementGateAutoRecoveryBridge({
 *   enforcementGate: gate,
 *   recoverySystem: recovery,
 *   autoCapture: true
 * });
 * 
 * // Wrap enforcement gate checks
 * if (!bridge.canAttachWithRecovery(request, target)) {
 *   // Visual rejected, auto-recovery attempted
 * }
 */

/**
 * Bridge between enforcement gate and recovery system
 */
export class EnforcementGateAutoRecoveryBridge {
  constructor(options = {}) {
    this.enforcementGate = options.enforcementGate;
    this.recoverySystem = options.recoverySystem;
    this.autoCapture = options.autoCapture !== false;  // Auto-capture before modifications
    this.debugEnabled = options.debugEnabled === true;
    
    // Request history for diagnostics
    this.requestHistory = [];
    this.maxHistorySize = 200;
    
    // Statistics
    this.stats = {
      checksPerformed: 0,
      approvalsWithoutCapture: 0,
      approvalsWithCapture: 0,
      denialsBefore: 0,
      denialsAfterRecovery: 0,
      recoveryTriggered: 0,
      capturesPerformed: 0,
      frameTime: 0
    };
    
    if (this.debugEnabled) {
      console.log('[EnforcementGateAutoRecoveryBridge] Initialized', {
        autoCapture: this.autoCapture,
        hasRecoverySystem: !!this.recoverySystem,
        hasEnforcementGate: !!this.enforcementGate
      });
    }
  }
  
  /**
   * MAIN FLOW: Check attachment with automatic recovery
   * 
   * Returns: true if visual allowed (with or without recovery)
   *          false if visual denied after recovery attempts
   */
  canAttachWithRecovery(request, target, recoveryOptions = {}) {
    const startTime = performance.now();
    this.stats.checksPerformed++;
    
    // 1. Initial check
    if (!this.enforcementGate) {
      return true;  // No gate, allow everything
    }
    
    const initialCheck = this.enforcementGate.canAttach(request);
    
    // 2. If approved, optionally capture state
    if (initialCheck) {
      if (this.autoCapture && this.recoverySystem && target) {
        this._captureTargetState(request, target);
        this.stats.approvalsWithCapture++;
      } else {
        this.stats.approvalsWithoutCapture++;
      }
      
      this._recordHistory(request, true, false);
      return true;
    }
    
    // 3. Initial check FAILED - attempt recovery
    this.stats.denialsBefore++;
    
    if (!this.recoverySystem) {
      // No recovery system, just deny
      this._recordHistory(request, false, false);
      return false;
    }
    
    this.stats.recoveryTriggered++;
    
    // 4. Register violation and trigger recovery
    const recoveryDetails = {
      nodeId: request.nodeId,
      target: target,
      request: request,
      violationType: this._classifyViolation(request)
    };
    
    this.recoverySystem.registerViolation(
      request.nodeId,
      recoveryDetails.violationType,
      recoveryDetails
    );
    
    // 5. Check AGAIN after recovery (some strategies work instantly)
    const recoveryCheck = this.enforcementGate.canAttach(request);
    
    if (recoveryCheck) {
      this.stats.denialsAfterRecovery++;
    }
    
    this._recordHistory(request, recoveryCheck, true);
    
    this.stats.frameTime = performance.now() - startTime;
    
    return recoveryCheck;
  }
  
  /**
   * Capture target state before modification (for recovery)
   */
  _captureTargetState(request, target) {
    if (!this.recoverySystem || !target) return;
    
    const options = {
      captureOpacity: this._shouldCaptureOpacity(request),
      captureColor: this._shouldCaptureColor(request),
      captureEmissive: true,
      captureUniforms: true
    };
    
    this.recoverySystem.captureBeforeModification(
      request.nodeId,
      target,
      options
    );
    
    this.stats.capturesPerformed++;
  }
  
  /**
   * Classify the type of violation
   */
  _classifyViolation(request) {
    if (!request) return 'unknown';
    
    // Check what was violated
    if (request.opacity > (request.layerType === 'AURA_LAYER' ? 0.6 : 1.0)) {
      return 'opacity_too_high';
    }
    if (request.opacity < 0.0) {
      return 'opacity_negative';
    }
    
    const layer = request.layerType || 'unknown';
    if (request.geometryType && !this._isAllowedGeometry(layer, request.geometryType)) {
      return `invalid_geometry_for_${layer}`;
    }
    
    if (request.nodeCategory && !this._isCategoryAllowed(request.nodeCategory)) {
      return 'invalid_node_category';
    }
    
    return 'unclassified_violation';
  }
  
  /**
   * Determine if opacity should be captured
   */
  _shouldCaptureOpacity(request) {
    // Capture for any aura/visual layer modifications
    return ['AURA_LAYER', 'GLYPH_LAYER', 'STATE_GLYPH'].includes(request.layerType);
  }
  
  /**
   * Determine if color should be captured
   */
  _shouldCaptureColor(request) {
    // Capture for color-related layers
    return ['GLYPH_LAYER', 'AURA_LAYER'].includes(request.layerType);
  }
  
  /**
   * Check if geometry is allowed for layer
   */
  _isAllowedGeometry(layerType, geometryType) {
    const allowed = {
      'AURA_LAYER': ['Particles', 'Spheres'],
      'GLYPH_LAYER': ['Planes', 'Lines', 'Particles'],
      'STATE_GLYPH': ['Rings', 'Lines', 'Spheres']
    };
    
    return allowed[layerType]?.includes(geometryType) ?? true;
  }
  
  /**
   * Check if node category is allowed
   */
  _isCategoryAllowed(category) {
    // Whitelist of allowed node categories
    const allowed = [
      'input', 'process', 'analytics', 'storage', 'control', 'integration',
      'emotional', 'quantum', 'sigma', 'outer', 'extreme', 'legendary',
      'mythic', 'prime', 'error'
    ];
    
    return allowed.includes(category);
  }
  
  /**
   * Record check in history for diagnostics
   */
  _recordHistory(request, approved, recoveryAttempted) {
    this.requestHistory.push({
      timestamp: performance.now(),
      nodeId: request.nodeId,
      layerType: request.layerType,
      opacity: request.opacity,
      approved,
      recoveryAttempted,
      sourceSystem: request.sourceSystem
    });
    
    // Limit history size
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const recoveryStats = this.recoverySystem?.getStats() || {};
    
    return {
      bridge: this.stats,
      recovery: recoveryStats,
      historySize: this.requestHistory.length,
      recoverySuccessRate: this.stats.checksPerformed > 0 
        ? (this.stats.approvalsWithCapture / this.stats.checksPerformed).toFixed(3)
        : 0
    };
  }
  
  /**
   * Get recent history
   */
  getRecentHistory(limit = 20) {
    return this.requestHistory.slice(-limit);
  }
  
  /**
   * Get violations from recovery system
   */
  getViolations() {
    return this.recoverySystem?.getViolationsByNode() || new Map();
  }
  
  /**
   * Get recent recovery attempts
   */
  getRecentRecoveries(limit = 10) {
    return this.recoverySystem?.getRecentRecoveryAttempts(limit) || [];
  }
  
  /**
   * Clear all history
   */
  clear() {
    this.requestHistory = [];
    if (this.recoverySystem) {
      this.recoverySystem.clear();
    }
  }
}

/**
 * INTEGRATION ADAPTER — Wraps existing systems to use auto-recovery
 * 
 * Usage in existing aura systems:
 * 
 * // Before (Session 94-97)
 * if (!this._canApplyModification(node, value)) {
 *   return;  // Just skip
 * }
 * 
 * // After (Session 98)
 * if (!bridge.canAttachWithRecovery(request, target)) {
 *   return;  // Auto-recovery was attempted
 * }
 */
export class AuraSystemAutoRecoveryAdapter {
  /**
   * Wrap an existing enforcement check with auto-recovery
   */
  static wrapEnforcementCheck(
    bridge,
    request,
    target,
    onApproved,
    onDenied
  ) {
    if (bridge.canAttachWithRecovery(request, target)) {
      // Approved (with or without recovery)
      if (onApproved) onApproved();
    } else {
      // Permanently denied
      if (onDenied) onDenied();
    }
  }
  
  /**
   * Create adapter-friendly request from system state
   */
  static createRequest(node, value, layerType = 'AURA_LAYER') {
    return {
      nodeId: node.userData?.id || node.uuid,
      nodeCategory: node.userData?.category || 'unknown',
      layerType,
      geometryType: 'Spheres',
      opacity: value,
      sourceSystem: 'AuraSystem'
    };
  }
}

/**
 * Console API for bridge
 */
export function setupBridgeConsoleAPI(bridge) {
  if (!window.debugRecoveryBridge) {
    window.debugRecoveryBridge = {};
  }
  
  Object.assign(window.debugRecoveryBridge, {
    getStats: () => {
      const stats = bridge.getStats();
      console.log('Bridge Statistics:', stats);
      console.table(stats);
      return stats;
    },
    
    getRecentHistory: (limit = 20) => {
      const history = bridge.getRecentHistory(limit);
      console.table(history);
      return history;
    },
    
    getViolations: () => {
      const violations = bridge.getViolations();
      console.table(Array.from(violations.entries()));
      return violations;
    },
    
    getRecoveries: (limit = 10) => {
      const recoveries = bridge.getRecentRecoveries(limit);
      console.table(recoveries);
      return recoveries;
    },
    
    clearAll: () => {
      bridge.clear();
      console.log('Bridge and recovery data cleared');
    },
    
    setDebug: (enabled) => {
      bridge.debugEnabled = enabled;
      console.log(`Bridge debug ${enabled ? 'enabled' : 'disabled'}`);
    }
  });
  
  console.log('✅ Recovery Bridge console API ready: debugRecoveryBridge.*');
}
