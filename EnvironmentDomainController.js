import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { EnvironmentEventCoordinator } from './EnvironmentEventCoordinator.js';

const ENVIRONMENT_SYSTEMS = [
  'SafeWorldFXPack',
  'SafeAIWeatherPack',
  'SafeQuantumIllusionsPack1',
  'AmbientEntityManager',
  'EmergentThoughtStorms5_0',
  'SafeLegendaryWorldEvents',
  'WorldPersonalityController',
  'MetricReactiveWorldEvents',
  'SafeDreamDepthPack',
  'DreamDepthEffectManager',
  'SafeColonyExpansion2',
  'MythicRitualController',
  // REMOVED: EnergyOrbManager - moved to LEGACY (dead code, never initialized)
  'EnvironmentalHazard',
];

const ENVIRONMENT_RENDER_LAYERS = Object.freeze({
  worldFXPack: 'WORLD_BACKGROUND',
  weatherPack: 'WORLD_BACKGROUND',
  quantumIllusions: 'WORLD_OVERLAY',
  worldEvents: 'WORLD_OVERLAY',
  worldPersonalityController: 'WORLD_OVERLAY',
  metricReactiveEvents: 'WORLD_OVERLAY',
  ambientEntityManager: 'WORLD_OVERLAY',
  emergentThoughtStorms: 'WORLD_OVERLAY',
  safeDreamDepthPack: 'WORLD_OVERLAY',
  dreamDepthEffectManager: 'WORLD_OVERLAY',
  colonyExpansion: 'WORLD_OVERLAY',
  mythicRitualController: 'WORLD_OVERLAY',
  // REMOVED: energyOrbManager - moved to LEGACY (dead code, never initialized)
  environmentalHazards: 'WORLD_OVERLAY'
});

function createSharedEnvironmentAssetRegistry() {
  const materialEntries = new Map();
  const geometryEntries = new Map();
  const materialLookup = new WeakMap();
  const geometryLookup = new WeakMap();

  const tagSharedAsset = (asset, key, kind) => {
    if (!asset) return asset;
    if (!asset.userData) asset.userData = {};
    asset.userData.__sharedEnvironmentAsset = true;
    asset.userData.__sharedEnvironmentKey = key;
    asset.userData.__sharedEnvironmentKind = kind;
    return asset;
  };

  const getOrCreate = (entries, lookup, key, factory, kind) => {
    if (entries.has(key)) {
      const entry = entries.get(key);
      entry.refCount += 1;
      return entry.asset;
    }

    const asset = factory?.();
    if (!asset) return asset;

    const taggedAsset = tagSharedAsset(asset, key, kind);
    entries.set(key, { asset: taggedAsset, refCount: 1 });
    lookup.set(taggedAsset, key);
    return taggedAsset;
  };

  const release = (entries, lookup, asset) => {
    if (!asset) return false;

    const key = lookup.get(asset) ?? asset.userData?.__sharedEnvironmentKey ?? null;
    if (!key || !entries.has(key)) {
      if (typeof asset.dispose === 'function') {
        asset.dispose();
      }
      return false;
    }

    const entry = entries.get(key);
    entry.refCount -= 1;
    if (entry.refCount <= 0) {
      if (typeof entry.asset.dispose === 'function') {
        entry.asset.dispose();
      }
      entries.delete(key);
      lookup.delete(entry.asset);
    }

    return true;
  };

  return {
    getSharedMaterial(key, factory) {
      return getOrCreate(materialEntries, materialLookup, key, factory, 'material');
    },
    getSharedGeometry(key, factory) {
      return getOrCreate(geometryEntries, geometryLookup, key, factory, 'geometry');
    },
    releaseMaterial(material) {
      return release(materialEntries, materialLookup, material);
    },
    releaseGeometry(geometry) {
      return release(geometryEntries, geometryLookup, geometry);
    },
    dispose() {
      for (const entry of materialEntries.values()) {
        if (typeof entry.asset?.dispose === 'function') {
          entry.asset.dispose();
        }
      }
      for (const entry of geometryEntries.values()) {
        if (typeof entry.asset?.dispose === 'function') {
          entry.asset.dispose();
        }
      }
      materialEntries.clear();
      geometryEntries.clear();
    }
  };
}

export class EnvironmentDomainController {

  constructor(scene, worldRoot, environmentRoot, frameScheduler, deps) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.environmentRoot = environmentRoot;
    this.frameScheduler = frameScheduler;
    this.deps = deps; // camera, aiNodes, linkingSystem, etc.
    this.sharedEnvironmentAssets = createSharedEnvironmentAssetRegistry();

    this.instances = {};
    this.schedulerId = 'visual.environmentDomain';
  }

  init() {
    this._createSystems();
    this._registerSchedulerHooks();
  }

  rebuild() {
    this.dispose();
    this._createSystems();
    this._registerSchedulerHooks();
  }

  dispose() {
    this._unregisterSchedulerHooks();
    Object.values(this.instances).forEach(sys => {
      if (sys && typeof sys.dispose === 'function') {
        sys.dispose();
      }
    });

    if (this.sharedEnvironmentAssets) {
      this.sharedEnvironmentAssets.dispose();
    }

    this.instances = {};
  }

  _createSystems() {
    const d = this.deps;

    this.instances.worldFXPack =
      new d.SafeWorldFXPack(
        this.scene,
        this.worldRoot,
        this.environmentRoot,
        d.camera,
        this.sharedEnvironmentAssets,
        d.semanticBus
      );
    if (this.instances.worldFXPack) {
      this.instances.worldFXPack.frameScheduler = this.frameScheduler;
    }

    this.instances.weatherPack =
      new d.SafeAIWeatherPack(
        this.scene,
        this.worldRoot,
        this.environmentRoot,
        d.camera,
        this.sharedEnvironmentAssets
      );

    this.instances.worldEvents =
      new d.SafeLegendaryWorldEvents(
        this.scene,
        this.worldRoot,
        d.camera,
        d.renderer,
        false
      );

    this.instances.worldPersonalityController =
      new d.WorldPersonalityController(
        this.scene,
        this.worldRoot,
        d.camera,
        d.renderer
      );

    this.instances.mythicRitualController =
      new d.MythicRitualController(
        this.scene,
        d.camera,
        d.renderer,
        this.instances.worldPersonalityController,
        d.player,
        d.semanticBus
      );

    this.instances.metricReactiveEvents =
      new d.MetricReactiveWorldEvents(
        this.scene,
        this.worldRoot,
        this.environmentRoot,
        d.renderer,
        d.coreMetricsOverlay
      );
    if (this.instances.metricReactiveEvents) {
      this.instances.metricReactiveEvents.frameScheduler = this.frameScheduler;
    }

    this.instances.worldEventCoordinator =
      new EnvironmentEventCoordinator({
        semanticBus: d.semanticBus,
        worldEvents: this.instances.worldEvents,
        ritualController: this.instances.mythicRitualController,
        metricReactiveEvents: this.instances.metricReactiveEvents
      });
    this.instances.worldEventCoordinator.initialize();

    this.instances.safeDreamDepthPack =
      new d.SafeDreamDepthPack(
        this.scene,
        this.environmentRoot,
        d.camera,
        d.renderer
      );

    this.instances.dreamDepthEffectManager =
      new d.DreamDepthEffectManager(
        this.scene,
        this.environmentRoot,
        d.camera,
        d.renderer
      );

    this.instances.quantumIllusions =
      new d.SafeQuantumIllusionsPack1(
        this.scene,
        this.environmentRoot,
        d.camera,
        d.aiNodes,
        d.linkingSystem,
        this.instances.worldEvents,
        this.instances.weatherPack,
        d.legendaryPack,
        this.sharedEnvironmentAssets
      );

    this.instances.ambientEntityManager =
      new d.AmbientEntityManager(
        this.scene,
        this.environmentRoot,
        d.camera
      );

    if (this.instances.ambientEntityManager?.registerWorldSystems &&
        d.legendaryPack && this.instances.worldEvents && this.instances.weatherPack && d.linkingSystem) {
      this.instances.ambientEntityManager.registerWorldSystems(
        d.legendaryPack,
        this.instances.worldEvents,
        this.instances.weatherPack,
        d.linkingSystem
      );
    }

    if (d.recursiveGlyphMessaging && d.semanticGlyphAI) {
      this.instances.emergentThoughtStorms =
        new d.EmergentThoughtStorms5_0(
          this.scene,
          this.environmentRoot,
          d.recursiveGlyphMessaging,
          d.semanticGlyphAI
        );
      if (this.instances.emergentThoughtStorms.setEnabled) {
        this.instances.emergentThoughtStorms.setEnabled(true);
      }
    }

    this.instances.environmentalHazards =
      new d.EnvironmentalHazards(
        this.environmentRoot,
        d.camera
      );
    this.instances.environmentalHazards.frameScheduler = this.frameScheduler;

    // Add Colony system to environment domain for centralized visual+update lifecycle
    if (typeof d.SafeColonyExpansion2 === 'function') {
      this.instances.colonyExpansion = new d.SafeColonyExpansion2(
        this.scene,
        this.environmentRoot
      );
      this.instances.colonyExpansion.frameScheduler = this.frameScheduler;
      // Provide no-op initialize if environment not ready yet; main may call separately as well
      if (typeof this.instances.colonyExpansion.initialize === 'function') {
        const worldSystems = {
          nodes: this.deps.aiNodes?.nodes?.reduce((acc, node) => {
            if (node) acc[node.uuid || node.id] = node;
            return acc;
          }, {}) || {},
          links: this.deps.linkingSystem?.links || [],
          legendaryRegistry: this.deps.legendaryPack?.registry || null,
          weatherRegistry: this.instances.weatherPack?.registry || this.deps.weatherPack?.registry || null,
          worldEvents: this.instances.worldEvents || this.deps.worldEvents || null,
          evolutionRegistry: this.deps.evolutionManager?.registry || null,
          synergyMap: this.deps.synergyMap || {},
          trafficMap: this.deps.trafficMap || {}
        };
        this.instances.colonyExpansion.initialize(worldSystems);
      }
    }

    this._applyRenderLayerPolicies();
  }

  _applyRenderLayerPolicies() {
    for (const [key, system] of Object.entries(this.instances)) {
      const layerId = ENVIRONMENT_RENDER_LAYERS[key];
      if (!system || !layerId) continue;

      const renderOrder = VisualHierarchyRegistry.getRenderOrder(layerId);
      for (const root of this._collectRenderRoots(system)) {
        this._bindRenderRoot(root, renderOrder, layerId, key);
      }
    }
  }

  _collectRenderRoots(system) {
    const candidates = [
      system.root,
      system.vfxContainer,
      system.screenSpaceContainer,
      system.stormContainer,
      system.layerContainer,
      system.overlayQuad,
      system.registry?.root,
      system.vfxManager?.root,
      system.vfxManager?.container,
      system.vfxManager?.vfxContainer
    ];

    const roots = [];
    const seen = new Set();
    for (const candidate of candidates) {
      if (!this._isOwnedRenderRoot(candidate) || seen.has(candidate)) continue;
      seen.add(candidate);
      roots.push(candidate);
    }

    return roots;
  }

  _bindRenderRoot(root, renderOrder, layerId, key) {
    if (!this._isObject3D(root)) return;

    if (!root.userData) {
      root.userData = {};
    }

    root.userData.__environmentLayerId = layerId;
    root.userData.__environmentOwner = key;
    this._applyRenderOrderRecursive(root, renderOrder);

    if (root.userData.__environmentRenderHookInstalled) {
      return;
    }

    const originalAdd = root.add;
    root.add = (...children) => {
      const result = originalAdd.apply(root, children);
      for (const child of children) {
        this._applyRenderOrderRecursive(child, renderOrder);
        if (this._isObject3D(child)) {
          this._bindRenderRoot(child, renderOrder, layerId, key);
        }
      }
      return result;
    };
    root.userData.__environmentRenderHookInstalled = true;
  }

  _applyRenderOrderRecursive(root, renderOrder) {
    if (!this._isObject3D(root)) return;

    root.traverse((node) => {
      if (!node) return;
      node.renderOrder = renderOrder;
      if (!node.userData) {
        node.userData = {};
      }
      node.userData.__environmentRenderOrder = renderOrder;
    });
  }

  _isObject3D(value) {
    return Boolean(value && typeof value.add === 'function' && typeof value.traverse === 'function');
  }

  _isOwnedRenderRoot(value) {
    if (!this._isObject3D(value)) return false;
    if (value === this.scene || value === this.worldRoot || value === this.environmentRoot) {
      return false;
    }
    return true;
  }

  _registerSchedulerHooks() {
    if (!this.frameScheduler) return;

    this.frameScheduler.register(
      'visual',
      (dt) => {
        Object.entries(this.instances).forEach(([key, sys]) => {
          if (!sys || typeof sys.update !== 'function') return;

          if (key === 'weatherPack') {
            sys.update(
              dt,
              this.deps.legendaryPack,
              this.deps.linkingSystem,
              this.deps.evolutionManager,
              this.deps.worldEvents
            );
            return;
          }
          if (key === 'worldEvents') {
            sys.update(
              dt,
              this.deps.legendaryPack,
              this.deps.linkingSystem,
              this.deps.evolutionManager
            );
            return;
          }
          if (key === 'emergentThoughtStorms') {
            sys.update(
              dt,
              this.deps.aiNodes,
              this.deps.linkingSystem
            );
            return;
          }

          sys.update(dt);
        });
      },
      this.schedulerId
    );

    this.frameScheduler.register(
      'simulation',
      (dt) => {
        if (this.instances.worldPersonalityController?.update) {
          this.instances.worldPersonalityController.update(
            dt,
            this.deps.aiNodes?.nodes,
            typeof window !== 'undefined' ? window.__ATOMA_LIVE_METRICS__ : null
          );
        }

        if (this.instances.mythicRitualController?.update) {
          this.instances.mythicRitualController.update(
            dt,
            this.deps.aiNodes?.nodes
          );
        }
      },
      `${this.schedulerId}.worldPersonalityController`
    );
  }

  setCoreMetricsOverlay(coreMetricsOverlay) {
    if (!coreMetricsOverlay) return;
    this.deps.coreMetricsOverlay = coreMetricsOverlay;

    if (this.instances.metricReactiveEvents) {
      this.instances.metricReactiveEvents.coreMetricsOverlay = coreMetricsOverlay;
      if (this.instances.worldEventCoordinator) {
        this.instances.worldEventCoordinator.metricReactiveEvents = this.instances.metricReactiveEvents;
      }
      return;
    }

    if (this.deps.MetricReactiveWorldEvents) {
      this.instances.metricReactiveEvents = new this.deps.MetricReactiveWorldEvents(
        this.scene,
        this.worldRoot,
        this.environmentRoot,
        this.deps.renderer,
        coreMetricsOverlay
      );
      if (this.instances.metricReactiveEvents) {
        this.instances.metricReactiveEvents.frameScheduler = this.frameScheduler;
      }
      if (this.instances.worldEventCoordinator) {
        this.instances.worldEventCoordinator.metricReactiveEvents = this.instances.metricReactiveEvents;
      }

      const renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
      this._bindRenderRoot(this.instances.metricReactiveEvents.root, renderOrder, 'WORLD_OVERLAY', 'metricReactiveEvents');
    }
  }

  _unregisterSchedulerHooks() {
    if (this.frameScheduler && this.frameScheduler.unregister) {
      this.frameScheduler.unregister(this.schedulerId);
    }
  }
}
