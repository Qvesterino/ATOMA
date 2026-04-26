import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { normalizeEnvironmentGeometry } from './RoundedEnvironmentGeometry.js';

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

const WORLD_PALETTE_BIAS = {
  quantum: {
    key: 'quantum',
    titleBias: 'Quantum Veil',
    signatureBias: 'probability silk, cyan-violet refraction',
    colors: {
      core: 0x8f96ff,
      haze: 0x52ffe3,
      band: 0xd06dff,
      void: 0x040816
    },
    mix: {
      core: 0.42,
      haze: 0.34,
      band: 0.48,
      void: 0.2
    }
  },
  memory: {
    key: 'memory',
    titleBias: 'Memory Cathedral',
    signatureBias: 'teal-gold recall mist, archival afterglow',
    colors: {
      core: 0x72d7ff,
      haze: 0x9cf0ff,
      band: 0xffd37a,
      void: 0x08111d
    },
    mix: {
      core: 0.26,
      haze: 0.38,
      band: 0.44,
      void: 0.22
    }
  },
  sigma: {
    key: 'sigma',
    titleBias: 'Sigma Rift',
    signatureBias: 'acid-cyan fracture, anomaly magenta scar',
    colors: {
      core: 0x7dffb3,
      haze: 0x2ef0ff,
      band: 0xff5de4,
      void: 0x03050e
    },
    mix: {
      core: 0.36,
      haze: 0.32,
      band: 0.5,
      void: 0.26
    }
  },
  desert: {
    key: 'desert',
    titleBias: 'Dream Dune',
    signatureBias: 'amber haze, ritual cyan mirage edge',
    colors: {
      core: 0x7ef3ff,
      haze: 0xffc98c,
      band: 0xff8fb8,
      void: 0x100913
    },
    mix: {
      core: 0.24,
      haze: 0.46,
      band: 0.3,
      void: 0.18
    }
  },
  desert2: {
    key: 'desert2',
    titleBias: 'Mirage Veil',
    signatureBias: 'rose-gold mist, lucid ascension glow',
    colors: {
      core: 0x9ff8ff,
      haze: 0xffd8b0,
      band: 0xff9de1,
      void: 0x120918
    },
    mix: {
      core: 0.24,
      haze: 0.44,
      band: 0.42,
      void: 0.2
    }
  },
  fractal: {
    key: 'fractal',
    titleBias: 'Fractal Valley',
    signatureBias: 'recursive jade haze, crystalline violet seams',
    colors: {
      core: 0x8effd6,
      haze: 0x5fd8ff,
      band: 0xb883ff,
      void: 0x071019
    },
    mix: {
      core: 0.32,
      haze: 0.28,
      band: 0.36,
      void: 0.18
    }
  }
};

const WEATHER_BACKGROUND_ORDER = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_BACKGROUND);
const WEATHER_RENDER_ORDER = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_OVERLAY);

export class SafeAIWeatherPack {
  constructor(scene, worldRoot, environmentRoot, camera, sharedAssets = null) {
    this.scene = scene;
    this.worldRoot = worldRoot || scene;
    this.environmentRoot = environmentRoot || this.worldRoot;
    this.camera = camera;
    this.sharedAssets = sharedAssets ?? null;
    this.root = new THREE.Group();
    this.root.renderOrder = WEATHER_BACKGROUND_ORDER;
    this.root.userData = {
      isAIWeatherRoot: true,
      __environmentLayerId: 'SafeAIWeatherPack',
      __environmentOwner: 'SafeAIWeatherPack',
      isWorldFX: true
    };
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
    this.worldContext = null;
    this.worldMacroState = 'DORMANT';
    this.worldMoodBias = null;
    
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
      beams: [],
      veils: [],
      seams: [],
      crowns: [],
      shards: []
    };
    
    this.windPhase = 0;
    this.recentWeatherHistory = [];
    this.worldProfile = this._resolveWorldProfile();
    this.semanticBus = this._resolveSemanticBus();
    this._semanticSubscriptions = [];
    this._residueCoupling = {
      potentialBoost: 0,
      intensityBoost: 0,
      windBoost: 0,
      ttl: 0,
      maxTtl: 0,
      moodHint: null
    };

    // Dramaturgy modulation state — driven by EventDramaturgyEngine
    this._dramaturgyModulation = {
      active: false,
      family: null,       // cascade | corruption | resonance | ritual | hazard
      phase: null,        // telegraph | escalation | payoff
      intensity: 0,       // 0-1
      ttl: 0              // auto-decay when dramaturgy stops pushing
    };

    this._setupResidueCoupling();
  }

  _getSharedMaterial(key, factory) {
    if (this.sharedAssets?.getSharedMaterial) {
      return this.sharedAssets.getSharedMaterial(`SafeAIWeatherPack:${key}`, factory);
    }
    return factory();
  }

  _getSharedGeometry(key, factory) {
    const resolveGeometry = () => normalizeEnvironmentGeometry(factory());
    if (this.sharedAssets?.getSharedGeometry) {
      return this.sharedAssets.getSharedGeometry(`SafeAIWeatherPack:${key}`, resolveGeometry);
    }
    return resolveGeometry();
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

  _createMoodSilhouetteShape(type, width, height) {
    const safeWidth = Math.max(1, Math.abs(width));
    const safeHeight = Math.max(1, Math.abs(height));
    const halfWidth = safeWidth * 0.5;
    const halfHeight = safeHeight * 0.5;
    const x = (ratio) => halfWidth * ratio;
    const y = (ratio) => halfHeight * ratio;
    const shape = new THREE.Shape();

    switch (type) {
      case 'pressure':
        shape.moveTo(x(-0.94), y(-0.08));
        shape.quadraticCurveTo(x(-1.0), y(0.24), x(-0.72), y(0.46));
        shape.quadraticCurveTo(x(-0.46), y(0.7), x(-0.16), y(0.58));
        shape.quadraticCurveTo(x(0.02), y(0.48), x(0.18), y(0.6));
        shape.quadraticCurveTo(x(0.42), y(0.76), x(0.7), y(0.44));
        shape.quadraticCurveTo(x(0.96), y(0.16), x(0.86), y(-0.14));
        shape.quadraticCurveTo(x(0.74), y(-0.48), x(0.38), y(-0.62));
        shape.quadraticCurveTo(x(0.12), y(-0.76), x(-0.16), y(-0.62));
        shape.quadraticCurveTo(x(-0.44), y(-0.78), x(-0.72), y(-0.52));
        shape.quadraticCurveTo(x(-0.96), y(-0.3), x(-0.94), y(-0.08));
        break;
      case 'resonance':
        shape.moveTo(x(-0.94), y(-0.02));
        shape.quadraticCurveTo(x(-0.72), y(0.42), x(-0.42), y(0.5));
        shape.quadraticCurveTo(x(-0.2), y(0.64), x(-0.02), y(0.4));
        shape.quadraticCurveTo(x(0.14), y(0.58), x(0.36), y(0.52));
        shape.quadraticCurveTo(x(0.7), y(0.44), x(0.92), y(0.02));
        shape.quadraticCurveTo(x(0.74), y(-0.34), x(0.44), y(-0.48));
        shape.quadraticCurveTo(x(0.18), y(-0.58), x(0.0), y(-0.38));
        shape.quadraticCurveTo(x(-0.2), y(-0.58), x(-0.44), y(-0.5));
        shape.quadraticCurveTo(x(-0.74), y(-0.36), x(-0.94), y(-0.02));
        break;
      case 'stormBias':
        shape.moveTo(x(-0.94), y(-0.04));
        shape.quadraticCurveTo(x(-0.76), y(0.36), x(-0.5), y(0.56));
        shape.quadraticCurveTo(x(-0.24), y(0.78), x(0.02), y(0.5));
        shape.quadraticCurveTo(x(0.18), y(0.68), x(0.52), y(0.34));
        shape.quadraticCurveTo(x(0.82), y(0.2), x(0.9), y(-0.12));
        shape.quadraticCurveTo(x(0.78), y(-0.5), x(0.48), y(-0.66));
        shape.quadraticCurveTo(x(0.2), y(-0.78), x(-0.04), y(-0.54));
        shape.quadraticCurveTo(x(-0.3), y(-0.7), x(-0.58), y(-0.5));
        shape.quadraticCurveTo(x(-0.84), y(-0.28), x(-0.94), y(-0.04));
        break;
      default:
        shape.absarc(0, 0, Math.min(halfWidth, halfHeight), 0, Math.PI * 2, false);
        break;
    }

    return shape;
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

  _mixHexColor(baseHex, biasHex, amount = 0) {
    const base = new THREE.Color(baseHex);
    const bias = new THREE.Color(biasHex);
    return base.lerp(bias, THREE.MathUtils.clamp(amount, 0, 1)).getHex();
  }

  _resolveWorldModeKey() {
    const rootMode = this.environmentRoot?.userData?.currentMode
      || this.worldRoot?.userData?.currentMode
      || this.scene?.userData?.currentMode
      || null;

    if (!rootMode || typeof rootMode !== 'string') return 'default';

    const normalized = rootMode.toLowerCase();
    if (normalized === 'sigma') return 'sigma';
    if (normalized === 'memory') return 'memory';
    if (normalized === 'quantum') return 'quantum';
    if (normalized === 'desert') return 'desert';
    if (normalized === 'desert2' || normalized === 'chamber') return 'desert2';
    if (normalized === 'fractal') return 'fractal';
    return 'default';
  }

  _resolveWorldProfile() {
    const modeKey = this._resolveWorldModeKey();
    const bias = WORLD_PALETTE_BIAS[modeKey] || null;
    return {
      modeKey,
      bias,
      titleBias: bias?.titleBias ?? null,
      signatureBias: bias?.signatureBias ?? null
    };
  }

  _resolveSemanticBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }
    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _setupResidueCoupling() {
    const bus = this.semanticBus;
    if (!bus) return;

    const handler = (payload = {}) => {
      this._applyResidueCoupling(payload);
    };

    if (typeof bus.on === 'function') {
      bus.on('environment.hazard.residueScar', handler);
      this._semanticSubscriptions.push({
        eventName: 'environment.hazard.residueScar',
        handler,
        method: 'off'
      });
      return;
    }

    if (typeof bus.subscribe === 'function') {
      bus.subscribe('environment.hazard.residueScar', handler);
      this._semanticSubscriptions.push({
        eventName: 'environment.hazard.residueScar',
        handler,
        method: 'unsubscribe'
      });
    }
  }

  _ensureResidueCouplingSubscription() {
    if (this._semanticSubscriptions.length > 0) return;
    if (!this.semanticBus) {
      this.semanticBus = this._resolveSemanticBus();
    }
    if (!this.semanticBus) return;
    this._setupResidueCoupling();
  }

  _detachResidueCoupling() {
    const bus = this.semanticBus;
    if (!bus || !this._semanticSubscriptions.length) return;

    for (const subscription of this._semanticSubscriptions) {
      if (subscription.method === 'off' && typeof bus.off === 'function') {
        bus.off(subscription.eventName, subscription.handler);
      } else if (subscription.method === 'unsubscribe' && typeof bus.unsubscribe === 'function') {
        bus.unsubscribe(subscription.eventName, subscription.handler);
      }
    }

    this._semanticSubscriptions = [];
  }

  _resolveCurrentWorldModeRaw() {
    const rootMode = this.environmentRoot?.userData?.currentMode
      || this.worldRoot?.userData?.currentMode
      || this.scene?.userData?.currentMode
      || this.worldProfile?.modeKey
      || 'default';
    return typeof rootMode === 'string' ? rootMode.toLowerCase() : 'default';
  }

  _matchesResidueWorld(payload = {}) {
    const localRaw = this._resolveCurrentWorldModeRaw();
    const payloadRaw = typeof payload.worldModeRaw === 'string' ? payload.worldModeRaw.toLowerCase() : null;
    if (payloadRaw) {
      return payloadRaw === localRaw;
    }

    const payloadMode = typeof payload.worldModeKey === 'string' ? payload.worldModeKey.toLowerCase() : null;
    if (!payloadMode) return true;
    if (payloadMode === localRaw) return true;
    if (payloadMode === 'default' && localRaw !== 'sigma' && localRaw !== 'memory') return true;
    return false;
  }

  _pickResidueMoodHint(hazardType) {
    if (hazardType === 'electricalStorm') return 'stormBias';
    if (hazardType === 'gravitationalAnomaly') return 'pressure';
    if (hazardType === 'chronoBloom') return 'resonance';
    return null;
  }

  _applyResidueCoupling(payload = {}) {
    if (!this._matchesResidueWorld(payload)) return;

    this.worldProfile = this._resolveWorldProfile();
    const coupling = payload.coupling || {};
    const intensity = Number.isFinite(payload.intensity) ? payload.intensity : 1;
    const radius = Number.isFinite(payload.radius) ? payload.radius : 12;

    const potentialBoost = THREE.MathUtils.clamp(
      Number.isFinite(coupling.weatherPotential) ? coupling.weatherPotential : (0.08 + intensity * 0.12 + radius * 0.002),
      0.05,
      0.5
    );
    const intensityBoost = THREE.MathUtils.clamp(
      Number.isFinite(coupling.weatherIntensity) ? coupling.weatherIntensity : (0.12 + intensity * 0.16),
      0.08,
      0.55
    );
    const windBoost = THREE.MathUtils.clamp(
      Number.isFinite(coupling.windBoost) ? coupling.windBoost : (0.08 + intensity * 0.12),
      0.06,
      0.48
    );
    const duration = THREE.MathUtils.clamp(
      Number.isFinite(coupling.duration) ? coupling.duration : (2.4 + radius * 0.08),
      1.6,
      8.5
    );

    this._residueCoupling.potentialBoost = Math.max(this._residueCoupling.potentialBoost, potentialBoost);
    this._residueCoupling.intensityBoost = Math.max(this._residueCoupling.intensityBoost, intensityBoost);
    this._residueCoupling.windBoost = Math.max(this._residueCoupling.windBoost, windBoost);
    this._residueCoupling.ttl = Math.max(this._residueCoupling.ttl, duration);
    this._residueCoupling.maxTtl = Math.max(this._residueCoupling.maxTtl, duration);
    this._residueCoupling.moodHint = this._pickResidueMoodHint(payload.hazardType) || this._residueCoupling.moodHint;

    this.lastWeatherCheck = Math.min(
      this.lastWeatherCheck,
      performance.now() - this.config.weatherCheckInterval * 1000
    );
  }

  _getResidueCouplingWeight() {
    if (this._residueCoupling.ttl <= 0 || this._residueCoupling.maxTtl <= 0) return 0;
    return THREE.MathUtils.clamp(this._residueCoupling.ttl / this._residueCoupling.maxTtl, 0, 1);
  }

  _updateResidueCoupling(deltaTime) {
    if (this._residueCoupling.ttl <= 0) return;

    this._residueCoupling.ttl = Math.max(0, this._residueCoupling.ttl - Math.max(0, deltaTime || 0));
    if (this._residueCoupling.ttl > 0) return;

    this._residueCoupling.potentialBoost = 0;
    this._residueCoupling.intensityBoost = 0;
    this._residueCoupling.windBoost = 0;
    this._residueCoupling.maxTtl = 0;
    this._residueCoupling.moodHint = null;
  }

  // ---------------------------------------------------------------------------
  // Dramaturgy Modulation — Weather Awakening
  // ---------------------------------------------------------------------------

  /**
   * Receive dramaturgy state from EventDramaturgyEngine.
   * Maps event families → weather mood states, phases → weather behavior.
   *
   * Family → Mood:
   *   corruption  → stormBias      (charged storm envelope)
   *   ritual      → ascensionHaze  (luminous ascension haze)
   *   resonance   → resonance      (harmonic ribbon resonance)
   *   hazard      → pressure       (compressed aurora tension)
   *   cascade     → stormBias      (charged storm envelope)
   *
   * Phase → Behavior:
   *   telegraph   → fog thickens, sky darkens, weather starts shifting
   *   escalation  → weather peaks (storm, aurora, quantum rain)
   *   payoff      → weather clears, calm transition
   */
  setDramaturgyModulation(state) {
    if (!state || !state.dominantFamily) {
      // Dramaturgy ended — let TTL decay handle graceful fade
      return;
    }

    this._dramaturgyModulation.active = true;
    this._dramaturgyModulation.family = state.dominantFamily;
    this._dramaturgyModulation.phase = state.dominantPhase || 'telegraph';
    this._dramaturgyModulation.intensity = state.dominantIntensity || 0;
    this._dramaturgyModulation.ttl = 2.0; // Refresh TTL — 2s grace after dramaturgy stops
  }

  /**
   * Map dramaturgy family → weather mood state.
   */
  _getDramaturgyMoodOverride() {
    const mod = this._dramaturgyModulation;
    if (!mod.active || mod.ttl <= 0) return null;

    const FAMILY_TO_MOOD = {
      corruption: 'stormBias',
      ritual: 'ascensionHaze',
      resonance: 'resonance',
      hazard: 'pressure',
      cascade: 'stormBias'
    };

    return FAMILY_TO_MOOD[mod.family] || null;
  }

  /**
   * Get potential multiplier from dramaturgy phase.
   * Telegraph: moderate boost to start shifting weather
   * Escalation: maximum boost for peak weather
   * Payoff: gentle — let weather naturally wind down
   */
  _getDramaturgyPotentialMultiplier() {
    const mod = this._dramaturgyModulation;
    if (!mod.active || mod.ttl <= 0) return 1.0;

    switch (mod.phase) {
      case 'telegraph':  return 0.7;
      case 'escalation': return 1.0;
      case 'payoff':     return 0.3;
      default:           return 1.0;
    }
  }

  /**
   * Get intensity multiplier from dramaturgy phase.
   * Telegraph: subdued — fog thickens, sky darkens
   * Escalation: boosted — weather at full power
   * Payoff: reduced — weather clears
   */
  _getDramaturgyIntensityMultiplier() {
    const mod = this._dramaturgyModulation;
    if (!mod.active || mod.ttl <= 0) return 1.0;

    switch (mod.phase) {
      case 'telegraph':  return 0.6;
      case 'escalation': return 1.35;
      case 'payoff':     return 0.4;
      default:           return 1.0;
    }
  }

  /**
   * Should dramaturgy bypass the normal weather trigger gates?
   * Active during telegraph and escalation phases.
   */
  _isDramaturgyOverrideActive() {
    const mod = this._dramaturgyModulation;
    return mod.active && mod.ttl > 0 && mod.phase !== 'payoff';
  }

  /**
   * Decay dramaturgy modulation TTL when no longer receiving updates.
   */
  _decayDramaturgyModulation(deltaTime) {
    const mod = this._dramaturgyModulation;
    if (!mod.active) return;

    mod.ttl -= deltaTime;
    if (mod.ttl <= 0) {
      mod.active = false;
      mod.family = null;
      mod.phase = null;
      mod.intensity = 0;
      mod.ttl = 0;
    }
  }

  _resolveWeatherPalette(moodState) {
    const basePalette = ATMOSPHERE_PALETTE[moodState] || ATMOSPHERE_PALETTE.calm;
    const profile = this.worldProfile || this._resolveWorldProfile();
    const bias = profile?.bias;
    if (!bias) return { ...basePalette };

    return {
      core: this._mixHexColor(basePalette.core, bias.colors.core, bias.mix.core),
      haze: this._mixHexColor(basePalette.haze, bias.colors.haze, bias.mix.haze),
      band: this._mixHexColor(basePalette.band, bias.colors.band, bias.mix.band),
      void: this._mixHexColor(basePalette.void, bias.colors.void, bias.mix.void)
    };
  }

  _resolveWeatherSignature(moodState) {
    const signature = this.weatherSignatures[moodState] || this.weatherSignatures.calm;
    const profile = this.worldProfile || this._resolveWorldProfile();
    if (!profile?.bias) return signature;

    return {
      ...signature,
      title: `${profile.titleBias} | ${signature.title}`,
      signature: `${signature.signature}; ${profile.signatureBias}`
    };
  }

  _tagWeatherObject(object, type, signature, baseOpacity, baseScale = 1, bucket = null) {
    if (!object) return object;
    object.renderOrder = WEATHER_RENDER_ORDER;
    object.userData = {
      ...(object.userData || {}),
      isAIWeatherVFX: true,
      isWorldFX: true,
      __environmentLayerId: 'SafeAIWeatherPack',
      __environmentOwner: 'SafeAIWeatherPack',
      type,
      signature,
      baseOpacity,
      targetOpacity: baseOpacity,
      baseScale
    };
    if (bucket && Array.isArray(this.vfxLayers[bucket])) {
      this.vfxLayers[bucket].push(object);
    }
    this.root.add(object);
    return object;
  }

  _createWeatherMaterial(color, opacity, options = {}) {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: true,
      fog: false,
      side: options.side ?? THREE.DoubleSide,
      blending: options.blending ?? THREE.AdditiveBlending
    });
  }

  /**
   * Create organic plane geometry with displaced edges to avoid flat square silhouettes.
   * Replaces raw PlaneGeometry for atmospheric VFX layers.
   */
  _createOrganicPlane(width, height, wSegs = 8, hSegs = 4, edgeAmplitude = 0.06, waveFreq = 3.0) {
    const geo = new THREE.PlaneGeometry(width, height, wSegs, hSegs);
    const pos = geo.attributes.position;
    const halfW = width * 0.5;
    const halfH = height * 0.5;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const edgeDistX = Math.abs(Math.abs(x) - halfW) / Math.max(0.001, halfW);
      const edgeDistY = Math.abs(Math.abs(y) - halfH) / Math.max(0.001, halfH);
      const edgeFactor = 1.0 - Math.min(edgeDistX, edgeDistY);
      // Displace Z (depth) on edge vertices to break rectangular silhouette
      const wave = Math.sin(x * waveFreq * 0.1 + y * waveFreq * 0.07) * edgeAmplitude;
      const edgeWave = Math.sin(x * waveFreq * 0.15 + y * 0.3) * edgeAmplitude * 0.5;
      pos.setZ(i, pos.getZ(i) + (wave * edgeFactor + edgeWave * edgeFactor * edgeFactor));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return normalizeEnvironmentGeometry(geo);
  }

  _createVeilCurtains(color, count, options = {}) {
    const veils = [];
    const width = options.width ?? 180;
    const height = options.height ?? 54;
    const depth = options.depth ?? -92;
    const y = options.y ?? 26;
    const signature = options.signature ?? 'weather_veil';
    const bucket = options.bucket ?? 'veils';

    for (let i = 0; i < count; i++) {
      const geometry = this._getSharedGeometry(`weather.veil.${signature}.${i}`, () => this._createOrganicPlane(width, height, 10, 6, 0.08, 3.5));
      const material = this._createWeatherMaterial(color, 0);
      const veil = new THREE.Mesh(geometry, material);
      veil.position.set(
        (i - (count - 1) * 0.5) * (options.spacing ?? 18),
        y + i * (options.verticalStep ?? 6),
        depth - i * (options.depthStep ?? 4)
      );
      veil.rotation.set(
        -(options.pitch ?? Math.PI / 2.55),
        (i - (count - 1) * 0.5) * 0.05,
        (Math.random() - 0.5) * (options.rollVariance ?? 0.18)
      );
      const baseOpacity = options.baseOpacity ?? (0.06 + i * 0.02);
      veil.userData = {
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: (options.speed ?? 0.12) + i * 0.03,
        tension: 0.5 + Math.random() * 0.6,
        depthBias: i / Math.max(1, count - 1),
        baseX: veil.position.x,
        baseY: veil.position.y
      };
      this._tagWeatherObject(veil, options.type ?? 'veil_curtain', signature, baseOpacity, 1, bucket);
      veils.push(veil);
    }

    return veils;
  }

  _createShardHalo(color, count, options = {}) {
    const shards = [];
    const radius = options.radius ?? 58;
    const y = options.y ?? 30;
    const depth = options.depth ?? -86;
    const signature = options.signature ?? 'weather_shards';
    const bucket = options.bucket ?? 'shards';

    for (let i = 0; i < count; i++) {
      const geometry = this._getSharedGeometry(`weather.shard.${signature}`, () => new THREE.OctahedronGeometry(options.size ?? 0.9, 0));
      const material = this._createWeatherMaterial(color, 0, { side: THREE.DoubleSide });
      const shard = new THREE.Mesh(geometry, material);
      const angle = (i / Math.max(1, count)) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const localRadius = radius * (0.8 + Math.random() * 0.45);
      shard.position.set(
        Math.cos(angle) * localRadius,
        y + (Math.random() - 0.5) * (options.heightJitter ?? 10),
        depth + Math.sin(angle) * localRadius * 0.28
      );
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const baseOpacity = options.baseOpacity ?? (0.14 + Math.random() * 0.08);
      shard.userData = {
        orbitAngle: angle,
        orbitRadius: localRadius,
        orbitSpeed: (options.speed ?? 0.24) * (0.6 + Math.random() * 0.8),
        liftSpeed: 0.08 + Math.random() * 0.12,
        baseY: shard.position.y
      };
      this._tagWeatherObject(shard, options.type ?? 'shard_halo', signature, baseOpacity, 1, bucket);
      shards.push(shard);
    }

    return shards;
  }

  _createSeamLattice(color, count, options = {}) {
    const seams = [];
    const signature = options.signature ?? 'weather_seams';
    const bucket = options.bucket ?? 'seams';

    for (let i = 0; i < count; i++) {
      const length = (options.length ?? 64) * (0.82 + Math.random() * 0.45);
      const geometry = this._getSharedGeometry(`weather.seam.${signature}.${i}`, () => this._createOrganicPlane(length, options.thickness ?? 1.8, 14, 2, 0.12, 5.0));
      const material = this._createWeatherMaterial(color, 0);
      const seam = new THREE.Mesh(geometry, material);
      seam.position.set(
        (Math.random() - 0.5) * (options.spreadX ?? 140),
        (options.y ?? 26) + (Math.random() - 0.5) * (options.spreadY ?? 18),
        (options.depth ?? -88) + (Math.random() - 0.5) * (options.spreadZ ?? 18)
      );
      seam.rotation.set(
        -(options.pitch ?? Math.PI / 2.9),
        (Math.random() - 0.5) * (options.yawVariance ?? 0.7),
        (Math.random() - 0.5) * (options.rollVariance ?? 1.0)
      );
      const baseOpacity = options.baseOpacity ?? (0.08 + Math.random() * 0.06);
      seam.userData = {
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.4 + Math.random() * 0.45,
        stretchBias: 0.85 + Math.random() * 0.45,
        baseX: seam.position.x,
        baseY: seam.position.y
      };
      this._tagWeatherObject(seam, options.type ?? 'omen_seam', signature, baseOpacity, 1, bucket);
      seams.push(seam);
    }

    return seams;
  }

  _createHaloCrown(color, options = {}) {
    const geometry = this._getSharedGeometry(`weather.crown.${options.signature ?? 'default'}`, () => new THREE.TorusGeometry(options.radius ?? 72, options.thickness ?? 1.4, 8, 72, Math.PI * (options.arc ?? 1.35)));
    const material = this._createWeatherMaterial(color, 0);
    const crown = new THREE.Mesh(geometry, material);
    crown.position.set(0, options.y ?? 36, options.depth ?? -90);
    crown.rotation.set(-(options.pitch ?? Math.PI / 2.5), 0, options.roll ?? 0.22);
    crown.userData = {
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: options.speed ?? 0.55
    };
    return this._tagWeatherObject(
      crown,
      options.type ?? 'halo_crown',
      options.signature ?? 'weather_crown',
      options.baseOpacity ?? 0.12,
      1,
      options.bucket ?? 'crowns'
    );
  }

  _getWeatherPhaseMix(phase) {
    return {
      attack: phase === 'attack' ? 1 : 0,
      crest: phase === 'crest' ? 1 : 0,
      release: phase === 'release' ? 1 : 0
    };
  }

  _createAtmosphericWash(color, opacity, depth) {
    const size = 320;
    const geo = this._getSharedGeometry(`atmosphere.wash.${color}.${depth}`, () => new THREE.CircleGeometry(size * 0.5, 48));
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
    return this._tagWeatherObject(mesh, 'atmospheric_wash', 'weather_wash', opacity, 1, 'overlays');
  }

  _createAmbientHazeSheets(color, count, baseDepth) {
    const sheets = [];
    for (let i = 0; i < count; i++) {
      const width = 260 - i * 20;
      const height = 110;
      const geo = this._getSharedGeometry(`haze.sheet.${color}.${i}`, () => this._createOrganicPlane(width, height, 8, 5, 0.07, 2.8));
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
        layer: i,
        speed: 0.015 + i * 0.008,
        driftPhase: Math.random() * Math.PI * 2
      };
      this._tagWeatherObject(sheet, 'ambient_haze', 'weather_haze', 0.12, 1, 'overlays');
      sheets.push(sheet);
    }
    return sheets;
  }

  _createPulseClouds(color, count, depth) {
    const clouds = [];
    for (let i = 0; i < count; i++) {
      const size = 22 + Math.random() * 16;
      const geo = this._getSharedGeometry(`pulseCloud.${color}.${i}`, () => new THREE.CircleGeometry(size * 0.5, 32));
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
        speed: 0.008 + Math.random() * 0.012,
        driftPhase: Math.random() * Math.PI * 2
      };
      this._tagWeatherObject(cloud, 'pulse_cloud', 'weather_cloud', baseOpacity, 1, 'overlays');
      clouds.push(cloud);
    }
    return clouds;
  }

  _createAuroraRibbons(color, count) {
    const ribbons = [];
    for (let i = 0; i < count; i++) {
      const geo = this._getSharedGeometry(`aurora.ribbon.${color}.${i}`, () => this._createOrganicPlane(260, 14, 20, 3, 0.1, 4.2));
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
        index: i,
        speed: 0.018 + i * 0.008,
        driftPhase: Math.random() * Math.PI * 2
      };
      this._tagWeatherObject(ribbon, 'aurora_ribbon', 'weather_ribbon', baseOpacity, 1, 'ribbons');
      ribbons.push(ribbon);
    }
    return ribbons;
  }

  _createPressureBands(color, count) {
    const bands = [];
    for (let i = 0; i < count; i++) {
      const geo = this._getSharedGeometry(`pressure.band.${color}.${i}`, () => this._createOrganicPlane(320, 10, 18, 2, 0.09, 3.8));
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
        index: i,
        speed: 0.02 + i * 0.005,
        driftPhase: Math.random() * Math.PI * 2
      };
      this._tagWeatherObject(band, 'pressure_band', 'weather_band', baseOpacity, 1, 'beams');
      bands.push(band);
    }
    return bands;
  }

  _createMoodSilhouette(type, palette, depth, weatherDef) {
    let geo;
    let position = new THREE.Vector3(0, 18, depth);
    let rotation = new THREE.Euler(-Math.PI / 2, 0, 0);
    let size = 1.0;
    let silhouetteWidth = 0;
    let silhouetteHeight = 0;
    switch(type) {
      case 'calm':
        geo = this._getSharedGeometry(`silhouette.calm`, () => new THREE.CircleGeometry(58, 34));
        position.set(0, 24, depth);
        break;
      case 'pressure':
        silhouetteWidth = 240;
        silhouetteHeight = 22;
        geo = this._getSharedGeometry(`silhouette.pressure`, () => new THREE.ShapeGeometry(this._createMoodSilhouetteShape('pressure', silhouetteWidth, silhouetteHeight), 10));
        position.set(0, 18, depth);
        rotation.z = -0.08;
        break;
      case 'resonance':
        silhouetteWidth = 280;
        silhouetteHeight = 16;
        geo = this._getSharedGeometry(`silhouette.resonance`, () => new THREE.ShapeGeometry(this._createMoodSilhouetteShape('resonance', silhouetteWidth, silhouetteHeight), 10));
        position.set(0, 24, depth);
        rotation.z = 0.06;
        break;
      case 'stormBias':
        silhouetteWidth = 220;
        silhouetteHeight = 24;
        geo = this._getSharedGeometry(`silhouette.stormBias`, () => new THREE.ShapeGeometry(this._createMoodSilhouetteShape('stormBias', silhouetteWidth, silhouetteHeight), 10));
        position.set(0, 20, depth);
        rotation.z = 0.12;
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
      layerPriority: this.weatherSignatures[type]?.layerPriority || 'far'
    };
    return this._tagWeatherObject(mesh, `${type}_silhouette`, `weather_silhouette_${type}`, mat.opacity, size, 'overlays');
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
    this._ensureResidueCouplingSubscription();
    this.animationTime += deltaTime;
    this.windPhase += deltaTime;
    this._updateResidueCoupling(deltaTime);
    this._decayDramaturgyModulation(deltaTime);
    
    // Phase B pilot: throttle interpretation/decisions to keep mood at ~4 Hz while visuals/motion stay 60 Hz
    this.interpretationAccumulator += deltaTime;
    const shouldRunInterpretation = this.interpretationAccumulator >= this.config.interpretationInterval;
    
    if (shouldRunInterpretation) {
      this.interpretationAccumulator = 0;
      // Check for new weather triggers periodically (interpretation layer)
      this.checkWeatherTriggers(legendaryPack, linkingSystem, evolutionManager, worldEvents, worldMoodBias || this.worldMoodBias);
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
    
    // Check cooldown (residue coupling can temporarily relax it)
    const residueWeight = this._getResidueCouplingWeight();
    const cooldownMul = THREE.MathUtils.lerp(1, 0.35, residueWeight);
    if (now - this.lastWeatherTime < this.config.weatherCooldown * 1000 * cooldownMul) {
      return;
    }
    
    // Skip if world event is active (weather yields to events)
    // EXCEPTION: dramaturgy override can bypass this gate
    if (worldEvents && worldEvents.isEventActive() && !this._isDramaturgyOverrideActive()) {
      return;
    }
    
    // Calculate weather potential
    const potential = this.calculateWeatherPotential(legendaryPack, linkingSystem, evolutionManager);
    
    // Dramaturgy override: force weather trigger with mapped mood
    if (this._isDramaturgyOverrideActive() && !this.registry.active) {
      const overrideMood = this._getDramaturgyMoodOverride();
      if (overrideMood && potential > 0.05) {
        this.startWeather(overrideMood, legendaryPack, linkingSystem);
        return;
      }
    }
    
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
    // Dramaturgy override: bypass synergy gate when events are active
    if (this._isDramaturgyOverrideActive()) {
      const dramPotential = this._getDramaturgyPotentialMultiplier() * 0.6;
      // Still add legendary and traffic bonuses
      let bonus = 0;
      if (legendaryPack) {
        bonus += Math.min(0.3, (legendaryPack.getActiveLegendaryCount?.() ?? 0) * 0.15);
      }
      const avgTraffic = links.length > 0 ? totalTraffic / links.length : 0;
      bonus += Math.min(0.2, avgTraffic * 0.2);
      return Math.min(1, dramPotential + bonus);
    }

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
    
    const residueWeight = this._getResidueCouplingWeight();
    if (residueWeight > 0) {
      potential += this._residueCoupling.potentialBoost * residueWeight;
    }

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

    const biasSource = worldMoodBias && typeof worldMoodBias === 'object' ? worldMoodBias : this.worldMoodBias;
    if (biasSource && typeof biasSource === 'object') {
      Object.entries(biasSource).forEach(([key, bias]) => {
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

    const residueWeight = this._getResidueCouplingWeight();
    if (residueWeight > 0 && this._residueCoupling.moodHint && weights[this._residueCoupling.moodHint] !== undefined) {
      weights[this._residueCoupling.moodHint] += 0.42 * residueWeight;
    }

    // Dramaturgy mood bias — heavily push toward the mapped mood state
    const dramMood = this._getDramaturgyMoodOverride();
    if (dramMood && weights[dramMood] !== undefined) {
      const dramBoost = this._getDramaturgyPotentialMultiplier();
      // Suppress all other moods, boost the dramaturgy mood
      for (const key of Object.keys(weights)) {
        if (key === dramMood) {
          weights[key] += 1.2 * dramBoost;
        } else {
          weights[key] *= (1 - 0.5 * dramBoost);
        }
      }
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
    this.worldProfile = this._resolveWorldProfile();
    
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

  setWorldContext(worldContext) {
    this.worldContext = worldContext ? {
      ...worldContext,
      macroProfile: worldContext.macroProfile ? { ...worldContext.macroProfile } : null,
      worldContext: worldContext.worldContext ? { ...worldContext.worldContext } : null
    } : null;
    this.worldMacroState = String(this.worldContext?.worldMacroState || this.worldContext?.macroState || 'DORMANT').toUpperCase();
    this.worldMoodBias = this._buildWorldMoodBias(this.worldContext);
  }

  _buildWorldMoodBias(worldContext) {
    const macroState = String(worldContext?.worldMacroState || worldContext?.macroState || 'DORMANT').toUpperCase();
    const macroProfile = worldContext?.macroProfile || null;
    const profileEnergy = THREE.MathUtils.clamp(((macroProfile?.masterScale ?? 0.68) - 0.68) / 0.5, 0, 1);

    const moodBias = {
      calm: 0.08,
      pressure: 0.08,
      resonance: 0.08,
      stormBias: 0.08,
      ascensionHaze: 0.08
    };

    const moodBindings = {
      DORMANT: {
        dominant: 'calm',
        bias: { calm: 0.94, pressure: 0.06, resonance: 0.05, stormBias: 0.02, ascensionHaze: 0.04 }
      },
      AWAKENING: {
        dominant: 'pressure',
        bias: { calm: 0.1, pressure: 0.96, resonance: 0.1, stormBias: 0.07, ascensionHaze: 0.05 }
      },
      COMMUNION: {
        dominant: 'resonance',
        bias: { calm: 0.08, pressure: 0.08, resonance: 1.0, stormBias: 0.05, ascensionHaze: 0.14 }
      },
      SCHISM: {
        dominant: 'stormBias',
        bias: { calm: 0.05, pressure: 0.14, resonance: 0.12, stormBias: 1.02, ascensionHaze: 0.08 }
      },
      REVELATION: {
        dominant: 'ascensionHaze',
        bias: { calm: 0.06, pressure: 0.08, resonance: 0.16, stormBias: 0.08, ascensionHaze: 1.04 }
      }
    };

    const binding = moodBindings[macroState] || moodBindings.DORMANT;
    moodBias.calm += binding.bias.calm || 0;
    moodBias.pressure += binding.bias.pressure || 0;
    moodBias.resonance += binding.bias.resonance || 0;
    moodBias.stormBias += binding.bias.stormBias || 0;
    moodBias.ascensionHaze += binding.bias.ascensionHaze || 0;

    const dominantMood = binding.dominant || 'calm';
    moodBias[dominantMood] += 0.12 + profileEnergy * 0.18;

    if (macroProfile) {
      moodBias.resonance += (macroProfile.particleScale ?? 0) * 0.03;
      moodBias.stormBias += (macroProfile.distortionScale ?? 0) * 0.03;
      moodBias.ascensionHaze += (macroProfile.cameraAuraScale ?? 0) * 0.04;
      moodBias.pressure += (macroProfile.fogScale ?? 0) * 0.02;
    }

    return moodBias;
  }
  
  /**
   * Create VFX for weather type
   */
  createWeatherVFX(moodState, moodDef) {
    // Clean previous weather
    this.cleanupAllWeatherVFX();
    const palette = this._resolveWeatherPalette(moodState);
    
    switch(moodState) {
      case 'calm':
        this.createCalmAtmosphereVFX(moodDef, palette);
        break;
      case 'pressure':
        this.createPressureFieldVFX(moodDef, palette);
        break;
      case 'resonance':
        this.createResonanceLayerVFX(moodDef, palette);
        break;
      case 'stormBias':
        this.createStormPulseVFX(moodDef, palette);
        break;
      case 'ascensionHaze':
        this.createAscensionHazeVFX(moodDef, palette);
        break;
      default:
        this.createCalmAtmosphereVFX(moodDef, palette);
        break;
    }
  }

  createCalmAtmosphereVFX(moodDef, palette) {
    this.createNeonRainVFX(moodDef, palette);
  }

  createPressureFieldVFX(moodDef, palette) {
    this.createSigmaTurbulenceVFX(moodDef, palette);
  }

  createResonanceLayerVFX(moodDef, palette) {
    this.createAuroraWindsVFX(moodDef, palette);
  }

  createStormPulseVFX(moodDef, palette) {
    this.createQuantumStormVFX(moodDef, palette);
  }

  createAscensionHazeVFX(moodDef, palette) {
    this.createFractalFogVFX(moodDef, palette);
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
    
    if (worldEvents?.isEventActive?.() && !this._isDramaturgyOverrideActive()) {
      intensity *= 0.65;
    }

    // Dramaturgy intensity modulation
    const dramIntensityMul = this._getDramaturgyIntensityMultiplier();
    if (dramIntensityMul !== 1.0) {
      intensity *= dramIntensityMul;
    }

    const residueWeight = this._getResidueCouplingWeight();
    if (residueWeight > 0) {
      intensity *= 1 + (this._residueCoupling.intensityBoost * residueWeight);
    }
    intensity = THREE.MathUtils.clamp(intensity, 0, 1);

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

    this._updateMysticWeatherLayers(intensity, phase, deltaTime);

    this._updateWeatherLOD();
  }

  _updateMysticWeatherLayers(intensity, phase, deltaTime) {
    const phaseMix = this._getWeatherPhaseMix(phase);
    const time = this.animationTime;

    this.vfxLayers.veils.forEach((veil, index) => {
      if (!veil?.material) return;
      const drift = Math.sin(time * (0.18 + (veil.userData.driftSpeed ?? 0.15)) + (veil.userData.driftPhase ?? 0)) * 0.35;
      const crestLift = 1 + phaseMix.crest * 0.08 + phaseMix.attack * 0.04 - phaseMix.release * 0.03;
      veil.scale.set(
        (veil.userData.baseScale ?? 1) * (1 + intensity * 0.12),
        (veil.userData.baseScale ?? 1) * crestLift,
        1
      );
      veil.position.x = (veil.userData.baseX ?? veil.position.x) + drift * (3 + intensity * 6);
      veil.position.y = (veil.userData.baseY ?? veil.position.y) + Math.sin(time * 0.42 + index) * (0.4 + intensity * 0.75);
      this._applyWeatherOpacity(
        veil,
        THREE.MathUtils.clamp((veil.userData.baseOpacity ?? 0.08) * (0.55 + intensity * 1.15 + phaseMix.crest * 0.2), 0, veil.userData.baseOpacity)
      );
    });

    this.vfxLayers.seams.forEach((seam) => {
      if (!seam?.material) return;
      const pulse = 0.72 + Math.sin(time * (seam.userData.pulseSpeed ?? 0.5) + (seam.userData.phase ?? 0)) * 0.28;
      seam.scale.x = (seam.userData.stretchBias ?? 1) * (0.94 + phaseMix.attack * 0.08 + phaseMix.crest * 0.16);
      seam.scale.y = 1 + phaseMix.release * 0.08;
      seam.rotation.z += deltaTime * 0.08 * (0.5 + intensity);
      this._applyWeatherOpacity(
        seam,
        THREE.MathUtils.clamp((seam.userData.baseOpacity ?? 0.08) * pulse * (0.55 + intensity * 1.2), 0, seam.userData.baseOpacity)
      );
    });

    this.vfxLayers.crowns.forEach((crown) => {
      if (!crown?.material) return;
      const pulse = 1 + Math.sin(time * (crown.userData.pulseSpeed ?? 0.5) + (crown.userData.pulsePhase ?? 0)) * (0.05 + intensity * 0.08);
      crown.scale.setScalar((crown.userData.baseScale ?? 1) * pulse * (1 + phaseMix.crest * 0.06));
      crown.rotation.z += deltaTime * 0.04;
      this._applyWeatherOpacity(
        crown,
        THREE.MathUtils.clamp((crown.userData.baseOpacity ?? 0.12) * (0.65 + intensity * 0.95), 0, crown.userData.baseOpacity)
      );
    });

    this.vfxLayers.shards.forEach((shard) => {
      if (!shard?.material) return;
      shard.userData.orbitAngle += deltaTime * (shard.userData.orbitSpeed ?? 0.2) * (0.6 + intensity);
      shard.position.x = Math.cos(shard.userData.orbitAngle) * (shard.userData.orbitRadius ?? 40);
      shard.position.z += Math.sin(shard.userData.orbitAngle * 1.3) * deltaTime * 0.9;
      shard.position.y = (shard.userData.baseY ?? shard.position.y) + Math.sin(time * (shard.userData.liftSpeed ?? 0.1) * 8) * 0.45;
      shard.rotation.x += deltaTime * 0.7;
      shard.rotation.y += deltaTime * 0.5;
      this._applyWeatherOpacity(
        shard,
        THREE.MathUtils.clamp((shard.userData.baseOpacity ?? 0.12) * (0.52 + intensity * 1.25 + phaseMix.crest * 0.16), 0, shard.userData.baseOpacity)
      );
    });
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
  createQuantumStormVFX(weatherDef, palette = ATMOSPHERE_PALETTE.stormBias) {
    this._createAtmosphericWash(palette.void, Math.min(0.28, weatherDef.maxIntensity * 0.3), -100);
    this._createMoodSilhouette('stormBias', palette, -90, weatherDef);
    this._createPulseClouds(palette.core, 2, -92);
    this._createPressureBands(palette.band, 1);
    this._createVeilCurtains(palette.haze, 2, {
      type: 'storm_veil',
      signature: 'storm_cathedral',
      width: 168,
      height: 64,
      depth: -94,
      y: 30,
      baseOpacity: 0.12,
      speed: 0.22
    });
    this._createSeamLattice(palette.core, 7, {
      type: 'storm_seam',
      signature: 'storm_cathedral',
      y: 28,
      depth: -86,
      baseOpacity: 0.12,
      length: 72,
      thickness: 1.2
    });
    this._createShardHalo(0xf6f2ff, 9, {
      type: 'storm_shard',
      signature: 'storm_cathedral',
      radius: 52,
      y: 34,
      depth: -86,
      size: 0.8,
      baseOpacity: 0.16,
      speed: 0.4
    });
    this._createHaloCrown(palette.core, {
      type: 'storm_crown',
      signature: 'storm_cathedral',
      radius: 64,
      y: 38,
      depth: -88,
      baseOpacity: 0.15,
      roll: -0.18,
      speed: 0.62
    });
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
  createSigmaTurbulenceVFX(weatherDef, palette = ATMOSPHERE_PALETTE.pressure) {
    this._createAtmosphericWash(palette.haze, Math.min(0.14, weatherDef.maxIntensity * 0.2), -98);
    this._createMoodSilhouette('pressure', palette, -94, weatherDef);
    this._createPressureBands(palette.band, 1);

    const ribbons = this._createAuroraRibbons(palette.core, 2);
    ribbons.forEach(ribbon => {
      ribbon.userData.type = 'pressure_ribbon';
      ribbon.userData.baseScale = 1.1;
    });
    this._createVeilCurtains(palette.core, 2, {
      type: 'pressure_veil',
      signature: 'pressure_liturgy',
      width: 192,
      height: 48,
      depth: -96,
      y: 24,
      baseOpacity: 0.08,
      speed: 0.14
    });
    this._createSeamLattice(palette.band, 6, {
      type: 'pressure_seam',
      signature: 'pressure_liturgy',
      y: 20,
      depth: -88,
      baseOpacity: 0.09,
      length: 84,
      thickness: 1.4,
      spreadX: 120
    });
    this._createHaloCrown(palette.band, {
      type: 'pressure_crown',
      signature: 'pressure_liturgy',
      radius: 74,
      y: 28,
      depth: -92,
      arc: 1.08,
      baseOpacity: 0.1,
      speed: 0.34
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
  createNeonRainVFX(weatherDef, palette = ATMOSPHERE_PALETTE.calm) {
    this._createAtmosphericWash(palette.core, Math.min(0.12, weatherDef.maxIntensity * 0.16), -96);
    this._createMoodSilhouette('calm', palette, -94, weatherDef);
    this._createAuroraRibbons(palette.core, 2);
    this._createPulseClouds(palette.band, 1, -90);
    this._createVeilCurtains(palette.haze, 2, {
      type: 'calm_veil',
      signature: 'civilized_horizon',
      width: 150,
      height: 40,
      depth: -95,
      y: 26,
      baseOpacity: 0.06,
      speed: 0.1
    });
    this._createShardHalo(palette.band, 6, {
      type: 'calm_shard',
      signature: 'civilized_horizon',
      radius: 46,
      y: 30,
      depth: -88,
      size: 0.6,
      baseOpacity: 0.1,
      speed: 0.2
    });
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
    });
    this.vfxLayers.ribbons.forEach((ribbon) => {
      if (ribbon.userData.type !== 'aurora_ribbon') return;
      const target = Math.min(0.18, intensity * 0.16 + 0.02);
      this._applyWeatherOpacity(ribbon, THREE.MathUtils.clamp(target, 0, ribbon.userData.baseOpacity));
      ribbon.position.y += Math.sin(this.animationTime * 0.05 + ribbon.userData.index) * 0.01;
    });
  }
  
  /**
   * RESONANCE - Aurora ribbon overlay
   */
  createAuroraWindsVFX(weatherDef, palette = ATMOSPHERE_PALETTE.resonance) {
    this._createAtmosphericWash(palette.haze, Math.min(0.14, weatherDef.maxIntensity * 0.18), -96);
    this._createMoodSilhouette('resonance', palette, -94, weatherDef);
    const ribbons = this._createAuroraRibbons(palette.core, 2);
    ribbons.forEach((ribbon, index) => {
      ribbon.userData.baseOpacity = Math.min(0.18, (weatherDef.maxIntensity || 0.7) * 0.18);
      ribbon.userData.targetOpacity = ribbon.userData.baseOpacity;
      ribbon.userData.index = index;
    });
    this._createVeilCurtains(palette.band, 3, {
      type: 'resonance_veil',
      signature: 'aurora_intelligence',
      width: 174,
      height: 52,
      depth: -94,
      y: 28,
      baseOpacity: 0.08,
      speed: 0.18
    });
    this._createHaloCrown(palette.core, {
      type: 'resonance_crown',
      signature: 'aurora_intelligence',
      radius: 68,
      y: 36,
      depth: -90,
      arc: 1.52,
      baseOpacity: 0.11,
      roll: 0.12,
      speed: 0.48
    });
    this._createShardHalo(palette.haze, 8, {
      type: 'resonance_shard',
      signature: 'aurora_intelligence',
      radius: 58,
      y: 34,
      depth: -86,
      size: 0.72,
      baseOpacity: 0.12,
      speed: 0.26
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
  createFractalFogVFX(weatherDef, palette = ATMOSPHERE_PALETTE.ascensionHaze) {
    this._createAtmosphericWash(palette.haze, Math.min(0.14, weatherDef.maxIntensity * 0.18), -100);
    this._createMoodSilhouette('ascensionHaze', palette, -92, weatherDef);
    this._createAmbientHazeSheets(palette.band, 1, -96);
    this._createPulseClouds(palette.core, 1, -92);
    this._createVeilCurtains(palette.haze, 2, {
      type: 'ascension_veil',
      signature: 'fractal_ascension',
      width: 120,
      height: 72,
      depth: -92,
      y: 34,
      baseOpacity: 0.09,
      speed: 0.12,
      pitch: Math.PI / 2.75
    });
    this._createSeamLattice(0xffffff, 5, {
      type: 'ascension_seam',
      signature: 'fractal_ascension',
      y: 32,
      depth: -84,
      baseOpacity: 0.08,
      length: 54,
      thickness: 1.1,
      spreadX: 90,
      spreadY: 22
    });
    this._createHaloCrown(0xffffff, {
      type: 'ascension_crown',
      signature: 'fractal_ascension',
      radius: 48,
      y: 40,
      depth: -86,
      arc: 1.72,
      baseOpacity: 0.13,
      roll: 0.28,
      speed: 0.32
    });
    
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
        drift: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.12,
          (Math.random() - 0.5) * 0.15
        ),
        rotationSpeed: 0.5 + Math.random() * 0.8,
        baseOpacity,
        baseScale: 1
      };
      
      this._tagWeatherObject(fractal, 'fractal_particle', 'fractal_ascension', baseOpacity, 1, 'particles');
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
    const residueWeight = this._getResidueCouplingWeight();
    const residueWindMul = 1 + this._residueCoupling.windBoost * residueWeight;
    this.registry.windVector.x = Math.cos(windAngle) * windSpeed * this.registry.windStrength * residueWindMul;
    this.registry.windVector.z = Math.sin(windAngle) * windSpeed * this.registry.windStrength * residueWindMul;
    this.registry.windVector.y = Math.sin(this.windPhase * 0.3) * 0.2 * this.registry.windStrength * (0.6 + synergyWeight * 0.4) * residueWindMul;
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
    Object.keys(this.vfxLayers).forEach((bucket) => {
      this.vfxLayers[bucket].forEach((object) => {
        this.root.remove(object);
        this._releaseMeshResources(object);
      });
      this.vfxLayers[bucket] = [];
    });
  }

  dispose() {
    this._detachResidueCoupling();
    this.cleanupAllWeatherVFX();
    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this.semanticBus = null;
  }
  
  /**
   * Get weather info for HUD display
   */
  getActiveWeatherInfo() {
    if (!this.registry.active) return null;
    
    const moodDef = this.moodStates[this.registry.active];
    const signature = this._resolveWeatherSignature(this.registry.active) || {};
    return {
      title: signature.title || moodDef.description,
      subtitle: moodDef.subtitle,
      visualTone: moodDef.visualTone,
      paletteKey: moodDef.paletteKey,
      core: signature.core,
      overlay: signature.overlay,
      atmosphere: signature.atmosphere,
      motion: signature.motion,
      worldBias: this.worldProfile?.modeKey || 'default',
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
    this._residueCoupling.potentialBoost = 0;
    this._residueCoupling.intensityBoost = 0;
    this._residueCoupling.windBoost = 0;
    this._residueCoupling.ttl = 0;
    this._residueCoupling.maxTtl = 0;
    this._residueCoupling.moodHint = null;
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
    this._residueCoupling.potentialBoost = 0;
    this._residueCoupling.intensityBoost = 0;
    this._residueCoupling.windBoost = 0;
    this._residueCoupling.ttl = 0;
    this._residueCoupling.maxTtl = 0;
    this._residueCoupling.moodHint = null;
  }
}
