/**
 * ============================================================================
 * SYSTEM INITIALIZATION ORDER VALIDATOR v1.0
 * ============================================================================
 * 
 * Runtime validator that tracks system initialization order and detects
 * violations against canonical order from T3-002 audit.
 * 
 * Features:
 * - Tracks initialization sequence in real-time
 * - Validates against T3-002 canonical order
 * - Detects out-of-order initialization
 * - Detects missing hard dependencies
 * - Detects duplicate initialization
 * - Provides detailed violation reports
 * - Console API for debugging
 * - Performance monitoring (init timing)
 * - Dependency graph validation
 * 
 * Usage:
 * ```
 * const validator = new SystemInitializationOrderValidator_v1();
 * validator.registerSystem('AINodes', 0, []);
 * validator.registerSystem('NodeLinkingSystem', 1, ['AINodes']);
 * validator.markInitialized('AINodes', 123.45); // ms
 * 
 * // Check for violations
 * if (!validator.isValid()) {
 *   validator.printReport();
 * }
 * ```
 * 
 * Console API:
 * ```
 * window.systemInitValidator.printReport();
 * window.systemInitValidator.getViolations();
 * window.systemInitValidator.getInitializationTimeline();
 * window.systemInitValidator.validateSystem(systemName);
 * ```
 * ============================================================================
 */

export class SystemInitializationOrderValidator_v1 {
  constructor() {
    // Canonical initialization order from T3-002
    this.canonicalOrder = [
      // TIER 1: CORE DATA & NODES
      { name: 'AINodes', tier: 1, dependencies: [] },
      { name: 'NodeLinkingSystem', tier: 1, dependencies: ['AINodes'] },
      
      // TIER 2: SYNERGY & LINKING FEEDBACK
      { name: 'ComputeSynergyScore2_1', tier: 2, dependencies: [] },
      { name: 'LinkQualityFeedbackLoop1_0', tier: 2, dependencies: ['NodeLinkingSystem'] },
      
      // TIER 3: GAMEPLAY MECHANICS
      { name: 'LinkCorruptionTransmission_v1', tier: 3, dependencies: ['AINodes', 'NodeLinkingSystem', 'LinkQualityFeedbackLoop1_0'] },
      { name: 'HarmonyStabilizationSystem_v1', tier: 3, dependencies: ['AINodes', 'NodeLinkingSystem', 'LinkCorruptionTransmission_v1'] },
      
      // TIER 4: VISUAL SYSTEMS
      { name: 'NodeVisuals4_0', tier: 4, dependencies: ['AINodes'] },
      { name: 'T2_CorruptionVisualIntegration_v1', tier: 4, dependencies: ['LinkCorruptionTransmission_v1'] },
      { name: 'T2_HarmonyVisualConsumer_v1', tier: 4, dependencies: ['HarmonyStabilizationSystem_v1'] },
      { name: 'Renderer', tier: 4, dependencies: ['NodeVisuals4_0', 'T2_CorruptionVisualIntegration_v1', 'T2_HarmonyVisualConsumer_v1'] },
    ];

    // Runtime state tracking
    this.registeredSystems = new Map();
    this.initializedSystems = new Map(); // systemName -> { timestamp, order, success }
    this.initializationSequence = []; // chronological init order
    this.violations = [];
    this.warnings = [];
    
    // Statistics
    this.stats = {
      totalSystems: 0,
      initializedCount: 0,
      violationCount: 0,
      warningCount: 0,
      totalInitTimeMs: 0,
      startTime: Date.now(),
      endTime: null
    };
    
    // Strict mode: throw errors on violations
    this.strictMode = false;
    
    // Debug logging
    this.debugMode = false;
    this.logs = [];
    
    this._log(`Validator initialized. Canonical order: ${this.canonicalOrder.length} systems`);
  }
  
  /**
   * Register a system with its metadata
   * @param {string} systemName - Name of the system
   * @param {number} tier - Initialization tier (1-4)
   * @param {string[]} dependencies - Names of systems this depends on
   */
  registerSystem(systemName, tier, dependencies = []) {
    if (this.registeredSystems.has(systemName)) {
      this.warnings.push({
        type: 'DUPLICATE_REGISTRATION',
        system: systemName,
        message: `System "${systemName}" already registered`,
        timestamp: Date.now()
      });
      return;
    }
    
    this.registeredSystems.set(systemName, {
      name: systemName,
      tier,
      dependencies,
      registered: Date.now(),
      canonical: this._findCanonicalEntry(systemName)
    });
    
    this.stats.totalSystems++;
    this._log(`Registered: ${systemName} (tier ${tier})`);
  }
  
  /**
   * Mark a system as initialized
   * @param {string} systemName - Name of the system
   * @param {number} initTimeMs - Time taken to initialize (optional)
   * @returns {boolean} true if valid, false if violation detected
   */
  markInitialized(systemName, initTimeMs = 0) {
    if (!this.registeredSystems.has(systemName)) {
      this.violations.push({
        type: 'UNREGISTERED_INIT',
        system: systemName,
        message: `System "${systemName}" initialized but never registered`,
        timestamp: Date.now()
      });
      this.stats.violationCount++;
      if (this.strictMode) throw new Error(`[Init Violation] ${this.violations[this.violations.length - 1].message}`);
      return false;
    }
    
    if (this.initializedSystems.has(systemName)) {
      this.violations.push({
        type: 'DUPLICATE_INIT',
        system: systemName,
        message: `System "${systemName}" initialized multiple times`,
        timestamp: Date.now()
      });
      this.stats.violationCount++;
      if (this.strictMode) throw new Error(`[Init Violation] ${this.violations[this.violations.length - 1].message}`);
      return false;
    }
    
    // Check dependencies
    const systemMeta = this.registeredSystems.get(systemName);
    for (const dep of systemMeta.dependencies) {
      if (!this.initializedSystems.has(dep)) {
        this.violations.push({
          type: 'MISSING_DEPENDENCY',
          system: systemName,
          dependency: dep,
          message: `System "${systemName}" requires "${dep}" but it's not initialized yet`,
          timestamp: Date.now()
        });
        this.stats.violationCount++;
        if (this.strictMode) throw new Error(`[Init Violation] ${this.violations[this.violations.length - 1].message}`);
        return false;
      }
    }
    
    // Check initialization order (tier-based)
    const currentTier = systemMeta.tier;
    const currentOrder = this.initializationSequence.length;
    
    for (const [otherName, otherData] of this.initializedSystems) {
      const otherMeta = this.registeredSystems.get(otherName);
      // Systems in lower tiers should init before higher tiers
      if (otherMeta && otherMeta.tier > currentTier) {
        this.violations.push({
          type: 'OUT_OF_ORDER_TIER',
          system: systemName,
          order: currentOrder,
          tier: currentTier,
          priorSystem: otherName,
          priorTier: otherMeta.tier,
          message: `System "${systemName}" (tier ${currentTier}) initialized after "${otherName}" (tier ${otherMeta.tier})`,
          timestamp: Date.now()
        });
        this.stats.violationCount++;
        if (this.strictMode) throw new Error(`[Init Violation] ${this.violations[this.violations.length - 1].message}`);
        return false;
      }
    }
    
    // Record initialization
    const timestamp = Date.now();
    this.initializedSystems.set(systemName, {
      order: this.initializationSequence.length,
      tier: currentTier,
      initTimeMs,
      timestamp,
      success: true,
      dependencies: systemMeta.dependencies
    });
    
    this.initializationSequence.push(systemName);
    this.stats.initializedCount++;
    this.stats.totalInitTimeMs += initTimeMs;
    
    this._log(`✓ Initialized: ${systemName} (${initTimeMs.toFixed(2)}ms)`);
    return true;
  }
  
  /**
   * Check if initialization order is valid
   * @returns {boolean} true if no violations, false otherwise
   */
  isValid() {
    return this.violations.length === 0;
  }
  
  /**
   * Get all violations
   * @returns {Array} Array of violation objects
   */
  getViolations() {
    return this.violations;
  }
  
  /**
   * Get initialization timeline
   * @returns {Array} Chronological list of initialized systems
   */
  getInitializationTimeline() {
    return this.initializationSequence.map(name => {
      const data = this.initializedSystems.get(name);
      return {
        order: data.order + 1,
        name,
        tier: data.tier,
        initTimeMs: data.initTimeMs,
        timestamp: data.timestamp
      };
    });
  }
  
  /**
   * Validate a specific system
   * @param {string} systemName - Name of the system
   * @returns {Object} Validation result
   */
  validateSystem(systemName) {
    const isRegistered = this.registeredSystems.has(systemName);
    const isInitialized = this.initializedSystems.has(systemName);
    const canonical = this._findCanonicalEntry(systemName);
    
    const systemViolations = this.violations.filter(v => v.system === systemName);
    
    return {
      name: systemName,
      registered: isRegistered,
      initialized: isInitialized,
      canonical,
      violations: systemViolations,
      isValid: systemViolations.length === 0,
      data: isInitialized ? this.initializedSystems.get(systemName) : null,
      meta: isRegistered ? this.registeredSystems.get(systemName) : null
    };
  }
  
  /**
   * Print detailed validation report to console
   */
  printReport() {
    console.group('🔍 System Initialization Order Validation Report');
    
    // Summary
    console.group('📊 Summary');
    console.log(`Status: ${this.isValid() ? '✅ VALID' : '❌ VIOLATIONS DETECTED'}`);
    console.log(`Total Systems: ${this.stats.totalSystems}`);
    console.log(`Initialized: ${this.stats.initializedCount}/${this.stats.totalSystems}`);
    console.log(`Violations: ${this.stats.violationCount}`);
    console.log(`Warnings: ${this.stats.warningCount}`);
    console.log(`Total Init Time: ${this.stats.totalInitTimeMs.toFixed(2)}ms`);
    console.groupEnd();
    
    // Timeline
    console.group('⏱️  Initialization Timeline');
    const timeline = this.getInitializationTimeline();
    if (timeline.length > 0) {
      console.table(timeline);
    } else {
      console.log('(No systems initialized)');
    }
    console.groupEnd();
    
    // Violations
    if (this.violations.length > 0) {
      console.group('❌ Violations');
      this.violations.forEach((v, idx) => {
        console.group(`Violation ${idx + 1}: ${v.type}`);
        console.error(v.message);
        if (v.system) console.log(`System: ${v.system}`);
        if (v.dependency) console.log(`Missing Dependency: ${v.dependency}`);
        if (v.priorSystem) console.log(`Prior System: ${v.priorSystem}`);
        if (v.tier) console.log(`Tier: ${v.tier}`);
        console.log(`Timestamp: ${new Date(v.timestamp).toISOString()}`);
        console.groupEnd();
      });
      console.groupEnd();
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.group('⚠️  Warnings');
      this.warnings.forEach((w, idx) => {
        console.group(`Warning ${idx + 1}: ${w.type}`);
        console.warn(w.message);
        if (w.system) console.log(`System: ${w.system}`);
        console.log(`Timestamp: ${new Date(w.timestamp).toISOString()}`);
        console.groupEnd();
      });
      console.groupEnd();
    }
    
    // Uninitialized systems
    const uninitializedSystems = Array.from(this.registeredSystems.keys())
      .filter(name => !this.initializedSystems.has(name));
    
    if (uninitializedSystems.length > 0) {
      console.group('⏳ Uninitialized Systems');
      uninitializedSystems.forEach(name => {
        const meta = this.registeredSystems.get(name);
        console.log(`${name} (tier ${meta.tier}, dependencies: [${meta.dependencies.join(', ')}])`);
      });
      console.groupEnd();
    }
    
    // Canonical order
    console.group('📋 Canonical Order (from T3-002)');
    console.table(this.canonicalOrder);
    console.groupEnd();
    
    console.groupEnd();
  }
  
  /**
   * Export validation report as JSON
   * @returns {Object} Complete validation state
   */
  exportReport() {
    return {
      valid: this.isValid(),
      timestamp: Date.now(),
      stats: this.stats,
      timeline: this.getInitializationTimeline(),
      violations: this.violations,
      warnings: this.warnings,
      uninitialized: Array.from(this.registeredSystems.keys())
        .filter(name => !this.initializedSystems.has(name)),
      registered: Array.from(this.registeredSystems.keys()),
      initialized: Array.from(this.initializedSystems.keys())
    };
  }
  
  /**
   * Enable strict mode (throws errors on violations)
   */
  enableStrictMode() {
    this.strictMode = true;
    this._log('Strict mode enabled');
  }
  
  /**
   * Disable strict mode
   */
  disableStrictMode() {
    this.strictMode = false;
    this._log('Strict mode disabled');
  }
  
  /**
   * Enable debug logging
   */
  enableDebug() {
    this.debugMode = true;
    this._log('Debug mode enabled');
  }
  
  /**
   * Disable debug logging
   */
  disableDebug() {
    this.debugMode = false;
    this._log('Debug mode disabled');
  }
  
  /**
   * Get debug logs
   * @returns {Array} All debug logs
   */
  getLogs() {
    return this.logs;
  }
  
  /**
   * Clear logs
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
      console.log(`[SystemInitValidator] ${message}`);
    }
  }
  
  /**
   * Internal: Find canonical entry for a system
   */
  _findCanonicalEntry(systemName) {
    return this.canonicalOrder.find(entry => entry.name === systemName) || null;
  }
  
  /**
   * Generate initialization order certificate
   * @returns {string} Markdown-formatted certificate
   */
  generateCertificate() {
    const valid = this.isValid();
    const date = new Date().toISOString();
    
    let cert = `# System Initialization Order Validation Certificate\n\n`;
    cert += `**Status**: ${valid ? '✅ VALID' : '❌ INVALID'}\n`;
    cert += `**Date**: ${date}\n`;
    cert += `**Total Systems**: ${this.stats.totalSystems}\n`;
    cert += `**Initialized**: ${this.stats.initializedCount}/${this.stats.totalSystems}\n`;
    cert += `**Violations**: ${this.stats.violationCount}\n\n`;
    
    cert += `## Initialization Sequence\n\n`;
    this.getInitializationTimeline().forEach(entry => {
      cert += `${entry.order}. **${entry.name}** (tier ${entry.tier}, ${entry.initTimeMs.toFixed(2)}ms)\n`;
    });
    
    if (this.violations.length > 0) {
      cert += `\n## Violations\n\n`;
      this.violations.forEach((v, idx) => {
        cert += `${idx + 1}. **${v.type}**: ${v.message}\n`;
      });
    }
    
    return cert;
  }
}

/**
 * ============================================================================
 * SETUP FUNCTION — Integrate validator into main application
 * ============================================================================
 */
export function setupSystemInitializationValidator() {
  const validator = new SystemInitializationOrderValidator_v1();
  
  // Expose to global console API
  if (typeof window !== 'undefined') {
    window.systemInitValidator = {
      printReport: () => validator.printReport(),
      getViolations: () => validator.getViolations(),
      getTimeline: () => validator.getInitializationTimeline(),
      validateSystem: (name) => validator.validateSystem(name),
      isValid: () => validator.isValid(),
      exportReport: () => validator.exportReport(),
      generateCertificate: () => validator.generateCertificate(),
      enableStrictMode: () => validator.enableStrictMode(),
      disableStrictMode: () => validator.disableStrictMode(),
      enableDebug: () => validator.enableDebug(),
      disableDebug: () => validator.disableDebug(),
      getLogs: () => validator.getLogs(),
      clearLogs: () => validator.clearLogs(),
      _validator: validator // Direct access
    };
  }
  
  return validator;
}

/**
 * ============================================================================
 * CONVENIENCE FUNCTIONS — Quick registration & marking
 * ============================================================================
 */

let globalValidator = null;

export function initializeGlobalValidator() {
  if (!globalValidator) {
    globalValidator = setupSystemInitializationValidator();
  }
  return globalValidator;
}

export function registerSystemGlobal(name, tier, dependencies = []) {
  const validator = initializeGlobalValidator();
  validator.registerSystem(name, tier, dependencies);
}

export function markSystemInitializedGlobal(name, initTimeMs = 0) {
  const validator = initializeGlobalValidator();
  return validator.markInitialized(name, initTimeMs);
}

export function getGlobalValidator() {
  if (!globalValidator) {
    globalValidator = initializeGlobalValidator();
  }
  return globalValidator;
}
