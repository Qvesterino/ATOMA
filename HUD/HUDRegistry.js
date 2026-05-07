/**
 * HUD REGISTRY 2.0
 * 
 * Canonical HUD definitions for ATOMA UI system.
 * Single source of truth for all major HUD panels.
 * 
 * LAYER MODEL (P0.5 HUD Consolidation):
 * - PLAYER_CRITICAL: Always visible during gameplay. Core game state.
 * - CONTEXTUAL_INSPECT: Visible on player interaction. Secondary detail.
 * - DEBUG_AUTHORING: Visible only in developer mode. Internal tooling.
 * 
 * SAFETY: Pure configuration object - zero gameplay impact
 */

/**
 * HUD Layer enum — determines visibility priority and default behavior.
 * Lower number = higher priority = more likely to be visible.
 */
export const HUD_LAYER = Object.freeze({
  PLAYER_CRITICAL: 'PLAYER_CRITICAL',
  CONTEXTUAL_INSPECT: 'CONTEXTUAL_INSPECT',
  DEBUG_AUTHORING: 'DEBUG_AUTHORING'
});

/**
 * Layer visibility rules:
 * - PLAYER_CRITICAL: visible unless player explicitly hides
 * - CONTEXTUAL_INSPECT: visible on interaction, auto-hide when stale
 * - DEBUG_AUTHORING: visible only when developerMode is true
 */
export const LAYER_DEFAULTS = Object.freeze({
  [HUD_LAYER.PLAYER_CRITICAL]: { visible: true, requiresDevMode: false },
  [HUD_LAYER.CONTEXTUAL_INSPECT]: { visible: true, requiresDevMode: false },
  [HUD_LAYER.DEBUG_AUTHORING]: { visible: false, requiresDevMode: true }
});

export const HUD_REGISTRY = {
  // ── PLAYER CRITICAL ──────────────────────────────────────────────
  coreMetricsHUD: {
    id: 'core-metrics-hud',
    title: 'Network Command',
    layer: HUD_LAYER.PLAYER_CRITICAL,
    defaultCollapsed: false,
    defaultPosition: { left: 10, bottom: 20 },
    description: 'Primary network status — player-facing command panel',
    playerFacing: true
  },

  selectedHUD: {
    id: 'selected-hud',
    title: 'Selected Node',
    layer: HUD_LAYER.PLAYER_CRITICAL,
    collapsible: false,
    defaultCollapsed: false,
    defaultPosition: { right: 140, top: 20 },
    description: 'Currently selected node information — no collapse, always compact',
    playerFacing: true
  },

  // ── CONTEXTUAL INSPECT ───────────────────────────────────────────
  categoryHUD: {
    id: 'ui-category-legend',
    title: 'Node Categories',
    layer: HUD_LAYER.CONTEXTUAL_INSPECT,
    defaultCollapsed: false,
    defaultPosition: { left: 10, top: 10 },
    description: 'Reference legend showing all node categories',
    playerFacing: true
  },

  inspectorHUD: {
    id: 'node-inspect-overlay',
    title: 'Node Inspector',
    layer: HUD_LAYER.CONTEXTUAL_INSPECT,
    defaultCollapsed: false,
    defaultPosition: { left: 10, top: 200 },
    description: 'Context-triggered node inspection display',
    playerFacing: true
  },

  // ── DEBUG / AUTHORING ────────────────────────────────────────────
  automationHUD: {
    id: 'ai-automation-hud',
    title: 'AI Automation',
    layer: HUD_LAYER.DEBUG_AUTHORING,
    defaultCollapsed: false,
    defaultPosition: { right: 12, top: 340 },
    description: 'Link automation recommendations and status — dev only',
    playerFacing: false
  },

  advisorHUD: {
    id: 'variant-b-advisor-hud',
    selector: '[data-hud-variant="b-advisor"]',
    title: 'Advisor',
    layer: HUD_LAYER.DEBUG_AUTHORING,
    defaultCollapsed: false,
    defaultPosition: { right: 10, top: 400 },
    description: 'AI advisor analysis — dev only',
    playerFacing: false
  },

  debugHUD: {
    id: 'atoma-debug-hud',
    title: 'Debug Monitor',
    layer: HUD_LAYER.DEBUG_AUTHORING,
    defaultCollapsed: true,
    defaultPosition: { right: 20, bottom: 20 },
    description: 'Internal engine debug monitoring — dev only',
    playerFacing: false
  }
};

/**
 * Get all HUD registry keys
 */
export function getAllHudIds() {
  return Object.keys(HUD_REGISTRY);
}

/**
 * Get HUD config by key
 */
export function getHudConfig(hudKey) {
  return HUD_REGISTRY[hudKey];
}

/**
 * Get HUD key by DOM element ID
 */
export function getHudKeyByDomId(domId) {
  for (const [key, config] of Object.entries(HUD_REGISTRY)) {
    if (config.id === domId) {
      return key;
    }
  }
  return null;
}

/**
 * Get all HUD keys in a specific layer
 */
export function getHudsByLayer(layer) {
  return Object.entries(HUD_REGISTRY)
    .filter(([, config]) => config.layer === layer)
    .map(([key]) => key);
}

/**
 * Get all HUD keys that are player-facing
 */
export function getPlayerFacingHuds() {
  return Object.entries(HUD_REGISTRY)
    .filter(([, config]) => config.playerFacing)
    .map(([key]) => key);
}

/**
 * Check if a HUD requires developer mode to be visible
 */
export function requiresDevMode(hudKey) {
  const config = HUD_REGISTRY[hudKey];
  if (!config) return false;
  return config.layer === HUD_LAYER.DEBUG_AUTHORING;
}

/**
 * Get the DOM element for a HUD key.
 * Supports both ID-based and selector-based lookups.
 * @param {string} hudKey
 * @returns {HTMLElement|null}
 */
export function getHudElement(hudKey) {
  const config = HUD_REGISTRY[hudKey];
  if (!config) return null;

  // Prefer explicit selector if defined
  if (config.selector) {
    return document.querySelector(config.selector);
  }

  // Fallback to ID-based lookup
  return document.getElementById(config.id) || null;
}

console.log('✓ HUD Registry 2.0 loaded — 7 HUDs registered across 3 layers');
