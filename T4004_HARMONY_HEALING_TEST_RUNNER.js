/**
 * ============================================================================
 * T4-004: HARMONY HEALING TEST RUNNER
 * ============================================================================
 * 
 * Validates harmony healing behavior under real network conditions:
 * - Harmony spread speed
 * - Corruption reduction effectiveness
 * - Oasis zone formation
 * - Stability under load/instability stress
 * 
 * Non-breaking, read-only console API for testing.
 * No modifications to game state except corruption/harmony seeding.
 * 
 * Usage:
 *   window.validateHarmonyHealingPrerequisites()
 *   window.seedCorruptionForTest()
 *   window.runHarmonyHealingTest(durationSeconds)
 *   window.getHarmonyTestReport()
 * 
 * ============================================================================
 */

export function setupHarmonyHealingTestRunner(atomaGame) {
  const testState = {
    active: false,
    startTime: 0,
    duration: 0,
    
    // Data collection
    snapshots: [],
    corruptionTimeline: [],
    harmonyTimeline: [],
    oasisEvents: [],
    stressEvents: [],
    
    // References
    atomaGame: atomaGame,
    harmonySystem: null,
    corruptionSystem: null,
    aiNodes: null,
    linkingSystem: null,
    
    // Test parameters
    corruptionTarget: 0.45,
    harmonySourceNodes: [],
    stressAppliedAt: null
  };

  // ========================================================================
  // PREREQUISITE VALIDATION
  // ========================================================================
  
  window.validateHarmonyHealingPrerequisites = () => {
    console.log('%c[T4-004] VALIDATING HARMONY HEALING PREREQUISITES', 'color: #00ffff; font-weight: bold; font-size: 12px;');
    
    const report = {
      timestamp: new Date().toISOString(),
      checks: [],
      allPassed: true
    };
    
    // Check 1: Corruption system active
    const hasCorruptionSystem = atomaGame?.linkCorruptionTransmission !== undefined;
    report.checks.push({
      name: 'LinkCorruptionTransmission_v1 active',
      passed: hasCorruptionSystem,
      detail: hasCorruptionSystem ? 'System initialized' : 'MISSING: Corruption system not found'
    });
    if (!hasCorruptionSystem) report.allPassed = false;
    
    // Check 2: Harmony system active
    const hasHarmonySystem = atomaGame?.harmonyStabilization !== undefined;
    report.checks.push({
      name: 'HarmonyStabilizationSystem_v1 active',
      passed: hasHarmonySystem,
      detail: hasHarmonySystem ? 'System initialized' : 'MISSING: Harmony system not found'
    });
    if (!hasHarmonySystem) report.allPassed = false;
    
    // Check 3: Category-aware propagation rates available
    const hasMetrics = atomaGame?.nodeDynamicMetrics !== undefined;
    const hasPropagationCheck = atomaGame?.linkCorruptionTransmission?.getCorruptionPropagationMultiplier !== undefined;
    report.checks.push({
      name: 'Category-aware propagation rates active',
      passed: hasMetrics && hasPropagationCheck,
      detail: (hasMetrics && hasPropagationCheck) ? 'Multiplier methods available' : 'MISSING: Propagation rate system not found'
    });
    if (!hasMetrics || !hasPropagationCheck) report.allPassed = false;
    
    // Check 4: Network exists
    const hasNetwork = atomaGame?.aiNodes?.nodes && atomaGame?.aiNodes?.nodes.length > 0;
    report.checks.push({
      name: 'Active network with nodes',
      passed: hasNetwork,
      detail: hasNetwork ? `${atomaGame.aiNodes.nodes.length} nodes found` : 'MISSING: No nodes in network'
    });
    if (!hasNetwork) report.allPassed = false;
    
    // Check 5: Link system active
    const hasLinks = atomaGame?.linkingSystem !== undefined;
    report.checks.push({
      name: 'Link system active',
      passed: hasLinks,
      detail: hasLinks ? 'LinkingSystem available' : 'MISSING: Link system not found'
    });
    if (!hasLinks) report.allPassed = false;
    
    // Cache references if all checks pass
    if (report.allPassed) {
      testState.harmonySystem = atomaGame.harmonyStabilization;
      testState.corruptionSystem = atomaGame.linkCorruptionTransmission;
      testState.aiNodes = atomaGame.aiNodes;
      testState.linkingSystem = atomaGame.linkingSystem;
    }
    
    // Print report
    console.table(report.checks.map(c => ({
      'Check': c.name,
      'Status': c.passed ? '✅ PASS' : '❌ FAIL',
      'Detail': c.detail
    })));
    
    console.log('%c' + (report.allPassed ? '✅ ALL PREREQUISITES MET' : '❌ PREREQUISITES FAILED'), 
                report.allPassed ? 'color: #00ff00; font-weight: bold;' : 'color: #ff0000; font-weight: bold;');
    
    return report;
  };

  // ========================================================================
  // CORRUPTION SEEDING
  // ========================================================================
  
  window.seedCorruptionForTest = (targetLevel = 0.45) => {
    console.log(`%c[T4-004] SEEDING CORRUPTION TO ${(targetLevel * 100).toFixed(0)}%`, 'color: #ffaa00; font-weight: bold;');
    
    if (!testState.aiNodes) {
      console.error('❌ Network not available. Run validateHarmonyHealingPrerequisites() first.');
      return null;
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      nodesCorrupted: 0,
      linksSeed: 0,
      targetLevel: targetLevel
    };
    
    // Seed nodes with corruption (don't cascade yet)
    for (const node of testState.aiNodes.nodes) {
      if (!node.userData) node.userData = {};
      
      // Gradually increase corruption to avoid cascades
      const random = Math.random();
      if (random < 0.6) {
        // 60% of nodes: moderate corruption
        node.userData.corruption = targetLevel + (Math.random() * 0.1 - 0.05);
        report.nodesCorrupted++;
      } else if (random < 0.85) {
        // 25% of nodes: light corruption
        node.userData.corruption = targetLevel * 0.6 + (Math.random() * 0.1);
        report.nodesCorrupted++;
      }
      // else: 15% of nodes remain clean
      
      node.userData.corruption = Math.max(0, Math.min(1, node.userData.corruption || 0));
    }
    
    // Seed links with moderate corruption
    const allLinks = testState.linkingSystem?.getAllLinks?.() || [];
    for (const link of allLinks) {
      if (Math.random() < 0.5) {
        if (!link.userData) link.userData = {};
        link.userData.corruptionLevel = targetLevel * 0.7 + (Math.random() * 0.15);
        report.linksSeed++;
      }
    }
    
    console.log(`✅ Corruption seeded: ${report.nodesCorrupted} nodes, ${report.linksSeed} links`);
    
    return report;
  };

  // ========================================================================
  // HARMONY SOURCE ACTIVATION
  // ========================================================================
  
  window.activateHarmonySource = (nodeIndex = 0) => {
    console.log(`%c[T4-004] ACTIVATING HARMONY SOURCE`, 'color: #00ff00; font-weight: bold;');
    
    if (!testState.aiNodes || testState.aiNodes.nodes.length === 0) {
      console.error('❌ Network not available.');
      return null;
    }
    
    const nodes = testState.aiNodes.nodes;
    const targetNode = nodes[Math.min(nodeIndex, nodes.length - 1)];
    
    if (!targetNode.userData) targetNode.userData = {};
    
    const report = {
      timestamp: new Date().toISOString(),
      sourceNode: {
        id: targetNode.id,
        category: targetNode.userData.category || 'unknown',
        index: nodes.indexOf(targetNode)
      },
      harmonyLevel: 0.9,
      nodesBefore: nodes.filter(n => (n.userData?.harmonyLevel || 0) > 0).length
    };
    
    // Set harmony on source node
    targetNode.userData.harmonyLevel = 0.9;
    
    if (testState.harmonySystem) {
      // Initialize harmony in system
      const harmonyData = testState.harmonySystem.initializeNodeHarmony?.(targetNode);
      if (harmonyData) {
        harmonyData.level = 0.9;
        harmonyData.isAnchor = true;
      }
    }
    
    testState.harmonySourceNodes.push(targetNode.id);
    
    console.log(`✅ Harmony source activated on ${report.sourceNode.category} node (index ${report.sourceNode.index})`);
    
    return report;
  };

  // ========================================================================
  // MAIN TEST EXECUTION
  // ========================================================================
  
  window.runHarmonyHealingTest = (durationSeconds = 20) => {
    console.log(`%c[T4-004] STARTING HARMONY HEALING TEST (${durationSeconds}s)`, 'color: #00ffff; font-weight: bold; font-size: 12px;');
    
    if (!testState.harmonySystem || !testState.corruptionSystem) {
      console.error('❌ Prerequisites not validated. Run validateHarmonyHealingPrerequisites() first.');
      return null;
    }
    
    testState.active = true;
    testState.startTime = Date.now();
    testState.duration = durationSeconds * 1000;
    testState.snapshots = [];
    testState.corruptionTimeline = [];
    testState.harmonyTimeline = [];
    testState.oasisEvents = [];
    testState.stressEvents = [];
    testState.stressAppliedAt = null;
    
    // Hook into game loop
    const originalUpdate = atomaGame.update?.bind(atomaGame);
    const frameInterval = setInterval(() => {
      const elapsed = Date.now() - testState.startTime;
      
      if (elapsed >= testState.duration || !testState.active) {
        clearInterval(frameInterval);
        testState.active = false;
        window.finalizeHarmonyTest();
        return;
      }
      
      // Collect frame snapshot
      captureSnapshot(elapsed);
      
      // Apply stress at 50% mark
      if (elapsed > testState.duration * 0.5 && !testState.stressAppliedAt) {
        applyStressConditions();
        testState.stressAppliedAt = elapsed;
      }
    }, 100); // Capture every 100ms (~6 FPS for analysis)
    
    console.log('ℹ️  Test running. Collecting data every 100ms...');
  };

  // ========================================================================
  // DATA COLLECTION
  // ========================================================================
  
  function captureSnapshot(elapsed) {
    const snapshot = {
      elapsed: elapsed,
      nodes: [],
      links: [],
      oasisCount: 0,
      avgCorruption: 0,
      avgHarmony: 0
    };
    
    let totalCorruption = 0;
    let totalHarmony = 0;
    
    // Collect node metrics
    for (const node of testState.aiNodes.nodes) {
      const corruption = (node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0);
      const harmonyLevel = node.userData?.harmonyLevel || 0;
      const category = node.userData?.category || 'unknown';
      const stability = node.userData?.metrics?.stability || 0;
      
      totalCorruption += corruption;
      totalHarmony += harmonyLevel;
      
      snapshot.nodes.push({
        id: node.id,
        category: category,
        corruption: corruption,
        harmony: harmonyLevel,
        stability: stability
      });
    }
    
    // Collect link metrics
    const allLinks = testState.linkingSystem?.getAllLinks?.() || [];
    for (const link of allLinks) {
      const linkCorruption = link.userData?.corruptionLevel || 0;
      const linkHarmony = link.userData?.harmonyLevel || 0;
      
      snapshot.links.push({
        linkId: link.id,
        corruption: linkCorruption,
        harmony: linkHarmony
      });
    }
    
    // Calculate averages
    snapshot.avgCorruption = testState.aiNodes.nodes.length > 0 
      ? totalCorruption / testState.aiNodes.nodes.length 
      : 0;
    snapshot.avgHarmony = testState.aiNodes.nodes.length > 0 
      ? totalHarmony / testState.aiNodes.nodes.length 
      : 0;
    
    // Detect oasis zones (3+ nodes with harmony > 0.6)
    const harmonyNodes = snapshot.nodes.filter(n => n.harmony > 0.6);
    snapshot.oasisCount = harmonyNodes.length >= 3 ? Math.floor(harmonyNodes.length / 3) : 0;
    
    testState.snapshots.push(snapshot);
    testState.corruptionTimeline.push({
      time: elapsed,
      value: snapshot.avgCorruption
    });
    testState.harmonyTimeline.push({
      time: elapsed,
      value: snapshot.avgHarmony
    });
    
    if (snapshot.oasisCount > 0) {
      testState.oasisEvents.push({
        time: elapsed,
        oasisCount: snapshot.oasisCount,
        nodeCount: harmonyNodes.length
      });
    }
  }
  
  function applyStressConditions() {
    console.log('%c[T4-004] APPLYING STRESS CONDITIONS (increased load/instability)', 'color: #ff6600; font-weight: bold;');
    
    // Increase corruption in random nodes to simulate load pressure
    for (const node of testState.aiNodes.nodes) {
      if (Math.random() < 0.4) {
        if (!node.userData) node.userData = {};
        node.userData.corruption = Math.min(1, (node.userData.corruption || 0) + 0.15);
      }
    }
    
    testState.stressEvents.push({
      time: Date.now() - testState.startTime,
      action: 'stress_applied',
      description: 'Increased corruption across random nodes'
    });
  }

  // ========================================================================
  // FINALIZATION & REPORTING
  // ========================================================================
  
  window.finalizeHarmonyTest = () => {
    console.log('%c[T4-004] TEST COMPLETE - Generating Report', 'color: #00ffff; font-weight: bold; font-size: 12px;');
    testState.active = false;
  };
  
  window.getHarmonyTestReport = () => {
    if (testState.snapshots.length === 0) {
      console.log('❌ No test data collected. Run runHarmonyHealingTest() first.');
      return null;
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: testState.duration / 1000,
      framesCollected: testState.snapshots.length,
      
      // Harmony spread metrics
      harmonySpread: {
        initial: testState.harmonyTimeline[0]?.value || 0,
        peak: Math.max(...testState.harmonyTimeline.map(h => h.value)),
        final: testState.harmonyTimeline[testState.harmonyTimeline.length - 1]?.value || 0,
        spreadRate: 'TBD'
      },
      
      // Corruption reduction
      corruptionReduction: {
        initial: testState.corruptionTimeline[0]?.value || 0,
        minimum: Math.min(...testState.corruptionTimeline.map(c => c.value)),
        final: testState.corruptionTimeline[testState.corruptionTimeline.length - 1]?.value || 0,
        totalReduction: 0
      },
      
      // Oasis formation
      oasisFormation: {
        oasisEventsObserved: testState.oasisEvents.length,
        peakOasisCount: Math.max(...testState.oasisEvents.map(e => e.oasisCount), 0),
        nodesClustered: testState.oasisEvents.length > 0 
          ? Math.max(...testState.oasisEvents.map(e => e.nodeCount)) 
          : 0
      },
      
      // Stress response
      stressResponse: {
        stressAppliedAt: testState.stressAppliedAt ? `${testState.stressAppliedAt}ms` : 'N/A',
        corruptionBeforeStress: 0,
        corruptionAfterStress: 0,
        harmonyBeforeStress: 0,
        harmonyAfterStress: 0
      },
      
      // Anomalies
      anomalies: [],
      
      // Raw data
      harmonyTimeline: testState.harmonyTimeline,
      corruptionTimeline: testState.corruptionTimeline,
      oasisEvents: testState.oasisEvents
    };
    
    // Calculate corruption reduction
    report.corruptionReduction.totalReduction = 
      report.corruptionReduction.initial - report.corruptionReduction.final;
    
    // Find stress boundary
    if (testState.stressAppliedAt) {
      const stressIdx = Math.floor(testState.snapshots.length * 0.5);
      if (stressIdx > 0 && stressIdx < testState.snapshots.length) {
        report.stressResponse.corruptionBeforeStress = testState.corruptionTimeline[stressIdx - 1]?.value || 0;
        report.stressResponse.corruptionAfterStress = testState.corruptionTimeline[stressIdx]?.value || 0;
        report.stressResponse.harmonyBeforeStress = testState.harmonyTimeline[stressIdx - 1]?.value || 0;
        report.stressResponse.harmonyAfterStress = testState.harmonyTimeline[stressIdx]?.value || 0;
      }
    }
    
    // Calculate spread rate
    if (testState.harmonyTimeline.length > 1) {
      const startHarmony = testState.harmonyTimeline[0]?.value || 0;
      const endHarmony = testState.harmonyTimeline[testState.harmonyTimeline.length - 1]?.value || 0;
      const timespan = (testState.duration / 1000);
      report.harmonySpread.spreadRate = ((endHarmony - startHarmony) / timespan).toFixed(3) + ' units/sec';
    }
    
    // Detect anomalies
    if (report.corruptionReduction.totalReduction === 0) {
      report.anomalies.push('⚠️  No corruption reduction observed - harmony may not be spreading');
    }
    if (report.oasisFormation.oasisEventsObserved === 0) {
      report.anomalies.push('⚠️  No oasis zones formed - clustering may not be working');
    }
    if (report.stressResponse.corruptionAfterStress < report.stressResponse.corruptionBeforeStress) {
      report.anomalies.push('✅ Harmony resisted stress increase - good resilience');
    } else if (report.stressResponse.corruptionAfterStress > report.stressResponse.corruptionBeforeStress * 1.5) {
      report.anomalies.push('⚠️  Corruption spiked significantly after stress - system may be fragile');
    }
    
    return report;
  };

  // ========================================================================
  // FORMATTED OUTPUT
  // ========================================================================
  
  window.printHarmonyTestReport = () => {
    const report = window.getHarmonyTestReport();
    if (!report) return;
    
    console.log('%c╔══════════════════════════════════════════════════════════════════╗', 'color: #00ffff;');
    console.log('%c║          T4-004 HARMONY HEALING TEST REPORT                      ║', 'color: #00ffff; font-weight: bold;');
    console.log('%c╚══════════════════════════════════════════════════════════════════╝', 'color: #00ffff;');
    
    console.log('\n📊 HARMONY SPREAD METRICS:');
    console.table(report.harmonySpread);
    
    console.log('\n📉 CORRUPTION REDUCTION:');
    console.table(report.corruptionReduction);
    
    console.log('\n🌿 OASIS FORMATION:');
    console.table(report.oasisFormation);
    
    console.log('\n⚡ STRESS RESPONSE:');
    console.table(report.stressResponse);
    
    if (report.anomalies.length > 0) {
      console.log('\n⚠️  ANOMALIES DETECTED:');
      report.anomalies.forEach(a => console.log('  ' + a));
    } else {
      console.log('\n✅ NO ANOMALIES - Test behavior within normal parameters');
    }
    
    console.log('\n📈 Charts:');
    console.log('  Harmony Timeline:', report.harmonyTimeline.slice(0, 5), '...', report.harmonyTimeline.slice(-5));
    console.log('  Corruption Timeline:', report.corruptionTimeline.slice(0, 5), '...', report.corruptionTimeline.slice(-5));
  };

  console.log('%c[T4-004] Harmony Healing Test Runner loaded', 'color: #00ffff; font-weight: bold;');
  console.log('Available commands:');
  console.log('  window.validateHarmonyHealingPrerequisites()');
  console.log('  window.seedCorruptionForTest(0.45)');
  console.log('  window.activateHarmonySource(0)');
  console.log('  window.runHarmonyHealingTest(20)');
  console.log('  window.getHarmonyTestReport()');
  console.log('  window.printHarmonyTestReport()');
}
