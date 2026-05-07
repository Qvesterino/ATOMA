/**
 * HUD LAYER MANAGER 2.0
 * 
 * Single layout owner for ATOMA HUD system.
 * Manages layer-based visibility, priority stacking, and developer mode.
 * 
 * LAYER MODEL:
 * - PLAYER_CRITICAL: Always visible. Core game state.
 * - CONTEXTUAL_INSPECT: Visible on interaction, auto-fades when stale.
 * - DEBUG_AUTHORING: Internal/debug layer. Per-HUD policy decides whether dev mode is required.
 * 
 * RESPONSIBILITIES:
 * - Enforce layer visibility rules
 * - Manage developer mode toggle
 * - Provide single applyLayout() call for all HUDs
 * - Reduce simultaneous visible panels during normal play
 * 
 * SAFETY: Pure UI state management — zero gameplay impact
 */

import {
  HUD_REGISTRY,
  HUD_LAYER,
  LAYER_DEFAULTS,
  getAllHudIds,
  getHudConfig,
  getHudKeyByDomId,
  getHudsByLayer,
  requiresDevMode,
  getHudElement
} from './HUDRegistry.js';
import { UIVisibilityConfig, dispatchUIVisibilityChange } from '../ui/config/UIVisibilityConfig.js';

const DEV_MODE_STORAGE_KEY = 'atoma.hud.developerMode';

/** @type {boolean} Current developer mode state */
let _developerMode = false;

/** @type {Set<string>} HUD keys explicitly hidden by player */
let _playerHidden = new Set();

/** @type {Set<string>} HUD keys temporarily shown (contextual) */
let _contextualVisible = new Set();

/** @type {Map<string, Function>} Layer change subscribers */
let _subscribers = new Map();

let _subscriberIdCounter = 0;

// ── INITIALIZATION ──────────────────────────────────────────────────

/**
 * Initialize HUD Layer Manager.
 * Loads developer mode preference and applies initial layout.
 */
export function initializeHUDLayerManager() {
  loadDeveloperMode();
  applyLayout();

  console.log('✓ HUD Layer Manager 2.0 initialized');
  console.log(`  Developer mode: ${_developerMode ? 'ON' : 'OFF'}`);
  console.log(`  Player-critical HUDs: ${getHudsByLayer(HUD_LAYER.PLAYER_CRITICAL).length}`);
  console.log(`  Contextual HUDs: ${getHudsByLayer(HUD_LAYER.CONTEXTUAL_INSPECT).length}`);
  console.log(`  Debug HUDs: ${getHudsByLayer(HUD_LAYER.DEBUG_AUTHORING).length}`);
}

// ── DEVELOPER MODE ──────────────────────────────────────────────────

/**
 * Get current developer mode state.
 * @returns {boolean}
 */
export function isDeveloperMode() {
  return _developerMode;
}

/**
 * Toggle developer mode on/off.
 * Persists preference to localStorage and re-applies layout.
 */
export function toggleDeveloperMode() {
  _developerMode = !_developerMode;
  saveDeveloperMode();
  applyLayout();
  dispatchUIVisibilityChange();
  notifySubscribers('developerMode', _developerMode);
  console.log(`✓ Developer mode: ${_developerMode ? 'ON' : 'OFF'}`);
}

/**
 * Set developer mode explicitly.
 * @param {boolean} enabled
 */
export function setDeveloperMode(enabled) {
  if (_developerMode === !!enabled) return;
  _developerMode = !!enabled;
  saveDeveloperMode();
  applyLayout();
  dispatchUIVisibilityChange();
  notifySubscribers('developerMode', _developerMode);
}

/**
 * Load developer mode from localStorage.
 * @private
 */
function loadDeveloperMode() {
  try {
    const stored = localStorage.getItem(DEV_MODE_STORAGE_KEY);
    if (stored !== null) {
      _developerMode = stored === 'true';
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Save developer mode to localStorage.
 * @private
 */
function saveDeveloperMode() {
  try {
    localStorage.setItem(DEV_MODE_STORAGE_KEY, String(_developerMode));
  } catch {
    // Ignore storage errors
  }
}

// ── LAYER VISIBILITY ────────────────────────────────────────────────

/**
 * Determine if a HUD should be visible based on its layer and current state.
 * @param {string} hudKey - Registry key
 * @returns {boolean}
 */
export function shouldHudBeVisible(hudKey) {
  const config = getHudConfig(hudKey);
  if (!config) return false;

  // Player explicitly hid this HUD
  if (_playerHidden.has(hudKey)) return false;

  // Check UIVisibilityConfig for per-HUD toggle
  if (!isUIVisibilityAllowed(hudKey)) return false;

  // Layer-based rules
  switch (config.layer) {
    case HUD_LAYER.PLAYER_CRITICAL:
      return true;

    case HUD_LAYER.CONTEXTUAL_INSPECT:
      return _contextualVisible.has(hudKey) || true; // Visible by default, can be auto-hidden

    case HUD_LAYER.DEBUG_AUTHORING:
      return requiresDevMode(hudKey) ? _developerMode : true;

    default:
      return false;
  }
}

/**
 * Check UIVisibilityConfig for a HUD key.
 * @param {string} hudKey
 * @returns {boolean}
 * @private
 */
function isUIVisibilityAllowed(hudKey) {
  const mapping = {
    coreMetricsHUD: UIVisibilityConfig.coreMetrics,
    selectedHUD: UIVisibilityConfig.selectedHUD,
    categoryHUD: UIVisibilityConfig.categoryLegend,
    inspectorHUD: UIVisibilityConfig.nodeInspect,
    automationHUD: UIVisibilityConfig.aiHUD,
    advisorHUD: UIVisibilityConfig.advisorHUD,
    debugHUD: true // Controlled by developer mode, not UIVisibilityConfig
  };
  const allowed = mapping[hudKey];
  return allowed === undefined ? true : allowed;
}

/**
 * Show a contextual HUD (e.g., on hover or selection).
 * @param {string} hudKey
 */
export function showContextual(hudKey) {
  const config = getHudConfig(hudKey);
  if (!config || config.layer !== HUD_LAYER.CONTEXTUAL_INSPECT) return;
  _contextualVisible.add(hudKey);
  applyHudVisibility(hudKey);
}

/**
 * Hide a contextual HUD (e.g., on deselect or timeout).
 * @param {string} hudKey
 */
export function hideContextual(hudKey) {
  _contextualVisible.delete(hudKey);
  applyHudVisibility(hudKey);
}

/**
 * Player explicitly hides a HUD (persists across sessions via UIVisibilityConfig).
 * @param {string} hudKey
 */
export function playerHideHud(hudKey) {
  _playerHidden.add(hudKey);
  applyHudVisibility(hudKey);
}

/**
 * Player shows a previously hidden HUD.
 * @param {string} hudKey
 */
export function playerShowHud(hudKey) {
  _playerHidden.delete(hudKey);
  applyHudVisibility(hudKey);
}

// ── LAYOUT APPLICATION ──────────────────────────────────────────────

/**
 * Apply visibility rules to ALL registered HUDs.
 * This is the single authoritative layout pass.
 */
export function applyLayout() {
  getAllHudIds().forEach(hudKey => {
    applyHudVisibility(hudKey);
  });
}

/**
 * Apply visibility to a single HUD.
 * @param {string} hudKey
 * @private
 */
function applyHudVisibility(hudKey) {
  const config = getHudConfig(hudKey);
  if (!config) return;

  const hudElement = getHudElement(hudKey);
  if (!hudElement) return; // Not in DOM yet

  const visible = shouldHudBeVisible(hudKey);

  if (visible) {
    hudElement.style.display = '';
    hudElement.style.opacity = '';
    hudElement.removeAttribute('data-layer-hidden');
  } else {
    hudElement.style.display = 'none';
    hudElement.setAttribute('data-layer-hidden', 'true');
  }
}

// ── SUBSCRIPTIONS ───────────────────────────────────────────────────

/**
 * Subscribe to layer state changes.
 * @param {Function} callback - (event: string, value: any) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribeToLayerChanges(callback) {
  const id = ++_subscriberIdCounter;
  _subscribers.set(id, callback);
  return () => _subscribers.delete(id);
}

/**
 * Notify all subscribers of a state change.
 * @param {string} event
 * @param {*} value
 * @private
 */
function notifySubscribers(event, value) {
  _subscribers.forEach((cb) => {
    try { cb(event, value); } catch { /* ignore subscriber errors */ }
  });
}

// ── DEBUG UTILITIES ─────────────────────────────────────────────────

/**
 * Get full layer state for debugging.
 */
export function getLayerState() {
  const state = {
    developerMode: _developerMode,
    playerHidden: [..._playerHidden],
    contextualVisible: [..._contextualVisible],
    huds: {}
  };

  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    state.huds[hudKey] = {
      id: config.id,
      layer: config.layer,
      shouldBeVisible: shouldHudBeVisible(hudKey),
      inDOM: !!getHudElement(hudKey)
    };
  });

  return state;
}

/**
 * Print layer state to console.
 */
export function debugLayerState() {
  console.log('%c=== HUD LAYER STATE ===', 'color: cyan; font-weight: bold;');
  console.log(`Developer mode: ${_developerMode ? 'ON' : 'OFF'}`);

  Object.values(HUD_LAYER).forEach(layer => {
    const huds = getHudsByLayer(layer);
    console.log(`%c${layer} (${huds.length}):`, 'color: lime;');
    huds.forEach(key => {
      const config = getHudConfig(key);
      const visible = shouldHudBeVisible(key);
      const inDOM = !!getHudElement(key);
      console.log(`  ${key}: ${visible ? '[VISIBLE]' : '[HIDDEN]'} DOM=${inDOM}`);
    });
  });
}

console.log('✓ HUD Layer Manager 2.0 module loaded');
