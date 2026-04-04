/**
 * SYNERGY HUD MAIN.JS INTEGRATION PATCH
 * 
 * Copy-paste additions for integrating SynergyTrendHUD1_0 into main.js
 * 
 * This file contains exact code snippets to add to your main.js
 * showing where and what to add for complete integration.
 */

// ═══════════════════════════════════════════════════════════════════════════
// PART 1: IMPORTS
// ═══════════════════════════════════════════════════════════════════════════
// 
// Add these imports to the top of main.js with other module imports
// (around line 50-100, depending on your file structure)

import { SynergyTrendHUD1_0, exposeSynergyTrendHUDConsoleAPI } from './SynergyTrendHUD1_0.js';

// Note: LinkHistoryTracker1_0 should already be imported:
// import { LinkHistoryTracker1_0, exposeHistoryTrackerConsoleAPI } from './LinkHistoryTracker1_0.js';


// ═══════════════════════════════════════════════════════════════════════════
// PART 2: INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════
//
// Add this initialization code in the main game setup function
// (typically where window.game.nodeLinker and window.linkHistoryTracker are initialized)
// Place this AFTER LinkHistoryTracker1_0 initialization

function initializeTracking() {
  // ... existing LinkHistoryTracker initialization ...
  // window.linkHistoryTracker = new LinkHistoryTracker1_0(...);
  // exposeHistoryTrackerConsoleAPI(window.linkHistoryTracker);
  
  // ─ NEW: Initialize Synergy Trend HUD ─
  if (!window.game || !window.game.nodeLinker || !window.game.scene) {
    console.warn('[ATOMA] Cannot initialize SynergyTrendHUD: game not ready');
    return;
  }
  
  if (!window.linkHistoryTracker) {
    console.warn('[ATOMA] Cannot initialize SynergyTrendHUD: LinkHistoryTracker not initialized');
    return;
  }
  
  // Initialize HUD
  window.synergyTrendHUD = new SynergyTrendHUD1_0(
    window.game.nodeLinker,
    window.game.scene
  );
  
  // Expose console API
  exposeSynergyTrendHUDConsoleAPI(window.synergyTrendHUD);
  
  console.log('[ATOMA] SynergyTrendHUD initialized');
}

// Call during game initialization:
initializeTracking();


// ═══════════════════════════════════════════════════════════════════════════
// PART 3: LINK SELECTION INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════
//
// Find where link selection happens in your code and add the HUD update.
// 
// This might be in:
// - NodeLinkingSystem.onLinkSelected()
// - A raycaster callback
// - A UI click handler
// - A selection manager
//
// Add this pattern wherever link selection occurs:

// EXAMPLE 1: If using NodeLinkingSystem events
if (window.game.nodeLinker && typeof window.game.nodeLinker.on === 'function') {
  window.game.nodeLinker.on('linkSelected', (link) => {
    // Update Synergy Trend HUD
    if (window.synergyTrendHUD && link) {
      window.synergyTrendHUD.onLinkSelected(link);
    }
  });
}

// EXAMPLE 2: If using a selection method in NodeLinkingSystem
// Modify the existing link selection method:
// 
// Before:
// selectLink(link) {
//   this.selectedLink = link;
//   // ... existing logic ...
// }
// 
// After:
// selectLink(link) {
//   this.selectedLink = link;
//   // ... existing logic ...
//   
//   // NEW: Update trend HUD
//   if (window.synergyTrendHUD) {
//     window.synergyTrendHUD.onLinkSelected(link);
//   }
// }

// EXAMPLE 3: If using raycaster/mouse events
// In your mouse event handler:
// 
// function handleMouseClick(event) {
//   const link = getSelectedLink(event); // Your existing logic
//   
//   if (link) {
//     // NEW: Show trend HUD
//     window.synergyTrendHUD?.onLinkSelected(link);
//   }
// }


// ═══════════════════════════════════════════════════════════════════════════
// PART 4: LINK HISTORY RECORDING INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════
//
// Ensure LinkHistoryTracker is recording samples.
// This should already be integrated from LinkHistoryTracker1_0 setup.
//
// It happens automatically in your synergy update cycle:
// 
// In NodeSynergyIntegration1_0 or ComputeSynergyScore2_0:
//   window.linkHistoryTracker.recordSample(
//     link,
//     synergyScore,
//     viabilityScore,
//     stabilityFactor
//   );
//
// The trend HUD will automatically display this data.


// ═══════════════════════════════════════════════════════════════════════════
// PART 5: CONSOLE API TESTING
// ═══════════════════════════════════════════════════════════════════════════
//
// Once integrated, test with these console commands:

// Check initialization
console.log(window.synergyTrendHUD);

// Toggle visibility
window.synergyTrendHUD.toggle();

// Show/hide
window.synergyTrendHUD.show();
window.synergyTrendHUD.hide();

// Get state
window.synergyTrendHUD.getState();

// Change refresh rate (ms)
window.synergyTrendHUD.setRefreshInterval(1000);

// Manually select a link (for testing)
const testLink = window.game.nodeLinker?.links?.[0];
if (testLink) {
  window.synergyTrendHUD.onLinkSelected(testLink);
}


// ═══════════════════════════════════════════════════════════════════════════
// PART 6: OPTIONAL - AUTO-SYNC WITH EXISTING HUDs
// ═══════════════════════════════════════════════════════════════════════════
//
// If you have other selection HUDs (like UISelectedHUD), sync with them:

// Find where UISelectedHUD updates on selection and add:
// 
// updateDisplay(node) {
//   // ... existing code ...
//   
//   // NEW: If this is showing a selected node's link, update trend HUD
//   if (window.synergyTrendHUD && this.selectedNode) {
//     // Get any link connected to this node
//     const link = window.game.nodeLinker?.getLinksForNode?.(this.selectedNode)?.[0];
//     if (link) {
//       window.synergyTrendHUD.onLinkSelected(link);
//     }
//   }
// }


// ═══════════════════════════════════════════════════════════════════════════
// PART 7: OPTIONAL - CUSTOM STYLING
// ═══════════════════════════════════════════════════════════════════════════
//
// If you want to customize colors or appearance:

function customizeHUD() {
  if (!window.synergyTrendHUD) return;
  
  // Override colors
  window.synergyTrendHUD.colors = {
    ...window.synergyTrendHUD.colors,
    rising: '#00FF00',      // Your green
    falling: '#FF0000',     // Your red
    stable: '#0088FF',      // Your blue
  };
  
  // Change refresh rate
  window.synergyTrendHUD.setRefreshInterval(1000);  // Update every 1 second
  
  // Show/hide based on user preference
  // window.synergyTrendHUD.show();
}

// Call after initialization if needed:
// customizeHUD();


// ═══════════════════════════════════════════════════════════════════════════
// PART 8: CLEANUP (if needed)
// ═══════════════════════════════════════════════════════════════════════════
//
// If reloading the scene or resetting, dispose of the HUD:

function cleanupTracking() {
  if (window.synergyTrendHUD) {
    window.synergyTrendHUD.dispose();
    window.synergyTrendHUD = null;
  }
  
  if (window.linkHistoryTracker) {
    // LinkHistoryTracker has clearAll() but no dispose
    window.linkHistoryTracker.clearAll();
  }
}

// Call before scene reload:
// cleanupTracking();


// ═══════════════════════════════════════════════════════════════════════════
// QUICK CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════
//
// ✓ Add import at top: SynergyTrendHUD1_0, exposeSynergyTrendHUDConsoleAPI
// ✓ Initialize SynergyTrendHUD after LinkHistoryTracker
// ✓ Call exposeSynergyTrendHUDConsoleAPI
// ✓ Hook into link selection: window.synergyTrendHUD.onLinkSelected(link)
// ✓ Test in console: window.synergyTrendHUD.getState()
// ✓ Verify HUD appears when link selected
// ✓ Verify trend indicators update
// ✓ Verify sparkline renders
// ✓ Check no performance impact (DevTools profiler)
//
// Total integration time: ~15 minutes


// ═══════════════════════════════════════════════════════════════════════════
// TYPICAL MAIN.JS STRUCTURE (REFERENCE)
// ═══════════════════════════════════════════════════════════════════════════
//
// Here's how a typical main.js integration looks after adding everything:

/*

// IMPORTS (top of file)
import * as THREE from 'three';
import { NodeLinkingSystem } from './NodeLinkingSystem.js';
import { LinkHistoryTracker1_0, exposeHistoryTrackerConsoleAPI } from './LinkHistoryTracker1_0.js';
import { SynergyTrendHUD1_0, exposeSynergyTrendHUDConsoleAPI } from './SynergyTrendHUD1_0.js';
// ... other imports ...

// INITIALIZATION (in setupGame or equivalent)
function setupGame() {
  // Create scene, camera, renderer...
  window.game = {
    scene: new THREE.Scene(),
    // ... etc ...
    nodeLinker: new NodeLinkingSystem(),
  };
  
  // Initialize tracking systems
  window.linkHistoryTracker = new LinkHistoryTracker1_0(
    window.game.nodeLinker,
    window.game.scene
  );
  exposeHistoryTrackerConsoleAPI(window.linkHistoryTracker);
  
  window.synergyTrendHUD = new SynergyTrendHUD1_0(
    window.game.nodeLinker,
    window.game.scene
  );
  exposeSynergyTrendHUDConsoleAPI(window.synergyTrendHUD);
  
  // Connect selection system
  setupSelectionHandling();
}

// SELECTION HANDLING (in NodeLinkingSystem or handler)
function setupSelectionHandling() {
  window.game.nodeLinker.on('linkSelected', (link) => {
    // Update HUD
    window.synergyTrendHUD.onLinkSelected(link);
  });
}

// ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);
  
  // Your existing rendering...
  
  // LinkHistoryTracker recording happens automatically from synergy system
  // SynergyTrendHUD updates automatically on 500ms interval
}

*/

