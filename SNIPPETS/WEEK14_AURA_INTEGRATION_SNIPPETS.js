/**
 * WEEK 14: ARCHETYPE AURA ENHANCEMENT — INTEGRATION SNIPPETS
 * 
 * Copy-paste code examples for integrating Week 14 into your project.
 * 
 * Phase 3C | Week 14 | Developer Examples & Patterns
 */

// ============================================================================
// SNIPPET 1: BASIC INTEGRATION (main.js or game.js)
// ============================================================================

import { ArchetypeAuraEnhancement_v1 } from './ArchetypeAuraEnhancement_v1.js';

class AtomaGame {
  constructor(config) {
    // ... existing code ...
    
    // After initializing aura systems:
    this.nodeAuraSystem = new NodeAuraSystem_v1({ scene: this.scene, /* ... */ });
    this.linkAuraSystem = new LinkAuraSystem_v1({ scene: this.scene, /* ... */ });
    
    // After initializing archetype curves:
    this.archetypeCurves = new ArchetypeAscensionCurves_v1({ /* ... */ });

    // NEW: Initialize archetype aura enhancements
    this.archetypeAuraFX = new ArchetypeAuraEnhancement_v1({
      nodeAura: this.nodeAuraSystem,
      linkAura: this.linkAuraSystem,
      archetypeCurves: this.archetypeCurves,
      debugEnabled: false,
    });
  }

  update(deltaTime) {
    // ... existing code ...

    // Update archetype curves first
    this.archetypeCurves.update(deltaTime);

    // NEW: Update archetype aura enhancements (AFTER curves)
    this.archetypeAuraFX.update(deltaTime);

    // Existing aura systems render (using enhanced uniforms)
    this.nodeAuraSystem.update(deltaTime);
    this.linkAuraSystem.update(deltaTime);

    // ... rest of game loop ...
  }

  dispose() {
    // ... existing cleanup ...
    
    // NEW: Cleanup archetype aura system
    this.archetypeAuraFX.dispose();
  }
}

// ============================================================================
// SNIPPET 2: VERIFY ENHANCEMENT STATE
// ============================================================================

// Query a node's current enhancement:
function inspectNodeEnhancement(node) {
  const enhancement = game.archetypeAuraFX.getNodeEnhancement(node);
  
  if (!enhancement) {
    console.log('Node not enhanced (missing archetype evolution)');
    return;
  }

  console.log('=== Node Enhancement State ===');
  console.log(`Intensity: ${enhancement.currentIntensity.toFixed(3)}`);
  console.log(`  Target: ${enhancement.targetIntensity.toFixed(3)}`);
  
  console.log(`Radius Boost: ${enhancement.currentRadiusBoost.toFixed(3)}`);
  console.log(`  Target: ${enhancement.targetRadiusBoost.toFixed(3)}`);
  
  console.log(`Bloom Boost: ${enhancement.currentBloomBoost.toFixed(3)}`);
  console.log(`  Target: ${enhancement.targetBloomBoost.toFixed(3)}`);
  
  console.log(`Color Shift: R=${enhancement.currentColorShift.r.toFixed(3)}, G=${enhancement.currentColorShift.g.toFixed(3)}, B=${enhancement.currentColorShift.b.toFixed(3)}`);
  
  console.log(`Distortion: ${enhancement.currentDistortion.toFixed(3)}`);
  console.log(`  Target: ${enhancement.targetDistortion.toFixed(3)}`);
}

// Usage:
// inspectNodeEnhancement(game.aiNodes.nodes[0]);

// ============================================================================
// SNIPPET 3: GET AGGREGATE STATISTICS
// ============================================================================

function displayEnhancementStats() {
  const stats = game.archetypeAuraFX.getStats();
  
  console.log('=== Enhancement Statistics ===');
  console.log(`Enhanced Nodes: ${stats.enhancedNodeCount}`);
  console.log(`Average Intensity: ${stats.avgIntensity.toFixed(3)}`);
  console.log(`Maximum Intensity: ${stats.maxIntensity.toFixed(3)}`);
  
  // Display as bar chart
  const maxBar = 50;
  const avgBar = Math.round((stats.avgIntensity / stats.maxIntensity) * maxBar);
  const maxBar2 = maxBar;
  
  console.log(`Avg: [${'█'.repeat(avgBar)}${' '.repeat(maxBar - avgBar)}]`);
  console.log(`Max: [${'█'.repeat(maxBar2)}]`);
}

// Usage (every 2 seconds):
// setInterval(displayEnhancementStats, 2000);

// ============================================================================
// SNIPPET 4: DETECT ARCHETYPE CHANGES
// ============================================================================

class ArchetypeChangeMonitor {
  constructor(archetypeAuraFX) {
    this.archetypeAuraFX = archetypeAuraFX;
    this.lastArchetypes = new Map();
  }

  update(deltaTime, aiNodes) {
    for (const node of aiNodes) {
      const enhancement = this.archetypeAuraFX.getNodeEnhancement(node);
      if (!enhancement || !node.userData?.archetypeEvolution) continue;

      const currentArchetype = node.userData.archetypeEvolution.archetypeId;
      const lastArchetype = this.lastArchetypes.get(node.id);

      if (lastArchetype && lastArchetype !== currentArchetype) {
        this.onArchetypeChanged(node, lastArchetype, currentArchetype);
      }

      this.lastArchetypes.set(node.id, currentArchetype);
    }
  }

  onArchetypeChanged(node, oldArchetype, newArchetype) {
    console.log(`🔄 Archetype change: ${node.id} ${oldArchetype} → ${newArchetype}`);
    
    // Trigger effects, sounds, events here
    // Example:
    // - Play transition sound
    // - Trigger particle effects
    // - Update UI badge
    // - Log narrative event
  }
}

// Usage:
// const monitor = new ArchetypeChangeMonitor(game.archetypeAuraFX);
// In update loop: monitor.update(deltaTime, game.aiNodes.nodes);

// ============================================================================
// SNIPPET 5: VISUALIZE ENHANCEMENT PROGRESSION
// ============================================================================

function visualizeEnhancementCurve(archetype) {
  // Simulate ascension from 0 to 1
  console.log(`\n=== ${archetype} Enhancement Progression ===`);
  
  const steps = 11;  // 0.0 to 1.0 in 0.1 increments
  
  for (let i = 0; i <= steps; i++) {
    const ascMod = i / steps;
    const bar = '█'.repeat(Math.round(ascMod * 30));
    console.log(`${(ascMod * 100).toFixed(0).padStart(3)}%: [${bar.padEnd(30)}]`);
  }
}

// Usage:
// visualizeEnhancementCurve('sage');
// visualizeEnhancementCurve('warlock');

// ============================================================================
// SNIPPET 6: DEBUG OSCILLATING ARCHETYPES
// ============================================================================

function debugOscillatingSystems() {
  const stats = game.archetypeAuraFX.getStats();
  
  // Find Warlock, Sentinel, Empath (oscillating archetypes)
  const oscillatingCount = {};
  let warlockCount = 0, sentinelCount = 0, empathCount = 0;
  
  for (const node of game.aiNodes.nodes) {
    const ae = node.userData?.archetypeEvolution;
    if (!ae) continue;
    
    if (ae.archetypeId === 'warlock') warlockCount++;
    if (ae.archetypeId === 'sentinel') sentinelCount++;
    if (ae.archetypeId === 'empath') empathCount++;
  }
  
  console.log('Oscillating Archetype Distribution:');
  console.log(`  Warlock:  ${warlockCount} (intensity bursts + radius flicker)`);
  console.log(`  Sentinel: ${sentinelCount} (slow breathing)`);
  console.log(`  Empath:   ${empathCount} (harmonic waves)`);
  
  // Monitor one of each
  const warlocks = game.aiNodes.nodes.filter(n => n.userData?.archetypeEvolution?.archetypeId === 'warlock');
  const sentinels = game.aiNodes.nodes.filter(n => n.userData?.archetypeEvolution?.archetypeId === 'sentinel');
  const empaths = game.aiNodes.nodes.filter(n => n.userData?.archetypeEvolution?.archetypeId === 'empath');
  
  if (warlocks.length > 0) {
    const e1 = game.archetypeAuraFX.getNodeEnhancement(warlocks[0]);
    console.log(`Warlock sample intensity: ${e1?.currentIntensity.toFixed(3)}`);
  }
  
  if (sentinels.length > 0) {
    const e2 = game.archetypeAuraFX.getNodeEnhancement(sentinels[0]);
    console.log(`Sentinel sample intensity: ${e2?.currentIntensity.toFixed(3)}`);
  }
  
  if (empaths.length > 0) {
    const e3 = game.archetypeAuraFX.getNodeEnhancement(empaths[0]);
    console.log(`Empath sample intensity: ${e3?.currentIntensity.toFixed(3)}`);
  }
}

// Usage:
// debugOscillatingSystems();

// ============================================================================
// SNIPPET 7: MANUAL ENHANCEMENT OVERRIDE (ADVANCED)
// ============================================================================

function overrideNodeEnhancement(node, overrides) {
  // Get or create enhancement state
  let enhancement = game.archetypeAuraFX.getNodeEnhancement(node);
  
  if (!enhancement) {
    console.warn('Node not yet enhanced');
    return;
  }

  // Apply overrides
  if (overrides.intensity !== undefined) {
    enhancement.targetIntensity = Math.max(0.5, Math.min(2.5, overrides.intensity));
  }
  
  if (overrides.radiusBoost !== undefined) {
    enhancement.targetRadiusBoost = Math.max(0.5, Math.min(2.0, overrides.radiusBoost));
  }
  
  if (overrides.bloomBoost !== undefined) {
    enhancement.targetBloomBoost = Math.max(0.5, Math.min(2.5, overrides.bloomBoost));
  }
  
  if (overrides.colorShift) {
    enhancement.targetColorShift = overrides.colorShift;
  }
  
  if (overrides.distortion !== undefined) {
    enhancement.targetDistortion = Math.max(0.0, Math.min(1.0, overrides.distortion));
  }
}

// Usage:
// Make a node super bright:
// overrideNodeEnhancement(myNode, {
//   intensity: 2.5,
//   bloomBoost: 2.5,
//   colorShift: { r: 0.2, g: 0.2, b: 0.2 }
// });

// ============================================================================
// SNIPPET 8: COMPARISON: BEFORE & AFTER ENHANCEMENT
// ============================================================================

function compareEnhancementEffect(node) {
  const ae = node.userData?.archetypeEvolution;
  const mult = ae?.ascensionMultiplier ?? 1.0;
  
  console.log(`=== Enhancement Comparison: ${ae?.archetypeName} ===`);
  console.log(`Ascension Multiplier (Week 13): ${mult.toFixed(3)}`);
  
  // Before enhancement (baseline):
  console.log('\nBefore (Week 9–13):');
  console.log(`  Intensity: 1.0 (base)`);
  console.log(`  Radius: 1.0 (base)`);
  console.log(`  Bloom: 1.0 (base)`);
  console.log(`  Color: Neutral`);
  
  // After enhancement (Week 14):
  const enhancement = game.archetypeAuraFX.getNodeEnhancement(node);
  console.log('\nAfter (Week 14 Enhancement):');
  console.log(`  Intensity: ${enhancement?.currentIntensity.toFixed(3)}`);
  console.log(`  Radius: ${enhancement?.currentRadiusBoost.toFixed(3)}`);
  console.log(`  Bloom: ${enhancement?.currentBloomBoost.toFixed(3)}`);
  console.log(`  Color: Shift(${enhancement?.currentColorShift.r.toFixed(3)}, ${enhancement?.currentColorShift.g.toFixed(3)}, ${enhancement?.currentColorShift.b.toFixed(3)})`);
  
  // Calculate boost percentage
  const intensityBoost = ((enhancement?.currentIntensity ?? 1.0) - 1.0) * 100;
  const bloomBoost = ((enhancement?.currentBloomBoost ?? 1.0) - 1.0) * 100;
  
  console.log('\nBoost Percentages:');
  console.log(`  Intensity: +${intensityBoost.toFixed(1)}%`);
  console.log(`  Bloom: +${bloomBoost.toFixed(1)}%`);
}

// Usage:
// compareEnhancementEffect(game.aiNodes.nodes[0]);

// ============================================================================
// SNIPPET 9: SAFE INTEGRATION WITH ERROR HANDLING
// ============================================================================

class SafeArchetypeAuraEnhancement {
  constructor(config) {
    try {
      this.system = new ArchetypeAuraEnhancement_v1(config);
      this.initialized = true;
      console.log('✓ ArchetypeAuraEnhancement_v1 initialized');
    } catch (error) {
      console.error('✗ Failed to initialize archetype aura FX:', error);
      this.initialized = false;
    }
  }

  update(deltaTime) {
    if (!this.initialized) return;
    try {
      this.system.update(deltaTime);
    } catch (error) {
      console.error('✗ Error in archetype aura update:', error);
    }
  }

  getNodeEnhancement(node) {
    if (!this.initialized) return null;
    try {
      return this.system.getNodeEnhancement(node);
    } catch (error) {
      console.error('✗ Error getting node enhancement:', error);
      return null;
    }
  }

  getStats() {
    if (!this.initialized) return { enhancedNodeCount: 0, avgIntensity: 0, maxIntensity: 0 };
    try {
      return this.system.getStats();
    } catch (error) {
      console.error('✗ Error getting stats:', error);
      return { enhancedNodeCount: 0, avgIntensity: 0, maxIntensity: 0 };
    }
  }

  dispose() {
    if (this.initialized) {
      this.system.dispose();
      this.initialized = false;
    }
  }
}

// Usage:
// const safeEnhancementFX = new SafeArchetypeAuraEnhancement({ /* ... */ });

// ============================================================================
// SNIPPET 10: CONSOLE COMMANDS FOR TESTING
// ============================================================================

window.archetypeAuraCommands = {
  // Get stats
  stats: function() {
    const stats = game.archetypeAuraFX.getStats();
    console.table(stats);
  },

  // Inspect a node (use selected node)
  inspect: function() {
    if (game.selectedNode) {
      const enhancement = game.archetypeAuraFX.getNodeEnhancement(game.selectedNode);
      console.table(enhancement);
    } else {
      console.log('No node selected. Try: game.selectedNode = game.aiNodes.nodes[0];');
    }
  },

  // Compare before/after
  compare: function() {
    if (game.selectedNode) {
      compareEnhancementEffect(game.selectedNode);
    }
  },

  // List all archetypes and their enhancements
  allArchetypes: function() {
    const archetypes = {};
    for (const node of game.aiNodes.nodes) {
      const ae = node.userData?.archetypeEvolution;
      if (!ae) continue;
      
      if (!archetypes[ae.archetypeId]) {
        archetypes[ae.archetypeId] = { count: 0, samples: [] };
      }
      archetypes[ae.archetypeId].count++;
      
      if (archetypes[ae.archetypeId].samples.length < 3) {
        const enhancement = game.archetypeAuraFX.getNodeEnhancement(node);
        archetypes[ae.archetypeId].samples.push({
          nodeId: node.id,
          intensity: enhancement?.currentIntensity.toFixed(3),
        });
      }
    }
    
    console.table(archetypes);
  },

  // Enable debug mode
  debug: function() {
    console.log('Debug mode enabled. Archetype aura enhancements will log 1% of frames.');
  },
};

// Usage in console:
// archetypeAuraCommands.stats()
// archetypeAuraCommands.inspect()
// archetypeAuraCommands.compare()
// archetypeAuraCommands.allArchetypes()

// ============================================================================

export {
  // No exports in snippets, all are example code
};
