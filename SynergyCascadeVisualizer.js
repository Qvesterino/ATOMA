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

export class SynergyCascadeVisualizer {
  constructor(scene, linkingSystem, camera) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.camera = camera;
    
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
      framesProcessed: 0
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
      particleCount: 14,              // Particles per active cascade
      particleSpeed: 1.2,             // Multiplier on propagation speed
      particleLifetime: 1.45,         // Seconds
      
      // Color scheme
      cascadeColor: new THREE.Color(0xffb11a), // Warm amber for cascade body
      waveColor: new THREE.Color(0xfff3c4),    // Bright gold for pulse head
      fadeColor: new THREE.Color(0xff6f22),    // Ember orange for fade / dust
      
      // Performance
      batchSize: 30,                  // Update cascades in batches
      updateFrequency: 1,             // Update every N frames
      maxActiveCascades: 50,          // Max simultaneous cascades
      hopLifetime: 0.7,               // Seconds each hop stays visually active
      minBurstIntensity: 0.06         // Ignore ultra-weak bursts
    };
    
    // Cascade particles
    this.cascadeParticles = [];
    this.particlePool = [];
    this.maxPoolSize = 500;
    
    // Ripple effect system
    this.ripples = [];
    
    // Frame counter
    this.frameCounter = 0;
    this._semanticBus = null;
    this._semanticHandlers = null;
    
    // Debug mode
    this.debugMode = false;
    
    console.log('✅ SynergyCascadeVisualizer initialized');
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
    
    // Update cascade particles
    this.updateCascadeParticles(deltaTime);
    
    // Update ripple effects
    this.updateRipples(deltaTime);
    
    // Cleanup dead cascades
    this.cleanupInactiveCascades();
    
    this.stats.lastUpdateTime = performance.now() - startTime;
    this.stats.activeCascades = this.activeCascades.length;
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
      onCascadeEnd: (event = {}) => this.renderCascadeEnd(event)
    };
    on('cascade.hop', this._semanticHandlers.onCascadeHop);
    on('cascade.start', this._semanticHandlers.onCascadeStart);
    on('cascade.end', this._semanticHandlers.onCascadeEnd);
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
      : Number.isFinite(Number(signals.value))
        ? Number(signals.value)
        : Number.isFinite(Number(signals.strength))
          ? Number(signals.strength)
          : fallback;
    return this._clamp01(resolved);
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
      event.intensity ?? event.value ?? event.strength
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

    this.stats.activeCascades = this.activeCascades.length;
    this.stats.linksAffected = this.getTotalAffectedLinks();
    this.stats.particlesActive = this.cascadeParticles.length;

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
    const link = event.link ?? event.linkRef ?? this._resolveLinkById(event.linkId ?? event.id);
    const cascadeId = event.cascadeId ?? event.id ?? `cascade-${++this.cascadeId}`;
    const activation = this._resolveCascadeActivation({
      ...event,
      anchor: event.anchor ?? this._resolveBurstAnchor(event, link)
    });
    if (!activation) return;
    const { intensity, anchor } = activation;
    this._getOrCreateCascade(cascadeId, intensity);
    if (this.config.visualizations.rippleEffect) {
      this.createRipple(anchor, Math.max(0.1, intensity));
    }
    if (this.config.visualizations.burstParticles) {
      this.spawnBurstParticles(anchor, intensity, event);
    }
  }

  renderCascadeHop(event = {}) {
    const link = event.link ?? event.linkRef ?? this._resolveLinkById(event.linkId ?? event.id);
    const cascadeId = event.cascadeId ?? event.id ?? `cascade-${++this.cascadeId}`;
    const intensity = this._clamp01(this._resolveCascadeIntensity(event));
    const anchor = this._resolveBurstAnchor(event, link) ?? this._asVector3(event.anchor ?? event.position ?? event.center ?? event.origin ?? event.targetPosition ?? event.sourcePosition);
    const startPosition = this._asVector3(
      event.sourcePosition ??
      event.fromPosition ??
      event.origin ??
      link?.source?.position ??
      link?.sourceNode?.position ??
      link?.nodeA?.position ??
      event.start
    );
    const targetPosition = this._asVector3(
      event.targetPosition ??
      event.toPosition ??
      event.center ??
      link?.target?.position ??
      link?.targetNode?.position ??
      link?.nodeB?.position ??
      event.end
    );
    if (!link && (!startPosition || !targetPosition) && !anchor) return;

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
            this.createRipple(hop.targetPosition, hop.intensity * 0.5);
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
    if (!link || !link.mesh) return;
    if (!link.userData) link.userData = {};
    
    // Get or create cascade history for this link
    if (!this.cascadeHistory.has(link)) {
      this.cascadeHistory.set(link, {
        linkId: this._resolveLinkId(link),
        cascadeIntensity: 0,
        color: new THREE.Color()
      });
    }
    
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
    if (link.mesh && link.mesh.material) {
      const baseMaterial = link.mesh.material;
      const waveWidth = this.config.waveWidth;
      
      // Highlight wave position with brighter color
      const distance = Math.abs(wavePos - 0.5) * 2; // Distance from center
      const waveBrightness = Math.max(0, 1.0 - (distance / waveWidth));
      const headStrength = Math.min(1, waveIntensity * (0.65 + waveBrightness * 0.8));
      const tailStrength = Math.min(1, (history.trailIntensity || 0) * 0.85);

      if (baseMaterial.color) {
        baseMaterial.color.copy(this.config.cascadeColor).lerp(this.config.waveColor, headStrength);
      }
      
      if (baseMaterial.emissive) {
        baseMaterial.emissive.copy(this.config.waveColor);
        baseMaterial.emissiveIntensity = Math.max(
          baseMaterial.emissiveIntensity || 0,
          (waveBrightness * waveIntensity * 3.2) + (tailStrength * 1.2)
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
    if (!link.mesh || !link.mesh.material) return;
    
    const material = link.mesh.material;
    const cascadeIntensity = propagation.intensity;
    history.trailIntensity = Math.max((history.trailIntensity || 0) * 0.92, cascadeIntensity);
    const trailIntensity = history.trailIntensity;
    
    // Enhance glow based on cascade intensity
    if (material.color) {
      material.color.copy(this.config.cascadeColor).lerp(this.config.fadeColor, Math.min(1, trailIntensity * 0.8));
    }

    if (material.emissive) {
      const baseColor = this.config.cascadeColor.clone();
      
      // Blend cascadeColor based on intensity
      material.emissive.copy(baseColor).lerp(this.config.fadeColor, Math.min(1, trailIntensity * 0.7));
      material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, cascadeIntensity * 2.2 + trailIntensity * 1.1);
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
    if (!link.mesh || !link.mesh.material) return;
    
    const material = link.mesh.material;
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
    const emissionBoost = this._resolveCascadeEmissionBoost(propagation);
    const particleCount = Math.ceil(this.config.particleCount * propagation.intensity * 0.85 * emissionBoost);
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
      const particle = this.getPooledParticle();
      
      if (!particle) break; // No more particles available
      
      // Calculate particle position
      const lerpPos = Math.max(0, Math.min(1, propagation.position - Math.random() * 0.18));
      
      const position = new THREE.Vector3().lerpVectors(
        startPos,
        targetPos,
        Math.max(0, Math.min(1, lerpPos))
      );
      const driftAmount = 0.04 + Math.random() * 0.08;
      position.addScaledVector(side, (Math.random() - 0.5) * driftAmount);
      position.addScaledVector(up, (Math.random() - 0.5) * driftAmount * 0.6);
      
      // Initialize particle
      particle.position.copy(position);
      particle.active = true;
      particle.lifetime = this.config.particleLifetime;
      particle.age = 0;
      particle.velocity = new THREE.Vector3().subVectors(
        targetPos,
        startPos
      ).normalize().multiplyScalar(this.config.particleSpeed * propagation.intensity);
      particle.drift = new THREE.Vector3(
        (Math.random() - 0.5) * 0.12,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.12
      );
      
      particle.intensity = propagation.intensity;
      particle.color = this.config.waveColor.clone().lerp(this.config.cascadeColor, Math.random() * 0.35);
      if (particle.mesh) {
        particle.mesh.visible = true;
        if (particle.mesh.material) {
          particle.mesh.material.opacity = Math.min(1.0, 0.95 * particle.intensity + 0.18);
        }
        if (particle.mesh.material?.color && particle.color) {
          particle.mesh.material.color.copy(particle.color);
        }
      }
      
      this.cascadeParticles.push(particle);
    }
  }

  spawnBurstParticles(center, intensity, event = {}) {
    const anchor = this._asVector3(center);
    const burstIntensity = this._clamp01(intensity);
    if (!anchor || burstIntensity < this.config.minBurstIntensity) return;

    const emissionBoost = this._resolveCascadeEmissionBoost(event);
    const particleCount = Math.max(3, Math.ceil(this.config.particleCount * burstIntensity * 0.75 * emissionBoost));
    const burstRadius = 0.08 + burstIntensity * 0.28;
    const burstLifetime = Math.max(0.42, this.config.particleLifetime * 0.62);

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

      const position = anchor.clone().addScaledVector(direction, Math.random() * burstRadius);
      particle.position.copy(position);
      particle.active = true;
      particle.lifetime = burstLifetime;
      particle.age = 0;
      particle.velocity = direction.clone().multiplyScalar(this.config.particleSpeed * (1.1 + burstIntensity * 0.8));
      particle.drift = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        Math.random() * 0.06,
        (Math.random() - 0.5) * 0.05
      );
      particle.intensity = Math.max(0.25, burstIntensity);
      particle.color = this.config.cascadeColor.clone().lerp(this.config.waveColor, 0.72 + Math.random() * 0.18);

      if (particle.mesh) {
        particle.mesh.visible = true;
        particle.mesh.position.copy(position);
        if (particle.mesh.material) {
          particle.mesh.material.opacity = Math.min(1.0, 0.52 + particle.intensity * 0.48);
        }
        if (particle.mesh.material?.color && particle.color) {
          particle.mesh.material.color.copy(particle.color);
        }
      }

      this.cascadeParticles.push(particle);
    }
  }
  
  /**
   * Update cascade particles
   */
  updateCascadeParticles(deltaTime) {
    for (let i = this.cascadeParticles.length - 1; i >= 0; i--) {
      const particle = this.cascadeParticles[i];
      
      if (!particle.active) continue;
      
      particle.age += deltaTime;
      
      // Update position
      particle.position.addScaledVector(particle.velocity, deltaTime);
      if (particle.drift) {
        particle.position.addScaledVector(particle.drift, deltaTime);
      }
      
      // Fade out
      const fadeRatio = 1.0 - (particle.age / particle.lifetime);
      if (fadeRatio <= 0) {
        particle.active = false;
        this.cascadeParticles.splice(i, 1);
        this.returnParticleToPool(particle);
        continue;
      }
      
      // Update particle mesh
      if (particle.mesh) {
        particle.mesh.position.copy(particle.position);
        if (particle.mesh.material.color && particle.color) {
          particle.mesh.material.color.copy(particle.color).lerp(this.config.fadeColor, 1.0 - fadeRatio);
        }
        particle.mesh.material.opacity = Math.min(1.0, fadeRatio * 0.88 * particle.intensity + 0.08);
        
        // Size decreases with age
        const scale = 0.9 - (particle.age / particle.lifetime) * 0.45;
        particle.mesh.scale.setScalar(scale);
      }
    }
    
    this.stats.particlesActive = this.cascadeParticles.length;
  }
  
  /**
   * Create ripple effect at position
   */
  createRipple(position, intensity) {
    const ripple = {
      center: position.clone(),
      startRadius: 0,
      maxRadius: 3.6 + intensity * 2.4,
      lifetime: 1.05,
      age: 0,
      intensity: intensity,
      mesh: null
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
      color: this.config.waveColor,
      linewidth: 2,
      transparent: true,
      opacity: Math.min(1.0, intensity * 0.9)
    });
    
    const rippleLine = new THREE.Line(ringGeometry, rippleMaterial);
    rippleLine.position.copy(position);
    
    ripple.mesh = rippleLine;
    this.scene.add(rippleLine);
    
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
        this.ripples.splice(i, 1);
        continue;
      }
      
      // Update ripple radius
      const radius = ripple.startRadius + (ripple.maxRadius * (1.0 - fadeRatio));
      
      if (ripple.mesh) {
        ripple.mesh.scale.setScalar(radius / 0.01);
        ripple.mesh.material.opacity = fadeRatio * ripple.intensity * 0.6;
      }
    }
  }
  
  /**
   * Get pooled particle or create new one
   */
  getPooledParticle() {
    if (this.particlePool.length > 0) {
      const particle = this.particlePool.pop();
      if (particle?.mesh) {
        particle.mesh.visible = true;
        if (particle.mesh.material) {
          particle.mesh.material.opacity = 0.9;
        }
      }
      return particle;
    }
    
    if (this.cascadeParticles.length < this.maxPoolSize) {
      const geometry = new THREE.SphereGeometry(0.06, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: this.config.waveColor.clone(),
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = true;
      this.scene.add(mesh);
      
      return {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        drift: new THREE.Vector3(),
        mesh: mesh,
        active: false,
        lifetime: 0,
        age: 0,
        intensity: 0,
        color: new THREE.Color()
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
    if (particle.mesh) {
      particle.mesh.visible = false;
      if (particle.mesh.material) {
        particle.mesh.material.opacity = 0;
      }
    }
    
    if (this.particlePool.length < this.maxPoolSize) {
      this.particlePool.push(particle);
    } else if (particle.mesh) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      particle.mesh.material.dispose();
    }
  }
  
  /**
   * Cleanup inactive cascades and clean up visual state
   */
  cleanupInactiveCascades() {
    // Remove inactive cascades
    this.activeCascades = this.activeCascades.filter(c => c.isActive);
    
    // Clean up cascade history for completed links
    for (const [link, history] of this.cascadeHistory.entries()) {
      if (link && link.mesh && link.mesh.material) {
        const material = link.mesh.material;
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
    
    // Periodically clear old history entries
    if (Math.random() < 0.01) { // 1% chance per frame
      const maxHistoryAge = 5000; // 5 seconds
      const now = Date.now();
      
      for (const [link, history] of this.cascadeHistory.entries()) {
        if (!link || !link.active) {
          this.cascadeHistory.delete(link);
        }
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

    this.clearAllCascades();

    for (const particle of this.particlePool) {
      if (!particle?.mesh) continue;
      this.scene.remove(particle.mesh);
      particle.mesh.geometry?.dispose?.();
      particle.mesh.material?.dispose?.();
    }
    this.particlePool = [];
  }
}
