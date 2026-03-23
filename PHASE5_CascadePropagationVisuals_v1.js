/**
 * PHASE 5: CASCADE PROPAGATION VISUAL EFFECTS v1.0
 * 
 * Visualizes cascade propagation through networks with expanding rings
 * 
 * Purpose: Show cascade events as expanding waves propagating through network
 * - Expanding ring at cascade origin (node)
 * - Ring propagation through connected nodes (BFS-style)
 * - Color indicates corruption/harmony type
 * - Intensity fades with cascade depth
 * - Performance-optimized ring pooling
 * 
 * This is a pure visual consumer — reads cascade events, renders effects only
 */

import * as THREE from 'three';

export class PHASE5_CascadePropagationVisuals {
  constructor(scene, config = {}) {
    this.scene = scene;
    
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Ring appearance
      ringRadius: config.ringRadius ?? 1.5,           // Initial radius
      ringThickness: config.ringThickness ?? 0.15,    // Ring line width
      ringSegments: config.ringSegments ?? 64,        // Segments per ring
      
      // Ring animation
      expandSpeed: config.expandSpeed ?? 8.0,         // Units per second
      fadeDuration: config.fadeDuration ?? 0.8,       // Seconds to fade out
      maxRingSize: config.maxRingSize ?? 15.0,        // Max expanded radius
      
      // Cascade colors
      corruptionCascadeColor: config.corruptionCascadeColor ?? 0xff3333,    // Red
      harmonyCascadeColor: config.harmonyCascadeColor ?? 0x00ffff,         // Cyan
      threatCascadeColor: config.threatCascadeColor ?? 0xff6600,           // Orange
      
      // Ring intensity
      baseOpacity: config.baseOpacity ?? 0.8,
      emissiveIntensity: config.emissiveIntensity ?? 0.6,
      
      // Performance settings
      maxActiveRings: config.maxActiveRings ?? 50,
      enableDepthFading: config.enableDepthFading ?? true,
      
      // Cascade depth multipliers
      depthDecayFactor: config.depthDecayFactor ?? 0.7,  // Intensity × depth decay

      // Activation safety gate
      cascadeActivationThreshold: config.cascadeActivationThreshold ?? 0.3
    };
    
    // Visual objects
    this.ringGroup = new THREE.Group();
    this.ringGroup.name = 'CascadeRings';
    this.scene.add(this.ringGroup);
    
    // Active rings (pool for reuse)
    this.activeRings = [];              // Currently visible rings
    this.ringPool = [];                 // Reusable ring meshes
    
    // Ring material cache
    this.ringMaterials = new Map();     // color → LineBasicMaterial
    
    // Cascade event tracking
    this.cascadeEvents = [];            // Recent cascade events
    this.cascadeHistory = [];           // Historical events for debugging
    
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
        cascadeType = 'corruption',    // 'corruption' | 'harmony' | 'threat'
        cascadeStrength = 1.0,         // 0-1 intensity
        depth = 0,                     // Cascade depth (for decay)
        targetNodes = []               // Nodes in cascade path
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
            // Stagger ring creation by cascade depth
            const delay = index * 0.05; // 50ms between rings
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
      // Get or create ring mesh from pool
      let ringMesh;
      if (this.ringPool.length > 0) {
        ringMesh = this.ringPool.pop();
        ringMesh.userData.active = true;
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
    // Ring geometry (line loop)
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.config.ringSegments * 3);
    
    for (let i = 0; i < this.config.ringSegments; i++) {
      const angle = (i / this.config.ringSegments) * Math.PI * 2;
      const radius = this.config.ringRadius;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0;  // Flat on XZ plane
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Material (will be set per ring)
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: this.config.baseOpacity,
      linewidth: this.config.ringThickness * 2,  // Note: linewidth not supported on most systems
      fog: false
    });
    
    // Create line loop
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
    
    // Determine color
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
    
    // Create material
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
   * Update ring appearance (expansion + fade)
   */
  updateRingAppearance(ringMesh) {
    const userData = ringMesh.userData;
    if (!userData || !userData.active) return;
    
    // Calculate elapsed time
    const now = Date.now();
    userData.elapsedTime = (now - userData.startTime) / 1000;
    
    // Calculate expansion
    const expandedRadius = this.config.ringRadius + 
      (userData.elapsedTime * this.config.expandSpeed);
    
    // Stop if max size reached
    if (expandedRadius > this.config.maxRingSize) {
      this.returnRingToPool(ringMesh);
      return;
    }
    
    // Update scale (TubeGeometry approach: scale the entire ring)
    const scale = expandedRadius / this.config.ringRadius;
    ringMesh.scale.x = scale;
    ringMesh.scale.z = scale;
    
    // Calculate fade
    const fadeProgress = userData.elapsedTime / this.config.fadeDuration;
    const baseFade = Math.max(0, 1 - fadeProgress);
    
    // Apply depth decay
    const depthMultiplier = Math.pow(
      this.config.depthDecayFactor,
      userData.depth
    );
    
    const finalOpacity = baseFade * depthMultiplier * this.config.baseOpacity;
    
    // Update material
    if (userData.material) {
      userData.material.opacity = finalOpacity;
    }
    
    // Return to pool if fully faded
    if (finalOpacity < 0.01) {
      this.returnRingToPool(ringMesh);
    }
  }
  
  /**
   * Return ring to pool for reuse
   */
  returnRingToPool(ringMesh) {
    try {
      if (!ringMesh) return;
      
      ringMesh.userData.active = false;
      this.ringGroup.remove(ringMesh);
      
      // Find and remove from active list
      const index = this.activeRings.indexOf(ringMesh);
      if (index > -1) {
        this.activeRings.splice(index, 1);
      }
      
      // Add to pool if not at max
      if (this.ringPool.length < this.config.maxActiveRings) {
        this.ringPool.push(ringMesh);
        this.stats.ringsPooled++;
      } else {
        // Dispose if pool is full
        ringMesh.geometry.dispose();
        this.ringGroup.remove(ringMesh);
      }
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadePropagationVisuals] Pool return error:', err);
      }
    }
  }
  
  /**
   * Update all active rings (called from animation loop)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const updateStart = Date.now();
    
    try {
      // Process cascade events (move to active rings)
      // This would be called externally with cascade data
      
      // Update all active rings
      const ringsToRemove = [];
      
      for (const ring of this.activeRings) {
        if (ring.userData && ring.userData.active) {
          this.updateRingAppearance(ring);
        }
      }
      
      this.stats.lastUpdateDuration = Date.now() - updateStart;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadePropagationVisuals] Update error:', err);
      }
    }
  }

  _subscribeSemanticCascadeEvents() {
    const on = this.semanticBus?.on?.bind(this.semanticBus);
    if (typeof on !== 'function') return;

    this._boundCascadeHopHandler = (event = {}) => {
      if (!event || !event.link) return;
      this.spawnCascadePropagationVisual(
        event.link,
        event.intensity ?? 1.0,
        event.hopIndex ?? 0
      );
    };
    on('cascade.hop', this._boundCascadeHopHandler);
  }

  spawnCascadePropagationVisual(link, intensity = 1.0, hopIndex = 0) {
    const sourceNode =
      link?.source ??
      link?.sourceNode ??
      link?.from ??
      link?.userData?.source ??
      link?.sourceNode ??
      null;
    const targetNode =
      link?.target ??
      link?.targetNode ??
      link?.to ??
      link?.userData?.target ??
      link?.targetNode ??
      null;
    const sourcePosition = sourceNode?.position ?? null;
    const targetPosition = targetNode?.position ?? null;

    if (!sourcePosition && !targetPosition) return;

    const hop = Math.max(0, Number(hopIndex) || 0);
    const strength = Math.max(0, Math.min(1, (Number(intensity) || 0) * Math.pow(this.config.depthDecayFactor, hop)));
    if (strength <= this.config.cascadeActivationThreshold) return;

    if (sourcePosition) {
      this.createRing(sourcePosition, 'harmony', strength, hop);
    }
    if (targetPosition) {
      this.createRing(targetPosition, 'harmony', strength, hop + 1);
    }
  }
  
  /**
   * Wire cascade events from LinkCorruptionTransmission
   */
  subscribeToCascadeEvents(linkCorruptionTransmission) {
    // Legacy polling path disabled; cascade visuals are semanticBus-driven via cascade.hop.
    this.linkCorruptionTransmission = null;
    this.cascadeEventHandler = null;
  }
  
  /**
   * Check for new cascade events from corruption system
   */
  checkCascadeEvents() {
    // Legacy frame-driven polling disabled.
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeRings: this.activeRings.length,
      pooledRings: this.ringPool.length,
      recentCascades: this.cascadeEvents.slice(-10),
      historySize: this.cascadeHistory.length
    };
  }
  
  /**
   * Clear all rings and reset
   */
  clear() {
    try {
      // Clear active rings
      for (const ring of this.activeRings) {
        this.ringGroup.remove(ring);
      }
      this.activeRings = [];
      
      // Clear pool
      for (const ring of this.ringPool) {
        if (ring.geometry) ring.geometry.dispose();
        if (ring.material) ring.material.dispose();
      }
      this.ringPool = [];
      
      // Dispose materials
      for (const [, material] of this.ringMaterials) {
        material.dispose();
      }
      this.ringMaterials.clear();
      
      this.cascadeEvents = [];
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadePropagationVisuals] Clear error:', err);
      }
    }
  }

  dispose() {
    // Unsubscribe semantic listeners to prevent duplicate handlers after world switch.
    const off = this.semanticBus?.off?.bind(this.semanticBus) || this.semanticBus?.unsubscribe?.bind(this.semanticBus);
    if (off && this._boundCascadeHopHandler) {
      try {
        off('cascade.hop', this._boundCascadeHopHandler);
      } catch (_) {
        // noop
      }
    }
    this._boundCascadeHopHandler = null;

    this.clear();
    this.scene?.remove?.(this.ringGroup);
  }
  
  /**
   * Setup console API for debugging
   */
  setupConsoleAPI() {
    if (typeof window !== 'undefined') {
      window.PHASE5_CascadePropagationVisuals_API = {
        getStats: () => this.getStats(),
        triggerCascade: (position, type = 'corruption', strength = 1.0) => {
          this.triggerCascade({
            sourcePosition: position,
            cascadeType: type,
            cascadeStrength: strength,
            depth: 0,
            targetNodes: []
          });
        },
        toggleDebug: () => { this.config.enableDebug = !this.config.enableDebug; },
        clear: () => this.clear(),
        getHistoricalCascades: () => this.cascadeHistory.slice(-20),
        getActiveRingCount: () => this.activeRings.length
      };
    }
  }
}
