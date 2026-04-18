/**
 * PERSONALITY-DRIVEN WORLD EVENTS 2.0 (SAFE EDITION)
 * 
 * Makes the world visually react to the global emotional/metric state of the node network.
 * Analyzes the collective personality and metrics of all nodes to determine a "global mood"
 * and applies atmospheric visual effects accordingly.
 * 
 * HARD SAFETY RULES:
 * - NO modifications to player movement, camera, physics, linking, input
 * - World events are purely visual + ambient
 * - All effects layered on top of existing world (non-destructive)
 * - GPU-friendly and reversible
 * - Graceful degradation on missing data
 * 
 * FEATURES:
 * 1. GLOBAL STATE ANALYZER
 *    - Scans nodes every 5-10s (throttled)
 *    - Computes aggregate metrics (harmony, stability, loadPressure)
 *    - Derives global mood label (7 mood types)
 *    - Emits world.mood snapshot/change events plus bridge metric tags
 * 
 * 2. WORLD EVENT TYPES
 *    - HARMONIC_CALM: Warm sky, gentle light shafts
 *    - FOCUSED_ANALYSIS: Crisp contrast, data particles
 *    - RADIANT_STORM: Pulsing arcs, load-pressure surges
 *    - QUANTUM_CHAOS: Nebula patterns, distortion waves
 *    - UMBRA_PRESSURE: Dark fog, shadow bands
 *    - ECHO_DRIFT: Horizontal streaks, memory winds
 *    - ASCENDED_ALIGNMENT: Aurora, pillars of light
 * 
 * 3. EVENT TRIGGERING
 *    - State machine with smooth transitions
 *    - Min duration 20-40s per event
 *    - Smooth crossfades between moods
 * 
 * 4. LOCALIZED REACTIONS
 *    - Cluster detection for local effects
 *    - Harmony clusters get light blooms
 *    - Chaos clusters get shimmer effects
 * 
 * 5. HUD FEEDBACK
 *    - Non-intrusive mood display
 *    - Fade in/out transitions
 */

import * as THREE from 'three';
import { normalizeEnvironmentGeometry } from './RoundedEnvironmentGeometry.js';
import { createSoftPointSpriteTexture } from './SoftPointSpriteTexture.js';
import { buildScopedMetricEventName } from './src/metrics/MetricTierClassifier.js';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';

export class WorldPersonalityController {
  constructor(scene, worldRoot, camera, renderer) {
    this.scene = scene;
    this.worldRoot = worldRoot || scene;
    this.camera = camera;
    this.renderer = renderer;
    this._pointSpriteTexture = null;
    this.atomaPalette = ['#05131A', '#6DEAFF', '#77F7DB', '#F7FBFF', '#D07BFF', '#FF73CF'];
    this.moodVisualPresets = {
      HARMONIC_CALM: {
        backgroundStart: 0x05131A,
        backgroundEnd: 0xF7FBFF,
        backgroundMix: { attack: 0.15, crest: 0.35 },
        backgroundLerp: 0.03,
        fogColor: null,
        palette: ['#05131A', '#6DEAFF', '#77F7DB', '#F7FBFF'],
        primaryOverlay: 'harmonic_shafts',
        spawnThreshold: 0.35,
        overlayColor: 0xF7FBFF,
        overlaySize: 1.2,
        overlayOpacity: 0.22,
      },
      FOCUSED_ANALYSIS: {
        backgroundStart: 0x05131A,
        backgroundEnd: 0x6DEAFF,
        backgroundMix: { attack: 0.15, crest: 0.35 },
        backgroundLerp: 0.05,
        fogColor: null,
        palette: ['#05131A', '#6DEAFF', '#77F7DB'],
        primaryOverlay: 'data_particles',
        spawnThreshold: 0.45,
        overlayColor: 0x77F7DB,
        overlaySize: 0.3,
        overlayOpacity: 0.35,
      },
      RADIANT_STORM: {
        backgroundStart: 0x05131A,
        backgroundEnd: 0xD07BFF,
        backgroundMix: { attack: 0.2, crest: 0.5 },
        backgroundLerp: 0.05,
        fogColor: null,
        palette: ['#05131A', '#D07BFF', '#FF73CF'],
        primaryOverlay: 'energy_arcs',
        spawnThreshold: 0.45,
        overlayColor: 0xD07BFF,
        overlayOpacity: 0.35,
      },
      QUANTUM_CHAOS: {
        backgroundStart: 0x05131A,
        backgroundEnd: 0xD07BFF,
        backgroundMix: { attack: 0.2, crest: 0.4 },
        backgroundLerp: 0.05,
        fogColor: null,
        palette: ['#05131A', '#D07BFF', '#FF73CF'],
        primaryOverlay: 'chaos_nebula',
        spawnThreshold: 0.45,
        overlayColor: 0x7333ff,
        overlayOpacity: 0.38,
      },
      UMBRA_PRESSURE: {
        backgroundStart: 0x05131A,
        backgroundEnd: 0x220022,
        backgroundMix: { attack: 0.25, crest: 0.45 },
        backgroundLerp: 0.04,
        fogColor: 0x05060b,
        palette: ['#05131A', '#220022', '#6DEAFF'],
        primaryOverlay: 'shadow_bands',
        spawnThreshold: 0.4,
        overlayColor: 0x05060b,
        overlayOpacity: 0.45,
      },
      ECHO_DRIFT: {
        backgroundStart: 0x05131A,
        backgroundEnd: 0x6DEAFF,
        backgroundMix: { attack: 0.15, crest: 0.3 },
        backgroundLerp: 0.04,
        fogColor: null,
        palette: ['#05131A', '#6DEAFF', '#77F7DB'],
        primaryOverlay: 'memory_streaks',
        spawnThreshold: 0.4,
        overlayColor: 0x77F7DB,
        overlaySize: 1.8,
        overlayOpacity: 0.3,
      },
      ASCENDED_ALIGNMENT: {
        backgroundStart: 0x05131A,
        backgroundEnd: 0x77F7DB,
        backgroundMix: { attack: 0.2, crest: 0.4 },
        backgroundLerp: 0.04,
        fogColor: null,
        palette: ['#05131A', '#77F7DB', '#F7FBFF'],
        primaryOverlay: 'light_pillars',
        spawnThreshold: 0.4,
        overlayColor: 0x77F7DB,
        overlayOpacity: 0.32,
      },
      NEUTRAL: {
        backgroundStart: 0x05131A,
        backgroundEnd: 0x05131A,
        backgroundMix: { attack: 0, crest: 0 },
        backgroundLerp: 0,
        fogColor: null,
        palette: this.atomaPalette,
        primaryOverlay: 'harmonic_shafts',
        spawnThreshold: 1,
        overlayColor: 0xF7FBFF,
        overlaySize: 1.2,
        overlayOpacity: 0,
      },
    };
    this.root = new THREE.Group();
    this.worldRoot.add(this.root);
    
    // Global network mood state
    this.worldMood = {
      label: 'NEUTRAL',
      intensity: 0.0,
      dominantPersonality: null,
      avgHarmony: 0,
      avgStability: 0,
      avgEnergy: 0,
      visualContext: {
        core: 0.25,
        surface: 0.25,
        overlay: 0.25,
        atmosphere: 0.25,
        dominantSignature: 'neutral_balance',
        tags: ['neutral', 'base'],
        description: 'Balanced default stack',
        palette: this.atomaPalette,
        visualTone: {
          palette: this.atomaPalette,
          primary: '#6DEAFF',
          secondary: '#77F7DB',
          accent: '#FF73CF',
          highlight: '#F7FBFF',
          base: '#05131A',
          label: 'ATOMA_PALETTE_LOCK',
        },
      },
    };
    
    // Previous mood for transition tracking
    this.previousMoodLabel = 'NEUTRAL';
    this.activeMoodLabel = 'NEUTRAL';
    this.semanticBus = null;
    
    // Timing control
    this.lastScanTime = 0;
    this.scanInterval = 7.0; // Scan every 7 seconds
    this.lastMoodChangeTime = 0;
    this.minMoodDuration = 25.0; // Min 25s per mood
    
    // Transition state
    this.transitionProgress = 0;
    this.transitionDuration = 5.0; // 5s crossfade
    this.isTransitioning = false;
    
    // World event visuals
    this.activeEventVisuals = new Map();
    
    // Localized cluster tracking
    this.personalityClusters = [];
    this.lastClusterCheck = 0;
    this.clusterCheckInterval = 10.0; // Check every 10s
    
    // Phase B pilot: low-frequency interpretation gating (separate meaning from visuals)
    this.interpretationInterval = 0.25; // ~4 Hz cadence for mood evaluation
    this.interpretationAccumulator = 0;
    
    // HUD element
    this.hudElement = null;
    this.hudVisible = false;
    this.hudFadeProgress = 0;
    this.currentMoodLabel = null;
    this.currentMoodIntensity = null;
    
    // Performance tracking
    this.performanceMode = 'normal';
    
    // Base world state (to restore on cleanup)
    this.baseWorldState = {
      fogColor: null,
      fogNear: null,
      fogDensity: null,
      backgroundColor: null,
    };
    
    this.initializeHUD();
    this.captureBaseWorldState();
    // Dramaturgy modulation — driven by EventDramaturgyEngine
    this._dramaturgyModulation = {
      active: false,
      family: null,
      phase: null,
      intensity: 0,
      ttl: 0
    };
    
    console.log('✓ World Personality Controller 2.0 initialized');
  }

  // ---------------------------------------------------------------------------
  // Dramaturgy Modulation — World Personality Coupling
  // ---------------------------------------------------------------------------

  /**
   * Receive dramaturgy state from EventDramaturgyEngine.
   * Maps event families × phases → world mood labels.
   *
   * Mapping:
   *   corruption telegraph  → UMBRA_PRESSURE     (anxious, dark fog)
   *   corruption escalation → QUANTUM_CHAOS       (dark surge, distortion)
   *   corruption payoff     → HARMONIC_CALM       (relief, warm sky)
   *   resonance telegraph   → FOCUSED_ANALYSIS    (focused, crisp)
   *   resonance escalation  → ASCENDED_ALIGNMENT  (euphoric, aurora)
   *   resonance payoff      → HARMONIC_CALM       (serene)
   *   ritual telegraph      → ECHO_DRIFT          (anticipation, streaks)
   *   ritual escalation     → ASCENDED_ALIGNMENT  (transcendent, pillars)
   *   ritual payoff         → HARMONIC_CALM       (serene)
   *   hazard telegraph      → UMBRA_PRESSURE      (ominous)
   *   hazard escalation     → RADIANT_STORM       (defensive, arcs)
   *   hazard payoff         → HARMONIC_CALM       (relief)
   *   cascade telegraph     → ECHO_DRIFT          (anticipation)
   *   cascade escalation    → RADIANT_STORM       (intense, surging)
   *   cascade payoff        → HARMONIC_CALM       (relief)
   */
  setDramaturgyModulation(state) {
    if (!state || !state.dominantFamily) return;
    this._dramaturgyModulation.active = true;
    this._dramaturgyModulation.family = state.dominantFamily;
    this._dramaturgyModulation.phase = state.dominantPhase || 'telegraph';
    this._dramaturgyModulation.intensity = state.dominantIntensity || 0;
    this._dramaturgyModulation.ttl = 3.0;
  }

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

  /**
   * Get dramaturgy mood override. Returns a mood label or null.
   */
  _getDramaturgyMoodOverride() {
    const mod = this._dramaturgyModulation;
    if (!mod.active || mod.ttl <= 0) return null;

    const MOOD_MAP = {
      corruption: { telegraph: 'UMBRA_PRESSURE', escalation: 'QUANTUM_CHAOS', payoff: 'HARMONIC_CALM' },
      resonance:  { telegraph: 'FOCUSED_ANALYSIS', escalation: 'ASCENDED_ALIGNMENT', payoff: 'HARMONIC_CALM' },
      ritual:     { telegraph: 'ECHO_DRIFT', escalation: 'ASCENDED_ALIGNMENT', payoff: 'HARMONIC_CALM' },
      hazard:     { telegraph: 'UMBRA_PRESSURE', escalation: 'RADIANT_STORM', payoff: 'HARMONIC_CALM' },
      cascade:    { telegraph: 'ECHO_DRIFT', escalation: 'RADIANT_STORM', payoff: 'HARMONIC_CALM' }
    };

    return MOOD_MAP[mod.family]?.[mod.phase] || null;
  }

  tagFXMaterial(material) {
    if (!material) return;
    material.userData = material.userData || {};
    material.userData.__owner = material.userData.__owner || 'WorldPersonalityController';
    material.userData.__domain = material.userData.__domain || 'overlay';
  }

  blockBaseMaterialMutation(material, context) {
    if (!material) return false;
    if (material.userData?.__domain === 'base') {
      console.warn('[WPC] Attempted base material mutation blocked', context, material.uuid);
      return true;
    }
    return false;
  }
  
  /**
   * Capture base world state for restoration
   */
  captureBaseWorldState() {
    if (this.scene.fog) {
      this.baseWorldState.fogColor = this.scene.fog.color.clone();
      if (this.scene.fog.near !== undefined) {
        this.baseWorldState.fogNear = this.scene.fog.near;
        this.baseWorldState.fogFar = this.scene.fog.far;
      }
      if (this.scene.fog.density !== undefined) {
        this.baseWorldState.fogDensity = this.scene.fog.density;
      }
    }
    
    if (this.scene.background) {
      this.baseWorldState.backgroundColor = this.scene.background.clone();
    }
  }
  
  /**
   * Initialize HUD display
   */
  initializeHUD() {
    // Mood display is now merged into the category legend HUD.
    this.hudElement = null;
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, nodes, worldMetrics = null) {
    if (!nodes || nodes.length === 0) return;

    this._decayDramaturgyModulation(deltaTime);

    const globalMetrics = this._resolveGlobalMetrics(worldMetrics);
    
    // Phase B pilot: low-frequency interpretation gating
    // Only the semantic evaluation (mood scanning + aggregation) is throttled; visuals stay 60 Hz.
    this.interpretationAccumulator += deltaTime;
    if (this.interpretationAccumulator >= this.interpretationInterval) {
      const interpretationDelta = this.interpretationAccumulator;
      this.interpretationAccumulator = 0;
      
      // Scan network for mood (throttled)
      this.lastScanTime += interpretationDelta;
      if (this.lastScanTime >= this.scanInterval) {
        this.scanNetworkMood(nodes, globalMetrics);
        this.lastScanTime = 0;
      }
      
      // Update cluster detection (less frequent)
      this.lastClusterCheck += interpretationDelta;
      if (this.lastClusterCheck >= this.clusterCheckInterval) {
        this.detectPersonalityClusters(nodes);
        this.lastClusterCheck = 0;
      }
    }
    
    // Update transition progress
    if (this.isTransitioning) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      if (this.transitionProgress >= 1.0) {
        this.transitionProgress = 1.0;
        this.isTransitioning = false;
      }
    }
    
    // Apply world event effects
    this.applyWorldEventEffects(deltaTime);
    
    // Update localized cluster effects
    this.updateClusterEffects(deltaTime);
    
    // Update HUD
    this.updateHUD(deltaTime);
  }
  
  /**
   * Scan all nodes and compute global network mood
   */
  scanNetworkMood(nodes, worldMetrics = null) {
    const globalMetrics = this._resolveGlobalMetrics(worldMetrics);
    const personalityCount = {};
    let avgHarmony = null;
    let avgStability = null;
    let avgEnergy = null;
    let nodeCount = nodes.length;
    
    if (this._hasGlobalMetrics(globalMetrics)) {
      avgHarmony = this._toPercent(globalMetrics.harmonyFlow ?? globalMetrics.networkSynergy ?? globalMetrics.harmony ?? globalMetrics.synergy ?? 0);
      avgStability = this._toPercent(
        this._normalizeStability(globalMetrics.networkStress, globalMetrics.stability)
      );
      avgEnergy = this._toPercent(globalMetrics.loadPressure ?? globalMetrics.load ?? globalMetrics.loadRatio ?? 0);
    }
    
    nodes.forEach(node => {
      const personality = node.userData?.personality;
      if (personality?.type) {
        personalityCount[personality.type] = (personalityCount[personality.type] || 0) + 1;
      }
    });
    
    if (avgHarmony === null || avgStability === null || avgEnergy === null) {
      let totalHarmony = 0;
      let totalStability = 0;
      let totalEnergy = 0;
      let validNodeCount = 0;
      
      nodes.forEach(node => {
        const metrics = node.userData?.metrics;
        const personality = node.userData?.personality;
        
        if (metrics) {
          const harmonyValue = metrics.harmonyAffinity ?? metrics.harmony ?? metrics.synergy ?? 0;
          totalHarmony += harmonyValue;
          totalStability += metrics.stability || 0;
          totalEnergy += metrics.loadPressure ?? metrics.load ?? metrics.loadRatio ?? 0;
          validNodeCount++;
        }
        
        if (personality?.type) {
          personalityCount[personality.type] = (personalityCount[personality.type] || 0) + 1;
        }
      });
      
      if (validNodeCount === 0) return;
      avgHarmony = totalHarmony / validNodeCount;
      avgStability = totalStability / validNodeCount;
      avgEnergy = totalEnergy / validNodeCount;
      nodeCount = validNodeCount;
    }
    
    // Find dominant personality
    let dominantPersonality = null;
    let maxCount = 0;
    Object.keys(personalityCount).forEach(type => {
      if (personalityCount[type] > maxCount) {
        maxCount = personalityCount[type];
        dominantPersonality = type;
      }
    });
    
    // Determine mood label based on metrics
    const previousMoodLabel = this.worldMood.label;
    const newMoodLabel = this.determineMoodLabel(
      avgHarmony,
      avgStability,
      avgEnergy,
      personalityCount
    );

    // Calculate mood intensity (0-1)
    const intensity = this.calculateMoodIntensity(
      avgHarmony,
      avgStability,
      avgEnergy
    );
    
    // Resolve actual active mood with hysteresis.
    const timeSinceLastChange = Date.now() / 1000 - this.lastMoodChangeTime;
    const resolvedMoodLabel = this.resolveMoodWithHysteresis(
      this.activeMoodLabel,
      newMoodLabel,
      { avgHarmony, avgStability, avgEnergy },
      timeSinceLastChange
    );

    const moodChanged = resolvedMoodLabel !== this.activeMoodLabel;
    const visualContext = this.getMoodLayerStack(resolvedMoodLabel, intensity);

    this.worldMood = {
      label: resolvedMoodLabel,
      intensity,
      dominantPersonality,
      avgHarmony,
      avgStability,
      avgEnergy,
      visualContext,
    };

    // Dramaturgy override — bypass normal mood determination and min duration
    const dramMood = this._getDramaturgyMoodOverride();
    if (dramMood && dramMood !== this.activeMoodLabel) {
      this.triggerMoodTransition(this.activeMoodLabel, dramMood);
      this.worldMood.label = dramMood;
      this.worldMood.intensity = Math.max(this.worldMood.intensity, 0.5);
      this.activeMoodLabel = dramMood;
    } else if (moodChanged && timeSinceLastChange >= this.minMoodDuration) {
      this.triggerMoodTransition(previousMoodLabel, resolvedMoodLabel);
    }
    
    this.activeMoodLabel = resolvedMoodLabel;

    this._emitMoodBridge({
      label: newMoodLabel,
      intensity,
      dominantPersonality,
      avgHarmony,
      avgStability,
      avgEnergy,
      ascendedCount: personalityCount['ASCENDED_MYTHIC'] || 0,
      nodeCount,
      personalityCount: { ...personalityCount },
    }, moodChanged, previousMoodLabel);
  }
  
  /**
   * Determine mood label from aggregated metrics
   */
  determineMoodLabel(harmony, stability, loadPressure, personalityCount) {
    // Check for ASCENDED_ALIGNMENT (many ascended/mythic nodes)
    const ascendedCount = personalityCount['ASCENDED_MYTHIC'] || 0;
    if (ascendedCount >= 3) {
      return 'ASCENDED_ALIGNMENT';
    }
    
    // HARMONIC_CALM: high harmony, high stability
    if (harmony > 70 && stability > 60) {
      return 'HARMONIC_CALM';
    }
    
    // FOCUSED_ANALYSIS: high harmony, high stability, low load pressure
    if (harmony > 70 && stability > 70 && loadPressure < 40) {
      return 'FOCUSED_ANALYSIS';
    }

    // RADIANT_STORM: high load pressure, mid-low stability
    if (loadPressure > 75 && stability > 20 && stability < 50) {
      return 'RADIANT_STORM';
    }

    // QUANTUM_CHAOS: very low stability
    if (stability < 25) {
      return 'QUANTUM_CHAOS';
    }

    // UMBRA_PRESSURE: mid load pressure, low stability, low harmony
    if (loadPressure > 40 && loadPressure < 70 && stability < 40 && harmony < 50) {
      return 'UMBRA_PRESSURE';
    }
    
    // ECHO_DRIFT: low load pressure, mid harmony
    if (loadPressure < 45 && harmony > 40 && harmony < 70) {
      return 'ECHO_DRIFT';
    }
    
    // Default: NEUTRAL
    return 'NEUTRAL';
  }
  
  /**
   * Calculate mood intensity based on metric extremes
   */
  calculateMoodIntensity(harmony, stability, loadPressure) {
    // Intensity is based on how extreme metrics are
    const harmonySigma = Math.abs(harmony - 60) / 60; // 60 is mid-range
    const stabilitySigma = (100 - stability) / 100; // Lower stability = higher intensity
    const energySigma = Math.abs(loadPressure - 60) / 60;
    
    const avgSigma = (harmonySigma + stabilitySigma + energySigma) / 3;
    
    return Math.min(1.0, avgSigma * 1.5); // Amplify slightly
  }

  /**
   * Compute attack / crest / release envelope for mood transition
   */
  computeMoodEnvelope(progress) {
    if (progress >= 1.0) {
      return { attack: 1, crest: 1, release: 1, overall: 1 };
    }

    const attack = Math.min(1, progress * 2.0);
    const crest = Math.max(0, 1 - Math.abs(progress - 0.5) * 2.0);
    const release = progress < 0.5 ? 1 : Math.max(0, 1 - (progress - 0.5) * 2.0);

    return {
      attack,
      crest,
      release,
      overall: progress,
    };
  }

  /**
   * Unified mood envelope helper for effect scaling
   */
  getMoodEnvelope(progress, intensity) {
    const envelope = this.computeMoodEnvelope(progress);
    return {
      ...envelope,
      strength: Math.min(1.0, envelope.crest * intensity),
      moodIntensity: intensity,
    };
  }

  /**
   * Build a visual layer stack for the active mood signature
   */
  getMoodLayerStack(mood, intensity) {
    const tone = this.getMoodTone(mood);
    const base = {
      core: 0,
      surface: 0,
      overlay: 0,
      atmosphere: 0,
      dominantSignature: '',
      tags: [],
      description: '',
      palette: this.atomaPalette,
      visualTone: tone,
    };
    switch (mood) {
      case 'HARMONIC_CALM':
        return {
          ...base,
          core: 0.35,
          surface: 0.25,
          overlay: 0.2,
          atmosphere: 0.2,
          dominantSignature: 'clean_cyan_horizon',
          tags: ['cyan', 'white', 'clarity'],
          description: 'Clean cyan/white horizon with minimal noise and gentle shafts',
        };
      case 'FOCUSED_ANALYSIS':
        return {
          ...base,
          core: 0.3,
          surface: 0.2,
          overlay: 0.3,
          atmosphere: 0.2,
          dominantSignature: 'cold_data_precision',
          tags: ['focused', 'crisp', 'technical'],
          description: 'Sharp contrast with cold, technical data particles and precise structure',
        };
      case 'RADIANT_STORM':
        return {
          ...base,
          core: 0.25,
          surface: 0.25,
          overlay: 0.3,
          atmosphere: 0.2,
          dominantSignature: 'pulsing_energy_arcs',
          tags: ['storm', 'pressure', 'glow'],
          description: 'Pulsing arcs with a wide charged glow shell and pressure energy',
        };
      case 'QUANTUM_CHAOS':
        return {
          ...base,
          core: 0.2,
          surface: 0.2,
          overlay: 0.35,
          atmosphere: 0.25,
          dominantSignature: 'nebula_fragmentation',
          tags: ['chaos', 'distortion', 'fragment'],
          description: 'Readable nebula and fragment distortion with layered chaotic structure',
        };
      case 'UMBRA_PRESSURE':
        return {
          ...base,
          core: 0.3,
          surface: 0.3,
          overlay: 0.2,
          atmosphere: 0.2,
          dominantSignature: 'dark_pressure_bands',
          tags: ['dark', 'dense', 'heavy'],
          description: 'Dark bands with dense fog and heavy atmospheric presence',
        };
      case 'ECHO_DRIFT':
        return {
          ...base,
          core: 0.25,
          surface: 0.2,
          overlay: 0.3,
          atmosphere: 0.25,
          dominantSignature: 'horizontal_memory_streaks',
          tags: ['echo', 'drift', 'violet'],
          description: 'Subtle horizontal memory streaks with muted cyan/violet tone',
        };
      case 'ASCENDED_ALIGNMENT':
        return {
          ...base,
          core: 0.3,
          surface: 0.2,
          overlay: 0.25,
          atmosphere: 0.25,
          dominantSignature: 'aurora_pillars',
          tags: ['ascended', 'monumental', 'crown'],
          description: 'Aurora pillars with crown-like bloom and monumental alignment',
        };
      default:
        return {
          ...base,
          core: 0.25,
          surface: 0.25,
          overlay: 0.25,
          atmosphere: 0.25,
          dominantSignature: 'neutral_balance',
          tags: ['neutral', 'base'],
          description: 'Balanced default stack',
        };
    }
  }

  getMoodTone(mood) {
    const palette = this.atomaPalette;
    const accentMap = {
      'HARMONIC_CALM': palette[2],
      'FOCUSED_ANALYSIS': palette[1],
      'RADIANT_STORM': palette[4],
      'QUANTUM_CHAOS': palette[5],
      'UMBRA_PRESSURE': palette[0],
      'ECHO_DRIFT': palette[3],
      'ASCENDED_ALIGNMENT': palette[1],
      'NEUTRAL': palette[0],
    };

    return {
      palette,
      base: palette[0],
      primary: palette[1],
      secondary: palette[2],
      accent: accentMap[mood] || palette[4],
      highlight: palette[3],
      label: `ATOMA_PALETTE_${mood}`,
    };
  }

  getMoodPreset(mood) {
    return this.moodVisualPresets[mood] || this.moodVisualPresets.NEUTRAL;
  }

  getClusterTint(mood, clusterType) {
    switch (mood) {
      case 'HARMONIC_CALM':
        return {
          harmony: 0x6DEAFF,
          chaos: 0x77F7DB,
        };
      case 'QUANTUM_CHAOS':
        return {
          harmony: 0xD07BFF,
          chaos: 0xFF73CF,
        };
      case 'ASCENDED_ALIGNMENT':
        return {
          harmony: 0xF7FBFF,
          chaos: 0x6DEAFF,
        };
      default:
        const tone = this.getMoodTone(mood);
        return {
          harmony: new THREE.Color(tone.secondary).getHex(),
          chaos: new THREE.Color(tone.accent).getHex(),
        };
    }
  }

  /**
   * Trigger transition to new mood
   */
  triggerMoodTransition(previousMoodLabel, newMoodLabel) {
    this.previousMoodLabel = previousMoodLabel;
    this.worldMood.label = newMoodLabel;
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.lastMoodChangeTime = Date.now() / 1000;
    
    console.log(`World mood transition: ${this.previousMoodLabel} → ${newMoodLabel}`);
  }
  
  /**
   * Apply world event visual effects based on current mood
   */
  applyWorldEventEffects(deltaTime) {
    const mood = this.worldMood.label;
    const intensity = this.worldMood.intensity;
    const t = this.isTransitioning ? this.transitionProgress : 1.0;
    const envelope = this.getMoodEnvelope(t, intensity);
    const layerStack = this.getMoodLayerStack(mood, intensity);

    this.worldMood.visualContext = layerStack;

    switch (mood) {
      case 'HARMONIC_CALM':
        this.applyHarmonicCalm(intensity, envelope, deltaTime);
        break;
      
      case 'FOCUSED_ANALYSIS':
        this.applyFocusedAnalysis(intensity, envelope, deltaTime);
        break;
      
      case 'RADIANT_STORM':
        this.applyRadiantStorm(intensity, envelope, deltaTime);
        break;
      
      case 'QUANTUM_CHAOS':
        this.applyQuantumChaos(intensity, envelope, deltaTime);
        break;
      
      case 'UMBRA_PRESSURE':
        this.applyUmbraPressure(intensity, envelope, deltaTime);
        break;
      
      case 'ECHO_DRIFT':
        this.applyEchoDrift(intensity, envelope, deltaTime);
        break;
      
      case 'ASCENDED_ALIGNMENT':
        this.applyAscendedAlignment(intensity, envelope, deltaTime);
        break;
      
      default: // NEUTRAL
        this.applyNeutralState(envelope.overall);
        break;
    }
    
    // Animate active visuals
    this.animateActiveVisuals(deltaTime);
  }
  
  /**
   * Animate all active visual effects
   */
  animateActiveVisuals(deltaTime) {
    this.activeEventVisuals.forEach((visual, key) => {
      switch (visual.type) {
        case 'harmonic_shafts':
          // Gentle rotation
          if (visual.object) {
            visual.object.rotation.y += deltaTime * 0.05;
          }
          break;
        
        case 'data_particles':
          // Fall and reset
          if (visual.object && visual.object.userData.velocity) {
            visual.object.position.add(visual.object.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Reset if fallen too far
            if (visual.object.position.y < 0) {
              visual.object.position.y = 50;
            }
          }
          break;
        
        case 'energy_arcs':
          // Pulse opacity
          if (visual.object) {
            visual.pulsePhase = (visual.pulsePhase || 0) + deltaTime * 2;
            const pulseFactor = Math.sin(visual.pulsePhase) * 0.3 + 0.7;
            
            visual.object.children.forEach(arc => {
              if (arc.material && !this.blockBaseMaterialMutation(arc.material, 'energy_arcs.opacity')) {
                arc.material.opacity = 0.4 * this.worldMood.intensity * pulseFactor;
              }
            });
          }
          break;
        
        case 'chaos_nebula':
          // Slow rotation and drift
          if (visual.object) {
            visual.object.rotation.y += deltaTime * 0.02;
            visual.object.rotation.x += deltaTime * 0.01;
          }
          break;
        
        case 'shadow_bands':
          // Slow horizontal drift
          if (visual.object) {
            visual.object.children.forEach((band, i) => {
              band.position.x = Math.sin(Date.now() / 1000 + i) * 10;
            });
          }
          break;
        
        case 'memory_streaks':
          // Horizontal drift and wrap
          if (visual.object && visual.object.userData.velocity) {
            visual.object.position.add(visual.object.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Wrap around
            if (visual.object.position.x > 50) {
              visual.object.position.x = -50;
            }
          }
          break;
        
        case 'light_pillars':
          // Gentle pulse
          if (visual.object) {
            const pulseFactor = Math.sin(Date.now() / 1000) * 0.2 + 0.8;
            visual.object.children.forEach(pillar => {
              if (pillar.material && !this.blockBaseMaterialMutation(pillar.material, 'light_pillars.opacity')) {
                pillar.material.opacity = 0.3 * this.worldMood.intensity * pulseFactor;
              }
            });
          }
          break;
        
        case 'cluster_harmony':
          // Breathing pulse
          if (visual.object) {
            visual.pulsePhase = (visual.pulsePhase || 0) + deltaTime;
            const scale = 1 + Math.sin(visual.pulsePhase) * 0.1;
            visual.object.scale.setScalar(scale);
            
            const opacity = 0.1 + Math.sin(visual.pulsePhase) * 0.05;
            if (visual.object.material && !this.blockBaseMaterialMutation(visual.object.material, 'cluster_harmony.opacity')) {
              visual.object.material.opacity = opacity;
            }
          }
          break;
        
        case 'cluster_chaos':
          // Chaotic rotation
          if (visual.object) {
            visual.rotationPhase = (visual.rotationPhase || 0) + deltaTime * 2;
            visual.object.rotation.y = visual.rotationPhase;
          }
          break;
      }
    });
  }
  
  /**
   * HARMONIC_CALM - Warm sky, gentle light shafts
   */
  applyHarmonicCalm(intensity, envelope, deltaTime) {
    const preset = this.getMoodPreset('HARMONIC_CALM');
    const envelopeStrength = envelope.strength;

    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(preset.backgroundStart).lerp(
        new THREE.Color(preset.backgroundEnd),
        envelope.crest * preset.backgroundMix.crest + envelope.attack * preset.backgroundMix.attack
      );
      this.scene.background.lerp(targetColor, Math.min(1, preset.backgroundLerp * envelope.attack));
    }

    if (!this.activeEventVisuals.has(preset.primaryOverlay) && envelope.crest > preset.spawnThreshold) {
      this.createHarmonicLightShafts(envelopeStrength, preset.overlayColor, preset.overlaySize, preset.overlayOpacity);
    }
  }
  
  createHarmonicLightShafts(intensity, color = 0xF7FBFF, size = 1.2, opacityScalar = 0.22) {
    const particleCount = Math.max(6, Math.floor(8 * intensity));
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 70;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 25;
      positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color,
      map: this._getSoftPointSpriteTexture(),
      alphaTest: 0.02,
      size,
      transparent: true,
      opacity: opacityScalar * intensity,
      blending: THREE.AdditiveBlending,
    });
    this.tagFXMaterial(material);
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isWorldFX = true;
    this.root.add(particles);
    
    this.activeEventVisuals.set('harmonic_shafts', {
      object: particles,
      startTime: Date.now(),
      type: 'harmonic_shafts',
    });
  }

  _getSoftPointSpriteTexture(size = 128) {
    if (!this._pointSpriteTexture) {
      this._pointSpriteTexture = createSoftPointSpriteTexture(size);
    }
    return this._pointSpriteTexture;
  }
  
  /**
   * FOCUSED_ANALYSIS - Crisp contrast, data particles
   */
  applyFocusedAnalysis(intensity, envelope, deltaTime) {
    const preset = this.getMoodPreset('FOCUSED_ANALYSIS');
    const envelopeStrength = envelope.strength;

    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(preset.backgroundStart).lerp(
        new THREE.Color(preset.backgroundEnd),
        envelope.crest * preset.backgroundMix.crest + envelope.attack * preset.backgroundMix.attack
      );
      this.scene.background.lerp(targetColor, Math.min(1, preset.backgroundLerp * envelope.attack));
    }

    if (!this.activeEventVisuals.has(preset.primaryOverlay) && envelope.crest > preset.spawnThreshold) {
      this.createDataParticles(envelopeStrength, preset.overlayColor, preset.overlaySize, preset.overlayOpacity);
    }
  }
  
  createDataParticles(intensity, color = 0x77F7DB, size = 0.3, opacityScalar = 0.35) {
    const particleCount = Math.max(16, Math.floor(16 * intensity));
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
      const column = Math.floor(i / 4);
      const row = i % 4;
      const x = (column - 2) * 8;
      const y = 20 + row * 7;
      const z = (column % 2 === 0 ? -2 : 2);
      positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color,
      map: this._getSoftPointSpriteTexture(),
      alphaTest: 0.02,
      size,
      transparent: true,
      opacity: opacityScalar * intensity,
      blending: THREE.AdditiveBlending,
    });
    this.tagFXMaterial(material);
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isWorldFX = true;
    particles.userData.velocity = new THREE.Vector3(0, -0.5, 0);
    this.root.add(particles);
    
    this.activeEventVisuals.set('data_particles', {
      object: particles,
      startTime: Date.now(),
      type: 'data_particles',
    });
  }
  
  /**
   * RADIANT_STORM - Pulsing arcs, energy surges
   */
  applyRadiantStorm(intensity, envelope, deltaTime) {
    const preset = this.getMoodPreset('RADIANT_STORM');
    const envelopeStrength = envelope.strength;

    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(preset.backgroundStart).lerp(
        new THREE.Color(preset.backgroundEnd),
        envelope.crest * preset.backgroundMix.crest + envelope.attack * preset.backgroundMix.attack
      );
      this.scene.background.lerp(targetColor, Math.min(1, preset.backgroundLerp * envelope.attack));
    }

    if (!this.activeEventVisuals.has(preset.primaryOverlay) && envelope.crest > preset.spawnThreshold) {
      this.createEnergyArcs(envelopeStrength, preset.overlayColor, preset.overlayOpacity);
    }
  }
  
  createEnergyArcs(intensity, color = 0xD07BFF, opacityScalar = 0.35) {
    const arcCount = Math.max(4, Math.floor(4 * intensity));
    const group = new THREE.Group();
    
    for (let i = 0; i < arcCount; i++) {
      const angle = (i / arcCount) * Math.PI * 2;
      const radius = 90;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const geometry = new THREE.TorusGeometry(18, 0.5, 8, 24, Math.PI * 0.9);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: opacityScalar * intensity,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      this.tagFXMaterial(material);
      
      const arc = new THREE.Mesh(geometry, material);
      arc.position.set(x, 25, z);
      arc.rotation.x = Math.PI / 2;
      arc.rotation.y = angle;
      
      group.add(arc);
    }
    
    group.userData.isWorldFX = true;
    this.root.add(group);
    
    this.activeEventVisuals.set('energy_arcs', {
      object: group,
      startTime: Date.now(),
      type: 'energy_arcs',
      pulsePhase: 0,
    });
  }
  
  /**
   * QUANTUM_CHAOS - Nebula patterns, distortion waves
   */
  applyQuantumChaos(intensity, envelope, deltaTime) {
    const preset = this.getMoodPreset('QUANTUM_CHAOS');
    const envelopeStrength = envelope.strength;

    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(preset.backgroundStart).lerp(
        new THREE.Color(preset.backgroundEnd),
        envelope.crest * preset.backgroundMix.crest + envelope.attack * preset.backgroundMix.attack
      );
      this.scene.background.lerp(targetColor, Math.min(1, preset.backgroundLerp * envelope.attack));
    }

    if (!this.activeEventVisuals.has(preset.primaryOverlay) && envelope.crest > preset.spawnThreshold) {
      this.createChaosNebula(envelopeStrength, preset.overlayColor, preset.overlayOpacity);
    }
  }
  
  createChaosNebula(intensity, color = 0x7333ff, opacityScalar = 0.5) {
    const particleCount = Math.max(20, Math.floor(18 * intensity));
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 70 + (i % 3) * 3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 20 + ((i % 6) - 2.5) * 4;
      positions.push(x, y, z);
      const colorVec = new THREE.Color(color);
      colors.push(colorVec.r, colorVec.g, colorVec.b);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
      const material = new THREE.PointsMaterial({
        size: 1.5,
        transparent: true,
        opacity: opacityScalar * intensity,
        blending: THREE.AdditiveBlending,
        map: this._getSoftPointSpriteTexture(),
        alphaTest: 0.02,
        vertexColors: true,
      });
      this.tagFXMaterial(material);
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isWorldFX = true;
    this.root.add(particles);
    
    this.activeEventVisuals.set('chaos_nebula', {
      object: particles,
      startTime: Date.now(),
      type: 'chaos_nebula',
    });
  }
  
  /**
   * UMBRA_PRESSURE - Dark fog, shadow bands
   */
  applyUmbraPressure(intensity, envelope, deltaTime) {
    const preset = this.getMoodPreset('UMBRA_PRESSURE');
    const envelopeStrength = envelope.strength;

    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(preset.backgroundStart).lerp(
        new THREE.Color(preset.backgroundEnd),
        envelope.crest * preset.backgroundMix.crest + envelope.attack * preset.backgroundMix.attack
      );
      this.scene.background.lerp(targetColor, Math.min(1, preset.backgroundLerp * envelope.attack));
    }

    if (this.scene.fog && preset.fogColor) {
      this.scene.fog.color.lerp(new THREE.Color(preset.fogColor), Math.min(1, preset.backgroundLerp * envelope.crest));
    }

    if (!this.activeEventVisuals.has(preset.primaryOverlay) && envelope.crest > preset.spawnThreshold) {
      this.createShadowBands(envelopeStrength, preset.overlayColor, preset.overlayOpacity);
    }
  }
  
  createShadowBands(intensity, color = 0x05060b, opacityScalar = 0.45) {
    const bandCount = Math.max(3, Math.floor(3 * intensity));
    const group = new THREE.Group();
    
    for (let i = 0; i < bandCount; i++) {
      const geometry = normalizeEnvironmentGeometry(new THREE.PlaneGeometry(180, 8));
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: opacityScalar * intensity,
        side: THREE.DoubleSide,
      });
      this.tagFXMaterial(material);
      
      const band = new THREE.Mesh(geometry, material);
      band.rotation.x = Math.PI / 2;
      band.position.y = 8 + i * 10;
      band.position.z = -50 + i * 18;
      
      group.add(band);
    }
    
    group.userData.isWorldFX = true;
    this.root.add(group);
    
    this.activeEventVisuals.set('shadow_bands', {
      object: group,
      startTime: Date.now(),
      type: 'shadow_bands',
    });
  }
  
  /**
   * ECHO_DRIFT - Horizontal streaks, memory winds
   */
  applyEchoDrift(intensity, envelope, deltaTime) {
    const preset = this.getMoodPreset('ECHO_DRIFT');
    const envelopeStrength = envelope.strength;

    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(preset.backgroundStart).lerp(
        new THREE.Color(preset.backgroundEnd),
        envelope.crest * preset.backgroundMix.crest + envelope.attack * preset.backgroundMix.attack
      );
      this.scene.background.lerp(targetColor, Math.min(1, preset.backgroundLerp * envelope.attack));
    }

    if (!this.activeEventVisuals.has(preset.primaryOverlay) && envelope.crest > preset.spawnThreshold) {
      this.createMemoryStreaks(envelopeStrength, preset.overlayColor, preset.overlaySize, preset.overlayOpacity);
    }
  }
  
  createMemoryStreaks(intensity, color = 0x77F7DB, size = 1.8, opacityScalar = 0.3) {
    const streakCount = Math.max(8, Math.floor(8 * intensity));
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < streakCount; i++) {
      const y = 18 + i * 2;
      const x = -45 + i * 11;
      const z = -20 + (i % 2) * 5;
      positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color,
      map: this._getSoftPointSpriteTexture(),
      alphaTest: 0.02,
      size,
      transparent: true,
      opacity: opacityScalar * intensity,
      blending: THREE.AdditiveBlending,
    });
    this.tagFXMaterial(material);
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isWorldFX = true;
    particles.userData.velocity = new THREE.Vector3(0.5, 0, 0);
    this.root.add(particles);
    
    this.activeEventVisuals.set('memory_streaks', {
      object: particles,
      startTime: Date.now(),
      type: 'memory_streaks',
    });
  }
  
  /**
   * ASCENDED_ALIGNMENT - Aurora, pillars of light
   */
  applyAscendedAlignment(intensity, envelope, deltaTime) {
    const preset = this.getMoodPreset('ASCENDED_ALIGNMENT');
    const envelopeStrength = envelope.strength;

    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = new THREE.Color(preset.backgroundStart).lerp(
        new THREE.Color(preset.backgroundEnd),
        envelope.crest * preset.backgroundMix.crest + envelope.attack * preset.backgroundMix.attack
      );
      this.scene.background.lerp(targetColor, Math.min(1, preset.backgroundLerp * envelope.attack));
    }

    if (!this.activeEventVisuals.has(preset.primaryOverlay) && envelope.crest > preset.spawnThreshold) {
      this.createLightPillars(envelopeStrength, preset.overlayColor, preset.overlayOpacity);
    }
  }
  
  createLightPillars(intensity, color = 0x77F7DB, opacityScalar = 0.32) {
    const pillarCount = Math.max(4, Math.floor(4 * intensity));
    const group = new THREE.Group();
    
    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const radius = 80;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const geometry = new THREE.CylinderGeometry(0.4, 0.8, 50, 8);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: opacityScalar * intensity,
        blending: THREE.AdditiveBlending,
      });
      this.tagFXMaterial(material);
      
      const pillar = new THREE.Mesh(geometry, material);
      pillar.position.set(x, 25, z);
      
      group.add(pillar);
    }
    
    const crownGeometry = new THREE.TorusGeometry(25, 2, 8, 40);
    const crownMaterial = new THREE.MeshBasicMaterial({
      color: 0xF7FBFF,
      transparent: true,
      opacity: 0.18 * intensity,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.tagFXMaterial(crownMaterial);
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.rotation.x = Math.PI / 2;
    crown.position.set(0, 40, 0);
    group.add(crown);
    
    group.userData.isWorldFX = true;
    this.root.add(group);
    
    this.activeEventVisuals.set('light_pillars', {
      object: group,
      startTime: Date.now(),
      type: 'light_pillars',
    });
  }
  
  /**
   * NEUTRAL - Restore base state
   */
  applyNeutralState(t) {
    // Restore base colors
    if (this.scene.background && this.baseWorldState.backgroundColor) {
      this.scene.background.lerp(this.baseWorldState.backgroundColor, t * 0.05);
    }
    
    if (this.scene.fog && this.baseWorldState.fogColor) {
      this.scene.fog.color.lerp(this.baseWorldState.fogColor, t * 0.05);
    }
    
    // Clean up all active visuals
    if (t > 0.9) {
      this.cleanupAllEventVisuals();
    }
  }
  
  /**
   * Detect personality clusters for localized effects
   */
  detectPersonalityClusters(nodes) {
    this.personalityClusters = [];
    
    // Simple clustering: find groups of same personality within radius
    const processedNodes = new Set();
    
    nodes.forEach(nodeA => {
      if (processedNodes.has(nodeA.uuid)) return;
      
      const personalityA = nodeA.userData?.personality?.type;
      if (!personalityA) return;
      
      const cluster = {
        personality: personalityA,
        nodes: [nodeA],
        center: nodeA.position.clone(),
      };
      
      // Find nearby nodes with same personality
      nodes.forEach(nodeB => {
        if (nodeA.uuid === nodeB.uuid) return;
        if (processedNodes.has(nodeB.uuid)) return;
        
        const personalityB = nodeB.userData?.personality?.type;
        if (personalityA !== personalityB) return;
        
        const distance = nodeA.position.distanceTo(nodeB.position);
        if (distance < 5.0) {
          cluster.nodes.push(nodeB);
          cluster.center.add(nodeB.position);
          processedNodes.add(nodeB.uuid);
        }
      });
      
      // Only create cluster if 3+ nodes
      if (cluster.nodes.length >= 3) {
        cluster.center.divideScalar(cluster.nodes.length);
        this.personalityClusters.push(cluster);
        cluster.nodes.forEach(n => processedNodes.add(n.uuid));
      }
    });
  }
  
  /**
   * Update localized cluster effects
   */
  updateClusterEffects(deltaTime) {
    // Clean up old cluster effects
    const toRemove = [];
    this.activeEventVisuals.forEach((visual, key) => {
      if (key.startsWith('cluster_')) {
        // Check if cluster still exists
        const clusterStillActive = this.personalityClusters.some(c => 
          c.center.distanceTo(visual.object.position) < 1.0
        );
        
        if (!clusterStillActive) {
          toRemove.push(key);
        }
      }
    });
    
    toRemove.forEach(key => {
      const visual = this.activeEventVisuals.get(key);
      this.cleanupVisual(visual);
      this.activeEventVisuals.delete(key);
    });
    
    // Create new cluster effects
    this.personalityClusters.forEach((cluster, index) => {
      const key = `cluster_${index}`;
      
      if (!this.activeEventVisuals.has(key)) {
        this.createClusterEffect(cluster, key);
      }
    });
  }
  
  /**
   * Create localized cluster effect
   */
  createClusterEffect(cluster, key) {
    if (this.worldMood.label === 'NEUTRAL' || this.worldMood.intensity < 0.15) return;
    const personality = cluster.personality;
    const moodTint = this.getClusterTint(this.worldMood.label, personality);
    const moodOpacity = Math.max(0.08, this.worldMood.intensity * 0.22);
    
    // Harmony/calm personalities get light bloom
    if (personality === 'HARMONY_KEEPER' || personality === 'CALM_ANALYST') {
      const geometry = new THREE.SphereGeometry(3, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: moodTint.harmony,
        transparent: true,
        opacity: moodOpacity,
        blending: THREE.AdditiveBlending,
      });
      this.tagFXMaterial(material);
      
      const bloom = new THREE.Mesh(geometry, material);
      tagAllowedSphere(bloom, { role: 'vfx', source: '_WorldPersonalityController.js' });
      clampSphere(bloom);
      bloom.position.copy(cluster.center);
      bloom.userData.isWorldFX = true;
      this.root.add(bloom);
      
      this.activeEventVisuals.set(key, {
        object: bloom,
        type: 'cluster_harmony',
        pulsePhase: 0,
      });
    }
    
    // Chaos personalities get shimmer
    if (personality === 'QUANTUM_TRICKSTER' || personality === 'FRACTAL_DREAMER') {
      const particleCount = 20;
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 3) * 0.5;
        
        positions.push(
          cluster.center.x + x,
          cluster.center.y + y,
          cluster.center.z + z
        );
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      const material = new THREE.PointsMaterial({
        color: moodTint.chaos,
        map: this._getSoftPointSpriteTexture(),
        alphaTest: 0.02,
        size: 0.3,
        transparent: true,
        opacity: moodOpacity,
        blending: THREE.AdditiveBlending,
      });
      this.tagFXMaterial(material);
      
      const shimmer = new THREE.Points(geometry, material);
      shimmer.userData.isWorldFX = true;
      this.root.add(shimmer);
      
      this.activeEventVisuals.set(key, {
        object: shimmer,
        type: 'cluster_chaos',
        rotationPhase: 0,
      });
    }
  }
  
  /**
   * Update HUD display
   */
  updateHUD(deltaTime) {
    const mood = this.worldMood.label;
    const moodDisplay = mood.replace(/_/g, ' ');
    const intensity = Math.max(0, Math.min(1, this.worldMood.intensity));
    const color = this.getMoodColor(mood);
    const intensityBar = '▮'.repeat(Math.floor(intensity * 5));
    const legend = document.getElementById('ui-category-legend');
    const moodWrapper = legend?.querySelector('.ui-category-legend-mood');
    const moodValue = legend?.querySelector('.ui-category-legend-mood-value');
    const moodIntensity = legend?.querySelector('.ui-category-legend-mood-intensity');

    if (moodWrapper && moodValue && moodIntensity) {
      if (mood !== 'NEUTRAL') {
        if (!this.hudVisible) {
          this.hudVisible = true;
          this.hudFadeProgress = 0;
        }

        this.hudFadeProgress = Math.min(1.0, this.hudFadeProgress + deltaTime * 0.5);
        moodWrapper.style.opacity = String(this.hudFadeProgress);
        moodWrapper.style.display = 'block';

        if (this.currentMoodLabel !== moodDisplay) {
          moodValue.textContent = moodDisplay;
          moodValue.style.color = color;
          this.currentMoodLabel = moodDisplay;
        }

        if (this.currentMoodIntensity !== intensityBar) {
          moodIntensity.textContent = intensityBar;
          this.currentMoodIntensity = intensityBar;
        }
      } else {
        if (this.hudVisible) {
          this.hudFadeProgress = Math.max(0, this.hudFadeProgress - deltaTime * 0.5);
          moodWrapper.style.opacity = String(this.hudFadeProgress);

          if (this.hudFadeProgress <= 0) {
            this.hudVisible = false;
            moodWrapper.style.display = 'none';
          }
        }
      }
    } else if (this.hudElement) {
      // Fallback if legend is not present
      if (mood !== 'NEUTRAL') {
        if (!this.hudVisible) {
          this.hudVisible = true;
          this.hudFadeProgress = 0;
        }

        this.hudFadeProgress = Math.min(1.0, this.hudFadeProgress + deltaTime * 0.5);
        this.hudElement.style.opacity = this.hudFadeProgress;
        this.hudElement.textContent = `${moodDisplay} ${intensityBar}`;
      } else {
        if (this.hudVisible) {
          this.hudFadeProgress = Math.max(0, this.hudFadeProgress - deltaTime * 0.5);
          this.hudElement.style.opacity = this.hudFadeProgress;

          if (this.hudFadeProgress <= 0) {
            this.hudVisible = false;
          }
        }
      }
    }
  }
  
  /**
   * Get color for mood display
   */
  getMoodColor(mood) {
    const colors = {
      'HARMONIC_CALM': '#00ffaa',
      'FOCUSED_ANALYSIS': '#00ffff',
      'RADIANT_STORM': '#ffaa00',
      'QUANTUM_CHAOS': '#ff00ff',
      'UMBRA_PRESSURE': '#8800ff',
      'ECHO_DRIFT': '#8888aa',
      'ASCENDED_ALIGNMENT': '#ffffaa',
    };
    
    return colors[mood] || '#00ffff';
  }
  
  /**
   * Cleanup visual effect
   */
  cleanupVisual(visual) {
    if (visual.object) {
      this.root.remove(visual.object);
      
      if (visual.object.geometry) {
        visual.object.geometry.dispose();
      }
      
      if (visual.object.material) {
        if (Array.isArray(visual.object.material)) {
          visual.object.material.forEach(m => m.dispose());
        } else {
          visual.object.material.dispose();
        }
      }
      
      // Recursively cleanup children
      if (visual.object.children) {
        visual.object.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    }
  }
  
  /**
   * Cleanup all event visuals
   */
  cleanupAllEventVisuals() {
    this.activeEventVisuals.forEach((visual, key) => {
      this.cleanupVisual(visual);
    });
    
    this.activeEventVisuals.clear();
  }
  
  /**
   * Destroy controller (cleanup)
   */
  destroy() {
    this.cleanupAllEventVisuals();
    
    // Remove HUD
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }
    
    // Restore base world state
    if (this.scene.fog && this.baseWorldState.fogColor) {
      this.scene.fog.color.copy(this.baseWorldState.fogColor);
    }
    
    if (this.scene.background && this.baseWorldState.backgroundColor) {
      this.scene.background.copy(this.baseWorldState.backgroundColor);
    }

    if (this._pointSpriteTexture) {
      this._pointSpriteTexture.dispose?.();
      this._pointSpriteTexture = null;
    }
  }
  
  /**
   * Get current mood state (for debugging/inspection)
   */
  getMoodState() {
    return {
      mood: this.worldMood,
      isTransitioning: this.isTransitioning,
      transitionProgress: this.transitionProgress,
      activeVisuals: Array.from(this.activeEventVisuals.keys()),
      clusterCount: this.personalityClusters.length,
    };
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _resolveGlobalMetrics(worldMetrics = null) {
    if (worldMetrics && typeof worldMetrics === 'object' && Object.keys(worldMetrics).length > 0) {
      return worldMetrics;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    const liveMetrics = browserWindow?.__ATOMA_LIVE_METRICS__ || null;
    return liveMetrics && typeof liveMetrics === 'object' ? liveMetrics : {};
  }

  _hasGlobalMetrics(metrics) {
    return metrics && (metrics.harmonyFlow !== undefined || metrics.networkSynergy !== undefined || metrics.loadPressure !== undefined || metrics.networkStress !== undefined || metrics.stability !== undefined);
  }

  _normalizeStability(networkStress, stability) {
    if (networkStress !== undefined && Number.isFinite(networkStress)) {
      return Math.max(0, 1 - networkStress);
    }
    return stability ?? 0;
  }

  resolveMoodWithHysteresis(activeMood, candidateMood, metrics, timeSinceLastChange) {
    if (candidateMood === activeMood) {
      return activeMood;
    }

    if (timeSinceLastChange < this.minMoodDuration) {
      return activeMood;
    }

    switch (activeMood) {
      case 'HARMONIC_CALM':
        return this.shouldExitHarmonicCalm(metrics) ? candidateMood : activeMood;
      case 'RADIANT_STORM':
        return this.shouldExitRadiantStorm(metrics) ? candidateMood : activeMood;
      case 'UMBRA_PRESSURE':
        return this.shouldExitUmbraPressure(metrics) ? candidateMood : activeMood;
      default:
        return candidateMood;
    }
  }

  shouldExitHarmonicCalm({ avgHarmony, avgStability }) {
    return avgHarmony < 60 || avgStability < 55;
  }

  shouldExitRadiantStorm({ avgStability, avgEnergy }) {
    return avgEnergy < 70 || avgStability > 50;
  }

  shouldExitUmbraPressure({ avgHarmony, avgStability, avgEnergy }) {
    return avgEnergy < 35 || avgStability > 45 || avgHarmony > 55;
  }

  _toPercent(value) {
    return Number.isFinite(value) ? value * 100 : 0;
  }

  _emitMoodBridge(moodSnapshot, moodChanged, previousMoodLabel) {
    const bus = this.semanticBus || this._resolveMetricBus();
    if (!bus?.emit) return;

    this.semanticBus = bus;

    const payload = {
      ...moodSnapshot,
      previousLabel: previousMoodLabel,
      moodChanged: !!moodChanged,
      source: 'WorldPersonalityController',
      timestamp: performance.now(),
      visualContext: moodSnapshot.visualContext ?? this.worldMood.visualContext,
      visualTone: moodSnapshot.visualContext?.visualTone ?? this.worldMood.visualContext?.visualTone,
      paletteLock: this.atomaPalette,
      dominantSignature: (moodSnapshot.visualContext?.dominantSignature || this.worldMood.visualContext?.dominantSignature),
    };

    const priority = bus.priority?.INTERACTIVE ?? bus.priority?.NORMAL;

    bus.emit('world.mood.snapshot', payload, { priority });
    if (moodChanged) {
      bus.emit('world.mood.changed', payload, { priority });
    }

    this._emitMoodMetricTags(bus, payload);
  }

  _emitMoodMetricTags(bus, moodSnapshot) {
    if (!bus?.emit) return;

    const priority = bus.priority?.INTERACTIVE ?? bus.priority?.NORMAL;
    const emit = (metric, tier, value = 1) => {
      bus.emit(buildScopedMetricEventName('global', metric, tier), {
        ...moodSnapshot,
        metric,
        tier,
        value,
        source: 'WorldPersonalityController',
      }, { priority });
    };

    switch (moodSnapshot.label) {
      case 'HARMONIC_CALM':
        emit('harmony', 'high');
        emit('stability', 'high');
        break;
      case 'FOCUSED_ANALYSIS':
        emit('stability', 'high');
        break;
      case 'RADIANT_STORM':
        emit('loadPressure', 'high');
        break;
      case 'QUANTUM_CHAOS':
        emit('stability', 'low');
        break;
      case 'UMBRA_PRESSURE':
        emit('harmony', 'low');
        emit('loadPressure', 'mid');
        break;
      case 'ECHO_DRIFT':
        emit('harmony', 'mid');
        break;
      case 'ASCENDED_ALIGNMENT':
        emit('synergy', 'high');
        emit('harmony', 'high');
        emit('stability', 'high');
        break;
      default:
        break;
    }
  }
}


