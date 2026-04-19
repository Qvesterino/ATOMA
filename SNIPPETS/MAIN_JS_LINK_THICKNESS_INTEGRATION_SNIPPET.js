/**
 * main.js - Link Thickness Scaling Integration Snippet
 * 
 * Shows exact integration points for adding animated link thickness scaling
 * based on network load metrics.
 * 
 * Copy these sections into your main.js:
 */

// ============================================================================
// SECTION 1: ADD IMPORT AT TOP OF FILE
// ============================================================================

// ... existing imports ...

// ===INTEGRATION=== ADD THIS IMPORT (REMOVED - file moved to DELETE/cleanup)
// import { createLinkThicknessMetricsIntegration }
//   from './LinkThicknessMetricsIntegrationPatch_v1.js';

// ============================================================================
// SECTION 2: DECLARE GLOBAL REFERENCE (Near other globals)
// ============================================================================

// ... existing globals ...

// ===INTEGRATION=== ADD THIS VARIABLE
let linkThicknessIntegration = null;

// ============================================================================
// SECTION 3: INITIALIZE AFTER SYSTEMS ARE READY
// ============================================================================

/**
 * ===INTEGRATION=== Setup link thickness scaling
 * Called after CoreMetricsCalculator and LinkRenderer are initialized
 */
function setupLinkThicknessScaling() {
  // Verify CoreMetricsCalculator exists
  if (!coreMetricsCalculator) {
    console.warn('[LinkThickness] CoreMetricsCalculator not available, skipping thickness scaling');
    return;
  }
  
  // Get link materials from the scene
  let linkMaterials = null;
  
  // Option A: If LinkRenderer exposes materialsMap
  scene.traverse(child => {
    if (child.userData?.linkRendererMaterials) {
      linkMaterials = child.userData.linkRendererMaterials;
    }
  });
  
  // Option B: If materials are stored elsewhere
  if (!linkMaterials && window.__linkRenderer) {
    linkMaterials = window.__linkRenderer.materialsMap;
  }
  
  // Option C: Fallback - traverse and collect manually
  if (!linkMaterials) {
    linkMaterials = new Map();
    scene.traverse(child => {
      if (child.userData?.linkId && child.material) {
        linkMaterials.set(child.userData.linkId, child.material);
      }
    });
  }
  
  // If still no materials found
  if (!linkMaterials || linkMaterials.size === 0) {
    console.warn('[LinkThickness] No link materials found, skipping thickness scaling');
    return;
  }
  
  // Create the thickness scaling integration
  linkThicknessIntegration = createLinkThicknessMetricsIntegration({
    coreMetricsCalculator,
    linkMaterials,
    
    // Configuration options:
    baseLinewidth: 2.0,       // Base line thickness (default: 2.0)
    minMultiplier: 1.0,       // Minimum thickness at zero load (1x base)
    maxMultiplier: 3.0,       // Maximum thickness at max load (3x base)
    smoothingFactor: 0.1,     // Smoothing (0.05-0.25, higher = smoother)
    enableLogging: false      // Set to true for debug output
  });
  
  console.log(`[LinkThickness] ✅ Thickness scaling initialized with ${linkMaterials.size} links`);
}

// Call this function after initialization
// Example (add where you already initialize other systems):
// 
// setupLinkThicknessScaling();

// ============================================================================
// SECTION 4: UPDATE IN ANIMATION LOOP
// ============================================================================

// Find your main animate() function and add this code inside it

function animate(time) {
  requestAnimationFrame(animate);
  
  // ... existing animation code ...
  
  // Update CoreMetricsCalculator first (if you have it)
  if (coreMetricsCalculator) {
    coreMetricsCalculator.update(deltaTime, aiNodes, linkingSystem, ...);
  }
  
  // ===INTEGRATION=== UPDATE LINK THICKNESS SCALING
  // This reads current network load and scales link thickness
  if (linkThicknessIntegration && linkThicknessIntegration.isEnabled()) {
    linkThicknessIntegration.update();
  }
  
  // ... rest of animation code ...
  
  renderer.render(scene, camera);
}

// ============================================================================
// SECTION 5: OPTIONAL - HANDLE NEW LINKS
// ============================================================================

// When a new link is created in NodeLinkingSystem, call:

function onLinkCreated(linkId, material) {
  // Register the new material with thickness scaling
  if (linkThicknessIntegration && material) {
    linkThicknessIntegration.registerLinkMaterial(linkId, material);
  }
}

// ============================================================================
// SECTION 6: OPTIONAL - HANDLE DELETED LINKS
// ============================================================================

// When a link is deleted in NodeLinkingSystem, call:

function onLinkDeleted(linkId) {
  // Unregister the material
  if (linkThicknessIntegration) {
    linkThicknessIntegration.unregisterLinkMaterial(linkId);
  }
}

// ============================================================================
// SECTION 7: OPTIONAL - ADVANCED: PER-LINK CUSTOM THICKNESS
// ============================================================================

// To set custom thickness range for specific links:

function setLinkThicknessRange(linkId, minMultiplier, maxMultiplier) {
  if (linkThicknessIntegration) {
    linkThicknessIntegration.setLinkThicknessRange(
      linkId, 
      minMultiplier, 
      maxMultiplier
    );
  }
}

// Example usage:
// 
// // Make a critical link always prominent
// setLinkThicknessRange('critical-link-1', 2.0, 4.0);
// 
// // Make a background link subtle
// setLinkThicknessRange('background-link-1', 0.8, 1.5);

// ============================================================================
// COMPLETE INTEGRATION EXAMPLE
// ============================================================================

// Below is a complete example showing how all pieces fit together:

/*

// At top of main.js:
// import { createLinkThicknessMetricsIntegration }
//   from './LinkThicknessMetricsIntegrationPatch_v1.js'; // REMOVED - file moved to DELETE/cleanup

let linkThicknessIntegration = null;

// ... other code ...

function setupLinkThicknessScaling() {
  if (!coreMetricsCalculator) return;
  
  // Get materials (however you access them)
  const linkMaterials = new Map();
  scene.traverse(child => {
    if (child.userData?.linkId && child.material) {
      linkMaterials.set(child.userData.linkId, child.material);
    }
  });
  
  if (linkMaterials.size === 0) return;
  
  linkThicknessIntegration = createLinkThicknessMetricsIntegration({
    coreMetricsCalculator,
    linkMaterials,
    baseLinewidth: 2.0,
    minMultiplier: 1.0,
    maxMultiplier: 3.0,
    smoothingFactor: 0.1,
    enableLogging: false
  });
  
  console.log(`✅ Link thickness scaling ready (${linkMaterials.size} links)`);
}

function animate(time) {
  requestAnimationFrame(animate);
  
  // Update metrics
  if (coreMetricsCalculator) {
    coreMetricsCalculator.update(deltaTime, aiNodes, linkingSystem, ...);
  }
  
  // Update link thickness
  if (linkThicknessIntegration?.isEnabled()) {
    linkThicknessIntegration.update();
  }
  
  renderer.render(scene, camera);
}

// In setup function (after everything initialized):
setupLinkThicknessScaling();

// In animation loop (already shown above in animate())
// if (linkThicknessIntegration?.isEnabled()) {
//   linkThicknessIntegration.update();
// }

*/

// ============================================================================
// CONSOLE API (FOR TESTING/DEBUG)
// ============================================================================

// After integration is initialized, use these commands:

/*

// View current network load and thickness
window.__linkThicknessScaling.getLoad()         // 0-1
window.__linkThicknessScaling.getMultiplier()   // 1-3x

// View statistics
window.__linkThicknessScaling.getStats()

// Simulate different load scenarios for testing:
window.__linkThicknessScaling.testLight()       // Light load (20%)
window.__linkThicknessScaling.testModerate()    // Moderate (50%)
window.__linkThicknessScaling.testHeavy()       // Heavy (80%)
window.__linkThicknessScaling.testFull()        // Full load (100%)

// Reset to baseline (1x thickness)
window.__linkThicknessScaling.reset()

// Control scaling
window.__linkThicknessScaling.enable()          // Turn on
window.__linkThicknessScaling.disable()         // Turn off

// Get help
window.__linkThicknessScaling.help()

*/

// ============================================================================
// VERIFICATION
// ============================================================================

// After integration, verify it's working:

function verifyLinkThicknessScaling() {
  console.group('Link Thickness Scaling Verification');
  
  // Check if initialized
  console.log('Initialized:', linkThicknessIntegration !== null);
  console.log('Enabled:', linkThicknessIntegration?.isEnabled());
  
  // Check current state
  console.log('Current load:', linkThicknessIntegration?.getLoad());
  console.log('Current multiplier:', linkThicknessIntegration?.getThicknessMultiplier());
  
  // Check stats
  const stats = linkThicknessIntegration?.getStats();
  console.log('Statistics:', stats);
  
  // Test console API
  if (window.__linkThicknessScaling) {
    console.log('Console API available: YES');
    console.log('Available commands:');
    console.log('  - testLight(), testModerate(), testHeavy(), testFull()');
    console.log('  - getLoad(), getMultiplier(), getStats()');
    console.log('  - enable(), disable(), reset()');
    console.log('  - help()');
  } else {
    console.warn('Console API not available');
  }
  
  console.groupEnd();
}

// Call to verify: verifyLinkThicknessScaling()

// ============================================================================
// CONFIGURATION EXAMPLES
// ============================================================================

/*

// Subtle effect (minimal thickness variation)
const thickness = createLinkThicknessMetricsIntegration({
  coreMetricsCalculator,
  linkMaterials,
  minMultiplier: 0.9,
  maxMultiplier: 1.5,
  smoothingFactor: 0.15
});

// Dramatic effect (maximum thickness variation)
const thickness = createLinkThicknessMetricsIntegration({
  coreMetricsCalculator,
  linkMaterials,
  minMultiplier: 1.0,
  maxMultiplier: 4.0,
  smoothingFactor: 0.1
});

// Responsive (fast updates, jittery)
const thickness = createLinkThicknessMetricsIntegration({
  coreMetricsCalculator,
  linkMaterials,
  smoothingFactor: 0.05  // Very responsive
});

// Smooth (slow updates, fluid)
const thickness = createLinkThicknessMetricsIntegration({
  coreMetricsCalculator,
  linkMaterials,
  smoothingFactor: 0.2   // Very smooth
});

// Bold lines
const thickness = createLinkThicknessMetricsIntegration({
  coreMetricsCalculator,
  linkMaterials,
  baseLinewidth: 3.0    // Thicker base (was 2.0)
});

// Thin lines
const thickness = createLinkThicknessMetricsIntegration({
  coreMetricsCalculator,
  linkMaterials,
  baseLinewidth: 1.0    // Thinner base (was 2.0)
});

*/

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*

Q: Links not changing thickness?
A: 1. Check CoreMetricsCalculator has data: console.log(coreMetricsCalculator.getMetrics())
   2. Check integration enabled: window.__linkThicknessScaling.enable()
   3. Try manual test: window.__linkThicknessScaling.testHeavy()

Q: Thickness changes too smooth/slow?
A: Reduce smoothingFactor: linkThicknessIntegration.thicknessScaler.smoothingFactor = 0.05

Q: Thickness changes too jittery?
A: Increase smoothingFactor: linkThicknessIntegration.thicknessScaler.smoothingFactor = 0.2

Q: Effect too extreme/subtle?
A: Adjust multiplier range:
   - More dramatic: minMultiplier: 0.8, maxMultiplier: 4.0
   - More subtle: minMultiplier: 0.95, maxMultiplier: 1.5

Q: Performance issue?
A: 1. Check stats: window.__linkThicknessScaling.getStats()
   2. If averageUpdateTime > 1ms, disable: linkThicknessIntegration.setEnabled(false)
   3. Or reduce smoothingFactor to update less frequently

*/

// ============================================================================
// END OF SNIPPET
// ============================================================================

export { setupLinkThicknessScaling };
