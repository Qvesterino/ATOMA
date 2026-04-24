export class EnvironmentEventCoordinator {
  constructor(config = {}) {
    this.semanticBus = config.semanticBus || this._resolveBus();
    this.worldEvents = config.worldEvents || null;
    this.ritualController = config.ritualController || null;
    this.metricReactiveEvents = config.metricReactiveEvents || null;

    this._subscriptions = [];
    this._initialized = false;
    this._worldEventCooldownMs = Number.isFinite(config.worldEventCooldownMs) ? config.worldEventCooldownMs : 30000;
    this._postRitualCooldownMs = Number.isFinite(config.postRitualCooldownMs) ? config.postRitualCooldownMs : 3000;
    this._lastWorldEventTrigger = new Map();
    this._ritualActive = false;
    this._postRitualCooldownUntil = 0;
    this._pendingMetricTag = null;
    this._pendingMetricPriority = 0;
    this._priorityMap = config.priorityMap || {
      'global.synergy.high': 100,
      'global.harmony.high': 90,
      'global.corruption.high': 80,
      'global.stability.high': 70,
      'global.loadPressure.high': 60
    };
  }

  initialize() {
    if (this._initialized) return;
    this._initialized = true;

    this._bindMetricTriggers();
    this._bindConsciousnessTriggers();
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

  toggleMetricReactiveEvents() {
    const reactor = this.metricReactiveEvents;
    if (!reactor) return;

    if (typeof reactor.enabled === 'boolean') {
      if (reactor.enabled) {
        reactor.disable?.();
      } else {
        reactor.enable?.();
      }
      return;
    }

    if (typeof reactor.disable === 'function' && typeof reactor.enable === 'function') {
      reactor.disable();
    }
  }

  getMetricReactiveEventsStatus() {
    return {
      enabled: this.metricReactiveEvents?.enabled ?? false,
      debugMode: this.metricReactiveEvents?.debugMode ?? false,
      performance: typeof this.metricReactiveEvents?.getPerformanceStats === 'function'
        ? this.metricReactiveEvents.getPerformanceStats()
        : null,
      eventStates: this.metricReactiveEvents?.eventStates ?? null
    };
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
      this._subscribe(eventName, () => this._routeMetricTag(worldEventType, eventName));
    });

    this._subscribe('global.synergy.mid', () => this._markLegendaryEvaluation());
    this._subscribe('global.harmony.mid', () => this._markLegendaryEvaluation());
  }

  _bindConsciousnessTriggers() {
    if (!this.semanticBus) return;

    this._subscribe('consciousness.state.changed', (payload) => {
      this._routeConsciousnessState(payload);
    });
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

  _routeMetricTag(worldEventType, eventName) {
    if (!worldEventType || !eventName) return;
    if (this._isRitualActive()) return;
    if (this._isPostRitualCooldown()) return;
    if (this.worldEvents?.isEventActive?.()) return;
    if (this.worldEvents?._isSuppressed?.()) return;
    if (this._isOnCooldown(worldEventType)) return;

    const priority = this._priorityMap[eventName] || 0;
    if (priority <= 0) return;

    if (!this._pendingMetricTag || priority > this._pendingMetricPriority) {
      this._pendingMetricTag = { worldEventType, eventName };
      this._pendingMetricPriority = priority;
      setTimeout(() => this._dispatchPendingMetricTag(), 0);
    }
  }

  _dispatchPendingMetricTag() {
    if (!this._pendingMetricTag) return;

    const { worldEventType } = this._pendingMetricTag;
    this._pendingMetricTag = null;
    this._pendingMetricPriority = 0;

    if (this._isRitualActive() || this._isPostRitualCooldown()) return;
    if (this.worldEvents?.isEventActive?.()) return;
    if (this.worldEvents?._isSuppressed?.()) return;
    if (this._isOnCooldown(worldEventType)) return;

    this._triggerWorldEvent(worldEventType);
  }

  _routeConsciousnessState(payload) {
    const worldEventType = this._getConsciousnessWorldEventType(payload);
    if (!worldEventType) return;
    if (this._isRitualActive()) return;
    if (this._isPostRitualCooldown()) return;
    if (this.worldEvents?.isEventActive?.()) return;
    if (this.worldEvents?._isSuppressed?.()) return;
    if (this._isOnCooldown(worldEventType)) return;

    this._triggerWorldEvent(worldEventType);
  }

  _getConsciousnessWorldEventType(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const state = payload.consciousnessState && typeof payload.consciousnessState === 'object'
      ? payload.consciousnessState
      : payload;
    const macroState = String(
      state.worldMacroState
      || state.macroState
      || payload.worldMacroState
      || payload.macroState
      || ''
    ).toUpperCase();
    const networkMood = String(state.networkMood || state.moodTag || '').toUpperCase();
    const heroPhase = String(state.heroPhase || '').toUpperCase();
    const networkPressure = Number(state.networkPressure) || 0;
    const volatility = Number(state.volatility) || 0;

    switch (macroState) {
      case 'AWAKENING':
        return 'AWAKENING_STATE';
      case 'COMMUNION':
        return 'COMMUNION_STATE';
      case 'SCHISM':
        return 'SCHISM_STATE';
      case 'REVELATION':
        return 'REVELATION_STATE';
      case 'DORMANT':
        return null;
      default:
        break;
    }

    const tensionSpike =
      networkMood === 'CRITICAL' ||
      networkMood === 'CHAOTIC' ||
      heroPhase === 'DEFENSE' ||
      heroPhase === 'FRACTURE' ||
      (networkMood === 'TENSE' && (networkPressure >= 0.58 || volatility >= 0.55));

    if (!tensionSpike) return null;

    return 'FRACTAL_STORM';
  }

  _markLegendaryEvaluation() {
    if (!this.worldEvents || this.worldEvents._isSuppressed?.()) return;
    this.worldEvents.pendingEvaluation = true;
  }

  _isOnCooldown(worldEventType) {
    const last = this._lastWorldEventTrigger.get(worldEventType);
    if (!last) return false;
    return Date.now() - last < this._worldEventCooldownMs;
  }

  _triggerWorldEvent(worldEventType) {
    this._lastWorldEventTrigger.set(worldEventType, Date.now());
    this.worldEvents?.forceEvent?.(worldEventType);
  }

  _isRitualActive() {
    return this._ritualActive;
  }

  _isPostRitualCooldown() {
    return Date.now() < this._postRitualCooldownUntil;
  }

  _handleRitualStarted() {
    if (!this.worldEvents) return;
    this._ritualActive = true;
    this.worldEvents.endWorldEvent?.();
    this.worldEvents.setSuppressed?.(true);
  }

  _handleRitualCompleted() {
    if (!this.worldEvents) return;
    this._ritualActive = false;
    this._postRitualCooldownUntil = Date.now() + this._postRitualCooldownMs;
    this.worldEvents.setSuppressed?.(false, this._postRitualCooldownMs);
  }
}