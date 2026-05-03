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

function getUnlockTriggers(entry) {
  const unlock = entry?.unlock;
  if (!unlock) return [];

  const rawTriggers = [];
  if (Array.isArray(unlock.triggers)) {
    rawTriggers.push(...unlock.triggers);
  }
  if (unlock.trigger) {
    rawTriggers.push(unlock.trigger);
  }

  return Array.from(new Set(
    rawTriggers
      .map((trigger) => String(trigger || '').trim())
      .filter(Boolean)
  ));
}

export default class LoreUnlockEngine {
  constructor() {
    this.state = {
      unlocked: new Set()
    };
    this._subscribedTriggers = new Set();
    this._triggerUnsubscribers = new Map();
    this._unlockQueue = [];
    this._unlockQueueTimer = null;
    this._unlockQueueSpacingMs = 900;
    this._disposed = false;
    this._subscribe();
  }

  isUnlocked(id) {
    return this.state.unlocked.has(id);
  }

  getUnlocked() {
    return Array.from(this.state.unlocked);
  }

  unlock(id) {
    if (this._disposed) return false;
    if (this.state.unlocked.has(id)) return false;

    this.state.unlocked.add(id);
    this._unlockQueue.push(id);
    this._drainUnlockQueue();
    return true;
  }

  _drainUnlockQueue() {
    if (this._unlockQueueTimer || this._unlockQueue.length === 0) {
      return;
    }

    const emitNext = () => {
      this._unlockQueueTimer = null;
      const nextId = this._unlockQueue.shift();
      if (nextId !== undefined) {
        getSemanticBus()?.emit?.('lore.unlocked', { id: nextId });
      }

      if (this._unlockQueue.length > 0) {
        this._unlockQueueTimer = setTimeout(emitNext, this._unlockQueueSpacingMs);
      }
    };

    this._unlockQueueTimer = setTimeout(emitNext, 0);
  }

  _subscribe() {
    if (this._disposed) return;
    const semanticBus = getSemanticBus();
    if (!semanticBus?.on) return;

    for (const entry of getRegistryEntries()) {
      const triggers = getUnlockTriggers(entry);
      if (triggers.length === 0) continue;

      for (const trigger of triggers) {
        if (this._subscribedTriggers.has(trigger)) continue;

        this._subscribedTriggers.add(trigger);
        const unsub = semanticBus.on(trigger, (eventData = {}) => {
          this._handleTrigger(trigger, eventData);
        });
        if (typeof unsub === 'function') {
          this._triggerUnsubscribers.set(trigger, unsub);
        }
      }
    }
  }

  _unsubscribeAll() {
    if (!this._triggerUnsubscribers || this._triggerUnsubscribers.size === 0) {
      this._subscribedTriggers.clear();
      return;
    }

    for (const unsub of this._triggerUnsubscribers.values()) {
      try {
        unsub?.();
      } catch (_) {}
    }

    this._triggerUnsubscribers.clear();
    this._subscribedTriggers.clear();
  }

  _handleTrigger(trigger, eventData = {}) {
    if (this._disposed) return;
    for (const entry of getRegistryEntries()) {
      const triggers = getUnlockTriggers(entry);
      if (triggers.length === 0 || !triggers.includes(trigger)) continue;

      const passes = typeof entry.condition === 'function'
        ? entry.condition(eventData)
        : true;

      if (passes) {
        this.unlock(entry.id);
      }
    }
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;

    if (this._unlockQueueTimer) {
      clearTimeout(this._unlockQueueTimer);
      this._unlockQueueTimer = null;
    }

    this._unlockQueue.length = 0;
    this._unsubscribeAll();
  }
}
