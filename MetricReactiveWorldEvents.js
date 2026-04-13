import * as THREE from 'three';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';
import { projectHudMetrics } from './SemanticMetricAdapter.js';

const METRIC_PALETTE = {
  synergy: ['#6DEAFF', '#F7FBFF'],
  harmony: ['#77F7DB', '#D6FFF3'],
  stability: ['#D07BFF', '#F0D6FF'],
  corruption: ['#FF73CF', '#FFD4EF'],
  loadPressure: ['#BC76FF', '#67F2FF']
};

/**
 * METRIC-REACTIVE WORLD EVENTS 1.0 (SAFE EDITION)
 * 
 * Environmental effects that react to ATOMA Core Metrics.
 * 100% visual-only, cosmetic, non-destructive.
 * 
 * Features:
 * - Synergy Events: Coherence Wave, Unity Pulse
 * - Harmony Events: Calm Bloom, Harmonic Ascension
 * - Instability Events: Distortion Drift, Quantum Spiral
 * - Corruption Events: Shadow Flicker, Umbra Echo
 * - Load Events: Overlink Glow, Network Surge
 * - Temporal Events: Cycle/Epoch/Aeon moments
 * 
 * SAFETY: No physics, no camera manipulation, no gameplay changes
 */

export class MetricReactiveWorldEvents {
  constructor(scene, worldRoot, environmentRoot, renderer, coreMetricsOverlay) {
    this.scene = scene;
    this.worldRoot = worldRoot || scene;
    this.environmentRoot = environmentRoot || this.worldRoot;
    this.root = new THREE.Group();
    this.environmentRoot.add(this.root);
    this.renderer = renderer;
    this.coreMetricsOverlay = coreMetricsOverlay;
    
    this.enabled = true;
    this.debugMode = false;
    
    // Metric signal configuration
    this.metricConfig = {
      synergy: {
        metric: 'synergy',
        thresholds: { low: 55, mid: 70, high: 85 },
        cooldown: 10,
        afterglowDelay: 2.0,
        peakHold: 1.0,
        events: {
          low: {
            eventKey: 'coherenceBloom',
            title: 'Coherence Bloom',
            subtitle: 'Synergy fields are aligning',
            description: 'Network synergy is rising into a smoother, more coherent state.',
            visualTone: 'calm',
            colorBias: METRIC_PALETTE.synergy[0],
            bloomBias: 0.08,
            motionBias: 0.08,
            intensity: 0.35
          },
          mid: {
            eventKey: 'unityPulse',
            title: 'Unity Pulse',
            subtitle: 'Shared momentum is building',
            description: 'A sustained synergy pulse is spreading through the global lattice.',
            visualTone: 'fluid',
            colorBias: METRIC_PALETTE.synergy[1],
            bloomBias: 0.14,
            motionBias: 0.18,
            intensity: 0.55
          },
          high: {
            eventKey: 'coherenceApex',
            title: 'Coherence Apex',
            subtitle: 'Synergy has reached a commanding peak',
            description: 'The network is operating in a highly coherent surge with strong signal alignment.',
            visualTone: 'radiant',
            colorBias: METRIC_PALETTE.synergy[1],
            bloomBias: 0.26,
            motionBias: 0.32,
            intensity: 0.75
          }
        }
      },
      harmony: {
        metric: 'harmony',
        thresholds: { low: 50, mid: 68, high: 85 },
        cooldown: 10,
        afterglowDelay: 2.0,
        peakHold: 1.0,
        events: {
          low: {
            eventKey: 'harmonicDrift',
            title: 'Harmonic Drift',
            subtitle: 'Harmony is settling into balance',
            description: 'Internal rhythms are aligning, encouraging a calm and steady flow.',
            visualTone: 'soft',
            colorBias: METRIC_PALETTE.harmony[0],
            bloomBias: 0.09,
            motionBias: 0.08,
            intensity: 0.3
          },
          mid: {
            eventKey: 'calmBloom',
            title: 'Calm Bloom',
            subtitle: 'Harmony is radiating outward',
            description: 'A gentle harmonic bloom is improving visual and systemic clarity.',
            visualTone: 'ethereal',
            colorBias: METRIC_PALETTE.harmony[0],
            bloomBias: 0.12,
            motionBias: 0.12,
            intensity: 0.5
          },
          high: {
            eventKey: 'harmonicAscension',
            title: 'Harmonic Ascension',
            subtitle: 'Harmony has risen into a powerful state',
            description: 'The system is experiencing an elevated harmonic resonance.',
            visualTone: 'uplifting',
            colorBias: METRIC_PALETTE.harmony[1],
            bloomBias: 0.22,
            motionBias: 0.28,
            intensity: 0.68
          }
        }
      },
      stability: {
        metric: 'stability',
        thresholds: { low: 40, mid: 58, high: 75 },
        cooldown: 8,
        afterglowDelay: 1.8,
        peakHold: 0.9,
        events: {
          low: {
            eventKey: 'tensionVector',
            title: 'Tension Vector',
            subtitle: 'Instability is introducing directional stress',
            description: 'Stress is shifting the system toward a delicate, unstable vector.',
            visualTone: 'tense',
            colorBias: METRIC_PALETTE.stability[0],
            bloomBias: 0.06,
            motionBias: 0.12,
            intensity: 0.38
          },
          mid: {
            eventKey: 'distortionDrift',
            title: 'Distortion Drift',
            subtitle: 'Instability has grown into visible ripples',
            description: 'The network is showing drifting distortions as pressure mounts.',
            visualTone: 'edgy',
            colorBias: METRIC_PALETTE.stability[0],
            bloomBias: 0.1,
            motionBias: 0.2,
            intensity: 0.55
          },
          high: {
            eventKey: 'collapseVector',
            title: 'Collapse Vector',
            subtitle: 'Instability is near a critical inflection',
            description: 'A strong collapse vector is forming, calling for careful signal moderation.',
            visualTone: 'sharp',
            colorBias: METRIC_PALETTE.stability[1],
            bloomBias: 0.2,
            motionBias: 0.34,
            intensity: 0.76
          }
        }
      },
      corruption: {
        metric: 'corruption',
        thresholds: { low: 20, mid: 45, high: 65 },
        cooldown: 12,
        afterglowDelay: 2.2,
        peakHold: 1.0,
        events: {
          low: {
            eventKey: 'shadowFlicker',
            title: 'Shadow Flicker',
            subtitle: 'Corruption is beginning to perturb the field',
            description: 'Subtle corruption flickers are appearing across the network.',
            visualTone: 'dark',
            colorBias: METRIC_PALETTE.corruption[0],
            bloomBias: 0.05,
            motionBias: 0.08,
            intensity: 0.28
          },
          mid: {
            eventKey: 'umbraEcho',
            title: 'Umbra Echo',
            subtitle: 'Corruption resonance is echoing through the system',
            description: 'The network is experiencing deeper corruption echoes.',
            visualTone: 'brooding',
            colorBias: METRIC_PALETTE.corruption[0],
            bloomBias: 0.1,
            motionBias: 0.14,
            intensity: 0.47
          },
          high: {
            eventKey: 'entropyFracture',
            title: 'Entropy Fracture',
            subtitle: 'Corruption is pushing the network toward fracture',
            description: 'High corruption pressure is creating a fractured visual signal.',
            visualTone: 'volatile',
            colorBias: METRIC_PALETTE.corruption[1],
            bloomBias: 0.18,
            motionBias: 0.3,
            intensity: 0.7
          }
        }
      },
      loadPressure: {
        metric: 'loadPressure',
        thresholds: { low: 55, mid: 70, high: 85 },
        cooldown: 12,
        afterglowDelay: 2.0,
        peakHold: 1.0,
        events: {
          low: {
            eventKey: 'overlinkGlow',
            title: 'Overlink Glow',
            subtitle: 'Load is rising across the network',
            description: 'Network load pressure is building, creating a warm overlink glow.',
            visualTone: 'charged',
            colorBias: METRIC_PALETTE.loadPressure[0],
            bloomBias: 0.08,
            motionBias: 0.1,
            intensity: 0.4
          },
          mid: {
            eventKey: 'networkSurge',
            title: 'Network Surge',
            subtitle: 'Load is surging through key pathways',
            description: 'Load pressure is intensifying and forcing stronger signal flow.',
            visualTone: 'energetic',
            colorBias: METRIC_PALETTE.loadPressure[0],
            bloomBias: 0.14,
            motionBias: 0.22,
            intensity: 0.6
          },
          high: {
            eventKey: 'signalPressure',
            title: 'Signal Pressure',
            subtitle: 'Load has reached a high-pressure state',
            description: 'The system is under strong load pressure and the signal is highly charged.',
            visualTone: 'forceful',
            colorBias: METRIC_PALETTE.loadPressure[1],
            bloomBias: 0.24,
            motionBias: 0.34,
            intensity: 0.78
          }
        }
      }
    };

    this.metricState = Object.fromEntries(
      Object.keys(this.metricConfig).map((key) => [
        key,
        {
          currentTier: null,
          currentPhase: 'idle',
          lastValue: 0,
          lastTierAt: 0,
          lastSignalAt: 0,
          lastPhaseAt: 0
        }
      ])
    );

    this.eventEnvelope = {
      rising: 'rising',
      peak: 'peak',
      decay: 'decay',
      afterglow: 'afterglow',
      idle: 'idle'
    };

    this.visualModulation = {
      intensity: 0,
      colorBias: new THREE.Color(0x000000),
      bloomBias: 0,
      motionBias: 0
    };

    this.reactiveSignalTag = 'metric.reactive.signal';
    this.tierChangedTag = 'metric.tier.changed';

    // Active effects tracking
    this.activeEffects = new Map();
    
    // Performance monitoring
    this.lastUpdateTime = performance.now();
    this.performanceMonitor = {
      averageTimeMs: 0,
      updateCount: 0,
      maxTimeMs: 0
    };
    
    // Scene references for overlays
    this.overlayGroup = new THREE.Group();
    this.overlayGroup.name = 'metric-reactive-overlays';
    this.root.add(this.overlayGroup);
    if (typeof window !== 'undefined') {
      window.__ATOMA_SPHERE_POLICY__?.registerRoot?.(this.overlayGroup, 'metric-reactive-overlays');
    }

    this.metricBus = this._resolveMetricBus();
    
    console.log('✓ Metric-Reactive World Events 1.0 initialized');
  }

  /**
   * Create epic glow material with additive blending and HDR brightness.
   * Replaces flat MeshBasicMaterial for all world event effects.
   */
  _createGlowMaterial(color, opacity = 0.5, extra = {}) {
    const colorObj = color instanceof THREE.Color ? color : new THREE.Color(color);
    return new THREE.MeshBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      side: THREE.DoubleSide,
      ...extra
    });
  }

  /**
   * Create epic glow line material with additive blending.
   */
  _createGlowLine(color, opacity = 0.4, extra = {}) {
    const colorObj = color instanceof THREE.Color ? color : new THREE.Color(color);
    return new THREE.LineBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      ...extra
    });
  }
  
  /**
   * Main update loop - call every frame
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    if (!this.enabled) return;
    
    try {
      const startTime = performance.now();
      
      // Get current metrics
      if (!this.coreMetricsOverlay) return;
      
      const metrics = this.coreMetricsOverlay.getMetrics();
      const displayMetrics = projectHudMetrics(metrics);
      const normalizedMetrics = {
        synergy: displayMetrics.networkSynergy ?? metrics.synergy,
        harmony: displayMetrics.harmonyFlow ?? metrics.harmony,
        instability: displayMetrics.networkStress ?? metrics.instability,
        corruption: displayMetrics.corruptionLevel ?? metrics.corruption,
        networkLoad: displayMetrics.loadPressure ?? metrics.networkLoad
      };
      const currentTime = performance.now() / 1000; // Convert to seconds
      
      // Update active effects and visual modulation
      this.updateActiveEffects(deltaTime);
      this.updateVisualModulation(deltaTime);

      // Process all metrics through a shared signal model
      this.processMetricSignals(normalizedMetrics, currentTime);
      
      // Monitor performance
      const elapsed = performance.now() - startTime;
      this.updatePerformanceMonitor(elapsed);
      
      // Auto-disable if performance critical
      if (elapsed > 0.3) {
        console.warn(`Metric events overhead high: ${elapsed.toFixed(2)}ms`);
        if (elapsed > 1.0) {
          this.disable();
        }
      }
      
    } catch (error) {
      console.error('Error in metric-reactive events:', error);
      this.disable();
    }
  }
  
  /**
   * Update temporal events
   */
  updateTemporalEvents(temporalEvents) {
    if (!this.enabled) return;
    
    try {
      if (temporalEvents.newCycle) {
        this.triggerCycleTurnover();
      }
      if (temporalEvents.newEpoch) {
        this.triggerEpochTurnover();
      }
      if (temporalEvents.newAeon) {
        this.triggerAeonMoment();
      }
    } catch (error) {
      console.warn('Error triggering temporal events:', error);
    }
  }
  
  /**
   * Process all metric signals through a unified tier model.
   */
  processMetricSignals(normalizedMetrics, currentTime) {
    this._processMetricSignal('synergy', normalizedMetrics.synergy, currentTime);
    this._processMetricSignal('harmony', normalizedMetrics.harmony, currentTime);
    this._processMetricSignal('stability', normalizedMetrics.instability, currentTime);
    this._processMetricSignal('corruption', normalizedMetrics.corruption, currentTime);
    this._processMetricSignal('loadPressure', normalizedMetrics.networkLoad, currentTime);
  }

  _processMetricSignal(metricKey, rawValue, currentTime) {
    const config = this.metricConfig[metricKey];
    if (!config) return;

    const value = this._clampPercent(rawValue);
    const state = this.metricState[metricKey];
    const nextTier = this._resolveMetricTier(config.thresholds, value);
    const tierChanged = nextTier !== state.currentTier;
    const phase = this._resolveMetricPhase(state, nextTier, value, currentTime, config);

    if (tierChanged) {
      const tierPayload = this._buildMetricPayload(metricKey, nextTier, value, phase || this.eventEnvelope.rising, config);
      this._emitMetricTag(this.tierChangedTag, value, tierPayload);
      if (nextTier) {
        const globalTag = `global.${config.metric}.${nextTier}`;
        this._emitMetricTag(globalTag, value, tierPayload);
      }
      state.currentTier = nextTier;
      state.currentPhase = phase || this.eventEnvelope.rising;
      state.lastTierAt = currentTime;
      state.lastPhaseAt = currentTime;
      this._scheduleVisualModulation(tierPayload);
    }

    if (phase && this._shouldTriggerMetricEvent(metricKey, nextTier, phase, currentTime, config)) {
      const eventPayload = this._buildMetricPayload(metricKey, nextTier, value, phase, config);
      this._emitMetricEvent(eventPayload);
      state.currentPhase = phase;
      state.lastSignalAt = currentTime;
      state.lastPhaseAt = currentTime;
      this._scheduleVisualModulation(eventPayload);
    }

    state.lastValue = value;
  }

  _resolveMetricTier(thresholds, value) {
    if (value >= thresholds.high) return 'high';
    if (value >= thresholds.mid) return 'mid';
    if (value >= thresholds.low) return 'low';
    return null;
  }

  _resolveMetricPhase(state, tier, value, currentTime, config) {
    if (tier && tier !== state.currentTier) {
      return this.eventEnvelope.rising;
    }

    if (tier && state.currentTier === tier) {
      if (state.currentPhase === this.eventEnvelope.rising && currentTime - state.lastPhaseAt > config.peakHold) {
        return this.eventEnvelope.peak;
      }
      return null;
    }

    if (!tier && state.currentTier) {
      if (state.currentPhase === this.eventEnvelope.decay && currentTime - state.lastPhaseAt > config.afterglowDelay) {
        return this.eventEnvelope.afterglow;
      }
      return this.eventEnvelope.decay;
    }

    return null;
  }

  _shouldTriggerMetricEvent(metricKey, tier, phase, currentTime, config) {
    const state = this.metricState[metricKey];
    if (!phase) return false;
    if (currentTime - state.lastSignalAt < config.cooldown) return false;
    if (phase === this.eventEnvelope.decay && state.currentPhase === this.eventEnvelope.decay) return false;
    return true;
  }

  _buildMetricPayload(metricKey, tier, value, phase, config) {
    const eventDefinition = tier ? config.events[tier] : null;
    return {
      source: 'MetricReactiveWorldEvents',
      scope: 'global',
      metric: config.metric,
      tier,
      phase,
      value,
      title: eventDefinition?.title || `${config.metric} ${phase}`,
      subtitle: eventDefinition?.subtitle || `${phase} phase engaged`,
      description: eventDefinition?.description || `Metric ${config.metric} transitioned to ${phase}.`,
      visualTone: eventDefinition?.visualTone || 'balanced',
      colorBias: eventDefinition?.colorBias || '#ffffff',
      bloomBias: eventDefinition?.bloomBias || 0,
      motionBias: eventDefinition?.motionBias || 0,
      intensity: eventDefinition?.intensity || 0,
      eventKey: eventDefinition?.eventKey || `${config.metric}.${tier || 'none'}.${phase}`,
      timestamp: performance.now()
    };
  }

  _emitMetricEvent(payload) {
    this._emitMetricTag(this.reactiveSignalTag, payload.value, payload);
  }

  _scheduleVisualModulation(payload) {
    this.visualModulation.intensity = Math.max(this.visualModulation.intensity, payload.intensity || 0);
    this.visualModulation.bloomBias = Math.max(this.visualModulation.bloomBias, payload.bloomBias || 0);
    this.visualModulation.motionBias = Math.max(this.visualModulation.motionBias, payload.motionBias || 0);
    this.visualModulation.colorBias.set(payload.colorBias || '#000000');
    this.overlayGroup.userData.visualModulation = {
      intensity: this.visualModulation.intensity,
      colorBias: payload.colorBias,
      bloomBias: this.visualModulation.bloomBias,
      motionBias: this.visualModulation.motionBias,
      phase: payload.phase,
      eventKey: payload.eventKey
    };
  }

  updateVisualModulation(deltaTime) {
    if (deltaTime <= 0) return;
    const decayFactor = Math.min(1, deltaTime * 0.35);

    this.visualModulation.intensity *= 1 - decayFactor;
    this.visualModulation.bloomBias *= 1 - decayFactor;
    this.visualModulation.motionBias *= 1 - decayFactor;
    this.visualModulation.colorBias.lerp(new THREE.Color(0x000000), decayFactor * 0.65);

    this.overlayGroup.userData.visualModulation = {
      intensity: this.visualModulation.intensity,
      colorBias: this.visualModulation.colorBias.getStyle(),
      bloomBias: this.visualModulation.bloomBias,
      motionBias: this.visualModulation.motionBias
    };
  }

  _clampPercent(value) {
    return Math.max(0, Math.min(100, Number(value) || 0));
  }

  /**
   * ==================== SYNERGY EVENTS ====================
   */
  
  triggerCoherenceWave() {
    if (this.debugMode) console.log('► Coherence Wave triggered');

    const coreColor = METRIC_PALETTE.synergy[0];
    const glowColor = METRIC_PALETTE.synergy[1];
    const accent = METRIC_PALETTE.synergy[2];

    this.createConcentricRings(3, 2.5, glowColor, 3.5);
    this.createSoftHalo(coreColor, 0.14, 2.6, 16);
    this.createThinArcBands(2, accent, 12, 3);
    this.createSmallOrbitingMotes(5, 3.0, coreColor);
    this.applyBloomPulse(0.12, 0.3, 0.8);
  }

  triggerUnityPulse() {
    if (this.debugMode) console.log('► Unity Pulse triggered');

    const coreColor = METRIC_PALETTE.synergy[0];
    this.createConcentricRings(2, 2.2, coreColor, 3.0);
    this.createThinArcBands(2, METRIC_PALETTE.synergy[2], 10, 4);
    this.createSmallOrbitingMotes(4, 2.8, coreColor);
    this.applyBloomPulse(0.08, 0.25, 0.6);
  }

  /**
   * ==================== HARMONY EVENTS ====================
   */

  triggerCalmBloom() {
    if (this.debugMode) console.log('► Calm Bloom triggered');

    const coreColor = METRIC_PALETTE.harmony[0];
    const accent = METRIC_PALETTE.harmony[2];
    this.createConcentricRings(2, 2.4, coreColor, 3.2);
    this.createThinArcBands(2, accent, 12, 3);
    this.createSoftHalo(coreColor, 0.12, 2.5, 15);
    this.applyBloomPulse(0.1, 0.3, 0.7);
  }

  triggerHarmonicAscension() {
    if (this.debugMode) console.log('► Harmonic Ascension triggered');

    const color = METRIC_PALETTE.harmony[1];
    this.createThinArcBands(3, color, 14, 4);
    this.createSoftHalo(color, 0.1, 2.8, 18);
    this.createSmallOrbitingMotes(4, 3.2, METRIC_PALETTE.harmony[0]);
  }

  /**
   * ==================== INSTABILITY EVENTS ====================
   */

  triggerDistortionDrift() {
    if (this.debugMode) console.log('► Distortion Drift triggered');

    const coreColor = METRIC_PALETTE.stability[0];
    this.createThinArcBands(2.2, coreColor, 10, 3);
    this.createSoftHalo(coreColor, 0.08, 2.0, 12);
    this.applyBloomPulse(0.05, 0.2, 0.5);
  }

  triggerQuantumSpiral() {
    if (this.debugMode) console.log('► Quantum Spiral triggered');

    const color = METRIC_PALETTE.stability[1];
    this.createConcentricRings(4, 3.0, color, 3.5);
    this.createThinArcBands(2, color, 11, 3);
  }

  /**
   * ==================== CORRUPTION EVENTS ====================
   */

  triggerShadowFlicker() {
    if (this.debugMode) console.log('► Shadow Flicker triggered');

    const coreColor = METRIC_PALETTE.corruption[0];
    const fringeColor = METRIC_PALETTE.corruption[2];
    this.createFracturedRingCore(6, 2.0, coreColor);
    this.createGlitchBars(4, 1.8, fringeColor);
    this.createDarkShroud(fringeColor, 0.16, 2.2);
    this.applyBloomPulse(0.07, 0.2, 0.5);
  }

  triggerUmbraEcho() {
    if (this.debugMode) console.log('► Umbra Echo triggered');

    const color = METRIC_PALETTE.corruption[1];
    this.createFracturedRingCore(5, 2.5, color);
    this.createThinArcBands(2.0, color, 10, 3);
    this.createDarkShroud(METRIC_PALETTE.corruption[2], 0.14, 2.4);
  }

  /**
   * ==================== LOAD EVENTS ====================
   */

  triggerOverlinkGlow() {
    if (this.debugMode) console.log('► Overlink Glow triggered');

    const coreColor = METRIC_PALETTE.loadPressure[0];
    const accent = METRIC_PALETTE.loadPressure[1];
    this.createColorTint('#0C0816', 0.16, 0.4, 0.8);
    this.createPressureBands(3, 2.2, accent);
    this.createShortBeamSpikes(5, 2.2, coreColor);
    this.createThinArcBands(2, accent, 11, 3);
  }

  triggerNetworkSurge() {
    if (this.debugMode) console.log('► Network Surge triggered');

    const coreColor = METRIC_PALETTE.loadPressure[1];
    this.createColorTint('#0C0816', 0.18, 0.4, 1.0);
    this.createPressureBands(4, 2.5, coreColor);
    this.createShortBeamSpikes(7, 2.4, coreColor);
    this.createThinArcBands(2.4, METRIC_PALETTE.loadPressure[2], 12, 3);
  }
  
  /**
   * ==================== TEMPORAL EVENTS ====================
   */
  
  triggerCycleTurnover() {
    if (this.debugMode) console.log('► Cycle Turnover triggered');
    
    // Ring wave expands outward
    this.createExpandingRing(0.4, METRIC_PALETTE.synergy[0]);
  }
  
  triggerEpochTurnover() {
    if (this.debugMode) console.log('► Epoch Turnover triggered');
    this._emitMetricTag('temporal.newEpoch', 1, { effect: 'EpochTurnover' });
    
    // Soft harmony tint
    const tint = this.createColorTint(METRIC_PALETTE.harmony[1], 0.05, 0.5, 1.5);
    this.registerEffect('epoch-turnover', tint, 2.0);
    
    // Arc sweep
    this.createArcSweep(2.0, METRIC_PALETTE.harmony[0]);
  }
  
  triggerAeonMoment() {
    if (this.debugMode) console.log('► Aeon Moment triggered (RARE)');
    this._emitMetricTag('temporal.newAeon', 1, { effect: 'AeonMoment' });
    
    // Golden glyph at center
    this.createGoldenGlyph('◎', 4.0);
  }
  
  /**
   * ==================== HELPER METHODS ====================
   */
  
  /**
   * Create shimmer overlay
   */
  createShimmerOverlay(intensityStart, fadeOutDuration, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = this._createGlowMaterial(0xffffff, 0.6, { map: texture });
    const geometry = new THREE.PlaneGeometry(20, 2);
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.y = 5;
    mesh.renderOrder = 1;
    
    return mesh;
  }
  
  /**
   * Create color tint overlay
   */
  createColorTint(color, intensity, fadeInDuration, fadeOutDuration) {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = this._createGlowMaterial(color, intensity);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -50;
    mesh.renderOrder = 0;
    
    mesh.userData.tintData = {
      fadeInDuration,
      fadeOutDuration,
      elapsedTime: 0,
      isActive: true
    };
    
    return mesh;
  }
  
  /**
   * Create concentric ring motifs
   */
  createConcentricRings(ringCount, duration, color, baseRadius = 5) {
    const group = new THREE.Group();
    group.name = 'concentric-rings';
    for (let i = 0; i < ringCount; i++) {
      const radius = baseRadius + i * 2;
      const geometry = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 48);
      const material = this._createGlowMaterial(color, 0.35);
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.x = Math.PI / 2;
      ring.userData.ringData = { duration, elapsedTime: 0, scale: 1 + i * 0.08 };
      group.add(ring);
    }
    this.overlayGroup.add(group);
    return group;
  }
  
  /**
   * Create soft planar halo
   */
  createSoftHalo(color, intensity, duration, size) {
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = this._createGlowMaterial(color, intensity);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -45;
    mesh.renderOrder = 0;
    mesh.userData.haloData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(mesh);
    return mesh;
  }
  
  /**
   * Create thin arc band elements
   */
  createThinArcBands(duration, color, radius, count) {
    const group = new THREE.Group();
    group.name = 'thin-arc-bands';
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.BufferGeometry();
      const points = [];
      const startAngle = (i / count) * Math.PI * 2;
      const arcRadius = radius + i * 0.6;
      for (let j = 0; j <= 40; j++) {
        const angle = startAngle + (j / 40) * Math.PI * 0.7;
        points.push(
          Math.cos(angle) * arcRadius,
          0.1 + i * 0.15,
          Math.sin(angle) * arcRadius
        );
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
      const material = this._createGlowLine(color, 0.35);
      const line = new THREE.Line(geometry, material);
      line.userData.arcData = { duration, elapsedTime: 0 };
      group.add(line);
    }
    this.overlayGroup.add(group);
    return group;
  }
  
  /**
   * Create short beam spikes
   */
  createShortBeamSpikes(count, duration, color) {
    const group = new THREE.Group();
    group.name = 'short-beam-spikes';
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.PlaneGeometry(0.3, 4);
      const material = this._createGlowMaterial(color, 0.4);
      const beam = new THREE.Mesh(geometry, material);
      const angle = (i / count) * Math.PI * 2;
      beam.position.set(Math.cos(angle) * 8, 2, Math.sin(angle) * 8);
      beam.rotation.y = angle;
      beam.userData.beamData = { duration, elapsedTime: 0 };
      group.add(beam);
    }
    this.overlayGroup.add(group);
    return group;
  }

  /**
   * Create fractured ring core segments
   */
  createFracturedRingCore(segmentCount, duration, color) {
    const group = new THREE.Group();
    group.name = 'fractured-ring-core';
    for (let i = 0; i < segmentCount; i++) {
      const geometry = new THREE.PlaneGeometry(0.5, 2.4);
      const material = this._createGlowMaterial(color, 0.5);
      const segment = new THREE.Mesh(geometry, material);
      const angle = (i / segmentCount) * Math.PI * 2;
      const radius = 4.5 + (Math.random() - 0.5) * 0.6;
      segment.position.set(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius);
      segment.rotation.y = angle + (Math.random() - 0.5) * 0.4;
      segment.rotation.x = -Math.PI / 2;
      segment.userData.ringData = { duration, elapsedTime: 0, scale: 1 + Math.random() * 0.1 };
      group.add(segment);
    }
    this.overlayGroup.add(group);
    return group;
  }

  /**
   * Create glitch bar shards
   */
  createGlitchBars(count, duration, color) {
    const group = new THREE.Group();
    group.name = 'glitch-bars';
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.PlaneGeometry(0.4, 3.2);
      const material = this._createGlowMaterial(color, 0.45);
      const bar = new THREE.Mesh(geometry, material);
      const angle = (i / count) * Math.PI * 2;
      bar.position.set(Math.cos(angle) * 2.5, 1.0, Math.sin(angle) * 2.5);
      bar.rotation.y = angle + (Math.random() - 0.5) * 0.6;
      bar.rotation.x = -Math.PI / 2;
      bar.userData.beamData = { duration, elapsedTime: 0 };
      group.add(bar);
    }
    this.overlayGroup.add(group);
    return group;
  }

  /**
   * Create a dark shroud overlay with edge disturbance
   */
  createDarkShroud(color, intensity, duration) {
    const darkTint = this.createColorTint(color, intensity, 0.2, duration);
    darkTint.userData.tintData.edgeDisturb = true;
    return darkTint;
  }

  /**
   * Create pressure band overlay
   */
  createPressureBands(count, duration, color) {
    const group = new THREE.Group();
    group.name = 'pressure-bands';
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.PlaneGeometry(28, 1.2);
      const material = this._createGlowMaterial(color, 0.35);
      const band = new THREE.Mesh(geometry, material);
      band.position.set(0, 1.5 + i * 0.6, -32 - i * 1.5);
      band.rotation.x = -Math.PI / 2.7;
      band.userData.beamData = { duration, elapsedTime: 0 };
      group.add(band);
    }
    this.overlayGroup.add(group);
    return group;
  }
  
  /**
   * Create small orbiting motes
   */
  createSmallOrbitingMotes(count, duration, color) {
    const particleGroup = new THREE.Group();
    particleGroup.name = 'orbiting-motes';
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 6, 6);
      const material = this._createGlowMaterial(color, 0.7);
      const particle = new THREE.Mesh(geometry, material);
      tagAllowedSphere(particle, { role: 'vfx', source: 'MetricReactiveWorldEvents.createSmallOrbitingMotes' });
      clampSphere(particle);
      const angle = (i / count) * Math.PI * 2;
      const radius = 4 + Math.random() * 2;
      particle.position.set(Math.cos(angle) * radius, 1.5 + Math.random() * 1.5, Math.sin(angle) * radius);
      particle.userData.orbitData = {
        duration,
        elapsedTime: 0,
        angle,
        radius,
        speed: 1.5 + Math.random() * 1.2
      };
      particleGroup.add(particle);
    }
    this.overlayGroup.add(particleGroup);
    return particleGroup;
  }
  
  /**
   * Create orbital particles
   */
  createOrbitalParticles(count, duration, color) {
    const particleGroup = new THREE.Group();
    particleGroup.name = 'orbital-particles';
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = this._createGlowMaterial(color, 0.8);
      
      const particle = new THREE.Mesh(geometry, material);
      tagAllowedSphere(particle, { role: 'vfx', source: 'MetricReactiveWorldEvents.createOrbitalParticles' });
      clampSphere(particle);
      const angle = (i / count) * Math.PI * 2;
      const radius = 3 + Math.random() * 2;
      
      particle.position.set(
        Math.cos(angle) * radius,
        2 + Math.random() * 3,
        Math.sin(angle) * radius
      );
      
      particle.userData.particleData = {
        angle,
        radius,
        duration,
        elapsedTime: 0,
        orbitalSpeed: Math.random() * 2 + 1
      };
      
      particleGroup.add(particle);
    }
    
    this.overlayGroup.add(particleGroup);
  }
  
  /**
   * Create floating particles
   */
  createFloatingParticles(count, duration, color) {
    const particleGroup = new THREE.Group();
    particleGroup.name = 'floating-particles';
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 6, 6);
      const material = this._createGlowMaterial(color, 0.7);
      
      const particle = new THREE.Mesh(geometry, material);
      tagAllowedSphere(particle, { role: 'vfx', source: 'MetricReactiveWorldEvents.createFloatingParticles' });
      clampSphere(particle);
      particle.position.set(
        (Math.random() - 0.5) * 10,
        Math.random() * 5,
        (Math.random() - 0.5) * 10
      );
      
      particle.userData.floatData = {
        duration,
        elapsedTime: 0,
        driftY: Math.random() * 2 + 1,
        driftX: (Math.random() - 0.5) * 1
      };
      
      particleGroup.add(particle);
    }
    
    this.overlayGroup.add(particleGroup);
  }
  
  /**
   * Create sky glyph
   */
  createSkyGlyph(glyphChar, duration) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 200px Arial';
    ctx.fillStyle = '#00dd99';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyphChar, 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = this._createGlowMaterial(0x00dd99, 0.8, { map: texture });
    
    const geometry = new THREE.PlaneGeometry(5, 5);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 15, -20);
    mesh.renderOrder = 1;
    
    mesh.userData.glyphData = { duration, elapsedTime: 0 };
    
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Create spiral glyph
   */
  createSpiralGlyph(duration) {
    // Create spiral line visual
    const geometry = new THREE.BufferGeometry();
    const points = [];
    
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 4;
      const radius = i / 20;
      points.push(
        Math.cos(angle) * radius,
        i / 50,
        Math.sin(angle) * radius
      );
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    const material = this._createGlowLine(0x9900ff, 0.6);
    const line = new THREE.Line(geometry, material);
    
    line.position.set(0, 5, 0);
    line.userData.spiralData = { duration, elapsedTime: 0 };
    
    this.overlayGroup.add(line);
  }
  
  /**
   * Create rotating particles
   */
  createRotatingParticles(count, duration, color) {
    const particleGroup = new THREE.Group();
    particleGroup.name = 'rotating-particles';
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.12, 8, 8);
      const material = this._createGlowMaterial(color, 0.7);
      
      const particle = new THREE.Mesh(geometry, material);
      tagAllowedSphere(particle, { role: 'vfx', source: 'MetricReactiveWorldEvents.createRotatingParticles' });
      clampSphere(particle);
      const angle = (i / count) * Math.PI * 2;
      
      particle.position.set(
        Math.cos(angle) * 4,
        0,
        Math.sin(angle) * 4
      );
      
      particle.userData.rotateData = {
        angle,
        duration,
        elapsedTime: 0,
        rotationSpeed: Math.random() * 3 + 2
      };
      
      particleGroup.add(particle);
    }
    
    this.overlayGroup.add(particleGroup);
  }
  
  /**
   * Create radial gradient overlay
   */
  createRadialGradient(maxIntensity, fadeOutDuration, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 180);
    gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = this._createGlowMaterial(0xffffff, maxIntensity, { map: texture });
    
    const geometry = new THREE.PlaneGeometry(50, 50);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -40;
    mesh.renderOrder = 0;
    
    return mesh;
  }
  
  /**
   * Create void fragments
   */
  createVoidFragments(count, duration, color) {
    const particleGroup = new THREE.Group();
    particleGroup.name = 'void-fragments';
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.15, 4, 4);
      const material = this._createGlowMaterial(color, 0.55);
      
      const particle = new THREE.Mesh(geometry, material);
      tagAllowedSphere(particle, { role: 'vfx', source: 'MetricReactiveWorldEvents.createVoidFragments' });
      clampSphere(particle);
      particle.position.set(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 10
      );
      
      particle.userData.voidData = {
        duration,
        elapsedTime: 0,
        driftY: Math.random() * 3 + 2
      };
      
      particleGroup.add(particle);
    }
    
    this.overlayGroup.add(particleGroup);
  }
  
  /**
   * Create magenta line (visual overlay)
   */
  createMagentaLine(duration) {
    const geometry = new THREE.BufferGeometry();
    const points = [];
    
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * 40 - 20;
      points.push(x, -1, 0);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    const material = this._createGlowLine(0xdd0099, 0.5);
    const line = new THREE.Line(geometry, material);
    
    line.userData.lineData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(line);
  }
  
  /**
   * Create expanding ring
   */
  createExpandingRing(duration, color) {
    const geometry = new THREE.RingGeometry(0.5, 1.0, 32);
    const material = this._createGlowMaterial(color, 0.8);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0;
    mesh.rotation.x = Math.PI / 2.5;
    
    mesh.userData.ringData = { duration, elapsedTime: 0, scale: 1 };
    
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Create arc sweep
   */
  createArcSweep(duration, color) {
    const geometry = new THREE.BufferGeometry();
    const points = [];
    
    for (let i = 0; i <= 60; i++) {
      const angle = (i / 60) * Math.PI;
      const radius = 30;
      points.push(
        Math.cos(angle) * radius,
        10,
        Math.sin(angle) * radius
      );
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    const material = this._createGlowLine(color, 0.5);
    const line = new THREE.Line(geometry, material);
    
    line.userData.arcData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(line);
  }
  
  /**
   * Create golden glyph
   */
  createGoldenGlyph(glyphChar, duration) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(0.5, '#ffdd00');
    gradient.addColorStop(1, '#ffff00');
    
    ctx.font = 'bold 400px Arial';
    ctx.fillStyle = gradient;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyphChar, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = this._createGlowMaterial(0xffdd00, 0.9, { map: texture });
    
    const geometry = new THREE.PlaneGeometry(10, 10);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 20, -30);
    mesh.renderOrder = 2;
    
    mesh.userData.goldenData = { duration, elapsedTime: 0, pulsePhase: 0 };
    
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Create sky beam
   */
  createSkyBeam(duration) {
    const geometry = new THREE.PlaneGeometry(0.5, 30);
    const material = this._createGlowMaterial(0xaa00ff, 0.6);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(Math.random() * 20 - 10, 15, Math.random() * 20 - 10);
    mesh.rotation.z = Math.random() * 0.3 - 0.15;
    
    mesh.userData.beamData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Update active effects
   */
  updateActiveEffects(deltaTime) {
    const toRemove = [];

    const updateObject = (obj) => {
      const dataKey = Object.keys(obj.userData || {}).find((key) => key.endsWith('Data'));
      if (dataKey) {
        const data = obj.userData[dataKey];
        data.elapsedTime += deltaTime;
        const progress = data.duration > 0 ? data.elapsedTime / data.duration : 0;

        if (obj.material) {
          obj.material.opacity = Math.max(0, (obj.material.opacity ?? 1) * (1 - progress));
        }

        if (obj.userData.orbitData) {
          const orbit = obj.userData.orbitData;
          const angle = orbit.angle + orbit.speed * orbit.elapsedTime;
          obj.position.x = Math.cos(angle) * orbit.radius;
          obj.position.z = Math.sin(angle) * orbit.radius;
        }

        if (obj.userData.ringData) {
          obj.scale.setScalar(1 + progress * 0.35);
        }

        if (obj.userData.haloData) {
          obj.scale.setScalar(1 + progress * 0.2);
        }

        if (data.elapsedTime > data.duration) {
          toRemove.push(obj);
        }
      }

      if (obj.children && obj.children.length > 0) {
        obj.children.forEach(updateObject);
      }
    };

    this.overlayGroup.children.forEach(updateObject);

    // Remove expired effects and clean empty groups
    toRemove.forEach(obj => {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      obj.geometry?.dispose();
      obj.material?.dispose();
    });

    this.overlayGroup.children.slice().forEach(child => {
      if (child.children && child.children.length === 0) {
        this.overlayGroup.remove(child);
      }
    });
  }
  
  /**
   * Register effect for tracking
   */
  registerEffect(name, mesh, duration) {
    mesh.userData.effectData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Apply bloom pulse (shader-based, safe)
   */
  applyBloomPulse(intensity, fadeInDuration, fadeOutDuration) {
    // Note: In production, this would interact with post-processing
    // For safety, we store the intent and let the renderer decide
    this.overlayGroup.userData.bloomPulse = {
      intensity,
      fadeInDuration,
      fadeOutDuration,
      elapsedTime: 0
    };
  }
  
  /**
   * Apply halo effect
   */
  applyHaloEffect(duration, color) {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = this._createGlowMaterial(color, 0.25, { side: THREE.BackSide });
    
    const halo = new THREE.Mesh(geometry, material);
    tagAllowedSphere(halo, { role: 'vfx', source: 'MetricReactiveWorldEvents.applyHaloEffect' });
    clampSphere(halo);
    halo.scale.multiplyScalar(3);
    halo.userData.haloData = { duration, elapsedTime: 0 };
    
    this.overlayGroup.add(halo);
  }
  
  /**
   * Apply distortion overlay
   */
  createDistortionOverlay(strength, fadeInDuration, fadeOutDuration) {
    // Create minimal distortion mesh
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = this._createGlowMaterial(0xffffff, strength);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -40;
    
    return mesh;
  }
  
  /**
   * Apply node dimming
   */
  applyNodeDimming(intensity, fadeInDuration, fadeOutDuration) {
    // Store intent in userData
    this.overlayGroup.userData.nodeDimming = {
      intensity,
      fadeInDuration,
      fadeOutDuration,
      elapsedTime: 0
    };
  }
  
  /**
   * Apply horizon pulse
   */
  applyHorizonPulse(color, intensity, duration) {
    const geometry = new THREE.PlaneGeometry(200, 20);
    const material = this._createGlowMaterial(color, intensity);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, -50);
    mesh.position.y = 0;
    
    mesh.userData.pulseData = { duration, elapsedTime: 0 };
    this.overlayGroup.add(mesh);
  }
  
  /**
   * Apply link thickening (visual overlay only)
   */
  applyLinkThickening(thickness, fadeInDuration, fadeOutDuration) {
    this.overlayGroup.userData.linkThickening = {
      thickness,
      fadeInDuration,
      fadeOutDuration,
      elapsedTime: 0
    };
  }
  
  /**
   * Apply link intensification
   */
  applyLinkIntensification(duration) {
    this.overlayGroup.userData.linkIntensification = {
      duration,
      elapsedTime: 0,
      intensity: 0.5
    };
  }
  
  /**
   * Update performance monitor
   */
  updatePerformanceMonitor(elapsed) {
    const { performanceMonitor } = this;
    performanceMonitor.updateCount++;
    performanceMonitor.averageTimeMs = 
      (performanceMonitor.averageTimeMs * (performanceMonitor.updateCount - 1) + elapsed) / 
      performanceMonitor.updateCount;
    performanceMonitor.maxTimeMs = Math.max(performanceMonitor.maxTimeMs, elapsed);
  }
  
  /**
   * Enable events
   */
  enable() {
    this.enabled = true;
    console.log('✓ Metric-Reactive Events enabled');
  }
  
  /**
   * Disable events
   */
  disable() {
    this.enabled = false;
    this.overlayGroup.clear();
    console.log('✓ Metric-Reactive Events disabled');
  }
  
  /**
   * Set debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
  
  /**
   * Get performance stats
   */
  getPerformanceStats() {
    return {
      averageTimeMs: this.performanceMonitor.averageTimeMs.toFixed(3),
      maxTimeMs: this.performanceMonitor.maxTimeMs.toFixed(3),
      updateCount: this.performanceMonitor.updateCount
    };
  }
  
  /**
   * Cleanup
   */
  cleanup() {
    this.overlayGroup.clear();
    this.scene.remove(this.overlayGroup);
    console.log('✓ Metric-Reactive Events cleaned up');
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _emitMetricTag(eventName, value, extra = {}) {
    const bus = this.metricBus || this._resolveMetricBus();
    if (!bus || !eventName) return;

    const payload = {
      scope: 'global',
      eventName,
      value,
      timestamp: performance.now(),
      source: 'MetricReactiveWorldEvents',
      ...extra
    };

    if (typeof bus.emit === 'function') {
      bus.emit(eventName, payload);
      return;
    }

    if (typeof bus.publish === 'function') {
      bus.publish(eventName, payload);
    }
  }
}

