/**
 * WEEK 11: MYTHIC EVOLUTION FX — INTEGRATION SNIPPETS
 * 
 * Copy-paste ready code blocks for integrating MythicEvolutionFX_v1
 * into your game engine.
 * 
 * SAFE MODE: All snippets are purely ADDITIVE
 * - No modifications to existing methods
 * - No deletions of existing code
 * - Can be integrated without risk
 */

// ============================================================================
// SNIPPET 1: IMPORTS (Add to top of your main game file)
// ============================================================================

import { MythicEvolutionFX_v1 } from './MythicEvolutionFX_v1.js';


// ============================================================================
// SNIPPET 2: SYSTEM INITIALIZATION (Add to constructor or setup method)
// ============================================================================

// In AtomaGame constructor or similar:
// Add this AFTER you have created:
//   - this.aiNodes (array of nodes)
//   - this.linkingSystem (with .links array)
//   - this.nodeDynamicMetrics (metric source)
//   - this.linkQualityCalculator (metric source)
//   - this.nodeQualityCalculator (metric source)
//   - this.visualMetricModel (optional, metric source)
//   - this.fxPerformance (optional, performance controller)

// Initialize Mythic Evolution FX System
this.mythicEvolutionFX = new MythicEvolutionFX_v1({
  aiNodes: this.aiNodes?.nodes || [],           // Array of nodes
  links: this.linkingSystem?.links || [],       // Array of links
  nodeDynamicMetrics: this.nodeDynamicMetrics,  // Optional, metric source
  linkQualityCalculator: this.linkQualityCalculator,  // Optional
  nodeQualityCalculator: this.nodeQualityCalculator,  // Optional
  visualMetricModel: this.visualMetricModel,    // Optional
  performanceController: this.fxPerformance,    // Optional FX scaler
  emasAlpha: 0.20,                              // EMA smoothing (optional)
  debugEnabled: false                           // Console logging (optional)
});

// Log confirmation
console.log('[MythicEvolutionFX_v1] Initialized and ready');


// ============================================================================
// SNIPPET 3: RENDER LOOP UPDATE (Add to main game update)
// ============================================================================

// In AtomaGame.update(deltaTime) or main render loop:
// Add this call AFTER quality calculators but BEFORE visual systems:

// Update evolution states
if (this.mythicEvolutionFX) {
  this.mythicEvolutionFX.update(deltaTime);
}


// ============================================================================
// SNIPPET 4: CLEANUP ON DISPOSAL (Add to dispose method)
// ============================================================================

// In AtomaGame.dispose() or scene cleanup:
// Add this to properly clean up the evolution system:

// Dispose mythic evolution system
if (this.mythicEvolutionFX) {
  this.mythicEvolutionFX.dispose();
  this.mythicEvolutionFX = null;
}


// ============================================================================
// SNIPPET 5: DEBUG HELPER METHOD (Optional)
// ============================================================================

/**
 * Debug helper: Print evolution statistics
 * Call: this.debugMythicEvolution()
 */
debugMythicEvolution() {
  if (!this.mythicEvolutionFX) {
    console.log('[DEBUG] MythicEvolutionFX not initialized');
    return;
  }

  const stats = this.mythicEvolutionFX.getStats();
  console.log('[DEBUG] Mythic Evolution Statistics:', {
    nodesProcessed: stats.nodesProcessed,
    linksProcessed: stats.linksProcessed,
    mythicNodesCount: stats.mythicNodesCount,
    mythicLinksCount: stats.mythicLinksCount,
    frameTime: `${stats.frameTime.toFixed(2)}ms`,
    percentage: `${((stats.frameTime / 16.67) * 100).toFixed(1)}% of 60fps budget`
  });

  // Find nodes by tier
  const tierCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const node of this.aiNodes?.nodes || []) {
    const tier = node.userData?.mythicEvolution?.tier ?? 0;
    tierCounts[tier]++;
  }
  console.log('[DEBUG] Node Tier Distribution:', {
    Dormant: tierCounts[0],
    Awakened: tierCounts[1],
    Ascending: tierCounts[2],
    Mythic: tierCounts[3],
    Transcendent: tierCounts[4],
  });
}


// ============================================================================
// SNIPPET 6: QUERY NODE STATE (For reading evolution data)
// ============================================================================

/**
 * Helper: Get evolution state for a node
 * Returns: evolution state object or null
 */
getNodeEvolutionState(node) {
  if (!this.mythicEvolutionFX || !node) return null;
  return this.mythicEvolutionFX.getNodeState(node);
}

// Usage:
// const state = this.getNodeEvolutionState(node);
// console.log(`Node tier: ${state?.tierName}, auraBoost: ${state?.auraBoost}`);


// ============================================================================
// SNIPPET 7: CHECK IF NODE IS MYTHIC (Simple boolean check)
// ============================================================================

/**
 * Simple check: Is a node in mythic state?
 */
isNodeMythic(node) {
  return node?.userData?.mythicEvolution?.isMythic ?? false;
}

/**
 * Simple check: Is a node ascending or higher?
 */
isNodeAscending(node) {
  return node?.userData?.mythicEvolution?.isAscending ?? false;
}

// Usage:
// if (this.isNodeMythic(node)) {
//   // Node is special, do something!
// }


// ============================================================================
// SNIPPET 8: EXAMPLE — Use Mythic Signal to Boost Aura (Week 12 pattern)
// ============================================================================

/**
 * EXAMPLE: How to use mythic signals in aura system (future Week 12)
 * This is NOT implemented in Week 11, just shows the pattern.
 */
exampleUseAuraBoostSignal(node, auraSystem) {
  // This example shows how Week 12+ could use the signals
  
  const mythicState = node.userData?.mythicEvolution;
  if (!mythicState) return;

  // Get base aura intensity from whatever system calculates it
  let baseIntensity = 0.5; // Example

  // Boost based on mythic evolution
  const boostedIntensity = baseIntensity * (1 + mythicState.auraBoost * 0.5);

  // Use color hint if high tier
  let auraColor = null;
  if (mythicState.isMythic) {
    auraColor = mythicState.hintColorHex;  // e.g., '#ff00ff' for Mythic
  }

  console.log(`Aura boost: ${mythicState.auraBoost}, color: ${auraColor}`);
  // Then pass boostedIntensity + auraColor to aura system
}


// ============================================================================
// SNIPPET 9: EXAMPLE — Use FX Intensity for Shader Effects (Week 12 pattern)
// ============================================================================

/**
 * EXAMPLE: How to use FX intensity in shader system (future Week 12)
 */
exampleUseFXIntensitySignal(node, material) {
  // This example shows how Week 12+ could use FX signals
  
  const mythicState = node.userData?.mythicEvolution;
  if (!mythicState || !material) return;

  // Apply FX intensity to shader uniform
  if (material.uniforms && material.uniforms.uDistortion) {
    material.uniforms.uDistortion.value = mythicState.fxIntensity;
  }

  // Could also use for glow/bloom intensity
  if (material.uniforms && material.uniforms.uGlowIntensity) {
    material.uniforms.uGlowIntensity.value = mythicState.glowIntensity;
  }

  console.log(`FX intensity: ${mythicState.fxIntensity}`);
}


// ============================================================================
// SNIPPET 10: COMPLETE INTEGRATION EXAMPLE
// ============================================================================

/**
 * FULL EXAMPLE: Complete integration pattern showing all pieces together
 */

class MyGameEngine {
  constructor(options) {
    // ... other initialization ...

    this.aiNodes = new AINodes();
    this.linkingSystem = new NodeLinkingSystem();
    this.nodeDynamicMetrics = new NodeDynamicMetrics(this.aiNodes);
    this.linkQualityCalculator = new LinkQualityCalculator(this.linkingSystem);
    this.nodeQualityCalculator = new NodeQualityCalculator(this.aiNodes);
    this.visualMetricModel = new VisualMetricModel_v1();
    this.fxPerformance = new FXPerformanceController();

    // SNIPPET 2: Initialize Evolution System
    this.mythicEvolutionFX = new MythicEvolutionFX_v1({
      aiNodes: this.aiNodes.nodes,
      links: this.linkingSystem.links,
      nodeDynamicMetrics: this.nodeDynamicMetrics,
      linkQualityCalculator: this.linkQualityCalculator,
      nodeQualityCalculator: this.nodeQualityCalculator,
      visualMetricModel: this.visualMetricModel,
      performanceController: this.fxPerformance,
      debugEnabled: false
    });

    console.log('[Game] Mythic evolution system initialized');
  }

  update(deltaTime) {
    // Update quality calculations first
    this.nodeDynamicMetrics.update(deltaTime);
    this.linkQualityCalculator.update(deltaTime);
    this.nodeQualityCalculator.update(deltaTime);

    // SNIPPET 3: Update evolution
    if (this.mythicEvolutionFX) {
      this.mythicEvolutionFX.update(deltaTime);
    }

    // Now other visual systems can read mythic signals:
    for (const node of this.aiNodes.nodes) {
      const mythicState = node.userData?.mythicEvolution;
      if (mythicState?.isMythic) {
        // Example: do something special for mythic nodes
        this._highlightMythicNode(node, mythicState);
      }
    }
  }

  _highlightMythicNode(node, mythicState) {
    console.log(`Node is ${mythicState.tierName}, boost: ${mythicState.auraBoost}`);
    // Could enhance visuals, play sound, etc.
  }

  dispose() {
    // SNIPPET 4: Clean up
    if (this.mythicEvolutionFX) {
      this.mythicEvolutionFX.dispose();
      this.mythicEvolutionFX = null;
    }

    // ... cleanup other systems ...
  }

  // SNIPPET 5: Debug
  debugMythicEvolution() {
    const stats = this.mythicEvolutionFX?.getStats();
    console.log('[DEBUG] Evolution Stats:', stats);
  }

  // SNIPPET 7: Simple checks
  isNodeMythic(node) {
    return node?.userData?.mythicEvolution?.isMythic ?? false;
  }
}

// Usage:
// const game = new MyGameEngine();
// game.update(deltaTime);  // Called every frame
// game.debugMythicEvolution();  // For debugging
// game.dispose();  // On shutdown


// ============================================================================
// SNIPPET 11: ACCESSING SIGNALS FROM OTHER SYSTEMS (Reference pattern)
// ============================================================================

/**
 * PATTERN: How other systems would read mythic signals (Week 12+)
 */

// In NodeAuraSystem_v1 or similar:
function enhanceAuraForMythicNode(node, auraProfile) {
  const mythicState = node.userData?.mythicEvolution;
  if (!mythicState) return auraProfile;

  // Example: Mythic nodes get boosted aura
  if (mythicState.isMythic) {
    return {
      ...auraProfile,
      baseIntensity: auraProfile.baseIntensity * (1 + mythicState.auraBoost),
      hintColor: mythicState.hintColorHex,
    };
  }

  return auraProfile;
}

// In shader effect system:
function applyMythicEffects(node, material) {
  const mythicState = node.userData?.mythicEvolution;
  if (!mythicState) return;

  if (material.uniforms?.uFXIntensity) {
    material.uniforms.uFXIntensity.value = mythicState.fxIntensity;
  }

  if (material.uniforms?.uGlowIntensity) {
    material.uniforms.uGlowIntensity.value = mythicState.glowIntensity;
  }
}


// ============================================================================
// SNIPPET 12: TIER LOOKUP HELPERS (Optional utilities)
// ============================================================================

/**
 * Helper: Get tier name from number
 */
function getTierName(tierNumber) {
  const names = ['Dormant', 'Awakened', 'Ascending', 'Mythic', 'Transcendent'];
  return names[tierNumber] || 'Unknown';
}

/**
 * Helper: Get tier color from number
 */
function getTierColor(tierNumber) {
  const colors = ['#808080', '#0088ff', '#88ff00', '#ff00ff', '#ffff00'];
  return colors[tierNumber] || '#ffffff';
}

/**
 * Helper: Is tier "special" (Mythic or above)?
 */
function isTierSpecial(tierNumber) {
  return tierNumber >= 3;
}


// ============================================================================
// SNIPPET 13: SAFETY VERIFICATION CHECKLIST
// ============================================================================

/*
BEFORE DEPLOYING, VERIFY:

Code Integration:
  ☐ SNIPPET 1: Imports added to top of file
  ☐ SNIPPET 2: System created in constructor
  ☐ SNIPPET 3: update() called in game loop
  ☐ SNIPPET 4: dispose() called in cleanup

Testing:
  ☐ No console errors on startup
  ☐ Nodes get userData.mythicEvolution populated
  ☐ Tiers change as quality changes
  ☐ Ascension scores smoothly increase (EMA)
  ☐ Visual signals are 0–1 range (no NaN, no Infinity)
  ☐ Performance <1ms in DevTools

Safety:
  ☐ No main.js modifications needed
  ☐ No existing code deleted
  ☐ System fully reversible
  ☐ All data reads are defensive
  ☐ Proper cleanup on disposal
*/

export default null;  // Export nothing, this is snippet documentation
