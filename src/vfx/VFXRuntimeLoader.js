import { debugWarn } from '../../Engine/Debug/DebugLog.js';

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * VFXRuntimeLoader
 * Opt-in registry/loader for VFX systems with safety caps and scheduler wiring.
 */
export class VFXRuntimeLoader {
  constructor(ctx = {}) {
    const {
      frameScheduler = null,
      scene = null,
      vfxRoot = null,
      world = null,
      aiNodes = null,
      linkingSystem = null,
      camera = null,
      renderer = null,
      config = {}
    } = ctx;

    this.frameScheduler = frameScheduler;
    this.scene = scene;
    this.vfxRoot = vfxRoot || scene || null;
    this.world = world || null;
    this.aiNodes = aiNodes || null;
    this.linkingSystem = linkingSystem || null;
    this.camera = camera || null;
    this.renderer = renderer || null;
    this.config = {
      maxEnabled: config.maxEnabled ?? 12,
      minEnableIntervalMs: config.minEnableIntervalMs ?? 200,
      schedulerLayer: config.schedulerLayer ?? 'visual',
      disableOnWorldSwitch: config.disableOnWorldSwitch !== false,
      preserveTagsOnSwitch: config.preserveTagsOnSwitch ?? [],
      preserveSafeLevelsOnSwitch: config.preserveSafeLevelsOnSwitch ?? [],
      preserveIdsOnSwitch: config.preserveIdsOnSwitch ?? []
    };

    this.registry = new Map(); // id -> def
    this.enabledInstances = new Map(); // id -> entry
    this.eventLog = [];
    this.eventLogSize = 100;
    this.lastEnableAt = 0;
    this.attached = false;
    this._time = 0;
  }

  _logEvent(type, id, message) {
    const event = {
      ts: nowMs(),
      type,
      id,
      message
    };
    this.eventLog.push(event);
    if (this.eventLog.length > this.eventLogSize) {
      this.eventLog.shift();
    }
    return event;
  }

  _getContext(extra = {}) {
    return {
      frameScheduler: this.frameScheduler,
      scene: this.scene,
      vfxRoot: this.vfxRoot,
      world: this.world,
      aiNodes: this.aiNodes,
      linkingSystem: this.linkingSystem,
      camera: this.camera,
      renderer: this.renderer,
      config: this.config,
      ...extra
    };
  }

  register(def = {}) {
    const { id } = def;
    if (!id || typeof id !== 'string') {
      debugWarn(true, '[VFXRuntimeLoader] register() missing id');
      return false;
    }
    if (this.registry.has(id)) {
      debugWarn(true, `[VFXRuntimeLoader] register() duplicate id "${id}"`);
      return false;
    }
    this.registry.set(id, def);
    this._logEvent('register', id, `Registered (${def.domain || 'unknown'})`);
    return true;
  }

  list() {
    return Array.from(this.registry.values()).map((def) => ({
      id: def.id,
      domain: def.domain,
      safeLevel: def.safeLevel,
      tags: def.tags || [],
      enabled: this.enabledInstances.has(def.id)
    }));
  }

  status() {
    return {
      enabledCount: this.enabledInstances.size,
      registryCount: this.registry.size,
      enabled: Array.from(this.enabledInstances.keys()),
      maxEnabled: this.config.maxEnabled,
      events: [...this.eventLog]
    };
  }

  _resolveUpdateHandler(def, instance) {
    if (!instance) return null;

    // Custom updateFn handler
    if (typeof def.updateFn === 'function') {
      const fn = def.updateFn.bind(instance);
      return (dt, t) => fn(dt, t, this._getContext());
    }

    if (typeof def.updateFn === 'string' && typeof instance[def.updateFn] === 'function') {
      const fn = instance[def.updateFn].bind(instance);
      return (dt, t) => fn(dt, t, this._getContext());
    }

    const candidate = ['update', 'tick', 'animate'].find((name) => typeof instance[name] === 'function');
    if (candidate) {
      const fn = instance[candidate].bind(instance);
      return (dt, t) => fn(dt, t, this._getContext());
    }

    return null;
  }

  enable(id, opts = {}) {
    const def = this.registry.get(id);
    if (!def) {
      debugWarn(true, `[VFXRuntimeLoader] enable() unknown id "${id}"`);
      return false;
    }
    if (this.enabledInstances.has(id)) return true;

    const now = nowMs();
    if (now - this.lastEnableAt < this.config.minEnableIntervalMs) {
      debugWarn(true, `[VFXRuntimeLoader] enable() rate-limited for "${id}"`);
      return false;
    }

    if (this.enabledInstances.size >= this.config.maxEnabled) {
      debugWarn(true, `[VFXRuntimeLoader] enable() blocked: maxEnabled=${this.config.maxEnabled}`);
      return false;
    }

    this.lastEnableAt = now;

    let instance = null;
    try {
      instance = def.factory ? def.factory(this._getContext({ options: opts })) : null;
    } catch (err) {
      debugWarn(true, `[VFXRuntimeLoader] factory error for "${id}":`, err);
      this._logEvent('error', id, `factory failed: ${err?.message || err}`);
      return false;
    }

    const updateHandler = this._resolveUpdateHandler(def, instance);

    this.enabledInstances.set(id, {
      id,
      def,
      instance,
      update: updateHandler,
      createdAt: now,
      errors: 0,
      consecutiveErrors: 0,
      stats: { ticks: 0, lastError: null }
    });

    this._logEvent('enable', id, 'Enabled');
    return true;
  }

  enableMany(ids = []) {
    const results = {};
    ids.forEach((id) => {
      results[id] = this.enable(id);
    });
    return results;
  }

  disable(id, reason = 'manual') {
    const entry = this.enabledInstances.get(id);
    if (!entry) return false;

    const { instance, def } = entry;
    try {
      if (typeof def?.disposeFn === 'function') {
        def.disposeFn(instance, this._getContext());
      } else if (instance && typeof instance.dispose === 'function') {
        instance.dispose();
      }
    } catch (err) {
      debugWarn(true, `[VFXRuntimeLoader] dispose error for "${id}":`, err);
      this._logEvent('error', id, `dispose failed: ${err?.message || err}`);
    }

    this.enabledInstances.delete(id);
    this._logEvent('disable', id, `Disabled (${reason})`);
    return true;
  }

  disableAll(reason = 'bulk') {
    Array.from(this.enabledInstances.keys()).forEach((id) => this.disable(id, reason));
  }

  toggle(id) {
    if (this.enabledInstances.has(id)) {
      return this.disable(id, 'toggle');
    }
    return this.enable(id);
  }

  attachToScheduler() {
    if (this.attached) return true;
    if (!this.frameScheduler || typeof this.frameScheduler.register !== 'function') {
      debugWarn(true, '[VFXRuntimeLoader] attachToScheduler() failed: frameScheduler missing');
      return false;
    }
    const layer = this.config.schedulerLayer;
    const success = this.frameScheduler.register(layer, (dt) => this.tick(dt), 'vfx.runtimeLoader');
    this.attached = success;
    if (success) {
      this._logEvent('attach', 'loader', `Attached to FrameScheduler (${layer})`);
    }
    return success;
  }

  tick(dt = 0) {
    this._time += dt;
    for (const [id, entry] of this.enabledInstances.entries()) {
      if (!entry.update) continue;
      try {
        entry.update(dt, this._time);
        entry.stats.ticks += 1;
        entry.consecutiveErrors = 0;
      } catch (err) {
        entry.errors += 1;
        entry.consecutiveErrors += 1;
        entry.stats.lastError = err?.message || String(err);
        this._logEvent('error', id, `tick failed (${entry.consecutiveErrors}): ${entry.stats.lastError}`);
        if (entry.consecutiveErrors >= 3) {
          debugWarn(true, `[VFXRuntimeLoader] Auto-disabling "${id}" after 3 errors`);
          this.disable(id, 'auto-error');
        }
      }
    }
  }

  onWorldSwitch(reason = 'world-switch') {
    if (!this.config.disableOnWorldSwitch) return;

    const preserved = [];
    const toDisable = [];

    for (const [id, entry] of this.enabledInstances.entries()) {
      const { def } = entry;
      const keepById = this.config.preserveIdsOnSwitch.includes(id);
      const keepByTag = def?.tags?.some((tag) => this.config.preserveTagsOnSwitch.includes(tag));
      const keepBySafe = def?.safeLevel && this.config.preserveSafeLevelsOnSwitch.includes(def.safeLevel);

      if (keepById || keepByTag || keepBySafe) {
        preserved.push(id);
      } else {
        toDisable.push(id);
      }
    }

    toDisable.forEach((id) => this.disable(id, reason));
    if (preserved.length > 0) {
      this._logEvent('world', 'preserve', `Preserved on world switch: ${preserved.join(', ')}`);
    } else {
      this._logEvent('world', 'reset', 'All VFX systems disabled on world switch');
    }
  }
}

export default VFXRuntimeLoader;
