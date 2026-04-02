/**
 * PHASE5_CASCADE_VISUALS.js
 * ============================================================================
 * CONSOLIDATED: Zlúčené z 3 súborov (2026-03-26):
 * - PHASE5_CascadeVisualizationBridge_v1.js
 * - PHASE5_CascadePropagationVisuals_v1.js
 * - PHASE5_InterNetworkVisualizationBridge_v1.js
 * 
 * Purpose: Komplexný vizuálny systém pre cascade efekty v multi-network prostredí
 * 
 * TRIEDY:
 * 1. PHASE5_CascadeVisualizationBridge - prepája corruption systémy s cascade vizuálmi
 * 2. PHASE5_CascadePropagationVisuals - vizualizuje cascade propagáciu cez expanding rings
 * 3. PHASE5_InterNetworkVisualizationBridge - prepája multi-network systémy s vizuálmi
 * 
 * ARCHITECTURE:
 * ✅ Pure visual consumers - čítajú stav, nemodifikujú core data
 * ✅ Zero per-frame allocations (pooling)
 * ✅ Graceful degradation pre chýbajúce dependencies
 * ✅ Console debugging API
 * ============================================================================
 */

import * as THREE from 'three';

// ============================================================================
// SECTION 1: CASCADE PROPAGATION VISUALS
// ============================================================================

/**
 * Visualizes cascade propagation through networks with expanding rings
 */
export class PHASE5_CascadePropagationVisuals {
  constructor(scene, config = {}) {
    this.scene = scene;
    
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Ring appearance
      ringRadius: config.ringRadius ?? 1.5,
      ringThickness: config.ringThickness ?? 0.15,
      ringSegments: config.ringSegments ?? 64,
      
      // Ring animation
      expandSpeed: config.expandSpeed ?? 8.0,
      fadeDuration: config.fadeDuration ?? 0.8,
      maxRingSize: config.maxRingSize ?? 15.0,
      
      // Cascade colors
      corruptionCascadeColor: config.corruptionCascadeColor ?? 0xff3333,
      harmonyCascadeColor: config.harmonyCascadeColor ?? 0x00ffff,
      threatCascadeColor: config.threatCascadeColor ?? 0xff6600,
      
      // Ring intensity
      baseOpacity: config.baseOpacity ?? 0.8,
      emissiveIntensity: config.emissiveIntensity ?? 0.6,
      
      // Performance settings
      maxActiveRings: config.maxActiveRings ?? 50,
      enableDepthFading: config.enableDepthFading ?? true,
      
      // Cascade depth multipliers
      depthDecayFactor: config.depthDecayFactor ?? 0.7,
      
      // Activation safety gate
      cascadeActivationThreshold: config.cascadeActivationThreshold ?? 0.3
    };
    
    // Visual objects
    this.ringGroup = new THREE.Group();
    this.ringGroup.name = 'CascadeRings';
    this.scene.add(this.ringGroup);
    
    // Active rings (pool for reuse)
    this.activeRings = [];
    this.ringPool = [];
    
    // Ring material cache
    this.ringMaterials = new Map();
    
    // Cascade event tracking
    this.cascadeEvents = [];
    this.cascadeHistory = [];
    
    // Performance monitoring
    this.stats = {
      ringsCreated: 0,
      ringsPooled: 0,
      maxRingsActiveFrame: 0,
      totalCascadesProcessed: 0,
      lastUpdateDuration: 0,
      materialsCreated: 0
    };
    
    // Update timing
    this.lastUpdateTime = Date.now();
    this.semanticBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
    this._boundCascadeHopHandler = null;
    
    // Console API
    this.setupConsoleAPI();
    this._subscribeSemanticCascadeEvents();
  }
  
  /**
   * Process a cascade event and create visual rings
   */
  triggerCascade(cascadeData) {
    try {
      if (!cascadeData) return;
      
      const {
        sourceNodeId,
        sourcePosition,
        cascadeType = 'corruption',
        cascadeStrength = 1.0,
        depth = 0,
        targetNodes = []
      } = cascadeData;

      const normalizedStrength = Number.isFinite(cascadeData?.cascadeStrength)
        ? cascadeData.cascadeStrength
        : Number.isFinite(cascadeData?.strength)
          ? cascadeData.strength
          : Number.isFinite(cascadeData?.level)
            ? cascadeData.level
            : cascadeStrength;

      if (normalizedStrength <= this.config.cascadeActivationThreshold) {
        return;
      }
      
      // Create initial ring at source
      if (sourcePosition) {
        this.createRing(
          sourcePosition,
          cascadeType,
          normalizedStrength,
          depth
        );
      }
      
      // Create rings along cascade path (staggered timing)
      if (targetNodes && targetNodes.length > 0) {
        targetNodes.forEach((node, index) => {
          if (node && node.position) {
            const delay = index * 0.05;
            const depthStrength = normalizedStrength * Math.pow(
              this.config.depthDecayFactor,
              index + 1
            );
            
            setTimeout(() => {
              this.createRing(
                node.position,
                cascadeType,
                depthStrength,
                depth + index + 1
              );
            }, delay * 1000);
          }
        });
      }
      
      // Track event
      this.cascadeEvents.push({
        timestamp: Date.now(),
        sourceNodeId: sourceNodeId,
        cascadeType: cascadeType,
        strength: normalizedStrength,
        depth: depth,
        nodeCount: targetNodes.length
      });
      
      // Keep history for debugging
      if (this.cascadeHistory.length > 100) {
        this.cascadeHistory.shift();
      }
      this.cascadeHistory.push(cascadeData);
      this.stats.totalCascadesProcessed++;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadePropagationVisuals] Cascade trigger error:', err);
      }
    }
  }
  
  /**
   * Create a single expanding ring at position
   */
  createRing(position, cascadeType = 'corruption', strength = 1.0, depth = 0) {
    try {
      // Limit active rings
      if (this.activeRings.length >= this.config.maxActiveRings) {
        const oldestRing = this.activeRings.shift();
        this.recycleRing(oldestRing);
      }
      
      // Get or create ring mesh from pool
      let ringMesh;
      if (this.ringPool.length > 0) {
        ringMesh = this.ringPool.pop();
        ringMesh.userData.active = true;
        this.stats.ringsPooled++;
      } else {
        ringMesh = this.createRingMesh();
        this.stats.ringsCreated++;
      }
      
      // Configure ring
      ringMesh.position.copy(position);
      ringMesh.userData = {
        active: true,
        cascadeType: cascadeType,
        strength: strength,
        depth: depth,
        elapsedTime: 0,
        startTime: Date.now(),
        material: this.getRingMaterial(cascadeType)
      };
      ringMesh.material = ringMesh.userData.material;
      
      // Update ring appearance
      this.updateRingAppearance(ringMesh);
      
      // Add to scene and active list
      this.ringGroup.add(ringMesh);
      this.activeRings.push(ringMesh);
      
      // Track max active
      if (this.activeRings.length > this.stats.maxRingsActiveFrame) {
        this.stats.maxRingsActiveFrame = this.activeRings.length;
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadePropagationVisuals] Ring creation error:', err);
      }
    }
  }
  
  /**
   * Create a ring mesh (geometry and material)
   */
  createRingMesh() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.config.ringSegments * 3);
    
    for (let i = 0; i < this.config.ringSegments; i++) {
      const angle = (i / this.config.ringSegments) * Math.PI * 2;
      const radius = this.config.ringRadius;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: this.config.baseOpacity,
      linewidth: this.config.ringThickness * 2,
      fog: false
    });
    
    const ring = new THREE.LineLoop(geometry, material);
    ring.name = 'CascadeRing';
    ring.userData = {};
    
    return ring;
  }
  
  /**
   * Get or create line material for cascade type
   */
  getRingMaterial(cascadeType) {
    const matKey = `cascade_${cascadeType}`;
    
    if (this.ringMaterials.has(matKey)) {
      return this.ringMaterials.get(matKey);
    }
    
    let color;
    switch (cascadeType) {
      case 'corruption':
        color = this.config.corruptionCascadeColor;
        break;
      case 'harmony':
        color = this.config.harmonyCascadeColor;
        break;
      case 'threat':
        color = this.config.threatCascadeColor;
        break;
      default:
        color = 0xffffff;
    }
    
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: this.config.baseOpacity,
      fog: false,
      emissive: color,
      emissiveIntensity: this.config.emissiveIntensity
    });
    
    this.ringMaterials.set(matKey, material);
    this.stats.materialsCreated++;
    
    return material;
  }
  
  /**
   * Update ring appearance based on state
   */
  updateRingAppearance(ringMesh) {
    try {
      if (!ringMesh || !ringMesh.userData) return;
      
      const { strength, depth } = ringMesh.userData;
      
      // Apply depth fading
      let opacityMultiplier = 1.0;
      if (this.config.enableDepthFading && depth > 0) {
        opacityMultiplier = Math.pow(this.config.depthDecayFactor, depth);
      }
      
      ringMesh.material.opacity = this.config.baseOpacity * strength * opacityMultiplier;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadePropagationVisuals] Ring appearance error:', err);
      }
    }
  }
  
  /**
   * Update all active rings (call from animation loop)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const updateStart = Date.now();
    
    try {
      const ringsToRemove = [];
      
      for (let i = 0; i < this.activeRings.length; i++) {
        const ring = this.activeRings[i];
        
        if (!ring.userData.active) {
          ringsToRemove.push(i);
          continue;
        }
        
        // Update elapsed time
        ring.userData.elapsedTime += deltaTime;
        
        // Expand ring
        const expansion = ring.userData.elapsedTime * this.config.expandSpeed;
        const scale = 1.0 + (expansion / this.config.ringRadius);
        ring.scale.setScalar(scale);
        
        // Fade based on expansion
        const fadeProgress = ring.userData.elapsedTime / this.config.fadeDuration;
        const fadeMultiplier = Math.max(0, 1.0 - fadeProgress);
        ring.material.opacity = this.config.baseOpacity * ring.userData.strength * fadeMultiplier;
        
        // Check if ring should be removed
        const currentRadius = this.config.ringRadius * scale;
        if (currentRadius > this.config.maxRingSize || fadeProgress >= 1.0) {
          ringsToRemove.push(i);
        }
      }
      
      // Remove expired rings (reverse order to maintain indices)
      for (let i = ringsToRemove.length - 1; i >= 0; i--) {
        const index = ringsToRemove[i];
        const ring = this.activeRings[index];
        this.recycleRing(ring);
        this.activeRings.splice(index, 1);
      }
      
      this.stats.lastUpdateDuration = Date.now() - updateStart;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadePropagationVisuals] Update error:', err);
      }
    }
  }
  
  /**
   * Recycle ring back to pool
   */
  recycleRing(ring) {
    try {
      if (!ring) return;
      
      ring.userData.active = false;
      this.ringGroup.remove(ring);
      
      // Return to pool if not full
      if (this.ringPool.length < this.config.maxActiveRings) {
        this.ringPool.push(ring);
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadePropagationVisuals] Recycle error:', err);
      }
    }
  }
  
  /**
   * Subscribe to semantic bus cascade events
   */
  _subscribeSemanticCascadeEvents() {
    if (!this.semanticBus || typeof this.semanticBus.on !== 'function') return;
    
    try {
      this._boundCascadeHopHandler = (event) => {
        if (!event) return;
        this.triggerCascade({
          sourceNodeId: event.sourceNodeId || event.source?.userData?.id,
          sourcePosition: event.sourcePosition || event.source?.position,
          cascadeType: event.cascadeType || 'corruption',
          cascadeStrength: event.intensity || event.strength || 1.0,
          depth: event.depth || 0,
          targetNodes: event.targetNodes || []
        });
      };
      
      this.semanticBus.on('cascade.hop', this._boundCascadeHopHandler);
      this.semanticBus.on('cascade.start', this._boundCascadeHopHandler);
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadePropagationVisuals] Semantic subscription error:', err);
      }
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeRings: this.activeRings.length,
      pooledRings: this.ringPool.length,
      recentCascades: this.cascadeEvents.slice(-10)
    };
  }
  
  /**
   * Clear all rings
   */
  clear() {
    for (const ring of this.activeRings) {
      this.recycleRing(ring);
    }
    this.activeRings = [];
    this.cascadeEvents = [];
  }
  
  /**
   * Setup console API
   */
  setupConsoleAPI() {
    if (typeof window !== 'undefined') {
      window.PHASE5_CascadePropagationVisuals_API = {
        getStats: () => this.getStats(),
        toggleDebug: () => { this.config.enableDebug = !this.config.enableDebug; },
        clear: () => this.clear(),
        triggerTest: (type = 'corruption', x = 0, y = 0, z = 0) => {
          this.triggerCascade({
            sourcePosition: new THREE.Vector3(x, y, z),
            cascadeType: type,
            cascadeStrength: 1.0,
            depth: 0,
            targetNodes: []
          });
        }
      };
    }
  }
  
  /**
   * Dispose
   */
  dispose() {
    this.clear();
    this.ringPool = [];
    this.ringMaterials.clear();
    
    if (this.semanticBus && this._boundCascadeHopHandler) {
      try {
        this.semanticBus.off('cascade.hop', this._boundCascadeHopHandler);
        this.semanticBus.off('cascade.start', this._boundCascadeHopHandler);
      } catch (_) {}
    }
    
    if (typeof window !== 'undefined') {
      delete window.PHASE5_CascadePropagationVisuals_API;
    }
  }
}

// ============================================================================
// SECTION 2: CASCADE VISUALIZATION BRIDGE
// ============================================================================

/**
 * Orchestrates connection between corruption systems and cascade visuals
 */
export class PHASE5_CascadeVisualizationBridge {
  constructor(
    aiNodes,
    linkCorruptionTransmission,
    cascadePropagationVisuals,
    config = {}
  ) {
    this.aiNodes = aiNodes;
    this.linkCorruptionTransmission = linkCorruptionTransmission;
    this.cascadePropagationVisuals = cascadePropagationVisuals;
    this.semanticBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
    
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Cascade detection thresholds
      corruptionCascadeThreshold: config.corruptionCascadeThreshold ?? 0.7,
      threatCascadeThreshold: config.threatCascadeThreshold ?? 0.5,
      harmonyCascadeThreshold: config.harmonyCascadeThreshold ?? 0.8,
      
      // Event tracking
      maxEventHistory: config.maxEventHistory ?? 100,
      enableEventTracking: config.enableEventTracking ?? true
    };
    
    // State tracking
    this.lastProcessedCascadeIndex = 0;
    this.lastProcessedThreatIndex = 0;
    this.cascadeEventQueue = [];
    this.processedCascadeIds = new Set();
    
    // Performance monitoring
    this.stats = {
      cascadesDetected: 0,
      cascadesVisualized: 0,
      corruptionCascades: 0,
      harmonyCascades: 0,
      threatCascades: 0,
      lastBridgeUpdateDuration: 0,
      eventQueueSize: 0
    };
    
    // Cascade history for debugging
    this.cascadeHistory = [];
    this._semanticUnsubscribers = [];
    this._eventRefreshRequested = false;
    
    // Subscribe to systems
    this.subscribeToEvents();
    
    // Console API
    this.setupConsoleAPI();
  }
  
  /**
   * Subscribe to cascade events from corruption systems
   */
  subscribeToEvents() {
    try {
      if (this.linkCorruptionTransmission) {
        if (this.config.enableLogging) {
          console.log('[PHASE5_CascadeVisualizationBridge] Subscribed to LinkCorruptionTransmission');
        }
      }

      if (this.semanticBus && typeof this.semanticBus.subscribe === 'function') {
        const requestRefresh = () => {
          this._eventRefreshRequested = true;
        };

        const unsubMetric = this.semanticBus.subscribe('node.metric.updated', requestRefresh);
        const unsubLink = this.semanticBus.subscribe('link.created', requestRefresh);
        const unsubSpawn = this.semanticBus.subscribe('node.spawned', requestRefresh);
        const unsubCorruptionCascade = this.semanticBus.subscribe('event:corruptionCascade', (payload) => {
          this._eventRefreshRequested = true;
          const cascadeEvent = this._normalizeSemanticCascadeEvent(payload, 'corruption');
          if (cascadeEvent) this.queueCascadeEvent(cascadeEvent);
        });
        const unsubLinkCollapse = this.semanticBus.subscribe('event:linkCollapse', (payload) => {
          this._eventRefreshRequested = true;
          const cascadeEvent = this._normalizeSemanticCascadeEvent(payload, 'threat');
          if (cascadeEvent) this.queueCascadeEvent(cascadeEvent);
        });
        const unsubCorruptionSpread = this.semanticBus.subscribe('event:networkCorruptionSpread', (payload) => {
          this._eventRefreshRequested = true;
          const cascadeEvent = this._normalizeSemanticCascadeEvent(payload, 'corruption');
          if (cascadeEvent) this.queueCascadeEvent(cascadeEvent);
        });

        if (typeof unsubMetric === 'function') this._semanticUnsubscribers.push(unsubMetric);
        if (typeof unsubLink === 'function') this._semanticUnsubscribers.push(unsubLink);
        if (typeof unsubSpawn === 'function') this._semanticUnsubscribers.push(unsubSpawn);
        if (typeof unsubCorruptionCascade === 'function') this._semanticUnsubscribers.push(unsubCorruptionCascade);
        if (typeof unsubLinkCollapse === 'function') this._semanticUnsubscribers.push(unsubLinkCollapse);
        if (typeof unsubCorruptionSpread === 'function') this._semanticUnsubscribers.push(unsubCorruptionSpread);
      }
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Subscription error:', err);
      }
    }
  }
  
  /**
   * Update cascade detection and visualization
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const updateStart = Date.now();
    
    try {
      this.checkCascadeEvents();
      if (this._eventRefreshRequested) {
        this.checkCascadeEvents();
        this._eventRefreshRequested = false;
      }
      
      this.processQueuedCascades();
      
      if (this.cascadeHistory.length > this.config.maxEventHistory) {
        this.cascadeHistory.shift();
      }
      
      this.stats.lastBridgeUpdateDuration = Date.now() - updateStart;
      this.stats.eventQueueSize = this.cascadeEventQueue.length;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Update error:', err);
      }
    }
  }
  
  /**
   * Check LinkCorruptionTransmission for cascade events
   */
  checkCascadeEvents() {
    try {
      if (!this.linkCorruptionTransmission) return;
      
      let cascadeHistory = [];
      if (typeof this.linkCorruptionTransmission.getCascadeHistory === 'function') {
        cascadeHistory = this.linkCorruptionTransmission.getCascadeHistory() || [];
      }
      
      for (let i = this.lastProcessedCascadeIndex; i < cascadeHistory.length; i++) {
        const cascade = cascadeHistory[i];
        this.queueCascadeEvent(cascade);
      }
      
      this.lastProcessedCascadeIndex = cascadeHistory.length;
      
      let threatHistory = [];
      if (typeof this.linkCorruptionTransmission.getThreatCascadeHistory === 'function') {
        threatHistory = this.linkCorruptionTransmission.getThreatCascadeHistory() || [];
      }
      
      for (let i = this.lastProcessedThreatIndex; i < threatHistory.length; i++) {
        const threat = threatHistory[i];
        this.queueCascadeEvent(threat);
      }
      this.lastProcessedThreatIndex = threatHistory.length;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Cascade check error:', err);
      }
    }
  }
  
  /**
   * Queue a cascade event for processing
   */
  queueCascadeEvent(cascadeData) {
    try {
      if (!cascadeData) return;
      const normalized = this._normalizeCascadeEvent(cascadeData);
      if (!normalized) return;
      
      const cascadeId = this._buildCascadeId(normalized);
      
      if (this.processedCascadeIds.has(cascadeId)) {
        return;
      }
      
      this.processedCascadeIds.add(cascadeId);
      
      this.cascadeEventQueue.push({
        cascadeId: cascadeId,
        data: normalized,
        queuedAt: Date.now(),
        visualized: false
      });
      
      this.stats.cascadesDetected++;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Queue error:', err);
      }
    }
  }
  
  /**
   * Process queued cascade events into visuals
   */
  processQueuedCascades() {
    try {
      while (this.cascadeEventQueue.length > 0) {
        const event = this.cascadeEventQueue.shift();
        this.visualizeCascade(event.data);
        event.visualized = true;
        this.stats.cascadesVisualized++;
      }
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Process queue error:', err);
      }
    }
  }
  
  /**
   * Convert cascade data into visual effects
   */
  visualizeCascade(cascadeData) {
    try {
      if (!cascadeData || !this.cascadePropagationVisuals) return;
      
      const sourceNode = cascadeData.sourceNode;
      const affectedNodes = cascadeData.affectedNodes || [];
      const strength = cascadeData.strength || 1.0;
      const depth = cascadeData.depth || 0;
      
      let cascadeType = 'corruption';
      if (cascadeData.cascadeType) {
        cascadeType = cascadeData.cascadeType;
      } else if (cascadeData.isHealingCascade) {
        cascadeType = 'harmony';
      } else if (cascadeData.isThreatCascade) {
        cascadeType = 'threat';
      }
      
      let sourcePosition = null;
      if (sourceNode && sourceNode.position) {
        sourcePosition = sourceNode.position;
      }
      
      if (!sourcePosition) {
        return;
      }
      
      switch (cascadeType) {
        case 'corruption':
          this.stats.corruptionCascades++;
          break;
        case 'harmony':
          this.stats.harmonyCascades++;
          break;
        case 'threat':
          this.stats.threatCascades++;
          break;
      }
      
      this.cascadePropagationVisuals.triggerCascade({
        sourceNodeId: sourceNode?.id || 'unknown',
        sourcePosition: sourcePosition,
        cascadeType: cascadeType,
        cascadeStrength: strength,
        depth: depth,
        targetNodes: affectedNodes
      });
      
      if (this.config.enableEventTracking) {
        this.cascadeHistory.push({
          timestamp: Date.now(),
          cascadeType: cascadeType,
          sourceNode: sourceNode?.id,
          affectedCount: affectedNodes.length,
          strength: strength,
          depth: depth
        });
      }
      
      if (this.config.enableLogging) {
        console.log(
          `[PHASE5_CascadeVisualizationBridge] Visualized ${cascadeType} cascade ` +
          `(strength: ${strength.toFixed(2)}, depth: ${depth}, affected: ${affectedNodes.length})`
        );
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Visualization error:', err);
      }
    }
  }
  
  /**
   * Normalize cascade event from various sources
   */
  _normalizeCascadeEvent(cascadeData) {
    if (!cascadeData) return null;
    
    return {
      sourceNode: cascadeData.sourceNode || cascadeData.source || null,
      affectedNodes: cascadeData.affectedNodes || cascadeData.targets || [],
      strength: cascadeData.strength || cascadeData.intensity || cascadeData.level || 1.0,
      depth: cascadeData.depth || 0,
      cascadeType: cascadeData.cascadeType || cascadeData.type || 'corruption',
      timestamp: cascadeData.timestamp || Date.now()
    };
  }
  
  /**
   * Normalize semantic bus cascade event
   */
  _normalizeSemanticCascadeEvent(payload, defaultType) {
    if (!payload) return null;
    
    return {
      sourceNode: payload.node || payload.sourceNode || null,
      affectedNodes: payload.affectedNodes || [],
      strength: payload.value || payload.intensity || payload.strength || 1.0,
      depth: payload.depth || 0,
      cascadeType: payload.cascadeType || defaultType,
      timestamp: payload.timestamp || Date.now()
    };
  }
  
  /**
   * Build unique cascade ID
   */
  _buildCascadeId(cascadeData) {
    const sourceId = cascadeData.sourceNode?.id || 'unknown';
    const timestamp = cascadeData.timestamp || Date.now();
    const type = cascadeData.cascadeType || 'unknown';
    return `${sourceId}_${type}_${timestamp}`;
  }
  
  /**
   * Manually trigger cascade visualization
   */
  manuallyTriggerCascade(sourceNode, cascadeType = 'corruption', strength = 1.0) {
    try {
      if (!sourceNode || !sourceNode.position) return;
      
      const affectedNodes = this.findNearbyNodes(sourceNode, 3);
      
      this.visualizeCascade({
        sourceNode: sourceNode,
        affectedNodes: affectedNodes,
        cascadeType: cascadeType,
        strength: strength,
        depth: 0,
        timestamp: Date.now()
      });
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Manual trigger error:', err);
      }
    }
  }
  
  /**
   * Find nearby nodes
   */
  findNearbyNodes(sourceNode, maxDepth = 2) {
    const nearby = [];
    const visited = new Set();
    const queue = [{ node: sourceNode, depth: 0 }];
    
    try {
      while (queue.length > 0) {
        const { node, depth } = queue.shift();
        
        if (depth > maxDepth || visited.has(node.id)) {
          continue;
        }
        
        visited.add(node.id);
        if (depth > 0) {
          nearby.push(node);
        }
        
        if (this.aiNodes && this.aiNodes.nodes) {
          for (const otherNode of this.aiNodes.nodes) {
            if (otherNode && otherNode.id !== node.id && !visited.has(otherNode.id)) {
              const dist = node.position.distanceTo(otherNode.position);
              if (dist < 30) {
                queue.push({ node: otherNode, depth: depth + 1 });
              }
            }
          }
        }
      }
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Nearby nodes error:', err);
      }
    }
    
    return nearby;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      eventQueueSize: this.cascadeEventQueue.length,
      processedCascadeCount: this.processedCascadeIds.size,
      historySize: this.cascadeHistory.length,
      recentCascades: this.cascadeHistory.slice(-10)
    };
  }
  
  /**
   * Clear state
   */
  clear() {
    try {
      this.cascadeEventQueue = [];
      this.processedCascadeIds.clear();
      this.cascadeHistory = [];
      this.lastProcessedCascadeIndex = 0;
      this.lastProcessedThreatIndex = 0;
      this._eventRefreshRequested = false;
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Clear error:', err);
      }
    }
  }
  
  /**
   * Setup console API
   */
  setupConsoleAPI() {
    if (typeof window !== 'undefined') {
      window.PHASE5_CascadeVisualizationBridge_API = {
        getStats: () => this.getStats(),
        toggleDebug: () => { this.config.enableDebug = !this.config.enableDebug; },
        manualTrigger: (cascadeType = 'corruption', strength = 1.0) => {
          if (this.aiNodes && this.aiNodes.nodes && this.aiNodes.nodes.length > 0) {
            const node = this.aiNodes.nodes[0];
            this.manuallyTriggerCascade(node, cascadeType, strength);
          }
        },
        clear: () => this.clear(),
        getRecentCascades: () => this.cascadeHistory.slice(-20)
      };
    }
  }
  
  /**
   * Dispose
   */
  dispose() {
    for (const unsub of this._semanticUnsubscribers) {
      try { unsub(); } catch (_) {}
    }
    this._semanticUnsubscribers = [];
    this.clear();
    
    if (typeof window !== 'undefined') {
      delete window.PHASE5_CascadeVisualizationBridge_API;
    }
  }
}

// ============================================================================
// SECTION 3: INTER-NETWORK VISUALIZATION BRIDGE
// ============================================================================

/**
 * Orchestrates connection between PHASE5 multi-network systems and visual display
 */
export class PHASE5_InterNetworkVisualizationBridge {
  constructor(
    multiNetworkManager,
    corruptionBridge,
    connectionVisuals,
    config = {}
  ) {
    this.multiNetworkManager = multiNetworkManager;
    this.corruptionBridge = corruptionBridge;
    this.connectionVisuals = connectionVisuals || null;

    if (!connectionVisuals) {
      console.warn('[PHASE5_InterNetworkVisualizationBridge] connectionVisuals not provided — bridge will operate in data-only mode.');
    }
    
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Update timing
      syncInterval: config.syncInterval ?? 32,
      prioritizeCorruptionFlow: config.prioritizeCorruptionFlow ?? true,
      
      // Visual update limits
      maxVisualUpdatesPerFrame: config.maxVisualUpdatesPerFrame ?? 10
    };
    
    // State tracking
    this.networkPositions = new Map();
    this.lastSyncTime = Date.now();
    this.syncDueTime = Date.now();
    
    // Event subscribers
    this.eventSubscriptions = [];
    
    // Performance monitoring
    this.stats = {
      totalSyncs: 0,
      totalUpdates: 0,
      lastSyncDuration: 0,
      networksSynced: 0,
      connectionsSynced: 0
    };
    
    this.setupEventListeners();
    this.setupConsoleAPI();
  }
  
  /**
   * Setup event listeners from multi-network manager
   */
  setupEventListeners() {
    try {
      if (this.multiNetworkManager && this.multiNetworkManager.onNetworkRegistered) {
        const unsub = this.multiNetworkManager.onNetworkRegistered((networkId, network, metadata) => {
          this.handleNetworkRegistered(networkId, network, metadata);
        });
        if (typeof unsub === 'function') this.eventSubscriptions.push(unsub);
      }
      
      if (this.multiNetworkManager && this.multiNetworkManager.onConnectionCreated) {
        const unsub = this.multiNetworkManager.onConnectionCreated((connection) => {
          this.handleConnectionCreated(connection);
        });
        if (typeof unsub === 'function') this.eventSubscriptions.push(unsub);
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Event setup error:', err);
      }
    }
  }
  
  /**
   * Handle network registration event
   */
  handleNetworkRegistered(networkId, network, metadata) {
    try {
      if (metadata && metadata.position) {
        this.networkPositions.set(networkId, metadata.position.clone());
      } else if (network && network.aiNodes && network.aiNodes.length > 0) {
        const pos = this.calculateNetworkCenterPosition(network);
        this.networkPositions.set(networkId, pos);
      }
      
      if (this.config.enableLogging) {
        console.log(`[PHASE5_InterNetworkVisualizationBridge] Network registered: ${networkId}`);
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Network registration error:', err);
      }
    }
  }
  
  /**
   * Handle connection creation event
   */
  handleConnectionCreated(connection) {
    try {
      if (this.config.enableLogging) {
        console.log(
          `[PHASE5_InterNetworkVisualizationBridge] Connection created: ` +
          `${connection.sourceNetworkId} → ${connection.targetNetworkId}`
        );
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Connection creation error:', err);
      }
    }
  }
  
  /**
   * Update visuals based on current multi-network state
   */
  update(deltaTime) {
    const syncStart = Date.now();
    
    try {
      const now = Date.now();
      
      if (now - this.lastSyncTime < this.config.syncInterval) {
        return;
      }
      
      this.lastSyncTime = now;
      
      const networks = this.gatherNetworkData();
      const connections = this.gatherConnectionData();
      
      if (this.connectionVisuals && this.connectionVisuals.sync) {
        this.connectionVisuals.sync(networks, connections);
      }
      
      if (this.connectionVisuals && this.connectionVisuals.update) {
        this.connectionVisuals.update(deltaTime);
      }
      
      this.stats.totalSyncs++;
      this.stats.lastSyncDuration = Date.now() - syncStart;
      this.stats.networksSynced = networks.size;
      this.stats.connectionsSynced = connections.length;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Update error:', err);
      }
    }
  }
  
  /**
   * Gather network data for visualization
   */
  gatherNetworkData() {
    const networkData = new Map();
    
    try {
      if (!this.multiNetworkManager || !this.multiNetworkManager.networks) {
        return networkData;
      }
      
      for (const [networkId, network] of this.multiNetworkManager.networks) {
        try {
          let position = this.networkPositions.get(networkId);
          if (!position && network && network.aiNodes) {
            position = this.calculateNetworkCenterPosition(network);
            this.networkPositions.set(networkId, position);
          }
          
          const metadata = this.multiNetworkManager.networkMetadata?.get(networkId) || {};
          
          networkData.set(networkId, {
            network: network,
            position: position || new THREE.Vector3(),
            metadata: metadata,
            name: metadata.name || `Network_${networkId}`
          });
          
        } catch (err) {
          if (this.config.enableDebug) {
            console.warn(
              `[PHASE5_InterNetworkVisualizationBridge] Error gathering data for network ${networkId}:`,
              err
            );
          }
        }
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Network data gathering error:', err);
      }
    }
    
    return networkData;
  }
  
  /**
   * Gather connection data for visualization
   */
  gatherConnectionData() {
    const connections = [];
    
    try {
      if (!this.multiNetworkManager || !this.multiNetworkManager.networkConnections) {
        return connections;
      }
      
      for (const connection of this.multiNetworkManager.networkConnections) {
        try {
          const sourceNetwork = this.multiNetworkManager.getNetwork(connection.sourceNetworkId);
          const targetNetwork = this.multiNetworkManager.getNetwork(connection.targetNetworkId);
          
          if (!sourceNetwork || !targetNetwork) {
            continue;
          }
          
          const transferState = this.getConnectionTransferState(connection);
          
          connections.push({
            sourceNetworkId: connection.sourceNetworkId,
            targetNetworkId: connection.targetNetworkId,
            strength: connection.strength || 0.5,
            distance: connection.distance || 0,
            createdAt: connection.createdAt || Date.now(),
            transferState: transferState,
            isActive: this.isConnectionActive(connection)
          });
          
        } catch (err) {
          if (this.config.enableDebug) {
            console.warn(
              `[PHASE5_InterNetworkVisualizationBridge] Error processing connection:`,
              err
            );
          }
        }
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Connection data gathering error:', err);
      }
    }
    
    return connections;
  }
  
  /**
   * Get transfer state for a connection from corruption bridge
   */
  getConnectionTransferState(connection) {
    try {
      if (!this.corruptionBridge) {
        return null;
      }
      
      const connectionId = `${connection.sourceNetworkId}_${connection.targetNetworkId}`;
      const activeTransfer = this.corruptionBridge.activeTransfers?.get(connectionId);
      
      if (activeTransfer) {
        return {
          isTransferring: true,
          corruptionTransferred: activeTransfer.corruptionTransferred || 0,
          harmonyTransferred: activeTransfer.harmonyTransferred || 0,
          progress: activeTransfer.progress || 0
        };
      }
      
      return {
        isTransferring: false,
        corruptionTransferred: 0,
        harmonyTransferred: 0,
        progress: 0
      };
      
    } catch (err) {
      return null;
    }
  }
  
  /**
   * Check if a connection should be visually active
   */
  isConnectionActive(connection) {
    try {
      return (connection.strength ?? 0.5) >= 0.2;
    } catch (err) {
      return false;
    }
  }
  
  /**
   * Calculate network center position from its nodes
   */
  calculateNetworkCenterPosition(network) {
    const centerPos = new THREE.Vector3();
    
    try {
      if (!network || !network.aiNodes || network.aiNodes.length === 0) {
        return centerPos;
      }
      
      let validCount = 0;
      
      for (const node of network.aiNodes) {
        if (node && node.position) {
          centerPos.add(node.position);
          validCount++;
        }
      }
      
      if (validCount > 0) {
        centerPos.divideScalar(validCount);
      }
      
      return centerPos;
      
    } catch (err) {
      return centerPos;
    }
  }
  
  /**
   * Set network position manually
   */
  setNetworkPosition(networkId, position) {
    try {
      this.networkPositions.set(networkId, position.clone());
      
      if (this.config.enableLogging) {
        console.log(
          `[PHASE5_InterNetworkVisualizationBridge] Network position set: ${networkId} → `,
          position
        );
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_InterNetworkVisualizationBridge] Position setting error:', err);
      }
    }
  }
  
  /**
   * Get performance stats
   */
  getStats() {
    return {
      ...this.stats,
      lastSyncDuration: `${this.stats.lastSyncDuration.toFixed(2)}ms`,
      averageSyncDuration: this.stats.totalSyncs > 0 
        ? `${(this.stats.lastSyncDuration / this.stats.totalSyncs).toFixed(2)}ms`
        : 'N/A'
    };
  }
  
  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    if (typeof window !== 'undefined') {
      window.PHASE5_InterNetworkVisualizationBridge_API = {
        getStats: () => this.getStats(),
        toggleDebug: () => { this.config.enableDebug = !this.config.enableDebug; },
        setNetworkPosition: (networkId, x, y, z) => {
          this.setNetworkPosition(networkId, new THREE.Vector3(x, y, z));
        }
      };
    }
  }

  /**
   * Dispose
   */
  dispose() {
    for (const unsub of this.eventSubscriptions) {
      try { unsub(); } catch (_) {}
    }
    this.eventSubscriptions = [];
    this.networkPositions.clear();

    if (typeof window !== 'undefined') {
      delete window.PHASE5_InterNetworkVisualizationBridge_API;
    }

    this.multiNetworkManager = null;
    this.corruptionBridge = null;
    this.connectionVisuals = null;
  }
}

export default {
  PHASE5_CascadePropagationVisuals,
  PHASE5_CascadeVisualizationBridge,
  PHASE5_InterNetworkVisualizationBridge
};
