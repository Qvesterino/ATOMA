const UI_VISIBILITY_STORAGE_KEY = 'atoma.ui.visibility';
const DEVELOPER_MODE_STORAGE_KEY = 'atoma.hud.developerMode';

export const UI_VISIBILITY_CHANGE_EVENT = 'atoma-ui-visibility-change';

export const UIVisibilityConfig = {
  coreMetrics: true,
  nodeInspect: true,
  categoryLegend: true,
  selectedHUD: true,
  aiHUD: false,
  advisorHUD: false,
  waveSystemHUD: true,
  /** Developer mode — controls DEBUG_AUTHORING layer visibility */
  developerMode: false
};

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getStoredDeveloperMode() {
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(DEVELOPER_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function isDeveloperModeActive() {
  return getStoredDeveloperMode();
}

export function isHudEnabledByPreference(hudId) {
  const mapping = {
    aiHUD: UIVisibilityConfig.aiHUD,
    automationHUD: UIVisibilityConfig.aiHUD,
    advisorHUD: UIVisibilityConfig.advisorHUD,
    waveSystemHUD: UIVisibilityConfig.waveSystemHUD,
    debugHUD: true,
  };
  const enabled = mapping[hudId];
  return enabled === undefined ? false : enabled !== false;
}

export function isDeveloperHudEnabledByPreference(hudId) {
  return isHudEnabledByPreference(hudId);
}

export function isHudEffectivelyVisible(hudId) {
  if (hudId === 'waveSystemHUD') {
    return isDeveloperModeActive() && isHudEnabledByPreference('waveSystemHUD');
  }

  if (hudId === 'aiHUD' || hudId === 'automationHUD') {
    return isHudEnabledByPreference('aiHUD');
  }

  if (hudId === 'advisorHUD') {
    return isHudEnabledByPreference('advisorHUD');
  }

  if (hudId === 'debugHUD') {
    return isDeveloperModeActive();
  }

  return false;
}

export function isDeveloperHudEffectivelyVisible(hudId) {
  return isHudEffectivelyVisible(hudId);
}

function buildVisibilityEventDetail() {
  return {
    ...UIVisibilityConfig,
    developerMode: isDeveloperModeActive(),
  };
}

export function dispatchUIVisibilityChange() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent(UI_VISIBILITY_CHANGE_EVENT, {
        detail: buildVisibilityEventDetail(),
      }),
    );
  } catch {
    // Ignore event dispatch failures in non-DOM contexts.
  }
}

export function loadUIVisibilityConfig() {
  try {
    if (typeof localStorage === 'undefined') return;

    const raw = localStorage.getItem(UI_VISIBILITY_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) return;

    Object.assign(UIVisibilityConfig, parsed);
  } catch {
    // Ignore malformed storage and keep defaults.
  }

  dispatchUIVisibilityChange();
}

export function saveUIVisibilityConfig() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(UI_VISIBILITY_STORAGE_KEY, JSON.stringify(UIVisibilityConfig));
  } catch {
    // Ignore persistence failures.
  }

  dispatchUIVisibilityChange();
}

export function setUIVisibilityFlag(key, value) {
  if (!Object.prototype.hasOwnProperty.call(UIVisibilityConfig, key)) {
    return UIVisibilityConfig;
  }

  UIVisibilityConfig[key] = value !== false;
  saveUIVisibilityConfig();
  return UIVisibilityConfig;
}

export function toggleUIVisibilityFlag(key) {
  if (!Object.prototype.hasOwnProperty.call(UIVisibilityConfig, key)) {
    return UIVisibilityConfig;
  }

  UIVisibilityConfig[key] = !UIVisibilityConfig[key];
  saveUIVisibilityConfig();
  return UIVisibilityConfig;
}

export function getUIVisibilitySettingsRows() {
  const aiHudVisible = isHudEffectivelyVisible('aiHUD');
  const advisorHudVisible = isHudEffectivelyVisible('advisorHUD');
  const waveHudVisible = isHudEffectivelyVisible('waveSystemHUD');

  return [
    {
      type: 'section',
      id: 'ui-visibility-section',
      label: 'UI VISIBILITY',
      description: 'Persistent HUD visibility controls. Changes apply immediately and survive reloads.',
      selectable: false,
    },
    {
      type: 'visibility',
      id: 'coreMetrics',
      label: 'Core Metrics',
      value: UIVisibilityConfig.coreMetrics ? '[ ON ]' : '[ OFF ]',
      description: 'Controls the core metrics HUD.',
      action: () => toggleUIVisibilityFlag('coreMetrics'),
    },
    {
      type: 'visibility',
      id: 'nodeInspect',
      label: 'Node Inspect',
      value: UIVisibilityConfig.nodeInspect ? '[ ON ]' : '[ OFF ]',
      description: 'Controls the node inspect overlay.',
      action: () => toggleUIVisibilityFlag('nodeInspect'),
    },
    {
      type: 'visibility',
      id: 'categoryLegend',
      label: 'Category Legend',
      value: UIVisibilityConfig.categoryLegend ? '[ ON ]' : '[ OFF ]',
      description: 'Controls the category legend HUD.',
      action: () => toggleUIVisibilityFlag('categoryLegend'),
    },
    {
      type: 'visibility',
      id: 'selectedHUD',
      label: 'Selected HUD',
      value: UIVisibilityConfig.selectedHUD ? '[ ON ]' : '[ OFF ]',
      description: 'Controls the selected node HUD.',
      action: () => toggleUIVisibilityFlag('selectedHUD'),
    },
    {
      type: 'section',
      id: 'optional-visibility-section',
      label: 'OPTIONAL HUDS',
      description: 'Optional overlays that can be toggled on demand.',
      selectable: false,
    },
    {
      type: 'visibility',
      id: 'aiHUD',
      label: 'AI Automation',
      value: aiHudVisible ? '[ ON ]' : '[ OFF ]',
      description: 'Controls the AI automation overlay.',
      action: () => toggleUIVisibilityFlag('aiHUD'),
    },
    {
      type: 'visibility',
      id: 'advisorHUD',
      label: 'Advisor HUD',
      value: advisorHudVisible ? '[ ON ]' : '[ OFF ]',
      description: 'Controls the compact advisor overlay.',
      action: () => toggleUIVisibilityFlag('advisorHUD'),
    },
    {
      type: 'section',
      id: 'dev-visibility-section',
      label: 'DEVELOPER',
      description: 'Debug overlays visible only when developer mode is active (F4).',
      selectable: false,
    },
    {
      type: 'visibility',
      id: 'waveSystemHUD',
      label: 'Wave System HUD',
      value: waveHudVisible ? '[ ON ]' : '[ OFF ]',
      description: 'Controls the wave system debug overlay in main.js.',
      action: () => toggleUIVisibilityFlag('waveSystemHUD'),
    },
  ];
}
