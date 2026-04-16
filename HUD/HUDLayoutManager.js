/**
 * HUD LAYOUT MANAGER 2.0
 * 
 * Manages collapsible state, layout persistence, and HUD visibility.
 * Integrates with HUDLayerManager for layer-based visibility rules.
 * Handles localStorage save/load and provides debug utilities.
 * 
 * LAYER AWARENESS:
 * - Checks HUDLayerManager.shouldHudBeVisible() before showing any HUD
 * - Collapse state is independent of layer visibility
 * - Layer visibility is the primary gate, collapse is secondary
 * 
 * SAFETY: Pure UI state management - zero gameplay impact
 */

import { HUD_REGISTRY, getAllHudIds, getHudConfig, getHudKeyByDomId } from './HUDRegistry.js';
import { shouldHudBeVisible, applyLayout } from './HUDLayerManager.js';

const HUD_LAYOUT_STORAGE_KEY = 'atoma_hud_layout_v1';

/**
 * In-memory layout state
 */
let hudLayoutState = {};

/**
 * Cache of HUD toggle callbacks (for cleanup)
 */
let hudToggleCallbacks = {};

/**
 * Initialize HUD Layout Manager
 * Load saved state from localStorage and set up event listeners
 */
export function initializeHudLayoutManager() {
  // Load saved state from localStorage
  loadHudLayout();
  
  // Apply loaded state to existing HUDs
  applyHudLayout();
  
  // Set up toggle listeners on all HUDs
  setupHudToggleListeners();
  
  console.log('✓ HUD Layout Manager 2.0 initialized');
  console.log('  - Loaded saved layout state');
  console.log('  - Registered toggle listeners');
  console.log('  - Layout persistence enabled');
  console.log('  - Layer-aware visibility active');
}

/**
 * Load HUD layout from localStorage
 * @private
 */
function loadHudLayout() {
  try {
    const stored = localStorage.getItem(HUD_LAYOUT_STORAGE_KEY);
    
    if (stored) {
      const parsed = JSON.parse(stored);
      hudLayoutState = parsed;
      console.log('✓ HUD layout loaded from localStorage');
    } else {
      initializeDefaultLayout();
      console.log('✓ HUD layout initialized with defaults');
    }
  } catch (err) {
    console.warn('⚠ Failed to load HUD layout, using defaults:', err.message);
    initializeDefaultLayout();
  }
}

/**
 * Initialize default layout state
 * @private
 */
function initializeDefaultLayout() {
  hudLayoutState = {};
  
  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    hudLayoutState[config.id] = {
      collapsed: config.defaultCollapsed
    };
  });
}

/**
 * Apply loaded layout to existing HUD elements in DOM.
 * Respects layer visibility as the primary gate.
 * @private
 */
function applyHudLayout() {
  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    if (config.collapsible === false) return; // Skip non-collapsible HUDs
    const hudElement = document.getElementById(config.id);
    
    if (!hudElement) return;
    
    // Apply collapse state
    const state = hudLayoutState[config.id];
    if (state && state.collapsed !== undefined) {
      setHudCollapsed(hudElement, state.collapsed);
    }
  });

  // Apply layer-based visibility (primary gate)
  applyLayout();
}

/**
 * Set up toggle listeners on all HUD collapse buttons
 * @private
 */
function setupHudToggleListeners() {
  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    if (config.collapsible === false) return; // Skip non-collapsible HUDs
    const hudElement = document.getElementById(config.id);
    
    if (!hudElement) return;
    
    hudElement.setAttribute('data-hud-key', hudKey);
    
    const collapseButton = hudElement.querySelector('.hud-collapse-button');
    if (!collapseButton) return;
    
    const callback = (e) => {
      e.stopPropagation();
      toggleHudByKey(hudKey);
    };
    
    collapseButton.addEventListener('click', callback);
    hudToggleCallbacks[config.id] = callback;
  });
}

/**
 * Toggle HUD collapsed state by registry key
 * @param {string} hudKey - Registry key (e.g., 'automationHUD')
 */
export function toggleHudByKey(hudKey) {
  const config = getHudConfig(hudKey);
  if (!config) {
    console.warn(`⚠ Unknown HUD key: ${hudKey}`);
    return;
  }
  
  const domId = config.id;
  const hudElement = document.getElementById(domId);
  
  if (!hudElement) {
    console.warn(`⚠ HUD element not found: ${domId}`);
    return;
  }
  
  const currentState = hudLayoutState[domId];
  const isCurrentlyCollapsed = currentState ? currentState.collapsed : config.defaultCollapsed;
  
  const newCollapsed = !isCurrentlyCollapsed;
  
  hudLayoutState[domId] = { collapsed: newCollapsed };
  
  setHudCollapsed(hudElement, newCollapsed);
  
  saveHudLayout();
  
  console.log(`✓ HUD toggled: ${config.title} → ${newCollapsed ? 'collapsed' : 'expanded'}`);
}

/**
 * Toggle HUD collapsed state by DOM element ID
 * @param {string} domId - DOM element ID
 */
export function toggleHudByDomId(domId) {
  const hudKey = getHudKeyByDomId(domId);
  if (hudKey) {
    toggleHudByKey(hudKey);
  }
}

/**
 * Set HUD collapsed/expanded state
 * @param {HTMLElement} hudElement - HUD root element
 * @param {boolean} collapsed - Whether to collapse
 * @private
 */
function setHudCollapsed(hudElement, collapsed) {
  const body = hudElement.querySelector('.hud-body');
  
  if (!body) return;
  
  if (collapsed) {
    body.style.display = 'none';
    hudElement.classList.add('hud-collapsed');
    
    const collapseButton = hudElement.querySelector('.hud-collapse-button');
    if (collapseButton) {
      collapseButton.setAttribute('aria-expanded', 'false');
      collapseButton.textContent = '▼';
    }
  } else {
    body.style.display = '';
    hudElement.classList.remove('hud-collapsed');
    
    const collapseButton = hudElement.querySelector('.hud-collapse-button');
    if (collapseButton) {
      collapseButton.setAttribute('aria-expanded', 'true');
      collapseButton.textContent = '▲';
    }
  }
}

/**
 * Save HUD layout to localStorage
 * @private
 */
function saveHudLayout() {
  try {
    const json = JSON.stringify(hudLayoutState);
    localStorage.setItem(HUD_LAYOUT_STORAGE_KEY, json);
  } catch (err) {
    console.warn('⚠ Failed to save HUD layout to localStorage:', err.message);
  }
}

/**
 * Reset all HUD layouts to defaults
 */
export function resetHudLayout() {
  try {
    localStorage.removeItem(HUD_LAYOUT_STORAGE_KEY);
    console.log('✓ HUD layout storage cleared');
  } catch (err) {
    console.warn('⚠ Failed to clear HUD layout storage:', err.message);
  }
  
  initializeDefaultLayout();
  applyHudLayout();
  
  console.log('✓ All HUDs reset to default layout');
}

/**
 * Get current HUD layout state
 * @returns {Object} Current layout state
 */
export function getHudLayoutState() {
  return { ...hudLayoutState };
}

/**
 * Get visibility state for specific HUD
 * @param {string} hudKey - Registry key
 * @returns {boolean} Whether HUD is collapsed
 */
export function isHudCollapsed(hudKey) {
  const config = getHudConfig(hudKey);
  if (!config) return false;
  
  const state = hudLayoutState[config.id];
  return state ? state.collapsed : config.defaultCollapsed;
}

/**
 * Set HUD collapsed state programmatically
 * @param {string} hudKey - Registry key
 * @param {boolean} collapsed - Whether to collapse
 */
export function setHudCollapsedByKey(hudKey, collapsed) {
  const config = getHudConfig(hudKey);
  if (!config) {
    console.warn(`⚠ Unknown HUD key: ${hudKey}`);
    return;
  }
  
  const hudElement = document.getElementById(config.id);
  if (!hudElement) {
    console.warn(`⚠ HUD element not found: ${config.id}`);
    return;
  }
  
  hudLayoutState[config.id] = { collapsed };
  setHudCollapsed(hudElement, collapsed);
  saveHudLayout();
}

/**
 * Debug: Print current layout state
 */
export function debugHudLayout() {
  console.log('%c=== HUD LAYOUT STATE ===', 'color: cyan; font-weight: bold;');
  console.log('Storage key:', HUD_LAYOUT_STORAGE_KEY);
  console.log('Current state:', getHudLayoutState());
  
  console.log('%cRegistered HUDs:', 'color: cyan; font-weight: bold;');
  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    const collapsed = isHudCollapsed(hudKey);
    const layerVisible = shouldHudBeVisible(hudKey);
    console.log(`  ${hudKey}: ${collapsed ? '[COLLAPSED]' : '[EXPANDED]'} layer=${layerVisible ? 'VISIBLE' : 'HIDDEN'} (${config.layer})`);
  });
}

console.log('✓ HUD Layout Manager 2.0 module loaded');
