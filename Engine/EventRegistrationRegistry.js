/**
 * EventRegistrationRegistry — Lifecycle shim for event subscriptions.
 *
 * Wraps bus.on() / bus.subscribe() calls with ownership tracking.
 * No behavior change — the underlying bus API is untouched.
 *
 * Contract:
 *   register(owner, tag, handler, bus)  -> disposer fn
 *   disposeOwner(owner)                  // hard cleanup all handlers for owner
 *   disposeAll()                         // cleanup all owners
 *   report()                             // returns { owner, tag, count }[]
 *
 * Phase 1 of registration-consolidation: shim only, no existing code wired yet.
 */

class EventRegistrationRegistry {
  constructor() {
    /** @type {Map<string, Array<{ tag: string, handler: Function, bus: object, disposer: Function|null }>>} */
    this._entries = new Map();
  }

  /**
   * Register an event handler through the registry.
   *
   * @param {string} owner  - Owner identifier (e.g. class name 'CascadeBurstVisual')
   * @param {string} tag    - Event tag (e.g. 'cascade.start')
   * @param {Function} handler - The event handler function
   * @param {object} bus    - The event bus instance (semanticBus, bus, etc.)
   * @returns {Function} Disposer function — call to unsubscribe
   */
  register(owner, tag, handler, bus) {
    if (!owner || typeof owner !== 'string') {
      console.warn('[EventRegistrationRegistry] register() called with invalid owner:', owner);
      return () => {};
    }
    if (!tag || typeof tag !== 'string') {
      console.warn('[EventRegistrationRegistry] register() called with invalid tag:', tag);
      return () => {};
    }
    if (typeof handler !== 'function') {
      console.warn('[EventRegistrationRegistry] register() called with invalid handler for:', owner, tag);
      return () => {};
    }
    if (!bus || (typeof bus.on !== 'function' && typeof bus.subscribe !== 'function')) {
      console.warn('[EventRegistrationRegistry] register() called with invalid bus for:', owner, tag);
      return () => {};
    }

    // Perform the actual subscription via the bus
    let nativeDisposer = null;
    if (typeof bus.on === 'function') {
      const maybeUnsub = bus.on(tag, handler);
      if (typeof maybeUnsub === 'function') {
        nativeDisposer = maybeUnsub;
      }
    } else if (typeof bus.subscribe === 'function') {
      const maybeUnsub = bus.subscribe(tag, handler);
      if (typeof maybeUnsub === 'function') {
        nativeDisposer = maybeUnsub;
      }
    }

    const entry = { tag, handler, bus, disposer: nativeDisposer };

    if (!this._entries.has(owner)) {
      this._entries.set(owner, []);
    }
    this._entries.get(owner).push(entry);

    // Return a disposer that removes from registry AND unsubscribes from bus
    const self = this;
    let disposed = false;
    return function disposer() {
      if (disposed) return;
      disposed = true;

      // Unsubscribe from bus
      self._unsubscribeEntry(entry);

      // Remove from registry
      const ownerEntries = self._entries.get(owner);
      if (ownerEntries) {
        const idx = ownerEntries.indexOf(entry);
        if (idx !== -1) {
          ownerEntries.splice(idx, 1);
        }
        if (ownerEntries.length === 0) {
          self._entries.delete(owner);
        }
      }
    };
  }

  /**
   * Hard cleanup: remove all handlers for a given owner.
   *
   * @param {string} owner - Owner identifier
   */
  disposeOwner(owner) {
    const entries = this._entries.get(owner);
    if (!entries) return;

    // Unsubscribe each entry from its bus
    for (const entry of entries) {
      this._unsubscribeEntry(entry);
    }

    this._entries.delete(owner);
  }

  /**
   * Hard cleanup: remove all handlers for all owners.
   */
  disposeAll() {
    for (const [owner, entries] of this._entries) {
      for (const entry of entries) {
        this._unsubscribeEntry(entry);
      }
    }
    this._entries.clear();
  }

  /**
   * Report current registrations.
   *
   * @returns {Array<{ owner: string, tag: string, count: number }>}
   */
  report() {
    const result = [];
    for (const [owner, entries] of this._entries) {
      // Group by tag within owner
      const tagCounts = new Map();
      for (const entry of entries) {
        const count = tagCounts.get(entry.tag) ?? 0;
        tagCounts.set(entry.tag, count + 1);
      }
      for (const [tag, count] of tagCounts) {
        result.push({ owner, tag, count });
      }
    }
    return result;
  }

  /**
   * Internal: unsubscribe a single entry from its bus.
   *
   * @param {{ tag: string, handler: Function, bus: object, disposer: Function|null }} entry
   * @private
   */
  _unsubscribeEntry(entry) {
    const { tag, handler, bus, disposer } = entry;

    // Prefer native disposer if available
    if (typeof disposer === 'function') {
      try {
        disposer();
        return;
      } catch (_) {
        // Fall through to manual off/unsubscribe
      }
    }

    // Manual cleanup via bus.off() or bus.unsubscribe()
    if (bus && typeof bus.off === 'function') {
      try { bus.off(tag, handler); } catch (_) {}
    } else if (bus && typeof bus.unsubscribe === 'function') {
      try { bus.unsubscribe(tag, handler); } catch (_) {}
    }
  }
}

// Singleton instance
const eventRegistrationRegistry = new EventRegistrationRegistry();

export { EventRegistrationRegistry, eventRegistrationRegistry };
export default eventRegistrationRegistry;
