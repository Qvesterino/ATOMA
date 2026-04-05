/**
 * ATOMA ENGINE HEALTH CHECK — Console API
 * 
 * Validates all core systems are wired correctly and receiving events.
 * Copy-paste this into browser console to verify stability.
 * 
 * Usage:
 *   window.testEngineHealth()
 * 
 * Returns:
 *   {
 *     linking: "ok|warning|error",
 *     synergy: "ok|warning|error",
 *     history: "ok|warning|error",
 *     glow: "ok|warning|error",
 *     highways: "ok|warning|error",
 *     monitors: "ok|warning|error",
 *     visuals: "ok|warning|error",
 *     errors: [array of issues]
 *   }
 */

window.testEngineHealth = function() {
  const health = {
    linking: 'ok',
    synergy: 'ok',
    history: 'ok',
    glow: 'ok',
    highways: 'ok',
    monitors: 'ok',
    visuals: 'ok',
    errors: [],
    warnings: [],
    details: {}
  };

  // ═══════════════════════════════════════════════════════════════
  // TEST 1: LINKING SYSTEM
  // ═══════════════════════════════════════════════════════════════
  try {
    if (!window.nodeLinker) {
      health.linking = 'error';
      health.errors.push('NodeLinkingSystem not found (window.nodeLinker)');
    } else {
      const links = window.nodeLinker.links || [];
      health.details.linkCount = links.length;
      
      // Check if callbacks are wired
      const hasLinkCallbacks = 
        (window.nodeLinker.linkCreatedCallbacks?.length || 0) > 0 ||
        (window.nodeLinker.onLinkRemovedCallbacks?.length || 0) > 0;
      
      if (!hasLinkCallbacks && links.length > 0) {
        health.warnings.push('Link callbacks not registered');
      }
      
      console.log(`✓ NodeLinkingSystem: ${links.length} links loaded`);
    }
  } catch (err) {
    health.linking = 'error';
    health.errors.push(`NodeLinkingSystem check failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 2: SYNERGY SCORING
  // ═══════════════════════════════════════════════════════════════
  try {
    if (typeof window.computeSynergyScore !== 'function') {
      health.synergy = 'error';
      health.errors.push('ComputeSynergyScore2_0 not found (window.computeSynergyScore)');
    } else {
      // Try computing a test score
      if (window.nodeLinker && window.nodeLinker.links.length > 0) {
        const testLink = window.nodeLinker.links[0];
        if (testLink.nodeA && testLink.nodeB) {
          const score = window.computeSynergyScore(testLink.nodeA, testLink.nodeB);
          health.details.lastSynergyScore = score;
          
          if (typeof score === 'number' && score >= 0 && score <= 1) {
            console.log(`✓ ComputeSynergyScore2_0: score = ${score.toFixed(3)}`);
          } else {
            health.synergy = 'warning';
            health.warnings.push(`Invalid synergy score: ${score}`);
          }
        }
      } else {
        console.log('✓ ComputeSynergyScore2_0: available (no test links)');
      }
    }
  } catch (err) {
    health.synergy = 'error';
    health.errors.push(`Synergy scoring check failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 3: LINK HISTORY TRACKER
  // ═══════════════════════════════════════════════════════════════
  try {
    if (!window.LinkHistoryTracker1_0) {
      health.history = 'error';
      health.errors.push('LinkHistoryTracker1_0 not found');
    } else {
      const stats = window.LinkHistoryTracker1_0?.getStats?.();
      
      if (stats) {
        health.details.historySamples = stats.totalSamples || 0;
        health.details.historyTrend = stats.trend || 'unknown';
        
        if (stats.totalSamples === 0 && window.nodeLinker?.links.length > 0) {
          health.history = 'warning';
          health.warnings.push('LinkHistoryTracker has no samples (not recording)');
        }
        
        console.log(`✓ LinkHistoryTracker1_0: ${stats.totalSamples || 0} samples, trend: ${stats.trend}`);
      } else {
        health.history = 'warning';
        health.warnings.push('LinkHistoryTracker stats unavailable');
      }
    }
  } catch (err) {
    health.history = 'error';
    health.errors.push(`History tracker check failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 4: LINK GLOW SYNERGY ENGINE
  // ═══════════════════════════════════════════════════════════════
  try {
    if (typeof window.LinkGlowSynergyEngine1_0 === 'undefined') {
      health.glow = 'error';
      health.errors.push('LinkGlowSynergyEngine1_0 not found');
    } else {
      // Check if initialized
      const stats = window.LinkGlowSynergyEngine1_0?.getStats?.();
      
      if (stats) {
        health.details.glowCacheSize = stats.cacheSize || 0;
        health.details.glowUpdatesThisFrame = stats.updatesThisFrame || 0;
        
        if (stats.cacheSize === 0 && window.nodeLinker?.links.length > 0) {
          health.glow = 'warning';
          health.warnings.push('LinkGlowSynergyEngine cache empty (not initialized?)');
        }
        
        console.log(`✓ LinkGlowSynergyEngine1_0: cache size = ${stats.cacheSize}`);
      } else {
        health.glow = 'warning';
        health.warnings.push('LinkGlowSynergyEngine stats unavailable');
      }
    }
  } catch (err) {
    health.glow = 'error';
    health.errors.push(`Glow engine check failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 5: SYNERGY HIGHWAYS
  // ═══════════════════════════════════════════════════════════════
  try {
    if (typeof window.SynergyHighways2_0 === 'undefined') {
      health.highways = 'error';
      health.errors.push('SynergyHighways2_0 not found');
    } else {
      const stats = window.SynergyHighways2_0?.getStats?.();
      
      if (stats) {
        health.details.highwayCount = stats.highwayCount || 0;
        health.details.lastRebuildMs = stats.lastRebuildMs || 0;
        
        console.log(`✓ SynergyHighways2_0: ${stats.highwayCount} highways built`);
      } else {
        health.highways = 'warning';
        health.warnings.push('SynergyHighways2_0 stats unavailable');
      }
    }
  } catch (err) {
    health.highways = 'error';
    health.errors.push(`Synergy highways check failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 6: AUTOMATION MONITOR
  // ═══════════════════════════════════════════════════════════════
  try {
    if (typeof window.linkAutomationMonitor === 'undefined') {
      health.monitors = 'error';
      health.errors.push('LinkAutomationMonitor3_0 not found (window.linkAutomationMonitor)');
    } else {
      const stats = window.linkAutomationMonitor?.getStats?.();
      
      if (stats && stats.initialized) {
        health.details.totalAutoLinksCreated = stats.totalAutoLinksCreated || 0;
        health.details.totalCycles = stats.totalCycles || 0;
        health.details.acceptanceRate = stats.acceptanceRate || 0;
        
        if (stats.totalCycles === 0) {
          health.monitors = 'warning';
          health.warnings.push('LinkAutomationMonitor has recorded zero cycles');
        }
        
        console.log(`✓ LinkAutomationMonitor3_0: ${stats.totalCycles} cycles, ${stats.totalAutoLinksCreated} auto-links`);
      } else {
        health.monitors = 'error';
        health.errors.push('LinkAutomationMonitor not initialized');
      }
    }
  } catch (err) {
    health.monitors = 'error';
    health.errors.push(`Automation monitor check failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 7: VISUAL SYSTEMS
  // ═══════════════════════════════════════════════════════════════
  try {
    const visualChecks = {
      glyphSystem3: typeof window.AtomaGlyphSystem3_0 !== 'undefined',
      glyphSystem4: typeof window.AtomaGlyphSystem4_0 !== 'undefined',
      highwayVisuals: typeof window.SynergyHighwayVisuals3D_1_0 !== 'undefined',
      neonLinkVisuals: window.nodeLinker?.visuals !== undefined,
      hudResolver: typeof window.HUDResolver !== 'undefined'
    };
    
    const visualCount = Object.values(visualChecks).filter(v => v).length;
    health.details.visualSystemsLoaded = visualCount;
    
    const failedVisuals = Object.entries(visualChecks)
      .filter(([name, loaded]) => !loaded)
      .map(([name]) => name);
    
    if (failedVisuals.length > 0) {
      health.visuals = 'warning';
      health.warnings.push(`Visual systems not loaded: ${failedVisuals.join(', ')}`);
    }
    
    console.log(`✓ Visual systems: ${visualCount}/5 loaded`);
  } catch (err) {
    health.visuals = 'error';
    health.errors.push(`Visual systems check failed: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // OVERALL STATUS
  // ═══════════════════════════════════════════════════════════════
  
  // Determine overall status
  const systemStatuses = [
    health.linking, health.synergy, health.history,
    health.glow, health.highways, health.monitors, health.visuals
  ];
  
  const errorCount = systemStatuses.filter(s => s === 'error').length;
  const warningCount = systemStatuses.filter(s => s === 'warning').length;
  
  let overallStatus = 'ok';
  if (errorCount > 0) {
    overallStatus = 'error';
    health.errors.push(`${errorCount} systems in error state`);
  } else if (warningCount > 0) {
    overallStatus = 'warning';
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('ATOMA ENGINE HEALTH CHECK SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Overall Status: ${overallStatus.toUpperCase()}`);
  console.log(`Errors: ${health.errors.length}`);
  console.log(`Warnings: ${health.warnings.length}`);
  console.log('───────────────────────────────────────────────────────────────');
  
  if (health.errors.length > 0) {
    console.log('❌ ERRORS:');
    health.errors.forEach(e => console.log(`   - ${e}`));
  }
  
  if (health.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    health.warnings.forEach(w => console.log(`   - ${w}`));
  }
  
  console.log('───────────────────────────────────────────────────────────────');
  console.log('System Details:');
  Object.entries(health.details).forEach(([key, value]) => {
    console.log(`  ${key}: ${JSON.stringify(value)}`);
  });
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  return health;
};

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL DEBUG HELPERS
// ═══════════════════════════════════════════════════════════════

window.debugEngineEvents = function() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  ATOMA ENGINE EVENT DEBUG                 ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  // Check event hooks
  console.log('Event Hooks Status:');
  
  const hooks = {
    'onSynergyComputed': typeof window.onSynergyComputed === 'function',
    'onLinkCreated': typeof window.onLinkCreated === 'function',
    'onLinkRemoved': typeof window.onLinkRemoved === 'function',
    'onHistoryUpdate': typeof window.onHistoryUpdate === 'function',
    'onHighwayRebuild': typeof window.onHighwayRebuild === 'function',
    'onAutomationCycle': typeof window.onAutomationCycle === 'function'
  };
  
  Object.entries(hooks).forEach(([name, exists]) => {
    console.log(`  ${exists ? '✓' : '✗'} ${name}`);
  });
  
  console.log('\nLast Events (from monitors):');
  
  if (window.linkAutomationMonitor?.getRecentEvents) {
    const events = window.linkAutomationMonitor.getRecentEvents(5);
    events.forEach(e => {
      console.log(`  [${new Date(e.timestamp).toLocaleTimeString()}] ${e.type}`);
    });
  }
  
  console.log('\nMonitor Statistics:');
  const stats = window.linkAutomationMonitor?.getStats?.();
  if (stats && stats.initialized) {
    console.log(`  Cycles: ${stats.totalCycles}`);
    console.log(`  Auto Links: ${stats.totalAutoLinksCreated}`);
    console.log(`  Acceptance Rate: ${stats.acceptanceRate}%`);
    console.log(`  Trend: ${stats.trend}`);
    console.log(`  Volatility: ${stats.volatility}`);
  } else {
    console.log('  Monitor not initialized');
  }
};

window.debugVisualLayers = function() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  VISUAL LAYERS DEBUG                       ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  // Check scene
  if (!window.scene) {
    console.log('❌ Scene not found (window.scene)');
    return;
  }
  
  console.log(`Scene children: ${window.scene.children.length}`);
  
  // List groups in scene
  console.log('\nScene groups:');
  window.scene.children.forEach(child => {
    const meshCount = child.children?.length || 0;
    console.log(`  - ${child.name || 'unnamed'} (${meshCount} children)`);
  });
  
  // Check highway visuals
  console.log('\nHighway Visuals:');
  const hwGroup = window.scene.children.find(c => c.name === 'SynergyHighways3D');
  if (hwGroup) {
    console.log(`  ✓ Found: ${hwGroup.children.length} meshes`);
  } else {
    console.log('  ✗ Not found');
  }
  
  // Check link visuals
  console.log('\nLink Visuals:');
  if (window.nodeLinker?.visuals) {
    console.log('  ✓ NeonLinkVisuals initialized');
  } else {
    console.log('  ✗ NeonLinkVisuals not found');
  }
};

// Export for accessibility
window.testEngineHealth.debug = window.debugEngineEvents;
window.testEngineHealth.visuals = window.debugVisualLayers;

console.log('✓ Engine Health Check API loaded');
console.log('Usage: window.testEngineHealth()');
console.log('  Detailed: window.debugEngineEvents()');
console.log('  Visuals: window.debugVisualLayers()');
