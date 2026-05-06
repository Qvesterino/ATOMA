/**
 * CascadeEventBridge_v1.js
 * ============================================================================
 * EVENT BRIDGE FOR CASCADE PARTICLE SYSTEM
 * 
 * Connects SemanticEventBus events to cascade state by updating
 * link.userData.flowState, link.userData.cascadeIntensity, and
 * link.userData.cascadeConflictType.
 * 
 * FEATURES:
 * - Event-driven cascade intensity updates
 * - On-demand maintenance tick for decay and lifecycle cleanup
 * - Conflict type classification based on event semantics
 * - Emits cascade.hop semantic intents for downstream wave/VFX systems
 * - Maintenance tick owned centrally by main.js
 * 
 * EVENT MAPPINGS:
 * - 'node.synergy.high' → cascadeIntensity = max(current, 0.7), conflictType = 'specialization_drift'
 * - 'node.corruption.high' → cascadeIntensity = max(current, 0.9), conflictType = 'corruption'
 * - 'link.harmony.mid' → bounded harmony flow emphasis without becoming metric authority
 * - 'link.harmony.high' → stronger harmony flow emphasis for visible cascade continuity
 * 
 * DECAY:
 * - cascadeIntensity decays on the maintenance tick (dt-scaled, visual lane)
 * - Intensity resets to 0 when below 0.01
 * 
 * @author VFX Technical Director — ATOMA Project Session 120
 * @version 1.0.0
 */

import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

export class CascadeEventBridge_v1 {
  constructor(config = {}) {
    this.linkingSystem = config.linkingSystem || null;
    this.semanticBus = config.semanticBus || globalThis?.semanticBus || null;
    this.config = {
      decayRate: config.decayRate ?? 0.94,
      minIntensityThreshold: config.minIntensityThreshold ?? 0.01,
      cascadeWaveThreshold: config.cascadeWaveThreshold ?? 0.6,
      waveBurstCooldownMs: config.waveBurstCooldownMs ?? 550,
      enabled: config.enabled ?? true
    };

    // Event subscriptions
    this._subscriptions = [];
    this._boundHandlers = null;
    this._dirtyLinks = new Set();
    this._activeLinks = new Set();
    this._recentPhaseSignals = new Map();
    this._phaseSignalDedupMs = config.phaseSignalDedupMs ?? 350;
    this._registryOwner = 'CascadeEventBridge_v1';

    // State
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
    this._primeCascadeTrackingFromExistingLinks();
    
    this._isInitialized = true;
  }
  
  /**
   * Setup event handlers
   */
  _setupEventHandlers() {
    this._boundHandlers = {
      handleNodeSynergyHigh: this._handleNodeSynergyHigh.bind(this),
      handleMetricCorruptionRise: this._handleMetricCorruptionRise.bind(this),
      handleLinkHarmonyMid: (event = {}) => this._handleLinkHarmonyTier(event, 'mid'),
      handleLinkHarmonyHigh: (event = {}) => this._handleLinkHarmonyTier(event, 'high'),
      decayUpdate: this._decayUpdate.bind(this)
    };
  }
  
  /**
   * Subscribe to semantic events
   */
  _subscribeToEvents() {
    const bus = this.semanticBus;
    if (!bus) return;

    const register = (eventName, handler) => {
      const disposer = eventRegistrationRegistry.register(
        this._registryOwner,
        eventName,
        handler,
        bus
      );
      this._subscriptions.push(disposer);
    };

    register('node.synergy.high', this._boundHandlers.handleNodeSynergyHigh);
    register('node.corruption.high', this._boundHandlers.handleMetricCorruptionRise);
    register('link.harmony.mid', this._boundHandlers.handleLinkHarmonyMid);
    register('link.harmony.high', this._boundHandlers.handleLinkHarmonyHigh);
  }
  
  _queueCascadeLink(link) {
    if (!link) return;

    link.userData ??= {};
    link.userData.cascadeAuthorityOwner = this._registryOwner;
    this._dirtyLinks.add(link);
    this._activeLinks.add(link);
  }

  _normalizeMetricName(metric) {
    return String(metric ?? '').trim().toLowerCase();
  }

  _normalizePhaseName(phase) {
    return String(phase ?? '').trim().toLowerCase();
  }

  _getPhaseSignalKey(metric, phase, nodeId) {
    return `${this._normalizeMetricName(metric)}:${this._normalizePhaseName(phase)}:${String(nodeId ?? '')}`;
  }

  _shouldDedupPhaseSignal(metric, phase, nodeId) {
    const now = Date.now();
    const key = this._getPhaseSignalKey(metric, phase, nodeId);
    const last = Number(this._recentPhaseSignals.get(key) ?? -Infinity);
    if (Number.isFinite(last) && (now - last) < this._phaseSignalDedupMs) {
      return true;
    }

    this._recentPhaseSignals.set(key, now);
    if (this._recentPhaseSignals.size > 96) {
      for (const [signalKey, seenAt] of this._recentPhaseSignals.entries()) {
        if ((now - seenAt) > this._phaseSignalDedupMs * 2) {
          this._recentPhaseSignals.delete(signalKey);
        }
      }
    }

    return false;
  }

  _primeCascadeTrackingFromExistingLinks() {
    const links = this.linkingSystem?.links || [];
    let hasActiveLinks = false;

    for (const link of links) {
      if (!link?.userData) continue;

      const flowState = link.userData.flowState;
      const intensity = Number(flowState?.intensity ?? 0) || 0;
      const energy = Number(flowState?.energy ?? 0) || 0;
      const isActive = (
        intensity > this.config.minIntensityThreshold ||
        energy > this.config.minIntensityThreshold ||
        link.userData.synergyCollapse === true
      );

      if (isActive) {
        this._activeLinks.add(link);
        hasActiveLinks = true;
      }
    }

  }
  
  /**
   * Handle node.synergy.high event
   */
  _handleNodeSynergyHigh(event = {}, skipDedup = false) {
    if (!this.config.enabled) return;

    const nodeId = event.nodeId;
    if (!skipDedup && this._shouldDedupPhaseSignal('synergy', 'high', nodeId)) return;
    const links = this._getLinksForNode(nodeId);

    for (const link of links) {
      if (!link.userData) link.userData = {};
      if (!link.userData.flowState) link.userData.flowState = {};

      // Write to shared flowState (single source of truth)
      const flowState = link.userData.flowState;
      flowState.intensity = Math.max(flowState.intensity ?? 0, 0.7);
      flowState.type = 'specialization_drift';
      this._queueCascadeLink(link);

      if ((flowState.intensity ?? 0) >= this.config.cascadeWaveThreshold) {
        this._emitCascadeHop(link, flowState);
      }
    }
  }
  
  /**
   * Handle node.corruption.high event
   */
  _handleMetricCorruptionRise(event = {}, skipDedup = false) {
    if (!this.config.enabled) return;

    const nodeId = event.nodeId;
    if (!skipDedup && this._shouldDedupPhaseSignal('corruption', 'high', nodeId)) return;
    const links = this._getLinksForNode(nodeId);

    for (const link of links) {
      if (!link.userData) link.userData = {};
      if (!link.userData.flowState) link.userData.flowState = {};

      // Write to shared flowState (single source of truth)
      const flowState = link.userData.flowState;
      flowState.intensity = Math.max(flowState.intensity ?? 0, 0.9);
      flowState.type = 'corruption';
      flowState.energy = Math.max(flowState.energy ?? 0, 0.8);
      this._queueCascadeLink(link);

      if ((flowState.intensity ?? 0) >= this.config.cascadeWaveThreshold) {
        this._emitCascadeHop(link, flowState);
      }
    }
  }

  _handleLinkHarmonyTier(event = {}, tier = 'mid') {
    if (!this.config.enabled) return;

    const sourceNodeId = event.sourceNodeId ?? event.nodeId ?? event.fromId ?? null;
    const targetNodeId = event.targetNodeId ?? event.toId ?? null;
    const links = targetNodeId
      ? this._getLinksForPair(sourceNodeId, targetNodeId)
      : this._getLinksForNode(sourceNodeId);
    if (!Array.isArray(links) || links.length === 0) return;

    const value = Math.max(0, Math.min(1, Number(event.value ?? event.intensity ?? event.strength ?? 0) || 0));
    const baseIntensity = tier === 'high' ? 0.65 : 0.48;
    const baseEnergy = tier === 'high' ? 0.58 : 0.4;

    for (const link of links) {
      if (!link?.userData) link.userData = {};
      if (!link.userData.flowState) link.userData.flowState = {};

      const flowState = link.userData.flowState;
      flowState.intensity = Math.max(flowState.intensity ?? 0, Math.max(baseIntensity, value));
      flowState.type = 'resolved_harmony';
      flowState.energy = Math.max(flowState.energy ?? 0, Math.max(baseEnergy, value * 0.7));
      flowState.direction = 1.0;
      this._queueCascadeLink(link);

      if ((flowState.intensity ?? 0) >= this.config.cascadeWaveThreshold) {
        this._emitCascadeHop(link, flowState);
      }
    }
  }

  _handleMetricPhaseChanged(event = {}) {
    if (!this.config.enabled) return;

    const detail = event?.detail && typeof event.detail === 'object' ? event.detail : event;
    const metric = this._normalizeMetricName(detail?.metric);
    const phase = this._normalizePhaseName(detail?.phase);
    const nodeId = detail?.nodeId ?? detail?.sourceNodeId ?? detail?.targetNodeId ?? null;
    if (!metric || !phase || !nodeId) return;
    if (this._shouldDedupPhaseSignal(metric, phase, nodeId)) return;

    if (metric === 'synergy' && phase === 'high') {
      this._handleNodeSynergyHigh(detail, true);
      return;
    }

    if (metric === 'corruption' && phase === 'high') {
      this._handleMetricCorruptionRise(detail, true);
    }
  }
  
  /**
   * Decay cascade intensity for all links
   */
  _decayUpdate(deltaTime) {
    if (!this.config.enabled) return;

    const dirtyLinks = this._dirtyLinks;
    const activeLinks = this._activeLinks;
    if (dirtyLinks.size === 0 && activeLinks.size === 0) {
      return;
    }

    const links = new Set([...dirtyLinks, ...activeLinks]);
    dirtyLinks.clear();

    const nextActiveLinks = new Set();
    const tickSeconds = Number.isFinite(deltaTime) && deltaTime > 0 ? deltaTime : 0.1;
    const baseTickSeconds = 0.1;
    const intensityBlend = 1 - Math.pow(1 - 0.15, tickSeconds / baseTickSeconds);
    const energyDecayFactor = Math.pow(Math.max(0, Math.min(1, this.config.decayRate + 0.05)), tickSeconds / baseTickSeconds);

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

      const targetIntensity = Math.max(0, Math.min(1, Number(link.userData.metrics?.synergy ?? 0) || 0));
      flowState.intensity += (targetIntensity - flowState.intensity) * intensityBlend;

      // Clamp to 0-1 range
      flowState.intensity = Math.max(0, Math.min(1, flowState.intensity));

      // Reset to 0 when below threshold
      if (flowState.intensity < this.config.minIntensityThreshold) {
        flowState.intensity = 0;
      }

      // Decay energy (slower decay for continuous field)
      if (flowState.energy > 0) {
        flowState.energy = flowState.energy * energyDecayFactor;

        if (flowState.energy < this.config.minIntensityThreshold) {
          flowState.energy = 0;
        }
      }

      // Canonical per-link writes for flowState-derived conflict metadata.
      const canonicalIntensity = Math.max(0, Math.min(1, flowState.intensity ?? 0));
      const canonicalEnergy = Math.max(0, Math.min(1, flowState.energy ?? 0));
      const canonicalType = flowState.type || 'resolved_harmony';
      const canonicalConflict = Math.max(canonicalIntensity, canonicalEnergy);

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

      const isActiveNow = (
        canonicalConflict > this.config.minIntensityThreshold ||
        isSynergyCollapse
      );

      // synergyCascadeTime = start time of collapse (set only on false -> true transition)
      const currentCascadeTime = (!wasSynergyCollapse && isSynergyCollapse)
        ? Date.now()
        : (link.userData.synergyCascadeTime ?? 0);

      if (wasActive && !isActiveNow) {
        this._emitCascadeEnd(link, flowState);
      }

      link.userData.cascadeConflictType = canonicalType;
      link.userData.cascadeIntensity = canonicalIntensity;
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

      if (canonicalIntensity > this.config.cascadeWaveThreshold) {
        this._emitCascadeHop(link, flowState);
      }

      if (isActiveNow) {
        nextActiveLinks.add(link);
      }
    }

    this._activeLinks = nextActiveLinks;
  }
  
  /**
   * Calculate target intensity from canonical link metrics
   */
  _calculateTargetIntensity(link) {
    return Math.max(0, Math.min(1, Number(link?.userData?.metrics?.synergy ?? 0) || 0));
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

  _getLinksForPair(sourceNodeId, targetNodeId) {
    if (!this.linkingSystem || !sourceNodeId || !targetNodeId) return [];

    const links = this.linkingSystem.links || [];
    const pairLinks = [];

    for (const link of links) {
      const sourceId = this.linkingSystem.getNodeId?.(link.source ?? link.sourceNode ?? link.from) ?? null;
      const targetId = this.linkingSystem.getNodeId?.(link.target ?? link.targetNode ?? link.to) ?? null;
      const directMatch = sourceId === sourceNodeId && targetId === targetNodeId;
      const reverseMatch = sourceId === targetNodeId && targetId === sourceNodeId;
      if (directMatch || reverseMatch) {
        pairLinks.push(link);
      }
    }

    return pairLinks;
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
      authorityOwner: this._registryOwner,
      eventFamily: 'cascade',
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
   * Emit cascade.hop semantic intent for downstream wave/VFX systems.
   */
  _emitCascadeHop(link, flowState) {
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

    // Validate flowState data before emitting hop intent
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
    this._dirtyLinks.clear();
    this._activeLinks.clear();
    this._recentPhaseSignals.clear();

    // Clear handlers
    this._boundHandlers = null;
    this._isInitialized = false;
  }

  /**
   * Rebind after world switch (updates linkingSystem, semanticBus)
   */
  rebind(config = {}) {
    // Update references if provided
    if (config.linkingSystem !== undefined) {
      this.linkingSystem = config.linkingSystem;
    }
    if (config.semanticBus !== undefined) {
      this.semanticBus = config.semanticBus;
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
      this._dirtyLinks.clear();
      this._activeLinks.clear();
      this._recentPhaseSignals.clear();

      // Re-setup and re-subscribe to events
      this._setupEventHandlers();
      this._subscribeToEvents();
      this._primeCascadeTrackingFromExistingLinks();
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
