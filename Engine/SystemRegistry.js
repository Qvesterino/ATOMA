class SystemRegistry {
  constructor() {
    this.systems = new Map();
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

  enableSafeMode() {
    for (const [, sys] of this.systems) {
      sys.enabled = false;
    }
  }
}

export const systemRegistry = new SystemRegistry();
export { SystemRegistry };
