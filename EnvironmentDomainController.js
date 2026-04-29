import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { EnvironmentEventCoordinator } from './EnvironmentEventCoordinator.js';
import { EventDramaturgyEngine, installDramaturgyDebugAPI } from './EventDramaturgyEngine.js';

// Central environment/world VFX catalog.
// Not every listed system is EnvironmentDomainController-owned at runtime;
// `extended` and `support` keep the broader world/environment VFX surface in one place.
const describeEnvironmentVfx = (
  id,
  role,
  ownership,
  runtimeStatus,
  spawnConditions = [],
  renderLayer = 'UNSPECIFIED',
  schedulerLayer = 'event-driven'
) => Object.freeze({
  id,
  role,
  ownership,
  runtimeStatus,
  spawnConditions: Object.freeze(spawnConditions),
  renderLayer,
  schedulerLayer
});

export const ENVIRONMENT_VFX_REGISTRY = Object.freeze({
  core: Object.freeze([
    describeEnvironmentVfx(
      'SafeWorldFXPack',
      'Foundational world ambience, breathing layers, haze, rifts, and macro background motion.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['global.synergy.high', 'global.loadPressure.high', 'global.corruption.high', 'global.stability.low', 'global.stability.high'],
      'WORLD_BACKGROUND',
      'visual'
    ),
    describeEnvironmentVfx(
      'SafeAIWeatherPack',
      'Weather-state atmosphere layer for fog, sky motion, and condition-driven world mood.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['world.weather.candidate', 'link.synergy.aggregate', 'link.loadPressure.aggregate', 'world.event.active'],
      'WORLD_BACKGROUND',
      'visual'
    ),
    describeEnvironmentVfx(
      'SafeQuantumIllusionsPack1',
      'Quantum-space distortion, illusion, and unreality overlays bound to the active world.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['world.event.type.active', 'link.throughput.high', 'link.synergy.aggregate', 'node.synergy.high', 'node.motion.fast'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'AmbientEntityManager',
      'Ambient entities such as wisps, ghost orbs, and roaming spectral life.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['world.ambient.active'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'EmergentThoughtStorms5_0',
      'Large-scale thought-storm phenomena that externalize AI mood as weather.',
      'EnvironmentDomainController',
      'conditional-domain-owned',
      ['system.recursiveGlyphMessaging.ready', 'system.semanticGlyphAI.ready'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'SafeLegendaryWorldEvents',
      'High-impact world event presentation layer for rare environmental states and event reveals.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['world.legendary.eventPotential.high', 'world.event.cooldown.ready', 'world.event.roll.success'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'WorldPersonalityController',
      'Global world mood and personality modulation layer that shapes atmosphere over time.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['global.harmony.high', 'global.harmony.mid', 'global.loadPressure.high', 'global.stability.low', 'world.personality.aggregate.ready'],
      'WORLD_OVERLAY',
      'simulation'
    ),
    describeEnvironmentVfx(
      'MythicRitualController',
      'Mythic ritual world-event visuals that stage ceremonial, transcendent environment states.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['semantic.ritual.started', 'semantic.ritual.completed'],
      'WORLD_OVERLAY',
      'simulation'
    ),
    describeEnvironmentVfx(
      'MetricReactiveWorldEvents',
      'Metric-driven world events that translate canonical runtime state into environmental spectacle.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['global.synergy.low|mid|high', 'global.harmony.low|mid|high', 'global.stability.low|mid|high', 'global.corruption.low|mid|high', 'global.loadPressure.low|mid|high'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'SafeDreamDepthPack',
      'Low-cost dream-depth fallback layer for atmospheric depth, vignettes, and focus mood.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['world.weather.active', 'world.event.active', 'world.focusTarget.present'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'DreamDepthEffectManager',
      'Primary rich dream-depth atmosphere layer with focus, pulse, and depth-event styling.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['world.weather.active', 'world.event.active', 'world.focusTarget.present', 'world.depthPulse.triggered'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'SafeColonyExpansion2',
      'Living colony ecosystem overlay that grows ambient civilization structures inside the world.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['colony.cluster.detected', 'colony.linkConnectivity.valid', 'world.event.active', 'world.weather.active'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'EnvironmentalHazards',
      'Hazard and anomaly layer for dangerous environmental zones, storms, fractures, and instability.',
      'EnvironmentDomainController',
      'active-domain-owned',
      ['global.corruption.high', 'global.loadPressure.high', 'global.stability.low', 'global.stability.high'],
      'WORLD_OVERLAY',
      'visual'
    )
  ]),
  extended: Object.freeze([
    describeEnvironmentVfx(
      'WaveParticleEmitter_v1',
      'World-space particle field for wave interference, standing-wave ripples, and reactive burst motion.',
      'main.js',
      'active-main-owned',
      ['node.synergy.low|mid|high', 'node.harmony.low|mid|high', 'node.stability.low|mid|high', 'node.corruption.low|mid|high', 'node.loadPressure.low|mid|high'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'ResonanceCascadeVisualization_Session117B',
      'Cascade and resonance propagation overlay for radial surges, blooms, and influence echoes.',
      'main.js',
      'active-main-owned',
      ['link.created', 'global.loadPressure.high'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'HarmonicHubAuraSystem_Session126',
      'Shared harmonic field layer around hub constellations and local resonance regions.',
      'main.js',
      'active-main-owned',
      ['hub.harmony.high', 'hub.harmony.mid', 'hub.harmony.low'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'CanonicalTemplate3_StressVisuals',
      'Global stress-pressure ambience affecting fog, color, lighting mood, and network tension atmosphere.',
      'main.js',
      'active-main-owned',
      ['global.metricFrame.updated', 'node.loadPressure.active'],
      'WORLD_OVERLAY',
      'main-loop'
    ),
    describeEnvironmentVfx(
      'AIConsciousnessLayer',
      'Global cognitive atmosphere layer with thought threads, pulse traffic, and consciousness-field presence.',
      'main.js',
      'active-main-owned',
      ['link.active', 'link.trafficIntensity.active', 'link.harmony.active', 'link.stability.active', 'system.storms.enabled'],
      'WORLD_OVERLAY',
      'visual'
    ),
    describeEnvironmentVfx(
      'CognitiveHorizonPlane',
      'Map foundation plane that provides horizon language, ground mood, and deep-space environmental framing.',
      'MapReferencePlaneFactory',
      'active-map-owned',
      ['map.referencePlane.selected', 'world.focusTarget.present', 'world.memoryPressure.active'],
      'MAP_FOUNDATION',
      'visual'
    )
  ]),
  support: Object.freeze([
    describeEnvironmentVfx(
      'EventDramaturgyEngine',
      '3-phase event lifecycle engine (telegraph → escalation → payoff) for cascade, corruption, resonance, ritual, and hazard events.',
      'EnvironmentDomainController',
      'active-domain-owned-support',
      ['cascade.start', 'cascade.end', 'network:corruptionSpread', 'event:harmonyResonance', 'semantic.ritual.started', 'semantic.ritual.completed', 'environment.hazard.active', 'dramaturgy.phase'],
      'INTERNAL_SUPPORT',
      'visual'
    ),
    describeEnvironmentVfx(
      'EnvironmentEventCoordinator',
      'Support coordinator that arbitrates event ownership and sequencing between environment systems.',
      'EnvironmentDomainController',
      'active-domain-owned-support',
      ['global.synergy.high', 'global.harmony.high', 'global.corruption.high', 'global.stability.high', 'global.loadPressure.high', 'semantic.ritual.started', 'semantic.ritual.completed'],
      'INTERNAL_SUPPORT',
      'event-driven'
    ),
    describeEnvironmentVfx(
      'ColonyVFXManager',
      'Internal colony VFX payload builder responsible for colony halos, rings, particles, and transitions.',
      'SafeColonyExpansion2',
      'active-indirect-support',
      ['colony.birth', 'colony.growth', 'colony.merge', 'colony.split', 'colony.transformation', 'world.event.active'],
      'WORLD_OVERLAY',
      'visual-indirect'
    ),
    // DEPRECATED (2026-04-23): _AIThoughtStorms2_0 superseded by _EmergentThoughtStorms5_0.
    // Kept in registry for documentation drift detection only.
    describeEnvironmentVfx(
      'AIThoughtStorms2_0',
      '[DEPRECATED] Consciousness-layer thought storms — superseded by EmergentThoughtStorms5_0.',
      'AIConsciousnessLayer',
      'legacy-deprecated',
      [],
      'WORLD_OVERLAY',
      'visual-indirect'
    ),
    describeEnvironmentVfx(
      'SafeMetricsFX1_1',
      'Support polish layer that converts global metrics into lightweight visual modulation and feedback.',
      'main.js',
      'active-main-owned-support',
      ['node.metric.updated'],
      'NODE_SURFACE',
      'event-driven'
    ),
    describeEnvironmentVfx(
      'TemporalEventEffects',
      'Temporal overlay effects used by the metrics/HUD layer rather than world-space environment rendering.',
      'CoreMetricsOverlay',
      'active-overlay-support',
      ['global.harmony.high', 'global.synergy.high', 'time.epoch.changed', 'time.aeon.changed'],
      'HUD_OVERLAY',
      'hud-loop'
    ),
    describeEnvironmentVfx(
      'CinematicUpgrade',
      'Presentation-grade cinematic enhancement layer for premium framing, mood, and visual polish.',
      'main.js',
      'active-main-owned-support',
      ['global.metricFrame.updated', 'quality.high'],
      'POST_PROCESS',
      'main-loop'
    )
  ])
});

const ENVIRONMENT_SYSTEMS = Object.freeze([
  ...ENVIRONMENT_VFX_REGISTRY.core.map((entry) => entry.id),
  ...ENVIRONMENT_VFX_REGISTRY.extended.map((entry) => entry.id),
  ...ENVIRONMENT_VFX_REGISTRY.support.map((entry) => entry.id)
]);

const ENVIRONMENT_RENDER_LAYERS = Object.freeze({
  worldFXPack: 'WORLD_BACKGROUND',
  weatherPack: 'WORLD_BACKGROUND',
  quantumIllusions: 'WORLD_OVERLAY',
  worldEvents: 'WORLD_OVERLAY',
  worldPersonalityController: 'WORLD_OVERLAY',
  metricReactiveEvents: 'WORLD_OVERLAY',
  ambientEntityManager: 'WORLD_OVERLAY',
  // EmergentThoughtStorms5_0 renders ABOVE colony VFX so storms sit on top
  // of civilization halos/rings but BELOW UI/HUD.
  emergentThoughtStorms: 'WORLD_FOREGROUND',
  safeDreamDepthPack: 'WORLD_OVERLAY',
  dreamDepthEffectManager: 'WORLD_OVERLAY',
  colonyExpansion: 'WORLD_OVERLAY',
  mythicRitualController: 'WORLD_OVERLAY',
  // REMOVED: energyOrbManager - moved to LEGACY (dead code, never initialized)
  environmentalHazards: 'WORLD_OVERLAY'
});

const ENVIRONMENT_AMBIENT_VISIBILITY_POLICY = Object.freeze({
  worldFXPack: Object.freeze({
    focusRadius: 18,
    activeDistance: 30,
    farDistance: 58,
    dormantDistance: 96,
    activeCadenceFrames: 2,
    farCadenceFrames: 4
  }),
  weatherPack: Object.freeze({
    focusRadius: 18,
    activeDistance: 30,
    farDistance: 58,
    dormantDistance: 96,
    activeCadenceFrames: 2,
    farCadenceFrames: 4
  }),
  ambientEntityManager: Object.freeze({
    focusRadius: 14,
    activeDistance: 24,
    farDistance: 46,
    dormantDistance: 72,
    activeCadenceFrames: 3,
    farCadenceFrames: 6
  }),
  quantumIllusions: Object.freeze({
    focusRadius: 18,
    activeDistance: 28,
    farDistance: 52,
    dormantDistance: 82,
    activeCadenceFrames: 2,
    farCadenceFrames: 4
  }),
  metricReactiveEvents: Object.freeze({
    focusRadius: 16,
    activeDistance: 28,
    farDistance: 56,
    dormantDistance: 92,
    activeCadenceFrames: 2,
    farCadenceFrames: 4
  }),
  safeDreamDepthPack: Object.freeze({
    focusRadius: 20,
    activeDistance: 30,
    farDistance: 60,
    dormantDistance: 96,
    activeCadenceFrames: 2,
    farCadenceFrames: 4
  }),
  dreamDepthEffectManager: Object.freeze({
    focusRadius: 20,
    activeDistance: 30,
    farDistance: 60,
    dormantDistance: 96,
    activeCadenceFrames: 2,
    farCadenceFrames: 4
  }),
  colonyExpansion: Object.freeze({
    focusRadius: 16,
    activeDistance: 24,
    farDistance: 44,
    dormantDistance: 70,
    activeCadenceFrames: 3,
    farCadenceFrames: 6
  }),
  emergentThoughtStorms: Object.freeze({
    focusRadius: 18,
    activeDistance: 28,
    farDistance: 52,
    dormantDistance: 84,
    activeCadenceFrames: 3,
    farCadenceFrames: 6
  }),
  environmentalHazards: Object.freeze({
    focusRadius: 16,
    activeDistance: 28,
    farDistance: 52,
    dormantDistance: 86,
    activeCadenceFrames: 2,
    farCadenceFrames: 4
  })
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
    this.worldContextProvider = typeof deps?.worldContextProvider === 'function' ? deps.worldContextProvider : null;
    this.sharedEnvironmentAssets = createSharedEnvironmentAssetRegistry();
    this._ambientViewProjectionMatrix = new THREE.Matrix4();
    this._ambientVisibilityFrustum = new THREE.Frustum();
    this._ambientVisibilitySphere = new THREE.Sphere();
    this._ambientFocusScratch = new THREE.Vector3();
    this._ambientVisualFrameIndex = 0;

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

    const dreamDepthKeys = ['safeDreamDepthPack', 'dreamDepthEffectManager'];
    for (const key of dreamDepthKeys) {
      const sys = this.instances[key];
      if (sys && typeof sys.cleanup === 'function') {
        sys.cleanup();
      }
      this.instances[key] = null;
    }

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

    this._wireDreamDepthScheduler();

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
        d.linkingSystem,
        this.instances.colonyExpansion || null
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
    // NOTE: SafeColonyExpansion2 is optional - silently skipped if class unavailable
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

    // Event Dramaturgy Engine — 3-phase event lifecycle (telegraph → escalation → payoff)
    this.instances.eventDramaturgy =
      new EventDramaturgyEngine({
        semanticBus: d.semanticBus,
        camera: d.camera,
        audioSystem: d.audioSystem || null,
        environmentDomain: this
      });
    this.instances.eventDramaturgy.init();
    installDramaturgyDebugAPI(this.instances.eventDramaturgy);

    this._applyRenderLayerPolicies();
    this._syncEnvironmentWorldContext();
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
      system.screenOverlaysRoot,
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

  _getAmbientFocusObject() {
    return this.deps?.player || this.worldRoot || this.environmentRoot || this.deps?.camera || null;
  }

  _getAmbientFocusPosition(target = this._ambientFocusScratch) {
    const focusObject = this._getAmbientFocusObject();
    if (!focusObject || !target) return null;

    if (typeof focusObject.getWorldPosition === 'function') {
      focusObject.getWorldPosition(target);
      return target;
    }

    if (focusObject.position?.isVector3) {
      target.copy(focusObject.position);
      return target;
    }

    return null;
  }

  _buildAmbientVisibilityState() {
    const camera = this.deps?.camera;
    const focusPosition = this._getAmbientFocusPosition(this._ambientFocusScratch);

    if (!camera?.position || !focusPosition) {
      return {
        focusVisible: true,
        focusDistance: 0,
        focusPosition: null
      };
    }

    if (typeof camera.updateMatrixWorld === 'function') {
      camera.updateMatrixWorld(true);
    }

    this._ambientViewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this._ambientVisibilityFrustum.setFromProjectionMatrix(this._ambientViewProjectionMatrix);
    this._ambientVisibilitySphere.center.copy(focusPosition);
    this._ambientVisibilitySphere.radius = 16;

    return {
      focusVisible: this._ambientVisibilityFrustum.intersectsSphere(this._ambientVisibilitySphere),
      focusDistance: camera.position.distanceTo(focusPosition),
      focusPosition
    };
  }

  _getAmbientLayerPolicy(key) {
    return ENVIRONMENT_AMBIENT_VISIBILITY_POLICY[key] || null;
  }

  _resolveAmbientLayerMode(key, ambientState, visualFrameIndex) {
    const policy = this._getAmbientLayerPolicy(key);
    if (!policy) return null;

    const focusVisible = ambientState?.focusVisible !== false;
    const focusDistance = Number.isFinite(ambientState?.focusDistance) ? ambientState.focusDistance : 0;
    const cadencePhase = Math.abs(Array.from(String(key)).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % Math.max(1, policy.farCadenceFrames || 1);

    if (!focusVisible || focusDistance >= policy.dormantDistance) {
      return {
        visible: false,
        shouldUpdate: false,
        cadenceFrames: 0,
        policy,
        state: 'dormant'
      };
    }

    const throttled = focusDistance >= policy.farDistance;
    const cadenceFrames = Math.max(1, throttled ? policy.farCadenceFrames : policy.activeCadenceFrames);
    const shouldUpdate = cadenceFrames <= 1 || ((visualFrameIndex + cadencePhase) % cadenceFrames) === 0;

    return {
      visible: true,
      shouldUpdate,
      cadenceFrames,
      policy,
      state: throttled ? 'throttled' : 'active'
    };
  }

  _applyAmbientLayerVisibility(system, visible) {
    if (!system) return;

    for (const root of this._collectRenderRoots(system)) {
      if (root) root.visible = visible;
    }

    if (typeof system.setVisible === 'function') {
      try {
        system.setVisible(visible);
      } catch {
        // Ignore visibility setter failures; root visibility still applies.
      }
    }

    if (typeof system.setEnabled === 'function') {
      try {
        system.setEnabled(visible);
      } catch {
        // Ignore enable setter failures; root visibility still applies.
      }
    }

    if (Object.prototype.hasOwnProperty.call(system, 'runtimeEnabled')) {
      system.runtimeEnabled = visible;
    }
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

    const DREAM_DEPTH_KEYS = new Set(['safeDreamDepthPack', 'dreamDepthEffectManager']);
    const SKIP_UPDATE_KEYS = new Set([...DREAM_DEPTH_KEYS, 'eventDramaturgy']);

    this.frameScheduler.register(
      'visual',
      (dt) => {
        const ambientState = this._buildAmbientVisibilityState();
        const ambientVisualFrameIndex = this._ambientVisualFrameIndex = (this._ambientVisualFrameIndex ?? 0) + 1;
        const worldBinding = this._syncEnvironmentWorldContext();
        const dreamDepthMode = this._resolveAmbientLayerMode('safeDreamDepthPack', ambientState, ambientVisualFrameIndex);
        this._applyAmbientLayerVisibility(this.instances.safeDreamDepthPack, dreamDepthMode?.visible !== false);
        this._applyAmbientLayerVisibility(this.instances.dreamDepthEffectManager, dreamDepthMode?.visible !== false);

        const worldSystems = this._buildDreamDepthWorldSystems();

        Object.entries(this.instances).forEach(([key, sys]) => {
          if (!sys || typeof sys.update !== 'function') return;

          const ambientMode = this._resolveAmbientLayerMode(key, ambientState, ambientVisualFrameIndex);
          if (ambientMode) {
            this._applyAmbientLayerVisibility(sys, ambientMode.visible);
            if (!ambientMode.shouldUpdate) return;
          }

          if (key === 'weatherPack') {
            sys.update(
              dt,
              this.deps.legendaryPack,
              this.deps.linkingSystem,
              this.deps.evolutionManager,
              this.deps.worldEvents,
              worldBinding?.weatherMoodBias || null
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

          if (key === 'worldFXPack') {
            sys.update(
              dt,
              this.deps.aiNodes?.nodes || null,
              this.deps.linkingSystem || null,
              this.deps.evolutionManager || null,
              this.deps.legendaryPack || null
            );
            return;
          }

          if (SKIP_UPDATE_KEYS.has(key)) return;

          sys.update(dt);
        });

        if (dreamDepthMode?.shouldUpdate !== false) {
          this._updateDreamDepthPair(dt, worldSystems, worldBinding);
        }

        // Event Dramaturgy Engine — 3-phase lifecycle tick (visual lane)
        if (this.instances.eventDramaturgy) {
          this.instances.eventDramaturgy.update(dt);
        }
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
      this.frameScheduler.unregister(`${this.schedulerId}.worldPersonalityController`);
    }
    this._teardownDreamDepthDebugBridge();
  }

  _buildDreamDepthWorldSystems() {
    const d = this.deps;
    return {
      aiNodes: d.aiNodes || null,
      legendaryRegistry: d.legendaryPack?.registry || null,
      weatherRegistry: this.instances.weatherPack?.registry || d.weatherPack?.registry || null,
      worldEvents: this.instances.worldEvents || d.worldEvents || null,
      colonies: this.instances.colonyExpansion?.registry?.getAllColonies?.() || [],
      frameScheduler: this.frameScheduler || null
    };
  }

  _resolveEnvironmentWorldContext() {
    if (!this.worldContextProvider) return null;
    try {
      const context = this.worldContextProvider();
      if (!context || typeof context !== 'object') return null;
      return {
        ...context,
        macroProfile: context.macroProfile ? { ...context.macroProfile } : null,
        worldContext: context.worldContext ? { ...context.worldContext } : null
      };
    } catch {
      return null;
    }
  }

  _buildEnvironmentWorldBinding(worldContext) {
    const macroState = String(worldContext?.worldMacroState || worldContext?.macroState || 'DORMANT').toUpperCase();
    const macroProfile = worldContext?.macroProfile || null;

    const moodBias = {
      calm: 0.08,
      pressure: 0.08,
      resonance: 0.08,
      stormBias: 0.08,
      ascensionHaze: 0.08
    };

    const stateBindings = {
      DORMANT: {
        weatherKey: 'calm',
        moodBias: { calm: 0.98, pressure: 0.06, resonance: 0.05, stormBias: 0.02, ascensionHaze: 0.04 }
      },
      AWAKENING: {
        weatherKey: 'pressure',
        moodBias: { calm: 0.16, pressure: 1.0, resonance: 0.12, stormBias: 0.08, ascensionHaze: 0.06 }
      },
      COMMUNION: {
        weatherKey: 'resonance',
        moodBias: { calm: 0.1, pressure: 0.1, resonance: 1.04, stormBias: 0.06, ascensionHaze: 0.16 }
      },
      SCHISM: {
        weatherKey: 'stormBias',
        moodBias: { calm: 0.06, pressure: 0.16, resonance: 0.14, stormBias: 1.08, ascensionHaze: 0.1 }
      },
      REVELATION: {
        weatherKey: 'ascensionHaze',
        moodBias: { calm: 0.08, pressure: 0.08, resonance: 0.18, stormBias: 0.08, ascensionHaze: 1.1 }
      }
    };

    const binding = stateBindings[macroState] || stateBindings.DORMANT;
    const weatherMoodBias = { ...moodBias, ...(binding.moodBias || {}) };

    if (macroProfile) {
      weatherMoodBias.resonance += (macroProfile.particleScale ?? 0) * 0.03;
      weatherMoodBias.stormBias += (macroProfile.distortionScale ?? 0) * 0.03;
      weatherMoodBias.ascensionHaze += (macroProfile.cameraAuraScale ?? 0) * 0.04;
      weatherMoodBias.pressure += (macroProfile.fogScale ?? 0) * 0.02;
    }

    return {
      worldContext,
      macroState,
      weatherKey: binding.weatherKey,
      weatherMoodBias,
      macroProfile
    };
  }

  _syncEnvironmentWorldContext(worldBinding = null) {
    const binding = worldBinding || this._buildEnvironmentWorldBinding(this._resolveEnvironmentWorldContext());
    const worldContext = binding?.worldContext || null;

    if (this.instances.worldFXPack && typeof this.instances.worldFXPack.setWorldContext === 'function') {
      this.instances.worldFXPack.setWorldContext(worldContext);
    }

    if (this.instances.weatherPack && typeof this.instances.weatherPack.setWorldContext === 'function') {
      this.instances.weatherPack.setWorldContext(worldContext);
    }

    return binding;
  }

  _wireDreamDepthScheduler() {
    const safe = this.instances.safeDreamDepthPack;
    const rich = this.instances.dreamDepthEffectManager;

    if (rich && typeof rich.setFrameScheduler === 'function') {
      rich.setFrameScheduler(this.frameScheduler);
    }

    this._installDreamDepthDebugBridge();
  }

  _syncDreamDepthInputs(worldBinding = null) {
    const worldSystems = this._buildDreamDepthWorldSystems();
    const safe = this.instances.safeDreamDepthPack;
    const rich = this.instances.dreamDepthEffectManager;
    const weatherKey = worldSystems.weatherRegistry?.currentWeather || worldBinding?.weatherKey || null;

    if (weatherKey) {
      if (safe && typeof safe.setWeatherCondition === 'function') {
        safe.setWeatherCondition(weatherKey);
      }
      if (rich && typeof rich.setWeatherCondition === 'function') {
        rich.setWeatherCondition(weatherKey);
      }
    }

    const targets = this._gatherDreamDepthFocusTargets(worldSystems);
    if (safe && typeof safe.setFocusTargets === 'function') {
      safe.setFocusTargets(targets);
    }
    if (rich && typeof rich.setFocusTargets === 'function') {
      rich.setFocusTargets(targets);
    }
  }

  _gatherDreamDepthFocusTargets(worldSystems) {
    const targets = [];

    if (worldSystems.aiNodes?.nodes) {
      for (const node of worldSystems.aiNodes.nodes) {
        if (node?.position) targets.push(node);
      }
    }

    if (worldSystems.legendaryRegistry?.nodes) {
      for (const nodeId in worldSystems.legendaryRegistry.nodes) {
        const node = worldSystems.legendaryRegistry.nodes[nodeId];
        if (node?.position) targets.push(node);
      }
    }

    if (worldSystems.colonies) {
      for (const colony of worldSystems.colonies) {
        if (colony?.center) targets.push({ position: colony.center });
      }
    }

    return targets;
  }

  _updateDreamDepthPair(dt, worldSystems, worldBinding = null) {
    const safe = this.instances.safeDreamDepthPack;
    const rich = this.instances.dreamDepthEffectManager;

    this._syncDreamDepthInputs(worldBinding);

    if (safe && typeof safe.update === 'function') {
      safe.update(dt, worldSystems);
    }
    if (rich && typeof rich.update === 'function') {
      rich.update(dt);
    }
  }

  setDreamDepthWeatherCondition(weatherKey) {
    const safe = this.instances.safeDreamDepthPack;
    const rich = this.instances.dreamDepthEffectManager;
    if (safe && typeof safe.setWeatherCondition === 'function') {
      safe.setWeatherCondition(weatherKey);
    }
    if (rich && typeof rich.setWeatherCondition === 'function') {
      rich.setWeatherCondition(weatherKey);
    }
  }

  setDreamDepthFocusTargets(targets) {
    const safe = this.instances.safeDreamDepthPack;
    const rich = this.instances.dreamDepthEffectManager;
    if (safe && typeof safe.setFocusTargets === 'function') {
      safe.setFocusTargets(targets);
    }
    if (rich && typeof rich.setFocusTargets === 'function') {
      rich.setFocusTargets(targets);
    }
  }

  onDreamDepthWorldEvent(eventType) {
    const safe = this.instances.safeDreamDepthPack;
    const rich = this.instances.dreamDepthEffectManager;
    if (safe && typeof safe.onWorldEvent === 'function') {
      safe.onWorldEvent(eventType);
    }
    if (rich && typeof rich.onWorldEvent === 'function') {
      rich.onWorldEvent(eventType);
    }
  }

  getDreamDepthDebugInfo() {
    const safe = this.instances.safeDreamDepthPack;
    const rich = this.instances.dreamDepthEffectManager;
    const safeInfo = safe && typeof safe.getDebugInfo === 'function'
      ? safe.getDebugInfo()
      : null;
    const richInfo = rich && typeof rich.getDebugInfo === 'function'
      ? rich.getDebugInfo()
      : null;
    const source = safeInfo || richInfo;

    return {
      activeMode: richInfo ? 'rich-primary' : (safeInfo ? 'low-cost-fallback' : 'none'),
      shared: {
        currentWeatherKey: source?.currentWeatherKey ?? 'none',
        currentWorldEvent: source?.currentWorldEvent ?? 'none',
        currentFocus: source?.currentFocus ?? 'none',
        focusTransition: source?.focusTransition ?? 0,
        pulseCount: source?.pulseCount ?? 0,
        schedulerState: source?.schedulerState ?? 'missing',
        stabilityFactor: source?.stabilityFactor ?? 0
      },
      safe: safeInfo || { role: 'low-cost-fallback', enabled: false, note: 'not-instantiated' },
      rich: richInfo || { role: 'rich-primary', enabled: false, note: 'not-instantiated' }
    };
  }

  _installDreamDepthDebugBridge() {
    if (typeof window === 'undefined') return;
    if (!window.__DEBUG) window.__DEBUG = {};
    window.__DEBUG.getDreamDepthDebugInfo = () => this.getDreamDepthDebugInfo();
  }

  _teardownDreamDepthDebugBridge() {
    if (typeof window === 'undefined') return;
    if (window.__DEBUG?.getDreamDepthDebugInfo) {
      delete window.__DEBUG.getDreamDepthDebugInfo;
    }
  }
}
