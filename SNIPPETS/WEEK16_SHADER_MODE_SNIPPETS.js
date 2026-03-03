/**
 * WEEK 16: ARCHETYPE SHADER PERSONALITY MODES — INTEGRATION CODE SNIPPETS
 * 
 * Copy-paste ready code examples for integrating ArchetypeShaderModes_v1
 * into your ATOMA game instance.
 */

// ============================================================================
// SNIPPET 1: BASIC IMPORT
// ============================================================================

import { ArchetypeShaderModes_v1 } from './ArchetypeShaderModes_v1.js';

// ============================================================================
// SNIPPET 2: INITIALIZATION IN AtomaGame CONSTRUCTOR
// ============================================================================

class AtomaGame {
  constructor() {
    // ... other initialization ...
    
    // After Week 15 systems are initialized:
    this.setupArchetypeShaderModes();
  }
  
  setupArchetypeShaderModes() {
    try {
      this.archetypeShaderModes = new ArchetypeShaderModes_v1({
        archetypeCurves: this.archetypeCurves,       // Week 13
        archetypeAuraFX: this.archetypeAuraFX,       // Week 14
        archetypeColorFX: this.archetypeColorFX,     // Week 15
        nodeAuraSystem: this.nodeAuraSystem,         // Week 9
        linkAuraSystem: this.linkAuraSystem,         // Week 10
        debugEnabled: false,  // Set to true for development
      });
      
      console.log('✓ [AtomaGame] ArchetypeShaderModes_v1 initialized');
    } catch (err) {
      console.error('[AtomaGame] ArchetypeShaderModes_v1 initialization failed:', err);
    }
  }
}

// ============================================================================
// SNIPPET 3: UPDATE LOOP INTEGRATION
// ============================================================================

animate() {
  const deltaTime = this.clock.getDelta();
  const deltaTimeMs = deltaTime * 1000;
  
  try {
    // Week 13: Update ascension curves
    if (this.archetypeCurves) {
      this.archetypeCurves.update(deltaTime);
    }
    
    // Week 14: Update aura enhancement effects
    if (this.archetypeAuraFX) {
      this.archetypeAuraFX.update(deltaTime);
    }
    
    // Week 15: Update color palette system
    if (this.archetypeColorFX) {
      this.archetypeColorFX.update(deltaTime);
    }
    
    // Week 16: Update shader personality modes (NEW)
    if (this.archetypeShaderModes) {
      this.archetypeShaderModes.update(deltaTime);
    }
    
    // ... other updates ...
    
    // Render
    this.renderer.render(this.scene, this.camera);
    
  } catch (err) {
    console.error('[AtomaGame.animate] Error:', err);
  }
  
  requestAnimationFrame(() => this.animate());
}

// ============================================================================
// SNIPPET 4: CLEANUP / DISPOSE
// ============================================================================

dispose() {
  // Cleanup Week 16
  if (this.archetypeShaderModes) {
    this.archetypeShaderModes.dispose();
  }
  
  // Cleanup Week 15
  if (this.archetypeColorFX) {
    this.archetypeColorFX.dispose();
  }
  
  // Cleanup Week 14
  if (this.archetypeAuraFX) {
    this.archetypeAuraFX.dispose();
  }
  
  // Cleanup Week 13
  if (this.archetypeCurves) {
    this.archetypeCurves.dispose();
  }
  
  // ... other cleanup ...
}

// ============================================================================
// SNIPPET 5: DEBUG CONSOLE API
// ============================================================================

setupDebugCommands() {
  // Access shader modes system
  window.shaderModes = this.archetypeShaderModes;
  
  // Example debug command: Check performance
  window.checkShaderModesPerf = () => {
    const perf = this.archetypeShaderModes.frameUpdateTime;
    console.log(`ArchetypeShaderModes_v1 update time: ${perf.toFixed(3)}ms`);
  };
  
  // Example debug command: Inspect node shader state
  window.inspectNodeShaderMode = (nodeIndex = 0) => {
    const node = this.aiNodes.nodes[nodeIndex];
    if (!node) {
      console.warn('Node not found');
      return;
    }
    const state = this.archetypeShaderModes.getNodeState(node);
    console.log('Node Shader Mode State:', {
      archetypeId: state.archetypeId,
      intensity: state.currentIntensity.toFixed(3),
      distortion: state.currentDistortion.toFixed(3),
      bloom: state.currentBloom.toFixed(3),
      hueShift: state.currentHueShift.toFixed(3),
      noiseShift: state.currentNoiseShift.toFixed(3),
      gradientMix: state.currentGradientMix.toFixed(3),
      iridescence: state.currentIridescence.toFixed(3),
    });
  };
  
  // Example debug command: List all archetypes
  window.listArchetypes = () => {
    const archetypeMap = {
      0: 'Sage',
      1: 'Warlock',
      2: 'Sentinel',
      3: 'Empath',
      4: 'Invoker',
      5: 'Mythic',
    };
    console.table(archetypeMap);
  };
}

// ============================================================================
// SNIPPET 6: ARCHETYPE ASSIGNMENT (MANUAL)
// ============================================================================

/**
 * Manually assign archetype to a node for testing
 */
assignArchetypeForTesting(node, archetypeId) {
  if (!node || !node.userData) {
    console.warn('Invalid node');
    return;
  }
  
  // Ensure archetypeEvolution exists
  if (!node.userData.archetypeEvolution) {
    node.userData.archetypeEvolution = {};
  }
  
  const archetypeMap = {
    0: 'sage',
    1: 'warlock',
    2: 'sentinel',
    3: 'empath',
    4: 'invoker',
    5: 'mythic',
  };
  
  node.userData.archetypeEvolution.archetypeId = archetypeId;
  node.userData.archetypeEvolution.archetypeName = archetypeMap[archetypeId] || 'sage';
  
  console.log(`✓ Assigned archetype "${archetypeMap[archetypeId]}" to node`);
}

// Usage: window.game.assignArchetypeForTesting(node, 5);  // Assign Mythic

// ============================================================================
// SNIPPET 7: INSPECT MATERIAL UNIFORMS
// ============================================================================

/**
 * Debug helper: Inspect shader mode uniforms on a material
 */
inspectShaderModeUniforms(material) {
  if (!material || !material.uniforms) {
    console.warn('Material has no uniforms');
    return;
  }
  
  const uniforms = material.uniforms;
  console.log('Shader Mode Uniforms:', {
    uShaderModeId: uniforms.uShaderModeId?.value,
    uModeIntensity: uniforms.uModeIntensity?.value?.toFixed(3),
    uModeDistortion: uniforms.uModeDistortion?.value?.toFixed(3),
    uModeBloom: uniforms.uModeBloom?.value?.toFixed(3),
    uModeHueShift: uniforms.uModeHueShift?.value?.toFixed(3),
    uModeNoiseShift: uniforms.uModeNoiseShift?.value?.toFixed(3),
    uModeGradientMix: uniforms.uModeGradientMix?.value?.toFixed(3),
    uModeIridescence: uniforms.uModeIridescence?.value?.toFixed(3),
  });
}

// Usage:
// const aura = window.game.nodeAuraSystem.auras.values().next().value;
// window.game.inspectShaderModeUniforms(aura.material);

// ============================================================================
// SNIPPET 8: VISUALIZE ARCHETYPE DISTRIBUTION
// ============================================================================

/**
 * Console report: Show distribution of archetypes in active nodes
 */
reportArchetypeDistribution() {
  const distribution = {
    sage: 0,
    warlock: 0,
    sentinel: 0,
    empath: 0,
    invoker: 0,
    mythic: 0,
    unassigned: 0,
  };
  
  for (const node of this.aiNodes.nodes) {
    const archetypeName = node.userData?.archetypeEvolution?.archetypeName || 'unassigned';
    if (distribution.hasOwnProperty(archetypeName)) {
      distribution[archetypeName]++;
    } else {
      distribution.unassigned++;
    }
  }
  
  console.table(distribution);
  
  // Print summary
  const total = this.aiNodes.nodes.length;
  const assigned = total - distribution.unassigned;
  console.log(`\nArchetype Assignment: ${assigned}/${total} (${(assigned/total*100).toFixed(1)}%)`);
}

// Usage: window.game.reportArchetypeDistribution();

// ============================================================================
// SNIPPET 9: ENABLE/DISABLE SHADER MODES DEBUG
// ============================================================================

/**
 * Toggle shader modes debug logging on/off
 */
toggleShaderModesDebug(enable) {
  if (!this.archetypeShaderModes) {
    console.warn('ArchetypeShaderModes not initialized');
    return;
  }
  
  this.archetypeShaderModes.debugEnabled = enable;
  console.log(`Shader Modes Debug: ${enable ? 'ENABLED' : 'DISABLED'}`);
}

// Usage:
// window.game.toggleShaderModesDebug(true);   // Enable
// window.game.toggleShaderModesDebug(false);  // Disable

// ============================================================================
// SNIPPET 10: PERFORMANCE MONITORING
// ============================================================================

/**
 * Monitor shader modes performance over time
 */
monitorShaderModesPerformance(durationMs = 5000) {
  const results = [];
  const startTime = Date.now();
  
  const interval = setInterval(() => {
    if (!this.archetypeShaderModes) {
      clearInterval(interval);
      return;
    }
    
    results.push(this.archetypeShaderModes.frameUpdateTime);
    
    if (Date.now() - startTime > durationMs) {
      clearInterval(interval);
      
      // Calculate statistics
      const avg = results.reduce((a, b) => a + b) / results.length;
      const max = Math.max(...results);
      const min = Math.min(...results);
      
      console.log(`
Performance Report (${results.length} frames):
  Average: ${avg.toFixed(3)}ms
  Min:     ${min.toFixed(3)}ms
  Max:     ${max.toFixed(3)}ms
  Budget:  0.8ms
  Status:  ${avg < 0.8 ? '✓ PASS' : '✗ FAIL'}
      `);
    }
  }, 0);  // Every frame
}

// Usage: window.game.monitorShaderModesPerformance(5000);  // 5 seconds

// ============================================================================
// SNIPPET 11: INTEGRATION VERIFICATION CHECKLIST
// ============================================================================

/**
 * Verify Week 16 integration is complete and working
 */
verifyWeek16Integration() {
  const checks = {
    'ArchetypeShaderModes initialized': !!this.archetypeShaderModes,
    'Week 13 system available': !!this.archetypeCurves,
    'Week 14 system available': !!this.archetypeAuraFX,
    'Week 15 system available': !!this.archetypeColorFX,
    'Node aura system available': !!this.nodeAuraSystem,
    'Link aura system available': !!this.linkAuraSystem,
    'AI nodes initialized': !!this.aiNodes && this.aiNodes.nodes.length > 0,
  };
  
  let allPassed = true;
  for (const [check, result] of Object.entries(checks)) {
    const status = result ? '✓' : '✗';
    console.log(`${status} ${check}`);
    allPassed = allPassed && result;
  }
  
  console.log(`\nOverall Status: ${allPassed ? '✓ READY' : '✗ NOT READY'}`);
  return allPassed;
}

// Usage: window.game.verifyWeek16Integration();

// ============================================================================
// SNIPPET 12: EXAMPLE USE CASE - SPAWN NODE WITH SPECIFIC ARCHETYPE
// ============================================================================

/**
 * Spawn a node with a specific archetype (for testing)
 */
spawnNodeWithArchetype(position, archetypeId) {
  const archetypeMap = {
    0: 'sage',
    1: 'warlock',
    2: 'sentinel',
    3: 'empath',
    4: 'invoker',
    5: 'mythic',
  };
  
  // Create node (using existing spawn system)
  const node = this.aiNodes.spawn(position.x, position.y, position.z);
  
  if (node) {
    // Assign archetype
    if (!node.userData.archetypeEvolution) {
      node.userData.archetypeEvolution = {};
    }
    
    node.userData.archetypeEvolution.archetypeId = archetypeId;
    node.userData.archetypeEvolution.archetypeName = archetypeMap[archetypeId] || 'sage';
    node.userData.archetypeEvolution.ascensionMultiplier = 1.0 + Math.random() * 0.5;
    
    console.log(`✓ Spawned ${archetypeMap[archetypeId]} node at`, position);
    return node;
  } else {
    console.warn('Failed to spawn node');
    return null;
  }
}

// Usage:
// const node = window.game.spawnNodeWithArchetype({ x: 0, y: 5, z: -10 }, 5);  // Mythic

// ============================================================================
// END OF SNIPPETS
// ============================================================================
