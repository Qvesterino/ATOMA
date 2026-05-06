import * as THREE from 'three';
import { AmbientEntityRegistry } from './_AmbientEntityRegistry.js';
import { ATOMAColorPalette } from './Engine/Visual/ATOMAColorPalette.js';
import eventRegistrationRegistry from './Engine/EventRegistrationRegistry.js';

/**
 * AMBIENT ENTITY MANAGER
 * 
 * Manages holographic VFX entities: ghost orbs, spectres, swarms, phantoms, wisps.
 * 
 * SAFETY: 100% VFX-only, ZERO gameplay interaction
 * - No physics, no collisions
 * - No engine modifications
 * - All visuals are overlays
 * - <1ms overhead per frame
 */

export class AmbientEntityManager {
  constructor(scene, environmentRoot, camera, frameScheduler = null, options = {}) {
    this.scene = scene;
    this.root = environmentRoot || scene; // fallback to scene for backward compatibility
    this.camera = camera;
    this.frameScheduler = frameScheduler;
    this.debug = options.debug || false;
    this.semanticBus = options.semanticBus || null;
    this.controllerWorldContext = null;
    this.atmosphereProfile = null;
    this.atmosphereState = {
      macroState: 'DORMANT',
      weatherKey: 'calm',
      calm: 0.78,
      pressure: 0.12,
      resonance: 0.2,
      fracture: 0.08,
      ascension: 0.06
    };
    this._ambientOwner = 'AmbientEntityManager';
    this._semanticWindows = {
      global: new Map(),
      colonies: new Map()
    };
    this._pendingSemanticSpawns = [];
    this._semanticSpawnCooldowns = new Map();
    
    // Registry for all entities
    this.registry = new AmbientEntityRegistry();
    
    // Entity VFX container
    this.vfxContainer = new THREE.Group();
    this.vfxContainer.name = 'AmbientEntities';
    this.root.add(this.vfxContainer);
    
    // Entity meshes and particles
    this.entityMeshes = {}; // id -> mesh/group
    this.entityParticles = {}; // id -> particles array
    this.entityTrailParticles = {}; // id -> fragment trails
    this.sharedGeometryCache = new Map();
    this.sharedGeometrySet = new Set();
    this._tempColorA = new THREE.Color();
    this._tempColorB = new THREE.Color();
    this._tempColorC = new THREE.Color();
    this._tempColorD = new THREE.Color();
    this._tempVectorA = new THREE.Vector3();
    this._tempVectorB = new THREE.Vector3();
    this._tempVectorC = new THREE.Vector3();
    
    // Spawning
    this.spawnChance = 0.003; // 0.3% per second
    this.lastSpawnTime = Date.now();
    this.spawnCooldown = 100; // ms between spawn attempts
    this.maxEntities = 30;
    
    // Phase B pilot: throttle ambient interpretation (mood) to ~4 Hz; visuals/motion stay 60 Hz (aligned with weatherPack pilot)
    this.interpretationInterval = 0.25;
    this.interpretationAccumulator = this.interpretationInterval; // prime for first-frame interpretation
    this.interpretationState = {
      canSpawnFromWeather: false,
      canSpawnFromLegendary: false,
      canSpawnFromEvents: false
    };
    
    // Read-only references to world systems
    this.worldSystems = {
      legendaryPack: null,
      worldEvents: null,
      weatherPack: null,
      linkingSystem: null,
      colonyExpansion: null,
      synergy: 0
    };
    
    // Timing and performance
    this.updateTimer = 0;
    this.particleUpdateInterval = 0.016; // Update particles every frame

    // ATOMA ambient palette — Single Source of Truth from ATOMAColorPalette
    this.ambientPalette = ATOMAColorPalette.ATOMA_CORE;
  }

  _getSharedGeometry(key, factory) {
    if (this.sharedGeometryCache.has(key)) {
      return this.sharedGeometryCache.get(key);
    }

    const geometry = factory();
    this.sharedGeometryCache.set(key, geometry);
    this.sharedGeometrySet.add(geometry);
    return geometry;
  }
  
  /**
   * Register world systems (read-only)
   */
  registerWorldSystems(legendary, events, weather, linking, colonyExpansion = null) {
    const config = this._normalizeWorldSystemRegistration(
      legendary,
      events,
      weather,
      linking,
      colonyExpansion
    );

    this.worldSystems.legendaryPack = config.legendaryPack;
    this.worldSystems.worldEvents = config.worldEvents;
    this.worldSystems.weatherPack = config.weatherPack;
    this.worldSystems.linkingSystem = config.linkingSystem;
    this.worldSystems.colonyExpansion = config.colonyExpansion;

    if (config.semanticBus) {
      this.attachSemanticBus(config.semanticBus);
    } else if (!this.semanticBus) {
      this.attachSemanticBus(this._resolveSemanticBus());
    }

    if (config.worldContext) {
      this.setEnvironmentWorldContext(config.worldContext);
    } else if (config.atmosphereProfile) {
      this.setAtmosphereProfile(config.atmosphereProfile);
    }

    // Keep interpretation snapshot aligned with current inputs
    this.refreshAmbientInterpretation();
  }
  
  /**
   * Update synergy level (for entity spawning/behavior)
   */
  updateSynergy(synergy) {
    this.worldSystems.synergy = synergy;
  }

  _normalizeWorldSystemRegistration(legendary, events, weather, linking, colonyExpansion) {
    if (
      legendary &&
      typeof legendary === 'object' &&
      (
        'legendaryPack' in legendary ||
        'worldEvents' in legendary ||
        'weatherPack' in legendary ||
        'linkingSystem' in legendary ||
        'colonyExpansion' in legendary ||
        'semanticBus' in legendary ||
        'atmosphereProfile' in legendary ||
        'worldContext' in legendary
      )
    ) {
      return {
        legendaryPack: legendary.legendaryPack || null,
        worldEvents: legendary.worldEvents || null,
        weatherPack: legendary.weatherPack || null,
        linkingSystem: legendary.linkingSystem || null,
        colonyExpansion: legendary.colonyExpansion || null,
        semanticBus: legendary.semanticBus || null,
        atmosphereProfile: legendary.atmosphereProfile || null,
        worldContext: legendary.worldContext || null
      };
    }

    return {
      legendaryPack: legendary || null,
      worldEvents: events || null,
      weatherPack: weather || null,
      linkingSystem: linking || null,
      colonyExpansion: colonyExpansion || null,
      semanticBus: null,
      atmosphereProfile: null,
      worldContext: null
    };
  }

  attachSemanticBus(bus) {
    const nextBus = bus || null;
    if (this.semanticBus === nextBus) return;

    eventRegistrationRegistry.disposeOwner(this._ambientOwner);
    this.semanticBus = nextBus;
    this._bindSemanticEvents();
  }

  _resolveSemanticBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }
    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _bindSemanticEvents() {
    if (!this.semanticBus) return;

    const tags = [
      'environment.colony.birth',
      'environment.colony.growth',
      'environment.colony.merge.complete',
      'environment.colony.split.complete',
      'environment.colony.transform',
      'environment.colony.rebirth',
      'environment.colony.mood.changed',
      'environment.colony.pressure.active',
      'global.synergy.mid',
      'global.synergy.high',
      'global.harmony.mid',
      'global.harmony.high',
      'global.stability.mid',
      'global.stability.high',
      'global.corruption.mid',
      'global.corruption.high',
      'global.loadPressure.mid',
      'global.loadPressure.high'
    ];

    for (const tag of tags) {
      eventRegistrationRegistry.register(
        this._ambientOwner,
        tag,
        (payload = {}) => this._handleSemanticEvent(tag, payload),
        this.semanticBus
      );
    }
  }

  setAtmosphereProfile(profile) {
    const nextProfile = profile && typeof profile === 'object'
      ? {
          ...profile,
          vector: profile.vector ? { ...profile.vector } : null
        }
      : null;

    this.atmosphereProfile = nextProfile;
    const vector = nextProfile?.vector || {};
    this.atmosphereState = {
      macroState: nextProfile?.macroState || 'DORMANT',
      weatherKey: nextProfile?.weatherKey || 'calm',
      calm: THREE.MathUtils.clamp(vector.calm ?? 0.78, 0, 1),
      pressure: THREE.MathUtils.clamp(vector.pressure ?? 0.12, 0, 1),
      resonance: THREE.MathUtils.clamp(vector.resonance ?? 0.2, 0, 1),
      fracture: THREE.MathUtils.clamp(vector.fracture ?? 0.08, 0, 1),
      ascension: THREE.MathUtils.clamp(vector.ascension ?? 0.06, 0, 1)
    };
  }

  setEnvironmentWorldContext(worldContext) {
    this.controllerWorldContext = worldContext && typeof worldContext === 'object'
      ? {
          ...worldContext,
          releaseAtmosphere: worldContext.releaseAtmosphere
            ? {
                ...worldContext.releaseAtmosphere,
                vector: worldContext.releaseAtmosphere.vector
                  ? { ...worldContext.releaseAtmosphere.vector }
                  : null
              }
            : null
        }
      : null;

    this.setAtmosphereProfile(this.controllerWorldContext?.releaseAtmosphere || null);
  }

  /**
   * Low-frequency ambient interpretation (Phase B pilot)
   */
  refreshAmbientInterpretation() {
    this._pruneSemanticWindows();

    const activeWeather = this.worldSystems.weatherPack?.getActiveWeather?.();
    this.interpretationState.canSpawnFromWeather = Array.isArray(activeWeather) && activeWeather.length > 0;

    this.interpretationState.canSpawnFromLegendary =
      this.worldSystems.legendaryPack?.getLegendaryNodeCount?.() > 0;

    const activeEvents = this.worldSystems.worldEvents?.getActiveEvents?.();
    this.interpretationState.canSpawnFromEvents = Array.isArray(activeEvents) && activeEvents.length > 0;

    // Ecosystem: cache colony and link state for behavior-driven spawning
    this._refreshColonySnapshot();
    this._refreshLinkSnapshot();
  }

  /**
   * Cache colony centers and moods for ecosystem behavior.
   */
  _refreshColonySnapshot() {
    const colonies = [];
    const registry = this.worldSystems.colonyExpansion?.registry;
    if (registry?.colonies) {
      for (const colonyId in registry.colonies) {
        const colony = registry.colonies[colonyId];
        if (colony?.center) {
          colonies.push({
            id: colonyId,
            center: colony.center,
            mood: colony.mood,
            moodNormalized: this._normalizeMood(colony.mood),
            stage: colony.stage,
            type: colony.type,
            energy: colony.energy || 0
          });
        }
      }
    }
    this._colonySnapshot = colonies;
  }

  /**
   * Cache active links for wisp traffic behavior.
   */
  _refreshLinkSnapshot() {
    const links = this.worldSystems.linkingSystem?.links || [];
    this._linkSnapshot = links
      .map((link) => this._resolveLinkEndpoints(link))
      .filter((link) => link && link.active !== false);
  }

  /**
   * Pick a random active link endpoint for wisp spawning.
   */
  _pickRandomLink() {
    if (!this._linkSnapshot?.length) return null;
    return this._linkSnapshot[Math.floor(Math.random() * this._linkSnapshot.length)];
  }

  _normalizeMood(mood) {
    const normalized = String(mood || 'HARMONY').toUpperCase();
    if (normalized === 'HOSTILE') return 'CORRUPTION';
    return normalized;
  }

  _clonePositionLike(position) {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) {
      return null;
    }
    return { x: position.x, y: position.y, z: position.z };
  }

  _resolveNodePositionRef(nodeRef) {
    const position = nodeRef?.position || nodeRef?.userData?.position || nodeRef || null;
    return this._clonePositionLike(position);
  }

  _resolveLinkEndpoints(link) {
    if (!link) return null;
    const start = this._resolveNodePositionRef(
      link.nodeA || link.sourceNode || link.source || link.from
    );
    const end = this._resolveNodePositionRef(
      link.nodeB || link.targetNode || link.target || link.to
    );

    if (!start || !end) return null;

    const dirX = end.x - start.x;
    const dirY = end.y - start.y;
    const dirZ = end.z - start.z;
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;

    return {
      raw: link,
      active: link.active,
      start,
      end,
      midpoint: {
        x: (start.x + end.x) * 0.5,
        y: (start.y + end.y) * 0.5,
        z: (start.z + end.z) * 0.5
      },
      direction: {
        x: dirX / length,
        y: dirY / length,
        z: dirZ / length
      },
      length
    };
  }

  _handleSemanticEvent(tag, payload = {}) {
    if (!tag) return;

    if (tag.startsWith('environment.colony.')) {
      this._applyColonySemanticWindow(tag, payload);
      this._queueSemanticSpawnFromEvent(tag, payload);
      return;
    }

    const globalMatch = tag.match(/^global\.(synergy|harmony|stability|corruption|loadPressure)\.(mid|high)$/);
    if (globalMatch) {
      const [, metric, tier] = globalMatch;
      this._applyGlobalSemanticWindow(metric, tier);
    }
  }

  _applyGlobalSemanticWindow(metric, tier) {
    const duration = tier === 'high' ? 10500 : 7000;
    const strength = tier === 'high' ? 0.95 : 0.58;
    const now = Date.now();
    const existing = this._semanticWindows.global.get(metric) || null;
    if (
      existing &&
      existing.expiresAt > now &&
      existing.tier === 'high' &&
      tier === 'mid'
    ) {
      existing.expiresAt = Math.max(existing.expiresAt, now + duration * 0.66);
      return;
    }

    this._semanticWindows.global.set(metric, {
      metric,
      tier,
      strength,
      expiresAt: now + duration
    });
  }

  _applyColonySemanticWindow(tag, payload = {}) {
    const colonyId = payload.colonyId;
    if (!colonyId) return;

    const eventDurations = {
      'environment.colony.birth': 9000,
      'environment.colony.growth': 6500,
      'environment.colony.merge.complete': 8000,
      'environment.colony.split.complete': 8000,
      'environment.colony.transform': 10000,
      'environment.colony.rebirth': 11000,
      'environment.colony.mood.changed': 7000,
      'environment.colony.pressure.active': 6000
    };

    const eventIntensities = {
      'environment.colony.birth': 0.82,
      'environment.colony.growth': 0.68,
      'environment.colony.merge.complete': 0.88,
      'environment.colony.split.complete': 0.76,
      'environment.colony.transform': 0.92,
      'environment.colony.rebirth': 1.0,
      'environment.colony.mood.changed': 0.62,
      'environment.colony.pressure.active': 0.9
    };

    const center = this._clonePositionLike(payload.center);
    if (!center) return;

    this._semanticWindows.colonies.set(colonyId, {
      colonyId,
      center,
      mood: this._normalizeMood(payload.mood),
      stage: Number.isFinite(payload.stage) ? payload.stage : 0,
      energy: Number.isFinite(payload.energy) ? payload.energy : 0,
      nodeCount: Number.isFinite(payload.nodeCount) ? payload.nodeCount : 0,
      pressureScore: Number.isFinite(payload.pressureScore) ? payload.pressureScore : 0,
      eventType: tag,
      intensity: eventIntensities[tag] ?? 0.64,
      expiresAt: Date.now() + (eventDurations[tag] ?? 6000)
    });
  }

  _queueSemanticSpawnFromEvent(tag, payload = {}) {
    const center = this._clonePositionLike(payload.center);
    if (!center) return;

    const cooldownKey = `${tag}:${payload.colonyId || 'global'}`;
    const now = Date.now();
    const lastQueuedAt = this._semanticSpawnCooldowns.get(cooldownKey) || 0;
    if (now - lastQueuedAt < 1400) return;
    this._semanticSpawnCooldowns.set(cooldownKey, now);

    const mood = this._normalizeMood(payload.mood);
    const types = this.registry.TYPES;
    let type = null;

    switch (tag) {
      case 'environment.colony.birth':
      case 'environment.colony.growth':
        type = mood === 'SYNERGY' ? types.QUANTUM_WISP : types.GHOST_ORB;
        break;
      case 'environment.colony.merge.complete':
        type = types.QUANTUM_WISP;
        break;
      case 'environment.colony.split.complete':
        type = types.FRAGMENT_SWARM;
        break;
      case 'environment.colony.transform':
      case 'environment.colony.rebirth':
        type = mood === 'CORRUPTION' ? types.AI_SPECTRE : types.GHOST_ORB;
        break;
      case 'environment.colony.pressure.active':
        type = mood === 'CORRUPTION' ? types.SIGMA_PHANTOM : types.QUANTUM_WISP;
        break;
      case 'environment.colony.mood.changed':
        if (mood === 'CORRUPTION') type = types.SIGMA_PHANTOM;
        else if (mood === 'LOAD_PRESSURE') type = types.QUANTUM_WISP;
        else type = types.GHOST_ORB;
        break;
      default:
        break;
    }

    if (!type) return;

    this._pendingSemanticSpawns.push({
      type,
      position: center,
      sourceTag: tag,
      mood,
      expiresAt: now + 2500
    });

    if (this._pendingSemanticSpawns.length > 12) {
      this._pendingSemanticSpawns.splice(0, this._pendingSemanticSpawns.length - 12);
    }
  }

  _pruneSemanticWindows(now = Date.now()) {
    for (const [metric, state] of this._semanticWindows.global.entries()) {
      if (!state || state.expiresAt <= now) {
        this._semanticWindows.global.delete(metric);
      }
    }

    for (const [colonyId, state] of this._semanticWindows.colonies.entries()) {
      if (!state || state.expiresAt <= now) {
        this._semanticWindows.colonies.delete(colonyId);
      }
    }

    this._pendingSemanticSpawns = this._pendingSemanticSpawns.filter((spawn) => spawn?.expiresAt > now);

    for (const [key, value] of this._semanticSpawnCooldowns.entries()) {
      if (now - value > 16000) {
        this._semanticSpawnCooldowns.delete(key);
      }
    }
  }

  _getMetricBiasStrength(metric) {
    const semanticStrength = this._semanticWindows.global.get(metric)?.strength ?? 0;
    const profileStrength = {
      harmony: this.atmosphereState.calm * 0.48 + this.atmosphereState.ascension * 0.22,
      synergy: this.atmosphereState.resonance * 0.54 + this.atmosphereState.ascension * 0.18,
      stability: this.atmosphereState.calm * 0.42,
      corruption: this.atmosphereState.fracture * 0.62,
      loadPressure: this.atmosphereState.pressure * 0.68
    }[metric] ?? 0;

    return THREE.MathUtils.clamp(Math.max(semanticStrength, profileStrength), 0, 1);
  }

  _getDominantColonyWindow(preferredMood = null) {
    this._pruneSemanticWindows();

    let strongest = null;
    for (const colonyState of this._semanticWindows.colonies.values()) {
      if (!colonyState) continue;
      if (preferredMood && colonyState.mood !== preferredMood) continue;
      if (!strongest || colonyState.intensity > strongest.intensity) {
        strongest = colonyState;
      }
    }

    if (!strongest && preferredMood) {
      return this._getDominantColonyWindow(null);
    }

    return strongest;
  }

  /**
   * Pick a colony center weighted by stage/energy.
   */
  _pickColonyCenter(preferMood = null) {
    if (!this._colonySnapshot?.length) return null;
    let candidates = this._colonySnapshot;
    if (preferMood) {
      const filtered = candidates.filter(c => c.mood === preferMood);
      if (filtered.length) candidates = filtered;
    }
    // Weight by stage + energy
    const weights = candidates.map(c => c.stage + c.energy / 100);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < candidates.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return candidates[i];
    }
    return candidates[0];
  }
  
  /**
   * Main update loop
   */
  update(deltaTime) {
    if (this.frameScheduler && typeof this.frameScheduler.shouldRunVisual === 'function') {
      if (!this.frameScheduler.shouldRunVisual()) return;
    }
    
    // Phase B pilot: mood/interpretation at ~4 Hz, ambient motion/visuals remain 60 Hz (mirrors weatherPack gating)
    this.interpretationAccumulator += deltaTime;
    const shouldRunInterpretation = this.interpretationAccumulator >= this.interpretationInterval;
    if (shouldRunInterpretation) {
      this.interpretationAccumulator = 0;
      this.refreshAmbientInterpretation();
    }
    
    // Attempt to spawn new entities
    this.updateSpawning();
    
    // Update all active entities
    this.updateAllEntities(deltaTime);
    
    // Update entity visuals
    this.updateEntityVisuals(deltaTime);
    
    // Handle despawning
    this.cleanupDespawnedEntities();
  }
  
  /**
   * Check if we should spawn a new entity — ECOSYSTEM DRIVEN.
   * Each entity type spawns in context of world state, not random Brownian.
   */
  updateSpawning() {
    this._pruneSemanticWindows();

    const now = Date.now();
    if (now - this.lastSpawnTime < this.spawnCooldown) {
      return;
    }

    this.lastSpawnTime = now;

    // Don't spawn if at max
    const activeCount = Object.values(this.registry.entities)
      .filter(e => e.isActive).length;
    if (activeCount >= this.maxEntities) {
      return;
    }

    if (this._spawnQueuedSemanticEntity()) {
      return;
    }

    // Random spawn chance
    if (Math.random() > this.spawnChance * this._getSpawnChanceMultiplier()) {
      return;
    }

    // Ecosystem: pick entity type based on world state, not pure random
    const type = this._selectEcosystemSpawnType();
    if (!type) return;

    // Ecosystem: pick spawn position based on entity type behavior
    const spawnPos = this._selectEcosystemSpawnPosition(type);
    if (!spawnPos) return;

    // Spawn entity with behavior context
    this.spawnEntity(type, spawnPos);
  }

  /**
   * Select entity type weighted by world state.
   */
  _selectEcosystemSpawnType() {
    const weights = new Map();
    const types = this.registry.TYPES;
    const harmonyBias = this._getMetricBiasStrength('harmony');
    const synergyBias = this._getMetricBiasStrength('synergy');
    const stabilityBias = this._getMetricBiasStrength('stability');
    const corruptionBias = this._getMetricBiasStrength('corruption');
    const loadPressureBias = this._getMetricBiasStrength('loadPressure');
    const colonyFocus = this._getDominantColonyWindow();

    // Ghost orbs: more likely when colonies exist
    const colonyCount = this._colonySnapshot?.length || 0;
    weights.set(types.GHOST_ORB, 0.3 + colonyCount * 0.15 + harmonyBias * 0.5 + stabilityBias * 0.2 + this.atmosphereState.calm * 0.18);

    // Quantum wisps: more likely when links exist
    const linkCount = this._linkSnapshot?.length || 0;
    weights.set(types.QUANTUM_WISP, 0.2 + Math.min(1, linkCount * 0.02) + synergyBias * 0.52 + loadPressureBias * 0.46 + this.atmosphereState.resonance * 0.2);

    // Sigma phantoms: more likely when corruption colonies exist
    const corruptionColonies = this._colonySnapshot?.filter(c => c.moodNormalized === 'CORRUPTION').length || 0;
    weights.set(types.SIGMA_PHANTOM, 0.15 + corruptionColonies * 0.25 + corruptionBias * 0.7 + this.atmosphereState.fracture * 0.28);

    // AI spectre: more likely when corruption or high-stage colonies exist
    const highStageColonies = this._colonySnapshot?.filter(c => c.stage >= 3).length || 0;
    weights.set(types.AI_SPECTRE, 0.1 + corruptionColonies * 0.2 + highStageColonies * 0.1 + loadPressureBias * 0.18 + corruptionBias * 0.24);

    // Fragment swarm: always possible, neutral
    weights.set(types.FRAGMENT_SWARM, 0.25 + stabilityBias * 0.16 + this.atmosphereState.resonance * 0.08);

    if (colonyFocus) {
      switch (colonyFocus.mood) {
        case 'SYNERGY':
          weights.set(types.QUANTUM_WISP, (weights.get(types.QUANTUM_WISP) || 0) + 0.45);
          weights.set(types.GHOST_ORB, (weights.get(types.GHOST_ORB) || 0) + 0.14);
          break;
        case 'HARMONY':
          weights.set(types.GHOST_ORB, (weights.get(types.GHOST_ORB) || 0) + 0.52);
          weights.set(types.FRAGMENT_SWARM, (weights.get(types.FRAGMENT_SWARM) || 0) + 0.08);
          break;
        case 'STABILITY':
          weights.set(types.GHOST_ORB, (weights.get(types.GHOST_ORB) || 0) + 0.18);
          weights.set(types.FRAGMENT_SWARM, (weights.get(types.FRAGMENT_SWARM) || 0) + 0.18);
          break;
        case 'LOAD_PRESSURE':
          weights.set(types.QUANTUM_WISP, (weights.get(types.QUANTUM_WISP) || 0) + 0.32);
          weights.set(types.AI_SPECTRE, (weights.get(types.AI_SPECTRE) || 0) + 0.18);
          break;
        case 'CORRUPTION':
          weights.set(types.SIGMA_PHANTOM, (weights.get(types.SIGMA_PHANTOM) || 0) + 0.42);
          weights.set(types.AI_SPECTRE, (weights.get(types.AI_SPECTRE) || 0) + 0.26);
          break;
      }
    }

    // Normalize and roll
    let total = 0;
    for (const w of weights.values()) total += w;
    let roll = Math.random() * total;
    for (const [type, weight] of weights) {
      roll -= weight;
      if (roll <= 0) return type;
    }
    return types.GHOST_ORB;
  }

  /**
   * Select spawn position based on entity type behavior context.
   */
  _selectEcosystemSpawnPosition(type) {
    const types = this.registry.TYPES;
    const colonyFocus = this._getDominantColonyWindow();

    // Ghost orbs: spawn near a colony center, offset for elliptical orbit
    if (type === types.GHOST_ORB) {
      const colony = this._pickColonyCenter(colonyFocus?.mood === 'CORRUPTION' ? null : colonyFocus?.mood);
      if (colony) {
        const orbitRadius = 3 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        return {
          x: colony.center.x + Math.cos(angle) * orbitRadius,
          y: colony.center.y + 0.5 + Math.random() * 2,
          z: colony.center.z + Math.sin(angle) * orbitRadius
        };
      }
    }

    // Quantum wisps: spawn at a link endpoint
    if (type === types.QUANTUM_WISP) {
      const link = this._pickPreferredLink(colonyFocus?.center || null);
      if (link?.start) {
        const pos = link.start;
        return {
          x: pos.x + (Math.random() - 0.5) * 2,
          y: pos.y + Math.random() * 2,
          z: pos.z + (Math.random() - 0.5) * 2
        };
      }
    }

    // Sigma phantoms: spawn near corruption colony edge
    if (type === types.SIGMA_PHANTOM) {
      const colony = this._pickColonyCenter('CORRUPTION');
      if (colony) {
        const guardRadius = 4 + Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        return {
          x: colony.center.x + Math.cos(angle) * guardRadius,
          y: colony.center.y + Math.random() * 1.5,
          z: colony.center.z + Math.sin(angle) * guardRadius
        };
      }
    }

    // AI spectre: spawn near high-stage or corruption colony
    if (type === types.AI_SPECTRE) {
      const colony = this._pickColonyCenter('CORRUPTION') || this._pickColonyCenter(colonyFocus?.mood || null) || this._pickColonyCenter();
      if (colony) {
        const scanRadius = 2 + Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        return {
          x: colony.center.x + Math.cos(angle) * scanRadius,
          y: colony.center.y + 1.5 + Math.random(),
          z: colony.center.z + Math.sin(angle) * scanRadius
        };
      }
    }

    // Fragment swarm: random around player (neutral)
    const playerPos = this.camera.position;
    const spawnDist = 10 + Math.random() * 30;
    const angle = Math.random() * Math.PI * 2;
    const height = -5 + Math.random() * 15;
    return {
      x: playerPos.x + Math.cos(angle) * spawnDist,
      y: playerPos.y + height,
      z: playerPos.z + Math.sin(angle) * spawnDist
    };
  }

  _getSpawnChanceMultiplier() {
    const pressure = this._getMetricBiasStrength('loadPressure');
    const harmony = this._getMetricBiasStrength('harmony');
    const synergy = this._getMetricBiasStrength('synergy');
    const colonyBoost = this._getDominantColonyWindow() ? 0.16 : 0;
    const profileBoost = this.atmosphereState.resonance * 0.18 + this.atmosphereState.pressure * 0.22;
    return THREE.MathUtils.clamp(0.92 + pressure * 0.36 + harmony * 0.12 + synergy * 0.14 + colonyBoost + profileBoost, 0.85, 1.75);
  }

  _spawnQueuedSemanticEntity() {
    if (!this._pendingSemanticSpawns.length) return false;
    const spawn = this._pendingSemanticSpawns.shift();
    if (!spawn) return false;

    const position = this._selectSemanticSpawnPosition(spawn);
    if (!position) return false;

    this.spawnEntity(spawn.type, position, {
      semanticOrigin: spawn.sourceTag || 'semantic',
      spawnMood: spawn.mood || null
    });
    return true;
  }

  _selectSemanticSpawnPosition(spawn) {
    const base = this._clonePositionLike(spawn.position);
    if (!base) return this._selectEcosystemSpawnPosition(spawn.type);

    const jitter = spawn.type === this.registry.TYPES.QUANTUM_WISP ? 1.3 : 2.4;
    return {
      x: base.x + (Math.random() - 0.5) * jitter,
      y: base.y + Math.random() * 1.8,
      z: base.z + (Math.random() - 0.5) * jitter
    };
  }
  
  /**
   * Spawn a new ambient entity
   */
  spawnEntity(type, position, overrides = {}) {
    const lifetime = 20 + Math.random() * 30; // 20-50s

    // ECOSYSTEM: behavior context per entity type
    const behaviorContext = this._buildBehaviorContext(type, position, overrides);

    const entity = this.registry.createEntity(type, position, {
      velocity: behaviorContext.velocity,
      lifetime: overrides.lifetime || lifetime,
      intensity: overrides.intensity || behaviorContext.intensity,
      userData: {
        behaviorContext,
        semanticOrigin: overrides.semanticOrigin || 'passive',
        spawnMood: overrides.spawnMood || null
      }
    });

    // Create visual representation
    this.createEntityVisuals(entity);
  }

  /**
   * Build behavior context for each entity type.
   * Replaces random Brownian motion with meaningful ecosystem behavior.
   */
  _buildBehaviorContext(type, position, overrides = {}) {
    const types = this.registry.TYPES;
    const colonyWindow = this._getDominantColonyWindow();

    // Ghost orb: elliptical orbit around nearest colony
    if (type === types.GHOST_ORB) {
      const colony = this._findNearestColony(position);
      if (colony) {
        const dx = position.x - colony.center.x;
        const dz = position.z - colony.center.z;
        const dist = Math.sqrt(dx * dx + dz * dz) || 1;
        const orbitSpeed = 0.3 + Math.random() * 0.4;
        const vx = -(dz / dist) * orbitSpeed;
        const vz = (dx / dist) * orbitSpeed;
        return {
          velocity: { x: vx, y: (Math.random() - 0.5) * 0.15, z: vz },
          intensity: 0.7 + Math.random() * 0.3,
          orbitCenter: { x: colony.center.x, y: colony.center.y, z: colony.center.z },
          orbitRadius: dist,
          orbitSpeed,
          orbitPhase: Math.atan2(dz, dx),
          orbitTilt: (Math.random() - 0.5) * 0.3,
          spawnMood: overrides.spawnMood || colony.moodNormalized || null,
          type: 'colony-orbit'
        };
      }
    }

    // Quantum wisp: flow along a link as energy packet
    if (type === types.QUANTUM_WISP) {
      const link = this._findNearestLink(position);
      if (link?.start && link?.end) {
        const flowSpeed = 1.2 + Math.random() * 1.5;
        return {
          velocity: {
            x: link.direction.x * flowSpeed,
            y: link.direction.y * flowSpeed,
            z: link.direction.z * flowSpeed
          },
          intensity: 0.8 + Math.random() * 0.2,
          linkStart: { ...link.start },
          linkEnd: { ...link.end },
          linkDirection: { ...link.direction },
          linkMidpoint: { ...link.midpoint },
          linkLength: link.length,
          flowSpeed,
          flowProgress: 0,
          spawnMood: overrides.spawnMood || colonyWindow?.mood || null,
          type: 'link-flow'
        };
      }
    }

    // Sigma phantom: guard corruption colony edge, mostly static
    if (type === types.SIGMA_PHANTOM) {
      const colony = this._findNearestColony(position, 'CORRUPTION');
      if (colony) {
        const dx = position.x - colony.center.x;
        const dz = position.z - colony.center.z;
        const dist = Math.sqrt(dx * dx + dz * dz) || 1;
        return {
          velocity: { x: 0, y: 0, z: 0 },
          intensity: 0.6 + Math.random() * 0.4,
          guardCenter: { x: colony.center.x, y: colony.center.y, z: colony.center.z },
          guardRadius: dist,
          guardAngle: Math.atan2(dz, dx),
          glitchIntensity: 0.3 + Math.random() * 0.5,
          spawnMood: overrides.spawnMood || colony.moodNormalized || 'CORRUPTION',
          type: 'corruption-guard'
        };
      }
    }

    // AI spectre: scan corruption or high-stage colony
    if (type === types.AI_SPECTRE) {
      const colony = this._findNearestColony(position, 'CORRUPTION')
        || this._findNearestColony(position);
      if (colony) {
        return {
          velocity: { x: 0, y: 0.05, z: 0 },
          intensity: 0.7 + Math.random() * 0.3,
          scanCenter: { x: colony.center.x, y: colony.center.y, z: colony.center.z },
          scanRadius: 2 + Math.random() * 3,
          scanPhase: Math.random() * Math.PI * 2,
          scanSpeed: 0.4 + Math.random() * 0.3,
          spawnMood: overrides.spawnMood || colony.moodNormalized || null,
          type: 'colony-scan'
        };
      }
    }

    // Fragment swarm: neutral, random Brownian
    return {
      velocity: {
        x: (Math.random() - 0.5) * 0.8,
        y: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.8
      },
      intensity: 0.5 + Math.random() * 0.5,
      spawnMood: overrides.spawnMood || null,
      type: 'neutral-swarm'
    };
  }

  /**
   * Find nearest colony to a position, optionally filtered by mood.
   */
  _findNearestColony(position, preferMood = null) {
    if (!this._colonySnapshot?.length) return null;
    let candidates = this._colonySnapshot;
    if (preferMood) {
      const moodKey = this._normalizeMood(preferMood);
      const filtered = candidates.filter(c => c.moodNormalized === moodKey);
      if (filtered.length) candidates = filtered;
    }
    let nearest = null;
    let nearestDist = Infinity;
    for (const colony of candidates) {
      const dx = colony.center.x - position.x;
      const dy = colony.center.y - position.y;
      const dz = colony.center.z - position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = colony;
      }
    }
    return nearest;
  }

  /**
   * Find nearest link to a position.
   */
  _findNearestLink(position) {
    if (!this._linkSnapshot?.length) return null;
    let nearest = null;
    let nearestDist = Infinity;
    for (const link of this._linkSnapshot) {
      const dx = link.midpoint.x - position.x;
      const dy = link.midpoint.y - position.y;
      const dz = link.midpoint.z - position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = link;
      }
    }
    return nearest;
  }

  _pickPreferredLink(focusCenter = null) {
    if (!this._linkSnapshot?.length) return null;
    if (!focusCenter) return this._pickRandomLink();

    let nearest = null;
    let nearestDist = Infinity;
    for (const link of this._linkSnapshot) {
      const dx = link.midpoint.x - focusCenter.x;
      const dy = link.midpoint.y - focusCenter.y;
      const dz = link.midpoint.z - focusCenter.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = link;
      }
    }

    return nearest || this._pickRandomLink();
  }
  
  /**
   * Create visual mesh for entity
   */
  createEntityVisuals(entity) {
    let mesh = null;
    
    switch (entity.type) {
      case this.registry.TYPES.GHOST_ORB:
        mesh = this.createGhostOrb(entity);
        break;
      case this.registry.TYPES.AI_SPECTRE:
        mesh = this.createAISpectre(entity);
        break;
      case this.registry.TYPES.FRAGMENT_SWARM:
        mesh = this.createFragmentSwarm(entity);
        break;
      case this.registry.TYPES.SIGMA_PHANTOM:
        mesh = this.createSigmaPhantom(entity);
        break;
      case this.registry.TYPES.QUANTUM_WISP:
        mesh = this.createQuantumWisp(entity);
        break;
    }
    
    if (mesh) {
      this.vfxContainer.add(mesh);
      mesh.position.copy(entity.position);
      this.entityMeshes[entity.id] = mesh;
      entity.vfxContainer = mesh;
    }
  }
  
  /**
   * Create Ghost Orb - layered ethereal glow with animated geometry
   */
  createGhostOrb(entity) {
    const group = new THREE.Group();

    // Outer atmospheric shell — soft BackSide glow
    const outerGeo = this._getSharedGeometry('ghostOrb.outer', () => new THREE.IcosahedronGeometry(0.55, 2));
    const outerMat = new THREE.MeshBasicMaterial({
      color: this.ambientPalette.midnight,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.name = 'outerShell';
    group.add(outer);

    // Mid-layer wireframe icosahedron — rotating cage of light
    const midGeo = this._getSharedGeometry('ghostOrb.mid', () => new THREE.IcosahedronGeometry(0.3, 1));
    const midMat = new THREE.MeshBasicMaterial({
      color: this.ambientPalette.violet,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mid = new THREE.Mesh(midGeo, midMat);
    mid.name = 'midCage';
    group.add(mid);

    // Inner core — soft pulsing point light
    const coreGeo = this._getSharedGeometry('ghostOrb.core', () => new THREE.IcosahedronGeometry(0.1, 2));
    const coreMat = new THREE.MeshBasicMaterial({
      color: this.ambientPalette.frost,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.name = 'innerCore';
    group.add(core);

    // Secondary ring orbit — thin torus for depth
    const ringGeo = this._getSharedGeometry('ghostOrb.ring', () => new THREE.TorusGeometry(0.35, 0.008, 8, 32));
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.ambientPalette.steel,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'orbitRing';
    ring.rotation.x = Math.PI * 0.5;
    group.add(ring);

    const haloGeo = this._getSharedGeometry('ghostOrb.halo', () => new THREE.TorusGeometry(0.48, 0.012, 10, 48));
    const haloMat = new THREE.MeshBasicMaterial({
      color: this.ambientPalette.haze,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.name = 'caretakerHalo';
    halo.rotation.z = Math.PI * 0.22;
    halo.rotation.x = Math.PI * 0.38;
    halo.userData.originalOpacity = haloMat.opacity;
    group.add(halo);

    group.userData.type = 'GHOST_ORB';
    group.userData.floatAmplitude = 0.2 + Math.random() * 0.3;
    group.userData.floatSpeed = 0.4 + Math.random() * 1.0;
    group.userData.floatTime = 0;

    return group;
  }
  
  /**
   * Create AI Spectre - holographic vertical scan figure with layered rings
   */
  createAISpectre(entity) {
    const group = new THREE.Group();

    // Multiple horizontal scan rings at different heights
    const ringCount = 5;
    for (let i = 0; i < ringCount; i++) {
      const y = (i / (ringCount - 1)) * 1.8 - 0.3;
      const radius = 0.15 + Math.sin((i / ringCount) * Math.PI) * 0.2;
      const ringGeo = this._getSharedGeometry(`spectre.ring.${radius.toFixed(3)}`, () => new THREE.TorusGeometry(radius, 0.012, 6, 24));
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.ambientPalette.indigo,
        transparent: true,
        opacity: 0.16 + (i % 2) * 0.05,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      ring.name = `scanRing_${i}`;
      group.add(ring);
    }

    // Vertical spine line
    const spineGeo = this._getSharedGeometry('spectre.spine', () => {
      const spinePoints = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        spinePoints.push(new THREE.Vector3(0, t * 2.0 - 0.3, 0));
      }
      return new THREE.BufferGeometry().setFromPoints(spinePoints);
    });
    const spineMat = new THREE.LineBasicMaterial({
      color: this.ambientPalette.steel,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const spine = new THREE.Line(spineGeo, spineMat);
    spine.name = 'spine';
    group.add(spine);

    // Scanline sweep plane
    const scanlineGeo = this._getSharedGeometry('spectre.scanline', () => this._createAmbientStripGeometry(0.6, 0.04, {
      segments: 6,
      taper: 0.18,
      arch: 0.08,
      wobble: 0.02,
      skew: 0.01,
      phase: 0.14
    }));
    const scanlineMat = new THREE.MeshBasicMaterial({
      color: this.ambientPalette.glowBlue,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const scanline = new THREE.Mesh(scanlineGeo, scanlineMat);
    scanline.name = 'scanline';
    scanline.position.y = 0.5;
    group.add(scanline);

    const haloGeo = this._getSharedGeometry('spectre.halo', () => new THREE.TorusGeometry(0.42, 0.01, 8, 36));
    const haloMat = new THREE.MeshBasicMaterial({
      color: this.ambientPalette.frost,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.name = 'scanHalo';
    halo.rotation.x = Math.PI * 0.5;
    halo.position.y = 0.72;
    halo.userData.originalOpacity = haloMat.opacity;
    group.add(halo);

    group.userData.type = 'AI_SPECTRE';
    group.userData.glitchTimer = 0;
    group.userData.glitchIntensity = 0;
    return group;
  }
  
  /**
   * Create Fragment Swarm - geometric shards
   */
  createFragmentSwarm(entity) {
    const SHAPES = {
      TETRAHEDRON: 0,
      OCTAHEDRON: 1,
      DODECAHEDRON: 2
    };

    const group = new THREE.Group();
    const fragmentCount = 20;
    entity.trailParticles = Array.from({ length: fragmentCount }, () => []);
    this.entityTrailParticles[entity.id] = entity.trailParticles;

    for (let i = 0; i < fragmentCount; i++) {
      let geometry;
      const shapeType = Math.floor(Math.random() * 3);
      const size = 0.08 + Math.random() * 0.15;
      const quantizedSize = Math.max(0.06, Math.round(size * 20) / 20);

      switch (shapeType) {
        case SHAPES.OCTAHEDRON:
          geometry = this._getSharedGeometry(`swarm.octa.${quantizedSize.toFixed(2)}`, () => new THREE.OctahedronGeometry(quantizedSize, 0));
          break;
        case SHAPES.DODECAHEDRON:
          geometry = this._getSharedGeometry(`swarm.dodeca.${(quantizedSize * 0.8).toFixed(2)}`, () => new THREE.DodecahedronGeometry(quantizedSize * 0.8, 0));
          break;
        default:
          geometry = this._getSharedGeometry(`swarm.tetra.${quantizedSize.toFixed(2)}`, () => new THREE.TetrahedronGeometry(quantizedSize, 0));
          break;
      }

      const distFactor = Math.random();
      const colorHex = this.lerpColor(0x22324f, 0x65538d, distFactor);
      const material = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const fragment = new THREE.Mesh(geometry, material);

      fragment.position.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );

      fragment.userData.basePos = fragment.position.clone();
      fragment.userData.orbitSpeed = 0.5 + Math.random() * 3.0;
      fragment.userData.orbitRadius = 1.0 + Math.random() * 1.5;
      fragment.userData.orbitPhase = Math.random() * Math.PI * 2;
      fragment.userData.orbitTilt = (Math.random() - 0.5) * 0.5;

      group.add(fragment);
    }

    group.userData.type = 'FRAGMENT_SWARM';
    group.userData.orbitTime = Math.random() * Math.PI * 2;
    group.userData.trailContainer = this.createTrailParticles(entity);
    group.add(group.userData.trailContainer);

    return group;
  }
  
  createTrailParticles(entity) {
    const trailContainer = new THREE.Group();
    trailContainer.userData.isTrailContainer = true;

    const particleGeometry = this._getSharedGeometry('trail.particle02', () => new THREE.SphereGeometry(0.02, 8, 8));
    for (let i = 0; i < 20; i++) {
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: this.ambientPalette.steel,
        transparent: true,
        opacity: 0.0
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.visible = false;
      particle.userData = { active: false, age: 0 };
      trailContainer.add(particle);
    }

    return trailContainer;
  }

  createWispTrailContainer(entity, streamCount) {
    const trailContainer = new THREE.Group();
    trailContainer.userData.isWispTrailContainer = true;

    const particleGeometry = this._getSharedGeometry('trail.particle03', () => new THREE.SphereGeometry(0.03, 8, 8));
    for (let streamIndex = 0; streamIndex < streamCount; streamIndex++) {
      for (let trailIndex = 0; trailIndex < 6; trailIndex++) {
        const particleMaterial = new THREE.MeshBasicMaterial({
          color: this.ambientPalette.ash,
          transparent: true,
          opacity: 0.0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.visible = false;
        particle.userData = { streamIndex, trailIndex, age: 0 };
        trailContainer.add(particle);
      }
    }

    return trailContainer;
  }

  lerpColor(a, b, t) {
    const colorA = new THREE.Color(a);
    const colorB = new THREE.Color(b);
    return colorA.lerp(colorB, t).getHex();
  }

  createEdgeGlow(geometry, color) {
    const edges = this._getSharedGeometry(`edgeGlow.${geometry.uuid}`, () => new THREE.EdgesGeometry(geometry));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.24
    });
    return new THREE.LineSegments(edges, lineMaterial);
  }

  _createAmbientStripGeometry(width, height, options = {}) {
    const safeWidth = Math.max(0.001, Math.abs(width));
    const safeHeight = Math.max(0.001, Math.abs(height));
    const halfWidth = safeWidth * 0.5;
    const halfHeight = safeHeight * 0.5;
    const segments = Math.max(4, options.segments ?? 6);
    const taper = options.taper ?? 0.26;
    const arch = options.arch ?? 0.16;
    const wobble = options.wobble ?? 0.04;
    const skew = options.skew ?? 0.03;
    const phase = options.phase ?? 0;
    const shape = new THREE.Shape();
    const lowerPoints = [];
    const upperPoints = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -halfWidth + safeWidth * t;
      const curve = Math.sin(Math.PI * t);
      const edgeFalloff = 1 - Math.pow(Math.abs(t - 0.5) * 2, 1.18) * taper;
      const shimmer = Math.sin((t * Math.PI * 2) + phase) * wobble;
      const tilt = Math.cos((t * Math.PI * 2.6) + phase * 0.5) * skew;

      lowerPoints.push({
        x: x + tilt * halfWidth * 0.04,
        y: -halfHeight * edgeFalloff - curve * halfHeight * arch + shimmer * halfHeight * 0.14
      });
      upperPoints.push({
        x: x - tilt * halfWidth * 0.04,
        y: halfHeight * edgeFalloff + curve * halfHeight * (arch * 0.72) + shimmer * halfHeight * 0.1
      });
    }

    shape.moveTo(lowerPoints[0].x, lowerPoints[0].y);
    for (let i = 1; i < lowerPoints.length; i++) {
      shape.lineTo(lowerPoints[i].x, lowerPoints[i].y);
    }
    for (let i = upperPoints.length - 1; i >= 0; i--) {
      shape.lineTo(upperPoints[i].x, upperPoints[i].y);
    }
    shape.closePath();

    return new THREE.ShapeGeometry(shape);
  }

  perlinNoise(x, y, z) {
    return Math.sin(x) * Math.cos(y) * Math.sin(z);
  }

  /**
   * Create Sigma Phantom - pixelated humanoid outline
   */
  createSigmaPhantom(entity) {
    const group = new THREE.Group();
    
    // Pixelated body made of boxes
    const pixelSize = 0.5;
    const material = new THREE.MeshBasicMaterial({
      color: this.ambientPalette.violet,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Head
    const headGeo = this._getSharedGeometry('phantom.head', () => new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize));
    const head = new THREE.Mesh(headGeo, material.clone());
    head.position.y = 1.5;
    head.name = 'head';
    group.add(head);

    // Body
    const bodyGeo = this._getSharedGeometry('phantom.body', () => new THREE.BoxGeometry(pixelSize * 0.8, pixelSize * 2.0, pixelSize));
    const body = new THREE.Mesh(bodyGeo, material.clone());
    body.position.y = 0.3;
    body.name = 'body';
    group.add(body);

    // Arms
    for (let side of [-1, 1]) {
      const armGeo = this._getSharedGeometry('phantom.arm', () => new THREE.BoxGeometry(pixelSize * 0.4, pixelSize * 1.2, pixelSize));
      const arm = new THREE.Mesh(armGeo, material.clone());
      arm.position.set(side * 0.7, -0.3, 0);
      arm.name = side === -1 ? 'leftArm' : 'rightArm';
      group.add(arm);
    }

    // Legs
    for (let side of [-1, 1]) {
      const legGeo = this._getSharedGeometry('phantom.leg', () => new THREE.BoxGeometry(pixelSize * 0.3, pixelSize * 1.2, pixelSize));
      const leg = new THREE.Mesh(legGeo, material.clone());
      leg.position.set(side * 0.25, -0.9, 0);
      leg.name = side === -1 ? 'leftLeg' : 'rightLeg';
      group.add(leg);
    }

    const parts = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    parts.forEach((partName) => {
      const part = group.getObjectByName(partName);
      if (part) {
        const glow = this.createEdgeGlow(part.geometry, this.ambientPalette.steel);
        glow.name = `${partName}_glow`;
        part.add(glow);
      }
    });

    group.userData.type = 'SIGMA_PHANTOM';
    group.userData.glitchTimer = Math.random() * 2;
    group.userData.noiseOffset = Math.random() * 1000;
    group.userData.noiseScale = 10.0;
    group.userData.fadeCycleTime = 0;
    group.userData.fadeDuration = 3.0;
    
    return group;
  }
  
  /**
   * Create Quantum Wisp - ribbon-like energy streak
   */
  createQuantumWisp(entity) {
    const group = new THREE.Group();
    const streamCount = 5;
    entity.streamTrails = Array.from({ length: streamCount }, () => []);
    entity.streamCurves = [];

    const basePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.5, 0.3, 0.2),
      new THREE.Vector3(1, 0.5, -0.3),
      new THREE.Vector3(1.2, 0, -0.8)
    ];

    for (let i = 0; i < streamCount; i++) {
      const offset = (i - 2) * 0.15;
      const curve = new THREE.CatmullRomCurve3([
        basePoints[0].clone(),
        basePoints[1].clone().add(new THREE.Vector3(0, 0, offset * 0.4)),
        basePoints[2].clone().add(new THREE.Vector3(0, 0, offset * 0.6)),
        basePoints[3].clone().add(new THREE.Vector3(0, 0, offset * 0.8))
      ]);
      entity.streamCurves.push(curve);

      const points = curve.getPoints(30);
      const positions = [];
      const colors = [];
      const streamColor = new THREE.Color(this.lerpColor(0x253553, 0x6a5694, i / (streamCount - 1)));

      points.forEach((point, index) => {
        positions.push(point.x, point.y, point.z);
        const centerProgress = Math.abs(index - (points.length - 1) / 2) / ((points.length - 1) / 2);
        const brighten = 0.25 + (1.0 - centerProgress) * 0.25;
        const vertexColor = streamColor.clone().lerp(new THREE.Color(this.ambientPalette.frost), brighten);
        colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.75 - Math.abs(offset) * 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const line = new THREE.Line(geometry, material);
      line.userData.streamIndex = i;
      line.userData.curve = curve;
      line.userData.offset = offset;
      line.userData.baseOpacity = material.opacity;
      line.userData.originalOpacity = material.opacity;
      group.add(line);
    }

    // Add ribbon-like planes
    const ribbonGeo = this._getSharedGeometry('wisp.ribbon', () => this._createAmbientStripGeometry(0.3, 2, {
      segments: 8,
      taper: 0.34,
      arch: 0.18,
      wobble: 0.05,
      skew: 0.03,
      phase: 0.78
    }));
    for (let i = 0; i < 2; i++) {
      const ribbonMat = new THREE.MeshBasicMaterial({
        color: this.ambientPalette.haze,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.rotation.y = Math.PI * 0.5 + i * 0.4;
      ribbon.position.x = (i === 0 ? -0.1 : 0.1);
      ribbon.userData.originalOpacity = ribbonMat.opacity;
      group.add(ribbon);
    }

    group.userData.type = 'QUANTUM_WISP';
    group.userData.waveTime = 0;
    group.userData.streamCount = streamCount;
    group.userData.trailContainer = this.createWispTrailContainer(entity, streamCount);
    group.add(group.userData.trailContainer);

    return group;
  }
  
  /**
   * Update all active entities
   */
  updateAllEntities(deltaTime) {
    const entities = this.registry.getAllEntities();

    for (let entity of entities) {
      const expired = this.registry.updateEntityAge(entity.id, deltaTime);
      if (expired) continue;

      const behavior = this._getBehaviorContext(entity);
      if (behavior) {
        this._applyBehaviorMovement(entity, behavior, deltaTime);
      } else {
        // Legacy fallback: simple velocity integration
        entity.position.x += entity.velocity.x * deltaTime;
        entity.position.y += entity.velocity.y * deltaTime;
        entity.position.z += entity.velocity.z * deltaTime;
      }

      // Apply ecosystem forces (colony attraction, link flow, corruption repulsion)
      this.applyWorldForces(entity, deltaTime);

      const mesh = this.entityMeshes[entity.id];
      if (mesh) {
        mesh.position.copy(entity.position);
      }
    }
  }

  _getBehaviorContext(entity) {
    const behavior = entity?.userData?.behaviorContext || null;
    if (behavior && typeof behavior === 'object') return behavior;

    const legacyBehavior = entity?.userData;
    if (legacyBehavior && typeof legacyBehavior === 'object' && typeof legacyBehavior.behavior === 'string') {
      legacyBehavior.type = legacyBehavior.type || legacyBehavior.behavior;
      return legacyBehavior;
    }
    return null;
  }

  /**
   * Apply behavior-driven movement based on entity type and context
   */
  _applyBehaviorMovement(entity, behavior, deltaTime) {
    const pos = entity.position;
    const vel = entity.velocity;

    switch (behavior.type) {
      case 'colony-orbit': {
        // Elliptical orbit around colony center
        const center = behavior.orbitCenter;
        const radius = behavior.orbitRadius;
        const speed = behavior.orbitSpeed;
        let phase = behavior.orbitPhase;
        phase += speed * deltaTime;
        behavior.orbitPhase = phase;

        const targetX = center.x + Math.cos(phase) * radius;
        const targetZ = center.z + Math.sin(phase) * radius * 0.7; // elliptical
        const targetY = center.y + Math.sin(phase * 2.1) * (radius * 0.15);

        // Smooth steering toward orbit target
        vel.x += (targetX - pos.x) * 1.2 - vel.x * 0.6;
        vel.z += (targetZ - pos.z) * 1.2 - vel.z * 0.6;
        vel.y += (targetY - pos.y) * 0.8 - vel.y * 0.5;

        pos.x += vel.x * deltaTime;
        pos.y += vel.y * deltaTime;
        pos.z += vel.z * deltaTime;
        break;
      }

      case 'link-flow': {
        // Flow along link direction with slight sinusoidal drift
        const dir = behavior.linkDirection;
        const speed = behavior.flowSpeed;
        let progress = behavior.flowProgress;
        progress += speed * deltaTime;
        behavior.flowProgress = progress;

        // Primary flow along link
        vel.x = dir.x * speed * 2.0;
        vel.y = dir.y * speed * 2.0;
        vel.z = dir.z * speed * 2.0;

        // Perpendicular drift (ribbon-like sine wave)
        const driftPhase = progress * 3.0;
        const perpX = -dir.z;
        const perpZ = dir.x;
        vel.x += perpX * Math.sin(driftPhase) * speed * 0.4;
        vel.z += perpZ * Math.sin(driftPhase) * speed * 0.4;
        vel.y += Math.cos(driftPhase * 1.3) * speed * 0.25;

        pos.x += vel.x * deltaTime;
        pos.y += vel.y * deltaTime;
        pos.z += vel.z * deltaTime;

        // Reset if flowed too far from link midpoint
        if (behavior.linkMidpoint) {
          const dx = pos.x - behavior.linkMidpoint.x;
          const dy = pos.y - behavior.linkMidpoint.y;
          const dz = pos.z - behavior.linkMidpoint.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > behavior.linkLength * 0.7) {
            // Teleport back to start of flow
            pos.x = behavior.linkStart.x;
            pos.y = behavior.linkStart.y;
            pos.z = behavior.linkStart.z;
            behavior.flowProgress = 0;
          }
        }
        break;
      }

      case 'corruption-guard': {
        // Drift around guard center, staying within guard radius
        const center = behavior.guardCenter;
        const radius = behavior.guardRadius;
        const intensity = behavior.glitchIntensity;

        // Erratic drift with high frequency noise
        const noiseT = Date.now() * 0.001 * intensity;
        const driftX = (Math.sin(noiseT * 3.7) + Math.sin(noiseT * 7.3) * 0.5) * radius * 0.3;
        const driftZ = (Math.cos(noiseT * 4.1) + Math.cos(noiseT * 6.7) * 0.5) * radius * 0.3;
        const driftY = Math.sin(noiseT * 5.3) * radius * 0.15;

        const targetX = center.x + driftX;
        const targetZ = center.z + driftZ;
        const targetY = center.y + driftY;

        // Snap toward target with glitchy overshoot
        vel.x += (targetX - pos.x) * 1.5 - vel.x * 0.4;
        vel.z += (targetZ - pos.z) * 1.5 - vel.z * 0.4;
        vel.y += (targetY - pos.y) * 1.0 - vel.y * 0.4;

        pos.x += vel.x * deltaTime;
        pos.y += vel.y * deltaTime;
        pos.z += vel.z * deltaTime;
        break;
      }

      case 'colony-scan': {
        // Circular scan around colony center at scan radius
        const center = behavior.scanCenter;
        const radius = behavior.scanRadius;
        const speed = behavior.scanSpeed;
        let phase = behavior.scanPhase || 0;
        phase += speed * deltaTime;
        behavior.scanPhase = phase;

        const targetX = center.x + Math.cos(phase) * radius;
        const targetZ = center.z + Math.sin(phase) * radius;
        const targetY = center.y + Math.sin(phase * 1.5) * (radius * 0.12);

        // Smooth patrol with slight hover
        vel.x += (targetX - pos.x) * 0.9 - vel.x * 0.5;
        vel.z += (targetZ - pos.z) * 0.9 - vel.z * 0.5;
        vel.y += (targetY - pos.y) * 0.6 - vel.y * 0.4;

        pos.x += vel.x * deltaTime;
        pos.y += vel.y * deltaTime;
        pos.z += vel.z * deltaTime;
        break;
      }

      case 'neutral-swarm':
      default: {
        // Brownian motion with velocity damping
        pos.x += vel.x * deltaTime;
        pos.y += vel.y * deltaTime;
        pos.z += vel.z * deltaTime;

        // Soft boundary: nudge back toward origin if too far
        const distFromOrigin = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        if (distFromOrigin > 40) {
          vel.x -= pos.x * 0.002;
          vel.z -= pos.z * 0.002;
        }
        break;
      }
    }
  }
  
  /**
   * Apply forces from world systems (read-only)
   */
  applyWorldForces(entity, deltaTime) {
    const behavior = this._getBehaviorContext(entity);
    const pos = entity.position;
    const vel = entity.velocity;
    const harmonyBias = this._getMetricBiasStrength('harmony');
    const synergyBias = this._getMetricBiasStrength('synergy');
    const stabilityBias = this._getMetricBiasStrength('stability');
    const corruptionBias = this._getMetricBiasStrength('corruption');
    const loadPressureBias = this._getMetricBiasStrength('loadPressure');

    // Colony-centric forces (ecosystem-driven)
    if (behavior) {
      switch (behavior.type) {
        case 'colony-orbit': {
          // Gentle pull toward orbit center to maintain stable orbit
          const center = behavior.orbitCenter;
          const dx = center.x - pos.x;
          const dz = center.z - pos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 0.1) {
            const targetRadius = behavior.orbitRadius;
            const radiusError = dist - targetRadius;
            // Spring-like correction toward target radius
            const springStrength = 0.15;
            vel.x += (dx / dist) * radiusError * springStrength;
            vel.z += (dz / dist) * radiusError * springStrength;
            // Vertical damping
            vel.y += (center.y - pos.y) * 0.08 - vel.y * 0.3;
          }
          break;
        }

        case 'link-flow': {
          // Align velocity with link direction, resist perpendicular drift
          const dir = behavior.linkDirection;
          const dot = vel.x * dir.x + vel.y * dir.y + vel.z * dir.z;
          const perpX = vel.x - dot * dir.x;
          const perpY = vel.y - dot * dir.y;
          const perpZ = vel.z - dot * dir.z;
          // Dampen perpendicular velocity
          vel.x -= perpX * 0.25;
          vel.y -= perpY * 0.25;
          vel.z -= perpZ * 0.25;
          break;
        }

        case 'corruption-guard': {
          // Repel fragment swarms and other entities from guard center
          const center = behavior.guardCenter;
          const dx = pos.x - center.x;
          const dz = pos.z - center.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const guardRadius = behavior.guardRadius;
          if (dist < guardRadius && dist > 0.1) {
            const repelStrength = 0.03 * (1 - dist / guardRadius);
            vel.x += (dx / dist) * repelStrength;
            vel.z += (dz / dist) * repelStrength;
          }
          // Self-agitation: corruption phantoms jitter more
          const jitter = behavior.glitchIntensity * 0.02;
          vel.x += (Math.random() - 0.5) * jitter;
          vel.z += (Math.random() - 0.5) * jitter;
          break;
        }

        case 'colony-scan': {
          // Spectres maintain altitude relative to scan center
          const center = behavior.scanCenter;
          vel.y += (center.y + 2.0 - pos.y) * 0.06 - vel.y * 0.2;
          // Tangential boost to maintain circular motion
          const dx = pos.x - center.x;
          const dz = pos.z - center.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 0.1) {
            const tangentX = -dz / dist;
            const tangentZ = dx / dist;
            vel.x += tangentX * 0.008;
            vel.z += tangentZ * 0.008;
          }
          break;
        }

        case 'neutral-swarm': {
          // Fragment swarms are repelled by corruption colonies
          if (this._colonySnapshot) {
            for (const colony of this._colonySnapshot) {
              if (colony.moodNormalized === 'CORRUPTION') {
                const cdx = pos.x - colony.center.x;
                const cdz = pos.z - colony.center.z;
                const cDist = Math.sqrt(cdx * cdx + cdz * cdz);
                if (cDist < 25 && cDist > 0.1) {
                  const repel = 0.025 * (1 - cDist / 25);
                  vel.x += (cdx / cDist) * repel;
                  vel.z += (cdz / cDist) * repel;
                }
              }
            }
          }
          break;
        }
      }
    }

    // Weather wind effect
    const activeWeather = this.worldSystems.weatherPack?.getActiveWeather?.();
    if (activeWeather && activeWeather.length > 0) {
      const weather = activeWeather[0];
      if (weather.windVector) {
        vel.x += weather.windVector.x * (0.006 + loadPressureBias * 0.004);
        vel.z += weather.windVector.z * (0.006 + loadPressureBias * 0.004);
      }
    }

    // Legendary node attraction (read-only)
    const legendaryNodes = this.worldSystems.legendaryPack?.getLegendaryNodes?.();
    if (legendaryNodes && legendaryNodes.length > 0) {
      const nearestLegendary = legendaryNodes[0];
      if (nearestLegendary && nearestLegendary.position) {
        const dx = nearestLegendary.position.x - pos.x;
        const dy = nearestLegendary.position.y - pos.y;
        const dz = nearestLegendary.position.z - pos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 20 && dist > 0.1) {
          const strength = 0.02 * (1 - dist / 20);
          vel.x += (dx / dist) * strength;
          vel.y += (dy / dist) * strength;
          vel.z += (dz / dist) * strength;
        }
      }
    }

    if (harmonyBias > 0.12 || stabilityBias > 0.12) {
      const damping = 1 - Math.min(0.12, harmonyBias * 0.035 + stabilityBias * 0.04);
      vel.x *= damping;
      vel.y *= 1 - Math.min(0.08, stabilityBias * 0.03);
      vel.z *= damping;
    }

    if (synergyBias > 0.12 && behavior?.type === 'link-flow') {
      vel.x *= 1 + synergyBias * 0.08;
      vel.y *= 1 + synergyBias * 0.04;
      vel.z *= 1 + synergyBias * 0.08;
    }

    if (loadPressureBias > 0.12) {
      vel.x *= 1 + loadPressureBias * 0.05;
      vel.y *= 1 + loadPressureBias * 0.03;
      vel.z *= 1 + loadPressureBias * 0.05;
    }

    if (corruptionBias > 0.18 && behavior?.type !== 'neutral-swarm') {
      const turbulence = 0.015 * corruptionBias;
      vel.x += (Math.random() - 0.5) * turbulence;
      vel.z += (Math.random() - 0.5) * turbulence;
    }

    // World events intensity modulation
    const activeEvents = this.worldSystems.worldEvents?.getActiveEvents?.();
    if (activeEvents && activeEvents.length > 0) {
      const eventBoost = Math.min(0.22, activeEvents.length * 0.04);
      entity.intensity = THREE.MathUtils.clamp(entity.intensity + eventBoost, 0.45, 1);
    }
  }
  
  /**
   * Update entity visual effects
   */
  updateEntityVisuals(deltaTime) {
    const entities = this.registry.getAllEntities();
    
    for (let entity of entities) {
      const mesh = this.entityMeshes[entity.id];
      if (!mesh) continue;
      
      // Get fade progress
      const fadeProgress = this.registry.getFadeProgress(entity.id);
      
      // Update based on type
      switch (entity.type) {
        case this.registry.TYPES.GHOST_ORB:
          this.updateGhostOrbVisuals(mesh, entity, fadeProgress, deltaTime);
          break;
        case this.registry.TYPES.AI_SPECTRE:
          this.updateSpectreVisuals(mesh, entity, fadeProgress, deltaTime);
          break;
        case this.registry.TYPES.FRAGMENT_SWARM:
          this.updateSwarmVisuals(mesh, entity, fadeProgress, deltaTime);
          break;
        case this.registry.TYPES.SIGMA_PHANTOM:
          this.updatePhantomVisuals(mesh, entity, fadeProgress, deltaTime);
          break;
        case this.registry.TYPES.QUANTUM_WISP:
          this.updateWispVisuals(mesh, entity, fadeProgress, deltaTime);
          break;
      }
      
      // Apply fade
      mesh.traverse((child) => {
        if (child.material && child.material.transparent) {
          const originalOpacity = child.userData.originalOpacity || 1.0;
          child.material.opacity = originalOpacity * (1 - fadeProgress);
        }
      });
    }
  }
  
  /**
   * Update Ghost Orb visuals
   */
  updateGhostOrbVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.floatTime = (mesh.userData.floatTime || 0) + deltaTime;
    const ft = mesh.userData.floatTime;
    const behavior = this._getBehaviorContext(entity);
    const harmonyBias = this._getMetricBiasStrength('harmony');
    const synergyBias = this._getMetricBiasStrength('synergy');
    const corruptionBias = this._getMetricBiasStrength('corruption');

    // Float up / wobble — stronger when orbiting a colony
    const floatOffset = Math.sin(ft * mesh.userData.floatSpeed) * mesh.userData.floatAmplitude;
    const wobble = Math.sin(ft * 2.5) * 0.06;
    mesh.position.y = entity.position.y + floatOffset + wobble;

    // Gentle rotation — faster when in active orbit
    const orbitBoost = (behavior?.type === 'colony-orbit') ? 1.6 : 1.0;
    mesh.rotation.y += deltaTime * 0.25 * orbitBoost;

    // Color shift — slow drift inside the ATOMA dark palette
    const hue = 0.63 + harmonyBias * 0.025 - corruptionBias * 0.03 + Math.sin(ft * 0.18) * 0.02;
    const color = this._tempColorA.setHSL(hue, 0.34 + harmonyBias * 0.12, 0.24 + Math.sin(ft * 0.7) * 0.025);
    const ringColor = this._tempColorB.setHSL(0.6 + synergyBias * 0.015 + Math.sin(ft * 0.22) * 0.018, 0.24, 0.44 + Math.sin(ft * 1.2) * 0.025);
    const coreColor = this._tempColorC.setHSL(0.61 + harmonyBias * 0.01, 0.12 + harmonyBias * 0.08, 0.76 + Math.sin(ft * 3.0) * 0.03);

    const midCage = mesh.getObjectByName('midCage');
    if (midCage) {
      midCage.material.color.copy(color);
      midCage.rotation.x += deltaTime * 0.4 * orbitBoost;
      midCage.rotation.z += deltaTime * 0.2 * orbitBoost;
    }

    const outerShell = mesh.getObjectByName('outerShell');
    if (outerShell) {
      outerShell.material.color.copy(color);
      outerShell.material.color.lerp(this._tempColorD.set(this.ambientPalette.void), 0.22);
      const breathe = 1.0 + Math.sin(ft * 1.5) * 0.08;
      outerShell.scale.setScalar(breathe);
    }

    // Inner core pulse
    const pulse = 0.5 + 0.5 * Math.sin(ft * 3.0);
    const innerCore = mesh.getObjectByName('innerCore');
    if (innerCore) {
      innerCore.material.color.copy(coreColor);
      innerCore.material.opacity = (0.5 + pulse * 0.5) * (1 - fadeProgress);
      const coreScale = 0.8 + pulse * 0.3;
      innerCore.scale.setScalar(coreScale);
    }

    // Orbit ring tilt — align with colony orbit plane when behavior context exists
    const orbitRing = mesh.getObjectByName('orbitRing');
    if (orbitRing) {
      orbitRing.material.color.copy(ringColor);
      if (behavior?.type === 'colony-orbit') {
        // Orbit ring precesses with the colony orbit phase
        const phase = behavior.orbitPhase || ft * 0.6;
        orbitRing.rotation.x = Math.PI * 0.5 + Math.sin(phase) * 0.4;
        orbitRing.rotation.z = phase * 0.8;
        // Slight scale pulse synced with orbit
        const orbitPulse = 1.0 + Math.sin(phase * 2) * 0.06;
        orbitRing.scale.setScalar(orbitPulse);
      } else {
        orbitRing.rotation.x = Math.PI * 0.5 + Math.sin(ft * 0.8) * 0.3;
        orbitRing.rotation.z = ft * 0.6;
      }
    }

    const halo = mesh.getObjectByName('caretakerHalo');
    if (halo) {
      halo.material.color.copy(coreColor).lerp(ringColor, 0.35);
      halo.rotation.y += deltaTime * (0.18 + harmonyBias * 0.1);
      halo.rotation.z += deltaTime * 0.08;
      const haloPulse = 1 + Math.sin(ft * (1.9 + harmonyBias * 0.5)) * 0.05;
      halo.scale.setScalar(haloPulse);
    }

    // Fade visibility
    mesh.children.forEach((child) => {
      if (child.material && child.material.transparent) {
        const originalOpacity = child.userData.originalOpacity || child.material.opacity;
        child.material.opacity = originalOpacity * (1 - fadeProgress);
      }
    });
  }
  
  /**
   * Update AI Spectre visuals
   */
  updateSpectreVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.glitchTimer += deltaTime;
    const gt = mesh.userData.glitchTimer;
    const behavior = this._getBehaviorContext(entity);
    const corruptionBias = this._getMetricBiasStrength('corruption');
    const loadPressureBias = this._getMetricBiasStrength('loadPressure');
    const spectralColor = this._tempColorA.setHSL(0.62 + corruptionBias * 0.05 + Math.sin(gt * 0.15) * 0.015, 0.25 + corruptionBias * 0.08, 0.36 + Math.sin(gt * 0.45) * 0.03);
    const accentColor = this._tempColorB.setHSL(0.58 + loadPressureBias * 0.02, 0.12, 0.7);

    // Scanline sweep — when colony-scan behavior, sweep rotates around colony center
    const scanline = mesh.getObjectByName('scanline');
    if (scanline) {
      scanline.material.color.copy(spectralColor);
      if (behavior?.type === 'colony-scan') {
        // Radial scan sweep around the colony
        const scanPhase = (behavior.scanPhase || gt * 0.6) % (Math.PI * 2);
        const scanRadius = 0.5;
        scanline.position.x = Math.cos(scanPhase) * scanRadius;
        scanline.position.z = Math.sin(scanPhase) * scanRadius;
        scanline.position.y = Math.sin(scanPhase * 2) * 0.3;
        scanline.rotation.y = -scanPhase;
        const edgeFade = Math.min(1, Math.min(scanPhase, Math.PI * 2 - scanPhase) / 0.6);
        scanline.material.opacity = 0.22 * edgeFade * entity.intensity * (1 - fadeProgress);
      } else {
        // Legacy vertical sweep
        const scanCycle = (gt * 0.6) % 2.4;
        const scanY = -0.3 + (scanCycle < 1.2 ? scanCycle / 1.2 : (2.4 - scanCycle) / 1.2) * 2.1;
        scanline.position.y = scanY;
        scanline.position.x = 0;
        scanline.position.z = 0;
        scanline.rotation.y = 0;
        const edgeFade = Math.min(1, Math.min(scanCycle, 2.4 - scanCycle) / 0.4);
        scanline.material.opacity = 0.18 * edgeFade * entity.intensity * (1 - fadeProgress);
      }
    }

    // Animate scan rings — subtle breathing, faster when scanning
    const scanBoost = (behavior?.type === 'colony-scan') ? 1.4 : 1.0;
    for (let i = 0; i < 5; i++) {
      const ring = mesh.getObjectByName(`scanRing_${i}`);
      if (ring) {
        ring.material.color.copy(spectralColor);
        const breathe = 1.0 + Math.sin(gt * 2.0 * scanBoost + i * 0.8) * 0.06;
        ring.scale.setScalar(breathe);
        ring.rotation.z += deltaTime * (0.2 + i * 0.05) * scanBoost;
      }
    }

    // Spine flicker
    const spine = mesh.getObjectByName('spine');
    if (spine) {
      spine.material.color.copy(accentColor);
      spine.material.opacity = (0.08 + Math.sin(gt * 6) * 0.04) * entity.intensity * (1 - fadeProgress);
    }

    const halo = mesh.getObjectByName('scanHalo');
    if (halo) {
      halo.material.color.copy(accentColor).lerp(spectralColor, 0.5);
      halo.rotation.z += deltaTime * (0.2 + loadPressureBias * 0.12);
      halo.scale.setScalar(1 + Math.sin(gt * 1.8) * 0.05);
    }

    // Chromatic glitch — offset entire group briefly, more frequent when scanning
    const glitchChance = (behavior?.type === 'colony-scan') ? 0.025 : 0.015;
    if (Math.random() < glitchChance) {
      const offset = (Math.random() - 0.5) * 0.3;
      mesh.position.x += offset;
      setTimeout(() => {
        if (mesh.userData) mesh.position.x -= offset;
      }, 60);
    }

    // Overall opacity flicker
    const flicker = 0.08 + Math.sin(gt * 8) * 0.04 + Math.random() * 0.02;
    mesh.traverse((child) => {
      if (child.material && child.material.opacity !== undefined && child.name !== 'scanline') {
        child.material.opacity = Math.min(child.material.opacity, flicker * entity.intensity * (1 - fadeProgress) * 3);
      }
    });
  }
  
  /**
   * Update Fragment Swarm visuals
   */
  updateSwarmVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.orbitTime += deltaTime;
    const time = mesh.userData.orbitTime;
    const trailContainer = mesh.userData.trailContainer;
    const trailParticles = entity.trailParticles || [];
    const stabilityBias = this._getMetricBiasStrength('stability');
    const harmonyBias = this._getMetricBiasStrength('harmony');
    const corruptionBias = this._getMetricBiasStrength('corruption');
    const TRAIL_LENGTH = 8;
    const TRAIL_LIFETIME = 0.3;

    for (let childIndex = 0; childIndex < mesh.children.length; childIndex++) {
      const fragment = mesh.children[childIndex];
      if (!fragment || fragment.userData.isTrailContainer) continue;
      const basePos = fragment.userData.basePos;
      const orbitSpeed = fragment.userData.orbitSpeed;
      const orbitRadius = fragment.userData.orbitRadius;
      const orbitPhase = fragment.userData.orbitPhase;
      const tilt = fragment.userData.orbitTilt;

      const shoalTightness = 1 - stabilityBias * 0.18 + corruptionBias * 0.08;
      fragment.position.x = basePos.x + Math.sin(time * orbitSpeed + orbitPhase) * orbitRadius * shoalTightness;
      fragment.position.z = basePos.z + Math.cos(time * orbitSpeed + orbitPhase) * orbitRadius * shoalTightness;
      fragment.position.y = basePos.y + Math.sin(time * orbitSpeed * 0.7 + orbitPhase) * orbitRadius * tilt * (1 - harmonyBias * 0.12);

      fragment.rotation.x += deltaTime * 0.5;
      fragment.rotation.y += deltaTime * 0.7;

      const trail = trailParticles[childIndex];
      if (Array.isArray(trail)) {
        trail.push({ pos: fragment.position.clone(), age: 0 });
        while (trail.length > TRAIL_LENGTH) {
          trail.shift();
        }
      }

      const ageFactor = 1.0 - (entity.age / entity.maxLifetime);
      if (fragment.material && fragment.material.opacity !== undefined) {
        fragment.material.opacity = 0.7 * ageFactor * entity.intensity;
        fragment.material.color.setHSL(0.63 + corruptionBias * 0.06 - harmonyBias * 0.02, 0.28 + corruptionBias * 0.08, 0.3 + stabilityBias * 0.04);
      }
    }

    if (trailContainer && trailContainer.children.length > 0) {
      let particleIndex = 0;
      for (const trail of trailParticles) {
        for (const point of trail) {
          point.age += deltaTime;
        }
        while (trail.length > 0 && trail[0].age > TRAIL_LIFETIME) {
          trail.shift();
        }
        for (const point of trail) {
          if (particleIndex >= trailContainer.children.length) break;
          const particle = trailContainer.children[particleIndex];
          particle.visible = true;
          particle.position.copy(point.pos);
          const life = Math.max(0, 1 - point.age / TRAIL_LIFETIME);
          particle.material.opacity = 0.3 * life * entity.intensity;
          particle.scale.setScalar(0.02 * (0.5 + life * 0.5));
          particleIndex += 1;
        }
      }
      for (; particleIndex < trailContainer.children.length; particleIndex++) {
        const particle = trailContainer.children[particleIndex];
        particle.visible = false;
      }
    }
  }
  
  /**
   * Update Sigma Phantom visuals
   */
  updatePhantomVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.glitchTimer += deltaTime;
    mesh.userData.fadeCycleTime = (mesh.userData.fadeCycleTime || 0) + deltaTime;
    const behavior = this._getBehaviorContext(entity);
    const gt = mesh.userData.glitchTimer;

    // Corruption-guard phantoms shift toward angry red-purple hues
    const isCorruptionGuard = behavior?.type === 'corruption-guard';
    const glitchBoost = isCorruptionGuard ? 1.5 : 1.0;
    const baseHue = isCorruptionGuard ? 0.78 : 0.72; // redder when guarding corruption
    const phantomBase = this._tempColorA.setHSL(
      baseHue + Math.sin(gt * 0.2 * glitchBoost) * 0.015,
      isCorruptionGuard ? 0.38 : 0.28,
      isCorruptionGuard ? 0.22 : 0.27
    );
    const phantomGlow = this._tempColorB.setHSL(0.61, 0.14, 0.64);

    // Random glitch teleport — more frequent when guarding
    const teleportChance = isCorruptionGuard ? 0.06 : 0.03;
    if (Math.random() < teleportChance) {
      const offset = (Math.random() - 0.5) * (isCorruptionGuard ? 0.8 : 0.5);
      mesh.position.x += offset;
    }

    // Hologram noise opacity
    const noise = this.perlinNoise(
      mesh.position.x * mesh.userData.noiseScale,
      mesh.position.z * mesh.userData.noiseScale,
      Date.now() * 0.001 + mesh.userData.noiseOffset
    );
    const noiseOpacity = 0.2 + noise * 0.15;

    // Periodic fade cycle
    const fadePhase = (mesh.userData.fadeCycleTime % mesh.userData.fadeDuration) / mesh.userData.fadeDuration;
    let fadeMultiplier = 1.0;
    if (fadePhase < 0.3) {
      fadeMultiplier = fadePhase / 0.3;
    } else if (fadePhase > 0.7) {
      fadeMultiplier = (1.0 - fadePhase) / 0.3;
    }

    const flickerBase = 0.05;
    const flickerSpeed = 8 * glitchBoost;
    const flickerRange = isCorruptionGuard ? 0.12 : 0.08;
    const flicker = flickerBase + Math.sin(gt * flickerSpeed) * flickerRange;
    const noiseFlicker = Math.random() * 0.03;

    mesh.traverse((child) => {
      if (child.material && child.material.opacity !== undefined && !child.name.includes('_glow')) {
        if (child.material.color) {
          child.material.color.copy(child.name.includes('head') || child.name.includes('body') ? phantomBase : phantomGlow);
        }
        child.material.opacity = (noiseOpacity + flicker + noiseFlicker) * entity.intensity * (1 - fadeProgress) * fadeMultiplier;
      }
    });
  }
  
  /**
   * Update Quantum Wisp visuals
   */
  updateWispVisuals(mesh, entity, fadeProgress, deltaTime) {
    mesh.userData.waveTime += deltaTime;
    const waveTime = Date.now() * 0.001;
    const behavior = this._getBehaviorContext(entity);
    const isLinkFlow = behavior?.type === 'link-flow';
    const synergyBias = this._getMetricBiasStrength('synergy');
    const loadPressureBias = this._getMetricBiasStrength('loadPressure');

    // Link-flow wisps shift toward cyan-blue, faster pulse
    const flowBoost = (isLinkFlow ? 1.5 : 1.0) + synergyBias * 0.35 + loadPressureBias * 0.28;
    const baseHue = (isLinkFlow ? 0.58 : 0.64) - synergyBias * 0.025;
    const ribbonTint = this._tempColorA.setHSL(
      baseHue + Math.sin(waveTime * 0.2 * flowBoost) * 0.02,
      (isLinkFlow ? 0.38 : 0.3) + synergyBias * 0.08,
      (isLinkFlow ? 0.38 : 0.34) + loadPressureBias * 0.05
    );
    const glowTint = this._tempColorB.setHSL(0.59, 0.14, 0.72);

    mesh.children.forEach((child) => {
      if (child.userData.streamIndex !== undefined) {
        const offset = (child.userData.streamIndex - 2) * 0.15;

        // Wave motion — faster when flowing along link
        child.position.y = Math.sin(waveTime * flowBoost + offset * 5) * 0.1;
        child.rotation.z = Math.sin(waveTime * 2 * flowBoost + offset * 3) * 0.01;

        // Scale pulse — sync with flow speed
        const pulse = 1 + Math.sin(waveTime * 3 * flowBoost + offset * 2) * 0.15;
        child.scale.set(1, pulse, 1);

        // Color shift — brighter when in active flow
        const hueShift = Math.sin(waveTime + offset * 2) * 0.03;
        const newColor = this._tempColorC.setHSL(baseHue + hueShift, 0.42 + synergyBias * 0.06, (isLinkFlow ? 0.32 : 0.28) + loadPressureBias * 0.04);
        if (child.material && child.material.color) {
          child.material.color.copy(newColor).lerp(glowTint, 0.25);
        }

        if (child.material && child.material.opacity !== undefined) {
          const baseOpacity = child.userData.baseOpacity || 0.7;
          child.material.opacity = baseOpacity * (1 - fadeProgress) * entity.intensity;
        }

        const streamIndex = child.userData.streamIndex;
        const trail = entity.streamTrails?.[streamIndex];
        if (Array.isArray(trail) && child.userData.curve) {
          trail.push({ pos: child.userData.curve.getPoint(Math.random()), age: 0 });
          while (trail.length > 5) {
            trail.shift();
          }
        }
      }
    });

    const trailContainer = mesh.userData.trailContainer;
    if (trailContainer && Array.isArray(entity.streamTrails)) {
      let particleIndex = 0;
      const TRAIL_LIFETIME = isLinkFlow ? 0.15 : 0.2;

      for (let streamIndex = 0; streamIndex < entity.streamTrails.length; streamIndex++) {
        const trail = entity.streamTrails[streamIndex];
        if (!Array.isArray(trail)) continue;

        for (const point of trail) {
          point.age += deltaTime;
        }
        while (trail.length > 0 && trail[0].age > TRAIL_LIFETIME) {
          trail.shift();
        }

        for (const point of trail) {
          if (particleIndex >= trailContainer.children.length) break;
          const particle = trailContainer.children[particleIndex];
          particle.visible = true;
          particle.position.copy(point.pos);
          const life = Math.max(0, 1 - point.age / TRAIL_LIFETIME);
          particle.material.color.copy(ribbonTint);
          particle.material.opacity = 0.18 * life * entity.intensity * (1 - fadeProgress);
          particle.scale.setScalar(0.04 * (0.5 + life * 0.5));
          particleIndex += 1;
        }
      }

      for (; particleIndex < trailContainer.children.length; particleIndex++) {
        const particle = trailContainer.children[particleIndex];
        particle.visible = false;
      }
    }

    // Random warp when near legendary nodes
    const legendaryNodes = this.worldSystems.legendaryPack?.getLegendaryNodes?.();
    if (legendaryNodes && legendaryNodes.length > 0) {
      const nearest = legendaryNodes[0];
      if (nearest && nearest.position) {
        const dist = mesh.position.distanceTo(nearest.position);
        if (dist < 15) {
          mesh.scale.y = 1 + Math.sin(waveTime * 3) * 0.2;
        }
      }
    }
  }
  
  /**
   * Clean up despawned entities
   */
  cleanupDespawnedEntities() {
    for (let id in this.registry.entities) {
      const entity = this.registry.entities[id];
      if (!entity.isActive) {
        const mesh = this.entityMeshes[id];
        if (mesh && mesh.parent) {
          mesh.traverse((child) => {
            if (child.geometry && !this.sharedGeometrySet.has(child.geometry)) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m?.dispose?.());
              } else {
                child.material.dispose?.();
              }
            }
          });
          mesh.parent.remove(mesh);
        }
        delete this.entityMeshes[id];
        delete this.registry.entities[id];
      }
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return this.registry.getStats();
  }
  
  /**
   * Reset all entities
   */
  reset() {
    this.registry.clearAll();
    this.entityMeshes = {};
    this.entityParticles = {};
    this.entityTrailParticles = {};
    this._semanticWindows.global.clear();
    this._semanticWindows.colonies.clear();
    this._pendingSemanticSpawns = [];
    this._semanticSpawnCooldowns.clear();
    this.interpretationAccumulator = this.interpretationInterval;
    this.refreshAmbientInterpretation();
  }

  /**
   * Dispose — clean up all resources and remove from scene
   */
  dispose() {
    eventRegistrationRegistry.disposeOwner(this._ambientOwner);

    // Remove all entity meshes
    for (const id in this.entityMeshes) {
      const mesh = this.entityMeshes[id];
      if (mesh) {
        mesh.traverse((child) => {
          if (child.geometry && !this.sharedGeometrySet.has(child.geometry)) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m?.dispose?.());
            } else {
              child.material.dispose?.();
            }
          }
        });
        if (mesh.parent) mesh.parent.remove(mesh);
      }
    }
    this.entityMeshes = {};
    this.entityParticles = {};
    this.entityTrailParticles = {};

    // Clear registry
    if (this.registry && typeof this.registry.clearAll === 'function') {
      this.registry.clearAll();
    }

    // Remove VFX container from scene
    if (this.vfxContainer) {
      if (this.vfxContainer.parent) {
        this.vfxContainer.parent.remove(this.vfxContainer);
      }
    }

    for (const geometry of this.sharedGeometrySet) {
      geometry?.dispose?.();
    }
    this.sharedGeometrySet.clear();
    this.sharedGeometryCache.clear();
    this._semanticWindows.global.clear();
    this._semanticWindows.colonies.clear();
    this._pendingSemanticSpawns = [];
    this._semanticSpawnCooldowns.clear();
  }
}
