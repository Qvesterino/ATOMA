/**
 * METRIC RUNTIME ADAPTER TEST SUITE
 * 
 * PURPOSE:
 * - Validate adapter layer functionality
 * - Test backward compatibility with legacy fields
 * - Test runtime state management
 * - Test migration utilities
 * 
 * USAGE:
 * Run in browser console or Node.js environment
 */

import { 
  NodeMetricRuntimeAdapter, 
  LinkMetricRuntimeAdapter, 
  MetricMigrationUtility 
} from '../src/metrics/MetricRuntimeAdapter.js';

class MetricRuntimeAdapterTestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = [];
  }

  /**
   * Run all tests
   */
  runAll() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  METRIC RUNTIME ADAPTER TEST SUITE                        ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    this.testNodeMetricAdapter();
    this.testLinkMetricAdapter();
    this.testNodeRuntimeState();
    this.testLinkRuntimeState();
    this.testMigrationUtilities();
    this.testValidationUtilities();

    this.printSummary();
  }

  /**
   * Test NodeMetricRuntimeAdapter
   */
  testNodeMetricAdapter() {
    console.log('📋 Testing NodeMetricRuntimeAdapter...');
    console.log('');

    // Test 1: Read from canonical metrics
    this.test('Canonical metric read', () => {
      const node = this.createMockNode({
        metrics: { synergy: 0.8, harmony: 0.6, corruption: 0.2 }
      });

      const synergy = NodeMetricRuntimeAdapter.getMetric(node, 'synergy');
      const harmony = NodeMetricRuntimeAdapter.getMetric(node, 'harmony');
      const corruption = NodeMetricRuntimeAdapter.getMetric(node, 'corruption');

      return synergy === 0.8 && harmony === 0.6 && corruption === 0.2;
    });

    // Test 2: Fallback to legacy fields
    this.test('Legacy field fallback', () => {
      const node = this.createMockNode({
        synergy: 0.7,
        harmony: 0.5,
        corruption: 0.3
      });

      const synergy = NodeMetricRuntimeAdapter.getMetric(node, 'synergy');
      const harmony = NodeMetricRuntimeAdapter.getMetric(node, 'harmony');
      const corruption = NodeMetricRuntimeAdapter.getMetric(node, 'corruption');

      return synergy === 0.7 && harmony === 0.5 && corruption === 0.3;
    });

    // Test 3: Value clamping (0..1)
    this.test('Value clamping', () => {
      const node = this.createMockNode({
        metrics: { synergy: 1.5, harmony: -0.5, corruption: 0.8 }
      });

      const synergy = NodeMetricRuntimeAdapter.getMetric(node, 'synergy');
      const harmony = NodeMetricRuntimeAdapter.getMetric(node, 'harmony');
      const corruption = NodeMetricRuntimeAdapter.getMetric(node, 'corruption');

      return synergy === 1.0 && harmony === 0.0 && corruption === 0.8;
    });

    // Test 4: Default values
    this.test('Default values', () => {
      const node = this.createMockNode({});

      const synergy = NodeMetricRuntimeAdapter.getMetric(node, 'synergy');
      const harmony = NodeMetricRuntimeAdapter.getMetric(node, 'harmony');

      return synergy === 0 && harmony === 0;
    });

    // Test 5: Get all metrics
    this.test('Get all metrics', () => {
      const node = this.createMockNode({
        metrics: { 
          synergy: 0.8, 
          harmony: 0.6, 
          stability: 0.7, 
          corruption: 0.2, 
          loadPressure: 0.4 
        }
      });

      const metrics = NodeMetricRuntimeAdapter.getAllMetrics(node);

      return metrics.synergy === 0.8 &&
             metrics.harmony === 0.6 &&
             metrics.stability === 0.7 &&
             metrics.corruption === 0.2 &&
             metrics.loadPressure === 0.4;
    });

    console.log('');
  }

  /**
   * Test LinkMetricRuntimeAdapter
   */
  testLinkMetricAdapter() {
    console.log('📋 Testing LinkMetricRuntimeAdapter...');
    console.log('');

    // Test 1: Read canonical synergy
    this.test('Canonical synergy read', () => {
      const link = this.createMockLink({
        synergy: { score: 0.85, synergyNorm: 0.9 }
      });

      const synergy = LinkMetricRuntimeAdapter.getSynergy(link);
      return synergy === 0.85;
    });

    // Test 2: Read canonical corruption
    this.test('Canonical corruption read', () => {
      const link = this.createMockLink({
        corruptionLevel: 0.3
      });

      const corruption = LinkMetricRuntimeAdapter.getCorruption(link);
      return corruption === 0.3;
    });

    // Test 3: Fallback to legacy synergy
    this.test('Legacy synergy fallback', () => {
      const link = this.createMockLink({
        synergyScore: 0.75
      });

      const synergy = LinkMetricRuntimeAdapter.getSynergy(link);
      return synergy === 0.75;
    });

    // Test 4: Fallback to legacy corruption
    this.test('Legacy corruption fallback', () => {
      const link = this.createMockLink({
        corruption: 0.25
      });

      const corruption = LinkMetricRuntimeAdapter.getCorruption(link);
      return corruption === 0.25;
    });

    // Test 5: Default values
    this.test('Default values', () => {
      const link = this.createMockLink({});

      const synergy = LinkMetricRuntimeAdapter.getSynergy(link);
      const corruption = LinkMetricRuntimeAdapter.getCorruption(link);

      return synergy === 0.5 && corruption === 0;
    });

    console.log('');
  }

  /**
   * Test node runtime state management
   */
  testNodeRuntimeState() {
    console.log('📋 Testing Node Runtime State...');
    console.log('');

    // Test 1: Initialize runtime state
    this.test('Initialize runtime state', () => {
      const node = this.createMockNode({});
      NodeMetricRuntimeAdapter.ensureRuntimeState(node);

      return node.userData.runtime !== undefined &&
             node.userData.runtime.visualState !== undefined &&
             node.userData.runtime.effectsState !== undefined &&
             node.userData.runtime.animationState !== undefined &&
             node.userData.runtime.metadata !== undefined;
    });

    // Test 2: Get runtime state
    this.test('Get runtime state', () => {
      const node = this.createMockNode({});
      NodeMetricRuntimeAdapter.setRuntimeState(node, 'effectsState.synergyPulse.active', true);

      const active = NodeMetricRuntimeAdapter.getRuntimeState(node, 'effectsState.synergyPulse.active');
      return active === true;
    });

    // Test 3: Set runtime state
    this.test('Set runtime state', () => {
      const node = this.createMockNode({});
      NodeMetricRuntimeAdapter.setRuntimeState(node, 'effectsState.synergyPulse.score', 0.9);
      NodeMetricRuntimeAdapter.setRuntimeState(node, 'effectsState.synergyPulse.lastPulseTime', 12345);

      const score = NodeMetricRuntimeAdapter.getRuntimeState(node, 'effectsState.synergyPulse.score');
      const time = NodeMetricRuntimeAdapter.getRuntimeState(node, 'effectsState.synergyPulse.lastPulseTime');

      return score === 0.9 && time === 12345;
    });

    // Test 4: Migrate legacy runtime state
    this.test('Migrate legacy runtime state', () => {
      const node = this.createMockNode({
        synergyPulseActive: true,
        synergyScore: 0.8,
        lastPulseTime: 999,
        harmonyStabilized: true,
        harmonyDampingFactor: 0.2,
        visualReady: true,
        visualReadyAt: 500,
        visualLocked: true
      });

      const report = NodeMetricRuntimeAdapter.migrateRuntimeState(node);

      return report.migrated &&
             report.fieldsMigrated.includes('synergyPulse') &&
             report.fieldsMigrated.includes('harmonyStabilized') &&
             report.fieldsMigrated.includes('visualReady') &&
             report.fieldsMigrated.includes('visualLocked');
    });

    console.log('');
  }

  /**
   * Test link runtime state management
   */
  testLinkRuntimeState() {
    console.log('📋 Testing Link Runtime State...');
    console.log('');

    // Test 1: Initialize runtime state
    this.test('Initialize runtime state', () => {
      const link = this.createMockLink({});
      LinkMetricRuntimeAdapter.ensureRuntimeState(link);

      return link.userData.runtime !== undefined &&
             link.userData.runtime.visualState !== undefined &&
             link.userData.runtime.effectsState !== undefined &&
             link.userData.runtime.animationState !== undefined;
    });

    // Test 2: Get runtime state
    this.test('Get runtime state', () => {
      const link = this.createMockLink({});
      LinkMetricRuntimeAdapter.setRuntimeState(link, 'effectsState.synergyCollapse.active', true);

      const active = LinkMetricRuntimeAdapter.getRuntimeState(link, 'effectsState.synergyCollapse.active');
      return active === true;
    });

    // Test 3: Set runtime state
    this.test('Set runtime state', () => {
      const link = this.createMockLink({});
      LinkMetricRuntimeAdapter.setRuntimeState(link, 'effectsState.synergyCollapse.cascadeTime', 67890);

      const time = LinkMetricRuntimeAdapter.getRuntimeState(link, 'effectsState.synergyCollapse.cascadeTime');
      return time === 67890;
    });

    // Test 4: Migrate legacy runtime state
    this.test('Migrate legacy runtime state', () => {
      const link = this.createMockLink({
        synergyCollapse: true,
        synergyCascadeTime: 111,
        visualIntensity: 0.5,
        visualTear: 0.3
      });

      const report = LinkMetricRuntimeAdapter.migrateRuntimeState(link);

      return report.migrated &&
             report.fieldsMigrated.includes('synergyCollapse') &&
             report.fieldsMigrated.includes('visualIntensity') &&
             report.fieldsMigrated.includes('visualTear');
    });

    console.log('');
  }

  /**
   * Test migration utilities
   */
  testMigrationUtilities() {
    console.log('📋 Testing Migration Utilities...');
    console.log('');

    // Test 1: Migrate all nodes
    this.test('Migrate all nodes', () => {
      const nodes = [
        this.createMockNode({ synergyPulseActive: true, synergyScore: 0.8 }),
        this.createMockNode({ harmonyStabilized: true, harmonyDampingFactor: 0.2 }),
        this.createMockNode({ visualReady: true, visualLocked: true })
      ];

      const summary = MetricMigrationUtility.migrateAllNodes(nodes);

      return summary.totalNodes === 3 &&
             summary.migratedNodes === 3 &&
             summary.totalFieldsMigrated === 5;
    });

    // Test 2: Migrate all links
    this.test('Migrate all links', () => {
      const links = [
        this.createMockLink({ synergyCollapse: true, synergyCascadeTime: 111 }),
        this.createMockLink({ visualIntensity: 0.5, visualTear: 0.3 })
      ];

      const summary = MetricMigrationUtility.migrateAllLinks(links);

      return summary.totalLinks === 2 &&
             summary.migratedLinks === 2 &&
             summary.totalFieldsMigrated === 4;
    });

    console.log('');
  }

  /**
   * Test validation utilities
   */
  testValidationUtilities() {
    console.log('📋 Testing Validation Utilities...');
    console.log('');

    // Test 1: Validate nodes with canonical metrics
    this.test('Validate valid nodes', () => {
      const nodes = [
        this.createMockNode({
          metrics: { synergy: 0.8, harmony: 0.6, stability: 0.7, corruption: 0.2, loadPressure: 0.4 }
        }),
        this.createMockNode({
          metrics: { synergy: 0.5, harmony: 0.5, stability: 0.5, corruption: 0.5, loadPressure: 0.5 }
        })
      ];

      const report = MetricMigrationUtility.validateNodes(nodes);

      return report.totalNodes === 2 &&
             report.validNodes === 2 &&
             report.invalidNodes === 0;
    });

    // Test 2: Validate nodes missing canonical metrics
    this.test('Validate invalid nodes', () => {
      const nodes = [
        this.createMockNode({}), // Missing metrics
        this.createMockNode({ metrics: { synergy: 0.8 } }) // Partial metrics
      ];

      const report = MetricMigrationUtility.validateNodes(nodes);

      return report.totalNodes === 2 &&
             report.validNodes === 0 &&
             report.invalidNodes === 2 &&
             report.issues.length === 2;
    });

    // Test 3: Validate links with canonical metrics
    this.test('Validate valid links', () => {
      const links = [
        this.createMockLink({ synergy: { score: 0.8 }, corruptionLevel: 0.2 }),
        this.createMockLink({ synergy: { score: 0.5 }, corruptionLevel: 0.5 })
      ];

      const report = MetricMigrationUtility.validateLinks(links);

      return report.totalLinks === 2 &&
             report.validLinks === 2 &&
             report.invalidLinks === 0;
    });

    // Test 4: Validate links missing canonical metrics
    this.test('Validate invalid links', () => {
      const links = [
        this.createMockLink({}), // Missing metrics
        this.createMockLink({ synergy: { score: 0.8 } }) // Missing corruptionLevel
      ];

      const report = MetricMigrationUtility.validateLinks(links);

      return report.totalLinks === 2 &&
             report.validLinks === 0 &&
             report.invalidLinks === 2 &&
             report.issues.length === 2;
    });

    console.log('');
  }

  /**
   * Create a mock node for testing
   */
  createMockNode(userData = {}) {
    return {
      id: `node-${Math.random().toString(36).substr(2, 9)}`,
      userData: {
        nodeId: `node-${Math.random().toString(36).substr(2, 9)}`,
        ...userData
      }
    };
  }

  /**
   * Create a mock link for testing
   */
  createMockLink(userData = {}) {
    return {
      id: `link-${Math.random().toString(36).substr(2, 9)}`,
      userData: {
        ...userData
      }
    };
  }

  /**
   * Run a single test
   */
  test(name, testFn) {
    try {
      const result = testFn();
      if (result) {
        this.passed++;
        console.log(`  ✅ ${name}`);
      } else {
        this.failed++;
        console.log(`  ❌ ${name} - Test returned false`);
      }
    } catch (error) {
      this.failed++;
      console.log(`  ❌ ${name} - Error: ${error.message}`);
      this.warnings.push({ test: name, error });
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    const total = this.passed + this.failed;
    const percentage = ((this.passed / total) * 100).toFixed(1);

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  TEST SUMMARY                                               ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Total Tests:  ${total}`);
    console.log(`  Passed:       ${this.passed} ✅`);
    console.log(`  Failed:       ${this.failed} ❌`);
    console.log(`  Success Rate: ${percentage}%`);
    console.log('');

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.test}: ${warning.error.message}`);
      });
      console.log('');
    }

    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('❌ Some tests failed. Please review the output above.');
    }
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  window.__ATOMA_RUN_ADAPTER_TESTS = () => {
    const suite = new MetricRuntimeAdapterTestSuite();
    suite.runAll();
  };
  
  console.log('[MetricRuntimeAdapter Test Suite] Run tests with: __ATOMA_RUN_ADAPTER_TESTS()');
}

export { MetricRuntimeAdapterTestSuite };
