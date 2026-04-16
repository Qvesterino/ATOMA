/**
 * HUD COLLAPSE SYSTEM 2.0
 * 
 * Master integration module for collapsible HUD functionality.
 * Handles initialization, wiring, and lifecycle management.
 * Integrates with HUDLayerManager for layer-based visibility.
 * 
 * SAFETY: Pure UI state management - zero gameplay impact
 */

import { HUD_REGISTRY, getAllHudIds, getHudConfig, getHudElement } from './HUDRegistry.js';
import { 
  initializeHudLayoutManager, 
  resetHudLayout, 
  debugHudLayout,
  toggleHudByKey,
  isHudCollapsed
} from './HUDLayoutManager.js';
import { initializeHUDLayerManager, debugLayerState } from './HUDLayerManager.js';
import { initializeDeveloperToggle } from './DeveloperToggle.js';
import { initializeHudDragManager } from './HUDDragManager.js';
import { addCollapseHeaderToExistingHud } from './CollapsibleHudWrapper.js';

/**
 * Initialize the entire HUD collapse system.
 * Call this once after the game UI is set up (after all HUDs are created).
 */
export function initializeHudCollapseSystem() {
  console.log('\n%c╔════════════════════════════════════════════════════════════╗', 'color: cyan;');
  console.log('%c║  HUD SYSTEM 2.0 — CONSOLIDATED COMMAND CENTER            ║', 'color: cyan; font-weight: bold;');
  console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: cyan;');
  
  let successCount = 0;
  let skippedCount = 0;
  
  // Process each registered HUD
  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    const hudElement = getHudElement(hudKey);
    
    if (!hudElement) {
      console.warn(`  ⊘ ${config.title}: Not found in DOM (skipped)`);
      skippedCount++;
      return;
    }

    // Skip HUDs that explicitly disable collapse (e.g., compact panels)
    if (config.collapsible === false) {
      console.log(`  ⊘ ${config.title}: Non-collapsible (skipped)`);
      skippedCount++;
      return;
    }
    
    // Add collapse header to HUD
    addCollapseHeaderToExistingHud(hudElement, config.title);
    successCount++;
  });
  
  console.log(`\n%c✓ HUDs processed: ${successCount} collapsible, ${skippedCount} skipped`, 'color: lime;');
  
  // Initialize layer manager (visibility rules)
  initializeHUDLayerManager();
  
  // Initialize layout manager (collapse state)
  initializeHudLayoutManager();
  
  // Initialize developer toggle (F4 key)
  initializeDeveloperToggle();
  
  // Initialize drag-to-reposition system (F3 to unlock)
  initializeHudDragManager();
  
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
    debugLayerState();
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
  console.log('%c\n[HUD SYSTEM 2.0 STATUS]', 'color: cyan; font-weight: bold;');
  console.log('%cLayer Architecture:', 'color: lime;');
  console.log('  PLAYER_CRITICAL — Always visible during gameplay');
  console.log('  CONTEXTUAL_INSPECT — Visible on interaction');
  console.log('  DEBUG_AUTHORING — F4 developer toggle only');
  
  console.log('%c\nLayout persistence:', 'color: lime;');
  console.log('  ✓ Storage key: atoma_hud_layout_v1');
  console.log('  ✓ Collapsed state saved per HUD: YES');
  console.log('  ✓ Developer mode saved: YES');
  console.log('  ✓ localStorage persistence: ENABLED');
  
  console.log('%c\nControls:', 'color: lime;');
  console.log('  F3 — Toggle layout edit mode (drag to reposition)');
  console.log('  F4 — Toggle developer mode (show/hide debug HUDs)');
  console.log('%c\nConsole Commands:', 'color: lime;');
  console.log('  window.toggleHud(\'automationHUD\')    — Toggle specific HUD');
  console.log('  window.resetAtomaHudLayout()         — Reset collapse state');
  console.log('  window.resetHudPositions()           — Reset positions to defaults');
  console.log('  window.saveHudPositions()            — Save current positions');
  console.log('  window.toggleLayoutLock()            — Lock/unlock layout editing');
  console.log('  window.getHudPositions()             — Show all HUD positions');
  console.log('  window.debugHuds()                   — Print layout + layer state');
  console.log('  window.getHudState()                 — Get current state');
  console.log('  window.devMode.toggle()              — Toggle developer mode');
  console.log('  window.devMode.status()              — Full layer debug info');
  
  console.log('%c\nGameplay impact: NONE (UI-only)', 'color: lime;');
  console.log('%cStatus: PRODUCTION READY\n', 'color: lime; font-weight: bold;');
}

/**
 * Verify HUD collapse system is working
 */
export function verifyHudCollapseSystem() {
  console.log('%c=== HUD SYSTEM 2.0 VERIFICATION ===', 'color: cyan; font-weight: bold;');
  
  let allValid = true;
  
  // Check each HUD
  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    const hudElement = getHudElement(hudKey);
    
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
    
    console.log(`✓ ${config.title}: layer=${config.layer} collapsible=OK`);
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

console.log('✓ HUD Collapse System 2.0 module loaded');
