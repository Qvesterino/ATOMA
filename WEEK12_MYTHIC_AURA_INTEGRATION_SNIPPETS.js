/**
 * WEEK 12: MYTHIC AURA INTEGRATION — INTEGRATION SNIPPETS
 * 
 * Copy-paste ready code blocks for integrating MythicAuraIntegration_v1
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

import { MythicAuraIntegration_v1 } from './MythicAuraIntegration_v1.js';


// ============================================================================
// SNIPPET 2: SYSTEM INITIALIZATION (Add to constructor)
// ============================================================================

// In AtomaGame constructor or similar:
// Add this AFTER you have created:
//   - this.mythicEvolutionFX (MythicEvolutionFX_v1 instance)
//   - this.nodeAuraSystem (NodeAuraSystem_v1 instance)
//   - this.linkAuraSystem (LinkAuraSystem_v1 instance)

// Initialize Mythic Aura Integration
this.mythicAuraIntegration = new MythicAuraIntegration_v1({
  mythicEvolutionFX: this.mythicEvolutionFX,      // Required
  intensityMultiplier: 0.5,                        // How much boost affects intensity
  colorTintStrength: 0.15,                         // Color tint strength (0–1)
  debugEnabled: false                              // Console logging
});

// Register aura systems
this.mythicAuraIntegration.registerNodeAuraSystem(this.nodeAuraSystem);
this.mythicAuraIntegration.registerLinkAuraSystem(this.linkAuraSystem);

// Log confirmation
console.log('[MythicAuraIntegration_v1] Initialized and registered');


// ============================================================================
// SNIPPET 3: UPDATE LOOP (Add to game.update method)
// ============================================================================

// In AtomaGame.update(deltaTime) or main render loop:
// Add this call AFTER MythicEvolutionFX_v1.update() but BEFORE aura system updates:

// Update evolution tiers (Week 11)
if (this.mythicEvolutionFX) {
  this.mythicEvolutionFX.update(deltaTime);
}

// Apply mythic enhancements to auras ← WEEK 12 NEW
if (this.mythicAuraIntegration) {
  this.mythicAuraIntegration.update(deltaTime);
}

// Update aura systems (they now render with enhanced signals)
if (this.nodeAuraSystem) {
  this.nodeAuraSystem.update(deltaTime);
}
if (this.linkAuraSystem) {
  this.linkAuraSystem.update(deltaTime);
}


// ============================================================================
// SNIPPET 4: CLEANUP (Add to dispose method)
// ============================================================================

// In AtomaGame.dispose() or scene cleanup:
// Add this to properly clean up the integration system:

// Dispose mythic aura integration
if (this.mythicAuraIntegration) {
  this.mythicAuraIntegration.dispose();
  this.mythicAuraIntegration = null;
}


// ============================================================================
// SNIPPET 5: DEBUG HELPER (Optional)
// ============================================================================

/**
 * Debug helper: Print enhancement statistics
 * Call: this.debugMythicAuraIntegration()
 */
debugMythicAuraIntegration() {
  if (!this.mythicAuraIntegration) {
    console.log('[DEBUG] Mythic aura integration not initialized');
    return;
  }

  const stats = this.mythicAuraIntegration.getStats();
  console.log('[DEBUG] Mythic Aura Enhancement Statistics:', {
    nodesEnhanced: stats.nodesEnhanced,
    linksEnhanced: stats.linksEnhanced,
    frameTime: `${stats.frameTime.toFixed(2)}ms`,
    percentage: `${((stats.frameTime / 16.67) * 100).toFixed(1)}% of 60fps budget`
  });
}


// ============================================================================
// SNIPPET 6: QUERY ENHANCEMENT STATE (For diagnostics)
// ============================================================================

/**
 * Helper: Get enhancement state for a node
 */
getNodeEnhancementState(node) {
  if (!this.mythicAuraIntegration || !node) return null;
  const nodeId = node.id || `node_${Math.random()}`;
  const enhancer = this.mythicAuraIntegration.getNodeEnhancer(nodeId);
  
  return {
    nodeId,
    targetBoost: enhancer?.targetBoost ?? 0,
    currentBoost: enhancer?.currentBoost ?? 0,
    colorInfluence: enhancer?.currentColorInfluence ?? 0,
    glowIntensity: enhancer?.currentGlowIntensity ?? 0,
    hintColor: enhancer?.hintColorHex ?? '#808080'
  };
}

/**
 * Helper: Get enhancement state for a link
 */
getLinkEnhancementState(link) {
  if (!this.mythicAuraIntegration || !link) return null;
  const linkId = link.id || `link_${Math.random()}`;
  const enhancer = this.mythicAuraIntegration.getLinkEnhancer(linkId);
  
  return {
    linkId,
    targetBoost: enhancer?.targetBoost ?? 0,
    currentBoost: enhancer?.currentBoost ?? 0,
    colorInfluence: enhancer?.currentColorInfluence ?? 0,
    glowIntensity: enhancer?.currentGlowIntensity ?? 0,
    hintColor: enhancer?.hintColorHex ?? '#808080'
  };
}


// ============================================================================
// SNIPPET 7: CUSTOMIZE ENHANCEMENT STRENGTH (Optional)
// ============================================================================

/**
 * Adjust enhancement parameters at runtime
 */
setMythicEnhancementStrength(intensityMult, colorTint) {
  if (!this.mythicAuraIntegration) return;
  
  // Note: These would need to be properties on MythicAuraIntegration_v1
  // Current version has them in constructor only. This is a suggestion
  // for future enhancement if needed.
  
  console.log(`[DEBUG] Enhancement strength:`, {
    intensityMultiplier: intensityMult,
    colorTintStrength: colorTint
  });
}


// ============================================================================
// SNIPPET 8: COMPLETE INTEGRATION EXAMPLE
// ============================================================================

/**
 * FULL EXAMPLE: Complete integration pattern showing all pieces together
 */

class MyGameEngine {
  constructor(options) {
    // ... other initialization ...

    this.scene = new THREE.Scene();
    this.mythicEvolutionFX = new MythicEvolutionFX_v1({ ... });
    this.nodeAuraSystem = new NodeAuraSystem_v1({ ... });
    this.linkAuraSystem = new LinkAuraSystem_v1({ ... });

    // SNIPPET 2: Initialize Integration
    this.mythicAuraIntegration = new MythicAuraIntegration_v1({
      mythicEvolutionFX: this.mythicEvolutionFX,
      intensityMultiplier: 0.5,
      colorTintStrength: 0.15,
      debugEnabled: false
    });

    // Register systems
    this.mythicAuraIntegration.registerNodeAuraSystem(this.nodeAuraSystem);
    this.mythicAuraIntegration.registerLinkAuraSystem(this.linkAuraSystem);

    console.log('[Game] Mythic aura integration initialized');
  }

  update(deltaTime) {
    // ... update other systems ...

    // Evolution tiers
    if (this.mythicEvolutionFX) {
      this.mythicEvolutionFX.update(deltaTime);
    }

    // SNIPPET 3: Apply Mythic Enhancements
    if (this.mythicAuraIntegration) {
      this.mythicAuraIntegration.update(deltaTime);
    }

    // Render with enhancements
    if (this.nodeAuraSystem) {
      this.nodeAuraSystem.update(deltaTime);
    }
    if (this.linkAuraSystem) {
      this.linkAuraSystem.update(deltaTime);
    }
  }

  dispose() {
    // SNIPPET 4: Clean up
    if (this.mythicAuraIntegration) {
      this.mythicAuraIntegration.dispose();
      this.mythicAuraIntegration = null;
    }

    // ... cleanup other systems ...
  }

  // SNIPPET 5: Debug
  debugMythicAuraIntegration() {
    const stats = this.mythicAuraIntegration?.getStats();
    console.log('[DEBUG] Enhancement Stats:', stats);
  }

  // SNIPPET 6: Query
  debugNodeEnhancement(node) {
    const state = this.getNodeEnhancementState(node);
    console.log('[DEBUG] Node Enhancement:', state);
  }
}

// Usage:
// const game = new MyGameEngine();
// game.update(deltaTime);  // Called every frame
// game.debugMythicAuraIntegration();  // For debugging
// game.dispose();  // On shutdown


// ============================================================================
// SNIPPET 9: EXPECTED VISUAL CHANGES (What you'll see)
// ============================================================================

/*
BEFORE INTEGRATION (Week 11):
  - Node auras: Base intensity, solid color
  - Link auras: Base intensity, solid color
  - No visual tier feedback

AFTER INTEGRATION (Week 12):

  Tier 0 (Dormant):
    - Aura: Faint, gray, minimal intensity
    - Effect: Barely visible

  Tier 1 (Awakened):
    - Aura: Subtle glow, slight blue tint
    - Effect: Starting to awaken

  Tier 2 (Ascending):
    - Aura: Noticeable glow, lime tint (5–10%)
    - Effect: Growing stronger

  Tier 3 (Mythic):
    - Aura: Pronounced glow, purple tint (20%) ✨
    - Effect: Special, legendary appearance
    - Duration: Smooth 0.4s transition

  Tier 4 (Transcendent):
    - Aura: Intense glow, yellow tint (25%) 🔮
    - Effect: Divine, maximum intensity
    - Duration: Smooth 0.5s transition from Mythic

ANIMATIONS:
  - Tier changes: 0.4–0.6 second smooth ramps
  - No flicker or abrupt changes
  - Organic, natural progression
*/


// ============================================================================
// SNIPPET 10: INTEGRATION ORDER (Critical for correctness)
// ============================================================================

/*
CORRECT UPDATE ORDER (in game.update):

  1. Update metrics calculators
     this.nodeDynamicMetrics.update(deltaTime);
     this.linkQualityCalculator.update(deltaTime);
     this.nodeQualityCalculator.update(deltaTime);

  2. Compute mythic evolution tiers
     this.mythicEvolutionFX.update(deltaTime);
     (This populates userData.mythicEvolution)

  3. APPLY MYTHIC ENHANCEMENTS ← Week 12 NEW
     this.mythicAuraIntegration.update(deltaTime);
     (This reads userData.mythicEvolution and updates shader uniforms)

  4. Render aura systems with enhanced signals
     this.nodeAuraSystem.update(deltaTime);
     this.linkAuraSystem.update(deltaTime);
     (These use the enhanced uniforms)

WRONG ORDER (will not work):
  - Calling integration BEFORE evolution system: signals not available
  - Calling integration AFTER aura systems: old signals used
*/


// ============================================================================
// SNIPPET 11: TROUBLESHOOTING TEMPLATE
// ============================================================================

/**
 * Diagnostic function: Test if integration is working
 */
testMythicIntegration() {
  console.log('[TEST] Mythic Aura Integration Diagnostics');

  // 1. Check initialization
  if (!this.mythicAuraIntegration) {
    console.error('  ✗ Integration not initialized');
    return;
  }
  console.log('  ✓ Integration initialized');

  // 2. Check aura systems registered
  if (!this.mythicAuraIntegration.nodeAuraSystem) {
    console.warn('  ⚠ Node aura system not registered');
  } else {
    console.log('  ✓ Node aura system registered');
  }

  if (!this.mythicAuraIntegration.linkAuraSystem) {
    console.warn('  ⚠ Link aura system not registered');
  } else {
    console.log('  ✓ Link aura system registered');
  }

  // 3. Check mythic evolution FX
  if (!this.mythicAuraIntegration.mythicEvolutionFX) {
    console.warn('  ⚠ Mythic evolution FX not set');
  } else {
    console.log('  ✓ Mythic evolution FX connected');
  }

  // 4. Check stats
  const stats = this.mythicAuraIntegration.getStats();
  console.log('  Stats:', {
    nodesEnhanced: stats.nodesEnhanced,
    linksEnhanced: stats.linksEnhanced,
    frameTime: `${stats.frameTime.toFixed(2)}ms`
  });

  // 5. Sample a node
  if (this.aiNodes?.nodes?.[0]) {
    const node = this.aiNodes.nodes[0];
    const nodeId = node.id || 0;
    const enhancer = this.mythicAuraIntegration.getNodeEnhancer(nodeId);
    console.log('  Sample node enhancer:', {
      exists: !!enhancer,
      boost: enhancer?.currentBoost ?? 'N/A',
      color: enhancer?.hintColorHex ?? 'N/A'
    });
  }

  console.log('[TEST] Diagnostics complete');
}


// ============================================================================
// SNIPPET 12: SAFETY VERIFICATION
// ============================================================================

/*
BEFORE DEPLOYING, VERIFY:

Code Integration:
  ☐ SNIPPET 1: Imports added to top of file
  ☐ SNIPPET 2: System created in constructor
  ☐ Registration calls made for both systems
  ☐ SNIPPET 3: update() called in game loop (after MythicEvolutionFX_v1)
  ☐ SNIPPET 4: dispose() called in cleanup

Testing:
  ☐ No console errors on startup
  ☐ Nodes/links have userData.mythicEvolution populated
  ☐ Mythic nodes glow brighter than Dormant
  ☐ Color shifts visible on Mythic+ tiers
  ☐ Tier transitions smooth (not abrupt)
  ☐ Performance <0.6ms verified in DevTools
  ☐ Visual comparison: Before/After clear difference

Safety:
  ☐ No NodeAuraSystem_v1.js modifications
  ☐ No LinkAuraSystem_v1.js modifications
  ☐ System fully reversible
  ☐ All data reads are defensive
  ☐ Proper cleanup on disposal
*/

export default null;  // Export nothing, this is snippet documentation
