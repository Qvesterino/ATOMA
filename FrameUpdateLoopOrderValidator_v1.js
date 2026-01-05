/**
 * ============================================================================
 * FRAME UPDATE LOOP ORDER VALIDATOR v1.0
 * ============================================================================
 * 
 * Runtime validator that tracks frame update loop execution order and detects
 * violations against canonical order from T3-003 audit.
 * 
 * Features:
 * - Tracks system update calls each frame
 * - Validates against T3-003 canonical order (50+ systems)
 * - Detects out-of-order updates
 * - Detects skipped systems
 * - Detects duplicate updates
 * - Monitors performance per system per frame
 * - Provides per-frame violation reporting
 * - Statistics collection & trends
 * - Console API for debugging
 * - Real-time frame profiling
 * - Performance timeline generation
 * 
 * Usage:
 * ```
 * const validator = new FrameUpdateLoopOrderValidator_v1();
 * 
 * // Register systems (once at start)
 * validator.registerUpdateSystem('LinkPriorityDecayEngine', 1, 0.5);
 * validator.registerUpdateSystem('LinkCorruptionTransmission', 2, 0.3);
 * 
 * // Mark update calls (every frame)
 * validator.markSystemUpdate('LinkPriorityDecayEngine', frameTimeMs);
 * validator.markSystemUpdate('LinkCorruptionTransmission', frameTimeMs);
 * 
 * // End frame and analyze
 * validator.endFrame(deltaTime);
 * if (!validator.isFrameValid()) {
 *   validator.printFrameReport();
 * }
 * ```
 * 
 * Console API:
 * ```
 * window.frameUpdateValidator.printFrameReport();
 * window.frameUpdateValidator.getPerformanceTimeline();
 * window.frameUpdateValidator.getViolations();
 * window.frameUpdateValidator.getFrameStats();
 * ```
 * ============================================================================
 */

export class FrameUpdateLoopOrderValidator_v1 {
  constructor() {
    // Canonical update order from T3-003 (50+ systems)
    this.canonicalUpdateOrder = [
      // Gameplay Compute Systems (Before Visuals)
      { order: 1, name: 'LinkPriorityDecayEngine', category: 'gameplay', expectedTimeMs: 0.5 },
      { order: 2, name: 'LinkCorruptionTransmission_v1', category: 'gameplay', expectedTimeMs: 0.3 },
      { order: 3, name: 'HarmonyStabilizationSystem_v1', category: 'gameplay', expectedTimeMs: 0.3 },
      { order: 4, name: 'LinkingSystem', category: 'core-link', expectedTimeMs: 0.8 },
      
      // Visual System Updates (After Gameplay)
      { order: 5, name: 'T2_CorruptionVisualIntegration', category: 'visual-consumer', expectedTimeMs: 0.2 },
      { order: 6, name: 'T2_HarmonyVisualConsumer', category: 'visual-consumer', expectedTimeMs: 0.2 },
      { order: 7, name: 'TIER4_GameplayIntegration', category: 'visual-consumer', expectedTimeMs: 0.1 },
      
      // Node Hierarchy
      { order: 8, name: 'NodeHierarchyBridge', category: 'hierarchy', expectedTimeMs: 0.1 },
      
      // Multi-Network Systems
      { order: 9, name: 'PHASE5_MultiNetworkOrchestrator', category: 'network', expectedTimeMs: 0.2 },
      { order: 10, name: 'PHASE5_InterNetworkVisualizationBridge', category: 'network', expectedTimeMs: 0.1 },
      { order: 11, name: 'PHASE5_CascadePropagationVisuals', category: 'network', expectedTimeMs: 0.1 },
      { order: 12, name: 'PHASE5_CascadeVisualizationBridge', category: 'network', expectedTimeMs: 0.1 },
      
      // Synergy & Resonance Systems
      { order: 13, name: 'LinkPersonalityStateMachine', category: 'synergy', expectedTimeMs: 0.2 },
      { order: 14, name: 'SynergyBonusVisualization', category: 'synergy', expectedTimeMs: 0.2 },
      { order: 15, name: 'SynergyBonusFXLayer', category: 'synergy', expectedTimeMs: 0.2 },
      { order: 16, name: 'SynergyResonanceShaderPack', category: 'synergy', expectedTimeMs: 0.2 },
      { order: 17, name: 'ResonanceFeedback', category: 'synergy', expectedTimeMs: 0.2 },
      { order: 18, name: 'SynergyChainReaction', category: 'synergy', expectedTimeMs: 0.2 },
      { order: 19, name: 'SynergyCascadeFXBridge', category: 'synergy', expectedTimeMs: 0.2 },
      
      // Wave Systems
      { order: 20, name: 'WaveInterferenceEngine', category: 'wave', expectedTimeMs: 0.2 },
      { order: 21, name: 'WaveShaderBridge', category: 'wave', expectedTimeMs: 0.1 },
      { order: 22, name: 'WaveTravelShaderPack', category: 'wave', expectedTimeMs: 0.1 },
      { order: 23, name: 'WaveDynamicsShaderPack', category: 'wave', expectedTimeMs: 0.1 },
      
      // Node & Personality Systems
      { order: 24, name: 'AINodes', category: 'node-core', expectedTimeMs: 1.0 },
      { order: 25, name: 'NodePersonalitySystem', category: 'personality', expectedTimeMs: 0.3 },
      { order: 26, name: 'NodeMicroEvents', category: 'personality', expectedTimeMs: 0.2 },
      { order: 27, name: 'WorldPersonalityController', category: 'personality', expectedTimeMs: 0.1 },
      { order: 28, name: 'MythicRitualController', category: 'personality', expectedTimeMs: 0.1 },
      
      // Glyph Systems
      { order: 29, name: 'GlyphSystem', category: 'glyph', expectedTimeMs: 0.2 },
      { order: 30, name: 'GlyphSystem4', category: 'glyph', expectedTimeMs: 0.2 },
      { order: 31, name: 'GlyphLayer4', category: 'glyph', expectedTimeMs: 0.2 },
      { order: 32, name: 'SemanticGlyphAI', category: 'glyph', expectedTimeMs: 0.2 },
      { order: 33, name: 'ProceduralMeaningEngine', category: 'glyph', expectedTimeMs: 0.2 },
      { order: 34, name: 'LinkGlyphFlow', category: 'glyph', expectedTimeMs: 0.1 },
      { order: 35, name: 'LinkedGlyphSync', category: 'glyph', expectedTimeMs: 0.1 },
      { order: 36, name: 'LinkedGlyphMessaging', category: 'glyph', expectedTimeMs: 0.1 },
      { order: 37, name: 'RecursiveGlyphMessaging', category: 'glyph', expectedTimeMs: 0.1 },
      { order: 38, name: 'EmergentThoughtStorms', category: 'glyph', expectedTimeMs: 0.1 },
      { order: 39, name: 'NarrativePatterns', category: 'glyph', expectedTimeMs: 0.2 },
      
      // Personality & Shader Systems
      { order: 40, name: 'PersonalityVisualAdapter', category: 'shader', expectedTimeMs: 0.1 },
      { order: 41, name: 'PersonalityVFXLayer', category: 'shader', expectedTimeMs: 0.2 },
      { order: 42, name: 'PersonalityShaderBridge', category: 'shader', expectedTimeMs: 0.1 },
      { order: 43, name: 'PersonalityShaderAdvancedFX', category: 'shader', expectedTimeMs: 0.2 },
      { order: 44, name: 'ArchetypeCurves', category: 'archetype', expectedTimeMs: 0.1 },
      { order: 45, name: 'ArchetypeAuraFX', category: 'archetype', expectedTimeMs: 0.1 },
      { order: 46, name: 'ArchetypeColorFX', category: 'archetype', expectedTimeMs: 0.1 },
      
      // Camera & Rendering
      { order: 47, name: 'CameraPolishPack', category: 'camera', expectedTimeMs: 0.2 },
      { order: 48, name: 'CameraPolishPack3', category: 'camera', expectedTimeMs: 0.2 },
      { order: 49, name: 'NodeVisuals4_0', category: 'node-visual', expectedTimeMs: 0.3 },
      { order: 50, name: 'Renderer', category: 'render', expectedTimeMs: 2.0 },
    ];

    // System registration
    this.registeredSystems = new Map();
    
    // Per-frame tracking
    this.currentFrameUpdates = [];
    this.currentFrameViolations = [];
    this.currentFramePerformance = new Map();
    
    // Historical data
    this.frameHistory = []; // Last 100 frames
    this.allViolations = [];
    
    // Statistics
    this.stats = {
      totalFrames: 0,
      violatedFrames: 0,
      averageFrameTimeMs: 0,
      totalFrameTimeMs: 0,
      averageUpdateTimeMs: 0,
      totalUpdateTimeMs: 0,
      slowestSystem: null,
      slowestSystemTimeMs: 0,
      fastestSystem: null,
      fastestSystemTimeMs: Infinity,
      categoryCounts: {},
      violationCounts: {}
    };
    
    // Frame-level tracking
    this.currentFrameNumber = 0;
    this.frameStartTimeMs = 0;
    this.frameEndTimeMs = 0;
    
    // Configuration
    this.performanceThresholdMs = 16.67; // 60 FPS budget
    this.violationThresholdPercent = 5; // 5% slowdown
    this.debugMode = false;
    this.logs = [];
  }
  
  /**
   * Register an update system with expected performance
   * @param {string} systemName - Name of the system
   * @param {number} expectedOrder - Expected order in frame loop (1-50+)
   * @param {number} expectedTimeMs - Expected execution time (ms)
   */
  registerUpdateSystem(systemName, expectedOrder, expectedTimeMs = 0.5) {
    if (this.registeredSystems.has(systemName)) {
      this._log(`Warning: System "${systemName}" already registered`);
      return;
    }
    
    this.registeredSystems.set(systemName, {
      name: systemName,
      expectedOrder,
      expectedTimeMs,
      registered: Date.now(),
      totalCalls: 0,
      totalTimeMs: 0,
      framesSeen: 0,
      averageTimeMs: 0,
      lastTimeMs: 0,
      violations: 0
    });
    
    this._log(`Registered update system: ${systemName} (order ${expectedOrder}, ${expectedTimeMs}ms)`);
  }
  
  /**
   * Start a new frame
   */
  startFrame() {
    this.currentFrameNumber++;
    this.frameStartTimeMs = performance.now();
    this.currentFrameUpdates = [];
    this.currentFramePerformance.clear();
    this.currentFrameViolations = [];
  }
  
  /**
   * Mark a system as updated during current frame
   * @param {string} systemName - Name of the system
   * @param {number} executionTimeMs - Time taken to execute (optional)
   * @returns {boolean} true if valid, false if violation
   */
  markSystemUpdate(systemName, executionTimeMs = 0) {
    if (!this.registeredSystems.has(systemName)) {
      this.currentFrameViolations.push({
        type: 'UNREGISTERED_UPDATE',
        system: systemName,
        order: this.currentFrameUpdates.length,
        message: `System "${systemName}" updated but not registered`
      });
      return false;
    }
    
    const systemMeta = this.registeredSystems.get(systemName);
    const currentOrder = this.currentFrameUpdates.length + 1;
    
    // Check for duplicate update in same frame
    if (this.currentFrameUpdates.includes(systemName)) {
      this.currentFrameViolations.push({
        type: 'DUPLICATE_UPDATE',
        system: systemName,
        order: currentOrder,
        message: `System "${systemName}" updated twice in same frame`
      });
      systemMeta.violations++;
      return false;
    }
    
    // Check for out-of-order update
    if (currentOrder !== systemMeta.expectedOrder) {
      // Allow for optional/conditional systems not executing
      // Only flag if a previous system hasn't executed yet that should have
      const expectedSystemAtPosition = this.canonicalUpdateOrder[currentOrder - 1];
      if (expectedSystemAtPosition && expectedSystemAtPosition.name !== systemName) {
        this.currentFrameViolations.push({
          type: 'OUT_OF_ORDER_UPDATE',
          system: systemName,
          expectedOrder: systemMeta.expectedOrder,
          actualOrder: currentOrder,
          message: `System "${systemName}" out of order (expected ${systemMeta.expectedOrder}, got ${currentOrder})`
        });
        systemMeta.violations++;
        return false;
      }
    }
    
    // Record update
    this.currentFrameUpdates.push(systemName);
    this.currentFramePerformance.set(systemName, executionTimeMs);
    
    // Update system statistics
    systemMeta.totalCalls++;
    systemMeta.totalTimeMs += executionTimeMs;
    systemMeta.lastTimeMs = executionTimeMs;
    systemMeta.framesSeen++;
    systemMeta.averageTimeMs = systemMeta.totalTimeMs / systemMeta.totalCalls;
    
    // Update global statistics
    this.stats.totalUpdateTimeMs += executionTimeMs;
    
    // Track slowest/fastest
    if (executionTimeMs > this.stats.slowestSystemTimeMs) {
      this.stats.slowestSystem = systemName;
      this.stats.slowestSystemTimeMs = executionTimeMs;
    }
    if (executionTimeMs < this.stats.fastestSystemTimeMs && executionTimeMs > 0) {
      this.stats.fastestSystem = systemName;
      this.stats.fastestSystemTimeMs = executionTimeMs;
    }
    
    // Check performance threshold
    const threshold = systemMeta.expectedTimeMs * (1 + this.violationThresholdPercent / 100);
    if (executionTimeMs > threshold) {
      this.currentFrameViolations.push({
        type: 'PERFORMANCE_VIOLATION',
        system: systemName,
        expectedTimeMs: systemMeta.expectedTimeMs,
        actualTimeMs: executionTimeMs,
        thresholdMs: threshold,
        message: `System "${systemName}" exceeded performance threshold (${executionTimeMs.toFixed(2)}ms > ${threshold.toFixed(2)}ms)`
      });
    }
    
    return true;
  }
  
  /**
   * Mark skipped systems (not updated this frame)
   * @param {string[]} skippedSystems - Array of system names that were skipped
   */
  markSkippedSystems(skippedSystems = []) {
    skippedSystems.forEach(name => {
      if (this.registeredSystems.has(name)) {
        this.currentFramePerformance.set(name, 0);
      }
    });
  }
  
  /**
   * End current frame and analyze
   * @param {number} deltaTimeMs - Frame delta time (ms)
   * @returns {Object} Frame analysis result
   */
  endFrame(deltaTimeMs) {
    this.frameEndTimeMs = performance.now();
    const frameExecutionTimeMs = this.frameEndTimeMs - this.frameStartTimeMs;
    
    // Detect completely skipped systems
    const registeredOrder = Array.from(this.registeredSystems.keys()).sort((a, b) => {
      return this.registeredSystems.get(a).expectedOrder - this.registeredSystems.get(b).expectedOrder;
    });
    
    const expectedOrderNames = this.canonicalUpdateOrder.map(s => s.name);
    const executedBefore = new Set(this.currentFrameUpdates.slice(0, this.currentFrameUpdates.length));
    
    for (const systemName of expectedOrderNames) {
      if (!this.currentFrameUpdates.includes(systemName) && this.registeredSystems.has(systemName)) {
        // System was expected but didn't run
        const expectedOrder = this.registeredSystems.get(systemName).expectedOrder;
        
        // Only flag if it comes before the last executed system
        const lastExecutedIdx = Math.max(
          ...this.currentFrameUpdates.map(name => expectedOrderNames.indexOf(name))
        );
        
        if (expectedOrderNames.indexOf(systemName) <= lastExecutedIdx) {
          this.currentFrameViolations.push({
            type: 'SKIPPED_UPDATE',
            system: systemName,
            expectedOrder,
            message: `System "${systemName}" was skipped this frame`
          });
        }
      }
    }
    
    // Aggregate violations
    const hasViolations = this.currentFrameViolations.length > 0;
    if (hasViolations) {
      this.stats.violatedFrames++;
    }
    
    // Create frame record
    const frameRecord = {
      frameNumber: this.currentFrameNumber,
      timestamp: Date.now(),
      deltaTimeMs,
      executionTimeMs: frameExecutionTimeMs,
      updateCount: this.currentFrameUpdates.length,
      expectedUpdateCount: this.canonicalUpdateOrder.length,
      violations: this.currentFrameViolations.length,
      violationList: [...this.currentFrameViolations],
      performance: new Map(this.currentFramePerformance),
      isValid: !hasViolations
    };
    
    // Store in history (keep last 100 frames)
    this.frameHistory.push(frameRecord);
    if (this.frameHistory.length > 100) {
      this.frameHistory.shift();
    }
    
    // Store all violations
    this.allViolations.push(...this.currentFrameViolations);
    
    // Update statistics
    this.stats.totalFrames++;
    this.stats.totalFrameTimeMs += frameExecutionTimeMs;
    this.stats.averageFrameTimeMs = this.stats.totalFrameTimeMs / this.stats.totalFrames;
    this.stats.averageUpdateTimeMs = this.stats.totalUpdateTimeMs / (this.stats.totalFrames * this.canonicalUpdateOrder.length);
    
    return frameRecord;
  }
  
  /**
   * Check if current frame is valid
   * @returns {boolean}
   */
  isFrameValid() {
    return this.currentFrameViolations.length === 0;
  }
  
  /**
   * Get current frame violations
   * @returns {Array}
   */
  getFrameViolations() {
    return this.currentFrameViolations;
  }
  
  /**
   * Get all violations history
   * @returns {Array}
   */
  getAllViolations() {
    return this.allViolations;
  }
  
  /**
   * Get performance timeline for current frame
   * @returns {Array}
   */
  getPerformanceTimeline() {
    return Array.from(this.currentFramePerformance.entries()).map(([name, timeMs]) => ({
      name,
      timeMs: timeMs.toFixed(2),
      expected: this.registeredSystems.get(name)?.expectedTimeMs || 'unknown'
    }));
  }
  
  /**
   * Get frame statistics
   * @returns {Object}
   */
  getFrameStats() {
    return {
      currentFrame: this.currentFrameNumber,
      totalFrames: this.stats.totalFrames,
      violatedFrames: this.stats.violatedFrames,
      violatedPercent: ((this.stats.violatedFrames / this.stats.totalFrames) * 100).toFixed(2),
      averageFrameTimeMs: this.stats.averageFrameTimeMs.toFixed(2),
      averageUpdateTimeMs: this.stats.averageUpdateTimeMs.toFixed(2),
      slowestSystem: this.stats.slowestSystem,
      slowestSystemTimeMs: this.stats.slowestSystemTimeMs.toFixed(2),
      fastestSystem: this.stats.fastestSystem,
      fastestSystemTimeMs: this.stats.fastestSystemTimeMs === Infinity ? 'N/A' : this.stats.fastestSystemTimeMs.toFixed(2),
      totalViolations: this.allViolations.length
    };
  }
  
  /**
   * Get frame history
   * @param {number} frameCount - Number of frames to return (default: all)
   * @returns {Array}
   */
  getFrameHistory(frameCount = 100) {
    return this.frameHistory.slice(-frameCount).map(f => ({
      frameNumber: f.frameNumber,
      executionTimeMs: f.executionTimeMs.toFixed(2),
      updateCount: f.updateCount,
      violations: f.violations,
      isValid: f.isValid
    }));
  }
  
  /**
   * Get performance report by system
   * @returns {Array}
   */
  getSystemPerformanceReport() {
    return Array.from(this.registeredSystems.values())
      .sort((a, b) => a.expectedOrder - b.expectedOrder)
      .map(sys => ({
        name: sys.name,
        expectedOrder: sys.expectedOrder,
        expectedTimeMs: sys.expectedTimeMs,
        averageTimeMs: sys.averageTimeMs.toFixed(2),
        totalCalls: sys.totalCalls,
        violations: sys.violations,
        lastTimeMs: sys.lastTimeMs.toFixed(2)
      }));
  }
  
  /**
   * Print comprehensive frame report to console
   */
  printFrameReport() {
    console.group('🔍 Frame Update Loop Validation Report');
    
    // Summary
    console.group('📊 Frame Summary');
    console.log(`Frame #: ${this.currentFrameNumber}`);
    console.log(`Status: ${this.isFrameValid() ? '✅ VALID' : '❌ VIOLATIONS'}`);
    console.log(`Updates: ${this.currentFrameUpdates.length}/${this.canonicalUpdateOrder.length}`);
    console.log(`Violations: ${this.currentFrameViolations.length}`);
    console.groupEnd();
    
    // Execution sequence
    console.group('⏱️  Update Sequence');
    this.currentFrameUpdates.forEach((name, idx) => {
      const timeMs = this.currentFramePerformance.get(name) || 0;
      console.log(`${idx + 1}. ${name} (${timeMs.toFixed(2)}ms)`);
    });
    console.groupEnd();
    
    // Performance timeline
    if (this.currentFramePerformance.size > 0) {
      console.group('⏳ Performance Timeline');
      console.table(this.getPerformanceTimeline());
      console.groupEnd();
    }
    
    // Violations
    if (this.currentFrameViolations.length > 0) {
      console.group('❌ Violations');
      this.currentFrameViolations.forEach((v, idx) => {
        console.group(`Violation ${idx + 1}: ${v.type}`);
        console.error(v.message);
        if (v.expectedOrder) console.log(`Expected order: ${v.expectedOrder}`);
        if (v.actualOrder) console.log(`Actual order: ${v.actualOrder}`);
        if (v.expectedTimeMs) console.log(`Expected time: ${v.expectedTimeMs.toFixed(2)}ms`);
        if (v.actualTimeMs) console.log(`Actual time: ${v.actualTimeMs.toFixed(2)}ms`);
        console.groupEnd();
      });
      console.groupEnd();
    }
    
    // Statistics
    console.group('📈 Statistics');
    console.table(this.getFrameStats());
    console.groupEnd();
    
    console.groupEnd();
  }
  
  /**
   * Print performance analysis
   */
  printPerformanceAnalysis() {
    console.group('📊 Performance Analysis');
    
    console.group('System Performance');
    console.table(this.getSystemPerformanceReport());
    console.groupEnd();
    
    console.group('Frame History (Last 10)');
    console.table(this.getFrameHistory(10));
    console.groupEnd();
    
    console.groupEnd();
  }
  
  /**
   * Export frame data as JSON
   * @returns {Object}
   */
  exportFrameData() {
    return {
      frameNumber: this.currentFrameNumber,
      timestamp: Date.now(),
      valid: this.isFrameValid(),
      updates: this.currentFrameUpdates,
      violations: this.currentFrameViolations,
      performance: Object.fromEntries(this.currentFramePerformance),
      stats: this.getFrameStats()
    };
  }
  
  /**
   * Enable debug mode
   */
  enableDebug() {
    this.debugMode = true;
    this._log('Debug mode enabled');
  }
  
  /**
   * Disable debug mode
   */
  disableDebug() {
    this.debugMode = false;
    this._log('Debug mode disabled');
  }
  
  /**
   * Get debug logs
   * @returns {Array}
   */
  getLogs() {
    return this.logs;
  }
  
  /**
   * Clear debug logs
   */
  clearLogs() {
    this.logs = [];
  }
  
  /**
   * Internal: Log message
   */
  _log(message) {
    const timestamp = Date.now();
    this.logs.push({ timestamp, message });
    if (this.debugMode) {
      console.log(`[FrameUpdateValidator] ${message}`);
    }
  }
  
  /**
   * Reset statistics (for testing)
   */
  resetStats() {
    this.stats = {
      totalFrames: 0,
      violatedFrames: 0,
      averageFrameTimeMs: 0,
      totalFrameTimeMs: 0,
      averageUpdateTimeMs: 0,
      totalUpdateTimeMs: 0,
      slowestSystem: null,
      slowestSystemTimeMs: 0,
      fastestSystem: null,
      fastestSystemTimeMs: Infinity,
      categoryCounts: {},
      violationCounts: {}
    };
    this.frameHistory = [];
    this.allViolations = [];
    this.currentFrameNumber = 0;
  }
}

/**
 * ============================================================================
 * SETUP FUNCTION — Integrate validator into main application
 * ============================================================================
 */
export function setupFrameUpdateLoopValidator() {
  const validator = new FrameUpdateLoopOrderValidator_v1();
  
  // Expose to global console API
  if (typeof window !== 'undefined') {
    window.frameUpdateValidator = {
      startFrame: () => validator.startFrame(),
      markUpdate: (name, timeMs) => validator.markSystemUpdate(name, timeMs),
      endFrame: (dt) => validator.endFrame(dt),
      printReport: () => validator.printFrameReport(),
      printPerformance: () => validator.printPerformanceAnalysis(),
      isValid: () => validator.isFrameValid(),
      getViolations: () => validator.getFrameViolations(),
      getAllViolations: () => validator.getAllViolations(),
      getPerformance: () => validator.getPerformanceTimeline(),
      getStats: () => validator.getFrameStats(),
      getHistory: (count) => validator.getFrameHistory(count),
      exportData: () => validator.exportFrameData(),
      enableDebug: () => validator.enableDebug(),
      disableDebug: () => validator.disableDebug(),
      getLogs: () => validator.getLogs(),
      _validator: validator // Direct access
    };
  }
  
  return validator;
}

/**
 * ============================================================================
 * FRAME INSTRUMENTATION HELPER
 * ============================================================================
 * Wraps system update calls for automatic timing & validation
 */
export class FrameUpdateInstrument {
  constructor(validator) {
    this.validator = validator;
  }
  
  /**
   * Wrap a system update method
   * @param {string} systemName - Name of the system
   * @param {Object} systemObj - Object containing the update method
   * @param {string} methodName - Name of the update method (default: 'update')
   */
  instrumentSystem(systemName, systemObj, methodName = 'update') {
    const originalMethod = systemObj[methodName];
    if (!originalMethod) {
      console.warn(`System "${systemName}" has no method "${methodName}"`);
      return;
    }
    
    const validator = this.validator;
    systemObj[methodName] = function(...args) {
      const startMs = performance.now();
      const result = originalMethod.apply(this, args);
      const elapsedMs = performance.now() - startMs;
      
      validator.markSystemUpdate(systemName, elapsedMs);
      return result;
    };
  }
}

/**
 * ============================================================================
 * CONVENIENCE FUNCTIONS
 * ============================================================================
 */

let globalFrameValidator = null;

export function initializeGlobalFrameValidator() {
  if (!globalFrameValidator) {
    globalFrameValidator = setupFrameUpdateLoopValidator();
  }
  return globalFrameValidator;
}

export function getGlobalFrameValidator() {
  if (!globalFrameValidator) {
    globalFrameValidator = initializeGlobalFrameValidator();
  }
  return globalFrameValidator;
}
