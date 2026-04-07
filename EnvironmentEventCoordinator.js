export class EnvironmentEventCoordinator {
  constructor(config = {}) {
    this.semanticBus = config.semanticBus || this._resolveBus();
    this.worldEvents = config.worldEvents || null;
    this.ritualController = config.ritualController || null;
    this.metricReactiveEvents = config.metricReactiveEvents || null;

    this._subscriptions = [];
    this._initialized = false;
  }

  initialize() {
    if (this._initialized) return;
    this._initialized = true;

    this._bindMetricTriggers();
    this._bindRitualHooks();
  }

  dispose() {
    while (this._subscriptions.length > 0) {
      const unsubscribe = this._subscriptions.pop();
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.warn('[EnvironmentEventCoordinator] Subscription cleanup failed:', error);
      }
    }

    this._initialized = false;
  }

  _resolveBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _bindMetricTriggers() {
    if (!this.semanticBus) return;

    const worldEventMap = {
      'global.synergy.high': 'COSMIC_PULSE',
      'global.harmony.high': 'AURORA_STATE',
      'global.corruption.high': 'SIGMA_INVASION',
      'global.stability.high': 'QUANTUM_ECLIPSE',
      'global.loadPressure.high': 'FRACTAL_STORM'
    };

    Object.entries(worldEventMap).forEach(([eventName, worldEventType]) => {
      this._subscribe(eventName, () => this._routeMetricTag(worldEventType));
    });

    this._subscribe('global.synergy.mid', () => this._markLegendaryEvaluation());
    this._subscribe('global.harmony.mid', () => this._markLegendaryEvaluation());
  }

  _bindRitualHooks() {
    if (!this.semanticBus) return;

    this._subscribe('semantic.ritual.started', () => this._handleRitualStarted());
    this._subscribe('semantic.ritual.completed', () => this._handleRitualCompleted());
  }

  _subscribe(eventName, handler) {
    if (!this.semanticBus || !eventName || typeof handler !== 'function') return;

    if (typeof this.semanticBus.on === 'function') {
      this.semanticBus.on(eventName, handler);
      this._subscriptions.push(() => {
        if (typeof this.semanticBus.off === 'function') {
          this.semanticBus.off(eventName, handler);
        } else if (typeof this.semanticBus.unsubscribe === 'function') {
          this.semanticBus.unsubscribe(eventName, handler);
        }
      });
      return;
    }

    if (typeof this.semanticBus.subscribe === 'function') {
      this.semanticBus.subscribe(eventName, handler);
      this._subscriptions.push(() => {
        if (typeof this.semanticBus.unsubscribe === 'function') {
          this.semanticBus.unsubscribe(eventName, handler);
        }
      });
    }
  }

  _routeMetricTag(worldEventType) {
    if (!worldEventType) return;
    if (this.worldEvents?.isEventActive?.()) return;
    if (this.worldEvents?._isSuppressed?.()) return;

    this.worldEvents?.forceEvent?.(worldEventType);
  }

  _markLegendaryEvaluation() {
    if (!this.worldEvents || this.worldEvents._isSuppressed?.()) return;
    this.worldEvents.pendingEvaluation = true;
  }

  _handleRitualStarted() {
    if (!this.worldEvents) return;
    this.worldEvents.endWorldEvent?.();
    this.worldEvents.setSuppressed?.(true);
  }

  _handleRitualCompleted() {
    if (!this.worldEvents) return;
    this.worldEvents.setSuppressed?.(false, 3000);
  }
}