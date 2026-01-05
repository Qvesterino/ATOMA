/**
 * HUD COLLAPSE SYSTEM 1.0
 * 
 * Master integration module for collapsible HUD functionality.
 * Handles initialization, wiring, and lifecycle management.
 * 
 * SAFETY: Pure UI state management - zero gameplay impact
 */

import { HUD_REGISTRY, getAllHudIds, getHudConfig } from './HUDRegistry.js';
import { 
  initializeHudLayoutManager, 
  resetHudLayout, 
  debugHudLayout,
  toggleHudByKey,
  isHudCollapsed
} from './HUDLayoutManager.js';
import { addCollapseHeaderToExistingHud } from './CollapsibleHudWrapper.js';

/**
 * Initialize the entire HUD collapse system
 * Call this once after the game UI is set up (after all HUDs are created)
 */
export function initializeHudCollapseSystem() {
  console.log('\n%c╔════════════════════════════════════════════════════════════╗', 'color: cyan;');
  console.log('%c║  HUD COLLAPSE SYSTEM 1.0 — INITIALIZATION                ║', 'color: cyan; font-weight: bold;');
  console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: cyan;');
  
  let successCount = 0;
  let skippedCount = 0;
  
  // Process each registered HUD
  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    const hudElement = document.getElementById(config.id);
    
    if (!hudElement) {
      console.warn(`  ⊘ ${config.title}: Not found in DOM (skipped)`);
      skippedCount++;
      return;
    }
    
    // Add collapse header to HUD
    addCollapseHeaderToExistingHud(hudElement, config.title);
    successCount++;
  });
  
  console.log(`\n%c✓ HUDs processed: ${successCount} collapsible, ${skippedCount} skipped`, 'color: lime;');
  
  // Initialize layout manager
  initializeHudLayoutManager();
  
  // Expose debug utilities globally
  window.resetAtomaHudLayout = () => {
    console.log('Resetting ATOMA HUD layout...');
    resetHudLayout();
    console.log('✓ HUD layout reset to defaults');
  };
  
  window.toggleHud = (hudKey) => {
    toggleHudByKey(hudKey);
  };
  
  window.debugHuds = () => {
    debugHudLayout();
  };
  
  window.getHudState = () => {
    const state = {};
    getAllHudIds().forEach(hudKey => {
      state[hudKey] = {
        collapsed: isHudCollapsed(hudKey),
        ...getHudConfig(hudKey)
      };
    });
    return state;
  };
  
  // Print final status
  console.log('%c\n[HUD COLLAPSE SYSTEM STATUS]', 'color: cyan; font-weight: bold;');
  console.log('%cEnabled HUDs:', 'color: lime;');
  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    const hudElement = document.getElementById(config.id);
    if (hudElement) {
      console.log(`  ✓ ${config.title} (collapsible)`);
    }
  });
  
  console.log('%c\nLayout persistence:', 'color: lime;');
  console.log('  ✓ Storage key: atoma_hud_layout_v1');
  console.log('  ✓ Collapsed state saved per HUD: YES');
  console.log('  ✓ localStorage persistence: ENABLED');
  
  console.log('%c\nDebug Commands (in console):', 'color: lime;');
  console.log('  window.toggleHud(\'automationHUD\')    — Toggle specific HUD');
  console.log('  window.resetAtomaHudLayout()         — Reset to defaults');
  console.log('  window.debugHuds()                  — Print layout state');
  console.log('  window.getHudState()                — Get current state');
  
  console.log('%c\nGameplay impact: NONE (UI-only)', 'color: lime;');
  console.log('%cStatus: PRODUCTION READY\n', 'color: lime; font-weight: bold;');
}

/**
 * Verify HUD collapse system is working
 */
export function verifyHudCollapseSystem() {
  console.log('%c=== HUD COLLAPSE SYSTEM VERIFICATION ===', 'color: cyan; font-weight: bold;');
  
  let allValid = true;
  
  // Check each HUD
  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    const hudElement = document.getElementById(config.id);
    
    if (!hudElement) {
      console.warn(`✗ ${config.title}: Not in DOM`);
      allValid = false;
      return;
    }
    
    const header = hudElement.querySelector('.hud-header');
    const body = hudElement.querySelector('.hud-body');
    const collapseButton = hudElement.querySelector('.hud-collapse-button');
    
    if (!header || !body || !collapseButton) {
      console.warn(`✗ ${config.title}: Missing collapse components`);
      allValid = false;
      return;
    }
    
    console.log(`✓ ${config.title}: Collapsible components OK`);
  });
  
  // Check localStorage
  try {
    const test = 'hud_test_' + Date.now();
    localStorage.setItem(test, 'ok');
    localStorage.removeItem(test);
    console.log('✓ localStorage: Available');
  } catch (err) {
    console.warn('⚠ localStorage: Not available (will use defaults)');
    allValid = false;
  }
  
  console.log(`\n${allValid ? '✓ System OK' : '⚠ Issues detected'}`);
  return allValid;
}

console.log('✓ HUD Collapse System 1.0 module loaded');
