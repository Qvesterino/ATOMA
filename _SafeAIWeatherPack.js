import * as THREE from 'three';

/**
 * SAFE AI WEATHER PACK
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO shader modifications
 * - ZERO material overrides on existing objects
 * - ZERO Node or Link class modifications
 * - ZERO NodeLinkingSystem.js modifications
 * - ZERO animation loop modifications
 * - All weather is VFX-layer only
 * - All state stored ONLY in external WeatherRegistry
 * - Completely non-invasive and reversible
 */

const ATMOSPHERE_PALETTE = {
  calm: {
    core: 0x6DEAFF,
    haze: 0x77F7DB,
    band: 0x77F7DB,
    void: 0x05131A
  },
  pressure: {
    core: 0xBC76FF,
    haze: 0x6DEAFF,
    band: 0xFF73CF,
    void: 0x05131A
  },
  resonance: {
    core: 0x77F7DB,
    haze: 0x6DEAFF,
    band: 0xFF73CF,
    void: 0x05131A
  },
  stormBias: {
    core: 0xBC76FF,
    haze: 0xFF73CF,
    band: 0x6DEAFF,
    void: 0x05131A
  },
  ascensionHaze: {
    core: 0x6DEAFF,
    haze: 0x77F7DB,
    band: 0xFF73CF,
    void: 0x05131A
  }
};

export class SafeAIWeatherPack {
  constructor(scene, worldRoot, environmentRoot, camera, sharedAssets = null) {
    this.scene = scene;
    this.worldRoot = worldRoot || scene;
    this.environmentRoot = environmentRoot || this.worldRoot;
    this.camera = camera;
    this.sharedAssets = sharedAssets ?? null;
    this.root = new THREE.Group();
    this.environmentRoot.add(this.root);
    
    // EXTERNAL STATE - Never touch engine internals
    this.registry = {
      active: null,
      timer: 0,
      intensity: 0,
      duration: 0,
      phase: 'idle', // idle, fadeIn, active, fadeOut
      windVector: new THREE.Vector3(0, 0, 0),
      windStrength: 0
    };
    
    // Mood state definitions
    this.moodStates = {
      calm: {
        duration: 16.0,
        fadeInDuration: 2.5,
        fadeOutDuration: 3.0,
        maxIntensity: 0.65,
        windStrength: 0.2,
        description: 'Calm Atmosphere'
      },
      pressure: {
        duration: 14.0,
        fadeInDuration: 2.0,
        fadeOutDuration: 2.8,
        maxIntensity: 0.75,
        windStrength: 0.45,
        description: 'Pressure Field'
      },
      resonance: {
        duration: 18.0,
        fadeInDuration: 3.0,
        fadeOutDuration: 3.2,
        maxIntensity: 0.7,
        windStrength: 0.3,
        description: 'Resonance Layer'
      },
      stormBias: {
        duration: 13.5,
        fadeInDuration: 2.0,
        fadeOutDuration: 2.5,
        maxIntensity: 0.8,
        windStrength: 0.65,
        description: 'Storm Bias'
      },
      ascensionHaze: {
        duration: 20.0,
        fadeInDuration: 3.0,
        fadeOutDuration: 3.8,
        maxIntensity: 0.72,
        windStrength: 0.25,
        description: 'Ascension Haze'
      }
    };
    
    // Configuration
    this.config = {
      weatherCheckInterval: 6.0,         // Check every 6 seconds
      weatherChance: 0.02,               // 2% base chance per check
      minSynergyForWeather: 0.55,        // Minimum average link synergy to trigger
      maxConcurrentWeather: 1,           // Only 1 weather at a time
      weatherCooldown: 20.0,             // 20 seconds between weather
      windUpdateFrequency: 0.1,          // Update wind vector frequently
      interpretationInterval: 0.25       // Phase B pilot: ~4 Hz interpretation, motion stays 60 Hz
    };
    
    // Tracking
    this.lastWeatherCheck = performance.now();
    this.lastWeatherTime = 0;
    this.animationTime = 0;
    this.interpretationAccumulator = 0;
    
    // VFX containers
    this.vfxLayers = {
      clouds: [],
      particles: [],
      waves: [],
      ribbons: [],
      glitches: [],
      overlays: [],
      beams: [],
      glows: []
    };
    
    this.windPhase = 0;
  }

  _getSharedMaterial(key, factory) {
    if (this.sharedAssets?.getSharedMaterial) {
      return this.sharedAssets.getSharedMaterial(`SafeAIWeatherPack:${key}`, factory);
    }
    return factory();
  }

  _getSharedGeometry(key, factory) {
    if (this.sharedAssets?.getSharedGeometry) {
      return this.sharedAssets.getSharedGeometry(`SafeAIWeatherPack:${key}`, factory);
    }
    return factory();
  }

  _createGradientTexture(startColor, endColor) {
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : { width: 128, height: 128 };
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext?.('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, `#${startColor.toString(16).padStart(6, '0')}`);
      gradient.addColorStop(1, `#${endColor.toString(16).padStart(6, '0')}`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  _releaseMaterial(material) {
    if (!material) return;
    if (this.sharedAssets?.releaseMaterial?.(material)) return;
    if (typeof material.dispose === 'function') material.dispose();
  }

  _releaseGeometry(geometry) {
    if (!geometry) return;
    if (this.sharedAssets?.releaseGeometry?.(geometry)) return;
    if (typeof geometry.dispose === 'function') geometry.dispose();
  }

  _releaseMeshResources(mesh) {
    if (!mesh) return;
    this._releaseGeometry(mesh.geometry);
    if (!mesh.material) return;
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => this._releaseMaterial(material));
    } else {
      this._releaseMaterial(mesh.material);
    }
  }

  _createAtmosphericWash(color, opacity, depth) {
    const size = 320;
    const geo = this._getSharedGeometry(`atmosphere.wash.${color}.${depth}`, () => new THREE.PlaneGeometry(size, size));
    const texture = this._createGradientTexture(color, 0x05131A);
    const mat = this._getSharedMaterial(`atmosphere.washMat.${color}.${depth}`, () => new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide
    }));

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = depth;
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData = { isAIWeatherVFX: true, type: 'atmospheric_wash' };
    this.root.add(mesh);
    this.vfxLayers.overlays.push(mesh);
    return mesh;
  }

  _createAmbientHazeSheets(color, count, baseDepth) {
    const sheets = [];
    for (let i = 0; i < count; i++) {
      const width = 260 - i * 20;
      const height = 110;
      const geo = this._getSharedGeometry(`haze.sheet.${color}.${i}`, () => new THREE.PlaneGeometry(width, height));
      const texture = this._createGradientTexture(color, 0x05131A);
      const mat = this._getSharedMaterial(`haze.sheetMat.${color}.${i}`, () => new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide
      }));
      const sheet = new THREE.Mesh(geo, mat);
      sheet.position.set(0, 18 + i * 10, baseDepth - i * 6);
      sheet.rotation.x = -Math.PI / 2.7;
      sheet.userData = { isAIWeatherVFX: true, type: 'ambient_haze', layer: i, speed: 0.015 + i * 0.008 };
      this.root.add(sheet);
      this.vfxLayers.overlays.push(sheet);
      sheets.push(sheet);
    }
    return sheets;
  }

  _createPulseClouds(color, count, depth) {
    const clouds = [];
    for (let i = 0; i < count; i++) {
      const size = 22 + Math.random() * 16;
      const geo = this._getSharedGeometry(`pulseCloud.${color}.${i}`, () => new THREE.PlaneGeometry(size, size));
      const texture = this._createGradientTexture(color, 0x05131A);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide
      });
      const cloud = new THREE.Mesh(geo, mat);
      cloud.position.set(
        (Math.random() - 0.5) * 140,
        28 + Math.random() * 22,
        depth + (Math.random() - 0.5) * 10
      );
      cloud.rotation.x = -Math.PI / 2;
      cloud.userData = { isAIWeatherVFX: true, type: 'pulse_cloud', speed: 0.008 + Math.random() * 0.012, baseOpacity: 0.08 + Math.random() * 0.06 };
      this.root.add(cloud);
      this.vfxLayers.overlays.push(cloud);
      clouds.push(cloud);
    }
    return clouds;
  }

  _createAuroraRibbons(color, count) {
    const ribbons = [];
    for (let i = 0; i < count; i++) {
      const geo = this._getSharedGeometry(`aurora.ribbon.${color}.${i}`, () => new THREE.PlaneGeometry(260, 14));
      const texture = this._createGradientTexture(color, 0x05131A);
      const mat = this._getSharedMaterial(`aurora.ribbonMat.${color}.${i}`, () => new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide
      }));
      const ribbon = new THREE.Mesh(geo, mat);
      ribbon.position.set((i - (count - 1) / 2) * 10, 22 + i * 8, -94);
      ribbon.rotation.x = -Math.PI / 2.6;
      ribbon.userData = { isAIWeatherVFX: true, type: 'aurora_ribbon', index: i, speed: 0.018 + i * 0.008 };
      this.root.add(ribbon);
      this.vfxLayers.ribbons.push(ribbon);
      ribbons.push(ribbon);
    }
    return ribbons;
  }

  _createPressureBands(color, count) {
    const bands = [];
    for (let i = 0; i < count; i++) {
      const geo = this._getSharedGeometry(`pressure.band.${color}.${i}`, () => new THREE.PlaneGeometry(320, 10));
      const texture = this._createGradientTexture(color, 0x05131A);
      const mat = this._getSharedMaterial(`pressure.bandMat.${color}.${i}`, () => new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide
      }));
      const band = new THREE.Mesh(geo, mat);
      band.position.set((i - (count - 1) / 2) * 10, 12 + i * 5, -92 + i * 3);
      band.rotation.x = -Math.PI / 2.9;
      band.userData = { isAIWeatherVFX: true, type: 'pressure_band', index: i, speed: 0.02 + i * 0.005 };
      this.root.add(band);
      this.vfxLayers.beams.push(band);
      bands.push(band);
    }
    return bands;
  }

  _applyDistanceLOD(object, detailFactor) {
    if (!this.camera || !object || !object.position) return;
    const dist = object.position.distanceTo(this.camera.position);
    if (dist > detailFactor * 80) {
      if (object.material) {
        object.material.opacity = Math.max(0, (object.material.opacity ?? 1) * 0.65);
      }
    }
  }

  _updateWeatherLOD() {
    if (!this.camera) return;
    const cameraPos = this.camera.position;
    const farThreshold = 90;
    const midThreshold = 50;

    [...this.vfxLayers.overlays, ...this.vfxLayers.waves, ...this.vfxLayers.ribbons, ...this.vfxLayers.particles, ...this.vfxLayers.beams].forEach((object) => {
      if (!object || !object.position || !object.material) return;
      const dist = object.position.distanceTo(cameraPos);
      if (dist > farThreshold) {
        object.material.opacity = Math.max(0, (object.material.opacity ?? 1) * 0.5);
      } else if (dist > midThreshold) {
        object.material.opacity = Math.max(0, (object.material.opacity ?? 1) * 0.75);
      }
    });
  }
  
  /**
   * Main update loop (called once per frame)
   */
  update(deltaTime, legendaryPack, linkingSystem, evolutionManager, worldEvents) {
    this.animationTime += deltaTime;
    this.windPhase += deltaTime;
    
    // Phase B pilot: throttle interpretation/decisions to keep mood at ~4 Hz while visuals/motion stay 60 Hz
    this.interpretationAccumulator += deltaTime;
    const shouldRunInterpretation = this.interpretationAccumulator >= this.config.interpretationInterval;
    
    if (shouldRunInterpretation) {
      this.interpretationAccumulator = 0;
      // Check for new weather triggers periodically (interpretation layer)
      this.checkWeatherTriggers(legendaryPack, linkingSystem, evolutionManager, worldEvents);
    }
    
    // Update active weather if one is running
    if (this.registry.active) {
      this.updateActiveWeather(deltaTime, legendaryPack, linkingSystem, worldEvents);
    }
    
    // Always update wind vector
    this.updateWindVector(deltaTime, linkingSystem);
  }
  
  /**
   * Check if new weather should trigger
   */
  checkWeatherTriggers(legendaryPack, linkingSystem, evolutionManager, worldEvents) {
    // Only check periodically
    const now = performance.now();
    if (now - this.lastWeatherCheck < this.config.weatherCheckInterval * 1000) {
      return;
    }
    this.lastWeatherCheck = now;
    
    // Don't trigger if weather is already active
    if (this.registry.active) return;
    
    // Check cooldown
    if (now - this.lastWeatherTime < this.config.weatherCooldown * 1000) {
      return;
    }
    
    // Skip if world event is active (weather yields to events)
    if (worldEvents && worldEvents.isEventActive()) {
      return;
    }
    
    // Calculate weather potential
    const potential = this.calculateWeatherPotential(legendaryPack, linkingSystem, evolutionManager);
    
    // Chance to trigger
    if (Math.random() < this.config.weatherChance * potential) {
      this.triggerMoodState(legendaryPack, linkingSystem, evolutionManager);
    }
  }
  
  /**
   * Calculate potential for weather to trigger
   */
  calculateWeatherPotential(legendaryPack, linkingSystem, evolutionManager) {
    let potential = 0;
    
    // Normalize weather gating against average live link synergy rather than total network size.
    const links = Array.isArray(linkingSystem?.links) ? linkingSystem.links : [];
    let synergyCount = 0;
    let totalSynergy = 0;
    let totalTraffic = 0;

    links.forEach(link => {
      if (typeof link?.glowData?.synergy === 'number') {
        totalSynergy += link.glowData.synergy;
        synergyCount += 1;
      }
      if (typeof link?.traffic?.load === 'number') {
        totalTraffic += link.traffic.load;
      }
    });

    const averageSynergy = synergyCount > 0 ? totalSynergy / synergyCount : 0;
    if (averageSynergy < this.config.minSynergyForWeather) {
      return 0;
    }
    
    // Scale potential by normalized synergy headroom above threshold.
    potential = THREE.MathUtils.clamp(
      (averageSynergy - this.config.minSynergyForWeather) / (1 - this.config.minSynergyForWeather),
      0,
      1
    );
    
    // Bonus from legendary nodes
    if (legendaryPack) {
      const legendaryCount = legendaryPack.getActiveLegendaryCount();
      potential += Math.min(0.3, legendaryCount * 0.15);
    }
    
    // Bonus from average traffic load to keep large/small networks comparable.
    const averageTraffic = links.length > 0 ? totalTraffic / links.length : 0;
    potential += Math.min(0.2, averageTraffic * 0.2);
    
    return Math.min(1, potential);
  }
  
  /**
   * Trigger random weather
   */
  triggerMoodState(legendaryPack, linkingSystem, evolutionManager) {
    const moodWeights = this._buildMoodStateWeights(legendaryPack, linkingSystem, evolutionManager);
    const moodState = this._sampleWeightedMood(moodWeights);
    if (!moodState) return;
    this.startWeather(moodState, legendaryPack, linkingSystem);
  }

  _buildMoodStateWeights(legendaryPack, linkingSystem, evolutionManager) {
    const weights = {
      calm: 1,
      pressure: 0.2,
      resonance: 0.5,
      stormBias: 0.15,
      ascensionHaze: 0.3
    };

    // Base network mood from synergy and load
    let averageSynergy = 0;
    let totalSynergy = 0;
    let synergyCount = 0;
    let loadPressure = 0;
    if (linkingSystem?.links) {
      linkingSystem.links.forEach(link => {
        if (typeof link?.glowData?.synergy === 'number') {
          totalSynergy += link.glowData.synergy;
          synergyCount += 1;
        }
        if (typeof link?.traffic?.load === 'number') {
          loadPressure += link.traffic.load;
        }
      });
    }
    averageSynergy = synergyCount > 0 ? totalSynergy / synergyCount : 0;
    loadPressure = synergyCount > 0 ? loadPressure / synergyCount : 0;

    if (averageSynergy > 0.75) {
      weights.resonance += 0.4;
      weights.calm -= 0.2;
    }
    if (loadPressure > 0.6) {
      weights.pressure += 0.25;
      weights.stormBias += 0.2;
      weights.calm -= 0.2;
    }
    if ((legendaryPack?.getActiveLegendaryCount?.() ?? 0) > 0) {
      weights.ascensionHaze += 0.2;
      weights.resonance += 0.1;
    }

    // Evolve toward moods rather than random presets
    if (evolutionManager?.isNetworkStable?.()) {
      weights.calm += 0.25;
      weights.pressure *= 0.6;
    }

    return Object.fromEntries(
      Object.entries(weights).map(([key, value]) => [key, Math.max(0, value)])
    );
  }

  _sampleWeightedMood(weights) {
    const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    if (total <= 0) return null;
    let choice = Math.random() * total;
    for (const [key, weight] of entries) {
      choice -= weight;
      if (choice <= 0) return key;
    }
    return entries[entries.length - 1]?.[0] ?? null;
  }

  /**
   * Start specific weather
   */
  startWeather(moodState, legendaryPack, linkingSystem) {
    const moodDef = this.moodStates[moodState];
    if (!moodDef) return;
    
    // Initialize registry
    this.registry.active = moodState;
    this.registry.timer = 0;
    this.registry.intensity = 0;
    this.registry.duration = moodDef.duration;
    this.registry.phase = 'fadeIn';
    this.registry.windStrength = moodDef.windStrength;
    
    this.lastWeatherTime = performance.now();
    
    // Create initial VFX
    this.createWeatherVFX(moodState, moodDef);
  }
  
  /**
   * Create VFX for weather type
   */
  createWeatherVFX(moodState, moodDef) {
    // Clean previous weather
    this.cleanupAllWeatherVFX();
    
    switch(moodState) {
      case 'calm':
        this.createCalmAtmosphereVFX(moodDef);
        break;
      case 'pressure':
        this.createPressureFieldVFX(moodDef);
        break;
      case 'resonance':
        this.createResonanceLayerVFX(moodDef);
        break;
      case 'stormBias':
        this.createStormPulseVFX(moodDef);
        break;
      case 'ascensionHaze':
        this.createAscensionHazeVFX(moodDef);
        break;
      default:
        this.createCalmAtmosphereVFX(moodDef);
        break;
    }
  }

  createCalmAtmosphereVFX(moodDef) {
    this.createNeonRainVFX(moodDef);
  }

  createPressureFieldVFX(moodDef) {
    this.createSigmaTurbulenceVFX(moodDef);
  }

  createResonanceLayerVFX(moodDef) {
    this.createAuroraWindsVFX(moodDef);
  }

  createStormPulseVFX(moodDef) {
    this.createQuantumStormVFX(moodDef);
  }

  createAscensionHazeVFX(moodDef) {
    this.createFractalFogVFX(moodDef);
  }

  updateCalmAtmosphereVFX(intensity, deltaTime) {
    this.updateNeonRainVFX(intensity, deltaTime);
  }

  updatePressureFieldVFX(intensity, deltaTime) {
    this.updateSigmaTurbulenceVFX(intensity, deltaTime);
  }

  updateResonanceLayerVFX(intensity, deltaTime) {
    this.updateAuroraWindsVFX(intensity, deltaTime);
  }

  updateStormPulseVFX(intensity, deltaTime) {
    this.updateQuantumStormVFX(intensity, deltaTime);
  }

  updateAscensionHazeVFX(intensity, deltaTime) {
    this.updateFractalFogVFX(intensity, deltaTime);
  }
  
  /**
   * Update active weather
   */
  updateActiveWeather(deltaTime, legendaryPack, linkingSystem, worldEvents) {
    this.registry.timer += deltaTime;
    
    const moodDef = this.moodStates[this.registry.active];
    if (!moodDef) {
      this.endWeather();
      return;
    }
    
    // Calculate phase and intensity
    const fadeInDuration = moodDef.fadeInDuration;
    const activeStart = fadeInDuration;
    const activeEnd = fadeInDuration + (moodDef.duration - fadeInDuration - moodDef.fadeOutDuration);
    const fadeOutStart = activeEnd;
    const totalDuration = moodDef.duration;
    
    let intensity = 0;
    let phase = 'idle';
    
    if (this.registry.timer < fadeInDuration) {
      phase = 'fadeIn';
      intensity = (this.registry.timer / fadeInDuration) * moodDef.maxIntensity;
    } else if (this.registry.timer < fadeOutStart) {
      phase = 'active';
      intensity = moodDef.maxIntensity;
    } else if (this.registry.timer < totalDuration) {
      phase = 'fadeOut';
      const fadeOutTime = this.registry.timer - fadeOutStart;
      intensity = (1 - fadeOutTime / moodDef.fadeOutDuration) * moodDef.maxIntensity;
    } else {
      this.endWeather();
      return;
    }
    
    if (worldEvents?.isEventActive?.()) {
      intensity *= 0.65;
    }

    this.registry.intensity = intensity;
    this.registry.phase = phase;
    
    // Update VFX based on mood state
    switch(this.registry.active) {
      case 'calm':
        this.updateCalmAtmosphereVFX(intensity, deltaTime);
        break;
      case 'pressure':
        this.updatePressureFieldVFX(intensity, deltaTime);
        break;
      case 'resonance':
        this.updateResonanceLayerVFX(intensity, deltaTime);
        break;
      case 'stormBias':
        this.updateStormPulseVFX(intensity, deltaTime);
        break;
      case 'ascensionHaze':
        this.updateAscensionHazeVFX(intensity, deltaTime);
        break;
    }

    this._updateWeatherLOD();
  }
  
  /**
   * STORM BIAS - Storm envelope atmosphere
   */
  createQuantumStormVFX(weatherDef) {
    const palette = ATMOSPHERE_PALETTE.stormBias;
    this._createAtmosphericWash(palette.void, 0.28, -100);
    this._createAmbientHazeSheets(palette.haze, 1, -96);
    this._createPulseClouds(palette.core, 4, -92);
    this._createPressureBands(palette.band, 3);
  }
  
  /**
   * Update quantum storm VFX
   */
  updateQuantumStormVFX(intensity, deltaTime) {
    this.vfxLayers.overlays.forEach(overlay => {
      if (overlay.userData.type === 'atmospheric_wash') {
        overlay.material.opacity = Math.min(0.38, intensity * 0.24 + 0.08);
      }
      if (overlay.userData.type === 'pulse_cloud') {
        overlay.material.opacity = Math.max(0, Math.sin(this.animationTime * 0.7 + overlay.userData.speed * 16) * 0.08 * intensity + overlay.userData.baseOpacity * intensity);
        overlay.position.x += Math.sin(this.animationTime * 0.3) * 0.03;
      }
    });

    this.vfxLayers.beams.forEach(band => {
      if (band.userData.type === 'pressure_band') {
        band.material.opacity = Math.min(0.22, 0.14 * intensity + 0.04);
        band.position.y += Math.sin(this.animationTime * 0.06 + band.userData.index) * 0.03;
      }
    });
  }
  
  /**
   * PRESSURE - Aurora pressure atmosphere
   */
  createSigmaTurbulenceVFX(weatherDef) {
    const palette = ATMOSPHERE_PALETTE.pressure;
    this._createAtmosphericWash(palette.haze, 0.12, -98);
    this._createAmbientHazeSheets(palette.haze, 1, -94);
    this._createPressureBands(palette.band, 3);

    const ribbons = this._createAuroraRibbons(palette.core, 3);
    ribbons.forEach(ribbon => {
      ribbon.userData.type = 'pressure_ribbon';
    });
  }
  
  /**
   * Update sigma turbulence VFX
   */
  updateSigmaTurbulenceVFX(intensity, deltaTime) {
    this.vfxLayers.beams.forEach(band => {
      if (band.userData.type === 'pressure_band') {
        band.material.opacity = Math.min(0.22, 0.16 * intensity + 0.03);
        band.position.y += Math.sin(this.animationTime * 0.06 + band.userData.index) * 0.03;
      }
    });

    this.vfxLayers.ribbons.forEach(ribbon => {
      if (ribbon.userData.type === 'pressure_ribbon') {
        ribbon.material.opacity = Math.min(0.2, intensity * 0.18 + 0.03);
        ribbon.position.y += Math.sin(this.animationTime * 0.04 + ribbon.userData.index) * 0.035;
      }
    });
  }
  
  /**
   * CALM - Gentle atmospheric intelligence
   */
  createNeonRainVFX(weatherDef) {
    const palette = ATMOSPHERE_PALETTE.calm;
    this._createAtmosphericWash(palette.core, 0.1, -96);
    this._createAmbientHazeSheets(palette.haze, 1, -92);
    this._createAuroraRibbons(palette.core, 2);
    this._createPulseClouds(palette.band, 2, -90);
  }
  
  /**
   * Update neon rain VFX
   */
  updateNeonRainVFX(intensity, deltaTime) {
    this.vfxLayers.overlays.forEach(overlay => {
      if (overlay.userData.type === 'pulse_cloud') {
        overlay.material.opacity = Math.max(0, overlay.userData.baseOpacity * intensity * 0.9);
        overlay.position.x += Math.sin(this.animationTime * 0.18 + overlay.userData.speed * 4) * 0.01;
      }
      if (overlay.userData.type === 'aurora_ribbon') {
        overlay.material.opacity = Math.min(0.18, intensity * 0.16 + 0.02);
        overlay.position.y += Math.sin(this.animationTime * 0.05 + overlay.userData.index) * 0.01;
      }
    });
  }
  
  /**
   * RESONANCE - Aurora ribbon overlay
   */
  createAuroraWindsVFX(weatherDef) {
    const palette = ATMOSPHERE_PALETTE.resonance;
    this._createAtmosphericWash(palette.haze, 0.1, -96);
    this._createAmbientHazeSheets(palette.core, 2, -94);
    this._createAuroraRibbons(palette.core, 2);
  }
  
  /**
   * Update aurora winds VFX
   */
  updateAuroraWindsVFX(intensity, deltaTime) {
    this.vfxLayers.ribbons.forEach(ribbon => {
      if (ribbon.userData.type === 'aurora_ribbon') {
        ribbon.material.opacity = Math.min(0.26, intensity * 0.22 + 0.04);
        ribbon.position.y += Math.sin(this.animationTime * 0.12 + ribbon.userData.index) * 0.025;
      }
    });

    this.vfxLayers.overlays.forEach(cloud => {
      if (cloud.userData.type === 'pulse_cloud') {
        cloud.material.opacity = Math.max(0, (Math.sin(this.animationTime * 0.55 + cloud.userData.speed * 8) * 0.06 + cloud.userData.baseOpacity * 0.8) * intensity);
      }
    });
  }
  
  /**
   * ASCENSION HAZE - Ascension haze layer
   */
  createFractalFogVFX(weatherDef) {
    const palette = ATMOSPHERE_PALETTE.ascensionHaze;
    this._createAtmosphericWash(palette.haze, 0.12, -100);
    this._createAmbientHazeSheets(palette.band, 2, -96);
    this._createPulseClouds(palette.core, 2, -92);
    
    for (let i = 0; i < 8; i++) {
      const fractalGeo = this._getSharedGeometry('fractalFog.fractalGeo', () => new THREE.TetrahedronGeometry(0.16, 1));
      const fractalMat = new THREE.MeshBasicMaterial({
        color: palette.band,
        transparent: true,
        opacity: 0,
        emissive: palette.band,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      const fractal = new THREE.Mesh(fractalGeo, fractalMat);
      fractal.position.set(
        (Math.random() - 0.5) * 100,
        30 + Math.random() * 25,
        (Math.random() - 0.5) * 80
      );
      fractal.userData = {
        isAIWeatherVFX: true,
        type: 'fractal_particle',
        drift: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.12,
          (Math.random() - 0.5) * 0.15
        ),
        rotationSpeed: 0.5 + Math.random() * 0.8
      };
      
      this.root.add(fractal);
      this.vfxLayers.particles.push(fractal);
    }
  }
  
  /**
   * Update fractal fog VFX
   */
  updateFractalFogVFX(intensity, deltaTime) {
    this.vfxLayers.overlays.forEach(overlay => {
      if (overlay.userData.type === 'atmospheric_wash') {
        overlay.material.opacity = intensity * 0.2;
      }
    });
    
    this.vfxLayers.particles.forEach(particle => {
      if (particle.userData.type === 'fractal_particle') {
        particle.position.addScaledVector(particle.userData.drift, deltaTime);
        particle.rotation.x += particle.userData.rotationSpeed * deltaTime * 0.36;
        particle.rotation.y += particle.userData.rotationSpeed * deltaTime * 0.28;
        particle.material.opacity = 0.32 * intensity;
        if (particle.position.x > 100) particle.position.x = -100;
        if (particle.position.x < -100) particle.position.x = 100;
        if (particle.position.y > 70) particle.position.y = 25;
      }
    });
  }
  
  /**
   * Update wind vector for camera effects and animations
   */
  updateWindVector(deltaTime, linkingSystem) {
    if (!this.registry.active) {
      this.registry.windVector.set(0, 0, 0);
      return;
    }
    
    // Calculate wind based on synergy
    let synergy = 0;
    if (linkingSystem && linkingSystem.links) {
      linkingSystem.links.forEach(link => {
        if (link.glowData && link.glowData.synergy) {
          synergy += link.glowData.synergy;
        }
      });
    }
    
    // Wind direction changes based on active mood state
    let windAngle = 0;
    switch(this.registry.active) {
      case 'calm':
        windAngle = this.windPhase * 0.3;
        break;
      case 'pressure':
        windAngle = this.windPhase * 1.2;
        break;
      case 'resonance':
        windAngle = this.windPhase * 0.2;
        break;
      case 'stormBias':
        windAngle = this.windPhase * 1.6;
        break;
      case 'ascensionHaze':
        windAngle = this.windPhase * 0.15;
        break;
      default:
        windAngle = this.windPhase * 0.3;
    }
    
    // Set wind vector
    const windSpeed = Math.sin(windAngle) * 0.5 + 0.5;
    this.registry.windVector.x = Math.cos(windAngle) * windSpeed * this.registry.windStrength;
    this.registry.windVector.z = Math.sin(windAngle) * windSpeed * this.registry.windStrength;
    this.registry.windVector.y = Math.sin(this.windPhase * 0.3) * 0.2 * this.registry.windStrength;
  }
  
  /**
   * End current weather
   */
  endWeather() {
    this.cleanupAllWeatherVFX();
    this.registry.active = null;
    this.registry.timer = 0;
    this.registry.intensity = 0;
    this.registry.phase = 'idle';
    this.registry.windVector.set(0, 0, 0);
  }
  
  /**
   * Clean up all weather VFX
   */
  cleanupAllWeatherVFX() {
    // Remove all overlays
    this.vfxLayers.overlays.forEach(overlay => {
      this.root.remove(overlay);
      this._releaseMeshResources(overlay);
    });
    this.vfxLayers.overlays = [];
    
    // Remove all particles
    this.vfxLayers.particles.forEach(particle => {
      this.root.remove(particle);
      this._releaseMeshResources(particle);
    });
    this.vfxLayers.particles = [];
    
    // Remove all waves
    this.vfxLayers.waves.forEach(wave => {
      this.root.remove(wave);
      this._releaseMeshResources(wave);
    });
    this.vfxLayers.waves = [];
    
    // Remove all ribbons
    this.vfxLayers.ribbons.forEach(ribbon => {
      this.root.remove(ribbon);
      this._releaseMeshResources(ribbon);
    });
    this.vfxLayers.ribbons = [];
    
    // Remove all glitches
    this.vfxLayers.glitches.forEach(glitch => {
      this.root.remove(glitch);
      this._releaseMeshResources(glitch);
    });
    this.vfxLayers.glitches = [];
    
    // Remove all beams
    this.vfxLayers.beams.forEach(beam => {
      this.root.remove(beam);
      this._releaseMeshResources(beam);
    });
    this.vfxLayers.beams = [];
    
    // Remove all glows
    this.vfxLayers.glows.forEach(glow => {
      this.root.remove(glow);
      this._releaseMeshResources(glow);
    });
    this.vfxLayers.glows = [];
    
    // Remove all clouds
    this.vfxLayers.clouds.forEach(cloud => {
      this.root.remove(cloud);
      this._releaseMeshResources(cloud);
    });
    this.vfxLayers.clouds = [];
  }

  dispose() {
    this.cleanupAllWeatherVFX();
    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
  }
  
  /**
   * Get weather info for HUD display
   */
  getActiveWeatherInfo() {
    if (!this.registry.active) return null;
    
    const moodDef = this.moodStates[this.registry.active];
    return {
      name: moodDef.description,
      intensity: this.registry.intensity,
      phase: this.registry.phase
    };
  }
  
  /**
   * Check if weather is active
   */
  isWeatherActive() {
    return !!this.registry.active;
  }
  
  /**
   * Get active weather type
   */
  getActiveWeatherType() {
    return this.registry.active;
  }
  
  /**
   * Get weather intensity
   */
  getWeatherIntensity() {
    return this.registry.intensity;
  }
  
  /**
   * Get wind vector
   */
  getWindVector() {
    return this.registry.windVector.clone();
  }
  
  /**
   * Force trigger specific weather (for testing)
   */
  forceWeather(weatherType, linkingSystem = null) {
    this.startWeather(weatherType, null, linkingSystem);
  }
  
  /**
   * Disable all weather (safe shutdown)
   */
  disableAll() {
    this.cleanupAllWeatherVFX();
    this.registry = {
      active: null,
      timer: 0,
      intensity: 0,
      duration: 0,
      phase: 'idle',
      windVector: new THREE.Vector3(0, 0, 0),
      windStrength: 0
    };
    this.lastWeatherTime = 0;
    this.interpretationAccumulator = 0;
  }

  /**
   * Reset internal state for world switch
   * Clears mutable state without removing objects from scene
   * Safe to call multiple times
   */
  resetForWorldSwitch() {
    // Clear registry state
    if (this.registry) {
      this.registry.active = null;
      this.registry.timer = 0;
      this.registry.intensity = 0;
      this.registry.duration = 0;
      this.registry.phase = 'idle';
      this.registry.windVector.set(0, 0, 0);
      this.registry.windStrength = 0;
    }

    // Clear tracking timestamps
    this.lastWeatherCheck = 0;
    this.lastWeatherTime = 0;
    this.animationTime = 0;
    this.interpretationAccumulator = 0;
  }
}
