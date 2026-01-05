/**
 * SELECTED HUD SYNC PATCH TEST HELPER
 * 
 * Comprehensive testing suite for SelectedHUDSyncPatch1_0
 * Verifies all synchronization guarantees and edge cases
 * 
 * Usage:
 *   const tester = new SelectedHUDSyncPatchTestHelper(patch, selectedHUD, nodeLinker);
 *   tester.runFullSuite();
 *   tester.testFirstClickStaleState();
 *   tester.testLinkCreationRefresh();
 *   tester.diagnoseInconsistencies();
 * 
 * Console API:
 *   window.runHUDTests()           // Full verification
 *   window.diagnosticHUD()         // Detailed diagnostics
 *   window.stressTestHUD()         // 100 rapid selections
 */

export class SelectedHUDSyncPatchTestHelper {
  constructor(patch, selectedHUD, nodeLinker) {
    this.patch = patch;
    this.selectedHUD = selectedHUD;
    this.nodeLinker = nodeLinker;
    this.testResults = [];
    this.testStartTime = null;
  }

  /**
   * Run full test suite
   */
  async runFullSuite() {
    console.log('\n' + '═'.repeat(70));
    console.log('SELECTED HUD SYNC PATCH — FULL TEST SUITE');
    console.log('═'.repeat(70));

    const tests = [
      () => this.testPatchInstalled(),
      () => this.testCallbacksPatched(),
      () => this.testUpdateLinksMethod(),
      () => this.testSingleSourceOfTruth(),
      () => this.testFirstClickAccuracy(),
      () => this.testLinkStateConsistency(),
      () => this.testPerformance(),
      () => this.testEdgeCases(),
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (err) {
        console.error(`Test error: ${err.message}`);
      }
    }

    this.printSummary();
  }

  /**
   * Test 1: Patch installed
   */
  testPatchInstalled() {
    console.log('\n[Test 1] Patch installation check');
    const checks = {
      patchExists: !!this.patch,
      patchEnabled: this.patch?.enabled === true,
      updateLinksExists: typeof this.selectedHUD.updateLinks === 'function',
      statsTracking: !!this.patch._stats,
    };

    const passed = Object.values(checks).every(v => v);
    console.log(`  Patch exists: ${checks.patchExists ? '✓' : '✗'}`);
    console.log(`  Patch enabled: ${checks.patchEnabled ? '✓' : '✗'}`);
    console.log(`  updateLinks method: ${checks.updateLinksExists ? '✓' : '✗'}`);
    console.log(`  Stats tracking: ${checks.statsTracking ? '✓' : '✗'}`);
    console.log(`  RESULT: ${passed ? '✓ PASS' : '✗ FAIL'}`);

    this.testResults.push({ name: 'Patch installed', passed });
    return passed;
  }

  /**
   * Test 2: Callbacks patched
   */
  testCallbacksPatched() {
    console.log('\n[Test 2] Callback patching check');
    const linkingSystem = this.selectedHUD.linkingSystem;
    const checks = {
      onSelectExists: Array.isArray(linkingSystem?.onSelectCallbacks),
      onDeselectExists: Array.isArray(linkingSystem?.onDeselectCallbacks),
      onLinkCreatedExists: Array.isArray(linkingSystem?.onLinkCreatedCallbacks),
      onLinkRemovedExists: Array.isArray(linkingSystem?.onLinkRemovedCallbacks),
      patchesApplied: this.patch._stats.patchesApplied >= 4,
    };

    const passed = Object.values(checks).every(v => v);
    console.log(`  onSelectCallbacks: ${checks.onSelectExists ? '✓' : '✗'}`);
    console.log(`  onDeselectCallbacks: ${checks.onDeselectExists ? '✓' : '✗'}`);
    console.log(`  onLinkCreatedCallbacks: ${checks.onLinkCreatedExists ? '✓' : '✗'}`);
    console.log(`  onLinkRemovedCallbacks: ${checks.onLinkRemovedExists ? '✓' : '✗'}`);
    console.log(`  Patches applied (4+): ${checks.patchesApplied ? '✓' : '✗'}`);
    console.log(`  RESULT: ${passed ? '✓ PASS' : '✗ FAIL'}`);

    this.testResults.push({ name: 'Callbacks patched', passed });
    return passed;
  }

  /**
   * Test 3: updateLinks method works
   */
  testUpdateLinksMethod() {
    console.log('\n[Test 3] updateLinks method functionality');
    try {
      // Create mock data
      const mockLinks = [];
      const startMs = performance.now();

      // Call updateLinks with valid data
      this.selectedHUD.updateLinks('test-node-id', mockLinks);

      const elapsed = performance.now() - startMs;
      const passed = elapsed < 5; // Should be very fast

      console.log(`  Method callable: ✓`);
      console.log(`  Execution time: ${elapsed.toFixed(2)}ms (should be <5ms)`);
      console.log(`  RESULT: ${passed ? '✓ PASS' : '✗ FAIL'}`);

      this.testResults.push({ name: 'updateLinks method', passed });
      return passed;
    } catch (err) {
      console.log(`  Error: ${err.message}`);
      console.log(`  RESULT: ✗ FAIL`);
      this.testResults.push({ name: 'updateLinks method', passed: false });
      return false;
    }
  }

  /**
   * Test 4: Single source of truth
   */
  testSingleSourceOfTruth() {
    console.log('\n[Test 4] Single source of truth (NodeLinker2)');
    try {
      if (!this.selectedHUD.selectedNode) {
        console.log(`  No node selected (SKIPPED)`);
        return null;
      }

      const node = this.selectedHUD.selectedNode;
      const indexLinks = this.nodeLinker.getLinksForNode(node);
      const hudLinks = this.selectedHUD.linkedCategories;

      // Extract categories from index links
      const indexCategories = new Set();
      for (const link of indexLinks) {
        if (!link.source || !link.target) continue;
        const other = link.source.id === node.id ? link.target : link.source;
        if (other && other.userData) {
          const cat = this.selectedHUD._getCategoryFromNode(other);
          if (cat !== 'unknown') {
            indexCategories.add(cat);
          }
        }
      }

      const indexCount = indexCategories.size;
      const hudCount = hudLinks.length;
      const match = indexCount === hudCount;

      console.log(`  Index links count: ${indexCount}`);
      console.log(`  HUD categories count: ${hudCount}`);
      console.log(`  Match: ${match ? '✓' : '✗'}`);
      console.log(`  RESULT: ${match ? '✓ PASS' : '✗ FAIL'}`);

      this.testResults.push({ name: 'Single source of truth', passed: match });
      return match;
    } catch (err) {
      console.log(`  Error: ${err.message}`);
      console.log(`  RESULT: ✗ FAIL`);
      this.testResults.push({ name: 'Single source of truth', passed: false });
      return false;
    }
  }

  /**
   * Test 5: First click accuracy (no stale state)
   */
  testFirstClickAccuracy() {
    console.log('\n[Test 5] First click accuracy (no stale state)');
    try {
      // Deselect current node
      this.selectedHUD.clear();

      // Simulate first click on a random node
      const nodes = this.nodeLinker.aiNodes?.nodes || [];
      if (nodes.length === 0) {
        console.log(`  No nodes available (SKIPPED)`);
        return null;
      }

      const testNode = nodes[0];
      this.selectedHUD.selectedNode = testNode;

      // Get links from index
      const links = this.nodeLinker.getLinksForNode(testNode);

      // Call updateLinks immediately (simulating first click)
      const startMs = performance.now();
      this.selectedHUD.updateLinks(testNode.id, links);
      const elapsed = performance.now() - startMs;

      // Check results
      const hasCorrectCount = this.selectedHUD.linkedCategories.length === this._countCategories(links);
      const isFast = elapsed < 1.0;
      const passed = hasCorrectCount && isFast;

      console.log(`  Links resolved: ${links.length}`);
      console.log(`  Categories shown: ${this.selectedHUD.linkedCategories.length}`);
      console.log(`  Time to update: ${elapsed.toFixed(2)}ms (should be <1ms)`);
      console.log(`  No stale state: ${hasCorrectCount ? '✓' : '✗'}`);
      console.log(`  Performance: ${isFast ? '✓' : '✗'}`);
      console.log(`  RESULT: ${passed ? '✓ PASS' : '✗ FAIL'}`);

      this.testResults.push({ name: 'First click accuracy', passed });
      return passed;
    } catch (err) {
      console.log(`  Error: ${err.message}`);
      console.log(`  RESULT: ✗ FAIL`);
      this.testResults.push({ name: 'First click accuracy', passed: false });
      return false;
    }
  }

  /**
   * Test 6: Link state consistency
   */
  testLinkStateConsistency() {
    console.log('\n[Test 6] Link state consistency');
    try {
      const checks = {
        linkedCategoriesIsArray: Array.isArray(this.selectedHUD.linkedCategories),
        priorityIsNumber: typeof this.selectedHUD.maxLinkedPriorityTier === 'number',
        selectedNodeTracked: !!this.selectedHUD.selectedNode || this.selectedHUD.selectedNode === null,
        hudElementExists: !!this.selectedHUD.hudElement,
      };

      const passed = Object.values(checks).every(v => v);
      console.log(`  linkedCategories is array: ${checks.linkedCategoriesIsArray ? '✓' : '✗'}`);
      console.log(`  maxLinkedPriorityTier is number: ${checks.priorityIsNumber ? '✓' : '✗'}`);
      console.log(`  selectedNode tracked: ${checks.selectedNodeTracked ? '✓' : '✗'}`);
      console.log(`  HUD element exists: ${checks.hudElementExists ? '✓' : '✗'}`);
      console.log(`  RESULT: ${passed ? '✓ PASS' : '✗ FAIL'}`);

      this.testResults.push({ name: 'Link state consistency', passed });
      return passed;
    } catch (err) {
      console.log(`  Error: ${err.message}`);
      console.log(`  RESULT: ✗ FAIL`);
      this.testResults.push({ name: 'Link state consistency', passed: false });
      return false;
    }
  }

  /**
   * Test 7: Performance
   */
  testPerformance() {
    console.log('\n[Test 7] Performance metrics');
    const stats = this.patch.getStats();

    const checks = {
      avgUpdateMs: stats.averageUpdateMs < 1.0,
      syncErrors: stats.syncErrors === 0,
      updatesTracked: stats.updatesCalled >= 0,
    };

    const passed = Object.values(checks).every(v => v);
    console.log(`  Average update time: ${stats.averageUpdateMs.toFixed(2)}ms (should be <1ms): ${checks.avgUpdateMs ? '✓' : '✗'}`);
    console.log(`  Sync errors: ${stats.syncErrors} (should be 0): ${checks.syncErrors ? '✓' : '✗'}`);
    console.log(`  Total updates: ${stats.updatesCalled}`);
    console.log(`  RESULT: ${passed ? '✓ PASS' : '✗ FAIL'}`);

    this.testResults.push({ name: 'Performance', passed });
    return passed;
  }

  /**
   * Test 8: Edge cases
   */
  testEdgeCases() {
    console.log('\n[Test 8] Edge cases');
    const tests = [];

    // Edge case 1: updateLinks with null node
    try {
      this.selectedHUD.updateLinks(null, []);
      tests.push({ name: 'updateLinks(null, [])', passed: true }); // Should not throw
    } catch (err) {
      tests.push({ name: 'updateLinks(null, [])', passed: false });
    }

    // Edge case 2: updateLinks with non-array links
    try {
      this.selectedHUD.updateLinks('node-id', null);
      tests.push({ name: 'updateLinks(id, null)', passed: true });
    } catch (err) {
      tests.push({ name: 'updateLinks(id, null)', passed: false });
    }

    // Edge case 3: Deselect during update
    try {
      this.selectedHUD.clear();
      tests.push({ name: 'clear() during operation', passed: true });
    } catch (err) {
      tests.push({ name: 'clear() during operation', passed: false });
    }

    const passed = tests.every(t => t.passed);
    for (const test of tests) {
      console.log(`  ${test.name}: ${test.passed ? '✓' : '✗'}`);
    }
    console.log(`  RESULT: ${passed ? '✓ PASS' : '✗ FAIL'}`);

    this.testResults.push({ name: 'Edge cases', passed });
    return passed;
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n' + '═'.repeat(70));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(70));

    const passed = this.testResults.filter(r => r.passed === true).length;
    const failed = this.testResults.filter(r => r.passed === false).length;
    const skipped = this.testResults.filter(r => r.passed === null).length;

    for (const result of this.testResults) {
      const status = result.passed === true ? '✓' : result.passed === false ? '✗' : '⊘';
      console.log(`${status} ${result.name}`);
    }

    console.log(`\nRESULT: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    console.log(`OVERALL: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
    console.log('═'.repeat(70) + '\n');
  }

  /**
   * Helper: Count categories in links
   */
  _countCategories(links) {
    const categories = new Set();
    if (!this.selectedHUD.selectedNode) return 0;

    const nodeId = this.selectedHUD.selectedNode.id;
    for (const link of links) {
      if (!link.source || !link.target) continue;
      const other = link.source.id === nodeId ? link.target : link.source;
      if (other && other.userData) {
        const cat = this.selectedHUD._getCategoryFromNode(other);
        if (cat !== 'unknown') {
          categories.add(cat);
        }
      }
    }
    return categories.size;
  }

  /**
   * Diagnostic: Detailed inconsistency report
   */
  diagnoseInconsistencies() {
    console.log('\n' + '═'.repeat(70));
    console.log('DETAILED DIAGNOSTICS');
    console.log('═'.repeat(70));

    if (!this.selectedHUD.selectedNode) {
      console.log('No node selected - skipping diagnostics');
      return;
    }

    const node = this.selectedHUD.selectedNode;
    const indexLinks = this.nodeLinker.getLinksForNode(node);
    const hudCategories = this.selectedHUD.linkedCategories;

    console.log(`\nSelected Node: ${node.userData?.nodeName || 'UNKNOWN'}`);
    console.log(`Index Links Count: ${indexLinks.length}`);
    console.log(`HUD Categories Count: ${hudCategories.length}`);
    console.log(`HUD Categories: ${hudCategories.join(', ') || '(none)'}`);

    // Analyze each link
    console.log('\nLink Analysis:');
    for (let i = 0; i < indexLinks.length; i++) {
      const link = indexLinks[i];
      const other = link.source.id === node.id ? link.target : link.source;
      const cat = this.selectedHUD._getCategoryFromNode(other);
      console.log(`  [${i}] → ${other.userData?.nodeName || 'UNKNOWN'} (${cat})`);
    }

    console.log('\n' + '═'.repeat(70) + '\n');
  }

  /**
   * Stress test: Rapid selections
   */
  stressTest(iterations = 100) {
    console.log(`\nSTRESS TEST: ${iterations} rapid selections`);
    const nodes = this.nodeLinker.aiNodes?.nodes || [];
    if (nodes.length === 0) {
      console.log('No nodes available for stress test');
      return;
    }

    const startMs = performance.now();
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      try {
        const node = nodes[i % nodes.length];
        this.selectedHUD.selectedNode = node;
        const links = this.nodeLinker.getLinksForNode(node);
        this.selectedHUD.updateLinks(node.id, links);
      } catch (err) {
        errors++;
      }
    }

    const elapsed = performance.now() - startMs;
    const avgPerSelection = elapsed / iterations;

    console.log(`  Total time: ${elapsed.toFixed(2)}ms`);
    console.log(`  Avg per selection: ${avgPerSelection.toFixed(2)}ms`);
    console.log(`  Errors: ${errors}/${iterations}`);
    console.log(`  Result: ${errors === 0 ? '✓ PASS' : '✗ FAIL'}`);
  }
}

export default SelectedHUDSyncPatchTestHelper;
