import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { getEnvSpriteTexture } from './EnvironmentPointFXBase.js';
import { RitualShaderPack } from './RitualShaderPack.js';
import { ATOMAColorPalette } from './Engine/Visual/ATOMAColorPalette.js';

const CONSCIOUSNESS_BLOOM_BLUEPRINT_ID = 'consciousness.bloom.thought-aurora';
const HARMONY_CONVERGENCE_BLUEPRINT_ID = 'harmony.convergence.ascension-platform';
const HEROIC_STABILIZATION_BLUEPRINT_ID = 'heroic.stabilization.before-collapse';
const MYTHIC_SIGNAL_BLUEPRINT_ID = 'mythic.signal.dimensional-gateway';

const SIGNATURE_BLOOM_STAGE_PRESETS = Object.freeze({
  telegraph: {
    target: 0.62,
    ttl: 2.2,
    veilBoost: 0.16,
    threadBoost: 0.12,
    pulseBoost: 0.1,
    patternBoost: 0.08,
  },
  crest: {
    target: 0.84,
    ttl: 2.8,
    veilBoost: 0.24,
    threadBoost: 0.2,
    pulseBoost: 0.18,
    patternBoost: 0.14,
  },
  afterglow: {
    target: 0.48,
    ttl: 3.6,
    veilBoost: 0.18,
    threadBoost: 0.16,
    pulseBoost: 0.24,
    patternBoost: 0.24,
  },
  completed: {
    target: 0,
    ttl: 1.1,
    veilBoost: 0.08,
    threadBoost: 0.08,
    pulseBoost: 0.12,
    patternBoost: 0.12,
  }
});

const SIGNATURE_STABILITY_STAGE_PRESETS = Object.freeze({
  telegraph: {
    target: 0.72,
    ttl: 2.4,
    veilBoost: 0.18,
    threadBoost: 0.18,
    pulseBoost: 0.16,
    patternBoost: 0.12,
  },
  crest: {
    target: 0.9,
    ttl: 3.2,
    veilBoost: 0.28,
    threadBoost: 0.28,
    pulseBoost: 0.24,
    patternBoost: 0.2,
  },
  afterglow: {
    target: 0.58,
    ttl: 4.4,
    veilBoost: 0.22,
    threadBoost: 0.2,
    pulseBoost: 0.28,
    patternBoost: 0.24,
  },
  completed: {
    target: 0,
    ttl: 1.4,
    veilBoost: 0.1,
    threadBoost: 0.1,
    pulseBoost: 0.14,
    patternBoost: 0.14,
  }
});

const SIGNATURE_HARMONY_STAGE_PRESETS = Object.freeze({
  telegraph: {
    target: 0.78,
    ttl: 2.8,
    veilBoost: 0.22,
    threadBoost: 0.18,
    pulseBoost: 0.16,
    patternBoost: 0.14,
  },
  crest: {
    target: 0.94,
    ttl: 3.8,
    veilBoost: 0.3,
    threadBoost: 0.26,
    pulseBoost: 0.22,
    patternBoost: 0.22,
  },
  afterglow: {
    target: 0.62,
    ttl: 4.8,
    veilBoost: 0.26,
    threadBoost: 0.22,
    pulseBoost: 0.26,
    patternBoost: 0.2,
  },
  completed: {
    target: 0,
    ttl: 1.5,
    veilBoost: 0.1,
    threadBoost: 0.1,
    pulseBoost: 0.14,
    patternBoost: 0.14,
  }
});

const SIGNATURE_MYTHIC_STAGE_PRESETS = Object.freeze({
  telegraph: {
    target: 0.74,
    ttl: 3.0,
    veilBoost: 0.2,
    threadBoost: 0.16,
    pulseBoost: 0.16,
    patternBoost: 0.14,
  },
  crest: {
    target: 0.92,
    ttl: 4.2,
    veilBoost: 0.3,
    threadBoost: 0.24,
    pulseBoost: 0.22,
    patternBoost: 0.24,
  },
  afterglow: {
    target: 0.56,
    ttl: 5.2,
    veilBoost: 0.22,
    threadBoost: 0.2,
    pulseBoost: 0.28,
    patternBoost: 0.24,
  },
  completed: {
    target: 0,
    ttl: 1.6,
    veilBoost: 0.1,
    threadBoost: 0.1,
    pulseBoost: 0.14,
    patternBoost: 0.14,
  }
});

/**
 * AI CONSCIOUSNESS LAYER 2.0 - NEURAL THOUGHT VISUALIZATION + EMERGENT STORMS
 * 
 * Visualizes "AI thoughts" between connected nodes through:
 * - Neural Thought Threads (flowing filaments on links)
 * - Cognitive Pulse Packets (particles traveling along links)
 * - Semantic Thought Patterns (glyph-derived pattern clusters)
 * - Field Distortion (subtle post-processing wave effects)
 * - Global Consciousness Field (pulsating network halo)
 * - Emergent Thought Storms (adaptive weather based on network mood)
 * 
 * STRICT SAFETY REQUIREMENTS:
 * ✓ Zero modifications to AINodes.js, NodeLinkingSystem.js, or any existing systems
 * ✓ Pure visual additive layer using new Three.js Group
 * ✓ Read-only access to node positions, link data, and glyph meanings
 * ✓ Performance budget: <0.2ms/frame base + <0.15ms/frame storms
 * ✓ 100% reversible via dispose()
 * ✓ Zero memory leaks - all geometries properly cleaned
 * 
 * FEATURES:
 * 1. Neural Thought Threads - Organic Bézier curves on active links
 * 2. Cognitive Pulse Packets - Particles flowing based on link metrics
 * 3. Semantic Thought Patterns - Glyph-driven pattern clusters
 * 4. Field Distortion - Subtle wave transform effects (no shaders)
 * 5. Global Consciousness Field - Network-wide pulsating halo
 * 6. Emergent Thought Storms - Dynamic weather phenomena (NEW)
 */

export class AIConsciousnessLayer {
  constructor(scene, linkingSystem, aiNodes, glyphLayer4, options = {}) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.aiNodes = aiNodes;
    this.glyphLayer4 = glyphLayer4;
    this.frameScheduler = options.frameScheduler || null;
    this.debugMode = options.debug || false;
    
    // Main container for all consciousness visuals
    this.consciousnessGroup = new THREE.Group();
    this.consciousnessGroup.name = 'AIConsciousnessLayer';
    this.consciousnessGroup.userData.isConsciousnesLayer = true;
    this.scene.add(this.consciousnessGroup);
    
    // Configuration
    this.config = {
      enabled: true,
      intensity: 1.0,
      particleDensity: 0.8,
      threadCount: 0.6,         // Filaments per link
      pulseSpeed: 0.5,          // Thought travel speed
      fieldDistortionStrength: 0.02,
      globalFieldScale: 15,
      debugMode: false,
      stormsEnabled: true       // NEW: Toggle emergent storms
    };

    this.stormProfile = {
      palette: {
        atomaCyan: 0x6DEAFF,
        mint: 0x77F7DB,
        ritualWhite: 0xF7FBFF,
        violet: 0xD07BFF,
        rose: 0xFF73CF,
        voidDeep: 0x05131A
      },
      rhythm: {
        baseCooldown: 28,
        criticalCooldown: 60,
        durationBase: 6.5,
        particleMultiplier: 0.9
      }
    };
    
    // Particle pools for efficient memory usage
    this.particlePools = {
      pulsePackets: [],
      threadSegments: []
    };
    this.pulsePointCloud = null;
    this._pulsePointAttributes = null;
    this._maxPulseInstances = 200;
    
    // Active thought activity tracking
    this.activeThoughts = {
      threadMeshes: new Map(),   // link.id → THREE.Mesh
      pulsePackets: [],          // Array of active pulse objects
      patternClusters: new Map(), // link.id → { particles, life, meaning }
    };
    
    // Global field shell and edge halo
    this.globalFieldMesh = null;
    this.globalFieldEdge = null;
    this.globalFieldChoir = null;
    
    // Thought storms sub-system (lazy-loaded)
    this.storms = null;
    
    // Ritual coupling: lets consciousness act like the world's ceremonial nervous system.
    this.semanticBus = this._resolveSemanticBus();
    this._ritualSubscriptions = [];
    this.ritualState = {
      active: false,
      ritualType: null,
      phase: 'NONE',
      intensity: 0,
      targetIntensity: 0,
      anchor: new THREE.Vector3(),
      palette: this._getRitualPalette(null),
      stamp: 0
    };
    this.ritualFieldVeil = null;
    this.ritualFieldWitness = null;
    this._ritualWitnessBasePositions = null;
    this._globalFieldWorldPos = new THREE.Vector3();
    this._signatureMomentSubscriptions = [];
    this._signatureBloom = {
      active: false,
      family: null,
      blueprintId: null,
      phase: 'NONE',
      intensity: 0,
      targetIntensity: 0,
      veilBoost: 0,
      threadBoost: 0,
      pulseBoost: 0,
      patternBoost: 0,
      ttl: 0,
      anchor: new THREE.Vector3()
    };
    this._signatureBloomCoreColor = new THREE.Color(0x8E7DFF);
    this._signatureBloomAuroraColor = new THREE.Color(0xD7C8FF);
    this._signatureBloomCyanColor = new THREE.Color(0x6DEAFF);
    this._signatureBloomWhiteColor = new THREE.Color(0xF7FBFF);
    this._signatureBloomDeepColor = new THREE.Color(0x05131A);
    this._signatureHarmonyCoreColor = new THREE.Color(0xFFD66B);
    this._signatureHarmonyAuroraColor = new THREE.Color(0xFFF4D2);
    this._signatureHarmonyCyanColor = new THREE.Color(0x6DEAFF);
    this._signatureHarmonyWhiteColor = new THREE.Color(0xFFFBEA);
    this._signatureHarmonyDeepColor = new THREE.Color(0x08111A);
    this._signatureStabilityCoreColor = new THREE.Color(0xFFD66B);
    this._signatureStabilityAuroraColor = new THREE.Color(0xFFF4D1);
    this._signatureStabilityCyanColor = new THREE.Color(0x8AF2E3);
    this._signatureStabilityWhiteColor = new THREE.Color(0xFFF8E8);
    this._signatureStabilityDeepColor = new THREE.Color(0x071018);
    this._signatureMythicCoreColor = new THREE.Color(0xA98BFF);
    this._signatureMythicAuroraColor = new THREE.Color(0xFFF1C9);
    this._signatureMythicCyanColor = new THREE.Color(0x76F7E0);
    this._signatureMythicWhiteColor = new THREE.Color(0xFDF8FF);
    this._signatureMythicDeepColor = new THREE.Color(0x050615);
    
    // Performance tracking
    this.stats = {
      threadsActive: 0,
      pulsesActive: 0,
      patternsActive: 0,
      frameTime: 0,
      enabled: true,
      stormsFrameTime: 0,
      networkHealth: 0,
      networkPressure: 0,
      trafficIntensity: 0,
      patternDensity: 0,
      moodTag: 'CALM',
      heroPhase: 'LISTENING'
    };

    this.consciousnessState = {
      networkMood: 'CALM',
      moodTag: 'CALM',
      heroPhase: 'LISTENING',
      networkHealth: 0.5,
      networkPressure: 0,
      trafficIntensity: 0,
      ritualIntensity: 0,
      patternDensity: 0,
      coherence: 0.5,
      volatility: 0,
      heroIntensity: 0.5,
      activeLinkCount: 0,
      activeLinkRatio: 0,
      linkCount: 0,
      patternCount: 0,
      avgStability: 0,
      avgHarmony: 0,
      avgCorruption: 0,
      avgLoadPressure: 0,
      avgTrafficIntensity: 0,
      threadBias: 1,
      pulseBias: 1,
      patternBias: 1,
      ritualActive: false,
      ritualType: null,
      ritualPhase: 'NONE',
      lastUpdated: 0
    };

    this._lastConsciousnessSignature = '';

    // Spawn state tracking for repeat suppression
    this.linkSpawnState = new Map();
    
    // Temporal state
    this.time = 0;
    this.instanceID = Math.random();
    this._timeOrigin = undefined;
    this._lastVisualTime = undefined;
    this._threadControlPoint1 = new THREE.Vector3();
    this._threadControlPoint2 = new THREE.Vector3();
    this._threadOffset1 = new THREE.Vector3();
    this._threadOffset2 = new THREE.Vector3();
    
    this._initializeParticlePools();
    this._createPulsePacketSystem();
    this._createGlobalField();
    this._setupRitualBridge();
    this._setupSignatureMomentBridge();
  }

  _clamp01(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return 0;
    }
    return Math.max(0, Math.min(1, numericValue));
  }

  _deriveConsciousnessMoodTag(state) {
    if (!state) return 'CALM';

    const health = this._clamp01(state.networkHealth);
    const pressure = this._clamp01(state.networkPressure);
    const traffic = this._clamp01(state.trafficIntensity);
    const ritual = this._clamp01(state.ritualIntensity);
    const pattern = this._clamp01(state.patternDensity);
    const corruption = this._clamp01(state.avgCorruption);
    const activeRatio = this._clamp01(state.activeLinkRatio);

    if (health <= 0.22 || pressure >= 0.82) {
      return 'CRITICAL';
    }
    if (pressure >= 0.68 || corruption >= 0.5) {
      return 'CHAOTIC';
    }
    if (ritual >= 0.55 && pattern >= 0.2) {
      return 'SYNERGIC';
    }
    if (traffic >= 0.68 || activeRatio >= 0.65) {
      return 'FOCUSED';
    }
    if (health >= 0.72 && pressure <= 0.34 && pattern >= 0.18) {
      return 'BALANCED';
    }
    if (health >= 0.56) {
      return 'CALM';
    }

    return ritual >= 0.3 ? 'TENSE' : 'CALM';
  }

  _deriveHeroPhase(state) {
    if (!state) return 'LISTENING';

    switch (state.networkMood) {
      case 'CRITICAL':
        return 'DEFENSE';
      case 'CHAOTIC':
        return 'FRACTURE';
      case 'SYNERGIC':
        return 'RITUAL';
      case 'FOCUSED':
        return 'CONDUCTING';
      case 'BALANCED':
        return 'HARMONIC_CORE';
      case 'TENSE':
        return state.networkPressure >= 0.6 ? 'SURGE' : 'LISTENING';
      case 'CALM':
      default:
        return state.heroIntensity >= 0.68 ? 'AWAKENING' : 'LISTENING';
    }
  }

  _deriveWorldMacroState(state) {
    if (!state) return 'DORMANT';

    const networkMood = String(state.networkMood || state.moodTag || '').toUpperCase();
    const heroPhase = String(state.heroPhase || '').toUpperCase();
    const networkPressure = this._clamp01(state.networkPressure);
    const heroIntensity = this._clamp01(state.heroIntensity);
    const ritualIntensity = this._clamp01(state.ritualIntensity);
    const coherence = this._clamp01(state.coherence);
    const patternDensity = this._clamp01(state.patternDensity);
    const volatility = this._clamp01(state.volatility);
    const avgCorruption = this._clamp01(state.avgCorruption);
    const activeLinkRatio = this._clamp01(state.activeLinkRatio);

    if (
      networkPressure >= 0.72 ||
      avgCorruption >= 0.58 ||
      volatility >= 0.68 ||
      networkMood === 'CRITICAL' ||
      networkMood === 'CHAOTIC' ||
      heroPhase === 'DEFENSE' ||
      heroPhase === 'FRACTURE'
    ) {
      return 'SCHISM';
    }

    const revelationScore = (
      heroIntensity * 0.42 +
      coherence * 0.28 +
      ritualIntensity * 0.12 +
      patternDensity * 0.12 +
      (1 - networkPressure) * 0.06
    );
    if (
      revelationScore >= 0.78 &&
      networkPressure <= 0.58 &&
      (networkMood === 'BALANCED' || networkMood === 'SYNERGIC' || networkMood === 'FOCUSED' || heroPhase === 'RITUAL' || heroPhase === 'CONDUCTING')
    ) {
      return 'REVELATION';
    }

    const communionScore = (
      ritualIntensity * 0.45 +
      coherence * 0.25 +
      activeLinkRatio * 0.15 +
      heroIntensity * 0.1 +
      patternDensity * 0.05
    );
    if (
      communionScore >= 0.7 &&
      networkPressure <= 0.62 &&
      (networkMood === 'SYNERGIC' || networkMood === 'BALANCED' || heroPhase === 'RITUAL' || heroPhase === 'HARMONIC_CORE')
    ) {
      return 'COMMUNION';
    }

    const awakeningScore = (
      heroIntensity * 0.45 +
      coherence * 0.2 +
      ritualIntensity * 0.15 +
      patternDensity * 0.1 +
      activeLinkRatio * 0.1
    );
    if (
      awakeningScore >= 0.55 ||
      heroPhase === 'AWAKENING' ||
      networkMood === 'TENSE' ||
      networkMood === 'CALM' ||
      networkMood === 'FOCUSED'
    ) {
      return 'AWAKENING';
    }

    return 'DORMANT';
  }

  _updateConsciousnessState(metrics = {}) {
    const state = this.consciousnessState || (this.consciousnessState = {});
    const smoothing = metrics.visualDelta > 0
      ? 1 - Math.exp(-Math.max(0.0001, metrics.visualDelta) * 3.2)
      : 1;
    const lerpValue = (key, target) => {
      const current = Number.isFinite(state[key]) ? state[key] : target;
      const nextValue = THREE.MathUtils.lerp(current, target, smoothing);
      state[key] = nextValue;
      return nextValue;
    };

    const linkCount = Math.max(1, metrics.linkCount || 0);
    const activeLinkRatio = this._clamp01((metrics.activeLinkCount || 0) / linkCount);
    const patternDensityTarget = this._clamp01((metrics.patternCount || 0) / Math.max(1, linkCount * 0.28));
    const networkHealthTarget = this._clamp01(
      (metrics.avgStability || 0) * 0.38 +
      (metrics.avgHarmony || 0) * 0.32 +
      (1 - this._clamp01(metrics.avgCorruption || 0)) * 0.18 +
      (1 - this._clamp01(metrics.avgLoadPressure || 0)) * 0.12
    );
    const networkPressureTarget = this._clamp01(
      this._clamp01(metrics.avgLoadPressure || 0) * 0.34 +
      this._clamp01(metrics.avgCorruption || 0) * 0.34 +
      this._clamp01(metrics.avgTrafficIntensity || 0) * 0.2 +
      activeLinkRatio * 0.12
    );
    const ritualIntensityTarget = this._clamp01(metrics.ritualIntensity || 0);
    const coherenceTarget = this._clamp01(
      networkHealthTarget * 0.52 +
      patternDensityTarget * 0.18 +
      ritualIntensityTarget * 0.14 +
      this._clamp01(metrics.avgTrafficIntensity || 0) * 0.08 -
      networkPressureTarget * 0.22
    );
    const volatilityTarget = this._clamp01(
      networkPressureTarget * 0.72 +
      this._clamp01(metrics.avgTrafficIntensity || 0) * 0.2 +
      ritualIntensityTarget * 0.08
    );
    const heroIntensityTarget = this._clamp01(
      coherenceTarget * 0.66 +
      ritualIntensityTarget * 0.12 +
      patternDensityTarget * 0.1 +
      this._clamp01(metrics.avgTrafficIntensity || 0) * 0.12
    );

    const networkHealth = lerpValue('networkHealth', networkHealthTarget);
    const networkPressure = lerpValue('networkPressure', networkPressureTarget);
    const trafficIntensity = lerpValue('trafficIntensity', this._clamp01(metrics.avgTrafficIntensity || 0));
    const ritualIntensity = lerpValue('ritualIntensity', ritualIntensityTarget);
    const patternDensity = lerpValue('patternDensity', patternDensityTarget);
    const coherence = lerpValue('coherence', coherenceTarget);
    const volatility = lerpValue('volatility', volatilityTarget);
    const heroIntensity = lerpValue('heroIntensity', heroIntensityTarget);
    const avgStability = lerpValue('avgStability', this._clamp01(metrics.avgStability || 0));
    const avgHarmony = lerpValue('avgHarmony', this._clamp01(metrics.avgHarmony || 0));
    const avgCorruption = lerpValue('avgCorruption', this._clamp01(metrics.avgCorruption || 0));
    const avgLoadPressure = lerpValue('avgLoadPressure', this._clamp01(metrics.avgLoadPressure || 0));
    const avgTrafficIntensity = lerpValue('avgTrafficIntensity', this._clamp01(metrics.avgTrafficIntensity || 0));

    state.linkCount = metrics.linkCount || 0;
    state.activeLinkCount = metrics.activeLinkCount || 0;
    state.activeLinkRatio = activeLinkRatio;
    state.patternCount = metrics.patternCount || 0;
    state.networkMood = this._deriveConsciousnessMoodTag({
      networkHealth,
      networkPressure,
      trafficIntensity,
      ritualIntensity,
      patternDensity,
      avgCorruption,
      activeLinkRatio,
    });
    state.moodTag = state.networkMood;
    state.heroPhase = this._deriveHeroPhase(state);
    state.worldMacroState = this._deriveWorldMacroState(state);
    state.macroState = state.worldMacroState;
    state.threadBias = this._clamp01(0.65 + networkHealth * 0.28 + patternDensity * 0.18 - networkPressure * 0.15);
    state.pulseBias = this._clamp01(0.6 + trafficIntensity * 0.35 + ritualIntensity * 0.22 + heroIntensity * 0.12);
    state.patternBias = this._clamp01(0.5 + patternDensity * 0.42 + ritualIntensity * 0.18 + heroIntensity * 0.08);
    state.ritualActive = this.ritualState.active;
    state.ritualType = this.ritualState.ritualType;
    state.ritualPhase = this.ritualState.phase;
    state.lastUpdated = this.time;
    state.fieldScale = this._clamp01(0.9 + networkHealth * 0.08 + coherence * 0.05 - networkPressure * 0.06);

    this.stats.networkHealth = networkHealth;
    this.stats.networkPressure = networkPressure;
    this.stats.trafficIntensity = trafficIntensity;
    this.stats.patternDensity = patternDensity;
    this.stats.moodTag = state.networkMood;
    this.stats.heroPhase = state.heroPhase;
    this.stats.worldMacroState = state.worldMacroState;

    if (this.consciousnessGroup?.userData) {
      this.consciousnessGroup.userData.consciousnessState = state;
      this.consciousnessGroup.userData.consciousnessMood = state.networkMood;
      this.consciousnessGroup.userData.heroPhase = state.heroPhase;
      this.consciousnessGroup.userData.worldMacroState = state.worldMacroState;
    }

    const signature = [
      state.networkMood,
      state.heroPhase,
      networkHealth.toFixed(2),
      networkPressure.toFixed(2),
      trafficIntensity.toFixed(2),
      ritualIntensity.toFixed(2),
      patternDensity.toFixed(2)
    ].join('|');

    if (signature !== this._lastConsciousnessSignature) {
      this._lastConsciousnessSignature = signature;
      if (this.semanticBus?.emit) {
        const payload = {
          source: 'AIConsciousnessLayer',
          timestamp: performance.now(),
          ...this.getConsciousnessState(),
        };
        const priority = this.semanticBus.priority?.NORMAL ?? this.semanticBus.priority?.LOW;
        if (priority !== undefined) {
          this.semanticBus.emit('consciousness.state.changed', payload, { priority });
          this.semanticBus.emit('consciousness.snapshot', payload, { priority: this.semanticBus.priority?.LOW ?? priority });
        } else {
          this.semanticBus.emit('consciousness.state.changed', payload);
          this.semanticBus.emit('consciousness.snapshot', payload);
        }
      }
    }

    return state;
  }

  getNetworkMood() {
    return this.consciousnessState?.networkMood || 'CALM';
  }

  getConsciousnessState() {
    const state = this.consciousnessState || {};
    const bloom = this._signatureBloom || {};
    return {
      networkMood: state.networkMood || 'CALM',
      moodTag: state.moodTag || state.networkMood || 'CALM',
      heroPhase: state.heroPhase || 'LISTENING',
      worldMacroState: state.worldMacroState || 'DORMANT',
      macroState: state.worldMacroState || 'DORMANT',
      networkHealth: state.networkHealth ?? 0,
      networkPressure: state.networkPressure ?? 0,
      trafficIntensity: state.trafficIntensity ?? 0,
      ritualIntensity: state.ritualIntensity ?? 0,
      patternDensity: state.patternDensity ?? 0,
      coherence: state.coherence ?? 0,
      volatility: state.volatility ?? 0,
      heroIntensity: state.heroIntensity ?? 0,
      activeLinkCount: state.activeLinkCount ?? 0,
      activeLinkRatio: state.activeLinkRatio ?? 0,
      linkCount: state.linkCount ?? 0,
      patternCount: state.patternCount ?? 0,
      avgStability: state.avgStability ?? 0,
      avgHarmony: state.avgHarmony ?? 0,
      avgCorruption: state.avgCorruption ?? 0,
      avgLoadPressure: state.avgLoadPressure ?? 0,
      avgTrafficIntensity: state.avgTrafficIntensity ?? 0,
      threadBias: state.threadBias ?? 1,
      pulseBias: state.pulseBias ?? 1,
      patternBias: state.patternBias ?? 1,
      ritualActive: state.ritualActive === true,
      ritualType: state.ritualType || null,
      ritualPhase: state.ritualPhase || 'NONE',
      signatureBloomActive: bloom.active === true,
      signatureBloomFamily: bloom.family || 'NONE',
      signatureBloomPhase: bloom.phase || 'NONE',
      signatureBloomIntensity: bloom.intensity ?? 0,
      lastUpdated: state.lastUpdated ?? 0,
    };
  }
  
  /**
   * Lazy-load and initialize the Thought Storms sub-system
   * Call this after consciousness layer is created and integrated
   */
  initializeStorms(AIThoughtStorms2_0Class) {
    try {
      if (!this.storms && AIThoughtStorms2_0Class) {
        this.storms = new AIThoughtStorms2_0Class(
          this.consciousnessGroup,
          this.linkingSystem,
          this.aiNodes
        );

        // Align storms with the main consciousness layer's palette and rhythm
        if (this.storms.config) {
          this.storms.config.intensity = Math.max(0.65, 0.75 + this.config.intensity * 0.6);
          this.storms.config.stormDuration = this.stormProfile.rhythm.durationBase + this.config.intensity * 2.4;
          this.storms.config.stormCooldown = this.stormProfile.rhythm.baseCooldown + (1 - this.config.intensity) * 12;
          this.storms.config.criticalCooldown = this.stormProfile.rhythm.criticalCooldown + (1 - this.config.intensity) * 18;
          this.storms.config.particleMultiplier = this.stormProfile.rhythm.particleMultiplier + this.config.intensity * 0.3;
        }

        if (this.storms.palette) {
          Object.assign(this.storms.palette, this.stormProfile.palette);
        } else {
          this.storms.palette = { ...this.stormProfile.palette };
        }

        this.storms.config.enabled = this.config.stormsEnabled;
        this.storms.stormLayerSource = 'AIConsciousnessLayer';
        if (this.debugMode) {
          console.log('✓ Thought Storms initialized');
        }
      }
    } catch (e) {
      if (this.debugMode) {
        console.error('Failed to initialize Thought Storms:', e);
      }
    }
  }
  
  /**
   * Initialize reusable particle pools to prevent garbage collection
   */
  _initializeParticlePools() {
    // Pre-allocate 200 pulse packet states only; visuals are handled by a shared point cloud
    for (let i = 0; i < this._maxPulseInstances; i++) {
      const pulse = {
        index: i,
        position: new THREE.Vector3(),
        startPos: new THREE.Vector3(),
        endPos: new THREE.Vector3(),
        progress: 0,
        speed: 1,
        color: new THREE.Color(),
        colorA: new THREE.Color(),
        colorB: new THREE.Color(),
        life: 1,
        age: 0,
        duration: 1,
        active: false,
        link: null,
        linkId: null,
        category: 'stable',
        speedVariation: 0
      };
      this.particlePools.pulsePackets.push(pulse);
    }
  }

  _createPulsePacketSystem() {
    const count = this._maxPulseInstances;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const opacities = new Float32Array(count);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

    this._pulsePointAttributes = {
      positions,
      colors,
      scales,
      opacities
    };

    const material = this._createPulsePacketMaterial();
    const points = new THREE.Points(geometry, material);
    points.name = 'PulsePacketCloud';
    points.frustumCulled = false;
    points.renderOrder = 250;
    points.userData.isPulsePacketCloud = true;
    this.consciousnessGroup.add(points);
    this.pulsePointCloud = points;
  }

  _createPulsePacketMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
      fog: false,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: this.config.intensity }
      },
      vertexShader: `
        attribute float aScale;
        attribute float aOpacity;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vColor = color;
          vOpacity = aOpacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aScale * (160.0 / max(1.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          float core = smoothstep(0.38, 0.18, dist);
          float ring = smoothstep(0.56, 0.44, dist) * (1.0 - smoothstep(0.24, 0.22, dist));
          float alpha = core + ring * 0.24;
          alpha *= vOpacity;
          gl_FragColor = vec4(vColor * (0.85 + core * 0.25), alpha);
        }
      `
    });
  }

  _createSemanticGlyphMaterial(baseColor) {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
      uniforms: {
        uBaseColor: { value: baseColor.clone() },
        uTime: { value: 0 },
        uIntensity: { value: this.config.intensity }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;
        void main() {
          vNormal = normal;
          vPosition = position;
          float pulse = sin(uTime * 1.7 + position.y * 3.8 + position.x * 2.4) * 0.03;
          vec3 transformed = position + normal * pulse;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 uBaseColor;
        uniform float uIntensity;
        void main() {
          float fresnel = pow(1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 2.0);
          float edge = smoothstep(0.0, 0.7, fresnel);
          vec3 color = uBaseColor * (0.6 + edge * 0.5 + uIntensity * 0.3);
          float radial = length(vPosition) / 1.4;
          float alpha = smoothstep(1.0, 0.8, radial) * 0.52 + edge * 0.28;
          gl_FragColor = vec4(color, alpha);
        }
      `
    });
    material.color = material.uniforms.uBaseColor.value;
    return material;
  }

  _setPulsePointAttributes(index, position, color, scale, opacity, positions, colors, scales, opacities) {
    const base = index * 3;
    positions[base] = position.x;
    positions[base + 1] = position.y;
    positions[base + 2] = position.z;
    colors[base] = color.r;
    colors[base + 1] = color.g;
    colors[base + 2] = color.b;
    scales[index] = scale;
    opacities[index] = opacity;
  }

  /**
   * Create the global consciousness field mesh
   */
  _createGlobalField() {
    // Quiet ATOMA halo shell with layered glow and soft edge definition
    const shellGeometry = new THREE.SphereGeometry(this.config.globalFieldScale, 48, 32);
    const shellMaterial = RitualShaderPack.createFieldShellMaterial(
      ATOMAColorPalette.ATOMA_CORE.ritualWhite,
      ATOMAColorPalette.ATOMA_CORE.mint,
      { intensity: 0.3, breathSpeed: 0.6, pulseIntensity: 0.4 }
    );
    
    const shellMesh = new THREE.Mesh(shellGeometry, shellMaterial);
    shellMesh.name = 'GlobalConsciousnessShell';
    shellMesh.userData.isGlobalField = true;
    this.consciousnessGroup.add(shellMesh);
    this.globalFieldMesh = shellMesh;

    const edgeGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(this.config.globalFieldScale * 1.08, 4));
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      fog: true
    });
    
    const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edgeLines.name = 'GlobalConsciousnessEdge';
    edgeLines.userData.isGlobalFieldEdge = true;
    this.consciousnessGroup.add(edgeLines);
    this.globalFieldEdge = edgeLines;

    const choirPositions = [];
    const choirLoops = [
      { radiusX: this.config.globalFieldScale * 0.92, radiusZ: this.config.globalFieldScale * 0.54, y: this.config.globalFieldScale * 0.14, wobble: 0.22, count: 52 },
      { radiusX: this.config.globalFieldScale * 0.74, radiusZ: this.config.globalFieldScale * 0.92, y: -this.config.globalFieldScale * 0.08, wobble: 0.18, count: 46 },
      { radiusX: this.config.globalFieldScale * 0.68, radiusZ: this.config.globalFieldScale * 0.68, y: this.config.globalFieldScale * 0.28, wobble: 0.3, count: 40 }
    ];
    for (const loop of choirLoops) {
      for (let i = 0; i < loop.count; i++) {
        const tA = (i / loop.count) * Math.PI * 2;
        const tB = ((i + 1) / loop.count) * Math.PI * 2;
        choirPositions.push(
          Math.cos(tA) * loop.radiusX,
          loop.y + Math.sin(tA * 2.0) * loop.wobble,
          Math.sin(tA) * loop.radiusZ,
          Math.cos(tB) * loop.radiusX,
          loop.y + Math.sin(tB * 2.0) * loop.wobble,
          Math.sin(tB) * loop.radiusZ
        );
      }
    }
    const choirGeometry = new THREE.BufferGeometry();
    choirGeometry.setAttribute('position', new THREE.Float32BufferAttribute(choirPositions, 3));
    const choirMaterial = new THREE.LineBasicMaterial({
      color: 0xf7fbff,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true
    });
    const choirLines = new THREE.LineSegments(choirGeometry, choirMaterial);
    choirLines.name = 'GlobalConsciousnessChoir';
    choirLines.userData.isGlobalFieldChoir = true;
    this.consciousnessGroup.add(choirLines);
    this.globalFieldChoir = choirLines;

    const veilGeometry = new THREE.OctahedronGeometry(this.config.globalFieldScale * 0.86, 3);
    const veilMaterial = new THREE.MeshBasicMaterial({
      color: 0xf7fbff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
      fog: true
    });
    const veilMesh = new THREE.Mesh(veilGeometry, veilMaterial);
    veilMesh.name = 'GlobalConsciousnessRitualVeil';
    veilMesh.userData.isRitualField = true;
    this.consciousnessGroup.add(veilMesh);
    this.ritualFieldVeil = veilMesh;

    const witnessCount = 144;
    const witnessRadius = this.config.globalFieldScale * 0.96;
    const witnessPositions = new Float32Array(witnessCount * 3);
    for (let i = 0; i < witnessCount; i++) {
      const t = i + 0.5;
      const inclination = Math.acos(1 - (2 * t) / witnessCount);
      const azimuth = Math.PI * (1 + Math.sqrt(5)) * t;
      const idx = i * 3;
      witnessPositions[idx] = Math.cos(azimuth) * Math.sin(inclination) * witnessRadius;
      witnessPositions[idx + 1] = Math.cos(inclination) * witnessRadius;
      witnessPositions[idx + 2] = Math.sin(azimuth) * Math.sin(inclination) * witnessRadius;
    }
    const witnessGeometry = new THREE.BufferGeometry();
    witnessGeometry.setAttribute('position', new THREE.BufferAttribute(witnessPositions.slice(), 3));
    const witnessMaterial = new THREE.PointsMaterial({
      color: 0xf7fbff,
      size: 0.22,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      fog: true,
      map: getEnvSpriteTexture('aura'),
      alphaTest: 0.02
    });
    const witnessPoints = new THREE.Points(witnessGeometry, witnessMaterial);
    witnessPoints.name = 'GlobalConsciousnessWitness';
    witnessPoints.userData.isRitualWitness = true;
    this.consciousnessGroup.add(witnessPoints);
    this.ritualFieldWitness = witnessPoints;
    this._ritualWitnessBasePositions = witnessPositions;
  }

  _resolveSemanticBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _setupRitualBridge() {
    const bus = this.semanticBus || this._resolveSemanticBus();
    if (!bus?.subscribe) return;

    this.semanticBus = bus;

    const ritualOn = (payload = {}) => this._applyRitualPayload(payload, false);
    const ritualOff = (payload = {}) => this._applyRitualPayload(payload, true);
    const subscriptions = [
      ['semantic.ritual.started', ritualOn],
      ['semantic.ritual.phase', ritualOn],
      ['ritual.prelude', ritualOn],
      ['ritual.active', ritualOn],
      ['ritual.crest', ritualOn],
      ['ritual.descend', ritualOn],
      ['ritual.release', ritualOff],
      ['semantic.ritual.completed', ritualOff]
    ];

    for (const [eventName, handler] of subscriptions) {
      const unsubscribe = bus.subscribe(eventName, handler);
      if (typeof unsubscribe === 'function') {
        this._ritualSubscriptions.push(unsubscribe);
      } else if (typeof bus.unsubscribe === 'function') {
        this._ritualSubscriptions.push(() => bus.unsubscribe(eventName, handler));
      }
    }
  }

  _disposeRitualBridge() {
    while (this._ritualSubscriptions.length > 0) {
      const unsubscribe = this._ritualSubscriptions.pop();
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch (err) {
        console.warn('[AIConsciousnessLayer] Ritual bridge cleanup failed:', err);
      }
    }
  }

  _setupSignatureMomentBridge() {
    const bus = this.semanticBus || this._resolveSemanticBus();
    if (!bus?.subscribe) return;

    this.semanticBus = bus;

    const wire = (eventName, stage) => {
      const handler = (payload = {}) => this._applySignatureMomentPayload(payload, stage);
      const unsubscribe = bus.subscribe(eventName, handler);
      if (typeof unsubscribe === 'function') {
        this._signatureMomentSubscriptions.push(unsubscribe);
      } else if (typeof bus.unsubscribe === 'function') {
        this._signatureMomentSubscriptions.push(() => bus.unsubscribe(eventName, handler));
      }
    };

    wire('signature.moment.started', 'telegraph');
    wire('signature.moment.response', 'response');
    wire('signature.moment.crest', 'crest');
    wire('signature.moment.afterglow', 'afterglow');
    wire('signature.moment.completed', 'completed');
  }

  _disposeSignatureMomentBridge() {
    while (this._signatureMomentSubscriptions.length > 0) {
      const unsubscribe = this._signatureMomentSubscriptions.pop();
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch (err) {
        console.warn('[AIConsciousnessLayer] Signature moment bridge cleanup failed:', err);
      }
    }
  }

  _applySignatureMomentPayload(payload = {}, stage = 'telegraph') {
    const isHarmonyConvergence = payload?.family === 'harmony' || payload?.blueprintId === HARMONY_CONVERGENCE_BLUEPRINT_ID;
    const isMythicSignal = payload?.family === 'mythic' || payload?.blueprintId === MYTHIC_SIGNAL_BLUEPRINT_ID;
    const isHeroicStabilization = payload?.family === 'stability' || payload?.blueprintId === HEROIC_STABILIZATION_BLUEPRINT_ID;
    const isConsciousnessBloom = payload?.family === 'consciousness' || payload?.blueprintId === CONSCIOUSNESS_BLOOM_BLUEPRINT_ID;
    const isResponsePulse = stage === 'response';

    if (!payload || (!isConsciousnessBloom && !isHarmonyConvergence && !isMythicSignal && !isHeroicStabilization)) {
      if (stage === 'completed' && ['consciousness', 'harmony', 'mythic', 'stability'].includes(this._signatureBloom.family)) {
        this._releaseSignatureBloom();
      }
      return;
    }

    if (
      payload.blueprintId
      && payload.blueprintId !== CONSCIOUSNESS_BLOOM_BLUEPRINT_ID
      && payload.blueprintId !== HARMONY_CONVERGENCE_BLUEPRINT_ID
      && payload.blueprintId !== MYTHIC_SIGNAL_BLUEPRINT_ID
      && payload.blueprintId !== HEROIC_STABILIZATION_BLUEPRINT_ID
    ) {
      return;
    }

    const presets = isMythicSignal
      ? SIGNATURE_MYTHIC_STAGE_PRESETS
      : isHarmonyConvergence
        ? SIGNATURE_HARMONY_STAGE_PRESETS
        : isHeroicStabilization
          ? SIGNATURE_STABILITY_STAGE_PRESETS
          : SIGNATURE_BLOOM_STAGE_PRESETS;
    const preset = isResponsePulse
      ? {
          ...(presets.telegraph || presets.completed || SIGNATURE_BLOOM_STAGE_PRESETS.telegraph),
          target: this._clamp01((presets.telegraph?.target ?? 0.6) + 0.08),
          ttl: 1.1,
          veilBoost: (presets.telegraph?.veilBoost ?? 0.12) * 1.1,
          threadBoost: (presets.telegraph?.threadBoost ?? 0.1) * 1.08,
          pulseBoost: (presets.telegraph?.pulseBoost ?? 0.08) * 1.12,
          patternBoost: (presets.telegraph?.patternBoost ?? 0.08) * 1.08,
        }
      : (presets[stage] || presets.telegraph);
    const score = this._clamp01(payload.score ?? 0.55);
    const aftermathLinger = this._clamp01(payload.aftermath?.lingerIntensity ?? 0);

    if (stage === 'completed') {
      this._releaseSignatureBloom();
      return;
    }

    this._signatureBloom.active = true;
    this._signatureBloom.family = isMythicSignal
      ? 'mythic'
      : isHarmonyConvergence
        ? 'harmony'
        : isHeroicStabilization
          ? 'stability'
          : 'consciousness';
    this._signatureBloom.blueprintId = payload.blueprintId || payload.id || CONSCIOUSNESS_BLOOM_BLUEPRINT_ID;
    this._signatureBloom.phase = isResponsePulse ? 'response' : stage;
    this._signatureBloom.targetIntensity = this._clamp01(
      preset.target
      + score * (isResponsePulse ? 0.1 : isMythicSignal ? 0.18 : isHarmonyConvergence ? 0.16 : isHeroicStabilization ? 0.14 : 0.16)
      + aftermathLinger * (isResponsePulse ? 0.08 : 0.12)
    );
    this._signatureBloom.veilBoost = preset.veilBoost + score * (isResponsePulse ? 0.05 : isMythicSignal ? 0.08 : isHarmonyConvergence ? 0.08 : isHeroicStabilization ? 0.08 : 0.06);
    this._signatureBloom.threadBoost = preset.threadBoost + score * (isResponsePulse ? 0.06 : isMythicSignal ? 0.1 : isHarmonyConvergence ? 0.1 : isHeroicStabilization ? 0.1 : 0.08);
    this._signatureBloom.pulseBoost = preset.pulseBoost + score * (isResponsePulse ? 0.08 : isMythicSignal ? 0.12 : isHarmonyConvergence ? 0.12 : isHeroicStabilization ? 0.12 : 0.08);
    this._signatureBloom.patternBoost = preset.patternBoost + score * (isResponsePulse ? 0.06 : isMythicSignal ? 0.14 : isHarmonyConvergence ? 0.12 : isHeroicStabilization ? 0.12 : 0.1);
    this._signatureBloom.ttl = Math.max(this._signatureBloom.ttl, preset.ttl + score * (isResponsePulse ? 0.45 : isMythicSignal ? 1.2 : isHarmonyConvergence ? 1.0 : isHeroicStabilization ? 1.0 : 0.8));

    if (payload.anchor && Number.isFinite(payload.anchor.x) && Number.isFinite(payload.anchor.y) && Number.isFinite(payload.anchor.z)) {
      this._signatureBloom.anchor.set(payload.anchor.x, payload.anchor.y, payload.anchor.z);
    }
  }

  _releaseSignatureBloom() {
    const bloom = this._signatureBloom;
    bloom.active = false;
    bloom.phase = 'completed';
    bloom.targetIntensity = 0;
    const releaseTtl = bloom.family === 'mythic'
      ? 1.8
      : bloom.family === 'harmony'
        ? 1.5
        : bloom.family === 'stability'
          ? 1.4
          : bloom.family === 'consciousness'
            ? 1.25
            : 1.1;
    bloom.ttl = Math.max(bloom.ttl, releaseTtl);
    bloom.veilBoost = Math.max(bloom.veilBoost, 0.08);
    bloom.threadBoost = Math.max(bloom.threadBoost, 0.08);
    bloom.pulseBoost = Math.max(bloom.pulseBoost, 0.12);
    bloom.patternBoost = Math.max(bloom.patternBoost, 0.12);
  }

  _resolveSignatureMomentPalette(bloom = this._signatureBloom) {
    const isHarmonyConvergence = bloom?.family === 'harmony' || bloom?.blueprintId === HARMONY_CONVERGENCE_BLUEPRINT_ID;
    const isMythicSignal = bloom?.family === 'mythic' || bloom?.blueprintId === MYTHIC_SIGNAL_BLUEPRINT_ID;
    const isHeroicStabilization = bloom?.family === 'stability' || bloom?.blueprintId === HEROIC_STABILIZATION_BLUEPRINT_ID;
    if (isMythicSignal) {
      return {
        hero: true,
        core: this._signatureMythicCoreColor,
        aurora: this._signatureMythicAuroraColor,
        cyan: this._signatureMythicCyanColor,
        white: this._signatureMythicWhiteColor,
        deep: this._signatureMythicDeepColor,
      };
    }

    if (isHarmonyConvergence) {
      return {
        hero: true,
        core: this._signatureHarmonyCoreColor,
        aurora: this._signatureHarmonyAuroraColor,
        cyan: this._signatureHarmonyCyanColor,
        white: this._signatureHarmonyWhiteColor,
        deep: this._signatureHarmonyDeepColor,
      };
    }

    if (isHeroicStabilization) {
      return {
        hero: true,
        core: this._signatureStabilityCoreColor,
        aurora: this._signatureStabilityAuroraColor,
        cyan: this._signatureStabilityCyanColor,
        white: this._signatureStabilityWhiteColor,
        deep: this._signatureStabilityDeepColor,
      };
    }

    return {
      hero: false,
      core: this._signatureBloomCoreColor,
      aurora: this._signatureBloomAuroraColor,
      cyan: this._signatureBloomCyanColor,
      white: this._signatureBloomWhiteColor,
      deep: this._signatureBloomDeepColor,
    };
  }

  _updateSignatureBloom(visualDelta) {
    const bloom = this._signatureBloom;
    if (!bloom) return;

    if (bloom.ttl > 0) {
      bloom.ttl = Math.max(0, bloom.ttl - visualDelta);
    }

    const target = bloom.ttl > 0 || bloom.targetIntensity > 0 ? bloom.targetIntensity : 0;
    const lerpFactor = 1 - Math.exp(-Math.max(0.0001, visualDelta) * (target > bloom.intensity ? 4.4 : bloom.phase === 'completed' ? 1.45 : 2.0));
    bloom.intensity = THREE.MathUtils.lerp(bloom.intensity, target, lerpFactor);

    if (!bloom.active && bloom.ttl <= 0 && bloom.intensity <= 0.01) {
      bloom.intensity = 0;
      bloom.targetIntensity = 0;
      bloom.family = null;
      bloom.blueprintId = null;
      bloom.phase = 'NONE';
      bloom.veilBoost = 0;
      bloom.threadBoost = 0;
      bloom.pulseBoost = 0;
      bloom.patternBoost = 0;
      bloom.responsePulse = false;
    }
  }

  _phaseToIntensity(phase) {
    switch (phase) {
      case 'INIT':
        return 0.32;
      case 'RISE':
        return 0.72;
      case 'PEAK':
        return 1.0;
      case 'FALL':
        return 0.46;
      case 'COMPLETED':
      case 'NONE':
      default:
        return 0;
    }
  }

  _getRitualPalette(ritualType, palettePayload = null) {
    const payload = palettePayload || {};
    const fallback = {
      primary: new THREE.Color(0xf7fbff),
      secondary: new THREE.Color(0xb9d9ff),
      accent: new THREE.Color(0xffffff),
      void: new THREE.Color(0x121824)
    };

    const paletteMap = {
      ASCENSION_RITUAL: {
        primary: new THREE.Color(payload.primary ?? 0xffd700),
        secondary: new THREE.Color(payload.secondary ?? 0xfff1a8),
        accent: new THREE.Color(payload.accent ?? 0xf7fbff),
        void: new THREE.Color(payload.void ?? 0x142648)
      },
      QUANTUM_FISSURE: {
        primary: new THREE.Color(payload.primary ?? 0xff4bff),
        secondary: new THREE.Color(payload.secondary ?? 0xc775ff),
        accent: new THREE.Color(payload.accent ?? 0xf7d6ff),
        void: new THREE.Color(payload.void ?? 0x1c0934)
      },
      HARMONY_CONVERGENCE: {
        primary: new THREE.Color(payload.primary ?? 0x00ffaa),
        secondary: new THREE.Color(payload.secondary ?? 0x77f7db),
        accent: new THREE.Color(payload.accent ?? 0xf7fbff),
        void: new THREE.Color(payload.void ?? 0x06263a)
      },
      CHAOS_RITUAL: {
        primary: new THREE.Color(payload.primary ?? 0xff2f7b),
        secondary: new THREE.Color(payload.secondary ?? 0xff73cf),
        accent: new THREE.Color(payload.accent ?? 0xffd1ee),
        void: new THREE.Color(payload.void ?? 0x2b061a)
      },
      MYTHIC_SIGNAL: {
        primary: new THREE.Color(payload.primary ?? 0xf7fbff),
        secondary: new THREE.Color(payload.secondary ?? 0xb9d9ff),
        accent: new THREE.Color(payload.accent ?? 0xffffff),
        void: new THREE.Color(payload.void ?? 0x121824)
      },
      ECHO_RITUAL: {
        primary: new THREE.Color(payload.primary ?? 0x8888ff),
        secondary: new THREE.Color(payload.secondary ?? 0x8fe2ff),
        accent: new THREE.Color(payload.accent ?? 0xe7f1ff),
        void: new THREE.Color(payload.void ?? 0x101d3b)
      }
    };

    return paletteMap[ritualType] || fallback;
  }

  _applyRitualPayload(payload = {}, release = false) {
    const ritualType = payload.ritualType || this.ritualState.ritualType;
    this.ritualState.ritualType = ritualType;
    this.ritualState.phase = payload.phase ?? (release ? 'FALL' : this.ritualState.phase);
    this.ritualState.palette = this._getRitualPalette(ritualType, payload.palette);
    this.ritualState.stamp = performance.now();

    if (payload.anchor && Number.isFinite(payload.anchor.x) && Number.isFinite(payload.anchor.y) && Number.isFinite(payload.anchor.z)) {
      this.ritualState.anchor.set(payload.anchor.x, payload.anchor.y, payload.anchor.z);
    }

    const intensity = Number.isFinite(payload.phaseIntensity)
      ? payload.phaseIntensity
      : this._phaseToIntensity(payload.phase);
    this.ritualState.active = !release;
    this.ritualState.targetIntensity = release ? 0 : intensity;
  }

  _updateRitualState(visualDelta) {
    const alpha = 1 - Math.exp(-Math.max(0.0001, visualDelta) * (this.ritualState.targetIntensity > this.ritualState.intensity ? 3.4 : 1.9));
    this.ritualState.intensity = THREE.MathUtils.lerp(this.ritualState.intensity, this.ritualState.targetIntensity, alpha);

    if (!this.ritualState.active && this.ritualState.intensity <= 0.02) {
      this.ritualState.intensity = 0;
      this.ritualState.targetIntensity = 0;
      this.ritualState.ritualType = null;
      this.ritualState.phase = 'NONE';
    }
  }

  _blendWithRitualColor(baseColor, amount = 0.5) {
    const ritualIntensity = this.ritualState.intensity;
    if (ritualIntensity <= 0.001 || !baseColor) return baseColor.clone();

    const blend = THREE.MathUtils.clamp(amount * ritualIntensity, 0, 1);
    return baseColor.clone()
      .lerp(this.ritualState.palette.primary, blend * 0.72)
      .lerp(this.ritualState.palette.secondary, blend * 0.42);
  }
  
  /**
   * Create or update neural thought thread on a link
   */
  _createNeuralThread(link) {
    if (this.activeThoughts.threadMeshes.has(link.id)) {
      return; // Already exists
    }
    
    if (!link.nodeA || !link.nodeB) return;
    
    // Create flowing thread geometry
    const points = this._generateThreadPath(link);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Soft cyan-white filament with violet pressure at higher tension
    const material = new THREE.LineBasicMaterial({
      color: this._getThreadColor(link),
      linewidth: 2,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    
    const line = new THREE.Line(geometry, material);
    line.name = `NeuralThread_${link.id}`;
    line.userData.linkId = link.id;
    line.userData.link = link;
    line.userData.threadPoints = points;
    
    this.consciousnessGroup.add(line);
    this.activeThoughts.threadMeshes.set(link.id, line);
    this.stats.threadsActive++;
  }
  
  /**
   * Generate smooth Bézier path for thread
   */
  _generateThreadPath(link, reusePoints = null) {
    const posA = link.nodeA.position;
    const posB = link.nodeB.position;
    const distance = posA.distanceTo(posB);
    
    // Dynamic control point offset based on distance and category with Perlin noise
    const offset = Math.min(distance * 0.15, 2.0);
    const categoryInfluence = this._getCategoryInfluence(link.nodeA, link.nodeB);
    const seed = this._hashTo01(`${link.id}:${posA.x},${posA.y},${posA.z}|${posB.x},${posB.y},${posB.z}`);
    const phase = this.time * 0.28;
    
    // Organic noise-based offsets
    const noiseScale = 0.8;
    const noiseX1 = this._perlinNoise(phase * noiseScale + seed * 10, 0, 0);
    const noiseY1 = this._perlinNoise(0, phase * noiseScale + seed * 10, 0);
    const noiseZ1 = this._perlinNoise(0, 0, phase * noiseScale + seed * 10);
    const noiseX2 = this._perlinNoise(phase * noiseScale * 1.2 + seed * 15, seed * 5, 0);
    const noiseY2 = this._perlinNoise(seed * 5, phase * noiseScale * 1.2 + seed * 15, 0);
    const noiseZ2 = this._perlinNoise(0, seed * 5, phase * noiseScale * 1.2 + seed * 15);
    
    this._threadOffset1.set(
      noiseX1 * offset * 0.45,
      noiseY1 * offset * 0.28,
      noiseZ1 * offset * 0.45
    );
    this._threadOffset2.set(
      noiseX2 * offset * categoryInfluence * 0.45,
      noiseY2 * offset * 0.24,
      noiseZ2 * offset * categoryInfluence * 0.45
    );
    
    const controlPoint1 = this._threadControlPoint1.copy(posA).add(this._threadOffset1);
    const controlPoint2 = this._threadControlPoint2.copy(posB).add(this._threadOffset2);
    
    // Generate curve points
    const points = Array.isArray(reusePoints) ? reusePoints : [];
    const segments = Math.max(1, Math.ceil(distance * 2));
    points.length = segments + 1;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Cubic Bézier interpolation
      const p = points[i] || (points[i] = new THREE.Vector3());
      this._cubicBezier(posA, controlPoint1, controlPoint2, posB, t, p);
    }
    
    return points;
  }

  _getLinkSeed(link, posA, posB) {
    const idString = `${link.id}:${posA.x.toFixed(2)},${posA.y.toFixed(2)},${posA.z.toFixed(2)}|${posB.x.toFixed(2)},${posB.y.toFixed(2)},${posB.z.toFixed(2)}`;
    return this._hashTo01(idString);
  }
  
  _hashTo01(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % 1000) / 1000;
  }

  /**
   * Simple Perlin-like noise for organic movement
   */
  _perlinNoise(x, y = 0, z = 0) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    const u = this._fade(x);
    const v = this._fade(y);
    const w = this._fade(z);
    
    const A = this._perm[X] + Y;
    const AA = this._perm[A] + Z;
    const AB = this._perm[A + 1] + Z;
    const B = this._perm[X + 1] + Y;
    const BA = this._perm[B] + Z;
    const BB = this._perm[B + 1] + Z;
    
    return this._lerp(w, 
      this._lerp(v, 
        this._lerp(u, this._grad(this._perm[AA], x, y, z), this._grad(this._perm[BA], x - 1, y, z)),
        this._lerp(u, this._grad(this._perm[AB], x, y - 1, z), this._grad(this._perm[BB], x - 1, y - 1, z))),
      this._lerp(v,
        this._lerp(u, this._grad(this._perm[AA + 1], x, y, z - 1), this._grad(this._perm[BA + 1], x - 1, y, z - 1)),
        this._lerp(u, this._grad(this._perm[AB + 1], x, y - 1, z - 1), this._grad(this._perm[BB + 1], x - 1, y - 1, z - 1)))
    );
  }

  _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  _lerp(t, a, b) {
    return a + t * (b - a);
  }

  _grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // Permutation table for Perlin noise
  _perm = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  
  /**
   * Cubic Bézier interpolation
   */
  _cubicBezier(p0, p1, p2, p3, t, target) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    
    return target.set(
      mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
      mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
      mt2 * mt * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * p2.z + t2 * t * p3.z
    );
  }

  _pulseEnvelope(progress) {
    if (progress <= 0.18) {
      return progress / 0.18;
    }
    if (progress >= 0.82) {
      return (1 - progress) / 0.18;
    }
    return 1.0;
  }

  _pulseMotionProgress(progress) {
    const attack = 0.16;
    const release = 0.2;
    const sustain = 1 - attack - release;
    if (progress <= attack) {
      const t = progress / attack;
      return t * t * 0.18;
    }
    if (progress >= 1 - release) {
      const t = (1 - progress) / release;
      return 1 - t * t * 0.18;
    }
    const t = (progress - attack) / sustain;
    return 0.18 + t * 0.82;
  }
  
  /**
   * Get blend color from node categories
   */
  _getCategoryBlendColor(nodeA, nodeB) {
    const catA = nodeA.userData?.category || 'process';
    const catB = nodeB.userData?.category || 'process';
    
    const palette = {
      voidDeep: 0x05131A,
      atomaCyan: 0x6DEAFF,
      mint: 0x77F7DB,
      ritualWhite: 0xF7FBFF,
      violet: 0xD07BFF,
      rose: 0xFF73CF
    };
    
    const colorMap = {
      input: palette.rose,
      process: palette.atomaCyan,
      integration: palette.mint,
      analytics: palette.violet,
      storage: palette.mint,
      control: palette.ritualWhite,
      mythic: palette.violet,
      prime: palette.atomaCyan,
      error: palette.rose,
      quantum: palette.voidDeep,
      emotional: palette.rose
    };
    
    const colA = new THREE.Color(colorMap[catA] || palette.atomaCyan);
    const colB = new THREE.Color(colorMap[catB] || palette.atomaCyan);
    
    colA.lerp(colB, 0.35);
    return colA;
  }
  
  /**
   * Get category influence multiplier for curve strength
   */
  _getCategoryInfluence(nodeA, nodeB) {
    const catA = nodeA.userData?.category || 'process';
    const catB = nodeB.userData?.category || 'process';
    
    const baseWeights = {
      input: 1.08,
      process: 0.98,
      integration: 1.05,
      analytics: 1.12,
      storage: 0.94,
      control: 1.00,
      mythic: 1.18,
      prime: 1.10,
      error: 1.28,
      quantum: 1.22,
      emotional: 1.14
    };
    
    const complementary = [
      ['process', 'storage'],
      ['analytics', 'control'],
      ['error', 'prime'],
      ['mythic', 'quantum']
    ];
    
    const sameCategory = catA === catB;
    const strongPair = complementary.some(([c1, c2]) =>
      (catA === c1 && catB === c2) || (catA === c2 && catB === c1)
    );
    
    const weightA = baseWeights[catA] || 1.0;
    const weightB = baseWeights[catB] || 1.0;
    const meanWeight = (weightA + weightB) * 0.5;
    
    if (sameCategory) {
      return Math.max(0.88, meanWeight * 0.95);
    }
    if (strongPair) {
      return Math.min(1.35, meanWeight + 0.15);
    }
    
    return Math.max(0.92, meanWeight);
  }

  _getThreadColor(link) {
    const pressure = this._getCategoryInfluence(link.nodeA, link.nodeB);
    const baseBlend = this._getCategoryBlendColor(link.nodeA, link.nodeB);
    const cyanWhite = new THREE.Color(0xD8FFFF).lerp(new THREE.Color(0x6DEAFF), 0.65);
    const color = baseBlend.clone().lerp(cyanWhite, 0.55);
    if (pressure > 1.05) {
      const violetStrength = Math.min(0.35, (pressure - 1.0) * 0.25);
      color.lerp(new THREE.Color(0xD07BFF), violetStrength);
    }
    return color;
  }

  _getLinkSpawnState(link) {
    let state = this.linkSpawnState.get(link.id);
    if (!state) {
      state = {
        lastThread: -Infinity,
        lastPulse: -Infinity,
        lastPattern: -Infinity
      };
      this.linkSpawnState.set(link.id, state);
    }
    return state;
  }

  _hasLinkSemanticValue(link) {
    if (!this.glyphLayer4) return false;
    try {
      const meaning = this.glyphLayer4.getMeaning?.(link.nodeA, link.nodeB);
      return meaning != null;
    } catch (e) {
      return false;
    }
  }

  _computeLinkSpawnMetrics(link) {
    const signal = Math.max(0, Math.min(1, link.trafficIntensity ?? 0.35));
    const stability = Math.max(0, Math.min(1, link.stability ?? link.Stability ?? 0.5));
    const harmony = Math.max(0, Math.min(1, link.harmony ?? 0.5));
    const categoryInfluence = this._getCategoryInfluence(link.nodeA, link.nodeB);
    const semanticValue = this._hasLinkSemanticValue(link) ? 1 : 0.72;
    const recent = 0.65 + signal * 0.35;
    const baseStrength = (0.24 + signal * 0.46 + categoryInfluence * 0.18 + semanticValue * 0.12) * this.config.intensity;
    const ritualBoost = 1 + this.ritualState.intensity * 0.38;
    const ritualPatternBias = 1 + this.ritualState.intensity * 0.62;
    const state = this.consciousnessState || {};
    const healthBias = 0.72 + this._clamp01(state.networkHealth ?? 0.5) * 0.48;
    const pressureBias = 1 - this._clamp01(state.networkPressure ?? 0) * 0.22;
    const trafficBias = 0.78 + this._clamp01(state.trafficIntensity ?? signal) * 0.45;
    const patternBias = 0.84 + this._clamp01(state.patternDensity ?? 0) * 0.56;
    const heroBias = 0.84 + this._clamp01(state.heroIntensity ?? 0.5) * 0.52;

    return {
      signal,
      stability,
      harmony,
      categoryInfluence,
      semanticValue,
      threadProb: Math.min(0.5, (0.12 + baseStrength * 0.18 + signal * 0.07) * ritualBoost * healthBias * heroBias),
      pulseWeight: Math.max(0.01, baseStrength * (0.5 + signal * 0.32 + categoryInfluence * 0.15) * this.config.particleDensity * ritualBoost * trafficBias * pressureBias),
      patternProb: Math.min(0.28, (0.04 + baseStrength * 0.14 + semanticValue * 0.08) * ritualPatternBias * patternBias * heroBias)
    };
  }

  _pickWeightedLink(candidates, excludeSet) {
    const pool = candidates.filter(item => !excludeSet.has(item.link.id));
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    if (total <= 0) return null;
    let threshold = Math.random() * total;
    for (const entry of pool) {
      threshold -= entry.weight;
      if (threshold <= 0) return entry.link;
    }
    return pool[pool.length - 1]?.link || null;
  }

  /**
   * Spawn cognitive pulse packet on link
   */
  _spawnPulsePacket(link) {
    if (!this.config.enabled) return;
    if (!link || !link.nodeA || !link.nodeB) return;

    const pulse = this.particlePools.pulsePackets.find(p => !p.active);
    if (!pulse) {
      return; // Pool is full, keep the system bounded
    }

    pulse.link = link;
    pulse.linkId = link.id;
    pulse.startPos.copy(link.nodeA.position);
    pulse.endPos.copy(link.nodeB.position);
    pulse.position.copy(pulse.startPos);
    pulse.progress = 0;
    pulse.age = 0;
    pulse.active = true;

    const categoryPressure = this._getCategoryInfluence(link.nodeA, link.nodeB);
    pulse.duration = 0.8 + Math.min(0.6, (categoryPressure - 0.9) * 0.8);
    pulse.life = 1.0;

    const stability = Math.max(0, Math.min(1, link.stability ?? 0.5));
    const harmony = Math.max(0, Math.min(1, link.harmony ?? 0.5));
    pulse.speedVariation = 0.8 + Math.random() * 0.4;
    pulse.speed = this.config.pulseSpeed * (0.65 + stability * 0.3 + harmony * 0.2 + this.config.intensity * 0.25) * pulse.speedVariation;
    pulse.category = stability > 0.6 ? 'corrupted' : 'stable';

    pulse.colorA.copy(this._getCategoryBlendColor(link.nodeA, link.nodeB));
    pulse.colorB.copy(this._getCategoryBlendColor(link.nodeB, link.nodeA));
    const harmonyTint = new THREE.Color(0x77F7DB).lerp(new THREE.Color(0x6DEAFF), harmony);
    const stabilityTint = new THREE.Color(0xF7FBFF).lerp(new THREE.Color(0x05131A), 1 - stability);
    pulse.color.copy(pulse.colorA).lerp(harmonyTint, 0.32).lerp(stabilityTint, 0.14);
    if (stability > 0.6) {
      pulse.color.lerp(new THREE.Color(0xD07BFF), 0.18);
    }
    pulse.colorA.lerp(harmonyTint, 0.32).lerp(stabilityTint, 0.14);
    pulse.colorB.lerp(harmonyTint, 0.32).lerp(stabilityTint, 0.14);
    if (stability > 0.6) {
      pulse.colorA.lerp(new THREE.Color(0xD07BFF), 0.18);
      pulse.colorB.lerp(new THREE.Color(0xD07BFF), 0.18);
    }

    if (!this.activeThoughts.pulsePackets.includes(pulse)) {
      this.activeThoughts.pulsePackets.push(pulse);
      this.stats.pulsesActive++;
    }
  }
  
  /**
   * Create semantic thought pattern cluster above link
   */
  _createSemanticPattern(link) {
    if (this.activeThoughts.patternClusters.has(link.id)) {
      return; // Already exists
    }
    
    // Extract meaning from glyph layer if available
    let meaning = null;
    if (this.glyphLayer4) {
      try {
        meaning = this.glyphLayer4.getMeaning?.(link.nodeA, link.nodeB) || null;
      } catch (e) {
        meaning = null;
      }
    }
    
    const clusterPos = link.nodeA.position.clone().lerp(link.nodeB.position, 0.5);
    clusterPos.y += 1.5; // Offset above link
    
    const grammar = this._selectSemanticPatternGrammar(link, meaning);
    const patternType = grammar.type;
    const meaningColor = this._parseGlyphMeaningColor(meaning) || this._getCategoryBlendColor(link.nodeA, link.nodeB);
    const geometryColor = this._blendWithRitualColor(meaningColor.clone(), 0.46);
    const seed = this._hashTo01(`${link.id}-pattern`);
    const count = 6 + (grammar.countBonus || 0);
    const radius = (0.55 + seed * 0.28) * (grammar.radiusMul || 1);
    const glyphMaterial = this._createSemanticGlyphMaterial(geometryColor);
    const haloMaterial = new THREE.LineBasicMaterial({
      color: geometryColor,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    const particles = [];

    const createShell = (scale = 1.0) => {
      const shell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius * 0.68 * scale, 1),
        glyphMaterial
      );
      shell.position.copy(clusterPos);
      shell.userData.isSemanticParticle = true;
      shell.userData.basePos = clusterPos.clone();
      shell.userData.angle = 0;
      shell.userData.radius = radius * scale;
      particles.push(shell);
      this.consciousnessGroup.add(shell);
    };

    const createOrbit = (orbitRadius, segmentCount = 64, opacity = 0.28) => {
      const ringPoints = [];
      for (let i = 0; i <= segmentCount; i++) {
        const t = (i / segmentCount) * Math.PI * 2;
        ringPoints.push(Math.cos(t) * orbitRadius, 0, Math.sin(t) * orbitRadius);
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const orbit = new THREE.LineLoop(geometry, haloMaterial.clone());
      orbit.position.copy(clusterPos);
      orbit.material.opacity = opacity;
      orbit.userData.isSemanticParticle = true;
      orbit.userData.basePos = clusterPos.clone();
      orbit.userData.angle = 0;
      orbit.userData.radius = orbitRadius;
      particles.push(orbit);
      this.consciousnessGroup.add(orbit);
    };

    const patternBuilders = {
      ring: () => {
        createOrbit(radius * 1.02, 56, 0.26);
        createShell(0.84);
      },
      halo: () => {
        createOrbit(radius * 1.18, 72, 0.22);
        createShell(0.74);
      },
      choir: () => {
        createOrbit(radius * 1.12, 68, 0.18);
        createShell(0.78);
      },
      mandala: () => {
        createOrbit(radius * 1.16, 72, 0.24);
        createShell(0.72);
      },
      memory: () => {
        createOrbit(radius * 0.88, 48, 0.16);
        createOrbit(radius * 1.04, 48, 0.12);
        createShell(0.66);
      },
      crown: () => createShell(1.02),
      seal: () => createShell(0.96),
      spire: () => createShell(1.08),
      shard: () => createShell(0.88),
      fracture: () => createShell(0.94),
      wound: () => createShell(0.96),
      cluster: () => createShell(1.0)
    };

    const builder = patternBuilders[patternType] || patternBuilders.cluster;
    builder();
    for (const particle of particles) {
      particle.userData.baseColor = particle.material?.color?.clone?.() || geometryColor.clone();
    }

    this.activeThoughts.patternClusters.set(link.id, {
      particles,
      life: grammar.life || 3.0,
      maxLife: grammar.life || 3.0,
      meaning,
      basePos: clusterPos.clone(),
      type: patternType,
      signature: grammar.signature || patternType
    });

    this.stats.patternsActive++;
  }

  _selectSemanticPatternGrammar(link, meaning) {
    const key = `${link.id}:${typeof meaning === 'string' ? meaning : JSON.stringify(meaning)}:${this.ritualState.ritualType || 'ambient'}`;
    const seed = this._hashTo01(key);
    const base = [
      { type: 'ring', weight: 1.0, life: 3.0, radiusMul: 1.0, thicknessMul: 1.0, countBonus: 0, signature: 'ambient-ring' },
      { type: 'crown', weight: 0.9, life: 3.1, radiusMul: 1.0, thicknessMul: 0.92, countBonus: 0, signature: 'ambient-crown' },
      { type: 'seal', weight: 0.82, life: 3.0, radiusMul: 0.94, thicknessMul: 1.0, countBonus: 0, signature: 'ambient-seal' },
      { type: 'halo', weight: 0.78, life: 3.2, radiusMul: 1.08, thicknessMul: 0.86, countBonus: 0, signature: 'ambient-halo' },
      { type: 'shard', weight: 0.92, life: 2.8, radiusMul: 1.0, thicknessMul: 0.88, countBonus: 0, signature: 'ambient-shard' },
      { type: 'cluster', weight: 1.1, life: 3.0, radiusMul: 0.9, thicknessMul: 0.84, countBonus: 1, signature: 'ambient-cluster' }
    ];

    const ritualGrammar = {
      ASCENSION_RITUAL: [
        { type: 'spire', weight: 1.5, life: 4.2, radiusMul: 1.1, thicknessMul: 0.84, countBonus: 1, signature: 'ascension-spire' },
        { type: 'halo', weight: 1.05, life: 3.8, radiusMul: 1.22, thicknessMul: 0.78, countBonus: 0, signature: 'ascension-halo' },
        { type: 'crown', weight: 0.95, life: 3.7, radiusMul: 1.06, thicknessMul: 0.84, countBonus: 1, signature: 'ascension-crown' }
      ],
      QUANTUM_FISSURE: [
        { type: 'fracture', weight: 1.45, life: 4.0, radiusMul: 0.82, thicknessMul: 0.7, countBonus: 1, signature: 'fissure-fracture' },
        { type: 'wound', weight: 1.1, life: 3.6, radiusMul: 0.94, thicknessMul: 0.78, countBonus: 0, signature: 'fissure-wound' },
        { type: 'shard', weight: 0.9, life: 3.2, radiusMul: 1.0, thicknessMul: 0.8, countBonus: 1, signature: 'fissure-shard' }
      ],
      HARMONY_CONVERGENCE: [
        { type: 'choir', weight: 1.4, life: 4.3, radiusMul: 1.16, thicknessMul: 0.74, countBonus: 2, signature: 'harmony-choir' },
        { type: 'mandala', weight: 1.12, life: 4.0, radiusMul: 1.12, thicknessMul: 0.7, countBonus: 2, signature: 'harmony-mandala' },
        { type: 'halo', weight: 0.9, life: 3.6, radiusMul: 1.18, thicknessMul: 0.76, countBonus: 0, signature: 'harmony-halo' }
      ],
      CHAOS_RITUAL: [
        { type: 'wound', weight: 1.5, life: 3.9, radiusMul: 0.96, thicknessMul: 0.82, countBonus: 1, signature: 'chaos-wound' },
        { type: 'fracture', weight: 1.08, life: 3.5, radiusMul: 0.88, thicknessMul: 0.72, countBonus: 1, signature: 'chaos-fracture' },
        { type: 'shard', weight: 0.94, life: 3.2, radiusMul: 1.0, thicknessMul: 0.86, countBonus: 1, signature: 'chaos-shard' }
      ],
      MYTHIC_SIGNAL: [
        { type: 'mandala', weight: 1.48, life: 4.5, radiusMul: 1.18, thicknessMul: 0.66, countBonus: 2, signature: 'signal-mandala' },
        { type: 'seal', weight: 1.0, life: 3.9, radiusMul: 1.02, thicknessMul: 0.82, countBonus: 1, signature: 'signal-seal' },
        { type: 'choir', weight: 0.92, life: 3.8, radiusMul: 1.06, thicknessMul: 0.72, countBonus: 1, signature: 'signal-choir' }
      ],
      ECHO_RITUAL: [
        { type: 'memory', weight: 1.52, life: 4.4, radiusMul: 1.2, thicknessMul: 0.68, countBonus: 0, signature: 'echo-memory' },
        { type: 'halo', weight: 0.96, life: 3.7, radiusMul: 1.14, thicknessMul: 0.72, countBonus: 0, signature: 'echo-halo' },
        { type: 'seal', weight: 0.84, life: 3.5, radiusMul: 0.94, thicknessMul: 0.84, countBonus: 0, signature: 'echo-seal' }
      ]
    };

    const options = ritualGrammar[this.ritualState.ritualType] || base;
    const totalWeight = options.reduce((sum, item) => sum + item.weight, 0);
    let threshold = seed * totalWeight;

    for (const option of options) {
      threshold -= option.weight;
      if (threshold <= 0) return option;
    }

    return options[options.length - 1];
  }

  _parseGlyphMeaningColor(meaning) {
    if (!meaning) return null;
    try {
      return new THREE.Color(meaning);
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Update frame - called from main.js animation loop
   */
  update(dt) {
    // dt is intentionally ignored: timing follows the canonical VisualTime source.
    if (!this.config.enabled) return;
    
    // FrameScheduler gate
    if (this.frameScheduler && typeof this.frameScheduler.shouldRunVisual === 'function') {
      if (!this.frameScheduler.shouldRunVisual()) return;
    }

    const startTime = performance.now();
    
    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now;
    }
    const currentTime = VisualTime.now - this._timeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
    const visualDelta = this._lastVisualTime === undefined
      ? 0
      : Math.max(0, currentTime - this._lastVisualTime);
    this._lastVisualTime = currentTime;
    this.time = currentTime;
    this._updateRitualState(visualDelta);
    this._updateSignatureBloom(visualDelta);
    
    // 1. Update neural threads
    this._updateThreads();
    
    // 2. Update pulse packets
    this._updatePulses(visualDelta);
    
    // 3. Update semantic patterns
    this._updatePatterns(visualDelta);
    
    // 4. Update global field
    this._updateGlobalField(visualDelta);
    
    // 5. Spawn new thoughts on active links
    this._spawnNewThoughts();
    
    // 6. Update thought storms (if enabled)
    if (this.config.stormsEnabled && this.storms) {
      const stormStart = performance.now();
      this.storms.update(visualDelta);
      this.stats.stormsFrameTime = performance.now() - stormStart;
    }
    
    const frameTime = performance.now() - startTime;
    this.stats.frameTime = frameTime;
  }
  
  /**
   * Update all neural threads
   */
  _updateThreads() {
    const bloom = this._signatureBloom || {};
    const bloomIntensity = this._clamp01(bloom.intensity || 0);
    const palette = this._resolveSignatureMomentPalette(bloom);
    const bloomThreadLift = bloomIntensity * (palette.hero ? 0.24 + (bloom.threadBoost || 0) * 0.62 : 0.16 + (bloom.threadBoost || 0) * 0.5);

    for (const [linkId, line] of this.activeThoughts.threadMeshes) {
      const link = line.userData.link;
      
      // Skip if link is invalid
      if (!link || !link.nodeA || !link.nodeB) {
        this.consciousnessGroup.remove(line);
        line.geometry.dispose();
        line.material.dispose();
        this.activeThoughts.threadMeshes.delete(linkId);
        this.stats.threadsActive--;
        continue;
      }
      
      // Animate opacity based on link intensity with a soft breathing envelope
      const activity = (link.trafficIntensity || 0.3);
      const categoryPressure = this._getCategoryInfluence(link.nodeA, link.nodeB);
      const intensity = this.config.intensity;
      const baseOpacity = 0.18 + activity * 0.25 * intensity + (categoryPressure - 0.9) * 0.12 * intensity;
      const breath = Math.sin(this.time * 1.3) * 0.03 * intensity;
      
      // Handle flash effect from passing pulses
      let flashAdd = 0;
      if (line.userData.flashIntensity > 0) {
        flashAdd = line.userData.flashIntensity * 0.6;
        line.userData.flashIntensity = Math.max(0, line.userData.flashIntensity - (line.userData.flashDecay || 0.1));
      }
      
      line.material.opacity = Math.min(0.92, Math.max(0.12, baseOpacity + breath + flashAdd + bloomThreadLift));
      line.material.color.copy(this._blendWithRitualColor(this._getThreadColor(link), 0.42));
      if (bloomIntensity > 0) {
        line.material.color.lerp(palette.core, bloomIntensity * 0.34);
        line.material.color.lerp(palette.white, bloomIntensity * 0.08);
      }
      
      // Regenerate geometry only when necessary, with a stable interval and more nuance for active links
      const lastUpdate = line.userData.lastThreadUpdate || 0;
      const interval = Math.max(0.08, 0.42 - activity * 0.14 - intensity * 0.04);
      if (this.time - lastUpdate > interval) {
        const points = this._generateThreadPath(link, line.userData.threadPoints);
        line.userData.threadPoints = points;
        line.geometry.setFromPoints(points);
        line.userData.lastThreadUpdate = this.time;
      }
    }
  }
  
  /**
   * Update all pulse packets
   */
  _updatePulses(visualDelta) {
    if (!this.pulsePointCloud || !this._pulsePointAttributes) return;

    const bloom = this._signatureBloom || {};
    const bloomIntensity = this._clamp01(bloom.intensity || 0);
    const palette = this._resolveSignatureMomentPalette(bloom);
    const bloomPulseLift = bloomIntensity * (palette.hero ? 1.72 + (bloom.pulseBoost || 0) * 4.4 : 1.4 + (bloom.pulseBoost || 0) * 4.0);

    const positions = this._pulsePointAttributes.positions;
    const colors = this._pulsePointAttributes.colors;
    const scales = this._pulsePointAttributes.scales;
    const opacities = this._pulsePointAttributes.opacities;

    for (let i = this.activeThoughts.pulsePackets.length - 1; i >= 0; i--) {
      const pulse = this.activeThoughts.pulsePackets[i];
      if (!pulse.active || !pulse.link) {
        this.activeThoughts.pulsePackets.splice(i, 1);
        pulse.active = false;
        this._setPulsePointAttributes(pulse.index, pulse.position, new THREE.Color(0x000000), 0.0, 0.0, positions, colors, scales, opacities);
        this.stats.pulsesActive--;
        continue;
      }

      pulse.age += visualDelta;
      pulse.progress += pulse.speed * visualDelta;
      pulse.life = Math.max(0, 1 - pulse.age / pulse.duration);

      const progressNorm = Math.min(1, pulse.progress);
      const motionProgress = this._pulseMotionProgress(progressNorm);
      const envelope = this._pulseEnvelope(progressNorm);

      if (progressNorm >= 1 || pulse.life <= 0) {
        pulse.active = false;
        this.activeThoughts.pulsePackets.splice(i, 1);
        this.stats.pulsesActive--;
        this._setPulsePointAttributes(pulse.index, pulse.position, new THREE.Color(0x000000), 0.0, 0.0, positions, colors, scales, opacities);
        continue;
      }

      pulse.position.lerpVectors(pulse.startPos, pulse.endPos, motionProgress);
      const gradientT = progressNorm;
      const pulseColor = pulse.colorA.clone().lerp(pulse.colorB, gradientT);
      const ritualPulseColor = this._blendWithRitualColor(pulseColor, 0.52);
      const stability = Math.max(0, Math.min(1, pulse.link?.stability ?? 0.5));
      let scaleBase = 6.0 + envelope * 9.0 + stability * 2.0 + this.config.intensity * 3.2 + this.ritualState.intensity * 2.4 + bloomPulseLift;
      if (progressNorm >= 0.92) {
        const burstFactor = (progressNorm - 0.92) / 0.08;
        scaleBase += burstFactor * 10.0;
      }

      const opacity = Math.min(0.96, 0.08 + pulse.life * envelope * 0.88 * this.config.intensity + this.ritualState.intensity * 0.12 + bloomIntensity * 0.12);
      const bloomPulseColor = bloomIntensity > 0
        ? ritualPulseColor.clone().lerp(palette.aurora, bloomIntensity * 0.42).lerp(palette.white, bloomIntensity * 0.1)
        : ritualPulseColor;
      this._setPulsePointAttributes(pulse.index, pulse.position, bloomPulseColor, scaleBase, opacity, positions, colors, scales, opacities);

      if (Math.random() < 0.08) {
        const thread = this.activeThoughts.threadMeshes.get(pulse.link.id);
        if (thread) {
          thread.userData.flashIntensity = 0.8;
          thread.userData.flashDecay = 0.15;
        }
      }
    }

    this.pulsePointCloud.geometry.attributes.position.needsUpdate = true;
    this.pulsePointCloud.geometry.attributes.color.needsUpdate = true;
    this.pulsePointCloud.geometry.attributes.aScale.needsUpdate = true;
    this.pulsePointCloud.geometry.attributes.aOpacity.needsUpdate = true;
  }
  
  /**
   * Update semantic pattern clusters
   */
  _updatePatterns(visualDelta) {
    const bloom = this._signatureBloom || {};
    const bloomIntensity = this._clamp01(bloom.intensity || 0);
    const palette = this._resolveSignatureMomentPalette(bloom);
    const bloomPatternLift = bloomIntensity * (palette.hero ? 0.1 + (bloom.patternBoost || 0) * 0.26 : 0.06 + (bloom.patternBoost || 0) * 0.22);

    for (const [linkId, pattern] of this.activeThoughts.patternClusters) {
      pattern.life -= visualDelta;
      
      if (pattern.life <= 0) {
        // Remove pattern
        for (const mesh of pattern.particles) {
          this.consciousnessGroup.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();
        }
        this.activeThoughts.patternClusters.delete(linkId);
        this.stats.patternsActive--;
        continue;
      }
      
      const lifeNorm = Math.max(0, Math.min(1, pattern.life / (pattern.maxLife || 3.0)));
      const phase = this.time * 1.2 + this._hashTo01(`${linkId}-${pattern.type}`) * Math.PI * 2;
      const buildFactor = 1 - Math.pow(lifeNorm, 1.8);
      const fadeFactor = Math.max(0.08, lifeNorm * this.config.intensity + bloomPatternLift);
      const rotationSpeed = 1.0 + (1 - lifeNorm) * 0.6 + this.config.intensity * 0.2;
      const baseAlpha = 0.14 + fadeFactor * 0.48;
      const ritualAlpha = this.ritualState.intensity * 0.14;
      
      for (const particle of pattern.particles) {
        const basePos = particle.userData.basePos;
        const angle = (particle.userData.angle || 0) + phase * (particle.userData.radius ? 0.6 : 0.2);
        const radius = (particle.userData.radius || 0.4) * (0.7 + buildFactor * 0.24);
        
        switch (pattern.type) {
          case 'ring':
          case 'halo':
            particle.position.x = basePos.x + Math.cos(angle) * radius;
            particle.position.y = basePos.y + Math.sin(phase) * 0.08 + buildFactor * 0.08;
            particle.position.z = basePos.z + Math.sin(angle) * radius;
            particle.rotation.z = phase * 0.35;
            break;
          case 'seal':
            particle.position.x = basePos.x;
            particle.position.y = basePos.y + Math.sin(phase) * 0.06 + buildFactor * 0.04;
            particle.position.z = basePos.z;
            particle.rotation.z = phase * 0.45;
            break;
          case 'crown':
            particle.position.x = basePos.x + Math.cos(angle) * radius;
            particle.position.y = basePos.y + 0.1 + Math.sin(angle * 2 + phase) * 0.03 + buildFactor * 0.04;
            particle.position.z = basePos.z + Math.sin(angle) * radius;
            particle.rotation.x = phase * 0.25;
            break;
          case 'shard':
            particle.position.x = basePos.x + Math.cos(angle) * radius;
            particle.position.y = basePos.y + Math.sin(angle * 1.4 + phase) * 0.05 + buildFactor * 0.03;
            particle.position.z = basePos.z + Math.sin(angle) * radius;
            particle.rotation.y = angle + phase * 0.18;
            break;
          case 'cluster':
          default:
            particle.position.x = basePos.x + Math.cos(angle) * radius * 0.7;
            particle.position.y = basePos.y + Math.sin(angle * 1.3 + phase) * 0.08 + buildFactor * 0.05;
            particle.position.z = basePos.z + Math.sin(angle) * radius * 0.7;
            particle.rotation.x = phase * 0.22;
            particle.rotation.y = phase * 0.28;
            break;
          case 'spire':
            particle.position.x = basePos.x + Math.cos(angle) * radius * 0.34;
            particle.position.y = basePos.y + 0.14 + buildFactor * 0.18 + Math.abs(Math.sin(phase + angle)) * 0.14;
            particle.position.z = basePos.z + Math.sin(angle) * radius * 0.34;
            particle.rotation.y = angle;
            particle.rotation.x = Math.sin(phase * 0.5 + angle) * 0.18;
            break;
          case 'fracture':
            particle.position.x = basePos.x + Math.cos(angle) * radius * 0.18 + Math.sin(phase * 1.8 + angle) * 0.1;
            particle.position.y = basePos.y + Math.sin(angle * 2 + phase * 1.2) * 0.08;
            particle.position.z = basePos.z + Math.sin(angle) * radius * 0.18;
            particle.rotation.y = angle + Math.sin(phase * 1.4 + angle) * 0.24;
            particle.rotation.z += visualDelta * rotationSpeed * 0.4;
            break;
          case 'choir':
            particle.position.x = basePos.x + Math.cos(angle + phase * 0.24) * radius;
            particle.position.y = basePos.y + Math.sin(angle * 1.7 + phase) * 0.12 + buildFactor * 0.06;
            particle.position.z = basePos.z + Math.sin(angle + phase * 0.24) * radius * 0.82;
            particle.rotation.x = phase * 0.24;
            particle.rotation.y = phase * 0.18 + angle;
            break;
          case 'wound':
            particle.position.x = basePos.x + Math.cos(angle) * radius * 0.26 + Math.sin(phase * 2.3 + angle) * 0.12;
            particle.position.y = basePos.y + Math.sin(phase * 1.8 + angle * 2.0) * 0.12;
            particle.position.z = basePos.z + Math.sin(angle) * radius * 0.26;
            particle.rotation.y = angle + phase * 0.42;
            particle.rotation.x = Math.sin(phase + angle) * 0.48;
            break;
          case 'mandala':
            particle.position.x = basePos.x + Math.cos(angle) * radius * 0.1;
            particle.position.y = basePos.y + Math.sin(phase * 0.8 + angle) * 0.04;
            particle.position.z = basePos.z + Math.sin(angle) * radius * 0.1;
            particle.rotation.y = angle + phase * 0.2;
            particle.rotation.z += visualDelta * (rotationSpeed * 0.3 + 0.08);
            break;
          case 'memory':
            particle.position.x = basePos.x;
            particle.position.y = basePos.y + Math.sin(phase * 0.7 + angle) * 0.08 + buildFactor * 0.04;
            particle.position.z = basePos.z;
            particle.rotation.z = phase * 0.26 + angle;
            particle.scale.setScalar(0.82 + buildFactor * 0.28 + (1 - lifeNorm) * 0.18);
            break;
        }
        
        const ritualDip = Math.sin(phase * 0.6) * 0.02;
        particle.position.y += ritualDip;
        
        particle.material.opacity = Math.min(0.9, baseAlpha * fadeFactor * (0.78 + Math.sin(phase * 0.9) * 0.06) + ritualAlpha + bloomIntensity * 0.08);
        const patternBaseColor = particle.userData.baseColor || particle.material.color;
        particle.material.color.copy(this._blendWithRitualColor(patternBaseColor, 0.58));
        if (bloomIntensity > 0) {
          particle.material.color.lerp(palette.aurora, bloomIntensity * 0.34);
          particle.material.color.lerp(palette.white, bloomIntensity * 0.08);
        }
        particle.position.y += this.ritualState.intensity * 0.04 * Math.sin(phase + angle * 2.0);
        const scaleBoost = pattern.type === 'memory'
          ? 0.18
          : pattern.type === 'mandala'
            ? 0.12
            : pattern.type === 'spire'
              ? 0.1
              : 0;
        particle.scale.setScalar(0.7 + buildFactor * 0.24 + this.config.intensity * 0.08 + scaleBoost + bloomIntensity * 0.08);
      }
    }
  }
  
  /**
   * Update global consciousness field
   */
  _updateGlobalField(visualDelta) {
    if (!this.globalFieldMesh) return;

    const bloom = this._signatureBloom || {};
    const bloomIntensity = this._clamp01(bloom.intensity || 0);
    const palette = this._resolveSignatureMomentPalette(bloom);

    const links = this.linkingSystem?.links || [];
    let avgStability = 0;
    let avgHarmony = 0;
    let avgCorruption = 0;
    let avgLoadPressure = 0;
    let avgTrafficIntensity = 0;
    let activeCount = 0;

    for (const link of links) {
      const stability = link.stability ?? link.Stability ?? 0;
      const harmony = link.harmony ?? 0.5;
      const corruption = link.corruption ?? link.corruptionLevel ?? 0;
      const loadPressure = link.loadPressure ?? link.pressure ?? 0;
      const intensity = link.trafficIntensity ?? 0.3;

      avgStability += stability;
      avgHarmony += harmony;
      avgCorruption += corruption;
      avgLoadPressure += loadPressure;
      avgTrafficIntensity += intensity;
      if (intensity > 0.55) activeCount++;
    }

    const linkCount = Math.max(1, links.length);
    avgStability /= linkCount;
    avgHarmony /= linkCount;
    avgCorruption /= linkCount;
    avgLoadPressure /= linkCount;
    avgTrafficIntensity /= linkCount;

    const consciousnessState = this._updateConsciousnessState({
      visualDelta,
      linkCount: links.length,
      activeLinkCount: activeCount,
      patternCount: this.activeThoughts.patternClusters.size,
      avgStability,
      avgHarmony,
      avgCorruption,
      avgLoadPressure,
      avgTrafficIntensity,
      ritualIntensity: this.ritualState.intensity,
    });

    const networkMood = this._clamp01(consciousnessState.networkHealth * 0.6 + consciousnessState.coherence * 0.4);
    const pressure = consciousnessState.networkPressure;
    const corruptionBias = Math.min(1, avgCorruption * 1.2);
    const pulsePhase = Math.sin(this.time * 0.72 + pressure * Math.PI * 1.5);
    const ritualIntensity = this.ritualState.intensity;
    const monumentScale = 1 + avgStability * 0.1 * this.config.intensity + pressure * 0.07 + ritualIntensity * 0.1 + consciousnessState.heroIntensity * 0.08 + bloomIntensity * (palette.hero ? 0.18 : 0.14);
    const pulseScale = 1 + pulsePhase * 0.04 * (0.45 + networkMood * 0.45 + consciousnessState.trafficIntensity * 0.15) * this.config.intensity + bloomIntensity * (palette.hero ? 0.06 : 0.04);
    const shellOpacity = Math.min(0.22, (0.01 + avgStability * 0.01 + pressure * 0.012 + consciousnessState.patternDensity * 0.01) * this.config.intensity + Math.abs(pulsePhase) * 0.006 * this.config.intensity + ritualIntensity * 0.04 + consciousnessState.heroIntensity * 0.02 + bloomIntensity * (palette.hero ? 0.05 : 0.03));

    // Keep the global field from appearing as a broken LOD artifact when the
    // player is inside/near the origin shell.
    let fieldDistanceFade = 1;
    const playerPos = this.aiNodes?.player?.position;
    if (playerPos) {
      this.globalFieldMesh.getWorldPosition(this._globalFieldWorldPos);
      const distanceToField = playerPos.distanceTo(this._globalFieldWorldPos);
      const inner = this.config.globalFieldScale * 0.95;
      const outer = this.config.globalFieldScale * 1.85;
      fieldDistanceFade = THREE.MathUtils.smoothstep(distanceToField, inner, outer);
    }

    this.globalFieldMesh.scale.setScalar(monumentScale * pulseScale);
    if (this.globalFieldEdge) {
      this.globalFieldEdge.scale.setScalar(monumentScale * (1.05 + ritualIntensity * 0.05 + consciousnessState.heroIntensity * 0.04));
    }

    const calm = new THREE.Color(0x6DEAFF);
    const ritual = new THREE.Color(0xF7FBFF);
    const storm = new THREE.Color(0xD07BFF);
    const corrosion = new THREE.Color(0xFF73CF);

    const moodColor = ritual.clone().lerp(calm, networkMood);
    const tint = moodColor.clone().lerp(storm, corruptionBias * 0.4).lerp(corrosion, pressure * 0.2);
    const fieldColor = this._blendWithRitualColor(tint, 0.62);
    if (bloomIntensity > 0) {
      fieldColor.lerp(palette.core, bloomIntensity * 0.42);
      fieldColor.lerp(palette.white, bloomIntensity * 0.12);
    }
    const edgeTint = this._blendWithRitualColor(
      tint.clone().lerp(new THREE.Color(0x05131A), 1 - networkMood * 0.5),
      0.82
    );
    if (bloomIntensity > 0) {
      edgeTint.lerp(palette.cyan, bloomIntensity * 0.24);
      edgeTint.lerp(palette.aurora, bloomIntensity * 0.18);
    }
    const shellMaterial = this.globalFieldMesh.material;
    if (shellMaterial && shellMaterial.uniforms) {
      shellMaterial.uniforms.uTime.value = this.time;
      shellMaterial.uniforms.uIntensity.value = shellOpacity * fieldDistanceFade;
      shellMaterial.uniforms.uRitualBlend.value = ritualIntensity;
      shellMaterial.uniforms.uBaseColor.value.copy(fieldColor);
      shellMaterial.uniforms.uRitualColor.value.copy(this.ritualState.palette.secondary);
    } else if (shellMaterial) {
      shellMaterial.color.copy(fieldColor);
      shellMaterial.opacity = shellOpacity * fieldDistanceFade;
    }

    if (this.globalFieldEdge) {
      this.globalFieldEdge.material.color.copy(edgeTint);
      this.globalFieldEdge.material.opacity = Math.min(0.16, 0.08 + pressure * 0.05 + Math.abs(pulsePhase) * 0.02 + ritualIntensity * 0.09) * fieldDistanceFade;
    }

    if (this.globalFieldChoir) {
      const choirColor = this._blendWithRitualColor(
        tint.clone().lerp(new THREE.Color(0xf7fbff), networkMood * 0.34),
        0.74
      );
      if (bloomIntensity > 0) {
        choirColor.lerp(palette.aurora, bloomIntensity * 0.34);
        choirColor.lerp(palette.white, bloomIntensity * 0.08);
      }
      this.globalFieldChoir.material.color.copy(choirColor);
      this.globalFieldChoir.material.opacity = Math.min(
        0.16,
        0.04 + networkMood * 0.05 + pressure * 0.04 + ritualIntensity * 0.08 + Math.abs(pulsePhase) * 0.018 + consciousnessState.patternDensity * 0.04 + bloomIntensity * 0.08
      ) * fieldDistanceFade;
      this.globalFieldChoir.rotation.y += visualDelta * (0.04 + networkMood * 0.06 + ritualIntensity * 0.18 + consciousnessState.heroIntensity * 0.04 + bloomIntensity * 0.08);
      this.globalFieldChoir.rotation.x = Math.sin(this.time * 0.14 + pressure) * 0.12 * (0.4 + ritualIntensity + consciousnessState.patternDensity * 0.5 + bloomIntensity * 0.36);
      const choirScale = monumentScale * (0.98 + networkMood * 0.04 + ritualIntensity * 0.08 + consciousnessState.heroIntensity * 0.05 + bloomIntensity * 0.08);
      this.globalFieldChoir.scale.setScalar(choirScale);
    }

    if (this.ritualFieldVeil) {
      const veilColor = bloomIntensity > 0 ? palette.aurora : this.ritualState.palette.secondary;
      this.ritualFieldVeil.material.color.copy(veilColor);
      this.ritualFieldVeil.material.opacity = Math.min(0.3, ritualIntensity * (0.05 + pressure * 0.04) + Math.abs(pulsePhase) * 0.015 * ritualIntensity + bloomIntensity * (palette.hero ? 0.16 : 0.12)) * fieldDistanceFade;
      this.ritualFieldVeil.scale.setScalar(monumentScale * (0.94 + ritualIntensity * 0.18 + Math.abs(pulsePhase) * 0.03 + bloomIntensity * (palette.hero ? 0.16 : 0.12)));
      this.ritualFieldVeil.rotation.y += visualDelta * (0.05 + ritualIntensity * 0.18 + bloomIntensity * (palette.hero ? 0.14 : 0.12));
      this.ritualFieldVeil.rotation.x = Math.sin(this.time * 0.12 + ritualIntensity) * 0.18 * (ritualIntensity + bloomIntensity * 0.55);
      this.ritualFieldVeil.rotation.z += visualDelta * (0.02 + ritualIntensity * 0.08 + bloomIntensity * (palette.hero ? 0.08 : 0.06));
    }

    if (this.ritualFieldWitness && this._ritualWitnessBasePositions) {
      const anchorDir = this.ritualState.anchor.lengthSq() > 0.0001
        ? this.ritualState.anchor.clone().normalize()
        : new THREE.Vector3(0, 1, 0);
      const positions = this.ritualFieldWitness.geometry.attributes.position.array;
      const base = this._ritualWitnessBasePositions;
      for (let i = 0; i < positions.length; i += 3) {
        const bx = base[i];
        const by = base[i + 1];
        const bz = base[i + 2];
        const length = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
        const nx = bx / length;
        const ny = by / length;
        const nz = bz / length;
        const resonance = Math.max(0, nx * anchorDir.x + ny * anchorDir.y + nz * anchorDir.z);
        const swell = 1 + ritualIntensity * (0.05 + resonance * 0.18);
        const shimmer = Math.sin(this.time * 1.4 + i * 0.11) * 0.22 * ritualIntensity;

        positions[i] = bx * swell + anchorDir.x * shimmer;
        positions[i + 1] = by * swell + anchorDir.y * shimmer;
        positions[i + 2] = bz * swell + anchorDir.z * shimmer;
      }
      this.ritualFieldWitness.geometry.attributes.position.needsUpdate = true;
      const witnessColor = bloomIntensity > 0 ? palette.white : this.ritualState.palette.accent;
      this.ritualFieldWitness.material.color.copy(witnessColor);
      this.ritualFieldWitness.material.opacity = Math.min(0.6, ritualIntensity * 0.3 + pressure * 0.05 + consciousnessState.heroIntensity * 0.08 + bloomIntensity * (palette.hero ? 0.18 : 0.14)) * fieldDistanceFade;
      this.ritualFieldWitness.material.size = 0.22 + ritualIntensity * 0.22 + consciousnessState.patternDensity * 0.05 + bloomIntensity * (palette.hero ? 0.1 : 0.08);
    }

    const fieldVisible = fieldDistanceFade > 0.02;
    this.globalFieldMesh.visible = fieldVisible;
    if (this.globalFieldEdge) this.globalFieldEdge.visible = fieldVisible;
    if (this.globalFieldChoir) this.globalFieldChoir.visible = fieldVisible;
    if (this.ritualFieldVeil) this.ritualFieldVeil.visible = fieldVisible;
    if (this.ritualFieldWitness) this.ritualFieldWitness.visible = fieldVisible;
  }
  
  /**
   * Spawn new thoughts on active links
   */
  _spawnNewThoughts() {
    // STRICT GUARD: Skip if no valid linking system
    if (!this.linkingSystem || !this.linkingSystem.links || this.linkingSystem.links.length === 0) {
      return;
    }

    const links = this.linkingSystem.links.filter(link => link && link.nodeA && link.nodeB);
    const metrics = links.map(link => ({
      link,
      metrics: this._computeLinkSpawnMetrics(link)
    }));

    const state = this.consciousnessState || {};
    const bloom = this._signatureBloom || {};
    const bloomIntensity = this._clamp01(bloom.intensity || 0);
    const ritualBudgetBoost = 1 + this.ritualState.intensity * 0.6;
    const threadBudget = Math.max(1, Math.ceil(this.config.intensity * 1.1 * ritualBudgetBoost * (0.82 + this._clamp01(state.networkHealth ?? 0.5) * 0.42 + this._clamp01(state.heroIntensity ?? 0.5) * 0.28 + bloomIntensity * 0.24)));
    const threadSelection = metrics
      .filter(({link, metrics: metric}) => !this.activeThoughts.threadMeshes.has(link.id))
      .map(({link, metrics: metric}) => ({link, weight: metric.threadProb}));

    const usedThread = new Set();
    for (let i = 0; i < threadBudget; i++) {
      const chosen = this._pickWeightedLink(threadSelection, usedThread);
      if (!chosen) break;
      const spawnState = this._getLinkSpawnState(chosen);
      const threadGap = Math.max(0.38, 1.4 - this.config.intensity * 0.8 - this._clamp01(state.heroIntensity ?? 0.5) * 0.24 - bloomIntensity * 0.18);
      if (this.time - spawnState.lastThread >= threadGap) {
        this._createNeuralThread(chosen);
        spawnState.lastThread = this.time;
      }
      usedThread.add(chosen.id);
    }

    const pulseBudget = Math.max(1, Math.ceil(this.config.particleDensity * (2 + this.ritualState.intensity * 1.6 + this._clamp01(state.trafficIntensity ?? 0) * 1.2 + this._clamp01(state.heroIntensity ?? 0.5) * 0.4 + bloomIntensity * 0.9)));
    const pulseSelection = [];
    for (const {link, metrics: metric} of metrics) {
      pulseSelection.push({link, weight: metric.pulseWeight});
    }

    const usedPulse = new Set();
    for (let i = 0; i < pulseBudget; i++) {
      const chosen = this._pickWeightedLink(pulseSelection, usedPulse);
      if (!chosen) break;
      const spawnState = this._getLinkSpawnState(chosen);
      const pulseGap = Math.max(0.34, 1.1 - this.config.particleDensity * 0.6 - this.config.intensity * 0.2 - this._clamp01(state.trafficIntensity ?? 0) * 0.18 - bloomIntensity * 0.16);
      if (this.time - spawnState.lastPulse >= pulseGap) {
        this._spawnPulsePacket(chosen);
        spawnState.lastPulse = this.time;
      }
      usedPulse.add(chosen.id);
    }

    const patternBudget = Math.max(0, Math.floor(this.config.particleDensity * (0.45 + this.ritualState.intensity * 0.85 + this._clamp01(state.patternDensity ?? 0) * 1.5 + this._clamp01(state.heroIntensity ?? 0.5) * 0.2 + bloomIntensity * 0.7)));
    const patternSelection = metrics
      .filter(({link, metrics: metric}) => !this.activeThoughts.patternClusters.has(link.id))
      .map(({link, metrics: metric}) => ({link, weight: metric.patternProb}));

    const usedPattern = new Set();
    for (let i = 0; i < patternBudget; i++) {
      const chosen = this._pickWeightedLink(patternSelection, usedPattern);
      if (!chosen) break;
      const spawnState = this._getLinkSpawnState(chosen);
      const patternGap = Math.max(0.9, 2.8 - this.config.intensity * 0.9 - this._clamp01(state.patternDensity ?? 0) * 0.5 - bloomIntensity * 0.2);
      if (this.time - spawnState.lastPattern >= patternGap) {
        this._createSemanticPattern(chosen);
        spawnState.lastPattern = this.time;
      }
      usedPattern.add(chosen.id);
    }
  }
  
  /**
   * PUBLIC API - Toggle consciousness layer
   */
  enable() {
    this.config.enabled = true;
    this.stats.enabled = true;
    if (this.globalFieldMesh) this.globalFieldMesh.visible = true;
    if (this.globalFieldEdge) this.globalFieldEdge.visible = true;

    for (const mesh of this.activeThoughts.threadMeshes.values()) {
      mesh.visible = true;
    }
    if (this.pulsePointCloud) this.pulsePointCloud.visible = true;
    for (const pattern of this.activeThoughts.patternClusters.values()) {
      for (const mesh of pattern.particles) {
        mesh.visible = true;
      }
    }

    if (this.storms && this.config.stormsEnabled) {
      this.storms.enable();
    }
  }
  
  disable() {
    this.config.enabled = false;
    this.stats.enabled = false;
    if (this.globalFieldMesh) this.globalFieldMesh.visible = false;
    if (this.globalFieldEdge) this.globalFieldEdge.visible = false;

    for (const mesh of this.activeThoughts.threadMeshes.values()) {
      mesh.visible = false;
    }
    if (this.pulsePointCloud) this.pulsePointCloud.visible = false;
    for (const pulse of this.particlePools.pulsePackets) {
      pulse.active = false;
    }
    for (const pattern of this.activeThoughts.patternClusters.values()) {
      for (const mesh of pattern.particles) {
        mesh.visible = false;
      }
    }

    if (this.storms) {
      this.storms.disable();
    }

    this._releaseSignatureBloom();
  }
  
  /**
   * PUBLIC API - Set overall intensity
   */
  setIntensity(value) {
    this.config.intensity = Math.max(0, Math.min(1, value));
    if (this.storms) {
      this.storms.setIntensity(Math.max(0.65, 0.75 + this.config.intensity * 0.5));
    }
  }
  
  /**
   * PUBLIC API - Set particle density
   */
  setParticleDensity(value) {
    this.config.particleDensity = Math.max(0, Math.min(1, value));
    if (this.storms) {
      this.storms.config.particleMultiplier = 0.9 + this.config.particleDensity * 0.4;
    }
  }
  
  /**
   * PUBLIC API - Debug status
   */
  debug() {
    const fieldVisible = this.globalFieldMesh?.visible ? 'ON' : 'OFF';
    const edgeVisible = this.globalFieldEdge?.visible ? 'edge ON' : 'edge OFF';
    const fieldOpacity = this.globalFieldMesh?.material?.opacity?.toFixed(3) ?? 'n/a';
    const fieldScale = this.globalFieldMesh?.scale?.x?.toFixed(2) ?? 'n/a';
    const stormsLoaded = !!this.storms;
    const stormActive = this.storms?.stormState?.activeStorm || 'none';
    const stormMood = this.storms?.stormState?.currentMood || 'n/a';
    const state = this.consciousnessState || {};
    const bloom = this._signatureBloom || {};

    console.log('%c=== AI CONSCIOUSNESS LAYER 2.0 DEBUG ===', 'color: #00ffff; font-weight: bold;');
    console.log(`Status: ${this.config.enabled ? '🟢 ENABLED' : '🔴 DISABLED'} | Intensity: ${this.config.intensity.toFixed(2)} | Density: ${this.config.particleDensity.toFixed(2)}`);
    console.log(`Mood: ${state.networkMood || 'CALM'} | Hero Phase: ${state.heroPhase || 'LISTENING'} | Health: ${(state.networkHealth ?? 0).toFixed(2)} | Traffic: ${(state.trafficIntensity ?? 0).toFixed(2)} | Ritual: ${(state.ritualIntensity ?? 0).toFixed(2)} | Patterns: ${(state.patternDensity ?? 0).toFixed(2)}`);
    console.log(`Bloom: ${bloom.phase || 'NONE'} | family=${bloom.family || 'NONE'} | intensity=${(bloom.intensity ?? 0).toFixed(2)} | ttl=${(bloom.ttl ?? 0).toFixed(2)}s`);
    console.log(`Threads: ${this.stats.threadsActive} | Pulses: ${this.stats.pulsesActive} | Patterns: ${this.stats.patternsActive}`);
    console.log(`Global Field: ${fieldVisible} (${edgeVisible}) | opacity=${fieldOpacity} | scale=${fieldScale}`);
    console.log(`Storms: ${this.config.stormsEnabled ? 'ENABLED' : 'DISABLED'} | loaded=${stormsLoaded} | active=${stormActive} | mood=${stormMood}`);
    if (this.stats.stormsFrameTime > 0) {
      console.log(`Storms Frame Time: ${this.stats.stormsFrameTime.toFixed(3)}ms`);
    }
    console.log(`Frame Time: ${this.stats.frameTime.toFixed(3)}ms | Pool: ${this.particlePools.pulsePackets.length} pulses`);
  }
  
  /**
   * PUBLIC API - Toggle storms
   */
  enableStorms() {
    this.config.stormsEnabled = true;
    if (this.storms) {
      this.storms.config.enabled = true;
      this.storms.setIntensity(Math.max(0.6, this.storms.config.intensity));
      this.storms.enable();
    }
  }
  
  disableStorms() {
    this.config.stormsEnabled = false;
    if (this.storms) {
      this.storms.disable();
    }
  }
  
  /**
   * CLEANUP - Safe disposal of all resources
   */
  dispose() {
    // Remove storms first
    if (this.storms) {
      this.storms.dispose();
      this.storms = null;
    }

    this._disposeSignatureMomentBridge();
    this._disposeRitualBridge();
    this._releaseSignatureBloom();
    
    // Remove threads
    for (const [linkId, line] of this.activeThoughts.threadMeshes) {
      this.consciousnessGroup.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    }
    this.activeThoughts.threadMeshes.clear();
    
    // Remove pulses
    for (const pulse of this.particlePools.pulsePackets) {
      pulse.active = false;
      pulse.link = null;
      pulse.linkId = null;
      pulse.trailPositions = [];
    }
    if (this.pulsePointCloud) {
      this.consciousnessGroup.remove(this.pulsePointCloud);
      this.pulsePointCloud.geometry.dispose();
      this.pulsePointCloud.material.dispose();
      this.pulsePointCloud = null;
      this._pulsePointAttributes = null;
    }
    this.activeThoughts.pulsePackets = [];
    
    // Remove patterns
    for (const [linkId, pattern] of this.activeThoughts.patternClusters) {
      for (const mesh of pattern.particles) {
        this.consciousnessGroup.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    }
    this.activeThoughts.patternClusters.clear();
    this.linkSpawnState.clear();
    
    // Remove global field shell and edge halo
    if (this.globalFieldMesh) {
      this.consciousnessGroup.remove(this.globalFieldMesh);
      this.globalFieldMesh.geometry.dispose();
      this.globalFieldMesh.material.dispose();
    }
    if (this.globalFieldEdge) {
      this.consciousnessGroup.remove(this.globalFieldEdge);
      this.globalFieldEdge.geometry.dispose();
      this.globalFieldEdge.material.dispose();
      this.globalFieldEdge = null;
    }
    if (this.globalFieldChoir) {
      this.consciousnessGroup.remove(this.globalFieldChoir);
      this.globalFieldChoir.geometry.dispose();
      this.globalFieldChoir.material.dispose();
      this.globalFieldChoir = null;
    }
    if (this.ritualFieldVeil) {
      this.consciousnessGroup.remove(this.ritualFieldVeil);
      this.ritualFieldVeil.geometry.dispose();
      this.ritualFieldVeil.material.dispose();
      this.ritualFieldVeil = null;
    }
    if (this.ritualFieldWitness) {
      this.consciousnessGroup.remove(this.ritualFieldWitness);
      this.ritualFieldWitness.geometry.dispose();
      this.ritualFieldWitness.material.dispose();
      this.ritualFieldWitness = null;
    }
    
    // Remove container
    this.scene.remove(this.consciousnessGroup);
    
    if (this.debugMode) {
      console.log('AIConsciousnessLayer 2.0 disposed ✓');
    }
  }
}

/**
 * Console API Setup - Call from main.js
 */
export function setupAIConsciousnessConsoleAPI(consciousnessLayer) {
  window.conscious = {
    debug: () => consciousnessLayer.debug(),
    enable: () => {
      consciousnessLayer.enable();
      if (consciousnessLayer.debugMode) {
        console.log('🟢 AI Consciousness Layer ENABLED');
      }
    },
    disable: () => {
      consciousnessLayer.disable();
      if (consciousnessLayer.debugMode) {
        console.log('🔴 AI Consciousness Layer DISABLED');
      }
    },
    setIntensity: (value) => {
      consciousnessLayer.setIntensity(value);
      if (consciousnessLayer.debugMode) {
        console.log(`Consciousness Intensity: ${value.toFixed(2)}`);
      }
    },
    setParticleDensity: (value) => {
      consciousnessLayer.setParticleDensity(value);
      if (consciousnessLayer.debugMode) {
        console.log(`Particle Density: ${value.toFixed(2)}`);
      }
    },
    enableStorms: () => {
      consciousnessLayer.enableStorms();
      if (consciousnessLayer.debugMode) {
        console.log('🌩️ Thought Storms ENABLED');
      }
    },
    disableStorms: () => {
      consciousnessLayer.disableStorms();
      if (consciousnessLayer.debugMode) {
        console.log('⛈️ Thought Storms DISABLED');
      }
    },
    status: () => {
      if (!consciousnessLayer.debugMode) return;
      console.log('%c--- AI CONSCIOUSNESS 2.0 STATUS ---', 'color: #00ffff');
      console.log(`Enabled: ${consciousnessLayer.config.enabled}`);
      const state = consciousnessLayer.getConsciousnessState?.() || {};
      console.log(`Mood: ${state.networkMood || 'CALM'} | Hero Phase: ${state.heroPhase || 'LISTENING'}`);
      console.log(`Health: ${(state.networkHealth ?? 0).toFixed(2)} | Traffic: ${(state.trafficIntensity ?? 0).toFixed(2)} | Ritual: ${(state.ritualIntensity ?? 0).toFixed(2)} | Patterns: ${(state.patternDensity ?? 0).toFixed(2)}`);
      console.log(`Bloom: ${state.signatureBloomPhase || 'NONE'} | family=${state.signatureBloomFamily || 'NONE'} | intensity=${(state.signatureBloomIntensity ?? 0).toFixed(2)}`);
      console.log(`Threads: ${consciousnessLayer.stats.threadsActive}`);
      console.log(`Pulses: ${consciousnessLayer.stats.pulsesActive}`);
      console.log(`Patterns: ${consciousnessLayer.stats.patternsActive}`);
      console.log(`Storms: ${consciousnessLayer.config.stormsEnabled ? '🌩️ ON' : '⛈️ OFF'}`);
      console.log(`Frame Time: ${consciousnessLayer.stats.frameTime.toFixed(3)}ms`);
      if (consciousnessLayer.stats.stormsFrameTime > 0) {
        console.log(`Storms Frame Time: ${consciousnessLayer.stats.stormsFrameTime.toFixed(3)}ms`);
      }
    }
  };
  
  if (consciousnessLayer.debugMode) {
    console.log('%c✓ conscious API ready (v2.0 with Emergent Storms)', 'color: #00ff00; font-weight: bold;');
    console.log('Commands: conscious.enable(), disable(), setIntensity(0-1), setParticleDensity(0-1), enableStorms(), disableStorms(), debug(), status()');
  }
}
