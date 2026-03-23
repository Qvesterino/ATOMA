/**
 * CascadeEventBridge_v1.js
 * ============================================================================
 * EVENT BRIDGE FOR CASCADE PARTICLE SYSTEM
 * 
 * Connects SemanticEventBus events to CascadeParticleSystem by updating
 * link.userData.cascadeIntensity and link.userData.cascadeConflictType.
 * 
 * FEATURES:
 * - Event-driven cascade intensity updates
 * - Automatic decay of cascade effects
 * - Conflict type classification based on event semantics
 * - FrameScheduler integration for decay mechanism
 * 
 * EVENT MAPPINGS:
 * - 'node.synergy.high' → cascadeIntensity = max(current, 0.7), conflictType = 'specialization_drift'
 * - 'metric:corruptionRise' / 'metric.corruption.spike' → cascadeIntensity = max(current, 0.9), conflictType = 'corruption'
 * - 'link:collapsed' → cascadeIntensity = 1.0, conflictType = 'destructive'
 * - 'node.hover' → cascadeIntensity = max(current, 0.3), conflictType = 'oscillatory_balance'
 * 
 * DECAY:
 * - cascadeIntensity *= 0.92 per frame (30 Hz on visual layer)
 * - Intensity resets to 0 when below 0.01
 * 
 * @author VFX Technical Director — ATOMA Project Session 120
 * @version 1.0.0
 */

export class CascadeEventBridge_v1 {
  constructor(config = {}) {
    this.linkingSystem = config.linkingSystem || null;
    this.semanticBus = config.semanticBus || globalThis?.semanticBus || null;
    this.frameScheduler = config.frameScheduler || globalThis?.frameScheduler || null;
    this.waveEngine = config.waveEngine || globalThis?.game?.waveInterferenceEngine || null;
    
    this.config = {
      decayRate: config.decayRate ?? 0.94,
      minIntensityThreshold: config.minIntensityThreshold ?? 0.01,
      cascadeWaveThreshold: config.cascadeWaveThreshold ?? 0.6, // Threshold for generating waves
      waveBurstCooldownMs: config.waveBurstCooldownMs ?? 550,
      enabled: config.enabled ?? true
    };

    // Event subscriptions
    this._subscriptions = [];
    this._boundHandlers = null;

    // State
    this._isRegistered = false;
    this._isInitialized = false;
    this._cascadeSequence = 0;
  }
  
  /**
   * Initialize the bridge
   */
  init() {
    if (this._isInitialized) return;
    
    if (!this.semanticBus) {
      console.warn('[CascadeEventBridge] No semanticBus available - event-driven disabled');
      return;
    }
    
    if (!this.linkingSystem) {
      console.warn('[CascadeEventBridge] No linkingSystem provided - cannot update links');
      return;
    }
    
    this._setupEventHandlers();
    this._subscribeToEvents();
    this._registerDecayUpdate();
    
    this._isInitialized = true;
  }
  
  /**
   * Setup event handlers
   */
  _setupEventHandlers() {
    this._boundHandlers = {
      handleNodeSynergyHigh: this._handleNodeSynergyHigh.bind(this),
      handleMetricCorruptionRise: this._handleMetricCorruptionRise.bind(this),
      handleLinkCollapsed: this._handleLinkCollapsed.bind(this),
      handleNodeHover: this._handleNodeHover.bind(this),
      decayUpdate: this._decayUpdate.bind(this)
    };
  }
  
  /**
   * Subscribe to semantic events
   */
  _subscribeToEvents() {
    const bus = this.semanticBus;
    const on = bus?.on?.bind(bus);
    const subscribe = bus?.subscribe?.bind(bus);
    
    if (typeof on === 'function') {
      // Prefer on() method for event subscription
      on('node.synergy.high', this._boundHandlers.handleNodeSynergyHigh);
      on('metric:corruptionRise', this._boundHandlers.handleMetricCorruptionRise);
      on('metric.corruption.spike', this._boundHandlers.handleMetricCorruptionRise);
      on('link:collapsed', this._boundHandlers.handleLinkCollapsed);
      on('node.hover', this._boundHandlers.handleNodeHover);
      
      this._subscriptions.push(
        () => bus.off?.('node.synergy.high', this._boundHandlers.handleNodeSynergyHigh),
        () => bus.off?.('metric:corruptionRise', this._boundHandlers.handleMetricCorruptionRise),
        () => bus.off?.('metric.corruption.spike', this._boundHandlers.handleMetricCorruptionRise),
        () => bus.off?.('link:collapsed', this._boundHandlers.handleLinkCollapsed),
        () => bus.off?.('node.hover', this._boundHandlers.handleNodeHover)
      );
    } else if (typeof subscribe === 'function') {
      // Fallback to subscribe() method
      const unsub1 = subscribe('node.synergy.high', this._boundHandlers.handleNodeSynergyHigh);
      const unsub2 = subscribe('metric:corruptionRise', this._boundHandlers.handleMetricCorruptionRise);
      const unsub3 = subscribe('metric.corruption.spike', this._boundHandlers.handleMetricCorruptionRise);
      const unsub4 = subscribe('link:collapsed', this._boundHandlers.handleLinkCollapsed);
      const unsub5 = subscribe('node.hover', this._boundHandlers.handleNodeHover);
      
      this._subscriptions.push(unsub1, unsub2, unsub3, unsub4, unsub5);
    }
  }
  
  /**
   * Register decay update to FrameScheduler
   */
  _registerDecayUpdate() {
    if (!this.frameScheduler) {
      console.warn('[CascadeEventBridge] No frameScheduler available - decay disabled');
      return;
    }
    
    const success = this.frameScheduler.register('visual', this._boundHandlers.decayUpdate, 'visual.cascadeEventBridge');
    
    if (success) {
      this._isRegistered = true;
    } else {
      console.warn('[CascadeEventBridge] Failed to register to frameScheduler');
    }
  }
  
  /**
   * Handle node.synergy.high event
   */
  _handleNodeSynergyHigh(event = {}) {
    if (!this.config.enabled) return;

    const nodeId = event.nodeId;
    const links = this._getLinksForNode(nodeId);

    for (const link of links) {
      if (!link.userData) link.userData = {};
      if (!link.userData.flowState) link.userData.flowState = {};

      // Write to shared flowState (single source of truth)
      const flowState = link.userData.flowState;
      flowState.intensity = Math.max(flowState.intensity ?? 0, 0.7);
      flowState.type = 'specialization_drift';
    }
  }
  
  /**
   * Handle metric:corruptionRise event
   */
  _handleMetricCorruptionRise(event = {}) {
    if (!this.config.enabled) return;

    const nodeId = event.nodeId;
    const links = this._getLinksForNode(nodeId);

    for (const link of links) {
      if (!link.userData) link.userData = {};
      if (!link.userData.flowState) link.userData.flowState = {};

      // Write to shared flowState (single source of truth)
      const flowState = link.userData.flowState;
      flowState.intensity = Math.max(flowState.intensity ?? 0, 0.9);
      flowState.type = 'corruption';
      flowState.energy = Math.max(flowState.energy ?? 0, 0.8);
    }
  }
  
  /**
   * Handle link:collapsed event
   */
  _handleLinkCollapsed(event = {}) {
    if (!this.config.enabled) return;

    const linkId = event.linkId;
    const link = this._getLinkById(linkId);

    if (link) {
      if (!link.userData) link.userData = {};
      if (!link.userData.flowState) link.userData.flowState = {};

      // Write to shared flowState (single source of truth)
      const flowState = link.userData.flowState;
      flowState.intensity = 1.0;
      flowState.type = 'destructive';
      flowState.energy = 1.0;
      flowState.direction = -1.0; // Collapse causes backflow
    }
  }
  
  /**
   * Handle node.hover event
   */
  _handleNodeHover(event = {}) {
    if (!this.config.enabled) return;

    const nodeId = event.nodeId;
    const links = this._getLinksForNode(nodeId);

    for (const link of links) {
      if (!link.userData) link.userData = {};
      if (!link.userData.flowState) link.userData.flowState = {};

      // Write to shared flowState (single source of truth)
      const flowState = link.userData.flowState;
      flowState.intensity = Math.max(flowState.intensity ?? 0, 0.3);
      flowState.type = 'oscillatory_balance';
      flowState.energy = Math.max(flowState.energy ?? 0, 0.4);
    }
  }
  
  /**
   * Decay cascade intensity for all links
   */
  _decayUpdate(deltaTime) {
    if (!this.config.enabled) return;
    
    const links = this.linkingSystem?.links || [];
    
    for (const link of links) {
      if (!link) continue;
      if (!link.userData) link.userData = {};
      
      // Initialize flowState if needed
      if (!link.userData.flowState) {
        link.userData.flowState = {
          intensity: 0.0,
          direction: 1.0,
          type: 'resolved_harmony',
          energy: 0.0
        };
      }
      
      const flowState = link.userData.flowState;
      const lifecycle = this._ensureCascadeLifecycle(link);
      const wasActive = lifecycle.active === true;
      
      // Calculate target intensity from node cascadeStrength
      const targetIntensity = this._calculateTargetIntensity(link);
      
      // Apply smoothing with lerp (0.2 factor)
      const lerpFactor = 0.2;
      flowState.intensity = flowState.intensity + (targetIntensity - flowState.intensity) * lerpFactor;
      
      // Clamp to 0-1 range
      flowState.intensity = Math.max(0, Math.min(1, flowState.intensity));
      
      // Reset to 0 when below threshold
      if (flowState.intensity < this.config.minIntensityThreshold) {
        flowState.intensity = 0;
      }

      if (wasActive && flowState.intensity <= 0) {
        this._emitCascadeEnd(link, flowState);
      }
      
      // Decay energy (slower decay for continuous field)
      if (flowState.energy > 0) {
        flowState.energy = flowState.energy * (this.config.decayRate + 0.05);
        
        if (flowState.energy < this.config.minIntensityThreshold) {
          flowState.energy = 0;
        }
      }
      
      // Generate wave burst if intensity is high enough
      if (flowState.intensity > this.config.cascadeWaveThreshold) {
        this._requestCascadeWaveBurst(link, flowState);
      }

      // Canonical per-link writes (Critical 5 authority fields for cascade/conflict)
      // Keep legacy keys populated every frame so all downstream readers get values.
      const canonicalIntensity = Math.max(0, Math.min(1, flowState.intensity ?? 0));
      const canonicalType = flowState.type || 'resolved_harmony';
      const canonicalConflict = Math.max(
        canonicalIntensity,
        Math.max(0, Math.min(1, flowState.energy ?? 0))
      );

      // Synergy collapse state (sync with LinkCorruptionTransmission events)
      const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
      const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
      const sourceCorruption = sourceNode?.userData?.metrics?.corruption ?? 0;
      const targetCorruption = targetNode?.userData?.metrics?.corruption ?? 0;
      const synergy = link?.userData?.synergy?.score ?? 0;

      // synergyCollapse = true if corruption > 0.7 OR synergy > 0.8 (high activity)
      const wasSynergyCollapse = link.userData.synergyCollapse === true;
      const isSynergyCollapse = (
        canonicalIntensity > 0.6 ||
        sourceCorruption > 0.7 ||
        targetCorruption > 0.7 ||
        synergy > 0.8
      );

      // synergyCascadeTime = start time of collapse (set only on false -> true transition)
      const currentCascadeTime = (!wasSynergyCollapse && isSynergyCollapse)
        ? Date.now()
        : (link.userData.synergyCascadeTime ?? 0);

      link.userData.cascadeIntensity = canonicalIntensity;
      link.userData.cascadeConflictType = canonicalType;
      link.userData.conflictIntensity = canonicalConflict;
      link.userData.synergyCollapse = isSynergyCollapse;
      link.userData.synergyCascadeTime = currentCascadeTime;

      // Stamp canonical writes for cascade fields
      link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
      link.userData.__canonicalWriteAt.cascadeIntensity = Date.now();
      link.userData.__canonicalWriteAt.cascadeConflictType = Date.now();
      link.userData.__canonicalWriteAt.conflictIntensity = Date.now();
      link.userData.__canonicalWriteAt.synergyCollapse = Date.now();
      link.userData.__canonicalWriteAt.synergyCascadeTime = Date.now();
    }
  }
  
  /**
   * Calculate target intensity from node cascadeStrength
   */
  _calculateTargetIntensity(link) {
    const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
    const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
    
    if (!sourceNode || !targetNode) return 0;
    
    // Get cascadeStrength from source and target nodes
    const sourceStrength = sourceNode.userData?.metrics?.cascadeStrength 
      ?? sourceNode.userData?.cascadeStrength 
      ?? 0;
    const targetStrength = targetNode.userData?.metrics?.cascadeStrength 
      ?? targetNode.userData?.cascadeStrength 
      ?? 0;
    
    // Use max of source and target node cascadeStrength
    return Math.max(sourceStrength, targetStrength);
  }
  
  /**
   * Get links connected to a node
   */
  _getLinksForNode(nodeId) {
    if (!this.linkingSystem) return [];
    
    const links = this.linkingSystem.links || [];
    const nodeLinks = [];
    
    for (const link of links) {
      const sourceId = this.linkingSystem.getNodeId?.(link.source);
      const targetId = this.linkingSystem.getNodeId?.(link.target);
      
      if (sourceId === nodeId || targetId === nodeId) {
        nodeLinks.push(link);
      }
    }
    
    return nodeLinks;
  }
  
  /**
   * Get link by ID
   */
  _getLinkById(linkId) {
    if (!this.linkingSystem) return null;
    
    const links = this.linkingSystem.links || [];
    
    for (const link of links) {
      if (link.id === linkId) {
        return link;
      }
    }
    
    return null;
  }

  _ensureCascadeLifecycle(link) {
    if (!link.userData) link.userData = {};
    link.userData._cascadeLifecycle ??= {
      active: false,
      cascadeId: null,
      startedAt: 0
    };
    return link.userData._cascadeLifecycle;
  }

  _resolveNodeId(nodeLike) {
    if (!nodeLike) return null;
    return nodeLike.userData?.nodeId || nodeLike.id || nodeLike.uuid || nodeLike.name || null;
  }

  _createCascadeId(linkId) {
    this._cascadeSequence += 1;
    return `cascade-${String(linkId)}-${this._cascadeSequence}`;
  }

  _buildCascadePayload(link, flowState) {
    const linkId = link?.id || link?.uuid || link?.name || null;
    if (!linkId) return null;

    const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
    const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
    if (!sourceNode || !targetNode) return null;

    const sourcePosition = sourceNode.position;
    const targetPosition = targetNode.position;
    if (!sourcePosition || !targetPosition) return null;

    const lifecycle = this._ensureCascadeLifecycle(link);
    const midpoint = {
      x: (sourcePosition.x + targetPosition.x) * 0.5,
      y: (sourcePosition.y + targetPosition.y) * 0.5,
      z: (sourcePosition.z + targetPosition.z) * 0.5
    };

    return {
      cascadeId: lifecycle.cascadeId,
      id: lifecycle.cascadeId,
      link,
      linkId,
      sourceNode,
      targetNode,
      sourceId: linkId,
      targetId: this._resolveNodeId(targetNode),
      sourceNodeId: this._resolveNodeId(sourceNode),
      targetNodeId: this._resolveNodeId(targetNode),
      sourcePosition: {
        x: sourcePosition.x,
        y: sourcePosition.y,
        z: sourcePosition.z
      },
      targetPosition: {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z
      },
      center: midpoint,
      position: midpoint,
      origin: midpoint,
      intensity: flowState?.intensity ?? 0,
      strength: flowState?.intensity ?? 0,
      value: flowState?.intensity ?? 0,
      conflictType: flowState?.type || 'resolved_harmony',
      energy: flowState?.energy ?? 0,
      direction: flowState?.direction ?? 1.0
    };
  }

  _emitCascadeStart(link, flowState) {
    const semanticBus = this.semanticBus || null;
    if (!semanticBus?.emit) return null;

    const lifecycle = this._ensureCascadeLifecycle(link);
    const linkId = link?.id || link?.uuid || link?.name || null;
    if (!lifecycle.cascadeId) {
      lifecycle.cascadeId = this._createCascadeId(linkId || 'link');
    }

    const payload = this._buildCascadePayload(link, flowState);
    if (!payload) return null;

    lifecycle.active = true;
    lifecycle.startedAt = performance.now();

    semanticBus.emit('cascade.start', payload, {
      priority: semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL
    });

    return payload;
  }

  _emitCascadeEnd(link, flowState) {
    const semanticBus = this.semanticBus || null;
    if (!semanticBus?.emit) return;

    const lifecycle = this._ensureCascadeLifecycle(link);
    if (!lifecycle.active || !lifecycle.cascadeId) return;

    const payload = this._buildCascadePayload(link, flowState);
    if (!payload) {
      lifecycle.active = false;
      lifecycle.cascadeId = null;
      lifecycle.startedAt = 0;
      return;
    }

    const durationMs = Math.max(0, performance.now() - (lifecycle.startedAt || performance.now()));
    semanticBus.emit('cascade.end', {
      ...payload,
      durationMs
    }, {
      priority: semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL
    });

    lifecycle.active = false;
    lifecycle.cascadeId = null;
    lifecycle.startedAt = 0;
  }
  
  /**
   * Request wave burst from WaveInterferenceEngine for cascade activity
   */
  _requestCascadeWaveBurst(link, flowState) {
    if (!this.waveEngine || !this.waveEngine.requestBurstIntent) return;

    const linkId = link.id || link.uuid || link.name;
    if (!linkId) return;

    const lifecycle = this._ensureCascadeLifecycle(link);
    if (!lifecycle.active) {
      lifecycle.cascadeId = this._createCascadeId(linkId);
      this._emitCascadeStart(link, flowState);
    }

    const now = performance.now();

    // Initialize last wave burst time if needed
    link.userData._lastWaveBurstTime ??= 0;

    // Check cooldown
    if (now - link.userData._lastWaveBurstTime < this.config.waveBurstCooldownMs) {
      return; // Skip - still in cooldown
    }

    // Validate flowState data before requesting burst
    if (!Number.isFinite(flowState.intensity)) return;
    if (flowState.intensity <= 0) return;

    // Update last burst time
    link.userData._lastWaveBurstTime = now;

    const semanticBus = this.semanticBus || null;
    if (!semanticBus?.emit) return;

    const payload = this._buildCascadePayload(link, flowState);
    if (!payload) return;

    semanticBus.emit('cascade.hop', payload, {
      priority: semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL
    });
  }
  
  /**
   * Dispose the bridge
   */
  dispose() {
    // Unsubscribe from events
    for (const unsubscribe of this._subscriptions) {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    }
    this._subscriptions = [];
    
    // Unregister from FrameScheduler
    if (this._isRegistered && this.frameScheduler) {
      this.frameScheduler.unregister('visual.cascadeEventBridge');
      this._isRegistered = false;
    }

    // Clear handlers
    this._boundHandlers = null;
    this._isInitialized = false;
  }

  /**
   * Rebind after world switch (updates linkingSystem, semanticBus, frameScheduler)
   */
  rebind(config = {}) {
    // Update references if provided
    if (config.linkingSystem !== undefined) {
      this.linkingSystem = config.linkingSystem;
    }
    if (config.semanticBus !== undefined) {
      this.semanticBus = config.semanticBus;
    }
    if (config.frameScheduler !== undefined) {
      this.frameScheduler = config.frameScheduler;
    }

    // Re-initialize if not already initialized
    if (!this._isInitialized) {
      this.init();
    } else {
      // Already initialized - just refresh bindings
      if (!this.semanticBus) {
        console.warn('[CascadeEventBridge] No semanticBus available - event-driven disabled');
        return;
      }
      
      if (!this.linkingSystem) {
        console.warn('[CascadeEventBridge] No linkingSystem provided - cannot update links');
        return;
      }

      // Unsubscribe from old events and re-subscribe
      for (const unsubscribe of this._subscriptions) {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      }
      this._subscriptions = [];

      // Re-setup and re-subscribe to events
      this._setupEventHandlers();
      this._subscribeToEvents();

      // Re-register to FrameScheduler
      if (this._isRegistered && this.frameScheduler) {
        this.frameScheduler.unregister('visual.cascadeEventBridge');
        this._isRegistered = false;
      }
      this._registerDecayUpdate();
    }
  }
}

/**
 * Factory function to create and initialize CascadeEventBridge
 */
export function createCascadeEventBridge(config = {}) {
  const bridge = new CascadeEventBridge_v1(config);
  bridge.init();
  return bridge;
}
