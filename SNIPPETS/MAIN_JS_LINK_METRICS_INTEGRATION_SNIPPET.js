/**
 * main.js - Link Shader Metrics Integration Snippet
 * 
 * This shows the exact integration points for adding network state metrics
 * to the link renderer shader uniforms.
 * 
 * Find these sections in your main.js and add the integration code.
 * The changes are marked with ===INTEGRATION=== comments.
 */

// ============================================================================
// SECTION 1: ADD IMPORT AT TOP OF FILE
// ============================================================================

// ... existing imports ...

// ===INTEGRATION=== ADD THIS IMPORT
import { createLinkRendererMetricsIntegration } 
  from './LinkRendererMetricsIntegrationPatch_v1.js';

// ============================================================================
// SECTION 2: DECLARE GLOBAL REFERENCE (Near other globals)
// ============================================================================

// ... existing globals ...

// ===INTEGRATION=== ADD THIS VARIABLE
let linkMetricsIntegration = null;

// ============================================================================
// SECTION 3: INITIALIZE AFTER SYSTEMS ARE READY
// ============================================================================

// Find where CoreMetricsCalculator is created/initialized
// Then add this function and call it after both CoreMetricsCalculator 
// and LinkRenderer are set up

/**
 * ===INTEGRATION=== Setup link shader metrics integration
 * Called after CoreMetricsCalculator and LinkRenderer are initialized
 */
function setupLinkShaderMetricsIntegration() {
  // Verify CoreMetricsCalculator exists
  if (!coreMetricsCalculator) {
    console.warn('[LinkShaderMetrics] CoreMetricsCalculator not available, skipping metrics integration');
    return;
  }
  
  // Get link materials from the scene
  // This assumes LinkRenderer has exposed materialsMap, or we traverse to find them
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
      if (child.userData?.linkId && child.material instanceof THREE.ShaderMaterial) {
        linkMaterials.set(child.userData.linkId, child.material);
      }
    });
  }
  
  // If still no materials found
  if (!linkMaterials || linkMaterials.size === 0) {
    console.warn('[LinkShaderMetrics] No link materials found, skipping metrics integration');
    return;
  }
  
  // Create the integration
  linkMetricsIntegration = createLinkRendererMetricsIntegration({
    coreMetricsCalculator,
    linkMaterials,
    smoothingFactor: 0.15,     // Tune this (0.1-0.3 typical)
    enableLogging: false       // Set to true for debug output
  });
  
  console.log(`[LinkShaderMetrics] ✅ Integration initialized with ${linkMaterials.size} link materials`);
}

// Call this function after initialization
// Example (add where you already initialize other systems):
// 
// setupLinkShaderMetricsIntegration();

// ============================================================================
// SECTION 4: UPDATE IN ANIMATION LOOP
// ============================================================================

// Find your main animate() function and add this code inside it

function animate(time) {
  requestAnimationFrame(animate);
  
  // ... existing animation code ...
  
  // ===INTEGRATION=== UPDATE LINK SHADER METRICS
  // This reads current network state and applies to link shader uniforms
  if (linkMetricsIntegration && linkMetricsIntegration.isEnabled()) {
    linkMetricsIntegration.update();
  }
  
  // ... rest of animation code ...
  
  renderer.render(scene, camera);
}

// ============================================================================
// SECTION 5: OPTIONAL - HANDLE NEW LINKS
// ============================================================================

// When a new link is created in NodeLinkingSystem, call:

function onLinkCreated(linkId, material) {
  // Register the new material with metrics integration
  if (linkMetricsIntegration && material instanceof THREE.ShaderMaterial) {
    linkMetricsIntegration.registerLinkMaterial(linkId, material);
  }
}

// ============================================================================
// SECTION 6: OPTIONAL - HANDLE DELETED LINKS
// ============================================================================

// When a link is deleted in NodeLinkingSystem, call:

function onLinkDeleted(linkId) {
  // Unregister the material
  if (linkMetricsIntegration) {
    linkMetricsIntegration.unregisterLinkMaterial(linkId);
  }
}

// ============================================================================
// COMPLETE INTEGRATION EXAMPLE
// ============================================================================

// Below is a complete example showing how all pieces fit together:

/*

// At top of main.js:
import { createLinkRendererMetricsIntegration } 
  from './LinkRendererMetricsIntegrationPatch_v1.js';

let linkMetricsIntegration = null;

// ... other code ...

function setupLinkShaderMetricsIntegration() {
  if (!coreMetricsCalculator) return;
  
  // Get materials (however you access them)
  const linkMaterials = new Map();
  scene.traverse(child => {
    if (child.userData?.linkId && child.material) {
      linkMaterials.set(child.userData.linkId, child.material);
    }
  });
  
  if (linkMaterials.size === 0) return;
  
  linkMetricsIntegration = createLinkRendererMetricsIntegration({
    coreMetricsCalculator,
    linkMaterials,
    smoothingFactor: 0.15,
    enableLogging: false
  });
  
  console.log(`✅ Link metrics integration ready (${linkMaterials.size} links)`);
}

function animate(time) {
  requestAnimationFrame(animate);
  
  // Update metrics
  if (coreMetricsCalculator) {
    coreMetricsCalculator.update(deltaTime, aiNodes, linkingSystem, ...);
  }
  
  // Apply metrics to links
  if (linkMetricsIntegration?.isEnabled()) {
    linkMetricsIntegration.update();
  }
  
  renderer.render(scene, camera);
}

// In setup function (after everything initialized):
setupLinkShaderMetricsIntegration();

// In animation loop (already shown above in animate())
// if (linkMetricsIntegration?.isEnabled()) {
//   linkMetricsIntegration.update();
// }

*/

// ============================================================================
// CONSOLE API (FOR TESTING/DEBUG)
// ============================================================================

// After integration is initialized, use these commands:

/*

// View current network metrics
window.__linkShaderMetrics.getMetrics()
// Returns: {load: 0.3, stress: 0.0, corruption: 0.0, ...}

// View as raw 0-100 scale
window.__linkShaderMetrics.getRawMetrics()

// Simulate scenarios for testing:
window.__linkShaderMetrics.testCorruption(0.8)   // High corruption
window.__linkShaderMetrics.testStress(0.6)       // High stress
window.__linkShaderMetrics.testLoad(0.9)         // High load
window.__linkShaderMetrics.applyToAll()          // Apply immediately

// Reset to stable
window.__linkShaderMetrics.reset()
window.__linkShaderMetrics.applyToAll()

// Get stats
window.__linkShaderMetrics.getStats()

// Help
window.__linkShaderMetrics.help()

*/

// ============================================================================
// VERIFICATION
// ============================================================================

// After integration, verify it's working:

function verifyLinkMetricsIntegration() {
  console.group('Link Shader Metrics Integration Verification');
  
  // Check if initialized
  console.log('Initialized:', linkMetricsIntegration !== null);
  console.log('Enabled:', linkMetricsIntegration?.isEnabled());
  
  // Check metrics
  const metrics = linkMetricsIntegration?.getMetrics();
  console.log('Current Metrics:', metrics);
  
  // Check stats
  const stats = linkMetricsIntegration?.getStats();
  console.log('Statistics:', stats);
  
  // Test a scenario
  if (window.__linkShaderMetrics) {
    console.log('Console API available: YES');
    console.log('Available commands:');
    console.log('  - testCorruption(0-1)');
    console.log('  - testStress(0-1)');
    console.log('  - testLoad(0-1)');
    console.log('  - getMetrics()');
    console.log('  - reset()');
    console.log('  - help()');
  } else {
    console.warn('Console API not available');
  }
  
  console.groupEnd();
}

// Call to verify: verifyLinkMetricsIntegration()

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*

Q: Links not changing colors with network state?
A: 1. Check CoreMetricsCalculator has data: console.log(coreMetricsCalculator.getMetrics())
   2. Check integration is enabled: window.__linkShaderMetrics.isEnabled()
   3. Try manual test: window.__linkShaderMetrics.testCorruption(0.8)

Q: Integration not initializing?
A: 1. Verify CoreMetricsCalculator exists: console.log(coreMetricsCalculator)
   2. Verify linkMaterials found: The setupLinkShaderMetricsIntegration() should log count
   3. Check console for errors

Q: Performance issue?
A: 1. Check stats: window.__linkShaderMetrics.getStats()
   2. Reduce smoothingFactor (default 0.15)
   3. Disable if not needed: linkMetricsIntegration.setEnabled(false)

Q: Colors too vibrant/dim?
A: Adjust shader uniform colors in LinkRenderer.ts createLinkShaderMaterial():
   - uColorA (stable): new THREE.Color(0x00ddff)
   - uColorB (stress): new THREE.Color(0xff6b35)
   - uColorC (corruption): new THREE.Color(0xff1744)

*/

// ============================================================================
// END OF SNIPPET
// ============================================================================

export { setupLinkShaderMetricsIntegration };
