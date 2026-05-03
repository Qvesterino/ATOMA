/**
 * GLYPH FUSION OVERLAY 4.1 — SEMANTIC FUSION LAYER (SAFE EDITION)
 * 
 * Secondary "Fusion Glyph" overlay that visually merges with Semantic Glyph AI states.
 * Reads only from semantic fields, generates lightweight fusion forms.
 * 
 * STRICT SAFETY:
 * - Does NOT modify _SemanticGlyphAI.js
 * - Does NOT modify AINodes.js, physics, or gameplay
 * - Only attaches lightweight visual meshes as children
 * - No recursion, no global registries, no destructive overrides
 * - < 0.4ms per frame for 50 nodes
 * - Max 40 triangles per fusion object
 * 
 * SEMANTIC INPUTS (read-only):
 * - meaningType: 'focused' | 'stressed' | 'calm' | 'exploring' | 'leader' | 'conflict' | 'cluster-sync'
 * - glyphEmotion: 0-1 (intensity)
 * - glyphTier: 1-3 (complexity level)
 * - glyphStability: 0-1 (stability metric)
 * 
 * FUSION FORMS:
 * 1. Dual-rings (2 rotating toruses)
 * 2. Tri-fold geometry (3 rotating planes)
 * 3. Lotus fractal pulses (6 petals breathing)
 * 4. Hexagon-orbital merge (6 orbiting hexagons)
 * 5. Rotating cross-planes (2 orthogonal planes)
 * 
 * ANIMATION:
 * - Fusion glyph fades in/out based on semantic intensity
 * - Scale breathing: 1.0 → 1.08
 * - Rotation speed: < 0.4 rad/s
 * - Color blend: baseColor * 0.7 + semanticColor * 0.3
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function normalizeSemanticValue(value, fallback = 0) {
  const resolved = value ?? fallback;
  if (typeof resolved !== 'number' || !Number.isFinite(resolved)) {
    return fallback;
  }

  return clamp01(resolved > 1 ? resolved / 100 : resolved);
}

export class GlyphFusionOverlay4_1 {
  constructor(scene, worldRoot, semanticGlyphAI, semanticBus, options = {}) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.semanticGlyphAI = semanticGlyphAI;
    this.semanticBus = semanticBus;
    this.debug = options.debug || false;
    this.frameScheduler = options.frameScheduler || null;
    this.maxFusionsPerFrame = options.maxFusionsPerFrame || 50;
    const attachRoot = worldRoot || scene;
    
    // Master container for all fusion glyphs
    this.fusionContainer = new THREE.Group();
    this.fusionContainer.userData.isFusionOverlay4 = true;
    this.fusionContainer.name = 'GlyphFusionOverlay4_1';
    this.fusionContainer.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_NODE_MULTIFUSION);
    attachRoot.add(this.fusionContainer);
    this.root = this.fusionContainer;
    
    // Per-node fusion tracking
    this.nodeFusionMap = new Map();  // nodeId → { node, fusionGroup, meshes[], animState }
    
    // Animation state per node
    this.animationState = new Map();  // nodeId → { rotPhase, pulsePhase, fadePhase }
    
    // Geometry pools (reusable, lightweight)
    this.geometryPools = {
      rings: [],           // Torus (low-poly)
      planes: [],          // Plane geometry
      petals: [],          // Icosphere variants
      hexagons: []         // Low-poly cone/hex shapes
    };
    
    this.materialPools = new Map();
    this._poolCursor = {
      rings: 0,
      planes: 0,
      petals: 0,
      hexagons: 0
    };
    
    // Configuration
    this.config = {
      maxTriangles: 40,
      rotationSpeedMax: 0.4,       // rad/s
      scaleBreathAmount: 0.08,     // 1.0 → 1.08
      colorBlendRatio: 0.3,        // semanticColor influence
      fadeInDuration: 0.5,         // seconds
      fadeOutDuration: 0.5,        // seconds
      pulseFrequency: 2.0          // Hz
    };
    
    // Pending timeout tracking (for boostFusionIntensity leak prevention)
    this._pendingTimeouts = new Map(); // nodeId → timeoutId
    
    // Enable/disable flag
    this.enabled = true;
    this._eventsSubscribed = false;
    this._semanticUnsubscribers = [];
    
    // Color palette
    this.colors = {
      // Semantic state colors
      focused: 0x6f85bf,      // muted blue
      stressed: 0x8b6a7b,     // muted rose
      calm: 0x728096,         // steel
      exploring: 0x66508f,    // violet
      leader: 0x9c8a5a,       // muted gold
      conflict: 0x7a69c0,     // indigo-violet
      'cluster-sync': 0xa0a9b8, // ash
      
      // Blend base
      neutral: 0xdbe2ee       // frost
    };
    
    // Statistics
    this.stats = {
      totalFusionGlyphs: 0,
      activeFusionGlyphs: 0,
      frameTime: 0
    };
    
    // Enable/disable flag
    this.enabled = true;
    
    this.initializePools();
    
    if (this.debug) {
      console.log('✓ Glyph Fusion Overlay 4.1 initialized');
    }
  }
  
  /**
   * Initialize lightweight geometry pools
   */
  initializePools() {
    // Low-poly torus (for dual-rings)
    const torusGeom = new THREE.TorusGeometry(0.2, 0.03, 6, 12);  // 6 segments = low-poly
    for (let i = 0; i < 8; i++) {
      this.geometryPools.rings.push(torusGeom);
    }
    
    // Plane geometry (for tri-fold / cross-planes)
    const planeGeom = new THREE.PlaneGeometry(0.3, 0.05, 2, 2);  // 2 segments = low-poly
    for (let i = 0; i < 8; i++) {
      this.geometryPools.planes.push(planeGeom);
    }
    
    // Icosphere for petals (low-poly)
    const petalGeom = new THREE.IcosahedronGeometry(0.08, 1);  // Detail 1 = low-poly
    for (let i = 0; i < 12; i++) {
      this.geometryPools.petals.push(petalGeom);
    }
    
    // Cone for hexagon elements
    const hexGeom = new THREE.ConeGeometry(0.05, 0.15, 6, 1);  // 6-sided cone
    for (let i = 0; i < 10; i++) {
      this.geometryPools.hexagons.push(hexGeom);
    }
  }
  
  /**
   * Subscribe to semantic events for event-driven updates
   */
  subscribeToEvents() {
    if (!this.semanticBus) {
      console.warn('GlyphFusionOverlay4_1: No semanticBus provided - event-driven disabled');
      return;
    }
    if (this._eventsSubscribed) return;

    const off = this.semanticBus.unsubscribe?.bind(this.semanticBus)
      || this.semanticBus.off?.bind(this.semanticBus)
      || null;
    const bind = (tag, handler, opts = {}) => {
      if (tag === 'link.created' && typeof this.semanticBus.registerLinkCreatedConsumer === 'function') {
        const unsub = this.semanticBus.registerLinkCreatedConsumer(handler, {
          id: `GlyphFusionOverlay4_1.${tag}`,
          priority: this.semanticBus.priority?.NORMAL,
          ...opts
        });
        if (typeof unsub === 'function') this._semanticUnsubscribers.push(unsub);
        return;
      }

      // Registry-wrapped subscription for observability
      const regDisposer = eventRegistrationRegistry.register(
        'GlyphFusionOverlay4_1',
        tag,
        handler,
        this.semanticBus
      );
      this._semanticUnsubscribers.push(() => {
        try { regDisposer(); } catch (_) {
          // Fallback: try native unsubscribe
          try { off?.(tag, handler); } catch (__) {}
        }
      });
    };

    const onLinkCreated = (evt) => {
      if (!this.enabled) return;
      this.handleLinkCreated(evt);
    };
    const onNetworkLinkDestroyed = (evt) => {
      if (!this.enabled) return;
      this.handleLinkDestroyed(evt);
    };
    const onLinkCollapsed = (evt) => {
      if (!this.enabled) return;
      this.handleLinkDestroyed(evt);
    };
    const onSemanticStateChanged = (evt) => {
      if (!this.enabled) return;
      this.handleSemanticStateChanged(evt);
    };
    const onSemanticClusterSync = (evt) => {
      if (!this.enabled) return;
      this.handleClusterSync(evt);
    };
    const onSemanticAscension = (evt) => {
      if (!this.enabled) return;
      this.handleAscension(evt);
    };
    const onNodeAscended = (evt) => {
      if (!this.enabled) return;
      this.handleAscension(evt);
    };
    const onRitualStarted = (evt) => {
      if (!this.enabled) return;
      this.handleRitualStarted(evt);
    };
    const onRitualCompleted = (evt) => {
      if (!this.enabled) return;
      this.handleRitualCompleted(evt);
    };
    const onNodeSelection = (evt) => {
      if (!this.enabled) return;
      if (evt.type === 'select') {
        this.handleNodeSelected(evt.nodeId);
      } else if (evt.type === 'deselect') {
        this.handleNodeDeselected(evt.nodeId);
      }
    };
    const onNodeSelected = (evt) => {
      if (!this.enabled) return;
      this.handleNodeSelected(evt.nodeId);
    };
    
    // Network events - trigger exploring state
    bind('link.created', onLinkCreated);
    
    bind('network.link.destroyed', onNetworkLinkDestroyed);
    bind('link:collapsed', onLinkCollapsed);
    
    // Semantic events - trigger appropriate fusion forms
    bind('semantic.state.changed', onSemanticStateChanged);
    
    bind('semantic.cluster.sync', onSemanticClusterSync);
    
    bind('semantic.ascension', onSemanticAscension);
    bind('node:ascended', onNodeAscended);
    
    bind('semantic.ritual.started', onRitualStarted);
    
    bind('semantic.ritual.completed', onRitualCompleted);
    
    // Selection event - immediate response
    bind('node.selection', onNodeSelection);
    bind('node:selected', onNodeSelected);
    this._eventsSubscribed = true;
  }

  _unsubscribeSemanticEvents() {
    if (!Array.isArray(this._semanticUnsubscribers) || this._semanticUnsubscribers.length === 0) {
      this._eventsSubscribed = false;
      return;
    }
    for (const unsub of this._semanticUnsubscribers) {
      try { unsub?.(); } catch (_) {}
    }
    this._semanticUnsubscribers.length = 0;
    this._eventsSubscribed = false;
  }
  
  /**
   * Event handlers
   */
  handleLinkCreated(evt) {
    // Trigger exploring state on source node
    const sourceNodeRef = evt.sourceNodeId || evt.sourceId || evt.source;
    const sourceNodeId = (sourceNodeRef && typeof sourceNodeRef === 'object')
      ? (sourceNodeRef.userData?.nodeId || sourceNodeRef.id || sourceNodeRef.uuid)
      : sourceNodeRef;
    this.triggerExploringState(sourceNodeId, evt.timestamp);
  }
  
  handleLinkDestroyed(evt) {
    // Fade out fusion glyph on affected nodes
    this.updateFusionFade(evt.sourceNodeId || evt.sourceId, 0, 0.5);
    this.updateFusionFade(evt.targetNodeId || evt.targetId, 0, 0.5);
  }
  
  handleSemanticStateChanged(evt) {
    // Update fusion form based on new state
    const meaningType = evt.toState || evt.state || evt.meaningType || evt.type || 'neutral';
    this.updateFusionForm(evt.nodeId, meaningType, evt.parameters || {}, evt.context || {});
  }
  
  handleClusterSync(evt) {
    // Trigger cluster-sync fusion form
    this.triggerClusterSyncForm(evt.nodeId, evt.syncAmount);
  }
  
  handleAscension(evt) {
    // Trigger ascended fusion form
    this.triggerAscendedForm(evt.nodeId || evt.id);
  }
  
  handleRitualStarted(evt) {
    // Trigger ritual-active fusion form
    this.triggerRitualForm(evt.targetNodeId, 'active');
  }
  
  handleRitualCompleted(evt) {
    // Fade out ritual fusion form
    this.fadeOutRitualForm(evt.targetNodeId, 1.0);
  }
  
  handleNodeSelected(nodeId) {
    // Boost fusion glyph intensity on selected node
    this.boostFusionIntensity(nodeId, 1.5, 0.3);
  }
  
  handleNodeDeselected(nodeId) {
    // Restore fusion glyph intensity
    this.restoreFusionIntensity(nodeId);
  }
  
  /**
   * Get or create material for fusion type
   */
  getMaterial(color, opacity = 0.7) {
    const key = `${color}_${opacity}`;
    if (this.materialPools.has(key)) {
      return this.materialPools.get(key).clone();
    }
    
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      fog: false,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      blending: THREE.AdditiveBlending
    });
    
    this.materialPools.set(key, material);
    return material.clone();
  }
  
  /**
   * Create fusion glyph for a node
   */
  createFusionGlyph(node, nodeId) {
    if (!node || !node.userData) return;
    
    // Check if already exists
    if (this.nodeFusionMap.has(nodeId)) {
      return this.nodeFusionMap.get(nodeId);
    }
    
    // Create fusion group (attached to node)
    const fusionGroup = new THREE.Group();
    fusionGroup.userData.isFusionGlyph = true;
    fusionGroup.userData.nodeId = nodeId;
    fusionGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_NODE_MULTIFUSION);
    node.add(fusionGroup);
    
    // Initialize animation state
    this.animationState.set(nodeId, {
      rotPhase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      fadePhase: 0,
      currentFadeTarget: 0,
      lastMeaningType: null
    });
    
    const fusionData = {
      node,
      fusionGroup,
      meshes: [],
      meaningType: null,
      intensity: 0
    };
    
    this.nodeFusionMap.set(nodeId, fusionData);
    this.stats.totalFusionGlyphs++;
    this.stats.activeFusionGlyphs++;
    
    return fusionData;
  }
  
  /**
   * Main update loop - call every frame (10Hz subtle animations only)
   * Semantic state changes are driven via events, not per-frame polling
   */
  update(dt) {
    if (!this.enabled) return;
    if (this.frameScheduler && typeof this.frameScheduler.shouldRunVisual === 'function') {
      if (!this.frameScheduler.shouldRunVisual()) return;
    }
    
    const startTime = performance.now();
    
    // Only update subtle animations (fade, rotation, scale breathing)
    // NO semantic state polling - events drive state changes
    this.updateSubtleAnimations(dt);
    
    this.stats.frameTime = performance.now() - startTime;
  }
  
  /**
   * Update subtle animations only (10Hz)
   * Semantic state is updated via events
   */
  updateSubtleAnimations(dt) {
    let processed = 0;
    for (const [nodeId, fusionData] of this.nodeFusionMap) {
      if (processed >= this.maxFusionsPerFrame) break;
      
      // Dead-node guard
      if (fusionData.node?.userData?.disposed || fusionData.node?.userData?.isAlive === false) {
        this.removeFusionGlyph(nodeId);
        continue;
      }
      
      processed++;
      this.updateFusionFadeInAnimation(nodeId, dt);
      this.updateFusionRotationAnimation(nodeId, dt);
      this.updateFusionScaleBreathing(nodeId, dt);
    }
  }
  
  /**
   * Update fusion fade in/out animation
   */
  updateFusionFadeInAnimation(nodeId, dt) {
    const animState = this.animationState.get(nodeId);
    const fusionData = this.nodeFusionMap.get(nodeId);
    
    if (!animState || !fusionData) return;
    
    // Smooth fade to target
    const fadeSpeed = animState.currentFadeTarget > animState.fadePhase ? 
      1 / this.config.fadeInDuration : 
      1 / this.config.fadeOutDuration;
    
    animState.fadePhase = THREE.MathUtils.lerp(
      animState.fadePhase,
      animState.currentFadeTarget,
      fadeSpeed * dt
    );
    
    // Update mesh opacity based on fade
    for (const mesh of fusionData.meshes) {
      if (mesh.material) {
        mesh.material.opacity = 0.5 * animState.fadePhase;
      }
      mesh.visible = animState.fadePhase > 0.05;
    }
  }
  
  /**
   * Update fusion rotation animation
   */
  updateFusionRotationAnimation(nodeId, dt) {
    const animState = this.animationState.get(nodeId);
    const fusionData = this.nodeFusionMap.get(nodeId);
    
    if (!animState || !fusionData) return;
    
    // Update rotation phase
    animState.rotPhase += dt * this.config.rotationSpeedMax;
    
    // Apply rotation to meshes
    for (const mesh of fusionData.meshes) {
      if (mesh.userData.rotationAxis) {
        const axis = mesh.userData.rotationAxis;
        mesh.rotation[axis] += dt * this.config.rotationSpeedMax;
      }
    }
  }
  
  /**
   * Update fusion scale breathing animation
   */
  updateFusionScaleBreathing(nodeId, dt) {
    const animState = this.animationState.get(nodeId);
    const fusionData = this.nodeFusionMap.get(nodeId);
    
    if (!animState || !fusionData) return;
    
    // Update pulse phase
    if (!animState.pulsePhase) animState.pulsePhase = 0;
    animState.pulsePhase += dt * this.config.pulseFrequency * Math.PI * 2;
    
    // Compute breathing scale
    const breathScale = 1.0 + Math.sin(animState.pulsePhase) * this.config.scaleBreathAmount;
    
    // Apply scale to fusion group
    if (fusionData.fusionGroup) {
      fusionData.fusionGroup.scale.setScalar(breathScale);
    }
  }

  _resolveFusionSignals(meaningType, parameters = {}, context = {}) {
    const canonical = context.canonical ?? context.metrics ?? context.semanticMetrics ?? context;
    const inferredTier = context.glyphTier ?? parameters.glyphTier ?? (meaningType === 'leader' ? 3 : meaningType === 'focused' ? 3 : meaningType === 'cluster-sync' ? 2 : 1);

    return {
      synergy: normalizeSemanticValue(canonical?.synergy ?? context.synergy ?? parameters.focusStrength ?? parameters.hubDegree ?? parameters.syncAmount ?? parameters.exploreAmount),
      harmony: normalizeSemanticValue(canonical?.harmony ?? context.harmony ?? parameters.calmness ?? parameters.syncAmount),
      corruption: normalizeSemanticValue(canonical?.corruption ?? context.corruption ?? parameters.conflictStrength ?? parameters.stressLevel),
      stability: normalizeSemanticValue(canonical?.stability ?? context.stability ?? context.glyphStability ?? parameters.calmness),
      loadPressure: normalizeSemanticValue(canonical?.loadPressure ?? canonical?.load ?? context.loadPressure ?? context.load ?? parameters.stressLevel),
      glyphEmotion: normalizeSemanticValue(context.glyphEmotion ?? parameters.glyphEmotion ?? parameters.focusStrength ?? parameters.exploreAmount ?? parameters.syncAmount ?? 0.5),
      glyphStability: normalizeSemanticValue(context.glyphStability ?? parameters.glyphStability ?? canonical?.stability),
      glyphTier: Math.max(1, Math.min(3, Math.round(inferredTier)))
    };
  }
  
  /**
   * Compute fusion intensity from semantic state
   */
  computeFusionIntensity(meaningType, parameters, context) {
    const signals = this._resolveFusionSignals(meaningType, parameters, context);
    let intensity = 0.35;
    
    switch (meaningType) {
      case 'focused':
        intensity = 0.25 + signals.synergy * 0.35 + signals.harmony * 0.2 + signals.glyphEmotion * 0.15;
        break;
      case 'stressed':
        intensity = 0.35 + signals.corruption * 0.3 + signals.loadPressure * 0.25 + (1 - signals.stability) * 0.15;
        break;
      case 'calm':
        intensity = 0.3 + signals.harmony * 0.3 + signals.stability * 0.2;
        break;
      case 'exploring':
        intensity = 0.4 + signals.glyphEmotion * 0.25 + signals.glyphTier * 0.08 + signals.synergy * 0.15;
        break;
      case 'leader':
        intensity = 0.45 + signals.synergy * 0.25 + signals.harmony * 0.2 + signals.glyphTier * 0.1;
        break;
      case 'conflict':
        intensity = 0.55 + signals.corruption * 0.3 + (1 - signals.harmony) * 0.1;
        break;
      case 'cluster-sync':
        intensity = 0.55 + signals.synergy * 0.25 + signals.harmony * 0.25 + signals.glyphStability * 0.1;
        break;
      default:
        intensity = 0.25 + signals.glyphEmotion * 0.2 + signals.glyphStability * 0.15;
    }
    
    return clamp01(intensity);
  }
  
  /**
   * Update fusion glyph fade in/out
   */
  updateFusionFade(nodeId, targetIntensity, dt) {
    const animState = this.animationState.get(nodeId);
    const fusionData = this.nodeFusionMap.get(nodeId);
    
    if (!animState || !fusionData) return;
    
    // Smooth fade to target
    const fadeSpeed = targetIntensity > animState.fadePhase ? 
      1 / this.config.fadeInDuration : 
      1 / this.config.fadeOutDuration;
    
    animState.fadePhase = THREE.MathUtils.lerp(
      animState.fadePhase,
      targetIntensity,
      fadeSpeed * dt
    );
    
    // Update mesh opacity based on fade
    for (const mesh of fusionData.meshes) {
      if (mesh.material) {
        mesh.material.opacity = 0.5 * animState.fadePhase;
      }
      mesh.visible = animState.fadePhase > 0.05;
    }
    
    fusionData.intensity = animState.fadePhase;
  }
  
  /**
   * Update/create fusion meshes based on semantic type
   */
  updateFusionMeshes(nodeId, meaningType, intensity, context, dt) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    if (!fusionData) return;
    
    const { fusionGroup, meshes } = fusionData;
    const animState = this.animationState.get(nodeId);
    
    // Only recreate if meaning type changed
    if (meaningType !== animState.lastMeaningType) {
      // Clear old meshes
      while (meshes.length > 0) {
        const mesh = meshes.pop();
        fusionGroup.remove(mesh);
      }
      
      // Create new fusion form
      this.createFusionForm(meaningType, fusionGroup, meshes, context, intensity);
      
      animState.lastMeaningType = meaningType;
    }
  }
  
  /**
   * Create appropriate fusion form based on semantic type
   */
  createFusionForm(meaningType, fusionGroup, meshes, context, intensity) {
    switch (meaningType) {
      case 'focused':
        this.createDualRings(fusionGroup, meshes, context, intensity);
        break;
      case 'stressed':
        this.createTriFoldGeometry(fusionGroup, meshes, context, intensity);
        break;
      case 'calm':
        this.createLotusFractal(fusionGroup, meshes, context, intensity);
        break;
      case 'exploring':
        this.createHexagonOrbitalMerge(fusionGroup, meshes, context, intensity);
        break;
      case 'leader':
        this.createHexagonOrbitalMerge(fusionGroup, meshes, context, intensity);
        break;
      case 'conflict':
        this.createRotatingCrossPlanes(fusionGroup, meshes, context, intensity);
        break;
      case 'cluster-sync':
        this.createDualRings(fusionGroup, meshes, context, intensity);
        break;
      default:
        this.createDualRings(fusionGroup, meshes, context, intensity);
    }
  }
  
  /**
   * FORM 1: Dual-rings (2 rotating toruses)
   */
  createDualRings(fusionGroup, meshes, context, intensity) {
    const baseColor = this.getSemanticColor(context);
    
    // Ring 1 - larger, slower
    const ring1Geom = new THREE.TorusGeometry(0.25, 0.03, 6, 12);
    const ring1Mat = this.getMaterial(baseColor);
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    ring1.userData.rotationSpeed = 0.15;
    ring1.userData.rotationAxis = new THREE.Vector3(1, 0, 0);
    ring1.userData.fusionType = 'dualRing1';
    fusionGroup.add(ring1);
    meshes.push(ring1);
    
    // Ring 2 - smaller, faster, perpendicular
    const ring2Geom = new THREE.TorusGeometry(0.15, 0.03, 6, 12);
    const ring2Mat = this.getMaterial(baseColor);
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.z = Math.PI / 4;
    ring2.userData.rotationSpeed = 0.25;
    ring2.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
    ring2.userData.fusionType = 'dualRing2';
    fusionGroup.add(ring2);
    meshes.push(ring2);
  }
  
  /**
   * FORM 2: Tri-fold geometry (3 rotating planes)
   */
  createTriFoldGeometry(fusionGroup, meshes, context, intensity) {
    const baseColor = this.getSemanticColor(context);
    
    for (let i = 0; i < 3; i++) {
      const planeGeom = new THREE.PlaneGeometry(0.25, 0.08, 2, 2);
      const planeMat = this.getMaterial(baseColor);
      const plane = new THREE.Mesh(planeGeom, planeMat);
      
      // Rotate each plane 60 degrees apart
      plane.rotation.y = (i / 3) * Math.PI * 2;
      plane.position.x = Math.cos(plane.rotation.y) * 0.1;
      plane.position.z = Math.sin(plane.rotation.y) * 0.1;
      
      plane.userData.rotationSpeed = 0.2 + i * 0.05;
      plane.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
      plane.userData.fusionType = `trifold_${i}`;
      
      fusionGroup.add(plane);
      meshes.push(plane);
    }
  }
  
  /**
   * FORM 3: Lotus fractal pulses (6 petals breathing)
   */
  createLotusFractal(fusionGroup, meshes, context, intensity) {
    const baseColor = this.getSemanticColor(context);
    
    for (let i = 0; i < 6; i++) {
      const petalGeom = new THREE.IcosahedronGeometry(0.08, 1);
      const petalMat = this.getMaterial(baseColor);
      const petal = new THREE.Mesh(petalGeom, petalMat);
      
      // Position in lotus pattern
      const angle = (i / 6) * Math.PI * 2;
      petal.position.x = Math.cos(angle) * 0.15;
      petal.position.z = Math.sin(angle) * 0.15;
      
      petal.userData.rotationSpeed = 0;  // Only pulse, no rotation
      petal.userData.petalIndex = i;
      petal.userData.fusionType = 'lotusPetal';
      
      fusionGroup.add(petal);
      meshes.push(petal);
    }
  }
  
  /**
   * FORM 4: Hexagon-orbital merge (6 orbiting hexagons)
   */
  createHexagonOrbitalMerge(fusionGroup, meshes, context, intensity) {
    const baseColor = this.getSemanticColor(context);
    
    for (let i = 0; i < 6; i++) {
      const hexGeom = new THREE.ConeGeometry(0.05, 0.15, 6, 1);
      const hexMat = this.getMaterial(baseColor);
      const hex = new THREE.Mesh(hexGeom, hexMat);
      
      // Orbit around center
      const angle = (i / 6) * Math.PI * 2;
      hex.position.x = Math.cos(angle) * 0.2;
      hex.position.z = Math.sin(angle) * 0.2;
      hex.rotation.y = angle;
      
      hex.userData.orbitAngle = angle;
      hex.userData.orbitRadius = 0.2;
      hex.userData.orbitSpeed = 0.2;
      hex.userData.fusionType = 'hexOrbit';
      
      fusionGroup.add(hex);
      meshes.push(hex);
    }
  }
  
  /**
   * FORM 5: Rotating cross-planes (2 orthogonal planes)
   */
  createRotatingCrossPlanes(fusionGroup, meshes, context, intensity) {
    const baseColor = this.getSemanticColor(context);
    
    // Plane 1 - X/Z axis
    const plane1Geom = new THREE.PlaneGeometry(0.3, 0.08, 2, 2);
    const plane1Mat = this.getMaterial(baseColor);
    const plane1 = new THREE.Mesh(plane1Geom, plane1Mat);
    plane1.rotation.y = 0;
    plane1.userData.rotationSpeed = 0.25;
    plane1.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
    plane1.userData.fusionType = 'crossPlane1';
    fusionGroup.add(plane1);
    meshes.push(plane1);
    
    // Plane 2 - X/Y axis (perpendicular)
    const plane2Geom = new THREE.PlaneGeometry(0.3, 0.08, 2, 2);
    const plane2Mat = this.getMaterial(baseColor);
    const plane2 = new THREE.Mesh(plane2Geom, plane2Mat);
    plane2.rotation.x = Math.PI / 2;
    plane2.userData.rotationSpeed = 0.25;
    plane2.userData.rotationAxis = new THREE.Vector3(1, 0, 0);
    plane2.userData.fusionType = 'crossPlane2';
    fusionGroup.add(plane2);
    meshes.push(plane2);
  }
  
  /**
   * Get semantic color based on context
   */
  getSemanticColor(context) {
    const meaningType = context.meaningType || context.stateType || context.type || 'neutral';
    const signals = this._resolveFusionSignals(meaningType, context.parameters || {}, context);

    if (signals.corruption > 0.65) return this.colors.conflict;
    if (signals.loadPressure > 0.7) return this.colors.stressed;
    if (signals.synergy > 0.7 && signals.harmony > 0.65) return this.colors.focused;
    if (signals.harmony > 0.7 && signals.stability > 0.6) return this.colors.calm;
    if (signals.glyphTier >= 3 || signals.glyphEmotion > 0.65) return this.colors.leader;

    return this.colors.exploring;
  }
  
  /**
   * Update fusion animation
   */
  updateFusionAnimation(nodeId, meaningType, intensity, dt) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    const animState = this.animationState.get(nodeId);
    
    if (!fusionData || !animState) return;
    
    const { meshes, fusionGroup } = fusionData;
    
    // Update animation phases
    animState.rotPhase = (animState.rotPhase + dt * this.config.rotationSpeedMax) % (Math.PI * 2);
    animState.pulsePhase = (animState.pulsePhase + dt * this.config.pulseFrequency) % (Math.PI * 2);
    
    // Apply animations to meshes
    for (const mesh of meshes) {
      if (!mesh.userData) continue;
      
      // Rotation animation
      if (mesh.userData.rotationSpeed) {
        const axis = mesh.userData.rotationAxis || new THREE.Vector3(0, 1, 0);
        const rotAmount = mesh.userData.rotationSpeed * dt;
        mesh.rotateOnAxis(axis, rotAmount);
      }
      
      // Orbit animation (for hexagon form)
      if (mesh.userData.orbitSpeed) {
        mesh.userData.orbitAngle = (mesh.userData.orbitAngle + mesh.userData.orbitSpeed * dt) % (Math.PI * 2);
        mesh.position.x = Math.cos(mesh.userData.orbitAngle) * mesh.userData.orbitRadius;
        mesh.position.z = Math.sin(mesh.userData.orbitAngle) * mesh.userData.orbitRadius;
      }
      
      // Pulse animation (for lotus petals)
      if (mesh.userData.fusionType === 'lotusPetal') {
        const petalPhase = animState.pulsePhase + (mesh.userData.petalIndex / 6) * Math.PI * 2;
        const pulseScale = 1.0 + Math.sin(petalPhase) * this.config.scaleBreathAmount;
        mesh.scale.setScalar(pulseScale);
      }
    }
    
    // Global scale breathing on fusion group
    const globalPulse = 1.0 + Math.sin(animState.pulsePhase * 0.5) * this.config.scaleBreathAmount * 0.5;
    fusionGroup.scale.setScalar(globalPulse * intensity);
  }
  
  /**
   * Initialize fusion glyphs for all existing nodes
   */
  initializeForNodes(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeId = node.userData?.index !== undefined ? node.userData.index : i;
      this.createFusionGlyph(node, nodeId);
    }
  }

  resetForWorldSwitch({ scene = this.scene, worldRoot = this.worldRoot, semanticGlyphAI = this.semanticGlyphAI, semanticBus = this.semanticBus, aiNodes = null } = {}) {
    const semanticBusChanged = semanticBus !== this.semanticBus;
    if (semanticBusChanged) {
      this._unsubscribeSemanticEvents();
    }

    this.scene = scene;
    this.worldRoot = worldRoot;
    this.semanticGlyphAI = semanticGlyphAI;
    this.semanticBus = semanticBus;

    const attachRoot = this.worldRoot || this.scene;
    if (this.fusionContainer && attachRoot && this.fusionContainer.parent !== attachRoot) {
      this.fusionContainer.parent?.remove(this.fusionContainer);
      attachRoot.add(this.fusionContainer);
    }

    this.cleanup();

    const nodes = Array.isArray(aiNodes)
      ? aiNodes
      : (Array.isArray(aiNodes?.nodes) ? aiNodes.nodes : null);
    if (nodes) {
      this.initializeForNodes(nodes);
    }

    if (semanticBusChanged) {
      this.subscribeToEvents();
    }

    return this;
  }
  
  /**
   * Remove fusion glyph from a node
   */
  removeFusionGlyph(nodeId) {
    // Cancel any pending boost timeout for this node
    if (this._pendingTimeouts?.has(nodeId)) {
      clearTimeout(this._pendingTimeouts.get(nodeId));
      this._pendingTimeouts.delete(nodeId);
    }
    
    const fusionData = this.nodeFusionMap.get(nodeId);
    if (!fusionData) return;
    
    const { fusionGroup, meshes } = fusionData;
    
    // Remove all meshes
    for (const mesh of meshes) {
      fusionGroup.remove(mesh);
      mesh.material?.dispose?.();
    }
    meshes.length = 0;
    
    // Remove group from node
    if (fusionGroup.parent) {
      fusionGroup.parent.remove(fusionGroup);
    }
    
    // Clean up references
    this.nodeFusionMap.delete(nodeId);
    this.animationState.delete(nodeId);
    
    this.stats.activeFusionGlyphs--;
  }
  
  /**
   * Clean up all fusion glyphs
   */
  cleanup() {
    // Cancel all pending boost timeouts
    if (this._pendingTimeouts) {
      for (const timeoutId of this._pendingTimeouts.values()) {
        clearTimeout(timeoutId);
      }
      this._pendingTimeouts.clear();
    }
    
    const nodeIds = Array.from(this.nodeFusionMap.keys());
    for (const nodeId of nodeIds) {
      this.removeFusionGlyph(nodeId);
    }
    
    this.stats.activeFusionGlyphs = 0;
  }
  
  /**
   * Debug: Show fusion glyph status for a node
   */
  debugFusionGlyph(nodeIndex) {
    if (!this.debug) return;
    const fusionData = this.nodeFusionMap.get(nodeIndex);
    if (!fusionData) {
      console.log(`No fusion glyph for node ${nodeIndex}`);
      return;
    }
    
    const animState = this.animationState.get(nodeIndex);
    
    console.log(`\n=== FUSION GLYPH DEBUG: Node ${nodeIndex} ===`);
    console.log(`Meaning type: ${animState?.lastMeaningType || 'none'}`);
    console.log(`Intensity: ${(fusionData.intensity * 100).toFixed(1)}%`);
    console.log(`Mesh count: ${fusionData.meshes.length}`);
    console.log(`Fade phase: ${(animState?.fadePhase * 100).toFixed(1)}%`);
  }
  
  /**
   * Debug: Show overall fusion glyph statistics
   */
  debugFusionStats() {
    if (!this.debug) return;
    console.log('=== GLYPH FUSION OVERLAY 4.1 STATISTICS ===');
    console.log(`Total fusion glyphs created: ${this.stats.totalFusionGlyphs}`);
    console.log(`Active fusion glyphs: ${this.stats.activeFusionGlyphs}`);
    console.log(`Frame time: ${this.stats.frameTime.toFixed(2)}ms`);
    console.log(`Enabled: ${this.enabled}`);
    
    // Show fusion type distribution
    const typeDistribution = {};
    for (const animState of this.animationState.values()) {
      const type = animState.lastMeaningType || 'none';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    }
    console.log('Fusion type distribution:', typeDistribution);
  }
  
  /**
   * Trigger exploring state on a node (event-driven)
   */
  triggerExploringState(nodeId, timestamp) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    const animState = this.animationState.get(nodeId);
    
    if (!fusionData || !animState) return;
    
    // Update fusion form to exploring
    this.updateFusionForm(nodeId, 'exploring', { exploreAmount: 1.0 }, {});
    
    // Set fade target to fade in
    animState.currentFadeTarget = 0.8;
    animState.lastMeaningType = 'exploring';
  }
  
  /**
   * Update fusion form based on new state (event-driven)
   */
  updateFusionForm(nodeId, meaningType, parameters, context) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    const animState = this.animationState.get(nodeId);
    
    if (!fusionData || !animState) return;
    
    // Store meaning type for reference
    animState.lastMeaningType = meaningType;
    fusionData.meaningType = meaningType;
    fusionData.parameters = parameters;
    
    // Compute fusion intensity
    const intensity = this.computeFusionIntensity(meaningType, parameters, context);
    animState.currentFadeTarget = intensity;
    fusionData.intensity = intensity;
    fusionData.context = context;
    
    // Update/create fusion meshes if intensity > 0.1
    if (intensity > 0.1) {
      this.updateFusionMeshes(nodeId, meaningType, intensity, { ...context, meaningType, parameters }, 0.016);
    }
  }
  
  /**
   * Trigger cluster-sync fusion form (event-driven)
   */
  triggerClusterSyncForm(nodeId, syncAmount) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    const animState = this.animationState.get(nodeId);
    
    if (!fusionData || !animState) return;
    
    // Update fusion form to cluster-sync
    this.updateFusionForm(nodeId, 'cluster-sync', { syncAmount: syncAmount }, {});
  }
  
  /**
   * Trigger ascended fusion form (event-driven)
   */
  triggerAscendedForm(nodeId) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    const animState = this.animationState.get(nodeId);
    
    if (!fusionData || !animState) return;
    
    // Update fusion form to ascended (same as focused)
    this.updateFusionForm(nodeId, 'focused', { focusStrength: 1.0, glyphEmotion: 1.0, glyphTier: 3, glyphStability: 1.0 }, {});
  }
  
  /**
   * Trigger ritual fusion form (event-driven)
   */
  triggerRitualForm(nodeId, state) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    const animState = this.animationState.get(nodeId);
    
    if (!fusionData || !animState) return;
    
    // Ritual state maps to stressed/conflict
    const meaningType = state === 'active' ? 'stressed' : 'conflict';
    this.updateFusionForm(nodeId, meaningType, { stressLevel: 0.8, conflictStrength: 0.8, glyphEmotion: 0.8, glyphTier: 2, glyphStability: 0.3 }, {});
  }
  
  /**
   * Fade out ritual fusion form (event-driven)
   */
  fadeOutRitualForm(nodeId, duration) {
    this.updateFusionFade(nodeId, 0, duration);
  }
  
  /**
   * Boost fusion glyph intensity on selected node (event-driven)
   */
  boostFusionIntensity(nodeId, boostFactor, duration) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    const animState = this.animationState.get(nodeId);
    
    if (!fusionData || !animState) return;
    
    // Cancel any existing pending timeout for this node
    if (this._pendingTimeouts?.has(nodeId)) {
      clearTimeout(this._pendingTimeouts.get(nodeId));
    }
    
    // Temporarily boost fade phase
    const originalTarget = animState.currentFadeTarget;
    animState.currentFadeTarget = Math.min(1, originalTarget * boostFactor);
    
    // Restore after duration (tracked for cancellation)
    const timeoutId = setTimeout(() => {
      this._pendingTimeouts?.delete(nodeId);
      if (this.animationState.has(nodeId)) {
        const currentAnimState = this.animationState.get(nodeId);
        currentAnimState.currentFadeTarget = originalTarget;
      }
    }, duration * 1000);
    
    if (!this._pendingTimeouts) this._pendingTimeouts = new Map();
    this._pendingTimeouts.set(nodeId, timeoutId);
  }
  
  /**
   * Restore fusion glyph intensity (event-driven)
   */
  restoreFusionIntensity(nodeId) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    const animState = this.animationState.get(nodeId);
    
    if (!fusionData || !animState) return;
    
    // Restore to computed intensity based on meaning type
    const intensity = this.computeFusionIntensity(
      animState.lastMeaningType,
      fusionData.parameters || {},
      {}
    );
    animState.currentFadeTarget = intensity;
  }
  
  /**
   * Update fusion meshes for specific form
   */
  updateFusionMeshes(nodeId, meaningType, intensity, context, dt) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    const animState = this.animationState.get(nodeId);
    
    if (!fusionData || !animState || !fusionData.fusionGroup) return;
    
    // Get or create fusion form meshes
    this.createFusionFormMeshes(nodeId, meaningType, intensity, context);
  }
  
  /**
   * Create fusion form meshes
   */
  createFusionFormMeshes(nodeId, meaningType, intensity, context) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    if (!fusionData || !fusionData.fusionGroup) return;
    
    const { fusionGroup } = fusionData;
    
    // Clear existing meshes
    for (const mesh of fusionData.meshes) {
      fusionGroup.remove(mesh);
      mesh.material?.dispose?.();
      mesh.visible = false;
    }
    fusionData.meshes = [];
    
    // Create form based on meaning type
    switch (meaningType) {
      case 'focused':
        this.createFocusedForm(fusionGroup, fusionData.meshes, intensity, nodeId);
        break;
      case 'stressed':
        this.createStressedForm(fusionGroup, fusionData.meshes, intensity, nodeId);
        break;
      case 'calm':
        this.createCalmForm(fusionGroup, fusionData.meshes, intensity, nodeId);
        break;
      case 'exploring':
        this.createExploringForm(fusionGroup, fusionData.meshes, intensity, nodeId);
        break;
      case 'leader':
        this.createLeaderForm(fusionGroup, fusionData.meshes, intensity, nodeId);
        break;
      case 'conflict':
        this.createConflictForm(fusionGroup, fusionData.meshes, intensity, nodeId);
        break;
      case 'cluster-sync':
        this.createClusterSyncForm(fusionGroup, fusionData.meshes, intensity, nodeId);
        break;
      default:
        this.createNeutralForm(fusionGroup, fusionData.meshes, intensity, nodeId);
    }
  }
  
  /**
   * Create focused form (dual-rings)
   */
  createFocusedForm(fusionGroup, meshes, intensity, nodeId) {
    const ring1 = this.getReusableMesh('rings', this.colors.focused);
    const ring2 = this.getReusableMesh('rings', this.colors.focused);
    
    if (ring1) {
      ring1.rotation.x = Math.PI / 2;
      ring1.visible = true;
      fusionGroup.add(ring1);
      meshes.push(ring1);
      ring1.userData.rotationAxis = 'z';
    }
    
    if (ring2) {
      ring2.rotation.x = Math.PI / 2;
      ring2.rotation.y = Math.PI / 4;
      ring2.visible = true;
      fusionGroup.add(ring2);
      meshes.push(ring2);
      ring2.userData.rotationAxis = 'z';
    }
  }
  
  /**
   * Create stressed form (tri-fold)
   */
  createStressedForm(fusionGroup, meshes, intensity, nodeId) {
    const plane1 = this.getReusableMesh('planes', this.colors.stressed);
    const plane2 = this.getReusableMesh('planes', this.colors.stressed);
    const plane3 = this.getReusableMesh('planes', this.colors.stressed);
    
    [plane1, plane2, plane3].forEach((plane, i) => {
      if (plane) {
        const angle = (i / 3) * Math.PI * 2;
        plane.rotation.x = Math.sin(angle) * 0.5;
        plane.rotation.y = Math.cos(angle) * 0.5;
        plane.visible = true;
        fusionGroup.add(plane);
        meshes.push(plane);
        plane.userData.rotationAxis = 'z';
      }
    });
  }
  
  /**
   * Create calm form (lotus)
   */
  createCalmForm(fusionGroup, meshes, intensity, nodeId) {
    for (let i = 0; i < 6; i++) {
      const petal = this.getReusableMesh('petals', this.colors.calm);
      if (petal) {
        const angle = (i / 6) * Math.PI * 2;
        petal.position.x = Math.cos(angle) * 0.1;
        petal.position.z = Math.sin(angle) * 0.1;
        petal.rotation.y = angle;
        petal.visible = true;
        fusionGroup.add(petal);
        meshes.push(petal);
        petal.userData.rotationAxis = 'y';
      }
    }
  }
  
  /**
   * Create exploring form (orbiting dots)
   */
  createExploringForm(fusionGroup, meshes, intensity, nodeId) {
    for (let i = 0; i < 4; i++) {
      const hex = this.getReusableMesh('hexagons', this.colors.exploring);
      if (hex) {
        const angle = (i / 4) * Math.PI * 2;
        hex.position.x = Math.cos(angle) * 0.12;
        hex.position.z = Math.sin(angle) * 0.12;
        hex.rotation.y = angle;
        hex.visible = true;
        fusionGroup.add(hex);
        meshes.push(hex);
        hex.userData.rotationAxis = 'y';
      }
    }
  }
  
  /**
   * Create leader form (crown halo)
   */
  createLeaderForm(fusionGroup, meshes, intensity, nodeId) {
    for (let i = 0; i < 4; i++) {
      const ring = this.getReusableMesh('rings', this.colors.leader);
      if (ring) {
        const angle = (i / 4) * Math.PI * 2;
        ring.rotation.x = Math.PI / 2;
        ring.position.x = Math.cos(angle) * 0.08;
        ring.position.z = Math.sin(angle) * 0.08;
        ring.visible = true;
        fusionGroup.add(ring);
        meshes.push(ring);
        ring.userData.rotationAxis = 'y';
      }
    }
  }
  
  /**
   * Create conflict form (cross-planes)
   */
  createConflictForm(fusionGroup, meshes, intensity, nodeId) {
    const plane1 = this.getReusableMesh('planes', this.colors.conflict);
    const plane2 = this.getReusableMesh('planes', this.colors.conflict);
    
    if (plane1) {
      plane1.rotation.y = Math.PI / 4;
      plane1.visible = true;
      fusionGroup.add(plane1);
      meshes.push(plane1);
      plane1.userData.rotationAxis = 'z';
    }
    
    if (plane2) {
      plane2.rotation.y = -Math.PI / 4;
      plane2.visible = true;
      fusionGroup.add(plane2);
      meshes.push(plane2);
      plane2.userData.rotationAxis = 'z';
    }
  }
  
  /**
   * Create cluster-sync form (hexagon-orbital)
   */
  createClusterSyncForm(fusionGroup, meshes, intensity, nodeId) {
    for (let i = 0; i < 4; i++) {
      const hex = this.getReusableMesh('hexagons', this.colors['cluster-sync']);
      if (hex) {
        const angle = (i / 4) * Math.PI * 2;
        hex.position.x = Math.cos(angle) * 0.15;
        hex.position.z = Math.sin(angle) * 0.15;
        hex.rotation.y = angle;
        hex.visible = true;
        fusionGroup.add(hex);
        meshes.push(hex);
        hex.userData.rotationAxis = 'y';
      }
    }
  }
  
  /**
   * Create neutral form
   */
  createNeutralForm(fusionGroup, intensity, nodeId) {
    // No special form - just empty
  }
  
  /**
   * Get reusable mesh from pool
   */
  getReusableMesh(poolType, color) {
    const pool = this.geometryPools[poolType];
    if (!pool || pool.length === 0) return null;
    
    const cursor = this._poolCursor[poolType] ?? 0;
    const geometry = pool[cursor % pool.length];
    this._poolCursor[poolType] = cursor + 1;

    const mesh = new THREE.Mesh(geometry, this.getMaterial(color));
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_NODE_MULTIFUSION);
    return mesh;
  }
  
  /**
   * Update fusion fade (event-driven)
   */
  updateFusionFade(nodeId, targetIntensity, dt) {
    const animState = this.animationState.get(nodeId);
    if (!animState) return;
    
    animState.currentFadeTarget = targetIntensity;
  }
  
  /**
   * Enable fusion glyph updates
   */
  enable() {
    this.enabled = true;
  }
  
  /**
   * Disable fusion glyph updates
   */
  disable() {
    this.enabled = false;
  }
  
  /**
   * Full resource cleanup
   */
  dispose() {
    this._unsubscribeSemanticEvents();
    this.cleanup();
    
    // Dispose materials
    for (const material of this.materialPools.values()) {
      material.dispose();
    }

    const disposedGeometries = new Set();
    for (const pool of Object.values(this.geometryPools)) {
      for (const geometry of pool) {
        if (geometry && !disposedGeometries.has(geometry)) {
          disposedGeometries.add(geometry);
          geometry.dispose();
        }
      }
    }
    
    // Remove master container
    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this.root?.clear?.();
    
    this.nodeFusionMap.clear();
    this.animationState.clear();
    this.materialPools.clear();
    this._pendingTimeouts?.clear();
  }
}
