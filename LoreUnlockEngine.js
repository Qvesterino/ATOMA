import { LORE_REGISTRY_V1 } from './LoreRegistry.js';

function getRegistryEntries() {
  if (Array.isArray(LORE_REGISTRY_V1)) {
    return LORE_REGISTRY_V1;
  }

  if (LORE_REGISTRY_V1 && typeof LORE_REGISTRY_V1 === 'object') {
    return Object.values(LORE_REGISTRY_V1);
  }

  return [];
}

function getSemanticBus() {
  return globalThis?.semanticBus ?? null;
}

export default class LoreUnlockEngine {
  constructor() {
    this.state = {
      unlocked: new Set()
    };
    this._subscribedTriggers = new Set();
    this._subscribe();
  }

  isUnlocked(id) {
    return this.state.unlocked.has(id);
  }

  getUnlocked() {
    return Array.from(this.state.unlocked);
  }

  unlock(id) {
    if (this.state.unlocked.has(id)) return false;

    this.state.unlocked.add(id);
    getSemanticBus()?.emit?.('lore.unlocked', { id });
    return true;
  }

  _subscribe() {
    const semanticBus = getSemanticBus();
    if (!semanticBus?.on) return;

    for (const entry of getRegistryEntries()) {
      const trigger = entry?.unlock?.trigger;
      if (!trigger || this._subscribedTriggers.has(trigger)) continue;

      this._subscribedTriggers.add(trigger);
      semanticBus.on(trigger, (eventData = {}) => {
        this._handleTrigger(trigger, eventData);
      });
    }
  }

  _handleTrigger(trigger, eventData = {}) {
    for (const entry of getRegistryEntries()) {
      if (entry?.unlock?.trigger !== trigger) continue;

      const passes = typeof entry.condition === 'function'
        ? entry.condition(eventData)
        : true;

      if (passes) {
        this.unlock(entry.id);
      }
    }
  }
}
