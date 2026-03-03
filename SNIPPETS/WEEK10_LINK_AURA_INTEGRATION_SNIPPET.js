/**
 * WEEK 10: LINK AURA SYSTEM — INTEGRATION SNIPPETS
 * 
 * Copy-paste ready code blocks for integrating LinkAuraSystem_v1
 * into your AtomaGame or similar game engine.
 * 
 * SAFE MODE: All snippets are purely ADDITIVE
 * - No modifications to existing methods
 * - No deletions of existing code
 * - Can be integrated without risk
 */

// ============================================================================
// SNIPPET 1: IMPORTS (Add to top of your main game file)
// ============================================================================

import { LinkAuraSystem_v1 } from './LinkAuraSystem_v1.js';


// ============================================================================
// SNIPPET 2: SYSTEM INITIALIZATION (Add to constructor or setup method)
// ============================================================================

// In AtomaGame constructor or similar:
// Add this AFTER you have created:
//   - this.scene (THREE.Scene)
//   - this.linkingSystem (NodeLinkingSystem)
//   - this.fxPerformance (FXPerformanceController, optional)

// Initialize Link Aura System
this.linkAuraSystem = new LinkAuraSystem_v1({
  scene: this.scene,
  linkManager: this.linkingSystem,        // Your NodeLinkingSystem reference
  fxPerformance: this.fxPerformance,      // Optional performance controller
  profileResolver: this._resolveLinkAuraProfile.bind(this),  // Custom resolver
  debugEnabled: false  // Set true for console logging
});

// Log confirmation
console.log('[LinkAuraSystem_v1] Initialized and ready');


// ============================================================================
// SNIPPET 3: PROFILE RESOLVER METHOD (Add as class method)
// ============================================================================

/**
 * Resolve which aura profile to use for a link
 * Called by LinkAuraSystem for each link
 * 
 * Returns: String profile ID ('synergy_aura', 'stability_aura', etc.)
 */
_resolveLinkAuraProfile(link) {
  // Safety checks
  if (!link || !link.userData) {
    return 'stability_aura';  // Fallback
  }

  // Read quality metrics
  const quality = link.userData?.quality?.score ?? 50;
  const synergy = link.userData?.quality?.synergyNorm ?? 0.5;
  const corruption = link.userData?.metrics?.corruption ?? 0.0;
  const entropy = link.userData?.metrics?.entropy ?? 0.0;
  const resonance = link.userData?.metrics?.resonance ?? 0.0;

  // Decision tree (priority-based)
  
  // PRIORITY 1: Detect corruption (danger signals)
  if (corruption > 0.45) {
    return 'corruption_aura';  // RED warning
  }

  // PRIORITY 2: Detect legendary pairings (rare)
  if (quality > 80 && synergy > 0.6) {
    return 'mythic_synergy_aura';  // PURPLE legend
  }

  // PRIORITY 3: High synergy (harmonic compatibility)
  if (synergy > 0.6) {
    return 'synergy_aura';  // CYAN harmony
  }

  // PRIORITY 4: High entropy (chaos)
  if (entropy > 0.7) {
    return 'chaos_aura';  // ORANGE chaos
  }

  // PRIORITY 5: High resonance (frequency match)
  if (resonance > 0.6) {
    return 'resonance_aura';  // LIME resonance
  }

  // PRIORITY 6: Low quality (unreliable)
  if (quality < 40) {
    return 'corruption_aura';  // RED warning
  }

  // DEFAULT: Stable link
  return 'stability_aura';  // BLUE stable
}


// ============================================================================
// SNIPPET 4: LINK CREATION HOOK (Add to link creation method)
// ============================================================================

// In NodeLinkingSystem.createLink() or wherever links are created:
// Add this AFTER you've fully created and added the link object:

// Register link aura
if (this.linkAuraSystem) {
  this.linkAuraSystem.registerLink(newLink);
}


// ============================================================================
// SNIPPET 5: LINK REMOVAL HOOK (Add to link removal method)
// ============================================================================

// In NodeLinkingSystem.removeLink() or wherever links are destroyed:
// Add this BEFORE you fully delete the link object:

// Unregister link aura
if (this.linkAuraSystem) {
  this.linkAuraSystem.unregisterLink(linkToRemove);
}


// ============================================================================
// SNIPPET 6: RENDER LOOP UPDATE (Add to main game update)
// ============================================================================

// In AtomaGame.update(deltaTime) or main render loop:
// Add this call AFTER you update all other visual systems:

// Update link auras
if (this.linkAuraSystem) {
  this.linkAuraSystem.update(deltaTime);
}


// ============================================================================
// SNIPPET 7: CLEANUP ON DISPOSAL (Add to dispose method)
// ============================================================================

// In AtomaGame.dispose() or scene cleanup:
// Add this to properly clean up the aura system:

// Dispose link aura system
if (this.linkAuraSystem) {
  this.linkAuraSystem.dispose();
  this.linkAuraSystem = null;
}


// ============================================================================
// SNIPPET 8: OPTIONAL — DEBUG HELPER METHOD
// ============================================================================

/**
 * Debug helper: Print link aura statistics
 * Call: this.debugLinkAuras()
 */
debugLinkAuras() {
  if (!this.linkAuraSystem) {
    console.log('[DEBUG] LinkAuraSystem not initialized');
    return;
  }

  const stats = this.linkAuraSystem.stats;
  console.log('[DEBUG] Link Aura Statistics:', {
    linksTracked: stats.linksTracked,
    aurasMeshes: stats.aurasMeshes,
    frameTime: `${stats.frameTime.toFixed(2)}ms`,
    percentage: `${((stats.frameTime / 16.67) * 100).toFixed(1)}% of 60fps budget`
  });

  // Profile distribution
  const profileCounts = {};
  for (const instance of this.linkAuraSystem.auras.values()) {
    const pid = instance.profileId;
    profileCounts[pid] = (profileCounts[pid] || 0) + 1;
  }
  console.log('[DEBUG] Profile Distribution:', profileCounts);
}


// ============================================================================
// SNIPPET 9: OPTIONAL — FORCE PROFILE OVERRIDE (For testing)
// ============================================================================

/**
 * Force all links to use a specific aura profile
 * Useful for visual testing
 * Call: this.debugForceAuraProfile('corruption_aura')
 */
debugForceAuraProfile(profileId) {
  if (!this.linkAuraSystem) return;

  const forceResolver = (link) => profileId;
  this.linkAuraSystem.profileResolver = forceResolver;

  // Re-register all auras
  const linksCopy = Array.from(this.linkAuraSystem.auras.keys());
  for (const linkId of linksCopy) {
    const instance = this.linkAuraSystem.auras.get(linkId);
    if (instance) {
      instance.profileId = profileId;
    }
  }

  console.log(`[DEBUG] All auras forced to profile: ${profileId}`);
}


// ============================================================================
// SNIPPET 10: OPTIONAL — MANUAL AURA REFRESH
// ============================================================================

/**
 * Manually refresh all auras (useful after scene changes)
 * Call: this.refreshLinkAuras()
 */
refreshLinkAuras() {
  if (!this.linkAuraSystem) return;

  this.linkAuraSystem.refreshAll();
  console.log('[DEBUG] Link auras refreshed');
}


// ============================================================================
// SNIPPET 11: COMPLETE INTEGRATION EXAMPLE
// ============================================================================

/**
 * FULL EXAMPLE: Complete integration pattern
 * Shows how all snippets fit together
 */

class MyGameEngine {
  constructor(options) {
    // ... other initialization ...

    this.scene = new THREE.Scene();
    this.linkingSystem = new NodeLinkingSystem();
    this.fxPerformance = new FXPerformanceController();

    // SNIPPET 2: Initialize Link Aura System
    this.linkAuraSystem = new LinkAuraSystem_v1({
      scene: this.scene,
      linkManager: this.linkingSystem,
      fxPerformance: this.fxPerformance,
      profileResolver: this._resolveLinkAuraProfile.bind(this),
      debugEnabled: false
    });

    console.log('[Game] LinkAuraSystem initialized');
  }

  // SNIPPET 3: Profile resolver
  _resolveLinkAuraProfile(link) {
    const q = link.userData?.quality?.score ?? 50;
    const synergy = link.userData?.quality?.synergyNorm ?? 0.5;
    const corruption = link.userData?.metrics?.corruption ?? 0.0;

    if (corruption > 0.45) return 'corruption_aura';
    if (q > 80 && synergy > 0.6) return 'mythic_synergy_aura';
    if (synergy > 0.6) return 'synergy_aura';
    if (q < 40) return 'corruption_aura';

    return 'stability_aura';
  }

  createLink(nodeA, nodeB) {
    // Create link in linking system
    const link = this.linkingSystem.createLink(nodeA, nodeB);

    // SNIPPET 4: Register aura
    if (this.linkAuraSystem) {
      this.linkAuraSystem.registerLink(link);
    }

    return link;
  }

  removeLink(link) {
    // SNIPPET 5: Unregister aura (BEFORE destruction)
    if (this.linkAuraSystem) {
      this.linkAuraSystem.unregisterLink(link);
    }

    // Remove from linking system
    this.linkingSystem.removeLink(link);
  }

  update(deltaTime) {
    // ... update other systems ...

    // SNIPPET 6: Update auras
    if (this.linkAuraSystem) {
      this.linkAuraSystem.update(deltaTime);
    }
  }

  dispose() {
    // SNIPPET 7: Clean up aura system
    if (this.linkAuraSystem) {
      this.linkAuraSystem.dispose();
      this.linkAuraSystem = null;
    }

    // ... dispose other systems ...
  }

  // Debug helpers
  debugLinkAuras() { /* SNIPPET 8 */ }
  debugForceAuraProfile(profileId) { /* SNIPPET 9 */ }
  refreshLinkAuras() { /* SNIPPET 10 */ }
}


// ============================================================================
// SNIPPET 12: USAGE EXAMPLE
// ============================================================================

/*
// Create game engine
const game = new MyGameEngine();

// Create some nodes and links
const nodeA = game.createNode('A');
const nodeB = game.createNode('B');
const link = game.createLink(nodeA, nodeB);

// Aura appears immediately!
console.log('Link aura registered and visible');

// Debug
game.debugLinkAuras();
// Output:
// [DEBUG] Link Aura Statistics: {
//   linksTracked: 1,
//   aurasMeshes: 1,
//   frameTime: '0.23ms',
//   percentage: '1.4% of 60fps budget'
// }

// Test with forced profile
game.debugForceAuraProfile('corruption_aura');  // See red aura

// Normal operation
game.debugForceAuraProfile(null);  // Revert to normal

// Refresh if needed
game.refreshLinkAuras();

// Clean up
game.dispose();  // Properly disposes LinkAuraSystem
*/


// ============================================================================
// SNIPPET 13: SAFETY VERIFICATION CHECKLIST
// ============================================================================

/*
BEFORE DEPLOYING, VERIFY:

Code Integration:
  ☐ SNIPPET 1: Imports added to top of file
  ☐ SNIPPET 2: System created in constructor
  ☐ SNIPPET 3: Profile resolver implemented
  ☐ SNIPPET 4: registerLink() hook added
  ☐ SNIPPET 5: unregisterLink() hook added
  ☐ SNIPPET 6: update() called in render loop
  ☐ SNIPPET 7: dispose() called in cleanup

Testing:
  ☐ No console errors on startup
  ☐ Auras visible around active links
  ☐ Colors match profiles (cyan, blue, red, etc.)
  ☐ Auras pulse/animate smoothly
  ☐ Auras disappear when links removed
  ☐ Performance <1ms in DevTools
  ☐ LowFX mode reduces aura intensity
  ☐ No memory leaks on disposal

Safety:
  ☐ No main.js modifications needed
  ☐ No existing code deleted
  ☐ System fully reversible
  ☐ All data reads are defensive
  ☐ Proper resource cleanup
*/


// ============================================================================
// END OF INTEGRATION SNIPPETS
// ============================================================================

export default null;  // Export nothing, this is snippet documentation
