class SystemRegistry {
  constructor() {
    this.systems = new Map();
    this._warnedSystems = new Set();
  }

  register(name, system, options = {}) {
    this.systems.set(name, {
      instance: system,
      enabled: options.enabled ?? true,
      priority: options.priority ?? 0
    });
  }

  enable(name) {
    if (this.systems.has(name)) {
      this.systems.get(name).enabled = true;
    }
  }

  unregister(name) {
    this.systems.delete(name);
  }

  disable(name) {
    if (this.systems.has(name)) {
      this.systems.get(name).enabled = false;
    }
  }

  isEnabled(name) {
    return this.systems.get(name)?.enabled ?? false;
  }

  getEnabledSystemsSorted() {
    return [...this.systems.entries()]
      .filter(([_, s]) => s.enabled)
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([_, s]) => s.instance);
  }

  setEnabled(name, enabled) {
    if (this.systems.has(name)) {
      this.systems.get(name).enabled = !!enabled;
    }
  }

  enableSafeMode() {
    for (const [, sys] of this.systems) {
      sys.enabled = false;
    }
  }

  warnOnce(name, message, payload) {
    const key = `${name}:${message}`;
    if (this._warnedSystems.has(key)) return;
    this._warnedSystems.add(key);
    console.warn(`[SystemRegistry] ${name} - ${message}`, payload ?? '');
  }

  runFrame(game, dt) {
    const frameContext = {
      dt,
      time: game?.time ?? 0,
      game,
      links: game?.nodeLinking?.links ?? [],
      nodes: game?.aiNodes?.nodes ?? []
    };
    // Allow legacy dt math (Number coercion) while moving to object contract
    frameContext[Symbol.toPrimitive] = () => dt;

    const legacyArgs = [
      frameContext.links,
      frameContext.dt,
      frameContext.time,
      frameContext.game,
      frameContext.nodes
    ];

    const activeSystems = [...this.systems.entries()]
      .filter(([_, s]) => s.enabled)
      .sort((a, b) => a[1].priority - b[1].priority);

    for (const [name, record] of activeSystems) {
      const system = record.instance;
      const update = system?.update;
      if (typeof update !== 'function') continue;

      try {
        if (update.length > 1) {
          this.warnOnce(name, `legacy update signature detected (length=${update.length}); expected update(frameContext)`);
          update.call(system, ...legacyArgs.slice(0, update.length));
        } else {
          update.call(system, frameContext);
        }
      } catch (error) {
        this.warnOnce(name, 'update threw; applying legacy fallback', error?.message ?? error);
        try {
          const fallbackArgs =
            update.length > 1
              ? legacyArgs.slice(0, update.length)
              : [frameContext.dt, frameContext.time];
          update.call(system, ...fallbackArgs);
        } catch (fallbackError) {
          this.warnOnce(name, 'fallback update failed', fallbackError?.message ?? fallbackError);
        }
      }
    }
  }
}

export const systemRegistry = new SystemRegistry();
export { SystemRegistry };
