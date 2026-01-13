/**
 * WEEK 15: ARCHETYPE COLOR PALETTE — INTEGRATION SNIPPETS
 * 
 * Copy-paste code examples for integrating Week 15 into your project.
 * 
 * Phase 3C | Week 15 | Developer Examples
 */

// ============================================================================
// SNIPPET 1: BASIC INTEGRATION (main.js)
// ============================================================================

import { ArchetypeColorPaletteSystem_v1 } from './ArchetypeColorPaletteSystem_v1.js';

class AtomaGame {
  constructor(config) {
    // ... existing code ...
    
    // After initializing color system:
    this.archetypeCurves = new ArchetypeAscensionCurves_v1({ /* ... */ });
    this.archetypeAuraFX = new ArchetypeAuraEnhancement_v1({ /* ... */ });

    // NEW: Initialize color palette system
    this.archetypeColorFX = new ArchetypeColorPaletteSystem_v1({
      archetypeCurves: this.archetypeCurves,
      nodeAuraSystem: this.nodeAuraSystem,
      linkAuraSystem: this.linkAuraSystem,
      debugEnabled: false,
    });
  }

  update(deltaTime) {
    // ... existing code ...

    // Update order is CRITICAL:
    this.archetypeCurves.update(deltaTime);      // Week 13
    this.archetypeAuraFX.update(deltaTime);      // Week 14
    this.archetypeColorFX.update(deltaTime);     // NEW Week 15

    // Aura systems render (use all uniforms)
    this.nodeAuraSystem.update(deltaTime);
    this.linkAuraSystem.update(deltaTime);
  }

  dispose() {
    // ... existing cleanup ...
    this.archetypeColorFX.dispose();
  }
}

// ============================================================================
// SNIPPET 2: QUERY COLOR STATE
// ============================================================================

function inspectNodeColors(node) {
  const colorState = game.archetypeColorFX.getNodeColorState(node);
  
  if (!colorState) {
    console.log('Node has no color state');
    return;
  }

  console.log('=== Node Color State ===');
  console.log(`Primary: ${colorState.currentPrimaryColor.getHexString()}`);
  console.log(`Secondary: ${colorState.currentSecondaryColor.getHexString()}`);
  console.log(`Accent: ${colorState.currentAccentColor.getHexString()}`);
  console.log(`Color Blend: ${colorState.currentColorBlend.toFixed(3)}`);
  console.log(`Warm Shift: ${colorState.currentWarmShift.toFixed(3)}`);
  console.log(`Saturation: ${colorState.currentSaturation.toFixed(3)}`);
  console.log(`Glow: ${colorState.currentAscensionGlow.toFixed(3)}`);
}

// ============================================================================
// SNIPPET 3: GET ALL PALETTES
// ============================================================================

function displayAllPalettes() {
  const palettes = game.archetypeColorFX.getPalettes();
  
  console.log('=== Archetype Color Palettes ===');
  palettes.forEach(p => {
    console.log(`\n${p.name.toUpperCase()}`);
    console.log(`  Primary:   ${p.primary} (■)`);
    console.log(`  Secondary: ${p.secondary} (■)`);
    console.log(`  Accent:    ${p.accent} (■)`);
  });
}

// ============================================================================
// SNIPPET 4: GET STATISTICS
// ============================================================================

function displayColorStats() {
  const stats = game.archetypeColorFX.getStats();
  
  console.log('=== Color Statistics ===');
  console.log(`Colored Nodes: ${stats.coloredNodeCount}`);
  console.log(`Avg Saturation: ${stats.avgSaturation.toFixed(3)}`);
  console.log(`Max Glow: ${stats.maxGlow.toFixed(3)}`);
  
  // Visual representation
  const satBar = '█'.repeat(Math.round(stats.avgSaturation * 20));
  const glowBar = '█'.repeat(Math.round(stats.maxGlow * 20));
  
  console.log(`Saturation: [${satBar.padEnd(20)}]`);
  console.log(`Max Glow:   [${glowBar.padEnd(20)}]`);
}

// ============================================================================
// SNIPPET 5: MONITOR COLOR CHANGES IN REAL-TIME
// ============================================================================

class ColorChangeMonitor {
  constructor(colorPaletteSystem) {
    this.colorFX = colorPaletteSystem;
    this.lastColors = new Map();
  }

  update(aiNodes) {
    for (const node of aiNodes) {
      const colorState = this.colorFX.getNodeColorState(node);
      if (!colorState) continue;

      const currentColor = colorState.currentPrimaryColor.getHexString();
      const lastColor = this.lastColors.get(node.id);

      if (lastColor && lastColor !== currentColor) {
        console.log(`🎨 Color changed: ${node.id} ${lastColor} → ${currentColor}`);
      }

      this.lastColors.set(node.id, currentColor);
    }
  }
}

// Usage:
// const monitor = new ColorChangeMonitor(game.archetypeColorFX);
// In update: monitor.update(game.aiNodes.nodes);

// ============================================================================
// SNIPPET 6: VISUALIZE SATURATION PROGRESSION
// ============================================================================

function visualizeSaturationCurve(archetype) {
  console.log(`\n=== ${archetype} Saturation Curve ===`);
  
  const steps = 11;
  for (let i = 0; i <= steps; i++) {
    const ascMod = i / steps;
    const saturation = 0.85 + (ascMod * 0.5);  // Base formula
    const bar = '█'.repeat(Math.round(saturation * 15));
    console.log(`${(ascMod * 100).toFixed(0).padStart(3)}%: [${bar.padEnd(15)}] ${saturation.toFixed(2)}`);
  }
}

// Usage:
// visualizeSaturationCurve('sage');
// visualizeSaturationCurve('warlock');

// ============================================================================
// SNIPPET 7: COMPARE ARCHETYPE COLORS
// ============================================================================

function compareArchetypeColors() {
  const palettes = game.archetypeColorFX.getPalettes();
  
  console.log('Archetype Color Comparison:');
  console.log('');
  
  palettes.forEach(p => {
    const primary = p.primary;
    const secondary = p.secondary;
    const accent = p.accent;
    
    console.log(`${p.name.padEnd(10)} │ ${primary} ┌─→ ${secondary} ┌─→ ${accent}`);
  });
}

// ============================================================================
// SNIPPET 8: DETECT PALETTE TRANSITIONS
// ============================================================================

function detectPaletteTransitions(node) {
  const colorState = game.archetypeColorFX.getNodeColorState(node);
  if (!colorState) return;

  const blend = colorState.currentColorBlend;
  const saturation = colorState.currentSaturation;
  const warmShift = colorState.currentWarmShift;

  console.log(`${node.userData.archetypeEvolution.archetypeId}:`);
  console.log(`  Phase: ${(blend * 100).toFixed(0)}% (Primary→Secondary→Accent)`);
  console.log(`  Saturation: ${saturation.toFixed(2)}x`);
  console.log(`  Warmth: ${warmShift > 0 ? '+' : ''}${(warmShift * 100).toFixed(0)}%`);
}

// ============================================================================
// SNIPPET 9: TRACK COLOR PROGRESSION OVER TIME
// ============================================================================

class ColorProgressionTracker {
  constructor() {
    this.samples = new Map();  // node.id → [{ time, saturation, blend }, ...]
  }

  sample(aiNodes, currentTime) {
    for (const node of aiNodes) {
      const colorState = game.archetypeColorFX.getNodeColorState(node);
      if (!colorState) continue;

      if (!this.samples.has(node.id)) {
        this.samples.set(node.id, []);
      }

      this.samples.get(node.id).push({
        time: currentTime,
        saturation: colorState.currentSaturation,
        blend: colorState.currentColorBlend,
      });
    }
  }

  report(nodeId) {
    const data = this.samples.get(nodeId);
    if (!data || data.length === 0) {
      console.log('No data for node', nodeId);
      return;
    }

    console.log(`Color Progression for ${nodeId}:`);
    console.log('Time(s)\tSaturation\tBlend\tTrend');
    
    for (let i = 0; i < data.length; i += Math.max(1, Math.floor(data.length / 10))) {
      const d = data[i];
      const trend = i > 0 ? (d.saturation > data[i-1].saturation ? '↑' : '↓') : '-';
      console.log(`${d.time.toFixed(1)}\t${d.saturation.toFixed(2)}\t\t${d.blend.toFixed(2)}\t${trend}`);
    }
  }
}

// ============================================================================
// SNIPPET 10: CONSOLE DEBUGGING COMMANDS
// ============================================================================

window.colorCommands = {
  // Get all palettes
  palettes: function() {
    const p = game.archetypeColorFX.getPalettes();
    console.table(p);
  },

  // Inspect selected node
  inspect: function() {
    if (game.selectedNode) {
      inspectNodeColors(game.selectedNode);
    } else {
      console.log('No node selected');
    }
  },

  // Get stats
  stats: function() {
    displayColorStats();
  },

  // Visualize saturation
  saturation: function(archetype = 'sage') {
    visualizeSaturationCurve(archetype);
  },

  // Compare all palettes
  compare: function() {
    compareArchetypeColors();
  },

  // Get specific palette info
  palette: function(id) {
    const palettes = game.archetypeColorFX.getPalettes();
    const p = palettes.find(x => x.id === id);
    if (p) console.table(p);
    else console.log('Palette not found');
  },
};

// Usage in console:
// colorCommands.palettes()
// colorCommands.inspect()
// colorCommands.stats()
// colorCommands.saturation('warlock')
// colorCommands.compare()

// ============================================================================

export {
  // No exports in snippets, all are example code
};
