const ENVIRONMENT_SYSTEMS = [
  'SafeWorldFXPack',
  'SafeAIWeatherPack',
  'SafeQuantumIllusionsPack1',
  'AmbientEntityManager',
  'EmergentThoughtStorms5_0',
  'SafeDreamDepthPack',
  'DreamDepthEffectManager',
  'SafeColonyExpansion2',
  'EnergyOrbManager',
  'EnvironmentalHazard',

];

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
        this.sharedEnvironmentAssets
      );

    this.instances.weatherPack =
      new d.SafeAIWeatherPack(
        this.scene,
        this.worldRoot,
        this.environmentRoot,
        d.camera,
        this.sharedEnvironmentAssets
      );

    this.instances.quantumIllusions =
      new d.SafeQuantumIllusionsPack1(
        this.scene,
        this.environmentRoot,
        d.camera,
        d.aiNodes,
        d.linkingSystem,
        d.worldEvents,
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
        d.legendaryPack && d.worldEvents && this.instances.weatherPack && d.linkingSystem) {
      this.instances.ambientEntityManager.registerWorldSystems(
        d.legendaryPack,
        d.worldEvents,
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
  }

  _unregisterSchedulerHooks() {
    if (this.frameScheduler && this.frameScheduler.unregister) {
      this.frameScheduler.unregister(this.schedulerId);
    }
  }
}
