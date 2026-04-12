/**
 * SYNERGY CASCADE PROPAGATION VISUALIZER v1.0
 * 
 * Real-time visualization of synergy energy flowing through linked networks
 * Shows cascading synergy effects as they propagate from high-synergy nodes outward
 * 
 * CORE FEATURES:
 * ✓ Real-time cascade propagation from synergy sources
 * ✓ Dynamic wave visualization along links
 * ✓ Cascade intensity based on synergy scores
 * ✓ Multi-hop propagation with decay
 * ✓ Directional flow particles following cascade paths
 * ✓ Animated shimmer effects on cascade links
 * ✓ Propagation history tracking for visuals
 * ✓ Performance optimized (<3ms per frame for 500+ links)
 * ✓ Console debugging API
 * ✓ Integration with chain reaction system
 * 
 * VISUALIZATION TYPES:
 * 1. Wave Front: Animated pulse traveling along links
 * 2. Cascade Glow: Progressive link brightness intensification
 * 3. Flow Particles: Directional particles following cascade paths
 * 4. Ripple Effect: Concentric rings expanding from cascade source
 * 5. Harmonic Shimmer: Oscillating color bands along links
 * 
 * EVENT FLOW:
 * 1. Receive cascade events from semanticBus
 * 2. Store lightweight visual hops per cascade id
 * 3. Render visual effects from hop payload only
 * 4. Expire visual hops after short duration
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { LinkPointFXBase } from './LinkPointFXBase.js';

export class SynergyCascadeVisualizer {
  constructor(scene, linkingSystem, camera) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.camera = camera;
    
    // UNIFIED CLEANUP CONTRACT - Track all created objects
    this._createdObjects = [];
    
    // Cascade tracking
    this.activeCascades = [];        // Active cascade propagations
    this.cascadeHistory = new Map(); // link → cascade history for visuals
    this.cascadeId = 0;             // Unique cascade identifiers
    
    // Performance tracking
    this.stats = {
      activeCascades: 0,
      linksAffected: 0,
      particlesActive: 0,
      lastUpdateTime: 0,
      framesProcessed: 0,
      forcedBurstSpawns: 0,
      forcedFlowSpawns: 0
    };
    
    // Configuration
    this.config = {
      enabled: true,
      detectionThreshold: 0.7,       // Legacy debug setting (visual only system)
      maxCascadeDistance: 5,         // Legacy debug setting (visual only system)
      baseIntensity: 1.0,            // Legacy debug setting (visual only system)
      decayPerHop: 0.75,             // Legacy debug setting (visual only system)
      propagationSpeed: 2.0,         // Speed of cascade traveling along link (units/sec)
      waveWidth: 0.42,               // Width of cascade wave front
      
      // Visual effects
      visualizations: {
        waveFront: true,              // Animated pulse along links
        cascadeGlow: true,             // Progressive brightness
        flowParticles: true,           // Directional particles
        burstParticles: true,          // Compact burst at cascade start / hop
        rippleEffect: true,            // Expanding rings
        harmonicShimmer: true          // Oscillating colors
      },
      
      // Particle system
      particleCount: 10,              // Particles per active cascade
      particleSpeed: 1.2,             // Multiplier on propagation speed
      particleLifetime: 1.45,         // Seconds
      
      // Color scheme
      cascadeColor: new THREE.Color(0xffb11a), // Warm amber for cascade body
      waveColor: new THREE.Color(0xfff3c4),    // Bright gold for pulse head
      fadeColor: new THREE.Color(0xff6f22),    // Ember orange for fade / dust
      cascadeGlowAmbientBoost: 0.28,           // Extra ambient glow strength on cascade trails
      cascadeGlowHaloStrength: 0.42,           // Soft halo multiplier for link glow
      cascadeGlowHaloRadius: 0.18,             // Soft radius factor for glow halo
      rippleHaloScale: 1.18,                   // Additional scale factor for ripple halo ring
      rippleHaloOpacity: 0.12,                 // Base halo opacity for expanded ripple
      particleGlowSizeBoost: 1.12,             // Particle size boost for more luminous trails
      burstGlowSoftness: 0.82,                 // Softness of burst particle glow
      
      // Performance
      batchSize: 30,                  // Update cascades in batches
      updateFrequency: 1,             // Update every N frames
      maxActiveCascades: 50,          // Max simultaneous cascades
      maxActiveParticles: 240,        // Hard cap for live particle meshes
      hopLifetime: 0.7,               // Seconds each hop stays visually active
      forcedFlowIntervalSeconds: 3.0, // Forced flow cadence per live link
      forcedFlowIntensity: 1.0,        // Baseline visible flow intensity
      forcedFlowCountMultiplier: 5.2,
      forcedFlowRadiusMultiplier: 4.6,
      forcedFlowLifetimeMultiplier: 2.35,
      forcedFlowSpeedMultiplier: 2.85,
      forcedBurstIntervalSeconds: 5.0, // Forced burst cadence per live link
      minBurstIntensity: 0.06,        // Ignore ultra-weak bursts
      echoRippleCount: 3,
      echoRippleSpacing: 0.46,
      echoRippleVerticalOffset: 0.07,
      echoRippleRadiusStep: 0.48,
      echoRippleOpacityFalloff: 0.12,
      echoRippleCooldownSeconds: 3.0,
      topologyBiasRippleCount: 3,
      topologyBiasRippleRadiusStep: 0.32,
      topologyBiasRippleOpacityScale: 0.30,
      topologyBiasRippleCooldownSeconds: 2.4,
      topologyBiasRippleColor: new THREE.Color(0x18265f),
      topologyBiasRippleAccentColor: new THREE.Color(0x14d3dd),
      topologyBiasRippleWarmColor: new THREE.Color(0xd98b2a)
    };
    
    // Cascade particles
    this.cascadeParticles = [];
    this.particlePool = [];
    this.maxPoolSize = 240;
    this.burstParticleSystem = null;
    this.burstPointFXBase = new LinkPointFXBase(this.scene, {
      renderLayer: 'LINK_PARTICLES',
      preset: 'spark',
      capacity: this.config.maxActiveParticles ?? 240,
      textureKind: 'spark'
    });
    this.flowParticles = [];
    this.flowParticlePool = [];
    this.flowParticleSystem = null;
    this.flowPointFXBase = new LinkPointFXBase(this.scene, {
      renderLayer: 'LINK_PARTICLES',
      preset: 'cascade',
      capacity: this.config.maxActiveParticles ?? 240,
      textureKind: 'cascade'
    });

    // Ripple effect system
    this.ripples = [];
    this._rippleCooldownByLinkId = new Map();
    this._echoRippleCooldownByLinkId = new Map();
    this._topologyBiasCooldownByKey = new Map();
    this._burstCooldownByLinkId = new Map();
    this._forcedBurstCooldownByLinkId = new Map();
    this._forcedFlowCooldownByLinkId = new Map();
    this._flowCooldownByLinkId = new Map();
    
    // Frame counter
    this.frameCounter = 0;
    this._semanticBus = null;
    this._semanticHandlers = null;
    
    // Debug mode
    this.debugMode = false;
    
    console.log('✅ SynergyCascadeVisualizer initialized');
    this._initBurstParticleSystem();
    this._initFlowParticleSystem();
    this.bindSemanticEvents();
    this.setupConsoleAPI();
  }
  
  /**
   * Main update function - call once per frame
   */
  update(deltaTime) {
    if (!this._semanticBus && globalThis?.semanticBus) {
      this.bindSemanticEvents();
    }

    if (this.frameScheduler?.shouldRunVisual?.() === false) return;

    if (!this.config.enabled || !this.linkingSystem) return;
    
    this.frameCounter++;
    this.stats.framesProcessed++;
    
    // Skip frames based on update frequency
    if (this.frameCounter % this.config.updateFrequency !== 0) {
      return;
    }
    
    const startTime = performance.now();
    
    // Update active cascades
    this.updateActiveCascades(deltaTime);
    this._updateCascadeHistoryHeartbeats(deltaTime);
    
    // Update cascade particles
    this.updateCascadeParticles(deltaTime);
    this.updateFlowParticles(deltaTime);
    
    // Update ripple effects
    this.updateRipples(deltaTime);
    
    // Cleanup dead cascades
    this.cleanupInactiveCascades();
    
    this.stats.lastUpdateTime = performance.now() - startTime;
    this.stats.activeCascades = this.activeCascades.length;
    this.stats.particlesActive = this.cascadeParticles.length + this.flowParticles.length;
  }

  _updateCascadeHistoryHeartbeats(deltaTime) {
    if (this.cascadeHistory.size === 0) return;

    for (const [link, history] of this.cascadeHistory.entries()) {
      if (!link) continue;

      const linkId = this._resolveLinkId(link);
      if (!linkId) continue;

      const linkIntensity = this._clamp01(Math.max(
        this._readLinkSynergy(link),
        link?.userData?.cascadeIntensity ?? 0,
        link?.userData?.flowState?.intensity ?? 0,
        history?.cascadeIntensity ?? 0
      ));
      const band = this._getSynergyCascadeBand(linkIntensity) ?? this._getVisibleCascadeFloorBand(linkIntensity);
      if (!band) continue;

      const sourcePos = this._asVector3(history?.sourcePosition ?? null)
        ?? this._asVector3(
          link?.source?.position ??
          link?.sourceNode?.position ??
          link?.nodeA?.position ??
          null
        );
      const targetPos = this._asVector3(history?.targetPosition ?? null)
        ?? this._asVector3(
          link?.target?.position ??
          link?.targetNode?.position ??
          link?.nodeB?.position ??
          null
        );
      const heartbeatSide = history?.lastHeartbeatSide === 'target' ? 'source' : 'target';
      const anchor = heartbeatSide === 'source'
        ? (sourcePos ?? targetPos ?? this._asVector3(history?.anchor ?? null))
        : (targetPos ?? sourcePos ?? this._asVector3(history?.anchor ?? null));
      if (!anchor) continue;

      if (this.config.visualizations.rippleEffect && this._canTriggerLinkEffect(this._rippleCooldownByLinkId, linkId, band.rippleCooldownSeconds)) {
        this._spawnRippleCluster(anchor, Math.max(0.1, linkIntensity), band.rippleCount, { ...band, flatRipple: true });
      }

      if (this.config.visualizations.flowParticles && this._canTriggerLinkEffect(
        this._forcedFlowCooldownByLinkId,
        linkId,
        this.config.forcedFlowIntervalSeconds
      )) {
        const flowCycleIndex = Number.isFinite(history?.forcedFlowCycleIndex) ? history.forcedFlowCycleIndex : 0;
        const flowCycleProfiles = [
          { name: 'small', intensityMultiplier: 0.86, countMultiplier: 0.92, radiusMultiplier: 0.92, lifetimeMultiplier: 0.96, speedMultiplier: 0.98 },
          { name: 'medium', intensityMultiplier: 1.08, countMultiplier: 1.08, radiusMultiplier: 1.08, lifetimeMultiplier: 1.06, speedMultiplier: 1.02 },
          { name: 'large', intensityMultiplier: 1.28, countMultiplier: 1.18, radiusMultiplier: 1.2, lifetimeMultiplier: 1.12, speedMultiplier: 1.06 }
        ];
        const flowCycle = flowCycleProfiles[flowCycleIndex % flowCycleProfiles.length];
        this.stats.forcedFlowSpawns++;
        this.spawnFlowParticles({
          link,
          cascadeIntensity: linkIntensity,
          intensity: Math.max(this.config.forcedFlowIntensity, linkIntensity) * flowCycle.intensityMultiplier,
          position: 0.08,
          startPosition: sourcePos ?? anchor,
          targetPosition: targetPos ?? anchor,
          boost: this.config.forcedFlowIntensity * flowCycle.intensityMultiplier,
          cascadeParticleEmissionBoost: this.config.forcedFlowCountMultiplier * flowCycle.countMultiplier,
          forcedFlowProfile: flowCycle,
          flowHeartbeat: true,
          forcedFlow: true
        }, history);
        history.forcedFlowCycleIndex = (flowCycleIndex + 1) % flowCycleProfiles.length;
      }

      if (this.config.visualizations.burstParticles && this._canTriggerLinkEffect(
        this._forcedBurstCooldownByLinkId,
        linkId,
        this.config.forcedBurstIntervalSeconds
      )) {
        this.stats.forcedBurstSpawns++;
        this.spawnBurstParticles(anchor, Math.max(0.25, linkIntensity), {
          link,
          cascadeIntensity: linkIntensity,
          intensity: linkIntensity,
          forcedBurst: true
        }, {
          countMultiplier: 2.0,
          intensityMultiplier: 1.0,
          radiusMultiplier: 1.22,
          lifetimeMultiplier: 1.0,
          speedMultiplier: 1.0
        });
      }

      if (this.config.visualizations.flowParticles && this._canTriggerLinkEffect(this._flowCooldownByLinkId, linkId, band.flowCooldownSeconds)) {
        const sourceAnchor = sourcePos ?? targetPos ?? anchor;
        const targetAnchor = targetPos ?? sourcePos ?? anchor;
        if (sourceAnchor && targetAnchor) {
          this.spawnFlowParticles({
            link,
            intensity: Math.max(0.18, linkIntensity * band.flowIntensityMultiplier),
            position: 0.12,
            startPosition: sourceAnchor,
            targetPosition: targetAnchor,
            boost: band.flowIntensityMultiplier,
            cascadeParticleEmissionBoost: band.flowIntensityMultiplier,
            flowHeartbeat: true
          }, history);
        }
      }

      history.anchor = anchor.clone ? anchor.clone() : anchor;
      history.lastSeenAt = this._nowSeconds();
      history.lastHeartbeatAt = history.lastSeenAt;
      history.lastHeartbeatSide = heartbeatSide;
    }
  }
  
  /**
   * Detect nodes with high synergy that should trigger cascades
   */
  bindSemanticEvents() {
    const semanticBus = globalThis?.semanticBus;
    if (!semanticBus) return;
    const on = semanticBus.on?.bind(semanticBus);
    if (!on) return;

    if (this._semanticBus === semanticBus && this._semanticHandlers) {
      return;
    }

    this._unbindSemanticEvents();

    this._semanticBus = semanticBus;
    this._semanticHandlers = {
      onCascadeHop: (event = {}) => this.renderCascadeHop(event),
      onCascadeStart: (event = {}) => this.renderCascadeStart(event),
      onCascadeEnd: (event = {}) => this.renderCascadeEnd(event),
      onLinkCreated: (event = {}) => this._handleLinkCreated(event),
      onLinkHarmonyTier: (event = {}) => this.renderLinkHarmonyEcho(event),
      onTopologyBiasSnapshot: (event = {}) => this.applyTopologyBiasSnapshot(event)
    };
    on('cascade.hop', this._semanticHandlers.onCascadeHop);
    on('cascade.start', this._semanticHandlers.onCascadeStart);
    on('cascade.end', this._semanticHandlers.onCascadeEnd);
    on('link.created', this._semanticHandlers.onLinkCreated);
    on('link.harmony.low', this._semanticHandlers.onLinkHarmonyTier);
    on('link.harmony.mid', this._semanticHandlers.onLinkHarmonyTier);
    on('link.harmony.high', this._semanticHandlers.onLinkHarmonyTier);
    on('topology.bias.snapshot', this._semanticHandlers.onTopologyBiasSnapshot);
  }

  _unbindSemanticEvents() {
    const bus = this._semanticBus;
    const handlers = this._semanticHandlers;
    if (!bus || !handlers) return;

    const off = bus.off?.bind(bus) || bus.unsubscribe?.bind(bus);
    if (off) {
      try { off('cascade.hop', handlers.onCascadeHop); } catch (_) {}
      try { off('cascade.start', handlers.onCascadeStart); } catch (_) {}
      try { off('cascade.end', handlers.onCascadeEnd); } catch (_) {}
      try { off('link.created', handlers.onLinkCreated); } catch (_) {}
      try { off('link.harmony.low', handlers.onLinkHarmonyTier); } catch (_) {}
      try { off('link.harmony.mid', handlers.onLinkHarmonyTier); } catch (_) {}
      try { off('link.harmony.high', handlers.onLinkHarmonyTier); } catch (_) {}
      try { off('topology.bias.snapshot', handlers.onTopologyBiasSnapshot); } catch (_) {}
    }

    this._semanticBus = null;
    this._semanticHandlers = null;
  }

  _resolveCascadeNodeId(nodeOrId) {
    if (!nodeOrId) return null;
    if (typeof nodeOrId === 'string' || typeof nodeOrId === 'number') {
      return String(nodeOrId);
    }

    return (
      nodeOrId.userData?.nodeId ??
      nodeOrId.userData?.id ??
      nodeOrId.id ??
      nodeOrId.uuid ??
      null
    );
  }

  _resolveHookAnchor(node, signals = {}) {
    return this._asVector3(
      signals.anchor ??
      signals.position ??
      node?.position ??
      node?.worldPosition ??
      null
    );
  }

  _resolveHookIntensity(signals = {}, fallback = 0) {
    const resolved = Number.isFinite(Number(signals.intensity))
      ? Number(signals.intensity)
      : Number.isFinite(Number(signals.cascadeIntensity))
        ? Number(signals.cascadeIntensity)
        : fallback;
    return this._clamp01(resolved);
  }

  _nowSeconds() {
    return (performance?.now?.() ?? Date.now()) / 1000;
  }

  _readLinkSynergy(linkOrEvent = null) {
    const source = linkOrEvent?.link ?? linkOrEvent ?? null;
    const candidates = [
      source?.userData?.synergy,
      source?.userData?.metrics?.synergy,
      source?.userData?.metrics?.averageSynergy,
      source?.userData?.metrics?.avgSynergy,
      source?.userData?.metrics?.synergyScore,
      source?.userData?.visualMetrics?.synergy,
      source?.userData?.visualMetrics?.synergyNorm,
      source?.userData?.flowState?.intensity,
      source?.userData?.phaseSyncStrength,
      source?.userData?.waveIntensity,
      source?.synergy,
      source?.userData?.cascadeIntensity,
      linkOrEvent?.synergy,
      linkOrEvent?.cascadeIntensity,
      linkOrEvent?.intensity,
      linkOrEvent?.phaseSyncStrength,
      linkOrEvent?.phaseSyncStability,
      linkOrEvent?.waveIntensity,
      linkOrEvent?.smoothWaveIntensity
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return this._clamp01(candidate);
      }
      if (candidate && typeof candidate === 'object') {
        const nestedCandidates = [
          candidate.score,
          candidate.averageSynergy,
          candidate.avgSynergy,
          candidate.synergyNorm,
          candidate.value,
          candidate.intensity,
          candidate.phaseSyncStrength,
          candidate.waveIntensity
        ];
        for (const nested of nestedCandidates) {
          if (typeof nested === 'number' && Number.isFinite(nested)) {
            return this._clamp01(nested);
          }
        }
      }
    }

    return 0;
  }

  _resolveCascadeSignalIntensity(event = {}) {
    const candidates = [
      event.intensity,
      event.value,
      event.cascadeIntensity,
      event.phaseSyncStrength,
      event.phaseSyncStability,
      event.waveIntensity,
      event.smoothWaveIntensity,
      event.link?.userData?.cascadeIntensity,
      event.link?.userData?.flowState?.intensity,
      event.link?.userData?.phaseSyncStrength,
      event.link?.userData?.waveIntensity,
      event.link?.userData?.smoothWaveIntensity
    ];

    let resolved = 0;
    for (const candidate of candidates) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric)) {
        resolved = Math.max(resolved, numeric);
      }
    }

    return this._clamp01(resolved);
  }

  _getSynergyCascadeBand(synergy) {
    const value = this._clamp01(synergy);
    if (value >= 0.3) {
      return {
        name: 'triple',
        threshold: 0.3,
        rippleCount: 3,
        rippleCooldownSeconds: 2.0,
        rippleRadiusStep: 0.08,
        rippleHeightStep: 0.02,
        rippleOpacityStep: 0.14,
        flowCooldownSeconds: 1.2,
        flowIntensityMultiplier: 1.32,
        burstCooldownSeconds: 5.0,
        burstCountMultiplier: 1.28,
        burstIntensityMultiplier: 1.2,
        burstRadiusMultiplier: 1.1
      };
    }

    if (value >= 0.2) {
      return {
        name: 'double',
        threshold: 0.2,
        rippleCount: 2,
        rippleCooldownSeconds: 2.0,
        rippleRadiusStep: 0.06,
        rippleHeightStep: 0.018,
        rippleOpacityStep: 0.12,
        flowCooldownSeconds: 1.5,
        flowIntensityMultiplier: 1.18,
        burstCooldownSeconds: 5.0,
        burstCountMultiplier: 1.12,
        burstIntensityMultiplier: 1.08,
        burstRadiusMultiplier: 1.0
      };
    }

    if (value >= 0.1) {
      return {
        name: 'single',
        threshold: 0.1,
        rippleCount: 1,
        rippleCooldownSeconds: 2.0,
        rippleRadiusStep: 0.0,
        rippleHeightStep: 0.0,
        rippleOpacityStep: 0.0,
        flowCooldownSeconds: 1.9,
        flowIntensityMultiplier: 1.08,
        burstCooldownSeconds: 5.0,
        burstCountMultiplier: 0.98,
        burstIntensityMultiplier: 0.98,
        burstRadiusMultiplier: 0.92
      };
    }

    return null;
  }

  _getVisibleCascadeFloorBand(intensity) {
    const value = this._clamp01(intensity);
    if (value < 0.05) {
      return null;
    }

    const rippleCount = value >= 0.7 ? 2 : 1;
    const burstCooldownSeconds = 5.0;

    return {
      name: 'floor',
      threshold: 0.18,
      rippleCount,
      rippleCooldownSeconds: 2.0,
      rippleRadiusStep: value >= 0.7 ? 0.05 : 0.0,
      rippleHeightStep: value >= 0.7 ? 0.015 : 0.0,
      rippleOpacityStep: value >= 0.7 ? 0.1 : 0.0,
      flowCooldownSeconds: value >= 0.7 ? 2.0 : 2.8,
      flowIntensityMultiplier: value >= 0.7 ? 1.12 : 1.0,
      burstCooldownSeconds,
      burstCountMultiplier: value >= 0.7 ? 0.9 : 0.8,
      burstIntensityMultiplier: Math.max(0.82, value * 1.02),
      burstRadiusMultiplier: 0.84 + value * 0.08
    };
  }

  _seedCascadeHistory(link, intensity = 0, anchor = null) {
    if (!link) return null;
    const linkId = this._resolveLinkId(link);
    if (!linkId) return null;

    if (!this.cascadeHistory.has(link)) {
      const sourcePosition = this._asVector3(
        link?.source?.position ??
        link?.sourceNode?.position ??
        link?.nodeA?.position ??
        null
      );
      const targetPosition = this._asVector3(
        link?.target?.position ??
        link?.targetNode?.position ??
        link?.nodeB?.position ??
        null
      );
      this.cascadeHistory.set(link, {
        linkId,
        cascadeIntensity: 0,
        trailIntensity: 0,
        color: new THREE.Color(),
        lastSeenAt: this._nowSeconds(),
        lastHeartbeatAt: this._nowSeconds(),
        anchor: null,
        sourcePosition,
        targetPosition,
        lastHeartbeatSide: 'source'
      });
    }

    const history = this.cascadeHistory.get(link);
    history.linkId = linkId;
    history.cascadeIntensity = Math.max(history.cascadeIntensity || 0, this._clamp01(intensity));
    history.lastSeenAt = this._nowSeconds();
    if (anchor) {
      history.anchor = this._asVector3(anchor) || history.anchor || null;
    }

    history.sourcePosition = this._asVector3(
      link?.source?.position ??
      link?.sourceNode?.position ??
      link?.nodeA?.position ??
      history.sourcePosition ??
      null
    ) || history.sourcePosition || null;
    history.targetPosition = this._asVector3(
      link?.target?.position ??
      link?.targetNode?.position ??
      link?.nodeB?.position ??
      history.targetPosition ??
      null
    ) || history.targetPosition || null;
    return history;
  }

  _canTriggerLinkEffect(store, linkId, cooldownSeconds) {
    if (!linkId) return true;
    const now = this._nowSeconds();
    const last = store.get(linkId);
    if (last !== undefined && (now - last) < cooldownSeconds) {
      return false;
    }
    store.set(linkId, now);
    return true;
  }

  _spawnRippleCluster(anchor, intensity, count, options = {}) {
    const rippleCount = Math.max(1, Math.min(3, Math.floor(Number(count) || 1)));
    const radiusStep = Number(options.radiusStep ?? 0.06) || 0;
    const heightStep = Number(options.heightStep ?? 0.018) || 0;
    const opacityStep = Number(options.opacityStep ?? 0.12) || 0;
    const intensityScale = Math.max(0.1, Number(options.intensityScale ?? 1.0) || 1.0);
    const flatRipple = options.flatRipple === true;

    for (let i = 0; i < rippleCount; i += 1) {
      const centeredIndex = i - ((rippleCount - 1) * 0.5);
      const rippleIntensity = intensity * intensityScale * (1.0 - Math.abs(centeredIndex) * 0.12);
      this.createRipple(anchor, rippleIntensity, {
        radiusScale: 1.0 + Math.abs(centeredIndex) * radiusStep,
        verticalOffset: flatRipple ? 0 : centeredIndex * heightStep,
        opacityScale: 1.0 - Math.abs(centeredIndex) * opacityStep,
        lifetimeScale: 1.0 - Math.abs(centeredIndex) * 0.06
      });
    }
  }

  _spawnEchoRippleCluster(anchor, intensity, count = 3, options = {}) {
    const rippleCount = Math.max(1, Math.min(3, Math.floor(Number(count) || this.config.echoRippleCount || 3)));
    const spacing = Math.max(0.12, Number(options.spacing ?? this.config.echoRippleSpacing ?? 0.46) || 0.46);
    const verticalOffset = Math.max(0.02, Number(options.verticalOffset ?? this.config.echoRippleVerticalOffset ?? 0.07) || 0.07);
    const radiusStep = Math.max(0.16, Number(options.radiusStep ?? this.config.echoRippleRadiusStep ?? 0.48) || 0.48);
    const opacityFalloff = Math.max(0.04, Number(options.opacityFalloff ?? this.config.echoRippleOpacityFalloff ?? 0.12) || 0.12);
    const intensityScale = Math.max(0.14, Number(options.intensityScale ?? 1.0) || 1.0);
    const radiusScaleBase = Math.max(1.4, Number(options.radiusScaleBase ?? 1.85) || 1.85);
    const lifetimeScaleBase = Math.max(1.0, Number(options.lifetimeScaleBase ?? 1.08) || 1.08);
    const ringColors = Array.isArray(options.colorPalette)
      ? options.colorPalette.filter((entry) => entry?.isColor)
      : null;

    for (let i = 0; i < rippleCount; i += 1) {
      const centeredIndex = i - ((rippleCount - 1) * 0.5);
      const rippleIntensity = intensity * intensityScale * (1.0 - Math.abs(centeredIndex) * 0.08);
      const rippleAnchor = anchor.clone();
      rippleAnchor.x += centeredIndex * spacing;
      rippleAnchor.y += centeredIndex * verticalOffset;
      rippleAnchor.z += Math.sin((i + 1) * 1.37) * (spacing * 0.42);
      const ringColor = ringColors?.[i % ringColors.length] ?? options.color;

      this.createRipple(rippleAnchor, rippleIntensity, {
        color: ringColor,
        radiusScale: radiusScaleBase + Math.abs(centeredIndex) * radiusStep,
        verticalOffset: centeredIndex * verticalOffset * 0.55,
        opacityScale: Math.max(0.34, 1.08 - Math.abs(centeredIndex) * opacityFalloff),
        lifetimeScale: lifetimeScaleBase + Math.abs(centeredIndex) * 0.08
      });
    }
  }

  _getTopologyBiasCooldownKey(position, index = 0) {
    const anchor = this._asVector3(position);
    if (!anchor) return `topology-${index}`;
    return `topology-${Math.round(anchor.x * 2)}:${Math.round(anchor.y * 2)}:${Math.round(anchor.z * 2)}:${index}`;
  }

  _canTriggerTopologyBiasEffect(key, cooldownSeconds) {
    if (!key) return true;
    return this._canTriggerLinkEffect(this._topologyBiasCooldownByKey, key, cooldownSeconds);
  }

  applyTopologyBiasSnapshot(snapshot = {}) {
    if (!snapshot || snapshot.scope !== 'topology') return;

    const influences = Array.isArray(snapshot.recentInfluencePositions)
      ? snapshot.recentInfluencePositions
      : [];
    if (influences.length === 0 && !Number.isFinite(snapshot.activeFlowCells) && !Number.isFinite(snapshot.activeBiasVectors)) {
      return;
    }

    const baseIntensity = this._clamp01(
      Math.max(
        Number(snapshot.stabilityPulse ?? 0) * 0.55,
        Number(snapshot.networkState?.synergy ?? 0) * 0.75,
        Number(snapshot.networkState?.harmony ?? 0) * 0.6,
        (Number(snapshot.activeFlowCells ?? 0) * 0.12) + (Number(snapshot.activeBiasVectors ?? 0) * 0.02)
      )
    );
    const rippleCount = Math.max(1, Math.min(3, Number(this.config.topologyBiasRippleCount) || 2));
    const limit = Math.min(rippleCount, influences.length || rippleCount);
    for (let i = 0; i < limit; i += 1) {
      const inf = influences[i];
      const position = this._asVector3(inf?.position ?? null);
      if (!position) continue;

      const key = this._getTopologyBiasCooldownKey(position, i);
      if (!this._canTriggerTopologyBiasEffect(key, this.config.topologyBiasRippleCooldownSeconds)) {
        continue;
      }

      const intensity = this._clamp01(Math.max(baseIntensity, Number(inf?.strength ?? 0.22), 0.16));
      const colorPalette = [
        this.config.topologyBiasRippleColor,
        this.config.topologyBiasRippleAccentColor,
        this.config.topologyBiasRippleWarmColor
      ].filter((entry) => entry?.isColor);
      const rippleColor = (colorPalette[i % colorPalette.length] || new THREE.Color(0x18265f)).clone();
      const opacityScale = Math.max(
        0.18,
        (this.config.topologyBiasRippleOpacityScale ?? 0.3) * (0.74 - i * 0.08)
      );
      this._spawnEchoRippleCluster(position, intensity, Math.min(2, rippleCount), {
        color: rippleColor,
        colorPalette: [
          new THREE.Color(0x18265f),
          new THREE.Color(0x14d3dd),
          new THREE.Color(0xd98b2a)
        ],
        spacing: 0.18 + i * 0.04,
        verticalOffset: 0.024 + i * 0.012,
        radiusStep: this.config.topologyBiasRippleRadiusStep,
        opacityFalloff: 0.16,
        opacityScale,
        intensityScale: 0.74,
        radiusScaleBase: 1.12,
        lifetimeScaleBase: 0.82
      });
    }
  }

  _resolveHarmonyTierIntensity(event = {}) {
    const rawValue = Number(event.value);
    if (Number.isFinite(rawValue)) {
      return this._clamp01(rawValue);
    }

    const tier = String(event.tier ?? event.phase ?? '').toLowerCase();
    if (tier === 'high') return 0.9;
    if (tier === 'mid' || tier === 'normal') return 0.66;
    if (tier === 'low') return 0.42;
    return 0.7;
  }

  renderLinkHarmonyEcho(event = {}) {
    if (event.__cascadeDirectRendered === true || event.__echoDirectRendered === true) return;

    const link = event.link ?? event.linkRef ?? this._resolveLinkById(event.linkId ?? event.id ?? null);
    if (!link) return;

    const linkId = this._resolveLinkId(link);
    if (!linkId) return;

    const context = this._resolveCascadeSpawnContext({
      ...event,
      link,
      linkRef: link,
      linkId
    }, link, 'start');
    if (!context.anchor) return;

    const intensity = this._clamp01(Math.max(
      this._readLinkSynergy(link),
      this._resolveHarmonyTierIntensity(event),
      this._resolveCascadeSignalIntensity(event)
    ));

    if (!this._canTriggerLinkEffect(this._echoRippleCooldownByLinkId, linkId, this.config.echoRippleCooldownSeconds)) {
      return;
    }

    this._getOrCreateCascade(context.cascadeId, Math.max(0.1, intensity));
    this._seedCascadeHistory(link, intensity, context.anchor);
    this._spawnEchoRippleCluster(context.anchor, Math.max(0.12, intensity), this.config.echoRippleCount, {
      intensityScale: 1.1,
      spacing: this.config.echoRippleSpacing,
      verticalOffset: this.config.echoRippleVerticalOffset,
      radiusStep: this.config.echoRippleRadiusStep,
      opacityFalloff: this.config.echoRippleOpacityFalloff
    });
  }

    _getWorldPositionFromObject(object) {
      if (!object) return null;

      const directWorldPosition = this._asVector3(object.worldPosition ?? null);
      if (directWorldPosition) return directWorldPosition;

      if (typeof object.getWorldPosition === 'function') {
        const worldPosition = new THREE.Vector3();
        try {
          object.getWorldPosition(worldPosition);
          if (this._isValidWorldPosition(worldPosition)) {
            return worldPosition;
          }
        } catch (_) {}
      }

      return this._asVector3(object.position ?? object.anchor ?? object.center ?? object.origin ?? null);
    }

  _resolveCascadeSpawnContext(event = {}, link = null, kind = 'start') {
      const resolvedLink = link ?? event.link ?? event.linkRef ?? this._resolveLinkById(event.linkId ?? event.id);
      const sourceNode = event.sourceNode ?? event.source ?? resolvedLink?.sourceNode ?? resolvedLink?.source ?? null;
      const targetNode = event.targetNode ?? event.target ?? resolvedLink?.targetNode ?? resolvedLink?.target ?? null;

      const sourcePosition = this._asVector3(
        event.sourcePosition ??
        sourceNode?.worldPosition ??
        sourceNode?.position ??
        resolvedLink?.source?.position ??
        resolvedLink?.sourceNode?.position ??
        resolvedLink?.nodeA?.position ??
        null
      ) ?? this._getWorldPositionFromObject(sourceNode ?? resolvedLink?.source ?? resolvedLink?.sourceNode ?? resolvedLink?.nodeA ?? null);

      const targetPosition = this._asVector3(
        event.targetPosition ??
        targetNode?.worldPosition ??
        targetNode?.position ??
        resolvedLink?.target?.position ??
        resolvedLink?.targetNode?.position ??
        resolvedLink?.nodeB?.position ??
        null
      ) ?? this._getWorldPositionFromObject(targetNode ?? resolvedLink?.target ?? resolvedLink?.targetNode ?? resolvedLink?.nodeB ?? null);

      const midpoint = (sourcePosition && targetPosition)
        ? new THREE.Vector3().addVectors(sourcePosition, targetPosition).multiplyScalar(0.5)
        : null;

      const preferredAnchor = kind === 'hop'
        ? (targetPosition ?? sourcePosition ?? midpoint)
        : (sourcePosition ?? targetPosition ?? midpoint);

      const anchor = this._asVector3(event.anchor ?? event.center ?? event.position ?? event.origin)
        ?? midpoint
        ?? preferredAnchor
        ?? this._getWorldPositionFromObject(event.node ?? event.sourceNode ?? event.targetNode ?? resolvedLink?.sourceNode ?? resolvedLink?.targetNode ?? resolvedLink?.source ?? resolvedLink?.target ?? null);

      const rawIntensity = this._resolveCascadeIntensity(event);
      const minVisibleIntensity = kind === 'hop' ? 0.05 : 0.08;
      const intensity = rawIntensity > 0 ? Math.max(rawIntensity, minVisibleIntensity) : minVisibleIntensity;

      return {
        link: resolvedLink,
        cascadeId: event.cascadeId ?? event.id ?? this._resolveLinkId(resolvedLink) ?? `cascade-${++this.cascadeId}`,
      intensity,
      anchor,
      sourcePosition,
      targetPosition
    };
  }

  _handleLinkCreated(event = {}) {
    const link = event.link ?? event.linkRef ?? this._resolveLinkById(event.linkId ?? event.id ?? null);
    if (!link) return;

    if (link.userData?.__cascadeBirthSeeded === true) {
      return;
    }

    const context = this._resolveCascadeSpawnContext({
      ...event,
      link,
      linkRef: link,
      linkId: this._resolveLinkId(link) ?? event.linkId ?? event.id ?? null
    }, link, 'start');
    if (!context.anchor) return;

    const visualIntensity = this._clamp01(Math.max(
      this._readLinkSynergy(link),
      this._resolveCascadeSignalIntensity(event),
      this._resolveCascadeIntensity(event)
    ));
    const band = this._getSynergyCascadeBand(visualIntensity) ?? this._getVisibleCascadeFloorBand(visualIntensity);
    if (!band) return;

    const linkId = this._resolveLinkId(link);
    const cascade = this._getOrCreateCascade(context.cascadeId, Math.max(0.1, visualIntensity));
    const history = this._seedCascadeHistory(link, visualIntensity, context.anchor);
    if (!history) return;

    const hop = {
      link,
      linkId,
      intensity: Math.max(0.1, visualIntensity),
      age: 0,
      duration: this.config.hopLifetime,
      startPosition: context.sourcePosition,
      targetPosition: context.targetPosition,
      createdAt: Date.now(),
      completed: false
    };
    cascade.hops.push(hop);

    if (this.config.visualizations.rippleEffect && this._canTriggerLinkEffect(this._rippleCooldownByLinkId, linkId, band.rippleCooldownSeconds)) {
      this._spawnRippleCluster(context.anchor, Math.max(0.1, visualIntensity), band.rippleCount, band);
    }

    if (this.config.visualizations.burstParticles) {
      this.spawnBurstParticles(context.anchor, Math.max(0.3, visualIntensity), {
        link,
        cascadeIntensity: visualIntensity,
        intensity: visualIntensity,
        forcedBurst: true
      }, {
        countMultiplier: 2.0,
        intensityMultiplier: 1.0,
        radiusMultiplier: 1.22,
        lifetimeMultiplier: 1.0,
        speedMultiplier: 1.0
      });
    }

    if (!link.userData) link.userData = {};
    link.userData.__cascadeBirthSeeded = true;
    link.userData.__cascadeBirthSeededAt = this._nowSeconds();
  }

  applyCascadeSignal(node, signals = {}) {
    if (!node) return;

    const anchor = this._resolveHookAnchor(node, signals);
    const intensity = this._resolveHookIntensity(signals, 0.15);
    if (!anchor || intensity <= 0) return;

    const nodeId = this._resolveCascadeNodeId(node);
    this.renderCascadeStart({
      node,
      nodeId,
      cascadeId: signals.cascadeId ?? nodeId ?? `node-cascade-${++this.cascadeId}`,
      anchor,
      intensity,
      source: node,
      targetNode: node
    });
  }

  applyCascadeLinkSignal(link, signals = {}) {
    if (!link) return;

    const startPosition = this._asVector3(
      signals.sourcePosition ??
      link?.source?.position ??
      link?.sourceNode?.position ??
      link?.nodeA?.position ??
      null
    );
    const targetPosition = this._asVector3(
      signals.targetPosition ??
      link?.target?.position ??
      link?.targetNode?.position ??
      link?.nodeB?.position ??
      null
    );
    const midpoint = (startPosition && targetPosition)
      ? new THREE.Vector3().addVectors(startPosition, targetPosition).multiplyScalar(0.5)
      : null;
    const intensity = this._resolveHookIntensity(signals, 0.12);
    if (intensity <= 0) return;

    const linkId = this._resolveLinkId(link);
    this.renderCascadeHop({
      link,
      linkId,
      cascadeId: signals.cascadeId ?? linkId ?? `link-cascade-${++this.cascadeId}`,
      intensity,
      anchor: signals.anchor ?? midpoint ?? startPosition ?? targetPosition ?? null,
      sourcePosition: startPosition,
      targetPosition
    });
  }

  _asVector3(value) {
    if (value instanceof THREE.Vector3) {
      return this._isValidWorldPosition(value) ? value.clone() : null;
    }
    if (value && typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') {
      const vec = new THREE.Vector3(value.x, value.y, value.z);
      return this._isValidWorldPosition(vec) ? vec : null;
    }
    if (Array.isArray(value) && value.length >= 3) {
      const x = Number(value[0]);
      const y = Number(value[1]);
      const z = Number(value[2]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
      const vec = new THREE.Vector3(x, y, z);
      return this._isValidWorldPosition(vec) ? vec : null;
    }
    return null;
  }

  _isValidWorldPosition(pos) {
    if (!pos) return false;
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) return false;
    return true;
  }

  _clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  _resolveCascadeIntensity(event = {}) {
    const candidates = [
      event.link?.userData?.cascadeIntensity,
      event.cascadeIntensity,
      event.intensity
    ];

    let resolved = 0;
    for (const candidate of candidates) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric)) {
        resolved = Math.max(resolved, numeric);
      }
    }

    return resolved > 0 ? resolved : 1;
  }

  _resolveCascadeEmissionBoost(event = {}) {
    const candidates = [
      event.link?.userData?.cascadeParticleEmissionBoost,
      event.cascadeParticleEmissionBoost,
      event.boost
    ];

    let resolved = 1;
    for (const candidate of candidates) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) {
        resolved = Math.max(resolved, numeric);
      }
    }

    return resolved;
  }

  _getDistanceLODController() {
    return globalThis?.window?.ATOMA_DISTANCE_LOD || null;
  }

  _getCascadeVisualScale(position) {
    const anchor = this._asVector3(position);
    const controller = this._getDistanceLODController();
    if (anchor && controller?.getLODLevel) {
      const lodLevel = Number(controller.getLODLevel(anchor));
      if (Number.isFinite(lodLevel)) {
        if (lodLevel >= 3) return 0.28;
        if (lodLevel >= 2) return 0.45;
        if (lodLevel >= 1) return 0.72;
      }
    }

    const cameraPos = this._asVector3(this.camera?.position ?? null);
    if (!anchor || !cameraPos) return 1.0;

    const distance = cameraPos.distanceTo(anchor);
    if (distance > 180) return 0.32;
    if (distance > 120) return 0.52;
    if (distance > 75) return 0.78;
    return 1.0;
  }

  _getParticleSpawnBudget(position, intendedCount = 1, activeCount = this.cascadeParticles.length) {
    const remaining = Math.max(0, (this.config.maxActiveParticles ?? 240) - Math.max(0, activeCount));
    if (remaining <= 0) return 0;

    const scale = this._getCascadeVisualScale(position);
    const scaledCount = Math.ceil(Math.max(1, intendedCount) * scale);
    return Math.max(0, Math.min(remaining, scaledCount));
  }

  _createBurstTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 64, 64);
    ctx.globalCompositeOperation = 'lighter';

    const center = 32;
    const outer = ctx.createRadialGradient(center, center, 2, center, center, 30);
    outer.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    outer.addColorStop(0.18, 'rgba(255,238,180,0.98)');
    outer.addColorStop(0.42, 'rgba(255,162,64,0.70)');
    outer.addColorStop(0.72, 'rgba(255,64,32,0.28)');
    outer.addColorStop(1.0, 'rgba(0,0,0,0)');

    ctx.fillStyle = outer;
    ctx.fillRect(0, 0, 64, 64);

    ctx.strokeStyle = 'rgba(255,255,255,0.96)';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,130,40,0.85)';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(27, 30, 9.5, 0.15, Math.PI * 1.95);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(38, 34, 9.5, Math.PI * 1.1, Math.PI * 0.75, true);
    ctx.stroke();

    ctx.lineWidth = 2.0;
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    ctx.moveTo(21, 26);
    ctx.lineTo(44, 42);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  _initBurstParticleSystem() {
    if (this.burstParticleSystem) return this.burstParticleSystem;

    const maxParticles = Math.max(32, this.config.maxActiveParticles ?? 240);
    for (let i = 0; i < maxParticles; i++) {
      this.particlePool.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        drift: new THREE.Vector3(),
        active: false,
        age: 0,
        lifetime: 0,
        intensity: 0,
        size: 1,
        color: new THREE.Color(),
        link: null,
        linkId: null,
        cascadeId: null,
        forcedBurst: false,
        phase: 0
      });
    }

    const geometry = this.burstPointFXBase?.createGeometry?.({
      color: { itemSize: 3 },
      alpha: { itemSize: 1 },
      size: { itemSize: 1 }
    }) || new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const alphas = new Float32Array(maxParticles);
    const sizes = new Float32Array(maxParticles);

    const positionAttr = new THREE.BufferAttribute(positions, 3);
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    const alphaAttr = new THREE.BufferAttribute(alphas, 1);
    const sizeAttr = new THREE.BufferAttribute(sizes, 1);

    positionAttr.setUsage(THREE.DynamicDrawUsage);
    colorAttr.setUsage(THREE.DynamicDrawUsage);
    alphaAttr.setUsage(THREE.DynamicDrawUsage);
    sizeAttr.setUsage(THREE.DynamicDrawUsage);

    geometry.setAttribute('position', positionAttr);
    geometry.setAttribute('color', colorAttr);
    geometry.setAttribute('alpha', alphaAttr);
    geometry.setAttribute('size', sizeAttr);
    geometry.setDrawRange(0, 0);

    const material = this.burstPointFXBase.createMaterial({
      preset: 'spark',
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexColors: false,
      uniforms: {
        uBaseSize: { value: 60.0 }
      },
      vertexShader: `
        attribute vec3 color;
        attribute float alpha;
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vSize;
        uniform float uBaseSize;
        uniform float uSizeScale;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float sizeScale = max(0.42, size);
          gl_PointSize = uBaseSize * uSizeScale * sizeScale / max(0.25, -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uOpacity;
        uniform vec3 uBaseColor;
        uniform vec3 uEdgeColor;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vSize;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          float alpha = tex.a * vAlpha * uOpacity;
          if (alpha < 0.01) discard;
          float rim = smoothstep(0.15, 0.85, tex.r);
          vec3 color = mix(uBaseColor, uEdgeColor, rim);
          color *= vColor;
          color *= 1.0 + vSize * 0.08;
          gl_FragColor = vec4(color, alpha);
        }
      `
    });
    material.transparent = true;
    material.depthTest = false;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;
    material.uniforms.uBaseSize = material.uniforms.uBaseSize || { value: 60.0 };

    const points = new THREE.Points(geometry, material);
    points.visible = true;
    points.frustumCulled = false;
    points.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_PARTICLES);
    this.burstPointFXBase?.ensureAttached?.(points) || this.scene?.add?.(points);

    this.burstParticleSystem = {
      points,
      geometry,
      material,
      maxParticles,
      positions,
      colors,
      alphas,
      sizes,
      activeCount: 0
    };

    return this.burstParticleSystem;
  }

  _createFlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 28);
    gradient.addColorStop(0.0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.22, 'rgba(255,242,196,0.92)');
    gradient.addColorStop(0.5, 'rgba(255,177,26,0.55)');
    gradient.addColorStop(0.8, 'rgba(255,111,34,0.18)');
    gradient.addColorStop(1.0, 'rgba(255,111,34,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
  }

  _initFlowParticleSystem() {
    if (this.flowParticleSystem) return this.flowParticleSystem;

    const maxParticles = Math.max(32, this.config.maxActiveParticles ?? 240);
    for (let i = 0; i < maxParticles; i++) {
      this.flowParticlePool.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        drift: new THREE.Vector3(),
        active: false,
        age: 0,
        lifetime: 0,
        intensity: 0,
        size: 0,
        color: new THREE.Color(),
        link: null,
        linkId: null,
        cascadeId: null,
        forcedFlow: false
      });
    }

    const geometry = this.flowPointFXBase?.createGeometry?.({
      color: { itemSize: 3 },
      alpha: { itemSize: 1 },
      size: { itemSize: 1 }
    }) || new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const alphas = new Float32Array(maxParticles);
    const sizes = new Float32Array(maxParticles);

    const positionAttr = new THREE.BufferAttribute(positions, 3);
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    const alphaAttr = new THREE.BufferAttribute(alphas, 1);
    const sizeAttr = new THREE.BufferAttribute(sizes, 1);

    positionAttr.setUsage(THREE.DynamicDrawUsage);
    colorAttr.setUsage(THREE.DynamicDrawUsage);
    alphaAttr.setUsage(THREE.DynamicDrawUsage);
    sizeAttr.setUsage(THREE.DynamicDrawUsage);

    geometry.setAttribute('position', positionAttr);
    geometry.setAttribute('color', colorAttr);
    geometry.setAttribute('alpha', alphaAttr);
    geometry.setAttribute('size', sizeAttr);
    geometry.setDrawRange(0, 0);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        map: { value: this._createFlowTexture() },
        uPixelRatio: { value: Math.min(2, globalThis?.window?.devicePixelRatio || 1) },
        uBaseSize: { value: 38.0 }
      },
      vertexShader: `
        attribute vec3 color;
        attribute float alpha;
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uBaseSize;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float sizeScale = max(0.48, size);
          gl_PointSize = uBaseSize * uPixelRatio * sizeScale / max(0.25, -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 texel = texture2D(map, gl_PointCoord);
          float alpha = texel.a * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `
    });

    const points = new THREE.Points(geometry, material);
    points.visible = true;
    points.frustumCulled = false;
    points.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_PARTICLES);
    this.flowPointFXBase?.ensureAttached?.(points) || this.scene?.add?.(points);

    this.flowParticleSystem = {
      points,
      geometry,
      material,
      maxParticles,
      positions,
      colors,
      alphas,
      sizes,
      activeCount: 0
    };

    return this.flowParticleSystem;
  }

  _getFlowPooledParticle() {
    if (this.flowParticles.length >= (this.config.maxActiveParticles ?? 240)) {
      return null;
    }

    if (this.flowParticlePool.length > 0) {
      return this.flowParticlePool.pop();
    }

    return null;
  }

  _returnFlowParticleToPool(particle) {
    if (!particle) return;
    particle.active = false;
    particle.age = 0;
    particle.link = null;
    particle.linkId = null;
    particle.cascadeId = null;
    particle.size = 0;
    particle.intensity = 0;
    particle.forcedFlow = false;
    if (this.flowParticlePool.length < (this.config.maxActiveParticles ?? 240)) {
      this.flowParticlePool.push(particle);
    }
  }

  clearFlowParticles(predicate = () => true) {
    let removed = 0;
    for (let i = this.flowParticles.length - 1; i >= 0; i--) {
      const particle = this.flowParticles[i];
      if (typeof predicate === 'function' && !predicate(particle)) {
        continue;
      }
      this.flowParticles.splice(i, 1);
      this._returnFlowParticleToPool(particle);
      removed++;
    }

    if (this.flowParticleSystem?.geometry) {
      this.flowParticleSystem.geometry.setDrawRange(0, 0);
      this.flowParticleSystem.geometry.attributes.position.needsUpdate = true;
      this.flowParticleSystem.geometry.attributes.color.needsUpdate = true;
      this.flowParticleSystem.geometry.attributes.alpha.needsUpdate = true;
      this.flowParticleSystem.geometry.attributes.size.needsUpdate = true;
    }

    return removed;
  }

  _disposeFlowParticleSystem() {
    if (!this.flowParticleSystem) return;

    const flowTexture = this.flowParticleSystem?.material?.uniforms?.map?.value ?? null;
    this.flowPointFXBase?.disposePointCloud?.(this.flowParticleSystem);
    if (flowTexture?.dispose) {
      flowTexture.dispose();
    }
    this.flowPointFXBase = null;

    this.flowParticleSystem = null;
    this.flowParticles = [];
    this.flowParticlePool = [];
  }

  updateFlowParticles(deltaTime) {
    const system = this.flowParticleSystem;
    if (!system) return;

    const activeParticles = [];
    const activeCountLimit = Math.max(0, Math.min(system.maxParticles, this.config.maxActiveParticles ?? system.maxParticles));
    const positions = system.positions;
    const colors = system.colors;
    const alphas = system.alphas;
    const sizes = system.sizes;
    let activeCount = 0;

    for (let i = this.flowParticles.length - 1; i >= 0; i--) {
      const particle = this.flowParticles[i];
      if (!particle?.active) {
        this.flowParticles.splice(i, 1);
        this._returnFlowParticleToPool(particle);
        continue;
      }

      particle.age += deltaTime;
      const lifetime = Math.max(0.2, particle.lifetime || this.config.particleLifetime);
      const progress = this._clamp01(particle.age / lifetime);

      if (progress >= 1 || activeCount >= activeCountLimit) {
        particle.active = false;
        this.flowParticles.splice(i, 1);
        this._returnFlowParticleToPool(particle);
        continue;
      }

      particle.position.addScaledVector(particle.velocity, deltaTime);
      if (particle.drift) {
        particle.position.addScaledVector(particle.drift, deltaTime);
      }

      const fade = 1.0 - progress;
      const pulse = 0.82 + 0.18 * Math.sin((particle.age * 10.0) + (particle.phase || 0));
      const forcedFlow = particle.forcedFlow === true;
      const alpha = Math.max(0, fade * fade * (forcedFlow ? 0.92 + particle.intensity * 1.08 : 0.66 + particle.intensity * 0.95) * pulse);
      const size = Math.max(forcedFlow ? 0.94 : 0.52, (particle.size || 1.0) * (forcedFlow ? 1.15 + particle.intensity * 0.58 : 0.98 + particle.intensity * 0.48) * (forcedFlow ? 0.82 + fade * 0.42 : 0.72 + fade * 0.38));
      const color = particle.color || this.config.waveColor;

      positions[activeCount * 3] = particle.position.x;
      positions[activeCount * 3 + 1] = particle.position.y;
      positions[activeCount * 3 + 2] = particle.position.z;

      colors[activeCount * 3] = color.r;
      colors[activeCount * 3 + 1] = color.g;
      colors[activeCount * 3 + 2] = color.b;

      alphas[activeCount] = alpha;
      sizes[activeCount] = size;

      activeParticles.push(particle);
      activeCount++;
    }

    system.activeCount = activeCount;
    system.geometry.setDrawRange(0, activeCount);
    system.geometry.attributes.position.needsUpdate = true;
    system.geometry.attributes.color.needsUpdate = true;
    system.geometry.attributes.alpha.needsUpdate = true;
    system.geometry.attributes.size.needsUpdate = true;

    // Keep active list ordered in update order for stable cleanup and reuse.
    this.flowParticles = activeParticles.reverse();
  }

  _resolveLinkId(linkOrId) {
    if (!linkOrId) return null;
    if (typeof linkOrId === 'string' || typeof linkOrId === 'number') {
      return String(linkOrId);
    }

    return (
      linkOrId.userData?.id ??
      linkOrId.userData?.linkId ??
      linkOrId.id ??
      linkOrId.uuid ??
      null
    );
  }

  _resolveLinkVisualTarget(link) {
    if (!link) return null;

    const directCandidates = [
      link.mesh,
      link.haloLine,
      link.line,
      link.linkMesh,
      link.root,
      link.object3D,
      link.group,
      link
    ];

    for (const candidate of directCandidates) {
      if (!candidate) continue;
      if (candidate.material) return candidate;
      if (candidate.userData?.conduitState?.skinMesh?.material) {
        return candidate.userData.conduitState.skinMesh;
      }
    }

    if (link.group?.traverse) {
      let found = null;
      link.group.traverse((child) => {
        if (!found && child?.material) {
          found = child;
        }
      });
      if (found) return found;
    }

    return null;
  }

  _resolveLinkById(linkId) {
    const normalizedLinkId = this._resolveLinkId(linkId);
    if (!normalizedLinkId) return null;

    const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];
    return links.find((link) => this._resolveLinkId(link) === normalizedLinkId) || null;
  }

  _getLinkEndpoints(linkOrId, sourceNode = null, targetNode = null) {
    const link = (linkOrId && typeof linkOrId === 'object') ? linkOrId : null;
    const sourcePos = this._asVector3(
      sourceNode?.position ??
      link?.source?.position ??
      link?.sourceNode?.position ??
      link?.nodeA?.position
    );
    const targetPos = this._asVector3(
      targetNode?.position ??
      link?.target?.position ??
      link?.targetNode?.position ??
      link?.nodeB?.position
    );

    return { sourcePos, targetPos };
  }

  _distanceToSegment(point, start, end) {
    if (!point || !start || !end) return Infinity;
    const segment = new THREE.Vector3().subVectors(end, start);
    const segmentLengthSq = segment.lengthSq();
    if (segmentLengthSq <= 1e-8) {
      return point.distanceTo(start);
    }

    const toPoint = new THREE.Vector3().subVectors(point, start);
    const t = Math.max(0, Math.min(1, toPoint.dot(segment) / segmentLengthSq));
    const closest = new THREE.Vector3().copy(start).addScaledVector(segment, t);
    return point.distanceTo(closest);
  }

  _particleMatchesLink(particle, linkRef, linkId, sourcePos = null, targetPos = null) {
    if (!particle) return false;

    if (linkRef && particle.link === linkRef) {
      return true;
    }

    const particleLinkId = particle.linkId != null ? String(particle.linkId) : null;
    const normalizedLinkId = linkId != null ? String(linkId) : null;
    if (particleLinkId && normalizedLinkId && particleLinkId === normalizedLinkId) {
      return true;
    }

    if (sourcePos && targetPos && particle.position) {
      const segmentLength = sourcePos.distanceTo(targetPos);
      const maxDistance = Math.max(0.18, Math.min(0.45, segmentLength * 0.02));
      if (this._distanceToSegment(particle.position, sourcePos, targetPos) <= maxDistance) {
        return true;
      }
    }

    return false;
  }

  clearCascadeParticles(predicate = () => true) {
    let removed = 0;

    for (let i = this.cascadeParticles.length - 1; i >= 0; i--) {
      const particle = this.cascadeParticles[i];
      if (typeof predicate === 'function' && !predicate(particle)) {
        continue;
      }

      this.cascadeParticles.splice(i, 1);
      this.returnParticleToPool(particle);
      removed++;
    }

    if (this.burstParticleSystem?.geometry) {
      this.burstParticleSystem.geometry.setDrawRange(0, 0);
      this.burstParticleSystem.geometry.attributes.position.needsUpdate = true;
      this.burstParticleSystem.geometry.attributes.color.needsUpdate = true;
      this.burstParticleSystem.geometry.attributes.alpha.needsUpdate = true;
      this.burstParticleSystem.geometry.attributes.size.needsUpdate = true;
      this.burstParticleSystem.activeCount = 0;
    }

    return removed;
  }

  clearLink(linkOrId, sourceNode = null, targetNode = null) {
    const linkRef = (linkOrId && typeof linkOrId === 'object') ? linkOrId : null;
    const linkId = this._resolveLinkId(linkOrId);
    const { sourcePos, targetPos } = this._getLinkEndpoints(linkOrId, sourceNode, targetNode);

    if (!linkRef && !linkId && !sourcePos && !targetPos) {
      return 0;
    }

    let removedHops = 0;
    for (const cascade of this.activeCascades) {
      if (!cascade?.hops?.length) continue;

      const before = cascade.hops.length;
      cascade.hops = cascade.hops.filter((hop) => {
        if (!hop) return false;
        if (linkRef && hop.link === linkRef) return false;
        const hopLinkId = hop.linkId != null ? String(hop.linkId) : this._resolveLinkId(hop.link);
        if (linkId && hopLinkId && hopLinkId === String(linkId)) return false;
        return true;
      });

      const removed = before - cascade.hops.length;
      if (removed > 0) {
        removedHops += removed;
        if (cascade.hops.length === 0) {
          cascade.isActive = false;
        }
      }
    }

    if (linkRef && this.cascadeHistory.has(linkRef)) {
      this.cascadeHistory.delete(linkRef);
    }

    if (linkId) {
      for (const [trackedLink, history] of [...this.cascadeHistory.entries()]) {
        const trackedLinkId = history?.linkId != null ? String(history.linkId) : this._resolveLinkId(trackedLink);
        if ((trackedLinkId && trackedLinkId === String(linkId)) || (linkRef && trackedLink === linkRef)) {
          this.cascadeHistory.delete(trackedLink);
        }
      }
    }

    this.clearCascadeParticles((particle) =>
      this._particleMatchesLink(particle, linkRef, linkId, sourcePos, targetPos)
    );
    this.clearFlowParticles((particle) =>
      this._particleMatchesLink(particle, linkRef, linkId, sourcePos, targetPos)
    );
    if (linkId) {
      this._forcedFlowCooldownByLinkId.delete(String(linkId));
      this._forcedBurstCooldownByLinkId.delete(String(linkId));
      this._flowCooldownByLinkId.delete(String(linkId));
      this._rippleCooldownByLinkId.delete(String(linkId));
      this._burstCooldownByLinkId.delete(String(linkId));
    }

    this.stats.activeCascades = this.activeCascades.length;
    this.stats.linksAffected = this.getTotalAffectedLinks();
    this.stats.particlesActive = this.cascadeParticles.length + this.flowParticles.length;

    return removedHops;
  }

  _resolveCascadeActivation(event = {}) {
    const intensity = this._clamp01(this._resolveCascadeIntensity(event));
    const anchor = this._asVector3(event.anchor ?? event.center ?? event.position ?? event.origin);
    if (intensity <= 0 || !anchor) return null;
    return { intensity, anchor };
  }

  _resolveBurstAnchor(event = {}, link = null) {
    const direct = this._asVector3(event.anchor ?? event.center ?? event.position ?? event.origin);
    if (direct) return direct;

    const resolvedLink = link ?? this._resolveLinkById(event.linkId ?? event.id ?? event.linkRef);
    const sourcePos = this._asVector3(
      event.sourcePosition ??
      resolvedLink?.source?.position ??
      resolvedLink?.sourceNode?.position ??
      resolvedLink?.nodeA?.position ??
      null
    );
    const targetPos = this._asVector3(
      event.targetPosition ??
      resolvedLink?.target?.position ??
      resolvedLink?.targetNode?.position ??
      resolvedLink?.nodeB?.position ??
      null
    );

    if (sourcePos && targetPos) {
      return new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
    }

    return sourcePos || targetPos || null;
  }

  _getNodeLinks(nodeOrId) {
    const linkingSystem = this.linkingSystem;
    if (!linkingSystem || !nodeOrId) return [];

    if (typeof linkingSystem.getNodeLinks === 'function') {
      const links = linkingSystem.getNodeLinks(nodeOrId);
      if (Array.isArray(links)) return links;
    }

    if (typeof linkingSystem.getLinksForNode === 'function') {
      const links = linkingSystem.getLinksForNode(nodeOrId);
      if (Array.isArray(links)) return links;
    }

    return [];
  }

  _hasLinkedNode(nodeOrId) {
    return this._getNodeLinks(nodeOrId).length > 0;
  }

  _eventHasLinkedNode(event = {}) {
    const nodeCandidates = [
      event.node,
      event.sourceNode,
      event.targetNode,
      event.source,
      event.target,
      event.nodeId,
      event.sourceNodeId,
      event.targetNodeId,
      event.sourceId,
      event.targetId
    ];

    for (const candidate of nodeCandidates) {
      if (!candidate) continue;
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        if (this._hasLinkedNode(candidate)) return true;
        continue;
      }

      if (this._hasLinkedNode(candidate)) return true;

      const resolvedId =
        candidate?.userData?.nodeId ??
        candidate?.userData?.id ??
        candidate?.id ??
        candidate?.uuid ??
        null;

      if (resolvedId && this._hasLinkedNode(resolvedId)) return true;
    }

    return false;
  }

  _getOrCreateCascade(cascadeId, seedIntensity = 0) {
    let cascade = this.activeCascades.find(item => item.id === cascadeId);
    if (cascade) return cascade;
    cascade = {
      id: cascadeId,
      age: 0,
      isActive: true,
      rippleRadius: 0,
      rippleIntensity: this._clamp01(seedIntensity),
      completedLinks: new Set(),
      hops: []
    };
    this.activeCascades.push(cascade);
    if (this.activeCascades.length > this.config.maxActiveCascades) {
      this.activeCascades.shift();
    }
    return cascade;
  }

  renderCascadeStart(event = {}) {
    if (event.__cascadeDirectRendered === true) return;
    const context = this._resolveCascadeSpawnContext(event, event.link ?? event.linkRef ?? null, 'start');
    if (!context.anchor) return;

    const { cascadeId, intensity, anchor, link } = context;
    if (link) {
      const linkId = this._resolveLinkId(link);
      const visualIntensity = Math.max(this._readLinkSynergy(link), this._resolveCascadeSignalIntensity(event));
      const band = this._getSynergyCascadeBand(visualIntensity) ?? this._getVisibleCascadeFloorBand(visualIntensity);
      if (!band) return;

      this._getOrCreateCascade(cascadeId, Math.max(0.1, visualIntensity));
      this._seedCascadeHistory(link, visualIntensity, anchor);

      if (this.config.visualizations.rippleEffect && this._canTriggerLinkEffect(this._rippleCooldownByLinkId, linkId, band.rippleCooldownSeconds)) {
        this._spawnRippleCluster(anchor, Math.max(0.1, visualIntensity), band.rippleCount, { ...band, flatRipple: true });
      }

      if (this.config.visualizations.burstParticles) {
        this.spawnBurstParticles(anchor, Math.max(0.3, visualIntensity), {
          ...event,
          link,
          cascadeIntensity: visualIntensity,
          intensity: visualIntensity,
          forcedBurst: true
        }, {
          countMultiplier: 2.0,
          intensityMultiplier: 1.0,
          radiusMultiplier: 1.22,
          lifetimeMultiplier: 1.0,
          speedMultiplier: 1.0
        });
      }
      return;
    }

    this._getOrCreateCascade(cascadeId, intensity);
    if (this.config.visualizations.rippleEffect) {
      this.createRipple(anchor, Math.max(0.1, intensity));
    }
    if (this.config.visualizations.burstParticles) {
      this.spawnBurstParticles(anchor, intensity, event);
    }
  }

  renderCascadeHop(event = {}) {
    if (event.__cascadeDirectRendered === true) return;
    const context = this._resolveCascadeSpawnContext(event, event.link ?? event.linkRef ?? null, 'hop');
    const { link, cascadeId, intensity, anchor, sourcePosition: startPosition, targetPosition } = context;
    if (!link && (!startPosition || !targetPosition) && !anchor) return;

    if (link) {
      const linkId = this._resolveLinkId(link);
      const visualIntensity = Math.max(this._readLinkSynergy(link), this._resolveCascadeSignalIntensity(event));
      const band = this._getSynergyCascadeBand(visualIntensity) ?? this._getVisibleCascadeFloorBand(visualIntensity);
      if (!band) return;

      const cascade = this._getOrCreateCascade(cascadeId, Math.max(0.1, visualIntensity));
      this._seedCascadeHistory(link, visualIntensity, anchor);
      cascade.hops.push({
        link,
        linkId,
        intensity: Math.max(0.1, visualIntensity),
        age: 0,
        duration: this.config.hopLifetime,
        startPosition,
        targetPosition,
        createdAt: Date.now(),
        completed: false
      });

      if (anchor && this.config.visualizations.rippleEffect && this._canTriggerLinkEffect(this._rippleCooldownByLinkId, linkId, band.rippleCooldownSeconds)) {
        this._spawnRippleCluster(anchor, Math.max(0.1, visualIntensity), band.rippleCount, { ...band, flatRipple: true });
      }
      if (anchor && this.config.visualizations.burstParticles) {
        this.spawnBurstParticles(anchor, Math.max(0.3, visualIntensity), {
          ...event,
          link,
          cascadeIntensity: visualIntensity,
          intensity: visualIntensity,
          forcedBurst: true
        }, {
          countMultiplier: 2.0,
          intensityMultiplier: 1.0,
          radiusMultiplier: 1.22,
          lifetimeMultiplier: 1.0,
          speedMultiplier: 1.0
        });
      }
      return;
    }

    const cascade = this._getOrCreateCascade(cascadeId, intensity);
    cascade.hops.push({
      link,
      linkId: this._resolveLinkId(link),
      intensity,
      age: 0,
      duration: this.config.hopLifetime,
      startPosition,
      targetPosition,
      createdAt: Date.now(),
      completed: false
    });

    if (anchor && this.config.visualizations.rippleEffect) {
      this.createRipple(anchor, Math.max(0.09, intensity * 0.5));
    }
    if (anchor && this.config.visualizations.burstParticles) {
      this.spawnBurstParticles(anchor, intensity * 0.75, event);
    }
  }

  renderCascadeEnd(event = {}) {
    const cascadeId = event.cascadeId ?? event.id;
    if (cascadeId === undefined || cascadeId === null) return;
    const cascade = this.activeCascades.find(item => item.id === cascadeId);
    if (!cascade) return;
    cascade.isActive = false;
  }
  
  /**
   * Update all active cascades
   */
  updateActiveCascades(deltaTime) {
    if (this.activeCascades.length === 0) return;
    
    // Process in batches for performance
    for (let i = 0; i < this.activeCascades.length; i += this.config.batchSize) {
      const batch = this.activeCascades.slice(i, i + this.config.batchSize);
      this.processCascadeBatch(batch, deltaTime);
    }
    
    this.stats.linksAffected = this.getTotalAffectedLinks();
  }
  
  /**
   * Process a batch of cascades
   */
  processCascadeBatch(batch, deltaTime) {
    for (const cascade of batch) {
      if (!cascade.isActive) continue;
      
      cascade.age += deltaTime;
      
      for (let i = 0; i < cascade.hops.length; i++) {
        const hop = cascade.hops[i];
        hop.age += deltaTime;
        const progress = this._clamp01(hop.age / Math.max(0.0001, hop.duration));
        const propagation = {
          link: hop.link,
          intensity: hop.intensity,
          position: progress,
          startPosition: hop.startPosition,
          targetPosition: hop.targetPosition,
          completed: false
        };

        if (progress >= 1) {
          if (hop.link) {
            cascade.completedLinks.add(hop.link);
          }
          if (this.config.visualizations.rippleEffect && hop.targetPosition) {
            const hopLink = hop.link ?? this._resolveLinkById(hop.linkId);
            const synergy = this._readLinkSynergy(hopLink);
            const band = this._getSynergyCascadeBand(synergy);
            if (band && hopLink && this._canTriggerLinkEffect(this._rippleCooldownByLinkId, this._resolveLinkId(hopLink), band.rippleCooldownSeconds)) {
              this._spawnRippleCluster(hop.targetPosition, Math.max(0.1, synergy), band.rippleCount, band);
            } else {
              this.createRipple(hop.targetPosition, hop.intensity * 0.5);
            }
          }
          propagation.completed = true;
          hop.completed = true;
        } else if (hop.link) {
          this.applyLinkCascadeEffects(hop.link, propagation);
        }

        if (this.config.visualizations.flowParticles) {
          this.spawnFlowParticles(propagation, cascade);
        }
      }
      
      cascade.hops = cascade.hops.filter(hop => !hop.completed);
      
      // Update ripple effect
      cascade.rippleRadius += this.config.propagationSpeed * deltaTime;
      cascade.rippleIntensity = Math.max(0, 1.0 - (cascade.age / 2.0)); // Fade over 2 seconds
      
      // Check if cascade is dead
      if (cascade.hops.length === 0 && cascade.age > 3.0) {
        cascade.isActive = false;
      }
    }
  }
  
  /**
   * Apply visual cascade effects to a link
   */
  applyLinkCascadeEffects(link, propagation) {
    if (!link) return;
    if (!link.userData) link.userData = {};
    
    // Get or create cascade history for this link
    this._seedCascadeHistory(link, propagation.intensity);
    const history = this.cascadeHistory.get(link);
    if (history && !history.linkId) {
      history.linkId = this._resolveLinkId(link);
    }
    
    // Update cascade intensity (max of all active cascades on this link)
    history.cascadeIntensity = Math.max(history.cascadeIntensity, propagation.intensity);
    
    // Apply visual effects
    if (this.config.visualizations.waveFront) {
      this.applyWaveFrontEffect(link, history, propagation);
    }
    
    if (this.config.visualizations.cascadeGlow) {
      this.applyCascadeGlowEffect(link, history, propagation);
    }
    
    if (this.config.visualizations.harmonicShimmer) {
      this.applyHarmonicShimmerEffect(link, history, propagation);
    }
  }
  
  /**
   * Apply wave front effect (animated pulse along link)
   */
  applyWaveFrontEffect(link, history, propagation) {
    const wavePos = propagation.position;
    const waveIntensity = propagation.intensity;
    
    // Create animated wave effect using link properties
    if (link.userData && !link.userData.cascadeWave) {
      link.userData.cascadeWave = {
        position: wavePos,
        intensity: waveIntensity,
        phase: wavePos
      };
    }
    
    link.userData.cascadeWave.position = wavePos;
    link.userData.cascadeWave.intensity = waveIntensity;
    link.userData.cascadeWave.phase = wavePos;
    
    // Modify line width at wave position
    const visualTarget = this._resolveLinkVisualTarget(link);
    if (visualTarget?.material) {
      const baseMaterial = visualTarget.material;
      const waveWidth = this.config.waveWidth;
      
      // Highlight wave position with brighter color
      const distance = Math.abs(wavePos - 0.5) * 2; // Distance from center
      const waveBrightness = Math.max(0, 1.0 - (distance / waveWidth));
      const headStrength = Math.min(1, waveIntensity * (0.65 + waveBrightness * 0.8));
      const tailStrength = Math.min(1, (history.trailIntensity || 0) * 0.85);

      if (baseMaterial.color) {
        const headColor = this.config.cascadeColor.clone().lerp(this.config.waveColor, 0.35 + headStrength * 0.45);
        baseMaterial.color.copy(headColor);
      }
      
      if (baseMaterial.emissive) {
        const waveColor = this.config.waveColor.clone().lerp(this.config.cascadeColor, 0.24);
        baseMaterial.emissive.copy(waveColor);
        baseMaterial.emissiveIntensity = Math.max(
          baseMaterial.emissiveIntensity || 0,
          (waveBrightness * waveIntensity * 2.8) + (tailStrength * 1.1) + (headStrength * 0.72)
        );
      }

      if (baseMaterial.opacity !== undefined) {
        baseMaterial.opacity = Math.min(1.0, (baseMaterial.opacity || 0.75) + headStrength * 0.12 + tailStrength * 0.05);
      }
    }
  }
  
  /**
   * Apply cascade glow effect (progressive brightness)
   */
  applyCascadeGlowEffect(link, history, propagation) {
    const visualTarget = this._resolveLinkVisualTarget(link);
    if (!visualTarget?.material) return;

    const material = visualTarget.material;
    const cascadeIntensity = propagation.intensity;
    history.trailIntensity = Math.max((history.trailIntensity || 0) * 0.92, cascadeIntensity);
    const trailIntensity = history.trailIntensity;
    
    // Enhance glow based on cascade intensity
    if (material.color) {
      material.color.copy(this.config.cascadeColor).lerp(this.config.fadeColor, Math.min(1, trailIntensity * 0.34));
    }

    if (material.emissive) {
      const baseColor = this.config.cascadeColor.clone();
      const glowColor = baseColor.lerp(this.config.waveColor, Math.min(1, trailIntensity * 0.5));
      material.emissive.copy(glowColor);
      material.emissiveIntensity = Math.max(
        material.emissiveIntensity || 0,
        (cascadeIntensity * 1.95) + (trailIntensity * 1.35) + (trailIntensity * this.config.cascadeGlowAmbientBoost)
      );
    }

    // Slight static halo feel around active cascades
    if (material.color) {
      const haloBlend = Math.min(1, trailIntensity * this.config.cascadeGlowHaloStrength);
      material.color.lerp(this.config.waveColor, haloBlend * 0.22);
    }
    
    // Increase opacity slightly during cascade
    if (material.opacity !== undefined) {
      material.opacity = Math.min(1.0, (material.opacity || 0.75) + cascadeIntensity * 0.22 + trailIntensity * 0.08);
    }
  }
  
  /**
   * Apply harmonic shimmer effect (oscillating color bands)
   */
  applyHarmonicShimmerEffect(link, history, propagation) {
    const visualTarget = this._resolveLinkVisualTarget(link);
    if (!visualTarget?.material) return;

    const material = visualTarget.material;
    const position = propagation.position;
    const intensity = propagation.intensity;
    
    // Create oscillating shimmer effect
    const shimmerFrequency = 8.0; // Oscillations per unit
    const shimmerPhase = (Date.now() % 1000) / 1000 * Math.PI * 2;
    
    const shimmerWave = Math.sin(position * shimmerFrequency + shimmerPhase);
    const shimmerAmount = Math.abs(shimmerWave) * intensity;
    
    // Apply shimmer by modulating emissive
    if (material.emissive) {
      const shimmerColor = this.config.cascadeColor.clone();
      shimmerColor.lerp(this.config.waveColor, shimmerWave * 0.5 + 0.5);
      
      material.emissive.copy(shimmerColor);
      material.emissiveIntensity = shimmerAmount * 2.6;
    }
  }
  
  /**
   * Spawn directional flow particles along cascade path
   */
  spawnFlowParticles(propagation, cascade) {
    const forcedFlow = propagation?.forcedFlow === true;
    const flowProfile = propagation?.forcedFlowProfile ?? null;
    const flowCountMultiplier = Math.max(0.35, Number(flowProfile?.countMultiplier ?? (forcedFlow ? 1.45 : 1.0)) || 1.0);
    const flowRadiusMultiplier = Math.max(0.35, Number(flowProfile?.radiusMultiplier ?? (forcedFlow ? 1.1 : 1.0)) || 1.0);
    const flowLifetimeMultiplier = Math.max(0.35, Number(flowProfile?.lifetimeMultiplier ?? (forcedFlow ? 1.08 : 1.0)) || 1.0);
    const flowSpeedMultiplier = Math.max(0.35, Number(flowProfile?.speedMultiplier ?? (forcedFlow ? 1.0 : 1.0)) || 1.0);
    const emissionBoost = this._resolveCascadeEmissionBoost(propagation) * (forcedFlow ? 1.25 * flowCountMultiplier : 1.0);
    const particleBudget = this._getParticleSpawnBudget(
      propagation.startPosition ?? propagation.targetPosition ?? propagation.link?.source?.position ?? propagation.link?.target?.position ?? null,
      this.config.particleCount * propagation.intensity * (forcedFlow ? 1.7 : 0.95) * emissionBoost,
      this.flowParticles.length
    );
    if (particleBudget <= 0) return;

    const particleCount = Math.max(forcedFlow ? 8 : 2, particleBudget);
    const flowScale = Math.max(forcedFlow ? 0.82 : 0.45, this._getCascadeVisualScale(
      propagation.startPosition ?? propagation.targetPosition ?? propagation.link?.source?.position ?? propagation.link?.target?.position ?? null
    ));
    const startPos = propagation.startPosition
      ?? propagation.startNode?.position
      ?? propagation.link?.source?.position
      ?? propagation.link?.sourceNode?.position
      ?? propagation.link?.nodeA?.position
      ?? propagation.link?.userData?.nodeA?.position
      ?? null;
    const targetPos = propagation.targetPosition
      ?? propagation.targetNode?.position
      ?? propagation.link?.target?.position
      ?? propagation.link?.targetNode?.position
      ?? propagation.link?.nodeB?.position
      ?? propagation.link?.userData?.nodeB?.position
      ?? null;
    if (!this._isValidWorldPosition(startPos) || !this._isValidWorldPosition(targetPos)) return;

    const forward = new THREE.Vector3().subVectors(targetPos, startPos);
    if (forward.lengthSq() <= 1e-8) return;
    forward.normalize();
    const side = Math.abs(forward.y) < 0.9
      ? new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
      : new THREE.Vector3().crossVectors(forward, new THREE.Vector3(1, 0, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(side, forward).normalize();
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this._getFlowPooledParticle();
      
      if (!particle) break; // No more particles available
      
      // Calculate particle position
      const lerpPos = forcedFlow
        ? Math.random()
        : Math.max(0, Math.min(1, propagation.position - Math.random() * 0.18));
      
      const position = new THREE.Vector3().lerpVectors(
        startPos,
        targetPos,
        Math.max(0, Math.min(1, lerpPos))
      );
      const driftAmount = forcedFlow ? 0.02 + Math.random() * 0.04 : 0.04 + Math.random() * 0.08;
      position.addScaledVector(side, (Math.random() - 0.5) * driftAmount);
      position.addScaledVector(up, (Math.random() - 0.5) * driftAmount * 0.6);
      
      // Initialize particle
      particle.position.copy(position);
      particle.active = true;
      particle.lifetime = Math.max(forcedFlow ? 1.05 : 0.42, this.config.particleLifetime * flowScale * (forcedFlow ? flowLifetimeMultiplier : 1.0));
      particle.age = 0;
      particle.velocity = new THREE.Vector3().subVectors(
        targetPos,
        startPos
      ).normalize().multiplyScalar(this.config.particleSpeed * propagation.intensity * (forcedFlow ? 1.35 * flowSpeedMultiplier : 1.0));
      particle.drift = new THREE.Vector3(
        (Math.random() - 0.5) * (forcedFlow ? 0.085 : 0.105),
        (Math.random() - 0.5) * (forcedFlow ? 0.04 : 0.045),
        (Math.random() - 0.5) * (forcedFlow ? 0.085 : 0.105)
      );
      
      particle.intensity = Math.max(forcedFlow ? 0.72 : 0.3, propagation.intensity);
      particle.size = Math.max(forcedFlow ? 1.65 : 0.72, (forcedFlow ? 1.95 : 1.18) * flowScale * flowRadiusMultiplier * (0.92 + particle.intensity * 0.42) * this.config.particleGlowSizeBoost);
      particle.color = forcedFlow
        ? this.config.cascadeColor.clone().lerp(this.config.waveColor, 0.18 + Math.random() * 0.28)
        : this.config.waveColor.clone().lerp(this.config.cascadeColor, Math.random() * 0.35);
      particle.link = propagation.link ?? cascade?.link ?? null;
      particle.linkId = this._resolveLinkId(particle.link ?? propagation.linkId ?? cascade?.linkId ?? null);
      particle.cascadeId = cascade?.id ?? null;
      particle.phase = Math.random() * Math.PI * 2;
      particle.forcedFlow = forcedFlow;

      this.flowParticles.push(particle);
    }
  }

  spawnBurstParticles(center, intensity, event = {}, options = {}) {
    const anchor = this._asVector3(center);
    const burstIntensity = this._clamp01(intensity);
    const minBurstIntensity = Math.max(0.02, this.config.minBurstIntensity ?? 0.02);
    if (!anchor || burstIntensity < minBurstIntensity) return;

    const emissionBoost = this._resolveCascadeEmissionBoost(event);
    const countMultiplier = Math.max(0.25, Number(options.countMultiplier ?? 1.0) || 1.0);
    const intensityMultiplier = Math.max(0.1, Number(options.intensityMultiplier ?? 1.0) || 1.0);
    const radiusMultiplier = Math.max(0.25, Number(options.radiusMultiplier ?? 1.0) || 1.0);
    const lifetimeMultiplier = Math.max(0.25, Number(options.lifetimeMultiplier ?? 1.0) || 1.0);
    const speedMultiplier = Math.max(0.25, Number(options.speedMultiplier ?? 1.0) || 1.0);
    const forcedBurst = event?.forcedBurst === true;
    const particleBudget = this._getParticleSpawnBudget(
      anchor,
      this.config.particleCount * burstIntensity * 0.9 * emissionBoost * countMultiplier,
      this.cascadeParticles.length
    );
    if (particleBudget <= 0) return;

    const particleCount = Math.max(4, particleBudget);
    const burstRadius = (forcedBurst ? 0.32 + burstIntensity * 0.74 : 0.12 + burstIntensity * 0.38) * radiusMultiplier * (forcedBurst ? 1.08 : 0.88);
    const burstLifetime = Math.max(0.55, this.config.particleLifetime * 0.92 * lifetimeMultiplier * Math.max(0.6, this._getCascadeVisualScale(anchor)));
    const burstSpeed = this.config.particleSpeed * (forcedBurst ? 0.9 + burstIntensity * 0.88 : 1.05 + burstIntensity * 1.0) * speedMultiplier;
    const link = event?.link ?? null;
    const sourcePos = this._asVector3(
      event.sourcePosition ??
      link?.source?.position ??
      link?.sourceNode?.position ??
      link?.nodeA?.position ??
      null
    );
    const targetPos = this._asVector3(
      event.targetPosition ??
      link?.target?.position ??
      link?.targetNode?.position ??
      link?.nodeB?.position ??
      null
    );
    const linkDirection = (sourcePos && targetPos && sourcePos.distanceToSquared(targetPos) > 1e-8)
      ? new THREE.Vector3().subVectors(targetPos, sourcePos).normalize()
      : null;
    const midpoint = (sourcePos && targetPos)
      ? new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5)
      : null;
    const outwardFromMidpoint = (forcedBurst && midpoint)
      ? new THREE.Vector3().subVectors(anchor, midpoint).normalize()
      : null;

    for (let i = 0; i < particleCount; i++) {
      const particle = this.getPooledParticle();
      if (!particle) break;

      const direction = new THREE.Vector3(
        (Math.random() * 2) - 1,
        (Math.random() * 1.2) - 0.15,
        (Math.random() * 2) - 1
      );

      if (direction.lengthSq() <= 1e-8) {
        direction.set(0, 1, 0);
      }
      direction.normalize();

      if (forcedBurst) {
        if (outwardFromMidpoint) {
          direction.lerp(outwardFromMidpoint, 0.68).normalize();
        }
        if (linkDirection) {
          direction.lerp(linkDirection, 0.72).normalize();
        }
      }

      const position = anchor.clone().addScaledVector(direction, Math.random() * burstRadius);
      particle.position.copy(position);
      particle.active = true;
      particle.lifetime = burstLifetime;
      particle.age = 0;
      particle.velocity = direction.clone().multiplyScalar(burstSpeed);
      particle.drift = new THREE.Vector3(
        (Math.random() - 0.5) * (forcedBurst ? 0.08 : 0.045),
        Math.random() * (forcedBurst ? 0.08 : 0.055),
        (Math.random() - 0.5) * (forcedBurst ? 0.08 : 0.045)
      );
      particle.intensity = Math.max(forcedBurst ? 0.78 : 0.22, burstIntensity * intensityMultiplier);
      particle.color = forcedBurst
        ? new THREE.Color(0.95 + Math.random() * 0.03, 0.08 + Math.random() * 0.08, 1.0).lerp(new THREE.Color(1.0, 0.5, 1.0), 0.14 + Math.random() * 0.14)
        : this.config.cascadeColor.clone().lerp(this.config.waveColor, 0.72 + Math.random() * 0.18);
      particle.baseScale = forcedBurst
        ? 3.0 + burstIntensity * 1.45
        : 0.88 + burstIntensity * 0.42;
      particle.size = particle.baseScale;
      particle.forcedBurst = forcedBurst;
      particle.phase = Math.random() * Math.PI * 2;

      this.cascadeParticles.push(particle);
    }
  }
  
  /**
   * Update cascade particles
   */
  updateCascadeParticles(deltaTime) {
    const system = this.burstParticleSystem;
    if (!system) return;

    const activeCountLimit = Math.max(0, Math.min(system.maxParticles, this.config.maxActiveParticles ?? system.maxParticles));
    const positions = system.positions;
    const colors = system.colors;
    const alphas = system.alphas;
    const sizes = system.sizes;
    let activeCount = 0;

    for (let i = this.cascadeParticles.length - 1; i >= 0; i--) {
      const particle = this.cascadeParticles[i];
      
      if (!particle?.active) {
        this.cascadeParticles.splice(i, 1);
        this.returnParticleToPool(particle);
        continue;
      }
      
      particle.age += deltaTime;
      
      // Update position
      particle.position.addScaledVector(particle.velocity, deltaTime);
      if (particle.drift) {
        particle.position.addScaledVector(particle.drift, deltaTime);
      }
      
      // Fade out
      const fadeRatio = 1.0 - (particle.age / particle.lifetime);
      if (fadeRatio <= 0 || activeCount >= activeCountLimit) {
        particle.active = false;
        this.cascadeParticles.splice(i, 1);
        this.returnParticleToPool(particle);
        continue;
      }

      const fade = Math.max(0, fadeRatio);
      const pulse = 0.84 + 0.16 * Math.sin((particle.age * 10.0) + (particle.phase || 0));
      const color = particle.color || this.config.waveColor;
      const baseSize = Math.max(0.18, particle.baseScale || particle.size || 1);
      const size = baseSize * (0.94 + fade * 0.48) * (0.98 + particle.intensity * 0.35);
      const alphaBoost = Math.min(1.0, 0.16 + particle.intensity * 0.46);

      positions[activeCount * 3] = particle.position.x;
      positions[activeCount * 3 + 1] = particle.position.y;
      positions[activeCount * 3 + 2] = particle.position.z;

      colors[activeCount * 3] = color.r;
      colors[activeCount * 3 + 1] = color.g;
      colors[activeCount * 3 + 2] = color.b;

      alphas[activeCount] = Math.max(0, fade * fade * alphaBoost * pulse);
      sizes[activeCount] = Math.max(0.52, size);
      activeCount++;
    }

    system.points.visible = activeCount > 0;
    system.activeCount = activeCount;
    system.geometry.setDrawRange(0, activeCount);
    system.geometry.attributes.position.needsUpdate = true;
    system.geometry.attributes.color.needsUpdate = true;
    system.geometry.attributes.alpha.needsUpdate = true;
    system.geometry.attributes.size.needsUpdate = true;

    this.stats.particlesActive = this.cascadeParticles.length + this.flowParticles.length;
  }
  
  /**
   * Create ripple effect at position
   */
  createRipple(position, intensity, options = {}) {
    const rippleColor = options.color?.isColor
      ? options.color
      : options.color instanceof THREE.Color
        ? options.color
        : this.config.waveColor;
    const ripple = {
      center: position.clone(),
      startRadius: 0,
      maxRadius: (3.6 + intensity * 2.4) * Math.max(0.25, Number(options.radiusScale ?? 1.0) || 1.0),
      lifetime: 1.05 * Math.max(0.25, Number(options.lifetimeScale ?? 1.0) || 1.0),
      age: 0,
      intensity: intensity * Math.max(0.1, Number(options.intensityScale ?? 1.0) || 1.0),
      haloScale: this.config.rippleHaloScale,
      mesh: null,
      haloMesh: null
    };
    
    // Create ripple geometry (expanding ring)
    const ringGeometry = new THREE.BufferGeometry();
    const ringPoints = [];
    const segments = 32;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * 0.02; // Start small
      const z = Math.sin(angle) * 0.01;
      ringPoints.push(new THREE.Vector3(x, 0.01, z));
    }
    
    ringGeometry.setFromPoints(ringPoints);
    
    const rippleMaterial = new THREE.LineBasicMaterial({
      color: rippleColor,
      linewidth: 2,
      transparent: true,
      opacity: Math.min(1.0, (0.26 + intensity * 0.74) * Math.max(0.1, Number(options.opacityScale ?? 1.0) || 1.0)),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    });
    
    const rippleLine = new THREE.Line(ringGeometry, rippleMaterial);
    rippleLine.position.copy(position);
    rippleLine.position.y += Number(options.verticalOffset ?? 0) || 0;
    rippleLine.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_CASCADE');
    rippleLine.frustumCulled = false;
    
    ripple.mesh = rippleLine;
    this.scene.add(rippleLine);
    this._createdObjects.push(rippleLine);  // UNIFIED CLEANUP CONTRACT

    const haloMaterial = new THREE.LineBasicMaterial({
      color: rippleColor.clone().lerp(this.config.waveColor, 0.32),
      linewidth: 1,
      transparent: true,
      opacity: Math.min(0.18, this.config.rippleHaloOpacity + (intensity * 0.12)),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    });
    const haloGeometry = ringGeometry.clone();
    const haloLine = new THREE.Line(haloGeometry, haloMaterial);
    haloLine.position.copy(position);
    haloLine.position.y += Number(options.verticalOffset ?? 0) || 0;
    haloLine.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_CASCADE') + 1;
    haloLine.frustumCulled = false;
    ripple.haloMesh = haloLine;
    this.scene.add(haloLine);
    this._createdObjects.push(haloLine);
    
    this.ripples.push(ripple);
  }
  
  /**
   * Update ripple effects
   */
  updateRipples(deltaTime) {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      
      ripple.age += deltaTime;
      const fadeRatio = 1.0 - (ripple.age / ripple.lifetime);
      
      if (fadeRatio <= 0) {
        if (ripple.mesh) {
          this.scene.remove(ripple.mesh);
          ripple.mesh.geometry.dispose();
          ripple.mesh.material.dispose();
        }
        if (ripple.haloMesh) {
          this.scene.remove(ripple.haloMesh);
          ripple.haloMesh.geometry.dispose();
          ripple.haloMesh.material.dispose();
        }
        this.ripples.splice(i, 1);
        continue;
      }
      
      // Update ripple radius
      const radius = ripple.startRadius + (ripple.maxRadius * (1.0 - fadeRatio));
      
      if (ripple.mesh) {
        ripple.mesh.scale.setScalar(radius / 0.01);
        ripple.mesh.material.opacity = Math.min(1.0, 0.12 + fadeRatio * ripple.intensity * 0.68);
      }
      if (ripple.haloMesh) {
        ripple.haloMesh.scale.setScalar((radius * ripple.haloScale) / 0.01);
        ripple.haloMesh.material.opacity = Math.max(0, Math.min(0.24, (fadeRatio * ripple.intensity * 0.48) * 0.92));
      }
    }
  }
  
  /**
   * Get pooled particle or create new one
   */
  getPooledParticle() {
    if (this.cascadeParticles.length >= (this.config.maxActiveParticles ?? this.maxPoolSize)) {
      return null;
    }

    if (this.particlePool.length > 0) {
      const particle = this.particlePool.pop();
      particle.baseScale = 1;
      particle.size = 1;
      particle.active = false;
      particle.age = 0;
      particle.lifetime = 0;
      particle.intensity = 0;
      particle.forcedBurst = false;
      return particle;
    }
    
    if (this.cascadeParticles.length < this.maxPoolSize) {
      return {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        drift: new THREE.Vector3(),
        active: false,
        lifetime: 0,
        age: 0,
        intensity: 0,
        color: new THREE.Color(),
        size: 1,
        baseScale: 1,
        link: null,
        linkId: null,
        cascadeId: null,
        forcedBurst: false,
        phase: 0
      };
    }
    
    return null;
  }
  
  /**
   * Return particle to pool
   */
  returnParticleToPool(particle) {
    particle.active = false;
    particle.age = 0;
    particle.link = null;
    particle.linkId = null;
    particle.cascadeId = null;
    particle.forcedBurst = false;
    particle.size = 1;
    particle.baseScale = 1;
    
    if (this.particlePool.length < this.maxPoolSize) {
      this.particlePool.push(particle);
    }
  }

  _disposeBurstParticleSystem() {
    if (!this.burstParticleSystem) return;

    const { points, geometry, material } = this.burstParticleSystem;
    if (points) {
      points.parent?.remove(points);
    }
    geometry?.dispose?.();
    if (material?.uniforms?.uMap?.value?.dispose) {
      material.uniforms.uMap.value.dispose();
    }
    material?.dispose?.();

    this.burstParticleSystem = null;
    this.cascadeParticles = [];
    this.particlePool = [];
  }
  
  /**
   * Cleanup inactive cascades and clean up visual state
   */
  cleanupInactiveCascades() {
    // Remove inactive cascades
    this.activeCascades = this.activeCascades.filter(c => c.isActive);
    
    // Clean up cascade history for completed links
    for (const [link, history] of this.cascadeHistory.entries()) {
      const visualTarget = this._resolveLinkVisualTarget(link);
      if (visualTarget?.material) {
        const material = visualTarget.material;
        history.trailIntensity = Math.max(0, (history.trailIntensity || 0) * 0.9);

        // Keep a soft afterglow instead of hard reset
        if (material.emissiveIntensity !== undefined) {
          material.emissiveIntensity = Math.max(
            0,
            (material.emissiveIntensity || 0) * 0.88 + (history.trailIntensity || 0) * 0.5
          );
        }

        if (material.opacity !== undefined) {
          material.opacity = Math.min(1.0, (material.opacity || 0.75) + (history.trailIntensity || 0) * 0.03);
        }
      }
    }
    
    // Retain history while the link is still alive or still getting heartbeats.
    // Only purge entries that have gone stale long enough to be considered orphaned.
    const maxHistoryAge = 5.0; // seconds
    const now = this._nowSeconds();

    for (const [link, history] of this.cascadeHistory.entries()) {
      const resolvedLink = link ?? this._resolveLinkById(history?.linkId);
      const lastHeartbeatAt = Number(history?.lastHeartbeatAt ?? history?.lastSeenAt ?? 0);
      const age = now - lastHeartbeatAt;
      const isLive = !!resolvedLink && resolvedLink.active !== false;

      if (!isLive && age > maxHistoryAge) {
        if (history?.linkId) {
          this._flowCooldownByLinkId.delete(history.linkId);
          this._forcedBurstCooldownByLinkId.delete(history.linkId);
          this._rippleCooldownByLinkId.delete(history.linkId);
          this._burstCooldownByLinkId.delete(history.linkId);
        }
        this.cascadeHistory.delete(link);
      }
    }
  }
  
  /**
   * Count total affected links
   */
  getTotalAffectedLinks() {
    let count = 0;
    for (const cascade of this.activeCascades) {
      count += cascade.hops.length;
    }
    return count;
  }
  
  /**
   * Manual cascade trigger (for testing/gameplay)
   */
  triggerCascadeAtNode(node, intensity = 1.0) {
    const position = node?.position ?? null;
    const startPayload = {
      id: `manual-${++this.cascadeId}`,
      intensity: this._clamp01(intensity),
      center: position,
      anchor: position
    };
    this.renderCascadeStart(startPayload);
  }
  
  /**
   * Clear all active cascades
   */
  clearAllCascades() {
    this.activeCascades = [];
    this.cascadeHistory.clear();
    this.clearCascadeParticles();
    this.clearFlowParticles();
    this._rippleCooldownByLinkId.clear();
    this._burstCooldownByLinkId.clear();
    this._forcedBurstCooldownByLinkId.clear();
    this._forcedFlowCooldownByLinkId.clear();
    this._flowCooldownByLinkId.clear();
    this._topologyBiasCooldownByKey.clear();
    
    // Clean up ripples
    for (const ripple of this.ripples) {
      if (ripple.mesh) {
        this.scene.remove(ripple.mesh);
        ripple.mesh.geometry.dispose();
        ripple.mesh.material.dispose();
      }
    }
    this.ripples = [];
    this.stats.activeCascades = 0;
    this.stats.linksAffected = 0;
    this.stats.particlesActive = 0;
    
    console.log('🗑️ All cascades cleared');
  }
  
  /**
   * Setup console debugging API
   */
  setupConsoleAPI() {
    window.cascadeDebug = {
      visualizer: this,
      
      enable: () => {
        this.config.enabled = true;
        console.log('✅ Cascade visualizer enabled');
      },
      
      disable: () => {
        this.config.enabled = false;
        console.log('❌ Cascade visualizer disabled');
      },
      
      toggle: () => {
        this.config.enabled = !this.config.enabled;
        console.log(`Cascade visualizer: ${this.config.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
      },
      
      toggleDebug: () => {
        this.debugMode = !this.debugMode;
        console.log(`Debug mode: ${this.debugMode ? '🔴 ON' : '⚫ OFF'}`);
      },
      
      stats: () => {
        console.table({
          'Active Cascades': this.stats.activeCascades,
          'Links Affected': this.stats.linksAffected,
          'Active Particles': this.stats.particlesActive,
          'Last Frame Time': this.stats.lastUpdateTime.toFixed(2) + 'ms',
          'Frames Processed': this.stats.framesProcessed
        });
      },
      
      config: () => {
        console.log('📋 Cascade Configuration:', this.config);
      },
      
      setThreshold: (value) => {
        this.config.detectionThreshold = Math.max(0, Math.min(1, value));
        console.log(`🎯 Detection threshold: ${(this.config.detectionThreshold * 100).toFixed(0)}%`);
      },
      
      setSpeed: (value) => {
        this.config.propagationSpeed = Math.max(0.1, value);
        console.log(`⚡ Propagation speed: ${this.config.propagationSpeed.toFixed(2)}x`);
      },
      
      setParticles: (count) => {
        this.config.particleCount = Math.max(0, count);
        console.log(`💫 Particles per cascade: ${count}`);
      },
      
      setVisualizations: (types) => {
        Object.keys(types).forEach(key => {
          if (this.config.visualizations.hasOwnProperty(key)) {
            this.config.visualizations[key] = types[key];
          }
        });
        console.log('🎨 Visualizations updated:', this.config.visualizations);
      },
      
      trigger: (nodeIndex = 0) => {
        console.log('⚠️ Manual node-index trigger disabled in event-driven mode');
      },
      
      triggerMultiple: (count = 3) => {
        console.log('⚠️ Random cascade trigger disabled in event-driven mode');
      },
      
      clear: () => {
        this.clearAllCascades();
      },
      
      help: () => {
        console.log(`
🎯 SYNERGY CASCADE VISUALIZER DEBUG API
=====================================
cascadeDebug.enable()              - Enable cascade visualizations
cascadeDebug.disable()             - Disable cascade visualizations
cascadeDebug.toggle()              - Toggle on/off
cascadeDebug.toggleDebug()         - Toggle debug logging
cascadeDebug.stats()               - Show performance stats
cascadeDebug.config()              - Show current configuration
cascadeDebug.setThreshold(0.7)     - Set detection threshold (0-1)
cascadeDebug.setSpeed(2.0)         - Set propagation speed multiplier
cascadeDebug.setParticles(8)       - Set particles per cascade
cascadeDebug.setVisualizations({   - Toggle visualization types
  waveFront: true,
  cascadeGlow: true,
  flowParticles: true,
  rippleEffect: true,
  harmonicShimmer: true
})
cascadeDebug.trigger(nodeIndex)    - Trigger cascade at specific node
cascadeDebug.triggerMultiple(3)    - Trigger N random cascades
cascadeDebug.clear()               - Clear all active cascades
cascadeDebug.help()                - Show this help
        `);
      }
    };
    
    console.log('💡 Cascade debugging API available at: cascadeDebug');
  }

  dispose() {
    // Unsubscribe semantic listeners to prevent duplicate handlers after world switch.
    this._unbindSemanticEvents();

    // UNIFIED CLEANUP CONTRACT - Remove and dispose all tracked objects
    this._createdObjects.forEach(obj => {
      if (this.scene) this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this._createdObjects = [];

    this.clearAllCascades();
    this._disposeBurstParticleSystem();
    this._disposeFlowParticleSystem();
    this.burstPointFXBase = null;
    this.flowPointFXBase = null;
  }
}
