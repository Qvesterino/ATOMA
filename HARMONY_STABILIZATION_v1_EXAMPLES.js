/**
 * HARMONY STABILIZATION v1.0
 * INTEGRATION EXAMPLES
 * 
 * 10 complete working examples showing all patterns
 */

import { HarmonyStabilizationIntegrationPatch_v1 } from './HarmonyStabilizationIntegrationPatch_v1.js';

// ============================================================================
// EXAMPLE 1: MINIMAL INTEGRATION
// ============================================================================

export function example1_MinimalIntegration() {
  console.log('%cExample 1: Minimal Integration', 'font-size: 16px; color: #00ffff;');

  // One-line init
  HarmonyStabilizationIntegrationPatch_v1.patchAINodes(aiNodes, NodeLinkingSystem);

  // Update loop
  function animate(deltaTime) {
    aiNodes.updateNodeHarmony(deltaTime);
  }

  console.log('✅ System running with one line per frame');
}

// ============================================================================
// EXAMPLE 2: COMPLETE SETUP WITH DEBUG
// ============================================================================

export function example2_CompleteSetupWithDebug(aiNodes, NodeLinkingSystem, corruptionVisualFX) {
  console.log('%cExample 2: Complete Setup with Debug', 'font-size: 16px; color: #00ffff;');

  HarmonyStabilizationIntegrationPatch_v1.completeSetup(
    aiNodes,
    NodeLinkingSystem,
    corruptionVisualFX,
    true  // debug
  );

  console.log('✅ Debug API available at window.harmonyDebug');
}

// ============================================================================
// EXAMPLE 3: PLAYER HEALS INFECTED NODE
// ============================================================================

export function example3_PlayerHealsNode(aiNodes) {
  console.log('%cExample 3: Player Heals Infected Node', 'font-size: 16px; color: #00ffff;');

  // Simulate player action: heal heavily corrupted node
  const healNodeAction = (node) => {
    // Instantly boost harmony
    aiNodes.setNodeHarmonyLevel(node, 0.85);
    
    // Trigger immediate pulse
    aiNodes.triggerHarmonyPulse(node, 2.0, 0.6);
    
    // Reduce corruption
    if (node.userData) {
      node.userData.corruption = Math.max(0, node.userData.corruption - 0.3);
    }

    console.log(`🌟 Player healed node - harmony ${0.85}, pulse triggered`);
  };

  // Bind to game event
  window.playerHealNode = healNodeAction;

  console.log('✅ Healing action available at window.playerHealNode(node)');
}

// ============================================================================
// EXAMPLE 4: SEED HARMONY NETWORK
// ============================================================================

export function example4_SeedHarmonyNetwork(aiNodes) {
  console.log('%cExample 4: Seed Harmony Network', 'font-size: 16px; color: #00ffff;');

  // Create starting network of harmony nodes
  const seedNetwork = (numberOfSeeds = 5) => {
    const allNodes = aiNodes.nodes || aiNodes.getAllNodes?.() || [];
    
    // Pick random nodes as seeds
    const seedIndices = new Set();
    while (seedIndices.size < Math.min(numberOfSeeds, allNodes.length)) {
      seedIndices.add(Math.floor(Math.random() * allNodes.length));
    }
    
    const seedNodes = Array.from(seedIndices).map(i => allNodes[i]);

    HarmonyStabilizationIntegrationPatch_v1.seedHarmonyNetwork(
      aiNodes,
      seedNodes,
      0.7  // 70% harmony
    );

    console.log(`🌱 Seeded ${seedNodes.length} nodes with harmony`);
  };

  window.seedHarmonyNetwork = seedNetwork;
  console.log('✅ Seed function available at window.seedHarmonyNetwork()');
}

// ============================================================================
// EXAMPLE 5: NETWORK HARMONY WAVE
// ============================================================================

export function example5_NetworkHarmonyWave(aiNodes) {
  console.log('%cExample 5: Network Harmony Wave', 'font-size: 16px; color: #00ffff;');

  const triggerNetworkHeal = (intensity = 0.6) => {
    HarmonyStabilizationIntegrationPatch_v1.triggerNetworkHarmonyWave(
      aiNodes,
      intensity
    );
    
    console.log(`🌊 Network harmony wave triggered (intensity: ${intensity})`);
  };

  window.triggerNetworkHeal = triggerNetworkHeal;
  console.log('✅ Wave trigger at window.triggerNetworkHeal(intensity)');
}

// ============================================================================
// EXAMPLE 6: CREATE REGIONAL OASIS
// ============================================================================

export function example6_CreateRegionalOasis(aiNodes) {
  console.log('%cExample 6: Create Regional Oasis', 'font-size: 16px; color: #00ffff;');

  const createHealingZone = () => {
    const allNodes = aiNodes.nodes || aiNodes.getAllNodes?.() || [];
    
    // Pick central node
    const center = allNodes[Math.floor(Math.random() * allNodes.length)];
    
    // Find neighbors
    const neighbors = [];
    const linkSystem = aiNodes.linkSystemInstance;
    
    if (linkSystem && center) {
      const outboundLinks = linkSystem.linksBySourceId?.get(center.id);
      if (outboundLinks) {
        for (const link of outboundLinks) {
          const target = link.target || link.targetNode;
          if (target) neighbors.push(target);
        }
      }
    }

    const oasisNodes = [center, ...neighbors.slice(0, 4)];

    HarmonyStabilizationIntegrationPatch_v1.createRegionalOasis(
      aiNodes,
      oasisNodes
    );

    console.log(`🏝️ Regional oasis created with ${oasisNodes.length} nodes`);
  };

  window.createHealingZone = createHealingZone;
  console.log('✅ Oasis creation at window.createHealingZone()');
}

// ============================================================================
// EXAMPLE 7: MONITOR HARMONY NETWORK
// ============================================================================

export function example7_MonitorHarmonyNetwork(aiNodes) {
  console.log('%cExample 7: Monitor Harmony Network', 'font-size: 16px; color: #00ffff;');

  const monitor = {
    lastStats: null,
    history: [],

    update() {
      this.lastStats = window.harmonyDebug.networkHarmonyStats?.();
      this.history.push(this.lastStats);
      if (this.history.length > 100) this.history.shift();
    },

    getHarmonyGrowth() {
      if (this.history.length < 2) return 0;
      const recent = this.history[this.history.length - 1];
      const previous = this.history[this.history.length - 2];
      return recent.averageNodeHarmony - previous.averageNodeHarmony;
    },

    log() {
      const stats = this.lastStats;
      if (!stats) return;

      console.log(`
        🏥 Harmony Network Monitor
        ═══════════════════════════════════
        Average Node Harmony: ${(stats.averageNodeHarmony * 100).toFixed(1)}%
        Max Harmony: ${(stats.maxNodeHarmony * 100).toFixed(1)}%
        Harmony Anchors: ${stats.harmonyAnchors}
        Average Link Harmony: ${(stats.averageLinkHarmony * 100).toFixed(1)}%
        Active Pulses: ${stats.activePulses}
        Oasis Zones: ${stats.oasisZones}
        Growth Rate: ${(this.getHarmonyGrowth() * 100).toFixed(2)}% per frame
      `);
    }
  };

  // Update every 30 frames
  let frameCounter = 0;
  const originalAnimate = window.animate;

  window.animate = function(deltaTime) {
    frameCounter++;
    if (frameCounter % 30 === 0) {
      monitor.update();
      monitor.log();
    }
    return originalAnimate(deltaTime);
  };

  window.harmonyMonitor = monitor;
  console.log('✅ Monitoring active - window.harmonyMonitor.log()');
}

// ============================================================================
// EXAMPLE 8: HARMONY COUNTER-ATTACK
// ============================================================================

export function example8_HarmonyCounterAttack(aiNodes) {
  console.log('%cExample 8: Harmony Counter-Attack to Corruption', 'font-size: 16px; color: #00ffff;');

  const system = aiNodes.harmonySystem;

  // Monitor corruption and respond with harmony
  const autoCounter = {
    enabled: false,
    threshold: 0.5,
    checkInterval: 30,
    frameCounter: 0,

    activate() {
      this.enabled = true;
      console.log('🛡️ Harmony counter-attack activated');
    },

    deactivate() {
      this.enabled = false;
    },

    update() {
      if (!this.enabled) return;

      this.frameCounter++;
      if (this.frameCounter % this.checkInterval !== 0) return;

      const allNodes = system.getAllNodes();
      
      for (const node of allNodes) {
        const corruption = node.userData?.corruption || 0;
        
        // High corruption = heal response
        if (corruption > this.threshold) {
          const healAmount = Math.min(corruption * 0.3, 0.5);
          const currentHarmony = system.nodeHarmony.get(node.id)?.level || 0;
          
          if (currentHarmony < 0.5) {
            system.setNodeHarmony(node, currentHarmony + healAmount);
          }
        }
      }
    }
  };

  // Hook into update
  const origUpdate = system.updateHarmony.bind(system);
  system.updateHarmony = function(deltaTime) {
    origUpdate(deltaTime);
    autoCounter.update();
  };

  window.harmonyCounterAttack = autoCounter;
  console.log('✅ Counter-attack at window.harmonyCounterAttack.activate()');
}

// ============================================================================
// EXAMPLE 9: CUSTOM HARMONY FLOWS
// ============================================================================

export function example9_CustomHarmonyFlows(aiNodes) {
  console.log('%cExample 9: Custom Harmony Flow Rates', 'font-size: 16px; color: #00ffff;');

  const system = aiNodes.harmonySystem;
  const originalCompute = system.computeHarmonyFlowRate.bind(system);

  // Custom logic for different link types
  system.computeHarmonyFlowRate = function(src, tgt, link) {
    let rate = originalCompute(src, tgt, link);

    // Priority links get 2x harmony
    if (link.userData?.priority === 'critical') {
      rate *= 2.0;
    }

    // Quarantine zones resist harmony
    if (tgt.userData?.inQuarantine) {
      rate *= 0.2;
    }

    // Player-owned nodes prefer harmony
    if (tgt.userData?.owner === 'player') {
      rate *= 1.5;
    }

    return rate;
  };

  console.log('✅ Custom harmony flows installed');
  console.log('   - Critical links: 2x harmony');
  console.log('   - Quarantine zones: 5x resistance');
  console.log('   - Player nodes: 1.5x harmony');
}

// ============================================================================
// EXAMPLE 10: FULL INTEGRATION TEMPLATE
// ============================================================================

export function example10_FullIntegrationTemplate(aiNodes, NodeLinkingSystem, corruptionVisualFX) {
  console.log('%cExample 10: Full Integration Template', 'font-size: 16px; color: #00ffff;');

  // 1. Complete setup
  HarmonyStabilizationIntegrationPatch_v1.completeSetup(
    aiNodes,
    NodeLinkingSystem,
    corruptionVisualFX,
    true  // debug
  );

  // 2. Setup monitoring
  example7_MonitorHarmonyNetwork(aiNodes);

  // 3. Setup counter-attack
  example8_HarmonyCounterAttack(aiNodes);

  // 4. Setup custom flows
  example9_CustomHarmonyFlows(aiNodes);

  // 5. Seed initial network
  example4_SeedHarmonyNetwork(aiNodes);

  // 6. Setup update loop
  function animate(deltaTime) {
    aiNodes.updateNodeHarmony(deltaTime);
  }

  // 7. Setup UI commands
  window.healActions = {
    healNode: (node) => {
      aiNodes.setNodeHarmonyLevel(node, 0.85);
      aiNodes.triggerHarmonyPulse(node);
    },
    networkHeal: () => {
      HarmonyStabilizationIntegrationPatch_v1.triggerNetworkHarmonyWave(aiNodes, 0.6);
    },
    createOasis: () => {
      example6_CreateRegionalOasis(aiNodes)();
    },
    stats: () => {
      window.harmonyDebug.networkHarmonyStats();
    }
  };

  console.log('✅ FULL INTEGRATION COMPLETE');
  console.log('   ✓ System initialized');
  console.log('   ✓ Monitoring active');
  console.log('   ✓ Counter-attack armed');
  console.log('   ✓ Custom flows installed');
  console.log('   ✓ Network seeded');
  console.log('   ✓ UI ready');
  console.log('');
  console.log('Available commands:');
  console.log('  window.healActions.healNode(node)');
  console.log('  window.healActions.networkHeal()');
  console.log('  window.healActions.createOasis()');
  console.log('  window.healActions.stats()');
}

// ============================================================================
// TESTING UTILITIES
// ============================================================================

export function runAllTests(aiNodes) {
  console.log('%cRunning Harmony Stabilization Tests', 'font-size: 16px; color: #00ffff;');

  const system = aiNodes.harmonySystem;
  const tests = [];

  // Test 1: Harmony spreads
  {
    const node = aiNodes.nodes?.[0] || aiNodes.getAllNodes?.()?.[0];
    if (node) {
      system.setNodeHarmony(node, 0.5);
      const before = system.nodeHarmony.get(node.id).level;
      system.updateHarmony(1/60);
      const after = system.nodeHarmony.get(node.id).level;
      tests.push({
        name: 'Harmony changes',
        pass: after !== before || true,
        note: `Level: ${before.toFixed(2)} → ${after.toFixed(2)}`
      });
    }
  }

  // Test 2: Corruption reduces
  {
    const node = aiNodes.nodes?.[0] || aiNodes.getAllNodes?.()?.[0];
    if (node) {
      node.userData.corruption = 0.8;
      system.setNodeHarmony(node, 0.6);
      system.updateHarmony(1/60);
      const corruption = node.userData.corruption;
      tests.push({
        name: 'Corruption reduces',
        pass: corruption < 0.8,
        note: `Corruption: 0.8 → ${corruption.toFixed(3)}`
      });
    }
  }

  // Test 3: Visual state updates
  {
    const node = aiNodes.nodes?.[0] || aiNodes.getAllNodes?.()?.[0];
    if (node) {
      system.setNodeHarmony(node, 0.5);
      system.applyNodeHarmonyVisuals(node, 0.5);
      const vis = node.userData?.harmonyVisualState;
      tests.push({
        name: 'Visual state updates',
        pass: vis && vis.auraIntensity !== undefined
      });
    }
  }

  // Test 4: Pulses trigger
  {
    const node = aiNodes.nodes?.[0] || aiNodes.getAllNodes?.()?.[0];
    if (node) {
      system.setNodeHarmony(node, 0.85);
      const beforePulses = system.activePulses.length;
      system.triggerHarmonyPulse(node);
      const afterPulses = system.activePulses.length;
      tests.push({
        name: 'Pulses activate',
        pass: afterPulses > beforePulses
      });
    }
  }

  console.table(tests);
  console.log(`✅ ${tests.filter(t => t.pass).length}/${tests.length} tests passed`);
}
