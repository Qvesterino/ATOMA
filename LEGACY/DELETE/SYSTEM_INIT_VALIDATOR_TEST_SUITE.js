/**
 * ============================================================================
 * SYSTEM INITIALIZATION ORDER VALIDATOR — TEST SUITE
 * ============================================================================
 * 
 * Comprehensive test suite for SystemInitializationOrderValidator_v1
 * 
 * Run with: node SYSTEM_INIT_VALIDATOR_TEST_SUITE.js
 * Or in browser console for integration testing
 * 
 * ============================================================================
 */

import { SystemInitializationOrderValidator_v1 } from './SystemInitializationOrderValidator_v1.js';

/**
 * Test utilities
 */
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }
  
  test(name, fn) {
    try {
      fn();
      this.passed++;
      console.log(`✅ PASS: ${name}`);
      this.tests.push({ name, status: 'PASS' });
    } catch (error) {
      this.failed++;
      console.error(`❌ FAIL: ${name}`);
      console.error(`   ${error.message}`);
      this.tests.push({ name, status: 'FAIL', error: error.message });
    }
  }
  
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }
  
  assertFalsy(value, message) {
    if (value) {
      throw new Error(message || `Expected falsy, got ${value}`);
    }
  }
  
  assertTruthy(value, message) {
    if (!value) {
      throw new Error(message || `Expected truthy, got ${value}`);
    }
  }
  
  assertLength(arr, length, message) {
    if (arr.length !== length) {
      throw new Error(message || `Expected length ${length}, got ${arr.length}`);
    }
  }
  
  summary() {
    const total = this.passed + this.failed;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST SUMMARY: ${this.passed}/${total} passed`);
    if (this.failed > 0) {
      console.log(`❌ ${this.failed} test(s) failed`);
    } else {
      console.log(`✅ All tests passed!`);
    }
    console.log(`${'='.repeat(60)}\n`);
    return this.failed === 0;
  }
}

/**
 * Test Suite
 */
function runTests() {
  const runner = new TestRunner();
  
  // ========================================================================
  // TEST GROUP 1: Basic Registration
  // ========================================================================
  
  runner.test('Create validator instance', () => {
    const v = new SystemInitializationOrderValidator_v1();
    runner.assertTruthy(v, 'Validator should be created');
    runner.assertTruthy(Array.isArray(v.canonicalOrder), 'Canonical order should exist');
    runner.assertLength(v.canonicalOrder, 10, 'Canonical order should have 10 systems');
  });
  
  runner.test('Register system', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('TestSystem', 1, []);
    runner.assertTruthy(v.registeredSystems.has('TestSystem'), 'System should be registered');
    runner.assertEqual(v.stats.totalSystems, 1, 'Total systems should be 1');
  });
  
  runner.test('Register multiple systems', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('System1', 1, []);
    v.registerSystem('System2', 1, []);
    v.registerSystem('System3', 2, ['System1']);
    runner.assertEqual(v.stats.totalSystems, 3, 'Should register 3 systems');
  });
  
  runner.test('Reject duplicate registration', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('TestSystem', 1, []);
    v.registerSystem('TestSystem', 1, []); // Duplicate
    runner.assertLength(v.warnings, 1, 'Should generate warning for duplicate');
    runner.assertEqual(v.warnings[0].type, 'DUPLICATE_REGISTRATION', 'Should be duplicate warning');
  });
  
  // ========================================================================
  // TEST GROUP 2: Initialization Tracking
  // ========================================================================
  
  runner.test('Mark system initialized', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('TestSystem', 1, []);
    const result = v.markInitialized('TestSystem', 10.5);
    runner.assertTruthy(result, 'Should return true for valid initialization');
    runner.assertEqual(v.stats.initializedCount, 1, 'Should increment initialized count');
  });
  
  runner.test('Track initialization order', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('First', 1, []);
    v.registerSystem('Second', 1, []);
    v.markInitialized('First', 10);
    v.markInitialized('Second', 15);
    runner.assertLength(v.initializationSequence, 2, 'Should track sequence');
    runner.assertEqual(v.initializationSequence[0], 'First', 'First should be first');
    runner.assertEqual(v.initializationSequence[1], 'Second', 'Second should be second');
  });
  
  runner.test('Track initialization timing', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('System1', 1, []);
    v.markInitialized('System1', 25.5);
    const data = v.initializedSystems.get('System1');
    runner.assertEqual(data.initTimeMs, 25.5, 'Should track timing');
    runner.assertEqual(v.stats.totalInitTimeMs, 25.5, 'Should accumulate timing');
  });
  
  // ========================================================================
  // TEST GROUP 3: Violation Detection
  // ========================================================================
  
  runner.test('Detect unregistered initialization', () => {
    const v = new SystemInitializationOrderValidator_v1();
    const result = v.markInitialized('UnregisteredSystem', 10);
    runner.assertFalsy(result, 'Should return false');
    runner.assertLength(v.violations, 1, 'Should have 1 violation');
    runner.assertEqual(v.violations[0].type, 'UNREGISTERED_INIT', 'Should be unregistered violation');
  });
  
  runner.test('Detect duplicate initialization', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('System1', 1, []);
    v.markInitialized('System1', 10);
    const result = v.markInitialized('System1', 15); // Duplicate
    runner.assertFalsy(result, 'Should return false for duplicate');
    runner.assertLength(v.violations, 1, 'Should have 1 violation');
    runner.assertEqual(v.violations[0].type, 'DUPLICATE_INIT', 'Should be duplicate init violation');
  });
  
  runner.test('Detect missing dependency', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('System1', 1, []);
    v.registerSystem('System2', 1, ['System1']);
    v.markInitialized('System2', 10); // System1 not initialized!
    runner.assertLength(v.violations, 1, 'Should have 1 violation');
    runner.assertEqual(v.violations[0].type, 'MISSING_DEPENDENCY', 'Should be missing dependency violation');
    runner.assertEqual(v.violations[0].dependency, 'System1', 'Should identify System1');
  });
  
  runner.test('Detect out-of-order tier', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('Tier1', 1, []);
    v.registerSystem('Tier3', 3, []);
    v.markInitialized('Tier3', 10); // Tier 3 before Tier 1!
    runner.assertLength(v.violations, 1, 'Should have 1 violation');
    runner.assertEqual(v.violations[0].type, 'OUT_OF_ORDER_TIER', 'Should be out-of-order tier violation');
  });
  
  runner.test('Allow multiple dependencies', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('Dep1', 1, []);
    v.registerSystem('Dep2', 1, []);
    v.registerSystem('System', 2, ['Dep1', 'Dep2']);
    v.markInitialized('Dep1', 10);
    v.markInitialized('Dep2', 15);
    const result = v.markInitialized('System', 20);
    runner.assertTruthy(result, 'Should accept initialization with all dependencies met');
  });
  
  runner.test('Reject if one dependency missing', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('Dep1', 1, []);
    v.registerSystem('Dep2', 1, []);
    v.registerSystem('System', 2, ['Dep1', 'Dep2']);
    v.markInitialized('Dep1', 10);
    // Dep2 not initialized!
    const result = v.markInitialized('System', 20);
    runner.assertFalsy(result, 'Should reject if dependency missing');
    runner.assertLength(v.violations, 1, 'Should have 1 violation');
  });
  
  // ========================================================================
  // TEST GROUP 4: Validation State
  // ========================================================================
  
  runner.test('isValid returns true when no violations', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('System1', 1, []);
    v.markInitialized('System1', 10);
    runner.assertTruthy(v.isValid(), 'Should be valid');
  });
  
  runner.test('isValid returns false when violations exist', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.markInitialized('UnregisteredSystem', 10);
    runner.assertFalsy(v.isValid(), 'Should be invalid');
  });
  
  runner.test('getViolations returns all violations', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.markInitialized('Unreg1', 10);
    v.markInitialized('Unreg2', 15);
    const violations = v.getViolations();
    runner.assertLength(violations, 2, 'Should return 2 violations');
  });
  
  // ========================================================================
  // TEST GROUP 5: System Validation
  // ========================================================================
  
  runner.test('validateSystem returns metadata', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('TestSystem', 1, []);
    const result = v.validateSystem('TestSystem');
    runner.assertTruthy(result.registered, 'Should be registered');
    runner.assertFalsy(result.initialized, 'Should not be initialized yet');
    runner.assertTruthy(result.isValid, 'Should be valid (no violations on registration)');
  });
  
  runner.test('validateSystem tracks violations', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('System1', 1, []);
    v.registerSystem('System2', 1, ['System1']);
    v.markInitialized('System2', 10); // System1 missing
    const result = v.validateSystem('System2');
    runner.assertFalsy(result.isValid, 'Should be invalid');
    runner.assertLength(result.violations, 1, 'Should have 1 violation');
  });
  
  // ========================================================================
  // TEST GROUP 6: Timeline & Reporting
  // ========================================================================
  
  runner.test('getInitializationTimeline returns ordered list', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('First', 1, []);
    v.registerSystem('Second', 2, []);
    v.registerSystem('Third', 3, []);
    v.markInitialized('First', 10);
    v.markInitialized('Second', 20);
    v.markInitialized('Third', 30);
    const timeline = v.getInitializationTimeline();
    runner.assertLength(timeline, 3, 'Should have 3 entries');
    runner.assertEqual(timeline[0].name, 'First', 'First should be first');
    runner.assertEqual(timeline[1].name, 'Second', 'Second should be second');
    runner.assertEqual(timeline[2].name, 'Third', 'Third should be third');
    runner.assertEqual(timeline[0].order, 1, 'Order should be 1');
    runner.assertEqual(timeline[1].order, 2, 'Order should be 2');
  });
  
  runner.test('exportReport generates complete report', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('System1', 1, []);
    v.markInitialized('System1', 15);
    const report = v.exportReport();
    runner.assertTruthy(report.valid, 'Should be valid');
    runner.assertTruthy(report.timestamp, 'Should have timestamp');
    runner.assertTruthy(report.stats, 'Should have stats');
    runner.assertTruthy(Array.isArray(report.timeline), 'Should have timeline');
    runner.assertTruthy(Array.isArray(report.violations), 'Should have violations array');
  });
  
  runner.test('generateCertificate produces markdown', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.registerSystem('System1', 1, []);
    v.markInitialized('System1', 15);
    const cert = v.generateCertificate();
    runner.assertTruthy(cert.includes('# System Initialization'), 'Should have title');
    runner.assertTruthy(cert.includes('✅ VALID'), 'Should include status');
    runner.assertTruthy(cert.includes('System1'), 'Should include system name');
  });
  
  // ========================================================================
  // TEST GROUP 7: Strict Mode
  // ========================================================================
  
  runner.test('Strict mode enabled/disabled', () => {
    const v = new SystemInitializationOrderValidator_v1();
    runner.assertFalsy(v.strictMode, 'Should start disabled');
    v.enableStrictMode();
    runner.assertTruthy(v.strictMode, 'Should be enabled');
    v.disableStrictMode();
    runner.assertFalsy(v.strictMode, 'Should be disabled');
  });
  
  runner.test('Strict mode throws on violations', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v.enableStrictMode();
    let thrown = false;
    try {
      v.markInitialized('UnregisteredSystem', 10);
    } catch (error) {
      thrown = true;
      runner.assertTruthy(error.message.includes('[Init Violation]'), 'Should mention Init Violation');
    }
    runner.assertTruthy(thrown, 'Should throw error in strict mode');
  });
  
  // ========================================================================
  // TEST GROUP 8: Debug Mode
  // ========================================================================
  
  runner.test('Debug mode enabled/disabled', () => {
    const v = new SystemInitializationOrderValidator_v1();
    runner.assertFalsy(v.debugMode, 'Should start disabled');
    v.enableDebug();
    runner.assertTruthy(v.debugMode, 'Should be enabled');
    v.disableDebug();
    runner.assertFalsy(v.debugMode, 'Should be disabled');
  });
  
  runner.test('Debug logs tracked', () => {
    const v = new SystemInitializationOrderValidator_v1();
    const initialLogCount = v.getLogs().length;
    v._log('Test message');
    const logs = v.getLogs();
    runner.assertEqual(logs.length, initialLogCount + 1, 'Should add log entry');
    runner.assertTruthy(logs[logs.length - 1].message.includes('Test message'), 'Should record message');
  });
  
  runner.test('Clear logs', () => {
    const v = new SystemInitializationOrderValidator_v1();
    v._log('Message 1');
    v._log('Message 2');
    runner.assertTruthy(v.getLogs().length > 0, 'Should have logs');
    v.clearLogs();
    runner.assertEqual(v.getLogs().length, 0, 'Should clear logs');
  });
  
  // ========================================================================
  // TEST GROUP 9: Canonical Order Verification
  // ========================================================================
  
  runner.test('Canonical order contains expected systems', () => {
    const v = new SystemInitializationOrderValidator_v1();
    const names = v.canonicalOrder.map(s => s.name);
    runner.assertTruthy(names.includes('AINodes'), 'Should have AINodes');
    runner.assertTruthy(names.includes('NodeLinkingSystem'), 'Should have NodeLinkingSystem');
    runner.assertTruthy(names.includes('LinkCorruptionTransmission_v1'), 'Should have LinkCorruptionTransmission_v1');
    runner.assertTruthy(names.includes('HarmonyStabilizationSystem_v1'), 'Should have HarmonyStabilizationSystem_v1');
  });
  
  runner.test('Canonical order has correct tier structure', () => {
    const v = new SystemInitializationOrderValidator_v1();
    const tier1 = v.canonicalOrder.filter(s => s.tier === 1);
    const tier2 = v.canonicalOrder.filter(s => s.tier === 2);
    const tier3 = v.canonicalOrder.filter(s => s.tier === 3);
    const tier4 = v.canonicalOrder.filter(s => s.tier === 4);
    runner.assertLength(tier1, 2, 'Should have 2 tier-1 systems');
    runner.assertLength(tier2, 2, 'Should have 2 tier-2 systems');
    runner.assertLength(tier3, 2, 'Should have 2 tier-3 systems');
    runner.assertLength(tier4, 4, 'Should have 4 tier-4 systems');
  });
  
  // ========================================================================
  // TEST GROUP 10: Complex Scenarios
  // ========================================================================
  
  runner.test('Complex valid initialization sequence', () => {
    const v = new SystemInitializationOrderValidator_v1();
    
    // Register full tier 1 & 2
    v.registerSystem('AINodes', 1, []);
    v.registerSystem('NodeLinkingSystem', 1, ['AINodes']);
    v.registerSystem('ComputeSynergyScore2_1', 2, []);
    v.registerSystem('LinkQualityFeedback', 2, ['NodeLinkingSystem']);
    
    // Initialize in correct order
    v.markInitialized('AINodes', 10);
    v.markInitialized('NodeLinkingSystem', 15);
    v.markInitialized('ComputeSynergyScore2_1', 5);
    v.markInitialized('LinkQualityFeedback', 8);
    
    runner.assertTruthy(v.isValid(), 'Should be valid');
    runner.assertEqual(v.stats.initializedCount, 4, 'Should have 4 initialized');
    runner.assertEqual(v.stats.totalInitTimeMs, 38, 'Should have correct total time');
  });
  
  runner.test('Complex invalid scenario with multiple violations', () => {
    const v = new SystemInitializationOrderValidator_v1();
    
    v.registerSystem('System1', 1, []);
    v.registerSystem('System2', 2, ['System1']);
    v.registerSystem('System3', 3, ['System2']);
    
    // Initialize out of order with missing deps
    v.markInitialized('System3', 10); // System2 not initialized!
    v.markInitialized('System2', 20); // But System1 missing!
    
    runner.assertFalsy(v.isValid(), 'Should be invalid');
    runner.assertTruthy(v.violations.length > 0, 'Should have violations');
  });
  
  // ========================================================================
  // Print Summary
  // ========================================================================
  
  return runner.summary();
}

// ============================================================================
// Export for Node.js or run in browser
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  console.log('🧪 Running System Initialization Order Validator Test Suite\n');
  const allPassed = runTests();
  process.exit(allPassed ? 0 : 1);
} else {
  // Browser
  window.runSystemInitValidatorTests = runTests;
  console.log('Run tests with: window.runSystemInitValidatorTests()');
}
