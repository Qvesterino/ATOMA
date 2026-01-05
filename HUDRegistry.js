/**
 * HUD REGISTRY 1.0
 * 
 * Canonical HUD definitions for ATOMA UI system.
 * Provides a single source of truth for all major HUD panels.
 * 
 * SAFETY: Pure configuration object - zero gameplay impact
 */

export const HUD_REGISTRY = {
  categoryHUD: {
    id: 'ui-category-legend',
    title: 'Node Categories',
    defaultCollapsed: false,
    defaultPosition: { left: 10, top: 20 },
    description: 'Reference legend showing all 14 node categories'
  },
  
  inspectorHUD: {
    id: 'node-inspect-overlay',
    title: 'Node Inspector',
    defaultCollapsed: false,
    defaultPosition: { left: 10, top: 160 },
    description: 'Context-triggered node inspection display'
  },
  
  coreMetricsHUD: {
    id: 'core-metrics-hud',
    title: 'Core Metrics',
    defaultCollapsed: false,
    defaultPosition: { left: 10, top: 330 },
    description: 'Real-time network metrics and temporal units'
  },
  
  automationHUD: {
    id: 'ai-automation-hud',
    title: 'AI Automation HUD',
    defaultCollapsed: false,
    defaultPosition: { left: 10, bottom: 20 },
    description: 'Link automation recommendations and status'
  }
};

/**
 * Get all HUD IDs
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
 * Get HUD by DOM id
 */
export function getHudKeyByDomId(domId) {
  for (const [key, config] of Object.entries(HUD_REGISTRY)) {
    if (config.id === domId) {
      return key;
    }
  }
  return null;
}

console.log('✓ HUD Registry 1.0 loaded — 4 HUDs registered');
