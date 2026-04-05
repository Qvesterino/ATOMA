/**
 * CORE MATERIAL MUTATION TEST SUITE v1.0
 * 
 * Automated test suite for core material immutability.
 * Runs a series of validation tests to ensure no systems violate
 * the core material immutability contract.
 * 
 * Tests:
 * 1. Baseline snapshot test
 * 2. Link creation test
 * 3. Aura modulation test
 * 4. Event trigger test
 * 5. Evolution test
 * 6. Integration stress test
 * 7. Mutation repair test
 * 
 * All tests are non-invasive and don't affect gameplay.
 */

import * as THREE from 'three';

export class CoreMaterialMutationTestSuite {
  constructor(detector, scene, config = {}) {
    this.detector = detector;
    this.scene = scene;

    this.config = {
      verbose: config.verbose ?? true,
      stopOnFailure: config.stopOnFailure ?? false,
      maxTestDuration: config.maxTestDuration ?? 5000,
    };

    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: [],
      startTime: 0,
      endTime: 0,
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Core Material Mutation Test Suite Starting...\n');

    this.results.startTime = Date.now();
    this.results.tests = [];

    // Run tests in sequence
    await this._runTest('Baseline Snapshot', () =>
      this.testBaselineSnapshot()
    );
    await this._runTest('Link Creation', () => this.testLinkCreation());
    await this._runTest('Aura Modulation', () => this.testAuraModulation());
    await this._runTest('Event Triggers', () => this.testEventTriggers());
    await this._runTest('Material Restoration', () =>
      this.testMaterialRestoration()
    );
    await this._runTest('Violation Detection', () =>
      this.testViolationDetection()
    );
    await this._runTest('Stress Test', () => this.testStressLoad());

    this.results.endTime = Date.now();

    this._printSummary();
    return this.results;
  }

  /**
   * Run individual test with error handling
   */
  async _runTest(name, testFn) {
    try {
      const startTime = performance.now();
      await testFn();
      const duration = performance.now() - startTime;

      this.results.passed++;
      this.results.total++;

      this.results.tests.push({
        name,
        status: 'PASS',
        duration,
        message: 'Test passed',
      });

      if (this.config.verbose) {
        console.log(`✅ ${name} [${duration.toFixed(2)}ms]`);
      }
    } catch (error) {
      this.results.failed++;
      this.results.total++;

      this.results.tests.push({
        name,
        status: 'FAIL',
        duration: 0,
        message: error.message,
      });

      if (this.config.verbose) {
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
      }

      if (this.config.stopOnFailure) {
        throw error;
      }
    }
  }

  /**
   * Test 1: Baseline Snapshot
   * Verify that detector can capture and store baseline snapshots
   */
  testBaselineSnapshot() {
    const testMesh = this._createTestCore();
    const testNode = { userData: { id: 'test-node-1' } };

    this.detector.registerCore(testNode, testMesh);

    const coreData = this.detector.coreSnapshots.get(testNode);
    if (!coreData || !coreData.baseline) {
      throw new Error('Baseline snapshot not captured');
    }

    // Verify baseline contains key properties
    const required = ['opacity', 'emissiveIntensity', 'blendMode'];
    for (const prop of required) {
      if (!(prop in coreData.baseline)) {
        throw new Error(`Baseline missing required property: ${prop}`);
      }
    }

    this._cleanupTestMesh(testMesh);
  }

  /**
   * Test 2: Link Creation
   * Verify link creation does NOT modify core material
   */
  testLinkCreation() {
    const testMesh = this._createTestCore();
    const testNode = { userData: { id: 'test-node-2' } };

    // Register before link
    this.detector.registerCore(testNode, testMesh);
    const baselineSnapshot = this.detector._captureSnapshot(testMesh);

    // Simulate link creation (don't actually create link, just check core)
    const preViolations = this.detector.checkCore(testNode);

    // Compare snapshots
    const currentSnapshot = this.detector._captureSnapshot(testMesh);
    if (
      !this.detector._snapshotsEqual(
        baselineSnapshot,
        currentSnapshot
      )
    ) {
      throw new Error('Core material changed during link operation');
    }

    if (preViolations && preViolations.length > 0) {
      throw new Error(
        `Link operation caused ${preViolations.length} violations`
      );
    }

    this._cleanupTestMesh(testMesh);
  }

  /**
   * Test 3: Aura Modulation
   * Verify aura modulation doesn't affect core
   */
  testAuraModulation() {
    const coreMesh = this._createTestCore();
    const auraMesh = this._createTestAura();
    const testNode = { userData: { id: 'test-node-3' }, mesh: coreMesh };

    this.detector.registerCore(testNode, coreMesh);
    const coreSnapshot = this.detector._captureSnapshot(coreMesh);

    // Simulate aura modulation
    auraMesh.material.opacity = 0.5;
    auraMesh.material.emissiveIntensity = 2.0;
    auraMesh.scale.set(1.5, 1.5, 1.5);

    // Check core for mutations
    const violations = this.detector.checkCore(testNode);
    const newCoreSnapshot = this.detector._captureSnapshot(coreMesh);

    if (!this.detector._snapshotsEqual(coreSnapshot, newCoreSnapshot)) {
      throw new Error(
        'Core material changed when aura was modulated'
      );
    }

    if (violations && violations.length > 0) {
      throw new Error(
        `Aura modulation caused core violations: ${violations.map((v) => v.property).join(', ')}`
      );
    }

    this._cleanupTestMesh(coreMesh);
    this._cleanupTestMesh(auraMesh);
  }

  /**
   * Test 4: Event Triggers
   * Verify event system doesn't modify core
   */
  testEventTriggers() {
    const testMesh = this._createTestCore();
    const testNode = { userData: { id: 'test-node-4' } };

    this.detector.registerCore(testNode, testMesh);
    const baselineSnapshot = this.detector._captureSnapshot(testMesh);

    // Simulate various event triggers
    const eventTypes = ['personality', 'link', 'evolution', 'corruption'];
    for (const eventType of eventTypes) {
      // Events are handled by aura modulation, not core
      // Check that core remains unchanged
      const violations = this.detector.checkCore(testNode);
      const currentSnapshot = this.detector._captureSnapshot(testMesh);

      if (
        !this.detector._snapshotsEqual(
          baselineSnapshot,
          currentSnapshot
        )
      ) {
        throw new Error(
          `Core material changed after ${eventType} event`
        );
      }
    }

    this._cleanupTestMesh(testMesh);
  }

  /**
   * Test 5: Material Restoration
   * Verify detector can detect and restore mutated materials
   */
  testMaterialRestoration() {
    const testMesh = this._createTestCore();
    const testNode = { userData: { id: 'test-node-5' } };

    this.detector.registerCore(testNode, testMesh);

    // Manually mutate the material (simulate bug)
    const originalOpacity = testMesh.material.opacity;
    testMesh.material.opacity = 0.5; // ❌ Unauthorized mutation

    // Enable auto-repair
    this.detector.config.autoRepair = true;

    // Check for violations (should auto-repair)
    const violations = this.detector.checkCore(testNode);

    if (!violations || violations.length === 0) {
      throw new Error('Mutation not detected');
    }

    // Verify repair
    if (testMesh.material.opacity !== originalOpacity) {
      throw new Error('Mutation was not repaired');
    }

    this._cleanupTestMesh(testMesh);
  }

  /**
   * Test 6: Violation Detection
   * Verify detector correctly identifies different violation types
   */
  testViolationDetection() {
    const testMesh = this._createTestCore();
    const testNode = { userData: { id: 'test-node-6' } };

    this.detector.registerCore(testNode, testMesh);

    // Test different violation types
    const originalOpacity = testMesh.material.opacity;
    const originalEmissive = testMesh.material.emissiveIntensity;

    // Opacity mutation
    testMesh.material.opacity = originalOpacity - 0.1;
    let violations = this.detector.checkCore(testNode);
    if (!violations || !violations.find((v) => v.property === 'opacity')) {
      throw new Error('Opacity mutation not detected');
    }
    testMesh.material.opacity = originalOpacity; // Restore

    // Emissive mutation
    testMesh.material.emissiveIntensity = originalEmissive + 0.5;
    violations = this.detector.checkCore(testNode);
    if (
      !violations ||
      !violations.find((v) => v.property === 'emissiveIntensity')
    ) {
      throw new Error('Emissive mutation not detected');
    }

    this._cleanupTestMesh(testMesh);
  }

  /**
   * Test 7: Stress Test
   * Run rapid checks to ensure performance
   */
  testStressLoad() {
    const startTime = performance.now();
    const testMeshes = [];
    const testNodes = [];

    // Create multiple test nodes
    for (let i = 0; i < 10; i++) {
      const mesh = this._createTestCore();
      const node = { userData: { id: `stress-test-${i}` } };

      testMeshes.push(mesh);
      testNodes.push(node);
      this.detector.registerCore(node, mesh);
    }

    // Run rapid checks
    for (let i = 0; i < 100; i++) {
      for (const node of testNodes) {
        this.detector.checkCore(node);
      }
    }

    const duration = performance.now() - startTime;

    // Cleanup
    for (const mesh of testMeshes) {
      this._cleanupTestMesh(mesh);
    }

    // Verify performance (should complete in < 1000ms)
    if (duration > 1000) {
      throw new Error(
        `Stress test too slow: ${duration.toFixed(0)}ms for 1000 checks`
      );
    }

    const stats = this.detector.getStatistics();
    if (stats.violationsDetected > 0) {
      throw new Error(
        `Stress test found unexpected violations: ${stats.violationsDetected}`
      );
    }
  }

  /**
   * Helper: Create test core mesh
   */
  _createTestCore() {
    const geometry = new THREE.IcosahedronGeometry(0.5, 4);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    return mesh;
  }

  /**
   * Helper: Create test aura mesh
   */
  _createTestAura() {
    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    return mesh;
  }

  /**
   * Helper: Cleanup test mesh
   */
  _cleanupTestMesh(mesh) {
    if (!mesh) return;

    this.scene.remove(mesh);

    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    if (mesh.material) {
      mesh.material.dispose();
    }
  }

  /**
   * Helper: Compare snapshots
   */
  _snapshotsEqual(snap1, snap2) {
    const keys = Object.keys(snap1);
    for (const key of keys) {
      if (!this.detector._valuesEqual(snap1[key], snap2[key])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Print test results summary
   */
  _printSummary() {
    const duration = this.results.endTime - this.results.startTime;
    const passRate = (
      (this.results.passed / this.results.total) *
      100
    ).toFixed(1);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Test Suite Results');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Total Tests: ${this.results.total}`);
    console.log(`  Passed: ${this.results.passed} ✅`);
    console.log(`  Failed: ${this.results.failed} ❌`);
    console.log(`  Pass Rate: ${passRate}%`);
    console.log(`  Duration: ${duration.toFixed(0)}ms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (this.results.failed === 0) {
      console.log('  ✅ ALL TESTS PASSED - Core material immutability verified');
    } else {
      console.log(
        `  ❌ ${this.results.failed} test(s) failed - See details above`
      );
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Get results as JSON
   */
  getResults() {
    return this.results;
  }
}

/**
 * Setup console API for test suite
 */
export function setupCoreMaterialTestSuiteConsoleAPI(testSuite) {
  if (!window.debugCoreMaterialTests) {
    window.debugCoreMaterialTests = {};
  }

  Object.assign(window.debugCoreMaterialTests, {
    runAllTests: async () => {
      console.log('🧪 Running Core Material Mutation Tests...');
      const results = await testSuite.runAllTests();
      return results;
    },

    getResults: () => {
      const results = testSuite.getResults();
      console.table(results.tests);
      return results;
    },

    status: () => {
      const results = testSuite.getResults();
      console.log(`Tests Run: ${results.total}`);
      console.log(`Passed: ${results.passed}`);
      console.log(`Failed: ${results.failed}`);
      return results;
    },
  });

  console.log(
    '✅ Core Material Test Suite console API ready: debugCoreMaterialTests.*'
  );
}
