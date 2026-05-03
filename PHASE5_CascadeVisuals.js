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
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

// ============================================================================
// SECTION 1: CASCADE PROPAGATION VISUALS
// ============================================================================

/**
 * Visualizes cascade propagation through networks with expanding rings
 */
export class PHASE5_CascadePropagationVisuals {
  constructor(scene, config = {}) {
    // Debug guard (Priority 4 fix)
    this.debug = false;

    this.scene = scene;
    this.linkingSystem = config.linkingSystem ?? globalThis?.game?.linkingSystem ?? null;
    
    this.config = {
      enableDebug: config.enableDebug ?? false,
      enableLogging: config.enableLogging ?? false,
      
      // Ring appearance
      ringRadius: config.ringRadius ?? 2.25,
      ringThickness: config.ringThickness ?? 0.22,
      ringSegments: config.ringSegments ?? 64,
      
      // Ring animation
      expandSpeed: config.expandSpeed ?? 8.0,
      fadeDuration: config.fadeDuration ?? 0.8,
      maxRingSize: config.maxRingSize ?? 15.0,
      ringGlowPulseFreq: config.ringGlowPulseFreq ?? 3.5,    // NEW: brightness pulse Hz
      ringGlowPulseStrength: config.ringGlowPulseStrength ?? 0.18, // NEW: pulse amplitude for ring opacity
      
      // Cascade colors
      corruptionCascadeColor: config.corruptionCascadeColor ?? 0xff3333,
      harmonyCascadeColor: config.harmonyCascadeColor ?? 0x00ffff,
      threatCascadeColor: config.threatCascadeColor ?? 0xff6600,
      
      // Ring intensity
      baseOpacity: config.baseOpacity ?? 0.35,
      emissiveIntensity: config.emissiveIntensity ?? 0.75,
      
      // Performance settings
      maxActiveRings: config.maxActiveRings ?? 50,
      enableDepthFading: config.enableDepthFading ?? true,
      
      // Cascade depth multipliers
      depthDecayFactor: config.depthDecayFactor ?? 0.7,
      
      // Ripple line effect
      rippleEnabled: config.rippleEnabled ?? true,
      rippleSegments: config.rippleSegments ?? 32,
      rippleBaseRadius: config.rippleBaseRadius ?? 0.02,
      rippleMaxRadiusScale: config.rippleMaxRadiusScale ?? 1.0,
      rippleLifetime: config.rippleLifetime ?? 1.0,
      rippleCooldownSeconds: config.rippleCooldownSeconds ?? 1.5,
      rippleColor: config.rippleColor ?? 0xfff3c4,
      rippleOpacity: config.rippleOpacity ?? 0.8,
      rippleLineWidth: config.rippleLineWidth ?? 2.0,
      rippleTrailEnabled: config.rippleTrailEnabled ?? true,  // NEW: ghost trail
      rippleTrailDelay: config.rippleTrailDelay ?? 0.12,     // NEW: trail delay in seconds
      rippleTrailOpacityScale: config.rippleTrailOpacityScale ?? 0.35, // NEW: trail opacity multiplier
      rippleCoreScale: config.rippleCoreScale ?? 0.82,       // NEW: inner ring core scale
      rippleCoreOpacity: config.rippleCoreOpacity ?? 0.26,   // NEW: inner ring core opacity
      rippleColorEvolution: config.rippleColorEvolution ?? true,       // NEW: color shift over lifetime
      
      // Activation safety gate
      cascadeActivationThreshold: config.cascadeActivationThreshold ?? 0.3,
      
      // Echo cadence
      echoRingCount: config.echoRingCount ?? 3,
      echoRingSpacing: config.echoRingSpacing ?? 0.42,
      echoRingVerticalOffset: config.echoRingVerticalOffset ?? 0.045,
      echoRingOpacityFalloff: config.echoRingOpacityFalloff ?? 0.16,
      cascadeCooldownSeconds: config.cascadeCooldownSeconds ?? 3.0,

      // ── Stability-based autonomous spawning ──
      stabilitySpawn: {
        enabled: true,
        interval: 2.5,                // seconds between spawns per node
        midThreshold: 0.35,           // stability.mid threshold
        highThreshold: 0.65,          // stability.high threshold
        maxConcurrentPerNode: 2,      // max active stability ripples per node
        rippleColor: 0x88ddff,        // cool blue for stability mid
        echoColor: 0x44ffcc,          // teal for stability high
        nodeCacheInterval: 3.0,       // seconds between node cache refreshes
      }
    };
    
    // Visual objects
    this.ringGroup = new THREE.Group();
    this.ringGroup.name = 'CascadeRings';
    this.ringGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE);
    this.scene.add(this.ringGroup);
    
    // Active rings (pool for reuse)
    this.activeRings = [];
    this.ringPool = [];
    this.ripples = [];
    this._rippleGeometryCache = new Map();
    
    // Ring material cache
    this.ringMaterials = new Map();
    
    // Cascade event tracking
    this.cascadeEvents = [];
    this.cascadeHistory = [];
    this._cascadeCooldowns = new Map();
    this._rippleCooldowns = new Map();
    
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
    this._elapsedTime = 0;
    this.semanticBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
    this._semanticEventsBound = false;
    this._boundCascadeHopHandler = null;
    this._boundStabilityHandler = null;
    
    // ── Stability spawn state ──
    this._stabSpawnTimers = new Map();       // nodeId → lastSpawnTime
    this._stabActiveCounts = new Map();      // nodeId → active stability ripple count
    this._stabNodesCache = null;
    this._stabNodesCacheTime = -Infinity;
    
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

      const cooldownKey = this._getCascadeCooldownKey(sourceNodeId, sourcePosition, cascadeType);
      if (this._isCascadeCooldownActive(cooldownKey)) {
        return;
      }
      this._markCascadeCooldown(cooldownKey);
      
      // Create initial ring at source
      if (sourcePosition) {
        this.createRingEchoTriplet(
          sourcePosition,
          cascadeType,
          normalizedStrength,
          depth
        );
        if (this.config.rippleEnabled) {
          this.createRipple(sourcePosition, normalizedStrength, {
            verticalOffset: 0.02,
            nodeId: sourceNodeId,
            kind: 'source'
          });
        }
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
              this.createRingEchoTriplet(
                node.position,
                cascadeType,
                depthStrength,
                depth + index + 1
              );
              if (this.config.rippleEnabled) {
                this.createRipple(node.position, depthStrength, {
                  verticalOffset: 0.02,
                  nodeId: node?.userData?.id ?? node?.id ?? null,
                  kind: 'path'
                });
              }
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
  createRing(position, cascadeType = 'corruption', strength = 1.0, depth = 0, options = {}) {
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
        baseScale: Number.isFinite(options.baseScale) ? Math.max(0.75, options.baseScale) : 1.0,
        opacityMultiplier: Number.isFinite(options.opacityMultiplier) ? Math.max(0.1, options.opacityMultiplier) : 1.0,
        echoIndex: Number.isFinite(options.echoIndex) ? options.echoIndex : 0,
        elapsedTime: 0,
        startTime: Date.now(),
        material: this.getRingMaterial(cascadeType)
      };
      ringMesh.material = ringMesh.userData.material;
      ringMesh.scale.setScalar(ringMesh.userData.baseScale);
      
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
   * Create a light support echo ring.
   * The stronger visible echo burst now lives in SynergyCascadeVisualizer.
   */
  createRingEchoTriplet(position, cascadeType = 'corruption', strength = 1.0, depth = 0) {
    const ringCount = 1;
    const spacing = Math.max(0.02, Number(this.config.echoRingSpacing) || 0.12);
    const opacityFalloff = Math.max(0, Math.min(0.8, Number(this.config.echoRingOpacityFalloff) || 0.18));

    for (let echoIndex = 0; echoIndex < ringCount; echoIndex++) {
      const baseScale = 1.0 + (echoIndex * spacing);
      const opacityMultiplier = Math.max(0.22, 0.58 - (echoIndex * opacityFalloff));
      const depthBias = depth + (echoIndex * 0.08);
      const strengthBias = Math.max(0.16, strength * 0.44);
      const echoPosition = position.clone();
      const centered = 0;
      const verticalOffset = centered * this.config.echoRingVerticalOffset;
      const lateralOffset = centered * 0.22;
      echoPosition.y += verticalOffset;
      echoPosition.x += lateralOffset;
      echoPosition.z += Math.sin((echoIndex + 1) * 1.31) * 0.08;

      this.createRing(
        echoPosition,
        cascadeType,
        strengthBias,
        depthBias,
        {
          baseScale,
          opacityMultiplier,
          echoIndex
        }
      );

      if (this.config.rippleEnabled) {
        this.createRipple(echoPosition, strengthBias, {
          verticalOffset: verticalOffset * 0.5,
          radiusScale: 0.95,
          opacityScale: opacityMultiplier,
          lifetimeScale: 0.84,
          nodeId: sourceNodeId,
          kind: 'echo'
        });
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
      fog: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const ring = new THREE.LineLoop(geometry, material);
    ring.name = 'CascadeRing';
    ring.userData = {};
    
    return ring;
  }

  /**
   * Create a ripple line mesh effect inspired by SynergyCascadeVisualizer
   */
  createRipple(position, intensity, options = {}) {
    if (!this.config.rippleEnabled || !position) return;

    const rippleCooldownKey = this._getRippleCooldownKey(position, options);
    if (this._isRippleCooldownActive(rippleCooldownKey)) {
      return;
    }
    this._markRippleCooldown(rippleCooldownKey);

    const colorOption = options.color ?? this.config.rippleColor;
    const ripple = {
      center: position.clone(),
      age: 0,
      lifetime: this.config.rippleLifetime * (Number(options.lifetimeScale) || 1.0),
      intensity: Math.max(0, Math.min(1, Number(intensity) || 0.1)),
      mesh: null,
      trailMesh: null,       // NEW: ghost trail line
      trailSpawned: false,
      baseColor: new THREE.Color(colorOption),
      nodeId: options.nodeId ?? null,
      kind: options.kind ?? 'default'
    };

    const ringGeometry = this._getRippleGeometry();

    const rippleMaterial = new THREE.LineBasicMaterial({
      color: colorOption,
      linewidth: this.config.rippleLineWidth,
      transparent: true,
      opacity: this.config.rippleOpacity * Math.min(1, 0.5 + ripple.intensity * 0.5),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const rippleLine = new THREE.Line(ringGeometry, rippleMaterial);
    rippleLine.position.copy(position);
    rippleLine.position.y += Number(options.verticalOffset || 0);
    rippleLine.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE);
    rippleLine.frustumCulled = false;

    ripple.mesh = rippleLine;
    this.scene.add(rippleLine);

    // ── NEW: Ghost trail line (delayed, dimmer copy) ──
    if (this.config.rippleTrailEnabled) {
      const trailColor = new THREE.Color(colorOption).lerp(new THREE.Color(0xffffff), 0.15);
      const trailMaterial = new THREE.LineBasicMaterial({
        color: trailColor,
        linewidth: Math.max(1, this.config.rippleLineWidth - 0.5),
        transparent: true,
        opacity: 0,   // starts invisible, fades in after delay
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const trailLine = new THREE.Line(ringGeometry, trailMaterial);
      trailLine.position.copy(position);
      trailLine.position.y += Number(options.verticalOffset || 0) + 0.005;
      trailLine.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE) - 1;
      trailLine.frustumCulled = false;
      trailLine.visible = false;
      ripple.trailMesh = trailLine;
      this.scene.add(trailLine);
    }

    // --- NEW: inner core ring for hero polish ---
    const coreColor = new THREE.Color(colorOption).lerp(new THREE.Color(0xffffff), 0.24);
    const coreMaterial = new THREE.LineBasicMaterial({
      color: coreColor,
      transparent: true,
      opacity: Math.min(0.72, this.config.rippleCoreOpacity + (ripple.intensity * 0.24)),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const coreLine = new THREE.Line(ringGeometry, coreMaterial);
    coreLine.position.copy(position);
    coreLine.position.y += Number(options.verticalOffset || 0) + 0.001;
    coreLine.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE) + 1;
    coreLine.frustumCulled = false;
    ripple.coreMesh = coreLine;
    this.scene.add(coreLine);
    
    this.ripples.push(ripple);
  }

  /**
   * Update ripple line effects with trail and color evolution
   */
  updateRipples(deltaTime) {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      ripple.age += deltaTime;
      const fadeRatio = 1.0 - (ripple.age / ripple.lifetime);

      if (fadeRatio <= 0) {
        if (ripple.mesh) {
          this.scene.remove(ripple.mesh);
          ripple.mesh.material.dispose();
        }
        if (ripple.trailMesh) {
          this.scene.remove(ripple.trailMesh);
          ripple.trailMesh.material.dispose();
        }
        if (ripple.coreMesh) {
          this.scene.remove(ripple.coreMesh);
          ripple.coreMesh.material.dispose();
        }
        // Decrement stability active count
        if (ripple.nodeId) {
          const key = String(ripple.nodeId);
          const count = (this._stabActiveCounts.get(key) ?? 1) - 1;
          if (count > 0) this._stabActiveCounts.set(key, count);
          else this._stabActiveCounts.delete(key);
        }
        this.ripples.splice(i, 1);
        continue;
      }

      const radius = this.config.rippleBaseRadius + (this.config.rippleBaseRadius * this.config.rippleMaxRadiusScale * (1.0 - fadeRatio) * 8.0);
      const progress = 1.0 - fadeRatio;

      if (ripple.mesh) {
        ripple.mesh.scale.setScalar(radius / this.config.rippleBaseRadius);
        ripple.mesh.material.opacity = Math.max(0.05, this.config.rippleOpacity * fadeRatio * ripple.intensity * (0.88 + progress * 0.12));

        // ── Color evolution: warm → cool shift over lifetime ──
        if (this.config.rippleColorEvolution && ripple.baseColor) {
          const evolvedColor = ripple.baseColor.clone();
          const coolTarget = new THREE.Color(0x4488ff);
          evolvedColor.lerp(coolTarget, progress * 0.45);
          ripple.mesh.material.color.copy(evolvedColor);
        }
      }

      if (ripple.coreMesh) {
        ripple.coreMesh.scale.setScalar((radius * this.config.rippleCoreScale) / this.config.rippleBaseRadius);
        ripple.coreMesh.material.opacity = Math.max(0.08, (this.config.rippleCoreOpacity * fadeRatio * ripple.intensity) * (0.92 + progress * 0.18));
      }

      // ── Trail: spawn after delay, then expand behind ──
      if (ripple.trailMesh && this.config.rippleTrailEnabled) {
        const trailDelay = this.config.rippleTrailDelay ?? 0.12;
        if (ripple.age >= trailDelay && !ripple.trailSpawned) {
          ripple.trailSpawned = true;
          ripple.trailMesh.visible = true;
        }
        if (ripple.trailSpawned) {
          const trailAge = ripple.age - trailDelay;
          const trailFadeRatio = Math.max(0, 1.0 - (trailAge / (ripple.lifetime - trailDelay)));
          const trailRadius = this.config.rippleBaseRadius + (this.config.rippleBaseRadius * this.config.rippleMaxRadiusScale * (1.0 - trailFadeRatio) * 6.5);
          ripple.trailMesh.scale.setScalar(trailRadius / this.config.rippleBaseRadius);
          const trailOpacityScale = this.config.rippleTrailOpacityScale ?? 0.35;
          ripple.trailMesh.material.opacity = Math.max(0.02, this.config.rippleOpacity * trailFadeRatio * ripple.intensity * trailOpacityScale * (0.82 + progress * 0.18));
          if (ripple.trailMesh.material.color) {
            const trailColor = ripple.baseColor.clone().lerp(new THREE.Color(0xffffff), 0.32);
            ripple.trailMesh.material.color.copy(trailColor);
          }
        }
      }
    }
  }

  /**
   * Get the shared ripple geometry used by ripple and trail meshes.
   */
  _getRippleGeometry() {
    const segments = Math.max(8, Number(this.config.rippleSegments) || 32);
    const radius = Number(this.config.rippleBaseRadius) || 0.02;
    const cacheKey = `${segments}:${radius}`;

    if (this._rippleGeometryCache.has(cacheKey)) {
      return this._rippleGeometryCache.get(cacheKey);
    }

    const ringGeometry = new THREE.BufferGeometry();
    const ringPoints = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      ringPoints.push(new THREE.Vector3(x, 0.01, z));
    }

    ringGeometry.setFromPoints(ringPoints);
    this._rippleGeometryCache.set(cacheKey, ringGeometry);
    return ringGeometry;
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
      depthWrite: false,
      blending: THREE.AdditiveBlending
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
      opacityMultiplier *= ringMesh.userData.opacityMultiplier ?? 1.0;
      
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
    if (this.frameScheduler && typeof this.frameScheduler.shouldRunVisual === 'function') {
      if (!this.frameScheduler.shouldRunVisual()) return;
    }

    const updateStart = Date.now();
    this._elapsedTime = (this._elapsedTime ?? 0) + deltaTime;
    
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
        const scale = (ring.userData.baseScale ?? 1.0) * (1.0 + (expansion / this.config.ringRadius));
        ring.scale.setScalar(scale);
        
        // Fade based on expansion + glow pulse
        const fadeProgress = ring.userData.elapsedTime / this.config.fadeDuration;
        const fadeMultiplier = Math.max(0, 1.0 - fadeProgress);
        const glowPulse = 0.82 + (this.config.ringGlowPulseStrength ?? 0.18) * Math.sin(ring.userData.elapsedTime * (this.config.ringGlowPulseFreq ?? 3.5) * Math.PI * 2);
        ring.material.opacity = this.config.baseOpacity * ring.userData.strength * fadeMultiplier * glowPulse;
        
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

      this.updateRipples(deltaTime);
      this._updateStabilitySpawning();
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

  _getCascadeCooldownKey(sourceNodeId, sourcePosition, cascadeType) {
    if (sourceNodeId) {
      return `node:${sourceNodeId}:${cascadeType}`;
    }
    if (sourcePosition?.isVector3) {
      return `pos:${sourcePosition.x.toFixed(2)}:${sourcePosition.y.toFixed(2)}:${sourcePosition.z.toFixed(2)}:${cascadeType}`;
    }
    return `cascade:${cascadeType}`;
  }

  _isCascadeCooldownActive(key) {
    if (!key) return false;
    const lastTrigger = this._cascadeCooldowns.get(key);
    if (!Number.isFinite(lastTrigger)) return false;
    return (Date.now() - lastTrigger) < (this.config.cascadeCooldownSeconds * 1000);
  }

  _markCascadeCooldown(key) {
    if (!key) return;
    this._cascadeCooldowns.set(key, Date.now());
  }

  _getRippleCooldownKey(position, options = {}) {
    const kind = options.kind ?? 'default';
    if (options.nodeId !== undefined && options.nodeId !== null) {
      return `node:${options.nodeId}:${kind}`;
    }
    if (position?.isVector3) {
      return `pos:${position.x.toFixed(2)}:${position.y.toFixed(2)}:${position.z.toFixed(2)}:${kind}`;
    }
    return `ripple:${kind}`;
  }

  _isRippleCooldownActive(key) {
    if (!key) return false;
    const lastTrigger = this._rippleCooldowns.get(key);
    if (!Number.isFinite(lastTrigger)) return false;
    return (Date.now() - lastTrigger) < (this.config.rippleCooldownSeconds * 1000);
  }

  _markRippleCooldown(key) {
    if (!key) return;
    this._rippleCooldowns.set(key, Date.now());
  }

  _resolveLinkById(linkId) {
    if (!linkId) return null;
    const links = this.linkingSystem?.links || globalThis?.game?.linkingSystem?.links || [];
    return links.find?.((link) => {
      const candidateId = link?.id ?? link?.linkId ?? link?.userData?.linkId ?? null;
      return candidateId === linkId;
    }) || null;
  }

  _resolveLinkAnchorPosition(event = {}) {
    const direct = event.sourcePosition || event.position || event.anchor || null;
    if (direct?.isVector3) return direct.clone();

    const link = event.link ?? event.linkRef ?? this._resolveLinkById(event.linkId);
    const sourceNode = event.sourceNode || event.source || link?.sourceNode || link?.source || null;
    const targetNode = event.targetNode || event.target || link?.targetNode || link?.target || null;

    const sourcePosition = sourceNode?.position || sourceNode?.worldPosition || link?.sourcePosition || link?.source?.position || null;
    const targetPosition = targetNode?.position || targetNode?.worldPosition || link?.targetPosition || link?.target?.position || null;

    if (sourcePosition?.clone && targetPosition?.clone) {
      return sourcePosition.clone().add(targetPosition).multiplyScalar(0.5);
    }
    if (sourcePosition?.clone) return sourcePosition.clone();
    if (targetPosition?.clone) return targetPosition.clone();
    return null;
  }
  
  /**
   * Subscribe to semantic bus cascade events
   */
  _subscribeSemanticCascadeEvents() {
    if (this._semanticEventsBound) {
      return;
    }

    if (!this.semanticBus || typeof this.semanticBus.on !== 'function') {
      console.warn('[PHASE5_CascadePropagationVisuals] semanticBus unavailable or missing .on() — stability ripple will not spawn');
      return;
    }
    
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
      
      // Registry-wrapped subscriptions
      this._regDisposers = [];
      const reg = (tag, handler) => {
        const disposer = eventRegistrationRegistry.register('PHASE5_CascadePropagationVisuals', tag, handler, this.semanticBus);
        this._regDisposers.push(disposer);
      };

      reg('cascade.hop', this._boundCascadeHopHandler);
      reg('cascade.start', this._boundCascadeHopHandler);

      this._boundLinkHarmonyHandler = (event) => {
        if (!event) return;
        const sourcePosition = this._resolveLinkAnchorPosition(event);
        if (!sourcePosition) return;

        const sourceNodeId = event.sourceNodeId || event.linkId || event.link?.id || event.linkRef?.id || null;
        const intensity = Number.isFinite(event.value)
          ? Math.max(0, Math.min(1, event.value))
          : Number.isFinite(event.intensity)
            ? Math.max(0, Math.min(1, event.intensity))
            : Number.isFinite(event.strength)
              ? Math.max(0, Math.min(1, event.strength))
              : 0.8;

        this.triggerCascade({
          sourceNodeId,
          sourcePosition,
          cascadeType: 'harmony',
          cascadeStrength: intensity,
          depth: event.depth || 0,
          targetNodes: []
        });
      };

      reg('link.harmony.low', this._boundLinkHarmonyHandler);
      reg('link.harmony.mid', this._boundLinkHarmonyHandler);
      reg('link.harmony.high', this._boundLinkHarmonyHandler);

      this._boundStabilityHandler = (event) => {
        if (!event) return;
        const node = event.node || event.target || event.source || event.sourceNode || null;
        if (!node || !node.position) {
          console.warn('[PHASE5_CascadePropagationVisuals] Stability event missing node position', event);
          return;
        }

        const eventName = event?.type || event?.name || 'node.stability.unknown';
        const nodeId = node?.userData?.id ?? node?.id ?? null;
        const stabConfig = this.config.stabilitySpawn;

        // ── Differentiate by stability level ──
        if (eventName.endsWith?.('high')) {
          // HIGH stability → ringEchoTriplet (stronger visual)
          const intensity = 0.85;
          if (this.config.enableDebug) {
            if (this.debug) console.log('[PHASE5_CascadePropagationVisuals] Stability HIGH → ringEchoTriplet', { nodeId, intensity });
          }
          this.createRingEchoTriplet(
            node.position,
            'harmony',
            intensity,
            0
          );
        } else if (eventName.endsWith?.('mid')) {
          // MID stability → ripple only (lighter visual)
          const intensity = 0.6;
          const color = stabConfig?.rippleColor ?? 0x88ddff;
          if (this.config.enableDebug) {
            if (this.debug) console.log('[PHASE5_CascadePropagationVisuals] Stability MID → ripple', { nodeId, intensity });
          }
          this.createRipple(node.position, intensity, {
            verticalOffset: 0.02,
            color,
            nodeId,
            kind: 'stability'
          });
        }
        // LOW stability → no visual (too noisy)
      };
      reg('node.stability.mid', this._boundStabilityHandler);
      reg('node.stability.high', this._boundStabilityHandler);
      this._semanticEventsBound = true;
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadePropagationVisuals] Semantic subscription error:', err);
      }
    }
  }

  _unsubscribeSemanticCascadeEvents() {
    if (!this._semanticEventsBound) return;

    // Prefer registry disposers
    if (Array.isArray(this._regDisposers)) {
      for (const disposer of this._regDisposers) {
        try { disposer(); } catch (_) {}
      }
      this._regDisposers.length = 0;
    }

    // Fallback: native off/unsubscribe for safety
    const bus = this.semanticBus;
    if (bus) {
      try {
        if (typeof bus.off === 'function') {
          bus.off('cascade.hop', this._boundCascadeHopHandler);
          bus.off('cascade.start', this._boundCascadeHopHandler);
          bus.off('link.harmony.low', this._boundLinkHarmonyHandler);
          bus.off('link.harmony.mid', this._boundLinkHarmonyHandler);
          bus.off('link.harmony.high', this._boundLinkHarmonyHandler);
          bus.off('node.stability.low', this._boundStabilityHandler);
          bus.off('node.stability.mid', this._boundStabilityHandler);
          bus.off('node.stability.high', this._boundStabilityHandler);
        }
        if (typeof bus.unsubscribe === 'function') {
          bus.unsubscribe('cascade.hop', this._boundCascadeHopHandler);
          bus.unsubscribe('cascade.start', this._boundCascadeHopHandler);
          bus.unsubscribe('link.harmony.low', this._boundLinkHarmonyHandler);
          bus.unsubscribe('link.harmony.mid', this._boundLinkHarmonyHandler);
          bus.unsubscribe('link.harmony.high', this._boundLinkHarmonyHandler);
          bus.unsubscribe('node.stability.low', this._boundStabilityHandler);
          bus.unsubscribe('node.stability.mid', this._boundStabilityHandler);
          bus.unsubscribe('node.stability.high', this._boundStabilityHandler);
        }
      } catch (err) {
        if (this.config.enableDebug) {
          console.warn('[PHASE5_CascadePropagationVisuals] Semantic unsubscribe error:', err);
        }
      }
    }

    this._semanticEventsBound = false;
  }

  rebind(config = {}) {
    const newBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
    if (newBus !== this.semanticBus) {
      this._unsubscribeSemanticCascadeEvents();
      this.semanticBus = newBus;
    }
    this.linkingSystem = config.linkingSystem ?? this.linkingSystem ?? globalThis?.game?.linkingSystem ?? null;
    this._subscribeSemanticCascadeEvents();
    return this;
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
    this.clearRipples();
    this.cascadeEvents = [];
    this._cascadeCooldowns.clear();
    this._rippleCooldowns.clear();
  }

  clearRipples() {
    for (const ripple of this.ripples) {
      if (ripple.mesh) {
        this.scene.remove(ripple.mesh);
        ripple.mesh.geometry.dispose();
        ripple.mesh.material.dispose();
      }
      if (ripple.trailMesh) {
        this.scene.remove(ripple.trailMesh);
        ripple.trailMesh.geometry.dispose();
        ripple.trailMesh.material.dispose();
      }
    }
    this.ripples = [];
    this._stabActiveCounts.clear();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Stability Autonomous Spawning
  // Polls node stability metrics and spawns effects based on thresholds.
  //   stability.mid  → createRipple (lighter visual)
  //   stability.high → createRingEchoTriplet (stronger visual)
  // Interval: 2.5s default
  // ═══════════════════════════════════════════════════════════════════════

  _updateStabilitySpawning() {
    const stabConfig = this.config.stabilitySpawn;
    if (!stabConfig?.enabled) return;

    const interval = Math.max(0.5, stabConfig.interval ?? 2.5);
    const midThreshold = Math.max(0.1, stabConfig.midThreshold ?? 0.35);
    const highThreshold = Math.max(midThreshold + 0.1, stabConfig.highThreshold ?? 0.65);
    const maxConcurrent = Math.max(1, stabConfig.maxConcurrentPerNode ?? 2);

    // ── Refresh node cache periodically ──
    const cacheInterval = stabConfig.nodeCacheInterval ?? 3.0;
    if (this._elapsedTime - this._stabNodesCacheTime > cacheInterval) {
      this._stabNodesCache = this._collectNodes();
      this._stabNodesCacheTime = this._elapsedTime;
    }

    const nodes = this._stabNodesCache;
    if (!nodes || nodes.length === 0) return;

    for (const node of nodes) {
      if (!node?.position) continue;
      const nodeId = node?.userData?.id ?? node?.id ?? null;
      if (nodeId === null) continue;
      const key = String(nodeId);

      // ── Check interval timer ──
      const lastSpawn = this._stabSpawnTimers.get(key) ?? -Infinity;
      if (this._elapsedTime - lastSpawn < interval) continue;

      // ── Read stability metric ──
      const metrics = node?.userData?.metrics || {};
      const stability = Math.max(0, Math.min(1, metrics.stability ?? 0.5));

      if (stability >= highThreshold) {
        // ── HIGH → ringEchoTriplet ──
        const activeCount = this._stabActiveCounts.get(key) ?? 0;
        if (activeCount >= maxConcurrent) continue;

        const intensity = 0.6 + (stability - highThreshold) / (1.0 - highThreshold) * 0.35;
        this.createRingEchoTriplet(node.position, 'harmony', intensity, 0);
        this._stabActiveCounts.set(key, (this._stabActiveCounts.get(key) ?? 0) + 1);
        this._stabSpawnTimers.set(key, this._elapsedTime);

      } else if (stability >= midThreshold) {
        // ── MID → ripple only ──
        const activeCount = this._stabActiveCounts.get(key) ?? 0;
        if (activeCount >= maxConcurrent) continue;

        const intensity = 0.4 + (stability - midThreshold) / (highThreshold - midThreshold) * 0.3;
        const color = stabConfig.echoColor ?? 0x44ffcc;
        this.createRipple(node.position, intensity, {
          verticalOffset: 0.02,
          color,
          nodeId: key,
          kind: 'stability'
        });
        this._stabActiveCounts.set(key, (this._stabActiveCounts.get(key) ?? 0) + 1);
        this._stabSpawnTimers.set(key, this._elapsedTime);
      }
    }

    // ── Clean up stale timers ──
    if (this._stabSpawnTimers.size > 200) {
      const cutoff = this._elapsedTime - interval * 3;
      for (const [key, time] of this._stabSpawnTimers) {
        if (time < cutoff) this._stabSpawnTimers.delete(key);
      }
    }
  }

  _collectNodes() {
    const sources = [
      this.linkingSystem?.world?.nodes,
      this.linkingSystem?.world?.aiNodes?.nodes,
      globalThis.game?.aiNodes?.nodes,
      globalThis.game?.world?.nodes
    ];
    for (const collection of sources) {
      if (!collection) continue;
      if (collection instanceof Map) return [...collection.values()];
      if (Array.isArray(collection) && collection.length > 0) return collection;
    }
    return [];
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
        rebind: (bus) => this.rebind({ semanticBus: bus }),
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
    this.clearRipples();
    this.ringPool = [];
    this.ringMaterials.clear();
    this._rippleCooldowns.clear();
    
    this._unsubscribeSemanticCascadeEvents();
    
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
    this._unsubscribeSemanticEvents();
    try {
      if (this.linkCorruptionTransmission) {
        if (this.config.enableLogging) {
          if (this.debug) console.log('[PHASE5_CascadeVisualizationBridge] Subscribed to LinkCorruptionTransmission');
        }
      }

      if (this.semanticBus && typeof this.semanticBus.subscribe === 'function') {
        const requestRefresh = () => {
          this._eventRefreshRequested = true;
        };

        // Registry-wrapped subscriptions for observability
        const regDisposer = (tag, handler) => {
          const disposer = eventRegistrationRegistry.register('PHASE5_CascadeVisualizationBridge', tag, handler, this.semanticBus);
          this._semanticUnsubscribers.push(disposer);
        };

        regDisposer('node.metric.updated', requestRefresh);
        const unsubLink = this.semanticBus.registerLinkCreatedConsumer
          ? this.semanticBus.registerLinkCreatedConsumer(requestRefresh, {
              id: 'PHASE5_CascadeVisuals.requestRefresh',
              priority: this.semanticBus.priority?.NORMAL
            })
          : (() => { const d = eventRegistrationRegistry.register('PHASE5_CascadeVisualizationBridge', 'link.created', requestRefresh, this.semanticBus); this._semanticUnsubscribers.push(d); return d; })();
        if (typeof unsubLink === 'function') this._semanticUnsubscribers.push(unsubLink);
        regDisposer('node.spawned', requestRefresh);
        regDisposer('event:corruptionCascade', (payload) => {
          this._eventRefreshRequested = true;
          const cascadeEvent = this._normalizeSemanticCascadeEvent(payload, 'corruption');
          if (cascadeEvent) this.queueCascadeEvent(cascadeEvent);
        });
        regDisposer('event:linkCollapse', (payload) => {
          this._eventRefreshRequested = true;
          const cascadeEvent = this._normalizeSemanticCascadeEvent(payload, 'threat');
          if (cascadeEvent) this.queueCascadeEvent(cascadeEvent);
        });
        regDisposer('event:networkCorruptionSpread', (payload) => {
          this._eventRefreshRequested = true;
          const cascadeEvent = this._normalizeSemanticCascadeEvent(payload, 'corruption');
          if (cascadeEvent) this.queueCascadeEvent(cascadeEvent);
        });
      }
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[PHASE5_CascadeVisualizationBridge] Subscription error:', err);
      }
    }
  }

  _unsubscribeSemanticEvents() {
    if (!this._semanticUnsubscribers?.length) return;
    for (const unsub of this._semanticUnsubscribers) {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (_) {}
    }
    this._semanticUnsubscribers = [];
  }

  rebind(config = {}) {
    const newBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
    if (newBus !== this.semanticBus) {
      this._unsubscribeSemanticEvents();
      this.semanticBus = newBus;
    }
    if (config.linkCorruptionTransmission !== undefined) {
      this.linkCorruptionTransmission = config.linkCorruptionTransmission;
    }
    this.subscribeToEvents();
    return this;
  }

  /**
   * Update cascade detection and visualization
   */
  update(deltaTime) {
    if (this.frameScheduler && typeof this.frameScheduler.shouldRunVisual === 'function') {
      if (!this.frameScheduler.shouldRunVisual()) return;
    }

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
        if (this.debug) console.log(
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
        rebind: (bus) => this.rebind({ semanticBus: bus }),
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
        if (this.debug) console.log(`[PHASE5_InterNetworkVisualizationBridge] Network registered: ${networkId}`);
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
        if (this.debug) console.log(
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
        if (this.debug) console.log(
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
