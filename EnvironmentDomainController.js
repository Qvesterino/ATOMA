const ENVIRONMENT_SYSTEMS = [
  'SafeWorldFXPack',
  'SafeAIWeatherPack',
  'SafeQuantumIllusionsPack1',
  'AmbientEntityManager',
  'EmergentThoughtStorms5_0',
  'SafeDreamDepthPack',
  'DreamDepthEffectManager',
  'SafeColonyExpansion2',
  'EnergyOrbManager'
];

export class EnvironmentDomainController {

  constructor(scene, worldRoot, environmentRoot, frameScheduler, deps) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.environmentRoot = environmentRoot;
    this.frameScheduler = frameScheduler;
    this.deps = deps; // camera, aiNodes, linkingSystem, etc.

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

    this.instances = {};
  }

  _createSystems() {
    const d = this.deps;

    this.instances.worldFXPack =
      new d.SafeWorldFXPack(
        this.scene,
        this.worldRoot,
        this.environmentRoot,
        d.camera
      );

    this.instances.weatherPack =
      new d.SafeAIWeatherPack(
        this.scene,
        this.worldRoot,
        this.environmentRoot,
        d.camera
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
        d.legendaryPack
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
  }

  _registerSchedulerHooks() {
    if (!this.frameScheduler) return;

    this.frameScheduler.register(
      'visual',
      (dt) => {
        Object.values(this.instances).forEach(sys => {
          if (sys && typeof sys.update === 'function') {
            sys.update(dt);
          }
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
