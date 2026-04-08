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
      lastWeatherType: null,
      timer: 0,
      intensity: 0,
      duration: 0,
      phase: 'idle', // idle, attack, crest, release
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
        description: 'Calm Atmosphere',
        subtitle: 'Soft flow with gentle pulses',
        visualTone: 'soft',
        paletteKey: 'calm'
      },
      pressure: {
        duration: 14.0,
        fadeInDuration: 2.0,
        fadeOutDuration: 2.8,
        maxIntensity: 0.75,
        windStrength: 0.45,
        description: 'Pressure Field',
        subtitle: 'Compressed aurora tension',
        visualTone: 'tense',
        paletteKey: 'pressure'
      },
      resonance: {
        duration: 18.0,
        fadeInDuration: 3.0,
        fadeOutDuration: 3.2,
        maxIntensity: 0.7,
        windStrength: 0.3,
        description: 'Resonance Layer',
        subtitle: 'Harmonic ribbon resonance',
        visualTone: 'ethereal',
        paletteKey: 'resonance'
      },
      stormBias: {
        duration: 13.5,
        fadeInDuration: 2.0,
        fadeOutDuration: 2.5,
        maxIntensity: 0.8,
        windStrength: 0.65,
        description: 'Storm Bias',
        subtitle: 'Charged storm envelope',
        visualTone: 'charged',
        paletteKey: 'stormBias'
      },
      ascensionHaze: {
        duration: 20.0,
        fadeInDuration: 3.0,
        fadeOutDuration: 3.8,
        maxIntensity: 0.72,
        windStrength: 0.25,
        description: 'Ascension Haze',
        subtitle: 'Luminous ascension haze',
        visualTone: 'elevated',
        paletteKey: 'ascensionHaze'
      }
    };
    
    // Configuration
    this.config = {
      weatherCheckInterval: 6.0,         // Check every 6 seconds
      weatherChance: 0.02,               // 2% base chance per check
      minSynergyForWeather: 0.55,        // Minimum average link synergy to trigger
      weatherCooldown: 20.0,             // 20 seconds between weather
      windUpdateFrequency: 0.1,          // Update wind vector frequently
      interpretationInterval: 0.25       // Phase B pilot: ~4 Hz interpretation, motion stays 60 Hz
    };
    
    // Weather signature map
    this.weatherSignatures = {
      calm: {
        title: 'Civilized Horizon',
        signature: 'cyan-white nucleus, čistý a čitateľný',
        core: 'cyan-white nucleus',
        overlay: '1-2 jemné aurora ribbons, sparse clouds',
        atmosphere: 'čistý haze sheet, deep void base',
        motion: 'pomalé dýchanie, tiché prúdenie',
        motionBias: 'breathing',
        layerPriority: 'near',
        paletteKey: 'calm'
      },
      pressure: {
        title: 'Compressed Pressure Veil',
        signature: 'violet nucleus s cyan edge',
        core: 'violet nucleus s cyan edge',
        overlay: 'pressure bands, tighter ribbon stack',
        atmosphere: 'hustejší fog, tlmený wash',
        motion: 'tlak, kompresia, krátky jitter',
        motionBias: 'compression',
        layerPriority: 'mid',
        paletteKey: 'pressure'
      },
      resonance: {
        title: 'Aurora Intelligence',
        signature: 'mint/cyan resonant core',
        core: 'mint/cyan resonant core',
        overlay: '2-3 ribbons, wave-like sheets',
        atmosphere: 'vrstvená aurora hmla',
        motion: 'harmonic sway, symetrický drift',
        motionBias: 'harmonic sway',
        layerPriority: 'near',
        paletteKey: 'resonance'
      },
      stormBias: {
        title: 'Storm Cathedral',
        signature: 'dark void core s violet-white strike',
        core: 'dark void core s violet-white strike',
        overlay: 'ťažké bands, tvrdšie cloud pláty',
        atmosphere: 'hustý storm wash, silný horizon',
        motion: 'silný wind, široký pulse, rare flashes',
        motionBias: 'pressure front',
        layerPriority: 'far',
        paletteKey: 'stormBias'
      },
      ascensionHaze: {
        title: 'Fractal Ascension Haze',
        signature: 'ritual-white / mint core',
        core: 'ritual-white / mint core',
        overlay: 'fractal particles, soft pulses',
        atmosphere: 'airy haze sheets, vertical bloom',
        motion: 'pomalý lift, sacred drift, ľahká rotácia',
        motionBias: 'vertical lift',
        layerPriority: 'mid',
        paletteKey: 'ascensionHaze'
      }
    };
    
    // Tracking
    this.lastWeatherCheck = performance.now();
    this.lastWeatherTime = 0;
    this.animationTime = 0;
    this.interpretationAccumulator = 0;
    
    // VFX containers
    this.vfxLayers = {
      particles: [],
      ribbons: [],
      overlays: [],
      beams: []
    };
    
    this.windPhase = 0;
    this.recentWeatherHistory = [];
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
    mesh.userData = { isAIWeatherVFX: true, type: 'atmospheric_wash', baseOpacity: opacity, targetOpacity: opacity, baseScale: 1 };
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
      sheet.userData = {
        isAIWeatherVFX: true,
        type: 'ambient_haze',
        layer: i,
        speed: 0.015 + i * 0.008,
        baseOpacity: 0.12,
        targetOpacity: 0.12,
        baseScale: 1
      };
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
      const baseOpacity = 0.08 + Math.random() * 0.06;
      cloud.userData = {
        isAIWeatherVFX: true,
        type: 'pulse_cloud',
        speed: 0.008 + Math.random() * 0.012,
        baseOpacity,
        targetOpacity: baseOpacity,
        baseScale: 1
      };
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
      const baseOpacity = 0.05 + Math.random() * 0.04;
      ribbon.userData = {
        isAIWeatherVFX: true,
        type: 'aurora_ribbon',
        index: i,
        speed: 0.018 + i * 0.008,
        baseOpacity,
        targetOpacity: baseOpacity,
        baseScale: 1
      };
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
      const baseOpacity = 0.05 + i * 0.02;
      band.userData = {
        isAIWeatherVFX: true,
        type: 'pressure_band',
        index: i,
        speed: 0.02 + i * 0.005,
        baseOpacity,
        targetOpacity: baseOpacity,
        baseScale: 1
      };
      this.root.add(band);
      this.vfxLayers.beams.push(band);
      bands.push(band);
    }
    return bands;
  }

  _createMoodSilhouette(type, palette, depth, weatherDef) {
    let geo;
    let position = new THREE.Vector3(0, 18, depth);
    let rotation = new THREE.Euler(-Math.PI / 2, 0, 0);
    let size = 1.0;
    switch(type) {
      case 'calm':
        geo = this._getSharedGeometry(`silhouette.calm`, () => new THREE.CircleGeometry(58, 34));
        position.set(0, 24, depth);
        break;
      case 'pressure':
        geo = this._getSharedGeometry(`silhouette.pressure`, () => new THREE.PlaneGeometry(240, 22));
        position.set(0, 18, depth);
        break;
      case 'resonance':
        geo = this._getSharedGeometry(`silhouette.resonance`, () => new THREE.PlaneGeometry(280, 16));
        position.set(0, 24, depth);
        break;
      case 'stormBias':
        geo = this._getSharedGeometry(`silhouette.stormBias`, () => new THREE.PlaneGeometry(220, 24));
        position.set(0, 20, depth);
        break;
      case 'ascensionHaze':
        geo = this._getSharedGeometry(`silhouette.ascensionHaze`, () => new THREE.CylinderGeometry(3.5, 3.5, 60, 6));
        rotation = new THREE.Euler(0, 0, 0);
        position.set(0, 28, depth + 6);
        size = 1.0;
        break;
      default:
        geo = this._getSharedGeometry(`silhouette.default`, () => new THREE.CircleGeometry(56, 32));
        position.set(0, 18, depth);
        break;
    }

    const texture = this._createGradientTexture(palette.core, palette.void);
    const mat = this._getSharedMaterial(`silhouette.${type}`, () => new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: Math.min(0.18, (weatherDef.maxIntensity || 0.7) * 0.18),
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide
    }));

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    mesh.scale.setScalar(size);
    mesh.userData = {
      isAIWeatherVFX: true,
      type: `${type}_silhouette`,
      baseOpacity: mat.opacity,
      targetOpacity: mat.opacity,
      baseScale: size,
      layerPriority: this.weatherSignatures[type]?.layerPriority || 'far'
    };
    this.root.add(mesh);
    this.vfxLayers.overlays.push(mesh);
    return mesh;
  }

  _applyWeatherOpacity(object, targetOpacity) {
    if (!object || !object.material) return;
    object.userData.targetOpacity = targetOpacity;
    object.material.opacity = targetOpacity;
  }

  _updateWeatherLOD() {
    if (!this.camera) return;
    const cameraPos = this.camera.position;
    const farThreshold = 90;
    const midThreshold = 50;

    [...this.vfxLayers.overlays, ...this.vfxLayers.ribbons, ...this.vfxLayers.particles, ...this.vfxLayers.beams].forEach((object) => {
      if (!object || !object.position || !object.material) return;
      const dist = object.position.distanceTo(cameraPos);
      const baseOpacity = typeof object.userData.baseOpacity === 'number' ? object.userData.baseOpacity : (object.material.opacity ?? 1);
      const activeOpacity = typeof object.userData.targetOpacity === 'number' ? object.userData.targetOpacity : baseOpacity;
      const rangeFactor = dist > farThreshold ? 0.5 : dist > midThreshold ? 0.75 : 1;
      object.material.opacity = Math.min(baseOpacity, activeOpacity * rangeFactor);
    });
  }
  
  /**
   * Main update loop (called once per frame)
   */
  update(deltaTime, legendaryPack, linkingSystem, evolutionManager, worldEvents, worldMoodBias) {
    this.animationTime += deltaTime;
    this.windPhase += deltaTime;
    
    // Phase B pilot: throttle interpretation/decisions to keep mood at ~4 Hz while visuals/motion stay 60 Hz
    this.interpretationAccumulator += deltaTime;
    const shouldRunInterpretation = this.interpretationAccumulator >= this.config.interpretationInterval;
    
    if (shouldRunInterpretation) {
      this.interpretationAccumulator = 0;
      // Check for new weather triggers periodically (interpretation layer)
      this.checkWeatherTriggers(legendaryPack, linkingSystem, evolutionManager, worldEvents, worldMoodBias);
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
  checkWeatherTriggers(legendaryPack, linkingSystem, evolutionManager, worldEvents, worldMoodBias) {
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
      this.triggerMoodState(legendaryPack, linkingSystem, evolutionManager, worldEvents, worldMoodBias);
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
  triggerMoodState(legendaryPack, linkingSystem, evolutionManager, worldEvents, worldMoodBias) {
    const moodWeights = this._buildMoodStateWeights(legendaryPack, linkingSystem, evolutionManager, worldEvents, worldMoodBias);
    const moodState = this._sampleWeightedMood(moodWeights);
    if (!moodState) return;
    this.startWeather(moodState, legendaryPack, linkingSystem);
  }

  _buildMoodStateWeights(legendaryPack, linkingSystem, evolutionManager, worldEvents, worldMoodBias) {
    const weights = {
      calm: 0.9,
      pressure: 0.4,
      resonance: 0.7,
      stormBias: 0.3,
      ascensionHaze: 0.35
    };

    const stateBias = {
      calm: {calm: 0.4, pressure: 0.05, resonance: 0.1, stormBias: 0, ascensionHaze: 0.05},
      pressure: {calm: 0.15, pressure: -0.2, resonance: 0.1, stormBias: 0.15, ascensionHaze: 0.05},
      resonance: {calm: 0.05, pressure: 0.1, resonance: -0.1, stormBias: 0.1, ascensionHaze: 0.15},
      stormBias: {calm: 0.25, pressure: 0.05, resonance: 0.1, stormBias: -0.3, ascensionHaze: 0.1},
      ascensionHaze: {calm: 0.1, pressure: 0.1, resonance: 0.15, stormBias: 0.05, ascensionHaze: -0.2}
    };

    const lastMood = this.registry.lastWeatherType;
    if (lastMood && stateBias[lastMood]) {
      Object.entries(stateBias[lastMood]).forEach(([key, bias]) => {
        weights[key] = (weights[key] ?? 0) + bias;
      });
    }

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

    weights.resonance += THREE.MathUtils.clamp((averageSynergy - 0.6) * 1.2, 0, 0.35);
    weights.pressure += THREE.MathUtils.clamp((loadPressure - 0.4) * 0.35, 0, 0.25);
    weights.stormBias += THREE.MathUtils.clamp(loadPressure * 0.2, 0, 0.15);
    weights.calm += THREE.MathUtils.clamp(0.7 - averageSynergy, 0, 0.25);

    const legendaryCount = legendaryPack?.getActiveLegendaryCount?.() ?? 0;
    if (legendaryCount > 0) {
      weights.ascensionHaze += Math.min(0.4, legendaryCount * 0.18);
      weights.resonance += 0.1;
    }

    if (worldEvents?.isEventActive?.()) {
      weights.calm += 0.15;
      weights.pressure += 0.2;
      weights.stormBias -= 0.1;
    }

    if (worldMoodBias && typeof worldMoodBias === 'object') {
      Object.entries(worldMoodBias).forEach(([key, bias]) => {
        if (weights[key] !== undefined && typeof bias === 'number') {
          weights[key] += bias * 0.2;
        }
      });
    }

    if (evolutionManager?.isNetworkStable?.()) {
      weights.calm += 0.3;
      weights.resonance += 0.1;
      weights.stormBias -= 0.15;
    }

    if (Array.isArray(this.recentWeatherHistory) && this.recentWeatherHistory.length > 0) {
      this.recentWeatherHistory.forEach((recentMood) => {
        if (weights[recentMood] !== undefined) {
          weights[recentMood] *= 0.65;
        }
      });
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
    
    // Preserve last weather for bias decisions
    this.registry.lastWeatherType = this.registry.active;
    this.recentWeatherHistory.push(moodState);
    if (this.recentWeatherHistory.length > 4) {
      this.recentWeatherHistory.shift();
    }

    // Initialize registry
    this.registry.active = moodState;
    this.registry.timer = 0;
    this.registry.intensity = 0;
    this.registry.duration = moodDef.duration;
    this.registry.phase = 'attack';
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
    
    const totalDuration = moodDef.duration;
    const fadeInDuration = moodDef.fadeInDuration;
    const fadeOutDuration = moodDef.fadeOutDuration;
    const crestEnd = totalDuration - fadeOutDuration;
    
    let intensity = 0;
    let phase = 'attack';
    
    if (this.registry.timer < fadeInDuration) {
      phase = 'attack';
      intensity = (this.registry.timer / fadeInDuration) * moodDef.maxIntensity;
    } else if (this.registry.timer < crestEnd) {
      phase = 'crest';
      intensity = moodDef.maxIntensity;
    } else if (this.registry.timer < totalDuration) {
      phase = 'release';
      const releaseTime = this.registry.timer - crestEnd;
      intensity = (1 - releaseTime / fadeOutDuration) * moodDef.maxIntensity;
    } else {
      this.endWeather();
      return;
    }
    
    if (worldEvents?.isEventActive?.()) {
      intensity *= 0.65;
    }

    this.registry.intensity = intensity;
    this.registry.phase = phase;
    
    switch(this.registry.active) {
      case 'calm':
        this.updateCalmAtmosphereVFX(intensity, phase, deltaTime);
        break;
      case 'pressure':
        this.updatePressureFieldVFX(intensity, phase, deltaTime);
        break;
      case 'resonance':
        this.updateResonanceLayerVFX(intensity, phase, deltaTime);
        break;
      case 'stormBias':
        this.updateStormPulseVFX(intensity, phase, deltaTime);
        break;
      case 'ascensionHaze':
        this.updateAscensionHazeVFX(intensity, phase, deltaTime);
        break;
    }

    this._updateWeatherLOD();
  }
  
  updateCalmAtmosphereVFX(intensity, phase, deltaTime) {
    this.updateNeonRainVFX(intensity, phase, deltaTime);
  }

  updatePressureFieldVFX(intensity, phase, deltaTime) {
    this.updateSigmaTurbulenceVFX(intensity, phase, deltaTime);
  }

  updateResonanceLayerVFX(intensity, phase, deltaTime) {
    this.updateAuroraWindsVFX(intensity, phase, deltaTime);
  }

  updateStormPulseVFX(intensity, phase, deltaTime) {
    this.updateQuantumStormVFX(intensity, phase, deltaTime);
  }

  updateAscensionHazeVFX(intensity, phase, deltaTime) {
    this.updateFractalFogVFX(intensity, phase, deltaTime);
  }
  
  /**
   * STORM BIAS - Storm envelope atmosphere
   */
  createQuantumStormVFX(weatherDef) {
    const palette = ATMOSPHERE_PALETTE.stormBias;
    this._createAtmosphericWash(palette.void, Math.min(0.28, weatherDef.maxIntensity * 0.3), -100);
    this._createMoodSilhouette('stormBias', palette, -90, weatherDef);
    this._createPulseClouds(palette.core, 2, -92);
    this._createPressureBands(palette.band, 1);
  }
  
  /**
   * Update quantum storm VFX
   */
  updateQuantumStormVFX(intensity, phase, deltaTime) {
    this.vfxLayers.overlays.forEach(overlay => {
      if (overlay.userData.type === 'atmospheric_wash') {
        this._applyWeatherOpacity(overlay, THREE.MathUtils.clamp(overlay.userData.baseOpacity * (0.8 + intensity * 0.3), 0, overlay.userData.baseOpacity));
      }
      if (overlay.userData.type === 'pulse_cloud') {
        const phaseScale = phase === 'attack' ? 0.85 : phase === 'crest' ? 1 : 0.75;
        this._applyWeatherOpacity(overlay, THREE.MathUtils.clamp((Math.sin(this.animationTime * 0.7 + overlay.userData.speed * 16) * 0.08 + overlay.userData.baseOpacity) * intensity * phaseScale, 0, overlay.userData.baseOpacity));
        overlay.position.x += Math.sin(this.animationTime * 0.3) * 0.03;
      }
    });

    this.vfxLayers.beams.forEach(band => {
      if (band.userData.type === 'pressure_band') {
        const phaseScale = phase === 'release' ? 0.85 : 1;
        this._applyWeatherOpacity(band, THREE.MathUtils.clamp((0.14 * intensity + 0.04) * phaseScale, 0, band.userData.baseOpacity));
        band.position.y += Math.sin(this.animationTime * 0.06 + band.userData.index) * 0.03;
      }
    });
  }
  
  /**
   * PRESSURE - Aurora pressure atmosphere
   */
  createSigmaTurbulenceVFX(weatherDef) {
    const palette = ATMOSPHERE_PALETTE.pressure;
    this._createAtmosphericWash(palette.haze, Math.min(0.14, weatherDef.maxIntensity * 0.2), -98);
    this._createMoodSilhouette('pressure', palette, -94, weatherDef);
    this._createPressureBands(palette.band, 1);

    const ribbons = this._createAuroraRibbons(palette.core, 2);
    ribbons.forEach(ribbon => {
      ribbon.userData.type = 'pressure_ribbon';
      ribbon.userData.baseScale = 1.1;
    });
  }
  
  /**
   * Update sigma turbulence VFX
   */
  updateSigmaTurbulenceVFX(intensity, phase, deltaTime) {
    this.vfxLayers.beams.forEach(band => {
      if (band.userData.type === 'pressure_band') {
        const phaseScale = phase === 'attack' ? 0.85 : phase === 'crest' ? 1 : 0.75;
        this._applyWeatherOpacity(band, THREE.MathUtils.clamp((0.16 * intensity + 0.03) * phaseScale, 0, band.userData.baseOpacity));
        band.position.y += Math.sin(this.animationTime * 0.06 + band.userData.index) * 0.03;
        band.scale.x = 1 + Math.sin(this.animationTime * 0.08 + band.userData.index) * 0.05;
      }
    });

    this.vfxLayers.ribbons.forEach(ribbon => {
      if (ribbon.userData.type === 'pressure_ribbon') {
        const phaseScale = phase === 'release' ? 0.85 : 1;
        this._applyWeatherOpacity(ribbon, THREE.MathUtils.clamp((intensity * 0.18 + 0.03) * phaseScale, 0, ribbon.userData.baseOpacity));
        ribbon.position.y += Math.sin(this.animationTime * 0.04 + ribbon.userData.index) * 0.035;
      }
    });
  }
  
  /**
   * CALM - Gentle atmospheric intelligence
   */
  createNeonRainVFX(weatherDef) {
    const palette = ATMOSPHERE_PALETTE.calm;
    this._createAtmosphericWash(palette.core, Math.min(0.12, weatherDef.maxIntensity * 0.16), -96);
    this._createMoodSilhouette('calm', palette, -94, weatherDef);
    this._createAuroraRibbons(palette.core, 2);
    this._createPulseClouds(palette.band, 1, -90);
  }
  
  /**
   * Update neon rain VFX
   */
  updateNeonRainVFX(intensity, phase, deltaTime) {
    this.vfxLayers.overlays.forEach(overlay => {
      if (overlay.userData.type === 'pulse_cloud') {
        const phaseScale = phase === 'attack' ? 0.9 : phase === 'crest' ? 1 : 0.8;
        this._applyWeatherOpacity(overlay, THREE.MathUtils.clamp(overlay.userData.baseOpacity * intensity * 0.9 * phaseScale, 0, overlay.userData.baseOpacity));
        overlay.position.x += Math.sin(this.animationTime * 0.18 + overlay.userData.speed * 4) * 0.01;
        overlay.position.y += Math.sin(this.animationTime * 0.12) * 0.02;
      }
      if (overlay.userData.type === 'aurora_ribbon') {
        const target = Math.min(0.18, intensity * 0.16 + 0.02);
        this._applyWeatherOpacity(overlay, THREE.MathUtils.clamp(target, 0, overlay.userData.baseOpacity));
        overlay.position.y += Math.sin(this.animationTime * 0.05 + overlay.userData.index) * 0.01;
      }
    });
  }
  
  /**
   * RESONANCE - Aurora ribbon overlay
   */
  createAuroraWindsVFX(weatherDef) {
    const palette = ATMOSPHERE_PALETTE.resonance;
    this._createAtmosphericWash(palette.haze, Math.min(0.14, weatherDef.maxIntensity * 0.18), -96);
    this._createMoodSilhouette('resonance', palette, -94, weatherDef);
    const ribbons = this._createAuroraRibbons(palette.core, 2);
    ribbons.forEach((ribbon, index) => {
      ribbon.userData.baseOpacity = Math.min(0.18, (weatherDef.maxIntensity || 0.7) * 0.18);
      ribbon.userData.targetOpacity = ribbon.userData.baseOpacity;
      ribbon.userData.index = index;
    });
  }
  
  /**
   * Update aurora winds VFX
   */
  updateAuroraWindsVFX(intensity, phase, deltaTime) {
    this.vfxLayers.ribbons.forEach(ribbon => {
      if (ribbon.userData.type === 'aurora_ribbon') {
        const target = Math.min(0.26, intensity * 0.22 + 0.04);
        this._applyWeatherOpacity(ribbon, THREE.MathUtils.clamp(target, 0, ribbon.userData.baseOpacity));
        ribbon.position.y += Math.sin(this.animationTime * 0.12 + ribbon.userData.index) * 0.025;
        ribbon.position.x += Math.sin(this.animationTime * 0.08 + ribbon.userData.index) * 0.02;
      }
    });

    this.vfxLayers.overlays.forEach(cloud => {
      if (cloud.userData.type === 'pulse_cloud') {
        const phaseScale = phase === 'attack' ? 0.9 : phase === 'crest' ? 1 : 0.8;
        this._applyWeatherOpacity(cloud, THREE.MathUtils.clamp((Math.sin(this.animationTime * 0.55 + cloud.userData.speed * 8) * 0.06 + cloud.userData.baseOpacity * 0.8) * intensity * phaseScale, 0, cloud.userData.baseOpacity));
        cloud.position.x += Math.sin(this.animationTime * 0.25) * 0.02;
      }
    });
  }
  
  /**
   * ASCENSION HAZE - Ascension haze layer
   */
  createFractalFogVFX(weatherDef) {
    const palette = ATMOSPHERE_PALETTE.ascensionHaze;
    this._createAtmosphericWash(palette.haze, Math.min(0.14, weatherDef.maxIntensity * 0.18), -100);
    this._createMoodSilhouette('ascensionHaze', palette, -92, weatherDef);
    this._createAmbientHazeSheets(palette.band, 1, -96);
    this._createPulseClouds(palette.core, 1, -92);
    
    for (let i = 0; i < 4; i++) {
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
      const baseOpacity = 0.24 + Math.random() * 0.12;
      fractal.userData = {
        isAIWeatherVFX: true,
        type: 'fractal_particle',
        drift: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.12,
          (Math.random() - 0.5) * 0.15
        ),
        rotationSpeed: 0.5 + Math.random() * 0.8,
        baseOpacity,
        targetOpacity: baseOpacity,
        baseScale: 1
      };
      
      this.root.add(fractal);
      this.vfxLayers.particles.push(fractal);
    }
  }
  
  /**
   * Update fractal fog VFX
   */
  updateFractalFogVFX(intensity, phase, deltaTime) {
    this.vfxLayers.overlays.forEach(overlay => {
      if (overlay.userData.type === 'atmospheric_wash') {
        const phaseScale = phase === 'attack' ? 0.9 : phase === 'crest' ? 1 : 0.8;
        this._applyWeatherOpacity(overlay, THREE.MathUtils.clamp(overlay.userData.baseOpacity * intensity * 0.2 * phaseScale, 0, overlay.userData.baseOpacity));
      }
    });

    this.vfxLayers.particles.forEach(particle => {
      if (particle.userData.type === 'fractal_particle') {
        particle.position.addScaledVector(particle.userData.drift, deltaTime);
        particle.rotation.x += particle.userData.rotationSpeed * deltaTime * 0.36;
        particle.rotation.y += particle.userData.rotationSpeed * deltaTime * 0.28;
        this._applyWeatherOpacity(particle, THREE.MathUtils.clamp(0.32 * intensity, 0, particle.userData.baseOpacity));
        particle.position.y += deltaTime * 0.2;
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
    
    // Calculate wind based on average local synergy
    let synergy = 0;
    let count = 0;
    if (linkingSystem && linkingSystem.links) {
      linkingSystem.links.forEach(link => {
        if (link.glowData && typeof link.glowData.synergy === 'number') {
          synergy += link.glowData.synergy;
          count += 1;
        }
      });
    }
    const averageSynergy = count > 0 ? synergy / count : 0;
    const synergyWeight = THREE.MathUtils.clamp(averageSynergy, 0, 1);
    
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
    const windSpeed = (Math.sin(windAngle) * 0.5 + 0.5) * (0.3 + synergyWeight * 0.7);
    this.registry.windVector.x = Math.cos(windAngle) * windSpeed * this.registry.windStrength;
    this.registry.windVector.z = Math.sin(windAngle) * windSpeed * this.registry.windStrength;
    this.registry.windVector.y = Math.sin(this.windPhase * 0.3) * 0.2 * this.registry.windStrength * (0.6 + synergyWeight * 0.4);
  }
  
  /**
   * End current weather
   */
  endWeather() {
    if (this.registry.active) {
      this.registry.lastWeatherType = this.registry.active;
    }
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
    
    // Remove all ribbons
    this.vfxLayers.ribbons.forEach(ribbon => {
      this.root.remove(ribbon);
      this._releaseMeshResources(ribbon);
    });
    this.vfxLayers.ribbons = [];

    // Remove all beams
    this.vfxLayers.beams.forEach(beam => {
      this.root.remove(beam);
      this._releaseMeshResources(beam);
    });
    this.vfxLayers.beams = [];
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
    const signature = this.weatherSignatures[this.registry.active] || {};
    return {
      title: signature.title || moodDef.description,
      subtitle: moodDef.subtitle,
      visualTone: moodDef.visualTone,
      paletteKey: moodDef.paletteKey,
      core: signature.core,
      overlay: signature.overlay,
      atmosphere: signature.atmosphere,
      motion: signature.motion,
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
      lastWeatherType: null,
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
      this.registry.lastWeatherType = null;
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
