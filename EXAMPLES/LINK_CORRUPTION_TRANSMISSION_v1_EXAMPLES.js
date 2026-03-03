/**
 * LINK CORRUPTION TRANSMISSION v1.0
 * INTEGRATION EXAMPLES
 * 
 * Complete working examples showing all integration patterns
 * Copy and adapt these examples for your project
 */

// ============================================================================
// EXAMPLE 1: MINIMAL INTEGRATION (Copy-paste ready)
// ============================================================================

export function example1_MinimalIntegration() {
  console.log('%cExample 1: Minimal Integration', 'font-size: 16px; color: #00ff00;');

  // In main.js after AINodes created:
  
  import { LinkCorruptionTransmissionIntegrationPatch_v1 } from './LinkCorruptionTransmissionIntegrationPatch_v1.js';
  
  // One-line initialization
  LinkCorruptionTransmissionIntegrationPatch_v1.patchAINodes(aiNodes, NodeLinkingSystem);
  
  // In your animate/update function:
  function animate(deltaTime) {
    // ... existing rendering code ...
    
    // Add this line:
    aiNodes.updateLinkCorruption(deltaTime);
    
    // ... rest of update ...
  }
  
  // That's it! System is running.
}

// ============================================================================
// EXAMPLE 2: COMPLETE SETUP WITH DEBUG
// ============================================================================

export function example2_CompleteSetupWithDebug(aiNodes, NodeLinkingSystem, corruptionVisualFX) {
  console.log('%cExample 2: Complete Setup with Debug', 'font-size: 16px; color: #00ff00;');

  // One-call complete setup
  LinkCorruptionTransmissionIntegrationPatch_v1.completeSetup(
    aiNodes,
    NodeLinkingSystem,
    corruptionVisualFX,
    true  // Enable debug mode
  );

  // Now you can use debug API in console:
  // window.linkCorruptionDebug.allLinksStats()
  // window.linkCorruptionDebug.cascadeHistory()
  // window.linkCorruptionDebug.setLinkCorruption(link, 0.75)

  console.log('✅ Setup complete. Debug API available at window.linkCorruptionDebug');
}

// ============================================================================
// EXAMPLE 3: RESPONDING TO CASCADE EVENTS
// ============================================================================

export function example3_RespondToCascadeEvents(aiNodes) {
  console.log('%cExample 3: Responding to Cascade Events', 'font-size: 16px; color: #00ff00;');

  const system = aiNodes.linkCorruption;

  // Hook into cascade event processing
  const originalProcess = system.processCascadeEvents.bind(system);

  system.processCascadeEvents = function() {
    // Call original processing
    originalProcess();

    // Now respond to each event
    while (this.transmissionQueue.length > 0) {
      const event = this.transmissionQueue.shift();
      
      console.log(`🌊 Cascade Event: ${event.event} at level ${event.level.toFixed(2)}`);

      // Respond based on event type
      switch (event.event) {
        case 'distortion':
          // Play subtle warning sound
          if (window.audioSystem) {
            window.audioSystem.play('distortion_start', { volume: 0.3 });
          }
          break;

        case 'particle_burst':
          // Update UI to show active transmission
          if (window.ui) {
            window.ui.flashLinkTransmissionAlert(event.link);
          }
          break;

        case 'cascade':
          // Big cascade - play warning and update game state
          if (window.audioSystem) {
            window.audioSystem.play('cascade_warning', { volume: 0.7 });
          }
          if (window.gameState) {
            window.gameState.recordCascadeEvent(event.link);
          }
          break;

        case 'infection_complete':
          // Node fully infected - major event
          if (window.audioSystem) {
            window.audioSystem.play('infection_complete', { volume: 1.0 });
          }
          if (window.vfx) {
            window.vfx.showInfectionPulse(event.link.target);
          }
          break;
      }
    }
  };

  console.log('✅ Cascade event handlers installed');
}

// ============================================================================
// EXAMPLE 4: CUSTOM TRANSMISSION RATES
// ============================================================================

export function example4_CustomTransmissionRates(aiNodes) {
  console.log('%cExample 4: Custom Transmission Rates', 'font-size: 16px; color: #00ff00;');

  const system = aiNodes.linkCorruption;

  // Save original method
  const originalCompute = system.computeTransmissionRate.bind(system);

  // Override with custom logic
  system.computeTransmissionRate = function(sourceNode, targetNode, link) {
    // Get base rate from original system
    let rate = originalCompute(sourceNode, targetNode, link);

    // Example 1: Important links are more resistant to corruption
    if (link.userData.priority === 'critical') {
      rate *= 0.2;  // 5x resistance
    }

    // Example 2: Quarantine zones reduce transmission
    if (targetNode.userData.inQuarantine) {
      rate *= 0.1;  // 10x resistance
    }

    // Example 3: Network load increases transmission
    if (sourceNode.userData.load > 0.8) {
      rate *= 1.5;  // Higher load = faster spread
    }

    // Example 4: Player-owned nodes resist better
    if (targetNode.userData.owner === 'player') {
      rate *= 0.5;
    }

    return rate;
  };

  console.log('✅ Custom transmission rates installed');
  console.log('   - Critical links: 5x resistant');
  console.log('   - Quarantine zones: 10x resistant');
  console.log('   - High load: 1.5x spread');
  console.log('   - Player nodes: 2x resistant');
}

// ============================================================================
// EXAMPLE 5: MONITORING CORRUPTION SPREAD
// ============================================================================

export function example5_MonitorCorruptionSpread(aiNodes) {
  console.log('%cExample 5: Monitoring Corruption Spread', 'font-size: 16px; color: #00ff00;');

  // Create a monitoring system
  const monitor = {
    lastStats: null,
    history: [],
    maxHistorySize: 60,

    update(aiNodes) {
      const stats = LinkCorruptionTransmissionIntegrationPatch_v1.getPerformanceStats(aiNodes);
      
      this.lastStats = {
        timestamp: Date.now(),
        ...stats
      };

      this.history.push(this.lastStats);
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }

      return this.lastStats;
    },

    getSpreadRate() {
      if (this.history.length < 2) return 0;
      
      const recent = this.history[this.history.length - 1];
      const previous = this.history[this.history.length - 2];
      
      return recent.averageCorruption - previous.averageCorruption;
    },

    getAverageCorruption() {
      if (this.lastStats) return this.lastStats.averageCorruption;
      return 0;
    },

    log() {
      const stats = this.lastStats;
      if (!stats) return;

      console.log(`
        🔍 Corruption Spread Monitor
        ═══════════════════════════════════
        Average Corruption: ${(stats.averageCorruption * 100).toFixed(1)}%
        Max Level: ${(stats.maxCorruptionLevel * 100).toFixed(1)}%
        Spread Rate: ${(this.getSpreadRate() * 100).toFixed(2)}% per frame
        Cascade Events: ${stats.cascadeEventsTriggered}
        Queued Events: ${stats.queuedEvents}
        Tracked Links: ${stats.trackedLinks} / ${stats.totalLinks}
      `);
    }
  };

  // Call update in your main loop
  // Example: every 30 frames
  let frameCounter = 0;
  const originalAnimate = window.animate;
  
  window.animate = function(deltaTime) {
    frameCounter++;
    
    if (frameCounter % 30 === 0) {
      monitor.update(aiNodes);
      monitor.log();
      
      // Alert if corruption spreading too fast
      if (monitor.getSpreadRate() > 0.1) {
        console.warn('⚠️ Corruption spreading rapidly!');
      }
    }

    return originalAnimate(deltaTime);
  };

  console.log('✅ Monitoring system installed');
  console.log('   Access stats: window.linkCorruptionMonitor.lastStats');
}

// ============================================================================
// EXAMPLE 6: VISUAL INTEGRATION WITH SHADERS
// ============================================================================

export function example6_VisualIntegrationWithShaders(aiNodes, linkRenderer) {
  console.log('%cExample 6: Visual Integration with Shaders', 'font-size: 16px; color: #00ff00;');

  // Patch link renderer to apply corruption visuals
  const system = aiNodes.linkCorruption;

  // Hook into render cycle
  const originalRender = linkRenderer.render.bind(linkRenderer);

  linkRenderer.render = function() {
    // Before rendering, apply corruption to all link materials
    for (const link of this.links || []) {
      const linkData = system.linkCorruption.get(link.id);
      if (linkData && link.material && link.material.uniforms) {
        const vis = link.userData?.corruptionVisualState;
        
        if (vis) {
          // Update shader uniforms
          if (link.material.uniforms.corruptionColor) {
            link.material.uniforms.corruptionColor.value.set(
              vis.colorTint.r,
              vis.colorTint.g,
              vis.colorTint.b
            );
          }

          if (link.material.uniforms.glowIntensity) {
            link.material.uniforms.glowIntensity.value = vis.glowIntensity;
          }

          if (link.material.uniforms.glowFrequency) {
            link.material.uniforms.glowFrequency.value = vis.glowFrequency;
          }

          if (link.material.uniforms.distortionAmount) {
            link.material.uniforms.distortionAmount.value = vis.distortionAmount;
          }

          // Store corruption level for shaders
          link.userData.corruptionLevel = linkData.level;
        }
      }
    }

    // Now render with updated visuals
    return originalRender();
  };

  console.log('✅ Shader visual integration installed');
}

// ============================================================================
// EXAMPLE 7: GAMEPLAY CONSEQUENCES
// ============================================================================

export function example7_GameplayConsequences(aiNodes) {
  console.log('%cExample 7: Gameplay Consequences', 'font-size: 16px; color: #00ff00;');

  const system = aiNodes.linkCorruption;
  const originalHandle = system.handleCascadeEventCascade.bind(system);

  // Override cascade handling to add gameplay consequences
  system.handleCascadeEventCascade = function(event) {
    // Call original
    originalHandle(event);

    const { link, linkData } = event;
    const targetNode = link.target || link.targetNode;

    // Gameplay consequences
    if (targetNode && targetNode.userData) {
      // 1. Reduce throughput
      if (targetNode.userData.processingThroughput !== undefined) {
        targetNode.userData.processingThroughput *= 0.8;
      }

      // 2. Increase error rate
      if (targetNode.userData.errorRate !== undefined) {
        targetNode.userData.errorRate = Math.min(1.0, targetNode.userData.errorRate + 0.1);
      }

      // 3. Reduce synergy potential
      if (targetNode.userData.synergyPotential !== undefined) {
        targetNode.userData.synergyPotential *= 0.7;
      }

      // 4. Trigger cascading spread
      if (targetNode.userData.corruption >= 1.0) {
        // Rapidly corrupt all outbound links
        const outboundLinks = system.getOutboundLinks(targetNode);
        for (const outLink of outboundLinks) {
          const outData = system.initializeLink(outLink);
          if (outData) {
            outData.level = Math.min(1.0, outData.level + 0.15);
          }
        }
      }

      console.log(`📉 Target node stats reduced: throughput, error rate up, synergy down`);
    }
  };

  console.log('✅ Gameplay consequences installed');
}

// ============================================================================
// EXAMPLE 8: ANTI-CORRUPTION DEFENSE
// ============================================================================

export function example8_AntiCorruptionDefense(aiNodes) {
  console.log('%cExample 8: Anti-Corruption Defense', 'font-size: 16px; color: #00ff00;');

  const system = aiNodes.linkCorruption;

  // Defense system
  const defense = {
    // Quarantine a node to stop corruption spread
    quarantineNode(node) {
      if (!node.userData) node.userData = {};
      node.userData.inQuarantine = true;
      node.userData.quarantineStartTime = Date.now();
      
      // Reduce corruption
      node.userData.corruption = Math.max(0, node.userData.corruption - 0.3);
      
      // Reduce all link corruption from this node
      const links = system.getOutboundLinks(node);
      for (const link of links) {
        const linkData = system.linkCorruption.get(link.id);
        if (linkData) {
          linkData.level *= 0.5;
        }
      }
      
      console.log(`🛡️ Node quarantined`);
    },

    // Heal a node's corruption
    healNode(node, amount = 0.5) {
      if (!node.userData) node.userData = {};
      node.userData.corruption = Math.max(0, node.userData.corruption - amount);
      console.log(`💚 Node healed by ${(amount * 100).toFixed(0)}%`);
    },

    // Immunize a node to resist corruption
    immunizeNode(node) {
      if (!node.userData) node.userData = {};
      node.userData.immuneToCorruption = true;
      node.userData.immunityStartTime = Date.now();
      node.userData.corruption = 0;
      console.log(`🛡️ Node immunized`);
    }
  };

  // Hook into transmission to check immunity
  const originalUpdate = system.updateLinkCorruption.bind(system);
  
  system.updateLinkCorruption = function(link, deltaTime) {
    const targetNode = link.target || link.targetNode;
    
    // Skip transmission if node is immune
    if (targetNode?.userData?.immuneToCorruption) {
      console.log('🛡️ Immune node blocked transmission');
      return;
    }

    // Otherwise update normally
    originalUpdate(link, deltaTime);
  };

  // Make defense available globally
  window.corruptionDefense = defense;

  console.log('✅ Defense system installed at window.corruptionDefense');
  console.log('   - corruptionDefense.quarantineNode(node)');
  console.log('   - corruptionDefense.healNode(node, amount)');
  console.log('   - corruptionDefense.immunizeNode(node)');
}

// ============================================================================
// EXAMPLE 9: PERSISTENCE & SAVE/LOAD
// ============================================================================

export function example9_PersistenceAndSaveLoad(aiNodes) {
  console.log('%cExample 9: Persistence & Save/Load', 'font-size: 16px; color: #00ff00;');

  const system = aiNodes.linkCorruption;

  // Save corruption state
  function saveCorruptionState() {
    const state = {
      timestamp: Date.now(),
      links: []
    };

    for (const [linkId, linkData] of system.linkCorruption) {
      state.links.push({
        linkId: linkId,
        level: linkData.level,
        cascadesCrossed: Array.from(linkData.cascadeThresholdsCrossed)
      });
    }

    localStorage.setItem('atoma_link_corruption', JSON.stringify(state));
    console.log(`💾 Saved ${state.links.length} link corruption states`);
    return state;
  }

  // Load corruption state
  function loadCorruptionState() {
    const saved = localStorage.getItem('atoma_link_corruption');
    if (!saved) return null;

    const state = JSON.parse(saved);
    
    // Restore link corruption levels
    for (const linkState of state.links) {
      const linkData = system.linkCorruption.get(linkState.linkId);
      if (linkData) {
        linkData.level = linkState.level;
        linkData.cascadeThresholdsCrossed = new Set(linkState.cascadesCrossed);
      }
    }

    console.log(`📂 Loaded ${state.links.length} link corruption states`);
    return state;
  }

  // Export as JSON
  function exportCorruptionData() {
    const data = {
      version: '1.0',
      timestamp: Date.now(),
      links: []
    };

    for (const [linkId, linkData] of system.linkCorruption) {
      data.links.push({
        linkId: linkId,
        level: linkData.level.toFixed(4),
        velocity: linkData.velocity.toFixed(4),
        cascadesCrossed: Array.from(linkData.cascadeThresholdsCrossed),
        eventCount: linkData.cascadeEvents.length
      });
    }

    return JSON.stringify(data, null, 2);
  }

  // Make available globally
  window.corruptionPersistence = {
    save: saveCorruptionState,
    load: loadCorruptionState,
    export: exportCorruptionData
  };

  console.log('✅ Persistence system installed at window.corruptionPersistence');
  console.log('   - corruptionPersistence.save()');
  console.log('   - corruptionPersistence.load()');
  console.log('   - corruptionPersistence.export()');
}

// ============================================================================
// EXAMPLE 10: FULL INTEGRATION TEMPLATE
// ============================================================================

export function example10_FullIntegrationTemplate(aiNodes, NodeLinkingSystem, corruptionVisualFX) {
  console.log('%cExample 10: Full Integration Template', 'font-size: 16px; color: #00ff00;');

  import { LinkCorruptionTransmissionIntegrationPatch_v1 } from './LinkCorruptionTransmissionIntegrationPatch_v1.js';

  // 1. Initialize system
  LinkCorruptionTransmissionIntegrationPatch_v1.completeSetup(
    aiNodes,
    NodeLinkingSystem,
    corruptionVisualFX,
    true  // debug
  );

  // 2. Setup cascade responses
  example3_RespondToCascadeEvents(aiNodes);

  // 3. Setup custom transmission rates
  example4_CustomTransmissionRates(aiNodes);

  // 4. Setup monitoring
  example5_MonitorCorruptionSpread(aiNodes);

  // 5. Setup visual integration
  // example6_VisualIntegrationWithShaders(aiNodes, linkRenderer);

  // 6. Setup gameplay consequences
  example7_GameplayConsequences(aiNodes);

  // 7. Setup defense system
  example8_AntiCorruptionDefense(aiNodes);

  // 8. Setup persistence
  example9_PersistenceAndSaveLoad(aiNodes);

  // 9. Update loop
  function animate(deltaTime) {
    // ... existing rendering ...
    
    // Update link corruption
    aiNodes.updateLinkCorruption(deltaTime);
    
    // ... rest of update ...
  }

  console.log('✅ FULL INTEGRATION COMPLETE');
  console.log('   ✓ System initialized');
  console.log('   ✓ Cascade responses configured');
  console.log('   ✓ Custom transmission rates active');
  console.log('   ✓ Monitoring enabled');
  console.log('   ✓ Gameplay consequences active');
  console.log('   ✓ Defense system ready');
  console.log('   ✓ Persistence enabled');
  console.log('   ✓ Debug API available');
}

// ============================================================================
// TESTING UTILITIES
// ============================================================================

export function runAllTests(aiNodes) {
  console.log('%cRunning Link Corruption Tests', 'font-size: 16px; color: #00ffff;');

  const system = aiNodes.linkCorruption;
  const tests = [];

  // Test 1: Corruption increases over time
  {
    const link = aiNodes.linkSystem?.allLinks?.[0];
    if (link) {
      system.setLinkCorruption(link, 0.1);
      const before = system.linkCorruption.get(link.id).level;
      system.updateTransmission(1/60);
      const after = system.linkCorruption.get(link.id).level;
      tests.push({
        name: 'Corruption increases',
        pass: after > before,
        before,
        after
      });
    }
  }

  // Test 2: Cascades trigger at thresholds
  {
    const link = aiNodes.linkSystem?.allLinks?.[0];
    if (link) {
      system.setLinkCorruption(link, 0.84);
      system.updateTransmission(0.1);  // Step to trigger
      const cascades = system.linkCorruption.get(link.id).cascadeThresholdsCrossed;
      tests.push({
        name: 'Cascade events trigger',
        pass: cascades.size > 0,
        cascadesTriggered: cascades.size
      });
    }
  }

  // Test 3: Visual state updates
  {
    const link = aiNodes.linkSystem?.allLinks?.[0];
    if (link) {
      system.setLinkCorruption(link, 0.5);
      system.applyLinkCorruptionVisuals(link, 0.5);
      const vis = link.userData?.corruptionVisualState;
      tests.push({
        name: 'Visual state updates',
        pass: vis && vis.colorTint && vis.glowIntensity !== undefined
      });
    }
  }

  // Print results
  console.table(tests);
  console.log(`✅ ${tests.filter(t => t.pass).length}/${tests.length} tests passed`);
}
