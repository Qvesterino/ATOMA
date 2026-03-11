/**
 * WEEK 13: ARCHETYPE ASCENSION CURVES — INTEGRATION SNIPPETS
 * 
 * Copy-paste code examples for integrating Week 13 into your project.
 * 
 * Phase 3C | Week 13 | Developer Examples
 */

// ============================================================================
// SNIPPET 1: BASIC INTEGRATION (main.js or game.js)
// ============================================================================

import { ArchetypeAscensionCurves_v1 } from './ArchetypeAscensionCurves_v1.js';

class AtomaGame {
  constructor(config) {
    // ... existing code ...
    
    // After initializing MythicEvolutionFX_v1:
    this.mythicEvolutionFX = new MythicEvolutionFX_v1({
      aiNodes: this.aiNodes.nodes,
      // ... other config ...
    });

    // NEW: Initialize archetype curves
    this.archetypeCurves = new ArchetypeAscensionCurves_v1({
      mythicEvolutionFX: this.mythicEvolutionFX,
      aiNodes: this.aiNodes.nodes,
      personalitySignals: this.nodePersonality,
      debugEnabled: false,
      autoAssignArchetypes: false,
    });
  }

  update(deltaTime) {
    // ... existing code ...

    // Update mythic evolution first
    this.mythicEvolutionFX.update(deltaTime);

    // NEW: Update archetype curves (AFTER mythic evolution)
    this.archetypeCurves.update(deltaTime);

    // ... rest of game loop ...
  }

  dispose() {
    // ... existing cleanup ...
    
    // NEW: Cleanup archetype system
    this.archetypeCurves.dispose();
  }
}

// ============================================================================
// SNIPPET 2: AUTO-ASSIGN ARCHETYPES BASED ON PERSONALITY
// ============================================================================

// In constructor, enable auto-assignment:
this.archetypeCurves = new ArchetypeAscensionCurves_v1({
  mythicEvolutionFX: this.mythicEvolutionFX,
  aiNodes: this.aiNodes.nodes,
  personalitySignals: this.nodePersonality,
  debugEnabled: false,
  autoAssignArchetypes: true,  // Enable auto-assignment!
});

// Now, in update() loop, archetype is automatically assigned:
// - If clarity > 0.7          → sage
// - If entropy > 0.6          → warlock
// - If stability > 0.7        → sentinel
// - If resonance > 0.65       → empath
// - If energy > 0.65          → invoker
// - If tier >= 3              → mythic (override)

// ============================================================================
// SNIPPET 3: MANUAL ARCHETYPE ASSIGNMENT
// ============================================================================

// Assign archetype to a specific node:
this.archetypeCurves.assignArchetype(myNode, 'sage');

// Reassign based on game state:
if (myNode.userData.corruption > 0.8) {
  this.archetypeCurves.assignArchetype(myNode, 'warlock');
  console.log('Node transformed to Warlock!');
}

// Bulk assignment by type:
for (const node of this.aiNodes.nodes) {
  if (node.userData.category === 'control') {
    this.archetypeCurves.assignArchetype(node, 'sentinel');
  } else if (node.userData.category === 'creative') {
    this.archetypeCurves.assignArchetype(node, 'invoker');
  } else {
    this.archetypeCurves.assignArchetype(node, 'sage');
  }
}

// ============================================================================
// SNIPPET 4: QUERY ARCHETYPE STATE (FOR DEBUGGING)
// ============================================================================

// Get archetype evolution for a single node:
const archetypeState = this.archetypeCurves.getNodeState(myNode);

if (archetypeState) {
  console.log(`Node: ${archetypeState.archetypeName}`);
  console.log(`Ascension: ${archetypeState.ascensionModified.toFixed(3)}`);
  console.log(`Multiplier: ${archetypeState.ascensionMultiplier.toFixed(3)}`);
  console.log(`Personality Influence: ${archetypeState.personalityInfluence.toFixed(3)}`);
}

// Get list of all archetypes:
const archetypes = this.archetypeCurves.getArchetypes();
archetypes.forEach(arch => {
  console.log(`${arch.name}: ${arch.curveType} (${arch.baseMultiplier}–${arch.peakMultiplier})`);
});

// Get aggregate statistics:
const stats = this.archetypeCurves.getStats();
console.log(`Total nodes: ${stats.nodeCount}`);
console.log(`Average ascension: ${stats.avgAscension.toFixed(3)}`);
console.log(`Max multiplier: ${stats.maxMultiplier.toFixed(3)}`);
console.log(`Archetype distribution:`, stats.archetypeCounts);

// ============================================================================
// SNIPPET 5: USE ASCENSION MULTIPLIER FOR VISUAL EFFECTS (WEEK 14 PREVIEW)
// ============================================================================

// This is how Week 14+ will consume archetype data:

function updateNodeVisuals(node) {
  const archetypeEvolution = node.userData.archetypeEvolution;
  if (!archetypeEvolution) return;

  const multiplier = archetypeEvolution.ascensionMultiplier;

  // Example 1: Boost aura intensity
  const baseAuraIntensity = 0.5;
  const boostedIntensity = baseAuraIntensity * multiplier;
  applyAuraIntensity(node, boostedIntensity);

  // Example 2: Modulate glow
  const baseGlow = 1.0;
  const glowAmount = baseGlow + multiplier * 0.5;
  applyGlow(node, glowAmount);

  // Example 3: Scale by tier
  const tierBoost = archetypeEvolution.tierBoost;
  const finalScale = 1.0 + (multiplier - 1.0) * tierBoost;
  scaleNodeSize(node, finalScale);

  // Example 4: Color tint based on archetype
  const archetypeColors = {
    sage: '#0088ff',
    warlock: '#ff00ff',
    sentinel: '#cccccc',
    empath: '#00ff00',
    invoker: '#ffff00',
    mythic: '#ffff00',
  };
  const color = archetypeColors[archetypeEvolution.archetypeId];
  const tintAmount = archetypeEvolution.ascensionModified * 0.2;
  applyColorTint(node, color, tintAmount);
}

// ============================================================================
// SNIPPET 6: MONITOR ARCHETYPE DISTRIBUTION
// ============================================================================

// Create a simple HUD display for archetype counts:

function displayArchetypeHUD() {
  const stats = this.archetypeCurves.getStats();
  const counts = stats.archetypeCounts;

  console.clear();
  console.log('=== ARCHETYPE DISTRIBUTION ===');
  console.log(`Total Nodes: ${stats.nodeCount}`);
  console.log(`Avg Ascension: ${stats.avgAscension.toFixed(2)}`);
  console.log(`Max Multiplier: ${stats.maxMultiplier.toFixed(2)}`);
  console.log('');
  console.log(`Sage:      ${counts.sage || 0}`);
  console.log(`Warlock:   ${counts.warlock || 0}`);
  console.log(`Sentinel:  ${counts.sentinel || 0}`);
  console.log(`Empath:    ${counts.empath || 0}`);
  console.log(`Invoker:   ${counts.invoker || 0}`);
  console.log(`Mythic:    ${counts.mythic || 0}`);
}

// Call every frame or on demand:
// setInterval(() => displayArchetypeHUD.call(this), 2000);

// ============================================================================
// SNIPPET 7: DEBUG LOGGING WITH FILTERING
// ============================================================================

// Log only nodes above a certain ascension threshold:

function debugHighAscension(threshold = 0.7) {
  for (const node of this.aiNodes.nodes) {
    const ae = node.userData.archetypeEvolution;
    if (ae && ae.ascensionModified > threshold) {
      console.log(
        `${ae.archetypeName} (${node.id}): ` +
        `asc=${ae.ascensionModified.toFixed(3)} ` +
        `mult=${ae.ascensionMultiplier.toFixed(3)}`
      );
    }
  }
}

// Log only specific archetype:

function debugArchetype(archetypeId) {
  for (const node of this.aiNodes.nodes) {
    const ae = node.userData.archetypeEvolution;
    if (ae && ae.archetypeId === archetypeId) {
      console.log(
        `${node.id}: ` +
        `influence=${ae.personalityInfluence.toFixed(3)} ` +
        `raw=${ae.curveRaw.toFixed(3)} ` +
        `smooth=${ae.curveSmoothed.toFixed(3)}`
      );
    }
  }
}

// Usage:
// debugHighAscension(0.8);
// debugArchetype('warlock');

// ============================================================================
// SNIPPET 8: DYNAMIC PERSONALITY INFLUENCE OVERRIDE
// ============================================================================

// For advanced scenarios, manually adjust personality signals to see effects:

function tweakPersonalityForNode(node, signalName, newValue) {
  // Directly modify node's personality signal
  node.userData[signalName] = Math.max(0, Math.min(1, newValue));

  // Week 13 will use the new value in next update
  console.log(`Updated ${signalName} on ${node.id} to ${newValue}`);
}

// Usage:
// tweakPersonalityForNode(myNode, 'clarity', 0.9);
// tweakPersonalityForNode(myNode, 'entropy', 0.6);

// ============================================================================
// SNIPPET 9: DETECT ARCHETYPE TRANSITIONS
// ============================================================================

// Monitor when nodes change archetypes:

class ArchetypeTransitionMonitor {
  constructor(archetypeCurves) {
    this.archetypeCurves = archetypeCurves;
    this.lastArchetypes = new Map();
  }

  update() {
    for (const node of this.archetypeCurves.aiNodes) {
      const ae = node.userData.archetypeEvolution;
      if (!ae) continue;

      const lastArchetype = this.lastArchetypes.get(node.id);
      if (lastArchetype && lastArchetype !== ae.archetypeId) {
        console.log(
          `🔄 TRANSITION: ${node.id} ${lastArchetype} → ${ae.archetypeId}`
        );
        this.onArchetypeChanged(node, lastArchetype, ae.archetypeId);
      }

      this.lastArchetypes.set(node.id, ae.archetypeId);
    }
  }

  onArchetypeChanged(node, oldArchetype, newArchetype) {
    // Trigger any special effects or events here
    // Examples:
    // - Play sound effect
    // - Trigger particle system
    // - Update UI badge
    // - Log narrative event
  }
}

// Usage:
// const monitor = new ArchetypeTransitionMonitor(this.archetypeCurves);
// In update loop: monitor.update();

// ============================================================================
// SNIPPET 10: EXPORT ARCHETYPE DATA FOR ANALYSIS
// ============================================================================

// Export node archetype data to JSON for external analysis:

function exportArchetypeData() {
  const data = [];

  for (const node of this.aiNodes.nodes) {
    const ae = node.userData.archetypeEvolution;
    const me = node.userData.mythicEvolution;

    if (ae && me) {
      data.push({
        nodeId: node.id,
        archetype: ae.archetypeId,
        ascensionModified: ae.ascensionModified,
        ascensionMultiplier: ae.ascensionMultiplier,
        personalityInfluence: ae.personalityInfluence,
        tier: me.tier,
        tierName: me.tierName,
        clarity: node.userData.clarity ?? 0.5,
        harmony: node.userData?.metrics?.harmony ?? 0.5,
        resonance: node.userData.resonance ?? 0.5,
        energy: node.userData.energy ?? 0.5,
        corruption: node.userData?.metrics?.corruption ?? 0.0,
      });
    }
  }

  return JSON.stringify(data, null, 2);
}

// Usage:
// const json = exportArchetypeData();
// console.log(json);
// Or save to file for analysis:
// downloadJSON(json, 'archetype-data.json');

// ============================================================================
// SNIPPET 11: CURVE VISUALIZATION (CONSOLE)
// ============================================================================

// Plot ascension curves for each archetype:

function plotCurves() {
  const CurveUtils = window.CurveUtils;
  const archetypes = this.archetypeCurves.getArchetypes();

  for (const arch of archetypes) {
    console.log(`\n=== ${arch.name} (${arch.curveType}) ===`);
    for (let x = 0; x <= 1.0; x += 0.1) {
      const multiplier = arch.baseMultiplier +
        (CurveUtils.clamp01(x) * (arch.peakMultiplier - arch.baseMultiplier));
      const bar = '█'.repeat(Math.round(multiplier * 20));
      console.log(
        `${x.toFixed(1)}: ${bar} ${multiplier.toFixed(2)}`
      );
    }
  }
}

// Usage (in console):
// game.plotCurves();

// ============================================================================
// SNIPPET 12: WEEK 14 PREVIEW — AURA ENHANCEMENT
// ============================================================================

// This is how aura systems (Week 9–10) will be enhanced by archetype data:

function enhanceAuraWithArchetype(node) {
  const ae = node.userData.archetypeEvolution;
  if (!ae) return;

  // Read base aura state from Week 9/10
  const baseAura = node.userData.nodeAura;
  if (!baseAura) return;

  // Apply archetype multiplier to aura intensity
  const boostedIntensity = baseAura.intensity * ae.ascensionMultiplier;

  // Apply color tint
  const archetypeColors = {
    sage: '#0088ff',
    warlock: '#ff00ff',
    sentinel: '#cccccc',
    empath: '#00ff00',
    invoker: '#ffff00',
    mythic: '#ffff00',
  };

  const tintColor = archetypeColors[ae.archetypeId];
  const tintAmount = ae.ascensionModified * 0.25;

  // (Week 14 will implement actual material updates)
  console.log(`Aura boost: ${boostedIntensity.toFixed(3)}, tint: ${tintColor}`);
}

// ============================================================================
// SNIPPET 13: SAFE INTEGRATION WITH ERROR HANDLING
// ============================================================================

class SafeArchetypeCurves {
  constructor(config) {
    try {
      this.system = new ArchetypeAscensionCurves_v1(config);
      this.initialized = true;
      console.log('✓ ArchetypeAscensionCurves_v1 initialized');
    } catch (error) {
      console.error('✗ Failed to initialize archetypes:', error);
      this.initialized = false;
    }
  }

  update(deltaTime) {
    if (!this.initialized) return;
    try {
      this.system.update(deltaTime);
    } catch (error) {
      console.error('✗ Error in archetype update:', error);
    }
  }

  getNodeState(node) {
    if (!this.initialized) return null;
    try {
      return this.system.getNodeState(node);
    } catch (error) {
      console.error('✗ Error getting node state:', error);
      return null;
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
// const safeCurves = new SafeArchetypeCurves({ ... });

// ============================================================================
// SNIPPET 14: CONSOLE COMMANDS FOR TESTING
// ============================================================================

// Add these to your console for easy testing:

window.archetypeCommands = {
  // List all node archetypes
  list: function() {
    const stats = game.archetypeCurves.getStats();
    console.table(stats.archetypeCounts);
  },

  // Assign archetype to selected node
  assign: function(archetypeId) {
    if (game.selectedNode) {
      game.archetypeCurves.assignArchetype(game.selectedNode, archetypeId);
      console.log(`Assigned ${archetypeId} to ${game.selectedNode.id}`);
    }
  },

  // Get state of selected node
  inspect: function() {
    if (game.selectedNode) {
      const ae = game.archetypeCurves.getNodeState(game.selectedNode);
      console.table(ae);
    }
  },

  // Get stats
  stats: function() {
    const stats = game.archetypeCurves.getStats();
    console.log('Archetype Stats:');
    console.table({
      nodeCount: stats.nodeCount,
      avgAscension: stats.avgAscension.toFixed(3),
      maxMultiplier: stats.maxMultiplier.toFixed(3),
    });
  },
};

// Usage in console:
// archetypeCommands.list()
// archetypeCommands.assign('warlock')
// archetypeCommands.inspect()
// archetypeCommands.stats()

// ============================================================================

export {
  // No exports in snippets, all are example code
};
