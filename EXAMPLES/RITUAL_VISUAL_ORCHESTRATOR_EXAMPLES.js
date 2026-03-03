/**
 * RITUAL VISUAL ORCHESTRATOR — INTEGRATION EXAMPLES
 * 
 * Real-world usage patterns for the Ritual Visual Orchestration Layer.
 * Copy and adapt these examples for your project.
 */

// =============================================================================
// EXAMPLE 1: BASIC RITUAL ORCHESTRATION
// =============================================================================

/**
 * Simple cooperative ritual with visual orchestration.
 * 
 * Shows the minimal integration needed:
 * - Start orchestration when ritual begins
 * - Update each frame
 * - End when ritual completes
 */
async function example1_BasicRitualOrchestration() {
  console.log('\n=== EXAMPLE 1: Basic Ritual Orchestration ===\n');

  // Import orchestrator
  import { RitualVisualOrchestrator } from './RitualVisualOrchestrator.js';
  import { NetworkRituals } from './NetworkRituals_v1.js';

  // Create instances
  const orchestrator = new RitualVisualOrchestrator(autoWiringSystem);
  const networkRituals = new NetworkRituals(corruptionSystem, gameplaySystem);

  // User initiates a cooperative ritual
  const ritual = networkRituals.initiateRitual(
    playerNode,          // Epicenter
    [participantNode1, participantNode2, participantNode3]  // Participants
  );

  if (!ritual.success) {
    console.log('Ritual failed:', ritual.reason);
    return;
  }

  // START: Notify orchestrator
  const startResult = orchestrator.startRitual(
    ritual.id,
    {
      type: 'cooperative_reconstruction',
      stage: 'channeling',
      progress: 0,
      duration: ritual.totalDuration,  // e.g., 24000 ms
    },
    [playerNode, participantNode1, participantNode2, participantNode3],
    [linkBetween(playerNode, participantNode1), ...]
  );

  if (!startResult.success) {
    console.warn('Visual orchestration failed:', startResult.reason);
    return;
  }

  console.log(`✓ Ritual ${ritual.id} started with visual orchestration`);
  console.log(`  Modifiers applied: ${startResult.modifiersApplied}`);

  // UPDATE: Each frame in animation loop
  async function updateFrame(deltaTime) {
    ritual.progress += deltaTime;
    ritual.stage = computeRitualStage(ritual.progress, ritual.totalDuration);

    // Update visual orchestration
    orchestrator.updateRitual(ritual.id, {
      stage: ritual.stage,
      progress: ritual.progress,
      duration: ritual.totalDuration,
    });

    // Check if complete
    if (ritual.progress >= ritual.totalDuration) {
      const outcome = ritual.stage === 'failed' ? 'failed' : 'complete';

      // END: Cleanup visual orchestration
      orchestrator.endRitual(ritual.id, outcome);
      console.log(`✓ Ritual ${ritual.id} ended (${outcome})`);

      // Cleanup
      networkRituals.completeRitual(ritual.id);
    }
  }

  // Simulate animation frames
  for (let i = 0; i < 60; i++) {
    await updateFrame(400);  // ~6.67 FPS for demo
  }
}

// =============================================================================
// EXAMPLE 2: ANIMATION LOOP INTEGRATION
// =============================================================================

/**
 * How to integrate orchestrator into your main animation loop.
 * This is the production pattern.
 */
function example2_AnimationLoopIntegration() {
  console.log('\n=== EXAMPLE 2: Animation Loop Integration ===\n');

  import { RitualVisualOrchestrator } from './RitualVisualOrchestrator.js';

  // Setup
  const orchestrator = new RitualVisualOrchestrator(autoWiringSystem);
  const clock = new THREE.Clock();

  // Animation loop
  function animationLoop() {
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // ========================================
    // UPDATE RITUAL VISUAL ORCHESTRATION
    // ========================================
    for (const ritual of networkRituals.getActiveRituals()) {
      // Update ritual progress
      ritual.progress += deltaTime * 1000;  // Convert to milliseconds

      // Update visual orchestration
      orchestrator.updateRitual(ritual.id, {
        stage: ritual.stage,
        progress: ritual.progress,
        duration: ritual.totalDuration,
      });

      // Check if ritual should end
      if (ritual.progress >= ritual.totalDuration) {
        // Determine outcome (success or failure based on game logic)
        const outcome = ritual.resourcesSuccessful ? 'complete' : 'failed';

        // Notify orchestrator
        orchestrator.endRitual(ritual.id, outcome);

        // Clean up ritual
        networkRituals.completeRitual(ritual.id);

        console.log(`✓ Ritual ${ritual.id} ended: ${outcome}`);
      }
    }

    // ========================================
    // EXISTING RENDER CODE
    // ========================================
    renderer.render(scene, camera);
    requestAnimationFrame(animationLoop);
  }

  requestAnimationFrame(animationLoop);
}

// =============================================================================
// EXAMPLE 3: DIFFERENT RITUAL TYPES
// =============================================================================

/**
 * Different ritual types produce different visual effects.
 * Orchestrator automatically configures modifiers based on type.
 */
async function example3_DifferentRitualTypes() {
  console.log('\n=== EXAMPLE 3: Different Ritual Types ===\n');

  import { RitualVisualOrchestrator } from './RitualVisualOrchestrator.js';

  const orchestrator = new RitualVisualOrchestrator(autoWiringSystem);

  // TYPE 1: Cooperative Reconstruction (bright, energetic)
  orchestrator.startRitual('ritual-coop', {
    type: 'cooperative_reconstruction',  // 1.3× intensity
    stage: 'active',
    progress: 0,
    duration: 24000,
  }, nodes, links);
  console.log('✓ Cooperative Reconstruction: Bright collaboration');

  await delay(2000);

  orchestrator.endRitual('ritual-coop', 'complete');

  // TYPE 2: Healing Cascade (calm, restorative)
  orchestrator.startRitual('ritual-heal', {
    type: 'healing_cascade',            // Calm harmony, dampen stress
    stage: 'active',
    progress: 0,
    duration: 24000,
  }, nodes, links);
  console.log('✓ Healing Cascade: Calming restoration');

  await delay(2000);

  orchestrator.endRitual('ritual-heal', 'complete');

  // TYPE 3: Network Synchronization (coherent, harmonic)
  orchestrator.startRitual('ritual-sync', {
    type: 'network_synchronization',    // Quarter-phase offset
    stage: 'active',
    progress: 0,
    duration: 24000,
  }, nodes, links);
  console.log('✓ Network Synchronization: Coordinated harmony');

  await delay(2000);

  orchestrator.endRitual('ritual-sync', 'complete');

  // TYPE 4: Corruption Containment (controlled, tense)
  orchestrator.startRitual('ritual-contain', {
    type: 'corruption_containment',     // Moderate damping
    stage: 'active',
    progress: 0,
    duration: 24000,
  }, nodes, links);
  console.log('✓ Corruption Containment: Controlled focus');

  await delay(2000);

  orchestrator.endRitual('ritual-contain', 'complete');
}

// =============================================================================
// EXAMPLE 4: CONCURRENT RITUALS
// =============================================================================

/**
 * Multiple rituals can be active simultaneously.
 * Each maintains independent modifiers.
 */
async function example4_ConcurrentRituals() {
  console.log('\n=== EXAMPLE 4: Concurrent Rituals ===\n');

  import { RitualVisualOrchestrator } from './RitualVisualOrchestrator.js';

  const orchestrator = new RitualVisualOrchestrator(autoWiringSystem);

  // Start 3 concurrent rituals
  const ritual1 = { id: 'ritual-A', type: 'cooperative_reconstruction' };
  const ritual2 = { id: 'ritual-B', type: 'healing_cascade' };
  const ritual3 = { id: 'ritual-C', type: 'corruption_containment' };

  const nodeGroup1 = [nodeA, nodeB, nodeC];
  const nodeGroup2 = [nodeD, nodeE, nodeF];
  const nodeGroup3 = [nodeG, nodeH, nodeI];

  // Start all three
  orchestrator.startRitual(ritual1.id, { ...ritual1, stage: 'active', progress: 0, duration: 24000 }, nodeGroup1, []);
  orchestrator.startRitual(ritual2.id, { ...ritual2, stage: 'active', progress: 0, duration: 24000 }, nodeGroup2, []);
  orchestrator.startRitual(ritual3.id, { ...ritual3, stage: 'active', progress: 0, duration: 24000 }, nodeGroup3, []);

  console.log('✓ Started 3 concurrent rituals');

  // Check status
  let status = orchestrator.getStatus();
  console.log(`  Active rituals: ${status.activeRituals}`);
  console.log(`  Total modifiers: ${status.totalModifiers}`);

  // Update all
  for (let progress = 0; progress <= 24000; progress += 2000) {
    orchestrator.updateRitual(ritual1.id, { stage: 'active', progress, duration: 24000 });
    orchestrator.updateRitual(ritual2.id, { stage: 'active', progress, duration: 24000 });
    orchestrator.updateRitual(ritual3.id, { stage: 'active', progress, duration: 24000 });

    console.log(`✓ Progress: ${progress}ms`);
  }

  // End all
  orchestrator.endRitual(ritual1.id, 'complete');
  orchestrator.endRitual(ritual2.id, 'complete');
  orchestrator.endRitual(ritual3.id, 'complete');

  status = orchestrator.getStatus();
  console.log(`✓ All rituals ended. Active: ${status.activeRituals}`);
}

// =============================================================================
// EXAMPLE 5: ERROR HANDLING & SAFETY
// =============================================================================

/**
 * Show proper error handling and safety checks.
 */
async function example5_ErrorHandlingAndSafety() {
  console.log('\n=== EXAMPLE 5: Error Handling & Safety ===\n');

  import { RitualVisualOrchestrator } from './RitualVisualOrchestrator.js';

  const orchestrator = new RitualVisualOrchestrator(autoWiringSystem);

  // CASE 1: Invalid ritual data
  console.log('Test 1: Invalid ritual data');
  const result1 = orchestrator.startRitual(
    'invalid',
    null,  // Missing ritual data
    [],
    []
  );
  console.log(`  Result: ${result1.success ? '✓' : '✗'} ${result1.reason || 'OK'}`);

  // CASE 2: Missing nodes
  console.log('Test 2: No affected nodes');
  const result2 = orchestrator.startRitual(
    'empty-ritual',
    { type: 'test', stage: 'active', progress: 0, duration: 24000 },
    [],  // Empty node list
    []
  );
  console.log(`  Result: ${result2.success ? '✓' : '✗'} (${result2.modifiersApplied} modifiers)`);

  // CASE 3: Ending non-existent ritual
  console.log('Test 3: End non-existent ritual');
  orchestrator.endRitual('non-existent');  // Should not crash
  console.log('  ✓ No crash');

  // CASE 4: Updating inactive ritual
  console.log('Test 4: Update inactive ritual');
  orchestrator.updateRitual('inactive', { stage: 'active', progress: 0, duration: 24000 });  // Should not crash
  console.log('  ✓ No crash');

  // CASE 5: Multiple end calls
  console.log('Test 5: Multiple end calls');
  orchestrator.startRitual('multi-end', { type: 'test', stage: 'active', progress: 0, duration: 24000 }, [testNode], []);
  orchestrator.endRitual('multi-end', 'complete');
  orchestrator.endRitual('multi-end', 'complete');  // Should not crash
  console.log('  ✓ No crash');

  console.log('\n✓ All safety tests passed');
}

// =============================================================================
// EXAMPLE 6: PERFORMANCE MONITORING
// =============================================================================

/**
 * How to monitor performance of the orchestration system.
 */
async function example6_PerformanceMonitoring() {
  console.log('\n=== EXAMPLE 6: Performance Monitoring ===\n');

  import { RitualVisualOrchestrator } from './RitualVisualOrchestrator.js';

  const orchestrator = new RitualVisualOrchestrator(autoWiringSystem);

  // Create many test entities
  const nodeCount = 100;
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    name: `perf-node-${i}`,
    userData: { type: 'NODE' },
  }));

  const ritual = {
    id: 'perf-test',
    type: 'cooperative_reconstruction',
    stage: 'active',
    progress: 0,
    duration: 24000,
  };

  // Measure startRitual
  console.log(`Test with ${nodeCount} nodes...`);
  const startTime = performance.now();
  orchestrator.startRitual(ritual.id, ritual, nodes, []);
  const startDuration = performance.now() - startTime;
  console.log(`  startRitual: ${startDuration.toFixed(3)}ms`);

  // Measure updateRitual (average over multiple calls)
  const updateTimes = [];
  for (let i = 0; i < 60; i++) {
    const updateStart = performance.now();
    orchestrator.updateRitual(ritual.id, {
      stage: ritual.stage,
      progress: (i / 60) * 24000,
      duration: 24000,
    });
    const updateDuration = performance.now() - updateStart;
    updateTimes.push(updateDuration);
  }

  const avgUpdate = updateTimes.reduce((a, b) => a + b) / updateTimes.length;
  const maxUpdate = Math.max(...updateTimes);
  const minUpdate = Math.min(...updateTimes);

  console.log(`  updateRitual (60 calls):`);
  console.log(`    Average: ${avgUpdate.toFixed(3)}ms`);
  console.log(`    Min: ${minUpdate.toFixed(3)}ms`);
  console.log(`    Max: ${maxUpdate.toFixed(3)}ms`);

  // Measure endRitual
  const endStart = performance.now();
  orchestrator.endRitual(ritual.id, 'complete');
  const endDuration = performance.now() - endStart;
  console.log(`  endRitual: ${endDuration.toFixed(3)}ms`);

  // Check status
  const status = orchestrator.getStatus();
  console.log(`\nStatus:`);
  console.log(`  Active rituals: ${status.activeRituals}`);
  console.log(`  Total modifiers: ${status.totalModifiers}`);
  console.log(`  Affected renderables: ${status.affectedRenderables}`);

  // Performance verdict
  const totalTime = startDuration + avgUpdate * 60 + endDuration;
  const isOptimal = avgUpdate < 0.5 && maxUpdate < 1.0;
  console.log(`\n${isOptimal ? '✅' : '⚠️'} Performance: ${totalTime.toFixed(3)}ms total`);
}

// =============================================================================
// EXAMPLE 7: DEBUGGING & INSPECTION
// =============================================================================

/**
 * How to debug and inspect orchestrator state.
 */
async function example7_DebuggingAndInspection() {
  console.log('\n=== EXAMPLE 7: Debugging & Inspection ===\n');

  import { RitualVisualOrchestrator } from './RitualVisualOrchestrator.js';

  const orchestrator = new RitualVisualOrchestrator(autoWiringSystem);

  // Start a ritual
  orchestrator.startRitual(
    'debug-ritual',
    { type: 'cooperative_reconstruction', stage: 'active', progress: 0, duration: 24000 },
    [node1, node2, node3],
    [link1, link2]
  );

  // Get basic status
  console.log('Basic Status:');
  const status = orchestrator.getStatus();
  console.log(status);
  // Output: { activeRituals: 1, totalModifiers: 5, affectedRenderables: 5, stats: {...} }

  // Get detailed debug info
  console.log('\nDetailed Debug Info:');
  const debug = orchestrator.getDebugInfo();
  console.log(JSON.stringify(debug, null, 2));
  // Shows each active ritual with modifier details

  // Update and inspect
  orchestrator.updateRitual('debug-ritual', {
    stage: 'active',
    progress: 12000,
    duration: 24000,
  });

  console.log('\nAfter Update:');
  console.log(orchestrator.getStatus());

  // End and verify cleanup
  orchestrator.endRitual('debug-ritual', 'complete');

  console.log('\nAfter End:');
  const finalStatus = orchestrator.getStatus();
  console.log(`Active rituals: ${finalStatus.activeRituals} (should be 0)`);
  console.log(`Total modifiers: ${finalStatus.totalModifiers} (should be 0)`);

  console.log(`\n${finalStatus.activeRituals === 0 ? '✓' : '✗'} Cleanup verified`);
}

// =============================================================================
// EXAMPLE 8: INTEGRATION WITH NETWORKING
// =============================================================================

/**
 * How to integrate with multiplayer/networking.
 * Orchestrate visual effects for distant rituals.
 */
async function example8_NetworkingIntegration() {
  console.log('\n=== EXAMPLE 8: Networking Integration ===\n');

  import { RitualVisualOrchestrator } from './RitualVisualOrchestrator.js';

  const orchestrator = new RitualVisualOrchestrator(autoWiringSystem);

  // When receiving ritual update from network
  function onRitualUpdateReceived(networkMessage) {
    const { ritualId, type, stage, progress, duration, nodeIds, linkIds } = networkMessage;

    // Resolve node/link IDs to local objects
    const nodes = nodeIds.map(id => sceneNodeMap.get(id));
    const links = linkIds.map(id => sceneLinkMap.get(id));

    // Check if ritual is new
    const currentRituals = orchestrator.getStatus().activeRituals;
    const isNewRitual = !orchestrator.getDebugInfo().activeRituals
      .map(r => r.ritualId)
      .includes(ritualId);

    if (isNewRitual) {
      // Start orchestration for remote ritual
      orchestrator.startRitual(
        ritualId,
        { type, stage, progress, duration },
        nodes,
        links
      );
      console.log(`✓ Started remote ritual ${ritualId}`);
    } else {
      // Update existing remote ritual
      orchestrator.updateRitual(
        ritualId,
        { stage, progress, duration }
      );
    }
  }

  // When ritual completes remotely
  function onRitualCompleted(networkMessage) {
    const { ritualId, outcome } = networkMessage;

    // End visual orchestration
    orchestrator.endRitual(ritualId, outcome);
    console.log(`✓ Ended remote ritual ${ritualId} (${outcome})`);
  }

  // Register listeners
  networkBus.on('ritual:update', onRitualUpdateReceived);
  networkBus.on('ritual:complete', onRitualCompleted);

  console.log('✓ Networking listeners registered');
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function computeRitualStage(progress, duration) {
  const ratio = progress / duration;
  if (ratio < 0.333) return 'channeling';
  if (ratio < 0.833) return 'resonance';
  if (ratio < 1.0) return 'resolution';
  return ratio < 1.2 ? 'complete' : 'ended';
}

function linkBetween(node1, node2) {
  return {
    name: `link-${node1.name}-${node2.name}`,
    userData: { type: 'LINK' },
  };
}

// =============================================================================
// RUN ALL EXAMPLES
// =============================================================================

async function runAllExamples() {
  console.log('╔' + '═'.repeat(50) + '╗');
  console.log('║' + ' '.repeat(10) + 'RITUAL VISUAL ORCHESTRATOR EXAMPLES' + ' '.repeat(6) + '║');
  console.log('╚' + '═'.repeat(50) + '╝');

  await example1_BasicRitualOrchestration();
  await example3_DifferentRitualTypes();
  await example4_ConcurrentRituals();
  await example5_ErrorHandlingAndSafety();
  await example6_PerformanceMonitoring();
  await example7_DebuggingAndInspection();

  console.log('\n' + '═'.repeat(50));
  console.log('✅ ALL EXAMPLES COMPLETED');
  console.log('═'.repeat(50));
}

// Export for use
export {
  example1_BasicRitualOrchestration,
  example2_AnimationLoopIntegration,
  example3_DifferentRitualTypes,
  example4_ConcurrentRituals,
  example5_ErrorHandlingAndSafety,
  example6_PerformanceMonitoring,
  example7_DebuggingAndInspection,
  example8_NetworkingIntegration,
  runAllExamples,
};
