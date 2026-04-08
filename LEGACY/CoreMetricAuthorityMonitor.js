/**
 * CORE METRIC AUTHORITY MONITOR v1.0
 * 
 * Runtime enforcement of the locked metric architecture.
 * 
 * Monitors:
 * - Stat write violations (unauthorized writers)
 * - Stat mutation patterns (implicit vs explicit)
 * - New stat detection (architecture violations)
 * - Visual system read/write boundaries
 * 
 * Throws errors on authority violations.
 * Logs warnings on suspicious patterns.
 */

const AUTHORITY_CONTRACT = {
  synergy: 'SynergyEngine',
  harmony: 'HarmonySystem',
  corruption: 'CorruptionSystem',
  integrity: 'IntegritySystem',
  networkStress: 'StressCalculator'
};

const LOCKED_STATS = new Set(Object.keys(AUTHORITY_CONTRACT));

class CoreMetricAuthorityMonitor {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.throwOnViolation = config.throwOnViolation || false;
    this.debugMode = config.debugMode || false;
    
    // Violation tracking
    this.violations = [];
    this.writeAttempts = new Map();
    this.unknownStats = new Set();
    this.suspiciousPatterns = [];
    
    // Enforcement state
    this.currentWriter = null;
    this.writeStack = [];
  }
  
  /**
   * Validate and record a stat write attempt
   * Call this from authority systems only
   */
  validateStatWrite(statName, writer, value, context = {}) {
    if (!this.enabled) return;
    
    // Check if stat is in locked set
    if (!LOCKED_STATS.has(statName)) {
      const violation = {
        type: 'UNKNOWN_STAT',
        stat: statName,
        writer,
        timestamp: Date.now(),
        context
      };
      this.violations.push(violation);
      this.unknownStats.add(statName);
      
      console.warn(`[CoreMetric] Unknown stat write: ${statName} by ${writer}`);
      return;
    }
    
    // Verify authority
    const authorizedWriter = AUTHORITY_CONTRACT[statName];
    if (writer !== authorizedWriter) {
      const violation = {
        type: 'AUTHORITY_VIOLATION',
        stat: statName,
        writer,
        authorized: authorizedWriter,
        value,
        timestamp: Date.now(),
        context,
        stack: new Error().stack
      };
      this.violations.push(violation);
      
      const message = `[AUTHORITY VIOLATION] ${statName} written by ${writer} (authorized: ${authorizedWriter})`;
      console.error(message);
      
      if (this.throwOnViolation) {
        throw new Error(message);
      }
      return;
    }
    
    // Track valid write
    if (!this.writeAttempts.has(writer)) {
      this.writeAttempts.set(writer, []);
    }
    this.writeAttempts.get(writer).push({
      stat: statName,
      value,
      timestamp: Date.now(),
      context
    });
  }
  
  /**
   * Detect implicit stat mutations (suspicious patterns)
   */
  detectSuspiciousPattern(operation, details) {
    if (!this.enabled) return;
    
    // Pattern: stat being modified outside of writer authority
    if (operation === 'IMPLICIT_MUTATION') {
      const pattern = {
        type: 'IMPLICIT_MUTATION',
        stat: details.stat,
        location: details.location,
        operationType: details.operationType,  // *=, +=, ++, etc.
        timestamp: Date.now()
      };
      this.suspiciousPatterns.push(pattern);
      console.warn(`[CoreMetric] Implicit mutation detected: ${details.stat} ${details.operationType}`);
    }
    
    // Pattern: Visual system writing stats
    if (operation === 'VISUAL_WRITE_ATTEMPT') {
      const violation = {
        type: 'VISUAL_WRITE_VIOLATION',
        stat: details.stat,
        system: details.system,
        timestamp: Date.now()
      };
      this.violations.push(violation);
      console.error(`[CoreMetric] Visual system attempted stat write: ${details.system}.${details.stat}`);
    }
    
    // Pattern: Ritual writing stats
    if (operation === 'RITUAL_WRITE_ATTEMPT') {
      const violation = {
        type: 'RITUAL_WRITE_VIOLATION',
        stat: details.stat,
        ritual: details.ritual,
        timestamp: Date.now()
      };
      this.violations.push(violation);
      console.error(`[CoreMetric] Ritual attempted stat write: ${details.ritual}.${details.stat}`);
    }
  }
  
  /**
   * Verify node userData doesn't have unknown stats
   */
  auditNodeStats(node, nodeId) {
    if (!node?.userData) return;
    
    const coreStatKeys = Object.keys(AUTHORITY_CONTRACT);
    const nodeKeys = Object.keys(node.userData);
    
    for (const key of nodeKeys) {
      if (LOCKED_STATS.has(key) && !coreStatKeys.includes(key)) {
        console.warn(`[CoreMetric Audit] Unknown stat on node ${nodeId}: ${key}`);
      }
    }
  }
  
  /**
   * Verify authority system has sole write access
   */
  verifyWriteExclusivity(stat) {
    if (!LOCKED_STATS.has(stat)) {
      return { valid: false, reason: 'Stat not in locked set' };
    }
    
    const authorizedWriter = AUTHORITY_CONTRACT[stat];
    const writers = this.writeAttempts.keys();
    
    const unauthorized = [];
    for (const writer of writers) {
      const attempts = this.writeAttempts.get(writer);
      for (const attempt of attempts) {
        if (attempt.stat === stat && writer !== authorizedWriter) {
          unauthorized.push(writer);
        }
      }
    }
    
    if (unauthorized.length > 0) {
      return {
        valid: false,
        reason: 'Multiple writers detected',
        writers: unauthorized
      };
    }
    
    return { valid: true, writer: authorizedWriter };
  }
  
  /**
   * Generate compliance report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      enabled: this.enabled,
      violations: this.violations.length,
      suspiciousPatterns: this.suspiciousPatterns.length,
      unknownStats: Array.from(this.unknownStats),
      writerStats: {},
      complianceStatus: 'COMPLIANT'
    };
    
    // Authority compliance per stat
    for (const stat of LOCKED_STATS) {
      const compliance = this.verifyWriteExclusivity(stat);
      report[`${stat}_compliance`] = compliance;
      if (!compliance.valid) {
        report.complianceStatus = 'VIOLATION';
      }
    }
    
    // Write volume per authority
    for (const [writer, attempts] of this.writeAttempts) {
      report.writerStats[writer] = {
        totalWrites: attempts.length,
        stmtsWritten: [...new Set(attempts.map(a => a.stat))]
      };
    }
    
    return report;
  }
  
  /**
   * Get all violations
   */
  getViolations() {
    return this.violations;
  }
  
  /**
   * Clear violation history (for testing)
   */
  clearHistory() {
    this.violations = [];
    this.suspiciousPatterns = [];
    this.unknownStats = new Set();
    this.writeAttempts.clear();
  }
  
  /**
   * Print compliance report to console
   */
  printReport() {
    const report = this.generateReport();
    console.log('='.repeat(60));
    console.log('CORE METRIC AUTHORITY COMPLIANCE REPORT');
    console.log('='.repeat(60));
    console.table(report);
    
    if (this.violations.length > 0) {
      console.log('\n--- VIOLATIONS ---');
      console.table(this.violations);
    }
    
    if (this.suspiciousPatterns.length > 0) {
      console.log('\n--- SUSPICIOUS PATTERNS ---');
      console.table(this.suspiciousPatterns);
    }
    
    console.log('\n--- STAT AUTHORITY VERIFICATION ---');
    for (const stat of LOCKED_STATS) {
      const compliance = this.verifyWriteExclusivity(stat);
      const status = compliance.valid ? '✅' : '❌';
      console.log(`${status} ${stat}: ${compliance.reason}`);
    }
  }
}

/**
 * Global instance for monitoring
 */
let globalMonitor = null;

function initGlobalMonitor(config = {}) {
  globalMonitor = new CoreMetricAuthorityMonitor(config);
  
  if (typeof window !== 'undefined') {
    window.__CORE_METRIC_MONITOR = globalMonitor;
  }
  
  console.log('[CoreMetricAuthorityMonitor] Initialized');
  return globalMonitor;
}

function getMonitor() {
  if (!globalMonitor) {
    globalMonitor = new CoreMetricAuthorityMonitor();
  }
  return globalMonitor;
}

/**
 * Setup console API for debugging
 */
function setupMonitorConsoleAPI(monitor) {
  if (typeof window === 'undefined') return;
  
  window.__CORE_METRIC_MONITOR = monitor || getMonitor();
  
  window.__ATOMA_METRIC_AUDIT = {
    // Commands
    validateWrite: (stat, writer, value) => 
      window.__CORE_METRIC_MONITOR.validateStatWrite(stat, writer, value),
    
    detectPattern: (operation, details) => 
      window.__CORE_METRIC_MONITOR.detectSuspiciousPattern(operation, details),
    
    verifyExclusivity: (stat) => 
      window.__CORE_METRIC_MONITOR.verifyWriteExclusivity(stat),
    
    auditNode: (node, nodeId) => 
      window.__CORE_METRIC_MONITOR.auditNodeStats(node, nodeId),
    
    // Reports
    getReport: () => window.__CORE_METRIC_MONITOR.generateReport(),
    getViolations: () => window.__CORE_METRIC_MONITOR.getViolations(),
    printReport: () => window.__CORE_METRIC_MONITOR.printReport(),
    
    // Config
    setThrowOnViolation: (enabled) => {
      window.__CORE_METRIC_MONITOR.throwOnViolation = enabled;
    },
    
    setDebugMode: (enabled) => {
      window.__CORE_METRIC_MONITOR.debugMode = enabled;
    },
    
    clearHistory: () => window.__CORE_METRIC_MONITOR.clearHistory(),
    
    // Verification
    verifyAllStats: () => {
      const results = {};
      for (const stat of window.__CORE_METRIC_MONITOR.LOCKED_STATS) {
        results[stat] = window.__CORE_METRIC_MONITOR.verifyWriteExclusivity(stat);
      }
      return results;
    }
  };
  
  console.log('[CoreMetricAuthorityMonitor] Console API ready: window.__ATOMA_METRIC_AUDIT');
}

export { 
  CoreMetricAuthorityMonitor, 
  initGlobalMonitor, 
  getMonitor, 
  setupMonitorConsoleAPI,
  AUTHORITY_CONTRACT,
  LOCKED_STATS
};
