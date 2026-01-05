/**
 * MAIN.JS PATCH FOR LINK GLOW SYNERGY ENGINE 1.0
 * 
 * Copy-paste integration points for NodeLinkingSystem
 * Provides safe, non-invasive patches with clear location markers
 * 
 * ═══════════════════════════════════════════════════════════════
 * HOW TO USE THIS FILE:
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. Search for "PATCH LOCATION" markers in NodeLinkingSystem.js
 * 2. Find the corresponding location in THIS file
 * 3. Copy the code snippet and insert at that location
 * 4. OR use Find-Replace for automated patching (carefully!)
 * 
 * All patches are clearly marked with:
 * // [LinkGlowSynergyEngine] PATCH LOCATION X.X
 * 
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// PATCH 1.0: IMPORT AT TOP OF FILE
// ═══════════════════════════════════════════════════════════════
// LOCATION: NodeLinkingSystem.js, line ~1-10, with other imports
// Find: import { ... } from other files
// Add: This import

import { LinkGlowSynergyEngine1_0 } from './LinkGlowSynergyEngine1_0.js';

// Store reference globally for easy access
if (typeof window !== 'undefined') {
  window.LinkGlowEngine = LinkGlowSynergyEngine1_0;
}

// ═══════════════════════════════════════════════════════════════
// PATCH 1.1: INITIALIZE IN CONSTRUCTOR
// ═══════════════════════════════════════════════════════════════
// LOCATION: NodeLinkingSystem.js, constructor method
// Find: this.activeEffects = [];
// Add: After this.visuals = new NeonLinkVisuals(scene, camera);

// [LinkGlowSynergyEngine] Initialize glow engine
LinkGlowSynergyEngine1_0.init(this);

// ═══════════════════════════════════════════════════════════════
// PATCH 2.0: UPDATE GLOW ON LINK CREATION
// ═══════════════════════════════════════════════════════════════
// LOCATION: NodeLinkingSystem.js, createLink() method
// Find: this.links.push(link);
// Add: Right after, before any callbacks

// [LinkGlowSynergyEngine] Initialize glow for new link
if (link.synergyScore !== undefined && window.LinkGlowEngine) {
  window.LinkGlowEngine.updateLinkGlow(link);
}

// ═══════════════════════════════════════════════════════════════
// PATCH 3.0: MAIN UPDATE LOOP - REAL-TIME GLOW UPDATES
// ═══════════════════════════════════════════════════════════════
// LOCATION: NodeLinkingSystem.js, update() method
// Find: // Main animation loop for links
//        for (const link of this.links) {
// Add: Inside the loop, after main link updates

// [LinkGlowSynergyEngine] Update link glow based on synergy scores
if (link.active !== false && window.LinkGlowEngine) {
  window.LinkGlowEngine.updateLinkGlow(link);
}

// ═══════════════════════════════════════════════════════════════
// PATCH 3.1: SYNERGY UPDATE INTEGRATION
// ═══════════════════════════════════════════════════════════════
// LOCATION: NodeLinkingSystem.js, update() method
// Find: // Recompute synergy scores periodically
//        if ((frameCount % 120) === 0) {
// Add: After synergy score update

// [LinkGlowSynergyEngine] Trigger glow update on synergy change
if (newScore !== link.synergyScore && window.LinkGlowEngine) {
  link.synergyScore = newScore;
  window.LinkGlowEngine.updateLinkGlow(link);
}

// ═══════════════════════════════════════════════════════════════
// PATCH 4.0: UPDATE GLOW ON LINK REMOVAL
// ═══════════════════════════════════════════════════════════════
// LOCATION: NodeLinkingSystem.js, removeLink() method
// Find: this.links.splice(index, 1);
// Add: Right after link removal

// [LinkGlowSynergyEngine] Clean cache on link removal
if (window.LinkGlowEngine) {
  window.LinkGlowEngine.clearCache();
}

// ═══════════════════════════════════════════════════════════════
// PATCH 5.0: COMPLETE UPDATE LOOP EXAMPLE
// ═══════════════════════════════════════════════════════════════
// LOCATION: NodeLinkingSystem.js, update() method
// This shows how the update loop should look with glow integration
// USE AS REFERENCE for finding the right location

/*
update() {
  const frameCount = this.frameCounter || 0;
  const now = performance.now();

  // [...existing update code...]

  // Main link animation and glyph update loop
  for (const link of this.links) {
    if (!link || !link.active) continue;

    // [...existing link update code...]

    // [LinkGlowSynergyEngine] Update link glow based on synergy scores
    if (window.LinkGlowEngine) {
      window.LinkGlowEngine.updateLinkGlow(link);
    }
  }

  // [...rest of update method...]
}
*/

// ═══════════════════════════════════════════════════════════════
// PATCH 6.0: CLEAR GLOW CACHE ON WORLD RESET
// ═══════════════════════════════════════════════════════════════
// LOCATION: NodeLinkingSystem.js, dispose() or cleanup methods
// Find: // Clear links
//        this.links = [];
// Add: Before clearing links array

// [LinkGlowSynergyEngine] Clear glow cache on world reset
if (window.LinkGlowEngine) {
  window.LinkGlowEngine.clearCache();
}

// ═══════════════════════════════════════════════════════════════
// REFERENCE: WHERE SYNERGY SCORES ARE TYPICALLY SET
// ═══════════════════════════════════════════════════════════════
// These are common locations where synergy scores are computed:

// 1. In createLink() after link creation:
//    link.synergyScore = computeSynergyScore(link, systemsConfig);
//    window.LinkGlowEngine?.updateLinkGlow(link);

// 2. In update() loop - periodic recompute:
//    if ((frameCount % 120) === 0) {
//      for (const link of this.links) {
//        const newScore = computeSynergyScore(link);
//        if (newScore !== link.synergyScore) {
//          link.synergyScore = newScore;
//          window.LinkGlowEngine?.updateLinkGlow(link);
//        }
//      }
//    }

// 3. From external AI linking system:
//    linkingSystem.createLink(source, target);
//    const score = externalSystem.computeScore(link);
//    link.synergyScore = score;
//    window.LinkGlowEngine?.updateLinkGlow(link);

// ═══════════════════════════════════════════════════════════════
// MINIMAL INTEGRATION (COPY-PASTE READY)
// ═══════════════════════════════════════════════════════════════

/*
// Step 1: Add import at top of main.js or wherever NodeLinkingSystem is used:

import { LinkGlowSynergyEngine1_0 } from './LinkGlowSynergyEngine1_0.js';

// Step 2: After creating linkingSystem:

const linkingSystem = new NodeLinkingSystem(scene, camera, renderer, aiNodes);
LinkGlowSynergyEngine1_0.init(linkingSystem);
window.LinkGlowEngine = LinkGlowSynergyEngine1_0;

// Step 3: In your main render loop, call:

function animate() {
  requestAnimationFrame(animate);
  
  // Your normal updates...
  linkingSystem.update();
  
  // [Optional] Batch update glows if not already in LinkingSystem.update()
  // window.LinkGlowEngine?.updateAllLinks();
  
  renderer.render(scene, camera);
}
*/

// ═══════════════════════════════════════════════════════════════
// SAFE INTEGRATION TEST
// ═══════════════════════════════════════════════════════════════
// Run this in console to verify patches are applied correctly:

/*
function verifyGlowIntegration() {
  console.log('Verifying LinkGlowSynergyEngine integration...');
  
  const checks = {
    engineExists: !!window.LinkGlowEngine,
    initialized: !!window.LinkGlowEngine?.getConfig,
    linksPresent: linkingSystem?.links?.length > 0,
    scoresPresent: linkingSystem?.links?.some(l => l.synergyScore !== undefined)
  };
  
  console.table(checks);
  
  if (Object.values(checks).every(v => v)) {
    console.log('✓ Integration verified - ready to use!');
  } else {
    console.warn('⊘ Integration incomplete - check failed checks above');
  }
}

verifyGlowIntegration();
*/

// ═══════════════════════════════════════════════════════════════
// DEBUGGING AFTER INTEGRATION
// ═══════════════════════════════════════════════════════════════
// Use these commands to debug after patching:

/*
// 1. Enable debug logging
window.LinkGlowEngine.setDebug(true);

// 2. Test visual progression
window.LinkGlowEngine.forceScore(0.0);  // Blue
window.LinkGlowEngine.forceScore(0.5);  // Aqua
window.LinkGlowEngine.forceScore(1.0);  // White

// 3. Inspect a link
const link = linkingSystem.links[0];
console.log(window.LinkGlowEngine.inspect(link));

// 4. Check cache stats
console.log(window.LinkGlowEngine.getCacheStats());

// 5. Manually update a link
window.LinkGlowEngine.updateLinkGlow(link);

// 6. Clear force score
window.LinkGlowEngine.forceScore(null);

// 7. Disable debug
window.LinkGlowEngine.setDebug(false);
*/

// ═══════════════════════════════════════════════════════════════
// COMMON ISSUES & SOLUTIONS
// ═══════════════════════════════════════════════════════════════

/*
ISSUE: Links not glowing
SOLUTION:
1. Verify link.synergyScore is set: console.log(linkingSystem.links[0].synergyScore)
2. Check engine is initialized: console.log(window.LinkGlowEngine.getConfig())
3. Call update manually: window.LinkGlowEngine.updateLinkGlow(linkingSystem.links[0])

ISSUE: Glow disappears after creation
SOLUTION:
1. Verify update() loop includes glow update (PATCH 3.0)
2. Check that scores are being updated periodically
3. Look for link removal/re-creation that clears state

ISSUE: Performance degradation
SOLUTION:
1. Check cache stats: window.LinkGlowEngine.getCacheStats()
2. Verify threshold is working: only ~10% of updates should apply
3. Consider batch updates instead of per-frame

ISSUE: Colors not changing
SOLUTION:
1. Force score to test: window.LinkGlowEngine.forceScore(0.9)
2. Inspect materials: window.LinkGlowEngine.inspect(link).materials
3. Manually set color: link.coreLine.material.color.setHex(0xff0000)
*/

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE OPTIMIZATION TIPS
// ═══════════════════════════════════════════════════════════════

/*
// Option 1: Update every N frames instead of every frame
let updateFrame = 0;
const UPDATE_FREQUENCY = 2; // Every 2 frames

function update() {
  // ... existing code ...
  
  if (updateFrame++ % UPDATE_FREQUENCY === 0) {
    window.LinkGlowEngine?.updateAllLinks();
  }
}

// Option 2: Update only visible links
function updateVisibleGlows() {
  const visibleLinks = linkingSystem.links.filter(link => {
    return isLinkVisible(link, camera); // Your visibility check
  });
  
  visibleLinks.forEach(link => {
    window.LinkGlowEngine?.updateLinkGlow(link);
  });
}

// Option 3: Batch update with throttling
const glowUpdateQueue = [];

function queueGlowUpdate(link) {
  if (glowUpdateQueue.indexOf(link) === -1) {
    glowUpdateQueue.push(link);
  }
}

function processBatchGlowUpdates() {
  const BATCH_SIZE = 20;
  const batch = glowUpdateQueue.splice(0, BATCH_SIZE);
  
  batch.forEach(link => {
    window.LinkGlowEngine?.updateLinkGlow(link);
  });
}
*/

export {};
