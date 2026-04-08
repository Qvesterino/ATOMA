const UI_VISIBILITY_STORAGE_KEY = 'atoma.ui.visibility';

export const UI_VISIBILITY_CHANGE_EVENT = 'atoma-ui-visibility-change';

export const UIVisibilityConfig = {
  coreMetrics: true,
  nodeInspect: true,
  categoryLegend: true,
  selectedHUD: true,
  aiHUD: true,
  advisorHUD: true,
};

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function notifyUIVisibilityChange() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent(UI_VISIBILITY_CHANGE_EVENT, {
        detail: { ...UIVisibilityConfig },
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

  notifyUIVisibilityChange();
}

export function saveUIVisibilityConfig() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(UI_VISIBILITY_STORAGE_KEY, JSON.stringify(UIVisibilityConfig));
  } catch {
    // Ignore persistence failures.
  }

  notifyUIVisibilityChange();
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
      type: 'visibility',
      id: 'aiHUD',
      label: 'AI Automation',
      value: UIVisibilityConfig.aiHUD ? '[ ON ]' : '[ OFF ]',
      description: 'Controls the AI automation HUD.',
      action: () => toggleUIVisibilityFlag('aiHUD'),
    },
    {
      type: 'visibility',
      id: 'advisorHUD',
      label: 'Advisor HUD',
      value: UIVisibilityConfig.advisorHUD ? '[ ON ]' : '[ OFF ]',
      description: 'Controls the advisor HUD.',
      action: () => toggleUIVisibilityFlag('advisorHUD'),
    },
  ];
}